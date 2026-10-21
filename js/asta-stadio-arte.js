/* =========================================================
   L'ASTA, scena 2: LO STADIO del fantacalcio, di sera.
   - SGAstaArte.stadio()     sfondo a tutto schermo (viewBox 400×800, "slice": si taglia ai lati, le cose importanti stanno tra x 40 e 360)
   - SGAstaArte.seggiolino() il seggiolino di plastica blu visto di fronte, nel sistema dell'avatar (200×264): va DIETRO l'avatar seduto
   - SGAstaArte.campo(rap)   mezzo campo visto dall'alto (300×300, si stira: è pensato per un rettangolo con larghezza / altezza = rap, di partenza 1,44)
   Solo stringhe SVG: niente filtri, niente testo, niente Math.random (le trame usano un caso fisso col seme). Id col prefisso "ast".
   ========================================================= */
(function () {
  "use strict";
  var A = window.SGAstaArte = window.SGAstaArte || {};
  var LINEA = "#2a2236", pronti = {};   // il contorno caldo e scuro; i disegni già fatti (vengono sempre uguali, si fanno una volta)

  // ---------- attrezzi ----------
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function n1(v) { return String(Math.round(v * 10) / 10); }
  function n2(v) { return String(Math.round(v * 100) / 100); }
  function q(x, y) { return n1(x) + "," + n1(y); }
  function poli(a, chiudi) { return "M" + a.map(function (c) { return q(c[0], c[1]); }).join(" L") + (chiudi ? " Z" : ""); }
  function fermate(a) { return a.map(function (f) { return "<stop offset='" + f[0] + "' stop-color='" + f[1] + "'" + (f[2] != null ? " stop-opacity='" + f[2] + "'" : "") + "/>"; }).join(""); }
  function lin(id, x1, y1, x2, y2, a, extra) { return "<linearGradient id='" + id + "' x1='" + x1 + "' y1='" + y1 + "' x2='" + x2 + "' y2='" + y2 + "'" + (extra || "") + ">" + fermate(a) + "</linearGradient>"; }
  function rad(id, cx, cy, r, a, extra) { return "<radialGradient id='" + id + "' cx='" + cx + "' cy='" + cy + "' r='" + r + "'" + (extra || "") + ">" + fermate(a) + "</radialGradient>"; }
  var US = " gradientUnits='userSpaceOnUse'";
  function usa(id, tr) { return "<use href='#" + id + "' xlink:href='#" + id + "' transform='" + tr + "'/>"; }
  function svg(vb, extra, corpo) { return "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='" + vb + "'" + extra + ">" + corpo + "</svg>"; }

  // =========================================================
  //  IL SEGGIOLINO (sistema dell'avatar 200×264: seduta a y 198, piedi a y 250). Gli stessi tracciati servono
  //  per quello grande dietro all'avatar e per quelli vuoti della tribuna (più piccoli, più scuri, meno dettagli).
  // =========================================================
  var SCH = "M58,193 L55,141 C54.6,128 60.5,121.6 72.5,120.6 Q100,114.6 127.5,120.6 C139.5,121.6 145.4,128 145,141 L142,193 Z";   // lo schienale a guscio
  var SCH_IN = "M62.5,186 L60.2,142 C60,132.6 64.6,127.4 73.6,126.6 Q100,121.2 126.4,126.6 C135.4,127.4 140,132.6 139.8,142 L137.5,186";   // il bordino rialzato
  var LUCE = "M64.6,137 C64.6,131.2 67.6,128.2 73.2,127.6 L80.5,127.1 C75.4,130.3 72.4,135.2 72.2,141.5 L72.8,183 L66.2,185 Z";   // il riflesso lucido
  var SED = "M50,201 C50,193.5 55.5,189 63.5,188.6 L136.5,188.6 C144.5,189 150,193.5 150,201 L150,204.5 C150,209.6 146,212.4 139.5,212.4 L60.5,212.4 C54,212.4 50,209.6 50,204.5 Z";   // la seduta col bordo davanti
  var SED_SU = "M51,200.6 C51,193.8 56,189.6 63.6,189.2 L136.4,189.2 C144,189.6 149,193.8 149,200.6 C128,204.4 72,204.4 51,200.6 Z";   // il piano, visto un poco dall'alto
  var STAFFE = "M63,210 L72.5,210 L70.4,246 L60.6,246 Z M127.5,210 L137,210 L139.4,246 L129.6,246 Z";   // le due staffe d'acciaio
  function seggiolinoArte(p, c, w, ricco) {   // p prefisso, c colori [chiaro, medio, scuro, piano], w spessore del contorno, ricco = tutti i dettagli
    var d = lin(p + "a", 0, 0, .8, 1, [[0, c[0]], [.42, c[1]], [1, c[2]]]) +
      lin(p + "b", 0, 0, 0, 1, [[0, c[1]], [1, c[2]]]) +
      lin(p + "c", 0, 0, 1, .5, [[0, c[3]], [1, c[1]]]) +
      lin(p + "d", 0, 0, 1, 0, [[0, "#dfe4ec"], [.4, "#9aa3b1"], [1, "#4e5664"]]) +
      lin(p + "e", 0, 0, 0, 1, [[0, "#fff", ricco ? .75 : .5], [1, "#fff", 0]]) +
      rad(p + "f", .5, .38, .68, [[.55, c[2], 0], [1, c[2], .5]]) +
      lin(p + "g", 0, 0, 0, 1, [[0, c[2], 0], [1, c[2], .6]]) +
      "<clipPath id='" + p + "h'><path d='" + SCH + "'/></clipPath>";
    var s = "<ellipse cx='100' cy='250.5' rx='56' ry='5.5' fill='#000' opacity='" + (ricco ? .15 : .24) + "'/>" +
      "<path d='" + STAFFE + "' fill='url(#" + p + "d)' stroke='" + LINEA + "' stroke-width='" + n1(w * .8) + "' stroke-linejoin='round'/>";
    if (ricco) s += "<path d='M54,251 V247.5 Q54,245.4 56.5,245.4 H74 Q76.5,245.4 76.5,247.5 V251 Z M123.5,251 V247.5 Q123.5,245.4 126,245.4 H143.5 Q146,245.4 146,247.5 V251 Z' fill='#7d8695' stroke='" + LINEA + "' stroke-width='2' stroke-linejoin='round'/>" +
      "<path d='M58.5,248.4 h0 M72,248.4 h0 M128,248.4 h0 M141.5,248.4 h0' stroke='#e2e6ee' stroke-width='2.6' stroke-linecap='round'/>";   // le piastre avvitate a terra
    s += "<path d='" + SCH + "' fill='url(#" + p + "a)' stroke='" + LINEA + "' stroke-width='" + w + "' stroke-linejoin='round'/>" +
      "<g clip-path='url(#" + p + "h)'><rect x='50' y='112' width='100' height='84' fill='url(#" + p + "f)'/><rect x='50' y='172' width='100' height='22' fill='url(#" + p + "g)'/><path d='" + LUCE + "' fill='url(#" + p + "e)'/></g>" +
      "<path d='" + SCH_IN + "' fill='none' stroke='#fff' stroke-width='" + n1(w * .55) + "' stroke-linecap='round' opacity='.28'/>";
    if (ricco) s += "<ellipse cx='75' cy='126.4' rx='6' ry='2.1' fill='#fff' opacity='.6' transform='rotate(-7 75 126.4)'/>";   // il punto di luce in alto: si vede accanto alla testa
    s += "<path d='" + SED + "' fill='url(#" + p + "b)' stroke='" + LINEA + "' stroke-width='" + w + "' stroke-linejoin='round'/>" +
      "<path d='" + SED_SU + "' fill='url(#" + p + "c)'/>" +
      "<path d='M60,203 Q100,206.6 140,203' fill='none' stroke='#fff' stroke-width='" + n1(w * .5) + "' stroke-linecap='round' opacity='.35'/>";
    if (ricco) s += "<path d='M55.5,197 Q58.5,191.6 68,191.2 M134,191.4 Q141,191.8 144,195' fill='none' stroke='#fff' stroke-width='1.8' stroke-linecap='round' opacity='.45'/>";   // il lucido sul bordo della seduta, ai lati del sedere
    return { d: d, s: s };
  }
  A.seggiolino = function () {
    if (pronti.seg) return pronti.seg;
    var a = seggiolinoArte("astG", ["#64a3ff", "#2766dc", "#143b93", "#86b9ff"], 2.6, true);
    return (pronti.seg = svg("0 0 200 264", "", "<defs>" + a.d + "</defs>" + a.s));
  };

  // =========================================================
  //  LO STADIO (400×800). Dall'alto: il cielo con le stelle e le due torri dei fari agli angoli; la tribuna di fronte,
  //  lontana, che gira intorno al campo (le sue righe salgono ai lati), col tetto al centro, il pubblico all'ombra e il
  //  balcone col nastro luminoso; i piloni del maxischermo; la NOSTRA tribuna (cinque gradoni coi seggiolini vuoti);
  //  il parapetto, i cartelloni luminosi senza scritte, l'erba con le strisce di taglio in prospettiva.
  // =========================================================
  // la nostra tribuna: per ogni fila (dietro → davanti) dove poggiano i piedi (y), la scala del sistema avatar (k),
  // la distanza tra due seggiolini (passo) e lo sfasamento (le file dispari sono spostate di mezzo posto, come negli stadi veri).
  // Un seggiolino della fila f sta a x = 200 + (n + sfasa) × passo, con n intero; l'avatar seduto lì va disegnato con la stessa k.
  var K = [.25, .275, .3, .33, .36], F = [312, 345, 381, 420, 461];
  A.STADIO_FILE = K.map(function (k, j) { return { y: F[j], k: k, passo: Math.round(112 * k * 100) / 100, sfasa: j % 2 ? .5 : 0 }; });

  function uY(x, ye, yc) { var t = x / 400; return ye + 4 * t * (1 - t) * (yc - ye); }   // la tribuna di fronte gira intorno: ai lati (ye) sale, al centro (yc) è più bassa
  function uQ(ye, yc, ritorno) { var c = n1(2 * yc - ye); return ritorno ? " L400," + n1(ye) + " Q200," + c + " 0," + n1(ye) + " Z" : "M0," + n1(ye) + " Q200," + c + " 400," + n1(ye); }
  function uBanda(ye1, yc1, ye2, yc2) { return uQ(ye1, yc1) + uQ(ye2, yc2, true); }
  function uPunti(x0, x1, ye, yc, n) { var a = [], i, x; for (i = 0; i <= n; i++) { x = x0 + (x1 - x0) * i / n; a.push([x, uY(x, ye, yc)]); } return a; }

  var MAGLIE = ["#e0393e", "#f1f1f1", "#2f6be0", "#1b1b25", "#f4c51c", "#2fa552", "#f27b1d", "#8546b5", "#3fb6e8"];
  var PELLI = ["#f1c9a6", "#c98d66", "#7a4d36"];
  function folla(id, seme, sc, ox, oy) {   // il pubblico lontano: un pezzetto 24×12 con due file sfalsate di teste e magliette, ripetuto (sc = quanto è vicino)
    var r = rnd(seme), W = 24, H = 12, corpi = {}, teste = {}, k, i, x, y, m, pe;
    for (k = 0; k < 2; k++) for (i = 0; i < 4; i++) {
      x = i * 6 + (k ? 3 : 0) + (r() - .5) * 1.6; y = (k ? 9 : 3) + (r() - .5) * 1.4;
      m = MAGLIE[Math.floor(r() * MAGLIE.length)]; pe = PELLI[Math.floor(r() * PELLI.length)];
      [-W, 0, W].forEach(function (dx) { [-H, 0].forEach(function (dy) {   // anche le copie che sbordano, così il disegno si ripete senza cuciture
        var cx = x + dx, cy = y + dy; if (cx < -3 || cx > W + 3 || cy < -4) return;
        corpi[m] = (corpi[m] || "") + "M" + q(cx, cy + 2.6) + "h0"; teste[pe] = (teste[pe] || "") + "M" + q(cx, cy - .5) + "h0";
      }); });
    }
    // un puntino = un tratto lungo zero con la punta tonda. Prima tutte le magliette, poi tutte le teste: chi sta dietro resta dietro
    var s = ""; for (m in corpi) s += "<path d='" + corpi[m] + "' stroke='" + m + "' stroke-width='5'/>"; for (pe in teste) s += "<path d='" + teste[pe] + "' stroke='" + pe + "' stroke-width='3.2'/>";
    return "<pattern id='" + id + "' width='" + W + "' height='" + H + "' patternUnits='userSpaceOnUse' patternTransform='translate(" + n1(ox) + "," + n1(oy) + ") scale(" + sc + ")'><rect width='24' height='12' fill='#20263a'/><g stroke-linecap='round'>" + s + "</g></pattern>";
  }
  function bandiera(p, n, px, py, v, colori, oriz, k) {   // una bandiera che sventola su un'asta: v = 1 verso destra, -1 verso sinistra; colori a strisce (orizzontali se oriz)
    k = k || 1;
    var L = 26 * k * v, h = 18 * k, X = function (t) { return px + L * t; }, ond = 4 * k;
    function onda(y0) { return " C" + q(X(.33), y0 - ond) + " " + q(X(.62), y0 + ond) + " " + q(X(1), y0 - 1); }
    function ondaR(y0) { return " C" + q(X(.62), y0 + ond) + " " + q(X(.33), y0 - ond) + " " + q(px, y0); }
    var forma = "M" + q(px, py) + onda(py) + " L" + q(X(1), py + h - 1) + ondaR(py + h) + " Z", s = "<clipPath id='" + p + "c" + n + "'><path d='" + forma + "'/></clipPath><g clip-path='url(#" + p + "c" + n + ")'>", i;
    if (oriz) for (i = 0; i < colori.length; i++) { var y0 = py + h * i / colori.length; s += "<path d='M" + q(px, y0) + onda(y0) + " L" + q(X(1), py + h + 4) + " L" + q(px, py + h + 4) + " Z' fill='" + colori[i] + "'/>"; }
    else for (i = 0; i < colori.length; i++) s += "<rect x='" + n1(Math.min(X(i / colori.length), X((i + 1) / colori.length))) + "' y='" + n1(py - 6) + "' width='" + n1(Math.abs(L) / colori.length + .3) + "' height='" + n1(h + 12) + "' fill='" + colori[i] + "'/>";
    s += "<rect x='" + n1(Math.min(px, X(1))) + "' y='" + n1(py - 6) + "' width='" + n1(Math.abs(L)) + "' height='" + n1(h + 12) + "' fill='url(#" + p + (v > 0 ? "pd" : "ps") + ")'/></g>";   // le pieghe dell'onda
    return "<path d='M" + q(px - v * 1.5 * k, py + 52 * k) + " L" + q(px, py - 3) + "' stroke='#c3c9d4' stroke-width='" + n1(1.3 * k) + "' stroke-linecap='round'/>" + s +
      "<path d='" + forma + "' fill='none' stroke='#0c0f1a' stroke-width='.8' stroke-linejoin='round' opacity='.7'/>";
  }
  function traliccio(cx) {   // la torre dei fari: un traliccio d'acciaio che si stringe verso l'alto (la base sparisce dietro la tribuna)
    var T = 62, L = function (y) { return cx - 5 - 5 * (y - T) / (122 - T); }, R = function (y) { return cx + 5 + 5 * (y - T) / (122 - T); }, g = "", y0, y1;   // T: dove finisce la testa dei fari
    for (y0 = T; y0 < 120; y0 += 10) { y1 = y0 + 10; g += "M" + q(L(y0), y0) + " L" + q(R(y1), y1) + " M" + q(R(y0), y0) + " L" + q(L(y1), y1) + " M" + q(L(y0), y0) + " H" + n1(R(y0)); }
    var gambe = "M" + q(L(T), T) + " L" + q(L(122), 122) + " M" + q(R(T), T) + " L" + q(R(122), 122);
    return "<path d='" + g + "' stroke='#1a2031' stroke-width='1.1' fill='none'/><path d='" + gambe + "' stroke='#121725' stroke-width='2.6' fill='none'/>" +
      "<path d='" + gambe + "' stroke='#7a88aa' stroke-width='.7' fill='none' opacity='.5' transform='translate(-.8,0)'/>";
  }
  function disegnoCartellone(p, i, x0) {   // la grafica di un cartellone a bordo campo: solo forme e luce, niente scritte né marchi
    var X = function (v) { return n1(x0 + v); }, s = "", k;
    if (i === 0) { s = "<ellipse cx='" + X(22) + "' cy='517.3' rx='20' ry='9' fill='#fff' opacity='.22'/>"; for (k = 0; k < 3; k++) s += "<path d='M" + X(44 + k * 10) + ",509.6 l7.4,7.7 l-7.4,7.7' fill='none' stroke='#fff' stroke-width='3' stroke-linejoin='round' stroke-linecap='round' opacity='" + (.95 - k * .25) + "'/>"; }
    if (i === 1) s = "<path d='M" + X(2) + ",521 C" + X(16) + ",507 " + X(30) + ",531 " + X(44) + ",516 S" + X(68) + ",506 " + X(80) + ",516' fill='none' stroke='#74f3ff' stroke-width='3.2' stroke-linecap='round'/>" +
      "<path d='M" + X(2) + ",525 C" + X(16) + ",513 " + X(30) + ",533 " + X(44) + ",521 S" + X(68) + ",512 " + X(80) + ",521' fill='none' stroke='#fff' stroke-width='1.1' stroke-linecap='round' opacity='.7'/>";
    if (i === 2) { for (k = 0; k < 9; k++) s += "M" + X(-14 + k * 11) + ",529.6 l10,-24.6 h5 l-10,24.6 Z "; s = "<g clip-path='url(#" + p + "k2)'><path d='" + s + "' fill='#fff' opacity='.24'/></g>"; }
    if (i === 3) { var pu = ["", "", ""]; for (k = 0; k < 11; k++) for (var rr = 0; rr < 4; rr++) pu[Math.min(2, Math.floor(k / 4))] += "M" + X(7 + k * 6.8 + (rr % 2) * 3.4) + "," + (508.5 + rr * 5.6) + " h0 ";
      s = "<path d='" + pu[0] + "' stroke='#ffe14d' stroke-width='3.6' stroke-linecap='round'/><path d='" + pu[1] + "' stroke='#ffe14d' stroke-width='2.6' stroke-linecap='round' opacity='.85'/><path d='" + pu[2] + "' stroke='#ffe14d' stroke-width='1.6' stroke-linecap='round' opacity='.7'/>"; }
    if (i === 4) s = "<path d='M" + X(8) + ",510.5 h40 M" + X(20) + ",515 h52 M" + X(4) + ",519.6 h34 M" + X(30) + ",524 h44 M" + X(12) + ",527.4 h22' stroke='#fff' stroke-width='1.8' stroke-linecap='round' opacity='.75'/>";
    return s;
  }

  A.stadio = function () {
    if (pronti.stadio) return pronti.stadio;
    var p = "astS", r = rnd(1926), d = "", s = "", i, j, x, y, a, b, c;
    // ---- le sfumature e i pezzi che si ripetono
    d += lin(p + "cie", 0, 0, 0, 250, [[0, "#02051a"], [.5, "#0a1440"], [1, "#1c2d6c"]], US) +
      lin(p + "fos", 0, 40, 0, 125, [[0, "#5068c0", 0], [1, "#7b90e0", .3]], US) +
      rad(p + "alo", .5, .5, .5, [[0, "#fffdf2", .8], [.07, "#fff3cf", .5], [.2, "#ffe3a0", .2], [.45, "#a8c4ff", .08], [1, "#8eaaff", 0]]) +
      rad(p + "lam", .4, .36, .64, [[0, "#ffffff"], [.5, "#fffbe6"], [1, "#ffd88a"]]) +
      lin(p + "fla", 0, 0, 1, 0, [[0, "#fff", 0], [.5, "#fff", .55], [1, "#fff", 0]]) +
      lin(p + "flv", 0, 0, 0, 1, [[0, "#fff", 0], [.5, "#fff", .4], [1, "#fff", 0]]) +
      lin(p + "omb", 0, 108, 0, 236, [[0, "#03050f", .88], [.5, "#03050f", .6], [1, "#03050f", .34]], US) +
      lin(p + "pd", 0, 0, 1, 0, [[0, "#000", 0], [.28, "#000", .28], [.52, "#fff", .18], [.78, "#000", .22], [1, "#000", .05]]) +
      lin(p + "ps", 1, 0, 0, 0, [[0, "#000", 0], [.28, "#000", .28], [.52, "#fff", .18], [.78, "#000", .22], [1, "#000", .05]]) +
      lin(p + "nas", 0, 0, 132, 0, [[0, "#1fd5ff"], [.3, "#5b6bff"], [.55, "#c13cff"], [.8, "#ff4d9d"], [1, "#1fd5ff"]], US + " spreadMethod='repeat'") +
      lin(p + "nsu", 0, 0, 0, 1, [[0, "#9b7bff", 0], [1, "#9b7bff", .3]]) +
      lin(p + "ngi", 0, 0, 0, 1, [[0, "#7f9bff", .28], [1, "#7f9bff", 0]]) +
      "<pattern id='" + p + "led' width='2.5' height='2.5' patternUnits='userSpaceOnUse'><path d='M0,0 H2.5 M0,0 V2.5' stroke='#000' stroke-width='.6' opacity='.4'/></pattern>" +
      lin(p + "fas", 0, 0, 0, 1, [[0, "#ffe9b8", .16], [1, "#ffe9b8", 0]]) +
      lin(p + "acc", 0, 0, 1, 0, [[0, "#9aa5bd"], [.35, "#5a6580"], [1, "#232a3b"]]) +
      lin(p + "alz", 0, 0, 0, 1, [[0, "#596172"], [1, "#363c4a"]]) +
      lin(p + "ped", 0, 0, 0, 1, [[0, "#7c8494"], [1, "#a3abb9"]]) +
      lin(p + "omt", 0, 252, 0, 372, [[0, "#02040d", .66], [1, "#02040d", 0]], US) +
      lin(p + "par", 0, 467, 0, 489, [[0, "#2b3659"], [1, "#121831"]], US) +
      lin(p + "erb", 0, 531, 0, 800, [[0, "#e9ffc4", .1], [.3, "#0b2412", 0], [1, "#04100a", .5]], US) +
      rad(p + "vig", .5, .5, .74, [[.58, "#02030a", 0], [1, "#02030a", .66]]) +
      lin(p + "bag", 0, 0, 0, 1, [[0, "#ffeedd", .2], [1, "#ffeedd", 0]]) +
      "<clipPath id='" + p + "k2'><rect x='160.6' y='505' width='78.8' height='24.6'/></clipPath>";
    a = ""; b = "";
    for (i = 0; i < 10; i++) { a += "M" + n1(r() * 9) + "," + n1(r() * 7) + " v1.5 "; b += "M" + n1(r() * 9) + "," + n1(r() * 7) + " v1.5 "; }
    d += "<pattern id='" + p + "ert' width='9' height='7' patternUnits='userSpaceOnUse'><path d='" + a + "' stroke='#d6f0a8' stroke-width='.6' opacity='.13'/><path d='" + b + "' stroke='#0a2a10' stroke-width='.7' opacity='.2'/></pattern>";
    var sA = seggiolinoArte(p + "A", ["#3a72d6", "#1b48a3", "#0d2763", "#5487dd"], 4.6, false);   // i seggiolini vuoti: un po' più scuri di quelli degli avatar
    d += sA.d + "<g id='" + p + "sa' transform='translate(-100,-250)'>" + sA.s + "</g>" +
      "<path id='" + p + "sb' d='" + SCH + " " + SED + "' transform='translate(-100,-250)' fill='#c4d3f0' opacity='.17'/>";   // velo chiaro: qualche seggiolino vecchio, sbiadito dal sole

    // ---- 1. il cielo di notte, le stelle, il chiarore dello stadio sull'orizzonte (sotto a tutto un fondo pieno: niente buchi tra un pezzo e l'altro)
    s += "<rect width='400' height='800' fill='#272d3b'/><rect width='400' height='250' fill='url(#" + p + "cie)'/>";
    var st = ["", "", "", "", "", ""];
    for (i = 0; i < 48; i++) st[Math.floor(r() * 3) * 2 + (r() < .25 ? 1 : 0)] += "M" + q(r() * 400, 2 + r() * 100) + " h0 ";
    st.forEach(function (t, k) { if (t) s += "<path d='" + t + "' stroke='#fff' stroke-width='" + (k % 2 ? 2 : 1.2) + "' stroke-linecap='round' opacity='" + [.35, .35, .6, .6, .9, .9][k] + "'/>"; });
    [[74, 8], [326, 12], [8, 96], [393, 86], [118, 5]].forEach(function (t) { s += "<path d='M" + (t[0] - 3.2) + "," + t[1] + " h6.4 M" + t[0] + "," + (t[1] - 3.2) + " v6.4' stroke='#fff' stroke-width='.5' opacity='.55'/><circle cx='" + t[0] + "' cy='" + t[1] + "' r='.9' fill='#fff'/>"; });
    s += "<rect y='40' width='400' height='85' fill='url(#" + p + "fos)'/>";
    s += traliccio(32) + traliccio(368);

    // ---- 2. la tribuna di fronte: il pubblico in tre fasce (più grande verso di noi), all'ombra
    function uu(u) { return [108 + 118 * u, 126 + 108 * u]; }   // dal bordo in alto (u 0) al balcone (u 1): ai lati, al centro
    var fasce = [0, .3, .63, 1], scala = [.56, .7, .88];
    for (i = 0; i < 3; i++) { a = uu(fasce[i]); b = uu(fasce[i + 1]); d += folla(p + "f" + i, 31 + i * 17, scala[i], r() * 24, a[1]); s += "<path d='" + uBanda(a[0], a[1], b[0], b[1]) + "' fill='url(#" + p + "f" + i + ")'/>"; }
    [[30, 25], [370, 375]].forEach(function (c2) {   // le scalette dei settori ai lati
      var t0 = uY(c2[0], 108, 126), t1 = uY(c2[1], 226, 234), g = "", f;
      s += "<path d='M" + q(c2[0] - 3, t0) + " L" + q(c2[0] + 3, t0) + " L" + q(c2[1] + 3.6, t1) + " L" + q(c2[1] - 3.6, t1) + " Z' fill='#3d4558'/>";
      for (j = 1; j < 24; j++) { f = j / 24; g += "M" + q(c2[0] + (c2[1] - c2[0]) * f - 3 - .6 * f, t0 + (t1 - t0) * f) + " h" + n1(6 + 1.2 * f) + " "; }
      s += "<path d='" + g + "' stroke='#8d97ad' stroke-width='.6' opacity='.6'/>";
    });
    s += "<path d='" + uBanda(108, 126, 226, 234) + "' fill='url(#" + p + "omb)'/>";
    s += bandiera(p, 0, 44, 146, -1, ["#1f9a4c", "#f2f2f2", "#d42f35"]) + bandiera(p, 1, 356, 150, 1, ["#1f55d6", "#f2f2f2"], true) +
      bandiera(p, 2, 12, 186, 1, ["#c8232c", "#14141a", "#c8232c", "#14141a"], false, .72) + bandiera(p, 3, 388, 182, -1, ["#f6c21a", "#b3122e"], true, .72);
    b = "";
    for (i = 0; i < 14; i++) { x = i < 7 ? 3 + r() * 50 : 347 + r() * 50; a = uu(.12 + r() * .82); b += "M" + q(x, uY(x, a[0], a[1])) + "h0"; }   // le lucine dei telefoni accesi
    s += "<path d='" + b + "' stroke='#d6e6ff' stroke-width='6' stroke-linecap='round' opacity='.16'/><path d='" + b + "' stroke='#fff' stroke-width='1.6' stroke-linecap='round'/>";
    s += "<path d='" + uBanda(103, 121, 109, 127) + "' fill='#1b2133'/><path d='" + uQ(103, 121) + "' fill='none' stroke='#59658a' stroke-width='.9' opacity='.7'/>";   // il bordo in alto della tribuna

    // ---- 3. il tetto (solo al centro): la trave reticolare controluce, il bordo coi faretti, il sotto in ombra
    var t0 = uPunti(62, 338, 74.2, 91, 12), t1 = uPunti(62, 338, 83.2, 100, 12), t2 = uPunti(62, 338, 108, 126, 12);
    s += "<path d='" + poli(t1.concat(t2.slice().reverse()), 1) + "' fill='#090d1b'/>";
    a = ""; for (x = 72; x <= 330; x += 21.5) { var xb = 200 + (x - 200) * .9; a += "M" + q(x, uY(x, 83.2, 100)) + " L" + q(xb, uY(xb, 108, 126)) + " "; }
    s += "<path d='" + a + "' stroke='#1c2440' stroke-width='1.1'/>";
    var su = uPunti(66, 334, 62.5, 79.5, 16), giu = uPunti(66, 334, 74.2, 91, 16); a = poli(su);
    for (i = 0; i < su.length - 1; i++) a += " M" + q(giu[i][0], giu[i][1]) + " L" + q(su[i + 1][0], su[i + 1][1]) + " L" + q(giu[i + 1][0], giu[i + 1][1]);
    s += "<path d='" + a + "' stroke='#0c1124' stroke-width='1.4' fill='none' stroke-linejoin='round'/>";
    s += "<path d='" + poli(t0.concat(t1.slice().reverse()), 1) + "' fill='#151b2f' stroke='#0a0e1c' stroke-width='1'/><path d='" + poli(t1) + "' fill='none' stroke='#9fb0e0' stroke-width='.8' opacity='.45'/>";
    a = ""; for (x = 80; x <= 320; x += 30) a += "M" + q(x, uY(x, 83.2, 100) + 2) + "h0";
    s += "<path d='" + a + "' stroke='#ffe7a8' stroke-width='9' stroke-linecap='round' opacity='.2'/><path d='" + a + "' stroke='#fff6dc' stroke-width='2.4' stroke-linecap='round'/>";

    // ---- 4. il balcone della tribuna di fronte col nastro luminoso, il sotto in ombra coi faretti
    s += "<path d='" + uBanda(216, 225, 229.5, 237.5) + "' fill='url(#" + p + "nsu)'/>" +
      "<path d='" + uBanda(226, 234, 246, 252) + "' fill='#11172a'/>" +
      "<path d='" + uBanda(229.5, 237.5, 242.5, 248.5) + "' fill='url(#" + p + "nas)'/>" +
      "<path d='" + uBanda(229.5, 237.5, 242.5, 248.5) + "' fill='url(#" + p + "led)'/>" +
      "<path d='" + uQ(230.3, 238.3) + "' fill='none' stroke='#fff' stroke-width='.8' opacity='.35'/>" +
      "<path d='" + uQ(225.6, 233.6) + "' fill='none' stroke='#a7b3cc' stroke-width='1.3' opacity='.8'/>";
    s += "<path d='" + uQ(246, 252) + " L400,272 L0,272 Z' fill='#090c18'/><path d='" + uBanda(246, 252, 258, 264) + "' fill='url(#" + p + "ngi)'/>";

    // ---- 5. la NOSTRA tribuna: il corridoio in alto con la ringhiera, i piloni del maxischermo, cinque gradoni, le scalette, i seggiolini
    s += "<rect y='270' width='400' height='12' fill='url(#" + p + "ped)'/>";
    a = ""; b = "";
    for (x = 22; x < 400; x += 44.5) { y = uY(x, 246, 252) + 3.2; a += "M" + q(x - 1.5, y) + " L" + q(x + 1.5, y) + " L" + q(x + 11, 282) + " L" + q(x - 11, 282) + " Z "; b += "M" + q(x, y) + "h0"; }   // i faretti sotto il balcone
    s += "<path d='" + a + "' fill='url(#" + p + "fas)'/><path d='" + b + "' stroke='#ffeec4' stroke-width='2.4' stroke-linecap='round'/>";
    a = "M0,263.5 H400 M0,267.4 H400"; for (x = 6; x < 400; x += 24) a += " M" + x + ",262 V270";
    s += "<path d='" + a + "' stroke='#8f9bb4' stroke-width='1' opacity='.55'/>";
    [122, 278].forEach(function (cx) {   // i due piloni d'acciaio che reggono il maxischermo
      var g = ""; for (y = 236; y < 276; y += 8) g += "M" + n1(cx - 5) + "," + y + " L" + n1(cx + 5) + "," + (y + 8) + " M" + n1(cx + 5) + "," + y + " L" + n1(cx - 5) + "," + (y + 8) + " ";
      s += "<path d='" + g + "' stroke='#3a4459' stroke-width='1.2'/><rect x='" + (cx - 7.5) + "' y='232' width='4' height='46' fill='url(#" + p + "acc)'/><rect x='" + (cx + 3.5) + "' y='232' width='4' height='46' fill='url(#" + p + "acc)'/>" +
        "<path d='M" + (cx - 12) + ",280.5 L" + (cx - 10) + ",276.5 H" + (cx + 10) + " L" + (cx + 12) + ",280.5 Z' fill='#4b556c' stroke='#1a2030' stroke-width='.8'/>";
    });
    for (j = 0; j < 5; j++) {   // il gradone: l'alzata (in piedi, più scura) e la pedata (dove poggiano i seggiolini) col bordo che prende la luce
      var alto = j ? F[j - 1] + 1.5 : 282, tp = F[j] - 6 * K[j] / .36;
      s += "<rect y='" + n1(alto) + "' width='400' height='" + n1(tp - alto) + "' fill='url(#" + p + "alz)'/><rect y='" + n1(tp) + "' width='400' height='" + n1(F[j] + 1.5 - tp) + "' fill='url(#" + p + "ped)'/>" +
        "<path d='M0," + n1(F[j] + 1) + " H400' stroke='#d5dbe5' stroke-width='.8' opacity='.55'/>";
    }
    [[0, 18], [382, 400]].forEach(function (c2) {   // le scalette ai lati: due gradini per fila, col bordo giallo
      var t = "", g = "", w = c2[1] - c2[0], k, al, ba, y0, y1;
      for (j = 0; j < 5; j++) { al = j ? F[j - 1] + 1.5 : 282; ba = F[j] + 1.5;
        for (k = 0; k < 2; k++) { y0 = al + (ba - al) * k / 2; y1 = al + (ba - al) * (k + 1) / 2; t += "M" + c2[0] + "," + n1((y0 + y1) / 2) + " h" + w + " V" + n1(y1) + " h" + (-w) + " Z "; g += "M" + c2[0] + "," + n1(y1 - .7) + " h" + w + " "; } }
      s += "<rect x='" + c2[0] + "' y='282' width='" + w + "' height='" + n1(F[4] + 1.5 - 282) + "' fill='#41485a'/><path d='" + t + "' fill='#8a93a4'/><path d='" + g + "' stroke='#f3c331' stroke-width='1.4'/>";
    });
    for (j = 0; j < 5; j++) {   // i seggiolini vuoti, da dietro in avanti: ogni fila è un seggiolino ripetuto (una "carta da parati"), più qualcuno sbiadito
      var k = K[j], passo = 112 * k, sf = j % 2 ? .5 : 0, nMin = 99, nMax = -99, n, y0 = F[j] - 132 * k, h = 140 * k;
      for (n = -8; n <= 8; n++) if (Math.abs((n + sf) * passo) + 50 * k <= 184) { nMin = Math.min(nMin, n); nMax = Math.max(nMax, n); }
      d += "<pattern id='" + p + "r" + j + "' width='" + n2(passo) + "' height='" + n2(h) + "' x='" + n2(200 + (sf - .5) * passo) + "' y='" + n2(y0) + "' patternUnits='userSpaceOnUse'>" + usa(p + "sa", "translate(" + n2(passo / 2) + "," + n2(132 * k) + ") scale(" + k + ")") + "</pattern>";
      s += "<rect x='" + n2(200 + (nMin + sf - .5) * passo) + "' y='" + n2(y0) + "' width='" + n2((nMax - nMin + 1) * passo) + "' height='" + n2(h) + "' fill='url(#" + p + "r" + j + ")'/>";
      for (n = nMin; n <= nMax; n++) if (r() < .1) s += usa(p + "sb", "translate(" + n2(200 + (n + sf) * passo) + "," + F[j] + ") scale(" + k + ")");
    }
    s += "<rect y='252' width='400' height='120' fill='url(#" + p + "omt)'/>";   // l'ombra del balcone sulle file in alto

    // ---- 6. il parapetto, la pista, l'erba con le strisce in prospettiva e la linea laterale, i cartelloni luminosi
    s += "<rect y='462' width='400' height='5.5' fill='#a9b0bd'/><rect y='466.5' width='400' height='1.2' fill='#5a6170'/><rect y='467.5' width='400' height='21.5' fill='url(#" + p + "par)'/>";
    a = ""; for (x = 28; x < 400; x += 57) a += "M" + x + ",468 V489 ";
    s += "<path d='" + a + "' stroke='#0a0e1e' stroke-width='1' opacity='.7'/><path d='M0,468.4 H400' stroke='#8ea2d8' stroke-width='.8' opacity='.35'/>";
    s += "<rect y='489' width='400' height='44' fill='#141d18'/><rect y='489' width='400' height='3' fill='#000' opacity='.3'/>";   // la pista (anche dietro ai cartelloni, tra uno e l'altro)
    s += "<rect y='531' width='400' height='269' fill='#2b7634'/>";
    a = ""; c = (531 - 380) / 420;
    for (i = -5; i <= 4; i += 2) { var b0 = 200 + (i + .5) * 96, b1 = b0 + 96; a += "M" + q(200 + (b0 - 200) * c, 531) + " L" + q(200 + (b1 - 200) * c, 531) + " L" + q(b1, 800) + " L" + q(b0, 800) + " Z "; }
    s += "<path d='" + a + "' fill='#33863b'/><rect y='531' width='400' height='269' fill='url(#" + p + "ert)'/><rect y='552' width='400' height='2.6' fill='#eef4ea' opacity='.8'/><rect y='531' width='400' height='269' fill='url(#" + p + "erb)'/>";
    var TAB = [["#ff2d8a", "#ff9b22"], ["#0d2c96", "#1e70ff"], ["#00b07a", "#b4f03c"], ["#5a22b8", "#c629d6"], ["#e01b30", "#ff6d3f"]];
    s += "<rect y='533' width='400' height='26' fill='url(#" + p + "bag)'/>";   // la luce dei cartelloni sull'erba davanti
    for (i = 0; i < 5; i++) {
      var x0 = -11 + i * 85;
      d += lin(p + "t" + i, 0, 0, 1, 0, [[0, TAB[i][0]], [1, TAB[i][1]]]);
      s += "<rect x='" + x0 + "' y='503' width='82' height='30' rx='1.5' fill='#0b0d12'/><rect x='" + n1(x0 + 1.6) + "' y='505' width='78.8' height='24.6' fill='url(#" + p + "t" + i + ")'/>" + disegnoCartellone(p, i, x0) +
        "<rect x='" + n1(x0 + 1.6) + "' y='505' width='78.8' height='24.6' fill='url(#" + p + "led)'/><path d='M" + (x0 + 2) + ",505.6 h78' stroke='#fff' stroke-width='.8' opacity='.45'/>";
    }
    s += "<rect width='400' height='800' fill='url(#" + p + "vig)'/>";

    // ---- 7. le teste dei fari accese (sopra a tutto: la luce non si spegne nella vignettatura). Le lampade sono un disegno ripetuto
    [[32, 44, 1], [368, 44, -1]].forEach(function (t, h) {   // abbastanza in basso da restare dentro anche sui telefoni "larghi", dove lo sfondo si taglia in alto
      var cx = t[0], cy = t[1], v = t[2];
      d += "<pattern id='" + p + "L" + h + "' width='7.8' height='7.4' x='" + n1(cx - 23.4) + "' y='" + n1(cy - 14.7) + "' patternUnits='userSpaceOnUse'><circle cx='3.9' cy='3.7' r='3.4' fill='#2a2f3d'/><circle cx='3.9' cy='3.7' r='2.8' fill='url(#" + p + "lam)'/><circle cx='3' cy='2.7' r='.8' fill='#fff'/></pattern>";
      s += "<circle cx='" + cx + "' cy='" + cy + "' r='135' fill='url(#" + p + "alo)'/>" +
        "<g transform='rotate(" + (-7 * v) + " " + cx + " " + cy + ")'><rect x='" + (cx - 25) + "' y='" + (cy - 17) + "' width='50' height='33' rx='2' fill='#141927' stroke='#06080f' stroke-width='1.2'/>" +
        "<rect x='" + n1(cx - 23.4) + "' y='" + n1(cy - 14.7) + "' width='46.8' height='29.6' fill='url(#" + p + "L" + h + ")'/>" +
        "<path d='M" + (cx - 24) + "," + (cy + 19) + " h48 M" + (cx - 24) + "," + (cy + 21.5) + " h48' stroke='#1d2333' stroke-width='1.4'/></g>" +
        "<circle cx='" + cx + "' cy='" + cy + "' r='46' fill='url(#" + p + "alo)' opacity='.75'/>" +
        "<ellipse cx='" + cx + "' cy='" + cy + "' rx='84' ry='1.5' fill='url(#" + p + "fla)'/><ellipse cx='" + cx + "' cy='" + cy + "' rx='1.1' ry='34' fill='url(#" + p + "flv)'/>";
    });
    return (pronti.stadio = svg("0 0 400 800", " preserveAspectRatio='xMidYMid slice'", "<defs>" + d + "</defs>" + s));
  };

  // =========================================================
  //  IL CAMPO: mezzo campo visto dall'alto (300×300, preserveAspectRatio none). Misure vere in metri (campo 68 di larghezza,
  //  mezzo campo 52,5: area di rigore 40,32 × 16,5, area piccola 18,32 × 5,5, dischetto a 11 m, cerchi di 9,15 m, porta 7,32 m).
  //  Le scale X e Y sono diverse apposta: stirato nel rettangolo di proporzioni `rap` (larghezza / altezza, di partenza 1,44,
  //  circa 360×250) il campo torna con le proporzioni giuste, i cerchi tondi e le linee tutte dello stesso spessore (gli archi
  //  sono strisce piene, non bordi). La porta resta in basso; in un rettangolo più alto si vede anche un pezzo dell'altra metà.
  // =========================================================
  A.campo = function (rap) {
    rap = Math.max(.6, Math.min(2.2, +rap || 1.44));
    var chiave = "campo" + rap.toFixed(2);
    if (pronti[chiave]) return pronti[chiave];
    var p = "astC", SX = 250 / 68, SY = SX * rap, LW = .5, r = rnd(1898), d = "", s = "", i, a, b;
    function X(m) { return 150 + m * SX; }
    function Y(m) { return 284 - (52.5 - m) * SY; }
    var mSu = Math.min(0, 52.5 - 290 / SY);   // fin dove arrivano le linee laterali (oltre il bordo in alto)
    function rettH(x0, x1, ym) { return "M" + q(X(x0) - LW * SX / 2, Y(ym) - LW * SY / 2) + " H" + n1(X(x1) + LW * SX / 2) + " v" + n1(LW * SY) + " H" + n1(X(x0) - LW * SX / 2) + " Z "; }
    function rettV(xm, y0, y1) { return "M" + q(X(xm) - LW * SX / 2, Y(y0) - LW * SY / 2) + " h" + n1(LW * SX) + " V" + n1(Y(y1) + LW * SY / 2) + " h" + n1(-LW * SX) + " Z "; }
    function arco(cx, cy, R, a0, a1) {   // un arco di cerchio (angoli in gradi, 90 = verso il basso) come striscia piena
      var ro = R + LW / 2, ri = R - LW / 2, g = (a1 - a0) > 180 ? 1 : 0;
      function P(rr, aa) { var t = aa * Math.PI / 180; return q(X(cx + rr * Math.cos(t)), Y(cy + rr * Math.sin(t))); }
      return "M" + P(ro, a0) + " A" + n1(ro * SX) + "," + n1(ro * SY) + " 0 " + g + " 1 " + P(ro, a1) + " L" + P(ri, a1) + " A" + n1(ri * SX) + "," + n1(ri * SY) + " 0 " + g + " 0 " + P(ri, a0) + " Z ";
    }
    // l'erba: le strisce di taglio larghe 5,5 m dalla linea di porta in su (come nei campi veri: l'area piccola e l'area di rigore finiscono sul bordo di una striscia)
    var CH = "#4aa850", SC = "#3a8f41", conf = [300, Y(52.5)];
    for (i = 1; Y(52.5 - 5.5 * i) > 0; i++) conf.push(Y(52.5 - 5.5 * i));
    conf.push(0); a = "";
    for (i = 0; i < conf.length - 1; i += 2) a += "M0," + n1(conf[i + 1]) + " H300 V" + n1(conf[i]) + " H0 Z ";
    s += "<rect width='300' height='300' fill='" + SC + "'/><path d='" + a + "' fill='" + CH + "'/>";
    a = ""; b = "";
    for (i = 0; i < 9; i++) { a += "M" + n1(r() * 10) + "," + n1(r() * 8) + " v1.4 "; b += "M" + n1(r() * 10) + "," + n1(r() * 8) + " v1.4 "; }
    d += "<pattern id='" + p + "t' width='10' height='8' patternUnits='userSpaceOnUse'><path d='" + a + "' stroke='#d9f2b0' stroke-width='.55' opacity='.16'/><path d='" + b + "' stroke='#0d3514' stroke-width='.6' opacity='.2'/></pattern>" +
      "<pattern id='" + p + "r' width='2.6' height='2.6' patternUnits='userSpaceOnUse'><path d='M0,0 L2.6,2.6 M2.6,0 L0,2.6' stroke='#fff' stroke-width='.35' opacity='.75'/></pattern>" +
      rad(p + "l", .5, .4, .55, [[0, "#f4ffd8", .1], [1, "#f4ffd8", 0]]) + rad(p + "v", .5, .46, .72, [[.5, "#06140a", 0], [1, "#06140a", .42]]);
    s += "<rect width='300' height='300' fill='url(#" + p + "t)'/><rect width='300' height='300' fill='url(#" + p + "l)'/>";
    // le linee bianche
    var L = rettH(-34, 34, 0) + rettV(-34, mSu, 52.5) + rettV(34, mSu, 52.5) + rettH(-34, 34, 52.5) +
      rettH(-20.16, 20.16, 36) + rettV(-20.16, 36, 52.5) + rettV(20.16, 36, 52.5) +
      rettH(-9.16, 9.16, 47) + rettV(-9.16, 47, 52.5) + rettV(9.16, 47, 52.5) +
      arco(0, 0, 9.15, 0, 180) + arco(0, 0, 9.15, 180, 360) +   // (il cerchio di centrocampo intero: quello che esce dal disegno non si vede)
      arco(0, 41.5, 9.15, -143.05, -36.95) + arco(-34, 52.5, 1, -90, 0) + arco(34, 52.5, 1, -180, -90);
    s += "<path d='" + L + "' fill='#f6faf2' opacity='.92'/>" +
      "<ellipse cx='150' cy='" + n1(Y(41.5)) + "' rx='" + n1(.42 * SX) + "' ry='" + n1(.42 * SY) + "' fill='#f6faf2'/><ellipse cx='150' cy='" + n1(Y(0)) + "' rx='" + n1(.5 * SX) + "' ry='" + n1(.5 * SY) + "' fill='#f6faf2'/>";
    // la porta: la rete fino a 2 m dietro la linea, la traversa vista dall'alto (con la sua ombra), i pali
    var gx = 3.66, g0 = Y(52.5), g1 = Y(54.6), rete = "M" + q(X(-gx), g0) + " L" + q(X(gx), g0) + " L" + q(X(gx + .25), g1) + " L" + q(X(-gx - .25), g1) + " Z";
    s += "<path d='" + rete + "' fill='#1d4a24' opacity='.45'/><path d='" + rete + "' fill='url(#" + p + "r)'/>" +
      "<path d='M" + q(X(-gx), g0) + " L" + q(X(-gx - .25), g1) + " L" + q(X(gx + .25), g1) + " L" + q(X(gx), g0) + "' fill='none' stroke='#e9eef2' stroke-width='.9' stroke-linejoin='round' opacity='.85'/>" +
      "<rect x='" + n1(X(-gx) - .4) + "' y='" + n1(g0 + .6) + "' width='" + n1(X(gx) - X(-gx) + .8) + "' height='2.4' fill='#000' opacity='.22'/>" +
      "<rect x='" + n1(X(-gx) - 1) + "' y='" + n1(g0 - 1.3) + "' width='" + n1(X(gx) - X(-gx) + 2) + "' height='2.6' rx='1.2' fill='#fff' stroke='#8d97a3' stroke-width='.5'/>" +
      "<ellipse cx='" + n1(X(-gx)) + "' cy='" + n1(g0) + "' rx='1.5' ry='1.9' fill='#fff' stroke='#7d8793' stroke-width='.6'/><ellipse cx='" + n1(X(gx)) + "' cy='" + n1(g0) + "' rx='1.5' ry='1.9' fill='#fff' stroke='#7d8793' stroke-width='.6'/>";
    // le bandierine d'angolo (il vento le spinge tutte e due dalla stessa parte)
    [-34, 34].forEach(function (m) {
      var fx = X(m), fy = Y(52.5);
      s += "<path d='M" + q(fx + 1, fy + 1.4) + " l5.4,-.8 l.4,3.6 l-5.6,.6 Z' fill='#000' opacity='.2'/>" +
        "<path d='M" + q(fx, fy) + " l5.2,-1.2 l.5,3.4 l-5.4,.9 Z' fill='#ffd21f' stroke='" + LINEA + "' stroke-width='.5' stroke-linejoin='round'/>" +
        "<ellipse cx='" + n1(fx) + "' cy='" + n1(fy) + "' rx='1' ry='1.25' fill='#fff' stroke='" + LINEA + "' stroke-width='.5'/>";
    });
    s += "<rect width='300' height='300' fill='url(#" + p + "v)'/>";
    return (pronti[chiave] = svg("0 0 300 300", " preserveAspectRatio='none'", "<defs>" + d + "</defs>" + s));
  };
})();

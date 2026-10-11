/* =========================================================
   SPeeD GAME — PALLA MATTA (stile Peggle)
   In alto c'è il cannone: trascini il dito per mirare (si vede la strada della pallina) e lasci per tirare.
   La pallina scende rimbalzando sui pioli: quelli toccati si accendono e, quando la pallina esce, scoppiano.
   Devi far scoppiare tutti i pioli ARANCIONI con 10 palline. Il secchio in fondo, se ci entri, ti ridà la pallina.
   - pioli: blu 10 punti, arancioni 100, viola 500 (cambia posto a ogni tiro), verdi = il potere del tuo aiutante;
   - più arancioni hai preso, più vale ogni piolo (x2, x3, x5, x10);
   - l'ultimo arancione: rallentatore, poi la FEBBRE MATTA con i secchi da 10.000 a 50.000 punti.
   Modi: da solo coi livelli (la sfida a turni con gli amici arriva dopo).
   La fisica e i livelli stanno in funzioni senza disegno (in fondo: window.__PM per le prove).
   ========================================================= */
(function () {
  "use strict";
  var ID = "pallamatta";

  // ---------- il tavolo (in unità: 100 di larghezza, 180 di altezza, uguale su tutti i telefoni: online si gioca sullo stesso tavolo) e la fisica ----------
  var W = 100, H = 180, RB = 1.25, RP = 1.55, G = 58, V0 = 80, DT = 1 / 240;
  var E_PIOLO = 0.72, E_MURO = 0.82, VMAX = 120;
  var CX = 50, CY = 7;                       // il cannone
  var PALLINE = 10;
  var PUNTI = { blu: 10, arancio: 100, verde: 10, viola: 500 };
  var MOLT = [[0, 1], [0.4, 2], [0.6, 3], [0.76, 5], [0.88, 10]];   // quanto vale ogni piolo, secondo gli arancioni già presi
  var FEBBRE = [10000, 25000, 50000, 25000, 10000];                  // i secchi della febbre finale
  var EXTRA = [15000, 40000, 80000];                                 // punti in un tiro che regalano una pallina
  var SECCHIO = { y: 143.5, w: 15, h: 5 };
  var POTERI = {
    bomba: { icona: "💥", nome: "Bomba", sotto: "Il piolo verde esplode e accende tutto intorno" },
    multi: { icona: "⚽", nome: "Multipalla", sotto: "Dal piolo verde parte una seconda pallina" },
    mira:  { icona: "🎯", nome: "Mira lunga", sotto: "Per 3 tiri vedi tutta la strada della pallina" },
    fuoco: { icona: "🔥", nome: "Palla di fuoco", sotto: "La pallina passa attraverso i pioli e li accende" }
  };
  var ORDINE_POTERI = ["bomba", "multi", "mira", "fuoco"];

  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }

  // ---------- i livelli: figure fatte di pioli e di mattoncini (i rettangolini di Peggle), divise in capitoli ----------
  var PI = Math.PI, RM = 0.95;   // RM: mezzo spessore di un mattoncino
  // sui telefoni lunghi il tavolo si allunga in giù: le righe si allargano, ma le figure tonde si spostano senza schiacciarsi
  // (anc: l'altezza del centro della figura che si sta disegnando; ogni punto se lo porta dietro)
  var anc = null;
  function pt(l, x, y) { l.push(anc == null ? [x, y] : [x, y, anc]); }
  function tonda(cy, fn) { if (anc != null) return fn(); anc = cy; try { fn(); } finally { anc = null; } }
  function riga(l, x0, y0, x1, y1, n) { for (var i = 0; i < n; i++) { var k = n === 1 ? 0.5 : i / (n - 1); pt(l, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k); } }
  function arco(l, cx, cy, r, a0, a1, n) { tonda(cy, function () { for (var i = 0; i < n; i++) { var a = a0 + (a1 - a0) * (n === 1 ? 0.5 : i / (n - 1)); pt(l, cx + Math.cos(a) * r, cy + Math.sin(a) * r); } }); }
  function cerchio(l, cx, cy, r, n) { tonda(cy, function () { for (var i = 0; i < n; i++) { var a = PI * 2 * i / n - PI / 2; pt(l, cx + Math.cos(a) * r, cy + Math.sin(a) * r); } }); }
  function ellisse(l, cx, cy, rx, ry, n) { tonda(cy, function () { for (var i = 0; i < n; i++) { var a = PI * 2 * i / n; pt(l, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); } }); }
  function griglia(l, x0, y0, col, rig, dx, dy, sfalsa) { for (var j = 0; j < rig; j++) for (var i = 0; i < col - (sfalsa && j % 2 ? 1 : 0); i++) pt(l, x0 + i * dx + (sfalsa && j % 2 ? dx / 2 : 0), y0 + j * dy); }
  function stellina(l, cx, cy, r) { tonda(cy, function () { for (var i = 0; i < 5; i++) { var a = -PI / 2 + i * PI * 2 / 5; pt(l, cx + Math.cos(a) * r, cy + Math.sin(a) * r); } }); }
  function abete(l, x, y) { tonda(y, function () { pt(l, x, y); riga(l, x - 3.5, y + 6, x + 3.5, y + 6, 2); riga(l, x - 7, y + 12, x + 7, y + 12, 3); riga(l, x - 10.5, y + 18, x + 10.5, y + 18, 4); mattone(l, x, y + 22, x, y + 28); }); }
  function mattone(l, x0, y0, x1, y1) { l.push({ m: [x0, y0, x1, y1], a: anc }); }
  function mattoni(l, x0, y0, x1, y1, n, gap) {   // n mattoncini in fila (gap: lo spazio tra uno e l'altro)
    gap = gap == null ? 0.9 : gap; var dx = (x1 - x0) / n, dy = (y1 - y0) / n, L = Math.hypot(dx, dy), k = Math.max(0.2, (L - gap) / L);
    for (var i = 0; i < n; i++) { var cx = x0 + dx * (i + 0.5), cy = y0 + dy * (i + 0.5); mattone(l, cx - dx * k / 2, cy - dy * k / 2, cx + dx * k / 2, cy + dy * k / 2); }
  }
  function mattoniArco(l, cx, cy, rx, ry, a0, a1, n, gap) {   // mattoncini lungo un arco (o un pezzo d'ellisse)
    gap = gap == null ? 0.9 : gap;
    tonda(cy, function () {
      for (var i = 0; i < n; i++) {
        var aa = a0 + (a1 - a0) * i / n, ab = a0 + (a1 - a0) * (i + 1) / n;
        var x0 = cx + Math.cos(aa) * rx, y0 = cy + Math.sin(aa) * ry, x1 = cx + Math.cos(ab) * rx, y1 = cy + Math.sin(ab) * ry, L = Math.hypot(x1 - x0, y1 - y0), k = Math.max(0.2, (L - gap) / L), mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
        mattone(l, mx - (x1 - x0) * k / 2, my - (y1 - y0) * k / 2, mx + (x1 - x0) * k / 2, my + (y1 - y0) * k / 2);
      }
    });
  }
  function curva(l, cx, cy, rx, ry, a0, a1, gap) {   // un arco di mattoncini corti, come in Peggle (quanti ne servono per la sua lunghezza)
    var n = Math.max(1, Math.round(Math.abs(a1 - a0) * Math.sqrt((rx * rx + ry * ry) / 2) / 5.6));
    mattoniArco(l, cx, cy, rx, ry, a0, a1, n, gap == null ? 1.0 : gap);
  }
  function spezzata(l, pt, perLato, gap) { for (var i = 0; i < pt.length - 1; i++) mattoni(l, pt[i][0], pt[i][1], pt[i + 1][0], pt[i + 1][1], perLato, gap); }
  // (regole per giocare bene: niente pioli chiusi dentro le figure di mattoncini; le conche hanno spazi da 4,6 da cui la pallina passa)
  var CAPITOLI = [
    { nome: "Lo spazio", icona: "🚀", sfondo: "spazio" },
    { nome: "La natura", icona: "🌳", sfondo: "natura" },
    { nome: "Il mare", icona: "🐠", sfondo: "mare" }
  ];
  var LIVELLI = [
    // ---- 🚀 lo spazio ----
    { cap: 0, nome: "Stelle cadenti", arancioni: 12, fa: function (l) {
      griglia(l, 10, 36, 10, 5, 8.9, 8, true);   // il cielo pieno di stelline
      [[26, 100], [56, 116], [84, 96]].forEach(function (s) { stellina(l, s[0], s[1], 4.6); mattoni(l, s[0] - 6, s[1] - 7, s[0] - 21, s[1] - 24, 3, 1.0); });   // le stelle cadenti con la scia
      riga(l, 22, 80, 78, 80, 8);
      curva(l, 50, 136, 46, 12, PI * 1.08, PI * 1.36, 4.6); curva(l, 50, 136, 46, 12, PI * 1.64, PI * 1.92, 4.6);
    } },
    { cap: 0, nome: "Il pianeta con l'anello", arancioni: 14, fa: function (l) {
      cerchio(l, 50, 70, 16, 15); cerchio(l, 50, 70, 10, 10); cerchio(l, 50, 70, 4.4, 5);   // il pianeta (la pallina passa tra i pioli)
      curva(l, 50, 74, 38, 10, PI * 0.04, PI * 0.96, 4.6);   // l'anello davanti
      curva(l, 50, 74, 38, 10, PI * 1.0, PI * 1.3); curva(l, 50, 74, 38, 10, PI * 1.7, PI * 2.0);   // l'anello dietro
      curva(l, 16, 112, 9, 9, PI * 1.0, PI * 2.0); arco(l, 16, 112, 9, PI * 0.15, PI * 0.85, 4); l.push([16, 112]);   // le lune
      curva(l, 84, 112, 9, 9, PI * 1.0, PI * 2.0); arco(l, 84, 112, 9, PI * 0.15, PI * 0.85, 4); l.push([84, 112]);
      griglia(l, 28, 36, 6, 2, 8.8, 8, true); stellina(l, 12, 42, 4.4); stellina(l, 88, 42, 4.4);
      griglia(l, 34, 102, 4, 3, 10.6, 9, true); riga(l, 10, 132, 90, 132, 11);
    } },
    { cap: 0, nome: "Il razzo", arancioni: 16, fa: function (l) {
      curva(l, 50, 62, 11, 26, PI * 1.0, PI * 1.5); curva(l, 50, 62, 11, 26, PI * 1.5, PI * 2.0);   // la punta
      mattoni(l, 39, 66, 39, 102, 4, 4.8); mattoni(l, 61, 66, 61, 102, 4, 4.8);   // il corpo (con gli oblò per passare)
      cerchio(l, 50, 76, 5.6, 6); l.push([50, 76]); riga(l, 45, 90, 55, 90, 2); riga(l, 45, 98, 55, 98, 2);
      mattoni(l, 38, 92, 26, 110, 3, 1.0); mattoni(l, 62, 92, 74, 110, 3, 1.0);   // le alette
      riga(l, 42, 110, 58, 110, 3); riga(l, 46, 117, 54, 117, 2); l.push([50, 124]);   // le fiamme
      griglia(l, 8, 36, 3, 4, 9, 8, true); griglia(l, 74, 36, 3, 4, 9, 8, true);
      stellina(l, 14, 80, 4.4); stellina(l, 86, 80, 4.4); stellina(l, 16, 120, 4.4); stellina(l, 84, 120, 4.4);
      riga(l, 8, 134, 92, 134, 12);
    } },
    { cap: 0, nome: "La luna e le stelle", arancioni: 16, fa: function (l) {
      curva(l, 58, 82, 32, 32, PI * 0.6, PI * 1.45);   // il bordo della luna
      arco(l, 64, 82, 25, PI * 0.62, PI * 1.38, 12); arco(l, 72, 82, 19, PI * 0.66, PI * 1.34, 8);   // la falce piena di pioli
      [[62, 36], [68, 40], [75, 40], [81, 44], [80, 51], [88, 52], [89, 45]].forEach(function (p) { l.push(p); });   // il Grande Carro
      stellina(l, 86, 74, 4.4); stellina(l, 76, 124, 4.4); stellina(l, 22, 126, 4.4); stellina(l, 14, 44, 4.4);
      mattoni(l, 66, 68, 84, 62, 2, 1.0); mattoni(l, 8, 102, 22, 110, 2, 1.0);   // le comete
      griglia(l, 66, 92, 3, 3, 9, 9, true); griglia(l, 8, 58, 2, 4, 9, 8, true);
      curva(l, 50, 140, 30, 10, PI * 1.15, PI * 1.85, 4.6);
    } },
    { cap: 0, nome: "La galassia", arancioni: 18, fa: function (l) {
      var a = 0, r, pt = [];
      while (a < 9.4) { r = 8 + a * 3.7; l.push([50 + Math.cos(a) * r, 82 + Math.sin(a) * r * 1.05]); a += 5.8 / r; }   // un braccio di pioli
      for (a = 0.6; a < 9.6; a += 9.5 / (8 + a * 3.7)) { r = 8 + a * 3.7; pt.push([50 + Math.cos(a + PI) * r, 82 + Math.sin(a + PI) * r * 1.05]); }
      spezzata(l, pt, 1, 4.6);   // l'altro braccio di mattoncini
      curva(l, 50, 82, 4.5, 4.5, 0, PI * 2);   // il centro luminoso
      stellina(l, 12, 40, 4.4); stellina(l, 88, 128, 4.4); stellina(l, 88, 40, 4.4); stellina(l, 12, 128, 4.4);
    } },
    { cap: 0, nome: "Il disco volante", arancioni: 20, fa: function (l) {
      arco(l, 50, 66, 15, PI * 1.05, PI * 1.95, 9);   // la cupola
      curva(l, 50, 70, 32, 7.5, 0, PI * 2);   // il disco
      riga(l, 30, 82, 70, 82, 6);   // le luci
      mattoni(l, 42, 88, 28, 126, 4, 4.6); mattoni(l, 58, 88, 72, 126, 4, 4.6);   // il raggio
      griglia(l, 44, 100, 3, 3, 6.5, 8, true);   // la mucca rapita
      griglia(l, 26, 36, 6, 2, 9.6, 8, true);
      stellina(l, 12, 42, 4.4); stellina(l, 88, 42, 4.4); stellina(l, 12, 96, 4.4); stellina(l, 88, 96, 4.4); stellina(l, 14, 126, 4.4); stellina(l, 86, 126, 4.4);
      riga(l, 40, 134, 60, 134, 3);
    } },
    // ---- 🌳 la natura ----
    { cap: 1, nome: "Le montagne", arancioni: 18, fa: function (l) {
      spezzata(l, [[4, 104], [24, 70], [40, 92], [60, 54], [78, 86], [96, 68]], 3, 4.6);   // le cime (si passa tra un mattoncino e l'altro)
      abete(l, 17, 98); abete(l, 50, 88); abete(l, 83, 94);   // il bosco
      curva(l, 82, 40, 6.5, 6.5, 0, PI * 2);   // il sole
      cerchio(l, 22, 40, 5, 5); cerchio(l, 32, 40, 5, 5); cerchio(l, 27, 34, 5, 5);   // la nuvola
      riga(l, 44, 38, 49, 41, 2); riga(l, 54, 38, 49, 41, 1);   // l'uccello
      riga(l, 6, 128, 94, 128, 12); curva(l, 50, 140, 26, 8, PI * 1.15, PI * 1.85, 4.6);
    } },
    { cap: 1, nome: "L'albero", arancioni: 20, fa: function (l) {
      [[32, 72, 13], [68, 72, 13], [50, 54, 14]].forEach(function (c) {   // la chioma: le foglie sopra, i frutti dentro
        curva(l, c[0], c[1], c[2], c[2], PI * 1.0, PI * 2.0);
        arco(l, c[0], c[1], c[2], PI * 0.12, PI * 0.88, 5); cerchio(l, c[0], c[1], c[2] - 6.5, 6); l.push([c[0], c[1]]);
      });
      mattoni(l, 45, 90, 45, 124, 4, 1.0); mattoni(l, 55, 90, 55, 124, 4, 1.0);   // il tronco
      mattoni(l, 4, 131, 96, 131, 8, 4.6);   // il prato
      griglia(l, 8, 100, 4, 3, 9, 8, true); griglia(l, 66, 100, 4, 3, 9, 8, true);   // i fiori
      stellina(l, 88, 38, 4.4); stellina(l, 12, 38, 4.4);
    } },
    { cap: 1, nome: "Il fiore", arancioni: 20, fa: function (l) {
      tonda(62, function () {
        cerchio(l, 50, 62, 5, 6);
        for (var k = 0; k < 6; k++) {   // i petali: il bordo di mattoncini, dentro i pioli
          var a = k * PI / 3 - PI / 2, px = 50 + Math.cos(a) * 17, py = 62 + Math.sin(a) * 17;
          curva(l, px, py, 7, 7, a - PI * 0.55, a + PI * 0.55, Math.sin(a) > 0.1 ? 4.6 : 1.0); pt(l, px, py); pt(l, 50 + Math.cos(a) * 11, 62 + Math.sin(a) * 11);
        }
      });
      stellina(l, 14, 80, 4.4); stellina(l, 86, 78, 4.4); riga(l, 10, 124, 30, 124, 3); riga(l, 70, 124, 90, 124, 3);   // le farfalle e l'erba
      mattoni(l, 50, 88, 50, 132, 5, 1.0);   // il gambo
      curva(l, 40, 106, 10, 5, PI * 0.9, PI * 1.9); curva(l, 60, 116, 10, 5, PI * 1.1, PI * 2.1);   // le foglie
      [[16, 108], [84, 100]].forEach(function (f) { cerchio(l, f[0], f[1], 5.2, 5); l.push(f); });   // i fiorellini
      stellina(l, 14, 42, 4.4); stellina(l, 86, 42, 4.4); riga(l, 8, 132, 38, 132, 4); riga(l, 62, 132, 92, 132, 4);
    } },
    { cap: 1, nome: "Sole e nuvole", arancioni: 22, fa: function (l) {
      tonda(52, function () {
        curva(l, 50, 52, 8, 8, 0, PI * 2);   // il sole
        for (var k = 0; k < 8; k++) { var a = k * PI / 4 + PI / 8; mattone(l, 50 + Math.cos(a) * 12, 52 + Math.sin(a) * 12, 50 + Math.cos(a) * 18, 52 + Math.sin(a) * 18); pt(l, 50 + Math.cos(a - PI / 8) * 14, 52 + Math.sin(a - PI / 8) * 14); }   // i raggi
      });
      [[20, 84], [80, 90], [48, 112], [16, 40]].forEach(function (n, j) {   // le nuvole: sopra i mattoncini, sotto la pioggia
        tonda(n[1], function () { curva(l, n[0] - 6, n[1], 5.5, 5.5, PI, PI * 2); curva(l, n[0] + 6, n[1], 5.5, 5.5, PI, PI * 2); riga(l, n[0] - 9, n[1] + 4, n[0] + 9, n[1] + 4, 4); });
        if (j < 3) { riga(l, n[0] - 6, n[1] + 12, n[0] - 6, n[1] + 24, 3); riga(l, n[0] + 6, n[1] + 14, n[0] + 6, n[1] + 26, 3); }
      });
      riga(l, 78, 38, 83, 41, 2); riga(l, 88, 38, 83, 41, 1);
    } },
    { cap: 1, nome: "Le colline", arancioni: 22, fa: function (l) {
      var c1 = [], c2 = []; for (var i = 0; i < 10; i++) { var x = 4 + i * 10.2; c1.push([x, 82 + Math.sin(i * 0.8) * 8]); c2.push([x, 116 + Math.sin(i * 0.8 + 2) * 7]); }
      spezzata(l, c1, 1, 4.6); spezzata(l, c2, 1, 4.6);   // le colline (si passa tra un mattoncino e l'altro)
      griglia(l, 12, 36, 8, 5, 10.8, 8, true);   // i fiori sui prati
      [[22, 100], [50, 96], [78, 102]].forEach(function (p) { cerchio(l, p[0], p[1], 5, 5); l.push([p[0] + 8.5, p[1] - 3]); });   // le pecore
      stellina(l, 36, 101, 4.4); stellina(l, 64, 104, 4.4);   // le farfalle
      riga(l, 10, 132, 90, 132, 11);
    } },
    { cap: 1, nome: "L'arcobaleno", arancioni: 22, fa: function (l) {
      [44, 37, 30].forEach(function (r) { curva(l, 50, 114, r, r, PI * 1.06, PI * 1.94, 1.4); });   // l'arcobaleno
      arco(l, 50, 114, 23, PI * 1.08, PI * 1.92, 10);   // l'ultimo colore, coi pioli
      [[12, 118], [88, 118]].forEach(function (n) { curva(l, n[0], n[1] - 3, 7, 6, PI, PI * 2); riga(l, n[0] - 7, n[1] + 4, n[0] + 7, n[1] + 4, 3); l.push([n[0], n[1] + 11]); });   // le nuvole ai piedi
      griglia(l, 12, 36, 9, 3, 9.5, 8, true);   // la pioggia di luce
      griglia(l, 39, 100, 4, 2, 7.4, 8, true); curva(l, 50, 122, 9, 6, PI * 0.1, PI * 0.9, 4.6);   // la pentola d'oro
      riga(l, 12, 66, 12, 92, 4); riga(l, 88, 66, 88, 92, 4);
    } },
    // ---- 🐠 il mare ----
    { cap: 2, nome: "Il pesce", arancioni: 20, fa: function (l) {
      tonda(76, function () {
        curva(l, 44, 76, 24, 14, PI * 1.04, PI * 1.96); arco(l, 44, 76, 24, PI * 0.04, PI * 0.96, 10);   // il corpo: sopra mattoncini, sotto pioli
        pt(l, 30, 72); riga(l, 44, 67, 44, 83, 3); riga(l, 54, 68, 54, 84, 3);   // l'occhio e le strisce
        mattoni(l, 69, 76, 84, 64, 2, 1.0); mattoni(l, 69, 76, 84, 88, 2, 1.0); mattoni(l, 86, 62, 86, 90, 3, 1.0);   // la coda
      });
      [[24, 110, 1], [68, 120, -1]].forEach(function (f) { tonda(f[1], function () { ellisse(l, f[0], f[1], 8, 5, 7); mattoni(l, f[0] + 9 * f[2], f[1], f[0] + 14 * f[2], f[1] - 5, 1); mattoni(l, f[0] + 9 * f[2], f[1], f[0] + 14 * f[2], f[1] + 5, 1); }); });   // i pesciolini
      riga(l, 16, 62, 12, 54, 2); l.push([16, 46]); l.push([11, 38]);   // le bollicine
      cerchio(l, 86, 42, 5, 5); cerchio(l, 70, 38, 4.4, 4); griglia(l, 38, 36, 3, 2, 8, 8, true);
      for (var j = 0; j < 5; j++) { l.push([7 + Math.sin(j) * 2.5, 92 + j * 8]); l.push([93 + Math.sin(j + 1) * 2.5, 96 + j * 8]); }   // le alghe
      mattoni(l, 30, 134, 70, 134, 4, 4.6); stellina(l, 44, 126, 4.4);
    } },
    { cap: 2, nome: "La medusa", arancioni: 22, fa: function (l) {
      tonda(62, function () { curva(l, 50, 62, 20, 15, PI, PI * 2); riga(l, 31, 66, 69, 66, 6); riga(l, 43, 56, 57, 56, 3); });   // la testa, l'orlo e le macchie
      [33, 41.5, 50, 58.5, 67].forEach(function (x) { for (var j = 0; j < 7; j++) l.push([x + Math.sin(j * 0.9) * 2.4, 76 + j * 8]); });   // i tentacoli
      [[16, 96], [84, 104]].forEach(function (m) { tonda(m[1], function () { curva(l, m[0], m[1], 8, 7, PI, PI * 2); riga(l, m[0] - 6, m[1] + 4, m[0] + 6, m[1] + 4, 3); }); riga(l, m[0] - 4, m[1] + 12, m[0] - 4, m[1] + 24, 3); riga(l, m[0] + 4, m[1] + 14, m[0] + 4, m[1] + 26, 3); });   // le meduse piccole
      riga(l, 14, 36, 10, 46, 2); l.push([14, 56]); riga(l, 86, 34, 90, 44, 2); l.push([86, 54]); l.push([90, 64]);   // le bolle
    } },
    { cap: 2, nome: "Il polpo", arancioni: 22, fa: function (l) {
      curva(l, 50, 54, 16, 16, PI * 1.0, PI * 2.0); arco(l, 50, 54, 16, PI * 0.1, PI * 0.9, 6); cerchio(l, 50, 54, 9, 9); l.push([50, 54]);   // la testa
      for (var k = 0; k < 8; k++) { var bx = 18.5 + k * 9; for (var j = 0; j < 6; j++) l.push([bx + Math.sin(j * 0.9 + k * 0.6) * 3, 78 + j * 10]); }   // gli otto tentacoli
      curva(l, 14, 44, 6, 6, 0, PI * 2, 4.6); curva(l, 86, 40, 6, 6, 0, PI * 2, 4.6); l.push([14, 44]); l.push([86, 40]);   // le bolle
      mattoni(l, 6, 136, 30, 136, 2, 4.6); mattoni(l, 70, 136, 94, 136, 2, 4.6);
    } },
    { cap: 2, nome: "La conchiglia", arancioni: 22, fa: function (l) {
      tonda(124, function () {
        for (var k = 0; k < 7; k++) { var a = PI * (1.1 + k * 0.8 / 6); mattoni(l, 50 + Math.cos(a) * 16, 124 + Math.sin(a) * 16, 50 + Math.cos(a) * 38, 124 + Math.sin(a) * 38, 3, 1.0); }   // le righe (non arrivano in fondo: si esce)
        for (k = 0; k < 6; k++) { var b2 = PI * (1.1 + (k + 0.5) * 0.8 / 6); pt(l, 50 + Math.cos(b2) * 31, 124 + Math.sin(b2) * 31); pt(l, 50 + Math.cos(b2) * 22, 124 + Math.sin(b2) * 22); }   // le perle tra le righe
        arco(l, 50, 124, 44, PI * 1.06, PI * 1.94, 20);   // il bordo
      });
      griglia(l, 10, 36, 9, 3, 10, 8, true);
      [[20, 68], [80, 68]].forEach(function (s) { stellina(l, s[0], s[1], 5.5); l.push(s); });   // le stelle marine
      tonda(60, function () { curva(l, 50, 60, 12, 6, PI * 1.0, PI * 2.0); riga(l, 42, 66, 58, 66, 3); });
    } },
    { cap: 2, nome: "Le bolle", arancioni: 25, fa: function (l) {
      [[30, 50, 11], [72, 54, 9], [50, 88, 14], [18, 104, 8], [82, 106, 9], [36, 126, 7], [66, 128, 7]].forEach(function (b) {   // le bolle: un giro di mattoncini con gli spazi, dentro i pioli
        curva(l, b[0], b[1], b[2], b[2], -PI / 2, PI * 1.5, 4.6);
        if (b[2] >= 11) { cerchio(l, b[0], b[1], b[2] - 5.6, Math.round((b[2] - 5.6) * 2 * PI / 6.3)); } l.push([b[0], b[1]]);
      });
      riga(l, 8, 36, 8, 76, 5); riga(l, 92, 36, 92, 76, 5); riga(l, 46, 40, 54, 40, 2); l.push([50, 66]);
    } },
    { cap: 2, nome: "Il forziere", arancioni: 25, fa: function (l) {
      tonda(116, function () {
        mattoni(l, 34, 104, 34, 126, 3, 1.0); mattoni(l, 66, 104, 66, 126, 3, 1.0); mattoni(l, 34, 129, 66, 129, 4, 1.0);   // la cassa (aperta sopra)
        curva(l, 25, 100, 12, 6, PI * 0.95, PI * 1.85);   // il coperchio aperto
        griglia(l, 39, 108, 4, 3, 7.4, 7, true);   // le monete dentro
        arco(l, 50, 104, 19, PI * 1.12, PI * 1.88, 7);   // le monete che saltano fuori
      });
      griglia(l, 12, 36, 8, 4, 10.8, 8, true);
      riga(l, 12, 76, 88, 76, 10); stellina(l, 14, 114, 4.4); stellina(l, 86, 114, 4.4);
      mattoni(l, 4, 134, 26, 134, 2, 4.6); mattoni(l, 74, 134, 96, 134, 2, 4.6);
    } }
  ];
  function distSeg(px, py, m) {   // quanto è lontano un punto da un mattoncino
    var ex = m[2] - m[0], ey = m[3] - m[1], L2 = ex * ex + ey * ey, t = L2 ? Math.max(0, Math.min(1, ((px - m[0]) * ex + (py - m[1]) * ey) / L2)) : 0;
    return Math.hypot(px - (m[0] + ex * t), py - (m[1] + ey * t));
  }
  function creaLivello(i, scegliVerdi, hh) {   // hh: l'altezza del tavolo (sui telefoni lunghi è più alto: tutto si allarga in giù)
    var l = []; LIVELLI[i].fa(l);
    var k2 = ((hh || H) - 40) / 110;
    function sy(y, a) { return a == null ? 26 + (Math.max(26, Math.min(136, y)) - 26) * k2 : sy(a) + y - a; }   // (a: il centro della figura tonda, che si sposta e basta)
    function sx(x) { return Math.max(3, Math.min(W - 3, x)); }
    var p = [], mat = [];
    l.forEach(function (q) {
      if (!q.m) return;
      var m = [sx(q.m[0]), sy(q.m[1], q.a), sx(q.m[2]), sy(q.m[3], q.a)];
      if (Math.abs(m[3] - m[1]) < 0.1 * Math.hypot(m[2] - m[0], m[3] - m[1])) {   // i mattoncini piatti si inclinano un filo verso fuori: la pallina non ci resta sopra ferma
        if (m[2] < m[0]) m = [m[2], m[3], m[0], m[1]];
        var mx = (m[0] + m[2]) / 2, my = (m[1] + m[3]) / 2, hl = Math.hypot(m[2] - m[0], m[3] - m[1]) / 2, an = Math.atan2(m[3] - m[1], m[2] - m[0]) + (mx < 50 ? -0.13 : 0.13);
        m = [mx - Math.cos(an) * hl, my - Math.sin(an) * hl, mx + Math.cos(an) * hl, my + Math.sin(an) * hl];
      }
      mat.push({ m: m, x: (m[0] + m[2]) / 2, y: (m[1] + m[3]) / 2, ang: Math.atan2(m[3] - m[1], m[2] - m[0]), len: Math.hypot(m[2] - m[0], m[3] - m[1]), tipo: "blu", acceso: false, via: false });
    });
    l.forEach(function (q) {   // i pioli: dentro il tavolo e mai troppo vicini (la pallina deve passare)
      if (q.m) return;
      var x = Math.max(4, Math.min(W - 4, q[0])), y = sy(q[1], q[2]), k;
      for (k = 0; k < p.length; k++) if (Math.hypot(p[k].x - x, p[k].y - y) < RP * 2 + RB * 1.3) return;
      for (k = 0; k < mat.length; k++) if (distSeg(x, y, mat[k].m) < RP + RM + 1.1) return;
      p.push({ x: x, y: y, tipo: "blu", acceso: false, via: false });
    });
    p = p.concat(mat);
    var r = rnd(7919 * (i + 1)), idx = p.map(function (_, k) { return k; });
    for (var k = idx.length - 1; k > 0; k--) { var j = Math.floor(r() * (k + 1)), tt = idx[k]; idx[k] = idx[j]; idx[j] = tt; }   // gli arancioni: sempre gli stessi per ogni livello
    var nA = Math.min(LIVELLI[i].arancioni || 25, Math.round(p.length * 0.3));   // 25 come in Peggle (i primi livelli ne hanno meno)
    for (k = 0; k < nA; k++) p[idx[k]].tipo = "arancio";
    if (scegliVerdi !== false) {   // i due verdi (solo pioli tondi): a caso ogni volta
      var blu = p.filter(function (q) { return q.tipo === "blu" && !q.m; });
      for (k = 0; k < 2 && blu.length; k++) { var c = Math.floor(Math.random() * blu.length); blu[c].tipo = "verde"; blu.splice(c, 1); }
    }
    return p;
  }

  // ---------- lo stato di una partita ----------
  function nuovoStato(lv, potere, hh) {
    var p = creaLivello(lv, true, hh);
    var st = { lv: lv, H: hh || H, pioli: p, palline: PALLINE, punti: 0, fase: "mira", ang: PI / 2, palle: [], potere: potere || "bomba",
      arTot: p.filter(function (q) { return q.tipo === "arancio"; }).length, arPresi: 0, viola: -1, t: 0, febbre: false, mira: 0,
      colpo: null, secchiPresi: 0, verdiPresi: 0, colpoMax: 0, extra: 0, fuoco: 0 };
    nuovoViola(st);
    return st;
  }
  function nuovoViola(st) {   // a ogni tiro un piolo blu diventa viola (quello di prima torna blu)
    st.pioli.forEach(function (q) { if (q.tipo === "viola" && !q.acceso) q.tipo = "blu"; });
    var blu = st.pioli.filter(function (q) { return q.tipo === "blu" && !q.via; });
    if (blu.length) blu[Math.floor(Math.random() * blu.length)].tipo = "viola";
  }
  function molt(st) { var f = st.arPresi / Math.max(1, st.arTot), m = 1; MOLT.forEach(function (x) { if (f >= x[0]) m = x[1]; }); return m; }
  function xSecchio(t) { return 50 + 37 * Math.sin(t * 0.65); }

  // un passo di fisica per una pallina: gravità, muri, pioli, secchio (eventi in ev: colpi, secchio, uscita)
  function passo(st, b, dt, ev) {
    b.vy += G * dt;
    var v = Math.hypot(b.vx, b.vy); if (v > VMAX) { b.vx *= VMAX / v; b.vy *= VMAX / v; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < RB) { b.x = RB; b.vx = Math.abs(b.vx) * E_MURO; ev.push({ t: "muro", b: b }); }
    if (b.x > W - RB) { b.x = W - RB; b.vx = -Math.abs(b.vx) * E_MURO; ev.push({ t: "muro", b: b }); }
    if (b.y < RB) { b.y = RB; b.vy = Math.abs(b.vy) * E_MURO; }
    var pp = st.pioli;
    for (var i = 0; i < pp.length; i++) {
      var q = pp[i]; if (q.via) continue;
      var cx = q.x, cy = q.y, rr = RB + RP;
      if (q.m) {   // il mattoncino: un segmento spesso, la pallina urta il suo punto più vicino
        if (Math.abs(b.x - q.x) > q.len / 2 + 3 || Math.abs(b.y - q.y) > q.len / 2 + 3) continue;
        var m = q.m, ex = m[2] - m[0], ey = m[3] - m[1], L2 = ex * ex + ey * ey, tt = L2 ? Math.max(0, Math.min(1, ((b.x - m[0]) * ex + (b.y - m[1]) * ey) / L2)) : 0;
        cx = m[0] + ex * tt; cy = m[1] + ey * tt; rr = RB + RM;
      }
      var dx = b.x - cx, dy = b.y - cy, d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr) continue;
      var d = Math.sqrt(d2) || 0.001, nx = dx / d, ny = dy / d;
      if (!q.acceso) ev.push({ t: "piolo", q: q, b: b });
      if (b.fuoco) continue;   // la palla di fuoco passa attraverso
      b.x = cx + nx * rr; b.y = cy + ny * rr;
      var vn = b.vx * nx + b.vy * ny;
      if (vn < -4 && q.acceso && (q.urti = (q.urti || 0) + 1) >= 5) ev.push({ t: "rotto", q: q });   // un pezzo già acceso colpito tante volte (la pallina è in gabbia): scoppia subito
      if (vn < 0) { b.vx -= (1 + E_PIOLO) * vn * nx; b.vy -= (1 + E_PIOLO) * vn * ny; b.vx *= 0.985; b.vy *= 0.985; b.vx += (((q.x * 7.31 + q.y * 3.17) % 1) - 0.5) * 1.2; }   // (una piccola deviazione, sempre la stessa per ogni piolo: niente rimbalzi su e giù all'infinito)
    }
    // in fondo: il secchio che si muove (o, nella febbre, i 5 secchi fissi)
    if (st.febbre) {
      [20, 40, 60, 80].forEach(function (px) { urtaPalo(b, px, st.H - 4.5, 1.3); });
      if (b.y > st.H - 3 && !b.preso) { b.preso = true; ev.push({ t: "febbre", b: b, slot: Math.max(0, Math.min(4, Math.floor(b.x / 20))) }); }
    } else {
      var sx = xSecchio(st.t), sy = st.H - 6.5, mw = SECCHIO.w / 2;
      urtaPalo(b, sx - mw, sy, 1.1); urtaPalo(b, sx + mw, sy, 1.1);
      if (!b.preso && b.vy > 0 && b.y > sy && b.y - b.vy * dt <= sy && Math.abs(b.x - sx) < mw - 0.6) { b.preso = true; ev.push({ t: "secchio", b: b }); }
    }
    if (b.y > st.H + 6) ev.push({ t: "fuori", b: b });
  }
  function urtaPalo(b, px, py, r) {
    var dx = b.x - px, dy = b.y - py, d = Math.hypot(dx, dy), rr = r + RB;
    if (d >= rr || d === 0) return;
    var nx = dx / d, ny = dy / d; b.x = px + nx * rr; b.y = py + ny * rr;
    var vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 1.75 * vn * nx; b.vy -= 1.75 * vn * ny; }
  }
  // la strada della pallina per mirare: fino al primo piolo (o, con la Mira lunga, per un bel pezzo)
  function strada(st, ang, lunga, fuoco) {   // (fuoco: la pallina passerà attraverso i pioli, si vede tutta la parabola)
    var b = { x: CX + Math.cos(ang) * 6, y: CY + Math.sin(ang) * 6, vx: Math.cos(ang) * V0, vy: Math.sin(ang) * V0 }, pts = [], ev = [], urti = 0;
    if (fuoco) { b.fuoco = true; lunga = true; }
    var finto = { pioli: st.pioli.map(function (q) { return { x: q.x, y: q.y, m: q.m, len: q.len, via: q.via, acceso: true }; }), febbre: st.febbre, t: st.t, H: st.H };
    for (var i = 0; i < 240 * (lunga ? 2.6 : 1.4); i++) {
      ev.length = 0; var vx = b.vx, vy = b.vy;
      passo(finto, b, DT, ev);
      if (i % 6 === 0) pts.push([b.x, b.y]);
      if (Math.abs(b.vx - vx) > 8 || Math.abs(b.vy - vy) > 8 || (b.vy < 0 && vy > 0)) { urti++; if (!lunga) { pts.push([b.x, b.y]); break; } }
      if (b.y > st.H + 4) break;
    }
    return pts;
  }

  // ---------- suoni (fatti al volo) ----------
  var CHIAVE_SUONI = "sg-pm-suoni", NOTE = [0, 2, 4, 5, 7, 9, 11];
  function suoniOn() { try { return localStorage.getItem(CHIAVE_SUONI) !== "0"; } catch (e) { return true; } }
  function ac() { if (!suoniOn()) return null; try { return (window.SG && SG.audioCtx && SG.audioCtx()) || null; } catch (e) { return null; } }
  function tono(f, quando, dur, tipo, vol, fine) {
    var c = ac(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain(), a = c.currentTime + (quando || 0);
      o.type = tipo || "sine"; o.frequency.setValueAtTime(f, a); if (fine) o.frequency.exponentialRampToValueAtTime(fine, a + dur);
      g.gain.setValueAtTime(0.0001, a); g.gain.exponentialRampToValueAtTime(vol || 0.1, a + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, a + dur);
      o.connect(g); g.connect(c.destination); o.start(a); o.stop(a + dur + 0.05);
    } catch (e) {}
  }
  function nota(n) { var ott = Math.floor(n / 7), g = NOTE[((n % 7) + 7) % 7]; return 392 * Math.pow(2, (ott * 12 + g) / 12); }   // dal sol in su
  function suonoPiolo(k, tipo) { var f = nota(Math.min(k, 20)); tono(f, 0, 0.16, "triangle", 0.09); tono(f * 2, 0, 0.08, "sine", 0.03); if (tipo === "arancio") tono(f * 1.5, 0.02, 0.12, "sine", 0.04); }
  function suonoScoppio(k) { tono(700 + k * 35, 0, 0.05, "square", 0.025); }
  function suonoTiro() { tono(180, 0, 0.12, "sine", 0.18, 60); tono(900, 0, 0.05, "triangle", 0.05, 400); }
  function suonoSecchio() { [0, 4, 7, 12].forEach(function (s, i) { tono(523 * Math.pow(2, s / 12), i * 0.07, 0.18, "triangle", 0.08); }); }
  function suonoPotere() { tono(300, 0, 0.35, "sawtooth", 0.05, 1200); tono(600, 0.1, 0.3, "triangle", 0.06, 1800); }
  function suonoBomba() { var c = ac(); if (!c) return; tono(120, 0, 0.5, "sawtooth", 0.12, 30); tono(70, 0, 0.6, "sine", 0.2, 25); }
  function suonoPerso() { [0, -1, -2, -5].forEach(function (s, i) { tono(330 * Math.pow(2, s / 12), i * 0.28, 0.32, "triangle", 0.08); }); }
  function rullo(dur) { for (var i = 0; i < dur * 22; i++) tono(90 + Math.random() * 30, i / 22, 0.05, "square", 0.02 + i / (dur * 22) * 0.03); }
  // l'Inno alla gioia (Beethoven, di tutti): la musica della febbre
  function innoGioia() {
    var m = [[4, 1], [4, 1], [5, 1], [6, 1], [6, 1], [5, 1], [4, 1], [3, 1], [2, 1], [2, 1], [3, 1], [4, 1], [4, 1.5], [3, 0.5], [3, 2],
      [4, 1], [4, 1], [5, 1], [6, 1], [6, 1], [5, 1], [4, 1], [3, 1], [2, 1], [2, 1], [3, 1], [4, 1], [3, 1.5], [2, 0.5], [2, 2]], t = 0, b = 0.27;
    var scala = [261.6, 293.7, 329.6, 349.2, 392, 440, 493.9];
    m.forEach(function (x) { var f = scala[x[0]]; tono(f * 2, t, x[1] * b * 0.95, "triangle", 0.09); tono(f, t, x[1] * b * 0.95, "sine", 0.05); t += x[1] * b; });
    [0, 4, 8, 12, 16, 20, 24, 28].forEach(function (k) { tono(130.8 * (k % 8 < 4 ? 1 : 1.5), k * b, b * 3.6, "sine", 0.05); });
  }
  function vibra(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
  function cifre(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

  // ---------- i progressi: livelli sbloccati, record e stelle (sul telefono e nel profilo) ----------
  var CHIAVE = "sg-pm-progressi2";   // (dai capitoli: i livelli sono nuovi, i progressi ripartono)
  function profiloOk() { return !!(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo()); }
  function progressi() {
    var p = {}; try { p = JSON.parse(localStorage.getItem(CHIAVE) || "{}") || {}; } catch (e) {}
    p.rec = p.rec || {}; p.stelle = p.stelle || {};
    if (profiloOk() && SGNube.statGioco) {   // dal profilo: quello che hai fatto su un altro telefono
      var s = SGNube.statGioco(ID) || {};
      LIVELLI.forEach(function (_, i) { var k = i + 1; if ((s["l" + k] || 0) > (p.rec[k] || 0)) p.rec[k] = s["l" + k]; if ((s["t" + k] || 0) > (p.stelle[k] || 0)) p.stelle[k] = s["t" + k]; });   // (l = record, t = stelle)
    }
    return p;
  }
  function salvaProgressi(p) { try { localStorage.setItem(CHIAVE, JSON.stringify({ rec: p.rec, stelle: p.stelle, potere: p.potere })); } catch (e) {} }
  function sbloccato(p, i) { return i === 0 || (p.stelle[i] || 0) > 0; }

  // =========================================================
  //  LA SCHERMATA DEI LIVELLI (prima di giocare): scegli il livello e il tuo aiutante
  // =========================================================
  function schermataLivelli(t) {
    stile();
    var el = t.el, p = progressi(), s = t.schermata({ icona: "🔴", titolo: "Palla Matta", sotto: "Scegli il livello" });
    if (!POTERI[p.potere]) p.potere = "bomba";
    // l'aiutante, in piccolo: si cambia anche qui tra un livello e l'altro
    var nomePot = el("span", { class: "pm-pot-nome", text: POTERI[p.potere].nome }), riga = el("div", { class: "pm-aiutanti" }, [el("span", { class: "pm-aiu-et", text: "Aiutante:" })]);
    ORDINE_POTERI.forEach(function (k) {
      var b = el("button", { class: "pm-aiu" + (p.potere === k ? " attiva" : ""), text: POTERI[k].icona, "aria-label": POTERI[k].nome, onclick: function () {
        p.potere = k; salvaProgressi(p); [].forEach.call(riga.querySelectorAll(".pm-aiu"), function (x) { x.classList.remove("attiva"); }); b.classList.add("attiva"); nomePot.textContent = POTERI[k].nome; vibra(6);
      } });
      riga.appendChild(b);
    });
    riga.appendChild(nomePot);
    s._contenuto.appendChild(riga);
    CAPITOLI.forEach(function (C, c) {   // i livelli divisi per capitolo, ognuno col suo colore
      var mie = [], stelleCap = 0;
      LIVELLI.forEach(function (L, i) { if (L.cap === c) { mie.push(i); stelleCap += p.stelle[i + 1] || 0; } });
      s._contenuto.appendChild(el("div", { class: "pm-cap pm-cap-" + C.sfondo }, [el("span", { text: C.icona + " Capitolo " + (c + 1) + " · " + C.nome }), el("small", { text: "★ " + stelleCap + "/" + mie.length * 3 })]));
      var lv = el("div", { class: "pm-livelli" });
      mie.forEach(function (i, n) {
        var L = LIVELLI[i], ok = sbloccato(p, i), st = p.stelle[i + 1] || 0;
        lv.appendChild(el("button", { class: "pm-lv pm-lv-" + C.sfondo + (ok ? "" : " chiuso") + (st ? " fatto" : ""), onclick: function () {
          if (!ok) return; vibra(8); partita(t, i, p.potere);
        } }, [
          el("b", { text: ok ? String(n + 1) : "🔒" }),
          el("span", { class: "pm-lv-nome", text: L.nome }),
          el("span", { class: "pm-lv-stelle", text: ok ? "★★★".slice(0, st) + "☆☆☆".slice(0, 3 - st) : "" }),
          el("small", { text: p.rec[i + 1] ? cifre(p.rec[i + 1]) : "" })
        ]));
      });
      s._contenuto.appendChild(lv);
    });
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "‹ Esci", onclick: function () { t.esci(); } }));
    t.mostra(s);
  }

  // =========================================================
  //  LA PARTITA (un livello): il tavolo a tutto schermo
  // =========================================================
  function partita(t, lv, potere) {
    stile();
    var el = t.el, s = t.schermata({}); s.classList.add("pm-piena");
    var st = nuovoStato(lv, potere), io = (t.nomeProfilo && t.nomeProfilo()) || (t.giocatori && t.giocatori[0]) || "Tu";
    var ui = { mira: null, zoom: 1, zx: CX, zy: 70, lento: 1, salto: 0, fx: [], scritte: [], coriandoli: [], pulizia: null, lento0: false, dito: false, tAvviso: 0 };
    var faccia = null;   // il tuo avatar (busto) per il disegno accanto al cannone
    try { var cfgF = t.mioOmino ? t.mioOmino(io) : null; if (cfgF && window.SGOmino) { faccia = new Image(); faccia.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(cfgF, { busto: true })); } } catch (e) {}
    var scena = el("div", { class: "pm-scena" }), cv = el("canvas", { class: "pm-tavolo" }), ctx = cv.getContext("2d");
    // in alto: esci, suoni, punti, palline; sotto la barra degli arancioni col moltiplicatore
    var bEsci = el("button", { class: "pm-tasto", text: "‹", "aria-label": "Esci", onclick: function () { esci(); } });
    var bAudio = el("button", { class: "pm-tasto", text: suoniOn() ? "🔊" : "🔇", onclick: function () { var on = !suoniOn(); try { localStorage.setItem(CHIAVE_SUONI, on ? "1" : "0"); } catch (e) {} bAudio.textContent = on ? "🔊" : "🔇"; } });
    var hPunti = el("div", { class: "pm-punti", text: "0" }), hPalle = el("div", { class: "pm-palle" }), hPot = el("div", { class: "pm-pot", text: POTERI[st.potere].icona });
    var barra = el("div", { class: "pm-barra" }), fill = el("i", { class: "pm-fill" }), hAr = el("span", { class: "pm-ar" }), hMolt = el("span", { class: "pm-molt", text: "x1" });
    barra.appendChild(fill); [0.4, 0.6, 0.76, 0.88].forEach(function (f, i) { var tk = el("i", { class: "pm-tacca", text: ["x2", "x3", "x5", "x10"][i] }); tk.style.left = (f * 100) + "%"; barra.appendChild(tk); });
    var testa = el("div", { class: "pm-testa" }, [bEsci, bAudio, el("div", { class: "pm-centro" }, [hPunti, el("div", { class: "pm-riga" }, [hAr, barra, hMolt])]), hPot, hPalle]);
    var avviso = el("div", { class: "pm-avviso" }), sopra = el("div", { class: "pm-sopra" });
    [cv, testa, avviso, sopra].forEach(function (n) { scena.appendChild(n); });
    s._contenuto.appendChild(scena);
    t.mostra(s);
    function vivo() { return document.body.contains(cv); }

    // ---- misure: il tavolo più grande possibile sotto la testa ----
    var S = 3, ox = 0, oy = 0, cw = 360, ch = 640, dpr = 1, sprite = {}, sfondo = null;
    function misura() {
      if (!vivo()) { window.removeEventListener("resize", misura); return; }
      cw = scena.clientWidth || 360; ch = scena.clientHeight || 640; dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      var top = testa.offsetHeight + 6;
      S = Math.min((cw - 8) / W, (ch - top - 6) / st.H); ox = (cw - S * W) / 2; oy = top + (ch - top - 6 - S * st.H) / 2;
      sprite = {}; sfondo = null;
    }
    window.addEventListener("resize", misura);

    // ---- i disegni pronti (pioli e sfondo), rifatti solo se cambia la misura ----
    var COL = { blu: ["#74c0fc", "#1c7ed6", "#0b3f80"], arancio: ["#ffc078", "#f76707", "#8a3200"], verde: ["#b2f2bb", "#2f9e44", "#11481e"], viola: ["#e5dbff", "#9c36b5", "#4a1561"] };
    function spritePiolo(tipo, acceso) {
      var k = tipo + (acceso ? "1" : "0"); if (sprite[k]) return sprite[k];
      var r = RP * S * dpr, m = Math.ceil(r * (acceso ? 2.4 : 1.25)), c = document.createElement("canvas"); c.width = c.height = m * 2;
      var x = c.getContext("2d"), col = COL[tipo];
      if (acceso) { var al = x.createRadialGradient(m, m, r * 0.5, m, m, m); al.addColorStop(0, col[0]); al.addColorStop(1, "rgba(255,255,255,0)"); x.globalAlpha = 0.75; x.fillStyle = al; x.fillRect(0, 0, m * 2, m * 2); x.globalAlpha = 1; }
      var gr = x.createRadialGradient(m - r * 0.35, m - r * 0.4, r * 0.1, m, m, r);
      gr.addColorStop(0, acceso ? "#ffffff" : col[0]); gr.addColorStop(0.55, acceso ? col[0] : col[1]); gr.addColorStop(1, col[acceso ? 1 : 2]);
      x.beginPath(); x.arc(m, m, r, 0, PI * 2); x.fillStyle = gr; x.fill();
      x.lineWidth = Math.max(1, r * 0.14); x.strokeStyle = acceso ? "#ffffff" : "rgba(0,0,0,.35)"; x.stroke();
      x.beginPath(); x.ellipse(m - r * 0.3, m - r * 0.38, r * 0.34, r * 0.22, -0.5, 0, PI * 2); x.fillStyle = "rgba(255,255,255,.65)"; x.fill();
      sprite[k] = c; return c;
    }
    function disegnaSfondo() {   // lo sfondo del capitolo (spazio, natura, mare), disegnato una volta sola
      var c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height; var x = c.getContext("2d"), tema = CAPITOLI[LIVELLI[lv].cap].sfondo, i, r2, g;
      x.scale(dpr, dpr);
      function tondo(cx, cy, r, col) { x.beginPath(); x.arc(cx, cy, r, 0, PI * 2); x.fillStyle = col; x.fill(); }
      function alone(cx, cy, r, col) { var a = x.createRadialGradient(cx, cy, 0, cx, cy, r); a.addColorStop(0, col); a.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = a; x.fillRect(cx - r, cy - r, r * 2, r * 2); }
      if (tema === "natura") {   // il cielo, il sole, le nuvole e le colline lontane
        g = x.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, "#5fb4ec"); g.addColorStop(0.65, "#a9dcf7"); g.addColorStop(1, "#d8f1d0"); x.fillStyle = g; x.fillRect(0, 0, cw, ch);
        alone(cw * 0.82, ch * 0.12, cw * 0.45, "rgba(255,244,190,.85)"); tondo(cw * 0.82, ch * 0.12, cw * 0.09, "#fff3b0");
        for (i = 0; i < 6; i++) { r2 = rnd(57 + i * 13); var nx = r2() * cw, ny = ch * (0.08 + r2() * 0.5), nr = 14 + r2() * 18; x.globalAlpha = 0.75; tondo(nx, ny, nr, "#ffffff"); tondo(nx + nr * 0.9, ny + 4, nr * 0.75, "#ffffff"); tondo(nx - nr * 0.9, ny + 5, nr * 0.7, "#ffffff"); x.globalAlpha = 1; }
        [["#9fd59a", 0.8, 0.07], ["#79c27a", 0.88, 0.06], ["#5aa95f", 0.95, 0.05]].forEach(function (h, k) {
          x.fillStyle = h[0]; x.beginPath(); x.moveTo(0, ch); for (var xx = 0; xx <= cw + 10; xx += 10) x.lineTo(xx, ch * h[1] + Math.sin(xx / cw * PI * (2 + k) + k) * ch * h[2]); x.lineTo(cw, ch); x.closePath(); x.fill();
        });
      } else if (tema === "mare") {   // il blu che si scurisce, i raggi di luce, le bolle, le alghe e la sabbia
        g = x.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, "#1c8fc7"); g.addColorStop(0.55, "#0d5c8f"); g.addColorStop(1, "#073a5e"); x.fillStyle = g; x.fillRect(0, 0, cw, ch);
        x.globalAlpha = 0.12; x.fillStyle = "#ffffff";
        for (i = 0; i < 5; i++) { var rx = cw * (0.1 + i * 0.2); x.beginPath(); x.moveTo(rx - 12, 0); x.lineTo(rx + 18, 0); x.lineTo(rx + 70, ch * 0.75); x.lineTo(rx + 20, ch * 0.75); x.closePath(); x.fill(); }
        x.globalAlpha = 1;
        for (i = 0; i < 30; i++) { r2 = rnd(91 + i * 5); var br = 1.5 + r2() * 4, bx = r2() * cw, by = r2() * ch; x.beginPath(); x.arc(bx, by, br, 0, PI * 2); x.strokeStyle = "rgba(255,255,255,.35)"; x.lineWidth = 1; x.stroke(); }
        x.fillStyle = "#e3c88a"; x.beginPath(); x.moveTo(0, ch); for (var sx = 0; sx <= cw + 10; sx += 10) x.lineTo(sx, ch * 0.94 + Math.sin(sx / 40) * 5); x.lineTo(cw, ch); x.closePath(); x.fill();
        for (i = 0; i < 7; i++) { r2 = rnd(13 + i * 29); var ax = r2() * cw, ah = ch * (0.12 + r2() * 0.14); x.strokeStyle = i % 2 ? "#2f9e44" : "#37b24d"; x.lineWidth = 4; x.lineCap = "round"; x.beginPath(); x.moveTo(ax, ch); for (var k = 0; k < 6; k++) x.lineTo(ax + Math.sin(k * 1.3 + i) * 7, ch - ah * k / 5); x.stroke(); }
      } else {   // lo spazio: stelle, una nebulosa, un pianeta e la luna
        g = x.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, "#0d0a2b"); g.addColorStop(0.6, "#1f1652"); g.addColorStop(1, "#33205f"); x.fillStyle = g; x.fillRect(0, 0, cw, ch);
        alone(cw * 0.2, ch * 0.35, cw * 0.6, "rgba(156,54,181,.28)"); alone(cw * 0.85, ch * 0.7, cw * 0.55, "rgba(28,126,214,.25)");
        for (i = 0; i < 110; i++) { r2 = rnd(31 + i * 7); x.fillStyle = "rgba(255,255,255," + (0.2 + r2() * 0.6).toFixed(2) + ")"; x.beginPath(); x.arc(r2() * cw, r2() * ch, r2() * 1.5 + 0.3, 0, PI * 2); x.fill(); }
        tondo(cw * 0.06, ch * 0.92, cw * 0.2, "#e8590c"); x.globalAlpha = 0.35; tondo(cw * 0.02, ch * 0.9, cw * 0.17, "#ffa94d"); x.globalAlpha = 1;   // il pianeta arancione nell'angolo
        x.strokeStyle = "rgba(255,212,59,.55)"; x.lineWidth = 3; x.beginPath(); x.ellipse(cw * 0.06, ch * 0.92, cw * 0.3, cw * 0.06, -0.3, 0, PI * 2); x.stroke();
        tondo(cw * 0.93, ch * 0.08, cw * 0.07, "#e9ecef"); tondo(cw * 0.91, ch * 0.07, cw * 0.015, "#ced4da"); tondo(cw * 0.95, ch * 0.1, cw * 0.012, "#ced4da");   // la luna
      }
      // il tavolo: una lastra appena più scura, così pioli e mattoncini si vedono bene su ogni sfondo
      x.save(); x.translate(ox, oy);
      var tg = x.createLinearGradient(0, 0, 0, st.H * S);
      if (tema === "spazio") { tg.addColorStop(0, "rgba(120,100,220,.16)"); tg.addColorStop(1, "rgba(80,60,180,.3)"); } else { tg.addColorStop(0, "rgba(10,25,60,.22)"); tg.addColorStop(1, "rgba(10,25,60,.4)"); }
      x.fillStyle = tg; arrot(x, 0, 0, W * S, st.H * S, 14); x.fill();
      x.lineWidth = 3; x.strokeStyle = tema === "natura" ? "rgba(255,255,255,.7)" : tema === "mare" ? "rgba(165,216,255,.55)" : "rgba(190,170,255,.45)"; arrot(x, 0, 0, W * S, st.H * S, 14); x.stroke();
      x.restore();
      sfondo = c;
    }
    function disegnaMattone(q) {   // il mattoncino: un rettangolo coi bordi tondi, girato come la sua figura
      var col = COL[q.tipo], L = q.len * S, th = RM * 2 * S;
      ctx.save(); ctx.translate(ox + q.x * S, oy + q.y * S); ctx.rotate(q.ang);
      if (q.acceso) { ctx.globalAlpha = 0.45; ctx.fillStyle = col[0]; arrot(ctx, -L / 2 - th * 0.6, -th * 1.1, L + th * 1.2, th * 2.2, th); ctx.fill(); ctx.globalAlpha = 1; }
      var g = ctx.createLinearGradient(0, -th / 2, 0, th / 2);
      g.addColorStop(0, q.acceso ? "#ffffff" : col[0]); g.addColorStop(0.5, q.acceso ? col[0] : col[1]); g.addColorStop(1, col[q.acceso ? 1 : 2]);
      ctx.fillStyle = g; arrot(ctx, -L / 2, -th / 2, L, th, th / 2); ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = q.acceso ? "#ffffff" : "rgba(0,0,0,.45)"; ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.fillRect(-L / 2 + th * 0.5, -th * 0.32, L - th, th * 0.18);
      ctx.restore();
    }
    function arrot(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

    // ---- il dito: trascina per mirare, lascia per tirare ----
    function alTavolo(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left - ox) / S, y: (e.clientY - r.top - oy) / S }; }
    function mira(e) {
      var p = alTavolo(e), a = Math.atan2(p.y - CY, p.x - CX);
      if (p.y < CY + 1) a = p.x < CX ? PI - 0.06 : 0.06;
      st.ang = Math.max(0.06, Math.min(PI - 0.06, a));
    }
    // il dito: tenendo premuto (o trascinando) si mira e lasciando la pallina NON parte;
    // un tocco veloce, senza muovere il dito, fa partire la pallina dove avevi mirato
    cv.addEventListener("pointerdown", function (e) {
      if (st.fase !== "mira") return;
      e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      try { if (window.SG && SG.audioCtx) SG.audioCtx(); } catch (er2) {}
      clearTimeout(ui.tTieni);
      ui.dito = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), mira: false };
      var d0 = ui.dito; ui.tTieni = setTimeout(function () { if (ui.dito === d0 && st.fase === "mira") { d0.mira = true; mira(e); } }, 200);   // tenuto premuto: si mira lì
    });
    cv.addEventListener("pointermove", function (e) {
      var d = ui.dito; if (!d || d.id !== e.pointerId || st.fase !== "mira") return;
      if (!d.mira && Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 7) d.mira = true;
      if (d.mira) mira(e);
    });
    function lascia(e) {
      var d = ui.dito; if (!d || d.id !== e.pointerId) return; ui.dito = null; clearTimeout(ui.tTieni);
      if (e.type === "pointerup" && st.fase === "mira" && !d.mira && performance.now() - d.t < 260) tira();   // il tocco veloce: tira
    }
    cv.addEventListener("pointerup", lascia); cv.addEventListener("pointercancel", lascia);

    function tira() {
      if (st.palline <= 0) return;
      st.palline--; st.fase = "volo";
      st.colpo = { punti: 0, colpiti: [], nota: 0, extra: 0, verde: false, t0: st.t };
      var b = { x: CX + Math.cos(st.ang) * 6, y: CY + Math.sin(st.ang) * 6, vx: Math.cos(st.ang) * V0, vy: Math.sin(st.ang) * V0, scia: [], fermo: { x: CX, y: CY, t: 0 }, nuovo: st.t };
      st.palle = [b];
      if (st.mira > 0) st.mira--;
      if (st.fuoco > 0) { st.fuoco--; b.fuoco = Infinity; dimmi("🔥 Palla di fuoco!"); }   // il potere caricato: tutto il tiro attraverso i pioli
      suonoTiro(); vibra(10); aggTesta();
    }

    // ---- un evento della fisica: piolo, secchio, febbre, uscita ----
    function evento(e) {
      if (e.t === "piolo") {
        var q = e.q; if (q.acceso) return;
        q.acceso = true; st.colpo.colpiti.push(q); if (e.b) e.b.nuovo = st.t;
        if (q.tipo === "arancio") { st.arPresi++; }
        var pts = PUNTI[q.tipo] * molt(st); st.colpo.punti += pts; st.punti += pts;
        scritta(q.x, q.y - 3, "+" + cifre(pts), q.tipo);
        suonoPiolo(st.colpo.nota++, q.tipo);
        if (q.tipo === "verde") attivaPotere(q, e.b);
        controllaExtra();
        if (q.tipo === "arancio" && st.arPresi >= st.arTot && !st.febbre) febbre(e.b);
        aggTesta();
      } else if (e.t === "secchio") {
        st.palline++; st.secchiPresi++; suonoSecchio(); ui.salto = 1.2; vibra([20, 30, 20]); dimmi("Pallina gratis! 🪣"); aggTesta();
        e.b.esce = true;
      } else if (e.t === "febbre") {
        var v = FEBBRE[e.slot]; st.punti += v; st.colpo.punti += v; scritta(e.slot * 20 + 10, st.H - 10, "+" + cifre(v), "febbre"); e.b.esce = true;
        [0, 4, 7, 12, 16].forEach(function (k, i) { tono(523 * Math.pow(2, k / 12), i * 0.06, 0.25, "triangle", 0.09); });
        fuochi(e.slot * 20 + 10, st.H - 15, 40); aggTesta();
      } else if (e.t === "rotto") { if (!e.q.via) { e.q.via = true; scintille(e.q.x, e.q.y, COL[e.q.tipo][0], 8); suonoScoppio(6); } }
      else if (e.t === "fuori") e.b.esce = true;
    }
    function controllaExtra() {   // tanti punti in un tiro: una pallina in più
      while (st.colpo.extra < EXTRA.length && st.colpo.punti >= EXTRA[st.colpo.extra]) { st.colpo.extra++; st.palline++; dimmi("Pallina in più! " + cifre(EXTRA[st.colpo.extra - 1]) + " punti in un tiro 🎉"); suonoSecchio(); }
    }
    function attivaPotere(q, b) {   // il piolo verde: il potere dell'aiutante
      st.verdiPresi++; suonoPotere(); vibra(25);
      var P = POTERI[st.potere]; dimmi(P.icona + " " + P.nome + (st.potere === "fuoco" ? ": pronta per il prossimo tiro!" : st.potere === "mira" ? " per i prossimi 3 tiri!" : "!"));
      if (st.potere === "bomba") {
        suonoBomba(); ui.fx.push({ t: "onda", x: q.x, y: q.y, r: 0, vita: 0.5 });
        st.pioli.forEach(function (o) { if (!o.via && !o.acceso && Math.hypot(o.x - q.x, o.y - q.y) < 15) evento({ t: "piolo", q: o, b: b }); });
        var dx = b.x - q.x, dy = b.y - q.y, d = Math.hypot(dx, dy) || 1; b.vx += dx / d * 25; b.vy += dy / d * 25 - 10;
      } else if (st.potere === "multi") {
        st.palle.push({ x: q.x, y: q.y - RP - RB - 0.2, vx: -b.vx * 0.8 + (Math.random() - 0.5) * 20, vy: -Math.abs(b.vy) * 0.6 - 15, scia: [], fermo: { x: q.x, y: q.y, t: st.t }, nuovo: st.t });
      } else if (st.potere === "mira") { st.mira += 3; }
      else if (st.potere === "fuoco") { st.fuoco = (st.fuoco || 0) + 1; }   // come in Peggle: la palla di fuoco parte al tiro dopo
    }
    function febbre(b) {   // l'ultimo arancione!
      st.febbre = true; ui.lento = 0.22; ui.tLento = 1.1; ui.zoomA = { x: b.x, y: b.y };
      rullo(0.9); vibra([40, 40, 80]);
      setTimeout(function () { if (!vivo()) return; innoGioia(); dimmi("FEBBRE MATTA! 🎉"); fuochi(50, 70, 60); }, 950);
    }

    // ---- le scritte che salgono, gli scoppi e i coriandoli ----
    function scritta(x, y, txt, tipo) { ui.scritte.push({ x: x, y: y, txt: txt, tipo: tipo, vita: 1 }); if (ui.scritte.length > 30) ui.scritte.shift(); }
    function scintille(x, y, col, n) { for (var i = 0; i < n; i++) { var a = Math.random() * PI * 2, v = 8 + Math.random() * 18; ui.fx.push({ t: "sc", x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, col: col, vita: 0.5 + Math.random() * 0.3 }); } }
    function fuochi(x, y, n) { var cols = ["#ffd43b", "#ff6b6b", "#74c0fc", "#b197fc", "#8ce99a", "#ffa94d"]; for (var i = 0; i < n; i++) { var a = Math.random() * PI * 2, v = 15 + Math.random() * 35; ui.fx.push({ t: "sc", x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, col: cols[i % cols.length], vita: 0.9 + Math.random() * 0.6 }); } }
    function dimmi(txt) { avviso.textContent = txt; avviso.classList.remove("su"); void avviso.offsetWidth; avviso.classList.add("su"); }

    // ---- la testa: punti, palline, arancioni, moltiplicatore ----
    function aggTesta() {
      hPunti.textContent = cifre(st.punti);
      hPalle.textContent = "⚪ " + st.palline;
      var rim = st.arTot - st.arPresi; hAr.textContent = "🟠 " + rim;
      fill.style.transform = "scaleX(" + (st.arPresi / Math.max(1, st.arTot)).toFixed(3) + ")";
      var m = molt(st); if (hMolt.textContent !== "x" + m) { hMolt.textContent = "x" + m; hMolt.classList.remove("su"); void hMolt.offsetWidth; hMolt.classList.add("su"); }
      hPot.textContent = POTERI[st.potere].icona + (st.mira > 0 ? " " + st.mira : "") + (st.fuoco > 0 ? " " + st.fuoco : "");   // quanti tiri col potere carico
    }

    // ---- il giro: fisica a passi fissi, poi il disegno ----
    var ult = performance.now(), anim = 0, acc = 0;
    function giro(ora) {
      if (!vivo()) return;
      var dt = Math.min(0.05, (ora - ult) / 1000); ult = ora;
      aggiorna(dt); disegna();
      anim = requestAnimationFrame(giro);
    }
    function aggiorna(dt) {
      // il rallentatore della febbre: poi torna normale
      if (ui.tLento > 0) { ui.tLento -= dt; if (ui.tLento <= 0) ui.lento = 1; }
      var dts = dt * (ui.lento || 1);
      st.t += dts;
      if (st.fase === "volo") {
        acc += dts; var ev = [];
        while (acc >= DT) {
          acc -= DT;
          st.palle.forEach(function (b) {
            if (b.esce) return;
            if (b.fuoco && st.t > b.fuoco) b.fuoco = 0;
            passo(st, b, DT, ev);
          });
          ev.forEach(evento); ev.length = 0;
        }
        st.palle.forEach(function (b) {
          b.scia.push([b.x, b.y]); if (b.scia.length > 14) b.scia.shift();
          // la pallina incastrata (come in Peggle): ferma da 1,5 secondi, o da 4 secondi senza accendere niente di nuovo, si rompono i pezzi accesi lì intorno
          if (Math.hypot(b.x - b.fermo.x, b.y - b.fermo.y) > 3) b.fermo = { x: b.x, y: b.y, t: st.t };
          var ferma = st.t - b.fermo.t > 1.5, gira = st.t - (b.nuovo || 0) > 4;
          if (ferma || gira) {
            var vicini = st.pioli.filter(function (q) { return q.acceso && !q.via && Math.hypot(q.x - b.x, q.y - b.y) < (ferma ? 7 : 11); });
            if (vicini.length) { vicini.forEach(function (q) { q.via = true; scintille(q.x, q.y, COL[q.tipo][0], 6); }); suonoScoppio(5); } else if (ferma) { b.vx += (Math.random() - 0.5) * 30; b.vy -= 20; }
            b.fermo = { x: b.x, y: b.y, t: st.t }; b.nuovo = st.t;
          }
        });
        st.palle = st.palle.filter(function (b) { return !b.esce; });
        if (!st.palle.length) finisceTiro();
      }
      if (st.fase === "pulizia") {   // i pioli accesi scoppiano uno dopo l'altro
        ui.pulizia.t -= dt;
        while (ui.pulizia.t <= 0 && ui.pulizia.lista.length) {
          var q = ui.pulizia.lista.shift(); if (!q.via) { q.via = true; scintille(q.x, q.y, COL[q.tipo][0], 7); suonoScoppio(ui.pulizia.k++); }
          ui.pulizia.t += Math.max(0.025, 0.07 - ui.pulizia.k * 0.002);
        }
        if (!ui.pulizia.lista.length && ui.pulizia.t <= -0.25) dopoPulizia();
      }
      if (ui.salto > 0) ui.salto -= dt;
      // gli effetti
      ui.fx.forEach(function (f) { f.vita -= dt; if (f.t === "sc") { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 40 * dt; } else if (f.t === "onda") f.r += 60 * dt; });
      ui.fx = ui.fx.filter(function (f) { return f.vita > 0; });
      ui.scritte.forEach(function (w) { w.vita -= dt * 0.8; w.y -= dt * 8; });
      ui.scritte = ui.scritte.filter(function (w) { return w.vita > 0; });
      // la telecamera: si avvicina alla pallina nel rallentatore della febbre
      var vuoleZoom = ui.lento < 1 && st.palle[0];
      var zt = vuoleZoom ? 1.7 : 1; ui.zoom += (zt - ui.zoom) * Math.min(1, dt * 5);
      if (vuoleZoom) { ui.zx += (st.palle[0].x - ui.zx) * Math.min(1, dt * 6); ui.zy += (st.palle[0].y - ui.zy) * Math.min(1, dt * 6); }
    }
    function finisceTiro() {
      st.fase = "pulizia"; st.colpoMax = Math.max(st.colpoMax, st.colpo.punti);
      var lista = st.colpo.colpiti.filter(function (q) { return !q.via; });
      if (st.febbre) lista = st.pioli.filter(function (q) { return q.acceso && !q.via; });
      ui.pulizia = { lista: lista, t: 0.15, k: 0 };
      if (st.colpo.punti > 0 && !st.febbre) scritta(50, st.H - 18, "Tiro: " + cifre(st.colpo.punti), "tiro");
    }
    function dopoPulizia() {
      if (st.febbre) return vinto();
      if (st.palline <= 0) return perso();
      st.fase = "mira"; nuovoViola(st); aggTesta();
    }

    // ---- il disegno ----
    function disegna() {
      if (!sfondo) { if (!cw) misura(); disegnaSfondo(); }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(sfondo, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.save();
      if (ui.zoom > 1.01) {   // lo zoom della febbre, intorno alla pallina
        var px = ox + ui.zx * S, py = oy + ui.zy * S;
        ctx.translate(cw / 2, ch / 2); ctx.scale(ui.zoom, ui.zoom); ctx.translate(-px, -py);
      }
      if (st.febbre) {   // l'arcobaleno della febbre
        var cols = ["#ff6b6b", "#ffa94d", "#ffd43b", "#8ce99a", "#74c0fc", "#b197fc"];
        ctx.globalAlpha = 0.16; for (var i = 0; i < 6; i++) { ctx.fillStyle = cols[i]; ctx.fillRect(ox, oy + ((i * 25 + st.t * 30) % (st.H + 25) - 25) * S, W * S, 25 * S * 0.5); } ctx.globalAlpha = 1;
      }
      // i pioli e i mattoncini
      st.pioli.forEach(function (q) {
        if (q.via) return;
        if (q.m) return disegnaMattone(q);
        var sp = spritePiolo(q.tipo, q.acceso), m = sp.width / dpr / 2;
        ctx.drawImage(sp, ox + q.x * S - m, oy + q.y * S - m, m * 2, m * 2);
      });
      // in fondo: il secchio, o i secchi della febbre
      if (st.febbre) {
        for (var k = 0; k < 5; k++) {
          var xx = ox + k * 20 * S, gy = oy + (st.H - 9) * S;
          ctx.fillStyle = k === 2 ? "rgba(255,212,59,.45)" : "rgba(255,255,255,.18)"; ctx.fillRect(xx + 2, gy, 20 * S - 4, 9 * S);
          ctx.fillStyle = "#fff"; ctx.font = "900 " + Math.round(3.1 * S) + "px system-ui,sans-serif"; ctx.textAlign = "center";
          ctx.fillText(cifre(FEBBRE[k] / 1000) + "k", xx + 10 * S, gy + 6.2 * S);
        }
        [20, 40, 60, 80].forEach(function (px2) { ctx.beginPath(); ctx.arc(ox + px2 * S, oy + (st.H - 4.5) * S, 1.3 * S, 0, PI * 2); ctx.fillStyle = "#e9ecef"; ctx.fill(); });
      } else {
        var sx = xSecchio(st.t), sw = SECCHIO.w * S, sh = SECCHIO.h * S, bx = ox + sx * S - sw / 2, by = oy + (st.H - 6.5) * S;
        var gb = ctx.createLinearGradient(bx, by, bx, by + sh); gb.addColorStop(0, "#ffd43b"); gb.addColorStop(1, "#e67700");
        ctx.fillStyle = gb; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + sw, by); ctx.lineTo(bx + sw - 4, by + sh); ctx.lineTo(bx + 4, by + sh); ctx.closePath(); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = "#7a3e00"; ctx.stroke();
        ctx.fillStyle = "#fff3bf"; ctx.fillRect(bx, by - 1.5, sw, 3);
      }
      // la strada per mirare
      if (st.fase === "mira") {
        var pts = strada(st, st.ang, st.mira > 0, st.fuoco > 0);
        ctx.fillStyle = st.fuoco > 0 ? "rgba(255,146,43,.95)" : st.mira > 0 ? "rgba(140,233,154,.9)" : "rgba(255,255,255,.75)";
        pts.forEach(function (p2, i) { if (i % 2) return; ctx.beginPath(); ctx.arc(ox + p2[0] * S, oy + p2[1] * S, Math.max(1.2, 0.45 * S * (1 - i / pts.length * 0.5)), 0, PI * 2); ctx.fill(); });
      }
      // le palline con la scia
      st.palle.forEach(function (b) {
        b.scia.forEach(function (p3, i) { ctx.globalAlpha = (i / b.scia.length) * 0.35; ctx.fillStyle = b.fuoco ? "#ff922b" : "#e9ecef"; ctx.beginPath(); ctx.arc(ox + p3[0] * S, oy + p3[1] * S, RB * S * (0.4 + i / b.scia.length * 0.5), 0, PI * 2); ctx.fill(); });
        ctx.globalAlpha = 1;
        var gx = ox + b.x * S, gy2 = oy + b.y * S, gp = ctx.createRadialGradient(gx - RB * S * 0.4, gy2 - RB * S * 0.4, 1, gx, gy2, RB * S);
        gp.addColorStop(0, "#ffffff"); gp.addColorStop(1, b.fuoco ? "#ff6b00" : "#adb5bd");
        ctx.fillStyle = gp; ctx.beginPath(); ctx.arc(gx, gy2, RB * S, 0, PI * 2); ctx.fill();
      });
      // il tuo avatar accanto al cannone: salta col secchio e nella febbre
      if (faccia && faccia.complete && faccia.naturalWidth) {
        var fz = 11 * S, sal = (st.febbre || ui.salto > 0) ? Math.abs(Math.sin(st.t * 9)) * 2.2 * S : 0;
        ctx.drawImage(faccia, ox + (CX - 15) * S - fz / 2, oy + 0.6 * S - sal, fz, fz * 1.02);
      }
      // il cannone
      var cx2 = ox + CX * S, cy2 = oy + CY * S;
      ctx.save(); ctx.translate(cx2, cy2); ctx.rotate(st.ang - PI / 2);
      var gc = ctx.createLinearGradient(-2 * S, 0, 2 * S, 0); gc.addColorStop(0, "#495057"); gc.addColorStop(0.5, "#ced4da"); gc.addColorStop(1, "#343a40");
      ctx.fillStyle = gc; arrot(ctx, -2.1 * S, -1 * S, 4.2 * S, 8.5 * S, 1.5 * S); ctx.fill(); ctx.strokeStyle = "#212529"; ctx.lineWidth = 1.5; ctx.stroke();
      if (st.fase === "mira" && st.palline > 0) { ctx.beginPath(); ctx.arc(0, 6 * S, RB * S, 0, PI * 2); ctx.fillStyle = "#f1f3f5"; ctx.fill(); }
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx2, cy2, 4.4 * S, 0, PI * 2); var gk = ctx.createRadialGradient(cx2 - S, cy2 - S, 1, cx2, cy2, 4.4 * S); gk.addColorStop(0, "#ffd43b"); gk.addColorStop(1, "#c92a2a"); ctx.fillStyle = gk; ctx.fill(); ctx.strokeStyle = "#5c0f0f"; ctx.lineWidth = 2; ctx.stroke();
      // gli effetti
      ui.fx.forEach(function (f) {
        if (f.t === "sc") { ctx.globalAlpha = Math.min(1, f.vita * 2); ctx.fillStyle = f.col; ctx.beginPath(); ctx.arc(ox + f.x * S, oy + f.y * S, 0.55 * S, 0, PI * 2); ctx.fill(); }
        else if (f.t === "onda") { ctx.globalAlpha = Math.max(0, f.vita * 2); ctx.strokeStyle = "#ffe066"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ox + f.x * S, oy + f.y * S, f.r * S, 0, PI * 2); ctx.stroke(); }
      });
      ctx.globalAlpha = 1;
      ui.scritte.forEach(function (w) {
        ctx.globalAlpha = Math.min(1, w.vita * 1.6);
        var big = w.tipo === "tiro" || w.tipo === "febbre";
        ctx.font = "900 " + Math.round((big ? 4.6 : w.tipo === "arancio" || w.tipo === "viola" ? 3.2 : 2.6) * S) + "px system-ui,sans-serif"; ctx.textAlign = "center";
        ctx.lineWidth = 3; ctx.strokeStyle = "rgba(20,10,50,.85)"; ctx.strokeText(w.txt, ox + w.x * S, oy + w.y * S);
        ctx.fillStyle = w.tipo === "arancio" ? "#ffc078" : w.tipo === "viola" ? "#e5dbff" : w.tipo === "verde" ? "#b2f2bb" : big ? "#ffe066" : "#d0ebff";
        ctx.fillText(w.txt, ox + w.x * S, oy + w.y * S);
      });
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // ---- fine del livello ----
    function salva(vinto, stelle) {
      var p = progressi(), k = lv + 1, nuovoRec = st.punti > (p.rec[k] || 0);
      if (vinto) { if (nuovoRec) p.rec[k] = st.punti; if (stelle > (p.stelle[k] || 0)) p.stelle[k] = stelle; }
      salvaProgressi(p);
      if (profiloOk() && SGNube.salvaProgressi) {   // nel profilo: per i trofei e per ritrovare i livelli su un altro telefono
        var incr = [["partite", 1], ["arancioni", st.arPresi], ["secchi", st.secchiPresi], ["verdi", st.verdiPresi]];
        if (vinto) { incr.push(["livelliFiniti", 1]); incr.push(["febbri", 1]); if (st.palline >= PALLINE) incr.push(["senzaPerdere", 1]); }
        var rec = [["colpoMax", st.colpoMax], ["puntiMax", st.punti]];
        if (vinto) { rec.push(["livelloMax", k]); rec.push(["l" + k, st.punti]); rec.push(["t" + k, stelle]); }
        try { SGNube.salvaProgressi(null, ID, incr.filter(function (x) { return x[1]; }), rec); } catch (e) {}
      }
      if (t.risultato) t.risultato([{ nome: io, pos: vinto ? 1 : 2, punti: st.punti }]);   // XP e statistiche (record del punteggio)
      return nuovoRec;
    }
    function vinto() {
      st.fase = "fine";
      var bonus = st.palline * 10000, totale0 = st.punti; st.punti += bonus;
      var stelle = st.palline >= 5 ? 3 : st.palline >= 3 ? 2 : 1;
      var nuovoRec = salva(true, stelle);
      [0, 4, 7, 12].forEach(function (k, i) { tono(523 * Math.pow(2, k / 12), i * 0.12, 0.3, "triangle", 0.1); });
      fuochi(30, 60, 40); fuochi(70, 60, 40);
      finestra("Livello superato! 🎉", [
        ["Punti del livello", cifre(totale0)], ["Palline rimaste: " + st.palline + " × 10.000", "+" + cifre(bonus)], ["Totale", cifre(st.punti)]
      ], "★★★".slice(0, stelle) + "☆☆☆".slice(0, 3 - stelle), nuovoRec, true);
    }
    function perso() {
      st.fase = "fine"; salva(false, 0); suonoPerso();
      var rim = st.arTot - st.arPresi;
      finestra("Palline finite!", [["Arancioni rimasti", String(rim)], ["Punti", cifre(st.punti)]], rim <= 3 ? "Per un pelo! Riprova 💪" : "Riprova, ce la fai!", false, false);
    }
    function finestra(titolo, righe, stelle, nuovoRec, vinto) {
      while (sopra.firstChild) sopra.removeChild(sopra.firstChild);
      var box = el("div", { class: "pm-fine" }, [el("h2", { text: titolo }), el("div", { class: "pm-stelle" + (vinto ? "" : " msg"), text: stelle })]);
      righe.forEach(function (r) { box.appendChild(el("div", { class: "pm-rig" }, [el("span", { text: r[0] }), el("b", { text: r[1] })])); });
      if (nuovoRec) box.appendChild(el("div", { class: "pm-rec", text: "🏅 Nuovo record del livello!" }));
      var tasti = el("div", { class: "pm-tasti" });
      if (vinto && lv + 1 < LIVELLI.length) tasti.appendChild(el("button", { class: "btn btn-primario", text: "▶ " + (LIVELLI[lv + 1].cap !== LIVELLI[lv].cap ? CAPITOLI[LIVELLI[lv + 1].cap].icona + " Capitolo " + (LIVELLI[lv + 1].cap + 1) : "Avanti: " + LIVELLI[lv + 1].nome), onclick: function () { chiudi(); partita(t, lv + 1, st.potere); } }));
      tasti.appendChild(el("button", { class: "btn " + (vinto ? "btn-fantasma" : "btn-primario"), text: "↻ " + (vinto ? "Rigioca" : "Riprova"), onclick: function () { chiudi(); partita(t, lv, st.potere); } }));
      tasti.appendChild(el("button", { class: "btn btn-fantasma", text: "☰ Livelli", onclick: function () { chiudi(); schermataLivelli(t); } }));
      box.appendChild(tasti);
      sopra.appendChild(box); sopra.classList.add("su");
    }
    function chiudi() { cancelAnimationFrame(anim); window.removeEventListener("resize", misura); }
    function esci() {   // a livello cominciato chiede prima (un tocco sbagliato non butta la partita)
      if (st.fase === "fine" || (st.palline >= PALLINE && st.fase === "mira")) { chiudi(); return schermataLivelli(t); }
      while (sopra.firstChild) sopra.removeChild(sopra.firstChild);
      sopra.appendChild(el("div", { class: "pm-fine" }, [el("h2", { text: "Lasciare il livello?" }), el("div", { class: "pm-stelle msg", text: "I punti di questa partita si perdono." }),
        el("div", { class: "pm-tasti" }, [
          el("button", { class: "btn btn-primario", text: "▶ Continua a giocare", onclick: function () { sopra.classList.remove("su"); } }),
          el("button", { class: "btn btn-fantasma", text: "☰ Torna ai livelli", onclick: function () { chiudi(); schermataLivelli(t); } }) ])]));
      sopra.classList.add("su");
    }

    misura(); aggTesta();
    window.__PMpartita = { st: function () { return st; }, evento: evento, tira: tira, mira: function (a) { st.ang = a; }, avanza: function (sec) { for (var i = 0; i < sec * 60; i++) aggiorna(1 / 60); } };   // (per le prove)
    dimmi(CAPITOLI[LIVELLI[lv].cap].icona + " " + LIVELLI[lv].nome + " · prendi tutti i 🟠");
    if (lv < 2) setTimeout(function () { if (vivo() && st.fase === "mira") dimmi("Tieni premuto per mirare · tocca per tirare"); }, 2500);
    anim = requestAnimationFrame(function (o) { ult = o; giro(o); });
  }

  // ---------- lo stile (una volta sola, col prefisso pm-) ----------
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.pm-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#1a1440}",
      ".schermata.pm-piena>.testa,.schermata.pm-piena>.piede{display:none}",
      ".schermata.pm-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".pm-scena{position:relative;height:var(--alt,100dvh);overflow:hidden;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}",
      ".pm-tavolo{position:absolute;inset:0;width:100%;height:100%;touch-action:none}",
      ".pm-testa{position:absolute;left:8px;right:8px;top:calc(8px + env(safe-area-inset-top));z-index:3;display:flex;align-items:center;gap:6px;pointer-events:none}",
      ".pm-testa>*{pointer-events:auto}",
      ".pm-tasto{flex:none;width:36px;height:36px;border:0;border-radius:12px;padding:0;cursor:pointer;font:inherit;font-size:1.2rem;font-weight:900;line-height:1;color:#fff;background:rgba(255,255,255,.14)}",
      ".pm-centro{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;pointer-events:none}",
      ".pm-punti{font-weight:900;font-size:1.35rem;line-height:1;color:#ffe066;text-shadow:0 2px 0 rgba(0,0,0,.4)}",
      ".pm-riga{display:flex;align-items:center;gap:6px;width:100%;max-width:260px}",
      ".pm-ar{flex:none;font-weight:900;font-size:.78rem;color:#ffc078}",
      ".pm-barra{position:relative;flex:1;height:10px;border-radius:999px;background:rgba(255,255,255,.14);overflow:visible}",
      ".pm-fill{position:absolute;inset:0;border-radius:999px;background:linear-gradient(90deg,#ffa94d,#f76707);transform-origin:0 50%;transform:scaleX(0);transition:transform .25s}",
      ".pm-tacca{position:absolute;top:-1px;bottom:-1px;width:2px;margin-left:-1px;background:rgba(255,255,255,.55);font-style:normal;font-size:0}",
      ".pm-molt{flex:none;min-width:2.2em;text-align:center;font-weight:900;font-size:.85rem;padding:1px 6px;border-radius:999px;color:#1a1440;background:#ffe066}",
      ".pm-molt.su{animation:pmPop .5s cubic-bezier(.3,1.6,.5,1)}",
      "@keyframes pmPop{0%{transform:scale(1)}40%{transform:scale(1.5)}100%{transform:scale(1)}}",
      ".pm-pot{flex:none;height:32px;padding:0 8px;border-radius:12px;display:flex;align-items:center;font-weight:900;font-size:.95rem;color:#fff;background:rgba(140,233,154,.18);box-shadow:inset 0 0 0 1.5px rgba(140,233,154,.5)}",
      ".pm-palle{flex:none;height:32px;padding:0 9px;border-radius:12px;display:flex;align-items:center;font-weight:900;font-size:.95rem;color:#fff;background:rgba(255,255,255,.14)}",
      ".pm-avviso{position:absolute;left:50%;top:calc(76px + env(safe-area-inset-top));z-index:4;transform:translateX(-50%);padding:8px 14px;border-radius:999px;white-space:nowrap;font-weight:900;font-size:.9rem;color:#1a1440;background:#ffe066;box-shadow:0 6px 16px rgba(0,0,0,.35);opacity:0;pointer-events:none}",
      ".pm-avviso.su{animation:pmAvviso 2.2s ease forwards}",
      "@keyframes pmAvviso{0%{opacity:0;transform:translate(-50%,-8px) scale(.9)}12%{opacity:1;transform:translate(-50%,0) scale(1)}80%{opacity:1}100%{opacity:0}}",
      ".pm-sopra{position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,6,30,.55);opacity:0;pointer-events:none;transition:opacity .3s}",
      ".pm-sopra.su{opacity:1;pointer-events:auto}",
      ".pm-fine{width:100%;max-width:340px;padding:18px 16px;border-radius:22px;text-align:center;color:#fff;background:linear-gradient(180deg,#3b2a86,#22195a);box-shadow:0 12px 40px rgba(0,0,0,.5),inset 0 0 0 2px rgba(190,170,255,.35);animation:pmEntra .45s cubic-bezier(.3,1.4,.5,1)}",
      "@keyframes pmEntra{from{transform:scale(.6);opacity:0}}",
      ".pm-fine h2{margin:0 0 6px;font-size:1.4rem}",
      ".pm-stelle{font-size:2.2rem;color:#ffd43b;letter-spacing:.1em;margin-bottom:8px}",
      ".pm-stelle.msg{font-size:1rem;color:#d0bfff;letter-spacing:0}",
      ".pm-rig{display:flex;justify-content:space-between;gap:10px;padding:5px 2px;border-bottom:1px solid rgba(255,255,255,.1);font-size:.9rem}",
      ".pm-rig b{color:#ffe066}",
      ".pm-rec{margin-top:8px;font-weight:900;color:#8ce99a}",
      ".pm-tasti{display:flex;flex-direction:column;gap:8px;margin-top:14px}",
      // la schermata dei livelli
      ".pm-aiutanti{display:flex;align-items:center;gap:6px;margin:4px 0 12px;flex-wrap:wrap}",
      ".pm-aiu-et{font-weight:800;font-size:.85rem;color:var(--testo-tenue)}",
      ".pm-aiu{width:40px;height:40px;border:0;border-radius:50%;cursor:pointer;font-size:1.25rem;background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 2px rgba(255,255,255,.12)}",
      ".pm-aiu.attiva{background:rgba(255,212,59,.25);box-shadow:inset 0 0 0 2.5px #ffd43b}",
      ".pm-pot-nome{font-weight:900;font-size:.9rem;color:#ffe066}",
      ".pm-livelli{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}",
      ".pm-lv{display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 4px 8px;border:0;border-radius:16px;cursor:pointer;font:inherit;color:#fff;background:linear-gradient(180deg,#4c3ba8,#2d2275);box-shadow:var(--ombra)}",
      ".pm-lv b{font-size:1.4rem;line-height:1.1}",
      ".pm-lv-nome{font-size:.7rem;font-weight:800;line-height:1.15;min-height:2.3em;display:flex;align-items:center;text-align:center}",
      ".pm-lv-stelle{font-size:.9rem;color:#ffd43b;letter-spacing:.05em}",
      ".pm-lv small{font-size:.66rem;color:#d0bfff;min-height:1em}",
      ".pm-lv.chiuso{opacity:.45;cursor:default}",
      ".pm-cap{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:14px 0 8px;padding:8px 12px;border-radius:14px;font-weight:900;font-size:.95rem;color:#fff}",
      ".pm-cap small{font-weight:800;color:#ffe066}",
      ".pm-cap-spazio{background:linear-gradient(90deg,#2d2275,#4c3ba8)}", ".pm-cap-natura{background:linear-gradient(90deg,#2b8a3e,#69b34c)}", ".pm-cap-mare{background:linear-gradient(90deg,#0b4f7a,#1c8fc7)}",
      ".pm-lv-natura{background:linear-gradient(180deg,#5aa95f,#2b6e34)}", ".pm-lv-mare{background:linear-gradient(180deg,#1c8fc7,#0b4f7a)}",
      ".pm-lv.fatto{box-shadow:var(--ombra),inset 0 0 0 2px rgba(255,212,59,.55)}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "Palla Matta", icona: "🔴",
    descrizione: "Spara la pallina dall'alto e falla rimbalzare sui pioli: fai scoppiare tutti gli arancioni con 10 palline. Livelli, poteri e la febbre finale!",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 2,
    modi: [{ modo: "solo", icona: "🎯", nome: "Da solo", sotto: "I livelli, uno dopo l'altro" }],
    regole: [
      "Tieni premuto (o trascina) per <b>mirare</b>: i puntini mostrano dove va la pallina. Lasciando il dito non parte niente: dai un <b>tocco veloce</b> per tirare.",
      "La pallina rimbalza sui pioli e li <b>accende</b>; quando esce, i pioli accesi scoppiano.",
      "Fai scoppiare tutti i pioli <b>arancioni</b> con <b>10 palline</b>. Più arancioni prendi, più vale ogni piolo: <b>x2, x3, x5, x10</b>.",
      "Il piolo <b>viola</b> vale 500 punti e cambia posto a ogni tiro. I pioli <b>verdi</b> attivano il potere del tuo <b>aiutante</b> (bomba, multipalla, mira lunga o palla di fuoco).",
      "Se la pallina entra nel <b>secchio</b> che si muove in fondo, la riprendi. Tanti punti in un tiro regalano palline.",
      "Con l'ultimo arancione parte la <b>Febbre Matta</b>: in fondo ci sono i secchi da 10.000, 25.000 e 50.000 punti. Ogni pallina avanzata vale 10.000 punti."
    ],
    impostazioni: function (box, dove, aiuti) {   // prima di cominciare: il tuo aiutante (lo ritrovi anche nei livelli)
      var el = aiuti.el, p = progressi(); dove.modo = aiuti.modo || "solo";
      if (!POTERI[p.potere]) p.potere = "bomba";
      box.appendChild(el("div", { class: "etichetta", text: "Il tuo aiutante: il potere dei pioli verdi" }));
      var g = el("div", { class: "modo-griglia", style: "grid-template-columns:1fr" });
      ORDINE_POTERI.forEach(function (k) {
        var P = POTERI[k], b = el("button", { class: "modo-chip" + (p.potere === k ? " attiva" : ""), onclick: function () {
          p.potere = k; salvaProgressi(p); [].forEach.call(g.children, function (x) { x.className = "modo-chip"; }); b.className = "modo-chip attiva"; vibra(6);
        } }, [el("div", { class: "mt", text: P.icona + " " + P.nome }), el("div", { class: "ms", text: P.sotto })]);
        g.appendChild(b);
      });
      box.appendChild(g);
    },
    avvia: function (t) { schermataLivelli(t); }
  });

  // per le prove: la fisica e i livelli, senza disegno
  window.__PM = { LIVELLI: LIVELLI, creaLivello: creaLivello, nuovoStato: nuovoStato, passo: passo, strada: strada, molt: molt, W: W, H: H, DT: DT, V0: V0, CX: CX, CY: CY };
})();

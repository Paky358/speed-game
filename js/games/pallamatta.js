/* =========================================================
   SPeeD GAME — PALLA MATTA (stile Peggle)
   In alto c'è il cannone: trascini il dito (dove vuoi) per girarlo, si vede la strada della pallina; un tocco veloce tira.
   La pallina scende rimbalzando sui pioli: quelli toccati si accendono e, quando la pallina esce, scoppiano.
   Devi far scoppiare tutti i pioli ARANCIONI con 10 palline. Il secchio in fondo, se ci entri, ti ridà la pallina.
   - pioli: blu 10 punti, arancioni 100, viola 500 (cambia posto a ogni tiro), verdi = il potere del tuo aiutante;
   - più arancioni hai preso, più vale ogni piolo (x2, x3, x5, x10);
   - l'ultimo arancione: rallentatore, poi la FEBBRE MATTA con i secchi da 10.000 a 50.000 punti.
   Tenendo premuto mentre la pallina vola, il tiro va più veloce (è già calcolato: non cambia niente).
   Modi: da solo coi livelli (5 capitoli); sfida a turni da 2 a 4 sullo stesso telefono o online (ogni tiro lo calcola un telefono solo e tutti lo riguardano uguale).
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
    { nome: "Il mare", icona: "🐠", sfondo: "mare" },
    { nome: "I dolci", icona: "🍭", sfondo: "dolci" },
    { nome: "Il luna park", icona: "🎡", sfondo: "festa" }
  ];
  var LIVELLI = [
    // ---- 🚀 lo spazio ----
    { cap: 0, nome: "Stelle cadenti", arancioni: 9, vista: true, fa: function (l) {
      griglia(l, 10, 36, 10, 5, 8.9, 8, true);   // il cielo pieno di stelline
      [[26, 100], [56, 116], [84, 96]].forEach(function (s) { stellina(l, s[0], s[1], 4.6); mattoni(l, s[0] - 6, s[1] - 7, s[0] - 21, s[1] - 24, 3, 1.0); });   // le stelle cadenti con la scia
      riga(l, 22, 80, 78, 80, 8);
      curva(l, 50, 136, 46, 12, PI * 1.08, PI * 1.36, 4.6); curva(l, 50, 136, 46, 12, PI * 1.64, PI * 1.92, 4.6);
    } },
    { cap: 0, nome: "Il pianeta con l'anello", arancioni: 10, vista: true, fa: function (l) {
      cerchio(l, 50, 70, 16, 15); cerchio(l, 50, 70, 10, 10); cerchio(l, 50, 70, 4.4, 5);   // il pianeta (la pallina passa tra i pioli)
      curva(l, 50, 74, 38, 10, PI * 0.04, PI * 0.96, 4.6);   // l'anello davanti
      curva(l, 50, 74, 38, 10, PI * 1.0, PI * 1.3); curva(l, 50, 74, 38, 10, PI * 1.7, PI * 2.0);   // l'anello dietro
      curva(l, 16, 112, 9, 9, PI * 1.0, PI * 2.0); arco(l, 16, 112, 9, PI * 0.15, PI * 0.85, 4); l.push([16, 112]);   // le lune
      curva(l, 84, 112, 9, 9, PI * 1.0, PI * 2.0); arco(l, 84, 112, 9, PI * 0.15, PI * 0.85, 4); l.push([84, 112]);
      griglia(l, 28, 36, 6, 2, 8.8, 8, true); stellina(l, 12, 42, 4.4); stellina(l, 88, 42, 4.4);
      griglia(l, 34, 102, 4, 3, 10.6, 9, true); riga(l, 10, 132, 90, 132, 11);
    } },
    { cap: 0, nome: "Il razzo", arancioni: 13, fa: function (l) {
      curva(l, 50, 62, 11, 26, PI * 1.0, PI * 1.5); curva(l, 50, 62, 11, 26, PI * 1.5, PI * 2.0);   // la punta
      mattoni(l, 39, 66, 39, 102, 4, 4.8); mattoni(l, 61, 66, 61, 102, 4, 4.8);   // il corpo (con gli oblò per passare)
      cerchio(l, 50, 76, 5.6, 6); l.push([50, 76]); riga(l, 45, 90, 55, 90, 2); riga(l, 45, 98, 55, 98, 2);
      mattoni(l, 38, 92, 26, 110, 3, 1.0); mattoni(l, 62, 92, 74, 110, 3, 1.0);   // le alette
      riga(l, 42, 110, 58, 110, 3); riga(l, 46, 117, 54, 117, 2); l.push([50, 124]);   // le fiamme
      griglia(l, 8, 36, 3, 4, 9, 8, true); griglia(l, 74, 36, 3, 4, 9, 8, true);
      stellina(l, 14, 80, 4.4); stellina(l, 86, 80, 4.4); stellina(l, 16, 120, 4.4); stellina(l, 84, 120, 4.4);
      riga(l, 8, 134, 92, 134, 12);
    } },
    { cap: 0, nome: "La luna e le stelle", arancioni: 15, fa: function (l) {
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
    } },
    // ---- 🍭 i dolci ----
    { cap: 3, nome: "Il lecca-lecca", arancioni: 18, fa: function (l) {
      tonda(66, function () { for (var a = 0.4, r; a < 12.6; a += 5.4 / r) { r = 4 + a * 1.5; pt(l, 50 + Math.cos(a) * r, 66 + Math.sin(a) * r); } });   // la spirale
      curva(l, 50, 66, 27, 27, PI * 1.12, PI * 1.88, 4.6);   // il bordo di sopra
      mattoni(l, 50, 98, 50, 130, 4, 1.0);   // il bastoncino
      [[15, 104], [85, 104]].forEach(function (c) { tonda(c[1], function () {   // le caramelle incartate
        pt(l, c[0], c[1]); mattone(l, c[0] - 8, c[1] - 3.5, c[0] - 4.5, c[1]); mattone(l, c[0] - 8, c[1] + 3.5, c[0] - 4.5, c[1]); mattone(l, c[0] + 4.5, c[1], c[0] + 8, c[1] - 3.5); mattone(l, c[0] + 4.5, c[1], c[0] + 8, c[1] + 3.5);
      }); });
      griglia(l, 8, 36, 3, 3, 9, 8, true); griglia(l, 74, 36, 3, 3, 9, 8, true);   // i confettini
      riga(l, 10, 126, 36, 126, 4); riga(l, 64, 126, 90, 126, 4);
    } },
    { cap: 3, nome: "La torta", arancioni: 20, fa: function (l) {
      mattoni(l, 20, 120, 80, 120, 6, 4.6); mattoni(l, 27, 100, 73, 100, 5, 4.6); mattoni(l, 34, 80, 66, 80, 4, 4.6);   // i tre piani (con gli spazi per passare)
      riga(l, 24, 112, 76, 112, 7); riga(l, 31, 92, 69, 92, 5); riga(l, 38, 72, 62, 72, 4);   // la panna
      [41, 50, 59].forEach(function (x) { mattone(l, x, 56, x, 64); pt(l, x, 49); });   // le candeline accese
      cerchio(l, 13, 70, 5, 5); cerchio(l, 87, 70, 5, 5); l.push([13, 70]); l.push([87, 70]);   // le ciliegie
      griglia(l, 10, 36, 3, 2, 9, 8, true); griglia(l, 72, 36, 3, 2, 9, 8, true);
      curva(l, 50, 126, 42, 8, PI * 0.08, PI * 0.92, 4.6);   // il piatto
      riga(l, 8, 94, 8, 118, 3); riga(l, 92, 94, 92, 118, 3);
    } },
    { cap: 3, nome: "Il gelato", arancioni: 20, fa: function (l) {
      spezzata(l, [[34, 92], [50, 130], [66, 92]], 4, 4.6);   // il cono
      riga(l, 44, 100, 56, 100, 3); riga(l, 47, 109, 53, 109, 2);   // la cialda
      tonda(70, function () { cerchio(l, 39, 76, 9, 9); cerchio(l, 61, 76, 9, 9); cerchio(l, 50, 60, 9, 9); pt(l, 39, 76); pt(l, 61, 76); pt(l, 50, 60); });   // le palline di gelato
      stellina(l, 50, 42, 4.4);   // la ciliegina
      griglia(l, 8, 40, 3, 4, 9, 8, true); griglia(l, 74, 40, 3, 4, 9, 8, true);   // le codette
      riga(l, 8, 118, 24, 128, 3); riga(l, 92, 118, 76, 128, 3);
      mattoni(l, 6, 92, 18, 104, 2, 1.0); mattoni(l, 94, 92, 82, 104, 2, 1.0);
    } },
    { cap: 3, nome: "Le ciambelle", arancioni: 22, fa: function (l) {
      [[27, 62, 13], [73, 62, 13], [50, 104, 14]].forEach(function (c) {   // la glassa di mattoncini (con gli spazi), dentro i pioli, in mezzo il buco
        curva(l, c[0], c[1], c[2], c[2], -PI / 2, PI * 1.5, 4.6);
        cerchio(l, c[0], c[1], c[2] - 6, Math.round((c[2] - 6) * 2 * PI / 6.2));
      });
      griglia(l, 14, 36, 8, 1, 10, 8, false);   // le codette colorate
      stellina(l, 12, 100, 4.4); stellina(l, 88, 100, 4.4); l.push([50, 82]);
      riga(l, 8, 132, 30, 132, 3); riga(l, 70, 132, 92, 132, 3);
    } },
    { cap: 3, nome: "I biscotti", arancioni: 22, fa: function (l) {
      [[20, 50], [50, 46], [80, 50], [35, 78], [65, 78], [20, 106], [50, 110], [80, 106]].forEach(function (b) { cerchio(l, b[0], b[1], 7, 7); l.push(b); });   // i biscotti con la goccia di cioccolato
      mattoni(l, 4, 72, 10, 92, 2, 1.0); mattoni(l, 96, 72, 90, 92, 2, 1.0);
      curva(l, 50, 120, 46, 14, PI * 0.08, PI * 0.92, 4.6);   // il vassoio
      riga(l, 35, 94, 65, 94, 4);
    } },
    { cap: 3, nome: "Il castello di zucchero", arancioni: 25, fa: function (l) {
      mattoni(l, 12, 74, 12, 124, 4, 1.0); mattoni(l, 26, 74, 26, 124, 4, 1.0); mattoni(l, 74, 74, 74, 124, 4, 1.0); mattoni(l, 88, 74, 88, 124, 4, 1.0);   // le torri (aperte sotto)
      riga(l, 19, 82, 19, 118, 4); riga(l, 81, 82, 81, 118, 4);   // le finestre
      spezzata(l, [[10, 68], [19, 52], [28, 68]], 2, 1.0); spezzata(l, [[72, 68], [81, 52], [90, 68]], 2, 1.0);   // i tetti a punta
      l.push([19, 44]); l.push([81, 44]);   // le bandierine
      mattoni(l, 34, 86, 66, 86, 4, 4.6); riga(l, 36, 78, 64, 78, 5);   // le mura e i merli
      curva(l, 50, 120, 10, 14, PI, PI * 2, 4.6);   // il portone
      riga(l, 36, 96, 64, 96, 5); riga(l, 37, 108, 37, 128, 3); riga(l, 63, 108, 63, 128, 3);
      griglia(l, 36, 38, 4, 3, 9.5, 8, true);   // le nuvole di zucchero filato
      riga(l, 5, 80, 5, 122, 5); riga(l, 95, 80, 95, 122, 5); stellina(l, 8, 40, 4.4); stellina(l, 92, 40, 4.4);   // i cespugli di confetti e le stelline
    } },
    // ---- 🎡 il luna park ----
    { cap: 4, nome: "La ruota panoramica", arancioni: 20, fa: function (l) {
      tonda(74, function () {
        cerchio(l, 50, 74, 30, 18);   // le cabine
        for (var k = 0; k < 6; k++) { var a = k * PI / 3 + PI / 6; mattone(l, 50 + Math.cos(a) * 8, 74 + Math.sin(a) * 8, 50 + Math.cos(a) * 20, 74 + Math.sin(a) * 20); }   // i raggi
        pt(l, 50, 74); for (k = 0; k < 6; k++) pt(l, 50 + Math.cos(k * PI / 3) * 14, 74 + Math.sin(k * PI / 3) * 14);   // il mozzo e le luci tra i raggi
      });
      mattoni(l, 43, 110, 33, 132, 2, 1.0); mattoni(l, 57, 110, 67, 132, 2, 1.0);   // le gambe
      griglia(l, 6, 36, 2, 5, 9, 8, true); griglia(l, 85, 36, 2, 5, 9, 8, true); griglia(l, 32, 36, 4, 1, 12, 8, false);
      stellina(l, 11, 94, 4.4); stellina(l, 89, 94, 4.4);   // i palloncini venduti al banchetto
      riga(l, 8, 128, 24, 128, 3); riga(l, 76, 128, 92, 128, 3); riga(l, 10, 114, 26, 114, 3); riga(l, 74, 114, 90, 114, 3);
    } },
    { cap: 4, nome: "Le montagne russe", arancioni: 22, fa: function (l) {
      var bin = [], i;
      for (i = 0; i <= 10; i++) bin.push([4 + i * 9.2, 80 - Math.sin(i * 0.95) * (i < 6 ? 22 : 13)]);
      spezzata(l, bin, 1, 4.6);   // il binario (si passa tra un pezzo e l'altro)
      for (i = 0; i < 10; i++) {
        var mx = (bin[i][0] + bin[i + 1][0]) / 2, my = (bin[i][1] + bin[i + 1][1]) / 2;
        l.push([mx, my - 6]);   // i vagoncini
        riga(l, mx, my + 9, mx, 130, Math.max(1, Math.round((121 - my) / 9)));   // i piloni
      }
      griglia(l, 8, 36, 10, 2, 9.4, 8, true); stellina(l, 88, 126, 4.4);   // le stelle sopra la corsa
    } },
    { cap: 4, nome: "La giostra", arancioni: 22, fa: function (l) {
      spezzata(l, [[16, 62], [50, 42], [84, 62]], 3, 1.0); l.push([50, 34]);   // il tetto e la bandierina
      riga(l, 20, 68, 80, 68, 7);   // le frange
      [24, 41, 59, 76].forEach(function (x, j) {   // i pali coi cavallini (su e giù)
        var yc = j % 2 ? 92 : 104; mattone(l, x - 4, yc, x + 4, yc);
        for (var y = 78; y <= 118; y += 10) if (Math.abs(y - yc) > 5) l.push([x, y]);
      });
      [32.5, 50, 67.5].forEach(function (x) { riga(l, x, 84, x, 116, 3); });   // le luci tra i cavallini
      mattoni(l, 14, 126, 86, 126, 6, 4.6);   // la pedana
      stellina(l, 8, 84, 4.4); stellina(l, 92, 84, 4.4); griglia(l, 6, 36, 2, 3, 9, 8, true); griglia(l, 85, 36, 2, 3, 9, 8, true);
      riga(l, 6, 104, 6, 128, 3); riga(l, 94, 104, 94, 128, 3);
    } },
    { cap: 4, nome: "I palloncini", arancioni: 22, fa: function (l) {
      [[20, 52], [42, 44], [64, 52], [84, 44], [30, 80], [55, 82], [78, 78]].forEach(function (b) {   // i palloncini col filo
        ellisse(l, b[0], b[1], 6, 7, 7); l.push(b);
        mattone(l, b[0], b[1] + 9.5, b[0] + (50 - b[0]) * 0.12, b[1] + 17);
      });
      riga(l, 10, 112, 90, 112, 9);
      curva(l, 50, 140, 28, 8, PI * 1.15, PI * 1.85, 4.6); riga(l, 8, 128, 20, 128, 2); riga(l, 80, 128, 92, 128, 2);
    } },
    { cap: 4, nome: "Il tiro a segno", arancioni: 24, fa: function (l) {
      [[26, 62, 12], [74, 62, 12], [50, 98, 12]].forEach(function (c) {   // i bersagli: il bordo di mattoncini, dentro i cerchi
        curva(l, c[0], c[1], c[2], c[2], -PI / 2, PI * 1.5, 4.6);
        cerchio(l, c[0], c[1], 6.4, 6); l.push([c[0], c[1]]);
      });
      riga(l, 8, 36, 92, 36, 10);   // le paperelle
      griglia(l, 10, 112, 3, 3, 7, 7, true); griglia(l, 76, 112, 3, 3, 7, 7, true);   // le piramidi di barattoli
      mattoni(l, 30, 128, 70, 128, 3, 4.6); l.push([50, 76]);
    } },
    { cap: 4, nome: "I fuochi d'artificio", arancioni: 25, fa: function (l) {
      [[28, 56, 13], [72, 62, 13], [50, 100, 14]].forEach(function (f) {   // gli scoppi: i raggi di pioli, sotto la scia del razzo
        tonda(f[1], function () { pt(l, f[0], f[1]); for (var k = 0; k < 8; k++) { var a = k * PI / 4; pt(l, f[0] + Math.cos(a) * 6.5, f[1] + Math.sin(a) * 6.5); pt(l, f[0] + Math.cos(a + PI / 8) * f[2], f[1] + Math.sin(a + PI / 8) * f[2]); } });
        mattoni(l, f[0] + (f[0] < 50 ? -2 : 2), f[1] + f[2] + 4, f[0] + (f[0] < 50 ? -5 : 5), f[1] + f[2] + 14, 1);
      });
      griglia(l, 44, 36, 2, 2, 9, 8, true); stellina(l, 10, 96, 4.4); stellina(l, 90, 100, 4.4);
      riga(l, 8, 130, 30, 130, 3); riga(l, 70, 130, 92, 130, 3);
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
    if (LIVELLI[i].vista) {   // i primi due livelli: arancioni ben in vista (pioli tondi nella parte alta), per chi gioca la prima volta
      var alto = function (k2i) { return !p[k2i].m && p[k2i].y < (hh || H) * 0.55; };
      idx = idx.filter(alto).concat(idx.filter(function (k2i) { return !alto(k2i); }));
    }
    var nA = Math.min(LIVELLI[i].arancioni || 25, Math.round(p.length * 0.3));   // 25 come in Peggle (i primi livelli ne hanno meno)
    for (k = 0; k < nA; k++) p[idx[k]].tipo = "arancio";
    if (scegliVerdi !== false) {   // i due verdi (solo pioli tondi): a caso ogni volta
      var blu = p.filter(function (q) { return q.tipo === "blu" && !q.m; });
      for (k = 0; k < 2 && blu.length; k++) { var c = Math.floor(Math.random() * blu.length); blu[c].tipo = "verde"; blu.splice(c, 1); }
    }
    return p;
  }

  // ---------- lo stato di una partita ----------
  // gioc: chi gioca [{ nome, potere, … }] (da solo uno, nelle sfide da 2 a 4); pioli: il tavolo già fatto (online: quello dell'host)
  function nuovoStato(lv, gioc, pioli, hh) {   // (hh: il tavolo più alto dei telefoni lunghi)
    hh = pioli ? H : (hh || H);
    var p = pioli || creaLivello(lv, true, hh);
    gioc = gioc || [{ nome: "Tu" }];
    gioc.forEach(function (g) { g.punti = 0; g.palline = PALLINE; g.mira = 0; g.fuoco = 0; g.verdi = 0; g.secchi = 0; g.colpoMax = 0; if (!POTERI[g.potere]) g.potere = "bomba"; });
    return { lv: lv, H: hh, pioli: p, gioc: gioc, turno: 0, seq: 0, fase: "mira", ang: PI / 2, t: 0, febbre: false, colpo: null,
      arTot: p.filter(function (q) { return q.tipo === "arancio"; }).length, arPresi: 0 };
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
  var CHIAVE_SUONI = "sg-pm-suoni", CHIAVE_VELOCE = "sg-pm-veloce", NOTE = [0, 2, 4, 5, 7, 9, 11];
  var VELOCE = 2.5;   // tenendo premuto durante il volo: quante volte più veloce
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
  function sbloccato(p, i, t) { return i === 0 || (p.stelle[i] || 0) > 0 || tuttiAperti(t); }
  function tuttiAperti(t) { return !!(t && t.nomeProfilo && String(t.nomeProfilo() || "").trim().toUpperCase() === "IL PAPPONE"); }   // il proprietario prova i livelli in ordine sparso

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
        p.potere = k; salvaProgressi(p); [].forEach.call(riga.querySelectorAll(".pm-aiu"), function (x) { x.classList.remove("attiva"); }); b.classList.add("attiva"); nomePot.textContent = POTERI[k].nome;
      } });
      riga.appendChild(b);
    });
    riga.appendChild(nomePot);
    s._contenuto.appendChild(riga);
    var msgChiuso = el("div", { class: "pm-msg-chiuso" }), tMsg = null;   // toccando un livello chiuso: cosa fare per aprirlo (sopra a tutto, sparisce da solo)
    CAPITOLI.forEach(function (C, c) {   // i livelli divisi per capitolo, ognuno col suo colore
      var mie = [], stelleCap = 0;
      LIVELLI.forEach(function (L, i) { if (L.cap === c) { mie.push(i); stelleCap += p.stelle[i + 1] || 0; } });
      s._contenuto.appendChild(el("div", { class: "pm-cap pm-cap-" + C.sfondo }, [el("span", { text: C.icona + " Capitolo " + (c + 1) + " · " + C.nome }), el("small", { text: "★ " + stelleCap + "/" + mie.length * 3 })]));
      var lv = el("div", { class: "pm-livelli" });
      mie.forEach(function (i, n) {
        var L = LIVELLI[i], ok = sbloccato(p, i, t), st = p.stelle[i + 1] || 0;
        var bt = el("button", { class: "pm-lv pm-lv-" + C.sfondo + (ok ? "" : " chiuso") + (st ? " fatto" : ""), onclick: function () {
          if (ok) return partita(t, i, p.potere);
          var prima = i - 1; while (prima > 0 && !sbloccato(p, prima, t)) prima--;   // il livello aperto da finire per andare avanti
          msgChiuso.textContent = "🔒 Per aprirlo finisci prima «" + LIVELLI[prima].nome + "»";
          document.body.appendChild(msgChiuso); msgChiuso.classList.remove("su"); void msgChiuso.offsetWidth; msgChiuso.classList.add("su");
          clearTimeout(tMsg); tMsg = setTimeout(function () { if (msgChiuso.parentNode) msgChiuso.parentNode.removeChild(msgChiuso); }, 2700);
          bt.classList.remove("scossa"); void bt.offsetWidth; bt.classList.add("scossa");
        } }, [
          el("b", { text: ok ? String(n + 1) : "🔒" }),
          el("span", { class: "pm-lv-nome", text: L.nome }),
          el("span", { class: "pm-lv-stelle", text: ok ? "★★★".slice(0, st) + "☆☆☆".slice(0, 3 - st) : "" }),
          el("small", { text: p.rec[i + 1] ? cifre(p.rec[i + 1]) : "" })
        ]);
        lv.appendChild(bt);
      });
      s._contenuto.appendChild(lv);
    });
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "‹ Esci", onclick: function () { t.esci(); } }));
    t.mostra(s);
  }

  // =========================================================
  //  IL TIRO CALCOLATO TUTTO PRIMA: fisica, punti ed eventi, come un filmato
  //  Lo calcola un telefono solo (online: l'host) e poi tutti lo riguardano uguale.
  //  rec = { a: angolo, t0: orologio del secchio, fuoco, dur: secondi, fr: fotogrammi (30 al secondo: [x,y]×10 per pallina, 0 = uscita), ev: eventi }
  //  eventi: p = pezzo acceso (i, pts) · v = verde (i, pot) · x = pallina in più (n) · s = secchio · F = febbre · fb = secchio della febbre (slot, pts) · r = pezzo rotto (i)
  // =========================================================
  var FPS_REC = 30, PASSI_FR = 8;
  function simulaTiro(st, ang, g) {   // g: chi tira (il suo aiutante e la palla di fuoco carica)
    var pioli = st.pioli.map(function (q) { return { x: q.x, y: q.y, m: q.m, len: q.len, tipo: q.tipo, acceso: q.acceso, via: q.via }; });
    var S2 = { pioli: pioli, H: st.H, febbre: st.febbre, t: st.t }, ar = st.arPresi, punti = 0, extra = 0, tt = 0, ev = [], fr = [], pe = [];
    var fuoco = (g.fuoco || 0) > 0;
    var b0 = { x: CX + Math.cos(ang) * 6, y: CY + Math.sin(ang) * 6, vx: Math.cos(ang) * V0, vy: Math.sin(ang) * V0, fuoco: fuoco, nuovo: 0 };
    b0.fermo = { x: b0.x, y: b0.y, t: 0 };
    var palle = [b0], tutte = [b0];
    function tempo() { return Math.round(tt * 1000) / 1000; }
    function quanto() { var f = ar / Math.max(1, st.arTot), m = 1; MOLT.forEach(function (x) { if (f >= x[0]) m = x[1]; }); return m; }
    function accendi(q, b) {
      if (q.acceso || q.via) return;
      q.acceso = true; if (b) b.nuovo = tt;
      if (q.tipo === "arancio") ar++;
      var pts = PUNTI[q.tipo] * quanto(); punti += pts;
      ev.push({ t: tempo(), k: "p", i: pioli.indexOf(q), pts: pts });
      if (q.tipo === "verde") verde(q, b);
      while (extra < EXTRA.length && punti >= EXTRA[extra]) ev.push({ t: tempo(), k: "x", n: extra++ });
      if (q.tipo === "arancio" && ar >= st.arTot && !S2.febbre) { S2.febbre = true; ev.push({ t: tempo(), k: "F" }); }
    }
    function verde(q, b) {   // il piolo verde: il potere dell'aiutante di chi tira
      ev.push({ t: tempo(), k: "v", i: pioli.indexOf(q), pot: g.potere });
      if (g.potere === "bomba") {
        pioli.forEach(function (o) { if (!o.via && !o.acceso && Math.hypot(o.x - q.x, o.y - q.y) < 15) accendi(o, b); });
        if (b) { var dx = b.x - q.x, dy = b.y - q.y, d = Math.hypot(dx, dy) || 1; b.vx += dx / d * 25; b.vy += dy / d * 25 - 10; }
      } else if (g.potere === "multi" && b) {
        var nb = { x: q.x, y: q.y - RP - RB - 0.2, vx: -b.vx * 0.8 + (Math.random() - 0.5) * 20, vy: -Math.abs(b.vy) * 0.6 - 15, fermo: { x: q.x, y: q.y, t: tt }, nuovo: tt };
        palle.push(nb); tutte.push(nb);
      }
    }
    function foto() { fr.push(tutte.map(function (b) { return b.esce ? 0 : [Math.round(b.x * 10), Math.round(b.y * 10)]; })); }
    foto();
    for (var passi = 1; palle.length && tt < 60; passi++) {
      tt += DT; S2.t = st.t + tt;
      for (var j = 0; j < palle.length; j++) passo(S2, palle[j], DT, pe);
      for (j = 0; j < pe.length; j++) {
        var e = pe[j];
        if (e.t === "piolo") accendi(e.q, e.b);
        else if (e.t === "rotto") { if (!e.q.via) { e.q.via = true; ev.push({ t: tempo(), k: "r", i: pioli.indexOf(e.q) }); } }
        else if (e.t === "secchio") { e.b.esce = true; ev.push({ t: tempo(), k: "s" }); }
        else if (e.t === "febbre") { if (!e.b.esce) { e.b.esce = true; punti += FEBBRE[e.slot]; ev.push({ t: tempo(), k: "fb", slot: e.slot, pts: FEBBRE[e.slot] }); } }
        else if (e.t === "fuori") e.b.esce = true;
      }
      pe.length = 0;
      palle.forEach(function (b) {   // la pallina incastrata (come in Peggle): ferma da 1,5 secondi, o da 4 secondi senza accendere niente, si rompono i pezzi accesi lì intorno
        if (b.esce) return;
        if (Math.hypot(b.x - b.fermo.x, b.y - b.fermo.y) > 3) b.fermo = { x: b.x, y: b.y, t: tt };
        var ferma = tt - b.fermo.t > 1.5, gira = tt - b.nuovo > 4;
        if (!ferma && !gira) return;
        var vicini = pioli.filter(function (q) { return q.acceso && !q.via && Math.hypot(q.x - b.x, q.y - b.y) < (ferma ? 7 : 11); });
        if (vicini.length) vicini.forEach(function (q) { q.via = true; ev.push({ t: tempo(), k: "r", i: pioli.indexOf(q) }); });
        else if (ferma) { b.vx += (Math.random() - 0.5) * 30; b.vy -= 20; }
        b.fermo = { x: b.x, y: b.y, t: tt }; b.nuovo = tt;
      });
      palle = palle.filter(function (b) { return !b.esce; });
      if (passi % PASSI_FR === 0 || !palle.length) foto();
    }
    return { a: ang, t0: st.t, fuoco: fuoco, dur: tempo(), fr: fr, ev: ev };
  }
  function prossimo(st) {   // a chi tocca: il prossimo che ha ancora palline (e non è uscito)
    var n = st.gioc.length;
    for (var k = 1; k <= n; k++) { var i = (st.turno + k) % n, p = st.gioc[i]; if (!p.via && p.palline > 0) { st.turno = i; return true; } }
    return false;
  }
  function classifica(gioc) {   // dal primo all'ultimo; pari punti = stesso posto
    var ord = gioc.slice().sort(function (a, b) { return b.punti - a.punti; });
    return ord.map(function (g) { return { g: g, pos: 1 + ord.filter(function (x) { return x.punti > g.punti; }).length }; });
  }
  function livelloCaso(evita) { var i; do { i = Math.floor(Math.random() * LIVELLI.length); } while (i === evita && LIVELLI.length > 1); return i; }
  function scegliLivello(sc, ultimo) { return sc == null || sc === "caso" || !LIVELLI[sc] ? livelloCaso(ultimo) : +sc; }
  function nomeLivello(lv) { var L = LIVELLI[lv]; return L ? CAPITOLI[L.cap].icona + " " + L.nome : "🎲 a caso"; }
  function nomeIo(t) { return (t.nomeProfilo && t.nomeProfilo()) || (t.giocatori && t.giocatori[0]) || "Tu"; }
  function poterePreferito() { var p = progressi(); return POTERI[p.potere] ? p.potere : "bomba"; }
  function salvaPotere(k) { var p = progressi(); p.potere = k; salvaProgressi(p); }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  var SIGLA = { blu: "b", arancio: "a", verde: "g", viola: "v" }, TIPO = { b: "blu", a: "arancio", g: "verde", v: "viola" };

  // =========================================================
  //  IL TAVOLO: lo schermo di gioco, uguale da solo, sullo stesso telefono e online.
  //  Disegna, fa mirare chi deve tirare e riguarda i tiri calcolati con simulaTiro.
  //  cfg: { st, mio() = adesso posso mirare e tirare?, onTiro(ang), onMira(ang), onEsci(), multi, sonoIo(g), faccia(g) = avatar }
  // =========================================================
  function tavolo(t, cfg) {
    stile();
    var st = cfg.st, el = t.el, s = t.schermata({}); s.classList.add("pm-piena");
    function G() { return st.gioc[st.turno] || st.gioc[0]; }
    var ui = { zoom: 1, zx: CX, zy: 70, lento: 1, tLento: 0, salto: 0, fx: [], scritte: [], pulizia: null, dito: null, rec: null, rt: 0, ei: 0, vis: [], poi: null, angVuole: null, fT: null, lentoFatto: false };
    var facce = {};   // l'avatar (busto) di chi tira, pronto come immagine
    function faccia(g) {
      if (!g) return null; var k = g.id || g.nome; if (k in facce) return facce[k];
      facce[k] = null;
      try { var cf = cfg.faccia ? cfg.faccia(g) : null; if (cf && window.SGOmino) { var im = new Image(); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(cf, { busto: true })); facce[k] = im; } } catch (e) {}
      return facce[k];
    }
    var scena = el("div", { class: "pm-scena" + (cfg.multi ? " pm-multi" : "") + (cfg.basso ? " pm-targa" : "") }), cv = el("canvas", { class: "pm-tavolo" }), ctx = cv.getContext("2d");
    // in alto: esci, suoni, punti (o di chi è il turno), palline; sotto la barra degli arancioni col moltiplicatore
    var bEsci = el("button", { class: "pm-tasto", text: "‹", "aria-label": "Esci", onclick: function () { cfg.onEsci(); } });
    var bAudio = el("button", { class: "pm-tasto", text: suoniOn() ? "🔊" : "🔇", onclick: function () { var on = !suoniOn(); try { localStorage.setItem(CHIAVE_SUONI, on ? "1" : "0"); } catch (e) {} bAudio.textContent = on ? "🔊" : "🔇"; } });
    var hPunti = el("div", { class: "pm-punti" + (cfg.multi ? " nome" : ""), text: "0" }), hPalle = el("div", { class: "pm-palle" }), hPot = el("div", { class: "pm-pot" });
    var barra = el("div", { class: "pm-barra" }), fill = el("i", { class: "pm-fill" }), hAr = el("span", { class: "pm-ar" }), hMolt = el("span", { class: "pm-molt", text: "x1" });
    barra.appendChild(fill); [0.4, 0.6, 0.76, 0.88].forEach(function (f, i) { var tk = el("i", { class: "pm-tacca", text: ["x2", "x3", "x5", "x10"][i] }); tk.style.left = (f * 100) + "%"; barra.appendChild(tk); });
    var testa = el("div", { class: "pm-testa" }, [bEsci, bAudio, el("div", { class: "pm-centro" }, [hPunti, el("div", { class: "pm-riga" }, [hAr, barra, hMolt])]), hPot, hPalle]);
    var gioc = cfg.multi ? el("div", { class: "pm-gioc" }) : null, chip = [];   // in più giocatori: i punti di tutti
    var avviso = el("div", { class: "pm-avviso" }), sopra = el("div", { class: "pm-sopra" });
    [cv, testa, gioc, avviso, sopra].forEach(function (n) { if (n) scena.appendChild(n); });
    s._contenuto.appendChild(scena);
    t.mostra(s);
    function vivo() { return document.body.contains(cv); }

    // ---- misure: il tavolo più grande possibile sotto la testa (uguale su tutti i telefoni, cambia solo la grandezza) ----
    var S = 3, ox = 0, oy = 0, cw = 360, ch = 640, dpr = 1, sprite = {}, sfondo = null;
    function misura() {
      if (!vivo()) { window.removeEventListener("resize", misura); return; }
      cw = scena.clientWidth || 360; ch = scena.clientHeight || 640; dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      var top = gioc ? gioc.offsetTop + gioc.offsetHeight + 4 : testa.offsetHeight + 6;
      var bs = cfg.basso || 0;   // (chi guarda soltanto: sotto lascio il posto per la targhetta del core)
      S = Math.min((cw - 8) / W, (ch - top - 6 - bs) / st.H); ox = (cw - S * W) / 2; oy = top + (ch - top - 6 - bs - S * st.H) / 2;
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
      var c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height; var x = c.getContext("2d"), tema = CAPITOLI[LIVELLI[st.lv].cap].sfondo, i, r2, g;
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
      } else if (tema === "dolci") {   // il rosa (scuro in alto, sotto la testa), i confettini e i lecca-lecca negli angoli
        g = x.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, "#a61e4d"); g.addColorStop(0.35, "#e64980"); g.addColorStop(1, "#fcc2d7"); x.fillStyle = g; x.fillRect(0, 0, cw, ch);
        var cc = ["#ff8787", "#ffd43b", "#69db7c", "#74c0fc", "#b197fc", "#ffffff"];
        for (i = 0; i < 70; i++) { r2 = rnd(71 + i * 11); x.save(); x.translate(r2() * cw, r2() * ch); x.rotate(r2() * PI); x.fillStyle = cc[i % cc.length]; x.globalAlpha = 0.7; x.fillRect(-4, -1.5, 8, 3); x.restore(); }
        x.globalAlpha = 1;
        [[cw * 0.08, ch * 0.9, cw * 0.11], [cw * 0.93, ch * 0.82, cw * 0.09]].forEach(function (lp) {   // i lecca-lecca
          x.fillStyle = "#fff"; x.fillRect(lp[0] - 3, lp[1], 6, ch); tondo(lp[0], lp[1], lp[2], "#f06595");
          x.strokeStyle = "#fff"; x.lineWidth = lp[2] * 0.22; x.beginPath(); for (var a = 0; a < 14; a += 0.2) { var rr = lp[2] * a / 14; x.lineTo(lp[0] + Math.cos(a) * rr, lp[1] + Math.sin(a) * rr); } x.stroke();
        });
      } else if (tema === "festa") {   // il cielo della sera, la ghirlanda di lampadine, la ruota e le tende del luna park
        g = x.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, "#1b0f45"); g.addColorStop(0.55, "#5f3dc4"); g.addColorStop(0.85, "#d6336c"); g.addColorStop(1, "#ff922b"); x.fillStyle = g; x.fillRect(0, 0, cw, ch);
        for (i = 0; i < 50; i++) { r2 = rnd(43 + i * 17); x.fillStyle = "rgba(255,255,255," + (0.25 + r2() * 0.5).toFixed(2) + ")"; x.beginPath(); x.arc(r2() * cw, r2() * ch * 0.5, r2() * 1.3 + 0.3, 0, PI * 2); x.fill(); }
        var rcx = cw * 0.78, rcy = ch * 0.8, rr2 = cw * 0.22;   // la ruota lontana
        x.strokeStyle = "rgba(255,255,255,.22)"; x.lineWidth = 3; x.beginPath(); x.arc(rcx, rcy, rr2, 0, PI * 2); x.stroke();
        x.lineWidth = 1.5; for (i = 0; i < 12; i++) { var aa = i * PI / 6; x.beginPath(); x.moveTo(rcx, rcy); x.lineTo(rcx + Math.cos(aa) * rr2, rcy + Math.sin(aa) * rr2); x.stroke(); }
        x.fillStyle = "rgba(20,8,40,.55)"; x.beginPath(); x.moveTo(cw * 0.02, ch); x.lineTo(cw * 0.02, ch * 0.9); x.lineTo(cw * 0.16, ch * 0.83); x.lineTo(cw * 0.3, ch * 0.9); x.lineTo(cw * 0.3, ch); x.closePath(); x.fill();   // la tenda
        var lc = ["#ffd43b", "#ff6b6b", "#69db7c", "#74c0fc", "#ffa94d"];
        for (i = 0; i <= 16; i++) { var lx = cw * i / 16, ly = ch * 0.03 + Math.sin(i / 16 * PI * 4) * ch * 0.012 + ch * 0.012; alone(lx, ly, 10, "rgba(255,230,150,.45)"); tondo(lx, ly, 3, lc[i % lc.length]); }   // le lampadine
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
      if (tema === "spazio" || tema === "festa") { tg.addColorStop(0, "rgba(120,100,220,.16)"); tg.addColorStop(1, "rgba(80,60,180,.3)"); } else if (tema === "dolci") { tg.addColorStop(0, "rgba(90,20,60,.3)"); tg.addColorStop(1, "rgba(90,20,60,.45)"); } else { tg.addColorStop(0, "rgba(10,25,60,.22)"); tg.addColorStop(1, "rgba(10,25,60,.4)"); }
      x.fillStyle = tg; arrot(x, 0, 0, W * S, st.H * S, 14); x.fill();
      x.lineWidth = 3; x.strokeStyle = tema === "natura" || tema === "dolci" ? "rgba(255,255,255,.7)" : tema === "mare" ? "rgba(165,216,255,.55)" : "rgba(190,170,255,.45)"; arrot(x, 0, 0, W * S, st.H * S, 14); x.stroke();
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

    // ---- il dito: il cannone si gira trascinando, da qualsiasi punto dello schermo ----
    // non punta dove tocchi: resta dov'è e lo sposti col dito (a destra = gira a destra).
    // Piano piano per i ritocchi fini, veloce per girarlo tanto.
    function mira(e, d) {
      var ora = performance.now(), dx = e.clientX - d.lx, v = Math.abs(dx) / Math.max(8, ora - d.lt);   // quanto è veloce il dito (pixel al millesimo)
      var spinta = 1 + Math.min(2.5, Math.max(0, v - 0.15) * 4);
      st.ang = Math.max(0.06, Math.min(PI - 0.06, st.ang - dx * 0.0035 * spinta));
      d.lx = e.clientX; d.lt = ora;
      if (cfg.onMira) cfg.onMira(st.ang);
    }
    // tenendo premuto (o trascinando) si mira e lasciando la pallina NON parte;
    // un tocco veloce, senza muovere il dito, fa partire la pallina dove avevi mirato
    cv.addEventListener("pointerdown", function (e) {
      if (st.fase === "volo" || st.fase === "pulizia") {   // tenendo premuto mentre la pallina vola: va più veloce (il tiro è già deciso, non cambia niente)
        e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er0) {}
        ui.veloce = e.pointerId; return;
      }
      if (!cfg.mio()) return;
      e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      try { if (window.SG && SG.audioCtx) SG.audioCtx(); } catch (er2) {}
      clearTimeout(ui.tTieni);
      ui.dito = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), mira: false, lx: e.clientX, lt: performance.now() };
      var d0 = ui.dito; ui.tTieni = setTimeout(function () { if (ui.dito === d0 && cfg.mio()) d0.mira = true; }, 200);   // tenuto premuto: si mira, lasciando non tira
    });
    cv.addEventListener("pointermove", function (e) {
      var d = ui.dito; if (!d || d.id !== e.pointerId || !cfg.mio()) return;
      if (!d.mira && Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 7) { d.mira = true; d.lx = e.clientX; d.lt = performance.now(); }   // (si parte da qui: niente scatto)
      if (d.mira) mira(e, d); else { d.lx = e.clientX; d.lt = performance.now(); }
    });
    function lascia(e) {
      if (ui.veloce === e.pointerId) ui.veloce = null;
      var d = ui.dito; if (!d || d.id !== e.pointerId) return; ui.dito = null; clearTimeout(ui.tTieni);
      if (e.type === "pointerup" && !d.mira && performance.now() - d.t < 260) spara();   // il tocco veloce: tira
    }
    cv.addEventListener("pointerup", lascia); cv.addEventListener("pointercancel", lascia);
    function spara() { if (!cfg.mio() || G().palline <= 0) return; st.fase = "attesa"; togliMano(); cfg.onTiro(st.ang); }
    // la mano che insegna a mirare (ai primi livelli): resta finché non si tira
    var mano = null;
    if (cfg.aiuto) {
      mano = el("div", { class: "pm-mano" }, [el("span", { class: "pm-mano-dito", text: "👆" }), el("span", { class: "pm-mano-txt", text: "Trascina per mirare, poi un tocco per tirare" })]);
      scena.appendChild(mano);
    }
    function togliMano() { if (mano && mano.parentNode) mano.parentNode.removeChild(mano); mano = null; }

    // ---- il tiro, riguardato come un filmato (rec di simulaTiro): le palline si muovono, i pezzi si accendono al momento giusto ----
    function riproduci(rec, poi) {
      var g = G();
      g.palline--; if (g.mira > 0) g.mira--;
      if (rec.fuoco) { g.fuoco = Math.max(0, (g.fuoco || 0) - 1); dimmi("🔥 Palla di fuoco!"); }   // il potere caricato: tutto il tiro attraverso i pioli
      st.fase = "volo"; st.ang = rec.a; st.t = rec.t0; st.colpo = { punti: 0, colpiti: [], nota: 0 };
      ui.rec = rec; ui.rt = 0; ui.ei = 0; ui.vis = []; ui.poi = poi; ui.angVuole = null; ui.lentoFatto = false; ui.fT = null; ui.tHost = null; togliMano();
      for (var i = 0; i < rec.ev.length; i++) if (rec.ev[i].k === "F") { ui.fT = rec.ev[i].t; break; }
      suonoTiro(); aggTesta();
    }
    function applica(e, muto) {   // un evento del tiro: cambia lo stato (punti, palline, pezzi) e fa vedere e sentire
      var g = G(), q = e.i != null ? st.pioli[e.i] : null;
      if (e.k === "p") {
        if (!q || q.acceso) return;
        q.acceso = true; st.colpo.colpiti.push(q);
        if (q.tipo === "arancio") st.arPresi++;
        g.punti += e.pts; st.colpo.punti += e.pts;
        scritta(q.x, q.y - 3, "+" + cifre(e.pts), q.tipo); if (!muto) suonoPiolo(st.colpo.nota++, q.tipo);
      } else if (e.k === "v") {
        g.verdi = (g.verdi || 0) + 1; if (!muto) suonoPotere();
        var P = POTERI[e.pot] || POTERI.bomba; dimmi(P.icona + " " + P.nome + (e.pot === "fuoco" ? ": pronta per il prossimo tiro!" : e.pot === "mira" ? " per i prossimi 3 tiri!" : "!"));
        if (e.pot === "bomba") { if (!muto) suonoBomba(); if (q) ui.fx.push({ t: "onda", x: q.x, y: q.y, r: 0, vita: 0.5 }); }
        else if (e.pot === "mira") g.mira = (g.mira || 0) + 3;
        else if (e.pot === "fuoco") g.fuoco = (g.fuoco || 0) + 1;   // come in Peggle: la palla di fuoco parte al tiro dopo
      } else if (e.k === "x") {
        g.palline++; dimmi("Pallina in più! " + cifre(EXTRA[e.n] || 0) + " punti in un tiro 🎉"); if (!muto) suonoSecchio();
      } else if (e.k === "s") {
        g.palline++; g.secchi = (g.secchi || 0) + 1; ui.salto = 1.2; dimmi("Pallina gratis! 🪣"); if (!muto) suonoSecchio();
      } else if (e.k === "F") {   // l'ultimo arancione!
        st.febbre = true;
        if (!muto) { rullo(0.9); setTimeout(function () { if (!vivo()) return; innoGioia(); dimmi("FEBBRE MATTA! 🎉"); fuochi(50, 70, 60); }, 950); }
      } else if (e.k === "fb") {
        g.punti += e.pts; st.colpo.punti += e.pts; scritta(e.slot * 20 + 10, st.H - 10, "+" + cifre(e.pts), "febbre");
        if (!muto) [0, 4, 7, 12, 16].forEach(function (k, i) { tono(523 * Math.pow(2, k / 12), i * 0.06, 0.25, "triangle", 0.09); });
        fuochi(e.slot * 20 + 10, st.H - 15, 40);
      } else if (e.k === "r") {
        if (q && !q.via) { q.via = true; scintille(q.x, q.y, COL[q.tipo][0], 8); if (!muto) suonoScoppio(6); }
      }
      aggTesta();
    }
    function posiziona(R, rt) {   // le palline tra due fotogrammi
      var f = rt * FPS_REC, i0 = Math.max(0, Math.min(R.fr.length - 1, Math.floor(f))), i1 = Math.min(R.fr.length - 1, i0 + 1), k = Math.max(0, Math.min(1, f - i0));
      var a = R.fr[i0], b = R.fr[i1], n = Math.max(a.length, b.length);
      for (var j = 0; j < n; j++) {
        var p = a[j], q = b[j] || p, v = ui.vis[j] || (ui.vis[j] = { x: 0, y: 0, scia: [], on: false, fuoco: R.fuoco && j === 0 });
        if (!p) { v.on = false; continue; }
        v.on = true; v.x = (p[0] + (q[0] - p[0]) * k) / 10; v.y = (p[1] + (q[1] - p[1]) * k) / 10;
        v.scia.push([v.x, v.y]); if (v.scia.length > 14) v.scia.shift();
      }
    }
    function salta() {   // finisce subito il tiro (online, se si è rimasti indietro)
      if (st.fase === "volo" && ui.rec) { var R = ui.rec; while (ui.ei < R.ev.length) applica(R.ev[ui.ei++], true); ui.rec = null; ui.vis = []; ui.lento = 1; ui.tLento = 0; finisceTiro(); }
      if (st.fase === "pulizia" && ui.pulizia) { ui.pulizia.lista.forEach(function (q) { q.via = true; }); ui.pulizia.lista = []; dopoPulizia(); }
    }

    // ---- le scritte che salgono, gli scoppi e i coriandoli ----
    function scritta(x, y, txt, tipo) { ui.scritte.push({ x: x, y: y, txt: txt, tipo: tipo, vita: 1 }); if (ui.scritte.length > 30) ui.scritte.shift(); }
    function scintille(x, y, col, n) { for (var i = 0; i < n; i++) { var a = Math.random() * PI * 2, v = 8 + Math.random() * 18; ui.fx.push({ t: "sc", x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, col: col, vita: 0.5 + Math.random() * 0.3 }); } }
    function fuochi(x, y, n) { var cols = ["#ffd43b", "#ff6b6b", "#74c0fc", "#b197fc", "#8ce99a", "#ffa94d"]; for (var i = 0; i < n; i++) { var a = Math.random() * PI * 2, v = 15 + Math.random() * 35; ui.fx.push({ t: "sc", x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, col: cols[i % cols.length], vita: 0.9 + Math.random() * 0.6 }); } }
    function consiglioVeloce() {   // una volta sola per telefono: si può far correre la pallina
      try { if (localStorage.getItem(CHIAVE_VELOCE)) return; localStorage.setItem(CHIAVE_VELOCE, "1"); } catch (e) { return; }
      dimmi("⏩ Tieni premuto lo schermo: la pallina corre");
    }
    function dimmi(txt) { avviso.textContent = txt; avviso.classList.remove("su"); void avviso.offsetWidth; avviso.classList.add("su"); }

    // ---- la testa: punti (o di chi è il turno), palline, arancioni, moltiplicatore; in più giocatori i punti di tutti ----
    function aggTesta() {
      var g = G();
      hPunti.textContent = cfg.multi ? "🎯 " + (cfg.sonoIo && cfg.sonoIo(g) ? "Tocca a te" : g.nome) : cifre(g.punti);
      hPalle.textContent = "⚪ " + g.palline;
      var rim = st.arTot - st.arPresi; hAr.textContent = "🟠 " + rim;
      fill.style.transform = "scaleX(" + (st.arPresi / Math.max(1, st.arTot)).toFixed(3) + ")";
      var m = molt(st); if (hMolt.textContent !== "x" + m) { hMolt.textContent = "x" + m; hMolt.classList.remove("su"); void hMolt.offsetWidth; hMolt.classList.add("su"); }
      hPot.textContent = (POTERI[g.potere] || POTERI.bomba).icona + (g.mira > 0 ? " " + g.mira : "") + (g.fuoco > 0 ? " " + g.fuoco : "");   // quanti tiri col potere carico
      if (gioc) st.gioc.forEach(function (p, i) {
        var c = chip[i];
        if (!c) { c = chip[i] = { box: el("div", { class: "pm-chip" }), n: el("b"), p: el("span") }; c.box.appendChild(c.n); c.box.appendChild(c.p); gioc.appendChild(c.box); }
        var nome = cfg.sonoIo && cfg.sonoIo(p) ? "Tu" : p.nome, txt = cifre(p.punti) + " · ⚪" + p.palline;
        if (c.n.textContent !== nome) c.n.textContent = nome;
        if (c.p.textContent !== txt) c.p.textContent = txt;
        c.box.classList.toggle("turno", i === st.turno); c.box.classList.toggle("via", !!p.via);
      });
    }

    // ---- il giro: il filmato del tiro (o la mira degli altri), poi il disegno ----
    var ult = performance.now(), anim = 0;
    function giro(ora) {
      if (!vivo()) return;
      var dt = Math.min(0.05, (ora - ult) / 1000); ult = ora;
      aggiorna(dt); disegna();
      anim = requestAnimationFrame(giro);
    }
    function aggiorna(dt) {
      // il rallentatore della febbre: parte un attimo prima dell'ultimo arancione, poi torna normale
      if (ui.tLento > 0) { ui.tLento -= dt; if (ui.tLento <= 0) ui.lento = 1; }
      var dts = dt * (ui.lento || 1);
      if (ui.veloce != null && ui.lento >= 1 && (st.fase === "volo" || st.fase === "pulizia")) dts = dt * VELOCE;   // il dito tenuto giù: avanti veloce (mai nel rallentatore)
      if (st.fase === "volo" && ui.rec) {
        var R = ui.rec;
        if (ui.fT != null && !ui.lentoFatto && ui.rt >= ui.fT - 0.35) { ui.lentoFatto = true; ui.lento = 0.22; ui.tLento = 2.7; dts = dt * 0.22; }
        ui.rt += dts;
        if (!ui.consiglioV && ui.rt > 2.5 && R.dur > 7 && ui.veloce == null && ui.lento >= 1) { ui.consiglioV = true; consiglioVeloce(); }
        while (ui.ei < R.ev.length && R.ev[ui.ei].t <= ui.rt) applica(R.ev[ui.ei++]);
        st.t = R.t0 + Math.min(ui.rt, R.dur);
        posiziona(R, ui.rt);
        if (ui.rt >= R.dur) { while (ui.ei < R.ev.length) applica(R.ev[ui.ei++]); ui.rec = null; ui.vis = []; finisceTiro(); }
      } else {
        st.t += dts;
        if (ui.tHost != null) {   // online: il secchio segue l'orologio dell'host (morbido, senza salti)
          var dv = ui.tHost + (performance.now() - ui.tHostAt) / 1000 - st.t;
          if (Math.abs(dv) > 2) st.t += dv; else st.t += dv * Math.min(1, dt * 4);
        }
      }
      // la mira di chi tira dall'altro telefono: il cannone lo segue morbido
      if (ui.angVuole != null && !cfg.mio()) st.ang += (ui.angVuole - st.ang) * Math.min(1, dt * 12);
      if (st.fase === "pulizia") {   // i pioli accesi scoppiano uno dopo l'altro
        ui.pulizia.t -= ui.veloce != null ? dt * VELOCE : dt;
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
      var vb = ui.vis.filter(function (b) { return b.on; })[0], vuoleZoom = ui.lento < 1 && vb;
      var zt = vuoleZoom ? 1.7 : 1; ui.zoom += (zt - ui.zoom) * Math.min(1, dt * 5);
      if (vuoleZoom) { ui.zx += (vb.x - ui.zx) * Math.min(1, dt * 6); ui.zy += (vb.y - ui.zy) * Math.min(1, dt * 6); }
    }
    function finisceTiro() {
      var g = G(); st.fase = "pulizia"; g.colpoMax = Math.max(g.colpoMax || 0, st.colpo.punti);
      var lista = st.colpo.colpiti.filter(function (q) { return !q.via; });
      if (st.febbre) lista = st.pioli.filter(function (q) { return q.acceso && !q.via; });
      ui.pulizia = { lista: lista, t: 0.15, k: 0 };
      if (st.colpo.punti > 0 && !st.febbre) scritta(50, st.H - 18, "Tiro: " + cifre(st.colpo.punti), "tiro");
    }
    function dopoPulizia() {
      st.fase = "attesa"; ui.pulizia = null; aggTesta();
      var poi = ui.poi; ui.poi = null; if (poi) poi();
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
          ctx.fillText(cifre(FEBBRE[k]), xx + 10 * S, gy + 6.2 * S);
        }
        [20, 40, 60, 80].forEach(function (px2) { ctx.beginPath(); ctx.arc(ox + px2 * S, oy + (st.H - 4.5) * S, 1.3 * S, 0, PI * 2); ctx.fillStyle = "#e9ecef"; ctx.fill(); });
      } else {
        var sx = xSecchio(st.t), sw = SECCHIO.w * S, sh = SECCHIO.h * S, bx = ox + sx * S - sw / 2, by = oy + (st.H - 6.5) * S;
        var gb = ctx.createLinearGradient(bx, by, bx, by + sh); gb.addColorStop(0, "#ffd43b"); gb.addColorStop(1, "#e67700");
        ctx.fillStyle = gb; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + sw, by); ctx.lineTo(bx + sw - 4, by + sh); ctx.lineTo(bx + 4, by + sh); ctx.closePath(); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = "#7a3e00"; ctx.stroke();
        ctx.fillStyle = "#fff3bf"; ctx.fillRect(bx, by - 1.5, sw, 3);
      }
      // la strada per mirare (si vede anche quella di chi tira dall'altro telefono)
      var g = G();
      if (st.fase === "mira") {
        // (ricalcolata solo se il cannone si è mosso, o ogni tanto per il secchio che si sposta)
        var ora = performance.now(), sk = st.ang + "|" + (g.mira > 0) + "|" + (g.fuoco > 0) + "|" + st.turno, SC = ui.strada;
        if (!SC || SC.k !== sk || ora - SC.at > 150) SC = ui.strada = { k: sk, at: ora, pts: strada(st, st.ang, g.mira > 0, g.fuoco > 0) };
        var pts = SC.pts;
        ctx.fillStyle = g.fuoco > 0 ? "rgba(255,146,43,.95)" : g.mira > 0 ? "rgba(140,233,154,.9)" : "rgba(255,255,255,.75)";
        pts.forEach(function (p2, i) { if (i % 2) return; ctx.beginPath(); ctx.arc(ox + p2[0] * S, oy + p2[1] * S, Math.max(1.2, 0.45 * S * (1 - i / pts.length * 0.5)), 0, PI * 2); ctx.fill(); });
      }
      // le palline con la scia
      ui.vis.forEach(function (b) {
        if (!b.on) return;
        b.scia.forEach(function (p3, i) { ctx.globalAlpha = (i / b.scia.length) * 0.35; ctx.fillStyle = b.fuoco ? "#ff922b" : "#e9ecef"; ctx.beginPath(); ctx.arc(ox + p3[0] * S, oy + p3[1] * S, RB * S * (0.4 + i / b.scia.length * 0.5), 0, PI * 2); ctx.fill(); });
        ctx.globalAlpha = 1;
        var gx = ox + b.x * S, gy2 = oy + b.y * S, gp = ctx.createRadialGradient(gx - RB * S * 0.4, gy2 - RB * S * 0.4, 1, gx, gy2, RB * S);
        gp.addColorStop(0, "#ffffff"); gp.addColorStop(1, b.fuoco ? "#ff6b00" : "#adb5bd");
        ctx.fillStyle = gp; ctx.beginPath(); ctx.arc(gx, gy2, RB * S, 0, PI * 2); ctx.fill();
      });
      // l'avatar di chi tira accanto al cannone: salta col secchio e nella febbre
      var fa = faccia(g);
      if (fa && fa.complete && fa.naturalWidth) {
        var fz = 11 * S, sal = (st.febbre || ui.salto > 0) ? Math.abs(Math.sin(st.t * 9)) * 2.2 * S : 0;
        ctx.drawImage(fa, ox + (CX - 15) * S - fz / 2, oy + 0.6 * S - sal, fz, fz * 1.02);
      }
      // il cannone
      var cx2 = ox + CX * S, cy2 = oy + CY * S;
      ctx.save(); ctx.translate(cx2, cy2); ctx.rotate(st.ang - PI / 2);
      var gc = ctx.createLinearGradient(-2 * S, 0, 2 * S, 0); gc.addColorStop(0, "#495057"); gc.addColorStop(0.5, "#ced4da"); gc.addColorStop(1, "#343a40");
      ctx.fillStyle = gc; arrot(ctx, -2.1 * S, -1 * S, 4.2 * S, 8.5 * S, 1.5 * S); ctx.fill(); ctx.strokeStyle = "#212529"; ctx.lineWidth = 1.5; ctx.stroke();
      if ((st.fase === "mira" || st.fase === "attesa") && g.palline > 0) { ctx.beginPath(); ctx.arc(0, 6 * S, RB * S, 0, PI * 2); ctx.fillStyle = "#f1f3f5"; ctx.fill(); }
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
      if (ui.veloce != null && (st.fase === "volo" || st.fase === "pulizia") && ui.lento >= 1) {   // avanti veloce
        ctx.font = "900 " + Math.round(5 * S) + "px system-ui,sans-serif"; ctx.textAlign = "right"; ctx.globalAlpha = 0.85;
        ctx.fillStyle = "#ffe066"; ctx.fillText("⏩", ox + (W - 3) * S, oy + 20 * S); ctx.globalAlpha = 1;
      }
    }

    // ---- le finestre sopra il tavolo: fine partita, domande, "tocca a…" ----
    function svuota() { while (sopra.firstChild) sopra.removeChild(sopra.firstChild); }
    function chiudiSopra() { sopra.classList.remove("su"); }
    function finestra(o) {   // o: { titolo, sotto, stelle, righe: [[testo, valore, classe]], nodi, tasti: [{ testo, cls, fn }] }
      svuota();
      var box = el("div", { class: "pm-fine" }, [el("h2", { text: o.titolo })]);
      if (o.sotto) box.appendChild(el("div", { class: "pm-stelle" + (o.stelle ? "" : " msg"), text: o.sotto }));
      (o.righe || []).forEach(function (r) { box.appendChild(el("div", { class: "pm-rig" + (r[2] ? " " + r[2] : "") }, [el("span", { text: r[0] }), el("b", { text: r[1] })])); });
      (o.nodi || []).forEach(function (n) { if (n) box.appendChild(n); });
      var bt = el("div", { class: "pm-tasti" });
      // o.piede(bt): online a fine partita i tasti li può mettere il core (true = fatto, niente tasti del gioco)
      if (!(o.piede && o.piede(bt))) (o.tasti || []).forEach(function (x) { bt.appendChild(el("button", { class: "btn " + (x.cls || "btn-fantasma"), text: x.testo, onclick: x.fn })); });
      box.appendChild(bt); sopra.appendChild(box); sopra.classList.add("su");
      return box;
    }
    function chiedi(titolo, testo, siTesto, si, no) {   // a partita cominciata si chiede prima di uscire (un tocco sbagliato non butta la partita)
      finestra({ titolo: titolo, sotto: testo, tasti: [{ testo: "▶ Continua a giocare", cls: "btn-primario", fn: function () { chiudiSopra(); if (no) no(); } }, { testo: siTesto, fn: si }] });
    }
    function passa(g, scegli, poi) {   // sullo stesso telefono: tocca a qualcun altro (la prima volta sceglie anche l'aiutante); da qui si può anche uscire
      var nodi = [];
      if (scegli) {
        var nomeP = el("div", { class: "pm-pot-nome centro", text: POTERI[g.potere].nome + ": " + POTERI[g.potere].sotto.toLowerCase() });
        var r = el("div", { class: "pm-aiutanti centro" });
        ORDINE_POTERI.forEach(function (k) {
          var b = el("button", { class: "pm-aiu" + (g.potere === k ? " attiva" : ""), text: POTERI[k].icona, "aria-label": POTERI[k].nome, onclick: function () {
            g.potere = k; [].forEach.call(r.children, function (x) { x.classList.remove("attiva"); }); b.classList.add("attiva");
            nomeP.textContent = POTERI[k].nome + ": " + POTERI[k].sotto.toLowerCase(); aggTesta();
          } });
          r.appendChild(b);
        });
        nodi = [el("div", { class: "pm-rig-t", text: "Scegli il tuo aiutante" }), r, nomeP];
      }
      finestra({ titolo: "Tocca a " + g.nome + " 🎯", sotto: "Passagli il telefono", nodi: nodi, tasti: [{ testo: "▶ Gioca", cls: "btn-primario", fn: function () { chiudiSopra(); poi(); } },
        { testo: "🏠 Esci", cls: "btn-fantasma pm-piccolo", fn: function () { cfg.onEsci(); } }] });
    }
    function chiudi() { cancelAnimationFrame(anim); window.removeEventListener("resize", misura); clearTimeout(ui.tTieni); togliMano(); }

    aggTesta(); misura();   // (prima i punti di tutti: il tavolo si mette sotto)
    anim = requestAnimationFrame(function (o) { ult = o; giro(o); });
    var api = { st: st, riproduci: riproduci, salta: salta, aggTesta: aggTesta, dimmi: dimmi, finestra: finestra, chiedi: chiedi, passa: passa, chiudiSopra: chiudiSopra, chiudi: chiudi, vivo: vivo,
      mira: function (a) { ui.angVuole = Math.max(0.06, Math.min(PI - 0.06, +a || PI / 2)); },
      occupato: function () { return st.fase === "volo" || st.fase === "pulizia"; },
      aperta: function () { return sopra.classList.contains("su"); },   // c'è una finestra sopra il tavolo?
      orologio: function (ts) { if (typeof ts === "number" && isFinite(ts)) { ui.tHost = ts; ui.tHostAt = performance.now(); } },   // online: l'ora del secchio dell'host
      nuovoTurno: function (k) { if (k === undefined || k !== ui.kTurno) ui.angVuole = null; ui.kTurno = k; aggTesta(); } };   // (k: il numero del turno; la mira degli altri si azzera solo se cambia)
    window.__PMpartita = { st: function () { return st; }, tira: function () { if (st.fase === "mira") { st.fase = "attesa"; cfg.onTiro(st.ang); } }, mira: function (a) { st.ang = a; }, avanza: function (sec) { for (var i = 0; i < sec * 60; i++) aggiorna(1 / 60); }, tav: api };   // (per le prove)
    return api;
  }

  // =========================================================
  //  DA SOLO: un livello (stelle, record, livelli che si aprono)
  // =========================================================
  function partita(t, lv, potere) {
    var io = nomeIo(t), g = { nome: io, potere: potere }, tiri = 0;
    var st = nuovoStato(lv, [g], null, altezzaTavolo(false)); nuovoViola(st);
    var aiuto = lv < 2 && !(progressi().stelle[lv + 1] > 0);   // ai primi livelli, finché non li hai finiti: la mano che insegna a mirare
    var tav = tavolo(t, { st: st, aiuto: aiuto, mio: function () { return st.fase === "mira"; }, onTiro: tira, onEsci: esci, faccia: function () { return t.mioOmino ? t.mioOmino(io) : null; } });
    function tira(ang) { tiri++; tav.riproduci(simulaTiro(st, ang, g), dopo); }
    function dopo() {
      if (st.febbre) return vinto();
      if (g.palline <= 0) return perso();
      nuovoViola(st); st.fase = "mira"; tav.aggTesta();
    }
    function salva(vinto, stelle) {
      var p = progressi(), k = lv + 1, nuovoRec = g.punti > (p.rec[k] || 0);
      if (vinto) { if (nuovoRec) p.rec[k] = g.punti; if (stelle > (p.stelle[k] || 0)) p.stelle[k] = stelle; }
      p.potere = g.potere; salvaProgressi(p);
      if (profiloOk() && SGNube.salvaProgressi) {   // nel profilo: per i trofei e per ritrovare i livelli su un altro telefono
        var incr = [["partite", 1], ["arancioni", st.arPresi], ["secchi", g.secchi], ["verdi", g.verdi]];
        if (vinto) { incr.push(["livelliFiniti", 1]); incr.push(["febbri", 1]); if (g.palline >= PALLINE) incr.push(["senzaPerdere", 1]); }
        var rec = [["colpoMax", g.colpoMax], ["puntiMax", g.punti]];
        if (vinto) { rec.push(["livelloMax", k]); rec.push(["l" + k, g.punti]); rec.push(["t" + k, stelle]); }
        try { SGNube.salvaProgressi(null, ID, incr.filter(function (x) { return x[1]; }), rec); } catch (e) {}
      }
      if (t.risultato) t.risultato([{ nome: io, pos: vinto ? 1 : 2, punti: g.punti }]);   // XP e statistiche (record del punteggio)
      return nuovoRec;
    }
    function tasti(vinto) {
      var l = [];
      if ((vinto || tuttiAperti(t)) && lv + 1 < LIVELLI.length) l.push({ testo: "▶ " + (LIVELLI[lv + 1].cap !== LIVELLI[lv].cap ? CAPITOLI[LIVELLI[lv + 1].cap].icona + " Capitolo " + (LIVELLI[lv + 1].cap + 1) : "Avanti: " + LIVELLI[lv + 1].nome), cls: "btn-primario", fn: function () { tav.chiudi(); partita(t, lv + 1, g.potere); } });
      l.push({ testo: "↻ " + (vinto ? "Rigioca" : "Riprova"), cls: vinto ? "btn-fantasma" : "btn-primario", fn: function () { tav.chiudi(); partita(t, lv, g.potere); } });
      l.push({ testo: "☰ Livelli", fn: function () { tav.chiudi(); schermataLivelli(t); } });
      return l;
    }
    function vinto() {
      st.fase = "fine";
      var bonus = g.palline * 10000, totale0 = g.punti; g.punti += bonus;
      var stelle = g.palline >= 5 ? 3 : g.palline >= 3 ? 2 : 1;
      var nuovoRec = salva(true, stelle);
      [0, 4, 7, 12].forEach(function (k, i) { tono(523 * Math.pow(2, k / 12), i * 0.12, 0.3, "triangle", 0.1); });
      tav.finestra({ titolo: "Livello superato! 🎉", sotto: "★★★".slice(0, stelle) + "☆☆☆".slice(0, 3 - stelle), stelle: true,
        righe: [["Punti del livello", cifre(totale0)], ["Palline rimaste: " + g.palline + " × 10.000", "+" + cifre(bonus)], ["Totale", cifre(g.punti)]],
        nodi: [nuovoRec ? t.el("div", { class: "pm-rec", text: "🏅 Nuovo record del livello!" }) : null], tasti: tasti(true) });
    }
    function perso() {
      st.fase = "fine"; salva(false, 0); suonoPerso();
      var rim = st.arTot - st.arPresi;
      tav.finestra({ titolo: "Palline finite!", sotto: rim <= 3 ? "Per un pelo! Riprova 💪" : "Riprova, ce la fai!", righe: [["Arancioni rimasti", String(rim)], ["Punti", cifre(g.punti)]], tasti: tasti(false) });
    }
    function esci() {
      if (st.fase === "fine" || (!tiri && st.fase === "mira")) { tav.chiudi(); return schermataLivelli(t); }   // (prima del primo tiro non c'è niente da perdere)
      tav.chiedi("Lasciare il livello?", "I punti di questa partita si perdono.", "☰ Torna ai livelli", function () { tav.chiudi(); schermataLivelli(t); });
    }
    tav.dimmi(nomeLivello(lv) + " · prendi tutti i 🟠");
  }

  // sui telefoni lunghi il tavolo si allunga in giù (da solo e sullo stesso telefono; online resta uguale per tutti)
  function altezzaTavolo(multi) {
    try {
      var app = document.getElementById("app"), w = (app && app.clientWidth) || window.innerWidth || 360;
      var alt = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--alt")) || window.innerHeight || 640;
      var sopra = multi ? 108 : 60, S = (w - 8) / W;   // (lo spazio della testa e, nelle sfide, dei punti di tutti: un po' abbondante)
      return Math.max(H, Math.min(212, Math.floor((alt - sopra) / S)));
    } catch (e) { return H; }
  }

  // la fine di una sfida (sullo stesso telefono e online): chi ha vinto e i punti di tutti
  function righeFine(cl, mioId) {
    var med = ["🥇", "🥈", "🥉"];
    return cl.map(function (r) { return [(med[r.pos - 1] || r.pos + "°") + " " + r.nome + (mioId && r.id === mioId ? " (tu)" : ""), cifre(r.punti), r.pos === 1 ? "primo" : ""]; });
  }
  function titoloFine(cl, mioId) {
    var primi = cl.filter(function (r) { return r.pos === 1; });
    if (primi.length !== 1) return "Pareggio! 🤝";
    return mioId && primi[0].id === mioId ? "Hai vinto! 🏆" : "Vince " + primi[0].nome + "! 🏆";
  }
  function suonoFine() { [0, 4, 7, 12].forEach(function (k, i) { tono(523 * Math.pow(2, k / 12), i * 0.12, 0.3, "triangle", 0.1); }); }
  function vittorie(gioc) {   // più partite di fila: quante ne ha vinte ognuno
    if (!gioc.some(function (p) { return p.vinte > 0; })) return null;
    return "🏆 Vittorie: " + gioc.map(function (p) { return p.nome + " " + (p.vinte || 0); }).join(" · ");
  }

  // =========================================================
  //  SFIDA SULLO STESSO TELEFONO: da 2 a 4, un tiro a testa, vi passate il telefono
  // =========================================================
  function giocaAmici(t) {
    var imp = t.impostazioni || {}, nomi = (t.giocatori || []).slice(0, 4);   // (almeno in 2: lo chiede il core prima di cominciare, modi[].min)
    var prof = t.nomeProfilo && t.nomeProfilo();
    var gioc = nomi.map(function (n, i) { return { id: "g" + i, nome: n, potere: n === prof ? poterePreferito() : "bomba", vinte: 0, scelto: false }; });
    var ultimo = -1, partite = 0, st = null, tav = null, inPassa = false;
    function nuova() {
      if (tav) tav.chiudi();
      var lv = scegliLivello(imp.lv, ultimo); ultimo = lv;
      st = nuovoStato(lv, gioc, null, altezzaTavolo(true)); st.turno = partite % gioc.length; partite++; nuovoViola(st);   // a ogni partita comincia uno diverso
      tav = tavolo(t, { st: st, multi: true, mio: function () { return st.fase === "mira"; }, onTiro: tira, onEsci: esci,
        faccia: function (g) { return g.nome === prof && t.mioOmino ? t.mioOmino(g.nome) : (window.SGOmino ? SGOmino.casuale(g.nome) : null); } });
      turno(false);
    }
    function turno(ancora) {   // ancora: tocca di nuovo a chi ha appena tirato (gli altri hanno finito le palline): niente "passagli il telefono"
      var g = st.gioc[st.turno]; st.fase = "attesa"; tav.nuovoTurno();
      if (ancora && g.scelto) { st.fase = "mira"; tav.aggTesta(); tav.dimmi("🎯 Tocca ancora a " + g.nome + " · ⚪ " + g.palline); return; }
      inPassa = true;
      tav.passa(g, !g.scelto, function () { inPassa = false; g.scelto = true; st.fase = "mira"; tav.aggTesta(); tav.dimmi(nomeLivello(st.lv) + " · tocca a " + g.nome); });
    }
    function tira(ang) { tav.riproduci(simulaTiro(st, ang, st.gioc[st.turno]), dopo); }
    function dopo() {
      if (st.febbre || !gioc.some(function (p) { return p.palline > 0; })) return fine();
      var prima = st.turno; prossimo(st); nuovoViola(st); turno(prima === st.turno);
    }
    function fine() {
      st.fase = "fine";
      var cl = classifica(gioc).map(function (r) { return { id: r.g.id, nome: r.g.nome, punti: r.g.punti, pos: r.pos, g: r.g }; });
      cl.forEach(function (r) { if (r.pos === 1) r.g.vinte++; });
      var esito = cl.map(function (r) { return { nome: r.nome, pos: r.pos, punti: r.punti }; });
      if (t.risultato) t.risultato(esito);
      if (imp.torneo) { tav.chiudi(); return t.fine(esito); }
      suonoFine();
      var v = vittorie(gioc);
      tav.finestra({ titolo: titoloFine(cl), sotto: st.febbre ? "Tutti gli arancioni presi!" : "Palline finite per tutti", righe: righeFine(cl),
        nodi: [v ? t.el("div", { class: "pm-rec", text: v }) : null],
        tasti: [{ testo: "↻ Altra partita" + (imp.lv == null || imp.lv === "caso" ? " (livello a caso)" : ""), cls: "btn-primario", fn: nuova },
          { testo: "🏠 Esci", fn: function () { tav.chiudi(); t.esci(); } }] });
    }
    function esci() {
      if (st.fase === "fine") { tav.chiudi(); return t.esci(); }
      // dalla finestra "Tocca a…": se non esci, la finestra torna com'era
      tav.chiedi("Lasciare la sfida?", "La partita finisce qui.", "🏠 Esci", function () { tav.chiudi(); t.esci(); }, inPassa ? function () { turno(false); } : null);
    }
    nuova();
  }

  // =========================================================
  //  ONLINE: ognuno dal suo telefono (da 2 a 4). L'host tiene la partita vera,
  //  calcola ogni tiro (simulaTiro) e lo manda a tutti; gli altri mandano solo la mira e il tiro.
  // =========================================================
  var MIN_ON = 2, MAX_ON = 4;
  function lobbyPM(t, vm, cb) {   // la saletta: livello, il tuo aiutante, le vittorie delle partite di prima
    stile();
    var el = t.el, extra = [el("p", { class: "modulo-nota", text: "Livello: " + (vm.lvSc == null || vm.lvSc === "caso" ? "🎲 a caso" : nomeLivello(vm.lvSc)) + " · un tiro a testa, vince chi fa più punti." })];
    var me = vm.players.filter(function (p) { return p.id === cb.myId; })[0];
    if (me) {
      var riga = el("div", { class: "pm-aiutanti centro" }, [el("span", { class: "pm-aiu-et", text: "Il tuo aiutante:" })]);
      ORDINE_POTERI.forEach(function (k) { riga.appendChild(el("button", { class: "pm-aiu" + (me.potere === k ? " attiva" : ""), text: POTERI[k].icona, "aria-label": POTERI[k].nome, onclick: function () { cb.onPotere(k); } })); });
      riga.appendChild(el("span", { class: "pm-pot-nome", text: (POTERI[me.potere] || POTERI.bomba).nome }));
      extra.push(riga);
    }
    var v = vittorie(vm.players); if (v) extra.push(el("p", { class: "modulo-nota", text: v }));
    // nella Sala: chi non è stato scelto guarda (niente posto e niente "Sono pronto")
    var guarda = vm.guarda || [], guardo = !me && guarda.some(function (g) { return g.id === cb.myId; });
    if (guarda.length) extra.push(el("p", { class: "modulo-nota", text: "👀 Guardano: " + guarda.map(function (g) { return g.id === cb.myId ? "tu" : g.nome; }).join(", ") }));
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN_ON, vuoti: Math.max(0, MIN_ON - vm.players.length),
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: extra, attesa: cb.guarda ? "Guardi la partita: tra poco si tira! 🔴" : guardo ? "Questa partita la guardi: tra poco si tira!" : "Aspetta che l'host cominci!",
      spettatore: cb.guarda ? "👀 Guardi la partita" : guardo ? "👀 Questa volta guardi" : null,   // (cb.guarda: guardo soltanto, dal link)
      onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  function ominoDi(g) { return g.omino || (window.SGOmino ? SGOmino.casuale(g.nome) : null); }

  function host(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {}, nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    var H = { fase: "lobby", codice: "…", pronta: false, lvSc: imp.lv == null ? "caso" : imp.lv, partita: 0, seq: 0, ultimo: -1, st: null, tav: null, classifica: null, tF: null, tA: null, mira: { t: 0, to: null },
      attesa: [], pausa: null, fineFatta: -1,   // attesa: chi ha chiesto di entrare a stanza piena o a partita cominciata (entra dopo, da solo)
      guarda: [],   // nella Sala: chi non è stato scelto per giocare (guarda la partita e basta)
      players: [{ id: "host", nome: nomeHost, omino: t.mioOmino(nomeHost), potere: poterePreferito(), vinte: 0 }] };
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function fermaTimer() { clearTimeout(H.tF); clearTimeout(H.tA); H.tF = H.tA = null; }
    function accogli() {   // nella saletta: chi aspettava entra, se c'è posto
      while (H.fase === "lobby" && H.players.length < MAX_ON && H.attesa.length) { var a = H.attesa.shift(); if (!pById(a.id)) H.players.push(a); }
    }

    // ---- la ripresa (l'host ha ricaricato la pagina o l'app si è chiusa): stesso livello, stessi pioli, punti, palline e
    // turno. Si ricorda solo tra un tiro e l'altro: un tiro che era in volo non vale e lo rifà lo stesso giocatore.
    // Gli amici rientrano da soli (stesso id); chi non torna entro 15 secondi è come se fosse uscito
    var CAMPI = ["fase", "lvSc", "partita", "seq", "ultimo", "classifica", "attesa", "guarda", "rip"];
    var RIP = t.ripresa && t.ripresa.stato && t.ripresa.stato.pallamatta, ricordata = !!RIP, attesi = {};
    if (RIP) {
      CAMPI.forEach(function (k) { if (RIP.H[k] !== undefined) H[k] = RIP.H[k]; });
      H.rip = (H.rip || 0) + 1;   // (nella foto: gli amici sanno che il tiro di prima non vale)
      if (H.fase !== "lobby" && RIP.st) {
        H.st = RIP.st; H.st.colpo = null; H.players = H.st.gioc;   // (in partita i giocatori sono quelli del tavolo)
        if (H.fase === "fine") H.st.fase = "fine";
        else {
          H.st.fase = "mira";
          H.players.forEach(function (p) { if (p.id !== "host" && !p.via) attesi[p.id] = 1; });
          setTimeout(function () { Object.keys(attesi).forEach(function (id) { var p = pById(id); delete attesi[id]; if (p && !p.via && H.fase === "gioco") viaInGioco(p); }); }, 15000);
        }
      } else H.fase = "lobby";
    }
    function ricorda() {   // a ogni foto, ma mai a metà tiro (il core salva al massimo ogni mezzo secondo)
      if (!t.ricorda) return;
      if (H.fase === "lobby" || !H.st) { if (ricordata) { ricordata = false; t.ricorda(null); } return; }
      if (H.st.fase === "volo" || H.st.fase === "pulizia") return;   // (resta quella di prima del tiro)
      var o = {}; CAMPI.forEach(function (k) { o[k] = H[k]; });
      var colpo = H.st.colpo; H.st.colpo = null;
      var copia = JSON.parse(JSON.stringify({ H: o, st: H.st }));   // (una copia: il tavolo cambia prima che il core salvi)
      H.st.colpo = colpo;
      ricordata = true; t.ricorda({ pallamatta: copia });
    }

    // "⚙️ Regole" nella saletta: l'host cambia il livello quando vuole
    t.onRegole = function (im) { if (H.fase !== "lobby") return; H.lvSc = im.lv == null ? "caso" : im.lv; bd(); };

    var rete = SGNet.ospita(ID, {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      onErrore: function () { fermaTimer(); fermaPausa(); if (H.tav) H.tav.chiudi(); errore(t, "Problema di collegamento: la stanza non si apre. Riprova."); },   // (solo se il primo collegamento non riesce)
      onAddio: function (id) {
        var prima = H.attesa.length + H.guarda.length;
        H.attesa = H.attesa.filter(function (a) { return a.id !== id; });
        H.guarda = H.guarda.filter(function (a) { return a.id !== id; });
        var p = pById(id); if (!p) { if (H.attesa.length + H.guarda.length !== prima) bd(); return; }
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); accogli(); bd(); return; }
        delete attesi[id];
        viaInGioco(p);
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        delete attesi[id];   // (ripresa) si è rifatto vivo
        var p = pById(id);
        if (m.t === "join") {
          var nuovo = { id: id, nome: String(m.nome || "Amico").slice(0, 16), omino: avatarValido(m.omino), potere: POTERI[m.potere] ? m.potere : "bomba", vinte: 0 };
          if (!p && t.puoSedersi && !t.puoSedersi(id, nuovo.nome)) {   // nella Sala non è tra gli scelti: questa volta guarda
            H.guarda = H.guarda.filter(function (a) { return a.id !== id; });
            if (H.guarda.length < 12) H.guarda.push({ id: id, nome: nuovo.nome });
          }
          else if (!p && H.fase === "lobby" && H.players.length < MAX_ON) H.players.push(nuovo);
          else if (!p) {   // stanza piena o partita cominciata: aspetta di entrare (lo vede scritto sul suo telefono)
            H.attesa = H.attesa.filter(function (a) { return a.id !== id; });
            if (H.attesa.length < 8) H.attesa.push(nuovo);
          } else if (p.via && H.fase !== "lobby") { p.via = false; if (H.fase === "gioco" && H.pausa && presenti().length >= MIN_ON) return riprendi(); }   // è tornato (stesso id): riprende a giocare (o, a partita finita, torna nella saletta con gli altri)
          bd();   // anche se c'era già: rimanda la foto (serve a chi si ricollega)
          return;
        }
        if (!p) return;
        if (m.t === "potere") { if (H.fase === "lobby" && POTERI[m.k]) { p.potere = m.k; bd(); } return; }
        if (H.fase !== "gioco") return;
        if (m.t === "mira") altraMira(id, m.a, m.seq);
        else if (m.t === "tira") tiro(id, m.a, m.seq, m.ts);
      }
    }, { ripresa: !!RIP });   // (ripresa: gli amici restano al tavolo, non tornano in saletta)
    function viaInGioco(p) {   // uno che gioca se ne va a partita iniziata: resta in classifica, ma i suoi turni si saltano
      p.via = true;
      if (H.fase === "gioco") {
        if (presenti().length < MIN_ON) { pausa(); return bd(); }   // è rimasto solo l'host: si aspetta chi è uscito (magari ha solo bloccato lo schermo)
        if (H.st.gioc[H.st.turno] === p && H.st.fase === "mira") return cambiaTurno();   // (se nessuno ha più palline, finisce lì)
      }
      bd();
    }
    // la "foto" per tutti: SEMPRE con gli id dei giocatori (e di chi aspetta di entrare); nel gioco anche il tavolo (tipi e pezzi già scoppiati)
    function vm() {
      var v = { fase: H.fase, codice: H.codice, pronta: H.pronta, lvSc: H.lvSc, partita: H.partita, rip: H.rip || 0, classifica: H.classifica, attesa: H.attesa.map(function (a) { return a.id; }),
        guarda: H.guarda.map(function (a) { return { id: a.id, nome: a.nome }; }),
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, omino: p.omino || null, potere: p.potere, vinte: p.vinte || 0, via: !!p.via, punti: p.punti || 0, palline: p.palline || 0, mira: p.mira || 0, fuoco: p.fuoco || 0 }; }) };
      if (H.fase !== "lobby" && H.st) {
        var st = H.st;
        v.lv = st.lv; v.seq = H.seq; v.turno = st.turno; v.n = st.pioli.length; v.ar = st.arPresi; v.feb = st.febbre; v.fs = st.fase === "mira" && !H.pausa ? "mira" : "volo";
        v.ts = Math.round(st.t * 100) / 100;   // l'ora del secchio: gli altri lo vedono dove lo vedo io
        v.tipi = st.pioli.map(function (q) { return SIGLA[q.tipo]; }).join("");
        v.via = st.pioli.map(function (q) { return q.via || q.acceso ? 1 : 0; }).join("");   // (quelli accesi stanno per scoppiare)
      }
      return v;
    }
    function bd() { ricorda(); rete.invia({ t: "vm", vm: vm() }); mostra(); }
    function mostra() {
      if (H.fase === "lobby") { if (H.tav) { H.tav.chiudi(); H.tav = null; } return lobbyPM(t, vm(), cbHost); }
      if (!H.tav) {
        H.tav = tavolo(t, { st: H.st, multi: true, mio: function () { return H.st.fase === "mira" && !H.pausa && H.st.gioc[H.st.turno].id === "host"; }, sonoIo: function (g) { return g.id === "host"; },
          onTiro: function (a) { tiro("host", a, H.seq); }, onMira: miaMira, onEsci: cbHost.onEsci, faccia: ominoDi });
        H.tav.dimmi(nomeLivello(H.st.lv) + " · un tiro a testa!");
      } else H.tav.nuovoTurno(H.partita + ":" + H.seq);
      if (H.fase === "fine") finePM();
    }

    // ----- la partita -----
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < MIN_ON) return;
      var lv = scegliLivello(H.lvSc, H.ultimo); H.ultimo = lv;
      H.players = presenti(); H.partita++; H.seq = 0; H.classifica = null;
      H.st = nuovoStato(lv, H.players); H.st.turno = (H.partita - 1) % H.players.length; nuovoViola(H.st);   // a ogni partita comincia uno diverso
      H.fase = "gioco"; bd(); avvisaTurno(); timerTurno();
    }
    function tiro(id, a, seq, ts) {
      var st = H.st; if (H.fase !== "gioco" || !st || st.fase === "volo" || st.fase === "pulizia") return;
      var g = st.gioc[st.turno];
      if (H.pausa || !g || g.via || g.id !== id || g.palline <= 0 || (seq != null && seq !== H.seq)) { if (id === "host" && st.fase === "attesa") st.fase = "mira"; return; }
      fermaTimer();
      a = Math.max(0.06, Math.min(PI - 0.06, +a || PI / 2));
      if (typeof ts === "number" && Math.abs(ts - st.t) < 3) st.t = ts;   // il secchio dov'era sul telefono di chi ha tirato
      var rec = simulaTiro(st, a, g);
      rete.inviaVeloce({ t: "rec", seq: H.seq, rec: rec });   // il tiro a tutti (non resta in stanza)
      H.tav.riproduci(rec, dopoTiro);
    }
    function dopoTiro() {
      if (H.fase === "fine") { H.st.fase = "fine"; ricorda(); return finePM(); }   // (finita mentre si guardava il tiro: è uscito qualcuno)
      if (H.fase !== "gioco") return;
      if (H.st.febbre) return fine();
      cambiaTurno();
    }
    function cambiaTurno() {   // al prossimo che c'è e ha palline; se non c'è nessuno la partita finisce (o, in pausa, aspetta chi è uscito)
      var st = H.st; if (st.fase === "volo" || st.fase === "pulizia") return;
      if (!prossimo(st)) {
        if (H.pausa && H.players.some(function (p) { return p.via && p.palline > 0; })) { fermaTimer(); st.fase = "attesa"; return bd(); }
        return fine();
      }
      nuovoViola(st); H.seq++; st.fase = "mira"; bd(); avvisaTurno(); timerTurno();
    }
    function avvisaTurno() {
      var g = H.st.gioc[H.st.turno]; if (H.tav && !H.pausa) H.tav.dimmi(g.id === "host" ? "🎯 Tocca a te!" : "🎯 Tocca a " + g.nome);
      if (g && t.aCheSiamo) t.aCheSiamo("tocca a " + g.nome);   // (nella Sala: a che punto è la partita, per chi è fuori)
    }
    function timerTurno() {   // chi non tira: dopo 35 secondi un avviso, dopo 45 la pallina parte da sola (mai per chi è uscito, mai in pausa)
      fermaTimer(); if (H.pausa) return; var seq = H.seq;
      H.tF = setTimeout(function () {
        if (H.seq !== seq || H.fase !== "gioco" || H.pausa) return; var g = H.st.gioc[H.st.turno];
        rete.inviaVeloce({ t: "fretta", seq: seq }); if (H.tav) H.tav.dimmi(g.id === "host" ? "⏱️ 10 secondi per tirare!" : "⏱️ " + g.nome + " ha 10 secondi");
      }, 35000);
      H.tA = setTimeout(function () {
        if (H.seq !== seq || H.fase !== "gioco" || H.pausa || H.st.fase !== "mira") return;
        var g = H.st.gioc[H.st.turno]; if (!g || g.via) return cambiaTurno();
        tiro(g.id, H.st.ang, seq);
      }, 45000);
    }
    // ----- la pausa: è rimasto solo l'host (l'amico ha bloccato lo schermo o ha perso la rete) -----
    var ATTESA_PAUSA = 120000;
    function pausa() {
      if (H.pausa) return;
      fermaTimer();
      H.pausa = { fino: Date.now() + ATTESA_PAUSA, box: null, txt: null, iv: setInterval(tickPausa, 1000) };
      tickPausa();
    }
    function tickPausa() {
      var P = H.pausa; if (!P) return;
      var rest = Math.max(0, Math.ceil((P.fino - Date.now()) / 1000));
      if (!rest) return finisciPausa();
      if (!H.tav || H.tav.occupato()) return;   // (prima si vede la fine del tiro)
      var via = H.players.filter(function (p) { return p.via; }).map(function (p) { return p.nome; });
      var chi = via.length > 1 ? via.slice(0, -1).join(", ") + " e " + via[via.length - 1] : via[0] || "gli amici";
      var txt = (via.length > 1 ? "Se nessuno torna entro " : "Se non torna entro ") + Math.floor(rest / 60) + ":" + ("0" + rest % 60).slice(-2) + ", la partita finisce con i punti di adesso.";
      if (P.box && P.box.parentNode && H.tav.aperta()) { if (P.txt && P.txt.textContent !== txt) P.txt.textContent = txt; return; }   // aggiorno solo il conto alla rovescia
      if (H.tav.aperta()) return;   // c'è un'altra domanda aperta (es. "chiudere la partita?"): aspetto
      P.box = H.tav.finestra({ titolo: "Aspettiamo " + chi + "… ⏳", sotto: txt, tasti: [{ testo: "🏁 Finisci ora", cls: "btn-primario", fn: finisciPausa }, { testo: "🏠 Esci", fn: cbHost.onEsci }] });
      P.txt = P.box.querySelector(".pm-stelle");
    }
    function fermaPausa() { if (!H.pausa) return null; clearInterval(H.pausa.iv); var box = H.pausa.box; H.pausa = null; return box; }
    function finisciPausa() { fermaPausa(); if (H.fase === "gioco") fine(); }
    function riprendi() {   // è tornato qualcuno: si continua da dove eravamo
      var box = fermaPausa(); if (box && box.parentNode && H.tav) H.tav.chiudiSopra();
      var st = H.st, g = st.gioc[st.turno];
      if (st.fase === "mira" && g && !g.via && g.palline > 0) { bd(); avvisaTurno(); timerTurno(); }
      else if (st.fase !== "volo" && st.fase !== "pulizia") cambiaTurno();
      else bd();
      if (H.tav && H.fase === "gioco") H.tav.dimmi("👋 Si riprende!");
    }
    function altraMira(id, a, seq) {   // la mira di chi tira dall'altro telefono: la vedo e la giro agli altri
      var st = H.st, g = st.gioc[st.turno]; if (!g || g.id !== id || seq !== H.seq || st.fase !== "mira") return;
      st.ang = Math.max(0.06, Math.min(PI - 0.06, +a || PI / 2)); H.tav.mira(st.ang);
      rete.inviaVeloce({ t: "mira", a: Math.round(st.ang * 1000) / 1000, seq: H.seq, ts: Math.round(st.t * 100) / 100 });
    }
    function miaMira(a) {   // la mia mira agli altri: al massimo 10 volte al secondo (e l'ultima sempre)
      var M = H.mira, ora = performance.now(); clearTimeout(M.to);
      function manda() { M.t = performance.now(); rete.inviaVeloce({ t: "mira", a: Math.round(H.st.ang * 1000) / 1000, seq: H.seq, ts: Math.round(H.st.t * 100) / 100 }); }
      if (ora - M.t > 100) manda(); else M.to = setTimeout(manda, 110);
    }
    function fine() {
      fermaTimer(); fermaPausa();
      var cl = classifica(H.players);
      H.classifica = cl.map(function (r) { return { id: r.g.id, nome: r.g.nome, punti: r.g.punti || 0, pos: r.pos }; });
      cl.forEach(function (r) { if (r.pos === 1) r.g.vinte = (r.g.vinte || 0) + 1; });
      H.fase = "fine"; if (H.st && H.st.fase !== "volo" && H.st.fase !== "pulizia") H.st.fase = "fine";
      bd();
      // torneo online e XP: i NOMI dei giocatori col loro posto (pari merito = stesso posto)
      if (t.risultato) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos, punti: r.punti }; }));
    }
    function finePM() {   // la classifica: una volta sola per partita (chi entra o esce dopo non la fa ripartire)
      if (!H.tav || H.st.fase === "volo" || H.st.fase === "pulizia" || H.fineFatta === H.partita) return;   // (si vede prima la fine del tiro)
      H.fineFatta = H.partita;
      suonoFine(); var v = vittorie(H.players);
      H.tav.finestra({ titolo: titoloFine(H.classifica, "host"), sotto: H.st.febbre ? "Tutti gli arancioni presi!" : H.players.some(function (p) { return !p.via && p.palline > 0; }) ? "Partita chiusa prima della fine" : "Palline finite", righe: righeFine(H.classifica, "host"),
        nodi: [v ? t.el("div", { class: "pm-rec", text: v }) : null, faccineFine(t)],
        piede: function (bt) { return t.tastiFine && t.tastiFine(bt, { host: true, nuova: nuova, esci: cbHost.onEsci }); },
        tasti: [{ testo: "↻ Altra partita (stessi amici)", cls: "btn-primario", fn: nuova }, { testo: "🏠 Esci", fn: cbHost.onEsci }] });
    }
    // "Altra partita": stessa stanza, stessi amici, tutti tornano nella saletta (MAI chiudere e riaprire la stanza); entra anche chi aspettava
    function nuova() { fermaTimer(); fermaPausa(); H.fase = "lobby"; H.classifica = null; H.players = presenti(); accogli(); bd(); }
    t.onRivincita = nuova;   // la Rivincita della Sala

    var cbHost = { sonoHost: true, myId: "host", onComincia: comincia,
      onPotere: function (k) { var p = pById("host"); if (p) p.potere = k; salvaPotere(k); bd(); },
      onEsci: function () {
        function via() { fermaTimer(); fermaPausa(); rete.chiudi(); if (H.tav) H.tav.chiudi(); t.esci(); }
        if (H.fase === "gioco" && H.tav) return H.tav.chiedi("Chiudere la partita per tutti?", "Gli amici escono dalla partita.", "🏠 Chiudi ed esci", via);   // un tocco sbagliato non chiude il gioco a tutti
        via();
      } };
    if (RIP && H.fase === "gioco") {   // la partita ripresa: tocca di nuovo a chi toccava (se c'è ancora e ha palline)
      var g0 = H.st.gioc[H.st.turno];
      if (presenti().length < MIN_ON) { pausa(); return bd(); }   // (era in pausa: si aspetta ancora chi era uscito)
      if (!g0 || g0.via || g0.palline <= 0) return cambiaTurno();
      bd(); avvisaTurno(); timerTurno();
      if (H.tav) H.tav.dimmi("🔁 Partita ripresa: " + (g0.id === "host" ? "tocca a te!" : "tocca a " + g0.nome));
      return;
    }
    bd();
  }

  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, myId: null, nome: "", vm: null, tav: null, st: null, partita: -1, coda: null, tAtt: null, mira: { t: 0, to: null }, fineDi: null, att: null };
    // guardo soltanto (link con guarda=1): il tavolo come gli altri, senza tirare; in basso la targhetta del core («👀 Guardi · 😂 · ✕»)
    var GUARDA = !!t.guarda, TARGA = GUARDA && !t.eliminazione;
    var cb = { sonoHost: false, myId: null, guarda: GUARDA,
      onPotere: function (k) { salvaPotere(k); if (S.rete) S.rete.invia({ t: "potere", k: k }); },
      onEsci: function () {
        function via() { if (S.rete) S.rete.chiudi(); if (S.tav) S.tav.chiudi(); t.esci(); }
        if (GUARDA) return t.conferma("Smetti di guardare?", "Torni dove eri prima.", "Esci", via);
        if (S.vm && S.vm.fase === "gioco" && S.tav) return S.tav.chiedi("Uscire dalla partita?", "Gli altri continuano senza di te.", "🏠 Esci", via);
        via();
      } };
    if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ chiara: true, icona: "🔴", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      attesa("Collegamento in corso…");
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; cb.myId = id; S.tJoin = Date.now(); S.rete.invia(msgJoin()); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;          // era per un altro telefono
          if (m.t === "vm") { S.vm = m.vm; ricevi(m.vm); }
          else if (m.t === "rec") tiroArrivato(m);
          else if (m.t === "mira") { if (S.tav && S.st && m.seq === S.st.seq) { S.tav.orologio(m.ts); if (S.st.fase === "mira" && !mioTurno()) S.tav.mira(m.a); } }
          else if (m.t === "fretta") { if (S.tav && S.st && m.seq === S.st.seq) S.tav.dimmi(mioTurno() ? "⏱️ 10 secondi per tirare!" : "⏱️ " + S.st.gioc[S.st.turno].nome + " ha 10 secondi"); }
        },
        onChiuso: function () { if (S.tav) S.tav.chiudi(); errore(t, "La partita è stata chiusa dall'host."); },   // (chiusa apposta: se l'host sparisce, "La stanza è chiusa" lo dice il core)
        onErrore: function () { if (S.tav) S.tav.chiudi(); errore(t, "Problema di collegamento. Riprova."); }   // (solo se il primo collegamento non riesce)
      });
    }
    function msgJoin() { return { t: "join", nome: S.nome, omino: t.mioOmino(S.nome), potere: poterePreferito() }; }
    function attesa(testo, faccine) {   // la schermata d'attesa: se è già lì cambio solo la scritta (niente lampeggio a ogni foto)
      var A = S.att;
      if (A && document.body.contains(A.s)) { if (A.p.textContent !== testo) A.p.textContent = testo; if (faccine) metti(A); return; }
      var s = t.schermata({ chiara: true, icona: "🔴", titolo: "Palla Matta", sotto: "Stanza " + String(codice).toUpperCase(), indietro: cb.onEsci });
      var p = t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: testo });
      s._contenuto.appendChild(t.el("div", { class: "sg-dal-gioco", style: "text-align:center;margin-top:56px;font-size:3rem;line-height:1", text: "🔴" }));   // (nei giochi la testa non ha il titolo: lo metto qui)
      s._contenuto.appendChild(t.el("div", { style: "text-align:center;margin-top:8px;font-weight:900;font-size:1.2rem", text: "Palla Matta · stanza " + String(codice).toUpperCase() }));
      s._contenuto.appendChild(p); S.att = { s: s, p: p };
      if (faccine) metti(S.att);
      t.mostra(s);
    }
    function metti(A) {   // chi aspetta di entrare (stanza piena, partita in corso) manda le faccine a chi gioca
      if (A.fac) return; var f = t.faccine && t.faccine(); if (!f) return;
      A.fac = f; f.style.cssText = "margin:18px auto 0;max-width:320px"; A.s._contenuto.appendChild(f);
    }
    function mioTurno() { var st = S.st, g = st && st.gioc[st.turno]; return !!g && g.id === S.myId; }
    function ricevi(vm) {
      // nella Sala, se non sono tra gli scelti, guardo la partita (il tavolo come gli altri, ma senza tirare)
      // (e chi guarda soltanto: guarda e basta, niente "join" da ripetere)
      var guardo = GUARDA || (vm.guarda || []).some(function (g) { return g.id === S.myId; });
      if (!guardo && !vm.players.some(function (p) { return p.id === S.myId; })) {   // non sono (ancora) tra i giocatori
        if (S.tav) { S.tav.chiudi(); S.tav = null; S.st = null; } S.coda = null;
        if ((vm.attesa || []).indexOf(S.myId) < 0) {   // l'host non mi ha ancora (o non più): richiedo di entrare, con calma
          if (S.rete && S.myId && Date.now() - (S.tJoin || 0) > 3000) { S.tJoin = Date.now(); S.rete.invia(msgJoin()); }
          return attesa("⏳ Sto entrando…");
        }
        return attesa(vm.fase === "lobby" ? "La stanza è piena (" + vm.players.length + " su " + MAX_ON + "): entri appena si libera un posto."
          : vm.fase === "fine" ? "La partita è appena finita: entri nella saletta quando l'host ne prepara un'altra. Resta qui!"
          : "👀 C'è una partita in corso: entri nella saletta appena finisce. Resta qui!", true);
      }
      if (vm.fase === "lobby") { if (S.tav) { S.tav.chiudi(); S.tav = null; S.st = null; } S.coda = null; return lobbyPM(t, vm, cb); }
      var ripresa = S.rip != null && vm.rip != null && vm.rip !== S.rip; S.rip = vm.rip;   // l'host ha ripreso la partita (ha ricaricato)
      if (!S.tav || vm.partita !== S.partita) { if (!creaTavolo(vm)) return; }
      else if (S.tav.occupato()) {
        if (!ripresa) { S.coda = vm; return; }   // sto ancora guardando il tiro: la foto dopo
        S.coda = null; S.tav.salta();   // (ripresa: il tiro che si vedeva non vale, il tavolo torna com'era)
      }
      sincronizza(vm, ripresa);
    }
    function creaTavolo(vm) {
      var pioli = LIVELLI[vm.lv] ? creaLivello(vm.lv, false) : [];
      if (pioli.length !== vm.n) { if (S.tav) S.tav.chiudi(); S.tav = null; errore(t, "La tua app è di una versione diversa da quella dell'host: chiudila e riaprila per aggiornarla."); return false; }
      pioli.forEach(function (q, i) { q.tipo = TIPO[vm.tipi.charAt(i)] || q.tipo; });
      var gioc = vm.players.map(function (p) { return { id: p.id, nome: p.nome, omino: p.omino, potere: p.potere }; });
      if (S.tav) S.tav.chiudi();
      S.st = nuovoStato(vm.lv, gioc, pioli); S.st.seq = -1; S.partita = vm.partita; S.coda = null;
      S.tav = tavolo(t, { st: S.st, multi: true, mio: function () { return !GUARDA && S.st.fase === "mira" && mioTurno(); }, sonoIo: function (g) { return g.id === S.myId; },
        onTiro: tira, onMira: mandaMira, onEsci: cb.onEsci, faccia: ominoDi, basso: TARGA ? 58 : 0 });   // (basso: il posto per la targhetta)
      S.tav.dimmi(nomeLivello(vm.lv) + " · un tiro a testa!");
      return true;
    }
    function sincronizza(vm, ripresa) {   // la foto dell'host è quella giusta: punti, palline, turno e pezzi rimasti
      var st = S.st, nuovoT = vm.seq !== st.seq || !!ripresa;
      st.seq = vm.seq; st.turno = vm.turno; st.arPresi = vm.ar; st.febbre = !!vm.feb;
      vm.players.forEach(function (p, i) {
        var g = st.gioc[i] || (st.gioc[i] = {});
        g.id = p.id; g.nome = p.nome; g.omino = p.omino; g.potere = p.potere; g.punti = p.punti; g.palline = p.palline; g.mira = p.mira; g.fuoco = p.fuoco; g.via = p.via; g.vinte = p.vinte;
      });
      st.pioli.forEach(function (q, i) { q.tipo = TIPO[vm.tipi.charAt(i)] || q.tipo; q.via = vm.via.charAt(i) === "1"; q.acceso = false; });
      S.tav.orologio(vm.ts);
      if (vm.fase === "fine") { st.fase = "fine"; S.tav.nuovoTurno(vm.seq); return fineOspite(vm); }
      st.fase = vm.fs === "mira" ? "mira" : "attesa";
      S.tav.nuovoTurno(vm.seq);
      if (nuovoT && st.fase === "mira") S.tav.dimmi((ripresa ? "🔁 Si riprende: " : "🎯 ") + (mioTurno() ? (ripresa ? "tocca a te!" : "Tocca a te!") : (ripresa ? "tocca a " : "Tocca a ") + st.gioc[st.turno].nome));
    }
    function tiroArrivato(m) {
      if (!S.tav || !S.st) return;
      if (S.tav.occupato()) S.tav.salta();   // ero rimasto indietro: finisco subito il tiro di prima
      if (m.seq !== S.st.seq || !m.rec) return;   // vecchio (o mi manca un pezzo: la prossima foto rimette a posto)
      clearTimeout(S.tAtt);
      S.tav.riproduci(m.rec, function () { var v = S.coda; S.coda = null; if (v) ricevi(v); });
    }
    function tira(a) {
      if (!S.rete || GUARDA) return;
      S.rete.invia({ t: "tira", a: Math.round(a * 1000) / 1000, seq: S.st.seq, ts: Math.round(S.st.t * 100) / 100 });   // (ts: dov'era il secchio quando ho tirato)
      clearTimeout(S.tAtt); S.tAtt = setTimeout(function () { if (S.st && S.st.fase === "attesa" && mioTurno()) S.st.fase = "mira"; }, 4000);   // se il tiro si è perso per strada, si può ritirare
    }
    function mandaMira(a) {   // la mia mira all'host: al massimo 10 volte al secondo (e l'ultima sempre)
      var M = S.mira, ora = performance.now(); clearTimeout(M.to);
      function manda() { M.t = performance.now(); if (S.rete && S.st) S.rete.invia({ t: "mira", a: Math.round(S.st.ang * 1000) / 1000, seq: S.st.seq }); }
      if (ora - M.t > 100) manda(); else M.to = setTimeout(manda, 110);
    }
    function fineOspite(vm) {   // la classifica: una volta sola per partita (le foto dopo non la fanno ripartire)
      if (S.fineDi === S.tav) return;
      S.fineDi = S.tav;
      if (!GUARDA) suonoFine();   // (chi guarda soltanto: niente musichetta sua)
      var cl = vm.classifica || [], v = vittorie(vm.players);
      var nota = t.el("p", { class: "pm-nota", text: GUARDA ? "👀 Se l'host fa un'altra partita, entri anche tu nella saletta." : "Se l'host fa un'altra partita, torni da solo nella saletta." });
      S.tav.finestra({ titolo: titoloFine(cl, S.myId), sotto: vm.feb ? "Tutti gli arancioni presi!" : (vm.players || []).some(function (p) { return !p.via && p.palline > 0; }) ? "Partita chiusa prima della fine" : "Palline finite", righe: righeFine(cl, S.myId),
        // (chi guarda soltanto ha le faccine nella targhetta del core, in basso, e una sola uscita: il suo ✕)
        nodi: [v ? t.el("div", { class: "pm-rec", text: v }) : null, nota, TARGA ? null : faccineFine(t)],
        piede: function (bt) {   // i tasti di fine del core (Ci sto…): allora la nota non serve; se no la nota e "Esci" di sempre
          if (!(t.tastiFine && t.tastiFine(bt, { host: false, esci: cb.onEsci }))) return false;
          if (nota.parentNode) nota.parentNode.removeChild(nota);
          return true;
        },
        tasti: TARGA ? [] : [{ testo: "🏠 Esci", fn: cb.onEsci }] });
    }
  }
  function faccineFine(t) {   // online: la fila delle faccine anche sulla classifica (il mio avatar le fa sui telefoni di tutti)
    var f = t.faccine && t.faccine(); if (f) f.style.marginTop = "12px";
    return f;
  }
  function errore(t, testo) {
    var s = t.schermata({ chiara: true, icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ chiara: true, icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "L'online funziona quando l'app è aperta dal sito pubblicato." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
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
      // le palline rimaste in vetro pieno: nello spazio la luna dello sfondo ci passava sotto e il numero non si leggeva
      ".pm-palle{background:var(--o-carta-piena);box-shadow:inset 0 0 0 1px var(--o-filo-oro)}",
      ".pm-avviso{position:absolute;left:50%;top:calc(76px + env(safe-area-inset-top));z-index:4;transform:translateX(-50%);padding:8px 14px;width:max-content;max-width:calc(100% - 24px);box-sizing:border-box;border-radius:16px;white-space:normal;text-align:center;line-height:1.25;font-weight:900;font-size:.9rem;color:#1a1440;background:#ffe066;box-shadow:0 6px 16px rgba(0,0,0,.35);opacity:0;pointer-events:none}",
      ".pm-avviso.su{animation:pmAvviso 2.2s ease forwards}",
      "@keyframes pmAvviso{0%{opacity:0;transform:translate(-50%,-8px) scale(.9)}12%{opacity:1;transform:translate(-50%,0) scale(1)}80%{opacity:1}100%{opacity:0}}",
      ".pm-sopra{position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,6,30,.55);opacity:0;pointer-events:none;transition:opacity .3s}",
      ".pm-sopra.su{opacity:1;pointer-events:auto}",
      ".pm-targa .pm-sopra{padding-bottom:70px}",   // chi guarda soltanto: sotto c'è la targhetta del core
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
      ".pm-lv.fatto{box-shadow:var(--ombra),inset 0 0 0 2px rgba(255,212,59,.55)}",
      // le sfide: i punti di tutti sotto la testa, chi tira si accende
      ".pm-gioc{position:absolute;left:8px;right:8px;top:calc(50px + env(safe-area-inset-top));z-index:3;display:flex;gap:5px;justify-content:center;pointer-events:none}",
      ".pm-chip{flex:1 1 0;min-width:0;max-width:150px;display:flex;flex-direction:column;align-items:center;padding:3px 6px;border-radius:12px;background:rgba(18,12,48,.72);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);color:#fff;line-height:1.15;transition:background .2s,box-shadow .2s}",
      ".pm-chip b{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.74rem}",
      ".pm-chip span{font-size:.7rem;font-weight:800;color:#ffe066;white-space:nowrap}",
      ".pm-chip.turno{background:rgba(92,70,10,.85);box-shadow:inset 0 0 0 2px #ffd43b}",
      ".pm-chip.via{opacity:.4}",
      ".pm-punti.nome{font-size:1.02rem;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pm-multi .pm-avviso{top:calc(104px + env(safe-area-inset-top))}",
      ".pm-aiutanti.centro{justify-content:center;margin:6px 0}",
      ".pm-pot-nome.centro{text-align:center;font-size:.82rem;margin-bottom:4px}",
      ".pm-rig-t{margin-top:10px;font-weight:900;font-size:.9rem;color:#d0bfff}",
      ".pm-rig.primo b,.pm-rig.primo span{color:#ffd43b;font-weight:900}",
      ".pm-nota{margin:10px 0 0;font-size:.82rem;color:#d0bfff}",
      // la scelta del livello nelle impostazioni delle sfide: due colonne strette
      ".modo-griglia.pm-sceltalv{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}",
      ".modo-chip.pm-chiplv{justify-content:center;gap:0;padding:9px 6px;min-height:0;text-align:center}",
      ".modo-chip.pm-chiplv .mt{font-size:.8rem;line-height:1.2}",
      ".modo-chip.pm-chiplv.largo{grid-column:1/-1}",
      // la mano che insegna a mirare (si muove solo con transform)
      ".pm-mano{position:absolute;left:50%;top:44%;z-index:4;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;width:max-content;max-width:calc(100% - 32px)}",
      ".pm-mano-dito{font-size:2.6rem;line-height:1;filter:drop-shadow(0 4px 6px rgba(0,0,0,.5));animation:pmMano 2.4s ease-in-out infinite}",
      "@keyframes pmMano{0%,100%{transform:translateX(-46px)}40%{transform:translateX(46px)}70%{transform:translateX(0) scale(1)}78%{transform:translateX(0) scale(.82)}86%{transform:translateX(0) scale(1)}}",
      ".pm-mano-txt{padding:7px 12px;border-radius:14px;text-align:center;font-weight:900;font-size:.88rem;line-height:1.25;color:#fff;background:rgba(18,12,48,.82);box-shadow:inset 0 0 0 1.5px rgba(255,224,102,.6)}",
      // i livelli chiusi: la scossa e l'avviso
      ".pm-lv.scossa{animation:pmScossa .4s}",
      "@keyframes pmScossa{20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}",
      ".pm-msg-chiuso{position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom));z-index:20;transform:translateX(-50%);width:max-content;max-width:calc(100% - 32px);padding:9px 14px;border-radius:16px;text-align:center;font-weight:900;font-size:.9rem;color:#1a1440;background:#ffe066;box-shadow:0 6px 16px rgba(0,0,0,.35);opacity:0;pointer-events:none}",
      ".pm-msg-chiuso.su{animation:pmMsg 2.6s ease forwards}",
      "@keyframes pmMsg{0%{opacity:0;transform:translate(-50%,10px)}10%{opacity:1;transform:translate(-50%,0)}82%{opacity:1}100%{opacity:0}}",
      ".pm-tasti .pm-piccolo{min-height:0;padding:7px 12px;font-size:.85rem;opacity:.85}",
      // i capitoli nuovi
      ".pm-cap-dolci{background:linear-gradient(90deg,#c2255c,#f06595)}", ".pm-lv-dolci{background:linear-gradient(180deg,#f06595,#a61e4d)}",
      ".pm-cap-festa{background:linear-gradient(90deg,#5f3dc4,#e8590c)}", ".pm-lv-festa{background:linear-gradient(180deg,#7048e8,#3b1d8f)}",
      // 🌙 Notte vivace: capitoli e livelli in vetro scuro, con un filo e un bagliore del colore del capitolo
      ".pm-cap-spazio{--cc:#b39bff;--cr:179,155,255}.pm-cap-natura{--cc:#3ee0a8;--cr:62,224,168}.pm-cap-mare{--cc:#4fd8ff;--cr:79,216,255}.pm-cap-dolci{--cc:#ff6d97;--cr:255,109,151}.pm-cap-festa{--cc:#ffd24a;--cr:255,210,74}",
      ".pm-lv-spazio{--cc:#b39bff;--cr:179,155,255}.pm-lv-natura{--cc:#3ee0a8;--cr:62,224,168}.pm-lv-mare{--cc:#4fd8ff;--cr:79,216,255}.pm-lv-dolci{--cc:#ff6d97;--cr:255,109,151}.pm-lv-festa{--cc:#ffd24a;--cr:255,210,74}",
      ".pm-cap{color:var(--o-testo);background:linear-gradient(90deg,rgba(var(--cr),.34),rgba(var(--cr),.04) 80%),linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,0)),var(--o-carta);box-shadow:inset 0 0 0 1px rgba(var(--cr),.5),inset 0 1px 0 rgba(255,255,255,.06),0 0 22px -10px rgba(var(--cr),.7)}",
      ".pm-cap small{color:var(--n-monete)}",
      ".pm-lv{color:var(--o-testo);background:linear-gradient(180deg,rgba(var(--cr),.24),rgba(var(--cr),.05)),linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,0)),var(--o-carta);box-shadow:inset 0 0 0 1px rgba(var(--cr),.38),inset 0 1px 0 rgba(255,255,255,.07),0 8px 18px -12px rgba(0,0,0,.8)}",
      ".pm-lv b{color:var(--o-testo)}.pm-lv-stelle{color:var(--n-monete)}.pm-lv small{color:var(--o-tenue)}",
      ".pm-lv.chiuso{opacity:.6}",
      ".pm-lv.fatto{box-shadow:inset 0 0 0 1.5px var(--n-monete),0 0 16px -6px rgba(255,194,71,.6),0 8px 18px -12px rgba(0,0,0,.8)}",
      ".pm-aiu{background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,0)),var(--o-carta);box-shadow:inset 0 0 0 1px var(--o-filo-oro)}.pm-aiu.attiva{background:var(--o-carta-viva);box-shadow:inset 0 0 0 2px var(--o-oro)}.pm-pot-nome{color:var(--o-testo)}",
      ".pm-msg-chiuso{color:var(--o-testo);background:var(--o-carta-piena);box-shadow:inset 0 0 0 1px var(--o-oro),0 6px 16px rgba(0,0,0,.45)}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "Palla Matta", icona: "🔴",
    descrizione: "Spara la pallina dall'alto e falla rimbalzare sui pioli: fai scoppiare tutti gli arancioni con 10 palline. Livelli, poteri e la febbre finale!",
    giocatoriMin: 1, giocatoriMax: 4, difficolta: 2,
    postiOnline: 4,   // online si gioca in 4 al massimo: nella Sala, se siete di più, gioca chi sceglie l'host e gli altri guardano
    riprende: true,   // se l'host ricarica la pagina, la partita riprende (stesso tavolo, punti, palline e turno: t.ripresa)
    ritardatari: "partita",   // chi arriva a partita cominciata la guarda ed entra alla prossima
    // la riga «📜 Si gioca così» della saletta
    riassunto: function (imp) { var lv = imp && imp.lv; return lv == null || lv === "caso" ? "Livello a sorte" : "Livello: " + nomeLivello(+lv); },
    modi: [{ modo: "solo", icona: "🎯", nome: "Da solo", sotto: "I livelli, uno dopo l'altro", diretto: true, min: 1 },   // diretto: niente impostazioni, si va ai livelli
      { modo: "amici", icona: "📱", nome: "Sfida su questo telefono", sotto: "Da 2 a 4: un tiro a testa, vi passate il telefono", amici: true, min: 2 }],
    regole: [
      "<b>Mirare</b>: trascina il dito, da qualsiasi punto dello schermo, e il cannone gira con lui (a destra gira a destra). Piano piano per i ritocchi, veloce per girarlo tanto. I puntini mostrano dove va la pallina. Lasciando il dito non parte niente: dai un <b>tocco veloce</b> per tirare.",
      "La pallina rimbalza sui pioli e li <b>accende</b>; quando esce, i pioli accesi scoppiano. Per far <b>correre</b> la pallina, tieni premuto lo schermo mentre vola.",
      "Fai scoppiare tutti i pioli <b>arancioni</b> con <b>10 palline</b>. Più arancioni prendi, più vale ogni piolo: <b>x2, x3, x5, x10</b>.",
      "Il piolo <b>viola</b> vale 500 punti e cambia posto a ogni tiro. I pioli <b>verdi</b> attivano il potere del tuo <b>aiutante</b> (bomba, multipalla, mira lunga o palla di fuoco).",
      "Se la pallina entra nel <b>secchio</b> che si muove in fondo, la riprendi. Tanti punti in un tiro regalano palline.",
      "Con l'ultimo arancione parte la <b>Febbre Matta</b>: in fondo ci sono i secchi da 10.000, 25.000 e 50.000 punti. Ogni pallina avanzata vale 10.000 punti.",
      "<b>Sfida</b> (sullo stesso telefono o online, da 2 a 4): stesso tavolo per tutti, <b>un tiro a testa</b>. I pezzi presi spariscono per tutti, ma <b>i punti vanno a chi ha tirato</b>. Ognuno ha il suo aiutante. Chi prende l'ultimo arancione fa la Febbre Matta. Alla fine <b>vince chi ha più punti</b>."
    ],
    impostazioni: function (box, dove, aiuti) {   // nelle sfide: il livello (o a caso); da solo niente (si va dritti ai livelli)
      var el = aiuti.el; dove.modo = aiuti.modo || (aiuti.torneo || aiuti.sala ? "amici" : "solo");
      if (dove.modo !== "solo") {
        if (dove.lv == null) dove.lv = "caso";
        box.appendChild(el("div", { class: "etichetta", text: "Il livello" }));
        stile();
        var gl = el("div", { class: "modo-griglia pm-sceltalv" });
        [["caso", "🎲 A caso"]].concat(LIVELLI.map(function (L, i) { return [i, nomeLivello(i)]; })).forEach(function (x) {
          var b = el("button", { class: "modo-chip pm-chiplv" + (x[0] === "caso" ? " largo" : "") + (String(dove.lv) === String(x[0]) ? " attiva" : ""), onclick: function () {
            dove.lv = x[0]; [].forEach.call(gl.children, function (c) { c.classList.remove("attiva"); }); b.classList.add("attiva");
          } }, [el("div", { class: "mt", text: x[1] })]);
          gl.appendChild(b);
        });
        box.appendChild(gl);
        box.appendChild(el("p", { class: "modulo-nota", text: "Il tuo aiutante lo scegli prima del tuo primo tiro (online: nella saletta)." }));
        return;
      }
      // da solo non c'è niente da scegliere qui (modo "diretto"): livello e aiutante si scelgono nella schermata dei livelli
    },
    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito
      if (imp.modo === "online") return host(t);
      if (imp.modo === "amici" || imp.torneo) return giocaAmici(t);
      schermataLivelli(t);
    }
  });

  // per le prove: la fisica e i livelli, senza disegno
  window.__PM = { LIVELLI: LIVELLI, creaLivello: creaLivello, nuovoStato: nuovoStato, nuovoViola: nuovoViola, passo: passo, strada: strada, molt: molt, simulaTiro: simulaTiro, W: W, H: H, DT: DT, V0: V0, CX: CX, CY: CY };
})();

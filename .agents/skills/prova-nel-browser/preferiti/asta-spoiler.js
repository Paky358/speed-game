// PROVA DEGLI SPOILER DELLA GIORNATA DEL FANTA (2 nov 2026, il proprietario: «gli spoiler sistemali già adesso»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta-spoiler.js"); await COPIONE.prova("sp1")
//
// sp1 Per ogni azione (cross, angolo, uno-due, contropiede, pallonetto, tiro da fuori, slalom, punizione, tap-in, da centrocampo
//     e le scene da finale) e 300 semi: la stessa azione col gol, la parata, il palo, la traversa, il fuori, l'alto e il salvataggio
//     sulla linea. Fino a quando il pallone prende strade diverse, TUTTI (giocatori, portiere, difensori: dove sono e cosa fanno)
//     devono essere identici, e anche il rallentatore e la telecamera: niente difensore che c'è solo quando salva, niente passettino del portiere che dice da che parte va,
//     niente uscita del portiere solo nei gol. In più: le occasioni da centrocampo esistono (non solo i gol).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  async function motore(w) {   // il file del gioco con le funzioni di dentro portate fuori (solo per la prova), dentro il telefono w
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), fuori = {};
    var aggancio = "function costruisciMazzoFanta(n) {";
    if (src.indexOf(aggancio) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    src = src.replace(aggancio, "FUORI.scena = scena; " + aggancio);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, fuori);
    return fuori;
  }
  function dove(pts, t, n) {   // dove sta a quel momento (fra un punto e l'altro, in linea retta)
    if (!pts.length) return null;
    if (t <= pts[0][0]) return pts[0].slice(1, n);
    for (var i = 1; i < pts.length; i++) if (t <= pts[i][0]) { var a = pts[i - 1], b = pts[i], k = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 1; return a.slice(1, n).map(function (v, j) { return v + (b[j + 1] - v) * k; }); }
    return pts[pts.length - 1].slice(1, n);
  }
  function posa(pose, t) { var q = {}; pose.forEach(function (p) { if (p[0] <= t) q = p[1]; }); return JSON.stringify(q); }
  function diversi(a, b) { if (!a || !b) return a !== b; for (var i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 1e-6) return true; return false; }
  COPIONE.aggiungi("sp1", { nome: "Fanta, la giornata: fino al tiro ogni azione è identica qualunque cosa succeda (niente spoiler)", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), ko = [], prove = 0;
    var SCENE = ["cross", "angolo", "unodue", "contro", "pallonetto", "fuori", "slalom", "punizione", "tapin", "centrocampo", "mischia", "testa", "incrocio", "miracolo", "assedio", "ultimo",
      "secondopalo", "presa", "tuffo", "vuota", "tre", "filtrante", "rasoterra", "giro", "muro", "corta", "volee"];   // (11 nov 2026: le azioni nuove)
    var ESITI = ["gol", "parata", "palo", "traversa", "fuori", "alto", "linea"];
    SCENE.forEach(function (v) {
      for (var seme = 1; seme <= 300; seme++) {
        var et = { tira: "Tira", passa: "Passa", para: "Para" }, op = { verso: 1, lato: seme % 2 ? 1 : -1, seme: seme * 7919, lento: true };
        var sc = ESITI.map(function (es) { return M.scena(es === "gol" ? "gol" : "occ", v, es, null, et, op); });
        prove++;
        sc.forEach(function (s, i) {
          if (!i) return;
          var g = sc[0], qui = v + " seme " + seme + " gol/" + ESITI[i];
          var cam = function (x) { return JSON.stringify([x.lento && x.lento[0], x.lento && x.lento[2], x.zoomFine, x.tz]); };
          if (cam(s) !== cam(g)) ko.push(qui + ": rallentatore o telecamera diversi " + cam(g) + " / " + cam(s));
          if (s.attori.length !== g.attori.length) { ko.push(qui + ": " + g.attori.length + " giocatori in campo contro " + s.attori.length); return; }
          var tPalla = 1;   // quando il pallone prende un'altra strada
          for (var t = 0; t <= 1; t += 0.0025) if (diversi(dove(g.palla, t, 4), dove(s.palla, t, 4))) { tPalla = t; break; }
          for (t = 0; t < tPalla - 0.0025; t += 0.0025) {
            for (var k = 0; k < g.attori.length; k++) {
              var a = g.attori[k], b = s.attori[k];
              if (a.sq !== b.sq || a.chi !== b.chi || diversi(dove(a.pts, t, 3), dove(b.pts, t, 3)) || posa(a.pose, t) !== posa(b.pose, t)) {
                ko.push(qui + ": " + (a.sq === "pD" ? "il portiere" : a.sq === "D" ? "un difensore" : "un giocatore") + " (n° " + k + ") diverso a " + t.toFixed(3) + ", il pallone solo da " + tPalla.toFixed(3)); t = 2; break;
              }
            }
          }
        });
      }
    });
    // le occasioni da centrocampo ci sono (prima solo i gol): se ne contano nella giornata vera? (rare: si guarda solo che la scena regga)
    if (ko.length) no(ko.length + " differenze prima del tiro: " + ko.slice(0, 5).join(" · "));
    return SCENE.length + " azioni × 300 semi × 7 esiti (" + prove * 6 + " confronti): prima che il pallone cambi strada tutti identici";
  } });
})();

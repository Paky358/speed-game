// PROVA DELL'ASSIST VERO (6 nov 2026, il proprietario dopo una serata con gli amici: «un mio calciatore faceva un cross fino dentro l'area,
// la palla prendeva un rimbalzo strano e veniva toccata da altri giocatori, poi un terzo faceva gol e dava l'assist al mio che aveva fatto
// il cross, ma non dovrebbe essere così»).
// Uso: prova.js --porta 8981 --carica preferiti/asta-assist.js --prova as1
//
// as1 Per ogni azione dove si vede chi passa (cross, angolo, uno-due, contropiede, pallonetto, rovesciata e le scene da finale mischia,
//     testa, incrocio, miracolo, assedio, ultimo) e 300 semi, col gol: si guarda chi tocca il pallone (il giocatore più vicino al pallone
//     in ogni punto dove il pallone cambia strada) e l'ultimo a toccarlo prima di chi segna DEVE essere chi ha l'assist. Niente
//     rimpalli, ribattute o tocchi di altri in mezzo.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  async function motore(w) {
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), fuori = {};
    var aggancio = "function costruisciMazzoFanta(n) {";
    if (src.indexOf(aggancio) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    src = src.replace(aggancio, "FUORI.scena = scena; " + aggancio);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, fuori);
    return fuori;
  }
  function dove(pts, t) {
    if (!pts.length) return null;
    if (t <= pts[0][0]) return [pts[0][1], pts[0][2]];
    for (var i = 1; i < pts.length; i++) if (t <= pts[i][0]) { var a = pts[i - 1], b = pts[i], k = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 1; return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
    var u = pts[pts.length - 1]; return [u[1], u[2]];
  }
  COPIONE.aggiungi("as1", { nome: "Fanta, la giornata: l'assist è vero (l'ultimo a toccare il pallone prima di chi segna è chi fa l'assist)", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), ko = {}, prove = 0;
    var SCENE = ["cross", "rovesciata", "angolo", "unodue", "contro", "pallonetto", "mischia", "testa", "incrocio", "miracolo", "assedio", "ultimo",
      "secondopalo", "presa", "tuffo", "vuota", "tre", "filtrante", "rasoterra", "laterale"];   // (11-12 nov 2026: le azioni nuove con chi passa)
    SCENE.forEach(function (v) {
      for (var seme = 1; seme <= 300; seme++) {
        var et = { tira: "Tira", passa: "Passa", para: "Para" }, op = { verso: 1, lato: seme % 2 ? 1 : -1, seme: seme * 7919, lento: true };
        var sc = M.scena("gol", v, "gol", null, et, op); prove++;
        var tiro = sc.attori.filter(function (a) { return a.chi === "Tira"; })[0], passa = sc.attori.filter(function (a) { return a.chi === "Passa"; })[0];
        if (!tiro || !passa) { (ko[v] = ko[v] || []).push("seme " + seme + ": manca " + (!tiro ? "chi tira" : "chi passa")); continue; }
        // i tocchi: in ogni punto del pallone (fino alla rete) il giocatore più vicino, se è proprio lì
        var tocchi = [];
        sc.palla.forEach(function (b) {
          if (sc.rete != null && b[0] >= sc.rete - 1e-6) return;
          if ((b[3] || 0) > 2.6) return;   // (il pallone alto: lo tocca solo chi salta di testa fino a ~2,5 m)
          var best = null, bd = 1;
          sc.attori.forEach(function (a) { var p = dove(a.pts, b[0]); if (!p) return; var d = Math.sqrt(Math.pow(p[0] - b[1], 2) + Math.pow(p[1] - b[2], 2)); if (d < bd) { bd = d; best = a; } });
          if (best && bd < 0.035 && (!tocchi.length || tocchi[tocchi.length - 1].a !== best)) tocchi.push({ a: best, t: b[0] });
        });
        var it = -1; for (var i = tocchi.length - 1; i >= 0; i--) if (tocchi[i].a === tiro) { it = i; break; }
        if (it < 0) { (ko[v] = ko[v] || []).push("seme " + seme + ": chi segna non tocca mai il pallone"); continue; }
        var prima = it > 0 ? tocchi[it - 1].a : null;
        if (prima !== passa) (ko[v] = ko[v] || []).push("seme " + seme + ": prima di chi segna lo tocca " + (prima ? (prima.sq === "D" ? "un difensore" : prima.sq === "pD" ? "il portiere" : "un altro giocatore") + " a " + tocchi[it - 1].t.toFixed(2) : "nessuno"));
      }
    });
    var l = Object.keys(ko);
    if (l.length) no(l.map(function (v) { return v + " " + ko[v].length + "/300 (" + ko[v][0] + ")"; }).join(" · "));
    return SCENE.length + " azioni × 300 semi (" + prove + " gol con l'assist): l'ultimo tocco prima di chi segna è sempre di chi fa l'assist";
  } });
})();

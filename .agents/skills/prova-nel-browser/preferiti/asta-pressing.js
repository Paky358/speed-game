// PROVE DEL PRESSING ALTO NELLA GIORNATA DELLA MINI ASTA (16 nov 2026, il proprietario: «è una follia che non tira, fa veramente incazzare»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta-pressing.js"); await COPIONE.prova("pr1")
// Con Edge invisibile: prova.js --porta 8991 --carica preferiti/asta-pressing.js --prova pr1
//
// pr1 Le scene, 300 semi: il pressing col gol, l'occasione (parata, fuori, palo, traversa, sulla linea), il furto pulito (che poi TIRA) e il
//     fallo (giallo e rosso) sono identici fino al contrasto (giocatori, pose, pallone, arbitro, difensore sul palo, rallentatore); gol, occasione
//     e furto pulito sono identici fino al tiro; il furto pulito tira sempre e non è mai gol.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  async function motore(w) {
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {}, ag = "function costruisciMazzoFanta(n) {";
    if (src.indexOf(ag) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    src = src.replace(ag, "FUORI.scena = scena; " + ag);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, F);
    return F;
  }
  function dove(pts, t) {
    if (!pts.length) return null; if (t <= pts[0][0]) return pts[0].slice(1, 3);
    for (var i = 1; i < pts.length; i++) if (t <= pts[i][0]) { var a = pts[i - 1], b = pts[i], k = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 1; return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
    return pts[pts.length - 1].slice(1, 3);
  }
  function posa(pose, t) { var q = {}; pose.forEach(function (p) { if (p[0] <= t) q = p[1]; }); return JSON.stringify(q); }
  function diversi(a, b) { if (!a || !b) return a !== b; return Math.abs(a[0] - b[0]) > 1e-6 || Math.abs(a[1] - b[1]) > 1e-6; }
  function uguali(g, s, fino, qui, ko) {
    if (s.attori.length !== g.attori.length) { ko.push(qui + ": " + g.attori.length + " giocatori contro " + s.attori.length); return; }
    if (JSON.stringify(g.lento) !== JSON.stringify(s.lento)) ko.push(qui + ": rallentatore diverso");
    for (var t = 0; t <= fino; t += 0.0025) {
      if (diversi(dove(g.palla, t), dove(s.palla, t))) { ko.push(qui + ": il pallone è diverso a " + t.toFixed(3)); return; }
      for (var k = 0; k < g.attori.length; k++) { var a = g.attori[k], b = s.attori[k]; if (a.sq !== b.sq || diversi(dove(a.pts, t), dove(b.pts, t)) || posa(a.pose, t) !== posa(b.pose, t)) { ko.push(qui + ": " + (a.sq === "arb" ? "l'arbitro" : a.sq === "D" ? "un difensore" : a.sq === "pD" ? "il portiere" : "un giocatore") + " (n° " + k + ") diverso a " + t.toFixed(3)); return; } }
    }
  }
  COPIONE.aggiungi("pr1", { nome: "Mini Asta, il pressing alto: una scena sola fino al contrasto (gol, tiro, fallo, furto), il furto pulito tira e non segna mai", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), ko = [], prove = 0, esitiR = {};
    for (var seme = 1; seme <= 300 && ko.length < 20; seme++) {
      var chi = { vero: true, k: "Presser (Napoli)", num: 7 }, et = { tira: chi, fallo: chi, para: "Para" };
      var op = function () { return { verso: seme % 3 ? 1 : -1, lato: seme % 2 ? 1 : -1, seme: seme * 7919, lento: seme % 3 === 0, come: "pressing" }; };
      var G = M.scena("gol", "pressing", "gol", null, et, op());
      var occ = ["parata", "fuori", "palo", "traversa", "linea"].map(function (es) { return [es, M.scena("occ", "pressing", es, null, et, op())]; });
      var rec = ["parata", "fuori", "palo", "linea"].map(function (es) { return [es, M.scena("rec", null, es, null, et, op())]; });
      var fal = [["giallo", M.scena("amm", null, null, null, et, op())], ["rosso", M.scena("esp", null, null, null, et, op())]];
      prove++;
      var tT = G.tiroDa != null ? G.tiroDa : 0.67;
      occ.concat(rec).forEach(function (x, i) { uguali(G, x[1], tT - 0.003, "seme " + seme + " gol/" + (i < occ.length ? "occasione " : "furto ") + x[0], ko); });
      fal.forEach(function (x) { uguali(G, x[1], 0.485, "seme " + seme + " gol/fallo " + x[0], ko); });
      rec.forEach(function (x) { var sc = x[1]; if (sc.tiroDa == null) ko.push("seme " + seme + ": il furto pulito non tira (" + x[0] + ")"); if (sc.rete != null || sc.gol) ko.push("seme " + seme + ": il furto pulito finisce in gol"); esitiR[x[0]] = (esitiR[x[0]] || 0) + 1; });
    }
    if (ko.length) no(ko.length + " problemi: " + ko.slice(0, 5).join(" · "));
    return prove + " semi: gol, 5 occasioni, 4 furti puliti e 2 falli identici fino al contrasto; gol, occasioni e furti identici fino al tiro; il furto pulito tira sempre e mai gol";
  } });
})();

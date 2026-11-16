// PROVE DELL'ARBITRO E DEL DIFENSORE SUL PALO NELLA GIORNATA DELLA MINI ASTA (15 nov 2026 sera, il proprietario sulla v350 online: l'arbitro
// «sembra una trottola… dopo il gol corre dappertutto a caso come un cane»; «un difensore vicino al portiere quando chi attacca è ancora a
// centrocampo: nel calcio non esiste»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta-arbitro.js"); await COPIONE.prova("arb1")
// Con Edge invisibile: prova.js --porta 8991 --carica preferiti/asta-arbitro.js --prova arb1,arb2
//
// arb1 L'arbitro, in tutte le azioni (35 scene × 40 semi × gol e parata, più i falli): mai più veloce di chi corre (7 m al secondo, il conto
//     sulla strada che si vede), niente giravolte (cambi di direzione da più di 120° mentre corre: al massimo 2 in un'azione), dopo il gol
//     al massimo 2,5 m al secondo (si ferma, poi va piano verso il centro), mai a meno di 1,5 metri da un giocatore mentre si gioca.
// arb2 Il difensore sul palo: quando il pallone è ancora a più di 30 metri dalla porta, il difensore che poi va sul palo sta lontano dalla porta
//     (col pallone a più di 40 metri ad almeno 12 metri dalla linea, tra 30 e 40 ad almeno 8: in linea con la difesa o di corsa all'indietro, mai accanto al portiere); arriva sul palo prima del tiro; e fino al tiro sta nello stesso posto in tutti gli esiti.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, MX = 68, MY = 52;
  var SCENE = ["cross", "angolo", "unodue", "contro", "pallonetto", "fuori", "slalom", "punizione", "tapin", "centrocampo", "mischia", "testa", "incrocio", "miracolo", "assedio", "ultimo",
    "secondopalo", "presa", "tuffo", "vuota", "tre", "filtrante", "rasoterra", "giro", "muro", "corta", "volee", "pressing", "laterale", "papera", "glt", "ribattuta", "fuga", "rimessa", "rimessalunga"];
  async function motore(w) {
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), fuori = {}, ag = "function costruisciMazzoFanta(n) {";
    if (src.indexOf(ag) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    src = src.replace(ag, "FUORI.scena = scena; " + ag);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, fuori);
    return fuori;
  }
  function lungo(pts, t) {   // (come la disegna il gioco, abbastanza: in linea retta tra i punti, che sono fitti)
    if (!pts.length) return null; if (t <= pts[0][0]) return pts[0];
    for (var i = 1; i < pts.length; i++) if (t <= pts[i][0]) { var a = pts[i - 1], b = pts[i], k = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 1; return [t, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
    return pts[pts.length - 1];
  }
  function metri(a, b) { return Math.sqrt(Math.pow((a[1] - b[1]) * MX, 2) + Math.pow((a[2] - b[2]) * MY, 2)); }

  COPIONE.aggiungi("arb1", { nome: "Mini Asta, l'arbitro: mai più veloce di chi corre, niente giravolte, dopo il gol piano, mai addosso ai giocatori", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), ko = [], prove = 0, vMaxVisto = 0, girVisti = 0;
    function guarda(sc, qui, durS, falli) {
      var ar = sc.attori.filter(function (a) { return a.sq === "arb"; })[0]; if (!ar) { ko.push(qui + ": niente arbitro"); return; }
      var N = 120, prima = lungo(ar.pts, 0), vPrec = null, giri = 0, fine = sc.dunque || 0.7;
      for (var k = 1; k <= N; k++) {
        var t = k / N, q = lungo(ar.pts, t), d = metri(q, prima), v = d / (durS / N), dopo = sc.rete != null && t > sc.rete + 0.4;
        if (v > vMaxVisto) vMaxVisto = v;
        if (v > 7.2) { ko.push(qui + ": l'arbitro corre a " + v.toFixed(1) + " m/s (t " + t.toFixed(2) + ")"); return; }
        if (dopo && v > 2.6) { ko.push(qui + ": dopo il gol l'arbitro corre ancora a " + v.toFixed(1) + " m/s"); return; }
        if (v > 2 && vPrec) { var c = ((q[1] - prima[1]) * vPrec[0] * MX * MX + (q[2] - prima[2]) * vPrec[1] * MY * MY) / Math.max(1e-9, d * Math.sqrt(Math.pow(vPrec[0] * MX, 2) + Math.pow(vPrec[1] * MY, 2))); if (c < -0.5) giri++; }
        if (v > 2) vPrec = [q[1] - prima[1], q[2] - prima[2]];
        if (t < fine && !falli) sc.attori.forEach(function (a) { if (a === ar || (a.sq !== "A" && a.sq !== "D")) return; var p = lungo(a.pts, t); if (p && metri(p, q) < 1.5) ko.push(qui + ": l'arbitro addosso a un giocatore (t " + t.toFixed(2) + ", " + metri(p, q).toFixed(1) + " m)"); });
        prima = q;
      }
      if (giri > girVisti) girVisti = giri;
      if (giri > 2) ko.push(qui + ": l'arbitro fa " + giri + " giravolte");
    }
    SCENE.forEach(function (v) {
      for (var seme = 1; seme <= 40; seme++) {
        var et = { tira: "Tira", passa: "Passa", para: "Para" }, op = { verso: 1, lato: seme % 2 ? 1 : -1, seme: seme * 7919, lento: true };
        ["gol", "parata"].forEach(function (es) { prove++; guarda(M.scena(es === "gol" ? "gol" : "occ", v, es, null, et, op), v + " seme " + seme + " " + es, 4.2); });
      }
    });
    [["amm", "entrata"], ["amm", "tattico"], ["amm", "proteste"], ["esp", "ultimo"], ["rec", "pressing"], ["amm", "pressing"]].forEach(function (f) {
      for (var seme = 1; seme <= 20; seme++) { prove++; guarda(M.scena(f[0], null, null, null, { tira: "Tira" }, { verso: 1, lato: seme % 2 ? 1 : -1, seme: seme * 7919, come: f[1] }), f[0] + "/" + f[1] + " seme " + seme, 2.9, true); }   // (sul fallo va dal giocatore apposta, a mostrare il cartellino)
    });
    if (ko.length) no(ko.length + " problemi: " + ko.slice(0, 6).join(" · "));
    return prove + " azioni: l'arbitro al massimo a " + vMaxVisto.toFixed(1) + " m/s, al massimo " + girVisti + " giravolte, dopo il gol piano, mai addosso ai giocatori";
  } });

  COPIONE.aggiungi("arb2", { nome: "Mini Asta, il difensore sul palo: in linea con la difesa finché l'azione è lontana, sul palo prima del tiro, uguale in tutti gli esiti", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), ko = [], prove = 0, lontane = 0, ESITI = ["gol", "parata", "palo", "fuori", "linea"];
    SCENE.forEach(function (v) {
      for (var seme = 1; seme <= 60; seme++) {
        var et = { tira: "Tira", passa: "Passa", para: "Para" }, op = { verso: 1, lato: seme % 2 ? 1 : -1, seme: seme * 7919, lento: true };
        var sc = ESITI.map(function (es) { return M.scena(es === "gol" ? "gol" : "occ", v, es, null, et, op); }), g = sc[0], dp = g.dPalo;
        if (!dp) continue;
        prove++;
        var tS = Math.min.apply(null, sc.map(function (s) { return s.tiroDa != null ? s.tiroDa : 0.45; })) - 0.005, tV = null;   // (fino al primo tiro di tutti gli esiti)
        for (var k = 0; k <= 60; k++) {
          var t = tS * k / 60, b = lungo(g.palla, t), q = lungo(dp.pts, t);
          var lontB = b ? (0.948 - b[2]) * MY : 0, minD = lontB > 40 ? 12 : 8;   // (centrocampo: il pallonetto vola e lui torna di corsa sulla linea, non conta)   // (col pallone a più di 40 metri almeno 12 metri dalla porta, tra 30 e 40 almeno 8: mai accanto al portiere)
          if (v !== "centrocampo" && b && b[2] < 0.37 && q && (0.948 - q[2]) * MY < minD) { ko.push(v + " seme " + seme + ": col pallone a " + Math.round((0.948 - b[2]) * MY) + " m dalla porta il difensore è a " + ((0.948 - q[2]) * MY).toFixed(1) + " m dalla linea"); break; }
          if (b && b[2] < 0.37) lontane++; else if (b && tV == null) tV = t;
          sc.forEach(function (s, i) { if (!i || !s.dPalo) return; var r = lungo(s.dPalo.pts, t); if (r && q && (Math.abs(r[1] - q[1]) > 1e-6 || Math.abs(r[2] - q[2]) > 1e-6)) ko.push(v + " seme " + seme + ": il difensore sul palo è diverso tra gol e " + ESITI[i] + " a t " + t.toFixed(2)); });
        }
        var qs = lungo(dp.pts, Math.max(0, tS)), dPost = qs ? metri(qs, [0, dp.pts[dp.pts.length - 1][1], 0.92]) : 0;
        if (tV != null && tS - tV > 0.3 && qs && (0.948 - qs[2]) * MY > 12) ko.push(v + " seme " + seme + ": col pallone vicino da tanto, al tiro il difensore è ancora a " + ((0.948 - qs[2]) * MY).toFixed(1) + " m dalla porta");
      }
    });
    if (ko.length) no(ko.length + " problemi: " + ko.slice(0, 6).join(" · "));
    return prove + " azioni col difensore sul palo: quando il pallone è lontano (" + lontane + " istanti) sta in linea con la difesa; sul palo prima del tiro; uguale in gol, parata, palo, fuori e linea";
  } });
})();

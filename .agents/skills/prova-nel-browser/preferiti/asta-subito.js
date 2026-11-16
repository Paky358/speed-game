// PROVE DI CHI SUBISCE IL RIGORE NELLA GIORNATA DELLA MINI ASTA (16 nov 2026 notte, il proprietario col Cervello: chi subisce il fallo si
// sceglie tra i calciatori della squadra, pesati come chi segna, MAI guardando l'esito; se è il 2° o il 3° rigorista lo batte lui più spesso
// (1 volta su 3); se non è tra i rigoristi non lo batte mai; se è comprato il rigore è anche un suo momento, senza punti).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta-subito.js"); await COPIONE.prova("rs1")
// Con Edge invisibile: prova.js --porta 8991 --carica preferiti/asta-subito.js --prova rs1,rs2
//
// rs1 Le scene, 300 semi: il rigore con chi l'ha subito (vostro, calciatore vero senza padrone, o nessuno) col gol, il cucchiaio, la parata
//     (anche con la ribattuta), fuori, palo, traversa e alto: fino al calcio TUTTI identici (chi ha subito il fallo compreso: dove sta e cosa
//     fa), anche il nome di chi ha il pallone; chi ha subito il fallo c'è in ogni esito, fuori dall'area.
// rs2 Senza telefoni, 4.000 giornate con rose a caso da 2 a 10: chi subisce il rigore non è mai un portiere, più spesso un attaccante; il 2°
//     e il 3° rigorista che lo subiscono lo battono circa 1 volta su 3, il 1° circa 3 su 4, chi non è tra i rigoristi mai; chi subisce non
//     dice niente sull'esito (quando è vostro i rigori finiscono in gol, parati e fuori come quando non lo è); il rigore si vede SOLO se
//     qualcuno ha chi lo batte o il portiere che lo deve parare: subito da un vostro, senza chi batte né portiere = NON si vede (16 nov
//     2026, il proprietario); chi l'ha subito non ha mai un momento suo.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  async function motore(w) {
    if (w.SG && w.SG.scaricaGioco) await w.SG.scaricaGioco("asta");
    if (!w.SG_FANTA_CALCIATORI) { w.SGCuore && w.SGCuore.precarica && w.SGCuore.precarica("astafanta"); await W.aspetta(function () { return w.SG_FANTA_CALCIATORI && w.SG_FANTA_SQUADRE; }, 20000); }
    if (!w.SG_FANTA_CALCIATORI) no("il listone del fanta non arriva");
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {}, ag = "function costruisciMazzoFanta(n) {";
    if (src.indexOf(ag) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    src = src.replace(ag, "FUORI.scena = scena; FUORI.nomeSotto = nomeSottoPiedi; FUORI.mazzo = costruisciMazzoFanta; FUORI.giornata = giornataSerieA; FUORI.lista = listaMomenti; FUORI.chiave = chiaveCalc; FUORI.rig = rigoristiDi; FUORI.rose = roseSerieA; " + ag);
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

  COPIONE.aggiungi("rs1", { nome: "Mini Asta, chi subisce il rigore: in campo in ogni esito, e fino al calcio tutto identico (niente spoiler)", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), ko = [], prove = 0;
    var ESITI = [["gol", "gol", {}], ["cucchiaio", "gol", {}], ["parata", "parata", {}], ["parata", "parata", { rib: 1 }], ["parata", "parata", { ribGol: 1 }], ["fuori", "occ", {}], ["palo", "occ", {}], ["traversa", "occ", {}], ["alto", "occ", {}]];
    var SUB = [["vostro", { nome: "Subito", faccia: "x", pc: "#ff0", pr: "Giulia", k: "Subito (Napoli)" }], ["vero", { vero: true, k: "Politano (Napoli)", num: 21 }], ["nessuno", null]];
    SUB.forEach(function (sb) {
      for (var seme = 1; seme <= 300; seme++) {
        var op0 = { verso: seme % 3 ? 1 : -1, lato: seme % 2 ? 1 : -1, seme: seme * 7919, lento: true };
        var sc = ESITI.map(function (e) { var op = {}; for (var q in op0) op[q] = op0[q]; for (q in e[2]) op[q] = e[2][q]; return M.scena("rig", null, e[0], e[0] === "fuori" || e[0] === "palo" || e[0] === "traversa" || e[0] === "alto" ? e[0] : null, { tira: "Tira", para: "Para", sub: sb[1] }, op); });
        prove++;
        var g = sc[0], iS = -1;
        if (sb[1]) g.attori.forEach(function (a, k) { if (iS < 0 && a.chi === sb[1] && a.sq === "A") iS = k; });
        if (iS < 0 && sb[1]) { ko.push(sb[0] + " seme " + seme + ": chi ha subito il fallo non c'è"); continue; }
        if (iS >= 0) { var p0 = dove(g.attori[iS].pts, 0); if (!p0 || p0[1] > 0.63) ko.push(sb[0] + " seme " + seme + ": chi ha subito il fallo parte dentro l'area (" + (p0 && p0[1].toFixed(2)) + ")"); }
        var tC = Math.min.apply(null, sc.map(function (s) { return s.calcio != null ? s.calcio : 0.43; }));
        sc.forEach(function (s, i) {
          if (!i) return;
          var qui = sb[0] + " seme " + seme + " gol/" + ESITI[i][0] + (ESITI[i][2].rib ? "+ribattuta" : ESITI[i][2].ribGol ? "+ribattuta gol" : "");
          if (s.attori.length !== g.attori.length) { ko.push(qui + ": " + g.attori.length + " giocatori contro " + s.attori.length); return; }
          for (var t = 0; t <= tC; t += 0.0025) {
            for (var k = 0; k < g.attori.length; k++) {
              var a = g.attori[k], b = s.attori[k];
              if (a.sq !== b.sq || a.chi !== b.chi || diversi(dove(a.pts, t), dove(b.pts, t)) || posa(a.pose, t) !== posa(b.pose, t)) { ko.push(qui + ": " + (k === iS ? "chi ha subito il fallo" : "il n° " + k) + " diverso a " + t.toFixed(3) + " (il calcio a " + tC.toFixed(3) + ")"); t = 2; break; }
            }
            var na = M.nomeSotto(g, t, function () { return true; }), nb = M.nomeSotto(s, t, function () { return true; });
            if (t < 2 && JSON.stringify(na && [na.i, Math.round(na.al * 1000)]) !== JSON.stringify(nb && [nb.i, Math.round(nb.al * 1000)])) { ko.push(qui + ": il nome di chi ha il pallone è diverso a " + t.toFixed(3)); t = 2; }
          }
        });
        if (ko.length > 20) break;
      }
    });
    if (ko.length) no(ko.length + " differenze: " + ko.slice(0, 5).join(" · "));
    return prove + " rigori × 9 esiti: chi ha subito il fallo (vostro, vero o nessuno) c'è sempre, fuori dall'area, e fino al calcio tutto è identico";
  } });

  COPIONE.aggiungi("rs2", { nome: "Mini Asta, chi subisce il rigore: come chi segna, mai un portiere; il 2° e il 3° rigorista lo battono 1 volta su 3; non dice l'esito; si vede solo per chi batte o per il portiere", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), ko = [], RU = {}, giornate = 4000;
    Object.keys(M.rose()).forEach(function (sq) { M.rose()[sq].forEach(function (y) { RU[y.k] = y.ruolo; }); });
    var ruoli = { A: 0, C: 0, D: 0, P: 0, X: 0 }, tira = [[0, 0], [0, 0], [0, 0], [0, 0]], esV = {}, esN = {}, tot = 0, momenti = 0, nN = 0, conSub = 0;
    function conta(o, t) { o[t] = (o[t] || 0) + 1; o.tot = (o.tot || 0) + 1; }
    for (var i = 0; i < giornate && ko.length < 20; i++) {
      var n = 2 + (i % 9), m = M.mazzo(n), righe = [], per = { P: [], D: [], C: [], A: [] }, Aq = {}, miei = {};
      m.forEach(function (c) { c.valore = 4 + (i * 7 + c.nome.length) % 20; (per[c.ruolo] = per[c.ruolo] || []).push(c); });
      for (var k = 0; k < n; k++) righe.push({ id: "g" + k, nome: "G" + k, kit: [per.P[k], per.D[k], per.C[2 * k], per.C[2 * k + 1], per.A[k]].filter(Boolean), totale: 50, crediti: 0 });
      var porDi = {}; righe.forEach(function (r) { r.kit.forEach(function (c, kk) { miei[M.chiave(c)] = { r: r, k: kk }; if (c.ruolo === "P") porDi[c.squadra] = 1; }); });
      M.giornata(righe, Aq);
      var lista = M.lista(Aq, righe, function (r) { return r.gio; }, false), vista = {};
      lista.forEach(function (x) { if (x.e && x.focus && x.e.t !== "ribP") vista[x.p + "|" + x.ei] = x; });
      (Aq.partite || []).forEach(function (P, pi) { P.ev.forEach(function (e, ei) {
        if (!/^rig[PFN]?$/.test(e.t)) return;
        if (!("sub" in e)) { ko.push("un rigore senza chi l'ha subito"); return; }
        tot++; ruoli[e.sub ? RU[e.sub] || "X" : "X"]++;
        if (e.sub && RU[e.sub] === "P") ko.push("giornata " + i + ": il rigore l'ha subito un portiere (" + e.sub + ")");
        var l = M.rig(e.s === "c" ? P.c : P.f), js = e.sub ? l.map(function (y) { return y.k; }).indexOf(e.sub) : -1;
        tira[js < 0 ? 3 : Math.min(js, 2)][0]++; if (e.sub && e.sub === e.chi) tira[js < 0 ? 3 : Math.min(js, 2)][1]++;
        if (js < 0 && e.sub && e.sub === e.chi) ko.push("giornata " + i + ": batte il rigore chi l'ha subito ma non è tra i rigoristi (" + e.sub + ")");
        if (e.t !== "rigN") conta(e.sub && miei[e.sub] ? esV : esN, e.t);
        // si vede SOLO se qualcuno ha chi lo batte o il portiere che lo deve parare (16 nov 2026, il proprietario: chi l'ha subito non basta)
        var g = e.sub && miei[e.sub], dif = e.s === "c" ? P.f : P.c, vedi = !!(e.chi && miei[e.chi]) || !!porDi[dif], visto = !!vista[pi + "|" + ei];
        if (visto !== vedi) ko.push("giornata " + i + ": il rigore (" + e.t + ") " + (visto ? "si vede ma nessuno ha chi lo batte né il portiere" : "non si vede ma qualcuno ha chi lo batte o il portiere"));
        if (g && e.sub !== e.chi) {
          var mio = g.r.gio.cal[g.k].ev.filter(function (z) { return z.p === pi && z.e === ei; });
          if (mio.length) ko.push("giornata " + i + ": il vostro che ha subito il rigore ha un momento suo (" + JSON.stringify(mio) + ")");
          if (visto && vista[pi + "|" + ei].chi.some(function (y) { return y.r === g.r && y.k === g.k; })) ko.push("giornata " + i + ": chi ha subito il rigore è tra chi c'entra");
          if (!vedi) { momenti++; if (e.t === "rigN") nN++; } else conSub++;
        }
      }); });
    }
    if (ko.length) no(ko.length + " problemi: " + ko.slice(0, 5).join(" · "));
    var pc = function (a, b) { return b ? Math.round(1000 * a / b) / 10 : 0; };
    if (!(ruoli.A > ruoli.C && ruoli.C > ruoli.D)) no("chi subisce non è pesato come chi segna: " + JSON.stringify(ruoli));
    var t1 = pc(tira[0][1], tira[0][0]), t2 = pc(tira[1][1], tira[1][0]), t3 = pc(tira[2][1], tira[2][0]);
    if (t1 < 68 || t1 > 82) no("il 1° rigorista che subisce lo batte il " + t1 + "% (deve essere circa 75%)");
    if (t2 < 27 || t2 > 40) no("il 2° rigorista che subisce lo batte il " + t2 + "% (deve essere circa 1 su 3)");
    if (tira[2][0] > 100 && (t3 < 25 || t3 > 42)) no("il 3° rigorista che subisce lo batte il " + t3 + "% (deve essere circa 1 su 3)");
    if (!momenti || !nN || !conSub) no("pochi casi: " + momenti + " rigori subiti da un vostro senza chi batte né portiere, " + nN + " col VAR, " + conSub + " visti per chi batte o per il portiere");
    var gV = pc(esV.rig || 0, esV.tot), gN = pc(esN.rig || 0, esN.tot), pV = pc(esV.rigP || 0, esV.tot), pN = pc(esN.rigP || 0, esN.tot);
    if (Math.abs(gV - gN) > 4 || Math.abs(pV - pN) > 4) no("quando il rigore l'ha subito un vostro finisce diversamente: gol " + gV + "% / " + gN + "%, parati " + pV + "% / " + pN + "%");
    return giornate + " giornate, " + tot + " rigori: chi subisce A " + pc(ruoli.A, tot) + "%, C " + pc(ruoli.C, tot) + "%, D " + pc(ruoli.D, tot) + "%, uno che nel gioco non c'è " + pc(ruoli.X, tot) + "%, portieri mai; chi subisce lo batte: 1° rigorista " + t1 + "%, 2° " + t2 + "%, 3° " + t3 + "%, gli altri mai; subito da un vostro: gol " + gV + "% (gli altri " + gN + "%), parati " + pV + "% (" + pN + "%); " + momenti + " rigori subiti da un vostro senza che nessuno abbia chi batte né il portiere (" + nN + " col VAR): NON visti; " + conSub + " visti per chi batte o per il portiere, con lui in campo ma senza un momento suo";
  } });

  // rs3 (16 nov 2026, il proprietario: «l'azione che ha portato al rigore e poi il rigore») l'azione del fallo prima del dischetto (scena «frig»):
  //     per come è nato il rigore (fallo, mano, VAR), 300 semi e chi l'ha subito (vostro, vero, nessuno, o lo batte lui): la scena è IDENTICA
  //     qualunque cosa succeda dopo (gol, parata, fuori, rigore negato: la scena non lo sa); sul fallo chi lo subisce è in area e va giù al contatto;
  //     col fallo e col mano l'arbitro fischia e indica il dischetto, col VAR niente fischio (si gioca, poi lo chiama il VAR)
  COPIONE.aggiungi("rs3", { nome: "Mini Asta, l'azione che porta al rigore: identica in ogni esito, il fallo in area, il fischio e il dischetto (col VAR si gioca)", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), ko = [], prove = 0, fischi = { fallo: 0, mano: 0, var: 0 };
    var SUB = [["vostro", { nome: "Subito", faccia: "x", pc: "#ff0", pr: "Giulia", k: "Subito (Napoli)" }], ["vero", { vero: true, k: "Politano (Napoli)", num: 21 }], ["nessuno", null], ["lo batte lui", undefined]];
    function firma(sc) { return JSON.stringify([sc.attori.map(function (a) { return [a.sq, a.chi && (a.chi.k || a.chi), a.pts, a.pose]; }), sc.palla, sc.fischi || null, sc.lento, sc.dunque]); }
    ["fallo", "mano", "var"].forEach(function (cm) {
      SUB.forEach(function (sb) {
        for (var seme = 1; seme <= 300; seme++) {
          var op = { verso: seme % 3 ? 1 : -1, lato: seme % 2 ? 1 : -1, seme: seme * 7919, lento: true, come: cm }, et = { tira: { vero: true, k: "Tira (Napoli)", num: 9 }, para: "Para" };
          if (sb[1] !== undefined) et.sub = sb[1];
          var l = [null, "gol", "parata", "fuori", "palo"].map(function (es) { var o = {}; for (var k in op) o[k] = op[k]; return M.scena("frig", null, es, es === "palo" ? "palo" : null, et, o); }), f0 = firma(l[0]);
          prove++;
          l.forEach(function (sc, i) { if (i && firma(sc) !== f0) ko.push(cm + " " + sb[0] + " seme " + seme + ": l'azione cambia con l'esito"); });
          var sc = l[0], chiS = sb[1] !== undefined ? sb[1] : et.tira, a = sc.attori.filter(function (x) { return x.sq === "A" && x.chi === chiS; })[0];
          if (!a) { ko.push(cm + " " + sb[0] + " seme " + seme + ": non c'è chi subisce"); continue; }
          if (cm !== "mano") {
            var q = dove(a.pts, 0.5), giu = a.pose.filter(function (p) { return p[0] <= 0.56; }).pop();
            if (!q || q[1] < 0.63) ko.push(cm + " seme " + seme + ": al contatto chi subisce non è in area (" + (q && q[1].toFixed(2)) + ")");
            if (!giu || !giu[1].cade) ko.push(cm + " seme " + seme + ": chi subisce non va giù");
          }
          var ar = sc.attori.filter(function (x) { return x.sq === "arb"; })[0], pu = ar && ar.pose.some(function (p) { return p[1].punta; });
          if (cm === "var") { if (sc.fischi && sc.fischi.length) ko.push("VAR seme " + seme + ": l'arbitro fischia"); if (pu) ko.push("VAR seme " + seme + ": l'arbitro indica il dischetto"); }
          else { if (!sc.fischi || !sc.fischi.length) ko.push(cm + " seme " + seme + ": niente fischio"); else fischi[cm]++; if (!pu) ko.push(cm + " seme " + seme + ": l'arbitro non indica il dischetto"); }
          if (ko.length > 20) break;
        }
      });
    });
    if (ko.length) no(ko.length + " problemi: " + ko.slice(0, 5).join(" · "));
    return prove + " azioni (fallo, mano, VAR × 4 modi di chi subisce × 300 semi): identiche con gol, parata, fuori, palo e senza esito; sul fallo in area e giù al contatto; fischio e dischetto " + (fischi.fallo + fischi.mano) + " volte, col VAR mai";
  } });
})();

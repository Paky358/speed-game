// PROVE DELLA METÀ CAMPO E DEL RIGORE CONTRO IL VOSTRO PORTIERE NELLA GIORNATA DELLA MINI ASTA (15 nov 2026 notte, il proprietario:
// «nello stesso tempo la stessa squadra attacca una volta la porta di sopra e una volta quella di sotto»; «se qualcuno ha il portiere,
// quel rigore deve vedersi»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta-lati.js"); await COPIONE.prova("lt1")
// Con Edge invisibile: prova.js --porta 8991 --carica preferiti/asta-lati.js --prova lt1,lt2,rf1
//
// lt1 Senza telefoni, 3.000 partite: il sorteggio della metà campo (versoDi) dà la porta in basso alla squadra di casa circa una volta su
//     due; nella stessa partita e nello stesso tempo le due squadre attaccano porte opposte; dal primo al secondo tempo ognuna cambia
//     porta; il 45' è del primo tempo, il recupero (91'-95') del secondo; è uguale su tutti i telefoni (dipende solo da partita e giornata).
// lt2 Sullo stesso telefono in 3, col ⏩: in una partita si mettono apposta (SG_PROVA_SERIEA) azioni dei due tempi delle DUE squadre:
//     occasioni e un rigore di un calciatore comprato, un autogol suo e un fallo da ultimo uomo suo (lì attacca l'altra squadra), anche
//     al 45', al 75' e nel recupero. Per ogni scena che si vede davvero (SG_PROVA_LATO, la porta disegnata): nello stesso tempo ogni
//     squadra attacca sempre la stessa porta, le due squadre porte opposte, e nel secondo tempo si cambia lato.
// rf1 Senza telefoni, 1.500 giornate da 2 a 10 con rose a caso: ogni rigore contro un portiere comprato (gol, parato, sbagliato fuori
//     o sul palo) dà un momento al portiere e si vede in campo, in OGNI esito (prima il rigore fuori non si vedeva: vederlo voleva dire
//     «non va fuori»); il rigore fuori non dà punti né cambia il voto del portiere.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  async function motore(w) {   // il file del gioco con le funzioni di dentro portate fuori (solo per la prova), dentro il telefono w
    if (w.SG && w.SG.scaricaGioco) await w.SG.scaricaGioco("asta");   // (i giochi e i loro dati arrivano quando servono)
    if (!w.SG_FANTA_CALCIATORI) { w.SGCuore && w.SGCuore.precarica && w.SGCuore.precarica("astafanta"); await W.aspetta(function () { return w.SG_FANTA_CALCIATORI && w.SG_FANTA_SQUADRE; }, 20000); }
    if (!w.SG_FANTA_CALCIATORI) no("il listone del fanta non arriva");
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {}, ag = "function costruisciMazzoFanta(n) {";
    if (src.indexOf(ag) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    src = src.replace(ag, "FUORI.mazzo = costruisciMazzoFanta; FUORI.giornata = giornataSerieA; FUORI.lista = listaMomenti; FUORI.verso = versoDi; FUORI.chiave = chiaveCalc; " + ag);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, F);
    if (!F.verso) no("nel file del gioco non c'è versoDi");
    return F;
  }

  COPIONE.aggiungi("lt1", { nome: "Mini Asta, la metà campo: un sorteggio per partita, le squadre su porte opposte, nel secondo tempo si cambia", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), F = await motore(w), sq = Object.keys((w.SG_FANTA_SQUADRE || {}).squadre || {}), ko = [], giu = 0, N = 3000, cambiaG = 0;
    if (sq.length < 10) no("le squadre di Serie A non arrivano");
    for (var i = 0; i < N; i++) {
      var a = sq[i % sq.length], b = sq[(i * 7 + 3 + Math.floor(i / sq.length)) % sq.length]; if (a === b) b = sq[(sq.indexOf(a) + 1) % sq.length];
      var P = { c: a, f: b }, gk = i % 4 === 3 ? null : i % 4, c1 = F.verso(P, gk, a, 10);
      if (c1 > 0) giu++;
      if (F.verso(P, gk, a, 10) !== F.verso({ c: a, f: b }, gk, a, 10)) ko.push(a + "-" + b + ": il sorteggio non è sempre lo stesso");
      [1, 12, 30, 44, 45, 45.2].forEach(function (m) { if (F.verso(P, gk, a, m) !== c1) ko.push(a + "-" + b + " al " + m + "': la squadra di casa cambia porta nel primo tempo"); if (F.verso(P, gk, b, m) !== -c1) ko.push(a + "-" + b + " al " + m + "': le due squadre attaccano la stessa porta"); });
      [46, 60, 74.9, 75, 89, 90, 91, 93, 95].forEach(function (m) { if (F.verso(P, gk, a, m) !== -c1) ko.push(a + "-" + b + " al " + m + "': nel secondo tempo la squadra di casa non ha cambiato porta"); if (F.verso(P, gk, b, m) !== c1) ko.push(a + "-" + b + " al " + m + "': nel secondo tempo le due squadre attaccano la stessa porta"); });
      if (gk === 0 && F.verso(P, 1, a, 10) !== c1) cambiaG++;
      if (ko.length > 10) break;
    }
    if (ko.length) no(ko.length + " problemi: " + ko.slice(0, 5).join(" · "));
    var pg = Math.round(giu / N * 1000) / 10;
    if (pg < 42 || pg > 58) no("il sorteggio non è giusto: la squadra di casa attacca la porta in basso nel " + pg + "% delle partite");
    if (!cambiaG) no("il sorteggio è uguale in tutte le giornate");
    return N + " partite: la squadra di casa parte verso la porta in basso nel " + pg + "% (l'altra metà verso quella in alto); stessa porta per tutto il tempo, le due squadre opposte, nel secondo tempo (anche nel recupero) si cambia; il 45' è del primo tempo";
  } });

  COPIONE.aggiungi("lt2", { nome: "Mini Asta sullo stesso telefono in 3: in campo ogni squadra attacca la stessa porta per tutto il tempo, opposta all'altra, e cambia nel secondo tempo", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"], visti = [], messi = [], partita = null, sbagli = [];
    try { localStorage.setItem("sg-asta-veloce", "1"); } catch (e) {}
    var P = await W.apriTel("Paky", { x: 0 });
    try { P.localStorage.setItem("sg-asta-veloce", "1"); } catch (e) {}
    P.SG_PROVA_SERIEA = function (Aq, h) {
      // la partita con un calciatore comprato (non portiere) in tutte e due le squadre: così si vedono le azioni delle due nei due tempi
      var campo = [], Pq = null, cX = null, cY = null;
      h.righe.forEach(function (y) { y.kit.forEach(function (k) { if (k.ruolo !== "P") campo.push(k); }); });
      Aq.partite.some(function (y) { var a = campo.filter(function (k) { return k.squadra === y.c; })[0], b = campo.filter(function (k) { return k.squadra === y.f; })[0]; if (a && b) { Pq = y; cX = a; cY = b; } return !!Pq; });
      if (!Pq) { cX = campo[0]; Pq = cX ? Aq.partite.filter(function (y) { return y.c === cX.squadra || y.f === cX.squadra; })[0] : null; }   // (nessuna: una squadra sola, e i falli da ultimo uomo per l'altra)
      if (!Pq) return;
      Aq.partite.forEach(function (y) { y.ev = []; h.rifai(y); });   // (solo le azioni messe apposta: la giornata è corta)
      partita = Pq.c + "-" + Pq.f;
      var sX = Pq.c === cX.squadra ? "c" : "f", sY = sX === "c" ? "f" : "c", kX = h.chiave(cX), kY = cY ? h.chiave(cY) : null;
      function ev(o, chi, s) { o.s = s; o.chi = chi; Pq.ev.push(o); messi.push(o.m + "' " + o.t); }
      ev({ m: 5, t: "occ", esito: "parata", v: "cross" }, kX, sX);
      ev({ m: 23, t: "amm", come: "ultimo" }, kX, sX);   // (il fallo da ultimo uomo: attacca l'altra squadra)
      ev({ m: 33, t: "occ", esito: "fuori", v: "unodue" }, kX, sX);
      ev({ m: 45, t: "rigP", come: "fallo" }, kX, sX);
      ev({ m: 55, t: "occ", esito: "parata", v: "contro" }, kX, sX);
      ev({ m: 80, t: "occ", esito: "parata", v: "slalom" }, kX, sX);
      if (kY) {
        ev({ m: 10, t: "occ", esito: "parata", v: "fuori" }, kY, sY); ev({ m: 40, t: "occ", esito: "fuori", v: "cross" }, kY, sY);
        ev({ m: 50, t: "occ", esito: "parata", v: "unodue" }, kY, sY); ev({ m: 62, t: "amm", come: "ultimo" }, kY, sY); ev({ m: 92, t: "occ", esito: "fuori", v: "cross" }, kY, sY);
        ev({ m: 93, t: "occ", esito: "fuori", v: "fuori" }, kX, sX);
      } else ev({ m: 92, t: "esp", come: "ultimo" }, kX, sX);   // (una squadra sola: il rosso da ultimo uomo nel recupero, per l'altra)
      Pq.ev.sort(function (a, b) { return a.m - b.m; }); h.rifai(Pq);
    };
    P.SG_PROVA_LATO = function (d) { visti.push(d); };
    var tess = await W.aspetta(function () { return A.tessera(P, "Mini Asta Fantacalcio"); }, 6000); if (!tess) no("non trovo la tessera");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non c'è «Su questo telefono»");
    await W.aspetta(function () { return q(P, ".sala-riga input"); }, 3000);
    while (qa(P, ".sala-riga input").length < NOMI.length) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    qa(P, ".sala-riga input").forEach(function (c, k) { c.value = NOMI[k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    if (!await W.aspetta(function () { if (q(P, ".st-stadio .sa-pers")) return true; var b = qa(P, ".schermata .piede button, .btn").filter(function (x) { return /Avanti|Comincia|Gioca|Inizia|Via|▶/.test(x.textContent) && !x.disabled && visibile(x); })[0]; if (b) b.click(); return false; }, 12000)) no("l'asta non comincia");
    var fino = Date.now() + 200000;
    while (Date.now() < fino && !q(P, ".st-rivela")) {
      var bFs = qa(P, "button").filter(function (b) { return /Fine scambi/.test(b.textContent) && visibile(b); })[0];
      if (bFs) { bFs.click(); P.__scambiati = true; await W.dorme(500); continue; }
      var pz = q(P, ".sa-prezzo b, .st-prezzo b");
      if (q(P, ".st-stadio .sa-pers") && !q(P, ".sa-aggiudicato") && pz) {
        var cp = qa(P, ".sa-pers.guida")[0];
        if (!cp) { var pu = q(P, ".sa-pers.puo"); if (pu) pu.click(); }
        else { var c0 = cp.querySelector("b").textContent; qa(P, ".sa-pers").forEach(function (p) { var b = p.querySelector("b").textContent, ps = p.querySelector(".sa-passo"); if (b !== c0 && ps && ps.style.visibility !== "hidden" && !p.classList.contains("fuori")) ps.click(); }); }
      }
      await W.dorme(250);
    }
    if (!q(P, ".st-rivela")) no("il fanta non arriva alla classifica delle rose");
    if (!P.__scambiati) W.clicca(P, /Salta/);
    if (!partita) no("non ho potuto mettere le azioni (nessun centrocampista o attaccante comprato?)");
    // le pagelle del primo tempo: «Avanti ▶» (chi ha il telefono)
    var fino2 = Date.now() + 260000;
    while (Date.now() < fino2 && !visti.some(function (d) { return d.m >= (messi.some(function (x) { return /^93/.test(x); }) ? 93 : 92); }) && !q(P, ".st-pag.fin")) { var av = qa(P, ".st-pag-av").filter(visibile)[0]; if (av && !av.disabled) av.click(); await W.dorme(400); }
    var miei = visti.filter(function (d) { return d.c + "-" + d.f === partita && !d.replay; });
    if (!visti.some(function (d) { return d.m >= 92; })) sbagli.push("le azioni messe non arrivano tutte (viste: " + visti.map(function (d) { return d.m + "' " + d.t; }).join(", ") + ")");
    // per ogni partita e ogni tempo: ogni squadra sempre la stessa porta, le due opposte; nel secondo tempo al contrario
    var per = {};
    visti.forEach(function (d) {
      var tempo = d.m < 45.5 ? 1 : 2, k = d.c + "-" + d.f + "|" + (d.gk == null ? "" : d.gk), z = per[k] = per[k] || { 1: {}, 2: {} }, o = z[tempo];
      if (!d.A || (d.A !== d.c && d.A !== d.f)) { sbagli.push(d.m + "' " + d.t + ": non si sa chi attacca (" + d.A + ")"); return; }
      if (o[d.A] != null && o[d.A] !== d.verso) sbagli.push(k.split("|")[0] + ", " + tempo + "° tempo: " + d.A + " attacca una volta la porta " + (o[d.A] > 0 ? "in basso" : "in alto") + " e al " + d.m + "' (" + d.t + (d.replay ? ", replay" : "") + ") l'altra");
      o[d.A] = d.verso;
    });
    Object.keys(per).forEach(function (k) {
      var z = per[k], nm = k.split("|")[0], sq = nm.split("-");
      [1, 2].forEach(function (tp) { if (z[tp][sq[0]] != null && z[tp][sq[1]] != null && z[tp][sq[0]] === z[tp][sq[1]]) sbagli.push(nm + ", " + tp + "° tempo: le due squadre attaccano la stessa porta"); });
      sq.forEach(function (s) { if (z[1][s] != null && z[2][s] != null && z[1][s] === z[2][s]) sbagli.push(nm + ": " + s + " attacca la stessa porta nei due tempi"); });
    });
    var tipi = {}; miei.forEach(function (d) { tipi[d.t] = 1; });
    ["occ", "amm", "rig"].forEach(function (t) { if (!tipi[t] && !(t === "rig" && tipi.rigP)) sbagli.push("tra le scene della partita manca «" + t + "»"); });
    if (!miei.some(function (d) { return d.m < 45.5 && d.A === partita.split("-")[0]; }) || !miei.some(function (d) { return d.m < 45.5 && d.A === partita.split("-")[1]; })) sbagli.push("nel primo tempo non si vedono tutte e due le squadre in attacco");
    if (!miei.some(function (d) { return d.m > 45.5 && d.A === partita.split("-")[0]; }) || !miei.some(function (d) { return d.m > 45.5 && d.A === partita.split("-")[1]; })) sbagli.push("nel secondo tempo non si vedono tutte e due le squadre in attacco");
    var err = W.erroriTel(); if (err.length) sbagli.push("errori: " + err.slice(0, 3).join(" | "));
    if (sbagli.length) no(sbagli.slice(0, 6).join(" / "));
    var z1 = per[Object.keys(per).filter(function (k) { return k.indexOf(partita + "|") === 0; })[0]] || { 1: {}, 2: {} }, sq2 = partita.split("-"), lato = function (v) { return v == null ? "?" : v > 0 ? "in basso" : "in alto"; };
    return partita + " (" + miei.length + " scene: " + miei.map(function (d) { return d.m + "' " + d.t + (d.A === sq2[0] ? " " + sq2[0] : " " + sq2[1]) + " " + lato(d.verso); }).join(", ") + "): 1° tempo " + sq2[0] + " " + lato(z1[1][sq2[0]]) + ", " + sq2[1] + " " + lato(z1[1][sq2[1]]) + "; 2° tempo al contrario";
  } });

  COPIONE.aggiungi("rf1", { nome: "Mini Asta, il rigore contro un portiere comprato si vede SEMPRE: gol, parato o fuori (niente punti in più)", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), ko = [], es = { rig: [0, 0], rigP: [0, 0], rigF: [0, 0] }, soloPor = { rig: 0, rigP: 0, rigF: 0 }, giornate = 1500;
    for (var i = 0; i < giornate && ko.length < 20; i++) {
      var n = 2 + (i % 9), m = M.mazzo(n), righe = [], per = { P: [], D: [], C: [], A: [] }, A = {};
      m.forEach(function (c) { c.valore = 4 + (i * 7 + c.nome.length) % 20; (per[c.ruolo] = per[c.ruolo] || []).push(c); });
      for (var k = 0; k < n; k++) righe.push({ id: "g" + k, nome: "G" + k, kit: [per.P[k], per.D[k], per.C[2 * k], per.C[2 * k + 1], per.A[k]].filter(Boolean), totale: 50, crediti: 0 });
      M.giornata(righe, A);
      var lista = M.lista(A, righe, function (r) { return r.gio; }, false), vista = {};
      lista.forEach(function (x) { if (x.e && x.focus && x.e.t !== "ribP") vista[x.p + "|" + x.ei] = x; });   // (la ribattuta parata è un momento a sé con lo stesso posto: non conta)
      var por = {}, chiDi = {}; righe.forEach(function (r) { r.kit.forEach(function (c, kk) { chiDi[M.chiave(c)] = { r: r, k: kk }; if (c.ruolo === "P") por[c.squadra] = { r: r, k: kk, c: c }; }); });
      (A.partite || []).forEach(function (P, pi) { P.ev.forEach(function (e, ei) {
        if (!es[e.t]) return;
        var dif = e.s === "c" ? P.f : P.c, g = por[dif]; if (!g) return;
        var mio = g.r.gio.cal[g.k].ev.filter(function (z) { return z.p === pi && z.e === ei; });
        es[e.t][0]++;
        if (!mio.length) { ko.push("giornata " + i + ", " + P.c + "-" + P.f + " al " + e.m + "': rigore (" + e.t + ") contro il portiere comprato senza il suo momento"); return; }
        if (!vista[pi + "|" + ei]) { ko.push("giornata " + i + ": il rigore (" + e.t + ") contro il portiere comprato non si vede"); return; }
        if (!vista[pi + "|" + ei].chi.some(function (y) { return y.r === g.r && y.k === g.k; })) ko.push("giornata " + i + ": nel rigore (" + e.t + ") il portiere comprato non c'è tra chi c'entra");
        es[e.t][1]++;
        if (e.t === "rigF" && (mio[0].d !== 0 || mio[0].vo != null)) ko.push("giornata " + i + ": il rigore fuori dà qualcosa al portiere (" + JSON.stringify(mio[0]) + ")");
        if (!chiDi[e.chi]) soloPor[e.t]++;   // (chi tira non è di nessuno: si vede solo per il portiere)
      }); });
    }
    if (ko.length) no(ko.length + " problemi: " + ko.slice(0, 5).join(" · "));
    if (!es.rig[0] || !es.rigP[0] || !es.rigF[0] || !soloPor.rigF) no("non ci sono tutti i casi: " + JSON.stringify(es) + " solo il portiere " + JSON.stringify(soloPor));
    return giornate + " giornate: rigori contro un portiere comprato visti " + es.rig[1] + "/" + es.rig[0] + " col gol, " + es.rigP[1] + "/" + es.rigP[0] + " parati, " + es.rigF[1] + "/" + es.rigF[0] + " sbagliati fuori o sul palo (di cui " + soloPor.rigF + " visti solo per il portiere); il rigore fuori non dà punti al portiere";
  } });
})();

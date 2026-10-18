// PROVE DEL CONTROLLORE (18 ott 2026): chi rientra a partita in corso nella Sala, i casi cattivi (dopo 5ro1-5ro9)
// Uso: await COPIONE.carica("passo5/rientro-verifica.js"); await COPIONE.prova("5rv1")
// 5rv1 Palla Matta in 2: Giulia ricarica mentre tocca a lei (dopo 5 s) → torna, tocca ancora a lei e tira
// 5rv2 Palla Matta in 2: Giulia ricarica con la sua pallina in volo → torna, si va avanti
// 5rv3 Palla Matta in 2: Giulia spenta 30 s («Aspettiamo»), poi l'HOST ricarica, poi Giulia ricarica → torna, avviso via
// 5rv4 Palla Matta in 2: Giulia torna due volte di fila (spenta 25 s e ricarica, due volte)
// 5rv5 Palla Matta in 3 (Giulia, Bea): Giulia spenta 30 s mentre tocca a lei → gli altri vanno avanti; ricarica → rigioca
// 5rv6 Palla Matta in 2: Giulia ricarica e il "testamento" del collegamento VECCHIO arriva dopo (il broker se ne accorge
//      tardi, come coi telefoni veri), poco dopo un suo tiro → non deve essere tolta dalla partita
// 5rv7 Tris: Giulia ricarica mentre tocca a lei (dopo 5 s) e poi torna di nuovo dopo 25 s spenta
// 5rv8 Scopa: Giulia ricarica mentre tocca a lei (dopo 5 s), poi spenta 30 s e ricarica: torna con le sue carte
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;
  var aggiungi = COPIONE.aggiungi.bind(COPIONE);
  function vm(C) { return W.vmDi(C) || {}; }
  function mioId(n) { return A.mioId(n); }
  function inSaletta(w) { return !!(w && w.document.querySelector(".saletta-schermo")); }
  function riga(C) { return (vm(C).players || []).map(function (p) { return p.nome + " " + p.punti + "p/" + p.palline + "⚪" + (p.via ? " via" : ""); }).join(", "); }
  function avvisoHost(P) { P = W.finestra("Paky"); var s = P && P.document.querySelector(".pm-sopra.su"); return !!s && /Aspettiamo/.test(s.textContent); }
  function nomeDi(p) { return p.id === "host" ? "Paky" : p.nome; }
  function diTurno(C) { var v = vm(C); return (v.players || [])[v.turno]; }

  async function pallaMatta(amici) {
    var X = await A.salaConAmici(amici), S = X.S, P = X.w.Paky;
    var C = await A.lanciaDallaSala("Paky", S, "Palla Matta");
    if (!await W.aspetta(function () { return (vm(C).players || []).length === amici.length + 1; }, 9000)) no("gli amici non entrano in Palla Matta (" + riga(C) + ")");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("Paky non ha «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 8000)) no("Palla Matta non comincia");
    return { S: S, C: C };
  }
  async function puoTirare(C, nome) {
    return W.aspetta(function () { var w = W.finestra(nome), x = vm(C), g = diTurno(C); return g && nomeDi(g) === nome && x.fs === "mira" && w && w.__PMpartita && w.__PMpartita.st().fase === "mira"; }, 10000);
  }
  async function unTiro(C) {
    var g = diTurno(C), nome = nomeDi(g), seq = vm(C).seq;
    if (!await puoTirare(C, nome)) no("il tiro di " + nome + " non si può fare (" + vm(C).fs + ", " + riga(C) + ")");
    W.finestra(nome).__PMpartita.tira();
    if (!await W.aspetta(function () { return vm(C).seq !== seq || vm(C).fase === "fine"; }, 30000)) no("il tiro di " + nome + " non finisce");
    return nome;
  }
  async function finoA(C, nome) {   // si tira finché tocca a nome
    for (var i = 0; i < 4 && nomeDi(diTurno(C)) !== nome; i++) await unTiro(C);
    if (nomeDi(diTurno(C)) !== nome) no("non tocca mai a " + nome + " (" + riga(C) + ")");
  }
  function foto(C) { return (vm(C).players || []).map(function (p) { return p.id + ":" + p.punti + ":" + p.palline; }).join("|"); }
  // Giulia (o chi) è tornata nella partita: il tavolo, niente saletta, stesso id, un posto solo, non "via", avviso sparito
  async function tornata(C, nome, idG, cosa) {
    var G;
    var ok = await W.aspetta(function () { G = W.finestra(nome); return G && G.__PMpartita && G.document.querySelector(".pm-scena canvas") && !inSaletta(G) && !/Sto entrando|partita in corso/.test(W.testo(G)); }, 15000);
    if (!ok) no(cosa + ": " + nome + " non torna nella partita: «" + T(G).slice(0, 100) + "» · in saletta: " + inSaletta(G));
    if (mioId(nome) !== idG) no(cosa + ": " + nome + " ha un id nuovo");
    if (!await W.aspetta(function () { var p = (vm(C).players || []).filter(function (x) { return x.id === idG; }); return p.length === 1 && !p[0].via; }, 5000)) no(cosa + ": " + nome + " è ancora «via» o doppia: " + riga(C));
    if (!await W.aspetta(function () { return !avvisoHost(); }, 4000)) no(cosa + ": a Paky resta «Aspettiamo…»");
  }
  function morto(nome) { W.spegni(nome); }

  aggiungi("5rv1", { nome: "Palla Matta in 2: Giulia ricarica mentre tocca a lei → tocca ancora a lei e tira", fai: async function () {
    var X = await pallaMatta(["Giulia"]), C = X.C, idG = mioId("Giulia");
    await finoA(C, "Giulia");
    var f0 = foto(C), seq = vm(C).seq;
    await W.dorme(5000); await W.ricarica("Giulia");
    await tornata(C, "Giulia", idG, "ricarica nel suo turno");
    if (foto(C) !== f0) no("punti o palline cambiati");
    if (nomeDi(diTurno(C)) !== "Giulia" || vm(C).seq !== seq) no("non tocca più a Giulia (" + nomeDi(diTurno(C)) + ", seq " + seq + "→" + vm(C).seq + ")");
    await unTiro(C); await unTiro(C);
    return "Giulia ricarica nel suo turno: torna, tocca ancora a lei, tira; poi Paky (" + riga(C) + ")";
  } });

  aggiungi("5rv2", { nome: "Palla Matta in 2: Giulia ricarica con la sua pallina in volo → torna, si va avanti", fai: async function () {
    var X = await pallaMatta(["Giulia"]), C = X.C, idG = mioId("Giulia");
    await finoA(C, "Giulia");
    if (!await puoTirare(C, "Giulia")) no("Giulia non può tirare");
    var seq = vm(C).seq;
    W.finestra("Giulia").__PMpartita.tira();
    if (!await W.aspetta(function () { var P = W.finestra("Paky").__PMpartita; return P && P.st().fase === "volo"; }, 4000)) no("la pallina di Giulia non parte");
    await W.ricarica("Giulia");
    await tornata(C, "Giulia", idG, "ricarica col tiro in volo");
    if (!await W.aspetta(function () { return vm(C).seq !== seq; }, 30000)) no("il tiro in volo non finisce");
    var a = await unTiro(C), b = await unTiro(C);
    return "pallina in volo, Giulia ricarica: torna; poi tirano " + a + " e " + b + " (" + riga(C) + ")";
  } });

  aggiungi("5rv3", { nome: "Palla Matta in 2: Giulia via 30 s, l'host ricarica, poi Giulia ricarica → torna, avviso via", fai: async function () {
    var X = await pallaMatta(["Giulia"]), C = X.C, idG = mioId("Giulia");
    await unTiro(C);
    var f0 = foto(C);
    morto("Giulia");
    if (!await W.aspetta(avvisoHost, 40000)) no("Paky non legge «Aspettiamo»");
    await W.dorme(3000);
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { var s = W.statoStanza(C) || {}; return s._r && vm(C).fase === "gioco"; }, 12000)) no("la partita dell'host non riprende (" + JSON.stringify(vm(C)).slice(0, 80) + ")");
    var avvDopo = await W.aspetta(avvisoHost, 8000);
    await W.dorme(2000);
    await W.ricarica("Giulia");
    await tornata(C, "Giulia", idG, "dopo la ricarica dell'host");
    if (foto(C) !== f0) no("punti o palline cambiati: " + riga(C));
    var a = await unTiro(C), b = await unTiro(C);
    return "Giulia via, Paky ricarica (avviso " + (avvDopo ? "di nuovo" : "NON rimesso") + "), Giulia ricarica e torna; poi tirano " + a + " e " + b;
  } });

  aggiungi("5rv4", { nome: "Palla Matta in 2: Giulia torna due volte di fila (spenta 25 s e ricarica, due volte)", fai: async function () {
    var X = await pallaMatta(["Giulia"]), C = X.C, idG = mioId("Giulia");
    for (var k = 1; k <= 2; k++) {
      await unTiro(C);
      morto("Giulia");
      if (!await W.aspetta(avvisoHost, 40000)) no(k + "ª volta: Paky non legge «Aspettiamo»");
      await W.dorme(1500); await W.ricarica("Giulia");
      await tornata(C, "Giulia", idG, k + "ª volta");
    }
    var a = await unTiro(C), b = await unTiro(C);
    return "due volte via e di nuovo dentro, stesso posto; poi tirano " + a + " e " + b + " (" + riga(C) + ")";
  } });

  aggiungi("5rv5", { nome: "Palla Matta in 3: Giulia via 30 s nel suo turno, gli altri vanno avanti; ricarica → rigioca", fai: async function () {
    var X = await pallaMatta(["Giulia", "Bea"]), C = X.C, idG = mioId("Giulia");
    await finoA(C, "Giulia");
    morto("Giulia");
    if (!await W.aspetta(function () { var p = (vm(C).players || []).find(function (x) { return x.id === idG; }); return p && p.via && nomeDi(diTurno(C)) !== "Giulia"; }, 45000)) no("Giulia spenta: il turno non passa (" + riga(C) + ")");
    if (avvisoHost()) no("in tre l'host aspetta Giulia invece di andare avanti");
    var a = await unTiro(C);
    await W.ricarica("Giulia");
    await tornata(C, "Giulia", idG, "in tre");
    await finoA(C, "Giulia"); await unTiro(C);
    return "in tre: Giulia via, tira " + a + "; Giulia ricarica, torna e tira di nuovo (" + riga(C) + ")";
  } });

  aggiungi("5rv6", { nome: "Palla Matta in 2: il testamento del collegamento vecchio arriva tardi, dopo un tiro → Giulia resta", fai: async function () {
    var X = await pallaMatta(["Giulia"]), C = X.C, idG = mioId("Giulia");
    // Giulia ricarica ma il broker non se ne accorge (niente testamento subito): come una ricarica dopo un buco di rete
    var vecchi = W.viviDi("Giulia");
    W.congela("Giulia"); vecchi.forEach(function (c) { c.morto = true; });
    var tJoin = 0, tm = setInterval(function () { if (!tJoin && W.BR.log.some(function (l) { return l.indexOf("Giulia → " + C + "/") === 0 && /"t":"join"/.test(l); })) tJoin = Date.now(); }, 20);
    var n0 = W.BR.log.length; W.BR.log.forEach(function (l, i) { if (l.indexOf("Giulia → ") === 0) W.BR.log[i] = "x" + l; });
    await W.apriTel("Giulia", { hash: null });
    await tornata(C, "Giulia", idG, "ricarica muta");
    clearInterval(tm);
    if (!tJoin) no("non vedo il join di Giulia");
    await finoA(C, "Giulia");
    if (!await puoTirare(C, "Giulia")) no("Giulia non può tirare");
    // il suo tiro 3 s dopo un «ci sono» possibile (ogni 15 s dal join): così il prossimo «ci sono» arriva tra 27 s
    var fase = (Date.now() - tJoin) % 15000, aspetta = (3000 - fase + 15000) % 15000;
    await W.dorme(aspetta);
    W.finestra("Giulia").__PMpartita.tira();
    await W.dorme(300);
    vecchi.forEach(function (c) { c.testamento(); });   // il broker si accorge adesso del collegamento di prima
    await W.dorme(24000);
    var p = (vm(C).players || []).find(function (x) { return x.id === idG; });
    if (!p || p.via) no("Giulia è lì ma la partita l'ha tolta per il testamento vecchio (" + riga(C) + ", avviso: " + avvisoHost() + ")");
    if (avvisoHost()) no("a Paky compare «Aspettiamo» con Giulia presente");
    return "testamento vecchio arrivato 0,3 s dopo il suo tiro: Giulia resta in partita (" + riga(C) + ")";
  } });

  // ---- Tris e Scopa nella Sala ----
  async function aDue(nomeGioco, avvOk) {
    var X = await A.salaConAmici(["Giulia"]), S = X.S, P = X.w.Paky;
    var C = await A.lanciaDallaSala("Paky", S, nomeGioco), idG = A.idInSala(S, "Giulia");
    if (!await W.aspetta(function () { return avvOk(vm(C)) === idG; }, 9000)) no("Giulia non diventa l'avversaria");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 6000)) no("Paky non ha «Comincia»");
    return { S: S, C: C, P: P, idG: idG };
  }
  async function mossaTris(C, chi) {
    var v = vm(C), w = W.finestra(chi), n0 = (v.board || []).filter(Boolean).length, k = (v.board || []).indexOf(null);
    var cel = w.document.querySelectorAll(".tr-cella")[k]; if (!cel) no("Tris: " + chi + " non ha le caselle («" + T(w).slice(0, 60) + "»)");
    cel.click();
    if (!await W.aspetta(function () { return (vm(C).board || []).filter(Boolean).length > n0; }, 5000)) no("Tris: la mossa di " + chi + " non arriva");
  }
  aggiungi("5rv7", { nome: "Tris nella Sala: Giulia ricarica nel suo turno, poi spenta 25 s e ricarica di nuovo → torna", fai: async function () {
    var X = await aDue("Tris", function (v) { return v.avvId; }), C = X.C, idG = X.idG, P = X.P;
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 8000)) no("il Tris non comincia");
    if (vm(C).turno === "X") await mossaTris(C, "Paky");
    var b0 = JSON.stringify(vm(C).board);
    await W.dorme(5000); await W.ricarica("Giulia");
    if (!await W.aspetta(function () { var G = W.finestra("Giulia"); return mioId("Giulia") === idG && G.document.querySelectorAll(".tr-cella").length && !inSaletta(G) && vm(C).fase === "gioco"; }, 15000)) no("Tris: dopo 5 s Giulia non torna nella partita («" + T(W.finestra("Giulia")).slice(0, 80) + "»)");
    if (JSON.stringify(vm(C).board) !== b0 || vm(C).turno !== "O") no("Tris: tavolo o turno cambiati");
    await mossaTris(C, "Giulia");
    morto("Giulia"); await W.dorme(25000);
    var f25 = vm(C).fase + (vm(C).sospesa ? " sospesa" : "");
    await W.ricarica("Giulia");
    if (!await W.aspetta(function () { return mioId("Giulia") === idG && vm(C).avvId === idG && A.codiceSaletta(W.finestra("Giulia")) === C; }, 15000)) no("Tris: dopo 25 s Giulia non torna nella saletta del Tris («" + T(W.finestra("Giulia")).slice(0, 80) + "»)");
    if (!await W.aspetta(function () { return W.clicca(P, /Riprendi|Comincia/, ".sl-go"); }, 5000)) no("Tris: Paky non ha «Riprendi»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 6000)) no("Tris: non si riprende");
    var b1 = JSON.stringify(vm(C).board);
    if (vm(C).turno === "X") await mossaTris(C, "Paky"); else await mossaTris(C, "Giulia");
    return "Tris: ricarica nel turno → stessa partita; spenta 25 s (" + f25 + ") → saletta, «Riprendi» con il tavolo " + b1;
  } });

  aggiungi("5rv8", { nome: "Scopa nella Sala: Giulia ricarica nel suo turno, poi spenta 30 s e ricarica → torna con le sue carte", fai: async function () {
    var X = await aDue("Scopa", function (v) { return v.avvId || v.idB; }), C = X.C, idG = X.idG, P = X.P;
    if (!await W.aspetta(function () { return vm(C).t !== "lobby" && vm(C).mano; }, 8000)) no("la Scopa non comincia");
    var manoG = function () { var G = W.finestra("Giulia"); return G ? G.document.querySelectorAll(".sc-mano-riga .sc-carta, .sc-mano-riga [data-id]").length : 0; };
    await W.dorme(4000);
    var n0 = manoG();
    await W.dorme(5000); await W.ricarica("Giulia");
    if (!await W.aspetta(function () { var G = W.finestra("Giulia"); return mioId("Giulia") === idG && G.document.querySelector(".sc-mano-riga") && !inSaletta(G); }, 15000)) no("Scopa: dopo 5 s Giulia non torna nella partita («" + T(W.finestra("Giulia")).slice(0, 80) + "»)");
    await W.dorme(4000);
    var n1 = manoG();
    morto("Giulia"); await W.dorme(30000);
    var avv = /lasciato la partita/.test(T(P));
    await W.ricarica("Giulia");
    if (!await W.aspetta(function () { var G = W.finestra("Giulia"); return mioId("Giulia") === idG && G.document.querySelector(".sc-mano-riga") && !inSaletta(G); }, 15000)) no("Scopa: dopo 30 s Giulia non torna nella partita («" + T(W.finestra("Giulia")).slice(0, 80) + "»)");
    if (!await W.aspetta(function () { return !/lasciato la partita/.test(T(W.finestra("Paky"))); }, 5000)) no("Scopa: a Paky resta «ha lasciato la partita»");
    await W.dorme(3000);
    var n2 = manoG();
    if (!n2) no("Scopa: Giulia non ha carte in mano");
    return "Scopa: carte in mano " + n0 + " → " + n1 + " → " + n2 + "; avviso dopo 30 s: " + avv + ", poi sparito";
  } });
})();

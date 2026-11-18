// 🎨 PROVE DEI COLORI FISSI DEI GETTONI (18 nov 2026, chat «🪟 Saletta di vetro»). Profili finti, mai account veri.
// Regola del proprietario: i colori restano FISSI per tutta la serata. Chi tiene la serata li decide una volta (doppione: il 2° colore,
// se no il primo libero); poi nessuno cambia colore quando qualcuno entra, esce, ricarica o torna; chi rientra riprende il suo; il colore
// di uno non va mai dato a chi arriva dopo.
// Uso (dopo copione-prova.js): await COPIONE.carica("colori/prove.js"); await COPIONE.prova("cf1")
// cf1: Sala con colori doppi (Paky oro+blu, Giulia oro+verde, Luca blu+oro, Marco oro+blu, Bea rosso+arancio): entra, esce, rientra,
//      ricarica (amica e host), gioco lanciato dalla Sala, ritorno nella Sala, l'host sparisce (la Sala passa a Giulia) e torna.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti;
  function no(p) { throw new Error(p); }
  function pausa(ms) { return W.aspetta(function () { return false; }, ms); }
  function gt(e, c) { return { g: 1, e: e, c: c }; }
  var PROF = {
    Paky: gt("⚡", ["oro", "blu"]), Giulia: gt("🦁", ["oro", "verde"]), Luca: gt("🚀", ["blu", "oro"]),
    Marco: gt("🍕", ["oro", "blu"]), Bea: gt("🔥", ["rosso", "arancio"]), Ugo: gt("🐸", ["oro", "lampone"])
  };
  function apri(nome, opz) { return W.apriTel(nome, Object.assign({ salaSempre: true, profilo: { nome: nome, uid: "finto-" + nome, gettone: PROF[nome] } }, opz || {})); }
  // i colori nella foto della Sala (o della stanza di un gioco): { nome: colore }
  function colori(cod, campo) {
    var v = A.vm(cod) || {}, l = v[campo || "membri"] || v.giocatori || v.players || [], r = {};
    l.forEach(function (m) { if (m && m.nome && m.omino && m.omino.k) r[m.nome] = m.omino.k; });
    return r;
  }
  var ATTESI = { Paky: "oro", Giulia: "verde", Luca: "blu" }, log = [];
  function controlla(passo, c, chi) {
    log.push(passo + ": " + JSON.stringify(c));
    (chi || Object.keys(ATTESI)).forEach(function (n) { if (c[n] && c[n] !== ATTESI[n]) no(passo + ": " + n + " ha " + c[n] + " invece di " + ATTESI[n] + " — " + log.join(" | ")); });
  }
  COPIONE.aggiungi("cf1", { nome: "Colori fissi: entra, esce, ricarica, gioco, vice, ritorno", fai: async function () {
    var w = {};
    w.Paky = await apri("Paky", { x: 0 });
    var S = await A.apriSalaNuova("Paky");
    w.Giulia = await apri("Giulia", { hash: "sala=" + S, x: 190 });
    if (!await W.aspetta(function () { return Object.keys(colori(S)).length >= 2; }, 10000)) no("Giulia non entra");
    w.Luca = await apri("Luca", { hash: "sala=" + S, x: 380 });
    if (!await W.aspetta(function () { return Object.keys(colori(S)).length >= 3; }, 10000)) no("Luca non entra");
    controlla("in 3", colori(S));
    // Marco entra (oro e blu presi: il primo libero) ed esce
    w.Marco = await apri("Marco", { hash: "sala=" + S, x: 570 });
    if (!await W.aspetta(function () { return colori(S).Marco; }, 10000)) no("Marco non entra");
    ATTESI.Marco = colori(S).Marco;
    controlla("Marco dentro", colori(S));
    W.spegni("Marco");
    if (!await W.aspetta(function () { return !colori(S).Marco; }, 40000)) no("Marco non esce dalla Sala");
    controlla("Marco uscito", colori(S));
    // Bea entra (rosso, arancio)
    w.Bea = await apri("Bea", { hash: "sala=" + S, x: 760 });
    if (!await W.aspetta(function () { return colori(S).Bea; }, 10000)) no("Bea non entra");
    ATTESI.Bea = colori(S).Bea;
    // Marco torna: riprende il suo
    W.riaccendi("Marco");
    if (!await W.aspetta(function () { return colori(S).Marco; }, 20000)) no("Marco non rientra");
    controlla("Marco rientrato", colori(S));
    // Giulia ricarica
    await W.ricarica("Giulia"); w.Giulia = W.finestra("Giulia");
    await pausa(3000);
    controlla("Giulia ricarica", colori(S));
    // un gioco dalla Sala: stessi colori nella stanza del gioco
    var C = await A.lanciaDallaSala("Paky", S, "La linea del tempo");
    if (!await W.aspetta(function () { return Object.keys(colori(C, "giocatori")).length >= 5; }, 15000)) no("nella saletta del gioco non sono in 5 (" + JSON.stringify(colori(C, "giocatori")) + ")");
    controlla("saletta del gioco", colori(C, "giocatori"));
    // l'host ricarica
    await W.ricarica("Paky"); w.Paky = W.finestra("Paky");
    await pausa(6000);
    controlla("Paky ricarica (Sala)", colori(S));
    var cg = colori(C, "giocatori"); if (Object.keys(cg).length) controlla("Paky ricarica (gioco)", cg);
    // l'host sparisce: la Sala passa a Giulia; poi Paky torna da amico e riprende il suo giallo
    W.congela("Paky"); W.spegni("Paky");
    if (!await W.aspetta(function () { var v = A.vm(S); return v && v.gen >= 2; }, 90000)) no("la Sala non passa alla vice");
    await pausa(3000);
    controlla("Sala della vice", colori(S));
    // mentre Paky è via entra Ugo, che ha il giallo come 1° colore: il giallo resta di Paky, Ugo prende il suo 2°
    w.Ugo = await apri("Ugo", { hash: "sala=" + S, x: 950 });
    if (!await W.aspetta(function () { return colori(S).Ugo; }, 15000)) no("Ugo non entra nella Sala della vice");
    ATTESI.Ugo = "lampone";
    controlla("Ugo entra (Paky via)", colori(S));
    W.scongela("Paky"); W.riaccendi("Paky");
    if (!await W.aspetta(function () { return colori(S).Paky; }, 40000)) no("Paky non torna nella Sala della vice");
    await pausa(3000);
    controlla("Paky torna", colori(S));
    return "colori fissi in tutti i passi: " + log.join(" | ");
  } });
})();

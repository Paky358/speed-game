// PROVE DEL PASSO 3 — giochi del gruppo B (posti contati) col cambio di host della Sala (pezzo p3-g2):
// Scalinata, Palla Matta, Ruota, Scopa 2 vs 2, Pendolo, Horto. Scenari 381-386 (uno per gioco), telefoni con salaSempre: true.
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("passo3/comune.js"); await COPIONE.carica("passo3/giochi-b.js"); await COPIONE.prova(381)
// Ogni scenario: Sala di Paky con 5 telefoni (4 posti: «Chi gioca?», uno guarda; Horto 4 telefoni, 8 posti), Paky lancia il
// gioco, a partita cominciata il suo telefono si spegne davvero → dopo il subentro (20 s) tutti, chi giocava e chi guardava,
// sono nella Sala di Giulia (gen 2) senza il gioco; per 8 s nessun timer del gioco vecchio copre la Sala; nessuno resta
// collegato alla stanza vecchia (niente «La stanza è chiusa» 2 minuti dopo); poi Giulia rilancia lo stesso gioco e si arriva
// alla fine del core e alla Rivincita col 3-2-1. Giulia (il vice) a volte giocava e a volte guardava.
// 381 Scalinata (riprende: true): Giulia rilancia e la partita parte da zero (niente ripresa della partita di Paky); Paky
// che torna entra da amico e non ripubblica la sua Scalinata, nemmeno ricaricando la pagina.
// La fine nei giochi lunghi (Palla Matta, Ruota, Scopa 2 vs 2) si chiama dal tavolo (spiaTavolo, come nel 56);
// Scalinata, Pendolo e Horto si giocano fino in fondo. Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, P3 = COPIONE.passo3 || W.P3, vm = A.vm, T = A.T;
  var aggiungi = COPIONE.aggiungi.bind(COPIONE);
  function no(p) { throw new Error(p); }
  var BASE = "seratagiochi/v1/";
  function nomeHost(S) { var h = (vm(S).membri || []).filter(function (x) { return x && x.id === "host"; })[0]; return h ? h.nome : ""; }
  function nomi(S) { return (vm(S).membri || []).map(function (m) { return m.nome; }).sort(); }
  function eHost(w) { return !!(w && w.document.querySelector(".saletta-schermo .sl-go")); }
  function eOspite(w) { return !!(w && w.document.querySelector(".saletta-schermo .sl-attesa") && /Sei dentro/.test(W.testo(w))); }
  // nella Sala S (non nella saletta di un gioco): l'host con «Scegli un gioco», l'ospite col codice della Sala in testata
  function inSala(w, S, host) {
    if (!w || !w.document.querySelector(".saletta-schermo") || w.document.querySelector(".fine-tasti")) return false;
    var c = A.codiceSaletta(w); if (c && c !== S) return false;
    return host ? eHost(w) && /Scegli (un|il primo) gioco|Prossimo gioco/.test(W.testo(w)) : eOspite(w) && A.codiceTestata(w) === S;
  }
  function erroriVuoti() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  // chi (tranne quelli spenti) è ancora collegato alla stanza C del gioco vecchio
  function ancoraInStanza(C, tranne) {
    var pre = BASE + C + "/";
    return Object.keys(W.BR.perNome || {}).filter(function (n) {
      if ((tranne || []).indexOf(n) >= 0) return false;
      return (W.BR.perNome[n] || []).some(function (c) { return c.connected && !c.morto && !c.frozen && [].some.call(Array.from(c.subs || []), function (t) { return t.indexOf(pre) === 0; }); });
    });
  }
  // il telefono si spegne davvero: la rete tace e il broker manda il testamento
  function spentoDavvero(nome) { W.congela(nome); W.spegni(nome); }
  // la Sala di Paky con questi amici (telefoni con la spia del tavolo del gioco gid)
  async function salaCon(amici, gid) {
    A.spiaTavolo();
    var w = { Paky: await W.apriTel("Paky", { x: 0, salaSempre: true, spiaTav: [gid] }) };
    var S = await A.apriSalaNuova("Paky");
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true, spiaTav: [gid] });
    if (!await W.aspetta(function () { return (vm(S).membri || []).length === amici.length + 1; }, 12000)) no("nella Sala non sono entrati in " + (amici.length + 1) + " (" + (vm(S).membri || []).length + ")");
    return { S: S, w: w };
  }
  // in «Chi gioca?» restano scelti esattamente questi nomi
  function scegliChi(w, scelti, host) {
    (A.chiGioca(w) || []).forEach(function (n) { if (scelti.indexOf(n) < 0 && n !== host) A.toccaChi(w, n); });
    scelti.forEach(function (n) { if ((A.chiGioca(w) || []).indexOf(n) < 0) A.toccaChi(w, n); });
    var fin = (A.chiGioca(w) || []).slice().sort().join(",");
    if (fin !== scelti.slice().sort().join(",")) no("in «Chi gioca?» non riesco a scegliere " + scelti.join(", ") + " (scelti: " + fin + ")");
  }
  // l'host lancia il gioco dalla Sala (con «Chi gioca?» se scelti): il codice della stanza del gioco
  async function lancia(host, S, nomeGioco, gid, scelti) {
    var w = W.finestra(host);
    var r = await A.toccaGiocoSala(w, nomeGioco);
    if (scelti && r.dove !== "chi") no("siamo più dei posti ma non si apre «Chi gioca a " + nomeGioco + "?» («" + T(w).slice(0, 80) + "»)");
    if (!scelti && r.dove === "chi") no("ci sono posti per tutti ma si apre «Chi gioca?»");
    if (r.dove === "chi") { scegliChi(w, scelti, host); if (!W.clicca(w, /Si gioca/, ".piede button")) no("in «Chi gioca?» non c'è «▶ Si gioca»"); }
    var C = await W.aspetta(function () { var c = A.codiceSaletta(w); return w.document.querySelector(".saletta-schermo") && c && c !== S && vm(S).gioco === gid ? c : null; }, 8000);
    if (!C) no(host + " ha toccato " + nomeGioco + " ma non è nella sua saletta («" + T(w).slice(0, 80) + "»)");
    return C;
  }
  // tutti (tranne l'host) arrivano nella saletta del gioco
  async function tuttiInSaletta(C, chi) {
    if (!await W.aspetta(function () { return chi.every(function (n) { var x = W.finestra(n); return x.document.querySelector(".saletta-schermo") && A.codiceSaletta(x) === C; }); }, 12000))
      no("non arrivano tutti nella saletta del gioco (" + chi.filter(function (n) { return A.codiceSaletta(W.finestra(n)) !== C; }).join(", ") + " no)");
  }
  // «Comincia»: la partita parte (l'host non è più nella saletta)
  async function comincia(host, C, partita) {
    var w = W.finestra(host);
    if (!await W.aspetta(function () { return W.clicca(w, /Comincia la corsa|^\s*(▶\s*)?Comincia/, ".sl-go, .piede button, button"); }, 8000)) no(host + " non ha «Comincia»");
    if (!await W.aspetta(function () { return !w.document.querySelector(".saletta-schermo") && (!partita || partita(vm(C), W.statoStanza(C) || {})); }, 12000)) no("la partita di " + host + " non comincia («" + T(w).slice(0, 80) + "»)");
  }
  // la fine chiamata dal tavolo su tutti i telefoni del gioco (come il 56)
  function fineFinta(chi) {
    chi.forEach(function (n, k) { var x = W.finestra(n); if (x && x.__tav && x.__tav.fine) try { x.__tav.fine(chi.map(function (m, j) { return { nome: m, pos: j + 1 }; })); } catch (e) {} });
  }
  // fine del core per l'host (↻ Rivincita) e Rivincita col 3-2-1 con gli altri che «Ci sto»: si riparte senza altri tocchi
  // (ripartita: per i giochi che rifanno la partita nella stessa stanza col LORO 3-2-1, come la corsa di Horto)
  async function finoAllaRivincita(host, altri, attesaFine, ripartita) {
    var w = W.finestra(host);
    if (!await W.aspetta(function () { var b = w.document.querySelector(".fine-tasti"); return b && /Rivincita/.test(b.textContent); }, attesaFine || 10000, 300)) no("a fine partita " + host + " non ha «↻ Rivincita» («" + T(w).slice(0, 80) + "»)");
    var tx = (A.tastiFineDi(w) || []).join(" | ");
    if (!/Cambia gioco/.test(tx)) no("a fine partita " + host + " non ha «🎮 Cambia gioco» (" + tx + ")");
    if (!await W.aspetta(function () { return altri.every(function (n) { return /Ci sto|Ci stai/.test(W.testo(W.finestra(n))); }); }, 8000)) no("non tutti hanno «👍 Ci sto!» (" + altri.filter(function (n) { return !/Ci sto|Ci stai/.test(W.testo(W.finestra(n))); }).join(", ") + ")");
    altri.forEach(function (n) { W.clicca(W.finestra(n), /Ci sto/, ".fine-tasti button"); });
    await W.dorme(500);
    var visto = false, spia = setInterval(function () { if (w.document.querySelector(".sl-via")) visto = true; }, 25);
    W.clicca(w, /Rivincita/, ".fine-tasti button");
    var ok = await W.aspetta(function () { return (visto || (ripartita && ripartita(w))) && !w.document.querySelector(".fine-tasti") && !w.document.querySelector(".saletta-schermo"); }, 20000);
    clearInterval(spia);
    if (!ok) no("dopo «↻ Rivincita» la partita non riparte da sola (3-2-1 " + (visto ? "visto" : "mai visto") + ", fine " + !!w.document.querySelector(".fine-tasti") + ", saletta " + !!w.document.querySelector(".saletta-schermo") + "; «" + T(w).slice(0, 80) + "»)");
    return tx;
  }
  // il cuore di ogni scenario: Paky lancia, a metà si spegne, la Sala passa a Giulia e nessun gioco copre la Sala
  async function cambioHost(o) {
    var X = await salaCon(o.amici, o.gid), S = X.S, P = X.w.Paky, G = X.w.Giulia;
    var tutti = ["Paky"].concat(o.amici), ospiti = o.amici.slice();
    var C = await lancia("Paky", S, o.nome, o.gid, o.scelti);
    await tuttiInSaletta(C, ospiti);
    var guarda = o.scelti ? tutti.filter(function (n) { return o.scelti.indexOf(n) < 0; }) : [];
    for (var g = 0; g < guarda.length; g++) {
      var wg = W.finestra(guarda[g]);
      if (!await W.aspetta(function () { return /Questa volta guardi/.test(W.testo(wg)); }, 8000)) no(guarda[g] + " non legge «👀 Questa volta guardi» («" + T(wg).slice(0, 80) + "»)");
    }
    await comincia("Paky", C, o.partita);
    await W.dorme(o.attesa || 2500);   // (a metà partita)
    if (o.aMeta) await o.aMeta(C);
    if (!(vm(S).vice || []).length || vm(S).vice[0] !== A.idInSala(S, "Giulia")) no("il primo vice non è Giulia: " + JSON.stringify(vm(S).vice));
    var t0 = Date.now(), fotoPrima = P3.passati(C).length;
    spentoDavvero("Paky");
    if (!await W.aspetta(function () { return nomeHost(S) === "Giulia" && vm(S).gen === 2 && inSala(G, S, true) && ospiti.slice(1).every(function (n) { return inSala(W.finestra(n), S); }); }, 32000, 250))
      no("dopo lo spegnimento di Paky non sono tutti nella Sala di Giulia (host " + nomeHost(S) + ", gen " + vm(S).gen + "; " + ospiti.map(function (n) { return n + " «" + T(W.finestra(n)).slice(0, 40) + "»"; }).join(" · ") + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    if (vm(S).gioco || vm(S).stanza) no("la Sala di Giulia ha ancora il gioco " + vm(S).gioco + " (" + vm(S).stanza + ")");
    if (nomi(S).join(",") !== o.amici.slice().sort().join(",")) no("membri della Sala di Giulia: " + nomi(S).join(", "));
    // per 8 s niente del gioco vecchio copre la Sala (timer, conti alla rovescia, «La stanza è chiusa»…)
    var rotto = "", fino = Date.now() + 8000;
    while (Date.now() < fino && !rotto) {
      ospiti.forEach(function (n, k) { if (!rotto && !inSala(W.finestra(n), S, k === 0)) rotto = n + " «" + T(W.finestra(n)).slice(0, 60) + "»"; });
      await W.dorme(150);
    }
    if (rotto) no("dopo il cambio di host qualcosa ha coperto la Sala: " + rotto);
    var resti = ancoraInStanza(C, ["Paky"]);
    if (resti.length) no("restano collegati alla stanza vecchia " + C + ": " + resti.join(", "));
    var nuove = P3.passati(C).slice(fotoPrima).filter(function (x) { return x.da !== "Paky" && x.m && x.m.t === "vm"; });
    if (nuove.length) no("qualcuno ha ripubblicato la stanza vecchia (" + nuove.map(function (x) { return x.da; }).join(", ") + ")");
    erroriVuoti();
    return { S: S, C: C, P: P, G: G, dt: dt, guarda: guarda };
  }
  // Giulia rilancia lo stesso gioco con chi è rimasto (4 posti per 4: niente «Chi gioca?»), fino alla Rivincita col 3-2-1
  async function rilancia(R, o) {
    var altri = o.amici.slice(1);
    var C2 = await lancia("Giulia", R.S, o.nome, o.gid, null);
    if (C2 === R.C) no("la stanza nuova ha lo stesso codice di quella di Paky");
    await tuttiInSaletta(C2, altri);
    if (o.inSaletta) await o.inSaletta(C2);
    await comincia("Giulia", C2, o.partita);
    await W.dorme(1200);
    if (o.fino) { if (!await o.fino(C2, altri)) no("la partita di Giulia non arriva alla fine"); }
    else fineFinta(o.amici);
    var tx = await finoAllaRivincita("Giulia", altri, o.attesaFine, o.ripartita);
    await P3.unSoloHost(R.S, 1500);
    erroriVuoti();
    return { C2: C2, tx: tx };
  }

  var GIOCHI = {
    // Bea guarda, Giulia (il vice) sale sulla scala; la Scalinata si gioca davvero
    381: { nome: "La Scalinata", gid: "scalinata", amici: ["Giulia", "Luca", "Marco", "Bea"], scelti: ["Paky", "Giulia", "Luca", "Marco"],
      partita: function (v) { return v.fase === "scelta"; }, attesa: 1500,
      aMeta: async function (C) {   // un round intero: si arriva al secondo round (la partita di Paky è salvata sul suo telefono)
        ["Giulia", "Luca", "Marco"].forEach(function (n) { W.clicca(W.finestra(n), /^\s*3\s*gradin/); });
        if (!await W.aspetta(function () { return vm(C).fase === "rivela"; }, 15000)) no("il primo round della Scalinata non si chiude");
        W.clicca(W.finestra("Paky"), /Prossimo round/);
        if (!await W.aspetta(function () { return vm(C).fase === "scelta"; }, 6000)) no("non parte il secondo round");
        var sv = JSON.parse(W.finestra("Paky").localStorage.getItem("sg-scalinata-host") || "null");
        if (!sv || !sv.st || sv.st.codice !== C) no("la partita di Paky non è salvata sul suo telefono (serve alla prova)");
      },
      inSaletta: async function (C2) {
        var v = vm(C2), G = W.finestra("Giulia");
        if (v.fase !== "lobby") no("la Scalinata di Giulia non parte dalla saletta (fase " + v.fase + "): ha ripreso la partita di Paky");
        if ((v.posti || []).some(function (p) { return p.passi > 0; })) no("sulla scala di Giulia qualcuno ha già dei gradini");
        if (/si riprende/i.test(A.pill(G))) no("Giulia legge «si riprende»");
        var sv = JSON.parse(G.localStorage.getItem("sg-scalinata-host") || "null");
        if (sv && sv.st && sv.st.codice !== C2) no("Giulia ha salvata una Scalinata di un'altra stanza (" + sv.st.codice + ")");
      },
      fino: function (C2, altri) { return A.scalinataFinoAllaFine(C2, altri, "Giulia"); }, attesaFine: 12000 },
    // Giulia (il vice) GUARDA il tavolo; la fine si chiama dal tavolo
    382: { nome: "Palla Matta", gid: "pallamatta", amici: ["Giulia", "Luca", "Marco", "Bea"], scelti: ["Paky", "Luca", "Marco", "Bea"],
      partita: function (v) { return v.fase === "gioco"; } },
    // Luca guarda lo studio, Giulia gira la ruota
    383: { nome: "La Ruota della Fortuna", gid: "ruota", amici: ["Giulia", "Luca", "Marco", "Bea"], scelti: ["Paky", "Giulia", "Marco", "Bea"],
      partita: function (v) { return v.giocoFase === "gioco"; } },
    // Giulia (il vice) guarda il tavolo
    384: { nome: "Scopa 2 vs 2", gid: "scopa2v2", amici: ["Giulia", "Luca", "Marco", "Bea"], scelti: ["Paky", "Luca", "Marco", "Bea"],
      partita: function () { return !!W.finestra("Luca").document.querySelector(".sc-mensola"); } },
    // lancia Paky, sulla trave Giulia, Marco e Bea; Luca guarda. Dopo: lancia Giulia, partita intera
    385: { nome: "Palla a Pendolo", gid: "pendolo", amici: ["Giulia", "Luca", "Marco", "Bea"], scelti: ["Paky", "Giulia", "Marco", "Bea"],
      fino: function (C2) { return W.aspetta(function () { return W.finestra("Giulia").document.querySelector(".fine-tasti"); }, 90000, 300); }, attesaFine: 5000 },
    // Horto: 8 posti, corrono in 4 (più i bot); corsa intera anche dopo
    386: { nome: "Horto Muso", gid: "horto", amici: ["Giulia", "Luca", "Marco"], scelti: null,
      ripartita: function (w) { return /mancano/.test(W.testo(w)); },   // (la Rivincita rifà la corsa col 3-2-1 della corsa)
      fino: function (C2) { return W.aspetta(function () { return W.finestra("Giulia").document.querySelector(".fine-tasti"); }, 90000, 300); }, attesaFine: 5000 }
  };

  Object.keys(GIOCHI).forEach(function (k) {
    var o = GIOCHI[k];
    var chiGuarda = o.scelti ? ["Paky"].concat(o.amici).filter(function (n) { return o.scelti.indexOf(n) < 0; })[0] : null;
    aggiungi(+k, { nome: o.nome + " nella Sala: Paky si spegne a metà partita" + (chiGuarda ? " (" + chiGuarda + " guardava)" : "") + " → tutti nella Sala di Giulia, niente gioco sopra la Sala; Giulia rilancia fino alla Rivincita col 3-2-1", fai: async function () {
      var R = await cambioHost(o);
      var parte = o.nome + ": Sala a Giulia dopo " + R.dt + " s" + (R.guarda.length ? " (guardava " + R.guarda.join(", ") + ")" : "") + ", niente gioco sopra la Sala per 8 s, nessuno nella stanza vecchia";
      var Z = await rilancia(R, o);
      parte += "; Giulia rilancia (" + Z.C2 + ") fino alla Rivincita col 3-2-1 (" + Z.tx + ")";
      if (+k === 381) parte += "; " + await pakyTorna(R, Z);
      return parte;
    } });
  });

  // (gli aiuti di questo file, per riprovare a mano un pezzo: COPIONE.passo3.giochiB.salaCon(…))
  if (P3) P3.giochiB = { salaCon: salaCon, lancia: lancia, tuttiInSaletta: tuttiInSaletta, comincia: comincia, fineFinta: fineFinta, finoAllaRivincita: finoAllaRivincita, cambioHost: cambioHost, rilancia: rilancia, GIOCHI: GIOCHI, ancoraInStanza: ancoraInStanza };

  // 381, in fondo: Paky (che aveva la Scalinata salvata) si riaccende e poi ricarica la pagina: entra da amico nella Sala di
  // Giulia, non riapre né ripubblica la sua Scalinata vecchia, mai due host
  async function pakyTorna(R, Z) {
    var S = R.S, C = R.C, t0 = Date.now();
    W.scongela("Paky"); W.riaccendi("Paky");
    var P = W.finestra("Paky");
    var dentro = function () { return (vm(S).membri || []).some(function (m) { return m.nome === "Paky" && m.id !== "host"; }) && nomeHost(S) === "Giulia"; };
    if (!await W.aspetta(function () { return dentro() && !P.document.querySelector(".scala, .sc-scala") && (inSala(P, S) || P.document.querySelector(".saletta-schermo, .fine-tasti") || /Scalinata|gradin/.test(W.testo(P))); }, 12000))
      no("Paky riacceso non entra da amico nella Sala di Giulia (membri " + nomi(S).join(", ") + "; «" + T(P).slice(0, 60) + "»)");
    await W.dorme(2000);
    // (con la rete giù il telefono di Paky è andato avanti da solo coi bot: tornando la rete manda in un colpo le foto rimaste
    // in coda, poi il core chiude la stanza vecchia. Va bene solo se è un colpo solo e la stanza resta chiusa e vuota)
    var sue = P3.passati(C, t0).filter(function (x) { return x.da === "Paky" && x.m && x.m.t === "vm"; });
    if (sue.length && sue[sue.length - 1].ms - sue[0].ms > 300) no("Paky tornando ha ripubblicato la Scalinata vecchia per " + (sue[sue.length - 1].ms - sue[0].ms) + " ms (" + sue.length + " foto su " + C + ")");
    if ((W.statoStanza(C) || {}).t) no("la stanza vecchia " + C + " è ancora aperta (foto " + W.statoStanza(C).t + ")");
    var dentroC = ancoraInStanza(C);
    if (dentroC.length) no("sono collegati alla stanza vecchia: " + dentroC.join(", "));
    if (eHost(P) && A.codiceSaletta(P) === C) no("Paky è tornato host della Scalinata vecchia");
    var coda = sue.length ? " (coda di " + sue.length + " foto mandata in un colpo, poi la stanza vecchia chiusa)" : "";
    await P3.unSoloHost(S, 1500);
    P = await W.ricarica("Paky");
    var t1 = Date.now();
    await W.dorme(4000);
    sue = P3.passati(C, t1).filter(function (x) { return x.da === "Paky" && x.m && x.m._s; });
    if (sue.length) no("Paky ricaricando ha riaperto la Scalinata vecchia (" + sue.length + " foto su " + C + ")");
    if (/si riprende/i.test(A.pill(P))) no("Paky legge «si riprende»");
    if (nomeHost(S) !== "Giulia") no("dopo la ricarica di Paky la Sala la tiene " + nomeHost(S));
    await P3.unSoloHost(S, 1500);
    erroriVuoti();
    return "Paky torna da amico (Sala di " + nomeHost(S) + ")" + coda + ", la Scalinata vecchia non riparte nemmeno ricaricando («" + T(P).slice(0, 40) + "»)";
  }
})();

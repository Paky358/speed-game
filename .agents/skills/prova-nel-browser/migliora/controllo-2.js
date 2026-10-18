// PROVE DEL CONTROLLO (controllo-miglioramenti-2, 16 ott 2026): i casi cattivi dei miglioramenti di Scopa in tre e Impostore
// che le prove degli autori non toccavano.
// Uso (dopo copione-prova.js e i file migliora/adue-faccine.js e migliora/impostore.js):
//   await COPIONE.carica("migliora/controllo-2.js"); await COPIONE.prova("c21")
//
// c21 Scopa in tre online (stanza di un gioco solo, a 11 punti): Giulia spegne il telefono più di 20 s a partita in corso
//     (gioca il Bot al posto suo), poi lo riaccende e si riprende il posto con le sue carte; Marco arriva tardi e guarda
//     senza carte; il tavolo dell'ospite e di chi guarda sta a 360x640 e 412x915; l'host ricarica la pagina: tutti di nuovo
//     (dal Passo 5) la stessa partita riprende: ognuno al suo posto con le sue carte, una sola persona di turno.
// c22 Impostore online FUORI dalla Sala (stanza di un gioco solo): Marco arriva a partita cominciata e guarda; a fine
//     partita l'host fa «Nuova partita» e Marco entra a giocare (prima restava fuori).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;

  function alTavolo3(w) { return !!(w && w.document.querySelector(".sc-mensola1") && w.document.querySelectorAll(".sc-targa4").length === 2); }
  // gioca la prima carta (o la presa verde) quando tocca a lui, per "ms" millisecondi
  async function giocaPer(nomi, ms) {
    var fino = Date.now() + ms;
    while (Date.now() < fino) {
      nomi.forEach(function (n) {
        var w = W.finestra(n); if (!w) return;
        var mens = w.document.querySelector(".sc-mensola1.tuo"); if (!mens) return;
        var verde = w.document.querySelector(".sc-carta.cap");
        if (verde) { verde.click(); return; }
        var c = mens.querySelector(".sc-carta:not(.inviata):not(.sel)"); if (c) c.click();
      });
      await W.dorme(350);
    }
  }
  function manoDi(w) { return w ? w.document.querySelectorAll(".sc-mensola1 .sc-mano-riga .sc-carta").length : -1; }

  COPIONE.aggiungi("c21", { nome: "Scopa in tre online: telefono spento (gioca il Bot), riacceso (riprende), chi arriva tardi, misure, host che ricarica", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    var tess = await W.aspetta(function () { return A.tessera(P, "Scopa"); }, 6000); if (!tess) no("non trovo la tessera della Scopa");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /apro io/)) no("non trovo «Online: apro io la stanza»");
    await W.dorme(400);
    if (!W.clicca(P, /In tre/)) no("nelle impostazioni non c'è «In tre»");
    await W.dorme(150);
    if (!W.clicca(P, /Apri la stanza/)) no("non trovo «Apri la stanza»");
    var C = await W.aspetta(function () { return A.codiceSaletta(P) || A.codiceTestata(P); }, 5000); if (!C) no("la stanza non ha il codice");
    var G = await W.apriTel("Giulia", { hash: "gioco=scopa&stanza=" + C, x: 185 });
    var L = await W.apriTel("Luca", { hash: "gioco=scopa&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return P.document.querySelectorAll(".sl-av:not(.sl-vuoto)").length >= 3 && /Scopa in tre/.test(T(G)) && /Scopa in tre/.test(T(L)); }, 9000))
      no("i tre non sono nella saletta a tre («" + T(G).slice(0, 80) + "»)");
    if (!W.clicca(P, /Comincia/)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return alTavolo3(P) && alTavolo3(G) && alTavolo3(L); }, 9000)) no("non tutti e tre sono al tavolo a tre");
    await giocaPer(["Paky", "Giulia", "Luca"], 5000);
    // Marco arriva tardi: guarda, senza carte in mano e senza «Tocca a te!»
    var M = await W.apriTel("Marco", { hash: "gioco=scopa&stanza=" + C, x: 555 });
    if (!await W.aspetta(function () { return alTavolo3(M); }, 10000)) no("Marco (arrivato tardi) non vede il tavolo («" + T(M).slice(0, 80) + "»)");
    if (manoDi(M) > 0) no("Marco vede delle carte in mano");
    if (/Tocca a te!/.test(T(M))) no("Marco legge «Tocca a te!»");
    if (!/👀/.test(T(M))) no("Marco non legge che guarda (👀)");
    // misure: il tavolo di chi gioca (Giulia) e di chi guarda (Marco)
    var mis = W.ADUE.misura, err;
    err = await mis(G, "Giulia", 360, 640, ".sc-mensola"); if (err) no("tavolo di Giulia " + err);
    err = await mis(G, "Giulia", 412, 915, ".sc-mensola"); if (err) no("tavolo di Giulia " + err);
    err = await mis(M, "Marco", 360, 640, ".sc-mensola"); if (err) no("tavolo di Marco " + err);
    W.ADUE.rimetti("Giulia"); W.ADUE.rimetti("Marco"); G.dispatchEvent(new G.Event("resize")); M.dispatchEvent(new M.Event("resize"));
    // Giulia spegne il telefono più di 20 s: gioca il Bot al posto suo, la partita non si ferma
    W.spegni("Giulia");
    var visto = null, fino = Date.now() + 32000;
    while (Date.now() < fino) {
      await giocaPer(["Paky", "Luca"], 700);
      var v = W.vmDi(C) || {};
      if (v.nomi && v.nomi[1] && v.nomi[1] !== "Giulia") { visto = v.nomi[1]; break; }
    }
    if (!visto) no("dopo 30 s col telefono spento, al posto di Giulia non gioca il Bot (" + JSON.stringify((W.vmDi(C) || {}).nomi) + ")");
    var g0 = (W.vmDi(C) || {}).nMano + ":" + JSON.stringify((W.vmDi(C) || {}).nCarte);
    await giocaPer(["Paky", "Luca"], 4000);
    var g1 = (W.vmDi(C) || {}).nMano + ":" + JSON.stringify((W.vmDi(C) || {}).nCarte);
    if (g0 === g1 && (W.vmDi(C) || {}).fase === "gioco") no("col Bot al posto di Giulia la partita resta ferma (" + g1 + ")");
    // riaccende: si riprende il posto, con le sue carte (tante quante dice l'host)
    W.riaccendi("Giulia");
    if (!await W.aspetta(function () { var v = W.vmDi(C) || {}; return v.nomi && v.nomi[1] === "Giulia"; }, 15000)) no("Giulia riaccende il telefono ma non si riprende il posto (" + JSON.stringify((W.vmDi(C) || {}).nomi) + ")");
    if (!await W.aspetta(function () { var v = W.vmDi(C) || {}; return v.fase !== "gioco" || (alTavolo3(G) && manoDi(G) === v.nCarte[1]); }, 8000))
      no("Giulia non ritrova le sue carte (" + manoDi(G) + " invece di " + JSON.stringify((W.vmDi(C) || {}).nCarte) + ")");
    // l'host ricarica (dal Passo 5 la Scopa riprende): la stessa partita, stesso codice, ognuno al suo posto con le sue carte,
    // una sola persona con «Tocca a te» (quella di turno nella foto) e la partita va avanti
    var vPrima = W.vmDi(C) || {};
    P = await W.ricarica("Paky");
    function tuoi() { return ["Paky", "Giulia", "Luca"].filter(function (n) { return W.finestra(n).document.querySelector(".sc-mensola1.tuo"); }); }
    var okR = await W.aspetta(function () {
      var v = W.vmDi(C) || {};
      return v.fase === "gioco" && alTavolo3(P) && alTavolo3(G) && alTavolo3(L) && manoDi(G) === v.nCarte[1] && manoDi(L) === v.nCarte[2] && manoDi(P) === v.nCarte[0] && tuoi().length <= 1;
    }, 25000);
    var vD = W.vmDi(C) || {};
    if (!okR) no("dopo la ricarica dell'host la partita non riprende bene (fase " + vD.fase + ", carte " + JSON.stringify(vD.nCarte) + " / Paky " + manoDi(P) + " Giulia " + manoDi(G) + " Luca " + manoDi(L) + ", «Tocca a te» per " + tuoi().join("+") + "; Giulia: «" + T(G).slice(0, 90) + "», Paky: «" + T(P).slice(0, 90) + "»)");
    if (vD.nMano !== vPrima.nMano) no("dopo la ricarica la mano è cambiata (" + vPrima.nMano + " → " + vD.nMano + ")");
    if ((A.codiceSaletta(P) || A.codiceTestata(P) || C) !== C) no("dopo la ricarica il codice è cambiato");
    var k0 = JSON.stringify(vD.nCarte) + vD.mazzoN;
    await giocaPer(["Paky", "Giulia", "Luca"], 6000);
    var vF = W.vmDi(C) || {};
    if (vF.fase === "gioco" && JSON.stringify(vF.nCarte) + vF.mazzoN === k0) no("dopo la ripresa la partita resta ferma (" + k0 + ")");
    await W.dorme(2500);
    var scritte = tuoi();   // (la scritta «Tocca a te!» c'è sempre nella pagina: si vede solo sulla mensola .tuo)
    if ((W.vmDi(C) || {}).fase === "gioco" && scritte.length > 1) no("dopo la ripresa tocca a più di uno: " + scritte.join(" e "));
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Giulia spenta → gioca il Bot " + visto + ", riaccesa → riprende con le sue carte; Marco guarda senza carte; misure ok; host ricarica → la partita riprende (" + C + ", mano " + vD.nMano + ") e va avanti";
  } });

  // c23 Scopa in tre online: chi non gioca per troppo (telefono in tasca) riceve l'avviso e il Bot gioca UNA carta per lui;
  //     il posto resta suo e la partita non resta ferma (il tempo qui è 8 s invece di 60: window.__scopaTurno3)
  COPIONE.aggiungi("c23", { nome: "Scopa in tre online: chi si distrae, il Bot gioca una carta per lui (la partita non resta ferma)", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: function (w) { w.__scopaTurno3 = 8; } });
    var tess = await W.aspetta(function () { return A.tessera(P, "Scopa"); }, 6000); if (!tess) no("non trovo la tessera della Scopa");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /apro io/)) no("non trovo «Online: apro io la stanza»");
    await W.dorme(400);
    if (!W.clicca(P, /In tre/)) no("nelle impostazioni non c'è «In tre»");
    await W.dorme(150);
    if (!W.clicca(P, /Apri la stanza/)) no("non trovo «Apri la stanza»");
    var C = await W.aspetta(function () { return A.codiceSaletta(P) || A.codiceTestata(P); }, 5000); if (!C) no("la stanza non ha il codice");
    var G = await W.apriTel("Giulia", { hash: "gioco=scopa&stanza=" + C, x: 185 });
    var L = await W.apriTel("Luca", { hash: "gioco=scopa&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return P.document.querySelectorAll(".sl-av:not(.sl-vuoto)").length >= 3 && /Scopa in tre/.test(T(G)) && /Scopa in tre/.test(T(L)); }, 9000))
      no("i tre non sono nella saletta a tre");
    if (!W.clicca(P, /Comincia/)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return alTavolo3(P) && alTavolo3(G) && alTavolo3(L); }, 9000)) no("non tutti e tre sono al tavolo a tre");
    // Paky e Luca giocano, Giulia (posto 1) mai: le sue carte calano lo stesso, con l'avviso, e il posto resta suo
    var n0 = null, avvisato = false, giocato = false, fino = Date.now() + 40000;
    while (Date.now() < fino && !giocato) {
      await giocaPer(["Paky", "Luca"], 600);
      var v = W.vmDi(C) || {};
      if (/tra 15 secondi gioca il Bot/.test(T(G)) || (v.avviso && /tra 15 secondi/.test(v.avviso.testo))) avvisato = true;
      if (v.turno === 1 && n0 == null) n0 = v.nCarte[1] + ":" + v.nMano + ":" + v.mazzoN;
      if (v.avviso && /ci pensava troppo/.test(v.avviso.testo)) giocato = true;
    }
    if (!giocato) no("Giulia non gioca e la partita resta ferma (" + JSON.stringify((W.vmDi(C) || {}).avviso) + ")");
    if (!avvisato) no("Giulia non riceve l'avviso «tra 15 secondi gioca il Bot»");
    var v2 = W.vmDi(C) || {};
    if (v2.nomi[1] !== "Giulia") no("dopo la carta giocata dal Bot il posto non è più di Giulia (" + v2.nomi[1] + ")");
    if (!alTavolo3(G)) no("Giulia non vede più il tavolo");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Giulia distratta: avviso, il Bot gioca una carta per lei, il posto resta suo";
  } });

  // ---- Impostore fuori dalla Sala (registrato al posto della Gara di pesca, come in migliora/impostore.js) ----
  function vmI(C) { return W.vmDi(C) || {}; }
  function nomiI(C) { return (vmI(C).players || []).map(function (p) { return p.nome; }); }
  async function pronto(w) { var b = await W.aspetta(function () { var x = w && w.document.querySelector(".im-pronto"); return x && !x.disabled ? x : null; }, 3000); if (b) b.click(); return !!b; }
  function vota(w, nome) {
    var b = [].filter.call(w.document.querySelectorAll(".im-vb"), function (x) { return (x.querySelector("b") || {}).textContent === nome; })[0];
    if (!b || b.disabled) return false; b.click(); return true;
  }
  COPIONE.aggiungi("c22", { nome: "Impostore fuori dalla Sala: chi arriva tardi guarda ed entra alla partita dopo", fai: async function () {
    var opz = function (x) { return Object.assign({ comeImp: true }, x); };
    var P = await W.apriTel("Paky", opz({ x: 0, prima: function (w) { w.__imp = { aiuto: "categoria", spia: "no", mani: 1, indizi: "voce", tempo: 60 }; } }));
    var tess = await W.aspetta(function () { return A.tessera(P, "L'Impostore"); }, 6000); if (!tess) no("non trovo la tessera dell'Impostore");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /apro io/)) no("non trovo «Online: apro io la stanza» («" + T(P).slice(0, 100) + "»)");
    await W.dorme(400);
    if (!W.clicca(P, /Apri la stanza/)) no("non trovo «Apri la stanza»");
    var C = await W.aspetta(function () { return A.codiceSaletta(P) || A.codiceTestata(P); }, 5000); if (!C) no("la stanza non ha il codice");
    var nomi = ["Giulia", "Luca"];
    for (var i = 0; i < nomi.length; i++) await W.apriTel(nomi[i], opz({ hash: "gioco=garapesca&stanza=" + C, x: 185 * (i + 1) }));
    if (!await W.aspetta(function () { return nomiI(C).length === 3; }, 10000)) no("nella saletta non arrivano in 3 (" + nomiI(C) + ")");
    if (!W.clicca(P, /Comincia/, ".sl-go") && !W.clicca(P, /Comincia/)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { var v = vmI(C); return v.fase === "gioco" && v.passo === "discuti"; }, 10000)) no("la partita non comincia (" + vmI(C).passo + ")");
    // Marco arriva a partita cominciata: guarda
    var M = await W.apriTel("Marco", opz({ hash: "gioco=garapesca&stanza=" + C, x: 555 }));
    if (!await W.aspetta(function () { return M.document.querySelector(".im-scena") && /Guardi/.test(T(M)); }, 12000)) no("Marco non guarda la partita («" + T(M).slice(0, 100) + "»)");
    if (nomiI(C).indexOf("Marco") >= 0) no("Marco è stato messo in partita a metà");
    // si vota subito: tutti «🗳️ Votiamo», poi ognuno vota il prossimo
    var tutti = ["Paky", "Giulia", "Luca"];
    for (i = 0; i < tutti.length; i++) await pronto(W.finestra(tutti[i]));
    if (!await W.aspetta(function () { return vmI(C).passo === "voto"; }, 6000)) no("con tutti su «Votiamo» non si vota");
    await W.dorme(400);
    for (i = 0; i < tutti.length; i++) {
      var w = W.finestra(tutti[i]), chi = tutti[(i + 1) % tutti.length];
      if (!await W.aspetta(function () { return vota(w, chi); }, 4000)) no(tutti[i] + " non riesce a votare " + chi);
    }
    // spoglio, (ultima possibilità), fine mano: «⏩ Avanti» di tutti → classifica (mani: 1)
    var fine = await W.aspetta(function () {
      var v = vmI(C);
      if (v.fase === "fine") return true;
      if (v.passo === "ultima" && v.ultima) { var wi = W.finestra(((v.players || []).filter(function (p) { return p.id === v.ultima.chi; })[0] || {}).nome); var b = wi && wi.document.querySelector(".im-scelte button:not([disabled])"); if (b) b.click(); }
      if (v.passo === "esito") tutti.forEach(function (n) { var x = W.finestra(n).document.querySelector(".im-pronto"); if (x && !x.disabled) x.click(); });
      return false;
    }, 60000);
    if (!fine) no("la partita non arriva alla classifica (" + vmI(C).passo + ")");
    if (!await W.aspetta(function () { return /Questa partita l'hai guardata/.test(T(M)); }, 6000)) no("Marco non legge «Questa partita l'hai guardata» («" + T(M).slice(0, 100) + "»)");
    // Nuova partita: Marco entra a giocare
    if (!W.clicca(P, /Nuova partita|Rivincita/)) no("l'host non trova «Nuova partita» («" + T(P).slice(0, 120) + "»)");
    if (!await W.aspetta(function () { return vmI(C).fase === "lobby" && nomiI(C).indexOf("Marco") >= 0; }, 15000))
      no("alla partita dopo Marco non entra a giocare (in saletta: " + nomiI(C).join(", ") + "; Marco: «" + T(M).slice(0, 100) + "»)");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "fuori dalla Sala: Marco guarda la partita e alla «Nuova partita» entra (" + nomiI(C).join(", ") + ")";
  } });
})();

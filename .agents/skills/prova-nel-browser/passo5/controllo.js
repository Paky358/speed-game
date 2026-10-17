// PROVE DEL CONTROLLO DEL PASSO 5 (i casi cattivi trovati dal controllore, 17 ott 2026). Contatore con la riserva, 4 telefoni.
// Uso (dopo copione-prova.js): await COPIONE.carica("passo5/controllo.js"); await COPIONE.prova("5c1")
// 5c1 la vice che tiene la partita ricarica la pagina: la riprende lei (stesso _g e _h), nessun altro prende il posto.
// 5c2 l'host sparisce, la vice porta avanti la partita e poi la chiude (Esci): l'host che riaccende il telefono e riapre
//     l'app NON si ritrova da solo nella partita vecchia (prima la riapriva con la foto di prima): va in home con
//     «🏁 La partita è finita mentre eri via» e sulla stanza non ripubblica niente.
// 5c2b lo stesso, ma il telefono dell'host era solo in secondo piano: la pagina di prima torna, trova la stanza chiusa e va in home.
// 5c3 l'host ricarica dopo il subentro mentre la vice tiene ancora la partita: rientra da giocatore (non va in home).
// 5c4 tanti amici (7 telefoni): l'host sparisce, Giulia porta avanti e tutti e 6 tornano a giocare.
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti;
  var aggiungi = COPIONE.aggiungi.bind(COPIONE);
  function no(p) { throw new Error(p); }

  aggiungi("5c1", { nome: "Controllo: la vice che tiene la partita ricarica la pagina e la riprende lei", fai: async function () {
    var r = await A.apriRiserva(), C = r.C;
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === r.ids.Giulia; }, 9000)) no("Giulia non subentra " + JSON.stringify(A.chiTiene(C)));
    if (!await W.aspetta(function () { return A.vm(C).fase === "gioco" && A.contaDentro(A.vm(C)) === 3; }, 8000)) no("non si torna a giocare in tre");
    A.tocca(r.w.Luca, ".ct-piu"); if (!await W.aspetta(function () { return A.vm(C).n === r.n0 + 1; }, 3000)) no("il +1 di Luca non arriva");
    await W.dorme(1500);
    var t0 = Date.now();
    await W.ricarica("Giulia");
    var ok = await W.aspetta(function () { var c = A.chiTiene(C), s = W.statoStanza(C) || {}; return c.h === r.ids.Giulia && s._r && A.vm(C).fase === "gioco" && A.contaDentro(A.vm(C)) === 3; }, 12000);
    var c = A.chiTiene(C);
    if (!ok) no("dopo la ricarica di Giulia: " + JSON.stringify(c) + ", fase " + A.vm(C).fase + ", dentro " + A.contaDentro(A.vm(C)));
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    if (A.vm(C).n !== r.n0 + 1) no("il numero era " + (r.n0 + 1) + " e ora è " + A.vm(C).n);
    var altri = A.fotoDa(C, t0).filter(function (f) { return f.h && f.h !== r.ids.Giulia; });
    if (altri.length) no("foto di altri dopo la ricarica: " + JSON.stringify(altri.slice(0, 3)));
    await W.dorme(8000);
    c = A.chiTiene(C); if (c.h !== r.ids.Giulia) no("dopo 8 s la partita la tiene " + JSON.stringify(c));
    A.tocca(r.w.Sara, ".ct-piu"); if (!await W.aspetta(function () { return A.vm(C).n === r.n0 + 2; }, 3000)) no("il +1 di Sara non arriva");
    A.tocca(W.finestra("Giulia"), ".ct-piu"); if (!await W.aspetta(function () { return A.vm(C).n === r.n0 + 3; }, 3000)) no("il +1 di Giulia non arriva");
    return "Giulia ricarica e tiene ancora la partita (_g " + c.g + ") in " + dt + " s, si continua in tre";
  } });

  aggiungi("5c2", { nome: "Controllo: la vice chiude la partita, l'host sparito riapre l'app e va in home", fai: async function () {
    var r = await A.apriRiserva(), C = r.C;
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === r.ids.Giulia; }, 9000)) no("Giulia non subentra");
    await W.dorme(2000);
    A.tocca(r.w.Giulia, ".ct-esci");
    if (!await W.aspetta(function () { return !W.statoStanza(C); }, 4000)) no("Giulia esce ma la stanza resta");
    var P = await W.chiudiApp("Paky"), pv = "";   // (il telefono era morto: la pagina di prima non c'è più)
    await W.aspetta(function () { var p = A.pill(P); if (/finita mentre eri via/.test(p)) pv = p; return pv && P.document.querySelector(".tessera"); }, 8000);
    if (!pv) no("Paky non legge «🏁 La partita è finita mentre eri via» («" + A.pill(P) + "»)");
    if (P.document.querySelector(".ct-piu")) no("Paky è di nuovo nella partita vecchia");
    if (!P.document.querySelector(".tessera")) no("Paky non è in home («" + A.T(P).slice(0, 80) + "»)");
    await W.dorme(1500);
    if (W.statoStanza(C)) no("Paky ha ripubblicato la stanza " + C + ": " + JSON.stringify(W.statoStanza(C)).slice(0, 100));
    if (W.BR.mem.Paky.l["sg-ripresa"]) no("la ripresa di Paky è rimasta");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Paky in home con «" + pv + "», stanza " + C + " non ripubblicata, ripresa scordata";
  } });

  // 5c2b. Lo stesso, ma il telefono dell'host era solo in secondo piano (rete persa): torna la pagina di prima, che si
  //       ricollega, trova la stanza chiusa e va in home (prima ripubblicava la partita vecchia)
  aggiungi("5c2b", { nome: "Controllo: la vice chiude la partita, l'host torna dal secondo piano e va in home", fai: async function () {
    var r = await A.apriRiserva(), C = r.C, P = r.w.Paky;
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === r.ids.Giulia; }, 9000)) no("Giulia non subentra");
    await W.dorme(2000);
    A.tocca(r.w.Giulia, ".ct-esci");
    if (!await W.aspetta(function () { return !W.statoStanza(C) && !W.statoStanza(C, 1); }, 4000)) no("Giulia esce ma la stanza resta");
    A.torna("Paky");
    var pv = "";
    await W.aspetta(function () { var p = A.pill(P); if (/finita mentre eri via/.test(p)) pv = p; return pv && P.document.querySelector(".tessera"); }, 10000);
    if (!pv) no("Paky non legge «🏁 La partita è finita mentre eri via» («" + A.pill(P) + "», «" + A.T(P).slice(0, 60) + "»)");
    if (P.document.querySelector(".ct-piu")) no("Paky è ancora nella partita vecchia");
    await W.dorme(2000);
    if (W.statoStanza(C) || W.statoStanza(C, 1)) no("Paky ha ripubblicato la stanza " + C);
    if (W.BR.mem.Paky.l["sg-ripresa"]) no("la ripresa di Paky è rimasta");
    // e riaprendo l'app più tardi non torna niente
    P = await W.chiudiApp("Paky"); await W.dorme(3000);
    if (P.document.querySelector(".ct-piu") || W.statoStanza(C)) no("riaprendo l'app Paky si ritrova nella partita vecchia");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Paky torna, legge «" + pv + "» e va in home; la stanza resta chiusa anche riaprendo l'app";
  } });

  // 5c4. Tanti amici (7 telefoni): l'host sparisce, Giulia porta avanti e tutti e 6 tornano a giocare, nessuno resta fuori
  aggiungi("5c4", { nome: "Controllo: 7 telefoni, l'host sparisce, tutti di nuovo in partita con Giulia", fai: async function () {
    var amici = ["Giulia", "Luca", "Sara", "Marco", "Anna", "Teo"];
    var r = await A.apriRiserva({ amici: amici }), C = r.C, t0 = Date.now();
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === r.ids.Giulia; }, 9000)) no("Giulia non subentra " + JSON.stringify(A.chiTiene(C)));
    if (!await W.aspetta(function () { return A.vm(C).fase === "gioco" && A.contaDentro(A.vm(C)) === 6; }, 10000)) no("non tornano tutti (dentro " + A.contaDentro(A.vm(C)) + " su 6)");
    var dt = ((Date.now() - t0) / 1000).toFixed(1), n = A.vm(C).n;
    for (var i = 1; i < amici.length; i++) A.tocca(r.w[amici[i]], ".ct-piu");
    if (!await W.aspetta(function () { return A.vm(C).n === n + 5; }, 5000)) no("i +1 degli amici non arrivano tutti (" + (A.vm(C).n - n) + " su 5)");
    var altri = A.fotoDa(C, t0 + 9000).filter(function (f) { return f.h !== r.ids.Giulia; });
    if (altri.length) no("foto di un altro host: " + JSON.stringify(altri.slice(0, 3)));
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "in 7: Giulia tiene la partita e tutti e 6 giocano di nuovo in " + dt + " s";
  } });

  aggiungi("5c3", { nome: "Controllo: l'host ricarica dopo il subentro e rientra da giocatore", fai: async function () {
    var r = await A.apriRiserva(), C = r.C;
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === r.ids.Giulia; }, 9000)) no("Giulia non subentra");
    await W.dorme(1500);
    W.scongela("Paky"); W.riaccendi("Paky");
    var t0 = Date.now(), P = await W.ricarica("Paky"), pb = "";
    var ok = await W.aspetta(function () { var p = A.pill(P); if (/Bentornato/.test(p)) pb = p; return pb && A.contaDentro(A.vm(C)) === 4 && P.document.querySelector(".ct-piu"); }, 12000);
    if (!ok) no("Paky non rientra da giocatore (pillola «" + A.pill(P) + "», dentro " + A.contaDentro(A.vm(C)) + ")");
    var altri = A.fotoDa(C, t0 + 3000).filter(function (f) { return f.h !== r.ids.Giulia; });
    if (altri.length) no("dopo 3 s ci sono foto di un altro host: " + JSON.stringify(altri.slice(0, 3)));
    await W.dorme(2000);   // (Paky rientra da giocatore: un attimo per il collegamento da ospite)
    var n = A.vm(C).n;
    A.tocca(P, ".ct-piu");
    if (!await W.aspetta(function () { return A.vm(C).n === n + 1; }, 5000)) no("il +1 di Paky non arriva (n " + A.vm(C).n + ", posti " +
      JSON.stringify((A.vm(C).giocatori || []).map(function (p) { return p.id + (p.via ? "-via" : ""); })) + ", schermo «" + A.T(P).slice(0, 50) + "»)");
    return "Paky legge «" + pb + "» e gioca da giocatore; la partita resta a Giulia";
  } });
})();

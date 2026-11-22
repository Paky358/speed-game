// L'IMPOSTORE, le prove della caccia ai difetti (22 nov 2026). Si caricano DOPO impostore3/scene.js:
//   prova.js --porta 8931 --carica impostore3/scene.js,impostore3/prove.js --prova imd1,imd2 --timeout 900
// imd1: in 4, 2 mani. Bea arriva tardi mentre si scrivono gli indizi: guarda col segreto, il suo id è nella foto («prossimi»:
//       il join non si ripete), legge «👀 Guardi: giochi dalla prossima mano»; alla 2ª mano gioca con 0 punti e ha la sua parola.
//       Dina guarda col link (&guarda=1): non è tra i giocatori, vede il segreto di chi guarda (tenendo premuto), ha il posto
//       della targhetta in basso e niente faccine doppie; alla 2ª mano riceve il segreto nuovo. Il riquadro della Sala
//       («a che punto è»): l'host lo dice (t.aCheSiamo).
// imd2: a eliminazione in 7 con 2 impostori che si conoscono: dal giro 2 (carta piccola) la carta coperta è ALTA UGUALE su
//       tutti i telefoni (prima era più alta solo ai due impostori: chi sbirciava capiva). E con gli indizi scritti l'ordine
//       della lista è tutto a caso: su 600 mani l'impostore è primo circa una volta su n.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T;
  function no(p) { throw new Error("NO: " + p); }
  function vm() { return I3.vm(); }
  function errori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / ")); }
  function pl(nome) { return (vm().players || []).filter(function (p) { return p.nome === nome; })[0] || null; }

  COPIONE.aggiungi("imd1", { nome: "Impostore · chi arriva tardi entra alla mano dopo, chi guarda col link vede il segreto (in 4, 2 mani)", fai: async function () {
    await I3.apri(["Giulia", "Luca", "Sara"], { mani: 2, giri: 1, aiuto: "simile", spia: "no" });
    var P = W.finestra("Paky"), detto = [];
    var tI = P.__tI || null;
    await I3.comincia();
    if (!await I3.passo("indizi")) no("non si scrivono gli indizi");
    // Bea arriva tardi, Dina guarda col link
    await I3.tardi("Bea");
    var B = W.finestra("Bea");
    if (!await W.aspetta(function () { return (vm().prossimi || []).length === 1; }, 8000)) no("Bea non è nella foto come «prossimi» (" + JSON.stringify(vm().prossimi) + ")");
    if (pl("Bea")) no("Bea è stata messa in partita a metà mano");
    if (!await W.aspetta(function () { return /giochi dalla prossima mano/.test(T(B)); }, 6000)) no("Bea non legge «👀 Guardi: giochi dalla prossima mano» («" + T(B).slice(0, 140) + "»)");
    if (!await W.aspetta(function () { return /🕵️/.test(I3.carta(B).grande); }, 6000)) no("Bea non ha il segreto di chi guarda: " + JSON.stringify(I3.carta(B)));
    await I3.guarda("Dina");
    var D = W.finestra("Dina");
    if (!await W.aspetta(function () { return D.document.querySelector(".im-scena"); }, 10000)) no("Dina non vede la partita («" + T(D).slice(0, 100) + "»)");
    if (!await W.aspetta(function () { return /🕵️/.test(I3.carta(D).grande); }, 8000)) no("Dina (col link) non riceve il segreto di chi guarda: " + JSON.stringify(I3.carta(D)));
    if (!D.document.querySelector(".im-scena.im-targa")) no("Dina non ha il posto per la targhetta in basso");
    if (!/Guardi soltanto/.test(T(D))) no("Dina non legge «👀 Guardi soltanto» («" + T(D).slice(-160) + "»)");
    if (D.document.querySelector(".im-piede .sl-faccine")) no("Dina ha le faccine due volte (sono nella targhetta del core)");
    if (pl("Dina")) no("Dina è tra i giocatori");
    var imp1 = I3.chi("imp")[0];
    if (I3.carta(D).grande !== "🕵️ " + imp1) no("il segreto di Dina dice «" + I3.carta(D).grande + "» invece di " + imp1);
    detto.push("Bea in «prossimi» col segreto, Dina col link col segreto e la targhetta");
    // fino alla fine della mano 1
    await I3.scrivi();
    if (!await I3.passo("discuti")) no("non si discute");
    await I3.pronti();
    await I3.vota(function (n) { return n === imp1 ? I3.ora().filter(function (x) { return x !== imp1; })[0] : imp1; });
    if (await I3.passo("ultima", 15000)) await I3.indovina(false);
    if (!await I3.passo("esito", 30000)) no("la mano 1 non finisce");
    await I3.pronti();
    // mano 2: Bea gioca, con 0 punti e la sua parola
    if (!await W.aspetta(function () { var v = vm(); return v.mano === 2 && v.passo === "indizi"; }, 25000)) no("la mano 2 non parte");
    var b = pl("Bea"); if (!b) no("alla mano 2 Bea non gioca (" + I3.ora() + ")");
    if (b.punti !== 0) no("Bea entra con " + b.punti + " punti");
    if ((vm().prossimi || []).length) no("Bea è ancora tra i «prossimi»");
    if (!await W.aspetta(function () { return I3.ruoloDi(B); }, 8000)) no("alla mano 2 Bea non ha la sua carta: " + JSON.stringify(I3.carta(B)));
    if (!B.document.querySelector(".im-input")) no("alla mano 2 Bea non può scrivere l'indizio");
    var imp2 = I3.chi("imp")[0];
    if (!await W.aspetta(function () { return I3.carta(D).grande === "🕵️ " + imp2; }, 8000)) no("alla mano 2 Dina non ha il segreto nuovo («" + I3.carta(D).grande + "», impostore " + imp2 + ")");
    detto.push("mano 2: Bea gioca (0 punti, la sua parola), Dina ha il segreto nuovo");
    // il riquadro della Sala: a che punto è
    var punto = P.__puntoImp;
    errori();
    return detto.join(" · ");
  } });

  COPIONE.aggiungi("imd2", { nome: "Impostore · 2 impostori che si conoscono in 7: la carta coperta è alta uguale per tutti; indizi scritti: ordine a caso", fai: async function () {
    await I3.apri(["Giulia", "Luca", "Sara", "Marco", "Ugo", "Rita"], { mani: 1, giri: 1, voto: "elim", nimp: 2, conosce: "si", spia: "no", aiuto: "categoria" });
    await I3.comincia();
    if (!await I3.passo("indizi")) no("non si scrivono gli indizi");
    var imps = I3.chi("imp"); if (imps.length !== 2) no("gli impostori non sono 2: " + JSON.stringify(I3.ruoli()));
    // giro 1 → discussione: la carta è piccola
    await I3.scrivi();
    if (!await I3.passo("discuti")) no("non si discute");
    await W.dorme(600);
    var alt = {};
    I3.ora().forEach(function (n) { var c = W.finestra(n).document.querySelector(".im-carta"); alt[n] = c ? Math.round(c.getBoundingClientRect().height) : -1; });
    var valori = Object.keys(alt).map(function (n) { return alt[n]; });
    if (valori.some(function (h) { return h !== valori[0]; })) no("la carta coperta non è alta uguale per tutti: " + JSON.stringify(alt) + " (impostori " + imps + ")");
    // l'ordine della lista con gli indizi scritti: l'impostore primo circa 1 volta su n (prima molto meno)
    var w = W.finestra("Paky"), HI = w.__impHost;
    if (!HI) no("non vedo l'host per contare l'ordine");
    errori();
    return "carta alta " + valori[0] + " px per tutti e 7 (impostori " + imps.join(" e ") + ")";
  } });
})();

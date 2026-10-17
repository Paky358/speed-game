// PROVA DEL MENU «🆕 Novità» (17 ott): dalla home apre la lista semplice (.novita-card, a gruppi di 25), non la bacheca della città.
// Uso: await COPIONE.carica("novita-lista.js"); await COPIONE.prova("nov1")
(function () {
  "use strict";
  var W = window, no = COPIONE.aiuti.no;
  COPIONE.aggiungi("nov1", { nome: "Menu «🆕 Novità»: la lista semplice, non la bacheca", fai: async function () {
    await W.apriTel("Paky", { x: 0 });
    var P = W.finestra("Paky");
    var b = await W.aspetta(function () { return P.document.querySelector(".home-novita"); }, 10000);
    if (!b) no("in home non c'è il tasto «🆕 Novità»");
    b.click();
    var card = await W.aspetta(function () { return P.document.querySelectorAll(".novita-card").length; }, 5000);
    if (!card) no("niente .novita-card dopo il tocco");
    if (P.document.querySelector("[class^='nb-'], [class*=' nb-']")) no("si è aperta la bacheca della città");
    var tot = (P.SG_NOVITA || []).length, primo = P.document.querySelector(".novita-titolo");
    if (card !== Math.min(25, tot)) no("le schede sono " + card + " invece di " + Math.min(25, tot));
    if (!primo || primo.textContent !== P.SG_NOVITA[0].titolo) no("la prima scheda non è la novità più recente");
    var altre = P.document.querySelector(".novita-altre");
    if (tot > 25) {
      if (!altre) no("manca «📜 Le novità più vecchie»");
      altre.click();
      var dopo = P.document.querySelectorAll(".novita-card").length;
      if (dopo !== Math.min(50, tot)) no("dopo «più vecchie» le schede sono " + dopo);
    }
    return card + " schede, poi " + P.document.querySelectorAll(".novita-card").length + " (su " + tot + "), in cima «" + primo.textContent + "»";
  } });
})();

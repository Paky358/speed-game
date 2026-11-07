// 🧍 LA SALETTA CON PIÙ SPAZIO PER GLI AVATAR (6 nov 2026, il proprietario: «che cazzo serve chiudere la sala? Occupa solo spazio e il titolo
// poi deve andare sotto… dobbiamo recuperare spazio… si devono vedere bene gli avatar»).
// spz0 (solo foto, sempre OK): la Sala con 8 persone e poi la saletta di un gioco lanciato dalla Sala; restano aperte per le foto.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  var AMICI = ["Giulia", "Luca", "Marco", "Sara", "Anna", "Ugo", "Ivo"];
  async function sala(n) {
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true });
    if (!await W.aspetta(function () { return P.document.querySelector(".home-online"); }, 6000)) no("in home non c'è la riga online");
    W.clicca(P, /Gioca online/, ".home-online button");
    var S = await W.aspetta(function () { return P.document.querySelector(".saletta-schermo") && A.codiceSaletta(P); }, 6000);
    if (!S) no("la Sala non si apre");
    for (var i = 0; i < n; i++) await W.apriTel(AMICI[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true });
    await W.aspetta(function () { return ((A.vm(S).membri) || []).length === n + 1; }, 12000);
    await W.dorme(1500);
    return { P: P, S: S };
  }
  COPIONE.aggiungi("spz0", { nome: "🧍 Foto: la Sala in 8 (resta aperta)", fai: async function () { var o = await sala(7); return "Sala " + o.S + " con " + ((A.vm(o.S).membri) || []).length; } });
  async function lancia() {
    var o = await sala(7), P = o.P;
    if (!await W.aspetta(function () { return W.clicca(P, /Scegli (un|il primo) gioco|Prossimo gioco/); }, 4000)) no("non trovo «Scegli un gioco»");
    var tess = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".tessera"), function (t) { return (t.querySelector("h2") || {}).textContent === (W.__giocoSpz || "Parola d'ordine"); }); }, 4000);
    if (!tess) no("non trovo " + (W.__giocoSpz || "Parola d'ordine"));
    tess.click();
    await W.aspetta(function () { var c = A.codiceSaletta(P); return P.document.querySelector(".saletta-schermo") && c && c !== o.S; }, 8000);
    await W.dorme(2000);
    return "saletta " + A.codiceSaletta(P);
  }
  COPIONE.aggiungi("spz1", { nome: "🧍 Foto: la saletta di Parola d'ordine lanciata dalla Sala in 8 (resta aperta)", fai: lancia });
  COPIONE.aggiungi("spz2", { nome: "🧍 Foto: la saletta della Mini Asta Fantacalcio (nome lungo) dalla Sala in 8 (resta aperta)", fai: async function () {
    W.__giocoSpz = "Mini Asta Fantacalcio"; try { return await lancia(); } finally { W.__giocoSpz = null; }
  } });
})();

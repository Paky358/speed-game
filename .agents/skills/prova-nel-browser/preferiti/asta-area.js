// PROVE DEI POSTI SUI PIAZZATI NELLA GIORNATA DELLA MINI ASTA (16 nov 2026 sera, il proprietario: «queste cose le abbiamo dette un milione di volte»:
// sul calcio d'angolo del Napoli la sua punta stava a centrocampo).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta-area.js"); await COPIONE.prova("pz1")
// Con Edge invisibile: prova.js --porta 8991 --carica preferiti/asta-area.js --prova pz1
//
// pz1 Senza telefoni, tutte le squadre × i piazzati (angolo, punizione laterale e vicina, mischia, palla lunga, ultimo assalto, assedio, rimessa
//     lunga) × 60 semi, coi vostri calciatori messi a caso: chi ATTACCA ha fuori dall'area al massimo 2 giocatori, solo difensori (MAI una punta
//     o un centrocampista, MAI un vostro attaccante o centrocampista); chi DIFENDE ha fuori dall'area al massimo 2 giocatori (la punta); i posti
//     dipendono solo da scena e seme (uguali col gol e con la parata); nelle azioni manovrate i vostri attaccanti di chi attacca al limite dell'area.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  async function motore(w) {
    if (w.SG && w.SG.scaricaGioco) await w.SG.scaricaGioco("asta");
    if (!w.SG_FANTA_CALCIATORI) { w.SGCuore && w.SGCuore.precarica && w.SGCuore.precarica("astafanta"); await W.aspetta(function () { return w.SG_FANTA_CALCIATORI && w.SG_FANTA_SQUADRE; }, 20000); }
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {}, ag = "function costruisciMazzoFanta(n) {";
    if (src.indexOf(ag) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    src = src.replace(ag, "FUORI.piazza = piazzaArea; FUORI.posti = postiModulo; FUORI.titolari = titolariIn; FUORI.AREA = AREA_SC; " + ag);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, F);
    return F;
  }
  COPIONE.aggiungi("pz1", { nome: "Mini Asta, i piazzati: chi attacca tutto in area (dietro al massimo 2 difensori), chi difende tutto in area tranne la punta", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), sq = Object.keys((w.SG_FANTA_SQUADRE || {}).squadre || {}), ko = [], prove = 0, dietro = { D: 0 }, fuoriD = 0;
    var SC = Object.keys(M.AREA);
    if (sq.length < 10) no("le squadre non arrivano");
    function giro(s, att, v, seme, tipo) {
      var posti = M.posti(s, att), asse = M.titolari(s, posti) || [];
      posti.forEach(function (o, i) { if (i && (i * 7 + seme) % 4 === 0) { o.nome = "Vostro" + i; o.kk = asse[i] && asse[i].k; } });   // (qualche vostro, a caso)
      M.piazza(posti, att ? "A" : "D", { v: v, semeC: seme * 7919, attori: [], tipo: tipo }, asse);
      return posti;
    }
    sq.forEach(function (s) {
      SC.forEach(function (v) {
        for (var seme = 1; seme <= 60; seme++) {
          prove++;
          var pA = giro(s, true, v, seme, "gol"), pA2 = giro(s, true, v, seme, "occ"), pD = giro(s, false, v, seme, "gol");
          if (JSON.stringify(pA.map(function (o) { return [o.x, o.y]; })) !== JSON.stringify(pA2.map(function (o) { return [o.x, o.y]; }))) ko.push(s + " " + v + " seme " + seme + ": i posti cambiano col gol o la parata");
          var fA = pA.filter(function (o, i) { return i && o.x < 0.815; }), fD = pD.filter(function (o, i) { return i && o.x < 0.835; });
          if (fA.length > 2) ko.push(s + " " + v + " seme " + seme + ": chi attacca ha " + fA.length + " fuori dall'area");
          fA.forEach(function (o) { dietro[o.ru] = (dietro[o.ru] || 0) + 1; if (o.ru !== "D") ko.push(s + " " + v + " seme " + seme + ": fuori dall'area resta un " + (o.ru === "A" ? "attaccante" : "centrocampista") + (o.nome ? " (vostro)" : "")); });
          if (fD.length > 2) ko.push(s + " " + v + " seme " + seme + ": chi difende ha " + fD.length + " fuori dall'area");
          fuoriD += fD.length;
          if (ko.length > 20) break;
        }
      });
      var pm = giro(s, true, "unodue", 3, "gol"); pm.forEach(function (o, i) { if (i && o.nome && o.ru === "A" && o.x < 0.8) ko.push(s + " unodue: un vostro attaccante lontano dall'area (" + o.x.toFixed(2) + ")"); });
    });
    if (ko.length) no(ko.length + " problemi: " + ko.slice(0, 5).join(" · "));
    return sq.length + " squadre × " + SC.length + " piazzati × 60 semi (" + prove + "): chi attacca fuori dall'area solo difensori (" + (dietro.D || 0) + ", mai punte né centrocampisti), chi difende in media " + (fuoriD / prove).toFixed(2) + " fuori (la punta); posti uguali col gol e con la parata; nelle azioni manovrate i vostri attaccanti al limite dell'area";
  } });
})();

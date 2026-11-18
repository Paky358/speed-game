// PROVA DEL NOME DEL PORTIERE COMPRATO NELLE AZIONI DELLA GIORNATA (18 nov 2026, il proprietario: il portiere comprato che sale in area
// sull'ultimo assalto, quello che segna di testa e quello che esce dalla porta comparivano senza nome e senza colore, «lo dà come un bot»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta-portiere-nome.js"); await COPIONE.prova("pn1")
// Con Edge invisibile: prova.js --porta 8991 --carica preferiti/asta-portiere-nome.js --prova pn1
//
// pn1 Senza telefoni: tutte le scene (azioni con ogni esito, rigori, autogol, cartellini e recuperi) × 60 semi, coi portieri di TUTTE E DUE
//     le squadre comprati: ogni portiere che si muove nell'azione (attori pA e pD) ha il nome e il colore di chi l'ha comprato, anche quando
//     la scena non glielo passa (cartellini, ultimo assalto); nell'ultimo assalto sale il portiere di chi attacca col suo nome; i nomi dei
//     portieri sono uguali in ogni esito della stessa azione (niente spoiler).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  async function motore(w) {
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {}, ag = "function costruisciMazzoFanta(n) {";
    if (src.indexOf(ag) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    if (src.indexOf("function portieriVeri(") < 0) no("nel gioco non c'è portieriVeri");
    src = src.replace(ag, "FUORI.scena = scena; FUORI.portieri = portieriVeri; " + ag);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, F);
    return F;
  }
  function vostri() { return [{ sq: "SQA", ruolo: "P", k: "Portiere A (SQA)", nome: "PortiereA", pr: "Paky", pc: "#ff0000", num: 1 }, { sq: "SQD", ruolo: "P", k: "Portiere D (SQD)", nome: "PortiereD", pr: "Giulia", pc: "#00ff00", num: 12 },
    { sq: "SQA", ruolo: "A", k: "Punta (SQA)", nome: "Punta", pr: "Luca", pc: "#0000ff", num: 9 }]; }
  COPIONE.aggiungi("pn1", { nome: "Fanta, la giornata: il portiere comprato ha il suo nome in ogni scena in cui si muove (ultimo assalto, portiere che segna, uscite, cartellini), uguale in ogni esito", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), ko = [], prove = 0, conta = { pA: 0, pD: 0 }, scenePA = {};
    var SCENE = ["cross", "angolo", "unodue", "contro", "pallonetto", "fuori", "slalom", "punizione", "tapin", "centrocampo", "mischia", "testa", "incrocio", "miracolo", "assedio", "ultimo",
      "secondopalo", "presa", "tuffo", "vuota", "tre", "filtrante", "rasoterra", "giro", "muro", "corta", "volee", "pressing", "laterale", "papera", "glt", "ribattuta", "fuga", "rimessa", "rimessalunga",
      "olimpico", "portiere", "rovesciata"];
    var ESITI = ["gol", "parata", "palo", "traversa", "fuori", "alto", "linea"];
    var tira = { k: "Tiratore (SQA)", nome: "Tiratore", pr: "Luca", pc: "#0000ff" };
    function controlla(sc, qui) {
      sc.attori.forEach(function (a) {
        if (a.sq !== "pA" && a.sq !== "pD") return;
        var voluto = a.sq === "pA" ? "PortiereA" : "PortiereD", n = a.chi && a.chi.nome;
        if (a.sq === "pA" && n === "Tiratore") n = "PortiereA";   // (il portiere che segna: in quel caso chi tira è lui)
        if (n !== voluto) ko.push(qui + ": il portiere " + (a.sq === "pA" ? "di chi attacca" : "di chi difende") + " è «" + (n || "senza nome") + "»");
        else { conta[a.sq]++; if (a.sq === "pA") scenePA[sc.v || sc.tipo] = 1; }
        if (n === voluto && a.chi.pc == null && a.chi !== tira) ko.push(qui + ": il portiere ha il nome ma non il colore");
      });
    }
    function etichette(sc) { return JSON.stringify(sc.attori.filter(function (a) { return a.sq === "pA" || a.sq === "pD"; }).map(function (a) { return [a.sq, a.chi && a.chi.nome || null]; })); }
    function costruisci(tipo, v, es, et, op) { var sc = M.scena(tipo, v, es, null, et, op); M.portieri(sc, vostri(), "SQA", "SQD"); return sc; }
    SCENE.forEach(function (v) {
      for (var seme = 1; seme <= 60; seme++) {
        var op = { verso: 1, lato: seme % 2 ? 1 : -1, seme: seme * 7919, lento: true }, ok = v === "portiere" || v === "olimpico" || v === "rovesciata" ? ["gol"] : ESITI;
        var et = function () { return { tira: v === "portiere" ? { k: "Portiere A (SQA)", nome: "PortiereA", pr: "Paky", pc: "#ff0000" } : tira, passa: null, para: null }; };
        var l = ok.map(function (es) { try { return costruisci(es === "gol" ? "gol" : "occ", v, es, et(), op); } catch (e) { ko.push(v + " " + es + " seme " + seme + ": la scena si rompe (" + e.message + ")"); return null; } }).filter(Boolean);
        prove += l.length;
        l.forEach(function (sc, i) { controlla(sc, v + " " + ok[i] + " seme " + seme); if (etichette(sc) !== etichette(l[0])) ko.push(v + " seme " + seme + ": i nomi dei portieri cambiano tra «" + ok[0] + "» e «" + ok[i] + "» (spoiler)"); });
        if (ko.length > 20) break;
      }
    });
    for (var seme = 1; seme <= 60 && ko.length <= 20; seme++) {
      var op = { verso: 1, lato: seme % 2 ? 1 : -1, seme: seme * 7919, lento: true };
      var rg = ["gol", "parata", "fuori", "palo"].map(function (es) { return costruisci("rig", null, es, { tira: tira, para: null }, op); });
      rg.forEach(function (sc, i) { controlla(sc, "rigore " + i + " seme " + seme); if (etichette(sc) !== etichette(rg[0])) ko.push("rigore seme " + seme + ": i nomi dei portieri cambiano con l'esito"); });
      controlla(costruisci("aut", "cross", "gol", { fallo: tira, para: null }, op), "autogol seme " + seme);
      ["entrata", "tattico", "proteste", "simula", "ultimo", "reazione"].forEach(function (come) {
        ["amm", "esp"].forEach(function (tipo) { var o2 = {}; for (var k in op) o2[k] = op[k]; o2.come = come; try { controlla(costruisci(tipo, null, null, { fallo: tira }, o2), tipo + " " + come + " seme " + seme); } catch (e) { ko.push(tipo + " " + come + ": la scena si rompe (" + e.message + ")"); } });
      });
      prove += 4 + 1 + 12;
    }
    if (ko.length) no(ko.length + " problemi: " + ko.slice(0, 6).join(" · "));
    if (!scenePA.ultimo) no("nell'ultimo assalto non ho visto salire il portiere di chi attacca");
    if (!scenePA.portiere) no("nella scena del portiere che segna non ho visto il portiere di chi attacca");
    return prove + " scene: il portiere di chi difende col suo nome " + conta.pD + " volte, quello di chi attacca " + conta.pA + " volte (" + Object.keys(scenePA).join(", ") + "); stessi nomi in ogni esito";
  } });
})();

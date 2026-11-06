// PROVE DELLE MAGLIE VERE E DELLA GIORNATA DA TV (6 nov 2026, novità v309)
// Uso: prova.js --porta 8981 --carica preferiti/asta.js,preferiti/asta-numeri.js --prova nm1,nm2 --timeout 900
//
// nm1 I numeri di maglia (data/fanta-numeri.js): ogni nome è nel listone, ogni numero è da 1 a 99, mai due uguali nella stessa squadra;
//     la maglia girata si disegna per tutti i 305 calciatori (col numero se c'è, se no col solo nome) e il nome sulla maglia non ha
//     le iniziali del listone (Milinkovic-Savic V. → MILINKOVIC-SAVIC); Yildiz 10, Nico Paz 10, Lautaro 10.
// nm2 🆚 «Contro chi giocano»: con le partite sorteggiate prima (3 giornate) la giornata gioca PROPRIO quelle (casa e fuori), ogni
//     squadra una volta sola per giornata; senza, si sorteggia come prima. Il meteo è lo stesso rifacendo il conto (niente caso).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  async function motore(w) {
    if (w.SG && w.SG.scaricaGioco) await w.SG.scaricaGioco("asta");
    if (!w.SG_FANTA_CALCIATORI) no("il listone del fanta non arriva");
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), fuori = {};
    var aggancio = "function costruisciMazzoFanta(n) {";
    if (src.indexOf(aggancio) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    src = src.replace(aggancio, "FUORI.mazzo = costruisciMazzoFanta; FUORI.giornata = giornataSerieA; FUORI.classifica = classificaFanta; FUORI.coppie = coppieGiornate; FUORI.numero = numeroMaglia; FUORI.meteo = meteoDi; " + aggancio);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, fuori);
    return fuori;
  }
  COPIONE.aggiungi("nm1", { nome: "Fanta: i numeri di maglia veri e la maglia girata", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), N = w.SG_FANTA_NUMERI, L = w.SG_FANTA_CALCIATORI, ko = [];
    if (!N) no("data/fanta-numeri.js non arriva col gioco");
    var tutti = []; Object.keys(L).forEach(function (r) { Object.keys(L[r]).forEach(function (f) { L[r][f].forEach(function (s) { tutti.push(s); }); }); });
    var visti = {};
    Object.keys(N).forEach(function (k) {
      if (tutti.indexOf(k) < 0) ko.push("non è nel listone: " + k);
      var n = typeof N[k] === "number" ? N[k] : N[k][0], sq = k.replace(/^.*\((.*)\)$/, "$1");
      if (!(n >= 1 && n <= 99 && n === Math.round(n))) ko.push("numero strano: " + k + " " + n);
      if (visti[sq + "#" + n]) ko.push("due " + n + " nella " + sq + ": " + visti[sq + "#" + n] + " e " + k); visti[sq + "#" + n] = k;
    });
    var Ar = w.SGAstaArte; if (!Ar || !Ar.magliaRetro) no("manca la maglia girata");
    var senza = 0;
    tutti.forEach(function (s) {
      var m = /^(.*) \((.*)\)$/.exec(s), c = { nome: m[1], squadra: m[2] }, x = M.numero(c), svg = Ar.magliaRetro(c.squadra, x.n, x.nome);
      if (!/^<svg[\s\S]*<\/svg>$/.test(svg)) ko.push("maglia rotta: " + s);
      if (x.n == null) senza++;
      if (/\b[A-Z][a-z]?\.$/.test(x.nome) || /\s[A-Z]{1,2}\.$/.test(x.nome)) ko.push("iniziale sulla maglia: " + s + " → " + x.nome);
      if (x.n != null && svg.indexOf(">" + x.n + "</text>") < 0) ko.push("numero non disegnato: " + s);
    });
    [["Yildiz", "Juventus", 10], ["Paz N.", "Como", 10], ["Martinez L.", "Inter", 10]].forEach(function (y) { var x = M.numero({ nome: y[0], squadra: y[1] }); if (x.n !== y[2]) ko.push(y[0] + " ha il " + x.n); });
    if (M.numero({ nome: "Milinkovic-Savic V.", squadra: "Napoli" }).nome !== "MILINKOVIC-SAVIC") ko.push("Milinkovic-Savic: " + M.numero({ nome: "Milinkovic-Savic V.", squadra: "Napoli" }).nome);
    if (ko.length) no(ko.slice(0, 8).join(" | "));
    return Object.keys(N).length + " numeri su " + tutti.length + " calciatori (senza numero: " + senza + "), nessun doppione, 305 maglie girate disegnate";
  } });
  COPIONE.aggiungi("nm2", { nome: "Fanta: 🆚 le partite sorteggiate all'inizio dell'asta sono quelle della giornata; il meteo non cambia", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), ko = [];
    for (var i = 0; i < 60 && ko.length < 6; i++) {
      var n = 2 + (i % 5), m = M.mazzo(n), per = { P: [], D: [], C: [], A: [] }, gioc = [];
      m.forEach(function (c) { per[c.ruolo].push(c); });
      for (var k = 0; k < n; k++) gioc.push({ id: "g" + k, nome: "G" + k, crediti: 0, kit: [per.P[k], per.D[k], per.C[2 * k], per.C[2 * k + 1], per.A[k]].filter(Boolean) });
      var tre = i % 2 === 0, cp = M.coppie(tre ? 3 : 1), sA = {};
      if (cp.length !== (tre ? 3 : 1)) ko.push("giornate sorteggiate: " + cp.length);
      M.classifica(gioc, sA, tre ? 3 : 1, cp);
      var giornate = tre ? sA.prima.concat([sA]) : [sA];
      giornate.forEach(function (B, gi) {
        var att = cp[gi].map(function (c) { return c[0] + "-" + c[1]; }).join(","), vere = B.partite.map(function (P) { return P.c + "-" + P.f; }).join(",");
        if (att !== vere) ko.push("giornata " + (gi + 1) + ": sorteggio " + att.slice(0, 40) + " ≠ giocate " + vere.slice(0, 40));
        var sq = {}; B.partite.forEach(function (P) { sq[P.c] = (sq[P.c] || 0) + 1; sq[P.f] = (sq[P.f] || 0) + 1; });
        if (Object.keys(sq).some(function (s) { return sq[s] !== 1; })) ko.push("una squadra gioca due volte");
        B.partite.forEach(function (P) { if (M.meteo(P, gi) !== M.meteo(P, gi)) ko.push("meteo a caso"); });
      });
    }
    var met = {}; for (var j = 0; j < 400; j++) { var mm = M.meteo({ c: "S" + j, f: "T" + (j * 7) }, j % 3); met[mm] = (met[mm] || 0) + 1; }
    if (!met.pioggia || !met.nebbia || !met.neve || met.sole < 250) ko.push("meteo sbilanciato " + JSON.stringify(met));
    if (ko.length) no(ko.join(" | "));
    return "60 partite con le giornate sorteggiate prima: giocate proprio quelle; meteo su 400 partite " + JSON.stringify(met);
  } });
})();

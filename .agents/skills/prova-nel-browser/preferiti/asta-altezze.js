// PROVE DELL'ALTEZZA NEI GOL DELLA MINI ASTA (15 nov 2026, il proprietario: «l'altezza conta nei colpi di testa… nessuno si deve lamentare,
// dobbiamo fare un lavoro eccezionale»; «se esce Wesley e si legge "il gigante salta di testa", la gente si lamenta»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta-altezze.js"); await COPIONE.prova("al1")
// Con Edge invisibile: prova.js --porta 8991 --carica preferiti/asta-altezze.js --prova al1,al2
//
// al1 Senza telefoni, 1.200 giornate con 6 rose a caso: chi è alto (da 188 cm) segna di testa molto più spesso di chi è basso (fino a 176 cm);
//     ANTI-SPOILER: per i vostri calciatori, alti, medi e bassi, un tiro di testa e un tiro di piede finiscono in gol più o meno con la stessa
//     frequenza (il colpo di testa del gigante NON vuol dire gol: tanti di testa finiscono fuori o parati); i difensori fanno tra 7 e 12 gol
//     su 100 e quelli alti più della loro parte.
// al2 Le frasi del gol: quelle sull'altezza («svetta», «sovrasta», «stacco imperioso»…) escono SOLO per chi è alto davvero (da 188 cm, ALTO_CM),
//     mai per uno basso (Wesley, 175 cm); le frasi normali non parlano mai di altezza.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  var TESTA = { cross: 1, angolo: 1, secondopalo: 1, presa: 1, tuffo: 1, laterale: 1, rimessa: 1, rimessalunga: 1, testa: 1, ultimo: 1, portiere: 1 };
  var ALTEZZA = /svett|sovrast|imperios|gigant|torre|più alto|piu alto|statura|colosso/i;
  async function motore() {   // il file del gioco con le funzioni di dentro portate fuori (solo per la prova), dentro un telefono
    var w = await W.apriTel("Paky", { x: 0 });
    w.SGCuore.precarica("astafanta");
    if (!await W.aspetta(function () { return w.SG_FANTA_CALCIATORI && w.SG_FANTA_SQUADRE && w.SG_FANTA_STATISTICHE && w.SG_FANTA_ALTEZZE; }, 20000)) no("i dati del fanta (con le altezze) non arrivano");
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {}, ag = "  function costruisciMazzoFanta(n) {";
    if (src.indexOf(ag) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    src = src.replace(ag, "FUORI.cl = classificaFanta; FUORI.frasi = function () { return { g: FRASI_GOL, a: FRASI_ALTO, f: fraseGolDi, alto: ALTO_CM }; };\n" + ag);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, F);
    F.w = w; return F;
  }
  function rose(w, n) {   // n rose da 5 senza doppioni, un portiere per squadra
    var L = w.SG_FANTA_CALCIATORI, Q = (w.SG_FANTA_QUOTAZIONI || {}).valori || {}, pool = {};
    "PDCA".split("").forEach(function (r) { pool[r] = []; ["A", "B", "C"].forEach(function (t) { (L[r][t] || []).forEach(function (k) { var m = /^(.*) \((.*)\)$/.exec(k); pool[r].push({ nome: m[1], squadra: m[2], ruolo: r, q: Q[k] }); }); }); });
    var usati = {}, sqP = {}, out = [];
    for (var i = 0; i < n; i++) {
      var kit = [];
      ["P", "D", "C", "C", "A"].forEach(function (r) { var c, g = 0; do { c = pool[r][Math.floor(Math.random() * pool[r].length)]; g++; } while ((usati[c.nome + c.squadra] || (r === "P" && sqP[c.squadra])) && g < 500); usati[c.nome + c.squadra] = 1; if (r === "P") sqP[c.squadra] = 1; kit.push(c); });
      out.push({ id: "g" + i, nome: "G" + i, crediti: 0, kit: kit });
    }
    return out;
  }
  function key(c) { return c.nome + " (" + c.squadra + ")"; }
  function pc(a, b) { return b ? Math.round(a / b * 1000) / 10 : 0; }

  COPIONE.aggiungi("al1", { nome: "Mini Asta, l'altezza nei gol: gli alti più spesso di testa, i bassi di piede; di testa e di piede gol con la stessa frequenza (niente spoiler); i difensori alti", fai: async function () {
    var F = await motore(), w = F.w, H = w.SG_FANTA_ALTEZZE, L = w.SG_FANTA_CALCIATORI, RU = {};
    "PDCA".split("").forEach(function (r) { Object.keys(L[r]).forEach(function (t) { (L[r][t] || []).forEach(function (k) { RU[k] = r; }); }); });
    function cl(k) { var c = H[k] || 183; return c >= 188 ? "alti" : c <= 176 ? "bassi" : "medi"; }
    var tes = {}, tir = {}, rG = {}, dAlti = 0, dTot = 0, N = 1200;
    for (var i = 0; i < N; i++) {
      var g = rose(w, 6), SA = {}; F.cl(g, SA, 1, null);
      var miei = {}; g.forEach(function (x) { x.kit.forEach(function (c) { miei[key(c)] = c; }); });
      (SA.partite || []).forEach(function (P) { P.ev.forEach(function (e) {
        if ((e.t === "gol" || e.t === "rig") && RU[e.chi]) { rG[RU[e.chi]] = (rG[RU[e.chi]] || 0) + 1; if (RU[e.chi] === "D") { dTot++; if ((H[e.chi] || 0) >= 188) dAlti++; } }
        if (e.t === "gol" && RU[e.chi]) { var z = tes[cl(e.chi)] = tes[cl(e.chi)] || [0, 0]; z[TESTA[e.v] ? 0 : 1]++; }
        if ((e.t === "gol" || e.t === "occ") && miei[e.chi]) { var q = tir[cl(e.chi) + (TESTA[e.v] ? "|testa" : "|piede")] = tir[cl(e.chi) + (TESTA[e.v] ? "|testa" : "|piede")] || [0, 0]; q[e.t === "gol" ? 0 : 1]++; }
      }); });
    }
    var x = [], ht = {}; ["alti", "medi", "bassi"].forEach(function (k) { var z = tes[k] || [0, 0]; ht[k] = pc(z[0], z[0] + z[1]); });
    x.push("gol di testa: alti " + ht.alti + "%, medi " + ht.medi + "%, bassi " + ht.bassi + "%");
    if (!(ht.alti > ht.medi && ht.medi > ht.bassi)) no("di testa gli alti non segnano più dei medi e i medi più dei bassi (" + x[0] + ")");
    if (ht.alti - ht.bassi < 20) no("tra alti e bassi la differenza di gol di testa è troppo piccola (" + x[0] + ")");
    var sp = [];
    ["alti", "medi", "bassi"].forEach(function (k) {
      var t = tir[k + "|testa"] || [0, 0], p = tir[k + "|piede"] || [0, 0], gt = pc(t[0], t[0] + t[1]), gp = pc(p[0], p[0] + p[1]);
      sp.push(k + " " + gt + "% di testa / " + gp + "% di piede (" + (t[0] + t[1]) + " e " + (p[0] + p[1]) + " tiri)");
      if (t[0] + t[1] < 200) no("troppo pochi tiri di testa dei vostri " + k + " per dire qualcosa (" + (t[0] + t[1]) + ")");
      if (Math.abs(gt - gp) > 6) no("SPOILER: per i vostri " + k + " un tiro di testa e uno di piede finiscono in gol troppo diversamente (" + gt + "% e " + gp + "%)");
      if (gt > 40) no("SPOILER: il colpo di testa dei vostri " + k + " è gol " + gt + " volte su 100");
    });
    x.push("i vostri, gol su 100 tiri: " + sp.join(" · "));
    var tot = (rG.A || 0) + (rG.C || 0) + (rG.D || 0) + (rG.P || 0), qd = pc(rG.D || 0, tot);
    var dL = []; Object.keys(L.D).forEach(function (t) { (L.D[t] || []).forEach(function (k) { dL.push(k); }); });
    var parte = pc(dL.filter(function (k) { return (H[k] || 0) >= 188; }).length, dL.length), qa = pc(dAlti, dTot);
    x.push("difensori " + qd + "% dei gol; dei loro gol " + qa + "% li fanno quelli da 188 cm in su (sono il " + parte + "% dei difensori)");
    if (qd < 7 || qd > 12) no("i difensori fanno " + qd + " gol su 100 (voluti tra 7 e 12)");
    if (qa <= parte + 3) no("i difensori alti non segnano più della loro parte (" + qa + "% dei gol, sono il " + parte + "%)");
    return x.join(" · ");
  } });

  COPIONE.aggiungi("al2", { nome: "Mini Asta, le frasi del gol: quelle sull'altezza solo per chi è alto davvero (mai per Wesley), le altre non parlano di altezza", fai: async function () {
    var F = await motore(), w = F.w, H = w.SG_FANTA_ALTEZZE, Fr = F.frasi(), x = [];
    if (!(Fr.alto >= 185)) no("la soglia delle frasi sull'altezza è " + Fr.alto + " cm");
    Object.keys(Fr.g).forEach(function (k) { (Fr.g[k] || []).forEach(function (t) { if (ALTEZZA.test(t)) no("una frase normale parla di altezza: «" + t + "» (" + k + ")"); }); });
    var alte = []; Object.keys(Fr.a).forEach(function (k) { (Fr.a[k] || []).forEach(function (t) { alte.push(t); }); });
    if (alte.length < 6) no("troppo poche frasi per gli alti (" + alte.length + ")");
    var bassi = Object.keys(H).filter(function (k) { return H[k] < Fr.alto; }), alti = Object.keys(H).filter(function (k) { return H[k] >= Fr.alto; });
    if (H["Wesley (Roma)"] == null || H["Wesley (Roma)"] >= Fr.alto) no("Wesley non è tra i bassi (" + H["Wesley (Roma)"] + ")");
    var visteAlte = 0, prove = 0;
    Object.keys(Fr.a).forEach(function (kind) {
      for (var s = 0; s < 60; s++) {
        bassi.forEach(function (k) { var t = Fr.f(kind, s * 7919 + 3, k); prove++; if (alte.indexOf(t) >= 0 || ALTEZZA.test(t)) no("a " + k + " (" + H[k] + " cm) esce «" + t + "»"); });
        alti.forEach(function (k) { var t = Fr.f(kind, s * 7919 + 3, k); if (alte.indexOf(t) >= 0) visteAlte++; });
      }
    });
    if (!visteAlte) no("le frasi per gli alti non escono mai");
    x.push(prove + " frasi a " + bassi.length + " calciatori sotto " + Fr.alto + " cm: nessuna parla di altezza (Wesley compreso)");
    x.push("ai " + alti.length + " da " + Fr.alto + " cm in su: " + visteAlte + " frasi sull'altezza");
    return x.join(" · ");
  } });
})();

// quanto vale ogni gioco a premi (e l'Offerta): media dei punti, e quanto conta essere bravi.
// node premi-giusti.js [volte] ['{"PLINKO":[...]}'] [giochi separati da virgola]
var S = require("./sim-prezzo.js"), N = +process.argv[2] || 6000;
var C = S.variante(process.argv[3] ? JSON.parse(process.argv[3]) : {});
var sk = [0.15, 0.3, 0.3, 0.45];
var giochi = (process.argv[4] || "piuomeno,alpinista,ordine,troppo,plinko,offerta").split(",");
console.log("gioco      | media a testa | bravo (0,15) | medio (0,30) | scarso (0,45) | scarto tipico | il bravo fa più dello scarso");
giochi.forEach(function (k) {
  var somme = sk.map(function () { return 0; }), batte = 0, tot = 0, tt = 0;
  for (var i = 0; i < N; i++) {
    var G = S.nuovaPuntata(sk);
    if (k === "offerta") S.offerta(G, C, 1 + (i % 2)); else S.PREMI[k](G, C);
    var pt = G.pl.map(function (p) { var x = G.pt[p.id]; return x.offerte + x.premi + x.plinko; });
    pt.forEach(function (v, j) { somme[j] += v; tot += v; tt += v * v; });
    if (pt[0] > pt[3]) batte++; else if (pt[0] === pt[3]) batte += 0.5;
  }
  var m = tot / N / sk.length, sd = Math.sqrt(tt / N / sk.length - m * m);
  console.log(k.padEnd(10) + " | " + String(Math.round(m)).padStart(13) + " | " + String(Math.round(somme[0] / N)).padStart(12) + " | " + String(Math.round((somme[1] + somme[2]) / 2 / N)).padStart(12) + " | " + String(Math.round(somme[3] / N)).padStart(13) + " | " + String(Math.round(sd)).padStart(13) + " | " + (100 * batte / N).toFixed(0) + "%");
});

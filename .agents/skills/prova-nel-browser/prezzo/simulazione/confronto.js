// OGGI contro la proposta, in tutte le durate e con 2, 4, 6 e 8 giocatori: node confronto.js [puntate]
var S = require("./sim-prezzo.js"), N = +process.argv[2] || 12000, v = S.variante;
var PROP = { ALP_BASE: 550, ALP_PASSO: 15, ALP_MIN: 100, ORD_POSTO: 70, TROPPO: [600, 450, 350, 250], TROPPO_DOPO: 150, TROPPO_PRIMA: [200, 100], PLINKO: [10, 25, 50, 0, 200, 0, 50, 25, 10], PL_GIUSTA: 50,
  RUOTA: [200, 100, 50], BONUS_CENTO: 300, SPIN_100: 300, SPIN_5: 150, SCALA_V: [450, 225, 110], BONUS_TUTTO: 1000, TUTTO_PCT: 0.03 };
var CASI = [
  ["📺 Puntata", 3, [0.15, 0.3, 0.3, 0.45]],
  ["📺 Puntata", 3, [0.3, 0.3]],
  ["📺 Puntata (tutti uguali)", 3, [0.3, 0.3, 0.3, 0.3]],
  ["📺 Puntata", 3, [0.2, 0.3, 0.3, 0.3, 0.4, 0.45]],
  ["📺 Puntata", 3, [0.15, 0.2, 0.3, 0.3, 0.3, 0.35, 0.4, 0.45]],
  ["⚡ Veloce", 2, [0.15, 0.3, 0.3, 0.45]],
  ["🌙 Serata lunga", 4, [0.15, 0.3, 0.3, 0.45]]
];
var pc = function (x) { return (100 * x).toFixed(0) + "%"; };
console.log("caso | il più bravo vince | primo dopo le manche vince | ultimo vince | fortuna decide | Vetrina decide | CENTO decide (se c'è) | quota finale | punti a testa");
CASI.forEach(function (c) {
  [["oggi", v({ GIRI: c[1] })], ["proposta", v(Object.assign({ GIRI: c[1] }, PROP))]].forEach(function (x) {
    var r = S.prova(x[0], x[1], c[2], N, true);
    console.log(c[0] + " in " + c[2].length + " · " + x[0] + " | " + pc(r.vinte[0]) + " | " + pc(r.primoDopo) + " | " + pc(r.ultimoVince) + " | " + pc(r.decideFort) + " | " + pc(r.decideVet) + " | " + pc(r.centoSeCe) + " | " + pc(r.quotaFinale) + " | " + Math.round(r.mediaTesta));
  });
});

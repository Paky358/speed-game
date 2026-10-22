// cerca i numeri migliori per Ruota e Vetrina, coi giochi a premi già pareggiati: node cerca.js [puntate]
var S = require("./sim-prezzo.js"), N = +process.argv[2] || 4000;
var PREMI = { ALP_BASE: 550, ALP_PASSO: 15, ALP_MIN: 100, ORD_POSTO: 70, TROPPO: [600, 450, 350, 250], TROPPO_DOPO: 150, TROPPO_PRIMA: [250, 100],
  PLINKO: [10, 25, 50, 0, 200, 0, 50, 25, 10], PL_GIUSTA: 50 };
var righe = [];
function conf(o) { return S.variante(Object.assign({}, PREMI, o)); }
var casi = [{ nome: "OGGI (premi vecchi)", c: S.OGGI }, { nome: "premi pari + Ruota/Vetrina di oggi", c: conf({}) }];
[[300, 150, 75], [200, 100, 50]].forEach(function (ru) {
  [300, 500].forEach(function (ce) {
    [[600, 300, 150], [450, 225, 110]].forEach(function (ve) {
      [1000, 750, 500].forEach(function (tu) {
        [0.05, 0.03].forEach(function (pct) {
          casi.push({ nome: "Ruota " + ru[0] + " CENTO+" + ce + " · Vetrina " + ve[0] + " TUTTO+" + tu + " entro " + (pct * 100) + "%",
            c: conf({ RUOTA: ru, BONUS_CENTO: ce, SPIN_100: ce, SPIN_5: ce / 2, SCALA_V: ve, BONUS_TUTTO: tu, TUTTO_PCT: pct }) });
        });
      });
    });
  });
});
var pc = function (x) { return (100 * x).toFixed(0).padStart(3); };
console.log("4 misti: bravo | primo-dopo-manche | ultimo | fortuna | vetrina | cento || 6 misti: bravo | primo | fortuna | vetrina || quota finale | TUTTO a puntata");
casi.forEach(function (k) {
  var a = S.prova(k.nome, k.c, [0.15, 0.3, 0.3, 0.45], N, true), b = S.prova(k.nome, k.c, [0.2, 0.3, 0.3, 0.3, 0.4, 0.45], N, true);
  var voto = a.vinte[0] + a.primoDopo + b.vinte[0] + b.primoDopo;
  righe.push({ k: k.nome, voto: voto, t: [a.vinte[0], a.primoDopo, a.ultimoVince, a.decideFort, a.decideVet, a.centoSeCe].map(pc).join(" ") + " || " + [b.vinte[0], b.primoDopo, b.decideFort, b.decideVet].map(pc).join(" ") + " || " + pc(a.quotaFinale) + "% " + a.tutto.toFixed(2) });
  console.log(righe[righe.length - 1].t + "  " + k.nome);
});

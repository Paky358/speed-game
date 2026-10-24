// I giochi a premi del file d (23 ott 2026): «🎲 Il Gioco dei Dadi» e «🎯 Il Mirino», simulati coi giocatori finti di
// premi-nuovi.js per decidere i punti: in media circa 300 a testa (bravo + 2 medi + scarso, diviso 4), chi conosce i prezzi
// fa di più, chi tira a caso sta sotto. Le regole sono COPIATE da js/games/prezzo-premi-d.js: se cambiano là, vanno
// cambiate anche qui.
//   node premi-d-sim.js [volte]
var fs = require("fs"), path = require("path"), SG = path.resolve(__dirname, "../../../../..");
global.window = {};
fs.readdirSync(path.join(SG, "data")).filter(function (f) { return /^prezzo-\d+\.js$/.test(f); }).forEach(function (f) { eval(fs.readFileSync(path.join(SG, "data", f), "utf8")); });
var PROD = window.SG_PREZZO.prodotti, N = +process.argv[2] || 20000;
function gauss() { var u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function stima(p, s) { return p * Math.exp(gauss() * s); }
function tondo2(v) { return Math.round((+v || 0) * 100) / 100; }
function intero(p) { return +p.prezzo > 0 && Math.abs(p.prezzo - Math.round(p.prezzo)) < 1e-9; }
var SK = { bravo: 0.15, medio: 0.3, scarso: 0.45 };

// =====================================================================
// 🎲 IL GIOCO DEI DADI: un prezzo intero di 4 cifre; per ogni cifra un dado (1-6) uguale per tutti; si dice se la cifra
//    vera è ⬆️ più alta, = uguale o ⬇️ più bassa del dado (sulla prima cifra col dado a 1 «più bassa» non si può dire)
// =====================================================================
var DADI = PROD.filter(function (x) { return intero(x) && x.prezzo >= 1000 && x.prezzo <= 9999; });
function giusta(cifra, dado) { return cifra > dado ? "su" : cifra === dado ? "ug" : "giu"; }
function possibili(i, dado) { return i === 0 && dado === 1 ? ["su", "ug"] : ["su", "ug", "giu"]; }
// il giocatore «ingenuo»: prende la sua idea del prezzo (arrotondata a 10, come i prezzi veri) e la confronta coi dadi
function ingenuo(p, dadi, s) {
  var e = Math.max(1000, Math.min(9999, Math.round(stima(p, s) / 10) * 10)), c = String(e).split("").map(Number);
  return dadi.map(function (d, i) { return giusta(c[i], d); });
}
// il giocatore che «ragiona»: non è sicuro della sua idea (sbaglia di ±s), pensa a tanti prezzi possibili (che finiscono con
// 0, a volte con 9, come i prezzi veri) e per ogni cifra sceglie la risposta che va bene più spesso
function ragiona(p, dadi, s) {
  var e = stima(p, s), voti = dadi.map(function () { return { su: 0, ug: 0, giu: 0 }; });
  for (var k = 0; k < 120; k++) {
    var c = Math.round(e * Math.exp(gauss() * s) / 10) * 10; if (Math.random() < 0.25) c -= 1;
    c = Math.max(1000, Math.min(9999, c));
    String(c).split("").map(Number).forEach(function (x, i) { voti[i][giusta(x, dadi[i])]++; });
  }
  return dadi.map(function (d, i) { var v = voti[i], l = possibili(i, d); return l.sort(function (a, b) { return v[b] - v[a]; })[0]; });
}
function aCaso(p, dadi) { return dadi.map(function (d, i) { var l = possibili(i, d); return l[Math.floor(Math.random() * l.length)]; }); }
// C(giuste, cifre, ok) → punti (ok[i] = la cifra i è giusta)
function giocaDadi(chi, s, C) {
  var p = DADI[Math.floor(Math.random() * DADI.length)].prezzo, dadi = [0, 0, 0, 0].map(function () { return 1 + Math.floor(Math.random() * 6); });
  var cif = String(p).split("").map(Number), sc = chi(p, dadi, s), n = 0, ok = [];
  sc.forEach(function (x, i) { ok[i] = x === giusta(cif[i], dadi[i]); if (ok[i]) n++; });
  return { pt: C(n, 4, ok), pieno: n === 4 };
}

// =====================================================================
// 🎯 IL MIRINO: una scala da A a B (numeri tondi), il prezzo da qualche parte tra il 10% e il 90%; una finestrella larga
//    il 10% della scala sale dal basso; ognuno la ferma una volta. Distanza = quanto il prezzo sta fuori dalla finestrella,
//    in parti della scala. La scala: f (dove sta il prezzo, tra 0,1 e 0,9) e t (dove comincia: A = t × larghezza, t tra 0,15
//    e 0,5) si scelgono a caso e NON dipendono l'uno dall'altro, così dalla scala non si capisce dove sta il prezzo
//    (con una larghezza fissa, per esempio 1,6 volte il prezzo, la larghezza diceva il prezzo e il prezzo stava sempre in basso)
// =====================================================================
var MI = { fMin: 0.1, fMax: 0.9, tMin: 0.15, tMax: 0.5, largo: 0.1, passo: 0.005 };
var MIRINO = PROD.filter(function (x) { return x.prezzo >= 30 && x.prezzo <= 30000; });
// il numero tondo più vicino (1; 1,2; 1,5; 2; 2,5; 3; 4; 5; 6; 8 per una potenza di 10)
var TONDI = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
function tondo(x) {
  var k = Math.pow(10, Math.floor(Math.log(x) / Math.LN10 + 1e-9)), m = x / k, best = 1;
  TONDI.forEach(function (v) { if (Math.abs(Math.log(m / v)) < Math.abs(Math.log(m / best))) best = v; });
  return best * k;
}
// la scala da A a B: larghezza tonda, A multiplo di u (un decimo della potenza di 10 della larghezza) e mai 0
function scala(prezzo, rnd, tt) {
  var tMin = tt ? tt[0] : MI.tMin, tMax = tt ? tt[1] : MI.tMax;
  for (var k = 0; k < 80; k++) {
    var f = MI.fMin + rnd() * (MI.fMax - MI.fMin), t = tMin * Math.pow(tMax / tMin, rnd()), span = tondo(prezzo / (t + f)), u = Math.pow(10, Math.floor(Math.log(span) / Math.LN10 + 1e-9) - 1);
    var a = Math.round(t * span / u) * u, ff = (prezzo - a) / span;
    if (a >= u - 1e-9 && ff >= MI.fMin - 1e-9 && ff <= MI.fMax + 1e-9) return { a: tondo2(a), b: tondo2(a + span) };
  }
  var sp = tondo(prezzo * 1.25), u2 = Math.pow(10, Math.floor(Math.log(sp) / Math.LN10 + 1e-9) - 1), a2 = Math.max(u2, Math.round((prezzo - sp / 2) / u2) * u2);
  return { a: tondo2(a2), b: tondo2(a2 + sp) };
}
function distanza(prezzo, sc, p) { var span = sc.b - sc.a, lo = sc.a + p * span, hi = lo + MI.largo * span; return prezzo >= lo - 1e-9 && prezzo <= hi + 1e-9 ? 0 : Math.min(Math.abs(prezzo - lo), Math.abs(prezzo - hi)) / span; }
function ferma(p) { return Math.max(0, Math.min(1 - MI.largo, Math.round(p / MI.passo) * MI.passo)); }
// «mira»: mette la sua idea a metà della finestrella (con un po' di ritardo o anticipo del dito: ±0,2 s su 16,5)
function mira(prezzo, sc, s) { var e = stima(prezzo, s); return ferma((e - sc.a) / (sc.b - sc.a) - MI.largo / 2 + gauss() * 0.011); }
// «ragiona»: come «mira», ma tira la sua idea verso la metà della scala quanto meno è sicuro (come chi sa di non sapere)
function ragionaM(prezzo, sc, s) {
  var e = stima(prezzo, s), span = sc.b - sc.a, fr = (e - sc.a) / span, sd = s * prezzo / span, w = 0.0533 / (0.0533 + sd * sd);
  return ferma(w * fr + (1 - w) * 0.5 - MI.largo / 2 + gauss() * 0.011);
}
function giocaMirino(chi, s, C, r) {
  var prezzo = MIRINO[Math.floor(Math.random() * MIRINO.length)].prezzo, sc = scala(prezzo, Math.random, r);
  var p = chi === "caso" ? ferma(Math.random() * (1 - MI.largo)) : chi === "meta" ? ferma(0.45) : chi === "cima" ? 1 - MI.largo : chi === "ragiona" ? ragionaM(prezzo, sc, s) : mira(prezzo, sc, s);
  var d = distanza(prezzo, sc, p);
  return { pt: C(d), pieno: d === 0 };
}

// ---------------- il conto ----------------
function riga(nome, fn) {
  var tipi = ["bravo", "medio", "scarso"], m = {}, zero = {}, pieno = {};
  tipi.forEach(function (t) { var s = 0, z = 0, pz = 0; for (var i = 0; i < N; i++) { var x = fn(SK[t]); s += x.pt; if (!x.pt) z++; if (x.pieno) pz++; } m[t] = Math.round(s / N); zero[t] = Math.round(100 * z / N); pieno[t] = Math.round(100 * pz / N); });
  var media = Math.round((m.bravo + 2 * m.medio + m.scarso) / 4);
  console.log(nome.padEnd(58) + " media " + String(media).padStart(4) + " · bravo " + m.bravo + " · medio " + m.medio + " · scarso " + m.scarso +
    " · a zero " + zero.bravo + "/" + zero.medio + "/" + zero.scarso + "% · pieno " + pieno.bravo + "/" + pieno.medio + "/" + pieno.scarso + "%");
  return media;
}
function solo(nome, fn) { var s = 0, z = 0, pz = 0; for (var i = 0; i < N; i++) { var x = fn(); s += x.pt; if (!x.pt) z++; if (x.pieno) pz++; } console.log(("   " + nome).padEnd(58) + " media " + String(Math.round(s / N)).padStart(4) + " · a zero " + Math.round(100 * z / N) + "% · pieno " + (Math.round(1000 * pz / N) / 10) + "%"); }

module.exports = { giusta: giusta, possibili: possibili, scala: scala, distanza: distanza, tondo: tondo, MI: MI };
if (require.main === module) {
  console.log("prezzi per i Dadi (interi 1.000-9.999 €): " + DADI.length + " · per il Mirino (30-30.000 €): " + MIRINO.length + " · " + N + " partite a testa\n");
  console.log("🎲 IL GIOCO DEI DADI");
  var CD = [
    ["GIOCO: prima 200, le altre 60, +150 tutte", function (n, c, ok) { return (ok[0] ? 200 : 0) + 60 * (n - (ok[0] ? 1 : 0)) + (n === 4 ? 150 : 0); }],
    ["75 a cifra, +300 tutte", function (n) { return 75 * n + (n === 4 ? 300 : 0); }],
    ["2→100, 3→250, 4→600", function (n) { return [0, 0, 100, 250, 600][n]; }],
    ["prima 150, le altre 50, +200 tutte", function (n, c, ok) { return (ok[0] ? 150 : 0) + 50 * (n - (ok[0] ? 1 : 0)) + (n === 4 ? 200 : 0); }],
    ["prima 200, le altre 50, +150 tutte", function (n, c, ok) { return (ok[0] ? 200 : 0) + 50 * (n - (ok[0] ? 1 : 0)) + (n === 4 ? 150 : 0); }],
    ["prima 150, le altre 60, +250 tutte", function (n, c, ok) { return (ok[0] ? 150 : 0) + 60 * (n - (ok[0] ? 1 : 0)) + (n === 4 ? 250 : 0); }]
  ];
  CD.forEach(function (c) {
    riga("Dadi " + c[0] + " (ingenuo)", function (s) { return giocaDadi(ingenuo, s, c[1]); });
    riga("Dadi " + c[0] + " (ragiona)", function (s) { return giocaDadi(ragiona, s, c[1]); });
    solo("a caso", function () { return giocaDadi(aCaso, 0, c[1]); });
  });
  console.log("\n🎯 IL MIRINO");
  var CM = [
    ["GIOCO: dentro 600, 0,05 → 350, 0,1 → 200, 0,2 → 75", function (d) { return d === 0 ? 600 : d <= 0.05 ? 350 : d <= 0.1 ? 200 : d <= 0.2 ? 75 : 0; }],
    ["dentro 600, 0,05 → 300, 0,1 → 150, 0,2 → 50", function (d) { return d === 0 ? 600 : d <= 0.05 ? 300 : d <= 0.1 ? 150 : d <= 0.2 ? 50 : 0; }],
    ["dentro 500, 0,05 → 250, 0,1 → 100", function (d) { return d === 0 ? 500 : d <= 0.05 ? 250 : d <= 0.1 ? 100 : 0; }]
  ];
  [[0.15, 0.5], [0.2, 0.6]].forEach(function (r) {
    console.log("  la scala comincia a t = " + r.join("-") + " volte la sua larghezza" + (r[0] === MI.tMin ? " (quella del gioco)" : ""));
    CM.forEach(function (c) {
      riga("Mirino " + c[0] + " (mira)", function (s) { return giocaMirino("mira", s, c[1], r); });
      riga("Mirino " + c[0] + " (ragiona)", function (s) { return giocaMirino("ragiona", s, c[1], r); });
      solo("a caso (ferma quando capita)", function () { return giocaMirino("caso", 0, c[1], r); });
      solo("sempre a metà scala", function () { return giocaMirino("meta", 0, c[1], r); });
    });
  });
}

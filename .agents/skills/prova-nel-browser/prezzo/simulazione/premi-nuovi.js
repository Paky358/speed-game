// I giochi a premi nuovi del 23 ott 2026 («🛒 La Spesa» e «🎱 Il Gioco dell'8»), simulati coi giocatori finti di sim-prezzo.js
// per decidere i punti (media circa 300 a testa come gli altri giochi a premi, e chi conosce i prezzi deve fare di più).
// node premi-nuovi.js [volte]
var fs = require("fs"), path = require("path"), SG = path.resolve(__dirname, "../../../../..");
global.window = {};
fs.readdirSync(path.join(SG, "data")).filter(function (f) { return /^prezzo-\d+\.js$/.test(f); }).forEach(function (f) { eval(fs.readFileSync(path.join(SG, "data", f), "utf8")); });
var PROD = window.SG_PREZZO.prodotti, N = +process.argv[2] || 20000;
function gauss() { var u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function stima(p, s) { return p * Math.exp(gauss() * s); }
function mescola(a) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = b[i]; b[i] = b[j]; b[j] = x; } return b; }
var SPESA = PROD.filter(function (x) { return x.cat === "spesa" && x.prezzo >= 0.5 && x.prezzo <= 8; });
var CINQUE = PROD.filter(function (x) { return x.prezzo >= 10000 && x.prezzo < 100000 && x.prezzo === Math.round(x.prezzo); });

// ---- 🛒 La Spesa: 5 prodotti, le quantità (0-9) per spendere tra MIN e MAX senza vedere i prezzi ----
function spesa(s, C) {
  var cinque = mescola(SPESA).slice(0, 5), est = cinque.map(function (x) { return stima(x.prezzo, s); }), q = [0, 0, 0, 0, 0], tot = 0;
  var mira = (C.MIN + C.MAX) / 2;
  for (var giri = 0; giri < 60; giri++) {
    var i = Math.floor(Math.random() * 5);
    if (q[i] < 9 && tot + est[i] <= mira + 0.5) { q[i]++; tot += est[i]; }
    if (tot >= C.MIN + 0.3) break;
  }
  var T = cinque.reduce(function (a, x, i) { return a + x.prezzo * q[i]; }, 0);
  return C.PUNTI_SPESA(T);
}
// ---- 🎱 Il Gioco dell'8: un prezzo di 5 cifre, la prima si vede; le altre 4 una alla volta (dopo ognuna si scopre quella vera);
//      ogni gettone perso = 1 di differenza tra la cifra detta e quella vera; si parte con 8 gettoni ----
function otto(s, C) {
  var p = CINQUE[Math.floor(Math.random() * CINQUE.length)].prezzo, cif = String(p).split("").map(Number);
  var e = stima(p, s), passo = s < 0.2 ? 100 : 500;   // chi conosce poco pensa a cifre tonde
  e = Math.round(e / passo) * passo;
  var persi = 0, pref = cif[0];
  for (var k = 1; k < 5; k++) {
    var span = Math.pow(10, 5 - k), lo = pref * span, hi = (pref + 1) * span - 1;
    // migliaia e centinaia: dalla sua idea (se sta fuori dalle cifre già scoperte, a metà: 15.500, non 15.999);
    // decine e unità: come finiscono di solito i prezzi (0, a volte 90/99 o 50)
    var c = e >= lo && e <= hi ? e : lo + span / 2, g;
    if (k <= 2) g = Number(String(Math.round(c)).padStart(5, "0")[k]);
    else if (k === 3) { var r = Math.random(); g = s < 0.2 && e >= lo && e <= hi ? Number(String(Math.round(e)).padStart(5, "0")[k]) : r < 0.6 ? 0 : r < 0.85 ? 9 : 5; }
    else g = Math.random() < 0.85 ? 0 : 9;
    persi += Math.abs(g - cif[k]);
    pref = pref * 10 + cif[k];
  }
  return C.PUNTI_OTTO(C.GETTONI - persi);
}
function prova(nome, fn, C) {
  var sk = [0.15, 0.3, 0.45], som = [0, 0, 0], q = [0, 0, 0], zero = [0, 0, 0];
  for (var i = 0; i < N; i++) sk.forEach(function (s, j) { var v = fn(s, C); som[j] += v; q[j] += v * v; if (!v) zero[j]++; });
  var m = som.map(function (x) { return Math.round(x / N); }), media = Math.round((m[0] + 2 * m[1] + m[2]) / 4);
  console.log(nome.padEnd(46) + " media " + String(media).padStart(4) + " · bravo " + m[0] + " · medio " + m[1] + " · scarso " + m[2] + " · a zero: " + zero.map(function (z) { return Math.round(100 * z / N) + "%"; }).join("/"));
}
module.exports = { spesa: spesa, otto: otto };
if (require.main === module) {
  [
    ["Spesa 450 in fascia, 250 vicino, 100 lontano", { MIN: 20, MAX: 22, PUNTI_SPESA: function (T) { return T >= 20 && T <= 22 ? 450 : (T >= 18 && T < 20) || (T > 22 && T <= 23) ? 250 : T >= 15 && T < 18 ? 100 : 0; } }],
    ["Spesa 500 in fascia, 300 vicino, 150 lontano", { MIN: 20, MAX: 22, PUNTI_SPESA: function (T) { return T >= 20 && T <= 22 ? 500 : (T >= 18 && T < 20) || (T > 22 && T <= 23) ? 300 : (T >= 15 && T < 18) || (T > 23 && T <= 25) ? 150 : 0; } }],
    ["Spesa 600 fascia, 350 a 1,5 €, 200 a 4 €", { MIN: 20, MAX: 22, PUNTI_SPESA: function (T) { var d = T < 20 ? 20 - T : T > 22 ? T - 22 : 0; return d === 0 ? 600 : d <= 1.5 ? 350 : d <= 4 ? 200 : d <= 7 ? 75 : 0; } }]
  ].forEach(function (x) { prova(x[0], spesa, x[1]); });
  [
    ["Otto: 8 gettoni, 150 + 50 a gettone (8 = 600)", { GETTONI: 8, PUNTI_OTTO: function (r) { return r < 0 ? 0 : r === 8 ? 600 : 150 + 50 * r; } }],
    ["Otto: 8 gettoni, 75 a gettone", { GETTONI: 8, PUNTI_OTTO: function (r) { return r <= 0 ? 0 : 75 * r; } }],
    ["Otto: 10 gettoni, 60 a gettone", { GETTONI: 10, PUNTI_OTTO: function (r) { return r <= 0 ? 0 : 60 * r; } }],
    ["Otto: 12 gettoni, 50 a gettone", { GETTONI: 12, PUNTI_OTTO: function (r) { return r <= 0 ? 0 : 50 * r; } }],
    ["Otto: 10 gettoni, 100 + 50 a gettone", { GETTONI: 10, PUNTI_OTTO: function (r) { return r < 0 ? 0 : 100 + 50 * r; } }]
  ].forEach(function (x) { prova(x[0], otto, x[1]); });
}

// ---- 🔐 La Cassaforte: le cifre del prezzo mescolate, da rimettere in ordine (la prima mai 0) ----
function permUniche(c) {
  var out = {}, n = c.length;
  (function giro(pref, resto) {
    if (!resto.length) { if (pref[0] !== 0) out[pref.join("")] = 1; return; }
    for (var i = 0; i < resto.length; i++) { if (resto.indexOf(resto[i]) < i) continue; giro(pref.concat([resto[i]]), resto.slice(0, i).concat(resto.slice(i + 1))); }
  })([], c);
  return Object.keys(out);
}
function cassaforte(s, C) {
  var lista = C.LISTA || CINQUE, p = lista[Math.floor(Math.random() * lista.length)].prezzo, vero = String(p), cif = vero.split("").map(Number);
  var e = stima(p, s), ok = permUniche(cif);
  // sceglie il numero più vicino alla sua idea; a parità (o quasi) preferisce quelli che finiscono con 0
  ok.sort(function (a, b) { var da = Math.abs(+a - e) * (a.slice(-1) === "0" ? 0.9 : 1), db = Math.abs(+b - e) * (b.slice(-1) === "0" ? 0.9 : 1); return da - db; });
  var mio = ok[0], giuste = 0;
  for (var i = 0; i < vero.length; i++) if (mio[i] === vero[i]) giuste++;
  return C.PUNTI_CASSA(giuste, vero.length);
}
if (require.main === module) {
  var QUATTRO = PROD.filter(function (x) { return x.prezzo >= 1000 && x.prezzo < 10000 && x.prezzo === Math.round(x.prezzo); });
  var TRE = PROD.filter(function (x) { return x.prezzo >= 100 && x.prezzo < 1000 && x.prezzo === Math.round(x.prezzo); });
  [
    ["Cassa 5 cifre: 100 a cifra giusta, +200 aperta", { PUNTI_CASSA: function (g, n) { return 100 * g + (g === n ? 200 : 0); } }],
    ["Cassa 4 cifre: 100 a cifra, +200 aperta", { LISTA: QUATTRO, PUNTI_CASSA: function (g, n) { return 100 * g + (g === n ? 200 : 0); } }],
    ["Cassa 3 cifre: 100 a cifra, +200 aperta", { LISTA: TRE, PUNTI_CASSA: function (g, n) { return 100 * g + (g === n ? 200 : 0); } }],
    ["Cassa 4 cifre: 75 a cifra, +300 aperta", { LISTA: QUATTRO, PUNTI_CASSA: function (g, n) { return 75 * g + (g === n ? 300 : 0); } }]
  ].forEach(function (x) { prova(x[0], cassaforte, x[1]); });
  console.log("prezzi: 5 cifre " + CINQUE.length + ", 4 cifre " + QUATTRO.length + ", 3 cifre " + TRE.length);
}
if (require.main === module) {
  var varie = function (x) { var c = String(x.prezzo); return new Set(c.split("")).size >= 3; };
  var Q45 = PROD.filter(function (x) { return x.prezzo >= 1000 && x.prezzo < 100000 && x.prezzo === Math.round(x.prezzo) && varie(x); });
  console.log("\nprezzi da 4-5 cifre con almeno 3 cifre diverse: " + Q45.length);
  [
    ["Cassa 4-5 varie: 100 a cifra, +200 aperta", { LISTA: Q45, PUNTI_CASSA: function (g, n) { return 100 * g + (g === n ? 200 : 0); } }],
    ["Cassa 4-5 varie: 50 a cifra, +400 aperta", { LISTA: Q45, PUNTI_CASSA: function (g, n) { return 50 * g + (g === n ? 400 : 0); } }],
    ["Cassa 4-5 varie: 60 a cifra, +350 aperta", { LISTA: Q45, PUNTI_CASSA: function (g, n) { return 60 * g + (g === n ? 350 : 0); } }],
    ["Cassa 4-5 varie: aperta 600, una sbagliata 250", { LISTA: Q45, PUNTI_CASSA: function (g, n) { return g === n ? 600 : g >= n - 2 ? 250 : g >= 2 ? 100 : 0; } }]
  ].forEach(function (x) { prova(x[0], cassaforte, x[1]); });
}
if (require.main === module) {
  // i prezzi che usa davvero il gioco (23 ott): 4-5 cifre, almeno 3 diverse, nessuna più di 2 volte
  var rip = function (s) { var o = {}, m = 0; s.split("").forEach(function (c) { o[c] = (o[c] || 0) + 1; m = Math.max(m, o[c]); }); return m; };
  var GIOCO = PROD.filter(function (x) { var s = String(x.prezzo); return x.prezzo === Math.round(x.prezzo) && /^\d{4,5}$/.test(s) && new Set(s.split("")).size >= 3 && rip(s) <= 2; });
  console.log("\nprezzi del gioco: " + GIOCO.length);
  prova("Cassa del gioco: 50 a cifra, +400 aperta", cassaforte, { LISTA: GIOCO, PUNTI_CASSA: function (g, n) { return 50 * g + (g === n ? 400 : 0); } });
  prova("Cassa del gioco: 60 a cifra, +400 aperta", cassaforte, { LISTA: GIOCO, PUNTI_CASSA: function (g, n) { return 60 * g + (g === n ? 400 : 0); } });
}

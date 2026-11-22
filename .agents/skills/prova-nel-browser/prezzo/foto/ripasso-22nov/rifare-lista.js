// rifare-<nome>.json: le voci da rifare (voti.json esito rifare, più quelle dubbie dell'occhio) tra da e a, coi suggerimenti di ricerca dei verificatori
// node rifare-lista.js nome da a
var fs = require("fs"), nome = process.argv[2], da = +process.argv[3], a = +process.argv[4];
var v = JSON.parse(fs.readFileSync("voti.json", "utf8")), t = JSON.parse(fs.readFileSync("tutte.json", "utf8")), by = {}; t.forEach(function (x) { by[x.n] = x; });
var out = Object.keys(v).map(Number).filter(function (n) { var x = v[n]; return n >= da && n <= a && (x.esito === "rifare" || (x.esito === "dubbi" && x.mio)); }).sort(function (p, q) { return p - q; }).map(function (n) {
  var x = by[n], y = v[n];
  return { n: n, id: x.id, nome: x.nome, desc: x.desc, dove: x.dove, cat: x.cat, prezzo: x.prezzo, ora: x.path, w: x.w,
    problema: (y.mio ? "occhio: " + y.mio + " · " : "") + y.voti.filter(function (z) { return z.voto !== "tieni"; }).map(function (z) { return z.perche; }).join(" · "),
    cercare: y.voti.map(function (z) { return z.cercare; }).filter(Boolean) };
});
fs.writeFileSync("rifare-" + nome + ".json", JSON.stringify(out, null, 1));
console.log(out.length + " da rifare");

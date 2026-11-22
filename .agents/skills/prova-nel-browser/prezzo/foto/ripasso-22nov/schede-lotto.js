// Per ogni foglio di scelta di un lotto scrive scelte/<L>/sNNN.json = { foglio, voci: [{ n, nome, desc, dove, prezzo, cat, problema, haOra, candidate: [{ i, file, w, h }] }] }
// node schede-lotto.js L lotto.json candidati.json[+altri]
var fs = require("fs"), path = require("path");
function J(f) { return JSON.parse(fs.readFileSync(f, "utf8")); }
var L = process.argv[2], lotto = J(process.argv[3]), cand = {}; process.argv[4].split("+").forEach(function (f) { if (fs.existsSync(f)) Object.assign(cand, J(f)); });
var t = J("tutte.json"), by = {}; t.forEach(function (x) { by[x.n] = x; });
var dir = path.join("scelte", L), ind = J(path.join(dir, "indice.json")), lb = {}; lotto.forEach(function (x) { lb[x.n] = x; });
ind.forEach(function (f, i) {
  var voci = f.n.map(function (n) { var x = by[n], y = lb[n];
    return { n: n, nome: x.nome, desc: x.desc, dove: x.dove, prezzo: x.prezzo, cat: x.cat, problema: y.problema || "", haOra: !!y.ora,
      candidate: (cand[x.id] || []).map(function (k, j) { return { i: j + 1, file: k.path.split("/").pop(), w: k.w, h: k.h }; }) }; });
  fs.writeFileSync(path.join(dir, "s" + String(i + 1).padStart(3, "0") + ".json"), JSON.stringify({ foglio: path.resolve(f.foglio).replace(/\\/g, "/"), voci: voci }, null, 1));
});
console.log(ind.length + " schede in " + dir);

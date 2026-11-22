// Prepara i gruppi per gli aiutanti del ripasso: gruppi/gNN.json = { fogli: [png], voci: [{ n, id, cat, prezzo, nome, desc, dove }] }
// node gruppi.js cartella-fogli [fogli per gruppo = 2]
var fs = require("fs"), path = require("path");
var DIR = process.argv[2] || "fogli", PER = +process.argv[3] || 2, G0 = +process.argv[4] || 0;
var indice = JSON.parse(fs.readFileSync(path.join(DIR, "indice.json"), "utf8")), tutte = JSON.parse(fs.readFileSync("tutte.json", "utf8")), by = {};
tutte.forEach(function (x) { by[x.n] = x; });
fs.mkdirSync("gruppi", { recursive: true });
var g = G0;
for (var i = 0; i < indice.length; i += PER) {
  var pezzo = indice.slice(i, i + PER), voci = [];
  pezzo.forEach(function (f) { f.n.forEach(function (n) { var x = by[n]; voci.push({ n: n, id: x.id, cat: x.cat, prezzo: x.prezzo, nome: x.nome, desc: x.desc, dove: x.dove }); }); });
  g++;
  fs.writeFileSync(path.join("gruppi", "g" + String(g).padStart(2, "0") + ".json"), JSON.stringify({ fogli: pezzo.map(function (f) { return path.resolve(f.foglio).replace(/\\/g, "/"); }), voci: voci }, null, 1));
}
console.log(g + " gruppi");

// gruppi per la verifica: un file per foglio grande. node vgruppi.js cartella-fogli lista.json prefisso
var fs = require("fs"), path = require("path");
var ind = JSON.parse(fs.readFileSync(path.join(process.argv[2], "indice.json"), "utf8")), v = JSON.parse(fs.readFileSync(process.argv[3], "utf8")), pre = process.argv[4], by = {};
v.forEach(function (x) { by[x.n] = x; });
fs.mkdirSync("vgruppi", { recursive: true });
ind.forEach(function (f, i) {
  fs.writeFileSync("vgruppi/" + pre + "-" + String(i + 1).padStart(2, "0") + ".json", JSON.stringify({ foglio: path.resolve(f.foglio).replace(/\\/g, "/"),
    voci: f.n.map(function (n) { var x = by[n]; return { n: n, nome: x.nome, desc: x.desc, dove: x.dove, prezzo: x.prezzo, cat: x.cat, segnalazioni: x.problema }; }) }, null, 1));
});
console.log(ind.length + " gruppi " + pre);

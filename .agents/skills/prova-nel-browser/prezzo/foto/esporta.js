// Primo passo: l'elenco di tutti i prodotti e dei pezzi delle vetrine (elenco.json), dai file data/prezzo-*.js.
// node esporta.js
var fs = require("fs"), path = require("path"), SG = path.resolve(__dirname, "../../../../.."); global.window = {};
fs.readdirSync(path.join(SG, "data")).filter(function (f) { return /^prezzo-\d+\.js$/.test(f); }).forEach(function (f) { eval(fs.readFileSync(path.join(SG, "data", f), "utf8")); });
var d = window.SG_PREZZO, out = [];
d.prodotti.forEach(function (p) { out.push({ id: p.id, nome: p.nome, desc: p.desc || "", dove: p.dove || "", cat: p.cat, e: p.e, prezzo: p.prezzo }); });
d.vetrine.forEach(function (v) { v.pezzi.forEach(function (x, i) { out.push({ id: v.id + "#" + i, nome: x.nome, desc: x.desc || "", dove: "vetrina «" + v.titolo + "»", cat: "vetrina", e: x.e, prezzo: x.prezzo }); }); });
fs.writeFileSync(path.join(__dirname, "elenco.json"), JSON.stringify(out));
console.log("voci: " + out.length);

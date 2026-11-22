// tutte.json: ogni prodotto e pezzo di vetrina con la foto di oggi (o null). node tutte.js D:/SG-prezzo
var fs = require("fs"), path = require("path"), SG = process.argv[2] || "D:/SG-prezzo"; global.window = {};
fs.readdirSync(path.join(SG, "data")).filter(function (f) { return /^prezzo-\d+\.js$/.test(f); }).sort().forEach(function (f) { eval(fs.readFileSync(path.join(SG, "data", f), "utf8")); });
eval(fs.readFileSync(path.join(SG, "data/prezzo-foto.js"), "utf8"));
var d = window.SG_PREZZO, F = window.SG_PREZZO_FOTO, out = [], n = 0;
function foto(id) { var f = F[id]; if (!f) return { path: null, w: 0, loc: null }; if (/^loc:/.test(f)) return { path: null, w: 0, loc: f.slice(4) }; var s = f.split("|"); return { path: s[0], w: +s[1] || 0, loc: null }; }
d.prodotti.forEach(function (p) { var f = foto(p.id); out.push({ n: ++n, id: p.id, nome: p.nome, desc: p.desc || "", dove: p.dove || "", cat: p.cat, e: p.e, prezzo: p.prezzo, path: f.path, w: f.w, loc: f.loc }); });
d.vetrine.forEach(function (v) { v.pezzi.forEach(function (x, i) { var f = foto(v.id + "#" + i); out.push({ n: ++n, id: v.id + "#" + i, nome: x.nome, desc: x.desc || "", dove: "vetrina «" + v.titolo + "»", cat: "vetrina", e: x.e, prezzo: x.prezzo, path: f.path, w: f.w, loc: f.loc }); }); });
fs.writeFileSync("tutte.json", JSON.stringify(out));
var conta = {}; out.forEach(function (x) { var c = conta[x.cat] = conta[x.cat] || { tot: 0, foto: 0, loc: 0, senza: 0 }; c.tot++; if (x.path) c.foto++; else if (x.loc) c.loc++; else c.senza++; });
console.log(out.length + " voci"); console.log(conta);
var chiavi = Object.keys(F), ids = {}; out.forEach(function (x) { ids[x.id] = 1; }); console.log("foto: " + chiavi.length + ", senza voce: " + chiavi.filter(function (k) { return !ids[k]; }).length);

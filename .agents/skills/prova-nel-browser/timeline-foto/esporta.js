// elenco.json: le carte della Linea del tempo delle categorie chieste (id = "cat|titolo"), con anno e spiegazione
// node esporta.js storia,invenzioni      (e le parti per gli aiutanti: parte1.json … parte4.json)
var fs = require("fs"), vm = require("vm"), path = require("path");
var SG = "C:/Users/joetr/Desktop/SG", ctx = { window: {} }; vm.createContext(ctx);
fs.readdirSync(path.join(SG, "data")).filter(function (f) { return /^eventi-.*\.js$/.test(f); }).forEach(function (f) { vm.runInContext(fs.readFileSync(path.join(SG, "data", f), "utf8"), ctx); });
var cats = (process.argv[2] || "").split(","), out = [], n = 0, parti = +process.argv[3] || 4;
(ctx.window.SG_CATEGORIE || []).forEach(function (c) {
  if (cats[0] && cats.indexOf(c.id) < 0) return;
  c.eventi.forEach(function (e) { out.push({ id: c.id + "|" + e.titolo, n: ++n, cat: c.id, nome: e.titolo, desc: e.fatto || "", dove: "", anno: e.anno }); });
});
fs.writeFileSync("elenco.json", JSON.stringify(out));
var q = Math.ceil(out.length / parti);
for (var i = 0; i < parti; i++) fs.writeFileSync("parte" + (i + 1) + ".json", JSON.stringify(out.slice(i * q, (i + 1) * q).map(function (x) { return { id: x.id, anno: x.anno, titolo: x.nome, fatto: x.desc }; }), null, 1));
console.log(out.length + " carte, " + parti + " parti da " + q);

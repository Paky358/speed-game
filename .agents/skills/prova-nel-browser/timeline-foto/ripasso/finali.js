// mette insieme tutte le scelte: [{ n, id, cat, nome, anno, vecchia, nuova, w, tipo: "nuova"|"cambiata"|"tolta" }]
var fs = require("fs"), J = function (f) { return JSON.parse(fs.readFileSync(f, "utf8")); };
var tutte = J("tutte.json"), by = {}; tutte.forEach(function (x) { by[x.n] = x; });
var gruppi = [ ["scelte-mancanti-n.json", "candidati-mancanti.json"], ["scelte-rifare.json", "candidati-rifare.json"], ["scelte-m2.json", "candidati-mancanti2.json"], ["scelte-r5.json", "candidati-rifare2.json"] ];
var out = {}, come = [];
gruppi.forEach(function (g) {
  var s = J(g[0]), c = J(g[1]);
  Object.keys(s).forEach(function (n) {
    var v = s[n], x = by[n]; if (!x) throw "carta " + n;
    if (v === 0) return;
    if (v === "togli") { out[n] = { n: +n, id: x.id, cat: x.cat, nome: x.nome, anno: x.anno, vecchia: x.path, nuova: null, w: 0, tipo: "tolta" }; return; }
    if (typeof v === "string" && v.indexOf("come:") === 0) { come.push([n, +v.slice(5)]); return; }
    var k = (c[x.id] || [])[v - 1]; if (!k) throw "manca la candidata " + v + " di " + n + " " + x.nome;
    out[n] = { n: +n, id: x.id, cat: x.cat, nome: x.nome, anno: x.anno, vecchia: x.path, nuova: k.path, w: k.w, tipo: x.path ? "cambiata" : "nuova" };
  });
});
come.forEach(function (p) { var n = p[0], m = p[1], x = by[n], src = out[m] ? { path: out[m].nuova, w: out[m].w } : { path: by[m].path, w: by[m].w };
  out[n] = { n: +n, id: x.id, cat: x.cat, nome: x.nome, anno: x.anno, vecchia: x.path, nuova: src.path, w: src.w, tipo: x.path ? "cambiata" : "nuova", come: m }; });
var lista = Object.keys(out).map(function (k) { return out[k]; }).sort(function (a, b) { return a.n - b.n; });
fs.writeFileSync("finali.json", JSON.stringify(lista, null, 1));
var conta = {}; lista.forEach(function (x) { var c = conta[x.cat] = conta[x.cat] || { cambiate: 0, nuove: 0, tolte: 0 }; c[x.tipo === "cambiata" ? "cambiate" : x.tipo === "nuova" ? "nuove" : "tolte"]++; });
console.log(lista.length + " cambi"); console.log(JSON.stringify(conta));
// per il foglio di controllo: le carte con la foto NUOVA al posto di path
fs.writeFileSync("controllo.json", JSON.stringify(lista.filter(function (x) { return x.nuova; }).map(function (x, i) { return { n: x.n, id: x.id, cat: x.cat, nome: x.nome, anno: x.anno, desc: "", path: x.nuova, w: x.w }; })));
// mancano miniature?
var path = require("path"), crypto = require("crypto");
var senza = lista.filter(function (x) { return x.nuova && !fs.existsSync(path.join("mini", crypto.createHash("md5").update(x.nuova).digest("hex").slice(0, 16) + ".img")); });
console.log("senza miniatura: " + senza.map(function (x) { return x.n; }).join(","));

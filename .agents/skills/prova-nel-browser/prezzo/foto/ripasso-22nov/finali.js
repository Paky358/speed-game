// Mette insieme le scelte: finali.json = [{ n, id, cat, nome, prezzo, vecchia, nuova, w, tipo: "nuova"|"cambiata"|"tolta", motivo }]
// node finali.js scelte-a.json:candidati-a.json [scelte-b.json:candidati-b.json …]
// scelte = { numero voce: numero candidata (1…) | 0 = lascia com'è | "togli" | "come:N" = la stessa foto (nuova o di oggi) della voce N }
// motivi: motivi.json = { numero voce: "perché non convinceva" } (dal ripasso)
var fs = require("fs"), path = require("path"), crypto = require("crypto"), J = function (f) { return JSON.parse(fs.readFileSync(f, "utf8")); };
var tutte = J("tutte.json"), by = {}; tutte.forEach(function (x) { by[x.n] = x; });
var motivi = fs.existsSync("motivi.json") ? J("motivi.json") : {};
var out = {}, come = [];
process.argv.slice(2).forEach(function (g) {
  var ss = g.split(":"), s = J(ss[0]), c = J(ss[1]);
  Object.keys(s).forEach(function (n) {
    var v = s[n], x = by[n]; if (!x) throw new Error("voce " + n);
    if (x.loc) throw new Error("foto del proprietario, non si tocca: " + n);
    delete out[n];
    if (v === 0) return;
    var base = { n: +n, id: x.id, cat: x.cat, nome: x.nome, prezzo: x.prezzo, vecchia: x.path, motivo: motivi[n] || (x.path ? "" : "non aveva la foto") };
    if (v === "togli") { if (!x.path) return; out[n] = Object.assign(base, { nuova: null, w: 0, tipo: "tolta" }); return; }
    if (typeof v === "string" && v.indexOf("come:") === 0) { come.push([n, +v.slice(5), base]); return; }
    var k = (c[x.id] || [])[v - 1]; if (!k) throw new Error("manca la candidata " + v + " di " + n + " " + x.nome);
    if (k.path === x.path) return;
    out[n] = Object.assign(base, { nuova: k.path, w: k.w, tipo: x.path ? "cambiata" : "nuova" });
  });
});
come.forEach(function (p) { var n = p[0], m = p[1], x = by[n], src = out[m] ? { path: out[m].nuova, w: out[m].w } : { path: by[m].path, w: by[m].w };
  if (!src.path) throw new Error("come:" + m + " senza foto");
  out[n] = Object.assign(p[2], { nuova: src.path, w: src.w, tipo: x.path ? "cambiata" : "nuova", come: m }); });
var lista = Object.keys(out).map(function (k) { return out[k]; }).sort(function (a, b) { return a.n - b.n; });
fs.writeFileSync("finali.json", JSON.stringify(lista, null, 1));
var conta = {}; lista.forEach(function (x) { var c = conta[x.cat] = conta[x.cat] || { cambiate: 0, nuove: 0, tolte: 0 }; c[x.tipo === "cambiata" ? "cambiate" : x.tipo === "nuova" ? "nuove" : "tolte"]++; });
console.log(lista.length + " cambi"); console.log(JSON.stringify(conta));
fs.writeFileSync("controllo.json", JSON.stringify(lista.filter(function (x) { return x.nuova; }).map(function (x) { var t = by[x.n]; return { n: x.n, id: x.id, cat: x.cat, nome: x.nome, desc: t.desc, dove: t.dove, prezzo: x.prezzo, path: x.nuova, w: x.w }; })));
var senza = lista.filter(function (x) { return x.nuova && !fs.existsSync(path.join("mini", crypto.createHash("md5").update(x.nuova).digest("hex").slice(0, 16) + ".img")); });
console.log("senza miniatura: " + senza.map(function (x) { return x.n; }).join(","));

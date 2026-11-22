// Dal risultato del workflow di scelta (journal) a scelte-<nome>.json = { n: candidata | 0 | "togli" } e scelte-<nome>-perche.json
// node scelte-da-flusso.js nome output-del-task.json   (il file .output del task, che contiene { esiti })
var fs = require("fs");
var nome = process.argv[2], testo = fs.readFileSync(process.argv[3], "utf8");
var i = testo.indexOf("{"), j = testo.lastIndexOf("}"), o = JSON.parse(testo.slice(i, j + 1));
var es = o.esiti || (o.result && o.result.esiti) || [];
var out = {}, perche = {}, conta = { nuove: 0, tieni: 0, togli: 0, arbitro: 0, senza: 0 };
es.forEach(function (e) { (e.scelte || []).forEach(function (x) { out[x.n] = x.scelta === -1 ? "togli" : x.scelta; perche[x.n] = { come: x.come, perche: x.perche, a: x.a, b: x.b };
  if (x.scelta > 0) conta.nuove++; else if (x.scelta === -1) conta.togli++; else conta.tieni++; if (x.come === "arbitro") conta.arbitro++; });
  conta.senza += (e.senza || []).length; });
fs.writeFileSync("scelte-" + nome + ".json", JSON.stringify(out, null, 1));
fs.writeFileSync("scelte-" + nome + "-perche.json", JSON.stringify(perche, null, 1));
console.log(JSON.stringify(conta));

// conta i voti della verifica (journal dei workflow) → voti.json = { n: { voti: [{lente, voto, perche, cercare}], punti, mio } }
// cambia = 2, meglio = 1, tieni = 0; l'occhio di Claude conta +1. rifare = punti >= 3; dubbi = punti 2.
// node voti.js journal1 [journal2 …]
var fs = require("fs"), out = fs.existsSync("voti.json") ? JSON.parse(fs.readFileSync("voti.json", "utf8")) : {};
var mio = {}; fs.readdirSync(".").filter(function (f) { return /^occhio-\d+\.json$/.test(f); }).forEach(function (f) { var o = JSON.parse(fs.readFileSync(f, "utf8")); Object.keys(o).forEach(function (n) { mio[n] = o[n]; }); });
process.argv.slice(2).forEach(function (f) {
  var lab = {};
  fs.readFileSync(f, "utf8").split("\n").forEach(function (r) { if (!r.trim()) return; var o = JSON.parse(r);
    if (o.type === "started") lab[o.key] = o.label;
    if (o.type === "result" && o.result && o.result.voci) { var L = (lab[o.key] || "?").split(":")[1];
      o.result.voci.forEach(function (v) { var x = out[v.n] = out[v.n] || { voti: [] }; x.voti = x.voti.filter(function (y) { return y.lente !== L; }); x.voti.push({ lente: L, voto: v.voto, perche: v.perche, cercare: v.cercare || "" }); }); } });
});
var P = { cambia: 2, meglio: 1, tieni: 0 }, conta = { rifare: 0, dubbi: 0, tieni: 0 };
Object.keys(out).forEach(function (n) { var x = out[n]; x.mio = mio[n] || null; x.punti = x.voti.reduce(function (s, v) { return s + P[v.voto]; }, 0) + (mio[n] ? 1 : 0);
  x.esito = x.punti >= 3 ? "rifare" : x.punti === 2 ? "dubbi" : "tieni"; conta[x.esito]++; });
fs.writeFileSync("voti.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(conta));

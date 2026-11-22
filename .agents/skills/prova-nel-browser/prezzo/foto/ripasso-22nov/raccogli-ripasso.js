// mette insieme le segnalazioni dei journal dei workflow: segnalate.json = { n: [{ lente, motivo, spiegazione, forte }] }
var fs = require("fs"), out = fs.existsSync("segnalate.json") ? JSON.parse(fs.readFileSync("segnalate.json", "utf8")) : {};
var visti = {};
process.argv.slice(2).forEach(function (f) {
  var lab = {};
  fs.readFileSync(f, "utf8").split("\n").forEach(function (r) { if (!r.trim()) return; var o = JSON.parse(r);
    if (o.type === "started") lab[o.key] = o.label;
    if (o.type === "result" && o.result && o.result.segnalate) { var L = lab[o.key] || "?"; visti[L] = o.result.viste;
      o.result.segnalate.forEach(function (s) { var a = out[s.n] = out[s.n] || []; if (!a.some(function (x) { return x.lente === L; })) a.push({ lente: L, motivo: s.motivo, spiegazione: s.spiegazione, forte: s.forte }); }); } });
});
fs.writeFileSync("segnalate.json", JSON.stringify(out, null, 1));
console.log("voci segnalate: " + Object.keys(out).length, JSON.stringify(visti));

// Mette insieme le scelte degli aiutanti (n → scelta, riserva, sicuro, cerca) in scelte.json ({ id: { s, r, sicuro, cerca } })
// e scrive da-scaricare.json (solo la scelta di ogni prodotto, per scarica.js).
// node unisci-scelte.js candidati.json risultato-workflow.output [altri .output…]
var fs = require("fs");
var elenco = require("./elenco.json"), cand = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
var S = fs.existsSync("scelte.json") ? JSON.parse(fs.readFileSync("scelte.json", "utf8")) : {};
process.argv.slice(3).forEach(function (f) {
  var o = JSON.parse(fs.readFileSync(f, "utf8")); o = o.result || o;
  (o.scelte || []).forEach(function (x) {
    var it = elenco[x.n - 1]; if (!it) return console.log("numero strano: " + x.n);
    var c = cand[it.id] || [];
    S[it.id] = { s: x.scelta >= 1 && x.scelta <= c.length ? x.scelta : 0, r: x.riserva >= 1 && x.riserva <= c.length ? x.riserva : 0, sicuro: !!x.sicuro, cerca: x.cerca || "" };
  });
});
fs.writeFileSync("scelte.json", JSON.stringify(S));
var giu = {}, zero = 0, insicuri = 0;
Object.keys(S).forEach(function (id) { var x = S[id]; if (x.s) giu[id] = [cand[id][x.s - 1]]; else zero++; if (!x.sicuro) insicuri++; });
fs.writeFileSync("da-scaricare.json", JSON.stringify(giu));
console.log("scelte: " + Object.keys(S).length + " · con una foto: " + Object.keys(giu).length + " · nessuna: " + zero + " · non sicure: " + insicuri);

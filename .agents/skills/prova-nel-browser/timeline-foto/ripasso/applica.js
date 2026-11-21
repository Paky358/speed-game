// scrive finali.json in data/linea-foto.js: cambia, aggiunge (in ordine) e toglie; il resto del file non si tocca
var fs = require("fs"), F = process.argv[2] || "D:/SG-linea2/data/linea-foto.js";
var s = fs.readFileSync(F, "utf8"), lista = JSON.parse(fs.readFileSync("finali.json", "utf8"));
var a = s.indexOf("window.SG_TL_FOTO = {"), b = s.lastIndexOf("};");
var testa = s.slice(0, a), corpo = s.slice(a + "window.SG_TL_FOTO = {".length, b), coda = s.slice(b);
var righe = corpo.split("\n").filter(function (r) { return r.trim(); }), mappa = {}, ordine = [];
righe.forEach(function (r) { var m = /^\s*("(?:[^"\\]|\\.)*")\s*:\s*("(?:[^"\\]|\\.)*"),?\s*$/.exec(r); if (!m) throw "riga strana: " + r; var k = JSON.parse(m[1]); mappa[k] = JSON.parse(m[2]); ordine.push(k); });
var prima = ordine.slice().sort(function (x, y) { return x < y ? -1 : x > y ? 1 : 0; });
var stessoOrdine = prima.every(function (k, i) { return k === ordine[i]; });
var c = { cambiate: 0, nuove: 0, tolte: 0 };
lista.forEach(function (x) {
  if (x.tipo === "tolta") { if (!(x.id in mappa)) throw "da togliere ma non c'è: " + x.id; delete mappa[x.id]; c.tolte++; return; }
  if (x.tipo === "nuova" && x.id in mappa) throw "nuova ma c'è già: " + x.id;
  if (x.tipo === "cambiata" && !(x.id in mappa)) throw "cambiata ma non c'è: " + x.id;
  mappa[x.id] = x.nuova + "|" + x.w; c[x.tipo === "nuova" ? "nuove" : "cambiate"]++;
});
var chiavi = Object.keys(mappa).sort(function (x, y) { return x < y ? -1 : x > y ? 1 : 0; });
var nota = "   Ripasso del 21 nov 2026: tutte le foto guardate di nuovo (fogli con la foto tagliata come sulla carta, su fondo scuro);\n   cambiate quelle scure, sfocate, sbagliate, tagliate male o che ingannavano sull'epoca, aggiunte foto alle carte che non\n   l'avevano (" + c.nuove + "), tolte 2 che non andavano (senza foto migliore). Programmi in D:/SG-linea-foto2 (fuori dal progetto).\n";
var testa2 = testa.indexOf("Ripasso del 21 nov 2026") >= 0 ? testa : testa.replace("   ========================================================= */", nota + "   ========================================================= */");
var out = testa2 + "window.SG_TL_FOTO = {\n" + chiavi.map(function (k) { return "  " + JSON.stringify(k) + ": " + JSON.stringify(mappa[k]); }).join(",\n") + "\n" + coda;
fs.writeFileSync(F, out);
console.log(JSON.stringify(c), "ordine di prima uguale:", stessoOrdine, "voci:", chiavi.length);

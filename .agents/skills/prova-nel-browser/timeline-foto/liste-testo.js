// Scrive le liste per gli aiutanti che scelgono la foto dal NOME del file (senza scaricarla): una riga per prodotto e
// sotto le candidate numerate. node liste-testo.js candidati.json [parti]
var fs = require("fs");
var elenco = require("./elenco.json"), cand = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), parti = +process.argv[3] || 3;
var DA = +process.env.DA || 1, A = +process.env.A || elenco.length, PRE = process.env.PRE || "testo";
var righe = elenco.map(function (x, i) {
  var c = cand[x.id] || [];
  return "### " + (i + 1) + ". " + x.nome + " — " + (x.desc || "") + " (" + (x.dove || "") + ")\n" +
    (c.length ? c.map(function (k, j) { return "  " + (j + 1) + ") " + (k.src[0] === "W" ? "pagina " + k.src.slice(2) : "ricerca «" + k.src.slice(2) + "»") + ": " + k.path.split("/").pop().replace(/_/g, " ") + " (" + k.w + "×" + k.h + ")"; }).join("\n") : "  (nessuna candidata)");
}).slice(DA - 1, A);
if (process.env.SOLO) { var solo = JSON.parse(fs.readFileSync(process.env.SOLO, "utf8")); righe = righe.filter(function (r, i) { return solo[elenco[DA - 1 + i].id]; }); }
var k = Math.ceil(righe.length / parti);
for (var p = 0; p < parti; p++) { fs.writeFileSync(PRE + (p + 1) + ".txt", righe.slice(p * k, (p + 1) * k).join("\n") + "\n"); console.log(PRE + (p + 1) + ".txt: voci " + (DA + p * k) + "-" + Math.min(A, DA - 1 + (p + 1) * k)); }

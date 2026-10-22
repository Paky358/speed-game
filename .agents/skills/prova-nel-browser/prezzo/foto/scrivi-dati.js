// Dalle scelte (n → numero della foto) scrive data/prezzo-foto.js nel progetto.
// node scrivi-dati.js scelte.json   (scelte.json = { "id": 1-6 | 0 })
var fs = require("fs");
var elenco = require("./elenco.json"), cand = require("./candidati.json"), scelte = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
var via = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3], "utf8")) : [];   // numeri dei prodotti da lasciare fuori (foto scartate)
function fotoDi(id) { var x = scelte[id]; if (!x) return null; if (typeof x !== "object") x = { s: x }; if (x.copia) return fotoDi(x.copia); return x.s ? (cand[id] || [])[x.s - 1] || null : null; }
var righe = [], senza = [];
elenco.forEach(function (x, i) {
  var c = via.indexOf(i + 1) >= 0 ? null : fotoDi(x.id);
  if (!c) { senza.push(x); return; }
  righe.push("  " + JSON.stringify(x.id) + ": " + JSON.stringify(c.path + "|" + (c.w || 0)) + ",   // " + x.nome.replace(/\*\//g, ""));
});
var testa = [
  "/* =========================================================",
  "   «Il Prezzo è Giusto!» — LE FOTO VERE dei prodotti e dei pezzi delle vetrine (da Wikimedia Commons, foto libere).",
  "   id del prodotto (o \"idVetrina#n\" per il pezzo n di una vetrina) → \"percorso su Commons|larghezza dell'originale\".",
  "   Il gioco le chiede a upload.wikimedia.org nelle misure standard (330 e 500 px): vedi urlFoto in js/games/prezzo-scena.js.",
  "   Scelte il 22-23 ott 2026: per ogni prodotto fino a 6 foto candidate (pagine di Wikipedia e ricerca su Commons), scelta",
  "   a occhio e ricontrollata. Regola: la foto mostra l'oggetto com'è, senza il prezzo scritto. Chi non ha la foto resta con l'emoji.",
  "   Le foto mandate dal proprietario stanno in carte/prezzo/<id>.jpg e qui si scrivono \"loc:carte/prezzo/<id>.jpg\".",
  "   ========================================================= */",
  "window.SG_PREZZO_FOTO = {"
];
var out = testa.concat(righe).join("\n") + "\n};\n";   // (la virgola dopo l'ultima voce va bene in JavaScript)
fs.writeFileSync(require("path").resolve(__dirname, "../../../../../data/prezzo-foto.js"), out);
console.log("con foto: " + righe.length + " · senza: " + senza.length + (senza.length ? " (" + senza.map(function (x) { return x.nome; }).join("; ") + ")" : ""));

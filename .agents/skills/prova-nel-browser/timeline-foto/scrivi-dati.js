// Scrive data/linea-foto.js con le foto scelte e controllate a occhio. Le foto già nel file restano (si aggiungono le nuove):
// node scrivi-dati.js scelte.json candidati.json [scarti.json]
//   scelte.json: { id: { s: numero 1-6 | 0 } }   scarti.json: [id, …] (bocciate a occhio: non entrano)
var fs = require("fs"), vm = require("vm");
var DEST = "C:/Users/joetr/Desktop/SG/data/linea-foto.js";
var S = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), cand = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
var scarti = process.argv[4] ? JSON.parse(fs.readFileSync(process.argv[4], "utf8")) : [];
var prima = {};
if (fs.existsSync(DEST)) { var ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(DEST, "utf8"), ctx); prima = ctx.window.SG_TL_FOTO || {}; }
var tutte = Object.assign({}, prima), nuove = 0;
Object.keys(S).forEach(function (id) {
  var x = S[id], k = x && typeof x === "object" ? x.s : x, c = (cand[id] || [])[k - 1];
  if (!c || scarti.indexOf(id) >= 0) return;
  if (!tutte[id]) nuove++;
  tutte[id] = c.path + "|" + (c.w || 0);
});
scarti.forEach(function (id) { delete tutte[id]; });
var righe = Object.keys(tutte).sort().map(function (id) { return "  " + JSON.stringify(id) + ": " + JSON.stringify(tutte[id]); });
var testa = "/* =========================================================\n" +
  "   «La linea del tempo» — LE FOTO VERE delle carte (da Wikimedia Commons, foto libere).\n" +
  "   \"categoria|titolo della carta\" → \"percorso su Commons|larghezza dell'originale\".\n" +
  "   Il gioco le chiede a upload.wikimedia.org a 330 px (urlFoto in js/games/timeline.js); una carta senza foto resta com'era.\n" +
  "   Scelte il 26 ott 2026 (prima Storia e Invenzioni): pagine di Wikipedia e ricerca su Commons proposte da aiutanti Sonnet,\n" +
  "   scelta dal nome del file, poi TUTTE guardate a occhio. Scartate: l'anno scritto in grande (darebbe la risposta), un'altra\n" +
  "   cosa, loghi, mappe e grafici, persone qualsiasi. Programmi e passi: .agents/skills/prova-nel-browser/timeline-foto/LEGGIMI.md\n" +
  "   ========================================================= */\n";
fs.writeFileSync(DEST, testa + "window.SG_TL_FOTO = {\n" + righe.join(",\n") + "\n};\n");
console.log("data/linea-foto.js: " + righe.length + " foto (" + nuove + " nuove)");

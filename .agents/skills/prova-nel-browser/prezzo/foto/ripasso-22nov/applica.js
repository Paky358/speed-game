// Scrive le scelte del ripasso in data/prezzo-foto.js SENZA rifare il file (mai scrivi-dati.js):
// - cambiata: si cambia solo la foto sulla riga di quella voce (e il commento dice il motivo e la foto di prima);
// - tolta: la riga si toglie (la voce resta nel gioco con l'emoji);
// - nuova (non aveva la foto): si AGGIUNGE in fondo, prima della chiusura.
// node applica.js D:/SG-prezzo finali.json [--prova]
var fs = require("fs"), path = require("path");
var SG = process.argv[2], lista = JSON.parse(fs.readFileSync(process.argv[3], "utf8")), PROVA = process.argv.indexOf("--prova") > 0;
var file = path.join(SG, "data/prezzo-foto.js"), testo = fs.readFileSync(file, "utf8"), EOL = testo.indexOf("\r\n") >= 0 ? "\r\n" : "\n", righe = testo.split(EOL);
function rigaDi(id) { var r = -1; righe.forEach(function (s, i) { if (s.indexOf('  "' + id + '": ') === 0) r = i; }); return r; }
function pulisci(s) { s = String(s || "").replace(/\*\//g, "").replace(/[\r\n]+/g, " ").split(" · ")[0].replace(/^occhio: /, "").replace(/\s+/g, " ").trim(); return s.length > 90 ? s.slice(0, 88).replace(/\s+\S*$/, "") + "…" : s; }
var nuove = [], fatte = { cambiate: 0, tolte: 0, nuove: 0 }, togli = [];
lista.forEach(function (x) {
  if (x.loc) throw new Error("foto del proprietario, non si tocca: " + x.id);
  var i = rigaDi(x.id), val = x.nuova ? x.nuova + "|" + x.w : null;
  if (val && !/^[0-9a-f]\/[0-9a-f]{2}\/[^|/]+\|\d+$/.test(val)) throw new Error("foto scritta male per " + x.id + ": " + val);
  if (x.tipo === "nuova") {
    if (i >= 0) throw new Error("aveva già la foto: " + x.id);
    nuove.push('  "' + x.id + '": ' + JSON.stringify(val) + ",   // " + pulisci(x.nome) + " (22 nov 2026, ripasso: non aveva la foto)"); fatte.nuove++;
  } else if (x.tipo === "cambiata") {
    if (i < 0) throw new Error("non ha la riga: " + x.id);
    righe[i] = '  "' + x.id + '": ' + JSON.stringify(val) + ",   // " + pulisci(x.nome) + " (22 nov 2026, ripasso: " + pulisci(x.motivo || "cambiata") + "; prima " + pulisci((x.vecchia || "").split("/").pop()) + ")"; fatte.cambiate++;
  } else if (x.tipo === "tolta") {
    if (i < 0) throw new Error("non ha la riga: " + x.id);
    togli.push(i); fatte.tolte++;
  } else throw new Error("tipo? " + x.tipo);
});
togli.sort(function (a, b) { return b - a; }).forEach(function (i) { righe.splice(i, 1); });
var fine = -1; righe.forEach(function (s, i) { if (s === "};") fine = i; });
if (fine < 0) throw new Error("non trovo la chiusura");
if (nuove.length) righe.splice.apply(righe, [fine, 0].concat(nuove));
var nuovo = righe.join(EOL);
global.window = {}; eval(nuovo); var F = window.SG_PREZZO_FOTO;
lista.forEach(function (x) { var atteso = x.nuova ? x.nuova + "|" + x.w : undefined; if (F[x.id] !== atteso) throw new Error("dopo la scrittura " + x.id + " = " + F[x.id]); });
console.log(JSON.stringify(fatte) + " · foto nel file: " + Object.keys(F).length + (PROVA ? " (PROVA: non scritto)" : ""));
if (!PROVA) fs.writeFileSync(file, nuovo);

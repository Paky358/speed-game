// Applica le correzioni decise ai prezzi vecchi (data/prezzo-1..4.js).
// node applica.js decisioni.json [--prova]   decisioni = [{ id, prezzo?, nome?, desc?, dove?, cur?, togli?, nota? }]
// id dei prodotti: "a1-…"; dei pezzi di vetrina: "a1-v-…#n" (n = posto del pezzo nella vetrina, da 0)
var fs = require("fs"), path = require("path");
var DATI = path.join(__dirname, "../../../../../data/") + "/", FILE = ["prezzo-1.js", "prezzo-2.js", "prezzo-3.js", "prezzo-4.js"];
var dec = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), prova = process.argv.indexOf("--prova") >= 0;
var perId = {}; dec.forEach(function (d) { perId[d.id] = d; });
var fatti = {}, log = [];
function esc(s) { return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"'); }
function numero(v) { return String(Math.round(v * 100) / 100); }
// cambia un campo stringa della riga (vuoto = lo toglie; se manca, lo mette prima di «prezzo», o dopo per «cur»)
function campo(riga, k, v) {
  var re = new RegExp("(,\\s*)?\\b" + k + ': "((?:[^"\\\\]|\\\\.)*)"');
  var m = riga.match(re);
  if (v === "" || v == null) { return m ? riga.replace(re, "") : riga; }
  if (m) return riga.replace(re, function (t, virg) { return (virg || "") + k + ': "' + esc(v) + '"'; });
  if (k === "cur") return riga.replace(/(prezzo: [0-9.]+)/, '$1, cur: "' + esc(v) + '"');
  return riga.replace(/(,\s*)(prezzo: [0-9.]+)/, '$1' + k + ': "' + esc(v) + '", $2');
}
function nota(riga, d) {
  var corpo = riga.replace(/\s*\/\/.*$/, "");
  var tx = (d.nota || "ricontrollato").replace(/\s+/g, " ").slice(0, 110);
  return corpo + "   // 24 ott 2026: " + tx;
}
FILE.forEach(function (f) {
  var p = DATI + f, s = fs.readFileSync(p, "utf8"), crlf = /\r\n/.test(s), righe = s.replace(/\r\n/g, "\n").split("\n"), vet = null, n = -1, via = [];
  righe.forEach(function (r, i) {
    var mv = r.match(/^\s*\{ id: "(a\d-v-[^"]+)"/);
    if (mv) { vet = mv[1]; n = -1; return; }
    var id = null, mp = r.match(/^\s*\{ id: "(a\d-[^"]+)"/);
    if (mp) { id = mp[1]; vet = null; }
    else if (vet && /^\s*\{ e: "/.test(r) && /prezzo: /.test(r)) { n++; id = vet + "#" + n; }
    if (!id || !perId[id]) return;
    var d = perId[id], prima = r;
    if (d.togli) {
      if (id.indexOf("#") >= 0) { log.push("NON TOLTO (pezzo di vetrina): " + id); return; }
      via.push(i); fatti[id] = 1; log.push("tolto " + id + " · " + (r.match(/nome: "([^"]*)"/) || [])[1]); return;
    }
    if (d.prezzo != null) r = r.replace(/prezzo: [0-9.]+/, "prezzo: " + numero(d.prezzo));
    ["nome", "desc", "dove", "cur"].forEach(function (k) { if (d[k] !== undefined) r = campo(r, k, d[k]); });
    r = nota(r, d);
    righe[i] = r; fatti[id] = 1;
    log.push(id + " · " + (prima.match(/prezzo: ([0-9.]+)/) || [])[1] + " → " + (r.match(/prezzo: ([0-9.]+)/) || [])[1]);
    if (prova) log.push("   " + r.trim());
  });
  via.reverse().forEach(function (i) { righe.splice(i, 1); });
  var nuovo = righe.join("\n");
  // il file deve restare buono: prima si prova a caricarlo, poi si scrive
  global.window = {}; new Function("window", nuovo)(global.window);
  if (!prova) fs.writeFileSync(p, crlf ? nuovo.replace(/\n/g, "\r\n") : nuovo);
});
var mai = dec.filter(function (d) { return !fatti[d.id] && !(d.togli && d.id.indexOf("#") >= 0); }).map(function (d) { return d.id; });
console.log(log.join("\n"));
console.log("applicate " + Object.keys(fatti).length + " su " + dec.length + (mai.length ? " · NON TROVATE: " + mai.join(", ") : "") + (prova ? " (prova: niente scritto)" : ""));

// lista per i fogli di verifica: le voci segnalate (aiutanti + occhio di Claude) con i motivi. node verlista.js out.json occhio-1.json [occhio-2.json…] [--da N --a M]
var fs = require("fs"), a = process.argv.slice(2), out = a.shift(), da = 0, fino = 1e9, occhi = [];
for (var i = 0; i < a.length; i++) { if (a[i] === "--da") da = +a[++i]; else if (a[i] === "--a") fino = +a[++i]; else occhi.push(a[i]); }
var t = JSON.parse(fs.readFileSync("tutte.json", "utf8")), by = {}; t.forEach(function (x) { by[x.n] = x; });
var s = JSON.parse(fs.readFileSync("segnalate.json", "utf8")), mio = {};
occhi.forEach(function (f) { var o = JSON.parse(fs.readFileSync(f, "utf8")); Object.keys(o).forEach(function (n) { mio[n] = o[n]; }); });
var ns = Object.keys(s).concat(Object.keys(mio)).map(Number).filter(function (n, i, arr) { return arr.indexOf(n) === i && n >= da && n <= fino && by[n] && by[n].path; }).sort(function (x, y) { return x - y; });
var lista = ns.map(function (n) { var x = Object.assign({}, by[n]), m = (s[n] || []).map(function (y) { return y.motivo + ": " + y.spiegazione; }); if (mio[n]) m.unshift("occhio: " + mio[n]);
  x.problema = m.join(" · ").slice(0, 260); x.segn = (s[n] || []).length; x.mio = !!mio[n]; return x; });
fs.writeFileSync(out, JSON.stringify(lista));
console.log(lista.length + " voci da verificare");

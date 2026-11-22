// prepara un lotto di voci da scegliere: quelle con tutte le candidate scaricate e non ancora fatte.
// node lotto.js rifare.json candidati.json fatti.json lotto.json [max]   (rifare = rifare-bN.json o mancanti.json, anche più file separati da +)
var fs = require("fs"), path = require("path"), crypto = require("crypto");
function J(f) { return JSON.parse(fs.readFileSync(f, "utf8")); }
var el = []; process.argv[2].split("+").forEach(function (f) { el = el.concat(J(f)); });
var cand = {}; process.argv[3].split("+").forEach(function (f) { if (fs.existsSync(f)) Object.assign(cand, J(f)); });
var fatti = fs.existsSync(process.argv[4]) ? J(process.argv[4]) : [];
function ha(p) { return fs.existsSync(path.join("mini", crypto.createHash("md5").update(p).digest("hex").slice(0, 16) + ".img")); }
function euro(v) { return String(Math.round(v * 100) / 100).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " €"; }
var ok = el.filter(function (x) { return fatti.indexOf(x.id) < 0 && cand[x.id] && cand[x.id].every(function (k) { return ha(k.path); }); });
ok = ok.slice(0, +process.argv[6] || 999).map(function (x) { return { n: x.n, id: x.id, nome: x.nome, cat: x.cat, anno: euro(x.prezzo) + (x.desc ? " · " + x.desc : ""), problema: x.problema || (x.path || x.ora ? "" : "non ha la foto"), ora: x.ora || x.path || null }; });
fs.writeFileSync(process.argv[5], JSON.stringify(ok));
fs.writeFileSync(process.argv[4], JSON.stringify(fatti.concat(ok.map(function (x) { return x.id; }))));
console.log(ok.length + " pronte");

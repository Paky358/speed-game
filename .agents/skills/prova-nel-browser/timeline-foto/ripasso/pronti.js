// le carte (di un elenco) con tutte le candidate già scaricate in mini/, che non hanno ancora un foglio
var fs = require("fs"), path = require("path"), crypto = require("crypto");
var el = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), cand = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
var fatti = fs.existsSync(process.argv[4]) ? JSON.parse(fs.readFileSync(process.argv[4], "utf8")) : [];
function ha(p) { return fs.existsSync(path.join("mini", crypto.createHash("md5").update(p).digest("hex").slice(0, 16) + ".img")); }
var ok = el.filter(function (x) { return fatti.indexOf(x.id) < 0 && (cand[x.id] || []).every(function (k) { return ha(k.path); }); });
var max = +process.argv[6] || 999; ok = ok.slice(0, max);
fs.writeFileSync(process.argv[5], JSON.stringify(ok));
fs.writeFileSync(process.argv[4], JSON.stringify(fatti.concat(ok.map(function (x) { return x.id; }))));
console.log(ok.length + " pronte");

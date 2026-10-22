// Scarica con calma le miniature (330 px) di tutte le foto candidate in mini/, per fare i fogli senza chiederle tutte insieme.
// node scarica.js candidati.json   (quelle già scaricate si saltano)
var fs = require("fs"), path = require("path"), crypto = require("crypto");
var UA = { "User-Agent": "SPeeDGAME-foto/1.0 (https://paky358.github.io/speed-game/)" };
var cand = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
fs.mkdirSync("mini", { recursive: true });
function thumb(k, px) {
  var nome = k.path.split("/").pop(), enc = k.path.split("/").map(encodeURIComponent).join("/");
  if (k.w && k.w <= px) return "https://upload.wikimedia.org/wikipedia/commons/" + enc;
  return "https://upload.wikimedia.org/wikipedia/commons/thumb/" + enc + "/" + px + "px-" + encodeURIComponent(nome);
}
function file(k) { return path.join("mini", crypto.createHash("md5").update(k.path).digest("hex").slice(0, 16) + ".img"); }
function attesa(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
var coda = [], visti = {};
Object.keys(cand).forEach(function (id) { (cand[id] || []).forEach(function (k) { var f = file(k); if (!visti[f] && !fs.existsSync(f)) { visti[f] = 1; coda.push(k); } }); });
console.log("da scaricare: " + coda.length);
var fatti = 0, rotte = 0, ultima = 0;
async function una(k) {
  for (var t = 0; t < 5; t++) {
    var dt = Date.now() - ultima; if (dt < 1000) await attesa(1000 - dt); ultima = Date.now();
    try {
      var r = await fetch(thumb(k, 330), { headers: UA });
      if (r.ok) { fs.writeFileSync(file(k), Buffer.from(await r.arrayBuffer())); return true; }
      if (r.status === 404 || r.status === 400) return false;
      var ra = +r.headers.get("retry-after") || 10; console.log("  aspetto " + ra + " s (" + r.status + ")"); await attesa((ra + 1) * 1000);
    } catch (e) { await attesa(2000); }
  }
  return false;
}
(async function () {
  for (var i = 0; i < coda.length; i++) {
    if (await una(coda[i])) fatti++; else rotte++;
    if ((i + 1) % 100 === 0) console.log((i + 1) + "/" + coda.length + " (non arrivate " + rotte + ")");
  }
  console.log("FATTO: scaricate " + fatti + ", non arrivate " + rotte);
})();

// Scarica con calma (una al secondo, e se Wikimedia dice «aspetta» si aspetta) le miniature a 330 px, come le chiede il gioco.
// node scarica.js lista.json  (lista di { path, w }; quelle già in mini/ si saltano)
var fs = require("fs"), path = require("path"), crypto = require("crypto");
var UA = { "User-Agent": "SG-linea-foto/1.0 (https://paky358.github.io/speed-game/)" };
var lista = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
fs.mkdirSync("mini", { recursive: true });
function url(k, px) { var nome = k.path.split("/").pop(), enc = k.path.split("/").map(encodeURIComponent).join("/");
  if (k.w && k.w <= px) return "https://upload.wikimedia.org/wikipedia/commons/" + enc;
  return "https://upload.wikimedia.org/wikipedia/commons/thumb/" + enc + "/" + px + "px-" + encodeURIComponent(nome); }
function file(k) { return path.join("mini", crypto.createHash("md5").update(k.path).digest("hex").slice(0, 16) + ".img"); }
function attesa(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
var coda = [], visti = {};
lista.forEach(function (k) { if (!k.path) return; var f = file(k); if (!visti[f] && !fs.existsSync(f)) { visti[f] = 1; coda.push(k); } });
console.log("da scaricare: " + coda.length);
var fatti = 0, rotte = [], ultima = 0;
async function una(k) {
  for (var t = 0; t < 6; t++) {
    var dt = Date.now() - ultima; if (dt < 1100) await attesa(1100 - dt); ultima = Date.now();
    try { var r = await fetch(url(k, 330), { headers: UA });
      if (r.ok) { fs.writeFileSync(file(k), Buffer.from(await r.arrayBuffer())); return true; }
      if (r.status === 404 || r.status === 400) return false;
      var ra = Math.max(+r.headers.get("retry-after") || 30, 30); console.log("  aspetto " + ra + " s (" + r.status + ")"); await attesa((ra + 1) * 1000);
    } catch (e) { await attesa(3000); } }
  return false;
}
(async function () {
  for (var i = 0; i < coda.length; i++) { if (await una(coda[i])) fatti++; else rotte.push(coda[i].path);
    if ((i + 1) % 100 === 0) console.log((i + 1) + "/" + coda.length + " (non arrivate " + rotte.length + ")"); }
  fs.writeFileSync("non-arrivate.json", JSON.stringify(rotte));
  console.log("FATTO: scaricate " + fatti + ", non arrivate " + rotte.length);
})();

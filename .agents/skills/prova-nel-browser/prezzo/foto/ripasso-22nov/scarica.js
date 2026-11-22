// Scarica con calma le miniature a 330 px, come le chiede il gioco: UNA RICHIESTA OGNI 1,25 s (ritmo fisso, al massimo 2 in viaggio
// insieme), e se Wikimedia dice «aspetta» (429/503) si ferma tutto quanto chiede. node scarica.js lista.json  (lista di { path, w }; quelle già in mini/ si saltano)
var fs = require("fs"), path = require("path"), crypto = require("crypto");
var UA = { "User-Agent": "SG-prezzo-foto/1.0 (https://paky358.github.io/speed-game/)" };
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
var PASSO = 1250, prossima = 0, fermo = 0, fatti = 0, rotte = [], inViaggio = 0;
async function turno() {   // aspetta il proprio posto nel ritmo fisso (e le pause chieste da Wikimedia)
  for (;;) { var ora = Date.now(), t = Math.max(prossima, fermo); if (ora >= t && inViaggio < 2) { prossima = Math.max(ora, prossima) + PASSO; return; } await attesa(Math.max(50, t - ora)); }
}
async function una(k) {
  for (var t = 0; t < 6; t++) {
    await turno(); inViaggio++;
    try { var r = await fetch(url(k, 330), { headers: UA });
      if (r.ok) { fs.writeFileSync(file(k), Buffer.from(await r.arrayBuffer())); return true; }
      if (r.status === 404 || r.status === 400) return false;
      var ra = Math.max(+r.headers.get("retry-after") || 30, 30); console.log("  aspetto " + ra + " s (" + r.status + ")"); fermo = Date.now() + (ra + 1) * 1000;
    } catch (e) { fermo = Math.max(fermo, Date.now() + 3000); } finally { inViaggio--; }
  }
  return false;
}
(async function () {
  var i = 0, n = 0;
  async function operaio() { while (i < coda.length) { var k = coda[i++]; if (await una(k)) fatti++; else rotte.push(k.path); if (++n % 100 === 0) console.log(n + "/" + coda.length + " (non arrivate " + rotte.length + ")"); } }
  await Promise.all([operaio(), operaio()]);
  fs.writeFileSync("non-arrivate.json", JSON.stringify(rotte));
  console.log("FATTO: scaricate " + fatti + ", non arrivate " + rotte.length);
})();

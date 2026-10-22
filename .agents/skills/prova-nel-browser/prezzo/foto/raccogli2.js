// Seconda ricerca su Commons per i prodotti con la foto incerta o senza foto: la ricerca nuova proposta dagli aiutanti
// (scelte.json → cerca). Le foto nuove si aggiungono in fondo alle candidate. node raccogli2.js
var fs = require("fs");
var UA = { "User-Agent": "SPeeDGAME-foto/1.0 (https://paky358.github.io/speed-game/)", "Api-User-Agent": "SPeeDGAME-foto/1.0 (https://paky358.github.io/speed-game/)" };
var cand = require("./candidati.json"), S = require("./scelte.json");
var FATTI = "ricerca2.json", fatti = fs.existsSync(FATTI) ? JSON.parse(fs.readFileSync(FATTI, "utf8")) : {};
function attesa(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
var ultima = 0;
async function getJ(u) {
  for (var t = 0; t < 6; t++) {
    var dt = Date.now() - ultima; if (dt < 1500) await attesa(1500 - dt); ultima = Date.now();
    try {
      var r = await fetch(u, { headers: UA });
      if (r.ok) return await r.json();
      if (r.status === 404) return null;
      var ra = +r.headers.get("retry-after") || 20; console.log("  aspetto " + ra + " s (" + r.status + ")"); await attesa((ra + 1) * 1000);
    } catch (e) { await attesa(3000); }
  }
  return undefined;
}
function percorso(u) { var m = /\/wikipedia\/commons\/(?:thumb\/)?([0-9a-f]\/[0-9a-f]{2}\/[^/?]+)/.exec(String(u || "")); return m ? decodeURIComponent(m[1]) : null; }
function buona(path) { return path && !/\.(svg|gif|tif|tiff|pdf|djvu|webm|ogv)$/i.test(path); }
(async function () {
  var ids = Object.keys(S).filter(function (id) { return S[id].cerca && !fatti[id]; }), n = 0;
  console.log("da cercare: " + ids.length);
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i], c = cand[id] || (cand[id] = []), visti = {}; c.forEach(function (k) { visti[k.path] = 1; });
    var q = S[id].cerca.replace(/&amp;/g, "&");
    var k = await getJ("https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=6&gsrsearch=" + encodeURIComponent(q + " filetype:bitmap") + "&prop=imageinfo&iiprop=url|size");
    if (k === undefined) continue;
    var da = c.length;
    (k && k.query ? Object.values(k.query.pages).sort(function (a, b) { return a.index - b.index; }) : []).forEach(function (pg) {
      var ii = pg.imageinfo && pg.imageinfo[0], p = ii && percorso(ii.url);
      if (ii && buona(p) && !visti[p] && c.length < da + 5) { visti[p] = 1; c.push({ src: "C " + q, path: p, w: ii.width, h: ii.height }); }
    });
    fatti[id] = { da: da + 1, a: c.length };
    if (++n % 20 === 0) { fs.writeFileSync("candidati.json", JSON.stringify(cand)); fs.writeFileSync(FATTI, JSON.stringify(fatti)); console.log(n + "/" + ids.length); }
  }
  fs.writeFileSync("candidati.json", JSON.stringify(cand)); fs.writeFileSync(FATTI, JSON.stringify(fatti));
  console.log("FATTO: " + n + " ricerche");
})();

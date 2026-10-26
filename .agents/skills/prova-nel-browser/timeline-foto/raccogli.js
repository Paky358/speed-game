// Per ogni voce prende le foto candidate: l'immagine principale delle pagine di Wikipedia proposte (50 pagine per
// richiesta) e i primi risultati di una ricerca su Commons. Con calma: una richiesta ogni 1,1 s, e se Wikimedia dice
// «aspetta» (429) si aspetta quanto chiede. Riprende da dove era (le voci con la ricerca Commons fatta restano).
// node raccogli.js proposte.json [candidati.json]
var fs = require("fs");
var UA = { "User-Agent": "SPeeDGAME-foto/1.0 (https://paky358.github.io/speed-game/)", "Api-User-Agent": "SPeeDGAME-foto/1.0 (https://paky358.github.io/speed-game/)" };
var elenco = require("./elenco.json"), prop = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
var OUT = process.argv[3] || "candidati.json", PAG = "pagine.json";
var fatto = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
var CER = "cercati.json", cercati = fs.existsSync(CER) ? JSON.parse(fs.readFileSync(CER, "utf8")) : {};
var pagine = fs.existsSync(PAG) ? JSON.parse(fs.readFileSync(PAG, "utf8")) : {};   // "it:Titolo" → { path, w, h } | null
var P = {}; (prop.voci || prop).forEach(function (v) { P[v.id] = v; });
function attesa(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
var ultima = 0;
async function getJ(u) {
  for (var t = 0; t < 6; t++) {
    var dt = Date.now() - ultima; if (dt < 1500) await attesa(1500 - dt);
    ultima = Date.now();
    try {
      var r = await fetch(u, { headers: UA });
      if (r.ok) return await r.json();
      if (r.status === 404) return null;
      var ra = +r.headers.get("retry-after") || 20; console.log("  Wikimedia dice di aspettare " + ra + " s (" + r.status + ")");
      await attesa((ra + 1) * 1000);
    } catch (e) { await attesa(3000); }
  }
  console.log("  NIENTE dopo 6 tentativi: " + u.slice(0, 120)); return undefined;
}
function percorso(u) { var m = /\/wikipedia\/commons\/(?:thumb\/)?([0-9a-f]\/[0-9a-f]{2}\/[^/?]+)/.exec(String(u || "")); return m ? decodeURIComponent(m[1]) : null; }
function buona(path) { return path && !/\.(svg|gif|tif|tiff|pdf|djvu|webm|ogv)$/i.test(path); }
function salva() { fs.writeFileSync(OUT, JSON.stringify(fatto)); fs.writeFileSync(PAG, JSON.stringify(pagine)); fs.writeFileSync(CER, JSON.stringify(cercati)); }
(async function () {
  // 1) le immagini principali delle pagine, 50 alla volta per lingua
  var perLingua = {};
  elenco.forEach(function (x) { ((P[x.id] || {}).wiki || []).slice(0, 3).forEach(function (w) { var m = /^([a-z]{2,3}):(.+)$/.exec(w || ""); if (m && pagine[w] === undefined) (perLingua[m[1]] = perLingua[m[1]] || {})[m[2]] = w; }); });
  for (var lg in perLingua) {
    var titoli = Object.keys(perLingua[lg]);
    for (var i = 0; i < titoli.length; i += 50) {
      var pezzo = titoli.slice(i, i + 50);
      var u = "https://" + lg + ".wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1&prop=pageimages&piprop=original&titles=" + encodeURIComponent(pezzo.join("|"));
      var j = await getJ(u); if (j === undefined) continue;
      var q = (j && j.query) || {}, mappa = {};
      pezzo.forEach(function (t) { mappa[t] = t; });
      (q.normalized || []).forEach(function (n) { Object.keys(mappa).forEach(function (k) { if (mappa[k] === n.from) mappa[k] = n.to; }); });
      (q.redirects || []).forEach(function (n) { Object.keys(mappa).forEach(function (k) { if (mappa[k] === n.from) mappa[k] = n.to; }); });
      var perTitolo = {}; (q.pages || []).forEach(function (pg) { perTitolo[pg.title] = pg; });
      pezzo.forEach(function (t) {
        var pg = perTitolo[mappa[t]], o = pg && pg.original, path = o && percorso(o.source);
        pagine[perLingua[lg][t]] = buona(path) ? { path: path, w: o.width, h: o.height } : null;
      });
      salva(); console.log(lg + ": " + Math.min(i + 50, titoli.length) + "/" + titoli.length + " pagine");
    }
  }
  // 2) per ogni voce: prima le pagine, poi la ricerca su Commons (5 risultati)
  var n = 0;
  for (var k = 0; k < elenco.length; k++) {
    var x = elenco[k], p = P[x.id] || { wiki: [], commons: x.nome };
    if (fatto[x.id] && cercati[x.id]) continue;
    var c = [], visti = {};
    var metti = function (o) { if (!o || !buona(o.path) || visti[o.path]) return; visti[o.path] = 1; c.push(o); };
    (p.wiki || []).slice(0, 3).forEach(function (w) { var o = pagine[w]; if (o) metti({ src: "W " + w, path: o.path, w: o.w, h: o.h }); });
    var su = "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=6&gsrsearch=" + encodeURIComponent((p.commons || x.nome) + " filetype:bitmap") + "&prop=imageinfo&iiprop=url|size";
    var kk = await getJ(su), cercato = kk !== undefined;
    var res = kk && kk.query ? Object.values(kk.query.pages).sort(function (a, b) { return a.index - b.index; }) : [];
    res.forEach(function (pg) { var ii = pg.imageinfo && pg.imageinfo[0]; if (ii && c.length < 6) metti({ src: "C " + p.commons, path: percorso(ii.url), w: ii.width, h: ii.height }); });
    fatto[x.id] = c; if (cercato) cercati[x.id] = 1;
    if (++n % 20 === 0) { salva(); console.log(n + " voci (" + (k + 1) + "/" + elenco.length + ")"); }
  }
  salva();
  var vuote = elenco.filter(function (x) { return !(fatto[x.id] || []).length; });
  console.log("FATTO: " + Object.keys(fatto).length + " voci, senza nessuna foto: " + vuote.length + (vuote.length ? " (" + vuote.slice(0, 20).map(function (x) { return x.nome; }).join("; ") + ")" : ""));
})();

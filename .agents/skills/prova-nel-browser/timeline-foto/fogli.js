// Fa i fogli da guardare: 10 voci per foglio, per ognuna fino a 6 foto candidate numerate. Edge invisibile (rispetta la fila di prova.js).
// node fogli.js candidati.json cartella-fogli [scelte.json]
//   con scelte.json ({ id: numero 1-6 | 0 }) fa invece i fogli delle sole foto scelte (40 per foglio), per il controllo finale
var fs = require("fs"), path = require("path");
var { chromium } = require("C:\\Users\\joetr\\sg-strumenti\\node_modules\\playwright-core");
var elenco = require("./elenco.json"), cand = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
var DIR = process.argv[3] || "fogli", SCELTE = process.argv[4] ? JSON.parse(fs.readFileSync(process.argv[4], "utf8")) : null;
fs.mkdirSync(DIR, { recursive: true });
function thumb(c, px) {
  var nome = c.path.split("/").pop();
  if (c.w && c.w <= px) return "https://upload.wikimedia.org/wikipedia/commons/" + c.path.split("/").map(encodeURIComponent).join("/");
  return "https://upload.wikimedia.org/wikipedia/commons/thumb/" + c.path.split("/").map(encodeURIComponent).join("/") + "/" + px + "px-" + encodeURIComponent(nome);
}
// la miniatura scaricata prima da scarica.js (mini/), dentro la pagina: niente richieste a Wikimedia mentre si fa il foglio
var crypto = require("crypto");
function locale(c) { var f = path.join(__dirname, "mini", crypto.createHash("md5").update(c.path).digest("hex").slice(0, 16) + ".img"); if (!fs.existsSync(f)) return ""; var b = fs.readFileSync(f), t = b[0] === 0x89 ? "png" : b[0] === 0x47 ? "gif" : b[0] === 0x52 ? "webp" : "jpeg"; return "data:image/" + t + ";base64," + b.toString("base64"); }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
var CSS = "body{margin:0;font:13px system-ui;background:#fff;color:#111}.r{display:flex;align-items:center;border-bottom:2px solid #999;padding:4px;gap:6px}" +
  ".t{width:190px;flex:none}.t b{font-size:15px}.t i{display:block;color:#555;font-size:12px}.c{position:relative;width:150px;height:150px;flex:none;background:#eee;display:flex;align-items:center;justify-content:center}" +
  ".c img{max-width:150px;max-height:150px}.c span{position:absolute;left:0;top:0;background:#c00;color:#fff;font:bold 20px system-ui;padding:0 6px}.c em{position:absolute;right:0;bottom:0;background:#000a;color:#fff;font-size:10px;padding:0 3px}" +
  ".g{display:grid;grid-template-columns:repeat(8,150px);gap:6px;padding:6px}.g div{font-size:11px;line-height:1.15}.g img{width:150px;height:130px;object-fit:contain;background:#eee;display:block}";
function paginaScelta(voci) {
  return "<style>" + CSS + "</style><div class=g>" + voci.map(function (x) {
    var sc = SCELTE[x.id], k = sc && typeof sc === "object" ? sc.s : sc, c = (cand[x.id] || [])[k - 1], src = c ? locale(c) : "";
    return "<div>" + (src ? "<img src='" + src + "'>" : "<div style='height:130px;background:#f99;display:flex;align-items:center;justify-content:center'>" + (c ? "NON SCARICATA" : "NESSUNA") + "</div>") + "<b>" + x.n + ".</b> " + esc(x.nome) + "</div>";
  }).join("") + "</div>";
}
function pagina(voci) {
  return "<style>" + CSS + "</style>" + voci.map(function (x) {
    var c = cand[x.id] || [];
    return "<div class=r><div class=t><b>" + x.n + ". " + esc(x.nome) + "</b><i>" + esc(x.desc) + "</i><i>" + esc(x.dove) + "</i></div>" +
      (c.length ? c.map(function (k, i) { return "<div class=c><img src='" + locale(k) + "'><span>" + (i + 1) + "</span><em>" + esc(k.src.slice(0, 26)) + "</em></div>"; }).join("") : "<div class=c>nessuna</div>") + "</div>";
  }).join("");
}
// la fila di prova.js: un Edge solo su tutto il PC
var CODA = "C:\\Users\\joetr\\sg-strumenti\\coda", mio = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mio) { try { fs.unlinkSync(mio); } catch (e) {} mio = null; } }
process.on("exit", lascia);
async function turno() {
  try { fs.mkdirSync(CODA, { recursive: true }); } catch (e) {}
  mio = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mio, String(process.pid));
  for (;;) {
    var vivi = fs.readdirSync(CODA).filter(function (f) { return f.endsWith(".lock"); }).sort().filter(function (f) { var pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; });
    if (vivi[0] === path.basename(mio)) return;
    await new Promise(function (r) { setTimeout(r, 2000); });
  }
}
(async function () {
  var voci = elenco.map(function (x, i) { return Object.assign({ n: i + 1 }, x); }), PER = SCELTE ? 40 : 10, fogli = [];
  if (process.env.SOLO) { var solo = JSON.parse(fs.readFileSync(process.env.SOLO, "utf8")); voci = voci.filter(function (x) { return solo.indexOf(x.n) >= 0; }); }
  for (var i = 0; i < voci.length; i += PER) fogli.push(voci.slice(i, i + PER));
  var DA = +process.env.DA || 1, A = +process.env.A || 99999;   // solo i fogli da DA a A (numeri dei fogli)
  await turno();
  var browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    var page = await browser.newPage({ viewport: { width: SCELTE ? 1290 : 1150, height: 600 }, userAgent: "Mozilla/5.0 SPeeDGAME-foto/1.0 (https://paky358.github.io/speed-game/)" });
    for (var f = DA - 1; f < Math.min(fogli.length, A); f++) {
      await page.setContent(SCELTE ? paginaScelta(fogli[f]) : pagina(fogli[f]));
      await page.waitForFunction(function () { return [].every.call(document.images, function (im) { return im.complete; }); }, null, { timeout: 60000 }).catch(function () {});
      var rotte = await page.evaluate(function () { return [].filter.call(document.images, function (im) { return !im.naturalWidth; }).length; });
      if (rotte) console.log("  " + rotte + " foto non caricate in questo foglio");
      await new Promise(function (r) { setTimeout(r, 2500); });   // con calma: Wikimedia limita chi chiede troppe foto insieme
      var nome = path.join(DIR, "foglio-" + String(f + 1).padStart(2, "0") + ".png");
      await page.screenshot({ path: nome, fullPage: true, type: "png" });
      console.log(nome + " (" + fogli[f][0].n + "-" + fogli[f][fogli[f].length - 1].n + ")");
    }
  } finally { await browser.close(); lascia(); }
})();

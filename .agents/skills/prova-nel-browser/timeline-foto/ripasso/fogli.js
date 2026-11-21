// Fogli del ripasso: 30 carte a foglio (5 x 6). Per ogni carta: a sinistra la foto come la vede chi gioca (quadrato su fondo scuro come la carta, tagliata
// come sulla carta in mano), a destra la foto intera; sotto numero, categoria, ANNO e titolo. Edge invisibile, nella fila di prova.js.
// node fogli.js tutte.json cartella [solo.json = elenco di numeri n] [PER]
var fs = require("fs"), path = require("path"), crypto = require("crypto");
var { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
var tutte = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), DIR = process.argv[3] || "fogli";
var SOLO = process.argv[4] && process.argv[4] !== "-" ? JSON.parse(fs.readFileSync(process.argv[4], "utf8")) : null, PER = +process.argv[5] || 30;
var GRANDE = PER <= 12;   // fogli di controllo: foto più grandi
fs.mkdirSync(DIR, { recursive: true });
function mini(p) { if (!p) return ""; var f = path.join(__dirname, "mini", crypto.createHash("md5").update(p).digest("hex").slice(0, 16) + ".img"); if (!fs.existsSync(f)) return ""; var b = fs.readFileSync(f), t = b[0] === 0x89 ? "png" : b[0] === 0x47 ? "gif" : b[0] === 0x52 ? "webp" : "jpeg"; return "data:image/" + t + ";base64," + b.toString("base64"); }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
var Q = GRANDE ? 200 : 120, COL = GRANDE ? 3 : 5;
var CSS = "body{margin:0;font:12px system-ui;background:#fff;color:#111}.g{display:grid;grid-template-columns:repeat(" + COL + "," + (2 * Q + 14) + "px);gap:8px;padding:8px}" +
  ".c{border:1px solid #bbb;padding:3px;background:#fafafa}.f{display:flex;gap:4px}.q{width:" + Q + "px;height:" + Q + "px;object-fit:cover;border-radius:8px;background:#2b2e44;display:block}" +
  ".i{width:" + Q + "px;height:" + Q + "px;object-fit:contain;background:#e8e8e8;display:block}.t{font-size:" + (GRANDE ? 14 : 11.5) + "px;line-height:1.2;margin-top:3px;height:" + (GRANDE ? 52 : 42) + "px;overflow:hidden}" +
  ".t b{color:#c00}.no{width:" + (2 * Q + 4) + "px;height:" + Q + "px;background:#f99;display:flex;align-items:center;justify-content:center;font-weight:bold}";
function pagina(voci) {
  return "<style>" + CSS + "</style><div class=g>" + voci.map(function (x) {
    var src = mini(x.path);
    return "<div class=c>" + (src ? "<div class=f><img class=q src='" + src + "'><img class=i src='" + src + "'></div>" : "<div class=no>" + (x.path ? "NON SCARICATA" : "SENZA FOTO") + "</div>") +
      "<div class=t><b>" + x.n + "</b> · " + esc(x.cat) + " · <b>" + esc(x.anno) + "</b> · " + esc(x.nome) + "</div></div>";
  }).join("") + "</div>";
}
var CODA = "C:/Users/joetr/sg-strumenti/coda", mio = null;
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
  var voci = tutte.filter(function (x) { return SOLO ? SOLO.indexOf(x.n) >= 0 : !!x.path; }), fogli = [];
  for (var i = 0; i < voci.length; i += PER) fogli.push(voci.slice(i, i + PER));
  await turno();
  var browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu"] });
  try {
    var page = await browser.newPage({ viewport: { width: COL * (2 * Q + 22) + 16, height: 600 } });
    var indice = [];
    for (var f = 0; f < fogli.length; f++) {
      await page.setContent(pagina(fogli[f]));
      await page.waitForFunction(function () { return [].every.call(document.images, function (im) { return im.complete; }); }, null, { timeout: 30000 }).catch(function () {});
      var nome = path.join(DIR, "foglio-" + String(f + 1).padStart(3, "0") + ".png");
      await page.screenshot({ path: nome, fullPage: true, type: "png" });
      indice.push({ foglio: nome, da: fogli[f][0].n, a: fogli[f][fogli[f].length - 1].n, n: fogli[f].map(function (x) { return x.n; }) });
    }
    fs.writeFileSync(path.join(DIR, "indice.json"), JSON.stringify(indice));
    console.log("FATTO: " + fogli.length + " fogli in " + DIR);
  } finally { await browser.close(); lascia(); }
})();

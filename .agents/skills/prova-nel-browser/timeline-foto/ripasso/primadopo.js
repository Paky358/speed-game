// Fogli PRIMA / DOPO del ripasso delle foto: per ogni carta cambiata la foto di prima e quella nuova (quadrate, su fondo
// scuro come sulla carta). node primadopo.js cartella [solo.json = numeri]
var fs = require("fs"), path = require("path"), crypto = require("crypto");
var { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
var lista = JSON.parse(fs.readFileSync("finali.json", "utf8")), DIR = process.argv[2] || "prima-dopo";
var motivi = {}; JSON.parse(fs.readFileSync("rifare.json", "utf8")).concat(JSON.parse(fs.readFileSync("rifare2.json", "utf8"))).forEach(function (x) { motivi[x.n] = x.problema; });
if (process.argv[3]) { var solo = JSON.parse(fs.readFileSync(process.argv[3], "utf8")); lista = lista.filter(function (x) { return solo.indexOf(x.n) >= 0; }); }
fs.mkdirSync(DIR, { recursive: true });
function mini(p) { if (!p) return ""; var f = path.join(__dirname, "mini", crypto.createHash("md5").update(p).digest("hex").slice(0, 16) + ".img"); if (!fs.existsSync(f)) return ""; var b = fs.readFileSync(f), t = b[0] === 0x89 ? "png" : b[0] === 0x47 ? "gif" : b[0] === 0x52 ? "webp" : "jpeg"; return "data:image/" + t + ";base64," + b.toString("base64"); }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
var CSS = "body{margin:0;font:12px system-ui;background:#fff;color:#111}.g{display:grid;grid-template-columns:repeat(4,300px);gap:10px;padding:10px}" +
  ".c{border:1px solid #bbb;padding:4px;background:#fafafa}.f{display:flex;gap:6px;align-items:center}.q{width:130px;height:130px;object-fit:cover;border-radius:10px;background:#2b2e44;display:block}" +
  ".no{width:130px;height:130px;border-radius:10px;background:#2b2e44;color:#aab;display:flex;align-items:center;justify-content:center;font-weight:bold;text-align:center}.fr{font-size:22px;color:#c00}" +
  ".t{font-size:12px;line-height:1.2;margin-top:4px}.t b{color:#c00}.m{font-size:11px;color:#666;margin-top:2px;height:28px;overflow:hidden}.lab{display:flex;justify-content:space-between;font-size:11px;font-weight:bold;color:#444;padding:0 30px 2px}";
function pagina(voci) {
  return "<style>" + CSS + "</style><div class=g>" + voci.map(function (x) {
    var a = mini(x.vecchia), b = mini(x.nuova);
    return "<div class=c><div class=lab><span>PRIMA</span><span>DOPO</span></div><div class=f>" + (a ? "<img class=q src='" + a + "'>" : "<div class=no>senza<br>foto</div>") + "<span class=fr>→</span>" +
      (b ? "<img class=q src='" + b + "'>" : "<div class=no>tolta<br>(senza foto)</div>") + "</div><div class=t><b>" + x.n + "</b> · " + esc(x.cat) + " · <b>" + esc(x.anno) + "</b> · " + esc(x.nome) + "</div>" +
      "<div class=m>" + esc(motivi[x.n] || (x.vecchia ? "" : "non aveva la foto")) + "</div></div>";
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
  var PER = 24, fogli = []; for (var i = 0; i < lista.length; i += PER) fogli.push(lista.slice(i, i + PER));
  await turno();
  var browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu"] });
  try {
    var page = await browser.newPage({ viewport: { width: 1270, height: 600 } });
    for (var f = 0; f < fogli.length; f++) {
      await page.setContent(pagina(fogli[f]));
      await page.waitForFunction(function () { return [].every.call(document.images, function (im) { return im.complete; }); }, null, { timeout: 30000 }).catch(function () {});
      await page.screenshot({ path: path.join(DIR, "prima-dopo-" + String(f + 1).padStart(2, "0") + ".png"), fullPage: true, type: "png" });
    }
    console.log("FATTO: " + fogli.length + " fogli in " + DIR);
  } finally { await browser.close(); lascia(); }
})();

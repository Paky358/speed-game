// Fogli compatti per l'occhio di Claude: 100 voci a foglio (10 x 10), la foto quadrata come nei riquadri, su fondo scuro,
// sotto numero e nome corto. node compatti.js tutte.json cartella
var fs = require("fs"), path = require("path"), crypto = require("crypto");
var { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
var tutte = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), DIR = process.argv[3] || "compatti", PER = 100;
fs.mkdirSync(DIR, { recursive: true });
function mini(p) { if (!p) return ""; var f = path.join(__dirname, "mini", crypto.createHash("md5").update(p).digest("hex").slice(0, 16) + ".img"); if (!fs.existsSync(f)) return ""; var b = fs.readFileSync(f), t = b[0] === 0x89 ? "png" : b[0] === 0x47 ? "gif" : b[0] === 0x52 ? "webp" : "jpeg"; return "data:image/" + t + ";base64," + b.toString("base64"); }
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
var CSS = "body{margin:0;font:10.5px system-ui;background:#0d1020;color:#e8eaf6}.g{display:grid;grid-template-columns:repeat(10,112px);gap:4px;padding:4px}" +
  ".c{background:#151a2e;padding:2px}.c img{width:108px;height:108px;object-fit:contain;background:#fff;border-radius:8px;display:block}.t{height:26px;overflow:hidden;line-height:1.2}.t b{color:#ff6b8f}";
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
  var voci = tutte.filter(function (x) { return !!x.path; }), fogli = [];
  for (var i = 0; i < voci.length; i += PER) fogli.push(voci.slice(i, i + PER));
  await turno();
  var browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu"] });
  try {
    var page = await browser.newPage({ viewport: { width: 1176, height: 600 } });
    for (var f = 0; f < fogli.length; f++) {
      await page.setContent("<style>" + CSS + "</style><div class=g>" + fogli[f].map(function (x) { var s = mini(x.path); return "<div class=c>" + (s ? "<img src='" + s + "'>" : "<div style='width:108px;height:108px;background:#5a2333'></div>") + "<div class=t><b>" + x.n + "</b> " + esc(x.nome) + "</div></div>"; }).join("") + "</div>");
      await page.waitForFunction(function () { return [].every.call(document.images, function (im) { return im.complete; }); }, null, { timeout: 30000 }).catch(function () {});
      await page.screenshot({ path: path.join(DIR, "compatto-" + String(f + 1).padStart(2, "0") + ".png"), fullPage: true, type: "png" });
    }
    console.log("FATTO: " + fogli.length + " fogli in " + DIR);
  } finally { await browser.close(); lascia(); }
})();

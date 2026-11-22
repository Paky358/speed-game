// Fogli PRIMA / DOPO del ripasso delle foto del Prezzo: per ogni voce cambiata la foto di prima e quella nuova, come nella
// scheda del gioco (intera, sfondo bianco dietro, su fondo blu notte), col motivo. node primadopo.js cartella [tipo]
var fs = require("fs"), path = require("path"), crypto = require("crypto");
var { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
var lista = JSON.parse(fs.readFileSync("finali.json", "utf8")), DIR = process.argv[2] || "prima-dopo", TIPO = process.argv[3] || "";
if (TIPO) lista = lista.filter(function (x) { return x.tipo === TIPO; });
fs.mkdirSync(DIR, { recursive: true });
function mini(p) { if (!p) return ""; var f = path.join(__dirname, "mini", crypto.createHash("md5").update(p).digest("hex").slice(0, 16) + ".img"); if (!fs.existsSync(f)) return ""; var b = fs.readFileSync(f), t = b[0] === 0x89 ? "png" : b[0] === 0x47 ? "gif" : b[0] === 0x52 ? "webp" : "jpeg"; return "data:image/" + t + ";base64," + b.toString("base64"); }
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
function euro(v) { return v == null ? "" : String(Math.round(v * 100) / 100).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " €"; }
var CSS = "body{margin:0;font:12px system-ui;background:#0d1020;color:#f4f5fb}.g{display:grid;grid-template-columns:repeat(4,300px);gap:10px;padding:10px}" +
  ".c{border:1px solid #39406a;padding:5px;background:#151a2e;border-radius:8px}.f{display:flex;gap:6px;align-items:center}.s{width:130px;height:130px;display:flex;align-items:center;justify-content:center;background:#1c2240;border-radius:6px}" +
  ".s img{max-width:100%;max-height:100%;border-radius:10px;background:#fff;display:block;box-shadow:0 3px 10px rgba(0,0,0,.4)}" +
  ".no{width:130px;height:130px;border-radius:6px;background:#1c2240;color:#a6acc8;display:flex;align-items:center;justify-content:center;font-weight:bold;text-align:center}.fr{font-size:22px;color:#ff6b8f}" +
  ".t{font-size:12px;line-height:1.2;margin-top:5px;color:#d8dbee}.t b{color:#ff6b8f}.t u{text-decoration:none;color:#ffc247;font-weight:bold}.m{font-size:11px;color:#a6acc8;margin-top:3px;height:42px;overflow:hidden}" +
  ".lab{display:flex;justify-content:space-between;font-size:11px;font-weight:bold;color:#a6acc8;padding:0 40px 3px}";
function pagina(voci) {
  return "<style>" + CSS + "</style><div class=g>" + voci.map(function (x) {
    var a = mini(x.vecchia), b = mini(x.nuova);
    return "<div class=c><div class=lab><span>PRIMA</span><span>DOPO</span></div><div class=f>" + (a ? "<div class=s><img src='" + a + "'></div>" : "<div class=no>senza<br>foto</div>") + "<span class=fr>→</span>" +
      (b ? "<div class=s><img src='" + b + "'></div>" : "<div class=no>tolta<br>(resta l'emoji)</div>") + "</div><div class=t><b>" + x.n + "</b> · " + esc(x.cat) + " · <u>" + euro(x.prezzo) + "</u> · " + esc(x.nome) + "</div>" +
      "<div class=m>" + esc(x.motivo || "") + "</div></div>";
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
      await page.screenshot({ path: path.join(DIR, (TIPO || "prima-dopo") + "-" + String(f + 1).padStart(2, "0") + ".png"), fullPage: true, type: "png" });
    }
    console.log("FATTO: " + fogli.length + " fogli in " + DIR);
  } finally { await browser.close(); lascia(); }
})();

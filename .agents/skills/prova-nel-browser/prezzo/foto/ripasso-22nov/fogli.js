// Fogli del ripasso delle foto del Prezzo: 30 voci a foglio (5 x 6). Per ogni voce, su fondo blu notte come nel gioco:
// a sinistra la foto COME NELLA SCHEDA (intera, sfondo bianco dietro, angoli tondi), a destra COME NEI RIQUADRI piccoli
// (quadrata, tagliata, angoli tondi); sotto numero, categoria, prezzo, nome, descrizione e dove. Edge invisibile, nella fila.
// node fogli.js tutte.json cartella [solo.json = numeri | -] [PER] [CAMPO=path]
var fs = require("fs"), path = require("path"), crypto = require("crypto");
var { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
var tutte = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), DIR = process.argv[3] || "fogli";
var SOLO = process.argv[4] && process.argv[4] !== "-" ? JSON.parse(fs.readFileSync(process.argv[4], "utf8")) : null, PER = +process.argv[5] || 30, CAMPO = process.argv[6] || "path";
var GRANDE = PER <= 12;
fs.mkdirSync(DIR, { recursive: true });
function mini(p) { if (!p) return ""; var f = path.join(__dirname, "mini", crypto.createHash("md5").update(p).digest("hex").slice(0, 16) + ".img"); if (!fs.existsSync(f)) return ""; var b = fs.readFileSync(f), t = b[0] === 0x89 ? "png" : b[0] === 0x47 ? "gif" : b[0] === 0x52 ? "webp" : "jpeg"; return "data:image/" + t + ";base64," + b.toString("base64"); }
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
function euro(v) { return v == null ? "" : String(Math.round(v * 100) / 100).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " €"; }
var Q = GRANDE ? 210 : 122, COL = GRANDE ? 3 : 5;
var CSS = "body{margin:0;font:12px system-ui;background:#0d1020;color:#f4f5fb}.g{display:grid;grid-template-columns:repeat(" + COL + "," + (2 * Q + 18) + "px);gap:8px;padding:8px}" +
  ".c{border:1px solid #39406a;padding:4px;background:#151a2e;border-radius:8px}.f{display:flex;gap:6px}.s{width:" + Q + "px;height:" + Q + "px;display:flex;align-items:center;justify-content:center;background:#1c2240;border-radius:6px}" +
  ".s img{max-width:100%;max-height:100%;border-radius:10px;box-shadow:0 3px 10px rgba(0,0,0,.4);background:#fff;display:block}" +
  ".q{width:" + Q + "px;height:" + Q + "px;object-fit:cover;border-radius:22%;background:#fff;display:block}" +
  ".t{font-size:" + (GRANDE ? 14 : 11.5) + "px;line-height:1.22;margin-top:4px;height:" + (GRANDE ? 74 : 56) + "px;overflow:hidden;color:#d8dbee}.t b{color:#ff6b8f}.t u{text-decoration:none;color:#ffc247;font-weight:bold}.t i{font-style:normal;color:#a6acc8}" +
  ".p{font-size:12px;line-height:1.2;color:#ffb070;height:46px;overflow:hidden;margin-top:2px}.no{width:" + (2 * Q + 6) + "px;height:" + Q + "px;background:#5a2333;display:flex;align-items:center;justify-content:center;font-weight:bold;border-radius:6px}";
function pagina(voci) {
  return "<style>" + CSS + "</style><div class=g>" + voci.map(function (x) {
    var p = x[CAMPO], src = mini(p);
    return "<div class=c>" + (src ? "<div class=f><div class=s><img src='" + src + "'></div><img class=q src='" + src + "'></div>" : "<div class=no>" + (p ? "NON SCARICATA" : "SENZA FOTO " + esc(x.e || "")) + "</div>") +
      "<div class=t><b>" + x.n + "</b> · " + esc(x.cat) + " · <u>" + euro(x.prezzo) + "</u> · " + esc(x.nome) + (x.desc ? " <i>— " + esc(x.desc) + "</i>" : "") + (x.dove ? " <i>(" + esc(x.dove) + ")</i>" : "") + "</div>" + (x.problema ? "<div class=p>" + esc(x.problema) + "</div>" : "") + "</div>";
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
  var voci = tutte.filter(function (x) { return SOLO ? SOLO.indexOf(x.n) >= 0 : !!x[CAMPO]; }), fogli = [];
  for (var i = 0; i < voci.length; i += PER) fogli.push(voci.slice(i, i + PER));
  await turno();
  var browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu"] });
  try {
    var page = await browser.newPage({ viewport: { width: COL * (2 * Q + 26) + 16, height: 600 } });
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

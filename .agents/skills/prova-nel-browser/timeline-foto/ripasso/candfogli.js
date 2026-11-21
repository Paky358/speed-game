// Fogli per scegliere: per ogni carta le foto candidate numerate (1-8), col nome del file. Edge invisibile, nella fila.
// node candfogli.js elenco.json candidati.json cartella [PER=8]
var fs = require("fs"), path = require("path"), crypto = require("crypto");
var { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
var elenco = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), cand = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
var DIR = process.argv[4] || "candfogli", PER = +process.argv[5] || 8;
fs.mkdirSync(DIR, { recursive: true });
function mini(p) { if (!p) return ""; var f = path.join(__dirname, "mini", crypto.createHash("md5").update(p).digest("hex").slice(0, 16) + ".img"); if (!fs.existsSync(f)) return ""; var b = fs.readFileSync(f), t = b[0] === 0x89 ? "png" : b[0] === 0x47 ? "gif" : b[0] === 0x52 ? "webp" : "jpeg"; return "data:image/" + t + ";base64," + b.toString("base64"); }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
var CSS = "body{margin:0;font:12px system-ui;background:#fff;color:#111}.r{display:flex;align-items:flex-start;border-bottom:3px solid #888;padding:5px;gap:6px}" +
  ".t{width:170px;flex:none;font-size:13px}.t b{font-size:14px}.t i{display:block;color:#c00;font-weight:bold;font-style:normal}.c{position:relative;width:150px;flex:none}" +
  ".c img{width:150px;height:150px;object-fit:contain;background:#e8e8e8;display:block}.c img.q{width:96px;height:96px;object-fit:cover;background:#2b2e44;border-radius:8px;margin-top:3px}.c.ora{outline:4px solid #0a0;background:#efe}.c span{position:absolute;left:0;top:0;background:#c00;color:#fff;font:bold 20px system-ui;padding:0 6px}" +
  ".c em{display:block;font-size:10px;line-height:1.1;height:34px;overflow:hidden;word-break:break-all;font-style:normal;color:#333}";
function pagina(voci) {
  return "<style>" + CSS + "</style>" + voci.map(function (x) {
    var c = cand[x.id] || [], oraS = x.ora ? mini(x.ora) : "";
    return "<div class=r><div class=t><b>" + x.n + ". " + esc(x.nome) + "</b><i>" + esc(x.anno || "") + "</i>" + esc(x.cat || "") + (x.problema ? "<br><small>" + esc(x.problema).slice(0, 140) + "</small>" : "") + "</div>" + (oraS ? "<div class='c ora'><img src='" + oraS + "'><span style='background:#0a0'>ORA</span><img class=q src='" + oraS + "'></div>" : "") +
      (c.length ? c.map(function (k, i) { var s = mini(k.path); return "<div class=c>" + (s ? "<img src='" + s + "'><img class=q src='" + s + "'>" : "<div style='width:150px;height:150px;background:#f99'>non scaricata</div>") + "<span>" + (i + 1) + "</span><em>" + esc(k.path.split("/").pop().slice(0, 70)) + " (" + k.w + "×" + k.h + ")</em></div>"; }).join("") : "<div class=c>nessuna</div>") + "</div>";
  }).join("");
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
  var fogli = []; for (var i = 0; i < elenco.length; i += PER) fogli.push(elenco.slice(i, i + PER));
  await turno();
  var browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu"] });
  try {
    var page = await browser.newPage({ viewport: { width: 1420, height: 600 } }), indice = [];
    for (var f = 0; f < fogli.length; f++) {
      await page.setContent(pagina(fogli[f]));
      await page.waitForFunction(function () { return [].every.call(document.images, function (im) { return im.complete; }); }, null, { timeout: 30000 }).catch(function () {});
      var nome = path.join(DIR, "scelta-" + String(f + 1).padStart(3, "0") + ".png");
      await page.screenshot({ path: nome, fullPage: true, type: "png" });
      indice.push({ foglio: nome, n: fogli[f].map(function (x) { return x.n; }), id: fogli[f].map(function (x) { return x.id; }) });
    }
    fs.writeFileSync(path.join(DIR, "indice.json"), JSON.stringify(indice));
    console.log("FATTO: " + fogli.length + " fogli in " + DIR);
  } finally { await browser.close(); lascia(); }
})();

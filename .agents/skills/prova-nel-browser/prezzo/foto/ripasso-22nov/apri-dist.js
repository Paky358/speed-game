// Prova veloce della versione online: apre dist/ in Edge invisibile (nella fila delle prove), guarda gli errori e la novità in cima.
// node apri-dist.js http://localhost:8992/
var fs = require("fs"), path = require("path");
var { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
var URL = process.argv[2];
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
  await turno();
  var browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu"] });
  try {
    var page = await browser.newPage({ viewport: { width: 412, height: 915 } }), errori = [];
    page.on("pageerror", function (e) { errori.push(String(e)); });
    await page.goto(URL, { waitUntil: "load" });
    await page.waitForTimeout(6000);
    var r = await page.evaluate(function () { return { novita: (window.SG_NOVITA || [])[0] && window.SG_NOVITA[0].v, giochi: document.querySelectorAll("[data-gioco], .gioco, .tessera").length }; });
    // il pezzo del Prezzo: lo si fa arrivare e si guarda una foto nuova
    var p = await page.evaluate(async function () {
      if (!window.SGCuore || !window.SGCuore.aspettaGioco) return "niente cuore.aspettaGioco";
      var g = (window.SG && SG.giochi && SG.giochi.prezzo) || null;
      return await new Promise(function (ok) { try { SGCuore.precarica("prezzo"); } catch (e) {} var t0 = Date.now(); (function guarda() { if (window.SG_PREZZO_FOTO) ok(window.SG_PREZZO_FOTO["a1-moet"] + " · " + Object.keys(window.SG_PREZZO_FOTO).length + " foto"); else if (Date.now() - t0 > 15000) ok("il pezzo non arriva"); else setTimeout(guarda, 300); })(); });
    });
    console.log("novità in cima: v" + r.novita + " · prezzo: " + p + " · errori: " + (errori.length ? errori.join(" / ") : "nessuno"));
  } finally { await browser.close(); lascia(); }
})();

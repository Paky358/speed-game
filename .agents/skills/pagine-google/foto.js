/* 🔎 Foto e controlli delle pagine per Google (serve la cartella dist/ già costruita: bash costruisci-versione-online.sh).
   "C:\Program Files\nodejs\node.exe" .agents/skills/pagine-google/foto.js [cartella delle foto] [pagine separate da virgola]
   - fotografa le pagine su un telefono 360x640 (tutta la pagina) e su un computer 1280x800;
   - le apre SENZA JavaScript: il titolo, il testo e il tasto «Gioca ora» ci devono essere;
   - apre revelhouse.it (dist/index.html) CON JavaScript: il testo per Google dev'essere nascosto e l'app deve partire;
   - controlla che ogni pagina della mappa del sito risponda e che le immagini ci siano.
   Usa Edge e playwright-core di C:\Users\joetr\sg-strumenti e la sua fila (un Edge alla volta su tutto il PC). */
"use strict";
var fs = require("fs"), path = require("path"), http = require("http");
var { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
var R = path.resolve(__dirname, "../../.."), DIST = path.join(R, "dist");
var FOTO = process.argv[2] || "D:/SG-google-prove/foto";
var SCELTE = (process.argv[3] || "mini-asta-fantacalcio,impostore,pecora-nera,ruota-della-fortuna,giochi").split(",");
fs.mkdirSync(FOTO, { recursive: true });
var TIPI = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".webp": "image/webp", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain", ".json": "application/json", ".webmanifest": "application/manifest+json" };
var srv = http.createServer(function (q, r) {
  var u = decodeURIComponent(q.url.split("?")[0].split("#")[0]); if (u.endsWith("/")) u += "index.html";
  var f = path.join(DIST, u); if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end("no"); }
  r.writeHead(200, { "Content-Type": TIPI[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(r);
});
// la fila di sg-strumenti (come prova.js)
var CODA = "C:/Users/joetr/sg-strumenti/coda", mio = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mio) try { fs.unlinkSync(mio); } catch (e) {} mio = null; }
process.on("exit", lascia);
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mio = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mio, String(process.pid));
  for (var detto = false; ;) {
    var vivi = fs.readdirSync(CODA).filter(function (f) { return f.endsWith(".lock"); }).sort().filter(function (f) { var p = +f.split("-")[1].split(".")[0]; if (vivo(p)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; });
    if (vivi[0] === path.basename(mio)) return;
    if (!detto) { console.log("⏳ aspetto il mio turno…"); detto = true; }
    await new Promise(function (r) { setTimeout(r, 2000); });
  }
}
var NO = [];
function no(s) { NO.push(s); console.log("NO · " + s); }

(async function () {
  await new Promise(function (r) { srv.listen(0, "127.0.0.1", r); });
  var B = "http://127.0.0.1:" + srv.address().port;
  await turno();
  var br = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu"] });
  try {
    var mappa = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8").match(/<loc>[^<]+<\/loc>/g).map(function (x) { return x.slice(5, -6).replace("https://revelhouse.it", ""); });
    // 1) senza JavaScript: tutte le pagine della mappa
    var c0 = await br.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 });
    var p0 = await c0.newPage();
    for (var u of mappa) {
      var risp = await p0.goto(B + u); if (!risp || risp.status() !== 200) { no(u + " risponde " + (risp && risp.status())); continue; }
      var info = await p0.evaluate(function () {
        var h1 = document.querySelector("h1"), vis = function (e) { return !!e && e.getBoundingClientRect().height > 0 && getComputedStyle(e).display !== "none"; };
        var imgs = [].slice.call(document.images).map(function (i) { return i.getAttribute("src"); });
        return { h1: h1 && vis(h1) ? h1.textContent : null, parole: document.body.innerText.split(/\s+/).length, gioca: !!document.querySelector('a[href^="/#gioco="]'),
          largo: document.documentElement.scrollWidth, imgs: imgs, titolo: document.title, descr: (document.querySelector('meta[name=description]') || {}).content || "" };
      });
      if (!info.h1) no(u + ": senza JavaScript non si vede il titolo");
      if (/^\/giochi\/.+/.test(u) && !info.gioca) no(u + ": manca il tasto Gioca");
      if (info.largo > 362) no(u + ": la pagina esce di lato (" + info.largo + " px)");
      info.imgs.forEach(function (s) { if (s && s[0] === "/" && !fs.existsSync(path.join(DIST, s))) no(u + ": manca l'immagine " + s); });
      console.log((u + "                                   ").slice(0, 38) + info.parole + " parole · " + info.titolo.length + " car. titolo · " + info.descr.length + " car. descr.");
    }
    // 2) le foto: telefono e computer
    for (var s of SCELTE) {
      var u2 = s === "giochi" ? "/giochi/" : "/giochi/" + s + "/";
      await p0.goto(B + u2); await p0.waitForTimeout(300);
      await p0.screenshot({ path: path.join(FOTO, s + "-telefono-inizio.png") });
      await p0.screenshot({ path: path.join(FOTO, s + "-telefono-tutta.png"), fullPage: true });
    }
    await c0.close();
    var c1 = await br.newContext({ viewport: { width: 1280, height: 800 } }), p1 = await c1.newPage();
    for (var s2 of SCELTE.slice(0, 2).concat(["giochi"])) { await p1.goto(B + (s2 === "giochi" ? "/giochi/" : "/giochi/" + s2 + "/")); await p1.waitForTimeout(400); await p1.screenshot({ path: path.join(FOTO, s2 + "-computer.png") }); }
    await c1.close();
    // 3) revelhouse.it senza JavaScript: si legge il testo per Google
    var c2 = await br.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 }), p2 = await c2.newPage();
    await p2.goto(B + "/"); var vis2 = await p2.evaluate(function () { var e = document.getElementById("sito"); return e ? e.getBoundingClientRect().height : -1; });
    if (!(vis2 > 100)) no("revelhouse.it senza JavaScript: il testo non si vede (" + vis2 + ")");
    await p2.screenshot({ path: path.join(FOTO, "ingresso-senza-javascript.png") }); await c2.close();
    // 4) revelhouse.it CON JavaScript: il testo nascosto da subito, l'app parte
    var c3 = await br.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, serviceWorkers: "block" }), p3 = await c3.newPage();
    var errori = []; p3.on("pageerror", function (e) { errori.push(String(e)); });
    var visto = [];
    await p3.exposeFunction("__visto", function (h) { visto.push(h); });
    await p3.addInitScript(function () { new MutationObserver(function () { var e = document.getElementById("sito"); if (e && !e.__v) { e.__v = 1; window.__visto(getComputedStyle(e).display); } }).observe(document, { childList: true, subtree: true }); });
    await p3.goto(B + "/"); await p3.waitForTimeout(6000);
    var st = await p3.evaluate(function () { var e = document.getElementById("sito"); return { d: e && getComputedStyle(e).display, app: document.getElementById("app").children.length, t: document.body.innerText.slice(0, 120) }; });
    if (visto[0] !== "none") no("con JavaScript il testo per Google si è visto (" + visto[0] + ")");
    if (st.d !== "none") no("con JavaScript il testo per Google è visibile");
    if (!st.app) no("con JavaScript l'app non è partita");
    if (errori.length) no("errori nella pagina: " + errori.slice(0, 3).join(" | "));
    console.log("revelhouse.it con JavaScript: testo " + st.d + ", app con " + st.app + " pezzi: «" + st.t.replace(/\s+/g, " ") + "»");
    await p3.screenshot({ path: path.join(FOTO, "ingresso-app.png") });
    // 5) «Gioca ora» porta dentro l'app sul gioco
    await p3.goto(B + "/#gioco=impostore"); await p3.waitForTimeout(5000);
    await p3.screenshot({ path: path.join(FOTO, "gioca-ora-impostore.png") });
    await c3.close();
  } finally { await br.close().catch(function () {}); lascia(); srv.close(); }
  console.log(NO.length ? NO.length + " cose da sistemare" : "Tutto OK");
  process.exit(NO.length ? 1 : 0);
})();

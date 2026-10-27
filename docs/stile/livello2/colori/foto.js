// Foto delle proposte (server di prova sulla cartella del progetto, porta 8123). Uso: node foto.js [chiavi…]
const { chromium } = require("playwright");
const D = __dirname + "/", U = "http://localhost:8123/docs/stile/livello2/colori/";
const arg = process.argv.slice(2), soloConfronto = arg[0] === "confronto";
const chiavi = soloConfronto ? [] : arg.length ? arg : ["prima", "oggi", "a", "b", "c"];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  p.on("pageerror", e => console.log("ERR", e.message));
  p.on("console", m => { if (m.type() === "error") console.log("CONS", m.text()); });
  for (const k of chiavi) for (const t of ["home", "sala"]) {
    await p.goto(U + k + "-" + t + ".html", { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250);
    await p.screenshot({ path: D + k + "-" + t + ".png" });
  }
  // l'immagine unica: le 5 prime schermate una accanto all'altra
  const q = await b.newPage({ viewport: { width: 2190, height: 1100 } });
  await q.goto(U + "confronto.html", { waitUntil: "networkidle" }); await q.waitForTimeout(200);
  await q.screenshot({ path: D + "confronto.png", fullPage: true });
  await b.close();
})();

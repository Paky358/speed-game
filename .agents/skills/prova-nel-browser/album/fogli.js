// 📒 I FOGLI DELLE SCELTE: mette in fila le foto di album/foto.js (una scelta per foglio, A B C affiancate) per guardarle insieme.
// Uso: node .agents\skills\prova-nel-browser\album\fogli.js D:\SG-album-prove\foto D:\SG-album-prove\fogli
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const DA = process.argv[2], A = process.argv[3]; fs.mkdirSync(A, { recursive: true });
const TITOLI = { 1: "1 · Dove si apre l'album", 2: "2 · Come si gira tra le squadre", 3: "3 · La pagina di una squadra", 4: "4 · Le figurine che mancano", 5: "5 · La scheda «con te»", 6: "6 · Le stagioni passate" };
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu"] });
  try {
    const p = await (await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })).newPage();
    for (const misura of ["360x640", "412x915"]) for (const n of Object.keys(TITOLI)) {
      const foto = fs.readdirSync(DA).filter(f => f.startsWith(n + "-") && f.endsWith(misura + ".png")).sort();
      if (!foto.length) continue;
      const w = misura === "360x640" ? 360 : 330;
      const html = "<body style='margin:0;background:#0d1020;color:#f4f5fb;font:600 22px system-ui;padding:18px'><div style='font-size:30px;font-weight:800;margin-bottom:14px'>" + TITOLI[n] + " <span style='color:#a6acc8;font-size:20px'>(" + misura + ")</span></div><div style='display:flex;gap:18px;align-items:flex-start'>" +
        foto.map(f => "<div style='width:" + w + "px'><div style='margin-bottom:8px;color:#ff9fbc'>" + f.replace(/^\d-/, "").replace("-" + misura + ".png", "").replace(/-/g, " ") + "</div><img style='width:" + w + "px;border-radius:14px;border:1px solid #333a5c' src='file:///" + path.join(DA, f).split(path.sep).join("/") + "'></div>").join("") + "</div></body>";
      const tmp = path.join(A, "_tmp.html"); fs.writeFileSync(tmp, html);
      await p.goto("file:///" + tmp.split(path.sep).join("/")); await p.waitForTimeout(300);
      const out = path.join(A, TITOLI[n].split(" · ")[0] + "-" + TITOLI[n].split(" · ")[1].replace(/[«»']/g, "").replace(/ /g, "-").toLowerCase() + "-" + misura + ".png");
      await p.screenshot({ path: out, fullPage: true }); console.log(out);
      fs.unlinkSync(tmp);
    }
  } finally { await b.close(); }
})();

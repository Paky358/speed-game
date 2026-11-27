// 🛡️ il foglio degli scudetti (forma A e B, grandi e piccoli). Uso: node .agents\skills\prova-nel-browser\album\foglio-scudetti.js D:\SG-album-prove\libro
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const DOVE = process.argv[2] || __dirname;
const OGGI = ["Atalanta", "Bologna", "Cagliari", "Como", "Fiorentina", "Frosinone", "Genoa", "Inter", "Juventus", "Lazio", "Lecce", "Milan", "Monza", "Napoli", "Parma", "Roma", "Sassuolo", "Torino", "Udinese", "Venezia"];
const PASSATE = ["Benevento", "Brescia", "Carpi", "Chievo", "Cremonese", "Crotone", "Empoli", "Palermo", "Pescara", "Pisa", "SPAL", "Salernitana", "Sampdoria", "Spezia", "Verona"];
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu"] });
  const p = await (await b.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 })).newPage();
  const src = fs.readFileSync(path.join(__dirname, "scudetti.js"), "utf8");
  for (const forma of ["A", "B"]) {
    const html = `<html><head><style>body{margin:0;background:radial-gradient(circle at 30% 0,#2a2350,#0d1020 60%);color:#f4f5fb;font:600 15px 'Segoe UI',system-ui;padding:18px}
      h1{font-size:26px;margin:0 0 4px}h2{font-size:17px;color:#ff9fbc;margin:16px 0 8px}.g{display:grid;grid-template-columns:repeat(10,1fr);gap:10px}
      .c{text-align:center}.c svg{width:96px;height:auto;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45))}.c div{margin-top:4px;font-size:13px}
      .p{display:flex;flex-wrap:wrap;gap:12px;align-items:center;background:rgba(30,36,62,.6);border-radius:14px;padding:10px}.p svg{width:30px;height:auto}</style></head><body>
      <h1>🛡️ Gli scudetti · forma ${forma} ${forma === "A" ? "(classica, con le «orecchie»)" : "(tonda da torneo)"}</h1>
      <h2>Le 20 squadre di oggi</h2><div class="g" id="o"></div><h2>Le stagioni passate</h2><div class="g" id="v"></div>
      <h2>Piccoli come nell'indice dell'album (30 punti)</h2><div class="p" id="s"></div>
      <script>${src}</script><script>
      const O=${JSON.stringify(OGGI)},V=${JSON.stringify(PASSATE)};
      function cella(t){return '<div class="c">'+SG_SCUDETTI.svg(t,{forma:"${forma}"})+'<div>'+t+'</div></div>'}
      o.innerHTML=O.map(cella).join("");v.innerHTML=V.map(cella).join("");s.innerHTML=O.concat(V).map(t=>SG_SCUDETTI.svg(t,{forma:"${forma}"})).join("");
      </script></body></html>`;
    const tmp = path.join(DOVE, "_s.html"); fs.writeFileSync(tmp, html);
    await p.goto("file:///" + tmp.split(path.sep).join("/")); await p.waitForTimeout(300);
    const out = path.join(DOVE, "1-scudetti-forma-" + forma + ".png"); await p.screenshot({ path: out, fullPage: true }); console.log(out); fs.unlinkSync(tmp);
  }
  await b.close();
})();

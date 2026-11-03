// Trova le caselle nere (immagine non disegnata) nei vecchi fogli di controllo. node neri.js <porta> <cartella fogli> <primo indice>
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const fs = require("fs");
const [, , PORTA, DIR] = process.argv;
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true });
  const p = await b.newPage();
  await p.goto(`http://localhost:${PORTA}/.agents/skills/prova-nel-browser/memata/fogli.html?da=0&n=1`);
  const files = fs.readdirSync(DIR).filter(f => /\.png$/.test(f)).sort();
  const out = [];
  for (const f of files) {
    const k = parseInt(f.match(/(\d+)/)[1], 10);  // foglio-NNN (numero del foglio)
    const r = await p.evaluate(async (url) => {
      const img = new Image(); img.src = url; await img.decode();
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0);
      const ris = [];
      for (let i = 0; i < 24; i++) {
        const col = i % 6, row = Math.floor(i / 6), X = 8 + col * 308, Y = 8 + row * 328;
        if (Y + 280 > img.height) break;
        const d = x.getImageData(X + 20, Y + 20, 260, 240).data; let nero = 0, tot = 0, grigio = 0;
        for (let j = 0; j < d.length; j += 16) { tot++; if (d[j] < 12 && d[j + 1] < 12 && d[j + 2] < 12) nero++; if (d[j] === 34 && d[j + 1] === 34 && d[j + 2] === 34) grigio++; }
        ris.push(nero / tot > 0.55 ? 1 : 0);
      }
      return ris;
    }, `http://localhost:${PORTA}/prove/${DIR.split("/").pop()}/${f}`);
    r.forEach((v, i) => { if (v) out.push((k - 1) * 24 + i); });
  }
  console.log(JSON.stringify(out));
  await b.close();
})();

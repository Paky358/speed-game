// Foto di una pagina (per i fogli di controllo di Memata): node foto-url.js "<indirizzo>" <file.png> [larghezza]
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const [, , URL, OUT, LARGO] = process.argv;
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true });
  const p = await b.newPage({ viewport: { width: +LARGO || 1864, height: 600 } });
  await p.goto(URL);
  await p.waitForFunction(() => window.__pronti, null, { timeout: 30000 }).catch(() => {});
  await p.screenshot({ path: OUT, fullPage: true });
  await b.close();
  console.log("FOTO", OUT);
})();

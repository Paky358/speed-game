// Fa le foto dei fogli di controllo di Memata (fogli.html), 24 meme per foglio, in Edge invisibile.
// node foto-fogli.js <porta> <cartella uscita> [da] [a]
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const fs = require("fs"), path = require("path");
const [, , PORTA, OUT, DA, A] = process.argv;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ channel: "msedge", headless: true });
  const p = await b.newPage({ viewport: { width: 1864, height: 980 } });
  const tot = await (async () => { await p.goto(`http://localhost:${PORTA}/.agents/skills/prova-nel-browser/memata/fogli.html?da=0&n=1`); return p.evaluate(() => (window.SG_MEMATA || []).length); })();
  const da = +DA || 0, a = Math.min(tot, +A || tot);
  for (let i = da; i < a; i += 24) {
    const f = path.join(OUT, "foglio-" + String(i + 1).padStart(4, "0") + ".png");
    if (fs.existsSync(f)) continue;
    await p.goto(`http://localhost:${PORTA}/.agents/skills/prova-nel-browser/memata/fogli.html?da=${i}&n=24`);
    await p.waitForFunction(() => window.__pronti, null, { timeout: 30000 }).catch(() => {});
    await p.screenshot({ path: f, fullPage: true });
    console.log(f);
  }
  await b.close();
  console.log("FINITO", tot);
})();

// 📒 LE FOTO DELL'ALBUM VERO (27 nov 2026): l'album del gioco aperto dai Trofei con numeri finti (gli stessi della prova al2).
// Uso: node .agents\skills\prova-nel-browser\album\foto-vero.js --porta 8998 --dove D:\SG-album-prove\vero
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) { const v = process.argv[i + 1]; arg[process.argv[i].slice(2)] = (v === undefined || v.startsWith("--")) ? "1" : v; }
const BASE = "http://localhost:" + (arg.porta || 8998), DOVE = arg.dove || path.join(__dirname, "vero");
fs.mkdirSync(DOVE, { recursive: true });
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"] });
  try {
    for (const [L, H] of [[360, 640], [412, 915]]) {
      const p = await (await b.newContext({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 2, serviceWorkers: "block" })).newPage();
      p.on("pageerror", e => console.log("❗ " + e.message));
      await p.goto(BASE + "/sw.js");
      await p.evaluate(async ([L, H]) => {
        const tf = await (await fetch("/.agents/skills/prova-nel-browser/telefoni-finti.js?" + Date.now())).text(); (0, eval)(tf.split("// ===== ESEMPIO =====")[0]);
        const stat = {}; window.__statFinte = (n, g) => g === "astafanta" ? stat : {};
        const P = await window.apriTel("Paky", { x: 0 });
        const f = document.getElementById("tel-Paky"); f.style.cssText += ";left:0;top:0;transform:none;z-index:9999;width:" + L + "px;height:" + H + "px"; P.dispatchEvent(new P.Event("resize"));
        await P.SGCuore.caricaPezzo("asta");
        const id = k => "fc" + P.SG_FANTA_IDS[k];
        stat.al_oggi = {};
        stat.al_oggi[id("Martinez L. (Inter)")] = [2, 28, 9, 19, 1, 0, 3, 192, 231, 1, 1, 0, 0, 1, 105, "2026-11-12|Cagliari|1"];
        stat.al_oggi[id("Barella (Inter)")] = [1, 14, 14, 14, 0, 0, 1, 65, 75, 0, 1, 0, 0, 0, 75, "2026-11-20|Lecce|0"];
        stat.al_oggi[id("Thuram (Inter)")] = [0, 0, 0, 0, 1, 0, 1, 60, 60, 0, 0, 0, 0, 0, 60, "2026-11-21|Torino|0"];
        ["Bastoni (Inter)", "Dimarco (Inter)", "Calhanoglu (Inter)", "Meret (Napoli)", "McTominay (Napoli)", "Hojlund (Napoli)", "Svilar (Roma)", "Dybala (Roma)", "Yildiz (Juventus)", "Bremer (Juventus)", "Modric (Milan)", "Pulisic (Milan)"].forEach((k, i) => { if (P.SG_FANTA_IDS[k]) stat.al_oggi[id(k)] = [1, 5 + i, 5 + i, 5 + i, 0, 0, 1, 64, 70, 0, 0, 0, 0, 0, 70, "2026-11-20|Lecce|0"]; });
        stat.al_201718 = {}; stat.al_201718[id("Barella (Inter)")] = [1, 3, 3, 3, 0, 0, 2, 120, 126, 0, 0, 1, 0, 1, 66, "2026-11-18|Genoa|0"];
        window.__P = P;
      }, [L, H]);
      const scatta = async n => { await p.waitForTimeout(700); await p.screenshot({ path: path.join(DOVE, n + "-" + L + "x" + H + ".png"), clip: { x: 0, y: 0, width: L, height: H } }); console.log(n + " " + L + "x" + H); };
      await p.evaluate(() => { const g = __P.SGCuore.giochi.filter(y => y.id === "astafanta")[0]; __P.SGCuore.schermataModo(g); }); await scatta("1-mini-asta");
      await p.evaluate(() => __P.SGCuore.schermataSfide()); await scatta("2-trofei");
      await p.evaluate(() => __P.document.querySelectorAll(".alb-tab button")[1].click()); await p.waitForTimeout(800); await scatta("3-album");
      await p.evaluate(() => [...__P.document.querySelectorAll(".alb-tess")].find(b => /Inter/.test(b.textContent)).click()); await p.waitForTimeout(1200); await scatta("4-pagina-inter");
      await p.evaluate(() => [...__P.document.querySelectorAll(".alb-slot")].find(b => b.__c && b.__c.nome === "Barella").click()); await p.waitForTimeout(400);
      await p.evaluate(() => { const f = __P.document.querySelector(".alb-foglio"); if (f) f.scrollTop = 9999; }); await scatta("5-scheda-barella");
      await p.evaluate(() => { __P.document.querySelector(".alb-foglio .chiudi").click(); __P.document.querySelector(".schermata .testa button").click(); }); await p.waitForTimeout(400);
      await p.evaluate(() => __P.document.querySelector(".alb-stag").click()); await scatta("6-scaffale");
    }
  } finally { await b.close(); }
})();

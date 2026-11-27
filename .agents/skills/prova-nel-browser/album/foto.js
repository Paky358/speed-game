// 📒 LE FOTO DELLE PROPOSTE DELL'ALBUM (27 nov 2026). Edge invisibile, uno strumento alla volta (stessa fila di prova.js).
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\album\foto.js --porta 8998 --dove D:\SG-album-prove\foto [--solo nome]
// (il server della copia acceso sulla porta). Usa album/prototipo.js: le figurine prese e i numeri «con te» sono FINTI.
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) { const v = process.argv[i + 1]; arg[process.argv[i].slice(2)] = (v === undefined || v.startsWith("--")) ? "1" : v; }
const BASE = "http://localhost:" + (arg.porta || 8998), DOVE = arg.dove || path.join(__dirname, "foto");
fs.mkdirSync(DOVE, { recursive: true });
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia); process.on("SIGINT", () => { lascia(); process.exit(130); });
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto-album");
  let detto = false;
  for (;;) {
    const vivi = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; });
    if (vivi[0] === path.basename(mioLock)) return;
    if (!detto) { console.log("⏳ in fila dietro: " + vivi[0]); detto = true; }
    await new Promise(r => setTimeout(r, 2000));
  }
}
// le foto: [file, scena, scelta, opzioni, scorri (px), scheda (nome del calciatore)]
const FOTO = [
  ["1-dove-A-mini-asta", "modo"], ["1-dove-B-profilo", "profilo"], ["1-dove-C-avviso", "avviso"],
  ["2-giro-A-indice", "indice", "A"], ["2-giro-B-sfoglia", "sfoglia", "A", { sq: "Napoli" }], ["2-giro-C-lista", "lista", "A", {}, 380],
  ["3-pagina-A-insieme", "squadra", "A", { sq: "Inter" }], ["3-pagina-B-per-ruolo", "squadra", "B", { sq: "Inter" }, 200],
  ["4-mancanti-A-sagoma", "squadra", "A", { sq: "Juventus", mancante: "A" }], ["4-mancanti-B-numero", "squadra", "A", { sq: "Juventus", mancante: "B" }], ["4-mancanti-C-dorso", "squadra", "A", { sq: "Juventus", mancante: "C" }],
  ["5-scheda-A-quadretti", "squadra", "A", { sq: "Inter" }, 0, ["Martinez L.", "A"]], ["5-scheda-B-righe", "squadra", "A", { sq: "Inter" }, 0, ["Martinez L.", "B"]], ["5-scheda-C-con-tutte-le-stagioni", "squadra", "A", { sq: "Inter" }, 0, ["Martinez L.", "C"]], ["5-scheda-mai-presa", "squadra", "A", { sq: "Inter" }, 0, ["Akanji", "A"]],
  ["6-stagioni-A-linguette", "indice", "A", { linguette: true }], ["6-stagioni-B-scaffale", "scaffale"], ["6-stagioni-pagina-2017-18", "squadra", "A", { sq: "Napoli", stag: "2017-18" }]
];
const TEL = [[360, 640], [412, 915]];
(async () => {
  await turno();
  const browser = await chromium.launch({ channel: "msedge", headless: !arg.vedi, args: ["--disable-gpu", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"] });
  const diario = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 2, serviceWorkers: "block" });
    const page = await ctx.newPage();
    page.on("pageerror", e => diario.push("❗ errore pagina: " + e.message));
    await page.goto(BASE + "/sw.js", { waitUntil: "load" });
    await page.evaluate(async () => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      const p = await (await fetch("/.agents/skills/prova-nel-browser/album/prototipo.js?" + Date.now())).text(); (0, eval)(p);
      const tf = await (await fetch("/.agents/skills/prova-nel-browser/telefoni-finti.js?" + Date.now())).text(); (0, eval)(tf.split("// ===== ESEMPIO =====")[0]);
      await window.apriTel("Paky", { x: 0 });
      const f = document.getElementById("tel-Paky"); f.style.left = "0px"; f.style.top = "0px"; f.style.transform = "none"; f.style.zIndex = 9999;
      await window.ALB.prepara();
    });
    for (const [L, H] of TEL) {
      for (const [file, scena, scelta, opz, scorri, scheda] of FOTO) {
        if (arg.solo && file.indexOf(arg.solo) < 0) continue;
        const info = await page.evaluate(async ([L, H, scena, scelta, opz, scorri, scheda]) => {
          const f = document.getElementById("tel-Paky"); f.style.width = L + "px"; f.style.height = H + "px";
          const w = f.contentWindow; w.dispatchEvent(new w.Event("resize")); await new Promise(r => setTimeout(r, 250));
          opz = opz || {};
          await window.ALB.stagione(opz.stag || null); window.ALB.stag = opz.stag || null;
          const ab = window.ALB.album();
          if (scheda) { const c = window.ALB.trova(scheda[0]); if (c) c.preso = scheda[0] !== "Akanji"; }
          window.ALB.mancante = opz.mancante || "A";
          await window.ALB.scena(scena, scelta, opz);
          const sc = w.document.querySelector(".schermata .contenuto");
          if (scorri && sc) { sc.scrollTop = scorri; w.scrollTo(0, scorri); }
          await new Promise(r => setTimeout(r, 900));
          if (scheda) { const c = window.ALB.trova(scheda[0]); window.ALB.scheda(c, scheda[1]); await new Promise(r => setTimeout(r, 500)); if (scheda[1] === "C") { const fg = w.document.querySelector(".alb-foglio"); if (fg) fg.scrollTop = 99999; await new Promise(r => setTimeout(r, 200)); } }
          const doc = w.document, fuori = [];
          doc.querySelectorAll(".alb-tess .tx b, .alb-vuota .nm, .alb-sk-tit, .alb-righe b, .alb-num b, .alb-entra b, .alb-entra span").forEach(e => { if (e.scrollWidth > e.clientWidth + 1) fuori.push(e.textContent.slice(0, 30)); });
          const larga = doc.documentElement.scrollWidth > w.innerWidth + 1;
          return { tempi: window.ALB.tempi(), fuori, larga, figurine: ab.tutte.length };
        }, [L, H, scena, scelta || "A", opz || {}, scorri || 0, scheda || null]);
        const out = path.join(DOVE, file + "-" + L + "x" + H + ".png");
        await page.screenshot({ path: out, clip: { x: 0, y: 0, width: L, height: H } });
        const r = file + " " + L + "x" + H + (info.tempi ? " · figurine disegnate " + info.tempi.n + " (una " + info.tempi.med + " ms, la più lenta " + info.tempi.max + " ms)" : "") + (info.fuori.length ? " · ✂️ tagliati: " + info.fuori.join(" | ") : "") + (info.larga ? " · ↔️ la pagina scorre di lato" : "");
        diario.push(r); console.log(r);
      }
    }
  } finally { fs.writeFileSync(path.join(DOVE, "diario.txt"), diario.join("\n") + "\n"); await browser.close(); lascia(); }
})();

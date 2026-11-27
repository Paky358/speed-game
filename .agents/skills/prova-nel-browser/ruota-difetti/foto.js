// LE FOTO DELLA RUOTA DELLA FORTUNA (caccia ai difetti, 23 nov 2026). Edge invisibile, uno strumento alla volta (stessa fila di prova.js).
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\bj-tavolo\foto.js --porta 8940 --dove D:\SG-bj-prove\difetti\prima
//      [--copione online|bot|locale] [--n 4] [--pre prefisso] [--solo 360|412]
// (il server della copia acceso sulla porta). Ogni foto su due telefoni: basso 360x640 e alto 412x915. Scrive anche diario.txt.
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) { const v = process.argv[i + 1]; arg[process.argv[i].slice(2)] = (v === undefined || v.startsWith("--")) ? "1" : v; }
const BASE = "http://localhost:" + (arg.porta || 8940), DOVE = arg.dove || path.join(__dirname, "foto");
fs.mkdirSync(DOVE, { recursive: true });
const DIARIO = path.join(DOVE, "diario.txt");
function scriviD(r) { fs.appendFileSync(DIARIO, r + "\n"); console.log(r); }
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia); process.on("SIGINT", () => { lascia(); process.exit(130); });
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto-ruota");
  let detto = false;
  for (;;) {
    const vivi = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; });
    if (vivi[0] === path.basename(mioLock)) return;
    if (!detto) { console.log("⏳ in fila dietro: " + vivi[0]); detto = true; }
    await new Promise(r => setTimeout(r, 2000));
  }
}
(async () => {
  await turno();
  const browser = await chromium.launch({ channel: "msedge", headless: !arg.vedi, args: ["--disable-gpu", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "--disable-features=IntensiveWakeUpThrottling,CalculateNativeWinOcclusion", "--autoplay-policy=no-user-gesture-required"] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1900, height: 1000 }, deviceScaleFactor: 2, serviceWorkers: "block" });
    const page = await ctx.newPage();
    page.on("pageerror", e => scriviD("❗ errore pagina: " + e.message));
    page.on("console", m => { if (m.type() === "error" && !/vibrate|favicon|404|i\.imgflip/.test(m.text())) scriviD("❗ console: " + m.text().slice(0, 200)); });
    const quale = arg.copione || "online", N = +(arg.n || 4), MIS = arg.mis ? arg.mis.split("x").map(Number) : arg.solo === "412" ? [412, 915] : [360, 640];
    const PRE = arg.pre || quale + (quale === "online" ? N : "") + "-";
    let nf = 0;
    async function scatta(nome, file, L, H) {
      await page.evaluate(([n]) => {
        document.querySelectorAll("iframe").forEach(f => { f.style.zIndex = f.id === "tel-" + n ? 9999 : 1; f.style.visibility = f.id === "tel-" + n ? "visible" : "hidden"; });
        const f = document.getElementById("tel-" + n); if (f) { f.__vec = f.__vec || f.style.left + "|" + f.style.top; f.style.left = "0px"; f.style.top = "0px"; f.style.transform = "none"; }
      }, [nome]);
      await page.waitForTimeout(120);
      await page.screenshot({ path: path.join(DOVE, file + ".png"), clip: { x: 0, y: 0, width: L, height: H } });
      const info = await page.evaluate(n => {
        const w = window.finestra(n); if (!w) return "(niente)";
        const d = w.document, tx = (d.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 240), pb = [];
        const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== "hidden" && +getComputedStyle(e).opacity > 0.05;
        d.querySelectorAll(".ru-sopra *, .ru-azioni *, .ru-qwerty .ru-btn, .ru-stato, .ru-msg, .ru-cat, .ru-striscia *, .stp-chip, .stp-chip *, .ru-quadro *").forEach(e => {
          if (!vis(e) || !e.childElementCount && !e.textContent.trim()) return;
          const r = e.getBoundingClientRect();
          if (r.right > w.innerWidth + 1 || r.left < -1 || r.bottom > w.innerHeight + 1 || r.top < -1) pb.push("FUORI " + (e.className || e.tagName) + "«" + e.textContent.trim().slice(0, 18) + "»");
          else if (e.scrollWidth > e.clientWidth + 2 && /hidden|clip/.test(getComputedStyle(e).overflow + getComputedStyle(e).textOverflow)) pb.push("TAGLIATO " + (e.className || e.tagName) + "«" + e.textContent.trim().slice(0, 18) + "»");
        });
        const al = d.querySelector(".ru-alto.on .ru-piatto-alto");
        if (al && vis(al)) { const a = al.getBoundingClientRect(); d.querySelectorAll(".ru-stato, .ru-msg, .ru-tab, .ru-cat, .ru-azioni button, .ru-qwerty, .stp-chip").forEach(e => { if (!vis(e)) return; const r = e.getBoundingClientRect(); const ix = Math.min(a.right, r.right) - Math.max(a.left, r.left), iy = Math.min(a.bottom, r.bottom) - Math.max(a.top, r.top); if (ix > 6 && iy > 6) pb.push("RUOTA SOPRA " + (e.className || e.tagName).split(" ")[0]); });
          if (a.top < -1 || a.bottom > w.innerHeight + 1) pb.push("RUOTA TAGLIATA (" + Math.round(a.top) + "-" + Math.round(a.bottom) + ")"); }
        const kb = d.querySelector(".ru-qwerty"); const kbOn = kb && vis(kb) && [].some.call(kb.querySelectorAll(".ru-btn"), b => vis(b));
        const se = d.scrollingElement; if (se && se.scrollHeight > w.innerHeight + 2) pb.push("SCORRE " + se.scrollHeight);
        const num = (tx.match(/(?<![\d.])\d{4,}(?![\d.])/g) || []).filter(x => !/^(19|20)\d\d$/.test(x));
        if (num.length) pb.push("NUMERI SENZA PUNTO " + num.join(","));
        return (kbOn ? "⌨️ " : "") + tx + (pb.length ? " · ⚠️ " + [...new Set(pb)].slice(0, 8).join(" | ") : "");
      }, nome);
      await page.evaluate(() => { document.querySelectorAll("iframe").forEach(f => { f.style.visibility = "visible"; if (f.__vec) { var p = f.__vec.split("|"); f.style.left = p[0]; f.style.top = p[1]; delete f.__vec; } }); });
      scriviD("📸 " + file + " · " + nome + " · " + info);
    }
    await page.exposeFunction("__foto", async (nome, cosa) => {
      const k = String(++nf).padStart(2, "0"), f = PRE + k + "-" + String(cosa).replace(/[^\w-]/g, "");
      await scatta(nome, f + "-" + MIS[0], MIS[0], MIS[1]);
    });
    await page.goto(BASE + "/sw.js", { waitUntil: "load" });
    fs.writeFileSync(DIARIO, "Copione " + quale + " in " + N + " · " + new Date().toISOString() + "\n");
    const AMICI = ["Giulia", "Luca", "Sara", "Marco", "Ugo", "Rita", "Teo"].slice(0, Math.max(0, N - 1));
    const r = await page.evaluate(async ([quale, N, AMICI, MIS]) => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      await window.COPIONE.carica("preferiti/ruota2.js");
      await window.COPIONE.carica("ruota-difetti/scene.js");
      window.RDF.misura = MIS;
      window.COPIONE.aiuti.pulisci && window.COPIONE.aiuti.pulisci();
      try {
        if (quale === "bot") return await RDF.bot(N);
        if (quale === "locale") return await RDF.locale(["Paky", "Giulia", "Luca"].slice(0, Math.max(2, N)));
        return await RDF.online(AMICI, { guarda: N >= 3 ? "Dina" : null, tardi: N >= 4 ? "Bea" : null });
      } catch (e) { return "❗ " + (e && e.message || e) + " · " + (RDF.log || []).join(" | "); }
    }, [quale, N, AMICI, MIS]);
    scriviD("✅ " + r);
  } catch (e) { scriviD("❗ " + (e && e.stack || e)); }
  finally { await browser.close(); lascia(); }
})();

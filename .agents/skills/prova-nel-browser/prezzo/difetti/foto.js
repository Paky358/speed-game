// 📸 FOTO DEL PREZZO È GIUSTO (20 nov 2026, chat «🏷️ Il Prezzo è Giusto», caccia ai difetti): fa girare uno scenario del
// copione in Edge invisibile e fotografa i telefoni quando lo scenario lo chiede con `await W.scatta(nome, file)`.
// Uso (server della copia acceso; un solo strumento alla volta sul PC, come prova.js: si mette in fila da solo):
//   "C:\Program Files\nodejs\node.exe" foto.js <porta> <cartella delle foto> <scenario> [file da caricare, con la virgola] [opzioni JSON]
//   es. ... foto.js 8991 D:\SG-prezzo-prove\foto pfi prezzo/base.js,prezzo/difetti/scene.js '{"coppie":[["spesa","dadi"]]}'
// Negli scenari: W.misuraTel(nome, L, A, x) mette il telefono alla misura vera (senza rimpicciolirlo), W.scatta(nome, file)
// aspetta la foto (<cartella>/<file>.png), W.__pfOpz = le opzioni JSON. Senza questo strumento (prova.js) W.scatta non fa niente.
const fs = require("fs"), path = require("path");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const PORTA = +(process.argv[2] || 8991), DOVE = process.argv[3] || "foto", SCEN = process.argv[4] || "pfi";
const CARICA = (process.argv[5] || "prezzo/base.js,prezzo/difetti/scene.js").split(",").filter(Boolean);
const OPZ = process.argv[6] ? JSON.parse(process.argv[6]) : {};
const TIMEOUT = +(OPZ.timeout || 1500);
fs.mkdirSync(DOVE, { recursive: true });

// la fila di prova.js: un Edge alla volta su tutto il PC
const CODA = "C:/Users/joetr/sg-strumenti/coda"; let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia); process.on("SIGINT", () => { lascia(); process.exit(130); });
async function turno() {
  try { fs.mkdirSync(CODA, { recursive: true }); } catch (e) {}
  mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, String(process.pid));
  for (let detto = false; ;) {
    const vivi = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; });
    if (vivi[0] === path.basename(mioLock)) return;
    if (!detto) { console.log("⏳ aspetto il mio turno…"); detto = true; }
    await new Promise(r => setTimeout(r, 2000));
  }
}

const PONTE = `
  var W = window; W.__fotoAttiva = true; W.__codaFoto = []; W.__fatteFoto = {};
  W.scatta = async function (nome, file) { W.__codaFoto.push({ nome: nome, file: file }); var t = Date.now(); while (!W.__fatteFoto[file] && Date.now() - t < 15000) await new Promise(function (r) { setTimeout(r, 50); }); };
`;

(async () => {
  await turno();
  const b = await chromium.launch({ channel: "msedge", args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "--disable-features=IntensiveWakeUpThrottling,CalculateNativeWinOcclusion", "--autoplay-policy=no-user-gesture-required", "--disable-gpu"] });
  try {
    const ctx = await b.newContext({ viewport: { width: 3300, height: 1000 }, deviceScaleFactor: +(OPZ.dsf || 2), serviceWorkers: "block" });
    const p = await ctx.newPage(); p.on("pageerror", e => console.log("errore della pagina: " + e.message));
    p.on("console", m => { if (m.type() === "log" && /^\[pf\]/.test(m.text())) console.log(m.text()); });
    await p.goto("http://localhost:" + PORTA + "/sw.js");
    await p.evaluate(async ([ponte, carica, scen, opz]) => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      (0, eval)(ponte); window.__pfOpz = opz;
      for (const c of carica) await window.COPIONE.carica(c);
      window.__esito = null; window.COPIONE.prova(scen).then(r => { window.__esito = "OK · " + r; }, e => { window.__esito = "NO · " + (e && e.message || e); });
    }, [PONTE, CARICA, SCEN, OPZ]);
    let fatte = 0; const fino = Date.now() + TIMEOUT * 1000;
    while (Date.now() < fino) {
      const st = await p.evaluate(() => ({ c: window.__codaFoto.shift() || null, e: window.__esito }));
      if (st.c) {
        await p.waitForTimeout(60);
        try { await p.locator("#tel-" + st.c.nome).screenshot({ path: path.join(DOVE, st.c.file + ".png") }); fatte++; }
        catch (e) { console.log("foto non riuscita " + st.c.file + ": " + e.message.split("\n")[0]); }
        await p.evaluate(f => { window.__fatteFoto[f] = 1; }, st.c.file);
        continue;
      }
      if (st.e) { console.log(SCEN + " " + st.e); break; }
      await p.waitForTimeout(80);
    }
    if (Date.now() >= fino) console.log(SCEN + " NO · tempo scaduto");
    // il diario delle foto (se lo scenario lo tiene: W.__pfLog), accanto alle foto
    const diario = await p.evaluate(() => window.__pfLog || null).catch(() => null);
    if (diario) fs.writeFileSync(path.join(DOVE, (OPZ.nome || SCEN) + "-diario.json"), JSON.stringify(diario, null, 1));
    console.log("foto: " + fatte + " in " + DOVE);
    await ctx.close();
  } finally { await b.close().catch(() => {}); lascia(); }
})();

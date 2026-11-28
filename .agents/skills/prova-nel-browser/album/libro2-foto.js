// 📖🏟️ LE FOTO DEL LIBRO «IN TEMA STADIO» (28 nov 2026). Edge invisibile, uno strumento alla volta (stessa fila di prova.js).
// Uso: node .agents\skills\prova-nel-browser\album\libro2-foto.js --porta 8977 --dove D:\SG-album-prove\libro2\foto [--liv ABC] [--misure 360x640,412x915] [--solo momenti|squadre|girato|misura]
// Scrive diario.txt (errori, misure col computer rallentato ×4).
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) { const v = process.argv[i + 1]; arg[process.argv[i].slice(2)] = (v === undefined || v.startsWith("--")) ? "1" : v; }
const BASE = "http://localhost:" + (arg.porta || 8977), DOVE = arg.dove || path.join(__dirname, "libro2-foto"), LIVS = (arg.liv || "ABC").split("");
const MISURE = (arg.misure || "360x640,412x915").split(",").map(m => m.split("x").map(Number)), SOLO = arg.solo ? arg.solo.split(",") : null;
const vuoi = n => !SOLO || SOLO.includes(n);
const SEI = ["Inter", "Milan", "Napoli", "Roma", "Juventus", "Fiorentina"];
fs.mkdirSync(DOVE, { recursive: true });
const CODA = "C:/Users/joetr/sg-strumenti/coda"; let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia);
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto-libro2");
  for (;;) { const v = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; }); if (v[0] === path.basename(mioLock)) return; await new Promise(r => setTimeout(r, 2000)); }
}
async function telefono(b, L, H, diario) {
  const ctx = await b.newContext({ viewport: { width: Math.max(1000, L), height: Math.max(1000, H) }, deviceScaleFactor: 2, serviceWorkers: "block" }), p = await ctx.newPage();
  p.on("pageerror", e => diario.push("❗ " + e.message));
  await p.goto(BASE + "/sw.js");
  await p.evaluate(async ([L, H]) => {
    const tf = await (await fetch("/.agents/skills/prova-nel-browser/telefoni-finti.js?" + Date.now())).text(); (0, eval)(tf.split("// ===== ESEMPIO =====")[0]);
    for (const f of ["copione-prova.js", "album/prototipo.js", "album/libro2.js"]) { const s = await (await fetch("/.agents/skills/prova-nel-browser/" + f + "?" + Date.now())).text(); (0, eval)(s); }
    await window.apriTel("Paky", { x: 0 });
    const f = document.getElementById("tel-Paky"); f.style.cssText += ";left:0;top:0;transform:none;z-index:9999;width:" + L + "px;height:" + H + "px";
    await window.LIB2.prepara(); const P = window.ALB.P(); P.dispatchEvent(new P.Event("resize"));
    const ab = window.ALB.album();
    ab.per.Napoli.forEach(x => { x.preso = true; });                       // (il Napoli: tutta tranne l'ultima, che vola e la completa)
    const nd = ab.per.Napoli.filter(x => x.ruolo === "D"); window.__ULTIMA = nd[nd.length - 1].nome; nd[nd.length - 1].preso = false;
    ab.per.Roma.forEach(x => { x.preso = true; }); const ra = ab.per.Roma.filter(x => x.ruolo === "A"); ra[ra.length - 1].preso = false;   // (Roma: «Ne manca 1!»)
    ab.per.Torino.forEach(x => { x.preso = true; });                       // (il Torino completo: bordo d'oro nell'indice)
    const m = window.ALB.trova("Martinez L."); if (m) m.preso = true;
    const im = ab.per.Inter.filter(x => !x.preso && x.ruolo === "D"); window.__NUOVA = im[0].nome; window.__MANCA = im[1] ? im[1].nome : im[0].nome;
  }, [L, H]);
  return { ctx, p };
}
(async () => {
  await turno();
  const b = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"] });
  const diario = [];
  try {
    for (const liv of LIVS) for (const [L, H] of MISURE) {
      const { ctx, p } = await telefono(b, L, H, diario);
      const ev = (f, a) => p.evaluate(f, a);
      await ev(l => { LIB2.liv = l; }, liv);
      const scatta = async (n, ms) => { await p.waitForTimeout(ms == null ? 500 : ms); await p.screenshot({ path: path.join(DOVE, liv + "-" + n + "-" + L + "x" + H + ".png"), clip: { x: 0, y: 0, width: L, height: H } }); diario.push(liv + " " + n + " " + L + "x" + H); };
      if (vuoi("momenti")) {
        await ev(() => LIB2.copertina()); await scatta("01-copertina");
        if (liv !== "A") { await ev(() => LIB2.accendi(0.42)); await scatta("02-luci-che-si-accendono", 100); await ev(() => LIB2.accendi()); await scatta("03-luci-accese", 200); }
        await ev(() => LIB2.apri(0.4)); await scatta("04-si-apre", 100);
        await ev(() => LIB2.indice()); await scatta("05-indice");
        await ev(() => LIB2.pagina("Inter", 1)); await scatta("06-inter-pagina-1", 800);
        await ev(() => LIB2.pagina("Inter", 2)); await scatta("07-inter-pagina-2", 800);
        await ev(() => { LIB2.pagina("Inter", 1); }); await p.waitForTimeout(600); await ev(() => LIB2.trascina(0.24)); await scatta("08-la-pagina-segue-il-dito", 200);
        await ev(() => LIB2.gira(0.2)); await scatta("09-la-pagina-gira", 100);
        await ev(() => LIB2.pagina("Inter", 2)); await p.waitForTimeout(700); await ev(() => LIB2.lucida(0.35)); await scatta("10-il-riflesso-quando-si-posa", 100);
        await ev(() => LIB2.pagina("Inter", 1)); await p.waitForTimeout(700); await ev(() => LIB2.tocca(window.__MANCA)); await scatta("11-tocchi-un-tassello-vuoto", 200);
        await ev(() => LIB2.pagina("Inter", 1)); await p.waitForTimeout(700); await ev(() => LIB2.vola(window.__NUOVA, 0.2)); await scatta("12-la-figurina-nuova-vola", 100);
        await ev(() => { ALB.P().document.querySelectorAll(".l2-vola").forEach(x => x.remove()); ALB.album().per.Inter.filter(x => x.nome === window.__NUOVA)[0].preso = false; });
        await ev(() => LIB2.pagina("Inter", 1)); await p.waitForTimeout(700); await ev(() => LIB2.vola(window.__NUOVA, 0.72)); await scatta("13-si-attacca-col-brillio", 100);
        await ev(() => { ALB.P().document.querySelectorAll(".l2-vola").forEach(x => x.remove()); ALB.album().per.Inter.filter(x => x.nome === window.__NUOVA)[0].preso = false; });
        await ev(() => LIB2.pagina("Roma", 1)); await scatta("14-ne-manca-una", 800);
        await ev(() => { ALB.album().per.Napoli.filter(x => x.nome === window.__ULTIMA)[0].preso = false; LIB2.pagina("Napoli", 1); }); await scatta("15-napoli-prima-dell-ultima", 800);
        await ev(() => LIB2.vola(window.__ULTIMA)); await ev(() => LIB2.completa(0.3)); await scatta("16-napoli-diventa-d-oro", 100);
        await ev(() => LIB2.completa(0.62)); await scatta("17-napoli-coriandoli", 100);
        await ev(() => LIB2.pagina("Napoli", 1)); await scatta("18-napoli-completa", 800);
        await ev(() => LIB2.indice()); await scatta("19-indice-dopo", 400);
      }
      if (vuoi("squadre")) for (const sq of SEI) for (const pg of [1, 2]) { await ev(([s, g]) => LIB2.pagina(s, g), [sq, pg]); await scatta("sq-" + sq + "-" + pg, 700); }
      if (vuoi("misura") && L === 360) {   // ⏱️ la pagina che gira col computer rallentato ×4
        const cdp = await ctx.newCDPSession(p);
        await ev(() => LIB2.pagina("Inter", 1)); await p.waitForTimeout(800);
        const t0 = await ev(() => [LIB2.tempoPagina("Inter", 1), LIB2.tempoPagina("Inter", 2)]);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        const tp = await ev(() => [LIB2.tempoPagina("Inter", 1), LIB2.tempoPagina("Napoli", 1)]);
        const m1 = await ev(() => LIB2.misura()), m2 = await ev(() => LIB2.misura()), m3 = await ev(() => LIB2.misura());
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        diario.push("⏱️ " + liv + " nascita di una pagina (ms, computer normale): " + JSON.stringify(t0) + " · ×4: " + JSON.stringify(tp));
        diario.push("⏱️ " + liv + " pagina che gira col computer ×4 (620 ms): Inter 1→2 " + JSON.stringify(m1) + " · Inter 2→Juventus 1 " + JSON.stringify(m2) + " · Juventus 1→2 " + JSON.stringify(m3) + " (lenti = sopra i 34 ms)");
      }
      await ctx.close();
    }
    if (vuoi("girato")) for (const liv of LIVS.filter(l => l !== "A")) for (const [L, H] of [[640, 360], [915, 412]]) {   // 📱↔️ col telefono girato
      const { ctx, p } = await telefono(b, L, H, diario);
      await p.evaluate(l => { LIB2.liv = l; }, liv);
      for (const sq of ["Inter", "Napoli"]) { await p.evaluate(s => LIB2.doppia(s), sq); await p.waitForTimeout(900); await p.screenshot({ path: path.join(DOVE, liv + "-girato-" + sq + "-" + L + "x" + H + ".png"), clip: { x: 0, y: 0, width: L, height: H } }); diario.push(liv + " girato " + sq + " " + L + "x" + H); await p.evaluate(() => LIB2.chiudiDoppia()); }
      await ctx.close();
    }
  } finally { fs.writeFileSync(path.join(DOVE, "diario.txt"), diario.join("\n") + "\n"); console.log(diario.filter(x => /❗|⏱/.test(x)).join("\n")); await b.close(); lascia(); }
})();

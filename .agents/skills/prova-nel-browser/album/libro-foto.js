// 📖 LE FOTO DEL LIBRO, DEGLI SCUDETTI E DELL'ICONA (28 nov 2026). Edge invisibile, uno strumento alla volta (stessa fila di prova.js).
// Uso: node .agents\skills\prova-nel-browser\album\libro-foto.js --porta 8998 --dove D:\SG-album-prove\libro\foto
// Misura anche la pagina che gira col computer rallentato ×4 (diario.txt).
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) { const v = process.argv[i + 1]; arg[process.argv[i].slice(2)] = (v === undefined || v.startsWith("--")) ? "1" : v; }
const BASE = "http://localhost:" + (arg.porta || 8998), DOVE = arg.dove || path.join(__dirname, "libro-foto");
fs.mkdirSync(DOVE, { recursive: true });
const CODA = "C:/Users/joetr/sg-strumenti/coda"; let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia);
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto-libro");
  for (;;) { const v = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; }); if (v[0] === path.basename(mioLock)) return; await new Promise(r => setTimeout(r, 2000)); }
}
(async () => {
  await turno();
  const b = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"] });
  const diario = [];
  try {
    for (const [L, H] of [[360, 640], [412, 915]]) {
      const ctx = await b.newContext({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 2, serviceWorkers: "block" }), p = await ctx.newPage();
      p.on("pageerror", e => diario.push("❗ " + e.message));
      await p.goto(BASE + "/sw.js");
      await p.evaluate(async ([L, H]) => {
        const tf = await (await fetch("/.agents/skills/prova-nel-browser/telefoni-finti.js?" + Date.now())).text(); (0, eval)(tf.split("// ===== ESEMPIO =====")[0]);
        for (const f of ["copione-prova.js", "album/prototipo.js", "album/libro.js"]) { const s = await (await fetch("/.agents/skills/prova-nel-browser/" + f + "?" + Date.now())).text(); (0, eval)(s); }
        await window.apriTel("Paky", { x: 0 });
        const f = document.getElementById("tel-Paky"); f.style.cssText += ";left:0;top:0;transform:none;z-index:9999;width:" + L + "px;height:" + H + "px";
        await window.LIB.prepara(); const P = window.ALB.P(); P.dispatchEvent(new P.Event("resize"));
        const c = window.ALB.trova("Martinez L."); if (c) c.preso = true;
      }, [L, H]);
      const ev = (f, a) => p.evaluate(f, a);
      const scatta = async (n, ms) => { await p.waitForTimeout(ms || 600); await p.screenshot({ path: path.join(DOVE, n + "-" + L + "x" + H + ".png"), clip: { x: 0, y: 0, width: L, height: H } }); diario.push(n + " " + L + "x" + H); };
      // 📖 il libro
      await ev(() => LIB.copertina()); await scatta("3-libro-1-copertina");
      await ev(() => LIB.apri(0.38)); await scatta("3-libro-2-si-apre", 200);
      await ev(() => LIB.indice()); await scatta("3-libro-3-indice");
      await ev(() => LIB.pagina("Inter")); await scatta("3-libro-4-pagina-inter", 900);
      await ev(() => LIB.gira(0.42)); await scatta("3-libro-5-pagina-che-gira", 300);
      await ev(() => LIB.pagina("Inter")); await p.waitForTimeout(700); await ev(() => LIB.vola("Martinez L.", 0.5)); await scatta("3-libro-6-figurina-che-vola", 100);
      await ev(() => ALB.P().document.querySelectorAll(".lib-vola").forEach(x => x.remove()));
      // 🛡️ gli scudetti nell'album di adesso (l'indice delle squadre)
      await ev(async () => { await ALB.scena("indice", "A"); const P = ALB.P(); P.document.querySelectorAll(".alb-tess").forEach(t => { const nm = t.querySelector(".tx b").textContent, s = t.querySelector(".stemma"); if (s) { const d = P.document.createElement("div"); d.innerHTML = P.SG_SCUDETTI.svg(nm); d.firstChild.style.cssText = "width:34px;height:auto;flex:0 0 auto"; s.replaceWith(d.firstChild); } }); });
      await scatta("2-scudetti-nell-indice");
      // 📒 l'icona nei tre posti: i Trofei, la Mini Asta, l'avviso
      await ev(async () => {
        const P = ALB.P(), C = P.SGCuore; C.schermataSfide(); await new Promise(r => setTimeout(r, 300));
        const t = P.document.querySelectorAll(".alb-tab button")[1]; if (t) t.innerHTML = '<span style="display:inline-block;width:22px;vertical-align:-5px">' + LIB.ICONA + "</span> Album";
        const bx = C.el("div", { class: "avviso-trofeo oro tl-oro dentro" }, [C.el("div", { class: "at-ico", html: '<span style="display:block;width:38px">' + LIB.ICONA + "</span>" }), C.el("div", { class: "at-corpo" }, [C.el("div", { class: "at-su", text: "Nell'album" }), C.el("div", { class: "at-nome", text: "2 figurine nuove" }), C.el("div", { class: "at-gioco", text: "Martinez L. e Barella" })])]);
        P.document.body.appendChild(bx);
      });
      await scatta("4-icona-trofei-e-avviso");
      await ev(async () => {
        const P = ALB.P(), C = P.SGCuore; [...P.document.querySelectorAll(".avviso-trofeo")].forEach(x => x.remove());
        const g = C.giochi.filter(y => y.id === "astafanta")[0]; C.schermataModo(g); await new Promise(r => setTimeout(r, 300));
        const r = P.document.querySelector(".alb-entra .ic"); if (r) { r.textContent = ""; r.innerHTML = '<span style="display:block;width:40px">' + LIB.ICONA + "</span>"; }
      });
      await scatta("4-icona-mini-asta");
      // ⏱️ la pagina che gira col computer rallentato ×4
      if (L === 360) {
        const cdp = await ctx.newCDPSession(p); await ev(() => LIB.pagina("Inter")); await p.waitForTimeout(800);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        const m = await ev(() => LIB.misura()); const m2 = await ev(() => LIB.misura());
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        diario.push("⏱️ pagina che gira col computer ×4: " + JSON.stringify(m) + " · di nuovo: " + JSON.stringify(m2) + " (fotogrammi in 650 ms; lenti = sopra i 34 ms)");
      }
      await ctx.close();
    }
  } finally { fs.writeFileSync(path.join(DOVE, "diario.txt"), diario.join("\n") + "\n"); console.log(diario.join("\n")); await b.close(); lascia(); }
})();

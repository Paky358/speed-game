// 🕰️ LE FOTO E LE MISURE DELLA CLASSIFICA FINO A 100 (27 nov 2026). Edge invisibile, nella stessa fila di prova.js (uno alla volta).
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\classifica\foto.js --porta 8996 --dove D:\SG-classifica-prove\dopo
// (il server della copia acceso sulla porta). Telefono «Luca» 360x640, classifica Generale con 160 profili FINTI (niente account veri):
// uno su quattro non entra da 70 giorni, uno su sette senza gettone (la faccina 🙂). SGNube.classificaGenerale è finto:
// dà i primi 100 tra quelli che SGNube.attivo lascia (con un gioco senza SGNube.attivo, quello di prima, tutti).
// Controlla (cl6): righe, il posto dentro la sua colonna (anche «100°»), nome, faccina e numeri mai uno sopra l'altro,
// nessuno che manca da più di 60 giorni, la nota; poi lo scorrimento col computer rallentato ×4 (fotogrammi oltre 50 ms).
// Foto: in cima, a metà (intorno al 50°), ai posti a 3 cifre, in fondo. Scrive diario.txt.
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) { const v = process.argv[i + 1]; arg[process.argv[i].slice(2)] = (v === undefined || v.startsWith("--")) ? "1" : v; }
const BASE = "http://localhost:" + (arg.porta || 8996), DOVE = arg.dove || path.join(__dirname, "foto");
fs.mkdirSync(DOVE, { recursive: true });
const DIARIO = path.join(DOVE, "diario.txt"); fs.writeFileSync(DIARIO, "");
function scriviD(r) { fs.appendFileSync(DIARIO, r + "\n"); console.log(r); }
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia); process.on("SIGINT", () => { lascia(); process.exit(130); });
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto-classifica");
  let detto = false;
  for (;;) {
    const vivi = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; });
    if (vivi[0] === path.basename(mioLock)) return;
    if (!detto) { console.log("⏳ in fila dietro: " + vivi[0]); detto = true; }
    await new Promise(r => setTimeout(r, 2000));
  }
}
let errori = 0;
const no = m => { errori++; scriviD("  NO  " + m); }, si = m => scriviD("  OK  " + m);
// la cosa che scorre nel telefono (la schermata o la pagina)
const SCATOLA = "(function(w){var d=w.document;return [].slice.call(d.querySelectorAll('*')).find(function(e){return e.scrollHeight>e.clientHeight+20&&/auto|scroll/.test(w.getComputedStyle(e).overflowY);})||d.scrollingElement;})";
(async () => {
  await turno();
  const browser = await chromium.launch({ channel: "msedge", headless: !arg.vedi, args: ["--disable-gpu", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2, serviceWorkers: "block" });
    const page = await ctx.newPage();
    page.on("pageerror", e => no("errore pagina: " + e.message));
    page.on("console", m => { if (m.type() === "error" && !/vibrate|favicon|404|ERR_/.test(m.text())) scriviD("❗ console: " + m.text().slice(0, 200)); });
    await page.goto(BASE + "/sw.js", { waitUntil: "load" });
    await page.evaluate(async () => { const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      const t = await (await fetch("/.agents/skills/prova-nel-browser/telefoni-finti.js?" + Date.now())).text(); (0, eval)(t.split("// ===== ESEMPIO =====")[0]);
      window.COPIONE.aiuti.pulisci(); });
    const ev = (f, a) => page.evaluate(f, a);
    await ev(() => window.apriTel("Luca", { x: 0 }));
    if (!await ev(() => window.aspetta(() => { const w = window.finestra("Luca"); return w && w.document.querySelector(".home [data-gioco]"); }, 20000))) throw new Error("la home non arriva");
    await ev(() => { const f = document.getElementById("tel-Luca"); f.style.transform = "none"; f.style.width = "360px"; f.style.height = "640px"; f.contentWindow.dispatchEvent(new f.contentWindow.Event("resize")); });
    const info = await ev(() => {
      const w = window.finestra("Luca"), N = w.SGNube, ORA = Date.now(), G = 864e5;
      const NOMI = ["Giulia", "Marco", "Sara", "Luca B", "Federica", "Antonio", "Chiara", "Davide", "Martina", "Francesco", "Alessia", "Simone", "Elena", "Matteo", "Ilaria",
        "Giuseppe", "Roberta", "Andrea", "Valentina", "Salvatore", "Noemi", "Gennaro", "Rosaria", "Vincenzo", "Teresa", "Ciro", "Anna", "Pasquale", "Carmela", "Raffaele"];
      const EMO = ["⚡", "🔥", "👑", "🚀", "⚽", "🏆", "🦊", "🐯", "🦁", "🐼", "💎", "🦄"], COL = ["rosso", "arancio", "oro", "lime", "verde", "acqua", "ciano", "blu", "viola", "magenta", "lampone", "bianco"];
      const tutte = [];
      for (let i = 0; i < 160; i++) {
        const vecchio = i % 4 === 2, senza = i % 7 === 3, tr = Math.max(0, 140 - Math.floor(i * 0.85));
        const x = { uid: "F" + i, nome: NOMI[i % NOMI.length] + (i >= NOMI.length ? " " + Math.floor(i / NOMI.length) : ""), trofei: tr,
          liv: { platino: i < 5 ? 2 : 0, diamante: Math.max(0, 6 - (i >> 4)), oro: Math.max(0, 12 - (i >> 3)), argento: Math.max(0, 20 - (i >> 3)), bronzo: 30 - (i % 30) },
          agg: ORA - (vecchio ? 70 : (i % 50) + 1) * G, emoji: "🙂" };
        if (!senza) { x.gettone = { g: 1, e: EMO[i % EMO.length], c: [COL[i % 12], COL[(i + 5) % 12]] }; x.omino = x.gettone; }
        tutte.push(x);
      }
      w.__tutte = tutte;
      N.classificaGenerale = n => Promise.resolve((N.attivo ? tutte.filter(x => N.attivo(x)) : tutte).slice(0, n || 100));
      N.richieste = () => Promise.resolve({ arrivate: [], inviate: [] });
      return { conFiltro: !!N.attivo };
    });
    scriviD("gioco " + (info.conFiltro ? "NUOVO (con i 60 giorni)" : "DI PRIMA (senza filtro)") + " · " + BASE);
    await ev(() => window.finestra("Luca").SGCuore.schermataAmici("generale"));
    if (!await ev(() => window.aspetta(() => window.finestra("Luca").document.querySelectorAll(".am-corpo .am-riga").length > 50, 10000))) no("le righe non arrivano");
    await page.waitForTimeout(800);
    const m = await ev(() => {
      const w = window.finestra("Luca"), d = w.document, ORA = Date.now();
      const righe = [].slice.call(d.querySelectorAll(".am-corpo .am-riga"));
      const r = { righe: righe.length, pos: [], fuori: [], sopra: [], vecchi: 0, nota: (d.querySelector(".am-nota") || {}).textContent || "" };
      righe.forEach(x => {
        const p = x.querySelector(".am-pos"); r.pos.push(p.textContent);
        if (p.scrollWidth > p.clientWidth + 1) r.fuori.push(p.textContent + " (" + p.scrollWidth + " > " + p.clientWidth + ")");
        const nm = x.querySelector(".am-nome").getBoundingClientRect(), num = x.querySelector(".am-num").getBoundingClientRect(), fac = x.querySelector(".am-fac").getBoundingClientRect(), pr = p.getBoundingClientRect();
        if (nm.right > num.left + 1 || nm.left < fac.right - 1 || pr.right > fac.left + 1) r.sopra.push(p.textContent);
      });
      const nomi = righe.map(x => x.querySelector(".am-nome").textContent);
      w.__tutte.forEach(x => { if (ORA - x.agg > 60 * 864e5 && nomi.indexOf(x.nome) >= 0) r.vecchi++; });
      r.alto = righe[0] ? Math.round(righe[0].getBoundingClientRect().height) : 0;
      return r;
    });
    scriviD("righe " + m.righe + " (alte " + m.alto + " px) · posti: " + m.pos.slice(0, 4).join(" ") + " … " + m.pos.slice(-4).join(" "));
    if (info.conFiltro) {
      m.righe === 101 ? si("100 posti più «tu»") : no("righe: " + m.righe + " (attese 101: 100 + tu)");
      m.vecchi === 0 ? si("nessuno che manca da più di 60 giorni") : no(m.vecchi + " in classifica non entrano da più di 60 giorni");
      /2 mesi/.test(m.nota) ? si("la nota dice dei 2 mesi") : no("la nota non dice dei 2 mesi: «" + m.nota + "»");
    } else scriviD("  (prima) in classifica " + m.vecchi + " che non entrano da più di 60 giorni");
    m.fuori.length ? no("posti che escono dalla colonna: " + m.fuori.slice(0, 6).join(", ")) : si("ogni posto sta nella sua colonna (anche a 3 cifre)");
    m.sopra.length ? no("righe con le scritte una sopra l'altra: " + m.sopra.slice(0, 6).join(", ")) : si("nome, faccina, posto e trofei mai uno sopra l'altro");
    async function foto(nome, dove) {
      await ev(([dv, S]) => { const w = window.finestra("Luca"), box = eval(S)(w), rr = w.document.querySelectorAll(".am-corpo .am-riga");
        if (dv === "cima") box.scrollTop = 0; else if (dv === "fondo") box.scrollTop = box.scrollHeight; else if (rr[dv]) rr[dv].scrollIntoView({ block: "center" }); }, [dove, SCATOLA]);
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(DOVE, nome + ".png"), clip: { x: 0, y: 0, width: 360, height: 640 } });
    }
    await foto("1-cima", "cima"); await foto("2-meta", 48); await foto("3-tre-cifre", 97); await foto("4-fondo", "fondo");
    // lo scorrimento col computer rallentato ×4: da cima a fondo, 40 px a fotogramma
    await ev(S => { eval(S)(window.finestra("Luca")).scrollTop = 0; }, SCATOLA);
    await page.waitForTimeout(400);
    const cdp = await ctx.newCDPSession(page); await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const sc = await ev(S => new Promise(fine => {
      const w = window.finestra("Luca"), box = eval(S)(w);
      let prima = performance.now(), lunghi = 0, max = 0, n = 0;
      function passo() { const ora = performance.now(), dt = ora - prima; prima = ora; if (n) { if (dt > 50) lunghi++; if (dt > max) max = dt; }
        n++; box.scrollTop += 40; if (box.scrollTop + box.clientHeight >= box.scrollHeight - 2 || n > 400) fine({ n, lunghi, max: Math.round(max) }); else w.requestAnimationFrame(passo); }
      w.requestAnimationFrame(passo);
    }), SCATOLA);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    scriviD("scorrimento ×4: " + sc.n + " fotogrammi, " + sc.lunghi + " oltre 50 ms, il più lungo " + sc.max + " ms");
    if (info.conFiltro) (sc.lunghi <= 2 ? si : no)("scorrere tutta la classifica senza scatti (" + sc.lunghi + " fotogrammi lunghi)");
  } finally { await browser.close(); lascia(); }
  scriviD(errori ? "\nNO: " + errori : "\nTUTTO OK");
  process.exit(errori ? 1 : 0);
})().catch(e => { scriviD("❗ " + e.message); lascia(); process.exit(2); });

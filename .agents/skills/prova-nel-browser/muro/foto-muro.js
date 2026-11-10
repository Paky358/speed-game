// FOTO DEL MURO — le schermate de «🧱 Il Muro» sui telefoni finti, in Edge invisibile, a misura di telefono.
// Apre la Sala con 10 telefoni (Paky + 9 amici), lancia Il Muro, 5 squadre da 2, e fotografa: la saletta (host e ospite),
// la domanda (nella stanza e giù), la rivelazione, i due muri (durante e dopo la caduta), i punteggi e (con --fine) la classifica.
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\muro\foto-muro.js [porta=8981] [cartella=D:\SG-muro\lavoro\foto-muro] [--fine] [--grande]
// (--grande: anche 412x915). Rispetta la fila di sg-strumenti (un Edge alla volta su tutto il PC).
const path = require("path");
const fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");

const arg = process.argv.slice(2);
const PORTA = +(arg.find(a => /^\d+$/.test(a)) || 8981);
const USCITA = arg.find(a => /[\\/]/.test(a)) || "D:\\SG-muro\\lavoro\\foto-muro";
const FINE = arg.includes("--fine"), GRANDE = arg.includes("--grande");
const BASE = "http://localhost:" + PORTA;

const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia); process.on("SIGINT", () => { lascia(); process.exit(130); });
async function turno() {
  try { fs.mkdirSync(CODA, { recursive: true }); } catch (e) {}
  mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock");
  fs.writeFileSync(mioLock, String(process.pid));
  let detto = false;
  for (;;) {
    const vivi = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => {
      const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false;
    });
    if (vivi[0] === path.basename(mioLock)) return;
    if (!detto) { console.log("⏳ Edge occupato da un'altra prova: aspetto il turno…"); detto = true; }
    await new Promise(r => setTimeout(r, 2000));
  }
}

const NOMI = ["Paky", "Giulia", "Luca", "Marco", "Sara", "Bea", "Tom", "Ivo", "Ada", "Gea"];

(async () => {
  fs.mkdirSync(USCITA, { recursive: true });
  await turno();
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const errori = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 3900, height: 1000 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    page.on("pageerror", e => errori.push("pageerror: " + (e && e.message || e)));
    await page.goto(BASE + "/sw.js", { waitUntil: "load" });
    await page.evaluate(async () => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      await window.COPIONE.carica("muro/muro.js");
      window.COPIONE.aiuti.pulisci();
    });
    // la Sala con 10 telefoni, a misura 360x640 uno accanto all'altro (senza la scala della pagina delle prove)
    const C = await page.evaluate(async (NOMI) => {
      const W = window, A = COPIONE.aiuti;
      const misura = (n, i) => { const f = document.getElementById("tel-" + n); f.style.transform = "none"; f.style.width = "360px"; f.style.height = "640px"; f.style.left = (i * 380) + "px"; f.style.top = "0px"; const w = f.contentWindow; w.dispatchEvent(new w.Event("resize")); };
      await W.apriTel(NOMI[0], { x: 0, salaSempre: true });
      const S = await A.apriSalaNuova(NOMI[0]);
      for (let i = 1; i < NOMI.length; i++) await W.apriTel(NOMI[i], { hash: "sala=" + S, x: 380 * i, salaSempre: true });
      NOMI.forEach(misura);
      if (!await W.aspetta(() => (A.vm(S).membri || []).length === NOMI.length, 20000)) throw new Error("nella Sala non sono in 10");
      const C = await A.lanciaDallaSala(NOMI[0], S, "Il Muro");
      if (!await W.aspetta(() => A.ids(C, "players").length === NOMI.length, 40000)) throw new Error("nella saletta non sono in 10 (" + A.ids(C, "players").length + ")");
      const P = W.finestra(NOMI[0]);
      // 5 squadre, a caso (2 a testa)
      W.clicca(P, /^5$/, ".mu-n"); await W.dorme(400);
      W.clicca(P, /A caso/, ".mu-sq-b"); await W.dorme(600);
      if (A.vm(C).nsq !== 5) throw new Error("le squadre non sono 5");
      // (le animazioni d'entrata della saletta: ferme, per la foto)
      NOMI.forEach(n => { const d = W.finestra(n).document, st = d.createElement("style"); st.textContent = ".schermata{animation:none!important}.sl-av,.sl-nome{transition:none!important}"; d.head.appendChild(st); });
      window.__C = C;
      return C;
    }, NOMI);
    async function foto(nome, chi, w, h) {
      if (w) await page.evaluate(([n, w, h]) => { const f = document.getElementById("tel-" + n); f.style.width = w + "px"; f.style.height = h + "px"; f.style.zIndex = "50"; f.contentWindow.dispatchEvent(new f.contentWindow.Event("resize")); }, [chi, w, h]);
      if (w) await page.waitForTimeout(500);
      const file = path.join(USCITA, nome + "-" + (w || 360) + "x" + (h || 640) + ".png");
      await page.locator("#tel-" + chi).screenshot({ path: file });
      // la pagina scorre? (niente scorrimento per giocare)
      const sc = await page.evaluate((n) => { const d = document.getElementById("tel-" + n).contentWindow.document.documentElement; return d.scrollHeight + "x" + d.scrollWidth + " (finestra " + d.clientHeight + "x" + d.clientWidth + ")"; }, chi);
      console.log("📸 " + file + " · pagina " + sc);
      if (w) await page.evaluate((n) => { const f = document.getElementById("tel-" + n); f.style.width = "360px"; f.style.height = "640px"; f.style.zIndex = ""; f.contentWindow.dispatchEvent(new f.contentWindow.Event("resize")); }, chi);
    }
    await page.waitForTimeout(1500);
    await foto("01-saletta-host", "Paky");
    await foto("02-saletta-ospite", "Giulia");
    if (GRANDE) await foto("01-saletta-host", "Paky", 412, 915);
    // via! (la spiegazione della prima volta: la si chiude su tutti tranne Giulia, che si fotografa)
    const ruoli = await page.evaluate(async (NOMI) => {
      const W = window, A = COPIONE.aiuti, C = window.__C, P = W.finestra(NOMI[0]);
      NOMI.forEach(n => { if (n !== "Giulia") { try { W.finestra(n).localStorage.setItem("sg-muro-spiegato", "1"); } catch (e) {} } });
      W.clicca(P, /Comincia/, ".sl-go");
      if (!await W.aspetta(() => A.vm(C).stato === "domanda", 10000)) throw new Error("non comincia");
      await W.dorme(1200);
      const v = A.vm(C), nome = id => v.players.filter(p => p.id === id)[0].nome;
      return v.sqd.map(d => ({ giu: nome(d.giu), su: d.su.map(nome) }));
    }, NOMI);
    console.log("squadre:", JSON.stringify(ruoli));
    const unoSu = ruoli[0].su[0], unoGiu = ruoli[1].giu, spiega = ruoli.map(r => r.giu).concat(ruoli.map(r => r.su[0])).indexOf("Giulia") >= 0 ? "Giulia" : null;
    if (spiega) await foto("03-spiegazione", "Giulia");
    // tocchi: le squadre 0, 2, 4 giuste e 1, 3 sbagliate; chi è giù mette 3 palline (la squadra 1 aspetta col Pronto per la foto)
    await page.evaluate(async (ruoli) => {
      const W = window, A = COPIONE.aiuti, C = window.__C;
      const tocca = (w, n) => n && n.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
      const sp = W.finestra("Giulia").document.querySelector(".mu-spiega"); if (sp) tocca(W.finestra("Giulia"), sp);
      // la risposta giusta, dal file delle domande
      const w0 = W.finestra(ruoli[0].su[0]);
      await W.aspetta(() => w0.document.querySelectorAll(".mu-ris").length > 1, 6000);
      const testo = w0.document.querySelector(".mu-testo").textContent, opz = [].map.call(w0.document.querySelectorAll(".mu-ris span"), x => x.textContent);
      let e = null; const D = w0.SG_MURO_DOM; for (const a in D) D[a].forEach(x => { if (x[1] === testo) e = x; });
      const g = opz.indexOf(e[2]);
      ruoli.forEach((r, s) => {
        r.su.forEach(n => { const w = W.finestra(n); tocca(w, w.document.querySelectorAll(".mu-ris")[s % 2 ? (g + 1) % opz.length : g]); });
        const wg = W.finestra(r.giu), z = wg.document.querySelectorAll(".mu-z");
        [[3, 4, 5], [4, 4, 1], [0, 4, 8], [2, 6], [4]][s].forEach(k => tocca(wg, z[k]));
        if (s !== 1) tocca(wg, wg.document.querySelector(".mu-pronto"));
      });
      await W.dorme(500);
    }, ruoli);
    await foto("04-domanda-stanza", unoSu);
    await foto("05-domanda-giu", unoGiu);
    if (GRANDE) { await foto("04-domanda-stanza", unoSu, 412, 915); await foto("05-domanda-giu", unoGiu, 412, 915); }
    await page.evaluate(async (ruoli) => { const W = window, wg = W.finestra(ruoli[1].giu); wg.document.querySelector(".mu-pronto").dispatchEvent(new wg.PointerEvent("pointerdown", { bubbles: true, cancelable: true })); }, ruoli);
    const aspettaStato = async (st, dopoMs) => { await page.waitForFunction((st) => (COPIONE.aiuti.vm(window.__C).stato === st), st, { timeout: 30000 }); if (dopoMs) await page.waitForTimeout(dopoMs); };
    await aspettaStato("svela", 2600);
    await foto("06-svela", "Luca");
    await aspettaStato("perdenti", 1700);
    await foto("07-perdenti-cadono", "Marco");
    await page.waitForTimeout(2300);
    await foto("08-perdenti-fermi", "Sara");
    await aspettaStato("vincitori", 1900);
    await foto("09-vincitori-cadono", "Bea");
    await page.waitForTimeout(2300);
    await foto("10-vincitori-fermi", "Tom");
    if (GRANDE) await foto("10-vincitori-fermi", "Tom", 412, 915);
    await aspettaStato("punti", 400);
    await foto("11-punti-host", "Paky");
    await foto("12-punti-ospite", "Ivo");
    if (FINE) {
      // si gioca fino in fondo (tutti rispondono giusto, una pallina in mezzo), poi la classifica
      await page.evaluate(async () => {
        const W = window, A = COPIONE.aiuti, C = window.__C, P = W.finestra("Paky"), fatto = {};
        const tocca = (w, n) => n && n.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
        const fino = Date.now() + 400000;
        while (Date.now() < fino && A.vm(C).fase !== "fine") {
          const v = A.vm(C);
          if (v.stato === "punti") { const b = P.document.querySelector(".mu-vai"); if (b) b.click(); await W.dorme(300); continue; }
          if (v.stato === "domanda" && !fatto[v.k]) {
            fatto[v.k] = 1; await W.dorme(600);
            v.sqd.forEach((d, s) => {
              const nome = id => v.players.filter(p => p.id === id)[0].nome;
              d.su.forEach(id => { const w = W.finestra(nome(id)); tocca(w, w.document.querySelectorAll(".mu-ris")[s % 2]); });
              const wg = W.finestra(nome(d.giu)); tocca(wg, wg.document.querySelectorAll(".mu-z")[4]); tocca(wg, wg.document.querySelector(".mu-pronto"));
            });
          }
          await W.dorme(200);
        }
      });
      await page.waitForTimeout(1500);
      await foto("13-classifica", "Gea");
      await foto("14-classifica-host", "Paky");
      if (GRANDE) await foto("13-classifica", "Gea", 412, 915);
    }
    const err = await page.evaluate(() => window.erroriTel());
    err.forEach(e => errori.push(e));
  } finally { await browser.close().catch(() => {}); lascia(); }
  if (errori.length) { console.log("ERRORI:\n" + errori.join("\n")); process.exitCode = 1; } else console.log("Nessun errore nei telefoni.");
})();

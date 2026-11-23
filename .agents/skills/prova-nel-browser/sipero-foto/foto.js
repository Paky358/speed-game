// LE FOTO DI «SÌ... PERÒ» (caccia ai difetti e schermata dei ruoli, 23 nov 2026). Edge invisibile, uno strumento alla volta (stessa fila di prova.js).
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\bj-tavolo\foto.js --porta 8940 --dove D:\SG-bj-prove\difetti\prima
//      [--copione squadre|solo|locale] [--n 4] [--pre prefisso] [--solo 360|412]
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
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto-sipero");
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
    page.on("console", m => { if (m.type() === "error" && !/vibrate|favicon|404/.test(m.text())) scriviD("❗ console: " + m.text().slice(0, 200)); });
    await page.goto(BASE + "/sw.js", { waitUntil: "load" });
    await page.evaluate(async () => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      await window.COPIONE.carica("migliora2/g3-sipero.js"); await window.COPIONE.carica("preferiti/sipero.js");
      window.COPIONE.aiuti.pulisci();
    });
    const ev = (f, a) => page.evaluate(f, a);
    const dorme = ms => page.waitForTimeout(ms);
    const quale = arg.copione || "squadre", N = +(arg.n || 4);
    const PRE = arg.pre || quale + (quale === "locale" ? "" : N) + "-";
    let nf = 0;
    async function scatta(nome, file, L, H) {
      await ev(([n, L, H]) => {
        document.querySelectorAll("iframe").forEach(f => { f.style.visibility = f.id === "tel-" + n ? "visible" : "hidden"; });
        const f = document.getElementById("tel-" + n); if (!f) return;
        f.__vec = f.__vec || f.style.cssText;
        f.style.left = "0px"; f.style.top = "0px"; f.style.transform = "none"; f.style.width = L + "px"; f.style.height = H + "px"; f.style.zIndex = 9999;
        const w = f.contentWindow; w.dispatchEvent(new w.Event("resize"));
      }, [nome, L, H]);
      await dorme(700);
      const ok = await ev(n => !!document.getElementById("tel-" + n), nome);
      if (ok) await page.screenshot({ path: path.join(DOVE, file + ".png"), clip: { x: 0, y: 0, width: L, height: H } });
      const info = await ev(n => {
        const w = window.finestra(n); if (!w) return "(niente)";
        const d = w.document, tx = (d.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 220);
        // cose tagliate: testi che escono dal loro riquadro o dallo schermo
        const fuori = [];
        d.querySelectorAll(".sp-scena button, .sp-turno, .sp-mio, .sp-rc-testa, .sp-rc-p, .sp-col-testa, .sp-nota").forEach(e => {
          if (!e.offsetParent || !e.childElementCount && !e.textContent.trim()) return;
          const r = e.getBoundingClientRect();
          if (r.right > w.innerWidth + 1 || r.left < -1 || r.bottom > w.innerHeight + 1) fuori.push((e.className || e.tagName) + "«" + e.textContent.trim().slice(0, 20) + "»");
          else if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== "visible") fuori.push("tagliato " + (e.className || e.tagName) + "«" + e.textContent.trim().slice(0, 20) + "»");
        });
        const sc = d.scrollingElement && d.scrollingElement.scrollHeight > w.innerHeight + 2 ? " · ⚠️ SCORRE (" + d.scrollingElement.scrollHeight + ")" : "";
        const num = (tx.match(/\b\d{4,}\b/g) || []).filter(x => !/^20\d\d$/.test(x));
        return tx + sc + (fuori.length ? " · ⚠️ FUORI: " + fuori.slice(0, 6).join(" | ") : "") + (num.length ? " · ⚠️ NUMERI SENZA PUNTO: " + num.join(",") : "");
      }, nome);
      await ev(() => { document.querySelectorAll("iframe").forEach(f => { f.style.visibility = "visible"; if (f.__vec) { f.style.cssText = f.__vec; delete f.__vec; } }); });
      scriviD("📸 " + file + " · " + nome + " · " + info);
    }
    async function due(n, f) {
      const k = String(++nf).padStart(2, "0");
      if (arg.solo !== "412") await scatta(n, PRE + k + "-" + f + "-360", 360, 640);
      if (arg.solo !== "360") await scatta(n, PRE + k + "-" + f + "-412", 412, 915);
    }
    // aspetta un momento della mano (fase, e chi gioca)
    const fino = async (cond, ms) => { const t = Date.now() + (ms || 30000); while (Date.now() < t) { if (await ev(cond)) return true; await dorme(150); } return false; };
    const passi = async (cond, ms) => { const t = Date.now() + (ms || 60000); while (Date.now() < t) { const v = await ev(() => { const v = BJT.vm(); return { fase: v.fase, turno: v.turno, g: (v.giocatori || []).map(g => g.nome) }; }); if (await ev(cond)) return true; if (v.fase === "punta") await ev(() => BJT.punta()); else if (v.fase === "assic" || v.fase === "gioca") await ev(() => BJT.turno()); await dorme(200); } return false; };
    fs.writeFileSync(DIARIO, "Copione " + quale + " in " + N + " · " + new Date().toISOString() + "\n");
    const AMICI = ["Giulia", "Luca", "Sara", "Marco", "Ugo", "Rita", "Teo", "Nina", "Elia"].slice(0, N - 1);
    await ev(() => {
      window.__vmS = function () { return COPIONE.aiuti.vm(window.__C) || {}; };
      window.__nome = function (id) { var g = (window.__vmS().giocatori || []).filter(function (x) { return x.id === id; })[0]; return g ? g.nome : null; };
      window.__membri = function (k) { var v = window.__vmS(); return Object.keys(v.assegna || {}).filter(function (id) { return v.assegna[id] === k; }).map(window.__nome).filter(Boolean); };
    });
    const vmS = () => ev(() => window.__vmS());
    const clic = (nome, sel) => ev(([n, s]) => { const w = window.finestra(n); const b = w && w.document.querySelector(s); if (b) b.click(); return !!b; }, [nome, sel]);
    const clicT = (nome, re) => ev(([n, r]) => { const w = window.finestra(n); return w ? window.clicca(w, new RegExp(r)) : false; }, [nome, re]);
    if (quale === "squadre") {
      await ev(([a]) => COPIONE.aiuti.sp.stanza(a, { round: 3 }, { ruoli: true }).then(function (x) { window.__C = x.C; }), [AMICI]);
      await dorme(1200);
      await due("Paky", "ruoli-vuota-host");
      // Giulia giudice, gli altri a turno nelle squadre, l'ultimo non sceglie
      const tutti = ["Paky"].concat(AMICI);
      for (let i = 0; i < tutti.length - 1; i++) {
        const r = tutti[i] === "Giulia" ? ".sp-rc.cg" : ".sp-rc.c" + (i % 2);
        await clic(tutti[i], r); await dorme(450);
      }
      await dorme(600);
      await due(AMICI[AMICI.length - 1], "ruoli-chi-non-ha-scelto");
      await due("Paky", "ruoli-host-pronto");
      await ev(() => COPIONE.aiuti.sp.partiRuoli(window.__C));
      await dorme(700);
      await due("Paky", "presentazione-round");
      await dorme(3000);
      let v = await vmS();
      const capo = await ev(() => { var v = window.__vmS(); return window.__nome(v.capo[v.step.sq]); });
      const turnoSq = v.step.sq, comp = (await ev(k => window.__membri(k), turnoSq)).filter(n => n !== capo)[0];
      const altri = await ev(k => window.__membri(k), 1 - turnoSq), giud = await ev(() => window.__nome(window.__vmS().giudiceId));
      await due(capo, "gioca-capo");
      if (comp) await due(comp, "gioca-compagno");
      if (altri[0]) await due(altri[0], "gioca-altra-squadra");
      await due(giud, "gioca-giudice");
      // chi arriva tardi e chi guarda
      await ev(([c]) => window.apriTel("Tom", { hash: "gioco=sipero&stanza=" + c, x: 1500, spiaSp: true }), [await ev(() => window.__C)]);
      await dorme(4000);
      await due("Tom", "arriva-tardi");
      await ev(([c]) => window.apriTel("Dina", { hash: "gioco=sipero&stanza=" + c + "&guarda=1", x: 1650, spiaSp: true }), [await ev(() => window.__C)]);
      await dorme(4000);
      await due("Dina", "guarda-col-link");
      await ev(() => COPIONE.aiuti.sp.finoArringa(window.__C));
      await dorme(800);
      await due(giud, "arringa-giudice");
      await due(capo, "arringa-squadra");
      await clicT(giud, "Tocca alla"); await dorme(500); await clicT(giud, "Al verdetto"); await dorme(900);
      await due(giud, "verdetto-giudice");
      await due(capo, "verdetto-aspetta");
      await ev(() => COPIONE.aiuti.sp.decidi(window.__C, 0));
      await dorme(700);
      await due(capo, "esito-luce");
      await dorme(3500);
      const vinti = await ev(() => window.__membri(0)), persi = await ev(() => window.__membri(1));
      await due(vinti[0], "esito-vince");
      await due(persi[0], "esito-perde");
      await due(giud, "esito-giudice-stella");
      await due("Tom", "esito-arrivato-tardi");
      // il round dopo: di nuovo i ruoli
      for (let k = 0; k < 40 && (await vmS()).fase === "esito"; k++) { for (const n of tutti) await clicT(n, "Avanti"); await dorme(700); }
      await dorme(800);
      await due("Tom", "ruoli-round2-tom");
      await due("Paky", "ruoli-round2-host");
      await ev(() => COPIONE.aiuti.sp.finoAllaFine(window.__C, 400000));
      await dorme(1500);
      await due("Paky", "fine-host");
      await due("Tom", "fine-tom");
    } else if (quale === "solo") {
      await ev(([a]) => COPIONE.aiuti.sp.stanza(a, { si: "solo" }).then(function (x) { window.__C = x.C; }), [AMICI]);
      await dorme(3500);
      const v = await vmS(), giud = await ev(() => window.__nome(window.__vmS().giudiceId)), pres = await ev(() => (window.__vmS().pres || []).map(window.__nome));
      await due(pres[0], "bonus");
      await due(giud, "bonus-giudice");
      await ev(([c]) => window.apriTel("Tom", { hash: "gioco=sipero&stanza=" + c, x: 1500, spiaSp: true }), [await ev(() => window.__C)]);
      await dorme(4000);
      await due("Tom", "bonus-arriva-tardi");
      const tutti = await ev(() => (window.__vmS().pres || []).map(window.__nome));
      for (const n of tutti) { await ev(n => COPIONE.aiuti.spLocale.gioca(window.finestra(n), 2).catch(function () {}), n); await dorme(300); }
      await dorme(1500);
      await due(tutti[0], "malus");
      for (const n of tutti) { await ev(n => COPIONE.aiuti.spLocale.gioca(window.finestra(n), 1).catch(function () {}), n); await dorme(300); }
      await dorme(2000);
      await due(tutti[0], "svela");
      await due(giud, "svela-giudice");
    } else if (quale === "locale") {
      await ev(() => COPIONE.aiuti.spLocale.avvia(["Paky", "Giulia", "Luca", "Sara"], { si: "squadre", giri: 1, bianca: 1 }));
      for (let k = 0; k < 8; k++) {
        await dorme(900);
        await due("Paky", "locale-" + k);
        const ok = await ev(() => { var w = window.finestra("Paky"); var c = w.document.querySelectorAll(".sp-carta[role=button]"); var p = w.document.querySelector(".sp-piede .btn-primario:not([disabled]), .schermata .piede .btn-primario:not([disabled])");
          if (c.length && !w.document.querySelector(".sp-carta.su")) { c[0].click(); if (c[1]) c[1].click(); return "carte"; }
          if (p) { p.click(); return p.textContent; } return ""; });
        scriviD("   tocco: " + ok);
      }
    }

    scriviD("✅ fine");
  } catch (e) { scriviD("❗ " + (e && e.stack || e)); }
  finally { await browser.close(); lascia(); }
})();

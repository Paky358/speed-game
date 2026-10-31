// Le foto di Memata per il proprietario: 4 telefoni finti affiancati in ogni momento della partita.
// node vetrina.js <porta> <cartella uscita> [larghezza telefono] [altezza telefono]
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const fs = require("fs"), path = require("path");
const [, , PORTA, OUT, LW, LH] = process.argv;
const W = +LW || 390, H = +LH || 780;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ channel: "msedge", headless: true });
  const p = await b.newPage({ viewport: { width: 4 * (W + 12) + 12, height: H + 24 }, deviceScaleFactor: 1 });
  await p.goto(`http://localhost:${PORTA}/`);
  await p.waitForTimeout(1500);
  await p.evaluate(async () => {
    const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
    await COPIONE.carica("preferiti/memata.js");
  });
  const fai = (fn, arg) => p.evaluate(fn, arg);
  const vetrina = () => fai(([W, H]) => {
    const st = document.getElementById("vetrina-st") || document.head.appendChild(Object.assign(document.createElement("style"), { id: "vetrina-st" }));
    st.textContent = "body>*:not(iframe){visibility:hidden}";
    ["Paky", "Giulia", "Luca", "Marco"].forEach((n, i) => {
      const f = document.getElementById("tel-" + n); if (!f) return;
      Object.assign(f.style, { transform: "none", left: (12 + i * (W + 12)) + "px", top: "12px", width: W + "px", height: H + "px", zIndex: 9999, borderRadius: "18px", visibility: "visible" });
      try { f.contentWindow.dispatchEvent(new Event("resize")); } catch (e) {}
    });
  }, [W, H]);
  const foto = async nome => { await vetrina(); await p.waitForTimeout(900); await p.screenshot({ path: path.join(OUT, nome) }); console.log("FOTO", nome); };
  await fai(async () => { window.Z = await MM.stanza(["Giulia", "Luca", "Marco"], { imp: { tempo: 90, giri: 2 } }); });
  await vetrina();
  await fai(async () => { const vm = COPIONE.aiuti.vm; await aspetta(() => ["Paky", "Giulia", "Luca", "Marco"].every(n => { const i = finestra(n).document.querySelector(".me-img"); return i && i.naturalWidth; }), 15000); });
  await fai(async () => {
    await MM.scrivi(finestra("Giulia"), ["quando dici «arrivo tra 5 minuti»", "e sei ancora sotto la doccia"], false);
    await MM.scrivi(finestra("Luca"), ["io il lunedì mattina", "la sveglia", "il letto"], true);
    await MM.scrivi(finestra("Marco"), ["mia mamma quando torno alle 3"], false);
  });
  await foto("1-scrivere.png");
  await fai(async () => {
    await MM.scrivi(finestra("Paky"), ["il gruppo WhatsApp alle 2 di notte", "io che volevo solo dormire"], true);
    await MM.scrivi(finestra("Giulia"), ["quando dici «arrivo tra 5 minuti»", "e sei ancora sotto la doccia"], true);
    await MM.scrivi(finestra("Marco"), ["mia mamma quando torno alle 3", "io che entro in silenzio"], true);
    await aspetta(() => COPIONE.aiuti.vm(Z.C).stato === "vota", 15000); await dorme(1200);
    MM.vota(finestra("Giulia"), 2); MM.vota(finestra("Luca"), 1);
  });
  await foto("2-votare.png");
  await fai(async () => {
    const vm = COPIONE.aiuti.vm, fino = Date.now() + 60000;
    while (Date.now() < fino && vm(Z.C).stato === "vota") { ["Paky", "Giulia", "Luca", "Marco"].forEach(n => MM.vota(finestra(n), n === "Luca" ? 1 : 2)); await dorme(300); }
    await aspetta(() => { const r = vm(Z.C).riv; return r && r.passo === r.tot - 2; }, 30000); await dorme(600);
  });
  await foto("3-rullo.png");
  await fai(async () => { await aspetta(() => { const r = COPIONE.aiuti.vm(Z.C).riv; return r && r.finito; }, 15000); await dorme(500); });
  await foto("4-vincitore.png");
  await fai(async () => {
    await MM.finoAllaFine(Z.C, ["Paky", "Giulia", "Luca", "Marco"], { voto: n => n === "Marco" ? 1 : 2, ferma: v => v.giro === 2 && v.stato === "scrivi" && ["Paky", "Giulia", "Luca", "Marco"].every(n => { const c = finestra(n).document.querySelector(".me-campo"); const i = finestra(n).document.querySelector(".me-img"); return c && c.offsetParent && i && i.naturalWidth; }) });
    await MM.scrivi(finestra("Paky"), ["quando il prof dice", "«domanda facile»"], false);
    await MM.scrivi(finestra("Giulia"), ["io che studio", "il giorno prima"], false);
  });
  await foto("5-ultimo-round.png");
  await fai(async () => { await MM.finoAllaFine(Z.C, ["Paky", "Giulia", "Luca", "Marco"], { voto: n => n === "Giulia" ? 1 : 2 }); await dorme(2500); });
  await foto("6-classifica.png");
  const url = await fai(async () => {
    let u = null; const P = finestra("Paky"); P.__MEMATA = { fotoFinta: x => { u = x; } };
    const b = [...P.document.querySelectorAll("button")].find(x => /WhatsApp/.test(x.textContent)); if (b) MM.tocca(P, b);
    await aspetta(() => u, 15000); return u;
  });
  if (url) { fs.writeFileSync(path.join(OUT, "7-foto-whatsapp.png"), Buffer.from(url.split(",")[1], "base64")); console.log("FOTO 7-foto-whatsapp.png"); }
  await b.close();
})().catch(e => { console.error("ERRORE", e); process.exit(1); });

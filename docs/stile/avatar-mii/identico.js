// «A interruttore spento tutto resta identico»: la stessa visita nell'app di oggi (cartella principale, server 8978) e nella
// copia degli avatar (server 8977). Si confrontano TUTTI i disegni degli avatar che compaiono nelle schermate (svg e immagini):
//  1. un amico qualunque (profilo «Paky»): home, profilo, editor dell'avatar, «👥 Classifica»;
//  2. IL PAPPONE con gli avatar nuovi spenti dal suo tasto: home, profilo, editor, «🤖 I Bot»;
//  3. IL PAPPONE di partenza: nella copia deve vedere il disegno nuovo (e nell'app di oggi quello di sempre).
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const CODA = "C:/Users/joetr/sg-strumenti/coda";
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
let mio = null;
function lascia() { if (mio) { try { fs.unlinkSync(mio); } catch (e) {} mio = null; } }
process.on("exit", lascia);
async function turno() {
  mio = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mio, String(process.pid));
  for (;;) {
    const vivi = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; });
    if (vivi[0] === path.basename(mio)) return;
    await new Promise(r => setTimeout(r, 1500));
  }
}
// in pagina: apre un telefono, visita le schermate e raccoglie i disegni degli avatar (id resi uguali)
async function visita(page, tel, profilo, stileMem, passi) {
  return page.evaluate(async ({ tel, profilo, stileMem, passi }) => {
    const W = window, A = COPIONE.aiuti;
    W.BR.mem[tel] = { l: stileMem ? { "sg-avatar-stile": stileMem } : {}, s: {} };
    const w = await W.apriTel(tel, { profilo, salaSempre: false });
    const norm = s => s.replace(/om[a-z0-9]{4}\d+_/g, "ID_").replace(/<!--\/?k-->/g, "");
    function raccogli() {
      const d = w.document, l = [];
      d.querySelectorAll("svg.omino").forEach(s => l.push(norm(s.outerHTML)));
      d.querySelectorAll("img").forEach(i => { if (/^data:image\/svg/.test(i.src || "") && /omino/.test(decodeURIComponent(i.src))) l.push(norm(decodeURIComponent(i.src))); });
      return l;
    }
    const out = {};
    await W.aspetta(() => w.document.querySelector(".tessera"), 8000); await W.dorme(600);
    out.stile = w.SGOmino.stile ? w.SGOmino.stile() : "classico (senza interruttore)";
    out.home = raccogli();
    if (passi.includes("profilo")) {
      try { await A.apriProfilo(w); await W.dorme(500); out.profilo = raccogli(); out.tastoNuovi = /Avatar nuovi/.test(w.document.body.innerText); } catch (e) { out.profilo = ["ERRORE " + e.message]; }
      if (passi.includes("bot")) {
        if (W.clicca(w, /I Bot/)) { await W.dorme(900); out.bot = raccogli(); W.clicca(w, /^‹|Indietro/); await W.dorme(500); } else out.bot = ["non trovo I Bot"];
        await A.apriProfilo(w).catch(() => {});
      }
      if (passi.includes("editor")) {
        const b = [].find.call(w.document.querySelectorAll("button"), x => /Modifica|avatar/i.test(x.textContent) && !/Avatar nuovi/.test(x.textContent));
        if (b) { b.click(); await W.dorme(1200); out.editor = raccogli(); } else out.editor = ["non trovo l'editor"];
      }
    }
    out.errori = (w.__err || []).slice();
    return out;
  }, { tel, profilo, stileMem, passi });
}
(async () => {
  await turno();
  const b = await chromium.launch({ channel: "msedge", headless: true });
  const ris = {};
  try {
    for (const [nome, base] of [["oggi", "http://localhost:8978"], ["copia", "http://localhost:8977"]]) {
      ris[nome] = {};
      for (const [caso, tel, profilo, mem, passi] of [
        ["amico", "Paky", { nome: "Paky", uid: "finto-paky" }, null, ["profilo", "editor"]],
        ["pappone-spenti", "Pap", { nome: "IL PAPPONE", uid: "finto-pappone" }, "classico", ["profilo", "bot", "editor"]],
        ["pappone", "Pap", { nome: "IL PAPPONE", uid: "finto-pappone" }, null, []]]) {
        const page = await b.newPage({ viewport: { width: 1200, height: 900 } });
        await page.goto(base + "/sw.js");
        await page.evaluate(async () => {
          const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
          const t = await (await fetch("/.agents/skills/prova-nel-browser/telefoni-finti.js?" + Date.now())).text(); (0, eval)(t.split("// ===== ESEMPIO =====")[0]);
        });
        ris[nome][caso] = await visita(page, tel, profilo, mem, passi);
        await page.close();
      }
    }
  } finally { await b.close(); lascia(); }
  const righe = [];
  for (const caso of Object.keys(ris.oggi)) {
    const A = ris.oggi[caso], B = ris.copia[caso];
    righe.push(caso + ": stile oggi=" + A.stile + " copia=" + B.stile + (B.tastoNuovi != null ? " · tasto «Avatar nuovi» oggi=" + !!A.tastoNuovi + " copia=" + !!B.tastoNuovi : ""));
    for (const k of ["home", "profilo", "bot", "editor"]) if (A[k] || B[k]) {
      const a = A[k] || [], c = B[k] || [], uguali = a.length === c.length && a.every((x, i) => x === c[i]);
      righe.push("   " + k + ": disegni " + a.length + " / " + c.length + " → " + (uguali ? "IDENTICI" : "DIVERSI"));
    }
    if ((A.errori || []).length || (B.errori || []).length) righe.push("   errori: oggi " + JSON.stringify(A.errori) + " copia " + JSON.stringify(B.errori));
  }
  console.log(righe.join("\n"));
  fs.writeFileSync(path.join(__dirname, "identico-esito.txt"), righe.join("\n") + "\n");
})();

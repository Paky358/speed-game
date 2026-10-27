// Contrasto delle scritte MISURATO sui pixel veri (WCAG): per ogni scritta si fotografa la pagina con le scritte
// nascoste, si guarda ogni pixel sotto la scritta e si tiene il punto peggiore (sfumature, vetro, foto sotto).
// Uso: node misura.js (server di prova sulla porta 8123) → scrive contrasti.json
const { chromium } = require("playwright");
const fs = require("fs");
const U = "http://localhost:8123/docs/stile/livello2/colori/";
const VOCI = {
  home: [
    ["Nome e monete (riquadro del profilo)", ".chip .chi b, .monete"],
    ["«Livello 3» (scritta piccola)", ".lv"],
    ["Nomi dei 4 tasti in alto", ".icone .lab"],
    ["Tasto principale «Gioca online»", ".btn-p"],
    ["Tasto «Ho un codice»", ".btn-s"],
    ["Filtri (anche quello scelto)", ".tab"],
    ["Etichetta della categoria sulla foto", ".badge"],
    ["Titoli delle tessere", ".tess h2"],
    ["Righe sotto i titoli", ".tess p"],
    ["«Giocatori» nel colore della categoria", ".tess .meta"],
  ],
  sala: [
    ["Titolo e sottotitolo", ".bar h1, .bar small"],
    ["Codice della Sala", ".cod"],
    ["Tasto «Invita gli amici»", ".btn-t"],
    ["«Sala d'attesa» e «5 amici · 3 pronti»", ".ins, .sotto-ins"],
    ["Nomi degli amici", ".nomina .nm"],
    ["«Host»", ".nomina em"],
    ["Classifica della serata", ".classif"],
    ["Tasto principale «Scegli il primo gioco»", ".btn-p"],
    ["Nota in fondo", ".nota"],
  ],
};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const out = {};
  for (const k of ["a", "b", "c"]) {
    out[k] = [];
    for (const t of ["home", "sala"]) {
      await p.goto(U + k + "-" + t + ".html", { waitUntil: "networkidle" });
      await p.evaluate(() => document.fonts.ready);
      // le scritte da misurare: rettangoli di ogni riga di testo e colore della scritta
      const voci = await p.evaluate(VOCI => VOCI.map(([nome, sel]) => {
        const pezzi = [];
        document.querySelectorAll(sel).forEach(el => {
          const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          let n; while ((n = w.nextNode())) {
            if (!n.textContent.trim()) continue;
            const r = document.createRange(); r.selectNodeContents(n);
            const col = getComputedStyle(n.parentElement).color;
            // si misura solo la parte che si vede: dentro lo schermo e dentro i contenitori che tagliano (i filtri che escono a destra)
            let L = 0, T = 0, R = innerWidth, B = innerHeight;
            for (let a = n.parentElement; a; a = a.parentElement) if (getComputedStyle(a).overflow !== "visible") { const z = a.getBoundingClientRect(); L = Math.max(L, z.left); T = Math.max(T, z.top); R = Math.min(R, z.right); B = Math.min(B, z.bottom); }
            for (const q of r.getClientRects()) { const x = Math.max(q.left, L), y = Math.max(q.top, T), x2 = Math.min(q.right, R), y2 = Math.min(q.bottom, B); if (x2 - x > 4 && y2 - y > 4) pezzi.push({ x, y, w: x2 - x, h: y2 - y, col, testo: n.textContent.trim() }); }
          }
        });
        return { nome, pezzi };
      }), VOCI[t]);
      // foto con le scritte nascoste: resta solo quello che c'è sotto
      await p.addStyleTag({ content: "*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}" });
      await p.waitForTimeout(100);
      const png = (await p.screenshot()).toString("base64");
      const ris = await p.evaluate(async ([png, voci]) => {
        const img = new Image(); img.src = "data:image/png;base64," + png; await img.decode();
        const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
        const cx = cv.getContext("2d"); cx.drawImage(img, 0, 0);
        const lin = v => (v /= 255) <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
        const lum = (r, g, b) => .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
        const rgba = s => { const m = s.match(/[\d.]+/g).map(Number); return [m[0], m[1], m[2], m[3] == null ? 1 : m[3]]; };
        return voci.map(v => {
          let min = 99, dove = "";
          for (const q of v.pezzi) {
            const [fr, fg, fb, fa] = rgba(q.col);
            const x0 = Math.round(q.x * 2) + 2, y0 = Math.round(q.y * 2) + 2, w = Math.round(q.w * 2) - 4, h = Math.round(q.h * 2) - 4;
            if (w <= 0 || h <= 0) continue;
            const d = cx.getImageData(x0, y0, w, h).data;
            for (let i = 0; i < d.length; i += 4) {
              const r = d[i], g = d[i + 1], bl = d[i + 2];
              const L1 = lum(fr * fa + r * (1 - fa), fg * fa + g * (1 - fa), fb * fa + bl * (1 - fa)), L2 = lum(r, g, bl);
              const c = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
              if (c < min) { min = c; dove = q.testo; }
            }
          }
          return [v.nome, Math.floor(min * 10) / 10, dove];
        });
      }, [png, voci]);
      out[k].push(...ris);
    }
  }
  await b.close();
  fs.writeFileSync(__dirname + "/contrasti.json", JSON.stringify(out, null, 1));
  for (const k in out) { console.log(k); for (const [n, c, d] of out[k]) console.log("  " + (c >= 4.5 ? "ok " : "NO ") + c + "  " + n + "  (" + d + ")"); }
})();

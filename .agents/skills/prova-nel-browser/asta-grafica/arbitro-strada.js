// La strada dell'arbitro, prima e adesso (un puntino ogni decimo di secondo: più sono lontani, più corre). Solo per le foto al proprietario.
const fs = require("fs"), path = require("path"), BASE = "D:/SG-asta";
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
function carica(file) {
  function finto() { return { style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, setAttribute() {}, addEventListener() {}, children: [] }; }
  const g = { console }; g.window = g; g.document = { createElement: finto, head: finto(), body: finto(), addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, documentElement: finto() };
  g.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} }; g.navigator = {}; g.requestAnimationFrame = () => 0; g.addEventListener = () => {}; g.Math = Math; g.JSON = JSON;
  const vm = require("vm"), ctx = vm.createContext(g);
  ["data/fanta-altezze.js", "data/fanta-quotazioni.js", "data/asta-fanta.js", "data/fanta-squadre.js", "data/fanta-statistiche.js", "data/fanta-numeri.js", "data/fanta-moduli.js", "data/fanta-campo.js", "data/fanta-ruoli.js"].forEach(f => vm.runInContext(fs.readFileSync(BASE + "/" + f, "utf8"), ctx));
  let src = fs.readFileSync(file, "utf8").replace("  SG.registra(gioco);", "  window.__S = scena; SG.registra(gioco);"); g.SG = { registra() {} };
  vm.runInContext(src, ctx); return g.__S;
}
const prima = carica(process.argv[2]), dopo = carica(process.argv[3] || BASE + "/js/games/asta.js");
const lin = (l, t) => { if (t <= l[0][0]) return l[0]; for (let i = 1; i < l.length; i++) if (t <= l[i][0]) { const a = l[i - 1], b = l[i], k = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 1; return [t, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; } return l[l.length - 1]; };
const W = 300, H = 440, X = hx => 12 + hx * (W - 24), Y = hy => H - 10 - (hy + 0.15) / 1.12 * (H - 20);   // (da poco dietro metà campo alla porta in alto)
function pannello(S, v, es, seme, tit) {
  const sc = S(es === "gol" ? "gol" : "occ", v, es, null, { tira: "T", passa: "P", para: "Q" }, { verso: 1, lato: seme % 2 ? 1 : -1, seme: seme * 7919, lento: true });
  const ar = sc.attori.filter(a => a.sq === "arb")[0], N = 42;   // (4,2 s: un puntino ogni 0,1 s)
  let svg = `<svg width="${W}" height="${H}" style="background:#2f8f3a;border-radius:10px">`;
  svg += `<rect x="${X(0)}" y="${Y(0.948)}" width="${X(1) - X(0)}" height="${Y(-0.15) - Y(0.948)}" fill="none" stroke="#fff" stroke-opacity=".7"/>`;
  svg += `<rect x="${X(0.21)}" y="${Y(0.948)}" width="${X(0.79) - X(0.21)}" height="${Y(0.63) - Y(0.948)}" fill="none" stroke="#fff" stroke-opacity=".7"/>`;
  svg += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(1)}" y2="${Y(0)}" stroke="#fff" stroke-opacity=".7"/>`;
  let pb = ""; for (let k = 0; k <= N; k++) { const q = lin(sc.palla, k / N); pb += (k ? "L" : "M") + X(q[1]).toFixed(1) + " " + Y(q[2]).toFixed(1); }
  svg += `<path d="${pb}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 4"/>`;
  let pa = "", dots = ""; for (let k = 0; k <= N; k++) { const q = lin(ar.pts, k / N); pa += (k ? "L" : "M") + X(q[1]).toFixed(1) + " " + Y(q[2]).toFixed(1); dots += `<circle cx="${X(q[1]).toFixed(1)}" cy="${Y(q[2]).toFixed(1)}" r="3.2" fill="#111"/>`; }
  svg += `<path d="${pa}" fill="none" stroke="#111" stroke-width="1.5"/>` + dots;
  if (sc.rete != null) { const q = lin(ar.pts, sc.rete); svg += `<circle cx="${X(q[1])}" cy="${Y(q[2])}" r="7" fill="none" stroke="#ffe066" stroke-width="2.5"/>`; }
  return `<div style="display:inline-block;margin:6px;text-align:center;color:#fff;font:700 15px system-ui">${tit}<br>${svg}</div>`;
}
const casi = [["contro", "gol", 3, "Contropiede, gol"], ["unodue", "gol", 4, "Uno-due, gol"], ["cross", "gol", 5, "Cross, gol"]];
let html = `<html><body style="margin:0;background:#151a2e;padding:10px;color:#fff;font:700 18px system-ui"><div style="color:#ffe066;margin:4px 6px 8px">L'arbitro: un puntino nero ogni decimo di secondo (più sono distanti, più corre). Tratteggio bianco = il pallone. Cerchio giallo = il gol.</div>`;
casi.forEach(c => { html += `<div>${pannello(prima, c[0], c[1], c[2], "PRIMA · " + c[3])}${pannello(dopo, c[0], c[1], c[2], "ADESSO · " + c[3])}</div>`; });
html += "</body></html>";
fs.writeFileSync(path.join(__dirname, "ref-traccia.html"), html);
(async () => { const b = await chromium.launch({ channel: "msedge", headless: true }); const p = await b.newPage({ viewport: { width: 660, height: 1520 } }); await p.goto("file:///" + path.join(__dirname, "ref-traccia.html").replace(/\\/g, "/")); await p.screenshot({ path: process.argv[4] || "D:/SG-asta-prove/arbitro-strada.png", fullPage: true }); await b.close(); console.log("ok"); })();

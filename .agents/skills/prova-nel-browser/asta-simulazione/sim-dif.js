// simulazione (solo per me, non tocca il progetto): i gol dei difensori nella giornata della Mini Asta.
// uso: node sim-dif.js [FILE_ASTA = js/games/asta.js del progetto] [giornate = 3000] [giocatori = 2]
// misura: punti medi a rosa; quota dei gol per reparto (tutti i calciatori del gioco); gol su tiri dei VOSTRI per reparto (anti-spoiler) e per
// scena dei difensori; quanto vince la rosa più forte (somma delle quotazioni)
const fs = require("fs");
const BASE = require("path").resolve(__dirname, "../../../..");   // (la cartella del progetto)
function finto() { const n = { style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, setAttribute() {}, addEventListener() {}, children: [] }; return n; }
global.window = global;
global.document = { createElement: finto, head: finto(), body: finto(), addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, documentElement: finto() };
global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
global.navigator = {}; global.requestAnimationFrame = () => 0; global.addEventListener = () => {};
["data/fanta-quotazioni.js", "data/asta-fanta.js", "data/fanta-squadre.js", "data/fanta-statistiche.js", "data/fanta-numeri.js", "data/fanta-moduli.js", "data/fanta-campo.js", "data/fanta-ruoli.js"].forEach(f => { if (fs.existsSync(BASE + "/" + f)) (0, eval)(fs.readFileSync(BASE + "/" + f, "utf8")); });
let src = fs.readFileSync(process.argv[2] || BASE + "/js/games/asta.js", "utf8");
const fine = "  SG.registra(gioco);";
if (!src.includes(fine)) throw "non trovo la fine";
src = src.replace(fine, "  window.__T = { classificaFanta: classificaFanta }; " + fine);
global.SG = { registra() {}, bot: null };
(0, eval)(src);
const T = global.__T, N = +(process.argv[3] || 3000), NG = +(process.argv[4] || 2);
const L = window.SG_FANTA_CALCIATORI, Q = window.SG_FANTA_QUOTAZIONI.valori;
const RUOLO = {};   // tutti i calciatori del listone (anche quelli fuori dall'asta, gruppo X): chiave → ruolo
for (const r of "PDCA") Object.keys(L[r]).forEach(t => (L[r][t] || []).forEach(k => { RUOLO[k] = r; }));
const pool = {}; for (const r of "PDCA") pool[r] = ["A", "B", "C"].flatMap(t => L[r][t] || []).map(k => { const m = /^(.*) \((.*)\)$/.exec(k); return { nome: m[1], squadra: m[2], ruolo: r, q: Q[k] }; });
const pesca = l => l[Math.floor(Math.random() * l.length)];
function rose(n) {
  const usati = new Set(), sqP = new Set(), out = [];
  for (let i = 0; i < n; i++) {
    const kit = [];
    for (const r of ["P", "D", "C", "C", "A"]) { let c, giri = 0; do { c = pesca(pool[r]); giri++; } while ((usati.has(c.nome + c.squadra) || (r === "P" && sqP.has(c.squadra))) && giri < 500); usati.add(c.nome + c.squadra); if (r === "P") sqP.add(c.squadra); kit.push(c); }
    out.push({ nome: "G" + i, crediti: 0, kit });
  }
  return out;
}
const key = c => c.nome + " (" + c.squadra + ")";
let punti = 0, rN = 0, forteV = 0, forteN = 0, golRuolo = {}, golTot = 0, tiri = {}, scD = {}, golNull = 0, golMieiD = 0, giorn = 0;
for (let i = 0; i < N; i++) {
  const g = rose(NG), SA = {}, r = T.classificaFanta(g, SA, 1, null);
  r.forEach(x => { punti += x.gio.punti; rN++; });
  const forza = g.map(x => x.kit.reduce((t, c) => t + c.q, 0)), mx = Math.max(...forza);
  if (forza.filter(f => f === mx).length === 1) {
    const chi = "G" + forza.indexOf(mx), pt = r.map(x => x.gio.punti), best = Math.max(...pt), io = r.find(x => x.nome === chi).gio.punti;
    if (pt.filter(p => p === best).length === 1) { forteN++; if (io === best) forteV++; }
  }
  const miei = {}; r.forEach(x => x.kit.forEach(c => { miei[key(c)] = c; }));
  giorn++;
  (SA.partite || []).forEach(P => P.ev.forEach(e => {
    if (e.t === "gol" || e.t === "rig") { golTot++; const ru = RUOLO[e.chi]; if (!ru) golNull++; else golRuolo[ru] = (golRuolo[ru] || 0) + 1; }
    const c = miei[e.chi]; if (!c) return;
    if (e.t === "gol" || e.t === "occ") {   // (i tiri dei vostri, senza i rigori)
      const z = tiri[c.ruolo] = tiri[c.ruolo] || [0, 0]; z[e.t === "gol" ? 0 : 1]++;
      if (c.ruolo === "D") { const s = scD[e.v] = scD[e.v] || [0, 0]; s[e.t === "gol" ? 0 : 1]++; if (e.t === "gol") golMieiD++; }
    }
  }));
}
const pc = (a, b) => b ? (a / b * 100).toFixed(1) + "%" : "-";
const conRuolo = golTot - golNull;
console.log("giocatori " + NG + ", " + N + " giornate");
console.log("  punti medi a rosa: " + (punti / rN).toFixed(2) + " · la rosa più forte vince " + pc(forteV, forteN) + " (" + forteN + " prove)");
console.log("  quota dei gol (di chi è nel gioco, rigori compresi): " + ["A", "C", "D", "P"].map(k => k + " " + pc(golRuolo[k] || 0, conRuolo)).join(", ") + " · senza nome " + pc(golNull, golTot));
console.log("  gol sui tiri dei vostri (senza rigori): " + ["A", "C", "D"].map(k => k + " " + (tiri[k] ? pc(tiri[k][0], tiri[k][0] + tiri[k][1]) + " su " + (tiri[k][0] + tiri[k][1]) : "-")).join(", "));
console.log("  gol dei vostri difensori a giornata per difensore: " + (golMieiD / (giorn * NG)).toFixed(3));
console.log("  difensori, scena per scena (gol / tiri): " + Object.keys(scD).sort((a, b) => (scD[b][0] + scD[b][1]) - (scD[a][0] + scD[a][1])).map(k => k + " " + scD[k][0] + "/" + (scD[k][0] + scD[k][1])).join(", "));

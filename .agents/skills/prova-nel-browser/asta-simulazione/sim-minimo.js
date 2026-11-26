// simulazione: il minimo di azioni che si vedono nella giornata della Mini Asta (26 nov 2026, il proprietario: «almeno del centrocampista
// offensivo e dell'attaccante le azioni le devono vedere… il difensore ci sta che potrebbe non vederla… minimo due solo dell'attaccante o del
// centrocampista»). Non tocca il progetto.
// uso: node sim-minimo.js [FILE_ASTA = js/games/asta.js del progetto] [giornate = 2000] [giocatori = 2] [giornate a partita = 1]
// misura (sulla giornata come si vede, dopo i tagli): per ogni rosa quante azioni si vedono in tutto e dei suoi attaccanti e centrocampisti,
// di quanti di loro, quante rose ne vedono meno di 2 (o nessuna); quanto dura la giornata (momenti e secondi); i punti medi e quanto vince la
// rosa più forte; i gol a partita e i gol subiti dai vostri portieri. Con 3 giornate anche le due veloci (rose senza azioni d'attacco).
const fs = require("fs");
const BASE = require("path").resolve(__dirname, "../../../..");
function finto() { const n = { style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, setAttribute() {}, addEventListener() {}, children: [] }; return n; }
global.window = global;
global.document = { createElement: finto, head: finto(), body: finto(), addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, documentElement: finto() };
global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
global.navigator = {}; global.requestAnimationFrame = () => 0; global.addEventListener = () => {};
["data/fanta-quotazioni.js", "data/asta-fanta.js", "data/fanta-squadre.js", "data/fanta-statistiche.js", "data/fanta-numeri.js", "data/fanta-moduli.js", "data/fanta-campo.js", "data/fanta-ruoli.js", "data/fanta-altezze.js"].forEach(f => { if (fs.existsSync(BASE + "/" + f)) (0, eval)(fs.readFileSync(BASE + "/" + f, "utf8")); });
let src = fs.readFileSync(process.argv[2] && process.argv[2] !== "-" ? process.argv[2] : BASE + "/js/games/asta.js", "utf8");
const fine = "  SG.registra(gioco);";
if (!src.includes(fine)) throw "non trovo la fine";
src = src.replace(fine, "  window.__T = { classificaFanta: classificaFanta, listaMomenti: listaMomenti, taglioGiornata: taglioGiornata, sceltaVeloce: sceltaVeloce, azioneDi: azioneDi, chiaveCalc: chiaveCalc, tempiEv: tempiEv, LAMPO: LAMPO_MS }; " + fine);
global.SG = { registra() {}, bot: null };
(0, eval)(src);
const T = global.__T, N = +(process.argv[3] || 2000), NG = +(process.argv[4] || 2), GIOR = +(process.argv[5] || 1);
const L = window.SG_FANTA_CALCIATORI, Q = window.SG_FANTA_QUOTAZIONI.valori;
const pool = {}; for (const r of "PDCA") pool[r] = ["A", "B", "C"].flatMap(t => L[r][t] || []).map(k => { const m = /^(.*) \((.*)\)$/.exec(k); return { nome: m[1], squadra: m[2], ruolo: r, q: Q[k] }; });
const pesca = l => l[Math.floor(Math.random() * l.length)];
function rose(n) {
  const usati = new Set(), sqP = new Set(), out = [];
  for (let i = 0; i < n; i++) {
    const kit = [];
    for (const r of ["P", "D", "C", "C", "A"]) { let c, giri = 0; do { c = pesca(pool[r]); giri++; } while ((usati.has(c.nome + c.squadra) || (r === "P" && sqP.has(c.squadra))) && giri < 500); usati.add(c.nome + c.squadra); if (r === "P") sqP.add(c.squadra); kit.push(c); }
    out.push({ id: "g" + i, nome: "G" + i, crediti: 0, kit });
  }
  return out;
}
const OFF = { A: 1, C: 1 };
function visti(lista) {   // per rosa: azioni viste in tutto, dei suoi A e C, e quali A/C
  const n = {};
  lista.forEach(x => {
    if (x.sp || !x.focus || x.via || x.lampo || !x.e) return;
    const giaT = {}, giaO = {};
    (x.chi || []).forEach(q => {
      const id = q.r.nome, k = T.chiaveCalc(q.c); if (!T.azioneDi(x.e, k)) return;
      const z = n[id] = n[id] || { tot: 0, off: 0, chi: {} };
      if (!giaT[id]) { giaT[id] = 1; z.tot++; }
      if (OFF[q.c.ruolo]) { if (!giaO[id]) { giaO[id] = 1; z.off++; } z.chi[k] = 1; }
    });
  });
  return n;
}
function durata(lista) { let d = 0, m = 0; lista.forEach(x => { if (x.sp || !x.focus || x.via) return; m++; if (x.lampo) { d += x.ms || T.LAMPO; return; } T.tempiEv(x.e).forEach(v => { d += v; }); }); return { d, m }; }
let punti = 0, rN = 0, forteV = 0, forteN = 0, momenti = 0, sec = 0, gol = 0, partite = 0, gsP = 0, nP = 0;
const S = { rose: 0, tot: 0, off: 0, chi: 0, off0: 0, offMeno2: 0, chiMeno2: 0, tot0: 0, totMeno3: 0, perRuolo: {} };
const V = { rose: 0, off0: 0, tot0: 0, off: 0 };
for (let i = 0; i < N; i++) {
  const g = rose(NG), SA = {}, righe = T.classificaFanta(g, SA, GIOR, null);
  righe.forEach(x => { punti += x.gio.punti; rN++; });
  const forza = g.map(x => x.kit.reduce((t, c) => t + c.q, 0)), mx = Math.max(...forza);
  if (forza.filter(f => f === mx).length === 1) { const chi = "G" + forza.indexOf(mx), pt = righe.map(x => x.gio.punti), best = Math.max(...pt), io = righe.find(x => x.nome === chi).gio.punti; if (pt.filter(p => p === best).length === 1) { forteN++; if (io === best) forteV++; } }
  // la giornata intera, come si vede
  const lista = T.listaMomenti(SA, righe, r => r.gio, false); T.taglioGiornata(lista);
  const du = durata(lista); momenti += du.m; sec += du.d / 1000;
  const n = visti(lista);
  righe.forEach(r => {
    const z = n[r.nome] || { tot: 0, off: 0, chi: {} }, nc = Object.keys(z.chi).length;
    S.rose++; S.tot += z.tot; S.off += z.off; S.chi += nc;
    if (z.off === 0) S.off0++; if (z.off < 2) S.offMeno2++; if (nc < 2) S.chiMeno2++; if (z.tot === 0) S.tot0++; if (z.tot < 3) S.totMeno3++;
  });
  // i gol e i gol subiti dai vostri portieri
  const por = {}; righe.forEach(r => r.kit.forEach(c => { if (c.ruolo === "P") por[c.squadra] = 1; }));
  (SA.partite || []).forEach(P => { partite++; P.ev.forEach(e => { if (e.t === "gol" || e.t === "rig" || e.t === "aut") { gol++; } }); [["c", P.c], ["f", P.f]].forEach(([s, sq]) => { if (!por[sq]) return; nP++; gsP += P.ev.filter(e => (e.t === "gol" || e.t === "rig") && e.s !== s || e.t === "aut" && e.s === s).length; }); });
  // le due giornate veloci
  if (GIOR === 3 && SA.prima) [0, 1].forEach(gk => {
    const lv = T.listaMomenti(SA.prima[gk], righe, r => r.prima[gk], true); T.sceltaVeloce(lv);
    const nv = visti(lv); righe.forEach(r => { const z = nv[r.nome] || { tot: 0, off: 0 }; V.rose++; V.off += z.off; if (z.off === 0) V.off0++; if (z.tot === 0) V.tot0++; });
  });
}
const pc = (a, b) => b ? (a / b * 100).toFixed(1) + "%" : "-", f2 = x => x.toFixed(2);
console.log(`in ${NG}, ${N} giornate${GIOR === 3 ? " (3 giornate: questa è la terza, intera)" : ""}`);
console.log(`  a rosa si vedono ${f2(S.tot / S.rose)} azioni, ${f2(S.off / S.rose)} di attaccante e centrocampisti, di ${f2(S.chi / S.rose)} di loro`);
console.log(`  rose con meno di 2 azioni d'attacco ${pc(S.offMeno2, S.rose)} (nessuna ${pc(S.off0, S.rose)}) · d'attacco di un solo giocatore o nessuno ${pc(S.chiMeno2, S.rose)} · meno di 3 azioni in tutto ${pc(S.totMeno3, S.rose)} (nessuna ${pc(S.tot0, S.rose)})`);
console.log(`  la giornata: ${f2(momenti / N)} momenti, ${(sec / N).toFixed(0)} s · gol a partita ${f2(gol / partite)} · gol subiti da un vostro portiere ${f2(gsP / Math.max(1, nP))}`);
console.log(`  punti medi a rosa ${f2(punti / rN)} · la rosa più forte vince ${pc(forteV, forteN)} (${forteN} prove)`);
if (V.rose) console.log(`  le giornate veloci: ${f2(V.off / V.rose)} azioni d'attacco a rosa · rose senza azioni d'attacco ${pc(V.off0, V.rose)} · senza azioni ${pc(V.tot0, V.rose)}`);

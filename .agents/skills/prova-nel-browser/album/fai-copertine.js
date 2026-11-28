// 📒 fa data/album-copertine.js: per ogni stagione le prime 6 squadre della classifica finale e, per ognuna, il calciatore della copertina
// (29 nov 2026, il proprietario col Cervello). La regola:
//  - si va stagione per stagione, dalla più vecchia; MAI lo stesso calciatore due volte per la stessa squadra su tutte le copertine;
//  - il CAPITANO di quella stagione (D:/SG-album-prove/libro2/copertine/ricerca-capitani.json, cercato con due fonti) se non è già uscito;
//    se il capitano non c'è nei nostri dati, o le fonti non sono d'accordo, quello che la nota dice (es. chi ha preso la fascia a metà anno);
//  - se no la STELLA (mai chi sarà capitano della stessa squadra in una stagione dopo: la sua copertina arriva lì) di quella stagione non ancora uscita (chi ha meno calciatori del suo ruolo davanti in tutta la Serie A, i portieri un po' indietro; poi la quotazione);
//  - ruoli mescolati: tra le prime 4 al massimo 2 attaccanti, tra le prime 6 al massimo 3 (si cambia la stella attaccante delle squadre più
//    in basso col miglior centrocampista, difensore o portiere non ancora uscito; i capitani restano).
//  - la stagione di oggi (in corso): le 6 squadre con l'overall più alto (i migliori 11, 1-4-3-3) e solo stelle.
// Il file che esce si può cambiare a mano (poi NON rifarlo, se no le mani si perdono). Uso: node fai-copertine.js [--oggi Inter,Napoli,…]
global.window = global; const fs = require("fs"), D = "D:/SG-album-libro/data/";
const RIC = require("D:/SG-album-prove/libro2/copertine/ricerca-capitani.json");
const STAG = ["2015-16", "2016-17", "2017-18", "2018-19", "2019-20", "2020-21", "2021-22", "2022-23", "2023-24", "2024-25", "2025-26"];
const TETTO = { P: 89, D: 89, C: 91, A: 93 };
// le note della ricerca: chi ha portato la fascia quando il capitano designato non c'è o è dubbio (scritte qui, una per una)
const ALT = {
  "2018-19|Napoli": ["Insigne", "capitano da febbraio (Hamsik ceduto)"], "2018-19|Inter": ["Icardi", "capitano fino a febbraio, poi Handanovic"],
  "2019-20|Juventus": ["Bonucci", "capitano in campo (Chiellini infortunato)"], "2019-20|Roma": ["Dzeko", "capitano da gennaio (Florenzi ceduto)"],
  "2020-21|Atalanta": ["Toloi", "capitano da dicembre (dopo il Papu Gomez)"], "2020-21|Juventus": ["Bonucci", "capitano in campo (Chiellini spesso fuori)"],
  "2024-25|Atalanta": ["De Roon", "capitano in campo (Toloi spesso fuori)"], "2024-25|Juventus": ["Locatelli", "capitano da gennaio (Danilo ceduto)"],
  "2024-25|Fiorentina": ["Ranieri L.", "capitano da dicembre (dopo Biraghi)"], "2025-26|Roma": ["Cristante", "capitano dopo El Shaarawy"],
};
function stagione(s) {   // { per: squadra → [{ nome, r, q, o }] } dai dati di quella stagione
  let L, V, alb;
  if (s === "oggi") { require(D + "asta-fanta.js"); require(D + "fanta-quotazioni.js"); require(D + "fanta-campo.js"); require(D + "album-oggi.js"); L = window.SG_FANTA_CALCIATORI; V = window.SG_FANTA_QUOTAZIONI.valori; alb = window.SG_ALBUM_OGGI;
    const FC = (window.SG_FANTA_CAMPO || {}).calciatori || {}; Object.keys(FC).forEach(k => { V[k] = V[k] || FC[k][1]; }); }
  else { const a = s.slice(0, 4); require(D + "fanta-" + a + ".js"); require(D + "album-" + a + ".js"); const S = window.SG_FANTA_STAGIONI[s]; L = S.CALCIATORI; V = S.QUOTAZIONI.valori; alb = window.SG_ALBUM_STAGIONI[s]; }
  const scala = {}; Object.keys(L).forEach(r => { const dd = {}; Object.keys(L[r]).forEach(g => L[r][g].forEach(k => { dd[+V[k] > 0 ? +V[k] : 1] = 1; })); scala[r] = Object.keys(dd).map(Number).sort((a, b) => b - a); });
  const per = {};
  Object.keys(alb).forEach(sq => { per[sq] = alb[sq].map(v => { const r = v[0], nome = v.slice(2), q = +V[nome + " (" + sq + ")"] > 0 ? +V[nome + " (" + sq + ")"] : 1; return { nome, r, q, o: TETTO[r] - (scala[r] || []).filter(x => x > q).length }; }); });
  const tutti = {}; Object.keys(per).forEach(sq => per[sq].forEach(c => (tutti[c.r] = tutti[c.r] || []).push(c.q)));
  Object.keys(per).forEach(sq => per[sq].forEach(c => { const l = tutti[c.r]; c.pc = l.filter(x => x > c.q).length / l.length + (c.r === "P" ? 0.15 : c.r === "D" ? 0.05 : 0); }));   // (la stella: quanti del suo ruolo ha davanti in tutta la Serie A; i portieri e un po meno i difensori più indietro)
  return per;
}
function ovrSq(l) {   // i migliori 11 nel 4-3-3 (1 P, 4 D, 3 C, 3 A), la media degli overall
  const pr = { P: 1, D: 4, C: 3, A: 3 }; let s = 0, n = 0;
  Object.keys(pr).forEach(r => l.filter(c => c.r === r).sort((a, b) => b.o - a.o).slice(0, pr[r]).forEach(c => { s += c.o; n++; }));
  return n ? s / n : 0;
}
const usati = {}, out = {}, righe = [];
const ordine = (a, b) => a.pc - b.pc || b.q - a.q || (a.r === "A") - (b.r === "A");   // (la stella: il più in alto nel SUO ruolo, così un regista vale quanto un bomber)
const arg = process.argv.indexOf("--oggi");
function poiCapitano(s, sq, nome) {   // (è il capitano della stessa squadra in una stagione dopo? allora la stella aspetta: la copertina sarà sua da capitano)
  return STAG.slice(STAG.indexOf(s) + 1).some(t => { const c = ((RIC[t] || {}).capitani || {})[sq], a = ALT[t + "|" + sq]; return c && c.nostro === nome && !c.dubbio || a && a[0] === nome; });
}
for (const s of STAG.concat(["oggi"])) {
  const per = stagione(s), R = RIC[s] || {};
  let cl = s === "oggi" ? (arg > 0 ? process.argv[arg + 1].split(",") : Object.keys(per).sort((a, b) => ovrSq(per[b]) - ovrSq(per[a])).slice(0, 6)) : R.classifica.slice(0, 6);
  const scelte = cl.map(sq => {
    const l = per[sq] || [], u = usati[sq] = usati[sq] || {}, cap = (R.capitani || {})[sq], alt = ALT[s + "|" + sq];
    let c = null, tipo = "stella", nota = "";
    if (cap && cap.nostro && !cap.dubbio && !u[cap.nostro]) { c = l.find(x => x.nome === cap.nostro); tipo = "capitano"; if (cap.una_sola_fonte) nota = "capitano trovato con una fonte sola: da controllare"; }
    if (!c && alt && !u[alt[0]]) { c = l.find(x => x.nome === alt[0]); tipo = "capitano"; nota = alt[1] + ": da controllare"; }
    if (!c && cap && cap.capitano) nota = (u[cap.nostro] ? cap.capitano + " è già uscito" : "il capitano " + cap.capitano + (cap.nostro ? " (dubbio)" : " non è nei nostri dati")) + ": c'è la stella";
    if (!c) { const lib = l.filter(x => !u[x.nome]).sort(ordine); c = lib.filter(x => !poiCapitano(s, sq, x.nome))[0] || lib[0]; tipo = "stella"; }
    return { sq, c, tipo, nota };
  });
  // i ruoli mescolati: prime 4 al massimo 2 attaccanti, prime 6 al massimo 3
  [[4, 2], [6, 3]].forEach(([n, max]) => {
    while (scelte.slice(0, n).filter(x => x.c.r === "A").length > max) {   // (si cambia dove si perde meno: la stella attaccante col sostituto più vicino)
      let best = null;
      scelte.slice(0, n).forEach(x => { if (x.tipo !== "stella" || x.c.r !== "A") return; const al = (per[x.sq] || []).filter(y => y.r !== "A" && !usati[x.sq][y.nome] && !poiCapitano(s, x.sq, y.nome)).sort(ordine)[0]; if (!al) return; const perde = al.pc - x.c.pc; if (!best || perde < best.perde) best = { x, al, perde }; });
      if (!best) break; best.x.nota = "al posto di " + best.x.c.nome + " (troppi attaccanti)"; best.x.c = best.al;
    }
  });
  scelte.forEach(x => { usati[x.sq][x.c.nome] = 1; });
  out[s] = scelte.map(x => [x.sq, x.c.nome, x.tipo]);
  righe.push("| " + (s === "oggi" ? "Oggi (2026-27, in corso)" : s) + " | " + scelte.map((x, i) => (i + 1) + "ª " + x.sq + ": **" + x.c.nome + "** (" + x.c.r + ", " + x.tipo + (x.nota ? "; " + x.nota : "") + ")").join("<br>") + " |");
}
const testa = `// 📒 LE COPERTINE DELL'ALBUM (29 nov 2026, il proprietario col Cervello): per ogni stagione le prime 6 della classifica finale (la 1ª è la
// campione d'Italia; oggi, a stagione in corso, le 6 con l'overall più alto) e il calciatore di ognuna sulla copertina: il CAPITANO di quella
// stagione, o la STELLA se il capitano è già uscito prima (mai lo stesso calciatore due volte per la stessa squadra), coi ruoli mescolati.
// Fatto con .agents/skills/prova-nel-browser/album/fai-copertine.js; SI PUÒ CAMBIARE A MANO: [squadra, nome come nei dati di quella
// stagione, "capitano" | "stella"]. Il pacchetto di ogni stagione usa il calciatore della 1ª (la campione).
`;
fs.writeFileSync(D + "album-copertine.js", testa + "window.SG_ALBUM_COPERTINE = {\n" + Object.keys(out).map(s => "  \"" + s + "\": [" + out[s].map(x => JSON.stringify(x)).join(", ") + "]").join(",\n") + "\n};\n");
fs.writeFileSync("D:/SG-album-prove/libro2/copertine/elenco.md", "| Stagione | Le prime 6 e il calciatore della copertina |\n|---|---|\n" + righe.join("\n") + "\n");
console.log(righe.join("\n"));

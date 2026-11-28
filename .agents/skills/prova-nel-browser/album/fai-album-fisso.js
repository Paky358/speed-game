// 📒 FA L'ALBUM FISSO DELLA SERIE A DI OGGI (data/album-oggi.js) dal listone di adesso (data/asta-fanta.js, gruppi A, B, C).
// Si lancia UNA volta (fatto il 28 nov 2026): poi l'album resta fisso. Il proprietario: «l'album di ogni stagione resta fisso…
// in ordine di ruolo e dentro ogni ruolo per numero di maglia; chi non ha il numero in fondo al suo ruolo, in ordine di nome».
// Chi entra dopo nel listone va da solo nelle pagine «🆕 Aggiornamenti»; chi esce resta al suo posto. NON rilanciarlo per aggiornare.
// Uso: node .agents\skills\prova-nel-browser\album\fai-album-fisso.js   (scrive data/album-oggi.js; se c'è già si ferma, --forza per riscriverlo)
const fs = require("fs"), path = require("path"), RADICE = path.resolve(__dirname, "../../../..");
const OUT = path.join(RADICE, "data/album-oggi.js");
if (fs.existsSync(OUT) && !process.argv.includes("--forza")) { console.log("data/album-oggi.js c'è già: l'album è fisso, non si rifà (--forza solo se lo decide il proprietario)"); process.exit(0); }
global.window = global;
require(path.join(RADICE, "data/asta-fanta.js")); require(path.join(RADICE, "data/fanta-numeri.js"));
const D = window.SG_FANTA_CALCIATORI, N = window.SG_FANTA_NUMERI || {}, per = {};
["P", "D", "C", "A"].forEach(r => ["A", "B", "C"].forEach(f => ((D[r] || {})[f] || []).forEach(k => { const m = /^(.*) \((.*)\)$/.exec(k); if (!m) return; (per[m[2]] = per[m[2]] || []).push({ r, nome: m[1], k }); })));
const num = k => { const v = N[k]; return v == null ? null : typeof v === "number" ? v : v[0]; };
const RU = "PDCA", squadre = Object.keys(per).sort((a, b) => a.localeCompare(b, "it"));
let righe = [], tot = 0;
squadre.forEach(s => {
  const l = per[s].sort((a, b) => RU.indexOf(a.r) - RU.indexOf(b.r) || (num(a.k) == null) - (num(b.k) == null) || (num(a.k) || 0) - (num(b.k) || 0) || a.nome.localeCompare(b.nome, "it"));
  tot += l.length; righe.push("  " + JSON.stringify(s) + ": " + JSON.stringify(l.map(c => c.r + "|" + c.nome)) + ",");
});
fs.writeFileSync(OUT, "// 📒 L'ALBUM FISSO DELLA SERIE A DI OGGI (fatto il 28 nov 2026 dal listone di quel giorno con album/fai-album-fisso.js; NON si cambia a mano).\n" +
  "// Per squadra (in ordine di nome), i calciatori in ordine di ruolo (P, D, C, A) e dentro il ruolo per numero di maglia (chi non l'ha in fondo,\n" +
  "// per nome): «ruolo|nome». Il numero dell'album è il posto in questa lista contando tutte le squadre di fila. Chi esce dal listone resta qui\n" +
  "// («💎 Introvabile» per chi l'ha, «🔒 Non più all'asta» per gli altri); chi entra dopo va nelle pagine «🆕 Aggiornamenti» (js/games/asta.js, albLista).\n" +
  "window.SG_ALBUM_OGGI = {\n" + righe.join("\n").replace(/,$/, "") + "\n};\n");
console.log("scritto data/album-oggi.js: " + squadre.length + " squadre, " + tot + " figurine");

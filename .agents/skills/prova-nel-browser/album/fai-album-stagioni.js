// 📒 FA GLI ALBUM FISSI DELLE STAGIONI PASSATE (data/album-<anno>.js, uno per stagione, nel pezzo della sua stagione in js/elenco-giochi.js).
// Si lancia UNA volta (fatto il 29 nov 2026): poi i numeri dell'album di quella stagione non cambiano più, anche se un giorno si correggono
// i dati della stagione (il Cervello: «i numeri dell'album di ogni stagione vanno scritti in un file fisso, non calcolati ogni volta»).
// TUTTA la rosa che abbiamo di quella stagione (asta + gruppo X; le stagioni passate non hanno i «solo per il campo»). Ordine come oggi: per squadra, ruolo (P, D, C, A), numero di maglia di quella stagione (chi non l'ha in fondo, per nome).
// Uso: node .agents\skills\prova-nel-browser\album\fai-album-stagioni.js   (un file che c'è già non si riscrive; --forza solo se lo decide il proprietario)
const fs = require("fs"), path = require("path"), RADICE = path.resolve(__dirname, "../../../..");
global.window = global;
const forza = process.argv.includes("--forza"), RU = "PDCA";
for (const f of fs.readdirSync(path.join(RADICE, "data")).filter(f => /^fanta-20\d\d\.js$/.test(f)).sort()) {
  const anno = f.slice(6, 10), OUT = path.join(RADICE, "data/album-" + anno + ".js");
  if (fs.existsSync(OUT) && !forza) { console.log("c'è già data/album-" + anno + ".js: fisso, non si rifà"); continue; }
  window.SG_FANTA_STAGIONI = {}; require(path.join(RADICE, "data", f));
  const id = Object.keys(window.SG_FANTA_STAGIONI)[0], S = window.SG_FANTA_STAGIONI[id], D = S.CALCIATORI, N = S.NUMERI || {}, per = {};
  ["P", "D", "C", "A"].forEach(r => ["A", "B", "C", "X"].forEach(g => ((D[r] || {})[g] || []).forEach(k => { const m = /^(.*) \((.*)\)$/.exec(k); if (m) (per[m[2]] = per[m[2]] || []).push({ r, nome: m[1], k }); })));
  const num = k => { const v = N[k]; return v == null ? null : typeof v === "number" ? v : v[0]; };
  const squadre = Object.keys(per).sort((a, b) => a.localeCompare(b, "it")); let tot = 0;
  const righe = squadre.map(s => { const l = per[s].sort((a, b) => RU.indexOf(a.r) - RU.indexOf(b.r) || (num(a.k) == null) - (num(b.k) == null) || (num(a.k) || 0) - (num(b.k) || 0) || a.nome.localeCompare(b.nome, "it")); tot += l.length; return "  " + JSON.stringify(s) + ": " + JSON.stringify(l.map(c => c.r + "|" + c.nome)); });
  fs.writeFileSync(OUT, "// 📒 L'ALBUM FISSO DELLA SERIE A " + id + " (fatto il 29 nov 2026 con album/fai-album-stagioni.js; NON si cambia a mano). Come data/album-oggi.js:\n" +
    "// per squadra, «ruolo|nome» in ordine di ruolo e numero di maglia; il numero dell'album è il posto contando tutte le squadre di fila.\n" +
    "(window.SG_ALBUM_STAGIONI = window.SG_ALBUM_STAGIONI || {})[" + JSON.stringify(id) + "] = {\n" + righe.join(",\n") + "\n};\n");
  console.log("scritto data/album-" + anno + ".js (" + id + "): " + squadre.length + " squadre, " + tot + " figurine");
}

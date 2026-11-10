// IL MURO — costruisce data/muro-domande.js dai file controllati degli aiutanti.
// Uso: "C:\Program Files\nodejs\node.exe" .agents/skills/prova-nel-browser/muro/domande/costruisci.js D:\SG-muro\lavoro\domande
// Legge <arg>.json (le domande tenute dal controllore: { d, r: [giusta, sbagliata, sbagliata?], f }), toglie quelle di
// doppioni.json ({ arg, d }) e applica <arg>-verifica.json se c'è (la seconda verifica col web: { d, azione: "togli" |
// "correggi", nuova: { d, r, f } }). Scrive data/muro-domande.js (in fondo il conto per argomento).
const fs = require("fs");
const path = require("path");
const DIR = process.argv[2] || "D:/SG-muro/lavoro/domande";
const OUT = path.join(__dirname, "../../../../../data/muro-domande.js");
const ARG = [
  ["calcio", "Calcio", "⚽"], ["sport", "Altri sport", "🏅"], ["storia", "Storia", "🏛️"], ["geografia", "Geografia", "🌍"],
  ["cinema", "Cinema e TV", "🎬"], ["musica", "Musica", "🎵"], ["scienza", "Scienza e corpo umano", "🔬"],
  ["natura", "Animali e natura", "🐾"], ["cucina", "Cucina", "🍝"], ["italia", "Italia e tradizioni", "🇮🇹"],
  ["tecnologia", "Tecnologia e invenzioni", "📱"], ["cultura", "Arte, libri e parole", "🎨"]
];
function leggi(f) { try { return JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8").replace(/^\uFEFF/, "")); } catch (e) { return null; } }
const doppi = leggi("doppioni.json") || [];
const norm = s => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
const out = {}, conto = {};
let tot = 0, tolte = 0, corrette = 0;
for (const [id] of ARG) {
  let l = leggi(id + ".json") || [];
  const via = new Set(doppi.filter(x => x.arg === id).map(x => norm(x.d)));
  const n0 = l.length;
  l = l.filter(q => !via.has(norm(q.d)));
  tolte += n0 - l.length;
  const ver = leggi(id + "-verifica.json") || [];
  for (const v of ver) {
    const i = l.findIndex(q => norm(q.d) === norm(v.d));
    if (i < 0) continue;
    if (v.azione === "togli") { l.splice(i, 1); tolte++; }
    else if (v.azione === "correggi" && v.nuova && v.nuova.d && Array.isArray(v.nuova.r) && v.nuova.r.length >= 2) { l[i] = Object.assign({ f: l[i].f }, v.nuova); corrette++; }
  }
  const visti = new Set();
  out[id] = l.filter(q => {
    const k = norm(q.d);
    const ok = q && q.d && Array.isArray(q.r) && q.r.length >= 2 && q.r.length <= 3 && !visti.has(k) && new Set(q.r.map(norm)).size === q.r.length;
    visti.add(k); return ok;
  }).map(q => [+q.f || 2, String(q.d).trim()].concat(q.r.map(r => String(r).trim())));
  conto[id] = out[id].length; tot += out[id].length;
}
const testa = "// IL MURO — le domande (" + tot + "), divise per argomento. Scritto da .agents/skills/prova-nel-browser/muro/domande/costruisci.js:\n" +
  "// NON modificarlo a mano (si rifà dai file controllati). Ogni domanda: [difficoltà 1-3, domanda, GIUSTA, sbagliata, sbagliata?];\n" +
  "// il gioco mescola le risposte. Scritte da aiutanti e ricontrollate da altri (10 nov 2026).\n";
const js = testa + "window.SG_MURO_ARG = " + JSON.stringify(ARG.map(a => ({ id: a[0], nome: a[1], icona: a[2] }))) + ";\n" +
  "window.SG_MURO_DOM = {\n" + ARG.map(a => "  " + a[0] + ": [\n" + out[a[0]].map(q => "    " + JSON.stringify(q)).join(",\n") + "\n  ]").join(",\n") + "\n};\n";
fs.writeFileSync(OUT, js, "utf8");
console.log("Scritto " + OUT + ": " + tot + " domande (tolte " + tolte + ", corrette " + corrette + ")");
console.log(JSON.stringify(conto));

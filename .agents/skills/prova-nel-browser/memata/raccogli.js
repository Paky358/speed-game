// Raccoglie i modelli di meme di Imgflip con i riquadri del loro generatore.
// Piano: una richiesta ogni 1,5 s, si può fermare e riprendere (salva riga per riga).
// node raccogli.js <cartella dati>
const fs = require("fs"), path = require("path");
const DIR = process.argv[2] || "D:/SG-meme-prove/dati";
const UA = "SPeeD-GAME party game (ricerca modelli, una richiesta ogni 1,5 s)";
const dorme = ms => new Promise(r => setTimeout(r, ms));
async function prendi(url) {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (r.status === 429) { await dorme(30000); continue; }
      if (!r.ok) return null;
      return await r.text();
    } catch (e) { await dorme(5000); }
  }
  return null;
}
// il pezzo "memes=" della pagina: un elenco [...] o un oggetto {...}, contato con le parentesi
function estrai(h) {
  const i = h.indexOf("memes="); if (i < 0) return null;
  let j = i + 6, apre = h[j], chiude = apre === "[" ? "]" : "}", d = 0, str = false;
  for (let k = j; k < h.length; k++) {
    const c = h[k];
    if (str) { if (c === "\\") k++; else if (c === '"') str = false; continue; }
    if (c === '"') str = true; else if (c === apre) d++; else if (c === chiude) { d--; if (!d) return h.slice(j, k + 1); }
  }
  return null;
}
(async () => {
  const fElenco = path.join(DIR, "elenco.json");
  let elenco = fs.existsSync(fElenco) ? JSON.parse(fs.readFileSync(fElenco, "utf8")) : null;
  if (!elenco) {
    elenco = [];
    for (let p = 1; p < 80; p++) {
      const h = await prendi("https://imgflip.com/memetemplates?page=" + p);
      await dorme(1500);
      if (!h) break;
      const nomi = [...new Set([...h.matchAll(/href="\/meme\/([^"?#]+)"/g)].map(m => m[1]))];
      if (!nomi.length) break;
      nomi.forEach(n => elenco.push({ n, pos: elenco.length }));
      console.log("pagina", p, elenco.length);
    }
    fs.writeFileSync(fElenco, JSON.stringify(elenco));
  }
  const fOut = path.join(DIR, "modelli.jsonl");
  const fatti = new Set();
  if (fs.existsSync(fOut)) fs.readFileSync(fOut, "utf8").split("\n").filter(Boolean).forEach(r => fatti.add(JSON.parse(r).n));
  for (const e of elenco) {
    if (fatti.has(e.n)) continue;
    const h = await prendi("https://imgflip.com/memegenerator/" + e.n);
    await dorme(1500);
    let rec = { n: e.n, pos: e.pos, ok: false };
    if (h) {
      const m = estrai(h);
      if (m) {
        try {
          const o = JSON.parse(m), a = Array.isArray(o) ? o : Object.values(o);
          const idUrl = (e.n.match(/^(\d+)\//) || [])[1];
          // la voce giusta è quella col nome della pagina (di solito la prima)
          const x = a.find(z => (idUrl && String(z.id) === idUrl) || String(z.url_name) === e.n);
          if (!x) throw new Error("modello non trovato nella pagina");
          rec = { n: e.n, pos: e.pos, ok: true, id: x.id, nome: x.name, w: x.w, h: x.h, tipo: x.file_type,
            sfw: x.safe_for_work, alt: x.altNames || "", box: x.default_settings ? JSON.parse(x.default_settings) : [],
            primo: a[0] === x };
        } catch (err) { rec.err = String(err); }
      }
    }
    fs.appendFileSync(fOut, JSON.stringify(rec) + "\n");
    if (e.pos % 50 === 0) console.log("modello", e.pos, rec.nome || "-");
  }
  console.log("FINITO");
})();

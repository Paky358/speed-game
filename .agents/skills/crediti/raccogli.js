// Raccoglie autore e licenza delle foto da Wikimedia Commons (e della foto principale delle pagine di Wikipedia di «Da dove viene?»).
// node raccogli.js <cartella del progetto> <file di uscita .json>
// Piano: una richiesta alla volta, una ogni 1,5 s, maxlag=5, User-Agent generico.
"use strict";
const fs = require("fs"), path = require("path");
const PROG = process.argv[2], USCITA = process.argv[3];
const UA = "RevelHouse-crediti/1.0 (https://revelhouse.it; raccolta dei crediti delle foto)";
const PAUSA = 1500;
global.window = global;
require(path.join(PROG, "data/prezzo-foto.js"));
require(path.join(PROG, "data/linea-foto.js"));
require(path.join(PROG, "data/dadoveviene-carte.js"));
const dorme = ms => new Promise(r => setTimeout(r, ms));
let ultima = 0;
async function chiedi(url) {
  for (let prova = 0; prova < 6; prova++) {
    const att = ultima + PAUSA - Date.now(); if (att > 0) await dorme(att);
    ultima = Date.now();
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA } });
      if (r.status === 429 || r.status >= 500) { const ra = +r.headers.get("retry-after") || 10; console.log("aspetto", ra, "s (", r.status, ")"); await dorme(ra * 1000); continue; }
      const j = await r.json();
      if (j.error && j.error.code === "maxlag") { await dorme(6000); continue; }
      return j;
    } catch (e) { console.log("errore rete, riprovo:", e.message); await dorme(5000); }
  }
  throw new Error("non risponde: " + url);
}
function titoloDa(percorso) {
  let nome = String(percorso).split("|")[0].split("/").pop();
  try { nome = decodeURIComponent(nome); } catch (e) {}
  return "File:" + nome.replace(/_/g, " ");
}
const CAMPI = "Artist|Credit|LicenseShortName|LicenseUrl|UsageTerms|AttributionRequired|Copyrighted|Restrictions|Attribution|DateTimeOriginal";
async function infoFile(api, titoli) {
  const out = {};
  for (let i = 0; i < titoli.length; i += 50) {
    const pezzo = titoli.slice(i, i + 50);
    const u = api + "?action=query&format=json&formatversion=2&maxlag=5&prop=imageinfo&iiprop=extmetadata|url&iiextmetadatafilter=" + encodeURIComponent(CAMPI) +
      "&iiextmetadatalanguage=it&titles=" + encodeURIComponent(pezzo.join("|"));
    const j = await chiedi(u);
    const norm = {}; ((j.query && j.query.normalized) || []).forEach(n => { norm[n.to] = n.from; });
    ((j.query && j.query.pages) || []).forEach(p => {
      const da = norm[p.title] || p.title;
      if (p.missing && !p.imageinfo) { out[da] = { manca: true, titolo: p.title }; return; }
      const ii = (p.imageinfo || [])[0] || {}, m = ii.extmetadata || {};
      const v = k => m[k] ? String(m[k].value) : "";
      out[da] = { titolo: p.title, repo: p.imagerepository || "", pagina: ii.descriptionurl || "", artista: v("Artist"), credito: v("Credit"), licenza: v("LicenseShortName"),
        url: v("LicenseUrl"), termini: v("UsageTerms"), attr: v("AttributionRequired"), copy: v("Copyrighted"), limiti: v("Restrictions"), attribuzione: v("Attribution") };
    });
    process.stdout.write("\r" + api.split("/")[2] + " " + Math.min(i + 50, titoli.length) + "/" + titoli.length + "   ");
  }
  console.log("");
  return out;
}
(async function () {
  const risultato = { prezzo: {}, linea: {}, ddv: {}, scopa: {} };
  const tit = o => { const m = {}; Object.keys(o).forEach(k => { const v = o[k]; if (/^loc:/.test(v)) return; const t = titoloDa(v); (m[t] = m[t] || []).push(k); }); return m; };
  const P = tit(window.SG_PREZZO_FOTO), L = tit(window.SG_TL_FOTO);
  const tutti = Array.from(new Set(Object.keys(P).concat(Object.keys(L))));
  const info = await infoFile("https://commons.wikimedia.org/w/api.php", tutti);
  Object.keys(P).forEach(t => { risultato.prezzo[t] = { usi: P[t], info: info[t] }; });
  Object.keys(L).forEach(t => { risultato.linea[t] = { usi: L[t], info: info[t] }; });
  // Da dove viene?: la foto principale (pageimages) di ogni pagina di Wikipedia, per lingua
  const perLingua = {};
  window.SG_DDV_CARTE.forEach(c => { const m = /^([a-z\-]+):(.+)$/.exec(c.w || ""); if (!m) return; (perLingua[m[1]] = perLingua[m[1]] || []).push({ id: c.id, n: c.n, t: decodeURIComponent(m[2]).replace(/_/g, " ") }); });
  for (const lg of Object.keys(perLingua)) {
    const api = "https://" + lg + ".wikipedia.org/w/api.php", l = perLingua[lg], foto = {};
    for (let i = 0; i < l.length; i += 50) {
      const pezzo = l.slice(i, i + 50);
      const j = await chiedi(api + "?action=query&format=json&formatversion=2&maxlag=5&redirects=1&prop=pageimages&piprop=name|original&titles=" + encodeURIComponent(pezzo.map(x => x.t).join("|")));
      const mappa = {}; ((j.query && j.query.normalized) || []).concat((j.query && j.query.redirects) || []).forEach(n => { mappa[n.from] = n.to; });
      const perT = {}; ((j.query && j.query.pages) || []).forEach(p => { perT[p.title] = p.pageimage || null; });
      pezzo.forEach(x => { let t = x.t; for (let k = 0; k < 3 && mappa[t]; k++) t = mappa[t]; foto[x.id] = { carta: x, file: perT[t] ? "File:" + perT[t].replace(/_/g, " ") : null }; });
    }
    const titoli = Array.from(new Set(Object.values(foto).map(f => f.file).filter(Boolean)));
    const inf = titoli.length ? await infoFile(api, titoli) : {};
    Object.keys(foto).forEach(id => { const f = foto[id]; risultato.ddv[id] = { carta: f.carta, lingua: lg, file: f.file, info: f.file ? inf[f.file] : null }; });
  }
  // Scopa, Scopone, Scopa 2: le carte napoletane (Wikimedia Commons, Trocche100)
  const s = await chiedi("https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&list=search&srnamespace=6&srlimit=20&srsearch=" + encodeURIComponent("Trocche100 napoletane"));
  risultato.scopa.ricerca = ((s.query && s.query.search) || []).map(x => x.title);
  if (risultato.scopa.ricerca.length) risultato.scopa.info = await infoFile("https://commons.wikimedia.org/w/api.php", risultato.scopa.ricerca.slice(0, 10));
  fs.writeFileSync(USCITA, JSON.stringify(risultato, null, 1));
  console.log("fatto:", USCITA);
})().catch(e => { console.error(e); process.exit(1); });

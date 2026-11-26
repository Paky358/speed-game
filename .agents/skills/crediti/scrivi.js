// Da crediti.json (raccogli.js) a pagine/crediti-foto.js (la pagina crediti.html) e all'elenco delle foto dubbie per il proprietario.
// node scrivi.js <progetto> <crediti.json> <file dubbie .md>
"use strict";
const fs = require("fs"), path = require("path");
const [PROG, JS, DUBBIE] = process.argv.slice(2);
const R = JSON.parse(fs.readFileSync(JS, "utf8"));
global.window = global;
fs.readdirSync(path.join(PROG, "data")).filter(f => /^prezzo-\d\.js$/.test(f)).forEach(f => require(path.join(PROG, "data", f)));
const P = window.SG_PREZZO, nomeP = {};
P.prodotti.forEach(p => { nomeP[p.id] = p.nome; });
P.vetrine.forEach(v => v.pezzi.forEach((x, i) => { nomeP[(v.id || v.titolo) + "#" + i] = x.nome + " (vetrina «" + v.titolo + "»)"; }));

function testo(h) {
  return String(h || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/\s+/g, " ").trim();
}
function corto(s, n) { s = testo(s); return s.length > n ? s.slice(0, n - 1).trim() + "…" : s; }
// le licenze che chiedono solo autore, licenza e link (o niente): le altre vanno al proprietario
function semplice(l) {
  return /^(CC BY(-SA)? [\d.]+( [a-z]+)?|CC0|Public domain|PDM-owner|Attribution|Copyrighted free use|OGL 3)$/i.test(l);
}
const URL_LIC = {
  "Public domain": "https://commons.wikimedia.org/wiki/Commons:Licensing#Public_domain",
  "Attribution": "https://commons.wikimedia.org/wiki/Template:Attribution",
  "Copyrighted free use": "https://commons.wikimedia.org/wiki/Template:Copyrighted_free_use",
  "GFDL": "https://www.gnu.org/copyleft/fdl.html", "GFDL 1.2": "https://www.gnu.org/licenses/old-licenses/fdl-1.2.html",
  "GPL": "https://www.gnu.org/licenses/gpl.html", "FAL": "https://artlibre.org/licence/lal/en/",
  "European Parliament": "https://commons.wikimedia.org/wiki/Template:EP", "PDM-owner": "https://creativecommons.org/publicdomain/mark/1.0/"
};
const lic = [], licI = {};
function idLic(info) {
  const nome = info.licenza || "Vedi la pagina";
  let u = info.url || URL_LIC[nome] || "";
  u = u.replace(/^http:/, "https:");
  const k = nome + "|" + u;
  if (!(k in licI)) { licI[k] = lic.length; lic.push([nome, u]); }
  return licI[k];
}
const dubbie = [];
function voce(gruppo, titolo, info, cosa) {
  const file = titolo.replace(/^File:/, "");
  const grezzo = testo(info.artista) || testo(info.credito) || testo(info.attribuzione);
  const chiede = /scrivimi|contattami|contact me|please (contact|notify|let me)|e-?mail me|appreciate being notified/i.test(grezzo);
  const utente = /Special:EmailUser\/([^"]+)"/.exec(info.artista || "");
  const chi = corto(grezzo.split(/ (?:Scrivimi|Contattami|Please|Contact me)/i)[0], 140) || "autore nella pagina della foto";
  const chiV = /^I would appreciate/i.test(chi) ? (utente ? decodeURIComponent(utente[1]).replace(/_/g, " ") : "autore nella pagina della foto") : chi;
  const l = info.licenza || "";
  if (!semplice(l) || chiede || info.repo === "local" && gruppo === "ddv") dubbie.push({ gruppo, file, cosa, licenza: (l || "(nessuna)") + (chiede ? " · l autore chiede di essere avvisato fuori da Wikimedia" : ""), chi: chiV, pagina: info.pagina || "", limiti: info.limiti || "" });
  // [file, autore, licenza, cosa, dominio ("" = Commons, "en" = en.wikipedia…)]
  const v = [file, chiV, idLic(info), cosa];
  if (info.repo === "local" && gruppo === "ddv") v.push(info.pagina);
  return v;
}
const gruppi = [];
// 🏷️ Il Prezzo è Giusto
{
  const f = [];
  Object.keys(R.prezzo).sort((a, b) => a.localeCompare(b)).forEach(t => {
    const x = R.prezzo[t]; const cosa = Array.from(new Set(x.usi.map(id => nomeP[id] || id))).join(" · ");
    f.push(voce("prezzo", t, x.info, cosa));
  });
  gruppi.push({ id: "prezzo", nome: "🏷️ Il Prezzo è Giusto", nota: "Le foto dei prodotti e dei premi delle vetrine.", f });
}
// 🕰️ La linea del tempo
{
  const f = [];
  Object.keys(R.linea).sort((a, b) => a.localeCompare(b)).forEach(t => {
    const x = R.linea[t]; const cosa = Array.from(new Set(x.usi.map(k => k.split("|").slice(1).join("|")))).join(" · ");
    f.push(voce("linea", t, x.info, cosa));
  });
  gruppi.push({ id: "linea", nome: "🕰️ La linea del tempo", nota: "Le foto delle carte.", f });
}
// 🍹 Da dove viene?
{
  const perFile = {};
  Object.keys(R.ddv).forEach(id => { const x = R.ddv[id]; if (!x.file || !x.info) return; (perFile[x.file] = perFile[x.file] || { info: x.info, cose: [] }).cose.push(x.carta.n); });
  const f = Object.keys(perFile).sort((a, b) => a.localeCompare(b)).map(t => voce("ddv", t, perFile[t].info, perFile[t].cose.join(" · ")));
  gruppi.push({ id: "ddv", nome: "🍹 Da dove viene?", nota: "La foto principale della pagina di Wikipedia di ogni piatto e drink: il gioco la prende al momento, quindi può cambiare se cambia la pagina. Elenco del 26 novembre 2026.", f });
}
// 🃏 le carte napoletane (Scopa, Scopa 2, Scopone)
{
  const info = (R.scopa.info || {})["File:Carte Napoletane retro.jpg"] || { artista: "Trocche100 (Wikipedia in italiano)", licenza: "Public domain" };
  gruppi.push({ id: "carte", nome: "🃏 Le carte napoletane", nota: "Scopa, Scopa 2 e Scopone: il mazzo napoletano disegnato da Trocche100 su Wikipedia in italiano e messo nel pubblico dominio (le scritte del produttore tolte da noi).",
    f: [["Carte Napoletane retro.jpg", corto(info.artista, 140), idLic(info), "Il mazzo napoletano (40 carte)"]] });
}
const tot = gruppi.reduce((n, g) => n + g.f.length, 0);
const out = "/* 📜 I CREDITI DELLE FOTO (pagina crediti.html). Fatto con .agents/skills/crediti/ (raccogli.js + scrivi.js) il 26 nov 2026,\n" +
  "   dall'API di Wikimedia Commons (imageinfo, extmetadata): per ogni foto autore, licenza e link.\n" +
  "   lic = [nome, link della licenza]; ogni foto = [file su Commons, autore, numero della licenza, dove la usiamo(, pagina se non è su Commons)].\n" +
  "   Si rifà quando cambiano data/prezzo-foto.js, data/linea-foto.js o data/dadoveviene-carte.js. NON metterlo in data/: finirebbe nel cuore dell'app. */\n" +
  "window.SG_CREDITI_FOTO = " + JSON.stringify({ agg: "26 novembre 2026", tot, lic, gruppi }) + ";\n";
fs.writeFileSync(path.join(PROG, "pagine/crediti-foto.js"), out);
let md = "# Foto con una licenza da guardare (26 nov 2026)\n\nLicenze che chiedono più di autore + licenza + link, o senza una licenza libera chiara. NON tolte: decide il proprietario.\n\n";
md += "| Gioco | Dove | File | Licenza | Autore | Pagina |\n|---|---|---|---|---|---|\n";
dubbie.forEach(d => { md += "| " + d.gruppo + " | " + d.cosa.replace(/\|/g, "/") + " | " + d.file.replace(/\|/g, "/") + " | " + d.licenza + " | " + d.chi.replace(/\|/g, "/") + " | " + d.pagina + " |\n"; });
fs.writeFileSync(DUBBIE, md);
console.log("foto:", tot, "licenze:", lic.length, "dubbie:", dubbie.length, "peso:", Math.round(out.length / 1024) + " KB");
gruppi.forEach(g => console.log(g.id, g.f.length));

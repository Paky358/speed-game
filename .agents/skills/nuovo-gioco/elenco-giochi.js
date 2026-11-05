// 📦 RIFÀ LE SCHEDE DEI GIOCHI in js/elenco-giochi.js (#31, parte 2, 4 nov 2026).
// Carica in una scatola finta (Node, niente browser) i file di index.html e poi i pezzi dell'elenco,
// guarda cosa registra ogni gioco (SG.registra) e scrive per ognuno la sua scheda: tutto quello che
// non è codice (nome, icona, giocatori, modi…), senza le regole (arrivano col gioco).
// Uso (dalla cartella del progetto):
//   "C:\Program Files\nodejs\node.exe" .agents/skills/nuovo-gioco/elenco-giochi.js            → riscrive le schede
//   "C:\Program Files\nodejs\node.exe" .agents/skills/nuovo-gioco/elenco-giochi.js --controlla → dice solo se sono da rifare
// Niente npm: usa solo quello che c'è già in Node.
"use strict";
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "../../..");
const ELENCO = path.join(ROOT, "js/elenco-giochi.js");
const CONTROLLA = process.argv.includes("--controlla");
const SENZA = { regole: 1 };   // (i campi che non vanno nella scheda: arrivano col gioco)

// ---- i file del file principale (index.html) e i pezzi (righe pezzo("…", "…", "…") dell'elenco) ----
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const principali = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(f => !/^https?:/.test(f) && f !== "js/elenco-giochi.js");
const testo = fs.readFileSync(ELENCO, "utf8");
const pezzi = [];
for (const m of testo.matchAll(/^\s*pezzo\("([a-z0-9-]+)",\s*"([^"]*)"(?:,\s*"([^"]*)")?\)/gm))
  pezzi.push({ nome: m[1], file: m[2].split(/\s+/).filter(Boolean), dopo: (m[3] || "").split(/\s+/).filter(Boolean) });
const perNome = {}; pezzi.forEach(p => perNome[p.nome] = p);
const pezzoDi = {}, posto = {};   // file → pezzo; file → posto nell'ordine delle righe (così le schede restano nell'ordine di sempre)
let n = 0; pezzi.forEach(p => p.file.forEach(f => { if (!pezzoDi[f]) { pezzoDi[f] = p.nome; posto[f] = n++; } }));
const errori = [], giaIn = {};
const righePezzo = (testo.match(/^\s*pezzo\(/gm) || []).length;
if (righePezzo !== pezzi.length) errori.push("ci sono " + righePezzo + " righe pezzo( ma solo " + pezzi.length + " scritte giuste: pezzo(\"nome-minuscolo\", \"file …\", \"prima …\") su una riga sola");
pezzi.forEach(p => { p.file.forEach(f => { if (giaIn[f]) errori.push(f + " è in due pezzi (" + giaIn[f] + " e " + p.nome + ")"); giaIn[f] = p.nome; if (!fs.existsSync(path.join(ROOT, f))) errori.push("il pezzo " + p.nome + " ha un file che non c'è: " + f); if (principali.includes(f)) errori.push(f + " è sia in index.html sia nel pezzo " + p.nome + " (in index.html va tolto)"); });
  p.dopo.forEach(d => { if (!perNome[d]) errori.push("il pezzo " + p.nome + " vuole prima «" + d + "», che non c'è"); }); });
// (un file di dati o di un gioco che non è da nessuna parte non si carica mai)
for (const dir of ["data", "js/games"]) for (const f of fs.readdirSync(path.join(ROOT, dir))) {
  const r = dir + "/" + f; if (/\.js$/.test(f) && !pezzoDi[r] && !principali.includes(r)) errori.push("nessuno carica " + r + " (né index.html né un pezzo)");
}

// ---- la scatola finta: un browser che dice sì a tutto ----
function qualsiasi() { const f = function () {}; let p; p = new Proxy(f, { get(t, k) { if (k === Symbol.toPrimitive) return () => ""; if (k === "length") return 0; if (k === Symbol.iterator) return function* () {}; if (k === "then") return undefined; return p; }, set() { return true; }, apply() { return p; }, construct() { return p; }, has() { return true; } }); return p; }
const Q = qualsiasi(), mem = {};
const LS = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; }, key: () => null, length: 0, clear() {} };
const fn = function () { return Q; };
const ctx = { console: { log() {}, warn() {}, error() {}, info() {} }, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  document: Q, navigator: { userAgent: "node", vibrate() {} }, localStorage: LS, sessionStorage: LS, location: { hash: "", hostname: "x", search: "", pathname: "/", href: "http://x/", origin: "http://x" },
  history: Q, addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }), getComputedStyle: () => Q,
  Image: fn, Audio: fn, fetch: () => new Promise(() => {}), performance: { now: () => 0 }, innerWidth: 400, innerHeight: 800, devicePixelRatio: 2,
  HTMLElement: function () {}, Element: function () {}, Node: function () {}, CSS: { supports: () => false }, screen: { width: 400, height: 800 }, mqtt: Q, Ably: Q, firebase: Q,
  TextEncoder, TextDecoder, crypto: { getRandomValues: a => a, subtle: Q }, URL, URLSearchParams, Blob: function () {}, FileReader: fn, Path2D: fn, DOMParser: fn, XMLHttpRequest: fn,
  MutationObserver: fn, ResizeObserver: fn, IntersectionObserver: fn, WebSocket: fn, Event: function () {}, CustomEvent: function () {}, alert() {}, open() {}, scrollTo() {},
  atob: s => Buffer.from(s, "base64").toString("binary"), btoa: s => Buffer.from(s, "binary").toString("base64") };
ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx; ctx.top = ctx; ctx.parent = ctx;
vm.createContext(ctx);
const registrati = []; let ora = null;
function esegui(f) {
  ora = f;
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f }); } catch (e) { errori.push(f + " non si carica nella prova: " + e.message); }
  if (f === "js/core.js" && ctx.SG) { const r0 = ctx.SG.registra; ctx.SG.registra = function (g) { registrati.push({ file: ora, g: g }); return r0.apply(this, arguments); }; }
}
principali.forEach(esegui);
const caricati = {};
function carica(nome) { const p = perNome[nome]; if (!p || caricati[nome]) return; caricati[nome] = 1; p.dopo.forEach(carica); p.file.forEach(esegui); }
pezzi.forEach(p => carica(p.nome));

// ---- le schede ----
const schede = registrati.filter(r => pezzoDi[r.file]).map((r, i) => ({ r, i })).sort((a, b) => posto[a.r.file] - posto[b.r.file] || a.i - b.i).map(x => x.r);
const visti = {};
const righe = schede.filter(r => !visti[r.g.id] && (visti[r.g.id] = 1)).map(r => {
  const d = {};
  Object.keys(r.g).forEach(k => { const v = r.g[k]; if (k === "id" || SENZA[k] || /^_/.test(k) || typeof v === "function" || v === undefined) return; d[k] = v; });
  return "  scheda(" + JSON.stringify(r.g.id) + ", " + JSON.stringify(pezzoDi[r.file]) + ", " + JSON.stringify(d) + ");";
});
const blocco = "  // >>> SCHEDE\n" + righe.join("\n") + (righe.length ? "\n" : "") + "  // <<< SCHEDE";
const crlf = /\r\n/.test(testo);
const nuovo = testo.replace(/[ \t]*\/\/ >>> SCHEDE[\s\S]*?\/\/ <<< SCHEDE/, (crlf ? blocco.replace(/\n/g, "\r\n") : blocco));
// (un pezzo con un file di js/games/ da cui non si è registrato nessun gioco: quel gioco sparirebbe dalla home e dalla Sala)
pezzi.forEach(p => { const gf = p.file.filter(f => /^js\/games\//.test(f)); if (gf.length && !gf.some(f => registrati.some(r => r.file === f))) errori.push("il pezzo " + p.nome + " non registra nessun gioco (si è rotto nella prova?)"); });
if (errori.length) { console.log("⚠️ " + errori.join("\n⚠️ ")); console.log("❌ Non scrivo niente: prima sistema questi problemi."); process.exit(1); }
if (nuovo === testo) { console.log("✅ Le schede dei giochi sono già giuste (" + righe.length + " giochi)."); process.exit(0); }
if (CONTROLLA) { console.log("❌ Le schede dei giochi sono da rifare: lancia elenco-giochi.js senza --controlla."); process.exit(1); }
fs.writeFileSync(ELENCO, nuovo);
console.log("✅ Schede riscritte: " + righe.length + " giochi in js/elenco-giochi.js.");
process.exit(errori.length ? 1 : 0);

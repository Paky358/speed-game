// Scrive index.html (confronto completo) e confronto.html (da cui foto.js fa confronto.png).
// Uso: node pagine.js (dopo genera.js e foto.js), poi node foto.js confronto
const fs = require("fs"), path = require("path");
const { T, CONTRASTI } = require("./genera.js");
const dir = __dirname;
const ORDINE = ["prima", "oggi", "a", "b", "c"];
const virgola = n => String(n).replace(".", ",");
const TITOLO = { prima: "PRIMA", oggi: "OGGI", a: "A · Notte vivace", b: "B · Colori pieni su chiaro", c: "C · Gradienti caldi" };
const SOTTO = { prima: "Blu cartoon (com'era)", oggi: "Bianco e oro (com'è adesso)", a: "Blu notte, vetro scuro, lampone", b: "Grigio chiaro, blu, colori per categoria", c: "Sera dal viola al vino, arancio-corallo" };
const CONSIGLIO = "a";

const stile = `*{box-sizing:border-box}body{margin:0;background:#ebebef;color:#16171d;font-family:"Inter",-apple-system,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.pag{max-width:1880px;margin:0 auto;padding:32px 24px 56px}
h1{margin:0;font-size:30px;letter-spacing:-.02em}h2{margin:42px 0 6px;font-size:21px;letter-spacing:-.01em}.sub{margin:6px 0 0;color:#565a68;font-size:15px;line-height:1.5;max-width:860px}
.fila{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:22px;margin-top:16px}
figure{margin:0}figure img{width:100%;display:block;border-radius:30px;box-shadow:0 14px 34px rgba(20,22,40,.20)}
figcaption{margin-top:10px;text-align:center}figcaption b{display:block;font-size:15px}figcaption span{display:block;font-size:13px;color:#5d6170;margin-top:2px}
.pref figcaption b:after{content:" ★ consigliata";color:#c2185b;font-weight:700}
.strade{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:22px;margin-top:16px}
.strada{background:#fff;border-radius:20px;padding:20px 20px 16px;box-shadow:0 1px 2px rgba(20,22,40,.06),0 8px 24px rgba(20,22,40,.06)}
.strada h3{margin:0;font-size:18px}.strada p{margin:6px 0 14px;color:#4c505d;font-size:14px;line-height:1.45}
.campioni{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}.campioni div{width:calc(20% - 7px);min-width:58px;font-size:10.5px;color:#4c505d;line-height:1.25}
.campioni i{display:block;height:34px;border-radius:9px;margin-bottom:4px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)}
table{width:100%;border-collapse:collapse;font-size:13px}td{padding:6px 0;border-top:1px solid #eceef2}td.n{text-align:right;font-weight:700;white-space:nowrap;padding-left:10px}td.n em{font-style:normal;color:#1e8e4a;margin-left:4px}
.consiglio{margin-top:16px;background:#fff;border-radius:20px;padding:20px 22px;font-size:15px;line-height:1.55;max-width:960px;box-shadow:0 1px 2px rgba(20,22,40,.06),0 8px 24px rgba(20,22,40,.06)}
.consiglio b{color:#c2185b}
@media (max-width:600px){.pag{padding:20px 16px 40px}h1{font-size:24px}.fila{grid-template-columns:1fr 1fr;gap:14px}figure img{border-radius:18px}}`;

const fig = (src, k, extra) => `<figure${k === CONSIGLIO && !extra ? ' class="pref"' : ""}><img src="${src}" alt="${TITOLO[k]}" loading="lazy"><figcaption><b>${TITOLO[k]}${extra || ""}</b><span>${SOTTO[k]}</span></figcaption></figure>`;
const strada = k => `<div class="strada"><h3>${T[k].nome}</h3><p>${T[k].idea}</p>
 <div class="campioni">${T[k].colori.map(([n, c]) => `<div><i style="background:${c}"></i>${n}<br>${c}</div>`).join("")}</div>
 <table>${CONTRASTI[k].map(([c, v]) => `<tr><td>${c}</td><td class="n">${virgola(v)}:1<em>${v >= 4.5 ? "✓" : "✗"}</em></td></tr>`).join("")}</table></div>`;

fs.writeFileSync(path.join(dir, "index.html"), `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Colori dei menu</title><style>${stile}</style></head><body><div class="pag">
<h1>SPeeD GAME · tre strade di colore per i menu</h1>
<p class="sub">Colori accesi ma eleganti, non cartoon. Per confrontare solo i colori, PRIMA e OGGI sono rifatti con la stessa impaginazione delle tre strade (in fondo ci sono le foto dell'app vera). Le foto dei giochi e gli avatar sono quelli veri. Telefono 390×844.</p>
<h2>Prima schermata</h2><div class="fila">${ORDINE.map(k => fig(k + "-home.png", k)).join("")}</div>
<h2>Saletta d'attesa</h2><div class="fila">${ORDINE.map(k => fig(k + "-sala.png", k)).join("")}</div>
<h2>Le tre strade: colori e contrasto delle scritte</h2>
<p class="sub">Contrasto misurato con la formula delle linee guida per l'accessibilità (WCAG): serve almeno 4,5:1. Dove il fondo cambia (sfumature, vetro, foto sotto le scritte) è calcolato nel punto peggiore.</p>
<div class="strade">${["a", "b", "c"].map(strada).join("")}</div>
<h2>Il mio consiglio</h2>
<div class="consiglio"><b>A · Notte vivace.</b> Riprende il blu notte che piaceva prima, ma senza l'aria da cartone: niente esagoni, niente tasti gialli lucidi. Le foto dei giochi (scure, con luci dorate) stanno a tutto riquadro e sembrano locandine; i colori accesi arrivano da un tasto guida lampone e da un colore per categoria. Sul fondo scuro e neutro funzionano anche i colori delle squadre (rosso, blu, verde) e degli avatar.<br><br>
<b>B</b> è la scelta se si vuole restare sul chiaro: allegra e pulita, ma è la più «Nintendo». <b>C</b> ha più personalità, però il fondo viola-rosso si mescola coi colori delle squadre rosse e con le foto: meglio solo come tocco (per esempio nella Classifica della serata).</div>
<h2>L'app vera, per ricordare</h2>
<div class="fila">${fig("app-vera/prima-home.png", "prima", " · prima schermata")}${fig("app-vera/oggi-home.png", "oggi", " · prima schermata")}${fig("app-vera/prima-saletta.png", "prima", " · saletta")}${fig("app-vera/oggi-saletta.png", "oggi", " · saletta")}</div>
</div></body></html>`);

// immagine unica: le 5 prime schermate una accanto all'altra
fs.writeFileSync(path.join(dir, "confronto.html"), `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Confronto</title><style>
*{box-sizing:border-box}body{margin:0;background:#ebebef;font-family:"Inter",system-ui,sans-serif;color:#16171d;-webkit-font-smoothing:antialiased;width:2190px}
.pag{padding:34px 40px 40px}h1{margin:0;font-size:30px;letter-spacing:-.02em}p{margin:6px 0 0;color:#565a68;font-size:16px}
.fila{display:flex;gap:30px;margin-top:26px}figure{margin:0;width:390px}img{width:390px;display:block;border-radius:34px;box-shadow:0 14px 34px rgba(20,22,40,.22)}
figcaption{margin-top:14px;text-align:center}figcaption b{display:block;font-size:19px}figcaption span{display:block;font-size:15px;color:#5d6170;margin-top:3px}
.sep{width:2px;background:#cfd0d8;border-radius:2px;margin:0 -2px}.pref b:after{content:" ★";color:#c2185b}
</style></head><body><div class="pag"><h1>SPeeD GAME · colori dei menu: com'era, com'è e tre strade nuove</h1>
<p>Stessa prima schermata, cambiano solo i colori. Foto dei giochi e avatar veri. Telefono 390×844.</p>
<div class="fila">${ORDINE.map((k, i) => (i === 2 ? '<div class="sep"></div>' : "") + `<figure${k === CONSIGLIO ? ' class="pref"' : ""}><img src="${k}-home.png" alt=""><figcaption><b>${TITOLO[k]}</b><span>${SOTTO[k]}</span></figcaption></figure>`).join("")}</div>
</div></body></html>`);
console.log("pagine scritte");

// Livello 2 · proposte di COLORI per i menu (prima schermata e saletta). Solo disegni: NON toccano l'app.
// Uso: node genera.js (scrive gli .html), node foto.js (foto dal server di prova sulla porta 8123),
//      node misura.js (contrasto misurato sui pixel veri), node pagine.js, node foto.js confronto.
// Stessa impaginazione per tutti (PRIMA, OGGI e le 3 strade): così si confrontano solo i colori.
const fs = require("fs"), path = require("path");
const dir = __dirname;
const RADICE = "../../../../";   // dalla cartella colori alla radice del progetto

// ---- simboli a linea ----
const I = {
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l3 3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
  cup: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4c0 3 1 4 4 4M16 6h4c0 3-1 4-4 4M12 13v4M8 20h8"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 5a3 3 0 0 1 0 6M18 14c2 .6 3 2.6 3 6"/>',
  send: '<path d="M12 15V4M8 8l4-4 4 4M5 14v5h14v-5"/>',
  play: '<path d="M8 5l11 7-11 7z" fill="currentColor"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  city: '<path d="M3 21h18M5 21V9l5-3v15M10 21V4l6 3v14M16 21v-9l3 1.5V21"/>',
  chart: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>',
};
const ic = (n, s = 20, w = 1.8) => `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;
const mille = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");   // 1.250 (sempre col punto)

// ---- i contenuti veri della home ----
const CATEGORIE = [["tutti", "Tutti", "🎲"], ["carte", "Carte", "🃏"], ["sfida", "1 contro 1", "⚔️"], ["festa", "Festa", "🎉"], ["mini", "Minigiochi", "🎮"], ["parole", "Quiz & parole", "🧠"]];
const NOMECAT = Object.fromEntries(CATEGORIE.map(c => [c[0], c[1]]));
// [foto, nome, riga, giocatori, categoria, ingrandimento, x, y]: la foto intera ha la stessa forma del riquadro
// (800×544); dove intorno c'è solo cielo scuro si ingrandisce un poco, puntando sul soggetto.
const GIOCHI = [
  ["asta", "L'Asta", "Compra all'asta i pezzi migliori.", "2–10", "festa", "100%", "50%", "50%"],        // martello e paletta interi
  ["timeline", "La linea del tempo", "Metti gli avvenimenti in ordine.", "1–10", "parole", "100%", "50%", "50%"],   // carte e telefono interi
  ["navale", "Battaglia Navale", "Sistema la flotta e affonda.", "2", "sfida", "112%", "45%", "80%"],    // la plancia, meno cielo
  ["poker", "Poker", "Texas Hold'em con le Speed Coins.", "2–8", "carte", "118%", "50%", "88%"],         // carte e fiches, meno cielo
];
const AMICI = ["Paky", "Giulia", "Luca", "Marta", "Sara"];
// i 5 amici nella sala: fila dietro tutta alla stessa altezza (le etichette in riga), fila davanti in basso
const POSTI = [[50, "dietro"], [19, "dietro"], [81, "dietro"], [31, "davanti"], [69, "davanti"]];

// ---- le 5 versioni: PRIMA, OGGI e le 3 strade ----
const T = {
  prima: {
    nome: "PRIMA · blu cartoon", corto: "PRIMA", emoji: true,
    cat: {}, icone: [], pers: ["#ffc93c", "#ffc93c", "#ffc93c", "#ffc93c", "#ffc93c"],
    css: `.prima{--testo:#fff;--tenue:#c3cbef;--surf:#26346f;--surf2:#1d2860;--bordo:rgba(255,255,255,.16);--acc-t:#3a2a00;--r:22px;--rb:22px}
    .prima.sch{background:radial-gradient(70% 45% at 50% 30%,rgba(70,90,190,.45),transparent 70%),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='48.5' viewBox='0 0 28 48.5'%3E%3Cpath d='M14 0l14 8.1v16.2L14 32.3 0 24.3V8.1zM14 32.3v16.2' fill='none' stroke='%23ffffff' stroke-opacity='.06' stroke-width='1'/%3E%3C/svg%3E"),linear-gradient(180deg,#1c2a63,#141d4a)}
    .prima .logo{font-weight:900;font-size:38px;letter-spacing:-.01em;background:linear-gradient(180deg,#ffe27a,#e69a12);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 0 10px rgba(255,180,30,.55))}
    .prima .logo b{font-weight:900}.prima .logo-sotto{font-size:18px;letter-spacing:.5em;margin:-6px 0 2px}
    .prima .chip,.prima .icone a,.prima .btn-s,.prima .btn-t,.prima .tab,.prima .cod,.prima .classif{background:linear-gradient(180deg,#2c3b7c,#223068);border:1.5px solid rgba(255,255,255,.18);box-shadow:0 4px 0 rgba(8,12,40,.45)}
    .prima .chip .faccia{box-shadow:0 0 0 2px #5bc0eb}
    .prima .lv{background:#ffc93c;color:#3a2a00;font-weight:800;border-radius:6px;padding:0 6px}.prima .liv .barra i{background:#ffc93c}
    .prima .monete{color:#ffc93c}.prima .icone a{color:#fff;font-weight:800}.prima .icone a .lab{color:#fff;font-size:11.5px}
    .prima .btn{font-weight:800;border-radius:999px}
    .prima .btn-p{background:linear-gradient(180deg,#ffe068,#f5b800);color:#3a2a00;box-shadow:inset 0 2px 0 rgba(255,255,255,.55),0 4px 0 #b98400,0 8px 18px rgba(255,190,0,.35)}
    .prima .tab{color:#fff;font-weight:800;border-radius:16px}.prima .tab.on{background:linear-gradient(180deg,#ffe068,#f5b800);color:#3a2a00;border-color:#ffe9a0}
    .prima .tess{background:linear-gradient(180deg,#2b3d86,#22316f);border:1.5px solid rgba(255,255,255,.16);border-radius:var(--r);box-shadow:0 5px 0 rgba(8,12,40,.45)}
    .prima .tess h2{font-weight:800;font-size:16px}.prima .tess p{color:#c8d0f0}.prima .tess .meta{color:#ffc93c;font-weight:800}
    .prima .bar h1{font-weight:900;font-size:24px}
    .prima .cod small{color:#c3cbef}.prima .cod b{font-weight:900;color:#fff}
    .prima .stanza{background:linear-gradient(180deg,transparent 49%,#6e4425 49%,#8a5631),repeating-linear-gradient(90deg,#5b3fa0 0 16px,#513793 16px 32px),linear-gradient(180deg,#5b3fa0,#4a3290);border:2px solid rgba(255,255,255,.14)}
    .prima .stanza:before{content:"";position:absolute;left:8%;right:8%;bottom:3%;height:22%;border-radius:50%;background:radial-gradient(closest-side,#d33a3a 70%,#e8c35a 72%,#c43030 76%,transparent 78%)}
    .prima .ins{top:16px;left:50%;right:auto;transform:translateX(-50%);padding:5px 16px;border:2.5px solid #ffc93c;border-radius:12px;background:#3a2a6e;color:#ffe9a0;letter-spacing:.2em;font-weight:900;font-size:12px}
    .prima .sotto-ins{top:54px;color:#e6defa}
    .prima .nomina{background:#2a1f55;color:#fff;font-weight:800;border:1.5px solid rgba(255,255,255,.25)}.prima .nomina em{color:#ffc93c}
    .prima .pedana{display:none}.prima .arco{display:none}
    .prima .classif{color:#fff;font-weight:800}.prima .classif .i{color:#ffc93c}.prima .nota{color:#c3cbef}`,
  },
  oggi: {
    nome: "OGGI · bianco e oro", corto: "OGGI",
    cat: {}, icone: [], pers: ["#bd931a", "#bd931a", "#bd931a", "#bd931a", "#bd931a"],
    css: `.oggi{--testo:#1e1b16;--tenue:#6b665c;--surf:#fff;--surf2:#f4f2ee;--bordo:#e9e4d8;--acc-t:#1e190d;--tit:"SG Titoli","Cormorant Garamond",Georgia,serif;--r:20px;--rb:18px}
    .oggi.sch{background:#fcfbf9}
    .oggi .logo{font-family:var(--tit);font-weight:700;font-size:40px;letter-spacing:.05em}
    .oggi .logo-sotto{display:flex;align-items:center;gap:10px;justify-content:center;color:#87680c;font-size:10.5px;letter-spacing:.34em;text-transform:uppercase;margin-top:2px}
    .oggi .logo-sotto:before,.oggi .logo-sotto:after{content:"";height:1px;width:40px;background:#bd931a}
    .oggi .chip,.oggi .icone a,.oggi .btn-s,.oggi .btn-t,.oggi .tab,.oggi .classif,.oggi .cod{background:#fff;border:1px solid #e9e4d8;box-shadow:0 1px 2px rgba(62,55,42,.06),0 6px 18px rgba(88,76,54,.08)}
    .oggi .lv{background:linear-gradient(180deg,#efca4c,#cf9f1e);color:#1e190d;font-weight:700;border-radius:99px;padding:0 7px}.oggi .liv .barra i{background:#bd931a}
    .oggi .monete{color:#87680c}.oggi .icone a{color:#bd931a}.oggi .icone a .lab{color:#1e1b16}
    .oggi .btn-p{background:linear-gradient(180deg,#efca4c,#cf9f1e);color:#1e190d;box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 6px 16px rgba(150,110,30,.22)}
    .oggi .btn-s,.oggi .btn-t{border-color:#e2c56a}.oggi .btn-t .i{color:#bd931a}
    .oggi .tab{color:#6b665c}.oggi .tab.on{background:#1e1b16;color:#efd88f;border-color:#1e1b16}
    .oggi .tess{border-radius:var(--r);background:#fff;border:1px solid #e9e4d8;box-shadow:0 1px 2px rgba(62,55,42,.06),0 6px 18px rgba(88,76,54,.08)}
    .oggi .tess h2{font-family:var(--tit);font-size:19px;font-weight:700}.oggi .tess .meta{color:#87680c}
    .oggi .bar h1{font-family:var(--tit);font-size:28px}
    .oggi .cod{border-color:#e2c56a}.oggi .cod b{font-family:var(--tit);font-weight:700}
    .oggi .stanza{background:radial-gradient(60% 46% at 50% 30%,#fff,transparent 75%),linear-gradient(180deg,#fbfaf7,#f1ede4);border:1px solid #e9e4d8}
    .oggi .arco{stroke:rgba(189,147,26,.35)} .oggi .ins{font-family:var(--tit);color:#87680c;letter-spacing:.32em;font-weight:700;font-size:14px}
    .oggi .pedana{background:radial-gradient(closest-side,rgba(60,50,30,.22),transparent)}
    .oggi .nomina{background:#fff;border:1px solid #e9e4d8}.oggi .nomina em{color:#87680c}
    .oggi .classif .i{color:#bd931a}
    .oggi .pavimento{display:block;background:rgba(190,170,130,.10);border-top:1px solid rgba(189,147,26,.25)}`,
  },

  // ===== A · Notte vivace: il blu di prima, fatto bene =====
  a: {
    nome: "A · Notte vivace", corto: "A · Notte vivace",
    idea: "Il blu di prima, fatto bene: blu notte quasi nero, riquadri di vetro scuro, un solo colore guida (lampone) per i tasti principali e un colore brillante per ogni categoria.",
    cat: { carte: "#3ee0a8", sfida: "#4fd8ff", festa: "#ff9a4a", mini: "#ffd24a", parole: "#b39bff" },
    icone: ["#ff6d97", "#4fd8ff", "#ffc247", "#b39bff"],
    pers: ["#ff5c8a", "#4fd8ff", "#ff9a4a", "#3ee0a8", "#b39bff"],
    css: `.a{--testo:#f4f5fb;--tenue:#a9afcb;--surf:#151a2e;--surf2:#222842;--bordo:rgba(255,255,255,.09);--acc-t:#fff;--tit:"Jakarta","Inter",system-ui,sans-serif;--r:22px;--rb:16px}
    .a.sch{background:radial-gradient(85% 34% at 8% -4%,rgba(110,80,255,.30),transparent 70%),radial-gradient(70% 30% at 100% 0%,rgba(229,36,95,.22),transparent 70%),linear-gradient(180deg,#0d1124,#090b17)}
    .a .logo{font-family:var(--tit);font-weight:800;font-size:35px;letter-spacing:-.025em}
    .a .logo b{font-weight:800;background:linear-gradient(90deg,#ff4f86,#ff9a4a);-webkit-background-clip:text;color:transparent}
    .a .logo-sotto{color:var(--tenue);font-size:10.5px;letter-spacing:.34em;text-transform:uppercase;font-weight:600;margin-top:3px}
    .a .chip,.a .icone a,.a .btn-s,.a .btn-t,.a .tab,.a .classif,.a .cod{background:rgba(255,255,255,.06);border:1px solid var(--bordo);box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
    .a .chip .faccia{box-shadow:0 0 0 2px #0d1124,0 0 0 4px #ff4f86}
    .a .lv{color:var(--tenue)}.a .liv .barra{background:rgba(255,255,255,.1)}.a .liv .barra i{background:linear-gradient(90deg,#ff4f86,#ff9a4a)}
    .a .monete{color:#ffc247}
    /* i 4 tasti in alto: cerchio pieno del suo colore, simbolo scuro (vivi come le categorie) */
    .a .icone a .ico{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;color:#0b0f22;background:radial-gradient(circle at 32% 28%,color-mix(in srgb,var(--ic) 70%,#fff),var(--ic) 62%);box-shadow:0 0 0 1px rgba(255,255,255,.12),0 6px 16px -4px color-mix(in srgb,var(--ic) 60%,transparent)}
    .a .icone a .lab{color:#dfe2f2}.a .icone a .pal{background:#fff;--anello:#0d1124}
    .a .btn{font-weight:700}
    .a .btn-p{background:linear-gradient(180deg,#e0225a,#c8174f);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 10px 26px -6px rgba(229,36,95,.6)}
    .a .btn-t{border:1.5px solid rgba(255,92,138,.75);background:rgba(255,79,134,.10)}.a .btn-t .i{color:#ff6d97}
    .a .tab{color:#dfe2f2}.a .tab .d{display:block}.a .tab.on{background:#f4f5fb;color:#0d1124;border-color:#f4f5fb}
    /* tessere: foto intera in alto (nessun velo), sotto lo stesso disegno sfocato e scuro che fa da fondo alle scritte */
    .a .tess{border-radius:var(--r);background:#0b0e1c;box-shadow:0 14px 30px -12px rgba(0,0,0,.75)}
    .a .tess .alone{display:block;position:absolute;inset:-34px;background:var(--img) 50% 85%/cover no-repeat;filter:blur(22px) saturate(1.6) brightness(.5)}
    .a .tess .foto{position:relative;z-index:1;-webkit-mask-image:linear-gradient(180deg,#000 76%,transparent 100%);mask-image:linear-gradient(180deg,#000 76%,transparent 100%)}
    .a .tess .t{z-index:1;margin-top:-10px;background:linear-gradient(180deg,rgba(9,11,23,0),rgba(9,11,23,.38) 40%,rgba(9,11,23,.55))}
    .a .tess:after{content:"";position:absolute;inset:0;z-index:2;border-radius:inherit;box-shadow:inset 0 0 0 1px rgba(255,255,255,.09);pointer-events:none}
    .a .tess h2{font-family:var(--tit);font-weight:700;font-size:16px;letter-spacing:-.01em}.a .tess p{color:#d3d7ea}.a .tess .meta{color:var(--c)}
    .a .badge{display:flex;background:rgba(9,11,22,.66);color:#fff;border:1px solid rgba(255,255,255,.14)}.a .badge i{background:var(--c)}
    .a .bar h1{font-family:var(--tit);font-weight:800;font-size:24px;letter-spacing:-.02em}
    .a .cod small{color:var(--tenue)}.a .cod b{font-family:var(--tit);font-weight:800}
    .a .stanza{background:radial-gradient(70% 42% at 50% 0%,rgba(229,36,95,.28),transparent 72%),radial-gradient(60% 38% at 0% 100%,rgba(79,216,255,.14),transparent 70%),radial-gradient(60% 38% at 100% 100%,rgba(110,80,255,.18),transparent 70%),linear-gradient(180deg,#161b31,#0e1222);border:1px solid var(--bordo)}
    .a .arco{stroke:rgba(255,255,255,.12)} .a .ins{font-family:var(--tit);color:#fff;letter-spacing:.3em;font-weight:800}
    .a .pedana{background:radial-gradient(closest-side,color-mix(in srgb,var(--pc) 55%,transparent),transparent)}
    .a .nomina{background:rgba(9,11,22,.88);color:#fff;border:1.5px solid var(--pc)}.a .nomina em{color:#ff86aa}
    .a .classif .i{color:#ffc247}
    .a .pavimento{display:block;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,0) 70%);border-top:1px solid rgba(255,255,255,.06)}`,
    colori: [["Fondo", "#0d1124"], ["Riquadri (vetro)", "#1a1f33"], ["Testo", "#f4f5fb"], ["Secondario", "#a9afcb"], ["Guida: lampone", "#e0225a"], ["Festa", "#ff9a4a"], ["Quiz & parole", "#b39bff"], ["1 contro 1", "#4fd8ff"], ["Carte", "#3ee0a8"], ["Minigiochi", "#ffd24a"]],
  },

  // ===== B · Colori pieni su chiaro =====
  b: {
    nome: "B · Colori pieni su chiaro", corto: "B · Colori pieni",
    idea: "Fondo grigio chiaro freddo (niente avorio), un solo colore guida (blu) per i tasti principali; ogni categoria ha un colore pieno e profondo, come Apple Arcade.",
    cat: { carte: "#0a774f", sfida: "#0e7490", festa: "#b81c70", mini: "#b5430b", parole: "#6236d9" },
    icone: ["#e8245c", "#1f5eff", "#d96c00", "#0a774f"],
    pers: ["#1f5eff", "#b81c70", "#0e7490", "#b5430b", "#6236d9"],
    css: `.b{--testo:#0e1120;--tenue:#5a6074;--surf:#fff;--surf2:#eceef3;--bordo:#e1e4eb;--acc-t:#fff;--tit:"Inter Display","Inter",system-ui,sans-serif;--r:22px;--rb:16px}
    .b.sch{background:radial-gradient(90% 30% at 50% -6%,#ffffff,transparent 70%),#f1f2f6}
    .b .logo{font-family:var(--tit);font-weight:800;font-size:35px;letter-spacing:-.022em}
    .b .logo-sotto{color:var(--tenue);font-size:10.5px;letter-spacing:.34em;text-transform:uppercase;font-weight:600;margin-top:4px}
    .b .chip,.b .icone a,.b .btn-s,.b .tab,.b .classif,.b .cod{background:#fff;border:1px solid var(--bordo);box-shadow:0 1px 2px rgba(16,20,40,.05),0 6px 16px rgba(16,20,40,.05)}
    .b .chip .faccia{box-shadow:0 0 0 2px #fff,0 0 0 3.5px #1f5eff}
    .b .lv{color:var(--tenue)}.b .liv .barra i{background:#1f5eff}
    .b .monete{color:#0e1120}.b .monete .i{color:#d96c00}
    .b .icone a .ico{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;color:#fff;background:linear-gradient(160deg,color-mix(in srgb,var(--ic) 80%,#fff),var(--ic) 70%);box-shadow:inset 0 -1px 0 rgba(0,0,0,.12)}
    .b .icone a .lab{color:#2b3045}.b .icone a .pal{--anello:#fff}
    .b .btn{font-weight:700}
    .b .btn-p{background:#1f5eff;color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 10px 22px -8px rgba(31,94,255,.65)}
    .b .btn-t{background:#e6edff;color:#1747d1}
    .b .tab{color:#2b3045}.b .tab .d{display:block}.b .tab.on{background:#0e1120;color:#fff;border-color:#0e1120}
    /* tessere: foto a tutta larghezza in alto, sotto il colore della categoria (più chiaro in alto a sinistra) */
    .b .tess{border-radius:var(--r);background:linear-gradient(165deg,color-mix(in srgb,var(--c) 92%,#fff),var(--c) 40%,color-mix(in srgb,var(--c) 86%,#000));box-shadow:0 14px 26px -16px var(--c),0 2px 4px rgba(16,20,40,.08)}
    .b .tess .t{color:#fff}.b .tess h2{font-family:var(--tit);font-weight:800;font-size:16px;letter-spacing:-.015em}
    .b .tess p{color:rgba(255,255,255,.92)}.b .tess .meta{color:#fff}
    .b .badge{display:flex;background:#fff;color:var(--c);font-weight:700}.b .badge i{background:var(--c)}
    .b .bar h1{font-family:var(--tit);font-weight:800;font-size:25px;letter-spacing:-.025em}
    .b .cod b{font-family:var(--tit);font-weight:900;letter-spacing:.12em}
    .b .stanza{background:radial-gradient(70% 40% at 50% 0%,#ffffff,transparent 75%),linear-gradient(180deg,#fbfbfd,#f3f4f8);border:1px solid var(--bordo);box-shadow:0 1px 2px rgba(16,20,40,.05),0 10px 26px rgba(16,20,40,.07)}
    .b .arco{stroke:rgba(14,17,32,.09)} .b .ins{font-family:var(--tit);color:#0e1120;letter-spacing:.28em;font-weight:800}
    .b .pedana{background:radial-gradient(closest-side,color-mix(in srgb,var(--pc) 30%,transparent),transparent)}
    .b .nomina{background:#fff;color:#0e1120;box-shadow:0 0 0 1.5px color-mix(in srgb,var(--pc) 55%,#fff),0 2px 8px rgba(16,20,40,.12)}.b .nomina em{color:#1747d1}
    .b .classif .i{color:#d96c00}
    .b .pavimento{display:block;background:linear-gradient(180deg,rgba(14,17,32,.035),rgba(14,17,32,0) 80%);border-top:1px solid rgba(14,17,32,.05)}`,
    colori: [["Fondo", "#f1f2f6"], ["Riquadri", "#ffffff"], ["Testo", "#0e1120"], ["Secondario", "#5a6074"], ["Guida: blu", "#1f5eff"], ["Festa", "#b81c70"], ["Quiz & parole", "#6236d9"], ["1 contro 1", "#0e7490"], ["Carte", "#0a774f"], ["Minigiochi", "#b5430b"]],
  },

  // ===== C · Gradienti caldi =====
  c: {
    nome: "C · Gradienti caldi", corto: "C · Gradienti caldi",
    idea: "Un cielo di sera dal viola alla prugna con un riflesso arancio, vetro caldo, tasto guida arancio-corallo e un colore caldo per ogni categoria; l'oro solo sulle monete.",
    cat: { carte: "#a8e46f", sfida: "#6ee7d8", festa: "#ffa07e", mini: "#ffd166", parole: "#f2a5ff" },
    icone: ["#ffa07e", "#6ee7d8", "#ffd166", "#f2a5ff"],
    pers: ["#ff8a5c", "#6ee7d8", "#ffd166", "#a8e46f", "#f2a5ff"],
    css: `.c{--testo:#fff6f1;--tenue:#f0dbe6;--surf:rgba(255,255,255,.08);--surf2:rgba(255,255,255,.14);--bordo:rgba(255,226,210,.18);--acc-t:#2a0a18;--tit:"Jakarta","Inter",system-ui,sans-serif;--r:22px;--rb:16px}
    .c.sch{background:radial-gradient(75% 30% at 100% -2%,rgba(255,128,64,.40),transparent 72%),radial-gradient(60% 26% at 0% 40%,rgba(255,70,140,.14),transparent 72%),radial-gradient(90% 26% at 50% 106%,rgba(255,120,90,.16),transparent 75%),linear-gradient(178deg,#22103f 0%,#351355 30%,#461760 62%,#4e1a62 100%)}
    .c .logo{font-family:var(--tit);font-weight:800;font-size:35px;letter-spacing:-.025em}
    .c .logo b{font-weight:800;background:linear-gradient(90deg,#ffc07a,#ff7a8a);-webkit-background-clip:text;color:transparent}
    .c .logo-sotto{color:#ffd9c4;font-size:10.5px;letter-spacing:.34em;text-transform:uppercase;font-weight:600;margin-top:3px}
    .c .chip,.c .icone a,.c .btn-s,.c .btn-t,.c .tab,.c .classif,.c .cod{background:var(--surf);border:1px solid var(--bordo);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 8px 22px -10px rgba(20,0,20,.5)}
    .c .chip .faccia{box-shadow:0 0 0 2px rgba(255,255,255,.85)}
    .c .lv{color:var(--tenue)}.c .liv .barra{background:rgba(255,255,255,.16)}.c .liv .barra i{background:linear-gradient(90deg,#ffb15c,#ff6a7a)}
    .c .monete{color:#f5d48a}
    .c .icone a .ico{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;color:#2a0a30;background:radial-gradient(circle at 32% 28%,color-mix(in srgb,var(--ic) 65%,#fff),var(--ic) 64%);box-shadow:0 0 0 1px rgba(255,255,255,.14),0 6px 16px -4px color-mix(in srgb,var(--ic) 55%,transparent)}
    .c .icone a .lab{color:#ffeef3}.c .icone a .pal{background:#fff;--anello:#351355}
    .c .btn{font-weight:700}
    .c .btn-p{background:linear-gradient(135deg,#ffad55,#ff5e72);color:#2a0a18;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 12px 26px -8px rgba(255,94,114,.7)}
    .c .btn-t{border:1.5px solid rgba(255,150,110,.8);background:rgba(255,140,100,.12)}.c .btn-t .i{color:#ffad7a}
    .c .tab{color:#ffeef3}.c .tab .d{display:block}.c .tab.on{background:#fff6f1;color:#3d1458;border-color:#fff6f1}
    .c .tess{border-radius:var(--r);background:rgba(26,6,36,.40);border:1px solid var(--bordo);padding:5px;box-shadow:0 14px 30px -14px rgba(20,0,20,.7)}
    .c .tess .foto{border-radius:17px}
    .c .tess .t{padding:9px 8px 7px}.c .tess h2{font-family:var(--tit);font-weight:700;font-size:16px;letter-spacing:-.01em}
    .c .tess p{color:var(--tenue)}.c .tess .meta{color:var(--c)}
    .c .badge{display:flex;top:12px;left:12px;background:rgba(36,10,44,.72);color:#fff;border:1px solid rgba(255,226,210,.22)}.c .badge i{background:var(--c)}
    .c .bar h1{font-family:var(--tit);font-weight:800;font-size:24px;letter-spacing:-.02em}
    .c .cod small{color:var(--tenue)}.c .cod b{font-family:var(--tit);font-weight:800}
    .c .stanza{background:radial-gradient(60% 46% at 50% 0%,rgba(255,170,100,.30),transparent 72%),radial-gradient(70% 30% at 50% 100%,rgba(255,110,140,.16),transparent 72%),linear-gradient(180deg,rgba(255,255,255,.09),rgba(30,6,40,.30));border:1px solid var(--bordo)}
    .c .arco{stroke:rgba(255,226,210,.22)} .c .ins{font-family:var(--tit);color:#fff;letter-spacing:.3em;font-weight:800}
    .c .sotto-ins{color:#fff1f4}
    .c .pedana{background:radial-gradient(closest-side,color-mix(in srgb,var(--pc) 55%,transparent),transparent)}
    .c .nomina{background:rgba(36,10,44,.86);color:#fff;border:1.5px solid var(--pc)}.c .nomina em{color:#ffb38a}
    .c .classif .i{color:#ffd166}
    .c .pavimento{display:block;background:linear-gradient(180deg,rgba(30,6,40,.22),rgba(30,6,40,.05));border-top:1px solid rgba(255,226,210,.08)}`,
    colori: [["Cielo in alto", "#22103f"], ["Prugna", "#461760"], ["Prugna in basso", "#4e1a62"], ["Testo", "#fff6f1"], ["Secondario", "#f0dbe6"], ["Guida: arancio", "#ffad55"], ["Guida: corallo", "#ff5e72"], ["Festa", "#ffa07e"], ["Quiz & parole", "#f2a5ff"], ["1 contro 1", "#6ee7d8"], ["Carte", "#a8e46f"], ["Monete (oro)", "#f5d48a"]],
  },
};

// ---- impaginazione comune ----
const base = `
@font-face{font-family:"Jakarta";src:url(font/jakarta.woff2) format("woff2");font-weight:200 800}
*{box-sizing:border-box}html,body{margin:0}
body{width:390px;height:844px;overflow:hidden;font-family:"Inter",-apple-system,system-ui,sans-serif;color:var(--testo);-webkit-font-smoothing:antialiased;background:#000}
.sch{height:844px;padding:48px 18px 20px;display:flex;flex-direction:column;gap:12px;position:relative;color:var(--testo)}
.stato{position:absolute;top:15px;left:30px;right:28px;display:flex;justify-content:space-between;font-size:14px;font-weight:600}
.i{flex:0 0 auto;display:block}
.top{text-align:center}.logo{line-height:1.05}
.btn{display:flex;align-items:center;justify-content:center;gap:9px;min-height:52px;border-radius:var(--rb);font-weight:600;font-size:16px;width:100%;color:var(--testo);border:0}
.btn-p{color:var(--acc-t)}
.riga{display:flex;gap:10px}.riga>*{flex:1}
.chip{display:flex;align-items:center;gap:12px;padding:8px 16px 8px 8px;border-radius:999px;font-size:14px}
.chip .faccia{width:44px;height:44px;border-radius:50%;overflow:hidden;background:var(--surf2);flex:0 0 auto}
.chip .faccia svg{width:100%;height:100%;display:block}
.chip .chi{flex:1}.chip .chi b{font-weight:700;font-size:15.5px}
.liv{display:flex;align-items:center;gap:8px;font-size:11.5px;margin-top:3px}
.liv .barra{width:78px;height:5px;border-radius:9px;background:var(--surf2);overflow:hidden}.liv .barra i{display:block;width:38%;height:100%}
.monete{display:flex;align-items:center;gap:5px;font-size:14px;font-weight:700}
.icone{display:flex;gap:8px}.icone a{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;padding:9px 0 8px;border-radius:var(--rb);font-size:11px;font-weight:600;position:relative}
.icone a .pal{position:absolute;top:7px;right:calc(50% - 22px);width:9px;height:9px;border-radius:50%;background:#ff3b5c;box-shadow:0 0 0 2px var(--anello,transparent)}
.tabs{display:flex;gap:7px;overflow:hidden;margin-right:-18px}.tab{display:flex;align-items:center;gap:7px;padding:8px 14px;border-radius:999px;font-size:13.5px;font-weight:600;white-space:nowrap}
.tab .d{display:none;width:7px;height:7px;border-radius:50%;background:var(--c)}.tab.on .d{display:none!important}
.griglia{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:12px;flex:1;min-height:0}
/* tessera: la foto ha sempre la stessa forma (quella vera, 800×544); il testo sta sotto e prende quello che resta */
.tess{position:relative;display:flex;flex-direction:column;overflow:hidden;min-height:0}
.tess .alone{display:none}
.tess .foto{flex:0 0 auto;aspect-ratio:800/544;background-image:var(--img);background-size:var(--z) auto;background-position:var(--fx) var(--fy);background-repeat:no-repeat}
.tess .t{flex:1;padding:10px 12px 12px;display:flex;flex-direction:column;gap:3px;position:relative}
.tess h2{margin:0;font-size:15px;font-weight:700;line-height:1.12}
.tess p{margin:0;font-size:12px;color:var(--tenue);line-height:1.3}
.tess .meta{font-size:11.5px;font-weight:700;margin-top:auto;display:flex;align-items:center;gap:5px}
.badge{display:none;position:absolute;top:9px;left:9px;z-index:3;align-items:center;gap:6px;font-size:10.5px;font-weight:600;padding:4px 9px 4px 7px;border-radius:99px}
.badge i{width:7px;height:7px;border-radius:50%;display:block}
.bar{display:flex;align-items:center;gap:12px}.bar h1{margin:0;line-height:1}.bar small{display:block;color:var(--tenue);font-size:12.5px;margin-top:4px}
.sala-top{display:flex;gap:10px;align-items:stretch}
.cod{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 18px;border-radius:var(--rb)}
.cod small{font-size:9.5px;letter-spacing:.24em;color:var(--tenue);font-weight:700}.cod b{font-size:25px;letter-spacing:.16em;margin-right:-.16em;line-height:1.1}
.stanza{flex:1;min-height:0;border-radius:var(--r);position:relative;overflow:hidden}
.arco{position:absolute;inset:0;width:100%;height:100%;fill:none;stroke-width:1.2}
.ins{position:absolute;top:22px;left:0;right:0;text-align:center;font-size:12.5px;font-weight:700;text-transform:uppercase}
.sotto-ins{position:absolute;top:46px;left:0;right:0;text-align:center;font-size:12px;color:var(--tenue);display:flex;justify-content:center;align-items:center;gap:6px}
.sotto-ins i{width:7px;height:7px;border-radius:50%;background:#34c759;display:block}
/* gli amici: fila dietro alta (subito sotto «5 amici»), fila davanti in basso, con aria tra le due */
.pavimento{position:absolute;left:0;right:0;top:246px;bottom:0;display:none}
.pers{position:absolute;width:96px;display:flex;flex-direction:column;align-items:center;transform:translateX(-50%)}
.pers.dietro{top:82px}.pers.davanti{bottom:14px}
.pers .fig{width:112px;position:relative;z-index:1}.pers .fig svg{width:100%;height:auto;display:block;overflow:visible}
.pers.davanti .fig{width:136px}   /* chi sta davanti è più vicino: un poco più grande */
.pers .pedana{position:absolute;bottom:18px;width:118px;height:28px;border-radius:50%}.pers.davanti .pedana{width:142px;height:32px}
.nomina{z-index:2;margin-top:-6px;font-size:12px;font-weight:600;padding:3px 10px;border-radius:99px;display:flex;align-items:center;gap:5px;white-space:nowrap}
.nomina .ok{width:15px;height:15px;border-radius:50%;background:#22a447;color:#fff;display:flex;align-items:center;justify-content:center}
.nomina em{font-style:normal;font-size:9.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.classif{display:flex;align-items:center;gap:10px;padding:13px 16px;border-radius:var(--rb);font-size:14px;font-weight:600}
.classif .chev{margin-left:auto;opacity:.6}
.nota{text-align:center;font-size:12.5px;color:var(--tenue);margin:0}
`;

const faccia = n => `<div class="faccia" data-om="${n}" data-viso="1"></div>`;
function home(k) {
  const t = T[k], em = !!t.emoji;
  const voci = [["spark", "🆕", "Novità"], ["city", "🏙️", "La città"], ["cup", "🏆", "Trofei"], ["chart", "👥", "Classifica"]];
  const sotto = `<div class="logo-sotto">${k === "prima" ? "⚡ ⚡ ⚡" : "Party game"}</div>`;
  return `<div class="sch ${k}">
 <div class="stato"><span>9:41</span><span>●●● 100%</span></div>
 <div class="top">${k === "prima" ? sotto : ""}<div class="logo">SPeeD <b>GAME</b></div>${k === "prima" ? "" : sotto}</div>
 <div class="chip">${faccia("Paky")}<div class="chi"><b>Paky</b><div class="liv"><span class="lv">${em ? "Lv 3" : "Livello 3"}</span><span class="barra"><i></i></span></div></div><div class="monete">${em ? "🪙" : ic("coin", 17)}${mille(1250)}</div></div>
 <div class="icone">${voci.map((v, i) => `<a style="--ic:${t.icone[i] || "currentColor"}"><span class="ico">${em ? `<span style="font-size:20px">${v[1]}</span>` : ic(v[0], 18, k === "a" || k === "c" ? 2.1 : 1.8)}</span><span class="lab">${v[2]}</span>${i === 0 ? '<b class="pal"></b>' : ""}</a>`).join("")}</div>
 <div class="riga"><div class="btn btn-p">${em ? "<span>🔗</span>" : ic("link", 18)}Gioca online</div><div class="btn btn-s">${em ? "<span>🔑</span>" : ic("key", 18)}Ho un codice</div></div>
 <div class="tabs">${CATEGORIE.map((c, i) => `<div class="tab${i === 0 ? " on" : ""}" style="--c:${t.cat[c[0]] || "transparent"}">${em ? "<span>" + c[2] + "</span>" : '<i class="d"></i>'}${c[1]}</div>`).join("")}</div>
 <div class="griglia">${GIOCHI.map(g => `<div class="tess" style="--c:${t.cat[g[4]] || "transparent"};--img:url(${RADICE}carte/giochi/${g[0]}.jpg);--z:${g[5]};--fx:${g[6]};--fy:${g[7]}"><div class="alone"></div><div class="foto"></div><span class="badge"><i></i>${NOMECAT[g[4]]}</span><div class="t"><h2>${g[1]}</h2><p>${g[2]}</p><div class="meta">${em ? "👥 " : ic("users", 13, 2)}${g[3]} giocatori</div></div></div>`).join("")}</div>
</div>`;
}
function sala(k) {
  const t = T[k], em = !!t.emoji;
  return `<div class="sch ${k}">
 <div class="stato"><span>9:41</span><span>●●● 100%</span></div>
 <div class="bar"><span>${ic("back", 22, 2)}</span><div><h1>Sala online</h1><small>Un link per tutti i giochi</small></div></div>
 <div class="sala-top"><div class="cod"><small>SALA</small><b>KFRT</b></div><div class="btn btn-t">${em ? "<span>📤</span>" : ic("send", 18)}Invita gli amici</div></div>
 <div class="stanza">
  <svg class="arco" viewBox="0 0 354 420" preserveAspectRatio="none"><path d="M40 420V182a137 120 0 0 1 274 0v238"/><path d="M52 420V184a125 110 0 0 1 250 0v236" opacity=".5"/></svg>
  <div class="pavimento"></div><div class="ins">SALA D'ATTESA</div><div class="sotto-ins"><i></i>5 amici · 3 pronti</div>
  ${AMICI.map((n, i) => `<div class="pers ${POSTI[i][1]}" style="left:${POSTI[i][0]}%;--pc:${t.pers[i]}"><div class="pedana"></div><div class="fig" data-om="${n}"></div><div class="nomina">${i < 3 ? `<span class="ok">${ic("check", 10, 3.2)}</span>` : ""}<span class="nm">${n}</span>${i === 0 ? ` <em>${em ? "👑 host" : "host"}</em>` : ""}</div></div>`).join("")}
 </div>
 <div class="classif">${em ? "<span>🏆</span>" : ic("cup", 18)}Classifica della serata<span class="chev">${ic("chev", 18, 2)}</span></div>
 <div class="riga"><div class="btn btn-s" style="flex:0 0 58px">${em ? "⚙️" : ic("gear", 20)}</div><div class="btn btn-p">${em ? "<span>▶</span>" : ic("play", 15)}Scegli il primo gioco</div></div>
 <p class="nota">Il gioco parte da solo sul telefono di tutti.</p>
</div>`;
}
const testa = k => `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=390"><title>${T[k].nome}</title>
${k === "oggi" ? '<link rel="stylesheet" href="font/sg-titoli.css">' : ""}<style>${base}${T[k].css}</style></head><body>`;
const piede = `<script src="${RADICE}js/omino.js"></script><script>
document.querySelectorAll("[data-om]").forEach(function (el) {
  el.innerHTML = SGOmino.svg(SGOmino.casuale(el.dataset.om), el.dataset.viso ? { viso: true } : {});
});</script></body></html>`;
module.exports = { T, ORDINE: ["prima", "oggi", "a", "b", "c"] };
if (require.main === module) {
  for (const k in T) {
    fs.writeFileSync(path.join(dir, `${k}-home.html`), testa(k) + home(k) + piede);
    fs.writeFileSync(path.join(dir, `${k}-sala.html`), testa(k) + sala(k) + piede);
  }
  console.log("pagine dei disegni scritte");
}

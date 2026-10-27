// Disegni delle 4 direzioni di stile (solo per scegliere: NON toccano l'app).
// Uso: node docs/stile/genera.js (scrive gli .html), poi con un server sulla cartella del progetto alla porta 8123: node docs/stile/foto.js (fa le foto).
const fs = require("fs"), path = require("path");
const dir = __dirname;

// ---- simboli puliti a linea (al posto delle emoji) ----
const I = {
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l3 3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
  cup: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4c0 3 1 4 4 4M16 6h4c0 3-1 4-4 4M12 13v4M8 20h8"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 5a3 3 0 0 1 0 6M18 14c2 .6 3 2.6 3 6"/>',
  send: '<path d="M12 15V4M8 8l4-4 4 4M5 14v5h14v-5"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  city: '<path d="M3 21h18M5 21V9l5-3v15M10 21V4l6 3v14M16 21v-9l3 1.5V21"/>',
  chart: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>',
  note: '<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>',
};
const ic = (n, s = 20, w = 1.6) => `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;
const mille = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");   // 1.250 (sempre col punto)

const GIOCHI = [
  ["timeline", "La linea del tempo", "Metti gli avvenimenti nell'ordine giusto.", "1–10"],
  ["asta", "L'Asta", "Compra all'asta i pezzi migliori.", "2–10"],
  ["ordine", "Parola d'ordine", "Due squadre, un solo indizio.", "4–12"],
  ["prezzo", "Il Prezzo è Giusto", "Indovina quanto costa davvero.", "1–10"],
];
const AMICI = ["Paky", "Giulia", "Luca", "Marta", "Sara"];
// i colori vivi che i giochi usano oggi (squadre di Parola d'ordine e colori dei giocatori)
const SQUADRE = [["Rossi", "#e03131"], ["Blu", "#1c7ed6"], ["Verdi", "#2f9e44"]];
const GIOCATORI = ["#e8590c", "#7048e8", "#0ca678", "#d6336c", "#1971c2", "#f59f00"];

// ---- le 4 direzioni ----
const D = {
  notte: {
    nome: "1 · Notte di lusso",
    font: "Cormorant+Garamond:wght@500;600;700",
    css: `:root{--bg:#0b0d13;--surf:#151924;--surf2:#1c2130;--bordo:rgba(212,176,106,.24);--testo:#f3eee1;--tenue:#a39f92;
      --acc:#d4b06a;--acc-t:#17120a;--ombra:0 14px 34px rgba(0,0,0,.5);--r:20px;--rb:14px;--tit:"Cormorant Garamond",Georgia,serif}
    body{background:radial-gradient(110% 55% at 50% -12%,#232a3f 0%,var(--bg) 62%)}
    .logo{font-family:var(--tit);font-weight:600;font-size:36px;letter-spacing:.16em;text-transform:uppercase}.logo b{color:var(--acc);font-weight:600}
    .btn-p{background:linear-gradient(180deg,#e2c582,#c09547);color:var(--acc-t)}
    .btn-s{background:rgba(255,255,255,.03);border:1px solid var(--bordo)}
    .chip,.icone a{background:var(--surf);border:1px solid rgba(255,255,255,.07)} .icone a{color:var(--acc)}
    .tab{border:1px solid rgba(255,255,255,.1);color:var(--tenue)} .tab.on{border-color:var(--acc);color:var(--acc)}
    .tess{position:relative;border-radius:var(--r);overflow:hidden;box-shadow:var(--ombra);background:#000}
    .tess .foto{position:absolute;inset:0;filter:saturate(.75) brightness(.85)}
    .tess .t{position:absolute;left:0;right:0;bottom:0;padding:44px 13px 13px;background:linear-gradient(180deg,transparent,rgba(8,9,14,.92) 55%)}
    .tess h2{font-family:var(--tit);font-size:21px;font-weight:600;letter-spacing:.01em}.tess .meta{color:var(--acc)}
    .stanza{background:radial-gradient(60% 50% at 50% 30%,rgba(212,176,106,.16),transparent 70%),linear-gradient(180deg,#171b27,#0e1018);border:1px solid var(--bordo)}
    .arco{stroke:rgba(212,176,106,.45)} .ins{font-family:var(--tit);color:var(--acc);letter-spacing:.32em} .pedana{background:radial-gradient(closest-side,rgba(212,176,106,.32),transparent)}
    .cod{background:var(--surf);border:1px solid var(--bordo)} .cod b{font-family:var(--tit);font-weight:600}
    .nomina{background:rgba(10,12,18,.75);border:1px solid var(--bordo)}`,
  },
  editoriale: {
    nome: "2 · Chiaro editoriale",
    font: "Playfair+Display:ital,wght@0,600;0,700;1,600",
    css: `:root{--bg:#fbfaf6;--surf:#fff;--surf2:#f2f0e9;--bordo:#e3e0d6;--testo:#141414;--tenue:#6b6a64;
      --acc:#c2410c;--acc-t:#fff;--ombra:none;--r:2px;--rb:3px;--tit:"Playfair Display",Georgia,serif}
    body{background:var(--bg)}
    .top{text-align:left;border-bottom:2px solid var(--testo);padding-bottom:8px}
    .logo{font-family:var(--tit);font-weight:700;font-size:40px;letter-spacing:-.015em;font-style:italic}.logo b{color:var(--acc)}
    .data{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--tenue);margin-top:4px}
    .btn-p{background:var(--testo);color:#fff}
    .btn-s{background:transparent;border:1px solid var(--testo)}
    .chip{background:transparent;border-radius:0;border-bottom:1px solid var(--bordo);padding-left:0} .icone a{border:1px solid var(--bordo);border-radius:2px;color:var(--testo)}
    .tab{border-radius:0;padding:8px 2px;margin-right:8px;color:var(--tenue);border-bottom:2px solid transparent} .tab.on{color:var(--testo);border-bottom-color:var(--acc)}
    .griglia{grid-template-columns:1fr;gap:0}
    .tess{display:flex;gap:14px;align-items:center;padding:12px 0;border-top:1px solid var(--bordo)}
    .tess .foto{width:92px;height:92px;flex:0 0 auto;border-radius:2px}
    .tess .t{flex:1}.tess h2{font-family:var(--tit);font-size:21px;font-weight:700}.tess .meta{color:var(--acc)}
    .stanza{background:var(--surf2);border-radius:2px}
    .arco{stroke:#cfcabb} .ins{font-family:var(--tit);font-style:italic;letter-spacing:.02em;text-transform:none;font-size:20px;color:var(--testo)} .pedana{background:radial-gradient(closest-side,rgba(0,0,0,.13),transparent)}
    .cod{background:transparent;border:1px solid var(--testo)} .cod b{font-family:var(--tit)}
    .nomina{background:#fff;border:1px solid var(--bordo)}`,
  },
  vetro: {
    nome: "3 · Vetro e metallo",
    font: "Inter:wght@400;500;600;700",
    css: `:root{--bg:#0a0d12;--surf:rgba(255,255,255,.07);--surf2:rgba(255,255,255,.11);--bordo:rgba(255,255,255,.15);--testo:#eef2f6;--tenue:#94a0ad;
      --acc:#8fd3ff;--acc-t:#0b1117;--ombra:0 10px 34px rgba(0,0,0,.45);--r:24px;--rb:18px;--tit:"Inter",-apple-system,system-ui,sans-serif}
    body{background:radial-gradient(55% 35% at 10% 2%,rgba(143,211,255,.22),transparent 70%),radial-gradient(60% 40% at 95% 45%,rgba(170,180,200,.16),transparent 70%),linear-gradient(180deg,#121921,#090c10)}
    .logo{font-weight:700;font-size:34px;letter-spacing:-.03em;background:linear-gradient(180deg,#fff 30%,#8e9aa7);-webkit-background-clip:text;color:transparent}
    .btn-p{background:linear-gradient(180deg,#f4f7fa,#b9c4cf);color:var(--acc-t);box-shadow:inset 0 1px 0 #fff,0 8px 22px rgba(0,0,0,.35)}
    .btn-s,.chip,.icone a,.tab{background:var(--surf);border:1px solid var(--bordo);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
    .icone a{color:var(--testo)} .tab{color:var(--tenue)} .tab.on{background:#e9eef3;color:#0b1117}
    .tess{display:flex;flex-direction:column;border-radius:var(--r);padding:7px;background:linear-gradient(180deg,rgba(255,255,255,.11),rgba(255,255,255,.04));border:1px solid var(--bordo);backdrop-filter:blur(16px)}
    .tess .foto{border-radius:17px;flex:1;min-height:0}.tess .meta{color:var(--acc)}
    .stanza{background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.02));border:1px solid var(--bordo)}
    .arco{stroke:rgba(255,255,255,.2)} .ins{color:var(--tenue);letter-spacing:.34em;font-weight:600} .pedana{background:radial-gradient(closest-side,rgba(143,211,255,.3),transparent)}
    .cod{background:var(--surf);border:1px solid var(--bordo)}
    .nomina{background:rgba(255,255,255,.12);border:1px solid var(--bordo);backdrop-filter:blur(10px)}`,
  },
  oro: {
    nome: "4 · Bianco e oro",
    font: "Cormorant+Garamond:wght@500;600;700",
    css: `:root{--bg:#faf6ee;--surf:#fffdf9;--surf2:#f3ebda;--bordo:#d9c48f;--bordo2:#ebdfc2;--testo:#211b11;--tenue:#6c624f;
      --acc:#b48a3a;--acc-forte:#8a6a22;--acc-t:#251b06;--ombra:0 8px 24px rgba(110,80,20,.10);--r:20px;--rb:16px;--tit:"Cormorant Garamond",Georgia,serif}
    body{background:radial-gradient(90% 38% at 50% -6%,#fff 0%,var(--bg) 72%)}
    .logo{font-family:var(--tit);font-weight:700;font-size:40px;letter-spacing:.05em}.logo b{color:var(--acc);font-weight:700}
    .logo-sotto{display:flex;align-items:center;gap:10px;justify-content:center;color:var(--acc-forte);font-size:10.5px;letter-spacing:.34em;text-transform:uppercase;margin-top:2px}
    .logo-sotto:before,.logo-sotto:after{content:"";height:1px;width:40px;background:linear-gradient(90deg,transparent,var(--acc))}.logo-sotto:after{transform:scaleX(-1)}
    .btn-p{background:linear-gradient(180deg,#dcbd74,#bf9748);color:var(--acc-t);box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 8px 18px rgba(150,110,30,.26)}
    .btn-s{background:var(--surf);border:1px solid var(--bordo);box-shadow:var(--ombra)}
    .chip{background:var(--surf);border:1px solid var(--bordo2);box-shadow:var(--ombra)} .icone a{background:var(--surf);border:1px solid var(--bordo2);color:var(--acc-forte)}
    .tab{border:1px solid var(--bordo2);color:var(--tenue);background:var(--surf)} .tab.on{background:var(--testo);color:#f3e2b3;border-color:var(--testo)}
    .tess{border-radius:var(--r);overflow:hidden;background:var(--surf);border:1px solid var(--bordo2);box-shadow:var(--ombra);display:flex;flex-direction:column}
    .tess .foto{flex:1;min-height:0;box-shadow:inset 0 -1px 0 var(--bordo2)}
    .tess h2{font-family:var(--tit);font-size:20.5px;font-weight:700}.tess .meta{color:var(--acc-forte)}
    .stanza{background:radial-gradient(60% 46% at 50% 28%,#fff,transparent 75%),linear-gradient(180deg,#fffcf5,#f1e7d2);border:1px solid var(--bordo);box-shadow:var(--ombra)}
    .arco{stroke:rgba(180,138,58,.55)} .ins{font-family:var(--tit);color:var(--acc-forte);letter-spacing:.32em;font-weight:700} .pedana{background:radial-gradient(closest-side,rgba(180,138,58,.30),transparent)}
    .cod{background:var(--surf);border:1px solid var(--bordo)} .cod b{font-family:var(--tit);font-weight:700}
    .nomina{background:var(--surf);border:1px solid var(--bordo2)}`,
  },
};

const base = `
*{box-sizing:border-box}html,body{margin:0}
body{width:390px;height:844px;overflow:hidden;font-family:-apple-system,"SF Pro Text","Inter",system-ui,sans-serif;color:var(--testo);-webkit-font-smoothing:antialiased}
.sch{height:844px;padding:50px 18px 20px;display:flex;flex-direction:column;gap:13px;position:relative}
.stato{position:absolute;top:14px;left:28px;right:28px;display:flex;justify-content:space-between;font-size:14px;font-weight:600}
.i{flex:0 0 auto;display:block}
.top{text-align:center}.logo{line-height:1.05}
.btn{display:flex;align-items:center;justify-content:center;gap:9px;min-height:54px;border-radius:var(--rb);font-weight:600;font-size:16px;width:100%;color:var(--testo);border:0}
.btn-p{color:var(--acc-t)}
.riga{display:flex;gap:10px}.riga>*{flex:1}
.chip{display:flex;align-items:center;gap:12px;padding:8px 14px 8px 8px;border-radius:999px;font-size:14px}
.chip .faccia{width:44px;height:44px;border-radius:50%;overflow:hidden;background:var(--surf2);flex:0 0 auto;box-shadow:0 0 0 1px var(--bordo)}
.chip .faccia svg{width:100%;height:100%;display:block}
.chip .chi{flex:1}.chip .chi b{font-weight:600;font-size:15px}
.liv{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--tenue);margin-top:3px}
.liv .barra{width:74px;height:4px;border-radius:9px;background:var(--surf2);overflow:hidden}.liv .barra i{display:block;width:35%;height:100%;background:var(--acc)}
.monete{display:flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--acc)}
.icone{display:flex;gap:8px}.icone a{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:9px 0 8px;border-radius:var(--rb);font-size:11px;font-weight:500}
.icone a span{color:var(--tenue)}
.tabs{display:flex;gap:7px;overflow:hidden}.tab{padding:7px 14px;border-radius:999px;font-size:13.5px;font-weight:600;white-space:nowrap}
.griglia{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:12px;flex:1;min-height:0}
.tess .foto{background-size:cover;background-position:center}
.tess .t{padding:10px 12px 12px;display:flex;flex-direction:column;gap:3px}
.tess h2{margin:0;font-size:15px;font-weight:700;line-height:1.08}
.tess p{margin:0;font-size:12px;color:var(--tenue);line-height:1.3}
.tess .meta{font-size:11.5px;font-weight:600;margin-top:3px;display:flex;align-items:center;gap:5px}
.notte .tess p{color:#cfc9b8}
.bar{display:flex;align-items:center;gap:12px}.bar h1{margin:0;font-family:var(--tit);font-size:24px;font-weight:700;line-height:1}.bar small{display:block;color:var(--tenue);font-size:12.5px;margin-top:3px}
.sala-top{display:flex;gap:10px;align-items:stretch}
.cod{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 18px;border-radius:var(--rb)}
.cod small{font-size:9.5px;letter-spacing:.24em;color:var(--tenue);font-weight:600}.cod b{font-size:25px;letter-spacing:.16em;margin-right:-.16em;line-height:1.1}
.stanza{flex:1;min-height:0;border-radius:var(--r);position:relative;overflow:hidden}
.arco{position:absolute;inset:0;width:100%;height:100%;fill:none;stroke-width:1}
.ins{position:absolute;top:22px;left:0;right:0;text-align:center;font-size:12.5px;font-weight:700;text-transform:uppercase}
.conta{position:absolute;left:14px;top:14px;font-size:11.5px;color:var(--tenue);display:none}
.sotto-ins{position:absolute;top:46px;left:0;right:0;text-align:center;font-size:12px;color:var(--tenue);display:flex;justify-content:center;align-items:center;gap:6px}
.sotto-ins i{width:7px;height:7px;border-radius:50%;background:#34c759;display:block}
.gente{position:absolute;left:0;right:0;bottom:22px;height:76%}
.pers{position:absolute;width:96px;display:flex;flex-direction:column;align-items:center;transform:translateX(-50%)}
.pers .fig{width:104px;position:relative;z-index:1}.pers .fig svg{width:100%;height:auto;display:block;overflow:visible}
.pers .pedana{position:absolute;bottom:20px;width:110px;height:26px;border-radius:50%}
.nomina{z-index:2;margin-top:-6px;font-size:12px;font-weight:600;padding:3px 10px;border-radius:99px;display:flex;align-items:center;gap:5px;white-space:nowrap}
.nomina .ok{width:15px;height:15px;border-radius:50%;background:#2fb344;color:#fff;display:flex;align-items:center;justify-content:center}
.nomina em{font-style:normal;color:var(--acc);font-size:10px;letter-spacing:.12em;text-transform:uppercase}
.oro .nomina em{color:var(--acc-forte)}
.classif{display:flex;align-items:center;gap:10px;padding:13px 16px;border-radius:var(--rb);font-size:14px;font-weight:600}
.classif .chev{margin-left:auto;color:var(--tenue)}
.nota{text-align:center;font-size:12.5px;color:var(--tenue);margin:0}
`;

const faccia = n => `<div class="faccia" data-om="${n}" data-viso="1"></div>`;
const home = k => `<div class="sch ${k}">
 <div class="stato"><span>9:41</span><span>●●● 100%</span></div>
 <div class="top"><div class="logo">SPeeD <b>GAME</b></div>${k === "oro" ? '<div class="logo-sotto">Party game</div>' : k === "editoriale" ? '<div class="data">Party game · Serata di lunedì</div>' : ""}</div>
 <div class="chip">${faccia("Paky")}<div class="chi"><b>Paky</b><div class="liv">Livello 3<span class="barra"><i></i></span></div></div><div class="monete">${ic("coin", 17)}${mille(1250)}</div></div>
 <div class="icone"><a>${ic("spark", 19)}<span>Novità</span></a><a>${ic("city", 19)}<span>La città</span></a><a>${ic("cup", 19)}<span>Trofei</span></a><a>${ic("chart", 19)}<span>Classifica</span></a></div>
 <div class="riga"><div class="btn btn-p">${ic("link", 18)}Gioca online</div><div class="btn btn-s">${ic("key", 18)}Ho un codice</div></div>
 <div class="tabs"><div class="tab on">Tutti</div><div class="tab">Carte</div><div class="tab">1 contro 1</div><div class="tab">Festa</div><div class="tab">Quiz</div></div>
 <div class="griglia">${GIOCHI.map(g => `<div class="tess"><div class="foto" style="background-image:url(../../carte/giochi/${g[0]}.jpg)"></div><div class="t"><h2>${g[1]}</h2><p>${g[2]}</p><div class="meta">${ic("users", 13)}${g[3]} giocatori</div></div></div>`).join("")}</div>
</div>`;

const POSTI = [[50, 40], [22, 44], [78, 44], [34, 4], [66, 4]];   // [x%, bottom%] dei 5 amici nella sala
const sala = k => `<div class="sch ${k}">
 <div class="stato"><span>9:41</span><span>●●● 100%</span></div>
 <div class="bar"><span>${ic("back", 22)}</span><div><h1>Sala online</h1><small>Un link per tutti i giochi</small></div></div>
 <div class="sala-top"><div class="cod"><small>SALA</small><b>KFRT</b></div><div class="btn btn-p">${ic("send", 18)}Invita gli amici</div></div>
 <div class="stanza">
  <svg class="arco" viewBox="0 0 354 420" preserveAspectRatio="none"><path d="M40 420V150a137 120 0 0 1 274 0v270"/><path d="M52 420V152a125 110 0 0 1 250 0v268" opacity=".5"/></svg>
  <div class="ins">Sala d'attesa</div><div class="sotto-ins"><i></i>5 amici · 3 pronti</div>
  <div class="gente">${AMICI.map((n, i) => `<div class="pers" style="left:${POSTI[i][0]}%;bottom:${POSTI[i][1]}%"><div class="pedana"></div><div class="fig" data-om="${n}"></div><div class="nomina">${i < 3 ? `<span class="ok">${ic("check", 10, 3)}</span>` : ""}${n}${i === 0 ? " <em>host</em>" : ""}</div></div>`).join("")}</div>
 </div>
 <div class="classif chip">${ic("cup", 18)}Classifica della serata<span class="chev">${ic("chev", 18)}</span></div>
 <div class="riga"><div class="btn btn-s" style="flex:0 0 58px">${ic("gear", 20)}</div><div class="btn btn-p">${ic("play", 17)}Scegli il primo gioco</div></div>
 <p class="nota">Il gioco parte da solo sul telefono di tutti.</p>
</div>`;

// ---- prova dei colori vivi dentro ai giochi (con il contrasto misurato) ----
function lum(h) { const c = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
function contrasto(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
const FONDO = { notte: "#151924", editoriale: "#ffffff", vetro: "#1a2027", oro: "#fffdf9" };
const colori = k => `<div class="sch ${k}" style="height:auto;padding-top:22px">
 <div class="bar"><div><h1>Dentro ai giochi</h1><small>Squadre, giocatori e punti sul fondo di questo stile</small></div></div>
 <div class="riga">${SQUADRE.map(([n, c]) => `<div class="btn" style="background:${c};color:#fff;min-height:64px;flex-direction:column;gap:0">${n}<small style="font-size:10.5px;opacity:.9;font-weight:500">testo ${contrasto(c, "#ffffff").toFixed(1)}:1</small></div>`).join("")}</div>
 ${AMICI.slice(0, 4).map((n, i) => `<div class="chip" style="border-radius:var(--rb);padding:8px 14px 8px 8px"><div class="faccia" data-om="${n}" data-viso="1" style="box-shadow:0 0 0 2.5px ${GIOCATORI[i]}"></div><div class="chi"><b>${n}</b><div class="liv" style="color:${GIOCATORI[i]};font-weight:600">● il suo colore · ${contrasto(GIOCATORI[i], FONDO[k]).toFixed(1)}:1 sul fondo</div></div><b style="font-size:18px">${mille([2450, 1250, 980, 640][i])}</b></div>`).join("")}
 <div class="riga"><div class="btn btn-s">Esci</div><div class="btn btn-p">Rivincita</div></div>
</div>`;

const testa = k => `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=390"><title>${D[k].nome}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${D[k].font}&display=swap"><style>${base}${D[k].css}</style></head><body>`;
const piede = `<script src="../../js/omino.js"></script><script>
document.querySelectorAll("[data-om]").forEach(function (el) {
  el.innerHTML = SGOmino.svg(SGOmino.casuale(el.dataset.om), el.dataset.viso ? { viso: true } : {});
});</script></body></html>`;
for (const k in D) {
  fs.writeFileSync(path.join(dir, `${k}-home.html`), testa(k) + home(k) + piede);
  fs.writeFileSync(path.join(dir, `${k}-sala.html`), testa(k) + sala(k) + piede);
  fs.writeFileSync(path.join(dir, `${k}-colori.html`), testa(k).replace("height:844px;overflow:hidden", "height:auto") + colori(k) + piede);
}

// ---- pagina di confronto: tutte e 4 affiancate ----
const fila = (tipo, t) => `<h2>${t}</h2><div class="fila">${Object.keys(D).map(k => `<figure${k === "oro" ? ' class="pref"' : ""}><img src="${k}-${tipo}.png" alt=""><figcaption>${D[k].nome}</figcaption></figure>`).join("")}</div>`;
fs.writeFileSync(path.join(dir, "confronto.html"), `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Stile: confronto</title>
<style>body{margin:0;padding:28px 30px 40px;background:#e9e6df;font-family:-apple-system,system-ui,sans-serif;color:#222}h1{margin:0 0 4px;font-size:26px}p{margin:0;color:#555}
h2{margin:30px 0 12px;font-size:18px}.fila{display:flex;gap:24px}figure{margin:0;flex:0 0 auto}img{width:390px;border-radius:28px;box-shadow:0 12px 30px rgba(0,0,0,.22);display:block}
figcaption{text-align:center;margin-top:10px;font-weight:700}.pref figcaption:after{content:"  ★ la preferita";color:#a07a2c}</style></head><body>
<h1>SPeeD GAME · 4 direzioni di stile</h1><p>Disegni di prova (non è ancora l'app): telefono 390×844. Le foto dei giochi e gli avatar sono quelli veri.</p>
${fila("home", "Prima schermata")}${fila("sala", "Saletta d'attesa")}${fila("colori", "Colori delle squadre e degli avatar dentro ai giochi")}</body></html>`);
console.log("fatto");

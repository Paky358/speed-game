/* 🔎 LE PAGINE PER GOOGLE (26 nov 2026, chat «🔎 Farsi trovare su Google»)
   Costruisce le pagine statiche che Google legge (l'app si disegna con JavaScript e Google ne legge pochissimo):
     sito/giochi/<pagina>/index.html   una pagina per ogni gioco visibile (testo vero, copertina, «▶ Gioca ora»)
     sito/giochi/index.html            tutti i giochi, divisi per categoria
     sito/sitemap.xml, sito/robots.txt la mappa del sito per Google e Bing
     app/ingresso.html                 il testo della pagina d'ingresso (revelhouse.it): l'app lo copre appena parte
   e mette titolo e descrizione giusti in app/testa.html e index.html (le due teste restano uguali).
   costruisci-versione-online.sh copia sito/ in dist/ e mette app/ingresso.html in dist/index.html.

   Si rifà quando cambia un testo (testi-*.js, sito-testi.js), un gioco (nome, giocatori, modi) o la lista dei nascosti:
     "C:\Program Files\nodejs\node.exe" .agents/skills/pagine-google/fai-pagine.js
   I giochi nascosti (GIOCHI_NASCOSTI in js/core.js) e quelli di NO_PAGINA qui sotto non hanno la pagina.
   Un gioco nuovo: il suo testo in un testi-*.js (vedi LEGGIMI.md) e il suo posto in PAGINE; se manca, il programma si ferma. */
"use strict";
var fs = require("fs"), path = require("path");
var R = path.resolve(__dirname, "../../..");   // la cartella del progetto
function leggi(f) { return fs.readFileSync(path.join(R, f), "utf8"); }
function scrivi(f, s) { var p = path.join(R, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); }

var T = require("./sito-testi.js"), SITO = T.sito;
// i giochi SENZA pagina oltre ai nascosti: Lanterne è di Mario (non si tocca); Palla a Pendolo e Taboo stanno per essere nascosti
var NO_PAGINA = { lanterne: 1, pendolo: 1, taboo: 1 };
// 🕓 le pagine IN ATTESA (il Cervello, 27 nov 2026): portano un nome di altri (Fantacalcio, Ruota della Fortuna, Il Prezzo è Giusto) e non
// vanno online finché il proprietario non decide i nomi. Si preparano in sito-in-attesa/ (la costruzione NON la copia), fuori dalla mappa,
// dagli elenchi e dai link. Per pubblicarne una: via da qui, rifai le pagine e la costruzione.
var IN_ATTESA = { astafanta: 1, ruota: 1, prezzo: 1 };
// l'ordine delle pagine (i più forti prima) e l'indirizzo di ognuna: revelhouse.it/giochi/<indirizzo>/ (NON cambiarli: Google li ricorda)
var PAGINE = [
  ["astafanta", "mini-asta"], ["pecoranera", "pecora-nera"], ["impostore", "impostore"], ["timeline", "linea-del-tempo"],
  ["ordine", "parola-d-ordine"], ["scarabocchio", "scarabocchio"], ["lunghezza", "stessa-lunghezza-d-onda"], ["balla", "balla-colossale"],
  ["memata", "memata"], ["sipero", "si-pero"], ["chidinoi", "chi-di-noi"], ["nomicose", "nomi-cose-citta"], ["unaparola", "una-parola-sola"],
  ["patata", "patata-bollente"], ["dadoveviene", "da-dove-viene"], ["muro", "il-muro"], ["prezzo", "prezzo"], ["ruota", "ruota"],
  ["asta", "asta"], ["scalinata", "scalinata"], ["horto", "horto-muso"], ["pallamatta", "palla-matta"], ["calciobiliardo", "calcio-biliardo"],
  ["scopa", "scopa"], ["scopa2v2", "scopa-a-coppie"], ["scopone", "scopone"], ["blackjack", "blackjack"], ["poker", "poker"],
  ["tris", "tris"], ["trisgigante", "tris-gigante"], ["drop4", "drop-4"], ["hockey", "glow-hockey"]
];
// quanti giocatori, scritto a mano dove il conto delle schede direbbe una cosa strana (i giochi a due, le coppie)
var GIOCATORI = {
  tris: "In due, o contro il Bot", trisgigante: "In due, o contro il Bot", drop4: "In due, o contro il Bot", hockey: "In due, o contro il Bot",
  calciobiliardo: "Da 2 a 4, anche coi Bot", scopa: "In 2 o in 3, anche contro il Bot", scopa2v2: "In 4 a coppie: i posti vuoti li fanno i Bot",
  scopone: "In 4 a coppie: i posti vuoti li fanno i Bot", poker: "Da 2 a 10, anche contro i Bot"
};

// ---- i testi ----
var TESTI = {};
fs.readdirSync(__dirname).filter(function (f) { return /^testi-.*\.js$/.test(f); }).forEach(function (f) {
  var t = require("./" + f); for (var k in t) { if (TESTI[k]) throw new Error("Il gioco " + k + " ha due testi (" + f + ")"); TESTI[k] = t[k]; }
});

// ---- i giochi, dalle schede (js/elenco-giochi.js) e da js/core.js ----
var SCHEDE = {};
leggi("js/elenco-giochi.js").replace(/^\s*scheda\("([a-z0-9]+)", "[a-z0-9]+", (\{.*\})\);\s*$/gm, function (_, id, j) { SCHEDE[id] = JSON.parse(j); });
var core = leggi("js/core.js");
function oggetto(nome) { var m = new RegExp("var " + nome + " = (\\{[^}]*\\})").exec(core); if (!m) throw new Error("Non trovo " + nome + " in js/core.js"); return Function("return " + m[1])(); }
var NASCOSTI = oggetto("GIOCHI_NASCOSTI"), ONLINE = oggetto("GIOCHI_ONLINE"), CAT = oggetto("CAT_GIOCO");
var visibili = Object.keys(SCHEDE).filter(function (id) { return !NASCOSTI[id] && !NO_PAGINA[id]; });
var giochi = PAGINE.filter(function (p) { return visibili.indexOf(p[0]) >= 0; }).map(function (p) {
  var id = p[0], s = SCHEDE[id], t = TESTI[id];
  if (!t) throw new Error("Manca il testo della pagina di " + id + " (testi-*.js)");
  var modi = (s.modi || []).filter(function (m) { return !m.soloPer; });
  var online = !!ONLINE[id], telefono = modi.some(function (m) { return m.amici; }), bot = modi.some(function (m) { return /^bot/.test(m.modo); }) || id === "ordine";
  var min = Math.min.apply(null, [s.giocatoriMin].concat(modi.map(function (m) { return m.min || s.giocatoriMin; })));
  var max = Math.max(s.giocatoriMax || 1, online ? s.postiOnline || 0 : 0);
  if (id === "horto" || id === "scalinata") min = 1;
  var foto = fs.existsSync(path.join(R, "carte/giochi/" + id + ".jpg")) ? "/carte/giochi/" + id + ".jpg" : null;
  return { id: id, url: "/giochi/" + p[1] + "/", s: s, t: t, nome: s.nome, icona: s.icona, cat: CAT[id] || "festa", online: online, telefono: telefono, bot: bot,
    soloOnline: !!s.soloOnline, min: min, max: max, gioc: GIOCATORI[id] || (min === max ? "In " + min : "Da " + min + " a " + max) + " giocatori", foto: foto };
});
var pubblici = giochi.filter(function (g) { return !IN_ATTESA[g.id]; });   // quelli che vanno online (gli altri: sito-in-attesa/)
visibili.forEach(function (id) { if (!giochi.some(function (g) { return g.id === id; })) throw new Error("Il gioco " + id + " è visibile ma non ha il suo posto in PAGINE (fai-pagine.js)"); });

// ---- aiuti per l'HTML ----
function h(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function ld(o) { return '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, "\\u003c") + "</script>"; }
var OGGI = new Date().toISOString().slice(0, 10);
var MARCHIO = '<a class="pg-marchio" href="/"><img src="/app/icona.svg" alt="" width="36" height="36"><span>Revel <b>House</b></span></a>';
function testa(o) {   // o: { titolo, descr, url, foto, extra }
  return '<!DOCTYPE html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    "<title>" + h(o.titolo) + "</title>\n" +
    '<meta name="description" content="' + h(o.descr) + '">\n<meta name="theme-color" content="#0d1020">\n' +
    '<link rel="canonical" href="' + SITO + o.url + '">\n' +
    '<link rel="icon" type="image/svg+xml" href="/app/icona-piccola.svg">\n<link rel="icon" type="image/png" sizes="32x32" href="/app/icona-32.png">\n<link rel="apple-touch-icon" href="/app/icona-piena-180.png">\n' +
    '<meta property="og:type" content="website">\n<meta property="og:site_name" content="Revel House">\n<meta property="og:locale" content="it_IT">\n' +
    '<meta property="og:title" content="' + h(o.ogTitolo || o.titolo) + '">\n<meta property="og:description" content="' + h(o.descr) + '">\n' +
    '<meta property="og:url" content="' + SITO + o.url + '">\n<meta property="og:image" content="' + SITO + (o.foto || "/app/anteprima.png") + '">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<link rel="preload" href="/pagine/sg-testo.woff2" as="font" type="font/woff2" crossorigin>\n' +
    '<link rel="stylesheet" href="/pagine/pagine.css">\n<link rel="stylesheet" href="/pagine/giochi.css">\n' + (o.extra || "") + "</head>\n";
}
function piede(nota) {
  return '  <footer class="pg-piede">\n    <nav><a href="/">Gioca</a><a href="/giochi/">Tutti i giochi</a><a href="/privacy.html">Privacy</a><a href="/regole.html">Regole d\'uso</a><a href="/crediti.html">Crediti</a></nav>\n' +
    (nota ? '    <p class="gc-marchi">' + h(nota) + "</p>\n" : "") + '    <p class="gc-marchi">' + h(T.marchiTutti) + "</p>\n  </footer>\n";
}
function scheda(g, piccola) {   // la tessera di un gioco (come in home: foto, nome, categoria, giocatori)
  var cat = T.categorie.filter(function (c) { return c.id === g.cat; })[0];
  return '<a class="gc-tessera" href="' + g.url + '">' +
    (g.foto ? '<img src="' + g.foto + '" alt="" width="800" height="500" loading="lazy" decoding="async">' : '<span class="gc-senza" aria-hidden="true">' + h(g.icona) + "</span>") +
    "<b>" + h(g.nome) + "</b><small>" + (piccola === false ? "" : h(cat ? cat.nome.replace(/^\S+\s/, "") : "") + " · ") + h(g.gioc.replace(/ giocatori$/, "")) + "</small></a>";
}
function sezioni(l) {
  return l.map(function (s) {
    return '  <section>\n    <h2>' + h(s.t) + "</h2>\n" + (s.p || []).map(function (p) { return "    <p>" + h(p) + "</p>\n"; }).join("") +
      (s.li && s.li.length ? "    <ul>\n" + s.li.map(function (x) { return "      <li>" + h(x) + "</li>\n"; }).join("") + "    </ul>\n" : "") + "  </section>\n";
  }).join("");
}
function fatti(g) {
  var l = ["👥 " + g.gioc];
  if (g.online) l.push("📶 Online, ognuno dal suo telefono");
  if (g.telefono) l.push("📱 Anche con un telefono solo");
  if (g.bot && g.id !== "ordine") l.push("🤖 Anche contro i Bot");
  l.push("🎁 Gratis, senza pubblicità");
  return '  <ul class="gc-fatti">' + l.map(function (x) { return "<li>" + h(x) + "</li>"; }).join("") + "</ul>\n";
}
function gioca(g, testo) { return '<a class="gc-gioca" href="/#gioco=' + g.id + '">' + h(testo || "▶ Gioca ora") + "</a>"; }

// ---- la pagina di ogni gioco ----
["sito/giochi", "sito-in-attesa"].forEach(function (d) { fs.rmSync(path.join(R, d), { recursive: true, force: true }); });   // (via le pagine vecchie)
giochi.forEach(function (g, i) {
  var t = g.t, url = SITO + g.url;
  var altri = pubblici.filter(function (x) { return x !== g && x.cat === g.cat; }).concat(pubblici.filter(function (x) { return x !== g && x.cat !== g.cat; })).slice(0, 6);
  var dati = [
    { "@context": "https://schema.org", "@type": "Game", name: g.nome, description: t.descr, url: url, inLanguage: "it",
      image: SITO + (g.foto || "/app/anteprima.png"), numberOfPlayers: { "@type": "QuantitativeValue", minValue: g.min, maxValue: g.max },
      isAccessibleForFree: true, publisher: { "@type": "Organization", name: "Revel House", url: SITO + "/" } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Revel House", item: SITO + "/" },
      { "@type": "ListItem", position: 2, name: "Giochi", item: SITO + "/giochi/" },
      { "@type": "ListItem", position: 3, name: g.nome, item: url }] }
  ];
  var html = testa({ titolo: t.titolo + " · Revel House", ogTitolo: g.nome + " · Revel House", descr: t.descr, url: g.url, foto: g.foto, extra: ld(dati) + "\n" }) +
    '<body>\n<main class="pg gc">\n  <header class="pg-testa">\n    ' + MARCHIO + '\n    <a class="pg-torna" href="/#gioco=' + g.id + '">▶ Gioca</a>\n  </header>\n' +
    '  <nav class="gc-briciole" aria-label="Dove sei"><a href="/">Revel House</a> › <a href="/giochi/">Giochi</a> › <span>' + h(g.nome) + "</span></nav>\n" +
    "  <h1>" + h(t.h1) + "</h1>\n" +
    (g.foto ? '  <figure class="gc-foto"><img src="' + g.foto + '" alt="' + h(g.nome) + ': la copertina del gioco" width="800" height="500" fetchpriority="high"></figure>\n'
            : '  <figure class="gc-foto gc-foto-senza"><span aria-hidden="true">' + h(g.icona) + "</span></figure>\n") +
    "  " + gioca(g) + '\n  <p class="gc-sotto">Si apre subito sul telefono: niente da scaricare.</p>\n' +
    fatti(g) +
    '  <p class="pg-intro">' + h(t.intro) + "</p>\n" +
    sezioni(t.sezioni) +
    "  " + gioca(g, "▶ Comincia una partita") + "\n" +
    '  <section class="gc-altri">\n    <h2>Altri giochi da fare con gli amici</h2>\n    <div class="gc-griglia">' + altri.map(function (x) { return scheda(x); }).join("") + "</div>\n" +
    '    <p class="gc-tutti"><a href="/giochi/">Tutti i giochi ›</a></p>\n  </section>\n' +
    piede(T.marchi[g.id]) + "</main>\n</body>\n</html>\n";
  scrivi((IN_ATTESA[g.id] ? "sito-in-attesa" : "sito") + g.url + "index.html", html);
});

// ---- la pagina di tutti i giochi ----
(function () {
  var t = T.tutti, url = "/giochi/";
  var dati = { "@context": "https://schema.org", "@type": "ItemList", name: t.h1, itemListElement: pubblici.map(function (g, i) { return { "@type": "ListItem", position: i + 1, name: g.nome, url: SITO + g.url }; }) };
  var gruppi = T.categorie.map(function (c) {
    var l = pubblici.filter(function (g) { return g.cat === c.id; }); if (!l.length) return "";
    return '  <section class="gc-cat">\n    <h2>' + h(c.nome) + '</h2>\n    <p class="tenue">' + h(c.sotto) + '</p>\n    <div class="gc-griglia">' + l.map(function (g) { return scheda(g, false); }).join("") + "</div>\n  </section>\n";
  }).join("");
  var html = testa({ titolo: t.titolo + " · Revel House", descr: t.descr, url: url, extra: ld(dati) + "\n" }) +
    '<body>\n<main class="pg gc">\n  <header class="pg-testa">\n    ' + MARCHIO + '\n    <a class="pg-torna" href="/">▶ Gioca</a>\n  </header>\n' +
    "  <h1>" + h(t.h1) + '</h1>\n  <p class="pg-intro">' + h(t.intro) + "</p>\n  " + '<a class="gc-gioca" href="/">▶ Apri Revel House</a>\n' +
    gruppi + sezioni(t.sezioni) + piede() + "</main>\n</body>\n</html>\n";
  scrivi("sito/giochi/index.html", html);
})();

// ---- il testo della pagina d'ingresso (dentro dist/index.html, dopo <div id="app">): l'app lo nasconde subito ----
(function () {
  var I = T.ingresso;
  var dati = [
    { "@context": "https://schema.org", "@type": "WebSite", name: "Revel House", alternateName: ["Revel House giochi", "SPeeD GAME"], url: SITO + "/", inLanguage: "it", description: I.descr },
    { "@context": "https://schema.org", "@type": "Organization", name: "Revel House", url: SITO + "/", logo: SITO + "/app/icona-512.png", email: "revelhouse.app@gmail.com" },
    { "@context": "https://schema.org", "@type": "ItemList", name: "I giochi di Revel House", itemListElement: pubblici.map(function (g, i) { return { "@type": "ListItem", position: i + 1, name: g.nome, url: SITO + g.url }; }) }
  ];
  var s = "<!-- 🔎 Il testo per Google (fatto da .agents/skills/pagine-google/fai-pagine.js: non toccarlo a mano).\n" +
    "     Chi apre l'app non lo vede mai: la riga qui sotto lo nasconde prima che arrivi. Si legge solo senza JavaScript. -->\n" +
    '<script>document.documentElement.classList.add("sg-js")</script>\n' +
    "<style>.sg-js #sito{display:none!important}#sito{max-width:720px;margin:0 auto;padding:24px 16px 40px;color:#f4f5fb;background:#0d1020;font:16px/1.55 system-ui,sans-serif}#sito a{color:#ff6d97}#sito h1{font-size:1.7rem;line-height:1.2}#sito li{margin:0 0 8px}</style>\n" +
    '<div id="sito">\n  <h1>' + h(I.h1) + "</h1>\n" + I.p.map(function (p) { return "  <p>" + h(p) + "</p>\n"; }).join("") +
    "  <h2>I giochi</h2>\n  <ul>\n" + pubblici.map(function (g) { return '    <li><a href="' + g.url + '">' + h(g.nome) + "</a> · " + h(g.t.intro.split(/(?<=[.!?])\s/)[0]) + "</li>\n"; }).join("") +
    '  </ul>\n  <p><a href="/giochi/">Tutti i giochi</a> · <a href="/privacy.html">Privacy</a> · <a href="/regole.html">Regole d\'uso</a> · <a href="/crediti.html">Crediti</a></p>\n</div>\n' +
    ld(dati) + "\n";
  scrivi("app/ingresso.html", s);
  // titolo, descrizione e indirizzo giusto nelle due teste (app/testa.html e index.html)
  ["app/testa.html", "index.html"].forEach(function (f) {
    var x = leggi(f), y = x.replace(/<title>[^<]*<\/title>/, "<title>" + h(I.titolo) + "</title>")
      .replace(/(<meta name="description" content=")[^"]*(">)/, "$1" + h(I.descr) + "$2");
    if (!/rel="canonical"/.test(y)) y = y.replace(/(\n([ \t]*)<meta name="application-name"[^\n]*)/, '\n$2<link rel="canonical" href="' + SITO + '/">$1');
    if (y !== x) scrivi(f, y);
  });
})();

// ---- la mappa del sito e robots.txt ----
(function () {
  var l = ["/", "/giochi/"].concat(pubblici.map(function (g) { return g.url; }), ["/privacy.html", "/regole.html", "/crediti.html"]);
  scrivi("sito/sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    l.map(function (u) { return "  <url><loc>" + SITO + u + "</loc><lastmod>" + OGGI + "</lastmod></url>\n"; }).join("") + "</urlset>\n");
  scrivi("sito/robots.txt", "# Revel House: tutto si può leggere, tranne i pezzi di pagina che l'app usa per costruirsi\nUser-agent: *\nDisallow: /app/testa.html\nDisallow: /app/ingresso.html\n\nSitemap: " + SITO + "/sitemap.xml\n");
})();

console.log("Fatte " + pubblici.length + " pagine dei giochi (più " + (giochi.length - pubblici.length) + " in attesa in sito-in-attesa/), la pagina di tutti i giochi, sitemap.xml (" + (pubblici.length + 5) + " indirizzi), robots.txt e app/ingresso.html");

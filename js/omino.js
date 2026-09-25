/* =========================================================
   SPeeD GAME — OMINI personalizzabili (stile Mii)
   Disegnati in SVG col codice: niente immagini, leggerissimi.
   Volume con sfumature morbide, ciocche, pieghe dei vestiti.
   SGOmino.svg(cfg, {busto, px})  -> stringa SVG
   SGOmino.el(cfg, opts)          -> elemento pronto
   SGOmino.casuale(seme)          -> omino a caso (sempre uguale per lo stesso seme)
   ========================================================= */
(function () {
  "use strict";

  var OPZ = {
    forma:     ["uomo", "donna"],
    corpo:     ["snello", "medio", "robusto"],
    pelle:     ["#ffe3cc", "#f7cda8", "#eab48a", "#cf9464", "#a96d43", "#7c4b2c", "#58341f", "#fff1e6", "#3d2314"],
    viso:      ["tondo", "ovale", "squadrato", "cuore", "lungo", "paffuto"],
    orecchie:  ["normali", "piccole", "grandi", "punta"],
    occhi:     ["tondi", "dolci", "grandi", "mandorla", "felici", "furbi", "assonnati", "puntini", "occhiolino", "ciglia", "felini", "tristi", "stelline", "chiusi"],
    iride:     ["#3b2416", "#6b4423", "#2e6fbf", "#3f8f4f", "#6b6f76", "#a0692b", "#1e9c8f", "#7d4cc0", "#141414"],
    sopracc:   ["morbide", "decise", "alzate", "sottili", "folte", "arcuate", "preoccupate", "dritte", "unite", "fini", "arrabbiate", "tagliate"],
    naso:      ["piccolo", "tondo", "punta", "largo", "insu", "aquilino", "puntino", "patata", "lungo", "dritto"],
    bocca:     ["sorriso", "sorrisone", "neutro", "o", "ghigno", "labbra", "linguaccia", "dentoni", "smorfia", "baciotto", "sorrisetto", "risata", "triste", "micio", "canini", "apparecchio", "mordilabbro", "nervoso"],
    segno:     ["nessuno", "neo", "cicatrice", "cerotto", "occhiaie", "rughe", "voglia", "stellina"],
    trucco:    ["nessuno", "ombretto", "eyeliner", "rossetto", "completo"],
    colTrucco: ["#b565d8", "#4dabf7", "#ff8787", "#e8590c", "#343a40", "#c2255c", "#51cf66", "#fcc419"],
    guance:    ["no", "leggere", "rosse", "lentiggini"],
    capelli:   ["rasato", "corti", "riga", "spettinati", "ciuffo", "indietro", "undercut", "scodella", "riccicorti", "afrocorto", "pixie", "cresta", "calvo",
                "sfumato", "spike", "banana", "treccine", "stempiato", "chierica", "afroalto",
                "frangia", "caschetto", "tendina", "mossi", "surfista", "mullet", "emo", "caschettolungo", "codinobasso",
                "ciuffolaterale", "scalati", "boccolimedi", "anime", "bobfrangia", "arruffati",
                "lunghi", "onde", "coda", "codaalta", "codini", "treccia", "trecce", "mezzacoda", "chignon", "chignonspettinato", "ricci", "afro", "dread",
                "lunghissimi", "codalaterale", "chignondoppio", "codebasse", "frangialunghi", "boccoli", "rigalato"],
    colCap:    ["#2a1d15", "#4b2f1d", "#7a4a26", "#b5672d", "#e0b85a", "#f3e3a8", "#9aa0a8", "#c0392b", "#2e86de", "#8e44ad", "#ff7eb6", "#fff8e7", "#e8702a", "#16a085", "#c2185b", "#101010"],
    barba:     ["no", "accenno", "corta", "folta", "barbalunga", "collare", "pizzetto", "ancora", "baffi", "baffipizzetto", "baffoni", "basettoni"],
    capo:      ["maglietta", "lunga", "felpa", "camicia", "canotta", "polo", "dolcevita", "giacca", "bomber", "calcio"],
    maglia:    ["#e03131", "#1c7ed6", "#2f9e44", "#f59f00", "#7048e8", "#e64980", "#15aabf", "#343a40", "#f1f3f5", "#fd7e14"],
    stampa:    ["nessuna", "righe", "stella", "fulmine", "cuore", "pois", "quadri", "smile", "pallone", "numero"],
    sotto:     ["jeans", "strappati", "cargo", "pantaloni", "tuta", "pantaloncini", "gonna", "gonnalunga"],
    modScarpe: ["sneakers", "stivali", "eleganti", "sandali"],
    pantaloni: ["#2b3a67", "#343a40", "#6c5a3e", "#5c636a", "#1971c2", "#e64980", "#7048e8", "#f1f3f5", "#3d5a99", "#7a9bd6", "#c9b48a", "#556b2f"],
    scarpe:    ["#2a2a31", "#f1f3f5", "#e03131", "#1c7ed6", "#f59f00", "#6c4a2e"],
    accessorio:["nessuno", "occhiali", "sole", "cappellino", "berretto", "fascia", "cuffie", "orecchini", "corona"],   // vecchio (solo per convertire)
    cappello:  ["nessuno", "cappellino", "berretto", "fascia", "cuffie", "cilindro", "cowboy", "pescatore", "basco", "festa", "gatto", "fiori", "corona"],
    occhiali:  ["nessuno", "tondi", "quadrati", "sole", "aviatore", "cuore"],
    orecchini: ["nessuno", "cerchi", "punti", "pendenti", "piercing"],
    collo:     ["nessuno", "sciarpa", "collana", "perle", "papillon", "cravatta", "bandana"],
    colCollo:  ["#e03131", "#1c7ed6", "#2f9e44", "#f59f00", "#7048e8", "#e64980", "#15aabf", "#343a40", "#f1f3f5", "#fd7e14"],
    colAcc:    ["#e03131", "#1c7ed6", "#2f9e44", "#f59f00", "#7048e8", "#e64980", "#15aabf", "#343a40", "#f1f3f5", "#fd7e14"]
  };
  var BASE = { forma: "uomo", corpo: "medio", pelle: 1, viso: "tondo", occhi: "tondi", iride: 1, sopracc: "morbide", naso: "piccolo",
               bocca: "sorriso", guance: "no", segno: "nessuno", trucco: "nessuno", colTrucco: 0, capelli: "corti", colCap: 1, barba: "no", capo: "lunga", maglia: 1, stampa: "nessuna",
               sotto: "jeans", pantaloni: 8, scarpe: 0, modScarpe: "sneakers", accessorio: "nessuno", colAcc: null,
               cappello: null, occhiali: null, orecchini: null, collo: "nessuno", colCollo: 0,
               orecchie: "normali", occG: 0, occD: 0, occA: 0, soprA: 0, nasoG: 0, boccaA: 0 };   // regolazioni fini (da -2 a +2)
  // nomi da mostrare nell'editor (se manca, si usa il valore con la maiuscola)
  var NOMI = { no: "Nessuna", nessuno: "Nessuno", sole: "Da sole", o: "A O", punta: "A punta", baffipizzetto: "Baffi+pizzetto", lunga: "Maniche lunghe", pantaloni: "Classici", pantaloncini: "Corti",
    riga: "Riga di lato", indietro: "Indietro", scodella: "Scodella", riccicorti: "Ricci corti", afrocorto: "Afro corto", tendina: "Riga in mezzo",
    caschettolungo: "Caschetto lungo", codinobasso: "Codino basso", codaalta: "Coda alta", trecce: "Due trecce", mezzacoda: "Mezza coda",
    chignonspettinato: "Chignon mosso", dread: "Dreadlock", lunghi: "Lisci",
    puntini: "A puntino", insu: "All'insù", baciotto: "Bacio", barbalunga: "Lunga", basettoni: "Basettoni", collare: "Collare",
    ancora: "Ancora", completo: "Completo", dolcevita: "Dolcevita", calcio: "Da calcio", strappati: "Strappati", gonnalunga: "Gonna lunga",
    sneakers: "Sneakers", stivali: "Stivali", eleganti: "Eleganti", sandali: "Sandali",
    festa: "Da festa", gatto: "Orecchie gatto", fiori: "Fiori", punti: "Punto luce", tondi: "Tondi", quadrati: "Quadrati", cuore: "A cuore",
    sfumato: "Sfumato", spike: "Spike", banana: "Banana", treccine: "Treccine", stempiato: "Stempiato", chierica: "Chierica", afroalto: "Afro alto",
    ciuffolaterale: "Ciuffo di lato", scalati: "Scalati", boccolimedi: "Boccoli medi", anime: "Anime", bobfrangia: "Bob con frangia", arruffati: "Arruffati",
    lunghissimi: "Lunghissimi", codalaterale: "Coda di lato", chignondoppio: "Due chignon", codebasse: "Codini bassi", frangialunghi: "Lunghi con frangia", boccoli: "Boccoli", rigalato: "Lunghi, riga di lato",
    paffuto: "Paffuto", lungo: "Lungo", normali: "Normali", piccole: "Piccole",
    occhiolino: "Occhiolino", ciglia: "Ciglia lunghe", felini: "Felini", tristi: "Tristi", stelline: "Luccicanti", chiusi: "Chiusi",
    dritte: "Dritte", unite: "Unite", fini: "Fini", arrabbiate: "Arrabbiate", tagliate: "Con taglio",
    puntino: "Puntino", patata: "A patata", dritto: "Dritto",
    sorrisetto: "Sorrisetto", risata: "Risata", triste: "Triste", micio: "Da micio", canini: "Canini", apparecchio: "Apparecchio", mordilabbro: "Morde il labbro", nervoso: "Nervoso",
    voglia: "Voglia", stellina: "Stellina" };
  // oggetti che si sbloccano coi trofei (per ora bloccati)
  var BLOCCATI = { cappello: ["corona"] };
  // i tagli divisi per lunghezza: nell'editor sono tre file separate
  var GRUPPI_CAPELLI = [["Corti", 0, 20], ["Medi", 20, 35], ["Lunghi", 35, 55]];
  // accessori liberi per tutti; gli altri (es. corona) si sbloccheranno coi trofei
  var LIBERI = ["nessuno", "occhiali", "sole", "cappellino", "berretto", "fascia", "cuffie", "orecchini"];

  var SCALA_TESTA = 0.85;   // testa un po' più piccola del Mii classico (scelta dell'utente)
  var uid = 0, PREF = "om" + Math.random().toString(36).slice(2, 6);   // id unici anche se il file viene caricato due volte
  function rgb(h) { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function hex(c) { return "#" + c.map(function (x) { x = Math.max(0, Math.min(255, Math.round(x))); return (x < 16 ? "0" : "") + x.toString(16); }).join(""); }
  // amt > 0 schiarisce, < 0 scurisce
  function tono(h, amt) { return hex(rgb(h).map(function (x) { return amt > 0 ? x + (255 - x) * amt : x * (1 + amt); })); }
  function col(lista, v) { return typeof v === "string" && v.charAt(0) === "#" ? v : (lista[v] || lista[0]); }

  // completa una configurazione (e converte i vecchi omini: barba e baffi erano accessori)
  function norm(cfg) {
    cfg = cfg || {}; var c = {};
    for (var k in BASE) c[k] = cfg[k] != null ? cfg[k] : BASE[k];
    if (c.accessorio === "barba") { c.barba = "corta"; c.accessorio = "nessuno"; }
    if (c.accessorio === "baffi") { c.barba = "baffi"; c.accessorio = "nessuno"; }
    if (OPZ.accessorio.indexOf(c.accessorio) < 0) c.accessorio = "nessuno";
    // accessori a strati: i vecchi avatar avevano un solo "accessorio", lo mettiamo nello strato giusto
    var a = c.accessorio;
    if (c.cappello == null) c.cappello = /cappellino|berretto|fascia|cuffie|corona/.test(a) ? a : "nessuno";
    if (c.occhiali == null) c.occhiali = a === "occhiali" ? "tondi" : (a === "sole" ? "sole" : "nessuno");
    if (c.orecchini == null) c.orecchini = a === "orecchini" ? "cerchi" : "nessuno";
    ["cappello", "occhiali", "orecchini", "collo"].forEach(function (k) { if (OPZ[k].indexOf(c[k]) < 0) c[k] = "nessuno"; });
    if (c.colAcc == null) c.colAcc = c.maglia;   // di base il cappello ha il colore della maglia
    return c;
  }

  var TESTA = {
    tondo:     "M100,36 C132,36 154,60 154,92 C154,124 130,148 100,148 C70,148 46,124 46,92 C46,60 68,36 100,36 Z",
    ovale:     "M100,34 C131,34 152,58 152,90 C152,124 130,151 100,151 C70,151 48,124 48,90 C48,58 69,34 100,34 Z",
    squadrato: "M100,36 C136,36 155,56 155,88 C155,118 149,139 126,146 C113,150 87,150 74,146 C51,139 45,118 45,88 C45,56 64,36 100,36 Z",
    cuore:     "M100,36 C134,36 156,58 155,88 C154,114 132,138 100,152 C68,138 46,114 45,88 C44,58 66,36 100,36 Z",
    lungo:     "M100,32 C130,32 150,56 150,90 C150,128 128,155 100,155 C72,155 50,128 50,90 C50,56 70,32 100,32 Z",
    paffuto:   "M100,38 C137,38 158,60 158,95 C158,129 134,148 100,148 C66,148 42,129 42,95 C42,60 63,38 100,38 Z"
  };
  var FRONTE = {
    corti:      "M45,100 C40,52 70,30 102,30 C134,30 162,50 155,100 C150,80 146,70 136,64 C118,72 90,70 66,64 C56,72 50,84 45,100 Z",
    spettinati: "M45,100 C42,62 56,42 70,37 L66,22 L84,31 L93,15 L106,29 L121,17 L124,33 L141,28 L138,44 C152,54 159,74 155,100 C150,82 144,72 134,66 C116,74 88,72 66,66 C56,74 50,86 45,100 Z",
    frangia:    "M45,104 C40,52 70,30 102,30 C134,30 162,52 155,104 C152,90 150,82 146,76 L139,81 L131,71 L121,80 L111,70 L100,79 L89,70 L79,80 L69,71 L59,80 C52,86 48,94 45,104 Z",
    caschetto:  "M45,102 C40,50 70,30 102,30 C134,30 162,50 155,102 C152,86 148,76 140,70 Q100,86 60,70 C52,78 48,88 45,102 Z",
    lunghi:     "M45,110 C38,52 68,30 104,30 C136,30 164,52 155,110 C152,90 146,76 136,68 C122,62 104,64 92,57 C82,70 64,76 52,86 C48,94 46,102 45,110 Z",
    coda:       "M45,98 C40,52 70,30 102,30 C134,30 162,50 155,98 C152,82 148,72 140,66 C120,58 96,60 80,70 C66,72 52,82 45,98 Z"
  };
  FRONTE.ciuffo = FRONTE.corti;
  // capelli tirati indietro (chignon e codini): attaccatura liscia con la riga in mezzo
  FRONTE.chignon = FRONTE.codini = "M45,98 C40,50 70,30 100,30 C130,30 160,50 155,98 C151,80 142,68 126,62 C114,58 106,58 100,60 C94,58 86,58 74,62 C58,68 49,80 45,98 Z";
  // --- tagli nuovi ---
  FRONTE.riga = "M45,100 C40,52 70,30 102,30 C134,30 162,50 155,100 C152,84 146,72 136,66 C124,60 110,58 96,62 C80,66 62,70 52,82 C48,88 46,94 45,100 Z";
  FRONTE.indietro = "M46,96 C40,50 70,30 102,30 C134,30 160,50 154,96 C150,74 140,58 124,54 C110,50 90,50 76,54 C60,58 50,74 46,96 Z";
  FRONTE.undercut = "M58,72 C52,38 76,20 104,20 C134,20 152,38 146,72 C136,60 122,55 104,55 C86,55 70,60 58,72 Z";
  FRONTE.scodella = "M44,100 C38,46 70,27 100,27 C130,27 162,46 156,100 L152,100 L151,78 Q100,84 49,78 L48,100 Z";
  FRONTE.pixie = "M45,104 C40,52 70,30 102,30 C134,30 160,50 155,96 C152,82 146,72 138,68 C120,72 100,66 84,74 C72,80 60,86 52,98 C49,100 47,102 45,104 Z";
  FRONTE.tendina = "M45,112 C38,50 70,30 100,30 C130,30 162,50 155,112 C152,96 148,84 138,74 C126,64 112,62 100,62 C88,62 74,64 62,74 C52,84 48,96 45,112 Z";
  FRONTE.surfista = "M45,108 C40,50 70,30 102,30 C134,30 162,50 155,108 C153,94 150,84 144,78 L136,86 L130,74 L118,82 L112,70 L100,78 L92,68 L80,76 L72,68 L62,80 C54,86 48,96 45,108 Z";
  FRONTE.emo = "M45,104 C40,52 70,30 102,30 C134,30 162,52 155,104 C154,112 151,118 147,123 C140,114 134,105 126,95 C116,84 100,76 84,74 C70,74 56,86 45,104 Z";
  FRONTE.afro = FRONTE.afrocorto = "M44,100 C36,48 66,26 100,26 C134,26 164,48 156,100 C150,80 140,68 124,64 Q100,70 76,64 C60,68 50,80 44,100 Z";
  FRONTE.riccicorti = FRONTE.mullet = FRONTE.dread = FRONTE.corti;
  FRONTE.caschettolungo = FRONTE.caschetto;
  FRONTE.mossi = FRONTE.treccia = FRONTE.lunghi;
  FRONTE.onde = FRONTE.tendina;
  FRONTE.codinobasso = FRONTE.codaalta = FRONTE.trecce = FRONTE.mezzacoda = FRONTE.chignonspettinato = FRONTE.chignon;
  // --- altri tagli ---
  FRONTE.sfumato = "M52,86 C46,46 72,28 102,28 C132,28 156,46 148,86 C142,70 128,60 102,60 C78,60 60,70 52,86 Z";
  FRONTE.spike = "M45,100 C42,70 50,52 58,44 L50,24 L70,35 L70,12 L88,30 L98,6 L109,30 L126,10 L127,34 L148,24 L141,46 C151,56 158,76 155,100 C150,82 144,72 134,66 C116,74 88,72 66,66 C56,74 50,86 45,100 Z";
  FRONTE.banana = FRONTE.indietro;
  FRONTE.treccine = "M47,96 C41,50 70,31 101,31 C132,31 159,50 153,96 C149,76 140,62 124,58 C110,55 90,55 76,58 C60,62 51,76 47,96 Z";
  FRONTE.stempiato = "M45,100 C40,56 64,34 100,34 C136,34 160,56 155,100 C152,84 146,70 138,62 C131,56 124,52 117,50 Q100,60 83,50 C76,52 69,56 62,62 C54,70 48,84 45,100 Z";
  FRONTE.afroalto = "M50,82 C44,52 46,16 62,7 Q100,-6 138,7 C154,16 156,52 150,82 C132,66 68,66 50,82 Z";
  FRONTE.ciuffolaterale = "M45,108 C40,50 70,30 102,30 C134,30 162,50 155,100 C150,84 144,74 134,68 C116,64 96,70 82,82 C72,92 64,104 58,114 C54,112 48,110 45,108 Z";
  FRONTE.scalati = FRONTE.arruffati = FRONTE.spettinati;
  FRONTE.boccolimedi = FRONTE.afro;
  FRONTE.anime = "M40,104 L24,86 L44,78 L28,54 L54,56 L48,28 L72,40 L78,12 L96,32 L110,6 L118,32 L140,14 L140,42 L168,38 L152,60 L178,72 L154,82 L162,104 C154,86 146,76 136,70 L126,84 L118,68 L106,82 L96,66 L84,82 L76,68 L66,84 C56,88 46,96 40,104 Z";
  FRONTE.bobfrangia = FRONTE.frangialunghi = FRONTE.frangia;
  FRONTE.lunghissimi = FRONTE.lunghi;
  FRONTE.codalaterale = FRONTE.chignondoppio = FRONTE.codebasse = FRONTE.chignon;
  FRONTE.boccoli = FRONTE.tendina;
  FRONTE.rigalato = FRONTE.riga;
  // capelli ricci: trama a riccioli al posto delle ciocche dritte
  var RICCI_TRAMA = { afro: 1, afrocorto: 1, riccicorti: 1, afroalto: 1, boccolimedi: 1, boccoli: 1 };
  var DIETRO_MEDIO = "M40,92 C38,40 162,40 160,92 L161,130 Q150,138 140,131 L60,131 Q50,138 39,130 Z";
  var BARBA = {
    corta: "M47,100 C49,132 72,154 100,154 C128,154 151,132 153,100 C148,118 136,128 124,130 C116,139 108,141 100,141 C92,141 84,139 76,130 C64,128 52,118 47,100 Z",
    folta: "M46,96 C45,142 70,172 100,172 C130,172 155,142 154,96 C150,116 138,126 124,128 C116,138 108,140 100,140 C92,140 84,138 76,128 C62,126 50,116 46,96 Z",
    pizzetto: "M88,137 Q100,142 112,137 Q111,149 100,152 Q89,149 88,137 Z",
    barbalunga: "M46,96 C45,150 72,196 100,212 C128,196 155,150 154,96 C150,116 138,126 124,128 C116,138 108,140 100,140 C92,140 84,138 76,128 C62,126 50,116 46,96 Z",
    collare: "M47,100 C49,132 72,154 100,154 C128,154 151,132 153,100 L148,100 C146,126 126,146 100,146 C74,146 54,126 52,100 Z",
    ancora: "M84,135 Q100,145 116,135 Q113,156 100,159 Q87,156 84,135 Z",
    baffi: "M83,121 Q91,113 100,119 Q109,113 117,121 Q109,125 100,122 Q91,125 83,121 Z",
    baffoni: "M77,124 Q69,121 72,112 Q76,119 84,118 Q92,112 100,118 Q108,112 116,118 Q124,119 128,112 Q131,121 123,124 Q110,127 100,122 Q90,127 77,124 Z"
  };

  // curve di Bézier: per tagliare la manica a metà braccio
  function lp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function dividi(p, t) { var a = lp(p[0], p[1], t), b = lp(p[1], p[2], t), c = lp(p[2], p[3], t), d = lp(a, b, t), e = lp(b, c, t), f = lp(d, e, t); return [[p[0], a, d, f], [f, e, c, p[3]]]; }
  function tratto(p, t0, t1) { var q = dividi(p, t1)[0]; return t0 > 0 ? dividi(q, t0 / t1)[1] : q; }
  function curva(p) { function f(q) { return q[0].toFixed(1) + "," + q[1].toFixed(1); } return "M" + f(p[0]) + " C" + f(p[1]) + " " + f(p[2]) + " " + f(p[3]); }
  function chiaro(h) { var c = rgb(h); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255 > 0.62; }

  function svg(cfg, opts) {
    opts = opts || {};
    var c = norm(cfg), id = PREF + (++uid) + "_";
    function u(n) { return "url(#" + id + n + ")"; }
    var P = col(OPZ.pelle, c.pelle), H = col(OPZ.colCap, c.colCap), M = col(OPZ.maglia, c.maglia),
        T = col(OPZ.pantaloni, c.pantaloni), I = col(OPZ.iride, c.iride), A = col(OPZ.colAcc, c.colAcc), S = col(OPZ.scarpe, c.scarpe);
    var acc = c.cappello, tipo = c.capelli;
    // cappelli che coprono la testa: i capelli si vedono solo sotto questa linea
    var LINEA = { cappellino: 73, berretto: 73, cilindro: 53, cowboy: 58, pescatore: 63, basco: 52 }[acc], cappello = LINEA != null;
    // col cappello i capelli si vedono solo sotto la visiera (ritaglio "sc2" su tutti gli strati dei capelli)
    var bA = tono(A, -0.42), CC = col(OPZ.colCollo, c.colCollo), bC = tono(CC, -0.42);
    var donna = c.forma === "donna";
    var bP = tono(P, -0.4), bH = tono(H, -0.5), bM = tono(M, -0.42), bT = tono(T, -0.45);
    var testa = TESTA[c.viso] || TESTA.tondo, fr = FRONTE[tipo];
    var o = [];

    // ---------- gradienti, ritagli e trame ----------
    function stops(a) { return a.map(function (s) { return "<stop offset='" + s[0] + "' stop-color='" + s[1] + "'" + (s[2] != null ? " stop-opacity='" + s[2] + "'" : "") + "/>"; }).join(""); }
    function rad(n, cx, cy, r, st) { return "<radialGradient id='" + id + n + "' cx='" + cx + "' cy='" + cy + "' r='" + r + "'>" + stops(st) + "</radialGradient>"; }
    function lin(n, x2, y2, st) { return "<linearGradient id='" + id + n + "' x1='0' y1='0' x2='" + x2 + "' y2='" + y2 + "'>" + stops(st) + "</linearGradient>"; }
    o.push("<defs>",
      rad("p", 0.36, 0.28, 0.85, [[0, tono(P, 0.25)], [0.45, P], [0.85, tono(P, -0.1)], [1, tono(P, -0.24)]]),
      lin("pl", 0.3, 1, [[0, tono(P, 0.06)], [1, tono(P, -0.24)]]),
      rad("h", 0.35, 0.18, 0.95, [[0, tono(H, 0.38)], [0.4, H], [1, tono(H, -0.4)]]),
      lin("m", 0.35, 1, [[0, tono(M, 0.24)], [0.45, M], [1, tono(M, -0.34)]]),
      lin("t", 0.3, 1, [[0, tono(T, 0.2)], [0.5, T], [1, tono(T, -0.38)]]),
      rad("i", 0.5, 0.42, 0.62, [[0, tono(I, 0.5)], [0.55, I], [1, tono(I, -0.55)]]),
      lin("sc", 0, 1, [[0, "#d8cfc8"], [0.38, "#ffffff"], [1, "#f1ece8"]]),
      rad("g", 0.5, 0.5, 0.5, [[0, "#ff4f5e", 0.6], [1, "#ff4f5e", 0]]),
      rad("ao", 0.5, 0.5, 0.5, [[0, "#000", 0.38], [1, "#000", 0]]),
      rad("ter", 0.5, 0.5, 0.5, [[0, "#000", 0.45], [0.65, "#000", 0.16], [1, "#000", 0]]),
      rad("lu", 0.5, 0.5, 0.5, [[0, "#fff", 0.8], [1, "#fff", 0]]),
      rad("oro", 0.4, 0.3, 0.8, [[0, "#fff3b0"], [0.4, "#ffc93c"], [1, "#b7790b"]]),
      lin("s", 0.2, 1, [[0, tono(S, 0.3)], [0.5, S], [1, tono(S, -0.45)]]),
      lin("a", 0.35, 1, [[0, tono(A, 0.26)], [0.45, A], [1, tono(A, -0.34)]]),
      lin("cc", 0.35, 1, [[0, tono(CC, 0.26)], [0.45, CC], [1, tono(CC, -0.34)]]),
      "<clipPath id='" + id + "sc2'><rect x='0' y='" + (LINEA || 73) + "' width='200' height='200'/></clipPath>",   // capelli sotto il cappello
      opts.hd ? "<filter id='" + id + "sf' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='2.4'/></filter>" : "",
      lin("lente", 0.6, 1, [[0, "#4a5070"], [0.5, "#16161f"], [1, "#050507"]]),
      "<clipPath id='" + id + "cv'><path d='" + testa + "'/></clipPath>",
      fr ? "<clipPath id='" + id + "hc'><path d='" + fr + "'/></clipPath>" : "",
      "<clipPath id='" + id + "bc'><path d='" + (BARBA[c.barba] && !/baffi|baffoni/.test(c.barba) ? BARBA[c.barba] : BARBA.pizzetto) + "'/></clipPath>",
      rad("tr", 0.5, 0.6, 0.55, [[0, col(OPZ.colTrucco, c.colTrucco), 0.75], [1, col(OPZ.colTrucco, c.colTrucco), 0]]),
      "<pattern id='" + id + "rc' patternUnits='userSpaceOnUse' width='7' height='6'><path d='M1,4 a2.3,2.3 0 1,1 4.4,0' stroke='" + tono(H, -0.4) + "' stroke-width='1.1' fill='none' opacity='.7'/><circle cx='5' cy='1.5' r='.8' fill='" + tono(H, 0.4) + "' opacity='.5'/></pattern>",
      "<pattern id='" + id + "pt' patternUnits='userSpaceOnUse' width='4' height='4'><circle cx='1' cy='1' r='.75' fill='" + tono(H, -0.15) + "'/><circle cx='3' cy='3' r='.65' fill='" + tono(H, -0.15) + "'/></pattern>",
      "</defs>");

    // ombra morbida a terra
    if (!opts.busto) o.push("<ellipse cx='100' cy='253' rx='52' ry='9' fill='" + u("ter") + "'/>");
    o.push("<g class='om-tutto'>");
    var kT = opts.scalaTesta || SCALA_TESTA, gT = "<g transform='translate(100,150) scale(" + kT + ") translate(-100,-150)'>";   // grandezza della testa (col collo fermo)
    o.push(gT);
    if (cappello) o.push("<g clip-path='" + u("sc2") + "'>");   // col cappello, niente capelli che spuntano sopra

    // ---------- capelli DIETRO la testa ----------
    if (tipo === "lunghi") {
      o.push("<path d='M40,92 C38,38 162,38 160,92 L168,188 Q100,204 32,188 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8'/>");
      [[38, 104], [44, 112], [156, 104], [162, 112]].forEach(function (p) {
        o.push("<path d='M" + p[0] + "," + p[1] + " Q" + (p[0] + (p[0] < 100 ? -4 : 4)) + ",150 " + p[0] + ",186' stroke='" + bH + "' stroke-width='1.4' opacity='.4' fill='none' stroke-linecap='round'/>");
      });
    }
    if (tipo === "caschetto") o.push("<path d='M40,92 C40,38 160,38 160,92 L162,142 Q148,152 134,144 L66,144 Q52,152 38,142 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8'/>",
      "<path d='M42,110 Q40,128 44,142 M158,110 Q160,128 156,142' stroke='" + bH + "' stroke-width='1.4' opacity='.4' fill='none'/>");
    if (tipo === "coda") o.push("<path d='M146,62 C178,52 190,92 178,128 C173,143 160,148 155,136 C166,110 164,86 142,74 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8'/>",
      "<path d='M156,70 Q176,86 168,128 M150,74 Q168,94 162,130' stroke='" + bH + "' stroke-width='1.3' opacity='.4' fill='none'/>",
      "<ellipse cx='149' cy='67' rx='6.5' ry='6' fill='#ff5c93' stroke='#b0144a' stroke-width='1.3'/>", "<circle cx='147' cy='65' r='2' fill='#fff' opacity='.5'/>");
    if (tipo === "ricci") riccioli(true);
    if (tipo === "chignon") {   // crocchia in cima, dietro la testa
      o.push("<circle cx='100' cy='28' r='19' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8'/>",
        "<path d='M86,24 Q100,10 114,24 M84,32 Q100,18 116,32 M90,40 Q100,30 110,40' stroke='" + bH + "' stroke-width='1.3' opacity='.4' fill='none'/>",
        "<path d='M88,18 Q98,11 108,14' stroke='#fff' stroke-width='3' opacity='.3' fill='none' stroke-linecap='round'/>");
    }
    if (tipo === "codini") [1, -1].forEach(function (s) {   // due codini ai lati, con l'elastico
      var X = function (v) { return (100 + s * v).toFixed(1); };
      o.push("<path d='M" + X(46) + ",76 C" + X(76) + ",70 " + X(82) + ",112 " + X(72) + ",144 C" + X(67) + ",156 " + X(55) + ",152 " + X(58) + ",138 C" + X(65) + ",112 " + X(58) + ",92 " + X(44) + ",88 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8'/>",
        "<path d='M" + X(58) + ",86 Q" + X(72) + ",106 " + X(66) + ",140 M" + X(52) + ",88 Q" + X(64) + ",110 " + X(60) + ",136' stroke='" + bH + "' stroke-width='1.2' opacity='.4' fill='none'/>",
        "<ellipse cx='" + X(52) + "' cy='80' rx='6' ry='7' fill='#ff5c93' stroke='#b0144a' stroke-width='1.3'/>", "<circle cx='" + X(50.5) + "' cy='77.5' r='1.8' fill='#fff' opacity='.5'/>");
    });
    // --- tagli nuovi: parti dietro la testa ---
    function massa(d, trama) {   // una massa di capelli con gradiente, bordo e (se riccia) trama
      o.push("<path d='" + d + "' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8' stroke-linejoin='round'/>");
      if (trama) o.push("<path d='" + d + "' fill='" + u("rc") + "'/>");
    }
    function ciocche(lista) { lista.forEach(function (d) { o.push("<path d='" + d + "' stroke='" + bH + "' stroke-width='1.3' opacity='.4' fill='none' stroke-linecap='round'/>"); }); }
    function elastico(cx, cy) { o.push("<ellipse cx='" + cx + "' cy='" + cy + "' rx='6' ry='5.5' fill='#ff5c93' stroke='#b0144a' stroke-width='1.3'/>", "<circle cx='" + (cx - 1.5) + "' cy='" + (cy - 2) + "' r='1.8' fill='#fff' opacity='.5'/>"); }
    if (/^(tendina|surfista|emo)$/.test(tipo)) { massa(DIETRO_MEDIO); ciocche(["M42,104 Q40,118 44,130", "M158,104 Q160,118 156,130"]); }
    if (tipo === "mossi") { massa("M40,92 C38,40 162,40 160,92 L164,140 Q156,152 148,144 Q140,156 130,146 L70,146 Q60,156 52,144 Q44,152 36,140 Z"); ciocche(["M42,104 Q34,124 42,142", "M158,104 Q166,124 158,142"]); }
    if (tipo === "caschettolungo") { massa("M40,92 C40,38 160,38 160,92 L164,158 Q150,166 136,160 L64,160 Q50,166 36,158 Z"); ciocche(["M42,110 Q40,136 44,156", "M158,110 Q160,136 156,156"]); }
    if (tipo === "mullet") { massa("M48,100 C46,132 54,160 68,172 Q100,180 132,172 C146,160 154,132 152,100 Z"); ciocche(["M60,140 Q64,158 70,170", "M140,140 Q136,158 130,170"]); }
    if (tipo === "codinobasso") { massa("M138,118 C156,124 162,150 154,172 C150,180 141,178 143,168 C147,152 143,136 131,128 Z"); ciocche(["M146,130 Q154,148 148,170"]); elastico(137, 124); }
    if (tipo === "onde") { massa("M40,92 C38,38 162,38 160,92 C166,110 158,126 166,142 C174,158 162,174 170,192 Q100,206 30,192 C38,174 26,158 34,142 C42,126 34,110 40,92 Z");
      ciocche(["M40,104 C46,120 34,134 42,150 C50,166 36,178 42,190", "M160,104 C154,120 166,134 158,150 C150,166 164,178 158,190"]); }
    if (tipo === "codaalta") { massa("M104,24 C130,2 170,18 172,60 C174,98 160,128 150,142 C145,127 152,98 148,70 C144,48 128,34 110,34 Z"); ciocche(["M120,20 Q158,30 160,80 Q158,110 152,132", "M114,28 Q146,40 150,80"]); elastico(108, 27); }
    if (tipo === "mezzacoda") { massa("M40,92 C38,38 162,38 160,92 L168,186 Q100,202 32,186 Z"); ciocche(["M38,104 Q34,150 38,184", "M162,104 Q166,150 162,184"]); o.push("<circle cx='100' cy='27' r='11' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.6'/>"); }
    if (tipo === "chignonspettinato") {
      o.push("<path d='M79,30 C76,8 96,2 108,6 C124,2 132,18 124,32 C122,42 84,44 79,30 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8'/>");
      ciocche(["M84,26 Q96,10 116,16", "M86,34 Q102,22 122,28", "M108,6 Q118,-2 126,4", "M82,14 Q76,6 70,10"]);
    }
    if (tipo === "afro") massa("M100,2 C152,2 186,40 184,92 C182,132 162,152 140,152 L60,152 C38,152 18,132 16,92 C14,40 48,2 100,2 Z", true);
    if (tipo === "dread") for (var dr = 0; dr < 12; dr++) {   // treccine rasta che scendono ai lati e dietro
      var dx = dr < 6 ? 38 + dr * 5 : 162 - (dr - 6) * 5, lung = 150 + (dr % 3) * 14;
      o.push("<path d='M" + dx + ",70 Q" + (dx + (dr < 6 ? -6 : 6)) + "," + ((70 + lung) / 2) + " " + (dx + (dr < 6 ? -2 : 2)) + "," + lung + "' stroke='" + bH + "' stroke-width='9' stroke-linecap='round' fill='none'/>",
        "<path d='M" + dx + ",70 Q" + (dx + (dr < 6 ? -6 : 6)) + "," + ((70 + lung) / 2) + " " + (dx + (dr < 6 ? -2 : 2)) + "," + lung + "' stroke='" + H + "' stroke-width='6.5' stroke-linecap='round' fill='none'/>",
        "<path d='M" + dx + ",70 Q" + (dx + (dr < 6 ? -6 : 6)) + "," + ((70 + lung) / 2) + " " + (dx + (dr < 6 ? -2 : 2)) + "," + lung + "' stroke='" + tono(H, -0.35) + "' stroke-width='6.5' stroke-dasharray='1.2 3.2' fill='none'/>");
    }
    // --- altri tagli: parti dietro la testa ---
    if (tipo === "bobfrangia") o.push("<path d='M40,92 C40,38 160,38 160,92 L162,142 Q148,152 134,144 L66,144 Q52,152 38,142 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8'/>");
    if (tipo === "scalati") { massa("M40,92 C38,40 162,40 160,92 L165,130 L155,124 L157,142 L145,132 L141,148 L128,136 L72,136 L59,148 L55,132 L43,142 L45,124 L35,130 Z"); ciocche(["M44,104 Q40,118 46,134", "M156,104 Q160,118 154,134"]); }
    if (tipo === "arruffati") { massa("M40,92 C38,40 162,40 160,92 L166,138 Q158,148 150,140 Q142,154 132,144 L68,144 Q58,154 50,140 Q42,148 34,138 Z"); ciocche(["M42,104 Q36,122 44,140", "M158,104 Q164,122 156,140"]); }
    if (tipo === "boccolimedi") massa("M36,92 C30,36 170,36 164,92 C172,112 166,130 170,146 Q150,158 134,148 L66,148 Q50,158 30,146 C34,130 28,112 36,92 Z", true);
    if (tipo === "anime" || tipo === "ciuffolaterale") { massa(DIETRO_MEDIO); ciocche(["M42,104 Q40,118 44,130", "M158,104 Q160,118 156,130"]); }
    if (tipo === "lunghissimi") { massa("M40,92 C38,38 162,38 160,92 L172,236 Q100,252 28,236 Z"); ciocche(["M38,104 Q30,170 36,232", "M162,104 Q170,170 164,232", "M46,120 Q42,180 48,230", "M154,120 Q158,180 152,230"]); }
    if (tipo === "frangialunghi" || tipo === "rigalato") { massa("M40,92 C38,38 162,38 160,92 L168,188 Q100,204 32,188 Z"); ciocche(["M38,104 Q34,150 40,184", "M162,104 Q166,150 160,184"]); }
    if (tipo === "boccoli") massa("M38,92 C34,36 166,36 162,92 C170,114 160,132 170,150 C178,168 164,184 172,200 Q100,214 28,200 C36,184 22,168 30,150 C40,132 30,114 38,92 Z", true);
    if (tipo === "chignondoppio") [66, 134].forEach(function (bx) {   // due crocchie in alto ai lati
      o.push("<circle cx='" + bx + "' cy='36' r='17' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8'/>",
        "<path d='M" + (bx - 11) + ",34 Q" + bx + ",22 " + (bx + 11) + ",34 M" + (bx - 9) + ",42 Q" + bx + ",32 " + (bx + 9) + ",42' stroke='" + bH + "' stroke-width='1.2' opacity='.4' fill='none'/>",
        "<path d='M" + (bx - 8) + ",28 Q" + (bx - 1) + ",22 " + (bx + 7) + ",25' stroke='#fff' stroke-width='2.5' opacity='.3' fill='none' stroke-linecap='round'/>");
    });
    if (tipo === "codebasse") [1, -1].forEach(function (s) {   // due codini bassi sulle spalle
      var X = function (v) { return (100 + s * v).toFixed(1); };
      o.push("<path d='M" + X(48) + ",110 C" + X(66) + ",116 " + X(72) + ",150 " + X(66) + ",178 C" + X(62) + ",190 " + X(50) + ",188 " + X(52) + ",176 C" + X(57) + ",150 " + X(54) + ",130 " + X(42) + ",120 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8'/>",
        "<path d='M" + X(56) + ",124 Q" + X(66) + ",148 " + X(60) + ",178' stroke='" + bH + "' stroke-width='1.2' opacity='.4' fill='none'/>");
      elastico(+X(50), 116);
    });
    if (tipo === "afroalto") massa("M50,82 C44,52 46,16 62,7 Q100,-6 138,7 C154,16 156,52 150,82 Z", true);
    if (tipo === "chierica") massa("M44,124 C30,104 30,76 44,58 Q56,50 62,62 L138,62 Q144,50 156,58 C170,76 170,104 156,124 Q150,130 146,122 L54,122 Q50,130 44,124 Z");   // corona di capelli ai lati e dietro (la cima resta pelata)
    if (cappello) o.push("</g>");
    o.push("</g>");   // fine capelli dietro (scala testa)

    // ---------- corpo: corporatura + forma ----------
    var B = { snello: [27, 22, 24, 15, 12], medio: [34, 31, 33, 20, 17], robusto: [40, 46, 44, 25, 21] }[c.corpo] || [34, 31, 33, 20, 17];
    var sh = B[0] - (donna ? 5 : 0), wa = B[1] - (donna ? 7 : 0), he = B[2] + (donna ? 6 : 0), lw = B[3] - (donna ? 2 : 0), aw = B[4] - (donna ? 2 : 0);
    var Y = 202;   // orlo della maglia: sotto si vedono bene i pantaloni
    function x(v) { return (100 + v).toFixed(1); }
    var sotto = c.sotto; if (/^gonna/.test(sotto) && !donna) sotto = "jeans"; if (OPZ.sotto.indexOf(sotto) < 0) sotto = "pantaloni";
    var gambeNude = /^gonna|pantaloncini/.test(sotto);
    var hp = he - 2, inkT = chiaro(T) ? tono(T, -0.55) : "#ffffff";
    if (!opts.busto) {
      // gambe nude (sotto gonna e pantaloncini)
      if (gambeNude) [97 - lw + 1.5, 103.5].forEach(function (lx) {
        o.push("<rect x='" + lx + "' y='" + (Y + 4) + "' width='" + (lw - 2) + "' height='" + (244 - Y - 4) + "' rx='" + ((lw - 2) / 2) + "' fill='" + u("pl") + "' stroke='" + bP + "' stroke-width='.9'/>");
      });
      if (/^gonna/.test(sotto)) {
        var L = sotto === "gonnalunga" ? 38 : 22, sv = sotto === "gonnalunga" ? 13 : 9;   // lunghezza e svasatura
        o.push("<path d='M" + x(-he + 1) + "," + (Y - 2) + " L" + x(-he - sv) + "," + (Y + L) + " Q100," + (Y + L + 9) + " " + x(he + sv) + "," + (Y + L) + " L" + x(he - 1) + "," + (Y - 2) + " Z' fill='" + u("t") + "' stroke='" + bT + "' stroke-width='1.8' stroke-linejoin='round'/>",
          "<path d='M" + x(-he / 2) + "," + (Y + 4) + " L" + x(-he / 2 - sv * 0.55) + "," + (Y + L + 3) + " M100," + (Y + 5) + " L100," + (Y + L + 6) + " M" + x(he / 2) + "," + (Y + 4) + " L" + x(he / 2 + sv * 0.55) + "," + (Y + L + 3) + "' stroke='" + bT + "' stroke-width='1.3' opacity='.35'/>",
          "<path d='M" + x(-he - sv + 2) + "," + (Y + L - 1) + " Q100," + (Y + L + 7) + " " + x(he + sv - 2) + "," + (Y + L - 1) + "' stroke='" + tono(T, 0.3) + "' stroke-width='1.3' stroke-dasharray='2.5 2' opacity='.6' fill='none'/>",
          "<path d='M" + x(-he + 4) + "," + (Y + 4) + " L" + x(-he - 3) + "," + (Y + 20) + "' stroke='#fff' stroke-width='3' opacity='.2' stroke-linecap='round'/>");
      } else {
        // pantaloni: un pezzo unico con fianchi, cavallo e due gambe
        var basso = sotto === "pantaloncini" ? 226 : 246, cav = sotto === "pantaloncini" ? 217 : 222, ox = 3 + lw + (sotto === "pantaloncini" ? 1.5 : 0);
        var dP = "M" + x(-hp) + "," + (Y - 8) + " L" + x(hp) + "," + (Y - 8) + " C" + x(hp + 1) + "," + (Y + 10) + " " + x(ox + 1) + "," + (basso - 12) + " " + x(ox) + "," + basso +
          " L103," + basso + " L101.8," + (cav + 1) + " Q100," + (cav - 1) + " 98.2," + (cav + 1) + " L97," + basso + " L" + x(-ox) + "," + basso +
          " C" + x(-ox - 1) + "," + (basso - 12) + " " + x(-hp - 1) + "," + (Y + 10) + " " + x(-hp) + "," + (Y - 8) + " Z";
        o.push("<path d='" + dP + "' fill='" + u("t") + "' stroke='" + bT + "' stroke-width='1.6' stroke-linejoin='round'/>",
          "<path d='M100," + (Y - 2) + " L100," + (cav - 2) + "' stroke='" + bT + "' stroke-width='1.2' opacity='.45'/>");   // patta
        [1, -1].forEach(function (s) {
          var X = function (v) { return x(s * v); }, gx = 3 + lw / 2;   // centro della gamba
          if (sotto === "strappati") [[gx, 226, lw / 3.2, 3.2], [gx + 1, 212, lw / 4.5, 2.2]].forEach(function (st) {   // strappi: si vede la pelle, coi fili bianchi
            o.push("<ellipse cx='" + X(st[0]) + "' cy='" + st[1] + "' rx='" + st[2].toFixed(1) + "' ry='" + st[3] + "' fill='" + u("pl") + "' stroke='" + tono(T, 0.2) + "' stroke-width='.8'/>",
              "<path d='M" + X(st[0] - st[2]) + "," + (st[1] - 1) + " L" + X(st[0] + st[2]) + "," + (st[1] - 1) + " M" + X(st[0] - st[2] * 0.8) + "," + (st[1] + 1.2) + " L" + X(st[0] + st[2] * 0.8) + "," + (st[1] + 1.2) + "' stroke='#f4f1ea' stroke-width='.9' opacity='.9'/>");
          });
          if (sotto === "cargo") o.push(   // tasche laterali con la pattina
            "<rect x='" + (s === 1 ? 100 + ox - 9 : 100 - ox + 1.5) + "' y='213' width='7.5' height='12' rx='1.5' fill='" + tono(T, -0.06) + "' stroke='" + bT + "' stroke-width='1'/>",
            "<path d='M" + (s === 1 ? 100 + ox - 9.5 : 100 - ox + 1) + ",213 l8.5,0 l0,3.5 l-8.5,0 Z' fill='" + tono(T, 0.1) + "' stroke='" + bT + "' stroke-width='.9'/>",
            "<path d='M" + X(gx) + "," + (Y + 8) + " L" + X(gx) + ",244' stroke='" + tono(T, 0.25) + "' stroke-width='1' opacity='.3'/>");
          if (sotto === "jeans" || sotto === "strappati") o.push(
            "<path d='M" + X(hp - 3) + "," + Y + " C" + X(hp - 2.5) + "," + (Y + 12) + " " + X(ox - 2.5) + ",234 " + X(ox - 2.5) + ",244' stroke='#e8a33c' stroke-width='1' stroke-dasharray='2 1.6' opacity='.85' fill='none'/>",
            "<path d='M" + X(hp - 1) + "," + (Y + 6) + " Q" + X(hp - 7) + "," + (Y + 5) + " " + X(hp - 10) + "," + (Y - 1) + "' stroke='#e8a33c' stroke-width='1' stroke-dasharray='2 1.6' opacity='.85' fill='none'/>",
            "<rect x='" + (s === 1 ? 103 : 97 - lw - 0.5) + "' y='235' width='" + (lw + 0.5) + "' height='6' rx='2' fill='" + tono(T, 0.18) + "' stroke='" + bT + "' stroke-width='1'/>",
            "<ellipse cx='" + X(gx) + "' cy='227' rx='" + (lw / 3) + "' ry='4.5' fill='" + u("lu") + "' opacity='.3'/>");
          else if (sotto === "pantaloni") o.push(
            "<path d='M" + X(gx) + "," + (Y + 8) + " L" + X(gx) + ",244' stroke='" + tono(T, 0.3) + "' stroke-width='1.2' opacity='.45'/>",
            "<path d='M" + X(hp - 1) + "," + (Y + 5) + " L" + X(hp - 7) + "," + (Y - 2) + "' stroke='" + bT + "' stroke-width='1.3' opacity='.55'/>");
          else if (sotto === "tuta") o.push(
            "<path d='M" + X(hp - 1.5) + "," + Y + " C" + X(hp - 1) + "," + (Y + 12) + " " + X(ox - 1.2) + ",232 " + X(ox - 1.2) + ",238 M" + X(hp - 4) + "," + Y + " C" + X(hp - 3.5) + "," + (Y + 12) + " " + X(ox - 3.5) + ",232 " + X(ox - 3.5) + ",238' stroke='" + inkT + "' stroke-width='1.6' opacity='.85' fill='none'/>",
            "<rect x='" + (s === 1 ? 103.5 : 97 - lw) + "' y='237' width='" + (lw - 0.5) + "' height='6' rx='3' fill='" + tono(T, -0.22) + "'/>",
            "<path d='M" + X(3 + lw * 0.25) + ",237.5 L" + X(3 + lw * 0.25) + ",242.5 M" + X(gx) + ",237.5 L" + X(gx) + ",242.5 M" + X(3 + lw * 0.75) + ",237.5 L" + X(3 + lw * 0.75) + ",242.5' stroke='" + bT + "' stroke-width='.9' opacity='.5'/>");
          else if (sotto === "pantaloncini") o.push(
            "<path d='M" + X(3.5) + ",222.5 L" + X(ox - 0.6) + ",222.5' stroke='" + tono(T, -0.3) + "' stroke-width='2' opacity='.7'/>",
            "<path d='M" + X(hp - 1) + "," + (Y + 5) + " L" + X(hp - 7) + "," + (Y - 2) + "' stroke='" + bT + "' stroke-width='1.2' opacity='.5'/>");
        });
      }
      // scarpe: suola, punta rinforzata, lacci incrociati
      [97 - lw / 2, 103 + lw / 2].forEach(function (cx) {
        var rx = lw / 2 + 5, lacci = rgb(S)[0] > 200 && rgb(S)[1] > 200 ? "#9a9aa6" : "#e6e6ee", mod = c.modScarpe;
        if (mod === "stivali") { o.push(   // gambale alto + tacco
          "<rect x='" + (cx - lw / 2 - 1.5) + "' y='224' width='" + (lw + 3) + "' height='22' rx='4' fill='" + u("s") + "' stroke='" + tono(S, -0.5) + "' stroke-width='.9'/>",
          "<rect x='" + (cx - lw / 2 - 2) + "' y='224' width='" + (lw + 4) + "' height='4' rx='2' fill='" + tono(S, -0.2) + "'/>",
          "<ellipse cx='" + cx + "' cy='247' rx='" + rx + "' ry='6.5' fill='" + u("s") + "' stroke='" + tono(S, -0.5) + "' stroke-width='.9'/>",
          "<rect x='" + (cx - rx + 1) + "' y='249.5' width='" + (rx * 2 - 2) + "' height='3.5' rx='1.5' fill='" + tono(S, -0.55) + "'/>",
          "<path d='M" + (cx - lw / 2 + 1.5) + ",228 L" + (cx - lw / 2 + 1.5) + ",243' stroke='#fff' stroke-width='2' opacity='.22' stroke-linecap='round'/>");
          return; }
        if (mod === "eleganti") { o.push(   // scarpa lucida, suola sottile scura
          "<ellipse cx='" + cx + "' cy='247' rx='" + rx + "' ry='6.2' fill='" + u("s") + "' stroke='" + tono(S, -0.55) + "' stroke-width='.9'/>",
          "<path d='M" + (cx - rx + 1) + ",249.5 Q" + cx + ",253.5 " + (cx + rx - 1) + ",249.5' stroke='#141418' stroke-width='2.4' fill='none' stroke-linecap='round'/>",
          "<ellipse cx='" + (cx - 3) + "' cy='244.5' rx='" + (rx * 0.45) + "' ry='1.8' fill='#fff' opacity='.55'/>",
          "<path d='M" + (cx + 1) + ",242.5 Q" + (cx + 4) + ",246 " + (cx + 1) + ",249.5' stroke='" + tono(S, -0.4) + "' stroke-width='.9' fill='none' opacity='.7'/>");
          return; }
        if (mod === "sandali") { o.push(   // piede nudo, suola sottile e due fascette
          "<ellipse cx='" + cx + "' cy='250.5' rx='" + (rx + 0.3) + "' ry='2.6' fill='" + tono(S, -0.1) + "' stroke='" + tono(S, -0.5) + "' stroke-width='.8'/>",
          "<ellipse cx='" + cx + "' cy='247' rx='" + (rx - 1) + "' ry='5' fill='" + u("pl") + "' stroke='" + bP + "' stroke-width='.9'/>",
          "<path d='M" + (cx - 3) + ",250 L" + (cx - 3) + ",248.5 M" + cx + ",250.2 L" + cx + ",248.6 M" + (cx + 3) + ",250 L" + (cx + 3) + ",248.5' stroke='" + bP + "' stroke-width='.8' opacity='.6'/>",
          "<path d='M" + (cx - rx + 2.5) + ",244.5 Q" + cx + ",242 " + (cx + rx - 2.5) + ",244.5 M" + (cx - rx + 3) + ",248 Q" + cx + ",245.5 " + (cx + rx - 3) + ",248' stroke='" + S + "' stroke-width='2.4' fill='none' stroke-linecap='round'/>");
          return; }
        o.push("<ellipse cx='" + cx + "' cy='250.5' rx='" + (rx + 0.5) + "' ry='3.6' fill='#e4e4ea' stroke='#b9b9c4' stroke-width='.8'/>",
          "<ellipse cx='" + cx + "' cy='246.5' rx='" + rx + "' ry='7' fill='" + u("s") + "' stroke='" + tono(S, -0.5) + "' stroke-width='.8'/>",
          "<ellipse cx='" + cx + "' cy='248.5' rx='" + (rx * 0.62) + "' ry='4' fill='" + tono(S, 0.12) + "' opacity='.55'/>",
          "<path d='M" + (cx - rx + 2) + ",248.5 Q" + cx + ",252.5 " + (cx + rx - 2) + ",248.5' stroke='" + tono(S, 0.4) + "' stroke-width='.8' stroke-dasharray='1.6 1.4' opacity='.7' fill='none'/>",
          "<ellipse cx='" + (cx - 4) + "' cy='243.5' rx='5' ry='2.2' fill='" + u("lu") + "'/>",
          "<path d='M" + (cx - 3) + ",241 L" + (cx + 3) + ",244.2 M" + (cx + 3) + ",241 L" + (cx - 3) + ",244.2 M" + (cx - 2.5) + ",245.5 L" + (cx + 2.5) + ",245.5' stroke='" + lacci + "' stroke-width='1' opacity='.85' stroke-linecap='round'/>");
      });
    }
    // braccia (maniche con polsino, piega al gomito) + mani col pollice e le dita
    var ax = 100 - (sh - 6), hx = 100 - (Math.max(sh, wa, he) + 12);
    var manica = { maglietta: 0.45, polo: 0.45, calcio: 0.45, canotta: 0 }[c.capo]; if (manica == null) manica = 1;   // quanta parte del braccio copre la manica
    [1, -1].forEach(function (s) {
      var a = 100 + s * (ax - 100), h = 100 + s * (hx - 100), Pb = [[a, 166], [a - s * 12, 172], [h, 184], [h, 197]], d = curva(Pb);
      o.push("<g class='om-braccio om-b" + (s === 1 ? 1 : 2) + "'>");   // gruppo a parte: nell'editor l'omino saluta
      if (manica < 1) o.push("<path d='" + d + "' stroke='" + bP + "' stroke-width='" + (aw + 2) + "' stroke-linecap='round' fill='none'/>",
        "<path d='" + d + "' stroke='" + u("pl") + "' stroke-width='" + (aw - 1.5) + "' stroke-linecap='round' fill='none'/>");
      if (manica > 0) {
        var dm = curva(tratto(Pb, 0, manica)), orlo = curva(tratto(Pb, manica - 0.07, manica));
        o.push("<path d='" + dm + "' stroke='" + bM + "' stroke-width='" + (aw + 3.5) + "' stroke-linecap='round' fill='none'/>",
          "<path d='" + dm + "' stroke='" + u("m") + "' stroke-width='" + aw + "' stroke-linecap='round' fill='none'/>",
          "<path d='" + curva(tratto([[Pb[0][0] - s * 4, 170], [Pb[1][0], 176], [h + s * 3, 184], [h + s * 3, 193]], 0, manica * 0.95)) + "' stroke='#fff' stroke-width='2.5' opacity='.16' fill='none' stroke-linecap='round'/>",
          "<path d='" + orlo + "' stroke='" + tono(M, -0.28) + "' stroke-width='" + (aw + 1) + "' stroke-linecap='round' fill='none'/>");
        if (manica > 0.6) { var pe = dividi(Pb, 0.55)[0][3];
          o.push("<path d='M" + (pe[0] - aw * 0.32).toFixed(1) + "," + (pe[1] - 1).toFixed(1) + " Q" + pe[0].toFixed(1) + "," + (pe[1] + 2.2).toFixed(1) + " " + (pe[0] + aw * 0.32).toFixed(1) + "," + (pe[1] - 1.5).toFixed(1) + "' stroke='" + bM + "' stroke-width='1.1' opacity='.4' fill='none' stroke-linecap='round'/>"); }
      }
      o.push("<circle cx='" + h + "' cy='204' r='" + (aw / 2 + 0.5) + "' fill='" + u("p") + "' stroke='" + bP + "' stroke-width='1.3'/>",
        "<circle cx='" + (h + s * (aw / 2 - 1)) + "' cy='201' r='" + (aw / 5 + 0.8) + "' fill='" + u("p") + "' stroke='" + bP + "' stroke-width='1'/>",
        "<path d='M" + (h - 2.2) + ",206.5 L" + (h - 2.2) + ",208.5 M" + (h + 0.8) + ",206.8 L" + (h + 0.8) + ",208.8' stroke='" + bP + "' stroke-width='.9' opacity='.55' stroke-linecap='round'/>", "</g>");
    });
    // busto: maglia con scollo, pieghe, cuciture e orlo
    var tor = "M" + x(-he) + "," + Y + " C" + x(-he - 1) + "," + (Y - 9) + " " + x(-wa) + "," + (Y - 12) + " " + x(-wa) + ",184 C" + x(-wa) + ",175 " + x(-sh) + ",171 " + x(-sh + 1) + ",163" +
      " C" + x(-sh + 6) + ",155 86,153 100,153 C114,153 " + x(sh - 6) + ",155 " + x(sh - 1) + ",163 C" + x(sh) + ",171 " + x(wa) + ",175 " + x(wa) + ",184" +
      " C" + x(wa) + "," + (Y - 12) + " " + x(he + 1) + "," + (Y - 9) + " " + x(he) + "," + Y + " Q100," + (Y + 8) + " " + x(-he) + "," + Y + " Z";
    o.push("<path d='" + tor + "' fill='" + u("m") + "' stroke='" + bM + "' stroke-width='1.8'/>",
      "<path d='M" + x(-he + 3) + "," + (Y - 4) + " Q100," + (Y + 4) + " " + x(he - 3) + "," + (Y - 4) + "' stroke='" + tono(M, -0.25) + "' stroke-width='2' opacity='.55' fill='none'/>",
      "<path d='M" + x(-wa + 4) + ",184 Q" + x(-wa + 11) + ",190 " + x(-wa + 6) + ",197 M" + x(wa - 4) + ",184 Q" + x(wa - 11) + ",190 " + x(wa - 6) + ",197' stroke='" + bM + "' stroke-width='1.5' opacity='.3' fill='none' stroke-linecap='round'/>",
      "<path d='M" + x(-sh + 5) + ",180 Q" + x(-sh + 5) + ",168 82,161' stroke='#fff' stroke-width='4' opacity='.2' fill='none' stroke-linecap='round'/>");
    if (c.capo !== "canotta") o.push("<path d='M" + x(-sh + 9) + ",158 Q" + x(-sh + 4) + ",165 " + x(-sh + 3) + ",173 M" + x(sh - 9) + ",158 Q" + x(sh - 4) + ",165 " + x(sh - 3) + ",173' stroke='" + bM + "' stroke-width='1' opacity='.3' fill='none'/>");   // cuciture delle spalle
    // stampa sul petto (ritagliata dentro la maglia)
    var inkS = chiaro(M) ? tono(M, -0.6) : "#ffffff";
    if (c.stampa !== "nessuna" || c.capo === "calcio") {   // la maglia da calcio ha il 10 anche senza stampa
      o.push("<clipPath id='" + id + "tc'><path d='" + tor + "'/></clipPath>", "<g clip-path='" + u("tc") + "'>");
      if (c.stampa === "righe") for (var ry3 = 163; ry3 < 212; ry3 += 9) o.push("<rect x='40' y='" + ry3 + "' width='120' height='4' fill='" + inkS + "' opacity='.32'/>");
      else if (c.stampa === "stella") {
        var st5 = []; for (var k5 = 0; k5 < 10; k5++) { var r5 = k5 % 2 ? 5 : 12, a5 = (-90 + k5 * 36) * Math.PI / 180; st5.push((100 + r5 * Math.cos(a5)).toFixed(1) + "," + (182 + r5 * Math.sin(a5)).toFixed(1)); }
        o.push("<polygon points='" + st5.join(" ") + "' fill='" + inkS + "' opacity='.9' stroke-linejoin='round' stroke='" + inkS + "' stroke-width='1.5'/>");
      }
      else if (c.stampa === "fulmine") o.push("<path d='M104,168 L93,185 L100,185 L96,197 L108,179 L101,179 L105,168 Z' fill='" + u("oro") + "' stroke='#8a5209' stroke-width='1.2' stroke-linejoin='round'/>");
      else if (c.stampa === "cuore") o.push("<path d='M100,193 C87,185 87,172 94.5,172 C98,172 100,175 100,177.5 C100,175 102,172 105.5,172 C113,172 113,185 100,193 Z' fill='" + (chiaro(M) || /e03131|e64980|fd7e14/.test(M) ? "#ff3d68" : "#ff6b8b") + "' stroke='" + (/e03131|e64980/.test(M) ? "#fff" : "none") + "' stroke-width='1.6'/>",
        "<ellipse cx='95' cy='176' rx='2.6' ry='1.6' fill='#fff' opacity='.45'/>");
      else if (c.stampa === "pois") for (var py = 160, pr = 0; py < 212; py += 8, pr++) for (var pxx = 56 + (pr % 2) * 4; pxx < 146; pxx += 8) o.push("<circle cx='" + pxx + "' cy='" + py + "' r='1.9' fill='" + inkS + "' opacity='.55'/>");
      else if (c.stampa === "quadri") { for (var qx = 58; qx < 146; qx += 9) o.push("<rect x='" + qx + "' y='150' width='3.5' height='60' fill='" + inkS + "' opacity='.22'/>");
        for (var qy = 158; qy < 212; qy += 9) o.push("<rect x='50' y='" + qy + "' width='100' height='3.5' fill='" + inkS + "' opacity='.22'/>"); }
      else if (c.stampa === "smile") o.push("<circle cx='100' cy='182' r='10.5' fill='#ffd43b' stroke='#c79100' stroke-width='1.2'/>",
        "<ellipse cx='96.3' cy='179' rx='1.4' ry='2.1' fill='#3a2a00'/>", "<ellipse cx='103.7' cy='179' rx='1.4' ry='2.1' fill='#3a2a00'/>",
        "<path d='M94.5,184.5 Q100,190 105.5,184.5' stroke='#3a2a00' stroke-width='1.6' fill='none' stroke-linecap='round'/>");
      else if (c.stampa === "pallone") o.push("<circle cx='100' cy='182' r='10' fill='#fff' stroke='#222' stroke-width='1.2'/>",
        "<path d='M100,177.5 L104.3,180.6 L102.6,185.6 L97.4,185.6 L95.7,180.6 Z' fill='#222'/>",
        "<path d='M100,177.5 L100,172 M104.3,180.6 L109.5,179 M102.6,185.6 L105.8,190 M97.4,185.6 L94.2,190 M95.7,180.6 L90.5,179' stroke='#222' stroke-width='1.1'/>");
      if (c.stampa === "numero" || (c.capo === "calcio" && c.stampa === "nessuna")) o.push("<text x='100' y='193' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-weight='900' font-size='21' fill='" + inkS + "' stroke='" + (chiaro(M) ? "none" : tono(M, -0.45)) + "' stroke-width='.8'>10</text>");
      o.push("</g>");
    }
    // scollo / colletto / cappuccio secondo lo stile
    if (c.capo === "canotta") o.push("<path d='M83,154 Q100,182 117,154 Z' fill='" + u("pl") + "'/>",
      "<path d='M83,154 Q100,182 117,154' stroke='" + tono(M, -0.2) + "' stroke-width='2.4' fill='none'/>");
    else if (c.capo === "camicia") {
      o.push("<path d='M85,155 Q100,168 115,155 Q100,162 85,155 Z' fill='" + tono(M, -0.4) + "'/>",
        "<path d='M100,160 L100," + (Y - 3) + "' stroke='" + bM + "' stroke-width='1.3' opacity='.45'/>");
      [170, 182, 194].forEach(function (by) { o.push("<circle cx='100' cy='" + by + "' r='1.7' fill='" + tono(M, 0.55) + "' stroke='" + bM + "' stroke-width='.5'/>"); });
      o.push("<path d='M84,153 L94,168 L100,158 Z' fill='" + tono(M, 0.3) + "' stroke='" + bM + "' stroke-width='1.2' stroke-linejoin='round'/>",
        "<path d='M116,153 L106,168 L100,158 Z' fill='" + tono(M, 0.2) + "' stroke='" + bM + "' stroke-width='1.2' stroke-linejoin='round'/>");
      if (!opts.busto && sotto !== "gonna") o.push(   // camicia infilata: si vede la cintura
        "<path d='M" + x(-he + 0.5) + "," + (Y - 3) + " Q100," + (Y + 3) + " " + x(he - 0.5) + "," + (Y - 3) + " L" + x(he - 0.5) + "," + (Y + 3) + " Q100," + (Y + 9) + " " + x(-he + 0.5) + "," + (Y + 3) + " Z' fill='#3b2a1e' stroke='#1e140c' stroke-width='1'/>",
        "<rect x='94' y='" + (Y + 0.5) + "' width='12' height='8' rx='1.5' fill='none' stroke='" + u("oro") + "' stroke-width='2'/>",
        "<path d='M97," + (Y + 4.5) + " L103," + (Y + 4.5) + "' stroke='#c9a227' stroke-width='1.3'/>");
    }
    else if (c.capo === "polo") o.push("<path d='M85,155 Q100,168 115,155 Q100,162 85,155 Z' fill='" + tono(M, -0.4) + "'/>",
      "<path d='M100,159 L100,176' stroke='" + bM + "' stroke-width='1.2' opacity='.5'/>",
      "<circle cx='100' cy='166' r='1.5' fill='" + tono(M, 0.5) + "'/>", "<circle cx='100' cy='172' r='1.5' fill='" + tono(M, 0.5) + "'/>",
      "<path d='M84,153 Q90,164 97,162 L100,158 Z' fill='" + tono(M, 0.2) + "' stroke='" + bM + "' stroke-width='1.1' stroke-linejoin='round'/>",
      "<path d='M116,153 Q110,164 103,162 L100,158 Z' fill='" + tono(M, 0.12) + "' stroke='" + bM + "' stroke-width='1.1' stroke-linejoin='round'/>");
    else if (c.capo === "giacca") {   // giacca aperta sopra la camicia bianca
      o.push("<path d='M86,154 L100,194 L114,154 Z' fill='#f4f4f6'/>", "<path d='M95,157 L100,166 L105,157' stroke='#c9c9d0' stroke-width='1' fill='none'/>",
        "<path d='M86,154 L100,194 L93,186 L81,164 Z' fill='" + tono(M, 0.14) + "' stroke='" + bM + "' stroke-width='1.2' stroke-linejoin='round'/>",
        "<path d='M114,154 L100,194 L107,186 L119,164 Z' fill='" + tono(M, 0.06) + "' stroke='" + bM + "' stroke-width='1.2' stroke-linejoin='round'/>",
        "<path d='M100,194 L100," + (Y + 2) + "' stroke='" + bM + "' stroke-width='1.3'/>", "<circle cx='103' cy='197' r='1.8' fill='" + tono(M, -0.3) + "'/>",
        "<path d='M" + x(sh - 14) + ",176 L" + x(sh - 5) + ",175' stroke='" + bM + "' stroke-width='1.4' opacity='.6'/>",
        "<path d='M" + x(sh - 13) + ",175.5 L" + x(sh - 12) + ",172 L" + x(sh - 9) + ",173.5 L" + x(sh - 7) + ",171.5 L" + x(sh - 6) + ",175' fill='#fff' opacity='.85'/>");   // fazzoletto nel taschino
    }
    else if (c.capo === "bomber") {   // colletto e fondo a costine, zip, tasche oblique
      o.push("<path d='M84,155 Q100,168 116,155 L116,160 Q100,172 84,160 Z' fill='" + tono(M, -0.35) + "'/>",
        "<path d='M88,158 L88,163 M92,160 L92,166 M96,161 L96,168 M104,161 L104,168 M108,160 L108,166 M112,158 L112,163' stroke='" + tono(M, -0.55) + "' stroke-width='1' opacity='.5'/>",
        "<path d='M100,164 L100," + (Y - 3) + "' stroke='#c9c9d0' stroke-width='1.8'/>", "<path d='M100,164 L100," + (Y - 3) + "' stroke='#6b6b73' stroke-width='1.8' stroke-dasharray='1 1.2'/>",
        "<rect x='98.3' y='172' width='3.4' height='6' rx='1' fill='#d8d8e0' stroke='#6b6b73' stroke-width='.6'/>",
        "<path d='M" + x(-he + 1.5) + "," + (Y - 5) + " Q100," + (Y + 3) + " " + x(he - 1.5) + "," + (Y - 5) + "' stroke='" + tono(M, -0.35) + "' stroke-width='5' fill='none'/>",
        "<path d='M" + x(-wa + 6) + ",178 L" + x(-wa + 12) + ",192 M" + x(wa - 6) + ",178 L" + x(wa - 12) + ",192' stroke='" + bM + "' stroke-width='1.6' opacity='.55'/>");
    }
    else if (c.capo === "dolcevita") o.push("<path d='M" + x(-sh + 5) + ",182 Q" + x(-sh + 6) + ",170 82,164' stroke='#fff' stroke-width='3' opacity='.08' fill='none'/>");   // il collo alto si disegna sopra al collo
    else if (c.capo === "calcio") {   // scollo a V con bordino e bande laterali
      var bord = chiaro(M) ? tono(M, -0.5) : "#ffffff";
      o.push("<path d='M86,155 L100,172 L114,155 Q100,160 86,155 Z' fill='" + tono(M, -0.4) + "'/>",
        "<path d='M85,155 L100,173 L115,155' stroke='" + bord + "' stroke-width='2.4' fill='none' stroke-linejoin='round'/>",
        "<path d='M" + x(-sh + 3) + ",170 C" + x(-wa + 1) + ",184 " + x(-wa + 1) + ",190 " + x(-he + 2) + "," + (Y - 2) + " M" + x(sh - 3) + ",170 C" + x(wa - 1) + ",184 " + x(wa - 1) + ",190 " + x(he - 2) + "," + (Y - 2) + "' stroke='" + bord + "' stroke-width='3' fill='none' opacity='.85'/>");
    }
    else {
      o.push("<path d='M85,155 Q100,171 115,155 Q100,163 85,155 Z' fill='" + tono(M, -0.4) + "'/>",
        "<path d='M84,155.5 Q100,172 116,155.5' stroke='" + tono(M, 0.2) + "' stroke-width='2.2' fill='none' stroke-linecap='round' opacity='.8'/>");
      if (c.capo === "felpa") o.push("<path d='M" + x(-wa + 8) + ",184 L" + x(wa - 8) + ",184 Q" + x(wa - 4) + ",193 " + x(wa - 9) + ",197 L" + x(-wa + 9) + ",197 Q" + x(-wa + 4) + ",193 " + x(-wa + 8) + ",184 Z' fill='" + tono(M, -0.1) + "' stroke='" + bM + "' stroke-width='1.2' opacity='.9'/>",
        "<path d='M" + x(-wa + 9) + ",185.5 L" + x(wa - 9) + ",185.5' stroke='#fff' stroke-width='1.2' opacity='.25'/>",
        "<path d='M93,163 L92,178 M107,163 L108,178' stroke='" + tono(M, 0.55) + "' stroke-width='1.6' stroke-linecap='round'/>",
        "<circle cx='92' cy='179.5' r='1.8' fill='" + tono(M, 0.6) + "'/>", "<circle cx='108' cy='179.5' r='1.8' fill='" + tono(M, 0.6) + "'/>",
        "<path d='M" + x(-he + 2) + "," + (Y - 5) + " Q100," + (Y + 3) + " " + x(he - 2) + "," + (Y - 5) + "' stroke='" + tono(M, -0.3) + "' stroke-width='3.5' opacity='.45' fill='none'/>");   // elastico in fondo
    }
    if (donna) o.push("<path d='M" + x(-sh + 9) + ",178 Q88,184 97,179 M103,179 Q112,184 " + x(sh - 9) + ",178' stroke='" + bM + "' stroke-width='2' opacity='.32' fill='none' stroke-linecap='round'/>");
    // cappuccio della felpa: poggiato sulle spalle, dietro al collo
    if (c.capo === "felpa") o.push("<path d='M74,160 C68,144 82,134 100,134 C118,134 132,144 126,160 C116,151 84,151 74,160 Z' fill='" + u("m") + "' stroke='" + bM + "' stroke-width='1.6'/>",
      "<path d='M80,155 C80,146 90,140 100,140 C110,140 120,146 120,155' stroke='" + tono(M, -0.35) + "' stroke-width='3' fill='none' opacity='.6'/>");
    // collo con ombra morbida del mento
    o.push("<rect x='88' y='134' width='24' height='24' rx='7' fill='" + u("pl") + "'/>",
      "<ellipse cx='100' cy='143' rx='22' ry='10' fill='" + u("ao") + "'/>");
    if (c.capo === "dolcevita") o.push("<path d='M84,160 L85,138 Q100,133 115,138 L116,160 Q100,165 84,160 Z' fill='" + u("m") + "' stroke='" + bM + "' stroke-width='1.5'/>",
      "<path d='M86,145 Q100,141 114,145 M86,151 Q100,147 114,151 M85,156 Q100,152 115,156' stroke='" + bM + "' stroke-width='1.1' opacity='.4' fill='none'/>");
    // ---------- al collo ----------
    var cl = c.collo;
    if (cl === "sciarpa") o.push("<path d='M79,149 Q100,160 121,149 L123,162 Q100,173 77,162 Z' fill='" + u("cc") + "' stroke='" + bC + "' stroke-width='1.5' stroke-linejoin='round'/>",
      "<path d='M104,164 L111,197 L101,199 L97,166 Z' fill='" + u("cc") + "' stroke='" + bC + "' stroke-width='1.5' stroke-linejoin='round'/>",
      "<path d='M82,155 Q100,165 118,155 M99.5,176 L108,174.5 M100.5,186 L109.5,184.5' stroke='" + tono(CC, 0.4) + "' stroke-width='2' opacity='.6' fill='none'/>",
      "<path d='M102,199 l-1,4 M105,198.6 l0,4.4 M108,198.2 l1,4' stroke='" + bC + "' stroke-width='1.4' stroke-linecap='round'/>");
    if (cl === "collana") o.push("<path d='M86,155 Q100,178 114,155' stroke='" + u("oro") + "' stroke-width='1.8' stroke-dasharray='1.8 .9' fill='none'/>",
      "<circle cx='100' cy='168.5' r='3.4' fill='" + u("oro") + "' stroke='#a8740b' stroke-width='.8'/>", "<circle cx='99' cy='167.5' r='.9' fill='#fff' opacity='.7'/>");
    if (cl === "perle") for (var pi = 0; pi <= 12; pi++) {   // perle lungo una curva
      var tt = pi / 12, qx = (1 - tt) * (1 - tt) * 85 + 2 * (1 - tt) * tt * 100 + tt * tt * 115, qy = (1 - tt) * (1 - tt) * 155 + 2 * (1 - tt) * tt * 178 + tt * tt * 155;
      o.push("<circle cx='" + qx.toFixed(1) + "' cy='" + qy.toFixed(1) + "' r='2.1' fill='#f8f4ee' stroke='#cfc6b8' stroke-width='.6'/>", "<circle cx='" + (qx - 0.6).toFixed(1) + "' cy='" + (qy - 0.7).toFixed(1) + "' r='.6' fill='#fff'/>");
    }
    if (cl === "papillon") o.push("<path d='M100,160 L87,152.5 Q85,160 87,167.5 Z M100,160 L113,152.5 Q115,160 113,167.5 Z' fill='" + u("cc") + "' stroke='" + bC + "' stroke-width='1.3' stroke-linejoin='round'/>",
      "<rect x='96.5' y='156.5' width='7' height='7' rx='2' fill='" + tono(CC, -0.15) + "' stroke='" + bC + "' stroke-width='1'/>");
    if (cl === "cravatta") o.push("<path d='M96,155 L104,155 L102.5,162 L97.5,162 Z' fill='" + tono(CC, -0.1) + "' stroke='" + bC + "' stroke-width='1.1' stroke-linejoin='round'/>",
      "<path d='M97.5,162 L102.5,162 L107,190 L100,198 L93,190 Z' fill='" + u("cc") + "' stroke='" + bC + "' stroke-width='1.2' stroke-linejoin='round'/>",
      "<path d='M96,172 L104,168 M95,181 L105.5,176 M94.5,190 L106,185' stroke='" + tono(CC, 0.45) + "' stroke-width='1.5' opacity='.55'/>");
    if (cl === "bandana") o.push("<path d='M81,153 Q100,163 119,153 L100,180 Z' fill='" + u("cc") + "' stroke='" + bC + "' stroke-width='1.4' stroke-linejoin='round'/>",
      "<circle cx='94' cy='162' r='1.2' fill='#fff' opacity='.8'/>", "<circle cx='106' cy='162' r='1.2' fill='#fff' opacity='.8'/>", "<circle cx='100' cy='170' r='1.2' fill='#fff' opacity='.8'/>",
      "<path d='M86,158 Q100,166 114,158' stroke='#fff' stroke-width='1' stroke-dasharray='1.5 1.5' opacity='.6' fill='none'/>");

    // ---------- testa ----------
    o.push(gT);   // testa, viso, capelli davanti e accessori: tutti nella stessa scala
    var ore = c.orecchie, dxO = c.viso === "paffuto" ? -4 : (c.viso === "lungo" ? 3 : 0);   // le orecchie seguono la larghezza del viso
    [47, 153].forEach(function (ex0) {
      var s = ex0 < 100 ? -1 : 1, ex = ex0 - s * dxO;
      if (ore === "punta") {   // orecchie a punta, da elfo
        o.push("<path d='M" + (ex - s * 3) + ",90 Q" + (ex + s * 8) + ",74 " + (ex + s * 17) + ",68 Q" + (ex + s * 13) + ",90 " + (ex + s * 5) + ",106 Q" + (ex - s * 1) + ",110 " + (ex - s * 4) + ",102 Z' fill='" + u("p") + "' stroke='" + bP + "' stroke-width='1.4' stroke-linejoin='round'/>",
          "<path d='M" + (ex + s * 1) + ",94 Q" + (ex + s * 8) + ",82 " + (ex + s * 12) + ",78' stroke='" + tono(P, -0.3) + "' stroke-width='1.8' fill='none' stroke-linecap='round'/>");
        return;
      }
      var rO = ore === "piccole" ? 7.5 : (ore === "grandi" ? 13 : 10), xO = ex + s * (ore === "grandi" ? 3 : (ore === "piccole" ? -1.5 : 0));
      o.push("<ellipse cx='" + xO + "' cy='99' rx='" + rO + "' ry='" + (rO * (ore === "grandi" ? 1.12 : 1)) + "' fill='" + u("p") + "' stroke='" + bP + "' stroke-width='1.4'/>",
        "<path d='M" + (xO - s * 2) + "," + (99 - rO * 0.6) + " Q" + (xO + s * rO * 0.4) + ",99 " + (xO - s * 1) + "," + (99 + rO * 0.6) + "' stroke='" + tono(P, -0.3) + "' stroke-width='2' fill='none' stroke-linecap='round'/>");
    });
    o.push("<path d='" + testa + "' fill='" + u("p") + "' stroke='" + bP + "' stroke-width='1.6'/>");
    // dentro la testa: ombra dei capelli sulla fronte, luce di bordo, lucido della guancia
    o.push("<g clip-path='" + u("cv") + "'>");
    var sfoca = opts.hd ? " filter='" + u("sf") + "'" : "";   // ombre sfocate solo nell'anteprima grande
    if (cappello) o.push("<path transform='translate(0," + (LINEA - 73) + ")' d='M36,78 Q100,66 164,78 L164,94 Q100,80 36,94 Z' fill='" + tono(P, -0.55) + "' opacity='" + (opts.hd ? 0.3 : 0.2) + "'" + sfoca + "/>");   // ombra della visiera
    else if (fr) o.push("<path d='" + fr + "' transform='translate(0,5)' fill='" + tono(P, -0.5) + "' opacity='" + (opts.hd ? 0.3 : 0.2) + "'" + sfoca + "/>");
    o.push("<path d='M57,70 Q47,94 55,120' stroke='#fff' stroke-width='3' opacity='.2' fill='none' stroke-linecap='round'/>",
      "<path d='M147,68 Q156,94 147,124' stroke='#bfe0ff' stroke-width='3.5' opacity='.22' fill='none' stroke-linecap='round'/>",   // luce fredda di bordo
      "<ellipse cx='72' cy='104' rx='11' ry='7' fill='" + u("lu") + "' opacity='.35'/>");
    if (tipo === "calvo" || tipo === "cresta" || tipo === "rasato" || tipo === "chierica") o.push("<ellipse cx='78' cy='55' rx='17' ry='9' fill='" + u("lu") + "' opacity='.6' transform='rotate(-25 78 55)'/>");
    if (tipo === "rasato") o.push("<path d='" + FRONTE.corti + "' fill='" + H + "' opacity='.42'/>", "<path d='" + FRONTE.corti + "' fill='" + u("pt") + "' opacity='.75'/>");
    if (opts.hd) o.push("<ellipse cx='100' cy='119' rx='7' ry='2.4' fill='" + tono(P, -0.6) + "' opacity='.28' filter='" + u("sf") + "'/>");   // ombra sotto il naso
    o.push("</g>");

    // guance (a scelta)
    if (c.guance === "leggere" || c.guance === "rosse" || c.guance === "lentiggini") {
      var og = c.guance === "rosse" ? 1 : (c.guance === "leggere" ? 0.55 : 0.35);
      o.push("<ellipse cx='70' cy='117' rx='13' ry='8.5' fill='" + u("g") + "' opacity='" + og + "'/>", "<ellipse cx='130' cy='117' rx='13' ry='8.5' fill='" + u("g") + "' opacity='" + og + "'/>");
    }
    if (c.guance === "lentiggini") {
      [[63, 111], [68, 115], [72, 110], [60, 117], [76, 114], [67, 120], [137, 111], [132, 115], [128, 110], [140, 117], [124, 114], [133, 120], [95, 109], [105, 109], [100, 106]].forEach(function (p) {
        o.push("<circle cx='" + p[0] + "' cy='" + p[1] + "' r='.95' fill='" + tono(P, -0.45) + "' opacity='.65'/>");
      });
    }

    // segni particolari
    if (c.segno === "neo") o.push("<circle cx='127' cy='123' r='1.7' fill='#4a2a1a'/>", "<circle cx='126.5' cy='122.5' r='.5' fill='#fff' opacity='.35'/>");
    if (c.segno === "cicatrice") o.push("<path d='M71,75 L80,93' stroke='" + tono(P, -0.32) + "' stroke-width='2.2' stroke-linecap='round'/>",
      "<path d='M73,79 l4,-1.5 M75,83.5 l4,-1.5 M77,88 l4,-1.5' stroke='" + tono(P, -0.32) + "' stroke-width='1.2' stroke-linecap='round'/>");
    if (c.segno === "cerotto") o.push("<g transform='rotate(-24 131 118)'><rect x='121' y='114.5' width='20' height='7.5' rx='3.5' fill='#f2c9a0' stroke='#cf9f72' stroke-width='.9'/>",
      "<rect x='127.5' y='114.5' width='7' height='7.5' fill='#e8b88a'/>", "<circle cx='129.5' cy='117' r='.5' fill='#b9875a'/>", "<circle cx='132.5' cy='119.5' r='.5' fill='#b9875a'/></g>");
    if (c.segno === "voglia") o.push("<path d='M129,104 Q134,100 138,104 Q141,108 136,110 Q131,112 128,108 Q126,106 129,104 Z' fill='" + tono(P, -0.28) + "' opacity='.55'/>");
    if (c.segno === "stellina") o.push("<path d='M70,114 L71.6,118 L75.8,118.2 L72.5,120.8 L73.7,124.8 L70,122.4 L66.3,124.8 L67.5,120.8 L64.2,118.2 L68.4,118 Z' fill='#4dabf7' stroke='#1c6fb8' stroke-width='.7' stroke-linejoin='round'/>");
    if (c.segno === "rughe") o.push("<path d='M84,67 Q100,63 116,67 M88,72 Q100,69 112,72' stroke='" + tono(P, -0.32) + "' stroke-width='1.2' opacity='.55' fill='none' stroke-linecap='round'/>",
      "<path d='M60,103 Q58,107 60,111 M140,103 Q142,107 140,111' stroke='" + tono(P, -0.3) + "' stroke-width='1' opacity='.45' fill='none'/>");

    // ---------- occhi ----------
    var scuro = "#2a1a12";
    // regolazioni fini stile Mii: grandezza/distanza/altezza occhi, altezza sopracciglia, naso, bocca
    function reg(k) { var v = +c[k] || 0; return Math.max(-2, Math.min(2, v)); }
    var kE = 1 + 0.08 * reg("occG"), dE = 2.6 * reg("occD"), yE = -2.6 * reg("occA"), yS = yE - 2.4 * reg("soprA"),
        kN = 1 + 0.15 * reg("nasoG"), yB = -2.6 * reg("boccaA");
    var ombretto = c.trucco === "ombretto" || c.trucco === "completo", eyeliner = c.trucco === "eyeliner" || c.trucco === "completo",
        rossetto = c.trucco === "rossetto" || c.trucco === "completo", CT = col(OPZ.colTrucco, c.colTrucco);
    o.push("<g class='om-occhi'>");   // gruppo a parte: nell'editor sbatte le palpebre
    [80, 120].forEach(function (ex) {
      var s = ex < 100 ? -1 : 1;
      o.push("<g transform='translate(" + (ex + s * dE) + "," + (100 + yE) + ") scale(" + kE + ") translate(" + (-ex) + ",-100)'>");
      if (ombretto) o.push("<ellipse cx='" + ex + "' cy='95' rx='12.5' ry='8' fill='" + u("tr") + "'/>");
      if (c.occhi === "puntini") {   // occhi semplici a puntino, stile Mii classico
        o.push("<ellipse cx='" + ex + "' cy='100' rx='4.3' ry='5.8' fill='#1c1410'/>", "<circle cx='" + (ex + 1.4) + "' cy='97.8' r='1.5' fill='#fff'/>");
        if (donna) o.push("<path d='M" + (ex + s * 4) + ",96 L" + (ex + s * 7.5) + ",93' stroke='" + scuro + "' stroke-width='1.8' stroke-linecap='round'/>");
        o.push("</g>");
        return;
      }
      // occhi chiusi (anche l'occhio destro dell'occhiolino): una curva rilassata all'ingiù
      if (c.occhi === "chiusi" || (c.occhi === "occhiolino" && ex === 120)) {
        o.push("<path d='M" + (ex - 8.5) + ",99 Q" + ex + ",106 " + (ex + 8.5) + ",99' stroke='" + scuro + "' stroke-width='2.8' fill='none' stroke-linecap='round'/>");
        if (donna) o.push("<path d='M" + (ex + s * 8) + ",100 L" + (ex + s * 11.5) + ",102.5' stroke='" + scuro + "' stroke-width='1.8' stroke-linecap='round'/>");
        o.push("</g>");
        return;
      }
      if (c.occhi === "felici") {
        o.push("<path d='M" + (ex - 8.5) + ",103 Q" + ex + ",92 " + (ex + 8.5) + ",103 Q" + ex + ",96 " + (ex - 8.5) + ",103 Z' fill='" + scuro + "' stroke='" + scuro + "' stroke-width='1.6' stroke-linejoin='round'/>");
        if (donna) o.push("<path d='M" + (ex + s * 8) + ",101 L" + (ex + s * 12) + ",98' stroke='" + scuro + "' stroke-width='2' stroke-linecap='round'/>");
        o.push("</g>");
        return;
      }
      var felino = c.occhi === "felini", big = c.occhi === "grandi" || c.occhi === "ciglia", mand = c.occhi === "mandorla" || felino,
          rx = big ? 10 : (mand ? 9.5 : 8), ry = big ? 12 : (mand ? 7 : 10), ri = big ? 7.2 : (mand ? 5.3 : 5.8), cy = 100;
      var giro = mand ? s * -9 : (c.occhi === "tristi" ? s * 12 : 0);   // mandorla: angolo esterno all'insù; tristi: all'ingiù
      if (giro) o.push("<g transform='rotate(" + giro + " " + ex + " 100)'>");
      o.push("<clipPath id='" + id + "e" + ex + "'><ellipse cx='" + ex + "' cy='" + cy + "' rx='" + rx + "' ry='" + ry + "'/></clipPath>",
        "<ellipse cx='" + ex + "' cy='" + cy + "' rx='" + rx + "' ry='" + ry + "' fill='" + u("sc") + "' stroke='" + tono(P, -0.45) + "' stroke-width='.8'/>",
        "<g clip-path='" + u("e" + ex) + "'>",
        "<circle cx='" + (ex + s * 0.5) + "' cy='" + (cy + 1.5) + "' r='" + ri + "' fill='" + u("i") + "' stroke='" + tono(I, -0.6) + "' stroke-width='.9'/>",
        felino ? "<ellipse cx='" + (ex + s * 0.5) + "' cy='" + (cy + 1) + "' rx='" + (ri * 0.2) + "' ry='" + (ri * 0.95) + "' fill='#0c0c0e'/>"   // pupilla a fessura
               : "<circle cx='" + (ex + s * 0.5) + "' cy='" + (cy + 1.5) + "' r='" + (ri * 0.48) + "' fill='#0c0c0e'/>",
        "<ellipse cx='" + ex + "' cy='" + (cy - ry + 1) + "' rx='" + rx + "' ry='3.5' fill='#000' opacity='.12'/>",
        "</g>",
        c.occhi === "stelline"   // luccicanti: il riflesso è una stellina
          ? "<path d='M" + (ex + 2.6) + "," + (cy - 7.4) + " Q" + (ex + 3.2) + "," + (cy - 3) + " " + (ex + 7.6) + "," + (cy - 2.4) + " Q" + (ex + 3.2) + "," + (cy - 1.8) + " " + (ex + 2.6) + "," + (cy + 2.6) + " Q" + (ex + 2) + "," + (cy - 1.8) + " " + (ex - 2.4) + "," + (cy - 2.4) + " Q" + (ex + 2) + "," + (cy - 3) + " " + (ex + 2.6) + "," + (cy - 7.4) + " Z' fill='#fff'/>"
          : "<circle cx='" + (ex + 2.6) + "' cy='" + (cy - 2.4) + "' r='" + (big ? 2.8 : 2.2) + "' fill='#fff'/>",
        "<circle cx='" + (ex - 2) + "' cy='" + (cy + 4.5) + "' r='1.1' fill='#fff' opacity='.8'/>",
        "<path d='M" + (ex - rx - 0.6) + "," + (cy + 1) + " Q" + ex + "," + (cy - 2 * ry) + " " + (ex + rx + 0.6) + "," + (cy + 1) + "' stroke='" + scuro + "' stroke-width='" + (c.occhi === "dolci" || eyeliner ? 3.4 : 2.3) + "' fill='none' stroke-linecap='round'/>");
      if (eyeliner) o.push("<path d='M" + (ex + s * (rx + 0.2)) + "," + (cy + 0.5) + " L" + (ex + s * (rx + 6)) + "," + (cy - 4.5) + "' stroke='" + scuro + "' stroke-width='2.6' stroke-linecap='round'/>");   // codina dell'eyeliner
      if (donna || c.occhi === "dolci") o.push("<path d='M" + (ex + s * 6) + ",92.5 L" + (ex + s * 10.5) + ",88.5 M" + (ex + s * 8.5) + ",95.5 L" + (ex + s * 13) + ",93' stroke='" + scuro + "' stroke-width='2' stroke-linecap='round'/>");
      if (c.occhi === "furbi") o.push("<path d='M" + (ex - rx - 1) + "," + (cy + 1) + " Q" + ex + "," + (cy - 2 * ry) + " " + (ex + rx + 1) + "," + (cy + 1) + " Z' fill='" + u("p") + "'/>",
        "<path d='M" + (ex - rx - 1) + "," + (cy + 1) + " L" + (ex + rx + 1) + "," + cy + "' stroke='" + scuro + "' stroke-width='2.8' stroke-linecap='round'/>");
      else if (c.occhi === "assonnati") o.push("<path d='M" + (ex - rx - 1) + "," + (cy + 0.5) + " Q" + ex + "," + (cy - 2 * ry) + " " + (ex + rx + 1) + "," + (cy + 0.5) + " L" + (ex + rx + 1) + "," + (cy - 1) + " Q" + ex + "," + (cy + 2.5) + " " + (ex - rx - 1) + "," + (cy - 1) + " Z' fill='" + u("p") + "'/>",
        "<path d='M" + (ex - rx - 1) + "," + (cy - 1) + " Q" + ex + "," + (cy + 2.5) + " " + (ex + rx + 1) + "," + (cy - 1) + "' stroke='" + scuro + "' stroke-width='2.4' fill='none' stroke-linecap='round'/>");
      else o.push("<path d='M" + (ex - rx + 1.5) + "," + (cy + ry - 1.5) + " Q" + ex + "," + (cy + ry + 2.5) + " " + (ex + rx - 1.5) + "," + (cy + ry - 1.5) + "' stroke='" + tono(P, -0.4) + "' stroke-width='1.1' opacity='.45' fill='none' stroke-linecap='round'/>");
      if (c.occhi === "ciglia") [0, 1, 2].forEach(function (k) {   // ciglia lunghe sulla palpebra, verso l'esterno
        var dx = rx - 1.5 - k * 3.2, px = ex + s * dx, py = cy - ry * Math.sqrt(Math.max(0, 1 - (dx / rx) * (dx / rx)));   // punto sul bordo alto dell'occhio
        o.push("<path d='M" + px.toFixed(1) + "," + py.toFixed(1) + " l" + (s * 4.5) + ",-" + (4.5 - k * 0.6) + "' stroke='" + scuro + "' stroke-width='1.9' stroke-linecap='round'/>");
      });
      if (c.occhi === "tristi") o.push("<path d='M" + (ex - rx - 1) + "," + (cy - 3) + " Q" + ex + "," + (cy - ry - 3) + " " + (ex + rx + 1) + "," + (cy - 3) + " L" + (ex + rx + 1) + "," + (cy - ry - 6) + " L" + (ex - rx - 1) + "," + (cy - ry - 6) + " Z' fill='" + u("p") + "'/>",
        "<path d='M" + (ex - rx - 1) + "," + (cy - 3) + " Q" + ex + "," + (cy - ry - 3) + " " + (ex + rx + 1) + "," + (cy - 3) + "' stroke='" + scuro + "' stroke-width='2.4' fill='none' stroke-linecap='round'/>");   // palpebra un po' calata
      if (giro) o.push("</g>");
      if (c.segno === "occhiaie") o.push("<path d='M" + (ex - 8) + "," + (cy + ry + 1.5) + " Q" + ex + "," + (cy + ry + 6) + " " + (ex + 8) + "," + (cy + ry + 1.5) + "' stroke='#7a5a8a' stroke-width='2.2' opacity='.35' fill='none' stroke-linecap='round'/>");
      o.push("</g>");
    });
    o.push("</g>");
    // sopracciglia a forma (più spesse verso il naso, sottili verso l'esterno)
    var colS = tipo === "calvo" ? "#4b2f1d" : tono(H, -0.25);
    o.push("<g transform='translate(0," + yS + ")'>");
    [80, 120].forEach(function (ex) {
      var s = ex < 100 ? -1 : 1, est = ex + s * 11, int = ex - s * 9, t = c.sopracc, yE, yI, cyb, sp;
      if (t === "decise") { yE = 80; yI = 85; cyb = 80; sp = 5.2; }
      else if (t === "alzate") { yE = 83; yI = 79; cyb = 72; sp = 4; }
      else if (t === "sottili") { yE = 84; yI = 83; cyb = 77; sp = 2.2; }
      else if (t === "folte") { yE = 84; yI = 83; cyb = 76; sp = 6.8; }
      else if (t === "arcuate") { yE = 87; yI = 84; cyb = 69; sp = 3.4; }
      else if (t === "preoccupate") { yE = 86; yI = 78; cyb = 81; sp = 4.2; }
      else if (t === "dritte") { yE = 83; yI = 83; cyb = 82.5; sp = 4.8; }
      else if (t === "unite") { yE = 84; yI = 83.5; cyb = 78; sp = 5.6; int = ex - s * 12; }
      else if (t === "fini") { yE = 86; yI = 84; cyb = 71; sp = 1.7; }
      else if (t === "arrabbiate") { yE = 78; yI = 88; cyb = 82; sp = 4.8; }
      else { yE = 85; yI = 83; cyb = 77.5; sp = 4.2; }
      o.push("<path transform='translate(" + (s * dE) + ",0)' d='M" + est + "," + yE + " Q" + ex + "," + cyb + " " + int + "," + yI + " L" + int + "," + (yI + sp) + " Q" + ex + "," + (cyb + sp * 0.85) + " " + est + "," + (yE + sp * 0.35) + " Z' fill='" + colS + "' stroke='" + colS + "' stroke-width='.9' stroke-linejoin='round'/>");
      if (t === "tagliate" && s < 0) o.push("<path d='M" + (ex - 4 - dE) + ",76 L" + (ex - 6 - dE) + ",90' stroke='" + P + "' stroke-width='2.2' stroke-linecap='round'/>");   // il taglio nel sopracciglio
    });
    if (c.sopracc === "unite") o.push("<path d='M91,84 Q100,82 109,84 L109,88 Q100,86.5 91,88 Z' fill='" + colS + "' opacity='.85'/>");   // il ponte in mezzo
    o.push("</g>");
    // naso
    var nas = tono(P, -0.36);
    o.push("<g transform='translate(100,112) scale(" + kN + ") translate(-100,-112)'>");
    if (c.naso === "tondo") o.push("<ellipse cx='100' cy='112.5' rx='6.5' ry='5' fill='" + tono(P, -0.07) + "' stroke='" + tono(P, -0.25) + "' stroke-width='.8'/>",
      "<ellipse cx='97.3' cy='115' rx='1.4' ry='1' fill='" + nas + "'/>", "<ellipse cx='102.7' cy='115' rx='1.4' ry='1' fill='" + nas + "'/>", "<circle cx='98' cy='110.5' r='1.8' fill='#fff' opacity='.45'/>");
    else if (c.naso === "punta") o.push("<path d='M100,102 Q107.5,113 98,117' stroke='" + nas + "' stroke-width='2.3' fill='none' stroke-linecap='round'/>", "<circle cx='101' cy='110' r='1.6' fill='#fff' opacity='.4'/>");
    else if (c.naso === "largo") o.push("<path d='M92,114 Q100,119.5 108,114' stroke='" + nas + "' stroke-width='2.2' fill='none' stroke-linecap='round'/>",
      "<path d='M91.5,110.5 Q88.5,114 92,117 M108.5,110.5 Q111.5,114 108,117' stroke='" + nas + "' stroke-width='1.6' fill='none' opacity='.7' stroke-linecap='round'/>",
      "<ellipse cx='96' cy='115' rx='1.5' ry='1' fill='" + nas + "'/>", "<ellipse cx='104' cy='115' rx='1.5' ry='1' fill='" + nas + "'/>", "<circle cx='99' cy='110' r='1.9' fill='#fff' opacity='.4'/>");
    else if (c.naso === "insu") o.push("<path d='M95.5,113.5 Q100,111 104.5,113.5' stroke='" + nas + "' stroke-width='1.8' fill='none' stroke-linecap='round'/>",
      "<ellipse cx='97.8' cy='114.6' rx='1.3' ry='1' fill='" + nas + "'/>", "<ellipse cx='102.2' cy='114.6' rx='1.3' ry='1' fill='" + nas + "'/>", "<circle cx='99.5' cy='109.5' r='1.7' fill='#fff' opacity='.45'/>");
    else if (c.naso === "aquilino") o.push("<path d='M99,99 Q104,104 106.5,111 Q108.5,117 100.5,117.5' stroke='" + nas + "' stroke-width='2.3' fill='none' stroke-linecap='round'/>",
      "<ellipse cx='102.5' cy='116' rx='1.4' ry='.9' fill='" + nas + "'/>", "<circle cx='103' cy='108' r='1.6' fill='#fff' opacity='.4'/>");
    else if (c.naso === "puntino") o.push("<ellipse cx='100' cy='113' rx='2.2' ry='1.7' fill='" + nas + "'/>");
    else if (c.naso === "patata") o.push("<ellipse cx='100' cy='112' rx='9' ry='7' fill='" + tono(P, -0.08) + "' stroke='" + tono(P, -0.28) + "' stroke-width='.9'/>",
      "<ellipse cx='96.3' cy='115.5' rx='1.7' ry='1.2' fill='" + nas + "'/>", "<ellipse cx='103.7' cy='115.5' rx='1.7' ry='1.2' fill='" + nas + "'/>", "<ellipse cx='97' cy='109' rx='2.6' ry='1.8' fill='#fff' opacity='.45'/>");
    else if (c.naso === "lungo") o.push("<path d='M100,97 L102,114 Q102.5,119 96,118' stroke='" + nas + "' stroke-width='2.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/>", "<circle cx='101.5' cy='112' r='1.5' fill='#fff' opacity='.4'/>");
    else if (c.naso === "dritto") o.push("<path d='M97,99 L96,114 Q100,117.5 104.5,114.5' stroke='" + nas + "' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/>", "<path d='M99,101 L99,110' stroke='#fff' stroke-width='1.6' opacity='.3' stroke-linecap='round'/>");
    else o.push("<path d='M95.5,114 Q100,117.5 104.5,114' stroke='" + nas + "' stroke-width='2.2' fill='none' stroke-linecap='round'/>", "<circle cx='99' cy='110.5' r='1.7' fill='#fff' opacity='.4'/>");
    o.push("</g>");

    // barba: prima della bocca (la bocca resta sopra), baffi dopo
    var conBarba = /^(corta|folta|barbalunga|collare|ancora)$/.test(c.barba), conPizz = c.barba === "pizzetto" || c.barba === "baffipizzetto", fondoB = c.barba === "barbalunga" ? 214 : 172;
    if (c.barba === "basettoni") [1, -1].forEach(function (s) {
      var X = function (v) { return (100 - s * v).toFixed(1); };
      o.push("<path d='M" + X(54) + ",90 C" + X(54) + ",110 " + X(50) + ",124 " + X(40) + ",134 L" + X(34) + ",130 C" + X(42) + ",118 " + X(45) + ",106 " + X(45) + ",90 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.1'/>");
    });
    if (c.barba === "accenno") o.push("<path d='" + BARBA.corta + "' fill='" + H + "' opacity='.16'/>", "<path d='" + BARBA.corta + "' fill='" + u("pt") + "' opacity='.7'/>");
    if (conBarba || conPizz) {
      var dB = conBarba ? BARBA[c.barba] : BARBA.pizzetto;
      o.push("<path d='" + dB + "' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.2' stroke-linejoin='round'/>", "<g clip-path='" + u("bc") + "'>");
      for (var bi = 0; bi < 11; bi++) {
        var bx = 50 + bi * 10;
        o.push("<path d='M" + bx + ",128 Q" + (bx + 3) + ",146 " + (bx - 1) + "," + fondoB + "' stroke='" + bH + "' stroke-width='1.2' opacity='.35' fill='none'/>",
          "<path d='M" + (bx + 5) + ",132 Q" + (bx + 7) + ",148 " + (bx + 4) + "," + (fondoB - 2) + "' stroke='" + tono(H, 0.35) + "' stroke-width='1' opacity='.22' fill='none'/>");
      }
      o.push("</g>");
    }

    // bocca
    var lab = rossetto ? tono(CT, -0.15) : "#8a3328", dentro = "#5a1613";
    o.push("<g transform='translate(0," + yB + ")'>");   // bocca e baffi si spostano insieme
    if (opts.hd) o.push("<ellipse cx='100' cy='137' rx='8' ry='2.2' fill='" + tono(P, -0.6) + "' opacity='.18' filter='" + u("sf") + "'/>");
    if (c.bocca === "sorrisone") o.push("<path d='M85,122 Q100,125 115,122 Q113,142 100,142 Q87,142 85,122 Z' fill='" + dentro + "' stroke='" + lab + "' stroke-width='1.3' stroke-linejoin='round'/>",
      "<path d='M87,123.3 Q100,126 113,123.3 L112,128.3 Q100,130.5 88,128.3 Z' fill='#fff'/>", "<ellipse cx='100' cy='137.5' rx='8' ry='3.6' fill='#ff6f73'/>");
    else if (c.bocca === "neutro") o.push("<path d='M90,128 Q100,130 110,128' stroke='" + lab + "' stroke-width='3' fill='none' stroke-linecap='round'/>",
      "<path d='M94,133 Q100,135 106,133' stroke='" + tono(P, -0.25) + "' stroke-width='2' fill='none' opacity='.55' stroke-linecap='round'/>");
    else if (c.bocca === "o") o.push("<ellipse cx='100' cy='128' rx='6' ry='7' fill='" + dentro + "' stroke='" + lab + "' stroke-width='1.6'/>", "<ellipse cx='100' cy='131.5' rx='3.8' ry='2' fill='#ff7b7b'/>");
    else if (c.bocca === "ghigno") o.push("<path d='M87,127 Q103,134 114,121 Q102,130 87,127 Z' fill='" + lab + "' stroke='" + lab + "' stroke-width='1.4' stroke-linejoin='round'/>");
    else if (c.bocca === "linguaccia") o.push("<path d='M87,124 Q100,133 113,124' stroke='" + lab + "' stroke-width='3' fill='none' stroke-linecap='round'/>",
      "<path d='M93.5,127.5 Q93,141 100,141 Q107,141 106.5,127.5 Z' fill='#ff6f86' stroke='#c2255c' stroke-width='1.2'/>", "<path d='M100,129 L100,137' stroke='#c2255c' stroke-width='1' opacity='.6'/>");
    else if (c.bocca === "dentoni") o.push("<path d='M86,123 Q100,135 114,123' stroke='" + lab + "' stroke-width='2.8' fill='none' stroke-linecap='round'/>",
      "<rect x='95.4' y='127' width='4.4' height='6.5' rx='1' fill='#fff' stroke='#b9b9c0' stroke-width='.8'/>", "<rect x='100.2' y='127' width='4.4' height='6.5' rx='1' fill='#fff' stroke='#b9b9c0' stroke-width='.8'/>");
    else if (c.bocca === "smorfia") o.push("<path d='M86,127 Q91,122 96,127 Q101,132 106,127 Q111,122 115,126' stroke='" + lab + "' stroke-width='3' fill='none' stroke-linecap='round'/>");
    else if (c.bocca === "baciotto") o.push("<ellipse cx='100' cy='128' rx='4.8' ry='4' fill='" + (rossetto ? CT : "#d9546a") + "' stroke='" + lab + "' stroke-width='1.1'/>",
      "<path d='M97.5,128 L102.5,128' stroke='#7d1f33' stroke-width='1.1'/>", "<ellipse cx='101.5' cy='126.2' rx='1.4' ry='.7' fill='#fff' opacity='.5'/>");
    else if (c.bocca === "labbra") o.push("<path d='M86,126 Q92,120.5 100,123.5 Q108,120.5 114,126 Q100,128 86,126 Z' fill='" + (rossetto ? tono(CT, -0.1) : "#c9435a") + "'/>",
      "<path d='M86,126 Q100,128 114,126 Q108,134.5 100,134.5 Q92,134.5 86,126 Z' fill='" + (rossetto ? CT : "#dc5a70") + "'/>",
      "<path d='M86,126 Q100,128 114,126' stroke='#7d1f33' stroke-width='1.1' fill='none'/>", "<ellipse cx='104' cy='130.5' rx='3.4' ry='1.3' fill='#fff' opacity='.45'/>");
    else if (c.bocca === "sorrisetto") o.push("<path d='M93,126 Q100,131.5 107,126' stroke='" + lab + "' stroke-width='2.6' fill='none' stroke-linecap='round'/>");
    else if (c.bocca === "risata") o.push("<path d='M82,120 Q100,124 118,120 Q116,147 100,147 Q84,147 82,120 Z' fill='" + dentro + "' stroke='" + lab + "' stroke-width='1.4' stroke-linejoin='round'/>",
      "<path d='M84.5,121.4 Q100,125 115.5,121.4 L114.5,127 Q100,130 85.5,127 Z' fill='#fff'/>", "<ellipse cx='100' cy='141' rx='9' ry='4.5' fill='#ff6f73'/>",
      "<path d='M78,117 Q80,121 83,121 M122,117 Q120,121 117,121' stroke='" + lab + "' stroke-width='1.4' fill='none' stroke-linecap='round'/>");
    else if (c.bocca === "triste") o.push("<path d='M88,132 Q100,121 112,132' stroke='" + lab + "' stroke-width='3' fill='none' stroke-linecap='round'/>");
    else if (c.bocca === "micio") o.push("<path d='M88,124 Q94,131 100,125 Q106,131 112,124' stroke='" + lab + "' stroke-width='2.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/>");
    else if (c.bocca === "canini") o.push("<path d='M86,123 Q100,138 114,123 Q100,131 86,123 Z' fill='" + lab + "' stroke='" + lab + "' stroke-width='1.3' stroke-linejoin='round'/>",
      "<path d='M90.5,126.3 L92.5,133 L94.5,127.6 Z M109.5,126.3 L107.5,133 L105.5,127.6 Z' fill='#fff' stroke='#c9c9d1' stroke-width='.6' stroke-linejoin='round'/>");
    else if (c.bocca === "apparecchio") o.push("<path d='M85,122 Q100,125 115,122 Q113,138 100,138 Q87,138 85,122 Z' fill='" + dentro + "' stroke='" + lab + "' stroke-width='1.3' stroke-linejoin='round'/>",
      "<path d='M87,123.3 Q100,126 113,123.3 L112,130 Q100,132.5 88,130 Z' fill='#fff'/>",
      "<path d='M88,126.6 Q100,129.4 112,126.6' stroke='#9aa3ad' stroke-width='1.5' fill='none'/>",
      [91, 96, 100, 104, 109].map(function (bx) { return "<rect x='" + (bx - 1.2) + "' y='125.6' width='2.4' height='2.4' rx='.5' fill='#c7ced6' stroke='#7d8793' stroke-width='.4'/>"; }).join(""));
    else if (c.bocca === "mordilabbro") o.push("<path d='M88,125 Q100,129 112,125' stroke='" + lab + "' stroke-width='2.6' fill='none' stroke-linecap='round'/>",
      "<path d='M95.5,126.2 L95.8,130.4 Q100,131.4 104.2,130.4 L104.5,126.2 Q100,127.4 95.5,126.2 Z' fill='#fff' stroke='#b9b9c0' stroke-width='.7'/>",
      "<path d='M92,131.5 Q100,134 108,131.5' stroke='" + tono(P, -0.3) + "' stroke-width='1.6' fill='none' opacity='.6' stroke-linecap='round'/>");
    else if (c.bocca === "nervoso") o.push("<path d='M86,128 L90,125 L94,129 L98,125 L102,129 L106,125 L110,129 L114,126' stroke='" + lab + "' stroke-width='2.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/>");
    else o.push("<path d='M86,123 Q100,138 114,123 Q100,131 86,123 Z' fill='" + lab + "' stroke='" + lab + "' stroke-width='1.3' stroke-linejoin='round'/>",
      "<path d='M84.5,121 Q85.5,123.5 88,123.5 M115.5,121 Q114.5,123.5 112,123.5' stroke='" + lab + "' stroke-width='1.3' fill='none' stroke-linecap='round'/>");

    var dBaffi = (c.barba === "baffi" || c.barba === "baffipizzetto" || (conBarba && c.barba !== "collare")) ? BARBA.baffi : (c.barba === "baffoni" ? BARBA.baffoni : null);
    if (dBaffi) o.push("<path d='" + dBaffi + "' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.1' stroke-linejoin='round'/>",
      "<path d='M88,119 Q93,116.5 98,119 M102,119 Q107,116.5 112,119' stroke='" + tono(H, 0.35) + "' stroke-width='1' opacity='.4' fill='none'/>");
    o.push("</g>");

    // ---------- capelli DAVANTI (con ciocche e riflesso lucido) ----------
    if (cappello) o.push("<g clip-path='" + u("sc2") + "'>");   // col cappello: tutto quello che sta sopra la visiera sparisce
    if (/^(corti|spettinati|frangia|coda|ciuffo|riga|indietro|scodella|riccicorti|mullet|codinobasso|spike|banana|stempiato|treccine|scalati|arruffati)$/.test(tipo)) [1, -1].forEach(function (s) {   // basette
      var bx = 100 - s * 54;
      o.push("<path d='M" + bx + ",92 Q" + (bx - s * 1) + ",104 " + (bx + s * 3) + ",113 L" + (bx + s * 7) + ",112 Q" + (bx + s * 5) + ",102 " + (bx + s * 6) + ",92 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1' stroke-linejoin='round'/>");
    });
    if (tipo === "undercut" || tipo === "sfumato" || tipo === "afroalto") o.push("<g clip-path='" + u("cv") + "'><path d='" + FRONTE.corti + "' fill='" + H + "' opacity='.35'/><path d='" + FRONTE.corti + "' fill='" + u("pt") + "' opacity='.7'/></g>");   // lati rasati
    if (fr) {
      o.push("<path d='" + fr + "' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8' stroke-linejoin='round'/>", "<g clip-path='" + u("hc") + "'>");
      if (RICCI_TRAMA[tipo]) o.push("<path d='" + fr + "' fill='" + u("rc") + "'/>");
      else for (var ai = 0; ai < 13; ai++) {
        var ang = (168 - ai * 13) * Math.PI / 180, ex2 = 106 + 80 * Math.cos(ang), ey2 = 26 + 80 * Math.sin(ang),
            cxq = 106 + 42 * Math.cos(ang + 0.14), cyq = 26 + 42 * Math.sin(ang + 0.14);
        o.push("<path d='M106,26 Q" + cxq.toFixed(1) + "," + cyq.toFixed(1) + " " + ex2.toFixed(1) + "," + ey2.toFixed(1) + "' stroke='" + (ai % 2 ? tono(H, 0.4) : bH) + "' stroke-width='" + (ai % 2 ? 1 : 1.4) + "' opacity='" + (ai % 2 ? 0.25 : 0.38) + "' fill='none'/>");
      }
      o.push("</g>", "<path d='M68,50 Q98,33 131,46' stroke='#fff' stroke-width='6' opacity='.22' fill='none' stroke-linecap='round'/>",
        "<path d='M74,47 Q98,36 124,44' stroke='#fff' stroke-width='2' opacity='.35' fill='none' stroke-linecap='round'/>");
    }
    if (tipo === "cresta") o.push("<path d='" + FRONTE.corti + "' fill='" + H + "' opacity='.16'/>",
      "<path d='" + FRONTE.corti + "' fill='" + u("pt") + "' opacity='.35'/>",
      "<path d='M85,44 C86,22 96,6 100,4 C104,6 114,22 115,44 C108,50 92,50 85,44 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8'/>",
      "<path d='M92,42 Q94,24 100,8 M100,44 Q101,26 104,10 M108,43 Q107,28 106,14' stroke='" + bH + "' stroke-width='1.2' opacity='.4' fill='none'/>",
      "<path d='M95,16 Q96,28 93,40' stroke='#fff' stroke-width='2.5' opacity='.35' fill='none' stroke-linecap='round'/>");
    if (tipo === "ricci") riccioli(false);
    if (tipo === "ciuffo") o.push("<path d='M54,72 C46,40 72,10 114,12 C144,14 160,34 155,60 C148,46 136,40 122,42 C104,38 86,46 76,56 C68,60 59,64 54,72 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8' stroke-linejoin='round'/>",
      "<path d='M62,62 C62,38 86,20 116,20 M72,56 C76,36 98,26 124,28 M86,48 C94,36 112,32 134,36' stroke='" + bH + "' stroke-width='1.3' opacity='.4' fill='none'/>",
      "<path d='M70,40 C82,24 104,18 128,22' stroke='#fff' stroke-width='5' opacity='.25' fill='none' stroke-linecap='round'/>");
    if (/^(codini|chignon|tendina|onde|trecce|mezzacoda|chignonspettinato|codaalta|codinobasso|chignondoppio|codebasse|codalaterale|boccoli)$/.test(tipo)) o.push("<path d='M100,31 L100,58' stroke='" + bH + "' stroke-width='1.6' opacity='.55'/>");   // riga in mezzo
    if (tipo === "riga" || tipo === "rigalato") o.push("<path d='M76,33 Q78,46 82,64' stroke='" + bH + "' stroke-width='1.8' opacity='.6' fill='none'/>", "<path d='M80,36 C100,40 122,48 140,64' stroke='" + tono(H, 0.35) + "' stroke-width='2' opacity='.35' fill='none'/>");
    if (tipo === "riccicorti") for (var rq = 0; rq <= 10; rq++) {   // riccioli piccoli sull'attaccatura
      var aq = Math.PI * (1.06 + 0.88 * rq / 10);
      o.push("<circle cx='" + (100 + 52 * Math.cos(aq)).toFixed(1) + "' cy='" + (88 + 50 * Math.sin(aq)).toFixed(1) + "' r='7.5' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.1'/>",
        "<path d='M" + (97 + 52 * Math.cos(aq)).toFixed(1) + "," + (88 + 50 * Math.sin(aq)).toFixed(1) + " a3,3 0 1,1 4,2' stroke='" + bH + "' stroke-width='1' opacity='.5' fill='none'/>");
    }
    if (tipo === "chignonspettinato") o.push("<path d='M52,84 Q46,104 52,120 M148,84 Q154,104 148,120' stroke='" + H + "' stroke-width='2.2' fill='none' stroke-linecap='round'/>");   // ciocche libere sul viso
    if (tipo === "dread") [[56, 76, 50, 150], [66, 70, 62, 138], [144, 76, 150, 150], [134, 70, 138, 138]].forEach(function (d) {   // rasta davanti
      var p = "M" + d[0] + "," + d[1] + " Q" + ((d[0] + d[2]) / 2 - 3) + "," + ((d[1] + d[3]) / 2) + " " + d[2] + "," + d[3];
      o.push("<path d='" + p + "' stroke='" + bH + "' stroke-width='8.5' stroke-linecap='round' fill='none'/>", "<path d='" + p + "' stroke='" + H + "' stroke-width='6' stroke-linecap='round' fill='none'/>",
        "<path d='" + p + "' stroke='" + tono(H, -0.35) + "' stroke-width='6' stroke-dasharray='1.2 3.2' fill='none'/>");
    });
    if (tipo === "treccia" || tipo === "trecce") (tipo === "trecce" ? [1, -1] : [-1]).forEach(function (s) {   // trecce sulla spalla
      for (var tq = 0; tq < 8; tq++) {
        var ty = 104 + tq * 11, tx = 100 - s * (52 - tq * 0.6), lato = tq % 2 ? 1 : -1;
        o.push("<ellipse cx='" + (tx + lato * 2.5).toFixed(1) + "' cy='" + ty + "' rx='8.5' ry='7.5' transform='rotate(" + (lato * 28) + " " + (tx + lato * 2.5).toFixed(1) + " " + ty + ")' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.2'/>",
          "<path d='M" + (tx + lato * 2.5 - 4).toFixed(1) + "," + (ty - 2) + " q4,-3 8,0' stroke='#fff' stroke-width='1.2' opacity='.3' fill='none'/>");
      }
      elastico(100 - s * 47, 194);
      o.push("<path d='M" + (100 - s * 47) + ",198 l-3,9 M" + (100 - s * 47) + ",198 l0,10 M" + (100 - s * 47) + ",198 l3,9' stroke='" + bH + "' stroke-width='2.2' stroke-linecap='round'/>");
    });
    // --- altri tagli: parti davanti ---
    if (tipo === "banana") o.push("<path d='M56,68 C46,32 78,4 114,6 C146,8 162,32 154,62 C146,46 132,40 116,42 C96,36 76,46 56,68 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8' stroke-linejoin='round'/>",
      "<path d='M64,58 C66,34 88,16 118,16 M76,50 C82,32 102,24 128,26 M90,44 C98,32 116,30 138,34' stroke='" + bH + "' stroke-width='1.3' opacity='.4' fill='none'/>",
      "<path d='M70,34 C84,16 108,10 132,16' stroke='#fff' stroke-width='5' opacity='.25' fill='none' stroke-linecap='round'/>");
    if (tipo === "treccine") for (var tc = 0; tc < 7; tc++) {   // treccine strette dalla fronte verso la nuca
      var tx0 = 66 + tc * 11.3, tx1 = 100 + (tx0 - 100) * 0.55;
      o.push("<path d='M" + tx0.toFixed(1) + ",58 Q" + ((tx0 + tx1) / 2).toFixed(1) + ",40 " + tx1.toFixed(1) + ",30' stroke='" + bH + "' stroke-width='4.2' fill='none' stroke-linecap='round'/>",
        "<path d='M" + tx0.toFixed(1) + ",58 Q" + ((tx0 + tx1) / 2).toFixed(1) + ",40 " + tx1.toFixed(1) + ",30' stroke='" + tono(H, 0.3) + "' stroke-width='2.4' stroke-dasharray='2 2.2' fill='none'/>");
    }
    if (tipo === "codalaterale") {   // coda portata davanti, sulla spalla
      o.push("<path d='M138,84 C164,94 168,134 158,176 C154,190 142,190 144,176 C152,142 148,108 128,94 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8'/>");
      ciocche(["M146,100 Q160,130 152,176", "M140,104 Q152,134 148,172"]);
      elastico(136, 90);
    }
    if (cappello) o.push("</g>");

    // ---------- accessori ----------
    var occ = c.occhiali;
    if (occ !== "nessuno") {
      var montatura = occ === "aviatore" ? "#b8902a" : (occ === "cuore" ? "#c2255c" : "#1d1d24");
      o.push("<g transform='translate(0," + yE + ")'>",   // gli occhiali seguono gli occhi
        "<path d='M" + (66 - dE) + ",97 L47,94 M" + (134 + dE) + ",97 L153,94' stroke='" + montatura + "' stroke-width='" + (occ === "aviatore" ? 2 : 2.8) + "' stroke-linecap='round'/>",
        "<path d='M" + (93 - dE) + ",99 Q100,95 " + (107 + dE) + ",99' stroke='" + montatura + "' stroke-width='" + (occ === "aviatore" ? 2 : 2.8) + "' fill='none'/>");
      [80 - dE, 120 + dE].forEach(function (ex) {
        var s = ex < 100 ? -1 : 1;
        if (occ === "sole") o.push("<rect x='" + (ex - 14) + "' y='89' width='28' height='21' rx='9' fill='" + u("lente") + "' stroke='#000' stroke-width='2'/>",
          "<path d='M" + (ex - 9) + ",95 L" + (ex - 3) + ",93 M" + (ex - 8) + ",99 L" + (ex + 4) + ",95' stroke='#fff' stroke-width='2' opacity='.45' stroke-linecap='round'/>");
        else if (occ === "quadrati") o.push("<rect x='" + (ex - 14) + "' y='90' width='28' height='20' rx='3' fill='#bfe3ff' fill-opacity='.14' stroke='#1d1d24' stroke-width='3.4'/>",
          "<path d='M" + (ex - 8) + ",94 L" + (ex - 3) + ",92' stroke='#fff' stroke-width='2' opacity='.55' stroke-linecap='round'/>");
        else if (occ === "aviatore") o.push("<path d='M" + (ex - s * 13) + ",91 L" + (ex + s * 13) + ",91 Q" + (ex + s * 14) + ",106 " + (ex + s * 4) + ",111 Q" + (ex - s * 10) + ",113 " + (ex - s * 13) + ",101 Z' fill='" + u("lente") + "' fill-opacity='.9' stroke='" + montatura + "' stroke-width='1.8' stroke-linejoin='round'/>",
          "<path d='M" + (ex - 8) + ",95 L" + (ex - 2) + ",93' stroke='#fff' stroke-width='2' opacity='.5' stroke-linecap='round'/>");
        else if (occ === "cuore") o.push("<path d='M" + ex + ",113 C" + (ex - 16) + ",104 " + (ex - 15) + ",88 " + (ex - 6.5) + ",89 C" + (ex - 2.5) + ",89 " + ex + ",92 " + ex + ",94 C" + ex + ",92 " + (ex + 2.5) + ",89 " + (ex + 6.5) + ",89 C" + (ex + 15) + ",88 " + (ex + 16) + ",104 " + ex + ",113 Z' fill='#ff4f8a' fill-opacity='.55' stroke='" + montatura + "' stroke-width='2.2' stroke-linejoin='round'/>",
          "<path d='M" + (ex - 8) + ",94 L" + (ex - 4) + ",92' stroke='#fff' stroke-width='2' opacity='.6' stroke-linecap='round'/>");
        else o.push("<circle cx='" + ex + "' cy='100' r='13.5' fill='#bfe3ff' fill-opacity='.14' stroke='#1d1d24' stroke-width='2.8'/>",
          "<path d='M" + (ex - 7) + ",93 L" + (ex - 2) + ",90' stroke='#fff' stroke-width='2' opacity='.55' stroke-linecap='round'/>");
      });
      o.push("</g>");
    }
    if (acc === "fascia") o.push("<path d='M46,74 Q100,56 154,74 L155,85 Q100,67 45,85 Z' fill='" + u("a") + "' stroke='" + bA + "' stroke-width='1.4'/>",
      "<path d='M50,76 Q100,60 150,76' stroke='#fff' stroke-width='1.5' opacity='.3' fill='none'/>",
      "<path d='M150,76 Q162,70 166,78 Q160,84 152,82 Z' fill='" + u("a") + "' stroke='" + bA + "' stroke-width='1.2'/>");
    if (acc === "cappellino") o.push("<path d='M39,83 C35,14 165,14 161,83 Q100,71 39,83 Z' fill='" + u("a") + "' stroke='" + bA + "' stroke-width='1.8'/>",
      "<path d='M100,26 L100,75 M70,31 Q60,54 58,79 M130,31 Q140,54 142,79' stroke='" + bA + "' stroke-width='1.2' opacity='.35' fill='none'/>",
      "<path d='M44,79 Q100,68 156,79' stroke='#fff' stroke-width='1.2' stroke-dasharray='3 3' opacity='.45' fill='none'/>",
      "<path d='M94,78 Q152,69 184,86 Q154,97 94,86 Z' fill='" + tono(A, -0.22) + "' stroke='" + bA + "' stroke-width='1.8'/>",
      "<path d='M100,80 Q150,73 178,86' stroke='#fff' stroke-width='1.5' opacity='.25' fill='none'/>",
      "<circle cx='100' cy='24' r='5.5' fill='" + tono(A, -0.2) + "' stroke='" + bA + "' stroke-width='1'/>", "<path d='M58,50 Q80,30 108,29' stroke='#fff' stroke-width='5' opacity='.22' fill='none' stroke-linecap='round'/>");
    if (acc === "berretto") {
      o.push("<path d='M40,88 C34,16 166,16 160,88 Z' fill='" + u("a") + "' stroke='" + bA + "' stroke-width='1.8'/>");
      for (var ri2 = 0; ri2 < 9; ri2++) o.push("<path d='M" + (52 + ri2 * 12) + ",44 L" + (52 + ri2 * 12) + ",82' stroke='" + bA + "' stroke-width='1.1' opacity='.25'/>");
      o.push("<path d='M37,75 Q100,62 163,75 L163,93 Q100,80 37,93 Z' fill='" + tono(A, -0.12) + "' stroke='" + bA + "' stroke-width='1.6'/>");
      for (var rb = 0; rb < 16; rb++) o.push("<path d='M" + (42 + rb * 7.7) + "," + (74 - Math.sin(rb / 15 * Math.PI) * 10) + " l0,15' stroke='" + bA + "' stroke-width='1.3' opacity='.35'/>");
      o.push("<circle cx='100' cy='18' r='12' fill='" + u("a") + "' stroke='" + bA + "' stroke-width='1.4'/>", "<circle cx='95' cy='13' r='4.5' fill='#fff' opacity='.25'/>",
        "<path d='M54,50 Q76,30 104,28' stroke='#fff' stroke-width='5' opacity='.2' fill='none' stroke-linecap='round'/>");
    }
    if (acc === "cuffie") o.push("<path d='M44,96 C38,24 162,24 156,96' stroke='#2b2b33' stroke-width='8' fill='none' stroke-linecap='round'/>",
      "<path d='M52,60 Q70,34 100,31' stroke='#fff' stroke-width='2' opacity='.25' fill='none' stroke-linecap='round'/>",
      "<rect x='33' y='82' width='20' height='32' rx='9' fill='" + u("a") + "' stroke='#222' stroke-width='1.8'/>", "<rect x='147' y='82' width='20' height='32' rx='9' fill='" + u("a") + "' stroke='#222' stroke-width='1.8'/>",
      "<rect x='37' y='86' width='6' height='12' rx='3' fill='#fff' opacity='.25'/>", "<rect x='151' y='86' width='6' height='12' rx='3' fill='#fff' opacity='.25'/>");
    var orc = c.orecchini;
    if (orc === "cerchi" || orc === "punti" || orc === "pendenti") [47, 153].forEach(function (ex) {
      if (orc === "cerchi") o.push("<circle cx='" + ex + "' cy='114' r='4.5' fill='none' stroke='" + u("oro") + "' stroke-width='2.2'/>", "<circle cx='" + (ex - 1.5) + "' cy='111' r='1' fill='#fff' opacity='.7'/>");
      else if (orc === "punti") o.push("<circle cx='" + ex + "' cy='108.5' r='2.4' fill='#e8f7ff' stroke='#9cc9e0' stroke-width='.8'/>", "<circle cx='" + (ex - 0.8) + "' cy='107.7' r='.8' fill='#fff'/>");
      else o.push("<path d='M" + ex + ",108 L" + ex + ",117' stroke='" + u("oro") + "' stroke-width='1.4'/>", "<path d='M" + ex + ",116 L" + (ex + 4) + ",121 L" + ex + ",126 L" + (ex - 4) + ",121 Z' fill='#4dabf7' stroke='#1864ab' stroke-width='.8'/>",
        "<circle cx='" + (ex - 1) + "' cy='120' r='.9' fill='#fff' opacity='.8'/>");
    });
    if (orc === "piercing") o.push("<circle cx='104.5' cy='116.5' r='2.6' fill='none' stroke='#c0c4cc' stroke-width='1.3'/>", "<circle cx='103.4' cy='115.2' r='.6' fill='#fff'/>");   // anellino al naso
    if (acc === "corona") o.push("<path d='M62,54 L68,22 L85,40 L100,12 L115,40 L132,22 L138,54 Q100,62 62,54 Z' fill='" + u("oro") + "' stroke='#a8740b' stroke-width='1.8' stroke-linejoin='round'/>",
      "<path d='M64,50 Q100,57 136,50' stroke='#fff3b0' stroke-width='2' opacity='.6' fill='none'/>",
      "<circle cx='100' cy='44' r='5' fill='#e03131' stroke='#8a1c1c'/>", "<circle cx='98.5' cy='42.5' r='1.5' fill='#fff' opacity='.7'/>",
      "<circle cx='79' cy='48' r='3.5' fill='#1c7ed6'/>", "<circle cx='121' cy='48' r='3.5' fill='#2f9e44'/>",
      "<circle cx='68' cy='22' r='3' fill='" + u("oro") + "'/>", "<circle cx='100' cy='12' r='3.2' fill='" + u("oro") + "'/>", "<circle cx='132' cy='22' r='3' fill='" + u("oro") + "'/>");

    if (acc === "cilindro") o.push("<rect x='64' y='-6' width='72' height='58' rx='4' fill='" + u("a") + "' stroke='" + bA + "' stroke-width='1.8'/>",
      "<rect x='64' y='36' width='72' height='10' fill='" + tono(A, -0.45) + "'/>", "<path d='M72,0 L72,32' stroke='#fff' stroke-width='5' opacity='.18' stroke-linecap='round'/>",
      "<ellipse cx='100' cy='53' rx='56' ry='9' fill='" + tono(A, -0.15) + "' stroke='" + bA + "' stroke-width='1.8'/>", "<ellipse cx='100' cy='-6' rx='36' ry='5' fill='" + tono(A, 0.12) + "' stroke='" + bA + "' stroke-width='1.4'/>");
    if (acc === "cowboy") o.push("<path d='M64,58 C62,22 80,8 100,18 C120,8 138,22 136,58 Z' fill='" + u("a") + "' stroke='" + bA + "' stroke-width='1.8'/>",
      "<path d='M100,18 L100,40' stroke='" + bA + "' stroke-width='1.6' opacity='.5'/>", "<path d='M64,50 Q100,56 136,50 L136,57 Q100,63 64,57 Z' fill='" + tono(A, -0.45) + "'/>",
      "<path d='M18,56 Q36,74 100,68 Q164,74 182,56 Q178,48 162,54 Q100,64 38,54 Q22,48 18,56 Z' fill='" + tono(A, -0.12) + "' stroke='" + bA + "' stroke-width='1.8' stroke-linejoin='round'/>",
      "<path d='M74,26 Q86,16 98,20' stroke='#fff' stroke-width='4' opacity='.2' fill='none' stroke-linecap='round'/>");
    if (acc === "pescatore") o.push("<path d='M58,64 L67,26 Q100,14 133,26 L142,64 Z' fill='" + u("a") + "' stroke='" + bA + "' stroke-width='1.8' stroke-linejoin='round'/>",
      "<path d='M38,74 Q100,58 162,74 Q158,64 142,60 Q100,52 58,60 Q42,64 38,74 Z' fill='" + tono(A, -0.1) + "' stroke='" + bA + "' stroke-width='1.6' stroke-linejoin='round'/>",
      "<path d='M46,70 Q100,58 154,70 M52,66 Q100,56 148,66' stroke='" + tono(A, 0.35) + "' stroke-width='1' stroke-dasharray='2.5 2' fill='none' opacity='.7'/>",
      "<path d='M74,32 Q90,24 108,24' stroke='#fff' stroke-width='4' opacity='.2' fill='none' stroke-linecap='round'/>");
    if (acc === "basco") o.push("<ellipse cx='104' cy='40' rx='60' ry='19' transform='rotate(-8 104 40)' fill='" + u("a") + "' stroke='" + bA + "' stroke-width='1.8'/>",
      "<path d='M50,56 Q100,46 152,52' stroke='" + tono(A, -0.35) + "' stroke-width='4' fill='none' stroke-linecap='round'/>",
      "<path d='M104,22 L106,14' stroke='" + bA + "' stroke-width='3' stroke-linecap='round'/>", "<ellipse cx='84' cy='32' rx='20' ry='5' transform='rotate(-10 84 32)' fill='#fff' opacity='.18'/>");
    if (acc === "festa") {   // cappellino a cono con le righe e il pompon
      o.push("<path d='M100,-8 L124,50 Q100,58 76,50 Z' fill='" + u("a") + "' stroke='" + bA + "' stroke-width='1.6' stroke-linejoin='round'/>",
        "<path d='M90,16 L110,16 M85,28 L115,28 M80,40 L120,40' stroke='#fff' stroke-width='3.2' opacity='.75'/>",
        "<circle cx='100' cy='-9' r='6' fill='#ffd43b' stroke='#c79100' stroke-width='1'/>");
    }
    if (acc === "gatto") o.push("<path d='M46,74 C42,30 158,30 154,74' stroke='" + u("a") + "' stroke-width='5' fill='none' stroke-linecap='round'/>",
      "<path d='M58,48 L64,14 L86,36 Z' fill='" + u("a") + "' stroke='" + bA + "' stroke-width='1.6' stroke-linejoin='round'/>", "<path d='M64,40 L67,24 L78,36 Z' fill='#ffb3c7'/>",
      "<path d='M142,48 L136,14 L114,36 Z' fill='" + u("a") + "' stroke='" + bA + "' stroke-width='1.6' stroke-linejoin='round'/>", "<path d='M136,40 L133,24 L122,36 Z' fill='#ffb3c7'/>");
    if (acc === "fiori") {   // coroncina di fiori con le foglie
      var petali = ["#ff8fab", "#ffd43b", "#ffffff", "#b197fc", "#ff8fab", "#74c0fc", "#ffd43b"];
      for (var fi = 0; fi < 7; fi++) {
        var fa = Math.PI * (1.12 + 0.76 * fi / 6), fx = 100 + 54 * Math.cos(fa), fy = 76 + 42 * Math.sin(fa);
        o.push("<ellipse cx='" + (fx + 6).toFixed(1) + "' cy='" + (fy + 3).toFixed(1) + "' rx='5' ry='2.6' fill='#51cf66' transform='rotate(30 " + (fx + 6).toFixed(1) + " " + (fy + 3).toFixed(1) + ")'/>");
        for (var pe = 0; pe < 5; pe++) { var pa = pe * 1.2566; o.push("<circle cx='" + (fx + 4 * Math.cos(pa)).toFixed(1) + "' cy='" + (fy + 4 * Math.sin(pa)).toFixed(1) + "' r='3.4' fill='" + petali[fi] + "' stroke='rgba(0,0,0,.15)' stroke-width='.6'/>"); }
        o.push("<circle cx='" + fx.toFixed(1) + "' cy='" + fy.toFixed(1) + "' r='2.2' fill='#f59f00'/>");
      }
    }
    o.push("</g>");   // fine testa

    function riccioli(dietro) {
      var i, a, rx2, ry2;
      function boccolo(cx, cy, r) {
        o.push("<circle cx='" + cx.toFixed(1) + "' cy='" + cy.toFixed(1) + "' r='" + r + "' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.3'/>",
          "<path d='M" + (cx - r * 0.5).toFixed(1) + "," + (cy - r * 0.1).toFixed(1) + " a" + (r * 0.45) + "," + (r * 0.45) + " 0 1,1 " + (r * 0.6).toFixed(1) + "," + (r * 0.4).toFixed(1) + "' stroke='" + bH + "' stroke-width='1.1' opacity='.45' fill='none'/>",
          "<circle cx='" + (cx - r * 0.35).toFixed(1) + "' cy='" + (cy - r * 0.35).toFixed(1) + "' r='" + (r * 0.22).toFixed(1) + "' fill='#fff' opacity='.22'/>");
      }
      if (dietro) { for (i = 0; i < 6; i++) { boccolo(44 - i * 0.5, 90 + i * 9, 12); boccolo(156 + i * 0.5, 90 + i * 9, 12); } return; }
      for (i = 0; i <= 11; i++) { a = Math.PI * (1.02 + 0.96 * i / 11); rx2 = 100 + 50 * Math.cos(a); ry2 = 86 + 50 * Math.sin(a); boccolo(rx2, ry2, 14); }
      [[82, 44], [100, 40], [118, 44], [90, 56], [110, 56]].forEach(function (p) { boccolo(p[0], p[1], 13); });
    }

    o.push("</g>");   // fine om-tutto
    // busto (tondini): inquadratura che segue la grandezza della testa, così la faccia resta grande
    var vb = opts.busto ? [100 - 89 * kT, 150 - 156 * kT, 178 * kT, 182 * kT].map(function (n) { return n.toFixed(1); }).join(" ") : (opts.gambe ? "40 150 120 112" : "0 0 200 264");   // gambe: inquadratura sui pantaloni
    var px = opts.px ? " width='" + opts.px + "' height='" + Math.round(opts.px * (opts.busto ? 182 / 178 : 1.32)) + "'" : "";
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='" + vb + "'" + px + " class='omino'>" + o.join("") + "</svg>";
  }

  function el(cfg, opts) { var s = document.createElement("span"); s.className = "omino-box"; s.innerHTML = svg(cfg, opts); return s; }

  // omino a caso ma stabile: lo stesso nome dà sempre lo stesso omino
  function casuale(seme) {
    var h = 2166136261, str = String(seme == null ? Math.random() : seme);
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    function pick(lista) { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return (h >>> 0) % lista.length; }
    function uno(lista) { return lista[pick(lista)]; }
    var donna = pick([0, 1]) === 1;
    return { forma: donna ? "donna" : "uomo", corpo: uno(OPZ.corpo), sotto: donna && pick([0, 1, 2]) === 0 ? uno(["gonna", "gonnalunga"]) : uno(["jeans", "jeans", "strappati", "cargo", "pantaloni", "tuta", "pantaloncini"]),
      pelle: pick(OPZ.pelle), viso: uno(OPZ.viso), capelli: uno(OPZ.capelli), colCap: pick(OPZ.colCap.slice(0, 7)),
      occhi: uno(OPZ.occhi), iride: pick(OPZ.iride), orecchie: uno(["normali", "normali", "normali", "piccole", "grandi"]), sopracc: uno(OPZ.sopracc), naso: uno(OPZ.naso), bocca: uno(OPZ.bocca),
      guance: uno(["no", "no", "leggere", "rosse", "lentiggini"]), barba: donna ? "no" : uno(["no", "no", "no", "no", "accenno", "corta", "folta", "barbalunga", "collare", "pizzetto", "ancora", "baffi", "baffipizzetto", "baffoni", "basettoni"]),
      segno: uno(["nessuno", "nessuno", "nessuno", "neo", "cerotto", "occhiaie"]), colTrucco: pick(OPZ.colTrucco),
      trucco: donna ? uno(["nessuno", "nessuno", "ombretto", "eyeliner", "rossetto", "completo"]) : "nessuno",
      capo: uno(OPZ.capo), maglia: pick(OPZ.maglia), stampa: uno(["nessuna", "nessuna", "nessuna", "righe", "stella", "fulmine", "cuore", "pois", "quadri", "smile", "pallone", "numero"]), modScarpe: uno(["sneakers", "sneakers", "stivali", "eleganti", "sandali"]),
      pantaloni: pick(OPZ.pantaloni), scarpe: pick(OPZ.scarpe), colAcc: pick(OPZ.colAcc),
      occG: uno([-1, 0, 0, 1]), occD: uno([-1, 0, 0, 1]), occA: 0, soprA: uno([0, 0, 1]), nasoG: uno([-1, 0, 0, 1]), boccaA: 0,
      cappello: pick([0, 0, 0, 1]) ? uno(OPZ.cappello.slice(1, 12)) : "nessuno", occhiali: pick([0, 0, 0, 1]) ? uno(OPZ.occhiali.slice(1)) : "nessuno",
      orecchini: donna && pick([0, 1]) ? uno(OPZ.orecchini.slice(1)) : "nessuno", collo: pick([0, 0, 0, 1]) ? uno(OPZ.collo.slice(1)) : "nessuno",
      colCollo: pick(OPZ.colCollo) };
  }

  window.SGOmino = { svg: svg, el: el, casuale: casuale, norm: norm, OPZ: OPZ, BASE: BASE, NOMI: NOMI, LIBERI: LIBERI, BLOCCATI: BLOCCATI, GRUPPI_CAPELLI: GRUPPI_CAPELLI };
})();

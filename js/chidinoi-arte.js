/* =========================================================
   «Chi di Noi?» — I DISEGNI (scene dei 20 posti, costumi, personaggi pronti, facce)
   window.SG_CDN_ARTE:
   - faccia(p, o)       -> src per <img>: LA FACCIA di un giocatore (punto unico).
                           Oggi l'avatar del profilo (busto); domani (passo B) la foto col filtro:
                           se SG_CDN_ARTE.foto(p.id, o) torna un src, si usa quello.
                           p = { id, nome, omino }   o = { posto, faccia, piu, intero }
   - persona(carta, seme) -> src del personaggio pronto (carta "persona" delle Immagini)
   - scena(idPosto, w, h) -> canvas con la scena del posto (fatto una volta e tenuto da parte)
   - scenaSrc(idPosto)  -> la stessa scena come immagine (per <img> e sfondi)
   - COSTUMI, PERSONAGGI, FACCE, FESTA (adesivi del gran finale)
   Animazioni: niente qui dentro (solo immagini ferme).
   ========================================================= */
(function () {
  "use strict";

  // ---------- i costumi di chi è sotto torchio, posto per posto (solo pezzi che l'avatar ha già) ----------
  var COSTUMI = {
    prigione: { capo: "maglietta", maglia: 9, stampa: "righe" },
    bosco: { cappello: "pescatore", capo: "felpa", maglia: 2 },
    treno: { occhiali: "mascherina", capo: "felpa", maglia: 1 },
    villa: { cappello: "aureola", capo: "maglione", maglia: 7 },
    isola: { cappello: "paglia", capo: "canotta", maglia: 6 },
    matrimonio: { capo: "giacca", cappello: "cilindro", maglia: 7, collo: "papillon" },
    pranzo: { capo: "grembiule", maglia: 0 },
    condominio: { capo: "maglione", modScarpe: "pantofole", maglia: 3 },
    sagra: { cappello: "coppola", capo: "camicia", stampa: "quadri", maglia: 0 },
    pronto: { segno: "cerotto", capo: "maglietta", maglia: 6 },
    crociera: { occhiali: "sole", capo: "camicia", stampa: "fiori", maglia: 1 },
    reality: { occhiali: "stelle", capo: "giacca", maglia: 5 },
    gita: { cappello: "cappellino", capo: "felpa", maglia: 3 },
    spiaggia: { occhiali: "sole", capo: "canotta", modScarpe: "infradito", maglia: 0 },
    appuntamento: { occhiali: "cuore", capo: "camicia", maglia: 0 },
    calcetto: { capo: "calcio", stampa: "numero", sotto: "pantaloncini", cappello: "fascia", maglia: 1 },
    sabato: { capo: "giacca", occhiali: "stelle", maglia: 4 },
    ufficio: { capo: "camicia", collo: "cravatta", occhiali: "quadrati", maglia: 8 },
    compleanno: { cappello: "festa", mano: "palloncino", capo: "maglietta", stampa: "stella", maglia: 5 },
    macchina: { occhiali: "aviatore", cappello: "cappellino", capo: "polo", maglia: 6 }
  };

  // ---------- i personaggi pronti (carte "persona"): f = forma fissa ("donna"/"uomo"), il resto è il costume ----------
  var PERSONAGGI = {
    nonna: { f: "donna", c: { capelli: "chignon", colCap: 6, capo: "cardigan", maglia: 5, collo: "perle", segno: "rughe" } },
    nonno: { f: "uomo", c: { capelli: "stempiato", colCap: 6, barba: "baffi", capo: "gilet", cappello: "coppola", segno: "rughe", maglia: 7 } },
    mamma: { f: "donna", c: { capo: "grembiule", maglia: 5 } },
    papa: { f: "uomo", c: { capo: "polo", occhiali: "sole", maglia: 1 } },
    zia: { f: "donna", c: { capelli: "boccoli", capo: "vestito", maglia: 4, collo: "perle", borsa: "borsetta" } },
    zio: { f: "uomo", c: { capo: "camicia", cappello: "borsalino", maglia: 8, barba: "baffi" } },
    bimbo: { c: { capo: "maglietta", stampa: "stella", cappello: "cappellino", mano: "palloncino", barba: "no", corpo: "snello", maglia: 3 } },
    cugino: { c: { capo: "felpa", collo: "cuffiecollo", maglia: 7 } },
    vicino: { c: { capo: "maglione", modScarpe: "pantofole", cappello: "mollette", maglia: 2 } },
    detenuto: { c: { capo: "maglietta", maglia: 9, stampa: "righe" } },
    secondino: { c: { capo: "camicia", maglia: 1, cappello: "visiera", collo: "fischietto" } },
    poliziotto: { c: { capo: "camicia", maglia: 1, cappello: "visiera", occhiali: "aviatore" } },
    giudice: { c: { capo: "giacca", maglia: 7, collo: "papillon", mano: "libro" } },
    avvocato: { c: { capo: "giacca", maglia: 7, collo: "cravatta", borsa: "tracolla" } },
    vigile: { c: { capo: "giacca", maglia: 8, cappello: "visiera", collo: "fischietto" } },
    cuoco: { c: { cappello: "chef", capo: "grembiule", maglia: 8 } },
    cameriere: { c: { capo: "camicia", maglia: 8, collo: "papillon" } },
    dottore: { c: { capo: "cappotto", maglia: 8, occhiali: "tondi", collo: "nessuno" } },
    infermiere: { c: { capo: "maglietta", maglia: 6 } },
    prof: { c: { capo: "cardigan", occhiali: "quadrati", mano: "libro", maglia: 3 } },
    bidello: { c: { capo: "grembiule", maglia: 7, cappello: "nessuno" } },
    controllore: { c: { capo: "giacca", maglia: 1, cappello: "visiera" } },
    autista: { c: { capo: "camicia", occhiali: "aviatore", maglia: 1 } },
    corriere: { c: { cappello: "cappellino", borsa: "tracolla", capo: "polo", maglia: 3 } },
    capo: { c: { capo: "giacca", collo: "cravatta", mano: "tazza", maglia: 7 } },
    impiegato: { c: { capo: "camicia", collo: "cravatta", occhiali: "quadrati", maglia: 1 } },
    contadino: { c: { cappello: "paglia", capo: "camicia", stampa: "quadri", maglia: 0 } },
    meccanico: { c: { capo: "sportiva", sotto: "tuta", cappello: "cappellino", maglia: 1 } },
    cantante: { c: { mano: "microfono", occhiali: "stelle", capo: "giacca", maglia: 5 } },
    rockstar: { c: { schiena: "chitarra", capo: "bomber", occhiali: "sole", maglia: 7 } },
    dj: { c: { cappello: "cuffie", occhiali: "sole", capo: "felpa", maglia: 4 } },
    ballerino: { c: { capo: "gilet", collo: "papillon", maglia: 0 } },
    animatore: { c: { capo: "maglietta", stampa: "smile", collo: "fischietto", maglia: 3 } },
    clown: { c: { pittura: "clown", cappello: "festa", capo: "maglietta", stampa: "pois", maglia: 0 } },
    mago: { c: { cappello: "mago", schiena: "mantello", mano: "bacchetta", maglia: 4 } },
    presentatore: { c: { capo: "giacca", collo: "papillon", mano: "microfono", maglia: 4 } },
    influencer: { c: { mano: "telefono", occhiali: "cuore", capo: "crop", maglia: 5 } },
    sposo: { c: { capo: "giacca", cappello: "cilindro", maglia: 7, collo: "papillon" }, d: { capo: "vestitolungo", maglia: 8, cappello: "tiara", collo: "perle" } },
    elegante: { c: { capo: "giacca", collo: "cravatta", maglia: 1 }, d: { capo: "vestito", collo: "perle", maglia: 0 } },
    buttafuori: { c: { capo: "maglietta", maglia: 7, occhiali: "sole" } },
    calciatore: { c: { capo: "calcio", stampa: "numero", mano: "pallone", sotto: "pantaloncini", maglia: 0 } },
    arbitro: { c: { capo: "maglietta", maglia: 7, collo: "fischietto" } },
    allenatore: { c: { capo: "sportiva", cappello: "cappellino", collo: "fischietto", maglia: 2 } },
    bagnino: { c: { capo: "canotta", maglia: 0, collo: "fischietto", occhiali: "sole" } },
    capitano: { c: { capo: "giacca", maglia: 8, cappello: "visiera" } },
    pirata: { c: { cappello: "pirata", occhiali: "benda", capo: "camicia", maglia: 8 } },
    pescatore: { c: { cappello: "pescatore", capo: "gilet", maglia: 2 } },
    scout: { c: { collo: "foulard", schiena: "zaino", cappello: "cowboy", capo: "camicia", maglia: 2 } },
    turista: { c: { capo: "camicia", stampa: "fiori", cappello: "paglia", mano: "telefono", maglia: 6 } },
    cowboy: { c: { cappello: "cowboy", collo: "bandana", capo: "camicia", stampa: "quadri", maglia: 0 } },
    vichingo: { c: { cappello: "vichingo", capo: "gilet", maglia: 9 } },
    supereroe: { c: { capo: "supereroe", schiena: "mantello", maglia: 1 } },
    re: { c: { cappello: "corona", schiena: "mantello", capo: "giacca", maglia: 4 } },
    babbo: { f: "uomo", c: { cappello: "babbo", barba: "barbalunga", colCap: 11, capo: "cappotto", maglia: 0 } }
  };

  // ---------- le 16 facce (occhi, bocca, sopracciglia, braccia) ----------
  var FACCE = {
    felice: { occhi: "felici", bocca: "sorrisone", sopracc: "morbide" },
    estasi: { occhi: "stelline", bocca: "risata", sopracc: "alzate", braccia: "su" },
    innamorato: { occhi: "stelline", bocca: "baciotto", sopracc: "arcuate", guance: "rosse" },
    finto: { occhi: "tondi", bocca: "nervoso", sopracc: "preoccupate" },
    furbo: { occhi: "furbi", bocca: "ghigno", sopracc: "arcuate" },
    sorpreso: { occhi: "grandi", bocca: "o", sopracc: "alzate" },
    linguaccia: { occhi: "occhiolino", bocca: "linguaccia", sopracc: "alzate" },
    esulta: { occhi: "chiusi", bocca: "risata", sopracc: "alzate", braccia: "su" },
    terrore: { occhi: "grandi", bocca: "nervoso", sopracc: "preoccupate" },
    disgusto: { occhi: "assonnati", bocca: "smorfia", sopracc: "unite" },
    arrabbiato: { occhi: "furbi", bocca: "dentoni", sopracc: "arrabbiate" },
    triste: { occhi: "tristi", bocca: "triste", sopracc: "preoccupate" },
    sonno: { occhi: "assonnati", bocca: "neutro", sopracc: "morbide" },
    imbarazzo: { occhi: "chiusi", bocca: "mordilabbro", sopracc: "preoccupate", guance: "rosse" },
    indifferente: { occhi: "puntini", bocca: "neutro", sopracc: "dritte" },
    pensieroso: { occhi: "tondi", bocca: "sorrisetto", sopracc: "alzate" }
  };
  // con la foto (passo B) la faccia diventa un adesivo sopra il viso
  var FACCE_EMOJI = { felice: "😄", estasi: "😍", innamorato: "😍", finto: "🙂", furbo: "😏", sorpreso: "😮", linguaccia: "😜", esulta: "🎉",
    terrore: "😱", disgusto: "🤢", arrabbiato: "😤", triste: "😢", sonno: "😴", imbarazzo: "😳", indifferente: "😐", pensieroso: "🤔" };

  // gli adesivi del gran finale «Passa il ritratto!»
  var FESTA = "👑🎩🕶️🥸🎀💄🦄🐱🐶🌈⭐💥🔥❤️💬🎈🍕🦖";

  var PIU_OK = { cappello: 1, occhiali: 1, collo: 1, mano: 1, schiena: 1, animale: 1, pittura: 1, stampa: 1 };
  function copia(o) { var c = {}; for (var k in o) c[k] = o[k]; return c; }
  function metti(c, o) { if (o) for (var k in o) if (o[k] != null) c[k] = o[k]; return c; }
  function piuOk(piu) { var r = {}; if (piu) for (var k in piu) if (PIU_OK[k] && window.SGOmino && SGOmino.OPZ[k] && SGOmino.OPZ[k].indexOf(piu[k]) >= 0) r[k] = piu[k]; return r; }
  var CACHE = {}, NC = 0;
  function svgSrc(cfg, opz) {
    var k = JSON.stringify(cfg) + "|" + JSON.stringify(opz || {});
    if (CACHE[k] != null) return CACHE[k];
    if (++NC > 600) { CACHE = {}; NC = 0; }
    var s = "";
    try { s = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(cfg, opz || { busto: true })); } catch (e) { s = ""; }
    return (CACHE[k] = s);
  }

  // =========================================================
  //  LA FACCIA DI UN GIOCATORE — il punto unico dove si attacca la foto vera
  //  o.posto: id del posto (mette il costume), o.faccia: espressione, o.piu: pezzi in più, o.intero: avatar intero (non solo busto)
  // =========================================================
  function faccia(p, o) {
    o = o || {}; p = p || {};
    var A = window.SG_CDN_ARTE;
    if (A && typeof A.foto === "function") { try { var f = A.foto(p.id, o, p); if (f) return f; } catch (e) {} }   // la foto col filtro (js/chidinoi-foto.js)
    if (!window.SGOmino) return "";
    var cfg = copia(p.omino && typeof p.omino === "object" ? p.omino : SGOmino.casuale(p.nome || p.id || "?"));
    var fx = o.faccia && FACCE[o.faccia], br = null;
    if (o.posto && COSTUMI[o.posto]) { var cs = copia(COSTUMI[o.posto]); if (fx) delete cs.occhiali; metti(cfg, cs); }   // con una faccia da mostrare, gli occhiali del costume non coprono gli occhi
    if (fx) { metti(cfg, { occhi: fx.occhi, bocca: fx.bocca, sopracc: fx.sopracc }); if (fx.guance) cfg.guance = fx.guance; br = fx.braccia || null; }
    metti(cfg, piuOk(o.piu));
    var opz = o.intero ? {} : { busto: true };
    if (br && o.intero) opz.braccia = br;
    return svgSrc(cfg, opz);
  }
  // un personaggio pronto: viso e capelli dal seme (uguale su tutti i telefoni), costume fisso, faccia e pezzi in più
  function persona(carta, seme) {
    if (!window.SGOmino) return "";
    var P = PERSONAGGI[carta.chi] || PERSONAGGI.cugino;
    var forma = P.f || (carta.f === "d" ? "donna" : carta.f === "u" ? "uomo" : (hash(seme) % 2 ? "donna" : "uomo"));
    var cfg = copia(SGOmino.casuale(String(seme), forma));
    ["cappello", "occhiali", "collo", "mano", "schiena", "animale", "pittura", "borsa"].forEach(function (k) { cfg[k] = k === "borsa" ? "nessuna" : (k === "schiena" || k === "pittura" ? "nessuna" : "nessuno"); });
    cfg.stampa = "nessuna";
    metti(cfg, forma === "donna" && P.d ? P.d : P.c);
    if (forma === "donna") cfg.barba = "no";
    var fx = carta.faccia && FACCE[carta.faccia];
    if (fx) { metti(cfg, { occhi: fx.occhi, bocca: fx.bocca, sopracc: fx.sopracc }); if (fx.guance) cfg.guance = fx.guance; }
    metti(cfg, piuOk(carta.piu));
    return svgSrc(cfg, { busto: true });
  }
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // =========================================================
  //  LE SCENE (sfondi su canvas, disegnati una volta e tenuti)
  // =========================================================
  function em(c, e, x, y, s, rot) {
    c.save(); c.translate(x, y); if (rot) c.rotate(rot);
    c.font = Math.round(s) + "px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
    c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(e, 0, 0); c.restore();
  }
  function gv(c, w, h, cols, x0, y0, x1, y1) {
    var g = c.createLinearGradient(x0 == null ? 0 : x0, y0 == null ? 0 : y0, x1 == null ? 0 : x1, y1 == null ? h : y1);
    cols.forEach(function (k, i) { g.addColorStop(i / (cols.length - 1), k); });
    return g;
  }
  function rett(c, x, y, w, h, col, r) {
    c.fillStyle = col; c.beginPath();
    if (r && c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
    c.fill();
  }
  function cerchio(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
  function bagliore(c, x, y, r, col) {
    var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function pavimento(c, w, h, y, col1, col2) { c.fillStyle = gv(c, w, h, [col1, col2], 0, y, 0, h); c.fillRect(0, y, w, h - y); }
  function lucine(c, w, y, n, cols, r) {
    c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = Math.max(1, r * 0.3); c.beginPath(); c.moveTo(0, y);
    for (var i = 0; i <= n; i++) c.quadraticCurveTo((i - 0.5) * w / n, y + r * 3, i * w / n, y);
    c.stroke();
    for (var j = 0; j < n; j++) { var x = (j + 0.5) * w / n, yy = y + r * 1.6; bagliore(c, x, yy, r * 3.2, cols[j % cols.length] + "88"); cerchio(c, x, yy, r, cols[j % cols.length]); }
  }

  // ogni pittore riceve (c, w, h, m) con m = min(w, h): disegna in proporzione
  var SCENE = {
    prigione: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#6d8099", "#3a4a61"]); c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(255,255,255,.08)"; c.lineWidth = 2;
      for (var y = 0; y < h * 0.72; y += m * 0.07) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); for (var x = (y / (m * 0.07)) % 2 ? 0 : m * 0.07; x < w; x += m * 0.14) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + m * 0.07); c.stroke(); } }
      rett(c, w * 0.62, h * 0.1, w * 0.26, h * 0.2, "#1b2a4a", 6); em(c, "🌙", w * 0.75, h * 0.2, m * 0.11);
      c.fillStyle = "#4b5563"; for (var i = 1; i < 5; i++) c.fillRect(w * 0.62 + i * w * 0.052 - 3, h * 0.1, 6, h * 0.2);
      pavimento(c, w, h, h * 0.72, "#525c6b", "#2d333d");
      em(c, "🛏️", w * 0.25, h * 0.7, m * 0.3); em(c, "🚽", w * 0.84, h * 0.76, m * 0.13);
      c.fillStyle = "rgba(30,36,46,.85)"; [0.02, 0.97].forEach(function (f) { c.fillRect(w * f - 5, 0, 10, h); });
    },
    bosco: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#4b2a6b", "#c4507a", "#ff9a4d"], 0, 0, 0, h * 0.7); c.fillRect(0, 0, w, h);
      cerchio(c, w * 0.7, h * 0.52, m * 0.14, "#ffd27a"); bagliore(c, w * 0.7, h * 0.52, m * 0.35, "rgba(255,210,122,.5)");
      c.fillStyle = "#2a1f3d";
      for (var i = 0; i < 9; i++) { var x = i * w / 8 + (i % 2) * w * 0.03, hh = h * (0.3 + (i * 37 % 13) / 40); c.beginPath(); c.moveTo(x, h * 0.75 - hh); c.lineTo(x - m * 0.09, h * 0.76); c.lineTo(x + m * 0.09, h * 0.76); c.fill(); }
      pavimento(c, w, h, h * 0.74, "#2f5a33", "#16301a");
      em(c, "⛺", w * 0.28, h * 0.74, m * 0.3); em(c, "🔥", w * 0.66, h * 0.84, m * 0.14); bagliore(c, w * 0.66, h * 0.84, m * 0.22, "rgba(255,150,40,.45)");
    },
    treno: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#22305a", "#141c3a"]); c.fillRect(0, 0, w, h);
      rett(c, w * 0.12, h * 0.1, w * 0.76, h * 0.34, "#0a0f24", m * 0.04);
      for (var i = 0; i < 26; i++) { var x = w * 0.14 + (i * 97 % 70) / 100 * w, y = h * 0.14 + (i * 53 % 26) / 100 * h; c.fillStyle = i % 3 ? "rgba(255,214,120,.9)" : "rgba(140,190,255,.8)"; c.fillRect(x, y, m * 0.05, 2); }
      c.strokeStyle = "#8d6e4c"; c.lineWidth = m * 0.02; c.strokeRect(w * 0.12, h * 0.1, w * 0.76, h * 0.34);
      rett(c, 0, h * 0.5, w * 0.48, h * 0.1, "#6d4c3a", 6); rett(c, 0, h * 0.74, w * 0.48, h * 0.1, "#6d4c3a", 6);
      rett(c, w * 0.02, h * 0.47, w * 0.42, h * 0.05, "#e6e1d6", 8); rett(c, w * 0.02, h * 0.71, w * 0.42, h * 0.05, "#e6e1d6", 8);
      pavimento(c, w, h, h * 0.86, "#3a2f2a", "#231c18");
      em(c, "🧳", w * 0.78, h * 0.78, m * 0.18); em(c, "🧸", w * 0.18, h * 0.44, m * 0.09);
    },
    villa: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#2b1840", "#3e2a5c", "#1f3a33"]); c.fillRect(0, 0, w, h);
      c.fillStyle = "#1a0f26"; c.beginPath(); c.moveTo(0, 0); c.lineTo(w / 2, h * 0.08); c.lineTo(w, 0); c.lineTo(w, h * 0.04); c.lineTo(w / 2, h * 0.14); c.lineTo(0, h * 0.04); c.fill();
      bagliore(c, w * 0.5, h * 0.35, m * 0.45, "rgba(170,255,190,.18)");
      em(c, "🕸️", w * 0.1, h * 0.1, m * 0.2); em(c, "🕸️", w * 0.9, h * 0.12, m * 0.16, 1.2);
      pavimento(c, w, h, h * 0.75, "#3b2a2a", "#1c1414");
      em(c, "🕯️", w * 0.22, h * 0.66, m * 0.18); bagliore(c, w * 0.22, h * 0.58, m * 0.2, "rgba(255,200,90,.45)");
      em(c, "🪞", w * 0.72, h * 0.55, m * 0.28); em(c, "🦇", w * 0.55, h * 0.2, m * 0.1, -0.3);
    },
    isola: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#4fc3f7", "#b3ecff"], 0, 0, 0, h * 0.55); c.fillRect(0, 0, w, h);
      cerchio(c, w * 0.82, h * 0.14, m * 0.08, "#fff6b0"); bagliore(c, w * 0.82, h * 0.14, m * 0.25, "rgba(255,246,176,.6)");
      c.fillStyle = gv(c, w, h, ["#1e88c8", "#0d5b99"], 0, h * 0.5, 0, h * 0.72); c.fillRect(0, h * 0.5, w, h * 0.24);
      c.strokeStyle = "rgba(255,255,255,.6)"; c.lineWidth = 2; for (var i = 0; i < 6; i++) { c.beginPath(); var y = h * (0.55 + i * 0.03); c.moveTo(w * ((i * 31) % 70) / 100, y); c.lineTo(w * ((i * 31) % 70) / 100 + w * 0.15, y); c.stroke(); }
      c.fillStyle = gv(c, w, h, ["#ffe7a8", "#e9c27a"], 0, h * 0.7, 0, h); c.beginPath(); c.moveTo(0, h * 0.74); c.quadraticCurveTo(w / 2, h * 0.64, w, h * 0.74); c.lineTo(w, h); c.lineTo(0, h); c.fill();
      em(c, "🌴", w * 0.22, h * 0.56, m * 0.42); em(c, "🐚", w * 0.7, h * 0.86, m * 0.09); em(c, "🦀", w * 0.84, h * 0.8, m * 0.1);
    },
    matrimonio: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#fffaf0", "#f3e3c3"]); c.fillRect(0, 0, w, h);
      c.strokeStyle = "#e3c27a"; c.lineWidth = m * 0.025; c.beginPath(); c.arc(w / 2, h * 0.5, w * 0.38, Math.PI, 0); c.stroke();
      for (var i = 0; i <= 10; i++) { var a = Math.PI + i * Math.PI / 10; em(c, i % 2 ? "🌸" : "🌼", w / 2 + Math.cos(a) * w * 0.38, h * 0.5 + Math.sin(a) * w * 0.38, m * 0.08); }
      pavimento(c, w, h, h * 0.7, "#e8d6b0", "#cdb383");
      rett(c, w * 0.05, h * 0.66, w * 0.9, h * 0.07, "#ffffff", 8);
      em(c, "🎂", w * 0.5, h * 0.6, m * 0.24); em(c, "🥂", w * 0.2, h * 0.63, m * 0.09); em(c, "💐", w * 0.8, h * 0.62, m * 0.1);
    },
    pranzo: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#f6d9a8", "#e8b97a"]); c.fillRect(0, 0, w, h);
      em(c, "🕰️", w * 0.82, h * 0.22, m * 0.2); rett(c, w * 0.08, h * 0.12, w * 0.3, h * 0.2, "#b98a5a", 6); em(c, "🖼️", w * 0.23, h * 0.22, m * 0.12);
      var y0 = h * 0.62, q = m * 0.07; c.fillStyle = "#fff"; c.fillRect(0, y0, w, h - y0);
      c.fillStyle = "#d63a3a"; for (var y = y0; y < h; y += q) for (var x = ((y - y0) / q) % 2 ? 0 : q; x < w; x += q * 2) c.fillRect(x, y, q, q);
      em(c, "🍝", w * 0.45, h * 0.7, m * 0.26); c.fillStyle = "rgba(255,255,255,.55)"; for (var i = 0; i < 3; i++) { c.beginPath(); c.ellipse(w * (0.4 + i * 0.05), h * (0.52 - i * 0.02), m * 0.015, m * 0.05, 0.3, 0, Math.PI * 2); c.fill(); }
      em(c, "🥖", w * 0.8, h * 0.76, m * 0.13);
    },
    condominio: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#d9d2c3", "#b8ae9a"]); c.fillRect(0, 0, w, h);
      rett(c, w * 0.62, h * 0.12, w * 0.3, h * 0.62, "#8a8f98", 6); c.fillStyle = "#6c717a"; c.fillRect(w * 0.77 - 2, h * 0.14, 4, h * 0.58); em(c, "🔼", w * 0.58, h * 0.4, m * 0.06);
      for (var i = 0; i < 6; i++) rett(c, w * (0.06 + (i % 3) * 0.12), h * (0.2 + Math.floor(i / 3) * 0.1), w * 0.1, h * 0.08, "#c58a3c", 4);
      rett(c, w * 0.08, h * 0.45, w * 0.32, h * 0.16, "#7a5a3a", 4); rett(c, w * 0.1, h * 0.47, w * 0.28, h * 0.12, "#f1e6c8", 3);
      em(c, "📌", w * 0.15, h * 0.49, m * 0.05); em(c, "📄", w * 0.28, h * 0.53, m * 0.07);
      pavimento(c, w, h, h * 0.75, "#a0522d", "#6e3820");
      c.strokeStyle = "rgba(0,0,0,.25)"; for (var s = 0; s < 4; s++) { c.beginPath(); c.moveTo(0, h * (0.78 + s * 0.06)); c.lineTo(w * 0.4, h * (0.78 + s * 0.06)); c.stroke(); }
      em(c, "🪴", w * 0.5, h * 0.72, m * 0.14);
    },
    sagra: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#121a44", "#3a1f5c"]); c.fillRect(0, 0, w, h);
      em(c, "🎡", w * 0.72, h * 0.38, m * 0.5); bagliore(c, w * 0.72, h * 0.38, m * 0.4, "rgba(255,120,200,.22)");
      lucine(c, w, h * 0.06, 9, ["#ff6b6b", "#ffd43b", "#69db7c", "#4dabf7", "#f783ac"], m * 0.018);
      pavimento(c, w, h, h * 0.72, "#4a3b2a", "#2a2018");
      rett(c, w * 0.04, h * 0.5, w * 0.36, h * 0.24, "#c92a2a", 6); c.fillStyle = "#fff"; for (var i = 0; i < 6; i++) c.fillRect(w * 0.04 + i * w * 0.06, h * 0.5, w * 0.03, h * 0.05);
      em(c, "🌭", w * 0.14, h * 0.65, m * 0.1); em(c, "🍭", w * 0.3, h * 0.65, m * 0.1); em(c, "🎈", w * 0.48, h * 0.3, m * 0.12);
    },
    pronto: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#e9fbf6", "#bfe9df"]); c.fillRect(0, 0, w, h);
      rett(c, w * 0.32, h * 0.08, w * 0.36, h * 0.14, "#173b3a", 8); c.fillStyle = "#ff5d5d"; c.font = "bold " + Math.round(m * 0.1) + "px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("N° 87", w * 0.5, h * 0.15);
      c.fillStyle = "#3aa58f"; c.fillRect(0, h * 0.4, w, h * 0.03);
      pavimento(c, w, h, h * 0.72, "#d5e7e2", "#a9c9c1");
      for (var i = 0; i < 5; i++) { rett(c, w * (0.04 + i * 0.19), h * 0.6, w * 0.16, h * 0.08, "#2b8a7a", 6); rett(c, w * (0.04 + i * 0.19), h * 0.5, w * 0.16, h * 0.11, "#35a593", 6); }
      em(c, "🚑", w * 0.84, h * 0.3, m * 0.14); em(c, "🩹", w * 0.16, h * 0.3, m * 0.1);
    },
    crociera: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#6fc8ff", "#e6f7ff"], 0, 0, 0, h * 0.45); c.fillRect(0, 0, w, h);
      c.fillStyle = "#0d4f8b"; c.fillRect(0, h * 0.4, w, h * 0.1);
      rett(c, 0, h * 0.48, w, h * 0.52, "#ffffff"); c.fillStyle = "#1c4f9c"; c.fillRect(0, h * 0.48, w, h * 0.02);
      for (var i = 0; i < 4; i++) { cerchio(c, w * (0.14 + i * 0.24), h * 0.6, m * 0.06, "#1c4f9c"); cerchio(c, w * (0.14 + i * 0.24), h * 0.6, m * 0.045, "#7fd0ff"); }
      rett(c, w * 0.1, h * 0.78, w * 0.8, h * 0.12, "#3ec6e0", 30);
      em(c, "🛟", w * 0.9, h * 0.32, m * 0.12); em(c, "⚓", w * 0.08, h * 0.32, m * 0.1); em(c, "🐬", w * 0.5, h * 0.42, m * 0.1);
    },
    reality: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#1d0b38", "#43106b"]); c.fillRect(0, 0, w, h);
      [[0.2, "#e64980"], [0.5, "#845ef7"], [0.8, "#22b8cf"]].forEach(function (s) {
        c.fillStyle = s[1] + "33"; c.beginPath(); c.moveTo(w * s[0] - m * 0.03, 0); c.lineTo(w * s[0] + m * 0.03, 0); c.lineTo(w * s[0] + m * 0.22, h * 0.8); c.lineTo(w * s[0] - m * 0.22, h * 0.8); c.fill();
      });
      pavimento(c, w, h, h * 0.74, "#2b1450", "#150828");
      em(c, "🛋️", w * 0.5, h * 0.7, m * 0.34); em(c, "🎥", w * 0.1, h * 0.25, m * 0.14); em(c, "🎥", w * 0.9, h * 0.25, m * 0.14, 0);
      em(c, "🌟", w * 0.5, h * 0.12, m * 0.1);
    },
    gita: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#8fd3ff", "#e8f7ff"]); c.fillRect(0, 0, w, h);
      rett(c, w * 0.52, h * 0.16, w * 0.44, h * 0.08, "#e9e2d0"); c.fillStyle = "#e9e2d0"; c.beginPath(); c.moveTo(w * 0.5, h * 0.17); c.lineTo(w * 0.74, h * 0.06); c.lineTo(w * 0.98, h * 0.17); c.fill();
      for (var i = 0; i < 4; i++) rett(c, w * (0.55 + i * 0.11), h * 0.24, w * 0.05, h * 0.38, "#f4efe2");
      pavimento(c, w, h, h * 0.62, "#a9a9a9", "#6d6d6d");
      em(c, "🚌", w * 0.26, h * 0.62, m * 0.42); em(c, "🗿", w * 0.86, h * 0.72, m * 0.14);
    },
    spiaggia: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#58c4ff", "#c9f0ff"], 0, 0, 0, h * 0.4); c.fillRect(0, 0, w, h);
      cerchio(c, w * 0.15, h * 0.14, m * 0.09, "#ffe066"); bagliore(c, w * 0.15, h * 0.14, m * 0.3, "rgba(255,224,102,.6)");
      c.fillStyle = "#1c9bd6"; c.fillRect(0, h * 0.36, w, h * 0.1);
      pavimento(c, w, h, h * 0.45, "#ffe3a3", "#f0c06e");
      [[0.14, 0.58], [0.38, 0.54], [0.62, 0.58], [0.86, 0.54], [0.26, 0.78], [0.52, 0.8], [0.78, 0.78]].forEach(function (p, i) { em(c, "⛱️", w * p[0], h * p[1], m * (0.16 + (i > 3 ? 0.05 : 0))); });
      em(c, "🍉", w * 0.9, h * 0.92, m * 0.1);
    },
    appuntamento: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#4a0d22", "#9c2a4a"]); c.fillRect(0, 0, w, h);
      bagliore(c, w * 0.5, h * 0.56, m * 0.5, "rgba(255,190,120,.35)");
      for (var i = 0; i < 14; i++) em(c, "✨", w * ((i * 37) % 100) / 100, h * ((i * 23) % 40) / 100, m * 0.04);
      rett(c, w * 0.14, h * 0.66, w * 0.72, h * 0.06, "#f8f0e3", 10); c.fillStyle = "#5c2b1b"; c.fillRect(w * 0.48, h * 0.72, w * 0.04, h * 0.28);
      em(c, "🕯️", w * 0.5, h * 0.58, m * 0.16); em(c, "🌹", w * 0.3, h * 0.63, m * 0.09); em(c, "🎻", w * 0.85, h * 0.4, m * 0.2, 0.3);
    },
    calcetto: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#0b1630", "#1b2f55"]); c.fillRect(0, 0, w, h);
      [[0.08, 0.06], [0.92, 0.06]].forEach(function (p) { bagliore(c, w * p[0], h * p[1], m * 0.45, "rgba(255,255,220,.35)"); cerchio(c, w * p[0], h * p[1], m * 0.03, "#fffbe0"); });
      pavimento(c, w, h, h * 0.5, "#2fa84f", "#1d7a36");
      c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 3; c.beginPath(); c.ellipse(w / 2, h * 0.78, w * 0.22, h * 0.07, 0, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = "#fff"; c.lineWidth = m * 0.015; c.strokeRect(w * 0.32, h * 0.32, w * 0.36, h * 0.2);
      c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 1; for (var i = 1; i < 8; i++) { c.beginPath(); c.moveTo(w * 0.32 + i * w * 0.045, h * 0.32); c.lineTo(w * 0.32 + i * w * 0.045, h * 0.52); c.stroke(); }
      em(c, "⚽", w * 0.62, h * 0.84, m * 0.1); em(c, "🎽", w * 0.1, h * 0.6, m * 0.1);
    },
    sabato: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#13063a", "#2a0d5e", "#0c2a5e"]); c.fillRect(0, 0, w, h);
      ["#ff4fd8", "#4fd8ff", "#ffe14f", "#7a5cff"].forEach(function (k, i) { c.fillStyle = k + "2e"; c.beginPath(); c.moveTo(w / 2, h * 0.16); c.lineTo(w * (i * 0.33 - 0.1), h); c.lineTo(w * (i * 0.33 + 0.08), h); c.fill(); });
      em(c, "🪩", w / 2, h * 0.16, m * 0.2); bagliore(c, w / 2, h * 0.16, m * 0.3, "rgba(255,255,255,.3)");
      pavimento(c, w, h, h * 0.78, "#1a0f33", "#0a0618");
      for (var i = 0; i < 12; i++) rett(c, w * (i / 12), h * 0.78, w / 12 - 2, h * 0.04, ["#ff4fd8", "#4fd8ff", "#ffe14f"][i % 3] + "88");
      rett(c, w * 0.7, h * 0.36, w * 0.26, h * 0.1, "#ff922b", 6); c.fillStyle = "#fff"; c.font = "bold " + Math.round(m * 0.05) + "px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("PIZZA 24h", w * 0.83, h * 0.41);
    },
    ufficio: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#e9eef2", "#c9d3db"]); c.fillRect(0, 0, w, h);
      for (var i = 0; i < 3; i++) { rett(c, w * (0.08 + i * 0.32), h * 0.04, w * 0.22, h * 0.025, "#ffffff"); bagliore(c, w * (0.19 + i * 0.32), h * 0.06, m * 0.18, "rgba(220,240,255,.7)"); }
      rett(c, w * 0.04, h * 0.18, w * 0.3, h * 0.24, "#a9cce3", 6); c.strokeStyle = "#fff"; c.lineWidth = 3; c.strokeRect(w * 0.04, h * 0.18, w * 0.3, h * 0.24);
      pavimento(c, w, h, h * 0.72, "#9aa5ae", "#6f7b85");
      rett(c, w * 0.08, h * 0.6, w * 0.56, h * 0.05, "#d8b48a", 4); c.fillStyle = "#b38f66"; c.fillRect(w * 0.12, h * 0.65, w * 0.03, h * 0.18); c.fillRect(w * 0.57, h * 0.65, w * 0.03, h * 0.18);
      em(c, "💻", w * 0.36, h * 0.55, m * 0.13); em(c, "☕", w * 0.84, h * 0.5, m * 0.16); em(c, "🖨️", w * 0.84, h * 0.76, m * 0.15); em(c, "🪴", w * 0.06, h * 0.7, m * 0.1);
    },
    compleanno: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#fff0f6", "#ffd6e7"]); c.fillRect(0, 0, w, h);
      var cols = ["#ff6b6b", "#ffd43b", "#4dabf7", "#69db7c", "#b197fc"];
      for (var i = 0; i < 10; i++) { c.fillStyle = cols[i % 5]; c.beginPath(); c.moveTo(i * w / 10, h * 0.04); c.lineTo((i + 1) * w / 10, h * 0.04); c.lineTo((i + 0.5) * w / 10, h * 0.12); c.fill(); }
      em(c, "🎈", w * 0.12, h * 0.3, m * 0.16); em(c, "🎈", w * 0.88, h * 0.26, m * 0.14);
      pavimento(c, w, h, h * 0.66, "#ffc9de", "#f5a3c3");
      rett(c, w * 0.1, h * 0.64, w * 0.8, h * 0.06, "#ffffff", 8);
      em(c, "🎂", w * 0.5, h * 0.56, m * 0.24); em(c, "🎁", w * 0.18, h * 0.6, m * 0.1); em(c, "🎁", w * 0.82, h * 0.6, m * 0.12);
    },
    macchina: function (c, w, h, m) {
      c.fillStyle = gv(c, w, h, ["#ff9e5e", "#ffd18a", "#8fc7ff"], 0, 0, 0, h * 0.6); c.fillRect(0, 0, w, h);
      c.fillStyle = "#6a7a5a"; c.beginPath(); c.moveTo(0, h * 0.5); c.lineTo(w, h * 0.46); c.lineTo(w, h * 0.62); c.lineTo(0, h * 0.62); c.fill();
      c.fillStyle = "#4a4a52"; c.beginPath(); c.moveTo(w * 0.46, h * 0.46); c.lineTo(w * 0.54, h * 0.46); c.lineTo(w * 0.9, h * 0.62); c.lineTo(w * 0.1, h * 0.62); c.fill();
      c.strokeStyle = "#ffe066"; c.lineWidth = 3; c.setLineDash([m * 0.03, m * 0.03]); c.beginPath(); c.moveTo(w * 0.5, h * 0.47); c.lineTo(w * 0.5, h * 0.62); c.stroke(); c.setLineDash([]);
      c.fillStyle = "#1f1f26"; c.beginPath(); c.moveTo(0, h * 0.58); c.quadraticCurveTo(w / 2, h * 0.52, w, h * 0.58); c.lineTo(w, h); c.lineTo(0, h); c.fill();
      c.strokeStyle = "#141418"; c.lineWidth = m * 0.035; c.beginPath(); c.arc(w * 0.3, h * 0.8, m * 0.16, 0, Math.PI * 2); c.stroke();
      rett(c, w * 0.62, h * 0.66, w * 0.24, h * 0.12, "#2c7be5", 8); em(c, "🧭", w * 0.74, h * 0.72, m * 0.07);
      c.strokeStyle = "#333"; c.lineWidth = 2; c.beginPath(); c.moveTo(w * 0.5, 0); c.lineTo(w * 0.5, h * 0.1); c.stroke(); em(c, "🌲", w * 0.5, h * 0.15, m * 0.08);
    }
  };
  var SCENE_CACHE = {};
  // la scena del posto in un canvas w×h (tenuto: si disegna una volta)
  function scena(id, w, h) {
    w = Math.round(w || 750); h = Math.round(h || 1000);
    var k = id + "|" + w + "x" + h;
    if (SCENE_CACHE[k]) return SCENE_CACHE[k];
    var cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    var c = cv.getContext("2d");
    try { (SCENE[id] || SCENE.prigione)(c, w, h, Math.min(w, h)); } catch (e) { c.fillStyle = "#334"; c.fillRect(0, 0, w, h); }
    return (SCENE_CACHE[k] = cv);
  }
  var SRC_CACHE = {};
  function scenaSrc(id, w, h) {
    var k = id + "|" + (w || 480) + "x" + (h || 640);
    if (SRC_CACHE[k] != null) return SRC_CACHE[k];
    var s = ""; try { s = scena(id, w || 480, h || 640).toDataURL("image/jpeg", 0.82); } catch (e) {}
    return (SRC_CACHE[k] = s);
  }

  window.SG_CDN_ARTE = {
    COSTUMI: COSTUMI, PERSONAGGI: PERSONAGGI, FACCE: FACCE, FACCE_EMOJI: FACCE_EMOJI, FESTA: FESTA,
    faccia: faccia, persona: persona, scena: scena, scenaSrc: scenaSrc, emoji: em, hash: hash,
    foto: (window.SG_CDN_ARTE && SG_CDN_ARTE.foto) || null   // la riempie js/chidinoi-foto.js: function (id, o, p) → src del ritratto con la foto, o null
  };
})();

/* =========================================================
   😀 IL GETTONE (13 nov 2026, chat «😀 Emoji 3D al posto degli avatar»)
   Al posto degli avatar ognuno ha un gettone: un cerchio col contorno del suo colore e dentro la sua emoji 3D
   (Fluent Emoji 3D di Microsoft, licenza MIT, le immagini in carte/emoji/, la lista in data/emoji-gettone.js).
   La scelta (emoji + 3 colori in ordine) è di ognuno; in una stanza il colore lo decide chi tiene la Sala o la partita
   (vedi SGGettone.assegna): chi è entrato prima tiene il suo 1° colore, l'altro prende il 2°, poi il 3°, poi il primo libero.

   Il gettone viaggia come l'avatar di prima, al posto suo: { g: 1, e: "⚡", c: ["oro", "blu", "verde"], k: "oro" }
     g = è un gettone · e = l'emoji · c = i 3 colori scelti, in ordine · k = il colore deciso nella stanza (se c'è).
   Con gli avatar spenti (GETTONI in core.js) SGGettone.accendi() fa disegnare a SGOmino.svg il gettone: così TUTTI i giochi,
   che disegnano gli avatar con SGOmino.svg / SGOmino.casuale, mostrano i gettoni senza cambiare niente. Un avatar di prima
   (un amico con l'app vecchia ancora aperta) diventa un gettone «di riserva», sempre lo stesso per lo stesso avatar.
   ========================================================= */
(function () {
  "use strict";

  // i colori del contorno: della Notte vivace, accesi e ben diversi tra loro (leggibili sul fondo blu notte)
  var COLORI = [
    { k: "rosso", c: "#ff4d4d", n: "Rosso" },
    { k: "arancio", c: "#ff9a3c", n: "Arancio" },
    { k: "oro", c: "#ffd23f", n: "Oro" },
    { k: "lime", c: "#a6e84a", n: "Lime" },
    { k: "verde", c: "#2fd06f", n: "Verde" },
    { k: "acqua", c: "#2fe0c8", n: "Acqua" },
    { k: "ciano", c: "#48c8ff", n: "Celeste" },
    { k: "blu", c: "#4f7bff", n: "Blu" },
    { k: "viola", c: "#9a6bff", n: "Viola" },
    { k: "magenta", c: "#e05cff", n: "Magenta" },
    { k: "lampone", c: "#ff2e88", n: "Lampone" },
    { k: "bianco", c: "#f2f3fa", n: "Bianco" }
  ];
  var PER_K = {}; COLORI.forEach(function (x) { PER_K[x.k] = x; });
  var GRIGIO = "#8a90ad";   // (solo se un colore non si riconosce)

  // le emoji: quasi tutte quelle di Fluent Emoji 3D (circa 1.500). Il file di ognuna si ricava dall'emoji stessa (i codici
  // esadecimali senza fe0f: ⚡ → 26a1.webp), così l'app non ha bisogno dell'elenco: lo scarica solo la scelta (pezzo «emoji»).
  // RISERVA: poche emoji allegre per il gettone di chi non ha ancora scelto (o manda l'avatar di prima)
  var RISERVA = ["⚡", "😀", "😎", "🤩", "🥳", "🤠", "🤓", "🤖", "👽", "👻", "🐱", "🐶", "🦊", "🐻", "🐼", "🐨", "🦁", "🐯", "🐸", "🐵", "🐧", "🦉", "🦄", "🐙",
    "🐢", "🐬", "🍕", "🍔", "🍩", "🍉", "🍓", "🍿", "⚽", "🏀", "🎾", "🎲", "🎮", "🚀", "🎸", "🎧", "👑", "💎", "🎈", "🌈", "🌻", "🍀", "🌵", "🍄", "🪐", "⭐", "🔥", "🌙"];
  function lista() { return RISERVA.map(function (e) { return { e: e }; }); }
  function codice(e) { var r = []; Array.from(String(e || "")).forEach(function (c) { var h = c.codePointAt(0).toString(16); if (h !== "fe0f") r.push(h); }); return r.join("-"); }
  var RE_EMO = null; try { RE_EMO = new RegExp("\\p{Extended_Pictographic}|\\p{Regional_Indicator}|[#*0-9]\\uFE0F?\\u20E3", "u"); } catch (x) {}
  function emojiOk(e) { return typeof e === "string" && e.length >= 1 && e.length <= 16 && (!RE_EMO || RE_EMO.test(e)); }
  function infoE(e) { return emojiOk(e) ? { e: e, f: codice(e) } : null; }

  // ---- com'è fatto un gettone ----
  function eGettone(cfg) { return !!(cfg && typeof cfg === "object" && cfg.g === 1 && typeof cfg.e === "string"); }
  function coloreOk(k) { return typeof k === "string" && !!PER_K[k]; }
  // pulito: solo i campi che servono, l'emoji tra quelle della lista (se no la prima), i colori validi e diversi (al massimo 3)
  function norm(cfg) {
    if (!eGettone(cfg)) return null;
    var e = emojiOk(cfg.e) ? cfg.e : "⚡";
    var c = [];
    (Array.isArray(cfg.c) ? cfg.c : []).forEach(function (k) { if (coloreOk(k) && c.indexOf(k) < 0 && c.length < 3) c.push(k); });
    var r = { g: 1, e: e, c: c };
    if (coloreOk(cfg.k)) r.k = cfg.k;
    if (cfg.r) r.r = 1;
    return r;
  }
  function hash(s) { s = String(s || ""); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  // il gettone di riserva: per chi non ha ancora scelto (o manda l'avatar di prima). Sempre lo stesso per lo stesso «seme»
  function riserva(seme) {
    var h = hash(seme), e = RISERVA[h % RISERVA.length];
    var c0 = COLORI[(h >>> 8) % COLORI.length].k;
    return { g: 1, e: e, c: [c0], r: 1 };
  }
  // un gettone sempre, da qualunque cosa (gettone, avatar di prima, niente)
  function daQualsiasi(cfg, seme) {
    if (eGettone(cfg)) return norm(cfg);
    if (cfg && typeof cfg === "object") { var s = ""; try { s = JSON.stringify(cfg); } catch (x) {} return riserva(s); }
    return riserva(seme || "?");
  }
  // il colore che si vede: quello deciso nella stanza, se no il primo scelto
  function colore(cfg) {
    var k = cfg && (coloreOk(cfg.k) ? cfg.k : (cfg.c && coloreOk(cfg.c[0]) ? cfg.c[0] : null));
    return k ? PER_K[k].c : GRIGIO;
  }
  function chiaveColore(cfg) { return cfg && (coloreOk(cfg.k) ? cfg.k : (cfg.c && coloreOk(cfg.c[0]) ? cfg.c[0] : null)); }

  // ---- le immagini: in carte/emoji/<f>.webp; quando arrivano si tengono come data URL (così vanno anche dentro
  // gli avatar che i giochi trasformano in immagine: lì un indirizzo esterno non si carica) ----
  var DATI = {}, IN_ARRIVO = {}, VIA = {};
  function url(e) { var i = infoE(e); return i ? "carte/emoji/" + i.f + ".webp" : null; }
  function prepara(e) {
    var i = infoE(e); if (!i || DATI[i.e] || IN_ARRIVO[i.e] || VIA[i.e] || !window.fetch || !window.FileReader) return;
    IN_ARRIVO[i.e] = 1;
    fetch(url(i.e)).then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); }).then(function (b) {
      return new Promise(function (ok, no) { var fr = new FileReader(); fr.onload = function () { ok(fr.result); }; fr.onerror = no; fr.readAsDataURL(b); });
    }).then(function (d) {
      DATI[i.e] = d; delete IN_ARRIVO[i.e];
      rinfresca(i.e);
    }).catch(function () { delete IN_ARRIVO[i.e]; VIA[i.e] = Date.now(); setTimeout(function () { delete VIA[i.e]; }, 60000); });   // (riprova tra un minuto)
  }
  // i gettoni già nella pagina disegnati con l'emoji del telefono (l'immagine non era ancora arrivata): adesso l'immagine
  function rinfresca(e) {
    try {
      [].forEach.call(document.querySelectorAll("svg.gettone[data-gt]"), function (s) {
        if (s.getAttribute("data-gt") !== e || !s.querySelector("text.gt-tx")) return;
        var t = s.querySelector("text.gt-tx"), im = document.createElementNS("http://www.w3.org/2000/svg", "image");
        im.setAttribute("href", DATI[e]); im.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", DATI[e]);
        im.setAttribute("x", t.getAttribute("data-x")); im.setAttribute("y", t.getAttribute("data-y"));
        im.setAttribute("width", t.getAttribute("data-w")); im.setAttribute("height", t.getAttribute("data-w"));
        t.parentNode.replaceChild(im, t);
      });
    } catch (x) {}
  }
  // (niente si scarica in più all'apertura: un'immagine arriva solo quando un gettone la mostra o la griglia della scelta la fa vedere;
  // il telefono la tiene: service worker, cassa «sg-emoji»)
  function preparaTutte() {}
  // le emoji della gente nella stanza: si preparano appena si sa chi c'è (così nei disegni-immagine dei giochi c'è già quella 3D)
  function preparaGente(l) { (l || []).forEach(function (cfg) { if (eGettone(cfg)) prepara(cfg.e); }); }

  // ---- il disegno: SVG quadrato (o alto come l'avatar intero, col gettone in basso) ----
  // opts come SGOmino.svg: px (larghezza), busto/viso (inquadratura quadrata); senza: alto come l'avatar in piedi (200×264)
  function svg(cfg, opts) {
    opts = opts || {};
    var g = daQualsiasi(cfg), col = colore(g), quad = !!(opts.busto || opts.viso || opts.quadrato || opts.gambe);
    // quadrato: il cerchio riempie tutto; al posto dell'avatar in piedi (alto 132): più piccolo e in basso, largo come un omino
    var H = quad ? 100 : 132, cy = quad ? 50 : 92, R = quad ? 47 : 39, K = R / 47;
    var px = opts.px ? " width='" + opts.px + "' height='" + Math.round(opts.px * H / 100) + "'" : "";
    var info = infoE(g.e), d = info ? DATI[info.e] : null;
    if (info && !d) prepara(info.e);
    var w = Math.round(58 * K), x = 50 - w / 2, y = cy - w / 2, dentro;
    if (d) dentro = "<image href='" + d + "' xlink:href='" + d + "' x='" + x + "' y='" + y + "' width='" + w + "' height='" + w + "'/>";
    else dentro = "<text class='gt-tx' data-x='" + x + "' data-y='" + y + "' data-w='" + w + "' x='50' y='" + (cy + 1) + "' text-anchor='middle' dominant-baseline='central' font-size='" + Math.round(46 * K) + "'" +
      " font-family='Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif'>" + esc(g.e) + "</text>";
    return "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 100 " + H + "'" + px +
      " class='omino gettone' data-gt='" + esc(info ? info.e : g.e) + "' style='--gt:" + col + "'>" +
      "<circle cx='50' cy='" + cy + "' r='" + R + "' fill='" + col + "'/>" +
      "<circle cx='50' cy='" + cy + "' r='" + (R - 7.5 * K).toFixed(1) + "' fill='#161b33'/>" +
      "<circle cx='50' cy='" + (cy - 10 * K).toFixed(1) + "' r='" + (30 * K).toFixed(1) + "' fill='#ffffff' opacity='.07'/>" +
      dentro + "</svg>";
  }
  function esc(s) { return String(s).replace(/[&<>'"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[c]; }); }

  // ---- i colori di una stanza: chi entra prima tiene il suo 1°; poi il 2°, poi il 3°, poi il primo libero ----
  // mappa = { ordine: [nome, …], col: { nome: chiave } } (chi tiene la Sala o la partita la tiene per tutta la serata)
  function nuovaMappa() { return { ordine: [], col: {} }; }
  function assegna(mappa, nome, cfg) {
    var g = daQualsiasi(cfg, nome); nome = String(nome || "?");
    if (!mappa) return g;
    if (mappa.col[nome]) { g.k = mappa.col[nome]; return g; }   // deciso una volta: resta per tutta la serata
    var presi = {}; Object.keys(mappa.col).forEach(function (n) { presi[mappa.col[n]] = 1; });
    var k = null;
    (g.c || []).some(function (x) { if (!presi[x]) { k = x; return true; } return false; });
    if (!k) COLORI.some(function (x) { if (!presi[x.k]) { k = x.k; return true; } return false; });
    if (!k) k = (g.c && g.c[0]) || COLORI[mappa.ordine.length % COLORI.length].k;   // più di 12: si ripete
    mappa.col[nome] = k; mappa.ordine.push(nome);
    g.k = k; return g;
  }

  // ---- con gli avatar spenti: SGOmino disegna i gettoni (tutto il resto dell'app e i giochi non cambiano) ----
  var acceso = false;
  function accendi() {
    if (acceso) return; acceso = true;
    var O = window.SGOmino || (window.SGOmino = {});
    O.__avatar = { svg: O.svg, casuale: O.casuale, norm: O.norm, illustrato: O.illustrato, stile: O.stile, parti: O.parti, gesti: O.gesti };
    O.svg = function (cfg, opts) { return svg(cfg, opts); };
    O.casuale = function (nome) { return riserva(nome); };
    var normA = O.norm;
    O.norm = function (cfg) { return eGettone(cfg) ? norm(cfg) : (normA ? normA(cfg) : cfg); };
    O.illustrato = function () { return false; };
    O.gesti = function () { return []; };
    O.parti = function () { return null; };
    O.stile = function (s) { return "gettone"; };
    O.gettone = true;
    try { document.documentElement.classList.add("gettoni"); } catch (x) {}
  }

  window.SGGettone = {
    COLORI: COLORI, colore: colore, chiaveColore: chiaveColore, coloreDi: function (k) { return PER_K[k] ? PER_K[k].c : GRIGIO; }, nomeColore: function (k) { return PER_K[k] ? PER_K[k].n : ""; },
    lista: lista, info: infoE, url: url, codice: codice, emojiOk: emojiOk, prepara: prepara, preparaTutte: preparaTutte, preparaGente: preparaGente,
    eGettone: eGettone, norm: norm, riserva: riserva, daQualsiasi: daQualsiasi,
    svg: svg, nuovaMappa: nuovaMappa, assegna: assegna, accendi: accendi, acceso: function () { return acceso; }
  };
})();

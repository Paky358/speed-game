/* =========================================================
   😀 IL GETTONE (13 nov 2026, chat «😀 Emoji 3D al posto degli avatar»)
   Al posto degli avatar ognuno ha un gettone: un cerchio col contorno del suo colore e dentro la sua emoji 3D
   (Fluent Emoji 3D di Microsoft, licenza MIT, le immagini in carte/emoji/, la lista in data/emoji-gettone.js).
   La scelta (emoji + 2 colori in ordine) è di ognuno; in una stanza il colore lo decide chi tiene la Sala o la partita
   (vedi SGGettone.assegna): chi è entrato prima tiene il suo 1° colore, l'altro prende il suo 2°, se no il primo libero.

   Il gettone viaggia come l'avatar di prima, al posto suo: { g: 1, e: "⚡", c: ["oro", "blu", "verde"], k: "oro" }
     g = è un gettone · e = l'emoji · c = i 2 colori scelti, in ordine · k = il colore deciso nella stanza (se c'è).
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
  var PER_K = Object.create(null); COLORI.forEach(function (x) { PER_K[x.k] = x; });
  var GRIGIO = "#8a90ad";   // (solo se un colore non si riconosce)

  // le emoji: quasi tutte quelle di Fluent Emoji 3D (circa 1.500). Il file di ognuna si ricava dall'emoji stessa (i codici
  // esadecimali senza fe0f: ⚡ → 26a1.webp), così l'app non ha bisogno dell'elenco: lo scarica solo la scelta (pezzo «emoji»).
  // RISERVA: poche emoji allegre per il gettone di chi non ha ancora scelto (o manda l'avatar di prima)
  var RISERVA = ["⚡", "🔥", "👑", "🚀", "⚽", "🏆", "💎", "🛡️", "🦁", "🐯", "🦊", "🐺", "🐉", "🦄", "🦈", "🦅", "🐻", "🐼", "🐨", "🐸", "🐵", "🐧", "🦉", "🐙",
    "🐢", "🐬", "🍕", "🍔", "🍩", "🍉", "🍓", "🍿", "🏀", "🎾", "🎲", "🎮", "🎸", "🎧", "🎈", "🌈", "🌻", "🍀", "🌵", "🍄", "🪐", "⭐", "🌙", "👻", "👽", "🤖", "🏎️", "🏍️"];
  function lista() { return RISERVA.map(function (e) { return { e: e }; }); }
  function codice(e) { var r = []; Array.from(String(e || "")).forEach(function (c) { var h = c.codePointAt(0).toString(16); if (h !== "fe0f") r.push(h); }); return r.join("-"); }
  // (solo caratteri emoji, dall'inizio alla fine: un telefono modificato non può scrivere parole dentro il gettone degli altri)
  var RE_EMO = null; try { RE_EMO = new RegExp("^(?:\\p{Extended_Pictographic}|\\p{Emoji_Modifier}|\\p{Regional_Indicator}|[#*0-9]\\uFE0F?\\u20E3|\\u200D|\\uFE0F)+$", "u"); } catch (x) {}
  function emojiOk(e) { return typeof e === "string" && e.length >= 1 && e.length <= 16 && (RE_EMO ? RE_EMO.test(e) : RISERVA.indexOf(e) >= 0); }
  function infoE(e) { return emojiOk(e) ? { e: e, f: codice(e) } : null; }

  // ---- com'è fatto un gettone ----
  function eGettone(cfg) { return !!(cfg && typeof cfg === "object" && cfg.g === 1 && typeof cfg.e === "string"); }
  function coloreOk(k) { return typeof k === "string" && !!PER_K[k]; }
  // pulito: solo i campi che servono, l'emoji tra quelle della lista (se no la prima), i colori validi e diversi (al massimo 3)
  function norm(cfg) {
    if (!eGettone(cfg)) return null;
    var e = emojiOk(cfg.e) ? cfg.e : "⚡";
    var c = [];
    (Array.isArray(cfg.c) ? cfg.c : []).forEach(function (k) { if (coloreOk(k) && c.indexOf(k) < 0 && c.length < 2) c.push(k); });   // (2 colori: dal 14 nov 2026; prima erano 3)
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
  // (la stessa emoji più grande, 240 px: solo dove il gettone si vede in grande, la saletta. Le immagini stanno SOLO in queste due righe:
  // per cambiare pacchetto di emoji si rifanno le due cartelle con gli stessi nomi)
  function urlGrande(e) { var i = infoE(e); return i ? "carte/emoji-grandi/" + i.f + ".webp" : null; }
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
  // 🪟 (16 nov 2026, il proprietario: «il gettone nuovo ovunque») il gettone di vetro come nella saletta: disco scuro con la luce
  // dall'alto, il suo colore che sale dal basso, riflesso curvo in cima, bordo sottile del suo colore. In piedi (al posto dell'avatar
  // intero: «Come giocate?», podi…) galleggia sopra una piccola pedana luminosa del suo colore col fascio di luce; quadrato (teste
  // nelle testate, classifiche, profilo) solo il disco. Le luci sfumate (gradienti) stanno in due piccole immagini a parte
  // (data: URL, uno per colore, fatte una volta sola): dentro un'immagine i nomi dei gradienti non si mescolano con quelli degli altri
  // disegni, così lo stesso SVG va bene ripetuto mille volte, in schermate nascoste e trasformato in immagine dai giochi.
  // L'emoji: sopra quella GRANDE (nitida anche in grande), sotto quella piccola già arrivata (o l'emoji del telefono): si vede
  // subito, e nei disegni-immagine dei giochi (dove le immagini esterne non si caricano) resta quella piccola.
  var STRATI = {};
  function strato(chiave, corpo) {
    if (!STRATI[chiave]) STRATI[chiave] = "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" + corpo + "</svg>").replace(/'/g, "%27");
    return STRATI[chiave];
  }
  // sotto l'emoji: il disco scuro con la luce dall'alto e il suo colore che sale dal basso
  function fondoUrl(col) {
    return strato("f" + col, "<defs><radialGradient id='f' cx='50%' cy='28%' r='78%'><stop offset='0' stop-color='#323b6e'/><stop offset='.55' stop-color='#171c38'/><stop offset='1' stop-color='#0a0d1c'/></radialGradient>" +
      "<radialGradient id='t' cx='50%' cy='100%' r='62%'><stop offset='0' stop-color='" + col + "' stop-opacity='.42'/><stop offset='1' stop-color='" + col + "' stop-opacity='0'/></radialGradient></defs>" +
      "<circle cx='50' cy='50' r='50' fill='url(#f)'/><circle cx='50' cy='50' r='50' fill='url(#t)'/>");
  }
  // sopra l'emoji: il riflesso curvo, il bordo sottile del suo colore, il filo di luce e il riflesso in basso
  function vetroUrl(col, sw) {
    return strato("v" + col + sw, "<defs><linearGradient id='r' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff' stop-opacity='.42'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></linearGradient></defs>" +
      "<path d='M9.9 41.9 C14 21 30.7 8.7 50 8.7 C69.3 8.7 86 21 90.1 41.9 C79 31.4 65.1 27.3 50 27.3 C34.9 27.3 21 31.4 9.9 41.9 Z' fill='url(#r)'/>" +
      "<circle cx='50' cy='50' r='" + (50 - sw / 2) + "' fill='none' stroke='" + col + "' stroke-width='" + sw + "'/>" +
      "<circle cx='50' cy='50' r='" + (47.9 - sw / 2) + "' fill='none' stroke='#fff' stroke-opacity='.13' stroke-width='.9'/>" +
      "<path d='M22 85 A42 42 0 0 0 78 85' fill='none' stroke='#fff' stroke-opacity='.18' stroke-width='1.4' stroke-linecap='round'/>");
  }
  function disco(col, cx, cy, R, dentro, sottile) {
    var f = function (n) { return (+n).toFixed(1); }, box = "x='" + f(cx - R) + "' y='" + f(cy - R) + "' width='" + f(2 * R) + "' height='" + f(2 * R) + "'";
    return "<image href='" + fondoUrl(col) + "' " + box + "/>" + dentro + "<image href='" + vetroUrl(col, sottile ? 3 : 3.8) + "' " + box + "/>";
  }
  function svg(cfg, opts) {
    opts = opts || {};
    var g = daQualsiasi(cfg), col = colore(g), quad = !!(opts.busto || opts.viso || opts.quadrato || opts.gambe);
    // quadrato: il disco riempie tutto; in piedi (alto 132, come l'avatar intero): il disco in alto e la pedana sotto
    var H = quad ? 100 : 132, cy = quad ? 50 : 62, R = quad ? 46.5 : 33;
    var px = opts.px ? " width='" + opts.px + "' height='" + Math.round(opts.px * H / 100) + "'" : "";
    var info = infoE(g.e), d = info ? DATI[info.e] : null;
    if (info && !d) prepara(info.e);
    // la grande solo se il gettone non è minuscolo (le teste piccole nelle testate restano leggere)
    var grande = info && (!quad || !opts.px || opts.px >= 56);
    var w = +(R * 1.32).toFixed(1), x = +(50 - w / 2).toFixed(1), y = +(cy - w / 2).toFixed(1), dentro;
    if (d) dentro = "<image href='" + d + "' xlink:href='" + d + "' x='" + x + "' y='" + y + "' width='" + w + "' height='" + w + "'/>";
    else dentro = "<text class='gt-tx" + (grande ? " sotto" : "") + "' data-x='" + x + "' data-y='" + y + "' data-w='" + w + "' x='50' y='" + (cy + 1) + "' text-anchor='middle' dominant-baseline='central' font-size='" + Math.round(R * 1.0) + "'" +
      " font-family='Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif'>" + esc(g.e) + "</text>";
    if (grande) dentro += "<image class='gt-grande' href='" + urlGrande(info.e) + "' x='" + x + "' y='" + y + "' width='" + w + "' height='" + w + "'/>";
    var pedana = quad ? "" :
      "<path d='M23 118 L33 62 L67 62 L77 118 Z' fill='" + col + "' opacity='.13'/>" +
      "<path d='M31 118 L39 70 L61 70 L69 118 Z' fill='" + col + "' opacity='.1'/>" +
      "<path d='M15 118 L15 125 A35 6.5 0 0 0 85 125 L85 118 Z' fill='" + col + "' opacity='.5'/>" +
      "<path d='M15 120.5 L15 125 A35 6.5 0 0 0 85 125 L85 120.5 A35 6.5 0 0 1 15 120.5 Z' fill='#0b0e1d' opacity='.45'/>" +
      "<ellipse cx='50' cy='118' rx='35' ry='6.5' fill='" + col + "' opacity='.92'/>" +
      "<ellipse cx='50' cy='118' rx='22' ry='3.8' fill='#fff' opacity='.42'/>" +
      "<ellipse cx='50' cy='118' rx='13' ry='2.4' fill='#000' opacity='.28'/>" +
      "<circle cx='50' cy='" + cy + "' r='" + (R + 3.5) + "' fill='" + col + "' opacity='.13'/>";
    return "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 100 " + H + "'" + px +
      " class='omino gettone vetro' data-gt='" + esc(info ? info.e : g.e) + "' style='--gt:" + col + "'>" +
      pedana + disco(col, 50, cy, R, dentro, !quad) + "</svg>";
  }
  // ---- 🏛️ il gettone sul palco della saletta (15 nov 2026, chat «🪟 Saletta di vetro»; scelto dal proprietario: «C · Piedistallo»)
  // un gettone di vetro (disco scuro con la luce dall'alto, riflesso curvo in cima, bordo sottile del suo colore) che galleggia sopra
  // una pedana luminosa del suo colore, con un fascio di luce. Tre strati HTML (pedana, disco, segno di «pronto») così i movimenti
  // (galleggia, rimbalzo, saltello) sono solo transform del disco e la pedana resta ferma. È solo una cornice: dentro va l'immagine
  // dell'emoji, quella GRANDE (carte/emoji-grandi/, 240 px: nella saletta il gettone è grande e quella piccola si vedeva sgranata).
  // Sotto c'è quella piccola, se è già arrivata: si vede subito e anche senza rete. Il «pronto» è già disegnato: lo accende il CSS.
  var N_PALCO = 0;   // (ogni pedana ha i suoi id: mai un riferimento a un disegno nascosto o tolto)
  function gradi(col) { return String(col).replace(/[^0-9a-f]/gi, ""); }
  function palco(cfg) {
    var g = daQualsiasi(cfg), col = colore(g), id = "gtp" + gradi(col) + "-" + (++N_PALCO), info = infoE(g.e), d = info ? DATI[info.e] : null;
    if (info && !d) prepara(info.e);
    var img = (d ? "<image href='" + d + "' x='21' y='21' width='58' height='58'/>" : "") +
      (info ? "<image href='" + urlGrande(info.e) + "' x='21' y='21' width='58' height='58'/>" : "<text x='50' y='51' text-anchor='middle' dominant-baseline='central' font-size='46'>" + esc(g.e) + "</text>");
    return "<div class='gtp' style='--gt:" + col + "' data-gt='" + esc(info ? info.e : g.e) + "'>" +
      // la pedana: il fascio di luce che sale, il fianco, il piano luminoso e l'ombra del gettone sul piano
      "<svg class='gtp-pedana' viewBox='0 0 100 128' preserveAspectRatio='none' aria-hidden='true'><defs>" +
      "<linearGradient id='" + id + "s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='" + col + "' stop-opacity='.55'/><stop offset='1' stop-color='#0b0e1d' stop-opacity='.9'/></linearGradient>" +
      "<radialGradient id='" + id + "a' cx='50%' cy='50%' r='50%'><stop offset='0' stop-color='#fff' stop-opacity='.9'/><stop offset='.35' stop-color='" + col + "' stop-opacity='.9'/><stop offset='1' stop-color='" + col + "' stop-opacity='.25'/></radialGradient>" +
      "<linearGradient id='" + id + "b' x1='0' y1='1' x2='0' y2='0'><stop offset='0' stop-color='" + col + "' stop-opacity='.32'/><stop offset='1' stop-color='" + col + "' stop-opacity='0'/></linearGradient>" +
      "<radialGradient id='" + id + "o' cx='50%' cy='50%' r='50%'><stop offset='0' stop-color='#000' stop-opacity='.55'/><stop offset='1' stop-color='#000' stop-opacity='0'/></radialGradient></defs>" +
      "<path class='gtp-fascio' d='M14 104 L28 30 L72 30 L86 104 Z' fill='url(#" + id + "b)'/>" +
      "<path d='M10 104 L10 115 A40 9 0 0 0 90 115 L90 104 Z' fill='url(#" + id + "s)'/>" +
      "<ellipse cx='50' cy='104' rx='40' ry='9' fill='url(#" + id + "a)'/>" +
      "<ellipse class='gtp-ombra' cx='50' cy='103.5' rx='22' ry='4' fill='url(#" + id + "o)'/></svg>" +
      // il disco di vetro (galleggia: .gtp-galla; i gesti muovono .gtp-disco)
      "<div class='gtp-galla'><div class='gtp-disco'><svg viewBox='0 0 100 100' aria-hidden='true'><defs>" +
      "<radialGradient id='" + id + "l' cx='50%' cy='50%' r='50%'><stop offset='.82' stop-color='" + col + "' stop-opacity='.38'/><stop offset='1' stop-color='" + col + "' stop-opacity='0'/></radialGradient>" +
      "<radialGradient id='" + id + "f' cx='50%' cy='28%' r='78%'><stop offset='0' stop-color='#323b6e'/><stop offset='.55' stop-color='#171c38'/><stop offset='1' stop-color='#0a0d1c'/></radialGradient>" +
      "<radialGradient id='" + id + "t' cx='50%' cy='100%' r='62%'><stop offset='0' stop-color='" + col + "' stop-opacity='.42'/><stop offset='1' stop-color='" + col + "' stop-opacity='0'/></radialGradient>" +
      "<linearGradient id='" + id + "r' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff' stop-opacity='.42'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></linearGradient></defs>" +
      "<circle cx='50' cy='50' r='50' fill='url(#" + id + "l)'/>" +
      "<circle cx='50' cy='50' r='43' fill='url(#" + id + "f)'/>" +
      "<circle cx='50' cy='50' r='43' fill='url(#" + id + "t)'/>" + img +
      "<path d='M15.5 40 C19 22 33 11.5 50 11.5 C67 11.5 81 22 84.5 40 C75 31 63 27.5 50 27.5 C37 27.5 25 31 15.5 40 Z' fill='url(#" + id + "r)'/>" +
      "<circle cx='50' cy='50' r='43' fill='none' stroke='" + col + "' stroke-width='2.6'/>" +
      "<circle cx='50' cy='50' r='41.2' fill='none' stroke='#fff' stroke-opacity='.13' stroke-width='.8'/>" +
      "<path d='M24 80 A36 36 0 0 0 76 80' fill='none' stroke='#fff' stroke-opacity='.18' stroke-width='1.2' stroke-linecap='round'/>" +
      // ✓ pronto: una lineetta verde dentro il suo colore e il bollino verde in basso a destra (lo accende il CSS)
      "<g class='gtp-pronto'><circle cx='50' cy='50' r='39.6' fill='none' stroke='#34d17a' stroke-width='2.2'/>" +
      "<circle cx='81' cy='80' r='11' fill='#0d1020'/><circle cx='81' cy='80' r='9' fill='#2fc46b'/>" +
      "<path d='M76.6 80.3 l3.1 3.1 l5.8 -6.4' fill='none' stroke='#fff' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'/></g>" +
      "</svg></div></div></div>";
  }
  // il posto libero: un cerchio tratteggiato col «+» (toccandolo si invita)
  function palcoVuoto() {
    return "<div class='gtp gtp-libero'><svg class='gtp-pedana' viewBox='0 0 100 128' preserveAspectRatio='none' aria-hidden='true'>" +
      "<path d='M10 104 L10 115 A40 9 0 0 0 90 115 L90 104' fill='rgba(255,255,255,.025)' stroke='#fff' stroke-opacity='.16' stroke-width='1.2' stroke-dasharray='5 4'/>" +
      "<ellipse cx='50' cy='104' rx='40' ry='9' fill='rgba(255,255,255,.04)' stroke='#fff' stroke-opacity='.3' stroke-width='1.4' stroke-dasharray='5 4'/></svg><div class='gtp-galla'><div class='gtp-disco'><svg viewBox='0 0 100 100' aria-hidden='true'>" +
      "<circle cx='50' cy='50' r='42' fill='rgba(255,255,255,.03)' stroke='#fff' stroke-opacity='.3' stroke-width='1.6' stroke-dasharray='6 5.2'/>" +
      "<path d='M50 39 V61 M39 50 H61' stroke='#fff' stroke-opacity='.5' stroke-width='3' stroke-linecap='round'/></svg></div></div></div>";
  }
  function esc(s) { return String(s).replace(/[&<>'"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[c]; }); }

  // ---- i colori di una stanza: chi entra prima tiene il suo 1°; poi il suo 2°, poi il primo libero ----
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
    svg: svg, palco: palco, palcoVuoto: palcoVuoto, urlGrande: urlGrande, nuovaMappa: nuovaMappa, assegna: assegna, accendi: accendi, acceso: function () { return acceso; }
  };
})();

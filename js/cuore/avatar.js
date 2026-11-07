/* =========================================================
   PEZZO DEL CUORE — 🧍 L'EDITOR DEGLI AVATAR
   Il camerino dove si fa e si cambia l'avatar (schermataOmino), il primo avatar
   di chi entra la prima volta (lui/lei → look → Fatto), i look pronti, i colori,
   i ritocchi e il secondo avatar. Il disegno dell'avatar sta in js/omino.js.
   Pezzo del cuore (js/core.js): prende gli aiuti dal cuore all'inizio («dal cuore»)
   e in fondo gli lascia quello che usano gli altri («al cuore»). Vedi AGENTS.md.
   ========================================================= */
(function () {
  "use strict";
  var cuore = window.SGCuore;
  // ---- dal cuore: gli aiuti che questo pezzo usa (non cambiano mai, si prendono una volta) ----
  var el = cuore.el, schermata = cuore.schermata, mostra = cuore.mostra, eProprietario = cuore.eProprietario, scriviL = cuore.scriviL,
      profili = cuore.profili, profiloAttivo = cuore.profiloAttivo, audioCtx = cuore.audioCtx;

  // ---- AVATAR: il tuo personaggio stile Mii (disegno in js/omino.js; nel codice resta "omino") ----
  // zoom: "viso" = sul palco la telecamera va sulla faccia; solo: "donna" = la scheda c'è solo per lei; look: in cima i look pronti
  var SEZ_OMINO = [
    { nome: "Corpo", icona: "🧍", voci: [["forma", "Maschio o femmina"], ["corpo", "Corporatura"], ["pelle", "Pelle"]],
      sotto: [["Maschio o femmina", ["forma"]], ["Corporatura", ["corpo"]], ["Pelle", ["pelle"]]] },
    { nome: "Viso", icona: "🙂", zoom: "viso", voci: [["viso", "Forma del viso"], ["orecchie", "Orecchie"], ["occhi", "Occhi"], ["iride", "Colore occhi"], ["sopracc", "Sopracciglia"], ["naso", "Naso"], ["bocca", "Bocca"],
                               ["guance", "Guance"], ["segno", "Segni particolari"]],
      sotto: [["Forma", ["viso", "orecchie"]], ["Occhi", ["occhi", "iride"]], ["Sopracciglia", ["sopracc"]], ["Naso e bocca", ["naso", "bocca"]], ["Guance e segni", ["guance", "segno"]], ["Ritocchi", ["ritocchi"]]] },
    { nome: "Trucco", icona: "💄", zoom: "viso", solo: "donna", voci: [["ombretto", "Ombretto"], ["colOmbretto", "Colore ombretto"], ["eyeliner", "Eyeliner"], ["colEyeliner", "Colore eyeliner"], ["mascara", "Mascara"],
                               ["rossetto", "Rossetto"], ["colRossetto", "Colore rossetto"], ["blush", "Blush"], ["colBlush", "Colore blush"]],
      sotto: [["Occhi", ["ombretto", "colOmbretto", "eyeliner", "colEyeliner", "mascara"]], ["Labbra", ["rossetto", "colRossetto"]], ["Guance", ["blush", "colBlush"]]] },
    { nome: "Capelli", icona: "💇", zoom: "viso", voci: [["capelli", "Taglio"], ["colCap", "Colore"], ["barba", "Barba e baffi"]],
      sotto: [["Taglio", ["capelli"]], ["Colore", ["colCap"]], ["Barba e baffi", ["barba"]]] },
    { nome: "Vestiti", icona: "👕", look: true, voci: [["capo", "Stile"], ["maglia", "Colore"], ["fant", "Fantasia"], ["maglia2", "Secondo colore"], ["stoffa", "Stoffa"], ["stampa", "Stampa"],
                               ["sotto", "Sotto"], ["pantaloni", "Colore sotto"], ["fantP", "Fantasia"], ["pant2", "Secondo colore"], ["stoffaP", "Stoffa"], ["modScarpe", "Scarpe"], ["scarpe", "Colore scarpe"]],
      sotto: [["Look pronti", ["look"]], ["Parti superiori", ["capo", "maglia", "fant", "maglia2", "stoffa", "stampa"]], ["Parti inferiori", ["sotto", "pantaloni", "fantP", "pant2", "stoffaP"]], ["Scarpe", ["modScarpe", "scarpe"]]] },
    { nome: "Accessori", icona: "🎩", voci: [["cappello", "In testa"], ["colAcc", "Colore"], ["occhiali", "Occhiali e maschere"], ["orecchini", "Orecchini e piercing"], ["collo", "Al collo"], ["colCollo", "Colore"], ["borsa", "Borsa"], ["colBorsa", "Colore borsa"]],
      sotto: [["In testa", ["cappello", "colAcc"]], ["Occhiali", ["occhiali"]], ["Orecchini", ["orecchini"]], ["Al collo", ["collo", "colCollo"]], ["Borsa", ["borsa", "colBorsa"]]] },
    { nome: "Extra", icona: "🎈", voci: [["mano", "In mano"], ["colMano", "Colore"], ["schiena", "Sulla schiena"], ["colSchiena", "Colore"], ["animale", "Animaletto"], ["colAnimale", "Colore del pelo"], ["pittura", "Pittura sul viso"]],
      sotto: [["In mano", ["mano", "colMano"]], ["Sulla schiena", ["schiena", "colSchiena"]], ["Animaletto", ["animale", "colAnimale"]], ["Pittura sul viso", ["pittura"]]] }
  ];
  // IL CAMERINO (l'editor nuovo): l'avatar resta grande, le scelte sono file da scorrere di lato, e i colori stanno insieme
  // alla cosa che colorano (taglio e colore dei capelli nella stessa pagina). Tirando su la maniglia si vedono tutte le scelte.
  var EDITOR_CAMERINO = false;   // false = per ora lo vede solo il proprietario (gli altri hanno l'editor di prima)
  var SOTTO_CAMERINO = {   // i colori sempre presenti stanno sopra (non spostano niente); quelli che compaiono solo con certe scelte stanno sotto
    Corpo: [["Maschio o femmina", ["forma"]], ["Corporatura e pelle", ["pelle", "corpo"]]],
    Capelli: [["Taglio e colore", ["colCap", "capelli"]], ["Barba e baffi", ["barba"]]],
    Vestiti: [["Look pronti", ["look"]], ["Sopra", ["maglia", "capo", "fant", "maglia2", "stoffa", "stampa"]], ["Sotto", ["pantaloni", "sotto", "fantP", "pant2", "stoffaP"]], ["Scarpe", ["scarpe", "modScarpe"]]],
    Accessori: [["In testa", ["cappello", "colAcc"]], ["Occhiali", ["occhiali"]], ["Orecchini", ["orecchini"]], ["Al collo", ["collo", "colCollo"]], ["Borsa", ["borsa", "colBorsa"]]],
    Extra: [["In mano", ["mano", "colMano"]], ["Sulla schiena", ["schiena", "colSchiena"]], ["Animaletto", ["animale", "colAnimale"]], ["Pittura sul viso", ["pittura"]]]
  };
  var SEZ_CAMERINO = SEZ_OMINO.map(function (sz) { var c = {}, k; for (k in sz) c[k] = sz[k]; if (SOTTO_CAMERINO[sz.nome]) c.sotto = SOTTO_CAMERINO[sz.nome]; return c; });
  var OMINO_COLORI = { pelle: 1, colCap: 1, iride: 1, maglia: 1, maglia2: 1, pantaloni: 1, pant2: 1, scarpe: 1, colAcc: 1, colCollo: 1, colOmbretto: 1, colEyeliner: 1, colRossetto: 1, colBlush: 1, colBorsa: 1, colMano: 1, colSchiena: 1, colAnimale: 1 };
  var TRUCCO_COL = { colOmbretto: "ombretto", colEyeliner: "eyeliner", colRossetto: "rossetto", colBlush: "blush", colBorsa: "borsa" };   // il colore si vede solo se quel trucco c'è
  var TRUCCO_VOCI = /^(ombretto|eyeliner|mascara|rossetto|blush|pittura|col(Ombretto|Eyeliner|Rossetto|Blush))$/;   // anteprime in primo piano sul viso
  var OMINO_INTERO = { forma: 1, corpo: 1, sotto: 1, capo: 1, stampa: 1, borsa: 1, mano: 1, schiena: 1, animale: 1 };   // anteprima a figura intera (le altre: solo la testa)
  var ACC_COLORATI = /cappellino|berretto|fascia|cuffie|cilindro|cowboy|pescatore|basco|festa|gatto|cerchietto|fiocco|mollette|paglia|coppola|borsalino|visiera|mago|antenne/;   // cappelli con un colore da scegliere
  var COLLO_COLORATI = /sciarpa|papillon|cravatta|bandana|foulard|medaglia|fischietto|cuffiecollo/;
  var COLORE_DI = { colMano: ["mano", /palloncino|fiore|microfono|tazza|libro/], colSchiena: ["schiena", /zaino|mantello|farfalla/], colAnimale: ["animale", /gatto|cane|coniglio/] };   // colore che compare solo con certe scelte
  var OMINO_LIBERO = { colCap: 1, iride: 1, maglia: 1, maglia2: 1, pantaloni: 1, pant2: 1, scarpe: 1, colAcc: 1, colCollo: 1, colOmbretto: 1, colEyeliner: 1, colRossetto: 1, colBlush: 1, colBorsa: 1, colMano: 1, colSchiena: 1 };   // colori dove c'è anche la tavolozza libera
  // (6 nov 2026, tappa 3 dei vestiti, Tavola 2) fantasia, secondo colore e stoffa del capo e dei pantaloni: le voci dei pantaloni usano le
  // liste del capo; il secondo colore è un colore della tavolozza della maglia (o dei pantaloni) oppure «Nessuno» (null). Quando una voce
  // nuova manca nell avatar vale il suo «niente» (SGOmino.NUOVI_VESTITI): così gli avatar di prima restano uguali anche nei dati.
  var LISTA_DI = { maglia2: "maglia", pant2: "pantaloni", fantP: "fant", stoffaP: "stoffa" };
  var COL2 = /^(righe|quadri|pois|hawaiana)$/;   // le fantasie che si colorano col secondo colore
  var OMINO_RITOCCHI = [["occG", "Grandezza occhi"], ["occD", "Distanza occhi"], ["occA", "Altezza occhi"],
    ["soprA", "Altezza sopracciglia"], ["nasoG", "Grandezza naso"], ["boccaA", "Altezza bocca"]];
  // 🎨 avatar illustrati (strada A): una voce che non è ancora ridisegnata (nel disegno prende quella più simile)
  function illustratoManca(k, v) { return !!(window.SGOminoA && window.SGOmino && SGOmino.stile && SGOmino.stile() === "illustrato" && !SGOminoA.disegnato(k, v)); }
  // LOOK PRONTI: un tocco e cambiano vestiti e accessori insieme (viso, capelli e corpo restano i tuoi).
  // (7 nov 2026, tappa 5 dei vestiti, Tavola 3) Casual, Sportivo, Elegante, Rock, Estate, Inverno e Festa sono quelli «di domani» della
  // colonna Moda (capi Moda, fantasie, stoffe, secondo colore; Casual coi colori di partenza della Tavola 2: niente più blu su blu);
  // i cinque «Colori che stanno bene» sono gli abbinamenti 9-13 della Tavola 2. I colori sono posizioni nelle tavolozze (o "#rrggbb"
  // quando la tavolozza non ce l'ha). Un look scrive anche fantasia, stoffa e secondo colore (LOOK_BASE: di partenza niente), così non resta
  // la fantasia del capo di prima. gruppo = la fila dell'editor nuovo: "pronti" | "colori" | "costumi".
  // Gli avatar salvati non cambiano: un look si applica solo quando lo tocchi.
  var LOOK_BASE = { cappello: "nessuno", occhiali: "nessuno", collo: "nessuno", mano: "nessuno", schiena: "nessuna", animale: "nessuno", pittura: "nessuna", borsa: "nessuna", stampa: "nessuna",
    maglia2: null, fant: "nessuna", stoffa: "normale", pant2: null, fantP: "nessuna", stoffaP: "normale" };
  var LOOK = [
    { nome: "Casual", gruppo: "pronti", tutti: { capo: "maglietta", maglia: 22, sotto: "jeans", pantaloni: 26, modScarpe: "sneakers", scarpe: 1 }, donna: { capo: "crop", maglia: 10, sotto: "shortsjeans", pantaloni: 26 } },
    { nome: "Elegante", gruppo: "pronti", tutti: { capo: "giacca", maglia: 7, stoffa: "lana", sotto: "pantaloni", pantaloni: 23, modScarpe: "eleganti", scarpe: 9, collo: "cravatta", colCollo: "#c4623f" },
      donna: { maglia: 18, stoffa: "raso", pantaloni: 13, modScarpe: "tacchi", collo: "perle", orecchini: "perla", borsa: "borsetta", colBorsa: 1 } },
    { nome: "Sportivo", gruppo: "pronti", tutti: { capo: "felpa", maglia: 23, maglia2: 9, sotto: "cargo", pantaloni: 17, modScarpe: "sneakers", scarpe: 8, cappello: "visiera", colAcc: 9, collo: "fischietto", colCollo: 7, occhiali: "sportivi" },
      donna: { maglia: 12, maglia2: 22, sotto: "leggings", pantaloni: 23, cappello: "fascia", colAcc: "#0f7a5a", collo: "nessuno" } },
    { nome: "Rock", gruppo: "pronti", tutti: { capo: "bomber", maglia: 26, sotto: "jeans", pantaloni: 0, modScarpe: "anfibi", scarpe: 9, occhiali: "sole", collo: "catena", schiena: "chitarra", colSchiena: 0 }, donna: { orecchini: "cerchioni" } },
    { nome: "Estate", gruppo: "pronti", tutti: { capo: "camicia", maglia: 8, fant: "righe", maglia2: 24, sotto: "bermuda", pantaloni: 22, modScarpe: "infradito", scarpe: 13, cappello: "paglia", colAcc: 3, occhiali: "sole", mano: "gelato" },
      donna: { maglia: 22, maglia2: 25, sotto: "shortsjeans", pantaloni: 26, modScarpe: "zeppe", scarpe: 8, occhiali: "grandi" } },
    { nome: "Inverno", gruppo: "pronti", tutti: { capo: "maglione", maglia: 16, sotto: "pantaloni", pantaloni: 23, modScarpe: "stivali", scarpe: 14, cappello: "berretto", colAcc: "#0c0c0e", collo: "sciarpa", colCollo: "#6d1f33" },
      donna: { maglia: "#b9a679", sotto: "leggings", pantaloni: 13, modScarpe: "stivalialti", scarpe: 9, colAcc: "#f3ebd8", colCollo: "#f3ebd8" } },
    { nome: "Tifoso", gruppo: "pronti", tutti: { capo: "calcio", maglia: 1, stampa: "numero", sotto: "pantaloncini", pantaloni: 8, modScarpe: "sneakers", scarpe: 1, pittura: "tricolore", mano: "bandiera" } },
    { nome: "Rapper", gruppo: "pronti", tutti: { capo: "felpa", maglia: 7, sotto: "cargo", pantaloni: 1, modScarpe: "sneakers", scarpe: 1, cappello: "cappellino", colAcc: 7, occhiali: "sole", collo: "catena", mano: "microfono", colMano: 7 } },
    { nome: "Cuoco", gruppo: "costumi", tutti: { capo: "grembiule", maglia: 8, sotto: "pantaloni", pantaloni: 1, modScarpe: "sneakers", scarpe: 1, cappello: "chef", mano: "pizza" } },
    { nome: "Avventura", gruppo: "pronti", tutti: { capo: "camicia", maglia: 3, sotto: "cargo", pantaloni: 10, modScarpe: "anfibi", scarpe: 5, cappello: "pescatore", colAcc: 3, schiena: "zaino", colSchiena: 2, animale: "cane", colAnimale: 4 } },
    { nome: "Musica", gruppo: "pronti", tutti: { capo: "maglietta", maglia: 7, stampa: "nota", sotto: "strappati", pantaloni: 8, modScarpe: "sneakers", scarpe: 0, cappello: "borsalino", colAcc: 7, schiena: "chitarra" } },
    { nome: "Pirata", gruppo: "costumi", tutti: { capo: "camicia", maglia: 8, stampa: "righe", sotto: "pantaloni", pantaloni: 2, modScarpe: "stivali", scarpe: 0, cappello: "pirata", occhiali: "benda", animale: "pappagallo", collo: "bandana", colCollo: 0 } },
    { nome: "Mago", gruppo: "costumi", tutti: { capo: "maglione", maglia: 4, sotto: "pantaloni", pantaloni: 6, modScarpe: "stivaletti", scarpe: 5, cappello: "mago", colAcc: 4, schiena: "mantello", colSchiena: 4, mano: "bacchetta", occhiali: "tondi" } },
    { nome: "Supereroe", gruppo: "costumi", tutti: { capo: "supereroe", maglia: 1, sotto: "leggings", pantaloni: 4, modScarpe: "stivali", scarpe: 2, schiena: "mantello", colSchiena: 0, occhiali: "mascherina" } },
    // (6 nov 2026, Tavola 3) lei alla festa col vestito verde smeraldo, gambe nude e ballerine dello stesso verde, la tiara; (7 nov) di raso,
    // lui con la giacca bordeaux di raso e i classici neri (colonna Moda)
    { nome: "Festa", gruppo: "pronti", tutti: { capo: "giacca", maglia: 18, stoffa: "raso", sotto: "pantaloni", pantaloni: 13, modScarpe: "eleganti", scarpe: 9, cappello: "festa", colAcc: 3, occhiali: "stelle", mano: "palloncino", colMano: 0, pittura: "cuori" },
      donna: { capo: "vestito", maglia: "#0f7a5a", sotto: "gonna", modScarpe: "ballerine", scarpe: "#0f7a5a", cappello: "tiara" } },
    { nome: "Natale", gruppo: "costumi", tutti: { capo: "maglione", maglia: 0, sotto: "jeans", pantaloni: 1, modScarpe: "stivali", scarpe: 5, cappello: "babbo", collo: "sciarpa", colCollo: 2, mano: "tazza", colMano: 0 } },
    { nome: "Vichingo", gruppo: "costumi", tutti: { capo: "maglione", maglia: 2, sotto: "pantaloni", pantaloni: 2, modScarpe: "stivali", scarpe: 5, cappello: "vichingo", schiena: "mantello", colSchiena: 7 } },
    { nome: "Angioletto", gruppo: "costumi", tutti: { capo: "maglione", maglia: 8, sotto: "pantaloni", pantaloni: 7, modScarpe: "sneakers", scarpe: 1, cappello: "aureola", schiena: "ali" }, donna: { capo: "vestito", sotto: "gonna", modScarpe: "ballerine" } },
    { nome: "Diavoletto", gruppo: "costumi", tutti: { capo: "felpa", maglia: 0, sotto: "jeans", pantaloni: 1, modScarpe: "anfibi", scarpe: 0, cappello: "corna", schiena: "pipistrello" } },
    { nome: "Fatina", gruppo: "costumi", tutti: { capo: "maglietta", maglia: 5, sotto: "jeans", pantaloni: 9, modScarpe: "sneakers", scarpe: 1, cappello: "tiara", schiena: "farfalla", colSchiena: 5, mano: "bacchetta" }, donna: { capo: "vestito", sotto: "gonna", modScarpe: "ballerine" } },
    // (7 nov 2026) gli abbinamenti 9-13 della Tavola 2 «Con i colori nuovi si abbina bene»
    { nome: "Cammello e panna", gruppo: "colori", tutti: { capo: "maglione", maglia: 16, sotto: "pantaloni", pantaloni: 14, modScarpe: "sneakers", scarpe: 0 } },
    { nome: "Oliva e senape", gruppo: "colori", tutti: { capo: "cardigan", maglia: 19, sotto: "pantaloni", pantaloni: 17, modScarpe: "sneakers", scarpe: 0 } },
    { nome: "Panna e bordeaux", gruppo: "colori", tutti: { capo: "camicia", maglia: 22, sotto: "pantaloni", pantaloni: 18, modScarpe: "sneakers", scarpe: 0 } },
    { nome: "Melange e bordeaux", gruppo: "colori", tutti: { capo: "felpa", maglia: 23, sotto: "pantaloni", pantaloni: 18, modScarpe: "sneakers", scarpe: 0 } },
    { nome: "Pastelli", gruppo: "colori", tutti: { capo: "polo", maglia: 10, sotto: "pantaloni", pantaloni: 25, modScarpe: "sneakers", scarpe: 0 } }
  ];
  function conLook(cfg, L) {
    var c = {}, k, pezzi = [LOOK_BASE, L.tutti, cfg.forma === "donna" ? L.donna : L.uomo];
    for (k in cfg) c[k] = cfg[k];
    pezzi.forEach(function (p) { if (p) for (k in p) c[k] = p[k]; });
    return c;
  }
  // il look è quello di adesso? (un campo nuovo che manca vale il suo «niente»: maglia2 assente = null, fant assente = "nessuna"…)
  function lookUguale(cfg, L) {
    var D0 = window.SGOmino && SGOmino.NUOVI_VESTITI, cl = conLook(cfg, L);
    function v(c, k) { return c[k] == null && D0 && k in D0 ? D0[k] : c[k]; }
    for (var k in cl) if (v(cl, k) !== v(cfg, k)) return false;
    return true;
  }
  // piccolo "pop" quando scegli qualcosa nell'editor (la vibrazione la fa già il tocco)
  function popOmino() {
    var ctx = audioCtx(); if (!ctx) return;
    try {
      var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(980, t + 0.07);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.14);
    } catch (e) {}
  }
  // omini = i due avatar, n = quello in uso nei giochi (cfg)
  function salvaOminoProfilo(cfg, omini, n) {
    var io = profiloAttivo(); if (!io) return;
    if (io.cloud) { SGNube.salvaOmino(cfg, omini, n); return; }
    var p = profili().filter(function (x) { return x.id === io.id; })[0];
    if (p) { p.omino = cfg; if (omini) { p.omini = omini; p.ominoN = n; } cuore.salvaProfilo(p); }
  }
  // liste personali salvate sul profilo (es. le parole di Parola d'ordine): nel cloud se il profilo è online, se no su questo telefono
  function secondoOmino(primo, nome) {
    return SGOmino.casuale(nome + "#2", primo.forma === "donna" ? "uomo" : "donna");
  }
  // bozza (facoltativa) = { nome, omino, omini, ominoN }: l'editor lavora su questa e non sul profilo
  // (serve mentre crei il profilo: il personaggio si salva appena il profilo esiste)
  // opz.benvenuto: subito dopo aver creato il profilo (niente ‹: l'avatar pronto c'è già, basta "✅ Fatto")
  // IL PRIMO AVATAR (profilo appena nato): "Sei lui o lei?" → "Scegli il tuo look" → solo allora "✅ Fatto".
  // Si aggiorna solo il pezzo che cambia; "✏️ Personalizza" apre l'editor di sempre (in modo benvenuto).
  var LOOK_PRIMI = ["Casual", "Elegante", "Sportivo", "Rock", "Estate", "Inverno", "Rapper", "Festa"];
  function schermataPrimoAvatar(dopo) {
    var io = profiloAttivo(), O = window.SGOmino;
    if (!io || !O) return dopo();
    var nome = io.nome || "", forma = null, look = null, viso = 0, cfg = null;
    var looks = LOOK.filter(function (L) { return LOOK_PRIMI.indexOf(L.nome) >= 0; });
    var s = cuore.schermataProfiloBase("primo-avatar"), c = s._contenuto;
    var titolo = el("h1", { text: "Sei lui o lei?" }), sotto = el("p", { class: "bp-sotto", text: "Tocca il tuo avatar: poi scegli il look." });
    c.appendChild(el("div", { class: "bp-testa" }, [ el("div", { class: "bp-logo", "aria-hidden": "true", text: "⚡" }), titolo, sotto ]));
    var corpo = el("div", { class: "pa-corpo" });
    c.appendChild(corpo);
    var bFatto = el("button", { class: "btn btn-primario pa-fatto", text: "✅ Fatto", disabled: "disabled", onclick: function () { salva(dopo); } });
    var bPers = el("button", { class: "btn btn-fantasma pa-pers", text: "✏️ Personalizza di più", hidden: "hidden", onclick: function () {
      salva(function () { schermataOmino(dopo, null, { benvenuto: true, personalizza: true }); });
    } });
    s._piede.appendChild(bFatto); s._piede.appendChild(bPers);
    var salvato = false;
    function salva(poi) {
      if (salvato || !cfg) return; salvato = true;
      scriviL("sg-primo-avatar", null);
      var c0 = O.norm(cfg);
      salvaOminoProfilo(c0, [c0, O.norm(secondoOmino(c0, nome))], 0);
      poi();
    }
    function base(f) { return O.norm(O.casuale(viso ? nome + "#" + viso : nome, f)); }
    // 1) lui o lei: due avatar grandi
    function passoForma() {
      forma = null; look = null; cfg = null;
      titolo.textContent = "Sei lui o lei?"; sotto.textContent = "Tocca il tuo avatar: poi scegli il look.";
      bFatto.disabled = true; bPers.hidden = true;
      corpo.innerHTML = ""; corpo.className = "pa-corpo pa-forme";
      [["uomo", "👦 Lui"], ["donna", "👧 Lei"]].forEach(function (x) {
        var b = el("button", { class: "pa-forma", type: "button", "aria-label": x[1], onclick: function () { forma = x[0]; passoLook(); } }, [
          el("div", { class: "pa-fig", html: O.svg(conLook(base(x[0]), looks[0]), { hd: true }) }), el("b", { text: x[1] }) ]);
        corpo.appendChild(b);
      });
    }
    // 2) il look: 8 pronti, quello scelto sul palco
    var palco = null, griglia = null;
    function passoLook() {
      titolo.textContent = "Scegli il tuo look"; sotto.textContent = "Tocca quello che ti piace di più.";
      corpo.innerHTML = ""; corpo.className = "pa-corpo pa-looks";
      palco = el("div", { class: "pa-palco", "aria-hidden": "true" });
      var barra = el("div", { class: "pa-barra" }, [
        el("button", { class: "pa-mini-btn", type: "button", text: "‹ " + (forma === "donna" ? "Sono lui" : "Sono lei"), onclick: function () { forma = forma === "donna" ? "uomo" : "donna"; disegnaLook(true); } }),
        el("button", { class: "pa-mini-btn", type: "button", text: "🎲 Altro viso", onclick: function () { viso++; disegnaLook(false); } }) ]);
      griglia = el("div", { class: "pa-griglia" });
      corpo.appendChild(palco); corpo.appendChild(barra); corpo.appendChild(griglia);
      disegnaLook(true);
    }
    function disegnaLook(tutto) {
      var b0 = base(forma);
      if (tutto) {   // (cambia lui/lei: cambia anche il tasto in alto)
        var bb = corpo.querySelector(".pa-mini-btn"); if (bb) bb.textContent = "‹ " + (forma === "donna" ? "Sono lui" : "Sono lei");
      }
      griglia.innerHTML = "";
      looks.forEach(function (L) {
        var b = el("button", { class: "pa-look" + (look === L ? " attiva" : ""), type: "button", onclick: function () {
          look = L; [].forEach.call(griglia.children, function (x) { x.classList.toggle("attiva", x === b); }); aggiorna();
        } }, [ el("div", { class: "pa-mini", html: O.svg(conLook(b0, L)) }), el("span", { text: L.nome }) ]);
        griglia.appendChild(b);
      });
      aggiorna();
    }
    function aggiorna() {
      var b0 = base(forma);
      cfg = look ? conLook(b0, look) : null;
      palco.innerHTML = O.svg(cfg || b0, { hd: true });
      palco.classList.toggle("senza", !cfg);
      bFatto.disabled = !cfg; bPers.hidden = !cfg;
      if (cfg) popOmino();
    }
    passoForma();
    mostra(s);
  }
  // ✨ L'EDITOR NUOVO (7 nov 2026, chat «👕 Avatar: vestiti e mani», tappa 5; Tavola 3 «E · Domani», approvata dal proprietario):
  // in alto «‹ Il tuo avatar» e «✨ Look» (i look pronti); il palco con la luce chiara dietro l'avatar (i vestiti scuri si vedono);
  // sotto le schede Corpo · Viso · Testa · Sopra · Sotto · Scarpe · Extra; sotto le schede, sempre a portata, i colori, il secondo
  // colore, le fantasie e le stoffe del pezzo aperto («dock»); sotto ancora le scelte a gruppi («Giacche e cappotti», «Maglioni e
  // felpe»…), ognuno una fila che scorre di lato, con miniature grandi inquadrate sul pezzo (il busto per i capi di sopra, le gambe per
  // il sotto, i piedi per le scarpe). Quando scegli, l'avatar fa una piccola posa (solo transform; ferma con «riduci movimento»).
  // In fondo «🎲 Sopra a caso» (la scheda aperta) e «Salva», l'unico tasto lampone pieno. Sul palco: ↺ annulla, 🎲 tutto a caso.
  // EDITOR_NUOVO: "tutti" = per tutti (anche IL PAPPONE) · "proprietario" = solo lui · "nessuno" = l'editor di prima (e il camerino
  // per il proprietario, vedi EDITOR_CAMERINO). Le miniature si disegnano solo quando si vedono (le file sono tante).
  var EDITOR_NUOVO = "tutti";
  function editorNuovo() { return EDITOR_NUOVO === "tutti" || (EDITOR_NUOVO === "proprietario" && eProprietario()); }
  // le schede: dock = le voci sempre a portata sotto le schede; gruppi = [titolo, voce, scelte, colore della voce]
  // (scelte: una lista di voci, il nome di un gruppo di GRUPPI_CAPELLI, il gruppo dei look, o niente = tutte; il colore = una fila di
  // tondi sotto le miniature). Le voci che nessun gruppo prende (una voce nuova in OPZ) vanno da sole in «Altri», in fondo alla scheda.
  var SEZ_NUOVO = [
    { nome: "Corpo", dock: ["pelle"], gruppi: [["Lui o lei", "forma"], ["Corporatura", "corpo"]] },
    { nome: "Viso", zoom: "viso", dock: ["iride"], gruppi: [["Forma del viso", "viso"], ["Orecchie", "orecchie"], ["Occhi", "occhi"], ["Sopracciglia", "sopracc"], ["Naso", "naso"],
      ["Bocca", "bocca"], ["Guance", "guance"], ["Segni particolari", "segno"], ["Ritocchi", "ritocchi"],
      ["Ombretto", "ombretto", null, "colOmbretto"], ["Eyeliner", "eyeliner", null, "colEyeliner"], ["Mascara", "mascara"], ["Rossetto", "rossetto", null, "colRossetto"], ["Blush", "blush", null, "colBlush"]] },
    { nome: "Testa", zoom: "testa", dock: ["colCap"], gruppi: [["Capelli corti", "capelli", "Corti"], ["Capelli medi", "capelli", "Medi"], ["Capelli lunghi", "capelli", "Lunghi"],
      ["Barba e baffi", "barba"], ["In testa", "cappello", null, "colAcc"], ["Occhiali e maschere", "occhiali"], ["Orecchini e piercing", "orecchini"]] },
    { nome: "Sopra", dock: ["maglia", "maglia2", "fant", "stoffa"], gruppi: [["Giacche e cappotti", "capo", ["giacca", "bomber", "cappotto", "gilet"]],
      ["Maglioni e felpe", "capo", ["felpa", "maglione", "dolcevita", "cardigan", "sportiva"]],
      ["Magliette e camicie", "capo", ["maglietta", "lunga", "camicia", "polo", "canotta", "calcio", "camicetta", "crop", "top"]],
      ["Vestiti", "capo", ["vestito", "vestitolungo"]], ["Da travestirsi", "capo", ["grembiule", "supereroe"]], ["Stampa sulla maglia", "stampa"]] },
    { nome: "Sotto", dock: ["pantaloni", "pant2", "fantP", "stoffaP"], gruppi: [["Jeans e pantaloni", "sotto", ["jeans", "cargo", "pantaloni", "strappati", "mimetici", "zampa"]],
      ["Corti e sportivi", "sotto", ["bermuda", "pantaloncini", "shortsjeans", "tuta", "leggings"]], ["Gonne", "sotto", ["gonna", "minigonna", "gonnapieghe", "gonnatubino", "gonnalunga"]]] },
    { nome: "Scarpe", dock: ["scarpe"], gruppi: [["Di tutti i giorni", "modScarpe", ["sneakers", "eleganti", "ballerine", "tacchi"]], ["Stivali", "modScarpe", ["stivali", "stivaletti", "anfibi", "stivalialti"]],
      ["D'estate", "modScarpe", ["sandali", "infradito", "zeppe"]], ["Per casa e per gioco", "modScarpe", ["pantofole", "pattini"]]] },
    { nome: "Extra", dock: [], gruppi: [["Al collo", "collo", null, "colCollo"], ["Borsa", "borsa", null, "colBorsa"], ["In mano", "mano", null, "colMano"], ["Sulla schiena", "schiena", null, "colSchiena"],
      ["Animaletto", "animale", null, "colAnimale"], ["Pittura sul viso", "pittura"]] },
    { nome: "Look", nascosta: true, dock: [], gruppi: [["Look pronti", "look", "pronti"], ["Colori che stanno bene", "look", "colori"], ["Per travestirsi", "look", "costumi"]] }
  ];
  // il nome di ogni voce nel dock (e nelle file di tondi sotto un gruppo: «Colore»)
  var DOCK_NOMI = { pelle: "Pelle", iride: "Occhi", colCap: "Capelli", maglia: "Colore", maglia2: "2° colore", fant: "Fantasia", stoffa: "Stoffa",
    pantaloni: "Colore", pant2: "2° colore", fantP: "Fantasia", stoffaP: "Stoffa", scarpe: "Colore" };
  // (#39, 7 nov 2026, chat «🔍 Camerino: l'avatar grande e lo zoom»; il proprietario: «il personaggio si vede troppo piccolo, uno non
  // riesce neanche a vedere i dettagli»; scelta B + la griglia della C, come i camerini dei giochi: The Sims, Fortnite, Roblox, Memoji)
  // IL CAMERINO GRANDE: l'avatar sta dietro a tutto, grande (circa metà schermo); sopra un foglio che si tira su e giù con le schede, i
  // colori in una riga sola (linguette Colore · 2° colore · Fantasia · Stoffa) e le scelte in una griglia (linguette dei gruppi in alto).
  // La telecamera va da sola sulla parte che si cambia (solo transform); in un angolo resta l'avatar intero in piccolo; un tocco sul palco
  // torna all'avatar intero; doppio tocco o due dita per avvicinare; un dito di lato per girarlo (il disegno ha davanti e di spalle).
  // false = il camerino di prima (palco piccolo e file che scorrono di lato).
  var CAMERINO_GRANDE = true;
  // le inquadrature del palco [x, y, larghezza, altezza] nel disegno 200×264 dell'avatar
  var INQ_PALCO = { intero: [18, -10, 164, 274], viso: [56, 0, 88, 88], testa: [36, -16, 128, 120], busto: [26, 14, 148, 160], gambe: [34, 110, 132, 156],
    piedi: [50, 190, 100, 78], mano: [48, 16, 132, 168], collo: [42, 28, 116, 104], borsa: [24, 58, 152, 140] };
  var INQ_SCHEDA = { Corpo: "intero", Viso: "viso", Testa: "testa", Sopra: "busto", Sotto: "gambe", Scarpe: "piedi", Extra: "intero", Look: "intero" };
  var INQ_VOCE = { mano: "mano", colMano: "mano", collo: "collo", colCollo: "collo", borsa: "borsa", colBorsa: "borsa", pittura: "viso",
    schiena: "intero", colSchiena: "intero", animale: "intero", colAnimale: "intero", look: "intero", forma: "intero", corpo: "intero", pelle: "intero" };
  var COLLO_SUL_CAPO = /^(giacca|cappotto|gilet|camicia|camicetta|polo)$/;   // le miniature dei capi: cravatta, papillon e medaglia solo sopra un colletto
  var TRUCCO_GR = /^(ombretto|eyeliner|mascara|rossetto|blush)$/;   // i gruppi del trucco: per lei (o per lui se ce l'ha già, per poterlo togliere)
  // le inquadrature delle miniature (avatar illustrati, riquadro 200×264): il busto per i capi di sopra, le gambe, i piedi; larghe come il corpo
  // (e da vicino: il viso per occhi, naso, bocca…; più spazio in alto per i cappelli; le orecchie per gli orecchini)
  var INQ = { sopra: { snello: "45 54 110 99", medio: "41 52 118 106", robusto: "37 50 126 113" }, piedi: { snello: "58 194 84 66", medio: "55 194 90 66", robusto: "51 194 98 66" },
    viso: "72 12 56 56", trucco: "75 17 50 46", cappello: "60 -8 80 82", orecchini: "70 18 60 54" };
  var VOLTO = /^(viso|orecchie|occhi|sopracc|naso|bocca|guance|segno|occhiali|pittura)$/;   // le voci con la miniatura sul viso
  // la piccola posa dell'avatar quando scegli (solo transform, dai piedi): una mossa per i capi, un saltello per sotto e scarpe,
  // un respiro per i colori, una giravolta per i look
  var POSE = {
    capo: [[{ transform: "none" }, { transform: "translateY(-5px) rotate(-3deg)", offset: 0.3 }, { transform: "translateY(0) rotate(2deg) scale(1.02,.99)", offset: 0.62 }, { transform: "none" }], 620],
    gambe: [[{ transform: "none" }, { transform: "translateY(-10px) scale(.98,1.03)", offset: 0.32 }, { transform: "translateY(0) scale(1.03,.97)", offset: 0.6 }, { transform: "none" }], 520],
    colore: [[{ transform: "none" }, { transform: "scale(1.035)", offset: 0.4 }, { transform: "none" }], 360],
    giro: [[{ transform: "none" }, { transform: "scaleX(.06) translateY(-6px)", offset: 0.3 }, { transform: "scaleX(-1) translateY(-8px)", offset: 0.5 }, { transform: "scaleX(.06) translateY(-4px)", offset: 0.72 }, { transform: "none" }], 720]
  };
  function poseDi(k) {
    if (k === "look") return "giro";
    if (/^(capo|fant|stoffa|stampa|maglia2|collo|borsa|schiena)$/.test(k)) return "capo";
    if (/^(sotto|fantP|stoffaP|pant2|modScarpe)$/.test(k)) return "gambe";
    if (OMINO_COLORI[k]) return "colore";
    return null;   // (le altre: il saltello di sempre)
  }
  function movimentoFermo() {   // «riduci movimento» del telefono, o l'app a riposo
    try { if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return true; } catch (e) {}
    return !!(document.body && document.body.classList.contains("sg-riposo"));
  }
  // il campione di una fantasia o di una stoffa nel dock, coi colori di adesso (solo CSS: niente avatar da disegnare)
  function campione(k, v, c1, c2) {
    var chiaro = "rgba(255,255,255,.55)";
    if (/^fant/.test(k)) {
      if (v === "righe") return "repeating-linear-gradient(0deg," + c1 + " 0 3px," + c2 + " 3px 6px)";
      if (v === "quadri") return "linear-gradient(90deg," + c2 + "99 50%,transparent 50%) 0 0/8px 8px,linear-gradient(0deg," + c2 + "99 50%,transparent 50%) 0 0/8px 8px," + c1;
      if (v === "pois") return "radial-gradient(" + c2 + " 28%,transparent 32%) 0 0/7px 7px," + c1;
      if (v === "mimetica") return "radial-gradient(circle at 28% 30%,#3f4527 26%,transparent 28%),radial-gradient(circle at 72% 66%,#8a8456 24%,transparent 26%),radial-gradient(circle at 70% 20%,#2c2f1d 16%,transparent 18%),#6b7040";
      if (v === "jeans") return "repeating-linear-gradient(45deg,rgba(255,255,255,.12) 0 1px,transparent 1px 3px),#4a6a94";
      if (v === "hawaiana") return "radial-gradient(circle at 30% 34%," + c2 + " 20%,transparent 23%),radial-gradient(circle at 72% 70%," + c2 + " 17%,transparent 20%),radial-gradient(circle at 78% 22%,#2f9e44 10%,transparent 13%)," + c1;
      return c1;
    }
    if (v === "lana") return "repeating-linear-gradient(45deg,rgba(0,0,0,.28) 0 1.5px,transparent 1.5px 4px),repeating-linear-gradient(-45deg,rgba(255,255,255,.14) 0 1.5px,transparent 1.5px 4px)," + c1;
    if (v === "pelle") return "linear-gradient(135deg,rgba(0,0,0,.45),rgba(255,255,255,.35) 42%,rgba(0,0,0,.25) 52%,rgba(0,0,0,.55))," + c1;
    if (v === "raso") return "linear-gradient(115deg,rgba(255,255,255,0) 20%," + chiaro + " 45%,rgba(255,255,255,0) 70%)," + c1;
    if (v === "paillettes") return "radial-gradient(rgba(255,255,255,.85) 18%,transparent 26%) 0 0/5px 5px,radial-gradient(rgba(0,0,0,.35) 18%,transparent 26%) 2.5px 2.5px/5px 5px," + c1;
    return c1;
  }

  function schermataOmino(dopo, bozza, opz) {
    if (opz && opz.benvenuto && !opz.personalizza && !bozza && window.SGOmino && profiloAttivo()) return schermataPrimoAvatar(dopo);
    var io = bozza || profiloAttivo(), benv = !!(opz && opz.benvenuto);
    if (!io) return cuore.schermataAccesso(function () { schermataOmino(dopo, null, opz); });
    var salvaOminoMio = bozza ? function (c, om, n) { bozza.omino = c; bozza.omini = om; bozza.ominoN = n; } : salvaOminoProfilo;
    var O = SGOmino, cfg = O.norm(io.omino || O.casuale(io.nome));
    var tab = 0;
    // più personaggi a persona: sotto il riflettore c'è il principale, scorrendo a destra/sinistra (o con le frecce) si passa agli altri
    var principale = io.omini ? (io.ominoN || 0) : 0, slot = principale;
    var bozze = io.omini ? [io.omini[0] || null, io.omini[1] || null] : [cfg, null];
    bozze[slot] = cfg;
    if (!bozze[1 - slot]) bozze[1 - slot] = secondoOmino(cfg, io.nome);
    var nuovo = editorNuovo(), grande = nuovo && CAMERINO_GRANDE;
    // (editor nuovo) in alto «‹ Il tuo avatar» (nel benvenuto niente ‹: un saluto) e «✨ Look»
    var s = schermata(nuovo ? { titolo: benv ? "👋 Ecco il tuo avatar!" : (bozza && bozza.nome ? "Avatar di " + bozza.nome : "Il tuo avatar"), indietro: benv ? null : function () { esci(); } } : {});   // (bozza: l'avatar di un bot)
    s.classList.add("editor-avatar");   // tutto in uno schermo: scorrono solo le scelte
    var camerino = !nuovo && (EDITOR_CAMERINO || eProprietario()), SEZ = nuovo ? SEZ_NUOVO : (camerino ? SEZ_CAMERINO : SEZ_OMINO);
    if (camerino) s.classList.add("camerino");
    if (nuovo) { s.classList.add("ed3"); tab = indice("Sopra"); }   // (si apre sui vestiti: la cosa che si cambia più spesso)
    if (grande) s.classList.add("ed4");
    function indice(nome) { for (var i = 0; i < SEZ.length; i++) if (SEZ[i].nome === nome) return i; return 0; }
    var iniziali = bozze.map(function (b) { return O.norm(b); });   // com'erano all'ingresso (se esci senza salvare)
    // il palco: faro dall'alto, pedana luminosa, omino che respira e sbatte le palpebre (toccalo: reagisce!)
    var figura = el("div", { class: "om-figura", title: "Toccami!" });
    var puntini = el("div", { class: "om-puntini" });
    var palco = el("div", { class: "omino-palco editor" }, [el("div", { class: "om-faro" }), el("div", { class: "om-pedana" }), figura,
      puntini,
      nuovo ? null : (benv ? el("div", { class: "om-benv", text: "👋 Ecco il tuo avatar! Cambialo come vuoi" })
           : el("button", { class: "om-indietro", "aria-label": "Indietro", text: "‹", onclick: function () { esci(); } })),
      el("button", { class: "om-freccia sx", "aria-label": "Personaggio precedente", text: "‹", onclick: function () { scorri(-1); } }),
      el("button", { class: "om-freccia dx", "aria-label": "Personaggio successivo", text: "›", onclick: function () { scorri(1); } })]);
    function disegnaCambi() {
      puntini.innerHTML = bozze.map(function (b, n) { return "<i class='" + (n === slot ? "on" : "") + "'></i>"; }).join("");
    }
    // il principale (quello usato nei giochi) è quello sul palco quando esci.
    // Con la freccia indietro le modifiche non salvate si perdono, ma la scelta del personaggio resta.
    function esci() {
      if (slot !== principale) salvaOminoMio(iniziali[slot], iniziali, slot);
      dopo();
    }
    function scorri(dir) {   // dir: +1 = verso destra (il prossimo), -1 = verso sinistra
      bozze[slot] = cfg; slot = (slot + dir + bozze.length) % bozze.length; cfg = O.norm(bozze[slot]);
      storia = []; aggAnnulla(); aMano = {};   // (un altro avatar: i suoi colori non li hai ancora toccati)
      if (grande) { dietro = false; clearTimeout(cam.tGiro); }
      if (visibile(tab) < 0) tab = nuovo ? indice("Sopra") : 0;
      anteprima(false); disegnaSchede(); disegnaPannello(); popOmino();
      var sv = figura.firstChild;   // entra scivolando dal lato giusto
      if (sv && sv.animate && !movimentoFermo()) sv.animate([{ transform: "translateX(" + (dir * 90) + "px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 320, easing: "cubic-bezier(.2,.8,.3,1)" });
    }
    // scorrimento col dito sul palco (camerino grande: il dito di lato gira l'avatar, i due avatar si cambiano con le frecce)
    var x0 = null, y0 = null;
    palco.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    palco.addEventListener("touchend", function (e) {
      if (x0 == null || grande) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) scorri(dx < 0 ? 1 : -1);   // dito verso sinistra = il prossimo
    });
    var schede = el("div", { class: "omino-schede" });
    var pannello = el("div", { class: "omino-pannello" });
    var sottoschede = el("div", { class: "omino-sotto" });   // le sottocategorie della scheda aperta (es. Vestiti: Parti superiori, Parti inferiori, Scarpe)
    var dock = el("div", { class: "ed3-dock" });   // (editor nuovo) i colori, il secondo colore, le fantasie e le stoffe del pezzo aperto
    s._contenuto.appendChild(palco);
    if (camerino) {   // la maniglia: tirata su (o toccata) si vedono tutte le scelte e l'avatar si fa piccolo; giù torna grande
      var maniglia = el("button", { class: "om-maniglia", onclick: function () { apriTutto(!s.classList.contains("aperto")); } });
      var apriTutto = function (si) {
        s.classList.toggle("aperto", si); maniglia.textContent = si ? "⌄ Avatar grande" : "⌃ Vedi tutte le scelte";
        if (!si) setTimeout(centraScelte, 50);
      };
      var yM = null;
      [maniglia, schede, sottoschede].forEach(function (n) {
        n.addEventListener("touchstart", function (e) { yM = e.touches[0].clientY; }, { passive: true });
        n.addEventListener("touchend", function (e) { if (yM == null) return; var dy = e.changedTouches[0].clientY - yM; yM = null; if (Math.abs(dy) > 40) apriTutto(dy < 0); });
      });
      apriTutto(false);
      s._contenuto.appendChild(maniglia);
    }
    var foglio = null;
    if (grande) {   // il foglio sopra l'avatar: maniglia, schede, colori, scelte
      foglio = el("div", { class: "ed4-foglio" }, [el("button", { class: "ed4-man", type: "button", "aria-label": "Più scelte o avatar più grande" }), schede, dock, pannello]);
      s._contenuto.appendChild(foglio);
    } else if (nuovo) { s._contenuto.appendChild(schede); s._contenuto.appendChild(dock); s._contenuto.appendChild(pannello); }
    else { s._contenuto.appendChild(schede); s._contenuto.appendChild(sottoschede); s._contenuto.appendChild(pannello); }
    // ===================== (#39) il camerino grande: telecamera, foglio, dita =====================
    // cam.reg = l'inquadratura (INQ_PALCO), cam.tab = quella della scheda aperta, cam.lib = { s, x, y } quando si avvicina con le dita
    // o col doppio tocco, cam.t = la trasformazione di adesso, cam.dita = l'ultima volta che un dito ha toccato il palco.
    // La figura ha una misura fissa (quella dell'avatar intero col foglio giù) e si sposta e si ingrandisce solo con transform.
    var cam = { reg: "intero", tab: null, lib: null, t: null, dita: 0, tGiro: 0 }, dietro = false, mis = null, frac = 0, foglioSu = false;
    var specchio = null, bGira = null;
    if (grande) {
      specchio = el("button", { class: "ed4-spec", type: "button", "aria-label": "Torna all'avatar intero", onclick: function () { intero(); } });
      bGira = el("button", { class: "ed4-gira", type: "button", text: "🔄", "aria-label": "Gira l'avatar", onclick: function () { gira(); } });
      palco.appendChild(specchio); palco.appendChild(bGira);
    }
    function misura() {   // le misure del palco e del foglio (all'apertura e quando cambia lo schermo)
      var cH = s._contenuto.clientHeight, cW = palco.clientWidth;
      if (!cH || !cW) return false;
      var giu = Math.round(Math.max(cH < 560 ? 250 : 282, Math.min(cH * 0.42, cH - 260)));
      var su = Math.round(Math.max(giu, Math.min(cH - 170, cH * 0.74)));
      mis = { cH: cH, cW: cW, giu: giu, su: su, fh: Math.max(120, cH - giu - 26) };
      foglio.style.height = su + "px";
      figura.style.height = mis.fh + "px";
      s.classList.add("misurato");
      applicaFoglio(false);
      return true;
    }
    function area() {   // lo spazio del palco che si vede sopra il foglio
      var fv = mis.giu + (mis.su - mis.giu) * frac;
      return { l: 0, t: 8, w: mis.cW, h: Math.max(60, mis.cH - fv - 18) };
    }
    function tDi(reg) {   // la trasformazione che mette l'inquadratura reg nello spazio libero
      var A = area(), k = mis.fh / 264, r = INQ_PALCO[reg] || INQ_PALCO.intero, f = reg === "intero" ? 1 : 0.95;
      var sc = Math.min(A.w * f / (r[2] * k), A.h * f / (r[3] * k));
      var t = { s: sc, x: A.l + A.w / 2 - (r[0] + r[2] / 2) * k * sc, y: A.t + A.h / 2 - (r[1] + r[3] / 2) * k * sc };
      if (reg === "intero") t.y = A.t + A.h - 4 - 262 * k * sc;   // (intero: i piedi in fondo allo spazio libero)
      return t;
    }
    function zoomato() { return !!(cam.lib || cam.reg !== "intero"); }
    function camera(anim) {
      if (!grande || !mis) return;
      var t = cam.lib || tDi(cam.reg), k = mis.fh / 264, fermo = !anim || movimentoFermo();
      cam.t = t;
      figura.style.transition = fermo ? "none" : "";
      figura.style.transform = "translate(" + t.x.toFixed(1) + "px," + t.y.toFixed(1) + "px) scale(" + t.s.toFixed(4) + ")";
      var ped = palco.querySelector(".om-pedana");   // la pedana sotto i piedi (si spegne da vicino)
      if (ped) { var w = 150 * k * t.s; ped.style.transition = fermo ? "none" : ""; ped.style.transform = "translate(" + (t.x + 100 * k * t.s - w / 2).toFixed(1) + "px," + (t.y + 256 * k * t.s - w * 0.075).toFixed(1) + "px) scale(" + (w / 210).toFixed(4) + ")"; }
      var A = area(); palco.style.setProperty("--area", Math.round(A.t + A.h) + "px");
      var z = zoomato(); palco.classList.toggle("zoomato", z); aggSpecchio(false);
    }
    function vaiA(reg) { if (!grande) return; if (reg !== cam.reg || cam.lib) { cam.reg = reg; cam.lib = null; camera(true); } }
    function intero() { cam.reg = "intero"; cam.lib = null; camera(true); }
    var specFatto = false, tSpec = 0;
    function aggSpecchio(cambiato) {   // l'avatar intero in piccolo nell'angolo, solo quando la telecamera è vicina: un'immagine (non un
      if (!specchio) return;            // altro avatar da costruire nella pagina), fatta un attimo dopo il tocco, così la scelta risponde subito
      if (cambiato) specFatto = false;
      if (!zoomato() || specFatto || tSpec) return;
      tSpec = setTimeout(function () {
        tSpec = 0; if (specFatto || !zoomato() || !document.body.contains(s)) return;
        specFatto = true;
        var sv = dietro ? O.svg(cfg) : (figura.firstChild && figura.firstChild.outerHTML) || O.svg(cfg);
        specchio.innerHTML = "<img alt='' draggable='false' src='data:image/svg+xml;charset=utf-8," + encodeURIComponent(sv) + "'>";
      }, 140);
    }
    function giraAnim() {   // la seconda metà del giro: l'avatar (già disegnato dall'altra parte) si riapre di lato
      var sv = figura.firstChild;
      if (sv && sv.animate && !movimentoFermo()) { sv.style.transformOrigin = "50% 50%"; sv.animate([{ transform: "scaleX(.05)" }, { transform: "none" }], { duration: 220, easing: "cubic-bezier(.2,.8,.3,1)" }); }
    }
    function gira(verso) {   // davanti ↔ di spalle: si stringe di lato, cambia, si riapre
      clearTimeout(cam.tGiro);
      var nuovoVerso = verso == null ? !dietro : !!verso;
      if (nuovoVerso === dietro) return;
      dietro = nuovoVerso;
      var sv = figura.firstChild;
      if (!sv || !sv.animate || movimentoFermo()) return anteprima(false);
      sv.style.transformOrigin = "50% 50%";
      var a = sv.animate([{ transform: "none" }, { transform: "scaleX(.05)" }], { duration: 150, easing: "ease-in", fill: "forwards" });
      a.onfinish = function () { anteprima(false); giraAnim(); };
    }
    // il foglio: tirato su (o toccata la maniglia) più scelte e l'avatar inquadrato sopra; giù l'avatar grande
    function applicaFoglio(anim) {
      if (!mis) return;
      var off = Math.round((mis.su - mis.giu) * (1 - frac));
      foglio.style.transition = anim && !movimentoFermo() ? "" : "none";
      foglio.style.transform = off ? "translateY(" + off + "px)" : "none";
      if (anim !== "dito") pannello.style.paddingBottom = (off + 16) + "px";   // (tutte le scelte si raggiungono anche col foglio giù)
      camera(anim === true);
    }
    function foglioA(su) { foglioSu = su; frac = su ? 1 : 0; applicaFoglio(true); s.classList.toggle("foglio-su", su); }
    if (grande) (function () {
      var man = foglio.querySelector(".ed4-man"), d = null, mosso = 0;
      man.addEventListener("click", function () { if (Date.now() - mosso > 400) foglioA(!foglioSu); });
      foglio.addEventListener("click", function (e) { if (Date.now() - mosso < 400) { e.stopPropagation(); e.preventDefault(); } }, true);   // (dopo una tirata niente tocchi per sbaglio)
      [man, schede, dock].forEach(function (n) {
        n.addEventListener("pointerdown", function (e) { if (!mis || e.pointerType === "mouse" && e.button) return; d = { y: e.clientY, x: e.clientX, f: frac, t: Date.now(), via: false, n: n, id: e.pointerId }; });
      });
      window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onSu); window.addEventListener("pointercancel", onSu);
      function onMove(e) {
        if (!d || e.pointerId !== d.id) return;
        if (!document.body.contains(s)) return stacca();
        var dy = e.clientY - d.y, dx = e.clientX - d.x;
        if (!d.via) { if (Math.abs(dy) < 10 || Math.abs(dy) < Math.abs(dx)) { if (Math.abs(dx) > 12) d = null; return; } d.via = true; }
        frac = Math.max(0, Math.min(1, d.f - dy / Math.max(1, mis.su - mis.giu)));
        applicaFoglio("dito");
      }
      function onSu(e) {
        if (!d || e.pointerId !== d.id) return;
        var x = d; d = null;
        if (!x.via) return;
        mosso = Date.now();
        var dy = e.clientY - x.y, v = dy / Math.max(1, Date.now() - x.t);
        foglioA(Math.abs(v) > 0.35 ? v < 0 : frac > 0.5);
      }
      function stacca() { d = null; window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onSu); window.removeEventListener("pointercancel", onSu); }
      cam.stacca = stacca;
    })();
    // le dita sul palco: un tocco (da vicino: torna intero; da lontano: l'avatar reagisce), doppio tocco (avvicina / torna intero),
    // due dita (avvicina e sposta), un dito da vicino (sposta), un dito di lato da lontano (gira l'avatar)
    if (grande) (function () {
      var pt = {}, g = null, ultimo = null, tUno = 0;
      function locale(e) { var r = palco.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
      function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
      function mezzo(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
      function sIntero() { return tDi("intero").s; }
      palco.addEventListener("pointerdown", function (e) {
        if (!mis || (e.target.closest && e.target.closest("button"))) return;
        cam.dita = Date.now();
        pt[e.pointerId] = locale(e);
        try { palco.setPointerCapture(e.pointerId); } catch (x) {}
        var ids = Object.keys(pt), t = cam.t || tDi(cam.reg);
        if (ids.length === 2) g = { tipo: "pizzico", d0: Math.max(10, dist(pt[ids[0]], pt[ids[1]])), m0: mezzo(pt[ids[0]], pt[ids[1]]), t0: t };
        else if (ids.length === 1) g = { tipo: "uno", p0: pt[e.pointerId], t0: t, ora: Date.now() };
      });
      palco.addEventListener("pointermove", function (e) {
        if (!pt[e.pointerId] || !g) return;
        pt[e.pointerId] = locale(e); cam.dita = Date.now();
        var ids = Object.keys(pt), t0 = g.t0;
        if (g.tipo === "pizzico" && ids.length >= 2) {
          var a = pt[ids[0]], b = pt[ids[1]], m = mezzo(a, b), si = sIntero();
          var sc = Math.max(si, Math.min(si * 5, t0.s * dist(a, b) / g.d0));
          var px = (g.m0.x - t0.x) / t0.s, py = (g.m0.y - t0.y) / t0.s;
          cam.lib = { s: sc, x: m.x - px * sc, y: m.y - py * sc }; camera(false);
        } else if (g.tipo === "uno" || g.tipo === "sposta") {
          var p = pt[e.pointerId], dx = p.x - g.p0.x, dy = p.y - g.p0.y;
          if (g.tipo === "uno" && Math.hypot(dx, dy) > 8 && zoomato()) g.tipo = "sposta";
          if (g.tipo === "sposta") { cam.lib = { s: t0.s, x: t0.x + dx, y: t0.y + dy }; camera(false); }
        }
      });
      function su(e) {
        var p = pt[e.pointerId]; if (!p) return;
        delete pt[e.pointerId]; cam.dita = Date.now();
        if (!g) return;
        var x = g; if (Object.keys(pt).length) { g = { tipo: "fermo" }; return; }
        g = null;
        if (x.tipo !== "uno" || e.type === "pointercancel") return;
        var dx = p.x - x.p0.x, dy = p.y - x.p0.y;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) return gira();   // un dito di lato: si gira
        if (Math.hypot(dx, dy) > 12 || Date.now() - x.ora > 450) return;
        var sulFig = !!(e.target && e.target.closest && e.target.closest(".om-figura"));
        if (ultimo && Date.now() - ultimo.ora < 320 && dist(ultimo, p) < 40) {   // doppio tocco
          clearTimeout(tUno); ultimo = null;
          if (zoomato()) return intero();
          var t = cam.t, sc = sIntero() * 2.6, qx = (p.x - t.x) / t.s, qy = (p.y - t.y) / t.s;
          cam.lib = { s: sc, x: p.x - qx * sc, y: p.y - qy * sc }; camera(true); return;
        }
        ultimo = { x: p.x, y: p.y, ora: Date.now() };
        clearTimeout(tUno); tUno = setTimeout(function () {
          ultimo = null;
          if (!document.body.contains(s)) return;
          if (zoomato()) intero(); else if (dietro) gira(false); else if (sulFig) reagisci();
        }, 300);
      }
      palco.addEventListener("pointerup", su); palco.addEventListener("pointercancel", su);
    })();
    function mostraAttiva() {   // aperta una scheda: la scelta di adesso in vista (la griglia scorre in su e in giù)
      var a = pannello.querySelector(".ed3-t.attiva"); if (!a) return;
      var ch = pannello.querySelector(".ed4-chips"), hc = ch ? ch.offsetHeight : 0;
      var y0 = pannello.getBoundingClientRect().top - pannello.scrollTop, top = a.getBoundingClientRect().top - y0, vis = pannello.clientHeight - (parseFloat(pannello.style.paddingBottom) || 0);
      if (top + a.offsetHeight <= pannello.scrollTop + vis - 10) return;
      var sec = a.closest(".ed3-gr"), st = sec ? sec.getBoundingClientRect().top - y0 : top;   // (il titolo del gruppo in vista, se la scelta è nella prima riga)
      pannello.scrollTop = Math.max(0, (top - st < 140 ? st : top - 8) - hc);
    }
    if (grande) {
      var aRiMisura = function () { if (!document.body.contains(s)) { window.removeEventListener("resize", aRiMisura); if (cam.stacca) cam.stacca(); return; } misura(); };
      window.addEventListener("resize", aRiMisura);
    }
    function centraScelte() {   // nelle file da scorrere: la scelta di adesso in vista
      if (nuovo) { [].forEach.call(s.querySelectorAll(".ed3-fila, .ed3-scorre"), centraFila); return; }
      if (!camerino || s.classList.contains("aperto")) return;
      [].forEach.call(pannello.querySelectorAll(".om-griglia"), function (riga) {
        var a = riga.querySelector(".attiva"); if (a) riga.scrollLeft = Math.max(0, a.offsetLeft - riga.offsetLeft - (riga.clientWidth - a.offsetWidth) / 2);
      });
    }
    function centraFila(riga) { var a = riga.querySelector(".attiva"); if (a) riga.scrollLeft = Math.max(0, a.offsetLeft - (riga.clientWidth - a.offsetWidth) / 2); }
    function inVista(riga) { var a = riga.querySelector(".attiva"); return !a || (a.offsetLeft >= riga.scrollLeft - 2 && a.offsetLeft + a.offsetWidth <= riga.scrollLeft + riga.clientWidth + 2); }
    function unisci(k, v) {
      if (k === "forma") return O.adattaForma(cfg, v);   // maschio/femmina: cambiano anche capelli, barba, trucco
      var c = {}; for (var x in cfg) c[x] = cfg[x]; c[k] = v;
      var pz = partenza(k, v); if (pz) pz.forEach(function (x) { c[x.chiave] = x.valore; });   // l'anteprima col colore con cui arriverebbe
      return c;
    }
    // (6 nov 2026) il colore di partenza del capo, del sotto o delle scarpe toccati (null = il colore di adesso resta: vedi SGOmino.coloreDiPartenza)
    // e (tappa 3) il secondo colore che arriva da solo con una fantasia, o che segue il colore del capo (vedi SGOmino.secondoDiPartenza).
    // → [{ chiave, valore }, …] le scelte che cambiano da sole insieme a quella toccata (null = nessuna)
    // (correzioni 4-5) la scelta di adesso non cambia niente (la sua miniatura è l'avatar com'è: con le sneakers nere la miniatura delle
    // sneakers era bianca); e un colore toccato a mano in questo editor resta sui capi nuovi e nelle miniature, anche quando è quello di
    // BASE (che da solo vuol dire «mai scelto»): scegli il nero e tutte le scarpe in anteprima sono nere
    var aMano = {};
    function partenza(k, v) {
      if (valore(k) === v) return null;
      var r = [], pz = /^(capo|sotto|modScarpe)$/.test(k) && O.coloreDiPartenza ? O.coloreDiPartenza(cfg, k, v) : null;
      if (pz && aMano[pz.chiave]) pz = null;
      if (pz) r.push(pz);
      var kk = pz ? pz.chiave : k, vv = pz ? pz.valore : v, s2 = O.secondoDiPartenza ? O.secondoDiPartenza(cfg, kk, vv) : null;
      if (s2 && aMano[s2.chiave]) s2 = null;
      if (s2) r.push(s2);
      return r.length ? r : null;
    }
    function valore(k) { var D0 = O.NUOVI_VESTITI; return cfg[k] == null && D0 && k in D0 ? D0[k] : cfg[k]; }
    function listaDi(k) { return O.OPZ[LISTA_DI[k] || k]; }
    function salto() {   // saltello senza ricalcolare la pagina (le anteprime sono tante)
      var sv = figura.firstChild;
      if (sv && sv.animate && !movimentoFermo()) sv.animate([{ transform: "none" }, { transform: "translateY(-12px) scale(.96,1.05)", offset: 0.3 },
        { transform: "scale(1.05,.95)", offset: 0.62 }, { transform: "none" }], { duration: 450, easing: "cubic-bezier(.3,1.5,.5,1)" });
    }
    function posa(k) {   // (editor nuovo) la piccola posa quando scegli: dai piedi (col viso da vicino: solo un respiro, intorno al viso)
      var vicino = palco.classList.contains("zoomato"), p = POSE[vicino ? "colore" : poseDi(k)], sv = figura.firstChild;
      if (!p) return salto();
      if (!sv || !sv.animate || movimentoFermo()) return;
      sv.style.transformOrigin = vicino ? "50% 14%" : "50% 100%";
      sv.animate(p[0], { duration: p[1], easing: "cubic-bezier(.3,1.3,.5,1)" });
    }
    // conSalto: true = il saltello; (editor nuovo) il nome della voce scelta = la sua posa
    function anteprima(conSalto) {
      clearTimeout(tReaz);
      figura.innerHTML = O.svg(cfg, dietro ? { hd: true, spalle: true } : { hd: true }); disegnaCambi();
      if (grande) aggSpecchio(true);
      if (conSalto) { if (nuovo && typeof conSalto === "string") posa(conSalto); else salto(); popOmino(); }
    }
    var tSaluto = null;
    function saluta() {   // alza il braccio e fa "ciao"
      clearTimeout(tSaluto); figura.classList.remove("saluta"); void figura.offsetWidth; figura.classList.add("saluta");
      tSaluto = setTimeout(function () { figura.classList.remove("saluta"); }, 1100);
    }
    // toccalo e reagisce: ride, fa l'occhiolino, si emoziona, saluta
    var REAZIONI = [{ occhi: "felici", bocca: "risata" }, { occhi: "occhiolino", bocca: "linguaccia" }, null, { occhi: "stelline", bocca: "o" }], nReaz = 0, tReaz = null;
    figura.addEventListener("click", function () {
      if (grande && (Date.now() - cam.dita < 700)) return;   // (camerino grande: il tocco col dito lo guarda il palco)
      reagisci();
    });
    function reagisci() {
      if (grande && dietro) return gira(false);
      var r = REAZIONI[nReaz++ % REAZIONI.length];
      if (!r) { anteprima(false); saluta(); popOmino(); return; }
      var c2 = {}, k; for (k in cfg) c2[k] = cfg[k]; for (k in r) c2[k] = r[k];
      figura.innerHTML = O.svg(c2, { hd: true }); salto(); popOmino();
      clearTimeout(tReaz); tReaz = setTimeout(function () { figura.innerHTML = O.svg(cfg, { hd: true }); }, 1200);
    }
    // ↩️ annulla l'ultima scelta
    var storia = [], trascina = false;
    function ricorda() { storia.push(JSON.stringify(cfg)); if (storia.length > 40) storia.shift(); aggAnnulla(); }
    var bAnnulla = el("button", { class: "om-azione annulla", text: nuovo ? "↺" : "↩️", "aria-label": "Annulla l'ultima scelta", onclick: function () {
      if (!storia.length) return;
      var prima = cfg.forma; cfg = JSON.parse(storia.pop()); aggAnnulla();
      if (visibile(tab) < 0) tab = nuovo ? indice("Sopra") : 0;
      anteprima(true); if (prima !== cfg.forma) disegnaSchede(); disegnaPannello();
    } });
    function aggAnnulla() { bAnnulla.classList.toggle("spento", !storia.length); }
    // le schede: il trucco c'è solo per lei; la telecamera va sul viso per viso, trucco e capelli
    function trucco() { return ["ombretto", "eyeliner", "mascara", "rossetto", "blush"].some(function (k) { return cfg[k] && !/^nessun/.test(cfg[k]); }); }
    function visibile(i) {   // (se lui ha già del trucco salvato, la scheda resta per poterlo togliere)
      var sz = SEZ[i];
      return sz && (!sz.solo || sz.solo === cfg.forma || (sz.nome === "Trucco" && trucco())) ? i : -1;
    }
    // (editor nuovo) «✨ Look» in alto a destra: i look pronti al posto delle scelte (nessuna scheda accesa); toccato di nuovo, si torna
    var tabPrima = tab, bLook = null, bAcaso = null;
    if (nuovo) {
      bLook = el("button", { class: "ed3-look", type: "button", text: "✨ Look", "aria-label": "Look pronti", onclick: function () {
        var iL = indice("Look");
        if (tab === iL) tab = tabPrima; else { tabPrima = tab; tab = iL; }
        disegnaSchede(); disegnaPannello(); pannello.scrollTop = 0; if (grande) mostraAttiva();
      } });
      var testa = s.querySelector(".testa"); if (testa) testa.appendChild(bLook);
    }
    function disegnaSchede() {
      schede.innerHTML = ""; var n = 0;
      SEZ.forEach(function (sz, i) {
        if (visibile(i) < 0 || sz.nascosta) return; n++;
        var figli = nuovo ? [el("span", { text: sz.nome })] : [el("span", { class: "ci", text: sz.icona }), el("span", { text: sz.nome })];
        schede.appendChild(el("button", { class: "cat-tab" + (i === tab ? " attiva" : ""), "aria-pressed": i === tab ? "true" : "false",
          onclick: function () { if (nuovo && i === tab) return; tab = i; disegnaSchede(); disegnaPannello(); pannello.scrollTop = 0; if (grande) mostraAttiva(); } }, figli));
      });
      schede.style.gridTemplateColumns = "repeat(" + n + ",minmax(0,1fr))";
      schede.classList.toggle("sette", n > 6);
      var z = SEZ[tab].zoom;
      if (grande) {   // la telecamera va sulla parte della scheda (solo quando la scheda cambia: cambiare avatar non la sposta)
        var rz = INQ_SCHEDA[SEZ[tab].nome] || "intero";
        if (rz !== cam.tab) { cam.tab = rz; cam.reg = rz; cam.lib = null; if (dietro) { dietro = false; anteprima(false); } camera(true); }
      } else { figura.classList.toggle("zoom-viso", z === "viso"); figura.classList.toggle("zoom-testa", z === "testa"); palco.classList.toggle("zoomato", !!z); }
      if (nuovo) {
        bLook.classList.toggle("attiva", SEZ[tab].nome === "Look"); bLook.setAttribute("aria-pressed", SEZ[tab].nome === "Look" ? "true" : "false");
        if (bAcaso) { bAcaso.textContent = "🎲 " + SEZ[tab].nome + " a caso"; bAcaso.setAttribute("aria-label", (SEZ[tab].nome === "Look" ? "Un look" : SEZ[tab].nome) + " a caso"); }
      }
    }
    function nomeDi(k, val) {
      if (k === "forma") return val === "donna" ? "👧 Femmina" : "👦 Maschio";
      var n = (O.NOMI_K && O.NOMI_K[k] && O.NOMI_K[k][val]) || O.NOMI[val] || val;
      return n.charAt(0).toUpperCase() + n.slice(1);
    }
    function opzMini(k, c) {   // l'anteprima giusta per ogni voce: gambe, viso da vicino, figura intera, dalla testa alla vita (fantasie e stoffe) o solo la testa
      if (/^(fant|stoffa)$/.test(k)) return O.svg(c, { vita: true });
      return O.svg(c, /^(sotto|modScarpe|fantP|stoffaP)$/.test(k) ? { gambe: true } : (TRUCCO_VOCI.test(k) ? { viso: true, senzaOcchiali: k !== "pittura" } : { busto: !OMINO_INTERO[k], senzaCappello: /^(capelli|colCap)$/.test(k) }));
    }
    // (editor nuovo) le miniature inquadrate sul pezzo: coi capi di sopra il busto, coi pantaloni le gambe, con le scarpe i piedi;
    // i look, lui o lei e la corporatura a figura intera. Con gli avatar di prima (non illustrati) le inquadrature di sempre.
    function inquadra(svg, vb) { return svg.replace(/viewBox='[^']*'/, "viewBox='" + vb + "'"); }
    var SENZA_COSE = { mano: "nessuno", schiena: "nessuna", animale: "nessuno", borsa: "nessuna" };
    function miniNuova(k, c) {
      var ill = O.stile && O.stile() === "illustrato", corpo = INQ.sopra[c.corpo] ? c.corpo : "medio";
      if (/^(capo|stampa|sotto|modScarpe)$/.test(k)) {   // sui vestiti niente chitarra, zaino, cose in mano o animaletto davanti: si vede il capo
        var c2 = {}, x; for (x in c) c2[x] = c[x]; for (x in SENZA_COSE) c2[x] = SENZA_COSE[x]; c = c2;
        // (#39) sulle felpe, i maglioni, le magliette… niente cravatta, papillon né medaglia sopra: si vedono solo sopra un colletto
        if (/^(capo|stampa)$/.test(k) && /^(cravatta|papillon|medaglia)$/.test(c.collo) && !COLLO_SUL_CAPO.test(c.capo)) c.collo = "nessuno";
      }
      if (k === "look" || k === "forma" || k === "corpo") return ill ? inquadra(O.svg(c), "14 0 172 264") : O.svg(c);
      if (ill && /^(capo|stampa)$/.test(k)) return inquadra(O.svg(c), INQ.sopra[corpo]);
      if (ill && k === "modScarpe") return inquadra(O.svg(c), INQ.piedi[corpo]);
      // (sul viso niente cappello davanti; col trucco anche niente occhiali, come prima)
      if (ill && (VOLTO.test(k) || TRUCCO_VOCI.test(k))) return inquadra(O.svg(c, { busto: true, senzaCappello: true, senzaOcchiali: TRUCCO_VOCI.test(k) && k !== "pittura" }), INQ[VOLTO.test(k) ? "viso" : "trucco"]);
      if (ill && (k === "cappello" || k === "orecchini")) return inquadra(O.svg(c, { busto: true }), INQ[k]);
      return opzMini(k, c);
    }
    function classeMini(k) {
      if (k === "look" || k === "forma" || k === "corpo" || (OMINO_INTERO[k] && !/^(capo|stampa|sotto)$/.test(k))) return " intero";
      if (/^(capo|stampa)$/.test(k)) return " sopra";
      if (k === "sotto") return " gambe";
      if (k === "modScarpe") return " piedi";
      return "";
    }
    // aggiorna solo i riquadri (niente ricostruzione della schermata: non salta lo scroll)
    function aggiornaPannello(cambiata) {   // cambiata = voce appena scelta: le sue anteprime non cambiano, non si ridisegnano
      if (nuovo) return aggiornaNuovo(cambiata);
      [].forEach.call(pannello.querySelectorAll(".om-opz"), function (b) {
        if (b._look) {
          b.classList.toggle("attiva", lookUguale(cfg, b._look));
          if (b._mini) b._mini.innerHTML = O.svg(conLook(cfg, b._look));
          return;
        }
        var k = b._k, v = b._v;
        if (b._libero) {   // tavolozza libera: attiva se il colore è uno scelto a mano
          var mio = typeof cfg[k] === "string";
          b.classList.toggle("attiva", mio); b.style.background = mio ? cfg[k] : "";
          return;
        }
        b.classList.toggle("attiva", valore(k) === v);
        if (b._mini && k !== cambiata) b._mini.innerHTML = opzMini(k, unisci(k, v));
      });
    }
    function scegli(k, v, zitto) {
      if (v != null && /^(maglia|pantaloni|scarpe|maglia2|pant2)$/.test(k) && !aMano[k]) {   // (correzioni 4-5) un colore toccato: da qui è «scelto a mano»
        aMano[k] = true;
        if (valore(k) === v) { aggiornaPannello(null); return; }   // (lo stesso colore di prima: cambiano solo le miniature)
      }
      if (valore(k) === v) return;
      if (zitto) { if (!trascina) { ricorda(); trascina = true; } cfg[k] = v; anteprima(false); return; }   // mentre trascini (colore libero, cursori): niente saltelli
      if (!trascina) ricorda(); trascina = false;
      if (k === "forma") {   // maschio/femmina: si adattano capelli, barba, trucco e vestiti
        cfg = O.adattaForma(cfg, v);
        if (visibile(tab) < 0) tab = 0;
        anteprima(true); disegnaSchede(); disegnaPannello(); return;
      }
      var rifai = /^(cappello|collo|mano|schiena|animale)$/.test(k) || (/^(ombretto|eyeliner|rossetto|blush|borsa)$/.test(k) && /^nessun/.test(cfg[k]) !== /^nessun/.test(v));   // i colori compaiono solo se servono
      if (k === "capo" && /^vestito/.test(cfg[k]) !== /^vestito/.test(v)) rifai = true;   // col vestito spariscono le voci "Sotto"
      var vis0 = voceVisibile("maglia2") + "" + voceVisibile("pant2");   // (tappa 3) il secondo colore può comparire o sparire
      var pz = partenza(k, v);   // (prima di cambiare la voce: conta il capo di prima)
      cfg[k] = v;
      if (pz) pz.forEach(function (x) { cfg[x.chiave] = x.valore; });
      if (vis0 !== voceVisibile("maglia2") + "" + voceVisibile("pant2")) rifai = true;
      // una mano sola: borsetta e oggetti in mano non vanno insieme
      if (k === "mano" && !/^(nessuno|pallone)$/.test(v) && cfg.borsa === "borsetta") cfg.borsa = "nessuna";
      if (k === "borsa" && v === "borsetta" && !/^(nessuno|pallone)$/.test(cfg.mano)) cfg.mano = "nessuno";
      var girato = false;
      if (grande) {   // la telecamera sulla parte appena cambiata; zaino, mantello, ali…: un attimo di spalle, poi di nuovo davanti
        vaiA(INQ_VOCE[k] || cam.tab);
        clearTimeout(cam.tGiro);
        if ((k === "schiena" || k === "colSchiena") && !/^nessun/.test(cfg.schiena)) {
          girato = !dietro; dietro = true;
          cam.tGiro = setTimeout(function () { if (dietro && document.body.contains(s)) gira(false); }, 2200);
        } else { girato = dietro; dietro = false; }
      }
      if (girato) { anteprima(false); giraAnim(); } else anteprima(nuovo ? k : true);
      if (rifai) disegnaPannello(); else aggiornaPannello(pz ? null : k);   // (col colore nuovo cambiano anche le anteprime della voce)
    }
    function applicaLook(L) {
      ricorda(); cfg = conLook(cfg, L);
      if (grande) { dietro = false; vaiA("intero"); }
      anteprima(nuovo ? "look" : true); if (!nuovo) saluta(); disegnaPannello();
    }
    // le sottocategorie della scheda aperta (es. Vestiti: Look pronti, Parti superiori, Parti inferiori, Scarpe): se ne vede una alla volta
    var subDi = {};   // scheda -> sottocategoria aperta (quando torni su una scheda ritrovi quella di prima)
    function voceVisibile(k) {
      if (k === "look" || k === "ritocchi") return true;
      if (k === "colAcc" && !ACC_COLORATI.test(cfg.cappello)) return false;
      if (k === "colCollo" && !COLLO_COLORATI.test(cfg.collo)) return false;
      if (COLORE_DI[k] && !COLORE_DI[k][1].test(cfg[COLORE_DI[k][0]])) return false;
      if (TRUCCO_COL[k] && /^nessun[oa]$/.test(cfg[TRUCCO_COL[k]])) return false;
      if (/^(sotto|pantaloni|fantP|pant2|stoffaP)$/.test(k) && /^vestito/.test(cfg.capo)) return false;   // il vestito copre anche sotto
      // (tappa 3) il secondo colore dei pantaloni serve alle fantasie che lo usano e alle righe di tuta e corti; il supereroe ha i suoi ori
      if (k === "pant2" && !COL2.test(valore("fantP")) && !/^(tuta|pantaloncini)$/.test(cfg.sotto) && cfg.pant2 == null) return false;
      if (k === "maglia2" && cfg.capo === "supereroe" && !COL2.test(valore("fant")) && cfg.maglia2 == null) return false;
      if (k === "barba" && cfg.forma === "donna") return false;   // lei niente barba
      return true;
    }
    function sottoVisibili() {
      var sz = SEZ[tab], lista = sz.sotto || [[sz.nome, sz.voci.map(function (vc) { return vc[0]; })]];
      return lista.map(function (x, j) { return { nome: x[0], chiavi: x[1], j: j }; })
        .filter(function (x) { return x.chiavi.some(voceVisibile); });
    }
    function sottoAttuale() {
      var l = sottoVisibili(), j = subDi[tab] || 0;
      return l.filter(function (x) { return x.j === j; })[0] || l[0];
    }
    // 🎲 solo questa sottocategoria (editor nuovo: tutta la scheda aperta): il resto non cambia
    function acasoScheda() {
      ricorda();
      var donna = cfg.forma === "donna", chiavi = nuovo ? chiaviScheda() : sottoAttuale().chiavi;
      chiavi.forEach(function (k) {
        if (k === "look") { var LL = nuovo ? LOOK.filter(function (L) { return L.gruppo !== "costumi"; }) : LOOK; cfg = conLook(cfg, LL[Math.floor(Math.random() * LL.length)]); return; }
        if (k === "ritocchi") { OMINO_RITOCCHI.forEach(function (r) { cfg[r[0]] = Math.floor(Math.random() * 5) - 2; }); return; }
        var lista = listaDi(k);
        if (k === "forma" || !lista || (k === "barba" && donna)) return;
        if (LISTA_DI[k] && OMINO_COLORI[k]) { cfg[k] = Math.random() < 0.5 ? null : Math.floor(Math.random() * lista.length); return; }   // (tappa 3) secondo colore: metà delle volte nessuno
        if (/^(fant|fantP|stoffa|stoffaP)$/.test(k)) { cfg[k] = Math.random() < 0.6 ? lista[0] : lista[1 + Math.floor(Math.random() * (lista.length - 1))]; return; }   // fantasie e stoffe: spesso niente
        if (OMINO_COLORI[k]) { cfg[k] = Math.floor(Math.random() * (k === "colCap" ? 7 : lista.length)); return; }
        var ok = lista.filter(function (v) {
          if (O.BLOCCATI[k] && O.BLOCCATI[k].indexOf(v) >= 0) return false;
          if (illustratoManca(k, v)) return false;   // avatar illustrati: le voci non ancora ridisegnate non escono a caso
          if (!donna && /^(sotto|capo|modScarpe)$/.test(k) && O.SOLO_DONNA.test(v)) return false;
          if (k === "capelli") return donna ? O.CAPELLI_UOMO.indexOf(v) < 0 : O.CAPELLI_UOMO.indexOf(v) >= 0;
          return true;
        });
        var niente = /^(nessun[oa]|no)$/.test(lista[0]) ? lista[0] : null;   // le cose "in più" non sempre
        cfg[k] = niente && Math.random() < (/^(segno|guance)$/.test(k) ? 0.6 : 0.3) ? niente : ok[Math.floor(Math.random() * ok.length)];
      });
      if (!/^(nessuno|pallone)$/.test(cfg.mano) && cfg.borsa === "borsetta") cfg.borsa = "nessuna";
      anteprima(true); disegnaPannello();
    }
    function disegnaSotto(lista, cur) {   // la fila delle sottocategorie, sopra alle scelte
      sottoschede.innerHTML = "";
      sottoschede.style.display = lista.length > 1 ? "" : "none";
      if (lista.length < 2) return;
      lista.forEach(function (x) {
        sottoschede.appendChild(el("button", { class: "om-sub" + (x.j === cur.j ? " attiva" : ""), text: x.nome,
          onclick: function () { if (subDi[tab] === x.j) return; subDi[tab] = x.j; disegnaPannello(); pannello.scrollTop = 0; } }));
      });
      var a = sottoschede.querySelector(".om-sub.attiva");   // quella aperta sempre in vista (la fila può scorrere di lato)
      if (a) sottoschede.scrollLeft = Math.max(0, a.offsetLeft - (sottoschede.clientWidth - a.offsetWidth) / 2);
    }
    function disegnaPannello() {
      if (nuovo) return disegnaNuovo();
      var st = pannello.scrollTop;   // ridisegnando non si torna in cima
      pannello.innerHTML = "";
      var sz = SEZ[tab], lista = sottoVisibili(), cur = sottoAttuale();
      disegnaSotto(lista, cur);
      var etichette = cur.chiavi.filter(voceVisibile).length > 1;   // con una voce sola il nome c'è già nella sottocategoria
      if (sz.nome !== "Corpo") pannello.appendChild(el("button", { class: "om-acaso", text: "🎲 " + (lista.length > 1 ? cur.nome : sz.nome) + " a caso", onclick: acasoScheda }));
      cur.chiavi.forEach(function (k) {
        if (!voceVisibile(k)) return;
        if (k === "look") {   // i look pronti: un tocco e cambiano vestiti e accessori insieme
          var rl = el("div", { class: "om-griglia" });
          LOOK.forEach(function (L) {
            var b = el("button", { class: "om-opz om-forma", onclick: function () { applicaLook(L); } });
            b._mini = el("div", { class: "om-mini intero" }); b.appendChild(b._mini);
            b.appendChild(el("div", { class: "om-nome", text: L.nome }));
            b._look = L; rl.appendChild(b);
          });
          pannello.appendChild(rl);
          return;
        }
        if (k === "ritocchi") { pannello.appendChild(cursori()); return; }
        var vc = sz.voci.filter(function (x) { return x[0] === k; })[0] || [k, k];
        var gruppi = k === "capelli" ? O.GRUPPI_CAPELLI : null;   // tagli divisi in Corti / Medi / Lunghi
        if (!gruppi && etichette) pannello.appendChild(el("div", { class: "etichetta", text: vc[1] }));
        var riga = el("div", { class: "om-griglia" + (OMINO_COLORI[k] ? " colori" : "") });
        var kl = LISTA_DI[k] || k, gColori = OMINO_COLORI[k] && O.GRUPPI_COLORI ? O.GRUPPI_COLORI[kl] : null, nomiCol = O.NOMI_COLORI ? O.NOMI_COLORI[kl] : null;   // (6 nov 2026) i colori a gruppi
        if (LISTA_DI[k] && OMINO_COLORI[k]) {   // (tappa 3) il secondo colore: per primo «Nessuno» (bordi come il capo, fantasia più chiara o più scura del capo)
          var bN = el("button", { class: "om-opz om-colore om-nessuno", title: "Nessuno", "aria-label": vc[1] + ": nessuno", onclick: function () { scegli(k, null); } });
          bN._k = k; bN._v = null; riga.appendChild(bN);
        }
        listaDi(k).forEach(function (val, i) {
          if (gruppi) gruppi.forEach(function (g) {
            if (g[1] !== i) return;
            if (riga.children.length) pannello.appendChild(riga);
            pannello.appendChild(el("div", { class: "etichetta", text: g[0] }));
            riga = el("div", { class: "om-griglia" });
          });
          if (gColori) gColori.forEach(function (g) { if (g[1] === i) riga.appendChild(el("div", { class: "om-gruppo", "aria-hidden": "true", text: g[0] })); });
          if (/^(sotto|capo|modScarpe)$/.test(k) && O.SOLO_DONNA.test(val) && cfg.forma !== "donna") return;   // gonne, vestiti, tacchi… solo per la donna
          if (illustratoManca(k, val) && cfg[k] !== val) return;   // avatar illustrati: le voci non ancora ridisegnate non si vedono (la tua resta)
          var v = OMINO_COLORI[k] ? i : val, b;
          if (OMINO_COLORI[k]) {
            b = el("button", { class: "om-opz om-colore", style: "background:" + val, "aria-label": vc[1] + " " + (nomiCol && nomiCol[i] ? nomiCol[i].toLowerCase() : i + 1), onclick: function () { scegli(k, v); } });
          } else {
            var bloccato = !!(O.BLOCCATI[k] && O.BLOCCATI[k].indexOf(val) >= 0);
            b = el("button", { class: "om-opz om-forma" + (bloccato ? " bloccato" : ""), onclick: function () { if (!bloccato) scegli(k, v); } });
            b._mini = el("div", { class: "om-mini" + (/^(sotto|modScarpe|fantP|stoffaP)$/.test(k) ? " gambe" : (/^(fant|stoffa)$/.test(k) ? " vita" : (OMINO_INTERO[k] ? " intero" : ""))) });
            b.appendChild(b._mini);
            b.appendChild(el("div", { class: "om-nome", text: bloccato ? "🔒 coi trofei" : nomeDi(k, val) }));
          }
          b._k = k; b._v = v; riga.appendChild(b);
        });
        if (OMINO_LIBERO[k]) riga.appendChild(libero(k, vc[1]));   // ultimo tondo: tavolozza arcobaleno per un colore qualsiasi
        pannello.appendChild(riga);
      });
      aggiornaPannello();
      pannello.scrollTop = st;
      centraScelte();
    }
    // ritocchi stile Mii: cursori da -2 a +2
    function cursori() {
      var box = el("div", { class: "om-ritocchi" });
      OMINO_RITOCCHI.forEach(function (r) {
        var kk = r[0], val = el("span", { class: "om-rit-val" });
        var cur2 = el("input", { type: "range", min: "-2", max: "2", step: "1", value: String(cfg[kk] || 0), class: "om-cursore", "aria-label": r[1] });
        function scrivi() { var n = +cur2.value; val.textContent = n > 0 ? "+" + n : String(n); }
        cur2.addEventListener("input", function () { scrivi(); scegli(kk, +cur2.value, true); });
        cur2.addEventListener("change", function () { trascina = false; popOmino(); aggiornaPannello(); });
        scrivi();
        box.appendChild(el("div", { class: "om-ritocco" }, [el("span", { class: "om-rit-nome", text: r[1] }), cur2, val]));
      });
      return box;
    }
    // l'ultimo tondo: la tavolozza arcobaleno per un colore qualsiasi
    function libero(k, nome) {
      var ultimo = typeof cfg[k] === "string" ? cfg[k] : (listaDi(k)[cfg[k]] || "#ffffff");
      var inp = el("input", { type: "color", value: ultimo, "aria-label": nome + ": colore libero" });
      inp.addEventListener("input", function () { scegli(k, inp.value, true); });
      inp.addEventListener("change", function () { if (!trascina) ricorda(); cfg[k] = null; trascina = true; scegli(k, inp.value); });
      var bl = el("label", { class: "om-opz om-colore om-libero", title: "Colore libero" }, [inp]);
      bl._k = k; bl._libero = true;
      return bl;
    }

    // ===================== l'editor nuovo: dock, gruppi in file, miniature quando si vedono =====================
    var NOME_VOCE = {};   // (per chi usa il lettore dello schermo: «Colore rosso», «Fantasia righe»)
    SEZ_OMINO.forEach(function (sz) { sz.voci.forEach(function (vc) { if (!NOME_VOCE[vc[0]]) NOME_VOCE[vc[0]] = vc[1]; }); });
    function gruppiScheda(sz) {   // i gruppi della scheda + «Altri» con le voci che nessun gruppo prende
      var g = sz.gruppi.slice(), prese = {};
      g.forEach(function (x) { if (Array.isArray(x[2])) { prese[x[1]] = prese[x[1]] || {}; x[2].forEach(function (v) { prese[x[1]][v] = 1; }); } });
      Object.keys(prese).forEach(function (k) {
        var altre = (O.OPZ[k] || []).filter(function (v) { return !prese[k][v]; });
        if (altre.length) g.push(["Altri", k, altre]);
      });
      return g;
    }
    function scelteDi(g) {   // le voci di un gruppo, già filtrate (solo per lei, non ancora ridisegnate)
      var k = g[1], sc = g[2];
      if (k === "look") return LOOK.filter(function (L) { return L.gruppo === sc; });
      if (k === "ritocchi") return [];
      var lista = O.OPZ[k] || [];
      if (typeof sc === "string" && k === "capelli" && O.GRUPPI_CAPELLI) {
        var gc = O.GRUPPI_CAPELLI.filter(function (x) { return x[0] === sc; })[0];
        lista = gc ? lista.slice(gc[1], gc[2]) : [];
      } else if (Array.isArray(sc)) lista = sc.filter(function (v) { return lista.indexOf(v) >= 0; });
      return lista.filter(function (v) {
        if (/^(sotto|capo|modScarpe)$/.test(k) && O.SOLO_DONNA.test(v) && cfg.forma !== "donna") return false;   // gonne, vestiti, tacchi… solo per lei
        if (illustratoManca(k, v) && cfg[k] !== v) return false;   // avatar illustrati: le voci non ancora ridisegnate non si vedono (la tua resta)
        return true;
      });
    }
    function gruppoVisibile(g) {
      if (!voceVisibile(g[1])) return false;
      if (TRUCCO_GR.test(g[1]) && cfg.forma !== "donna" && !trucco()) return false;
      return g[1] === "ritocchi" || scelteDi(g).length > 0;
    }
    function chiaviScheda() {   // le voci della scheda aperta (per «🎲 … a caso»)
      var sz = SEZ[tab], ks = [];
      (sz.dock || []).forEach(function (k) { if (voceVisibile(k)) ks.push(k); });
      gruppiScheda(sz).forEach(function (g) {
        if (!gruppoVisibile(g)) return;
        if (ks.indexOf(g[1]) < 0) ks.push(g[1]);
        if (g[3] && voceVisibile(g[3]) && ks.indexOf(g[3]) < 0) ks.push(g[3]);
      });
      return ks;
    }
    // una fila di tondi (colori): nel dock o sotto un gruppo. Prima «Nessuno» per il secondo colore, alla fine il colore libero
    function rigaColori(k, et) {
      var kl = LISTA_DI[k] || k, gColori = O.GRUPPI_COLORI ? O.GRUPPI_COLORI[kl] : null, nomiCol = O.NOMI_COLORI ? O.NOMI_COLORI[kl] : null, nome = NOME_VOCE[k] || et;
      var sc = el("div", { class: "ed3-scorre" });
      if (LISTA_DI[k]) {
        var bN = el("button", { class: "om-opz om-colore om-nessuno", type: "button", title: "Nessuno", "aria-label": nome + ": nessuno", onclick: function () { scegli(k, null); } });
        bN._k = k; bN._v = null; sc.appendChild(bN);
      }
      listaDi(k).forEach(function (val, i) {
        if (gColori && i > 0 && gColori.some(function (g) { return g[1] === i; })) sc.appendChild(el("i", { class: "ed3-sep", "aria-hidden": "true" }));
        var b = el("button", { class: "om-opz om-colore", type: "button", style: "background:" + val, "aria-label": nome + " " + (nomiCol && nomiCol[i] ? nomiCol[i].toLowerCase() : i + 1), onclick: function () { scegli(k, i); } });
        b._k = k; b._v = i; sc.appendChild(b);
      });
      if (OMINO_LIBERO[k]) sc.appendChild(libero(k, nome));
      return el("div", { class: "ed3-riga" }, [el("span", { class: "ed3-et", text: et }), sc]);
    }
    // una fila di bottoni col campione (fantasie e stoffe)
    function rigaChip(k, et) {
      var sc = el("div", { class: "ed3-scorre" });
      listaDi(k).forEach(function (v) {
        var cam = el("i", { "aria-hidden": "true" });
        var b = el("button", { class: "ed3-chip", type: "button", "aria-label": (NOME_VOCE[k] || et) + " " + nomeDi(k, v).toLowerCase(), onclick: function () { scegli(k, v); } }, [cam, el("span", { text: v === "nessuna" ? "Liscio" : nomeDi(k, v) })]);
        b._k = k; b._v = v; b._cam = cam; sc.appendChild(b);
      });
      return el("div", { class: "ed3-riga chip" }, [el("span", { class: "ed3-et", text: et }), sc]);
    }
    function colore(k) {   // il colore di adesso di una voce (posizione nella tavolozza o "#rrggbb")
      var x = cfg[k], L = listaDi(k);
      if (x == null) x = O.BASE[LISTA_DI[k] || k];
      return typeof x === "string" ? x : (L[x] || L[0]);
    }
    // le file: si ricorda dove erano scorse (per scheda e gruppo), così ridisegnando non saltano.
    // Le miniature si disegnano a poco a poco, prima quelle in vista (al massimo ~12 ms per volta): il tocco risponde subito
    var posFile = {}, tCoda = 0, segDi = {}, tChip = 0;
    if (nuovo) pannello.addEventListener("scroll", function () { programma(); if (grande && !tChip) tChip = setTimeout(chipAttiva, 80); }, { passive: true });   // (scorrendo arrivano le file di sotto)
    function chipAttiva() {   // (#39) la linguetta del gruppo che si vede in alto
      tChip = 0;
      var ch = pannello.querySelector(".ed4-chips"); if (!ch) return;
      var lim = ch.getBoundingClientRect().bottom + 30, on = null;
      [].forEach.call(ch.children, function (b) { if (!on || b._sec.getBoundingClientRect().top <= lim) on = b; });
      if (pannello.scrollTop + pannello.clientHeight >= pannello.scrollHeight - 4 && ch.lastChild) on = ch.lastChild;   // (in fondo: l'ultimo gruppo)
      [].forEach.call(ch.children, function (b) { b.classList.toggle("on", b === on); });
      if (on && (on.offsetLeft < ch.scrollLeft || on.offsetLeft + on.offsetWidth > ch.scrollLeft + ch.clientWidth)) ch.scrollLeft = Math.max(0, on.offsetLeft - 16);
    }
    function programma() { if (!tCoda) tCoda = setTimeout(lavora, 0); }
    function lavora() {
      tCoda = 0;
      if (!document.body.contains(s)) return;   // (l'editor è chiuso, o non ancora sullo schermo)
      var lista = daRifare(), t0 = Date.now();
      for (var i = 0; i < lista.length; i++) {
        rendiMini(lista[i]);
        if (Date.now() - t0 > 12 && i < lista.length - 1) { tCoda = setTimeout(lavora, 16); return; }
      }
    }
    function daRifare() {   // prima le miniature in vista, poi quelle vicine (una pagina più in là, o appena sotto)
      var subito = [], poi = [], pp = pannello.getBoundingClientRect();
      if (grande) {   // (#39) la griglia: si guarda in su e in giù (col foglio giù la parte di sotto è fuori dallo schermo)
        var fondo = Math.min(pp.bottom, (window.innerHeight || pp.bottom)), cima = pp.top;
        [].forEach.call(pannello.querySelectorAll(".ed3-fila"), function (f) {
          var r = f.getBoundingClientRect();
          if (r.bottom < cima - 300 || r.top > fondo + 300) return;
          [].forEach.call(f.children, function (b) {
            if (!b._sporco) return;
            var y = r.top + b.offsetTop, y2 = y + b.offsetHeight;
            if (y2 < cima - 300 || y > fondo + 300) return;
            (y2 > cima && y < fondo ? subito : poi).push(b);
          });
        });
        return subito.concat(poi);
      }
      [].forEach.call(pannello.querySelectorAll(".ed3-fila"), function (f) {
        var w = f.clientWidth || 360, sl = f.scrollLeft, r = f.getBoundingClientRect(), vista = r.bottom > pp.top && r.top < pp.bottom;
        if (r.bottom < pp.top - 220 || r.top > pp.bottom + 220) return;   // (troppo lontana: quando ci si arriva)
        [].forEach.call(f.children, function (b) {
          if (!b._sporco) return;
          var x = b.offsetLeft, x2 = x + b.offsetWidth;
          if (x2 < sl - w * 0.3 || x > sl + w * 1.9) return;
          (vista && x2 > sl && x < sl + w ? subito : poi).push(b);
        });
      });
      return subito.concat(poi);
    }
    function disegnaNuovo() {
      var st = pannello.scrollTop, sz = SEZ[tab], chiave = sz.nome, prima = pannello._scheda;
      if (prima) [].forEach.call(pannello.querySelectorAll(".ed3-fila"), function (f) { if (f._id) (posFile[prima] = posFile[prima] || {})[f._id] = f.scrollLeft; });
      pannello._scheda = chiave;
      // niente lampeggio: le miniature già disegnate passano nelle tessere nuove (le stesse scelte) e si rifanno piano piano dopo
      var vecchie = {};
      if (prima === chiave) [].forEach.call(pannello.querySelectorAll(".ed3-fila"), function (f) {
        [].forEach.call(f.children, function (b) { if (b._mini && b._mini.firstChild) vecchie[f._id + "|" + (b._look ? b._look.nome : b._v)] = b._mini.firstChild; });
      });
      pannello.innerHTML = ""; dock.innerHTML = "";
      // il dock: colori e chip della scheda (sempre sotto le schede)
      var righeDock = [];
      (sz.dock || []).forEach(function (k) {
        if (!voceVisibile(k)) return;
        var r = /^(fant|fantP|stoffa|stoffaP)$/.test(k) ? rigaChip(k, DOCK_NOMI[k]) : rigaColori(k, DOCK_NOMI[k] || NOME_VOCE[k]);
        righeDock.push({ k: k, n: DOCK_NOMI[k] || NOME_VOCE[k], r: r }); dock.appendChild(r);
      });
      if (grande && righeDock.length > 1) {   // (#39) una riga sola: le linguette Colore · 2° colore · Fantasia · Stoffa e sotto la fila scelta
        var sel = segDi[chiave]; if (!righeDock.some(function (x) { return x.k === sel; })) sel = righeDock[0].k;
        segDi[chiave] = sel;
        var seg = el("div", { class: "ed4-seg" });
        righeDock.forEach(function (x) {
          x.r.classList.add("sola"); x.r.hidden = x.k !== sel;
          seg.appendChild(el("button", { class: "ed4-segb" + (x.k === sel ? " on" : ""), type: "button", text: x.n, "aria-pressed": x.k === sel ? "true" : "false", onclick: function () {
            segDi[chiave] = x.k;
            [].forEach.call(seg.children, function (b, i) { var on = righeDock[i].k === x.k; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
            righeDock.forEach(function (y) { y.r.hidden = y.k !== x.k; });
            var sc = x.r.querySelector(".ed3-scorre"); if (sc) centraFila(sc);
          } }));
        });
        dock.insertBefore(seg, dock.firstChild);
      }
      dock.style.display = dock.children.length ? "" : "none";
      var ng = 0;
      gruppiScheda(sz).forEach(function (g) {
        if (!gruppoVisibile(g)) return; ng++;
        var k = g[1], sec = el("section", { class: "ed3-gr" }), tit = el("div", { class: "ed3-gr-tit" }, [el("h3", { text: g[0] })]);
        sec.appendChild(tit);
        if (k === "ritocchi") { sec.appendChild(cursori()); pannello.appendChild(sec); return; }
        var fila = el("div", { class: "ed3-fila" + (k === "look" ? " look" : "") + (grande ? " griglia" : "") });
        sec._tit = g[0];
        fila._id = g[0];
        scelteDi(g).forEach(function (val) {
          var b;
          if (k === "look") {
            b = el("button", { class: "om-opz om-forma ed3-t", type: "button", onclick: function () { applicaLook(val); } });
            b._look = val; b._mini = el("div", { class: "om-mini intero" });
            b.appendChild(b._mini); b.appendChild(el("div", { class: "om-nome", text: val.nome }));
          } else {
            var bloccato = !!(O.BLOCCATI[k] && O.BLOCCATI[k].indexOf(val) >= 0);
            b = el("button", { class: "om-opz om-forma ed3-t" + (bloccato ? " bloccato" : ""), type: "button", onclick: function () { if (!bloccato) scegli(k, val); } });
            b._k = k; b._v = val; b._mini = el("div", { class: "om-mini" + classeMini(k) });
            b.appendChild(b._mini); b.appendChild(el("div", { class: "om-nome", text: bloccato ? "🔒 coi trofei" : nomeDi(k, val) }));
          }
          var gia = vecchie[g[0] + "|" + (k === "look" ? val.nome : val)]; if (gia) b._mini.appendChild(gia);
          b._sporco = true; fila.appendChild(b);
        });
        // «scorri ›»: solo se la fila non ci sta (si guarda dopo il disegno); toccato, la fila va avanti di una pagina
        var bScorri = el("button", { class: "ed3-scorri", type: "button", text: "scorri ›", "aria-label": "Scorri " + g[0], onclick: function () {
          var dx = fila.clientWidth * 0.8;
          try { fila.scrollBy({ left: dx, behavior: movimentoFermo() ? "auto" : "smooth" }); } catch (e) { fila.scrollLeft += dx; }
        } });
        bScorri.hidden = true; if (!grande) { tit.appendChild(bScorri); fila._scorri = bScorri; }
        fila.addEventListener("scroll", programma, { passive: true });
        sec.appendChild(fila);
        if (g[3] && voceVisibile(g[3])) sec.appendChild(rigaColori(g[3], "Colore"));   // il colore della voce (es. del cappello), sotto le miniature
        pannello.appendChild(sec);
      });
      if (grande && ng > 1) {   // (#39) le linguette dei gruppi in cima: un tocco porta al gruppo; scorrendo si accende quella del gruppo in vista
        var chips = el("div", { class: "ed4-chips" });
        [].forEach.call(pannello.querySelectorAll(".ed3-gr"), function (sec) {
          var b = el("button", { class: "ed4-chip", type: "button", text: sec._tit, onclick: function () {
            var top = sec.getBoundingClientRect().top - pannello.getBoundingClientRect().top + pannello.scrollTop - chips.offsetHeight;
            try { pannello.scrollTo({ top: Math.max(0, top), behavior: movimentoFermo() ? "auto" : "smooth" }); } catch (e) { pannello.scrollTop = Math.max(0, top); }
          } });
          b._sec = sec; chips.appendChild(b);
        });
        pannello.insertBefore(chips, pannello.firstChild);
      }
      if (!ng) pannello.appendChild(el("p", { class: "ed3-nota", text: sz.nome === "Sotto" && /^vestito/.test(cfg.capo)
        ? "👗 Il vestito copre anche le gambe: per scegliere i pantaloni o la gonna cambia il capo in «Sopra»." : "Qui non c'è niente da scegliere." }));
      if (bAcaso) bAcaso.disabled = !chiaviScheda().length;   // (es. «Sotto» col vestito: niente da mettere a caso)
      aggiornaNuovo();
      pannello.scrollTop = st;
      var pos = posFile[chiave] || {};
      [].forEach.call(pannello.querySelectorAll(".ed3-fila"), function (f) {
        if (pos[f._id] != null) { f.scrollLeft = pos[f._id]; if (!inVista(f)) centraFila(f); } else centraFila(f);   // (dopo un look o «a caso» la scelta nuova in vista)
        if (f._scorri) f._scorri.hidden = f.scrollWidth <= f.clientWidth + 4;
      });
      [].forEach.call(s.querySelectorAll(".ed3-scorre"), centraFila);
      if (tCoda) { clearTimeout(tCoda); tCoda = 0; }
      if (grande) chipAttiva();
      if (document.body.contains(s)) lavora(); else programma();   // (sullo schermo: le prime in vista subito, senza un fotogramma vuoto)
    }
    function rendiMini(b) {
      b._sporco = false;
      b._mini.innerHTML = b._look ? miniNuova("look", conLook(cfg, b._look)) : miniNuova(b._k, unisci(b._k, b._v));
    }
    function aggiornaNuovo(cambiata) {
      var c1 = colore("maglia"), c2 = cfg.maglia2 != null ? colore("maglia2") : "#f4f5fb", p1 = colore("pantaloni"), p2 = cfg.pant2 != null ? colore("pant2") : "#f4f5fb";
      [].forEach.call(s.querySelectorAll(".ed3-dock .om-opz, .omino-pannello .om-opz, .ed3-chip"), function (b) {
        var k = b._k, v = b._v;
        if (b._look) { b.classList.toggle("attiva", lookUguale(cfg, b._look)); b._sporco = true; return; }
        if (b._libero) { var mio = typeof cfg[k] === "string"; b.classList.toggle("attiva", mio); b.style.background = mio ? cfg[k] : ""; return; }
        if (k == null) return;
        var on = valore(k) === v;
        b.classList.toggle("attiva", on);
        if (b._cam) { var sopra = /^(fant|stoffa)$/.test(k); b._cam.style.background = campione(k, v, sopra ? c1 : p1, sopra ? c2 : p2); b.setAttribute("aria-pressed", on ? "true" : "false"); }
        if (b._mini && k !== cambiata) b._sporco = true;
      });
      // un colore che cambia da solo (il secondo colore che arriva con una fantasia, il colore di partenza di un capo): la sua fila lo mostra
      [].forEach.call(s.querySelectorAll(".ed3-scorre"), function (r) {
        var a = r.querySelector(".attiva"), id = a ? String(a._libero ? "libero" : a._v) : "";
        if (r._att != null && r._att !== id && a && r.clientWidth && !inVista(r)) centraFila(r);
        r._att = id;
      });
      programma();
    }

    var bCaso = el("button", { class: "om-azione caso", text: "🎲", "aria-label": nuovo ? "Avatar tutto a caso" : "Personaggio a caso", onclick: function () {
      ricorda(); cfg = O.norm(O.casuale()); if (visibile(tab) < 0) tab = nuovo ? indice("Sopra") : 0;
      if (grande) { dietro = false; vaiA("intero"); }
      anteprima(true); disegnaSchede(); disegnaPannello();
    } });
    palco.appendChild(bCaso);
    palco.appendChild(bAnnulla); aggAnnulla();
    var salvato = false;
    var bSalva = el("button", { class: (nuovo ? "btn btn-primario " : "") + "om-azione salva" + (benv ? " fatto" : ""), text: nuovo ? (benv ? "Fatto" : "Salva") : (benv ? "✅ Fatto" : "✅ Salva"), onclick: function () {
      if (salvato) return; salvato = true;
      this.textContent = "👋 Fatto";   // si vede subito che il tocco è arrivato
      bozze[slot] = cfg; var tutti = bozze.map(function (b) { return O.norm(b); });
      salvaOminoMio(tutti[slot], tutti, slot); saluta(); popOmino();   // si salvano tutti; nei giochi va quello sul palco
      setTimeout(dopo, 1000);   // prima ti saluta, poi torna indietro
    } });
    if (nuovo) {   // in fondo: «🎲 Sopra a caso» e «Salva» (l'unico tasto lampone pieno)
      bAcaso = el("button", { class: "btn btn-fantasma ed3-acaso", type: "button", onclick: acasoScheda });
      s._piede.appendChild(bAcaso); s._piede.appendChild(bSalva);
    } else palco.appendChild(bSalva);
    anteprima(); disegnaSchede(); disegnaPannello();
    mostra(s);
    if (nuovo) requestAnimationFrame(function () {   // (le misure ci sono solo dopo mostra)
      if (grande) (function prova(n) {   // (si entra con l'avatar intero: la telecamera va vicino alla prima scelta)
        if (!document.body.contains(s)) return;
        if (misura()) { cam.reg = "intero"; camera(false); mostraAttiva(); } else if (n < 20) setTimeout(function () { prova(n + 1); }, 150);
      })(0);
      centraScelte(); disegnaScorri();
    });
    function disegnaScorri() { [].forEach.call(pannello.querySelectorAll(".ed3-fila"), function (f) { if (f._scorri) f._scorri.hidden = f.scrollWidth <= f.clientWidth + 4; }); programma(); }
    setTimeout(saluta, 350);   // appena entri: "ciao!"
  }


  // ---- al cuore: quello di questo pezzo che usano il cuore e gli altri pezzi ----
  cuore.schermataOmino = schermataOmino; cuore.secondoOmino = secondoOmino;
})();

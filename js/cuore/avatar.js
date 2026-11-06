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
    { nome: "Vestiti", icona: "👕", look: true, voci: [["capo", "Stile"], ["maglia", "Colore"], ["stampa", "Stampa"], ["sotto", "Sotto"], ["pantaloni", "Colore sotto"], ["modScarpe", "Scarpe"], ["scarpe", "Colore scarpe"]],
      sotto: [["Look pronti", ["look"]], ["Parti superiori", ["capo", "maglia", "stampa"]], ["Parti inferiori", ["sotto", "pantaloni"]], ["Scarpe", ["modScarpe", "scarpe"]]] },
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
    Vestiti: [["Look pronti", ["look"]], ["Sopra", ["maglia", "capo", "stampa"]], ["Sotto", ["pantaloni", "sotto"]], ["Scarpe", ["scarpe", "modScarpe"]]],
    Accessori: [["In testa", ["cappello", "colAcc"]], ["Occhiali", ["occhiali"]], ["Orecchini", ["orecchini"]], ["Al collo", ["collo", "colCollo"]], ["Borsa", ["borsa", "colBorsa"]]],
    Extra: [["In mano", ["mano", "colMano"]], ["Sulla schiena", ["schiena", "colSchiena"]], ["Animaletto", ["animale", "colAnimale"]], ["Pittura sul viso", ["pittura"]]]
  };
  var SEZ_CAMERINO = SEZ_OMINO.map(function (sz) { var c = {}, k; for (k in sz) c[k] = sz[k]; if (SOTTO_CAMERINO[sz.nome]) c.sotto = SOTTO_CAMERINO[sz.nome]; return c; });
  var OMINO_COLORI = { pelle: 1, colCap: 1, iride: 1, maglia: 1, pantaloni: 1, scarpe: 1, colAcc: 1, colCollo: 1, colOmbretto: 1, colEyeliner: 1, colRossetto: 1, colBlush: 1, colBorsa: 1, colMano: 1, colSchiena: 1, colAnimale: 1 };
  var TRUCCO_COL = { colOmbretto: "ombretto", colEyeliner: "eyeliner", colRossetto: "rossetto", colBlush: "blush", colBorsa: "borsa" };   // il colore si vede solo se quel trucco c'è
  var TRUCCO_VOCI = /^(ombretto|eyeliner|mascara|rossetto|blush|pittura|col(Ombretto|Eyeliner|Rossetto|Blush))$/;   // anteprime in primo piano sul viso
  var OMINO_INTERO = { forma: 1, corpo: 1, sotto: 1, capo: 1, stampa: 1, borsa: 1, mano: 1, schiena: 1, animale: 1 };   // anteprima a figura intera (le altre: solo la testa)
  var ACC_COLORATI = /cappellino|berretto|fascia|cuffie|cilindro|cowboy|pescatore|basco|festa|gatto|cerchietto|fiocco|mollette|paglia|coppola|borsalino|visiera|mago|antenne/;   // cappelli con un colore da scegliere
  var COLLO_COLORATI = /sciarpa|papillon|cravatta|bandana|foulard|medaglia|fischietto|cuffiecollo/;
  var COLORE_DI = { colMano: ["mano", /palloncino|fiore|microfono|tazza|libro/], colSchiena: ["schiena", /zaino|mantello|farfalla/], colAnimale: ["animale", /gatto|cane|coniglio/] };   // colore che compare solo con certe scelte
  var OMINO_LIBERO = { colCap: 1, iride: 1, maglia: 1, pantaloni: 1, scarpe: 1, colAcc: 1, colCollo: 1, colOmbretto: 1, colEyeliner: 1, colRossetto: 1, colBlush: 1, colBorsa: 1, colMano: 1, colSchiena: 1 };   // colori dove c'è anche la tavolozza libera
  var OMINO_RITOCCHI = [["occG", "Grandezza occhi"], ["occD", "Distanza occhi"], ["occA", "Altezza occhi"],
    ["soprA", "Altezza sopracciglia"], ["nasoG", "Grandezza naso"], ["boccaA", "Altezza bocca"]];
  // 🎨 avatar illustrati (strada A): una voce che non è ancora ridisegnata (nel disegno prende quella più simile)
  function illustratoManca(k, v) { return !!(window.SGOminoA && window.SGOmino && SGOmino.stile && SGOmino.stile() === "illustrato" && !SGOminoA.disegnato(k, v)); }
  // LOOK PRONTI: un tocco e cambiano vestiti e accessori insieme (viso, capelli e corpo restano i tuoi)
  var LOOK_BASE = { cappello: "nessuno", occhiali: "nessuno", collo: "nessuno", mano: "nessuno", schiena: "nessuna", animale: "nessuno", pittura: "nessuna", borsa: "nessuna", stampa: "nessuna" };
  var LOOK = [
    { nome: "Casual", tutti: { capo: "maglietta", maglia: 1, sotto: "jeans", pantaloni: 8, modScarpe: "sneakers", scarpe: 1 }, donna: { capo: "crop", maglia: 5, sotto: "shortsjeans", pantaloni: 9 } },
    { nome: "Elegante", tutti: { capo: "giacca", maglia: 7, sotto: "pantaloni", pantaloni: 1, modScarpe: "eleganti", scarpe: 0, collo: "papillon", colCollo: 0 },
      donna: { capo: "vestitolungo", maglia: 0, modScarpe: "tacchi", collo: "perle", orecchini: "perla" } },
    { nome: "Sportivo", tutti: { capo: "sportiva", maglia: 1, sotto: "tuta", pantaloni: 1, modScarpe: "sneakers", scarpe: 1, cappello: "visiera", colAcc: 8, collo: "fischietto", colCollo: 7 },
      donna: { maglia: 5, sotto: "leggings", collo: "nessuno" } },
    { nome: "Rock", tutti: { capo: "bomber", maglia: 7, sotto: "strappati", pantaloni: 1, modScarpe: "anfibi", scarpe: 0, occhiali: "sole", collo: "catena" } },
    { nome: "Estate", tutti: { capo: "camicia", maglia: 6, stampa: "fiori", sotto: "bermuda", pantaloni: 10, modScarpe: "infradito", scarpe: 3, cappello: "paglia", colAcc: 6, occhiali: "sole", mano: "gelato", collo: "lei" },
      donna: { capo: "top", stampa: "nessuna", sotto: "shortsjeans", pantaloni: 9, modScarpe: "zeppe", occhiali: "grandi" } },
    { nome: "Inverno", tutti: { capo: "cappotto", maglia: 2, sotto: "jeans", pantaloni: 1, modScarpe: "stivali", scarpe: 5, cappello: "berretto", colAcc: 0, collo: "sciarpa", colCollo: 0 } },
    { nome: "Tifoso", tutti: { capo: "calcio", maglia: 1, stampa: "numero", sotto: "pantaloncini", pantaloni: 8, modScarpe: "sneakers", scarpe: 1, pittura: "tricolore", mano: "bandiera" } },
    { nome: "Rapper", tutti: { capo: "felpa", maglia: 7, sotto: "cargo", pantaloni: 1, modScarpe: "sneakers", scarpe: 1, cappello: "cappellino", colAcc: 7, occhiali: "sole", collo: "catena", mano: "microfono", colMano: 7 } },
    { nome: "Cuoco", tutti: { capo: "grembiule", maglia: 8, sotto: "pantaloni", pantaloni: 1, modScarpe: "sneakers", scarpe: 1, cappello: "chef", mano: "pizza" } },
    { nome: "Avventura", tutti: { capo: "camicia", maglia: 3, sotto: "cargo", pantaloni: 10, modScarpe: "anfibi", scarpe: 5, cappello: "pescatore", colAcc: 3, schiena: "zaino", colSchiena: 2, animale: "cane", colAnimale: 4 } },
    { nome: "Musica", tutti: { capo: "maglietta", maglia: 7, stampa: "nota", sotto: "strappati", pantaloni: 8, modScarpe: "sneakers", scarpe: 0, cappello: "borsalino", colAcc: 7, schiena: "chitarra" } },
    { nome: "Pirata", tutti: { capo: "camicia", maglia: 8, stampa: "righe", sotto: "pantaloni", pantaloni: 2, modScarpe: "stivali", scarpe: 0, cappello: "pirata", occhiali: "benda", animale: "pappagallo", collo: "bandana", colCollo: 0 } },
    { nome: "Mago", tutti: { capo: "maglione", maglia: 4, sotto: "pantaloni", pantaloni: 6, modScarpe: "stivaletti", scarpe: 5, cappello: "mago", colAcc: 4, schiena: "mantello", colSchiena: 4, mano: "bacchetta", occhiali: "tondi" } },
    { nome: "Supereroe", tutti: { capo: "supereroe", maglia: 1, sotto: "leggings", pantaloni: 4, modScarpe: "stivali", scarpe: 2, schiena: "mantello", colSchiena: 0, occhiali: "mascherina" } },
    // (6 nov 2026, Tavola 3) lei alla festa col vestito verde smeraldo, gambe nude e ballerine dello stesso verde, la tiara (prima: la maglietta sui jeans)
    { nome: "Festa", tutti: { capo: "maglietta", maglia: 5, stampa: "stella", sotto: "jeans", pantaloni: 8, modScarpe: "sneakers", scarpe: 4, cappello: "festa", colAcc: 3, occhiali: "stelle", mano: "palloncino", colMano: 0, pittura: "cuori" },
      donna: { capo: "vestito", maglia: "#0f7a5a", stampa: "nessuna", sotto: "gonna", modScarpe: "ballerine", scarpe: "#0f7a5a", cappello: "tiara" } },
    { nome: "Natale", tutti: { capo: "maglione", maglia: 0, sotto: "jeans", pantaloni: 1, modScarpe: "stivali", scarpe: 5, cappello: "babbo", collo: "sciarpa", colCollo: 2, mano: "tazza", colMano: 0 } },
    { nome: "Vichingo", tutti: { capo: "maglione", maglia: 2, sotto: "pantaloni", pantaloni: 2, modScarpe: "stivali", scarpe: 5, cappello: "vichingo", schiena: "mantello", colSchiena: 7 } },
    { nome: "Angioletto", tutti: { capo: "maglione", maglia: 8, sotto: "pantaloni", pantaloni: 7, modScarpe: "sneakers", scarpe: 1, cappello: "aureola", schiena: "ali" }, donna: { capo: "vestito", sotto: "gonna", modScarpe: "ballerine" } },
    { nome: "Diavoletto", tutti: { capo: "felpa", maglia: 0, sotto: "jeans", pantaloni: 1, modScarpe: "anfibi", scarpe: 0, cappello: "corna", schiena: "pipistrello" } },
    { nome: "Fatina", tutti: { capo: "maglietta", maglia: 5, sotto: "jeans", pantaloni: 9, modScarpe: "sneakers", scarpe: 1, cappello: "tiara", schiena: "farfalla", colSchiena: 5, mano: "bacchetta" }, donna: { capo: "vestito", sotto: "gonna", modScarpe: "ballerine" } }
  ];
  function conLook(cfg, L) {
    var c = {}, k, pezzi = [LOOK_BASE, L.tutti, cfg.forma === "donna" ? L.donna : L.uomo];
    for (k in cfg) c[k] = cfg[k];
    pezzi.forEach(function (p) { if (p) for (k in p) c[k] = p[k]; });
    return c;
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
    var s = schermata({});
    s.classList.add("editor-avatar");   // tutto in uno schermo, senza titolo: sul palco indietro, A caso e Salva; sotto scorrono solo le scelte
    var camerino = EDITOR_CAMERINO || eProprietario(), SEZ = camerino ? SEZ_CAMERINO : SEZ_OMINO;
    if (camerino) s.classList.add("camerino");
    var iniziali = bozze.map(function (b) { return O.norm(b); });   // com'erano all'ingresso (se esci senza salvare)
    // il palco: faro dall'alto, pedana luminosa, omino che respira e sbatte le palpebre (toccalo: reagisce!)
    var figura = el("div", { class: "om-figura", title: "Toccami!" });
    var puntini = el("div", { class: "om-puntini" });
    var palco = el("div", { class: "omino-palco editor" }, [el("div", { class: "om-faro" }), el("div", { class: "om-pedana" }), figura,
      puntini,
      benv ? el("div", { class: "om-benv", text: "👋 Ecco il tuo avatar! Cambialo come vuoi" })
           : el("button", { class: "om-indietro", "aria-label": "Indietro", text: "‹", onclick: function () { esci(); } }),
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
      storia = []; aggAnnulla();
      if (visibile(tab) < 0) tab = 0;
      anteprima(false); disegnaSchede(); disegnaPannello(); popOmino();
      var sv = figura.firstChild;   // entra scivolando dal lato giusto
      if (sv && sv.animate) sv.animate([{ transform: "translateX(" + (dir * 90) + "px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 320, easing: "cubic-bezier(.2,.8,.3,1)" });
    }
    // scorrimento col dito sul palco
    var x0 = null, y0 = null;
    palco.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    palco.addEventListener("touchend", function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) scorri(dx < 0 ? 1 : -1);   // dito verso sinistra = il prossimo
    });
    var schede = el("div", { class: "omino-schede" });
    var pannello = el("div", { class: "omino-pannello" });
    var sottoschede = el("div", { class: "omino-sotto" });   // le sottocategorie della scheda aperta (es. Vestiti: Parti superiori, Parti inferiori, Scarpe)
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
    s._contenuto.appendChild(schede); s._contenuto.appendChild(sottoschede); s._contenuto.appendChild(pannello);
    function centraScelte() {   // nelle file da scorrere: la scelta di adesso in vista
      if (!camerino || s.classList.contains("aperto")) return;
      [].forEach.call(pannello.querySelectorAll(".om-griglia"), function (riga) {
        var a = riga.querySelector(".attiva"); if (a) riga.scrollLeft = Math.max(0, a.offsetLeft - riga.offsetLeft - (riga.clientWidth - a.offsetWidth) / 2);
      });
    }
    function unisci(k, v) {
      if (k === "forma") return O.adattaForma(cfg, v);   // maschio/femmina: cambiano anche capelli, barba, trucco
      var c = {}; for (var x in cfg) c[x] = cfg[x]; c[k] = v;
      var pz = partenza(k, v); if (pz) c[pz.chiave] = pz.valore;   // l'anteprima col colore con cui arriverebbe
      return c;
    }
    // (6 nov 2026) il colore di partenza del capo, del sotto o delle scarpe toccati (null = il colore di adesso resta: vedi SGOmino.coloreDiPartenza)
    function partenza(k, v) { return /^(capo|sotto|modScarpe)$/.test(k) && O.coloreDiPartenza ? O.coloreDiPartenza(cfg, k, v) : null; }
    function salto() {   // saltello senza ricalcolare la pagina (le anteprime sono tante)
      var sv = figura.firstChild;
      if (sv && sv.animate) sv.animate([{ transform: "none" }, { transform: "translateY(-12px) scale(.96,1.05)", offset: 0.3 },
        { transform: "scale(1.05,.95)", offset: 0.62 }, { transform: "none" }], { duration: 450, easing: "cubic-bezier(.3,1.5,.5,1)" });
    }
    function anteprima(conSalto) {
      clearTimeout(tReaz);
      figura.innerHTML = O.svg(cfg, { hd: true }); disegnaCambi();
      if (conSalto) { salto(); popOmino(); }
    }
    var tSaluto = null;
    function saluta() {   // alza il braccio e fa "ciao"
      clearTimeout(tSaluto); figura.classList.remove("saluta"); void figura.offsetWidth; figura.classList.add("saluta");
      tSaluto = setTimeout(function () { figura.classList.remove("saluta"); }, 1100);
    }
    // toccalo e reagisce: ride, fa l'occhiolino, si emoziona, saluta
    var REAZIONI = [{ occhi: "felici", bocca: "risata" }, { occhi: "occhiolino", bocca: "linguaccia" }, null, { occhi: "stelline", bocca: "o" }], nReaz = 0, tReaz = null;
    figura.addEventListener("click", function () {
      var r = REAZIONI[nReaz++ % REAZIONI.length];
      if (!r) { anteprima(false); saluta(); popOmino(); return; }
      var c2 = {}, k; for (k in cfg) c2[k] = cfg[k]; for (k in r) c2[k] = r[k];
      figura.innerHTML = O.svg(c2, { hd: true }); salto(); popOmino();
      clearTimeout(tReaz); tReaz = setTimeout(function () { figura.innerHTML = O.svg(cfg, { hd: true }); }, 1200);
    });
    // ↩️ annulla l'ultima scelta
    var storia = [], trascina = false;
    function ricorda() { storia.push(JSON.stringify(cfg)); if (storia.length > 40) storia.shift(); aggAnnulla(); }
    var bAnnulla = el("button", { class: "om-azione annulla", text: "↩️", "aria-label": "Annulla l'ultima scelta", onclick: function () {
      if (!storia.length) return;
      var prima = cfg.forma; cfg = JSON.parse(storia.pop()); aggAnnulla();
      if (visibile(tab) < 0) tab = 0;
      anteprima(true); if (prima !== cfg.forma) disegnaSchede(); disegnaPannello();
    } });
    function aggAnnulla() { bAnnulla.classList.toggle("spento", !storia.length); }
    // le schede: il trucco c'è solo per lei; la telecamera va sul viso per viso, trucco e capelli
    function visibile(i) {   // (se lui ha già del trucco salvato, la scheda resta per poterlo togliere)
      var sz = SEZ[i], trucco = ["ombretto", "eyeliner", "mascara", "rossetto", "blush"].some(function (k) { return cfg[k] && !/^nessun/.test(cfg[k]); });
      return sz && (!sz.solo || sz.solo === cfg.forma || (sz.nome === "Trucco" && trucco)) ? i : -1;
    }
    function disegnaSchede() {
      schede.innerHTML = ""; var n = 0;
      SEZ.forEach(function (sz, i) {
        if (visibile(i) < 0) return; n++;
        schede.appendChild(el("button", { class: "cat-tab" + (i === tab ? " attiva" : ""),
          onclick: function () { tab = i; disegnaSchede(); disegnaPannello(); pannello.scrollTop = 0; } }, [el("span", { class: "ci", text: sz.icona }), el("span", { text: sz.nome })]));
      });
      schede.style.gridTemplateColumns = "repeat(" + n + ",minmax(0,1fr))";
      schede.classList.toggle("sette", n > 6);
      var z = SEZ[tab].zoom;
      figura.classList.toggle("zoom-viso", z === "viso"); palco.classList.toggle("zoomato", !!z);
    }
    function nomeDi(k, val) {
      if (k === "forma") return val === "donna" ? "👧 Femmina" : "👦 Maschio";
      var n = (O.NOMI_K && O.NOMI_K[k] && O.NOMI_K[k][val]) || O.NOMI[val] || val;
      return n.charAt(0).toUpperCase() + n.slice(1);
    }
    function opzMini(k, c) {   // l'anteprima giusta per ogni voce: gambe, viso da vicino, figura intera o solo la testa
      return O.svg(c, /^(sotto|modScarpe)$/.test(k) ? { gambe: true } : (TRUCCO_VOCI.test(k) ? { viso: true, senzaOcchiali: k !== "pittura" } : { busto: !OMINO_INTERO[k], senzaCappello: /^(capelli|colCap)$/.test(k) }));
    }
    // aggiorna solo i riquadri (niente ricostruzione della schermata: non salta lo scroll)
    function aggiornaPannello(cambiata) {   // cambiata = voce appena scelta: le sue anteprime non cambiano, non si ridisegnano
      [].forEach.call(pannello.querySelectorAll(".om-opz"), function (b) {
        if (b._look) {
          var cl = conLook(cfg, b._look), uguale = true;
          for (var kk in cl) if (cl[kk] !== cfg[kk]) { uguale = false; break; }
          b.classList.toggle("attiva", uguale);
          if (b._mini) b._mini.innerHTML = O.svg(cl);
          return;
        }
        var k = b._k, v = b._v;
        if (b._libero) {   // tavolozza libera: attiva se il colore è uno scelto a mano
          var mio = typeof cfg[k] === "string";
          b.classList.toggle("attiva", mio); b.style.background = mio ? cfg[k] : "";
          return;
        }
        b.classList.toggle("attiva", cfg[k] === v);
        if (b._mini && k !== cambiata) b._mini.innerHTML = opzMini(k, unisci(k, v));
      });
    }
    function scegli(k, v, zitto) {
      if (cfg[k] === v) return;
      if (zitto) { if (!trascina) { ricorda(); trascina = true; } cfg[k] = v; anteprima(false); return; }   // mentre trascini (colore libero, cursori): niente saltelli
      if (!trascina) ricorda(); trascina = false;
      if (k === "forma") {   // maschio/femmina: si adattano capelli, barba, trucco e vestiti
        cfg = O.adattaForma(cfg, v);
        if (visibile(tab) < 0) tab = 0;
        anteprima(true); disegnaSchede(); disegnaPannello(); return;
      }
      var rifai = /^(cappello|collo|mano|schiena|animale)$/.test(k) || (/^(ombretto|eyeliner|rossetto|blush|borsa)$/.test(k) && /^nessun/.test(cfg[k]) !== /^nessun/.test(v));   // i colori compaiono solo se servono
      if (k === "capo" && /^vestito/.test(cfg[k]) !== /^vestito/.test(v)) rifai = true;   // col vestito spariscono le voci "Sotto"
      var pz = partenza(k, v);   // (prima di cambiare la voce: conta il capo di prima)
      cfg[k] = v;
      if (pz) cfg[pz.chiave] = pz.valore;
      // una mano sola: borsetta e oggetti in mano non vanno insieme
      if (k === "mano" && !/^(nessuno|pallone)$/.test(v) && cfg.borsa === "borsetta") cfg.borsa = "nessuna";
      if (k === "borsa" && v === "borsetta" && !/^(nessuno|pallone)$/.test(cfg.mano)) cfg.mano = "nessuno";
      anteprima(true); if (rifai) disegnaPannello(); else aggiornaPannello(pz ? null : k);   // (col colore nuovo cambiano anche le anteprime della voce)
    }
    function applicaLook(L) {
      ricorda(); cfg = conLook(cfg, L);
      anteprima(true); saluta(); disegnaPannello();
    }
    // le sottocategorie della scheda aperta (es. Vestiti: Look pronti, Parti superiori, Parti inferiori, Scarpe): se ne vede una alla volta
    var subDi = {};   // scheda -> sottocategoria aperta (quando torni su una scheda ritrovi quella di prima)
    function voceVisibile(k) {
      if (k === "look" || k === "ritocchi") return true;
      if (k === "colAcc" && !ACC_COLORATI.test(cfg.cappello)) return false;
      if (k === "colCollo" && !COLLO_COLORATI.test(cfg.collo)) return false;
      if (COLORE_DI[k] && !COLORE_DI[k][1].test(cfg[COLORE_DI[k][0]])) return false;
      if (TRUCCO_COL[k] && /^nessun[oa]$/.test(cfg[TRUCCO_COL[k]])) return false;
      if ((k === "sotto" || k === "pantaloni") && /^vestito/.test(cfg.capo)) return false;   // il vestito copre anche sotto
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
    // 🎲 solo questa sottocategoria: il resto non cambia
    function acasoScheda() {
      ricorda();
      var donna = cfg.forma === "donna", cur = sottoAttuale();
      cur.chiavi.forEach(function (k) {
        if (k === "look") { cfg = conLook(cfg, LOOK[Math.floor(Math.random() * LOOK.length)]); return; }
        if (k === "ritocchi") { OMINO_RITOCCHI.forEach(function (r) { cfg[r[0]] = Math.floor(Math.random() * 5) - 2; }); return; }
        var lista = O.OPZ[k];
        if (k === "forma" || !lista || (k === "barba" && donna)) return;
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
        if (k === "ritocchi") {   // ritocchi stile Mii: cursori da -2 a +2
          OMINO_RITOCCHI.forEach(function (r) {
            var kk = r[0], val = el("span", { class: "om-rit-val" });
            var cur2 = el("input", { type: "range", min: "-2", max: "2", step: "1", value: String(cfg[kk] || 0), class: "om-cursore", "aria-label": r[1] });
            function scrivi() { var n = +cur2.value; val.textContent = n > 0 ? "+" + n : String(n); }
            cur2.addEventListener("input", function () { scrivi(); scegli(kk, +cur2.value, true); });
            cur2.addEventListener("change", function () { trascina = false; popOmino(); aggiornaPannello(); });
            scrivi();
            pannello.appendChild(el("div", { class: "om-ritocco" }, [el("span", { class: "om-rit-nome", text: r[1] }), cur2, val]));
          });
          return;
        }
        var vc = sz.voci.filter(function (x) { return x[0] === k; })[0] || [k, k];
        var gruppi = k === "capelli" ? O.GRUPPI_CAPELLI : null;   // tagli divisi in Corti / Medi / Lunghi
        if (!gruppi && etichette) pannello.appendChild(el("div", { class: "etichetta", text: vc[1] }));
        var riga = el("div", { class: "om-griglia" + (OMINO_COLORI[k] ? " colori" : "") });
        var gColori = OMINO_COLORI[k] && O.GRUPPI_COLORI ? O.GRUPPI_COLORI[k] : null, nomiCol = O.NOMI_COLORI ? O.NOMI_COLORI[k] : null;   // (6 nov 2026) i colori a gruppi
        O.OPZ[k].forEach(function (val, i) {
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
            b._mini = el("div", { class: "om-mini" + (/^(sotto|modScarpe)$/.test(k) ? " gambe" : (OMINO_INTERO[k] ? " intero" : "")) });
            b.appendChild(b._mini);
            b.appendChild(el("div", { class: "om-nome", text: bloccato ? "🔒 coi trofei" : nomeDi(k, val) }));
          }
          b._k = k; b._v = v; riga.appendChild(b);
        });
        if (OMINO_LIBERO[k]) {   // ultimo tondo: tavolozza arcobaleno per un colore qualsiasi
          var ultimo = typeof cfg[k] === "string" ? cfg[k] : (O.OPZ[k][cfg[k]] || "#ffffff");
          var inp = el("input", { type: "color", value: ultimo, "aria-label": vc[1] + ": colore libero" });
          inp.addEventListener("input", function () { scegli(k, inp.value, true); });
          inp.addEventListener("change", function () { if (!trascina) ricorda(); cfg[k] = null; trascina = true; scegli(k, inp.value); });
          var bl = el("label", { class: "om-opz om-colore om-libero", title: "Colore libero" }, [inp]);
          bl._k = k; bl._libero = true; riga.appendChild(bl);
        }
        pannello.appendChild(riga);
      });
      aggiornaPannello();
      pannello.scrollTop = st;
      centraScelte();
    }
    palco.appendChild(el("button", { class: "om-azione caso", text: "🎲", "aria-label": "Personaggio a caso", onclick: function () {
      ricorda(); cfg = O.norm(O.casuale()); if (visibile(tab) < 0) tab = 0;
      anteprima(true); disegnaSchede(); disegnaPannello();
    } }));
    palco.appendChild(bAnnulla); aggAnnulla();
    var salvato = false;
    palco.appendChild(el("button", { class: "om-azione salva" + (benv ? " fatto" : ""), text: benv ? "✅ Fatto" : "✅ Salva", onclick: function () {
      if (salvato) return; salvato = true;
      this.textContent = "👋 Fatto";   // si vede subito che il tocco è arrivato
      bozze[slot] = cfg; var tutti = bozze.map(function (b) { return O.norm(b); });
      salvaOminoMio(tutti[slot], tutti, slot); saluta(); popOmino();   // si salvano tutti; nei giochi va quello sul palco
      setTimeout(dopo, 1000);   // prima ti saluta, poi torna indietro
    } }));
    anteprima(); disegnaSchede(); disegnaPannello();
    mostra(s);
    setTimeout(saluta, 350);   // appena entri: "ciao!"
  }


  // ---- al cuore: quello di questo pezzo che usano il cuore e gli altri pezzi ----
  cuore.schermataOmino = schermataOmino; cuore.secondoOmino = secondoOmino;
})();

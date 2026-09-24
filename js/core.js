/* =========================================================
   MOTORE COMUNE — "SG"
   Tutto ciò che ogni gioco condivide sta qui, scritto una
   volta sola: le schermate comuni (home, giocatori, regole,
   tabellone finale), la lista dei giocatori, il passaggio
   del telefono e il giro di partita (comincia / fine / rigioca).

   Un gioco si "innesta" chiamando SG.registra({...}).
   Vedi docs/COME-SI-AGGIUNGE-UN-GIOCO.md
   ========================================================= */
(function () {
  "use strict";

  var giochi = [];            // giochi registrati

  // Categorie della home. "tutti" mostra tutto; le altre filtrano per tipo di gioco.
  // Ogni gioco ha la sua categoria in CAT_GIOCO (per id): nessuno resta senza.
  var CATEGORIE = [
    { id: "tutti",  nome: "Tutti",         icona: "🎲" },
    { id: "carte",  nome: "Carte",         icona: "🃏" },
    { id: "sfida",  nome: "1 contro 1",    icona: "⚔️" },
    { id: "festa",  nome: "Festa",         icona: "🎉" },
    { id: "mini",   nome: "Minigiochi",    icona: "🎮" },
    { id: "parole", nome: "Quiz & parole", icona: "🧠" }
  ];
  var CAT_GIOCO = {
    scopa: "carte", scopa2v2: "carte", scopone: "carte", blackjack: "carte",
    tris: "sfida", drop4: "sfida", hockey: "sfida", navale: "sfida",
    asta: "festa", impostore: "festa", sipero: "festa",
    scalinata: "mini", horto: "mini", pendolo: "mini",
    timeline: "parole", nomicose: "parole", patata: "parole"
  };
  var catAttiva = "tutti";
  function catDi(g) { return CAT_GIOCO[g.id] || null; }
  // Giochi che hanno la modalità "ognuno dal suo telefono" (usabili nella Sala online).
  var GIOCHI_ONLINE = { asta: 1, blackjack: 1, drop4: 1, horto: 1, navale: 1, patata: 1, pendolo: 1, scalinata: 1, scopa: 1, scopa2v2: 1, sipero: 1, timeline: 1, tris: 1 };
  function giocoOnline(g) { return !!(g && GIOCHI_ONLINE[g.id]); }
  var app;                    // contenitore radice (#app)
  var linkParams = {};        // impostazioni arrivate da un link condiviso

  // Legge le impostazioni scritte nel link (dopo il #), es.:
  //   #gioco=timeline&cat=storia,calcio&carte=5
  function leggiParametriLink() {
    var out = {};
    var h = (location.hash || "").replace(/^#/, "");
    if (!h) return out;
    h.split("&").forEach(function (p) {
      var i = p.indexOf("=");
      if (i < 0) return;
      var k = decodeURIComponent(p.slice(0, i));
      var v = decodeURIComponent(p.slice(i + 1));
      out[k] = v;
    });
    if (out.cat) out.cat = out.cat.split(",").filter(Boolean);
    if (out.carte) out.carte = parseInt(out.carte, 10);
    return out;
  }

  // ------- piccoli aiuti per costruire l'interfaccia -------
  function el(tag, attrs, figli) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] == null) continue;           // attributo non impostato: si salta
      if (k === "class") e.className = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k === "text") e.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (figli) figli.forEach(function (f) {
      if (f == null) return;
      e.appendChild(typeof f === "string" ? document.createTextNode(f) : f);
    });
    return e;
  }
  function svuota(n){ while (n.firstChild) n.removeChild(n.firstChild); }
  function mischia(a){ // Fisher-Yates
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Costruisce lo scheletro di una schermata: testa + contenuto + piede
  function schermata(opts) {
    opts = opts || {};
    var testa = el("div", { class: "testa" });
    if (opts.indietro) {
      testa.appendChild(el("button", {
        class: "btn btn-fantasma btn-piccolo", text: "‹", "aria-label": "Indietro",
        onclick: opts.indietro
      }));
    }
    var titoli = el("div");
    if (opts.icona) testa.insertBefore(el("span", { text: opts.icona, style: "font-size:1.8rem" }), null);
    if (opts.titolo) titoli.appendChild(el("h1", { text: opts.titolo }));
    if (opts.sotto) titoli.appendChild(el("p", { class: "sotto", text: opts.sotto }));
    testa.appendChild(titoli);

    var contenuto = el("div", { class: "contenuto" });
    var piede = el("div", { class: "piede" });
    var s = el("div", { class: "schermata" }, [testa, contenuto, piede]);
    s._contenuto = contenuto; s._piede = piede;
    return s;
  }

  function mostra(schermo) {
    svuota(app);
    app.appendChild(schermo);
    window.scrollTo(0, 0);
  }

  // =========================================================
  //  SCHERMATE COMUNI
  // =========================================================

  // una tessera-gioco, usata sia in home sia in "cambia gioco"
  function tesseraGioco(g, onclick) {
    // L'icona fa da "banner": mostra la foto carte/giochi/<id>.jpg se esiste,
    // altrimenti resta l'emoji del gioco (l'immagine si toglie da sola se manca).
    var icona = el("span", { class: "icona" }, [ el("span", { class: "emoji", text: g.icona || "🎲" }) ]);
    var img = el("img", { class: "illustr", src: "carte/giochi/" + g.id + ".jpg", alt: "", loading: "lazy" });
    img.onerror = function () { if (img.parentNode) img.parentNode.removeChild(img); };
    icona.appendChild(img);
    return el("button", { class: "tessera", onclick: onclick }, [
      icona,
      el("div", { class: "info" }, [
        el("h2", { text: g.nome }),
        el("p", { text: g.descrizione || "" }),
        el("div", { class: "meta", text: rangeGiocatori(g) })
      ])
    ]);
  }

  // Entra in una stanza avendo solo il codice: scopre da solo QUALE gioco
  // si sta giocando, così apre quello giusto (non sempre la Linea del tempo).
  function entraConCodice() {
    var c = window.prompt("Scrivi il codice della stanza:");
    if (!c) return;
    c = c.trim().toUpperCase();
    if (!c) return;
    if (!(window.SGNet && SGNet.disponibile())) {
      window.alert("Il collegamento non è disponibile qui. Apre solo dal sito pubblicato online.");
      return;
    }
    var s = schermata({ icona: "🔗", titolo: "Entro nella stanza…", sotto: "Codice " + c });
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Cerco la partita in corso… un attimo." }));
    mostra(s);
    SGNet.scopriGioco(c, function (gid) {
      if (gid === "__sala") return salaOspite(c);   // è una Sala, non un singolo gioco
      var g = gid && giochi.filter(function (x) { return x.id === gid; })[0];
      if (!g) {
        svuota(s._contenuto); svuota(s._piede);
        s._contenuto.appendChild(el("p", { class: "link-avviso",
          text: "Non trovo una partita con questo codice. Controlla di averlo scritto giusto, oppure apri il link che ti ha mandato chi organizza." }));
        s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↩︎ Torna alla home", onclick: schermataHome }));
        mostra(s);
        return;
      }
      location.hash = "gioco=" + g.id + "&stanza=" + encodeURIComponent(c);
      location.reload();
    });
  }

  function schermataHome() {
    var s = schermata({});
    s.className += " home";
    var io = profiloAttivo();
    // riga profilo: il nome utente + il tasto "Novità" affianco
    var profiloChip = el("button", { class: "profilo-chip", onclick: function () { schermataAccesso(schermataHome); } },
      io ? [io.omino && window.SGOmino ? el("span", { class: "chip-omino", html: SGOmino.svg(io.omino, { busto: true }) }) : el("span", { text: io.emoji }),
            el("span", { text: io.nome }), el("span", { class: "modifica", text: "cambia" })]
         : [el("span", { text: "👤" }), el("span", { text: "Crea il tuo profilo" })]);
    var rigaProfilo = el("div", { class: "home-profilo" }, [profiloChip]);
    if ((window.SG_NOVITA || []).length) {
      var bNov = el("button", { class: "home-novita", onclick: schermataNovita });
      bNov.appendChild(el("span", { text: "🆕 Novità" }));
      if (!novitaTutteViste()) bNov.appendChild(el("span", { class: "pallino" }));
      rigaProfilo.appendChild(bNov);
    }
    rigaProfilo.appendChild(el("button", { class: "home-novita", onclick: schermataSfide }, [ el("span", { text: "🏆 Trofei" }) ]));
    s._contenuto.appendChild(el("div", { class: "home-hero" }, [
      el("div", { class: "home-logo", html: '<svg viewBox="0 0 200 118" width="156" height="92" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="sgBolt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6bf"/><stop offset=".42" stop-color="#ffd23b"/><stop offset=".72" stop-color="#f6a70c"/><stop offset="1" stop-color="#c06a08"/></linearGradient><linearGradient id="sgBoltHi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf0" stop-opacity=".95"/><stop offset=".5" stop-color="#ffffff" stop-opacity="0"/></linearGradient><filter id="sgGlow" x="-70%" y="-70%" width="240%" height="240%"><feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="#ff9d2e" flood-opacity=".75"/><feDropShadow dx="0" dy="0" stdDeviation="16" flood-color="#ff7b16" flood-opacity=".4"/></filter><path id="sgB" d="M13 0 L2 20 L10 20 L7 36 L22 12 L13 12 L17 0 Z"/></defs><g filter="url(#sgGlow)" stroke="#8a5209" stroke-width="1.3" stroke-linejoin="round"><use href="#sgB" transform="translate(18,34) scale(1.5)" fill="url(#sgBolt)"/><use href="#sgB" transform="translate(78,14) scale(1.95)" fill="url(#sgBolt)"/><use href="#sgB" transform="translate(150,34) scale(1.5)" fill="url(#sgBolt)"/></g><g stroke="none"><use href="#sgB" transform="translate(18,34) scale(1.5)" fill="url(#sgBoltHi)"/><use href="#sgB" transform="translate(78,14) scale(1.95)" fill="url(#sgBoltHi)"/><use href="#sgB" transform="translate(150,34) scale(1.5)" fill="url(#sgBoltHi)"/></g></svg>' }),
      el("h1", { class: "home-titolo", text: "SPeeD GAME" }),
      rigaProfilo
    ]));
    // Barra delle categorie (sotto il profilo): "Tutti" + i gruppi. Cliccando si filtra
    // solo la griglia (senza rifare la schermata: niente lampeggio, non si torna in cima).
    var barra = el("div", { class: "cat-barra" });
    var griglia = el("div", { class: "griglia-giochi" });
    var presto = el("div", { class: "tessera presto" }, [
      el("span", { class: "icona", text: "➕" }),
      el("div", { class: "info" }, [
        el("h2", { text: "Altri giochi in arrivo" }),
        el("p", { text: "Uno alla volta, fatto bene." })
      ])
    ]);
    function riempiGriglia() {
      griglia.innerHTML = "";
      giochi.forEach(function (g) {
        if (catAttiva === "tutti" || catDi(g) === catAttiva) {
          griglia.appendChild(tesseraGioco(g, function () { apriGioco(g); }));
        }
      });
      if (catAttiva === "tutti") griglia.appendChild(presto); // il segnaposto solo in "Tutti"
    }
    CATEGORIE.forEach(function (c) {
      // salto una categoria (tranne "Tutti") se per ora non ha giochi
      if (c.id !== "tutti" && !giochi.some(function (g) { return catDi(g) === c.id; })) return;
      var chip = el("button", { class: "cat-tab" + (c.id === catAttiva ? " attiva" : ""), onclick: function () {
        catAttiva = c.id;
        [].forEach.call(barra.children, function (x) { x.className = "cat-tab"; });
        chip.className = "cat-tab attiva";
        riempiGriglia();
      } }, [ el("span", { class: "ci", text: c.icona }), el("span", { text: c.nome }) ]);
      barra.appendChild(chip);
    });
    riempiGriglia();

    s._contenuto.appendChild(barra);
    s._contenuto.appendChild(griglia);

    // Riga di tasti piccoli: Proposte · Bug (Novità è accanto al nome utente, in alto)
    var azioni = el("div", { class: "home-azioni" });
    azioni.appendChild(el("button", { class: "azione", text: "💡 Proposte", onclick: schermataProposte }));
    azioni.appendChild(el("button", { class: "azione", text: "🐞 Bug", onclick: schermataBug }));
    s._piede.appendChild(azioni);

    // Torneo: più giochi di fila con gli stessi giocatori, punti che si sommano
    s._piede.appendChild(el("button", {
      class: "btn btn-primario", html: torneo ? "🏆 Riprendi il torneo" : "🏆 Torneo (più giochi di fila)",
      onclick: apriTorneo
    }));

    // Sala online: crea un gruppo che passa da un gioco all'altro (ognuno dal suo telefono)
    s._piede.appendChild(el("button", {
      class: "btn btn-fantasma", html: "👥 Sala online (porta il gruppo tra i giochi)",
      onclick: creaSala
    }));

    // Tasto "Entra in una stanza" (per chi ha ricevuto un codice a voce)
    s._piede.appendChild(el("button", {
      class: "btn btn-fantasma", html: "🔗 Entra in una stanza (con un codice)",
      onclick: entraConCodice
    }));

    mostra(s);
  }

  // ---- Novità (il diario di cosa viene aggiunto) ----
  var CHIAVE_NOVITA = "sg_novita_vista";
  function ultimaVersioneNovita() {
    var n = window.SG_NOVITA || [];
    return n.length ? n[0].v : 0;
  }
  function novitaTutteViste() {
    try { return Number(localStorage.getItem(CHIAVE_NOVITA)) >= ultimaVersioneNovita(); }
    catch (e) { return false; }
  }
  function segnaNovitaViste() {
    try { localStorage.setItem(CHIAVE_NOVITA, String(ultimaVersioneNovita())); } catch (e) {}
  }
  function schermataNovita() {
    var s = schermata({ icona: "🆕", titolo: "Novità", sotto: "Cosa è stato aggiunto", indietro: schermataHome });
    (window.SG_NOVITA || []).forEach(function (n) {
      var punti = el("ul", { class: "novita-punti" });
      (n.descrizione || []).forEach(function (r) { punti.appendChild(el("li", { text: r })); });
      s._contenuto.appendChild(el("div", { class: "novita-card" }, [
        el("div", { class: "novita-data", text: n.data }),
        el("h2", { class: "novita-titolo", text: n.titolo }),
        punti
      ]));
    });
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Ho capito", onclick: schermataHome }));
    segnaNovitaViste(); // aperto = visto
    mostra(s);
  }

  // ---- Sfide e Trofei (stile PlayStation: bronzo/argento/oro/diamante + platino) ----
  // Ogni trofeo confronta una statistica del profilo con una soglia (meta) e ha un
  // livello. Il PLATINO di un gioco si sblocca da solo quando prendi tutti gli altri.
  // Aggiungere/scrivere trofei = aggiungere righe qui (niente altro codice da toccare).
  var LIVELLI = {
    bronzo:   { nome: "Bronzo",   cls: "tl-bronzo" },
    argento:  { nome: "Argento",  cls: "tl-argento" },
    oro:      { nome: "Oro",      cls: "tl-oro" },
    diamante: { nome: "Diamante", cls: "tl-diamante" }
  };
  var ORDINE_LIV = ["bronzo", "argento", "oro", "diamante"];
  var TROFEI = [
    // ---- Black Jack ----
    { gioco: "blackjack", livello: "bronzo",   icona: "🪑", nome: "Il Primo Passo",           desc: "Siediti al tavolo e gioca la tua primissima mano",           stat: "maniGiocate",       meta: 1 },
    { gioco: "blackjack", livello: "bronzo",   icona: "😊", nome: "Il Primo Sorriso",         desc: "Vinci la tua prima mano contro il banco",                    stat: "maniVinte",         meta: 1 },
    { gioco: "blackjack", livello: "bronzo",   icona: "✨", nome: "Magia del Ventuno",        desc: "Fai il tuo primo Black Jack",                                stat: "blackjackFatti",    meta: 1 },
    { gioco: "blackjack", livello: "bronzo",   icona: "🎁", nome: "Piccolo Dono",             desc: "Ritira il tuo primo bonus gratuito",                         stat: "bonusRitirati",     meta: 1 },
    { gioco: "blackjack", livello: "bronzo",   icona: "🐷", nome: "Risparmiatore Felice",     desc: "Vinci 500 fiches in totale",                                 stat: "fichesVinteTot",    meta: 500 },
    { gioco: "blackjack", livello: "bronzo",   icona: "🙃", nome: "Sbagliando si Impara",     desc: "Sballa superando il 21 per 5 volte",                         stat: "maniSballate",      meta: 5 },
    { gioco: "blackjack", livello: "bronzo",   icona: "🤝", nome: "Stretta di Mano",          desc: "Pareggia con il banco 3 volte",                              stat: "maniPari",          meta: 3 },
    { gioco: "blackjack", livello: "bronzo",   icona: "🍀", nome: "Fortuna Cieca",            desc: "Vinci 5 mani perché il banco sballa",                        stat: "vinteSballoBanco",  meta: 5 },
    { gioco: "blackjack", livello: "bronzo",   icona: "🌧️", nome: "Domani Andrà Meglio",      desc: "Perdi 3 mani di fila. Non mollare!",                         stat: "serieSconfitteMax", meta: 3 },
    { gioco: "blackjack", livello: "argento",  icona: "🌊", nome: "Onda Positiva",            desc: "Vinci 20 mani contro il banco",                              stat: "maniVinte",         meta: 20 },
    { gioco: "blackjack", livello: "argento",  icona: "🎼", nome: "Armonia Perfetta",         desc: "Fai Black Jack 10 volte",                                    stat: "blackjackFatti",    meta: 10 },
    { gioco: "blackjack", livello: "argento",  icona: "📅", nome: "Appuntamento Felice",      desc: "Ritira il bonus gratuito 10 volte",                          stat: "bonusRitirati",     meta: 10 },
    { gioco: "blackjack", livello: "argento",  icona: "🌾", nome: "Abbondanza",               desc: "Vinci 5.000 fiches in totale",                               stat: "fichesVinteTot",    meta: 5000 },
    { gioco: "blackjack", livello: "argento",  icona: "🌈", nome: "Ottimismo Incorreggibile", desc: "Sballa superando il 21 per 25 volte",                        stat: "maniSballate",      meta: 25 },
    { gioco: "blackjack", livello: "argento",  icona: "🫱", nome: "Pura Sinergia",            desc: "Pareggia con il banco 15 volte",                             stat: "maniPari",          meta: 15 },
    { gioco: "blackjack", livello: "argento",  icona: "🛡️", nome: "Aura Protettiva",          desc: "Vinci 25 mani perché il banco sballa",                       stat: "vinteSballoBanco",  meta: 25 },
    { gioco: "blackjack", livello: "argento",  icona: "🧊", nome: "Sangue Freddo",            desc: "Fai 21 esatto con 3 o più carte, 5 volte",                   stat: "ventunoTre",        meta: 5 },
    { gioco: "blackjack", livello: "argento",  icona: "🦁", nome: "Coraggio da Leoni",        desc: "Vinci una mano puntando almeno 500 fiches",                  stat: "puntataVintaMax",   meta: 500 },
    { gioco: "blackjack", livello: "oro",      icona: "☀️", nome: "Raggio di Sole",           desc: "Vinci 100 mani contro il banco",                             stat: "maniVinte",         meta: 100 },
    { gioco: "blackjack", livello: "oro",      icona: "🤩", nome: "Estasi del Gioco",         desc: "Fai Black Jack 50 volte",                                    stat: "blackjackFatti",    meta: 50 },
    { gioco: "blackjack", livello: "oro",      icona: "💝", nome: "Gratitudine Infinita",     desc: "Ritira il bonus gratuito 50 volte",                          stat: "bonusRitirati",     meta: 50 },
    { gioco: "blackjack", livello: "oro",      icona: "💎", nome: "Tesoro Luminoso",          desc: "Vinci 25.000 fiches in totale",                              stat: "fichesVinteTot",    meta: 25000 },
    { gioco: "blackjack", livello: "oro",      icona: "🏛️", nome: "Architetto del Ventuno",   desc: "Fai 21 esatto con 3 o più carte, 20 volte",                  stat: "ventunoTre",        meta: 20 },
    { gioco: "blackjack", livello: "oro",      icona: "🔥", nome: "All-In Emotivo",           desc: "Vinci una mano puntando almeno 2.500 fiches",                stat: "puntataVintaMax",   meta: 2500 },
    { gioco: "blackjack", livello: "diamante", icona: "☁️", nome: "Nuvola Nove",              desc: "Fai 2 Black Jack di fila nella stessa sessione",             stat: "serieBJMax",        meta: 2 },
    { gioco: "blackjack", livello: "diamante", icona: "🕊️", nome: "Spirito Libero",           desc: "Vinci 7 mani di fila senza perdere né pareggiare",           stat: "serieVinteMax",     meta: 7 },
    { gioco: "blackjack", livello: "diamante", icona: "🧘", nome: "Pace dei Sensi",           desc: "Arriva ad avere 100.000 fiches nel profilo",                 stat: "recordFiches",      meta: 100000 },
    { gioco: "blackjack", livello: "diamante", icona: "🤹", nome: "Funambolo",                desc: "Vinci una mano con 5 o più carte senza sballare",            stat: "vinte5carte",       meta: 1 },

    // ---- Scopa ----
    { gioco: "scopa", livello: "bronzo",   icona: "🃏", nome: "Il Primo Taglio",       desc: "Gioca la tua primissima partita a Scopa",                      stat: "partite",         meta: 1 },
    { gioco: "scopa", livello: "bronzo",   icona: "🎯", nome: "Asso di Bastoni",       desc: "Vinci la tua prima partita",                                   stat: "vinte",           meta: 1 },
    { gioco: "scopa", livello: "bronzo",   icona: "🧹", nome: "Tavolo Pulito",         desc: "Fai la tua prima Scopa",                                       stat: "scope",           meta: 1 },
    { gioco: "scopa", livello: "bronzo",   icona: "7️⃣", nome: "Quello Bello",          desc: "Prendi il Settebello per la prima volta",                      stat: "settebello",      meta: 1 },
    { gioco: "scopa", livello: "bronzo",   icona: "🧮", nome: "Calcolatore",           desc: "Vinci il punto di Primiera 5 volte",                           stat: "primiera",        meta: 5 },
    { gioco: "scopa", livello: "bronzo",   icona: "🪙", nome: "Zio Paperone",          desc: "Vinci il punto dei Denari 5 volte",                            stat: "denari",          meta: 5 },
    { gioco: "scopa", livello: "bronzo",   icona: "🗃️", nome: "Pigliatutto",           desc: "Vinci il punto delle Carte 5 volte",                           stat: "carte",           meta: 5 },
    { gioco: "scopa", livello: "bronzo",   icona: "✨", nome: "Spazzata d'Oro",        desc: "Fai 5 Scope giocando o prendendo una carta di Denari",         stat: "scopeDenari",     meta: 5 },
    { gioco: "scopa", livello: "argento",  icona: "🏘️", nome: "Giocatore di Quartiere", desc: "Vinci 15 partite",                                            stat: "vinte",           meta: 15 },
    { gioco: "scopa", livello: "argento",  icona: "🧽", nome: "Ramazza d'Argento",     desc: "Fai 25 Scope in totale",                                       stat: "scope",           meta: 25 },
    { gioco: "scopa", livello: "argento",  icona: "🏹", nome: "Cacciatore di Sette",   desc: "Prendi il Settebello 25 volte",                                stat: "settebello",      meta: 25 },
    { gioco: "scopa", livello: "argento",  icona: "📐", nome: "Matematica Pura",       desc: "Vinci il punto di Primiera 25 volte",                          stat: "primiera",        meta: 25 },
    { gioco: "scopa", livello: "argento",  icona: "🔐", nome: "Cassaforte",            desc: "Vinci il punto dei Denari 25 volte",                           stat: "denari",          meta: 25 },
    { gioco: "scopa", livello: "argento",  icona: "📚", nome: "Mazzo Finito",          desc: "Vinci il punto delle Carte 25 volte",                          stat: "carte",           meta: 25 },
    { gioco: "scopa", livello: "diamante", icona: "🦹", nome: "Vittoria di Rapina",    desc: "Vinci una partita senza mai prendere il Settebello",           stat: "vinteSenzaSette", meta: 1 },
    { gioco: "scopa", livello: "oro",      icona: "👑", nome: "Boss del Tavolo",       desc: "Vinci 50 partite",                                             stat: "vinte",           meta: 50 },
    { gioco: "scopa", livello: "oro",      icona: "🌪️", nome: "L'Aspirapolvere",       desc: "Fai 100 Scope in totale",                                      stat: "scope",           meta: 100 },
    { gioco: "scopa", livello: "oro",      icona: "💞", nome: "Amico del Settebello",  desc: "Prendi il Settebello 100 volte",                               stat: "settebello",      meta: 100 },
    { gioco: "scopa", livello: "oro",      icona: "⏱️", nome: "Tempismo Perfetto",     desc: "Fai 5 Scope calando un Asso",                                  stat: "scopeAsso",       meta: 5 },
    { gioco: "scopa", livello: "argento",  icona: "🧥", nome: "Cappotto Perfetto",     desc: "Prendi Carte, Denari, Settebello e Primiera nella stessa smazzata", stat: "cappotto",   meta: 1 },
    { gioco: "scopa", livello: "oro",      icona: "📈", nome: "Sopra la Media",        desc: "4+1: i quattro punti classici più almeno una Scopa, in una smazzata", stat: "sopraMedia", meta: 1 },
    { gioco: "scopa", livello: "diamante", icona: "🧚", nome: "Mano Fatata",           desc: "Fai 4 Scope in una sola smazzata",                             stat: "scopeRoundMax",   meta: 4 },
    { gioco: "scopa", livello: "diamante", icona: "🌋", nome: "Dominio Partenopeo",    desc: "Vinci una partita lasciando l'avversario a 0 punti",           stat: "vinteAZero",      meta: 1 },
    { gioco: "scopa", livello: "diamante", icona: "🔥", nome: "Rimonta Epica",         desc: "Vinci dopo che l'avversario era arrivato a 10 punti prima di te", stat: "rimonte",      meta: 1 },

    // ---- Scopa 2 vs 2 ----
    { gioco: "scopa2v2", livello: "bronzo",   icona: "👫", nome: "Esordio di Coppia",      desc: "Gioca la tua prima partita a Scopa 2 vs 2",                 stat: "partite",            meta: 1 },
    { gioco: "scopa2v2", livello: "bronzo",   icona: "🙌", nome: "Prima Intesa",           desc: "Vinci la tua prima partita in squadra",                     stat: "vinte",              meta: 1 },
    { gioco: "scopa2v2", livello: "bronzo",   icona: "🧹", nome: "Contributo Attivo",      desc: "Fai la tua prima Scopa personale a squadre",                stat: "scopePersonali",     meta: 1 },
    { gioco: "scopa2v2", livello: "bronzo",   icona: "💰", nome: "Tesoro Condiviso",       desc: "Prendi tu il Settebello per la squadra 5 volte",            stat: "settePersonale",     meta: 5 },
    { gioco: "scopa2v2", livello: "bronzo",   icona: "🎯", nome: "Assist Perfetto",        desc: "Il compagno fa Scopa prendendo la carta che hai messo giù tu (3 volte)", stat: "assist", meta: 3 },
    { gioco: "scopa2v2", livello: "bronzo",   icona: "🧽", nome: "Spazzino di Squadra",    desc: "Fai 10 Scope personali",                                    stat: "scopePersonali",     meta: 10 },
    { gioco: "scopa2v2", livello: "argento",  icona: "💞", nome: "Affinità di Coppia",     desc: "Vinci 15 partite a squadre",                                stat: "vinte",              meta: 15 },
    { gioco: "scopa2v2", livello: "argento",  icona: "🔗", nome: "Lavoro Sincronizzato",   desc: "Tu e il compagno fate almeno 2 Scope a testa nella stessa partita", stat: "sincronizzati", meta: 1 },
    { gioco: "scopa2v2", livello: "oro",      icona: "🏋️", nome: "Il Trascinatore",        desc: "Vinci facendo tu tutte le Scope della squadra (almeno 3)",  stat: "trascinatore",       meta: 1 },
    { gioco: "scopa2v2", livello: "argento",  icona: "🏛️", nome: "Colonna Portante",       desc: "La squadra prende Primiera e Denari nella stessa smazzata (10 volte)", stat: "primDenSquadra", meta: 10 },
    { gioco: "scopa2v2", livello: "argento",  icona: "🤝", nome: "Fiducia Ripagata",       desc: "Prendi tu il Settebello 25 volte",                          stat: "settePersonale",     meta: 25 },
    { gioco: "scopa2v2", livello: "argento",  icona: "🛡️", nome: "Guardia del Corpo",      desc: "Vinci 5 partite senza che gli avversari prendano il Settebello", stat: "vinteNoSetteAvv", meta: 5 },
    { gioco: "scopa2v2", livello: "oro",      icona: "🦸", nome: "Dinamico Duo",           desc: "Vinci 50 partite a squadre",                                stat: "vinte",              meta: 50 },
    { gioco: "scopa2v2", livello: "oro",      icona: "⚡", nome: "Sinergia Totale",        desc: "Fai 100 Scope personali",                                   stat: "scopePersonali",     meta: 100 },
    { gioco: "scopa2v2", livello: "argento",  icona: "🎾", nome: "Grande Slam di Squadra", desc: "La squadra prende tutti e 4 i punti in una smazzata (5 volte)", stat: "grandeSlam",      meta: 5 },
    { gioco: "scopa2v2", livello: "oro",      icona: "🧱", nome: "Difesa di Ferro",        desc: "Vinci 10 partite senza subire nemmeno una Scopa",           stat: "vinteNoScopeSubite", meta: 10 },
    { gioco: "scopa2v2", livello: "diamante", icona: "🔮", nome: "Telepatia Pura",         desc: "Vinci 10 partite di fila",                                  stat: "serieVinteMax",      meta: 10 },
    { gioco: "scopa2v2", livello: "diamante", icona: "😵", nome: "Umiliazione di Coppia",  desc: "Vinci lasciando gli avversari a 0 punti",                   stat: "vinteAZero",         meta: 1 },
    { gioco: "scopa2v2", livello: "diamante", icona: "🔥", nome: "Eroi della Rimonta",     desc: "Vinci dopo che gli avversari erano arrivati a 10 prima di voi", stat: "rimonte",         meta: 1 },

    // ---- L'Impostore ----
    { gioco: "impostore", livello: "bronzo",   icona: "👀", nome: "Battesimo del Sospetto", desc: "Gioca la tua primissima partita",                              stat: "partite",               meta: 1 },
    { gioco: "impostore", livello: "bronzo",   icona: "🔎", nome: "Principio di Deduzione", desc: "Vota giusto l'impostore per la prima volta",                   stat: "smascherati",           meta: 1 },
    { gioco: "impostore", livello: "bronzo",   icona: "😐", nome: "Faccia di Bronzo",       desc: "Vinci la tua prima partita da impostore",                      stat: "vinteImpostore",        meta: 1 },
    { gioco: "impostore", livello: "bronzo",   icona: "🎬", nome: "Aiutino dal Regista",    desc: "Gioca da impostore con l'aiutino acceso (la parola simile)",   stat: "impostoreConAiuto",     meta: 1 },
    { gioco: "impostore", livello: "bronzo",   icona: "🐑", nome: "Vittima Sacrificale",    desc: "Sii il più votato pur essendo innocente, 3 volte",             stat: "innocenteAccusato",     meta: 3 },
    { gioco: "impostore", livello: "argento",  icona: "🕵️", nome: "Detective Dilettante",   desc: "Vota giusto l'impostore 15 volte",                             stat: "smascherati",           meta: 15 },
    { gioco: "impostore", livello: "argento",  icona: "🎭", nome: "Attore Nato",            desc: "Vinci 10 partite da impostore",                                stat: "vinteImpostore",        meta: 10 },
    { gioco: "impostore", livello: "argento",  icona: "🦠", nome: "Parassita",              desc: "Vinci 5 partite da impostore con l'aiutino acceso",            stat: "vinteImpAiutoOn",       meta: 5 },
    { gioco: "impostore", livello: "argento",  icona: "⚔️", nome: "Gioco ad Armi Impari",   desc: "Vota giusto l'impostore 10 volte quando lui aveva l'aiutino",  stat: "smascheratiControAiuto", meta: 10 },
    { gioco: "impostore", livello: "argento",  icona: "🎖️", nome: "Veterano del Sospetto",  desc: "Gioca 25 partite",                                             stat: "partite",               meta: 25 },
    { gioco: "impostore", livello: "oro",      icona: "🧥", nome: "Investigatore Privato",  desc: "Vota giusto l'impostore 50 volte",                             stat: "smascherati",           meta: 50 },
    { gioco: "impostore", livello: "oro",      icona: "🐺", nome: "Lupo tra le Pecore",     desc: "Vinci 25 partite da impostore",                                stat: "vinteImpostore",        meta: 25 },
    { gioco: "impostore", livello: "oro",      icona: "🧠", nome: "Mente Superiore",        desc: "Vinci 10 partite da impostore con l'aiutino spento",           stat: "vinteImpAiutoOff",      meta: 10 },
    { gioco: "impostore", livello: "oro",      icona: "🧊", nome: "Rompighiaccio",          desc: "Vinci da impostore quando tocca a te aprire il giro",          stat: "vinteImpApertura",      meta: 1 },
    { gioco: "impostore", livello: "diamante", icona: "🙈", nome: "Fiducia Cieca",          desc: "Vinci da impostore senza ricevere nemmeno un voto",            stat: "vinteImp0Voti",         meta: 1 },
    { gioco: "impostore", livello: "diamante", icona: "🐕", nome: "Segugio Infallibile",    desc: "Vota giusto l'impostore 5 partite di fila",                    stat: "serieSmascheratiMax",   meta: 5 },
    { gioco: "impostore", livello: "diamante", icona: "🔮", nome: "Telepatia Pura",         desc: "Vinci da impostore con l'aiutino spento e zero voti contro",   stat: "vinteImpPerfette",      meta: 1 },

    // ---- La linea del tempo ----
    { gioco: "timeline", livello: "bronzo",   icona: "📜", nome: "Prima Pagina",            desc: "Gioca la tua prima partita",                          stat: "partite",        meta: 1 },
    { gioco: "timeline", livello: "bronzo",   icona: "📶", nome: "Connessione Stabilita",   desc: "Gioca 1 partita online (ognuno dal suo telefono)",    stat: "partiteOnline",  meta: 1 },
    { gioco: "timeline", livello: "bronzo",   icona: "🏅", nome: "Il Primo Trionfo",        desc: "Vinci 1 partita online",                              stat: "vinteOnline",    meta: 1 },
    { gioco: "timeline", livello: "bronzo",   icona: "🎤", nome: "Fan del Rap",             desc: "Piazza giuste 25 carte di Rap italiano",              stat: "giuste_rap",        meta: 25 },
    { gioco: "timeline", livello: "bronzo",   icona: "📣", nome: "Tifoso",                  desc: "Piazza giuste 25 carte di Calcio",                    stat: "giuste_calcio",     meta: 25 },
    { gioco: "timeline", livello: "bronzo",   icona: "🍿", nome: "Cinefilo",                desc: "Piazza giuste 25 carte di Cinema",                    stat: "giuste_cinema",     meta: 25 },
    { gioco: "timeline", livello: "bronzo",   icona: "📚", nome: "Studente",                desc: "Piazza giuste 25 carte di Storia",                    stat: "giuste_storia",     meta: 25 },
    { gioco: "timeline", livello: "bronzo",   icona: "🔍", nome: "Curioso",                 desc: "Piazza giuste 25 carte di Invenzioni e scoperte",     stat: "giuste_invenzioni", meta: 25 },
    { gioco: "timeline", livello: "bronzo",   icona: "🪧", nome: "Paletta del Giudice",     desc: "Azzecca 10 voti sulle carte degli altri",             stat: "votiGiusti",     meta: 10 },
    { gioco: "timeline", livello: "bronzo",   icona: "🤝", nome: "Fiducia nel Prossimo",    desc: "Vota 👍 e azzeccaci 10 volte",                    stat: "votiSiGiusti",   meta: 10 },
    { gioco: "timeline", livello: "bronzo",   icona: "🌍", nome: "Cultura Generale",        desc: "Vinci una partita con tutte e 5 le categorie",        stat: "vinte5cat",      meta: 1 },
    { gioco: "timeline", livello: "bronzo",   icona: "🙈", nome: "Memoria Corta",           desc: "Sbaglia la tua primissima carta della partita",       stat: "erroriPrimaCarta", meta: 1 },
    { gioco: "timeline", livello: "bronzo",   icona: "🔭", nome: "Occhio Lungo",            desc: "5 carte giuste di fila",                              stat: "serieMax",       meta: 5 },
    { gioco: "timeline", livello: "argento",  icona: "🕰️", nome: "Viaggiatore nel Tempo",   desc: "Gioca 20 partite",                                    stat: "partite",        meta: 20 },
    { gioco: "timeline", livello: "argento",  icona: "📱", nome: "Serata Digitale",         desc: "Gioca 12 partite online",                             stat: "partiteOnline",  meta: 12 },
    { gioco: "timeline", livello: "argento",  icona: "🧊", nome: "Sangue Freddo",           desc: "Vinci 8 partite online",                              stat: "vinteOnline",    meta: 8 },
    { gioco: "timeline", livello: "argento",  icona: "💿", nome: "Disco d'Oro",             desc: "Piazza giuste 100 carte di Rap italiano",             stat: "giuste_rap",        meta: 100 },
    { gioco: "timeline", livello: "argento",  icona: "⚽", nome: "Pallone d'Oro",           desc: "Piazza giuste 100 carte di Calcio",                   stat: "giuste_calcio",     meta: 100 },
    { gioco: "timeline", livello: "argento",  icona: "🎬", nome: "Premio Oscar",            desc: "Piazza giuste 100 carte di Cinema",                   stat: "giuste_cinema",     meta: 100 },
    { gioco: "timeline", livello: "argento",  icona: "🎓", nome: "Titolare di Cattedra",    desc: "Piazza giuste 100 carte di Storia",                   stat: "giuste_storia",     meta: 100 },
    { gioco: "timeline", livello: "argento",  icona: "🧪", nome: "Premio Nobel",            desc: "Piazza giuste 100 carte di Invenzioni e scoperte",    stat: "giuste_invenzioni", meta: 100 },
    { gioco: "timeline", livello: "argento",  icona: "🧐", nome: "Il Critico",              desc: "Azzecca 50 voti sulle carte degli altri",             stat: "votiGiusti",     meta: 50 },
    { gioco: "timeline", livello: "argento",  icona: "🤨", nome: "Scettico di Professione", desc: "Vota 👎 e azzeccaci 25 volte",                    stat: "votiNoGiusti",   meta: 25 },
    { gioco: "timeline", livello: "argento",  icona: "✨", nome: "Mente Lucida",            desc: "Finisci una partita senza sbagliare nessuna carta",   stat: "perfette",       meta: 1 },
    { gioco: "timeline", livello: "argento",  icona: "🚀", nome: "Senza Rivali",            desc: "Vinci con almeno 500 punti di distacco",              stat: "distaccoMax",    meta: 500 },
    { gioco: "timeline", livello: "oro",      icona: "🏃", nome: "Maratoneta del Tempo",    desc: "Gioca 50 partite online",                             stat: "partiteOnline",  meta: 50 },
    { gioco: "timeline", livello: "oro",      icona: "👑", nome: "Dominatore Online",       desc: "Vinci 25 partite online",                             stat: "vinteOnline",    meta: 25 },
    { gioco: "timeline", livello: "oro",      icona: "🗄️", nome: "L'Archivista",            desc: "Piazza giuste 500 carte in totale",                   stat: "giusteTot",      meta: 500 },
    { gioco: "timeline", livello: "oro",      icona: "⚖️", nome: "Giudice Infallibile",     desc: "Azzecca 200 voti sulle carte degli altri",            stat: "votiGiusti",     meta: 200 },
    { gioco: "timeline", livello: "oro",      icona: "🧠", nome: "Tuttologo",               desc: "Vinci 10 partite con tutte e 5 le categorie",         stat: "vinte5cat",      meta: 10 },
    { gioco: "timeline", livello: "oro",      icona: "🏆", nome: "Collezionista",           desc: "Vinci 50 partite",                                    stat: "vinte",          meta: 50 },
    { gioco: "timeline", livello: "diamante", icona: "🏔️", nome: "Difficoltà Massima",      desc: "Partita perfetta con 8 carte a testa",                stat: "perfette8",      meta: 1 },
    { gioco: "timeline", livello: "diamante", icona: "👁️", nome: "Memoria Eidetica",        desc: "15 carte giuste di fila (vale anche tra più partite)", stat: "serieMax",      meta: 15 },
    { gioco: "timeline", livello: "diamante", icona: "🔮", nome: "Macchina della Verità",   desc: "15 voti azzeccati di fila",                           stat: "serieVotiMax",   meta: 15 },
    { gioco: "timeline", livello: "diamante", icona: "⏳", nome: "Dio del Tempo",           desc: "30 carte giuste di fila (vale anche tra più partite)", stat: "serieMax",      meta: 30 },

    // ---------- Glow Hockey (contro il bot) ----------
    { gioco: "hockey", livello: "bronzo",   icona: "🏒", nome: "Battesimo del Disco",       desc: "Gioca la tua prima partita",                          stat: "partite",           meta: 1 },
    { gioco: "hockey", livello: "bronzo",   icona: "🔥", nome: "Dito Caldo",                desc: "Segna il tuo primo gol",                              stat: "golFatti",          meta: 1 },
    { gioco: "hockey", livello: "bronzo",   icona: "🥇", nome: "La Prima Vittoria",         desc: "Vinci la tua prima partita arrivando a 7",            stat: "vittorie",          meta: 1 },
    { gioco: "hockey", livello: "bronzo",   icona: "🌡️", nome: "Riscaldamento Completato",  desc: "Batti il bot Facile",                                 stat: "vinte_facile",      meta: 1 },
    { gioco: "hockey", livello: "bronzo",   icona: "🎯", nome: "Cecchino in Erba",          desc: "Segna 50 gol in totale",                              stat: "golFatti",          meta: 50 },
    { gioco: "hockey", livello: "bronzo",   icona: "📸", nome: "Fotofinish",                desc: "Vinci una partita 7 a 6",                             stat: "fotofinish",        meta: 1 },
    { gioco: "hockey", livello: "argento",  icona: "📈", nome: "Salto di Qualità",          desc: "Batti il bot Medio",                                  stat: "vinte_medio",       meta: 1 },
    { gioco: "hockey", livello: "argento",  icona: "⚡", nome: "Goleador",                  desc: "Segna 200 gol in totale",                             stat: "golFatti",          meta: 200 },
    { gioco: "hockey", livello: "argento",  icona: "📅", nome: "Pratica Quotidiana",        desc: "Vinci 15 partite",                                    stat: "vittorie",          meta: 15 },
    { gioco: "hockey", livello: "argento",  icona: "🧱", nome: "Muro di Gomma",             desc: "Batti il bot Medio 10 volte",                         stat: "vinte_medio",       meta: 10 },
    { gioco: "hockey", livello: "argento",  icona: "🚫", nome: "Porta Inviolata",           desc: "Vinci 7 a 0 (a qualsiasi difficoltà)",                stat: "cappotti",          meta: 1 },
    { gioco: "hockey", livello: "argento",  icona: "🔄", nome: "Rimonta sul Ghiaccio",      desc: "Vinci dopo essere stato sotto di 3 gol",              stat: "rimonte",           meta: 1 },
    { gioco: "hockey", livello: "oro",      icona: "🤖", nome: "Ribellione delle Macchine", desc: "Batti il bot Difficile",                              stat: "vinte_difficile",   meta: 1 },
    { gioco: "hockey", livello: "oro",      icona: "💥", nome: "Dominatore del Disco",      desc: "Segna 500 gol in totale",                             stat: "golFatti",          meta: 500 },
    { gioco: "hockey", livello: "oro",      icona: "🏅", nome: "Professionista dell'Air Hockey", desc: "Vinci 50 partite",                               stat: "vittorie",          meta: 50 },
    { gioco: "hockey", livello: "oro",      icona: "🛡️", nome: "Antivirus",                 desc: "Batti il bot Difficile 10 volte",                     stat: "vinte_difficile",   meta: 10 },
    { gioco: "hockey", livello: "oro",      icona: "🔒", nome: "Saracinesca",               desc: "Batti il bot Medio 7 a 0",                            stat: "cappotti_medio",    meta: 1 },
    { gioco: "hockey", livello: "diamante", icona: "⚡", nome: "Riflessi Fulminei",         desc: "Batti il bot Difficile 7 a 0",                        stat: "cappotti_difficile", meta: 1 },
    { gioco: "hockey", livello: "diamante", icona: "🔌", nome: "Cortocircuito Totale",      desc: "Batti il bot Difficile 5 volte di fila (una sconfitta col Difficile azzera)", stat: "serieDiffMax", meta: 5 },
    { gioco: "hockey", livello: "diamante", icona: "👑", nome: "Leggenda del Tavolo",       desc: "Segna 1.000 gol in totale",                           stat: "golFatti",          meta: 1000 },

    // ---------- Scopone (classico + scientifico, contro il computer) ----------
    { gioco: "scopone", livello: "bronzo",   icona: "🪑", nome: "Il Tavolo dei Grandi",     desc: "Gioca la tua prima partita",                          stat: "partite",           meta: 1 },
    { gioco: "scopone", livello: "bronzo",   icona: "📜", nome: "Tradizione",               desc: "Vinci una partita a Scopone Classico",                stat: "vinteClassico",     meta: 1 },
    { gioco: "scopone", livello: "bronzo",   icona: "🎓", nome: "Calcolo Mentale",          desc: "Vinci una partita a Scopone Scientifico",             stat: "vinteScientifico",  meta: 1 },
    { gioco: "scopone", livello: "bronzo",   icona: "7️⃣", nome: "Custode del Sette",        desc: "La tua squadra prende il Settebello 5 volte",         stat: "settebello",        meta: 5 },
    { gioco: "scopone", livello: "bronzo",   icona: "🪙", nome: "L'Oro del Sud",            desc: "La tua squadra vince il punto dei Denari 5 volte",    stat: "denari",            meta: 5 },
    { gioco: "scopone", livello: "bronzo",   icona: "🤝", nome: "Lavoro di Squadra",        desc: "Vinci 10 partite (le due modalità insieme)",          stat: "vinte",             meta: 10 },
    { gioco: "scopone", livello: "argento",  icona: "🏛️", nome: "Purista del Classico",     desc: "Vinci 15 partite a Scopone Classico",                 stat: "vinteClassico",     meta: 15 },
    { gioco: "scopone", livello: "argento",  icona: "🧠", nome: "Memoria di Ferro",         desc: "Vinci 15 partite a Scopone Scientifico",              stat: "vinteScientifico",  meta: 15 },
    { gioco: "scopone", livello: "argento",  icona: "🃏", nome: "Pigliatutto a Squadre",    desc: "La tua squadra vince il punto delle Carte 25 volte",  stat: "carte",             meta: 25 },
    { gioco: "scopone", livello: "argento",  icona: "🧮", nome: "Re della Primiera",        desc: "La tua squadra vince la Primiera 25 volte",           stat: "primiera",          meta: 25 },
    { gioco: "scopone", livello: "argento",  icona: "🧹", nome: "Contributo Personale",     desc: "Fai tu 50 scope",                                     stat: "scopePersonali",    meta: 50 },
    { gioco: "scopone", livello: "argento",  icona: "🚀", nome: "Partenza a Razzo",         desc: "Classico: fai scopa con la tua prima carta della smazzata", stat: "scopaPrimoTurno", meta: 1 },
    { gioco: "scopone", livello: "argento",  icona: "🎰", nome: "Grande Slam in Quattro",   desc: "Carte, Denari, Settebello e Primiera alla tua squadra in una smazzata (5 volte)", stat: "grandeSlam", meta: 5 },
    { gioco: "scopone", livello: "oro",      icona: "🎩", nome: "Signore dello Scopone",    desc: "Vinci 50 partite",                                    stat: "vinte",             meta: 50 },
    { gioco: "scopone", livello: "oro",      icona: "🤓", nome: "Il Cervellone",            desc: "Vinci 30 partite a Scopone Scientifico",              stat: "vinteScientifico",  meta: 30 },
    { gioco: "scopone", livello: "diamante", icona: "🐝", nome: "Mente Alveare",            desc: "Vinci 7 partite di fila a Scopone Scientifico",       stat: "serieSciMax",       meta: 7 },
    { gioco: "scopone", livello: "diamante", icona: "🧥", nome: "Cappotto a Quattro",       desc: "Vinci lasciando gli avversari a 0 punti",             stat: "vinteAZero",        meta: 1 },

    // ---------- La Scalinata ----------
    { gioco: "scalinata", livello: "bronzo",   icona: "🪜", nome: "Il Primo Gradino",       desc: "Gioca la tua prima partita",                          stat: "partite",           meta: 1 },
    { gioco: "scalinata", livello: "bronzo",   icona: "🦘", nome: "Salto della Quaglia",    desc: "Avanza di 5 gradini in un colpo",                     stat: "mosse5",            meta: 1 },
    { gioco: "scalinata", livello: "bronzo",   icona: "💫", nome: "Bonk!",                  desc: "Scontrati con qualcuno che ha scelto il tuo numero",  stat: "scontri",           meta: 1 },
    { gioco: "scalinata", livello: "bronzo",   icona: "🏁", nome: "Vetta Raggiunta",        desc: "Vinci la tua prima partita",                          stat: "vinte",             meta: 1 },
    { gioco: "scalinata", livello: "bronzo",   icona: "🤦", nome: "Passo Falso",            desc: "Scontrati già al primo turno",                        stat: "scontriPrimoTurno", meta: 1 },
    { gioco: "scalinata", livello: "argento",  icona: "🐜", nome: "Passo dopo Passo",       desc: "Avanza di 1 gradino 30 volte",                        stat: "mosse1",            meta: 30 },
    { gioco: "scalinata", livello: "argento",  icona: "⚖️", nome: "La Via di Mezzo",        desc: "Avanza di 3 gradini 30 volte",                        stat: "mosse3",            meta: 30 },
    { gioco: "scalinata", livello: "argento",  icona: "🦵", nome: "Falcata Lunga",          desc: "Avanza di 5 gradini 30 volte",                        stat: "mosse5",            meta: 30 },
    { gioco: "scalinata", livello: "argento",  icona: "🤕", nome: "Teste Dure",             desc: "Scontrati 100 volte in totale",                       stat: "scontri",           meta: 100 },
    { gioco: "scalinata", livello: "argento",  icona: "🧗", nome: "Scalatore Esperto",      desc: "Vinci 15 partite",                                    stat: "vinte",             meta: 15 },
    { gioco: "scalinata", livello: "argento",  icona: "🐢", nome: "Chi Va Piano...",        desc: "Vinci senza mai scegliere il 5",                      stat: "vinteSenza5",       meta: 1 },
    { gioco: "scalinata", livello: "argento",  icona: "3️⃣", nome: "La Costanza Premia",     desc: "Vinci scegliendo solo il 3, dall'inizio alla fine",   stat: "vinteSolo3",        meta: 1 },
    { gioco: "scalinata", livello: "oro",      icona: "🏔️", nome: "Alpinista",              desc: "Vinci 50 partite",                                    stat: "vinte",             meta: 50 },
    { gioco: "scalinata", livello: "oro",      icona: "🏃", nome: "Maratona Verticale",     desc: "Sali 750 gradini in totale",                          stat: "gradini",           meta: 750 },
    { gioco: "scalinata", livello: "oro",      icona: "😈", nome: "Genio del Male",         desc: "Arriva in cima nel turno in cui tutti gli altri si scontrano", stat: "vinteAltriBloccati", meta: 1 },
    { gioco: "scalinata", livello: "diamante", icona: "🛗", nome: "Ascensore Privato",      desc: "Vinci in 3 turni: 5, 5, 5 senza mai scontrarti",      stat: "vinteIn3",          meta: 1 },
    { gioco: "scalinata", livello: "diamante", icona: "👻", nome: "Il Fantasma",            desc: "Vinci senza subire nemmeno uno scontro",              stat: "vinteSenzaScontri", meta: 1 }
  ];

  function valoreStat(prof, gioco, chiave) {
    var st = (window.SGNube && SGNube.statGioco) ? SGNube.statGioco(gioco) : {};
    var v = (st && st[chiave]) || 0;
    // il record fiches tiene conto anche del saldo attuale (es. dopo un bonus)
    if (chiave === "recordFiches") { var ora = (prof.fiches && prof.fiches[gioco]) || 0; if (ora > v) v = ora; }
    return v;
  }
  function trofeiDi(gid) { return TROFEI.filter(function (t) { return t.gioco === gid; }); }
  function trofeoFatto(prof, t) { return valoreStat(prof, t.gioco, t.stat) >= t.meta; }
  function contaTrofei(prof, gid) { var l = trofeiDi(gid), n = 0; l.forEach(function (t) { if (trofeoFatto(prof, t)) n++; }); return { fatti: n, tot: l.length }; }
  function platinato(prof, gid) { var c = contaTrofei(prof, gid); return c.tot > 0 && c.fatti === c.tot; }

  // schermata principale: l'elenco di TUTTI i giochi, ognuno coi suoi trofei dentro
  function schermataSfide() {
    var s = schermata({ icona: "🏆", titolo: "Trofei", sotto: "Colleziona i trofei di ogni gioco", indietro: schermataHome });
    var prof = (window.SGNube && SGNube.disponibile()) ? SGNube.profilo() : null;
    if (!prof) {
      s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Ti serve il profilo per registrare i progressi e sbloccare i trofei: i dati ti seguono su ogni telefono." }));
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "👤 Crea / accedi al profilo", onclick: function () { schermataAccesso(schermataSfide); } }));
      mostra(s); return;
    }
    var totFatti = 0, totTrofei = 0, platini = 0, conPlatino = 0, perLiv = {};
    ["bronzo", "argento", "oro", "diamante"].forEach(function (l) { perLiv[l] = { fatti: 0, tot: 0 }; });
    TROFEI.forEach(function (t) { var p = perLiv[t.livello]; if (!p) return; p.tot++; if (trofeoFatto(prof, t)) p.fatti++; });
    giochi.forEach(function (g) { var c = contaTrofei(prof, g.id); totFatti += c.fatti; totTrofei += c.tot; if (c.tot) conPlatino++; if (platinato(prof, g.id)) platini++; });
    var pctTot = Math.floor(totFatti * 100 / Math.max(1, totTrofei));
    function cella(cls, ico, nome, f, t) {
      return el("div", { class: "sm-liv " + cls }, [ el("div", { class: "sm-ico", text: ico }), el("div", { class: "sm-num", html: "<b>" + f + "</b>/" + t }), el("div", { class: "sm-nome", text: nome }) ]);
    }
    s._contenuto.appendChild(el("div", { class: "sfide-sommario" }, [
      el("div", { class: "sm-testa", html: "🏆 <b>" + totFatti + "</b>/" + totTrofei + " trofei <span class='sm-pct'>" + pctTot + "%</span>" }),
      el("div", { class: "sg-barra sm-barra" }, [ el("div", { class: "sg-fill", style: "width:" + pctTot + "%" }) ]),
      el("div", { class: "sm-livelli" }, [
        cella("tl-bronzo", "🥉", "Bronzo", perLiv.bronzo.fatti, perLiv.bronzo.tot),
        cella("tl-argento", "🥈", "Argento", perLiv.argento.fatti, perLiv.argento.tot),
        cella("tl-oro", "🥇", "Oro", perLiv.oro.fatti, perLiv.oro.tot),
        cella("tl-diamante", "💎", "Diamante", perLiv.diamante.fatti, perLiv.diamante.tot),
        cella("tl-platino", "💠", "Platino", platini, conPlatino)
      ])
    ]));
    giochi.forEach(function (g) {
      var c = contaTrofei(prof, g.id), plat = platinato(prof, g.id), pct = Math.floor(c.fatti * 100 / Math.max(1, c.tot));
      s._contenuto.appendChild(el("button", { class: "sfida-gioco" + (plat ? " platinato" : ""), onclick: function () { schermataSfideGioco(g.id); } }, [
        el("span", { class: "sg-ico", text: g.icona || "🎮" }),
        el("div", { class: "sg-corpo" }, [
          el("div", { class: "sg-nome", text: g.nome }),
          el("div", { class: "sg-sub", html: c.tot ? (c.fatti + "/" + c.tot + " trofei" + (plat ? "  ·  💠 Platino!" : "") + " <span class='sg-pct'>" + pct + "%</span>") : "Trofei in arrivo" }),
          c.tot ? el("div", { class: "sg-barra" }, [ el("div", { class: "sg-fill", style: "width:" + pct + "%" }) ]) : null
        ]),
        el("span", { class: "sg-frecc", text: plat ? "💠" : "›" })
      ]));
    });
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: schermataHome }));
    mostra(s);
  }
  // schermata di un singolo gioco: platino in cima + trofei per livello
  function schermataSfideGioco(gid) {
    var g = null; giochi.forEach(function (x) { if (x.id === gid) g = x; }); if (!g) g = { nome: gid, icona: "🎮" };
    var prof = (window.SGNube && SGNube.disponibile()) ? SGNube.profilo() : null;
    var s = schermata({ icona: g.icona || "🏆", titolo: g.nome, sotto: "Trofei del gioco", indietro: schermataSfide });
    if (!prof) { s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Accedi al profilo per vedere i tuoi trofei." })); s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "‹ Tutti i giochi", onclick: schermataSfide })); mostra(s); return; }
    var lista = trofeiDi(gid), c = contaTrofei(prof, gid);
    // trofeo Platino (sempre mostrato: è il traguardo del gioco)
    var plat = c.tot > 0 && c.fatti === c.tot;
    s._contenuto.appendChild(el("div", { class: "trofeo tl-platino" + (plat ? " fatto" : "") }, [
      el("div", { class: "tr-ico", text: plat ? "💠" : "🔒" }),
      el("div", { class: "tr-corpo" }, [
        el("div", { class: "tr-nome", text: "Platino" + (plat ? "  ✓" : "") }),
        el("div", { class: "tr-desc", text: "Sblocca tutti i trofei del gioco" }),
        el("div", { class: "tr-barra" }, [ el("div", { class: "tr-fill", style: "width:" + Math.round(c.fatti * 100 / Math.max(1, c.tot)) + "%" }) ]),
        el("div", { class: "tr-num", text: c.fatti + " / " + c.tot })
      ])
    ]));
    if (!lista.length) {
      s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "margin-top:14px", text: "Le sfide di " + g.nome + " arrivano presto — le definiamo insieme. Intanto le tue partite vengono già registrate." }));
    } else {
      ORDINE_LIV.forEach(function (liv) {
        var gruppo = lista.filter(function (t) { return t.livello === liv; });
        if (!gruppo.length) return;
        s._contenuto.appendChild(el("div", { class: "etichetta", text: LIVELLI[liv].nome }));
        gruppo.forEach(function (t) {
          var val = valoreStat(prof, t.gioco, t.stat), fatto = val >= t.meta;
          var perc = Math.max(0, Math.min(100, Math.round(val * 100 / t.meta)));
          s._contenuto.appendChild(el("div", { class: "trofeo " + LIVELLI[liv].cls + (fatto ? " fatto" : "") }, [
            el("div", { class: "tr-ico", text: fatto ? t.icona : "🔒" }),
            el("div", { class: "tr-corpo" }, [
              el("div", { class: "tr-nome", text: t.nome + (fatto ? "  ✓" : "") }),
              el("div", { class: "tr-desc", text: t.desc }),
              el("div", { class: "tr-barra" }, [ el("div", { class: "tr-fill", style: "width:" + perc + "%" }) ]),
              el("div", { class: "tr-num", text: Math.min(val, t.meta) + " / " + t.meta })
            ])
          ]));
        });
      });
    }
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "‹ Tutti i giochi", onclick: schermataSfide }));
    mostra(s);
  }

  // ---- Avviso "Trofeo sbloccato!" (pochi secondi, con suono e vibrazione) ----
  // Ricorda i trofei già presi dal profilo: dopo ogni salvataggio controlla se ne è
  // arrivato uno nuovo. Al primo caricamento (o cambio profilo) non avvisa di nulla.
  var trofeiNoti = null, codaTrofei = [], avvisoAttivo = false;
  function trofeiSbloccati(prof) {
    var s = {};
    TROFEI.forEach(function (t) { if (trofeoFatto(prof, t)) s[t.gioco + "|" + t.nome] = t; });
    giochi.forEach(function (g) { if (platinato(prof, g.id)) s[g.id + "|__platino"] = { gioco: g.id, livello: "platino", icona: "💠", nome: "Platino" }; });
    return s;
  }
  function controllaTrofei() {
    var prof = (window.SGNube && SGNube.disponibile()) ? SGNube.profilo() : null;
    if (!prof) { trofeiNoti = null; return; }
    var ora = trofeiSbloccati(prof);
    if (trofeiNoti && trofeiNoti.uid === prof.uid) {
      for (var k in ora) if (!trofeiNoti.set[k]) codaTrofei.push(ora[k]);
      // il Platino arriva per ultimo, dopo i trofei che l'hanno fatto scattare
      codaTrofei.sort(function (a, b) { return (a.livello === "platino") - (b.livello === "platino"); });
      prossimoAvviso();
    }
    trofeiNoti = { uid: prof.uid, set: ora };
  }
  function prossimoAvviso() {
    if (avvisoAttivo || !codaTrofei.length) return;
    avvisoAttivo = true;
    var t = codaTrofei.shift(), g = null;
    giochi.forEach(function (x) { if (x.id === t.gioco) g = x; });
    var liv = t.livello === "platino" ? "Platino" : (LIVELLI[t.livello] ? LIVELLI[t.livello].nome : "");
    var fatto = false, timer = null;
    var box = el("div", { class: "avviso-trofeo tl-" + t.livello, onclick: function () { chiudi(); } }, [
      el("div", { class: "at-ico", text: t.icona || "🏆" }),
      el("div", { class: "at-corpo" }, [
        el("div", { class: "at-su", text: "🏆 Trofeo " + liv + " sbloccato!" }),
        el("div", { class: "at-nome", text: t.nome }),
        el("div", { class: "at-gioco", text: g ? g.nome : "" })
      ])
    ]);
    document.body.appendChild(box);   // fuori dalla schermata: resta anche se il gioco cambia pagina
    requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add("dentro"); }); });
    suonoTrofeo(t.livello === "platino");
    try { if (navigator.vibrate) navigator.vibrate(t.livello === "platino" ? [40, 60, 40, 60, 80] : [30, 40, 30]); } catch (e) {}
    timer = setTimeout(chiudi, 3600);
    function chiudi() {
      if (fatto) return; fatto = true; clearTimeout(timer);
      box.classList.remove("dentro");
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); avvisoAttivo = false; prossimoAvviso(); }, 380);
    }
  }
  function suonoTrofeo(platino) {
    var ctx = audioCtx(); if (!ctx) return;
    try {
      (platino ? [784, 988, 1175, 1568] : [880, 1320]).forEach(function (f, i) {
        var t0 = ctx.currentTime + i * 0.11, o = ctx.createOscillator(), gn = ctx.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(f, t0);
        gn.gain.setValueAtTime(0.0001, t0);
        gn.gain.exponentialRampToValueAtTime(0.22, t0 + 0.015);
        gn.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.38);
        o.connect(gn); gn.connect(ctx.destination); o.start(t0); o.stop(t0 + 0.42);
      });
    } catch (e) {}
  }
  // controlla dopo ogni salvataggio dei giochi e a ogni cambio del profilo (es. bonus ritirato)
  if (window.SGNube) {
    ["salvaProgressi", "salvaFiches"].forEach(function (nome) {
      var orig = SGNube[nome]; if (!orig) return;
      SGNube[nome] = function () { var r = orig.apply(SGNube, arguments); controllaTrofei(); return r; };
    });
    SGNube.onCambio(controllaTrofei);
  }

  // ---- Proposte e segnalazioni ----
  // I messaggi vengono spediti al sito (moduli di Netlify) e finiscono
  // nell'area riservata del proprietario: li può leggere solo lui.
  function inviaModulo(nomeModulo, dati) {
    var pezzi = ["form-name=" + encodeURIComponent(nomeModulo)];
    for (var k in dati) pezzi.push(encodeURIComponent(k) + "=" + encodeURIComponent(dati[k] == null ? "" : dati[k]));
    return fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: pezzi.join("&")
    }).then(function (r) { if (!r.ok) throw new Error("invio non riuscito"); return true; });
  }

  function schermataModulo(opts) {
    var s = schermata({ icona: opts.icona, titolo: opts.titolo, sotto: opts.sotto, indietro: schermataHome });
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: opts.nota }));
    var nome = el("input", { class: "link-campo", type: "text", placeholder: "Il tuo nome (facoltativo)", maxlength: "24" });
    var testo = el("textarea", { class: "modulo-testo", placeholder: opts.placeholder, rows: "6" });
    var avviso = el("div", { class: "link-avviso" });
    s._contenuto.appendChild(nome);
    s._contenuto.appendChild(testo);
    s._contenuto.appendChild(avviso);
    var invia = el("button", { class: "btn btn-primario", text: opts.bottone, onclick: function () {
      var msg = (testo.value || "").trim();
      if (msg.length < 3) { avviso.textContent = "Scrivi prima il messaggio."; return; }
      invia.disabled = true; avviso.textContent = "Invio in corso…";
      var dati = { nome: (nome.value || "").trim() || "Anonimo", messaggio: msg };
      if (opts.contesto) dati.contesto = opts.contesto();
      inviaModulo(opts.modulo, dati).then(function () { grazie(opts.grazie); })
        .catch(function () {
          invia.disabled = false;
          avviso.textContent = "Non sono riuscito a inviare (succede se il gioco non è aperto dal sito pubblicato). Copia il testo e mandalo a chi gestisce il gioco.";
          testo.focus(); testo.select();
        });
    }});
    s._piede.appendChild(invia);
    mostra(s);
  }

  function grazie(testo) {
    var s = schermata({});
    s._contenuto.appendChild(el("div", { class: "passa" }, [
      el("div", { class: "emoji", text: "🙏" }),
      el("div", { class: "grande", text: "Grazie!" }),
      el("p", { class: "tenue centro", text: testo })
    ]));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna ai giochi", onclick: schermataHome }));
    mostra(s);
  }

  function schermataProposte() {
    schermataModulo({
      modulo: "proposte", icona: "💡", titolo: "Proposte", sotto: "Hai un'idea? Scrivila qui",
      nota: "Un gioco nuovo, una carta da aggiungere, una regola da cambiare… scrivi pure. La legge soltanto chi gestisce il gioco.",
      placeholder: "La mia idea è…", bottone: "Invia la proposta",
      grazie: "La tua proposta è arrivata. Se è buona, la vedrai comparire nel gioco!"
    });
  }

  function schermataBug() {
    schermataModulo({
      modulo: "bug", icona: "🐞", titolo: "Segnala un problema", sotto: "Qualcosa non funziona?",
      nota: "Racconta cosa stavi facendo e cosa è andato storto. Più sei preciso, più in fretta lo sistemiamo.",
      placeholder: "Stavo giocando a… e invece di… è successo…",
      bottone: "Invia la segnalazione",
      grazie: "Segnalazione ricevuta: ci aiuta a sistemare il gioco.",
      contesto: function () {
        var v = (window.SG_NOVITA && window.SG_NOVITA[0] && window.SG_NOVITA[0].v) || "?";
        return "versione " + v + " · schermo " + window.innerWidth + "x" + window.innerHeight + " · " + navigator.userAgent;
      }
    });
  }

  function rangeGiocatori(g) {
    if (g.etichettaGiocatori) return g.etichettaGiocatori;   // testo su misura (es. Horto: conta i cavalli in gara, non i profili)
    var min = g.giocatoriMin || 2, max = g.giocatoriMax || 8;
    return "👥 " + (min === max ? min : min + "–" + max) + " giocatori";
  }

  // ---- Scelta dei giocatori ----
  // =========================================================
  //  PROFILO  (crea / accedi) — resta su questo telefono
  // =========================================================
  var K_PROFILI = "sg_profili", K_ATTIVO = "sg_profilo_attivo";
  var FACCINE = ["😀","😎","🤠","🥳","🤩","😈","🤖","👻","👽","🐱","🐶","🦊","🐼","🦁","🐸","🐧","🍕","🍔","⚽","🎸","🚀","🌟","🦄","🐢"];

  function leggiL(k, def) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } }
  function scriviL(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function profili() { var p = leggiL(K_PROFILI, []); return (p instanceof Array) ? p : []; }
  function profiloAttivo() {
    if (window.SGNube && SGNube.disponibile()) {
      var pc = SGNube.profilo();
      return pc ? { id: pc.uid, nome: pc.nome, emoji: pc.emoji, omino: pc.omino || null, cloud: true } : null;
    }
    var id = leggiL(K_ATTIVO, null);
    return profili().filter(function (p) { return p.id === id; })[0] || null;
  }
  function salvaProfilo(p) {
    var lista = profili().filter(function (x) { return x.id !== p.id; });
    lista.unshift(p);
    if (lista.length > 12) lista = lista.slice(0, 12);
    scriviL(K_PROFILI, lista); scriviL(K_ATTIVO, p.id);
  }

  function schermataCaricamento() {
    var s = schermata({ icona: "⚡", titolo: "SPeeD GAME", sotto: "Un attimo…" });
    s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: "Sto caricando il tuo profilo…" }));
    mostra(s);
  }

  function schermataAccesso(dopo) {
    if (window.SGNube && SGNube.disponibile()) return schermataAccessoCloud(dopo);
    var lista = profili();
    var s = schermata({ icona: "👤", titolo: "Il tuo profilo", sotto: "Crea il tuo oppure accedi", indietro: schermataHome });
    s._contenuto.appendChild(el("p", { class: "modulo-nota",
      text: "Il profilo serve solo a non riscrivere ogni volta nome e faccina. Resta su questo telefono: non c'è nessuna password." }));
    if (lista.length) {
      s._contenuto.appendChild(el("div", { class: "etichetta", text: "Profili su questo telefono" }));
      lista.slice(0, 4).forEach(function (p) {
        s._contenuto.appendChild(el("button", { class: "profilo-riga", onclick: function () { scriviL(K_ATTIVO, p.id); dopo(); } }, [
          el("span", { class: "av", text: p.emoji }),
          el("span", { class: "nm", text: p.nome }),
          el("span", { class: "frecc", text: "›" })
        ]));
      });
    }
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "➕ Crea profilo", onclick: function () { schermataCreaProfilo(dopo, null); } }));
    var bAcc = el("button", { class: "btn btn-fantasma", text: "👤 Accedi con un profilo salvato", onclick: function () { schermataScegliProfilo(dopo); } });
    if (!lista.length) bAcc.disabled = true;
    s._piede.appendChild(bAcc);
    mostra(s);
  }

  function schermataScegliProfilo(dopo) {
    var s = schermata({ icona: "👤", titolo: "Accedi", sotto: "Scegli il tuo profilo", indietro: function () { schermataAccesso(dopo); } });
    profili().forEach(function (p) {
      s._contenuto.appendChild(el("button", { class: "profilo-riga", onclick: function () { scriviL(K_ATTIVO, p.id); dopo(); } }, [
        el("span", { class: "av", text: p.emoji }),
        el("span", { class: "nm", text: p.nome }),
        el("span", { class: "frecc", text: "›" })
      ]));
    });
    mostra(s);
  }

  function schermataCreaProfilo(dopo, esistente) {
    var scelta = { emoji: (esistente && esistente.emoji) || FACCINE[0] };
    var s = schermata({ icona: "👤", titolo: esistente ? "Modifica profilo" : "Crea profilo",
      indietro: function () { schermataAccesso(dopo); } });
    var nome = el("input", { class: "link-campo", type: "text", maxlength: "16",
      placeholder: "Come ti chiami?", value: (esistente && esistente.nome) || "" });
    s._contenuto.appendChild(nome);
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "Scegli la faccina" }));
    var griglia = el("div", { class: "faccine" });
    FACCINE.forEach(function (e) {
      griglia.appendChild(el("button", { class: "faccina" + (e === scelta.emoji ? " attiva" : ""), text: e,
        onclick: function () {
          scelta.emoji = e;
          [].forEach.call(griglia.children, function (c) { c.className = "faccina" + (c.textContent === e ? " attiva" : ""); });
        } }));
    });
    s._contenuto.appendChild(griglia);
    var avviso = el("div", { class: "link-avviso" });
    s._contenuto.appendChild(avviso);
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Salva ▶", onclick: function () {
      var n = (nome.value || "").trim();
      if (n.length < 2) { avviso.textContent = "Scrivi il tuo nome."; return; }
      salvaProfilo({ id: (esistente && esistente.id) || ("p" + Date.now() + Math.floor(Math.random() * 999)), nome: n, emoji: scelta.emoji });
      dopo();
    }}));
    mostra(s);
  }

  // ---- OMINO: il tuo personaggio stile Mii (disegno in js/omino.js) ----
  var SEZ_OMINO = [
    { nome: "Corpo",     voci: [["forma", "Forma"], ["corpo", "Corporatura"], ["pelle", "Pelle"]] },
    { nome: "Viso",      voci: [["viso", "Forma del viso"], ["occhi", "Occhi"], ["iride", "Colore occhi"], ["sopracc", "Sopracciglia"], ["naso", "Naso"], ["bocca", "Bocca"], ["guance", "Guance"]] },
    { nome: "Capelli",   voci: [["capelli", "Taglio"], ["colCap", "Colore"], ["barba", "Barba e baffi"]] },
    { nome: "Vestiti",   voci: [["capo", "Stile"], ["maglia", "Colore"], ["stampa", "Stampa"], ["sotto", "Sotto"], ["pantaloni", "Colore sotto"], ["scarpe", "Scarpe"]] },
    { nome: "Accessori", voci: [["accessorio", "Accessorio"], ["colAcc", "Colore accessorio"]] }
  ];
  var OMINO_COLORI = { pelle: 1, colCap: 1, iride: 1, maglia: 1, pantaloni: 1, scarpe: 1, colAcc: 1 };
  var OMINO_INTERO = { forma: 1, corpo: 1, sotto: 1, capo: 1, stampa: 1 };   // anteprima a figura intera (le altre: solo la testa)
  var ACC_COLORATI = /cappellino|berretto|fascia|cuffie/;          // accessori che hanno un colore da scegliere
  var OMINO_LIBERO = { colCap: 1, iride: 1, maglia: 1, pantaloni: 1, scarpe: 1, colAcc: 1 };   // colori dove c'è anche la tavolozza libera
  var OMINO_RITOCCHI = [["occG", "Grandezza occhi"], ["occD", "Distanza occhi"], ["occA", "Altezza occhi"],
    ["soprA", "Altezza sopracciglia"], ["nasoG", "Grandezza naso"], ["boccaA", "Altezza bocca"]];
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
  function salvaOminoMio(cfg) {
    var io = profiloAttivo(); if (!io) return;
    if (io.cloud) { SGNube.salvaOmino(cfg); return; }
    var p = profili().filter(function (x) { return x.id === io.id; })[0];
    if (p) { p.omino = cfg; salvaProfilo(p); }
  }
  function schermataOmino(dopo) {
    var io = profiloAttivo();
    if (!io) return schermataAccesso(function () { schermataOmino(dopo); });
    var O = SGOmino, cfg = O.norm(io.omino || O.casuale(io.nome));
    var tab = 0;
    var s = schermata({ icona: "🧍", titolo: "Il mio omino", sotto: "Crealo come vuoi: ti rappresenta nei giochi", indietro: dopo });
    // il palco: faro dall'alto, pedana luminosa, omino che respira e sbatte le palpebre, targa col nome
    var figura = el("div", { class: "om-figura" });
    var palco = el("div", { class: "omino-palco editor" }, [el("div", { class: "om-faro" }), el("div", { class: "om-pedana" }), figura,
      el("div", { class: "om-targa", text: io.nome })]);
    var schede = el("div", { class: "omino-schede" });
    var pannello = el("div", { class: "omino-pannello" });
    s._contenuto.appendChild(palco); s._contenuto.appendChild(schede); s._contenuto.appendChild(pannello);
    function unisci(k, v) { var c = {}; for (var x in cfg) c[x] = cfg[x]; c[k] = v; return c; }
    function anteprima(salto) {
      figura.innerHTML = O.svg(cfg, { hd: true });
      if (salto) { figura.classList.remove("salta"); void figura.offsetWidth; figura.classList.add("salta"); popOmino(); }
    }
    var tSaluto = null;
    function saluta() {   // alza il braccio e fa "ciao"
      clearTimeout(tSaluto); figura.classList.remove("saluta"); void figura.offsetWidth; figura.classList.add("saluta");
      tSaluto = setTimeout(function () { figura.classList.remove("saluta"); }, 1100);
    }
    function disegnaSchede() {
      schede.innerHTML = "";
      SEZ_OMINO.forEach(function (sz, i) { schede.appendChild(el("button", { class: "cat-tab" + (i === tab ? " attiva" : ""), text: sz.nome, onclick: function () { tab = i; disegnaSchede(); disegnaPannello(); } })); });
    }
    // aggiorna solo i riquadri (niente ricostruzione della schermata: non salta lo scroll)
    function aggiornaPannello() {
      [].forEach.call(pannello.querySelectorAll(".om-opz"), function (b) {
        var k = b._k, v = b._v;
        if (b._libero) {   // tavolozza libera: attiva se il colore è uno scelto a mano
          var mio = typeof cfg[k] === "string";
          b.classList.toggle("attiva", mio); b.style.background = mio ? cfg[k] : "";
          return;
        }
        b.classList.toggle("attiva", cfg[k] === v);
        if (b._mini) b._mini.innerHTML = O.svg(unisci(k, v), { busto: !OMINO_INTERO[k] });
      });
    }
    function scegli(k, v, zitto) {
      if (cfg[k] === v) return;
      if (zitto) { cfg[k] = v; anteprima(false); return; }   // mentre trascini (colore libero, cursori): niente saltelli
      var rifai = (k === "forma" || k === "accessorio");   // "Sotto" solo per la donna, "Colore accessorio" solo se serve
      cfg[k] = v; if (k === "forma" && v === "uomo") cfg.sotto = "pantaloni";
      anteprima(true); if (rifai) disegnaPannello(); else aggiornaPannello();
    }
    function disegnaPannello() {
      pannello.innerHTML = "";
      SEZ_OMINO[tab].voci.forEach(function (vc) {
        var k = vc[0];
        if (k === "sotto" && cfg.forma !== "donna") return;
        if (k === "colAcc" && !ACC_COLORATI.test(cfg.accessorio)) return;
        pannello.appendChild(el("div", { class: "etichetta", text: vc[1] }));
        var riga = el("div", { class: "om-griglia" + (OMINO_COLORI[k] ? " colori" : "") });
        O.OPZ[k].forEach(function (val, i) {
          var v = OMINO_COLORI[k] ? i : val, b;
          if (OMINO_COLORI[k]) {
            b = el("button", { class: "om-opz om-colore", style: "background:" + val, "aria-label": vc[1] + " " + (i + 1), onclick: function () { scegli(k, v); } });
          } else {
            var bloccato = k === "accessorio" && O.LIBERI.indexOf(val) < 0;
            var nomeVis = O.NOMI[val] || val;
            b = el("button", { class: "om-opz om-forma" + (bloccato ? " bloccato" : ""), onclick: function () { if (!bloccato) scegli(k, v); } });
            b._mini = el("div", { class: "om-mini" + (OMINO_INTERO[k] ? " intero" : "") });
            b.appendChild(b._mini);
            b.appendChild(el("div", { class: "om-nome", text: bloccato ? "🔒 coi trofei" : nomeVis.charAt(0).toUpperCase() + nomeVis.slice(1) }));
          }
          b._k = k; b._v = v; riga.appendChild(b);
        });
        if (OMINO_LIBERO[k]) {   // ultimo tondo: tavolozza arcobaleno per un colore qualsiasi
          var ultimo = typeof cfg[k] === "string" ? cfg[k] : (O.OPZ[k][cfg[k]] || "#ffffff");
          var inp = el("input", { type: "color", value: ultimo, "aria-label": vc[1] + ": colore libero" });
          inp.addEventListener("input", function () { scegli(k, inp.value, true); });
          inp.addEventListener("change", function () { cfg[k] = null; scegli(k, inp.value); });
          var bl = el("label", { class: "om-opz om-colore om-libero", title: "Colore libero" }, [inp]);
          bl._k = k; bl._libero = true; riga.appendChild(bl);
        }
        pannello.appendChild(riga);
      });
      // ritocchi stile Mii (solo nella scheda Viso): cursori da -2 a +2
      if (SEZ_OMINO[tab].nome === "Viso") {
        pannello.appendChild(el("div", { class: "etichetta", text: "Ritocchi" }));
        OMINO_RITOCCHI.forEach(function (r) {
          var k = r[0], val = el("span", { class: "om-rit-val" });
          var cur = el("input", { type: "range", min: "-2", max: "2", step: "1", value: String(cfg[k] || 0), class: "om-cursore", "aria-label": r[1] });
          function scrivi() { var n = +cur.value; val.textContent = n > 0 ? "+" + n : String(n); }
          cur.addEventListener("input", function () { scrivi(); scegli(k, +cur.value, true); });
          cur.addEventListener("change", function () { popOmino(); aggiornaPannello(); });
          scrivi();
          pannello.appendChild(el("div", { class: "om-ritocco" }, [el("span", { class: "om-rit-nome", text: r[1] }), cur, val]));
        });
      }
      aggiornaPannello();
    }
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🎲 A caso", onclick: function () {
      cfg = O.norm(O.casuale()); anteprima(true); disegnaPannello();
    } }));
    var salvato = false;
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "✅ Salva il mio omino", onclick: function () {
      if (salvato) return; salvato = true;
      salvaOminoMio(cfg); saluta(); popOmino();
      setTimeout(dopo, 1000);   // prima ti saluta, poi torna indietro
    } }));
    anteprima(); disegnaSchede(); disegnaPannello();
    mostra(s);
    setTimeout(saluta, 350);   // appena entri: "ciao!"
  }

  // ---- profili in cloud (Firebase): nome + password, ti seguono ovunque ----
  function schermataAccessoCloud(dopo) {
    var p = SGNube.profilo();
    if (p) {   // già dentro: mostra il profilo, le statistiche e il tasto esci
      var sp = schermata({ icona: p.emoji || "👤", titolo: p.nome, sotto: "Il tuo profilo", indietro: schermataHome });
      if (window.SGOmino) sp._contenuto.appendChild(el("div", { class: "omino-profilo" }, [
        el("div", { class: "omino-palco" + (p.omino ? "" : " vuoto"), html: SGOmino.svg(p.omino || SGOmino.casuale(p.nome)) }),
        el("button", { class: "btn " + (p.omino ? "btn-fantasma" : "btn-primario"), text: p.omino ? "✏️ Modifica il tuo omino" : "🧍 Crea il tuo omino",
          onclick: function () { schermataOmino(function () { schermataAccessoCloud(dopo); }); } })
      ]));
      var fi = (p.fiches && p.fiches.blackjack != null) ? p.fiches.blackjack : SGNube.fichesStart;
      sp._contenuto.appendChild(el("div", { class: "etichetta", text: "🃏 Black Jack" }));
      sp._contenuto.appendChild(el("p", { class: "modulo-nota", html: "Hai <b>" + fi + " fiches</b>. Si portano avanti tra una partita e l'altra, su qualsiasi telefono." }));
      var st = (p.stat && p.stat.blackjack) || {};
      var giocate = st.maniGiocate || 0, vinte = st.maniVinte || 0, perc = giocate ? Math.round(vinte / giocate * 100) : 0;
      var celle = [["Mani giocate", giocate], ["Mani vinte", vinte], ["% vittorie", perc + "%"],
        ["Black Jack", st.blackjackFatti || 0], ["Record fiches", st.recordFiches || fi], ["Vincita max", st.vincitaMax || 0]];
      var griglia = el("div", { style: "display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:6px" });
      celle.forEach(function (v) {
        griglia.appendChild(el("div", { style: "background:var(--carta);border-radius:12px;padding:10px 4px;text-align:center;box-shadow:var(--ombra)" }, [
          el("div", { style: "font-size:1.35rem;font-weight:900;color:#ffe58a;line-height:1.1", text: "" + v[1] }),
          el("div", { style: "font-size:.7rem;color:var(--testo-tenue);margin-top:3px", text: v[0] })
        ]));
      });
      sp._contenuto.appendChild(griglia);
      sp._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🚪 Esci dal profilo", onclick: function () { SGNube.esci().then(function () { schermataHome(); }); } }));
      mostra(sp); return;
    }
    var s = schermata({ icona: "👤", titolo: "Il tuo profilo", sotto: "Entra o crea il tuo", indietro: schermataHome });
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Entra col tuo profilo: fiches e dati ti seguono su ogni telefono." }));
    var nome = el("input", { class: "link-campo", type: "text", maxlength: "20", placeholder: "Nome" });
    var pwd = el("input", { class: "link-campo", type: "password", maxlength: "40", placeholder: "Password", style: "margin-top:8px" });
    var avviso = el("div", { class: "link-avviso" });
    s._contenuto.appendChild(nome); s._contenuto.appendChild(pwd); s._contenuto.appendChild(avviso);
    var bEntra = el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
      var n = (nome.value || "").trim(), pw = pwd.value || "";
      if (n.length < 2 || pw.length < 1) { avviso.textContent = "Scrivi nome e password."; return; }
      bEntra.disabled = true; avviso.textContent = "Un attimo…";
      SGNube.accedi(n, pw).then(function () { attendiProfilo(dopo); }).catch(function (e) { bEntra.disabled = false; avviso.textContent = SGNube.messaggioErrore(e); });
    } });
    s._piede.appendChild(bEntra);
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "➕ Non ho un profilo, crealo", onclick: function () { schermataCreaCloud(dopo); } }));
    mostra(s);
  }

  // dopo il login il profilo (Firestore) arriva un istante dopo: aspetta che ci sia
  function attendiProfilo(cb) {
    var n = 0;
    (function chk() {
      if ((window.SGNube && SGNube.profilo()) || n++ > 30) return cb();
      setTimeout(chk, 200);
    })();
  }

  function schermataCreaCloud(dopo) {
    var scelta = { emoji: FACCINE[0] };
    var s = schermata({ icona: "👤", titolo: "Crea profilo", sotto: "Nome, password e faccina", indietro: function () { schermataAccessoCloud(dopo); } });
    var nome = el("input", { class: "link-campo", type: "text", maxlength: "20", placeholder: "Come ti chiami?" });
    var pwd = el("input", { class: "link-campo", type: "password", maxlength: "40", placeholder: "Scegli una password (min 6)", style: "margin-top:8px" });
    s._contenuto.appendChild(nome); s._contenuto.appendChild(pwd);
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "Scegli la faccina" }));
    var griglia = el("div", { class: "faccine" });
    FACCINE.forEach(function (e) {
      griglia.appendChild(el("button", { class: "faccina" + (e === scelta.emoji ? " attiva" : ""), text: e, onclick: function () {
        scelta.emoji = e; [].forEach.call(griglia.children, function (c) { c.className = "faccina" + (c.textContent === e ? " attiva" : ""); });
      } }));
    });
    s._contenuto.appendChild(griglia);
    var avviso = el("div", { class: "link-avviso" });
    s._contenuto.appendChild(avviso);
    var bCrea = el("button", { class: "btn btn-primario", text: "Crea profilo ▶", onclick: function () {
      var n = (nome.value || "").trim(), pw = pwd.value || "";
      if (n.length < 2) { avviso.textContent = "Scrivi il tuo nome."; return; }
      if (pw.length < 6) { avviso.textContent = "La password deve avere almeno 6 caratteri."; return; }
      bCrea.disabled = true; avviso.textContent = "Creo il profilo…";
      SGNube.crea(n, pw, scelta.emoji).then(function () { dopo(); }).catch(function (e) { bCrea.disabled = false; avviso.textContent = SGNube.messaggioErrore(e); });
    } });
    s._piede.appendChild(bCrea);
    mostra(s);
  }

  // =========================================================
  //  LA SALA — il gruppo resta tra una partita e l'altra
  // =========================================================
  var gruppo = [];                 // [{nome, emoji}]
  var ultimaPartita = null;        // {gioco, impostazioni}

  function nomiGruppo() { return gruppo.map(function (p, i) { return (p.nome || "").trim() || ("Giocatore " + (i + 1)); }); }

  function schermataSala(g, opts) {
    var torn = !!(opts && opts.torneo);
    var min = g ? (g.giocatoriMin || 2) : 2;
    var max = g ? (g.giocatoriMax || 10) : 10;
    if (!gruppo.length) {
      var io = profiloAttivo();
      if (io) gruppo.push({ nome: io.nome, emoji: io.emoji });
    }
    var s = schermata({ icona: torn ? "🏆" : "🎉", titolo: torn ? "Torneo" : "La sala",
      sotto: torn ? "Chi partecipa al torneo" : (g ? ("Si gioca a " + g.nome) : "Chi partecipa"),
      indietro: schermataHome });

    var conta = el("p", { class: "modulo-nota" });
    var lista = el("div");
    var avanti = el("button", { class: "btn btn-primario", text: torn ? "Comincia il torneo ▶" : "Avanti ▶", onclick: function () {
      if (gruppo.length < (torn ? min : 1)) return;
      if (torn) return iniziaTorneo();
      if (g) schermataPreGioco(g); else schermataScegliGioco();
    }});

    function ridisegna() {
      svuota(lista);
      gruppo.forEach(function (p, i) {
        lista.appendChild(el("div", { class: "sala-riga" }, [
          el("button", { class: "av", text: p.emoji || "🙂", "aria-label": "Cambia faccina",
            onclick: function () { p.emoji = FACCINE[(FACCINE.indexOf(p.emoji) + 1) % FACCINE.length]; ridisegna(); } }),
          el("input", { type: "text", value: p.nome, maxlength: "16", placeholder: "Giocatore " + (i + 1),
            oninput: function (ev) { p.nome = ev.target.value; } }),
          el("button", { class: "togli", text: "×", "aria-label": "Togli", onclick: function () { gruppo.splice(i, 1); ridisegna(); } })
        ]));
      });
      conta.textContent = gruppo.length + (gruppo.length === 1 ? " partecipante" : " partecipanti")
        + (gruppo.length < min ? " · ne servono almeno " + min : "");
      if (gruppo.length < (torn ? min : 1)) avanti.disabled = true; else avanti.removeAttribute("disabled");
    }

    s._contenuto.appendChild(conta);
    s._contenuto.appendChild(lista);
    s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", html: "＋ Aggiungi giocatore",
      onclick: function () { if (gruppo.length < max) { gruppo.push({ nome: "", emoji: FACCINE[gruppo.length % FACCINE.length] }); ridisegna(); } } }));

    // aggiunta rapida dai profili salvati sul telefono
    var salvati = profili().filter(function (p) {
      return !gruppo.some(function (x) { return (x.nome || "").toLowerCase() === p.nome.toLowerCase(); });
    });
    if (salvati.length) {
      s._contenuto.appendChild(el("div", { class: "etichetta", text: "Aggiungi al volo" }));
      var rapidi = el("div", { class: "home-azioni", style: "justify-content:flex-start" });
      salvati.forEach(function (p) {
        rapidi.appendChild(el("button", { class: "azione", text: p.emoji + " " + p.nome, onclick: function () {
          if (gruppo.length < max) { gruppo.push({ nome: p.nome, emoji: p.emoji }); schermataSala(g, opts); }
        }}));
      });
      s._contenuto.appendChild(rapidi);
    }

    ridisegna();
    s._piede.appendChild(avanti);
    mostra(s);
  }

  function schermataPreGioco(g, opts) {
    var torn = !!(opts && opts.torneo);
    var inSala = !!(opts && opts.sala);
    var s = schermata({ icona: g.icona, titolo: g.nome,
      sotto: torn ? ("Torneo · " + nomeDifficolta(pesoGioco(g))) : (inSala ? "Sala · impostazioni" : "Impostazioni della partita"),
      indietro: function () { if (torn) schermataTorneoHub(); else if (inSala) salaScegliGioco(); else schermataSala(g); } });
    if (inSala) {
      s._contenuto.appendChild(el("div", { class: "sala-sommario" }, [
        el("span", { class: "chi", text: "👥 Sala · " + (sala ? sala.membri.length : 1) + " in gioco" }) ]));
    } else {
      s._contenuto.appendChild(el(torn ? "div" : "button", { class: "sala-sommario",
        onclick: torn ? null : function () { schermataSala(g); } }, [
        el("span", { class: "chi", text: "👥 " + nomiGruppo().join(", ") }),
        torn ? null : el("span", { class: "modifica", text: "modifica" })
      ]));
    }
    var impostazioni = {};
    if (typeof g.impostazioni === "function") {
      var box = el("div");
      g.impostazioni(box, impostazioni, { el: el, torneo: torn, sala: inSala });
      s._contenuto.appendChild(box);
    }
    if (inSala) s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "In una sala si gioca sempre online: appena cominci, gli altri entrano da soli." }));
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "Come si gioca",
      onclick: function () { schermataRegole(g, function () { schermataPreGioco(g, opts); }); } }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: inSala ? "Comincia per tutti ▶" : "Comincia ▶", onclick: function () {
      if (inSala) { impostazioni.modo = "online"; return salaLancia(g, impostazioni); }
      // online: l'host apre la stanza da solo, gli altri entrano via rete → niente vincolo di minimo qui
      if (!(impostazioni && impostazioni.modo === "online") && gruppo.length < (g.giocatoriMin || 2)) return schermataSala(g, opts);
      ultimaPartita = { gioco: g, impostazioni: impostazioni };
      avviaPartita(g, nomiGruppo(), impostazioni, opts);
    }}));
    mostra(s);
  }

  function schermataScegliGioco() {
    var s = schermata({ icona: "🎮", titolo: "Cambia gioco", sotto: "Stessi partecipanti",
      indietro: function () { schermataSala(null); } });
    var griglia = el("div", { class: "griglia-giochi" });
    giochi.forEach(function (g) { griglia.appendChild(tesseraGioco(g, function () { schermataPreGioco(g); })); });
    s._contenuto.appendChild(griglia);
    mostra(s);
  }

  // =========================================================
  //  SALA ONLINE — un gruppo fisso che passa da un gioco all'altro.
  //  L'host crea la sala; gli amici entrano una volta col codice/link.
  //  L'host sceglie i giochi: partono per tutti (gli altri entrano in
  //  automatico nella lobby online del gioco) e a fine partita tutti
  //  tornano nella stessa sala. Solo l'host decide.
  // =========================================================
  var sala = null;   // host:  { rete, codice, pronta, membri:[{id,nome,emoji}], gioco, stanza, inGioco }
  var salaG = null;  // ospite: { rete, codice, myId, nome, emoji, membri, inGioco, _msg }

  function salaSenzaRete(riprova) {
    var s = schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: schermataHome });
    s._contenuto.appendChild(el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La Sala online funziona quando il gioco è aperto dal sito pubblicato. Da un file locale non è disponibile." }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Ok", onclick: schermataHome }));
    mostra(s);
  }

  // ---------- HOST ----------
  function creaSala() {
    if (!(window.SGNet && SGNet.disponibile())) return salaSenzaRete(creaSala);
    if (!profiloAttivo()) return schermataAccesso(creaSala);
    var io = profiloAttivo();
    sala = { rete: null, codice: "…", pronta: false, membri: [{ id: "host", nome: io.nome, emoji: io.emoji }], gioco: null, stanza: null, inGioco: false };
    function bcast() { if (sala && sala.rete) sala.rete.invia({ t: "sala", codice: sala.codice, membri: sala.membri, gioco: sala.gioco, stanza: sala.stanza }); }
    function agg() { bcast(); if (sala && !sala.inGioco) disegnaSalaHost(); }
    sala._bcast = bcast;
    sala.rete = SGNet.ospita("__sala", {
      onCodice: function (c) { sala.codice = c; agg(); },
      onConnesso: function () { sala.pronta = true; agg(); },
      onAddio: function (id) { sala.membri = sala.membri.filter(function (m) { return m.id !== id; }); agg(); },
      onMsg: function (id, m) {
        if (!m || m.t !== "join") return;
        if (!sala.membri.some(function (x) { return x.id === id; }))
          sala.membri.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), emoji: m.emoji || "🙂" });
        agg();
      },
      onErrore: function () { salaSenzaRete(creaSala); }
    });
    disegnaSalaHost();
  }

  function chiudiSala() { try { if (sala && sala.rete) sala.rete.chiudi(); } catch (e) {} sala = null; }

  function disegnaSalaHost() {
    if (!sala) return;
    var s = schermata({ icona: "👥", titolo: "La sala", sotto: "Invita gli amici, poi scegli un gioco",
      indietro: function () { if (window.confirm("Chiudere la sala per tutti?")) { chiudiSala(); schermataHome(); } } });
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "Codice della sala" }));
    s._contenuto.appendChild(el("div", { class: "codice-stanza", text: (sala.codice || "…").toUpperCase() }));
    if (sala.codice && sala.codice !== "…") {
      var link = SG.creaLink({ sala: sala.codice });
      var campo = el("input", { class: "link-campo", type: "text", readonly: "readonly", value: link });
      s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", html: "🔗 Copia il link da mandare",
        onclick: function () { campo.focus(); campo.select(); try { navigator.clipboard.writeText(link); } catch (e) {} } }));
      s._contenuto.appendChild(campo);
    }
    s._contenuto.appendChild(el("div", { style: "margin:8px 0 2px;font-size:.9rem;font-weight:700;color:" + (sala.pronta ? "#69db7c" : "#ffd43b"),
      text: sala.pronta ? "🟢 Sala pronta — manda il codice o il link" : "🟡 Sto aprendo la sala…" }));
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "Chi c'è (" + sala.membri.length + ")" }));
    var lista = el("div");
    sala.membri.forEach(function (m) { lista.appendChild(el("div", { class: "lobby-giocatore", text: (m.emoji || "🙂") + " " + m.nome + (m.id === "host" ? " (tu)" : "") })); });
    s._contenuto.appendChild(lista);
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🎮 Scegli un gioco", onclick: salaScegliGioco }));
    s._piede.appendChild(el("p", { class: "modulo-nota", text: "Scegli un gioco quando vuoi: parte per tutti. A fine partita si torna qui." }));
    mostra(s);
  }

  function salaScegliGioco() {
    var s = schermata({ icona: "🎮", titolo: "Scegli un gioco", sotto: "Parte per tutta la sala", indietro: disegnaSalaHost });
    var griglia = el("div", { class: "griglia-giochi" });
    giochi.forEach(function (g) { if (giocoOnline(g)) griglia.appendChild(tesseraGioco(g, function () { schermataPreGioco(g, { sala: true }); })); });
    s._contenuto.appendChild(griglia);
    mostra(s);
  }

  function salaLancia(g, impostazioni) {
    if (!sala) return schermataHome();
    var C = SGNet.nuovoCodice();
    SGNet._forza = C;                         // il gioco userà QUESTO codice stanza
    sala.gioco = g.id; sala.stanza = C; sala.inGioco = true;
    sala._bcast();                            // dice agli altri quale gioco aprire e con che codice
    var ctx = {
      esci: function () { sala.gioco = null; sala.stanza = null; sala.inGioco = false; sala._bcast(); disegnaSalaHost(); },
      fine: function (g2, classifica) { salaFine(g2, classifica, ctx); }
    };
    var vecchio = linkParams; linkParams = {};      // l'host apre da host, non da ospite
    avviaPartita(g, [sala.membri[0].nome], impostazioni, null, ctx);
    linkParams = vecchio;
  }

  function salaFine(g, classifica, ctx) {
    var s = schermata({ icona: "🏆", titolo: "Fine partita", sotto: g.nome });
    var ol = el("ol", { class: "classifica" }), med = ["🥇", "🥈", "🥉"];
    (classifica || []).forEach(function (r, i) {
      ol.appendChild(el("li", { class: i === 0 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: med[i] || (i + 1) + "°" }),
        el("span", { class: "nome", text: r.nome }),
        r.punti != null ? el("span", { class: "punti", text: r.punti }) : null ]));
    });
    s._contenuto.appendChild(ol);
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "👥 Torna alla sala", onclick: ctx.esci }));
    mostra(s);
  }

  // ---------- OSPITE ----------
  function salaOspite(codice) {
    if (!(window.SGNet && SGNet.disponibile())) return salaSenzaRete(function () { salaOspite(codice); });
    if (!profiloAttivo()) return schermataAccesso(function () { salaOspite(codice); });
    var io = profiloAttivo();
    salaG = { rete: null, codice: String(codice).toUpperCase(), myId: null, nome: io.nome, emoji: io.emoji, membri: [], inGioco: null, _msg: null };
    attendiSala();
    salaG.rete = SGNet.entra(salaG.codice, {
      onAperto: function (id) { salaG.myId = id; salaG.rete.invia({ t: "join", nome: salaG.nome, emoji: salaG.emoji });
        setTimeout(function () { if (salaG && !salaG.membri.length && salaG._msg) salaG._msg.textContent = "Non trovo la sala: controlla il codice o attendi l'host…"; }, 8000); },
      onMsg: function (m) {
        if (!salaG || !m || m.t !== "sala") return;
        salaG.membri = m.membri || [];
        if (m.gioco && m.stanza) {
          if (salaG.inGioco !== m.stanza) { salaG.inGioco = m.stanza; salaLanciaOspite(m.gioco, m.stanza); }
        } else {
          if (salaG.inGioco !== null) salaG.inGioco = null;
          disegnaSalaOspite();
        }
      },
      onChiuso: function () { chiudiSalaOspite(); errore(schermataHome, "La sala è stata chiusa dall'host."); },
      onErrore: function () { chiudiSalaOspite(); errore(schermataHome, "Problema di collegamento con la sala. Riprova."); }
    });
  }

  function chiudiSalaOspite() { try { if (salaG && salaG.rete) salaG.rete.chiudi(); } catch (e) {} salaG = null; }

  function attendiSala() {
    var s = schermata({ icona: "👥", titolo: "Entro nella sala…", sotto: "Codice " + salaG.codice,
      indietro: function () { chiudiSalaOspite(); schermataHome(); } });
    salaG._msg = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" });
    s._contenuto.appendChild(salaG._msg);
    mostra(s);
  }

  function disegnaSalaOspite() {
    if (!salaG) return;
    var s = schermata({ icona: "👥", titolo: "La sala", sotto: "Aspetta che l'host scelga un gioco",
      indietro: function () { chiudiSalaOspite(); schermataHome(); } });
    s._contenuto.appendChild(el("div", { style: "text-align:center;font-weight:700;color:#69db7c;margin-bottom:6px", text: "✅ Sei nella sala " + salaG.codice }));
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "Chi c'è (" + salaG.membri.length + ")" }));
    var lista = el("div");
    salaG.membri.forEach(function (m) { lista.appendChild(el("div", { class: "lobby-giocatore", text: (m.emoji || "🙂") + " " + m.nome + (m.id === salaG.myId ? " (tu)" : "") })); });
    s._contenuto.appendChild(lista);
    salaG._msg = el("p", { class: "modulo-nota", text: "Quando l'host sceglie un gioco, parte da solo sul tuo telefono." });
    s._contenuto.appendChild(salaG._msg);
    mostra(s);
  }

  function salaLanciaOspite(gid, code) {
    var g = giochi.filter(function (x) { return x.id === gid; })[0];
    if (!g) { disegnaSalaOspite(); return; }
    var vecchio = linkParams;
    linkParams = { gioco: gid, stanza: code };   // il gioco lo legge subito (t.linkParams)
    var ctx = {
      esci: function () { if (salaG) salaG.inGioco = null; disegnaSalaOspite(); },
      fine: function () { if (salaG) salaG.inGioco = null; disegnaSalaOspite(); }
    };
    avviaPartita(g, [], {}, null, ctx);
    linkParams = vecchio;
  }

  function errore(dopo, txt) {
    var s = schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: dopo }));
    mostra(s);
  }

  // porta d'ingresso a un gioco dalla home: profilo → sala → impostazioni
  function apriGioco(g) {
    if (!profiloAttivo()) return schermataAccesso(function () { schermataSala(g); });
    if (gruppo.length >= (g.giocatoriMin || 2)) return schermataPreGioco(g);
    schermataSala(g);
  }

  // ---- Regole ----
  function schermataRegole(g, indietro) {
    var s = schermata({ icona: g.icona, titolo: "Come si gioca", sotto: g.nome, indietro: indietro });
    var righe = g.regole || ["(regole non ancora scritte)"];
    var box = el("div");
    righe.forEach(function (r) {
      box.appendChild(el("p", { class: "", html: r, style: "font-size:1.05rem; line-height:1.5; margin:0 0 14px" }));
    });
    s._contenuto.appendChild(box);
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Ho capito", onclick: indietro }));
    mostra(s);
  }

  // ---- Passaggio del telefono (interstiziale tra un turno e l'altro) ----
  function passaIlTelefono(nomeProssimo, quando) {
    var s = schermata({});
    var box = el("div", { class: "passa" }, [
      el("div", { class: "emoji", text: "🤝" }),
      el("p", { class: "tenue", text: "Passa il telefono a" }),
      el("div", { class: "grande", text: nomeProssimo })
    ]);
    s._contenuto.appendChild(box);
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Sono " + nomeProssimo + " ▶", onclick: quando }));
    mostra(s);
  }

  // ---- Tabellone finale (uguale per tutti i giochi) ----
  // classifica: array ordinato dal 1° all'ultimo, ognuno { nome, punti (facolt.) }
  function schermataFine(g, classifica, giocatori, impostazioni) {
    var s = schermata({ icona: "🏆", titolo: "Fine partita", sotto: g.nome });
    var ol = el("ol", { class: "classifica" });
    var medaglie = ["🥇", "🥈", "🥉"];
    classifica.forEach(function (r, i) {
      ol.appendChild(el("li", { class: i === 0 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: medaglie[i] || (i + 1) + "°" }),
        el("span", { class: "nome", text: r.nome }),
        r.punti != null ? el("span", { class: "punti", text: r.punti }) : null
      ]));
    });
    s._contenuto.appendChild(ol);

    // Dalla fine partita si resta nella stessa sala: rigioca, cambia gioco o modifica il gruppo
    s._piede.appendChild(el("button", {
      class: "btn btn-primario", text: "↻ Rigioca",
      onclick: function () { avviaPartita(g, giocatori, impostazioni); }
    }));
    var azioni = el("div", { class: "home-azioni" });
    azioni.appendChild(el("button", { class: "azione", text: "🎮 Cambia gioco", onclick: schermataScegliGioco }));
    azioni.appendChild(el("button", { class: "azione", text: "👥 La sala", onclick: function () { schermataSala(g); } }));
    azioni.appendChild(el("button", { class: "azione", text: "🏠 Home", onclick: schermataHome }));
    s._piede.appendChild(azioni);
    mostra(s);
  }

  // =========================================================
  //  TORNEO — più partite di fila con gli stessi giocatori.
  //  Ogni gioco dichiara una "difficolta" (1 facile, 2 media,
  //  3 difficile): più è difficile, più vale vincerlo. A ogni
  //  partita si assegnano punti dal 1° al 10° posto.
  // =========================================================
  var torneo = null; // { giocatori:[nomi], emoji:{}, punti:{nome:n}, storia:[], n }
  var CURVA_TORNEO = [100, 78, 62, 50, 40, 32, 25, 19, 14, 10]; // % del 1° posto, per posizione 1..10

  function pesoGioco(g) { var d = g && g.difficolta; return (d === 1 || d === 3) ? d : 2; }
  function nomeDifficolta(d) { return d === 3 ? "Difficile" : d === 1 ? "Facile" : "Media"; }

  function puntiDaClassifica(g, classifica) {
    var peso = pesoGioco(g);
    return classifica.map(function (r, i) {
      var perc = i < CURVA_TORNEO.length ? CURVA_TORNEO[i] : 6;
      return { nome: r.nome, punti: Math.round(perc * peso) };
    });
  }

  function classificaTorneo() {
    return torneo.giocatori.map(function (n) { return { nome: n, punti: torneo.punti[n] || 0 }; })
      .sort(function (a, b) { return b.punti - a.punti; });
  }

  function podio(cl, evidenziaPrimo) {
    var ol = el("ol", { class: "classifica" });
    var medaglie = ["🥇", "🥈", "🥉"];
    cl.forEach(function (r, i) {
      ol.appendChild(el("li", { class: (i === 0 && evidenziaPrimo) ? "vincitore" : "" }, [
        el("span", { class: "pos", text: medaglie[i] || (i + 1) + "°" }),
        el("span", { class: "nome", text: (torneo && torneo.emoji[r.nome] ? torneo.emoji[r.nome] + " " : "") + r.nome }),
        el("span", { class: "punti", text: r.punti })
      ]));
    });
    return ol;
  }

  function apriTorneo() {
    if (torneo) return schermataTorneoHub();
    if (!profiloAttivo()) return schermataAccesso(function () { schermataSala(null, { torneo: true }); });
    schermataSala(null, { torneo: true });
  }

  function iniziaTorneo() {
    var nomi = nomiGruppo();
    torneo = { giocatori: nomi, emoji: {}, punti: {}, storia: [], n: 0 };
    gruppo.forEach(function (p, i) { torneo.emoji[nomi[i]] = p.emoji || "🙂"; });
    nomi.forEach(function (n) { torneo.punti[n] = 0; });
    schermataTorneoHub();
  }

  function schermataTorneoHub() {
    var s = schermata({ icona: "🏆", titolo: "Torneo", indietro: schermataHome,
      sotto: torneo.n === 0 ? "Nessuna partita ancora" : (torneo.n + (torneo.n === 1 ? " partita giocata" : " partite giocate")) });
    s._contenuto.appendChild(podio(classificaTorneo(), torneo.n > 0));
    s._piede.appendChild(el("button", { class: "btn btn-primario",
      text: torneo.n === 0 ? "▶ Gioca la prima partita" : "▶ Gioca un'altra partita", onclick: torneoScegliGioco }));
    var azioni = el("div", { class: "home-azioni" });
    if (torneo.n > 0) azioni.appendChild(el("button", { class: "azione", text: "🏁 Chiudi e premia", onclick: schermataTorneoFine }));
    azioni.appendChild(el("button", { class: "azione", text: "🏠 Home", onclick: schermataHome }));
    s._piede.appendChild(azioni);
    mostra(s);
  }

  function torneoScegliGioco() {
    var s = schermata({ icona: "🎮", titolo: "Quale gioco?", sotto: "Più è difficile, più punti vale",
      indietro: schermataTorneoHub });
    var griglia = el("div", { class: "griglia-giochi" });
    giochi.forEach(function (g) { griglia.appendChild(tesseraGioco(g, function () { schermataPreGioco(g, { torneo: true }); })); });
    s._contenuto.appendChild(griglia);
    mostra(s);
  }

  function torneoRisultato(g, classifica) {
    var assegnati = puntiDaClassifica(g, classifica);
    assegnati.forEach(function (r) { torneo.punti[r.nome] = (torneo.punti[r.nome] || 0) + r.punti; });
    torneo.n += 1;
    torneo.storia.push({ gioco: g.nome, assegnati: assegnati });

    var s = schermata({ icona: g.icona, titolo: "Punti di questa partita", sotto: g.nome + " · " + nomeDifficolta(pesoGioco(g)) });
    var ol = el("ol", { class: "classifica" });
    var medaglie = ["🥇", "🥈", "🥉"];
    assegnati.forEach(function (r, i) {
      ol.appendChild(el("li", { class: i === 0 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: medaglie[i] || (i + 1) + "°" }),
        el("span", { class: "nome", text: r.nome }),
        el("span", { class: "punti", text: "+" + r.punti })
      ]));
    });
    s._contenuto.appendChild(ol);
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏆 Classifica del torneo", onclick: schermataTorneoHub }));
    mostra(s);
  }

  function schermataTorneoFine() {
    var s = schermata({ icona: "🏆", titolo: "Torneo finito!", sotto: torneo.n + (torneo.n === 1 ? " partita" : " partite") });
    s._contenuto.appendChild(podio(classificaTorneo(), true));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Nuovo torneo (stessi giocatori)",
      onclick: function () { torneo.punti = {}; torneo.storia = []; torneo.n = 0; torneo.giocatori.forEach(function (n) { torneo.punti[n] = 0; }); schermataTorneoHub(); } }));
    var azioni = el("div", { class: "home-azioni" });
    azioni.appendChild(el("button", { class: "azione", text: "🏠 Home", onclick: function () { torneo = null; schermataHome(); } }));
    s._piede.appendChild(azioni);
    mostra(s);
  }

  // =========================================================
  //  GIRO DI PARTITA
  //  Consegna al gioco un "tavolo" con tutto ciò che gli serve,
  //  senza fargli sapere come sono fatte le schermate comuni.
  // =========================================================
  function avviaPartita(g, giocatori, impostazioni, opts, salaCtx) {
    var contenitore = el("div");
    var schermo = el("div");
    schermo.appendChild(contenitore);

    var tavolo = {
      giocatori: giocatori.slice(),
      impostazioni: impostazioni || {},
      linkParams: linkParams,
      radice: contenitore,

      // aiuti riusabili (così i giochi non reinventano le stesse cose)
      el: el,
      svuota: svuota,
      mischia: mischia,
      schermata: schermata,
      mostra: function (s) { mostra(s); },

      // passaggio del telefono, poi esegue "quando"
      passaA: function (nome, quando) { passaIlTelefono(nome, quando); },

      // il gioco chiama questa quando è finito
      fine: function (classifica) {
        if (salaCtx) return salaCtx.fine(g, classifica, giocatori, impostazioni);
        if (opts && opts.torneo && torneo) return torneoRisultato(g, classifica);
        schermataFine(g, classifica, giocatori, impostazioni);
      },

      // uscite comuni
      esci: salaCtx ? salaCtx.esci : schermataHome
    };

    g.avvia(tavolo);
  }

  // =========================================================
  //  API PUBBLICA
  // =========================================================
  // motore audio condiviso: un solo AudioContext per tutta l'app, creato/ripreso
  // al primo tocco (i browser bloccano l'audio finché non c'è un gesto dell'utente).
  var _ac = null;
  function audioCtx() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!_ac) _ac = new AC();
      if (_ac.state === "suspended") { try { _ac.resume(); } catch (e) {} }
      return _ac;
    } catch (e) { return null; }
  }

  // Piccola vibrazione (haptic) quando SELEZIONI un tasto, per rendere i giochi
  // più tattili. Si usa "click" e non "pointerdown": così se appoggi il dito su un
  // tasto solo per scorrere la pagina, non vibra (il click arriva solo col tocco vero).
  // Funziona su Android; su iPhone la Vibration API non esiste e non fa nulla.
  (function installaVibrazione() {
    if (!navigator || typeof navigator.vibrate !== "function") return;
    var ultimo = 0;
    document.addEventListener("click", function (e) {
      var t = e.target && e.target.closest && e.target.closest("button, .btn, [role=button]");
      if (!t || t.disabled) return;
      var ora = Date.now();
      if (ora - ultimo < 40) return;   // niente vibrazioni doppie ravvicinate
      ultimo = ora;
      try { navigator.vibrate(10); } catch (err) {}
    }, true);
  })();

  window.SG = {
    registra: function (gioco) { giochi.push(gioco); },
    audioCtx: audioCtx,
    avviaApp: function () {
      app = document.getElementById("app");
      linkParams = leggiParametriLink();
      function parti() {
        if (linkParams.sala) return salaOspite(linkParams.sala);   // link di una Sala online
        var g = linkParams.gioco && giochi.filter(function (x) { return x.id === linkParams.gioco; })[0];
        // Con un codice stanza si entra come OSPITE; altrimenti si apre la preparazione
        if (g && linkParams.stanza) avviaPartita(g, [], {});
        else if (g) apriGioco(g);
        else schermataHome();
      }
      // col cloud, aspetta che Firebase ripristini la sessione (login automatico)
      if (window.SGNube && SGNube.disponibile() && !SGNube.pronto()) {
        schermataCaricamento();
        var fatto = false;
        SGNube.onCambio(function () { if (!fatto && SGNube.pronto()) { fatto = true; parti(); } });
        setTimeout(function () { if (!fatto) { fatto = true; parti(); } }, 6000);   // rete lenta: parti comunque
      } else parti();
    },
    // la sala: i giochi possono rimandarci dalla loro schermata finale
    cambiaGioco: function () { schermataScegliGioco(); },
    sala: function () { schermataSala(null); },
    // impostazioni arrivate da un link (le legge il gioco per i valori di partenza)
    parametriLink: function () { return linkParams; },
    // costruisce un link condivisibile con le impostazioni scelte dall'host
    creaLink: function (params) {
      var base = location.origin + location.pathname;
      var pezzi = [];
      for (var k in params) {
        var v = params[k];
        if (v == null || v === "") continue;
        if (Array.isArray(v)) v = v.join(",");
        // chiavi e valori qui sono già sicuri (lettere, numeri, virgole): niente codifica illeggibile
        pezzi.push(k + "=" + v);
      }
      return base + (pezzi.length ? "#" + pezzi.join("&") : "");
    },
    // esposti perché comodi anche fuori
    _util: { el: el, svuota: svuota, mischia: mischia }
  };
})();

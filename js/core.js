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
    scopa: "carte", scopa2v2: "carte", scopone: "carte",
    tris: "sfida", drop4: "sfida", hockey: "sfida", navale: "sfida",
    asta: "festa", impostore: "festa", sipero: "festa",
    scalinata: "mini", horto: "mini", pendolo: "mini",
    timeline: "parole", nomicose: "parole", patata: "parole"
  };
  var catAttiva = "tutti";
  function catDi(g) { return CAT_GIOCO[g.id] || null; }
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
    return el("button", { class: "tessera", onclick: onclick }, [
      el("span", { class: "icona", text: g.icona || "🎲" }),
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
      io ? [el("span", { text: io.emoji }), el("span", { text: io.nome }), el("span", { class: "modifica", text: "cambia" })]
         : [el("span", { text: "👤" }), el("span", { text: "Crea il tuo profilo" })]);
    var rigaProfilo = el("div", { class: "home-profilo" }, [profiloChip]);
    if ((window.SG_NOVITA || []).length) {
      var bNov = el("button", { class: "home-novita", onclick: schermataNovita });
      bNov.appendChild(el("span", { text: "🆕 Novità" }));
      if (!novitaTutteViste()) bNov.appendChild(el("span", { class: "pallino" }));
      rigaProfilo.appendChild(bNov);
    }
    s._contenuto.appendChild(el("div", { class: "home-hero" }, [
      el("div", { class: "home-logo", html: '<svg viewBox="0 0 150 130" width="112" height="97" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="sgFul" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".45" stop-color="#ffd43b"/><stop offset="1" stop-color="#ffb300"/></linearGradient><filter id="sgFulGlow" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#4dabf7" flood-opacity=".5"/><feDropShadow dx="0" dy="0" stdDeviation="1.6" flood-color="#a5d8ff" flood-opacity=".75"/></filter></defs><g fill="url(#sgFul)" stroke="#fff7d6" stroke-width=".7" stroke-linejoin="round" filter="url(#sgFulGlow)"><path d="M7 2v11h3v9l7-12h-4l4-8z" transform="translate(44,50) rotate(32) scale(2.5) translate(-12,-12)"/><path d="M7 2v11h3v9l7-12h-4l4-8z" transform="translate(106,50) rotate(-32) scale(2.5) translate(-12,-12)"/><path d="M7 2v11h3v9l7-12h-4l4-8z" transform="translate(75,62) scale(3.8) translate(-12,-12)"/></g></svg>' }),
      el("h1", { class: "home-titolo", text: "SPeeD GAME" }),
      el("p", { class: "home-sotto", text: "Scegli un gioco e passa il telefono" }),
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
    var id = leggiL(K_ATTIVO, null);
    return profili().filter(function (p) { return p.id === id; })[0] || null;
  }
  function salvaProfilo(p) {
    var lista = profili().filter(function (x) { return x.id !== p.id; });
    lista.unshift(p);
    if (lista.length > 12) lista = lista.slice(0, 12);
    scriviL(K_PROFILI, lista); scriviL(K_ATTIVO, p.id);
  }

  function schermataAccesso(dopo) {
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
    var s = schermata({ icona: g.icona, titolo: g.nome, sotto: torn ? ("Torneo · " + nomeDifficolta(pesoGioco(g))) : "Impostazioni della partita",
      indietro: function () { if (torn) schermataTorneoHub(); else schermataSala(g); } });
    s._contenuto.appendChild(el(torn ? "div" : "button", { class: "sala-sommario",
      onclick: torn ? null : function () { schermataSala(g); } }, [
      el("span", { class: "chi", text: "👥 " + nomiGruppo().join(", ") }),
      torn ? null : el("span", { class: "modifica", text: "modifica" })
    ]));
    var impostazioni = {};
    if (typeof g.impostazioni === "function") {
      var box = el("div");
      g.impostazioni(box, impostazioni, { el: el, torneo: torn });
      s._contenuto.appendChild(box);
    }
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "Come si gioca",
      onclick: function () { schermataRegole(g, function () { schermataPreGioco(g, opts); }); } }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Comincia ▶", onclick: function () {
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
  function avviaPartita(g, giocatori, impostazioni, opts) {
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
        if (opts && opts.torneo && torneo) return torneoRisultato(g, classifica);
        schermataFine(g, classifica, giocatori, impostazioni);
      },

      // uscite comuni
      esci: schermataHome
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

  window.SG = {
    registra: function (gioco) { giochi.push(gioco); },
    audioCtx: audioCtx,
    avviaApp: function () {
      app = document.getElementById("app");
      linkParams = leggiParametriLink();
      var g = linkParams.gioco && giochi.filter(function (x) { return x.id === linkParams.gioco; })[0];
      // Con un codice stanza si entra come OSPITE; altrimenti si apre la preparazione
      if (g && linkParams.stanza) avviaPartita(g, [], {});
      else if (g) apriGioco(g);
      else schermataHome();
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

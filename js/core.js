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
      return pc ? { id: pc.uid, nome: pc.nome, emoji: pc.emoji, cloud: true } : null;
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

  // ---- profili in cloud (Firebase): nome + password, ti seguono ovunque ----
  function schermataAccessoCloud(dopo) {
    var p = SGNube.profilo();
    if (p) {   // già dentro: mostra il profilo, le statistiche e il tasto esci
      var sp = schermata({ icona: p.emoji || "👤", titolo: p.nome, sotto: "Il tuo profilo", indietro: schermataHome });
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
      SGNube.accedi(n, pw).then(function () { dopo(); }).catch(function (e) { bEntra.disabled = false; avviso.textContent = SGNube.messaggioErrore(e); });
    } });
    s._piede.appendChild(bEntra);
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "➕ Non ho un profilo, crealo", onclick: function () { schermataCreaCloud(dopo); } }));
    mostra(s);
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

  // Piccola vibrazione (haptic) a ogni tocco di un tasto, per rendere i giochi
  // più tattili e interattivi. Un solo "tick" leggero, con un freno anti-raffica.
  // Funziona su Android; su iPhone la Vibration API non esiste e non fa nulla.
  (function installaVibrazione() {
    if (!navigator || typeof navigator.vibrate !== "function") return;
    var ultimo = 0;
    document.addEventListener("pointerdown", function (e) {
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

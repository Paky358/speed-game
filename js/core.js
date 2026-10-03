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

  // Altezza VERA dello schermo: il browser a volte (es. dopo un "ricarica" con l'app installata)
  // crede che lo schermo sia più alto di quello che si vede, e i tasti in fondo finiscono fuori.
  // La misuro io e la rimisuro appena cambia qualcosa.
  (function altezzaVera() {
    function misura() {
      var h = Math.round((window.visualViewport ? window.visualViewport.height : window.innerHeight) || window.innerHeight || 0);
      if (h > 0) document.documentElement.style.setProperty("--alt", h + "px");   // con la pagina nascosta vale 0: non lo segno (resta l'altezza di prima)
    }
    misura();
    window.addEventListener("resize", misura);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) misura(); });
    window.addEventListener("orientationchange", function () { setTimeout(misura, 250); });
    window.addEventListener("pageshow", misura);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", misura);
    [100, 400, 1000].forEach(function (ms) { setTimeout(misura, ms); });   // dopo il caricamento le barre si assestano
  })();

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
    scopa: "carte", scopa2v2: "carte", scopone: "carte", blackjack: "carte", poker: "carte", ruota: "parole", ordine: "parole",
    tris: "sfida", drop4: "sfida", hockey: "sfida", navale: "sfida",
    asta: "festa", impostore: "festa", sipero: "festa", scarabocchio: "festa",
    scalinata: "mini", horto: "mini", pendolo: "mini",
    timeline: "parole", nomicose: "parole", patata: "parole", taboo: "parole"
  };
  var catAttiva = "tutti";
  function catDi(g) { return CAT_GIOCO[g.id] || null; }
  // Giochi che hanno la modalità "ognuno dal suo telefono" (usabili nella Sala online).
  var GIOCHI_ONLINE = { asta: 1, blackjack: 1, poker: 1, ruota: 1, ordine: 1, drop4: 1, horto: 1, navale: 1, nomicose: 1, patata: 1, pendolo: 1, scalinata: 1, scopa: 1, scopa2v2: 1, sipero: 1, timeline: 1, tris: 1, scarabocchio: 1, taboo: 1 };
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
  // finestra di conferma al centro dello schermo; il tasto "sì" si attiva
  // dopo un attimo, così i tocchi ripetuti non confermano per sbaglio
  function chiediConferma(domanda, nota, siTesto, siFn) {
    if (document.querySelector(".conferma-sfondo")) return;   // già aperta
    var chiudi = function () { if (sfondo.parentNode) sfondo.parentNode.removeChild(sfondo); };
    var si = el("button", { class: "btn btn-rosso", text: siTesto || "Sì", disabled: "disabled",
      onclick: function () { chiudi(); siFn(); } });
    var sfondo = el("div", { class: "conferma-sfondo", onclick: function (e) { if (e.target === sfondo) chiudi(); } }, [
      el("div", { class: "conferma-box", role: "dialog" }, [
        el("div", { class: "conferma-domanda", text: domanda }),
        nota ? el("div", { class: "conferma-nota", text: nota }) : null,
        el("div", { class: "conferma-tasti" }, [
          el("button", { class: "btn btn-primario", text: "Resta", onclick: chiudi }),
          si
        ])
      ])
    ]);
    document.body.appendChild(sfondo);
    setTimeout(function () { si.removeAttribute("disabled"); }, 700);
  }
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
  // ---- rientrare in una partita da ospite: se la pagina si ricarica o l'app si riapre, l'ultima stanza
  //      resta ricordata per un po' e in home compare "🔁 Rientra nella partita" (si torna la stessa persona: vedi SGNet.entra) ----
  var DURATA_RIENTRO = 3 * 3600 * 1000;
  function ricordaStanza(o) { try { o.t = Date.now(); localStorage.setItem("sg-ultima-stanza", JSON.stringify(o)); } catch (e) {} }
  function dimenticaStanza() { try { localStorage.removeItem("sg-ultima-stanza"); } catch (e) {} }
  function stanzaRecente() {
    try {
      var o = JSON.parse(localStorage.getItem("sg-ultima-stanza") || "null");
      if (o && Date.now() - o.t < DURATA_RIENTRO && (o.sala || (o.gioco && o.stanza))) return o;
    } catch (e) {}
    return null;
  }
  function rientraStanza(o) {
    location.hash = o.sala ? "sala=" + encodeURIComponent(o.sala) : "gioco=" + o.gioco + "&stanza=" + encodeURIComponent(o.stanza);
    location.reload();
  }

  // ---- schermo sempre acceso nelle partite online e nella Sala: se il telefono si blocca, il collegamento si ferma ----
  var schermoLock = null, schermoVoluto = false;
  function tieniAcceso(si) {
    schermoVoluto = !!si;
    if (!navigator.wakeLock) return;
    if (si && !schermoLock) navigator.wakeLock.request("screen").then(function (x) {
      if (!schermoVoluto) { x.release(); return; }
      schermoLock = x; x.addEventListener("release", function () { if (schermoLock === x) schermoLock = null; });
    }).catch(function () {});
    else if (!si && schermoLock) { try { schermoLock.release(); } catch (e) {} schermoLock = null; }
  }
  // cambiando app il telefono lo toglie da solo: tornando, lo rimettiamo
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && schermoVoluto && !schermoLock) tieniAcceso(true); });

  // ---- batteria: dopo 20 secondi senza tocchi gli avatar smettono di respirare e sbattere le palpebre
  //      (sono tanti e fanno lavorare il telefono di continuo); al primo tocco ripartono ----
  var tRiposo = null;
  function svegliaAnimazioni() {
    if (document.body) document.body.classList.remove("sg-riposo");
    clearTimeout(tRiposo);
    tRiposo = setTimeout(function () { if (document.body) document.body.classList.add("sg-riposo"); }, 20000);
  }
  ["pointerdown", "keydown"].forEach(function (ev) { document.addEventListener(ev, svegliaAnimazioni, { capture: true, passive: true }); });
  svegliaAnimazioni();

  // ---- "⏳ Aspettiamo l'host…": l'host è uscito un attimo dall'app (gli altri lo aspettano 2 minuti) ----
  var hostVia = {}, avvisoHost = null;
  window.addEventListener("sg-host", function (e) {
    var d = e.detail || {};
    if (d.via) hostVia[d.stanza] = 1; else delete hostVia[d.stanza];
    var serve = Object.keys(hostVia).length > 0;
    if (serve && !avvisoHost) { avvisoHost = el("div", { class: "host-via", text: "⏳ Aspettiamo l'host: è uscito un attimo dall'app…" }); document.body.appendChild(avvisoHost); }
    else if (!serve && avvisoHost) { if (avvisoHost.parentNode) avvisoHost.parentNode.removeChild(avvisoHost); avvisoHost = null; }
  });

  // 🔑 "Ho un codice": per chi è stato invitato e ha già l'app aperta (o il codice gliel'hanno detto a voce).
  // Si può anche incollare tutto il link: il codice lo trovo io.
  function entraConCodice(indietro) {
    var s = schermata({ icona: "🔑", titolo: "Entra con un codice", sotto: "Te l'ha mandato chi ha aperto la stanza", indietro: indietro || schermataHome });
    var input = el("input", { type: "text", class: "link-campo codice-campo", placeholder: "Es. ABCD", maxlength: "80", autocomplete: "off", autocapitalize: "characters", spellcheck: "false" });
    var err = el("p", { class: "link-avviso", style: "min-height:1.3em;margin:6px 0 0" });
    function vai() {
      var t = (input.value || "").trim(), m = /(?:stanza|sala)=([A-Za-z0-9]+)/.exec(t);   // incollato tutto il link?
      var c = (m ? m[1] : t).replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      if (c.length < 3) { err.textContent = "Scrivi il codice della stanza (di solito sono 4 lettere)."; return; }
      cercaStanza(c, function () { entraConCodice(indietro); });
    }
    input.addEventListener("input", function () { err.textContent = ""; });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") vai(); });
    s._contenuto.appendChild(input);
    s._contenuto.appendChild(err);
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Il codice lo vede chi ha aperto la stanza, in alto nella saletta. Puoi anche incollare il link che ti hanno mandato." }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: vai }));
    mostra(s);
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 250);
  }
  function cercaStanza(c, riprova) {
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
          text: "Non trovo una partita con il codice " + c + ". Controlla di averlo scritto giusto, oppure apri il link che ti ha mandato chi organizza." }));
        if (riprova) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "✏️ Riscrivi il codice", onclick: riprova }));
        s._piede.appendChild(el("button", { class: "btn " + (riprova ? "btn-fantasma" : "btn-primario"), text: "↩︎ Torna alla home", onclick: schermataHome }));
        mostra(s);
        return;
      }
      location.hash = "gioco=" + g.id + "&stanza=" + encodeURIComponent(c);
      location.reload();
    });
  }

  // il browser ci avvisa quando il sito si può installare come app: teniamo l'avviso per il pulsante in home
  var promptInstalla = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); promptInstalla = e;
    if (document.querySelector(".home")) schermataHome();   // se sei in home, compare subito il pulsante
  });

  function schermataHome() {
    if (window.SGNet && SGNet.chiudiGiochi) SGNet.chiudiGiochi();   // niente collegamenti vecchi aperti (la sala resta)
    chiudiTabelloneElim();
    tieniAcceso(false);
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
    rigaProfilo.appendChild(el("button", { class: "home-novita home-amici", onclick: function () { schermataAmici(); } }, [ el("span", { text: "👥 Classifica" }), cacheRich && cacheRich.arrivate.length ? el("span", { class: "pallino" }) : null ]));
    setTimeout(function () { aggiornaRichieste(); }, 0);   // richieste di amicizia nuove? pallino sul tasto
    // "Installa l'app": solo dal browser (se è già aperta come app, non serve)
    var giaApp = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
    var iPhone = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!giaApp) rigaProfilo.appendChild(el("button", { class: "home-novita", onclick: function () {
      if (promptInstalla) { promptInstalla.prompt(); promptInstalla.userChoice.then(function () { promptInstalla = null; schermataHome(); }); }
      else if (iPhone) alert("Per installarla: tocca il tasto Condividi (il quadrato con la freccia) e poi \"Aggiungi alla schermata Home\".");
      else alert("Per installarla: tocca i tre puntini ⋮ in alto a destra e scegli \"Installa app\" (oppure \"Aggiungi a schermata Home\").");
    } }, [ el("span", { text: "📲 Installa l'app" }) ]));
    s._contenuto.appendChild(el("div", { class: "home-hero" }, [
      el("div", { class: "home-logo", html: '<svg viewBox="0 0 200 118" width="156" height="92" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="sgBolt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6bf"/><stop offset=".42" stop-color="#ffd23b"/><stop offset=".72" stop-color="#f6a70c"/><stop offset="1" stop-color="#c06a08"/></linearGradient><linearGradient id="sgBoltHi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf0" stop-opacity=".95"/><stop offset=".5" stop-color="#ffffff" stop-opacity="0"/></linearGradient><filter id="sgGlow" x="-70%" y="-70%" width="240%" height="240%"><feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="#ff9d2e" flood-opacity=".75"/><feDropShadow dx="0" dy="0" stdDeviation="16" flood-color="#ff7b16" flood-opacity=".4"/></filter><path id="sgB" d="M13 0 L2 20 L10 20 L7 36 L22 12 L13 12 L17 0 Z"/></defs><g filter="url(#sgGlow)" stroke="#8a5209" stroke-width="1.3" stroke-linejoin="round"><use href="#sgB" transform="translate(18,34) scale(1.5)" fill="url(#sgBolt)"/><use href="#sgB" transform="translate(78,14) scale(1.95)" fill="url(#sgBolt)"/><use href="#sgB" transform="translate(150,34) scale(1.5)" fill="url(#sgBolt)"/></g><g stroke="none"><use href="#sgB" transform="translate(18,34) scale(1.5)" fill="url(#sgBoltHi)"/><use href="#sgB" transform="translate(78,14) scale(1.95)" fill="url(#sgBoltHi)"/><use href="#sgB" transform="translate(150,34) scale(1.5)" fill="url(#sgBoltHi)"/></g></svg>' }),
      el("h1", { class: "home-titolo", text: "SPeeD GAME" }),
      rigaProfilo
    ]));
    // stavi giocando da ospite e la pagina si è ricaricata (o hai riaperto l'app)? Si rientra al proprio posto
    var rientro = stanzaRecente();
    if (rientro) {
      var gR = rientro.gioco ? giochi.filter(function (x) { return x.id === rientro.gioco; })[0] : null;
      s._contenuto.appendChild(el("div", { class: "home-rientra" }, [
        el("button", { class: "btn btn-primario", onclick: function () { rientraStanza(rientro); } }, [
          el("span", { text: "🔁 Rientra nella partita" }),
          el("small", { text: rientro.sala ? "👥 Sala online · stanza " + rientro.sala : (gR ? gR.icona + " " + gR.nome : "Partita") + " · stanza " + rientro.stanza }) ]),
        el("button", { class: "home-rientra-x", "aria-label": "Non rientrare", text: "✕", onclick: function () { dimenticaStanza(); schermataHome(); } })
      ]));
    }
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
      class: "btn btn-primario", html: (torneo || (sala && sala.torneo)) ? "🏆 Riprendi il torneo" : "🏆 Torneo (più giochi di fila)",
      onclick: apriTorneo
    }));

    // Sala online: crea un gruppo che passa da un gioco all'altro (ognuno dal suo telefono)
    s._piede.appendChild(el("button", {
      class: "btn btn-fantasma", html: "👥 Sala online (porta il gruppo tra i giochi)",
      onclick: creaSala
    }));

    // Tasto "Ho un codice" (per chi è stato invitato e ha già l'app aperta, o ha il codice a voce)
    s._piede.appendChild(el("button", {
      class: "btn btn-fantasma", html: "🔑 Ho un codice: entro in una stanza",
      onclick: function () { entraConCodice(); }
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
    { gioco: "scalinata", livello: "diamante", icona: "👻", nome: "Il Fantasma",            desc: "Vinci senza subire nemmeno uno scontro",              stat: "vinteSenzaScontri", meta: 1 },
    // ---- TRIS (26 set 2026, liste dell'utente; "Difficile" è il bot nuovo battibile, "Impossibile" resta imbattibile) ----
    { gioco: "tris", livello: "bronzo",   icona: "✏️", nome: "Mossa d'Apertura",       desc: "Gioca la tua primissima partita",                              stat: "partite",         meta: 1 },
    { gioco: "tris", livello: "bronzo",   icona: "⭕", nome: "Il Primo Tris",          desc: "Vinci una partita, in qualsiasi modo",                          stat: "vinte",           meta: 1 },
    { gioco: "tris", livello: "bronzo",   icona: "🌱", nome: "Riscaldamento",          desc: "Batti il bot a livello Facile",                                stat: "vinteFacile",     meta: 1 },
    { gioco: "tris", livello: "bronzo",   icona: "🤝", nome: "Nessun Vincitore",       desc: "Pareggia una partita: griglia piena e nessun tris",            stat: "pareggi",         meta: 1 },
    { gioco: "tris", livello: "bronzo",   icona: "🔗", nome: "In Rete",                desc: "Gioca la tua prima partita online",                            stat: "online",          meta: 1 },
    { gioco: "tris", livello: "argento",  icona: "🧠", nome: "Pensiero Laterale",      desc: "Batti il bot a livello Medio",                                 stat: "vinteMedio",      meta: 1 },
    { gioco: "tris", livello: "argento",  icona: "📐", nome: "Geometria",              desc: "Vinci 5 partite chiudendo il tris in diagonale",               stat: "vinteDiagonale",  meta: 5 },
    { gioco: "tris", livello: "argento",  icona: "⚔️", nome: "Spirito Competitivo",    desc: "Vinci 10 partite online",                                      stat: "vinteOnline",     meta: 10 },
    { gioco: "tris", livello: "argento",  icona: "⚡", nome: "Scacco Matto in Tre",    desc: "Vinci mettendo solo 3 simboli (non vale contro il bot Facile)", stat: "vinteIn3",        meta: 1 },
    { gioco: "tris", livello: "argento",  icona: "🕊️", nome: "Pace Fatta",             desc: "Pareggia 15 partite in tutto",                                 stat: "pareggi",         meta: 15 },
    { gioco: "tris", livello: "oro",      icona: "🎓", nome: "Supera il Maestro",      desc: "Batti il bot a livello Difficile",                             stat: "vinteDifficile",  meta: 1 },
    { gioco: "tris", livello: "oro",      icona: "🏅", nome: "Insuperabile",           desc: "Vinci 20 partite online",                                      stat: "vinteOnline",     meta: 20 },
    { gioco: "tris", livello: "oro",      icona: "🧱", nome: "Muro Invalicabile",      desc: "Pareggia 5 partite di fila (senza vincere né perdere in mezzo)", stat: "serieParMax",   meta: 5 },
    { gioco: "tris", livello: "oro",      icona: "🖊️", nome: "Grafomane",              desc: "Metti 200 simboli sulla griglia in tutto",                     stat: "simboli",         meta: 200 },
    { gioco: "tris", livello: "diamante", icona: "👑", nome: "Dominio Totale",         desc: "Vinci 5 partite online di fila",                               stat: "serieOnlineMax",  meta: 5 },
    { gioco: "tris", livello: "diamante", icona: "🤖", nome: "Intelligenza Superiore", desc: "Batti il bot Difficile 5 volte",                               stat: "vinteDifficile",  meta: 5 },
    { gioco: "tris", livello: "diamante", icona: "🔮", nome: "Onniscienza",            desc: "Gioca 10 partite di fila contro il bot Difficile senza mai perdere", stat: "serieImbDiffMax", meta: 10 },
    // ---- DROP 4 (Forza 4) ----
    { gioco: "drop4", livello: "bronzo",   icona: "🟡", nome: "Battesimo di Gravità",   desc: "Gioca la tua primissima partita",                              stat: "partite",         meta: 1 },
    { gioco: "drop4", livello: "bronzo",   icona: "🎉", nome: "Finalmente Forza 4!",    desc: "Vinci la tua prima partita",                                   stat: "vinte",           meta: 1 },
    { gioco: "drop4", livello: "bronzo",   icona: "🌍", nome: "Sfida Globale",          desc: "Gioca la tua prima partita online",                            stat: "online",          meta: 1 },
    { gioco: "drop4", livello: "bronzo",   icona: "🌱", nome: "Livello Base",           desc: "Batti il bot a livello Facile",                                stat: "vinteFacile",     meta: 1 },
    { gioco: "drop4", livello: "bronzo",   icona: "🛑", nome: "Guastafeste",            desc: "Blocca 5 volte l'avversario che stava per fare 4",             stat: "blocchi",         meta: 5 },
    { gioco: "drop4", livello: "argento",  icona: "🧠", nome: "Mente Tattica",          desc: "Batti il bot a livello Medio",                                 stat: "vinteMedio",      meta: 1 },
    { gioco: "drop4", livello: "argento",  icona: "🗼", nome: "Costruttore di Torri",   desc: "Vinci 5 partite con 4 pedine in verticale",                    stat: "vinteVerticale",  meta: 5 },
    { gioco: "drop4", livello: "argento",  icona: "➖", nome: "Orizzonte Piatto",       desc: "Vinci 5 partite con 4 pedine in orizzontale",                  stat: "vinteOrizzontale", meta: 5 },
    { gioco: "drop4", livello: "argento",  icona: "⚔️", nome: "Gladiatore Online",      desc: "Vinci 10 partite online",                                      stat: "vinteOnline",     meta: 10 },
    { gioco: "drop4", livello: "argento",  icona: "🏚️", nome: "Sfratto",                desc: "Vinci con più di 21 pedine sulla griglia",                     stat: "vinteSfratto",    meta: 1 },
    { gioco: "drop4", livello: "oro",      icona: "🤖", nome: "Scacco alla Macchina",   desc: "Batti il bot a livello Difficile",                             stat: "vinteDifficile",  meta: 1 },
    { gioco: "drop4", livello: "oro",      icona: "📐", nome: "Geometria Letale",       desc: "Vinci 10 partite con 4 pedine in diagonale",                   stat: "vinteDiagonale",  meta: 10 },
    { gioco: "drop4", livello: "oro",      icona: "🏆", nome: "Leggenda della Griglia", desc: "Vinci 20 partite online",                                      stat: "vinteOnline",     meta: 20 },
    { gioco: "drop4", livello: "oro",      icona: "🌧️", nome: "Pioggia di Gettoni",     desc: "Fai cadere 300 pedine in tutto",                               stat: "gettoni",         meta: 300 },
    { gioco: "drop4", livello: "diamante", icona: "✨", nome: "Partita Perfetta",       desc: "Vinci mettendo solo 4 pedine (non vale contro il bot Facile)", stat: "vinteIn4",        meta: 1 },
    { gioco: "drop4", livello: "diamante", icona: "💻", nome: "Dominio Cibernetico",    desc: "Batti il bot Difficile 5 volte",                               stat: "vinteDifficile",  meta: 5 },
    { gioco: "drop4", livello: "diamante", icona: "🧊", nome: "Stallo Architettonico",  desc: "Pareggia una partita: griglia piena e nessuno fa 4",           stat: "pareggi",         meta: 1 },
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
    pubblicaTrofei(prof, ora);
  }
  // la "scheda" che vedono gli amici: quanti trofei, per livello e per gioco
  function pubblicaTrofei(prof, set) {
    if (!(window.SGNube && SGNube.pubblica)) return;
    var liv = { platino: 0, diamante: 0, oro: 0, argento: 0, bronzo: 0 }, perGioco = {}, n = 0;
    for (var k in set) { var t = set[k]; n++; if (liv[t.livello] != null) liv[t.livello]++; perGioco[t.gioco] = (perGioco[t.gioco] || 0) + 1; }
    SGNube.pubblica({ trofei: n, liv: liv, giochi: perGioco });
  }

  // ---- Amici e classifica trofei ----
  // Gli amici si aggiungono scrivendo il loro nome del profilo. La classifica
  // mette in fila te e i tuoi amici, da chi ha più trofei a chi ne ha meno.
  var cacheAmici = null;   // ultime schede lette: la lista compare subito, poi si aggiorna
  function totTrofeiTutti() { return TROFEI.length + giochi.filter(function (g) { return trofeiDi(g.id).length; }).length; }
  function ordinaClassifica(l) {
    function v(x, k) { return (x.liv && x.liv[k]) || 0; }
    return l.slice().sort(function (a, b) {
      return (b.trofei || 0) - (a.trofei || 0) || v(b, "platino") - v(a, "platino") || v(b, "diamante") - v(a, "diamante") ||
        v(b, "oro") - v(a, "oro") || v(b, "argento") - v(a, "argento") || String(a.nome).localeCompare(String(b.nome));
    });
  }
  function faccina(sch, cls) {
    return el("span", { class: cls, html: sch.omino && window.SGOmino ? SGOmino.svg(sch.omino, { busto: true }) : "<span class='am-emo'>" + (sch.emoji || "🙂") + "</span>" });
  }
  function erroreAmici(e) {
    var c = e && e.code || "";
    if (c === "permission-denied") return "La lista amici non è ancora attiva sul server. Riprova tra poco.";
    if (c === "unavailable" || (e && e.message === "offline")) return "Nessuna connessione: riprova.";
    return "Qualcosa è andato storto, riprova.";
  }
  // richieste di amicizia (arrivate/inviate): lette all'apertura e ricordate
  var cacheRich = null, richLette = 0, errRich = null;
  function aggiornaRichieste(forza) {
    if (!(window.SGNube && SGNube.disponibile() && SGNube.profilo() && SGNube.richieste)) return Promise.resolve(null);
    if (!forza && cacheRich && Date.now() - richLette < 30000) return Promise.resolve(cacheRich);
    richLette = Date.now();
    return SGNube.richieste().then(function (r) {
      cacheRich = r;
      // il pallino sul tasto Amici in home, senza ridisegnare la home
      var b = document.querySelector(".home-amici");
      if (b) { var p = b.querySelector(".pallino"); if (r.arrivate.length && !p) b.appendChild(el("span", { class: "pallino" })); if (!r.arrivate.length && p) b.removeChild(p); }
      return r;
    }).catch(function (e) { errRich = e; return cacheRich; });
  }
  // che rapporto ho con questo giocatore
  function rapporto(uid) {
    var prof = SGNube.profilo();
    if (prof && uid === prof.uid) return "io";
    if (SGNube.amici().indexOf(uid) >= 0) return "amico";
    if (cacheRich) {
      if (cacheRich.arrivate.some(function (r) { return r.da === uid; })) return "arrivata";
      if (cacheRich.inviate.some(function (r) { return r.a === uid; })) return "inviata";
    }
    return "nessuno";
  }
  // manda la richiesta (o accetta se lui l'aveva già mandata) e dice com'è andata
  function chiediA(sch, fatto) {
    return SGNube.chiediAmicizia(sch).then(function (esito) {
      return aggiornaRichieste(true).then(function () {
        if (fatto) fatto(esito === "amici" ? "✅ Tu e " + sch.nome + " ora siete amici!" : "📨 Richiesta mandata a " + sch.nome + ".");
      });
    });
  }
  function laMiaScheda(prof) {
    var io = { uid: prof.uid, nome: prof.nome, omino: prof.omino || null, emoji: prof.emoji, io: true, giochi: {} };
    var set = trofeiSbloccati(prof), liv = { platino: 0, diamante: 0, oro: 0, argento: 0, bronzo: 0 };
    io.trofei = 0;
    for (var k in set) { io.trofei++; if (liv[set[k].livello] != null) liv[set[k].livello]++; io.giochi[set[k].gioco] = (io.giochi[set[k].gioco] || 0) + 1; }
    io.liv = liv;
    return io;
  }

  function schermataAmici(scheda) {
    scheda = scheda || "generale";
    var prof = (window.SGNube && SGNube.disponibile()) ? SGNube.profilo() : null;
    var s = schermata({ icona: "👥", titolo: "Classifica e amici", sotto: "Chi ha più trofei", indietro: schermataHome });
    if (!prof) {
      s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Ti serve il profilo per entrare in classifica, aggiungere amici e confrontare i trofei." }));
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "👤 Crea / accedi al profilo", onclick: function () { schermataAccesso(function () { schermataAmici(scheda); }); } }));
      mostra(s); return;
    }
    controllaTrofei();   // la mia scheda pubblica è aggiornata prima di leggere le altre
    var io = laMiaScheda(prof), tot = totTrofeiTutti();
    var schede = el("div", { class: "am-schede" });
    var tabRich = null;
    [["generale", "🌍 Generale"], ["amici", "👥 Amici"], ["richieste", "📨 Richieste"]].forEach(function (x) {
      var b = el("button", { class: "am-tab" + (x[0] === scheda ? " attiva" : ""), onclick: function () { if (x[0] !== scheda) schermataAmici(x[0]); } }, [ el("span", { text: x[1] }) ]);
      if (x[0] === "richieste") tabRich = b;
      schede.appendChild(b);
    });
    function segnaRichieste() {
      var n = cacheRich ? cacheRich.arrivate.length : 0, p = tabRich.querySelector(".am-conta");
      if (n && !p) tabRich.appendChild(el("span", { class: "am-conta", text: "" + n }));
      else if (p) { if (n) p.textContent = "" + n; else tabRich.removeChild(p); }
    }
    segnaRichieste();
    s._contenuto.appendChild(schede);
    var corpo = el("div", { class: "am-corpo" });
    s._contenuto.appendChild(corpo);
    function ancoraQui() { return !!s.parentNode; }
    function carica(testo) { corpo.appendChild(el("p", { class: "modulo-nota am-carica", text: testo })); }
    function errore(e) { var c = corpo.querySelector(".am-carica"); if (c) c.textContent = erroreAmici(e); else corpo.appendChild(el("p", { class: "link-avviso", text: erroreAmici(e) })); }

    // una riga di classifica; "azione" = il tasto a destra per chiedere/accettare l'amicizia
    function riga(x, pos, conAzione) {
      var medaglia = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : pos ? pos + "°" : "–";
      var l = x.liv || {};
      var dett = [["💠", l.platino], ["💎", l.diamante], ["🥇", l.oro], ["🥈", l.argento], ["🥉", l.bronzo]]
        .filter(function (d) { return d[1]; }).map(function (d) { return d[0] + " " + d[1]; }).join("   ");
      var rap = rapporto(x.uid), azione = null;
      if (conAzione) {
        if (rap === "amico") azione = el("span", { class: "am-stato", text: "👥" });
        else if (rap === "inviata") azione = el("span", { class: "am-stato", text: "⏳" });
        else if (rap === "arrivata" || rap === "nessuno") {
          azione = el("button", { class: "am-piu" + (rap === "arrivata" ? " si" : ""), text: rap === "arrivata" ? "✓" : "➕", "aria-label": "Amicizia con " + x.nome, onclick: function (e) {
            e.stopPropagation(); azione.disabled = true;
            chiediA(x, function () { if (ancoraQui()) schermataAmici(scheda); }).catch(function (er) { azione.disabled = false; alert(erroreAmici(er)); });
          } });
        }
      }
      return el("button", { class: "am-riga" + (x.io ? " io" : "") + (pos && pos <= 3 ? " podio p" + pos : ""), onclick: function () { schermataTrofeiAmico(x, scheda); } }, [
        el("span", { class: "am-pos", text: medaglia }),
        faccina(x, "am-fac"),
        el("div", { class: "am-info" }, [
          el("div", { class: "am-nome", text: x.nome + (x.io ? " (tu)" : "") }),
          el("div", { class: "am-dett", text: dett || "Nessun trofeo ancora" })
        ]),
        el("div", { class: "am-num" }, [ el("b", { text: "" + (x.trofei || 0) }), el("span", { text: "/" + tot }) ]),
        azione
      ]);
    }
    // mette in fila e numera (a pari trofei, stesso posto)
    function classifica(lista, conAzione) {
      var pos = 0, prec = null;
      ordinaClassifica(lista).forEach(function (x, i) {
        if (!prec || (x.trofei || 0) !== (prec.trofei || 0)) pos = i + 1;
        prec = x;
        corpo.appendChild(riga(x, pos, conAzione));
      });
    }

    if (scheda === "generale") {
      carica("Carico la classifica…");
      Promise.all([SGNube.classificaGenerale(100), aggiornaRichieste()]).then(function (rr) {
        if (!ancoraQui()) return;
        svuota(corpo); segnaRichieste();
        var lista = rr[0].filter(function (x) { return x.uid !== io.uid; }), dentro = rr[0].length > lista.length || rr[0].length < 100;
        if (dentro) classifica(lista.concat([io]), true);
        else {   // non sono tra i primi 100: la classifica e poi io in fondo
          classifica(lista, true);
          corpo.appendChild(el("div", { class: "am-sep", text: "…" }));
          corpo.appendChild(riga(io, 0, false));
        }
        corpo.appendChild(el("p", { class: "modulo-nota am-nota", text: "Tocca ➕ per chiedere l'amicizia, o un nome per vedere i suoi trofei." }));
      }).catch(errore);
    } else if (scheda === "amici") {
      var campo = el("input", { class: "link-campo", type: "text", maxlength: "20", placeholder: "Cerca un nome…" });
      var bCerca = el("button", { class: "btn btn-primario am-agg", text: "➕ Chiedi" });
      var avviso = el("div", { class: "link-avviso" });
      function cerca() {
        var n = (campo.value || "").trim();
        if (n.length < 2) { avviso.textContent = "Scrivi il nome del profilo del tuo amico."; return; }
        if (SGNube.chiaveNome(n) === SGNube.chiaveNome(prof.nome)) { avviso.textContent = "Quello sei tu 😄"; return; }
        bCerca.disabled = true; avviso.textContent = "Cerco…";
        SGNube.cercaNome(n).then(function (sch) {
          if (!sch) { bCerca.disabled = false; avviso.textContent = "Non trovo nessuno con questo nome. Deve aver aperto l'app almeno una volta dopo l'aggiornamento."; return; }
          var rap = rapporto(sch.uid);
          if (rap === "amico") { bCerca.disabled = false; avviso.textContent = sch.nome + " è già tuo amico."; return; }
          if (rap === "inviata") { bCerca.disabled = false; avviso.textContent = "Hai già mandato la richiesta a " + sch.nome + ": aspetta che accetti."; return; }
          return chiediA(sch, function (msg) { bCerca.disabled = false; campo.value = ""; avviso.textContent = msg; });
        }).catch(function (e) { bCerca.disabled = false; avviso.textContent = erroreAmici(e); });
      }
      bCerca.onclick = cerca;
      campo.addEventListener("keydown", function (e) { if (e.key === "Enter") cerca(); });
      s._contenuto.insertBefore(el("div", { class: "am-cerca-box" }, [ el("div", { class: "am-cerca" }, [campo, bCerca]), avviso ]), corpo);
      var mieiUid = SGNube.amici();
      var giaNoti = (cacheAmici || []).filter(function (x) { return mieiUid.indexOf(x.uid) >= 0; });
      function disegnaAmici(l) {
        svuota(corpo);
        classifica(l.concat([io]), false);
        if (!l.length) corpo.appendChild(el("p", { class: "modulo-nota am-nota", text: "Non hai ancora amici. Cerca il loro nome qui sopra, oppure chiedi l'amicizia dalla classifica Generale." }));
      }
      disegnaAmici(giaNoti);
      aggiornaRichieste().then(function () {   // intanto si sistemano le amicizie accettate/tolte dagli altri
        segnaRichieste();
        var uids = SGNube.amici();
        if (!uids.length) { cacheAmici = []; if (ancoraQui()) disegnaAmici([]); return; }
        if (!giaNoti.length) carica("Carico gli amici…");
        return SGNube.schede(uids).then(function (l) { cacheAmici = l; if (ancoraQui()) disegnaAmici(l); });
      }).catch(errore);
    } else {
      carica("Carico le richieste…");
      aggiornaRichieste(true).then(function (r) {
        if (!ancoraQui()) return;
        svuota(corpo); segnaRichieste();
        if (!r) { errore(errRich || { code: "unavailable" }); return; }
        function persona(nome, omino, emoji) { return { nome: nome || "?", omino: omino || null, emoji: emoji }; }
        corpo.appendChild(el("div", { class: "etichetta am-etich", text: "Arrivate a te" }));
        if (!r.arrivate.length) corpo.appendChild(el("p", { class: "modulo-nota am-nota", text: "Nessuna richiesta nuova." }));
        r.arrivate.forEach(function (q) {
          var bSi = el("button", { class: "am-piu si", text: "✓", "aria-label": "Accetta", onclick: function () {
            bSi.disabled = true;
            SGNube.accetta(q).then(function () { return aggiornaRichieste(true); }).then(function () { schermataAmici("richieste"); })
              .catch(function (e) { bSi.disabled = false; alert(erroreAmici(e)); });
          } });
          var bNo = el("button", { class: "am-togli", text: "✕", "aria-label": "Rifiuta", onclick: function () {
            SGNube.rifiuta(q).then(function () { return aggiornaRichieste(true); }).then(function () { schermataAmici("richieste"); }).catch(function () {});
          } });
          corpo.appendChild(el("div", { class: "am-riga" }, [
            faccina(persona(q.daNome, q.daOmino, q.daEmoji), "am-fac"),
            el("div", { class: "am-info" }, [ el("div", { class: "am-nome", text: q.daNome || "?" }), el("div", { class: "am-dett", text: "vuole essere tuo amico" }) ]),
            bNo, bSi
          ]));
        });
        if (r.inviate.length) {
          corpo.appendChild(el("div", { class: "etichetta am-etich", text: "Mandate da te" }));
          r.inviate.forEach(function (q) {
            corpo.appendChild(el("div", { class: "am-riga" }, [
              el("span", { class: "am-fac" }, [ el("span", { class: "am-emo", text: "⏳" }) ]),
              el("div", { class: "am-info" }, [ el("div", { class: "am-nome", text: q.aNome || "?" }), el("div", { class: "am-dett", text: "in attesa che accetti" }) ]),
              el("button", { class: "am-togli", text: "✕", "aria-label": "Annulla", onclick: function () {
                SGNube.annulla(q).then(function () { return aggiornaRichieste(true); }).then(function () { schermataAmici("richieste"); }).catch(function () {});
              } })
            ]));
          });
        }
      });
    }
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Torna alla home", onclick: schermataHome }));
    mostra(s);
  }
  // i trofei di un giocatore, gioco per gioco (+ il tasto per l'amicizia)
  function schermataTrofeiAmico(x, torna) {
    torna = torna || "generale";
    var s = schermata({ titolo: x.nome, sotto: "🏆 " + (x.trofei || 0) + " trofei", indietro: function () { schermataAmici(torna); } });
    s._contenuto.appendChild(el("div", { class: "am-grande" }, [ faccina(x, "am-fac-grande") ]));
    var l = x.liv || {};
    function cella(cls, ico, nome, f) {
      return el("div", { class: "sm-liv " + cls }, [ el("div", { class: "sm-ico", text: ico }), el("div", { class: "sm-num", html: "<b>" + (f || 0) + "</b>" }), el("div", { class: "sm-nome", text: nome }) ]);
    }
    s._contenuto.appendChild(el("div", { class: "sfide-sommario" }, [
      el("div", { class: "sm-livelli" }, [
        cella("tl-bronzo", "🥉", "Bronzo", l.bronzo), cella("tl-argento", "🥈", "Argento", l.argento),
        cella("tl-oro", "🥇", "Oro", l.oro), cella("tl-diamante", "💎", "Diamante", l.diamante), cella("tl-platino", "💠", "Platino", l.platino)
      ])
    ]));
    var perGioco = x.giochi || {};
    // prima i giochi dove ha più trofei
    giochi.slice().sort(function (a, b) { return (perGioco[b.id] || 0) - (perGioco[a.id] || 0); }).forEach(function (g) {
      var tot = trofeiDi(g.id).length; if (!tot) return;
      tot++;   // + il Platino del gioco
      var f = perGioco[g.id] || 0, pct = Math.floor(f * 100 / tot), plat = f >= tot;
      s._contenuto.appendChild(el("div", { class: "sfida-gioco" + (plat ? " platinato" : "") }, [
        el("span", { class: "sg-ico", text: g.icona || "🎮" }),
        el("div", { class: "sg-corpo" }, [
          el("div", { class: "sg-nome", text: g.nome }),
          el("div", { class: "sg-sub", html: f + "/" + tot + " trofei" + (plat ? "  ·  💠 Platino!" : "") + " <span class='sg-pct'>" + pct + "%</span>" }),
          el("div", { class: "sg-barra" }, [ el("div", { class: "sg-fill", style: "width:" + pct + "%" }) ])
        ])
      ]));
    });
    var rap = x.io ? "io" : rapporto(x.uid), avviso = el("div", { class: "link-avviso" });
    if (rap === "nessuno" || rap === "arrivata") {
      var b = el("button", { class: "btn btn-primario", text: rap === "arrivata" ? "✅ Accetta l'amicizia" : "➕ Chiedi l'amicizia", onclick: function () {
        b.disabled = true;
        chiediA(x, function (msg) { avviso.textContent = msg; b.textContent = msg.charAt(0) === "✅" ? "👥 Siete amici" : "⏳ Richiesta mandata"; })
          .catch(function (e) { b.disabled = false; avviso.textContent = erroreAmici(e); });
      } });
      s._piede.appendChild(avviso); s._piede.appendChild(b);
    } else if (rap === "inviata") {
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "⏳ Richiesta mandata, aspetta che accetti", disabled: "disabled" }));
    } else if (rap === "amico") {
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "✕ Togli dagli amici", onclick: function () {
        chiediConferma("Togliere " + x.nome + " dagli amici?", "Sparirete dalla lista amici l'uno dell'altro. Potrai sempre richiedere l'amicizia.", "✕ Togli", function () {
          SGNube.togliAmico(x.uid).catch(function () {});
          cacheAmici = (cacheAmici || []).filter(function (y) { return y.uid !== x.uid; });
          schermataAmici("amici");
        });
      } }));
    }
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "‹ Indietro", onclick: function () { schermataAmici(torna); } }));
    mostra(s);
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
    var base;
    if (g.etichettaGiocatori) base = g.etichettaGiocatori;   // testo su misura (es. Horto: conta i cavalli in gara, non i profili)
    else {
      var min = g.giocatoriMin || 2, max = g.giocatoriMax || 8;
      base = min === max ? (max === 1 ? "👤 1 giocatore" : "👥 " + max + " giocatori") : "👥 " + min + "–" + max + " giocatori";
    }
    return GIOCHI_ELIMINAZIONE[g.id] ? base + " · 🏆 torneo fino a " + MAX_ELIM : base;   // i giochi a due: torneo a eliminazione
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
      return pc ? { id: pc.uid, nome: pc.nome, emoji: pc.emoji, omino: pc.omino || null, omini: pc.omini || null, ominoN: pc.ominoN || 0, cloud: true } : null;
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
    { nome: "Festa", tutti: { capo: "maglietta", maglia: 5, stampa: "stella", sotto: "jeans", pantaloni: 8, modScarpe: "sneakers", scarpe: 4, cappello: "festa", colAcc: 3, occhiali: "stelle", mano: "palloncino", colMano: 0, pittura: "cuori" } },
    { nome: "Natale", tutti: { capo: "maglione", maglia: 0, sotto: "jeans", pantaloni: 1, modScarpe: "stivali", scarpe: 5, cappello: "babbo", collo: "sciarpa", colCollo: 2, mano: "tazza", colMano: 0 } },
    { nome: "Vichingo", tutti: { capo: "maglione", maglia: 2, sotto: "pantaloni", pantaloni: 2, modScarpe: "stivali", scarpe: 5, cappello: "vichingo", schiena: "mantello", colSchiena: 7 } },
    { nome: "Angioletto", tutti: { capo: "maglione", maglia: 8, sotto: "pantaloni", pantaloni: 7, modScarpe: "sneakers", scarpe: 1, cappello: "aureola", schiena: "ali" }, donna: { capo: "vestito", modScarpe: "ballerine" } },
    { nome: "Diavoletto", tutti: { capo: "felpa", maglia: 0, sotto: "jeans", pantaloni: 1, modScarpe: "anfibi", scarpe: 0, cappello: "corna", schiena: "pipistrello" } },
    { nome: "Fatina", tutti: { capo: "maglietta", maglia: 5, sotto: "jeans", pantaloni: 9, modScarpe: "sneakers", scarpe: 1, cappello: "tiara", schiena: "farfalla", colSchiena: 5, mano: "bacchetta" }, donna: { capo: "vestito", modScarpe: "ballerine" } }
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
    if (p) { p.omino = cfg; if (omini) { p.omini = omini; p.ominoN = n; } salvaProfilo(p); }
  }
  // liste personali salvate sul profilo (es. le parole di Parola d'ordine): nel cloud se il profilo è online, se no su questo telefono
  function listaProfilo(nome) {
    var io = profiloAttivo(); if (!io) return [];
    if (io.cloud) return (window.SGNube && SGNube.lista ? SGNube.lista(nome) : []).slice();
    var p = profili().filter(function (x) { return x.id === io.id; })[0];
    return ((p && p.liste && p.liste[nome]) || []).slice();
  }
  function salvaListaProfilo(nome, lista) {
    var io = profiloAttivo(); if (!io) return;
    if (io.cloud) { if (window.SGNube && SGNube.salvaLista) SGNube.salvaLista(nome, lista); return; }
    var p = profili().filter(function (x) { return x.id === io.id; })[0];
    if (p) { p.liste = p.liste || {}; p.liste[nome] = lista; salvaProfilo(p); }
  }
  // il secondo avatar la prima volta: a caso, ma dell'altra forma (maschio <-> femmina)
  function secondoOmino(primo, nome) {
    return SGOmino.casuale(nome + "#2", primo.forma === "donna" ? "uomo" : "donna");
  }
  // bozza (facoltativa) = { nome, omino, omini, ominoN }: l'editor lavora su questa e non sul profilo
  // (serve mentre crei il profilo: il personaggio si salva appena il profilo esiste)
  function schermataOmino(dopo, bozza) {
    var io = bozza || profiloAttivo();
    if (!io) return schermataAccesso(function () { schermataOmino(dopo); });
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
    var iniziali = bozze.map(function (b) { return O.norm(b); });   // com'erano all'ingresso (se esci senza salvare)
    // il palco: faro dall'alto, pedana luminosa, omino che respira e sbatte le palpebre (toccalo: reagisce!)
    var figura = el("div", { class: "om-figura", title: "Toccami!" });
    var puntini = el("div", { class: "om-puntini" });
    var palco = el("div", { class: "omino-palco editor" }, [el("div", { class: "om-faro" }), el("div", { class: "om-pedana" }), figura,
      puntini,
      el("button", { class: "om-indietro", "aria-label": "Indietro", text: "‹", onclick: function () { esci(); } }),
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
    s._contenuto.appendChild(palco); s._contenuto.appendChild(schede); s._contenuto.appendChild(sottoschede); s._contenuto.appendChild(pannello);
    function unisci(k, v) {
      if (k === "forma") return O.adattaForma(cfg, v);   // maschio/femmina: cambiano anche capelli, barba, trucco
      var c = {}; for (var x in cfg) c[x] = cfg[x]; c[k] = v; return c;
    }
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
      var sz = SEZ_OMINO[i], trucco = ["ombretto", "eyeliner", "mascara", "rossetto", "blush"].some(function (k) { return cfg[k] && !/^nessun/.test(cfg[k]); });
      return sz && (!sz.solo || sz.solo === cfg.forma || (sz.nome === "Trucco" && trucco)) ? i : -1;
    }
    function disegnaSchede() {
      schede.innerHTML = ""; var n = 0;
      SEZ_OMINO.forEach(function (sz, i) {
        if (visibile(i) < 0) return; n++;
        schede.appendChild(el("button", { class: "cat-tab" + (i === tab ? " attiva" : ""),
          onclick: function () { tab = i; disegnaSchede(); disegnaPannello(); pannello.scrollTop = 0; } }, [el("span", { class: "ci", text: sz.icona }), el("span", { text: sz.nome })]));
      });
      schede.style.gridTemplateColumns = "repeat(" + n + ",minmax(0,1fr))";
      schede.classList.toggle("sette", n > 6);
      var z = SEZ_OMINO[tab].zoom;
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
      cfg[k] = v;
      // una mano sola: borsetta e oggetti in mano non vanno insieme
      if (k === "mano" && !/^(nessuno|pallone)$/.test(v) && cfg.borsa === "borsetta") cfg.borsa = "nessuna";
      if (k === "borsa" && v === "borsetta" && !/^(nessuno|pallone)$/.test(cfg.mano)) cfg.mano = "nessuno";
      anteprima(true); if (rifai) disegnaPannello(); else aggiornaPannello(k);
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
      var sz = SEZ_OMINO[tab], lista = sz.sotto || [[sz.nome, sz.voci.map(function (vc) { return vc[0]; })]];
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
      var sz = SEZ_OMINO[tab], lista = sottoVisibili(), cur = sottoAttuale();
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
        O.OPZ[k].forEach(function (val, i) {
          if (gruppi) gruppi.forEach(function (g) {
            if (g[1] !== i) return;
            if (riga.children.length) pannello.appendChild(riga);
            pannello.appendChild(el("div", { class: "etichetta", text: g[0] }));
            riga = el("div", { class: "om-griglia" });
          });
          if (/^(sotto|capo|modScarpe)$/.test(k) && O.SOLO_DONNA.test(val) && cfg.forma !== "donna") return;   // gonne, vestiti, tacchi… solo per la donna
          var v = OMINO_COLORI[k] ? i : val, b;
          if (OMINO_COLORI[k]) {
            b = el("button", { class: "om-opz om-colore", style: "background:" + val, "aria-label": vc[1] + " " + (i + 1), onclick: function () { scegli(k, v); } });
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
    }
    palco.appendChild(el("button", { class: "om-azione caso", text: "🎲", "aria-label": "Personaggio a caso", onclick: function () {
      ricorda(); cfg = O.norm(O.casuale()); if (visibile(tab) < 0) tab = 0;
      anteprima(true); disegnaSchede(); disegnaPannello();
    } }));
    palco.appendChild(bAnnulla); aggAnnulla();
    var salvato = false;
    palco.appendChild(el("button", { class: "om-azione salva", text: "✅ Salva", onclick: function () {
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

  // ---- profili in cloud (Firebase): nome + password, ti seguono ovunque ----
  function schermataAccessoCloud(dopo) {
    var p = SGNube.profilo();
    if (p) {   // già dentro: mostra il profilo, le statistiche e il tasto esci
      var sp = schermata({ icona: p.emoji || "👤", titolo: p.nome, sotto: "Il tuo profilo", indietro: schermataHome });
      if (window.SGOmino) sp._contenuto.appendChild(el("div", { class: "omino-profilo" }, [
        el("div", { class: "omino-palco" + (p.omino ? "" : " vuoto"), html: SGOmino.svg(p.omino || SGOmino.casuale(p.nome)) }),
        el("button", { class: "btn " + (p.omino ? "btn-fantasma" : "btn-primario"), text: p.omino ? "✏️ Modifica il tuo avatar" : "🧍 Crea il tuo avatar",
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
      sp._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🚪 Esci dal profilo", onclick: function () {
        chiediConferma("Sei sicuro di voler uscire dal profilo?", "Se non ricordi la password non potrai più accedere.", "🚪 Esci", function () {
          SGNube.esci().then(function () { schermataHome(); });
        });
      } }));
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

  // scelta = quello che hai già scritto/scelto (si ritrova tornando dall'editor del personaggio)
  function schermataCreaCloud(dopo, scelta) {
    scelta = scelta || { emoji: FACCINE[0], nome: "", pwd: "", omino: null, omini: null, ominoN: 0 };
    var s = schermata({ icona: "👤", titolo: "Crea profilo", sotto: "Nome, password, faccina e personaggio", indietro: function () { schermataAccessoCloud(dopo); } });
    var nome = el("input", { class: "link-campo", type: "text", maxlength: "20", placeholder: "Come ti chiami?" });
    var pwd = el("input", { class: "link-campo", type: "password", maxlength: "40", placeholder: "Scegli una password (min 6)", style: "margin-top:8px" });
    nome.value = scelta.nome || ""; pwd.value = scelta.pwd || "";
    nome.addEventListener("input", function () { scelta.nome = nome.value; if (!scelta.omino) disegnaPers(); });
    pwd.addEventListener("input", function () { scelta.pwd = pwd.value; });
    s._contenuto.appendChild(nome); s._contenuto.appendChild(pwd);
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "Scegli la faccina" }));
    var griglia = el("div", { class: "faccine" });
    FACCINE.forEach(function (e) {
      griglia.appendChild(el("button", { class: "faccina" + (e === scelta.emoji ? " attiva" : ""), text: e, onclick: function () {
        scelta.emoji = e; [].forEach.call(griglia.children, function (c) { c.className = "faccina" + (c.textContent === e ? " attiva" : ""); });
      } }));
    });
    s._contenuto.appendChild(griglia);
    // il personaggio: finché non lo crei è quello "a caso" legato al nome che scrivi
    var pers = el("div", { class: "omino-palco" + (scelta.omino ? "" : " vuoto") });
    function disegnaPers() { if (window.SGOmino) pers.innerHTML = SGOmino.svg(scelta.omino || SGOmino.casuale((nome.value || "").trim() || "io")); }
    if (window.SGOmino) {
      disegnaPers();
      s._contenuto.appendChild(el("div", { class: "etichetta", text: "Il tuo personaggio" }));
      s._contenuto.appendChild(el("div", { class: "omino-profilo crea" }, [ pers,
        el("button", { class: "btn " + (scelta.omino ? "btn-fantasma" : "btn-primario"), text: scelta.omino ? "✏️ Modifica il personaggio" : "🧍 Crea il tuo personaggio", onclick: function () {
          var b = { nome: (nome.value || "").trim() || "io", omino: scelta.omino, omini: scelta.omini, ominoN: scelta.ominoN };
          schermataOmino(function () {
            if (b.omino) { scelta.omino = b.omino; scelta.omini = b.omini; scelta.ominoN = b.ominoN || 0; }
            schermataCreaCloud(dopo, scelta);
          }, b);
        } }) ]));
    }
    var avviso = el("div", { class: "link-avviso" });
    s._contenuto.appendChild(avviso);
    var bCrea = el("button", { class: "btn btn-primario", text: "Crea profilo ▶", onclick: function () {
      var n = (nome.value || "").trim(), pw = pwd.value || "";
      if (n.length < 2) { avviso.textContent = "Scrivi il tuo nome."; return; }
      if (pw.length < 6) { avviso.textContent = "La password deve avere almeno 6 caratteri."; return; }
      bCrea.disabled = true; avviso.textContent = "Creo il profilo…";
      SGNube.crea(n, pw, scelta.emoji).then(function () {
        if (!scelta.omino) return dopo();
        // il personaggio fatto prima si salva appena il profilo c'è
        attendiProfilo(function () { SGNube.salvaOmino(scelta.omino, scelta.omini, scelta.ominoN || 0); dopo(); });
      }).catch(function (e) { bCrea.disabled = false; avviso.textContent = SGNube.messaggioErrore(e); });
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
      indietro: function () { if (!torn && g && modiDi(g).length > 1) schermataModo(g); else schermataHome(); } });

    var conta = el("p", { class: "modulo-nota" });
    var lista = el("div");
    var avanti = el("button", { class: "btn btn-primario", text: torn ? "Comincia il torneo ▶" : "Avanti ▶", onclick: function () {
      if (gruppo.length < (torn ? min : 1)) return;
      if (torn) return iniziaTorneo();
      if (g) schermataPreGioco(g, opts && opts.modo ? { modo: opts.modo } : null); else schermataScegliGioco();
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
    var modo = inSala ? "online" : (opts && opts.modo) || null, M = modo ? modoDi(g, modo) : null, online = modo === "online";
    var conAmici = !torn && !inSala && (!modo || (M && M.amici));   // la lista di chi gioca serve solo se si gioca sullo stesso telefono
    var s = schermata({ icona: g.icona, titolo: g.nome,
      sotto: torn ? ("Torneo · " + nomeDifficolta(pesoGioco(g))) : (inSala ? "Sala · impostazioni" : (M ? M.icona + " " + M.nome + " · impostazioni" : "Impostazioni della partita")),
      indietro: function () { if (torn) schermataTorneoHub(); else if (inSala) salaScegliGioco(); else if (conAmici) schermataSala(g, modo ? { modo: modo } : null); else if (modiDi(g).length > 1) schermataModo(g); else schermataHome(); } });
    if (!conAmici && !torn && !inSala) {
      if (online) s._contenuto.appendChild(el("p", { class: "modulo-nota sl-prima", text: "Scegli come giocare, poi apri la stanza: ti do il link da mandare agli amici e vi aspettate insieme nella saletta." }));
    } else if (inSala) {
      s._contenuto.appendChild(el("div", { class: "sala-sommario" }, [
        el("span", { class: "chi", text: "👥 Sala · " + (sala ? sala.membri.length : 1) + " in gioco" }) ]));
    } else {
      s._contenuto.appendChild(el(torn ? "div" : "button", { class: "sala-sommario",
        onclick: torn ? null : function () { schermataSala(g, modo ? { modo: modo } : null); } }, [
        el("span", { class: "chi", text: "👥 " + nomiGruppo().join(", ") }),
        torn ? null : el("span", { class: "modifica", text: "modifica" })
      ]));
    }
    var impostazioni = {}, box = null;
    if (typeof g.impostazioni === "function") {
      box = el("div");
      g.impostazioni(box, impostazioni, { el: el, torneo: torn, sala: inSala, modo: modo });
      if (modo) impostazioni.modo = modo;   // il modo l'avete scelto prima: qui non si cambia
      s._contenuto.appendChild(box);
    }
    if (inSala) s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "In una sala si gioca sempre online: appena cominci, gli altri entrano da soli." }));
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "Come si gioca",
      onclick: function () { schermataRegole(g, function () { schermataPreGioco(g, opts); }); } }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: inSala ? "Comincia per tutti ▶" : (online ? "🔗 Apri la stanza ▶" : "Comincia ▶"), onclick: function () {
      if (inSala) { impostazioni.modo = "online"; return salaLancia(g, impostazioni, box); }
      if (modo) impostazioni.modo = modo;
      // online: le stesse impostazioni restano a portata dell'host nella saletta (tasto "⚙️ Regole")
      if (!conAmici && !torn) { var io = profiloAttivo(), soloIo = [(io && io.nome) || nomiGruppo()[0] || "Giocatore 1"]; ultimaPartita = { gioco: g, impostazioni: impostazioni }; return avviaPartita(g, soloIo, impostazioni, online ? Object.assign({}, opts, { regole: box }) : opts); }   // online o contro il computer: ci sei solo tu (gli altri entrano dal link o sono bot)
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
    giochi.forEach(function (g) { if (!g.soloOnline) griglia.appendChild(tesseraGioco(g, function () { schermataPreGioco(g); })); });
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
  var sala = null;   // host:  { rete, codice, pronta, membri:[{id,nome,emoji,omino}], gioco, stanza, inGioco, torneo }
  var salaG = null;  // ospite: { rete, codice, myId, nome, emoji, membri, inGioco, torneo, _msg }
  // torneo online: { punti:{nome:n}, nomi:[chi ha giocato], n, ultima:{gioco,icona,assegnati}, finito }

  function salaSenzaRete(riprova) {
    var s = schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: schermataHome });
    s._contenuto.appendChild(el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La Sala online funziona quando il gioco è aperto dal sito pubblicato. Da un file locale non è disponibile." }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Ok", onclick: schermataHome }));
    mostra(s);
  }
  function ominoOk(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  // la sala usa la saletta d'attesa dei giochi (stessi personaggi, stesso divano)
  function gSala(torn, E) {
    if (E) { var gg = giocoDa(E.gioco); return { id: "__sala", nome: "Torneo", icona: gg ? gg.icona : "🏆" }; }
    return { id: "__sala", nome: torn ? "Torneo" : "Sala online", icona: torn ? "🏆" : "👥" };
  }

  // ---------- TORNEO ONLINE: classifica che si somma partita dopo partita ----------
  function segnaNomeT(T, nome) { if (T && nome && T.nomi.indexOf(nome) < 0) T.nomi.push(nome); }
  function classificaT(T) {
    return T.nomi.map(function (n) { return { nome: n, punti: T.punti[n] || 0 }; }).sort(function (a, b) { return b.punti - a.punti; });
  }
  function listaT(T, evidenzia) {
    var ol = el("ol", { class: "classifica" }), med = ["🥇", "🥈", "🥉"];
    classificaT(T).forEach(function (r, i) {
      ol.appendChild(el("li", { class: i === 0 && evidenzia ? "vincitore" : "" }, [
        el("span", { class: "pos", text: med[i] || (i + 1) + "°" }), el("span", { class: "nome", text: r.nome }), el("span", { class: "punti", text: r.punti }) ]));
    });
    return ol;
  }
  function boxTorneo(T, host) {
    var box = el("div", { class: "sl-torneo" });
    box.appendChild(el("div", { class: "etichetta", text: T.n ? ("🏆 Classifica del torneo · " + T.n + (T.n === 1 ? " partita" : " partite")) : "🏆 Torneo: ancora nessuna partita" }));
    box.appendChild(listaT(T, T.n > 0));
    if (T.ultima) {
      var chi = T.ultima.assegnati.filter(function (a) { return T.nomi.indexOf(a.nome) >= 0; });
      box.appendChild(el("p", { class: "modulo-nota", text: "Ultima partita: " + T.ultima.icona + " " + T.ultima.gioco + (chi.length ? " — " + chi.map(function (a) { return a.nome + " +" + a.punti; }).join(" · ") : "") }));
    }
    if (host && T.n) box.appendChild(el("button", { class: "btn btn-fantasma", text: "🏁 Chiudi e premia", onclick: function () {
      chiediConferma("Chiudere il torneo e premiare?", "Tutti vedranno il podio finale.", "🏁 Premia", salaTorneoFine);
    } }));
    return box;
  }
  function salaRisultato(g, classifica) {
    var T = sala && sala.torneo; if (!T || !classifica || !classifica.length) return;
    var ass = puntiDaClassifica(g, classifica);
    ass.forEach(function (r) { T.punti[r.nome] = (T.punti[r.nome] || 0) + r.punti; });
    T.n += 1; T.ultima = { gioco: g.nome, icona: g.icona || "🎲", assegnati: ass };
    sala._bcast();
  }
  function schermataPodioT(T, host) {
    var s = schermata({ icona: "🏆", titolo: "Torneo finito!", sotto: T.n + (T.n === 1 ? " partita giocata" : " partite giocate") });
    var cl = classificaT(T);
    if (cl.length) s._contenuto.appendChild(el("div", { class: "sl-campione" }, [ el("div", { class: "sl-camp-cor", text: "👑" }), el("div", { class: "sl-camp-nome", text: cl[0].nome }), el("div", { class: "sl-camp-sotto", text: "vince il torneo con " + cl[0].punti + " punti" }) ]));
    s._contenuto.appendChild(listaT(T, true));
    if (host) {
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Nuovo torneo (stessi amici)", onclick: function () {
        T.punti = {}; T.n = 0; T.ultima = null; T.finito = false; sala._bcast(); disegnaSalaHost();
      } }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Chiudi il torneo", onclick: function () { chiudiSala(); schermataHome(); } }));
    } else {
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: function () { chiudiSalaOspite(); schermataHome(); } }));
    }
    mostra(s);
  }
  function salaTorneoFine() {
    if (!sala || !sala.torneo) return;
    sala.torneo.finito = true; sala._bcast();
    schermataPodioT(sala.torneo, true);
  }

  // ---------- HOST ----------
  // opz.torneo = torneo online: la stessa sala, con la classifica che si somma
  function creaSala(opz) {
    var torn = !!(opz && opz.torneo === true), elimG = (opz && typeof opz.eliminazione === "string") ? opz.eliminazione : null;
    if (!(window.SGNet && SGNet.disponibile())) return salaSenzaRete();
    if (!profiloAttivo()) return schermataAccesso(function () { creaSala(opz); });
    var io = profiloAttivo();
    tieniAcceso(true);   // la Sala: lo schermo resta acceso finché si gioca
    sala = { rete: null, codice: "…", pronta: false, membri: [{ id: "host", nome: io.nome, emoji: io.emoji, omino: io.omino || null }], gioco: null, stanza: null, inGioco: false,
      torneo: torn ? { punti: {}, nomi: [io.nome], n: 0, ultima: null, finito: false } : null,
      elim: elimG ? { gioco: elimG, iniziato: false, finito: false, turni: [], nomi: {}, campione: null, gironi: {} } : null, inPartitaK: null };
    function bcast() { if (sala && sala.rete) sala.rete.invia({ t: "sala", codice: sala.codice, membri: sala.membri, gioco: sala.gioco, stanza: sala.stanza, torneo: sala.torneo, elim: sala.elim }); }
    function agg() {
      bcast(); if (!sala) return;
      if (sala.elim) return seguiHost();   // torneo a eliminazione: la sala si vede solo quando non sto giocando
      if (!sala.inGioco && !(sala.torneo && sala.torneo.finito)) disegnaSalaHost();
    }
    sala._bcast = bcast;
    sala.rete = SGNet.ospita("__sala", {
      onCodice: function (c) { sala.codice = c; agg(); },
      onConnesso: function () { sala.pronta = true; agg(); },
      onAddio: function (id) { sala.membri = sala.membri.filter(function (m) { return m.id !== id; }); if (sala.elim) { if (sala.elim.gironi) delete sala.elim.gironi[id]; elimUscito(id); } agg(); },
      onMsg: function (id, m) {
        if (m && m.t === "esito" && sala.elim) return esitoPartita(m.k, !!m.vinto, id);   // torneo a eliminazione: com'è finita una partita
        if (m && m.t === "girone" && sala.elim) return scegliGironeElim(id, m.g);   // torneo a eliminazione: dove si siede
        if (!m || m.t !== "join") return;
        if (!sala.membri.some(function (x) { return x.id === id; })) {
          var nome = String(m.nome || "Amico").slice(0, 16);
          sala.membri.push({ id: id, nome: nome, emoji: m.emoji || "🙂", omino: ominoOk(m.omino) });
          segnaNomeT(sala.torneo, nome);
        }
        agg();
      },
      onErrore: function () { salaSenzaRete(); }
    });
    disegnaSalaHost();
  }

  function chiudiSala() { try { if (sala && sala.rete) sala.rete.chiudi(); } catch (e) {} sala = null; }

  function disegnaSalaHost() {
    if (!sala) return;
    var T = sala.torneo, E = sala.elim;
    if (T && T.finito) return schermataPodioT(T, true);
    var pronto = sala.codice && sala.codice !== "…", gE = E ? giocoDa(E.gioco) : null;
    saletta(gSala(!!T, E), {
      host: true, codice: sala.codice, pronta: sala.pronta, min: E ? 2 : 1, puoiDaSolo: !E,
      link: pronto ? SG.creaLink({ sala: sala.codice }) : "",
      sotto: E ? "Torneo a eliminazione · " + (gE ? gE.nome : "") : (T ? "Torneo online · un link per tutti i giochi" : "Sala online · un link per tutti i giochi"),
      confermaEsci: (T || E) ? "Chiudere il torneo per tutti?" : "Chiudere la sala per tutti?",
      giocatori: sala.membri.map(function (m) { return { id: m.id, nome: m.nome, omino: m.omino || null, host: m.id === "host", tu: m.id === "host" }; }),
      extra: E ? [boxElim(E, "host", true, sala, seguiHost)] : (T ? [boxTorneo(T, true)] : []),
      testoComincia: E ? (E.finito ? "↻ Nuovo torneo (stessi amici)" : (E.iniziato ? "Torneo in corso…" : "🏆 Comincia il torneo")) : (T ? (T.n ? "🎮 Prossimo gioco" : "🎮 Scegli il primo gioco") : "🎮 Scegli un gioco"),
      puoComincia: E ? (!E.iniziato || E.finito) : undefined,
      nota: E ? (E.iniziato && !E.finito ? "Le partite si aprono da sole sul telefono di chi gioca." : "Ognuno tocca il girone in cui vuole giocare. Quando siete pronti, fai partire il torneo.")
        : "Scegli un gioco: parte da solo sul telefono di tutti. A fine partita si torna qui.",
      onComincia: E ? function () { if (E.finito) nuovoElim(); else avviaElim(); } : salaScegliGioco,
      onRegole: E ? function () { sala._bcast(); } : undefined,
      onEsci: function () { chiudiSala(); schermataHome(); }
    }, E ? regoleElim() : null);
  }

  function salaScegliGioco() {
    var T = sala && sala.torneo;
    var s = schermata({ icona: "🎮", titolo: T ? "Quale gioco?" : "Scegli un gioco", sotto: T ? "Parte per tutti · più è difficile, più punti vale" : "Parte per tutta la sala", indietro: disegnaSalaHost });
    var griglia = el("div", { class: "griglia-giochi" });
    giochi.forEach(function (g) { if (giocoOnline(g)) griglia.appendChild(tesseraGioco(g, function () { schermataPreGioco(g, { sala: true }); })); });
    s._contenuto.appendChild(griglia);
    mostra(s);
  }

  function salaLancia(g, impostazioni, box) {
    if (!sala) return schermataHome();
    SGNet.chiudiGiochi();                     // se era rimasta aperta la stanza del gioco di prima, si chiude
    var C = SGNet.nuovoCodice();
    SGNet._forza = C;                         // il gioco userà QUESTO codice stanza
    sala.gioco = g.id; sala.stanza = C; sala.inGioco = true;
    sala._bcast();                            // dice agli altri quale gioco aprire e con che codice
    var ctx = {
      // si torna in sala: prima lo dico a tutti (tornano da soli), poi chiudo la stanza del gioco
      esci: function () { if (!sala) return schermataHome(); sala.gioco = null; sala.stanza = null; sala.inGioco = false; sala._bcast(); SGNet.chiudiGiochi(1500); disegnaSalaHost(); },
      // la partita è finita: nel torneo si sommano i punti
      risultato: function (g2, classifica) { salaRisultato(g2, classifica); },
      fine: function (g2, classifica) { salaRisultato(g2, classifica); salaFine(g2, classifica, ctx); }
    };
    var vecchio = linkParams; linkParams = {};      // l'host apre da host, non da ospite
    avviaPartita(g, [sala.membri[0].nome], impostazioni, { regole: box }, ctx);
    linkParams = vecchio;
  }

  function salaFine(g, classifica, ctx) {
    var T = sala && sala.torneo, punti = {};
    if (T && T.ultima) T.ultima.assegnati.forEach(function (a) { punti[a.nome] = a.punti; });
    var s = schermata({ icona: "🏆", titolo: T ? "Punti di questa partita" : "Fine partita", sotto: g.nome });
    var ol = el("ol", { class: "classifica" }), med = ["🥇", "🥈", "🥉"];
    (classifica || []).forEach(function (r, i) {
      ol.appendChild(el("li", { class: i === 0 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: med[i] || (i + 1) + "°" }),
        el("span", { class: "nome", text: r.nome }),
        T && punti[r.nome] != null ? el("span", { class: "punti", text: "+" + punti[r.nome] }) : (r.punti != null ? el("span", { class: "punti", text: r.punti }) : null) ]));
    });
    s._contenuto.appendChild(ol);
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: T ? "🏆 Classifica del torneo" : "👥 Torna alla sala", onclick: ctx.esci }));
    mostra(s);
  }

  // ---------- OSPITE ----------
  function salaOspite(codice) {
    if (!(window.SGNet && SGNet.disponibile())) return salaSenzaRete();
    ricordaStanza({ sala: String(codice).toUpperCase() });   // se la pagina si ricarica, si rientra nella sala
    tieniAcceso(true);
    var io = profiloAttivo();
    if (!io) return nomeOspiteSala(codice);   // senza profilo si entra lo stesso: basta il nome
    entraInSala(codice, io.nome, io.emoji, io.omino || null);
  }
  // chi apre il link della sala (o del torneo) senza profilo: scrive il nome ed entra subito
  function nomeOspiteSala(codice) {
    var s = schermata({ icona: "👥", titolo: "Entra con gli amici", sotto: "Codice " + String(codice).toUpperCase(), indietro: schermataHome });
    var ultimo = ""; try { ultimo = localStorage.getItem("sg-nome-ospite") || ""; } catch (e) {}
    var input = el("input", { class: "link-campo", type: "text", maxlength: "16", placeholder: "Come ti chiami?" });
    input.value = ultimo;
    var avviso = el("div", { class: "link-avviso" });
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Scrivi il tuo nome ed entri subito, il profilo non serve. Se ce l'hai, accedi: avrai il tuo personaggio e i trofei." }));
    s._contenuto.appendChild(input); s._contenuto.appendChild(avviso);
    function entra() {
      var n = (input.value || "").trim().slice(0, 16);
      if (n.length < 2) { avviso.textContent = "Scrivi il tuo nome."; return; }
      try { localStorage.setItem("sg-nome-ospite", n); } catch (e) {}
      audioCtx();
      entraInSala(codice, n, "🙂", window.SGOmino ? SGOmino.casuale(n) : null);
    }
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") entra(); });
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: entra }));
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "👤 Ho un profilo: accedi", onclick: function () { schermataAccesso(function () { salaOspite(codice); }); } }));
    mostra(s);
  }
  function entraInSala(codice, nome, emoji, omino) {
    salaG = { rete: null, codice: String(codice).toUpperCase(), myId: null, nome: nome, emoji: emoji, omino: omino, membri: [], inGioco: null, torneo: null, podio: false, _msg: null };
    attendiSala();
    salaG.rete = SGNet.entra(salaG.codice, {
      onAperto: function (id) { salaG.myId = id; salaG.rete.invia({ t: "join", nome: salaG.nome, emoji: salaG.emoji, omino: salaG.omino || null });
        setTimeout(function () { if (salaG && !salaG.membri.length && salaG._msg) salaG._msg.textContent = "Non trovo la sala: controlla il codice o attendi l'host…"; }, 8000); },
      onMsg: function (m) {
        if (!salaG || !m || m.t !== "sala") return;
        salaG.membri = m.membri || []; salaG.torneo = m.torneo || null; salaG.elim = m.elim || null;
        if (salaG.elim) return seguiOspite();   // torneo a eliminazione: si apre da sola la mia partita
        if (m.gioco && m.stanza) {
          if (salaG.inGioco !== m.stanza) { salaG.inGioco = m.stanza; salaG.podio = false; salaLanciaOspite(m.gioco, m.stanza); }
          return;
        }
        if (salaG.inGioco !== null) { salaG.inGioco = null; SGNet.chiudiGiochi(); }   // tornati in sala: il collegamento del gioco si chiude
        if (salaG.torneo && salaG.torneo.finito) { if (!salaG.podio) { salaG.podio = true; schermataPodioT(salaG.torneo, false); } return; }
        salaG.podio = false;
        disegnaSalaOspite();
      },
      onChiuso: function () { chiudiSalaOspite(); errore(schermataHome, "La sala è stata chiusa dall'host."); },
      onErrore: function () { chiudiSalaOspite(); errore(schermataHome, "Problema di collegamento con la sala. Riprova."); }
    }, { tieni: true });   // resta aperta tra un gioco e l'altro
  }

  function chiudiSalaOspite() { try { if (salaG && salaG.rete) salaG.rete.chiudi(); } catch (e) {} salaG = null; dimenticaStanza(); }

  function attendiSala() {
    var s = schermata({ icona: "👥", titolo: "Entro nella sala…", sotto: "Codice " + salaG.codice,
      indietro: function () { chiudiSalaOspite(); schermataHome(); } });
    salaG._msg = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" });
    s._contenuto.appendChild(salaG._msg);
    mostra(s);
  }

  function disegnaSalaOspite() {
    if (!salaG) return;
    var T = salaG.torneo, E = salaG.elim;
    saletta(gSala(!!T, E), {
      host: false, codice: salaG.codice,
      sotto: (E ? "Torneo a eliminazione" : (T ? "Torneo online" : "Sala online")) + " · codice " + salaG.codice,
      giocatori: salaG.membri.map(function (m) { return { id: m.id, nome: m.nome, omino: m.omino || null, host: m.id === "host", tu: m.id === salaG.myId }; }),
      extra: E ? [boxElim(E, salaG.myId, false, salaG, seguiOspite)] : (T ? [boxTorneo(T, false)] : []),
      attesa: E ? (E.iniziato ? "Quando tocca a te, la partita si apre da sola." : "Tocca il girone in cui vuoi giocare, poi aspetta che l'host faccia partire il torneo.") : "Aspetta che l'host scelga un gioco: parte da solo sul tuo telefono.",
      onEsci: function () { chiudiSalaOspite(); schermataHome(); }
    });
    salaG._msg = null;
  }

  function salaLanciaOspite(gid, code) {
    SGNet.chiudiGiochi();   // il collegamento del gioco di prima (se c'è) si chiude: niente errori a sorpresa
    var g = giochi.filter(function (x) { return x.id === gid; })[0];
    if (!g) { disegnaSalaOspite(); return; }
    var vecchio = linkParams;
    linkParams = { gioco: gid, stanza: code };   // il gioco lo legge subito (t.linkParams)
    var ctx = {
      esci: function () { SGNet.chiudiGiochi(); if (salaG) salaG.inGioco = null; disegnaSalaOspite(); },
      fine: function () { SGNet.chiudiGiochi(); if (salaG) salaG.inGioco = null; disegnaSalaOspite(); }
    };
    avviaPartita(g, [], {}, null, ctx);
    linkParams = vecchio;
  }

  // =========================================================
  //  TORNEO A ELIMINAZIONE (giochi a due: Tris, Drop 4…)
  //  Un link solo: si sorteggiano le coppie, chi vince va avanti.
  //  Primo turno con un numero dispari: l'ultimo gioca contro il bot medio.
  //  Nei turni dopo, chi resta senza avversario passa il turno.
  //  Ogni partita è una stanza a parte tra i due: il primo la apre, l'altro
  //  entra da solo; chi l'ha aperta (o chi gioca col bot) dice chi ha vinto.
  //  L'host della sala può decidere a mano una partita bloccata.
  // =========================================================
  var GIOCHI_ELIMINAZIONE = { tris: 1, drop4: 1, navale: 1, scopa: 1 };
  var MAX_ELIM = 10;   // giocano i primi 10 entrati in sala; gli altri guardano
  function giocoDa(id) { return giochi.filter(function (g) { return g.id === id; })[0] || null; }
  function nomeElim(E, id) { return id === "bot" ? "🤖 Bot (medio)" : ((E.nomi && E.nomi[id]) || "…"); }
  // ha già avuto un turno facile (ha giocato col bot o è passato senza giocare)
  function favoritoElim(E, id) {
    return E.turni.some(function (tu) { return tu.some(function (p) { return p.a === id && (!p.b || p.b === "bot"); }); });
  }
  function creaTurnoElim(E, ids, primo) {
    var r = E.turni.length, tu = [], solo = null;
    ids = ids.slice();
    if (ids.length % 2) {
      // di solito resta solo l'ultimo; dopo il primo turno, se possibile, uno che non ha già avuto un turno facile
      var j = ids.length - 1;
      if (!primo) { while (j >= 0 && favoritoElim(E, ids[j])) j--; if (j < 0) j = ids.length - 1; }
      solo = ids.splice(j, 1)[0];
    }
    for (var i = 0; i + 1 < ids.length; i += 2) tu.push({ a: ids[i], b: ids[i + 1], stanza: SGNet.nuovoCodice(), vince: null });
    if (solo) tu.push(primo ? { a: solo, b: "bot", stanza: SGNet.nuovoCodice(), vince: null } : { a: solo, b: null, vince: solo });   // primo turno: col bot medio (la sua stanza serve a chi guarda); poi: passa il turno
    tu.forEach(function (p, j) { p.k = r + "-" + j; });
    E.turni.push(tu);
  }
  // ---- i gironi: prima di partire ognuno sceglie dove sedersi (all'inizio sono tutti in panchina) ----
  var N_GIRONI = MAX_ELIM / 2;   // 5 gironi da 2 posti
  function chiNelGirone(E, n) { return Object.keys(E.gironi || {}).filter(function (id) { return E.gironi[id] === n; }); }
  function scegliGironeElim(id, n) {   // n = 1..5, 0 = panchina
    var E = sala && sala.elim; if (!E || E.iniziato) return;
    if (!sala.membri.some(function (m) { return m.id === id; })) return;
    n = Math.floor(+n) || 0; if (n < 0 || n > N_GIRONI) return;
    E.gironi = E.gironi || {};
    if (n && E.gironi[id] !== n && chiNelGirone(E, n).length >= 2) return;   // girone pieno
    delete E.gironi[id];   // (così chi si risiede va in fondo al girone)
    if (n) E.gironi[id] = n;
    sala._bcast(); seguiHost();
  }
  // i gironi alla partenza: chi è in panchina va a caso nei posti liberi (prima accanto a chi è solo),
  // due rimasti soli si sfidano tra loro, e se ne resta uno solo gioca col bot. Al massimo 10: gli altri guardano.
  function gironiElim(E) {
    var dentro = {}; sala.membri.forEach(function (m) { dentro[m.id] = 1; });
    var G = [];
    for (var n = 1; n <= N_GIRONI; n++) { var g = chiNelGirone(E, n).filter(function (id) { return dentro[id]; }).slice(0, 2); g.n = n; G.push(g); }
    var panca = mischia(sala.membri.map(function (m) { return m.id; }).filter(function (id) { return !(E.gironi && E.gironi[id]); }));
    G.forEach(function (g) { if (g.length === 1 && panca.length) g.push(panca.shift()); });
    G.forEach(function (g) { while (g.length < 2 && panca.length) g.push(panca.shift()); });
    var soli = G.filter(function (g) { return g.length === 1; });
    for (var i = 0; i + 1 < soli.length; i += 2) soli[i].push(soli[i + 1].pop());
    return G.filter(function (g) { return g.length; });
  }
  function avviaElim() {
    var E = sala && sala.elim; if (!E || (E.iniziato && !E.finito) || sala.membri.length < 2) return;
    var G = gironiElim(E), nomi = {};
    sala.membri.forEach(function (m) { nomi[m.id] = m.nome; });
    E.nomi = {}; G.forEach(function (g) { g.forEach(function (id) { E.nomi[id] = nomi[id]; }); });
    E.turni = []; E.campione = null; E.iniziato = true; E.finito = false;
    // primo turno: un girone = una partita (chi è rimasto solo gioca col bot medio); poi chi vince il girone 1 sfida chi vince il 2, ecc.
    var tu = G.map(function (g, j) { return { k: "0-" + j, girone: g.n, a: g[0], b: g[1] || "bot", stanza: SGNet.nuovoCodice(), vince: null }; });
    E.turni.push(tu);
    sala._bcast(); seguiHost();
  }
  function nuovoElim() {
    var E = sala && sala.elim; if (!E) return;
    E.iniziato = false; E.finito = false; E.turni = []; E.campione = null; sala.inPartitaK = null; sala.fuoriK = null; sala.guardaK = null;
    sala._bcast(); seguiHost();
  }
  function trovaPartitaElim(E, k) {
    for (var r = 0; r < E.turni.length; r++) for (var j = 0; j < E.turni[r].length; j++) if (E.turni[r][j].k === k) return E.turni[r][j];
    return null;
  }
  // com'è finita una partita: lo dice chi l'ha aperta (o chi giocava col bot), oppure l'host a mano
  function esitoPartita(k, vinto, daId) {
    var E = sala && sala.elim; if (!E || !E.iniziato || E.finito) return;
    var p = trovaPartitaElim(E, k); if (!p || p.vince) return;
    if (daId !== p.a && daId !== "host") return;
    p.vince = vinto ? p.a : p.b;
    avanzaElim();
  }
  function avanzaElim() {
    var E = sala.elim, tu = E.turni[E.turni.length - 1];
    if (tu && tu.every(function (p) { return p.vince; })) {
      var dentro = {}; sala.membri.forEach(function (m) { dentro[m.id] = 1; });
      var avanti = tu.map(function (p) { return p.vince; }).filter(function (v) { return v !== "bot" && dentro[v]; });
      if (avanti.length <= 1) { E.finito = true; E.campione = avanti[0] || null; }
      else creaTurnoElim(E, avanti, false);
    }
    sala._bcast(); seguiHost();
  }
  // chi esce dalla sala a torneo iniziato: se stava giocando, vince l'altro (contro il bot, vince il bot)
  function elimUscito(id) {
    var E = sala.elim; if (!E || !E.iniziato || E.finito) return;
    var tu = E.turni[E.turni.length - 1] || [], cambiato = false;
    tu.forEach(function (p) { if (!p.vince && (p.a === id || p.b === id)) { p.vince = (p.a === id) ? (p.b || "bot") : p.a; cambiato = true; } });
    if (cambiato) avanzaElim();
  }
  function miaPartitaElim(E, mioId) {
    if (!E || !E.iniziato || E.finito) return null;
    var tu = E.turni[E.turni.length - 1] || [];
    for (var j = 0; j < tu.length; j++) { var p = tu[j]; if (!p.vince && p.b && (p.a === mioId || p.b === mioId)) return p; }
    return null;
  }
  function eliminatoElim(E, id) {
    return E.turni.some(function (tu) { return tu.some(function (p) { return p.vince && p.vince !== id && (p.a === id || p.b === id); }); });
  }
  // su ogni telefono: se tocca a me si apre da sola la mia partita; quando è decisa, si torna al tabellone
  function seguiTabellone(S, mioId, mioNome, mostraSala, diEsito) {
    S._mostra = mostraSala; S._mioId = mioId;
    aggiornaTabelloneElim();   // il tabellone aperto sopra una partita si aggiorna da solo
    var p = miaPartitaElim(S.elim, mioId);
    if (p) {
      if (S.inPartitaK !== p.k) { clearTimeout(S.tTorna); S.tTorna = null; S.guardaK = null; S.inPartitaK = p.k; S.fuoriK = null; giocaPartitaElim(S, p, mioId, mioNome, mostraSala, diEsito); }
      else if (S.fuoriK === p.k) mostraSala();   // è uscito dalla sua partita: vede il tabellone, col tasto per rientrare
      return;
    }
    if (S.inPartitaK) {   // la mia partita è appena decisa: si vede chi ha vinto, poi si torna al tabellone
      var giaFuori = S.fuoriK === S.inPartitaK;   // (se ero già uscito dalla partita, si aggiorna subito)
      S.inPartitaK = null; S.fuoriK = null;
      if (giaFuori) return tornaTabelloneElim(S);
      S.tTorna = setTimeout(function () { S.tTorna = null; tornaTabelloneElim(S, 2500); }, 2500);
      return;
    }
    if (S.guardaK) {   // sto guardando una partita: resto lì finché non è decisa, poi si torna al tabellone
      var w = S.elim && S.elim.iniziato ? trovaPartitaElim(S.elim, S.guardaK) : null;
      if (w && !w.vince && w.stanza === S.guardaStanza) return;
      S.guardaK = null;
      S.tTorna = setTimeout(function () { S.tTorna = null; tornaTabelloneElim(S); }, 2500);
      return;
    }
    if (S.tTorna) return;
    tornaTabelloneElim(S);
  }
  // si torna al tabellone: la partita lasciata non può più disegnare. ritardo: chi aveva aperto la stanza
  // la chiude un po' dopo, così l'avversario e chi guardava tornano al tabellone prima (niente "collegamento perso")
  function tornaTabelloneElim(S, ritardo) {
    lasciaPartita(); chiudiTabelloneElim(); SGNet.chiudiGiochi(ritardo || 0);
    if (window.SGMusica && SGMusica.ferma) SGMusica.ferma();   // la musica della Scopa
    if (S._mostra) S._mostra();
  }
  function seguiHost() { if (sala && sala.elim) seguiTabellone(sala, "host", sala.membri[0].nome, disegnaSalaHost, function (k, v) { esitoPartita(k, v, "host"); }); }
  function seguiOspite() { if (salaG && salaG.elim) seguiTabellone(salaG, salaG.myId, salaG.nome, disegnaSalaOspite, function (k, v) { if (salaG && salaG.rete) salaG.rete.invia({ t: "esito", k: k, vinto: v }); }); }
  // ⚙️ Regole del torneo: le impostazioni del gioco (es. i punti da raggiungere nella Scopa), uguali per tutte le partite.
  // Il riquadro resta sul telefono dell'host; i valori (E.imp) viaggiano con la sala.
  function regoleElim() {
    var E = sala && sala.elim, g = E && giocoDa(E.gioco);
    if (!g || !g.impostazioni) return null;
    if (!sala.regoleElim) {
      var imp = {}, box = el("div", {});
      g.impostazioni(box, imp, { el: el, sala: true, modo: "online" });
      E.imp = imp; sala.regoleElim = { box: box, imp: imp };
    }
    return haRegole(sala.regoleElim.box) ? sala.regoleElim : null;
  }
  function giocaPartitaElim(S, p, mioId, mioNome, mostraSala, diEsito) {
    var g = giocoDa(S.elim.gioco); if (!g) return mostraSala();
    chiudiTabelloneElim(); SGNet.chiudiGiochi();
    function fuori() { S.fuoriK = p.k; tornaTabelloneElim(S); }
    var ctx = {
      esci: fuori, fine: fuori,
      tabellone: function (s) { tastoTabellone(s, S); },
      // la partita dice chi ha vinto: lo riferisce solo chi l'ha aperta (o chi gioca col bot). Pari = si rigioca
      risultato: function (g2, cl) {
        if (p.a !== mioId) return;
        var primi = (cl || []).filter(function (r) { return (r.pos || 1) === 1; });
        if (primi.length === 1) diEsito(p.k, primi[0].nome === mioNome);
      }
    };
    var vecchio = linkParams;
    if (p.b === "bot") {
      // la partita col bot la possono guardare anche gli altri: questo telefono la trasmette nella stanza della partita
      var rete = null, ultimo = null;
      ctx.trasmetti = function (msg) {
        ultimo = msg;
        if (!rete && p.stanza) { SGNet._forza = p.stanza; rete = SGNet.ospita(g.id, { onConnesso: function () { if (rete && ultimo) rete.invia(ultimo); } }); }
        if (rete) rete.invia(msg);
      };
      linkParams = {}; avviaPartita(g, [mioNome], Object.assign({}, S.elim.imp || {}, { modo: "bot", difficolta: "medio" }), null, ctx);
    }
    else if (p.a === mioId) { linkParams = {}; SGNet._forza = p.stanza; avviaPartita(g, [mioNome], Object.assign({}, S.elim.imp || {}, { modo: "online" }), null, ctx); }
    else { linkParams = { gioco: g.id, stanza: p.stanza }; avviaPartita(g, [], {}, null, ctx); }
    linkParams = vecchio;
  }
  // chi non sta giocando guarda in diretta la partita di altri (anche quella col bot), senza poter toccare
  function guardaPartitaElim(S, p) {
    var g = giocoDa(S.elim && S.elim.gioco); if (!g || !p.stanza) return;
    chiudiTabelloneElim(); SGNet.chiudiGiochi();
    clearTimeout(S.tTorna); S.tTorna = null;
    S.guardaK = p.k; S.guardaStanza = p.stanza;
    var attivo = true;
    function via() { if (!attivo) return; attivo = false; if (S.guardaK === p.k) S.guardaK = null; clearTimeout(S.tTorna); S.tTorna = null; tornaTabelloneElim(S); }
    var ctx = { esci: via, fine: via, risultato: function () {}, tabellone: function (s) { tastoTabellone(s, S); } };
    var vecchio = linkParams;
    linkParams = { gioco: g.id, stanza: p.stanza, guarda: 1 };
    avviaPartita(g, [], {}, null, ctx);
    linkParams = vecchio;
  }
  // il tabellone sopra la partita (tasto 🏆 in alto): si aggiorna da solo finché resta aperto
  var FT = null;
  function tastoTabellone(s, S) {
    if (!s || s.querySelector(".tab-elim")) return;
    var b = el("button", { class: "tab-elim", "aria-label": "Tabellone del torneo", text: "🏆", onclick: function () { apriTabelloneElim(S); } });
    var testa = s.querySelector(".testa");
    if (testa && !s.classList.contains("senza-testa")) { b.classList.add("in-testa"); b.textContent = "🏆 Tabellone"; testa.appendChild(b); }
    else s.appendChild(b);   // nei giochi (senza titolo): piccolo, nell'angolo in alto a destra
  }
  function apriTabelloneElim(S) {
    if (FT || !S.elim) return;
    var corpo = el("div", { class: "sl-foglio-corpo" });
    var velo = el("div", { class: "sl-velo", onclick: function (e) { if (e.target === velo) chiudiTabelloneElim(); } }, [
      el("div", { class: "sl-foglio" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: "🏆 Tabellone" }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudiTabelloneElim }) ]),
        corpo,
        el("button", { class: "btn btn-primario", text: "Torna alla partita", onclick: chiudiTabelloneElim })
      ])
    ]);
    FT = { S: S, corpo: corpo, velo: velo };
    aggiornaTabelloneElim();
    if (FT) document.body.appendChild(velo);
  }
  function chiudiTabelloneElim() { if (!FT) return; if (FT.velo.parentNode) FT.velo.parentNode.removeChild(FT.velo); FT = null; }
  function aggiornaTabelloneElim() {
    if (!FT) return;
    var S = FT.S; if (!S.elim || !S.elim.iniziato) return chiudiTabelloneElim();
    svuota(FT.corpo);
    FT.corpo.appendChild(boxElim(S.elim, S._mioId, S === sala, S, S === sala ? seguiHost : seguiOspite));
  }
  function nomeTurnoElim(nGioc) { return nGioc <= 2 ? "Finale" : (nGioc <= 4 ? "Semifinali" : (nGioc <= 8 ? "Quarti di finale" : "Primo turno")); }
  // il tabellone (nella saletta): il mio stato, poi i turni dal più recente
  function boxElim(E, mioId, host, S, segui) {
    var box = el("div", { class: "sl-torneo" });
    if (!E.iniziato) {   // prima di partire: ognuno sceglie il suo girone (all'inizio sono tutti in panchina)
      var membri = (S && S.membri) || [], gir = E.gironi || {};
      function chiamo(m) { return m.id === mioId ? "Tu" : m.nome; }
      function siedi(n) { if (host) scegliGironeElim(mioId, n); else if (S && S.rete) S.rete.invia({ t: "girone", g: n }); }
      box.appendChild(el("div", { class: "etichetta", text: "🏆 Scegli il tuo girone" }));
      var griglia = el("div", { class: "sl-gironi" });
      for (var gN = 1; gN <= N_GIRONI; gN++) (function (n) {
        var chi = membri.filter(function (m) { return gir[m.id] === n; }), mio = gir[mioId] === n;
        var b = el("button", { class: "sl-girone" + (mio ? " mio" : ""), onclick: function () { siedi(mio ? 0 : n); } }, [
          el("b", { text: "Girone " + n }),
          el("span", { class: chi[0] ? "" : "libero", text: chi[0] ? chiamo(chi[0]) : "posto libero" }),
          el("span", { class: chi[1] ? "" : "libero", text: chi[1] ? chiamo(chi[1]) : "posto libero" }) ]);
        if (chi.length >= 2 && !mio) { b.disabled = true; b.classList.add("pieno"); }
        griglia.appendChild(b);
      })(gN);
      var panca = membri.filter(function (m) { return !gir[m.id]; });
      griglia.appendChild(el("button", { class: "sl-girone panca" + (!gir[mioId] ? " mio" : ""), onclick: function () { siedi(0); } }, [
        el("b", { text: "🪑 Panchina" }), el("span", { class: panca.length ? "" : "libero", text: panca.length ? panca.map(chiamo).join(", ") : "nessuno" }) ]));
      box.appendChild(griglia);
      box.appendChild(el("p", { class: "modulo-nota", text: "Tocca un girone per sederti: chi vince il girone 1 sfida chi vince il 2, e così via fino alla finale. Chi resta in panchina viene messo a caso nei posti liberi; se uno resta solo, gioca contro il bot medio." }));
      if (membri.length > MAX_ELIM) box.appendChild(el("p", { class: "modulo-nota", text: "Siete in " + membri.length + ": i posti sono " + MAX_ELIM + ", chi resta in panchina guarda le partite 👀" }));
      return box;
    }
    var mia = miaPartitaElim(E, mioId), stato;
    if (E.finito) stato = E.campione ? "🏆 Campione: " + nomeElim(E, E.campione) + (E.campione === mioId ? " (sei tu!)" : "") : "Torneo finito";
    else if (mia) stato = "▶️ Tocca a te contro " + nomeElim(E, mia.a === mioId ? mia.b : mia.a);
    else if (!(E.nomi && E.nomi[mioId])) stato = "👀 Guardi il torneo: tocca «Guarda» su una partita";
    else if (eliminatoElim(E, mioId)) stato = "Sei fuori: puoi guardare le partite 👀";
    else stato = "Passi al turno dopo: intanto guarda gli altri ⏳";
    box.appendChild(el("div", { class: "sl-elim-stato", text: stato }));
    if (mia && S.fuoriK === mia.k) box.appendChild(el("button", { class: "btn btn-primario", text: "🔁 Rientra nella tua partita", onclick: function () { S.inPartitaK = null; S.fuoriK = null; segui(); } }));
    for (var r = E.turni.length - 1; r >= 0; r--) {
      var tu = E.turni[r], nG = 0;
      tu.forEach(function (p) { nG += p.b ? 2 : 1; });
      box.appendChild(el("div", { class: "etichetta", text: nomeTurnoElim(nG) + (r === E.turni.length - 1 && !E.finito ? " · si gioca ora" : "") }));
      tu.forEach(function (p) {
        var riga = el("div", { class: "sl-elim-riga" + ((p.a === mioId || p.b === mioId) ? " mia" : "") });
        if (p.girone) riga.appendChild(el("span", { class: "sl-elim-g", text: "G" + p.girone }));   // il girone scelto (primo turno)
        if (!p.b) riga.appendChild(el("span", { text: nomeElim(E, p.a) + " passa il turno" }));
        else {
          riga.appendChild(el("span", { class: p.vince === p.a ? "vince" : (p.vince ? "perde" : ""), text: nomeElim(E, p.a) }));
          riga.appendChild(el("span", { class: "vs", text: "🆚" }));
          riga.appendChild(el("span", { class: p.vince === p.b ? "vince" : (p.vince ? "perde" : ""), text: nomeElim(E, p.b) }));
          if (!p.vince) {   // chi non sta giocando può guardarla in diretta
            if (S && S.guardaK === p.k) riga.appendChild(el("span", { class: "stato", text: "👀 la stai guardando" }));
            else if (!mia && !E.finito && p.stanza && p.a !== mioId && p.b !== mioId) riga.appendChild(el("button", { class: "sl-elim-guarda", text: "👀 Guarda", onclick: function () { guardaPartitaElim(S, p); } }));
            else riga.appendChild(el("span", { class: "stato", text: "in corso…" }));
          }
          if (host && !p.vince && !E.finito) riga.appendChild(el("div", { class: "sl-elim-decidi" }, [   // se una partita si blocca, decide l'host
            el("span", { text: "Bloccata? Passa:" }),
            el("button", { text: nomeElim(E, p.a), onclick: function () { esitoPartita(p.k, true, "host"); } }),
            el("button", { text: nomeElim(E, p.b), onclick: function () { esitoPartita(p.k, false, "host"); } })
          ]));
        }
        box.appendChild(riga);
      });
    }
    return box;
  }

  function errore(dopo, txt) {
    var s = schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: dopo }));
    mostra(s);
  }

  // =========================================================
  //  COME GIOCATE? — la prima scelta, prima di tutto il resto.
  //  Ogni gioco dice i suoi modi "qui" (g.modi: un telefono, contro il computer…);
  //  se si può giocare online si aggiunge da solo "Online".
  //  amici: true = poi si aggiungono gli amici (solo per chi gioca sullo stesso telefono).
  // =========================================================
  var MODO_ELIMINAZIONE = { modo: "eliminazione", icona: "🏆", nome: "Torneo a eliminazione", sotto: "Fino a 10 amici: sfide a due, chi vince va avanti" };
  var MODO_ONLINE = { modo: "online", icona: "🔗", nome: "Online: apro io la stanza", sotto: "Ognuno dal suo telefono: mandi il link agli amici" };
  var MODO_CODICE = { modo: "codice", icona: "🔑", nome: "Online: ho un codice", sotto: "Ti hanno invitato? Entra nella loro stanza" };
  function modiDi(g) {
    var m = (g && g.modi) ? g.modi.slice() : [];
    if (giocoOnline(g)) m.push(MODO_ONLINE);
    if (g && GIOCHI_ELIMINAZIONE[g.id]) m.push(MODO_ELIMINAZIONE);
    return m;
  }
  function modoDi(g, modo) { return modiDi(g).filter(function (m) { return m.modo === modo; })[0] || null; }
  function schermataModo(g) {
    var s = schermata({ icona: g.icona, titolo: g.nome, sotto: "Come giocate?", indietro: schermataHome });
    var io = profiloAttivo(), griglia = el("div", { class: "modo-scelta" });
    var modi = modiDi(g);
    if (giocoOnline(g)) modi.splice(modi.indexOf(MODO_ONLINE) + 1, 0, MODO_CODICE);   // subito sotto "Online": chi è invitato entra col codice
    modi.forEach(function (m) {
      griglia.appendChild(el("button", { class: "modo-grande" + (m.modo === "online" ? " online" : ""), onclick: function () { sceltoModo(g, m); } }, [
        el("div", { class: "mg-ico", text: m.icona }),
        el("div", { class: "mg-testo" }, [ el("div", { class: "mg-tit", text: m.nome }), el("div", { class: "mg-sotto", text: m.sotto || "" }) ]),
        el("div", { class: "mg-freccia", text: "›" })
      ]));
    });
    s._contenuto.appendChild(griglia);
    if (io && io.omino && window.SGOmino) s._contenuto.appendChild(el("div", { class: "modo-avatar", html: SGOmino.svg(io.omino) }));
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "Come si gioca", onclick: function () { schermataRegole(g, function () { schermataModo(g); }); } }));
    mostra(s);
  }
  function sceltoModo(g, m) {
    if (m.modo === "codice") return entraConCodice(function () { schermataModo(g); });   // invitato: si entra nella stanza di un altro
    if (m.modo === "eliminazione") return creaSala({ eliminazione: g.id });   // un link solo, coppie sorteggiate, chi vince va avanti
    if (m.amici) return schermataSala(g, { modo: m.modo });   // sullo stesso telefono: prima gli amici, poi le impostazioni
    schermataPreGioco(g, { modo: m.modo });                  // contro il computer / online: subito le impostazioni
  }

  // =========================================================
  //  SALETTA D'ATTESA ONLINE — uguale per tutti i giochi (t.lobby).
  //  Chi è entrato aspetta coi personaggi in una saletta: respirano, sbattono le palpebre,
  //  ogni tanto salutano o saltano; chi arriva entra con un saltello e dice "Ciao!".
  //  Chi ospita vede in alto codice e "Manda il link", in fondo "Comincia".
  //  o: { host, codice, pronta (false = sto aprendo), giocatori: [{ id, nome, omino, bot, host, tu }],
  //       min, vuoti (posti liberi da mostrare), onComincia, onEsci, attesa (testo per chi aspetta),
  //       extra: [nodi del gioco, es. scelta dei posti], nota, testoComincia }
  //  Si aggiorna al suo posto (niente lampeggio): i personaggi già dentro restano, i nuovi entrano.
  // =========================================================
  var SL = { ultimo: null, timer: null };
  function chiavePers(p, i) { return String(p.id != null ? p.id : (p.nome || i)); }
  function condividiLink(link, g, bottone) {
    var fatto = function () { if (!bottone) return; var t0 = bottone.innerHTML; bottone.innerHTML = "✅ Link copiato!"; setTimeout(function () { bottone.innerHTML = t0; }, 1800); };
    var invito = g.id === "__sala" ? (g.nome === "Torneo" ? "Vieni al torneo!" : "Vieni a giocare con noi!") : "Giochiamo a " + g.nome + "!";
    // il codice nel messaggio: chi ha già l'app la apre e lo scrive in "🔑 Ho un codice" (il link a volte si apre nel browser, non nell'app)
    var m = /(?:stanza|sala)=([A-Za-z0-9]+)/.exec(link || ""), codice = m ? m[1].toUpperCase() : "";
    if (codice) invito += "\nHai l'app? Aprila, tocca «🔑 Ho un codice» e scrivi: " + codice + "\nSe no, entra da qui:";
    else invito += " Entra qui:";
    if (navigator.share) { navigator.share({ title: g.nome, text: invito, url: link }).catch(function () {}); return; }
    try { navigator.clipboard.writeText(invito + "\n" + link).then(fatto, fatto); } catch (e) { fatto(); }
  }
  // le impostazioni hanno qualcosa da scegliere (a vista) anche online? Se no, niente tasto "Regole"
  function haRegole(box) {
    if (!box) return false;
    return [].some.call(box.querySelectorAll(".modo-chip, .cat-chip, input, select, [data-regola]"), function (c) {
      for (var n = c; n && n !== box; n = n.parentNode) if (n.hidden) return false;
      return true;
    });
  }
  function firmaImp(imp) { try { return JSON.stringify(imp); } catch (e) { return ""; } }
  // il foglio "Regole" della saletta: dentro ci sono le stesse impostazioni di prima (restano come le avevi lasciate)
  function foglioRegole(U) {
    var R = U.R; if (!R || document.querySelector(".sl-velo")) return;
    var prima = firmaImp(R.imp), velo;
    function chiudi() {
      if (R.box.parentNode) R.box.parentNode.removeChild(R.box);
      if (velo.parentNode) velo.parentNode.removeChild(velo);
      if (firmaImp(R.imp) === prima) return;
      var fn = (U.o && U.o.onRegole) || (R.tavolo && R.tavolo.onRegole);
      if (fn) fn(R.imp);
      if (U.bRegole) { U.bRegole.textContent = "✅ Fatto"; setTimeout(function () { if (U.bRegole) U.bRegole.textContent = "⚙️ Regole"; }, 1600); }
    }
    velo = el("div", { class: "sl-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: "⚙️ Regole della partita" }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        el("div", { class: "sl-foglio-corpo" }, [ R.box ]),
        el("button", { class: "btn btn-primario", text: "✅ Fatto", onclick: chiudi })
      ])
    ]);
    document.body.appendChild(velo);
  }
  function saletta(g, o, R) {
    o = o || {};
    var U = SL.ultimo;
    if (U && U.gid === g.id && U.host === !!o.host && document.body.contains(U.s)) { if (R) U.R = R; aggiornaSaletta(U, o); return U.s; }
    var s = schermata({ icona: g.icona, titolo: g.nome, sotto: o.sotto || (o.host ? "Online · la stanza è tua" : ("Online · stanza " + String(o.codice || "").toUpperCase())),
      indietro: function () { if (o.host && !window.confirm(o.confermaEsci || "Chiudere la stanza per tutti?")) return; SL.ultimo = null; if (o.onEsci) o.onEsci(); } });
    s.classList.add("saletta-schermo");
    var U2 = { gid: g.id, host: !!o.host, s: s, figure: {}, o: o };
    if (o.host) {
      U2.cod = el("b", { text: "…" });
      U2.link = el("button", { class: "btn btn-primario sl-link", html: "📤 Manda il link agli amici", onclick: function () { if (U2.linkUrl) condividiLink(U2.linkUrl, g, U2.link); } });
      U2.stato = el("div", { class: "sl-stato" });
      s._contenuto.appendChild(el("div", { class: "sl-invito" }, [ el("div", { class: "sl-cod" }, [ el("small", { text: "Codice" }), U2.cod ]), U2.link ]));
      s._contenuto.appendChild(U2.stato);
    }
    // la saletta: muro, finestra, quadro col simbolo del gioco, orologio, pianta, divano e tappeto (uguale per tutti i giochi)
    U2.stanza = el("div", { class: "sl-stanza" }, [ el("div", { class: "sl-muro" }), el("div", { class: "sl-insegna", text: "Sala d'attesa" }),
      el("div", { class: "sl-finestra" }), el("div", { class: "sl-quadro" }, [ el("span", { text: g.icona || "🎲" }) ]),
      el("div", { class: "sl-orologio", html: "<svg viewBox='0 0 40 40'><circle cx='20' cy='20' r='17' fill='#fff8e8' stroke='#6b4428' stroke-width='3'/><path d='M20 20 L20 9 M20 20 L28 24' stroke='#2b2b33' stroke-width='2.4' stroke-linecap='round'/><circle cx='20' cy='20' r='2' fill='#e03131'/></svg>" }),
      el("div", { class: "sl-pavimento" }), el("div", { class: "sl-tappeto" }), el("div", { class: "sl-divano" }),
      el("div", { class: "sl-pianta", html: "<svg viewBox='0 0 60 80'><path d='M30 50 C18 40 8 30 10 14 C20 22 26 34 30 50 Z' fill='#40c057'/><path d='M30 50 C42 40 52 30 50 12 C40 22 34 34 30 50 Z' fill='#2f9e44'/><path d='M30 52 C26 36 28 18 34 4 C38 20 36 36 30 52 Z' fill='#51cf66'/><path d='M16 50 L44 50 L40 78 L20 78 Z' fill='#c9713a' stroke='#8a4a22' stroke-width='2' stroke-linejoin='round'/><rect x='14' y='47' width='32' height='7' rx='2' fill='#d9854a' stroke='#8a4a22' stroke-width='2'/></svg>" }) ]);
    U2.conta = el("div", { class: "sl-conta" });
    U2.stanza.appendChild(U2.conta);
    s._contenuto.appendChild(U2.stanza);
    U2.extra = el("div", { class: "sl-extra" });
    s._contenuto.appendChild(U2.extra);
    if (!o.host) {
      U2.attesa = el("div", { class: "sl-att-testo" });
      U2.consiglio = el("div", { class: "sl-consiglio" });
      s._contenuto.appendChild(el("div", { class: "sl-attesa" }, [ el("div", { class: "sl-att-tit", text: "✅ Sei dentro!" }), U2.attesa, U2.consiglio ]));
    } else {
      U2.go = el("button", { class: "btn btn-primario", onclick: function () { if (!U2.go.disabled && U2.o.onComincia) U2.o.onComincia(); } });
      U2.nota = el("p", { class: "modulo-nota sl-nota" });
      U2.R = R || null;
      // l'host può sempre cambiare le regole, anche con gli amici già dentro
      if (R && haRegole(R.box)) {
        U2.bRegole = el("button", { class: "btn btn-fantasma sl-regole", text: "⚙️ Regole", onclick: function () { foglioRegole(U2); } });
        s._piede.appendChild(el("div", { class: "sl-tasti" }, [ U2.bRegole, U2.go ]));
      } else s._piede.appendChild(U2.go);
      s._piede.appendChild(U2.nota);
    }
    SL.ultimo = U2;
    aggiornaSaletta(U2, o);
    mostra(s);
    avviaAnimeSaletta();
    return s;
  }
  var CONSIGLI_SL = ["Tocca il tuo personaggio: ti saluta! 👋", "Mentre aspetti puoi cambiare avatar dal profilo, la prossima volta.", "Tocca gli altri personaggi: saltano! 🤸", "Appena l'host fa partire, il gioco si apre da solo."];
  function aggiornaSaletta(U, o) {
    U.o = o;
    var gio = (o.giocatori || []).slice();
    if (U.host) {
      var pronto = o.codice && o.codice !== "…";
      U.cod.textContent = pronto ? String(o.codice).toUpperCase() : "…";
      U.linkUrl = pronto ? (o.link || SG.creaLink({ gioco: U.gid, stanza: o.codice })) : "";   // o.link: la sala/torneo ha il suo
      if (pronto) U.link.removeAttribute("disabled"); else U.link.setAttribute("disabled", "disabled");
      var aperta = pronto && o.pronta !== false;
      U.stato.className = "sl-stato" + (aperta ? "" : " giallo");
      U.stato.textContent = aperta ? "🟢 Stanza aperta: chi apre il link entra qui sotto" : "🟡 Sto aprendo la stanza…";
      var veri = gio.filter(function (p) { return !p.bot; }).length, min = o.min || 2;
      U.go.textContent = o.testoComincia || "Comincia ▶";
      if ((veri < min && !o.puoiDaSolo) || o.puoComincia === false) U.go.setAttribute("disabled", "disabled"); else U.go.removeAttribute("disabled");   // puoComincia: il gioco può chiedere altro (es. le squadre fatte)
      U.nota.textContent = o.nota || (veri < min && !o.puoiDaSolo ? "Aspettiamo gli amici: " + (veri === 1 ? "per ora ci sei solo tu." : "servono almeno " + min + " giocatori.") : "Quando ci siete tutti, fai partire la partita.");
    } else {
      var chiHost = gio.filter(function (p) { return p.host; })[0];
      U.attesa.textContent = o.attesa || ("Aspetta che " + (chiHost ? chiHost.nome : "l'host") + " faccia partire la partita…");
      if (!U.consiglio.textContent) U.consiglio.textContent = CONSIGLI_SL[Math.floor(Math.random() * CONSIGLI_SL.length)];
    }
    // i nodi del gioco sotto la saletta (es. scelta del posto): si rimettono solo se sono cambiati
    var ex = (o.extra || []).filter(Boolean);
    if (ex.length !== U.extra.childNodes.length || ex.some(function (n, i) { return U.extra.childNodes[i] !== n; })) { svuota(U.extra); ex.forEach(function (n) { U.extra.appendChild(n); }); }
    // i personaggi: chi c'è già resta (niente lampeggio), chi arriva entra col saltello, chi esce sparisce
    var tieni = {}, n = gio.length, vuoti = Math.max(0, o.vuoti || 0), tot = n + vuoti, due = tot > 5;
    var primaFila = due ? Math.ceil(tot / 2) : tot;
    function posto(i) {   // due file: dietro (più piccoli e più in alto) e davanti
      var dietro = due && i < primaFila, fila = dietro ? primaFila : tot - (due ? primaFila : 0), k = dietro || !due ? i : i - primaFila;
      return { x: ((k + 0.5) / fila) * 100, dietro: dietro };
    }
    gio.forEach(function (p, i) {
      var k = chiavePers(p, i), f = U.figure[k], cfg = p.omino || (window.SGOmino ? SGOmino.casuale(p.nome || k) : null), sig = JSON.stringify(cfg) + "|" + p.nome + "|" + !!p.tu + "|" + !!p.host + "|" + !!p.bot;
      if (!f) {
        f = { nodo: el("div", { class: "sl-av entra" }), sig: "" };
        f.nodo.addEventListener("click", function () { animaAv(f.nodo, f.tu ? "saluta" : "salta"); });
        U.figure[k] = f; U.stanza.appendChild(f.nodo);
        (function (nodo) { setTimeout(function () { nodo.classList.remove("entra"); }, 700); })(f.nodo);
        if (!p.tu && U.visti) { var ciao = el("div", { class: "sl-ciao", text: "Ciao! 👋" }); f.nodo.appendChild(ciao); setTimeout(function () { if (ciao.parentNode) ciao.parentNode.removeChild(ciao); }, 2200); }
      }
      if (f.sig !== sig) {
        f.sig = sig; f.tu = !!p.tu;
        var vecchiaCiao = f.nodo.querySelector(".sl-ciao");
        f.nodo.innerHTML = "";
        f.nodo.appendChild(el("div", { class: "sl-fig", html: cfg && window.SGOmino ? SGOmino.svg(cfg) : "<div class='sl-emo'>🙂</div>" }));
        f.nodo.appendChild(el("div", { class: "sl-nome" + (p.tu ? " tu" : "") }, [ p.host ? el("span", { class: "sl-cor", text: "👑" }) : null, document.createTextNode(p.tu ? "Tu" : (p.nome || "…")), p.bot ? el("span", { text: " 🤖" }) : null ]));
        if (vecchiaCiao) f.nodo.appendChild(vecchiaCiao);
      }
      var ps = posto(i);
      f.nodo.classList.toggle("dietro", ps.dietro); f.nodo.classList.toggle("tu", !!p.tu); f.nodo.classList.toggle("bot", !!p.bot);
      f.nodo.style.left = ps.x.toFixed(2) + "%";
      f.nodo.style.animationDelay = (-(i * 0.7) % 3).toFixed(2) + "s";
      tieni[k] = true;
    });
    Object.keys(U.figure).forEach(function (k) {
      if (tieni[k]) return;
      var nodo = U.figure[k].nodo; delete U.figure[k];
      nodo.classList.add("esce"); setTimeout(function () { if (nodo.parentNode) nodo.parentNode.removeChild(nodo); }, 450);
    });
    // i posti liberi: sagome tratteggiate
    [].slice.call(U.stanza.querySelectorAll(".sl-vuoto")).forEach(function (v) { v.parentNode.removeChild(v); });
    for (var v = 0; v < vuoti; v++) { var pv = posto(n + v); U.stanza.appendChild(el("div", { class: "sl-av sl-vuoto" + (pv.dietro ? " dietro" : ""), style: "left:" + pv.x.toFixed(2) + "%" }, [ el("div", { class: "sl-sagoma" }), el("div", { class: "sl-nome", text: "posto libero" }) ])); }
    U.stanza.classList.toggle("piena", due); U.stanza.classList.toggle("pochi", tot <= 3); U.stanza.classList.toggle("medi", tot > 3 && tot <= 5);
    U.conta.textContent = n === 1 ? "1 in sala" : n + " in sala";
    U.visti = true;
  }
  function animaAv(nodo, cosa) {
    if (!nodo || nodo.classList.contains("salta") || nodo.classList.contains("saluta")) return;
    nodo.classList.add(cosa); setTimeout(function () { nodo.classList.remove(cosa); }, cosa === "saluta" ? 1100 : 650);
  }
  // ogni tanto qualcuno saluta o fa un saltello (un solo orologio per tutte le salette)
  function avviaAnimeSaletta() {
    if (SL.timer) return;
    SL.timer = setInterval(function () {
      var U = SL.ultimo;
      if (!U || !document.body.contains(U.s)) { clearInterval(SL.timer); SL.timer = null; return; }
      if (document.hidden) return;
      var nodi = [].slice.call(U.stanza.querySelectorAll(".sl-av:not(.sl-vuoto)"));
      if (nodi.length) animaAv(nodi[Math.floor(Math.random() * nodi.length)], Math.random() < 0.45 ? "saluta" : "salta");
    }, 2600);
  }
  // porta d'ingresso a un gioco dalla home: profilo → come giocate → (amici) → impostazioni
  function apriGioco(g) {
    if (!profiloAttivo()) return schermataAccesso(function () { apriGioco(g); });
    if (modiDi(g).length > 1 || giocoOnline(g)) return schermataModo(g);   // online c'è sempre la scelta: apro io la stanza o entro con un codice
    var solo = modiDi(g)[0];
    if (solo && !solo.amici) return schermataPreGioco(g, { modo: solo.modo });
    if (!solo && (g.giocatoriMax || 10) <= 1) return schermataPreGioco(g);   // si gioca da soli (es. contro il computer): niente amici da aggiungere
    schermataSala(g, solo ? { modo: solo.modo } : null);
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
      var k = (r.pos ? r.pos : i + 1) - 1;   // pos = il posto (a pari merito lo stesso posto, gli stessi punti)
      var perc = k < CURVA_TORNEO.length ? CURVA_TORNEO[k] : 6;
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
    if (sala && sala.torneo) return disegnaSalaHost();   // torneo online in corso
    if (torneo) return schermataTorneoHub();
    if (!profiloAttivo()) return schermataAccesso(apriTorneo);
    schermataTorneoModo();
  }
  // prima cosa: come giocate il torneo? Online = UN link solo per tutti i giochi
  function schermataTorneoModo() {
    var s = schermata({ icona: "🏆", titolo: "Torneo", sotto: "Come giocate?", indietro: schermataHome });
    var griglia = el("div", { class: "modo-scelta" });
    [{ icona: "📱", nome: "Su questo telefono", sotto: "Vi passate il telefono: prima aggiungi chi gioca", via: function () { schermataSala(null, { torneo: true }); } },
     { icona: "🔗", nome: "Online", sotto: "Un link solo per tutto il torneo: ognuno dal suo telefono", online: true, via: function () { creaSala({ torneo: true }); } }
    ].forEach(function (m) {
      griglia.appendChild(el("button", { class: "modo-grande" + (m.online ? " online" : ""), onclick: m.via }, [
        el("div", { class: "mg-ico", text: m.icona }),
        el("div", { class: "mg-testo" }, [ el("div", { class: "mg-tit", text: m.nome }), el("div", { class: "mg-sotto", text: m.sotto }) ]),
        el("div", { class: "mg-freccia", text: "›" })
      ]));
    });
    s._contenuto.appendChild(griglia);
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Più giochi di fila, i punti si sommano: più il gioco è difficile, più punti vale." }));
    mostra(s);
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
    giochi.forEach(function (g) { if (!g.soloOnline) griglia.appendChild(tesseraGioco(g, function () { schermataPreGioco(g, { torneo: true }); })); });   // sullo stesso telefono: niente giochi solo online
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
  // il gioco aperto adesso: uno già lasciato (es. si è tornati al tabellone) non può più disegnare, uscire o dare risultati
  var partitaN = 0;
  function lasciaPartita() { partitaN++; }
  function avviaPartita(g, giocatori, impostazioni, opts, salaCtx) {
    var questa = ++partitaN;
    function viva() { return questa === partitaN; }
    // entrato da ospite con un invito: se la pagina si ricarica, in home c'è "Rientra nella partita"
    if (linkParams && linkParams.stanza && !linkParams.guarda && !salaCtx) ricordaStanza({ gioco: g.id, stanza: String(linkParams.stanza).toUpperCase() });
    // online (host, ospite o dalla Sala): lo schermo resta acceso, così il collegamento non si ferma
    tieniAcceso(!!(salaCtx || (linkParams && linkParams.stanza) || (impostazioni && impostazioni.modo === "online")));
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
      // nei giochi niente scritta col nome del gioco in alto (si sa a cosa si gioca): massimo spazio.
      // Restano i titoli che dicono qualcosa ("Hai vinto!", "Fine smazzata"…).
      schermata: function (o) {
        o = o || {};
        var nomeG = String(g.nome || "").toLowerCase();
        if (o.titolo && nomeG && String(o.titolo).toLowerCase().indexOf(nomeG) >= 0) o = Object.assign({}, o, { titolo: null });
        if (!o.titolo) o = Object.assign({}, o, { icona: null, sotto: null });
        var s = schermata(o);
        if (!o.titolo) s.classList.add("senza-testa");
        return s;
      },
      mostra: function (s) { if (!viva()) return; if (salaCtx && salaCtx.tabellone) salaCtx.tabellone(s); mostra(s); },   // torneo a eliminazione: tasto 🏆 Tabellone

      // il nome del profilo di questo telefono (chi entra da un invito entra direttamente con questo)
      nomeProfilo: function () {
        var p = profiloAttivo(); if (p && p.nome) return String(p.nome).trim().slice(0, 16);
        return (salaCtx && salaG && salaG.nome) ? salaG.nome : "";   // in sala senza profilo: il nome scritto entrando
      },
      // l'avatar di questo telefono (da mandare quando si entra in una stanza online)
      mioOmino: function (nome) {
        var p = profiloAttivo(); if (p && p.omino) return p.omino;
        if (salaCtx && salaG && salaG.omino) return salaG.omino;
        return window.SGOmino ? SGOmino.casuale(nome || (p && p.nome) || "io") : null;
      },
      // la saletta d'attesa online, uguale per tutti i giochi (vedi saletta()).
      // All'host dà anche "⚙️ Regole": le impostazioni di prima, da cambiare quando vuole;
      // dopo una modifica chiama tavolo.onRegole() (il gioco rilegge tavolo.impostazioni).
      lobby: function (o) {
        if (!viva()) return null;
        var s = saletta(g, o, (opts && opts.regole) ? { box: opts.regole, imp: tavolo.impostazioni, tavolo: tavolo } : null);
        if (s && salaCtx && salaCtx.tabellone) salaCtx.tabellone(s);
        return s;
      },
      // torneo a eliminazione: la partita col bot si trasmette, così gli altri la guardano (msg come quelli dell'host online)
      trasmetti: (salaCtx && salaCtx.trasmetti) ? function (msg) { if (viva()) salaCtx.trasmetti(msg); } : null,

      // passaggio del telefono, poi esegue "quando"
      passaA: function (nome, quando) { passaIlTelefono(nome, quando); },

      // i giochi online dicono com'è finita ogni partita, senza lasciare la loro schermata finale:
      // serve al torneo online per sommare i punti. classifica = [{ nome, pos? }] dal primo all'ultimo
      risultato: function (classifica) { if (viva() && salaCtx && salaCtx.risultato && classifica && classifica.length) salaCtx.risultato(g, classifica); },

      // il gioco chiama questa quando è finito
      fine: function (classifica) {
        if (!viva()) return;
        if (salaCtx) return salaCtx.fine(g, classifica, giocatori, impostazioni);
        if (opts && opts.torneo && torneo) return torneoRisultato(g, classifica);
        schermataFine(g, classifica, giocatori, impostazioni);
      },

      // uscite comuni
      esci: function () {
        if (!viva()) return;
        if (!salaCtx && tavolo.linkParams && tavolo.linkParams.stanza) dimenticaStanza();   // uscito apposta: niente "Rientra"
        (salaCtx ? salaCtx.esci : schermataHome)();
      }
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
    listaProfilo: listaProfilo, salvaListaProfilo: salvaListaProfilo,   // liste salvate sul profilo di chi gioca
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

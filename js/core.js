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

  var giochi = [];            // giochi registrati, nell'ordine scelto dal proprietario (🧩 Ordine dei giochi: vedi ordinaGiochi)
  var giochiReg = [];         // gli stessi giochi nell'ordine in cui si sono registrati (= "ordine di partenza")

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
    tris: "sfida", drop4: "sfida", hockey: "sfida", navale: "sfida", calciobiliardo: "sfida",
    asta: "festa", lanterne: "festa", impostore: "festa", sipero: "festa", scarabocchio: "festa", lunghezza: "festa", chidinoi: "festa",
    scalinata: "mini", horto: "mini", pendolo: "mini", pallamatta: "mini", garapesca: "mini",
    timeline: "parole", nomicose: "parole", patata: "parole", taboo: "parole", balla: "parole", prezzo: "parole", unaparola: "parole", dadoveviene: "parole"
  };
  var catAttiva = "tutti";
  function catDi(g) { return CAT_GIOCO[g.id] || null; }
  // Giochi che hanno la modalità "ognuno dal suo telefono" (usabili nella Sala online).
  var GIOCHI_ONLINE = { lanterne: 1, asta: 1, blackjack: 1, poker: 1, ruota: 1, ordine: 1, drop4: 1, horto: 1, navale: 1, nomicose: 1, patata: 1, pendolo: 1, scalinata: 1, scopa: 1, scopa2v2: 1, sipero: 1, timeline: 1, tris: 1, scarabocchio: 1, taboo: 1, calciobiliardo: 1, pallamatta: 1, garapesca: 1, balla: 1, lunghezza: 1, chidinoi: 1, scopone: 1, impostore: 1, prezzo: 1, unaparola: 1, dadoveviene: 1 };
  function giocoOnline(g) { return !!(g && (GIOCHI_ONLINE[g.id] || g.provaOnline)); }   // (provaOnline: solo i giochi finti delle prove, es. il Contatore)
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
  // come chiediConferma, ma con più scelte in colonna: tasti = [{ testo, classe, fn }] (attivi dopo un attimo);
  // "Resta" è sempre l'ultimo (chiude e basta). resta = testo di "Resta" se diverso
  function chiediScelta(domanda, nota, tasti, resta) {
    var vv = document.querySelector(".conferma-sfondo"); if (vv && vv.parentNode) vv.parentNode.removeChild(vv);   // (una sola alla volta: vince l'ultima)
    var chiudi = function () { if (sfondo.parentNode) sfondo.parentNode.removeChild(sfondo); };
    var bt = (tasti || []).map(function (x) {
      return el("button", { class: "btn " + (x.classe || "btn-fantasma"), text: x.testo, disabled: "disabled", onclick: function () { chiudi(); if (x.fn) x.fn(); } });
    });
    var sfondo = el("div", { class: "conferma-sfondo", onclick: function (e) { if (e.target === sfondo) chiudi(); } }, [
      el("div", { class: "conferma-box", role: "dialog" }, [
        el("div", { class: "conferma-domanda", text: domanda }),
        nota ? el("div", { class: "conferma-nota", text: nota }) : null,
        el("div", { class: "conferma-tasti colonna" }, bt.concat([ resta === null ? null : el("button", { class: "btn btn-fantasma", text: resta || "Resta", onclick: chiudi }) ]))
      ])
    ]);
    document.body.appendChild(sfondo);
    setTimeout(function () { bt.forEach(function (b) { b.removeAttribute("disabled"); }); }, 700);
    return chiudi;
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
    var s = el("div", { class: "schermata oro" }, [testa, contenuto, piede]);   // (🤍 Bianco e oro: le schermate del core sono chiare, vedi js/stile.js)
    s._contenuto = contenuto; s._piede = piede;
    return s;
  }

  // 🤍 le schermate del mondo (città, casa, casinò, negozio, bacheca, edifici) hanno i loro disegni: restano come sono
  var SCENE_MONDO = /\b(citta-vista|casino-sale|casa-vista|ne-vista|nb-vista|edificio|carica-extra|pe-vista|sv-vista|gd-vista)\b/;
  function mostra(schermo) {
    svuota(app);
    if (schermo._menu && HOME_MENU_SOTTO && !schermo.querySelector(".menu-sotto")) menuSotto(schermo, schermo._menu);   // 📱 il menu sotto (prima di marca: i simboli si fanno anche nel menu)
    // 🤍 Bianco e oro: ogni schermata del core è chiara (anche quelle fatte a mano), tranne quelle dei giochi e del mondo
    if (window.SGStile) {
      if (!schermo._gioco && !SCENE_MONDO.test(schermo.className || "")) SGStile.marca(schermo);
      SGStile.aggiorna(schermo);
    }
    app.appendChild(schermo);
    window.scrollTo(0, 0);
  }

  // =========================================================
  //  SCHERMATE COMUNI
  // =========================================================

  // le tessere della home: "righe" (una per riga, foto piccola a sinistra) o "due" (due per riga, foto sopra)
  var HOME_TESSERE = "due";
  var HOME_MENU_SOTTO = true;   // la home col menu in basso (Giochi · Novità · Trofei · Classifica · Profilo) e la testata corta; false = come prima
  // il menu sotto: lo mette mostra() sulle schermate che hanno s._menu ("giochi", "novita", "trofei", "classifica", "profilo")
  function menuSotto(s, quale) {
    var io = profiloAttivo();
    function tab(id, testo, fai, cls, figli) {
      var b = el("button", { class: "ms-tab" + (cls ? " " + cls : "") + (id === quale ? " attiva" : ""), "aria-current": id === quale ? "page" : null,
        onclick: function () { if (id === quale) window.scrollTo({ top: 0, behavior: "smooth" }); else fai(); } }, figli || [ el("span", { text: testo }) ]);
      return b;
    }
    s.classList.add("con-menu");
    s.appendChild(el("nav", { class: "menu-sotto" }, [
      tab("giochi", "🎮 Giochi", schermataHome),
      (window.SG_NOVITA || []).length ? tab("novita", "🆕 Novità", novitaLista, null, [ el("span", { text: "🆕 Novità" }), novitaTutteViste() ? null : el("span", { class: "pallino" }) ]) : null,
      tab("trofei", "🏆 Trofei", schermataSfide),
      tab("classifica", "👥 Classifica", function () { schermataAmici(); }, "home-amici", [ el("span", { text: "👥 Classifica" }), cacheRich && cacheRich.arrivate.length ? el("span", { class: "pallino" }) : null ]),
      tab("profilo", "Profilo", function () { schermataAccesso(schermataHome); }, "ms-io", [
        io && io.omino && window.SGOmino ? el("span", { class: "ms-faccia", html: SGOmino.svg(io.omino, { busto: true }) }) : el("span", { class: "ms-faccia sg-dal-gioco", text: (io && io.emoji) || "👤" }),
        el("small", { text: "Profilo" }) ])
    ]));
  }
  // una tessera-gioco, usata sia in home sia in "cambia gioco"
  // compatta (la home, dal 29 ott 2026): niente descrizione, solo foto, nome, categoria e giocatori (il proprietario: «la gente si scoccia di scorrere»)
  function tesseraGioco(g, onclick, compatta) {
    // L'icona fa da "banner": mostra la foto carte/giochi/<id>.jpg se esiste,
    // altrimenti resta l'emoji del gioco (l'immagine si toglie da sola se manca).
    var icona = el("span", { class: "icona" }, [ el("span", { class: "emoji", text: g.icona || "🎲" }) ]);
    var conFoto = !window.SG_FOTO || SG_FOTO[g.id];
    if (conFoto) {   // (la versione online sa già quali foto ci sono: non chiede quelle che mancano)
      var img = el("img", { class: "illustr", src: "carte/giochi/" + g.id + ".jpg", alt: "", loading: "lazy" });
      img.onerror = function () { if (img.parentNode) img.parentNode.removeChild(img); };
      icona.appendChild(img);
    }
    // 🌙 la categoria (il suo colore e la targhetta sulla foto) e la foto per il bagliore sotto le scritte
    // (indirizzo intero: dentro una variabile del CSS un indirizzo corto si leggerebbe dalla cartella css/)
    return el("button", { class: "tessera", "data-gioco": g.id, "data-cat": catDi(g) || "", style: conFoto ? "--img:url(" + new URL("carte/giochi/" + g.id + ".jpg", document.baseURI).href + ")" : null, onclick: onclick }, [
      icona,
      el("div", { class: "info" }, compatta ? [
        catDi(g) ? el("span", { class: "tess-cat", text: (CATEGORIE.filter(function (c) { return c.id === catDi(g); })[0] || {}).nome || "" }) : null,
        el("h2", { text: g.nome }),
        el("div", { class: "meta", text: rangeGiocatori(g) })
      ] : [
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
  function dimenticaStanza() { try { localStorage.removeItem("sg-ultima-stanza"); } catch (e) {} dimenticaLinkSessione(); }
  function stanzaRecente() {
    try {
      var o = JSON.parse(localStorage.getItem("sg-ultima-stanza") || "null");
      if (o && Date.now() - o.t < DURATA_RIENTRO && (o.sala || (o.gioco && o.stanza))) return o;
    } catch (e) {}
    return null;
  }
  // si rientra subito, senza ricaricare la pagina (come fa la Sala quando lancia un gioco)
  function rientraStanza(o) {
    if (o.sala) return salaOspite(o.sala);
    var g = giocoDa(o.gioco);
    if (!g) { dimenticaStanza(); return schermataHome(); }
    linkParams = { gioco: g.id, stanza: String(o.stanza).toUpperCase() };
    avviaPartita(g, [], {});
  }

  // ---- memoria delle stanze online (per non perdersi quando la pagina si ricarica) ----
  function leggiM(st, k) { try { return JSON.parse(st.getItem(k) || "null"); } catch (e) { return null; } }
  function scriviM(st, k, v) { try { if (v == null) st.removeItem(k); else st.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function sessione() { try { return window.sessionStorage; } catch (e) { return null; } }
  // il link con cui sono entrato (o la stanza in cui sono entrato col codice): resta solo in questa scheda,
  // così se la pagina si ricarica si torna da soli al proprio posto (il link non resta nell'indirizzo)
  function segnaLinkSessione(o) {
    var s = sessione(); if (!s) return;
    // (guarda: 1 = guardavo soltanto: ricaricando torno a guardare, non a giocare)
    scriviM(s, "sg-link", o.sala ? { sala: String(o.sala).toUpperCase(), t: Date.now() } : { gioco: o.gioco, stanza: String(o.stanza).toUpperCase(), guarda: o.guarda ? 1 : undefined, t: Date.now() });
  }
  function dimenticaLinkSessione() { var s = sessione(); if (s) scriviM(s, "sg-link", null); }
  // (finché si è dentro la stanza resta "recente": vedi agganciaRete; un link di ieri in una scheda riaperta non vale più)
  function linkSessione() { var s = sessione(), o = s && leggiM(s, "sg-link"); return o && (o.sala || (o.gioco && o.stanza)) && Date.now() - (o.t || 0) < DURATA_RIENTRO ? o : null; }
  // 🔑 la chiave segreta di una Sala o di una stanza (le foto cifrate di «Chi di Noi?»): la crea l'host e viaggia SOLO nel link,
  // dopo il # (mai al server, mai nei messaggi). Resta solo in questa scheda. crea: true = l'host la fa se non c'è; k = quella arrivata dal link
  var CHIAVI = {};
  function chiaveDi(codice, crea, k) {
    var c = String(codice || "").toUpperCase(); if (!/^[A-Z0-9]{4,8}$/.test(c)) return null;
    var s = sessione(), m = (s && leggiM(s, "sg-chiavi")) || CHIAVI;
    if (k && /^[A-Za-z0-9_-]{22}$/.test(k)) m[c] = k;
    else if (m[c] || !crea) return m[c] || null;
    else { try { var b = new Uint8Array(16); crypto.getRandomValues(b); m[c] = btoa(String.fromCharCode.apply(null, b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); } catch (e) { return null; } }
    CHIAVI = m; if (s) scriviM(s, "sg-chiavi", m);
    return m[c];
  }
  // la stanza che ho aperto io (gioco, codice, regole, nomi): se la pagina si ricarica o l'app si chiude, entro 20 minuti la riapro
  // con lo stesso codice e gli amici rientrano da soli. Si dimentica quando la chiudo apposta.
  var DURATA_MIA = 20 * 60 * 1000;
  function ricordaMiaStanza(o) { o.t = Date.now(); scriviM(localStorage, "sg-mia-stanza", o); }
  function dimenticaMiaStanza(codice) { var o = leggiM(localStorage, "sg-mia-stanza"); if (o && (!codice || o.codice === codice)) scriviM(localStorage, "sg-mia-stanza", null); scordaRipresa(codice); }
  function miaStanzaRecente() { var o = leggiM(localStorage, "sg-mia-stanza"); return o && o.gioco && o.codice && Date.now() - o.t < DURATA_MIA ? o : null; }
  // ---- La ripresa (Passo 5): la partita dell'host com'era, per riprenderla da dove era se la pagina si ricarica o l'app
  // si chiude (t.ricorda / t.ripresa). Una sola alla volta, vale 20 minuti come la stanza:
  // { gioco, codice, t, io, gen, stato, soloQui, nomeHost, ultimoRisultato }
  var DURATA_RIPRESA = DURATA_MIA;
  function leggiRipresa() { var o = leggiM(localStorage, "sg-ripresa"); return o && o.gioco && o.codice && o.stato != null && Date.now() - (+o.t || 0) < DURATA_RIPRESA ? o : null; }
  // quella di questo gioco e di questa stanza (null se non c'è o è vecchia)
  function ripresaDi(gioco, codice) { var o = leggiRipresa(); return o && codice && o.codice === String(codice).toUpperCase() && (!gioco || o.gioco === gioco) ? o : null; }
  function scordaRipresa(codice) { var o = leggiM(localStorage, "sg-ripresa"); if (o && (!codice || o.codice === String(codice).toUpperCase())) scriviM(localStorage, "sg-ripresa", null); }
  function scriviRipresa(o) {
    try {
      var tx = JSON.stringify(o);
      if (tx.length > 1500000) { console.warn("Ripresa di " + o.gioco + " troppo grande (" + tx.length + " caratteri): non la salvo"); return false; }
      localStorage.setItem("sg-ripresa", tx); return true;
    } catch (e) { console.warn("Ripresa non salvata: " + (e && e.message)); return false; }
  }
  // c'è una partita da riprendere per questa stanza ricordata (anche senza profilo: c'è il nome dell'host)
  function ripresaValida(mt) { var g = mt && giocoDa(mt.gioco); return !!(g && g.riprende && ripresaDi(g.id, mt.codice)); }
  // la Sala che ho aperto io: si salva a ogni invio a tutti e si riapre con lo stesso codice
  function ricordaMiaSala(o) { o.t = Date.now(); scriviM(localStorage, "sg-mia-sala", o); }
  function dimenticaMiaSala() { scriviM(localStorage, "sg-mia-sala", null); }
  function miaSalaRecente() { var o = leggiM(localStorage, "sg-mia-sala"); return o && o.codice && o.membri && Date.now() - o.t < DURATA_MIA ? o : null; }
  // "🔁 Riapri la Sala di ieri sera" (Passo 3): la mia ultima Sala normale (4 lettere, non Compagnia, non torneo a eliminazione)
  // con almeno un amico: codice e nomi degli amici (massimo 6). Vale 24 ore e NON si cancella chiudendo la Sala.
  // Nella stessa serata (meno di 12 ore) i nomi si sommano; il ✕ in home la cancella
  var DURATA_IERI = 24 * 3600 * 1000, SERA_IERI = 12 * 3600 * 1000;
  function ricordaSalaIeri(S) {
    if (!S || S.comp || S.elim || S.trasloco || !/^[A-HJ-NP-Z2-9]{4}$/.test(String(S.codice || ""))) return;
    var nomi = (S.membri || []).filter(function (m) { return m && m.id !== "host" && !m.ex && m.nome; }).map(function (m) { return String(m.nome).slice(0, 16); });
    if (!nomi.length) return;
    var o = leggiM(localStorage, "sg-sala-ieri"), ora = Date.now();
    if (o && o.codice === S.codice && Array.isArray(o.nomi) && ora - (+o.t || 0) < SERA_IERI) o.nomi.forEach(function (n) { if (n && !nomi.some(function (x) { return stessoNome(x, n); })) nomi.push(String(n).slice(0, 16)); });
    scriviM(localStorage, "sg-sala-ieri", { codice: S.codice, nomi: nomi.slice(0, 6), t: ora });
  }
  // la Sala di ieri da riaprire (o null): meno di 24 ore, almeno un nome, non è la Sala aperta adesso
  function salaDiIeri() {
    var o = leggiM(localStorage, "sg-sala-ieri");
    if (!o || !/^[A-HJ-NP-Z2-9]{4}$/.test(String(o.codice || "")) || !Array.isArray(o.nomi) || !o.nomi.length) return null;
    if (Date.now() - (+o.t || 0) > DURATA_IERI) return null;
    if ((sala && sala.codice === o.codice) || (salaG && salaG.codice === o.codice)) return null;
    return o;
  }
  function dimenticaSalaIeri(codice) { var o = leggiM(localStorage, "sg-sala-ieri"); if (o && (!codice || o.codice === codice)) scriviM(localStorage, "sg-sala-ieri", null); }
  // il nome usato in ogni stanza (chi non ha il profilo non lo riscrive ricaricando) e il nome dell'host
  function nomiStanze() { var o = leggiM(localStorage, "sg-nomi-stanze"); return o && typeof o === "object" ? o : {}; }
  function ricordaNomeStanza(codice, nome, host) {
    nome = String(nome || "").trim().slice(0, 16); if (!codice || !nome) return;
    var o = nomiStanze(), C = String(codice).toUpperCase(), ora = Date.now(), r = o[C] || {};
    if (host) r.h = nome; else r.n = nome;
    r.t = ora; o[C] = r;
    Object.keys(o).forEach(function (k) { if (!o[k] || ora - o[k].t > DURATA_RIENTRO * 4) delete o[k]; });   // si tiene solo l'ultima mezza giornata
    scriviM(localStorage, "sg-nomi-stanze", o);
  }
  function nomeStanza(codice, host) { var r = codice && nomiStanze()[String(codice).toUpperCase()]; return (r && (host ? r.h : r.n)) || ""; }

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

  // ---- gli avvisi della rete, in alto (pillole una sotto l'altra, non si toccano: il gioco sotto resta usabile) ----
  //  "📶 Mi ricollego…", "⏳ Aspettiamo l'host…", "👀 entri alla prossima", "🎉 è tornato", "🔁 Riapro la tua stanza"
  var PILLOLE = { box: null, n: {}, t: {} }, ORDINE_PILLOLE = ["rete", "host", "prossima", "tornato", "riapro", "ripresa", "riserva", "sala", "saletta"];
  function pillola(k, testo, colore, durata) {
    var n = PILLOLE.n[k];
    clearTimeout(PILLOLE.t[k]); delete PILLOLE.t[k];
    if (!testo) { if (n && n.parentNode) n.parentNode.removeChild(n); delete PILLOLE.n[k]; return; }
    if (!PILLOLE.box || !document.body.contains(PILLOLE.box)) { PILLOLE.box = el("div", { class: "sg-pillole", "aria-live": "polite" }); document.body.appendChild(PILLOLE.box); }
    if (!n) {
      n = PILLOLE.n[k] = el("div", { class: "sg-pillola" });
      var dopo = null;   // l'ordine è sempre lo stesso, qualunque arrivi prima
      ORDINE_PILLOLE.slice(ORDINE_PILLOLE.indexOf(k) + 1).forEach(function (j) { if (!dopo && PILLOLE.n[j] && PILLOLE.n[j].parentNode === PILLOLE.box) dopo = PILLOLE.n[j]; });
      PILLOLE.box.insertBefore(n, dopo);
    }
    if (n.textContent !== testo) n.textContent = testo;   // (stessa scritta: niente da rifare)
    n.className = "sg-pillola" + (colore ? " " + colore : "");
    if (durata) PILLOLE.t[k] = setTimeout(function () { pillola(k, null); }, durata);
  }
  // "⏳ Aspettiamo l'host…": l'host è uscito un attimo dall'app (chi è dentro lo aspetta 2 minuti)
  var hostVia = {};
  window.addEventListener("sg-host", function (e) {
    var d = e.detail || {};
    if (d.via) hostVia[d.stanza] = 1; else delete hostVia[d.stanza];
    pillola("host", Object.keys(hostVia).length ? "⏳ Aspettiamo l'host: è uscito un attimo dall'app…" : null);
    vivaOra();   // in saletta l'avatar dell'host diventa grigio con 📶
  });
  // "📶 Mi ricollego…": la rete è saltata dopo il collegamento (la partita non si chiude: mqtt riprova da solo).
  // Compare solo se dura più di un secondo e mezzo, così un buco piccolissimo non fa lampeggiare niente
  var reteGiu = {}, tReteGiu = null;
  window.addEventListener("sg-rete", function (e) {
    var d = e.detail || {};
    if (d.giu) reteGiu[d.id] = 1; else delete reteGiu[d.id];
    if (!Object.keys(reteGiu).length) { clearTimeout(tReteGiu); tReteGiu = null; pillola("rete", null); vivaOra(); return; }
    if (!tReteGiu && !PILLOLE.n.rete) tReteGiu = setTimeout(function () { tReteGiu = null; if (Object.keys(reteGiu).length) { pillola("rete", "📶 Mi ricollego…", "blu"); vivaOra(); } }, 1500);
  });
  // "😴 La stanza è ferma": chi l'ha aperta è uscito dall'app (l'ha detto il broker) o non risponde.
  // Copre tutto (niente partita congelata sotto); se l'host torna si sparisce da soli e si entra.
  var FERMA = null;
  window.addEventListener("sg-stanza-ferma", function (e) {
    var d = e.detail || {}, R = reteOsp;
    if (!d.ferma) { if (FERMA && FERMA.codice === d.stanza) togliFerma(); return; }
    var gioco = R && R.codice === d.stanza && !R.guarda && R.P && R.P.viva() && !R.P.salaCtx;
    // la Sala di una Compagnia trovata morta (o che non risponde) entrando: chi ha il profilo la riapre lui (gen + 1),
    // chi non ce l'ha aspetta che la apra qualcuno ("🕐 Nessuno ancora")
    if (salaG && salaG.codice === d.stanza && (salaG.comp || salaG.aspetta || salaG.codice.length === 6)) return salaMortaComp(salaG, !!d.muta);
    var inSala = salaG && salaG.codice === d.stanza && !salaG.membri.length;   // la Sala: solo chi non c'era ancora (chi c'era aspetta l'host)
    if (gioco || inSala) mostraFerma(d.stanza, !!d.muta, !!inSala);
  });
  // la Sala morta della Compagnia: rileggo la stanza (gen e sessione dell'ultimo host) e la riapro io con gen + 1,
  // con gli stessi amici se l'ultima foto l'avevo vista (hanno 30 s per rientrare). Se intanto l'ha riaperta un altro, resto
  function salaMortaComp(S, muta) {
    if (S.riapro) return;
    if (!profiloAttivo()) { if (!S.membri.length && !document.querySelector(".cmp-aspetta")) schermataAspettaComp(S); return; }
    S.riapro = true;
    var C = S.codice, ult = S.ultima && S.ultima.t === "sala" ? S.ultima : null;
    SGNet.sbircia([C], function (es) {
      if (salaG !== S) return;
      var r = (es && es[C]) || { stato: "boh", msg: null, gen: 0 }, msg = r.msg;
      // una Sala viva che non è quella morta (riaperta da un altro intanto): la seguo da amico, arriva da sola
      if (r.stato === "viva" && msg && msg._s && !(ult && msg._s === ult._s)) { S.riapro = false; return; }
      var gen = Math.max(+r.gen || 0, ult ? capoDi(ult).gen : 0);
      var sopra = (msg && (msg._s || msg.s)) || (ult && ult._s) || null;
      var comp = S.comp || compDi(C) || compVuota(C), mioPrima = mioIdSala(S);
      lasciaPartita(); chiudiSalaOspite();
      creaSala({ codiceFisso: C, comp: comp, gen: gen + 1, sopra: sopra, mioId: mioPrima,
        eredita: ult ? { membri: ult.membri, torneo: ult.torneo, giocate: ult.giocate } : null });
    });
  }
  function mostraFerma(codice, muta, sala) {
    var cosa = sala ? "La Sala " : "La stanza ";
    var tit = cosa + codice + (muta ? " non risponde" : " è ferma");
    var sotto = muta ? "Forse chi l'ha aperta è uscito un attimo dall'app. Se torna, entri da solo." : "Chi l'ha aperta è uscito dall'app. Se torna, entri da solo.";
    if (FERMA && FERMA.codice === codice) { FERMA.tit.textContent = tit; FERMA.sotto.textContent = sotto; return; }
    togliFerma();
    var t = el("h2", { text: tit }), s = el("p", { text: sotto });
    var nodo = el("div", { class: "sg-ferma", role: "dialog", "aria-modal": "true" }, [
      el("div", { class: "sg-ferma-box" }, [
        el("div", { class: "sg-ferma-ico", text: "😴" }), t, s,
        el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: function () {
          togliFerma();
          if (sala) { chiudiSalaOspite(); return schermataHome(); }
          lasciaPartita(); dimenticaStanza(); SGNet.chiudiGiochi(); tornaHome();
        } })
      ])
    ]);
    document.body.appendChild(nodo);
    FERMA = { nodo: nodo, codice: codice, tit: t, sotto: s };
  }
  function togliFerma() { if (!FERMA) return; if (FERMA.nodo.parentNode) FERMA.nodo.parentNode.removeChild(FERMA.nodo); FERMA = null; }

  // in home, sotto il profilo: "🔗 Gioca online" (o "👥 Torna nella Sala") e "🔑 Ho un codice", uno accanto all'altro
  function rigaOnline() {
    var hostG = salaG && (salaG.nomeHost || ((salaG.membri || []).filter(function (m) { return m.id === "host"; })[0] || {}).nome);
    var gioca = sala ? { t: "👥 Torna nella Sala", s: sala.codice && sala.codice !== "…" ? "codice " + sala.codice : "è aperta", via: disegnaSalaHost }
      : salaG ? { t: "👥 Torna nella Sala", s: hostG ? "di " + hostG : "codice " + salaG.codice, via: disegnaSalaOspite }
      : { t: "🔗 Gioca online", s: "Un codice per la serata", via: function () { creaSala(); } };
    function tasto(cls, o) {
      return el("button", { class: "btn " + cls, onclick: function () { o.via(); } }, [ el("span", { text: o.t }), el("small", { text: o.s }) ]);
    }
    return el("div", { class: "home-online" }, [
      tasto("btn-primario ho-gioca" + (sala || salaG ? " ho-torna" : ""), gioca),
      tasto("ho-codice", { t: "🔑 Ho un codice", s: "Entra da un amico", via: function () { entraConCodice(); } })
    ]);
  }
  // in home, sotto la riga online: "🔁 Riapri la Sala di ieri sera (Giulia, Luca, Marco)" ("di prima" se è di oggi) e ✕
  function rigaIeri(o) {
    var n = o.nomi, chi = n.length > 3 ? n[0] + ", " + n[1] + " e altri " + (n.length - 2) : (n.length > 1 ? n.slice(0, -1).join(", ") + " e " + n[n.length - 1] : n[0]);
    var quando = Date.now() - (+o.t || 0) < SERA_IERI ? "di prima" : "di ieri sera";
    // (due righe piccole: a 360 px in una riga sola i nomi non ci stanno)
    var riga = el("div", { class: "home-ieri" }, [
      el("button", { class: "btn btn-fantasma btn-piccolo hi-riapri", onclick: function () { riapriSalaIeri(o); } }, [
        el("span", { class: "hi-t", text: "🔁 Riapri la Sala " + quando }), el("small", { class: "hi-chi", text: "con " + chi }) ]),
      el("button", { class: "hi-x", "aria-label": "Non mostrarla più", text: "✕", onclick: function () {
        dimenticaSalaIeri(o.codice);
        if (riga.parentNode) riga.parentNode.removeChild(riga);   // (solo la riga: la home resta com'è)
      } })
    ]);
    return riga;
  }

  // ---------- GLI AMICI ONLINE (Passo 6, p6-f) ----------
  // La presenza e gli inviti li fa js/amici-online.js (SGAmiciOnline, sul primo ufficio postale, solo col profilo).
  // Qui il core: la accende col profilo, dice dove sono ("app", "gioco", "sala"), mette "➕ Invita gli amici" nella testata
  // della Sala, la riga "🟢 Giulia è nell'app · 📨 Chiama" in home e porta nella Sala dell'amico quando si tocca "Entra ▶"
  var HAO = null;   // la riga della home: { b, avs, tx, firma }
  var amiciAscolto = false;
  function amiciOk() {
    try { return !!(window.SGAmiciOnline && window.SGNube && SGNube.disponibile() && SGNube.profilo && SGNube.profilo() && SGNube.utente && SGNube.utente()); } catch (e) { return false; }
  }
  // ho il profilo e almeno un amico (se no "📤 Invita" resta quello di sempre e in home niente riga)
  function conAmici() { if (!amiciOk()) return false; try { return (SGNube.amici() || []).length > 0; } catch (e) { return false; } }
  function amiciAvvia() {
    if (!window.SGAmiciOnline) return;
    try {
      if (!amiciAscolto) { amiciAscolto = true; SGAmiciOnline.onInvito(entraDaInvito); window.addEventListener("sg-amici-online", amiciCambiati); }
      // (senza amici non serve: nessuno mi vede e gli inviti arrivano solo dagli amici. Il primo amico la accende)
      if (!conAmici()) return SGAmiciOnline.ferma();
      if (SGAmiciOnline.avvia()) amiciStato();
    } catch (e) { setTimeout(function () { throw e; }, 0); }
  }
  // dove sono, per gli amici: "gioco" (una partita online), "sala" (col codice: l'invito per quella Sala non si mostra) o "app"
  function amiciStato(s, codice) {
    if (!window.SGAmiciOnline) return;
    if (!s) s = sala || salaG ? "sala" : "app";
    if (s === "sala" && !codice) codice = (sala && sala.codice) || (salaG && salaG.codice) || null;
    try { SGAmiciOnline.stato(s, codice && codice !== "…" ? codice : undefined); } catch (e) {}
  }
  // gli amici online sono cambiati (evento di js/amici-online.js, al massimo uno al secondo): solo i pezzi che lo dicono
  function amiciCambiati(e) {
    var l = (e && e.detail && e.detail.lista) || [];
    aggiornaAmiciOn(l);
    var U = SL.ultimo;   // il pallino nel tasto "➕ Invita" (se all'inizio non c'era nessuno, arriva adesso)
    if (U && U.invModo === "amici" && U.link && document.body.contains(U.link) && l.length && !U.link.querySelector(".ao-badge")) {
      var b = SGAmiciOnline.badge(); if (b) U.link.appendChild(b);
    }
  }
  // sto giocando una partita (la sua schermata è quella che si vede)?
  function staGiocando() { var P = partitaCorrente; return !!(P && P.viva() && P.vista && document.body.contains(P.vista)); }
  // il nome della Sala in cui invito ("Sala di Paky", o la Compagnia) e il gioco che c'è adesso
  function invitoSalaInfo() {
    var S = sala || salaG; if (!S) return { nome: "La Sala", gioco: "" };
    var nome = S.comp && S.comp.nome ? (S.comp.emoji ? S.comp.emoji + " " : "") + S.comp.nome
      : "Sala di " + (sala ? ((sala.membri[0] && sala.membri[0].nome) || "") : (salaG.nomeHost || "un amico"));
    var gid = sala ? sala.gioco : (salaG.giocoSala && salaG.giocoSala.gioco), g = gid ? giocoDa(gid) : null;
    return { nome: nome, gioco: g ? g.nome : "" };
  }
  // la testata della Sala: "📤 Invita gli amici" (manda il link) o, col profilo e degli amici, "➕ Invita gli amici 🟢 2"
  // (il foglio con gli amici da chiamare e, in fondo, "📤 Manda il link"). Si cambia solo quando cambia il modo
  function tastoInvita(U, cod, diSala) {
    var con = !!diSala && conAmici(), modo = con ? "amici" : "link";
    U.invCod = cod;
    if (U.invModo === modo) return;
    U.invModo = modo;
    svuota(U.link);
    U.link.classList.toggle("con-amici", con);
    if (!con) { U.link.textContent = "📤 Invita gli amici"; return; }
    U.link.appendChild(el("span", { class: "sl-link-tx", text: "➕ Invita gli amici" }));
    var b = SGAmiciOnline.badge(); if (b) U.link.appendChild(b);
  }
  function apriInvitaAmici(U) {
    var info = invitoSalaInfo();
    return SGAmiciOnline.foglioInvita({ codice: U.invCod, nomeSala: info.nome, gioco: info.gioco,
      condividi: function (b) { if (U.linkUrl) condividiLink(U.linkUrl, U.gObj || { id: "__sala", nome: "Sala online" }, b); } });
  }
  // la Sala appena aperta (o riaperta) dalla home: il foglio "➕ Invita" appena c'è il codice
  function invitaQuandoPronta() {
    var t0 = Date.now();
    (function prova() {
      var U = SL.ultimo;
      if (U && U.gid === "__sala" && U.invModo === "amici" && U.linkUrl && /^[A-Z0-9]{4,8}$/.test(U.invCod || "") && document.body.contains(U.s)) {
        if (!document.querySelector(".sl-velo")) apriInvitaAmici(U);
        return;
      }
      if ((sala || salaG) && Date.now() - t0 < 15000) setTimeout(prova, 300);
    })();
  }
  // in home, sotto "🔗 Gioca online": "🟢 Giulia e altri 2 sono nell'app · 📨 Chiama" (fino a 4 avatar). Si aggiorna da sola
  // all'evento degli amici, senza rifare la home; nascosta se non c'è nessuno. Tocco: la mia Sala (o una nuova) e il foglio
  function rigaAmiciOn() {
    if (!conAmici()) { HAO = null; return null; }
    var avs = el("span", { class: "hao-av", "aria-hidden": "true" }), tx = el("span", { class: "hao-tx" });
    var b = el("button", { class: "home-amici-on", type: "button", hidden: "hidden", onclick: function () {
      if (sala) disegnaSalaHost(); else if (salaG) disegnaSalaOspite(); else creaSala();
      invitaQuandoPronta();
    } }, [ avs, tx, el("span", { class: "hao-chiama", text: "📨 Chiama" }) ]);
    HAO = { b: b, avs: avs, tx: tx, firma: null };
    aggiornaAmiciOn(SGAmiciOnline.online());
    return b;
  }
  function aggiornaAmiciOn(l) {
    var H = HAO; if (!H) return;
    if (H.firma !== null && !document.body.contains(H.b)) { HAO = null; return; }   // (la home non c'è più)
    l = l || [];
    var n = l.map(function (x) { return x.nome; });
    var t = !l.length ? "" : "🟢 " + (l.length === 1 ? n[0] + " è nell'app" : (l.length === 2 ? n[0] + " e " + n[1] : n[0] + " e altri " + (l.length - 1)) + " sono nell'app");
    if (H.tx.textContent !== t) H.tx.textContent = t;
    var f = JSON.stringify(l.slice(0, 4).map(function (x) { return [x.uid, x.omino || null]; }));
    if (f !== H.firma) {
      H.firma = f;
      svuota(H.avs);
      l.slice(0, 4).forEach(function (x) {
        H.avs.appendChild(x.omino && window.SGOmino ? el("span", { class: "hao-f", html: SGOmino.svg(x.omino, { busto: true }) })
          : el("span", { class: "hao-f", text: (Array.from(x.nome || "?")[0] || "?").toUpperCase() }));
      });
    }
    if (H.b.hidden !== !l.length) { H.b.hidden = !l.length; stringiHome(H.b.closest(".schermata.home")); }
    H.b.setAttribute("aria-label", t ? t.slice(3) + ": chiamali nella Sala" : "Amici online");
  }
  // la home con tante righe in alto (compagnie, amici nell'app, «Riapri», «Giocato di recente»): da 3 in su il logo si toglie
  // e gli spazi si stringono, così a 360x640 le categorie restano nel primo schermo (anche quando la riga degli amici arriva dopo)
  function stringiHome(s) {
    if (!s) return;
    var h = s.querySelector(".home-amici-on");
    var n = s.querySelectorAll(".home-comp .cmp-tessera").length + (s.querySelector(".home-ieri") ? 1 : 0) + (s.querySelector(".home-rec") ? 1 : 0) + (h && !h.hidden ? 1 : 0);
    if (n) s.classList.add("home-fitta");
    s.classList.toggle("home-fittissima", n >= 3);
  }
  // "Entra ▶" sull'invito di un amico: si va nella sua Sala. Prima si chiede se c'è qualcosa da lasciare:
  // la mia Sala con gli amici dentro ("Chiudere la tua Sala?") o una partita in corso ("Lasci la partita di Scopa?")
  function entraDaInvito(codice, inv) {
    codice = String(codice || "").toUpperCase();
    if (!/^[A-Z0-9]{4,8}$/.test(codice)) return;
    var chi = inv && inv.nome ? String(inv.nome).slice(0, 24) : "", dove = chi ? "Vai nella Sala di " + chi + "." : "Vai nella Sala del tuo amico.";
    var P = partitaCorrente, gioca = staGiocando();
    if ((sala && sala.codice === codice) || (salaG && salaG.codice === codice)) {   // ci sono già: al massimo la rimetto davanti
      if (!gioca && !document.querySelector(".saletta-schermo")) { if (sala) disegnaSalaHost(); else disegnaSalaOspite(); }
      return;
    }
    function vai() {
      if (sala) chiudiSala();
      lasciaPartita();
      if (window.SGNet && SGNet.chiudiGiochi) SGNet.chiudiGiochi();
      chiudiSalaOspite();
      salaOspite(codice);
    }
    var amiciMiei = sala ? sala.membri.filter(function (m) { return m && m.id !== "host"; }).length : 0;
    if (amiciMiei) return chiediConferma("Chiudere la tua Sala?", "Gli amici che sono con te escono. " + dove, "Chiudi e vai", vai);
    if (gioca) return chiediConferma("Lasci la partita di " + (P.g.nome || "adesso") + "?", dove, "Vai", vai);
    vai();
  }

  // 🔑 "Ho un codice": per chi è stato invitato e ha già l'app aperta (o il codice gliel'hanno detto a voce).
  // Un solo campo vero (trasparente, sopra) e 4 caselle disegnate sotto: su iPhone incolla, cancella e tastiera vanno meglio
  // che con 4 campi. Alla quarta lettera si entra da soli. Si può anche incollare tutto il link: il codice lo trovo io.
  // Le Compagnie hanno 6 lettere: alla quarta si aspetta un attimo (700 ms); se arriva la quinta le caselle diventano 6
  // e si entra da soli alla sesta
  var COD_OK = /[A-HJ-NP-Z2-9]/, COD_NO = /[OI01]/;   // i codici non hanno O, I, 0 e 1 (net.js: ALFABETO)
  var ATTESA_QUARTA = 700;
  function codiceDaTesto(t) {
    t = String(t || "");
    var m = /(?:stanza|sala|gruppo)=([A-Za-z0-9]+)/.exec(t);   // incollato tutto il link (o il messaggio di Invita)?
    if (m) return m[1].toUpperCase().slice(0, 8);
    m = /(?:^|[^A-Za-z0-9])([A-HJ-NP-Z2-9]{6})(?![A-Za-z0-9])/.exec(t);   // una parola di 6 lettere maiuscole da codice (Compagnia)
    if (m && t.replace(/\s/g, "").length > 6) return m[1];
    m = /(?:^|[^A-Za-z0-9])([A-HJ-NP-Z2-9]{4})(?![A-Za-z0-9])/.exec(t);   // una parola di 4 lettere maiuscole da codice
    if (m && t.replace(/\s/g, "").length > 4) return m[1];
    return t.toUpperCase().split("").filter(function (ch) { return COD_OK.test(ch); }).join("").slice(0, 6);
  }
  function entraConCodice(indietro) {
    var conSala = salaSempre();
    var s = schermata({ icona: "🔑", titolo: "Entra con un codice", sotto: conSala ? "Te l'ha mandato chi ha aperto la Sala" : "Te l'ha mandato chi ha aperto la stanza", indietro: indietro || schermataHome });
    var input = el("input", { type: "text", class: "codice4-campo codice-campo", maxlength: "4", inputmode: "text", enterkeyhint: "go",
      autocomplete: "off", autocorrect: "off", autocapitalize: "characters", spellcheck: "false", "aria-label": "Codice di 4 lettere (6 per una compagnia)" });
    var caselle = [0, 1, 2, 3].map(function () { return el("span"); }), piu = [el("span"), el("span")];
    var fila = el("div", { class: "codice4-caselle", "aria-hidden": "true" }, caselle);
    var box = el("div", { class: "codice4" }, [ fila, input ]);
    var err = el("p", { class: "codice4-avviso" });
    var partito = false, tQuarta = null;
    // le caselle mostrano le lettere del campo; la casella attiva ha il cursore (solo se il campo ha il tocco).
    // 4 caselle; dalla quinta lettera 6 (classe "sei": più strette, sempre in una riga). Il campo tiene 4 lettere, e 6
    // appena ce ne sono 4 (così si può scrivere la quinta)
    function disegna() {
      var v = input.value, n = v.length > 4 ? 6 : 4, lim = v.length >= 4 ? "6" : "4";
      if (input.getAttribute("maxlength") !== lim) input.setAttribute("maxlength", lim);
      if ((n === 6) !== box.classList.contains("sei")) {
        box.classList.toggle("sei", n === 6);
        piu.forEach(function (c) { if (n === 6) fila.appendChild(c); else if (c.parentNode) fila.removeChild(c); });
        caselle = n === 6 ? caselle.slice(0, 4).concat(piu) : caselle.slice(0, 4);
      }
      caselle.forEach(function (c, i) {
        c.textContent = v[i] || "";
        c.className = (v[i] ? "piena" : "") + (i === Math.min(v.length, n - 1) && document.activeElement === input && v.length < n ? " attiva" : "");
      });
    }
    // 4 lettere: si entra tra un attimo (se non arriva la quinta); 6: subito. Cancellando (da 5 a 4) non si parte da soli
    var lungPrima = 0;
    function forse(v, subito) {
      var cala = v.length < lungPrima; lungPrima = v.length;
      clearTimeout(tQuarta); tQuarta = null;
      if (v.length === 6 || (v.length === 4 && subito)) return vai(false);
      if (v.length === 4 && !cala) tQuarta = setTimeout(function () { tQuarta = null; if (document.body.contains(s) && input.value.length === 4) vai(false); }, ATTESA_QUARTA);
    }
    function avvisa(t) { err.textContent = t || ""; err.className = "codice4-avviso" + (t ? " si" : ""); }
    function vai(daTasto) {
      if (partito) return;
      var c = String(input._lungo || input.value || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      if (c.length < (daTasto ? 3 : 4) || c.length > 8) { if (daTasto) avvisa("Scrivi le 4 lettere del codice."); return; }
      partito = true;
      try { input.blur(); } catch (e) {}
      cercaStanza(c, function () { entraConCodice(indietro); });
    }
    // ogni carattere: maiuscolo; O, I, 0 e 1 non entrano (e lo dico); gli altri non validi spariscono
    function pulisci(testo) {
      var fuori = false, v = "";
      String(testo).toUpperCase().split("").forEach(function (ch) {
        if (COD_NO.test(ch)) fuori = true; else if (COD_OK.test(ch)) v += ch;
      });
      return { v: v.slice(0, 6), fuori: fuori };
    }
    function metti(v, subito) {
      input._lungo = null;
      input.value = v;
      try { input.setSelectionRange(v.length, v.length); } catch (e) {}
      disegna();
      forse(v, subito);
    }
    input.addEventListener("input", function () {
      var p = pulisci(input.value);
      avvisa(p.fuori ? "Nei codici non ci sono O, I, 0 e 1" : "");
      if (p.v !== input.value) return metti(p.v);   // (se è già giusto non lo riscrivo: la tastiera non si confonde)
      input._lungo = null; disegna();
      forse(p.v);
    });
    // incollato: il link (o il messaggio intero) non passerebbe dalle lettere del campo. Incollato è già tutto: si entra subito
    function incollato(t) {
      avvisa("");
      var c = codiceDaTesto(t);
      if (c.length > 6) { metti(c.slice(0, 6)); clearTimeout(tQuarta); input._lungo = c; return; }   // un codice vecchio più lungo: parte con "Entra ▶"
      metti(c, true);
    }
    // un testo lungo (link, messaggio di Invita, codice con spazi o di 6 lettere) va letto tutto: dal campo da 4 non passerebbe
    function lungo(t) { return t.length > 4 || (t.length > 1 && /[=\/:.\s]/.test(t)); }
    input.addEventListener("paste", function (e) {
      var t = (e.clipboardData || window.clipboardData || { getData: function () { return ""; } }).getData("text");
      if (!t || !lungo(t)) return;   // (poche lettere: entrano come scritte a mano)
      e.preventDefault(); incollato(t);
    });
    // (su Android "Incolla" dalla barra della tastiera può arrivare senza "paste": il link non deve diventare "HTTP")
    input.addEventListener("beforeinput", function (e) {
      var t = e.data || (e.dataTransfer && e.dataTransfer.getData("text")) || "";
      if (!t || e.isComposing || !lungo(t)) return;
      e.preventDefault(); incollato(t);
    });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") vai(true); });
    input.addEventListener("focus", disegna);
    input.addEventListener("blur", disegna);
    // il tocco sulle caselle: il campo è sopra, ma il cursore va sempre in fondo
    input.addEventListener("click", function () { try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {} });
    s._contenuto.appendChild(box);
    s._contenuto.appendChild(err);
    s._contenuto.appendChild(el("p", { class: "modulo-nota codice4-nota", text: (conSala ? "Il codice lo vedi in alto nella saletta di chi ha aperto la Sala (4 lettere, 6 per una compagnia)." : "Il codice lo vede chi ha aperto la stanza, in alto nella saletta (4 lettere).") + " Puoi anche incollare il link che ti hanno mandato." }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () { vai(true); } }));
    mostra(s);
    disegna();
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 250);
  }
  function cercaStanza(c, riprova) {
    if (!(window.SGNet && SGNet.disponibile())) {
      window.alert("Il collegamento non è disponibile qui. Apre solo dal sito pubblicato online.");
      return;
    }
    // 6 lettere: una Compagnia (se non c'è nessuno e non è tra le mie, prima chiede se aprire la serata)
    if (codiceComp(c)) { var v = null; try { v = window.SGCompagnia ? SGCompagnia.trova(c) : null; } catch (e) {} return apriCompagnia(c, { nome: v && v.n, emoji: v && v.e, daCodice: riprova || function () { entraConCodice(); } }); }
    var s = schermata({ icona: "🔗", titolo: "Entro nella stanza…", sotto: "Codice " + c });
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Cerco la partita in corso… un attimo." }));
    mostra(s);
    SGNet.scopriGioco(c, function (gid) {
      if (!document.body.contains(s)) return;   // intanto si è andati altrove
      if (gid === "__sala") return salaOspite(c);   // è una Sala, non un singolo gioco
      var g = gid && giocoDa(gid);
      if (!g) {
        svuota(s._contenuto); svuota(s._piede);
        s._contenuto.appendChild(el("p", { class: "link-avviso",
          text: "Non trovo una partita con il codice " + c + ". Controlla di averlo scritto giusto, oppure apri il link che ti ha mandato chi organizza." }));
        if (riprova) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "✏️ Riscrivi il codice", onclick: riprova }));
        s._piede.appendChild(el("button", { class: "btn " + (riprova ? "btn-fantasma" : "btn-primario"), text: "↩︎ Torna alla home", onclick: schermataHome }));
        mostra(s);
        return;
      }
      // si entra subito, senza ricaricare l'app (se la stanza è ferma lo dice la schermata del gioco, e se l'host torna si entra da soli)
      linkParams = { gioco: g.id, stanza: c };
      avviaPartita(g, [], {});
    });
  }

  // il browser ci avvisa quando il sito si può installare come app: teniamo l'avviso per il pulsante in home
  var promptInstalla = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); promptInstalla = e;
    if (document.querySelector(".home")) schermataHome();   // se sei in home, compare subito il pulsante
  });

  // dove si torna con "indietro" / "esci": in home, oppure nell'edificio della città da cui si è entrati
  var rientro = null;
  function tornaHome() { var r = rientro; rientro = null; (r || schermataHome)(); }
  function schermataHome() {
    rientro = null;
    if (window.SGNet && SGNet.chiudiGiochi) SGNet.chiudiGiochi();   // niente collegamenti vecchi aperti (la sala resta)
    // la Sala resta aperta ma il gioco no: lo dico agli amici (tornano nella Sala invece di aspettare una stanza chiusa)
    if (sala && sala.inGioco && !sala.elim) { sala.gioco = sala.stanza = null; sala.inGioco = false; sala.fase = null; sala.fuori = {}; sala.ctx = null; sala.duello = null; if (sala._bcast) sala._bcast(); }
    chiudiTabelloneElim();
    tieniAcceso(false);
    var s = schermata({});
    s.className += " home";
    var io = profiloAttivo();
    // riga profilo: il nome utente (col livello e le Speed Coins) + il tasto "Novità" affianco
    var prog = io && io.cloud && window.SGLivelli && SGNube.progressione ? SGNube.progressione() : null;
    var profiloChip = el("button", { class: "profilo-chip" + (prog ? " con-livello" : ""), onclick: function () { schermataAccesso(schermataHome); } },
      io ? [io.omino && window.SGOmino ? el("span", { class: "chip-omino", html: SGOmino.svg(io.omino, { busto: true }) }) : el("span", { text: io.emoji }),
            prog ? chipLivello(io.nome, prog) : el("span", { text: io.nome }),
            prog ? el("span", { class: "chip-monete", text: "🪙 " + cifre(prog.coins) }) : null,
            el("span", { class: "modifica", text: "cambia" })]
         : [el("span", { text: "👤" }), el("span", { text: "Crea il tuo profilo" })]);
    var rigaProfilo = el("div", { class: "home-profilo" }, [profiloChip]);
    if ((window.SG_NOVITA || []).length) {
      var bNov = el("button", { class: "home-novita", onclick: function () { novitaLista(); } });   // dal menu: la lista semplice (la bacheca è in città)
      bNov.appendChild(el("span", { text: "🆕 Novità" }));
      if (!novitaTutteViste()) bNov.appendChild(el("span", { class: "pallino" }));
      rigaProfilo.appendChild(bNov);
    }
    // la città: accanto a Novità; gli edifici portano ai giochi della loro categoria
    if (CITTA_VISIBILE && window.SGCitta) rigaProfilo.appendChild(el("button", { class: "home-novita home-citta", onclick: schermataCitta }, [ el("span", { text: "🏙️ La città" }) ]));
    rigaProfilo.appendChild(el("button", { class: "home-novita", onclick: schermataSfide }, [ el("span", { text: "🏆 Trofei" }) ]));
    rigaProfilo.appendChild(el("button", { class: "home-novita home-amici", onclick: function () { schermataAmici(); } }, [ el("span", { text: "👥 Classifica" }), cacheRich && cacheRich.arrivate.length ? el("span", { class: "pallino" }) : null ]));
    setTimeout(function () { aggiornaRichieste(); }, 0);   // richieste di amicizia nuove? pallino sul tasto
    // "Installa l'app": solo dal browser (se è già aperta come app, non serve)
    var giaApp = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
    var iPhone = /iphone|ipad|ipod/i.test(navigator.userAgent);
    function installa() {
      if (promptInstalla) { promptInstalla.prompt(); promptInstalla.userChoice.then(function () { promptInstalla = null; schermataHome(); }); }
      else if (iPhone) alert("Per installarla: tocca il tasto Condividi (il quadrato con la freccia) e poi \"Aggiungi alla schermata Home\".");
      else alert("Per installarla: tocca i tre puntini ⋮ in alto a destra e scegli \"Installa app\" (oppure \"Aggiungi a schermata Home\").");
    }
    var tInstalla = giaApp ? null : el("button", { class: "home-novita", onclick: installa }, [ el("span", { text: "📲 Installa l'app" }) ]);
    if (tInstalla) rigaProfilo.appendChild(tInstalla);
    // 📱 il menu sotto (HOME_MENU_SOTTO, proposta del 29 ott 2026: «tenere il menu sotto come le app moderne»): in alto solo il titolo
    // e le monete, in basso Giochi · Novità · Trofei · Classifica · Profilo, sempre sotto il pollice; la home lascia più posto ai giochi
    var testaCorta = null;
    if (HOME_MENU_SOTTO) {
      s.classList.add("home-menu-sotto");
      testaCorta = prog ? el("button", { class: "ms-monete", "aria-label": "Il tuo profilo e le Speed Coins", onclick: function () { schermataAccesso(schermataHome); } }, [ el("span", { text: "🪙 " + cifre(prog.coins) }) ]) : null;
      s._menu = "giochi";
    }
    s._contenuto.appendChild(el("div", { class: "home-hero" }, [
      el("div", { class: "home-logo", html: '<svg viewBox="0 0 200 118" width="156" height="92" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="sgBolt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6bf"/><stop offset=".42" stop-color="#ffd23b"/><stop offset=".72" stop-color="#f6a70c"/><stop offset="1" stop-color="#c06a08"/></linearGradient><linearGradient id="sgBoltHi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf0" stop-opacity=".95"/><stop offset=".5" stop-color="#ffffff" stop-opacity="0"/></linearGradient><filter id="sgGlow" x="-70%" y="-70%" width="240%" height="240%"><feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="#ff9d2e" flood-opacity=".75"/><feDropShadow dx="0" dy="0" stdDeviation="16" flood-color="#ff7b16" flood-opacity=".4"/></filter><path id="sgB" d="M13 0 L2 20 L10 20 L7 36 L22 12 L13 12 L17 0 Z"/></defs><g filter="url(#sgGlow)" stroke="#8a5209" stroke-width="1.3" stroke-linejoin="round"><use href="#sgB" transform="translate(18,34) scale(1.5)" fill="url(#sgBolt)"/><use href="#sgB" transform="translate(78,14) scale(1.95)" fill="url(#sgBolt)"/><use href="#sgB" transform="translate(150,34) scale(1.5)" fill="url(#sgBolt)"/></g><g stroke="none"><use href="#sgB" transform="translate(18,34) scale(1.5)" fill="url(#sgBoltHi)"/><use href="#sgB" transform="translate(78,14) scale(1.95)" fill="url(#sgBoltHi)"/><use href="#sgB" transform="translate(150,34) scale(1.5)" fill="url(#sgBoltHi)"/></g></svg>' }),
      el("h1", { class: "home-titolo", html: "SPeeD <b>GAME</b>" }),   // (🌙 «GAME» col lampone)
      HOME_MENU_SOTTO ? testaCorta : rigaProfilo
    ]));
    // stavi giocando da ospite e la pagina si è ricaricata (o hai riaperto l'app)? Si rientra al proprio posto
    // (rStanza: non "rientro", che è il ritorno all'edificio della città e qui sopra si azzera)
    var rStanza = stanzaRecente();
    if (rStanza) {
      var gR = rStanza.gioco ? giocoDa(rStanza.gioco) : null;
      s._contenuto.appendChild(el("div", { class: "home-rientra" }, [
        el("button", { class: "btn btn-primario", onclick: function () { rientraStanza(rStanza); } }, [
          el("span", { text: "🔁 Rientra nella partita" }),
          el("small", { text: rStanza.sala ? "👥 Sala online · stanza " + rStanza.sala : (gR ? gR.icona + " " + gR.nome : "Partita") + " · stanza " + rStanza.stanza }) ]),
        el("button", { class: "home-rientra-x", "aria-label": "Non rientrare", text: "✕", onclick: function () { dimenticaStanza(); schermataHome(); } })
      ]));
    }
    // l'online in alto, a un tocco: "🔗 Gioca online" (apre la Sala della serata) e "🔑 Ho un codice"
    var conSala = salaSempre();
    // le Compagnie (Passo 3): una tessera per compagnia con chi è dentro ("🟢 Paky e Luca sono dentro · Entra ›"), un tocco e si
    // è nella Sala. Si aggiornano da sole al loro posto (js/compagnia.js); quelle salvate dall'altro telefono arrivano col profilo
    if (conSala && window.SGCompagnia && SGCompagnia.tessere) try {
      SGCompagnia.sincronizza();
      var boxComp = el("div", { class: "home-comp" });
      if (SGCompagnia.tessere(boxComp)) s._contenuto.appendChild(boxComp);
    } catch (e) { setTimeout(function () { throw e; }, 0); }
    if (conSala) s._contenuto.appendChild(rigaOnline());
    // "🟢 Giulia e altri 2 sono nell'app · 📨 Chiama": gli amici col pallino verde (Passo 6; si aggiorna da sola)
    amiciStato();
    var hao = conSala ? rigaAmiciOn() : null;
    if (hao) s._contenuto.appendChild(hao);
    // "🔁 Riapri la Sala di ieri sera (Giulia, Luca)": stesso codice, gli amici col link vecchio entrano da soli
    var ieri = conSala && !sala && !salaG ? salaDiIeri() : null;
    if (ieri) s._contenuto.appendChild(rigaIeri(ieri));
    // "👥 Giocato di recente": con chi ho giocato online ("Luca · 🎲 Tris", ➕ per chiedere l'amicizia col profilo online)
    var rec = null;
    if (conSala && window.SGCompagnia && SGCompagnia.rigaRecenti) try {
      rec = el("div", { class: "home-rec" });
      if (SGCompagnia.rigaRecenti(rec, { conPiu: !!mioUidOnline() })) s._contenuto.appendChild(rec); else rec = null;
    } catch (e) { rec = null; setTimeout(function () { throw e; }, 0); }
    var fitta = !!(ieri || rec || s.querySelector(".home-comp") || (hao && !hao.hidden));
    if (fitta) s.classList.add("home-fitta");   // (più cose in alto: la home si stringe un po')
    stringiHome(s);
    // «📲 Installa l'app» sta sempre in fondo, vicino a Proposte e Bug (🌙 in alto restano i quattro tasti tondi: Novità, La città, Trofei, Classifica)
    if (tInstalla) { rigaProfilo.removeChild(tInstalla); tInstalla = null; }
    // Barra delle categorie (sotto il profilo): "Tutti" + i gruppi. Cliccando si filtra
    // solo la griglia (senza rifare la schermata: niente lampeggio, non si torna in cima).
    var barra = el("div", { class: "cat-barra" });
    var griglia = el("div", { class: "griglia-giochi compatta tess-" + HOME_TESSERE });
    var presto = el("div", { class: "tessera presto" }, [
      el("span", { class: "icona", text: "➕" }),
      el("div", { class: "info" }, [
        el("h2", { text: "Altri giochi in arrivo" })
      ])
    ]);
    var padrone = eProprietario();   // (solo IL PAPPONE: tenendo premuta una tessera si apre «🧩 Ordine dei giochi»)
    function riempiGriglia() {
      griglia.innerHTML = "";
      giochi.forEach(function (g) {
        if (catAttiva === "tutti" || catDi(g) === catAttiva) {
          var tess = tesseraGioco(g, function () { apriGioco(g); }, true);
          if (padrone) tienPremuto(tess, schermataOrdineGiochi);
          griglia.appendChild(tess);
        }
      });
      if (catAttiva === "tutti") griglia.appendChild(presto); // il segnaposto solo in "Tutti"
    }
    CATEGORIE.forEach(function (c) {
      // salto una categoria (tranne "Tutti") se per ora non ha giochi
      if (c.id !== "tutti" && !giochi.some(function (g) { return catDi(g) === c.id; })) return;
      var chip = el("button", { class: "cat-tab" + (c.id === catAttiva ? " attiva" : ""), "data-cat": c.id, onclick: function () {
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
    // con la Sala in alto: il torneo è un tasto piccolo qui (Sala e codice stanno nella riga online)
    if (conSala) azioni.appendChild(el("button", { class: "azione", text: (torneo || (sala && sala.torneo)) ? "🏆 Riprendi la serata a punti" : "🏆 Serata a punti", onclick: apriTorneo }));
    if (!giaApp && !tInstalla) azioni.appendChild(el("button", { class: "azione", text: "📲 Installa l'app", onclick: installa }));
    s._piede.appendChild(azioni);
    if (rec) recInHome(rec, barra);
    if (conSala) return mostra(s);

    // Torneo: più giochi di fila con gli stessi giocatori, punti che si sommano
    s._piede.appendChild(el("button", {
      class: "btn btn-primario", html: (torneo || (sala && sala.torneo)) ? "🏆 Riprendi la serata a punti" : "🏆 Serata a punti (più giochi di fila)",
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

  // ---- Livello e Speed Coins (regole in livelli.js) ----
  // nel tasto del profilo: nome, livello (con le stelle del Prestigio) e la barra degli XP
  function chipLivello(nome, prog) {
    var serve = SGLivelli.xpPerSalire(prog.level), pct = Math.max(3, Math.min(100, Math.floor(prog.xp * 100 / serve)));
    return el("span", { class: "chip-testo" }, [
      el("span", { class: "chip-nome", text: nome }),
      el("span", { class: "chip-livello" }, [
        el("b", { text: (prog.prestige ? "★" + prog.prestige + " " : "") + "Lv " + prog.level }),
        el("i", { class: "chip-xp" }, [ el("i", { style: "width:" + pct + "%" }) ])
      ])
    ]);
  }
  // nel profilo: livello, barra degli XP, Speed Coins, Prestigio e come si guadagnano
  function riquadroLivello(prog) {
    var L = SGLivelli, serve = L.xpPerSalire(prog.level), pct = Math.max(2, Math.min(100, Math.floor(prog.xp * 100 / serve)));
    var prossimo = prog.level >= L.MAX ? "Al prossimo traguardo scatta il <b>Prestigio</b>: +" + cifre(L.BONUS_PRESTIGIO) + " 🪙"
      : "Al livello " + (prog.level + 1) + ": +" + cifre(L.bonusLivello(prog.level + 1)) + " 🪙";
    return el("div", { class: "riquadro-livello" }, [
      el("div", { class: "rl-alto" }, [
        el("div", { class: "rl-liv" }, [ el("small", { text: prog.prestige ? "Prestigio " + prog.prestige + " ★" : "Livello" }), el("b", { text: "" + prog.level }), el("span", { text: "su " + L.MAX }) ]),
        el("div", { class: "rl-monete" }, [ el("b", { text: "🪙 " + cifre(prog.coins) }), el("span", { text: "Speed Coins" }) ])
      ]),
      el("div", { class: "rl-barra" }, [ el("i", { style: "width:" + pct + "%" }) ]),
      el("div", { class: "rl-xp", html: "<b>" + cifre(prog.xp) + "</b> / " + cifre(serve) + " XP · " + prossimo }),
      el("ul", { class: "rl-regole" }, [
        el("li", { html: "<b>1 XP per ogni secondo</b> di partita: almeno " + L.MIN_XP + " XP per ogni partita finita, al massimo 30 minuti contati" }),
        el("li", { html: "<b>+" + Math.round(L.BONUS_VITTORIA * 100) + "%</b> se vinci, <b>+" + L.BONUS_GIORNO + " XP</b> alla prima partita del giorno" }),
        el("li", { html: "Ogni livello nuovo regala <b>livello × 50</b> Speed Coins" }),
        el("li", { html: "Ogni <b>trofeo</b> regala XP e Speed Coins: bronzo 100, argento 250, oro 600, diamante 1.500, Platino 3.000" }),
        el("li", { html: "Dopo il livello " + L.MAX + " scatta il <b>Prestigio</b>: si riparte dal livello 1 con <b>" + cifre(L.BONUS_PRESTIGIO) + "</b> Speed Coins in regalo" })
      ])
    ]);
  }

  function tempoBreve(ms) { var m = Math.max(1, Math.ceil((ms || 0) / 60000)), h = Math.floor(m / 60); return h ? h + "h " + (m % 60) + "m" : m + " min"; }

  // ---- La ruota del giorno (al posto del regalo fisso): un giro al giorno, torna a mezzanotte.
  //      Spicchi di monete (oro) e di XP (viola); le regole e i premi stanno in nube.js (SGNube.ruota).
  //      dopo(esito) = facoltativo: chi l'ha aperta aggiorna le sue monete / il suo livello ----
  function testoPremioRuota(p) { return p.xp ? cifre(p.xp) + " XP" : cifre(p.monete); }
  function disegnaRuotaGiorno(cv, R, lato) {
    var dpr = Math.min(2, window.devicePixelRatio || 1), r = lato / 2, n = R.length, passo = Math.PI * 2 / n;
    cv.width = cv.height = Math.round(lato * dpr); cv.style.width = cv.style.height = lato + "px";
    var c = cv.getContext("2d"); c.scale(dpr, dpr); c.translate(r, r);
    R.forEach(function (p, i) {
      var a0 = -Math.PI / 2 + i * passo, a1 = a0 + passo, g = c.createRadialGradient(0, 0, r * 0.15, 0, 0, r);
      if (p.top && p.xp) { g.addColorStop(0, "#5ff0d0"); g.addColorStop(1, "#0b8f78"); }
      else if (p.top) { g.addColorStop(0, "#ff7a6b"); g.addColorStop(1, "#c3171f"); }
      else if (p.xp) { g.addColorStop(0, i % 4 === 1 ? "#a58bff" : "#8f7bff"); g.addColorStop(1, i % 4 === 1 ? "#5a33d6" : "#4a2fb8"); }
      else { g.addColorStop(0, "#ffe9a0"); g.addColorStop(1, i % 4 === 2 ? "#f0a400" : "#e39300"); }
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r - 2, a0, a1); c.closePath();
      c.fillStyle = g; c.fill(); c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 2; c.stroke();
      // la scritta lungo il raggio, verso il bordo
      c.save(); c.rotate(a0 + passo / 2); c.textAlign = "right"; c.textBaseline = "middle";
      var scuro = !p.xp && !p.top, testo = p.xp ? cifre(p.xp) : cifre(p.monete);
      c.fillStyle = scuro ? "#4a2a00" : "#fff"; c.font = "900 " + Math.round(lato * (testo.length > 4 ? 0.068 : 0.078)) + "px system-ui, sans-serif";
      if (!scuro) { c.shadowColor = "rgba(0,0,0,.35)"; c.shadowBlur = 3; }
      c.fillText(testo, r - lato * 0.115, 0);
      c.shadowBlur = 0;
      // dopo il numero: la moneta o la scritta XP
      if (p.xp) { c.font = "900 " + Math.round(lato * 0.04) + "px system-ui, sans-serif"; c.fillStyle = "rgba(255,255,255,.9)"; c.fillText("XP", r - lato * 0.05, 0); }
      else {
        c.beginPath(); c.arc(r - lato * 0.072, 0, lato * 0.026, 0, Math.PI * 2);
        c.fillStyle = p.top ? "#ffd43b" : "#fff3bf"; c.fill(); c.lineWidth = 1.5; c.strokeStyle = "#b7791f"; c.stroke();
      }
      c.restore();
    });
  }
  function suonoRuota(tipo) {
    var ctx = audioCtx(); if (!ctx) return;
    try {
      var note = tipo === "tic" ? [[1900, 0, 0.035, 0.05]] : tipo === "top" ? [[784, 0, .3, .2], [988, .1, .3, .2], [1175, .2, .3, .2], [1568, .3, .6, .22], [2093, .45, .7, .18]]
        : [[880, 0, .25, .18], [1175, .1, .25, .18], [1568, .2, .5, .18]];
      note.forEach(function (n) {
        var t0 = ctx.currentTime + n[1], o = ctx.createOscillator(), gn = ctx.createGain();
        o.type = tipo === "tic" ? "triangle" : "sine"; o.frequency.setValueAtTime(n[0], t0);
        gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(n[3], t0 + 0.008); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + n[2]);
        o.connect(gn); gn.connect(ctx.destination); o.start(t0); o.stop(t0 + n[2] + 0.05);
      });
    } catch (e) {}
  }
  function ruotaDelGiorno(dopo) {
    var N = window.SGNube, R = N && N.ruota;
    if (!R || !(N.profilo && N.profilo())) return;
    var n = R.length, passo = 360 / n, lato = Math.max(220, Math.min(330, Math.round(window.innerWidth - 90), Math.round((window.innerHeight || 640) * 0.48)));
    var pronta = N.puoRitirareBonus(), ang = 0, girando = false, finita = false;
    var cv = el("canvas", { class: "rg-disco" });
    disegnaRuotaGiorno(cv, R, lato);
    // le lampadine sul bordo (ferme: gira solo il disco)
    var luci = "";
    for (var k = 0; k < 24; k++) {
      var a = k * Math.PI * 2 / 24, x = 50 + 48.3 * Math.sin(a), y = 50 - 48.3 * Math.cos(a);
      luci += '<circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="1.35" class="' + (k % 2 ? "rg-l2" : "rg-l1") + '"/>';
    }
    var bordo = el("div", { class: "rg-bordo", html: '<svg viewBox="0 0 100 100">' + luci + "</svg>" });
    var freccia = el("div", { class: "rg-freccia" });
    var gira = el("button", { class: "rg-gira", text: pronta ? "GIRA" : "⏳" });
    var sotto = el("div", { class: "rg-sotto", text: pronta ? "Un giro al giorno: monete o XP. Tocca GIRA!" : "Hai già girato oggi: il prossimo giro tra " + tempoBreve(N.prossimoBonusMs()) + " (a mezzanotte)" });
    var esito = el("div", { class: "rg-esito" });
    var chiudiB = el("button", { class: "btn " + (pronta ? "btn-fantasma" : "btn-primario") + " rg-chiudi", text: pronta ? "Più tardi" : "Chiudi" });
    var tutto = el("div", { class: "rg-tutto", style: "width:" + (lato + 22) + "px;height:" + (lato + 22) + "px" }, [ bordo, cv, freccia, gira ]);
    var velo = el("div", { class: "rg-velo" }, [ el("div", { class: "rg-scheda" }, [
      el("div", { class: "rg-titolo", text: "🎡 Ruota del giorno" }), sotto, tutto, esito, chiudiB ]) ]);
    if (!pronta) velo.classList.add("ferma");
    function chiudi() {
      if (girando) return;
      velo.classList.remove("su");
      setTimeout(function () { if (velo.parentNode) velo.parentNode.removeChild(velo); }, 260);
    }
    chiudiB.onclick = chiudi;
    velo.addEventListener("click", function (e) { if (e.target === velo) chiudi(); });
    gira.onclick = function () {
      if (girando || finita) return;
      var res = N.giraRuota();
      if (!res) { sotto.textContent = "Hai già girato oggi: torna dopo mezzanotte 🌙"; gira.textContent = "⏳"; velo.classList.add("ferma"); return; }
      girando = true; gira.disabled = true; chiudiB.style.visibility = "hidden";
      sotto.textContent = "Gira, gira…";
      // dove deve fermarsi: lo spicchio vinto sotto la freccia (in alto), non sempre nel centro dello spicchio
      var theta = (res.i + 0.5) * passo + (Math.random() - 0.5) * passo * 0.7;
      var meta = Math.ceil(ang / 360) * 360 + 360 * 6 + ((360 - theta) % 360);
      var a0 = ang, t0 = 0, durata = 5200, tacca = Math.floor(ang / passo);
      function passo1(ora) {
        if (!t0) t0 = ora;
        var k = Math.min(1, (ora - t0) / durata), e = 1 - Math.pow(1 - k, 4);
        ang = a0 + (meta - a0) * e;
        cv.style.transform = "rotate(" + ang.toFixed(2) + "deg)";
        var tq = Math.floor(ang / passo);
        if (tq !== tacca) { tacca = tq; suonoRuota("tic"); freccia.classList.remove("tic"); void freccia.offsetWidth; freccia.classList.add("tic"); }
        if (k < 1) requestAnimationFrame(passo1); else fermata();
      }
      requestAnimationFrame(passo1);
      function fermata() {
        girando = false; finita = true;
        var p = res.premio;
        tutto.classList.add("vinto"); if (p.top) velo.classList.add("top");
        suonoRuota(p.top ? "top" : "vinto");
        try { if (navigator.vibrate) navigator.vibrate(p.top ? [40, 60, 40, 60, 90] : [30, 40, 30]); } catch (e) {}
        esito.innerHTML = "";
        esito.appendChild(el("b", { text: "+" + testoPremioRuota(p) + (p.xp ? "" : " 🪙") }));
        esito.appendChild(el("span", { text: p.top ? "Premio grosso! ⭐" : (p.xp ? "Punti esperienza per salire di livello" : "Speed Coins") }));
        esito.classList.add("su");
        sotto.textContent = "Il prossimo giro a mezzanotte 🌙";
        gira.textContent = "✓";
        chiudiB.textContent = "Ritira"; chiudiB.className = "btn btn-primario rg-chiudi"; chiudiB.style.visibility = "";
        // livelli saliti con gli XP della ruota (ognuno regala monete)
        var lv = 0, pr = 0, m2 = 0;
        (res.eventi || []).forEach(function (e) { m2 += e.monete; if (e.tipo === "livello") lv = e.livello; if (e.tipo === "prestigio") pr = e.prestigio; });
        if (pr) codaTrofei.push({ tipo: "xp", cls: "tl-platino", icona: "🌟", su: "PRESTIGIO " + pr + "!", nome: "Si riparte dal livello 1", sotto: "+" + cifre(m2) + " Speed Coins 🪙" });
        else if (lv) codaTrofei.push({ tipo: "xp", cls: "tl-oro", icona: "🆙", su: "Con la ruota del giorno", nome: "Livello " + lv + "!", sotto: "+" + cifre(m2) + " Speed Coins 🪙" });
        if (res.avvisa) res.avvisa();   // ora i trofei (es. "Ritira il regalo del giorno 10 volte")
        prossimoAvviso();
        if (dopo) dopo(res);
      }
    };
    document.body.appendChild(velo);
    requestAnimationFrame(function () { requestAnimationFrame(function () { velo.classList.add("su"); }); });
  }
  // ---- La città: si tocca un edificio, la città fa zoom e si entra.
  //      In alto chi sei (avatar, nome, livello con la barra degli XP) e le Speed Coins;
  //      in basso Casa, Clan e Negozio (in arrivo) e la Ruota del giorno ----
  // ---- La casa (js/casa.js) e il negozio: per tutti quelli col profilo. Si paga con le Speed Coins vere;
  //      la casa si salva nel profilo (Firebase) e anche su questo telefono, così non si perde niente ----
  var casaInUso = null, tCasaNube = null;   // la casa aperta adesso (casa e negozio lavorano sulla stessa)
  function chiaveCasa() { var N = window.SGNube, u = N && N.utente && N.utente(); return u ? "sg-casa|" + u.uid : null; }
  function datiCasa() {
    var N = window.SGNube, k = chiaveCasa(); if (!k) return null;
    if (casaInUso && casaInUso._chiave === k) return casaInUso;
    var nube = N.casa && N.casa(), qui = null;
    try { qui = JSON.parse(localStorage.getItem(k) || "null"); } catch (e) {}
    var c = nube && (!qui || (nube.agg || 0) >= (qui.agg || 0)) ? JSON.parse(JSON.stringify(nube)) : qui;   // la più recente
    if (!c || !c.v) { c = SGCasa.casaIniziale(); delete c.monete; }   // si parte dalla casa scadente, uguale per tutti
    c._chiave = k; casaInUso = c; return c;
  }
  function salvaCasa(c) {
    var k = chiaveCasa(); if (!k || !c) return;
    c.agg = Date.now(); casaInUso = c;
    var pulita = JSON.parse(JSON.stringify(c)); delete pulita._chiave;
    try { localStorage.setItem(k, JSON.stringify(pulita)); } catch (e) {}
    clearTimeout(tCasaNube); tCasaNube = setTimeout(function () {   // nel profilo: un attimo dopo (non a ogni spostamento), e la copia che vedono gli amici
      if (window.SGNube && SGNube.salvaCasa) SGNube.salvaCasa(pulita);
      if (window.SGNube && SGNube.salvaVetrinaCasa) { SGNube.salvaVetrinaCasa(SGCasa.vetrina(pulita)); casaPubblicata = true; }
    }, 1500);
  }
  var casaPubblicata = false;   // la copia per gli amici si rinfresca una volta all'avvio (per chi ha arredato prima che ci fossero le visite)
  function pubblicaCasa() {
    var N = window.SGNube; if (casaPubblicata || !window.SGCasa || !N || !N.salvaVetrinaCasa || !N.casa || !N.casa()) return;
    casaPubblicata = true; N.salvaVetrinaCasa(SGCasa.vetrina(N.casa()));
  }
  // a casa di un amico: la sua casa com'è adesso, col suo avatar che ci gira dentro (si guarda, non si tocca niente)
  function schermataCasaAmico(x, torna) {
    if (!window.SGCasa || !(window.SGNube && SGNube.casaDi)) return;
    var s0 = schermata({ icona: "🏠", titolo: x.nome, sotto: "Vado a casa sua…", indietro: function () { schermataTrofeiAmico(x, torna); } }); mostra(s0);
    SGNube.casaDi(x.uid).catch(function () { return null; }).then(function (c) {
      if (!s0.parentNode) return;   // è già tornato indietro
      var s = SGCasa.crea({ visita: true, vuota: !c, dati: c, avatar: x.omino || null, nome: x.nome, audio: audioCtx, stanza: "soggiorno",
        indietro: function () { schermataTrofeiAmico(x, torna); } });
      mostra(s); s._monta();
    });
  }
  function soldiCasa() { return { monete: function () { return SGNube.monete(); }, spendi: function (n) { SGNube.cambiaMonete(-n); }, guadagna: function (n) { SGNube.cambiaMonete(n); } }; }
  // ---- la pesca al laghetto (js/pesca.js): album, cesto ed esche nel profilo e su questo telefono (come la casa) ----
  var tPescaNube = null;
  function chiavePesca() { var N = window.SGNube, u = N && N.utente && N.utente(); return u ? "sg-pesca|" + u.uid : null; }
  function datiPesca() {
    var N = window.SGNube, k = chiavePesca(); if (!k) return null;
    var nube = N.pesca && N.pesca(), qui = null;
    try { qui = JSON.parse(localStorage.getItem(k) || "null"); } catch (e) {}
    var d = nube && (!qui || (nube.agg || 0) >= (qui.agg || 0)) ? JSON.parse(JSON.stringify(nube)) : qui;   // la più recente
    return d && d.v ? d : null;
  }
  function salvaPesca(d) {
    var k = chiavePesca(); if (!k || !d) return;
    d.agg = Date.now();
    try { localStorage.setItem(k, JSON.stringify(d)); } catch (e) {}
    clearTimeout(tPescaNube); tPescaNube = setTimeout(function () { if (window.SGNube && SGNube.salvaPesca) SGNube.salvaPesca(JSON.parse(JSON.stringify(d))); }, 1200);
  }
  function schermataPesca() {
    if (!window.SGPesca) return schermataCitta();
    if (serveProfilo()) return;
    var io = profiloAttivo();
    var s = SGPesca.crea({ omino: io && io.omino, dati: datiPesca(), salva: salvaPesca, audio: audioCtx,
      monete: function () { return SGNube.monete(); }, cambia: function (n) { SGNube.cambiaMonete(n); },
      apriGara: giocoDa("garapesca") ? function () { rientro = schermataPesca; apriGioco(giocoDa("garapesca")); } : null,   // la gara di pesca con gli amici, online
      indietro: function () { schermataCitta(); } });
    mostra(s); s._monta();
  }
  // ---- gli scavi antichi (js/scavi.js): museo, zaino e colpi nel profilo e su questo telefono (come la pesca) ----
  var tScaviNube = null;
  function chiaveScavi() { var N = window.SGNube, u = N && N.utente && N.utente(); return u ? "sg-scavi|" + u.uid : null; }
  function datiScavi() {
    var N = window.SGNube, k = chiaveScavi(); if (!k) return null;
    var nube = N.scavi && N.scavi(), qui = null;
    try { qui = JSON.parse(localStorage.getItem(k) || "null"); } catch (e) {}
    var d = nube && (!qui || (nube.agg || 0) >= (qui.agg || 0)) ? JSON.parse(JSON.stringify(nube)) : qui;   // la più recente
    return d && d.v ? d : null;
  }
  function salvaScavi(d) {
    var k = chiaveScavi(); if (!k || !d) return;
    d.agg = Date.now();
    try { localStorage.setItem(k, JSON.stringify(d)); } catch (e) {}
    clearTimeout(tScaviNube); tScaviNube = setTimeout(function () { if (window.SGNube && SGNube.salvaScavi) SGNube.salvaScavi(JSON.parse(JSON.stringify(d))); }, 1200);
  }
  function schermataScavi() {
    if (!window.SGScavi) return schermataCitta();
    if (serveProfilo()) return;
    var io = profiloAttivo(), u = window.SGNube && SGNube.utente && SGNube.utente();
    var s = SGScavi.crea({ omino: io && io.omino, dati: datiScavi(), salva: salvaScavi, audio: audioCtx, seme: u ? u.uid : "", illimitati: eProprietario(),   // il proprietario (IL PAPPONE) ha i colpi illimitati, per provare
      monete: function () { return SGNube.monete(); }, cambia: function (n) { SGNube.cambiaMonete(n); },
      indietro: function () { schermataCitta(); } });
    mostra(s); s._monta();
  }
  // ---- il giardino fuori casa (js/giardino.js): piante, orto, decorazioni e cesto nel profilo e su questo telefono ----
  // ---- i disegni della casa nuova, del casinò e della città a piedi: nella versione online stanno in un file a parte (extra.js),
  //      scaricato solo da chi li usa (così l'app si apre più in fretta per tutti); nella cartella di lavoro ci sono già ----
  var attesaExtra = null;
  // 🏙️ la città (con casa, casinò, circolo e scavi) per ora è spenta per tutti (29 ott 2026, il proprietario: «rimuoviamo la città
  // visibile per adesso, non farla scaricare a nessuno»): niente tasto in home, niente disegni scaricati. true = torna com'era
  // (costruisci-versione-online.sh guarda questa riga: con false la versione online non contiene i file della città)
  var CITTA_VISIBILE = false;
  function serveExtra() { return CITTA_VISIBILE && !window.SGGiardino && !!window.SG_EXTRA && (GIARDINO_PRONTO || CITTA_A_PIEDI || eProprietario()); }
  function caricaExtra(poi, attesa) {
    if (window.SGGiardino || !window.SG_EXTRA) { if (poi) poi(); return; }
    if (attesa) mostra(el("div", { class: "schermata carica-extra" }, [ el("div", { class: "ce-ico", text: attesa }), el("p", { text: "Un attimo…" }) ]));
    if (attesaExtra) { if (poi) attesaExtra.push(poi); return; }
    attesaExtra = poi ? [poi] : [];
    var sc = document.createElement("script"); sc.src = window.SG_EXTRA; sc.async = true;
    sc.onload = sc.onerror = function () { var l = attesaExtra; attesaExtra = null; if (!window.SGGiardino) window.SG_EXTRA = null; l.forEach(function (f) { try { f(); } catch (e) {} }); };   // (se non arriva si usano la casa e la città di prima)
    document.head.appendChild(sc);
  }
  var GIARDINO_PRONTO = true;   // la casa nuova (come The Sims): dal 13 ott 2026 per tutti (false = la vede solo il proprietario, gli altri hanno la casa di prima)
  function giardinoPronto() { return !!window.SGGiardino && (GIARDINO_PRONTO || eProprietario()); }
  var tGiardinoNube = null;
  function chiaveGiardino() { var N = window.SGNube, u = N && N.utente && N.utente(); return u ? "sg-giardino|" + u.uid : null; }
  function datiGiardino() {
    var N = window.SGNube, k = chiaveGiardino(); if (!k) return null;
    var nube = N.giardino && N.giardino(), qui = null;
    try { qui = JSON.parse(localStorage.getItem(k) || "null"); } catch (e) {}
    var d = nube && (!qui || (nube.agg || 0) >= (qui.agg || 0)) ? JSON.parse(JSON.stringify(nube)) : qui;   // la più recente
    return d && d.v ? d : null;
  }
  function salvaGiardino(d) {
    var k = chiaveGiardino(); if (!k || !d) return;
    d.agg = Date.now();
    try { localStorage.setItem(k, JSON.stringify(d)); } catch (e) {}
    clearTimeout(tGiardinoNube); tGiardinoNube = setTimeout(function () { if (window.SGNube && SGNube.salvaGiardino) SGNube.salvaGiardino(JSON.parse(JSON.stringify(d))); }, 1200);
  }
  function schermataGiardino(daCasa, apri) {   // dalla città si arriva qui, davanti a casa: la porta porta dentro
    if (serveExtra()) return caricaExtra(function () { schermataGiardino(daCasa, apri); }, "🏡");
    if (!giardinoPronto()) return schermataCasa();
    if (serveProfilo()) return;
    var io = profiloAttivo(), m = soldiCasa();
    var s = SGGiardino.crea({ omino: io && io.omino, nome: io && io.nome, dati: datiGiardino(), daCasa: !!daCasa, apri: apri || null, salva: salvaGiardino, audio: audioCtx,
      monete: m.monete, spendi: m.spendi, guadagna: m.guadagna,
      entraInCasa: function () { schermataCasa(); }, indietro: function () { schermataCitta(); } });
    mostra(s); s._monta();
  }
  function serveProfilo() {   // casa e negozio vogliono il profilo (le monete e i mobili sono tuoi)
    var N = window.SGNube; if (N && N.profilo && N.profilo()) return false;
    schermataAccesso(schermataCitta); return true;
  }
  function schermataCasa(stanza) {
    if (!window.SGCasa) return schermataCitta();
    if (serveProfilo()) return;
    var io = profiloAttivo(), m = soldiCasa();
    var s = SGCasa.crea({ avatar: io && io.omino, nome: io && io.nome, dati: datiCasa(), audio: audioCtx, stanza: stanza, monete: m.monete, spendi: m.spendi, guadagna: m.guadagna, salva: salvaCasa,
      vestiti: function () { schermataOmino(function () { schermataCasa("camera"); }); },   // dall'armadio aperto: si cambia il look e si torna in camera
      pesca: { dati: function () { return datiPesca() || (window.SGPesca ? { v: 1, album: {}, cesto: [], esche: {}, extra: 0, tot: 0 } : null); }, salva: salvaPesca },   // gli acquari prendono i pesci dal cesto della pesca
      negozio: function (st) { schermataNegozio(st); },   // dal cassetto dell'Arreda
      indietro: function () { if (giardinoPronto()) schermataGiardino(true); else schermataCitta(); } });   // uscendo di casa si va in giardino
    mostra(s); s._monta();
  }
  function schermataNegozio(daStanza) {   // daStanza: si arriva dalla casa (e indietro si torna lì), altrimenti dalla città
    if (!window.SGCasa) return schermataCitta();
    if (serveProfilo()) return;
    var m = soldiCasa(), cm = commessaSalvata();
    var s = SGCasa.negozio({ dati: datiCasa(), salva: salvaCasa, monete: m.monete, spendi: m.spendi, audio: audioCtx, reparto: daStanza || null,
      indietro: function () { if (daStanza) schermataCasa(daStanza); else schermataCitta(); },
      aCasa: daStanza ? null : function () { schermataCasa(); },
      commessa: cm, modificaCommessa: eProprietario() ? function (cfg) { modificaCommessa(cfg, daStanza); } : null });
    mostra(s); s._monta();
    // la commessa vera la prende dalla scheda del proprietario (la prossima volta si vede subito)
    if (window.SGNube && SGNube.commessa) SGNube.commessa(PROPRIETARIO).then(function (c) {
      if (!c || JSON.stringify(c) === JSON.stringify(cm)) return;
      try { localStorage.setItem("sg-commessa", JSON.stringify(c)); } catch (e) {}
      if (document.body.contains(s) && s._commessa) s._commessa(c);
    }).catch(function () {});
  }
  // la commessa del negozio: la disegna il proprietario con l'editor degli avatar, e la vedono tutti uguale
  var PROPRIETARIO = "IL PAPPONE";
  function eProprietario() { var io = profiloAttivo(); return String((io && io.nome) || "").trim().toUpperCase() === PROPRIETARIO; }
  // 🧍 GLI AVATAR NUOVI «Mii rifinito» (29 ott 2026): lo stesso avatar di ognuno, disegnato senza contorni scuri e con occhi più veri
  // (lo stile "rifinito" di SGOmino). Dal 29 ott 2026 pomeriggio lo vedono TUTTI (il proprietario li ha guardati: «vanno bene»);
  // con "proprietario" lo vedrebbe solo IL PAPPONE, che dal suo profilo lo spegne e lo riaccende («🧍 Avatar nuovi», sg-avatar-stile).
  // AVATAR_NUOVO: "nessuno" = spento per tutti · "proprietario" = solo lui · "tutti" = per tutti.
  var AVATAR_NUOVO = "tutti";
  function avatarNuoviSpenti() { try { return localStorage.getItem("sg-avatar-stile") === "classico"; } catch (e) { return false; } }
  function stileAvatar() {
    if (!window.SGOmino || !SGOmino.stile) return;
    SGOmino.stile(AVATAR_NUOVO === "tutti" || (AVATAR_NUOVO === "proprietario" && eProprietario() && !avatarNuoviSpenti()) ? "rifinito" : "classico");
  }
  function commessaSalvata() { try { return JSON.parse(localStorage.getItem("sg-commessa") || "null"); } catch (e) { return null; } }
  function modificaCommessa(cfg, daStanza) {
    var bozza = { nome: "Commessa", omino: cfg, omini: null }, prima = JSON.stringify(cfg);
    schermataOmino(function () {
      if (bozza.omino && JSON.stringify(bozza.omino) !== prima) {
        try { localStorage.setItem("sg-commessa", JSON.stringify(bozza.omino)); } catch (e) {}
        if (window.SGNube && SGNube.salvaCommessa) SGNube.salvaCommessa(bozza.omino);
      }
      schermataNegozio(daStanza);
    }, bozza);
  }

  // ---- 🤖 i BOT: un gruppo fisso di personaggi, uguali in tutti i giochi (così si riconoscono: "Matt vince sempre").
  //      Nei tasti, nelle regole e nei menu si dice solo "Bot"; in partita ognuno ha il suo nome e il suo avatar.
  //      Il proprietario (IL PAPPONE) li cambia con "🤖 I Bot" nel suo profilo: si salvano nella sua scheda pubblica
  //      (come la commessa) e tutti li caricano da lì; senza internet valgono gli ultimi visti, o quelli di partenza.
  //      Per i giochi: SG.bot.prendi(n, { livello, escludi, caso }), SG.bot.tutti(), SG.bot.daId(id) ----
  var BOT_LIVELLI = ["facile", "medio", "difficile"], BOT_MAX_NOME = 12, BOT_MAX_FRASE = 70;
  var BOT_LIV = { facile: "🟢 Facile", medio: "🟡 Medio", difficile: "🔴 Difficile" };
  var BOT_PARTENZA = [
    { id: "matt", nome: "Matt", livello: "difficile", frase: "Il campione: vince sempre, e lo sa.",
      omino: { forma: "uomo", corpo: "snello", pelle: 1, viso: "squadrato", occhi: "furbi", iride: 2, sopracc: "decise", naso: "dritto", bocca: "ghigno",
        capelli: "ciuffo", colCap: 4, barba: "accenno", capo: "giacca", maglia: 7, sotto: "pantaloni", pantaloni: 1, modScarpe: "eleganti", scarpe: 0,
        occhiali: "sole", collo: "catena", mano: "trofeo", cappello: "nessuno" } },
    { id: "angela", nome: "Angela", livello: "difficile", frase: "La professoressa: pensa a ogni mossa, e non sbaglia.",
      omino: { forma: "donna", corpo: "snello", pelle: 0, viso: "ovale", occhi: "mandorla", iride: 3, sopracc: "arcuate", naso: "piccolo", bocca: "sorrisetto",
        capelli: "chignon", colCap: 0, capo: "camicetta", maglia: 4, sotto: "gonnatubino", pantaloni: 1, modScarpe: "tacchi", scarpe: 0,
        occhiali: "felina", orecchini: "perla", collo: "perle", eyeliner: "sottile", rossetto: "pieno", colRossetto: 0, mano: "libro", colMano: 4, cappello: "nessuno" } },
    { id: "rosa", nome: "Rosa", livello: "facile", frase: "Allegra e chiacchierona: gioca d'istinto.",
      omino: { forma: "donna", corpo: "medio", pelle: 2, viso: "tondo", occhi: "felici", iride: 1, sopracc: "morbide", naso: "insu", bocca: "sorrisone", guance: "lentiggini",
        capelli: "riccilunghi", colCap: 3, capo: "vestito", maglia: 5, stampa: "pois", sotto: "gonna", pantaloni: 5, modScarpe: "ballerine", scarpe: 2,
        cappello: "fiori", orecchini: "cuori", blush: "leggero", mano: "palloncino", colMano: 0, occhiali: "nessuno" } },
    { id: "peppe", nome: "Peppe", livello: "medio", frase: "Il furbo del bar: bluffa, ride e ti frega.",
      omino: { forma: "uomo", corpo: "robusto", pelle: 3, viso: "paffuto", occhi: "occhiolino", iride: 0, sopracc: "folte", naso: "patata", bocca: "sorrisetto",
        capelli: "stempiato", colCap: 6, barba: "baffoni", capo: "gilet", maglia: 3, sotto: "pantaloni", pantaloni: 2, modScarpe: "eleganti", scarpe: 5,
        cappello: "coppola", colAcc: 7, mano: "tazza", colMano: 8, occhiali: "nessuno" } },
    { id: "gina", nome: "Gina", livello: "medio", frase: "La cuoca: ti serve la sconfitta su un piatto.",
      omino: { forma: "donna", corpo: "robusto", pelle: 5, viso: "paffuto", occhi: "dolci", iride: 1, sopracc: "morbide", naso: "tondo", bocca: "sorrisone",
        capelli: "ricciraccolti", colCap: 0, capo: "grembiule", maglia: 8, sotto: "gonnalunga", pantaloni: 0, modScarpe: "sneakers", scarpe: 1,
        cappello: "chef", orecchini: "cerchioni", rossetto: "tinta", colRossetto: 1, mano: "pizza", occhiali: "nessuno" } },
    { id: "toto", nome: "Totò", livello: "medio", frase: "Il nonno saggio: lento, ma non perde un colpo.",
      omino: { forma: "uomo", corpo: "medio", pelle: 1, viso: "lungo", occhi: "assonnati", iride: 4, sopracc: "folte", naso: "aquilino", bocca: "sorriso", segno: "rughe",
        capelli: "chierica", colCap: 6, barba: "barbalunga", capo: "cardigan", maglia: 2, sotto: "pantaloni", pantaloni: 0, modScarpe: "pantofole", scarpe: 5,
        cappello: "borsalino", colAcc: 7, occhiali: "tondi", animale: "cane", colAnimale: 4 } },
    { id: "ciro", nome: "Ciro", livello: "facile", frase: "Tifoso scatenato: attacca sempre, anche quando non deve.",
      omino: { forma: "uomo", corpo: "snello", pelle: 4, viso: "lungo", occhi: "grandi", iride: 0, sopracc: "alzate", naso: "largo", bocca: "risata",
        capelli: "riccicorti", colCap: 0, capo: "calcio", maglia: 6, stampa: "numero", sotto: "pantaloncini", pantaloni: 7, modScarpe: "sneakers", scarpe: 1,
        collo: "sciarpa", colCollo: 6, mano: "bandiera", colMano: 6, pittura: "sportivo", cappello: "nessuno", occhiali: "nessuno" } },
    { id: "lella", nome: "Lella", livello: "facile", frase: "La sognatrice: a volte si distrae e regala punti.",
      omino: { forma: "donna", corpo: "snello", pelle: 7, viso: "cuore", occhi: "stelline", iride: 7, sopracc: "sottili", naso: "puntino", bocca: "micio", guance: "rosse",
        capelli: "codini", colCap: 10, capo: "felpa", maglia: 4, stampa: "arcobaleno", sotto: "gonnapieghe", pantaloni: 8, modScarpe: "stivaletti", scarpe: 1,
        occhiali: "cuore", animale: "gatto", colAnimale: 3, cappello: "nessuno" } }
  ];
  var botCast = null, botSalvatoA = 0;
  // i bot salvati (dalla scheda del proprietario o da questo telefono) sopra quelli di partenza: per id, con ogni campo controllato
  function botDaSalvati(lista) {
    lista = Array.isArray(lista) ? lista : [];
    return BOT_PARTENZA.map(function (b) {
      var s = lista.filter(function (x) { return x && x.id === b.id; })[0] || {};
      var nome = typeof s.nome === "string" ? s.nome.replace(/\s+/g, " ").trim().slice(0, BOT_MAX_NOME) : "";
      var frase = typeof s.frase === "string" ? s.frase.replace(/\s+/g, " ").trim().slice(0, BOT_MAX_FRASE) : "";
      return { id: b.id, nome: nome.length >= 2 ? nome : b.nome, livello: BOT_LIVELLI.indexOf(s.livello) >= 0 ? s.livello : b.livello,
        frase: frase || b.frase, omino: s.omino && typeof s.omino === "object" ? s.omino : b.omino };
    });
  }
  function botTutti() {
    if (!botCast) { var m = null; try { m = JSON.parse(localStorage.getItem("sg-bot") || "null"); } catch (e) {} botCast = botDaSalvati(m); }
    return botCast;
  }
  function copiaBot(b) {
    return { id: b.id, nome: b.nome, livello: b.livello, frase: b.frase, bot: true,
      omino: window.SGOmino ? SGOmino.norm(b.omino) : JSON.parse(JSON.stringify(b.omino || null)) };
  }
  // n bot diversi, sempre gli stessi nello stesso ordine: prima quelli del livello chiesto, poi i più vicini (facile ↔ difficile per ultimi).
  // escludi: id o nomi da non usare (es. i nomi delle persone in partita, così nessun bot si chiama come uno di loro).
  // caso: true = a sorte (es. il Bot del torneino), sempre preferendo il livello chiesto. Più di 8: "Bot 9", "Bot 10"…
  function botPrendi(n, o) {
    o = o || {}; n = Math.max(0, Math.floor(+n) || 0);
    var via = [].concat(o.escludi || []).map(function (x) { return x && typeof x === "object" ? (x.id || x.nome) : x; }).filter(function (x) { return x != null; }).map(String);
    var fuori = function (id, nome) { return via.some(function (x) { return x === id || stessoNome(x, nome); }); };
    var lv = BOT_LIVELLI.indexOf(o.livello), lista = botTutti().filter(function (b) { return !fuori(b.id, b.nome); });
    if (o.caso) lista = mischia(lista);
    if (lv >= 0) lista = lista.map(function (b, i) { return { b: b, d: Math.abs(BOT_LIVELLI.indexOf(b.livello) - lv) * 100 + i }; })
      .sort(function (x, y) { return x.d - y.d; }).map(function (x) { return x.b; });
    var out = lista.slice(0, n).map(copiaBot);
    for (var k = BOT_PARTENZA.length + 1; out.length < n && k < 99; k++) {
      var nome = "Bot " + k; if (fuori("bot" + k, nome)) continue;
      out.push({ id: "bot" + k, nome: nome, livello: lv >= 0 ? BOT_LIVELLI[lv] : "medio", frase: "", bot: true, omino: window.SGOmino ? SGOmino.norm(SGOmino.casuale(nome)) : null });
    }
    return out;
  }
  function botDaId(id) { var b = botTutti().filter(function (x) { return x.id === id; })[0]; return b ? copiaBot(b) : null; }
  // salva i bot (solo il proprietario): su questo telefono e nella sua scheda pubblica, dove li leggono tutti
  function salvaBot(lista) {
    botCast = botDaSalvati(lista); botSalvatoA = Date.now(); schedaProp = null;   // (la scheda letta prima ha i bot vecchi)
    try { localStorage.setItem("sg-bot", JSON.stringify(botCast)); } catch (e) {}
    var N = window.SGNube;
    if (N && N.pubblica && eProprietario()) try { Promise.resolve(N.pubblica({ bot: botCast })).catch(function () {}); } catch (e) {}
  }
  // i bot del proprietario dalla sua scheda pubblica (all'avvio e aprendo "🤖 I Bot"). poi(cambiati)
  function caricaBot(poi) {
    var N = window.SGNube, t0 = Date.now();
    function fine(c) { if (poi) try { poi(c); } catch (e) {} }
    if (!(N && N.cercaNome)) return fine(false);
    try {
      schedaDelProprietario().then(function (sch) {
        if (!sch || !Array.isArray(sch.bot) || t0 < botSalvatoA) return fine(false);   // (salvati qui nel frattempo: valgono quelli)
        var nuovi = botDaSalvati(sch.bot);
        if (JSON.stringify(nuovi) === JSON.stringify(botTutti())) return fine(false);
        botCast = nuovi;
        try { localStorage.setItem("sg-bot", JSON.stringify(nuovi)); } catch (e) {}
        fine(true);
      }).catch(function () { fine(false); });
    } catch (e) { fine(false); }
  }
  // "🤖 I Bot" (solo il proprietario, dal suo profilo): gli 8 bot in una griglia, un tocco apre la scheda di uno
  function schermataBot(indietro) {
    var s = schermata({ icona: "🤖", titolo: "I Bot", sotto: "Uguali per tutti, in tutti i giochi", indietro: indietro });
    s.classList.add("bot-cast");
    var griglia = el("div", { class: "bc-griglia" });
    function disegna() {
      svuota(griglia);
      botTutti().forEach(function (b) {
        griglia.appendChild(el("button", { class: "bc-bot liv-" + b.livello, type: "button", onclick: function () { schermataUnBot(b.id, function () { schermataBot(indietro); }); } }, [
          el("span", { class: "bc-av", "aria-hidden": "true", html: window.SGOmino ? SGOmino.svg(b.omino, { busto: true }) : "🤖" }),
          el("b", { text: b.nome }), el("small", { text: BOT_LIV[b.livello] }) ]));
      });
    }
    s._contenuto.appendChild(griglia);
    s._contenuto.appendChild(el("p", { class: "modulo-nota bc-nota", text: "Tocca un bot per cambiargli avatar, nome, frase e livello. Li vedono tutti così, in tutti i giochi. Nei tasti resta scritto solo «Bot»." }));
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", type: "button", text: "↺ Tutti come all'inizio", onclick: function () {
      chiediConferma("Rimettere tutti i bot come all'inizio?", "Nomi, avatar, frasi e livelli tornano quelli di partenza, per tutti.", "↺ Rimetti", function () { salvaBot([]); disegna(); });
    } }));
    mostra(s); disegna();
    caricaBot(function (c) { if (c && s.isConnected) disegna(); });   // (cambiati da un altro telefono del proprietario)
  }
  // la scheda di un bot: avatar (col camerino), nome, frase e livello. b = la bozza (resta mentre si cambia l'avatar)
  function schermataUnBot(id, indietro, b) {
    var orig = botDaId(id); if (!orig) return indietro();
    b = b || { nome: orig.nome, frase: orig.frase, livello: orig.livello, omino: orig.omino };
    var parti = BOT_PARTENZA.filter(function (x) { return x.id === id; })[0];
    var cambiato = function () { return b.nome !== orig.nome || b.frase !== orig.frase || b.livello !== orig.livello || JSON.stringify(SGOmino.norm(b.omino)) !== JSON.stringify(orig.omino); };
    var s = schermata({ icona: "🤖", titolo: orig.nome, sotto: "Come lo vedono tutti", indietro: function () {
      leggi();
      if (cambiato()) chiediConferma("Uscire senza salvare?", "Le modifiche a " + orig.nome + " si perdono.", "Esci", indietro); else indietro();
    } });
    s.classList.add("bot-scheda");
    var palco = el("div", { class: "bc-palco", "aria-hidden": "true", html: SGOmino.svg(b.omino) });
    var tAv = el("button", { class: "btn btn-fantasma bc-cambia", type: "button", text: "✏️ Cambia avatar", onclick: function () {
      leggi();
      var bozza = { nome: b.nome, omino: b.omino, omini: null };
      schermataOmino(function () { b.omino = bozza.omino || b.omino; schermataUnBot(id, indietro, b); }, bozza);
    } });
    var nome = el("input", { class: "link-campo bc-campo", type: "text", maxlength: String(BOT_MAX_NOME), placeholder: "Nome del bot", autocomplete: "off", autocapitalize: "words" });
    var frase = el("input", { class: "link-campo bc-campo", type: "text", maxlength: String(BOT_MAX_FRASE), placeholder: "Il suo carattere in una frase", autocomplete: "off" });
    nome.value = b.nome; frase.value = b.frase;
    var livelli = el("div", { class: "bc-livelli", role: "group", "aria-label": "Livello preferito" });
    function disegnaLivelli() {
      svuota(livelli);
      BOT_LIVELLI.forEach(function (lv) {
        livelli.appendChild(el("button", { class: "bc-liv liv-" + lv + (b.livello === lv ? " on" : ""), type: "button", text: BOT_LIV[lv], onclick: function () { b.livello = lv; aggLivelli(); } }));
      });
    }
    function aggLivelli() { [].forEach.call(livelli.children, function (x, i) { x.classList.toggle("on", BOT_LIVELLI[i] === b.livello); }); }   // (solo la classe: niente lampeggio)
    disegnaLivelli();
    var avviso = el("div", { class: "link-avviso bc-avviso", "aria-live": "polite" });
    function leggi() { b.nome = nome.value.replace(/\s+/g, " ").trim().slice(0, BOT_MAX_NOME); b.frase = frase.value.replace(/\s+/g, " ").trim().slice(0, BOT_MAX_FRASE); }
    s._contenuto.appendChild(el("div", { class: "bc-testa" }, [ palco, el("div", { class: "bc-lato" }, [ tAv,
      el("button", { class: "btn btn-fantasma bc-cambia", type: "button", text: "↺ Come all'inizio", onclick: function () {
        if (!parti) return;
        b.nome = parti.nome; b.frase = parti.frase; b.livello = parti.livello; b.omino = parti.omino;
        nome.value = b.nome; frase.value = b.frase; aggLivelli(); palco.innerHTML = SGOmino.svg(b.omino); avviso.textContent = "";
      } }) ]) ]));
    s._contenuto.appendChild(el("label", { class: "bc-etich", text: "Nome" })); s._contenuto.appendChild(nome);
    s._contenuto.appendChild(el("label", { class: "bc-etich", text: "Carattere" })); s._contenuto.appendChild(frase);
    s._contenuto.appendChild(el("label", { class: "bc-etich", text: "Livello preferito" })); s._contenuto.appendChild(livelli);
    s._contenuto.appendChild(avviso);
    s._piede.appendChild(el("button", { class: "btn btn-primario", type: "button", text: "💾 Salva", onclick: function () {
      leggi();
      if (b.nome.length < 2) { avviso.textContent = "Il nome deve avere almeno 2 lettere."; nome.focus(); return; }
      if (/^bot\b/i.test(b.nome)) { avviso.textContent = "«Bot» resta per i tasti: dagli un nome vero."; nome.focus(); return; }
      if (botTutti().some(function (x) { return x.id !== id && stessoNome(x.nome, b.nome); })) { avviso.textContent = "C'è già un bot che si chiama così."; nome.focus(); return; }
      salvaBot(botTutti().map(function (x) { return x.id === id ? { id: id, nome: b.nome, frase: b.frase || (parti && parti.frase) || "", livello: b.livello, omino: SGOmino.norm(b.omino) } : x; }));
      pillola("bot", "🤖 " + b.nome + " salvato: lo vedono tutti così", "verde", 2500);
      indietro();
    } }));
    mostra(s);
  }

  // ---- la scheda pubblica del proprietario, letta una volta per tutti quelli che la chiedono insieme (i bot e l'ordine dei
  //      giochi all'avvio: una lettura sola). Per 5 s si riusa la stessa risposta ----
  var schedaProp = null;
  function schedaDelProprietario() {
    var N = window.SGNube;
    if (!(N && N.cercaNome)) return Promise.resolve(null);
    if (schedaProp && Date.now() - schedaProp.t < 5000) return schedaProp.p;
    var p;
    try { p = Promise.resolve(N.cercaNome(PROPRIETARIO)); } catch (e) { p = Promise.reject(e); }
    p.catch(function () {});   // (chi la usa ha il suo catch: questa non resta "senza risposta")
    schedaProp = { t: Date.now(), p: p };
    return p;
  }

  // ---- 🧩 L'ORDINE DEI GIOCHI: lo decide il proprietario (IL PAPPONE) ed è uguale per tutti, in home (anche nelle categorie),
  //      nella Sala («Quale gioco?»), nel torneo e negli edifici. Tenendo premuta una tessera della home (~0,6 s) si apre la
  //      schermata per riordinarli. Si salva nella sua scheda pubblica (campo ordineGiochi: la lista degli id, [] = di partenza),
  //      come i bot e la commessa; ogni telefono ne tiene una copia (sg-ordine-giochi) e la usa subito all'avvio, così la home
  //      non salta. I giochi che non sono nella lista (quelli nuovi) vanno in fondo, nell'ordine di sempre ----
  var ORDINE_K = "sg-ordine-giochi", ordineAttivo = null, ordineSalvatoA = 0;
  function pulisciOrdine(l) {
    var visti = {};
    return (Array.isArray(l) ? l : []).filter(function (x) {
      if (typeof x !== "string" || !x || x.length > 40 || visti[x]) return false;
      visti[x] = 1; return true;
    }).slice(0, 150);
  }
  function ordineSalvato() { try { var l = pulisciOrdine(JSON.parse(localStorage.getItem(ORDINE_K) || "null")); return l.length ? l : null; } catch (e) { return null; } }
  // rimette in fila la lista dei giochi (sul posto: tutto il core usa la stessa)
  function ordinaGiochi() {
    var pos = {}, n = ordineAttivo ? ordineAttivo.length : 0;
    (ordineAttivo || []).forEach(function (id, i) { pos[id] = i; });
    var l = giochiReg.map(function (g, i) { return { g: g, k: Object.prototype.hasOwnProperty.call(pos, g.id) ? pos[g.id] : n + i, i: i }; });
    l.sort(function (a, b) { return a.k - b.k || a.i - b.i; });
    giochi.length = 0;
    l.forEach(function (x) { giochi.push(x.g); });
  }
  function idGiochi(lista) { return lista.map(function (g) { return g.id; }); }
  // un ordine nuovo (salvato qui o arrivato dalla scheda): [] o null = di partenza
  function usaOrdine(l) {
    l = pulisciOrdine(l);
    if (l.join("|") === idGiochi(giochiReg).join("|")) l = [];   // (uguale a quello di partenza: è quello di partenza)
    ordineAttivo = l.length ? l : null;
    try { if (l.length) localStorage.setItem(ORDINE_K, JSON.stringify(l)); else localStorage.removeItem(ORDINE_K); } catch (e) {}
    ordinaGiochi();
    return l;
  }
  // la home aperta si rimette in fila spostando le tessere che ci sono già (niente da ridisegnare: le foto restano)
  function riordinaHome() {
    [].forEach.call(document.querySelectorAll(".home .griglia-giochi"), function (gr) {
      var per = {}, ora = [];
      [].forEach.call(gr.children, function (c) { var id = c.getAttribute("data-gioco"); if (id) { per[id] = c; ora.push(id); } });
      var giusto = giochi.filter(function (g) { return per[g.id]; }).map(function (g) { return g.id; });
      if (giusto.join("|") === ora.join("|")) return;
      var prima = gr.querySelector(".tessera.presto");
      giusto.forEach(function (id) { gr.insertBefore(per[id], prima); });
    });
  }
  // salva (solo il proprietario): su questo telefono e nella sua scheda pubblica, dove lo leggono tutti
  function salvaOrdine(ids) {
    var l = usaOrdine(ids);
    ordineSalvatoA = Date.now(); schedaProp = null;
    var N = window.SGNube;
    if (N && N.pubblica && eProprietario()) try { Promise.resolve(N.pubblica({ ordineGiochi: l })).catch(function () {}); } catch (e) {}
  }
  // l'ordine del proprietario dalla sua scheda pubblica (all'avvio e aprendo «🧩 Ordine dei giochi»). poi(cambiato)
  function caricaOrdine(poi) {
    var t0 = Date.now();
    function fine(c) { if (poi) try { poi(c); } catch (e) {} }
    try {
      schedaDelProprietario().then(function (sch) {
        // (nessuna scheda o mai salvato, o salvato qui nel frattempo: vale quello che c'è. [] salvato = ordine di partenza)
        if (!sch || !Array.isArray(sch.ordineGiochi) || t0 < ordineSalvatoA) return fine(false);
        var l = pulisciOrdine(sch.ordineGiochi), prima = idGiochi(giochi).join("|");
        if (l.join("|") === (ordineAttivo || []).join("|")) return fine(false);
        usaOrdine(l);
        if (idGiochi(giochi).join("|") === prima) return fine(false);
        riordinaHome();
        fine(true);
      }).catch(function () { fine(false); });
    } catch (e) { fine(false); }
  }
  // ---- il tocco lungo (solo il proprietario, sulle tessere della home): ~0,6 s col dito fermo = fn(). Il dito che si muove
  //      (sta scorrendo) lo annulla; all'appoggio non vibra (vibra solo quando la schermata si apre: è una scelta), e il
  //      "click" che arriva quando si alza il dito non apre il gioco ----
  var LUNGO = { t: null, x: 0, y: 0, id: null, ingoia: 0, pronto: false };
  function annullaLungo() { if (LUNGO.t) { clearTimeout(LUNGO.t); LUNGO.t = null; } }
  function tienPremuto(nodo, fn) {
    if (!LUNGO.pronto) {
      LUNGO.pronto = true;
      // (window, in cattura: arriva prima di tutti, anche della vibrazione dei tasti)
      window.addEventListener("click", function (e) { if (LUNGO.ingoia && Date.now() < LUNGO.ingoia) { LUNGO.ingoia = 0; e.stopPropagation(); e.preventDefault(); } }, true);
      var alzato = function () { annullaLungo(); if (LUNGO.ingoia) LUNGO.ingoia = Date.now() + 450; };
      window.addEventListener("pointerup", alzato, true);
      window.addEventListener("pointercancel", alzato, true);
      window.addEventListener("scroll", annullaLungo, true);   // (si scorre la pagina o un riquadro: niente tocco lungo)
    }
    function parti() {
      LUNGO.t = null;
      if (!nodo.isConnected) return;
      LUNGO.ingoia = Date.now() + 10000;
      fn();   // (la vibrazione breve la dà la schermata che si apre)
    }
    nodo.addEventListener("pointerdown", function (e) {
      if (e.button > 0 || e.isPrimary === false) return;
      annullaLungo();
      LUNGO.x = e.clientX; LUNGO.y = e.clientY; LUNGO.id = e.pointerId;
      LUNGO.t = setTimeout(parti, 600);
    });
    nodo.addEventListener("pointermove", function (e) {
      if (LUNGO.t && e.pointerId === LUNGO.id && Math.abs(e.clientX - LUNGO.x) + Math.abs(e.clientY - LUNGO.y) > 10) annullaLungo();
    });
    nodo.addEventListener("pointerleave", annullaLungo);
    // (e anche se il "click" arriva proprio alla tessera, che intanto è uscita dalla pagina: il gioco non si apre)
    nodo.addEventListener("click", function (e) { if (LUNGO.ingoia && Date.now() < LUNGO.ingoia) { LUNGO.ingoia = 0; e.stopImmediatePropagation(); e.preventDefault(); } }, true);
    // (il telefono ha già capito che è un tocco lungo, es. Android: si apre subito)
    nodo.addEventListener("contextmenu", function () { if (LUNGO.t) { clearTimeout(LUNGO.t); parti(); } });
  }
  // «🧩 Ordine dei giochi» (solo il proprietario): la lista di tutti i giochi, da riordinare trascinando la maniglia ⠿,
  // con «⬆️ In cima» e ⬆️/⬇️ di uno. Si spostano le righe che ci sono (niente lampeggio); scorre solo la lista
  function schermataOrdineGiochi() {
    if (!eProprietario()) return schermataHome();
    annullaLungo();
    var s = schermata({ icona: "🧩", titolo: "Ordine dei giochi", sotto: "Trascina ⠿ · vale per tutti", indietro: function () { esci(); } });
    s.classList.add("og-sc");
    var lista = el("div", { class: "og-lista", role: "list" }), righe = {}, firma0 = idGiochi(giochi).join("|"), partenza = idGiochi(giochiReg).join("|"), toccato = false;
    function attuale() { return [].map.call(lista.children, function (r) { return r.getAttribute("data-gioco"); }); }
    function riga(g) {
      var ic = el("span", { class: "og-ic", "aria-hidden": "true" }, [ el("span", { text: g.icona || "🎲" }) ]);
      if (!window.SG_FOTO || SG_FOTO[g.id]) {
        var img = el("img", { src: "carte/giochi/" + g.id + ".jpg", alt: "", loading: "lazy" });
        img.onerror = function () { if (img.parentNode) img.parentNode.removeChild(img); };
        ic.appendChild(img);
      }
      var man = el("span", { class: "og-maniglia", "aria-hidden": "true", text: "⠿" });
      var r = el("div", { class: "og-riga", role: "listitem", "data-gioco": g.id });
      r._n = el("b", { class: "og-n" });
      r._cima = el("button", { class: "og-t og-cima", type: "button", text: "⬆️ In cima", onclick: function () { sposta(r, "cima"); } });
      r._sale = el("button", { class: "og-t og-sale", type: "button", text: "⬆️", "aria-label": "Su di uno", onclick: function () { sposta(r, "su"); } });
      r._scende = el("button", { class: "og-t og-scende", type: "button", text: "⬇️", "aria-label": "Giù di uno", onclick: function () { sposta(r, "giu"); } });
      r._nome = g.nome;
      r.appendChild(man); r.appendChild(ic);
      r.appendChild(el("div", { class: "og-centro" }, [
        el("div", { class: "og-nome" }, [ r._n, el("span", { text: g.nome }) ]),
        el("div", { class: "og-tasti" }, [ r._cima, r._sale, r._scende ]) ]));
      man.addEventListener("pointerdown", function (e) { prendi(e, r); });
      righe[g.id] = r;
      return r;
    }
    giochi.forEach(function (g) { lista.appendChild(riga(g)); });
    // numeri e tasti spenti (primo: niente ⬆️; ultimo: niente ⬇️): si cambiano solo le scritte e i "disabled"
    function numeri() {
      var rr = lista.children, n = rr.length;
      for (var i = 0; i < n; i++) {
        var r = rr[i], t = (i + 1) + ".";
        if (r._n.textContent !== t) r._n.textContent = t;
        r._cima.disabled = r._sale.disabled = i === 0;
        r._scende.disabled = i === n - 1;
      }
      var ids = attuale().join("|");
      bSalva.disabled = ids === firma0;
      bPartenza.disabled = ids === partenza;
    }
    function luce(r) { r.classList.remove("og-mosso"); void r.offsetWidth; r.classList.add("og-mosso"); }
    function inVista(r) {   // (solo la lista scorre: la pagina resta ferma)
      var a = r.offsetTop, b = a + r.offsetHeight;
      if (a < lista.scrollTop) lista.scrollTop = a - 4;
      else if (b > lista.scrollTop + lista.clientHeight) lista.scrollTop = b - lista.clientHeight + 4;
    }
    function sposta(r, dove) {
      if (dove === "cima") { if (!r.previousElementSibling) return; lista.insertBefore(r, lista.firstElementChild); }
      else if (dove === "su") { if (!r.previousElementSibling) return; lista.insertBefore(r, r.previousElementSibling); }
      else { var d = r.nextElementSibling; if (!d) return; lista.insertBefore(d, r); }
      toccato = true; numeri(); luce(r);
      if (dove === "cima") pillola("ordine", "⬆️ " + r._nome + " ora è il primo", "verde", 1800);
      else inVista(r);
    }
    // trascinare con la maniglia: la riga segue il dito e scavalca le altre a metà; vicino ai bordi la lista scorre da sola
    var drag = null;
    function prendi(e, r) {
      if (drag || e.button > 0 || e.isPrimary === false) return;
      e.preventDefault();
      var lr = lista.getBoundingClientRect();
      drag = { r: r, id: e.pointerId, y: e.clientY, presa: e.clientY - lr.top + lista.scrollTop - r.offsetTop, raf: 0 };
      r.classList.add("og-preso"); lista.classList.add("og-trascino");
      try { e.target.setPointerCapture(e.pointerId); } catch (x) {}
      window.addEventListener("pointermove", muovi); window.addEventListener("pointerup", lascia); window.addEventListener("pointercancel", lascia);
      drag.raf = requestAnimationFrame(scorri);
    }
    function segui() {
      var d = drag, r = d.r, lr = lista.getBoundingClientRect(), h = r.offsetHeight, p, cambiato = false;
      var voluto = Math.max(0, Math.min(lista.scrollHeight - h, d.y - lr.top + lista.scrollTop - d.presa)), c = voluto + h / 2;
      while ((p = r.previousElementSibling) && c < p.offsetTop + p.offsetHeight / 2) { lista.insertBefore(r, p); cambiato = true; }
      while ((p = r.nextElementSibling) && c > p.offsetTop + p.offsetHeight / 2) { lista.insertBefore(p, r); cambiato = true; }
      r.style.transform = "translateY(" + Math.round(voluto - r.offsetTop) + "px)";
      if (cambiato) { toccato = true; numeri(); }
    }
    function muovi(e) { if (!drag || e.pointerId !== drag.id) return; drag.y = e.clientY; segui(); }
    function scorri() {
      if (!drag) return;
      if (!lista.isConnected) return lascia();
      var lr = lista.getBoundingClientRect(), v = 0, bordo = 48;
      if (drag.y < lr.top + bordo) v = -Math.ceil((lr.top + bordo - drag.y) / 4);
      else if (drag.y > lr.bottom - bordo) v = Math.ceil((drag.y - lr.bottom + bordo) / 4);
      if (v) { var t0 = lista.scrollTop; lista.scrollTop = t0 + Math.max(-14, Math.min(14, v)); if (lista.scrollTop !== t0) segui(); }
      drag.raf = requestAnimationFrame(scorri);
    }
    function lascia(e) {
      if (!drag || (e && e.pointerId != null && e.pointerId !== drag.id)) return;
      var r = drag.r;
      cancelAnimationFrame(drag.raf); drag = null;
      window.removeEventListener("pointermove", muovi); window.removeEventListener("pointerup", lascia); window.removeEventListener("pointercancel", lascia);
      r.classList.remove("og-preso"); r.style.transform = ""; lista.classList.remove("og-trascino");
      numeri();
    }
    // rimette le righe in un ordine (ids), spostando quelle che ci sono
    function metti(ids) {
      ids.forEach(function (id) { if (righe[id]) lista.appendChild(righe[id]); });
      numeri();
    }
    function esci() {
      if (drag) lascia();
      if (attuale().join("|") !== firma0) chiediConferma("Uscire senza salvare?", "L'ordine nuovo dei giochi si perde.", "Esci", schermataHome);
      else schermataHome();
    }
    var bSalva = el("button", { class: "btn btn-primario og-salva", type: "button", text: "💾 Salva per tutti", onclick: function () {
      chiediConferma("Salvare quest'ordine per tutti?", "Tutti vedranno i giochi in quest'ordine: in home, nelle categorie e nella Sala.", "💾 Salva", function () {
        salvaOrdine(attuale());
        pillola("ordine", "🧩 Ordine salvato: ora lo vedono tutti", "verde", 2500);
        schermataHome();
      });
    } });
    var bPartenza = el("button", { class: "btn btn-fantasma og-partenza", type: "button", text: "↩️ Ordine di partenza", onclick: function () {
      chiediConferma("Rimettere l'ordine di partenza?", "I giochi tornano nell'ordine di sempre. Poi tocca «💾 Salva per tutti».", "↩️ Rimetti", function () {
        toccato = true; metti(idGiochi(giochiReg)); lista.scrollTop = 0;
      });
    } });
    s._contenuto.appendChild(lista);
    s._piede.appendChild(bSalva);
    s._piede.appendChild(el("div", { class: "og-piede-riga" }, [ bPartenza,
      el("button", { class: "btn btn-fantasma og-annulla", type: "button", text: "Annulla", onclick: function () { esci(); } }) ]));
    mostra(s); numeri();
    try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) {}
    // (cambiato da un altro telefono del proprietario: se qui non ha ancora toccato niente, la lista si rimette in fila)
    caricaOrdine(function (c) { if (c && !toccato && !drag && lista.isConnected) { firma0 = idGiochi(giochi).join("|"); metti(idGiochi(giochi)); } });
  }
  var scrollCitta = 0;   // fin dove avevi scorso la città: uscendo da un edificio si torna lì (dalla home si riparte dall'alto)
  var CITTA_A_PIEDI = true, ultimoEdificio = null;   // (dal 13 ott 2026 per tutti)
  var fotoCitta = null;   // la città com'era quando hai toccato la bacheca (fa da sfondo sfocato alle novità)   // la città dove si cammina (come la casa): finché è false la vede solo il proprietario; ultimoEdificio: da dove si esce tornando in città
  function cittaAPiedi() { return !!(window.SGGiardino && window.SGCitta && SGCitta.arte) && (CITTA_A_PIEDI || eProprietario()); }
  // ---- 🎯 le sfide del giorno: 3 al giorno (una tra pesca e scavi, due tra i giochi che si fanno anche contro il computer),
  //      uguali per tutti e diverse ogni giorno. Si misurano coi contatori che i giochi tengono già (quelli dei trofei):
  //      la prima volta che le guardi oggi si segna da dove parti, e il progresso è quanto sei salito da lì ----
  var SFIDE_VITA = [
    { id: "pesca3", icona: "🎣", testo: "Pesca 3 pesci al laghetto", fonte: "pesca", meta: 3, monete: 300, xp: 60 },
    { id: "pesca6", icona: "🎣", testo: "Pesca 6 pesci al laghetto", fonte: "pesca", meta: 6, monete: 500, xp: 100 },
    { id: "scavi1", icona: "🏺", testo: "Trova un reperto agli scavi", fonte: "scavi", meta: 1, monete: 300, xp: 60 },
    { id: "scavi2", icona: "🏺", testo: "Trova 2 reperti agli scavi", fonte: "scavi", meta: 2, monete: 500, xp: 100 }
  ];
  var SFIDE_GIOCHI = [
    { id: "bj-mani", icona: "🃏", testo: "Vinci 3 mani a Black Jack", gioco: "blackjack", stat: "maniVinte", meta: 3, monete: 300, xp: 60 },
    { id: "bj-21", icona: "🃏", testo: "Fai un Black Jack", gioco: "blackjack", stat: "blackjackFatti", meta: 1, monete: 400, xp: 80 },
    { id: "scopa-v", icona: "🂡", testo: "Vinci una partita a Scopa", gioco: "scopa", stat: "vinte", meta: 1, monete: 400, xp: 100 },
    { id: "scopa-s", icona: "🧹", testo: "Fai 3 scope a Scopa", gioco: "scopa", stat: "scope", meta: 3, monete: 400, xp: 80 },
    { id: "scopa-7", icona: "7️⃣", testo: "Prendi il Settebello a Scopa", gioco: "scopa", stat: "settebello", meta: 1, monete: 300, xp: 60 },
    { id: "hockey-v", icona: "🏒", testo: "Vinci una partita a Glow Hockey", gioco: "hockey", stat: "vittorie", meta: 1, monete: 400, xp: 100 },
    { id: "hockey-g", icona: "🏒", testo: "Segna 10 gol a Glow Hockey", gioco: "hockey", stat: "golFatti", meta: 10, monete: 300, xp: 60 },
    { id: "calcio-v", icona: "⚽", testo: "Vinci una partita a Calcio Biliardo", gioco: "calciobiliardo", stat: "vittorie", meta: 1, monete: 400, xp: 100 },
    { id: "calcio-g", icona: "⚽", testo: "Segna 5 gol a Calcio Biliardo", gioco: "calciobiliardo", stat: "golFatti", meta: 5, monete: 300, xp: 60 },
    { id: "drop4-v", icona: "🟡", testo: "Vinci una partita a Drop 4", gioco: "drop4", stat: "vinte", meta: 1, monete: 300, xp: 60 },
    { id: "navale-n", icona: "🚢", testo: "Affonda 3 navi a Battaglia Navale", gioco: "navale", stat: "naviAffondate", meta: 3, monete: 300, xp: 60 },
    { id: "navale-v", icona: "🚢", testo: "Vinci a Battaglia Navale", gioco: "navale", stat: "vittorie", meta: 1, monete: 400, xp: 100 },
    { id: "poker-v", icona: "♠️", testo: "Vinci una mano di Texas Hold'em", gioco: "poker", stat: "vittorieTexas", meta: 1, monete: 300, xp: 60 },
    { id: "ruota-p", icona: "🎡", testo: "Gioca alla Ruota della Fortuna", gioco: "ruota", stat: "partite", meta: 1, monete: 250, xp: 50 },
    { id: "pendolo-p", icona: "🎯", testo: "Gioca 2 partite a Palla a Pendolo", gioco: "pendolo", stat: "partite", meta: 2, monete: 250, xp: 50 }
  ];
  var BONUS_SFIDE = { monete: 1000, xp: 200 };   // tutte e 3 fatte: il forziere
  function sfideDiOggi() {   // scelte dal giorno: oggi le stesse per tutti, domani altre
    var g = oggiStr(), h = 2166136261, i; for (i = 0; i < g.length; i++) { h ^= g.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    function rnd() { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; }
    var vita = SFIDE_VITA.filter(function (s) { return s.fonte === "pesca" ? !!window.SGPesca : !!window.SGScavi; }), giochiOk = SFIDE_GIOCHI.filter(function (s) { return !!giocoDa(s.gioco); });
    var l = vita.length ? [vita[Math.floor(rnd() * vita.length)]] : [], usati = {}, prove = 0;
    while (l.length < 3 && prove++ < 200) { var s = giochiOk[Math.floor(rnd() * giochiOk.length)]; if (!s || usati[s.gioco]) continue; usati[s.gioco] = 1; l.push(s); }
    return l;
  }
  function valoreSfida(s) {   // il contatore che sale giocando
    if (s.fonte === "pesca") { var p = datiPesca(); return (p && p.tot) || 0; }
    if (s.fonte === "scavi") { var d = datiScavi(); return (d && d.tot) || 0; }
    var prof = window.SGNube && SGNube.profilo && SGNube.profilo(); return prof ? valoreStat(prof, s.gioco, s.stat) || 0 : 0;
  }
  function statoSfide() {   // { g, base: { id: da dove parti }, presi: { id: true }, bonus }: si segna la prima volta che le guardi oggi
    if (!profiloAttivo()) return null;
    var st = listaProfilo("sfide")[0];
    if (!st || st.g !== oggiStr() || !st.base) {
      st = { g: oggiStr(), base: {}, presi: {}, bonus: false };
      sfideDiOggi().forEach(function (s) { st.base[s.id] = valoreSfida(s); });
      salvaListaProfilo("sfide", [st]);
    }
    return st;
  }
  function progressoSfida(s, st) { return Math.max(0, Math.min(s.meta, valoreSfida(s) - ((st && st.base[s.id]) || 0))); }
  function riassuntoSfide() {   // per l'avviso in città: quante fatte, quante da ritirare
    var st = statoSfide(); if (!st) return null;
    var l = sfideDiOggi(), fatte = 0, ritira = 0;
    l.forEach(function (s) { if (st.presi[s.id]) fatte++; else if (progressoSfida(s, st) >= s.meta) ritira++; });
    if (fatte === l.length && !st.bonus) ritira++;
    return { tot: l.length, fatte: fatte, ritira: ritira };
  }
  function premia(monete, xp) { try { if (monete && window.SGNube && SGNube.cambiaMonete) SGNube.cambiaMonete(monete); if (xp && SGNube.aggiungiXp) SGNube.aggiungiXp(xp); } catch (e) {} }
  // il pannello delle sfide (sopra la città): le 3 sfide con la barra, "Vai" per andarci, "Ritira!" quando è fatta, e il forziere se le fai tutte
  function pannelloSfide(vai, poi) {
    var st = statoSfide(); if (!st) return;
    var velo = el("div", { class: "sf-velo" }), foglio = el("div", { class: "sf-foglio" }), lista = el("div", {}), tempo = el("div", { class: "sf-tempo" });
    function chiudi() { if (velo.parentNode) velo.parentNode.removeChild(velo); if (poi) poi(); }
    velo.addEventListener("click", function (e) { if (e.target === velo) chiudi(); });
    var tFesta = null;
    function festa(msg) { clearTimeout(tFesta); tempo.textContent = msg; tempo.classList.add("festa"); tFesta = setTimeout(function () { tempo.classList.remove("festa"); if (velo.parentNode) disegna(); }, 2600); }   // il premio, scritto in grande per un attimo
    function finoMezzanotte() { var d = new Date(); d.setHours(24, 0, 0, 0); return d - Date.now(); }
    function disegna() {
      svuota(lista); tempo.textContent = "⏳ Nuove sfide tra " + tempoBreve(finoMezzanotte());
      var l = sfideDiOggi(), fatte = 0;
      l.forEach(function (s) {
        var p = progressoSfida(s, st), preso = !!st.presi[s.id], pronta = !preso && p >= s.meta; if (preso) fatte++;
        var tasto = el("button", { class: "sf-tasto" + (pronta ? " ritira" : preso ? " fatto" : ""), text: pronta ? "Ritira!" : preso ? "✔" : "Vai" });
        tasto.onclick = function () {
          if (preso) return;
          if (pronta) { st.presi[s.id] = true; salvaListaProfilo("sfide", [st]); premia(s.monete, s.xp); disegna(); festa("🎉 +" + cifre(s.monete) + " monete e +" + s.xp + " XP"); return; }
          chiudi(); vai(s);
        };
        lista.appendChild(el("div", { class: "sf-carta" + (preso ? " fatta" : "") }, [
          el("div", { class: "sf-ico", text: s.icona }),
          el("div", { class: "sf-corpo" }, [
            el("div", { class: "sf-testo", text: s.testo }),
            el("div", { class: "sf-barra" }, [ el("i", { style: "width:" + Math.round(p * 100 / s.meta) + "%" }) ]),
            el("div", { class: "sf-premio", text: p + "/" + s.meta + "  ·  🪙 " + cifre(s.monete) + "  ·  ⭐ " + s.xp + " XP" })
          ]),
          tasto
        ]));
      });
      var tutte = fatte === l.length, bTasto = el("button", { class: "sf-tasto" + (tutte && !st.bonus ? " ritira" : st.bonus ? " fatto" : ""), text: st.bonus ? "✔" : tutte ? "Apri!" : fatte + "/" + l.length });
      bTasto.onclick = function () { if (!tutte || st.bonus) return; st.bonus = true; salvaListaProfilo("sfide", [st]); premia(BONUS_SFIDE.monete, BONUS_SFIDE.xp); disegna(); festa("🎁 Forziere: +" + cifre(BONUS_SFIDE.monete) + " monete e +" + BONUS_SFIDE.xp + " XP!"); };
      lista.appendChild(el("div", { class: "sf-bonus" + (st.bonus ? " fatta" : "") }, [
        el("div", { class: "sf-ico", text: "🎁" }),
        el("div", { class: "sf-corpo" }, [ el("div", { class: "sf-testo", text: "Fai tutte e 3 le sfide" }), el("div", { class: "sf-premio", text: "Il forziere: 🪙 " + cifre(BONUS_SFIDE.monete) + "  ·  ⭐ " + BONUS_SFIDE.xp + " XP" }) ]),
        bTasto
      ]));
    }
    var x = el("button", { class: "sf-x", text: "✕", "aria-label": "Chiudi", onclick: chiudi });
    foglio.appendChild(el("div", { class: "sf-testa" }, [ el("b", { text: "🎯 Sfide del giorno" }), x ]));
    foglio.appendChild(tempo); foglio.appendChild(lista); velo.appendChild(foglio);
    disegna();
    return velo;
  }
  function schermataCitta() {
    if (serveExtra()) return caricaExtra(schermataCitta, "🏙️");
    controllaGiorno();   // (se l'app è rimasta aperta da ieri)
    var io = profiloAttivo(), N = window.SGNube, fase = SGCitta.fase(new Date()), via = false;
    var cloud = !!(N && N.profilo && N.profilo()), prog = window.SGLivelli && cloud && N.progressione ? N.progressione() : null;
    var vista = cittaAPiedi() ? SGGiardino.crea({ luogo: "citta", incassata: true, omino: io && io.omino, nome: io && io.nome, audio: audioCtx, da: ultimoEdificio,   // la città a piedi (per ora solo per il proprietario)
      entra: function (k, punto, tela) {
        if (via) return; via = true; ultimoEdificio = k; suonoEdificio(k);
        if (k === "piazza") { var foto = null; try { foto = document.createElement("canvas"); foto.width = tela.width; foto.height = tela.height; foto.getContext("2d").drawImage(tela, 0, 0); } catch (e) { foto = null; } fotoCitta = { tela: foto, punto: punto, t: Date.now() }; return entraEdificio(k); }   // (una copia al volo della città: niente immagine da comprimere)   // la bacheca delle novità: la si legge da vicino, con la città dietro
        try { vista.style.transition = "opacity .2s ease-in"; vista.style.opacity = "0"; } catch (e) {}   // (la città sfuma, poi si entra: niente cambio secco)
        setTimeout(function () { entraEdificio(k); }, 200); } }) : null;
    var mappa = vista || el("div", { class: "citta-mappa", html: SGCitta.svg({ fase: fase, io: io && io.omino, sopra: 80 }) });
    // in alto: tu (tocca per il profilo) e le monete
    var testoIo = el("span", { class: "citta-io-testo" }, [ el("b", { text: io ? io.nome : "Entra" }) ]);
    if (prog) {
      var serve = SGLivelli.xpPerSalire(prog.level), pct = Math.max(3, Math.min(100, Math.floor(prog.xp * 100 / serve)));
      testoIo.appendChild(el("small", { text: (prog.prestige ? "★" + prog.prestige + " · " : "") + "Livello " + prog.level + fuocoGiorni() }));
      testoIo.appendChild(el("i", { class: "citta-xp" }, [ el("i", { style: "width:" + pct + "%" }) ]));
    } else testoIo.appendChild(el("small", { text: io ? "Il tuo profilo" : "Crea il tuo profilo" }));
    var faccia = el("span", { class: "citta-faccia" });
    if (io && io.omino && window.SGOmino) faccia.innerHTML = SGOmino.svg(io.omino, { busto: true }); else faccia.textContent = (io && io.emoji) || "👤";
    var monete = el("b", { text: prog ? cifre(prog.coins) : "—" });
    // in basso: le cose in arrivo (spente) e la ruota del giorno
    var avviso = el("div", { class: "citta-presto" });
    function presto(testo) { avviso.textContent = testo; avviso.classList.remove("su"); void avviso.offsetWidth; avviso.classList.add("su"); }
    function tastoPresto(icona, nome, frase) {
      return el("button", { class: "citta-tasto spento", onclick: function () { presto(frase); } }, [ el("span", { class: "ct-ico", text: icona }), el("span", { text: nome }), el("small", { text: "🔒 presto" }) ]);
    }
    var regalo = el("button", { class: "citta-tasto" });
    function aggRegalo() {
      var pronto = cloud && N.puoRitirareBonus && N.puoRitirareBonus();
      regalo.className = "citta-tasto regalo" + (pronto ? " pronto" : " spento");
      svuota(regalo);
      regalo.appendChild(el("span", { class: "ct-ico", text: "🎡" }));
      regalo.appendChild(el("span", { text: "Ruota" }));
      regalo.appendChild(el("small", { text: !cloud ? "col profilo" : (pronto ? "gira!" : "tra " + tempoBreve(N.prossimoBonusMs())) }));
    }
    // dopo il giro: monete, livello e barra degli XP si aggiornano lì dove sono (niente ridisegno della città)
    function aggTesta() {
      var p = N.progressione(); monete.textContent = cifre(p.coins);
      var sm = testoIo.querySelector("small"), bar = testoIo.querySelector(".citta-xp > i");
      if (sm) sm.textContent = (p.prestige ? "★" + p.prestige + " · " : "") + "Livello " + p.level + fuocoGiorni();
      if (bar) bar.style.width = Math.max(3, Math.min(100, Math.floor(p.xp * 100 / SGLivelli.xpPerSalire(p.level)))) + "%";
      aggRegalo();
    }
    regalo.onclick = function () {
      if (!cloud) return presto("Crea il tuo profilo per girare la ruota del giorno");
      ruotaDelGiorno(aggTesta);
    };
    aggRegalo();
    // ---- a sinistra, come nei giochi che vanno forte: le cose da fare oggi, con l'avviso che salta e il conto alla rovescia ----
    var colonna = el("div", { class: "citta-avvisi" }), ultimaColonna = "";
    function finoMezzanotte() { var d = new Date(); d.setHours(24, 0, 0, 0); return d - Date.now(); }
    function portaA(k, altrimenti) { if (vista && vista._vai && vista._vai(k)) return; altrimenti(); }   // in città a piedi l'avatar ci corre; se no si entra subito
    function trofeoVicino() {   // il trofeo che ti manca di meno (non quelli che premiano le sconfitte)
      var prof = cloud && N.profilo && N.profilo(), vic = null; if (!prof) return null;
      TROFEI.forEach(function (t) {
        if (/sconfitt|sball|perse/i.test(t.stat) || trofeoFatto(prof, t)) return;
        var v = valoreStat(prof, t.gioco, t.stat), q = v / t.meta; if (!v) return;
        if (q >= .6 && (!vic || q > vic.q)) vic = { q: q, t: t, manca: t.meta - v };
      });
      return vic;
    }
    function vociAvvisi() {
      var l = [], ps, sc, gs, tv;
      var sf = cloud ? riassuntoSfide() : null;   // 🎯 per prime le sfide del giorno
      if (sf && sf.tot) l.push({ id: "sfide", icona: "🎯", col: "#e8590c", acceso: sf.ritira > 0 || sf.fatte < sf.tot, badge: sf.ritira > 0 ? String(sf.ritira) : sf.fatte < sf.tot ? String(sf.tot - sf.fatte) : "", sotto: sf.ritira > 0 ? "Ritira!" : sf.fatte + "/" + sf.tot + " sfide", tocca: apriSfide });
      if (cloud && window.SGPesca && SGPesca.stato) { ps = SGPesca.stato(datiPesca());
        l.push({ id: "pesca", icona: "🎣", col: "#1c7ed6", acceso: ps.gratis > 0, badge: ps.gratis > 0 ? String(ps.gratis) : "", sotto: ps.gratis > 0 ? ps.gratis + " esche" : "tra " + tempoBreve(finoMezzanotte()), tocca: function () { portaA("pesca", schermataPesca); } }); }
      if (cloud && window.SGScavi && SGScavi.stato) { sc = SGScavi.stato(datiScavi()); var inf = eProprietario();
        l.push({ id: "scavi", icona: "🏺", col: "#c0702f", acceso: inf || sc.gratis > 0, badge: inf ? "∞" : sc.gratis > 0 ? String(sc.gratis) : "", sotto: inf ? "scava!" : sc.gratis > 0 ? sc.gratis + " colpi" : "tra " + tempoBreve(finoMezzanotte()), tocca: function () { portaA("scavi", schermataScavi); } }); }
      if (cloud && giardinoPronto() && SGGiardino.stato) { gs = SGGiardino.stato(datiGiardino()); var da = gs.pronte + gs.sete;
        l.push({ id: "orto", icona: gs.pronte ? "🧺" : gs.sete ? "💧" : "🌱", col: "#2f9e44", acceso: da > 0, badge: da > 0 ? String(da) : "", sotto: gs.pronte ? "raccogli" : gs.sete ? "ha sete" : gs.tra != null ? "tra " + tempoBreve(gs.tra) : "pianta!", tocca: function () { schermataGiardino(); } }); }
      if (!novitaTutteViste()) l.push({ id: "novita", icona: "📰", col: "#4c6ef5", acceso: true, badge: "!", sotto: "Novità", tocca: function () { portaA("piazza", function () { rientro = schermataCitta; schermataNovita(); }); } });
      if (prog && N.progressione().xpGiorno !== oggiStr()) l.push({ id: "xp", icona: "⭐", col: "#f59f00", acceso: true, badge: "!", sotto: "+" + SGLivelli.BONUS_GIORNO + " XP", tocca: function () { scrollCitta = 0; ultimoEdificio = null; schermataHome(); } });
      if ((tv = trofeoVicino())) l.push({ id: "trofeo", icona: tv.t.icona || "🏆", col: "#7048e8", acceso: tv.q >= .9, badge: tv.q >= .9 ? "!" : "", sotto: "ne mancano " + cifre(tv.manca), tocca: function () { schermataSfideGioco(tv.t.gioco); } });
      return l.slice(0, window.innerHeight < 700 ? 5 : 6);
    }
    function apriSfide() {   // il pannello delle sfide: "Vai" porta al gioco (o al laghetto, agli scavi), chiudendo si aggiornano monete e avvisi
      var v = pannelloSfide(function (sfida) {
        if (sfida.fonte === "pesca") return portaA("pesca", schermataPesca);
        if (sfida.fonte === "scavi") return portaA("scavi", schermataScavi);
        var g = giocoDa(sfida.gioco); if (g) { rientro = schermataCitta; apriGioco(g); }
      }, function () { ultimaColonna = ""; aggiornaAvvisi(); if (prog) aggTesta(); });
      if (v) s.appendChild(v);
    }
    function aggiornaAvvisi() {   // si rifà solo la colonna, e solo se è cambiato qualcosa (niente lampeggio)
      var l = vociAvvisi(), chiave = JSON.stringify(l.map(function (v) { return [v.id, v.icona, v.acceso, v.badge, v.sotto]; }));
      if (chiave === ultimaColonna) return; ultimaColonna = chiave; svuota(colonna);
      l.forEach(function (v) {
        var tondo = el("span", { class: "ca-tondo", style: "background-color:" + v.col }, [ el("span", { class: "ca-ico", text: v.icona }) ]);
        if (v.badge) tondo.appendChild(el("span", { class: "ca-badge", text: v.badge }));
        colonna.appendChild(el("button", { class: "citta-av " + (v.acceso ? "acceso" : "spento"), "aria-label": v.sotto, onclick: function () { if (!via) v.tocca(); } }, [ tondo, el("span", { class: "ca-nome", text: v.sotto }) ]));
      });
    }
    var s = el("div", { class: "schermata citta-vista" + (fase === "notte" ? " notte" : ""), style: "background:" + SGCitta.colorePrato(fase) }, [
      mappa, colonna,
      el("div", { class: "citta-testa" }, [
        el("button", { class: "citta-indietro", text: "‹", "aria-label": "Indietro", onclick: function () { scrollCitta = 0; ultimoEdificio = null; schermataHome(); } }),
        el("button", { class: "citta-io", "aria-label": "Il tuo profilo", onclick: function () { schermataAccesso(schermataCitta); } }, [ faccia, testoIo ]),
        el("div", { class: "citta-monete", "aria-label": "Speed Coins" }, [ el("span", { class: "citta-moneta" }), monete ])
      ]),
      avviso,
      el("div", { class: "citta-giu" }, [
        el("button", { class: "citta-tasto", onclick: function () { if (!cloud) return presto("Crea il tuo profilo per avere la tua casa 🏠"); schermataGiardino(); } }, [ el("span", { class: "ct-ico", text: "🏠" }), el("span", { text: "Casa" }), el("small", { text: cloud ? "arreda" : "col profilo" }) ]),
        tastoPresto("🛡️", "Clan", "I quartieri-clan arrivano presto 🛡️"),
        el("button", { class: "citta-tasto", onclick: function () { if (!cloud) return presto("Crea il tuo profilo per fare acquisti 🛍️"); if (giardinoPronto() || serveExtra()) return schermataGiardino(false, "compra"); schermataNegozio(); } }, [ el("span", { class: "ct-ico", text: "🛍️" }), el("span", { text: "Negozio" }), el("small", { text: cloud ? "compra" : "col profilo" }) ]),
        regalo
      ])
    ]);
    if (!vista) mappa.addEventListener("click", function (e) {
      var t = e.target && e.target.closest && e.target.closest("[data-vai]");
      if (!t || via) return;
      via = true;
      var k = t.getAttribute("data-vai"), r = t.getBoundingClientRect(), R = mappa.getBoundingClientRect();
      if (k === "piazza") fotoCitta = { src: null, punto: { x: r.left + r.width / 2, y: r.top + r.height / 2 }, t: Date.now() };   // (le novità partono dalla bacheca toccata)
      scrollCitta = mappa.scrollTop;
      // zoom verso l'edificio toccato e dissolvenza (solo transform e opacity: niente scatti)
      mappa.style.transformOrigin = Math.round(r.left + r.width / 2 - R.left) + "px " + Math.round(r.top + r.height / 2 - R.top) + "px";
      mappa.style.transition = "transform .42s cubic-bezier(.55,0,.8,.3), opacity .42s ease-in";
      requestAnimationFrame(function () { mappa.style.transform = "scale(2.6)"; mappa.style.opacity = "0"; });
      suonoEdificio(k);
      setTimeout(function () { entraEdificio(k); }, 400);
    });
    aggiornaAvvisi();
    mostra(s);
    if (vista) vista._monta(); else if (scrollCitta) mappa.scrollTop = scrollCitta;
    var tAvvisi = setInterval(function () { if (!document.body.contains(s)) return clearInterval(tAvvisi); aggiornaAvvisi(); }, 30000);   // (a mezzanotte tornano esche e colpi, le piante maturano)
  }

  // ---- Dentro gli edifici della città: le sale coi giochi della categoria (stesso modello per tutti) ----
  // cat = categoria dei giochi (CAT_GIOCO); azioni = tasti al posto dei giochi; deco = cose sparse sullo sfondo
  var EDIFICI_CITTA = {
    casino: { nome: "Casinò",      sotto: "Black Jack e Poker",           cat: "carte",  deco: ["🃏", "♠️", "🪙", "♦️", "🎲", "♣️"] },
    circolo: { nome: "Il Circolo", sotto: "Carte e giochi da tavolo",     cat: "carte",  deco: ["🂡", "⭕", "🟡", "🚢", "☕", "🃏"] },
    studio: { nome: "Studio TV",   sotto: "Quiz & parole",                cat: "parole", deco: ["❓", "🎤", "💡", "🔤", "⭐", "📺"] },
    giochi: { nome: "Sala giochi", sotto: "I minigiochi",                 cat: "mini",   deco: ["🕹️", "👾", "⭐", "🎯", "💥", "🔺"] },
    arena:  { nome: "Arena",       sotto: "Sport e sfide 1 contro 1",     cat: "sfida",  deco: ["⚔️", "🛡️", "🏁", "⚡", "🥊", "🎯"],
      fuori: { tris: 1, drop4: 1, navale: 1 } },   // Tris, Drop 4 e Battaglia Navale stanno al Circolo
    locale: { nome: "Locale",      sotto: "Giochi da fare in gruppo",     cat: "festa",  deco: ["🎉", "🪩", "🎈", "🍹", "🎶", "✨"] },
    trofei: { nome: "Sala Trofei", sotto: "Trofei e classifiche",         deco: ["🏆", "🥇", "⭐", "🎖️", "👑", "🥈"],
      azioni: function () { return [
        { icona: "🏆", nome: "I tuoi trofei", sotto: "Tutti i trofei, gioco per gioco", fai: schermataSfide },
        { icona: "👥", nome: "Classifica e amici", sotto: "Chi ha più trofei, tra gli amici e tra tutti", fai: function () { schermataAmici(); } } ]; } },
    bar:    { nome: "Bar",         sotto: "Ci si trova con gli amici",    deco: ["☕", "🥐", "🍹", "💬", "🎲", "🧁"],
      azioni: function () { return [
        { icona: "👥", nome: "Sala online", sotto: "Porta il gruppo da un gioco all'altro, ognuno dal suo telefono", fai: creaSala },
        { icona: "🏆", nome: "Serata a punti", sotto: "Più giochi di fila: i punti si sommano", fai: apriTorneo },
        { icona: "🔑", nome: "Ho un codice", sotto: "Entra nella stanza di un amico", fai: function () { entraConCodice(); } } ]; } }
  };
  function entraEdificio(k) {
    if (k === "piazza") { rientro = schermataCitta; return schermataNovita(); }   // la piazza: le novità
    if (k === "pesca") return schermataPesca();   // il laghetto col pontile: si pesca
    if (k === "scavi") return schermataScavi();   // gli scavi antichi fuori città: si scava
    if (INTERNI[k]) percorsoInterno[k] = [];   // entrando dalla città si comincia dall'ingresso
    schermataEdificio(k);
  }

  // ---- Gli interni in prima persona: il Casinò e il Circolo (i disegni sono in casino.js).
  //      Si entra in una scena (il salone, l'atrio con le porte). Toccando un tavolo o una porta la vista
  //      "cammina" fin lì (solo transform) e compare la scena dopo (una sala del Circolo) o la sala del gioco,
  //      dove si tocca il tavolo per scegliere come giocare. Con ‹ si torna indietro un passo alla volta.
  //      In basso i nomi di tutti i giochi dell'edificio, per andare dritti al tavolo ----
  var INTERNI = {
    casino:  { titolo: "CASINÒ",     scena: "salone" },
    circolo: { titolo: "IL CIRCOLO", scena: "circolo" }
  };
  var percorsoInterno = {};   // dove sei in ogni edificio: i punti toccati (es. ["carte", "scopa"]); finita la partita si torna lì
  function schermataInterno(k) {
    var I = INTERNI[k];
    if (!I || !window.SGCasino) return schermataCitta();
    rientro = function () { schermataInterno(k); };   // finita la partita (o "indietro") si torna allo stesso tavolo
    var N = window.SGNube, prog = window.SGLivelli && N && N.progressione && N.profilo() ? N.progressione() : null;
    function pc(v, tot) { return (v * 100 / tot).toFixed(2) + "%"; }
    // tutti i giochi dell'edificio con la strada per arrivarci (porte e tavoli da toccare)
    var strade = [];
    (function cerca(idScena, strada) {
      (SGCasino.punti(idScena) || { punti: [] }).punti.forEach(function (p) {
        if (p.va.gioco && giocoDa(p.va.gioco)) strade.push({ id: p.va.gioco, nome: giocoDa(p.va.gioco).nome, strada: strada.concat(p.id) });
        else if (p.va.scena) cerca(p.va.scena, strada.concat(p.id));
      });
    })(I.scena, []);
    if (!strade.length) return schermataCitta();
    var vista = el("div", { class: "cs-vista" }), strati = [], percorso = [], cammina = false, geo = null;
    var invito = el("div", { class: "cs-tocca cs-invito" }), avviso = el("div", { class: "cs-presto" });
    var titolo = el("div", { class: "cs-titolo", text: I.titolo });
    vista.appendChild(invito); vista.appendChild(avviso);

    // una scena: il disegno 360×640 steso come "copertina", con sopra le insegne, i luccichii e le zone da toccare
    function stratoScena(idScena, nome) {
      var S = SGCasino.scena(idScena);
      var mov = el("div", { class: "cs-salone" });
      var dentro = el("div", { class: "cs-salone-in" }, [ el("img", { class: "cs-scena-salone", alt: "", draggable: "false", src: S.img }) ]);
      S.luci.forEach(function (l, i) {
        for (var q = 0; q < 5; q++) {
          var a = q * 1.3 + i * 0.6, x = l[0] + Math.cos(a) * l[2] * 0.5, y = l[1] + l[2] * 0.12 + Math.sin(a) * l[2] * 0.26;
          dentro.appendChild(el("i", { class: "cs-luccica", style: "left:" + pc(x, 360) + ";top:" + pc(y, 640) + ";animation-delay:" + (q * 0.55 + i * 0.3).toFixed(2) + "s" }));
        }
      });
      S.punti.forEach(function (p) {
        if (p.va.gioco && !giocoDa(p.va.gioco)) return;
        var b = p.box;
        if (p.cartello) dentro.appendChild(el("div", { class: "cs-cartello cs-" + p.stile + (p.muro ? " cs-muro" : ""), style: "left:" + pc(p.cartello[0], 360) + ";top:" + pc(p.cartello[1], 640) },
          [ el("b", { text: p.insegna }), p.va.presto ? el("i", { class: "cs-lucchetto", text: "🔒 Prossimamente" }) : null ]));
        dentro.appendChild(el("button", { class: "cs-zona", "aria-label": p.nome, onclick: function () { tocca(p); },
          style: "left:" + pc(b[0], 360) + ";top:" + pc(b[1], 640) + ";width:" + pc(b[2] - b[0], 360) + ";height:" + pc(b[3] - b[1], 640) }));
      });
      mov.appendChild(dentro);
      var porte = S.punti.some(function (p) { return p.va.scena; });
      return { tipo: "scena", el: mov, dentro: dentro, punti: S.punti, nome: nome, invito: porte ? "👆 Scegli una porta" : "👆 Scegli un tavolo" };
    }
    // la sala di un gioco (il primo piano del tavolo): si tocca e si sceglie come giocare
    function stratoSala(id, nome) {
      var x = SGCasino.SALE.filter(function (q) { return q.id === id; })[0] || { nome: id, insegna: id, stile: "bj" };
      var d = el("div", { class: "cs-sala cs-primo cs-" + x.stile, role: "button", "aria-label": x.nome + ": tocca per giocare" }, [
        el("img", { class: "cs-scena", alt: "", draggable: "false", src: SGCasino.immagine(id) }),
        el("div", { class: "cs-insegna" }, [ el("b", { text: x.insegna }) ]),
        el("div", { class: "cs-tocca", text: "👆 Tocca il tavolo per giocare" })
      ]);
      d.addEventListener("click", function () { var g = !cammina && giocoDa(id); if (g) scegliModoEdificio(g, k); });
      return { tipo: "sala", el: d, id: id, nome: nome };
    }
    function stendi(s) {
      if (s.tipo !== "scena" || !geo) return;
      s.dentro.style.cssText = "width:" + (360 * geo.s).toFixed(1) + "px;height:" + (640 * geo.s).toFixed(1) + "px;left:" + geo.ox.toFixed(1) + "px;top:" + geo.oy.toFixed(1) + "px;--s:" + geo.s.toFixed(3);
    }
    function misura() {
      var cw = vista.clientWidth, ch = vista.clientHeight; if (!cw || !ch) return false;
      var s = Math.max(cw / 360, ch / 640);
      geo = { s: s, ox: (cw - 360 * s) / 2, oy: (ch - 640 * s) * 0.45, cw: cw, ch: ch };
      strati.forEach(stendi);
      return true;
    }
    function cima() { return strati[strati.length - 1]; }
    function zoomSu(s, p) {   // la vista che porta il punto p della scena s al centro, da vicino
      var fx = geo.ox + p.fuoco[0] * geo.s, fy = geo.oy + p.fuoco[1] * geo.s;
      s.el.style.transformOrigin = fx.toFixed(1) + "px " + fy.toFixed(1) + "px";
      return "translate(" + (geo.cw / 2 - fx).toFixed(1) + "px," + (geo.ch * 0.52 - fy).toFixed(1) + "px) scale(" + (p.va.scena ? 2.3 : 2.6) + ")";
    }
    function aggiorna() {   // il titolo, il "tocca qui", il gioco acceso nei tasti in basso; si ricorda dove sei
      var c = cima(), nome = I.titolo;
      strati.forEach(function (s) { if (s.tipo === "scena" && s.nome) nome = s.nome; });
      titolo.textContent = nome;
      invito.textContent = c && c.invito || "";
      vista.classList.toggle("in-sala", !!c && c.tipo === "sala");
      tasti.forEach(function (b) { b.el.classList.toggle("on", c && c.tipo === "sala" && c.id === b.id); });
      percorsoInterno[k] = percorso.slice();
    }
    function presto(testo) { avviso.textContent = testo; avviso.classList.remove("su"); void avviso.offsetWidth; avviso.classList.add("su"); }
    function tocca(p) {
      if (cammina) return;
      if (p.va.presto) return presto(p.va.presto);
      avanti(p);
    }
    // un passo avanti: la vista si avvicina al punto e compare quello che c'è dietro
    function avanti(p, subito, poi) {
      var sotto = cima();
      if (cammina || !geo || !sotto || sotto.tipo !== "scena") return;
      var nuovo = p.va.scena ? stratoScena(p.va.scena, p.nome.toUpperCase()) : stratoSala(p.va.gioco);
      if (nuovo.tipo === "scena") nuovo.el.classList.add("cs-primo");
      vista.insertBefore(nuovo.el, invito);
      strati.push(nuovo); percorso.push(p.id); sotto.verso = p;
      stendi(nuovo); aggiorna();
      if (subito) {
        sotto.el.style.transition = nuovo.el.style.transition = "none";
        sotto.el.style.transform = zoomSu(sotto, p); sotto.el.style.visibility = "hidden";
        nuovo.el.classList.add("su"); void nuovo.el.offsetWidth; nuovo.el.style.transition = "";
        if (poi) poi();
        return;
      }
      cammina = true;
      sotto.el.style.transition = "transform .85s cubic-bezier(.45,0,.25,1)";
      sotto.el.style.transform = zoomSu(sotto, p);
      sotto.el.classList.add("passi");
      setTimeout(function () { nuovo.el.classList.add("su"); suonoEdificio(nuovo.tipo === "sala" && k === "casino" ? "casino" : k); }, 560);
      setTimeout(function () { cammina = false; sotto.el.classList.remove("passi"); sotto.el.style.visibility = "hidden"; if (poi) poi(); }, 950);
      if (nuovo.tipo === "scena") prepara(nuovo.punti, 1100);
    }
    // un passo indietro: quello di sopra sparisce e la vista si allontana
    function indietro(poi) {
      if (cammina || strati.length < 2) return;
      cammina = true;
      var su = strati.pop(), sotto = cima();
      percorso.pop(); sotto.verso = null; aggiorna();
      sotto.el.style.visibility = "";
      su.el.style.transform = ""; su.el.classList.remove("su");
      sotto.el.style.transition = "transform .7s cubic-bezier(.3,0,.2,1)";
      requestAnimationFrame(function () { sotto.el.style.transform = "none"; });
      setTimeout(function () { if (su.el.parentNode) su.el.parentNode.removeChild(su.el); cammina = false; if (poi) poi(); }, 730);
    }
    function punto(s, id) { return (s.punti || []).filter(function (p) { return p.id === id; })[0]; }
    // dai tasti in basso: dritti al tavolo di quel gioco (le porte di mezzo si passano subito, l'ultimo passo si cammina)
    function vaiA(strada) {
      if (cammina) return;
      var com = 0;
      while (com < percorso.length && com < strada.length && percorso[com] === strada[com]) com++;
      if (com === strada.length && percorso.length === strada.length) return;
      if (strati.length - 1 > com) {   // torno dove la strada si divide
        if (strati.length - 2 === com) return indietro(function () { vaiA(strada); });
        while (strati.length - 1 > com) { var s = strati.pop(); if (s.el.parentNode) s.el.parentNode.removeChild(s.el); percorso.pop(); }
        var base = cima(); base.verso = null; base.el.style.transition = "none"; base.el.style.transform = "none"; base.el.style.visibility = "";
        aggiorna();
      }
      (function passo(i) {
        var p = punto(cima(), strada[i]); if (!p) return;
        if (i < strada.length - 1) avanti(p, true, function () { passo(i + 1); });
        else avanti(p);
      })(com);
    }
    // i disegni dietro le porte e le sale dei tavoli si preparano dopo, uno alla volta (così si entra subito)
    function prepara(lista, dopo) {
      lista.forEach(function (p, i) {
        setTimeout(function () {
          if (!document.body.contains(vista)) return;
          if (p.va.scena) SGCasino.scena(p.va.scena); else if (p.va.gioco) { var im = new Image(); im.src = SGCasino.immagine(p.va.gioco); }
        }, dopo + i * 250);
      });
    }
    var links = el("div", { class: "cs-giochi" });
    var tasti = strade.map(function (r) {
      var b = el("button", { class: "cs-link", text: r.nome, onclick: function () { vaiA(r.strada); } });
      links.appendChild(b);
      return { el: b, id: r.id };
    });
    var s = el("div", { class: "schermata casino-sale interno-" + k }, [
      vista,
      el("div", { class: "cs-testa" }, [
        el("button", { class: "ed-indietro", text: "‹", "aria-label": "Indietro", onclick: function () {
          if (strati.length > 1) indietro(); else if (!cammina) { rientro = null; schermataCitta(); }
        } }),
        titolo,
        prog ? el("div", { class: "ed-monete", text: "🪙 " + cifre(prog.coins) }) : el("div", { class: "ed-monete vuoto" })
      ]),
      links
    ]);
    mostra(s);
    var radice = stratoScena(I.scena, null), ritorno = (percorsoInterno[k] || []).slice();
    vista.insertBefore(radice.el, invito); strati.push(radice);
    (function parti() {
      if (!misura()) return requestAnimationFrame(parti);
      aggiorna();
      // tornando da una partita: di nuovo dov'eri, senza camminare
      (function passo(i) { var p = i < ritorno.length && punto(cima(), ritorno[i]); if (p) avanti(p, true, function () { passo(i + 1); }); })(0);
      prepara(radice.punti, 450);
    })();
    // telefono girato o finestra cambiata: si ristende tutto (e la vista resta dov'era)
    function ridim() {
      if (!document.body.contains(vista)) return window.removeEventListener("resize", ridim);
      if (!misura()) return;
      strati.forEach(function (st) { if (st.verso) { st.el.style.transition = "none"; st.el.style.transform = zoomSu(st, st.verso); } });
    }
    window.addEventListener("resize", ridim);
  }
  function schermataEdificio(k) {
    if (k === "casino") { if (serveExtra()) return caricaExtra(function () { schermataEdificio(k); }, "🎰"); if (window.SGGiardino) return schermataCasinoSala(); }   // il Casinò nuovo, visto dall'alto (per ora solo per il proprietario)
    if (k === "circolo" && (CIRCOLO_PRONTO || eProprietario())) { if (serveExtra()) return caricaExtra(function () { schermataEdificio(k); }, "🎲"); if (window.SGGiardino) return schermataCircoloSala(); }   // il Circolo visto dall'alto
    if (INTERNI[k] && window.SGCasino) return schermataInterno(k);   // Casinò e Circolo: gli interni in prima persona
    var E = EDIFICI_CITTA[k]; if (!E) return schermataCitta();
    rientro = function () { schermataEdificio(k); };   // finita la partita (o "indietro") si torna qui
    var N = window.SGNube, prog = window.SGLivelli && N && N.progressione && N.profilo() ? N.progressione() : null;
    var s = el("div", { class: "schermata edificio ed-" + k });
    var deco = el("div", { class: "ed-deco", "aria-hidden": "true" });
    E.deco.forEach(function (d, i) { deco.appendChild(el("span", { class: "d" + i, text: d })); });
    s.appendChild(deco);
    s.appendChild(el("div", { class: "ed-testa" }, [
      el("button", { class: "ed-indietro", text: "‹", "aria-label": "Torna in città", onclick: function () { rientro = null; schermataCitta(); } }),
      el("div", { class: "ed-titolo" }, [ el("b", { text: E.nome.toUpperCase() }), el("span", { text: E.sotto }) ]),
      prog ? el("div", { class: "ed-monete", text: "🪙 " + cifre(prog.coins) }) : el("div", { class: "ed-monete vuoto" })
    ]));
    var griglia = el("div", { class: "griglia-giochi ed-sale" });
    if (E.cat) giochi.forEach(function (g) { if (catDi(g) === E.cat && !(E.fuori && E.fuori[g.id])) griglia.appendChild(tesseraGioco(g, function () { scegliModoEdificio(g, k); })); });
    else E.azioni().forEach(function (a) {
      griglia.appendChild(el("button", { class: "tessera ed-azione", onclick: a.fai }, [
        el("span", { class: "icona" }, [ el("span", { class: "emoji", text: a.icona }) ]),
        el("div", { class: "info" }, [ el("h2", { text: a.nome }), el("p", { text: a.sotto }) ])
      ]));
    });
    s.appendChild(griglia);
    mostra(s);
  }
  var posCasino = null;   // dove eri nel casinò quando hai cominciato una partita: finita, si torna lì
  function schermataCasinoSala(pos) {   // il salone del Casinò visto dall'alto, come la casa: si cammina tra i tavoli e ci si siede a giocare
    rientro = function () { schermataCasinoSala(posCasino); };   // finita la partita si torna nel salone, dove eri
    var io = profiloAttivo(), m = soldiCasa();
    var s = SGGiardino.crea({ luogo: "casino", pos: pos || null, omino: io && io.omino, nome: io && io.nome, audio: audioCtx, monete: m.monete, spendi: m.spendi, guadagna: m.guadagna,
      gioca: function (id, dove) { posCasino = dove || null; var g = giocoDa(id); if (g) scegliModoEdificio(g, "casino"); },
      indietro: function () { rientro = null; schermataCitta(); } });
    mostra(s); s._monta();
  }
  // il Circolo visto dall'alto: si cammina tra i tavoli, ci si siede e si gioca (carte, giochi a due, biliardo); fuori il cortile con le bocce
  var CIRCOLO_PRONTO = false;   // false = per ora lo vede solo il proprietario (gli altri hanno il Circolo di prima)
  var posCircolo = null;
  function schermataCircoloSala(pos) {
    rientro = function () { schermataCircoloSala(posCircolo); };   // finita la partita si torna nel Circolo, dove eri
    var io = profiloAttivo(), m = soldiCasa();
    var s = SGGiardino.crea({ luogo: "circolo", pos: pos || null, omino: io && io.omino, nome: io && io.nome, audio: audioCtx, monete: m.monete, spendi: m.spendi, guadagna: m.guadagna,
      gioca: function (id, dove) { posCircolo = dove || null; var g = giocoDa(id); if (g) scegliModoEdificio(g, "circolo"); },
      indietro: function () { rientro = null; schermataCitta(); } });
    mostra(s); s._monta();
  }
  // toccato un gioco: "Come giocate?" in una finestra sopra la sala, coi modi veri del gioco
  function scegliModoEdificio(g, k) {
    if (!profiloAttivo()) return schermataAccesso(function () { schermataEdificio(k); });
    var modi = modiDi(g).slice();
    if (giocoOnline(g)) conCodice(modi);
    if (modi.length <= 1) return apriGioco(g);   // un modo solo: si parte subito, come dalla home
    var chiudi = function () { if (sfondo.parentNode) sfondo.parentNode.removeChild(sfondo); };
    var lista = el("div", { class: "modo-scelta" });
    modi.forEach(function (m) {
      lista.appendChild(el("button", { class: "modo-grande" + (m.modo === "online" ? " online" : ""), onclick: function () { chiudi(); sceltoModo(g, m); } }, [
        el("div", { class: "mg-ico", text: m.icona }),
        el("div", { class: "mg-testo" }, [ el("div", { class: "mg-tit", text: m.nome }), el("div", { class: "mg-sotto", text: m.sotto || "" }) ]),
        el("div", { class: "mg-freccia", text: "›" })
      ]));
    });
    var sfondo = el("div", { class: "ed-modale-sfondo ed-" + k, onclick: function (e) { if (e.target === sfondo) chiudi(); } }, [
      el("div", { class: "ed-modale", role: "dialog" }, [
        el("div", { class: "edm-testa" }, [ el("span", { class: "edm-ico", text: g.icona || "🎲" }), el("div", {}, [ el("b", { text: g.nome }), el("span", { text: "Come giocate?" }) ]) ]),
        lista,
        el("div", { class: "edm-piede" }, [
          el("button", { class: "btn btn-fantasma", text: "📖 Come si gioca", onclick: function () { chiudi(); schermataRegole(g, function () { schermataEdificio(k); }); } }),
          el("button", { class: "btn btn-fantasma", text: "✕ Chiudi", onclick: chiudi })
        ])
      ])
    ]);
    document.body.appendChild(sfondo);
  }
  // un suono corto entrando (le fiches al Casinò, un "din" altrove): niente musica di sottofondo
  function suonoEdificio(k) {
    var ctx = audioCtx(); if (!ctx) return;
    try {
      var note = k === "casino" ? [[2400, 0], [2900, .07], [2600, .13]] : [[660, 0], [990, .09]];
      note.forEach(function (n) {
        var t0 = ctx.currentTime + n[1], o = ctx.createOscillator(), gn = ctx.createGain();
        o.type = k === "casino" ? "triangle" : "sine"; o.frequency.setValueAtTime(n[0], t0);
        gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(k === "casino" ? 0.08 : 0.1, t0 + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + (k === "casino" ? 0.12 : 0.3));
        o.connect(gn); gn.connect(ctx.destination); o.start(t0); o.stop(t0 + 0.35);
      });
    } catch (e) {}
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
  // dal menu normale: la lista semplice delle novità, come una volta (in città invece si leggono sulla bacheca della piazza)
  function novitaLista() {
    var visto = 0;
    try { visto = Number(localStorage.getItem(CHIAVE_NOVITA)) || 0; } catch (e) {}
    var s = schermata({ icona: "🆕", titolo: "Novità", sotto: "Cosa è stato aggiunto", indietro: tornaHome }); s._menu = "novita";
    var tutte = window.SG_NOVITA || [], messe = 0;
    function altre(quante) {   // a gruppi: sono tante, e tutte insieme sui telefoni lo scorrimento rallenta
      var vecchio = s._contenuto.querySelector(".novita-altre"); if (vecchio) vecchio.parentNode.removeChild(vecchio);
      for (var fine = Math.min(tutte.length, messe + quante); messe < fine; messe++) {
        var n = tutte[messe], punti = el("ul", { class: "novita-punti" });
        (n.descrizione || []).forEach(function (r) { punti.appendChild(el("li", { text: r })); });
        s._contenuto.appendChild(el("div", { class: "novita-card" }, [
          el("div", { class: "novita-data", text: n.data + (n.v > visto ? " · 🆕 NUOVO" : "") }),
          el("h2", { class: "novita-titolo", text: n.titolo }),
          punti
        ]));
      }
      if (messe < tutte.length) s._contenuto.appendChild(el("button", { class: "btn btn-fantasma novita-altre", text: "📜 Le novità più vecchie", onclick: function () { altre(25); } }));
    }
    altre(25);
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Ho capito", onclick: tornaHome }));
    segnaNovitaViste();   // aperto = visto
    mostra(s);
  }
  function cittaSfocata(src) {   // la città sfocata, fatta una volta sola: rimpicciolita e ringrandita (niente filtri da ricalcolare mentre si anima)
    var a = document.createElement("canvas"), b = document.createElement("canvas"), x, y;
    a.width = Math.max(8, Math.round(src.width / 14)); a.height = Math.max(8, Math.round(src.height / 14));
    x = a.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(src, 0, 0, a.width, a.height);
    b.width = a.width * 3; b.height = a.height * 3; y = b.getContext("2d"); y.imageSmoothingQuality = "high"; y.drawImage(a, 0, 0, b.width, b.height);
    return b;
  }
  function schermataNovita() {   // le novità si leggono sulla bacheca della piazza, da vicino, con la città sfocata dietro
    var f = fotoCitta && Date.now() - fotoCitta.t < 8000 ? fotoCitta : null; fotoCitta = null;
    var fase = window.SGCitta ? SGCitta.fase(new Date()) : "giorno", visto = 0;
    try { visto = Number(localStorage.getItem(CHIAVE_NOVITA)) || 0; } catch (e) {}
    var sfondo, scatto = null;
    if (f && f.tela) {   // dalla città a piedi: la copia della città, sfocata una volta (sfondo) e nitida (la vista che ci entra)
      try { sfondo = cittaSfocata(f.tela); sfondo.className = "nb-sfondo-c"; scatto = f.tela; scatto.className = "nb-scatto"; } catch (e) { sfondo = null; scatto = null; }
    }
    if (!sfondo) {   // dalla home (o dalla città da scorrere): la città disegnata, sfocata
      sfondo = el("div", { class: "nb-sfondo svg" });
      if (window.SGCitta) sfondo.style.backgroundImage = "url(\"data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGCitta.svg({ fase: fase })) + "\")";
    }
    // i foglietti: uno per novità, appuntati sul sughero, un po' storti; quelli che non hai ancora letto hanno l'etichetta NUOVO
    var sughero = el("div", { class: "nb-sughero" });
    var tutte = window.SG_NOVITA || [], messe = 0;
    function foglietto(n, i) {
      var punti = el("ul", { class: "nb-punti" });
      (n.descrizione || []).forEach(function (r) { punti.appendChild(el("li", { text: r })); });
      var foglio = el("div", { class: "nb-foglio" + ["", " giallo", " azzurro", " giallo", ""][i % 5] }, [
        el("i", { class: "nb-puntina c" + (i % 4) }),
        el("div", { class: "nb-data", text: n.data }),
        el("h2", { class: "nb-titolo", text: n.titolo }),
        punti
      ]);
      foglio.style.transform = "rotate(" + [-1.1, .8, -.5, 1.2, -.8][i % 5] + "deg)";
      if (n.v > visto) foglio.appendChild(el("span", { class: "nb-nuovo", text: "NUOVO" }));
      sughero.appendChild(foglio);
    }
    function altre(quante) {   // a gruppi (sono tante: tutte insieme lo scorrimento sui telefoni rallenta)
      var vecchio = sughero.querySelector(".nb-altre"); if (vecchio) vecchio.parentNode.removeChild(vecchio);
      var fine = Math.min(tutte.length, messe + quante); for (; messe < fine; messe++) foglietto(tutte[messe], messe);
      if (messe < tutte.length) { var b = el("button", { class: "nb-altre", text: "📜 Le novità più vecchie", onclick: function () { altre(25); } }); sughero.appendChild(b); }
    }
    altre(3);   // mentre la bacheca arriva ne bastano tre (le altre si appuntano appena è ferma: l'animazione resta fluida)
    var bacheca = el("div", { class: "nb-bacheca" }, [
      el("i", { class: "nb-palo sx" }), el("i", { class: "nb-palo dx" }),
      el("div", { class: "nb-tetto" }),
      el("div", { class: "nb-insegna", text: "NOVITÀ" }),
      el("div", { class: "nb-cornice" }, [ sughero ])
    ]);
    var uscito = false;
    function esci() {   // la bacheca si allontana, e si torna dove si era (la piazza o la home)
      if (uscito) return; uscito = true;
      try { bacheca.style.willChange = "transform, opacity"; bacheca.animate([{ transform: "translateX(-50%) scale(1)", opacity: 1 }, { transform: "translateX(-50%) scale(.82)", opacity: 0 }], { duration: 200, easing: "ease-in", fill: "forwards" }); } catch (e) {}
      setTimeout(tornaHome, 180);
    }
    var s = el("div", { class: "schermata nb-vista" + (fase === "notte" ? " notte" : fase === "tramonto" ? " tramonto" : "") }, [
      sfondo, el("div", { class: "nb-velo" }), bacheca,
      el("button", { class: "nb-indietro", text: "‹", "aria-label": "Torna indietro", onclick: esci }),
      el("button", { class: "nb-ok", text: rientro === schermataCitta ? "Torna in piazza" : "Ho capito", onclick: esci })
    ]);
    if (scatto) s.appendChild(scatto);
    segnaNovitaViste();   // aperto = visto
    mostra(s);
    // l'arrivo: dalla città la vista "entra" verso la bacheca (solo spostamenti e trasparenza, sul livello già pronto: niente scatti)
    var W = window.innerWidth, H = window.innerHeight, p = f && f.punto ? f.punto : { x: W / 2, y: H * .5 }, dx = Math.round(p.x - W / 2), dy = Math.round(p.y - H * .45);
    var fatto = false;
    function fermo() { if (fatto) return; fatto = true; bacheca.style.willChange = ""; if (scatto && scatto.parentNode) scatto.parentNode.removeChild(scatto); altre(22); }
    setTimeout(fermo, 1000);   // (per sicurezza, se l'animazione non finisce: app in sottofondo)
    try {
      bacheca.style.willChange = "transform, opacity";
      var a1 = bacheca.animate([
        { transform: "translate(calc(-50% + " + dx + "px), " + dy + "px) scale(.14)", opacity: 0 },
        { transform: "translate(calc(-50% + " + Math.round(dx * .6) + "px), " + Math.round(dy * .6) + "px) scale(.4)", opacity: 1, offset: .3 },
        { transform: "translate(-50%, 0) scale(1)", opacity: 1 }
      ], { duration: 650, easing: "cubic-bezier(.25,.7,.25,1)" });
      a1.onfinish = fermo;
      if (scatto) {
        scatto.style.transformOrigin = p.x + "px " + p.y + "px"; scatto.style.willChange = "transform, opacity";
        scatto.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(3)", opacity: 0 }], { duration: 600, easing: "cubic-bezier(.45,0,.75,1)", fill: "forwards" });
      }
    } catch (e) { fermo(); }
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
    { gioco: "blackjack", livello: "bronzo",   icona: "🎁", nome: "Piccolo Dono",             desc: "Gira per la prima volta la ruota del giorno",                 stat: "bonusRitirati",     meta: 1 },
    { gioco: "blackjack", livello: "bronzo",   icona: "🐷", nome: "Risparmiatore Felice",     desc: "Vinci 500 fiches in totale",                                 stat: "fichesVinteTot",    meta: 500 },
    { gioco: "blackjack", livello: "bronzo",   icona: "🙃", nome: "Sbagliando si Impara",     desc: "Sballa superando il 21 per 5 volte",                         stat: "maniSballate",      meta: 5 },
    { gioco: "blackjack", livello: "bronzo",   icona: "🤝", nome: "Stretta di Mano",          desc: "Pareggia con il banco 3 volte",                              stat: "maniPari",          meta: 3 },
    { gioco: "blackjack", livello: "bronzo",   icona: "🍀", nome: "Fortuna Cieca",            desc: "Vinci 5 mani perché il banco sballa",                        stat: "vinteSballoBanco",  meta: 5 },
    { gioco: "blackjack", livello: "bronzo",   icona: "🌧️", nome: "Domani Andrà Meglio",      desc: "Perdi 3 mani di fila. Non mollare!",                         stat: "serieSconfitteMax", meta: 3 },
    { gioco: "blackjack", livello: "argento",  icona: "🌊", nome: "Onda Positiva",            desc: "Vinci 20 mani contro il banco",                              stat: "maniVinte",         meta: 20 },
    { gioco: "blackjack", livello: "argento",  icona: "🎼", nome: "Armonia Perfetta",         desc: "Fai Black Jack 10 volte",                                    stat: "blackjackFatti",    meta: 10 },
    { gioco: "blackjack", livello: "argento",  icona: "📅", nome: "Appuntamento Felice",      desc: "Gira la ruota del giorno 10 volte",                            stat: "bonusRitirati",     meta: 10 },
    { gioco: "blackjack", livello: "argento",  icona: "🌾", nome: "Abbondanza",               desc: "Vinci 5.000 fiches in totale",                               stat: "fichesVinteTot",    meta: 5000 },
    { gioco: "blackjack", livello: "argento",  icona: "🌈", nome: "Ottimismo Incorreggibile", desc: "Sballa superando il 21 per 25 volte",                        stat: "maniSballate",      meta: 25 },
    { gioco: "blackjack", livello: "argento",  icona: "🫱", nome: "Pura Sinergia",            desc: "Pareggia con il banco 15 volte",                             stat: "maniPari",          meta: 15 },
    { gioco: "blackjack", livello: "argento",  icona: "🛡️", nome: "Aura Protettiva",          desc: "Vinci 25 mani perché il banco sballa",                       stat: "vinteSballoBanco",  meta: 25 },
    { gioco: "blackjack", livello: "argento",  icona: "🧊", nome: "Sangue Freddo",            desc: "Fai 21 esatto con 3 o più carte, 5 volte",                   stat: "ventunoTre",        meta: 5 },
    { gioco: "blackjack", livello: "argento",  icona: "🦁", nome: "Coraggio da Leoni",        desc: "Vinci una mano puntando almeno 500 fiches",                  stat: "puntataVintaMax",   meta: 500 },
    { gioco: "blackjack", livello: "oro",      icona: "☀️", nome: "Raggio di Sole",           desc: "Vinci 100 mani contro il banco",                             stat: "maniVinte",         meta: 100 },
    { gioco: "blackjack", livello: "oro",      icona: "🤩", nome: "Estasi del Gioco",         desc: "Fai Black Jack 50 volte",                                    stat: "blackjackFatti",    meta: 50 },
    { gioco: "blackjack", livello: "oro",      icona: "💝", nome: "Gratitudine Infinita",     desc: "Gira la ruota del giorno 50 volte",                            stat: "bonusRitirati",     meta: 50 },
    { gioco: "blackjack", livello: "oro",      icona: "💎", nome: "Tesoro Luminoso",          desc: "Vinci 25.000 fiches in totale",                              stat: "fichesVinteTot",    meta: 25000 },
    { gioco: "blackjack", livello: "oro",      icona: "🏛️", nome: "Architetto del Ventuno",   desc: "Fai 21 esatto con 3 o più carte, 20 volte",                  stat: "ventunoTre",        meta: 20 },
    { gioco: "blackjack", livello: "oro",      icona: "🔥", nome: "All-In Emotivo",           desc: "Vinci una mano puntando almeno 2.500 fiches",                stat: "puntataVintaMax",   meta: 2500 },
    { gioco: "blackjack", livello: "diamante", icona: "☁️", nome: "Nuvola Nove",              desc: "Fai 2 Black Jack di fila nella stessa sessione",             stat: "serieBJMax",        meta: 2 },
    { gioco: "blackjack", livello: "diamante", icona: "🕊️", nome: "Spirito Libero",           desc: "Vinci 7 mani di fila senza perdere né pareggiare",           stat: "serieVinteMax",     meta: 7 },
    { gioco: "blackjack", livello: "diamante", icona: "🧘", nome: "Pace dei Sensi",           desc: "Arriva ad avere 100.000 Speed Coins",                        stat: "recordFiches",      meta: 100000 },
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

    // ---------- Calcio Biliardo ----------
    { gioco: "calciobiliardo", livello: "bronzo",   icona: "🏟️", nome: "Esordio in Campo",      desc: "Gioca la tua prima partita",                               stat: "partite",           meta: 1 },
    { gioco: "calciobiliardo", livello: "bronzo",   icona: "⚽", nome: "La Prima Rete",          desc: "Segna il tuo primo gol",                                    stat: "golFatti",          meta: 1 },
    { gioco: "calciobiliardo", livello: "bronzo",   icona: "🥅", nome: "Tre Punti",              desc: "Vinci la tua prima partita",                                stat: "vittorie",          meta: 1 },
    { gioco: "calciobiliardo", livello: "bronzo",   icona: "🤖", nome: "Bot, Attento!",         desc: "Batti Bot Facile",                                         stat: "vinte_facile",      meta: 1 },
    { gioco: "calciobiliardo", livello: "bronzo",   icona: "😎", nome: "Faccia da Gol",          desc: "Segna con il tuo attaccante, quello col tuo avatar",        stat: "golAttaccante",     meta: 1 },
    { gioco: "calciobiliardo", livello: "bronzo",   icona: "🌐", nome: "Vittoria in Rete",       desc: "Vinci una partita online",                                  stat: "vinteOnline",       meta: 1 },
    { gioco: "calciobiliardo", livello: "argento",  icona: "⚡", nome: "Reti in Crescita",       desc: "Segna 25 gol in totale",                                    stat: "golFatti",          meta: 25 },
    { gioco: "calciobiliardo", livello: "argento",  icona: "🧠", nome: "Bot alla Prova",        desc: "Batti Bot Medio",                                          stat: "vinte_medio",       meta: 1 },
    { gioco: "calciobiliardo", livello: "argento",  icona: "🪵", nome: "Sponda Vincente",        desc: "Segna 5 gol dopo un rimbalzo sulla sponda nello stesso tiro", stat: "golSponda",         meta: 5 },
    { gioco: "calciobiliardo", livello: "argento",  icona: "🎯", nome: "Tiro da Lontano",       desc: "Segna 5 gol partendo dalla tua metà campo",                  stat: "golLontano",        meta: 5 },
    { gioco: "calciobiliardo", livello: "argento",  icona: "⏱️", nome: "Fischio Finale",        desc: "Vinci una partita a tempo",                                  stat: "vinteTempo",        meta: 1 },
    { gioco: "calciobiliardo", livello: "oro",      icona: "💯", nome: "Cento Reti",             desc: "Segna 100 gol in totale",                                   stat: "golFatti",          meta: 100 },
    { gioco: "calciobiliardo", livello: "oro",      icona: "🦾", nome: "Bot Battuto",           desc: "Batti Bot Difficile",                                      stat: "vinte_difficile",   meta: 1 },
    { gioco: "calciobiliardo", livello: "oro",      icona: "🤝", nome: "Amici in Rete",          desc: "Vinci 10 partite online",                                   stat: "vinteOnline",       meta: 10 },
    { gioco: "calciobiliardo", livello: "oro",      icona: "🏆", nome: "Rigori da Campione",     desc: "Vinci una partita ai rigori",                               stat: "vinteRigori",       meta: 1 },
    { gioco: "calciobiliardo", livello: "oro",      icona: "🔄", nome: "Rimonta Completa",       desc: "Vinci dopo essere stato sotto di 2 gol",                    stat: "rimonte",           meta: 1 },
    { gioco: "calciobiliardo", livello: "oro",      icona: "🔔", nome: "Palo e Rete",            desc: "Segna 3 gol dopo aver colpito il palo nello stesso tiro",    stat: "golPalo",           meta: 3 },
    { gioco: "calciobiliardo", livello: "diamante", icona: "🧱", nome: "Muro Giallo e Blu",      desc: "Batti Bot Difficile senza subire gol, segnandone almeno 3", stat: "cappotti_difficile", meta: 1 },
    { gioco: "calciobiliardo", livello: "diamante", icona: "👑", nome: "Cinque Volte Bot",      desc: "Batti Bot Difficile 5 volte",                               stat: "vinte_difficile",   meta: 5 },
    { gioco: "calciobiliardo", livello: "diamante", icona: "🌟", nome: "Leggenda del Campo",     desc: "Segna 250 gol in totale",                                   stat: "golFatti",          meta: 250 },

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
    { gioco: "drop4", livello: "diamante", icona: "✨", nome: "Partita Perfetta",       desc: "Vinci mettendo solo 4 pedine (online o contro il Bot Difficile)", stat: "vinteIn4",        meta: 1 },
    { gioco: "drop4", livello: "diamante", icona: "💻", nome: "Dominio Cibernetico",    desc: "Batti il bot Difficile 5 volte",                               stat: "vinteDifficile",  meta: 5 },
    { gioco: "drop4", livello: "diamante", icona: "🧊", nome: "Stallo Architettonico",  desc: "Pareggia online o contro il Bot Medio o Difficile: griglia piena, nessuno fa 4",stat: "pareggi",         meta: 1 },

    // ---- BATTAGLIA NAVALE ----
    { gioco: "navale", livello: "bronzo",   icona: "🚢", nome: "Prima Salva",             desc: "Gioca la tua prima partita",                                  stat: "partite",             meta: 1 },
    { gioco: "navale", livello: "bronzo",   icona: "🎯", nome: "Tiro a Segno",             desc: "Colpisci una nave",                                           stat: "colpiAsegno",         meta: 1 },
    { gioco: "navale", livello: "bronzo",   icona: "💥", nome: "A Fondo!",                 desc: "Affonda la tua prima nave avversaria",                       stat: "naviAffondate",       meta: 1 },
    { gioco: "navale", livello: "bronzo",   icona: "🏁", nome: "Prima Vittoria",           desc: "Vinci una partita",                                           stat: "vittorie",            meta: 1 },
    { gioco: "navale", livello: "bronzo",   icona: "🔭", nome: "Buona la Prima",           desc: "Colpisci una nave con il primo tiro della partita",           stat: "primiColpiAsegno",    meta: 1 },
    { gioco: "navale", livello: "bronzo",   icona: "🔗", nome: "In Rete",                  desc: "Gioca la tua prima partita online",                           stat: "partiteOnline",       meta: 1 },
    { gioco: "navale", livello: "argento",  icona: "⚓", nome: "Marinaio Costante",        desc: "Gioca 10 partite",                                            stat: "partite",             meta: 10 },
    { gioco: "navale", livello: "argento",  icona: "🫧", nome: "Flotta negli Abissi",      desc: "Affonda 25 navi avversarie in tutto",                        stat: "naviAffondate",       meta: 25 },
    { gioco: "navale", livello: "argento",  icona: "🧭", nome: "Mira Sicura",              desc: "Colpisci 100 caselle occupate da navi",                      stat: "colpiAsegno",         meta: 100 },
    { gioco: "navale", livello: "argento",  icona: "🧠", nome: "Occhio Tattico",           desc: "Batti il bot Medio 3 volte",                                  stat: "vittorieMedio",       meta: 3 },
    { gioco: "navale", livello: "argento",  icona: "🌐", nome: "Duello Online",            desc: "Vinci 5 partite online",                                     stat: "vittorieOnline",      meta: 5 },
    { gioco: "navale", livello: "oro",      icona: "🏴‍☠️", nome: "Ammiraglio",               desc: "Vinci 25 partite",                                            stat: "vittorie",            meta: 25 },
    { gioco: "navale", livello: "oro",      icona: "🤖", nome: "Sfida Difficile",          desc: "Batti il bot Difficile",                                     stat: "vittorieDifficile",   meta: 1 },
    { gioco: "navale", livello: "oro",      icona: "🌊", nome: "Mare di Colpi",            desc: "Spara 500 volte in tutto",                                   stat: "colpi",               meta: 500 },
    { gioco: "navale", livello: "oro",      icona: "🏆", nome: "Capitano di Rete",         desc: "Vinci 15 partite online",                                    stat: "vittorieOnline",      meta: 15 },
    { gioco: "navale", livello: "diamante", icona: "💎", nome: "Lupo di Mare",              desc: "Batti il bot Difficile 3 volte di fila",                      stat: "serieDifficileMax",   meta: 3 },
    { gioco: "navale", livello: "diamante", icona: "⚡", nome: "Tiro dopo Tiro",           desc: "Colpisci 5 caselle di nave di fila",                         stat: "serieColpiMax",       meta: 5 },
    { gioco: "navale", livello: "diamante", icona: "👑", nome: "Dominio Online",           desc: "Vinci 5 partite online di fila",                             stat: "serieOnlineMax",      meta: 5 },

    // ---------- Poker ----------
    { gioco: "poker", livello: "bronzo",   icona: "🪑", nome: "Una Mano al Tavolo",     desc: "Partecipa alla tua prima mano",                              stat: "maniGiocate",             meta: 1 },
    { gioco: "poker", livello: "bronzo",   icona: "🃏", nome: "Carte Scoperte",         desc: "Vinci una mano arrivando a mostrare le carte",               stat: "maniVinteShowdown",       meta: 1 },
    { gioco: "poker", livello: "bronzo",   icona: "📈", nome: "Alzo la Puntata",        desc: "Fai il tuo primo rilancio",                                  stat: "rilanci",                 meta: 1 },
    { gioco: "poker", livello: "bronzo",   icona: "🔄", nome: "Cambio di Piano",        desc: "Cambia almeno una carta nel Poker all'italiana",            stat: "carteCambiate",           meta: 1 },
    { gioco: "poker", livello: "bronzo",   icona: "🦊", nome: "Tutti a Terra",          desc: "Vinci una mano facendo lasciare gli avversari",             stat: "maniVinteSenzaShowdown",  meta: 1 },
    { gioco: "poker", livello: "bronzo",   icona: "🌐", nome: "Primo Tavolo Online",    desc: "Gioca una mano online con almeno un'altra persona",         stat: "maniOnline",              meta: 1 },
    { gioco: "poker", livello: "bronzo",   icona: "🇮🇹", nome: "Prima Mano Italiana",    desc: "Partecipa alla tua prima mano di Poker all'italiana",      stat: "maniItaliane",            meta: 1 },
    { gioco: "poker", livello: "bronzo",   icona: "♣️", nome: "Buona la Prima",          desc: "Vinci la tua prima mano di Texas Hold'em",                 stat: "vittorieTexas",            meta: 1 },
    { gioco: "poker", livello: "argento",  icona: "🔟", nome: "Dieci Mani",             desc: "Partecipa a 10 mani",                                       stat: "maniGiocate",             meta: 10 },
    { gioco: "poker", livello: "argento",  icona: "🎭", nome: "Showdown Ricorrente",    desc: "Vinci 10 mani mostrando le carte",                           stat: "maniVinteShowdown",       meta: 10 },
    { gioco: "poker", livello: "argento",  icona: "✌️", nome: "Doppia Soddisfazione",   desc: "Vinci 3 mani con una doppia coppia",                         stat: "vittorieDoppia",          meta: 3 },
    { gioco: "poker", livello: "argento",  icona: "🗣️", nome: "Parola al Rilancio",     desc: "Vinci 3 mani dopo aver rilanciato",                          stat: "vittorieRilancio",        meta: 3 },
    { gioco: "poker", livello: "argento",  icona: "🇮🇹", nome: "Mano Rinnovata",        desc: "Vinci 3 mani dopo aver cambiato carte all'italiana",         stat: "vittorieCambio",          meta: 3 },
    { gioco: "poker", livello: "argento",  icona: "👥", nome: "Tavolo in Compagnia",   desc: "Partecipa a 10 mani online contro altre persone",           stat: "maniOnline",              meta: 10 },
    { gioco: "poker", livello: "argento",  icona: "🇺🇸", nome: "Texas in Crescita",      desc: "Vinci 5 mani di Texas Hold'em",                             stat: "vittorieTexas",            meta: 5 },
    { gioco: "poker", livello: "argento",  icona: "🔁", nome: "Tradizione Vincente",    desc: "Vinci 5 mani di Poker all'italiana",                       stat: "vittorieItaliana",         meta: 5 },
    { gioco: "poker", livello: "oro",      icona: "🦾", nome: "Bot non Molla",         desc: "Vinci 10 mani contro bot a difficoltà Difficile",           stat: "vittorieDifficile",       meta: 10 },
    { gioco: "poker", livello: "oro",      icona: "🤝", nome: "Amici al Piattone",      desc: "Vinci 10 mani online contro altre persone",                 stat: "vittorieOnline",          meta: 10 },
    { gioco: "poker", livello: "oro",      icona: "🧠", nome: "Tris o Meglio",          desc: "Vinci 10 showdown con tris o una mano più forte",            stat: "vittorieTrisPlus",        meta: 10 },
    { gioco: "poker", livello: "oro",      icona: "🏰", nome: "Castello di Carte",      desc: "Vinci allo showdown con un full, un poker o una scala colore", stat: "vittorieFullPlus",      meta: 1 },
    { gioco: "poker", livello: "oro",      icona: "🏅", nome: "Re del Tavolo",          desc: "Vinci 50 mani mostrando le carte",                           stat: "maniVinteShowdown",       meta: 50 },
    { gioco: "poker", livello: "oro",      icona: "🪜", nome: "Scala Maestra",          desc: "Vinci 5 showdown con una scala",                             stat: "vittorieScala",           meta: 5 },
    { gioco: "poker", livello: "oro",      icona: "🎨", nome: "Colore Vincente",        desc: "Vinci 2 showdown con un colore",                            stat: "vittorieColore",          meta: 2 },
    { gioco: "poker", livello: "oro",      icona: "🃏", nome: "Quattro Uguali",          desc: "Vinci allo showdown con quattro carte dello stesso valore", stat: "vittoriePoker",           meta: 1 },
    { gioco: "poker", livello: "diamante", icona: "⚔️", nome: "Tre di Fila",            desc: "Vinci 3 mani di fila contro i bot Difficili",                stat: "serieDifficileMax",       meta: 3 },
    { gioco: "poker", livello: "diamante", icona: "🔥", nome: "Cinque Online",          desc: "Vinci 5 mani online di fila contro altre persone",          stat: "serieOnlineMax",          meta: 5 },
    { gioco: "poker", livello: "diamante", icona: "♠️", nome: "Poker da Campione",       desc: "Vinci 3 showdown con un poker",                              stat: "vittoriePoker",           meta: 3 },
    { gioco: "poker", livello: "diamante", icona: "🤖", nome: "Bot non ti Ferma",       desc: "Vinci 5 mani di fila contro i bot Difficili",               stat: "serieDifficileMax",       meta: 5 },
    { gioco: "poker", livello: "diamante", icona: "🌍", nome: "Amici di Lungo Corso",   desc: "Vinci 25 mani online contro altre persone",                 stat: "vittorieOnline",          meta: 25 },

    // ---- TABOO ----
    { gioco: "taboo", livello: "bronzo",   icona: "🤐", nome: "Prima Parola",       desc: "Finisci la tua prima partita",                         stat: "partite",                  meta: 1 },
    { gioco: "taboo", livello: "bronzo",   icona: "🎙️", nome: "Prendi la Parola",   desc: "Spiega la tua prima carta alla squadra",              stat: "turniSpiegati",            meta: 1 },
    { gioco: "taboo", livello: "bronzo",   icona: "✅", nome: "Ci Siamo!",           desc: "Fai indovinare una carta alla tua squadra",          stat: "carteIndovinate",          meta: 1 },
    { gioco: "taboo", livello: "bronzo",   icona: "⏭️", nome: "Cambio Carta",        desc: "Passa una carta durante un tuo turno",               stat: "cartePassate",             meta: 1 },
    { gioco: "taboo", livello: "bronzo",   icona: "🚨", nome: "Orecchie Aperte",     desc: "Fai il tuo primo BUZZ alla squadra avversaria",      stat: "buzzFatti",                meta: 1 },
    { gioco: "taboo", livello: "bronzo",   icona: "🏆", nome: "Squadra Vincente",    desc: "Concludi una partita con la tua squadra vincitrice", stat: "vittorie",                 meta: 1 },
    { gioco: "taboo", livello: "argento",  icona: "🎲", nome: "Ci Si Rivede",        desc: "Finisci 5 partite",                                 stat: "partite",                  meta: 5 },
    { gioco: "taboo", livello: "argento",  icona: "🗣️", nome: "Voce del Gruppo",     desc: "Spiega 10 turni alla tua squadra",                  stat: "turniSpiegati",            meta: 10 },
    { gioco: "taboo", livello: "argento",  icona: "💡", nome: "Parole in Fila",      desc: "Fai indovinare 25 carte in tutto",                  stat: "carteIndovinate",          meta: 25 },
    { gioco: "taboo", livello: "argento",  icona: "🛤️", nome: "Piano B",             desc: "Passa 10 carte durante i tuoi turni",               stat: "cartePassate",             meta: 10 },
    { gioco: "taboo", livello: "argento",  icona: "🔔", nome: "Fischietto Pronto",   desc: "Fai 8 BUZZ validi contro la squadra avversaria",    stat: "buzzFatti",                meta: 8 },
    { gioco: "taboo", livello: "oro",      icona: "🥇", nome: "Capitano di Squadra", desc: "Concludi 15 partite con la tua squadra vincitrice", stat: "vittorie",                 meta: 15 },
    { gioco: "taboo", livello: "oro",      icona: "🧠", nome: "Giro di Parole",      desc: "Fai indovinare 100 carte in tutto",                 stat: "carteIndovinate",          meta: 100 },
    { gioco: "taboo", livello: "oro",      icona: "⚡", nome: "Sette di Fila",       desc: "Fai indovinare 7 carte di fila nello stesso turno", stat: "comboCarteMax",            meta: 7 },
    { gioco: "taboo", livello: "oro",      icona: "🌟", nome: "Turno da Ricordare",  desc: "Concludi 15 turni con più indovinate che BUZZ",     stat: "turniPositivi",            meta: 15 },
    { gioco: "taboo", livello: "diamante", icona: "👑", nome: "Re delle Squadre",    desc: "Concludi 25 partite con la tua squadra vincitrice", stat: "vittorie",                 meta: 25 },
    { gioco: "taboo", livello: "diamante", icona: "💥", nome: "Dieci Perfette",      desc: "Fai indovinare 10 carte di fila nello stesso turno",stat: "comboCarteMax",            meta: 10 },
    { gioco: "taboo", livello: "diamante", icona: "🔮", nome: "Intesa Imbattibile",  desc: "Concludi 5 tuoi turni positivi di fila, anche tra partite diverse", stat: "serieTurniPositiviMax", meta: 5 },

    // ---- Palla a Pendolo ----
    { gioco: "pendolo", livello: "bronzo",   icona: "🏁", nome: "Prima Partita",        desc: "Concludi la tua prima partita",                                stat: "partite",                       meta: 1 },
    { gioco: "pendolo", livello: "bronzo",   icona: "🎯", nome: "Prendi la Mira",        desc: "Gioca una partita da lanciatore",                             stat: "partiteLanciatore",             meta: 1 },
    { gioco: "pendolo", livello: "bronzo",   icona: "🏃", nome: "Piedi sulla Trave",     desc: "Gioca una partita sulla trave",                               stat: "partiteTrave",                  meta: 1 },
    { gioco: "pendolo", livello: "bronzo",   icona: "💦", nome: "Primo Tuffo",           desc: "Butta giù un avversario in una sfida",                       stat: "avversariButtati",              meta: 1 },
    { gioco: "pendolo", livello: "bronzo",   icona: "⤴️", nome: "Salto al Momento",      desc: "Schiva la palla con un salto in una sfida",                   stat: "saltiRiusciti",                 meta: 1 },
    { gioco: "pendolo", livello: "bronzo",   icona: "🏆", nome: "Prima Vittoria",        desc: "Vinci una sfida contro bot non Facili o contro una persona",  stat: "vittorie",                     meta: 1 },
    { gioco: "pendolo", livello: "argento",  icona: "🔟", nome: "Dieci Partite",         desc: "Concludi 10 partite",                                         stat: "partite",                      meta: 10 },
    { gioco: "pendolo", livello: "argento",  icona: "🎳", nome: "Caduta dopo Caduta",    desc: "Butta giù 10 avversari in totale nelle sfide",              stat: "avversariButtati",              meta: 10 },
    { gioco: "pendolo", livello: "argento",  icona: "🔥", nome: "Braccio Sicuro",        desc: "Vinci 3 sfide da lanciatore",                                 stat: "vittorieLanciatore",            meta: 3 },
    { gioco: "pendolo", livello: "argento",  icona: "⚖️", nome: "Equilibrio d'Argento",  desc: "Vinci 3 sfide sulla trave",                                   stat: "vittorieTrave",                 meta: 3 },
    { gioco: "pendolo", livello: "argento",  icona: "🌐", nome: "Pendolo in Compagnia", desc: "Vinci 3 partite online contro almeno una persona",           stat: "vittorieOnline",                meta: 3 },
    { gioco: "pendolo", livello: "oro",      icona: "📅", nome: "Serate sul Pendolo",   desc: "Concludi 25 partite",                                         stat: "partite",                      meta: 25 },
    { gioco: "pendolo", livello: "oro",      icona: "🎪", nome: "Lanciatore Esperto",    desc: "Vinci 10 sfide da lanciatore",                                stat: "vittorieLanciatore",           meta: 10 },
    { gioco: "pendolo", livello: "oro",      icona: "🦾", nome: "Bot in Acqua",         desc: "Batti 3 volte il bot Difficile giocando da lanciatore",     stat: "vittorieLanciatoreDifficile",   meta: 3 },
    { gioco: "pendolo", livello: "oro",      icona: "🛡️", nome: "Sempre in Piedi",      desc: "Resisti al bot Difficile sulla trave",                      stat: "vittorieTraveDifficile",        meta: 1 },
    { gioco: "pendolo", livello: "diamante", icona: "⚡", nome: "Lancio Lampo",          desc: "Batti il bot Difficile buttando giù tutti in 10 secondi",  stat: "triplettaDifficileVeloce",      meta: 1 },
    { gioco: "pendolo", livello: "diamante", icona: "🧿", nome: "Mira da Campione",      desc: "Batti 20 volte il bot Difficile da lanciatore",           stat: "vittorieLanciatoreDifficile",   meta: 20 },
    { gioco: "pendolo", livello: "diamante", icona: "🌊", nome: "Trave Impossibile",     desc: "Resisti 3 volte al bot Difficile sulla trave",            stat: "vittorieTraveDifficile",        meta: 3 },

    // ---- La Ruota della Fortuna ----
    { gioco: "ruota", livello: "bronzo",   icona: "🎡", nome: "Dieci Giri",          desc: "Gira la ruota 10 volte",                                      stat: "giri",                          meta: 10 },
    { gioco: "ruota", livello: "bronzo",   icona: "🅰️", nome: "Una Vocale alla Volta",desc: "Scopri 3 vocali comprate in modalità Sfida",                  stat: "vocaliIndovinate",              meta: 3 },
    { gioco: "ruota", livello: "bronzo",   icona: "🔤", nome: "Consonante Fortunata",desc: "Indovina 10 consonanti in modalità Sfida",                    stat: "consonantiIndovinate",          meta: 10 },
    { gioco: "ruota", livello: "bronzo",   icona: "💡", nome: "La Frase è Mia",       desc: "Risolvi una frase in modalità Sfida",                         stat: "frasiRisolte",                  meta: 1 },
    { gioco: "ruota", livello: "bronzo",   icona: "🏅", nome: "Vittoria in Sfida",    desc: "Vinci una partita contro il Bot Medio o Difficile, oppure contro persone", stat: "vittorieSfida", meta: 1 },
    { gioco: "ruota", livello: "bronzo",   icona: "🎤", nome: "Al Microfono",         desc: "Concludi la tua prima partita",                              stat: "partite",                       meta: 1 },
    { gioco: "ruota", livello: "argento",  icona: "🔟", nome: "Dieci Puntate",        desc: "Concludi 10 partite",                                         stat: "partite",                       meta: 10 },
    { gioco: "ruota", livello: "argento",  icona: "🧩", nome: "Frasi Svelate",        desc: "Risolvi 10 frasi in modalità Sfida",                          stat: "frasiRisolte",                  meta: 10 },
    { gioco: "ruota", livello: "argento",  icona: "🎯", nome: "Occhio alle Lettere",  desc: "Indovina 50 consonanti in modalità Sfida",                    stat: "consonantiIndovinate",          meta: 50 },
    { gioco: "ruota", livello: "argento",  icona: "🥈", nome: "Cinque Trionfi",       desc: "Vinci 5 partite in modalità Sfida",                           stat: "vittorieSfida",                 meta: 5 },
    { gioco: "ruota", livello: "argento",  icona: "🧠", nome: "Avanti il Prossimo",   desc: "Batti Bot e gli altri bot di bravura Media 3 volte",         stat: "vittorieMedio",                 meta: 3 },
    { gioco: "ruota", livello: "oro",      icona: "📅", nome: "Ruota di Serate",      desc: "Concludi 25 partite",                                         stat: "partite",                       meta: 25 },
    { gioco: "ruota", livello: "oro",      icona: "📣", nome: "Voce da Campione",     desc: "Risolvi 30 frasi in modalità Sfida",                          stat: "frasiRisolte",                  meta: 30 },
    { gioco: "ruota", livello: "oro",      icona: "💰", nome: "Manche da 5.000",      desc: "Vinci 3 manche con almeno 5.000 punti ciascuna",             stat: "mancheDa5000",                  meta: 3 },
    { gioco: "ruota", livello: "oro",      icona: "🤖", nome: "Bot al Tappeto",      desc: "Batti i bot di bravura Difficile",                            stat: "vittorieDifficile",             meta: 1 },
    { gioco: "ruota", livello: "diamante", icona: "👑", nome: "Re della Ruota",       desc: "Vinci 20 partite in modalità Sfida",                          stat: "vittorieSfida",                 meta: 20 },
    { gioco: "ruota", livello: "diamante", icona: "🛡️", nome: "Senza Bancarotta",     desc: "Batti i bot Difficili senza mai fare Bancarotta",            stat: "vittorieDifficileSenzaBancarotta", meta: 1 },
    { gioco: "ruota", livello: "diamante", icona: "💎", nome: "Partita Perfetta",     desc: "Batti i bot Difficili vincendo tutte le manche di una partita da almeno 3 manche", stat: "vittorieDifficileTutteLeManche", meta: 1 },

    // ---- L'Asta ----
    { gioco: "asta", livello: "bronzo",   icona: "🔨", nome: "Prima Asta",             desc: "Concludi la tua prima partita",                              stat: "partite",         meta: 1 },
    { gioco: "asta", livello: "bronzo",   icona: "🏆", nome: "Al Primo Posto",         desc: "Vinci una partita",                                           stat: "vinte",            meta: 1 },
    { gioco: "asta", livello: "bronzo",   icona: "🎒", nome: "Kit in Costruzione",     desc: "Gioca una partita dei Temi classici",                         stat: "partiteTemi",      meta: 1 },
    { gioco: "asta", livello: "bronzo",   icona: "⚽", nome: "Rosa al Completo",       desc: "Gioca una partita di Mini asta Fantacalcio",                  stat: "partiteFanta",     meta: 1 },
    { gioco: "asta", livello: "bronzo",   icona: "💰", nome: "La Prima Aggiudicazione",desc: "Vinci una carta con un'offerta",                               stat: "asteVinte",        meta: 1 },
    { gioco: "asta", livello: "bronzo",   icona: "⭐", nome: "Pioggia di Stelle",      desc: "Ricevi almeno 5 stelle in totale",                            stat: "stelleRicevute",   meta: 5 },
    { gioco: "asta", livello: "argento",  icona: "🔟", nome: "Dieci Serate",           desc: "Concludi 10 partite",                                         stat: "partite",          meta: 10 },
    { gioco: "asta", livello: "argento",  icona: "🥈", nome: "Cinque Vittorie",        desc: "Vinci 5 partite",                                             stat: "vinte",            meta: 5 },
    { gioco: "asta", livello: "argento",  icona: "🛎️", nome: "Banco Battuto",          desc: "Aggiudicati 20 carte con le tue offerte",                     stat: "asteVinte",        meta: 20 },
    { gioco: "asta", livello: "argento",  icona: "🌐", nome: "Tavolo Online",          desc: "Concludi 5 partite online",                                   stat: "partiteOnline",    meta: 5 },
    { gioco: "asta", livello: "argento",  icona: "🪙", nome: "Portafoglio Leggero",    desc: "Spendi 100 crediti nelle aste",                               stat: "creditiSpesi",     meta: 100 },
    { gioco: "asta", livello: "oro",      icona: "🎒", nome: "Maestro dei Temi",       desc: "Vinci 5 partite dei Temi classici",                          stat: "vinteTemi",        meta: 5 },
    { gioco: "asta", livello: "oro",      icona: "⚽", nome: "Re del Fantacalcio",     desc: "Vinci 5 partite di Mini asta Fantacalcio",                   stat: "vinteFanta",       meta: 5 },
    { gioco: "asta", livello: "oro",      icona: "🤝", nome: "Compagnia Vincente",     desc: "Vinci 10 partite online",                                    stat: "vinteOnline",      meta: 10 },
    { gioco: "asta", livello: "oro",      icona: "📣", nome: "Rilancio dopo Rilancio", desc: "Aggiudicati 50 carte con le tue offerte",                    stat: "asteVinte",        meta: 50 },
    { gioco: "asta", livello: "oro",      icona: "🌟", nome: "Kit da Applausi",        desc: "Ricevi 50 stelle in totale",                                 stat: "stelleRicevute",   meta: 50 },
    { gioco: "asta", livello: "diamante", icona: "💎", nome: "Presenza Costante",      desc: "Concludi 50 partite",                                         stat: "partite",          meta: 50 },
    { gioco: "asta", livello: "diamante", icona: "👑", nome: "Leggenda della Stanza",  desc: "Vinci 20 partite online",                                    stat: "vinteOnline",      meta: 20 },
    { gioco: "asta", livello: "diamante", icona: "⚡", nome: "Re del Martello",        desc: "Aggiudicati 100 carte con le tue offerte",                   stat: "asteVinte",        meta: 100 },

    // ---- NOMI, COSE E CITTÀ ----
    { gioco: "nomicose", livello: "bronzo",   icona: "✍️", nome: "Prima Matita",       desc: "Concludi la tua prima partita",                              stat: "partite",       meta: 1 },
    { gioco: "nomicose", livello: "bronzo",   icona: "🔤", nome: "Parola Valida",      desc: "Fai approvare la tua prima parola",                        stat: "paroleValide",  meta: 1 },
    { gioco: "nomicose", livello: "bronzo",   icona: "📋", nome: "Caselle Piene",      desc: "Completa tutte le categorie in un giro",                   stat: "giriCompleti",  meta: 1 },
    { gioco: "nomicose", livello: "bronzo",   icona: "🌐", nome: "Al Tavolo Online",   desc: "Concludi una partita online",                              stat: "partiteOnline", meta: 1 },
    { gioco: "nomicose", livello: "bronzo",   icona: "🏅", nome: "Prima Vittoria",     desc: "Vinci una partita",                                        stat: "vinte",         meta: 1 },
    { gioco: "nomicose", livello: "bronzo",   icona: "🤝", nome: "Stessa Risposta",    desc: "Scrivi 3 parole valide uguali a quelle di un altro giocatore", stat: "paroleDoppie", meta: 3 },
    { gioco: "nomicose", livello: "argento",  icona: "🔟", nome: "Serata di Parole",   desc: "Concludi 10 partite",                                      stat: "partite",       meta: 10 },
    { gioco: "nomicose", livello: "argento",  icona: "🖋️", nome: "Penna Sciolta",      desc: "Fai approvare 50 parole",                                  stat: "paroleValide",  meta: 50 },
    { gioco: "nomicose", livello: "argento",  icona: "🔁", nome: "Menti Gemelle",      desc: "Scrivi 15 parole valide uguali a quelle di un altro",        stat: "paroleDoppie", meta: 15 },
    { gioco: "nomicose", livello: "argento",  icona: "📱", nome: "Amici in Rete",      desc: "Concludi 8 partite online",                                stat: "partiteOnline", meta: 8 },
    { gioco: "nomicose", livello: "argento",  icona: "🥇", nome: "Cinque Vittorie",    desc: "Vinci 5 partite",                                          stat: "vinte",         meta: 5 },
    { gioco: "nomicose", livello: "oro",      icona: "📚", nome: "Vocabolario Vivente", desc: "Fai approvare 150 parole",                                stat: "paroleValide",  meta: 150 },
    { gioco: "nomicose", livello: "oro",      icona: "🧠", nome: "Giro Senza Macchie", desc: "Fai approvare tutte le parole in 10 giri",                stat: "giriPerfetti",  meta: 10 },
    { gioco: "nomicose", livello: "oro",      icona: "🎉", nome: "Serate in Compagnia", desc: "Concludi 25 partite",                                     stat: "partite",       meta: 25 },
    { gioco: "nomicose", livello: "oro",      icona: "🏆", nome: "Campione del Gruppo", desc: "Vinci 10 partite",                                        stat: "vinte",         meta: 10 },
    { gioco: "nomicose", livello: "oro",      icona: "🛜", nome: "Campione Connesso",  desc: "Vinci 10 partite online",                                 stat: "vinteOnline",   meta: 10 },
    { gioco: "nomicose", livello: "diamante", icona: "💎", nome: "Grande Lessico",     desc: "Fai approvare 300 parole",                                stat: "paroleValide",  meta: 300 },
    { gioco: "nomicose", livello: "diamante", icona: "👑", nome: "Re delle Parole",    desc: "Vinci 20 partite",                                        stat: "vinte",         meta: 20 },
    { gioco: "nomicose", livello: "diamante", icona: "✨", nome: "Giri da Manuale",    desc: "Fai approvare tutte le parole in 25 giri",                stat: "giriPerfetti",  meta: 25 },

    // ---- La Patata Bollente ----
    { gioco: "patata", livello: "bronzo",   icona: "💣", nome: "Si Comincia",         desc: "Concludi la tua prima partita",                                      stat: "partite",             meta: 1 },
    { gioco: "patata", livello: "bronzo",   icona: "🤲", nome: "Bomba in Mano",       desc: "Ricevi la bomba 5 volte",                                             stat: "bombeRicevute",       meta: 5 },
    { gioco: "patata", livello: "bronzo",   icona: "🏃", nome: "Passa la Patata",     desc: "Passa la bomba 5 volte",                                             stat: "passaggi",            meta: 5 },
    { gioco: "patata", livello: "bronzo",   icona: "🛡️", nome: "Ancora in Gara",      desc: "Sopravvivi a 3 esplosioni",                                          stat: "roundSopravvissuti",  meta: 3 },
    { gioco: "patata", livello: "bronzo",   icona: "🗳️", nome: "Scelta di Gruppo",    desc: "Vota una categoria in una partita online",                           stat: "votiCategoria",       meta: 1 },
    { gioco: "patata", livello: "bronzo",   icona: "📱", nome: "Prima Bomba Online",  desc: "Concludi una partita online",                                       stat: "partiteOnline",       meta: 1 },
    { gioco: "patata", livello: "argento",  icona: "🔟", nome: "Serate Esplosive",    desc: "Concludi 10 partite",                                                stat: "partite",             meta: 10 },
    { gioco: "patata", livello: "argento",  icona: "💨", nome: "Mani Veloci",         desc: "Passa la bomba 30 volte",                                           stat: "passaggi",            meta: 30 },
    { gioco: "patata", livello: "argento",  icona: "↩️", nome: "Non Era Valida",      desc: "Rimanda indietro la bomba 5 volte",                                 stat: "rimandi",             meta: 5 },
    { gioco: "patata", livello: "argento",  icona: "🧍", nome: "Duro a Morire",       desc: "Sopravvivi a 25 esplosioni",                                        stat: "roundSopravvissuti",  meta: 25 },
    { gioco: "patata", livello: "argento",  icona: "🎲", nome: "La Ruota Decide",     desc: "Gioca 3 partite con una categoria a sorpresa",                      stat: "partiteSorpresa",     meta: 3 },
    { gioco: "patata", livello: "argento",  icona: "🏆", nome: "Ultimo Rimasto",      desc: "Vinci la tua prima partita online (almeno in 3)",                    stat: "vittorie",            meta: 1 },
    { gioco: "patata", livello: "oro",      icona: "⚡", nome: "Passaggi Fulminei",   desc: "Passa la bomba 100 volte",                                          stat: "passaggi",            meta: 100 },
    { gioco: "patata", livello: "oro",      icona: "🌋", nome: "Sopravvissuto",       desc: "Sopravvivi a 60 esplosioni",                                        stat: "roundSopravvissuti",  meta: 60 },
    { gioco: "patata", livello: "oro",      icona: "🌐", nome: "Ultimo Online",       desc: "Vinci 5 partite online (almeno in 3)",                              stat: "vittorieOnline",      meta: 5 },
    { gioco: "patata", livello: "oro",      icona: "🎰", nome: "Amante del Rischio",  desc: "Gioca 10 partite con una categoria a sorpresa",                     stat: "partiteSorpresa",     meta: 10 },
    { gioco: "patata", livello: "diamante", icona: "👑", nome: "Re della Patata",     desc: "Vinci 15 partite online (almeno in 3)",                             stat: "vittorieOnline",      meta: 15 },
    { gioco: "patata", livello: "diamante", icona: "🔥", nome: "Serie Bollente",      desc: "Vinci 3 partite online di fila (almeno in 3)",                      stat: "serieVittorieMax",    meta: 3 },
    { gioco: "patata", livello: "diamante", icona: "💎", nome: "Giro Infinito",       desc: "Passa la bomba 200 volte",                                          stat: "passaggi",            meta: 200 },

    // ---- Sì... però ----
    { gioco: "sipero", livello: "bronzo",   icona: "🤨", nome: "Ci Sono Anch'io",     desc: "Concludi la tua prima partita",                              stat: "partite",          meta: 1 },
    { gioco: "sipero", livello: "bronzo",   icona: "⚖️", nome: "Primo Verdetto",       desc: "Fai da giudice in un round",                                  stat: "roundGiudice",     meta: 1 },
    { gioco: "sipero", livello: "bronzo",   icona: "🟥", nome: "Dalla Parte Giusta",   desc: "Vinci il tuo primo round in squadra",                        stat: "roundVinti",       meta: 1 },
    { gioco: "sipero", livello: "bronzo",   icona: "🟢", nome: "Un Tocco di Paradiso", desc: "Gioca 5 carte Bonus con la tua squadra",                    stat: "carteBonus",       meta: 5 },
    { gioco: "sipero", livello: "bronzo",   icona: "🔴", nome: "Piccolo Disastro",     desc: "Gioca 5 carte Malus con la tua squadra",                    stat: "carteMalus",       meta: 5 },
    { gioco: "sipero", livello: "bronzo",   icona: "🌐", nome: "Prima Stanza",         desc: "Concludi una partita online",                               stat: "partiteOnline",    meta: 1 },
    { gioco: "sipero", livello: "argento",  icona: "🔟", nome: "Serate al Circolo",    desc: "Concludi 10 partite",                                       stat: "partite",          meta: 10 },
    { gioco: "sipero", livello: "argento",  icona: "🎙️", nome: "Giudice Abituale",     desc: "Fai da giudice in 8 round",                                 stat: "roundGiudice",     meta: 8 },
    { gioco: "sipero", livello: "argento",  icona: "🏅", nome: "La Squadra Convince",  desc: "Vinci 15 round in squadra",                                 stat: "roundVinti",       meta: 15 },
    { gioco: "sipero", livello: "argento",  icona: "✨", nome: "Idee Brillanti",       desc: "Gioca 30 carte Bonus con la tua squadra",                   stat: "carteBonus",       meta: 30 },
    { gioco: "sipero", livello: "argento",  icona: "💥", nome: "Malus a Raffica",      desc: "Gioca 30 carte Malus con la tua squadra",                  stat: "carteMalus",       meta: 30 },
    { gioco: "sipero", livello: "oro",      icona: "🏆", nome: "Cinque Vittorie",      desc: "Vinci 5 partite",                                          stat: "vittorie",         meta: 5 },
    { gioco: "sipero", livello: "oro",      icona: "🧑‍⚖️", nome: "Arbitro Esperto",      desc: "Fai da giudice in 20 round",                                stat: "roundGiudice",     meta: 20 },
    { gioco: "sipero", livello: "oro",      icona: "🤝", nome: "Compagni di Avventura",desc: "Vinci 50 round in squadra",                                stat: "roundVinti",       meta: 50 },
    { gioco: "sipero", livello: "oro",      icona: "📡", nome: "Squadra Connessa",     desc: "Vinci 5 partite online facendo parte della squadra scelta", stat: "vittorieOnline",   meta: 5 },
    { gioco: "sipero", livello: "oro",      icona: "🃏", nome: "Scenari Memorabili",   desc: "Gioca 50 carte Bonus con la tua squadra",                  stat: "carteBonus",       meta: 50 },
    { gioco: "sipero", livello: "diamante", icona: "💎", nome: "Venti Serate Online",  desc: "Concludi 20 partite online",                               stat: "partiteOnline",    meta: 20 },
    { gioco: "sipero", livello: "diamante", icona: "🎓", nome: "Giudice di Fiducia",   desc: "Fai da giudice in 50 round",                                stat: "roundGiudice",     meta: 50 },
    { gioco: "sipero", livello: "diamante", icona: "🔥", nome: "Il Verdetto è Tuo",    desc: "Vinci 3 partite di fila (quelle da giudice non interrompono la serie)", stat: "serieVittorieMax", meta: 3 },

    // ---- PAROLA D'ORDINE ----
    { gioco: "ordine", livello: "bronzo",   icona: "🕵️", nome: "Prima Missione",        desc: "Concludi la tua prima partita online",                   stat: "partite",      meta: 1 },
    { gioco: "ordine", livello: "bronzo",   icona: "👑", nome: "Capo per un Giro",      desc: "Dai il tuo primo indizio valido alla squadra",          stat: "indizi",       meta: 1 },
    { gioco: "ordine", livello: "bronzo",   icona: "🔎", nome: "Occhio di Squadra",     desc: "Gira 3 parole della tua squadra",                      stat: "paroleGiuste", meta: 3 },
    { gioco: "ordine", livello: "bronzo",   icona: "🗣️", nome: "Voce al Tabellone",     desc: "Dai 5 indizi validi nel corso delle partite",          stat: "indizi",       meta: 5 },
    { gioco: "ordine", livello: "bronzo",   icona: "🏅", nome: "Prima Vittoria",        desc: "Vinci una partita con la tua squadra",                stat: "vittorie",     meta: 1 },
    { gioco: "ordine", livello: "bronzo",   icona: "⭐", nome: "Parola d'Oro",          desc: "Gira la casella speciale della parola d'oro",          stat: "paroleOro",    meta: 1 },
    { gioco: "ordine", livello: "argento",  icona: "📱", nome: "Serata in Rete",        desc: "Concludi 10 partite online",                           stat: "partiteOnline", meta: 10 },
    { gioco: "ordine", livello: "argento",  icona: "🧩", nome: "Intesa Crescente",      desc: "Gira 25 parole della tua squadra",                    stat: "paroleGiuste", meta: 25 },
    { gioco: "ordine", livello: "argento",  icona: "🎙️", nome: "Indiziere Affidabile", desc: "Dai 15 indizi validi",                                stat: "indizi",       meta: 15 },
    { gioco: "ordine", livello: "argento",  icona: "🥇", nome: "Squadra Affiatata",     desc: "Vinci 5 partite con la tua squadra",                  stat: "vittorie",     meta: 5 },
    { gioco: "ordine", livello: "argento",  icona: "🧢", nome: "Capitano Vincente",     desc: "Vinci 3 partite mentre sei il capo della squadra",    stat: "vittorieCapo", meta: 3 },
    { gioco: "ordine", livello: "oro",      icona: "🗓️", nome: "Amico del Tabellone",  desc: "Concludi 25 partite online",                           stat: "partiteOnline", meta: 25 },
    { gioco: "ordine", livello: "oro",      icona: "🧠", nome: "Mente in Sintonia",     desc: "Gira 100 parole della tua squadra",                   stat: "paroleGiuste", meta: 100 },
    { gioco: "ordine", livello: "oro",      icona: "📣", nome: "Voce Esperta",          desc: "Dai 50 indizi validi",                                stat: "indizi",       meta: 50 },
    { gioco: "ordine", livello: "oro",      icona: "🏆", nome: "Squadra Vincente",      desc: "Vinci 15 partite con la tua squadra",                 stat: "vittorie",     meta: 15 },
    { gioco: "ordine", livello: "oro",      icona: "👑", nome: "Capo che Trascina",    desc: "Vinci 6 partite mentre sei il capo della squadra",     stat: "vittorieCapo", meta: 6 },
    { gioco: "ordine", livello: "diamante", icona: "💎", nome: "Leggenda di Squadra",   desc: "Gira 150 parole della tua squadra",                   stat: "paroleGiuste", meta: 150 },
    { gioco: "ordine", livello: "diamante", icona: "🎖️", nome: "Capitano Leggendario", desc: "Vinci 12 partite da capo della squadra",              stat: "vittorieCapo", meta: 12 },
    { gioco: "ordine", livello: "diamante", icona: "🌟", nome: "Re del Tabellone",      desc: "Vinci 25 partite con la tua squadra",                 stat: "vittorie",     meta: 25 },

    // ---- Horto Muso ----
    { gioco: "horto", livello: "bronzo",   icona: "🏇", nome: "Ai Cancelletti",       desc: "Concludi la tua prima corsa",                                      stat: "partite",         meta: 1 },
    { gioco: "horto", livello: "bronzo",   icona: "🐎", nome: "Cinque Corse",          desc: "Concludi 5 corse",                                                stat: "partite",         meta: 5 },
    { gioco: "horto", livello: "bronzo",   icona: "🥉", nome: "Sul Podio",              desc: "Arriva tra i primi 3 in una corsa con almeno 4 cavalli, equilibrata o online", stat: "podi", meta: 1 },
    { gioco: "horto", livello: "bronzo",   icona: "🏁", nome: "Primo al Traguardo",    desc: "Vinci una corsa a difficoltà Media o Difficile, o online contro una persona", stat: "vittorie", meta: 1 },
    { gioco: "horto", livello: "bronzo",   icona: "🎖️", nome: "Tre Medaglie",          desc: "Arriva tra i primi 3 in 5 corse con almeno 4 cavalli, equilibrate o online", stat: "podi", meta: 5 },
    { gioco: "horto", livello: "bronzo",   icona: "⚡", nome: "Quattro in Pista",      desc: "Vinci una corsa con almeno 4 cavalli, senza scegliere Facile",   stat: "vinte4",           meta: 1 },
    { gioco: "horto", livello: "argento",  icona: "📅", nome: "Quindici Partenze",     desc: "Concludi 15 corse",                                               stat: "partite",         meta: 15 },
    { gioco: "horto", livello: "argento",  icona: "🥈", nome: "Podio Abituale",        desc: "Arriva tra i primi 3 in 15 corse con almeno 4 cavalli, equilibrate o online", stat: "podi", meta: 15 },
    { gioco: "horto", livello: "argento",  icona: "🏆", nome: "Cinque Vittorie",       desc: "Vinci 5 corse equilibrate o online",                            stat: "vittorie",        meta: 5 },
    { gioco: "horto", livello: "argento",  icona: "🧠", nome: "Bot di Buon Passo",     desc: "Batti i bot a difficoltà Media",                                stat: "vinteMedio",      meta: 1 },
    { gioco: "horto", livello: "argento",  icona: "🌐", nome: "Sfida in Compagnia",   desc: "Vinci una corsa online contro almeno una persona",               stat: "vinteOnline",     meta: 1 },
    { gioco: "horto", livello: "argento",  icona: "🐴", nome: "Otto al Via",           desc: "Vinci con 8 cavalli in gara, senza scegliere Facile",            stat: "vinte8NonFacile", meta: 1 },
    { gioco: "horto", livello: "oro",      icona: "🏟️", nome: "Stagione Completa",     desc: "Concludi 30 corse",                                               stat: "partite",         meta: 30 },
    { gioco: "horto", livello: "oro",      icona: "🥇", nome: "Quindici Traguardi",    desc: "Vinci 15 corse equilibrate o online",                           stat: "vittorie",        meta: 15 },
    { gioco: "horto", livello: "oro",      icona: "⚖️", nome: "Regolarità da Campione",desc: "Batti i bot a difficoltà Media 5 volte",                       stat: "vinteMedio",      meta: 5 },
    { gioco: "horto", livello: "oro",      icona: "🦾", nome: "Il Bot Difficile",      desc: "Batti i bot a difficoltà Difficile",                           stat: "vinteDifficile",  meta: 1 },
    { gioco: "horto", livello: "oro",      icona: "🤝", nome: "Rivincite Online",      desc: "Vinci 5 corse online contro almeno una persona",                stat: "vinteOnline",     meta: 5 },
    { gioco: "horto", livello: "diamante", icona: "👑", nome: "Cinque Volte Difficile",desc: "Batti i bot a difficoltà Difficile 5 volte",                    stat: "vinteDifficile",  meta: 5 },
    { gioco: "horto", livello: "diamante", icona: "💎", nome: "Otto Frecce",           desc: "Vinci 10 corse equilibrate con 8 cavalli",                      stat: "vinte8NonFacile", meta: 10 },
    { gioco: "horto", livello: "diamante", icona: "🌟", nome: "Leggenda dell'Ippodromo",desc: "Vinci 30 corse equilibrate o online",                          stat: "vittorie",        meta: 30 },

    // ---- Scarabocchio ----
    { gioco: "scarabocchio", livello: "bronzo",   icona: "🎨", nome: "Prima Partita",          desc: "Concludi la tua prima partita",                                                stat: "partite",                    meta: 1 },
    { gioco: "scarabocchio", livello: "bronzo",   icona: "✏️", nome: "Matita in Mano",         desc: "Disegna la tua prima parola",                                                   stat: "turniDisegnati",             meta: 1 },
    { gioco: "scarabocchio", livello: "bronzo",   icona: "💡", nome: "Prima Intuizione",       desc: "Indovina una parola",                                                           stat: "indovinate",                 meta: 1 },
    { gioco: "scarabocchio", livello: "bronzo",   icona: "🔥", nome: "Ci Sei Quasi",           desc: "Vai vicino alla parola con una risposta",                                       stat: "quasi",                      meta: 1 },
    { gioco: "scarabocchio", livello: "bronzo",   icona: "⚡", nome: "Risposta al Volo",       desc: "Indovina per primo in un turno",                                                stat: "indovinatePrimo",            meta: 1 },
    { gioco: "scarabocchio", livello: "bronzo",   icona: "👏", nome: "Disegno Apprezzato",     desc: "Fai indovinare una parola mentre disegni",                                      stat: "disegniIndovinati",          meta: 1 },
    { gioco: "scarabocchio", livello: "argento",  icona: "🔟", nome: "Serata tra Amici",       desc: "Concludi 10 partite",                                                           stat: "partite",                    meta: 10 },
    { gioco: "scarabocchio", livello: "argento",  icona: "🖌️", nome: "Matita Instancabile",    desc: "Disegna 20 parole",                                                             stat: "turniDisegnati",             meta: 20 },
    { gioco: "scarabocchio", livello: "argento",  icona: "🧠", nome: "Occhio di Falco",        desc: "Indovina 25 parole",                                                            stat: "indovinate",                 meta: 25 },
    { gioco: "scarabocchio", livello: "argento",  icona: "👥", nome: "Disegno Corale",         desc: "Fai indovinare la stessa parola ad almeno 3 persone, per 3 volte",                stat: "disegniConTreIndovinatori", meta: 3 },
    { gioco: "scarabocchio", livello: "argento",  icona: "🦉", nome: "Parole Coraggiose",      desc: "Indovina 5 parole difficili",                                                   stat: "indovinateDifficili",       meta: 5 },
    { gioco: "scarabocchio", livello: "oro",      icona: "🏆", nome: "Campione di Scarabocchio",desc: "Arriva al primo posto in 3 partite",                                           stat: "vittorie",                  meta: 3 },
    { gioco: "scarabocchio", livello: "oro",      icona: "🚀", nome: "Mani Veloci",            desc: "Indovina 10 parole quando resta almeno il 60% del tempo",                       stat: "indovinateVeloci",          meta: 10 },
    { gioco: "scarabocchio", livello: "oro",      icona: "🌟", nome: "Artista Apprezzato",     desc: "Fai indovinare 20 parole mentre disegni",                                      stat: "disegniIndovinati",         meta: 20 },
    { gioco: "scarabocchio", livello: "oro",      icona: "🐉", nome: "Matita Temeraria",       desc: "Disegna 10 parole difficili scelte da te",                                      stat: "paroleDifficiliDisegnate", meta: 10 },
    { gioco: "scarabocchio", livello: "oro",      icona: "💰", nome: "Pioggia di Punti",       desc: "Ottieni 1.000 punti indovinando parole",                                       stat: "puntiIndovinando",         meta: 1000 },
    { gioco: "scarabocchio", livello: "oro",      icona: "🧩", nome: "Parole Dure, Vittorie",  desc: "Vinci 3 partite dopo che è stata disegnata almeno una parola difficile",        stat: "vittorieDifficili",        meta: 3 },
    { gioco: "scarabocchio", livello: "diamante", icona: "👑", nome: "Maestro del Tavolo",     desc: "Arriva al primo posto in 10 partite",                                          stat: "vittorie",                  meta: 10 },
    { gioco: "scarabocchio", livello: "diamante", icona: "🌐", nome: "Tutta la Stanza",        desc: "Vinci 3 partite con almeno 6 giocatori rimasti",                                stat: "vittorieGruppo",            meta: 3 },
    { gioco: "scarabocchio", livello: "diamante", icona: "💎", nome: "Maestro delle Parole",   desc: "Fai indovinare 10 parole difficili mentre disegni",                                                  stat: "paroleDifficiliIndovinate", meta: 10 },
    { gioco: "lunghezza", livello: "bronzo",  icona: "📡", nome: "Prima Onda",         desc: "Finisci la tua prima partita",                        stat: "partite",         meta: 1 },
    { gioco: "lunghezza", livello: "bronzo",  icona: "🎯", nome: "Centro!",            desc: "Fai centro (4 punti) indovinando",                    stat: "centri",          meta: 1 },
    { gioco: "lunghezza", livello: "bronzo",  icona: "🔮", nome: "Sensitivo",          desc: "Fai il sensitivo per la prima volta",                 stat: "turniSensitivo",  meta: 1 },
    { gioco: "lunghezza", livello: "argento", icona: "⬅️", nome: "Scommettitore",      desc: "Vinci 10 scommesse a sinistra o a destra",            stat: "scommesseGiuste", meta: 10 },
    { gioco: "lunghezza", livello: "argento", icona: "🧠", nome: "Leggi nel Pensiero", desc: "Da sensitivo, fai fare centro 5 volte",               stat: "centriDati",      meta: 5 },
    { gioco: "lunghezza", livello: "argento", icona: "📶", nome: "Stessa Frequenza",   desc: "Finisci 10 partite",                                  stat: "partite",         meta: 10 },
    { gioco: "lunghezza", livello: "oro",     icona: "🏆", nome: "Campioni d'Onda",    desc: "Vinci 15 partite",                                    stat: "vittorie",        meta: 15 },
    { gioco: "lunghezza", livello: "oro",     icona: "🔭", nome: "Occhio di Lince",    desc: "Fai centro 40 volte",                                 stat: "centri",          meta: 40 },
  ];

  function valoreStat(prof, gioco, chiave) {
    var st = (window.SGNube && SGNube.statGioco) ? SGNube.statGioco(gioco) : {};
    var v = (st && st[chiave]) || 0;
    // il record fiches tiene conto anche del saldo attuale (es. dopo un bonus)
    if (chiave === "recordFiches") { var ora = prof.coins || 0; if (ora > v) v = ora; }   // fiches = Speed Coins
    return v;
  }
  function trofeiDi(gid) { return TROFEI.filter(function (t) { return t.gioco === gid; }); }
  function trofeoFatto(prof, t) { return valoreStat(prof, t.gioco, t.stat) >= t.meta; }
  function contaTrofei(prof, gid) { var l = trofeiDi(gid), n = 0; l.forEach(function (t) { if (trofeoFatto(prof, t)) n++; }); return { fatti: n, tot: l.length }; }
  function platinato(prof, gid) { var c = contaTrofei(prof, gid); return c.tot > 0 && c.fatti === c.tot; }
  var ICONE_LIV = { bronzo: "🥉", argento: "🥈", oro: "🥇", diamante: "💎" };
  function perLivello(prof, gid) {   // i trofei di un gioco divisi per tipo: { bronzo: { fatti, tot }, ... }
    var r = {}; trofeiDi(gid).forEach(function (t) { var p = r[t.livello] || (r[t.livello] = { fatti: 0, tot: 0 }); p.tot++; if (trofeoFatto(prof, t)) p.fatti++; });
    return r;
  }
  function chipLivelli(prof, gid) {   // la riga "🥉 3/9  🥈 1/6 …" sotto ogni gioco
    var pl = perLivello(prof, gid), riga = el("div", { class: "sg-livelli" });
    ORDINE_LIV.forEach(function (l) { var p = pl[l]; if (!p) return; riga.appendChild(el("span", { class: "sg-liv " + LIVELLI[l].cls + (p.fatti === p.tot ? " pieno" : ""), html: ICONE_LIV[l] + " <b>" + p.fatti + "</b>/" + p.tot })); });
    if (platinato(prof, gid)) riga.appendChild(el("span", { class: "sg-liv tl-platino pieno", html: "💠 <b>Platino</b>" }));
    return riga;
  }

  // schermata principale: l'elenco di TUTTI i giochi, ognuno coi suoi trofei dentro
  function schermataSfide() {
    var s = schermata({ icona: "🏆", titolo: "Trofei", sotto: "Colleziona i trofei di ogni gioco", indietro: tornaHome }); s._menu = "trofei";
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
          c.tot ? el("div", { class: "sg-barra" }, [ el("div", { class: "sg-fill", style: "width:" + pct + "%" }) ]) : null,
          c.tot ? chipLivelli(prof, g.id) : null   // quanti trofei per tipo
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
      var pl = perLivello(prof, gid), celle = [];   // in cima: quanti trofei per tipo, come nella schermata di tutti i giochi
      ORDINE_LIV.forEach(function (l) { var p = pl[l] || { fatti: 0, tot: 0 }; celle.push(el("div", { class: "sm-liv " + LIVELLI[l].cls }, [ el("div", { class: "sm-ico", text: ICONE_LIV[l] }), el("div", { class: "sm-num", html: "<b>" + p.fatti + "</b>/" + p.tot }), el("div", { class: "sm-nome", text: LIVELLI[l].nome }) ])); });
      celle.push(el("div", { class: "sm-liv tl-platino" }, [ el("div", { class: "sm-ico", text: "💠" }), el("div", { class: "sm-num", html: "<b>" + (plat ? 1 : 0) + "</b>/1" }), el("div", { class: "sm-nome", text: "Platino" }) ]));
      s._contenuto.appendChild(el("div", { class: "sfide-sommario sm-gioco" }, [ el("div", { class: "sm-livelli" }, celle) ]));
      ORDINE_LIV.forEach(function (liv) {
        var gruppo = lista.filter(function (t) { return t.livello === liv; });
        if (!gruppo.length) return;
        s._contenuto.appendChild(el("div", { class: "etichetta", text: ICONE_LIV[liv] + " " + LIVELLI[liv].nome + " · " + (pl[liv] ? pl[liv].fatti : 0) + "/" + gruppo.length }));
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
    var ora = trofeiSbloccati(prof), nuovi = {};
    if (trofeiNoti && trofeiNoti.uid === prof.uid) {
      for (var k in ora) if (!trofeiNoti.set[k]) { codaTrofei.push(ora[k]); nuovi[k] = 1; }
      // il Platino arriva per ultimo, dopo i trofei che l'hanno fatto scattare
      codaTrofei.sort(function (a, b) { return (a.livello === "platino") - (b.livello === "platino"); });
      prossimoAvviso();
    }
    trofeiNoti = { uid: prof.uid, set: ora };
    pubblicaTrofei(prof, ora);
    premiaTrofei(prof, ora, nuovi);
  }
  // ---- i premi dei trofei: ogni trofeo dà XP e Speed Coins secondo il livello, una volta sola per profilo
  //      (anche quelli presi prima che esistessero i premi: arrivano tutti insieme in un regalo) ----
  var PREMI_TROFEI = { bronzo: { xp: 100, monete: 100 }, argento: { xp: 250, monete: 250 }, oro: { xp: 600, monete: 600 },
    diamante: { xp: 1500, monete: 1500 }, platino: { xp: 3000, monete: 3000 } };
  function premioTesto(livello) { var p = PREMI_TROFEI[livello]; return p ? " · +" + cifre(p.xp) + " XP · +" + cifre(p.monete) + " 🪙" : ""; }
  function chiaveTrofeo(k) { var h = 5381; for (var i = 0; i < k.length; i++) h = (Math.imul(h, 33) ^ k.charCodeAt(i)) >>> 0; return "t" + h.toString(36); }
  function premiaTrofei(prof, ora, inVista) {
    if (!(window.SGNube && SGNube.premiaTrofei && window.SGLivelli)) return;
    var fatti = prof.premiTrofei || {}, chiavi = [], xp = 0, mon = 0, xpN = 0, monN = 0, nascosti = 0;
    for (var k in ora) {
      var c = chiaveTrofeo(k), p = PREMI_TROFEI[ora[k].livello];
      if (!p || fatti[c]) continue;
      chiavi.push(c); xp += p.xp; mon += p.monete;
      if (!inVista[k]) { nascosti++; xpN += p.xp; monN += p.monete; }   // quelli senza il loro avviso (presi prima)
    }
    if (!chiavi.length) return;
    var r = SGNube.premiaTrofei(chiavi, xp, mon); if (!r) return;
    if (nascosti) codaTrofei.push({ tipo: "xp", cls: "tl-oro", icona: "🎁", su: nascosti === 1 ? "Premio di un trofeo" : "Premi dei tuoi " + nascosti + " trofei",
      nome: "+" + cifre(xpN) + " XP · +" + cifre(monN) + " Speed Coins", sotto: "Ogni trofeo ora dà XP e monete 🪙" });
    var lv = 0, pr = 0, m2 = 0;
    r.eventi.forEach(function (e) { m2 += e.monete; if (e.tipo === "livello") lv = e.livello; if (e.tipo === "prestigio") pr = e.prestigio; });
    if (pr) codaTrofei.push({ tipo: "xp", cls: "tl-platino", icona: "🌟", su: "PRESTIGIO " + pr + "!", nome: "Si riparte dal livello 1", sotto: "+" + cifre(m2) + " Speed Coins 🪙" });
    else if (lv) codaTrofei.push({ tipo: "xp", cls: "tl-oro", icona: "🆙", su: "Coi premi dei trofei", nome: "Livello " + lv + "!", sotto: "+" + cifre(m2) + " Speed Coins 🪙" });
    prossimoAvviso();
  }
  // la "scheda" che vedono gli amici: quanti trofei, per livello e per gioco
  function pubblicaTrofei(prof, set) {
    if (!(window.SGNube && SGNube.pubblica)) return;
    var liv = { platino: 0, diamante: 0, oro: 0, argento: 0, bronzo: 0 }, perGioco = {}, n = 0;
    for (var k in set) { var t = set[k]; n++; if (liv[t.livello] != null) liv[t.livello]++; perGioco[t.gioco] = (perGioco[t.gioco] || 0) + 1; }
    SGNube.pubblica({ trofei: n, liv: liv, giochi: perGioco });
    pubblicaCasa();
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
    var s = schermata({ icona: "👥", titolo: "Classifica e amici", sotto: "Chi ha più trofei", indietro: tornaHome }); s._menu = "classifica";
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
        .filter(function (d) { return d[1]; }).map(function (d) { return d[0] + " " + d[1]; }).join("   ");   // (🌙 spazio che non va a capo: il metallo resta attaccato al suo numero)
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
      // "🟢 Fatti vedere online dagli amici" (Passo 6): spento, gli amici non ti vedono col pallino verde (gli inviti arrivano lo stesso)
      if (window.SGAmiciOnline && SGAmiciOnline.visibile) {
        var chkOn = el("input", { type: "checkbox", "aria-label": "Fatti vedere online dagli amici" });
        chkOn.checked = SGAmiciOnline.visibile();
        chkOn.addEventListener("change", function () { SGAmiciOnline.visibile(!!chkOn.checked); });
        s._contenuto.insertBefore(el("div", { class: "sl-viva-opz am-presenza" }, [
          el("label", { class: "sl-interruttore" }, [ el("span", { text: "🟢 Fatti vedere online dagli amici" }), chkOn ]),
          el("small", { text: "Vedono quando hai l'app aperta e ti chiamano nella loro Sala. Spento non ti vedono, ma i loro inviti ti arrivano lo stesso." })
        ]), corpo);
      }
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
    if (!x.io && CITTA_VISIBILE && window.SGCasa) s._contenuto.appendChild(el("button", { class: "btn btn-primario am-casa", text: "🏠 Vai a casa sua", onclick: function () { schermataCasaAmico(x, torna); } }));
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
  // ---- 🔥 i giorni di fila: entrando col profilo si conta il giorno; al 7°, al 30° e ogni 100 giorni c'è il premio (nube.js) ----
  function prossimoPremioGiorni(n) { var m = n < 7 ? 7 : n < 30 ? 30 : (Math.floor(n / 100) + 1) * 100; return { giorno: m, monete: SGNube.premioGiorni(m) }; }
  function fuocoGiorni() { var p = window.SGNube && SGNube.profilo && SGNube.profilo(); return p && p.giorniFila >= 2 ? " · 🔥 " + p.giorniFila : ""; }
  function controllaGiorno() {
    if (!(window.SGNube && SGNube.segnaGiorno && SGNube.profilo && SGNube.profilo())) return;
    var r = SGNube.segnaGiorno(); if (!r || (r.n < 2 && !r.premio)) return;   // il primo giorno non si festeggia
    var pp = prossimoPremioGiorni(r.n), manca = pp.giorno - r.n;
    codaTrofei.push({ tipo: "xp", cls: r.premio ? "tl-oro" : "tl-xp", icona: "🔥", su: r.premio ? "PREMIO GIORNI DI FILA!" : "Bentornato!", nome: r.n + " giorni di fila!",
      sotto: r.premio ? "+" + cifre(r.premio) + " Speed Coins 🪙" : "Ancora " + manca + (manca === 1 ? " giorno" : " giorni") + " per il premio di " + cifre(pp.monete) + " 🪙" });
    prossimoAvviso();
  }
  function prossimoAvviso() {
    if (avvisoAttivo || !codaTrofei.length) return;
    avvisoAttivo = true;
    var t = codaTrofei.shift(), g = null, xp = t.tipo === "xp";   // xp = avviso di XP / livello / Prestigio
    giochi.forEach(function (x) { if (x.id === t.gioco) g = x; });
    var liv = t.livello === "platino" ? "Platino" : (LIVELLI[t.livello] ? LIVELLI[t.livello].nome : "");
    var fatto = false, timer = null;
    var box = el("div", { class: "avviso-trofeo " + (xp ? t.cls : "tl-" + t.livello), onclick: function () { chiudi(); } }, [
      el("div", { class: "at-ico", text: t.icona || "🏆" }),
      el("div", { class: "at-corpo" }, [
        el("div", { class: "at-su", text: xp ? t.su : "🏆 Trofeo " + liv + " sbloccato!" }),
        el("div", { class: "at-nome", text: t.nome }),
        el("div", { class: "at-gioco", text: xp ? t.sotto : (g ? g.nome : "") + premioTesto(t.livello) })   // il premio del trofeo
      ])
    ]);
    document.body.appendChild(box);   // fuori dalla schermata: resta anche se il gioco cambia pagina
    requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add("dentro"); }); });
    if (!xp) {
      suonoTrofeo(t.livello === "platino");
      try { if (navigator.vibrate) navigator.vibrate(t.livello === "platino" ? [40, 60, 40, 60, 80] : [30, 40, 30]); } catch (e) {}
    } else if (t.cls !== "tl-xp") suonoTrofeo(t.cls === "tl-platino");   // livello salito o Prestigio: il suono del trofeo
    timer = setTimeout(chiudi, xp && t.cls === "tl-xp" ? 3000 : 3600);
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
    SGNube.onCambio(function () { setTimeout(controllaGiorno, 0); });   // i giorni di fila: appena c'è il profilo (e se l'app resta aperta dopo mezzanotte)
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
    return GIOCHI_ELIMINAZIONE[g.id] ? base + " · ⚔️ torneo fino a " + MAX_ELIM : base;   // i giochi a due: torneo a eliminazione
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
      if (pc) return { id: pc.uid, nome: pc.nome, emoji: pc.emoji, omino: pc.omino || null, omini: pc.omini || null, ominoN: pc.ominoN || 0, cloud: true };
      // dentro col profilo, ma i suoi dati non arrivano (niente rete): intanto si gioca col nome e l'avatar ricordati
      return (SGNube.utente && SGNube.utente()) || senzaRete ? profiloRicordato() : null;
    }
    var id = leggiL(K_ATTIVO, null);
    return profili().filter(function (p) { return p.id === id; })[0] || profiloRicordato();   // senza la parte dei profili (niente rete): quello ricordato
  }
  // ---- l'ultimo profilo usato su questo telefono: { nome, omino } (mai la password). Serve se la sessione scade
  //      (si chiede solo la password, col nome già scritto) o se all'apertura manca la rete (si entra lo stesso) ----
  var K_ULTIMO = "sg-ultimo-profilo";
  var senzaRete = false;   // la sessione è sparita e manca la rete: intanto si gioca col profilo ricordato (nome e avatar)
  function ricordoProfilo() { var r = leggiL(K_ULTIMO, null); return r && r.nome ? r : null; }
  function ricordaProfilo() {
    var io = window.SGNube && SGNube.disponibile() && SGNube.profilo() ? profiloAttivo() : null;
    if (!io || !io.cloud || !io.nome) return;
    var r = { nome: io.nome, omino: io.omino || null };
    if (JSON.stringify(r) !== JSON.stringify(ricordoProfilo())) scriviL(K_ULTIMO, r);
  }
  function dimenticaProfilo() { try { localStorage.removeItem(K_ULTIMO); } catch (e) {} }
  function profiloRicordato() { var r = ricordoProfilo(); return r ? { id: "ricordo", nome: r.nome, emoji: "🙂", omino: r.omino || null, omini: null, ominoN: 0, cloud: false, ricordo: true } : null; }
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
  // opz.benvenuto: subito dopo aver creato il profilo (niente ‹: l'avatar pronto c'è già, basta "✅ Fatto")
  // IL PRIMO AVATAR (profilo appena nato): "Sei lui o lei?" → "Scegli il tuo look" → solo allora "✅ Fatto".
  // Si aggiorna solo il pezzo che cambia; "✏️ Personalizza" apre l'editor di sempre (in modo benvenuto).
  var LOOK_PRIMI = ["Casual", "Elegante", "Sportivo", "Rock", "Estate", "Inverno", "Rapper", "Festa"];
  function schermataPrimoAvatar(dopo) {
    var io = profiloAttivo(), O = window.SGOmino;
    if (!io || !O) return dopo();
    var nome = io.nome || "", forma = null, look = null, viso = 0, cfg = null;
    var looks = LOOK.filter(function (L) { return LOOK_PRIMI.indexOf(L.nome) >= 0; });
    var s = schermataProfiloBase("primo-avatar"), c = s._contenuto;
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
    if (!io) return schermataAccesso(function () { schermataOmino(dopo, null, opz); });
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

  // ---- profili in cloud (Firebase): nome + password, ti seguono ovunque ----
  function schermataAccessoCloud(dopo) {
    var p = SGNube.profilo();
    if (p) {   // già dentro: mostra il profilo, le statistiche e il tasto esci
      var sp = schermata({ icona: p.emoji || "👤", titolo: p.nome, sotto: "Il tuo profilo", indietro: function () { (dopo || schermataHome)(); } });   // dalla città si torna in città
      if (!dopo || dopo === schermataHome) sp._menu = "profilo";   // 📱 aperto dalla home o dal menu: col menu sotto
      if (window.SGOmino) sp._contenuto.appendChild(el("div", { class: "omino-profilo" }, [
        el("div", { class: "omino-palco" + (p.omino ? "" : " vuoto"), html: SGOmino.svg(p.omino || SGOmino.casuale(p.nome)) }),
        el("button", { class: "btn " + (p.omino ? "btn-fantasma" : "btn-primario"), text: p.omino ? "✏️ Modifica il tuo avatar" : "🧍 Crea il tuo avatar",
          onclick: function () { schermataOmino(function () { schermataAccessoCloud(dopo); }); } })
      ]));
      if (window.SGLivelli && SGNube.progressione) {
        sp._contenuto.appendChild(el("div", { class: "etichetta", text: "⭐ Livello e Speed Coins" }));
        sp._contenuto.appendChild(riquadroLivello(SGNube.progressione()));
      }
      // le statistiche di tutti i giochi stanno in una schermata a parte
      var tot = totaliGiocato(SGNube.giocato ? SGNube.giocato() : {});
      sp._contenuto.appendChild(el("button", { class: "st-tasto", onclick: function () { schermataStatistiche(function () { schermataAccessoCloud(dopo); }); } }, [
        el("span", { class: "st-tasto-ico", text: "📊" }),
        el("span", { class: "st-tasto-testo" }, [ el("b", { text: "Le tue statistiche" }), el("small", { text: tot.p ? cifre(tot.p) + (tot.p === 1 ? " partita" : " partite") + " · " + tempoGiocato(tot.t) + " giocati" : "Vittorie, sconfitte e tempo di ogni gioco" }) ]),
        el("span", { class: "st-tasto-va", text: "›" })
      ]));
      // solo il proprietario: come sono fatti i bot di tutti i giochi
      if (eProprietario() && window.SGOmino) sp._contenuto.appendChild(el("button", { class: "st-tasto st-bot", onclick: function () { schermataBot(function () { schermataAccessoCloud(dopo); }); } }, [
        el("span", { class: "st-tasto-ico", text: "🤖" }),
        el("span", { class: "st-tasto-testo" }, [ el("b", { text: "I Bot" }), el("small", { text: "Avatar, nomi e livelli dei bot di tutti i giochi" }) ]),
        el("span", { class: "st-tasto-va", text: "›" })
      ]));
      // solo il proprietario, finché gli avatar nuovi li prova lui: si spengono e si riaccendono (l'app si riapre, così ogni gioco li ridisegna)
      if (AVATAR_NUOVO === "proprietario" && eProprietario() && window.SGOmino) sp._contenuto.appendChild(el("button", { class: "st-tasto st-avnuovi", onclick: function () {
        try { localStorage.setItem("sg-avatar-stile", avatarNuoviSpenti() ? "rifinito" : "classico"); } catch (e) {}
        location.reload();
      } }, [
        el("span", { class: "st-tasto-ico", text: "🧍" }),
        el("span", { class: "st-tasto-testo" }, [ el("b", { text: avatarNuoviSpenti() ? "Avatar nuovi: spenti" : "Avatar nuovi: accesi" }),
          el("small", { text: avatarNuoviSpenti() ? "Tocca per vedere il disegno nuovo («Mii rifinito»). Lo vedi solo tu" : "Il disegno nuovo («Mii rifinito»): lo vedi solo tu. Tocca per tornare a quello di oggi" }) ]),
        el("span", { class: "st-tasto-va", text: "›" })
      ]));
      sp._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🚪 Esci dal profilo", onclick: function () {
        chiediConferma("Sei sicuro di voler uscire dal profilo?", "Se non ricordi la password non potrai più accedere.", "🚪 Esci", function () {
          dimenticaProfilo();   // uscito apposta: questo telefono non lo ripropone
          SGNube.esci().then(function () { schermataBenvenuto(schermataHome); });   // il profilo serve: si crea o si entra con un altro
        });
      } }));
      mostra(sp); return;
    }
    // senza profilo: il benvenuto (o, se questo telefono ricorda il profilo, solo la password)
    var ric = ricordoProfilo();
    if (ric) return schermataBentornato(dopo || schermataHome, ric, { indietro: dopo || schermataHome });
    schermataBenvenuto(dopo || schermataHome);
  }

  // ---- 📊 le statistiche di ogni gioco: partite, vinte, perse, % di vittorie, tempo giocato, serie migliore ----
  //      (le scrive premiaPartita a fine partita; contano dal 10 ottobre 2026. Il Black Jack ha anche le sue mani di sempre)
  function tempoGiocato(sec) {
    var m = Math.round((sec || 0) / 60);
    if (m < 1) return sec > 0 ? "meno di 1 min" : "0 min";
    if (m < 60) return m + " min";
    var h = Math.floor(m / 60), r = m % 60;
    return cifre(h) + " h" + (r && h < 100 ? " " + r + " min" : "");
  }
  function quandoGiocato(ms) {
    if (!ms) return "";
    var oggi = new Date(); oggi.setHours(0, 0, 0, 0);
    var giorni = Math.floor((oggi.getTime() - new Date(ms).setHours(0, 0, 0, 0)) / 86400000);
    return giorni <= 0 ? "oggi" : giorni === 1 ? "ieri" : giorni < 7 ? giorni + " giorni fa" : giorni < 30 ? Math.floor(giorni / 7) + (giorni < 14 ? " settimana fa" : " settimane fa") : "più di un mese fa";
  }
  function totaliGiocato(gi) {
    var t = { p: 0, v: 0, s: 0, t: 0 };
    Object.keys(gi || {}).forEach(function (k) { var x = gi[k] || {}; t.p += x.p || 0; t.v += x.v || 0; t.s += x.s || 0; t.t += x.t || 0; });
    return t;
  }
  function percVittorie(x) { var n = (x.v || 0) + (x.s || 0); return n ? Math.round((x.v || 0) * 100 / n) + "%" : "—"; }
  function schermataStatistiche(dopo) {
    var p = SGNube.profilo(); if (!p) return (dopo || schermataHome)();
    var gi = (SGNube.giocato && SGNube.giocato()) || {}, tot = totaliGiocato(gi);
    var s = schermata({ icona: "📊", titolo: "Statistiche", sotto: p.nome, indietro: function () { (dopo || schermataHome)(); } });
    function cella(valore, nome, cls) { return el("div", { class: "st-cella" + (cls ? " " + cls : "") }, [ el("b", { text: "" + valore }), el("small", { text: nome }) ]); }
    // in alto i totali
    s._contenuto.appendChild(el("div", { class: "st-griglia st-totali" }, [ cella(tempoGiocato(tot.t), "Tempo giocato"), cella(cifre(tot.p), "Partite"), cella(percVittorie(tot), "Vittorie") ]));
    var gf = p.giorniFila || 0, gm = p.giorniFilaMax || gf;   // 🔥 i giorni di fila in cui sei entrato
    if (gf) {
      var pp = prossimoPremioGiorni(gf);
      s._contenuto.appendChild(el("div", { class: "st-fuoco" }, [
        el("span", { class: "st-fuoco-ico", text: "🔥" }),
        el("span", { class: "st-fuoco-testo" }, [ el("b", { text: gf + (gf === 1 ? " giorno di fila" : " giorni di fila") }), el("small", { text: "Record: " + gm + " · prossimo premio a " + pp.giorno + " giorni: " + cifre(pp.monete) + " 🪙" }) ])
      ]));
    }
    var lista = giochi.filter(function (g) { return gi[g.id] && gi[g.id].p; }).sort(function (a, b) { return (gi[b.id].t || 0) - (gi[a.id].t || 0) || gi[b.id].p - gi[a.id].p; });
    if (lista.length) s._contenuto.appendChild(el("p", { class: "modulo-nota", html: "Il tuo gioco preferito: <b>" + lista[0].icona + " " + lista[0].nome + "</b> (" + tempoGiocato(gi[lista[0].id].t) + ")" }));
    // un riquadro per ogni gioco giocato, dal più giocato
    lista.forEach(function (g) {
      var x = gi[g.id], q = quandoGiocato(x.u);
      var r = el("div", { class: "st-gioco" }, [
        el("div", { class: "st-testa" }, [ el("span", { class: "st-ico", text: g.icona || "🎲" }), el("b", { text: g.nome }), el("small", { text: q ? "ultima volta " + q : "" }) ]),
        el("div", { class: "st-griglia" }, [ cella(cifre(x.p), "Partite"), cella(cifre(x.v || 0), "Vinte", "verde"), cella(cifre(x.s || 0), "Perse", "rosso"), cella(percVittorie(x), "% vittorie") ]),
        el("div", { class: "st-riga" }, [ el("span", { text: "⏱️ " + tempoGiocato(x.t) }), x.serieMax ? el("span", { text: "🔥 Serie migliore: " + x.serieMax + (x.serieMax === 1 ? " vittoria" : " vittorie di fila") }) : null, x.rec ? el("span", { text: "🏅 Record: " + cifre(x.rec) + " punti" }) : null ])
      ]);
      if (g.id === "blackjack") {   // il Black Jack conta anche le mani (da sempre)
        var bj = (p.stat && p.stat.blackjack) || {};
        if (bj.maniGiocate) r.appendChild(el("div", { class: "st-riga" }, [ el("span", { text: "🃏 Mani: " + cifre(bj.maniVinte || 0) + " vinte su " + cifre(bj.maniGiocate) }), el("span", { text: "✨ Black Jack fatti: " + cifre(bj.blackjackFatti || 0) }), bj.vincitaMax ? el("span", { text: "💰 Vincita più alta: " + cifre(bj.vincitaMax) }) : null ]));
      }
      s._contenuto.appendChild(r);
    });
    if (!lista.length) s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Ancora niente qui: gioca una partita col tuo profilo e le statistiche si riempiono." }));
    s._contenuto.appendChild(el("p", { class: "modulo-nota st-nota", text: "Contano le partite giocate col profilo dal 10 ottobre 2026. Le partite sullo stesso telefono in cui non giochi col tuo nome contano nelle partite e nel tempo, non nelle vittorie." }));
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

  // =========================================================
  //  PROFILO E AVATAR OBBLIGATORI (dal 15 ott 2026)
  //  Chi apre l'app la prima volta crea il profilo (nome + password) e l'avatar prima di tutto, anche se arriva
  //  dal link di un amico (dopo entra da solo nella stanza o nella Sala del link). Chi ha già usato un profilo su
  //  questo telefono entra da solo, senza domande (la sessione di Firebase resta salvata).
  // =========================================================
  // dopo = dove si va (la home, o la stanza/Sala del link). o = { daLink, invito: "🎉 Ti aspettano…" }
  function garantisciProfilo(dopo, o) {
    o = o || {};
    var io = profiloAttivo(), N = window.SGNube, ric = ricordoProfilo();
    if (io) {
      // un profilo di prima senza avatar: lo fa adesso, una volta (non arrivando da un link: lì si entra e basta)
      if (io.cloud && !io.omino && !o.daLink && window.SGOmino) return schermataOmino(dopo, null, { benvenuto: true });
      if (window.SGOmino && io.nome && leggiL("sg-primo-avatar", null) === io.nome) return schermataOmino(dopo, null, { benvenuto: true });   // (aveva chiuso l'app prima di scegliere l'avatar)
      return dopo();
    }
    if (!N || !N.disponibile()) return ric ? dopo() : senzaInternet(dopo, o);   // la parte dei profili non si è caricata: niente rete
    if (!N.pronto()) {   // Firebase sta ancora ritrovando la sessione: si aspetta un po', poi chi ha il profilo entra lo stesso
      schermataCaricamento();
      var fatto = false;
      N.onCambio(function () { if (!fatto && N.pronto()) { fatto = true; garantisciProfilo(dopo, o); } });
      setTimeout(function () { if (!fatto) { fatto = true; if (ric || (N.utente && N.utente())) dopo(); else senzaInternet(dopo, o); } }, 8000);
      return;
    }
    if (N.utente && N.utente()) return dopo();   // dentro, ma il profilo non arriva (rete): si entra lo stesso, arriverà
    if (ric) return navigator.onLine === false ? (senzaRete = true, dopo()) : schermataBentornato(dopo, ric, o);   // sessione scaduta: basta la password
    schermataBenvenuto(dopo, o);
  }
  // il messaggio giusto per chi crea il profilo o entra
  function erroreProfilo(e, nome) {
    var c = (e && e.code) || "";
    if (c === "auth/email-already-in-use") return "Il nome «" + nome + "» è già preso: scegline un altro (tocca 🎲). Se è il tuo, tocca «Hai già un profilo? Entra».";
    if (c === "auth/network-request-failed" || (e && e.message === "offline")) return "Serve internet: controlla il Wi-Fi o i dati e riprova.";
    if (/auth\/(invalid-credential|wrong-password|user-not-found|invalid-login-credentials|invalid-email)/.test(c)) return "Nome o password sbagliati.";
    if (c === "auth/too-many-requests") return "Troppi tentativi: aspetta un minuto e riprova.";
    if (c === "auth/weak-password") return "La password deve avere almeno 6 caratteri.";
    return "Qualcosa è andato storto: riprova.";
  }
  // le schermate del profilo: tutto in uno schermo, anche con la tastiera aperta (si stringe l'avatar, mai il tasto)
  function schermataProfiloBase(cls, indietro) {
    var s = schermata({ indietro: indietro || null });
    s.classList.add("benvenuto-profilo"); if (cls) s.classList.add(cls); if (indietro) s.classList.add("con-indietro");
    function misura() {
      if (!s.isConnected) { window.removeEventListener("resize", misura); if (window.visualViewport) visualViewport.removeEventListener("resize", misura); return; }
      var h = window.visualViewport ? visualViewport.height : window.innerHeight;
      s.classList.toggle("stretta", h < 500); s.classList.toggle("strettissima", h < 380);
    }
    window.addEventListener("resize", misura); if (window.visualViewport) visualViewport.addEventListener("resize", misura);
    setTimeout(misura, 0);
    return s;
  }
  function testaProfilo(titolo, sotto) {
    return el("div", { class: "bp-testa" }, [ el("div", { class: "bp-logo", "aria-hidden": "true", text: "⚡" }), el("h1", { text: titolo }), sotto ? el("p", { class: "bp-sotto", text: sotto }) : null ]);
  }
  // Invio nel primo campo porta al secondo, nel secondo preme il tasto
  function invioCampi(a, b, fai) {
    a.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); b.focus(); } });
    b.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); fai(); } });
  }

  // PRIMA VOLTA: "Benvenuto in SPeeD GAME!" → nome (col 🎲) + password → l'avatar → dove si doveva andare
  function schermataBenvenuto(dopo, o) {
    o = o || {};
    var s = schermataProfiloBase(), c = s._contenuto;
    c.appendChild(testaProfilo("Benvenuto in SPeeD GAME!", "Crea il tuo profilo: scegli un nome, una password e poi il tuo avatar."));
    if (o.invito) c.appendChild(el("div", { class: "bp-invito", text: o.invito }));
    var ant = el("div", { class: "sl-anteprima bp-anteprima", "aria-hidden": "true" });   // l'avatar che avrai (nasce dal nome: col 🎲 cambiano tutti e due)
    var nome = el("input", { class: "link-campo", type: "text", maxlength: "16", placeholder: "Come ti chiami?", autocomplete: "username", autocapitalize: "words", enterkeyhint: "next" });
    var pwd = el("input", { class: "link-campo bp-pwd", type: "password", maxlength: "40", placeholder: "Scegli una password (almeno 6)", autocomplete: "new-password", enterkeyhint: "go" });
    var avviso = el("div", { class: "link-avviso bp-avviso", "aria-live": "polite" });
    c.appendChild(ant); c.appendChild(nome); c.appendChild(pwd); c.appendChild(avviso);
    if (o.nome) nome.value = o.nome;
    dadoNome(nome, ant);   // 🎲 un nome buffo a caso (se è vuoto mette il nome dell'ultima volta)
    var bAvanti = el("button", { class: "btn btn-primario", text: "Avanti ▶", onclick: avanti });
    function avanti() {
      if (bAvanti.disabled) return;
      var n = (nome.value || "").trim().slice(0, 16), pw = pwd.value || "";
      if (n.length < 2) { avviso.textContent = "Scrivi il tuo nome (almeno 2 lettere)."; nome.focus(); return; }
      if (!/[a-z0-9]/i.test(n)) { avviso.textContent = "Nel nome serve almeno una lettera o un numero."; nome.focus(); return; }
      if (pw.length < 6) { avviso.textContent = "La password deve avere almeno 6 caratteri."; pwd.focus(); return; }
      bAvanti.disabled = true; avviso.textContent = "Creo il tuo profilo…";
      audioCtx();   // (il tocco sblocca i suoni per dopo)
      SGNube.crea(n, pw, "🙂").then(function () {
        attendiProfilo(function () {
          if (!SGNube.profilo()) { bAvanti.disabled = false; avviso.textContent = "Il profilo è creato ma non arriva: controlla la rete e tocca «Hai già un profilo? Entra»."; return; }
          // l'avatar si salva subito (quello dell'anteprima): così nessuno resta senza, anche se chiude l'app adesso
          if (window.SGOmino && !SGNube.profilo().omino) {
            var cfg = SGOmino.norm(SGOmino.casuale(n));
            SGNube.salvaOmino(cfg, [cfg, SGOmino.norm(secondoOmino(cfg, n))], 0);
          }
          ricordaProfilo();
          scriviL("sg-primo-avatar", n);   // (l'avatar è ancora da scegliere: se chiude l'app adesso, alla prossima apertura glielo richiede)
          if (!window.SGOmino) return dopo();
          schermataOmino(function () { dopo(); pillola("benvenuto", "🎉 Benvenuto, " + n + "!", "verde", 3500); }, null, { benvenuto: true });
        });
      }).catch(function (e) { bAvanti.disabled = false; avviso.textContent = erroreProfilo(e, n); });
    }
    invioCampi(nome, pwd, avanti);
    s._piede.appendChild(bAvanti);
    s._piede.appendChild(el("button", { class: "btn btn-fantasma bp-gia", text: "Hai già un profilo? Entra", onclick: function () {
      schermataEntraProfilo(dopo, Object.assign({}, o, { nome: (nome.value || "").trim() }));
    } }));
    mostra(s);
  }

  // "Hai già un profilo? Entra" (per chi cambia telefono): nome + password, poi dritto dove doveva andare
  function schermataEntraProfilo(dopo, o) {
    o = o || {};
    var s = schermataProfiloBase("bp-entra"), c = s._contenuto;
    c.appendChild(testaProfilo("Entra col tuo profilo", "Scrivi il nome e la password che hai scelto quando l'hai creato."));
    if (o.invito) c.appendChild(el("div", { class: "bp-invito", text: o.invito }));
    var nome = el("input", { class: "link-campo", type: "text", maxlength: "20", placeholder: "Il tuo nome", autocomplete: "username", autocapitalize: "words", enterkeyhint: "next" });
    var pwd = el("input", { class: "link-campo bp-pwd", type: "password", maxlength: "40", placeholder: "La tua password", autocomplete: "current-password", enterkeyhint: "go" });
    var avviso = el("div", { class: "link-avviso bp-avviso", "aria-live": "polite" });
    nome.value = o.nome || "";
    c.appendChild(nome); c.appendChild(pwd); c.appendChild(avviso);
    var bEntra = el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: entra });
    function entra() {
      if (bEntra.disabled) return;
      var n = (nome.value || "").trim(), pw = pwd.value || "";
      if (n.length < 2 || !pw) { avviso.textContent = "Scrivi nome e password."; (n.length < 2 ? nome : pwd).focus(); return; }
      bEntra.disabled = true; avviso.textContent = "Un attimo…";
      audioCtx();
      SGNube.accedi(n, pw).then(function () { attendiProfilo(function () { ricordaProfilo(); dopo(); }); })
        .catch(function (e) { bEntra.disabled = false; avviso.textContent = erroreProfilo(e, n); });
    }
    invioCampi(nome, pwd, entra);
    s._piede.appendChild(bEntra);
    s._piede.appendChild(el("button", { class: "btn btn-fantasma bp-gia", text: "‹ Non ho un profilo: lo creo", onclick: function () { schermataBenvenuto(dopo, o); } }));
    mostra(s);
  }

  // il telefono ricorda il profilo ma la sessione è sparita: "Bentornato, Luca!", solo la password (una volta)
  // o.indietro: si può tornare indietro (dalla home, quando si era entrati senza rete)
  function schermataBentornato(dopo, ric, o) {
    o = o || {};
    var s = schermataProfiloBase("bp-bentornato", o.indietro), c = s._contenuto;
    c.appendChild(testaProfilo("Bentornato, " + ric.nome + "! 👋", "Per sicurezza scrivi la tua password: poi entri da solo."));
    if (o.invito) c.appendChild(el("div", { class: "bp-invito", text: o.invito }));
    if (window.SGOmino) c.appendChild(el("div", { class: "sl-anteprima bp-anteprima", "aria-hidden": "true", html: SGOmino.svg(ric.omino || SGOmino.casuale(ric.nome)) }));
    var nome = el("input", { type: "text", autocomplete: "username", value: ric.nome, hidden: "hidden", "aria-hidden": "true" });   // (per chi salva le password: il nome c'è già)
    var pwd = el("input", { class: "link-campo bp-pwd", type: "password", maxlength: "40", placeholder: "La tua password", autocomplete: "current-password", enterkeyhint: "go" });
    var avviso = el("div", { class: "link-avviso bp-avviso", "aria-live": "polite" });
    c.appendChild(nome); c.appendChild(pwd); c.appendChild(avviso);
    var bEntra = el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: entra });
    var bLoStesso = el("button", { class: "btn btn-fantasma bp-gia", text: "▶ Gioca lo stesso (senza rete)", hidden: "hidden", onclick: function () { senzaRete = true; dopo(); } });
    function entra() {
      if (bEntra.disabled) return;
      var pw = pwd.value || "";
      if (!pw) { avviso.textContent = "Scrivi la tua password."; pwd.focus(); return; }
      bEntra.disabled = true; avviso.textContent = "Un attimo…";
      audioCtx();
      SGNube.accedi(ric.nome, pw).then(function () { attendiProfilo(function () { ricordaProfilo(); dopo(); }); })
        .catch(function (e) {
          bEntra.disabled = false; avviso.textContent = erroreProfilo(e, ric.nome);
          if (e && e.code === "auth/network-request-failed") bLoStesso.hidden = false;   // senza rete si gioca lo stesso
        });
    }
    pwd.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); entra(); } });
    s._piede.appendChild(bEntra);
    s._piede.appendChild(bLoStesso);
    s._piede.appendChild(el("button", { class: "btn btn-fantasma bp-gia", text: "Non sei " + ric.nome + "? Cambia profilo", onclick: function () {
      dimenticaProfilo(); schermataBenvenuto(dopo, { invito: o.invito, daLink: o.daLink });
    } }));
    mostra(s);
  }

  // prima apertura senza rete (o Firebase che non risponde): il profilo non si può creare
  function senzaInternet(dopo, o) {
    var s = schermataProfiloBase("bp-rete"), c = s._contenuto;
    c.appendChild(el("div", { class: "bp-rete-ico", "aria-hidden": "true", text: "📶" }));
    c.appendChild(testaProfilo("Serve internet per creare il profilo", "Il profilo ti segue su ogni telefono: per crearlo serve la rete. Controlla il Wi-Fi o i dati e tocca Riprova."));
    var avviso = el("div", { class: "link-avviso bp-avviso", "aria-live": "polite" });
    c.appendChild(avviso);
    function riprova() {
      window.removeEventListener("online", riprova);
      if (!s.isConnected) return;
      var N = window.SGNube;
      if (N && N.disponibile()) { if (N.riprova) N.riprova(); return garantisciProfilo(dopo, o); }
      if (navigator.onLine === false) { avviso.textContent = "Ancora niente rete: riprova tra un attimo."; window.addEventListener("online", riprova); return; }
      avviso.textContent = "Un attimo…";
      location.reload();   // la parte dei profili non si era caricata: si ricarica (il link aperto resta segnato: dopo si entra lo stesso)
    }
    window.addEventListener("online", riprova);   // torna la rete: si riprova da soli
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Riprova", onclick: riprova }));
    mostra(s);
  }
  // il link aperto all'avvio, in parole per chi gioca ("🎉 Ti aspettano per giocare a ❌ Tris!")
  function invitoDi(L) {
    if (!L) return "";
    if (L.gruppo) return "🎉 I tuoi amici ti aspettano" + (L.n ? " in «" + (L.e ? L.e + " " : "") + String(L.n).slice(0, 24) + "»" : " nella compagnia " + L.gruppo) + "!";
    if (L.sala) return "🎉 I tuoi amici ti aspettano nella Sala " + String(L.sala).toUpperCase() + "!";
    var g = L.gioco && giocoDa(L.gioco);
    return g && L.stanza ? "🎉 Ti aspettano per giocare a " + (g.icona ? g.icona + " " : "") + g.nome + "!" : "";
  }

  // =========================================================
  //  LA SALA — il gruppo resta tra una partita e l'altra
  // =========================================================
  var gruppo = [];                 // [{nome, emoji}]
  var ultimaPartita = null;        // {gioco, impostazioni}

  function nomiGruppo() { return gruppo.map(function (p, i) { return (p.nome || "").trim() || ("Giocatore " + (i + 1)); }); }

  // quanti giocatori servono almeno: quelli del modo scelto (modi[].min, es. Palla Matta: 1 da solo, 2 nella sfida), se no quelli del gioco.
  // Il proprietario (IL PAPPONE) prova da solo, sullo stesso telefono, i giochi che lo permettono (provaDaSolo in SG.registra)
  function minDi(g, modo) {
    var M = g && modo ? modoDi(g, modo) : null;
    if (g && g.provaDaSolo && modo !== "online" && eProprietario()) return 1;
    return (M && M.min) || (g && g.giocatoriMin) || 2;
  }
  function schermataSala(g, opts) {
    var torn = !!(opts && opts.torneo);
    var min = g ? minDi(g, opts && opts.modo) : 2;
    var max = g ? (g.giocatoriMax || 10) : 10;
    // (un modo "diretto" parte appena si tocca Avanti: servono già tutti quelli che servono)
    var Mg = g && opts && opts.modo ? modoDi(g, opts.modo) : null, minAvanti = (torn || (Mg && Mg.diretto)) ? min : 1;
    if (!gruppo.length) {
      var io = profiloAttivo();
      if (io) gruppo.push({ nome: io.nome, emoji: io.emoji });
    }
    var s = schermata({ icona: torn ? "🏆" : "🎉", titolo: torn ? "Serata a punti" : "La sala",
      sotto: torn ? "Chi gioca stasera" : (g ? ("Si gioca a " + g.nome) : "Chi partecipa"),
      indietro: function () { if (!torn && g && modiDi(g).length > 1) schermataModo(g); else tornaHome(); } });   // tornaHome: torna anche nell'edificio da cui si è entrati

    s.classList.add("prima-fissa");   // "Avanti" sempre a vista: con tanti giocatori scorre solo la lista
    var conta = el("p", { class: "modulo-nota" });
    var lista = el("div");
    var avanti = el("button", { class: "btn btn-primario", text: torn ? "Comincia la serata ▶" : "Avanti ▶", onclick: function () {
      if (gruppo.length < minAvanti) return;
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
      if (gruppo.length < minAvanti) avanti.disabled = true; else avanti.removeAttribute("disabled");
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
      sotto: torn ? ("Serata a punti · " + nomeDifficolta(pesoGioco(g))) : (inSala ? "Sala · impostazioni" : (M ? M.icona + " " + M.nome + " · impostazioni" : "Impostazioni della partita")),
      indietro: function () { if (torn) schermataTorneoHub(); else if (inSala) salaScegliGioco(); else if (conAmici) schermataSala(g, modo ? { modo: modo } : null); else if (modiDi(g).length > 1) schermataModo(g); else tornaHome(); } });
    s.classList.add("prima-fissa");   // "Comincia" sempre a vista: se le scelte sono tante scorre solo il centro
    if (!conAmici && !torn && !inSala) {
      if (online) s._contenuto.appendChild(el("p", { class: "modulo-nota sl-prima", text: "Scegli come giocare, poi apri la stanza: inviti gli amici col tasto 📤 e vi aspettate insieme nella saletta." }));
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
    // chi gioca (es. "Formazione di Paky"): sullo stesso telefono e nel torneo il gruppo, nella Sala chi c'è, se no tu
    var io0 = profiloAttivo();
    var chiGioca = (conAmici || torn) ? nomiGruppo() : (inSala ? ((sala && sala.membri) || []).map(function (m) { return m.nome; }) : [(io0 && io0.nome) || nomiGruppo()[0] || "Giocatore 1"]);
    if (typeof g.impostazioni === "function") {
      box = el("div", { class: "sg-dal-gioco" });   // (🤍 roba del gioco: le sue emoji restano emoji)
      g.impostazioni(box, impostazioni, { el: el, torneo: torn, sala: inSala, modo: modo, giocatori: chiGioca.slice() });
      if (modo) impostazioni.modo = modo;   // il modo l'avete scelto prima: qui non si cambia
      s._contenuto.appendChild(box);
    }
    if (inSala) s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "In una sala si gioca sempre online: appena cominci, gli altri entrano da soli." }));
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "Come si gioca",
      onclick: function () { schermataRegole(g, function () { schermataPreGioco(g, opts); }); } }));
    function comincia() {
      if (inSala) { impostazioni.modo = "online"; return salaLancia(g, impostazioni, box); }
      if (modo) impostazioni.modo = modo;
      // online: le stesse impostazioni restano a portata dell'host nella saletta (tasto "⚙️ Regole")
      if (!conAmici && !torn) { var io = profiloAttivo(), soloIo = [(io && io.nome) || nomiGruppo()[0] || "Giocatore 1"]; ultimaPartita = { gioco: g, impostazioni: impostazioni }; return avviaPartita(g, soloIo, impostazioni, online ? Object.assign({}, opts, { regole: box }) : opts); }   // online o contro il computer: ci sei solo tu (gli altri entrano dal link o sono bot)
      // online: l'host apre la stanza da solo, gli altri entrano via rete → niente vincolo di minimo qui
      if (!(impostazioni && impostazioni.modo === "online") && gruppo.length < minDi(g, modo)) return schermataSala(g, opts);
      ultimaPartita = { gioco: g, impostazioni: impostazioni };
      avviaPartita(g, nomiGruppo(), impostazioni, opts);
    }
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: inSala ? "Comincia per tutti ▶" : (online ? "🔗 Apri la stanza ▶" : "Comincia ▶"), onclick: comincia }));
    // modi[].diretto: quel modo non ha niente da scegliere qui (es. Palla Matta "Da solo": il livello si sceglie dopo) → si parte subito
    if (M && M.diretto && !torn && !inSala && !online) return comincia();
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
  var sala = null;   // host:  { rete, codice, pronta, membri:[{id,nome,emoji,omino}], gioco, stanza, inGioco, torneo, regole }
  var salaG = null;  // ospite: { rete, codice, myId, nome, emoji, membri, inGioco, torneo, _msg }
  // "Online" da un gioco apre sempre la Sala della serata (un codice per tutti i giochi).
  // false = come prima (stanza singola). Su un telefono solo si spegne con localStorage "sg-sala-sempre" = "0" (serve alle prove)
  var SALA_SEMPRE = true;
  function salaSempre() { try { if (localStorage.getItem("sg-sala-sempre") === "0") return false; } catch (e) {} return SALA_SEMPRE; }
  // quanti posti ha un gioco online (g.postiOnline; se non lo dice, 10)
  function postiDi(g) { var n = g && +g.postiOnline; return n > 0 ? n : 10; }
  // torneo online: { punti:{nome:n}, nomi:[chi ha giocato], n, ultima:{gioco,icona,assegnati}, finito }

  // ---------- LA COMPAGNIA (Passo 3): un codice fisso di 6 lettere e "una Sala sola" per codice ----------
  // Il codice di questo telefono (a caso, per sempre): va nella foto della Sala (dev). Serve a riconoscere l'host che
  // ricarica la pagina: la sua Sala nuova vince su quella di prima (stesso telefono → la sessione più nuova)
  var DEV = null;
  function idTelefono() {
    if (DEV) return DEV;
    var d = null; try { d = localStorage.getItem("sg-dev"); } catch (e) {}
    if (!d || !/^[a-z0-9]{6,16}$/.test(d)) { d = "d" + Math.random().toString(36).slice(2, 10); try { localStorage.setItem("sg-dev", d); } catch (e) {} }
    return (DEV = d);
  }
  // un codice di Compagnia: 6 lettere dell'alfabeto dei codici (niente O, I, 0, 1). null se non lo è
  function codiceComp(C) { C = String(C == null ? "" : C).trim().toUpperCase(); return /^[A-HJ-NP-Z2-9]{6}$/.test(C) ? C : null; }
  // il link da mandare per la Sala: quello fisso della Compagnia (#gruppo=…, con nome ed emoji) o #sala=.
  // In fondo la 🔑 chiave delle foto di «Chi di Noi?», se questa scheda ce l'ha (crea: sono l'host e la faccio se manca)
  function linkSala(C, crea) {
    C = String(C || "").toUpperCase();
    var k = chiaveDi(C, !!crea);
    if (C.length === 6) {
      var l = null; try { if (window.SGCompagnia) l = SGCompagnia.link(C); } catch (e) {}
      if (!l) l = SG.creaLink({ gruppo: C });
      return k ? l + (l.indexOf("#") < 0 ? "#" : "&") + "k=" + k : l;
    }
    return SG.creaLink({ sala: C, k: k || undefined });
  }
  // chi tiene una Sala, dalla sua foto: { gen, nato, _s, dev }
  function capoDi(m) { return { gen: +(m && m.gen) || 1, nato: +(m && m.nato) || 0, _s: String((m && m._s) || ""), dev: String((m && m.dev) || "") }; }
  // due Sale sullo stesso codice: quale resta (la regola è uguale su tutti i telefoni, decisa coi valori delle foto).
  // gen più alta; stesso telefono (o tutti e due senza dev e nate insieme) → la sessione più nuova (l'host che ricarica resta
  // host); poi quella nata prima; poi il dev più piccolo; poi la sessione più piccola. Torna a o b
  function primaSala(a, b) {
    var ga = +a.gen || 1, gb = +b.gen || 1;
    if (ga !== gb) return ga > gb ? a : b;
    var sa = String(a._s || ""), sb = String(b._s || ""), na = +a.nato || 0, nb = +b.nato || 0;
    var stesso = a.dev && b.dev ? a.dev === b.dev : (!a.dev && !b.dev && na === nb);
    if (stesso && sa !== sb) return sa > sb ? a : b;
    if (na !== nb) return na < nb ? a : b;
    if ((a.dev || "") !== (b.dev || "")) return String(a.dev || "") < String(b.dev || "") ? a : b;
    return sa <= sb ? a : b;
  }
  // la Sala che tengo io vince su quella di questa foto?
  function vinceLaMia(S0, m) {
    var mia = { gen: S0.gen, nato: S0.nato, _s: S0.rete ? S0.rete.sessione : "", dev: idTelefono() };
    return primaSala(capoDi(m), mia) === mia;
  }
  // il nome di chi tiene la Sala di una foto
  function nomeHostDi(m) { var h = ((m && m.membri) || []).filter(function (x) { return x && x.id === "host"; })[0]; return h && h.nome ? String(h.nome) : ""; }
  // chi della Sala può prenderla se l'host se ne va (Passo 3, p3-c): i primi due arrivati col profilo, presenti, non fatti
  // uscire, non ancora da rientrare. Nel torneo a eliminazione nessuno
  function viceDi() {
    if (!sala || sala.elim) return [];
    var SV = sala.rete && sala.rete._sv, forse = (SV && SV.forse) || {}, fuori = (SV && SV.fuori) || {};
    return sala.membri.filter(function (m) { return m && m.id && m.id !== "host" && m.pr && !m.ex && !forse[m.id] && !fuori[m.id] && !(sala.attesi && sala.attesi[m.id]); })
      .slice(0, 2).map(function (m) { return m.id; });
  }
  // la Sala di questo codice è aperta su questo telefono? (per le tessere della home)
  function infoSalaMia(C) {
    C = String(C || "").toUpperCase();
    if (sala && sala.codice === C) return { host: true, membri: sala.membri, gioco: sala.gioco };
    if (salaG && salaG.codice === C && salaG.membri.length) return { host: false, membri: salaG.membri, gioco: salaG.giocoSala ? salaG.giocoSala.gioco : null };
    return null;
  }
  // la Compagnia di una Sala: { nome, emoji, rv } (dalla foto, dalla memoria delle compagnie, o null)
  function compDi(C, m) {
    if (m && m.comp && m.comp.nome) return { nome: String(m.comp.nome).slice(0, 24), emoji: String(m.comp.emoji || "📌").slice(0, 8), rv: +m.comp.rv || 0 };
    var v = null; try { v = window.SGCompagnia && C ? SGCompagnia.trova(C) : null; } catch (e) {}
    return v ? { nome: v.n, emoji: v.e, rv: +v.rv || 0 } : null;
  }

  function salaSenzaRete(riprova) {
    var s = schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: schermataHome });
    s._contenuto.appendChild(el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La Sala online funziona quando il gioco è aperto dal sito pubblicato. Da un file locale non è disponibile." }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Ok", onclick: schermataHome }));
    mostra(s);
  }
  function ominoOk(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  // la sala usa la saletta d'attesa dei giochi (stessi personaggi, stesso divano).
  // Col torneo a punti il titolo resta "Sala online": il torneo si accende e si spegne dal ⚙️ senza cambiare schermata
  // comp = la Compagnia: il titolo è il suo nome con l'emoji ("🍻 Quelli del giovedì"); rinominandola cambia solo la scritta
  function gSala(torn, E, comp) {
    if (E) { var gg = giocoDa(E.gioco); return { id: "__sala", nome: E.torneino ? "Torneo" + (gg ? " " + aGioco(gg.nome) : "") : "Torneo", icona: gg ? gg.icona : "🏆" }; }
    if (comp && comp.nome) return { id: "__sala", nome: (comp.emoji ? comp.emoji + " " : "") + comp.nome, icona: comp.emoji || "📌", chiave: "__comp" };
    return { id: "__sala", nome: "Sala online", icona: "👥" };
  }

  // ---------- TORNEO ONLINE ("🏆 Contiamo i punti"): classifica che si somma partita dopo partita ----------
  function segnaNomeT(T, nome) { if (T && nome && T.nomi.indexOf(nome) < 0) T.nomi.push(nome); }
  function classificaT(T) {
    return T.nomi.map(function (n) { return { nome: n, punti: T.punti[n] || 0 }; }).sort(function (a, b) { return b.punti - a.punti; });
  }
  // la lista intera (a pari punti lo stesso posto e la stessa medaglia; prima della prima partita i posti in fila)
  function listaT(T, evidenzia) {
    var cl = classificaT(T), posti = [];
    cl.forEach(function (r, i) { posti.push(evidenzia && i && r.punti === cl[i - 1].punti ? posti[i - 1] : i + 1); });
    var med = medaglieAPari(posti), ol = el("ol", { class: "classifica" + (cl.length > 6 ? " fitta" : "") });
    cl.forEach(function (r, i) {
      ol.appendChild(el("li", { class: posti[i] === 1 && evidenzia ? "vincitore" : "" }, [
        el("span", { class: "pos", text: med[i] }), el("span", { class: "nome", text: r.nome }), el("span", { class: "punti", text: cifre(r.punti) }) ]));
    });
    return ol;
  }
  // "Paky +100 · Luca +78" (solo chi è nel torneo: i bot no)
  // la Classifica della serata in una riga: "🏆 Serata: Paky 1° · Luca 2° · Giulia 3° · …" (a pari punti lo stesso posto)
  function rigaSerataT(T, k) {
    var cl = classificaT(T), posti = [];
    if (!cl.length) return "";
    k = k || 3;
    cl.forEach(function (r, i) { posti.push(i && r.punti === cl[i - 1].punti ? posti[i - 1] : i + 1); });
    return "🏆 Serata: " + cl.slice(0, k).map(function (r, i) { return r.nome + " " + posti[i] + "°"; }).join(" · ") + (cl.length > k ? " · …" : "");
  }
  function puntiRigaT(T, ass) {
    return (ass || []).filter(function (a) { return T.nomi.indexOf(a.nome) >= 0; }).map(function (a) { return a.nome + " +" + cifre(a.punti); }).join(" · ");
  }
  // la classifica corta nella Sala (host e amici): una riga "🏆 Paky 178 · Luca 140 · Giulia 96 ›" (i primi tre).
  // Il nodo è sempre lo stesso (C = sala dell'host o salaG di chi entra): cambia solo la scritta, niente lampeggio.
  // Un tocco apre la classifica intera
  function boxTorneoCorto(T, C) {
    var K = C._corto;
    if (!K) {
      K = C._corto = { tx: el("span", { class: "sl-tc-testo" }) };
      K.nodo = el("button", { class: "sl-torneo-corto", type: "button", onclick: function () { foglioTorneo(C, K.nodo.closest(".schermata"), true); } },
        [ K.tx, el("span", { class: "sl-tc-freccia", "aria-hidden": "true", text: "›" }) ]);
    }
    var cl = classificaT(T), tx;
    if (T.finito && cl.length) tx = "🏆 Serata finita · 👑 " + cl[0].nome + " " + cifre(cl[0].punti);
    else if (!T.n) tx = "🏆 Classifica della serata: ancora nessuna partita";
    else tx = "🏆 " + cl.slice(0, 3).map(function (r) { return r.nome + " " + cifre(r.punti); }).join(" · ");
    if (K.tx.textContent !== tx) { K.tx.textContent = tx; K.nodo.setAttribute("aria-label", "Classifica della serata: " + tx.replace(/^🏆\s*/, "")); }
    return K.nodo;
  }
  // il foglio della classifica intera: i posti, "Ultima partita: …" e, per l'host nella Sala, "🏁 Chiudi e premia".
  // Se arrivano punti nuovi mentre è aperto si rifà solo la lista; si chiude da solo se la schermata sotto se ne va
  // (parte un gioco) o il torneo si spegne. schermo = la schermata da cui si è aperto; conPremia = siamo nella Sala
  function foglioTorneo(C, schermo, conPremia) {
    if (document.querySelector(".sl-velo")) return;
    var host = C === sala, velo, tic, firma = "";
    function T() { return host ? (sala === C ? sala.torneo : null) : (salaG === C ? salaG.torneo : null); }
    var lista = el("div", { class: "sl-tc-lista" }), sotto = el("p", { class: "modulo-nota" }), ult = el("p", { class: "modulo-nota sl-tc-ultima" });
    var bPremia = host && conPremia ? el("button", { class: "btn btn-fantasma", text: "🏁 Chiudi e premia", onclick: function () {
      chiediConferma("Chiudere la serata e premiare?", "Tutti vedranno il podio finale.", "🏁 Premia", function () { chiudi(); salaTorneoFine(); });
    } }) : null;
    function chiudi() { clearInterval(tic); if (velo && velo.parentNode) velo.parentNode.removeChild(velo); }
    function rifai() {
      var t = T(); if (!t) return chiudi();
      var f = JSON.stringify([t.punti, t.n, t.nomi, t.finito, t.ultima && t.ultima.gioco]);
      if (f === firma) return;
      firma = f;
      sotto.textContent = t.finito ? "Serata finita." : (t.n ? t.n + (t.n === 1 ? " partita giocata" : " partite giocate") + " · più il gioco è difficile, più punti vale" : "Ancora nessuna partita: i punti arrivano a fine gioco. Più il gioco è difficile, più punti vale.");
      svuota(lista); lista.appendChild(listaT(t, t.n > 0));
      var u = t.ultima ? puntiRigaT(t, t.ultima.assegnati) : "";
      ult.textContent = t.ultima ? "Ultima partita: " + t.ultima.icona + " " + t.ultima.gioco + (u ? " — " + u : "") : "";
      ult.hidden = !t.ultima;
      if (bPremia) bPremia.hidden = !t.n || !!t.finito;
    }
    velo = el("div", { class: "sl-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: "🏆 Classifica della serata" }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        el("div", { class: "sl-foglio-corpo" }, [ sotto, lista, ult ]),
        bPremia,
        el("button", { class: "btn btn-primario", text: "👍 Ok", onclick: chiudi })
      ])
    ]);
    rifai();
    document.body.appendChild(velo);
    tic = setInterval(function () { if (schermo && !document.body.contains(schermo)) return chiudi(); rifai(); }, 400);
  }
  // la partita è finita: i punti per posto (peso del gioco compreso). ultima.stanza e ultima.giro dicono QUALE partita
  // (la stanza del gioco e il giro della sua saletta: con "↻ Rivincita" nella stessa stanza il giro cresce)
  // q = { stanza, giro } quando la partita non è nella mia stanza (il duello: la apre un amico e me lo dice lui)
  function salaRisultato(g, classifica, q) {
    if (!sala || !classifica || !classifica.length) return;
    var st = (q && q.stanza) || sala.stanza || null, SVg = st ? SVH[st] : null;
    var giro = q && q.giro != null ? (+q.giro || 0) : (SVg ? (SVg.giro || 0) : 0);
    var nuova = contaGiocate(classifica, st + "|" + giro);
    restaEsito(classifica, st);   // ("👑 Chi vince resta": chi resta, chi va in coda, la sfida dopo)
    var T = sala.torneo;
    if (!T) { if (nuova) sala._bcast(); return; }
    var ass = puntiDaClassifica(g, classifica);
    ass.forEach(function (r) { T.punti[r.nome] = (T.punti[r.nome] || 0) + r.punti; });
    T.n += 1; T.ultima = { gioco: g.nome, icona: g.icona || "🎲", assegnati: ass, stanza: st, giro: giro };
    sala._bcast();
    rigaPuntiOra();
  }
  // partite giocate a testa nella serata, per NOME (nel Passo 3 l'host della Sala può cambiare id): servono a "Chi gioca?"
  // (prima chi ha giocato meno). Una partita conta una volta sola (chiave = stanza|giro). true = contata adesso
  function contaGiocate(classifica, k) {
    if (!sala || (sala._giocataK || "") === k) return false;
    sala._giocataK = k;
    var G = sala.giocate = sala.giocate || {};
    sala.membri.forEach(function (m) {
      if (classifica.some(function (r) { return r && !r.bot && stessoNome(r.nome, m.nome); })) G[m.nome] = (G[m.nome] || 0) + 1;
    });
    return true;
  }
  // ---- a fine partita, sopra i tasti: "🏆 Paky +100 · Luca +78" (host della Sala e amici; gli amici la leggono dal
  //  messaggio della Sala). Compare quando arrivano i punti di QUESTA partita (chiave = "stanza|giro"), anche se i tasti
  //  sono già sullo schermo; si cambia solo la scritta. Tocco → la classifica intera
  var RIGA_PT = null;   // { nodo, tx, chiave, sala: true se comando io la Sala }
  function rigaPuntiFine(box, SV, salaHost, host) {
    var T = salaHost ? sala.torneo : (salaG && salaG.torneo);
    if (!T || !SV) return;
    var C = salaHost ? sala : salaG;
    var R = { tx: el("span", { class: "ft-pt-testo" }), chiave: SV.codice + "|" + ((host ? SV.giro : SV.giroH) || 0), sala: salaHost };
    R.nodo = el("button", { class: "ft-punti", type: "button", hidden: "hidden", onclick: function () { foglioTorneo(C, R.nodo.closest(".schermata"), false); } }, [ R.tx ]);
    box.appendChild(R.nodo);
    RIGA_PT = R;
    rigaPuntiOra();
  }
  function rigaPuntiOra() {
    var R = RIGA_PT; if (!R) return;
    if (!R.nodo.isConnected && R.vista) { RIGA_PT = null; return; }   // (la fine non c'è più)
    if (R.nodo.isConnected) R.vista = true;
    var T = R.sala ? (sala && sala.torneo) : (salaG && salaG.torneo), U = T && T.ultima;
    // (deciso dal proprietario: in fondo a ogni fine partita la Classifica della serata, "🏆 Serata: Paky 1° · Luca 2° · …"; i primi tre, il resto col tocco)
    var si = !!(U && (U.stanza + "|" + (U.giro || 0)) === R.chiave), k = 3, tx = si ? rigaSerataT(T, k) : "";
    if (R.nodo.hidden !== !tx) R.nodo.hidden = !tx;
    if (R.tx.textContent !== tx) R.tx.textContent = tx;
    // in una riga sola: se non ci sta (schermo piccolo, nomi lunghi) si tolgono nomi dal fondo (tutto nello stesso momento: niente lampeggio)
    while (tx && k > 1 && R.nodo.isConnected && R.nodo.clientWidth && R.nodo.scrollWidth > R.nodo.clientWidth + 1) { tx = rigaSerataT(T, --k); R.tx.textContent = tx; }
    if (tx && !R.nodo.isConnected && !R.misura) { R.misura = 1; setTimeout(rigaPuntiOra, 60); }   // (appena la fine è sullo schermo: si misura)
  }
  window.addEventListener("resize", function () { if (RIGA_PT) rigaPuntiOra(); });   // (telefono girato: la riga si rimisura)
  function schermataPodioT(T, host) {
    var s = schermata({ icona: "🏆", titolo: "Fine della serata!", sotto: T.n + (T.n === 1 ? " partita giocata" : " partite giocate") });
    var cl = classificaT(T);
    if (cl.length) s._contenuto.appendChild(el("div", { class: "sl-campione" }, [ el("div", { class: "sl-camp-cor", text: "👑" }), el("div", { class: "sl-camp-nome", text: cl[0].nome }), el("div", { class: "sl-camp-sotto", text: "vince la serata con " + cifre(cl[0].punti) + " punti" }) ]));
    s._contenuto.appendChild(listaT(T, true));
    if (host) {
      // si resta nella Sala, con lo stesso codice: un torneo nuovo da zero, oppure la Sala senza torneo
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Nuova classifica (stessi amici)", onclick: function () {
        if (!sala || sala.torneo !== T) return;
        T.punti = {}; T.n = 0; T.ultima = null; T.finito = false; T.nomi = sala.membri.map(function (m) { return m.nome; });
        sala._bcast(); disegnaSalaHost();
      } }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "👥 Torna nella Sala", onclick: function () {
        if (!sala) return schermataHome();
        // (con la Sala della serata la classifica resta sempre accesa: si riparte da zero)
        if (sala.torneo === T) { if (salaSempre()) { T.punti = {}; T.n = 0; T.ultima = null; T.finito = false; T.nomi = sala.membri.map(function (m) { return m.nome; }); } else sala.torneo = null; sala._bcast(); }
        disegnaSalaHost();
      } }));
    } else {
      // (quando l'host sceglie, la Sala torna da sola: qui si può solo uscire)
      s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: ((salaG && salaG.nomeHost) || "L'host") + " decide se ricominciare la classifica: si torna nella Sala da soli." }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci dalla Sala", onclick: function () { chiudiSalaOspite(); schermataHome(); } }));
    }
    mostra(s);
  }
  function salaTorneoFine() {
    if (!sala || !sala.torneo) return;
    sala.torneo.finito = true; sala._bcast();
    schermataPodioT(sala.torneo, true);
  }
  // ⚙️ della Sala (host): "🏆 Contiamo i punti" acceso o spento (spento coi punti già dati: prima chiede).
  // I posti per le scelte dei passi dopo ci sono già, nascosti: "🗳️ Scegliamo insieme" (Passo 6) e la Compagnia (Passo 3)
  function foglioSala(U) {
    if (document.querySelector(".sl-velo")) return;
    var velo;
    var chk = el("input", { type: "checkbox", "aria-label": "Classifica della serata" }); chk.checked = !!(sala && sala.torneo);
    function accendi(si) {
      if (!sala) return;
      if (si && !sala.torneo) sala.torneo = { punti: {}, nomi: sala.membri.map(function (m) { return m.nome; }), n: 0, ultima: null, finito: false };
      else if (!si) sala.torneo = null;
      sala._bcast(); disegnaSalaHost();
      chk.checked = !!sala.torneo;
    }
    chk.addEventListener("change", function () {
      if (chk.checked) return accendi(true);
      if (!(sala && sala.torneo && sala.torneo.n)) return accendi(false);
      chk.checked = true;   // (resta acceso finché non si conferma)
      chiediConferma("Spegnere la classifica?", "I punti di stasera si perdono.", "Spegni", function () { accendi(false); });
    });
    function chiudi() { if (velo.parentNode) velo.parentNode.removeChild(velo); }
    // con la Sala della serata la Classifica della serata è sempre accesa: l'host la può solo azzerare o chiudere con la premiazione
    var T0 = sala && sala.torneo, sempre = salaSempre() && !!T0;
    var corpo = el("div", { class: "sl-foglio-corpo" }, [
      rigaCompSala(chiudi),   // (in cima: "📌 Fanne la nostra Compagnia", o il nome e il link fisso della Compagnia)
      sempre ? el("div", { class: "sl-viva-opz sl-serata" }, [
        el("b", { text: "🏆 Classifica della serata" }),
        el("small", { text: "Sempre accesa: a fine partita ognuno prende punti per come è arrivato (più il gioco è difficile, più punti vale)." }),
        el("div", { class: "sl-serata-tasti" }, [
          el("button", { class: "btn btn-fantasma", type: "button", text: "🔄 Azzera", disabled: T0.n ? null : "disabled", onclick: function () {
            chiediConferma("Azzerare la classifica?", "I punti di stasera ripartono da zero.", "🔄 Azzera", function () {
              if (!sala || !sala.torneo) return;
              var T = sala.torneo; T.punti = {}; T.n = 0; T.ultima = null; T.finito = false; T.nomi = sala.membri.map(function (m) { return m.nome; });
              chiudi(); sala._bcast(); disegnaSalaHost();
            });
          } }),
          el("button", { class: "btn btn-fantasma", type: "button", text: "🏁 Chiudi e premia", disabled: T0.n ? null : "disabled", onclick: function () {
            chiediConferma("Chiudere la serata e premiare?", "Tutti vedranno il podio finale.", "🏁 Premia", function () { chiudi(); salaTorneoFine(); });
          } })
        ])
      ]) : el("div", { class: "sl-viva-opz" }, [
        el("label", { class: "sl-interruttore" }, [ el("span", { text: "🏆 Classifica della serata" }), chk ]),
        el("small", { text: "A fine partita ognuno prende punti per come è arrivato: più il gioco è difficile, più punti vale. La classifica si vede nella Sala." })
      ]),
      rigaInsieme(),   // (Passo 6: "🗳️ Scegliamo insieme")
      el("div", { class: "sl-viva-opz", hidden: "hidden", "data-posto": "compagnia" }),   // (Passo 3: la Compagnia)
      el("p", { class: "modulo-nota", text: "Per far uscire qualcuno, tieni premuto sul suo avatar. In alto, «🔒 Chiudi» chiude la porta: non entra nessun altro." })
    ]);
    velo = el("div", { class: "sl-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: "⚙️ La Sala" }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        corpo,
        el("button", { class: "btn btn-primario", text: "✅ Fatto", onclick: chiudi })
      ])
    ]);
    document.body.appendChild(velo);
  }

  // ---------- HOST ----------
  // opz.torneo = torneo online: la stessa sala, con la classifica che si somma
  // opz.riapri = la Sala salvata (la pagina si è ricaricata o l'app si è chiusa): si riapre con lo stesso codice,
  //   gli stessi amici e lo stesso torneo; chi non torna entro 30 secondi viene tolto
  // opz.gioco = id del gioco da cui si è toccato "Online": parte appena la Sala ha il suo codice
  // Senza profilo (con la Sala sempre accesa) la Sala si apre lo stesso: nome dell'ultima volta, o "Come ti chiami?" una volta
  // La Compagnia (Passo 3): opz.codiceFisso = la Sala usa quel codice (6 lettere); opz.comp = { nome, emoji, rv };
  //   opz.gen = la generazione (1, 2, 3… sale quando la Sala passa a un altro); opz.sopra = la sessione della Sala morta che
  //   sto riaprendo (la sua foto non conta come "occupata"); opz.eredita = { membri, torneo, giocate, porta, nomi } (una Sala
  //   che continua: i membri hanno 30 s per rientrare, come in riapri); opz.mioId = il mio id da amico in quella Sala;
  //   opz.nome = il mio nome nella Sala se diverso da quello del profilo ("Luca 2").
  //   Con un codice fisso (o riaprendo) prima si guarda la stanza: se c'è la Sala viva di un altro si entra da amico (cediSala)
  function creaSala(opz) {
    if (opz && opz.target) opz = null;   // (dal tasto: arriva il tocco, non le opzioni)
    var R0 = (opz && opz.riapri) || null;
    var EZ = (!R0 && opz && opz.eredita) || null;
    var CF = !R0 && opz && opz.codiceFisso ? String(opz.codiceFisso).toUpperCase() : null;
    var elimG = R0 ? ((R0.elim && R0.elim.gioco) || null) : ((opz && typeof opz.eliminazione === "string") ? opz.eliminazione : null);
    var torn = R0 ? !!R0.torneo : (!!(opz && opz.torneo === true) || (salaSempre() && !elimG));   // (con la Sala della serata la Classifica della serata è accesa da sola)
    var gPartenza = !R0 && opz && opz.gioco ? giocoDa(opz.gioco) : null;
    // opz.torneino = { gioco, imp, box, resto, livello, attesi }: la stanza di un gioco a due diventa il torneino (vedi torneinoDaSaletta);
    // opz.codice = il codice della Sala già deciso (chi era nella stanza lo riceve prima che la Sala si apra)
    var torO = !R0 && !elimG && opz && opz.torneino && giocoDa(opz.torneino.gioco) ? opz.torneino : null;
    if (!(window.SGNet && SGNet.disponibile())) return salaSenzaRete();
    var io = profiloAttivo();
    if (!io) {
      if (!salaSempre() && !R0) return schermataAccesso(function () { creaSala(opz); });
      var hostR = R0 ? (R0.membri || []).filter(function (m) { return m && m.id === "host"; })[0] : null;
      var nomeH = String((opz && opz.nomeHost) || (R0 && R0.nomeHost) || nomeOspiteSalvato() || ((gruppo[0] && gruppo[0].nome) || "")).trim().slice(0, 16);
      if (!nomeH) return schermataNomeSala(opz);   // una volta sola: poi il telefono se lo ricorda
      io = { nome: nomeH, emoji: "🙂", omino: (hostR && ominoOk(hostR.omino)) || (window.SGOmino ? SGOmino.casuale(nomeH) : null) };
    }
    tieniAcceso(true);   // la Sala: lo schermo resta acceso finché si gioca
    if (sala && sala.tVivo) clearInterval(sala.tVivo);
    // una Sala sola per telefono: quella di prima si chiude (chi chiama ha già chiesto se va bene). Il trasloco nella
    // Compagnia (p3-b) la lascia da sé
    if (sala && !(opz && opz.trasloco)) chiudiSala();
    var conPr = !!profiloAttivo();
    var membri = [{ id: "host", nome: String((opz && opz.nome) || io.nome).slice(0, 16), emoji: io.emoji, omino: io.omino || null, pr: conPr ? 1 : 0 }];
    if (R0) (R0.membri || []).forEach(function (m) { if (m && m.id && m.id !== "host") membri.push(m); });
    // una Sala che continua (riaperta da un amico): io non ci sono due volte; chi la teneva prima diventa uno che deve
    // rientrare (ex: quando entra col suo id nuovo e lo stesso nome prende il suo posto)
    if (EZ) (EZ.membri || []).forEach(function (m) {
      if (!m || !m.id || typeof m !== "object") return;
      if ((opz.mioId && m.id === opz.mioId) || stessoNome(m.nome, membri[0].nome)) return;
      if (m.id === "host") m = Object.assign({}, m, { id: "ex-" + Math.random().toString(36).slice(2, 8), ex: 1 });
      membri.push({ id: String(m.id), nome: String(m.nome || "Amico").slice(0, 16), emoji: m.emoji || "🙂", omino: ominoOk(m.omino), pr: m.pr ? 1 : 0, ex: m.ex ? 1 : undefined });
    });
    var RZ = R0 || EZ;   // (riaperta o ereditata: chi c'era ha 30 secondi per tornare)
    sala = { rete: null, codice: R0 ? R0.codice : (CF || "…"), pronta: false, membri: membri, gioco: null, stanza: null, inGioco: false,
      nato: (R0 && +R0.nato) || Date.now(), gen: (R0 && +R0.gen) || (+(opz && opz.gen) || 1), dev: idTelefono(), vice: [], riaperta: !!R0,
      comp: (R0 && R0.comp) || (opz && opz.comp) || (EZ && EZ.comp) || null,
      torneo: R0 ? (R0.torneo || null) : (EZ && EZ.torneo && typeof EZ.torneo === "object" ? EZ.torneo : (torn ? { punti: {}, nomi: [io.nome], n: 0, ultima: null, finito: false } : null)),
      elim: R0 ? (R0.elim || null) : (elimG ? { gioco: elimG, iniziato: false, finito: false, turni: [], nomi: {}, campione: null, gironi: {} } : (torO ? nuovoTorneino(torO.gioco, torO.imp, torO, torO.attesi || []) : null)), inPartitaK: null, attesi: null, regole: {},
      fase: null, fuori: {}, ctx: null, sceglie: false,   // fase: del gioco in corso; fuori: { id: stanza } chi è uscito apposta dal gioco; ctx: quello del gioco lanciato; sceglie: l'host sta scegliendo il prossimo gioco
      giocate: (R0 && R0.giocate) || (EZ && EZ.giocate && typeof EZ.giocate === "object" ? EZ.giocate : {}), duello: null,   // giocate: { nome: partite } ("Chi gioca?"); duello: un gioco a due senza l'host (salaDuello)
      // "👑 Chi vince resta" (la serie e il record di stasera): restano se la pagina si ricarica, col subentro e col trasloco
      resta: restaDaPrima(R0, EZ, "resta"), restaRec: restaDaPrima(R0, EZ, "restaRec"),
      // "🗳️ Scegliamo insieme": l'interruttore è del telefono dell'host; i giochi di stasera restano (ricarica, subentro, trasloco)
      insieme: insiemeSalvato(), voto: null, votoN: 0,
      giochiFatti: (function (f) { return Array.isArray(f) ? f.filter(function (x) { return typeof x === "string"; }).slice(-30) : []; })((R0 && R0.giochiFatti) || (EZ && EZ.giochiFatti)) };
    // il voto di prima (pagina ricaricata: riparte da capo; subentro: continua) si riapre quando la Sala è di nuovo mia
    var votoPrima = votoValido(R0 && R0.voto) ? R0.voto : (EZ && votoValido(EZ.voto) ? EZ.voto : null), votoCont = !R0 && !!votoPrima;
    var S0 = sala;
    // il subentro (p3-c) con una partita che continua (il duello di due amici, o un gioco col suo host di riserva): la Sala
    // nuova la tiene com'è e chi ci gioca ci resta. Io resto nel gioco se ci stavo (EZ.ctx: il mio, diventato da host)
    if (EZ && EZ.gioco && EZ.stanza && giocoDa(EZ.gioco)) {
      sala.gioco = EZ.gioco; sala.stanza = EZ.stanza; sala.fase = EZ.fase || "gioco"; sala.fuori = EZ.fuori || {}; sala.scelti = EZ.scelti || null;
      var Dz = EZ.duello;
      if (Dz && Dz.stanza === EZ.stanza) sala.duello = { a: Dz.a, b: Dz.b, na: Dz.na, nb: Dz.nb, stanza: Dz.stanza, gioco: Dz.gioco || EZ.gioco, imp: Dz.imp || {},
        n: Dz.fine ? +Dz.fine.n || 0 : 0, fine: Dz.fine || null, visti: Dz.fine ? (function (o) { o[String(Dz.fine.giro | 0)] = 1; return o; })({}) : {} };
      if (EZ.ctx) { sala.inGioco = true; sala.ctx = EZ.ctx; }
    }
    // (Passo 5) la mia pagina si è ricaricata con un gioco in corso nella Sala: il duello dei due amici continua (era sul
    // telefono di chi l'ha aperto); il mio gioco, se sa riprendere e la sua partita è ricordata, si riapre con lo STESSO codice
    // appena la Sala è di nuovo mia (riprendiG): la prima foto della Sala dice già il gioco, così gli amici restano dentro
    var riprendiG = null, RG = R0 && R0.gioco && R0.gioco.id && R0.gioco.stanza && !R0.elim ? R0.gioco : null, gRG = RG ? giocoDa(RG.id) : null;
    if (gRG) {
      var Dr = RG.duello && RG.duello.stanza === RG.stanza && RG.duello.a && RG.duello.b ? RG.duello : null;
      if (Dr || (gRG.riprende && ripresaDi(gRG.id, RG.stanza))) {
        sala.gioco = gRG.id; sala.stanza = RG.stanza; sala.fase = typeof RG.fase === "string" ? RG.fase : "gioco";
        sala.fuori = RG.fuori && typeof RG.fuori === "object" ? RG.fuori : {}; sala.scelti = Array.isArray(RG.scelti) ? RG.scelti : null;
        if (Dr) sala.duello = { a: Dr.a, b: Dr.b, na: Dr.na, nb: Dr.nb, stanza: Dr.stanza, gioco: Dr.gioco || gRG.id, imp: Dr.imp || {},
          n: Dr.fine ? +Dr.fine.n || 0 : 0, fine: Dr.fine || null, visti: Dr.fine ? (function (o) { o[String(Dr.fine.giro | 0)] = 1; return o; })({}) : {} };
        else {
          sala.inGioco = true; riprendiG = { g: gRG, imp: RG.imp || {} };
          // (chi era nella partita: anche se adesso è via, quando ricarica torna nella partita e non resta nella Sala)
          if (Array.isArray(RG.nel)) sala.nelSeme = { stanza: RG.stanza, ids: RG.nel.filter(function (id) { return typeof id === "string"; }).slice(0, 40) };
        }
      }
    }
    if (sala.torneo && EZ) membri.forEach(function (m) { segnaNomeT(sala.torneo, m.nome); });
    // la Compagnia che apro io: va (o resta) tra le mie, in cima
    if (CF && sala.comp && window.SGCompagnia) try { SGCompagnia.salva({ c: CF, n: sala.comp.nome, e: sala.comp.emoji, rv: sala.comp.rv || 0 }); SGCompagnia.usata(CF); } catch (e) {}
    // ogni volta che la Sala cambia la mando a tutti e me la segno (per riaprirla se la pagina si ricarica: stessa gen e stesso
    // nato, così chi è dentro capisce che è sempre la stessa Sala)
    function salva() { if (sala === S0 && sala.codice && sala.codice !== "…") ricordaMiaSala({ codice: sala.codice, nomeHost: sala.membri[0] && sala.membri[0].nome, membri: sala.membri, torneo: sala.torneo, elim: sala.elim, giocate: sala.giocate, porta: sala.rete && sala.rete._sv && sala.rete._sv.porta ? 1 : 0,
      nato: sala.nato, gen: sala.gen, comp: sala.comp || null, s: sala.rete ? sala.rete.sessione : null, gioco: giocoSalvato(),
      resta: sala.resta || null, restaRec: sala.restaRec || null,
      giochiFatti: sala.giochiFatti || [], voto: sala.voto ? { n: sala.voto.n, giochi: sala.voto.giochi, voti: sala.voto.voti, fase: sala.voto.fase, ruota: sala.voto.ruota || null } : null }); if (sala === S0) ricordaSalaIeri(sala); }
    // (Passo 5) il gioco in corso nella Sala: se la pagina si ricarica la Sala lo riapre con lo stesso codice e la partita
    // riprende (il gioco col suo t.ripresa), oppure il duello dei due amici continua. null = nessun gioco da ritrovare
    function giocoSalvato() {
      if (!sala.gioco || !sala.stanza || sala.elim) return null;
      var D = sala.duello && sala.duello.stanza === sala.stanza ? sala.duello : null;
      return { id: sala.gioco, stanza: sala.stanza, fase: sala.fase || "lobby", fuori: sala.fuori || {}, scelti: sala.scelti || null, imp: D ? null : (sala.impGioco || null),
        nel: nelGiocoSala(sala),   // (chi è nella partita: se la pagina si ricarica, chi è via e poi torna rientra nella partita)
        duello: D ? { a: D.a, b: D.b, na: D.na, nb: D.nb, stanza: D.stanza, gioco: D.gioco, imp: D.imp || {}, fine: D.fine || null } : null };
    }
    // (col gioco: fase = a che punto è, nel = chi è dentro la sua stanza, fuori = chi ne è uscito apposta;
    //  duello = il gioco a due tra due amici senza l'host: chi apre la stanza, chi entra, com'è finita)
    function bcast(soloFoto) {   // (soloFoto: la manda e basta, senza riscrivere la Sala ricordata: la pausa)
      var D = sala && sala.gioco && sala.duello && sala.duello.stanza === sala.stanza ? sala.duello : null;
      if (sala) sala.vice = viceDi();
      // ("🗳️ Scegliamo insieme": chi non è più nella Sala perde il voto; chi arriva o se ne va cambia "hanno votato tutti")
      var Vb = sala && sala.voto;
      if (Vb && Vb.fase === "voto") {
        var ciB = {}; sala.membri.forEach(function (x) { ciB[x.id] = 1; });
        Object.keys(Vb.voti).forEach(function (id) { if (!ciB[id]) delete Vb.voti[id]; });
        votoTimer();
      }
      // (punto: "round 3 di 5" del gioco in corso, da t.aCheSiamo; con un'altra stanza si ricomincia da vuoto)
      if (sala && sala.puntoDi !== sala.stanza) { sala.punto = ""; sala.puntoDi = sala.stanza; }
      // (nato, gen, dev: chi tiene la Sala, per la regola "una Sala sola"; vice: chi la prende se me ne vado; comp: la Compagnia)
      if (sala && sala.rete) sala.rete.invia({ t: "sala", codice: sala.codice, nato: sala.nato, gen: sala.gen, dev: sala.dev, vice: sala.vice, comp: sala.comp || null,
        membri: sala.membri, gioco: sala.gioco, stanza: sala.stanza, torneo: sala.torneo, elim: sala.elim,
        fase: sala.gioco ? (sala.fase || "lobby") : null, nel: sala.gioco ? nelGiocoSala(sala) : [], fuori: sala.gioco ? fuoriSala(sala) : [],
        sceglie: !sala.gioco && sala.sceglie ? (sala.sceglie === "sfida" ? 2 : 1) : undefined, giocate: sala.giocate || {},
        sc: sala.gioco && sala.scelti ? sala.scelti : undefined,
        punto: sala.gioco && sala.punto ? sala.punto : undefined,
        duello: D ? { a: D.a, b: D.b, na: D.na, nb: D.nb, stanza: D.stanza, gioco: D.gioco, imp: D.imp, fine: D.fine } : undefined,
        trasloco: sala.trasloco || undefined,   // (la Sala si è spostata nella Compagnia: chi la legge ci va da solo)
        // cede: l'host passa la Sala a quell'amico ("👑 Passa la Sala"); pausa: l'host è uscito un attimo dall'app (ora sua):
        // se poi sparisce, i vice aspettano di più (90 s e 120 s) prima di prendere la Sala
        cede: sala.cede || undefined, pausa: sala.pausa || undefined,
        // "👑 Chi vince resta": la serie (coda, campione, la sfida dopo, l'ora dell'host per il conto) e il record di stasera
        resta: sala.resta ? restaFoto(sala.resta) : undefined, restaRec: sala.restaRec || undefined,
        // "🗳️ Scegliamo insieme": l'interruttore (gli amici sanno che si vota), il voto o la ruota, i giochi di stasera
        insieme: sala.insieme ? 1 : undefined, voto: sala.voto ? votoFoto(sala.voto) : undefined,
        giochiFatti: sala.giochiFatti && sala.giochiFatti.length ? sala.giochiFatti : undefined });
      if (!soloFoto) salva();
      if (sala && (sala.resta || RESTA_FINE)) restaAggiorna();   // (le mie scritte: fine sfida, targhetta, coda nella Sala)
      if (sala && sala.voto && VOTO_UI && VOTO_UI.S === sala) votoAggiornaUI();   // (la mia scheda del voto: chi ha votato, quanti siamo)
    }
    function agg() {
      bcast(); if (!sala) return;
      if (sala.elim) { if (torneinoArrivati()) return; return seguiHost(); }   // torneo a eliminazione: la sala si vede solo quando non sto giocando
      // (mentre l'host sceglie il gioco o chi gioca non lo riporto nella Sala perché un amico è entrato o ha ridetto "ci sono")
      if (!sala.inGioco && !(sala.torneo && sala.torneo.finito) && !hostSceglie()) disegnaSalaHost();
      else rinfrescaAttesi();   // (nella saletta del gioco: chi manca)
    }
    sala._bcast = bcast;
    // il nome della Compagnia arrivato da un amico: si prende solo se è più nuovo (rv). true = cambiato (agg() lo manda a tutti)
    function compPiuNuova(c) {
      if (!c || !sala || !sala.comp || !c.nome || (+c.rv || 0) <= (+sala.comp.rv || 0)) return false;
      sala.comp = { nome: String(c.nome).slice(0, 24), emoji: String(c.emoji || sala.comp.emoji).slice(0, 8), rv: +c.rv };
      if (window.SGCompagnia) try { SGCompagnia.aggiorna(sala.codice, sala.comp); } catch (e) {}
      return true;
    }
    sala.tVivo = setInterval(function () { if (sala !== S0) return clearInterval(S0.tVivo); salva(); }, 60000);   // anche se non succede niente: "è ancora aperta"
    if (torO) {
      // il torneino nato da una stanza: le regole del gioco di prima; si parte quando sono arrivati tutti (torneinoArrivati)
      // o al massimo dopo 8 secondi con chi c'è (se non è arrivato nessuno resta la Sala)
      sala._regoleBox = torO.box || null;
      setTimeout(function () {
        var E = sala === S0 && sala.elim;
        if (!E || !E.torneino || E.iniziato) return;
        delete E.attesi;
        if (sala.membri.length >= 2) return partiTorneino(E);
        sala.elim = null; sala.regoleElim = null; sala._regoleBox = null; agg();
      }, 8000);
    }
    if (RZ) {
      // l'host ha ricaricato mentre ci si sedeva («✋ Scegliete voi»): il conto alla rovescia riparte (almeno 15 s), se no la Sala resta ferma
      var Ec = sala.elim;
      if (Ec && Ec.torneino && Ec.coppie === "scelte" && Ec.scade && !Ec.iniziato) {
        Ec.scade = Math.max(Ec.scade, Date.now() + 15000);
        sala.tCoppie = setTimeout(function () { if (sala === S0 && sala.elim === Ec && !Ec.iniziato) avviaElim(); }, Ec.scade - Date.now());
      }
      // chi c'era ha 30 secondi per tornare (rientra da solo appena vede la Sala riaperta)
      sala.attesi = {}; membri.forEach(function (m) { if (m.id !== "host") sala.attesi[m.id] = 1; });
      setTimeout(function () {
        if (sala !== S0 || !sala.attesi) return;
        var via = Object.keys(sala.attesi); sala.attesi = null;
        if (!via.length) return;
        sala.membri = sala.membri.filter(function (m) { return via.indexOf(m.id) < 0; });
        if (sala.elim) via.forEach(function (id) { if (sala.elim.gironi) delete sala.elim.gironi[id]; elimUscito(id); });
        via.forEach(restaVia);   // ("👑 Chi vince resta": chi non è tornato esce dalla coda)
        agg();
      }, 30000);
      NOMI_SEME = {}; membri.forEach(function (m) { if (!m.ex) NOMI_SEME[m.id] = m.nome; });   // i nomi già dati ("Luca 2") restano a chi li aveva
      PORTA_SALA_SEME = !!RZ.porta;   // la porta resta com'era (chiusa: rientra solo chi c'era)
      if (R0) pillola("riapro", "🔁 Riapro la tua Sala (" + R0.codice + ")…", "blu", 4000);
    }
    // la rete della Sala: sente anche le foto degli altri host sullo stesso codice (ascoltaStato: due Sale → ne resta una),
    // ricollegandosi guarda prima di parlare (guardaRitorno: un telefono addormentato non copre la Sala di stasera),
    // il testamento dice la generazione; col codice fisso (o riaprendo) guarda anche la prima volta (guardaPrima)
    var opzR = { ascoltaStato: true, guardaRitorno: 1200, testamento: { g: sala.gen } };
    var codR = R0 ? R0.codice : (CF || (opz && opz.codice ? String(opz.codice).toUpperCase() : null));
    if (codR) opzR.codice = codR;
    if (CF || RZ) { opzR.guardaPrima = 1500; var sopra = (opz && opz.sopra) || (R0 && R0.s) || null; if (sopra) opzR.sopra = sopra; }
    sala.rete = SGNet.ospita("__sala", {
      onCodice: function (c) {
        if (sala !== S0) return;   // (la Sala di prima, traslocata nella Compagnia: non tocca quella nuova)
        sala.codice = c;
        // "Online" da un gioco: il gioco parte adesso, che la Sala ha il suo codice (prima era "…")
        // (col codice fisso prima si guarda se la Sala è già di un altro: il gioco parte quando la Sala è davvero mia)
        if (gPartenza && sala === S0 && !(CF || RZ)) { var gp = gPartenza; gPartenza = null; salva(); return salaPreparaGioco(gp); }
        agg();
      },
      onConnesso: function () {
        if (sala !== S0) return;
        sala.pronta = true;
        if (sala.resta && !S0.restaVista) { S0.restaVista = true; restaRiprendi(); }   // ("👑 Chi vince resta" continua: Sala riaperta, subentro, trasloco)
        if (gPartenza) { var gp2 = gPartenza; gPartenza = null; bcast(); return salaPreparaGioco(gp2); }
        if (riprendiG) { var rg = riprendiG; riprendiG = null; bcast(); return salaRiprendiGioco(rg.g, rg.imp); }   // (la Sala è mia: il gioco riprende)
        if (votoPrima && !sala.gioco) { var vp = votoPrima; votoPrima = null; if (salaVotoRiprendi(vp, votoCont)) return; }   // ("🗳️ Scegliamo insieme": il voto si riapre)
        agg();
      },
      // collegandomi c'è già la Sala viva di un altro su questo codice: se vince la mia parlo, se no entro da amico
      onOccupata: function (m) {
        if (sala !== S0 || S0.ceduta) return false;
        if (!m || m.t !== "sala" || vinceLaMia(S0, m)) return true;
        setTimeout(function () { cediSala(m, S0); }, 0);
        return false;
      },
      // la foto di un altro host sullo stesso codice (due aperte insieme, o un telefono che torna): ne resta una sola.
      // Se vince la mia la rimetto subito (l'altra aveva coperto la foto trattenuta), se no entro da amico
      onStato: function (m) {
        if (sala !== S0 || S0.ceduta || !m || m.t !== "sala" || !m._s || !S0.rete || m._s === S0.rete.sessione) return;
        // sto passando la Sala a un amico: appena c'è la sua (generazione più alta) me ne vado in home
        if (S0.passa && (+m.gen || 1) > S0.gen) return salaPassata(S0, m);
        if (!vinceLaMia(S0, m)) return cediSala(m, S0);
        if (Date.now() - (S0.rimessa || 0) > 400) { S0.rimessa = Date.now(); bcast(); }
      },
      onAddio: function (id) {
        if (sala !== S0 || S0.passa) return;   // (gli amici escono dalla Sala di prima perché sono passati nella Compagnia, o in quella dell'amico a cui la passo: restano)
        sala.membri = sala.membri.filter(function (m) { return m.id !== id; }); if (sala.attesi) delete sala.attesi[id]; if (sala.fuori) delete sala.fuori[id]; if (sala.elim) { if (sala.elim.gironi) delete sala.elim.gironi[id]; elimUscito(id); }
        restaVia(id);   // ("👑 Chi vince resta": via dalla coda; se giocava, vince l'altro)
        if (sala.duello && sala.duello.a === id && sala.stanza === sala.duello.stanza) return fineDuelloSala();   // chi aveva aperto il duello è uscito dalla Sala
        agg();
      },
      onMsg: function (id, m) {
        if (sala !== S0) return;   // (la Sala di prima, traslocata: chi bussa lì legge il trasloco nella sua foto)
        if (S0.passa) return;   // (la sto passando a un amico: chi bussa adesso entra nella sua, io non mando più niente)
        // un amico ha rinominato la Compagnia sul suo telefono (dalla lista delle compagnie): vince il nome più nuovo
        if (m && m.t === "comp") { if (compPiuNuova(m.comp)) agg(); return; }
        if (m && m.t === "esito" && sala.elim) return esitoPartita(m.k, !!m.vinto, id);   // torneo a eliminazione: com'è finita una partita
        if (m && m.t === "girone" && sala.elim) return scegliGironeElim(id, m.g);   // torneo a eliminazione: dove si siede
        // il duello (gioco a due senza l'host): com'è finito e a che punto è. Vale solo da chi l'ha aperto e per la sua stanza
        if (m && (m.t === "salaEsito" || m.t === "duelloFase")) return msgDuello(id, m);
        // "🗳️ Scegliamo insieme": il voto di un amico ({ n: quale voto, g: il gioco })
        if (m && m.t === "voto") return salaVotoSegna(id, m.n, m.g);
        // un amico è uscito apposta dal gioco (non lo aspettiamo) o ci rientra ("Rientra ▶")
        if (m && (m.t === "esco" || m.t === "rientro")) {
          if (!sala.membri.some(function (x) { return x.id === id; })) return;
          if (m.t === "esco") restaEsce(id, m.stanza);   // ("👑 Chi vince resta": uno dei due lascia la sfida, vince l'altro)
          // chi ha aperto il duello torna nella Sala: il duello è finito per tutti
          if (m.t === "esco" && sala.duello && sala.duello.a === id && m.stanza && m.stanza === sala.duello.stanza && sala.stanza === m.stanza) return fineDuelloSala();
          sala.fuori = sala.fuori || {};
          if (m.t === "esco") { if (!m.stanza || m.stanza !== sala.stanza || sala.fuori[id] === m.stanza) return; sala.fuori[id] = m.stanza; }
          else { if (!sala.fuori[id]) return; delete sala.fuori[id]; }
          bcast(); rinfrescaAttesi(); return;
        }
        if (!m || m.t !== "join") return;
        if (sala.attesi) delete sala.attesi[id];   // è tornato (Sala riaperta)
        var gia = sala.membri.filter(function (x) { return x.id === id; })[0];
        if (!gia) {
          // (i nomi doppi li ha già sistemati lo strato comune della rete: il secondo "Luca" arriva come "Luca 2")
          var nome = String(m.nome || "Amico").slice(0, 16), nuovo = { id: id, nome: nome, emoji: m.emoji || "🙂", omino: ominoOk(m.omino), pr: m.pr ? 1 : 0 };
          // chi teneva la Sala prima (ex) torna col suo id nuovo: prende il suo posto
          var ex = sala.membri.filter(function (x) { return x.ex && stessoNome(x.nome, nome); })[0];
          if (ex) { sala.membri[sala.membri.indexOf(ex)] = nuovo; if (sala.attesi) delete sala.attesi[ex.id]; }
          else sala.membri.push(nuovo);
          restaEntra(id, ex ? ex.id : null);   // ("👑 Chi vince resta": in fondo alla coda)
          segnaNomeT(sala.torneo, nome);
        } else if (!!gia.pr !== !!m.pr) gia.pr = m.pr ? 1 : 0;   // (chi ha il profilo può fare da vice)
        // la Compagnia con un nome più nuovo (rinominata dal telefono di un amico): la prendo e la mando a tutti
        compPiuNuova(m.comp);
        agg();
      },
      onErrore: function () { salaSenzaRete(); }
    }, opzR);
    if (sala.rete && sala.rete._sv) sala.rete._sv.salva = salva;   // (la porta chiusa o aperta si ricorda subito)
    if ((!gPartenza || CF || RZ) && !sala.inGioco) disegnaSalaHost();   // (con un gioco di partenza si va dritti nella sua saletta; nel subentro dentro un gioco si resta nel gioco)
    else if (riprendiG) mostra(schermata({ icona: riprendiG.g.icona || "🎲", titolo: "Riprendo la partita…", sotto: riprendiG.g.nome }));   // (un attimo: la Sala torna mia, poi il gioco)
  }

  function chiudiSala() { try { if (sala && sala.rete) sala.rete.chiudi(); } catch (e) {} if (sala && sala.tVivo) clearInterval(sala.tVivo); sala = null; dimenticaMiaSala(); }

  // su questo codice c'è già la Sala viva di un altro, che vince (aperta prima, o di una generazione più nuova): la mia
  // si lascia in silenzio (senza testamento e senza pulire la sua foto) ed entro da amico. Una volta sola
  function cediSala(m, S0) {
    if (!sala || sala !== S0 || S0.ceduta) return;
    S0.ceduta = true;
    var C = S0.codice, io0 = S0.membri[0] || {}, eraMia = !!(S0.riaperta || S0.pronta), chi = nomeHostDi(m) || "un amico";
    try { S0.rete.lascia(); } catch (e) {}
    clearInterval(S0.tVivo); clearTimeout(S0.tCoppie);
    if (S0.inGioco) {   // (la partita era sul mio telefono: non c'è più)
      // ...ma un gioco con l'host di riserva lo porta avanti un amico (o lo prende adesso): dalla sua stanza esco come se
      // fossi sparito, perché un "chiusa apposta" di chi la teneva prima farebbe uscire dalla partita chi gioca col vice
      var conRiserva = !!(partitaCorrente && partitaCorrente.viva() && riservaPer(partitaCorrente));
      lasciaPartita(); if (conRiserva && SGNet.lasciaGiochi) SGNet.lasciaGiochi(); else SGNet.chiudiGiochi();
    }
    chiudiTabelloneElim();
    sala = null; dimenticaMiaSala();
    pillola("riapro", null);
    pillola("sala", eraMia ? "👋 Bentornato! Ora la Sala la tiene " + chi + ": sei dentro come amico" : "👋 La Sala l'aveva già aperta " + chi + ": sei dentro", "verde", 3500);
    var io = profiloAttivo();
    ricordaStanza({ sala: C }); segnaLinkSessione({ sala: C });
    // (lo schermo resta quello di adesso finché non arriva la Sala dell'amico: si cambia una volta sola)
    entraInSala(C, (io && io.nome) || io0.nome, (io && io.emoji) || io0.emoji || "🙂", (io && io.omino) || io0.omino || null, { subito: true });
  }

  // ---------- L'HOST CHE SE NE VA (Passo 3, p3-c): "Passa la Sala", il vice, chi torna ----------
  // Esci dalla Sala (host): con un amico che può tenerla, "👑 Passa la Sala a Giulia" / "🚪 Chiudi per tutti" / "Resta";
  // senza, la domanda di sempre. esci = chiude per tutti (come oggi). Nel torneo a eliminazione niente vice
  function esciDallaSala(domanda, esci) {
    var v = viceDi(), chi = v.length ? membroSala(v[0]) : null;
    if (!chi) return chiediConferma(domanda, null, "Chiudi", esci);
    chiediScelta("Te ne vai?", "La serata può continuare senza di te.", [
      { testo: "👑 Passa la Sala a " + chi.nome, classe: "btn-primario", fn: function () { passaSala(chi.id); } },
      { testo: "🚪 Chiudi per tutti", classe: "btn-rosso", fn: esci }
    ]);
  }
  function membroSala(id) { return sala ? sala.membri.filter(function (m) { return m && m.id === id; })[0] || null : null; }
  // "👑 Passa la Sala a Giulia": la foto della Sala dice "cede: Giulia" e lei la riapre con la generazione dopo; io aspetto la
  // sua foto (onStato) e me ne vado in home. Se in 8 s non arriva provo il secondo vice; se nessuno risponde, chiedo
  var ATTESA_PASSA = 8000;
  // quanto aspetta il vice (primo, secondo) prima di prendere la Sala dell'host sparito; con la pausa recente (meno di 3 minuti
  // prima: è uscito un attimo dall'app) di più. Sui telefoni veri il broker se ne accorge 30-40 s dopo: si aggiunge a questi
  var VICE_ATTESA = [[20000, 30000], [90000, 120000]], VICE_PAUSA = 3 * 60 * 1000;
  function passaSala(id) {
    var S0 = sala, chi = membroSala(id);
    if (!S0 || S0.ceduta || !chi) return;
    S0.provati = S0.provati || {}; S0.provati[id] = 1;
    S0.passa = id; S0.cede = id; S0._bcast();
    var s = schermata({ icona: "👑", titolo: "Passo la Sala a " + chi.nome + "…", sotto: "La serata continua: tu esci dalla Sala" });
    s._contenuto.appendChild(el("div", { class: "sl-passa" }, [
      el("div", { class: "sl-passa-av", "aria-hidden": "true", html: window.SGOmino && chi.omino ? SGOmino.svg(chi.omino, { busto: true }) : "" }),
      el("p", { class: "modulo-nota", text: "Un attimo: " + chi.nome + " prende la Sala e gli amici restano con lui." })
    ]));
    mostra(s);
    clearTimeout(S0.tPassa);
    S0.tPassa = setTimeout(function () {
      if (sala !== S0 || S0.passa !== id || S0.ceduta) return;
      var altro = viceDi().filter(function (x) { return !S0.provati[x]; })[0];
      if (altro) return passaSala(altro);
      var tutti = Object.keys(S0.provati).map(function (x) { var mm = membroSala(x); return mm ? mm.nome : null; }).filter(Boolean);
      if (!tutti.length) tutti = [chi.nome];
      S0.passa = null; S0.cede = null; S0.provati = null; S0._bcast();
      disegnaSalaHost();
      chiediScelta(tutti.length > 1 ? tutti.slice(0, -1).join(", ") + " e " + tutti[tutti.length - 1] + " non rispondono" : tutti[0] + " non risponde", "La Sala è ancora tua.", [
        { testo: "👥 Resto nella Sala", classe: "btn-primario", fn: function () {} },
        { testo: "🚪 Chiudi per tutti", classe: "btn-rosso", fn: function () { if (sala === S0) { chiudiSala(); schermataHome(); } } }
      ], null);
    }, ATTESA_PASSA);
  }
  // la Sala dell'amico a cui l'ho passata è arrivata: me ne vado in silenzio (senza testamento: la sua foto resta)
  function salaPassata(S0, m) {
    if (sala !== S0 || S0.ceduta) return;
    S0.ceduta = true; clearTimeout(S0.tPassa);
    try { S0.rete.lascia(); } catch (e) {}
    clearInterval(S0.tVivo); clearTimeout(S0.tCoppie);
    if (S0.inGioco) { lasciaPartita(); SGNet.chiudiGiochi(); }
    sala = null; dimenticaMiaSala(); tieniAcceso(false);
    schermataHome();
    pillola("sala", "👑 Ora la Sala la tiene " + (nomeHostDi(m) || "un amico"), "verde", 3500);
  }
  // la partita in corso resta quando cambia l'host della Sala? Solo se la sua stanza non era sul telefono che se ne va:
  // il duello di due amici, o un gioco col suo host di riserva (Passo 5: g.riserva || hostDiRiserva(g))
  function haRiserva(g) { return !!(g && g.riserva && g.riprende) || hostDiRiserva(g); }   // (riserva vale solo con riprende: riservaPer)
  // il vice prende la Sala (perche: "passata" = me l'ha passata l'host; "sparito" = l'host non c'è più). m = l'ultima foto
  // della Sala. Lascio la Sala da amico e la riapro con lo stesso codice e la generazione dopo, da "host": gli stessi amici
  // (con 30 s per rientrare: lo fanno da soli), la stessa classifica e le stesse partite giocate; il mio id di prima diventa
  // "host" (G7). Chi la teneva prima non è tra gli attesi: se torna entra da amico
  function subentraSala(S, m, perche) {
    if (!S || salaG !== S || S.subentro || !m || m.t !== "sala" || !profiloAttivo()) return;
    S.subentro = true; clearTimeout(S.tVice); S.tVice = null;
    var C = S.codice, vecchio = mioIdSala(S), nome = S.nome, chi = nomeHostDi(m) || "L'host";
    var SVs = S.rete && S.rete._sv, porta = !!(SVs && SVs.porta);
    try { S.rete.lascia(); } catch (e) {}
    salaG = null; dimenticaStanza(); pillola("host", null);
    function id2(x) { return x === vecchio ? "host" : x; }
    var membri = (m.membri || []).filter(function (x) { return x && x.id && x.id !== "host" && x.id !== vecchio; });
    var ez = { membri: membri, torneo: m.torneo || null, giocate: m.giocate || {}, porta: porta ? 1 : 0, comp: m.comp || null,
      resta: restaEredita(m.resta, vecchio), restaRec: m.restaRec || null,   // ("👑 Chi vince resta" continua: gli id rimappati, 6-6)
      voto: !m.gioco ? votoEredita(m.voto, vecchio) : null, giochiFatti: Array.isArray(m.giochiFatti) ? m.giochiFatti : [] };   // ("🗳️ Scegliamo insieme": il voto continua, 6-6)
    // la partita in corso: resta solo se non era sul telefono che se ne va (duello di due amici, gioco con l'host di riserva)
    var g = m.gioco && m.stanza ? giocoDa(m.gioco) : null, D = g && m.duello && m.duello.stanza === m.stanza ? m.duello : null;
    var tieni = !!(g && ((D && D.a !== "host" && D.b !== "host") || (!D && haRiserva(g))));
    var P = partitaCorrente && partitaCorrente.viva() && partitaCorrente.salaCtx ? partitaCorrente : null;
    var resto = tieni && P && (P.salaCtx.stanza || P.salaCtx.duello) === m.stanza ? P.salaCtx : null;
    if (tieni) {
      ez.gioco = m.gioco; ez.stanza = m.stanza; ez.fase = typeof m.fase === "string" ? m.fase : "gioco";
      ez.fuori = {}; (Array.isArray(m.fuori) ? m.fuori : []).forEach(function (x) { if (x !== "host") ez.fuori[id2(x)] = m.stanza; });
      ez.scelti = Array.isArray(m.sc) ? m.sc.filter(function (x) { return x !== "host"; }).map(id2) : null;
      if (D) ez.duello = Object.assign({}, D, { a: id2(D.a), b: id2(D.b) });
      if (resto) ez.ctx = resto;
    }
    if (!resto) { lasciaPartita(); SGNet.chiudiGiochi(); togliVia(); FINE = null; }   // (la partita era sul telefono che è andato via)
    creaSala({ codiceFisso: C, comp: m.comp ? compDi(C, m) : null, gen: (+m.gen || 1) + 1, nome: nome, sopra: m._s || null, mioId: vecchio, eredita: ez });
    pillola("sala", perche === "passata" ? "👑 " + chi + " ti ha passato la Sala" : "👑 " + chi + " è uscito: ora la Sala la tieni tu", "verde", 4000);
  }
  // si torna nella Sala da un gioco lanciato dalla Sala. Da amico: la Sala non mi riporta dentro da sola (uscitoDa se ne sono
  // uscito io: "Rientra"; finitoDa se la partita è finita). Se intanto la Sala è passata a me (p3-c) torno nella mia: il gioco
  // rimasto finisce per tutti (il duello no se ci giocano gli altri due: lo apro io solo se l'ho aperto io)
  function tornaInSala(codiceSala, code, finita) {
    lasciaPartita(); SGNet.chiudiGiochi();
    if (salaG && salaG.codice === codiceSala) {
      salaG.inGioco = null; salaG.dFine = null;
      if (finita) salaG.finitoDa = code;
      else { salaG.uscitoDa = code; try { salaG.rete.invia({ t: "esco", stanza: code }); } catch (e) {} }   // (uscito apposta: la Sala non mi aspetta)
      return disegnaSalaOspite();
    }
    if (sala && codiceSala && sala.codice === codiceSala) {
      if (sala.stanza === code && sala.duello && sala.duello.a === "host") { sala.inGioco = true; return fineDuelloSala(); }
      if (sala.stanza === code && !sala.duello) { sala.gioco = null; sala.stanza = null; sala.fase = null; sala.fuori = {}; sala.scelti = null; sala._bcast(); }
      sala.inGioco = false; sala.ctx = null; sala.fineDuello = null;
      return disegnaSalaHost();
    }
    disegnaSalaOspite();
  }
  // ---- l'host che esce un attimo dall'app (WhatsApp per mandare il link): nella foto della Sala va "pausa" (i vice aspettano
  //  90 s invece di 20 se poi sparisce). Tornando dopo più di 10 minuti la Sala è "addormentata": finisce senza pubblicare
  //  niente (intanto l'ha presa un amico, o gli amici sono andati via) ----
  var SALA_DORME = 10 * 60 * 1000;
  document.addEventListener("visibilitychange", function () {
    var S0 = sala;
    if (!S0 || S0.ceduta || S0.passa || !S0._bcast) return;
    if (document.hidden) { if (!S0.nascosta) { S0.nascosta = Date.now(); S0.pausa = S0.nascosta; S0._bcast(true); } return; }
    var via = S0.nascosta ? Date.now() - S0.nascosta : 0;
    S0.nascosta = 0;
    if (via > SALA_DORME) return salaAddormentata(S0);
    if (S0.pausa) { S0.pausa = null; S0._bcast(true); }
  });
  function salaAddormentata(S0) {
    if (sala !== S0 || S0.ceduta) return;
    S0.ceduta = true; clearTimeout(S0.tPassa);
    // (se il collegamento è rimasto vivo, gli amici devono sapere che non ci sono più: un "host sparito" solo dal vivo, non
    //  trattenuto, così un vice prende la Sala; la foto trattenuta resta quella di chi c'è)
    try { if (S0.rete && S0.rete.inviaVeloce) S0.rete.inviaVeloce({ t: "__hostgone", s: S0.rete.sessione, g: S0.gen }); } catch (e) {}
    try { S0.rete.lascia(); } catch (e) {}
    clearInterval(S0.tVivo); clearTimeout(S0.tCoppie);
    if (S0.inGioco) { lasciaPartita(); SGNet.chiudiGiochi(); }
    chiudiTabelloneElim();
    sala = null; dimenticaMiaSala(); tieniAcceso(false);
    schermataHome();
    pillola("sala", "😴 Eri via da un po': la Sala è finita", "grigia", 4000);
  }

  // chi apre la Sala senza profilo: il nome dell'ultima volta (o "Come ti chiami?" una volta, col 🎲)
  function nomeOspiteSalvato() { try { return (localStorage.getItem("sg-nome-ospite") || "").trim().slice(0, 16); } catch (e) { return ""; } }
  function schermataNomeSala(opz) {
    var s = schermata({ icona: "👥", titolo: "Apri la Sala", sotto: "Un codice per tutta la serata", indietro: schermataHome });
    var input = el("input", { class: "link-campo", type: "text", maxlength: "16", placeholder: "Come ti chiami?", autocapitalize: "words", enterkeyhint: "go" });
    var avviso = el("div", { class: "link-avviso" });
    var anteprima = el("div", { class: "sl-anteprima", "aria-hidden": "true" });   // l'avatar che avrai con quel nome
    s._contenuto.appendChild(el("div", { class: "sl-benvenuto" }, [
      el("b", { class: "sl-benv-tit", text: "Come ti chiami? 🎉" }), anteprima,
      el("span", { class: "sl-benv-sotto", text: "Gli amici ti vedranno con questo nome. Tocca 🎲 per un nome buffo." })
    ]));
    s._contenuto.appendChild(input); s._contenuto.appendChild(avviso);
    dadoNome(input, anteprima);
    function apri() {
      var n = (input.value || "").trim().slice(0, 16);
      if (n.length < 2) { avviso.textContent = "Scrivi il tuo nome."; return; }
      try { localStorage.setItem("sg-nome-ospite", n); } catch (e) {}
      audioCtx();
      creaSala(Object.assign({}, opz || {}, { nomeHost: n }));
    }
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") apri(); });
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Apri la Sala ▶", onclick: apri }));
    mostra(s);
  }

  function disegnaSalaHost() {
    if (!sala) return;
    var T = sala.torneo, E = sala.elim;
    if (T && T.finito) return schermataPodioT(T, true);
    amiciStato("sala", sala.codice);   // (per gli amici: "👥 è in una Sala")
    var pronto = sala.codice && sala.codice !== "…", gE = E ? giocoDa(E.gioco) : null, TN = !!(E && E.torneino);
    var sS = saletta(gSala(!!T, E, sala.comp), {
      host: true, codice: sala.codice, pronta: sala.pronta, min: E ? 2 : 1, puoiDaSolo: !E, _rete: sala.rete,
      link: pronto ? linkSala(sala.codice, true) : "",
      sotto: TN ? "Torneo a eliminazione · Sala di " + sala.membri[0].nome : (E ? "Torneo a eliminazione · " + (gE ? gE.nome : "") : (sala.comp ? "Il link vale sempre" : "Un link per tutti i giochi")),   // (il titolo dice già "Sala online" o "Torneo")
      confermaEsci: TN ? (E.finito ? "Tornare nella Sala?" : "Fermare il torneo? Si torna tutti nella Sala.") : (E ? "Chiudere il torneo per tutti?" : (T && T.n ? "Chiudere la Sala per tutti? I punti di stasera si perdono." : "Chiudere la sala per tutti?")),
      giocatori: sala.membri.map(function (m) { return { id: m.id, nome: m.nome, omino: m.omino || null, host: m.id === "host", tu: m.id === "host" }; }),
      extra: E ? [boxElimSala(E, "host", true, sala, seguiHost)] : [boxDuelloHost(), boxInCorsoHost(), riquadroCoda(sala, true), T ? boxTorneoCorto(T, sala) : null, consiglioComp()].filter(Boolean),
      testoComincia: TN ? (E.finito ? "🎮 Prossimo gioco" : (E.iniziato ? "Torneo in corso…" : "⚔️ Via al torneo"))
        : (E ? (E.finito ? "↻ Nuovo torneo (stessi amici)" : (E.iniziato ? "Torneo in corso…" : "⚔️ Comincia il torneo")) : (T ? (T.n ? "🎮 Prossimo gioco" : "🎮 Scegli il primo gioco") : "🎮 Scegli un gioco")),
      puoComincia: E ? (!E.iniziato || E.finito) : undefined,
      nota: TN ? (E.finito ? "Con «Prossimo gioco» tornate tutti nella Sala e scegli il gioco dopo." : (E.iniziato ? "Le partite si aprono da sole sul telefono di chi gioca." : (E.scade ? "Quando sono seduti, tocca «Via al torneo»." : "Quando arrivano tutti si parte da soli.")))
        : (E ? (E.iniziato && !E.finito ? "Le partite si aprono da sole sul telefono di chi gioca." : "Ognuno tocca il girone in cui vuole giocare. Quando siete pronti, fai partire il torneo.")
        : "Scegli un gioco: parte da solo sul telefono di tutti. A fine partita si torna qui."),
      onComincia: TN ? function () { if (E.finito) { fineTorneino(); if (sala) { sala.sceglie = true; sala._bcast(); salaScegliGioco(); } } else avviaElim(); } : (E ? function () { if (E.finito) nuovoElim(); else avviaElim(); } : salaScegliGioco),
      onRegole: E ? function () { sala._bcast(); } : undefined,
      onEsci: TN ? function () { fineTorneino(); } : function () { chiudiSala(); schermataHome(); },
      // (con un amico che può tenerla: "👑 Passa la Sala a Giulia" o "🚪 Chiudi per tutti")
      esciScelta: E ? null : function (esci) { esciDallaSala(T && T.n ? "Chiudere la Sala per tutti? I punti di stasera si perdono." : "Chiudere la sala per tutti?", esci); }
    }, E ? regoleElim() : null);
    if (sS) sS.classList.toggle("con-tabellone", !!(E && (E.iniziato || (E.torneino && E.scade))));   // (a torneo in corso la stanza si stringe: prima il tabellone)
    misuraConsiglio();
  }

  // ---------- LA COMPAGNIA CHE NASCE DALLA SALA (Passo 3, p3-b) ----------
  // "📌 Fanne la nostra Compagnia" (⚙️ della Sala, o il suggerimento piccolo): un nome e un'emoji, poi la Sala "trasloca" su
  // un codice fisso di 6 lettere con gli stessi amici (stessi id), la stessa classifica, le stesse partite e la stessa porta.
  // Gli amici si spostano da soli. Si fa solo tra una partita e l'altra (niente gioco in corso, niente torneo a eliminazione)
  function puoiFareComp() { return !!(sala && !sala.gioco && !sala.elim && !sala.voto && sala.pronta && sala.codice && sala.codice.length === 4 && window.SGCompagnia && SGNet.nuovoCodice); }
  function creaCompagnia() {
    if (!puoiFareComp()) return;
    SGCompagnia.foglioNome({ titolo: "📌 La vostra compagnia", nome: "", emoji: "🍻", tasto: "📌 Crea", ok: function (nome, emoji) {
      if (!puoiFareComp()) return pillola("sala", "Si fa tra una partita e l'altra", "rosso", 2600);
      var C = SGNet.nuovoCodice(6), comp = { nome: nome, emoji: emoji, rv: Date.now() };
      var v = null; try { v = SGCompagnia.salva({ c: C, n: nome, e: emoji, rv: comp.rv }); } catch (e) {}
      if (!v) return;   // (ne ha già 8: lo dice la pillola di SGCompagnia)
      try { localStorage.setItem("sg-consiglio-comp", "9"); } catch (e) {}   // (fatta: il suggerimento non serve più)
      traslocaSala(C, comp);
      foglioCompFatta(C);
    } });
  }
  // la Sala si sposta sul codice C della Compagnia. La Sala di prima non si chiude (chi ci torna o apre il suo link deve
  // trovare la strada): la sua ultima foto trattenuta dice "trasloco: { codice, comp }" e dopo 8 s la lascio in silenzio
  function traslocaSala(C, comp) {
    var V = sala; if (!V || !V.rete) return;
    var vecchia = V.rete;
    V.trasloco = { codice: C, comp: comp };
    var kV = chiaveDi(V.codice); if (kV) chiaveDi(C, false, kV);   // (🔑 la chiave delle foto di stasera viene con noi)
    V._bcast();   // (l'ultima foto della Sala di prima: gli amici leggono il trasloco e vengono da soli)
    dimenticaMiaSala();
    dimenticaSalaIeri(V.codice);   // (ora è una Compagnia: si ritrova dalla sua tessera in home)
    // (gli id restano uguali: gli amici entrano nella Compagnia col loro id di prima; i campi della Sala per id, come duello
    //  e fuori, qui sono vuoti perché si fa solo senza un gioco in corso)
    creaSala({ codiceFisso: C, comp: comp, gen: 1, trasloco: true,
      eredita: { membri: V.membri, torneo: V.torneo, giocate: V.giocate, porta: vecchia._sv && vecchia._sv.porta ? 1 : 0, comp: comp,
        resta: V.resta || null, restaRec: V.restaRec || null, giochiFatti: V.giochiFatti || [] } });   // (gli id restano uguali: la serie passa com'è)
    if (V.resta) { clearInterval(V.tResta); V.tResta = null; }
    if (sala && sala !== V) { sala.regole = V.regole || {}; if (V.optTorneino) sala.optTorneino = V.optTorneino; }   // (le regole scelte stasera restano)
    clearInterval(V.tVivo);
    setTimeout(function () { try { vecchia.lascia(); } catch (e) {} }, 8000);
  }
  // "📌 Fatto! Ecco il link fisso": il link scritto, "📤 Manda nel gruppo" e "Più tardi"
  function foglioCompFatta(C) {
    var vv = document.querySelector(".sl-velo"); if (vv && vv.parentNode) vv.parentNode.removeChild(vv);
    var v = null; try { v = SGCompagnia.trova(C); } catch (e) {}
    var url = ""; try { url = SGCompagnia.link(C); } catch (e) { url = SG.creaLink({ gruppo: C }); }
    var velo;
    function chiudi() { if (velo.parentNode) velo.parentNode.removeChild(velo); }
    var manda = el("button", { class: "btn btn-primario", text: "📤 Manda nel gruppo", onclick: function () { SGCompagnia.condividi(C, manda); } });
    velo = el("div", { class: "sl-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio comp-fatta" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: "📌 Fatto! Ecco il link fisso" }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        el("div", { class: "sl-foglio-corpo" }, [
          el("p", { class: "comp-fatta-tit", text: v ? v.e + " " + v.n : "La vostra compagnia" }),
          el("p", { class: "modulo-nota", text: "Vale per sempre: fissatelo nel gruppo. La prossima volta entrate da lì, senza mandare niente." }),
          el("div", { class: "comp-fatta-link", text: url }),
          el("p", { class: "comp-fatta-cod" }, [ "Chi ha l'app scrive il codice ", el("b", { text: C }) ])
        ]),
        manda,
        el("button", { class: "btn btn-fantasma", text: "Più tardi", onclick: chiudi })
      ])
    ]);
    document.body.appendChild(velo);
  }
  // nel ⚙️ della Sala, in cima: "📌 Fanne la nostra Compagnia" (Sala normale) o "✏️ Nome della compagnia" e
  // "📤 Manda il link fisso" (Sala che è già una Compagnia). chiudi = chiude il foglio
  function rigaCompSala(chiudi) {
    if (!sala || !window.SGCompagnia) return null;
    if (sala.codice && sala.codice.length === 6) {
      var bLink = el("button", { class: "btn btn-fantasma", type: "button", text: "📤 Manda il link fisso", onclick: function () { SGCompagnia.condividi(sala.codice, bLink); } });
      return el("div", { class: "sl-viva-opz sl-comp-opz" }, [
        el("b", { text: "📌 " + (sala.comp ? sala.comp.emoji + " " + sala.comp.nome : "La compagnia") }),
        el("div", { class: "sl-serata-tasti" }, [
          el("button", { class: "btn btn-fantasma", type: "button", text: "✏️ Nome della compagnia", onclick: function () { chiudi(); rinominaComp(); } }),
          bLink ])
      ]);
    }
    var ok = puoiFareComp(), dopo = !!(sala.gioco || sala.elim);
    return el("div", { class: "sl-viva-opz sl-comp-opz" }, [
      el("button", { class: "btn btn-primario sl-comp-fai", type: "button", text: "📌 Fanne la nostra Compagnia", disabled: ok ? null : "disabled", onclick: function () { chiudi(); creaCompagnia(); } }),
      el("small", { text: dopo ? "Si fa tra una partita e l'altra" : "Un link fisso che vale per sempre: la prossima volta non dovete mandare niente." })
    ]);
  }
  // l'host rinomina la Compagnia della sua Sala: vince il nome più nuovo (rv), arriva a tutti con la foto della Sala
  function rinominaComp() {
    if (!sala || !sala.comp || !window.SGCompagnia) return;
    var C = sala.codice;
    SGCompagnia.foglioNome({ titolo: "✏️ Nome della compagnia", nome: sala.comp.nome, emoji: sala.comp.emoji, ok: function (nome, emoji) {
      if (!sala || sala.codice !== C) return;
      sala.comp = { nome: nome, emoji: emoji, rv: Date.now() };
      try { if (!SGCompagnia.aggiorna(C, sala.comp)) SGCompagnia.salva({ c: C, n: nome, e: emoji, rv: sala.comp.rv }); } catch (e) {}
      sala._bcast();
      if (!sala.inGioco) disegnaSalaHost();
    } });
  }
  // il suggerimento piccolo nella Sala dell'host: "📌 Giocate spesso insieme? Fatene una Compagnia" (con ✕).
  // Con almeno 2 amici, in una Sala normale, tra una partita e l'altra; dopo 3 ✕ non torna. Sempre lo stesso nodo
  function chiusureConsiglio() { try { return +(localStorage.getItem("sg-consiglio-comp") || 0) || 0; } catch (e) { return 9; } }
  function consiglioComp() {
    if (!puoiFareComp() || sala.membri.length < 3 || chiusureConsiglio() >= 3 || !profiloAttivo()) return null;
    if (!sala._consC) {
      var nodo = el("div", { class: "sl-consiglio-comp" }, [
        el("button", { class: "sl-cc-testo", type: "button", text: "📌 Giocate spesso insieme? Fatene una Compagnia", onclick: function () { creaCompagnia(); } }),
        el("button", { class: "sl-cc-x", type: "button", "aria-label": "Non ora", text: "✕", onclick: function () {
          try { localStorage.setItem("sg-consiglio-comp", String(chiusureConsiglio() + 1)); } catch (e) {}
          if (sala) sala._consNo = true;
          if (nodo.parentNode) nodo.parentNode.removeChild(nodo);
        } })
      ]);
      sala._consC = nodo;
    }
    return sala._consNo ? null : sala._consC;
  }
  // il suggerimento compare solo se ci sta: se con lui il centro della Sala scorrerebbe (o la stanza resta troppo bassa), si
  // nasconde. Si misura subito dopo averlo messo (prima che lo schermo si ridisegni: non lampeggia) e quando cambia la misura
  function misuraConsiglio() {
    var n = sala && sala._consC;
    if (!n || !n.parentNode || !document.body.contains(n)) return;
    var sc = n.closest(".saletta-schermo"), c = sc && sc.querySelector(".contenuto"), st = sc && sc.querySelector(".sl-stanza");
    if (!c || !st) return;
    if (n.hidden) n.hidden = false;
    var troppo = c.scrollHeight > c.clientHeight + 1 || st.getBoundingClientRect().height < 190;
    if (troppo) n.hidden = true;
    if (!misuraConsiglio.su) { misuraConsiglio.su = true; window.addEventListener("resize", function () { misuraConsiglio(); }); }
  }

  // nella Sala dell'host, un duello in corso tra due amici: "⚔️ Giulia e Luca giocano a Tris · 👀 Guarda";
  // finito: "🏁 Giulia contro Luca: ha vinto Giulia · ⚔️ Altra sfida". Lo stesso nodo finché non cambia (niente lampeggio)
  function boxDuelloHost() {
    var D = sala && sala.gioco && sala.duello && sala.duello.stanza === sala.stanza ? sala.duello : null;
    if (!D) return null;
    var g = giocoDa(D.gioco), finito = sala.fase === "fine" && D.fine, k = D.stanza + "|" + (finito ? "f" + D.fine.n : "g");
    if (sala._boxD && sala._boxD.k === k) return sala._boxD.nodo;
    var primi = finito ? D.fine.cl.filter(function (r) { return (r.pos || 1) === 1; }) : [];
    var testo = finito ? "🏁 " + D.na + " contro " + D.nb + ": " + (primi.length === 1 ? "ha vinto " + primi[0].nome : "pareggio")
      : "⚔️ " + D.na + " e " + D.nb + " giocano " + aGioco(g ? g.nome : "");
    var nodo = el("div", { class: "sl-incorso prossima sl-duello" }, [
      el("span", { class: "sl-inc-testo" }, [ el("b", { text: testo }) ]),
      finito ? (sala.resta ? null : el("button", { class: "btn btn-primario btn-piccolo", text: "⚔️ Altra sfida", onclick: function () { if (g) salaAltraSfida(g); } }))
        : el("button", { class: "btn btn-fantasma btn-piccolo", text: "👀 Guarda", onclick: function () { if (sala && sala.duello === D) guardaDuelloHost(D); } })
    ]);
    sala._boxD = { k: k, nodo: nodo };
    return nodo;
  }
  // l'host della Sala fuori dal gioco in corso (non il duello): il gioco lo tiene un amico (riserva) e io ne sono uscito
  // ("Rientra ▶" e "👀 Guarda"), oppure la Sala mi è arrivata col gioco dentro (solo "👀 Guarda"). Stesso nodo, cambiano le scritte
  function boxInCorsoHost() {
    var A = sala;
    if (!A || !A.gioco || !A.stanza || A.inGioco || A.elim || (A.duello && A.duello.stanza === A.stanza)) return null;
    var g = giocoDa(A.gioco); if (!g) return null;
    var fuori = !!(A.fuori && A.fuori.host === A.stanza), k = A.stanza + "|" + (fuori ? "r" : "g");
    var testa = "🎮 Si gioca " + aGioco(g.nome) + (A.fase === "gioco" && A.punto ? " · " + A.punto : "");
    var B = A._boxG;
    if (B && B.k === k) { if (B.b.textContent !== testa) B.b.textContent = testa; return B.nodo; }
    var b = el("b", { text: testa });
    var tasti = [ el("button", { class: "btn btn-fantasma btn-piccolo", text: "👀 Guarda", onclick: function () { guardaGiocoHost(); } }) ];
    if (fuori) tasti.unshift(el("button", { class: "btn btn-primario btn-piccolo sl-inc-entra", text: "Rientra ▶", onclick: function () { entraGiocoHost(); } }));
    var nodo = el("div", { class: "sl-incorso prossima" + (fuori ? " due-tasti" : "") }, [
      el("span", { class: "sl-inc-testo" }, [ b, el("small", { text: fuori ? "ne sei uscito: rientra quando vuoi" : "giocano gli amici: guardali quando vuoi" }) ]),
      fuori ? el("div", { class: "sl-inc-tasti" }, tasti) : tasti[0] ]);
    A._boxG = { k: k, nodo: nodo, b: b };
    return nodo;
  }
  // l'host della Sala guarda il gioco in corso (senza entrare: la targhetta "👀 Guardi"); dalle foto la Sala sa a che punto è.
  // Quando si torna in saletta entro a giocare da solo (non nei giochi a due)
  function guardaGiocoHost() {
    var S0 = sala, g = S0 && S0.gioco ? giocoDa(S0.gioco) : null, code = S0 && S0.stanza;
    if (!g || !code || S0.inGioco) return disegnaSalaHost();
    var visto = !!S0.fase && S0.fase !== "lobby";
    SGNet.chiudiGiochi();
    S0.inGioco = true;   // (la Sala non si ridisegna sopra la partita)
    function torna() {
      if (sala !== S0 || S0.guardoCtx !== ctx) return;
      S0.guardoCtx = null; lasciaPartita(); SGNet.chiudiGiochi(); togliGuardo();
      S0.inGioco = false; disegnaSalaHost();
    }
    var ctx = S0.guardoCtx = {
      stanza: code, guardaSala: true,
      esci: function () { torna(); }, fine: function () { torna(); }, risultato: function () {},
      // la stanza del gioco si è chiusa (partita finita): il gioco non c'è più, nemmeno nella Sala
      chiusa: function () {
        if (sala === S0 && S0.guardoCtx === ctx && S0.stanza === code) { S0.gioco = null; S0.stanza = null; S0.fase = null; S0.fuori = {}; S0.scelti = null; S0._bcast(); }
        torna();
      },
      fase: function (f) {
        if (sala !== S0 || S0.guardoCtx !== ctx || S0.stanza !== code) return;
        if (S0.fase !== f) { S0.fase = f; S0._bcast(); }
        if (f !== "lobby") { visto = true; return; }
        if (!visto || aDue(g)) return;
        visto = false;
        pillola("guardo", "✋ Si ricomincia: entri anche tu!", "verde", 2500);
        setTimeout(function () { if (sala === S0 && S0.guardoCtx === ctx) entraGiocoHost(); }, 0);
      }
    };
    linkParams = { gioco: g.id, stanza: code, guarda: 1 };
    avviaPartita(g, [], {}, null, ctx);
  }
  // l'host della Sala (ri)entra a giocare nel gioco tenuto da un amico, da amico (lo stesso id di prima: ritrova il suo posto)
  function entraGiocoHost() {
    var S0 = sala, g = S0 && S0.gioco ? giocoDa(S0.gioco) : null, code = S0 && S0.stanza;
    if (!g || !code) return disegnaSalaHost();
    if (S0.fuori && S0.fuori.host) { delete S0.fuori.host; S0._bcast(); }   // (la Sala mi aspetta di nuovo)
    S0.guardoCtx = null;
    lasciaPartita(); SGNet.chiudiGiochi(); togliGuardo();
    linkParams = { gioco: g.id, stanza: code };
    avviaPartita(g, [], {}, null, ctxGiocoAmico(code));
  }

  // l'host della Sala sta scegliendo il gioco («Quale gioco?», «Tris in 4», «Chi gioca?»): la Sala non lo copre
  function hostSceglie() { var s = app && app.firstElementChild; return !!(sala && s && s.classList && (s.classList.contains("sala-sceglie") || s.classList.contains("chi-gioca-sc") || s.classList.contains("torneino-sc") || s.classList.contains("sala-voto"))); }
  // o.scelgoIo = "Scelgo io" (con "🗳️ Scegliamo insieme" acceso: questa volta un tocco sceglie il gioco, come prima)
  function salaScegliGioco(o) {
    o = o && !o.target ? o : {};
    if (sala && sala.resta) restaFerma();   // (l'host sceglie un altro gioco: "👑 Chi vince resta" finisce, il record resta)
    var T = sala && sala.torneo;
    // "🗳️ Scegliamo insieme": 3 giochi già accesi (in cima), un tocco ne accende o spegne uno, "🗳️ Si vota!" apre il voto per tutti
    var sel = !o.scelgoIo && votoPossibile() ? proponiTre() : null, tessere = {}, bVota = null;
    var s = schermata({ icona: sel ? "🗳️" : "🎮", titolo: sel ? "Proponi 3 giochi" : (T ? "Quale gioco?" : "Scegli un gioco"),
      sotto: T ? "Parte per tutti · più è difficile, più punti vale" : (sel ? "Poi votate tutti e decide la ruota" : "Parte per tutta la sala"),
      indietro: function () { if (sala && sala.sceglie) { sala.sceglie = false; sala._bcast(); } disegnaSalaHost(); } });   // (gli amici non leggono più "Paky sceglie…")
    s.classList.add("sala-sceglie");
    function segna() {
      Object.keys(tessere).forEach(function (id) { tessere[id].classList.toggle("proposta", sel.indexOf(id) >= 0); });
      var tx = "🗳️ Si vota! (" + sel.length + ")";
      if (bVota.textContent !== tx) bVota.textContent = tx;
      bVota.disabled = sel.length < 2;
    }
    // (se sono già 3, il tocco su un altro prende il posto del più vecchio)
    function tocca(id) {
      var i = sel.indexOf(id);
      if (i >= 0) sel.splice(i, 1);
      else { if (sel.length >= 3) sel.shift(); sel.push(id); }
      segna();
    }
    if (sel) s._contenuto.appendChild(el("div", { class: "sl-proposta" }, [
      el("span", { class: "sl-prop-tx" }, [ el("b", { text: "🗳️ Proponi 3 giochi" }), el("small", { text: "tocca per cambiarli" }) ]),
      el("button", { class: "btn btn-fantasma btn-piccolo", type: "button", text: "Scelgo io", onclick: function () { salaScegliGioco({ scelgoIo: true }); } })
    ]));
    var griglia = el("div", { class: "griglia-giochi" });
    var lista = giochi.filter(function (g) { return giocoOnline(g) && !g.senzaSala; });   // (i giochi senzaSala hanno una stanza loro)
    if (sel) lista = sel.map(giocoDa).concat(lista.filter(function (g) { return sel.indexOf(g.id) < 0; }));   // (i proposti in cima)
    lista.forEach(function (g) {
      // (con la Sala sempre accesa niente schermata delle impostazioni: si va dritti nella saletta, le regole stanno nel ⚙️)
      var tess = tesseraGioco(g, function () { if (sel) return tocca(g.id); if (salaSempre()) salaPreparaGioco(g); else schermataPreGioco(g, { sala: true }); });
      // quanti giocano, detto prima di sceglierlo: i giochi a due (gli altri guardano), i posti contati, chi manca
      var et = etichettaPosti(g, sala ? sala.membri.length : 1);
      if (et) tess.querySelector(".info").appendChild(el("div", { class: "tess-adue" + (et.c ? " " + et.c : ""), text: et.t }));
      if (sel) { tess.appendChild(el("span", { class: "tess-voto", "aria-hidden": "true", text: "🗳️" })); tessere[g.id] = tess; }
      griglia.appendChild(tess);
    });
    s._contenuto.appendChild(griglia);
    if (sel) {
      bVota = el("button", { class: "btn btn-primario sl-si-vota", type: "button", onclick: function () { if (sel.length >= 2) salaVotoApri(sel.slice()); } });
      s._piede.appendChild(bVota);
      segna();
    }
    mostra(s);
  }
  function aDue(g) { return !!(g && (g.postiOnline === 2 || GIOCHI_ELIMINAZIONE[g.id])); }
  // l'etichetta di un gioco nell'elenco della Sala, dai suoi posti online e da quanti siamo: { t: testo, c: classe in più }
  function etichettaPosti(g, quanti) {
    var posti = postiDi(g), min = minDi(g, "online");
    if (aDue(g)) return { t: "⚔️ In 2: gli altri guardano" };
    if (min > quanti) return { t: "Servono almeno " + min, c: "pochi" };   // (si può sceglierlo lo stesso: gli amici possono arrivare)
    if (posti < quanti) return { t: "Max " + posti + ": gioca chi scegli", c: "posti" };
    return { t: "Fino a " + posti, c: "tutti" };
  }

  // ---------- "🗳️ SCEGLIAMO INSIEME" (Passo 6, p6-e): l'host propone 3 giochi, tutti votano 20 s, la ruota decide ----------
  // sala.insieme = l'interruttore del ⚙️ (ricordato sul telefono dell'host in sg-insieme); sala.giochiFatti = i giochi di
  // stasera (l'ultimo in fondo); sala.voto = { n, giochi: [id], voti: { idMembro: idGioco }, fase: "voto" | "ruota",
  //   scade (ora dell'host), ruota: { spicchi: [{ g, n }], vince, theta, parte (ora dell'host in cui gira) } }.
  // Nella foto della Sala il voto ha anche ora (Date.now dell'host all'invio): chi la legge stima lo scarto (G8).
  // Il disegno (scheda del voto e ruota) è di js/scegliamo.js; qui la rete e la Sala
  var VOTO_SECONDI = 20, VOTO_UI = null;   // VOTO_UI: la scheda del voto sullo schermo { S (sala o salaG), n, s, sc }
  function insiemeSalvato() { try { return localStorage.getItem("sg-insieme") === "1"; } catch (e) { return false; } }
  function segnaFatto(gid) {
    if (!sala || !gid) return;
    var f = (sala.giochiFatti || []).filter(function (x) { return x !== gid; }); f.push(gid);
    sala.giochiFatti = f.slice(-30);
  }
  // si può proporre: interruttore acceso, almeno in due, niente torneo a eliminazione né "Chi vince resta"
  function votoPossibile() { return !!(sala && sala.insieme && !sala.elim && !sala.resta && sala.membri.length >= 2 && window.SGScegliamo); }
  // i 3 giochi proposti: adatti a quanti siamo, non quello appena giocato, prima quelli non ancora fatti stasera,
  // un po' a caso, al massimo uno a due
  function proponiTre() {
    var n = sala ? sala.membri.length : 1, fatti = (sala && sala.giochiFatti) || [], ultimo = fatti[fatti.length - 1];
    var tutti = giochi.filter(giocoOnline);
    var adatti = tutti.filter(function (g) { return aDue(g) ? n >= 2 : minDi(g, "online") <= n; });
    if (adatti.length < 3) adatti = tutti;
    var ordine = mischia(adatti.filter(function (g) { return g.id !== ultimo && fatti.indexOf(g.id) < 0; }))
      .concat(mischia(adatti.filter(function (g) { return g.id !== ultimo && fatti.indexOf(g.id) >= 0; })), adatti.filter(function (g) { return g.id === ultimo; }));
    var out = [], due = 0;
    ordine.forEach(function (g) { if (out.length >= 3 || (aDue(g) && due)) return; if (aDue(g)) due++; out.push(g.id); });
    ordine.forEach(function (g) { if (out.length < 3 && out.indexOf(g.id) < 0) out.push(g.id); });   // (pochi giochi adatti: anche un secondo a due)
    return out;
  }
  // nel ⚙️ della Sala: l'interruttore "🗳️ Scegliamo insieme"
  function rigaInsieme() {
    var chk = el("input", { type: "checkbox", "aria-label": "Scegliamo insieme" }); chk.checked = !!(sala && sala.insieme);
    chk.addEventListener("change", function () {
      if (!sala) return;
      sala.insieme = !!chk.checked;
      try { localStorage.setItem("sg-insieme", sala.insieme ? "1" : "0"); } catch (e) {}
      sala._bcast();
    });
    return el("div", { class: "sl-viva-opz sl-insieme" }, [
      el("label", { class: "sl-interruttore" }, [ el("span", { text: "🗳️ Scegliamo insieme" }), chk ]),
      el("small", { text: "Proponi 3 giochi, tutti votano, gira la ruota" })
    ]);
  }
  function votoInfo(ids) { return (ids || []).map(function (id) { var g = giocoDa(id); return { id: id, icona: (g && g.icona) || "🎲", nome: (g && g.nome) || String(id) }; }); }
  function votoValido(v) {
    return !!(v && typeof v === "object" && typeof v.n === "number" && Array.isArray(v.giochi) && v.giochi.length >= 2 && v.voti && typeof v.voti === "object"
      && (v.fase === "voto" || (v.fase === "ruota" && v.ruota && Array.isArray(v.ruota.spicchi) && v.ruota.spicchi.length)));
  }
  // il voto per la foto della Sala (con l'ora dell'host)
  function votoFoto(V) { return { n: V.n, giochi: V.giochi, voti: V.voti, fase: V.fase, scade: V.scade, ruota: V.ruota || undefined, ora: Date.now() }; }
  // (Passo 3) la Sala passa al vice: il voto continua con gli id rimappati (il suo id di prima → "host"; chi la teneva se n'è andato)
  function votoEredita(v, vecchio) {
    if (!votoValido(v)) return null;
    var voti = {};
    Object.keys(v.voti).forEach(function (id) { if (id === "host") return; voti[id === vecchio ? "host" : id] = v.voti[id]; });
    return { n: v.n, giochi: v.giochi.slice(0, 3), voti: voti, fase: v.fase, ruota: v.ruota || null };
  }
  // chi può votare adesso: i membri collegati (non chi è sparito un attimo, non chi deve ancora tornare)
  function votoVotanti() {
    if (!sala) return [];
    var forse = (sala.rete && sala.rete._sv && sala.rete._sv.forse) || {};
    return sala.membri.filter(function (m) { return m && m.id && !forse[m.id] && !(sala.attesi && sala.attesi[m.id]); });
  }
  // l'estrazione: ogni gioco ha voti + 1 spicchi, ogni spicchio vale uguale. { spicchi: [{ g, n }], vince (indice), theta, g }
  function votoEstrai(ids, voti, caso) {
    caso = caso || Math.random;
    var conti = SGScegliamo.conta(ids, voti || {}), lista = SGScegliamo.spicchi(votoInfo(ids), conti);
    var vince = Math.min(lista.length - 1, Math.floor(caso() * lista.length));
    return { spicchi: conti, vince: vince, theta: 0.15 + caso() * 0.7, g: lista[vince] ? lista[vince].g : ids[0] };
  }
  // si apre il voto (host): tutti vedono la scheda. eredita = il voto che continua (subentro del vice)
  function salaVotoApri(ids, eredita) {
    if (!sala || !window.SGScegliamo) return;
    ids = (ids || []).filter(function (id, i, a) { return giocoDa(id) && a.indexOf(id) === i; }).slice(0, 3);
    if (ids.length < 2) return salaScegliGioco({ scelgoIo: true });
    if (sala.resta) restaFerma(true);
    // (un gioco degli amici ancora aperto, con l'host già nella Sala: finisce, come quando si sceglie un altro gioco)
    if (sala.gioco && !sala.inGioco) { sala.gioco = null; sala.stanza = null; sala.fase = null; sala.fuori = {}; sala.ctx = null; sala.duello = null; sala.scelti = null; SGNet.chiudiGiochi(1500); }
    clearTimeout(sala.tVoto);
    var V = sala.voto = eredita ? { n: eredita.n, giochi: ids, voti: eredita.voti || {}, fase: "voto", scade: eredita.scade }
      : { n: (sala.votoN || 0) + 1, giochi: ids, voti: {}, fase: "voto", scade: Date.now() + VOTO_SECONDI * 1000 };
    sala.votoN = Math.max(sala.votoN || 0, V.n);
    var S0 = sala;
    S0.votoTutti = false;
    S0.tVoto = setTimeout(function () { if (sala === S0) salaVotoChiudi(V.n); }, Math.max(0, V.scade - Date.now()));
    S0.votoUltimo = Date.now(); S0._bcast();
    schermataVotoGiochi(S0, V, true);
    votoTimer();   // (ereditato: forse hanno già votato tutti)
  }
  // un voto (anche il mio): uno per membro, si può cambiare
  function salaVotoSegna(id, n, g) {
    var V = sala && sala.voto;
    if (!V || V.fase !== "voto" || +n !== V.n || V.giochi.indexOf(g) < 0) return;
    if (id !== "host" && !membroSala(id)) return;
    if (V.voti[id] === g) return;
    V.voti[id] = g;
    votoAggiornaUI(); votoInvia(); votoTimer();
  }
  // la foto della Sala col voto: al massimo una ogni 300 ms (tanti tocchi insieme vanno in una)
  function votoInvia() {
    var S0 = sala; if (!S0) return;
    var d = 300 - (Date.now() - (S0.votoUltimo || 0));
    if (d <= 0) { clearTimeout(S0.tVotoB); S0.tVotoB = null; S0.votoUltimo = Date.now(); return S0._bcast(); }
    if (!S0.tVotoB) S0.tVotoB = setTimeout(function () { S0.tVotoB = null; if (sala !== S0) return; S0.votoUltimo = Date.now(); S0._bcast(); }, d);
  }
  // quando si chiude: hanno votato tutti quelli collegati (dopo un attimo, così si vede l'ultimo voto), se no allo scadere
  function votoTimer() {
    var S0 = sala, V = S0 && S0.voto; if (!V || V.fase !== "voto") return;
    var vv = votoVotanti(), tutti = vv.length > 0 && vv.every(function (m) { return !!V.voti[m.id]; });
    if (tutti === !!S0.votoTutti) return;
    S0.votoTutti = tutti; clearTimeout(S0.tVoto);
    var n = V.n, quando = tutti ? Math.min(V.scade, Date.now() + 700) : V.scade;
    S0.tVoto = setTimeout(function () { if (sala === S0) salaVotoChiudi(n); }, Math.max(0, quando - Date.now()));
  }
  // "‹" dalla scheda del voto (host): il voto si annulla, tutti nella Sala
  function salaVotoAnnulla() {
    var V = sala && sala.voto;
    if (V && V.fase !== "voto") return;   // (la ruota gira già: si aspetta lei)
    if (sala) { clearTimeout(sala.tVoto); clearTimeout(sala.tVotoB); sala.tVotoB = null; sala.voto = null; sala.sceglie = false; sala._bcast(); }
    VOTO_UI = null;
    disegnaSalaHost();
  }
  // il voto si chiude: la ruota (spicchio e theta li decide l'host, uguali su tutti i telefoni)
  function salaVotoChiudi(n) {
    var V = sala && sala.voto;
    if (!V || V.fase !== "voto" || (n != null && n !== V.n)) return;
    clearTimeout(sala.tVoto); clearTimeout(sala.tVotoB); sala.tVotoB = null;
    var ci = {}; sala.membri.forEach(function (m) { ci[m.id] = 1; });
    Object.keys(V.voti).forEach(function (id) { if (!ci[id]) delete V.voti[id]; });   // (chi è uscito ha perso il voto)
    var e = votoEstrai(V.giochi, V.voti);
    V.fase = "ruota"; V.ruota = { spicchi: e.spicchi, vince: e.vince, theta: e.theta, parte: Date.now() + 400 };
    if (VOTO_UI && VOTO_UI.S === sala) VOTO_UI.sc.chiudi();
    sala.votoUltimo = Date.now(); sala._bcast();
    salaVotoRuota();
  }
  function salaVotoRuota() {
    var S0 = sala, V = S0 && S0.voto; if (!V || V.fase !== "ruota" || !V.ruota) return;
    var R = V.ruota, n = V.n;
    SGScegliamo.ruota({ spicchi: R.spicchi, giochi: votoInfo(V.giochi), vince: R.vince, theta: R.theta, parte: R.parte, scarto: 0,
      poi: function (g) { salaVotoFatto(S0, n, g); } });
  }
  // la ruota si è fermata: il gioco parte per tutti (con "Chi gioca?" se servono posti, come quando lo tocca l'host)
  function salaVotoFatto(S0, n, gid) {
    if (sala !== S0 || !S0.voto || S0.voto.n !== n) return;
    var g = giocoDa(gid) || giocoDa(S0.voto.giochi[0]);
    S0.voto = null; VOTO_UI = null;
    S0._bcast();
    if (g) salaPreparaGioco(g); else disegnaSalaHost();
  }
  // la Sala si riapre col voto di prima: pagina ricaricata (il voto riparte da capo con gli stessi giochi) o subentro del vice
  // (continua coi voti di prima). Se la ruota aveva già deciso si va dritti al gioco uscito
  function salaVotoRiprendi(vp, continua) {
    if (!sala || !votoValido(vp) || !window.SGScegliamo) return false;
    sala.votoN = Math.max(sala.votoN || 0, vp.n);
    if (vp.fase === "ruota") {
      var x = SGScegliamo.spicchi(votoInfo(vp.giochi), vp.ruota.spicchi)[vp.ruota.vince | 0], g = x && giocoDa(x.g);
      sala.voto = null; sala._bcast();
      if (g) salaPreparaGioco(g); else disegnaSalaHost();
      return true;
    }
    salaVotoApri(vp.giochi, continua ? { n: vp.n, voti: vp.voti, scade: Date.now() + 15000 } : null);
    return true;
  }
  // i voti con nome e avatar di chi ha votato (per gli avatar sotto le tessere)
  function votiPersone(S, V) {
    var o = {};
    Object.keys(V.voti || {}).forEach(function (id) {
      var m = (S.membri || []).filter(function (x) { return x && x.id === id; })[0];
      if (m) o[id] = { g: V.voti[id], nome: m.nome, omino: m.omino || null };
    });
    return o;
  }
  // la scheda del voto (host e amici): S = la Sala (sala o salaG), V = il voto
  function schermataVotoGiochi(S, V, host) {
    var mio = host ? "host" : mioIdSala(S), quanti = (S.membri || []).length;
    var s = schermata({ indietro: host ? salaVotoAnnulla : function () { chiediConferma("Uscire dalla Sala?", null, "🚪 Esci", function () { VOTO_UI = null; chiudiSalaOspite(); schermataHome(); }); } });
    s.classList.add("sala-voto");
    var mioG = V.voti[mio] || (!host && S.votoMio && S.votoMio.n === V.n ? S.votoMio.g : null);
    var sc = SGScegliamo.scheda({
      giochi: V.giochi.map(function (id) { var g = giocoDa(id), et = g ? etichettaPosti(g, quanti) : null; return { id: id, icona: (g && g.icona) || "🎲", nome: (g && g.nome) || id, sotto: et ? et.t : "" }; }),
      mio: mioG, voti: votiPersone(S, V), scade: V.scade, scarto: host ? 0 : (S.votoScarto || 0), host: host, membri: host ? votoVotanti().length : quanti,
      onVota: function (g) {
        if (host) return salaVotoSegna("host", V.n, g);
        if (salaG !== S || !S.rete) return;
        S.votoMio = { n: V.n, g: g };
        try { S.rete.invia({ t: "voto", n: V.n, g: g }); } catch (e) {}
      },
      onChiudi: function () { salaVotoChiudi(V.n); }
    });
    s._contenuto.appendChild(sc.nodo);
    VOTO_UI = { S: S, n: V.n, s: s, sc: sc };
    mostra(s);
  }
  // la scheda sullo schermo cambia solo avatar, conto e tasto (niente lampeggio)
  function votoAggiornaUI() {
    var U = VOTO_UI; if (!U || !document.body.contains(U.s)) return;
    var host = U.S === sala, V = host ? sala.voto : U.S.voto;
    if (!V || V.n !== U.n || V.fase !== "voto") return;
    var mio = host ? "host" : mioIdSala(U.S);
    var ms = V.scade - (Date.now() + (host ? 0 : (U.S.votoScarto || 0)));
    U.sc.aggiorna(votiPersone(U.S, V), V.voti[mio] !== undefined ? V.voti[mio] : undefined, ms, host ? votoVotanti().length : (U.S.membri || []).length);
  }
  // (amico) la foto della Sala col voto aperto o la ruota: la scheda, o la ruota che gira uguale per tutti
  function votoOspite(S, V) {
    // lo scarto tra l'ora dell'host e la mia: il più grande visto da questo host (una foto trattenuta vecchia lo fa più piccolo)
    var k = (S.capo && S.capo._s) || "";
    if (typeof V.ora === "number") { var sc = V.ora - Date.now(); if (S.votoScK !== k || !(sc <= S.votoScarto)) { S.votoScarto = sc; S.votoScK = k; } }
    S.voto = V;
    if (V.fase === "ruota") {
      var R = V.ruota, fineH = R.parte + SGScegliamo.DURATA;
      if (S.votoRuota === V.n) {
        // (già partita: se intanto ho capito meglio l'ora dell'host e gira ancora, la rimetto al punto giusto)
        if (S.veloV && S.veloV.isConnected && Math.abs((S.votoRuotaSc || 0) - S.votoScarto) > 500 && Date.now() + S.votoScarto < fineH) giraOspite(S, V);
        return;
      }
      if (VOTO_UI && VOTO_UI.S === S) VOTO_UI.sc.chiudi();
      else disegnaSalaOspite();   // (arrivo a ruota già partita: sotto c'è la Sala)
      return giraOspite(S, V);
    }
    if (VOTO_UI && VOTO_UI.S === S && VOTO_UI.n === V.n && document.body.contains(VOTO_UI.s)) return votoAggiornaUI();
    if (S.votoMio && S.votoMio.n !== V.n) S.votoMio = null;
    schermataVotoGiochi(S, V, false);
  }
  function giraOspite(S, V) {
    var R = V.ruota;
    S.votoRuota = V.n; S.votoRuotaSc = S.votoScarto;
    S.veloV = SGScegliamo.ruota({ spicchi: R.spicchi, giochi: votoInfo(V.giochi), vince: R.vince, theta: R.theta, parte: R.parte, scarto: S.votoScarto || 0,
      poi: function () {
        if (salaG !== S) return;
        S.veloV = null;
        if (VOTO_UI && VOTO_UI.S === S) VOTO_UI = null;
        if (S.inGioco === null && document.querySelector(".sala-voto")) disegnaSalaOspite();   // (il gioco non è ancora partito: la Sala)
      } });
  }
  // (amico) nella foto non c'è più il voto: via la scheda (la ruota, se gira, finisce da sola)
  function votoVia(S) {
    S.voto = null;
    if (VOTO_UI && VOTO_UI.S === S) { VOTO_UI.sc.chiudi(); VOTO_UI = null; }
  }

  // ---------- CHI ARRIVA: la fase del gioco della Sala, chi è dentro, chi è uscito, chi manca ----------
  // (lo strato della rete non vede la variabile "sala": gliela passo così)
  function salaDiQui() { return sala; }
  // la stanza del gioco lanciato dalla mia Sala: quando cambia la fase (saletta, partita, classifica) o chi c'è dentro
  // lo dico a tutti nella Sala (chi arriva a partita in corso resta nella Sala: "entri alla prossima")
  function salaSegueGioco(SA, SVg) {
    var t = null;
    function mia() { return sala === SA && SA.stanza === SVg.codice; }
    SVg.suFase.push(function (f) { if (!mia()) return; SA.fase = f; if (SA._bcast) SA._bcast(); });
    // chi entra o esce dalla stanza a partita in corso (serve a chi ricarica la pagina: rientra da solo nel gioco)
    SVg.onDentro = function () {
      if (!mia() || (SA.fase || "lobby") === "lobby") return;
      clearTimeout(t); t = setTimeout(function () { if (mia() && SA._bcast) SA._bcast(); }, 400);
    };
  }
  // chi è dentro la stanza del gioco (id), tranne chi ha detto "esco"
  // Conta anche chi era dentro ed è sparito senza dire "esco" (rete persa, telefono spento più di 20 s: per il gioco è
  // "andato"): se ricarica la pagina deve tornare nella partita col suo posto, non restare nella Sala ad aspettare la
  // prossima (18 ott: Palla Matta coi telefoni veri). Non chi ne è uscito apposta né chi l'host ha fatto uscire.
  // E se la pagina dell'host si è ricaricata (la Sala riprende il gioco nella stessa stanza), anche chi era nella partita
  // prima della ricarica e non è ancora tornato (SA.nelSeme): la stanza riaperta non lo conosce, ma la partita sì.
  function nelGiocoSala(SA) {
    var SVg = SA.stanza ? SVH[SA.stanza] : null, ids = [];
    if (SVg) ids = Object.keys(SVg.dentro).concat(Object.keys(SVg.andati || {}).filter(function (id) { return !SVg.dentro[id] && !(SVg.fuori && SVg.fuori[id]); }));
    var Sm = SA.nelSeme && SA.nelSeme.stanza === SA.stanza ? SA.nelSeme.ids : [];
    Sm.forEach(function (id) { if (ids.indexOf(id) < 0 && !(SVg && SVg.fuori && SVg.fuori[id])) ids.push(id); });
    return ids.filter(function (id) { return !(SA.fuori && SA.fuori[id]); });
  }
  // chi è uscito apposta dal gioco in corso (id)
  function fuoriSala(SA) { var F = SA.fuori || {}; return Object.keys(F).filter(function (id) { return F[id] === SA.stanza; }); }
  // chi della Sala non è ancora nella saletta del gioco (lo aspettiamo): [{ id, nome, omino, forse }].
  // Non conta chi è uscito apposta ("esco"), chi è già nella stanza (anche se guarda), chi non è tra gli scelti.
  // Se nessuno ha scelto chi gioca e i posti liberi non bastano per tutti, non si sa chi arriverà: nessuna sagoma
  function attesiSala(g, gio, SVg, tavolo) {
    var membri, fuori, forse, mio, giaQui = {};
    if (sala && sala.inGioco && SVg && SVg.host && SVg.codice === sala.stanza) {
      membri = sala.membri; fuori = insieme(fuoriSala(sala)); mio = "host"; giaQui = SVg.dentro;
      forse = sala.rete && sala.rete._sv ? sala.rete._sv.forse : {};
    } else if (salaG && salaG.giocoSala && SVg && !SVg.host && SVg.codice === salaG.giocoSala.stanza) {
      membri = salaG.membri; fuori = insieme(salaG.fuori); mio = salaG.myId || (salaG.rete && salaG.rete.mioId); giaQui = SVg.nomi || {};
      forse = salaG.rete && salaG.rete._sv ? salaG.rete._sv.forse : {};
    } else return [];
    var scelti = tavolo && tavolo.scelti && tavolo.scelti.length ? tavolo : null;
    var cand = (membri || []).filter(function (m) {
      if (!m || !m.id || m.id === mio || fuori[m.id] || (giaQui[m.id] && m.id !== "host")) return false;
      if (gio.some(function (p) { return !p.bot && ((p.id != null && String(p.id) === m.id) || (p.host && m.id === "host") || stessoNome(p.nome, m.nome)); })) return false;
      return !scelti || scelti.puoSedersi(m.id, m.nome);
    });
    if (!scelti && cand.length > postiDi(g) - gio.length) return [];
    return cand.map(function (m) { return { id: m.id, nome: m.nome, omino: m.omino || null, forse: !!forse[m.id] }; });
  }
  // qualcosa è cambiato nella Sala (chi c'è, chi si ricollega, chi è uscito): la saletta del gioco rifà solo chi manca
  function rinfrescaAttesi() {
    var U = SL.ultimo;
    if (U && U.o && U.o._attesiDi && document.body.contains(U.s)) aggiornaSaletta(U, U.o, false);
  }

  // un gioco nella Sala senza la schermata delle impostazioni: le regole di partenza si preparano fuori dalla pagina
  // (il foglio ⚙️ della saletta le mostra) e restano per la serata: la volta dopo lo stesso gioco riparte con le scelte di prima
  // opz.stessi = la Rivincita di prima (ctx.rigioca): giocano gli stessi di prima, senza ridomandare "Chi gioca?"
  // opz.sfida = "⚔️ Altra sfida": "Chi gioca?" anche se i posti bastano (si sceglie chi gioca adesso)
  function salaPreparaGioco(g, opz) {
    if (!sala || !g) return schermataHome();
    opz = opz && !opz.target ? opz : {};
    if (sala.resta) restaFerma();   // (un gioco nuovo: "Chi vince resta" finisce, il record resta scritto)
    segnaFatto(g.id);   // ("🗳️ Scegliamo insieme": i giochi di stasera)
    sala.regole = sala.regole || {};
    var R = sala.regole[g.id];
    if (!R) {
      var imp = {}, box = null;
      if (typeof g.impostazioni === "function") {
        box = el("div", { class: "sg-dal-gioco" });   // (🤍 roba del gioco: le sue emoji restano emoji)
        try { g.impostazioni(box, imp, { el: el, sala: true, modo: "online", giocatori: sala.membri.map(function (m) { return m.nome; }) }); }
        catch (e) { setTimeout(function () { throw e; }, 0); }   // (si gioca lo stesso; l'errore resta in console)
      }
      R = sala.regole[g.id] = { box: box, imp: imp };
    }
    R.imp.modo = "online";
    if (opz.stessi && R.imp.scelti) return salaLancia(g, R.imp, R.box);
    // un gioco a due e siamo almeno in 3: "🏆 Torneino: giocate tutti" (già scelto) o "⚔️ Una sfida: scegli chi gioca"
    if (salaSempre() && !sala.elim && !opz.sfida && GIOCHI_ELIMINAZIONE[g.id] && sala.membri.length >= 3) return schermataTorneino(g, R);
    // "Chi gioca a Tris?": siamo più dei posti (nel torneo a eliminazione e col percorso di prima no)
    if (salaSempre() && !sala.elim && (sala.membri.length > postiDi(g) || (opz.sfida && sala.membri.length > 2))) return schermataChiGioca(g, function (scelti) { salaParti(g, R, scelti); }, restaOpz(g, R));
    salaParti(g, R, null);
  }
  // in "Chi gioca?" di un gioco a due con almeno 3 nella Sala anche "👑 Chi vince resta"
  function restaOpz(g, R) {
    if (!sala || !aDue(g) || !GIOCHI_ELIMINAZIONE[g.id] || sala.membri.length < 3 || sala.elim) return null;
    return { resta: function (scelti) { restaInizia(g, R, scelti); } };
  }
  // si parte con chi è stato scelto (null = tutti). L'host gioca: la sua stanza, e il gioco fa sedere solo gli scelti
  // (tavolo.scelti / puoSedersi; gli altri entrano e guardano). Gioco a due senza l'host: il duello tra i due
  function salaParti(g, R, scelti) {
    if (!sala) return schermataHome();
    if (scelti && aDue(g) && GIOCHI_ELIMINAZIONE[g.id] && scelti.length === 2 && !scelti.some(function (x) { return x.id === "host"; })) return salaDuello(g, R, scelti);
    if (scelti) R.imp.scelti = scelti.map(function (x) { return { id: x.id, nome: x.nome }; });
    else delete R.imp.scelti;
    salaLancia(g, R.imp, R.box);
  }

  // ---------- IL TORNEINO: un gioco a due con 3 o più persone, giocano tutti ----------
  // È il torneo a eliminazione dentro la Sala della serata (stessi id, nessun link nuovo): coppie a sorte, tutte le partite
  // insieme, chi vince va avanti fino alla finale; alla fine "👥 Torna in Sala" (e i punti, se "Contiamo i punti" è acceso).
  // T = { resto: "bot" (chi resta in più gioca col Bot, che è un partecipante vero) o "passa", livello del Bot }
  function nuovoTorneino(gid, imp, T, attesi) {
    T = T || {};
    var E = { gioco: gid, torneino: true, iniziato: false, finito: false, turni: [], nomi: {}, campione: null, gironi: {}, imp: imp || {},
      resto: T.resto === "passa" ? "passa" : "bot", livello: livelloElim(T), coppie: T.coppie === "scelte" ? "scelte" : "caso" };
    if (attesi) E.attesi = attesi;
    return E;
  }
  // si parte: "🎲 A caso" = le coppie a sorte subito; "✋ Scegliete voi" = prima ognuno si siede dove e con chi vuole
  // (Partita 1: [ ] contro [ ]…), l'host vede "Seduti 5 su 6" e parte quando vuole; dopo TEMPO_COPPIE si parte da soli
  // (chi non si è seduto va a caso nei posti rimasti: gironiElim)
  var TEMPO_COPPIE = 45000;
  function partiTorneino(E) {
    if (!sala || sala.elim !== E) return;
    if (E.coppie !== "scelte") return avviaElim();
    E.iniziato = false; E.finito = false; E.turni = []; E.campione = null; E.gironi = {}; delete E.attesi;
    E.scade = Date.now() + TEMPO_COPPIE;
    clearTimeout(sala.tCoppie);
    sala.tCoppie = setTimeout(function () { if (sala && sala.elim === E && !E.iniziato) avviaElim(); }, TEMPO_COPPIE);
    lasciaTorneo(sala);
    sala._bcast(); seguiHost();
  }
  // in quante partite ci si siede (torneino: quante ne servono; torneo a eliminazione di sempre: 5 gironi)
  function partiteCoppie(E, n) { return E.torneino ? Math.max(1, Math.min(N_GIRONI, Math.ceil(Math.min(n, MAX_ELIM) / 2))) : N_GIRONI; }
  // il conto alla rovescia delle coppie: si cambia solo la scritta (due volte al secondo), mai il tabellone
  var tContoCoppie = null;
  function contoCoppie() {
    if (tContoCoppie) return;
    tContoCoppie = setInterval(function () {
      var l = document.querySelectorAll(".tb-conto[data-scade]");
      if (!l.length) { clearInterval(tContoCoppie); tContoCoppie = null; return; }
      [].forEach.call(l, function (x) { var sec = Math.max(0, Math.ceil((+x.getAttribute("data-scade") - Date.now()) / 1000)), tx = "⏱️ Si parte da soli tra " + sec + " s"; if (x.textContent !== tx) x.textContent = tx; });
    }, 500);
  }
  // in quanti giocano davvero (al massimo 10: gli altri guardano)
  function quantiTorneino(n) { return Math.min(n, MAX_ELIM); }
  // "Tris in 5": 🏆 Torneino (già scelto) o ⚔️ Una sfida. Se si è dispari, sotto: chi resta in più (Bot o passa il turno)
  // e la bravura del Bot. In uno schermo senza scorrere; un tocco sceglie, "▶" parte
  function schermataTorneino(g, R) {
    if (!sala) return schermataHome();
    var n = sala.membri.length, T = sala.optTorneino = sala.optTorneino || { resto: "bot", livello: "medio" }, scelta = "torneino";
    var s = schermata({ icona: g.icona || "🎲", titolo: g.nome + " in " + n, sotto: "Si gioca in 2: come fate?", indietro: function () { salaScegliGioco(); } });
    s.classList.add("torneino-sc");
    function carta(id, ico, tit, sotto) {
      var b = el("button", { class: "tn-scelta", type: "button", "aria-pressed": "false", onclick: function () { scelta = id; rifai(); } }, [
        el("span", { class: "tn-ico", text: ico }),
        el("span", { class: "tn-testo" }, [ el("b", { text: tit }), el("small", { text: sotto }) ]),
        el("span", { class: "tn-spunta", "aria-hidden": "true", text: "✓" }) ]);
      b._id = id;
      return b;
    }
    var m = quantiTorneino(n), dispari = m % 2 === 1;
    var cT = carta("torneino", "⚔️", "Torneo: giocate tutti", (n > MAX_ELIM ? "Giocano in " + MAX_ELIM + ", gli altri guardano. " : "") + "Tutte le partite insieme: chi vince va avanti fino alla finale");
    // (Passo 6) da qui anche "👑 Chi vince resta": in «Chi gioca?» (una carta in più farebbe scorrere lo schermo)
    var cS = carta("sfida", "🤺", "Una sfida: scegli chi gioca", restaOpz(g, R) ? "In 2, gli altri guardano · anche 👑 Chi vince resta" : "Giocano in 2, gli altri guardano in diretta");
    // un gioco che si fa anche in tre (la Scopa: g.inTre e il riquadro delle regole sa passare a tre): in tre la prima scelta
    // è «In tre: giocate tutti», tutti allo stesso tavolo
    var tre = n === 3 && g.inTre && R && R.box && typeof R.box._inTre === "function";
    var cTre = tre ? carta("tre", "👥", "In tre: giocate tutti", "Tutti e tre allo stesso tavolo, ognuno per sé") : null;
    if (tre) scelta = "tre";
    var opz = opzioniTorneino(T, function () { rifai(); }, false, dispari);
    var nota = el("p", { class: "modulo-nota tn-nota" });
    s._contenuto.appendChild(el("div", { class: "tn-scelte" }, [cTre, cT, cS].filter(Boolean)));
    if (opz) s._contenuto.appendChild(opz);
    s._contenuto.appendChild(nota);
    var via = el("button", { class: "btn btn-primario", type: "button", onclick: function () {
      if (!sala) return schermataHome();
      if (tre) try { R.box._inTre(scelta === "tre"); } catch (e) {}   // (in due per la sfida e il torneo)
      if (scelta === "tre") return salaParti(g, R, sala.membri.map(function (x) { return { id: x.id, nome: x.nome }; }));
      if (scelta === "sfida") return schermataChiGioca(g, function (scelti) { salaParti(g, R, scelti); }, restaOpz(g, R));
      salaTorneino(g, R, T);
    } });
    // le regole del gioco (le stesse per tutte le partite): nel ⚙️, come nella saletta
    var bReg = R && haRegole(R.box) ? el("button", { class: "btn btn-fantasma sl-regole", type: "button", text: "⚙️ Regole", onclick: function () { foglioBox("⚙️ Regole della partita", R.box); } }) : null;
    s._piede.appendChild(bReg ? el("div", { class: "sl-tasti" }, [bReg, via]) : via);
    // si cambiano solo le classi e le scritte: niente lampeggio
    function rifai() {
      [cTre, cT, cS].filter(Boolean).forEach(function (c) { var si = c._id === scelta; c.classList.toggle("scelta", si); c.setAttribute("aria-pressed", si ? "true" : "false"); });
      if (opz) opz.hidden = scelta !== "torneino";
      var tx = scelta === "tre" ? "Una partita sola, tutti e tre allo stesso tavolo." : scelta === "sfida" ? "Poi scegli i due che giocano." : T.coppie === "scelte" ? "Ognuno si siede dove e con chi vuole: poi parti tu." : (dispari ? (T.resto === "passa" ? "Siete dispari: uno a sorte passa il turno." : "Siete dispari: chi resta gioca col Bot. Se lo batte va avanti, se no va avanti il Bot!") : "Siete pari: giocano tutti subito.");
      if (nota.textContent !== tx) nota.textContent = tx;
      var tv = scelta === "tre" ? "▶ Si gioca in tre" : scelta === "sfida" ? "🤺 Scegli chi gioca" : "⚔️ Via al torneo";
      if (via.textContent !== tv) via.textContent = tv;
    }
    rifai();
    mostra(s);
  }
  // un foglio con dentro un riquadro di regole (lo stesso nodo: le scelte restano come le avevi lasciate)
  function foglioBox(titolo, box) {
    if (document.querySelector(".sl-velo")) return;
    var velo;
    function chiudi() { if (box.parentNode) box.parentNode.removeChild(box); if (velo.parentNode) velo.parentNode.removeChild(velo); }
    velo = el("div", { class: "sl-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: titolo }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        el("div", { class: "sl-foglio-corpo" }, [box]),
        el("button", { class: "btn btn-primario", text: "✅ Fatto", onclick: chiudi })
      ])
    ]);
    document.body.appendChild(velo);
  }
  // si parte: la Sala diventa il tabellone del torneino (per tutti, da sola), le coppie si sorteggiano e le partite si aprono
  function salaTorneino(g, R, T) {
    if (!sala || !g) return schermataHome();
    restaFerma(true);   // (👑 "Chi vince resta" finisce: il record resta)
    lasciaPartita(); FINE = null; RIV = null;
    lasciaTorneo(sala);
    sala.gioco = null; sala.stanza = null; sala.inGioco = false; sala.fase = null; sala.fuori = {}; sala.ctx = null; sala.duello = null; sala.fineDuello = null; sala.sceglie = false;
    var imp = R && R.imp ? R.imp : {};
    delete imp.scelti; imp.modo = "online";
    sala.elim = nuovoTorneino(g.id, imp, T || sala.optTorneino);
    sala.regoleElim = null; sala._regoleBox = R ? R.box : null;
    SGNet.chiudiGiochi(1500);   // (la stanza del gioco di prima, se c'era: prima gli amici passano al torneino)
    partiTorneino(sala.elim);
  }
  // "🏆 Fate il torneino in 5" nella saletta di un gioco a due (host), quando nella stanza (o nella Sala) si è almeno in 3.
  // N = in quanti (0 = niente tasto)
  function torneinoPossibile(U) {
    var SV = U && U.rete && U.rete._sv, P = U && U.rete && U.rete._P;
    if (!U || !U.host || !GIOCHI_ELIMINAZIONE[U.gid] || !SV || !SV.host || !P || !P.viva() || U.via) return 0;
    var C = P.salaCtx;
    if (C) return C.tabellone || C.duello || !sala || sala.elim || sala.ctx !== C ? 0 : sala.membri.length;   // un gioco della Sala: tutta la Sala
    return 1 + Object.keys(SV.dentro).filter(function (id) { return id !== "host" && id !== "__io" && !SV.fuori[id]; }).length;
  }
  function tastoTorneino(U) {
    if (!U || !U.bTorneino) return;
    var n = torneinoPossibile(U), si = n >= 3, tx = "⚔️ Fate il torneo in " + n;
    if (U.bTorneino.hidden === si) U.bTorneino.hidden = !si;
    if (si && U.bTorneino.textContent !== tx) U.bTorneino.textContent = tx;
  }
  // un tocco: la stanza diventa il torneino con tutti dentro, senza rimandare link.
  // Gioco della Sala → il torneino della Sala. Stanza fuori dalla Sala → si apre una Sala col torneino e chi era nella stanza
  // ci passa da solo (messaggio "__torneino" col codice della Sala, ripetuto per qualche secondo; stesso id di prima)
  function torneinoDaSaletta(U) {
    if (torneinoPossibile(U) < 3) return;
    var g = giocoDa(U.gid), P = U.rete._P, SV = U.rete._sv; if (!g) return;
    var T = (sala && sala.optTorneino) || { resto: "bot", livello: "medio" };
    if (P.salaCtx) {
      var R = sala.regole && sala.regole[g.id];
      if (!R) R = sala.regole[g.id] = { box: U.R ? U.R.box : null, imp: P.tavolo ? P.tavolo.impostazioni : {} };
      SL.ultimo = null;
      return salaTorneino(g, R, T);
    }
    var C = SGNet.nuovoCodice(), h = SV.h, attesi = Object.keys(SV.dentro).filter(function (id) { return id !== "host" && id !== "__io" && !SV.fuori[id]; });
    var imp = {}; try { imp = JSON.parse(JSON.stringify((U.R && U.R.imp) || (P.tavolo && P.tavolo.impostazioni) || {})); } catch (e) {}
    var box = U.R && U.R.box && U.R.imp ? U.R.box : null;
    if (box) imp = U.R.imp;   // (il riquadro delle regole scrive lì: si tiene insieme)
    var msg = { t: "__torneino", sala: C }, volte = 0;
    try { h.invia(msg); } catch (e) {}
    var tRip = setInterval(function () { if (++volte > 6) return clearInterval(tRip); try { h.inviaVeloce(msg); } catch (e) {} }, 700);
    lasciaPartita(); SL.ultimo = null;
    SGNet.chiudiGiochi(5000);   // (la stanza del gioco si chiude quando sono passati tutti)
    if (sala) chiudiSala();
    creaSala({ codice: C, torneino: { gioco: g.id, imp: imp, box: box, resto: T.resto, livello: T.livello, coppie: T.coppie, attesi: attesi } });
  }
  // chi era nella stanza riceve "__torneino": passa nella Sala del torneino (con lo stesso id della stanza)
  function vaiAlTorneino(R, m) {
    var C = String((m && m.sala) || "").toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(C) || R.torneino || !R.P || !R.P.viva() || R.P.salaCtx) return;
    R.torneino = C;
    var id = R.h && R.h.mioId;
    if (id) SGNet.ricordaId(C, id);
    lasciaPartita(); SGNet.chiudiGiochi();
    dimenticaLinkSessione();
    pillola("torneino", "⚔️ Si fa il torneo!", "verde", 3000);
    salaOspite(C);
  }

  // ---------- "CHI GIOCA A TRIS?" (siamo più dei posti) ----------
  // "a Tris", "alla Scalinata", "all'Asta", "al Poker"… (il nome del gioco con la sua preposizione)
  function aGioco(nome) {
    var n = String(nome || ""), m;
    if ((m = /^L'(.*)$/.exec(n))) return "all'" + m[1];
    if ((m = /^(La|Il|Lo|Le|I|Gli) (.*)$/.exec(n))) return { La: "alla ", Il: "al ", Lo: "allo ", Le: "alle ", I: "ai ", Gli: "agli " }[m[1]] + m[2];
    return "a " + n;
  }
  // chi gioca, già scelto: prima chi ha giocato meno stasera (a pari merito chi è arrivato prima nella Sala);
  // nei giochi da 3 posti in su l'host è sempre dentro
  function sceltiDiPartenza(posti, conHost) {
    var G = sala.giocate || {}, ordine = sala.membri.map(function (m, i) { return { m: m, i: i, n: G[m.nome] || 0 }; });
    var sc = conHost ? [sala.membri[0]] : [];
    ordine.filter(function (x) { return !(conHost && x.m.id === "host"); })
      .sort(function (a, b) { return a.n - b.n || a.i - b.i; })
      .slice(0, posti - sc.length).forEach(function (x) { sc.push(x.m); });
    return sc;
  }
  // la schermata, senza scorrere: gli avatar della Sala (5 per riga), chi gioca evidenziato, sotto chi guarda e "▶ Si gioca".
  // Un tocco aggiunge o toglie; da pieni, chi si tocca prende il posto del più vecchio scelto (l'host no). poi(scelti)
  // o (facoltativo, giochi a due) = { resta(scelti): "👑 Chi vince resta" con i due scelti }
  function schermataChiGioca(g, poi, o) {
    if (!sala) return schermataHome();
    o = o && typeof o.resta === "function" ? o : null;
    var posti = postiDi(g), conHost = posti >= 3, membri = sala.membri.slice();
    var sc = sceltiDiPartenza(posti, conHost).map(function (m) { return m.id; });
    var s = schermata({ icona: g.icona || "🎲", titolo: "Chi gioca " + aGioco(g.nome) + "?",
      sotto: posti === 2 ? "Giocano in 2: gli altri guardano" : "Giocano in " + posti + ": gli altri guardano",
      indietro: function () { salaScegliGioco(); } });
    s.classList.add("chi-gioca-sc");
    var griglia = el("div", { class: "chi-gioca" + (membri.length > 10 ? " tanti" : "") });
    var celle = {};
    membri.forEach(function (m) {
      var fisso = conHost && m.id === "host";
      var b = el("button", { class: "cg-chi" + (fisso ? " fisso" : ""), type: "button", "aria-pressed": "false", onclick: function () { tocca(m.id); } }, [
        el("span", { class: "cg-av", html: window.SGOmino ? SGOmino.svg(m.omino || SGOmino.casuale(m.nome), { busto: true }) : "<span class='cg-emo'>🙂</span>" }),
        el("span", { class: "cg-segno", "aria-hidden": "true", text: "✓" }),
        el("span", { class: "cg-nome", text: m.id === "host" ? m.nome + " (tu)" : m.nome })
      ]);
      celle[m.id] = b;
      griglia.appendChild(b);
    });
    var guardano = el("p", { class: "cg-guardano" });
    var nota = el("p", { class: "modulo-nota cg-nota", text: conHost ? "Tu giochi sempre. Tocca un amico per farlo giocare al posto di un altro."
      : (o ? "Tocca chi gioca. Con «👑 Chi vince resta» chi vince resta al tavolo e gli altri fanno la coda." : "Tocca chi gioca: se non giochi tu, li guardi in diretta.") });
    s._contenuto.appendChild(griglia);
    s._contenuto.appendChild(guardano);
    s._contenuto.appendChild(nota);
    function chi() { return sc.map(function (id) { var m = membri.filter(function (x) { return x.id === id; })[0]; return { id: id, nome: m ? m.nome : "" }; }); }
    var via = el("button", { class: "btn btn-primario", type: "button", onclick: function () {
      if (sc.length !== posti || !sala) return;
      poi(chi());
    } });
    // "👑 Chi vince resta" (sotto "▶ Si gioca", con gli stessi due scelti: sono i primi)
    var bResta = o ? el("button", { class: "btn btn-fantasma cg-resta", type: "button", text: "👑 Chi vince resta", onclick: function () {
      if (sc.length !== posti || !sala) return;
      o.resta(chi());
    } }) : null;
    s._piede.appendChild(via);
    if (bResta) s._piede.appendChild(bResta);
    function tocca(id) {
      if (conHost && id === "host") return;   // (nei giochi da 3 posti in su l'host gioca sempre)
      var k = sc.indexOf(id);
      if (k >= 0) sc.splice(k, 1);
      else {
        sc.push(id);
        if (sc.length > posti) { var j = sc.findIndex(function (x) { return x !== "host"; }); sc.splice(j < 0 ? 0 : j, 1); }
      }
      rifai();
    }
    // si cambiano solo le classi e le scritte: niente lampeggio
    function rifai() {
      membri.forEach(function (m) {
        var si = sc.indexOf(m.id) >= 0, b = celle[m.id];
        b.classList.toggle("scelto", si); b.setAttribute("aria-pressed", si ? "true" : "false");
      });
      var altri = membri.filter(function (m) { return sc.indexOf(m.id) < 0; }).map(function (m) { return m.id === "host" ? "tu" : m.nome; });
      guardano.textContent = altri.length ? "👀 Gli altri guardano: " + altri.join(", ") : "";
      var manca = posti - sc.length;
      via.textContent = manca > 0 ? "Scegli ancora " + manca : "▶ Si gioca";
      via.disabled = manca !== 0;
      if (bResta) bResta.disabled = manca !== 0;
    }
    rifai();
    mostra(s);
  }

  // ---------- IL DUELLO: un gioco a due tra due amici, l'host della Sala guarda ----------
  // Come una partita del torneo a eliminazione: la stanza la apre il telefono del primo (a), il secondo (b) entra da solo,
  // tutti gli altri (host compreso) guardano in diretta. a dice alla Sala com'è finita (salaEsito) e a che punto è (duelloFase)
  // (stanza: il codice già deciso, "Chi vince resta")
  function salaDuello(g, R, scelti, stanza) {
    if (!sala) return schermataHome();
    lasciaPartita(); FINE = null; RIV = null;
    SGNet.chiudiGiochi(1500);   // (la stanza del gioco di prima, se c'era)
    var imp = {};
    try { imp = JSON.parse(JSON.stringify(R.imp || {})); } catch (e) {}
    delete imp.scelti; imp.modo = "online";
    var D = sala.duello = { a: scelti[0].id, b: scelti[1].id, na: scelti[0].nome, nb: scelti[1].nome, stanza: stanza || SGNet.nuovoCodice(), gioco: g.id, imp: imp, n: 0, fine: null, visti: {} };
    sala.gioco = g.id; sala.stanza = D.stanza; sala.inGioco = true; sala.sceglie = false; sala.fase = "lobby"; sala.fuori = {};
    sala._bcast();
    guardaDuelloHost(D);
  }
  // l'host guarda il duello (anche quando ci torna da "👀 Guarda" nella Sala): in alto a destra "👥 Sala" per tornare nella Sala
  function guardaDuelloHost(D) {
    var g = giocoDa(D.gioco); if (!sala || sala.duello !== D || !g) return disegnaSalaHost();
    SGNet.chiudiGiochi();
    sala.inGioco = true; sala.fineDuello = null;   // (la Sala non si ridisegna sopra la partita)
    var ctx = sala.ctx = {
      duello: D.stanza,
      esci: function () { tornaDalDuello(); }, fine: function () { tornaDalDuello(); }, risultato: function () {},
      angolo: function (s) { tastoSala(s, function () { tornaDalDuello(); }); },
      cambia: function () { salaCambiaGioco(); }
    };
    function tornaDalDuello() {
      if (!sala || sala.ctx !== ctx) return;
      lasciaPartita(); SGNet.chiudiGiochi(); sala.inGioco = false; sala.ctx = null;
      disegnaSalaHost();
    }
    linkParams = { gioco: g.id, stanza: D.stanza, guarda: 1 };
    avviaPartita(g, [], {}, null, ctx);
    restaTarga();   // ("👀 Guardi · in coda: sei 2°")
  }
  // "👥 Sala" (o "🏠 Sala" per chi guarda soltanto) nell'angolo in alto a destra di chi guarda un duello
  function tastoSala(s, fn) {
    if (!s || s.querySelector(".tab-elim")) return;
    var b = el("button", { class: "tab-elim tab-sala", "aria-label": "Torna nella Sala", text: "👥 Sala", onclick: fn });
    var testa = s.querySelector(".testa");
    if (testa && !s.classList.contains("senza-testa")) { b.classList.add("in-testa"); testa.appendChild(b); }
    else s.appendChild(b);
  }
  // l'host della Sala riceve dal telefono di a com'è finito il duello o a che punto è
  function msgDuello(id, m) {
    var D = sala && sala.duello;
    if (!D || id !== D.a || m.stanza !== D.stanza || sala.stanza !== D.stanza) return;
    var g = giocoDa(D.gioco); if (!g) return;
    if (sala.resta && sala.resta.sfida && sala.resta.sfida.stanza === D.stanza) sala.resta.aperta = D.stanza;   // (a ha aperto la sfida: se manca qualcuno è l'altro)
    if (m.t === "duelloFase") {
      var f = m.fase === "lobby" || m.fase === "gioco" || m.fase === "fine" ? m.fase : null;
      if (!f || f === sala.fase) return;
      var prima = sala.fase; sala.fase = f; sala._bcast(); if (!sala.inGioco) disegnaSalaHost();   // (sono nella Sala: il riquadro del duello)
      // la rivincita del duello comincia: se sono sulla classifica, torno a guardare da solo
      if (prima === "fine" && f !== "fine" && sala.fineDuello === D) { sala.fineDuello = null; guardaDuelloHost(D); }
      return;
    }
    // la classifica (dal telefono di un amico: solo nomi e posti, controllati)
    var cl = (Array.isArray(m.cl) ? m.cl : []).slice(0, 10).filter(function (r) { return r && typeof r.nome === "string"; })
      .map(function (r) { var x = { nome: r.nome.slice(0, 16), pos: Math.max(1, Math.min(10, (+r.pos | 0) || 1)) }; if (typeof r.punti === "number" && isFinite(r.punti)) x.punti = r.punti; if (r.bot) x.bot = true; return x; });
    if (!cl.length) return;
    var k = String(m.giro | 0);
    if (D.visti[k]) return;   // (la stessa partita detta due volte)
    D.visti[k] = 1;
    D.n += 1; D.fine = { n: D.n, cl: cl, giro: m.giro | 0 };
    salaRisultato(g, cl, { stanza: D.stanza, giro: m.giro | 0 });   // (giocate e punti del torneo; manda la Sala a tutti)
    sala._bcast(); if (!sala.inGioco) disegnaSalaHost();
    // se sto guardando il duello: dopo un attimo (si vede la mossa finale) la classifica con "⚔️ Altra sfida" e "🎮 Cambia gioco"
    var P = partitaCorrente;
    if (P && P.viva() && P.salaCtx && P.salaCtx.duello === D.stanza && !P.salaCtx.gioca) setTimeout(function () {
      if (partitaCorrente === P && P.viva() && sala && sala.duello === D && D.fine && D.fine.n === D.n) fineDuelloHost(D, g, k);
    }, 1600);
  }
  // la fine del duello per l'host della Sala, che guardava
  function fineDuelloHost(D, g, giro) {
    // ("👑 Chi vince resta": la fine della sfida è già sullo schermo, disegnata dal gioco che guardavo: resta quella)
    if (restaFineDi(D.stanza) && document.querySelector(".fine-resta")) return;
    lasciaPartita(); SGNet.chiudiGiochi();
    sala.fineDuello = D;
    var s = schermata({ icona: "🏆", titolo: "Fine partita", sotto: g.nome + " · " + D.na + " contro " + D.nb });
    s._contenuto.appendChild(classificaDuello(D.fine.cl));
    sala.ctx = null;
    if (restaFineDi(D.stanza)) {
      bloccoResta(s._piede, D.stanza, true, { SV: { codice: D.stanza, giro: +giro || 0 }, salaHost: true, host: true });
      tastoSala(s, function () { if (!sala) return schermataHome(); sala.fineDuello = null; sala.inGioco = false; sala.ctx = null; disegnaSalaHost(); });
      return mostra(s);
    }
    var box = el("div", { class: "fine-tasti" });
    rigaPuntiFine(box, { codice: D.stanza, giro: +giro || 0 }, true, true);   // (la Classifica della serata: "🏆 Serata: Giulia 1° · Luca 2°")
    box.appendChild(el("button", { class: "btn btn-primario ft-primo", type: "button", text: "⚔️ Altra sfida", onclick: function () { salaAltraSfida(g); } }));
    box.appendChild(el("button", { class: "btn btn-fantasma ft-secondo", type: "button", text: "🎮 Cambia gioco", onclick: function () { salaCambiaGioco(); } }));
    s._piede.appendChild(box);
    tastoSala(s, function () {
      if (!sala) return schermataHome();
      sala.fineDuello = null; sala.inGioco = false; sala.ctx = null; disegnaSalaHost();
    });
    mostra(s);
  }
  function classificaDuello(cl) {
    var ol = el("ol", { class: "classifica" }), med = medaglieAPari(cl.map(function (r, i) { return r.pos || i + 1; }));
    cl.forEach(function (r, i) {
      ol.appendChild(el("li", { class: (r.pos || i + 1) === 1 ? "vincitore" : "" }, [ el("span", { class: "pos", text: med[i] }), el("span", { class: "nome", text: r.nome }),
        r.punti != null ? el("span", { class: "punti", text: typeof r.punti === "number" && r.punti % 1 === 0 ? cifre(r.punti) : r.punti }) : null ]));
    });
    return ol;
  }
  // il duello è finito per tutti (chi l'aveva aperto è tornato nella Sala o è uscito): tutti nella Sala
  function fineDuelloSala() {
    if (!sala) return;
    var guardavo = sala.inGioco;
    sala.gioco = null; sala.stanza = null; sala.inGioco = false; sala.fase = null; sala.fuori = {}; sala.ctx = null; sala.duello = null; sala.fineDuello = null;
    sala._bcast();
    if (guardavo) { lasciaPartita(); SGNet.chiudiGiochi(); pillola("sala", "🏁 La sfida è finita: si torna in Sala", "verde", 2600); }
    disegnaSalaHost();
  }
  // "⚔️ Altra sfida": tutti nella Sala ("Paky sceglie chi gioca… ⚔️") e l'host è già su "Chi gioca?" con chi ha giocato meno
  function salaAltraSfida(g) {
    if (!sala) return schermataHome();
    lasciaPartita(); FINE = null; RIV = null;
    sala.gioco = null; sala.stanza = null; sala.inGioco = false; sala.fase = null; sala.fuori = {}; sala.ctx = null; sala.duello = null; sala.fineDuello = null;
    sala.sceglie = "sfida"; sala._bcast();
    SGNet.chiudiGiochi(1500);
    salaPreparaGioco(g, { sfida: true });
  }

  // ---------- "👑 CHI VINCE RESTA" (Passo 6): un gioco a due nella Sala, chi vince resta al tavolo, gli altri in coda ----------
  // sala.resta = { gioco, imp, coda: [id], campione, serie, record: { id, nome, n }, sfida: { a, b, stanza }, n (la sfida),
  //   esito: { stanza, n, vince, perde, pari } (com'è finita l'ultima), parte (ora dell'host: quando parte la sfida n),
  //   l (l'ultima sfida lanciata), aperta (la stanza del duello che a ha già aperto) }. Va nel messaggio della Sala (con ora).
  // Ogni sfida è una partita della Sala: se l'host è uno dei due, la sua stanza (salaLancia col codice già deciso); se no il
  // duello aperto dal telefono di a, che è sempre il campione. Gli altri guardano da soli. Pareggio: resta il campione (alla
  // prima sfida a). Chi perde va in fondo alla coda; tra una sfida e l'altra RESTA_PAUSA, poi si parte da soli (3-2-1)
  var RESTA_PAUSA = 8000, RESTA_SALTA = 20000;
  function nomeMembro(S, id) { var m = ((S && S.membri) || []).filter(function (x) { return x && x.id === id; })[0]; return m ? m.nome : ""; }
  // la coda di partenza: tutti gli altri, prima chi ha giocato meno stasera (a pari merito chi è arrivato prima)
  function codaDiPartenza(tranne) {
    var G = sala.giocate || {};
    return sala.membri.map(function (m, i) { return { id: m.id, i: i, n: G[m.nome] || 0, ex: m.ex }; })
      .filter(function (x) { return !x.ex && tranne.indexOf(x.id) < 0; })
      .sort(function (a, b) { return a.n - b.n || a.i - b.i; }).map(function (x) { return x.id; });
  }
  // "👑 Chi vince resta" con i primi due scelti in "Chi gioca?": si parte subito
  function restaInizia(g, R, scelti) {
    if (!sala || !g || !scelti || scelti.length !== 2) return;
    restaFerma(true);
    var imp = impSalvabili(R && R.imp); delete imp.scelti; imp.modo = "online";
    var ids = scelti.map(function (x) { return x.id; });
    sala.resta = { gioco: g.id, imp: imp, coda: codaDiPartenza(ids), campione: null, serie: 0, record: null,
      sfida: { a: ids[0], b: ids[1], stanza: SGNet.nuovoCodice() }, n: 1, esito: null, parte: Date.now(), l: 0 };
    restaTimer();
    restaProssima(1);
  }
  // si apre la sfida n (una volta sola): l'host gioca → la sua stanza; se no il duello. Il 3-2-1 parte da solo quando
  // l'avversario è arrivato (RIV: come la Rivincita), così tra una sfida e l'altra nessuno deve toccare niente
  function restaProssima(n) {
    var Rr = sala && sala.resta; if (!Rr || Rr.n !== n || Rr.l === n || !Rr.sfida || !Rr.sfida.b) return;
    var g = giocoDa(Rr.gioco); if (!g) return restaBasta();
    var a = Rr.sfida.a, b = Rr.sfida.b;
    Rr.l = n; Rr.lanciata = Date.now(); Rr.aperta = null;
    Rr.sfida.na = nomeMembro(sala, a); Rr.sfida.nb = nomeMembro(sala, b);   // (i nomi restano anche se uno se ne va)
    sala.regole = sala.regole || {};
    var R = sala.regole[g.id] || (sala.regole[g.id] = { box: null, imp: impSalvabili(Rr.imp) });
    var sc = [{ id: a, nome: nomeMembro(sala, a) }, { id: b, nome: nomeMembro(sala, b) }];
    lasciaPartita(); FINE = null; RESTA_FINE = null;
    SGNet.chiudiGiochi(1500);   // (la stanza della sfida di prima: un attimo dopo, prima gli amici passano alla nuova)
    if (a === "host" || b === "host") {
      var altro = a === "host" ? b : a, nomi = {}; nomi[altro] = nomeMembro(sala, altro);
      RIV = { codice: Rr.sfida.stanza, attesi: [altro], nomi: nomi, quando: Date.now() + 10000, auto: true, pronti: {}, daSala: true, U: null };
      R.imp.modo = "online"; R.imp.scelti = sc;
      SL.ultimo = null;   // (una stanza nuova: la saletta si rifà, anche se ero ancora nella saletta di prima, es. "⏭ Salta")
      return salaLancia(g, R.imp, R.box, { codice: Rr.sfida.stanza });
    }
    RIV = null;
    salaDuello(g, R, sc, Rr.sfida.stanza);
  }
  // com'è finita la sfida (dalla classifica, o forza = chi vince perché l'altro se n'è andato). true = contata adesso
  function restaEsito(cl, st, forza) {
    var Rr = sala && sala.resta, sf = Rr && Rr.sfida;
    if (!sf || !st || sf.stanza !== st || Rr.l !== Rr.n || (Rr.esito && Rr.esito.stanza === st)) return false;
    var a = sf.a, b = sf.b, vince = forza || null;
    if (!vince && cl) {
      var primi = cl.filter(function (r) { return r && !r.bot && (r.pos || 1) === 1; });
      if (primi.length === 1) vince = stessoNome(primi[0].nome, nomeMembro(sala, a)) ? a : (stessoNome(primi[0].nome, nomeMembro(sala, b)) ? b : null);
    }
    var pari = !vince; if (!vince) vince = a;   // (pareggio: resta il campione, che è sempre a)
    var perde = vince === a ? b : a;
    var nv = (vince === a ? sf.na : sf.nb) || nomeMembro(sala, vince), np = (perde === a ? sf.na : sf.nb) || nomeMembro(sala, perde);
    Rr.serie = Rr.campione === vince ? (Rr.serie || 0) + 1 : 1; Rr.campione = vince;
    if (!Rr.record || Rr.serie > Rr.record.n) Rr.record = { id: vince, nome: nomeMembro(sala, vince), n: Rr.serie };
    Rr.coda = Rr.coda.filter(function (x) { return x !== vince && x !== perde && membroSala(x); });
    if (perde && membroSala(perde)) Rr.coda.push(perde);
    var dopo = membroSala(vince) ? (Rr.coda.shift() || null) : null;
    Rr.esito = { stanza: st, n: Rr.n, vince: vince, perde: perde, pari: pari ? 1 : 0, nv: nv, np: np, via: forza ? 1 : 0 };
    Rr.sfida = { a: vince, b: dopo, stanza: dopo ? SGNet.nuovoCodice() : null };   // (nessuno dopo: rimasti in pochi, si chiude)
    Rr.n += 1; Rr.parte = Date.now() + RESTA_PAUSA;
    restaSaltaTasto(null);
    // uno dei due se n'è andato: la sfida finisce per tutti, si aspetta la prossima nella Sala (la riga della coda col conto)
    if (forza) {
      var dentro = sala.inGioco;
      sala.gioco = null; sala.stanza = null; sala.inGioco = false; sala.fase = null; sala.fuori = {}; sala.ctx = null; sala.duello = null; sala.fineDuello = null; sala.scelti = null;
      if (dentro) { lasciaPartita(); togliGuardo(); FINE = null; }
      SGNet.chiudiGiochi(1500);
      if (sala._bcast) sala._bcast();
      if (sala.pronta) pillola("sala", "🚪 " + (np || "L'avversario") + " non c'è più: resta " + (nv || "l'altro"), "verde", 3000);
      if (sala.pronta && !hostSceglie()) disegnaSalaHost();
      return true;
    }
    if (sala._bcast) sala._bcast();
    return true;
  }
  // il timer dell'host: a `parte` lancia la sfida; dopo 20 s di sfida senza uno dei due, "⏭ Salta Luca"
  function restaTimer() {
    var S0 = sala; if (!S0) return;
    clearInterval(S0.tResta);
    S0.tResta = setInterval(function () {
      if (sala !== S0 || !S0.resta) { clearInterval(S0.tResta); S0.tResta = null; restaSaltaTasto(null); return; }
      var Rr = S0.resta;
      if (Rr.l !== Rr.n) { if (Date.now() >= (Rr.parte || 0)) { if (Rr.sfida && Rr.sfida.b) restaProssima(Rr.n); else restaBasta("pochi"); } return; }
      restaSaltaTasto(restaChiManca());
    }, 500);
  }
  // chi manca alla sfida aperta da più di 20 s (ancora in saletta): l'avversario che la stanza non vede, o nel duello chi doveva aprirla
  function restaChiManca() {
    var Rr = sala.resta, sf = Rr.sfida;
    if (!sf || !sf.stanza || sala.stanza !== sf.stanza || (Rr.esito && Rr.esito.stanza === sf.stanza)) return null;
    if (Date.now() - (Rr.lanciata || 0) < RESTA_SALTA || (sala.fase && sala.fase !== "lobby")) return null;
    if (sf.a === "host" || sf.b === "host") {
      var altro = sf.a === "host" ? sf.b : sf.a, SV = SVH[sf.stanza];
      return SV && !SV.dentro[altro] ? altro : null;
    }
    return Rr.aperta === sf.stanza ? sf.b : sf.a;
  }
  // "⏭ Salta Luca" (solo l'host della Sala, in alto, sopra qualunque schermata): un nodo solo, cambia solo la scritta
  var SALTA_R = null;
  function restaSaltaTasto(id) {
    if (!id || !sala) { if (SALTA_R) { togliNodo(SALTA_R.nodo); SALTA_R = null; } return; }
    var tx = "⏭ Salta " + (nomeMembro(sala, id) || "…");
    if (!SALTA_R) {
      var b = el("button", { class: "sl-resta-salta", type: "button", onclick: function () { if (SALTA_R) restaSalta(SALTA_R.id); } });
      document.body.appendChild(b);
      SALTA_R = { nodo: b };
    }
    SALTA_R.id = id;
    if (SALTA_R.nodo.textContent !== tx) SALTA_R.nodo.textContent = tx;
  }
  // chi non arriva va in fondo alla coda e al suo posto entra il primo della coda (se era il campione, il titolo passa all'altro)
  function restaSalta(id) {
    var Rr = sala && sala.resta, sf = Rr && Rr.sfida;
    restaSaltaTasto(null);
    if (!sf || (id !== sf.a && id !== sf.b) || Rr.l !== Rr.n) return;
    var resta = id === sf.a ? sf.b : sf.a;
    Rr.coda = Rr.coda.filter(function (x) { return x !== id && x !== resta && membroSala(x); });
    if (membroSala(id)) Rr.coda.push(id);
    if (Rr.campione === id) { Rr.campione = null; Rr.serie = 0; }
    var dopo = Rr.coda[0] !== id ? Rr.coda.shift() : null;
    if (!dopo) return restaBasta("pochi");
    pillola("sala", "⏭ " + (nomeMembro(sala, id) || "Chi mancava") + " va in fondo alla coda", "blu", 3000);
    Rr.sfida = { a: resta, b: dopo, stanza: SGNet.nuovoCodice() };
    Rr.n += 1; Rr.parte = Date.now();
    restaProssima(Rr.n);
  }
  // chi esce dalla Sala sparisce dalla coda; se giocava la sfida vince l'altro; se doveva giocare la prossima entra il primo della coda
  function restaVia(id) {
    var Rr = sala && sala.resta; if (!Rr) return;
    Rr.coda = Rr.coda.filter(function (x) { return x !== id; });
    var sf = Rr.sfida; if (!sf || (sf.a !== id && sf.b !== id)) return;
    var altro = sf.a === id ? sf.b : sf.a;
    if (Rr.l === Rr.n && sf.stanza && !(Rr.esito && Rr.esito.stanza === sf.stanza)) { restaEsito(null, sf.stanza, altro); return; }
    if (Rr.campione === id) { Rr.campione = null; Rr.serie = 0; }
    var dopo = altro ? Rr.coda.shift() || null : null;
    Rr.sfida = { a: altro, b: dopo, stanza: dopo ? SGNet.nuovoCodice() : null };
  }
  // uno dei due esce apposta dalla sfida in corso (‹ dal gioco): vince l'altro
  function restaEsce(id, st) {
    var Rr = sala && sala.resta, sf = Rr && Rr.sfida;
    if (!sf || !st || sf.stanza !== st || (id !== sf.a && id !== sf.b)) return false;
    return restaEsito(null, st, id === sf.a ? sf.b : sf.a);
  }
  // un amico nuovo nella Sala: in fondo alla coda (chi rientra col suo id nuovo al posto di un "ex" prende il suo posto)
  function restaEntra(id, vecchio) {
    var Rr = sala && sala.resta; if (!Rr || !id) return;
    if (vecchio) {
      Rr.coda = Rr.coda.map(function (x) { return x === vecchio ? id : x; });
      if (Rr.sfida) { if (Rr.sfida.a === vecchio) Rr.sfida.a = id; if (Rr.sfida.b === vecchio) Rr.sfida.b = id; }
      if (Rr.campione === vecchio) Rr.campione = id;
    }
    if (Rr.coda.indexOf(id) < 0 && !(Rr.sfida && (Rr.sfida.a === id || Rr.sfida.b === id))) Rr.coda.push(id);
  }
  // finisce "Chi vince resta" (senza cambiare schermata): il record della serata resta scritto nella Sala
  function restaFerma(muto) {
    var Rr = sala && sala.resta;
    if (sala) { clearInterval(sala.tResta); sala.tResta = null; }
    restaSaltaTasto(null); RESTA_FINE = null;
    if (!Rr) return;
    if (Rr.record && Rr.record.n >= 2 && (!sala.restaRec || Rr.record.n >= sala.restaRec.n)) sala.restaRec = { nome: Rr.record.nome, n: Rr.record.n };
    sala.resta = null;
    if (!muto && sala._bcast) sala._bcast();
  }
  // "⏹ Basta così": tutti nella Sala
  function restaBasta(perche) {
    if (!sala) return;
    restaFerma(true);
    lasciaPartita(); FINE = null; RIV = null; togliGuardo();
    sala.gioco = null; sala.stanza = null; sala.inGioco = false; sala.fase = null; sala.fuori = {}; sala.ctx = null; sala.duello = null; sala.fineDuello = null; sala.scelti = null; sala.sceglie = false;
    sala._bcast();
    SGNet.chiudiGiochi(1500);
    if (perche === "pochi") pillola("sala", "👑 Siete rimasti in pochi: «Chi vince resta» finisce qui", "blu", 3500);
    disegnaSalaHost();
  }
  // (la Sala si riapre: pagina ricaricata, subentro del vice, trasloco nella Compagnia) la serie riprende da dov'era.
  // Se la sfida in corso è rimasta (il duello di due amici, o la partita che riprende) si aspetta il suo esito; se si è persa:
  // chi non c'è più ha perso, o si rigioca la stessa sfida in una stanza nuova. Poi la pausa e si riparte da soli
  function restaRiprendi() {
    var Rr = sala && sala.resta; if (!Rr) return;
    restaTimer();
    var sf = Rr.sfida || {};
    if (sala.gioco && sala.stanza && sf.stanza === sala.stanza) return;
    if (Rr.l === Rr.n && sf.stanza && !(Rr.esito && Rr.esito.stanza === sf.stanza)) {
      var ca = !!sf.a && !!membroSala(sf.a), cb = !!sf.b && !!membroSala(sf.b);
      if (ca !== cb) { restaEsito(null, sf.stanza, ca ? sf.a : sf.b); return; }
      if (!ca) return restaBasta("pochi");
      Rr.sfida = { a: sf.a, b: sf.b, stanza: SGNet.nuovoCodice() }; Rr.n += 1;
    } else if (Rr.l !== Rr.n) {
      if (!sf.a || !membroSala(sf.a)) { Rr.campione = null; Rr.serie = 0; sf.a = sf.b && membroSala(sf.b) ? sf.b : (Rr.coda.shift() || null); sf.b = null; }
      if (!sf.b || !membroSala(sf.b) || sf.b === sf.a) sf.b = Rr.coda.shift() || null;
      if (sf.b && !sf.stanza) sf.stanza = SGNet.nuovoCodice();
      Rr.sfida = sf;
    }
    Rr.parte = Math.max(Rr.parte || 0, Date.now() + RESTA_PAUSA);
    if (sala._bcast) sala._bcast();
  }
  // (Passo 3) la Sala passa al vice: gli id della serie si rimappano (il mio id di prima → "host"; chi la teneva se n'è andato)
  function restaEredita(r, vecchio) {
    if (!r || typeof r !== "object" || !r.sfida || !giocoDa(r.gioco)) return null;
    function id2(x) { return x === vecchio ? "host" : (x === "host" ? "__via" : x); }
    var R = { gioco: r.gioco, imp: r.imp && typeof r.imp === "object" ? r.imp : {}, coda: (Array.isArray(r.coda) ? r.coda : []).map(id2).filter(function (x) { return x && x !== "__via"; }),
      campione: r.campione && id2(r.campione) !== "__via" ? id2(r.campione) : null, serie: 0, record: null,
      sfida: { a: id2(r.sfida.a), b: id2(r.sfida.b), stanza: r.sfida.stanza || null, na: r.sfida.na, nb: r.sfida.nb }, n: +r.n || 1, l: +r.l || 0, parte: 0,
      esito: r.esito ? { stanza: r.esito.stanza, n: r.esito.n, vince: id2(r.esito.vince), perde: id2(r.esito.perde), pari: r.esito.pari ? 1 : 0, nv: r.esito.nv, np: r.esito.np, via: r.esito.via ? 1 : 0 } : null };
    R.serie = R.campione ? +r.serie || 0 : 0;
    if (r.record && r.record.nome) R.record = { id: id2(r.record.id), nome: String(r.record.nome).slice(0, 16), n: +r.record.n || 0 };
    return R;
  }
  // la serie (o il record) della Sala riaperta (R0: la mia salvata) o ereditata (EZ: subentro, trasloco)
  function restaDaPrima(R0, EZ, k) {
    var v = (R0 && R0[k]) || (EZ && EZ[k]) || null;
    if (!v || typeof v !== "object") return null;
    if (k === "resta" && (!v.sfida || !giocoDa(v.gioco) || !Array.isArray(v.coda))) return null;
    return v;
  }
  // la serie per la foto della Sala (con l'ora dell'host: chi la riceve fa il conto alla rovescia giusto)
  function restaFoto(r) {
    if (!r) return undefined;
    return { gioco: r.gioco, imp: r.imp, coda: r.coda, campione: r.campione, serie: r.serie, record: r.record, sfida: r.sfida, n: r.n,
      esito: r.esito, parte: r.parte, l: r.l, ora: Date.now() };
  }
  // la serie vista da questo telefono: { R, S (la Sala: membri), io (il mio id), host (la Sala è mia) }
  function restaMia() {
    if (sala && sala.resta) return { R: sala.resta, S: sala, io: "host", host: true };
    if (salaG && salaG.resta && !salaG.elim) return { R: salaG.resta, S: salaG, io: mioIdSala(salaG), host: false };
    return null;
  }
  // questa stanza è una sfida della serie (quella in corso o quella appena finita)?
  function restaFineDi(st) {
    var M = restaMia(); if (!M || !st) return null;
    return (M.R.sfida && M.R.sfida.stanza === st) || (M.R.esito && M.R.esito.stanza === st) ? M : null;
  }
  // i secondi che mancano alla prossima sfida (l'host con la sua ora; gli amici dall'ora dell'host nella foto)
  function restaSecondi(R, host) {
    var ms = host ? (R.parte || 0) - Date.now() : (R.parte || 0) - (R.ora || R.parte || 0) - (Date.now() - (R._ric || Date.now()));
    return Math.max(1, Math.ceil(ms / 1000));
  }
  // la fine di una sfida, uguale su tutti i telefoni, in una striscia sola (sta nel posto dei tasti di fine dei giochi):
  // [avatar di chi tocca] "👑 Resta Paky · 🔥 2 di fila" / "Ora tocca a Luca · si parte tra 8…". Sotto, l'host della Sala
  // ha "⏹ Basta così" e "🎮 Cambia gioco" (niente Rivincita né "Ci sto"); gli altri la riga della Classifica della serata.
  // Le scritte si cambiano quando arriva la Sala, senza ridisegnare. rp = { SV, salaHost, host } per la riga dei punti
  var RESTA_FINE = null;   // { nodo, tit, av, nome, conto, stanza, n, avId, c }
  function bloccoResta(piede, st, hostSala, rp) {
    var F = { stanza: st, n: 0 };
    F.tit = el("b", { class: "fr-tit" });
    F.av = el("span", { class: "fr-av", "aria-hidden": "true", hidden: "hidden" });
    F.nome = el("span", { class: "fr-ora-tx" });
    F.conto = el("span", { class: "fr-conto" });
    F.nodo = el("div", { class: "fine-resta", role: "status" }, [ F.av, el("span", { class: "fr-testi" }, [ F.tit, el("span", { class: "fr-sotto" }, [ F.nome, F.conto ]) ]) ]);
    piede.appendChild(F.nodo);
    var box = el("div", { class: "fine-tasti" });
    if (hostSala) {
      box.appendChild(el("button", { class: "btn btn-fantasma ft-primo", type: "button", text: "⏹ Basta così", onclick: function () { restaBasta(); } }));
      box.appendChild(el("button", { class: "btn btn-fantasma ft-secondo", type: "button", text: "🎮 Cambia gioco", onclick: function () { restaFerma(true); salaCambiaGioco(); } }));
    } else if (rp && rp.SV) rigaPuntiFine(box, rp.SV, !!rp.salaHost, !!rp.host);   // (la Classifica della serata: l'host la ha nella Sala)
    if (box.firstChild) piede.appendChild(box);
    FINE = null;
    RESTA_FINE = F;
    restaAggiornaFine();
    return true;
  }
  function restaAggiornaFine() {
    var F = RESTA_FINE; if (!F) return;
    if (F.nodo.isConnected) F.visto = true;
    else if (F.visto) { RESTA_FINE = null; return; }
    var M = restaMia(), R = M && M.R, E = R && R.esito && R.esito.stanza === F.stanza ? R.esito : null;
    var tit = "🏁 Fine sfida", chi = null, txOra = "";
    if (E) {
      tit = (E.pari ? "🤝 Pari: resta " : "👑 Resta ") + (nomeMembro(M.S, E.vince) || E.nv || "…") + (R.campione === E.vince && R.serie >= 2 ? " · 🔥 " + R.serie + " di fila" : "");
      chi = R.sfida && R.sfida.b ? R.sfida.b : null;
      txOra = chi ? (chi === M.io ? "Ora tocca a te!" : "Ora tocca a " + (nomeMembro(M.S, chi) || "…")) : (R.l !== R.n ? "Si torna nella Sala…" : "");
    }
    if (F.tit.textContent !== tit) F.tit.textContent = tit;
    if (F.nome.textContent !== txOra) F.nome.textContent = txOra;
    if (F.av.hidden === !!chi) F.av.hidden = !chi;
    if (chi && F.avId !== chi) {
      F.avId = chi;
      var mm = (M.S.membri || []).filter(function (x) { return x && x.id === chi; })[0];
      F.av.innerHTML = window.SGOmino && mm ? SGOmino.svg(mm.omino || SGOmino.casuale(mm.nome), { busto: true }) : "";
    }
    // il conto ("· si parte tra 8…"): solo quando c'è una sfida dopo
    if (E && chi && R.l !== R.n) {
      if (F.n !== R.n || !F.c || !F.c.vivo()) { F.n = R.n; if (F.c) F.c.ferma(); F.c = contoAvanti(F.conto, restaSecondi(R, M.host), null, "resta|" + R.n, " · si parte tra "); }
    } else { if (F.c) { F.c.ferma(); F.c = null; } if (F.conto.textContent) F.conto.textContent = ""; }
  }
  // la targhetta di chi guarda una sfida: "👀 Guardi · in coda: sei 2°"
  function restaTarga() {
    var P = partitaCorrente; if (!P || !P.viva() || !P.tavolo || !P.tavolo.linkParams || !P.tavolo.linkParams.guarda) return;
    var st = P.tavolo.linkParams.stanza, M = restaFineDi(st), tx = null;
    if (M) {
      var k = M.R.coda.indexOf(M.io);
      if (k >= 0) tx = "Guardi · in coda: sei " + (k + 1) + "°";
      else if (M.R.esito && M.R.esito.stanza === st && M.R.sfida && M.R.sfida.b === M.io) tx = "Guardi · ora tocca a te!";
    }
    if ((P.testoGuardo || null) === tx) return;
    P.testoGuardo = tx;
    if (GUARDO && GUARDO.P === P) chipGuardo(P);
  }
  // qualcosa è cambiato nella serie (foto della Sala, esito): si aggiornano solo le scritte sullo schermo
  function restaAggiorna() {
    restaAggiornaFine(); restaTarga();
    var M = restaMia(), S = M ? M.S : (sala || salaG);
    if (S && S._coda && S._coda.nodo.isConnected) riquadroCoda(S, !!(M ? M.host : sala === S));
  }
  // nella Sala: "👑 Paky 🔥2 · in coda: Luca, Marco, Bea" (+ "Prossima sfida tra 8…" e, per l'host, "⏹ Basta").
  // Senza la serie, dopo "Basta così": "👑 Record di stasera: Luca, 5 di fila". Sempre lo stesso nodo (cambiano le scritte)
  function riquadroCoda(S, host) {
    var R = S && S.resta;
    if (!R) {
      var rec = S && S.restaRec;
      if (!rec || !rec.nome || (+rec.n || 0) < 2) return null;
      var txr = "👑 Record di stasera: " + rec.nome + ", " + rec.n + " di fila";
      if (!S._rec || S._rec.tx !== txr) S._rec = { tx: txr, nodo: el("div", { class: "sl-coda sl-coda-rec" }, [ el("span", { class: "sl-coda-testi" }, [ el("span", { class: "sl-coda-tx", text: txr }) ]) ]) };
      return S._rec.nodo;
    }
    var io = host ? "host" : mioIdSala(S);
    function nm(id) { return id === io ? "tu" : (nomeMembro(S, id) || "…"); }
    var tx = (R.campione ? "👑 " + nm(R.campione) + (R.serie >= 2 ? " 🔥" + R.serie : "") : "👑 Chi vince resta") + (R.coda.length ? " · in coda: " + R.coda.map(nm).join(", ") : "");
    var C = S._coda;
    if (!C || C.host !== host) {
      C = S._coda = { host: host, tx: el("span", { class: "sl-coda-tx" }), conto: el("small", { class: "sl-coda-conto", hidden: "hidden" }) };
      var kids = [ el("span", { class: "sl-coda-testi" }, [ C.tx, C.conto ]) ];
      if (host) kids.push(el("button", { class: "btn btn-fantasma btn-piccolo", type: "button", text: "⏹ Basta", onclick: function () { restaBasta(); } }));
      C.nodo = el("div", { class: "sl-coda" }, kids);
    }
    if (C.tx.textContent !== tx) C.tx.textContent = tx;
    var attesa = R.l !== R.n && !!(R.sfida && R.sfida.b);
    if (C.conto.hidden === attesa) C.conto.hidden = !attesa;
    if (attesa && (C.n !== R.n || !C.c || !C.c.vivo())) { C.n = R.n; if (C.c) C.c.ferma(); C.c = contoAvanti(C.conto, restaSecondi(R, host), null, "resta|" + R.n, "Prossima sfida tra "); }
    else if (!attesa && C.c) { C.c.ferma(); C.c = null; C.n = null; }
    return C.nodo;
  }

  // opz (facoltativo) = { codice, ripresa }: la partita di prima riprende nella stessa stanza (salaRiprendiGioco): stesso
  // codice, e la Sala resta a che punto era (fase, chi è uscito) invece di ripartire dalla saletta
  function salaLancia(g, impostazioni, box, opz) {
    if (!sala) return schermataHome();
    opz = opz || {};
    SGNet.chiudiGiochi();                     // se era rimasta aperta la stanza del gioco di prima, si chiude
    var C = opz.codice ? String(opz.codice).toUpperCase() : SGNet.nuovoCodice();
    SGNet._forza = C;                         // il gioco userà QUESTO codice stanza
    sala.gioco = g.id; sala.stanza = C; sala.inGioco = true; sala.sceglie = false;
    segnaFatto(g.id); if (sala.voto) { clearTimeout(sala.tVoto); sala.voto = null; }   // (un gioco che parte chiude anche il voto)
    if (!opz.ripresa) { sala.fase = "lobby"; sala.fuori = {}; }
    sala.duello = null;
    sala.impGioco = impSalvabili(impostazioni);   // (le regole di questa partita: se la pagina si ricarica, la Sala la riprende con queste)
    // chi gioca, se l'ha scelto l'host ("Chi gioca?"): gli altri guardano e a fine partita non hanno «Ci sto»
    sala.scelti = impostazioni && impostazioni.scelti && impostazioni.scelti.length ? impostazioni.scelti.map(function (x) { return x.id; }) : null;     // (si comincia dalla saletta; chi era uscito dal gioco di prima conta di nuovo)
    if (RIV && RIV.daSala && !RIV.codice && !opz.ripresa) RIV.codice = C;   // "↻ Rivincita" di un gioco che si rilancia: la saletta nuova parte col 3-2-1
    sala._bcast();                            // dice agli altri quale gioco aprire e con che codice
    var ctx = sala.ctx = {
      // si torna in sala: prima lo dico a tutti (tornano da soli), poi chiudo la stanza del gioco
      // ("👑 Chi vince resta": se lascio la sfida in corso vince l'altro, e la serie va avanti da sola)
      esci: function () { if (!sala) return schermataHome(); restaEsce("host", sala.stanza); sala.gioco = null; sala.stanza = null; sala.inGioco = false; sala.fase = null; sala.fuori = {}; sala.ctx = null; sala.duello = null; sala._bcast(); SGNet.chiudiGiochi(1500); disegnaSalaHost(); },
      // "🎮 Cambia gioco" dalla fine: tutti nella Sala, l'host sceglie il prossimo
      cambia: function () { salaCambiaGioco(); },
      // "↻ Rivincita" di un gioco che non sa rifarsi da solo: lo stesso gioco con le stesse regole, in una stanza nuova
      // (gli amici seguono la Sala; gli id restano gli stessi). La stanza di prima si chiude dopo un attimo
      rigioca: function () { if (!sala || sala.ctx !== ctx) return; lasciaPartita(); SGNet.chiudiGiochi(1500); salaPreparaGioco(g, { stessi: true }); },
      // la partita è finita: nel torneo si sommano i punti
      risultato: function (g2, classifica) { salaRisultato(g2, classifica); },
      // (giaDato: la stessa classifica già contata prima che la pagina si ricaricasse: niente punti di nuovo)
      fine: function (g2, classifica, gi, imp, giaDato) { if (!giaDato) salaRisultato(g2, classifica); salaFine(g2, classifica, ctx); }
    };
    linkParams = {};      // l'host apre da host, non da ospite
    // la stanza del gioco nasce con la porta com'è quella della Sala (chi è nella Sala entra lo stesso)
    if (salaSempre() && sala.rete && sala.rete._sv && sala.rete._sv.porta) PORTA_SEME = true;
    avviaPartita(g, [sala.membri[0].nome], impostazioni, { regole: box }, ctx);
  }
  // (Passo 5) la pagina dell'host si è ricaricata a partita in corso: la Sala riaperta rilancia il gioco nella STESSA stanza e
  // il gioco riprende da dove era (avviaPartita trova la sua ripresa da P.forza: t.ripresa). Le regole sono quelle di prima;
  // il riquadro ⚙️ si rifà fuori dalla pagina come in salaPreparaGioco (serve alla Rivincita)
  function salaRiprendiGioco(g, impPrima) {
    if (!sala || !g || sala.gioco !== g.id || !sala.stanza) return disegnaSalaHost();
    // (intanto la partita non c'è più: es. scaduta. La Sala torna senza gioco, come prima)
    if (!ripresaDi(g.id, sala.stanza)) {
      sala.gioco = null; sala.stanza = null; sala.inGioco = false; sala.fase = null; sala.fuori = {}; sala.scelti = null; sala.ctx = null;
      sala._bcast(); return disegnaSalaHost();
    }
    var imp = {}, box = null;
    if (typeof g.impostazioni === "function") {
      box = el("div", { class: "sg-dal-gioco" });   // (🤍 roba del gioco: le sue emoji restano emoji)
      try { g.impostazioni(box, imp, { el: el, sala: true, modo: "online", giocatori: sala.membri.map(function (m) { return m.nome; }) }); }
      catch (e) { setTimeout(function () { throw e; }, 0); }
    }
    Object.keys(impPrima || {}).forEach(function (k) { imp[k] = impPrima[k]; });
    imp.modo = "online";
    sala.regole = sala.regole || {}; sala.regole[g.id] = { box: box, imp: imp };
    salaLancia(g, imp, box, { codice: sala.stanza, ripresa: true });
  }

  // "🎮 Cambia gioco" dalla fine partita: tutti tornano nella Sala ("Paky sceglie il prossimo gioco… 🎲") e l'host è già
  // nell'elenco dei giochi. Tocchi dell'host fino al gioco dopo: Cambia gioco, la tessera, Comincia. Amici: nessuno
  function salaCambiaGioco() {
    if (!sala) return schermataHome();
    lasciaPartita(); FINE = null; RIV = null;
    sala.gioco = null; sala.stanza = null; sala.inGioco = false; sala.fase = null; sala.fuori = {}; sala.ctx = null; sala.duello = null;
    restaFerma(true);   // (anche "Chi vince resta" finisce: il record resta scritto)
    sala.sceglie = true; sala._bcast();
    SGNet.chiudiGiochi(1500);   // (prima gli amici tornano nella Sala, poi la stanza si chiude)
    salaScegliGioco();
  }

  function salaFine(g, classifica, ctx) {
    var T = sala && sala.torneo, punti = {};
    if (T && T.ultima) T.ultima.assegnati.forEach(function (a) { punti[a.nome] = a.punti; });
    var s = schermata({ icona: "🏆", titolo: T ? "Punti di questa partita" : "Fine partita", sotto: g.nome });
    var P = partitaCorrente && partitaCorrente.viva() && partitaCorrente.salaCtx === ctx ? partitaCorrente : null;
    var fac = null; try { fac = P ? P.tavolo.faccine() : null; } catch (e) {}   // (le faccine anche qui)
    var ol = el("ol", { class: "classifica" + (classificaFitta((classifica || []).length, fac ? 56 : 0) ? " fitta" : "") }), med = ["🥇", "🥈", "🥉"];
    (classifica || []).forEach(function (r, i) {
      ol.appendChild(el("li", { class: i === 0 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: med[i] || (i + 1) + "°" }),
        el("span", { class: "nome", text: r.nome }),
        T && punti[r.nome] != null ? el("span", { class: "punti", text: "+" + punti[r.nome] }) : (r.punti != null ? el("span", { class: "punti", text: r.punti }) : null) ]));
    });
    s._contenuto.appendChild(ol);
    if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); }
    // i tasti di fine uguali per tutti: "↻ Rivincita" (lo stesso gioco, stesse regole) e "🎮 Cambia gioco"
    if (!(P && tastiFineCore(s._piede, { host: true, rigioca: true }, { P: P })))
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "👥 Torna alla sala", onclick: ctx.esci }));
    mostra(s);
  }

  // ---------- OSPITE ----------
  function salaOspite(codice) {
    if (!(window.SGNet && SGNet.disponibile())) return salaSenzaRete();
    codice = String(codice).toUpperCase();
    ricordaStanza({ sala: codice });   // se l'app si riapre, in home c'è "Rientra"
    segnaLinkSessione({ sala: codice });   // se la pagina si ricarica, si rientra da soli
    tieniAcceso(true);
    var io = profiloAttivo();
    // nella Sala si entra sempre col profilo (nome e avatar suoi): chi non ce l'ha lo crea e poi entra da solo
    if (!io) return schermataAccesso(function () { salaOspite(codice); });
    entraInSala(codice, io.nome, io.emoji, io.omino || null);
  }
  // o (facoltativo) = { subito: true } lo schermo di adesso resta finché non arriva la Sala (chi cede la sua: niente
  //   "Entro nella sala…" in mezzo); { aspetta: comp } la Compagnia vuota, senza profilo: "🕐 Nessuno ancora" (aspettaCompagnia)
  function entraInSala(codice, nome, emoji, omino, o) {
    o = o || {};
    if (salaG && salaG.rete) try { salaG.rete.chiudi(); } catch (e) {}
    salaG = { rete: null, codice: String(codice).toUpperCase(), myId: null, nome: nome, emoji: emoji, omino: omino, membri: [], inGioco: null, torneo: null, podio: false, _msg: null,
      uscitoDa: null, finitoDa: null, giocoSala: null, nomeHost: "", fuori: [],   // uscitoDa / finitoDa: la stanza del gioco da cui sono uscito o che per me è finita (non mi ci riporta dentro da sola)
      capo: null, ultima: null, comp: compDi(codice), aspetta: o.aspetta || null };   // capo: la Sala che seguo { gen, nato, _s, dev }; ultima: la sua ultima foto
    var S = salaG;
    if (!profiloAttivo()) ricordaNomeStanza(S.codice, nome);
    if (S.aspetta) schermataAspettaComp(S); else if (!o.subito) attendiSala();
    // (decideApp: con due Sale sullo stesso codice decido io quale seguire, con la regola della Sala: vedi primaSala)
    S.rete = SGNet.entra(S.codice, {
      onAperto: function (id) {
        S.myId = id;
        // (la mia Compagnia con un nome più nuovo di quello della Sala: lo passo all'host)
        var v = null; try { v = window.SGCompagnia && S.codice.length === 6 ? SGCompagnia.trova(S.codice) : null; } catch (e) {}
        S.rete.invia({ t: "join", nome: S.nome, emoji: S.emoji, omino: S.omino || null, comp: v && v.rv ? { nome: v.n, emoji: v.e, rv: v.rv } : undefined });
        setTimeout(function () { if (salaG === S && !S.membri.length && S._msg) S._msg.textContent = "Non trovo la sala: controlla il codice o attendi l'host…"; }, 8000); },
      onMsg: function (m) {
        if (salaG !== S || !m || m.t !== "sala") return;
        // la Sala che seguo: con due Sale sullo stesso codice resta quella che vince (uguale su tutti i telefoni);
        // quella che perde per me non esiste. Se vince una Sala nuova la seguo (seguiHost) e, se l'host è cambiato, lo dico
        if (m._s) {
          var k = capoDi(m);
          if (!S.capo) {
            S.capo = k;
            // (la prima foto della Sala: se prima nella stanza c'era altro, es. la partita da cui nasce il torneino, seguo questa)
            var st0 = S.rete && S.rete.stato ? S.rete.stato() : null;
            if (st0 && st0.sessione && st0.sessione !== k._s) { S.cambioHost = true; try { S.rete.seguiHost(k._s); } catch (e) {} }   // (niente "è tornato")
          } else if (k._s !== S.capo._s) {
            if (primaSala(k, S.capo) !== k) return;
            var nh = nomeHostDi(m), cambio = k.gen > S.capo.gen || (!!nh && !!S.nomeHost && !stessoNome(nh, S.nomeHost));
            S.capo = k; S.cambioHost = cambio;
            try { S.rete.seguiHost(k._s); } catch (e) {}
            if (cambio) pillola("tornato", "👑 Ora la Sala la tiene " + (nh || "un amico"), "verde", 3500);
          }
          S.ultima = m;
          // una Sala che si è appena aperta col codice fisso (trasloco, subentro, host che ricarica) guarda prima di parlare e
          // il mio "join" di prima non l'ha sentito: se già mi ha tra i suoi (ereditato) glielo ridico una volta, se no per
          // 30 s non sa che ci sono (non posso fare da vice) e poi mi toglie
          if (S.joinS !== k._s && S.rete && mioIdSala(S) && (m.membri || []).some(function (x) { return x && x.id === mioIdSala(S); })) {
            S.joinS = k._s;
            var vJ = null; try { vJ = window.SGCompagnia && S.codice.length === 6 ? SGCompagnia.trova(S.codice) : null; } catch (e) {}
            try { S.rete.invia({ t: "join", nome: S.nome, emoji: S.emoji, omino: S.omino || null, comp: vJ && vJ.rv ? { nome: vJ.n, emoji: vJ.e, rv: vJ.rv } : undefined }); } catch (e) {}
          }
          // (l'host c'è: nessun vice aspetta. La pausa la segno con la MIA ora di quando la vedo: niente orologi da confrontare)
          clearTimeout(S.tVice); S.tVice = null;
          if (m.pausa) { if (S.pausaV !== m.pausa) { S.pausaV = m.pausa; S.pausaVista = Date.now(); } } else { S.pausaV = null; S.pausaVista = 0; }
          // l'host mi passa la Sala ("👑 Passa la Sala a …"): la prendo subito
          if (m.cede && m.cede === mioIdSala(S) && !m.elim && profiloAttivo()) return subentraSala(S, m, "passata");
        }
        // l'host è tornato mentre giocavo: se il gioco continua (la stessa stanza) lo dice il gioco; se no "si riparte dalla Sala"
        if (S.tornatoDopo) {
          var tD = S.tornatoDopo; S.tornatoDopo = 0;
          if (Date.now() - tD < 6000 && !(m.gioco && m.stanza && S.inGioco === m.stanza)) pillola("tornato", "🎉 " + (nomeHostDi(m) || S.nomeHost || "L'host") + " è tornato: si riparte dalla Sala", "verde", 3500);
        }
        // la Sala si è spostata nella Compagnia (p3-b): si va lì da soli, con lo stesso id
        if (m.trasloco && codiceComp(m.trasloco.codice) && codiceComp(m.trasloco.codice) !== S.codice) return traslocoOspite(S, m.trasloco);
        // la Compagnia: la tengo tra le mie (la prima volta "📌 … è nella tua home"); un nome più nuovo lo prendo
        if (m.comp && m.comp.nome) {
          var cp = compDi(S.codice, m), nuovaC = !S.comp || S.comp.nome !== cp.nome || S.comp.emoji !== cp.emoji;
          S.comp = cp;
          if (window.SGCompagnia && S.codice.length === 6) try {
            if (!SGCompagnia.trova(S.codice)) { if (SGCompagnia.salva({ c: S.codice, n: cp.nome, e: cp.emoji, rv: cp.rv })) pillola("saletta", "📌 «" + cp.emoji + " " + cp.nome + "» è nella tua home", "verde", 3000); }
            else if (nuovaC) SGCompagnia.aggiorna(S.codice, { nome: cp.nome, emoji: cp.emoji, rv: cp.rv });
          } catch (e) {}
        }
        // nella Sala che seguo non ci sono (l'host è cambiato, o mi ha perso): chiedo di nuovo di entrare
        var mioS = mioIdSala(S);
        if (mioS && S.rete && S.rete.riprova && !(m.membri || []).some(function (x) { return x && x.id === mioS; })) try { S.rete.riprova(); } catch (e) {}
        var eraE = S.elim;
        S.membri = m.membri || []; S.torneo = m.torneo || null; S.elim = m.elim || null;
        if (eraE && !S.elim) lasciaTorneo(S);   // il torneino è finito (o fermato): via dalla partita e dal tabellone, si torna nella Sala
        rigaPuntiOra();   // (sulla classifica di fine partita: "🏆 Paky +100 · Luca +78" appena arrivano i punti)
        // il mio nome nella Sala: se c'era già un altro con lo stesso nome, l'host me l'ha cambiato ("Luca 2") e nei giochi uso quello
        S.membri.forEach(function (x) {
          if (x.id === S.myId && x.nome && x.nome !== S.nome) { S.nome = x.nome; if (!profiloAttivo()) ricordaNomeStanza(S.codice, x.nome); }
          if (x.id === "host") S.nomeHost = x.nome;
        });
        if (S.elim) {   // torneo a eliminazione (o il torneino della Sala): si apre da sola la mia partita
          if (S.inGioco !== null) { S.inGioco = null; S.giocoSala = null; S.uscitoDa = null; S.finitoDa = null; S.duello = null; S.faseD = null; S.dFine = null; togliVia(); FINE = null; }   // (il gioco della Sala di prima non c'è più)
          return seguiOspite();
        }
        S.giocate = m.giocate && typeof m.giocate === "object" ? m.giocate : {};
        S.sc = m.gioco && m.stanza && Array.isArray(m.sc) ? { stanza: m.stanza, ids: m.sc } : null;   // (chi gioca, se l'ha scelto l'host)
        // "👑 Chi vince resta": la serie (coda, campione, la sfida dopo) e il record di stasera; _ric = quando l'ho ricevuta (per il conto)
        var eraR = S.resta;
        S.resta = m.resta && typeof m.resta === "object" && m.resta.sfida && Array.isArray(m.resta.coda) ? m.resta : null;
        if (S.resta) S.resta._ric = Date.now();
        S.restaRec = m.restaRec && typeof m.restaRec === "object" ? m.restaRec : null;
        if (eraR && !S.resta) pillola("sala", "👑 «Chi vince resta» è finito: si torna nella Sala", "verde", 2600);
        // (uno dei due se n'è andato a metà sfida: si torna nella Sala e si aspetta la prossima)
        var Ev = S.resta && S.resta.esito;
        if (Ev && Ev.via && S.restaViaN !== Ev.n && (S.resta.parte || 0) > (S.resta.ora || 0)) { S.restaViaN = Ev.n; pillola("sala", "🚪 " + (Ev.np || "L'avversario") + " non c'è più: resta " + (Ev.nv || "l'altro"), "verde", 3000); }
        restaAggiorna();
        // "🗳️ Scegliamo insieme": l'host l'ha acceso (dopo si vota); il voto o la ruota aperti (solo senza un gioco in corso)
        S.insieme = !!m.insieme;
        var Vt = !m.gioco && votoValido(m.voto) ? m.voto : null;
        if (!Vt) votoVia(S);
        if (m.gioco && m.stanza) {
          // fase: a che punto è il gioco; nel: chi è dentro la sua stanza; fuori: chi ne è uscito apposta
          var fase = typeof m.fase === "string" ? m.fase : "lobby", mio = mioIdSala(S);
          var nel = Array.isArray(m.nel) && !!mio && m.nel.indexOf(mio) >= 0;
          // il duello (gioco a due senza l'host): chi lo apre, chi entra, chi guarda (lo smista salaLanciaOspite)
          var D = m.duello && m.duello.stanza === m.stanza ? m.duello : null, faseDi = S.faseD;
          S.duello = D; S.faseD = D ? fase : null;
          // (punto: a che punto è la partita, "round 3 di 5", per il riquadro di chi è fuori)
          S.giocoSala = { gioco: m.gioco, stanza: m.stanza, fase: fase, punto: typeof m.punto === "string" ? m.punto.slice(0, 40) : "" };
          S.fuori = Array.isArray(m.fuori) ? m.fuori : [];
          if (S.guardoIn && S.guardoIn !== m.stanza) { S.guardoIn = null; S.guardoFine = null; }
          // "👑 Chi vince resta": ogni sfida si apre da sola su tutti i telefoni, a qualunque punto sia. Chi la gioca entra; gli
          // altri la guardano senza entrare (la targhetta "👀 Guardi · in coda: sei 2°"), tranne chi ha smesso di guardare questa
          var RS = S.resta && S.resta.sfida && S.resta.sfida.stanza === m.stanza ? S.resta.sfida : null;
          if (RS && S.inGioco !== m.stanza && S.uscitoDa !== m.stanza && S.restaVia !== m.stanza && S.finitoDa !== m.stanza) {
            S.inGioco = m.stanza; S.podio = false;
            if (mio === RS.a || mio === RS.b || D) salaLanciaOspite(m.gioco, m.stanza);   // (il duello lo smista salaLanciaOspite)
            else salaLanciaOspite(m.gioco, m.stanza, { guarda: true });
            return;
          }
          if (S.inGioco === m.stanza) {   // ci sono già: nella saletta cambia solo chi manca
            if (D) seguiDuello(S, D, faseDi, fase);
            else if (guardoEntra(S, m, fase)) return;   // (guardavo e si ricomincia: entro anch'io)
            return rinfrescaAttesi();
          }
          // ne sono uscito: resto nella Sala con "Rientra"
          if (S.uscitoDa === m.stanza) { if (S.inGioco === null) disegnaSalaOspite(); return; }
          // il duello: dentro subito, a qualunque punto sia (chi non gioca lo guarda in diretta)
          if (D) { if (S.finitoDa !== m.stanza) { S.inGioco = m.stanza; S.podio = false; salaLanciaOspite(m.gioco, m.stanza); } else if (S.inGioco === null) disegnaSalaOspite(); return; }
          // si comincia (saletta del gioco, anche "Nuova partita" e "Rivincita"), oppure c'ero già (ho ricaricato la pagina): dentro
          if (fase === "lobby" || (nel && S.finitoDa !== m.stanza)) { S.finitoDa = null; S.inGioco = m.stanza; S.podio = false; salaLanciaOspite(m.gioco, m.stanza); return; }
          // partita in corso e io non c'ero (o per me è finita): resto nella Sala, "entri alla prossima · 👀 Guarda"
          if (S.inGioco === null) disegnaSalaOspite();
          return;
        }
        S.giocoSala = null; S.uscitoDa = null; S.finitoDa = null; S.fuori = []; S.duello = null; S.faseD = null; S.guardoIn = null; S.guardoFine = null;
        S.sceglie = m.sceglie === 2 ? "sfida" : !!m.sceglie;   // l'host sta scegliendo il prossimo gioco ("🎮 Cambia gioco") o chi gioca ("⚔️ Altra sfida")
        if (S.inGioco !== null) {   // tornati in sala: il gioco non disegna più e il suo collegamento si chiude
          S.inGioco = null; lasciaPartita(); SGNet.chiudiGiochi(); togliVia(); FINE = null;
          if (S.sceglie || Vt) pillola("sala", Vt ? "🗳️ Si vota il prossimo gioco!" : (S.sceglie === "sfida" ? "⚔️ Altra sfida!" : "🎮 Si cambia gioco!"), "verde", 2500);
        }
        if (Vt) return votoOspite(S, Vt);   // (la scheda del voto, o la ruota)
        if (S.torneo && S.torneo.finito) { if (!S.podio) { S.podio = true; schermataPodioT(S.torneo, false); } return; }
        S.podio = false;
        disegnaSalaOspite();
      },
      // l'host ha riaperto la Sala (la sua pagina si è ricaricata): il join riparte da solo, qui solo l'avviso.
      // (se la Sala è passata a un altro c'è già "👑 Ora la Sala la tiene Luca")
      // (Passo 5: se sto giocando, la pillola aspetta la foto della Sala: se il gioco continua lo dice il gioco, "riprende da dove era")
      onHostNuovo: function (eraDentro) {
        var cambio = S.cambioHost; S.cambioHost = false;
        if (!eraDentro || salaG !== S || cambio) return;
        if (S.elim && (S.inPartitaK || S.guardaK)) return;   // (torneo a eliminazione: la mia partita, o quella che guardo, continua: lo dice lei)
        if (S.inGioco !== null) { S.tornatoDopo = Date.now(); return; }
        pillola("tornato", "🎉 " + (S.nomeHost || "L'host") + " è tornato: si riparte dalla Sala", "verde", 3500);
      },
      // l'host è sparito (il broker l'ha detto: schermo bloccato, app chiusa…). Se sono uno dei vice (i primi due arrivati col
      // profilo, scritti nella sua ultima foto) prendo la Sala io: il primo dopo 20 s, il secondo dopo 30 s; se l'host era uscito
      // da poco dall'app (pausa: è andato a mandare il link) 90 s e 120 s. Se torna prima, o la prende l'altro vice, niente
      onHostVia: function (sparito) {
        if (salaG !== S) return;
        var u = S.ultima;
        if (sparito && S.tVice && S.tViceU === u) return;   // (lo stesso "host sparito" detto due volte: il conto non riparte)
        clearTimeout(S.tVice); S.tVice = null;
        if (!sparito) return;
        S.viaS = u && u._s;
        if (!u || u.t !== "sala" || u.elim || !profiloAttivo() || (S.capo && u._s !== S.capo._s)) return;
        var k = (Array.isArray(u.vice) ? u.vice : []).indexOf(mioIdSala(S));
        if (k < 0 || k > 1) return;
        var pausa = !!S.pausaVista && Date.now() - S.pausaVista < VICE_PAUSA;
        S.tViceU = u;
        S.tVice = setTimeout(function () { S.tVice = null; if (salaG === S && S.ultima === u) subentraSala(S, u, "sparito"); }, VICE_ATTESA[pausa ? 1 : 0][k]);
      },
      onChiuso: function (perche) {
        if (salaG !== S) return;
        if (perche && perche.sparito) {
          // (aspettavo di fare il vice proprio adesso: la prendo invece di chiudere)
          if (S.tVice && S.ultima) { clearTimeout(S.tVice); S.tVice = null; return subentraSala(S, S.ultima, "sparito"); }
          if (S.viaS && S.capo && S.capo._s !== S.viaS) return;   // (seguo già la Sala di un altro: quella di prima non conta)
        }
        lasciaPartita(); chiudiSalaOspite();
        errore(schermataHome, perche && perche.sparito ? "La Sala è chiusa: chi l'ha aperta non è tornato in tempo." : "La Sala è stata chiusa dall'host.");
      },
      onErrore: function () { if (salaG !== S) return; chiudiSalaOspite(); errore(schermataHome, "Problema di collegamento con la sala. Riprova."); }
    }, { tieni: true, decideApp: true });   // resta aperta tra un gioco e l'altro
  }

  function chiudiSalaOspite() { try { if (salaG && salaG.rete) salaG.rete.chiudi(); } catch (e) {} salaG = null; dimenticaStanza(); }

  // l'host ha fatto della Sala una Compagnia: la sua ultima foto dice dove è andata. Chi era dentro ci va subito con lo stesso
  // id (l'host lo aspetta al suo posto); chi arriva dopo (link vecchio, app riaperta) ci entra come dalla tessera della home
  function traslocoOspite(S, tr) {
    if (S.traslocato || salaG !== S) return;
    S.traslocato = true;
    var C = codiceComp(tr.codice), cp = compDi(C, { comp: tr.comp }) || compVuota(C), mio = mioIdSala(S);
    var dentro = !!mio && (S.membri || []).some(function (x) { return x && x.id === mio; });
    if (mio) SGNet.ricordaId(C, mio);   // (nella Compagnia lo stesso id di prima: stesso posto, stessi giochi)
    var kS = chiaveDi(S.codice); if (kS) chiaveDi(C, false, kS);   // (🔑 la chiave delle foto di stasera viene con noi)
    try { if (window.SGCompagnia) { if (!SGCompagnia.salva({ c: C, n: cp.nome, e: cp.emoji, rv: cp.rv })) SGCompagnia.aggiorna(C, cp); } } catch (e) {}
    if (!profiloAttivo()) ricordaNomeStanza(C, S.nome);
    if (S.inGioco !== null) { S.inGioco = null; lasciaPartita(); SGNet.chiudiGiochi(); togliVia(); FINE = null; }
    var titoloC = cp.emoji + " " + cp.nome;
    setTimeout(function () {
      if (salaG !== S) return;
      if (!dentro) {   // (non ero nella Sala: la Compagnia si apre come dalla home)
        pillola("saletta", "📌 La Sala ora è «" + titoloC + "»: la trovi in home", "verde", 4000);
        return apriCompagnia(C, { nome: cp.nome, emoji: cp.emoji });
      }
      ricordaStanza({ sala: C }); segnaLinkSessione({ sala: C });   // (la Sala di prima non va più ricordata)
      pillola("saletta", "📌 Ora siete «" + titoloC + "»: la trovi in home", "verde", 4000);
      entraInSala(C, S.nome, S.emoji, S.omino, { subito: true });   // (lo schermo resta finché non arriva la Compagnia)
    }, 0);
  }

  // ---------- LA COMPAGNIA: entrare o aprire la serata ----------
  // il nome di una Compagnia che non conosco ancora
  function compVuota(C) { return { nome: "Compagnia " + C, emoji: "📌", rv: 0 }; }
  // la Compagnia C (dalla tessera in home, dal link fisso, da "🔑 Ho un codice"). info = { nome, emoji, gioco, daCodice }
  // Prima si sbircia: se dentro c'è qualcuno si entra da amico; se no la apre chi ha il profilo (gen + 1 se c'era una Sala
  // morta), e chi non ce l'ha entra e aspetta. Da "Ho un codice" (daCodice = "riscrivi"), per una Compagnia che non è tra
  // le mie e dove non c'è nessuno, prima si chiede: così una lettera sbagliata non apre una Compagnia fantasma
  function apriCompagnia(C, info) {
    info = info || {};
    C = codiceComp(C);
    if (!C) return schermataHome();
    if (!(window.SGNet && SGNet.disponibile())) return salaSenzaRete();
    // ci sono già
    if (sala && sala.codice === C) return disegnaSalaHost();
    if (salaG && salaG.codice === C) { if (salaG.membri.length) return disegnaSalaOspite(); if (salaG.aspetta) return schermataAspettaComp(salaG); }
    // un'altra Sala aperta da me: prima si chiude (gli amici restano senza)
    if (sala) return chiediConferma("Chiudere la tua Sala " + sala.codice + "?", "Gli amici che ci sono restano senza Sala.", "Chiudi e vai", function () { chiudiSala(); apriCompagnia(C, info); });
    if (salaG) { lasciaPartita(); chiudiSalaOspite(); }
    var nota = compDi(C), comp = nota || (info.nome ? { nome: String(info.nome).slice(0, 24), emoji: String(info.emoji || "📌").slice(0, 8), rv: 0 } : null);
    try { if (window.SGCompagnia) SGCompagnia.usata(C); } catch (e) {}
    var s = schermata({ icona: comp ? comp.emoji : "📌", titolo: comp ? "Entro in " + comp.nome + "…" : "Entro nella compagnia…", sotto: "Codice " + C, indietro: schermataHome });
    s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Guardo chi c'è… un attimo." }));
    mostra(s);
    function dopo(es) {
      if (!document.body.contains(s)) return;   // intanto si è andati altrove
      var r = (es && es[C]) || { stato: "boh", msg: null, gen: 0 }, msg = r.msg;
      // (dal modo "Compagnia" di un gioco: la Sala la tiene un altro, glielo dico)
      if (r.stato === "viva") { salaOspite(C); if (info.gioco) dilloAllHost(nomeHostDi(msg), info.gioco); return; }
      var apri = function () {
        if (!profiloAttivo()) return aspettaCompagnia(C, comp || compVuota(C));
        var dz = msg && msg.t === "sala" ? msg : null;   // (una Sala trattenuta che non risponde: si continua con i suoi amici)
        creaSala({ codiceFisso: C, comp: comp || compVuota(C), gen: (+r.gen || 0) + 1, sopra: (msg && (msg._s || msg.s)) || null, gioco: info.gioco || null,
          eredita: dz ? { membri: dz.membri, torneo: dz.torneo, giocate: dz.giocate } : null });
      };
      // scritta a mano e non è tra le mie: "Apri tu la serata?" (oppure si riscrive il codice)
      if (info.daCodice && !nota) {
        svuota(s._contenuto); svuota(s._piede);
        s._contenuto.appendChild(el("p", { class: "link-avviso", text: "Non c'è nessuno nella compagnia " + C + ". Apri tu la serata?" }));
        s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Se il codice te l'ha dato un amico, controlla di averlo scritto giusto." }));
        s._piede.appendChild(el("button", { class: "btn btn-primario", text: "📌 Apri la serata", onclick: apri }));
        s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "✏️ Riscrivi il codice", onclick: info.daCodice }));
        return;
      }
      apri();
    }
    if (window.SGCompagnia && SGCompagnia.sbircia) SGCompagnia.sbircia([C], dopo, true);
    else SGNet.sbircia([C], dopo);
  }
  // la Compagnia vuota, senza profilo: si entra col nome di questo telefono e si aspetta (se il nome non c'è, il profilo)
  function aspettaCompagnia(C, comp) {
    var nome = nomeStanza(C) || nomeOspiteSalvato();
    if (!nome) return schermataAccesso(function () { apriCompagnia(C, comp ? { nome: comp.nome, emoji: comp.emoji } : null); });
    ricordaStanza({ sala: C }); segnaLinkSessione({ sala: C }); tieniAcceso(true);
    entraInSala(C, nome, "🙂", window.SGOmino ? SGOmino.casuale(nome) : null, { aspetta: comp || compVuota(C) });
  }
  // "🎮 La Sala la tiene Paky: digli che vuoi giocare a Tris" (il modo "Compagnia" quando la Sala è di un altro)
  function dilloAllHost(nomeH, gid) {
    var g = giocoDa(gid); if (!g) return;
    pillola("saletta", nomeH ? "🎮 La Sala la tiene " + nomeH + ": digli che vuoi giocare " + aGioco(g.nome) : "🎮 La Sala è già aperta: chiedi di giocare " + aGioco(g.nome), "blu", 6000);
  }
  // il modo "Online con «Quelli del giovedì»" di "Come giocate?": se la Sala della Compagnia è mia il gioco parte lì; se ci
  // sono dentro da amico o la tiene un altro ci entro e glielo dico; se non c'è nessuno la apro io e si va dritti nel gioco
  function giocaInCompagnia(g, C) {
    C = codiceComp(C);
    if (!C) return schermataModo(g);
    if (sala && sala.codice === C) return apriOnlineSala(g);
    if (salaG && salaG.codice === C && salaG.membri.length) { disegnaSalaOspite(); return dilloAllHost(salaG.nomeHost, g.id); }
    apriCompagnia(C, { gioco: g.id });
  }
  // "🔁 Riapri la Sala di ieri sera": lo stesso codice di 4 lettere (il link vecchio nella chat vale ancora), Sala nuova (niente
  // punti di ieri). Prima si guarda il codice: libero → si riapre; la Sala di ieri ancora viva con dentro gli amici di ieri (l'ha
  // presa uno di loro) → si entra da amico; occupato da altri (o la rete non risponde) → Sala con un codice nuovo e si avvisa
  function riapriSalaIeri(o) {
    if (!(window.SGNet && SGNet.disponibile())) return salaSenzaRete();
    if (sala || salaG) return schermataHome();
    var C = String(o.codice).toUpperCase();
    var s = schermata({ icona: "🔁", titolo: "Riapro la Sala…", sotto: "Codice " + C, indietro: schermataHome });
    s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Guardo se il codice è libero… un attimo." }));
    mostra(s);
    SGNet.sbircia([C], function (es) {
      if (!document.body.contains(s) || sala || salaG) return;   // (intanto si è andati altrove)
      var r = (es && es[C]) || { stato: "boh", msg: null, gen: 0 }, m = r.msg;
      if (r.stato === "viva" && m && m.t === "sala" && !m.trasloco && (m.membri || []).some(function (x) { return x && o.nomi.some(function (n) { return stessoNome(n, x.nome); }); }))
        return salaOspite(C);
      if (r.stato === "viva" || r.stato === "boh") {
        creaSala();
        if (r.stato === "viva") pillola("sala", "Il codice di ieri era occupato: la Sala ha un codice nuovo, rimanda il link", "blu", 6000);
        return;
      }
      // (ferma: c'era una Sala morta su quel codice → una generazione in più, sopra il suo testamento)
      creaSala({ codiceFisso: C, gen: r.stato === "ferma" ? (+r.gen || 0) + 1 : 1, sopra: (m && (m._s || m.s)) || null });
      pillola("sala", "🔁 Sala " + C + " riaperta: il link di ieri vale ancora", "verde", 4000);
    });
  }

  function attendiSala() {
    var cp = salaG.comp;
    var s = schermata({ icona: cp ? cp.emoji : "👥", titolo: cp ? "Entro in " + cp.nome + "…" : "Entro nella sala…", sotto: "Codice " + salaG.codice,
      indietro: function () { chiudiSalaOspite(); schermataHome(); } });
    salaG._msg = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" });
    s._contenuto.appendChild(salaG._msg);
    mostra(s);
  }
  // la Compagnia senza nessuno dentro, per chi non ha il profilo (aprirla serve il profilo): si resta collegati e si
  // entra da soli appena qualcuno apre la serata ("sono entrato" parte da solo quando arriva l'host)
  function schermataAspettaComp(S) {
    var cp = S.comp || S.aspetta || {}, C = S.codice;
    var s = schermata({ icona: cp.emoji || "📌", titolo: cp.nome || "Compagnia " + C, sotto: "Codice " + C,
      indietro: function () { if (salaG === S) chiudiSalaOspite(); schermataHome(); } });
    s.classList.add("cmp-aspetta");
    s._contenuto.appendChild(el("div", { class: "cmp-attesa" }, [
      el("div", { class: "cmp-attesa-ico", "aria-hidden": "true", text: "🕐" }),
      el("b", { class: "cmp-attesa-tit", text: "Nessuno ancora nella compagnia" }),
      el("p", { class: "cmp-attesa-sotto", text: "Appena qualcuno apre la serata entri da solo." })
    ]));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "👤 Crea il profilo e aprila tu", onclick: function () {
      schermataAccesso(function () { if (salaG === S) chiudiSalaOspite(); apriCompagnia(C, cp.nome ? { nome: cp.nome, emoji: cp.emoji } : null); });
    } }));
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Torna alla home", onclick: function () { if (salaG === S) chiudiSalaOspite(); schermataHome(); } }));
    S._msg = null;
    mostra(s);
  }

  function disegnaSalaOspite() {
    if (!salaG) return;
    amiciStato("sala", salaG.codice);
    var T = salaG.torneo, E = salaG.elim;
    var extra = E ? [boxElimSala(E, salaG.myId, false, salaG, seguiOspite)] : (T ? [boxTorneoCorto(T, salaG)] : []);
    var TN = !!(E && E.torneino), nH = salaG.nomeHost || "L'host";
    // un gioco in corso senza di me: ne sono uscito ("Rientra ▶") o sono arrivato a partita cominciata ("entri alla prossima · 👀 Guarda")
    var gs = !E && salaG.giocoSala && salaG.inGioco === null ? salaG.giocoSala : null;
    var tipo = !gs ? null : (salaG.uscitoDa === gs.stanza ? "rientra" : (gs.fase && gs.fase !== "lobby" && salaG.finitoDa !== gs.stanza ? "prossima" : null));
    var inCorso = tipo ? boxInCorso(gs, tipo) : null;
    var coda = !E ? riquadroCoda(salaG, false) : null;   // ("👑 Paky 🔥2 · in coda: Luca, tu")
    if (coda) extra.unshift(coda);
    if (inCorso) extra.unshift(inCorso);
    var sS = saletta(gSala(!!T, E, salaG.comp), {
      host: false, codice: salaG.codice, _rete: salaG.rete, link: linkSala(salaG.codice),
      // (con la Sala sempre accesa il codice sta già nella testata: sotto il titolo di chi è la Sala)
      sotto: TN ? "Torneo a eliminazione · Sala di " + nH : (E ? "Torneo a eliminazione · codice " + salaG.codice : (salaSempre() && salaG.nomeHost ? "Sala di " + salaG.nomeHost : "Codice " + salaG.codice)),
      giocatori: salaG.membri.map(function (m) { return { id: m.id, nome: m.nome, omino: m.omino || null, host: m.id === "host", tu: m.id === salaG.myId }; }),
      extra: extra,
      attesa: TN ? (E.finito ? nH + " vi riporta nella Sala: non devi toccare niente." : (E.iniziato ? "Quando tocca a te, la partita si apre da sola." : (E.scade ? "Tocca un posto libero: ti siedi lì, con chi vuoi." : "Si comincia appena ci siete tutti.")))
        : E ? (E.iniziato ? "Quando tocca a te, la partita si apre da sola." : "Tocca il girone in cui vuoi giocare, poi aspetta che l'host faccia partire il torneo.")
        : salaG.resta && tipo !== "rientra" ? "👑 Le sfide partono da sole: quando tocca a te, entri da solo."
        : (tipo === "rientra" ? "Gli altri stanno giocando: rientra quando vuoi, oppure aspetta qui il prossimo gioco."
          : (tipo === "prossima" ? attesaInCorso(salaG, gs)
            : (salaG.sceglie && !gs ? (salaG.nomeHost || "L'host") + (salaG.sceglie === "sfida" ? " sceglie chi gioca… ⚔️" : (salaG.insieme ? " propone 3 giochi: poi votate tutti… 🗳️" : " sceglie il prossimo gioco… 🎲")) : "Aspetta che l'host scelga un gioco: parte da solo sul tuo telefono."))),
      onEsci: function () { chiudiSalaOspite(); schermataHome(); }
    });
    if (sS) sS.classList.toggle("con-tabellone", !!(E && (E.iniziato || (E.torneino && E.scade))));
    salaG._msg = null;
  }
  // nella Sala, un gioco in corso senza di me (sempre lo stesso riquadro: niente lampeggio, cambiano solo le scritte):
  //  "rientra": ne sono uscito → "🎮 Stanno giocando a Tris · Rientra ▶" (e la Sala torna ad aspettarmi);
  //  "prossima": sono arrivato a partita cominciata → secondo il gioco (modoInCorso):
  //    "entra"  (Balla, Black Jack… a partita in corso): "▶ Entra · giochi dal prossimo turno" e "👀 Guarda";
  //    "guarda" (gli altri, o a partita finita): "👀 Guarda" e sotto "entri alla prossima partita";
  //    "due"    (giochi a due): "👀 Guarda la sfida"; "scelti": ha scelto l'host chi gioca, si guarda.
  //  Prima riga "🎮 Si gioca a Balla · round 3 di 5" (il punto lo dà il gioco dell'host con t.aCheSiamo)
  // la riga sotto la Sala quando c'è un gioco in corso senza di me
  function attesaInCorso(S, gs) {
    var D = S.duello && S.duello.stanza === gs.stanza ? S.duello : null;
    if (D) return "Guardali in diretta quando vuoi: alla fine si torna qui.";
    var modo = modoInCorso(S, gs), g = giocoDa(gs.gioco);
    if (modo === "entra") return g && g.ritardatari === "subito" ? "✋ Puoi entrare: giochi subito." : "✋ Puoi entrare subito: giochi " + (g && g.ritardatari === "mano" ? "dalla prossima mano" : "dal prossimo turno") + ".";
    if (modo === "due") return "Giocano in due: guardali in diretta quando vuoi.";
    if (modo === "scelti") return "Giocano quelli scelti da " + (S.nomeHost || "l'host") + ": guardali quando vuoi.";
    return "Alla prossima partita entri da solo: non devi toccare niente.";
  }
  function modoInCorso(S, gs) {
    var g = giocoDa(gs.gioco), mio = mioIdSala(S);
    if (aDue(g)) return "due";
    if (S.sc && S.sc.stanza === gs.stanza && S.sc.ids.indexOf(mio) < 0) return "scelti";
    var r = g && g.ritardatari;
    return (r === "turno" || r === "mano" || r === "subito") && gs.fase === "gioco" ? "entra" : "guarda";
  }
  function boxInCorso(gs, tipo) {
    var S0 = salaG, D = S0.duello && S0.duello.stanza === gs.stanza ? S0.duello : null, mio = mioIdSala(S0);
    var modo = D && mio !== D.a && mio !== D.b ? "duello" : (tipo === "rientra" ? "rientra" : modoInCorso(S0, gs));
    var g = giocoDa(gs.gioco), nome = g ? g.nome : "un gioco";
    // la prima riga: il gioco (o chi gioca la sfida) e, a partita in corso, a che punto è
    var punto = gs.fase === "gioco" && gs.punto ? " · " + gs.punto : "", testa;
    if (modo === "duello") testa = "⚔️ " + D.na + " e " + D.nb + " giocano " + aGioco(nome);
    else if (modo === "rientra") testa = "🎮 Stanno giocando " + aGioco(nome) + punto;
    else if (modo === "due" && S0.sc && S0.sc.stanza === gs.stanza && S0.sc.ids.length === 2) {
      var nm = S0.sc.ids.map(function (id) { var x = (S0.membri || []).filter(function (m) { return m.id === id; })[0]; return x ? x.nome : "?"; });
      testa = "⚔️ " + nm[0] + " e " + nm[1] + " giocano " + aGioco(nome) + punto;
    } else testa = "🎮 Si gioca " + aGioco(nome) + punto;
    var quando = g && g.ritardatari === "mano" ? "dalla prossima mano" : g && g.ritardatari === "subito" ? "subito" : "dal prossimo turno";
    var sotto = modo === "guarda" ? "entri alla prossima partita" : (modo === "due" ? "giocano in due: tu guardi"
      : (modo === "scelti" ? "gioca chi ha scelto " + (S0.nomeHost || "l'host") : ""));
    var k = gs.stanza + "|" + modo;
    var B = S0._inCorso;
    if (B && B.k === k) {   // (lo stesso riquadro: cambiano solo le scritte)
      if (B.b.textContent !== testa) B.b.textContent = testa;
      if (B.sm && B.sm.textContent !== sotto) B.sm.textContent = sotto;
      return B.nodo;
    }
    function entra(rientro) {
      var S = salaG; if (!S || !S.giocoSala) return;
      if (rientro) try { S.rete.invia({ t: "rientro", stanza: S.giocoSala.stanza }); } catch (e) {}   // (la Sala mi aspetta di nuovo)
      S.uscitoDa = null; S.inGioco = S.giocoSala.stanza; S.podio = false;
      salaLanciaOspite(S.giocoSala.gioco, S.giocoSala.stanza);
    }
    // 👀 senza entrare: niente join (il duello lo smista salaLanciaOspite). Un gioco che non dice ancora i suoi ritardatari
    // (non è passato dal Passo 6) non sa disegnare chi guarda senza join: lì si entra come prima e il gioco fa guardare lui
    function guarda() {
      var S = salaG; if (!S || !S.giocoSala) return;
      S.inGioco = S.giocoSala.stanza; S.podio = false;
      var gg = giocoDa(S.giocoSala.gioco);
      salaLanciaOspite(S.giocoSala.gioco, S.giocoSala.stanza, gg && gg.ritardatari ? { guarda: true } : null);
    }
    var b = el("b", { text: testa }), sm = sotto ? el("small", { text: sotto }) : null, nodo;
    var testo = el("span", { class: "sl-inc-testo" }, [ b, sm ]);
    if (modo === "rientra") nodo = el("div", { class: "sl-incorso" }, [ testo,
      el("button", { class: "btn btn-primario btn-piccolo", text: "Rientra ▶", onclick: function () { entra(true); } }) ]);
    else if (modo === "entra") nodo = el("div", { class: "sl-incorso prossima due-tasti" }, [ testo,
      el("div", { class: "sl-inc-tasti" }, [
        el("button", { class: "btn btn-primario btn-piccolo sl-inc-entra", text: "▶ Entra · giochi " + quando, onclick: function () { entra(false); } }),
        el("button", { class: "btn btn-fantasma btn-piccolo", text: "👀 Guarda", onclick: guarda }) ]) ]);
    else nodo = el("div", { class: "sl-incorso prossima" + (modo === "duello" ? " sl-duello" : "") }, [ testo,
      el("button", { class: "btn btn-fantasma btn-piccolo", text: modo === "duello" || modo === "due" ? "👀 Guarda la sfida" : "👀 Guarda", onclick: guarda }) ]);
    S0._inCorso = { k: k, nodo: nodo, b: b, sm: sm };
    return nodo;
  }
  // il mio id nella Sala (subito, anche prima che il collegamento dica "aperto")
  function mioIdSala(S) { return (S && (S.myId || (S.rete && S.rete.mioId))) || null; }

  // o (facoltativo) = { guarda: true }: "👀 Guarda" del riquadro della Sala, si guarda senza entrare (vedi guardaInSala)
  function salaLanciaOspite(gid, code, o) {
    SGNet.chiudiGiochi();   // il collegamento del gioco di prima (se c'è) si chiude: niente errori a sorpresa
    var g = giocoDa(gid);
    if (!g) { disegnaSalaOspite(); return; }
    // si torna nella Sala (anche se intanto la Sala è passata a me: vedi tornaInSala)
    var codiceSala = salaG ? salaG.codice : null;
    function torna(finita) { tornaInSala(codiceSala, code, finita); }
    if (salaG) { salaG.guardoIn = null; salaG.guardoFine = null; }
    // il duello (gioco a due senza l'host della Sala): il primo apre la stanza, il secondo entra come sempre, gli altri guardano
    var D = salaG && salaG.duello && salaG.duello.stanza === code ? salaG.duello : null, mio = mioIdSala(salaG);
    if (D && mio === D.a) return giocaDuello(g, D, torna);
    if (D && mio !== D.b) return guardaDuello(g, D, torna);
    if (o && o.guarda && salaG) return guardaInSala(g, code, codiceSala, mio);
    linkParams = { gioco: gid, stanza: code };   // il gioco lo legge subito (t.linkParams)
    if (mio) SGNet.ricordaId(code, mio);   // nel gioco lo stesso id che ho nella Sala
    // (se intanto la Sala è passata a me e questa partita è rimasta, p3-c: i punti li conto io, una volta per partita)
    var contati = {};
    function contaSeHost(g2, cl) {
      if (!sala || sala.codice !== codiceSala || sala.stanza !== code || sala.duello || !g2 || !cl || !cl.length) return;   // (il duello lo conta chi l'ha aperto)
      var k = JSON.stringify(cl.map(function (r) { return [r.nome, r.pos]; }));
      if (contati[k]) return;
      contati[k] = 1; salaRisultato(g2, cl);
    }
    var ctx = {
      stanza: code,   // (la stanza del gioco: il subentro guarda se è la partita che resta)
      esci: function () { torna(false); },
      risultato: function (g2, classifica) { contaSeHost(g2, classifica); },
      // il gioco ha finito con t.fine: prima la classifica con "👍 Ci sto!" e "🏠 Torna in Sala", poi si segue la Sala
      // (senza classifica, es. fatto uscire dall'host: dritto nella Sala)
      fine: function (g2, classifica) {
        contaSeHost(g2, classifica);
        var P = partitaCorrente && partitaCorrente.viva() && partitaCorrente.salaCtx === ctx ? partitaCorrente : null;
        if (!P || !g2 || !classifica || !classifica.length) return torna(true);
        fineSalaAmico(g2, classifica, P, ctx, false, torna);
      },
      // il gioco ha chiuso la sua stanza (partita finita): niente "Collegamento perso", si torna nella Sala
      chiusa: function () { torna(true); pillola("sala", "🏁 Partita finita: si torna in Sala", "verde", 2600); }
    };
    avviaPartita(g, [], {}, null, ctx);
  }
  // "👀 Guarda" nella Sala: la partita in corso senza entrare (niente join: la targhetta "👀 Guardi", nessuna mossa). Uscendo
  // si torna nella Sala SENZA "esco" (non ero un giocatore: la Sala non mi conta tra chi è uscito) e il riquadro torna com'era.
  // Quando la partita torna in saletta entro da solo (lo fa la Sala: guardoEntra), tranne nei giochi a due
  function guardaInSala(g, code, codiceSala, mio) {
    var S = salaG;
    S.guardoIn = code; S.guardoFine = null;
    function torna() {
      lasciaPartita(); SGNet.chiudiGiochi(); togliGuardo();
      if (salaG && salaG.codice === codiceSala) {
        salaG.inGioco = null; salaG.dFine = null; salaG.guardoIn = null; salaG.guardoFine = null;
        return disegnaSalaOspite();
      }
      tornaInSala(codiceSala, code, true);   // (intanto la Sala è passata a me)
    }
    var ctx = {
      stanza: code, guardaSala: true,
      // (✕ "Smetti di guardare": in "Chi vince resta" questa sfida non mi riporta dentro da sola, la prossima sì)
      esci: function () { if (salaG === S) S.restaVia = code; torna(); }, risultato: function () {},
      // la classifica (se il gioco la dà anche a chi guarda): "🏠 Torna in Sala"; alla rivincita la Sala mi riporta dentro
      fine: function (g2, cl) {
        var P = partitaCorrente && partitaCorrente.viva() && partitaCorrente.salaCtx === ctx ? partitaCorrente : null;
        if (!P || !g2 || !cl || !cl.length) return torna();
        if (salaG === S) S.guardoFine = code;
        fineSalaAmico(g2, cl, P, ctx, false, function () { torna(); });
      },
      chiusa: function () { torna(); pillola("sala", "🏁 Partita finita: si torna in Sala", "verde", 2600); }
    };
    linkParams = { gioco: g.id, stanza: code, guarda: 1 };
    if (mio) SGNet.ricordaId(code, mio);   // (lo stesso id della Sala: quando entro a giocare l'host mi toglie dal pubblico)
    avviaPartita(g, [], {}, null, ctx);
    restaTarga();   // ("👀 Guardi · in coda: sei 2°")
  }
  // chi guardava una partita della Sala e la partita torna in saletta (Rivincita, Nuova partita): entra anche lui, da solo.
  // Nei giochi a due no: si continua a guardare (dalla classifica si torna a guardare la partita nuova)
  function guardoEntra(S, m, fase) {
    if (S.guardoIn !== m.stanza) return false;
    var g = giocoDa(m.gioco); if (!g) return false;
    if (aDue(g)) {
      if (S.guardoFine === m.stanza && fase !== "fine") { S.guardoFine = null; salaLanciaOspite(m.gioco, m.stanza, { guarda: true }); return true; }
      return false;
    }
    if (fase !== "lobby") return false;
    pillola("guardo", "✋ Si ricomincia: entri anche tu!", "verde", 2500);
    togliGuardo(); lasciaPartita();
    S.finitoDa = null; S.uscitoDa = null; S.inGioco = m.stanza; S.podio = false;
    salaLanciaOspite(m.gioco, m.stanza);
    return true;
  }
  // la classifica di fine partita sul telefono di un amico della Sala (host = ha aperto lui la stanza: il duello)
  function fineSalaAmico(g2, classifica, P, ctx, host, torna) {
    var s = schermata({ icona: "🏆", titolo: "Fine partita", sotto: g2.nome });
    var fac = null; try { fac = P.tavolo.faccine(); } catch (e) {}
    var ol = el("ol", { class: "classifica" + (classificaFitta(classifica.length, fac ? 56 : 0) ? " fitta" : "") }), med = medaglieAPari(classifica.map(function (r, i) { return r.pos || i + 1; }));
    classifica.forEach(function (r, i) {
      ol.appendChild(el("li", { class: (r.pos || i + 1) === 1 ? "vincitore" : "" }, [ el("span", { class: "pos", text: med[i] }), el("span", { class: "nome", text: r.nome }),
        r.punti != null ? el("span", { class: "punti", text: typeof r.punti === "number" && r.punti % 1 === 0 ? cifre(r.punti) : r.punti }) : null ]));
    });
    s._contenuto.appendChild(ol);
    if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); }
    if (!tastiFineCore(s._piede, { host: host, esci: function () { if (host) ctx.esci(); else torna(false); } }, { P: P, ctx: ctx }))
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna in Sala", onclick: function () { if (host) ctx.esci(); else torna(true); } }));
    mostra(s);
  }
  // il duello sul telefono di chi l'apre (a): la stanza col codice scelto dalla Sala, si siedono solo i due.
  // Dice alla Sala com'è finita ogni partita (salaEsito: l'host la conta) e a che punto è (duelloFase: chi guarda la
  // classifica torna a guardare da solo quando si rigioca). "🏠 Torna in Sala" chiude il duello per tutti
  function giocaDuello(g, D, torna) {
    var S = salaG, code = D.stanza, detti = {}, CS = S ? S.codice : null;
    // (se intanto la Sala è passata a me, p3-c, l'esito e la fase li prende la mia Sala: io sono "host")
    function allaSala(m) {
      if (salaG === S && S.rete) { try { S.rete.invia(m); } catch (e) {} return; }
      if (sala && sala.codice === CS && sala.duello && sala.duello.stanza === code) msgDuello("host", m);
    }
    function esito(cl) {
      var P = partitaCorrente, SV = P && P.viva() && P.salaCtx === ctx ? svPartita(P, true) : null, giro = SV ? (SV.giro || 0) : 0;
      if (!cl || !cl.length || detti[giro]) return;
      detti[giro] = 1;
      allaSala({ t: "salaEsito", stanza: code, giro: giro, cl: cl.map(function (r) { var x = { nome: r.nome, pos: r.pos || 1 }; if (r.punti != null) x.punti = r.punti; if (r.bot) x.bot = true; return x; }) });
    }
    var ctx = {
      duello: code, gioca: true,   // (gioca: sono uno dei due, non guardo)
      esci: function () { SGNet.chiudiGiochi(1500); torna(false); },   // (la stanza si chiude un attimo dopo: prima la Sala porta via tutti)
      risultato: function (g2, cl) { esito(cl); },
      fine: function (g2, cl) {
        esito(cl);
        var P = partitaCorrente && partitaCorrente.viva() && partitaCorrente.salaCtx === ctx ? partitaCorrente : null;
        if (!P || !g2 || !cl || !cl.length) return ctx.esci();
        fineSalaAmico(g2, cl, P, ctx, true, torna);
      },
      suStanza: function (SV) {
        SV.suFase.push(function (f) { allaSala({ t: "duelloFase", stanza: code, fase: f }); });
        if (SV.fase) allaSala({ t: "duelloFase", stanza: code, fase: SV.fase });
      }
    };
    linkParams = {}; SGNet._forza = code;
    // ("👑 Chi vince resta": appena arriva l'avversario parte il 3-2-1 da solo, come la Rivincita)
    if (S && S.resta && S.resta.sfida && S.resta.sfida.stanza === code) { var nmR = {}; nmR[D.b] = D.nb; RIV = { codice: code, attesi: [D.b], nomi: nmR, quando: Date.now() + 10000, auto: true, pronti: {}, daSala: true, U: null }; SL.ultimo = null; }
    avviaPartita(g, [S.nome], Object.assign({}, D.imp || {}, { modo: "online", scelti: [{ id: "host", nome: S.nome }, { id: D.b, nome: D.nb }] }), null, ctx);
  }
  // chi guarda il duello (né a né b): in diretta, senza toccare, con "👥 Sala" in alto per tornare nella Sala.
  // Quando la Sala dice com'è finita: la classifica con "🏠 Torna in Sala"; se i due rigiocano, si torna a guardare da soli
  function guardaDuello(g, D, torna) {
    var S = salaG;
    S.dVista = D.fine ? D.fine.n : 0;   // (le partite finite prima che arrivassi non le mostro)
    S.dFine = null;
    var ctx = {
      duello: D.stanza,
      esci: function () { torna(false); }, fine: function () { torna(false); }, risultato: function () {},
      angolo: function (s) { tastoSala(s, function () { torna(false); }); }
    };
    linkParams = { gioco: g.id, stanza: D.stanza, guarda: 1 };
    avviaPartita(g, [], {}, null, ctx);
    restaTarga();   // ("👀 Guardi · in coda: sei 2°")
  }
  // un messaggio della Sala mentre guardo il duello (anche dalla classifica): la fine, la rivincita
  function seguiDuello(S, D, prima, fase) {
    var mio = mioIdSala(S); if (mio === D.a || mio === D.b) return;
    var P = partitaCorrente, guardo = !!(P && P.viva() && P.salaCtx && P.salaCtx.duello === D.stanza);
    if (D.fine && D.fine.n > (S.dVista || 0)) {
      S.dVista = D.fine.n;
      if (guardo) setTimeout(function () { if (partitaCorrente === P && P.viva() && salaG === S && S.duello && S.duello.stanza === D.stanza) fineDuelloOspite(S, S.duello); }, 1600);
      return;
    }
    // i due rigiocano: dalla classifica si torna a guardare
    if (S.dFine === D.stanza && prima === "fine" && fase !== "fine") { S.dFine = null; salaLanciaOspite(D.gioco, D.stanza); }
  }
  function fineDuelloOspite(S, D) {
    var g = giocoDa(D.gioco); if (!g || !D.fine) return;
    var R = restaFineDi(D.stanza);
    if (R && document.querySelector(".fine-resta")) return;   // ("👑 Chi vince resta": la fine della sfida c'è già)
    lasciaPartita(); SGNet.chiudiGiochi();
    S.dFine = D.stanza;
    var s = schermata({ icona: "🏆", titolo: "Fine partita", sotto: g.nome + " · " + D.na + " contro " + D.nb });
    s._contenuto.appendChild(classificaDuello(D.fine.cl));
    if (R) { bloccoResta(s._piede, D.stanza, false, null); return mostra(s); }
    s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: "Se rigiocano, la guardi da qui. Se no " + (S.nomeHost || "l'host") + " sceglie la prossima sfida." }));
    var box = el("div", { class: "fine-tasti" });
    rigaPuntiFine(box, { codice: D.stanza, giroH: D.fine.giro || 0 }, false, false);   // (la Classifica della serata: "🏆 Serata: Giulia 1° · Luca 2°")
    box.appendChild(el("button", { class: "btn btn-primario ft-primo", type: "button", text: "🏠 Torna in Sala", onclick: function () {
      if (salaG !== S) return schermataHome();
      S.dFine = null; S.inGioco = null; S.uscitoDa = D.stanza; disegnaSalaOspite();
    } }));
    s._piede.appendChild(box);
    mostra(s);
  }

  // =========================================================
  //  TORNEO A ELIMINAZIONE (giochi a due: Tris, Drop 4…)
  //  Un link solo: si sorteggiano le coppie, chi vince va avanti.
  //  Primo turno con un numero dispari: chi resta gioca col Bot (un partecipante vero: se vince va avanti
  //  anche lui, fino alla finale) oppure passa il turno, come sceglie l'host (E.resto: "bot" / "passa").
  //  Nei turni dopo, chi resta senza avversario passa il turno (a sorte, mai due volte lo stesso se si può).
  //  Ogni partita è una stanza a parte tra i due: il primo la apre, l'altro
  //  entra da solo; chi l'ha aperta (o chi gioca col bot) dice chi ha vinto.
  //  L'host della sala può decidere a mano una partita bloccata.
  //  Il TORNEINO (E.torneino) è lo stesso torneo dentro la Sala della serata: stessi id, e alla fine si torna nella Sala.
  // =========================================================
  var GIOCHI_ELIMINAZIONE = { tris: 1, drop4: 1, navale: 1, scopa: 1, calciobiliardo: 1 };
  var MAX_ELIM = 10;   // giocano i primi 10 entrati in sala; gli altri guardano
  function giocoDa(id) { return giochi.filter(function (g) { return g.id === id; })[0] || null; }
  function nomeElim(E, id) { return id === "bot" ? "🤖 " + ((E.bot && E.bot.nome) || "Bot") : ((E.nomi && E.nomi[id]) || "…"); }
  function livelloElim(E) { var l = E && E.livello; return l === "facile" || l === "difficile" ? l : "medio"; }
  // il Bot del torneo per la partita (aiuti.bot del gioco): quello del gruppo fisso, col nome che c'è nel tabellone
  function botDelTorneo(E) {
    var b = (E && E.bot && botDaId(E.bot.id)) || botPrendi(1, { livello: livelloElim(E) })[0] || null;
    if (b && E && E.bot && E.bot.nome) b.nome = E.bot.nome;
    if (b) b.livello = livelloElim(E);   // (la bravura scelta all'inizio, uguale per tutto il torneo)
    return b;
  }
  // è già passato al turno dopo senza giocare
  function favoritoElim(E, id) {
    return E.turni.some(function (tu) { return tu.some(function (p) { return p.a === id && !p.b; }); });
  }
  // un turno dopo il primo: chi resta senza avversario passa il turno (a sorte tra chi non è ancora passato);
  // nella partita col Bot lui è sempre il secondo (la gioca il telefono di chi gli sta davanti)
  function creaTurnoElim(E, ids) {
    var r = E.turni.length, tu = [], solo = null;
    ids = ids.slice();
    if (ids.length % 2) {
      var liberi = ids.filter(function (id) { return !favoritoElim(E, id); }), tra = liberi.length ? liberi : ids;
      solo = tra[Math.floor(Math.random() * tra.length)];
      ids.splice(ids.indexOf(solo), 1);
    }
    for (var i = 0; i + 1 < ids.length; i += 2) {
      var a = ids[i], b = ids[i + 1];
      if (a === "bot") { a = b; b = "bot"; }
      tu.push({ a: a, b: b, stanza: SGNet.nuovoCodice(), vince: null });
    }
    if (solo) tu.push({ a: solo, b: null, vince: solo });
    tu.forEach(function (p, j) { p.k = r + "-" + j; });
    E.turni.push(tu);
  }
  // ---- i gironi: prima di partire ognuno sceglie dove sedersi (all'inizio sono tutti in panchina) ----
  var N_GIRONI = MAX_ELIM / 2;   // 5 gironi da 2 posti
  function chiNelGirone(E, n) { return Object.keys(E.gironi || {}).filter(function (id) { return E.gironi[id] === n; }); }
  function scegliGironeElim(id, n) {   // n = 1..5, 0 = panchina
    var E = sala && sala.elim; if (!E || E.iniziato) return;
    if (!sala.membri.some(function (m) { return m.id === id; })) return;
    n = Math.floor(+n) || 0; if (n < 0 || n > partiteCoppie(E, sala.membri.length)) return;
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
    E.turni = []; E.campione = null; E.iniziato = true; E.finito = false; E.contato = false; delete E.attesi; delete E.scade;
    clearTimeout(sala.tCoppie); sala.tCoppie = null;
    E.k = SGNet.nuovoCodice();   // (questo torneo: i punti alla Sala si danno una volta sola)
    sala.inPartitaK = null; sala.fuoriK = null; sala.guardaK = null;
    // il Bot del torneo: uno del gruppo fisso (della bravura scelta), a sorte, e resta lui per tutto il torneo (nome nel tabellone e in partita).
    // Con "⏭️ passa il turno" niente Bot: chi resta solo passa
    var conBot = E.resto !== "passa";
    var bt = conBot ? botPrendi(1, { livello: livelloElim(E), caso: true, escludi: sala.membri.map(function (m) { return m.nome; }) })[0] : null;
    E.bot = bt ? { id: bt.id, nome: bt.nome } : null;
    // primo turno: un girone = una partita (chi è rimasto solo gioca col Bot o passa); poi chi vince il girone 1 sfida chi vince il 2, ecc.
    var tu = G.map(function (g, j) {
      var p = { k: "0-" + j, girone: g.n, a: g[0], b: g[1] || (conBot ? "bot" : null), vince: null };
      if (p.b) p.stanza = SGNet.nuovoCodice(); else p.vince = p.a;
      return p;
    });
    E.turni.push(tu);
    if (tu.every(function (p) { return p.vince; })) return avanzaElim();   // (in due e uno solo seduto: niente da giocare)
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
    // (un turno in cui passano tutti senza giocare non c'è: si va avanti finché resta una partita vera o il campione)
    while (tu && tu.every(function (p) { return p.vince; })) {
      var dentro = {}; sala.membri.forEach(function (m) { dentro[m.id] = 1; });
      // il Bot va avanti come tutti; chi è uscito dalla Sala no
      var avanti = tu.map(function (p) { return p.vince; }).filter(function (v) { return v === "bot" || dentro[v]; });
      if (avanti.length <= 1) { E.finito = true; E.campione = avanti[0] || null; break; }
      creaTurnoElim(E, avanti);
      tu = E.turni[E.turni.length - 1];
    }
    if (E.finito) puntiTorneino(E);
    sala._bcast(); seguiHost();
  }
  // la classifica del torneo per i punti della Sala: chi è uscito più tardi sta più in alto (il campione primo,
  // chi ha perso la finale secondo, chi ha perso le semifinali terzo a pari merito…). Il Bot ha la sua riga (bot: true)
  function classificaElim(E) {
    var fuoriA = {}, ids = Object.keys(E.nomi || {});
    if (E.bot && E.turni.some(function (tu) { return tu.some(function (p) { return p.b === "bot" || p.a === "bot"; }); })) ids.push("bot");
    E.turni.forEach(function (tu, r) { tu.forEach(function (p) { if (p.vince && p.b) { var perde = p.vince === p.a ? p.b : p.a; if (fuoriA[perde] == null) fuoriA[perde] = r; } }); });
    var giro = function (id) { return id === E.campione ? 999 : (fuoriA[id] != null ? fuoriA[id] : -1); };
    ids.sort(function (x, y) { return giro(y) - giro(x); });
    return ids.map(function (id) {
      var pos = 1 + ids.filter(function (o) { return giro(o) > giro(id); }).length;
      var r = { nome: id === "bot" ? ((E.bot && E.bot.nome) || "Bot") : E.nomi[id], pos: pos };
      if (id === "bot") r.bot = true;
      return r;
    });
  }
  // il torneino è finito: con "🏆 Contiamo i punti" acceso, i punti nella classifica della serata (una volta sola)
  function puntiTorneino(E) {
    if (!E || !E.torneino || E.contato || !sala) return;
    E.contato = true;
    var g = giocoDa(E.gioco); if (!g) return;
    salaRisultato(g, classificaElim(E), { stanza: "torneino-" + (E.k || ""), giro: 0 });
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
    if (S.tProssima) return;   // (sto ancora vedendo com'è finita la mia partita: la prossima si apre tra poco)
    if (p && S.inPartitaK && S.inPartitaK !== p.k && S.fuoriK !== S.inPartitaK) {
      // ho appena vinto e tocca già a me (l'avversario mi aspettava): prima si vede chi ha vinto e la stanza
      // manda a tutti la fine, poi si apre la partita dopo
      clearTimeout(S.tTorna); S.tTorna = null;
      S.tProssima = setTimeout(function () {
        S.tProssima = null; S.inPartitaK = null; S.fuoriK = null;
        if (S.elim) seguiTabellone(S, mioId, mioNome, mostraSala, diEsito);
      }, 2500);
      return;
    }
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
  // il torneo (o il torneino) non c'è più: niente partita del torneo, niente tabellone, niente ritorni in sospeso
  function lasciaTorneo(S) {
    clearTimeout(S.tTorna); S.tTorna = null; clearTimeout(S.tProssima); S.tProssima = null;
    var P = partitaCorrente;
    if (P && P.viva() && P.salaCtx && P.salaCtx.tabellone) {
      lasciaPartita(); SGNet.chiudiGiochi();
      if (window.SGMusica && SGMusica.ferma) SGMusica.ferma();
      pillola("sala", "👥 Si torna nella Sala", "verde", 2500);
    }
    chiudiTabelloneElim();
    S.inPartitaK = null; S.guardaK = null; S.fuoriK = null; S._boxE = null;
  }
  // il torneino finisce (o l'host lo ferma): tutti di nuovo nella Sala della serata, con gli stessi amici
  function fineTorneino() {
    if (!sala || !sala.elim) return;
    lasciaTorneo(sala);
    sala.elim = null; sala.regoleElim = null; sala._regoleBox = null;
    sala.gioco = null; sala.stanza = null; sala.inGioco = false; sala.fase = null; sala.fuori = {}; sala.ctx = null; sala.duello = null; sala.sceglie = false;
    sala._bcast();
    SGNet.chiudiGiochi(1500);   // (le stanze delle partite: prima gli amici tornano nella Sala, poi si chiudono)
    disegnaSalaHost();
  }
  // il torneino nato da una stanza: si parte appena sono arrivati tutti quelli che c'erano (true = partito)
  function torneinoArrivati() {
    var E = sala && sala.elim;
    if (!E || !E.torneino || E.iniziato || !E.attesi) return false;
    var dentro = {}; sala.membri.forEach(function (m) { dentro[m.id] = 1; });
    if (!E.attesi.every(function (id) { return dentro[id]; })) return false;
    partiTorneino(E);
    return !!E.iniziato;
  }
  function seguiHost() { if (sala && sala.elim) seguiTabellone(sala, "host", sala.membri[0].nome, disegnaSalaHost, function (k, v) { esitoPartita(k, v, "host"); }); }
  function seguiOspite() { if (salaG && salaG.elim) seguiTabellone(salaG, salaG.myId, salaG.nome, disegnaSalaOspite, function (k, v) { if (salaG && salaG.rete) salaG.rete.invia({ t: "esito", k: k, vinto: v }); }); }
  // ⚙️ Regole del torneo: le impostazioni del gioco (es. i punti da raggiungere nella Scopa), uguali per tutte le partite.
  // Il riquadro resta sul telefono dell'host; i valori (E.imp) viaggiano con la sala.
  // In cima le regole del torneo (chi resta in più: Bot o passa il turno; la bravura del Bot): si vedono prima di partire
  // e a torneo finito (per il prossimo). Il torneino della Sala porta le regole del gioco già scelte (sala._regoleBox, E.imp)
  function regoleElim() {
    var E = sala && sala.elim, g = E && giocoDa(E.gioco);
    if (!g) return null;
    if (!sala.regoleElim || sala.regoleElim.E !== E) {
      var gbox = sala._regoleBox || null, imp = E.imp || {};
      sala._regoleBox = null;
      if (!gbox && g.impostazioni) {
        if (!E.torneino) imp = {};   // (il torneino riaperto dopo una ricarica tiene le regole che aveva)
        gbox = el("div", { class: "sg-dal-gioco" });   // (🤍 roba del gioco: le sue emoji restano emoji)
        g.impostazioni(gbox, imp, { el: el, sala: true, modo: "online", giocatori: sala.membri.map(function (m) { return m.nome; }) });
      }
      delete imp.scelti; imp.modo = "online"; E.imp = imp;
      var opz = opzioniTorneino(E, function () {
        if (!sala || sala.elim !== E) return;
        if (SL.ultimo) SL.ultimo.regR = null;   // (la riga "📜 Si gioca così" si rilegge)
        if (E.torneino) sala.optTorneino = { resto: E.resto, livello: E.livello, coppie: E.coppie };   // (la prossima volta si parte da qui)
        sala._bcast(); disegnaSalaHost();
      }, true);
      sala.regoleElim = { box: el("div", {}, [opz, gbox]), imp: imp, E: E, opz: opz };
    }
    var R = sala.regoleElim;
    R.opz.hidden = !!(E.iniziato && !E.finito);   // (a torneo in corso non cambiano: valgono dall'inizio alla fine)
    return haRegole(R.box) ? R : null;
  }
  // le scelte del torneo: "Chi resta in più" (🤖 Gioca col Bot / ⏭️ Passa il turno) e la bravura del Bot.
  // T = { resto, livello } (si cambia lì dentro); poi() dopo ogni tocco. Tasti come quelli delle regole dei giochi
  function opzioniTorneino(T, poi, sempre, dispari) {
    var box = el("div", { class: "tn-opz" });
    if (T.resto !== "passa") T.resto = "bot";
    if (T.coppie !== "scelte") T.coppie = "caso";
    T.livello = livelloElim(T);
    function riga(titolo, chiave, voci) {
      var et = el("div", { class: "etichetta", text: titolo });
      var g = el("div", { class: "modo-griglia tn-chips", style: "grid-template-columns:repeat(" + voci.length + ",minmax(0,1fr))" });
      voci.forEach(function (v) {
        var b = el("button", { class: "modo-chip" + (T[chiave] === v[0] ? " attiva" : ""), type: "button", "aria-pressed": T[chiave] === v[0] ? "true" : "false",
          onclick: function () {
            if (T[chiave] === v[0]) return;
            T[chiave] = v[0];
            [].forEach.call(g.children, function (c) { c.classList.toggle("attiva", c === b); c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
            if (!liv._sempreNascosto) liv.hidden = T.resto === "passa";
            if (poi) poi();
          } }, [ el("span", { class: "mi", text: v[1] }), el("div", { class: "mt", text: v[2] }) ]);
        g.appendChild(b);
      });
      return el("div", {}, [et, g]);
    }
    box.appendChild(riga("Le coppie", "coppie", [["caso", "🎲", "A caso"], ["scelte", "✋", "Scegliete voi"]]));
    var resto = riga(sempre ? "Se siete dispari, chi resta in più" : "Chi resta in più", "resto", [["bot", "🤖", "Gioca col Bot"], ["passa", "⏭️", "Passa il turno"]]);
    var liv = riga("Bravura del Bot", "livello", [["facile", "🙂", "Facile"], ["medio", "😐", "Medio"], ["difficile", "😠", "Difficile"]]);
    liv.hidden = T.resto === "passa";
    if (!sempre && !dispari) { resto.hidden = true; liv.hidden = true; liv._sempreNascosto = true; }
    box.appendChild(resto); box.appendChild(liv);
    return box;
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
    // (il link vale per una partita sola: avviaPartita lo prende e lo azzera)
    if (p.b === "bot") {
      // la partita col bot la possono guardare anche gli altri: questo telefono la trasmette nella stanza della partita
      var rete = null, ultimo = null;
      ctx.trasmetti = function (msg) {
        ultimo = msg;
        if (!rete && p.stanza) { SGNet._forza = p.stanza; rete = SGNet.ospita(g.id, { onConnesso: function () { if (rete && ultimo) rete.invia(ultimo); } }); }
        if (rete) rete.invia(msg);
      };
      linkParams = {}; avviaPartita(g, [mioNome], Object.assign({}, S.elim.imp || {}, { modo: "bot", difficolta: livelloElim(S.elim), bot: botDelTorneo(S.elim) }), null, ctx);
    }
    else if (p.a === mioId) { linkParams = {}; SGNet._forza = p.stanza; avviaPartita(g, [mioNome], Object.assign({}, S.elim.imp || {}, { modo: "online" }), null, ctx); }
    else { linkParams = { gioco: g.id, stanza: p.stanza }; avviaPartita(g, [], {}, null, ctx); }
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
    linkParams = { gioco: g.id, stanza: p.stanza, guarda: 1 };
    avviaPartita(g, [], {}, null, ctx);
  }
  // il tabellone sopra la partita (tasto 🏆 in alto): si aggiorna da solo finché resta aperto
  var FT = null;
  function tastoTabellone(s, S) {
    if (!s || s.querySelector(".tab-elim")) return;
    var b = el("button", { class: "tab-elim", "aria-label": "Tabellone del torneo", text: "⚔️", onclick: function () { apriTabelloneElim(S); } });
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
  function giocatoriTurno(tu) { var n = 0; tu.forEach(function (p) { n += p.b ? 2 : 1; }); return n; }
  // il tabellone nella saletta: lo stesso nodo finché non cambia niente (niente lampeggio)
  function boxElimSala(E, mioId, host, S, segui) {
    var k = "";
    try { k = JSON.stringify([E, mioId, host, S.guardaK || null, S.fuoriK || null, (S.membri || []).map(function (m) { return m.id + ":" + m.nome; })]); } catch (e) {}
    if (k && S._boxE && S._boxE.k === k) return S._boxE.nodo;
    var nodo = boxElim(E, mioId, host, S, segui);
    S._boxE = { k: k, nodo: nodo };
    return nodo;
  }
  // il tabellone (nella saletta e nel foglio 🏆 sopra la partita), in uno schermo anche in 10: in cima il mio stato
  // ("▶️ Tocca a te contro Sara", "🏆 Ha vinto Matt! 🤖"), poi il turno di adesso a carte su due colonne (chi gioca con chi,
  // ✅ chi ha vinto, chi passa il turno, "👀 Guarda" sulle partite degli altri), sotto i turni di prima in una riga ciascuno
  function boxElim(E, mioId, host, S, segui) {
    var box = el("div", { class: "sl-torneo sl-tab" });
    var gE = giocoDa(E.gioco), nomeG = gE ? gE.nome : "";
    if (!E.iniziato && E.torneino && !E.scade) {   // il torneino nato da una stanza: si aspetta che arrivino tutti (pochi secondi)
      var qui = ((S && S.membri) || []).length, tot = Math.max(qui, (E.attesi ? E.attesi.length : 0) + 1);
      box.appendChild(el("div", { class: "sl-elim-stato", text: "⚔️ Torneo " + aGioco(nomeG) }));
      box.appendChild(el("p", { class: "modulo-nota tb-nota", text: (E.attesi ? "Arrivano gli amici: " + qui + " su " + tot + "… " : "") + "Si comincia appena ci siete tutti: " + (E.coppie === "scelte" ? "poi ognuno sceglie dove sedersi." : "coppie a sorte, tutte le partite insieme.") }));
      return box;
    }
    if (!E.iniziato && E.torneino) return boxCoppie(E, mioId, host, S, box);
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
      box.appendChild(el("p", { class: "modulo-nota", text: "Tocca un girone per sederti: chi vince il girone 1 sfida chi vince il 2, e così via fino alla finale. Chi resta in panchina viene messo a caso nei posti liberi; se uno resta solo, " +
        (E.resto === "passa" ? "passa il turno." : "gioca contro il Bot (" + livelloElim(E) + ").") }));
      if (membri.length > MAX_ELIM) box.appendChild(el("p", { class: "modulo-nota", text: "Siete in " + membri.length + ": i posti sono " + MAX_ELIM + ", chi resta in panchina guarda le partite 👀" }));
      return box;
    }
    var mia = miaPartitaElim(E, mioId), stato, ult = E.turni.length - 1;
    if (E.finito) stato = !E.campione ? "Torneo finito" : (E.campione === mioId ? "🏆 Hai vinto tu! Sei il campione"
      : (E.campione === "bot" ? "🏆 Ha vinto " + ((E.bot && E.bot.nome) || "il Bot") + "! 🤖" : "🏆 Ha vinto " + nomeElim(E, E.campione) + "!"));
    else if (mia) stato = "▶️ Tocca a te contro " + nomeElim(E, mia.a === mioId ? mia.b : mia.a);
    else if (!(E.nomi && E.nomi[mioId])) stato = "👀 Guardi il torneo: tocca «Guarda» su una partita";
    else if (eliminatoElim(E, mioId)) stato = "Sei fuori: puoi guardare le partite 👀";
    else stato = "✅ Passi al turno dopo: intanto guarda gli altri ⏳";
    box.appendChild(el("div", { class: "sl-elim-stato" + (E.finito && E.campione ? " campione" : ""), text: stato }));
    if (mia && S.fuoriK === mia.k) box.appendChild(el("button", { class: "btn btn-primario tb-rientra", text: "🔁 Rientra nella tua partita", onclick: function () { S.inPartitaK = null; S.fuoriK = null; segui(); } }));
    if (ult >= 0) {
      var tu = E.turni[ult];
      box.appendChild(el("div", { class: "etichetta tb-et", text: nomeTurnoElim(giocatoriTurno(tu)) + (E.finito ? "" : " · si gioca ora") }));
      var gr = el("div", { class: "tb-griglia" + (tu.length === 1 ? " una" : "") });
      tu.forEach(function (p) { gr.appendChild(cartaElim(E, p, mioId, host, S, mia)); });
      box.appendChild(gr);
    }
    // i turni di prima: chi è andato avanti
    for (var r = ult - 1; r >= 0; r--) {
      var vinti = E.turni[r].map(function (p) { return nomeElim(E, p.vince); });
      box.appendChild(el("div", { class: "tb-prima" }, [ el("b", { text: nomeTurnoElim(giocatoriTurno(E.turni[r])) }), el("span", { text: "✅ " + vinti.join(" · ") }) ]));
    }
    // a torneino finito l'host lo può rifare subito (stessi amici, coppie nuove); il tasto in fondo riporta tutti nella Sala
    if (host && E.finito && E.torneino) box.appendChild(el("button", { class: "btn btn-fantasma tb-rifai", type: "button", text: "↻ Rifacciamo il torneo",
      onclick: function () { if (sala && sala.elim === E) { if (E.coppie === "scelte") partiTorneino(E); else avviaElim(); } } }));
    return box;
  }
  // "✋ Scegliete voi": le partite del primo turno coi posti vuoti ("Partita 1: [posto libero] contro [posto libero]");
  // un tocco su un posto libero e ti siedi lì (si vede in diretta chi si siede dove), un tocco sul tuo posto e ti alzi.
  // L'host vede "Seduti 5 su 6" e parte quando vuole (tasto della saletta); il conto alla rovescia fa partire da soli
  function boxCoppie(E, mioId, host, S, box) {
    var membri = ((S && S.membri) || []).slice(0, Math.max(MAX_ELIM, 0)), gir = E.gironi || {};
    var nP = partiteCoppie(E, ((S && S.membri) || []).length);
    function chiamo(m) { return m.id === mioId ? "Tu" : m.nome; }
    function siedi(n) { if (host) scegliGironeElim(mioId, n); else if (S && S.rete) S.rete.invia({ t: "girone", g: n }); }
    var seduti = membri.filter(function (m) { return gir[m.id] >= 1 && gir[m.id] <= nP; }).length, tot = ((S && S.membri) || []).length;
    box.appendChild(el("div", { class: "sl-elim-stato", text: gir[mioId] ? "✅ Sei seduto nella Partita " + gir[mioId] : "✋ Scegli dove sederti" }));
    box.appendChild(el("div", { class: "tb-coppie-riga" }, [
      el("b", { class: "tb-seduti", text: "Seduti " + seduti + " su " + tot }),
      E.scade ? el("span", { class: "tb-conto", "data-scade": String(E.scade), text: "⏱️ Si parte da soli tra " + Math.max(0, Math.ceil((E.scade - Date.now()) / 1000)) + " s" }) : null ]));
    var gr = el("div", { class: "tb-griglia una tb-coppie" });
    for (var n = 1; n <= nP; n++) (function (n) {
      var chi = membri.filter(function (m) { return gir[m.id] === n; }), mio = gir[mioId] === n;
      var c = el("div", { class: "tb-p tb-posti" + (mio ? " mia" : "") }, [ el("span", { class: "tb-stato tb-pn", text: "Partita " + n }) ]);
      [0, 1].forEach(function (i) {
        var m = chi[i], mioPosto = m && m.id === mioId;
        if (i === 1) c.appendChild(el("span", { class: "tb-contro", text: "contro" }));
        c.appendChild(el("button", { class: "tb-posto" + (m ? " preso" : "") + (mioPosto ? " mio" : ""), type: "button", disabled: m && !mioPosto ? "disabled" : null,
          text: m ? chiamo(m) : "＋ libero", "aria-label": m ? null : "Posto libero nella Partita " + n, onclick: function () { siedi(mioPosto ? 0 : n); } }));
      });
      gr.appendChild(c);
    })(n);
    box.appendChild(gr);
    var piedi = membri.filter(function (m) { return !(gir[m.id] >= 1 && gir[m.id] <= nP); });
    if (piedi.length) box.appendChild(el("p", { class: "modulo-nota tb-nota", text: "In piedi: " + piedi.map(chiamo).join(", ") + (host ? ". Se parti ora vanno a caso nei posti liberi." : ".") }));
    if (tot % 2 && tot <= MAX_ELIM) box.appendChild(el("p", { class: "modulo-nota tb-nota", text: E.resto === "passa" ? "Chi resta da solo passa il turno." : "Chi resta da solo gioca col Bot." }));
    if (E.scade) contoCoppie();
    return box;
  }
  // una partita del turno: i due nomi (✅ chi ha vinto, barrato chi ha perso) e sotto com'è messa:
  // "👀 Guarda" per chi non gioca, "⏳ in corso", "⏭️ passa il turno". L'host ha "⋯" per decidere una partita bloccata
  function cartaElim(E, p, mioId, host, S, mia) {
    var mio = p.a === mioId || p.b === mioId;
    var c = el("div", { class: "tb-p" + (mio ? " mia" : "") + (p.vince ? " decisa" : ""), "data-k": p.k });
    function nome(id) { return el("span", { class: "tb-n" + (p.vince === id ? " vince" : (p.vince ? " perde" : "")), text: nomeElim(E, id) }); }
    if (!p.b) { c.appendChild(el("span", { class: "tb-n", text: nomeElim(E, p.a) })); c.appendChild(el("span", { class: "tb-stato", text: "⏭️ passa il turno" })); return c; }
    c.appendChild(nome(p.a)); c.appendChild(nome(p.b));
    if (!p.vince) {
      if (S && S.guardaK === p.k) c.appendChild(el("span", { class: "tb-stato", text: "👀 la stai guardando" }));
      else if (!mia && !E.finito && p.stanza && !mio) c.appendChild(el("button", { class: "tb-guarda", type: "button", "aria-label": "Guarda " + nomeElim(E, p.a) + "–" + nomeElim(E, p.b), text: "👀 Guarda",
        onclick: function () { guardaPartitaElim(S, p); } }));
      else c.appendChild(el("span", { class: "tb-stato", text: mio ? "▶️ tocca a te" : "⏳ in corso" }));
      if (host && !E.finito) c.appendChild(el("button", { class: "tb-decidi", type: "button", "aria-label": "Partita bloccata? Decidi chi passa", text: "⋯", onclick: function () { decidiElim(E, p); } }));
    }
    return c;
  }
  // l'host decide una partita bloccata: chi passa al turno dopo
  function decidiElim(E, p) {
    if (document.querySelector(".tb-velo")) return;
    var velo;
    function chiudi() { if (velo.parentNode) velo.parentNode.removeChild(velo); }
    function passa(vA) { chiudi(); if (sala && sala.elim === E && !p.vince) esitoPartita(p.k, vA, "host"); }
    velo = el("div", { class: "sl-velo tb-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: "⚖️ Partita bloccata?" }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        el("div", { class: "sl-foglio-corpo" }, [
          el("p", { class: "modulo-nota", text: nomeElim(E, p.a) + " contro " + nomeElim(E, p.b) + ": se la partita non va avanti, scegli tu chi passa al turno dopo." }),
          el("div", { class: "tb-decidi-tasti" }, [
            el("button", { class: "btn btn-primario", type: "button", text: "✅ Passa " + nomeElim(E, p.a), onclick: function () { passa(true); } }),
            el("button", { class: "btn btn-primario", type: "button", text: "✅ Passa " + nomeElim(E, p.b), onclick: function () { passa(false); } }) ]) ]),
        el("button", { class: "btn btn-fantasma", type: "button", text: "Lasciali giocare", onclick: chiudi })
      ])
    ]);
    document.body.appendChild(velo);
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
  var MODO_ELIMINAZIONE = { modo: "eliminazione", icona: "⚔️", nome: "Torneo a eliminazione", sotto: "Fino a 10 amici: sfide a due, chi vince va avanti" };
  var MODO_ONLINE = { modo: "online", icona: "🔗", nome: "Online: apro io la stanza", sotto: "Ognuno dal suo telefono: inviti gli amici col tasto 📤" };
  var MODO_CODICE = { modo: "codice", icona: "🔑", nome: "Online: ho un codice", sotto: "Ti hanno invitato? Entra nella loro stanza" };
  function modiDi(g) {
    var io = profiloAttivo(), mioNome = String((io && io.nome) || "").trim().toUpperCase();
    // soloPer: un modo che vede solo un account (es. "Prova da solo" per il proprietario, IL PAPPONE)
    var m = (g && g.modi) ? g.modi.filter(function (x) { return !x.soloPer || x.soloPer === mioNome; }) : [];
    var conSala = salaSempre() && !(g && g.senzaSala);   // (senzaSala in SG.registra: il gioco apre una stanza sua, col suo link, mai la Sala)
    if (giocoOnline(g)) m.push(conSala ? modoOnlineSala() : MODO_ONLINE);
    var mc = giocoOnline(g) && conSala ? modoCompagnia() : null;   // subito dopo "Online": la Compagnia usata più di recente
    if (mc) m.push(mc);
    if (g && GIOCHI_ELIMINAZIONE[g.id]) m.push(MODO_ELIMINAZIONE);
    return m;
  }
  // "🍻 Online con «Quelli del giovedì»" (Passo 3): la Compagnia usata più di recente, con chi c'è dentro (dalla sbirciata della
  // home, che ha meno di 30 s: niente collegamenti in più). comp = il suo codice
  function modoCompagnia() {
    var v = null; try { v = window.SGCompagnia ? SGCompagnia.elenco()[0] : null; } catch (e) {}
    if (!v || !codiceComp(v.c)) return null;
    return { modo: "compagnia", icona: v.e || "📌", nome: "Online con «" + v.n + "»", sotto: sottoCompagnia(v.c), comp: v.c };
  }
  function sottoCompagnia(C) {
    var mia = infoSalaMia(C);
    if (mia && mia.host) return "Si gioca nella tua Sala";
    if (mia) return "Sei dentro" + (salaG && salaG.nomeHost ? ": la Sala la tiene " + salaG.nomeHost : "");
    var r = null; try { r = SGCompagnia.stato(C); } catch (e) {}
    if (r && r.stato === "viva") {
      var nomi = ((r.msg && r.msg.membri) || []).filter(function (x) { return x && x.nome && !x.fuori; }).map(function (x) { return x.nome; });
      if (!nomi.length) return "🟢 La serata è aperta";
      return "🟢 " + (nomi.length === 1 ? nomi[0] + " è dentro" : (nomi.length === 2 ? nomi[0] + " e " + nomi[1] : nomi[0] + ", " + nomi[1] + " e altri " + (nomi.length - 2)) + " sono dentro");
    }
    return r && r.stato !== "boh" ? "La apri tu: entrano dalla home" : "Entri nella Sala della compagnia";
  }
  // con la Sala sempre accesa: "Online" apre la Sala della serata (o gioca in quella già aperta). Una copia: la costante resta com'è
  function modoOnlineSala() {
    var mia = sala && !sala.elim && sala.codice && sala.codice !== "…";
    return Object.assign({}, MODO_ONLINE, { nome: "Online con gli amici",
      sotto: mia ? "Si gioca nella tua Sala (" + sala.codice + ")" : "Si apre la Sala: un codice per tutta la serata" });
  }
  // dove mettere "Online: ho un codice": subito sotto "Online" e la Compagnia (cercati per modo: "Online" può essere una copia)
  function conCodice(modi) {
    var i = -1; modi.forEach(function (m, k) { if (m.modo === "online" || m.modo === "compagnia") i = k; });
    if (i >= 0) modi.splice(i + 1, 0, MODO_CODICE);
    return modi;
  }
  function modoDi(g, modo) { return modiDi(g).filter(function (m) { return m.modo === modo; })[0] || null; }
  function schermataModo(g) {
    var s = schermata({ icona: g.icona, titolo: g.nome, sotto: "Come giocate?", indietro: tornaHome });
    var io = profiloAttivo(), griglia = el("div", { class: "modo-scelta" });
    var modi = modiDi(g), ultimo = ultimoModo(g);
    if (giocoOnline(g)) conCodice(modi);   // subito sotto "Online": chi è invitato entra col codice
    if (modi.length >= 5) griglia.classList.add("tanti");   // (5 modi o più, con la Compagnia: righe più basse, tutto in uno schermo a 360x640)
    modi.forEach(function (m) {
      var tit = el("div", { class: "mg-tit", text: m.nome });
      if (m.modo === ultimo && modi.length > 1) tit.appendChild(el("span", { class: "mg-ultimo", text: "l'ultima volta" }));   // si ritrova subito come avete giocato
      var sotto = el("div", { class: "mg-sotto", text: m.sotto || "" });
      griglia.appendChild(el("button", { class: "modo-grande" + (m.modo === "online" ? " online" : (m.modo === "compagnia" ? " online compagnia" : "")), onclick: function () { if (m.modo !== "codice") ricordaModo(g, m.modo); sceltoModo(g, m); } }, [
        el("div", { class: "mg-ico", text: m.icona }),
        el("div", { class: "mg-testo" }, [ tit, sotto ]),
        el("div", { class: "mg-freccia", text: "›" })
      ]));
      // la Compagnia: chi c'è dentro si guarda adesso se la sbirciata della home è vecchia (al suo posto, solo la scritta)
      if (m.modo === "compagnia" && SGCompagnia.sbircia && !infoSalaMia(m.comp)) SGCompagnia.sbircia([m.comp], function () {
        if (document.body.contains(sotto)) { var t = sottoCompagnia(m.comp); if (sotto.textContent !== t) sotto.textContent = t; m.sotto = t; }
      });
    });
    s._contenuto.appendChild(griglia);
    if (io && io.omino && window.SGOmino) s._contenuto.appendChild(el("div", { class: "modo-avatar", html: SGOmino.svg(io.omino) }));
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "Come si gioca", onclick: function () { schermataRegole(g, function () { schermataModo(g); }); } }));
    mostra(s);
  }
  // l'ultimo modo scelto per ogni gioco (su questo telefono): nella prima schermata ha la scritta "l'ultima volta"
  function ultimoModo(g) { var o = leggiL("sg-ultimo-modo", {}); return (o && typeof o === "object" && o[g.id]) || null; }
  function ricordaModo(g, modo) { var o = leggiL("sg-ultimo-modo", {}); if (!o || typeof o !== "object") o = {}; o[g.id] = modo; scriviL("sg-ultimo-modo", o); }
  function sceltoModo(g, m) {
    if (m.modo === "codice") return entraConCodice(function () { schermataModo(g); });   // invitato: si entra nella stanza di un altro
    if (m.modo === "eliminazione") return creaSala({ eliminazione: g.id });   // un link solo, coppie sorteggiate, chi vince va avanti
    if (m.modo === "online" && salaSempre() && !g.senzaSala) return apriOnlineSala(g);   // online = la Sala della serata
    if (m.modo === "compagnia") return giocaInCompagnia(g, m.comp);   // online nella Sala della Compagnia
    if (m.amici) return schermataSala(g, { modo: m.modo });   // sullo stesso telefono: prima gli amici, poi le impostazioni
    schermataPreGioco(g, { modo: m.modo });                  // contro il computer / online: subito le impostazioni
  }
  // "Online con gli amici": nella mia Sala se è aperta, se no se ne apre una (e il gioco parte appena ha il codice)
  function apriOnlineSala(g) {
    if (sala && sala.elim && sala.elim.torneino) return chiediConferma(sala.elim.finito ? "Si torna nella Sala?" : "Fermare il torneo?", "Gli amici passano a " + g.nome + ".", sala.elim.finito ? "Vai" : "Ferma",
      function () { if (!sala) return; fineTorneino(); salaPreparaGioco(g); });
    if (sala && sala.elim) return chiediConferma("Chiudere il torneo?", "C'è il torneo a eliminazione aperto: si chiude per tutti e si apre la Sala.", "Chiudi il torneo",
      function () { chiudiSala(); creaSala({ gioco: g.id }); });
    if (sala) {
      var gIn = (sala.inGioco || sala.duello) && giocoDa(sala.gioco);
      if (gIn) return chiediConferma("Chiudere la partita di " + gIn.nome + "?", "Gli amici passano a " + g.nome + ".", "Cambia", function () { if (sala) salaPreparaGioco(g); });
      return salaPreparaGioco(g);
    }
    if (salaG) return chiediConferma("Sei nella Sala di " + (salaG.nomeHost || "un amico"), "Esci e apri la tua?", "Apri la mia",
      function () { chiudiSalaOspite(); creaSala({ gioco: g.id }); });
    creaSala({ gioco: g.id });
  }

  // =========================================================
  //  SALETTA D'ATTESA ONLINE — uguale per tutti i giochi (t.lobby).
  //  Chi è entrato aspetta coi personaggi in una saletta: respirano, sbattono le palpebre,
  //  ogni tanto salutano o saltano; chi arriva entra con un saltello, "pling" e il fumetto "Ciao Luca! 👋".
  //  È viva (vedi SALETTA VIVA più sotto): "✋ Sono pronto!", le faccine, chi si ricollega in grigio con 📶,
  //  "Fai uscire" e "🔒 Chiudi la porta" per l'host, il 3-2-1-Via! su tutti i telefoni, la musichetta.
  //  Chi ospita vede in alto codice e "📤 Invita gli amici" (manda il link), in fondo "Comincia".
  //  Sta tutta in uno schermo (anche 360x640): la stanza prende lo spazio che resta.
  //  o: { host, codice, pronta (false = sto aprendo), giocatori: [{ id, nome, omino, bot, host, tu }],
  //       min, vuoti (posti liberi da mostrare), onComincia, onEsci, attesa (testo per chi aspetta),
  //       extra: [nodi del gioco, es. scelta dei posti], nota, testoComincia, confermaEsci (la domanda all'host che esce),
  //       spettatore (chi entra ma guarda soltanto, es. partita piena: true = "👀 Guardi questa partita", oppure il testo da scrivere),
  //       _rete (il collegamento della stanza: lo mette il core) }
  //  Si aggiorna al suo posto (niente lampeggio): i personaggi già dentro restano, i nuovi entrano.
  // =========================================================
  var SL = { ultimo: null, timer: null };
  function chiavePers(p, i) { return String(p.id != null ? p.id : (p.nome || i)); }
  function condividiLink(link, g, bottone) {
    var fatto = function () { if (!bottone) return; var t0 = bottone.innerHTML; bottone.innerHTML = "✅ Link copiato!"; setTimeout(function () { bottone.innerHTML = t0; }, 1800); };
    var invito = g.id === "__sala" ? (g.nome === "Torneo" ? "Vieni al torneo!" : "Vieni a giocare con noi!") : "Giochiamo a " + g.nome + "!";
    // il codice nel messaggio: chi ha già l'app la apre e lo scrive in "🔑 Ho un codice" (il link a volte si apre nel browser, non nell'app)
    var m = /(?:stanza|sala|gruppo)=([A-Za-z0-9]+)/.exec(link || ""), codice = m ? m[1].toUpperCase() : "";
    var diSala = /[#&?]sala=/.test(link || "") && g.nome !== "Torneo" && salaSempre();
    // la Compagnia: il link fisso, da fissare nel gruppo (vale sempre)
    if (codice && /[#&?]gruppo=/.test(link || "") && window.SGCompagnia) invito += " " + SGCompagnia.messaggio(codice) + "\nSe no, entra da qui:";
    // la Sala della serata: un codice solo, che vale per tutti i giochi
    else if (codice && diSala) invito += " Stasera siamo nella Sala " + codice + ".\nHai l'app? Tocca «🔑 Ho un codice» e scrivi: " + codice + "\nSe no, entra da qui:";
    else if (codice) invito += "\nHai l'app? Aprila, tocca «🔑 Ho un codice» e scrivi: " + codice + "\nSe no, entra da qui:";
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
  // ---- le regole in una riga, per gli amici in saletta: "5 carte · Storia, Cinema" (massimo 90 caratteri) ----
  //  il gioco può scriverla lui (g.riassunto(imp), facoltativo); se no si legge dal box le scelte accese:
  //  .modo-chip.attiva (il .mt), .cat-chip.attiva (i nomi), i contatori (.stepper .valore), select (l'opzione scelta),
  //  checkbox [data-regola] spuntati. Si saltano i pezzi nascosti. Un numero da solo prende il nome dall'etichetta ("5 carte")
  function riassuntoRegole(box, g, imp) {
    var tx = "";
    if (g && typeof g.riassunto === "function") { try { tx = String(g.riassunto(imp || {}) || ""); } catch (e) { tx = ""; } }
    if (!tx && box) {
      var pezzi = [], gruppi = [];
      var pulito = function (s) { return String(s || "").replace(/\s+/g, " ").trim(); };
      var nascosto = function (n) { for (; n && n !== box; n = n.parentNode) if (n.hidden) return true; return false; };
      // l'etichetta del gruppo: la prima .etichetta prima di lui (salendo fino al box)
      var etichettaDi = function (n) {
        for (; n && n !== box; n = n.parentNode)
          for (var p = n.previousElementSibling; p; p = p.previousElementSibling)
            if (p.classList && p.classList.contains("etichetta")) return pulito(p.textContent);
        return "";
      };
      // "5" + "Carte da piazzare a testa" → "5 carte"; "3" + "Il livello" → "Livello: 3"
      //  (una sola cosa: "Giri: 1"); "Sì" e "No" prendono l'etichetta ("Parola d'oro", "Tempo per l'indizio: no"); "Medio" dei bot → "Bot medio"
      var conNome = function (v, n) {
        var et = etichettaDi(n).replace(/^[^A-Za-zÀ-ÿ]+/, "").replace(/[\s?:]+$/, "");
        if (et && /^s[iì]$/i.test(v)) return et;
        if (et && /^(no|senza)$/i.test(v)) return et + ": no";
        if (/\bbot\b/i.test(et) && /^(facil|medi|difficil)/i.test(v)) return "Bot " + v.toLowerCase();
        if (!/^\d+$/.test(v)) return v;
        var w = et.replace(/^(quant[aeio]|il|lo|la|l'|i|gli|le)\s+/i, "").split(/[\s,:(]+/)[0] || "";
        if (!w) return v;
        return /[ie]$/i.test(w) && v !== "1" ? v + " " + w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() + ": " + v;
      };
      var testoChip = function (c) {
        var mt = c.querySelector(".mt"); if (mt) return pulito(mt.textContent);
        var cp = c.cloneNode(true);
        [].forEach.call(cp.querySelectorAll(".ms, .mi, .ci, .spunta"), function (x) { x.parentNode.removeChild(x); });
        return pulito(cp.textContent);
      };
      [].forEach.call(box.querySelectorAll(".modo-chip.attiva, .cat-chip, .stepper .valore, select, input[type=checkbox][data-regola]"), function (n) {
        if (nascosto(n)) return;
        if (n.classList.contains("cat-chip")) {
          var gr = n.parentNode; if (gruppi.indexOf(gr) >= 0) return;
          gruppi.push(gr);
          var tutte = [].filter.call(gr.children, function (c) { return c.classList && c.classList.contains("cat-chip") && !c.hidden; });
          var accese = tutte.filter(function (c) { return c.classList.contains("attiva"); }).map(testoChip).filter(Boolean);
          if (!accese.length) return;
          if (accese.length === tutte.length && tutte.length > 3) {
            // "Categorie in gioco" → "Tutte le categorie" ("Temi" → "Tutti i temi")
            var w0 = (etichettaDi(gr).replace(/^[^A-Za-zÀ-ÿ]+/, "").split(/[\s,:(]+/)[0] || "").toLowerCase();
            pezzi.push(/e$/.test(w0) ? "Tutte le " + w0 : (/i$/.test(w0) ? "Tutti " + (/^([aeiouàèéìòù]|s[^aeiou]|z|gn|ps)/.test(w0) ? "gli " : "i ") + w0 : "Tutte"));
          }
          else pezzi.push(accese.length > 3 ? accese.slice(0, 3).join(", ") + " +" + (accese.length - 3) : accese.join(", "));
        } else if (n.classList.contains("modo-chip")) pezzi.push(conNome(testoChip(n), n));
        else if (n.classList.contains("valore")) pezzi.push(conNome(pulito(n.textContent), n.parentNode));
        else if (n.tagName === "SELECT") { var o = n.options[n.selectedIndex]; if (o) pezzi.push(conNome(pulito(o.textContent), n)); }
        else if (n.checked) pezzi.push(pulito(n.getAttribute("data-regola")));
      });
      tx = pezzi.filter(Boolean).join(" · ");
    }
    tx = String(tx).replace(/\s+/g, " ").trim();
    return tx.length > 90 ? tx.slice(0, 89).replace(/[\s·,]+$/, "") + "…" : tx;
  }
  function firmaImp(imp) { try { return JSON.stringify(imp); } catch (e) { return ""; } }
  // "📖 Come si gioca" dentro un foglio: un tocco apre (e richiude) le regole del gioco, sola lettura
  function comeSiGioca(g) {
    var righe = el("div", { class: "sl-come", hidden: "hidden" });
    (g.regole || ["(regole non ancora scritte)"]).forEach(function (r) { righe.appendChild(el("p", { html: r })); });
    var b = el("button", { class: "btn btn-fantasma sl-come-b", type: "button", text: "📖 Come si gioca", "aria-expanded": "false", onclick: function () {
      righe.hidden = !righe.hidden;
      b.setAttribute("aria-expanded", righe.hidden ? "false" : "true");
      if (!righe.hidden && righe.scrollIntoView) try { righe.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {}
    } });
    return el("div", { class: "sl-come-box" }, [ b, righe ]);
  }
  // HOST: il riassunto delle regole (all'apertura della saletta e quando il foglio ⚙️ si chiude con regole cambiate).
  // Va nel __sl (r, rv: rv cresce a ogni modifica), così chi entra dopo lo legge già. ricalcola = rileggi il box
  function regoleHost(U, ricalcola) {
    if (!U || !U.host) return;
    if (ricalcola || U.regR == null) U.regR = U.R && haRegole(U.R.box) ? riassuntoRegole(U.R.box, giocoDa(U.gid), U.R.imp) : "";
    var SV = U.rete && U.rete._sv;
    if (SV && SV.host && U.regR && SV.regR !== U.regR) { SV.regR = U.regR; SV.rvR = (SV.rvR || 0) + 1; svRiassunto(SV); }
    rigaRegole(U, false);
  }
  // la riga "📜 Si gioca così: …" (host: nel piede, al posto della nota; chi entra: sopra "Sei dentro").
  // cambiate = l'host le ha appena cambiate: saltello e "✨ Regole cambiate" per 2,5 s (solo transform/opacità)
  function rigaRegole(U, cambiate) {
    if (!U || !U.rRiga) return;
    var SV = U.rete && U.rete._sv, tx = U.host ? (U.regR || "") : ((SV && !SV.host && SV.regR) || "");
    if (U.rTesto.textContent !== tx) U.rTesto.textContent = tx;
    if (U.rRiga.hidden !== !tx) U.rRiga.hidden = !tx;
    if (!U.host) U.s.classList.toggle("con-regole", !!tx);   // (schermi bassi: la saletta si stringe un po', vedi styles.css)
    if (U.rFoglioP && U.rFoglioP.textContent !== tx && tx) U.rFoglioP.textContent = tx;   // (il foglio aperto si aggiorna anche lui)
    if (cambiate && tx) {
      rianima(U.rRiga, "salta");
      U.rRiga.classList.add("cambiate");
      clearTimeout(U.tRc);
      U.tRc = setTimeout(function () { U.rRiga.classList.remove("cambiate"); }, 2500);
    }
  }
  function rigaRegoleNodi(U, tocco) {
    U.rTesto = el("span", { class: "sl-rr-testo" });
    U.rRiga = el("button", { class: "sl-regole-riga", type: "button", hidden: "hidden", onclick: tocco }, [
      el("span", { class: "sl-rr-et", text: "📜 Si gioca così:" }), U.rTesto,
      el("span", { class: "sl-rr-cambiate", "aria-hidden": "true", text: "✨ Regole cambiate" }) ]);
  }
  // chi entra tocca la riga: un foglio piccolo col riassunto intero e "📖 Come si gioca"
  function foglioRegoleOspite(U) {
    if (document.querySelector(".sl-velo")) return;
    var g = giocoDa(U.gid), velo, tic;
    function chiudi() { clearInterval(tic); if (velo.parentNode) velo.parentNode.removeChild(velo); }
    velo = el("div", { class: "sl-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: "📜 Si gioca così" }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        el("div", { class: "sl-foglio-corpo" }, [
          U.rFoglioP = el("p", { class: "sl-reg-tutto", text: U.rTesto.textContent }),
          el("p", { class: "modulo-nota", text: "Le regole le sceglie l'host: se le cambia, qui si aggiornano da sole." }),
          g ? comeSiGioca(g) : null ]),
        el("button", { class: "btn btn-primario", text: "👍 Ho capito", onclick: chiudi })
      ])
    ]);
    document.body.appendChild(velo);
    // la partita parte (o la saletta se ne va): il foglio si chiude da solo, non resta sopra il gioco
    tic = setInterval(function () { if (!document.body.contains(U.s)) chiudi(); }, 400);
  }
  // il foglio "Regole" della saletta: dentro ci sono le stesse impostazioni di prima (restano come le avevi lasciate)
  // e, nelle salette dei giochi, la scelta della saletta: "Parti da solo quando tutti sono pronti"
  function foglioRegole(U) {
    var R = U.R; if (document.querySelector(".sl-velo")) return;
    var conGioco = !!(R && haRegole(R.box)), conSaletta = U.gid !== "__sala";
    if (!conGioco && !conSaletta) { if (U.host && sala && !sala.elim) foglioSala(U); return; }   // (la Sala: "🏆 Contiamo i punti")
    var prima = conGioco ? firmaImp(R.imp) : "", velo;
    function chiudi() {
      if (conGioco && R.box.parentNode) R.box.parentNode.removeChild(R.box);
      if (velo.parentNode) velo.parentNode.removeChild(velo);
      applicaViva(U);   // (tutti pronti e "parti da solo" appena acceso: si parte)
      if (!conGioco || firmaImp(R.imp) === prima) return;
      var fn = (U.o && U.o.onRegole) || (R.tavolo && R.tavolo.onRegole);
      if (fn) fn(R.imp);
      regoleHost(U, true);   // la riga "📜 Si gioca così" nuova, e agli amici (con "✨ Regole cambiate")
      if (U.bRegole) { var t0 = U.bRegole.textContent; U.bRegole.textContent = "✅ Fatto"; setTimeout(function () { if (U.bRegole) U.bRegole.textContent = t0; }, 1600); }
    }
    var corpo = el("div", { class: "sl-foglio-corpo" });
    if (conSaletta) corpo.appendChild(opzioniSaletta());
    if (conGioco) corpo.appendChild(R.box);
    // in fondo "📖 Come si gioca" (nella Sala la schermata delle regole non c'è più): si apre qui dentro
    var gC = giocoDa(U.gid); if (gC && conGioco) corpo.appendChild(comeSiGioca(gC));
    // la Sala nel torneo a eliminazione: in fondo la Compagnia (spenta: "Si fa tra una partita e l'altra")
    if (U.gid === "__sala" && U.host && sala && sala.elim) { var rc = rigaCompSala(function () { chiudi(); }); if (rc) corpo.appendChild(rc); }
    velo = el("div", { class: "sl-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: conGioco ? (U.gid === "__sala" && sala && sala.elim ? "⚙️ Regole del torneo" : "⚙️ Regole della partita") : "⚙️ La saletta" }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        corpo,
        el("button", { class: "btn btn-primario", text: "✅ Fatto", onclick: chiudi })
      ])
    ]);
    document.body.appendChild(velo);
  }
  // il sottotitolo della saletta: nei giochi della Sala "Sala · la stanza è tua" (host) o "Sala di Paky" (chi entra)
  function sottoSaletta(o) {
    if (o.sotto) return o.sotto;
    if (o.sala) return o.host ? "Sala · la stanza è tua" : "Sala di " + (o.sala.host || "un amico");
    return o.host ? "Online · la stanza è tua" : "Online · stanza " + String(o.codice || "").toUpperCase();
  }
  function saletta(g, o, R) {
    o = o || {};
    var U = SL.ultimo;
    // (la Sala che diventa torneino cambia titolo: saletta nuova. La Compagnia rinominata no: cambia solo la scritta in alto)
    if (U && U.gid === g.id && (U.chiaveG || U.nomeG) === (g.chiave || g.nome) && U.host === !!o.host && document.body.contains(U.s)) {
      U.gObj = g;
      if (U.nomeG !== g.nome) { U.nomeG = g.nome; var h1 = U.s.querySelector(".testa h1"); if (h1 && h1.textContent !== g.nome) h1.textContent = g.nome; }
      if (R) U.R = R; aggiornaSaletta(U, o, false); return U.s;
    }
    if (U && U.ro) try { U.ro.disconnect(); } catch (e) {}   // (la saletta di prima non serve più)
    var s = schermata({ titolo: g.nome, sotto: sottoSaletta(o),
      indietro: function () {
        // (l'host prima conferma, con la finestra al centro dell'app: la stanza si chiude per tutti)
        function esci() { SL.ultimo = null; var oo = U2 && U2.o && U2.o.onEsci ? U2.o : o; if (oo.onEsci) oo.onEsci(); }
        if (!o.host) return esci();
        // (la Sala con un amico che può tenerla: "👑 Passa la Sala a Giulia" / "🚪 Chiudi per tutti" / "Resta")
        var oS = (U2 && U2.o) || o;
        if (oS.esciScelta) return oS.esciScelta(function () { if (document.body.contains(s)) esci(); });
        chiediConferma((U2 && U2.o && U2.o.confermaEsci) || o.confermaEsci || "Chiudere la stanza per tutti?", null, "Chiudi", function () { if (document.body.contains(s)) esci(); });
      } });
    s.classList.add("saletta-schermo");
    // il primo tocco nella saletta accende i suoni (i telefoni li tengono spenti finché non si tocca): "pling", musichetta…
    ["pointerup", "touchend", "click"].forEach(function (ev) { s.addEventListener(ev, function () { audioCtx(); }, true); });   // (iPhone: serve un tocco vero)
    var U2 = { gid: g.id, nomeG: g.nome, chiaveG: g.chiave || null, gObj: g, host: !!o.host, s: s, figure: {}, o: o, rete: o._rete || null };
    // in alto il codice e "📤 Invita gli amici": per chi ospita e (con la Sala sempre accesa) anche per chi entra.
    // Nei giochi della Sala il codice e il link sono quelli della Sala (o.sala): uno per tutta la serata
    if (o.host || (salaSempre() && !o.senzaInvito)) {
      U2.cod = el("b", { text: "…" });
      // (col profilo e degli amici, nella Sala: "➕ Invita gli amici 🟢 2" apre il foglio degli amici: vedi tastoInvita)
      U2.link = el("button", { class: "btn btn-primario sl-link", html: "📤 Invita gli amici", onclick: function () {
        if (!U2.linkUrl) return;
        if (U2.invModo === "amici" && window.SGAmiciOnline) { apriInvitaAmici(U2); return; }
        condividiLink(U2.linkUrl, U2.gObj || g, U2.link);
      } });
      U2.codEt = el("small", { text: "Codice" });
      U2.codBox = el("div", { class: "sl-cod" + (o.host ? "" : " ospite") }, [ U2.codEt, U2.cod ]);   // (il pallino dice se la stanza è aperta: solo per chi ospita)
      s._contenuto.appendChild(el("div", { class: "sl-invito" }, [ U2.codBox, U2.link ]));
    }
    U2.statoT = s.querySelector(".testa .sotto");   // il sottotitolo ("Sala di Paky"; per chi ospita anche lo stato)
    if (o.host) {
      // nella testa, a destra, "🔒 Chiudi la porta" (chi non è già dentro legge "La stanza è chiusa"); sotto il titolo lo stato:
      // "🟡 Sto aprendo la stanza…", "🔒 Porta chiusa" (così non ruba spazio alla saletta)
      var testa = s.querySelector(".testa");
      U2.porta = el("button", { class: "sl-porta", type: "button", hidden: "hidden", onclick: function () { portaSaletta(U2); } });
      testa.appendChild(U2.porta);
      U2.sottoBase = U2.statoT ? U2.statoT.textContent : "";
    }
    // la saletta: muro, finestra, quadro col simbolo del gioco, orologio, pianta, divano e tappeto (uguale per tutti i giochi)
    U2.stanza = el("div", { class: "sl-stanza" }, [ el("div", { class: "sl-muro" }), el("div", { class: "sl-insegna", text: "Sala d'attesa" }),
      el("div", { class: "sl-finestra" }), el("div", { class: "sl-quadro" }, [ el("span", { text: g.icona || "🎲" }) ]),
      el("div", { class: "sl-orologio", html: "<svg viewBox='0 0 40 40'><circle cx='20' cy='20' r='17' fill='#fff8e8' stroke='#6b4428' stroke-width='3'/><path d='M20 20 L20 9 M20 20 L28 24' stroke='#2b2b33' stroke-width='2.4' stroke-linecap='round'/><circle cx='20' cy='20' r='2' fill='#e03131'/></svg>" }),
      el("div", { class: "sl-pavimento" }), el("div", { class: "sl-tappeto" }), el("div", { class: "sl-divano" }),
      el("div", { class: "sl-pianta", html: "<svg viewBox='0 0 60 80'><path d='M30 50 C18 40 8 30 10 14 C20 22 26 34 30 50 Z' fill='#40c057'/><path d='M30 50 C42 40 52 30 50 12 C40 22 34 34 30 50 Z' fill='#2f9e44'/><path d='M30 52 C26 36 28 18 34 4 C38 20 36 36 30 52 Z' fill='#51cf66'/><path d='M16 50 L44 50 L40 78 L20 78 Z' fill='#c9713a' stroke='#8a4a22' stroke-width='2' stroke-linejoin='round'/><rect x='14' y='47' width='32' height='7' rx='2' fill='#d9854a' stroke='#8a4a22' stroke-width='2'/></svg>" }) ]);
    U2.conta = el("div", { class: "sl-conta" });
    U2.guardano = el("div", { class: "sl-guardano", hidden: "hidden" });   // "👀 2": chi guarda soltanto (Passo 6)
    // 🎵/🔇 nell'angolo: la musichetta (sul telefono dell'host) e i suoni della saletta; la scelta resta ricordata
    U2.bSuono = el("button", { class: "sl-suono", type: "button", "aria-label": "Musica e suoni della saletta", onclick: function () { suonoSaletta(!SUONO_SL.on); } });
    // sopra gli avatar due veli: i nomi (sempre leggibili, anche di chi sta dietro) e poi i fumetti e le faccine
    U2.targhe = el("div", { class: "sl-targhe" });
    U2.bolle = el("div", { class: "sl-bolle", "aria-hidden": "true" });
    [U2.conta, U2.guardano, U2.bSuono, U2.targhe, U2.bolle].forEach(function (x) { U2.stanza.appendChild(x); });
    s._contenuto.appendChild(U2.stanza);
    // la stanza cambia misura (telefono girato, tastiera, barra del browser): gli avatar si rimettono a misura
    if (window.ResizeObserver) {
      U2.ro = new ResizeObserver(function () { if (!document.body.contains(U2.s)) { U2.ro.disconnect(); return; } disponiSaletta(U2, false); });
      U2.ro.observe(U2.stanza);
    }
    // le faccine: il mio avatar le fa sui telefoni di tutti (al massimo una al secondo)
    U2.faccine = vassoioFaccine(function () { return U2.rete && U2.rete._sv; });
    U2.faccine.hidden = true;
    s._contenuto.appendChild(U2.faccine);
    U2.extra = el("div", { class: "sl-extra" });
    s._contenuto.appendChild(U2.extra);
    if (!o.host) {
      // "✅ Sei dentro!" solo quando l'host mi ha davvero messo nella lista; prima "⏳ Sto entrando…"
      U2.titolo = el("div", { class: "sl-att-tit" });
      U2.attesa = el("div", { class: "sl-att-testo" });
      U2.consiglio = el("div", { class: "sl-consiglio" });
      U2.box = el("div", { class: "sl-attesa" }, [ U2.titolo, U2.attesa, U2.consiglio ]);
      // sopra "Sei dentro" le regole scelte dall'host: "📜 Si gioca così: 5 carte · Storia, Cinema" (tocco → il foglio)
      if (g.id !== "__sala") { rigaRegoleNodi(U2, function () { foglioRegoleOspite(U2); }); s._contenuto.appendChild(U2.rRiga); }
      s._contenuto.appendChild(U2.box);
      // "✋ Sono pronto!" (nelle salette dei giochi; nella Sala si aspetta che l'host scelga)
      if (g.id !== "__sala") {
        U2.bPronto = el("button", { class: "btn btn-verde sl-pronto", type: "button", onclick: function () { prontoSaletta(U2); } });
        s._piede.appendChild(U2.bPronto);
      }
    } else {
      U2.go = el("button", { class: "btn btn-primario sl-go", onclick: function () { partenza(U2); } });
      U2.chip = el("div", { class: "sl-chip", hidden: "hidden", "aria-live": "polite" });   // "✋ Pronti 2 su 3"
      U2.nota = el("p", { class: "modulo-nota sl-nota" });
      U2.R = R || null;
      // "🏆 Fate il torneino in 5": un gioco a due e nella stanza (o nella Sala) si è almeno in 3 (vedi tastoTorneino)
      if (GIOCHI_ELIMINAZIONE[g.id]) { U2.bTorneino = el("button", { class: "btn sl-torneino", type: "button", hidden: "hidden", onclick: function () { torneinoDaSaletta(U2); } }); s._piede.appendChild(U2.bTorneino); }
      s._piede.appendChild(U2.chip);
      // l'host può sempre cambiare le regole, anche con gli amici già dentro (e nel ⚙️ c'è "Parti da solo quando tutti sono pronti")
      var regoleGioco = !!(R && haRegole(R.box));
      var salaPunti = g.id === "__sala" && !regoleGioco && !!sala && !sala.elim;   // (la Sala: nel ⚙️ c'è "🏆 Contiamo i punti")
      if (regoleGioco || g.id !== "__sala" || salaPunti) {
        U2.bRegole = el("button", { class: "btn btn-fantasma sl-regole", text: regoleGioco ? "⚙️ Regole" : "⚙️", "aria-label": regoleGioco ? "Regole della partita" : (salaPunti ? "La Sala" : "La saletta"), onclick: function () { foglioRegole(U2); } });
        s._piede.appendChild(el("div", { class: "sl-tasti" }, [ U2.bRegole, U2.go ]));
      } else s._piede.appendChild(U2.go);
      // le regole della partita in una riga, al posto della nota (tocco → ⚙️): quelle che leggono anche gli amici
      if (regoleGioco) { rigaRegoleNodi(U2, function () { foglioRegole(U2); }); s._piede.appendChild(U2.rRiga); }
      s._piede.appendChild(U2.nota);
    }
    SL.ultimo = U2;
    nuovoGiroSaletta(U2);   // una saletta nuova (es. "Nuova partita"): i "pronto" ripartono da zero
    aggiornaSaletta(U2, o, true);
    mostra(s);
    disponiSaletta(U2, false);   // (ora la stanza ha le sue misure)
    // (anche col ResizeObserver: a volte non avvisa, es. pagina nascosta quando si gira il telefono; due conti uguali non fanno danni)
    window.addEventListener("resize", function rimisura() { if (!document.body.contains(U2.s)) return window.removeEventListener("resize", rimisura); disponiSaletta(U2, false); });
    avviaAnimeSaletta();
    musicaSaletta();
    return s;
  }
  var CONSIGLI_SL = ["Tocca una faccina: il tuo avatar la fa sui telefoni di tutti! 😂", "Tocca il tuo avatar: ti saluta! 👋", "Tocca gli altri avatar: saltano! 🤸", "Appena l'host fa partire, il gioco si apre da solo."];
  // l'host non mi ha messo nella sua foto: nessuno nella lista sono io (niente "Tu" sbagliato, anche se il gioco lo crede)
  function senzaTuFalso(gio, st) { return st && st.foto && !st.presente ? gio.map(function (p) { return p.tu ? Object.assign({}, p, { tu: false }) : p; }) : gio; }
  // il titolo della saletta di chi entra (dice sempre la verità): "✅ Sei dentro!" solo se l'host mi ha messo nella lista;
  // "⏳ Sto entrando…" finché non succede; nei giochi a due, se giocano già in due: "👀 Giocano in due: tu guardi".
  // Si cambia solo se è diverso (niente lampeggio). true = sono dentro
  function titoloSaletta(U, gio, st) {
    var io = gio.filter(function (p) { return p.tu; })[0], dentro = !!io && (!st || st.presente);
    var altri = gio.filter(function (p) { return !p.bot && !p.tu; }).length;
    var guardi = !dentro && !!st && st.vivo && st.foto && altri >= 2 && aDue(giocoDa(U.gid)) && (st.presente || Date.now() - (st.entrato || 0) > 2500);
    // il gioco dice che questo telefono guarda soltanto (t.lobby({ spettatore: true }), es. partita piena): "👀 Guardi questa partita"
    var spett = !!(U.o && U.o.spettatore);
    var k = spett ? "spett" : (dentro ? "dentro" : (guardi ? "guardi" : "entrando"));
    var tx = k === "spett" ? (typeof U.o.spettatore === "string" ? U.o.spettatore : "👀 Guardi questa partita")
      : k === "dentro" ? "✅ Sei dentro!" : (k === "guardi" ? "👀 Giocano in due: tu guardi" : "⏳ Sto entrando…");
    if (U.statoTit !== k || U.titolo.textContent !== tx) {
      U.statoTit = k;
      U.titolo.textContent = tx;
      U.box.classList.toggle("entrando", k === "entrando");
    }
    return dentro && !spett;
  }
  function aggiornaSaletta(U, o, nuova) {
    U.o = o;
    if (o._rete) U.rete = o._rete;
    var gio = (o.giocatori || []).slice();
    // nei giochi della Sala: chi della Sala manca ancora (sagome grigie col suo nome, "Arrivano: 3 su 4", "Comincia senza Marco")
    var attesi = U.attesi = o._attesiDi ? (o._attesiDi(gio, U.rete && U.rete._sv) || []) : [];
    // la testata: il codice (della Sala, se il gioco è della Sala) e il link da mandare. Il codice della stanza
    // di questa saletta resta scritto in data-stanza (serve alle prove). Si cambia solo quello che è diverso
    if (U.cod) {
      var codSt = String(o.codice || (U.rete && U.rete.codice) || "").toUpperCase();
      var pronto = !!codSt && codSt !== "…", inSala = !!(o.sala && o.sala.codice);
      var codMostra = inSala ? String(o.sala.codice).toUpperCase() : (pronto ? codSt : "…");
      if (U.cod.textContent !== codMostra) U.cod.textContent = codMostra;
      // il codice di una Compagnia ha 6 lettere: più piccolo, per stare in una riga con "📤 Invita"
      var sei = codMostra.length === 6;
      var et = sei && (inSala || U.gid === "__sala") ? "📌 Compagnia" : (inSala || (U.gid === "__sala" && salaSempre()) ? "Sala" : "Codice");
      if (U.codEt.textContent !== et) U.codEt.textContent = et;
      U.codBox.classList.toggle("sei", sei);
      if (pronto) U.codBox.setAttribute("data-stanza", codSt); else U.codBox.removeAttribute("data-stanza");
      // o.link: la Sala o il torneo ha il suo; nei giochi della Sala si invita nella Sala
      U.linkUrl = o.link || (inSala && o.sala.link) || (pronto ? SG.creaLink({ gioco: U.gid, stanza: codSt, k: U.host ? chiaveDi(codSt, true) : undefined }) : "");
      if (U.linkUrl) U.link.removeAttribute("disabled"); else U.link.setAttribute("disabled", "disabled");
      tastoInvita(U, inSala || U.gid === "__sala" ? codMostra : "", inSala || U.gid === "__sala");   // ("➕ Invita gli amici" nella Sala, Passo 6)
    }
    var sotto = sottoSaletta(o);
    if (U.host) U.sottoBase = sotto;   // (applicaViva lo mette sotto il titolo, se non c'è uno stato da dire)
    else if (U.statoT && U.statoT.textContent !== sotto) U.statoT.textContent = sotto;
    if (U.host) {
      U.aperta = pronto && o.pronta !== false;   // (lo stato sotto il titolo, il pallino del codice e la porta: vedi applicaViva)
      var veri = gio.filter(function (p) { return !p.bot; }).length, min = o.min || 2;
      U.goOk = !((veri < min && !o.puoiDaSolo) || o.puoComincia === false);   // puoComincia: il gioco può chiedere altro (es. le squadre fatte)
      tastoGo(U);
      // con gli amici dentro, "✋ Pronti 2 su 3" dice già tutto: la nota resta solo se il gioco ha qualcosa da dire
      // chi manca (gioco della Sala) e il gioco non può ancora partire: "Aspettiamo Marco…"
      // le regole: la riga "📜 Si gioca così" (calcolata all'apertura) prende il posto della nota di tutti i giorni;
      // restano solo le note che dicono perché non si può ancora partire, o quelle del gioco
      regoleHost(U, !!nuova);
      tastoTorneino(U);
      var notaTx;
      if (attesi.length && !U.goOk) notaTx = "Aspettiamo " + nomiAttesi(attesi) + "…";
      else notaTx = o.nota || (veri < min && !o.puoiDaSolo ? "Aspettiamo gli amici: " + (veri === 1 ? "per ora ci sei solo tu." : "servono almeno " + min + " giocatori.") : (veri > 1 && U.gid !== "__sala" || U.regR ? "" : "Quando ci siete tutti, fai partire la partita."));
      if (U.nota.textContent !== notaTx) U.nota.textContent = notaTx;
    } else {
      var chiHost = gio.filter(function (p) { return p.host; })[0];
      U.attesa.textContent = o.attesa || ("Aspetta che " + (chiHost ? chiHost.nome : "l'host") + " faccia partire la partita…");
      // sono davvero dentro? Nella lista c'è "tu" E l'ultima foto dell'host ha il mio id (lo sa il collegamento)
      var rete = o._rete && o._rete.stato ? o._rete : null, st = rete ? rete.stato() : null;
      gio = senzaTuFalso(gio, st);
      var io = gio.filter(function (p) { return p.tu; })[0], dentro = titoloSaletta(U, gio, st);
      // il consiglio (scelto una volta): chi guarda soltanto non ha il suo avatar nella stanza, niente "Tocca il tuo avatar"
      var adatti = io && !o.spettatore ? CONSIGLI_SL : CONSIGLI_SL.filter(function (c) { return !/il tuo avatar/.test(c); });
      if (adatti.indexOf(U.consiglio.textContent) < 0) U.consiglio.textContent = adatti[Math.floor(Math.random() * adatti.length)];
      if (dentro && rete && rete.codice) {
        // il nome che ho in questa stanza (se l'host l'ha cambiato: "Luca 2") e quello dell'host: servono se la pagina si ricarica
        var chiave = io.nome + "|" + (chiHost ? chiHost.nome : "");
        if (U.nomiVisti !== chiave) { U.nomiVisti = chiave; ricordaNomeStanza(rete.codice, io.nome); if (chiHost) ricordaNomeStanza(rete.codice, chiHost.nome, true); }
      }
      // non sono nella foto dell'host: chiedo di nuovo di entrare (la saletta è appena comparsa, es. "Nuova partita",
      // oppure c'ero e l'host mi ha tolto). Negli aggiornamenti normali ci pensa il collegamento, senza fretta.
      // (chi è nella foto ma non tra i giocatori guarda soltanto: niente da chiedere)
      if (!dentro && !o.spettatore && st && !st.presente && (nuova || st.dentro)) rete.riprova();
      // in saletta il titolo dice già tutto: la pillola "entri alla prossima" sparisce subito (non un secondo dopo)
      if (rete) pillola("prossima", null);
      rigaRegole(U, false);   // (le regole che l'host ha già mandato)
    }
    // i nodi del gioco sotto la saletta (es. scelta del posto): si rimettono solo se sono cambiati
    var ex = (o.extra || []).filter(Boolean);
    if (ex.length !== U.extra.childNodes.length || ex.some(function (n, i) { return U.extra.childNodes[i] !== n; })) { svuota(U.extra); ex.forEach(function (n) { U.extra.appendChild(n); }); }
    // i personaggi: chi c'è già resta (niente lampeggio), chi arriva entra col saltello e "Ciao Luca! 👋",
    // chi esce saluta e sfuma. Dove sta ognuno (e quanto è grande) lo decide disponiSaletta, qui sotto
    var tieni = {}, n = gio.length, vuoti = Math.max(0, o.vuoti || 0), arrivati = [], usciti = 0, ordine = [];
    vuoti = Math.max(0, vuoti - attesi.length);   // (le sagome di chi manca prendono il posto dei posti liberi)
    gio.forEach(function (p, i) {
      var k = chiavePers(p, i), f = U.figure[k], cfg = p.omino || (window.SGOmino ? SGOmino.casuale(p.nome || k) : null), sig = JSON.stringify(cfg) + "|" + p.nome + "|" + !!p.tu + "|" + !!p.host + "|" + !!p.bot;
      if (!f) {
        // l'avatar ha i suoi pezzi fissi: il disegno (con l'anello verde sul pavimento quando è pronto), il nome sotto i piedi,
        // il bollino (✓ o 📶) e "si ricollega…" (nella targa, sopra il nome: non copre i nomi degli altri); quando cambia qualcosa si rifà solo il disegno o il nome
        f = { nodo: el("div", { class: "sl-av entra" }), sig: "", k: k, manoSu: false };
        f.anello = el("i", { class: "sl-anello", "aria-hidden": "true" }); f.fig = el("div", { class: "sl-fig" });
        f.bollo = el("b", { class: "sl-bollo", "aria-hidden": "true" }); f.ricollega = el("small", { class: "sl-ricollega" });   // (sta nella targa, sopra il nome)
        f.nodo.appendChild(el("div", { class: "sl-av-in" }, [f.fig, f.bollo]));
        // il nome sta nel velo delle targhe, sopra gli avatar: i capelli di chi è davanti non lo coprono mai
        f.targa = f.nodo._targa = el("div", { class: "sl-nome entra" }); U.targhe.appendChild(f.targa);
        toccoAvatar(U, f);
        U.figure[k] = f; U.stanza.insertBefore(f.nodo, U.targhe);
        (function (nodo, targa) { setTimeout(function () { nodo.classList.remove("entra"); targa.classList.remove("entra"); }, 700); })(f.nodo, f.targa);
        if (!p.tu && U.visti) arrivati.push(f);   // (il fumetto quando è al suo posto, qui sotto)
      }
      f.p = p;
      if (f.sig !== sig) {
        f.sig = sig; f.tu = !!p.tu; f.cfg = cfg;
        disegnaFigura(f);
        svuota(f.targa); f.targa.classList.toggle("tu", !!p.tu);
        [ f.ricollega, p.host ? el("span", { class: "sl-cor", text: "👑" }) : null, document.createTextNode(p.tu ? "Tu" : (p.nome || "…")), p.bot ? el("span", { text: " 🤖" }) : null ].forEach(function (x) { if (x) f.targa.appendChild(x); });
      }
      f.nodo.classList.toggle("tu", !!p.tu); f.nodo.classList.toggle("bot", !!p.bot);
      ordine.push(f.nodo); tieni[k] = true;
    });
    var via = Object.keys(U.figure).filter(function (k) { return !tieni[k]; });
    via.forEach(function (k) {
      var f = U.figure[k], nodo = f.nodo; delete U.figure[k];
      if (MENU_AV && MENU_AV.f === f) chiudiMenuAvatar();
      // saluta con la mano e sfuma (resta dov'era: gli altri intanto si sistemano). Il fumetto solo se escono in pochi
      nodo.classList.add("va"); usciti++;
      if (via.length <= 2) fumetto(U, f, "Ciao ciao! 👋", "va", 1300);
      gesto(nodo, nodo.classList.contains("pronto") ? "salta" : "saluta");
      setTimeout(function () { nodo.classList.add("esce"); f.targa.classList.add("esce"); }, 650);
      setTimeout(function () { togliNodo(nodo); togliNodo(f.targa); }, 1150);
    });
    // i posti liberi: sagome tratteggiate (sempre le stesse finché servono: niente lampeggio)
    U.vuoti = U.vuoti || [];
    while (U.vuoti.length > vuoti) { var vv = U.vuoti.pop(); vv.classList.add("esce"); vv._targa.classList.add("esce"); (function (x) { setTimeout(function () { togliNodo(x); togliNodo(x._targa); }, 450); })(vv); }
    while (U.vuoti.length < vuoti) {
      var nv = el("div", { class: "sl-av sl-vuoto" }, [ el("div", { class: "sl-av-in" }, [ el("div", { class: "sl-sagoma" }) ]) ]);
      nv._targa = el("div", { class: "sl-nome vuoto", text: "posto libero" }); U.targhe.appendChild(nv._targa);
      U.stanza.insertBefore(nv, U.targhe); U.vuoti.push(nv);
    }
    // chi della Sala manca ancora: l'avatar grigio e trasparente (fermo, senza respiro) col nome e "…" (📶 se si sta
    // ricollegando). Sempre gli stessi nodi; quando arriva la sua sagoma sfuma e l'avatar vero entra col saltello
    var attN = U.attN = U.attN || {}, attOrd = [], tieniA = {};
    attesi.forEach(function (a) {
      var x = attN[a.id];
      if (!x) {
        x = attN[a.id] = el("div", { class: "sl-av sl-atteso" }, [ el("div", { class: "sl-av-in" }, [ el("div", { class: "sl-fig" }) ]) ]);
        x._targa = el("div", { class: "sl-nome atteso" }); U.targhe.appendChild(x._targa);
        U.stanza.insertBefore(x, U.targhe);
      }
      var cfg = a.omino || (window.SGOmino ? SGOmino.casuale(a.nome || a.id) : null), sigF = JSON.stringify(cfg);
      if (x._sigF !== sigF) { x._sigF = sigF; x.firstChild.firstChild.innerHTML = cfg && window.SGOmino ? SGOmino.svg(cfg) : "<div class='sl-emo'>🙂</div>"; }
      var tx = (a.forse ? "📶 " : "") + (a.nome || "") + "…";
      if (x._targa.textContent !== tx) x._targa.textContent = tx;
      x._targa.classList.toggle("forse", !!a.forse);
      tieniA[a.id] = 1; attOrd.push(x);
    });
    Object.keys(attN).forEach(function (id) {
      if (tieniA[id]) return;
      var x = attN[id]; delete attN[id];
      x.classList.add("esce"); x._targa.classList.add("esce");
      setTimeout(function () { togliNodo(x); togliNodo(x._targa); }, 450);
    });
    U.ordine = ordine.concat(attOrd, U.vuoti);
    disponiSaletta(U, !nuova);
    // il contatore: "4 in sala"; in un gioco della Sala, finché manca qualcuno, "Arrivano: 3 su 4"
    var veriQui = gio.filter(function (p) { return !p.bot; }).length;
    var conta = attesi.length ? "Arrivano: " + veriQui + " su " + (veriQui + attesi.length) : (n === 1 ? "1 in sala" : n + " in sala");
    U.conta.classList.toggle("arriva", attesi.length > 0);   // (va a capo: "Arrivano:" sopra, "3 su 4" sotto, non copre l'insegna)
    if (U.conta.textContent !== conta) { U.conta.textContent = conta; if (U.visti) rianima(U.conta, "salta"); }   // il contatore fa un saltello
    // "Ciao Luca! 👋" a chi arriva (uno o due alla volta; se rientrano in tanti insieme, es. l'host ha riaperto la stanza,
    // bastano il saltello e il "pling": niente muro di fumetti)
    if (arrivati.length <= 2) arrivati.forEach(function (f, i) {
      setTimeout(function () { if (f.nodo.parentNode && !f.nodo.classList.contains("va")) fumetto(U, f, "Ciao " + ((f.p && f.p.nome) || "") + "! 👋", "ciao", 2600); }, i * 500);
    });
    if (arrivati.length) suonoSl("pling"); else if (usciti && U.visti) suonoSl("va");
    U.visti = true;
    applicaViva(U);
  }
  // ---- dove sta ognuno nella stanza (le misure seguono la stanza: anche su un telefono alto gli avatar vengono grandi) ----
  //  tre modi, vince quello con gli avatar più grandi (a pari misura il zig-zag, più allegro):
  //  - in fila;
  //  - a zig-zag: uno davanti e uno dietro (quelli dietro un po' più piccoli e più in alto), col nome di chi sta dietro
  //    tra le teste di chi sta davanti;
  //  - a zig-zag "alto": chi sta dietro sale sopra le teste (quando sono tanti: si stringono di più).
  //  Si vedono tutti i visi e tutti i nomi, anche in 10. Chi cambia posto ci scivola da dov'era (solo transform: niente scatti).
  //  (w è la larghezza del disegno dell'avatar: la persona ne occupa circa i due terzi)
  var SL_SOPRA = 46;   // sopra la testa più alta: lo spazio per i fumetti e l'insegna
  function disponiSaletta(U, anima) {
    var st = U.stanza, W = st.clientWidth, H = st.clientHeight, nodi = U.ordine || [], tot = nodi.length;
    if (!W || !H || !tot) return;   // (la saletta non è ancora sullo schermo: ci pensa l'osservatore della stanza)
    var piedi = Math.max(20, Math.round(H * 0.055)), alto = Math.max(60, H - piedi - SL_SOPRA);   // piedi: c'è la targa col nome sotto
    var w1 = Math.min(W / tot * 1.12, alto / 1.32, 190);
    var wA = tot >= 3 ? Math.min(1.6 * (W - 8) / (tot + 0.216), (alto - 8) / 1.93, 170) : 0;
    var wB = tot >= 3 ? Math.min(2.3 * (W - 8) / (tot + 0.748), (alto - 10) / 2.335, 170) : 0;
    var zz = Math.max(wA, wB) >= w1 * 0.9, pos = [], pav = 0.3;
    if (!zz) nodi.forEach(function (nd, i) { pos.push({ x: (i + 0.5) * W / tot, b: piedi, w: w1, z: 4, tmax: W / tot - 6 }); });
    else {
      var alzati = wB > wA, w = alzati ? wB : wA, m = w * 0.38 + 4, passo = (W - 2 * m) / (tot - 1), wb = w * 0.86;
      var bb = alzati ? piedi + 1.2 * w + 10 : piedi + 0.78 * w + 8;
      nodi.forEach(function (nd, i) {
        var d = i % 2 === 1;
        pos.push({ x: m + i * passo, b: d ? bb : piedi, w: d ? wb : w, z: d ? 3 : 4, dietro: d,
          tmax: Math.min(w * 1.24, 2 * passo - 8, d && !alzati ? 2 * passo - 0.62 * w : 999) });   // (il nome non va sotto un altro nome)
      });
      pav = Math.max(0.3, Math.min(0.55, (bb + 10) / H));   // il pavimento arriva fin dietro a chi sta dietro
    }
    st.style.setProperty("--pav", (pav * 100).toFixed(1) + "%");
    st.classList.toggle("zz", zz);
    // ognuno al suo posto (e il suo nome sotto i piedi); chi si è spostato parte da dov'era (transform) e ci scivola
    var mossi = [];
    nodi.forEach(function (nd, i) {
      var p = pos[i], v = nd._pos, t = nd._targa; nd._pos = p;
      nd.style.left = (p.x - p.w / 2).toFixed(1) + "px"; nd.style.bottom = p.b.toFixed(1) + "px"; nd.style.width = p.w.toFixed(1) + "px";
      nd.style.zIndex = p.z; nd.style.setProperty("--w", p.w.toFixed(1) + "px");
      nd.classList.toggle("dietro", !!p.dietro);
      if (t) {
        t.style.bottom = (p.b - 9).toFixed(1) + "px"; t.style.maxWidth = Math.max(40, Math.round(p.tmax)) + "px"; t.style.setProperty("--w", p.w.toFixed(1) + "px");
        // il nome di chi sta sul bordo non esce dalla stanza (stanza bassa: gli avatar piccoli vanno vicino al bordo)
        var mz = (t.offsetWidth || 0) / 2 + 2, tx = mz * 2 < W ? Math.max(mz, Math.min(W - mz, p.x)) : p.x;
        t.style.left = tx.toFixed(1) + "px";
      }
      if (anima && v && (Math.abs(v.x - p.x) > 0.5 || Math.abs(v.b - p.b) > 0.5 || Math.abs(v.w - p.w) > 0.5)) mossi.push([nd, v, p]);
    });
    if (mossi.length) {
      mossi.forEach(function (x) {
        var nd = x[0], v = x[1], p = x[2], dx = (v.x - p.x).toFixed(1) + "px", dy = (p.b - v.b).toFixed(1) + "px";
        nd.style.transition = "none"; nd.style.transform = "translate(" + dx + "," + dy + ") scale(" + (v.w / p.w).toFixed(3) + ")";
        if (nd._targa) { nd._targa.style.transition = "none"; nd._targa.style.transform = "translate(calc(-50% + " + dx + ")," + dy + ")"; }
      });
      void st.offsetWidth;
      mossi.forEach(function (x) { var nd = x[0]; nd.style.transition = ""; nd.style.transform = ""; if (nd._targa) { nd._targa.style.transition = ""; nd._targa.style.transform = ""; } });
    }
    [].forEach.call(U.bolle.childNodes, function (b) { mettiBolla(U, b); });   // i fumetti seguono chi parla
  }
  function togliNodo(n) { if (n && n.parentNode) n.parentNode.removeChild(n); }
  // il disegno dell'avatar: con la mano alzata quando è pronto (il braccio passa davanti ai capelli), l'anello sotto i piedi
  function disegnaFigura(f) {
    f.fig.innerHTML = f.cfg && window.SGOmino ? SGOmino.svg(f.cfg, f.manoSu ? { braccia: "uno" } : null) : "<div class='sl-emo'>🙂</div>";
    f.fig.insertBefore(f.anello, f.fig.firstChild);
  }
  // un'animazione dell'avatar (saltello, saluto…) quando è libero: i tocchi e l'orologio della saletta
  function animaAv(nodo, cosa) {
    if (!nodo || nodo._gesto) return;
    if (cosa === "saluta" && nodo.classList.contains("pronto")) cosa = "salta";   // con la mano già alzata: un saltello
    gesto(nodo, cosa);
  }
  // un gesto dell'avatar (anche sopra a un altro: la faccina arriva sempre). Solo transform, nel CSS
  var DURATA_GESTO = { salta: 650, saluta: 1100, ride: 900, trema: 650, applaude: 850, dorme: 1700 };
  function gesto(nodo, cosa) {
    if (!nodo) return;
    Object.keys(DURATA_GESTO).forEach(function (c) { nodo.classList.remove(c); });
    void nodo.offsetWidth;   // (così la stessa animazione riparte da capo)
    nodo.classList.add(cosa); nodo._gesto = cosa;
    clearTimeout(nodo._tGesto);
    nodo._tGesto = setTimeout(function () { nodo.classList.remove(cosa); nodo._gesto = null; }, DURATA_GESTO[cosa] || 700);
  }
  function rianima(n, cls) { if (!n) return; n.classList.remove(cls); void n.offsetWidth; n.classList.add(cls); }
  // ogni tanto qualcuno saluta o fa un saltello (un solo orologio per tutte le salette)
  function avviaAnimeSaletta() {
    if (SL.timer) return;
    SL.timer = setInterval(function () {
      var U = SL.ultimo;
      if (!U || !document.body.contains(U.s)) { clearInterval(SL.timer); SL.timer = null; return; }
      if (document.hidden) return;
      var nodi = [].slice.call(U.stanza.querySelectorAll(".sl-av:not(.sl-vuoto):not(.sl-atteso):not(.va):not(.forse)"));
      if (nodi.length) animaAv(nodi[Math.floor(Math.random() * nodi.length)], Math.random() < 0.45 ? "saluta" : "salta");
    }, 2600);
  }

  // =========================================================
  //  SALETTA VIVA — ci si diverte già prima di cominciare (uguale per tutti i giochi: i giochi non fanno niente)
  //  - chi arriva fa "pling" e il fumetto "Ciao Luca! 👋", il contatore fa un saltello; chi esce saluta e sfuma;
  //  - "✋ Sono pronto!": l'avatar alza la mano e si accende la spunta; l'host legge "Pronti 2 su 3" e nel ⚙️
  //    trova "Parti da solo quando tutti sono pronti";
  //  - le faccine 👋 😂 😱 🔥 👏 😴: il mio avatar le fa su tutti i telefoni (al massimo una al secondo);
  //  - chi si sta ricollegando è grigio con 📶; l'host fa uscire (tocco lungo sull'avatar) e chiude la porta (🔒);
  //  - "Comincia": 3-2-1-Via! con suono su tutti i telefoni; la musichetta sul telefono dell'host (🎵/🔇).
  //  I messaggi passano dallo strato comune della rete (agganciaRete), i giochi non li vedono mai:
  //    ospite → host: __pronto { si }, __faccina { f }
  //    host → tutti (inviaVeloce: non restano nella stanza): __sl { p: chi è pronto, f: chi si ricollega,
  //    n: id → nome, porta }, __fa { id, n, f } (una faccina), __via { ms } o { stop } (il 3-2-1),
  //    __fuori { to, perche: "fuori" (fatto uscire) o "porta" (porta chiusa) }
  //  Lo stato di ogni stanza (SV) sta sul suo collegamento: h._sv (host e ospiti).
  // =========================================================
  var FACCINE_SL = ["👋", "😂", "😱", "🔥", "👏", "😴"];
  var GESTO_FACCINA = { "👋": "saluta", "😂": "ride", "😱": "trema", "🔥": "salta", "👏": "applaude", "😴": "dorme" };
  var VIA_MS = 2400;   // il 3-2-1: 0,8 secondi per numero, poi "Via!"
  var SVH = {};        // le stanze aperte da questo telefono (codice → SV): per chi si ricollega (evento sg-forse)
  var MENU_AV = null;  // il menu "Fai uscire" aperto: { nodo, f }
  var VIA = null;      // il 3-2-1 sullo schermo: { nodo, U, host, timer }
  var FINE = null;     // i tasti di fine partita sullo schermo: { nodo (Rivincita o Ci sto), SV, host, base } (il conto 👍 senza ridisegnare)
  var RIV = null;      // la Rivincita appena toccata: { codice, attesi:[id], nomi, quando, auto, pronti, daSala, U } (3-2-1 da solo se ci sono tutti)
  // chi si sta ricollegando (lo dice net.js, sul telefono dell'host): grigio con 📶 su tutti i telefoni
  window.addEventListener("sg-forse", function (e) {
    var d = e.detail || {}, SV = SVH[String(d.stanza || "").toUpperCase()];
    if (!SV || !d.id) return;
    if (d.forse && SV.dentro[d.id]) SV.forse[d.id] = 1; else delete SV.forse[d.id];
    svRiassunto(SV);
    if (SV.sala) rinfrescaAttesi();   // (nella saletta del gioco della Sala, chi manca ha il 📶)
  });
  function nuovoSV(host, codice, sala) {
    return { host: host, codice: String(codice || "").toUpperCase(), sala: !!sala, h: null, pronti: {}, forse: {}, nomi: {}, dentro: {}, andati: {},
      fuori: {}, avvisati: {}, ultFa: {}, porta: false, tSl: null, ultMia: 0, addio: null, salva: null,
      // fine partita (p2-f): chi ci sta per la prossima (cisto; il mio tocco non ancora confermato: cistoMio), il giro della
      // saletta (giro: dell'host; giroH: l'ultimo letto nel __sl; giroMio: quello della mia saletta), chi c'era nella saletta
      // prima della partita (idsSaletta), la stanza chiusa apposta dalla classifica (chiusaFine), la fase (anche per chi entra)
      cisto: {}, cistoMio: null, cistoT: 0, giro: 0, giroH: null, giroMio: null, idsSaletta: null, chiusaFine: false, fase: "",
      // "Giocato di recente" (p3-e): host uid (id -> uid di chi ha il profilo online), chi (ospite: nome -> uid, da "__chi")
      uid: {}, chi: {}, tChi: null,
      // chi guarda soltanto (Passo 6): host pubblico (id -> { n: nome, t: ultima volta sentito }), le faccine del pubblico
      // nell'ultimo secondo (ultFaP), il timer che toglie chi non si sente più (tPub); chi entra: quanti guardano (guardano, dal __sl)
      pubblico: {}, ultFaP: [], tPub: null, guardano: 0, nomiGuardano: [] };
  }
  function insieme(a) { var o = {}; (Array.isArray(a) ? a : []).forEach(function (k) { o[k] = 1; }); return o; }
  function mioIdSV(SV) { return SV.host ? "host" : (SV.h && SV.h.mioId); }
  function hostViaDi(codice) { var c = "/" + String(codice || "").toUpperCase() + "/"; return Object.keys(hostVia).some(function (k) { return k.indexOf(c) >= 0; }); }
  // l'id (del collegamento) di un avatar della saletta. Certi giochi usano id loro ("X" e "O" nel Tris):
  // allora si cerca per nome (nella stessa stanza i nomi sono tutti diversi: "Luca" e "Luca 2")
  function idDiFigura(SV, k, p) {
    if (!SV || !p || p.bot) return null;
    if (p.host) return "host";
    if (p.tu) return mioIdSV(SV);
    if (k !== "__io" && k !== "host" && SV.nomi[k] != null) return k;
    var trovato = null;
    Object.keys(SV.nomi).forEach(function (id) { if (!trovato && id !== "__io" && id !== "host" && stessoNome(SV.nomi[id], p.nome)) trovato = id; });
    return trovato;
  }
  function figuraDi(U, SV, id, nome) {
    var trovata = null, mio = mioIdSV(SV);
    Object.keys(U.figure).forEach(function (k) {
      var f = U.figure[k], p = f.p || {};
      if (!trovata && ((id === mio && p.tu) || (id === "host" && p.host) || (k === id && !p.host && !p.tu))) trovata = f;
    });
    if (!trovata && nome) Object.keys(U.figure).forEach(function (k) { var f = U.figure[k]; if (!trovata && f.p && !f.p.bot && stessoNome(f.p.nome, nome)) trovata = f; });
    return trovata;
  }
  // la saletta sullo schermo è quella di questa stanza?
  function vivaDi(SV) { var U = SL.ultimo; return SV && U && U.rete && U.rete._sv === SV && document.body.contains(U.s) ? U : null; }
  function aggiornaViva(SV) { var U = vivaDi(SV); if (U) applicaViva(U); }
  function vivaOra() { var U = SL.ultimo; if (U && U.figure && document.body.contains(U.s)) applicaViva(U); }

  // ---- la saletta si rimette in pari con lo stato: spunte, avatar grigi, "Pronti 2 su 3", la porta, "Sono pronto".
  //      Tocca solo quello che cambia (classi e scritte). Se tutti sono pronti e l'host ha acceso "Parti da solo", si parte ----
  function applicaViva(U) {
    if (!U || !U.figure) return;
    var SV = U.rete && U.rete._sv ? U.rete._sv : null;
    var giuIo = !!PILLOLE.n.rete;   // la mia rete è giù ("📶 Mi ricollego…"): il mio avatar è grigio anche da me
    var hostGiu = !!(SV && !SV.host && hostViaDi(SV.codice));
    var tot = 0, pronti = 0, pallini = [], qui = {};   // qui: gli amici nella saletta (id → 1, 2 se si sta ricollegando)
    Object.keys(U.figure).forEach(function (k) {
      var f = U.figure[k], p = f.p || {}, id = idDiFigura(SV, k, p);
      if (id && !p.host && !p.bot && id !== "host") qui[id] = (SV && SV.forse[id]) ? 2 : 1;
      var pr = !!(SV && id && SV.pronti[id]);
      if (p.tu && !U.host && U.mioPronto != null) pr = U.mioPronto;
      if (p.host || p.bot) pr = false;   // l'host fa partire lui; i bot sono sempre pronti (niente spunta)
      var fo = !!(SV && id && SV.forse[id]) || (!!p.tu && giuIo) || (!!p.host && hostGiu);
      f.nodo.classList.toggle("pronto", pr && !fo); f.targa.classList.toggle("pronto", pr && !fo);
      f.nodo.classList.toggle("forse", fo); f.targa.classList.toggle("forse", fo);
      // pronto: alza la mano (si ridisegna solo lui) con un saltello; non più pronto: la abbassa
      if ((pr && !fo) !== f.manoSu) { f.manoSu = pr && !fo; disegnaFigura(f); if (f.manoSu && U.visti) gesto(f.nodo, "salta"); }
      var b = fo ? "📶" : (pr ? "✓" : "");
      var rt = fo ? "si ricollega…" : "";   // (la scritta c'è solo quando serve: niente testo nascosto per chi legge lo schermo)
      if (f.ricollega.textContent !== rt) f.ricollega.textContent = rt;
      if (f.bollo.textContent !== b) f.bollo.textContent = b;
      if (!p.host && !p.bot) { tot++; if (pr && !fo) pronti++; pallini.push(pr && !fo); }   // (chi si sta ricollegando non conta come pronto)
    });
    U.faccine.hidden = !SV;
    // "👀 2": chi guarda soltanto (accanto al contatore e nella fila delle faccine)
    var nPub = contaPubblico(SV), txPub = nPub > 0 ? "👀 " + nPub : "";
    [U.guardano, U.faccine && U.faccine._pub].forEach(function (x) { if (!x) return; if (x.textContent !== txPub) x.textContent = txPub; x.hidden = !nPub; });
    if (U.bSuono) { var ts = SUONO_SL.on ? "🎵" : "🔇"; if (U.bSuono.textContent !== ts) { U.bSuono.textContent = ts; U.bSuono.setAttribute("aria-pressed", SUONO_SL.on ? "true" : "false"); } }
    if (U.host) {
      // sotto il titolo lo stato ("🟡 Sto aprendo…", "🔒 Porta chiusa"), il pallino del codice, la porta nella testa (🔒 Chiudi / 🔓 Riapri)
      var porta = !!(SV && SV.porta), cosa = U.gid === "__sala" ? "Sala" : "stanza";
      var st = !U.aperta ? "🟡 Sto aprendo la " + cosa + "…" : (porta ? "🔒 Porta chiusa" : U.sottoBase);
      if (U.statoT && U.statoT.textContent !== st) U.statoT.textContent = st;
      U.codBox.classList.toggle("apre", !U.aperta); U.codBox.classList.toggle("chiusa", porta);
      U.s.classList.toggle("porta-chiusa", porta);
      var tp = porta ? "🔓 Riapri" : "🔒 Chiudi";
      if (U.porta.textContent !== tp) { U.porta.textContent = tp; U.porta.setAttribute("aria-label", porta ? "Riapri la porta della " + cosa : "Chiudi la porta della " + cosa + ": non entra nessun altro"); }
      U.porta.hidden = !(SV && U.aperta);
      U.porta.setAttribute("aria-pressed", porta ? "true" : "false");
      // "✋ Pronti 2 su 3" con un pallino per amico (nelle salette dei giochi, con almeno un amico)
      var conChip = U.gid !== "__sala" && tot > 0, tutti = conChip && pronti === tot;
      U.chip.hidden = !conChip;
      if (conChip) {
        var firma = pronti + "/" + tot + "|" + pallini.join(",");
        if (U.chipFirma !== firma) {
          U.chipFirma = firma; svuota(U.chip);
          U.chip.appendChild(el("span", { text: tutti ? "🎉 Tutti pronti!" : "✋ Pronti " + pronti + " su " + tot }));
          var pa = el("span", { class: "sl-pallini", "aria-hidden": "true" });
          pallini.forEach(function (x) { pa.appendChild(el("i", { class: x ? "si" : null })); });
          U.chip.appendChild(pa);
        }
        U.chip.classList.toggle("tutti", tutti);
      }
      // chi è nella saletta adesso: alla Rivincita si aspettano loro (non chi guardava da fuori o è arrivato a partita in corso)
      if (SV && SV.host && U.gid !== "__sala") SV.idsSaletta = Object.keys(qui);
      tastoTorneino(U);   // ("🏆 Fate il torneino in 5": chi entra o esce dalla stanza)
      // dopo "↻ Rivincita": chi della partita prima manca ancora ("Comincia senza Luca"); ci sono tutti e nessuno è grigio → 3-2-1 da solo
      var R = RIV && RIV.U === U ? RIV : null, manca = R ? R.attesi.filter(function (id) { return !qui[id]; }) : [];
      var mancaK = manca.join(",");
      if ((U.rivMancaK || "") !== mancaK) { U.rivMancaK = mancaK; U.rivManca = manca.map(function (id) { return { id: id, nome: R.nomi[id] || "…" }; }); tastoGo(U); }
      // (anche chi della Sala sta arrivando per questa partita, es. chi aspettava "entri alla prossima": lo si aspetta)
      if (R && R.auto && !manca.length && !(U.attesi || []).length && !R.attesi.some(function (id) { return qui[id] === 2; }) && U.goOk && !U.via && Date.now() - R.quando < 10000) {
        R.auto = false;
        setTimeout(function () {
          if (RIV !== R || SL.ultimo !== U || !document.body.contains(U.s) || U.via || !U.goOk) return;
          if (document.querySelector(".sl-velo")) { if (Date.now() - R.quando < 10000) R.auto = true; return; }   // (il foglio ⚙️ è aperto: si riprova quando si chiude)
          partenza(U, true);
        }, 700);
      }
      // la luce sul tasto: tutti pronti, oppure (gioco della Sala) sono arrivati tutti quelli che aspettavamo
      var arrivati = !!(U.o && U.o._attesiDi) && tot > 0 && !(U.attesi || []).length;
      U.go.classList.toggle("invita", (tutti || arrivati) && !!U.goOk && !U.via);
      // tutti pronti e "Parti da solo" acceso: si parte da soli (una volta; se qualcuno torna "non pronto", si riarma).
      // Se manca ancora qualcuno della Sala, no: lo si aspetta (o l'host tocca "Comincia senza…")
      if (!tutti || (U.attesi || []).length) U.autoFatto = false;
      else if (autoParti() && U.goOk && !U.via && !U.autoFatto) {
        U.autoFatto = true;
        setTimeout(function () {
          if (SL.ultimo === U && document.body.contains(U.s) && U.chip.classList.contains("tutti") && !document.querySelector(".sl-velo")) partenza(U, true);
          else U.autoFatto = false;   // (il foglio ⚙️ è aperto: si riprova quando si chiude)
        }, 700);
      }
    } else if (U.bPronto) {
      // "✋ Sono pronto!" solo per chi è davvero dentro; chi guarda (giochi a due già pieni) non ce l'ha
      var dentro = U.statoTit === "dentro", mio = mioPronto(U, SV);
      U.bPronto.hidden = !SV || U.statoTit === "guardi" || U.statoTit === "spett";
      var fp = (dentro ? 1 : 0) + "|" + (mio ? 1 : 0);
      if (U.prFirma !== fp) {
        U.prFirma = fp; svuota(U.bPronto);
        U.bPronto.appendChild(el("span", { text: mio ? "✅ Sei pronto!" : "✋ Sono pronto!" }));
        if (mio) U.bPronto.appendChild(el("small", { text: "Tocca se non lo sei più" }));
        U.bPronto.classList.toggle("fatto", !!mio);
        U.bPronto.setAttribute("aria-pressed", mio ? "true" : "false");
        if (dentro) U.bPronto.removeAttribute("disabled"); else U.bPronto.setAttribute("disabled", "disabled");
      }
    }
  }
  function mioPronto(U, SV) {
    if (U.mioPronto != null) return U.mioPronto;
    var id = SV && mioIdSV(SV); return !!(SV && id && SV.pronti[id]);
  }
  // una saletta nuova (prima apertura o "Nuova partita"): i "pronto" ripartono da zero
  // (p2-f) chi a fine partita ha detto "👍 Ci sto!" parte già pronto; dopo la Rivincita della Sala in una stanza nuova, quelli di prima
  function nuovoGiroSaletta(U) {
    var SV = U.rete && U.rete._sv; if (!SV) return;
    U.mioPronto = null;
    if (SV.host) {
      var R = RIV && RIV.codice === SV.codice && !RIV.U ? RIV : null;
      SV.pronti = R && R.daSala ? Object.assign({}, R.pronti) : insieme(Object.keys(SV.cisto || {}).filter(function (id) { return SV.dentro[id]; }));
      if (R) R.U = U;
      SV.cisto = {}; SV.giro = (SV.giro || 0) + 1;
      svRiassunto(SV);
      return;
    }
    // chi entra: se il riassunto della saletta nuova è già arrivato vale quello; se no per ora chi ci stava (e io, se ho toccato)
    if (SV.giroH == null || SV.giroH === SV.giroMio) {
      var io = mioIdSV(SV);
      SV.pronti = Object.assign({}, SV.cisto || {});
      if (io && SV.cistoMio != null) { if (SV.cistoMio) SV.pronti[io] = 1; else delete SV.pronti[io]; }
    }
    SV.giroMio = SV.giroH; SV.cisto = {}; SV.cistoMio = null;
  }
  // ✋ "Sono pronto!" (ospite): l'avatar alza subito la mano; l'host lo dice a tutti
  function prontoSaletta(U) {
    var SV = U.rete && U.rete._sv; if (!SV || SV.host || U.statoTit !== "dentro") return;
    var ora = !mioPronto(U, SV);
    U.mioPronto = ora; U.toccoPronto = Date.now();
    try { SV.h.invia({ t: "__pronto", si: ora }); } catch (e) {}
    if (ora) suonoSl("pronto");
    applicaViva(U);
  }

  // ---- HOST: chi entra, chi è pronto, le faccine, chi esce o viene fatto uscire, la porta ----
  // il riassunto per tutti (dopo un attimo, così più cambi vanno insieme)
  function svRiassunto(SV) {
    if (!SV || !SV.host) return;
    clearTimeout(SV.tSl);
    SV.tSl = setTimeout(function () {
      SV.tSl = null;
      try { if (SV.h) SV.h.inviaVeloce(slDi(SV)); } catch (e) {}
      aggiornaViva(SV);
      aggiornaFine(SV);   // (il conto "👍 3" sul tasto della Rivincita)
    }, 120);
  }
  // il riassunto della saletta: chi è pronto, chi si ricollega, i nomi, la porta, le regole (r, rv), chi ci sta (c), il giro (g)
  function slDi(SV) {
    var n = { host: SV.nomi.__io || "" };
    Object.keys(SV.dentro).forEach(function (id) { if (SV.nomi[id]) n[id] = SV.nomi[id]; });
    var c = Object.keys(SV.cisto || {}).filter(function (id) { return SV.dentro[id]; });
    // (Passo 6) chi guarda soltanto: quanti (gu) e i primi 8 nomi (gn); la fase della partita (fa). ("g" è già il giro)
    var pub = Object.keys(SV.pubblico || {});
    return { t: "__sl", p: Object.keys(SV.pronti), f: Object.keys(SV.forse), n: n, porta: SV.porta ? 1 : 0, r: SV.regR || undefined, rv: SV.regR ? SV.rvR : undefined,
      c: c.length ? c : undefined, g: SV.giro || 0,
      gu: pub.length || undefined, gn: pub.length ? pub.slice(0, 8).map(function (id) { return SV.pubblico[id].n; }) : undefined, fa: SV.fase || undefined };
  }
  // ---- CHI GUARDA SOLTANTO (Passo 6): il pubblico della stanza, sul telefono dell'host ----
  // "__guardo" { n: nome } arriva all'apertura e poi ogni 20 s; chi non si sente da 50 s non guarda più
  var PUB_VIA = 50000, PUB_GIRO = 15000;
  function svGuardo(SV, id, m) {
    if (!SV.host || !id || SV.sala || SV.dentro[id] || SV.fuori[id]) return;   // (chi gioca, o chi è stato fatto uscire: niente)
    var nome = String((m && m.n) || "").replace(/\s+/g, " ").trim().slice(0, 16) || "Pubblico";
    var nuovo = !SV.pubblico[id] || SV.pubblico[id].n !== nome;
    var arriva = !SV.pubblico[id];
    SV.pubblico[id] = { n: nome, t: Date.now() };
    if (!SV.tPub) SV.tPub = setInterval(function () { pulisciPubblico(SV); }, PUB_GIRO);   // (il timer c'è solo se qualcuno guarda)
    if (nuovo) { svRiassunto(SV); aggiornaPubblico(SV); }
    // (22 ott 2026) il gioco dell'host lo sa, se vuole: cb.onGuarda(id, nome) quando arriva uno che guarda soltanto (anche dopo
    // una ricarica dell'host), così gli manda quello che chi gioca riceve entrando (es. gli avatar: Parola d'ordine)
    if (arriva && SV.onGuardo) try { SV.onGuardo(id, nome); } catch (e) { setTimeout(function () { throw e; }, 0); }
  }
  function pulisciPubblico(SV) {
    var ora = Date.now(), via = 0;
    Object.keys(SV.pubblico).forEach(function (id) { if (ora - SV.pubblico[id].t > PUB_VIA) { delete SV.pubblico[id]; via++; } });
    fermaPubblico(SV);
    if (via) { svRiassunto(SV); aggiornaPubblico(SV); }
  }
  function fermaPubblico(SV) { if (SV.tPub && !Object.keys(SV.pubblico).length) { clearInterval(SV.tPub); SV.tPub = null; } }
  // quanti guardano questa stanza (host: il suo pubblico; chi entra: quello che dice il __sl)
  function contaPubblico(SV) { return !SV ? 0 : (SV.host ? Object.keys(SV.pubblico || {}).length : (+SV.guardano || 0)); }
  // "👀 2" accanto al contatore della saletta e a sinistra nelle file delle faccine di questa stanza (solo il testo che cambia)
  function aggiornaPubblico(SV) {
    var n = contaPubblico(SV), tx = n > 0 ? "👀 " + n : "", et = n === 1 ? "1 persona guarda" : n + " persone guardano";
    function metti(x) {
      if (!x) return;
      if (x.textContent !== tx) x.textContent = tx;
      x.hidden = !n; if (n) x.setAttribute("aria-label", et);
    }
    var U = vivaDi(SV); if (U) metti(U.guardano);
    [].forEach.call(document.querySelectorAll(".sl-faccine"), function (b) { var s = null; try { s = b._sv && b._sv(); } catch (e) {} if (s === SV) metti(b._pub); });
  }
  // "sono pronto" e le faccine degli ospiti (solo da chi è dentro; una faccina al secondo a testa)
  function svDaOspite(SV, id, m) {
    // chi guarda soltanto può mandare solo le faccine: una ogni 900 ms a testa e, dal pubblico, al massimo 4 al secondo in tutto
    if (!SV.dentro[id] && SV.pubblico[id] && m.t === "__faccina" && FACCINE_SL.indexOf(m.f) >= 0) {
      var oraP = Date.now(), P0 = SV.pubblico[id];
      if (oraP - (SV.ultFa[id] || 0) < 900) return;
      SV.ultFaP = SV.ultFaP.filter(function (x) { return oraP - x < 1000; });
      if (SV.ultFaP.length >= 4) return;
      SV.ultFa[id] = oraP; SV.ultFaP.push(oraP); P0.t = oraP;
      try { SV.h.inviaVeloce({ t: "__fa", id: id, n: P0.n, f: m.f }); } catch (e) {}
      mostraFaccina(SV, id, P0.n, m.f);
      return;
    }
    if (!SV.dentro[id]) return;
    if (m.t === "__pronto") {
      if (m.si) SV.pronti[id] = 1; else delete SV.pronti[id];
      svRiassunto(SV);   // (anche se non cambia niente: così il suo telefono è sicuro)
    } else if (m.t === "__cisto") {   // "👍 Ci sto!" a fine partita (si ritocca per toglierlo)
      if (m.si) SV.cisto[id] = 1; else delete SV.cisto[id];
      svRiassunto(SV);
    } else if (m.t === "__faccina" && FACCINE_SL.indexOf(m.f) >= 0) {
      var ora = Date.now(); if (ora - (SV.ultFa[id] || 0) < 900) return;
      SV.ultFa[id] = ora;
      var nome = SV.nomi[id] || "";
      try { SV.h.inviaVeloce({ t: "__fa", id: id, n: nome, f: m.f }); } catch (e) {}
      mostraFaccina(SV, id, nome, m.f);
    }
  }
  // la stanza è il gioco della mia Sala e chi bussa è già nella Sala (stesso id): con la porta chiusa entra lo stesso
  function diMiaSala(SV, id) { return !!(sala && sala.stanza && SV.codice === sala.stanza && sala.membri.some(function (m) { return m.id === id; })); }
  // chi è stato fatto uscire, o chi è nuovo con la porta chiusa: non entra (il gioco non lo vede) e gli si dice perché
  function svRifiuta(SV, id) {
    var ora = Date.now(), k = SV.fuori[id];
    if (k && !SV.porta && ora - k > 60000) { delete SV.fuori[id]; k = 0; }   // porta aperta: dopo un minuto chi era stato fatto uscire può tornare
    var perche = k ? "fuori" : (SV.porta && !SV.dentro[id] && !diMiaSala(SV, id) ? "porta" : null);
    if (!perche) return false;
    if (ora - (SV.avvisati[id] || 0) > 2000) { SV.avvisati[id] = ora; try { SV.h.inviaVeloce({ t: "__fuori", to: id, perche: perche }); } catch (e) {} }
    return true;
  }
  // per il gioco qualcuno è uscito: una volta sola (uscito da sé, sparito, fatto uscire)
  function svAddio(SV, id) {
    // guardava soltanto: via dal pubblico (il gioco non l'ha mai visto, non gli si dice niente)
    if (id && SV.pubblico && SV.pubblico[id] && !SV.dentro[id]) { delete SV.pubblico[id]; fermaPubblico(SV); svRiassunto(SV); aggiornaPubblico(SV); return; }
    if (!id || SV.andati[id]) return;
    SV.andati[id] = 1;
    delete SV.dentro[id]; delete SV.pronti[id]; delete SV.forse[id]; delete SV.cisto[id];
    if (RIV && RIV.codice === SV.codice && RIV.attesi.indexOf(id) >= 0) RIV.auto = false;   // uno della Rivincita se n'è andato: niente 3-2-1 da solo
    if (SV.addio) try { SV.addio(id); } catch (e) {}
    svRiassunto(SV);
    if (SV.onDentro) SV.onDentro();
  }
  // 🚪 "Fai uscire": il suo telefono torna alla home e per il gioco è uscito
  function svFuori(SV, id, nome) {
    if (!SV || !SV.host || !id || id === "host") return;
    SV.fuori[id] = Date.now(); SV.avvisati[id] = Date.now();
    try { SV.h.inviaVeloce({ t: "__fuori", to: id, perche: "fuori" }); } catch (e) {}
    svAddio(SV, id);
    pillola("saletta", "🚪 " + (nome || "L'amico") + " è fuori dalla stanza", "grigia", 3000);
  }
  // 🔒 la porta: chiusa, chi non è già dentro legge "La stanza è chiusa" (chi è dentro può sempre ricaricare e rientrare)
  function portaSaletta(U) {
    var SV = U.rete && U.rete._sv; if (!SV || !SV.host) return;
    SV.porta = !SV.porta;
    if (SV.salva) SV.salva();   // (se la pagina si ricarica, la stanza riapre con la porta com'era)
    svRiassunto(SV); applicaViva(U);
    // un gioco della mia Sala: si chiude (o si riapre) insieme anche la porta della Sala, così chi è nuovo legge
    // subito "La Sala è chiusa" (chi è già nella Sala entra lo stesso nel gioco: vedi svRifiuta)
    var SS = U.o && U.o.sala && sala && sala.stanza === SV.codice && sala.rete && sala.rete._sv;
    if (SS && SS !== SV && SS.host) { SS.porta = SV.porta; if (SS.salva) SS.salva(); svRiassunto(SS); }
    pillola("saletta", SV.porta ? (SS ? "🔒 Sala chiusa: non entra nessun altro" : "🔒 Porta chiusa: non entra nessun altro")
      : (SS ? "🔓 Sala aperta: chi ha il codice può entrare" : "🔓 Porta aperta: chi ha il link può entrare"), SV.porta ? "grigia" : "verde", 2600);
  }

  // ---- OSPITE: il riassunto dell'host, il 3-2-1, "sei fuori" ----
  function svArrivato(SV, m) {
    SV.pronti = insieme(m.p); SV.forse = insieme(m.f); SV.nomi = m.n && typeof m.n === "object" ? m.n : {}; SV.porta = !!m.porta;
    // fine partita: chi ci sta (il mio tocco vale finché l'host non lo conferma, o per un secondo e mezzo), il giro della saletta,
    // la stanza che l'host chiude apposta dalla classifica (fine: 1)
    SV.cisto = insieme(m.c); SV.giroH = +m.g || 0;
    // (Passo 6) quanti guardano soltanto ("👀 2") e la fase della partita
    var guPrima = SV.guardano; SV.guardano = Math.max(0, +m.gu || 0); SV.nomiGuardano = Array.isArray(m.gn) ? m.gn.slice(0, 8).map(function (x) { return String(x).slice(0, 16); }) : [];
    if (SV.guardano !== guPrima) aggiornaPubblico(SV);
    if (m.fa === "lobby" || m.fa === "gioco" || m.fa === "fine") SV.fase = m.fa;
    if (SV.cistoMio != null && (!!SV.cisto[mioIdSV(SV)] === SV.cistoMio || Date.now() - SV.cistoT > 1500)) SV.cistoMio = null;
    if (m.fine) SV.chiusaFine = true;
    aggiornaFine(SV);
    var U = vivaDi(SV);
    // il mio "pronto" toccato adesso vale finché l'host non lo conferma (o dopo un secondo e mezzo vale il suo)
    if (U && U.mioPronto != null && (!!SV.pronti[mioIdSV(SV)] === U.mioPronto || Date.now() - (U.toccoPronto || 0) > 1500)) U.mioPronto = null;
    // nella saletta di un gioco della Sala chi manca cambia: chi si ricollega nella Sala (📶), chi è già nella stanza
    // le regole dell'host (r, rv): se rv è cresciuto (non la prima volta) la riga fa il saltello e "✨ Regole cambiate"
    //  (rv più basso: l'host ha ricaricato la pagina e riconta da 1; si prendono le sue)
    var rvPrima = SV.rvR, rPrima = SV.regR, rv = +m.rv || 0;
    if (typeof m.r === "string" && m.r && (rv !== rvPrima || m.r !== rPrima)) {
      SV.regR = m.r.slice(0, 120); SV.rvR = rv;
      if (U) rigaRegole(U, rvPrima != null && rv !== rvPrima && SV.regR !== rPrima);
    }
    var conAttesi = !!(U && U.o && U.o._attesiDi);
    if (U && !conAttesi) applicaViva(U);
    if (SV.sala || conAttesi) rinfrescaAttesi();   // (rifà anche la saletta viva)
  }
  function contoVia(SV, m) {
    if (m.stop) { if (VIA && !VIA.host) togliVia(); return; }
    var U = vivaDi(SV); if (!U || U.host) return;   // solo nella saletta (chi è già in partita non lo vede)
    mostraVia(Math.max(900, Math.min(4000, +m.ms || VIA_MS)), U, false, null);
  }
  // l'host mi ha fatto uscire (o la porta è chiusa e io sono nuovo): via dalla stanza, niente "Rientra"
  function fuoriDallaStanza(R, perche) {
    if (R.finita) return;
    R.finita = true;
    var porta = perche === "porta", C = R.codice;
    try { R.h.chiudi(); } catch (e) {}
    var ls = linkSessione(), rs = stanzaRecente();
    if (ls && (ls.stanza === C || ls.sala === C)) dimenticaLinkSessione();
    if (rs && (rs.stanza === C || rs.sala === C)) try { localStorage.removeItem("sg-ultima-stanza"); } catch (e) {}
    togliVia(); togliFerma();
    var P = R.P;
    // un gioco lanciato dalla Sala: si torna nella Sala
    if (!R.sala && P && P.salaCtx && P.viva() && P.salaCtx.fine) {
      lasciaPartita(); P.salaCtx.fine();
      pillola("saletta", porta ? "🔒 La partita ha la porta chiusa" : "🚪 L'host ti ha fatto uscire dalla partita", "grigia", 3500);
      return;
    }
    if (R.sala) { if (salaG && salaG.rete === R.h) salaG = null; }
    lasciaPartita(); SGNet.chiudiGiochi(); tieniAcceso(false);
    var g = P && P.g, riprova = porta ? function () { if (R.sala) return salaOspite(C); if (g) { linkParams = { gioco: g.id, stanza: C }; avviaPartita(g, [], {}); } } : null;
    var s = schermata({ icona: porta ? "🔒" : "🚪", titolo: porta ? (R.sala ? "La Sala è chiusa" : "La stanza è chiusa") : (R.sala ? "Sei fuori dalla Sala" : "Sei fuori dalla stanza"), sotto: (R.sala ? "Sala " : "Stanza ") + C });
    s._contenuto.appendChild(el("p", { style: "font-size:1.05rem;line-height:1.5", text: porta ? "Chi l'ha aperta ha chiuso la porta: per ora non entra nessun altro." : "Chi ha aperto la stanza ti ha fatto uscire." }));
    if (riprova) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Riprova", onclick: riprova }));
    s._piede.appendChild(el("button", { class: "btn " + (riprova ? "btn-fantasma" : "btn-primario"), text: "🏠 Torna alla home", onclick: tornaHome }));
    mostra(s);
  }

  // ---- LE FACCINE ----
  function mostraFaccina(SV, id, nome, emoji) {
    var U = vivaDi(SV);
    if (U) {
      var f = figuraDi(U, SV, id, nome);
      if (f && !f.nodo.classList.contains("va")) faccinaSuAvatar(U, f, emoji);
      else faccinaVolante(U.stanza, nome, emoji);   // chi non ha un avatar qui (es. chi guarda una partita a due)
      return;
    }
    // fuori dalla saletta (si guarda la partita, la classifica): se è la stanza del gioco aperto, in basso a sinistra
    if (stanzaInVista(SV)) faccinaVolante(null, nome, emoji);
  }
  function stanzaInVista(SV) {
    var P = partitaCorrente; if (!SV || !SV.h || !P || !P.viva()) return false;
    if (SV.host) return reteXp === SV.h;
    return !!(reteOsp && reteOsp.h === SV.h && reteOsp.P === P);
  }
  function faccinaSuAvatar(U, f, emoji) {
    bolla(U, f, el("span", { class: "sl-faccia", text: emoji }), "faccia", 1900);
    var g = GESTO_FACCINA[emoji] || "salta";
    if (g === "saluta" && f.nodo.classList.contains("pronto")) g = "salta";   // con la mano già alzata: un saltello
    gesto(f.nodo, g);
    suonoSl("pop");
  }
  function faccinaVolante(stanza, nome, emoji) {
    var box = stanza ? stanza.querySelector(".sl-fa-volanti") : document.querySelector("body > .sg-fa-volanti");
    if (!box) { box = el("div", { class: stanza ? "sl-fa-volanti" : "sg-fa-volanti", "aria-hidden": "true" }); (stanza || document.body).appendChild(box); }
    while (box.childNodes.length >= 4) box.removeChild(box.firstChild);
    var x = el("div", { class: "sg-fa-volante" }, [ el("b", { text: emoji }), nome ? el("span", { text: nome }) : null ]);
    box.appendChild(x);
    setTimeout(function () { if (x.parentNode) x.parentNode.removeChild(x); }, 2500);
    suonoSl("pop");
  }
  // la mia faccina: subito sul mio avatar, poi a tutti (con la rete giù si perde: vale solo adesso)
  function mandaFaccina(SV, emoji) {
    var ora = Date.now();
    if (!SV || !SV.h || ora - SV.ultMia < 1000) return false;   // al massimo una al secondo
    SV.ultMia = ora;
    var io = mioIdSV(SV), nome = SV.host ? (SV.nomi.__io || "") : (SV.nomi[io] || SV.nomeGuardo || "");   // (chi guarda soltanto: il suo nome)
    mostraFaccina(SV, io, nome, emoji);
    try { if (SV.host) SV.h.inviaVeloce({ t: "__fa", id: "host", n: nome, f: emoji }); else SV.h.invia({ t: "__faccina", f: emoji }); } catch (e) {}
    return true;
  }
  // la fila delle faccine (svFn: la stanza a cui mandarle). Dopo un tocco aspetta un secondo (la barretta si riempie)
  function vassoioFaccine(svFn) {
    var box = el("div", { class: "sl-faccine", role: "group", "aria-label": "Faccine: il tuo avatar le fa sui telefoni di tutti" });
    var carica = el("i", { class: "sl-fa-carica", "aria-hidden": "true" }), tasti = [];
    // a sinistra "👀 2" quando qualcuno guarda soltanto (lo aggiorna aggiornaPubblico, solo il testo)
    box._sv = svFn; box._pub = el("span", { class: "sl-fa-pubblico", hidden: "hidden" });
    box.appendChild(box._pub);
    try { var sv0 = svFn(), n0 = contaPubblico(sv0); if (n0) { box._pub.textContent = "👀 " + n0; box._pub.hidden = false; } } catch (e) {}
    FACCINE_SL.forEach(function (emoji) {
      var b = el("button", { class: "sl-fa", type: "button", "aria-label": "Faccina " + emoji, text: emoji });
      b.addEventListener("click", function () {
        if (!mandaFaccina(svFn(), emoji)) return;
        rianima(b, "boing"); rianima(carica, "va");
        box.classList.add("attesa"); tasti.forEach(function (x) { x.disabled = true; });
        clearTimeout(box._t); box._t = setTimeout(function () { box.classList.remove("attesa"); tasti.forEach(function (x) { x.disabled = false; }); }, 1000);
      });
      tasti.push(b); box.appendChild(b);
    });
    box.appendChild(carica);
    return box;
  }

  // ---- I FUMETTI E I TOCCHI SUGLI AVATAR ----
  // un fumetto sopra la testa ("Ciao Luca! 👋", "Ciao ciao! 👋")
  function fumetto(U, f, testo, cls, durata) {
    bolla(U, f, el("div", { class: "sl-fumetto" + (cls ? " " + cls : ""), text: testo }), "fumetto", durata || 2400);
  }
  // fumetti e faccine stanno nel velo sopra la stanza, sulla testa di chi parla (uno per tipo alla volta)
  function bolla(U, f, nodo, tipo, durata) {
    [].slice.call(U.bolle.childNodes).forEach(function (b) { if (b._f === f && b._tipo === tipo) U.bolle.removeChild(b); });
    nodo._f = f; nodo._tipo = tipo;
    U.bolle.appendChild(nodo); mettiBolla(U, nodo);
    f.nodo.classList.add("parla");   // (intanto "si ricollega…" si nasconde)
    setTimeout(function () {
      if (nodo.parentNode) nodo.parentNode.removeChild(nodo);
      if (![].some.call(U.bolle.childNodes, function (b) { return b._f === f; })) f.nodo.classList.remove("parla");
    }, durata);
  }
  // al suo posto: sopra la testa; il fumetto che uscirebbe dai lati si sposta dentro, con la punta sempre su chi parla
  function mettiBolla(U, b) {
    var p = b._f && b._f.nodo._pos; if (!p) return;
    var W = U.stanza.clientWidth, H = U.stanza.clientHeight, testa = p.b + p.w * 1.32, x = p.x;
    b.style.setProperty("--w", p.w.toFixed(1) + "px");   // (più grande sopra un avatar grande)
    if (b._tipo === "faccia") { b.style.left = x.toFixed(1) + "px"; b.style.bottom = (testa - p.w * 0.42).toFixed(1) + "px"; return; }
    var mezzo = b.offsetWidth / 2, alto = b.offsetHeight, giu = Math.max(0, Math.min(testa - 2, H - alto - 6));
    if (W && mezzo) x = Math.max(mezzo + 6, Math.min(W - mezzo - 6, x));
    // due fumetti insieme (arrivano in due) non si coprono: questo si mette sopra o sotto all'altro
    [].forEach.call(U.bolle.childNodes, function (o) {
      if (o === b || o._tipo !== "fumetto" || !o._x) return;
      var ox = o._x, ob = o._b, oh = o.offsetHeight, om = o.offsetWidth / 2;
      if (Math.abs(ox - x) < om + mezzo + 4 && giu < ob + oh + 4 && ob < giu + alto + 4) giu = ob + oh + 6 + alto <= H - 4 ? ob + oh + 6 : Math.max(0, ob - alto - 6);
    });
    b._x = x; b._b = giu;
    b.style.left = x.toFixed(1) + "px";
    b.style.bottom = giu.toFixed(1) + "px";
    b.style.setProperty("--coda", (p.x - x).toFixed(1) + "px");
  }
  // tocco: l'avatar salta (il mio saluta). L'host, tenendo premuto sull'avatar di un amico: "🚪 Fai uscire"
  function toccoAvatar(U, f) {
    var t = null, x0 = 0, y0 = 0, lungo = false;
    function annulla() { if (t) { clearTimeout(t); t = null; } }
    f.nodo.addEventListener("pointerdown", function (e) {
      lungo = false; annulla();
      var p = f.p || {};
      if (!U.host || p.tu || p.host || p.bot || f.nodo.classList.contains("va")) return;
      x0 = e.clientX; y0 = e.clientY;
      t = setTimeout(function () { t = null; lungo = true; menuAvatar(U, f); }, 550);
    });
    f.nodo.addEventListener("pointermove", function (e) { if (t && Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0) > 14) annulla(); });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) { f.nodo.addEventListener(ev, annulla); });
    f.nodo.addEventListener("click", function () { if (lungo) { lungo = false; return; } animaAv(f.nodo, f.tu ? "saluta" : "salta"); });
  }
  function menuAvatar(U, f) {
    chiudiMenuAvatar();
    var SV = U.rete && U.rete._sv; if (!SV || !SV.host || !document.body.contains(f.nodo)) return;
    var id = idDiFigura(SV, f.k, f.p); if (!id || id === "host") return;
    var nome = (f.p && f.p.nome) || "", W = U.stanza.clientWidth || 1, H = U.stanza.clientHeight || 1, p = f.nodo._pos || { x: W / 2, b: 0, w: 0 };
    var cx = p.x, lato = cx < W * 0.3 ? " sx" : (cx > W * 0.7 ? " dx" : "");
    var m = el("div", { class: "sl-menu" + lato, role: "dialog", "aria-label": nome }, [
      el("button", { class: "sl-menu-fuori", type: "button", text: "🚪 Fai uscire " + nome, onclick: function () { chiudiMenuAvatar(); svFuori(SV, id, nome); } }),
      el("button", { class: "sl-menu-x", type: "button", "aria-label": "Annulla", text: "✕", onclick: chiudiMenuAvatar })
    ]);
    m.style.left = Math.round(lato === " sx" ? Math.max(6, cx - 34) : (lato === " dx" ? Math.min(W - 6, cx + 34) : cx)) + "px";
    m.style.top = Math.round(Math.max(52, H - (p.b + p.w * 1.32) + 14)) + "px";   // (sulla testa)
    U.stanza.appendChild(m);
    MENU_AV = { nodo: m, f: f };
    setTimeout(function () { if (MENU_AV && MENU_AV.nodo === m) document.addEventListener("pointerdown", fuoriMenu, true); }, 0);
  }
  function fuoriMenu(e) { if (MENU_AV && !MENU_AV.nodo.contains(e.target)) chiudiMenuAvatar(); }
  function chiudiMenuAvatar() {
    document.removeEventListener("pointerdown", fuoriMenu, true);
    if (MENU_AV && MENU_AV.nodo.parentNode) MENU_AV.nodo.parentNode.removeChild(MENU_AV.nodo);
    MENU_AV = null;
  }

  // ---- 3-2-1-VIA! ----
  // "Comincia": il 3-2-1 su tutti i telefoni (ognuno conta da sé da quando gli arriva), poi parte il gioco.
  // Senza amici (o nella Sala, dove "Comincia" sceglie il gioco) si parte subito
  function partenza(U, auto) {
    if (!U || U.via || !U.goOk || !U.o || !U.o.onComincia) return;
    var SV = U.rete && U.rete._sv;
    var amici = (U.o.giocatori || []).filter(function (p) { return !p.bot && !p.tu; }).length;
    chiudiMenuAvatar();
    if (!SV || !SV.h || U.gid === "__sala" || !amici) return U.o.onComincia();
    U.via = true; tastoGo(U); applicaViva(U);
    try { SV.h.inviaVeloce({ t: "__via", ms: VIA_MS }); } catch (e) {}
    mostraVia(VIA_MS, U, true, function () {
      U.via = false;
      if (SL.ultimo !== U || !document.body.contains(U.s)) return;   // intanto si è usciti
      if (!U.goOk) return annullaVia(U);
      tastoGo(U);
      U.o.onComincia();
    });
  }
  // il tasto "Comincia" dell'host: acceso se il gioco può partire e non sta già partendo
  function tastoGo(U) {
    if (!U.go) return;
    if (U.via && !U.goOk) return annullaVia(U);   // qualcuno è uscito durante il 3-2-1 e non si può più partire
    // in un gioco della Sala, se manca qualcuno ma si può già partire: "▶ Comincia senza Marco" ("senza 2" se sono di più)
    // (dopo la Rivincita anche chi della partita prima non è tornato: "Comincia senza Luca")
    var att = (U.attesi || []).slice();
    (U.rivManca || []).forEach(function (a) { if (!att.some(function (x) { return x.id === a.id || stessoNome(x.nome, a.nome); })) att.push(a); });
    var senza = att.length ? "▶ Comincia senza " + (att.length === 1 ? att[0].nome : att.length) : "";
    var dis = !U.goOk || !!U.via, tx = U.via ? "🚀 Si parte…" : (senza && U.goOk ? senza : ((U.o && U.o.testoComincia) || "Comincia ▶"));
    if (dis) U.go.setAttribute("disabled", "disabled"); else U.go.removeAttribute("disabled");
    if (U.go.textContent !== tx) U.go.textContent = tx;
  }
  // "Marco", "Marco e Luca", "Marco e altri 2"
  function nomiAttesi(att) {
    if (att.length === 1) return att[0].nome;
    if (att.length === 2) return att[0].nome + " e " + att[1].nome;
    return att[0].nome + " e altri " + (att.length - 1);
  }
  function annullaVia(U) {
    var SV = U.rete && U.rete._sv;
    U.via = false; togliVia();
    try { if (SV && SV.h) SV.h.inviaVeloce({ t: "__via", stop: 1 }); } catch (e) {}
    tastoGo(U); applicaViva(U);
    pillola("saletta", "✋ Manca qualcuno: non si parte", "grigia", 2600);
  }
  // i numeri grandi in mezzo allo schermo (non si toccano: sotto resta tutto com'è). fine() al "Via!"
  function mostraVia(ms, U, host, fine) {
    togliVia();
    // in alto il gioco che parte; i numeri come i semafori di una gara: 3 rosso, 2 arancio, 1 giallo, Via! verde
    var g = U && giocoDa(U.gid);
    var num = el("div", { class: "sl-via-num" }), anello = el("div", { class: "sl-via-anello" });
    var tit = g ? el("div", { class: "sl-via-tit" }, [ el("span", { text: g.icona || "🎲" }), document.createTextNode(" " + g.nome) ]) : null;
    var nodo = el("div", { class: "sl-via", role: "status", "aria-live": "assertive" }, [ anello, num, tit ]);
    document.body.appendChild(nodo);
    var V = VIA = { nodo: nodo, U: U, host: !!host, timer: [] }, passo = ms / 3;
    if (host) MUSICA_SL.ferma();   // la musichetta lascia spazio al conto
    function viva() { return VIA === V; }
    function persa() { return U && (SL.ultimo !== U || !document.body.contains(U.s)); }
    function mostraN(tx, cls) { num.textContent = tx; num.className = "sl-via-num " + cls; void num.offsetWidth; num.classList.add("su"); anello.className = "sl-via-anello " + cls; void anello.offsetWidth; anello.classList.add("su"); }
    function via() {
      if (!viva()) return;
      mostraN("Via!", "via"); suonoSl("via"); scintille(nodo);
      V.timer.push(setTimeout(function () { if (!viva()) return; nodo.classList.add("fine"); V.timer.push(setTimeout(function () { if (viva()) togliVia(); }, 380)); }, 560));
      if (fine) fine();
    }
    [3, 2, 1].forEach(function (n, i) {
      V.timer.push(setTimeout(function () {
        if (!viva()) return;
        // la saletta non c'è più: chi fa partire (host) si ferma; chi aspetta (la partita è già cominciata) salta al "Via!"
        if (persa()) return host ? togliVia() : via();
        mostraN(String(n), "n" + n); suonoSl("bip" + n);
      }, i * passo));
    });
    V.timer.push(setTimeout(function () { if (!viva()) return; if (host && persa()) return togliVia(); via(); }, ms));
  }
  function togliVia() { if (!VIA) return; VIA.timer.forEach(clearTimeout); if (VIA.nodo.parentNode) VIA.nodo.parentNode.removeChild(VIA.nodo); VIA = null; }
  function scintille(nodo) {
    ["✨", "🎉", "⭐", "✨", "🎊", "⭐", "✨", "🎉", "⭐", "✨"].forEach(function (s, i, tutte) {
      var a = (i / tutte.length) * Math.PI * 2 + Math.random() * 0.5, r = 110 + Math.random() * 80;
      var x = el("span", { class: "sl-scintilla", text: s, "aria-hidden": "true" });
      x.style.setProperty("--dx", Math.round(Math.cos(a) * r) + "px"); x.style.setProperty("--dy", Math.round(Math.sin(a) * r) + "px");
      x.style.setProperty("--r", Math.round(Math.random() * 140 - 70) + "deg");
      nodo.appendChild(x);
    });
  }
  // ⚙️ (host): "Parti da solo quando tutti sono pronti" (la scelta resta su questo telefono)
  function autoParti() { try { return localStorage.getItem("sg-sl-parti") === "1"; } catch (e) { return false; } }
  function opzioniSaletta() {
    var chk = el("input", { type: "checkbox", "aria-label": "Parti da solo quando tutti sono pronti" }); chk.checked = autoParti();
    chk.addEventListener("change", function () { try { localStorage.setItem("sg-sl-parti", chk.checked ? "1" : "0"); } catch (e) {} });
    return el("div", { class: "sl-viva-opz" }, [
      el("label", { class: "sl-interruttore" }, [ el("span", { text: "⚡ Parti da solo quando tutti sono pronti" }), chk ]),
      el("small", { text: "Per far uscire qualcuno, tieni premuto sul suo avatar. In alto, «🔒 Chiudi» chiude la porta: non entra nessun altro." })
    ]);
  }

  // =========================================================
  //  FINE PARTITA UGUALE PER TUTTI (p2-f) — t.tastiFine(piede, { host, nuova, esci }): il core mette i tasti nel piede.
  //  Sala, host: "↻ Rivincita" (con "· 👍 3" appena qualcuno ci sta) e "🎮 Cambia gioco" (porta tutti nella Sala).
  //  Sala, chi entra: "👍 Ci sto!" e "🏠 Torna in Sala". Fuori dalla Sala: host "↻ Nuova partita (stessi amici)" e "🏠 Esci",
  //  chi entra "👍 Ci sto!" e "🏠 Esci". Host solo del gioco (duello): "↻ Rivincita" della sua stanza e "🏠 Torna in Sala".
  //  false = il gioco mette i suoi tasti di sempre: sullo stesso telefono, col bot, torneo a eliminazione, chi guarda
  //  (tranne l'host della Sala). La Rivincita riporta tutti nella saletta e, se ci sono tutti, parte da sola col 3-2-1.
  //  Messaggi (i giochi non li vedono): chi entra → host __cisto { si }; nel __sl c: [chi ci sta], g: il giro della saletta,
  //  fine: 1 (l'host chiude la stanza dalla classifica: chi entra non legge "Collegamento perso").
  // =========================================================
  // la stanza di questa partita, vista da qui (host: la mia; chi entra: quella dell'amico; chi guarda soltanto: null)
  function svPartita(P, host) {
    if (host) return reteXp && reteXp._P === P && reteXp._sv ? reteXp._sv : null;
    return reteOsp && reteOsp.P === P && !reteOsp.guarda && reteOsp.h && reteOsp.h._sv ? reteOsp.h._sv : null;
  }
  // K = { P: la partita, tavolo, ctx (facoltativo: quello della Sala, se diverso da P.salaCtx) }
  function tastiFineCore(piede, o, K) {
    o = o || {};
    var P = K.P, tav = K.tavolo || (P && P.tavolo), ctx = K.ctx || (P && P.salaCtx) || null;
    if (!piede || !P || !P.viva()) return false;
    if (ctx && ctx.tabellone) return false;   // torneo a eliminazione: il tabellone ha i suoi tasti
    // "👑 Chi vince resta": la fine di una sfida è uguale per tutti, anche per chi guarda (6-7): chi resta, chi tocca adesso,
    // "Prossima sfida tra 8…"; l'host della Sala "⏹ Basta così" e "🎮 Cambia gioco"
    if (ctx) {
      var SVr = svPartita(P, !!o.host) || svPartita(P, !o.host), stR = (tav && tav.linkParams && tav.linkParams.stanza) || ctx.stanza || ctx.duello || (SVr && SVr.codice) || null;
      if (restaFineDi(stR)) return bloccoResta(piede, stR, !!(sala && sala.resta), SVr ? { SV: SVr, salaHost: !!(sala && sala.ctx === ctx), host: !!SVr.host } : null);
    }
    var salaHost = !!(sala && ctx && sala.ctx === ctx);   // io comando la Sala (non solo la stanza del gioco: 2-15)
    if (tav && tav.linkParams && tav.linkParams.guarda && !salaHost) return false;   // chi guarda la partita di altri
    var host = !!o.host, SV = svPartita(P, host);
    if (!SV && !(salaHost && host)) return false;   // (sullo stesso telefono, col bot)
    // (o.rigioca: la partita è finita col t.fine del gioco, la Rivincita della Sala rilancia il gioco)
    var esci = o.esci || (tav && tav.esci) || null, nuova = o.rigioca ? null : (o.nuova || (tav && tav.onRivincita) || null), rig = null;
    var box = el("div", { class: "fine-tasti" }), primo, secondo, base;
    if (host) {
      if (salaHost) { rig = ctx.rigioca || null; if (!nuova && !rig) return false; }
      else if (!nuova) return false;   // (il gioco non sa rifare la partita nella stessa stanza: i suoi tasti di sempre)
      base = salaHost || ctx ? "↻ Rivincita" : "↻ Nuova partita (stessi amici)";
      primo = el("button", { class: "btn btn-primario ft-primo", type: "button", text: base, onclick: function () {
        if (primo.disabled) return;
        primo.disabled = true;   // (un tocco solo: la saletta arriva subito; se il gioco non può, dopo un attimo si riaccende)
        setTimeout(function () { primo.disabled = false; }, 1500);
        rivincitaCore(SV, nuova, rig);
      } });
      if (salaHost) secondo = el("button", { class: "btn btn-fantasma ft-secondo", type: "button", text: "🎮 Cambia gioco", onclick: function () { salaCambiaGioco(); } });
      else secondo = el("button", { class: "btn btn-fantasma ft-secondo", type: "button", text: ctx ? "🏠 Torna in Sala" : "🏠 Esci", onclick: function () {
        if (ctx) { if (esci) esci(); return; }
        fineApposta(SV);   // fuori dalla Sala: chi è sulla classifica legge "Paky ha chiuso la stanza" (non "Collegamento perso")
        if (o.esci) return o.esci();
        try { if (SV && SV.h) SV.h.chiudi(); } catch (e) {}   // (l'uscita del core: la stanza si chiude, gli amici non restano dentro)
        if (tav) tav.esci();
      } });
    } else {
      if (!SV) return false;
      // nella Sala chi non era tra i scelti ("Chi gioca?") ha solo guardato: alla rivincita giocano gli stessi, niente «Ci sto»
      if (ctx && salaG && salaG.sc && salaG.sc.stanza === SV.codice && salaG.sc.ids.indexOf(mioIdSV(SV)) < 0) {
        box.appendChild(el("button", { class: "btn btn-fantasma ft-secondo", type: "button", text: "🏠 Torna in Sala", onclick: function () { if (esci) esci(); } }));
        piede.appendChild(box);
        FINE = null;
        return true;
      }
      primo = el("button", { class: "btn btn-verde ft-primo ft-cisto", type: "button", "aria-pressed": "false", onclick: function () {
        if (SV.chiusaFine) return;
        var ora = !cistoMio(SV);
        SV.cistoMio = ora; SV.cistoT = Date.now();
        try { SV.h.invia({ t: "__cisto", si: ora }); } catch (e) {}   // (con la rete giù parte quando torna)
        aggiornaFine(SV);
      } });
      // (chi comanda la Sala ma non la stanza del gioco, come Giulia dopo il subentro con Parola d'ordine: «🎮 Cambia gioco»)
      if (salaHost) secondo = el("button", { class: "btn btn-fantasma ft-secondo", type: "button", text: "🎮 Cambia gioco", onclick: function () { salaCambiaGioco(); } });
      else secondo = el("button", { class: "btn btn-fantasma ft-secondo", type: "button", text: ctx ? "🏠 Torna in Sala" : "🏠 Esci", onclick: function () { if (esci) esci(); } });
    }
    // "👥 Avete giocato con: Luca ➕" sopra la riga dei tasti (solo col profilo online; se la classifica non è ancora
    // arrivata, si riempie dopo)
    FINE_REC = null;
    if (mioUidOnline() && window.SGCompagnia && SGCompagnia.rigaFine) {
      var rec = el("div", { class: "ft-rec", hidden: "hidden" });
      piede.appendChild(rec);
      FINE_REC = { box: rec, P: P };
      if (P.recPersone) riempiRigaRec(rec, P.recPersone);
    }
    if (ctx) rigaPuntiFine(box, SV, salaHost, host);   // (Classifica della serata: sopra i tasti "🏆 Serata: Paky 1° · Luca 2° · …")
    box.appendChild(primo);
    // un gioco a due nella Sala con altri che guardavano: "⚔️ Altra sfida" (si sceglie chi gioca adesso), tre tasti in fila
    if (host && salaHost && P.g && aDue(P.g) && sala.membri.length > 2) {
      box.classList.add("tre");
      var gS = P.g;
      box.appendChild(el("button", { class: "btn btn-fantasma ft-secondo ft-sfida", type: "button", text: "⚔️ Altra sfida", onclick: function () { salaAltraSfida(gS); } }));
    }
    box.appendChild(secondo);
    piede.appendChild(box);
    FINE = SV ? { nodo: primo, SV: SV, host: host, base: base } : null;
    if (SV) aggiornaFine(SV);
    return true;
  }
  function cistoMio(SV) { return SV.cistoMio != null ? SV.cistoMio : !!(SV.cisto || {})[mioIdSV(SV)]; }
  // il tasto sullo schermo segue chi ci sta (si cambia solo la scritta: niente ridisegno)
  function aggiornaFine(SV) {
    var F = FINE; if (!F || F.SV !== SV || !F.nodo) return;
    if (F.host) {
      var n = Object.keys(SV.cisto || {}).filter(function (id) { return SV.dentro[id]; }).length;
      var tx = F.base + (n ? " · 👍 " + n : "");
      if (F.nodo.textContent !== tx) F.nodo.textContent = tx;
      return;
    }
    if (SV.chiusaFine) { F.nodo.hidden = true; return; }   // la stanza non c'è più: resta "🏠 Esci"
    var si = cistoMio(SV), t2 = si ? "✅ Ci stai!" : "👍 Ci sto!";
    if (F.nodo.textContent !== t2) F.nodo.textContent = t2;
    F.nodo.classList.toggle("fatto", si); F.nodo.setAttribute("aria-pressed", si ? "true" : "false");
  }
  // "↻ Rivincita": mi segno chi c'era nella saletta di prima (la saletta nuova parte da sola col 3-2-1 se ci sono tutti,
  // entro 10 secondi e senza nessuno grigio; se qualcuno è uscito no: resta "Comincia senza Luca"), poi il gioco rimette la
  // saletta nella stessa stanza (nuova) o, nella Sala, si rilancia lo stesso gioco con le stesse regole in una stanza nuova (rig)
  function rivincitaCore(SV, nuova, rig) {
    var attesi = [], nomi = {}, usciti = 0, F = sala && SV && sala.stanza === SV.codice ? (sala.fuori || {}) : {};
    if (SV) {
      attesi = (SV.idsSaletta || Object.keys(SV.dentro)).filter(function (id) { return id && id !== "host"; });
      attesi.forEach(function (id) { nomi[id] = SV.nomi[id] || ""; if (!SV.dentro[id] || SV.andati[id] || F[id]) usciti++; });
    }
    var pronti = {};
    if (SV) Object.keys(SV.cisto || {}).forEach(function (id) { if (SV.dentro[id]) pronti[id] = 1; });
    // (nella stessa stanza il codice è questo; nella Sala con la stanza nuova lo segna salaLancia)
    var R = RIV = { codice: nuova && SV ? SV.codice : null, attesi: attesi, nomi: nomi, quando: Date.now(), auto: !usciti && attesi.length > 0,
      pronti: pronti, daSala: !nuova, U: null };
    setTimeout(function () { if (RIV === R && R.auto) { R.auto = false; vivaOra(); } }, 10000);
    FINE = null;
    if (nuova) nuova();
    else if (rig) rig();
  }
  // l'host chiude apposta dalla classifica: prima lo dice a chi è nella stanza (poi il gioco chiude)
  function fineApposta(SV) {
    if (!SV || !SV.host || !SV.h) return;
    clearTimeout(SV.tSl); SV.tSl = null;
    try { SV.h.inviaVeloce(Object.assign(slDi(SV), { fine: 1 })); } catch (e) {}
  }

  // ---- I SUONI DELLA SALETTA (generati, niente file) e la musichetta, solo sul telefono dell'host ----
  // 🎵/🔇 vale per tutti e due (la scelta resta ricordata). Niente vibrazioni: quelle solo quando si tocca
  var SUONO_SL = { on: true };
  try { SUONO_SL.on = localStorage.getItem("sg-sl-suono") !== "off"; } catch (e) {}
  function suonoSaletta(on) {
    SUONO_SL.on = !!on;
    try { localStorage.setItem("sg-sl-suono", on ? "on" : "off"); } catch (e) {}
    vivaOra();
    if (on) { audioCtx(); musicaSaletta(); } else MUSICA_SL.ferma();
  }
  function suonoSl(tipo) {
    if (!SUONO_SL.on) return;
    var ctx = audioCtx(); if (!ctx || ctx.state !== "running") return;   // (prima del primo tocco il telefono non suona)
    try {
      var t0 = ctx.currentTime + 0.01;
      var tono = function (f, t, dur, vol, forma, f2) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = forma || "sine"; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur * 0.8);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + 0.03);
      };
      if (tipo === "pling") { tono(1318.5, t0, 0.25, 0.15); tono(1975.5, t0 + 0.07, 0.4, 0.12); tono(2637, t0 + 0.07, 0.22, 0.035); }   // chi arriva
      else if (tipo === "va") { tono(784, t0, 0.2, 0.06); tono(587.3, t0 + 0.1, 0.3, 0.05); }                                             // chi esce
      else if (tipo === "pop") tono(420, t0, 0.11, 0.1, "sine", 980);                                                                       // una faccina
      else if (tipo === "pronto") { tono(1046.5, t0, 0.22, 0.11); tono(1568, t0 + 0.07, 0.32, 0.09); }
      else if (/^bip/.test(tipo)) tono({ bip3: 587.3, bip2: 659.3, bip1: 784 }[tipo] || 784, t0, 0.2, 0.13, "triangle");                    // 3, 2, 1 (sempre più acuto)
      else if (tipo === "via") { [1046.5, 1318.5, 1568, 2093].forEach(function (f, i) { tono(f, t0 + i * 0.035, 0.6, 0.08, "triangle"); }); tono(523.25, t0, 0.45, 0.07, "sine", 1046.5); }
    } catch (e) {}
  }
  function musicaSaletta() {
    var U = SL.ultimo; if (!(SUONO_SL.on && U && U.host && !U.via && document.body.contains(U.s))) return;
    // il telefono non suona finché non si tocca lo schermo (e lo schermo spento lo ferma): la musichetta parte da sola appena si può
    var ctx = audioCtx();
    if (ctx && !ctx._salettaAscolta && ctx.addEventListener) { ctx._salettaAscolta = true; try { ctx.addEventListener("statechange", function () { if (ctx.state === "running") musicaSaletta(); }); } catch (e) {} }
    MUSICA_SL.avvia();
  }
  // la musichetta: un giro allegro da sala d'attesa (Do · La- · Re- · Sol · Mi- · La · Re- · Sol), marimba, basso,
  // accordi morbidi e spazzole. Si ferma da sola quando la saletta non c'è più (o lo schermo si spegne)
  var MUSICA_SL = (function () {
    var ctx = null, master = null, timer = null, nextT = 0, step = 0, rumore = null;
    var S = 60 / 112 / 4;   // un sedicesimo a 112 battiti al minuto
    function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    var GIRO = [
      { b: 36, a: [60, 64, 67, 71], m: [76, null, 79, 76, 72, null, 74, 76] },
      { b: 33, a: [57, 60, 64, 67], m: [77, null, 76, 72, 69, null, 72, null] },
      { b: 38, a: [60, 62, 65, 69], m: [74, null, 77, 74, 69, null, 72, 74] },
      { b: 31, a: [59, 62, 65, 67], m: [79, 77, 76, 74, 71, null, 74, null] },
      { b: 40, a: [59, 62, 64, 67], m: [76, null, 79, 83, 79, null, 76, null] },
      { b: 33, a: [61, 64, 67, 69], m: [73, null, 76, 79, 81, null, 79, 76] },
      { b: 38, a: [60, 62, 65, 69], m: [77, null, 74, 77, 81, null, 77, 74] },
      { b: 31, a: [59, 62, 65, 67], m: [79, null, 74, 71, 74, 77, 79, null] }
    ];
    function nota(f, t0, dur, forma, vol, att) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = forma; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + (att || 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function marimba(f, t0) { nota(f, t0, 0.42, "sine", 0.16, 0.003); nota(f * 4, t0, 0.07, "sine", 0.025, 0.002); }
    function spazzola(t0, vol, dur) {
      if (!rumore) { rumore = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.12), ctx.sampleRate); var d = rumore.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      var s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = rumore; fl.type = "bandpass"; fl.frequency.value = 6200; fl.Q.value = 0.7;
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(fl); fl.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.02);
    }
    function cassa(t0) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(120, t0); o.frequency.exponentialRampToValueAtTime(48, t0 + 0.1);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.32, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 0.18);
    }
    function passo(t0) {
      var i = step % 16, battuta = Math.floor(step / 16), c = GIRO[battuta % 8], conMelodia = battuta >= 4;
      if (i === 0 || i === 8) cassa(t0);
      if (i % 2 === 0) spazzola(t0, i % 4 === 2 ? 0.05 : 0.025, 0.05);
      if (i === 4 || i === 12) spazzola(t0, 0.07, 0.11);
      if (i === 0) nota(hz(c.b), t0, S * 5, "triangle", 0.3);                     // il basso: radice, quinta, ottava
      if (i === 6) nota(hz(c.b + 7), t0, S * 2, "triangle", 0.22);
      if (i === 8) nota(hz(c.b + 12), t0, S * 3, "triangle", 0.24);
      if (i === 14) nota(hz(c.b + 7), t0, S * 2, "triangle", 0.18);
      if (i === 2 || i === 10) c.a.forEach(function (m) { nota(hz(m), t0, S * 2.4, "sine", 0.045, 0.012); nota(hz(m) * 1.003, t0, S * 2.4, "triangle", 0.02, 0.012); });   // accordi morbidi
      if (conMelodia && i % 2 === 0) { var mm = c.m[i / 2]; if (mm) marimba(hz(mm), t0); }
      step++;
    }
    function viva() { var U = SL.ultimo; return SUONO_SL.on && U && U.host && !U.via && document.body.contains(U.s) && !document.hidden; }
    function loop() {
      if (!ctx) return;
      if (!viva()) return ferma();
      if (nextT < ctx.currentTime - 0.05) nextT = ctx.currentTime + 0.05;   // il telefono si è inceppato un attimo: le note perse si saltano (niente raffica)
      while (nextT < ctx.currentTime + 0.3) { passo(nextT); nextT += S; }
    }
    function ferma() {
      if (timer) { clearInterval(timer); timer = null; }
      if (ctx && master) { try { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(Math.max(0.0001, master.gain.value || 0.0001), ctx.currentTime); master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5); } catch (e) {} }
    }
    return {
      avvia: function () {
        ctx = audioCtx(); if (!ctx || timer || ctx.state !== "running") return;   // (prima del primo tocco no: ripartirebbe tutto insieme)
        try {
          if (!master) {
            master = ctx.createGain(); var fl = ctx.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = 4800;
            var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 8;
            master.connect(fl); fl.connect(comp); comp.connect(ctx.destination);
          }
          master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0.0001, ctx.currentTime);
          master.gain.exponentialRampToValueAtTime(0.34, ctx.currentTime + 1.5);
          nextT = ctx.currentTime + 0.1; step = 0; loop(); timer = setInterval(loop, 100);
        } catch (e) { timer = null; }
      },
      ferma: ferma
    };
  })();
  // tornando nell'app la musichetta riparte (era ferma con lo schermo spento)
  document.addEventListener("visibilitychange", function () { if (!document.hidden) musicaSaletta(); });

  // ---- 🎲 NOMI BUFFI per chi entra senza profilo ("Tartaruga Veloce"): massimo 16 lettere, come i nomi ----
  var NOMI_BUFFI = {
    m: ["Panda", "Gufo", "Pinguino", "Koala", "Riccio", "Criceto", "Bradipo", "Canguro", "Delfino", "Polpo", "Leone", "Gatto", "Orso", "Lupo", "Tucano", "Pavone", "Procione", "Coniglio", "Granchio", "Cammello", "Fagiano", "Pellicano"],
    f: ["Tartaruga", "Giraffa", "Volpe", "Lontra", "Zebra", "Foca", "Papera", "Gallina", "Lumaca", "Formica", "Farfalla", "Balena", "Capra", "Mucca", "Rana", "Medusa", "Cicogna", "Pecora"],
    a: [["Veloce", "Veloce"], ["Ballerino", "Ballerina"], ["Distratto", "Distratta"], ["Elegante", "Elegante"], ["Coraggioso", "Coraggiosa"], ["Furbo", "Furba"], ["Felice", "Felice"],
        ["Spaziale", "Spaziale"], ["Volante", "Volante"], ["Saggio", "Saggia"], ["Goloso", "Golosa"], ["Ninja", "Ninja"], ["Atomico", "Atomica"], ["Magico", "Magica"], ["Allegro", "Allegra"],
        ["Timido", "Timida"], ["Fortunato", "Fortunata"], ["Gigante", "Gigante"], ["Turbo", "Turbo"], ["Stellare", "Stellare"], ["Canterino", "Canterina"], ["Elettrico", "Elettrica"],
        ["Rapido", "Rapida"], ["Tranquillo", "Tranquilla"], ["Misterioso", "Misteriosa"], ["Dormiglione", "Dormigliona"], ["Pasticcione", "Pasticciona"]]
  };
  function nomeBuffo(prima) {
    for (var i = 0; i < 40; i++) {
      var fem = Math.random() < 0.45, lista = fem ? NOMI_BUFFI.f : NOMI_BUFFI.m;
      var n = lista[Math.floor(Math.random() * lista.length)] + " " + NOMI_BUFFI.a[Math.floor(Math.random() * NOMI_BUFFI.a.length)][fem ? 1 : 0];
      if (n.length <= 16 && n !== prima) return n;
    }
    return "Panda Veloce";
  }
  // la casella del nome (giochi e Sala, senza profilo): accanto c'è il 🎲; se è vuota ci metto il nome dell'ultima volta.
  // anteprima: dove far vedere l'avatar che avrai con quel nome (l'avatar nasce dal nome: col 🎲 cambiano tutti e due)
  function dadoNome(input, anteprima) {
    if (!input || input._dado || !input.parentNode) return;
    input._dado = true;
    var box = el("div", { class: "sl-nome-campo" }), tAv = null;
    input.parentNode.insertBefore(box, input); box.appendChild(input);
    function avatar(salta) {
      clearTimeout(tAv); if (!anteprima || !window.SGOmino) return;
      var n = (input.value || "").trim().slice(0, 16);
      anteprima.innerHTML = SGOmino.svg(SGOmino.casuale(n || "Amico"));
      anteprima.classList.toggle("vuota", !n);
      if (salta) rianima(anteprima, "salta");
    }
    var b = el("button", { class: "sl-dado", type: "button", "aria-label": "Un nome buffo a caso", text: "🎲", onclick: function () {
      input.value = nomeBuffo(input.value);
      try { input.dispatchEvent(new Event("input", { bubbles: true })); } catch (e) {}
      rianima(b, "gira"); avatar(true);
    } });
    box.appendChild(b);
    if (!input.value) { var u = ""; try { u = localStorage.getItem("sg-nome-ospite") || ""; } catch (e) {} if (u) input.value = u; }
    if (anteprima) { input.addEventListener("input", function () { clearTimeout(tAv); tAv = setTimeout(function () { avatar(false); }, 300); }); avatar(false); }
  }
  // chi apre il link senza profilo: la schermata del nome del gioco diventa un benvenuto (il gioco e la stanza in alto,
  // l'avatar che avrà, "Come ti chiami?" e il 🎲). I giochi non cambiano: la riconosco dalla casella del nome
  function dadoNelleSchermate(s, g, codice) {
    if (!s || !s.querySelectorAll || profiloAttivo()) return;
    [].forEach.call(s.querySelectorAll("input.link-campo"), function (i) {
      if (!(/nome/i.test(i.getAttribute("placeholder") || "") && +(i.getAttribute("maxlength") || 99) <= 20) || i._dado) return;
      var anteprima = null;
      if (g && i.parentNode && !s.querySelector(".sl-benvenuto")) {
        if (s.classList.contains("senza-testa")) {   // (il titolo col nome del gioco l'aveva tolto t.schermata: qui serve)
          var testa = s.querySelector(".testa"), tit = testa && testa.lastElementChild;
          if (tit && !tit.querySelector("h1")) {
            s.classList.remove("senza-testa");
            testa.insertBefore(el("span", { text: g.icona || "🎲", style: "font-size:1.8rem" }), tit);
            tit.appendChild(el("h1", { text: g.nome })); if (codice) tit.appendChild(el("p", { class: "sotto", text: "Stanza " + String(codice).toUpperCase() }));
          }
        }
        anteprima = el("div", { class: "sl-anteprima", "aria-hidden": "true" });
        i.parentNode.insertBefore(el("div", { class: "sl-benvenuto" }, [
          el("b", { class: "sl-benv-tit", text: "Ti aspettano per giocare! 🎉" }), anteprima,
          el("span", { class: "sl-benv-sotto", text: "Come ti chiami? Tocca 🎲 per un nome buffo: cambia anche il tuo avatar." })
        ]), i);
      }
      dadoNome(i, anteprima);
    });
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
    var box = el("div", { class: "sg-dal-gioco" });   // (🤍 le regole del gioco: le sue emoji restano emoji)
    righe.forEach(function (r) {
      box.appendChild(el("p", { class: "", html: r, style: "font-size:1.05rem; line-height:1.5; margin:0 0 14px" }));
    });
    s._contenuto.appendChild(box);
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Ho capito", onclick: indietro }));
    mostra(s);
  }

  // ---- Passaggio del telefono (interstiziale tra un turno e l'altro) ----
  // esci (facoltativo): il tasto ‹ in alto per lasciare il gioco anche da qui (prima chiede "Uscire dalla partita?")
  function passaIlTelefono(nomeProssimo, quando, esci) {
    var s = schermata({ indietro: esci ? function () { chiediConferma("Uscire dalla partita?", "La partita in corso si perde.", "Esci", esci); } : null });
    if (esci) s.classList.add("senza-testa");   // (solo la freccia piccola nell'angolo: la schermata resta quella di prima)
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
  // le medaglie a pari merito: oro, oro, poi ARGENTO per il gruppo dopo (non bronzo). posti = [1, 1, 3, 4] → 🥇🥇🥈🥉
  // (dal quarto gruppo in giù si scrive il posto vero: "5°")
  var MEDAGLIE = ["🥇", "🥈", "🥉"];
  function medaglieAPari(posti) {
    var gruppi = 0, prec = null;
    return posti.map(function (p) {
      if (p !== prec) { gruppi++; prec = p; }
      return MEDAGLIE[gruppi - 1] || p + "°";
    });
  }
  // tanti giocatori (più di 6), o righe che non starebbero nello schermo coi tasti sotto (es. 6 su un 360x640):
  // righe basse su due colonne, così i tasti restano sempre a vista. extra = altro spazio sotto la classifica (le faccine)
  function classificaFitta(n, extra) { return n > 6 || n * 71 + 262 + (extra || 0) > (window.innerHeight || 640); }
  // tf (partita online): i tasti di fine uguali per tutti (tastiFineCore); se non li mette, quelli di sempre
  function schermataFine(g, classifica, giocatori, impostazioni, faccine, tf) {
    var s = schermata({ icona: "🏆", titolo: "Fine partita", sotto: g.nome });
    var ol = el("ol", { class: "classifica" + (classificaFitta(classifica.length, faccine ? 56 : 0) ? " fitta" : "") });
    var posti = classifica.map(function (r, i) { return r.pos || i + 1; });   // a pari merito il gioco dà la stessa posizione: stessa medaglia
    var medaglie = medaglieAPari(posti);
    classifica.forEach(function (r, i) {
      ol.appendChild(el("li", { class: posti[i] === 1 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: medaglie[i] }),
        el("span", { class: "nome", text: r.nome }),
        r.punti != null ? el("span", { class: "punti", text: typeof r.punti === "number" && r.punti % 1 === 0 ? cifre(r.punti) : r.punti }) : null
      ]));
    });
    s._contenuto.appendChild(ol);
    if (faccine) { faccine.classList.add("fine-faccine"); s._contenuto.appendChild(faccine); }   // partita online: le faccine anche qui
    if (tf && tf(s._piede)) return mostra(s);
    // sullo stesso telefono, più giochi di fila con lo stesso gruppo: "🏆 Classifica della serata: Paky 1° · Luca 2°" (tocco → la classifica)
    if (!faccine && torneo && torneo.auto && torneo._fine === classifica) {
      var clS = classificaTorneo();
      s._piede.appendChild(el("button", { class: "fine-serata", type: "button", onclick: schermataTorneoHub,
        text: "🏆 Classifica della serata: " + clS.slice(0, 3).map(function (r, i) { return r.nome + " " + (i + 1) + "°"; }).join(" · ") + " ›" }));
    }

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
      return { nome: r.nome, punti: Math.round(perc * peso), pos: k + 1 };
    });
  }

  // sullo stesso telefono, senza aprire la "Serata a punti": ogni partita con almeno due persone del gruppo somma i punti
  // da sola nella Classifica della serata (torneo.auto). Se il gruppo cambia, la classifica riparte con il gruppo nuovo.
  function serataLocale(g, classifica) {
    if (!classifica || !g) return;
    var nomi = nomiGruppo(), umani = classifica.filter(function (r) { return r && !r.bot && r.nome; });
    if (umani.length < 2 || nomi.length < 2) return;
    if (!umani.every(function (r) { return nomi.some(function (n) { return stessoNome(n, r.nome); }); })) return;   // (non è il gruppo di stasera)
    var stesso = torneo && torneo.giocatori.length === nomi.length && nomi.every(function (n) { return torneo.giocatori.indexOf(n) >= 0; });
    if (!stesso) {
      torneo = { giocatori: nomi, emoji: {}, punti: {}, storia: [], n: 0, auto: true };
      gruppo.forEach(function (p, i) { if (nomi[i]) torneo.emoji[nomi[i]] = p.emoji || "🙂"; });
      nomi.forEach(function (n) { torneo.punti[n] = 0; });
    }
    var ass = puntiDaClassifica(g, classifica).filter(function (r) { return torneo.giocatori.indexOf(r.nome) >= 0; });
    ass.forEach(function (r) { torneo.punti[r.nome] = (torneo.punti[r.nome] || 0) + r.punti; });
    torneo.n += 1; torneo.storia.push({ gioco: g.nome, assegnati: ass });
    torneo._fine = classifica;
  }

  function classificaTorneo() {
    return torneo.giocatori.map(function (n) { return { nome: n, punti: torneo.punti[n] || 0 }; })
      .sort(function (a, b) { return b.punti - a.punti; });
  }

  function podio(cl, evidenziaPrimo) {
    var ol = el("ol", { class: "classifica" + (classificaFitta(cl.length) ? " fitta" : "") });
    // a pari punti lo stesso posto e la stessa medaglia (prima della prima partita sono tutti a 0: i posti in fila)
    var posti = [], medaglie;
    cl.forEach(function (r, i) { posti.push(evidenziaPrimo && i && r.punti === cl[i - 1].punti ? posti[i - 1] : i + 1); });
    medaglie = medaglieAPari(posti);
    cl.forEach(function (r, i) {
      ol.appendChild(el("li", { class: (posti[i] === 1 && evidenziaPrimo) ? "vincitore" : "" }, [
        el("span", { class: "pos", text: medaglie[i] }),
        el("span", { class: "nome", text: (torneo && torneo.emoji[r.nome] ? torneo.emoji[r.nome] + " " : "") + r.nome }),
        el("span", { class: "punti", text: cifre(r.punti) })
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
    var s = schermata({ icona: "🏆", titolo: "Serata a punti", sotto: "Come giocate?", indietro: schermataHome });
    var griglia = el("div", { class: "modo-scelta" });
    [{ icona: "📱", nome: "Su questo telefono", sotto: "Vi passate il telefono: prima aggiungi chi gioca", via: function () { schermataSala(null, { torneo: true }); } },
     { icona: "🔗", nome: "Online", sotto: "La Sala con la Classifica della serata: ognuno dal suo telefono", online: true, via: function () { creaSala({ torneo: true }); } }
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
    var s = schermata({ icona: "🏆", titolo: "Classifica della serata", indietro: schermataHome,
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
    var griglia = el("div", { class: "griglia-giochi" }), n = torneo.giocatori.length, tolti = 0;
    // sullo stesso telefono: niente giochi solo online, e solo i giochi dove giocate TUTTI (in 3 niente giochi a due:
    // giocherebbero solo i primi due della lista e gli altri resterebbero senza punti)
    giochi.forEach(function (g) {
      if (g.soloOnline) return;
      if ((g.giocatoriMax || 10) < n || (g.giocatoriMin || 1) > n) { tolti++; return; }
      // (i giochi a due, postiOnline: 2: nel torneo si fa una partita sola, es. il Tris "chi vince resta" vale solo fuori dal torneo)
      if (g.postiOnline && g.postiOnline < n) { tolti++; return; }
      griglia.appendChild(tesseraGioco(g, function () { schermataPreGioco(g, { torneo: true }); }));
    });
    if (tolti) s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Qui trovi i giochi dove giocate tutti e " + n + " insieme." }));
    s._contenuto.appendChild(griglia);
    mostra(s);
  }

  function torneoRisultato(g, classifica) {
    var assegnati = puntiDaClassifica(g, classifica);
    assegnati.forEach(function (r) { torneo.punti[r.nome] = (torneo.punti[r.nome] || 0) + r.punti; });
    torneo.n += 1;
    torneo.storia.push({ gioco: g.nome, assegnati: assegnati });

    var s = schermata({ icona: g.icona, titolo: "Punti di questa partita", sotto: g.nome + " · " + nomeDifficolta(pesoGioco(g)) });
    var ol = el("ol", { class: "classifica" + (classificaFitta(assegnati.length) ? " fitta" : "") });
    var medaglie = medaglieAPari(assegnati.map(function (r) { return r.pos; }));   // a pari merito (r.pos uguale) la stessa medaglia
    assegnati.forEach(function (r, i) {
      ol.appendChild(el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: medaglie[i] }),
        el("span", { class: "nome", text: r.nome }),
        el("span", { class: "punti", text: "+" + cifre(r.punti) })
      ]));
    });
    s._contenuto.appendChild(ol);
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏆 Classifica della serata", onclick: schermataTorneoHub }));
    mostra(s);
  }

  function schermataTorneoFine() {
    var s = schermata({ icona: "🏆", titolo: "Fine della serata!", sotto: torneo.n + (torneo.n === 1 ? " partita" : " partite") });
    s._contenuto.appendChild(podio(classificaTorneo(), true));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Nuova serata (stessi giocatori)",
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
  // ---- XP a fine partita (livelli, Speed Coins e Prestigio: le regole sono in livelli.js) ----
  // Ogni partita finita dà XP a chi ha il profilo: 1 al secondo, +50% se vinci, +250 alla prima del giorno.
  // Il tempo parte dall'ultima volta che si è visti in saletta (o dalla partita prima): l'attesa non conta.
  // Online l'host manda "__esito" con la classifica: ogni telefono si dà i suoi XP da solo.
  var xpOrologio = { t0: Date.now(), ultimo: 0 }, reteXp = null, giocoXp = null;   // giocoXp: il gioco aperto (per le statistiche)
  function xpRiparti() { xpOrologio.t0 = Date.now(); }
  function oggiStr() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function cifre(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function stessoNome(a, b) { return String(a || "").trim().toLowerCase().slice(0, 16) === String(b || "").trim().toLowerCase().slice(0, 16); }
  // contro il computer certi giochi ti chiamano "Tu" (o "Io") invece che col nome del profilo
  function sonoIo(n) { var x = String(n || "").toLowerCase().replace(/[^a-zàèéìòù]/g, ""); return x === "tu" || x === "io"; }
  // classifica = [{ nome, pos? , punti? }] dal primo all'ultimo; soloSeCi = niente XP se il mio nome non c'è (es. chi guarda)
  // codice = la stanza online (online il mio nome può essere stato cambiato dall'host: "Luca 2")
  function premiaPartita(classifica, soloSeCi, codice) {
    var ora = Date.now();
    if (ora - xpOrologio.ultimo < 4000) return;   // la stessa partita detta due volte (risultato + fine)
    var sec = (ora - xpOrologio.t0) / 1000;
    xpOrologio.t0 = ora;   // la prossima partita parte da qui
    if (!(window.SGLivelli && window.SGNube && SGNube.aggiungiXp && SGNube.profilo())) return;   // solo coi profili
    var p = SGNube.profilo(), lista = (classifica || []).filter(Boolean), mio = null, nomeQui = codice ? nomeStanza(codice) : "";
    // (le righe dei bot, bot: true, non sono mai io: nemmeno se il bot si chiama come me)
    var persone = lista.filter(function (r) { return !r.bot; });
    // prima il nome che ho in questa stanza (se un altro senza profilo era già "Luca", io sono "Luca 2"), poi quello del profilo
    if (nomeQui) persone.forEach(function (r) { if (!mio && stessoNome(r.nome, nomeQui)) mio = r; });
    persone.forEach(function (r) { if (!mio && stessoNome(r.nome, p.nome)) mio = r; });
    if (!mio) persone.forEach(function (r) { if (!mio && sonoIo(r.nome)) mio = r; });
    if (soloSeCi && !mio) return;
    // pareggio: tutti primi (Tris e Drop 4 danno pos 1 a tutti e due) o tutti con gli stessi punti: non è una vittoria
    var primo = lista[0], pari = lista.length > 1 && lista.every(function (r) { return r.pos != null ? r.pos === 1 : (r.punti != null && primo && r.punti === primo.punti); });
    var vinto = !!mio && !pari && (mio.pos != null ? mio.pos === 1 : (mio === primo || (mio.punti != null && primo && mio.punti === primo.punti)));
    if (giocoXp && SGNube.contaPartita) SGNube.contaPartita(giocoXp, mio && !pari ? (vinto ? "vinta" : "persa") : null, sec, mio && typeof mio.punti === "number" ? mio.punti : null);   // le statistiche del gioco (📊 nel profilo; il pareggio conta solo come partita)
    var giorno = oggiStr(), prima = SGNube.progressione().xpGiorno !== giorno;
    var xp = SGLivelli.xpPartita({ secondi: sec, vinto: vinto, primaDelGiorno: prima });
    if (!xp) return;
    xpOrologio.ultimo = ora;
    var r = SGNube.aggiungiXp(xp, prima ? giorno : null);
    if (r && r.stato) try { avvisoXp(xp, r, vinto, prima); } catch (e) {}   // (un avviso che non riesce non blocca mai la fine partita)
  }
  // l'avviso in alto (lo stesso dei trofei): XP presi, livello salito con le monete, Prestigio
  function avvisoXp(xp, r, vinto, prima) {
    var s = r && r.stato, monete = 0, lv = 0, pr = 0;
    if (!s) return;
    (r.eventi || []).forEach(function (e) { if (!e) return; monete += e.monete || 0; if (e.tipo === "livello") lv = e.livello; if (e.tipo === "prestigio") pr = e.prestigio; });
    var su = "+" + cifre(xp) + " XP" + (vinto ? " · hai vinto" : "") + (prima ? " · prima del giorno" : "");
    if (pr) codaTrofei.push({ tipo: "xp", cls: "tl-platino", icona: "🌟", su: "PRESTIGIO " + pr + "!", nome: "Si riparte dal livello 1", sotto: "+" + cifre(monete) + " Speed Coins 🪙" });
    else if (lv) codaTrofei.push({ tipo: "xp", cls: "tl-oro", icona: "🆙", su: su, nome: "Livello " + lv + "!", sotto: "+" + cifre(monete) + " Speed Coins 🪙" });
    else codaTrofei.push({ tipo: "xp", cls: "tl-xp", icona: "⭐", su: su, nome: "Livello " + s.level, sotto: "Ancora " + cifre(SGLivelli.xpPerSalire(s.level) - s.xp) + " XP per il livello " + (s.level + 1) });
    prossimoAvviso();
  }
  // ---- "Giocato di recente" (Passo 3, p3-e): con chi ho giocato online, solo su questo telefono (js/compagnia.js) ----
  // Chi ha il profilo online manda il suo uid nel join della stanza del gioco; l'host dice a tutti chi ha il profilo
  // ({ t: "__chi", l: [[id, nome, uid], …]}, host compreso: gli uid non sono password e passano sul broker pubblico);
  // a fine partita (host in t.risultato, chi entra all'arrivo di "__esito") le persone vere della partita vanno nei recenti.
  function mioUidOnline() {
    var io = profiloAttivo(); if (!io || !io.cloud) return null;
    var u = null; try { u = window.SGNube && SGNube.utente && SGNube.utente(); } catch (e) {}
    return (u && u.uid) || io.id || null;
  }
  // host: la lista di chi ha il profilo, 2 s dopo gli arrivi (un solo invio per più arrivi); subito = prima di "__esito"
  function inviaChi(SV, subito) {
    if (!SV || !SV.host || !SV.h) return;
    if (!subito) { if (!SV.tChi) SV.tChi = setTimeout(function () { SV.tChi = null; inviaChi(SV, true); }, 2000); return; }
    clearTimeout(SV.tChi); SV.tChi = null;
    var l = [], mio = mioUidOnline();
    if (mio) l.push(["host", SV.nomi.__io || (profiloAttivo() || {}).nome || "", mio]);
    Object.keys(SV.dentro).forEach(function (id) { if (SV.uid[id] && SV.nomi[id]) l.push([id, SV.nomi[id], SV.uid[id]]); });
    try { SV.h.inviaVeloce({ t: "__chi", l: l }); } catch (e) {}
  }
  // chi entra: dalla lista dell'host, nome -> uid
  function chiDa(l) {
    var o = {};
    (Array.isArray(l) ? l : []).forEach(function (x) {
      if (Array.isArray(x) && typeof x[1] === "string" && x[1] && typeof x[2] === "string" && x[2]) o[x[1].slice(0, 16)] = x[2].slice(0, 64);
    });
    return o;
  }
  // le persone vere di questa partita (non i bot, non io: solo chi ha un nome nella stanza), una volta per partita
  var FINE_REC = null;   // la riga "👥 Avete giocato con" della fine partita sullo schermo: { box, P }
  function segnaRecentiDa(classifica, SV, P) {
    if (!SV || !P || !window.SGCompagnia || !SGCompagnia.segnaRecenti) return;
    var ora = Date.now();
    if (P.recOra && ora - P.recOra < 4000) return;   // (la stessa partita detta due volte)
    var nomi = SV.nomi || {}, ioId = SV.host ? "__io" : mioIdSV(SV), io = profiloAttivo();
    var mioNome = nomi[ioId] || nomeStanza(SV.codice) || (io && io.nome) || "";
    var righe = (classifica || []).filter(function (r) { return r && !r.bot && r.nome; });
    var mia = righe.filter(function (r) { return stessoNome(r.nome, mioNome) || sonoIo(r.nome); })[0];
    if (!SV.host && !mia) return;   // chi ha solo guardato non ha giocato con nessuno
    var persone = [];
    righe.forEach(function (r) {
      if (r === mia || stessoNome(r.nome, mioNome)) return;
      var id = null; Object.keys(nomi).forEach(function (k) { if (!id && k !== ioId && k !== "__io" && stessoNome(nomi[k], r.nome)) id = k; });
      if (!id && SV.host) return;   // (un nome che nella stanza non c'è: un bot)
      if (!id && !SV.host && !Object.keys(SV.chi).some(function (n) { return stessoNome(n, r.nome); })) return;
      var uid = null;
      if (SV.host) uid = (id && SV.uid[id]) || null;
      else Object.keys(SV.chi).forEach(function (n) { if (!uid && stessoNome(n, r.nome)) uid = SV.chi[n]; });
      if (!persone.some(function (p) { return stessoNome(p.nome, r.nome); })) persone.push({ nome: String(r.nome).slice(0, 24), uid: uid });
    });
    if (!persone.length) return;   // (solo bot)
    P.recOra = ora; P.recPersone = persone;
    SGCompagnia.segnaRecenti(persone, P.g && P.g.id);
    // la fine partita era già sullo schermo (la classifica è arrivata dopo): la riga si riempie adesso
    if (FINE_REC && FINE_REC.P === P && FINE_REC.box.isConnected) riempiRigaRec(FINE_REC.box, persone);
  }
  // a fine partita, sopra i tasti: "👥 Avete giocato con: Luca ➕" (solo col profilo online, solo se ci sta senza far scorrere)
  function riempiRigaRec(box, persone) {
    var n = 0; try { n = SGCompagnia.rigaFine(box, persone); } catch (e) {}
    box._pieno = !!n; box.hidden = true;
    if (n) misuraRigaRec(box, 0);
  }
  // prima che si veda (requestAnimationFrame): se con la riga la pagina, il centro o i tasti escono dallo schermo, la riga non c'è
  function misuraRigaRec(box, giri) {
    var fatto = false;
    function ora() {
      if (fatto) return; fatto = true;
      if (!box.isConnected) { if (giri < 120) misuraRigaRec(box, giri + 1); return; }
      provaRigaRec(box);
    }
    requestAnimationFrame(ora); setTimeout(ora, 100);   // (con la pagina nascosta requestAnimationFrame non arriva)
  }
  function provaRigaRec(box) {
    if (!box._pieno) return;
    box.hidden = false;
    if (troppoAlta(box)) box.hidden = true;
  }
  // in home: "Giocato di recente" c'è solo se non manda la barra delle categorie fuori dal primo schermo (con tante cose in
  // alto: compagnie, «Riapri», telefono piccolo); si decide prima che si veda
  function recInHome(rec, barra) {
    var fatto = false;
    function ora() {
      if (fatto) return; fatto = true;
      if (!rec.isConnected || !barra.isConnected) return;
      var H = window.innerHeight || document.documentElement.clientHeight;
      if (barra.getBoundingClientRect().top + 24 <= H) return;   // (le categorie si vedono: la riga resta)
      rec.hidden = true;
      if (barra.getBoundingClientRect().top + 24 > H) rec.hidden = false;   // (senza la riga non cambierebbe niente)
    }
    requestAnimationFrame(ora); setTimeout(ora, 100);
  }
  // (telefono girato, finestra più bassa: si rimisura)
  window.addEventListener("resize", function () { if (FINE_REC && FINE_REC.box.isConnected) provaRigaRec(FINE_REC.box); });
  function troppoAlta(nodo) {
    var H = window.innerHeight || document.documentElement.clientHeight;
    if (document.documentElement.scrollHeight > H + 1) return true;
    var b = nodo.parentNode && nodo.parentNode.getBoundingClientRect ? nodo.parentNode.getBoundingClientRect() : nodo.getBoundingClientRect();
    if (b.bottom > H + 1) return true;
    var s = nodo.closest(".schermata") || document.body, guarda = [s].concat([].slice.call(s.children));
    for (var x = nodo.parentNode; x && x !== s && guarda.indexOf(x) < 0; x = x.parentNode) guarda.push(x);
    return guarda.some(function (e) {
      if (!e || e.scrollHeight <= e.clientHeight + 1) return false;
      var ov = getComputedStyle(e).overflowY;
      return ov === "auto" || ov === "scroll";
    });
  }

  // =========================================================
  //  STRATO COMUNE DELLA RETE — avvolge SGNet.ospita e SGNet.entra per tutti i giochi,
  //  così i giochi non devono fare niente di nuovo:
  //  - host: ricorda la stanza aperta (se la pagina si ricarica la riapre con lo stesso codice), cambia i nomi
  //    doppi ("Luca" e "Luca 2"; chi ha il profilo tiene il suo), manda "__esito" per gli XP;
  //  - ospite: ricorda il nome usato nella stanza, dice all'host se ha il profilo (pr:1), prende gli XP;
  //    nella Sala, se il gioco chiude la sua stanza, torna alla Sala senza schermata d'errore;
  //    se l'host riapre la stanza (pagina ricaricata) il gioco riparte pulito e rientra da solo nella saletta.
  //  I messaggi del core ("__…") non arrivano mai ai giochi.
  // =========================================================
  var reteOsp = null;     // la stanza di un gioco in cui sono entrato da ospite: { h, codice, P, guarda, sala }
  var NOMI_SEME = null;   // stanza riaperta: i nomi già dati (id -> nome), così ognuno ritrova il suo
  var PORTA_SEME = false; // stanza riaperta con la porta chiusa
  var RIPRESA_SEME = null; // (Passo 5, host di riserva) la partita che questo telefono prende in mano: la usa la prossima avviaPartita
  // la ripresa da salvare subito quando l'app va in secondo piano o la pagina se ne va (quella della partita aperta)
  var ripresaSubito = null;
  function salvaRipresaSubito() { if (ripresaSubito) try { ripresaSubito(); } catch (e) {} }
  document.addEventListener("visibilitychange", function () { if (document.hidden) salvaRipresaSubito(); });
  window.addEventListener("pagehide", salvaRipresaSubito);
  document.addEventListener("freeze", salvaRipresaSubito);
  var PORTA_SALA_SEME = false;   // (lo stesso per la Sala)
  // giochi col loro host di riserva fatto in casa: quando cambia l'host non si riavviano. Dal Passo 5 è vuoto: Parola
  // d'ordine usa l'host di riserva del core (riprende + riserva in SG.registra); resta per un gioco con hostDiRiserva: true
  var HOST_DI_RISERVA = {};
  function hostDiRiserva(g) { return !!(g && (g.hostDiRiserva || HOST_DI_RISERVA[g.id])); }
  function delCore(m) { return !!(m && typeof m.t === "string" && m.t.slice(0, 2) === "__"); }
  // a che punto è la partita, da una foto che l'host manda a tutti: "lobby" (saletta), "fine" (classifica), "gioco" (il resto).
  // null = questa foto non lo dice (messaggio per uno solo, del core, o senza fase)
  function faseDaFoto(m) {
    if (!m || typeof m.t !== "string" || delCore(m) || m.to != null) return null;
    var v = m.vm && typeof m.vm.fase === "string" ? m.vm.fase : null;
    if (v) return v === "lobby" ? "lobby" : (v === "fine" ? "fine" : "gioco");
    if (m.t === "lobby") return "lobby";   // (i giochi che mandano la saletta a parte: Scopa, Pendolo, Horto…)
    if (m.t === "fine") return "fine";
    if (m.t === "via" || m.t === "inCorso") return "gioco";
    return null;
  }
  function impSalvabili(imp) { try { return JSON.parse(JSON.stringify(imp || {})); } catch (e) { return {}; } }
  // due con lo stesso nome nella stessa stanza: il secondo diventa "Luca 2". Lo stesso telefono tiene il nome che ha avuto;
  // due profili con lo stesso nome sono la stessa persona (niente numero). true = nome nuovo da ricordare
  function nomeUnico(nomi, conPr, id, m) {
    var n = String(m.nome || "").trim().slice(0, 16);
    if (!n) return false;
    if (nomi[id]) { m.nome = nomi[id]; return false; }
    function preso(x) { for (var k in nomi) if (k !== id && stessoNome(nomi[k], x)) return k; return null; }
    var k = preso(n);
    if (k && !(m.pr && conPr[k])) {
      var base = n.slice(0, 13), i = 2;
      while (preso(base + " " + i) && i < 99) i++;
      n = base + " " + i; m.nome = n;
    }
    nomi[id] = n; if (m.pr) conPr[id] = 1;
    return true;
  }
  // =========================================================
  //  L'HOST DI RISERVA (Passo 5, p5-b): nei giochi con riprende e riserva, se l'host sparisce del tutto (telefono
  //  spento, batteria) un amico porta avanti la partita da dove era. Fuori dai tornei (eliminazione e serata a punti
  //  sullo stesso telefono). Le regole, uguali su tutti i telefoni:
  //  - l'host scrive in ogni foto _g (il numero del cambio di host: 1, 2, 3…) e _h (l'id di chi tiene la partita);
  //    vince sempre il _g più alto, a pari _g l'id più piccolo (vinceSu). Gli ospiti scartano le foto "perdenti";
  //  - l'host manda una copia della partita (__ris, al massimo una al secondo, al massimo 60 KB, mai soloQui) ai due
  //    vice: i primi due amici arrivati e presenti (o quelli scelti dal gioco con t.vici);
  //  - quando l'host sparisce (testamento), il vice n° k aspetta 6 s × (k + 1) (60 s se l'host era appena uscito
  //    dall'app: pausa) e poi apre la stanza con lo stesso codice da host, con la copia (t.ripresa.daRiserva);
  //  - prima guardo, poi parlo (net.js): chi riapre o subentra legge la foto trattenuta e, se la tiene già un altro
  //    che vince, non pubblica niente e rientra da giocatore (cediPosto). Anche chi tiene la partita, se vede una foto
  //    che vince (onStato), cede il posto.
  // =========================================================
  var SUBENTRO_MS = 6000, SUBENTRO_PAUSA = 60000, RIS_MAX = 60000, RIS_OGNI = 1000;
  var RIS_HOST = null;   // la partita che tengo io con la riserva accesa (per la pausa: app in secondo piano)
  function riservaPer(P) {
    return !!(P && P.g && P.g.riprende && P.g.riserva && !(P.salaCtx && P.salaCtx.tabellone) && !(P.opts && P.opts.torneo));
  }
  // (g1, h1) vince su (g2, h2)? _g più alto; a pari _g l'id più piccolo
  function vinceSu(g1, h1, g2, h2) {
    g1 = +g1 || 0; g2 = +g2 || 0;
    if (g1 !== g2) return g1 > g2;
    return !!h1 && h1 !== h2 && (!h2 || String(h1) < String(h2));
  }
  // (solo per le prove: window.__sgSubentroMs = lo stesso tempo per tutti i vice)
  function attesaVice(k, pausa) {
    if (typeof window.__sgSubentroMs === "number") return window.__sgSubentroMs;
    return pausa ? SUBENTRO_PAUSA + SUBENTRO_MS * k : SUBENTRO_MS * (k + 1);
  }

  // ---- HOST ----
  // i nomi della stanza per la copia: id -> nome, col mio id (niente "__io")
  function nomiRiserva(RS) {
    var SV = RS.h && RS.h._sv, n = {};
    Object.keys((SV && SV.nomi) || {}).forEach(function (k) { if (k !== "__io") n[k] = SV.nomi[k]; });
    n[RS.hid] = RS.nome;
    return n;
  }
  // i vice: i primi due presenti (dentro, non 📶, non fatti uscire), prima quelli scelti dal gioco, poi in ordine d'arrivo
  function viciDi(RS) {
    var SV = RS.h && RS.h._sv; if (!SV) return [];
    function ok(id) { return !!id && id !== RS.hid && SV.dentro[id] && !SV.forse[id] && !SV.fuori[id] && !SV.andati[id] && RS.arrivi.indexOf(id) >= 0; }
    var l = [];
    (RS.P.viciScelti || []).concat(RS.arrivi).forEach(function (id) { if (l.length < 2 && ok(id) && l.indexOf(id) < 0) l.push(id); });
    return l;
  }
  // la copia della partita ai vice (stato = quello di t.ricorda; null = niente da portare avanti)
  function copiaRiserva(RS, stato) {
    if (RS.ceduto) return;
    if (stato == null) {
      RS.ult = null; clearTimeout(RS.tCopia); RS.tCopia = null; RS.faseCopia = null;
      if (RS.mandata && RS.h && !RS.h._chiusa) { RS.mandata = false; try { RS.h.inviaVeloce({ t: "__ris", g: RS.gen, vici: RS.vici, s: null }); } catch (e) {} }
      return;
    }
    RS.ult = stato;
    if ((stato && stato.fase) !== RS.faseCopia) return mandaCopia(RS);   // cambia la fase: subito
    if (RS.tCopia) return;
    RS.tCopia = setTimeout(function () { mandaCopia(RS); }, Math.max(0, RIS_OGNI - (Date.now() - RS.quando)));
  }
  function mandaCopia(RS) {
    clearTimeout(RS.tCopia); RS.tCopia = null;
    var h = RS.h;
    if (RS.ceduto || !h || h._chiusa || !RS.ult || !RS.P.viva()) return;
    RS.vici = viciDi(RS); RS.quando = Date.now();
    if (!RS.vici.length) return;
    var tx; try { tx = JSON.stringify(RS.ult); } catch (e) { return; }
    if (tx.length > RIS_MAX) {   // troppo grande: il gioco deve mettere i pezzi grossi in soloQui
      if (!RS.avvisato) { RS.avvisato = true; console.warn("Host di riserva: la copia di " + RS.P.g.id + " è troppo grande (" + tx.length + " caratteri): non la mando ai vice"); }
      return;
    }
    RS.faseCopia = RS.ult.fase; RS.mandata = true;
    try {
      h.inviaVeloce({ t: "__ris", g: RS.gen, ora: Date.now(), io: RS.hid, vici: RS.vici, n: nomiRiserva(RS),
        imp: impSalvabili(RS.P.tavolo ? RS.P.tavolo.impostazioni : RS.P.impostazioni), s: JSON.parse(tx) });
    } catch (e) {}
  }
  // i vice sono cambiati (uno è arrivato, uno se n'è andato): la copia subito ai nuovi
  function controllaVici(RS) {
    if (!RS.h) return;
    if (RS.ceduto || RS.h._chiusa || !RS.P.viva()) return fermaRiserva(RS);
    var v = viciDi(RS);
    if (v.join("|") !== (RS.vici || []).join("|") && RS.ult) mandaCopia(RS);
    else if (!RS.ult) RS.vici = v;
  }
  function fermaRiserva(RS) {
    clearTimeout(RS.tCopia); RS.tCopia = null; clearInterval(RS.tVici); RS.tVici = null;
    if (RIS_HOST === RS) RIS_HOST = null;
  }
  // le foto della mia stanza (anche le mie: ascoltaStato): una che vince → cedo il posto; una che perde (il vecchio host
  // tornato senza accorgersi, o l'altro vice partito insieme a me) → rimetto la mia ultima foto
  function statoRiserva(RS, s) {
    if (RS.ceduto || !s || typeof s !== "object" || s.t === "__hostgone" || s._g == null || !RS.h || RS.h._chiusa) return;
    if (s._s && s._s === RS.h.sessione) return;   // (la mia)
    if (vinceSu(s._g, s._h, RS.gen, RS.hid)) return cediPosto(RS, s);
    if (s._h !== RS.hid && RS.ultFoto && Date.now() - (RS.rimessa || 0) > 1000) { RS.rimessa = Date.now(); try { RS.h.invia(RS.ultFoto); } catch (e) {} }
  }
  // la stanza la tiene già un altro (guardaPrima o guardaRitorno: la foto trattenuta di un'altra sessione).
  // true = parlo io (copro la sua foto); false = non pubblico niente e cedo il posto
  function occupataRiserva(RS, m) {
    if (RS.ceduto) return false;
    if (!m || m._g == null) return true;   // (non è una partita con la riserva: la copro)
    var cedo = vinceSu(m._g, m._h, RS.gen, RS.hid);
    // (sto prendendo il posto dell'host sparito: se intanto la stanza è tornata viva con la partita che ho copiato,
    // tenuta da lui che ha riaperto o da un altro, non la prendo)
    if (!cedo && RS.P.ripresa && RS.P.ripresa.daRiserva && +m._g >= RS.gen - 1 && m._h !== RS.hid) cedo = true;
    if (!cedo) return true;
    setTimeout(function () { cediPosto(RS, m); }, 0);
    return false;
  }
  // cedo il posto: esco dalla stanza in silenzio (senza testamento e senza toccare la sua foto) e rientro da giocatore,
  // con lo stesso id di prima (l'host ritrova il suo posto). Dentro una Sala resto nel gioco con un ctx da amico
  function cediPosto(RS, s) {
    if (RS.ceduto) return;
    RS.ceduto = true; fermaRiserva(RS);
    var P = RS.P, h = RS.h, C = h.codice;
    var nome = (s && s._hn) || (h._sv && h._sv.nomi && s && h._sv.nomi[s._h]) || "un amico";
    try { h.lascia(); } catch (e) {}
    SGNet.ricordaId(C, RS.hid); scordaRipresa(C); dimenticaMiaStanza(C);
    if (!P.viva()) return;
    pillola("riapro", null); pillola("ripresa", null);
    pillola("riserva", P.ripresa && P.ripresa.daRiserva ? "👑 Ora la partita la tiene " + nome
      : "👋 Bentornato! Ora la partita la tiene " + nome + ": rientri come giocatore", "blu", 4000);
    var ctx = ctxDopoCeduto(P, C);
    lasciaPartita();
    linkParams = { gioco: P.g.id, stanza: C };
    avviaPartita(P.g, [], {}, null, ctx);
  }
  // il ctx di chi cede il posto dentro una Sala: un amico della Sala tiene il suo (esce senza chiudere niente);
  // l'host della Sala ne ha uno da amico: esce dal gioco senza chiuderlo agli altri, la Sala segue la fase e conta i punti
  function ctxDopoCeduto(P, code) {
    var ctx0 = P.salaCtx;
    if (!ctx0 || !sala || sala.ctx !== ctx0) return ctx0 || null;
    return ctxGiocoAmico(code);
  }
  // (anche per "Rientra ▶" dalla Sala: il gioco lo tiene un amico, io ci gioco da amico)
  function ctxGiocoAmico(code) {
    var contati = {};
    function mia() { return sala && sala.stanza === code; }
    function conta(g2, cl) {
      if (!mia() || sala.duello || !g2 || !cl || !cl.length) return;
      var k = JSON.stringify(cl.map(function (r) { return [r.nome, r.pos]; }));
      if (contati[k]) return;
      contati[k] = 1; salaRisultato(g2, cl);
    }
    var ctx = {
      stanza: code,
      esci: function () {
        lasciaPartita(); SGNet.chiudiGiochi();
        if (!sala) return schermataHome();
        if (sala.ctx === ctx) sala.ctx = null;
        sala.inGioco = false;
        if (mia()) { sala.fuori = sala.fuori || {}; sala.fuori.host = code; sala._bcast(); }   // (gli altri continuano)
        disegnaSalaHost();
      },
      cambia: function () { salaCambiaGioco(); },
      risultato: function (g2, cl) { conta(g2, cl); },
      // la classifica che manda chi tiene la partita (__esito): la Sala la conta una volta
      esito: function (g2, cl) { conta(g2, cl); },
      // a che punto è la partita (dalle foto di chi la tiene): la Sala lo dice a tutti
      fase: function (f) { if (mia() && sala.fase !== f) { sala.fase = f; if (sala._bcast) sala._bcast(); } },
      fine: function (g2, cl) {
        conta(g2, cl);
        var P2 = partitaCorrente && partitaCorrente.viva() && partitaCorrente.salaCtx === ctx ? partitaCorrente : null;
        if (!P2 || !g2 || !cl || !cl.length) return ctx.esci();
        fineSalaAmico(g2, cl, P2, ctx, false, function () { ctx.esci(); });
      },
      chiusa: function () { ctx.esci(); pillola("sala", "🏁 Partita finita: si torna in Sala", "verde", 2600); }
    };
    sala.ctx = ctx; sala.inGioco = true;
    return ctx;
  }
  // l'host di riserva sulla stanza appena aperta (dal wrapper di SGNet.ospita): opzioni di rete e cb
  function preparaRiserva(P, cb, opz) {
    var t = P.tavolo, pr = profiloAttivo();
    var RS = { P: P, gen: (P.ripresa && P.ripresa.gen) || 1, hid: (t && t.mioId) || "host", h: null, arrivi: [], vici: [],
      nome: (P.giocatori && P.giocatori[0]) || (pr && pr.nome) || "", ult: null, ultFoto: null, tCopia: null, quando: 0,
      faseCopia: null, mandata: false, ceduto: false, pausa: 0, tVici: null };
    opz = Object.assign({}, opz || {});
    opz.ascoltaStato = true;
    opz.testamento = Object.assign({}, opz.testamento || {}, { g: RS.gen });
    if (!opz.guardaRitorno) opz.guardaRitorno = 1200;
    // riapro dopo una ricarica, o prendo il posto dell'host sparito: prima guardo chi tiene la stanza
    if (P.ripresa) { if (!opz.guardaPrima) opz.guardaPrima = 1500; if (P.ripSopra && !opz.sopra) opz.sopra = P.ripSopra; }
    var onStatoG = cb.onStato, onOccG = cb.onOccupata;
    cb.onStato = function (s) { statoRiserva(RS, s); if (onStatoG && !RS.ceduto) return onStatoG.apply(this, arguments); };
    cb.onOccupata = function (m) { var si = occupataRiserva(RS, m); if (si && onOccG) return onOccG.apply(this, arguments); return si; };
    // riapro (ripresa) o mi ricollego dopo un buco e la stanza è vuota davvero (nemmeno il mio testamento): chi la teneva
    // dopo di me l'ha chiusa apposta, la partita è finita senza di me. Non la riapro da solo: torno in home
    // (solo se avevo già mandato una foto: prima della prima foto la stanza vuota l'ho pulita io)
    cb.onVuota = function () {
      if (P.salaCtx || RS.ceduto || !(P.ripresa || RS.ultFoto)) return true;
      RS.ceduto = true; fermaRiserva(RS);
      setTimeout(function () {
        var h = RS.h, C = h && h.codice;
        try { if (h) h.lascia(); } catch (e) {}
        if (C) { scordaRipresa(C); dimenticaMiaStanza(C); }
        if (!P.viva()) return;
        pillola("riapro", null); pillola("ripresa", null);
        lasciaPartita(); tornaHome();
        pillola("riserva", "🏁 La partita è finita mentre eri via", "blu", 4500);
      }, 0);
      return false;
    };
    return { RS: RS, opz: opz };
  }
  // le foto e i messaggi della stanza dicono chi tiene la partita (_g, _h, _hn; _p = l'host è uscito un attimo dall'app)
  function decoraRiserva(RS, h) {
    function dec(msg) {
      if (!msg || typeof msg !== "object" || Array.isArray(msg) || delCore(msg)) return msg;
      var o = Object.assign({}, msg); o._g = RS.gen; o._h = RS.hid; if (RS.nome) o._hn = RS.nome; if (RS.pausa) o._p = 1;
      return o;
    }
    var iv = h.invia, vv = h.inviaVeloce, ia = h.inviaA;
    h.invia = function (msg) { if (msg && typeof msg === "object" && !delCore(msg)) RS.ultFoto = msg; return iv.call(h, dec(msg)); };
    if (vv) h.inviaVeloce = function (msg) { return vv.call(h, dec(msg)); };
    if (ia) h.inviaA = function (id, msg) { return ia.call(h, id, dec(msg)); };
  }
  // l'host esce un attimo dall'app (WhatsApp per mandare il link): i vice aspettano 60 s invece di 6 se poi sparisce
  document.addEventListener("visibilitychange", function () {
    var RS = RIS_HOST;
    if (!RS || RS.ceduto || !RS.h || RS.h._chiusa || !RS.P.viva()) return;
    var p = document.hidden ? 1 : 0;
    if (!!RS.pausa === !!p) return;
    RS.pausa = p ? Date.now() : 0;
    try { RS.h.inviaVeloce({ t: "__rp", p: p }); } catch (e) {}
  });

  // ---- OSPITE ----
  // la copia della partita per i vice
  function prendiCopia(R, m) {
    var RR = R.ris, io = R.h && R.h.mioId;
    if (!RR || !m || !Array.isArray(m.vici) || +m.g < RR.gen) return;
    if (m.vici.indexOf(io) < 0 || m.s == null) { RR.copia = null; return; }   // (non sono più vice, o niente da portare avanti)
    RR.copia = { g: +m.g || 0, ora: +m.ora || Date.now(), arrivo: Date.now(), io: m.io, vici: m.vici.slice(), n: m.n && typeof m.n === "object" ? m.n : {},
      imp: m.imp && typeof m.imp === "object" ? m.imp : {}, s: m.s };
  }
  // una foto con _g: false = è di chi ha perso (il gioco non la vede). Se tiene la partita un altro (_g più alto, o a pari
  // _g l'id più piccolo) seguo lui (seguiHost: anche se ha l'orologio indietro) e lo dico: "👑 Ora la partita la tiene Luca"
  function fotoRiserva(R, m) {
    var RR = R.ris, g = +m._g || 0;
    if (m._p) { if (!RR.pausaVista) RR.pausaVista = Date.now(); } else if (m._s) RR.pausaVista = 0;
    if (RR.gen && (g < RR.gen || (g === RR.gen && m._h !== RR.hid && !vinceSu(g, m._h, RR.gen, RR.hid)))) return false;
    if (g === RR.gen && m._h === RR.hid) {   // lo stesso di prima (anche tornato dopo una ricarica)
      if (m._s) RR.sess = m._s;
      if (RR.hq) { var f = RR.hq; RR.hq = null; f(); }
      return true;
    }
    var primo = !RR.gen, prima = RR.hid;
    RR.gen = g; RR.hid = m._h || null; if (m._hn) RR.nome = m._hn;
    clearTimeout(RR.tVice); RR.tVice = null;
    var st = R.h && R.h.stato ? R.h.stato() : null;
    if (m._s) { RR.sess = m._s; if (!primo && st && !st.chiusa && st.sessione !== m._s) try { R.h.seguiHost(m._s); } catch (e) {} }
    if (RR.hq) { clearTimeout(RR.hqT); RR.hq = null; }
    if (!primo && prima !== RR.hid && R.P && R.P.viva()) {
      pillola("tornato", null); pillola("host", null);
      pillola("riserva", "👑 Ora la partita la tiene " + (m._hn || (R.h._sv && R.h._sv.nomi && R.h._sv.nomi[m._h]) || "un amico"), "blu", 4000);
    }
    return true;
  }
  // l'host è sparito (via) o tornato: il vice aspetta il suo turno e poi prende il posto
  function viceVia(R, via) {
    var RR = R.ris; if (!RR) return;
    clearTimeout(RR.tVice); RR.tVice = null;
    if (!via) return;
    var c = RR.copia, io = R.h && R.h.mioId;
    if (!c || !c.s || c.g !== RR.gen || !R.P || !R.P.viva()) return;
    var k = c.vici.indexOf(io); if (k < 0) return;
    var pausa = (!!RR.pausaVista && Date.now() - RR.pausaVista < VICE_PAUSA) ||
      (RR.hid === "host" && R.P.salaCtx && salaG && !!salaG.pausaVista && Date.now() - salaG.pausaVista < VICE_PAUSA);   // (l'host della Sala è uscito un attimo)
    RR.tVice = setTimeout(function () { RR.tVice = null; subentraGioco(R); }, attesaVice(k, pausa));
  }
  // prendo il posto dell'host sparito: lascio la stanza da ospite e la riapro da host con lo stesso codice e la copia
  // (il gioco parte da host con t.ripresa.daRiserva: nessun codice nuovo nei giochi)
  function subentraGioco(R) {
    var RR = R.ris, P = R.P, c = RR && RR.copia;
    if (!RR || RR.fatto || !P || !P.viva() || !R.h || !c || !c.s || c.g !== RR.gen) return;
    var st = R.h.stato ? R.h.stato() : null; if (!st || st.chiusa) return;
    RR.fatto = true;
    var io = R.h.mioId, n = c.n || {};
    var mioNome = n[io] || nomeStanza(R.codice) || ((profiloAttivo() || {}).nome) || "Io";
    var vecchio = n[c.io] || RR.nome || "L'host";
    var seme = {}; Object.keys(n).forEach(function (k) { if (k !== "__io" && k !== io) seme[k] = n[k]; });
    try { R.h.lascia(); } catch (e) {}
    RIPRESA_SEME = { stato: c.s, io: io, gen: c.g + 1, daRiserva: true, vecchioHost: c.io, t: c.arrivo, scarto: c.arrivo - c.ora, sopra: st.sessione || null };
    NOMI_SEME = seme; SGNet._forza = R.codice; linkParams = {};
    pillola("host", null); pillola("tornato", null);
    pillola("riserva", "👑 " + vecchio + " è sparito: la partita la porti avanti tu", "blu", 4000);
    avviaPartita(P.g, [mioNome], Object.assign({}, c.imp || {}, { modo: "online" }), { modo: "online" }, P.salaCtx);
  }

  function agganciaRete() {
    if (!window.SGNet || SGNet.__strato) return;
    SGNet.__strato = true;
    var ospita = SGNet.ospita, entra = SGNet.entra;
    SGNet.ospita = function (giocoId, cb, opz) {
      cb = cb || {};
      var sala = giocoId === "__sala", P = partitaCorrente && partitaCorrente.viva() ? partitaCorrente : null;
      // i nomi già dati e il codice imposto valgono per la stanza a cui erano destinati: la Sala riaperta,
      // oppure la partita appena avviata (stanza riaperta dopo una ricarica, gioco lanciato dalla Sala)
      var seme = sala ? NOMI_SEME : (P && P.nomiSeme), portaSeme = sala ? PORTA_SALA_SEME : !!(P && P.portaSeme);
      if (sala) { NOMI_SEME = null; PORTA_SALA_SEME = false; } else if (P) { P.nomiSeme = null; P.portaSeme = null; }
      if (!sala && P && P.forza) { if (!(opz && opz.codice)) opz = Object.assign({}, opz || {}, { codice: P.forza }); P.forza = null; }
      // l'host di riserva (Passo 5): solo i giochi con riprende e riserva, fuori dai tornei
      var RIS = !sala && P && P.g.id === giocoId && riservaPer(P) ? preparaRiserva(P, cb, opz) : null;
      if (RIS) opz = RIS.opz;
      var nomi = seme || {}, conPr = {}, salva = null;
      var io = profiloAttivo(); if (io && io.nome) { nomi.__io = String(io.nome).trim().slice(0, 16); conPr.__io = 1; }   // il nome dell'host è suo
      // la saletta viva di questa stanza: chi è dentro, chi è pronto, chi si ricollega, chi è stato fatto uscire, la porta
      var SV = nuovoSV(true, "", sala); SV.nomi = nomi; SV.porta = portaSeme;
      if (!sala && cb.onGuarda) SV.onGuardo = function (id, n) { cb.onGuarda(id, n); };   // (chi guarda soltanto: vedi svGuardo)
      Object.keys(nomi).forEach(function (k) { if (k !== "__io") SV.dentro[k] = 1; });   // stanza riaperta: chi c'era rientra anche con la porta chiusa
      var onMsg = cb.onMsg, onAddio = cb.onAddio;
      SV.addio = function (id) { if (onAddio) onAddio.call(cb, id); };
      cb.onAddio = function (id) { svAddio(SV, id); };   // (una volta sola per ognuno: uscito, sparito o fatto uscire)
      cb.onMsg = function (id, m) {
        if (m && m.t === "__guardo") { svGuardo(SV, id, m); return; }   // chi guarda soltanto (il gioco non lo vede)
        if (m && m.t === "join") {
          if (svRifiuta(SV, id)) return;   // fatto uscire, o nuovo con la porta chiusa: il gioco non lo vede
          if (nomeUnico(nomi, conPr, id, m) && salva) salva();
          var nuovo = !SV.dentro[id];
          SV.dentro[id] = 1; delete SV.andati[id];
          if (SV.pubblico[id]) { delete SV.pubblico[id]; fermaPubblico(SV); }   // guardava e adesso gioca
          if (RIS) { if (RIS.RS.arrivi.indexOf(id) < 0) RIS.RS.arrivi.push(id); controllaVici(RIS.RS); }   // (i vice: in ordine d'arrivo)
          svRiassunto(SV);   // (chi entra riceve subito chi è pronto e chi si ricollega)
          if (nuovo && SV.onDentro) SV.onDentro();
          // "Giocato di recente": l'uid di chi ha il profilo online (i join si ripetono: __chi solo se cambia qualcosa)
          if (!sala) { var uJ = typeof m.uid === "string" && m.uid ? m.uid.slice(0, 64) : null; if (nuovo || SV.uid[id] !== uJ) { SV.uid[id] = uJ; inviaChi(SV); } }
        }
        else if (SV.fuori[id]) return;   // chi è stato fatto uscire non conta più
        else if (m && (m.t === "__pronto" || m.t === "__faccina" || m.t === "__cisto")) svDaOspite(SV, id, m);
        if (delCore(m)) return;
        return onMsg ? onMsg.apply(this, arguments) : undefined;
      };
      var h = ospita.call(SGNet, giocoId, cb, opz);
      if (!h) return h;
      if (RIS) {   // (per prima: ogni foto e messaggio del gioco dice chi tiene la partita)
        var RS = RIS.RS; RS.h = h; P.riserva = RS; RIS_HOST = RS; decoraRiserva(RS, h);
        RS.tVici = setInterval(function () { controllaVici(RS); }, 2000);
      }
      SV.h = h; SV.codice = h.codice; h._sv = SV; h._P = sala ? null : P; SVH[SV.codice] = SV;
      var chiudiSV = h.chiudi, lasciaSV = h.lascia;
      // (stanza di un gioco chiusa o lasciata apposta: la sua partita non si riprende più)
      function viaSV() { clearTimeout(SV.tSl); clearTimeout(SV.tChi); clearInterval(SV.tPub); SV.tPub = null; if (SVH[SV.codice] === SV) delete SVH[SV.codice]; if (!sala) { h._chiusa = true; scordaRipresa(SV.codice); } }
      h.chiudi = function () { viaSV(); return chiudiSV.apply(h, arguments); };
      h.lascia = function () { viaSV(); return lasciaSV.apply(h, arguments); };
      if (!sala) reteXp = h;
      // la partita riprende da dove era (il gioco ha aperto con { ripresa: true }, vedi t.ripresa): gli amici non tornano
      // in saletta (net.js lo dice a tutti con r: 1 / _r: 1)
      // (il vice che prende il posto dell'host legge già «👑 … la porti avanti tu»)
      if (!sala && opz && opz.ripresa && !(P && P.ripresa && P.ripresa.daRiserva)) { pillola("riapro", null); pillola("ripresa", "🔁 Partita ripresa! Si continua da dove eravate", "verde", 3500); }
      // t.ricorda chiamato prima che la stanza ci fosse: si salva adesso che c'è il codice
      if (!sala && P && P.ripAperta) P.ripAperta();
      // la fase della partita di ogni stanza di gioco aperta da qui ("lobby" / "gioco" / "fine"), letta dalle foto che
      // l'host manda a tutti: SV.fase. Chi vuole saperlo quando cambia si mette in SV.suFase (SV.onFase la dice a tutti):
      // la stanza che si ricorda (qui sotto), la Sala (gioco in corso o saletta), poi il salvataggio e "__fase"
      if (!sala) {
        SV.fase = ""; SV.suFase = [];
        SV.onFase = function (f) { SV.suFase.forEach(function (fn) { try { fn(f); } catch (e) { setTimeout(function () { throw e; }, 0); } }); };
        // (Passo 6) a tutti, subito, quando cambia: "__fase" (chi guarda soltanto torna giocatore quando si torna in saletta)
        SV.suFase.push(function (f) { try { h.inviaVeloce({ t: "__fase", f: f }); } catch (e) {} svRiassunto(SV); });
        var inviaF = h.invia;
        h.invia = function (msg) {
          var f = faseDaFoto(msg);
          if (f && f !== SV.fase) {
            // dalla saletta si comincia a giocare: i "Ci sto" della partita prima non valgono più
            if (f !== "lobby" && (SV.fase === "lobby" || !SV.fase)) SV.cisto = {};
            SV.fase = f; SV.onFase(f);
          }
          return inviaF.apply(h, arguments);
        };
        // il gioco della mia Sala: la Sala dice a tutti a che punto è (chi arriva a partita in corso resta nella Sala)
        var SA = salaDiQui();
        if (SA && P && P.salaCtx && P.salaCtx === SA.ctx && SA.stanza === h.codice) salaSegueGioco(SA, SV);
        // il duello che ho aperto io (amico della Sala): la Sala deve sapere a che punto è
        else if (P && P.salaCtx && P.salaCtx.suStanza && P.salaCtx.duello === h.codice) P.salaCtx.suStanza(SV);
      }
      // la stanza che ho aperto io (non dalla Sala, non la partita col bot trasmessa a chi guarda):
      // la ricordo (gioco, codice, regole, nomi, fase) finché non la chiudo apposta
      if (!sala && P && !P.salaCtx && P.g.id === giocoId && (P.impostazioni || {}).modo === "online") {
        var C = h.codice, tVivo = null, salvata = 0;
        P.miaStanza = C;
        // (nomeHost: il mio nome nella partita, per riaprire e riprendere anche senza profilo)
        salva = function () { salvata = Date.now(); ricordaMiaStanza({ gioco: giocoId, codice: C, imp: impSalvabili(P.tavolo ? P.tavolo.impostazioni : P.impostazioni), nomi: nomi, fase: SV.fase, porta: SV.porta ? 1 : 0, nomeHost: (P.giocatori && P.giocatori[0]) || nomi.__io || "" }); };
        SV.salva = salva;
        SV.suFase.push(salva);   // (subito quando cambia la fase)
        salva();
        tVivo = setInterval(salva, 60000);   // "è ancora aperta" (vale 20 minuti dall'ultima volta)
        var invia = h.invia, chiudi = h.chiudi, lascia = h.lascia;
        h.invia = function (msg) {   // a ogni foto, al massimo ogni 3 secondi: regole aggiornate
          if (Date.now() - salvata > 3000) salva();
          return invia.apply(h, arguments);
        };
        h.chiudi = function () { clearInterval(tVivo); dimenticaMiaStanza(C); return chiudi.apply(h, arguments); };
        h.lascia = function () { clearInterval(tVivo); dimenticaMiaStanza(C); return lascia.apply(h, arguments); };
      }
      return h;
    };
    SGNet.entra = function (codice, cb, opz) {
      cb = cb || {};
      var C = String(codice).toUpperCase(), sala = !!(opz && opz.tieni);
      var P = !sala && partitaCorrente && partitaCorrente.viva() ? partitaCorrente : null;
      var guarda = !!(P && P.tavolo && P.tavolo.linkParams && P.tavolo.linkParams.guarda);
      var R = { codice: C, P: P, sala: sala, guarda: guarda, h: null,
        // (chi arriva tardi: ero già stato in questa stanza? Chi ricarica a metà partita non legge «🎉 Sei dentro!»)
        giaQui: !sala && !!nomeStanza(C) };
      // l'host di riserva (Passo 5): chi tiene la partita (_g, _h), la copia per i vice, la pausa dell'host
      var RR = R.ris = !sala && !guarda && riservaPer(P) ? { gen: 0, hid: null, nome: "", sess: null, copia: null, tVice: null, pausaVista: 0, fatto: false, hq: null, hqT: null } : null;
      var SV = nuovoSV(false, C, sala);   // la saletta viva vista da qui: chi è pronto, chi si ricollega, i nomi, la porta
      var onMsg = cb.onMsg;
      cb.onMsg = function (m) {
        if (RR && m && typeof m === "object") {
          if (m.t === "__ris") { prendiCopia(R, m); return; }
          if (m.t === "__rp") { RR.pausaVista = m.p ? Date.now() : 0; return; }
          if (m._g != null && !delCore(m) && !fotoRiserva(R, m)) return;   // (di chi ha perso il posto: il gioco non la vede)
        }
        if (m && m.t === "__esito") {
          if (!sala && !guarda && P && P.viva() && P.salaCtx && P.salaCtx.esito) try { P.salaCtx.esito(P.g, m.c); } catch (e) {}   // (l'host della Sala che gioca da amico: la Sala conta)
          if (!sala && !guarda && P && P.viva()) try { segnaRecentiDa(m.c, SV, P); } catch (e) {}   // "Giocato di recente"
          premiaPartita(m.c, true, C); return;   // gli XP: ognuno si dà i suoi
        }
        if (m && m.t === "__chi") { if (!sala) SV.chi = chiDa(m.l); return; }   // chi ha il profilo online in questa stanza (nome -> uid)
        if (delCore(m)) {
          if (m.t === "__sl") svArrivato(SV, m);
          else if (m.t === "__fa") { if (R.h && m.id !== R.h.mioId && FACCINE_SL.indexOf(m.f) >= 0) mostraFaccina(SV, m.id, String(m.n || "").slice(0, 16), m.f); }
          else if (m.t === "__via") { if (!guarda) contoVia(SV, m); }
          else if (m.t === "__fuori") { if (R.h && m.to === R.h.mioId && !guarda) fuoriDallaStanza(R, m.perche); }
          else if (m.t === "__torneino" && !sala) vaiAlTorneino(R, m);   // l'host ha fatto della stanza un torneino: si passa nella sua Sala
          else if (m.t === "__fase" && (m.f === "lobby" || m.f === "gioco" || m.f === "fine")) SV.fase = m.f;   // (Passo 6) a che punto è la partita
          // chi guarda soltanto: si torna in saletta → entra anche lui (fuori dalla Sala; vedi guardoFase)
          if (guarda && (m.t === "__fase" || m.t === "__sl")) guardoFase(R, m.t === "__fase" ? m.f : m.fa);
          return;
        }
        var fz = faseDaFoto(m); if (fz) SV.fase = fz;   // (a che punto è: sulla classifica una chiusura apposta non è "Collegamento perso")
        if (fz && guarda && guardoFase(R, fz)) return;   // (chi guardava entra a giocare: la partita vecchia non disegna più)
        if (fz && P && P.salaCtx && P.salaCtx.fase && P.viva()) try { P.salaCtx.fase(fz); } catch (e) {}   // (host della Sala che gioca da amico)
        return onMsg ? onMsg.apply(this, arguments) : undefined;
      };
      // nella Sala: se il gioco chiude la sua stanza (partita finita) si torna nella Sala, senza "Collegamento perso"
      var onChiuso = cb.onChiuso;
      if (P && P.salaCtx && P.salaCtx.chiusa) {
        cb.onChiuso = function () { if (P.viva()) return P.salaCtx.chiusa(); return onChiuso ? onChiuso.apply(this, arguments) : undefined; };
      }
      // fuori dalla Sala (e dal torneo): l'host non è tornato per 2 minuti → "La stanza è chiusa", uguale in tutti i giochi
      // (chi ha il suo host di riserva e chi guarda restano come sono)
      else if (P && !P.salaCtx && !guarda && !hostDiRiserva(P.g)) {
        cb.onChiuso = function (perche) {
          if (perche && perche.sparito && P.viva()) return stanzaChiusa(C);
          // chiusa apposta dall'host: ricaricando la pagina non si prova a rientrare, e in home niente "Rientra"
          if (perche && perche.voluto) {
            R.finita = true;
            var ls = linkSessione(), rs = stanzaRecente();
            if (ls && ls.stanza === C) dimenticaLinkSessione();
            if (rs && rs.stanza === C) try { localStorage.removeItem("sg-ultima-stanza"); } catch (e) {}
            // dalla classifica (l'host ha detto "fine: 1", o la partita era finita): il gioco non lo sa, la classifica resta
            // e resta "🏠 Esci"; solo la pillola "🚪 Paky ha chiuso la stanza" (2-14)
            if (P.viva() && (SV.chiusaFine || SV.fase === "fine")) {
              SV.chiusaFine = true; aggiornaFine(SV); togliVia();
              var chi = (SV.nomi && SV.nomi.host) || nomeStanza(C, true) || "L'host";
              pillola("chiusa", "🚪 " + chi + " ha chiuso la stanza", "grigia", 4000);
              return;
            }
          }
          return onChiuso ? onChiuso.apply(this, arguments) : undefined;
        };
      }
      var onHN = cb.onHostNuovo;
      // (msg = il messaggio dell'host nuovo: con r / _r la partita riprende da dove era, Passo 5)
      cb.onHostNuovo = function (eraDentro, eraVivo, msg) {
        if (onHN) try { onHN.apply(this, arguments); } catch (e) {}
        if (guarda) mandaGuardo(R, true);   // (l'host ha riaperto la stanza: gli dico subito che guardo)
        var info = { ripresa: !!(msg && (msg.r || msg._r)) };
        if (RR && msg && msg._g != null) {
          var gPrima = RR.gen, hPrima = RR.hid;
          // una sessione "più nuova" che però perde (es. il vecchio host tornato): resto con chi tiene la partita
          if (!fotoRiserva(R, msg)) { if (RR.sess) try { R.h.seguiHost(RR.sess); } catch (e) {} return; }
          if (gPrima && hPrima !== RR.hid) return;   // (la tiene un altro: "👑 Ora la partita la tiene…", già detto)
        } else if (RR && msg && msg.t === "__hostqui") {
          // "ci sono" non dice chi tiene la partita: la pillola giusta quando arriva la sua foto (al massimo 1,5 s)
          var fatto = false, fn = function () { if (fatto) return; fatto = true; clearTimeout(RR.hqT); RR.hq = null; hostTornato(R, eraDentro, eraVivo, info); };
          clearTimeout(RR.hqT); RR.hq = fn; RR.hqT = setTimeout(fn, 1500);
          return;
        }
        hostTornato(R, eraDentro, eraVivo, info);
      };
      // l'host è sparito (testamento) o tornato: il vice aspetta il suo turno e prende il posto
      var onHV = cb.onHostVia;
      if (RR) cb.onHostVia = function (via) { var r; if (onHV) try { r = onHV.apply(this, arguments); } catch (e) {} viceVia(R, via); return r; };
      // chi guarda soltanto: appena aperto (e poi ogni 20 s) dice all'host che guarda (i giochi a due in modo "guarda" non mandano join)
      if (guarda) {
        var onAp = cb.onAperto;
        cb.onAperto = function () {
          var r; if (onAp) r = onAp.apply(this, arguments);   // (il join del gioco diventa "__guardo": vedi qui sotto)
          mandaGuardo(R, false);
          if (!R.tGuardo) R.tGuardo = setInterval(function () { mandaGuardo(R, true); }, 20000);
          return r;
        };
      }
      var h = entra.call(SGNet, codice, cb, guarda ? Object.assign({}, opz || {}, { guarda: true }) : opz);
      if (!h) return h;
      R.h = h; SV.h = h; h._sv = SV;
      var invia = h.invia;
      h.invia = function (msg) {
        if (msg && msg.t === "join") {
          if (!sala && msg.nome) ricordaNomeStanza(C, msg.nome);   // ricaricando si rientra con lo stesso nome
          if (profiloAttivo()) msg.pr = 1;   // chi ha il profilo tiene il suo nome
          else if (msg.nome && msg.nome !== "Amico") try { localStorage.setItem("sg-nome-ospite", String(msg.nome).slice(0, 16)); } catch (e) {}   // la prossima volta è già scritto
          if (!sala) { var uM = mioUidOnline(); if (uM) msg.uid = uM; }   // "Giocato di recente": chi ha il profilo online si fa riconoscere
        }
        return invia.apply(h, arguments);
      };
      // chi guarda soltanto: il suo "join" diventa "__guardo" (l'host non lo vede mai come giocatore) e ogni altra mossa
      // che non è del core si butta (anche se il gioco disegna un tasto per sbaglio). Le faccine passano
      if (guarda) {
        R.inviaG = h.invia;
        h.invia = function (msg) {
          if (msg && msg.t === "join") { if (msg.nome) R.nomeG = String(msg.nome).slice(0, 16); return mandaGuardo(R, false); }
          if (!delCore(msg)) return;
          return R.inviaG.apply(h, arguments);
        };
        var chiudiG = h.chiudi, lasciaG = h.lascia;
        h.chiudi = function () { clearInterval(R.tGuardo); R.tGuardo = null; return chiudiG.apply(h, arguments); };
        h.lascia = function () { clearInterval(R.tGuardo); R.tGuardo = null; return lasciaG.apply(h, arguments); };
      }
      // finché sono dentro la stanza resta "recente" (se la pagina si ricarica rientro da solo, in home c'è "Rientra"),
      // anche in una serata lunga
      var marca = sala ? { sala: C } : (P && !P.salaCtx && !guarda ? { gioco: P.g.id, stanza: C } : null);
      if (marca) var tMarca = setInterval(function () {
        var st = h.stato ? h.stato() : null;
        if (!st || st.chiusa || R.finita) return clearInterval(tMarca);
        if (st.dentro) { ricordaStanza(Object.assign({}, marca)); segnaLinkSessione(marca); }
      }, 60000);
      if (!sala) { reteOsp = R; avviaControlloRete(); }
      return h;
    };
  }
  // ---- chi guarda soltanto (Passo 6) ----
  // "__guardo" { n: nome } all'host: all'apertura e poi ogni 20 s (dopo 50 s di silenzio l'host non lo conta più).
  // ripeti = è il giro dei 20 s (o l'host è nuovo): parte sempre; se no al massimo uno al secondo
  function mandaGuardo(R, ripeti) {
    var h = R && R.h, st = h && h.stato ? h.stato() : null;
    if (!h || !st || st.chiusa || R.finita || !R.P || !R.P.viva()) { if (R) { clearInterval(R.tGuardo); R.tGuardo = null; } return; }
    var ora = Date.now(); if (!ripeti && ora - (R.ultGuardo || 0) < 1000) return;
    if (!R.nomeG) try { R.nomeG = String(R.P.tavolo.nomeProfilo() || "").slice(0, 16); } catch (e) {}
    R.ultGuardo = ora;
    if (h._sv) h._sv.nomeGuardo = R.nomeG || "";   // (le mie faccine col mio nome)
    try { (R.inviaG || h.invia).call(h, { t: "__guardo", n: R.nomeG || "Pubblico" }); } catch (e) {}
  }
  // chi guarda soltanto e la partita torna in saletta (dopo averla vista giocare): entra anche lui, da solo.
  // Non nei giochi a due (lì si guarda e basta), non nel torneo a eliminazione e non nella Sala (lì lo fa la Sala).
  // true = si riparte da giocatore (la partita vecchia non disegna più)
  function guardoFase(R, f) {
    if (!R || !R.guarda || R.finita || R.torna || !f) return false;
    if (f !== "lobby") { R.vistoGioco = true; return false; }
    var P = R.P;
    if (!R.vistoGioco || !P || !P.viva() || P.salaCtx || aDue(P.g)) return false;
    R.torna = true;
    pillola("guardo", "✋ Si ricomincia: entri anche tu!", "verde", 2500);
    togliGuardo();
    lasciaPartita();
    try { R.h.chiudi(); } catch (e) {}   // (l'host mi toglie subito dal pubblico; poi entro con lo stesso id)
    linkParams = { gioco: P.g.id, stanza: R.codice };
    setTimeout(function () { avviaPartita(P.g, [], {}); }, 0);
    return true;
  }
  // la targhetta di chi guarda: in basso al centro "👀 Guardi · 😂 · ✕" (alta al massimo 44 px). Una per pagina, la stessa a
  // ogni schermata della partita (niente lampeggio); se ne va da sola quando la partita non c'è più.
  // 😂 apre (e chiude) sopra la targhetta la fila delle faccine; ✕ chiede "Smetti di guardare?" e si esce.
  // P.testoGuardo (facoltativo, p6-d): il testo al posto di "Guardi" (es. "Guardi · in coda: sei 2°")
  var GUARDO = null;   // { nodo, P, testo, fila, timer }
  function chipGuardo(P) {
    if (GUARDO && GUARDO.P !== P) togliGuardo();
    if (!GUARDO) {
      var G = GUARDO = { P: P, fila: null, timer: null };
      G.testo = el("span", { class: "sg-guardo-tx" });
      var bFa = el("button", { class: "sg-guardo-fa", type: "button", text: "😂", "aria-label": "Faccine", "aria-expanded": "false" });
      var bX = el("button", { class: "sg-guardo-x", type: "button", text: "✕", "aria-label": "Smetti di guardare" });
      G.nodo = el("div", { class: "sg-guardo", role: "group", "aria-label": "Stai guardando la partita" }, [ G.testo, bFa, bX ]);
      bFa.addEventListener("click", function () {
        if (G.fila) { togliNodo(G.fila); G.fila = null; bFa.setAttribute("aria-expanded", "false"); return; }
        var f = null; try { f = P.tavolo && P.tavolo.faccine(); } catch (e) {}
        if (!f) return;
        G.fila = el("div", { class: "sg-guardo-fila" }, [ f ]);
        document.body.appendChild(G.fila); bFa.setAttribute("aria-expanded", "true");
      });
      bX.addEventListener("click", function () {
        if (!P.viva() || !P.tavolo) return togliGuardo();
        P.tavolo.conferma("Smetti di guardare?", "Torni dove eri prima.", "Esci", function () { togliGuardo(); P.tavolo.esci(); });
      });
      document.body.appendChild(G.nodo);
      // la partita non c'è più (uscito, finita, si è tornati nella Sala o in home): via la targhetta
      G.timer = setInterval(function () { if (!P.viva() || !app || !app.querySelector(".schermata")) togliGuardo(); }, 1000);
    }
    var tx = "👀 " + (P.testoGuardo || "Guardi");
    if (GUARDO.testo.textContent !== tx) GUARDO.testo.textContent = tx;
  }
  function togliGuardo() {
    var G = GUARDO; if (!G) return;
    GUARDO = null; clearInterval(G.timer);
    togliNodo(G.nodo); if (G.fila) togliNodo(G.fila);
  }

  // l'host non è tornato in tempo (2 minuti): la stanza è chiusa. In home resta "Rientra": se la riapre, si torna dentro
  function stanzaChiusa(codice) {
    lasciaPartita(); SGNet.chiudiGiochi(); togliFerma(); dimenticaLinkSessione(); tieniAcceso(false);
    var s = schermata({ icona: "🚪", titolo: "La stanza è chiusa", sotto: "Stanza " + codice });
    s._contenuto.appendChild(el("p", { text: "Chi l'ha aperta non è tornato in tempo.", style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: tornaHome }));
    mostra(s);
  }
  // l'host ha riaperto la stanza (la sua pagina si è ricaricata, l'app si è riaperta): chi era dentro riparte pulito
  // dalla saletta, con lo stesso posto (stesso id). Il gioco vecchio non disegna più (partitaN).
  // info.ripresa (Passo 5): la partita riprende da dove era (t.ripresa dell'host): niente riavvio, solo la pillola; il
  // collegamento ripete già "sono entrato" e l'host rimette ognuno al suo posto
  function hostTornato(R, eraDentro, eraVivo, info) {
    // (la Sala si rimette a posto da sola; chi non aveva ancora chiesto di entrare rientra col join)
    // Anche chi per il collegamento non era "dentro" ma stava già giocando riparte: es. ricaricato a metà partita
    // in un gioco che nelle foto non mette gli id (l'host non l'ha riconosciuto), altrimenti resterebbe sul tavolo vecchio
    var st = R.h && R.h.stato ? R.h.stato() : null;
    if (R.sala || R.guarda || !(eraDentro || (eraVivo && st && st.entrato))) return;
    var P = R.P;
    if (!P || !P.viva() || hostDiRiserva(P.g)) return;
    var U = SL.ultimo, inSaletta = !!(U && !U.host && U.o && U.o._rete === R.h && document.body.contains(U.s));
    var nh = nomeStanza(R.codice, true);
    if (info && info.ripresa) {
      if (eraDentro || !inSaletta) pillola("tornato", "🔁 " + (nh || "L'host") + " è tornato: la partita riprende da dove era", "verde", 3500);
      return;
    }
    // (la partita non riprende: il gioco non lo sa fare, o la ripresa dell'host era scaduta → si riparte dalla saletta)
    if (eraDentro || !inSaletta) pillola("tornato", "🎉 " + (nh || "L'host") + " è tornato: si riparte dalla saletta", "verde", 3500);
    // ero già in saletta: basta rientrare (il collegamento ha già ripetuto "sono entrato"), niente da rifare sullo schermo
    if (inSaletta) return;
    try { R.h.lascia(); } catch (e) {}
    linkParams = Object.assign({}, P.tavolo.linkParams);
    avviaPartita(P.g, P.giocatori, P.impostazioni, P.opts, P.salaCtx);
  }
  // "👀 Partita in corso: la guardi ed entri alla prossima": chi è arrivato a partita cominciata (l'host non l'ha messo dentro).
  // Si toglie da sola quando compare la saletta (lì si entra) o quando l'host lo mette dentro.
  // Nei giochi a due (Tris…) chi è in più guarda: "👀 Giocano in due: tu guardi".
  // Ogni secondo ricontrolla anche il titolo della saletta ("Sto entrando…" → "tu guardi" anche senza foto nuove).
  var tControlloRete = null;
  function avviaControlloRete() { if (!tControlloRete) tControlloRete = setInterval(controllaRete, 1000); controllaRete(); }
  function controllaRete() {
    var R = reteOsp, st = R && R.h && R.h.stato ? R.h.stato() : null;
    if (!st || st.chiusa || !R.P || !R.P.viva()) {
      if (tControlloRete) { clearInterval(tControlloRete); tControlloRete = null; }
      pillola("prossima", null); return;
    }
    var U = SL.ultimo, inSaletta = !!(U && !U.host && document.body.contains(U.s));
    var guardi = inSaletta && U.o && U.o._rete === R.h && titoloSaletta(U, senzaTuFalso(U.o.giocatori || [], st), st) === false && (U.statoTit === "guardi" || U.statoTit === "spett");
    var fuori = !R.guarda && st.entrato && Date.now() - st.entrato > 2500 && !st.dentro && st.vivo && !st.ferma && !inSaletta;
    // chi arriva tardi: la pillola dice la verità secondo il gioco (g.ritardatari): "turno"/"mano" = entra dal prossimo
    // turno o dalla prossima mano; "subito" = gioca già da adesso (Parola d'ordine: entra nella squadra più piccola);
    // "partita" (di partenza) = guarda ed entra alla prossima partita
    var rit = R.P.g.ritardatari, dal = rit === "turno" ? "dal prossimo turno" : (rit === "mano" ? "dalla prossima mano" : (rit === "subito" ? "già da adesso" : null));
    var txF = aDue(R.P.g) ? "👀 Giocano in due: tu guardi" : (dal ? "✋ Partita in corso: giochi " + dal : "👀 Partita in corso: la guardi ed entri alla prossima");
    pillola("prossima", fuori ? txF : null, "grigia");
    if (fuori) R.tardi = true;
    // l'host mi ha messo nella partita in corso (non ci ero già stato: chi ricarica non lo legge): una volta "🎉 Sei dentro!"
    if (dal && !R.guarda && !R.dentroDetto && st.dentro) {
      var SVr = R.h._sv, faseR = SVr && SVr.fase;
      if (faseR === "gioco" && !inSaletta && (R.tardi || !R.giaQui)) pillola("dentro", "🎉 Sei dentro! Giochi " + dal, "verde", 3000);
      if (faseR) R.dentroDetto = true;
    }
    if ((guardi || (fuori && aDue(R.P.g))) && R.h.calma) R.h.calma();   // gioco a due già pieno: chiedo di entrare solo ogni tanto
  }

  // ---- un tasto che va avanti da solo: "Avanti ▶ 8" conta e a zero chiama fn (così nessuna schermata resta ferma) ----
  // nodo: un <button> (il numero si aggiunge al suo testo) oppure una scritta ("Si va avanti tra 8…" per chi aspetta).
  // fn = null: si vede solo il conto (gli ospiti; va avanti l'host). chiave: se il tasto viene ridisegnato con la
  // stessa chiave il conto continua da dov'era, invece di ripartire. Toccare il tasto ferma il conto (fa il tasto).
  var CONTI = {};
  // pre (facoltativo, solo per le scritte): al posto di "Si va avanti tra " (es. "Prossima sfida tra ")
  function contoAvanti(nodo, secondi, fn, chiave, pre) {
    if (!nodo) return null;
    var ora = Date.now(), k = chiave != null ? String(chiave) : null;
    Object.keys(CONTI).forEach(function (x) { if (CONTI[x] < ora - 60000) delete CONTI[x]; });
    var scade = k && CONTI[k] && CONTI[k] > ora ? CONTI[k] : ora + Math.max(1, +secondi || 12) * 1000;
    if (k) CONTI[k] = scade;
    var tasto = nodo.tagName === "BUTTON", num = null, fatto = false, timer = null;
    if (tasto) { num = nodo.querySelector(".conto-avanti") || el("span", { class: "conto-avanti" }); if (!num.parentNode) nodo.appendChild(num); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    function tic() {
      if (fatto) return stop();
      if (!document.body.contains(nodo) && Date.now() - ora > 1500) { fatto = true; return stop(); }   // il tasto non c'è più
      var s = Math.max(0, Math.ceil((scade - Date.now()) / 1000));
      if (tasto) { if (num.textContent !== String(s)) num.textContent = String(s); }
      else { var tx = (pre || "Si va avanti tra ") + s + "…"; if (nodo.textContent !== tx) nodo.textContent = tx; }
      if (s <= 0) { fatto = true; stop(); if (k) delete CONTI[k]; if (fn) fn(); }
    }
    if (tasto) nodo.addEventListener("click", function () { fatto = true; stop(); if (k) delete CONTI[k]; }, true);
    tic(); if (!fatto) timer = setInterval(tic, 250);
    return { ferma: function () { fatto = true; stop(); }, scadenza: scade, vivo: function () { return !fatto; } };
  }

  // il gioco aperto adesso: uno già lasciato (es. si è tornati al tabellone) non può più disegnare, uscire o dare risultati
  var partitaN = 0, partitaCorrente = null;   // partitaCorrente: { g, giocatori, impostazioni, opts, salaCtx, viva, tavolo, miaStanza }
  // (anche la musica della Scopa si ferma: Scopa 2 vs 2 e Scopone non sanno di essere stati lasciati)
  function lasciaPartita() { partitaN++; if (window.SGMusica && SGMusica.ferma) try { SGMusica.ferma(); } catch (e) {} }
  function avviaPartita(g, giocatori, impostazioni, opts, salaCtx) {
    var questa = ++partitaN;
    function viva() { return questa === partitaN; }
    // il link vale una volta sola: lo prende questa partita (t.linkParams) e poi si azzera,
    // così la prossima stanza che apri è davvero tua (niente link "attaccato")
    var lp = linkParams || {}; linkParams = {};
    xpRiparti(); reteXp = null; giocoXp = g.id;   // gli XP contano da qui (e dall'ultima volta in saletta)
    // entrato da ospite con un invito: se la pagina si ricarica si rientra da soli; se l'app si riapre, in home c'è "Rientra nella partita"
    if (lp.stanza && !lp.guarda && !salaCtx) { var st0 = { gioco: g.id, stanza: String(lp.stanza).toUpperCase() }; ricordaStanza(st0); segnaLinkSessione(st0); }
    // chi guarda soltanto (fuori dalla Sala e dal torneo): se la pagina si ricarica torna a guardare (niente "Rientra" in home)
    else if (lp.stanza && lp.guarda && !salaCtx) segnaLinkSessione({ gioco: g.id, stanza: lp.stanza, guarda: 1 });
    // online (host, ospite o dalla Sala): lo schermo resta acceso, così il collegamento non si ferma
    tieniAcceso(!!(salaCtx || lp.stanza || (impostazioni && impostazioni.modo === "online")));
    if (salaCtx || lp.stanza || (impostazioni && impostazioni.modo === "online")) amiciStato("gioco");   // (per gli amici: "🎮 sta giocando")
    var contenitore = el("div");
    var schermo = el("div");
    schermo.appendChild(contenitore);
    var P = partitaCorrente = { g: g, giocatori: giocatori, impostazioni: impostazioni, opts: opts, salaCtx: salaCtx, viva: viva, tavolo: null, miaStanza: null,
      // il codice imposto (stanza riaperta, gioco lanciato dalla Sala) e i nomi già dati valgono solo per questa partita:
      // li prende la prima stanza che apre (vedi agganciaRete), così non restano "attaccati" a una stanza dopo
      forza: (window.SGNet && SGNet._forza) || null, nomiSeme: NOMI_SEME, portaSeme: PORTA_SEME };
    if (window.SGNet) SGNet._forza = null;
    NOMI_SEME = null; PORTA_SEME = false;
    // ---- la ripresa (Passo 5): la partita di prima, se questa stanza (stesso codice imposto) era mia e il gioco riprende.
    // Oppure quella che mi ha passato l'host di riserva (RIPRESA_SEME, p5-b)
    var rip = RIPRESA_SEME; RIPRESA_SEME = null;
    if (!rip && g.riprende && P.forza) rip = ripresaDi(g.id, P.forza);
    var ripresa = rip ? { stato: rip.stato, soloQui: rip.soloQui != null ? rip.soloQui : null, io: rip.io || "host", gen: +rip.gen || 1,
      daRiserva: !!rip.daRiserva, vecchioHost: rip.vecchioHost || null, eta: Math.max(0, Date.now() - (+rip.t || Date.now())),
      // un'ora salvata (orologio dell'host di prima) nell'orologio di questo telefono
      ora: function (x) { return x == null ? x : x + (+rip.scarto || 0); } } : null;
    P.ripresa = ripresa;
    // (host di riserva, p5-b) la sessione di prima di questa stanza: la sua foto non conta come "occupata" (guardaPrima)
    P.ripSopra = rip ? (rip.sopra || rip.s || null) : null;
    // RIP: quello che si salva (l'ultimo stato del gioco, a tempo) e l'ultima classifica data in questa stanza.
    // risPrima: la classifica già data prima della ricarica (l'host ha ricaricato proprio sulla classifica: niente XP doppi)
    var RIP = { ult: null, t: null, quando: 0, ris: (rip && rip.ultimoRisultato) || null,
      risPrima: (rip && rip.ultimoRisultato) || null, risFino: Date.now() + 20000 };
    function reteRip() { var h = reteXp; return h && h._P === P && !h._chiusa && h.codice ? h : null; }   // la mia stanza di questa partita
    function salvaRip() {
      clearTimeout(RIP.t); RIP.t = null;
      var h = reteRip(), u = RIP.ult;
      if (!viva() || !h || !u) return;
      RIP.quando = Date.now();
      scriviRipresa({ gioco: g.id, codice: h.codice, t: Date.now(), io: tavolo.mioId, gen: (ripresa && ripresa.gen) || 1,
        stato: u.stato, soloQui: u.soloQui, nomeHost: (giocatori && giocatori[0]) || "", ultimoRisultato: RIP.ris, s: h.sessione || null });
    }
    // al massimo un salvataggio ogni mezzo secondo (l'ultimo stato vince)
    function inCodaRip() {
      if (RIP.t || !viva()) return;
      // (in secondo piano si salva comunque, anche senza novità: la ripresa vale 20 minuti da adesso)
      ripresaSubito = function () { if (RIP.ult && viva()) salvaRip(); };
      RIP.t = setTimeout(salvaRip, Math.max(0, 500 - (Date.now() - RIP.quando)));
    }
    P.ripAperta = function () { if (RIP.ult && viva()) inCodaRip(); };
    // la classifica è la stessa già data prima della ricarica? (true = niente XP né punti di nuovo)
    function risultatoDato(classifica) {
      var k = null; try { k = JSON.stringify(classifica); } catch (e) {}
      if (!k) return false;
      if (RIP.risPrima && k === RIP.risPrima && Date.now() < RIP.risFino) return true;
      if (RIP.ult) { RIP.ris = k; inCodaRip(); }   // (solo nei giochi che si fanno ricordare)
      return false;
    }

    var tavolo = {
      giocatori: giocatori.slice(),
      impostazioni: impostazioni || {},
      linkParams: lp,
      radice: contenitore,

      // aiuti riusabili (così i giochi non reinventano le stesse cose)
      el: el,
      svuota: svuota,
      mischia: mischia,
      // nei giochi niente scritta col nome del gioco in alto (si sa a cosa si gioca): massimo spazio.
      // Restano i titoli che dicono qualcosa ("Hai vinto!", "Fine smazzata"…).
      schermata: function (o) {
        o = o || {};
        // (solo il titolo UGUALE al nome del gioco: "Chi è l'impostore?" resta, col suo sottotitolo)
        var nomeG = String(g.nome || "").trim().toLowerCase();
        if (o.titolo && nomeG && String(o.titolo).trim().toLowerCase() === nomeG) o = Object.assign({}, o, { titolo: null });
        if (!o.titolo) o = Object.assign({}, o, { icona: null, sotto: null });
        var s = schermata(o);
        if (!o.titolo) s.classList.add("senza-testa");
        // 🌙 il gioco resta col suo stile finché non lo si converte: tema: "oro" in SG.registra (tutto col vestito dell'app),
        // oppure t.schermata({ chiara: true }) per una schermata sola (classifica, schermate di servizio);
        // in un gioco convertito, t.schermata({ scura: true }) (o la classe "sg-scura") tiene il suo stile a una schermata (un tavolo, un campo)
        s.classList.add("g-" + g.id);   // (il «cartellino» del gioco: le sue regole di stile valgono solo qui, es. .oro.g-tris)
        if (o.scura) s.classList.add("sg-scura");
        if (o.scura || (g.tema !== "oro" && !o.chiara)) { s.classList.remove("oro"); s._gioco = true; }
        else if (g.tema === "oro") s.classList.add("sg-dal-gioco");   // (gioco convertito: le sue emoji restano emoji e dietro niente sfondo animato, vedi js/stile.js)
        return s;
      },
      mostra: function (s) {
        if (!viva()) return;
        // (🌙 una schermata del gioco: mostra() non le dà il vestito dell'app, tranne nei giochi convertiti (tema: "oro") o se il gioco l'ha già fatta .oro)
        if (s && s.classList) {
          s.classList.add("g-" + g.id);
          if (!s.classList.contains("sg-scura") && (g.tema === "oro" || s.classList.contains("oro"))) { s.classList.add("oro"); if (g.tema === "oro") s.classList.add("sg-dal-gioco"); }
          else { s.classList.remove("oro"); s._gioco = true; }
        }
        if (salaCtx && salaCtx.tabellone) salaCtx.tabellone(s);   // torneo a eliminazione: tasto 🏆 Tabellone
        if (salaCtx && salaCtx.angolo) salaCtx.angolo(s);   // chi guarda il duello della Sala: "👥 Sala" in alto
        if (lp.stanza && !lp.guarda) dadoNelleSchermate(s, g, lp.stanza);   // chi entra senza profilo: il benvenuto, l'avatar e il 🎲
        mostra(s);
        P.vista = s;   // (la schermata della partita: serve a sapere se sto giocando, vedi staGiocando)
        // chi guarda soltanto: in basso la targhetta "👀 Guardi · 😂 · ✕" (non nel torneo a eliminazione: lì c'è il tabellone)
        if (lp.guarda && !(salaCtx && salaCtx.tabellone)) chipGuardo(P);
      },

      // il nome con cui questo telefono entra da solo in una stanza (se c'è, niente schermata del nome):
      // nella Sala quello della Sala (se c'erano due "Luca", il mio è "Luca 2"), poi il profilo,
      // poi il nome già usato in questa stanza (chi non ha il profilo non lo riscrive se la pagina si ricarica)
      nomeProfilo: function () {
        if (salaCtx && salaG && salaG.nome) return salaG.nome;
        var p = profiloAttivo(); if (p && p.nome) return String(p.nome).trim().slice(0, 16);
        var nS = lp.stanza ? nomeStanza(lp.stanza) : "";
        // chi guarda soltanto non deve mai vedere la schermata del nome
        if (!nS && lp.guarda) { try { nS = String(localStorage.getItem("sg-nome-ospite") || "").trim().slice(0, 16); } catch (e) {} nS = nS || "Pubblico"; }
        return nS;
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
        xpRiparti();   // in saletta si aspetta: gli XP contano da quando si comincia a giocare
        // chi entra: la saletta chiede al collegamento se l'host l'ha davvero messo dentro ("Sei dentro!" o "Sto entrando…");
        // a tutti e due serve la stanza per la saletta viva (pronti, faccine, porta, 3-2-1)
        if (o && !o.host && !o._rete && reteOsp && reteOsp.P === P) o = Object.assign({}, o, { _rete: reteOsp.h });
        if (o && o.host && !o._rete && reteXp && reteXp._P === P) o = Object.assign({}, o, { _rete: reteXp });
        // un gioco della Sala: in testata il codice e il link della Sala (uno per tutta la serata), per l'host e per chi entra.
        // Il torneo a eliminazione no: lì le partite sono tra due e si invita dal tabellone
        if (o && salaCtx && !salaCtx.tabellone && salaSempre()) {
          var sS = sala && sala.codice && sala.codice !== "…" ? { codice: sala.codice, host: sala.membri[0] && sala.membri[0].nome }
            : (salaG ? { codice: salaG.codice, host: salaG.nomeHost } : null);
          if (sS) o = Object.assign({}, o, { sala: { codice: sS.codice, link: linkSala(sS.codice), host: sS.host || "" } });
        } else if (o && salaCtx && salaCtx.tabellone && !o.host) o = Object.assign({}, o, { senzaInvito: true });
        // un gioco della Sala: chi della Sala non è ancora arrivato ("Arrivano: 3 su 4", le sagome, "Comincia senza Marco")
        if (o && salaCtx && !salaCtx.tabellone) o = Object.assign({}, o, { _attesiDi: function (gio, SVg) { return viva() ? attesiSala(g, gio, SVg, tavolo) : []; } });
        var s = saletta(g, o, (opts && opts.regole) ? { box: opts.regole, imp: tavolo.impostazioni, tavolo: tavolo } : null);
        if (s) P.vista = s;
        if (s && salaCtx && salaCtx.tabellone) salaCtx.tabellone(s);
        if (s && salaCtx && salaCtx.angolo) salaCtx.angolo(s);
        return s;
      },
      // torneo a eliminazione: la partita col bot si trasmette, così gli altri la guardano (msg come quelli dell'host online)
      trasmetti: (salaCtx && salaCtx.trasmetti) ? function (msg) { if (viva()) salaCtx.trasmetti(msg); } : null,
      // true nelle partite del torneo a eliminazione (online o col bot): col pareggio si rigioca da soli (conto sulla rivincita)
      eliminazione: !!(salaCtx && salaCtx.tabellone),

      // ---- il contratto della Sala per i giochi ----
      // onRivincita: il gioco ci mette la sua "Nuova partita" dell'host che riporta tutti nella saletta (la Rivincita col 3-2-1)
      onRivincita: null,
      // i tasti di fine partita uguali per tutti (vedi tastiFineCore): true = li ha disegnati il core nel piede;
      // false = il gioco mette i suoi di sempre (sullo stesso telefono, col bot, torneo a eliminazione, chi guarda)
      tastiFine: function (piede, o) { return viva() ? tastiFineCore(piede, o, { P: P, tavolo: tavolo }) : false; },
      // chi gioca, scelto nella Sala ("Chi gioca a Tris?"): lista di { id, nome } o null (= tutti)
      scelti: (impostazioni && impostazioni.scelti) || null,
      // chi entra può prendere un posto? (gli altri guardano)
      puoSedersi: function (id, nome) {
        var sc = tavolo.scelti; if (!sc || !sc.length) return true;
        return sc.some(function (x) {
          if (x == null) return false;
          if (typeof x !== "object") return x === id || (!!nome && stessoNome(x, nome));
          return (x.id != null && x.id === id) || (!!x.nome && !!nome && stessoNome(x.nome, nome));
        });
      },
      postiOnline: postiDi(g),   // quanti posti ha online (g.postiOnline, se no 10)
      // la fila delle faccine della saletta, da mettere dove si aspetta o si guarda (es. la classifica finale, chi guarda
      // una partita a due): il mio avatar le fa sui telefoni di tutti. null se la partita non è online
      // (anche per chi guarda soltanto: le sue faccine arrivano a tutti, col suo nome)
      faccine: function () {
        var h = reteXp && reteXp._P === P ? reteXp : (reteOsp && reteOsp.P === P ? reteOsp.h : null);
        if (!h || !h._sv) return null;
        return vassoioFaccine(function () { return viva() ? h._sv : null; });
      },
      // ---- chi guarda e chi arriva tardi (Passo 6) ----
      // true: questo telefono guarda soltanto (niente nome da chiedere, niente "join": lo toglie il core, niente mosse, niente trofei)
      guarda: !!lp.guarda,
      // quando entra chi arriva a partita cominciata: "turno" (dal prossimo turno), "mano" (dalla prossima mano), "subito" (gioca già
      // da adesso), "partita" (guarda ed entra alla prossima)
      ritardatari: g.ritardatari || "partita",
      // (solo l'host di un gioco della mia Sala) a che punto è la partita, in una riga corta per chi è fuori: "Round 3 di 5".
      // Al massimo ogni 3 secondi (l'ultimo testo vince); la Sala lo mostra nel riquadro "🎮 Si gioca a Balla · round 3 di 5"
      aCheSiamo: function (testo) {
        if (!viva() || !salaCtx || !sala || sala.ctx !== salaCtx || !reteXp || reteXp._P !== P) return;
        var tx = String(testo == null ? "" : testo).replace(/\s+/g, " ").trim().slice(0, 40);
        if (tx === sala.punto && !P.puntoT) return;
        P.puntoTx = tx;
        if (P.puntoT) return;   // (già in coda: parte l'ultimo)
        var manda = function () {
          P.puntoT = null;
          if (!viva() || !sala || sala.ctx !== salaCtx || P.puntoTx === sala.punto) return;
          sala.punto = P.puntoTx; sala.puntoDi = sala.stanza; P.puntoQ = Date.now();
          if (sala._bcast) sala._bcast();
        };
        var aspetta = 3000 - (Date.now() - (P.puntoQ || 0));
        if (aspetta <= 0) manda(); else P.puntoT = setTimeout(manda, aspetta);
      },

      // un tasto che va avanti da solo col conto alla rovescia ("Avanti ▶ 12"): nessuna schermata resta ferma.
      // L'host passa fn (a zero si va avanti); gli ospiti fn = null e una scritta: "Si va avanti tra 12…".
      // chiave: lo stesso conto anche se il tasto viene ridisegnato (es. "esito|" + numero del turno)
      contoAvanti: function (nodo, secondi, fn, chiave, pre) { return contoAvanti(nodo, secondi, fn ? function () { if (viva()) fn(); } : null, chiave, pre); },

      // passaggio del telefono, poi esegue "quando" (in alto c'è ‹ per uscire dal gioco, con la conferma)
      passaA: function (nome, quando) { if (!viva()) return; passaIlTelefono(nome, function () { if (viva() && quando) quando.apply(this, arguments); }, function () { tavolo.esci(); }); },

      // la finestra di conferma al centro (la stessa dell'app): t.conferma("Uscire dalla partita?", "nota o null", "Esci", fn).
      // Anche t.conferma(domanda, fn). "Resta" chiude e basta; il tasto del sì si attiva dopo un attimo (niente tocchi doppi)
      conferma: function (domanda, nota, siTesto, siFn) {
        if (typeof nota === "function") { siFn = nota; nota = null; siTesto = null; }
        else if (typeof siTesto === "function") { siFn = siTesto; siTesto = null; }
        if (!viva() || typeof siFn !== "function") return;
        chiediConferma(domanda, nota, siTesto, function () { if (viva()) siFn(); });
      },

      // ---- la ripresa (Passo 5): se l'host ricarica la pagina o l'app si chiude, la partita riprende da dove era ----
      // t.ripresa: null, oppure { stato, soloQui, io, gen, daRiserva, vecchioHost, eta, ora(x) } (la partita di prima: il
      // gioco la ricostruisce, mette "via" gli altri umani, riparte con qualche secondo di respiro e apre la stanza con
      // SGNet.ospita(ID, cb, { ripresa: true }), così gli amici non tornano in saletta)
      ripresa: ripresa,
      // chi tiene la partita su questo telefono: "host", oppure l'id da ospite dell'amico che ha preso il posto dell'host
      mioId: (ripresa && ripresa.io) || "host",
      // l'host online ricorda la partita a ogni cambiamento: stato = oggetto semplice (fase, giocatori con gli id, punti,
      // segreti, scadenze come ore assolute: Date.now() + ms); soloQui = pezzi grossi che restano solo su questo telefono.
      // null = niente da riprendere (saletta, o uscito apposta). Si salva al massimo ogni mezzo secondo, e subito quando
      // l'app va in secondo piano. Vale solo per l'host online nella sua stanza (altrimenti non fa niente)
      ricorda: function (stato, soloQui) {
        if (!viva() || !g.riprende || (tavolo.impostazioni || {}).modo !== "online") return;   // (solo i giochi con riprende: true)
        if (stato == null) {
          RIP.ult = null; RIP.ris = null; clearTimeout(RIP.t); RIP.t = null;
          var h0 = reteRip(); if (h0) scordaRipresa(h0.codice); else if (P.forza) scordaRipresa(P.forza);
          if (P.riserva) copiaRiserva(P.riserva, null);   // (i vice buttano la copia: niente da portare avanti)
          return;
        }
        RIP.ult = { stato: stato, soloQui: soloQui != null ? soloQui : null };
        if (reteRip()) inCodaRip();   // (se la stanza non c'è ancora: appena ha il codice, vedi P.ripAperta)
        if (P.riserva) copiaRiserva(P.riserva, stato);   // (host di riserva: la copia ai vice, mai soloQui)
      },
      // (host di riserva) chi porta avanti la partita se l'host sparisce: il gioco può sceglierlo lui (es. prima chi guarda).
      // lista di id in ordine; null = i primi due arrivati (di partenza)
      vici: function (lista) {
        if (!viva()) return;
        P.viciScelti = Array.isArray(lista) ? lista.slice(0, 10) : null;
        if (P.riserva) controllaVici(P.riserva);
      },

      // i giochi online dicono com'è finita ogni partita, senza lasciare la loro schermata finale:
      // serve al torneo online per sommare i punti. classifica = [{ nome, pos? }] dal primo all'ultimo
      // (dà anche gli XP: a questo telefono e, se è l'host, a tutti gli altri con "__esito")
      // (la stessa classifica già data prima che l'host ricaricasse la pagina: niente XP né punti di nuovo)
      risultato: function (classifica) {
        if (!viva() || !classifica || !classifica.length) return;
        if (risultatoDato(classifica)) return;
        // "Giocato di recente" (solo online): prima __chi, così anche chi è entrato per ultimo sa chi ha il profilo
        var SVr = reteXp && reteXp._P === P ? reteXp._sv : null;
        if (SVr && !SVr.sala) try { inviaChi(SVr, true); segnaRecentiDa(classifica, SVr, P); } catch (e) {}
        premiaPartita(classifica, false);   // questo telefono ha giocato davvero (host o contro il computer): XP anche se il nome è diverso
        if (reteXp && reteXp.inviaVeloce) try { reteXp.inviaVeloce({ t: "__esito", c: classifica.map(function (r) { var x = { nome: r.nome, pos: r.pos }; if (r.bot) x.bot = true; return x; }) }); } catch (e) {}
        if (salaCtx && salaCtx.risultato) salaCtx.risultato(g, classifica);
      },

      // il gioco chiama questa quando è finito
      fine: function (classifica) {
        if (!viva()) return;
        var dato = !!(classifica && classifica.length && risultatoDato(classifica));
        if (!dato) premiaPartita(classifica, false);
        if (salaCtx) return salaCtx.fine(g, classifica, giocatori, impostazioni, dato);   // (dato: la Sala non la conta di nuovo)
        if (opts && opts.torneo && torneo) return torneoRisultato(g, classifica);
        var fac = null; try { fac = tavolo.faccine(); } catch (e) {}   // partita online: la fila delle faccine anche nella classifica
        if (!fac && !reteXp) serataLocale(g, classifica);   // sullo stesso telefono: i punti nella Classifica della serata, da soli
        // partita online: i tasti di fine uguali per tutti (Nuova partita / Ci sto, Esci); se no quelli di sempre
        var host = !!(reteXp && reteXp._P === P);
        schermataFine(g, classifica, giocatori, impostazioni, fac, fac ? function (piede) { return tavolo.tastiFine(piede, { host: host }); } : null);
      },

      // uscite comuni
      esci: function () {
        if (!viva()) return;
        if (!salaCtx && tavolo.linkParams && tavolo.linkParams.stanza) dimenticaStanza();   // uscito apposta: niente "Rientra"
        if (P.miaStanza) dimenticaMiaStanza(P.miaStanza);   // l'host è uscito apposta: la sua stanza non si riapre da sola
        var hR = reteRip(); RIP.ult = null; clearTimeout(RIP.t); RIP.t = null; if (hR) scordaRipresa(hR.codice);   // (né la sua partita)
        if (P.riserva) fermaRiserva(P.riserva);
        lasciaPartita();   // da qui il gioco non disegna più (un suo timer rimasto acceso non copre la Sala o la home)
        (salaCtx ? salaCtx.esci : tornaHome)();   // entrato da un edificio della città: si torna lì
      }
    };
    P.tavolo = tavolo;

    g.avvia(tavolo);
  }

  // ---- la pagina si è ricaricata (o l'app si è riaperta): si torna da soli dov'eri ----
  // la mia Sala o la mia stanza (entro 20 minuti, stesso codice: gli amici rientrano da soli), oppure la stanza
  // dell'amico in cui ero entrato in questa scheda. Vale la più recente. null = niente da riprendere
  function rientroAutomatico() {
    var cand = [], io = profiloAttivo();
    var ms = miaSalaRecente(), mt = miaStanzaRecente(), ls = linkSessione();
    if (ms && (io || (ms.nomeHost && salaSempre()))) cand.push({ t: ms.t, vai: function () { creaSala({ riapri: ms }); } });   // (senza profilo: col nome dell'host salvato)
    if (mt && (io || ripresaValida(mt)) && giocoDa(mt.gioco)) cand.push({ t: mt.t, vai: function () { riapriStanza(mt); } });   // (senza profilo solo se la partita riprende)
    if (ls) cand.push({ t: ls.t || 0, vai: function () { if (ls.sala) return salaOspite(ls.sala); var g = giocoDa(ls.gioco); if (!g) return schermataHome(); linkParams = { gioco: g.id, stanza: ls.stanza }; if (ls.guarda) linkParams.guarda = 1; avviaPartita(g, [], {}); } });   // (chi guardava torna a guardare)
    if (!cand.length) return null;
    cand.sort(function (a, b) { return b.t - a.t; });
    return cand[0].vai;
  }
  // l'host riapre la sua stanza: stesso gioco, stesso codice, stesse regole (il gruppo resta; la partita in corso riprende
  // se il gioco lo sa fare, t.ripresa: anche senza profilo, col nome di prima)
  function riapriStanza(o) {
    var g = giocoDa(o.gioco), io = profiloAttivo(), rp = ripresaValida(o) ? ripresaDi(g.id, o.codice) : null;
    if (!g || !(io || rp)) return schermataHome();
    var mioNome = (io && io.nome) || o.nomeHost || rp.nomeHost || "Giocatore 1";
    // un gioco con l'host di riserva (Parola d'ordine) a partita iniziata: la porta avanti un amico, io rientro come giocatore
    if (hostDiRiserva(g) && o.fase && o.fase !== "lobby") {
      dimenticaMiaStanza(o.codice);
      linkParams = { gioco: g.id, stanza: o.codice };
      return avviaPartita(g, [], {});
    }
    var imp = {}, box = null;
    if (typeof g.impostazioni === "function") {
      box = el("div", { class: "sg-dal-gioco" });   // (🤍 roba del gioco: le sue emoji restano emoji)
      try { g.impostazioni(box, imp, { el: el, modo: "online", giocatori: [mioNome] }); } catch (e) {}
    }
    Object.keys(o.imp || {}).forEach(function (k) { imp[k] = o.imp[k]; });   // le regole scelte prima (il foglio ⚙️ mostra le scelte di partenza)
    imp.modo = "online";
    pillola("riapro", "🔁 Riapro la tua stanza di " + g.nome + " (" + o.codice + ")…", "blu", 4000);
    NOMI_SEME = o.nomi && typeof o.nomi === "object" ? o.nomi : null;   // ognuno ritrova il suo nome ("Luca 2" resta "Luca 2")
    PORTA_SEME = !!o.porta;   // la porta resta com'era (chiusa: entra solo chi c'era)
    SGNet._forza = o.codice;
    linkParams = {};
    avviaPartita(g, [mioNome], imp, { modo: "online", regole: box });
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
    registra: function (gioco) { giochiReg.push(gioco); ordinaGiochi(); },   // (va al suo posto nell'ordine del proprietario: se non c'è, in fondo)
    audioCtx: audioCtx,
    listaProfilo: listaProfilo, salvaListaProfilo: salvaListaProfilo,   // liste salvate sul profilo di chi gioca
    // 🤖 i bot fissi, uguali in tutti i giochi: { id, nome, omino, frase, livello: "facile"|"medio"|"difficile", bot: true }
    // prendi(n, { livello, escludi: [nomi o id], caso }) = n bot diversi (stessi nello stesso ordine, se no a sorte con caso: true)
    bot: { tutti: function () { return botTutti().map(copiaBot); }, prendi: botPrendi, daId: botDaId, livelli: BOT_LIVELLI.slice() },
    avviaApp: function () {
      ordineAttivo = ordineSalvato(); ordinaGiochi();   // 🧩 l'ordine dei giochi visto l'ultima volta (subito: la home non salta)
      agganciaRete();   // lo strato comune della rete (stanze ricordate, nomi doppi, XP, host che torna…)
      // niente menu della pressione lunga (copia, salva immagine…) fuori dai campi dove si scrive
      document.addEventListener("contextmenu", function (e) { if (!(e.target && e.target.closest && e.target.closest("input, textarea, [contenteditable='true']"))) e.preventDefault(); });
      app = document.getElementById("app");
      // il link si legge una volta sola e si toglie dall'indirizzo (così non resta "attaccato" all'app);
      // quello di una stanza resta segnato solo in questa scheda: se la pagina si ricarica si rientra da soli
      linkParams = leggiParametriLink();
      // il link fisso di una Compagnia (#gruppo=KFRTPQ&n=…&e=…): codice di 6 lettere, se no non vale
      if (linkParams.gruppo != null) { var cg = codiceComp(linkParams.gruppo); if (cg) linkParams.gruppo = cg; else delete linkParams.gruppo; }
      var daLink = !!(linkParams.sala || linkParams.gruppo || (linkParams.gioco && linkParams.stanza));
      if (location.hash) try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
      if (daLink) segnaLinkSessione(linkParams.sala || linkParams.gruppo ? { sala: linkParams.sala || linkParams.gruppo } : { gioco: linkParams.gioco, stanza: linkParams.stanza, guarda: linkParams.guarda });
      // la Compagnia (js/compagnia.js): memoria, tessere della home, link fisso. Le passo gli aiuti del core
      if (window.SGCompagnia) try {
        SGCompagnia.collega({ el: el, svuota: svuota, schermata: schermata, mostra: mostra, home: schermataHome, conferma: chiediConferma, pillola: pillola, cifre: cifre,
          profilo: profiloAttivo, omino: function (cfg, o) { return window.SGOmino && cfg ? SGOmino.svg(cfg, o) : ""; },
          apri: function (C) { apriCompagnia(C); }, entra: function (C) { apriCompagnia(C); }, mia: infoSalaMia,
          nomeGioco: function (id) { var g = giocoDa(id); return g ? { nome: g.nome, icona: g.icona } : ""; },
          chiedi: function (uid, nome, fatto) { try { return chiediA({ uid: uid, nome: nome }, fatto); } catch (e) {} },
          rapporto: function (uid) { try { return rapporto(uid); } catch (e) { return "nessuno"; } },
          // rinominata da "Le tue compagnie": se la sua Sala è mia la mando a tutti
          rinominata: function (C, comp) {
            // (sono nella sua Sala da amico: il nome nuovo lo passo all'host, che lo manda a tutti se è il più nuovo)
            if (comp && salaG && salaG.rete && salaG.codice === String(C).toUpperCase()) try {
              salaG.rete.invia({ t: "comp", comp: { nome: String(comp.nome != null ? comp.nome : comp.n).slice(0, 24), emoji: String((comp.emoji != null ? comp.emoji : comp.e) || "📌").slice(0, 8), rv: +comp.rv || Date.now() } });
            } catch (e) {}
            if (!sala || sala.codice !== String(C).toUpperCase() || !comp) return;
            sala.comp = { nome: String(comp.nome != null ? comp.nome : comp.n).slice(0, 24), emoji: String((comp.emoji != null ? comp.emoji : comp.e) || "📌").slice(0, 8), rv: +comp.rv || Date.now() };
            if (sala._bcast) sala._bcast();
            if (!sala.inGioco) disegnaSalaHost();
          } });
      } catch (e) { setTimeout(function () { throw e; }, 0); }
      if (daLink && linkParams.k) chiaveDi(linkParams.sala || linkParams.gruppo || linkParams.stanza, false, linkParams.k);   // 🔑 la chiave delle foto: solo in questa scheda
      if (window.SGNube && SGNube.onCambio) SGNube.onCambio(ricordaProfilo);   // questo telefono ricorda l'ultimo profilo usato
      if (window.SGNube && SGNube.onCambio) SGNube.onCambio(stileAvatar);   // gli avatar nuovi: per tutti, o solo per il proprietario (vedi AVATAR_NUOVO)
      stileAvatar();
      // gli amici online (Passo 6): col profilo pronto si accende la presenza; profilo cambiato o uscito: si ferma o riparte
      if (window.SGNube && SGNube.onCambio && window.SGAmiciOnline) SGNube.onCambio(function () { amiciAvvia(); });
      // PROFILO OBBLIGATORIO: prima di tutto (home, gioco, stanza o Sala del link) c'è il profilo con l'avatar;
      // chi l'ha già usato qui entra da solo. Il link letto qui sopra si usa dopo (la pagina ricaricata lo ritrova)
      function parti() {
        var ls0 = daLink ? linkParams : linkSessione();
        garantisciProfilo(vai, { daLink: !!(daLink || ls0), invito: invitoDi(ls0) });
      }
      function vai() {
        stileAvatar();   // (il profilo ora c'è di sicuro, anche se appena creato)
        caricaBot();   // i bot come li ha fatti il proprietario (in sottofondo: intanto valgono gli ultimi visti)
        caricaOrdine();   // e l'ordine dei giochi (stessa lettura della sua scheda; la home aperta si rimette in fila da sola)
        amiciAvvia();   // il pallino verde degli amici e i loro inviti (solo col profilo)
        // pagina ricaricata (o app riaperta) senza link: la mia stanza o la mia Sala si riaprono, o si torna in quella dell'amico
        var torna = !daLink && rientroAutomatico();
        if (torna) return torna();
        // il link fisso di una Compagnia: va tra le mie e si entra (o si apre la serata, se non c'è nessuno)
        if (linkParams.gruppo) {
          var CG = linkParams.gruppo, nG = String(linkParams.n || "").trim().slice(0, 24), eG = String(linkParams.e || "").trim().slice(0, 8);
          linkParams = {};
          try { if (window.SGCompagnia) SGCompagnia.salva({ c: CG, n: nG || "Compagnia " + CG, e: eG || "📌" }); } catch (e) {}
          return apriCompagnia(CG, { nome: nG || null, emoji: eG || null });
        }
        if (linkParams.sala) { var cs = linkParams.sala; linkParams = {}; return salaOspite(cs); }   // link di una Sala online
        var g = linkParams.gioco && giocoDa(linkParams.gioco);
        // Con un codice stanza si entra come OSPITE; altrimenti si apre la preparazione
        if (g && linkParams.stanza) avviaPartita(g, [], {});
        else if (g) apriGioco(g);
        else schermataHome();
      }
      [3000, 9000].forEach(function (ms) { setTimeout(function () { if (serveExtra()) caricaExtra(); try { var io0 = profiloAttivo(); if (io0 && io0.cloud) statoSfide(); } catch (e) {} }, ms); });   // chi usa la casa nuova, il casinò o la città a piedi: i loro disegni arrivano in sottofondo
      // col cloud, aspetta che Firebase ripristini la sessione (login automatico)
      if (window.SGNube && SGNube.disponibile() && !SGNube.pronto()) {
        schermataCaricamento();
        var fatto = false;
        SGNube.onCambio(function () { if (!fatto && SGNube.pronto()) { fatto = true; parti(); } });
        setTimeout(function () { if (!fatto) { fatto = true; parti(); } }, 6000);   // rete lenta: parti comunque
      } else parti();
    },
    // la sala: i giochi possono rimandarci dalla loro schermata finale
    // (da una partita online la stanza si chiude: non resta aperta con gli amici dentro)
    // (una partita della mia Sala: "Cambia gioco" porta tutti nella Sala e io scelgo il prossimo)
    cambiaGioco: function () {
      var P = partitaCorrente && partitaCorrente.viva() ? partitaCorrente : null;
      if (sala && P && P.salaCtx && P.salaCtx === sala.ctx) return salaCambiaGioco();
      lasciaPartita(); if (window.SGNet) SGNet.chiudiGiochi(); schermataScegliGioco();
    },
    // la ruota del giorno (monete o XP, un giro al giorno): la apre anche il Black Jack quando restano poche monete
    ruotaDelGiorno: ruotaDelGiorno,
    // la finestra di conferma al centro (per chi non ha il tavolo, es. lo studio): SG.conferma(domanda, nota, siTesto, siFn)
    conferma: function (domanda, nota, siTesto, siFn) { chiediConferma(domanda, nota, siTesto, siFn); },
    sala: function () { lasciaPartita(); if (window.SGNet) SGNet.chiudiGiochi(); schermataSala(null); },
    // impostazioni arrivate da un link (le legge il gioco per i valori di partenza)
    parametriLink: function () { return linkParams; },
    // 🔑 la chiave delle foto della serata (quella della Sala, o della stanza): crea = sono l'host e la faccio se manca
    chiaveFoto: function (codice, crea) { var cs = crea ? (sala && sala.codice) : (salaG && salaG.codice); return chiaveDi(codice) || (cs && chiaveDi(cs, crea)) || (crea ? chiaveDi(codice, true) : null); },
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
      var kk = params.k === undefined && (params.sala || params.stanza) ? chiaveDi(params.sala || params.stanza) : null;   // 🔑 la chiave delle foto, se questa scheda ce l'ha
      if (kk) pezzi.push("k=" + kk);
      return base + (pezzi.length ? "#" + pezzi.join("&") : "");
    },
    // esposti perché comodi anche fuori
    _util: { el: el, svuota: svuota, mischia: mischia, votoEstrai: function (ids, voti, caso) { return votoEstrai(ids, voti, caso); } }
  };
})();

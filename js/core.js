/* =========================================================
   MOTORE COMUNE — "SG"
   Tutto ciò che ogni gioco condivide sta qui, scritto una
   volta sola: le schermate comuni (home, giocatori, regole,
   tabellone finale), la lista dei giocatori, il passaggio
   del telefono e il giro di partita (comincia / fine / rigioca).

   Un gioco si "innesta" chiamando SG.registra({...}).
   Vedi docs/COME-SI-AGGIUNGE-UN-GIOCO.md

   Dal 4 nov 2026 il cuore è diviso: qui restano l'avvio, gli aiuti comuni,
   la prima schermata e il giro di partita; il resto sta nei suoi pezzi in
   js/cuore/ (avatar, trofei, classifica, profilo, bot, mondo, tornei,
   sala-voto, sala-sfide, sala, saletta, rete: l'elenco è in AGENTS.md).
   Si parlano con window.SGCuore: vedi in fondo «AI PEZZI DEL CUORE».
   ========================================================= */
(function () {
  "use strict";

  // Niente zoom col pizzico su iPhone (Safari ignora user-scalable=no). I giochi che hanno un loro "pizzico" usano i tocchi, non questi eventi.
  ["gesturestart", "gesturechange", "gestureend"].forEach(function (n) { document.addEventListener(n, function (e) { e.preventDefault(); }, { passive: false }); });
  var cuore = window.SGCuore = {};   // i pezzi del cuore (js/cuore/*.js) si parlano da qui: vedi in fondo «AI PEZZI DEL CUORE»

  // Altezza VERA dello schermo: il browser a volte (es. dopo un "ricarica" con l'app installata)
  // crede che lo schermo sia più alto di quello che si vede, e i tasti in fondo finiscono fuori.
  // La misuro io e la rimisuro appena cambia qualcosa.
  (function altezzaVera() {
    // ⌨️ La tastiera (11 nov 2026, serata in 8: Balla e Scarabocchio illeggibili con la tastiera aperta).
    // --alt = l'altezza che si vede DAVVERO (sopra la tastiera); --alt-piena = quella senza tastiera.
    // Con un campo attivo e lo schermo che si abbassa di colpo: <html class="tastiera"> (i giochi tengono
    // grande la cosa da leggere), e la pagina NON scorre: niente vuoto sotto la tastiera, si torna sempre su.
    var vv = window.visualViewport, piena = 0, largo = 0, ferma = false;   // ferma = la schermata stava tutta nello schermo (i giochi): solo lì la pagina si blocca
    function scrive() {
      var a = document.activeElement; if (!a || a === document.body) return false;
      var tag = (a.tagName || "").toLowerCase();
      if (tag === "textarea" || a.isContentEditable) return true;
      return tag === "input" && !/^(button|checkbox|radio|range|submit|reset|file|color|image|hidden)$/i.test(a.type || "");
    }
    function suInCima() {   // la pagina sta ferma: il telefono a volte la fa scorrere per mostrare il campo
      if (!ferma) return;   // una pagina lunga (es. le regole) scorre come sempre: il telefono porta il campo a vista
      if (window.scrollY || window.pageYOffset) window.scrollTo(0, 0);
      var su = vv && document.documentElement.classList.contains("tastiera") ? Math.max(0, Math.round(vv.offsetTop)) : 0;
      document.documentElement.style.setProperty("--vv-su", su + "px");   // iPhone: la parte visibile può restare spostata in giù anche a pagina ferma
    }
    function misura() {
      var h = Math.round((vv ? vv.height : window.innerHeight) || window.innerHeight || 0);
      if (!(h > 0)) return;   // con la pagina nascosta vale 0: non lo segno (resta l'altezza di prima)
      var w = Math.round(window.innerWidth || 0);
      if (Math.abs(w - largo) > 40) { largo = w; piena = 0; }   // telefono girato: si rimisura da capo
      var su = scrive() && piena > 0 && h < piena * 0.82;
      if (!su) piena = h;   // senza tastiera l'altezza piena è quella di adesso (anche se cambia la barra del browser)
      var de = document.documentElement;
      de.style.setProperty("--alt", h + "px");
      de.style.setProperty("--alt-piena", (su ? piena : h) + "px");
      if (de.classList.contains("tastiera") !== su) {
        if (su) ferma = fermaPrima;
        de.classList.toggle("tastiera", su);
        de.classList.toggle("tastiera-ferma", su && ferma);
        try { window.dispatchEvent(new CustomEvent("sg-tastiera", { detail: { su: su, alt: h, piena: piena } })); } catch (e) {}
      }
      if (su) suInCima(); else de.style.setProperty("--vv-su", "0px");
    }
    var fermaPrima = false;   // misurata quando si tocca il campo, PRIMA che la tastiera salga (dopo iPhone ha già fatto scorrere la pagina)
    function guarda() { if (document.documentElement.classList.contains("tastiera")) return; var se = document.scrollingElement || document.documentElement; fermaPrima = !(window.scrollY || window.pageYOffset) && se.scrollHeight <= Math.max(piena, window.innerHeight || 0) + 4; }
    function presto() { guarda(); misura(); [60, 200, 450, 800].forEach(function (ms) { setTimeout(misura, ms); }); }
    misura();
    window.addEventListener("resize", misura);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) misura(); });
    window.addEventListener("orientationchange", function () { setTimeout(misura, 250); });
    window.addEventListener("pageshow", misura);
    document.addEventListener("focusin", presto);
    document.addEventListener("pointerdown", guarda, true);
    document.addEventListener("focusout", function () { setTimeout(misura, 80); setTimeout(misura, 400); });
    window.addEventListener("scroll", function () { if (document.documentElement.classList.contains("tastiera")) suInCima(); }, { passive: true });   // (suInCima guarda ferma)
    if (vv) { vv.addEventListener("resize", misura); vv.addEventListener("scroll", function () { if (document.documentElement.classList.contains("tastiera")) suInCima(); }); }
    [100, 400, 1000].forEach(function (ms) { setTimeout(misura, ms); });   // dopo il caricamento le barre si assestano
    cuore.tastieraSu = function () { return document.documentElement.classList.contains("tastiera"); };
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
    tris: "sfida", trisgigante: "sfida", drop4: "sfida", hockey: "sfida", navale: "sfida", calciobiliardo: "sfida",
    asta: "festa", astafanta: "festa", lanterne: "festa", impostore: "festa", sipero: "festa", scarabocchio: "festa", lunghezza: "festa", chidinoi: "festa", memata: "festa",
    scalinata: "mini", horto: "mini", pendolo: "mini", pallamatta: "mini", garapesca: "mini",
    timeline: "parole", nomicose: "parole", patata: "parole", taboo: "parole", balla: "parole", prezzo: "parole", unaparola: "parole", dadoveviene: "parole", muro: "parole"
  };
  var catAttiva = "tutti";
  function catDi(g) { return CAT_GIOCO[g.id] || null; }
  // Giochi che hanno la modalità "ognuno dal suo telefono" (usabili nella Sala online).
  var GIOCHI_ONLINE = { lanterne: 1, asta: 1, astafanta: 1, blackjack: 1, poker: 1, ruota: 1, ordine: 1, drop4: 1, horto: 1, navale: 1, nomicose: 1, patata: 1, pendolo: 1, scalinata: 1, scopa: 1, scopa2v2: 1, sipero: 1, timeline: 1, tris: 1, trisgigante: 1, scarabocchio: 1, taboo: 1, calciobiliardo: 1, pallamatta: 1, garapesca: 1, balla: 1, lunghezza: 1, chidinoi: 1, scopone: 1, impostore: 1, prezzo: 1, unaparola: 1, dadoveviene: 1, memata: 1, muro: 1 };
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
      tab("trofei", "🏆 Trofei", cuore.schermataSfide),
      tab("classifica", "👥 Classifica", function () { cuore.schermataAmici(); }, "home-amici", [ el("span", { text: "👥 Classifica" }), cuore.cacheRich && cuore.cacheRich.arrivate.length ? el("span", { class: "pallino" }) : null ]),
      tab("profilo", "Profilo", function () { cuore.schermataAccesso(schermataHome); }, "ms-io", [
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
  // ---- 📶 LA RETE (rientro e memoria delle stanze, la ripresa, schermo acceso, lo strato comune della rete agganciaRete, l'host di riserva, chi guarda soltanto, il controllo della rete): in js/cuore/rete.js. Qui restano gli ascoltatori (app in secondo piano, pagina che se ne va) per tenere l'ordine di prima ----
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && cuore.schermoVoluto && !cuore.schermoLock) cuore.tieniAcceso(true); });

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
    cuore.vivaOra();   // in saletta l'avatar dell'host diventa grigio con 📶
  });
  // "📶 Mi ricollego…": la rete è saltata dopo il collegamento (la partita non si chiude: mqtt riprova da solo).
  // Compare solo se dura più di un secondo e mezzo, così un buco piccolissimo non fa lampeggiare niente
  var reteGiu = {}, tReteGiu = null;
  window.addEventListener("sg-rete", function (e) {
    var d = e.detail || {};
    if (d.giu) reteGiu[d.id] = 1; else delete reteGiu[d.id];
    if (!Object.keys(reteGiu).length) { clearTimeout(tReteGiu); tReteGiu = null; pillola("rete", null); cuore.vivaOra(); return; }
    if (!tReteGiu && !PILLOLE.n.rete) tReteGiu = setTimeout(function () { tReteGiu = null; if (Object.keys(reteGiu).length) { pillola("rete", "📶 Mi ricollego…", "blu"); cuore.vivaOra(); } }, 1500);
  });
  // "😴 La stanza è ferma": chi l'ha aperta è uscito dall'app (l'ha detto il broker) o non risponde.
  // Copre tutto (niente partita congelata sotto); se l'host torna si sparisce da soli e si entra.
  var FERMA = null;
  window.addEventListener("sg-stanza-ferma", function (e) {
    var d = e.detail || {}, R = cuore.reteOsp;
    if (!d.ferma) { if (FERMA && FERMA.codice === d.stanza) togliFerma(); return; }
    var gioco = R && R.codice === d.stanza && !R.guarda && R.P && R.P.viva() && !R.P.salaCtx;
    // la Sala di una Compagnia trovata morta (o che non risponde) entrando: chi ha il profilo la riapre lui (gen + 1),
    // chi non ce l'ha aspetta che la apra qualcuno ("🕐 Nessuno ancora")
    if (cuore.salaG && cuore.salaG.codice === d.stanza && (cuore.salaG.comp || cuore.salaG.aspetta || cuore.salaG.codice.length === 6)) return salaMortaComp(cuore.salaG, !!d.muta);
    var inSala = cuore.salaG && cuore.salaG.codice === d.stanza && !cuore.salaG.membri.length;   // la Sala: solo chi non c'era ancora (chi c'era aspetta l'host)
    if (gioco || inSala) mostraFerma(d.stanza, !!d.muta, !!inSala);
  });
  // la Sala morta della Compagnia: rileggo la stanza (gen e sessione dell'ultimo host) e la riapro io con gen + 1,
  // con gli stessi amici se l'ultima foto l'avevo vista (hanno 30 s per rientrare). Se intanto l'ha riaperta un altro, resto
  function salaMortaComp(S, muta) {
    if (S.riapro) return;
    if (!profiloAttivo()) { if (!S.membri.length && !document.querySelector(".cmp-aspetta")) cuore.schermataAspettaComp(S); return; }
    S.riapro = true;
    var C = S.codice, ult = S.ultima && S.ultima.t === "sala" ? S.ultima : null;
    SGNet.sbircia([C], function (es) {
      if (cuore.salaG !== S) return;
      var r = (es && es[C]) || { stato: "boh", msg: null, gen: 0 }, msg = r.msg;
      // una Sala viva che non è quella morta (riaperta da un altro intanto): la seguo da amico, arriva da sola
      if (r.stato === "viva" && msg && msg._s && !(ult && msg._s === ult._s)) { S.riapro = false; return; }
      var gen = Math.max(+r.gen || 0, ult ? cuore.capoDi(ult).gen : 0);
      var sopra = (msg && (msg._s || msg.s)) || (ult && ult._s) || null;
      var comp = S.comp || cuore.compDi(C) || cuore.compVuota(C), mioPrima = cuore.mioIdSala(S);
      lasciaPartita(); cuore.chiudiSalaOspite();
      cuore.creaSala({ codiceFisso: C, comp: comp, gen: gen + 1, sopra: sopra, mioId: mioPrima,
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
          if (sala) { cuore.chiudiSalaOspite(); return schermataHome(); }
          lasciaPartita(); cuore.dimenticaStanza(); SGNet.chiudiGiochi(); tornaHome();
        } })
      ])
    ]);
    document.body.appendChild(nodo);
    FERMA = { nodo: nodo, codice: codice, tit: t, sotto: s };
  }
  function togliFerma() { if (!FERMA) return; if (FERMA.nodo.parentNode) FERMA.nodo.parentNode.removeChild(FERMA.nodo); FERMA = null; }

  // in home, sotto il profilo: "🔗 Gioca online" (o "👥 Torna nella Sala") e "🔑 Ho un codice", uno accanto all'altro
  function rigaOnline() {
    var hostG = cuore.salaG && (cuore.salaG.nomeHost || ((cuore.salaG.membri || []).filter(function (m) { return m.id === "host"; })[0] || {}).nome);
    var gioca = cuore.sala ? { t: "👥 Torna nella Sala", s: cuore.sala.codice && cuore.sala.codice !== "…" ? "codice " + cuore.sala.codice : "è aperta", via: cuore.disegnaSalaHost }
      : cuore.salaG ? { t: "👥 Torna nella Sala", s: hostG ? "di " + hostG : "codice " + cuore.salaG.codice, via: cuore.disegnaSalaOspite }
      : { t: "🔗 Gioca online", s: "Un codice per la serata", via: function () { cuore.creaSala(); } };
    function tasto(cls, o) {
      return el("button", { class: "btn " + cls, onclick: function () { o.via(); } }, [ el("span", { text: o.t }), el("small", { text: o.s }) ]);
    }
    return el("div", { class: "home-online" }, [
      tasto("btn-primario ho-gioca" + (cuore.sala || cuore.salaG ? " ho-torna" : ""), gioca),
      tasto("ho-codice", { t: "🔑 Ho un codice", s: "Entra da un amico", via: function () { entraConCodice(); } })
    ]);
  }
  // in home, sotto la riga online: "🔁 Riapri la Sala di ieri sera (Giulia, Luca, Marco)" ("di prima" se è di oggi) e ✕
  function rigaIeri(o) {
    var n = o.nomi, chi = n.length > 3 ? n[0] + ", " + n[1] + " e altri " + (n.length - 2) : (n.length > 1 ? n.slice(0, -1).join(", ") + " e " + n[n.length - 1] : n[0]);
    var quando = Date.now() - (+o.t || 0) < cuore.SERA_IERI ? "di prima" : "di ieri sera";
    // (due righe piccole: a 360 px in una riga sola i nomi non ci stanno)
    var riga = el("div", { class: "home-ieri" }, [
      el("button", { class: "btn btn-fantasma btn-piccolo hi-riapri", onclick: function () { cuore.riapriSalaIeri(o); } }, [
        el("span", { class: "hi-t", text: "🔁 Riapri la Sala " + quando }), el("small", { class: "hi-chi", text: "con " + chi }) ]),
      el("button", { class: "hi-x", "aria-label": "Non mostrarla più", text: "✕", onclick: function () {
        cuore.dimenticaSalaIeri(o.codice);
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
    if (!s) s = cuore.sala || cuore.salaG ? "sala" : "app";
    if (s === "sala" && !codice) codice = (cuore.sala && cuore.sala.codice) || (cuore.salaG && cuore.salaG.codice) || null;
    try { SGAmiciOnline.stato(s, codice && codice !== "…" ? codice : undefined); } catch (e) {}
  }
  // gli amici online sono cambiati (evento di js/amici-online.js, al massimo uno al secondo): solo i pezzi che lo dicono
  function amiciCambiati(e) {
    var l = (e && e.detail && e.detail.lista) || [];
    aggiornaAmiciOn(l);
    var U = cuore.SL.ultimo;   // il pallino nel tasto "➕ Invita" (se all'inizio non c'era nessuno, arriva adesso)
    if (U && U.invModo === "amici" && U.link && document.body.contains(U.link) && l.length && !U.link.querySelector(".ao-badge")) {
      var b = SGAmiciOnline.badge(); if (b) U.link.appendChild(b);
    }
  }
  // sto giocando una partita (la sua schermata è quella che si vede)?
  function staGiocando() { var P = partitaCorrente; return !!(P && P.viva() && P.vista && document.body.contains(P.vista)); }
  // il nome della Sala in cui invito ("Sala di Paky", o la Compagnia) e il gioco che c'è adesso
  function invitoSalaInfo() {
    var S = cuore.sala || cuore.salaG; if (!S) return { nome: "La Sala", gioco: "" };
    var nome = S.comp && S.comp.nome ? (S.comp.emoji ? S.comp.emoji + " " : "") + S.comp.nome
      : "Sala di " + (cuore.sala ? ((cuore.sala.membri[0] && cuore.sala.membri[0].nome) || "") : (cuore.salaG.nomeHost || "un amico"));
    var gid = cuore.sala ? cuore.sala.gioco : (cuore.salaG.giocoSala && cuore.salaG.giocoSala.gioco), g = gid ? giocoDa(gid) : null;
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
      condividi: function (b) { if (U.linkUrl) cuore.condividiLink(U.linkUrl, U.gObj || { id: "__sala", nome: "Sala online" }, b); } });
  }
  // la Sala appena aperta (o riaperta) dalla home: il foglio "➕ Invita" appena c'è il codice
  function invitaQuandoPronta() {
    var t0 = Date.now();
    (function prova() {
      var U = cuore.SL.ultimo;
      if (U && U.gid === "__sala" && U.invModo === "amici" && U.linkUrl && /^[A-Z0-9]{4,8}$/.test(U.invCod || "") && document.body.contains(U.s)) {
        if (!document.querySelector(".sl-velo")) apriInvitaAmici(U);
        return;
      }
      if ((cuore.sala || cuore.salaG) && Date.now() - t0 < 15000) setTimeout(prova, 300);
    })();
  }
  // in home, sotto "🔗 Gioca online": "🟢 Giulia e altri 2 sono nell'app · 📨 Chiama" (fino a 4 avatar). Si aggiorna da sola
  // all'evento degli amici, senza rifare la home; nascosta se non c'è nessuno. Tocco: la mia Sala (o una nuova) e il foglio
  function rigaAmiciOn() {
    if (!conAmici()) { HAO = null; return null; }
    var avs = el("span", { class: "hao-av", "aria-hidden": "true" }), tx = el("span", { class: "hao-tx" });
    var b = el("button", { class: "home-amici-on", type: "button", hidden: "hidden", onclick: function () {
      if (cuore.sala) cuore.disegnaSalaHost(); else if (cuore.salaG) cuore.disegnaSalaOspite(); else cuore.creaSala();
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
    if ((cuore.sala && cuore.sala.codice === codice) || (cuore.salaG && cuore.salaG.codice === codice)) {   // ci sono già: al massimo la rimetto davanti
      if (!gioca && !document.querySelector(".saletta-schermo")) { if (cuore.sala) cuore.disegnaSalaHost(); else cuore.disegnaSalaOspite(); }
      return;
    }
    function vai() {
      if (cuore.sala) cuore.chiudiSala();
      lasciaPartita();
      if (window.SGNet && SGNet.chiudiGiochi) SGNet.chiudiGiochi();
      cuore.chiudiSalaOspite();
      cuore.salaOspite(codice);
    }
    var amiciMiei = cuore.sala ? cuore.sala.membri.filter(function (m) { return m && m.id !== "host"; }).length : 0;
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
    var conSala = cuore.salaSempre();
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
    if (cuore.codiceComp(c)) { var v = null; try { v = window.SGCompagnia ? SGCompagnia.trova(c) : null; } catch (e) {} return cuore.apriCompagnia(c, { nome: v && v.n, emoji: v && v.e, daCodice: riprova || function () { entraConCodice(); } }); }
    var s = schermata({ icona: "🔗", titolo: "Entro nella stanza…", sotto: "Codice " + c });
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Cerco la partita in corso… un attimo." }));
    mostra(s);
    SGNet.scopriGioco(c, function (gid) {
      if (!document.body.contains(s)) return;   // intanto si è andati altrove
      if (gid === "__sala") return cuore.salaOspite(c);   // è una Sala, non un singolo gioco
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
    if (cuore.sala && cuore.sala.inGioco && !cuore.sala.elim) { cuore.sala.gioco = cuore.sala.stanza = null; cuore.sala.inGioco = false; cuore.sala.fase = null; cuore.sala.fuori = {}; cuore.sala.ctx = null; cuore.sala.duello = null; if (cuore.sala._bcast) cuore.sala._bcast(); }
    cuore.chiudiTabelloneElim();
    cuore.tieniAcceso(false);
    var s = schermata({});
    s.className += " home";
    var io = profiloAttivo();
    // riga profilo: il nome utente (col livello e le Speed Coins) + il tasto "Novità" affianco
    var prog = io && io.cloud && window.SGLivelli && SGNube.progressione ? SGNube.progressione() : null;
    var profiloChip = el("button", { class: "profilo-chip" + (prog ? " con-livello" : ""), onclick: function () { cuore.schermataAccesso(schermataHome); } },
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
    if (CITTA_VISIBILE && window.SGCitta) rigaProfilo.appendChild(el("button", { class: "home-novita home-citta", onclick: cuore.schermataCitta }, [ el("span", { text: "🏙️ La città" }) ]));
    rigaProfilo.appendChild(el("button", { class: "home-novita", onclick: cuore.schermataSfide }, [ el("span", { text: "🏆 Trofei" }) ]));
    rigaProfilo.appendChild(el("button", { class: "home-novita home-amici", onclick: function () { cuore.schermataAmici(); } }, [ el("span", { text: "👥 Classifica" }), cuore.cacheRich && cuore.cacheRich.arrivate.length ? el("span", { class: "pallino" }) : null ]));
    setTimeout(function () { cuore.aggiornaRichieste(); }, 0);   // richieste di amicizia nuove? pallino sul tasto
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
      // 📲 chi non ha installato l'app vede in alto a destra «Installa l'app» al posto delle monete (31 ott 2026: in fondo alla pagina
      //  nessuno lo trovava; le monete restano nel Profilo); chi l'ha installata vede le monete
      if (!giaApp) testaCorta = el("button", { class: "ms-installa", onclick: installa }, [ el("span", { text: "📲 Installa l'app" }) ]);
      else testaCorta = prog ? el("button", { class: "ms-monete", "aria-label": "Il tuo profilo e le Speed Coins", onclick: function () { cuore.schermataAccesso(schermataHome); } }, [ el("span", { text: "🪙 " + cifre(prog.coins) }) ]) : null;
      s._menu = "giochi";
    }
    s._contenuto.appendChild(el("div", { class: "home-hero" }, [
      el("div", { class: "home-logo", html: '<svg viewBox="0 0 200 118" width="156" height="92" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="sgBolt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6bf"/><stop offset=".42" stop-color="#ffd23b"/><stop offset=".72" stop-color="#f6a70c"/><stop offset="1" stop-color="#c06a08"/></linearGradient><linearGradient id="sgBoltHi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf0" stop-opacity=".95"/><stop offset=".5" stop-color="#ffffff" stop-opacity="0"/></linearGradient><filter id="sgGlow" x="-70%" y="-70%" width="240%" height="240%"><feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="#ff9d2e" flood-opacity=".75"/><feDropShadow dx="0" dy="0" stdDeviation="16" flood-color="#ff7b16" flood-opacity=".4"/></filter><path id="sgB" d="M13 0 L2 20 L10 20 L7 36 L22 12 L13 12 L17 0 Z"/></defs><g filter="url(#sgGlow)" stroke="#8a5209" stroke-width="1.3" stroke-linejoin="round"><use href="#sgB" transform="translate(18,34) scale(1.5)" fill="url(#sgBolt)"/><use href="#sgB" transform="translate(78,14) scale(1.95)" fill="url(#sgBolt)"/><use href="#sgB" transform="translate(150,34) scale(1.5)" fill="url(#sgBolt)"/></g><g stroke="none"><use href="#sgB" transform="translate(18,34) scale(1.5)" fill="url(#sgBoltHi)"/><use href="#sgB" transform="translate(78,14) scale(1.95)" fill="url(#sgBoltHi)"/><use href="#sgB" transform="translate(150,34) scale(1.5)" fill="url(#sgBoltHi)"/></g></svg>' }),
      el("h1", { class: "home-titolo", html: "SPeeD <b>GAME</b>" }),   // (🌙 «GAME» col lampone)
      HOME_MENU_SOTTO ? testaCorta : rigaProfilo
    ]));
    // stavi giocando da ospite e la pagina si è ricaricata (o hai riaperto l'app)? Si rientra al proprio posto
    // (rStanza: non "rientro", che è il ritorno all'edificio della città e qui sopra si azzera)
    var rStanza = cuore.stanzaRecente();
    if (rStanza) {
      var gR = rStanza.gioco ? giocoDa(rStanza.gioco) : null;
      s._contenuto.appendChild(el("div", { class: "home-rientra" }, [
        el("button", { class: "btn btn-primario", onclick: function () { cuore.rientraStanza(rStanza); } }, [
          el("span", { text: "🔁 Rientra nella partita" }),
          el("small", { text: rStanza.sala ? "👥 Sala online · stanza " + rStanza.sala : (gR ? gR.icona + " " + gR.nome : "Partita") + " · stanza " + rStanza.stanza }) ]),
        el("button", { class: "home-rientra-x", "aria-label": "Non rientrare", text: "✕", onclick: function () { cuore.dimenticaStanza(); schermataHome(); } })
      ]));
    }
    // l'online in alto, a un tocco: "🔗 Gioca online" (apre la Sala della serata) e "🔑 Ho un codice"
    var conSala = cuore.salaSempre();
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
    // (31 ott 2026, il proprietario: in home «Riapri la Sala» e «Giocato di recente» occupano solo spazio: tolti col menu sotto;
    //  il gruppo fisso c'è già, sono le tessere delle Compagnie qui sopra)
    var ieri = conSala && !cuore.sala && !cuore.salaG && !HOME_MENU_SOTTO ? cuore.salaDiIeri() : null;
    if (ieri) s._contenuto.appendChild(rigaIeri(ieri));
    // "👥 Giocato di recente": con chi ho giocato online ("Luca · 🎲 Tris", ➕ per chiedere l'amicizia col profilo online)
    var rec = null;
    if (conSala && !HOME_MENU_SOTTO && window.SGCompagnia && SGCompagnia.rigaRecenti) try {
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
          var tess = tesseraGioco(g, function () { cuore.apriGioco(g); }, true);
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
    azioni.appendChild(el("button", { class: "azione", text: "💡 Proposte", onclick: cuore.schermataProposte }));
    azioni.appendChild(el("button", { class: "azione", text: "🐞 Bug", onclick: cuore.schermataBug }));
    // con la Sala in alto: il torneo è un tasto piccolo qui (Sala e codice stanno nella riga online)
    if (conSala) azioni.appendChild(el("button", { class: "azione", text: (cuore.torneo || (cuore.sala && cuore.sala.torneo)) ? "🏆 Riprendi la serata a punti" : "🏆 Serata a punti", onclick: cuore.apriTorneo }));
    if (!giaApp && !tInstalla && !HOME_MENU_SOTTO) azioni.appendChild(el("button", { class: "azione", text: "📲 Installa l'app", onclick: installa }));
    s._piede.appendChild(azioni);
    if (rec) recInHome(rec, barra);
    if (conSala) return mostra(s);

    // Torneo: più giochi di fila con gli stessi giocatori, punti che si sommano
    s._piede.appendChild(el("button", {
      class: "btn btn-primario", html: (cuore.torneo || (cuore.sala && cuore.sala.torneo)) ? "🏆 Riprendi la serata a punti" : "🏆 Serata a punti (più giochi di fila)",
      onclick: cuore.apriTorneo
    }));

    // Sala online: crea un gruppo che passa da un gioco all'altro (ognuno dal suo telefono)
    s._piede.appendChild(el("button", {
      class: "btn btn-fantasma", html: "👥 Sala online (porta il gruppo tra i giochi)",
      onclick: cuore.creaSala
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

  // ---- 🏙️ IL MONDO (ruota del giorno, città, casa e negozio, pesca, scavi, giardino, sfide del giorno, edifici, Casinò e Circolo): in js/cuore/mondo.js. Qui restano extra.js e CITTA_VISIBILE ----
  // ---- il giardino fuori casa (js/giardino.js): piante, orto, decorazioni e cesto nel profilo e su questo telefono ----
  // ---- i disegni della casa nuova, del casinò e della città a piedi: nella versione online stanno in un file a parte (extra.js),
  //      scaricato solo da chi li usa (così l'app si apre più in fretta per tutti); nella cartella di lavoro ci sono già ----
  var attesaExtra = null;
  // 🏙️ la città (con casa, casinò, circolo e scavi) per ora è spenta per tutti (29 ott 2026, il proprietario: «rimuoviamo la città
  // visibile per adesso, non farla scaricare a nessuno»): niente tasto in home, niente disegni scaricati. true = torna com'era
  // (costruisci-versione-online.sh guarda questa riga: con false la versione online non contiene i file della città)
  var CITTA_VISIBILE = false;
  function serveExtra() { return CITTA_VISIBILE && !window.SGGiardino && !!window.SG_EXTRA && (GIARDINO_PRONTO || cuore.CITTA_A_PIEDI || eProprietario()); }
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
  var PROPRIETARIO = "IL PAPPONE";
  function eProprietario() { var io = profiloAttivo(); return String((io && io.nome) || "").trim().toUpperCase() === PROPRIETARIO; }
  // 🧍 GLI AVATAR NUOVI «Mii rifinito» (29 ott 2026): lo stesso avatar di ognuno, disegnato senza contorni scuri e con occhi più veri
  // (lo stile "rifinito" di SGOmino). Dal 29 ott 2026 pomeriggio lo vedono TUTTI (il proprietario li ha guardati: «vanno bene»);
  // con "proprietario" lo vedrebbe solo IL PAPPONE, che dal suo profilo lo spegne e lo riaccende («🧍 Avatar nuovi», sg-avatar-stile).
  // AVATAR_NUOVO: "nessuno" = spento per tutti · "proprietario" = solo lui · "tutti" = per tutti.
  var AVATAR_NUOVO = "tutti";
  function avatarNuoviSpenti() { try { return localStorage.getItem("sg-avatar-stile") === "classico"; } catch (e) { return false; } }
  // 🎨 GLI AVATAR «ILLUSTRATI» (strada A, 5 nov 2026: chat «🧍 Avatar A»): proporzioni vere, occhi naso e bocca veri, capelli a ciocche,
  // luce e volumi («un minimo di simil 3D»). Li disegna js/omino-a.js (con i pezzi in js/omino-a-pezzi.js), che si scarica solo
  // per chi li vede (pezzo "avatar-a" in js/elenco-giochi.js). Le pose non ancora ridisegnate (seduto, di spalle) restano «rifinito».
  // AVATAR_A: "nessuno" = spento · "proprietario" = solo gli account di AVATAR_A_CHI (dal profilo li spengono e riaccendono, sg-avatar-a) · "tutti".
  // AVATAR_A_CHI (6 nov 2026, il proprietario: «gli avatar per il momento solo per l'account "il pappone" e "mario"»): i nomi dei
  // profili, confrontati come per IL PAPPONE (senza spazi ai lati, maiuscole e minuscole uguali). MARIO = Mario De Viva (Lanterne).
  var AVATAR_A = "tutti";
  var AVATAR_A_CHI = [PROPRIETARIO, "MARIO"];
  function avatarAAmmesso() { var io = profiloAttivo(); return AVATAR_A_CHI.indexOf(String((io && io.nome) || "").trim().toUpperCase()) >= 0; }
  function avatarASpento() { try { return localStorage.getItem("sg-avatar-a") === "0"; } catch (e) { return false; } }
  function avatarAVoluto() { return AVATAR_A === "tutti" || (AVATAR_A === "proprietario" && avatarAAmmesso() && !avatarASpento()); }
  var avatarAChiesto = false;
  function stileAvatar() {
    if (!window.SGOmino || !SGOmino.stile) return;
    var base = AVATAR_NUOVO === "tutti" || (AVATAR_NUOVO === "proprietario" && eProprietario() && !avatarNuoviSpenti()) ? "rifinito" : "classico";
    if (avatarAVoluto()) {
      if (window.SGOminoA) { SGOmino.stile("illustrato"); return; }
      SGOmino.stile(base);   // intanto quello di sempre; appena arriva il disegno nuovo, la home si ridisegna
      if (!avatarAChiesto && cuore.caricaPezzo) {
        avatarAChiesto = true;
        cuore.caricaPezzo("avatar-a").then(function () { if (avatarAVoluto() && window.SGOminoA) { SGOmino.stile("illustrato"); if (document.querySelector(".home")) schermataHome(); } },
          function () { avatarAChiesto = false; });
      }
      return;
    }
    SGOmino.stile(base);
  }
  // ---- 🤖 i BOT: un gruppo fisso di personaggi, uguali in tutti i giochi (così si riconoscono: "Matt vince sempre").
  //      Nei tasti, nelle regole e nei menu si dice solo "Bot"; in partita ognuno ha il suo nome e il suo avatar.
  //      Il proprietario (IL PAPPONE) li cambia con "🤖 I Bot" nel suo profilo: si salvano nella sua scheda pubblica
  //      (come la commessa) e tutti li caricano da lì; senza internet valgono gli ultimi visti, o quelli di partenza.
  //      Per i giochi: SG.bot.prendi(n, { livello, escludi, caso }), SG.bot.tutti(), SG.bot.daId(id) ----
  var BOT_LIVELLI = ["facile", "medio", "difficile"], BOT_MAX_NOME = 12, BOT_MAX_FRASE = 70;
  // ---- 🤖 il gruppo dei Bot (BOT_PARTENZA, SG.bot.prendi, l'editor «🤖 I Bot» del proprietario): in js/cuore/bot.js ----
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
    var f = cuore.fotoCitta && Date.now() - cuore.fotoCitta.t < 8000 ? cuore.fotoCitta : null; cuore.fotoCitta = null;
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
      el("button", { class: "nb-ok", text: rientro === cuore.schermataCitta ? "Torna in piazza" : "Ho capito", onclick: esci })
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
  // ---- 🏆 SFIDE E TROFEI (la lista TROFEI, le pagine dei trofei, l'avviso «Trofeo sbloccato!», i giorni di fila): in js/cuore/trofei.js ----

  // ---- 📊 AMICI, CLASSIFICA DEI TROFEI, PROPOSTE E SEGNALAZIONI, STATISTICHE DEI GIOCHI: in js/cuore/classifica.js ----
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
      return (SGNube.utente && SGNube.utente()) || cuore.senzaRete ? cuore.profiloRicordato() : null;
    }
    var id = leggiL(K_ATTIVO, null);
    return profili().filter(function (p) { return p.id === id; })[0] || cuore.profiloRicordato();   // senza la parte dei profili (niente rete): quello ricordato
  }
  // ---- 👤 IL PROFILO (accesso, crea profilo, profili in cloud, profilo e avatar obbligatori, benvenuto, bentornato): in js/cuore/profilo.js ----
  // ---- AVATAR: l'editor degli avatar (e il primo avatar) sta in js/cuore/avatar.js ----
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
    if (p) { p.liste = p.liste || {}; p.liste[nome] = lista; cuore.salvaProfilo(p); }
  }
  // il secondo avatar la prima volta: a caso, ma dell'altra forma (maschio <-> femmina)
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
      if (torn) return cuore.iniziaTorneo();
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
    // 📦 le impostazioni le disegna il gioco: se non è ancora arrivato, «Arriva il gioco…» e poi questa schermata
    if (cuore.aspettaGioco(g, function () { schermataPreGioco(g, opts); }, { indietro: function () { if (torn) cuore.schermataTorneoHub(); else if (inSala) cuore.salaScegliGioco(); else if (modiDi(g).length > 1) schermataModo(g); else tornaHome(); } })) return;
    var modo = inSala ? "online" : (opts && opts.modo) || null, M = modo ? modoDi(g, modo) : null, online = modo === "online";
    var conAmici = !torn && !inSala && (!modo || (M && M.amici));   // la lista di chi gioca serve solo se si gioca sullo stesso telefono
    var s = schermata({ icona: g.icona, titolo: g.nome,
      sotto: torn ? ("Serata a punti · " + cuore.nomeDifficolta(cuore.pesoGioco(g))) : (inSala ? "Sala · impostazioni" : (M ? M.icona + " " + M.nome + " · impostazioni" : "Impostazioni della partita")),
      indietro: function () { if (torn) cuore.schermataTorneoHub(); else if (inSala) cuore.salaScegliGioco(); else if (conAmici) schermataSala(g, modo ? { modo: modo } : null); else if (modiDi(g).length > 1) schermataModo(g); else tornaHome(); } });
    s.classList.add("prima-fissa");   // "Comincia" sempre a vista: se le scelte sono tante scorre solo il centro
    if (!conAmici && !torn && !inSala) {
      if (online) s._contenuto.appendChild(el("p", { class: "modulo-nota sl-prima", text: "Scegli come giocare, poi apri la stanza: inviti gli amici col tasto 📤 e vi aspettate insieme nella saletta." }));
    } else if (inSala) {
      s._contenuto.appendChild(el("div", { class: "sala-sommario" }, [
        el("span", { class: "chi", text: "👥 Sala · " + (cuore.sala ? cuore.sala.membri.length : 1) + " in gioco" }) ]));
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
    var chiGioca = (conAmici || torn) ? nomiGruppo() : (inSala ? ((cuore.sala && cuore.sala.membri) || []).map(function (m) { return m.nome; }) : [(io0 && io0.nome) || nomiGruppo()[0] || "Giocatore 1"]);
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
      if (inSala) { impostazioni.modo = "online"; return cuore.salaLancia(g, impostazioni, box); }
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
    s.classList.add("scelta-giochi");   // (📱 le tessere come in home: due per riga, senza descrizione)
    var griglia = el("div", { class: "griglia-giochi compatta tess-due" });
    giochi.forEach(function (g) { if (!g.soloOnline) griglia.appendChild(tesseraGioco(g, function () { schermataPreGioco(g); }, true)); });
    s._contenuto.appendChild(griglia);
    mostra(s);
  }

  // ==== 🛋️ LA SALA DELLA SERATA (online: host, ospite, Compagnia, Classifica della serata, l'host che se ne va, il vice, chi arriva): in js/cuore/sala.js. Qui restano solo due ascoltatori (schermo girato, app in secondo piano) per tenere l'ordine di prima ====
  window.addEventListener("resize", function () { if (cuore.RIGA_PT) cuore.rigaPuntiOra(); });   // (telefono girato: la riga si rimisura)
  document.addEventListener("visibilitychange", function () {
    var S0 = cuore.sala;
    if (!S0 || S0.ceduta || S0.passa || !S0._bcast) return;
    if (document.hidden) { if (!S0.nascosta) { S0.nascosta = Date.now(); S0.pausa = S0.nascosta; S0._bcast(true); } return; }
    var via = S0.nascosta ? Date.now() - S0.nascosta : 0;
    S0.nascosta = 0;
    if (via > cuore.SALA_DORME) return cuore.salaAddormentata(S0);
    if (S0.pausa) { S0.pausa = null; S0._bcast(true); }
  });
  // ---- ⚔️ I TORNEI (a eliminazione coi gironi, il torneino nella Sala, il torneo a punti sullo stesso telefono): in js/cuore/tornei.js. Qui restano GIOCHI_ELIMINAZIONE, MAX_ELIM e giocoDa ----
  var GIOCHI_ELIMINAZIONE = { tris: 1, trisgigante: 1, drop4: 1, navale: 1, scopa: 1, calciobiliardo: 1 };
  var MAX_ELIM = 10;   // giocano i primi 10 entrati in sala; gli altri guardano
  function giocoDa(id) { return giochi.filter(function (g) { return g.id === id; })[0] || null; }

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
    var conSala = cuore.salaSempre() && !(g && g.senzaSala);   // (senzaSala in SG.registra: il gioco apre una stanza sua, col suo link, mai la Sala)
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
    if (!v || !cuore.codiceComp(v.c)) return null;
    return { modo: "compagnia", icona: v.e || "📌", nome: "Online con «" + v.n + "»", sotto: sottoCompagnia(v.c), comp: v.c };
  }
  function sottoCompagnia(C) {
    var mia = cuore.infoSalaMia(C);
    if (mia && mia.host) return "Si gioca nella tua Sala";
    if (mia) return "Sei dentro" + (cuore.salaG && cuore.salaG.nomeHost ? ": la Sala la tiene " + cuore.salaG.nomeHost : "");
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
    var mia = cuore.sala && !cuore.sala.elim && cuore.sala.codice && cuore.sala.codice !== "…";
    return Object.assign({}, MODO_ONLINE, { nome: "Online con gli amici",
      sotto: mia ? "Si gioca nella tua Sala (" + cuore.sala.codice + ")" : "Si apre la Sala: un codice per tutta la serata" });
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
      if (m.modo === "compagnia" && SGCompagnia.sbircia && !cuore.infoSalaMia(m.comp)) SGCompagnia.sbircia([m.comp], function () {
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
    if (m.modo === "eliminazione") return cuore.creaSala({ eliminazione: g.id });   // un link solo, coppie sorteggiate, chi vince va avanti
    if (m.modo === "online" && cuore.salaSempre() && !g.senzaSala) return apriOnlineSala(g);   // online = la Sala della serata
    if (m.modo === "compagnia") return cuore.giocaInCompagnia(g, m.comp);   // online nella Sala della Compagnia
    if (m.amici) return schermataSala(g, { modo: m.modo });   // sullo stesso telefono: prima gli amici, poi le impostazioni
    schermataPreGioco(g, { modo: m.modo });                  // contro il computer / online: subito le impostazioni
  }
  // "Online con gli amici": nella mia Sala se è aperta, se no se ne apre una (e il gioco parte appena ha il codice)
  function apriOnlineSala(g) {
    if (cuore.sala && cuore.sala.elim && cuore.sala.elim.torneino) return chiediConferma(cuore.sala.elim.finito ? "Si torna nella Sala?" : "Fermare il torneo?", "Gli amici passano a " + g.nome + ".", cuore.sala.elim.finito ? "Vai" : "Ferma",
      function () { if (!cuore.sala) return; cuore.fineTorneino(); cuore.salaPreparaGioco(g); });
    if (cuore.sala && cuore.sala.elim) return chiediConferma("Chiudere il torneo?", "C'è il torneo a eliminazione aperto: si chiude per tutti e si apre la Sala.", "Chiudi il torneo",
      function () { cuore.chiudiSala(); cuore.creaSala({ gioco: g.id }); });
    if (cuore.sala) {
      var gIn = (cuore.sala.inGioco || cuore.sala.duello) && giocoDa(cuore.sala.gioco);
      if (gIn) return chiediConferma("Chiudere la partita di " + gIn.nome + "?", "Gli amici passano a " + g.nome + ".", "Cambia", function () { if (cuore.sala) cuore.salaPreparaGioco(g); });
      return cuore.salaPreparaGioco(g);
    }
    if (cuore.salaG) return chiediConferma("Sei nella Sala di " + (cuore.salaG.nomeHost || "un amico"), "Esci e apri la tua?", "Apri la mia",
      function () { cuore.chiudiSalaOspite(); cuore.creaSala({ gioco: g.id }); });
    cuore.creaSala({ gioco: g.id });
  }

  // ==== ⏳ LA SALETTA D'ATTESA ONLINE (t.lobby), la saletta viva, il 3-2-1, la fine partita uguale per tutti (t.tastiFine), i suoni e i nomi buffi: in js/cuore/saletta.js ====
  // ---- Regole ----
  function schermataRegole(g, indietro) {
    if (cuore.aspettaGioco(g, function () { schermataRegole(g, indietro); }, { indietro: indietro })) return;   // (📦 le regole arrivano col gioco)
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
    if (!faccine && cuore.torneo && cuore.torneo.auto && cuore.torneo._fine === classifica) {
      var clS = cuore.classificaTorneo();
      s._piede.appendChild(el("button", { class: "fine-serata", type: "button", onclick: cuore.schermataTorneoHub,
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
    var p = SGNube.profilo(), lista = (classifica || []).filter(Boolean), mio = null, nomeQui = codice ? cuore.nomeStanza(codice) : "";
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
    if (pr) cuore.codaTrofei.push({ tipo: "xp", cls: "tl-platino", icona: "🌟", su: "PRESTIGIO " + pr + "!", nome: "Si riparte dal livello 1", sotto: "+" + cifre(monete) + " Speed Coins 🪙" });
    else if (lv) cuore.codaTrofei.push({ tipo: "xp", cls: "tl-oro", icona: "🆙", su: su, nome: "Livello " + lv + "!", sotto: "+" + cifre(monete) + " Speed Coins 🪙" });
    else cuore.codaTrofei.push({ tipo: "xp", cls: "tl-xp", icona: "⭐", su: su, nome: "Livello " + s.level, sotto: "Ancora " + cifre(SGLivelli.xpPerSalire(s.level) - s.xp) + " XP per il livello " + (s.level + 1) });
    cuore.prossimoAvviso();
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
    var nomi = SV.nomi || {}, ioId = SV.host ? "__io" : cuore.mioIdSV(SV), io = profiloAttivo();
    var mioNome = nomi[ioId] || cuore.nomeStanza(SV.codice) || (io && io.nome) || "";
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
  // la ripresa da salvare subito quando l'app va in secondo piano o la pagina se ne va (quella della partita aperta)
  var ripresaSubito = null;
  function salvaRipresaSubito() { if (ripresaSubito) try { ripresaSubito(); } catch (e) {} }
  document.addEventListener("visibilitychange", function () { if (document.hidden) salvaRipresaSubito(); });
  window.addEventListener("pagehide", salvaRipresaSubito);
  document.addEventListener("freeze", salvaRipresaSubito);
  // giochi col loro host di riserva fatto in casa: quando cambia l'host non si riavviano. Dal Passo 5 è vuoto: Parola
  // d'ordine usa l'host di riserva del core (riprende + riserva in SG.registra); resta per un gioco con hostDiRiserva: true
  var HOST_DI_RISERVA = {};
  function hostDiRiserva(g) { return !!(g && (g.hostDiRiserva || HOST_DI_RISERVA[g.id])); }
  document.addEventListener("visibilitychange", function () {
    var RS = cuore.RIS_HOST;
    if (!RS || RS.ceduto || !RS.h || RS.h._chiusa || !RS.P.viva()) return;
    var p = document.hidden ? 1 : 0;
    if (!!RS.pausa === !!p) return;
    RS.pausa = p ? Date.now() : 0;
    try { RS.h.inviaVeloce({ t: "__rp", p: p }); } catch (e) {}
  });
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
    if (lp.stanza && !lp.guarda && !salaCtx) { var st0 = { gioco: g.id, stanza: String(lp.stanza).toUpperCase() }; cuore.ricordaStanza(st0); cuore.segnaLinkSessione(st0); }
    // chi guarda soltanto (fuori dalla Sala e dal torneo): se la pagina si ricarica torna a guardare (niente "Rientra" in home)
    else if (lp.stanza && lp.guarda && !salaCtx) cuore.segnaLinkSessione({ gioco: g.id, stanza: lp.stanza, guarda: 1 });
    // online (host, ospite o dalla Sala): lo schermo resta acceso, così il collegamento non si ferma
    cuore.tieniAcceso(!!(salaCtx || lp.stanza || (impostazioni && impostazioni.modo === "online")));
    if (salaCtx || lp.stanza || (impostazioni && impostazioni.modo === "online")) amiciStato("gioco");   // (per gli amici: "🎮 sta giocando")
    var contenitore = el("div");
    var schermo = el("div");
    schermo.appendChild(contenitore);
    var P = partitaCorrente = { g: g, giocatori: giocatori, impostazioni: impostazioni, opts: opts, salaCtx: salaCtx, viva: viva, tavolo: null, miaStanza: null,
      // il codice imposto (stanza riaperta, gioco lanciato dalla Sala) e i nomi già dati valgono solo per questa partita:
      // li prende la prima stanza che apre (vedi agganciaRete), così non restano "attaccati" a una stanza dopo
      forza: (window.SGNet && SGNet._forza) || null, nomiSeme: cuore.NOMI_SEME, portaSeme: cuore.PORTA_SEME };
    if (window.SGNet) SGNet._forza = null;
    cuore.NOMI_SEME = null; cuore.PORTA_SEME = false;
    // ---- la ripresa (Passo 5): la partita di prima, se questa stanza (stesso codice imposto) era mia e il gioco riprende.
    // Oppure quella che mi ha passato l'host di riserva (RIPRESA_SEME, p5-b)
    var rip = cuore.RIPRESA_SEME; cuore.RIPRESA_SEME = null;
    if (!rip && g.riprende && P.forza) rip = cuore.ripresaDi(g.id, P.forza);
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
      cuore.scriviRipresa({ gioco: g.id, codice: h.codice, t: Date.now(), io: tavolo.mioId, gen: (ripresa && ripresa.gen) || 1,
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
        if (lp.stanza && !lp.guarda) cuore.dadoNelleSchermate(s, g, lp.stanza);   // chi entra senza profilo: il benvenuto, l'avatar e il 🎲
        mostra(s);
        P.vista = s;   // (la schermata della partita: serve a sapere se sto giocando, vedi staGiocando)
        // chi guarda soltanto: in basso la targhetta "👀 Guardi · 😂 · ✕" (non nel torneo a eliminazione: lì c'è il tabellone)
        if (lp.guarda && !(salaCtx && salaCtx.tabellone)) cuore.chipGuardo(P);
      },

      // il nome con cui questo telefono entra da solo in una stanza (se c'è, niente schermata del nome):
      // nella Sala quello della Sala (se c'erano due "Luca", il mio è "Luca 2"), poi il profilo,
      // poi il nome già usato in questa stanza (chi non ha il profilo non lo riscrive se la pagina si ricarica)
      nomeProfilo: function () {
        if (salaCtx && cuore.salaG && cuore.salaG.nome) return cuore.salaG.nome;
        var p = profiloAttivo(); if (p && p.nome) return String(p.nome).trim().slice(0, 16);
        var nS = lp.stanza ? cuore.nomeStanza(lp.stanza) : "";
        // chi guarda soltanto non deve mai vedere la schermata del nome
        if (!nS && lp.guarda) { try { nS = String(localStorage.getItem("sg-nome-ospite") || "").trim().slice(0, 16); } catch (e) {} nS = nS || "Pubblico"; }
        return nS;
      },
      // l'avatar di questo telefono (da mandare quando si entra in una stanza online)
      mioOmino: function (nome) {
        var p = profiloAttivo(); if (p && p.omino) return p.omino;
        if (salaCtx && cuore.salaG && cuore.salaG.omino) return cuore.salaG.omino;
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
        if (o && !o.host && !o._rete && cuore.reteOsp && cuore.reteOsp.P === P) o = Object.assign({}, o, { _rete: cuore.reteOsp.h });
        if (o && o.host && !o._rete && reteXp && reteXp._P === P) o = Object.assign({}, o, { _rete: reteXp });
        // un gioco della Sala: in testata il codice e il link della Sala (uno per tutta la serata), per l'host e per chi entra.
        // Il torneo a eliminazione no: lì le partite sono tra due e si invita dal tabellone
        if (o && salaCtx && !salaCtx.tabellone && cuore.salaSempre()) {
          var sS = cuore.sala && cuore.sala.codice && cuore.sala.codice !== "…" ? { codice: cuore.sala.codice, host: cuore.sala.membri[0] && cuore.sala.membri[0].nome }
            : (cuore.salaG ? { codice: cuore.salaG.codice, host: cuore.salaG.nomeHost } : null);
          if (sS) o = Object.assign({}, o, { sala: { codice: sS.codice, link: cuore.linkSala(sS.codice), host: sS.host || "" } });
        } else if (o && salaCtx && salaCtx.tabellone && !o.host) o = Object.assign({}, o, { senzaInvito: true });
        // un gioco della Sala: chi della Sala non è ancora arrivato ("Arrivano: 3 su 4", le sagome, "Comincia senza Marco")
        if (o && salaCtx && !salaCtx.tabellone) o = Object.assign({}, o, { _attesiDi: function (gio, SVg) { return viva() ? cuore.attesiSala(g, gio, SVg, tavolo) : []; } });
        var s = cuore.saletta(g, o, (opts && opts.regole) ? { box: opts.regole, imp: tavolo.impostazioni, tavolo: tavolo } : null);
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
      tastiFine: function (piede, o) { return viva() ? cuore.tastiFineCore(piede, o, { P: P, tavolo: tavolo }) : false; },
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
      postiOnline: cuore.postiDi(g),   // quanti posti ha online (g.postiOnline, se no 10)
      // la fila delle faccine della saletta, da mettere dove si aspetta o si guarda (es. la classifica finale, chi guarda
      // una partita a due): il mio avatar le fa sui telefoni di tutti. null se la partita non è online
      // (anche per chi guarda soltanto: le sue faccine arrivano a tutti, col suo nome)
      faccine: function () {
        var h = reteXp && reteXp._P === P ? reteXp : (cuore.reteOsp && cuore.reteOsp.P === P ? cuore.reteOsp.h : null);
        if (!h || !h._sv) return null;
        return cuore.vassoioFaccine(function () { return viva() ? h._sv : null; });
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
        if (!viva() || !salaCtx || !cuore.sala || cuore.sala.ctx !== salaCtx || !reteXp || reteXp._P !== P) return;
        var tx = String(testo == null ? "" : testo).replace(/\s+/g, " ").trim().slice(0, 40);
        if (tx === cuore.sala.punto && !P.puntoT) return;
        P.puntoTx = tx;
        if (P.puntoT) return;   // (già in coda: parte l'ultimo)
        var manda = function () {
          P.puntoT = null;
          if (!viva() || !cuore.sala || cuore.sala.ctx !== salaCtx || P.puntoTx === cuore.sala.punto) return;
          cuore.sala.punto = P.puntoTx; cuore.sala.puntoDi = cuore.sala.stanza; P.puntoQ = Date.now();
          if (cuore.sala._bcast) cuore.sala._bcast();
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
          var h0 = reteRip(); if (h0) cuore.scordaRipresa(h0.codice); else if (P.forza) cuore.scordaRipresa(P.forza);
          if (P.riserva) cuore.copiaRiserva(P.riserva, null);   // (i vice buttano la copia: niente da portare avanti)
          return;
        }
        RIP.ult = { stato: stato, soloQui: soloQui != null ? soloQui : null };
        if (reteRip()) inCodaRip();   // (se la stanza non c'è ancora: appena ha il codice, vedi P.ripAperta)
        if (P.riserva) cuore.copiaRiserva(P.riserva, stato);   // (host di riserva: la copia ai vice, mai soloQui)
      },
      // (host di riserva) chi porta avanti la partita se l'host sparisce: il gioco può sceglierlo lui (es. prima chi guarda).
      // lista di id in ordine; null = i primi due arrivati (di partenza)
      vici: function (lista) {
        if (!viva()) return;
        P.viciScelti = Array.isArray(lista) ? lista.slice(0, 10) : null;
        if (P.riserva) cuore.controllaVici(P.riserva);
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
        if (opts && opts.torneo && cuore.torneo) return cuore.torneoRisultato(g, classifica);
        var fac = null; try { fac = tavolo.faccine(); } catch (e) {}   // partita online: la fila delle faccine anche nella classifica
        if (!fac && !reteXp) cuore.serataLocale(g, classifica);   // sullo stesso telefono: i punti nella Classifica della serata, da soli
        // partita online: i tasti di fine uguali per tutti (Nuova partita / Ci sto, Esci); se no quelli di sempre
        var host = !!(reteXp && reteXp._P === P);
        schermataFine(g, classifica, giocatori, impostazioni, fac, fac ? function (piede) { return tavolo.tastiFine(piede, { host: host }); } : null);
      },

      // uscite comuni
      esci: function () {
        if (!viva()) return;
        if (!salaCtx && tavolo.linkParams && tavolo.linkParams.stanza) cuore.dimenticaStanza();   // uscito apposta: niente "Rientra"
        if (P.miaStanza) cuore.dimenticaMiaStanza(P.miaStanza);   // l'host è uscito apposta: la sua stanza non si riapre da sola
        var hR = reteRip(); RIP.ult = null; clearTimeout(RIP.t); RIP.t = null; if (hR) cuore.scordaRipresa(hR.codice);   // (né la sua partita)
        if (P.riserva) cuore.fermaRiserva(P.riserva);
        lasciaPartita();   // da qui il gioco non disegna più (un suo timer rimasto acceso non copre la Sala o la home)
        (salaCtx ? salaCtx.esci : tornaHome)();   // entrato da un edificio della città: si torna lì
      }
    };
    P.tavolo = tavolo;

    // 📦 il gioco si scarica quando serve (js/cuore/scarica.js): tutto è già pronto come sempre, se non è ancora arrivato si aspetta solo lui
    if (cuore.aspettaGioco(g, function () { RIP.risFino = Date.now() + 20000; g.avvia(tavolo); }, { viva: viva, indietro: function () { tavolo.esci(); } })) return;   // (i 20 s «classifica già data» partono da quando il gioco parte davvero)
    g.avvia(tavolo);
  }

  // ---- la pagina si è ricaricata (o l'app si è riaperta): si torna da soli dov'eri ----
  // la mia Sala o la mia stanza (entro 20 minuti, stesso codice: gli amici rientrano da soli), oppure la stanza
  // dell'amico in cui ero entrato in questa scheda. Vale la più recente. null = niente da riprendere
  function rientroAutomatico() {
    var cand = [], io = profiloAttivo();
    var ms = cuore.miaSalaRecente(), mt = cuore.miaStanzaRecente(), ls = cuore.linkSessione();
    if (ms && (io || (ms.nomeHost && cuore.salaSempre()))) cand.push({ t: ms.t, vai: function () { cuore.creaSala({ riapri: ms }); } });   // (senza profilo: col nome dell'host salvato)
    if (mt && (io || cuore.ripresaValida(mt)) && giocoDa(mt.gioco)) cand.push({ t: mt.t, vai: function () { riapriStanza(mt); } });   // (senza profilo solo se la partita riprende)
    if (ls) cand.push({ t: ls.t || 0, vai: function () { if (ls.sala) return cuore.salaOspite(ls.sala); var g = giocoDa(ls.gioco); if (!g) return schermataHome(); linkParams = { gioco: g.id, stanza: ls.stanza }; if (ls.guarda) linkParams.guarda = 1; avviaPartita(g, [], {}); } });   // (chi guardava torna a guardare)
    if (!cand.length) return null;
    cand.sort(function (a, b) { return b.t - a.t; });
    return cand[0].vai;
  }
  // l'host riapre la sua stanza: stesso gioco, stesso codice, stesse regole (il gruppo resta; la partita in corso riprende
  // se il gioco lo sa fare, t.ripresa: anche senza profilo, col nome di prima)
  function riapriStanza(o) {
    var g = giocoDa(o.gioco), io = profiloAttivo(), rp = cuore.ripresaValida(o) ? cuore.ripresaDi(g.id, o.codice) : null;
    if (!g || !(io || rp)) return schermataHome();
    var nP = partitaN;
    if (cuore.aspettaGioco(g, function () { riapriStanza(o); }, { subito: true, viva: function () { return partitaN === nP; } })) return;   // (📦 la stanza si riapre quando il gioco è arrivato: anche se intanto si è disegnata la home; non più se è partita un'altra partita)
    var mioNome = (io && io.nome) || o.nomeHost || rp.nomeHost || "Giocatore 1";
    // un gioco con l'host di riserva (Parola d'ordine) a partita iniziata: la porta avanti un amico, io rientro come giocatore
    if (hostDiRiserva(g) && o.fase && o.fase !== "lobby") {
      cuore.dimenticaMiaStanza(o.codice);
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
    cuore.NOMI_SEME = o.nomi && typeof o.nomi === "object" ? o.nomi : null;   // ognuno ritrova il suo nome ("Luca 2" resta "Luca 2")
    cuore.PORTA_SEME = !!o.porta;   // la porta resta com'era (chiusa: entra solo chi c'era)
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
    registra: function (gioco) { if (cuore.unisciScheda && cuore.unisciScheda(gioco)) return; giochiReg.push(gioco); ordinaGiochi(); },   // (va al suo posto nell'ordine del proprietario: se non c'è, in fondo. 📦 Il gioco che arriva dopo la sua scheda si copia dentro la scheda: js/cuore/scarica.js)
    audioCtx: audioCtx,
    listaProfilo: listaProfilo, salvaListaProfilo: salvaListaProfilo,   // liste salvate sul profilo di chi gioca
    // 🤖 i bot fissi, uguali in tutti i giochi: { id, nome, omino, frase, livello: "facile"|"medio"|"difficile", bot: true }
    // prendi(n, { livello, escludi: [nomi o id], caso }) = n bot diversi (stessi nello stesso ordine, se no a sorte con caso: true)
    bot: { tutti: function () { return cuore.botTutti().map(cuore.copiaBot); }, prendi: function (n, o) { return cuore.botPrendi(n, o); }, daId: function (id) { return cuore.botDaId(id); }, livelli: BOT_LIVELLI.slice() },
    avviaApp: function () {
      ordineAttivo = ordineSalvato(); ordinaGiochi();   // 🧩 l'ordine dei giochi visto l'ultima volta (subito: la home non salta)
      cuore.agganciaRete();   // lo strato comune della rete (stanze ricordate, nomi doppi, XP, host che torna…)
      // niente menu della pressione lunga (copia, salva immagine…) fuori dai campi dove si scrive
      document.addEventListener("contextmenu", function (e) { if (!(e.target && e.target.closest && e.target.closest("input, textarea, [contenteditable='true']"))) e.preventDefault(); });
      app = document.getElementById("app");
      // il link si legge una volta sola e si toglie dall'indirizzo (così non resta "attaccato" all'app);
      // quello di una stanza resta segnato solo in questa scheda: se la pagina si ricarica si rientra da soli
      linkParams = leggiParametriLink();
      // il link fisso di una Compagnia (#gruppo=KFRTPQ&n=…&e=…): codice di 6 lettere, se no non vale
      if (linkParams.gruppo != null) { var cg = cuore.codiceComp(linkParams.gruppo); if (cg) linkParams.gruppo = cg; else delete linkParams.gruppo; }
      var daLink = !!(linkParams.sala || linkParams.gruppo || (linkParams.gioco && linkParams.stanza));
      if (location.hash) try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
      if (daLink) cuore.segnaLinkSessione(linkParams.sala || linkParams.gruppo ? { sala: linkParams.sala || linkParams.gruppo } : { gioco: linkParams.gioco, stanza: linkParams.stanza, guarda: linkParams.guarda });
      // la Compagnia (js/compagnia.js): memoria, tessere della home, link fisso. Le passo gli aiuti del core
      if (window.SGCompagnia) try {
        SGCompagnia.collega({ el: el, svuota: svuota, schermata: schermata, mostra: mostra, home: schermataHome, conferma: chiediConferma, pillola: pillola, cifre: cifre,
          profilo: profiloAttivo, omino: function (cfg, o) { return window.SGOmino && cfg ? SGOmino.svg(cfg, o) : ""; },
          apri: function (C) { cuore.apriCompagnia(C); }, entra: function (C) { cuore.apriCompagnia(C); }, mia: cuore.infoSalaMia,
          nomeGioco: function (id) { var g = giocoDa(id); return g ? { nome: g.nome, icona: g.icona } : ""; },
          chiedi: function (uid, nome, fatto) { try { return cuore.chiediA({ uid: uid, nome: nome }, fatto); } catch (e) {} },
          rapporto: function (uid) { try { return cuore.rapporto(uid); } catch (e) { return "nessuno"; } },
          // rinominata da "Le tue compagnie": se la sua Sala è mia la mando a tutti
          rinominata: function (C, comp) {
            // (sono nella sua Sala da amico: il nome nuovo lo passo all'host, che lo manda a tutti se è il più nuovo)
            if (comp && cuore.salaG && cuore.salaG.rete && cuore.salaG.codice === String(C).toUpperCase()) try {
              cuore.salaG.rete.invia({ t: "comp", comp: { nome: String(comp.nome != null ? comp.nome : comp.n).slice(0, 24), emoji: String((comp.emoji != null ? comp.emoji : comp.e) || "📌").slice(0, 8), rv: +comp.rv || Date.now() } });
            } catch (e) {}
            if (!cuore.sala || cuore.sala.codice !== String(C).toUpperCase() || !comp) return;
            cuore.sala.comp = { nome: String(comp.nome != null ? comp.nome : comp.n).slice(0, 24), emoji: String((comp.emoji != null ? comp.emoji : comp.e) || "📌").slice(0, 8), rv: +comp.rv || Date.now() };
            if (cuore.sala._bcast) cuore.sala._bcast();
            if (!cuore.sala.inGioco) cuore.disegnaSalaHost();
          } });
      } catch (e) { setTimeout(function () { throw e; }, 0); }
      if (daLink && linkParams.k) cuore.chiaveDi(linkParams.sala || linkParams.gruppo || linkParams.stanza, false, linkParams.k);   // 🔑 la chiave delle foto: solo in questa scheda
      if (window.SGNube && SGNube.onCambio) SGNube.onCambio(cuore.ricordaProfilo);   // questo telefono ricorda l'ultimo profilo usato
      if (window.SGNube && SGNube.onCambio) SGNube.onCambio(stileAvatar);   // gli avatar nuovi: per tutti, o solo per il proprietario (vedi AVATAR_NUOVO)
      stileAvatar();
      // gli amici online (Passo 6): col profilo pronto si accende la presenza; profilo cambiato o uscito: si ferma o riparte
      if (window.SGNube && SGNube.onCambio && window.SGAmiciOnline) SGNube.onCambio(function () { amiciAvvia(); });
      // PROFILO OBBLIGATORIO: prima di tutto (home, gioco, stanza o Sala del link) c'è il profilo con l'avatar;
      // chi l'ha già usato qui entra da solo. Il link letto qui sopra si usa dopo (la pagina ricaricata lo ritrova)
      function parti() {
        var ls0 = daLink ? linkParams : cuore.linkSessione();
        cuore.garantisciProfilo(vai, { daLink: !!(daLink || ls0), invito: cuore.invitoDi(ls0) });
      }
      function vai() {
        stileAvatar();   // (il profilo ora c'è di sicuro, anche se appena creato)
        cuore.caricaBot();   // i bot come li ha fatti il proprietario (in sottofondo: intanto valgono gli ultimi visti)
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
          return cuore.apriCompagnia(CG, { nome: nG || null, emoji: eG || null });
        }
        if (linkParams.sala) { var cs = linkParams.sala; linkParams = {}; return cuore.salaOspite(cs); }   // link di una Sala online
        var g = linkParams.gioco && giocoDa(linkParams.gioco);
        // Con un codice stanza si entra come OSPITE; altrimenti si apre la preparazione
        if (g && linkParams.stanza) avviaPartita(g, [], {});
        else if (g) cuore.apriGioco(g);
        else schermataHome();
      }
      [3000, 9000].forEach(function (ms) { setTimeout(function () { if (serveExtra()) caricaExtra(); try { var io0 = profiloAttivo(); if (io0 && io0.cloud) cuore.statoSfide(); } catch (e) {} }, ms); });   // chi usa la casa nuova, il casinò o la città a piedi: i loro disegni arrivano in sottofondo
      // col cloud, aspetta che Firebase ripristini la sessione (login automatico)
      if (window.SGNube && SGNube.disponibile() && !SGNube.pronto()) {
        cuore.schermataCaricamento();
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
      if (cuore.sala && P && P.salaCtx && P.salaCtx === cuore.sala.ctx) return cuore.salaCambiaGioco();
      lasciaPartita(); if (window.SGNet) SGNet.chiudiGiochi(); schermataScegliGioco();
    },
    // la ruota del giorno (monete o XP, un giro al giorno): la apre anche il Black Jack quando restano poche monete
    ruotaDelGiorno: function (dopo) { return cuore.ruotaDelGiorno(dopo); },
    // la finestra di conferma al centro (per chi non ha il tavolo, es. lo studio): SG.conferma(domanda, nota, siTesto, siFn)
    conferma: function (domanda, nota, siTesto, siFn) { chiediConferma(domanda, nota, siTesto, siFn); },
    sala: function () { lasciaPartita(); if (window.SGNet) SGNet.chiudiGiochi(); schermataSala(null); },
    // impostazioni arrivate da un link (le legge il gioco per i valori di partenza)
    parametriLink: function () { return linkParams; },
    // 🔑 la chiave delle foto della serata (quella della Sala, o della stanza): crea = sono l'host e la faccio se manca
    chiaveFoto: function (codice, crea) { var cs = crea ? (cuore.sala && cuore.sala.codice) : (cuore.salaG && cuore.salaG.codice); return cuore.chiaveDi(codice) || (cs && cuore.chiaveDi(cs, crea)) || (crea ? cuore.chiaveDi(codice, true) : null); },
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
      var kk = params.k === undefined && (params.sala || params.stanza) ? cuore.chiaveDi(params.sala || params.stanza) : null;   // 🔑 la chiave delle foto, se questa scheda ce l'ha
      if (kk) pezzi.push("k=" + kk);
      return base + (pezzi.length ? "#" + pezzi.join("&") : "");
    },
    // esposti perché comodi anche fuori
    _util: { el: el, svuota: svuota, mischia: mischia, votoEstrai: function (ids, voti, caso) { return cuore.votoEstrai(ids, voti, caso); } }
  };
  // ==== AI PEZZI DEL CUORE (js/cuore/*.js): quello del cuore che usano. Rifatto dallo strumento di divisione; a mano: ====
  // cuore.X = X per le cose che non cambiano; vivo("X", leggi, scrivi) per quelle che cambiano (i pezzi le leggono sempre aggiornate)
  cuore.AVATAR_NUOVO = AVATAR_NUOVO; cuore.AVATAR_A = AVATAR_A; cuore.avatarAAmmesso = avatarAAmmesso; cuore.avatarASpento = avatarASpento; cuore.BOT_LIVELLI = BOT_LIVELLI; cuore.BOT_MAX_FRASE = BOT_MAX_FRASE; cuore.BOT_MAX_NOME = BOT_MAX_NOME;
  cuore.CITTA_VISIBILE = CITTA_VISIBILE; cuore.FACCINE = FACCINE; cuore.GIOCHI_ELIMINAZIONE = GIOCHI_ELIMINAZIONE;
  cuore.HOME_MENU_SOTTO = HOME_MENU_SOTTO; cuore.K_ATTIVO = K_ATTIVO; cuore.K_PROFILI = K_PROFILI; cuore.MAX_ELIM = MAX_ELIM;
  cuore.PILLOLE = PILLOLE; cuore.PROPRIETARIO = PROPRIETARIO; cuore.amiciStato = amiciStato; cuore.apriInvitaAmici = apriInvitaAmici;
  cuore.apriOnlineSala = apriOnlineSala; cuore.audioCtx = audioCtx; cuore.avatarNuoviSpenti = avatarNuoviSpenti; cuore.avviaPartita = avviaPartita;
  cuore.caricaExtra = caricaExtra; cuore.catDi = catDi; cuore.chiDa = chiDa; cuore.chiediConferma = chiediConferma;
  cuore.chiediScelta = chiediScelta; cuore.cifre = cifre; cuore.classificaFitta = classificaFitta; cuore.conCodice = conCodice;
  cuore.contoAvanti = contoAvanti; cuore.eProprietario = eProprietario; cuore.el = el; cuore.entraConCodice = entraConCodice; cuore.errore = errore;
  cuore.giardinoPronto = giardinoPronto; cuore.giochi = giochi; cuore.giocoDa = giocoDa; cuore.giocoOnline = giocoOnline; cuore.gruppo = gruppo;
  cuore.hostDiRiserva = hostDiRiserva; cuore.hostVia = hostVia; cuore.inviaChi = inviaChi; cuore.lasciaPartita = lasciaPartita;
  cuore.leggiL = leggiL; cuore.listaProfilo = listaProfilo; cuore.medaglieAPari = medaglieAPari; cuore.minDi = minDi;
  cuore.mioUidOnline = mioUidOnline; cuore.mischia = mischia; cuore.modiDi = modiDi; cuore.mostra = mostra; cuore.nomiGruppo = nomiGruppo;
  cuore.novitaTutteViste = novitaTutteViste; cuore.oggiStr = oggiStr; cuore.pillola = pillola; cuore.premiaPartita = premiaPartita;
  cuore.profili = profili; cuore.profiloAttivo = profiloAttivo; cuore.riempiRigaRec = riempiRigaRec; cuore.riquadroLivello = riquadroLivello;
  cuore.salvaListaProfilo = salvaListaProfilo; cuore.sceltoModo = sceltoModo; cuore.schedaDelProprietario = schedaDelProprietario;
  cuore.schermata = schermata; cuore.schermataHome = schermataHome; cuore.schermataModo = schermataModo; cuore.schermataNovita = schermataNovita;
  cuore.schermataPreGioco = schermataPreGioco; cuore.schermataRegole = schermataRegole; cuore.schermataSala = schermataSala; cuore.scriviL = scriviL;
  cuore.segnaRecentiDa = segnaRecentiDa; cuore.serveExtra = serveExtra; cuore.stessoNome = stessoNome; cuore.svuota = svuota;
  cuore.tastoInvita = tastoInvita; cuore.tempoBreve = tempoBreve; cuore.tesseraGioco = tesseraGioco; cuore.togliFerma = togliFerma;
  cuore.tornaHome = tornaHome;
  vivo("FINE_REC", function () { return FINE_REC; }, function (v) { FINE_REC = v; });
  vivo("app", function () { return app; });
  vivo("linkParams", function () { return linkParams; }, function (v) { linkParams = v; });
  vivo("partitaCorrente", function () { return partitaCorrente; });
  vivo("reteXp", function () { return reteXp; }, function (v) { reteXp = v; });
  vivo("rientro", function () { return rientro; }, function (v) { rientro = v; });
  vivo("schedaProp", function () { return schedaProp; }, function (v) { schedaProp = v; });
  function vivo(n, leggi, scrivi) { Object.defineProperty(cuore, n, { get: leggi, set: scrivi, configurable: true }); }
  // ==== fine dei pezzi del cuore ====
})();

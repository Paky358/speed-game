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

  function schermataHome() {
    var s = schermata({ titolo: "Serata Giochi", sotto: "Scegli un gioco e passa il telefono" });
    var griglia = el("div", { class: "griglia-giochi" });

    giochi.forEach(function (g) {
      griglia.appendChild(el("button", {
        class: "tessera", onclick: function () { schermataGiocatori(g); }
      }, [
        el("span", { class: "icona", text: g.icona || "🎲" }),
        el("div", { class: "info" }, [
          el("h2", { text: g.nome }),
          el("p", { text: g.descrizione || "" }),
          el("div", { class: "meta", text: rangeGiocatori(g) })
        ])
      ]));
    });

    // Segnaposto: fa capire che ne arriveranno altri (senza prometterli)
    griglia.appendChild(el("div", { class: "tessera presto" }, [
      el("span", { class: "icona", text: "➕" }),
      el("div", { class: "info" }, [
        el("h2", { text: "Altri giochi in arrivo" }),
        el("p", { text: "Uno alla volta, fatto bene." })
      ])
    ]));

    s._contenuto.appendChild(griglia);

    // Tasto "Entra in una stanza" (per chi ha ricevuto un codice a voce)
    s._piede.appendChild(el("button", {
      class: "btn btn-fantasma", html: "🔗 Entra in una stanza (con un codice)",
      onclick: function () {
        var c = window.prompt("Scrivi il codice della stanza:");
        if (!c) return;
        c = c.trim().toUpperCase();
        if (c) { location.hash = "gioco=timeline&stanza=" + encodeURIComponent(c); location.reload(); }
      }
    }));

    // Tasto "Novità" (con pallino rosso se c'è qualcosa di non ancora visto)
    var novita = window.SG_NOVITA || [];
    if (novita.length) {
      var btn = el("button", { class: "btn btn-fantasma", onclick: schermataNovita });
      btn.appendChild(el("span", { text: "🆕 Novità" }));
      if (!novitaTutteViste()) btn.appendChild(el("span", { class: "pallino" }));
      s._piede.appendChild(btn);
    }

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

  function rangeGiocatori(g) {
    var min = g.giocatoriMin || 2, max = g.giocatoriMax || 8;
    return "👥 " + (min === max ? min : min + "–" + max) + " giocatori";
  }

  // ---- Scelta dei giocatori ----
  function schermataGiocatori(g) {
    var min = g.giocatoriMin || 2;
    var max = g.giocatoriMax || 8;
    var nomi = ["", ""]; // due righe di partenza
    while (nomi.length < min) nomi.push("");

    var s = schermata({
      icona: g.icona, titolo: g.nome, sotto: "Chi gioca?",
      indietro: schermataHome
    });

    var lista = el("div");
    function ridisegna() {
      svuota(lista);
      nomi.forEach(function (n, i) {
        var input = el("input", {
          type: "text", value: n, placeholder: "Giocatore " + (i + 1),
          maxlength: "16",
          oninput: function (ev) { nomi[i] = ev.target.value; }
        });
        var riga = el("div", { class: "giocatore-riga" }, [input]);
        if (nomi.length > min) {
          riga.appendChild(el("button", {
            class: "togli", text: "×", "aria-label": "Togli",
            onclick: function () { nomi.splice(i, 1); ridisegna(); }
          }));
        }
        lista.appendChild(riga);
      });
    }
    ridisegna();

    var aggiungi = el("button", {
      class: "btn btn-fantasma", html: "＋ Aggiungi giocatore",
      onclick: function () {
        if (nomi.length >= max) return;
        nomi.push(""); ridisegna();
        if (nomi.length >= max) aggiungi.disabled = true;
      }
    });

    s._contenuto.appendChild(lista);
    s._contenuto.appendChild(aggiungi);

    // Impostazioni specifiche del gioco (facoltative)
    var impostazioni = {};
    if (typeof g.impostazioni === "function") {
      var box = el("div");
      g.impostazioni(box, impostazioni, { el: el });
      s._contenuto.appendChild(box);
    }

    s._piede.appendChild(el("button", {
      class: "btn btn-fantasma", text: "Come si gioca",
      onclick: function () { schermataRegole(g, function () { schermataGiocatori(g); }); }
    }));
    s._piede.appendChild(el("button", {
      class: "btn btn-primario", text: "Comincia ▶",
      onclick: function () {
        var puliti = nomi.map(function (n, i) {
          return (n || "").trim() || ("Giocatore " + (i + 1));
        });
        if (puliti.length < min) return;
        avviaPartita(g, puliti, impostazioni);
      }
    }));

    mostra(s);
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

    s._piede.appendChild(el("button", {
      class: "btn btn-primario", text: "↻ Rigioca",
      onclick: function () { avviaPartita(g, giocatori, impostazioni); }
    }));
    s._piede.appendChild(el("button", {
      class: "btn btn-fantasma", text: "🏠 Torna ai giochi",
      onclick: schermataHome
    }));
    mostra(s);
  }

  // =========================================================
  //  GIRO DI PARTITA
  //  Consegna al gioco un "tavolo" con tutto ciò che gli serve,
  //  senza fargli sapere come sono fatte le schermate comuni.
  // =========================================================
  function avviaPartita(g, giocatori, impostazioni) {
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
      fine: function (classifica) { schermataFine(g, classifica, giocatori, impostazioni); },

      // uscite comuni
      esci: schermataHome
    };

    g.avvia(tavolo);
  }

  // =========================================================
  //  API PUBBLICA
  // =========================================================
  window.SG = {
    registra: function (gioco) { giochi.push(gioco); },
    avviaApp: function () {
      app = document.getElementById("app");
      linkParams = leggiParametriLink();
      var g = linkParams.gioco && giochi.filter(function (x) { return x.id === linkParams.gioco; })[0];
      // Con un codice stanza si entra come OSPITE; altrimenti si apre la preparazione
      if (g && linkParams.stanza) avviaPartita(g, [], {});
      else if (g) schermataGiocatori(g);
      else schermataHome();
    },
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

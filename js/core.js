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
      schermataHome();
    },
    // esposti perché comodi anche fuori
    _util: { el: el, svuota: svuota, mischia: mischia }
  };
})();

/* =========================================================
   GIOCO — La linea del tempo
   Innesto nel motore comune (SG). Sa fare tre cose:
   comincia, gioca un turno, dice chi ha vinto.

   Un solo telefono che gira di mano in mano.
   ========================================================= */
(function () {
  "use strict";

  // --- Aspetto specifico di questo gioco (il resto è comune) ---
  var stile = document.createElement("style");
  stile.textContent = [
    ".tl-carta-mano{background:linear-gradient(135deg,var(--accento),var(--accento-scuro));",
      "color:#241f00;border-radius:var(--raggio);padding:16px 18px;box-shadow:var(--ombra);",
      "text-align:center;margin-bottom:6px;}",
    ".tl-carta-mano .occhiello{font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;opacity:.75;}",
    ".tl-carta-mano .titolo{font-size:1.35rem;font-weight:800;line-height:1.2;margin-top:4px;}",
    ".tl-carta-mano .desc{font-size:.95rem;line-height:1.4;margin-top:8px;color:#3a3000;}",
    ".tl-restano{font-size:.9rem;color:var(--testo-tenue);text-align:center;font-weight:700;margin:0 0 8px;}",
    ".tl-linea{display:flex;flex-direction:column;gap:0;}",
    ".tl-evento{background:var(--carta);border-radius:14px;padding:12px 14px;display:flex;",
      "align-items:flex-start;gap:14px;box-shadow:var(--ombra);}",
    ".tl-evento .anno{font-size:1.5rem;font-weight:800;color:var(--accento);min-width:2.8em;text-align:right;flex:0 0 auto;}",
    ".tl-evento .et-col{flex:1;min-width:0;}",
    ".tl-evento .et{font-size:1.02rem;font-weight:700;line-height:1.25;}",
    ".tl-evento .et-desc{font-size:.85rem;color:var(--testo-tenue);line-height:1.35;margin-top:3px;}",
    ".tl-gap{width:100%;min-height:48px;margin:10px 0;border:2px dashed var(--carta-2);",
      "background:rgba(255,255,255,.02);color:var(--testo-tenue);border-radius:12px;font-family:inherit;",
      "font-weight:800;font-size:.95rem;cursor:pointer;transition:all .12s ease;}",
    ".tl-gap:active,.tl-gap:hover{border-style:solid;border-color:var(--accento);color:var(--accento);background:rgba(255,202,58,.12);}",
    ".tl-esito{text-align:center;flex:1;display:flex;flex-direction:column;justify-content:center;gap:6px;}",
    ".tl-esito .faccia{font-size:4rem;}",
    ".tl-esito .verdetto{font-size:1.6rem;font-weight:800;}",
    ".tl-esito .giusto{color:var(--verde);} .tl-esito .sbagliato{color:var(--rosso);}",
    ".tl-esito .annone{font-size:2.6rem;font-weight:900;color:var(--accento);}",
    ".tl-esito .titoletto{font-size:1.2rem;font-weight:700;}",
    ".tl-finito{margin-top:10px;font-size:1.05rem;font-weight:800;color:var(--verde);}"
  ].join("");
  document.head.appendChild(stile);

  var gioco = {
    id: "timeline",
    nome: "La linea del tempo",
    icona: "📜",
    descrizione: "Metti gli avvenimenti nell'ordine giusto. Più la linea si riempie, più diventa difficile.",
    giocatoriMin: 1,
    giocatoriMax: 8,

    regole: [
      "In mezzo al tavolo c'è una <b>linea del tempo</b>: all'inizio ha una sola carta con la sua data.",
      "Al tuo turno esce un avvenimento <b>senza data</b>. Devi decidere <b>dove va</b>: prima, dopo, o tra due carte già presenti.",
      "Poi si scopre l'anno. Se hai <b>indovinato</b> il punto, la carta entra nella linea e ti manca una carta in meno. Se hai <b>sbagliato</b>, la carta si scarta.",
      "<b>Vince</b> chi per primo piazza tutte le sue carte. Più la linea cresce, più gli spazi si stringono!",
      "Un solo telefono: si passa di mano in mano a ogni turno."
    ],

    // Impostazioni dell'host: modalità, categorie attive, carte a testa, link
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      var categorie = window.SG_CATEGORIE || [];
      var link = SG.parametriLink();

      // --- Come si gioca: un telefono solo oppure ognuno dal suo ---
      dove.modo = "telefono";
      box.appendChild(el("div", { class: "etichetta", text: "Come si gioca" }));
      var notaOnline = el("div", { class: "link-avviso", hidden: "hidden" });
      var bTel, bOnl;
      function scegliModo(m) {
        dove.modo = m;
        bTel.className = "modo-chip" + (m === "telefono" ? " attiva" : "");
        bOnl.className = "modo-chip" + (m === "online" ? " attiva" : "");
        notaOnline.hidden = (m !== "online");
        notaOnline.textContent = SGNet && SGNet.disponibile()
          ? "Gli altri entrano dai loro telefoni con un codice. Qui sopra scrivi solo il TUO nome."
          : "Attenzione: qui il collegamento tra telefoni non è disponibile. Funziona quando il gioco è pubblicato su un sito.";
      }
      bTel = el("button", { class: "modo-chip attiva", onclick: function () { scegliModo("telefono"); } }, [
        el("span", { class: "mi", text: "📱" }), el("div", {}, [
          el("div", { class: "mt", text: "Un telefono solo" }),
          el("div", { class: "ms", text: "Si passa di mano in mano" })
        ])
      ]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { scegliModo("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [
          el("div", { class: "mt", text: "Ognuno dal suo telefono" }),
          el("div", { class: "ms", text: "Ognuno entra con un codice" })
        ])
      ]);
      box.appendChild(el("div", { class: "modo-griglia" }, [bTel, bOnl]));
      box.appendChild(notaOnline);

      // --- Categorie (l'host sceglie quali avvenimenti entrano in gioco) ---
      var idValidi = categorie.map(function (c) { return c.id; });
      var diPartenza = (link.cat && link.cat.filter(function (id) { return idValidi.indexOf(id) >= 0; })) || null;
      dove.categorie = (diPartenza && diPartenza.length) ? diPartenza.slice() : idValidi.slice();

      box.appendChild(el("div", { class: "etichetta", text: "Categorie in gioco" }));
      var griglia = el("div", { class: "cat-griglia" });
      categorie.forEach(function (c) {
        var attiva = dove.categorie.indexOf(c.id) >= 0;
        var chip = el("button", {
          class: "cat-chip" + (attiva ? " attiva" : ""),
          onclick: function () {
            var i = dove.categorie.indexOf(c.id);
            if (i >= 0) dove.categorie.splice(i, 1); else dove.categorie.push(c.id);
            chip.className = "cat-chip" + (dove.categorie.indexOf(c.id) >= 0 ? " attiva" : "");
          }
        }, [
          el("span", { class: "ci", text: c.icona || "🎲" }),
          el("span", { text: c.nome }),
          el("span", { class: "spunta", text: "✓" })
        ]);
        griglia.appendChild(chip);
      });
      box.appendChild(griglia);

      // --- Carte a testa ---
      dove.carte = link.carte ? Math.max(3, Math.min(8, link.carte)) : 5;
      box.appendChild(el("div", { class: "etichetta", text: "Carte da piazzare a testa" }));
      var valore = el("span", { class: "valore", text: dove.carte });
      function agg(d) { dove.carte = Math.max(3, Math.min(8, dove.carte + d)); valore.textContent = dove.carte; }
      box.appendChild(el("div", { class: "stepper" }, [
        el("button", { text: "−", "aria-label": "meno", onclick: function () { agg(-1); } }),
        valore,
        el("button", { text: "+", "aria-label": "più", onclick: function () { agg(1); } })
      ]));

      // --- Link da mandare agli amici (con le impostazioni già dentro) ---
      box.appendChild(el("div", { class: "etichetta", text: "Da mandare agli amici" }));
      var campo = el("input", { class: "link-campo", type: "text", readonly: "readonly", hidden: "hidden" });
      var avviso = el("div", { class: "link-avviso", hidden: "hidden" });
      var bottone = el("button", { class: "btn btn-fantasma", html: "🔗 Crea il link con queste impostazioni",
        onclick: function () {
          if (!dove.categorie.length) { avviso.hidden = false; avviso.textContent = "Scegli almeno una categoria."; return; }
          var url = SG.creaLink({ gioco: "timeline", cat: dove.categorie, carte: dove.carte });
          campo.value = url; campo.hidden = false; campo.focus(); campo.select();
          try { navigator.clipboard.writeText(url); } catch (e) {}
          avviso.hidden = false; avviso.textContent = "Link pronto! Se non si è copiato da solo, tienilo premuto e copialo.";
        }
      });
      box.appendChild(bottone);
      box.appendChild(campo);
      box.appendChild(avviso);
    },

    // --- Partenza ---
    avvia: function (t) {
      // Chi arriva da un link con un codice stanza entra come OSPITE
      if (t.linkParams && t.linkParams.stanza) return ospiteEntra(t, t.linkParams.stanza);
      // Modalità scelta dall'host
      if (t.impostazioni && t.impostazioni.modo === "online") return hostCrea(t);

      // --- Modalità "un telefono solo" (di sempre) ---
      var mazzo = t.mischia(pescaDati(t.impostazioni));
      var carteAtesta = (t.impostazioni && t.impostazioni.carte) || 5;

      var stato = {
        mazzo: mazzo,
        linea: [ mazzo.pop() ],                 // carta di partenza, già scoperta
        turno: 0,
        ordineFine: [],                         // nomi in ordine di chi finisce prima
        giocatori: t.giocatori.map(function (nome) {
          return { nome: nome, restano: carteAtesta };
        }),
        carta: null
      };
      ordina(stato.linea);

      // primo turno: se un solo giocatore, niente passaggio del telefono
      if (stato.giocatori.length === 1) iniziaTurno(t, stato);
      else t.passaA(stato.giocatori[0].nome, function () { iniziaTurno(t, stato); });
    }
  };

  function ordina(linea) { linea.sort(function (a, b) { return a.anno - b.anno; }); }

  // Raccoglie gli avvenimenti dalle categorie scelte dall'host
  function pescaDati(impostazioni) {
    var categorie = window.SG_CATEGORIE || [];
    var scelte = (impostazioni && impostazioni.categorie) || null;
    var attive = categorie.filter(function (c) { return !scelte || scelte.indexOf(c.id) >= 0; });
    if (!attive.length) attive = categorie;
    var DATI = [];
    attive.forEach(function (c) { (c.eventi || []).forEach(function (e) { DATI.push(e); }); });
    return DATI;
  }

  function mischiaArr(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }

  function giocatoreDiTurno(stato) {
    return stato.giocatori[stato.turno % stato.giocatori.length];
  }
  // quanti giocatori hanno ancora carte da piazzare
  function attiviRestano(stato) {
    var n = 0; stato.giocatori.forEach(function (g) { if (g.restano > 0) n++; }); return n;
  }
  // sposta il turno fino a un giocatore che ha ancora carte (salta chi ha finito)
  function assicuraAttivo(stato) {
    var giri = 0, n = stato.giocatori.length;
    while (n && stato.giocatori[stato.turno % n].restano === 0 && giri < n) { stato.turno++; giri++; }
  }

  // --- Un turno: pesca una carta e chiedi dove va ---
  function iniziaTurno(t, stato) {
    if (attiviRestano(stato) === 0 || stato.mazzo.length === 0) return finePartita(t, stato);
    assicuraAttivo(stato);
    stato.carta = stato.mazzo.pop();
    disegnaPiazzamento(t, stato);
  }

  function disegnaPiazzamento(t, stato) {
    var el = t.el;
    var g = giocatoreDiTurno(stato);
    var s = t.schermata({
      titolo: g.nome,
      sotto: "Tocca lo spazio giusto della linea",
      icona: "📜",
      indietro: function () { if (confermaUscita()) t.esci(); }
    });

    s._contenuto.appendChild(el("p", { class: "tl-restano",
      text: "Ti restano " + g.restano + (g.restano === 1 ? " carta" : " carte") }));

    s._contenuto.appendChild(nodoCartaMano(el, stato.carta, "Dove va?"));

    var linea = el("div", { class: "tl-linea" });
    // gap prima del primo, poi carta+gap per ognuno
    linea.appendChild(bottoneGap(t, stato, 0));
    stato.linea.forEach(function (ev, i) {
      linea.appendChild(nodoEvento(el, ev));
      linea.appendChild(bottoneGap(t, stato, i + 1));
    });
    s._contenuto.appendChild(linea);
    t.mostra(s);
  }

  function bottoneGap(t, stato, indice) {
    return t.el("button", {
      class: "tl-gap", html: "⤵ &nbsp;metti qui",
      onclick: function () { risolvi(t, stato, indice); }
    });
  }

  // --- Si scopre l'anno e si dà l'esito ---
  function risolvi(t, stato, gap) {
    var carta = stato.carta;
    var linea = stato.linea;
    var g = giocatoreDiTurno(stato);
    var Y = carta.anno;

    // gap corretto se resta ordinato (indulgente con gli anni uguali)
    var okSinistra = (gap === 0) || (linea[gap - 1].anno <= Y);
    var okDestra   = (gap === linea.length) || (Y <= linea[gap].anno);
    var giusto = okSinistra && okDestra;

    var appenaFinito = false;
    if (giusto) {
      linea.push(carta); ordina(linea);
      g.restano -= 1;
      if (g.restano === 0) { stato.ordineFine.push(g.nome); appenaFinito = true; }
    }
    // se sbagliato: la carta si scarta (restano invariato: si "ripesca" al turno dopo)

    disegnaEsito(t, stato, giusto, appenaFinito);
  }

  function disegnaEsito(t, stato, giusto, appenaFinito) {
    var el = t.el;
    var carta = stato.carta;
    var g = giocatoreDiTurno(stato);

    var s = t.schermata({});
    s._contenuto.appendChild(el("div", { class: "tl-esito" }, [
      el("div", { class: "faccia", text: giusto ? "✅" : "❌" }),
      el("div", { class: "verdetto " + (giusto ? "giusto" : "sbagliato"),
        text: giusto ? "Esatto!" : "Non ci siamo" }),
      el("div", { class: "annone", text: annoTesto(carta.anno) }),
      el("div", { class: "titoletto", text: carta.titolo }),
      appenaFinito ? el("div", { class: "tl-finito", text: "🎉 " + g.nome + " ha finito le sue carte!" }) : null
    ]));

    // La partita finisce SOLO quando tutti hanno finito le carte (o si esaurisce il mazzo)
    var finita = attiviRestano(stato) === 0 || stato.mazzo.length === 0;
    if (finita) {
      s._piede.appendChild(el("button", {
        class: "btn btn-primario", text: "🏆 Vedi la classifica",
        onclick: function () { finePartita(t, stato); }
      }));
      t.mostra(s);
      return;
    }

    // passa al prossimo giocatore che ha ancora carte
    stato.turno += 1; assicuraAttivo(stato);
    var prossimo = giocatoreDiTurno(stato).nome;
    var soloUno = stato.giocatori.length === 1;
    s._piede.appendChild(el("button", {
      class: "btn btn-primario",
      text: soloUno ? "Continua ▶" : "Passa a " + prossimo + " ▶",
      onclick: function () {
        if (soloUno) iniziaTurno(t, stato);
        else t.passaA(prossimo, function () { iniziaTurno(t, stato); });
      }
    }));
    t.mostra(s);
  }

  // --- Fine: classifica per ordine di chi ha finito prima ---
  function classificaDa(stato) {
    var fatti = (stato.ordineFine || []).map(function (nome) { return { nome: nome, punti: "finito!" }; });
    var restanti = stato.giocatori.filter(function (g) { return g.restano > 0; })
      .sort(function (a, b) { return a.restano - b.restano; })
      .map(function (g) { return { nome: g.nome, punti: g.restano + (g.restano === 1 ? " carta rimasta" : " carte rimaste") }; });
    return fatti.concat(restanti);
  }

  function finePartita(t, stato) { t.fine(classificaDa(stato)); }

  function confermaUscita() {
    return window.confirm("Uscire dalla partita in corso?");
  }

  function annoTesto(a) {
    return a < 0 ? Math.abs(a) + " a.C." : String(a);
  }

  // Componenti riusabili (valgono per "un telefono" e per l'online)
  function nodoCartaMano(el, carta, occhiello) {
    return el("div", { class: "tl-carta-mano" }, [
      el("div", { class: "occhiello", text: occhiello }),
      el("div", { class: "titolo", text: carta.titolo }),
      carta.fatto ? el("div", { class: "desc", text: carta.fatto }) : null
    ]);
  }
  function nodoEvento(el, ev) {
    return el("div", { class: "tl-evento" }, [
      el("span", { class: "anno", text: annoTesto(ev.anno) }),
      el("div", { class: "et-col" }, [
        el("div", { class: "et", text: ev.titolo }),
        ev.fatto ? el("div", { class: "et-desc", text: ev.fatto }) : null
      ])
    ]);
  }

  // =========================================================
  //  MODALITÀ "OGNUNO DAL SUO TELEFONO"
  //  Un telefono ospita (tiene la partita); gli altri entrano
  //  con il codice. Tutti vedono la stessa partita, aggiornata
  //  da sola a ogni mossa.
  // =========================================================

  function indexById(stato, id) {
    for (var i = 0; i < stato.giocatori.length; i++) if (stato.giocatori[i].id === id) return i;
    return -1;
  }
  function trovaGiocatore(vm, id) {
    for (var i = 0; i < vm.giocatori.length; i++) if (vm.giocatori[i].id === id) return vm.giocatori[i];
    return null;
  }
  function vmDa(stato) {
    var g = stato.giocatori;
    var idx = g.length ? (stato.turno % g.length) : 0;
    return {
      fase: stato.fase, codice: stato.codice,
      giocatori: g.map(function (x) { return { id: x.id, nome: x.nome, restano: x.restano }; }),
      turnoId: g.length ? g[idx].id : null,
      turnoNome: g.length ? g[idx].nome : "",
      linea: stato.linea.map(function (e) { return { anno: e.anno, titolo: e.titolo, fatto: e.fatto || "" }; }),
      carta: stato.carta ? { titolo: stato.carta.titolo, fatto: stato.carta.fatto || "" } : null,
      esito: stato.esito || null,
      classifica: stato.classifica || null
    };
  }

  // ---- L'HOST apre la stanza ----
  function hostCrea(t) {
    if (!(window.SGNet && SGNet.disponibile())) return schermataNoNet(t);
    var carte = (t.impostazioni && t.impostazioni.carte) || 5;
    var hostNome = (t.giocatori && t.giocatori[0]) ? t.giocatori[0] : "Host";
    var stato = {
      mazzo: mischiaArr(pescaDati(t.impostazioni)), linea: [], turno: 0, carta: null,
      esito: null, classifica: null, fase: "lobby", iniziata: false, carte: carte,
      codice: "…", ordineFine: [],
      giocatori: [{ id: "host", nome: hostNome, restano: carte }]
    };

    var rete = SGNet.ospita({
      onCodice: function (codice) { stato.codice = codice; broadcastEdisegna(); },
      onAddio: function (id) {
        var i = indexById(stato, id);
        if (i < 0) return;
        stato.giocatori.splice(i, 1);
        if (stato.turno >= stato.giocatori.length && stato.giocatori.length) stato.turno = stato.turno % stato.giocatori.length;
        if (stato.iniziata && stato.giocatori.length === 0) { rete.chiudi(); return t.esci(); }
        if (stato.iniziata && stato.fase !== "fine" && attiviRestano(stato) === 0) return finisci();
        broadcastEdisegna();
      },
      onMsg: function (id, msg) {
        if (!msg || !msg.t) return;
        if (msg.t === "join") {
          if (!stato.iniziata && indexById(stato, id) < 0)
            stato.giocatori.push({ id: id, nome: String(msg.nome || "Amico").slice(0, 16), restano: stato.carte });
          broadcastEdisegna();
        } else if (msg.t === "place") { piazza(id, msg.gap); }
        else if (msg.t === "avanti") { avanti(id); }
      },
      onErrore: function (e) { schermataNoNet(t, e); }
    });

    function invia() { rete.invia({ t: "vm", vm: vmDa(stato) }); }
    function broadcastEdisegna() { invia(); disegna(); }

    function comincia() {
      if (stato.iniziata || stato.giocatori.length < 1) return;
      stato.iniziata = true;
      stato.linea = [ stato.mazzo.pop() ]; ordina(stato.linea);
      stato.carta = stato.mazzo.pop(); stato.esito = null; stato.fase = "turno";
      broadcastEdisegna();
    }
    function piazza(playerId, gap) {
      if (stato.fase !== "turno") return;
      var g = stato.giocatori[stato.turno % stato.giocatori.length];
      if (!g || g.id !== playerId) return;
      var carta = stato.carta, linea = stato.linea, Y = carta.anno;
      var ok = ((gap === 0) || (linea[gap - 1].anno <= Y)) && ((gap === linea.length) || (Y <= linea[gap].anno));
      var appenaFinito = false;
      if (ok) { linea.push(carta); ordina(linea); g.restano -= 1; if (g.restano === 0) { stato.ordineFine.push(g.nome); appenaFinito = true; } }
      stato.esito = { giusto: ok, anno: carta.anno, titolo: carta.titolo, fatto: carta.fatto || "", nome: g.nome, finito: appenaFinito };
      stato.fase = "esito";
      broadcastEdisegna();
    }
    function avanti(playerId) {
      if (stato.fase !== "esito") return;
      var g = stato.giocatori[stato.turno % stato.giocatori.length];
      if (!g || g.id !== playerId) return; // solo chi ha appena giocato fa avanzare
      // finisce SOLO quando tutti hanno finito le carte (o si esaurisce il mazzo)
      if (attiviRestano(stato) === 0 || stato.mazzo.length === 0) return finisci();
      stato.turno += 1; assicuraAttivo(stato);
      stato.carta = stato.mazzo.pop(); stato.esito = null; stato.fase = "turno";
      broadcastEdisegna();
    }
    function finisci() {
      stato.fase = "fine";
      var fatti = stato.ordineFine.map(function (nome) { return { nome: nome, punti: "finito!" }; });
      var restanti = stato.giocatori.filter(function (x) { return x.restano > 0; })
        .sort(function (a, b) { return a.restano - b.restano; })
        .map(function (x) { return { nome: x.nome, punti: x.restano + (x.restano === 1 ? " carta rimasta" : " carte rimaste") }; });
      stato.classifica = fatti.concat(restanti);
      broadcastEdisegna();
    }

    var cb = {
      myId: "host", sonoHost: true,
      onGap: function (g) { piazza("host", g); },
      onAvanti: function () { avanti("host"); },
      onComincia: comincia,
      onEsci: function () { rete.chiudi(); t.esci(); }
    };
    function disegna() { disegnaVM(t, vmDa(stato), cb); }
    disegna();
  }

  // ---- Un OSPITE entra con il codice ----
  function ospiteEntra(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return schermataNoNet(t);
    var el = t.el;
    var S = { myId: null, vm: null, rete: null, nome: "" };
    var cb = {
      myId: null, sonoHost: false,
      onGap: function (g) { S.rete && S.rete.invia({ t: "place", gap: g }); },
      onAvanti: function () { S.rete && S.rete.invia({ t: "avanti" }); },
      onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); }
    };
    function disegna() { if (S.vm) { cb.myId = S.myId; disegnaVM(t, S.vm, cb); } }

    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🔗", titolo: "Entra nella partita", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      input.style.borderColor = "var(--accento)";
      var msg = el("div", { class: "link-avviso" });
      S.msg = msg;
      s._contenuto.appendChild(input);
      s._contenuto.appendChild(msg);
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        S.nome = (input.value || "Amico").trim() || "Amico";
        msg.textContent = "Collegamento in corso…";
        collega();
      }}));
      t.mostra(s);
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (mioId) {
          S.myId = mioId; S.rete.invia({ t: "join", nome: S.nome });
          // se dopo qualche secondo non arriva niente, forse il codice è sbagliato
          setTimeout(function () {
            if (!S.vm && S.msg) S.msg.textContent = "Non trovo la partita. Controlla il codice, o aspetta che l'host apra la stanza…";
          }, 8000);
        },
        onMsg: function (m) { if (m && m.t === "vm") { S.vm = m.vm; disegna(); } },
        onChiuso: function () { schermaErrore("Collegamento perso. L'host potrebbe aver chiuso la partita."); },
        onErrore: function (e) { schermaErrore(codiceErrore(e)); }
      });
    }
    function schermaErrore(txt) {
      var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
      s._contenuto.appendChild(el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
      t.mostra(s);
    }
  }

  // ---- Disegno condiviso (host e ospiti disegnano dalla stessa "foto") ----
  function disegnaVM(t, vm, cb) {
    var el = t.el;
    if (vm.fase === "lobby") return disegnaLobby(t, vm, cb);
    if (vm.fase === "fine") return disegnaFineOnline(t, vm, cb);

    var mioTurno = vm.turnoId && cb.myId && vm.turnoId === cb.myId;
    var io = trovaGiocatore(vm, cb.myId);
    var s = t.schermata({
      titolo: mioTurno ? "Tocca a te!" : ("Tocca a " + vm.turnoNome),
      sotto: "Stanza " + (vm.codice || ""), icona: "🔗",
      indietro: function () { if (window.confirm("Uscire dalla partita?")) cb.onEsci(); }
    });
    s._contenuto.appendChild(el("p", { class: "tl-restano",
      text: io ? ("Ti restano " + io.restano + (io.restano === 1 ? " carta" : " carte")) : "Stai guardando la partita" }));

    if (vm.fase === "turno") {
      s._contenuto.appendChild(nodoCartaMano(el, vm.carta || { titolo: "" },
        mioTurno ? "Dove va?" : ("Sta giocando " + vm.turnoNome)));
      var linea = el("div", { class: "tl-linea" });
      if (mioTurno) linea.appendChild(gapBtn(el, cb, 0));
      vm.linea.forEach(function (ev, i) {
        linea.appendChild(nodoEvento(el, ev));
        if (mioTurno) linea.appendChild(gapBtn(el, cb, i + 1));
        else linea.appendChild(el("div", { style: "height:8px" }));
      });
      s._contenuto.appendChild(linea);
      if (!mioTurno) s._contenuto.appendChild(el("p", { class: "link-avviso centro", text: "La linea si aggiorna da sola. Aspetta il tuo turno." }));
    } else if (vm.fase === "esito") {
      var es = vm.esito || {};
      s._contenuto.appendChild(el("div", { class: "tl-esito" }, [
        el("div", { class: "faccia", text: es.giusto ? "✅" : "❌" }),
        el("div", { class: "verdetto " + (es.giusto ? "giusto" : "sbagliato"),
          text: (es.nome ? es.nome + ": " : "") + (es.giusto ? "esatto!" : "sbagliato") }),
        el("div", { class: "annone", text: annoTesto(es.anno) }),
        el("div", { class: "titoletto", text: es.titolo }),
        es.finito ? el("div", { class: "tl-finito", text: "🎉 " + es.nome + " ha finito le sue carte!" }) : null
      ]));
      if (mioTurno) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Avanti ▶", onclick: cb.onAvanti }));
      else s._piede.appendChild(el("p", { class: "link-avviso centro", text: "In attesa di " + vm.turnoNome + "…" }));
    }
    t.mostra(s);
  }

  function gapBtn(el, cb, indice) {
    return el("button", { class: "tl-gap", html: "⤵ &nbsp;metti qui", onclick: function () { cb.onGap(indice); } });
  }

  function disegnaLobby(t, vm, cb) {
    var el = t.el;
    var s = t.schermata({ icona: "🔗", titolo: "Sala d'attesa",
      sotto: cb.sonoHost ? "Invita gli amici" : "Aspetta l'inizio", indietro: cb.onEsci });
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "Codice della stanza" }));
    s._contenuto.appendChild(el("div", { class: "codice-stanza", text: (vm.codice || "…").toUpperCase() }));
    if (cb.sonoHost && vm.codice && vm.codice !== "…") {
      var link = SG.creaLink({ gioco: "timeline", stanza: vm.codice });
      var campo = el("input", { class: "link-campo", type: "text", readonly: "readonly", value: link });
      s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", html: "🔗 Copia il link da mandare",
        onclick: function () { campo.focus(); campo.select(); try { navigator.clipboard.writeText(link); } catch (e) {} } }));
      s._contenuto.appendChild(campo);
    }
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "Chi c'è (" + vm.giocatori.length + ")" }));
    var lista = el("div");
    vm.giocatori.forEach(function (g) {
      lista.appendChild(el("div", { class: "lobby-giocatore", text: "🙂 " + g.nome + (g.id === cb.myId ? " (tu)" : "") }));
    });
    s._contenuto.appendChild(lista);
    if (cb.sonoHost) {
      s._piede.appendChild(el("button", { class: "btn btn-primario",
        text: vm.giocatori.length < 2 ? "Comincia (meglio in 2 o più)" : "Comincia ▶", onclick: cb.onComincia }));
    } else {
      s._piede.appendChild(el("p", { class: "link-avviso centro", text: "In attesa che l'host cominci…" }));
    }
    t.mostra(s);
  }

  function disegnaFineOnline(t, vm, cb) {
    var el = t.el;
    var s = t.schermata({ icona: "🏆", titolo: "Fine partita", sotto: "Stanza " + (vm.codice || "") });
    var ol = el("ol", { class: "classifica" });
    var med = ["🥇", "🥈", "🥉"];
    (vm.classifica || []).forEach(function (r, i) {
      ol.appendChild(el("li", { class: i === 0 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: med[i] || (i + 1) + "°" }),
        el("span", { class: "nome", text: r.nome }),
        r.punti != null ? el("span", { class: "punti", text: r.punti }) : null
      ]));
    });
    s._contenuto.appendChild(ol);
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: cb.onEsci }));
    t.mostra(s);
  }

  function schermataNoNet(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità \"ognuno dal suo telefono\" funziona quando il gioco è aperto dal sito pubblicato online. Da un file locale o da un'anteprima non è disponibile: intanto puoi usare \"Un telefono solo\"." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  function codiceErrore(e) {
    var ty = e && e.type;
    if (ty === "no-mqtt") return "Il collegamento tra telefoni non è disponibile qui.";
    return "Problema di collegamento. Controlla la connessione e riprova.";
  }

  SG.registra(gioco);
})();

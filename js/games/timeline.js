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
    ".tl-restano{font-size:.85rem;color:var(--testo-tenue);text-align:center;margin:0 0 4px;}",
    ".tl-linea{display:flex;flex-direction:column;gap:0;}",
    ".tl-evento{background:var(--carta);border-radius:14px;padding:12px 14px;display:flex;",
      "align-items:center;gap:14px;box-shadow:var(--ombra);}",
    ".tl-evento .anno{font-size:1.5rem;font-weight:800;color:var(--accento);min-width:2.6em;text-align:right;}",
    ".tl-evento .et{font-size:1rem;line-height:1.25;}",
    ".tl-gap{width:100%;min-height:46px;margin:8px 0;border:2px dashed var(--carta-2);",
      "background:transparent;color:var(--testo-tenue);border-radius:12px;font-family:inherit;",
      "font-weight:700;font-size:.95rem;cursor:pointer;transition:all .12s ease;}",
    ".tl-gap:active,.tl-gap:hover{border-color:var(--accento);color:var(--accento);}",
    ".tl-esito{text-align:center;flex:1;display:flex;flex-direction:column;justify-content:center;gap:6px;}",
    ".tl-esito .faccia{font-size:4rem;}",
    ".tl-esito .verdetto{font-size:1.6rem;font-weight:800;}",
    ".tl-esito .giusto{color:var(--verde);} .tl-esito .sbagliato{color:var(--rosso);}",
    ".tl-esito .annone{font-size:2.4rem;font-weight:800;color:var(--accento);}",
    ".tl-esito .titoletto{font-size:1.2rem;font-weight:700;}",
    ".tl-esito .fatto{color:var(--testo-tenue);line-height:1.5;max-width:34ch;margin:6px auto 0;}"
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

    // Impostazione extra: quante carte a testa
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.carte = 5; // valore di partenza
      box.appendChild(el("div", { class: "etichetta", text: "Carte da piazzare a testa" }));
      var valore = el("span", { class: "valore", text: dove.carte });
      function agg(d) {
        dove.carte = Math.max(3, Math.min(8, dove.carte + d));
        valore.textContent = dove.carte;
      }
      box.appendChild(el("div", { class: "stepper" }, [
        el("button", { text: "−", "aria-label": "meno", onclick: function () { agg(-1); } }),
        valore,
        el("button", { text: "+", "aria-label": "più", onclick: function () { agg(1); } })
      ]));
    },

    // --- Partenza ---
    avvia: function (t) {
      var DATI = window.TIMELINE_EVENTI || [];
      var mazzo = t.mischia(DATI);
      var carteAtesta = (t.impostazioni && t.impostazioni.carte) || 5;

      var stato = {
        mazzo: mazzo,
        linea: [ mazzo.pop() ],                 // carta di partenza, già scoperta
        turno: 0,
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

  function giocatoreDiTurno(stato) {
    return stato.giocatori[stato.turno % stato.giocatori.length];
  }

  // --- Un turno: pesca una carta e chiedi dove va ---
  function iniziaTurno(t, stato) {
    if (stato.mazzo.length === 0) return finePerMazzo(t, stato);
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

    s._contenuto.appendChild(el("div", { class: "tl-carta-mano" }, [
      el("div", { class: "occhiello", text: "Dove va?" }),
      el("div", { class: "titolo", text: stato.carta.titolo })
    ]));

    var linea = el("div", { class: "tl-linea" });
    // gap prima del primo, poi carta+gap per ognuno
    linea.appendChild(bottoneGap(t, stato, 0));
    stato.linea.forEach(function (ev, i) {
      linea.appendChild(el("div", { class: "tl-evento" }, [
        el("span", { class: "anno", text: annoTesto(ev.anno) }),
        el("span", { class: "et", text: ev.titolo })
      ]));
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

    if (giusto) {
      linea.push(carta); ordina(linea);
      g.restano -= 1;
    }
    // se sbagliato: la carta si scarta (restano invariato: si "ripesca" al turno dopo)

    disegnaEsito(t, stato, giusto);
  }

  function disegnaEsito(t, stato, giusto) {
    var el = t.el;
    var carta = stato.carta;
    var g = giocatoreDiTurno(stato);
    var vinto = g.restano === 0;

    var s = t.schermata({});
    s._contenuto.appendChild(el("div", { class: "tl-esito" }, [
      el("div", { class: "faccia", text: giusto ? "✅" : "❌" }),
      el("div", { class: "verdetto " + (giusto ? "giusto" : "sbagliato"),
        text: giusto ? "Esatto!" : "Non ci siamo" }),
      el("div", { class: "annone", text: annoTesto(carta.anno) }),
      el("div", { class: "titoletto", text: carta.titolo }),
      carta.fatto ? el("div", { class: "fatto", text: carta.fatto }) : null
    ]));

    if (vinto) {
      s._piede.appendChild(el("button", {
        class: "btn btn-verde", text: "🏆 " + g.nome + " ha finito le carte!",
        onclick: function () { fineVittoria(t, stato); }
      }));
      t.mostra(s);
      return;
    }

    // prossimo giocatore
    stato.turno += 1;
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

  // --- Fine ---
  function classificaDa(stato) {
    return stato.giocatori.slice().sort(function (a, b) {
      return a.restano - b.restano;
    }).map(function (g) {
      return { nome: g.nome, punti: g.restano === 0 ? "finito!" : g.restano + " da piazzare" };
    });
  }

  function fineVittoria(t, stato) { t.fine(classificaDa(stato)); }

  function finePerMazzo(t, stato) {
    // finite le carte del mazzo: vince chi ne ha piazzate di più (meno restano)
    t.fine(classificaDa(stato));
  }

  function confermaUscita() {
    return window.confirm("Uscire dalla partita in corso?");
  }

  function annoTesto(a) {
    return a < 0 ? Math.abs(a) + " a.C." : String(a);
  }

  SG.registra(gioco);
})();

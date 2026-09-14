/* =========================================================
   GIOCO — L'Asta
   Un telefono appoggiato al tavolo: tutti vedono le carte e
   ognuno tocca il proprio tasto per rilanciare.
   4 round a tema; in ogni round ciascuno si aggiudica 1 carta.
   Alla fine si votano i kit degli altri con le stelle.
   ========================================================= */
(function () {
  "use strict";

  var TOT_ROUND = 4;
  var SECONDI = 10;      // conto alla rovescia dopo ogni rilancio
  var MAX_GIOCATORI = 10;

  // --- Aspetto specifico del gioco ---
  var stile = document.createElement("style");
  stile.textContent = [
    ".as-round{text-align:center;margin:6px 0 14px;}",
    ".as-round .n{font-size:.8rem;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--testo-tenue);}",
    ".as-round .t{font-size:2rem;font-weight:900;line-height:1.05;margin-top:2px;",
      "background:linear-gradient(135deg,#ffe58a,var(--accento) 55%,#ff9d3a);",
      "-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;}",
    ".as-top{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 8px;margin:0 -2px 10px;}",
    ".as-pt{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:1px;background:var(--carta);",
      "border:2px solid transparent;border-radius:14px;padding:7px 12px;min-width:66px;}",
    ".as-pt .n{font-size:.78rem;font-weight:700;color:var(--testo-tenue);max-width:9ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".as-pt .c{font-size:1.05rem;font-weight:900;}",
    ".as-pt.attivo{border-color:var(--accento);}",
    ".as-pt.fatto{opacity:.5;}",
    ".as-griglia{display:flex;flex-direction:column;gap:10px;}",
    ".as-carta{display:flex;align-items:center;gap:14px;width:100%;text-align:left;border:0;cursor:pointer;",
      "background:var(--carta);color:inherit;border-radius:16px;padding:14px;box-shadow:var(--ombra);",
      "font-family:inherit;transition:transform .06s ease;}",
    ".as-carta:active{transform:scale(.98);}",
    ".as-carta .em{font-size:2rem;width:52px;height:52px;flex:0 0 auto;display:flex;align-items:center;",
      "justify-content:center;border-radius:14px;background:linear-gradient(150deg,var(--carta-2),#201d44);}",
    ".as-carta .nm{flex:1;min-width:0;font-size:1.1rem;font-weight:800;line-height:1.2;}",
    ".tier{flex:0 0 auto;font-size:.85rem;font-weight:900;width:30px;height:30px;border-radius:50%;",
      "display:flex;align-items:center;justify-content:center;}",
    ".tier-A{background:linear-gradient(135deg,#ffe58a,var(--accento-scuro));color:#241f00;}",
    ".tier-B{background:linear-gradient(135deg,#9fb4ff,#5468c7);color:#0d1230;}",
    ".tier-C{background:var(--carta-2);color:var(--testo-tenue);}",
    ".as-big{text-align:center;background:linear-gradient(150deg,#fff0c2,var(--accento) 55%,var(--accento-scuro));",
      "color:#2a2400;border-radius:22px;padding:18px;box-shadow:0 10px 30px rgba(224,169,10,.35);margin-bottom:12px;}",
    ".as-big .em{font-size:3rem;line-height:1;}",
    ".as-big .nm{font-size:1.5rem;font-weight:900;line-height:1.15;margin-top:4px;}",
    ".as-offerta{text-align:center;margin:10px 0;}",
    ".as-offerta .v{font-size:2.6rem;font-weight:900;color:var(--accento);line-height:1;}",
    ".as-offerta .chi{font-size:1rem;font-weight:700;color:var(--testo-tenue);margin-top:2px;}",
    ".as-timer{height:8px;border-radius:99px;background:var(--carta);overflow:hidden;margin:4px 0 14px;}",
    ".as-timer-fill{height:100%;width:100%;border-radius:99px;background:linear-gradient(90deg,var(--verde),var(--accento));}",
    ".as-bid{display:flex;align-items:center;gap:8px;background:var(--carta);border:2px solid transparent;",
      "border-radius:14px;padding:8px 10px;margin-bottom:8px;}",
    ".as-bid.leader{border-color:var(--accento);}",
    ".as-bid .who{flex:1;min-width:0;}",
    ".as-bid .who b{display:block;font-size:1rem;line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".as-bid .who span{font-size:.8rem;color:var(--testo-tenue);}",
    ".as-bid button{border:0;font-family:inherit;font-weight:800;border-radius:12px;cursor:pointer;min-height:44px;padding:0 14px;}",
    ".as-bid .su{background:linear-gradient(135deg,#4fe895,#1faf60);color:#04321c;font-size:1rem;}",
    ".as-bid .no{background:var(--carta-2);color:var(--testo-tenue);font-size:.9rem;}",
    ".as-bid button:disabled{opacity:.35;}",
    ".as-fuori{opacity:.45;}",
    ".as-kit{background:var(--carta);border-radius:16px;padding:14px;margin-bottom:12px;box-shadow:var(--ombra);}",
    ".as-kit h3{margin:0 0 8px;font-size:1.15rem;}",
    ".as-kit .riga{display:flex;align-items:center;gap:10px;padding:4px 0;font-size:.98rem;}",
    ".as-kit .riga .em{font-size:1.3rem;}",
    ".as-stelle{display:flex;gap:6px;justify-content:center;margin-top:10px;}",
    ".as-stelle button{border:0;background:transparent;font-size:1.9rem;line-height:1;cursor:pointer;",
      "filter:grayscale(1);opacity:.4;padding:2px;}",
    ".as-stelle button.on{filter:none;opacity:1;}",
    ".as-msg{text-align:center;color:var(--testo-tenue);font-weight:700;}",
    // striscia dei 4 round (tutte le cose che si metteranno all'asta): quella in corso ha il contorno giallo
    ".as-steps{display:flex;gap:5px;justify-content:center;margin:2px 0 12px;}",
    ".as-step{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;background:var(--carta);",
      "border:2px solid transparent;border-radius:12px;padding:7px 3px 6px;opacity:.6;position:relative;}",
    ".as-step .si{font-size:1.2rem;line-height:1;}",
    ".as-step .sn{font-size:.58rem;font-weight:800;line-height:1.12;text-align:center;color:var(--testo);}",
    ".as-step .sk{position:absolute;top:2px;right:4px;font-size:.62rem;color:var(--verde);font-weight:900;}",
    ".as-step.fatto{opacity:.5;}",
    ".as-step.ora{opacity:1;border-color:var(--accento);background:linear-gradient(150deg,var(--carta-2),#2a2550);",
      "box-shadow:0 0 0 1px var(--accento) inset,0 4px 14px rgba(224,169,10,.25);}",
    ".as-step.ora .sn{color:var(--accento);}",
    // pannello \"ancora in palio\" durante l'asta di una carta
    ".as-palio{background:var(--carta);border-radius:14px;margin:2px 0 12px;padding:2px 12px 8px;}",
    ".as-palio .ph{padding:10px 0 2px;font-weight:800;color:var(--testo);display:flex;align-items:center;gap:8px;font-size:.95rem;}",
    ".as-palio .pr{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid rgba(255,255,255,.08);font-size:.95rem;}",
    ".as-palio .pr .em{font-size:1.25rem;width:32px;text-align:center;flex:0 0 auto;}",
    ".as-palio .pr .nm{flex:1;min-width:0;}",
    ".as-palio .pr.ora-c{color:var(--accento);font-weight:800;}"
  ].join("");
  document.head.appendChild(stile);

  // --- suoni ---
  var AC = null;
  function ctx() { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) {} return AC; }
  function beep(fr, dur, tipo) {
    var c = ctx(); if (!c) return;
    var t0 = c.currentTime;
    fr.forEach(function (f, i) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = tipo || "sine"; o.frequency.value = f;
      var s = t0 + i * (dur * 0.6);
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.22, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + dur);
    });
  }
  function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  var FX = {
    rilancio: function () { beep([740], 0.09, "square"); vibra(25); },
    aggiudicato: function () { beep([660, 880, 1180], 0.16, "triangle"); vibra([70, 50, 90]); },
    round: function () { beep([520, 780], 0.14, "sine"); vibra(60); },
    fine: function () { beep([660, 880, 1046, 1318], 0.2, "triangle"); vibra([120, 60, 120, 60, 200]); }
  };

  function mischia(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

  // --- memoria delle carte già uscite ---
  // Ricorda le ultime carte apparse (su questo telefono) e preferisce
  // quelle mai viste: così due o tre partite di fila non si somigliano.
  var CHIAVE_VISTI = "sg_asta_visti_";
  var MEMORIA = 90;
  function elencoVisti(id) {
    try { var v = JSON.parse(localStorage.getItem(CHIAVE_VISTI + id) || "[]"); return (v instanceof Array) ? v : []; }
    catch (e) { return []; }
  }
  function segnaVisti(id, nomi) {
    try {
      var v = elencoVisti(id).concat(nomi);
      if (v.length > MEMORIA) v = v.slice(v.length - MEMORIA);
      localStorage.setItem(CHIAVE_VISTI + id, JSON.stringify(v));
    } catch (e) {}
  }

  // Prende N carte dal round tenendo RARI i pezzi migliori:
  // circa un terzo di fascia A, un terzo di C e il resto B.
  // Con 4 giocatori esce 1 carta A, 2 B e 1 C: mai quattro pezzi top.
  function carteDelRound(r, n, temaId) {
    var visti = elencoVisti(temaId);
    // prima le carte mai viste, poi le altre
    function perFreschezza(lista) {
      var nuove = [], viste = [];
      (lista || []).forEach(function (c) { (visti.indexOf(c.nome) < 0 ? nuove : viste).push(c); });
      return mischia(nuove).concat(mischia(viste));
    }
    var pool = { A: perFreschezza(r.A), B: perFreschezza(r.B), C: perFreschezza(r.C) };
    var quota = { A: Math.max(1, Math.floor(n / 3)), C: Math.max(1, Math.floor(n / 3)) };
    quota.B = n - quota.A - quota.C;
    if (quota.B < 0) { quota.B = 0; quota.A = Math.min(quota.A, n); quota.C = n - quota.A; }

    var scelte = [];
    ["A", "B", "C"].forEach(function (t) {
      for (var i = 0; i < quota[t] && pool[t].length; i++) {
        var c = pool[t].shift();
        scelte.push({ nome: c.nome, emoji: c.emoji, tier: t });
      }
    });
    // se una fascia è finita, si completa con le altre (prima B, poi C, poi A)
    var giro = 0;
    while (scelte.length < n && giro < 60) {
      var t2 = ["B", "C", "A"][giro % 3];
      if (pool[t2].length) { var c2 = pool[t2].shift(); scelte.push({ nome: c2.nome, emoji: c2.emoji, tier: t2 }); }
      giro++;
    }
    segnaVisti(temaId, scelte.map(function (c) { return c.nome; }));
    return mischia(scelte);
  }

  function barraTimer(el, ms, onFine) {
    var wrap = el("div", { class: "as-timer" });
    var fill = el("div", { class: "as-timer-fill" });
    wrap.appendChild(fill);
    requestAnimationFrame(function () { fill.style.transition = "width " + ms + "ms linear"; fill.style.width = "0%"; });
    var to = setTimeout(onFine, ms);
    wrap._stop = function () { clearTimeout(to); };
    return wrap;
  }

  // Quanto può puntare al massimo: deve tenere 1 credito per ogni round futuro
  function maxPuntata(st, i) {
    var futuri = (TOT_ROUND - 1) - st.roundIdx;
    return st.giocatori[i].crediti - futuri;
  }

  function strisciaCrediti(el, st, attivoIdx) {
    var top = el("div", { class: "as-top" });
    st.giocatori.forEach(function (g, i) {
      var haCarta = st.senzaCarta.indexOf(i) < 0;
      top.appendChild(el("div", { class: "as-pt" + (i === attivoIdx ? " attivo" : "") + (haCarta ? " fatto" : "") }, [
        el("div", { class: "n", text: g.nome }),
        el("div", { class: "c", text: g.crediti + "💰" })
      ]));
    });
    return top;
  }

  // la striscia con TUTTI e 4 i round (le cose che si metteranno all'asta): quello in corso
  // ha il contorno giallo, quelli già fatti hanno la spunta, i prossimi si vedono comunque.
  function strisciaRound(el, rounds, idx) {
    var box = el("div", { class: "as-steps" });
    (rounds || []).forEach(function (r, i) {
      box.appendChild(el("div", { class: "as-step" + (i === idx ? " ora" : (i < idx ? " fatto" : "")) }, [
        (i < idx ? el("span", { class: "sk", text: "✓" }) : null),
        el("span", { class: "si", text: r.icona || "" }),
        el("span", { class: "sn", text: r.nome || "" })
      ]));
    });
    return box;
  }

  // elenco SEMPRE VISIBILE delle carte ancora in palio nel round (quella in corso è evidenziata)
  function dettaglioPalio(el, cards, nomeCorrente) {
    if (!cards || !cards.length) return null;
    var box = el("div", { class: "as-palio" });
    box.appendChild(el("div", { class: "ph" }, [
      el("span", { text: "🎁" }),
      el("span", { style: "flex:1", text: "Ancora in palio in questo round (" + cards.length + ")" })
    ]));
    cards.forEach(function (c) {
      var ora = (c.nome === nomeCorrente);
      box.appendChild(el("div", { class: "pr" + (ora ? " ora-c" : "") }, [
        el("span", { class: "em", text: c.emoji }),
        el("span", { class: "nm", text: c.nome + (ora ? " · all'asta ora" : "") }),
        el("span", { class: "tier tier-" + c.tier, text: c.tier })
      ]));
    });
    return box;
  }

  function intestazioneRound(el, st) {
    var wrap = el("div", {});
    wrap.appendChild(el("div", { class: "as-round", style: "margin:6px 0 4px" }, [
      el("div", { class: "n", text: "Round " + (st.roundIdx + 1) + " di " + TOT_ROUND })
    ]));
    wrap.appendChild(strisciaRound(el, st.tema.round, st.roundIdx));
    return wrap;
  }

  var gioco = {
    id: "asta",
    nome: "L'Asta",
    icona: "🔨",
    descrizione: "Compra all'asta le carte migliori e costruisci il kit che gli altri voteranno.",
    giocatoriMin: 2,
    giocatoriMax: MAX_GIOCATORI,
    difficolta: 3,   // Difficile — vale di più nel torneo (1 facile, 2 media, 3 difficile)

    regole: [
      "Un solo telefono <b>appoggiato al tavolo</b>: tutti vedono le carte e ognuno tocca il proprio tasto.",
      "Si giocano <b>4 round</b> a tema. In ogni round sul tavolo ci sono tante carte quanti sono i giocatori e <b>ognuno se ne aggiudica una</b>.",
      "A turno uno sceglie quale carta mettere all'asta: parte da <b>1 credito</b>. Gli altri possono <b>rilanciare</b> (+1) o <b>passare</b>.",
      "Dopo ogni rilancio partono <b>10 secondi</b>: allo scadere la carta va a chi ha l'offerta più alta. <b>Paga solo il vincitore.</b>",
      "Attenzione: devi tenere <b>almeno 1 credito per ogni round che resta</b>, altrimenti rimani a piedi.",
      "Alla fine ognuno vota i kit degli altri da <b>1 a 5 stelle</b> (non il proprio): vince chi ne raccoglie di più."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      // --- Come si gioca: un telefono solo oppure ognuno dal suo ---
      dove.modo = "telefono";
      if (!aiuti.torneo) {
      box.appendChild(el("div", { class: "etichetta", text: "Come si gioca" }));
      var notaOn = el("div", { class: "link-avviso", hidden: "hidden" });
      var bTel, bOnl;
      function scegliModo(m) {
        dove.modo = m;
        bTel.className = "modo-chip" + (m === "telefono" ? " attiva" : "");
        bOnl.className = "modo-chip" + (m === "online" ? " attiva" : "");
        notaOn.hidden = (m !== "online");
        notaOn.textContent = (window.SGNet && SGNet.disponibile())
          ? "Gli altri entrano dai loro telefoni con un codice: nella sala basta il TUO nome."
          : "Attenzione: qui il collegamento non è disponibile. Funziona quando il gioco è aperto dal sito pubblicato.";
      }
      bTel = el("button", { class: "modo-chip attiva", onclick: function () { scegliModo("telefono"); } }, [
        el("span", { class: "mi", text: "📱" }), el("div", {}, [
          el("div", { class: "mt", text: "Un telefono solo" }), el("div", { class: "ms", text: "Appoggiato al tavolo" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { scegliModo("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [
          el("div", { class: "mt", text: "Ognuno dal suo telefono" }), el("div", { class: "ms", text: "Ognuno rilancia dal proprio" })])]);
      box.appendChild(el("div", { class: "modo-griglia" }, [bTel, bOnl]));
      box.appendChild(notaOn);
      }
      dove.crediti = 15;
      box.appendChild(el("div", { class: "etichetta", text: "Crediti a testa" }));
      var b15, b20;
      function scegli(v) {
        dove.crediti = v;
        b15.className = "modo-chip" + (v === 15 ? " attiva" : "");
        b20.className = "modo-chip" + (v === 20 ? " attiva" : "");
      }
      b15 = el("button", { class: "modo-chip attiva", onclick: function () { scegli(15); } }, [
        el("span", { class: "mi", text: "💰" }), el("div", {}, [
          el("div", { class: "mt", text: "15 crediti" }), el("div", { class: "ms", text: "Partita tirata" })])]);
      b20 = el("button", { class: "modo-chip", onclick: function () { scegli(20); } }, [
        el("span", { class: "mi", text: "💰" }), el("div", {}, [
          el("div", { class: "mt", text: "20 crediti" }), el("div", { class: "ms", text: "Più margine per i rilanci" })])]);
      box.appendChild(el("div", { class: "modo-griglia" }, [b15, b20]));

      var temi = window.SG_ASTA_TEMI || [];
      dove.tema = temi.length ? temi[0].id : null;
      if (temi.length > 1) {
        box.appendChild(el("div", { class: "etichetta", text: "Tema" }));
        var g = el("div", { class: "cat-griglia" });
        temi.forEach(function (tm) {
          var chip = el("button", { class: "cat-chip" + (tm.id === dove.tema ? " attiva" : ""), onclick: function () {
            dove.tema = tm.id;
            [].forEach.call(g.children, function (c) { c.className = "cat-chip"; });
            chip.className = "cat-chip attiva";
          } }, [ el("span", { class: "ci", text: tm.icona }), el("span", { text: tm.nome }), el("span", { class: "spunta", text: "✓" }) ]);
          g.appendChild(chip);
        });
        box.appendChild(g);
      } else if (temi.length === 1) {
        box.appendChild(el("div", { class: "link-avviso", text: "Tema: " + temi[0].icona + " " + temi[0].nome + " — " + temi[0].sottotitolo }));
      }
    },

    avvia: function (t) {
      var temi = window.SG_ASTA_TEMI || [];
      if (!temi.length) return niente(t, "Mancano le carte del gioco.");
      if (t.linkParams && t.linkParams.stanza) return ospiteAsta(t, t.linkParams.stanza);
      var idT = (t.impostazioni && t.impostazioni.tema) || temi[0].id;
      var tema = temi.filter(function (x) { return x.id === idT; })[0] || temi[0];
      var crediti = (t.impostazioni && t.impostazioni.crediti) || 15;
      if (t.impostazioni && t.impostazioni.modo === "online") return hostAsta(t, tema, crediti);

      var st = {
        tema: tema, roundIdx: 0, chooserPtr: 0, tavolo: [], senzaCarta: [], asta: null,
        giocatori: t.giocatori.map(function (n) { return { nome: n, crediti: crediti, kit: [], stelle: 0 }; })
      };
      iniziaRound(t, st);
    }
  };

  function niente(t, msg) {
    var s = t.schermata({ icona: "🔨", titolo: "L'Asta", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { text: msg, style: "font-size:1.05rem" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // ---- inizio round ----
  function iniziaRound(t, st) {
    var el = t.el;
    var r = st.tema.round[st.roundIdx];
    st.tavolo = carteDelRound(r, st.giocatori.length, st.tema.id);
    st.senzaCarta = st.giocatori.map(function (_, i) { return i; });
    st.chooserPtr = st.roundIdx; // ruota chi sceglie per primo a ogni round
    FX.round();

    var s = t.schermata({});
    var box = el("div", { style: "flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:10px" }, [
      el("div", { style: "font-size:4rem;line-height:1", text: r.icona }),
      el("div", { class: "as-round" }, [
        el("div", { class: "n", text: "Round " + (st.roundIdx + 1) + " di " + TOT_ROUND }),
        el("div", { class: "t", text: r.nome })
      ]),
      el("p", { class: "as-msg", text: "Sul tavolo " + st.giocatori.length + (st.giocatori.length === 1 ? " carta" : " carte") + ": ognuno se ne aggiudica una." })
    ]);
    s._contenuto.appendChild(box);
    s._contenuto.appendChild(strisciaRound(el, st.tema.round, st.roundIdx));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Vedi le carte ▶", onclick: function () { prossimaAsta(t, st); } }));
    t.mostra(s);
  }

  // ---- decide cosa fare: assegnazione automatica, scelta carta, o fine round ----
  function prossimaAsta(t, st) {
    if (st.senzaCarta.length === 0) return fineRound(t, st);
    if (st.senzaCarta.length === 1 && st.tavolo.length === 1) {
      var i = st.senzaCarta[0], carta = st.tavolo[0];
      st.giocatori[i].crediti -= 1;
      st.giocatori[i].kit.push(carta);
      st.tavolo = []; st.senzaCarta = [];
      return esitoAsta(t, st, i, carta, 1, true);
    }
    schermataScelta(t, st);
  }

  function schermataScelta(t, st) {
    var el = t.el;
    var chi = st.senzaCarta[st.chooserPtr % st.senzaCarta.length];
    var s = t.schermata({ indietro: function () { if (window.confirm("Uscire dalla partita?")) t.esci(); } });
    s._contenuto.appendChild(intestazioneRound(el, st));
    s._contenuto.appendChild(strisciaCrediti(el, st, chi));
    s._contenuto.appendChild(el("p", { class: "as-msg", style: "margin-bottom:10px",
      text: "🔨 " + st.giocatori[chi].nome + ", scegli la carta da mettere all'asta" }));
    var g = el("div", { class: "as-griglia" });
    st.tavolo.forEach(function (c, idx) {
      g.appendChild(el("button", { class: "as-carta", onclick: function () { apriAsta(t, st, chi, idx); } }, [
        el("span", { class: "em", text: c.emoji }),
        el("span", { class: "nm", text: c.nome }),
        el("span", { class: "tier tier-" + c.tier, text: c.tier })
      ]));
    });
    s._contenuto.appendChild(g);
    t.mostra(s);
  }

  // ---- asta su una carta ----
  function apriAsta(t, st, chooser, idxCarta) {
    st.asta = {
      carta: st.tavolo[idxCarta], idxCarta: idxCarta,
      offerta: 1, leader: chooser,
      passati: {}, bar: null
    };
    disegnaAsta(t, st);
  }

  function disegnaAsta(t, st) {
    var el = t.el, a = st.asta;
    var s = t.schermata({ indietro: function () { if (window.confirm("Uscire dalla partita?")) { if (a.bar) a.bar._stop(); t.esci(); } } });
    s._contenuto.appendChild(intestazioneRound(el, st));
    s._contenuto.appendChild(strisciaCrediti(el, st, a.leader));
    s._contenuto.appendChild(el("div", { class: "as-big" }, [
      el("div", { class: "em", text: a.carta.emoji }),
      el("div", { class: "nm", text: a.carta.nome }),
      el("div", { style: "margin-top:6px;font-weight:900;opacity:.75", text: "Fascia " + a.carta.tier })
    ]));
    s._contenuto.appendChild(el("div", { class: "as-offerta" }, [
      el("div", { class: "v", text: a.offerta + " 💰" }),
      el("div", { class: "chi", text: "offerta di " + st.giocatori[a.leader].nome })
    ]));

    // timer: riparte a ogni rilancio
    if (a.bar && a.bar._stop) a.bar._stop();
    a.bar = barraTimer(el, SECONDI * 1000, function () { chiudiAsta(t, st); });
    s._contenuto.appendChild(a.bar);

    // un tasto per ogni giocatore ancora in gara nel round
    var attivi = 0;
    st.senzaCarta.forEach(function (i) {
      var fuori = !!a.passati[i];
      if (!fuori) attivi++;
      var max = maxPuntata(st, i);
      var puo = !fuori && max >= a.offerta + 1;
      var riga = el("div", { class: "as-bid" + (i === a.leader ? " leader" : "") + (fuori ? " as-fuori" : "") }, [
        el("div", { class: "who" }, [
          el("b", { text: (i === a.leader ? "👑 " : "") + st.giocatori[i].nome }),
          el("span", { text: fuori ? "ha passato" : (st.giocatori[i].crediti + " crediti · max " + Math.max(0, max)) })
        ]),
        el("button", { class: "su", text: "+1 → " + (a.offerta + 1), disabled: puo ? null : "disabled",
          onclick: function () { rilancia(t, st, i); } }),
        (fuori || i === a.leader) ? null : el("button", { class: "no", text: "Passa", onclick: function () { passa(t, st, i); } })
      ]);
      s._contenuto.appendChild(riga);
    });

    s._contenuto.appendChild(el("p", { class: "as-msg", style: "margin-top:10px",
      text: "Allo scadere del tempo la carta va a chi offre di più. Paga solo il vincitore." }));
    var pal = dettaglioPalio(el, st.tavolo, a.carta.nome);
    if (pal) s._contenuto.appendChild(pal);
    t.mostra(s);
  }

  function rilancia(t, st, i) {
    var a = st.asta;
    if (maxPuntata(st, i) < a.offerta + 1) return;
    a.offerta += 1; a.leader = i;
    delete a.passati[i];
    FX.rilancio();
    disegnaAsta(t, st);
  }

  function passa(t, st, i) {
    var a = st.asta;
    a.passati[i] = true;
    // se resta solo chi ha l'offerta più alta, l'asta si chiude subito
    var restano = st.senzaCarta.filter(function (x) { return !a.passati[x]; });
    if (restano.length <= 1) { if (a.bar) a.bar._stop(); return chiudiAsta(t, st); }
    disegnaAsta(t, st);
  }

  function chiudiAsta(t, st) {
    var a = st.asta;
    if (!a) return;
    if (a.bar && a.bar._stop) a.bar._stop();
    var vincitore = a.leader, prezzo = a.offerta, carta = a.carta;
    st.giocatori[vincitore].crediti -= prezzo;
    st.giocatori[vincitore].kit.push(carta);
    st.tavolo.splice(a.idxCarta, 1);
    st.senzaCarta = st.senzaCarta.filter(function (x) { return x !== vincitore; });
    st.chooserPtr++;
    st.asta = null;
    esitoAsta(t, st, vincitore, carta, prezzo, false);
  }

  function esitoAsta(t, st, chi, carta, prezzo, automatica) {
    var el = t.el;
    FX.aggiudicato();
    var s = t.schermata({});
    s._contenuto.appendChild(el("div", { style: "flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:8px" }, [
      el("div", { style: "font-size:3.4rem;line-height:1", text: "🔨" }),
      el("div", { style: "font-size:1.6rem;font-weight:900", text: st.giocatori[chi].nome + " si aggiudica" }),
      el("div", { class: "as-big", style: "margin-top:6px" }, [
        el("div", { class: "em", text: carta.emoji }),
        el("div", { class: "nm", text: carta.nome }),
        el("div", { style: "margin-top:6px;font-weight:900;opacity:.75", text: "Fascia " + carta.tier })
      ]),
      el("div", { style: "font-size:1.3rem;font-weight:900;color:var(--accento)", text: "per " + prezzo + " 💰" }),
      automatica ? el("p", { class: "as-msg", text: "Ultima carta rimasta: assegnata automaticamente." }) : null,
      el("p", { class: "as-msg", text: "Gli restano " + st.giocatori[chi].crediti + " crediti." })
    ]));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Avanti ▶", onclick: function () { prossimaAsta(t, st); } }));
    t.mostra(s);
  }

  function fineRound(t, st) {
    st.roundIdx++;
    if (st.roundIdx < TOT_ROUND) return iniziaRound(t, st);
    riepilogo(t, st);
  }

  // ---- riepilogo dei kit ----
  function riepilogo(t, st) {
    var el = t.el;
    var s = t.schermata({ icona: "🎒", titolo: "I kit completi", sotto: "Ora si vota!" });
    st.giocatori.forEach(function (g) {
      s._contenuto.appendChild(nodoKit(el, g, st));
    });
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Si vota ⭐", onclick: function () { votazione(t, st, 0); } }));
    t.mostra(s);
  }

  function nodoKit(el, g, st) {
    var box = el("div", { class: "as-kit" });
    box.appendChild(el("h3", { text: g.nome + " · " + g.crediti + " 💰 avanzati" }));
    g.kit.forEach(function (c, i) {
      box.appendChild(el("div", { class: "riga" }, [
        el("span", { class: "em", text: c.emoji }),
        el("span", { style: "flex:1", text: c.nome }),
        el("span", { class: "tier tier-" + c.tier, text: c.tier })
      ]));
    });
    return box;
  }

  // ---- votazione a stelle: si passa il telefono a ogni giocatore ----
  function votazione(t, st, votante) {
    if (votante >= st.giocatori.length) return finePartita(t, st);
    var nome = st.giocatori[votante].nome;
    t.passaA(nome, function () { schermoVoto(t, st, votante); });
  }

  function schermoVoto(t, st, votante) {
    var el = t.el;
    var voti = {};
    var s = t.schermata({ icona: "⭐", titolo: nomeBreve(st.giocatori[votante].nome) + ", vota i kit", sotto: "Da 1 a 5 stelle (non il tuo)" });
    var avanti = el("button", { class: "btn btn-primario", text: "Conferma i voti", disabled: "disabled",
      onclick: function () {
        st.giocatori.forEach(function (g, i) { if (voti[i]) g.stelle += voti[i]; });
        votazione(t, st, votante + 1);
      } });

    st.giocatori.forEach(function (g, i) {
      if (i === votante) return;
      var box = nodoKit(el, g, st);
      var riga = el("div", { class: "as-stelle" });
      var bottoni = [];
      for (var n = 1; n <= 5; n++) {
        (function (val) {
          var b = el("button", { text: "⭐", "aria-label": val + " stelle", onclick: function () {
            voti[i] = val;
            bottoni.forEach(function (bb, k) { bb.className = (k < val) ? "on" : ""; });
            var mancano = st.giocatori.filter(function (_, j) { return j !== votante && !voti[j]; }).length;
            if (mancano === 0) avanti.removeAttribute("disabled");
          } });
          bottoni.push(b); riga.appendChild(b);
        })(n);
      }
      box.appendChild(riga);
      s._contenuto.appendChild(box);
    });

    s._piede.appendChild(avanti);
    t.mostra(s);
  }

  function nomeBreve(n) { return n.length > 12 ? n.slice(0, 12) + "…" : n; }

  function finePartita(t, st) {
    FX.fine();
    var classifica = st.giocatori.slice().sort(function (a, b) { return b.stelle - a.stelle; })
      .map(function (g) { return { nome: g.nome, punti: g.stelle + " ⭐" }; });
    t.fine(classifica);
  }


  // =========================================================
  //  MODALITÀ ONLINE — "ognuno dal suo telefono"
  //  Un telefono ospita la stanza e tiene l'unica copia vera
  //  della partita: calcola tutto e manda agli altri una "foto".
  //  Gli ospiti disegnano e rimandano solo le proprie mosse.
  // =========================================================

  function futuri(st) { return (TOT_ROUND - 1) - st.roundIdx; }
  function maxPuntataG(st, g) { return g.crediti - futuri(st); }
  function perId(st, id) { for (var i = 0; i < st.giocatori.length; i++) if (st.giocatori[i].id === id) return st.giocatori[i]; return null; }
  function nomeDi(st, id) { var g = perId(st, id); return g ? g.nome : ""; }

  function vmAsta(st) {
    var r = st.tema.round[st.roundIdx] || {};
    var sceglie = st.senzaCarta.length ? st.senzaCarta[st.chooserPtr % st.senzaCarta.length] : null;
    return {
      fase: st.fase, codice: st.codice,
      temaNome: st.tema.nome, temaIcona: st.tema.icona, temaId: st.tema.id,
      temi: (window.SG_ASTA_TEMI || []).map(function (x) { return { id: x.id, nome: x.nome, icona: x.icona }; }),
      roundIdx: st.roundIdx, roundNome: r.nome, roundIcona: r.icona, totRound: TOT_ROUND,
      rounds: (st.tema.round || []).map(function (x) { return { nome: x.nome, icona: x.icona }; }),
      giocatori: st.giocatori.map(function (g) {
        return { id: g.id, nome: g.nome, crediti: g.crediti, haCarta: st.senzaCarta.indexOf(g.id) < 0, kit: g.kit.slice() };
      }),
      tavolo: st.tavolo.map(function (c) { return { nome: c.nome, emoji: c.emoji, tier: c.tier }; }),
      sceglieId: sceglie, sceglieNome: sceglie ? nomeDi(st, sceglie) : "",
      asta: st.asta ? {
        carta: st.asta.carta, offerta: st.asta.offerta,
        leaderId: st.asta.leader, leaderNome: nomeDi(st, st.asta.leader),
        passati: Object.keys(st.asta.passati), scadenza: st.scadenza || null
      } : null,
      esito: st.esito || null,
      hannoVotato: Object.keys(st.voti || {}),
      classifica: st.classifica || null
    };
  }

  // ---------- L'HOST ----------
  function hostAsta(t, tema, crediti) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var st = {
      tema: tema, crediti: crediti, roundIdx: 0, chooserPtr: 0,
      tavolo: [], senzaCarta: [], asta: null, esito: null, classifica: null,
      fase: "lobby", iniziata: false, codice: "…", scadenza: null, _to: null, voti: {},
      giocatori: [{ id: "host", nome: (t.giocatori && t.giocatori[0]) || "Host", crediti: crediti, kit: [], stelle: 0 }]
    };
    function stopTo() { if (st._to) { clearTimeout(st._to); st._to = null; } }

    var rete = SGNet.ospita("asta", {
      onCodice: function (c) { st.codice = c; bd(); },
      onConnesso: function () { st.pronta = true; bd(); },
      onAddio: function (id) {
        if (!perId(st, id)) return;
        st.giocatori = st.giocatori.filter(function (x) { return x.id !== id; });
        st.senzaCarta = st.senzaCarta.filter(function (x) { return x !== id; });
        delete st.voti[id];
        if (st.asta) delete st.asta.passati[id];
        if (st.iniziata && st.giocatori.length === 0) { stopTo(); rete.chiudi(); return t.esci(); }
        if (st.fase === "asta") { if (st.asta && st.asta.leader === id) return chiudi(); if (verificaPassati()) return; }
        if (st.fase === "voto") { verificaVoti(); return; }
        if (st.fase === "scelta" && st.senzaCarta.length === 0) return prossima();
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          if (!st.iniziata && !perId(st, id) && st.giocatori.length < MAX_GIOCATORI)
            st.giocatori.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), crediti: st.crediti, kit: [], stelle: 0 });
          bd();
        }
        else if (m.t === "scegli") scegli(id, m.idx);
        else if (m.t === "rilancia") rilanciaO(id);
        else if (m.t === "passa") passaO(id);
        else if (m.t === "voto") voto(id, m.voti);
      },
      onErrore: function (e) { senzaRete(t, e); }
    });

    function invia() { rete.invia({ t: "vm", vm: vmAsta(st) }); }
    function bd() { invia(); disegna(); }

    function comincia() {
      if (st.iniziata || st.giocatori.length < 2) return;
      st.iniziata = true; st.roundIdx = 0; nuovoRound();
    }
    function nuovoRound() {
      stopTo();
      var r = st.tema.round[st.roundIdx];
      st.tavolo = carteDelRound(r, st.giocatori.length, st.tema.id);
      st.senzaCarta = st.giocatori.map(function (g) { return g.id; });
      st.chooserPtr = st.roundIdx;
      st.asta = null; st.esito = null; st.scadenza = null;
      st.fase = "round";
      FX.round(); bd();
    }
    function prossima() {
      stopTo();
      if (st.senzaCarta.length === 0) return fineRoundO();
      if (st.senzaCarta.length === 1 && st.tavolo.length === 1) {
        var g = perId(st, st.senzaCarta[0]), carta = st.tavolo[0];
        g.crediti -= 1; g.kit.push(carta);
        st.tavolo = []; st.senzaCarta = [];
        st.esito = { chiId: g.id, chiNome: g.nome, carta: carta, prezzo: 1, automatica: true };
        st.asta = null; st.scadenza = null; st.fase = "esito";
        FX.aggiudicato(); return bd();
      }
      st.fase = "scelta"; st.asta = null; st.esito = null; st.scadenza = null; bd();
    }
    function scegli(id, idx) {
      if (st.fase !== "scelta" || !st.senzaCarta.length) return;
      var sceglie = st.senzaCarta[st.chooserPtr % st.senzaCarta.length];
      if (id !== sceglie) return;
      if (idx == null || idx < 0 || idx >= st.tavolo.length) return;
      st.asta = { carta: st.tavolo[idx], idx: idx, offerta: 1, leader: id, passati: {} };
      st.fase = "asta";
      riparti();
    }
    function riparti() {
      stopTo();
      st.scadenza = Date.now() + SECONDI * 1000;
      st._to = setTimeout(function () { chiudi(); }, SECONDI * 1000);
      bd();
    }
    function rilanciaO(id) {
      if (st.fase !== "asta" || !st.asta) return;
      var g = perId(st, id); if (!g) return;
      if (st.senzaCarta.indexOf(id) < 0) return;
      if (maxPuntataG(st, g) < st.asta.offerta + 1) return;
      st.asta.offerta += 1; st.asta.leader = id;
      delete st.asta.passati[id];
      FX.rilancio();
      riparti();
    }
    function passaO(id) {
      if (st.fase !== "asta" || !st.asta) return;
      if (st.senzaCarta.indexOf(id) < 0) return;
      if (st.asta.leader === id) return;
      st.asta.passati[id] = true;
      if (!verificaPassati()) bd();
    }
    function verificaPassati() {
      if (!st.asta) return false;
      var restano = st.senzaCarta.filter(function (x) { return !st.asta.passati[x]; });
      if (restano.length <= 1) { chiudi(); return true; }
      return false;
    }
    function chiudi() {
      if (st.fase !== "asta" || !st.asta) return;
      stopTo();
      var a = st.asta, g = perId(st, a.leader);
      if (!g) { st.asta = null; return prossima(); }
      g.crediti -= a.offerta; g.kit.push(a.carta);
      st.tavolo.splice(a.idx, 1);
      st.senzaCarta = st.senzaCarta.filter(function (x) { return x !== a.leader; });
      st.chooserPtr++;
      st.esito = { chiId: g.id, chiNome: g.nome, carta: a.carta, prezzo: a.offerta, automatica: false };
      st.asta = null; st.scadenza = null; st.fase = "esito";
      FX.aggiudicato(); bd();
    }
    function avanti() {
      if (st.fase === "esito" || st.fase === "round") return prossima();
      if (st.fase === "kit") { st.fase = "voto"; st.voti = {}; return bd(); }
    }
    function fineRoundO() {
      st.roundIdx++;
      if (st.roundIdx < TOT_ROUND) return nuovoRound();
      st.fase = "kit"; bd();
    }
    function voto(id, voti) {
      if (st.fase !== "voto") return;
      if (!perId(st, id) || st.voti[id]) return;
      st.voti[id] = voti || {};
      bd(); verificaVoti();
    }
    function verificaVoti() {
      if (st.fase !== "voto") return;
      var tutti = st.giocatori.every(function (g) { return st.voti[g.id]; });
      if (!tutti) return;
      st.giocatori.forEach(function (g) { g.stelle = 0; });
      Object.keys(st.voti).forEach(function (chi) {
        var v = st.voti[chi] || {};
        Object.keys(v).forEach(function (target) {
          var g = perId(st, target);
          if (g && target !== chi) g.stelle += Math.max(1, Math.min(5, parseInt(v[target], 10) || 0));
        });
      });
      st.classifica = st.giocatori.slice().sort(function (a, b) { return b.stelle - a.stelle; })
        .map(function (g) { return { nome: g.nome, punti: g.stelle + " ⭐" }; });
      st.fase = "fine"; FX.fine(); bd();
    }

    function scegliTema(idx) {  // l'host cambia argomento in lobby
      if (st.iniziata) return;
      var temi = window.SG_ASTA_TEMI || [];
      if (temi[idx]) { st.tema = temi[idx]; bd(); }
    }
    function nuovaInLobby() {   // "Nuova partita": tutti tornano in lobby, stessi giocatori
      stopTo();
      st.iniziata = false; st.fase = "lobby"; st.roundIdx = 0; st.chooserPtr = 0;
      st.tavolo = []; st.senzaCarta = []; st.asta = null; st.esito = null; st.classifica = null; st.voti = {}; st.scadenza = null;
      st.giocatori.forEach(function (g) { g.crediti = st.crediti; g.kit = []; g.stelle = 0; });
      bd();
    }
    var cb = {
      myId: "host", sonoHost: true,
      onComincia: comincia,
      onTema: scegliTema,
      onNuova: nuovaInLobby,
      onScegli: function (i) { scegli("host", i); },
      onRilancia: function () { rilanciaO("host"); },
      onPassa: function () { passaO("host"); },
      onAvanti: avanti,
      onVoto: function (v) { voto("host", v); },
      onEsci: function () { stopTo(); rete.chiudi(); t.esci(); }
    };
    function disegna() { disegnaAstaVM(t, vmAsta(st), cb); }
    disegna();
  }

  // ---------- UN OSPITE ----------
  function ospiteAsta(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { myId: null, vm: null, rete: null, nome: "", msg: null };
    var cb = {
      myId: null, sonoHost: false,
      onScegli: function (i) { S.rete && S.rete.invia({ t: "scegli", idx: i }); },
      onRilancia: function () { S.rete && S.rete.invia({ t: "rilancia" }); },
      onPassa: function () { S.rete && S.rete.invia({ t: "passa" }); },
      onAvanti: function () {},
      onVoto: function (v) { S.rete && S.rete.invia({ t: "voto", voti: v }); },
      onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); }
    };
    function disegna() { if (S.vm) { cb.myId = S.myId; disegnaAstaVM(t, S.vm, cb); } }

    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🔨", titolo: "Entra all'asta", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      S.msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(S.msg);
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        ctx(); S.nome = (input.value || "Amico").trim() || "Amico";
        S.msg.textContent = "Collegamento in corso…"; collega();
      }}));
      t.mostra(s);
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome });
          setTimeout(function () { if (!S.vm && S.msg) S.msg.textContent = "Non trovo la partita. Controlla il codice, o l'host non ha ancora aperto la stanza…"; }, 8000); },
        onMsg: function (m) { if (m && m.t === "vm") { S.vm = m.vm; disegna(); } },
        onChiuso: function () { erroreSchermo(t, "Collegamento perso. L'host potrebbe aver chiuso la partita."); },
        onErrore: function () { erroreSchermo(t, "Problema di collegamento. Controlla la connessione e riprova."); }
      });
    }
  }

  function erroreSchermo(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità \"ognuno dal suo telefono\" funziona quando il gioco è aperto dal sito pubblicato online. Da un file locale non è disponibile: intanto usa \"Un telefono solo\"." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // ---------- DISEGNO CONDIVISO (host e ospiti) ----------
  function barraRimasta(el, rimasti) {
    var wrap = el("div", { class: "as-timer" });
    var fill = el("div", { class: "as-timer-fill" });
    wrap.appendChild(fill);
    var frac = Math.max(0, Math.min(1, rimasti / (SECONDI * 1000)));
    fill.style.width = (frac * 100) + "%";
    if (rimasti > 0) requestAnimationFrame(function () { fill.style.transition = "width " + rimasti + "ms linear"; fill.style.width = "0%"; });
    return wrap;
  }
  function strisciaOnline(el, vm, myId) {
    var top = el("div", { class: "as-top" });
    vm.giocatori.forEach(function (g) {
      top.appendChild(el("div", { class: "as-pt" + (g.id === myId ? " attivo" : "") + (g.haCarta ? " fatto" : "") }, [
        el("div", { class: "n", text: g.nome }),
        el("div", { class: "c", text: g.crediti + "💰" })
      ]));
    });
    return top;
  }
  function testaRound(el, vm) {
    var wrap = el("div", {});
    wrap.appendChild(el("div", { class: "as-round", style: "margin:6px 0 4px" }, [
      el("div", { class: "n", text: "Round " + (vm.roundIdx + 1) + " di " + vm.totRound })
    ]));
    if (vm.rounds && vm.rounds.length) wrap.appendChild(strisciaRound(el, vm.rounds, vm.roundIdx));
    else wrap.appendChild(el("div", { class: "as-round" }, [ el("div", { class: "t", text: (vm.roundIcona || "") + " " + (vm.roundNome || "") }) ]));
    return wrap;
  }
  function nodoKitVm(el, g) {
    var box = el("div", { class: "as-kit" });
    box.appendChild(el("h3", { text: g.nome + " · " + g.crediti + " 💰 avanzati" }));
    g.kit.forEach(function (c) {
      box.appendChild(el("div", { class: "riga" }, [
        el("span", { class: "em", text: c.emoji }),
        el("span", { style: "flex:1", text: c.nome }),
        el("span", { class: "tier tier-" + c.tier, text: c.tier })
      ]));
    });
    return box;
  }

  function disegnaAstaVM(t, vm, cb) {
    var el = t.el, myId = cb.myId;
    if (vm.fase === "lobby") return lobbyAsta(t, vm, cb);
    if (vm.fase === "fine") return schermataFineAsta(t, vm, cb);

    var s = t.schermata({ sotto: "Stanza " + (vm.codice || ""), icona: "🔨",
      titolo: titoloFaseAsta(vm, myId),
      indietro: function () { if (window.confirm("Uscire dalla partita?")) cb.onEsci(); } });

    if (vm.fase !== "kit" && vm.fase !== "voto") s._contenuto.appendChild(testaRound(el, vm));
    s._contenuto.appendChild(strisciaOnline(el, vm, myId));

    if (vm.fase === "round") {
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:3.4rem;line-height:1;margin:10px 0", text: vm.roundIcona }));
      s._contenuto.appendChild(el("p", { class: "as-msg", text: "Sul tavolo " + vm.giocatori.length + " carte: ognuno se ne aggiudica una." }));
      if (cb.sonoHost) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Vedi le carte ▶", onclick: cb.onAvanti }));
      else s._piede.appendChild(el("p", { class: "as-msg", text: "In attesa che l'host cominci il round…" }));
    }

    else if (vm.fase === "scelta") {
      var mio = vm.sceglieId === myId;
      s._contenuto.appendChild(el("p", { class: "as-msg", style: "margin-bottom:10px",
        text: mio ? "🔨 Scegli tu la carta da mettere all'asta" : ("🔨 " + vm.sceglieNome + " sta scegliendo la carta") }));
      var g1 = el("div", { class: "as-griglia" });
      vm.tavolo.forEach(function (c, idx) {
        var nodo = el("button", { class: "as-carta", onclick: mio ? function () { cb.onScegli(idx); } : null }, [
          el("span", { class: "em", text: c.emoji }),
          el("span", { class: "nm", text: c.nome }),
          el("span", { class: "tier tier-" + c.tier, text: c.tier })
        ]);
        if (!mio) nodo.disabled = true;
        g1.appendChild(nodo);
      });
      s._contenuto.appendChild(g1);
    }

    else if (vm.fase === "asta") {
      var a = vm.asta;
      s._contenuto.appendChild(el("div", { class: "as-big" }, [
        el("div", { class: "em", text: a.carta.emoji }),
        el("div", { class: "nm", text: a.carta.nome }),
        el("div", { style: "margin-top:6px;font-weight:900;opacity:.75", text: "Fascia " + a.carta.tier })
      ]));
      s._contenuto.appendChild(el("div", { class: "as-offerta" }, [
        el("div", { class: "v", text: a.offerta + " 💰" }),
        el("div", { class: "chi", text: "offerta di " + a.leaderNome })
      ]));
      s._contenuto.appendChild(barraRimasta(el, (a.scadenza || 0) - Date.now()));

      var io = null;
      vm.giocatori.forEach(function (g) { if (g.id === myId) io = g; });
      var inGara = io && !io.haCarta;
      var hoPassato = a.passati.indexOf(myId) >= 0;
      var guido = a.leaderId === myId;
      var max = io ? io.crediti - ((vm.totRound - 1) - vm.roundIdx) : 0;
      if (inGara && !hoPassato) {
        var riga = el("div", { class: "tl-vota" });
        var bSu = el("button", { class: "btn btn-verde", text: "+1 → " + (a.offerta + 1), onclick: cb.onRilancia });
        if (max < a.offerta + 1) bSu.disabled = true;
        riga.appendChild(bSu);
        if (!guido) riga.appendChild(el("button", { class: "btn btn-rosso", text: "Passa", onclick: cb.onPassa }));
        s._piede.appendChild(riga);
        s._contenuto.appendChild(el("p", { class: "as-msg",
          text: guido ? "👑 Stai guidando l'offerta" : ("Hai " + io.crediti + " crediti · puoi arrivare a " + Math.max(0, max)) }));
      } else {
        s._contenuto.appendChild(el("p", { class: "as-msg",
          text: !io ? "Stai guardando la partita" : (io.haCarta ? "Hai già la tua carta di questo round" : "Hai passato: aspetti il risultato") }));
      }
      var pal2 = dettaglioPalio(el, vm.tavolo, a.carta.nome);
      if (pal2) s._contenuto.appendChild(pal2);
    }

    else if (vm.fase === "esito") {
      var e2 = vm.esito || {};
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:3rem;line-height:1;margin:6px 0", text: "🔨" }));
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:1.4rem;font-weight:900", text: e2.chiNome + " si aggiudica" }));
      s._contenuto.appendChild(el("div", { class: "as-big", style: "margin-top:8px" }, [
        el("div", { class: "em", text: e2.carta.emoji }),
        el("div", { class: "nm", text: e2.carta.nome }),
        el("div", { style: "margin-top:6px;font-weight:900;opacity:.75", text: "Fascia " + e2.carta.tier })
      ]));
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:1.3rem;font-weight:900;color:var(--accento);margin-top:8px",
        text: "per " + e2.prezzo + " 💰" }));
      if (e2.automatica) s._contenuto.appendChild(el("p", { class: "as-msg", text: "Ultima carta rimasta: assegnata automaticamente." }));
      if (cb.sonoHost) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Avanti ▶", onclick: cb.onAvanti }));
      else s._piede.appendChild(el("p", { class: "as-msg", text: "In attesa dell'host…" }));
    }

    else if (vm.fase === "kit") {
      vm.giocatori.forEach(function (g) { s._contenuto.appendChild(nodoKitVm(el, g)); });
      if (cb.sonoHost) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Si vota ⭐", onclick: cb.onAvanti }));
      else s._piede.appendChild(el("p", { class: "as-msg", text: "In attesa che l'host apra la votazione…" }));
    }

    else if (vm.fase === "voto") {
      var hoVotato = vm.hannoVotato.indexOf(myId) >= 0;
      var dentro = vm.giocatori.some(function (g) { return g.id === myId; });
      if (hoVotato || !dentro) {
        s._contenuto.appendChild(el("p", { class: "as-msg", style: "margin-top:20px",
          text: hoVotato ? ("Hai votato. Aspetta gli altri… (" + vm.hannoVotato.length + " su " + vm.giocatori.length + ")") : "Stai guardando la partita" }));
      } else {
        var voti = {};
        var conferma = el("button", { class: "btn btn-primario", text: "Conferma i voti", onclick: function () { cb.onVoto(voti); } });
        conferma.disabled = true;
        vm.giocatori.forEach(function (g) {
          if (g.id === myId) return;
          var box = nodoKitVm(el, g);
          var riga2 = el("div", { class: "as-stelle" }), bottoni = [];
          for (var n = 1; n <= 5; n++) {
            (function (val) {
              var b = el("button", { text: "⭐", onclick: function () {
                voti[g.id] = val;
                bottoni.forEach(function (bb, k) { bb.className = (k < val) ? "on" : ""; });
                var mancano = vm.giocatori.filter(function (x) { return x.id !== myId && !voti[x.id]; }).length;
                if (mancano === 0) conferma.removeAttribute("disabled");
              }});
              bottoni.push(b); riga2.appendChild(b);
            })(n);
          }
          box.appendChild(riga2);
          s._contenuto.appendChild(box);
        });
        s._piede.appendChild(conferma);
      }
    }

    t.mostra(s);
  }

  function titoloFaseAsta(vm, myId) {
    if (vm.fase === "round") return vm.roundNome || "Round";
    if (vm.fase === "scelta") return vm.sceglieId === myId ? "Scegli tu" : ("Sceglie " + vm.sceglieNome);
    if (vm.fase === "asta") return "Asta in corso";
    if (vm.fase === "esito") return "Aggiudicata!";
    if (vm.fase === "kit") return "I kit completi";
    if (vm.fase === "voto") return "Vota i kit";
    return "L'Asta";
  }

  function lobbyAsta(t, vm, cb) {
    var el = t.el;
    var s = t.schermata({ icona: "🔨", titolo: "Sala d'attesa",
      sotto: cb.sonoHost ? "Invita gli amici" : "Aspetta l'inizio", indietro: cb.onEsci });
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "Codice della stanza" }));
    s._contenuto.appendChild(el("div", { class: "codice-stanza", text: (vm.codice || "…").toUpperCase() }));
    if (cb.sonoHost && vm.codice && vm.codice !== "…") {
      var link = SG.creaLink({ gioco: "asta", stanza: vm.codice });
      var campo = el("input", { class: "link-campo", type: "text", readonly: "readonly", value: link });
      s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", html: "🔗 Copia il link da mandare",
        onclick: function () { campo.focus(); campo.select(); try { navigator.clipboard.writeText(link); } catch (e) {} } }));
      s._contenuto.appendChild(campo);
    }
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "Argomento dell'asta" }));
    if (cb.sonoHost && vm.temi && vm.temi.length > 1) {
      var g = el("div", { class: "cat-griglia" });
      vm.temi.forEach(function (tm, i) {
        g.appendChild(el("button", { class: "cat-chip" + (tm.id === vm.temaId ? " attiva" : ""), onclick: function () { cb.onTema(i); } }, [
          el("span", { class: "ci", text: tm.icona }), el("span", { text: tm.nome }), el("span", { class: "spunta", text: "✓" })
        ]));
      });
      s._contenuto.appendChild(g);
    } else {
      s._contenuto.appendChild(el("p", { class: "as-msg", text: vm.temaIcona + " " + vm.temaNome }));
    }
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "Chi c'è (" + vm.giocatori.length + ")" }));
    var lista = el("div");
    vm.giocatori.forEach(function (g) {
      lista.appendChild(el("div", { class: "lobby-giocatore",
        text: "🙂 " + g.nome + (g.id === cb.myId ? " (tu)" : "") + " · " + g.crediti + " 💰" }));
    });
    s._contenuto.appendChild(lista);
    if (cb.sonoHost) {
      var b = el("button", { class: "btn btn-primario",
        text: vm.giocatori.length < 2 ? "Servono almeno 2 giocatori" : "Comincia ▶", onclick: cb.onComincia });
      if (vm.giocatori.length < 2) b.disabled = true;
      s._piede.appendChild(b);
    } else s._piede.appendChild(el("p", { class: "as-msg", text: "In attesa che l'host cominci…" }));
    t.mostra(s);
  }

  function schermataFineAsta(t, vm, cb) {
    var el = t.el;
    var s = t.schermata({ icona: "🏆", titolo: "Classifica finale", sotto: "L'Asta · " + vm.temaNome });
    s._contenuto.appendChild(el("div", { class: "tl-coriandoli", text: "🎉🥳🎉" }));
    var ol = el("ol", { class: "classifica" });
    var med = ["🥇", "🥈", "🥉"];
    (vm.classifica || []).forEach(function (r, i) {
      var li = el("li", { class: i === 0 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: med[i] || (i + 1) + "°" }),
        el("span", { class: "nome", text: r.nome }),
        el("span", { class: "punti", text: r.punti })
      ]);
      li.style.animationDelay = (i * 0.12) + "s";
      ol.appendChild(li);
    });
    s._contenuto.appendChild(ol);
    if (cb.sonoHost) {
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Nuova partita (cambia argomento)", onclick: cb.onNuova }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    } else {
      s._piede.appendChild(el("p", { class: "as-msg", text: "In attesa dell'host per un'altra partita…" }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    }
    t.mostra(s);
  }
  SG.registra(gioco);
})();

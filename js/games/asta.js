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
    ".as-msg{text-align:center;color:var(--testo-tenue);font-weight:700;}"
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

  // Prende N carte dal round mescolando le fasce a giro (A, B, C, A, B, C...)
  // così sul tavolo c'è sempre un buon assortimento.
  function carteDelRound(r, n) {
    var pool = { A: mischia(r.A || []), B: mischia(r.B || []), C: mischia(r.C || []) };
    var ordine = ["A", "B", "C"], scelte = [], giro = 0;
    while (scelte.length < n && giro < 30) {
      var t = ordine[giro % 3];
      if (pool[t].length) scelte.push({ nome: pool[t][0].nome, emoji: pool[t][0].emoji, tier: t }), pool[t].shift();
      giro++;
    }
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

  function intestazioneRound(el, st) {
    var r = st.tema.round[st.roundIdx];
    return el("div", { class: "as-round" }, [
      el("div", { class: "n", text: "Round " + (st.roundIdx + 1) + " di " + TOT_ROUND }),
      el("div", { class: "t", text: r.icona + " " + r.nome })
    ]);
  }

  var gioco = {
    id: "asta",
    nome: "L'Asta",
    icona: "🔨",
    descrizione: "Compra all'asta le carte migliori e costruisci il kit che gli altri voteranno.",
    giocatoriMin: 2,
    giocatoriMax: MAX_GIOCATORI,

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
      var idT = (t.impostazioni && t.impostazioni.tema) || temi[0].id;
      var tema = temi.filter(function (x) { return x.id === idT; })[0] || temi[0];
      var crediti = (t.impostazioni && t.impostazioni.crediti) || 15;

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
    st.tavolo = carteDelRound(r, st.giocatori.length);
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

  SG.registra(gioco);
})();

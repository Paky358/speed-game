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
    // badge ruolo del Fantacalcio (POR/DIF/CEN/ATT) — niente fasce a schermo
    ".as-rb{flex:0 0 auto;font-size:.68rem;font-weight:900;letter-spacing:.04em;padding:4px 8px;border-radius:8px;color:#0d1230;}",
    ".as-rb-P{background:linear-gradient(135deg,#ffd27a,#e0a90a);}",
    ".as-rb-D{background:linear-gradient(135deg,#9fe6b4,#3fb56a);}",
    ".as-rb-C{background:linear-gradient(135deg,#9fb4ff,#5468c7);color:#eef1ff;}",
    ".as-rb-A{background:linear-gradient(135deg,#ff9d8a,#e0533a);color:#fff;}",
    // Fantacalcio: avviso ultimo duello + pannello \"rose finora\" in linea (solo carte prese, per ruolo)
    ".as-duello{background:linear-gradient(135deg,#ffb347,#e0533a);color:#2a1200;font-weight:900;text-align:center;border-radius:12px;padding:10px 12px;margin:2px 0 10px;font-size:.95rem;line-height:1.25;}",
    ".as-rose{margin-top:14px;border-top:1px solid rgba(255,255,255,.1);padding-top:4px;}",
    ".as-rose-p{background:var(--carta);border-radius:14px;padding:10px 12px;margin-bottom:8px;box-shadow:var(--ombra);}",
    ".as-rose-nome{font-weight:900;font-size:1rem;margin-bottom:4px;}",
    ".as-rose-vuota{color:var(--testo-tenue);font-size:.9rem;font-style:italic;}",
    ".as-rose-riga{display:flex;align-items:center;gap:9px;padding:3px 0;font-size:.95rem;}",
    ".as-rose-em{font-size:1.2rem;flex:0 0 auto;}",
    ".as-rose-txt{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    // votazione col budget di stelle (mezze stelle)
    ".as-budget{position:sticky;top:0;z-index:2;text-align:center;font-weight:900;padding:10px 12px;margin:0 0 10px;border-radius:12px;background:linear-gradient(135deg,#ffe58a,var(--accento) 60%,#ff9d3a);color:#2a2400;font-size:.98rem;line-height:1.25;}",
    ".as-budget.ok{background:linear-gradient(135deg,#9fe6b4,#3fb56a);color:#04321c;}",
    ".as-vrow{display:flex;align-items:center;justify-content:center;gap:14px;margin:-2px 0 12px;}",
    ".as-vbtn{width:46px;height:46px;border-radius:50%;border:0;font-size:1.5rem;font-weight:900;font-family:inherit;cursor:pointer;background:var(--carta-2);color:var(--testo);line-height:1;}",
    ".as-vbtn:disabled{opacity:.3;}",
    ".as-vval{min-width:74px;text-align:center;font-size:1.25rem;font-weight:900;color:var(--accento);}",
    // barra dei tasti offerta/passa SEMPRE visibile in basso durante l'asta (niente scroll per offrire)
    ".piede-fisso{position:sticky;bottom:0;z-index:5;margin:14px -16px 0;padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:var(--sfondo);box-shadow:0 -6px 16px rgba(0,0,0,.4);}",
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
      dove.modo = "telefono";
      dove.formato = "temi";
      dove.crediti = 15;
      dove._creditiTemi = 15;

      // contenitori che compaiono/spariscono in base alla modalità scelta
      var wrapCrediti = el("div", {}), wrapTema = el("div", {}), wrapFanta = el("div", { hidden: "hidden" });

      // --- Modalità: Temi classici oppure Mini asta Fantacalcio ---
      box.appendChild(el("div", { class: "etichetta", text: "Modalità" }));
      var bTemi, bFanta;
      function scegliFormato(f) {
        dove.formato = f;
        bTemi.className = "modo-chip" + (f === "temi" ? " attiva" : "");
        bFanta.className = "modo-chip" + (f === "fanta" ? " attiva" : "");
        wrapCrediti.hidden = (f !== "temi");
        wrapTema.hidden = (f !== "temi");
        wrapFanta.hidden = (f !== "fanta");
        dove.crediti = (f === "fanta") ? 20 : dove._creditiTemi;
      }
      bTemi = el("button", { class: "modo-chip attiva", onclick: function () { scegliFormato("temi"); } }, [
        el("span", { class: "mi", text: "🎁" }), el("div", {}, [
          el("div", { class: "mt", text: "Temi classici" }), el("div", { class: "ms", text: "Kit a tema · 4 round" })])]);
      bFanta = el("button", { class: "modo-chip", onclick: function () { scegliFormato("fanta"); } }, [
        el("span", { class: "mi", text: "⚽" }), el("div", {}, [
          el("div", { class: "mt", text: "Mini asta Fantacalcio" }), el("div", { class: "ms", text: "Rosa da 5 calciatori" })])]);
      box.appendChild(el("div", { class: "modo-griglia" }, [bTemi, bFanta]));

      // --- Come si gioca: un telefono solo oppure ognuno dal suo (vale per tutte e due) ---
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

      // --- Crediti a testa (solo Temi classici) ---
      wrapCrediti.appendChild(el("div", { class: "etichetta", text: "Crediti a testa" }));
      var b15, b20;
      function scegli(v) {
        dove._creditiTemi = v;
        if (dove.formato === "temi") dove.crediti = v;
        b15.className = "modo-chip" + (v === 15 ? " attiva" : "");
        b20.className = "modo-chip" + (v === 20 ? " attiva" : "");
      }
      b15 = el("button", { class: "modo-chip attiva", onclick: function () { scegli(15); } }, [
        el("span", { class: "mi", text: "💰" }), el("div", {}, [
          el("div", { class: "mt", text: "15 crediti" }), el("div", { class: "ms", text: "Partita tirata" })])]);
      b20 = el("button", { class: "modo-chip", onclick: function () { scegli(20); } }, [
        el("span", { class: "mi", text: "💰" }), el("div", {}, [
          el("div", { class: "mt", text: "20 crediti" }), el("div", { class: "ms", text: "Più margine per i rilanci" })])]);
      wrapCrediti.appendChild(el("div", { class: "modo-griglia" }, [b15, b20]));
      box.appendChild(wrapCrediti);

      // --- Tema (solo Temi classici) ---
      var temi = window.SG_ASTA_TEMI || [];
      dove.tema = temi.length ? temi[0].id : null;
      if (temi.length > 1) {
        wrapTema.appendChild(el("div", { class: "etichetta", text: "Tema" }));
        var g = el("div", { class: "cat-griglia" });
        temi.forEach(function (tm) {
          var chip = el("button", { class: "cat-chip" + (tm.id === dove.tema ? " attiva" : ""), onclick: function () {
            dove.tema = tm.id;
            [].forEach.call(g.children, function (c) { c.className = "cat-chip"; });
            chip.className = "cat-chip attiva";
          } }, [ el("span", { class: "ci", text: tm.icona }), el("span", { text: tm.nome }), el("span", { class: "spunta", text: "✓" }) ]);
          g.appendChild(chip);
        });
        wrapTema.appendChild(g);
      } else if (temi.length === 1) {
        wrapTema.appendChild(el("div", { class: "link-avviso", text: "Tema: " + temi[0].icona + " " + temi[0].nome + " — " + temi[0].sottotitolo }));
      }
      box.appendChild(wrapTema);

      // --- Nota Fantacalcio (solo modalità Fantacalcio) ---
      wrapFanta.appendChild(el("div", { class: "link-avviso",
        text: "⚽ 20 crediti a testa · rosa da 5 (1 portiere, 1 difensore, 2 centrocampisti, 1 attaccante). I calciatori escono a sorpresa dal mazzo, uno alla volta." }));
      box.appendChild(wrapFanta);
    },

    avvia: function (t) {
      // Chi entra da un link è sempre un ospite: la modalità (temi o
      // fantacalcio) la decide l'host e arriva dentro la "foto" (vm).
      if (t.linkParams && t.linkParams.stanza) return ospiteAsta(t, t.linkParams.stanza);
      var formato = (t.impostazioni && t.impostazioni.formato) || "temi";
      if (formato === "fanta") {
        if (t.impostazioni && t.impostazioni.modo === "online") return hostFanta(t);
        return avviaFanta(t);
      }
      var temi = window.SG_ASTA_TEMI || [];
      if (!temi.length) return niente(t, "Mancano le carte del gioco.");
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
    var fanta = st && st.formato === "fanta";
    var s = t.schermata({ icona: fanta ? "🎽" : "🎒", titolo: fanta ? "Le rose complete" : "I kit completi", sotto: "Ora si vota!" });
    st.giocatori.forEach(function (g) {
      s._contenuto.appendChild(nodoKit(el, g, st));
    });
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Si vota ⭐", onclick: function () { votazione(t, st, 0); } }));
    t.mostra(s);
  }

  function nodoKit(el, g, st) {
    var fanta = st && st.formato === "fanta";
    var box = el("div", { class: "as-kit" });
    box.appendChild(el("h3", { text: g.nome + " · " + g.crediti + " 💰 avanzati" }));
    (fanta ? ordinaRosa(g.kit) : g.kit).forEach(function (c) {
      box.appendChild(el("div", { class: "riga" }, fanta ? [
        el("span", { class: "em", text: (FANTA_RUOLI[c.ruolo] || {}).emoji }),
        el("span", { style: "flex:1", text: c.nome + (c.squadra ? " · " + c.squadra : "") }),
        el("span", { class: "as-rb as-rb-" + c.ruolo, text: (FANTA_RUOLI[c.ruolo] || {}).breve })
      ] : [
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
    var budget = budgetVoti(st.giocatori.length);
    var s = t.schermata({ icona: "⭐", titolo: nomeBreve(st.giocatori[votante].nome) + (st && st.formato === "fanta" ? ", vota le rose" : ", vota i kit"),
      sotto: budget == null ? "Da 0,5 a 5 ⭐ (non la tua)" : "Distribuisci il tuo budget di stelle" });
    var avanti = el("button", { class: "btn btn-primario", text: "Conferma i voti",
      onclick: function () {
        st.giocatori.forEach(function (g, i) { if (i !== votante && voti[i]) g.stelle = mezzo(g.stelle + voti[i]); });
        votazione(t, st, votante + 1);
      } });
    var opp = [];
    st.giocatori.forEach(function (g, i) { if (i !== votante) opp.push({ key: i, nodo: nodoKit(el, g, st) }); });
    var sez = sezioneVoto(el, opp, budget, voti, function (ok) { avanti.disabled = !ok; });
    sez.nodi.forEach(function (n) { s._contenuto.appendChild(n); });
    s._piede.appendChild(avanti);
    t.mostra(s);
  }

  function nomeBreve(n) { return n.length > 12 ? n.slice(0, 12) + "…" : n; }

  function finePartita(t, st) {
    FX.fine();
    var classifica = st.giocatori.slice().sort(function (a, b) { return b.stelle - a.stelle; })
      .map(function (g) { return { nome: g.nome, punti: fmtMezzi(g.stelle) + " ⭐" }; });
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
          if (g && target !== chi) { var vv = mezzo(+v[target] || 0); if (vv >= 0.5) g.stelle = mezzo(g.stelle + Math.max(0.5, Math.min(5, vv))); }
        });
      });
      st.classifica = st.giocatori.slice().sort(function (a, b) { return b.stelle - a.stelle; })
        .map(function (g) { return { nome: g.nome, punti: fmtMezzi(g.stelle) + " ⭐" }; });
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
    function disegna() {
      if (!S.vm) return;
      cb.myId = S.myId;
      if (S.vm.formato === "fanta") disegnaFantaVM(t, S.vm, cb);
      else disegnaAstaVM(t, S.vm, cb);
    }

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
    // Aggiornata a ogni frame in base al tempo reale: si muove su tutti i
    // dispositivi (su Android la transition CSS a volte non partiva) e si
    // ferma da sola quando la schermata cambia (elemento staccato dal DOM).
    var wrap = el("div", { class: "as-timer" });
    var fill = el("div", { class: "as-timer-fill" });
    wrap.appendChild(fill);
    var tot = SECONDI * 1000, fine = Date.now() + Math.max(0, rimasti);
    fill.style.width = (Math.max(0, Math.min(1, rimasti / tot)) * 100) + "%";
    function tick() {
      if (!fill.isConnected) return;
      var r = fine - Date.now();
      fill.style.width = (Math.max(0, Math.min(1, r / tot)) * 100) + "%";
      if (r > 0) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    return wrap;
  }
  // Conserva i voti che sto mettendo finché resto in fase "voto":
  // così se un altro giocatore conferma (arriva una nuova foto) le mie
  // stelle non si azzerano. Si ripuliscono solo quando entro nel voto.
  function ricordaVoti(cb, vm) {
    if (vm.fase === "voto") { if (!cb._inVoto) { cb._voti = {}; cb._inVoto = true; } }
    else cb._inVoto = false;
    cb._voti = cb._voti || {};
  }

  // --- Regole voti a fine partita ---
  // Media 3,5 ⭐ per avversario. Budget = 3,5 × (giocatori − 1), da spendere
  // TUTTO. Ogni voto da 0,5 a 5 (mezze stelle, mai 0). Con 2 giocatori è libero.
  function budgetVoti(n) { return n <= 2 ? null : Math.round(3.5 * (n - 1) * 2) / 2; }
  function mezzo(x) { return Math.round((x || 0) * 2) / 2; }
  function fmtMezzi(x) { x = mezzo(x); return (x % 1 === 0) ? String(x) : x.toFixed(1); }

  // Costruisce la sezione di voto (banner budget + per ogni avversario il suo
  // nodo kit/rosa e uno stepper − valore +). Ritorna { nodi, valido, aggiorna }.
  // `voti` è l'oggetto persistente chiave→valore (indice o id).
  function sezioneVoto(el, opp, budget, voti, onChange) {
    opp.forEach(function (o) { if (!(voti[o.key] >= 0.5)) voti[o.key] = 0.5; });
    var banner = el("div", { class: "as-budget" });
    var steppers = [];
    function somma() { var s = 0; opp.forEach(function (o) { s += voti[o.key] || 0; }); return mezzo(s); }
    function valido() { return budget == null ? true : somma() === budget; }
    function aggiorna() {
      var s = somma(), ok = valido();
      if (budget == null) banner.textContent = "🎁 Voto libero: da 0,5 a 5 ⭐ a testa";
      else banner.textContent = "Budget: " + fmtMezzi(s) + " / " + fmtMezzi(budget) + " ⭐ · " + (s === budget ? "tutto speso ✅" : ("restano " + fmtMezzi(budget - s)));
      banner.className = "as-budget" + (ok ? " ok" : "");
      steppers.forEach(function (p) {
        var v = voti[p.key];
        p.meno.disabled = (v <= 0.5);
        p.piu.disabled = !(v < 5 && (budget == null || s + 0.5 <= budget));
        p.val.textContent = fmtMezzi(v) + " ⭐";
      });
      if (onChange) onChange(ok);
    }
    var nodi = [banner];
    opp.forEach(function (o) {
      nodi.push(o.nodo);
      var val = el("span", { class: "as-vval" });
      var meno = el("button", { class: "as-vbtn", text: "−", onclick: function () { if (voti[o.key] > 0.5) { voti[o.key] = mezzo(voti[o.key] - 0.5); aggiorna(); } } });
      var piu = el("button", { class: "as-vbtn", text: "+", onclick: function () { if (voti[o.key] < 5 && (budget == null || somma() + 0.5 <= budget)) { voti[o.key] = mezzo(voti[o.key] + 0.5); aggiorna(); } } });
      steppers.push({ key: o.key, meno: meno, piu: piu, val: val });
      nodi.push(el("div", { class: "as-vrow" }, [meno, val, piu]));
    });
    aggiorna();
    return { nodi: nodi, valido: valido, aggiorna: aggiorna };
  }
  // pannello IN LINEA coi kit di tutti (Asta classica): mostrato durante
  // l'asta e sull'esito, così si vedono le squadre senza aprire altre schermate.
  function pannelloKit(el, giocatori) {
    var box = el("div", { class: "as-rose" });
    box.appendChild(el("div", { class: "etichetta", style: "margin-top:6px", text: "I kit finora" }));
    (giocatori || []).forEach(function (g) {
      var card = el("div", { class: "as-rose-p" });
      card.appendChild(el("div", { class: "as-rose-nome", text: g.nome + " · " + g.crediti + "💰" }));
      if (!g.kit || !g.kit.length) card.appendChild(el("div", { class: "as-rose-vuota", text: "ancora niente" }));
      else g.kit.forEach(function (c) {
        card.appendChild(el("div", { class: "as-rose-riga" }, [
          el("span", { class: "as-rose-em", text: c.emoji }),
          el("span", { class: "as-rose-txt", text: c.nome }),
          el("span", { class: "tier tier-" + c.tier, text: c.tier })
        ]));
      });
      box.appendChild(card);
    });
    return box;
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
    ricordaVoti(cb, vm);   // i voti in corso non si azzerano quando un altro conferma
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
        s._piede.classList.add("piede-fisso");
        s._contenuto.appendChild(el("p", { class: "as-msg",
          text: guido ? "👑 Stai guidando l'offerta" : ("Hai " + io.crediti + " crediti · puoi arrivare a " + Math.max(0, max)) }));
      } else {
        s._contenuto.appendChild(el("p", { class: "as-msg",
          text: !io ? "Stai guardando la partita" : (io.haCarta ? "Hai già la tua carta di questo round" : "Hai passato: aspetti il risultato") }));
      }
      var pal2 = dettaglioPalio(el, vm.tavolo, a.carta.nome);
      if (pal2) s._contenuto.appendChild(pal2);
      s._contenuto.appendChild(pannelloKit(el, vm.giocatori));
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
      s._contenuto.appendChild(pannelloKit(el, vm.giocatori));
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
        var voti = cb._voti;
        var conferma = el("button", { class: "btn btn-primario", text: "Conferma i voti", onclick: function () { if (!conferma.disabled) cb.onVoto(voti); } });
        var opp = [];
        vm.giocatori.forEach(function (g) { if (g.id !== myId) opp.push({ key: g.id, nodo: nodoKitVm(el, g) }); });
        var sez = sezioneVoto(el, opp, budgetVoti(vm.giocatori.length), voti, function (ok) { conferma.disabled = !ok; });
        sez.nodi.forEach(function (n) { s._contenuto.appendChild(n); });
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
    if (vm.formato === "fanta") {
      s._contenuto.appendChild(el("div", { class: "etichetta", text: "Modalità" }));
      s._contenuto.appendChild(el("p", { class: "as-msg", text: "⚽ Mini asta Fantacalcio — rosa da 5 (1 P, 1 D, 2 C, 1 A), 20 crediti a testa." }));
    } else {
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
    var etichetta = vm.formato === "fanta" ? "Mini asta Fantacalcio" : ("L'Asta · " + (vm.temaNome || ""));
    var s = t.schermata({ icona: "🏆", titolo: "Classifica finale", sotto: etichetta });
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
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: vm.formato === "fanta" ? "🔄 Nuova partita" : "🔄 Nuova partita (cambia argomento)", onclick: cb.onNuova }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    } else {
      s._piede.appendChild(el("p", { class: "as-msg", text: "In attesa dell'host per un'altra partita…" }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    }
    t.mostra(s);
  }
  // =========================================================
  //  MODALITÀ "MINI ASTA FANTACALCIO"
  //  Rosa da 5 (1 P, 1 D, 2 C, 1 A), 20 crediti a testa.
  //  Le carte escono dal mazzo una alla volta; chi ha già quel
  //  ruolo pieno non punta; se nessuno offre, la carta va in
  //  fondo (accollo) e si ripesca più avanti.
  //  Le fasce A/B/C servono solo a costruire il mazzo: mai a schermo.
  // =========================================================
  var FANTA_BUDGET = 20;
  var FANTA_SLOT = { P: 1, D: 1, C: 2, A: 1 };
  var FANTA_ORD = ["P", "D", "C", "A"];
  var FANTA_RUOLI = {
    P: { nome: "Portiere", breve: "POR", emoji: "🧤" },
    D: { nome: "Difensore", breve: "DIF", emoji: "🛡️" },
    C: { nome: "Centrocampista", breve: "CEN", emoji: "🎽" },
    A: { nome: "Attaccante", breve: "ATT", emoji: "⚽" }
  };

  function splitCalc(s) {
    var m = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(String(s || ""));
    return m ? { nome: m[1].trim(), squadra: m[2].trim() } : { nome: String(s || ""), squadra: "" };
  }
  function slotVuoti(g) { var v = 0; FANTA_ORD.forEach(function (r) { v += FANTA_SLOT[r] - (g.conta[r] || 0); }); return v; }
  function maxFanta(g) { return g.crediti - (slotVuoti(g) - 1); }   // tiene 1 credito per ogni slot che resta
  function ruoloPieno(g, r) { return (g.conta[r] || 0) >= FANTA_SLOT[r]; }
  function ordinaRosa(kit) { return kit.slice().sort(function (a, b) { return FANTA_ORD.indexOf(a.ruolo) - FANTA_ORD.indexOf(b.ruolo); }); }

  // pesca N calciatori di un ruolo mescolando le fasce (A/B/C) di nascosto
  function pescaRuolo(dbRuolo, n, ruolo) {
    var id = "fanta_" + ruolo, visti = elencoVisti(id);
    function fresco(lista) {
      var nuove = [], viste = [];
      (lista || []).forEach(function (s) { var c = splitCalc(s); (visti.indexOf(c.nome) < 0 ? nuove : viste).push(c); });
      return mischia(nuove).concat(mischia(viste));
    }
    var pool = { A: fresco(dbRuolo.A), B: fresco(dbRuolo.B), C: fresco(dbRuolo.C) };
    var q = { A: Math.max(1, Math.floor(n / 3)), C: Math.max(1, Math.floor(n / 3)) };
    q.B = n - q.A - q.C;
    if (q.B < 0) { q.B = 0; q.A = Math.min(q.A, n); q.C = n - q.A; }
    var out = [];
    ["A", "B", "C"].forEach(function (tk) {
      for (var i = 0; i < q[tk] && pool[tk].length; i++) {
        var c = pool[tk].shift(); out.push({ nome: c.nome, squadra: c.squadra, ruolo: ruolo, tier: tk });
      }
    });
    var giro = 0;
    while (out.length < n && giro < 300) {
      var t2 = ["B", "C", "A"][giro % 3];
      if (pool[t2].length) { var c2 = pool[t2].shift(); out.push({ nome: c2.nome, squadra: c2.squadra, ruolo: ruolo, tier: t2 }); }
      giro++;
    }
    segnaVisti(id, out.map(function (c) { return c.nome; }));
    return out;
  }

  // mazzo "truccato": A+B mescolati sopra, C mescolati in fondo
  function costruisciMazzoFanta(n) {
    var db = window.SG_FANTA_CALCIATORI || {};
    var need = { P: n, D: n, C: 2 * n, A: n }, sopra = [], fondo = [];
    FANTA_ORD.forEach(function (r) {
      if (!db[r]) return;
      pescaRuolo(db[r], need[r], r).forEach(function (c) { (c.tier === "C" ? fondo : sopra).push(c); });
    });
    return mischia(sopra).concat(mischia(fondo));
  }

  function assegnaFanta(g, carta, prezzo) {
    g.crediti -= prezzo; g.kit.push(carta); g.conta[carta.ruolo] = (g.conta[carta.ruolo] || 0) + 1;
  }
  function cartaGrande(el, carta, sotto) {
    return el("div", { class: "as-big" }, [
      el("div", { class: "em", text: (FANTA_RUOLI[carta.ruolo] || {}).emoji }),
      el("div", { class: "nm", text: carta.nome }),
      el("div", { style: "margin-top:6px;font-weight:900;opacity:.8", text: sotto })
    ]);
  }

  // pannello IN LINEA con le rose di tutti (scorrendo verso il basso):
  // solo i calciatori PRESI, ordinati per ruolo, col nome di ogni giocatore.
  function pannelloRose(el, giocatori) {
    var box = el("div", { class: "as-rose" });
    box.appendChild(el("div", { class: "etichetta", style: "margin-top:6px", text: "Le rose finora" }));
    (giocatori || []).forEach(function (g) {
      var card = el("div", { class: "as-rose-p" });
      card.appendChild(el("div", { class: "as-rose-nome", text: g.nome + " · " + g.crediti + "💰 · " + (g.kit ? g.kit.length : 0) + "/5" }));
      if (!g.kit || !g.kit.length) {
        card.appendChild(el("div", { class: "as-rose-vuota", text: "ancora nessun acquisto" }));
      } else {
        ordinaRosa(g.kit).forEach(function (c) {
          var ru = FANTA_RUOLI[c.ruolo] || {};
          card.appendChild(el("div", { class: "as-rose-riga" }, [
            el("span", { class: "as-rose-em", text: ru.emoji }),
            el("span", { class: "as-rose-txt", text: c.nome + (c.squadra ? " · " + c.squadra : "") }),
            el("span", { class: "as-rb as-rb-" + c.ruolo, text: ru.breve })
          ]));
        });
      }
      box.appendChild(card);
    });
    return box;
  }

  // ---------- SINGOLO TELEFONO ----------
  function avviaFanta(t) {
    var st = {
      formato: "fanta", asta: null, giriVuoti: 0,
      giocatori: t.giocatori.map(function (n) { return { nome: n, crediti: FANTA_BUDGET, kit: [], conta: { P: 0, D: 0, C: 0, A: 0 }, stelle: 0 }; })
    };
    st.mazzo = costruisciMazzoFanta(st.giocatori.length);
    introFanta(t, st);
  }

  function introFanta(t, st) {
    var el = t.el; FX.round();
    var s = t.schermata({});
    s._contenuto.appendChild(el("div", { style: "flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:12px" }, [
      el("div", { style: "font-size:4rem;line-height:1", text: "⚽" }),
      el("div", { class: "as-round" }, [
        el("div", { class: "n", text: "Mini asta Fantacalcio" }),
        el("div", { class: "t", text: "Costruisci la rosa" })
      ]),
      el("p", { class: "as-msg", text: "Ognuno parte con " + FANTA_BUDGET + " 💰. Rosa da 5: 1 portiere, 1 difensore, 2 centrocampisti, 1 attaccante." }),
      el("p", { class: "as-msg", text: "I calciatori escono uno alla volta dal mazzo. Chi ha quel ruolo già pieno non punta. Se nessuno offre, la carta torna in fondo (accollo)." })
    ]));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Comincia l'asta ▶", onclick: function () { prossimaFanta(t, st); } }));
    t.mostra(s);
  }

  function eleggibiliFanta(st, ruolo) {
    var out = []; st.giocatori.forEach(function (g, i) { if (!ruoloPieno(g, ruolo)) out.push(i); }); return out;
  }

  function prossimaFanta(t, st) {
    if (!st.mazzo.length) return riepilogo(t, st);
    var carta = st.mazzo[0], elegg = eleggibiliFanta(st, carta.ruolo);
    if (!elegg.length) { st.mazzo.shift(); return prossimaFanta(t, st); }        // carta di troppo (giocatore uscito): la salto
    if (elegg.length === 1 || st.giriVuoti > st.mazzo.length) {                   // uno solo può prenderla, oppure giro a vuoto: assegno d'ufficio a 1
      var i = elegg[0]; st.mazzo.shift(); assegnaFanta(st.giocatori[i], carta, 1);
      st.giriVuoti = 0; FX.aggiudicato();
      return esitoFanta(t, st, i, carta, 1, "forzata");
    }
    st.asta = { carta: carta, ruolo: carta.ruolo, offerta: 1, leader: null, passati: {}, bar: null };
    disegnaAstaFanta(t, st);
  }

  function strisciaFanta(el, st, attivoIdx) {
    var top = el("div", { class: "as-top" });
    st.giocatori.forEach(function (g, i) {
      top.appendChild(el("div", { class: "as-pt" + (i === attivoIdx ? " attivo" : "") }, [
        el("div", { class: "n", text: g.nome }),
        el("div", { class: "c", text: g.crediti + "💰 · " + (5 - slotVuoti(g)) + "/5" })
      ]));
    });
    return top;
  }

  function disegnaAstaFanta(t, st) {
    var el = t.el, a = st.asta, ru = FANTA_RUOLI[a.ruolo] || {};
    var s = t.schermata({ icona: "⚽", titolo: ru.nome + " all'asta",
      indietro: function () { if (window.confirm("Uscire dalla partita?")) { if (a.bar) a.bar._stop(); t.esci(); } } });
    s._contenuto.appendChild(strisciaFanta(el, st, a.leader));
    s._contenuto.appendChild(cartaGrande(el, a.carta, ru.nome + (a.carta.squadra ? " · " + a.carta.squadra : "")));
    s._contenuto.appendChild(el("div", { class: "as-offerta" }, a.leader === null ? [
      el("div", { class: "v", text: "base " + a.offerta + " 💰" }),
      el("div", { class: "chi", text: "nessuna offerta ancora" })
    ] : [
      el("div", { class: "v", text: a.offerta + " 💰" }),
      el("div", { class: "chi", text: "offerta di " + st.giocatori[a.leader].nome })
    ]));
    // ultimo duello: 2 giocatori in gara e restano 2 carte di questo ruolo → chi perde si accolla l'altra
    var eleggN = eleggibiliFanta(st, a.ruolo).length;
    var carteRuolo = st.mazzo.filter(function (c) { return c.ruolo === a.ruolo; }).length;
    if (eleggN === 2 && carteRuolo === 2) {
      var artD = /^[aeiou]/i.test(ru.nome) ? "l'" : "il ";
      s._contenuto.appendChild(el("div", { class: "as-duello",
        text: "⚠️ Ultimo duello per " + artD + ru.nome.toLowerCase() + ": chi NON se lo aggiudica si accolla l'altro rimasto!" }));
    }

    if (a.bar && a.bar._stop) a.bar._stop();
    a.bar = barraTimer(el, SECONDI * 1000, function () { scadeFanta(t, st); });
    s._contenuto.appendChild(a.bar);

    st.giocatori.forEach(function (g, i) {
      if (ruoloPieno(g, a.ruolo)) {
        s._contenuto.appendChild(el("div", { class: "as-bid as-fuori" }, [
          el("div", { class: "who" }, [ el("b", { text: g.nome }), el("span", { text: "ha già il " + ru.nome.toLowerCase() } ) ])
        ]));
        return;
      }
      var fuori = !!a.passati[i];
      var prezzo = (a.leader === null) ? a.offerta : a.offerta + 1;
      var puo = !fuori && maxFanta(g) >= prezzo;
      s._contenuto.appendChild(el("div", { class: "as-bid" + (i === a.leader ? " leader" : "") + (fuori ? " as-fuori" : "") }, [
        el("div", { class: "who" }, [
          el("b", { text: (i === a.leader ? "👑 " : "") + g.nome }),
          el("span", { text: fuori ? "ha passato" : (g.crediti + " crediti · max " + Math.max(0, maxFanta(g))) })
        ]),
        el("button", { class: "su", text: (a.leader === null ? "Prendi a " + a.offerta : "+1 → " + prezzo), disabled: puo ? null : "disabled",
          onclick: function () { rilanciaFanta(t, st, i); } }),
        (fuori || i === a.leader) ? null : el("button", { class: "no", text: "Passa", onclick: function () { passaFanta(t, st, i); } })
      ]));
    });
    s._contenuto.appendChild(el("p", { class: "as-msg", style: "margin-top:10px",
      text: "Allo scadere del tempo la carta va a chi offre di più. Se nessuno offre, va in fondo al mazzo." }));
    s._contenuto.appendChild(pannelloRose(el, st.giocatori));
    t.mostra(s);
  }

  function rilanciaFanta(t, st, i) {
    var a = st.asta; if (!a) return;
    var g = st.giocatori[i];
    if (ruoloPieno(g, a.ruolo)) return;
    var prezzo = (a.leader === null) ? a.offerta : a.offerta + 1;
    if (maxFanta(g) < prezzo) return;
    a.offerta = prezzo; a.leader = i; delete a.passati[i];
    FX.rilancio(); disegnaAstaFanta(t, st);
  }
  function passaFanta(t, st, i) {
    var a = st.asta; if (!a || a.leader === i) return;
    a.passati[i] = true;
    if (!verificaFanta(t, st)) disegnaAstaFanta(t, st);
  }
  function verificaFanta(t, st) {
    var a = st.asta; if (!a) return true;
    var attivi = eleggibiliFanta(st, a.ruolo).filter(function (i) { return !a.passati[i]; });
    if (a.leader === null) {
      if (attivi.length === 0) { accolloFanta(t, st); return true; }   // nessuno la vuole
      return false;
    }
    var altri = attivi.filter(function (i) { return i !== a.leader; });
    if (altri.length === 0) { chiudiFanta(t, st, a.leader, a.offerta); return true; }
    return false;
  }
  function scadeFanta(t, st) {
    var a = st.asta; if (!a) return;
    if (a.leader !== null) chiudiFanta(t, st, a.leader, a.offerta);
    else accolloFanta(t, st);
  }
  function chiudiFanta(t, st, i, prezzo) {
    var a = st.asta; if (!a) return;
    if (a.bar && a.bar._stop) a.bar._stop();
    var carta = st.mazzo.shift();
    assegnaFanta(st.giocatori[i], carta, prezzo);
    st.giriVuoti = 0; st.asta = null; FX.aggiudicato();
    esitoFanta(t, st, i, carta, prezzo, "vinta");
  }
  function accolloFanta(t, st) {
    var a = st.asta; if (a && a.bar && a.bar._stop) a.bar._stop();
    var carta = st.mazzo.shift(); st.mazzo.push(carta); st.giriVuoti++;
    st.asta = null;
    esitoAccolloFanta(t, st, carta);
  }

  function esitoFanta(t, st, chi, carta, prezzo, tipo) {
    var el = t.el, g = st.giocatori[chi], ru = FANTA_RUOLI[carta.ruolo] || {};
    var s = t.schermata({});
    s._contenuto.appendChild(el("div", { style: "flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:8px" }, [
      el("div", { style: "font-size:3.4rem;line-height:1", text: "🔨" }),
      el("div", { style: "font-size:1.6rem;font-weight:900", text: g.nome + " prende" }),
      cartaGrande(el, carta, ru.nome + (carta.squadra ? " · " + carta.squadra : "")),
      el("div", { style: "font-size:1.3rem;font-weight:900;color:var(--accento)", text: "per " + prezzo + " 💰" }),
      tipo === "forzata" ? el("p", { class: "as-msg", text: "Se lo accolla: era l'unico a cui mancava questo ruolo." }) : null,
      el("p", { class: "as-msg", text: "Gli restano " + g.crediti + " 💰 · rosa " + (5 - slotVuoti(g)) + "/5." })
    ]));
    s._contenuto.appendChild(pannelloRose(el, st.giocatori));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Avanti ▶", onclick: function () { prossimaFanta(t, st); } }));
    t.mostra(s);
  }
  function esitoAccolloFanta(t, st, carta) {
    var el = t.el, ru = FANTA_RUOLI[carta.ruolo] || {};
    var s = t.schermata({});
    s._contenuto.appendChild(el("div", { style: "flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:8px" }, [
      el("div", { style: "font-size:3.4rem;line-height:1", text: "😅" }),
      el("div", { style: "font-size:1.5rem;font-weight:900", text: "Nessuno lo vuole!" }),
      cartaGrande(el, carta, ru.nome + (carta.squadra ? " · " + carta.squadra : "")),
      el("p", { class: "as-msg", text: "Torna in fondo al mazzo: prima o poi qualcuno se lo accolla…" })
    ]));
    s._contenuto.appendChild(pannelloRose(el, st.giocatori));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Avanti ▶", onclick: function () { prossimaFanta(t, st); } }));
    t.mostra(s);
  }

  // ---------- ONLINE — L'HOST ----------
  function hostFanta(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var st = {
      formato: "fanta", crediti: FANTA_BUDGET, mazzo: [], asta: null, esito: null, classifica: null,
      fase: "lobby", iniziata: false, codice: "…", scadenza: null, _to: null, voti: {}, giriVuoti: 0,
      giocatori: [{ id: "host", nome: (t.giocatori && t.giocatori[0]) || "Host", crediti: FANTA_BUDGET, kit: [], conta: { P: 0, D: 0, C: 0, A: 0 }, stelle: 0 }]
    };
    function stopTo() { if (st._to) { clearTimeout(st._to); st._to = null; } }

    var rete = SGNet.ospita("asta", {
      onCodice: function (c) { st.codice = c; bd(); },
      onConnesso: function () { st.pronta = true; bd(); },
      onAddio: function (id) {
        if (!perId(st, id)) return;
        st.giocatori = st.giocatori.filter(function (x) { return x.id !== id; });
        delete st.voti[id];
        if (st.asta) { if (st.asta.leader === id) st.asta.leader = null; delete st.asta.passati[id]; }
        if (st.iniziata && st.giocatori.length === 0) { stopTo(); rete.chiudi(); return t.esci(); }
        if (st.fase === "asta") { if (!verifica()) bd(); return; }
        if (st.fase === "voto") { verificaVoti(); return; }
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          if (!st.iniziata && !perId(st, id) && st.giocatori.length < MAX_GIOCATORI)
            st.giocatori.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), crediti: FANTA_BUDGET, kit: [], conta: { P: 0, D: 0, C: 0, A: 0 }, stelle: 0 });
          bd();
        }
        else if (m.t === "rilancia") rilanciaO(id);
        else if (m.t === "passa") passaO(id);
        else if (m.t === "voto") voto(id, m.voti);
      },
      onErrore: function () { senzaRete(t); }
    });

    function invia() { rete.invia({ t: "vm", vm: vmFanta(st) }); }
    function bd() { invia(); disegna(); }

    function comincia() {
      if (st.iniziata || st.giocatori.length < 2) return;
      st.iniziata = true; st.mazzo = costruisciMazzoFanta(st.giocatori.length); FX.round(); prossima();
    }
    function prossima() {
      stopTo();
      if (!st.mazzo.length) { st.fase = "kit"; st.asta = null; st.esito = null; st.scadenza = null; return bd(); }
      var carta = st.mazzo[0];
      var elegg = st.giocatori.filter(function (g) { return !ruoloPieno(g, carta.ruolo); });
      if (!elegg.length) { st.mazzo.shift(); return prossima(); }
      if (elegg.length === 1 || st.giriVuoti > st.mazzo.length) {
        var g = elegg[0]; st.mazzo.shift(); assegnaFanta(g, carta, 1); st.giriVuoti = 0;
        st.esito = { chiId: g.id, chiNome: g.nome, carta: carta, prezzo: 1, tipo: "forzata" };
        st.asta = null; st.scadenza = null; st.fase = "esito"; FX.aggiudicato(); return bd();
      }
      st.asta = { carta: carta, ruolo: carta.ruolo, offerta: 1, leader: null, passati: {} };
      st.fase = "asta"; riparti();
    }
    function riparti() { stopTo(); st.scadenza = Date.now() + SECONDI * 1000; st._to = setTimeout(function () { scade(); }, SECONDI * 1000); bd(); }
    function scade() { if (st.asta && st.asta.leader !== null) chiudi(); else accollo(); }
    function rilanciaO(id) {
      if (st.fase !== "asta" || !st.asta) return;
      var g = perId(st, id); if (!g || ruoloPieno(g, st.asta.ruolo)) return;
      var prezzo = (st.asta.leader === null) ? st.asta.offerta : st.asta.offerta + 1;
      if (maxFanta(g) < prezzo) return;
      st.asta.offerta = prezzo; st.asta.leader = id; delete st.asta.passati[id];
      FX.rilancio(); riparti();
    }
    function passaO(id) {
      if (st.fase !== "asta" || !st.asta || st.asta.leader === id) return;
      var g = perId(st, id); if (!g || ruoloPieno(g, st.asta.ruolo)) return;
      st.asta.passati[id] = true;
      if (!verifica()) bd();
    }
    function verifica() {
      var a = st.asta; if (!a) return false;
      var attivi = st.giocatori.filter(function (g) { return !ruoloPieno(g, a.ruolo) && !a.passati[g.id]; });
      if (a.leader === null) { if (attivi.length === 0) { accollo(); return true; } return false; }
      var altri = attivi.filter(function (g) { return g.id !== a.leader; });
      if (altri.length === 0) { chiudi(); return true; }
      return false;
    }
    function chiudi() {
      if (st.fase !== "asta" || !st.asta) return;
      stopTo();
      var a = st.asta; if (a.leader === null) return accollo();
      var g = perId(st, a.leader); if (!g) { st.asta = null; return prossima(); }
      var carta = st.mazzo.shift(); assegnaFanta(g, carta, a.offerta); st.giriVuoti = 0;
      st.esito = { chiId: g.id, chiNome: g.nome, carta: carta, prezzo: a.offerta, tipo: "vinta" };
      st.asta = null; st.scadenza = null; st.fase = "esito"; FX.aggiudicato(); bd();
    }
    function accollo() {
      stopTo();
      var carta = st.mazzo.shift(); st.mazzo.push(carta); st.giriVuoti++;
      st.esito = { chiId: null, chiNome: "", carta: carta, prezzo: 0, tipo: "accollo" };
      st.asta = null; st.scadenza = null; st.fase = "esito"; bd();
    }
    function avanti() { if (st.fase === "esito") return prossima(); if (st.fase === "kit") { st.fase = "voto"; st.voti = {}; return bd(); } }
    function voto(id, voti) { if (st.fase !== "voto" || !perId(st, id) || st.voti[id]) return; st.voti[id] = voti || {}; bd(); verificaVoti(); }
    function verificaVoti() {
      if (st.fase !== "voto") return;
      if (!st.giocatori.every(function (g) { return st.voti[g.id]; })) return;
      st.giocatori.forEach(function (g) { g.stelle = 0; });
      Object.keys(st.voti).forEach(function (chi) {
        var v = st.voti[chi] || {};
        Object.keys(v).forEach(function (target) {
          var g = perId(st, target);
          if (g && target !== chi) { var vv = mezzo(+v[target] || 0); if (vv >= 0.5) g.stelle = mezzo(g.stelle + Math.max(0.5, Math.min(5, vv))); }
        });
      });
      st.classifica = st.giocatori.slice().sort(function (a, b) { return b.stelle - a.stelle; })
        .map(function (g) { return { nome: g.nome, punti: fmtMezzi(g.stelle) + " ⭐" }; });
      st.fase = "fine"; FX.fine(); bd();
    }
    function nuovaInLobby() {
      stopTo();
      st.iniziata = false; st.fase = "lobby"; st.mazzo = []; st.asta = null; st.esito = null; st.classifica = null; st.voti = {}; st.scadenza = null; st.giriVuoti = 0;
      st.giocatori.forEach(function (g) { g.crediti = FANTA_BUDGET; g.kit = []; g.conta = { P: 0, D: 0, C: 0, A: 0 }; g.stelle = 0; });
      bd();
    }
    var cb = {
      myId: "host", sonoHost: true,
      onComincia: comincia, onTema: function () {}, onNuova: nuovaInLobby,
      onScegli: function () {}, onRilancia: function () { rilanciaO("host"); }, onPassa: function () { passaO("host"); },
      onAvanti: avanti, onVoto: function (v) { voto("host", v); },
      onEsci: function () { stopTo(); rete.chiudi(); t.esci(); }
    };
    function disegna() { disegnaFantaVM(t, vmFanta(st), cb); }
    disegna();
  }

  function vmFanta(st) {
    return {
      formato: "fanta", fase: st.fase, codice: st.codice,
      giocatori: st.giocatori.map(function (g) {
        return { id: g.id, nome: g.nome, crediti: g.crediti, conta: { P: g.conta.P, D: g.conta.D, C: g.conta.C, A: g.conta.A },
          vuoti: slotVuoti(g), max: maxFanta(g), kit: g.kit.slice() };
      }),
      asta: st.asta ? {
        carta: { nome: st.asta.carta.nome, squadra: st.asta.carta.squadra, ruolo: st.asta.carta.ruolo },
        ruolo: st.asta.ruolo, offerta: st.asta.offerta,
        leaderId: st.asta.leader, leaderNome: st.asta.leader ? nomeDi(st, st.asta.leader) : "",
        passati: Object.keys(st.asta.passati || {}), scadenza: st.scadenza || null,
        ultimoDuello: (st.giocatori.filter(function (g) { return !ruoloPieno(g, st.asta.ruolo); }).length === 2 &&
          st.mazzo.filter(function (c) { return c.ruolo === st.asta.ruolo; }).length === 2)
      } : null,
      esito: st.esito || null,
      restano: st.mazzo ? st.mazzo.length : 0,
      hannoVotato: Object.keys(st.voti || {}),
      classifica: st.classifica || null
    };
  }

  // ---------- DISEGNO CONDIVISO FANTACALCIO (host e ospiti) ----------
  function titoloFaseFanta(vm) {
    if (vm.fase === "asta") return (FANTA_RUOLI[vm.asta ? vm.asta.ruolo : ""] || {}).nome + " all'asta";
    if (vm.fase === "esito") return vm.esito && vm.esito.tipo === "accollo" ? "Accollo!" : "Aggiudicato!";
    if (vm.fase === "kit") return "Le rose";
    if (vm.fase === "voto") return "Vota le rose";
    return "Fantacalcio";
  }
  function strisciaFantaVm(el, vm, myId) {
    var top = el("div", { class: "as-top" });
    vm.giocatori.forEach(function (g) {
      top.appendChild(el("div", { class: "as-pt" + (g.id === myId ? " attivo" : "") }, [
        el("div", { class: "n", text: g.nome }),
        el("div", { class: "c", text: g.crediti + "💰 · " + (5 - g.vuoti) + "/5" })
      ]));
    });
    return top;
  }
  function nodoRosaVm(el, g) {
    var box = el("div", { class: "as-kit" });
    box.appendChild(el("h3", { text: g.nome + " · " + g.crediti + " 💰 avanzati" }));
    ordinaRosa(g.kit).forEach(function (c) {
      box.appendChild(el("div", { class: "riga" }, [
        el("span", { class: "em", text: (FANTA_RUOLI[c.ruolo] || {}).emoji }),
        el("span", { style: "flex:1", text: c.nome + (c.squadra ? " · " + c.squadra : "") }),
        el("span", { class: "as-rb as-rb-" + c.ruolo, text: (FANTA_RUOLI[c.ruolo] || {}).breve })
      ]));
    });
    return box;
  }

  function disegnaFantaVM(t, vm, cb) {
    var el = t.el, myId = cb.myId;
    ricordaVoti(cb, vm);   // i voti in corso non si azzerano quando un altro conferma
    if (vm.fase === "lobby") return lobbyAsta(t, vm, cb);
    if (vm.fase === "fine") return schermataFineAsta(t, vm, cb);

    var s = t.schermata({ sotto: "Stanza " + (vm.codice || ""), icona: "⚽",
      titolo: titoloFaseFanta(vm),
      indietro: function () { if (window.confirm("Uscire dalla partita?")) cb.onEsci(); } });

    if (vm.fase !== "kit" && vm.fase !== "voto") s._contenuto.appendChild(strisciaFantaVm(el, vm, myId));

    if (vm.fase === "asta") {
      var a = vm.asta, ru = FANTA_RUOLI[a.ruolo] || {};
      s._contenuto.appendChild(cartaGrande(el, a.carta, ru.nome + (a.carta.squadra ? " · " + a.carta.squadra : "")));
      s._contenuto.appendChild(el("div", { class: "as-offerta" }, a.leaderId ? [
        el("div", { class: "v", text: a.offerta + " 💰" }),
        el("div", { class: "chi", text: "offerta di " + a.leaderNome })
      ] : [
        el("div", { class: "v", text: "base " + a.offerta + " 💰" }),
        el("div", { class: "chi", text: "nessuna offerta ancora" })
      ]));
      if (a.ultimoDuello) s._contenuto.appendChild(el("div", { class: "as-duello",
        text: "⚠️ Ultimo duello per " + (/^[aeiou]/i.test(ru.nome) ? "l'" : "il ") + ru.nome.toLowerCase() + ": chi NON se lo aggiudica si accolla l'altro rimasto!" }));
      s._contenuto.appendChild(barraRimasta(el, (a.scadenza || 0) - Date.now()));

      var io = null; vm.giocatori.forEach(function (g) { if (g.id === myId) io = g; });
      var pieno = io && (io.conta[a.ruolo] || 0) >= FANTA_SLOT[a.ruolo];
      var hoPassato = a.passati.indexOf(myId) >= 0;
      var guido = a.leaderId === myId;
      var prezzo = a.leaderId ? a.offerta + 1 : a.offerta;
      if (io && !pieno && !hoPassato) {
        var riga = el("div", { class: "tl-vota" });
        var bSu = el("button", { class: "btn btn-verde", text: (a.leaderId ? "+1 → " + prezzo : "Prendi a " + a.offerta), onclick: cb.onRilancia });
        if (io.max < prezzo) bSu.disabled = true;
        riga.appendChild(bSu);
        if (!guido) riga.appendChild(el("button", { class: "btn btn-rosso", text: "Passa", onclick: cb.onPassa }));
        s._piede.appendChild(riga);
        s._piede.classList.add("piede-fisso");
        s._contenuto.appendChild(el("p", { class: "as-msg",
          text: guido ? "👑 Stai guidando l'offerta" : ("Hai " + io.crediti + " 💰 · puoi arrivare a " + Math.max(0, io.max)) }));
      } else {
        s._contenuto.appendChild(el("p", { class: "as-msg",
          text: !io ? "Stai guardando la partita" : (pieno ? ("Hai già il " + ru.nome.toLowerCase() + " in rosa") : "Hai passato: aspetti il risultato") }));
      }
      s._contenuto.appendChild(pannelloRose(el, vm.giocatori));
    }

    else if (vm.fase === "esito") {
      var e2 = vm.esito || {}, rux = FANTA_RUOLI[e2.carta ? e2.carta.ruolo : ""] || {};
      if (e2.tipo === "accollo") {
        s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:3rem;line-height:1;margin:6px 0", text: "😅" }));
        s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:1.4rem;font-weight:900", text: "Nessuno lo vuole!" }));
        s._contenuto.appendChild(cartaGrande(el, e2.carta, rux.nome + (e2.carta.squadra ? " · " + e2.carta.squadra : "")));
        s._contenuto.appendChild(el("p", { class: "as-msg", text: "Torna in fondo al mazzo." }));
      } else {
        s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:3rem;line-height:1;margin:6px 0", text: "🔨" }));
        s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:1.4rem;font-weight:900", text: e2.chiNome + " prende" }));
        s._contenuto.appendChild(cartaGrande(el, e2.carta, rux.nome + (e2.carta.squadra ? " · " + e2.carta.squadra : "")));
        s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:1.3rem;font-weight:900;color:var(--accento);margin-top:8px", text: "per " + e2.prezzo + " 💰" }));
        if (e2.tipo === "forzata") s._contenuto.appendChild(el("p", { class: "as-msg", text: "Se lo accolla: era l'unico a cui mancava questo ruolo." }));
      }
      s._contenuto.appendChild(pannelloRose(el, vm.giocatori));
      if (cb.sonoHost) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Avanti ▶", onclick: cb.onAvanti }));
      else s._piede.appendChild(el("p", { class: "as-msg", text: "In attesa dell'host…" }));
    }

    else if (vm.fase === "kit") {
      vm.giocatori.forEach(function (g) { s._contenuto.appendChild(nodoRosaVm(el, g)); });
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
        var voti = cb._voti;
        var conferma = el("button", { class: "btn btn-primario", text: "Conferma i voti", onclick: function () { if (!conferma.disabled) cb.onVoto(voti); } });
        var opp = [];
        vm.giocatori.forEach(function (g) { if (g.id !== myId) opp.push({ key: g.id, nodo: nodoRosaVm(el, g) }); });
        var sez = sezioneVoto(el, opp, budgetVoti(vm.giocatori.length), voti, function (ok) { conferma.disabled = !ok; });
        sez.nodi.forEach(function (n) { s._contenuto.appendChild(n); });
        s._piede.appendChild(conferma);
      }
    }

    t.mostra(s);
  }

  SG.registra(gioco);
})();

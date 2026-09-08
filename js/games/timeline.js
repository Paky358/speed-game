/* =========================================================
   GIOCO — La linea del tempo
   Modalità: "un telefono solo" e "ognuno dal suo telefono"
   (con votazione degli altri giocatori, punteggi, timer,
   classifica sempre visibile, suoni e vibrazione).
   ========================================================= */
(function () {
  "use strict";

  var PUNTI = 100;     // per una risposta giusta/sbagliata
  var VOTO = 50;       // per chi vota giusto/sbagliato
  var TEMPO = 30;      // secondi per turno / per votare

  // --- Aspetto (stile moderno, specifico del gioco) ---
  var stile = document.createElement("style");
  stile.textContent = [
    ".tl-top{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 8px;margin:-4px -2px 8px;-webkit-overflow-scrolling:touch;}",
    ".tl-pt{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:2px;background:var(--carta);",
      "border:2px solid transparent;border-radius:14px;padding:7px 12px;min-width:64px;}",
    ".tl-pt.me{border-color:var(--accento);}",
    ".tl-pt .n{font-size:.78rem;font-weight:700;color:var(--testo-tenue);max-width:9ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
    ".tl-pt .p{font-size:1.1rem;font-weight:900;}",
    ".tl-pt.turno{background:linear-gradient(135deg,var(--carta-2),var(--carta));}",
    ".tl-pt.turno .n{color:var(--accento);}",
    ".tl-timer{height:8px;border-radius:99px;background:var(--carta);overflow:hidden;margin:2px 0 14px;}",
    ".tl-timer-fill{height:100%;width:100%;border-radius:99px;background:linear-gradient(90deg,var(--verde),var(--accento));}",
    ".tl-timer.poco .tl-timer-fill{background:linear-gradient(90deg,#ff8a3a,var(--rosso));}",
    ".tl-carta-mano{background:linear-gradient(150deg,#fff0c2,var(--accento) 55%,var(--accento-scuro));",
      "color:#2a2400;border-radius:22px;padding:20px 18px;box-shadow:0 10px 30px rgba(224,169,10,.35);",
      "text-align:center;margin-bottom:8px;position:relative;overflow:hidden;}",
    ".tl-carta-mano .occhiello{font-size:.72rem;font-weight:900;text-transform:uppercase;letter-spacing:.12em;opacity:.7;}",
    ".tl-carta-mano .titolo{font-size:1.4rem;font-weight:900;line-height:1.18;margin-top:6px;}",
    ".tl-carta-mano .desc{font-size:.95rem;line-height:1.4;margin-top:10px;color:#4a3d00;}",
    ".tl-linea{display:flex;flex-direction:column;gap:0;}",
    ".tl-evento{background:var(--carta);border-radius:16px;padding:13px 15px;display:flex;",
      "align-items:flex-start;gap:14px;box-shadow:0 3px 12px rgba(0,0,0,.25);}",
    ".tl-evento .anno{font-size:1.5rem;font-weight:900;color:var(--accento);min-width:2.8em;text-align:right;flex:0 0 auto;}",
    ".tl-evento .et-col{flex:1;min-width:0;}",
    ".tl-evento .et{font-size:1.02rem;font-weight:700;line-height:1.25;}",
    ".tl-evento .et-desc{font-size:.85rem;color:var(--testo-tenue);line-height:1.35;margin-top:3px;}",
    ".tl-tent{border:2px dashed var(--accento);background:rgba(255,202,58,.12);}",
    ".tl-tent .anno{color:var(--accento);}",
    ".tl-gap{width:100%;min-height:50px;margin:10px 0;border:2px dashed var(--carta-2);",
      "background:rgba(255,255,255,.02);color:var(--testo-tenue);border-radius:14px;font-family:inherit;",
      "font-weight:800;font-size:.95rem;cursor:pointer;transition:all .12s ease;}",
    ".tl-gap:active,.tl-gap:hover{border-style:solid;border-color:var(--accento);color:var(--accento);background:rgba(255,202,58,.14);}",
    ".tl-esito{text-align:center;flex:1;display:flex;flex-direction:column;justify-content:center;gap:6px;}",
    ".tl-esito .faccia{font-size:4.2rem;animation:pop .4s ease;}",
    "@keyframes pop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}",
    ".tl-esito .verdetto{font-size:1.7rem;font-weight:900;}",
    ".tl-esito .giusto{color:var(--verde);} .tl-esito .sbagliato{color:var(--rosso);}",
    ".tl-esito .annone{font-size:2.6rem;font-weight:900;color:var(--accento);}",
    ".tl-esito .titoletto{font-size:1.15rem;font-weight:700;}",
    ".tl-esito .delta{font-size:1.3rem;font-weight:900;margin-top:2px;}",
    ".tl-esito .delta.su{color:var(--verde);} .tl-esito .delta.giu{color:var(--rosso);}",
    ".tl-voti{list-style:none;padding:0;margin:12px auto 0;max-width:30ch;display:flex;flex-direction:column;gap:6px;}",
    ".tl-voti li{display:flex;justify-content:space-between;gap:10px;background:var(--carta);border-radius:12px;padding:8px 12px;font-weight:700;}",
    ".tl-voti .d{font-size:1.05rem;font-weight:900;}",
    ".tl-vota{display:flex;gap:12px;}",
    ".tl-finito{margin-top:10px;font-size:1.05rem;font-weight:800;color:var(--verde);}",
    ".tl-attesa{color:var(--testo-tenue);text-align:center;font-weight:700;}",
    ".classifica li{animation:slideIn .45s ease both;}",
    "@keyframes slideIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:none}}",
    ".tl-coriandoli{font-size:3rem;text-align:center;animation:pop .5s ease;}"
  ].join("");
  document.head.appendChild(stile);

  // --- Suoni + vibrazione ---
  var AC = null;
  function ctx() { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) {} return AC; }
  function beep(freqs, dur, tipo) {
    var c = ctx(); if (!c) return;
    var t0 = c.currentTime;
    freqs.forEach(function (f, i) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = tipo || "sine"; o.frequency.value = f;
      var s = t0 + i * (dur * 0.6);
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.25, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + dur);
    });
  }
  function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  var FX = {
    giusto: function () { beep([660, 880, 1180], 0.18, "triangle"); vibra(60); },
    sbagliato: function () { beep([180, 120], 0.28, "sawtooth"); vibra([90, 60, 90]); },
    turno: function () { beep([880, 1180], 0.12, "sine"); vibra(120); },
    voto: function () { beep([520], 0.1, "square"); vibra(30); },
    tic: function () { beep([1200], 0.05, "sine"); },
    vittoria: function () { beep([660, 880, 1046, 1318], 0.22, "triangle"); vibra([120, 60, 120, 60, 200]); }
  };

  function ordina(linea) { linea.sort(function (a, b) { return a.anno - b.anno; }); }
  function pescaDati(imp) {
    var cats = window.SG_CATEGORIE || [];
    var scelte = (imp && imp.categorie) || null;
    var attive = cats.filter(function (c) { return !scelte || scelte.indexOf(c.id) >= 0; });
    if (!attive.length) attive = cats;
    var d = []; attive.forEach(function (c) { (c.eventi || []).forEach(function (e) { d.push(e); }); });
    return d;
  }
  function mischiaArr(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function annoTesto(a) { return a < 0 ? Math.abs(a) + " a.C." : String(a); }
  function gapGiusto(linea, gap, Y) {
    return ((gap === 0) || (linea[gap - 1].anno <= Y)) && ((gap === linea.length) || (Y <= linea[gap].anno));
  }

  // Componenti riusabili
  function nodoCartaMano(el, carta, occhiello) {
    return el("div", { class: "tl-carta-mano" }, [
      el("div", { class: "occhiello", text: occhiello }),
      el("div", { class: "titolo", text: carta.titolo }),
      carta.fatto ? el("div", { class: "desc", text: carta.fatto }) : null
    ]);
  }
  function nodoEvento(el, ev, tent) {
    return el("div", { class: "tl-evento" + (tent ? " tl-tent" : "") }, [
      el("span", { class: "anno", text: tent ? "?" : annoTesto(ev.anno) }),
      el("div", { class: "et-col" }, [
        el("div", { class: "et", text: ev.titolo }),
        ev.fatto ? el("div", { class: "et-desc", text: ev.fatto }) : null
      ])
    ]);
  }
  // Classifica sempre visibile in cima
  function nodoTop(el, giocatori, correnteId) {
    var ord = giocatori.slice().sort(function (a, b) { return b.punti - a.punti; });
    var top = el("div", { class: "tl-top" });
    ord.forEach(function (g) {
      top.appendChild(el("div", { class: "tl-pt" + (g._me ? " me" : "") + ((g.id != null ? g.id === correnteId : g.nome === correnteId) ? " turno" : "") }, [
        el("div", { class: "n", text: g.nome }),
        el("div", { class: "p", text: g.punti })
      ]));
    });
    return top;
  }
  // Barra tempo. rimastiMs/totaliMs; onScaduto solo dove serve (telefono singolo / host)
  function barraTimer(el, rimastiMs, totaliMs, onScaduto) {
    var wrap = el("div", { class: "tl-timer" + (rimastiMs <= 8000 ? " poco" : "") });
    var fill = el("div", { class: "tl-timer-fill" });
    wrap.appendChild(fill);
    var frac = Math.max(0, Math.min(1, rimastiMs / totaliMs));
    fill.style.width = (frac * 100) + "%";
    requestAnimationFrame(function () { fill.style.transition = "width " + rimastiMs + "ms linear"; fill.style.width = "0%"; });
    if (onScaduto && rimastiMs > 0) wrap._to = setTimeout(onScaduto, rimastiMs);
    else if (onScaduto) onScaduto();
    wrap._stop = function () { if (wrap._to) clearTimeout(wrap._to); };
    return wrap;
  }

  // Schermata finale con animazione (usata da entrambe le modalità)
  function schermataFine(t, classifica, rigioca) {
    var el = t.el;
    var s = t.schermata({ icona: "🏆", titolo: "Classifica finale", sotto: gioco.nome });
    s._contenuto.appendChild(el("div", { class: "tl-coriandoli", text: "🎉🥳🎉" }));
    var ol = el("ol", { class: "classifica" });
    var med = ["🥇", "🥈", "🥉"];
    classifica.forEach(function (r, i) {
      var li = el("li", { class: i === 0 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: med[i] || (i + 1) + "°" }),
        el("span", { class: "nome", text: r.nome }),
        el("span", { class: "punti", text: r.punti + " punti" })
      ]);
      li.style.animationDelay = (i * 0.12) + "s";
      ol.appendChild(li);
    });
    s._contenuto.appendChild(ol);
    FX.vittoria();
    if (rigioca) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Rigioca", onclick: rigioca }));
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Torna ai giochi", onclick: t.esci }));
    t.mostra(s);
  }

  var gioco = {
    id: "timeline",
    nome: "La linea del tempo",
    icona: "📜",
    descrizione: "Metti gli avvenimenti nell'ordine giusto e sfida gli amici a punti.",
    giocatoriMin: 1,
    giocatoriMax: 8,

    regole: [
      "Al tuo turno esce un avvenimento <b>senza data</b>: hai <b>30 secondi</b> per decidere dove va nella linea del tempo.",
      "Se indovini vinci <b>100 punti</b> e la carta entra nella linea. Se sbagli <b>perdi 100 punti</b> e la carta sparisce (la data resta segreta).",
      "Online: quando scegli, gli altri vedono il punto e <b>votano</b> se sono d'accordo. Chi vota giusto prende <b>50 punti</b>, chi sbaglia ne perde 50.",
      "La <b>classifica</b> è sempre in alto. Vince chi ha più punti quando tutti hanno finito le carte."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      var categorie = window.SG_CATEGORIE || [];
      var link = SG.parametriLink();

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
          ? "Gli altri entrano dai loro telefoni con un codice. Qui scrivi solo il TUO nome."
          : "Attenzione: qui il collegamento non è disponibile. Funziona quando il gioco è pubblicato su un sito.";
      }
      bTel = el("button", { class: "modo-chip attiva", onclick: function () { scegliModo("telefono"); } }, [
        el("span", { class: "mi", text: "📱" }), el("div", {}, [
          el("div", { class: "mt", text: "Un telefono solo" }), el("div", { class: "ms", text: "Si passa di mano in mano" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { scegliModo("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [
          el("div", { class: "mt", text: "Ognuno dal suo telefono" }), el("div", { class: "ms", text: "Con voti e punti" })])]);
      box.appendChild(el("div", { class: "modo-griglia" }, [bTel, bOnl]));
      box.appendChild(notaOnline);

      var idValidi = categorie.map(function (c) { return c.id; });
      var diPartenza = (link.cat && link.cat.filter(function (id) { return idValidi.indexOf(id) >= 0; })) || null;
      dove.categorie = (diPartenza && diPartenza.length) ? diPartenza.slice() : idValidi.slice();
      box.appendChild(el("div", { class: "etichetta", text: "Categorie in gioco" }));
      var griglia = el("div", { class: "cat-griglia" });
      categorie.forEach(function (c) {
        var chip = el("button", { class: "cat-chip" + (dove.categorie.indexOf(c.id) >= 0 ? " attiva" : ""),
          onclick: function () {
            var i = dove.categorie.indexOf(c.id);
            if (i >= 0) dove.categorie.splice(i, 1); else dove.categorie.push(c.id);
            chip.className = "cat-chip" + (dove.categorie.indexOf(c.id) >= 0 ? " attiva" : "");
          } }, [ el("span", { class: "ci", text: c.icona || "🎲" }), el("span", { text: c.nome }), el("span", { class: "spunta", text: "✓" }) ]);
        griglia.appendChild(chip);
      });
      box.appendChild(griglia);

      dove.carte = link.carte ? Math.max(3, Math.min(8, link.carte)) : 5;
      box.appendChild(el("div", { class: "etichetta", text: "Carte da piazzare a testa" }));
      var valore = el("span", { class: "valore", text: dove.carte });
      function agg(d) { dove.carte = Math.max(3, Math.min(8, dove.carte + d)); valore.textContent = dove.carte; }
      box.appendChild(el("div", { class: "stepper" }, [
        el("button", { text: "−", onclick: function () { agg(-1); } }), valore,
        el("button", { text: "+", onclick: function () { agg(1); } }) ]));

      box.appendChild(el("div", { class: "etichetta", text: "Da mandare agli amici" }));
      var campo = el("input", { class: "link-campo", type: "text", readonly: "readonly", hidden: "hidden" });
      var avviso = el("div", { class: "link-avviso", hidden: "hidden" });
      box.appendChild(el("button", { class: "btn btn-fantasma", html: "🔗 Crea il link con queste impostazioni",
        onclick: function () {
          if (!dove.categorie.length) { avviso.hidden = false; avviso.textContent = "Scegli almeno una categoria."; return; }
          var url = SG.creaLink({ gioco: "timeline", cat: dove.categorie, carte: dove.carte });
          campo.value = url; campo.hidden = false; campo.focus(); campo.select();
          try { navigator.clipboard.writeText(url); } catch (e) {}
          avviso.hidden = false; avviso.textContent = "Link pronto! Se non si copia da solo, tienilo premuto e copialo.";
        } }));
      box.appendChild(campo); box.appendChild(avviso);
    },

    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospiteEntra(t, t.linkParams.stanza);
      if (t.impostazioni && t.impostazioni.modo === "online") return hostCrea(t);
      return partenzaTelefono(t);
    }
  };

  // =========================================================
  //  MODALITÀ "UN TELEFONO SOLO"
  // =========================================================
  function partenzaTelefono(t) {
    var mazzo = mischiaArr(pescaDati(t.impostazioni));
    var carte = (t.impostazioni && t.impostazioni.carte) || 5;
    var stato = {
      mazzo: mazzo, linea: [mazzo.pop()], turno: 0, carta: null, _stop: null,
      giocatori: t.giocatori.map(function (n) { return { nome: n, restano: carte, punti: 0 }; })
    };
    ordina(stato.linea);
    var uno = stato.giocatori.length === 1;
    if (uno) turnoTel(t, stato);
    else t.passaA(stato.giocatori[0].nome, function () { turnoTel(t, stato); });
  }
  function attivi(stato) { var n = 0; stato.giocatori.forEach(function (g) { if (g.restano > 0) n++; }); return n; }
  function saltaFiniti(stato) { var giri = 0, N = stato.giocatori.length; while (N && stato.giocatori[stato.turno % N].restano === 0 && giri < N) { stato.turno++; giri++; } }

  function turnoTel(t, stato) {
    if (attivi(stato) === 0 || stato.mazzo.length === 0) return fineTel(t, stato);
    saltaFiniti(stato);
    stato.carta = stato.mazzo.pop();
    var el = t.el, g = stato.giocatori[stato.turno % stato.giocatori.length];
    g._me = true;
    var s = t.schermata({ titolo: g.nome, sotto: "Dove va? Hai " + TEMPO + " secondi", icona: "📜",
      indietro: function () { if (window.confirm("Uscire dalla partita?")) t.esci(); } });
    s._contenuto.appendChild(nodoTop(el, stato.giocatori, g.nome));
    var bar = barraTimer(el, TEMPO * 1000, TEMPO * 1000, function () { risolviTel(t, stato, null, bar); });
    stato._stop = function () { if (bar._stop) bar._stop(); };
    s._contenuto.appendChild(bar);
    s._contenuto.appendChild(nodoCartaMano(el, stato.carta, "Dove va?"));
    var linea = el("div", { class: "tl-linea" });
    linea.appendChild(gapTel(t, stato, 0, bar));
    stato.linea.forEach(function (ev, i) { linea.appendChild(nodoEvento(el, ev)); linea.appendChild(gapTel(t, stato, i + 1, bar)); });
    s._contenuto.appendChild(linea);
    g._me = false;
    t.mostra(s);
    FX.turno();
  }
  function gapTel(t, stato, i, bar) {
    return t.el("button", { class: "tl-gap", html: "⤵ &nbsp;metti qui", onclick: function () { risolviTel(t, stato, i, bar); } });
  }
  function risolviTel(t, stato, gap, bar) {
    if (bar && bar._stop) bar._stop();
    if (stato._risolto) return; stato._risolto = true;
    var carta = stato.carta, g = stato.giocatori[stato.turno % stato.giocatori.length];
    var ok = gap != null && gapGiusto(stato.linea, gap, carta.anno);
    if (ok) { stato.linea.push(carta); ordina(stato.linea); g.punti += PUNTI; }
    else { g.punti -= PUNTI; }
    g.restano -= 1;
    var appenaFinito = g.restano === 0;
    stato._risolto = false;
    esitoTel(t, stato, ok, appenaFinito, gap == null);
  }
  function esitoTel(t, stato, ok, appenaFinito, scaduto) {
    var el = t.el, carta = stato.carta, g = stato.giocatori[stato.turno % stato.giocatori.length];
    ok ? FX.giusto() : FX.sbagliato();
    var s = t.schermata({});
    s._contenuto.appendChild(nodoTop(el, stato.giocatori, ""));
    s._contenuto.appendChild(el("div", { class: "tl-esito" }, [
      el("div", { class: "faccia", text: ok ? "✅" : "❌" }),
      el("div", { class: "verdetto " + (ok ? "giusto" : "sbagliato"), text: scaduto ? "Tempo scaduto!" : (ok ? "Esatto!" : "Sbagliato") }),
      ok ? el("div", { class: "annone", text: annoTesto(carta.anno) }) : el("div", { class: "titoletto tenue", text: "La data resta un mistero…" }),
      el("div", { class: "titoletto", text: carta.titolo }),
      el("div", { class: "delta " + (ok ? "su" : "giu"), text: (ok ? "+" : "−") + PUNTI + " punti" }),
      appenaFinito ? el("div", { class: "tl-finito", text: "🎉 " + g.nome + " ha finito le sue carte!" }) : null
    ]));
    var finita = attivi(stato) === 0 || stato.mazzo.length === 0;
    if (finita) { s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏆 Vedi la classifica", onclick: function () { fineTel(t, stato); } })); return t.mostra(s); }
    stato.turno += 1; saltaFiniti(stato);
    var prossimo = stato.giocatori[stato.turno % stato.giocatori.length].nome, uno = stato.giocatori.length === 1;
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: uno ? "Continua ▶" : "Passa a " + prossimo + " ▶",
      onclick: function () { if (uno) turnoTel(t, stato); else t.passaA(prossimo, function () { turnoTel(t, stato); }); } }));
    t.mostra(s);
  }
  function classificaPunti(giocatori) {
    return giocatori.slice().sort(function (a, b) { return b.punti - a.punti; }).map(function (g) { return { nome: g.nome, punti: g.punti }; });
  }
  function fineTel(t, stato) { schermataFine(t, classificaPunti(stato.giocatori), function () { partenzaTelefono(t); }); }

  // =========================================================
  //  MODALITÀ ONLINE (host-authoritative, con votazione)
  // =========================================================
  function indexById(st, id) { for (var i = 0; i < st.giocatori.length; i++) if (st.giocatori[i].id === id) return i; return -1; }
  function trovaG(vm, id) { for (var i = 0; i < vm.giocatori.length; i++) if (vm.giocatori[i].id === id) return vm.giocatori[i]; return null; }
  function vmDa(st) {
    var g = st.giocatori, idx = g.length ? (st.turno % g.length) : 0;
    return {
      fase: st.fase, codice: st.codice, scadenza: st.scadenza || null, scelta: st.scelta != null ? st.scelta : null,
      giocatori: g.map(function (x) { return { id: x.id, nome: x.nome, restano: x.restano, punti: x.punti }; }),
      turnoId: g.length ? g[idx].id : null, turnoNome: g.length ? g[idx].nome : "",
      linea: st.linea.map(function (e) { return { anno: e.anno, titolo: e.titolo, fatto: e.fatto || "" }; }),
      carta: st.carta ? { titolo: st.carta.titolo, fatto: st.carta.fatto || "" } : null,
      hannoVotato: Object.keys(st.voti || {}), esito: st.esito || null, classifica: st.classifica || null
    };
  }
  function hostCrea(t) {
    if (!(window.SGNet && SGNet.disponibile())) return schermataNoNet(t);
    var carte = (t.impostazioni && t.impostazioni.carte) || 5;
    var st = {
      mazzo: mischiaArr(pescaDati(t.impostazioni)), linea: [], turno: 0, carta: null, esito: null, classifica: null,
      fase: "lobby", iniziata: false, carte: carte, codice: "…", scelta: null, voti: {}, scadenza: null, _to: null,
      giocatori: [{ id: "host", nome: (t.giocatori && t.giocatori[0]) || "Host", restano: carte, punti: 0 }]
    };
    function corr() { return st.giocatori[st.turno % st.giocatori.length]; }
    function clearTo() { if (st._to) { clearTimeout(st._to); st._to = null; } }

    var rete = SGNet.ospita({
      onCodice: function (c) { st.codice = c; bd(); },
      onAddio: function (id) {
        var i = indexById(st, id); if (i < 0) return;
        var eraCorr = st.iniziata && corr().id === id;
        st.giocatori.splice(i, 1); delete st.voti[id];
        if (st.iniziata && st.giocatori.length === 0) { clearTo(); rete.chiudi(); return t.esci(); }
        if (st.iniziata && st.fase !== "fine" && attivi(st) === 0) return finisci();
        if (eraCorr && st.fase === "turno") { clearTo(); st.turno = st.turno % st.giocatori.length; iniziaTurno(); return; }
        if (st.fase === "votazione") verificaVoti();
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") { if (!st.iniziata && indexById(st, id) < 0) st.giocatori.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), restano: st.carte, punti: 0 }); bd(); }
        else if (m.t === "scelta") { scelta(id, m.gap); }
        else if (m.t === "voto") { voto(id, m.d); }
        else if (m.t === "avanti") { if (st.fase === "esito" && corr().id === id) prossimo(); }
      },
      onErrore: function (e) { schermataNoNet(t, e); }
    });
    function invia() { rete.invia({ t: "vm", vm: vmDa(st) }); }
    function bd() { invia(); disegna(); }

    function comincia() {
      if (st.iniziata || st.giocatori.length < 1) return;
      st.iniziata = true; st.linea = [st.mazzo.pop()]; ordina(st.linea); iniziaTurno();
    }
    function iniziaTurno() {
      clearTo();
      if (attivi(st) === 0 || st.mazzo.length === 0) return finisci();
      saltaFiniti(st);
      st.carta = st.mazzo.pop(); st.scelta = null; st.voti = {}; st.esito = null; st.fase = "turno";
      st.scadenza = Date.now() + TEMPO * 1000;
      st._to = setTimeout(function () { scelta(corr().id, null); }, TEMPO * 1000); // tempo scaduto = niente scelta
      bd();
    }
    function scelta(playerId, gap) {
      if (st.fase !== "turno" || corr().id !== playerId) return;
      clearTo();
      st.scelta = (gap == null ? -1 : gap); // -1 = tempo scaduto senza scegliere
      var votanti = st.giocatori.filter(function (x) { return x.id !== corr().id; });
      if (st.scelta === -1 || votanti.length === 0) return risolvi(); // nessuno da far votare
      st.fase = "votazione"; st.voti = {}; st.scadenza = Date.now() + TEMPO * 1000;
      st._to = setTimeout(function () { risolvi(); }, TEMPO * 1000);
      bd();
    }
    function voto(id, d) {
      if (st.fase !== "votazione" || id === corr().id) return;
      if (indexById(st, id) < 0) return;
      st.voti[id] = !!d; bd(); verificaVoti();
    }
    function verificaVoti() {
      var votanti = st.giocatori.filter(function (x) { return x.id !== corr().id; });
      if (votanti.every(function (x) { return st.voti[x.id] != null; })) risolvi();
    }
    function risolvi() {
      clearTo();
      var g = corr(), carta = st.carta, gap = st.scelta;
      var ok = gap != null && gap >= 0 && gapGiusto(st.linea, gap, carta.anno);
      var voti = [];
      st.giocatori.forEach(function (x) {
        if (x.id === g.id) return;
        if (st.voti[x.id] == null) return; // non ha votato: 0
        var giustoV = (st.voti[x.id] === ok);
        x.punti += giustoV ? VOTO : -VOTO;
        voti.push({ nome: x.nome, d: st.voti[x.id], giusto: giustoV, delta: giustoV ? VOTO : -VOTO });
      });
      if (ok) { st.linea.push(carta); ordina(st.linea); g.punti += PUNTI; } else { g.punti -= PUNTI; }
      g.restano -= 1;
      st.esito = { giusto: ok, anno: carta.anno, titolo: carta.titolo, fatto: carta.fatto || "", nome: g.nome,
        delta: ok ? PUNTI : -PUNTI, scaduto: gap === -1, voti: voti, finito: g.restano === 0 };
      st.scelta = null; st.scadenza = null; st.fase = "esito";
      bd();
    }
    function prossimo() {
      if (attivi(st) === 0 || st.mazzo.length === 0) return finisci();
      st.turno += 1; iniziaTurno();
    }
    function finisci() {
      clearTo(); st.fase = "fine"; st.scadenza = null;
      st.classifica = classificaPunti(st.giocatori);
      bd();
    }
    var cb = { myId: "host", sonoHost: true,
      onGap: function (g) { scelta("host", g); }, onVoto: function (d) { voto("host", d); },
      onAvanti: function () { if (st.fase === "esito" && corr().id === "host") prossimo(); },
      onComincia: comincia, onEsci: function () { clearTo(); rete.chiudi(); t.esci(); } };
    function disegna() { disegnaVM(t, vmDa(st), cb); }
    disegna();
  }

  function ospiteEntra(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return schermataNoNet(t);
    var el = t.el, S = { myId: null, vm: null, rete: null, nome: "", msg: null };
    var cb = { myId: null, sonoHost: false,
      onGap: function (g) { S.rete && S.rete.invia({ t: "scelta", gap: g }); },
      onVoto: function (d) { S.rete && S.rete.invia({ t: "voto", d: d }); },
      onAvanti: function () { S.rete && S.rete.invia({ t: "avanti" }); },
      onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); } };
    function disegna() { if (S.vm) { cb.myId = S.myId; disegnaVM(t, S.vm, cb); } }
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🔗", titolo: "Entra nella partita", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      S.msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(S.msg);
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        ctx(); S.nome = (input.value || "Amico").trim() || "Amico"; S.msg.textContent = "Collegamento in corso…"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome });
          setTimeout(function () { if (!S.vm && S.msg) S.msg.textContent = "Non trovo la partita. Controlla il codice o aspetta che l'host apra la stanza…"; }, 8000); },
        onMsg: function (m) { if (m && m.t === "vm") { S.vm = m.vm; disegna(); } },
        onChiuso: function () { schermaErr("Collegamento perso. L'host potrebbe aver chiuso la partita."); },
        onErrore: function (e) { schermaErr(codiceErrore(e)); }
      });
    }
    function schermaErr(txt) {
      var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
      s._contenuto.appendChild(el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
      t.mostra(s);
    }
  }

  // Ricordo dell'ultima fase, per suonare al momento giusto
  var ultimaFase = null, ultimoEsitoGiusto = null;

  function disegnaVM(t, vm, cb) {
    var el = t.el;
    if (vm.fase === "lobby") { ultimaFase = "lobby"; return disegnaLobby(t, vm, cb); }
    if (vm.fase === "fine") {
      if (ultimaFase !== "fine") { ultimaFase = "fine"; return schermataFine(t, vm.classifica || [], null); }
      return schermataFine(t, vm.classifica || [], null);
    }
    var io = trovaG(vm, cb.myId);
    var mioTurno = vm.turnoId && cb.myId && vm.turnoId === cb.myId;

    // suoni sui cambi di fase
    if (vm.fase === "turno" && ultimaFase !== "turno") { if (mioTurno) FX.turno(); }
    if (vm.fase === "esito" && ultimaFase !== "esito") { vm.esito && (vm.esito.giusto ? FX.giusto() : FX.sbagliato()); }
    ultimaFase = vm.fase;

    var s = t.schermata({ titolo: titoloFase(vm, mioTurno), sotto: "Stanza " + (vm.codice || ""), icona: "📜",
      indietro: function () { if (window.confirm("Uscire dalla partita?")) cb.onEsci(); } });
    var meId = cb.myId;
    var gioc = vm.giocatori.map(function (g) { return { id: g.id, nome: g.nome, punti: g.punti, _me: g.id === meId }; });
    s._contenuto.appendChild(nodoTop(el, gioc, vm.turnoId));

    if (vm.scadenza && (vm.fase === "turno" || vm.fase === "votazione")) {
      var rim = vm.scadenza - Date.now();
      s._contenuto.appendChild(barraTimer(el, rim, TEMPO * 1000, null));
    }

    if (vm.fase === "turno") {
      s._contenuto.appendChild(nodoCartaMano(el, vm.carta || { titolo: "" }, mioTurno ? "Dove va?" : ("Sta scegliendo " + vm.turnoNome)));
      var linea = el("div", { class: "tl-linea" });
      if (mioTurno) linea.appendChild(gapBtn(el, cb, 0));
      vm.linea.forEach(function (ev, i) { linea.appendChild(nodoEvento(el, ev)); if (mioTurno) linea.appendChild(gapBtn(el, cb, i + 1)); else linea.appendChild(el("div", { style: "height:6px" })); });
      s._contenuto.appendChild(linea);
      if (!mioTurno) s._contenuto.appendChild(el("p", { class: "tl-attesa", text: "Aspetta: sta scegliendo " + vm.turnoNome + "." }));
    } else if (vm.fase === "votazione") {
      var ioHoVotato = vm.hannoVotato.indexOf(cb.myId) >= 0;
      s._contenuto.appendChild(nodoCartaMano(el, vm.carta || { titolo: "" }, mioTurno ? "Gli altri votano…" : "È giusto qui?"));
      var lin = el("div", { class: "tl-linea" }), tentId = "tent";
      vm.linea.forEach(function (ev, i) {
        if (i === vm.scelta) lin.appendChild(nodoEvento(el, { anno: 0, titolo: vm.carta ? vm.carta.titolo : "", fatto: vm.carta ? vm.carta.fatto : "" }, true));
        lin.appendChild(nodoEvento(el, ev));
      });
      if (vm.scelta >= vm.linea.length) lin.appendChild(nodoEvento(el, { anno: 0, titolo: vm.carta ? vm.carta.titolo : "", fatto: vm.carta ? vm.carta.fatto : "" }, true));
      s._contenuto.appendChild(lin);
      if (mioTurno) s._contenuto.appendChild(el("p", { class: "tl-attesa", text: "Gli altri stanno votando la tua scelta…" }));
      else if (ioHoVotato) s._contenuto.appendChild(el("p", { class: "tl-attesa", text: "Hai votato. Aspetta gli altri…" }));
      else {
        s._piede.appendChild(el("div", { class: "tl-vota" }, [
          el("button", { class: "btn btn-verde", text: "👍 D'accordo", onclick: function () { FX.voto(); cb.onVoto(true); } }),
          el("button", { class: "btn btn-rosso", text: "👎 No", onclick: function () { FX.voto(); cb.onVoto(false); } })
        ]));
      }
      setTimeout(function () { var e = document.querySelector(".tl-tent"); if (e && e.scrollIntoView) e.scrollIntoView({ block: "center", behavior: "smooth" }); }, 60);
    } else if (vm.fase === "esito") {
      var es = vm.esito || {};
      var box = el("div", { class: "tl-esito" }, [
        el("div", { class: "faccia", text: es.giusto ? "✅" : "❌" }),
        el("div", { class: "verdetto " + (es.giusto ? "giusto" : "sbagliato"), text: (es.nome || "") + (es.giusto ? ": esatto!" : (es.scaduto ? ": tempo scaduto" : ": sbagliato")) }),
        es.giusto ? el("div", { class: "annone", text: annoTesto(es.anno) }) : el("div", { class: "titoletto tenue", text: "La data resta un mistero…" }),
        el("div", { class: "titoletto", text: es.titolo }),
        el("div", { class: "delta " + (es.giusto ? "su" : "giu"), text: (es.giusto ? "+" : "−") + PUNTI + " a " + es.nome }),
        es.finito ? el("div", { class: "tl-finito", text: "🎉 " + es.nome + " ha finito le sue carte!" }) : null
      ]);
      if (es.voti && es.voti.length) {
        var ul = el("ul", { class: "tl-voti" });
        es.voti.forEach(function (v) { ul.appendChild(el("li", {}, [
          el("span", { text: (v.d ? "👍 " : "👎 ") + v.nome }),
          el("span", { class: "d " + (v.giusto ? "su" : "giu"), text: (v.delta > 0 ? "+" : "−") + Math.abs(v.delta), style: "color:" + (v.giusto ? "var(--verde)" : "var(--rosso)") })
        ])); });
        box.appendChild(ul);
      }
      s._contenuto.appendChild(box);
      if (mioTurno) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Avanti ▶", onclick: cb.onAvanti }));
      else s._piede.appendChild(el("p", { class: "tl-attesa", text: "In attesa di " + vm.turnoNome + "…" }));
    }
    t.mostra(s);
  }
  function titoloFase(vm, mioTurno) {
    if (vm.fase === "turno") return mioTurno ? "Tocca a te!" : "Tocca a " + vm.turnoNome;
    if (vm.fase === "votazione") return mioTurno ? "Ti votano…" : "Vota!";
    if (vm.fase === "esito") return "Risultato";
    return gioco.nome;
  }
  function gapBtn(el, cb, i) { return el("button", { class: "tl-gap", html: "⤵ &nbsp;metti qui", onclick: function () { cb.onGap(i); } }); }

  function disegnaLobby(t, vm, cb) {
    var el = t.el;
    var s = t.schermata({ icona: "🔗", titolo: "Sala d'attesa", sotto: cb.sonoHost ? "Invita gli amici" : "Aspetta l'inizio", indietro: cb.onEsci });
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
    vm.giocatori.forEach(function (g) { lista.appendChild(el("div", { class: "lobby-giocatore", text: "🙂 " + g.nome + (g.id === cb.myId ? " (tu)" : "") })); });
    s._contenuto.appendChild(lista);
    if (cb.sonoHost) s._piede.appendChild(el("button", { class: "btn btn-primario", text: vm.giocatori.length < 2 ? "Comincia (meglio in 2+)" : "Comincia ▶", onclick: cb.onComincia }));
    else s._piede.appendChild(el("p", { class: "tl-attesa", text: "In attesa che l'host cominci…" }));
    t.mostra(s);
  }

  function schermataNoNet(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità \"ognuno dal suo telefono\" funziona quando il gioco è aperto dal sito pubblicato. Da un file locale o da un'anteprima non è disponibile: intanto usa \"Un telefono solo\"." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
  function codiceErrore(e) { var ty = e && e.type; if (ty === "no-mqtt") return "Il collegamento non è disponibile qui."; return "Problema di collegamento. Controlla la connessione e riprova."; }

  SG.registra(gioco);
})();

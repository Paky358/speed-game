/* =========================================================
   GIOCO — "Sì... però"
   Un telefono solo. A ogni round uno dei giocatori fa da
   GIUDICE (a rotazione) e gli altri si dividono in due
   SQUADRE che si sfidano. Bastano 3 giocatori (giudice + 1 vs 1).
   La sequenza delle fasi è configurabile dall'host:
     - CLASSICA (default): Paradiso (2 Bonus su di sé) → Schianto
       (2 Malus agli avversari) → Rinforzo (un altro Bonus su di sé)
       → Ghigliottina (2 Malus agli avversari).
     - PERSONALIZZATA: l'host compone le fasi (tipo, quante, bersaglio).
   La mano si ricarica sempre fino a 7 Bonus e 7 Malus.
   I punti sono personali: chi è nella squadra vincente prende +1.
   Carte in data/sipero-carte.js.
   ========================================================= */
(function () {
  "use strict";

  var MAX_MANO = 7;
  var CLASSICA = [
    { tipo: "bonus", n: 2, bers: "se" },
    { tipo: "malus", n: 2, bers: "avv" },
    { tipo: "bonus", n: 1, bers: "se" },
    { tipo: "malus", n: 2, bers: "avv" }
  ];

  function altra(k) { return k === 0 ? 1 : 0; }
  function taglia(s) { return s.length > 34 ? s.slice(0, 32) + "…" : s; }
  function descriviFase(f) {
    return (f.tipo === "bonus" ? "Bonus" : "Malus") + " ×" + f.n + " " + (f.bers === "se" ? "su di sé" : "agli avversari");
  }
  function ricarica(t, manoArr, mazzo, max) {
    var m = t.mischia(mazzo);
    for (var i = 0; i < m.length && manoArr.length < max; i++) if (manoArr.indexOf(m[i]) < 0) manoArr.push(m[i]);
    return manoArr;
  }

  SG.registra({
    id: "sipero",
    nome: "Sì... però",
    icona: "🤨",
    descrizione: "Due squadre costruiscono lo scenario di vita migliore e si sabotano a colpi di Malus. Il giudice decide chi vince.",
    giocatoriMin: 3,
    giocatoriMax: 10,
    difficolta: 2,
    regole: [
      "A ogni round uno di voi fa da <b>giudice</b> (a rotazione) e gli altri si dividono in <b>due squadre</b>. Bastano 3 giocatori.",
      "Nella modalità classica: <b>Paradiso</b> (2 Bonus su di sé), <b>Schianto</b> (2 Malus agli avversari), <b>Rinforzo</b> (un altro Bonus su di sé), <b>Ghigliottina</b> (2 Malus finali). L'host può anche <b>comporre le fasi a piacere</b>.",
      "Poi ogni squadra convince a voce il giudice che il suo scenario, per quanto devastato, è il migliore da vivere. Nessun limite di tempo.",
      "Il giudice sceglie la squadra vincente: chi ne fa parte prende un punto. Dopo tutti i round, vince chi ha più punti."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = "telefono";
      dove.modalita = "classica";
      dove.sequenza = [];
      dove.round = 6;

      // --- un telefono solo / ognuno dal suo telefono ---
      if (!aiuti.torneo) {
        box.appendChild(el("div", { class: "etichetta", text: "Come si gioca" }));
        var notaOn = el("div", { class: "link-avviso", hidden: "hidden" });
        var bT, bO;
        (function () {
          function scegliModo(m) {
            dove.modo = m;
            bT.className = "modo-chip" + (m === "telefono" ? " attiva" : "");
            bO.className = "modo-chip" + (m === "online" ? " attiva" : "");
            notaOn.hidden = (m !== "online");
            notaOn.textContent = (window.SGNet && SGNet.disponibile())
              ? "Gli altri entrano dai loro telefoni con un codice: in lobby si scelgono il giudice e le squadre."
              : "Qui il collegamento non è disponibile. Funziona quando il gioco è aperto dal sito pubblicato online.";
          }
          bT = el("button", { class: "modo-chip attiva", onclick: function () { scegliModo("telefono"); } }, [
            el("span", { class: "mi", text: "📱" }), el("div", {}, [el("div", { class: "mt", text: "Un telefono solo" }), el("div", { class: "ms", text: "Si passa di mano" })])]);
          bO = el("button", { class: "modo-chip", onclick: function () { scegliModo("online"); } }, [
            el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Ognuno dal suo" }), el("div", { class: "ms", text: "Giudice e squadre in lobby" })])]);
        })();
        box.appendChild(el("div", { class: "modo-griglia" }, [bT, bO]));
        box.appendChild(notaOn);
      }

      box.appendChild(el("div", { class: "etichetta", text: "Le fasi" }));
      var pannello = el("div", { hidden: "hidden" });
      var bC, bP;
      function scegliMod(m) {
        dove.modalita = m;
        bC.className = "modo-chip" + (m === "classica" ? " attiva" : "");
        bP.className = "modo-chip" + (m === "custom" ? " attiva" : "");
        pannello.hidden = (m !== "custom");
      }
      bC = el("button", { class: "modo-chip attiva", onclick: function () { scegliMod("classica"); } }, [
        el("span", { class: "mi", text: "📜" }), el("div", {}, [el("div", { class: "mt", text: "Classica" }), el("div", { class: "ms", text: "Le 4 fasi standard" })])]);
      bP = el("button", { class: "modo-chip", onclick: function () { scegliMod("custom"); } }, [
        el("span", { class: "mi", text: "🎛️" }), el("div", {}, [el("div", { class: "mt", text: "Personalizzata" }), el("div", { class: "ms", text: "Fasi a tuo piacere" })])]);
      box.appendChild(el("div", { class: "modo-griglia" }, [bC, bP]));

      var nuovo = { tipo: "bonus", n: 2, bers: "se" };
      pannello.appendChild(el("div", { class: "etichetta", text: "La tua sequenza di fasi" }));
      var listaFasi = el("div", { style: "display:flex;flex-direction:column;gap:6px;margin-bottom:8px" });
      pannello.appendChild(listaFasi);
      function ridisegnaFasi() {
        while (listaFasi.firstChild) listaFasi.removeChild(listaFasi.firstChild);
        if (!dove.sequenza.length) listaFasi.appendChild(el("p", { class: "modulo-nota", text: "Nessuna fase: aggiungine almeno una qui sotto." }));
        dove.sequenza.forEach(function (f, i) {
          listaFasi.appendChild(el("div", { style: "display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.06)" }, [
            el("span", { text: (i + 1) + ") " + descriviFase(f) }),
            el("button", { class: "togli", text: "×", onclick: function () { dove.sequenza.splice(i, 1); ridisegnaFasi(); } })
          ]));
        });
      }
      function chipRow(label, valori, get, set) {
        pannello.appendChild(el("div", { class: "etichetta", style: "margin:6px 0 4px", text: label }));
        var row = el("div", { class: "modo-griglia" });
        valori.forEach(function (v) {
          var b = el("button", { class: "modo-chip" + (get() === v.val ? " attiva" : ""), onclick: function () {
            set(v.val); [].forEach.call(row.children, function (c, j) { c.className = "modo-chip" + (valori[j].val === v.val ? " attiva" : ""); });
          } }, [el("div", {}, [el("div", { class: "mt", text: v.txt })])]);
          row.appendChild(b);
        });
        pannello.appendChild(row);
      }
      chipRow("Tipo di carta", [{ val: "bonus", txt: "Bonus" }, { val: "malus", txt: "Malus" }], function () { return nuovo.tipo; }, function (v) { nuovo.tipo = v; });
      chipRow("Quante carte", [{ val: 1, txt: "1" }, { val: 2, txt: "2" }, { val: 3, txt: "3" }], function () { return nuovo.n; }, function (v) { nuovo.n = v; });
      chipRow("Bersaglio", [{ val: "se", txt: "Su di sé" }, { val: "avv", txt: "Avversari" }], function () { return nuovo.bers; }, function (v) { nuovo.bers = v; });
      pannello.appendChild(el("button", { class: "btn btn-fantasma", style: "margin-top:8px", text: "＋ Aggiungi questa fase", onclick: function () {
        dove.sequenza.push({ tipo: nuovo.tipo, n: nuovo.n, bers: nuovo.bers }); ridisegnaFasi();
      } }));
      ridisegnaFasi();
      box.appendChild(pannello);

      box.appendChild(el("div", { class: "etichetta", text: "Quanti round" }));
      var br = {};
      function scegliR(v) { dove.round = v; [4, 6, 8].forEach(function (x) { br[x].className = "modo-chip" + (v === x ? " attiva" : ""); }); }
      var gr = el("div", { class: "modo-griglia" });
      [4, 6, 8].forEach(function (v) {
        br[v] = el("button", { class: "modo-chip" + (v === 6 ? " attiva" : ""), onclick: function () { scegliR(v); } }, [el("div", {}, [el("div", { class: "mt", text: v + " round" })])]);
        gr.appendChild(br[v]);
      });
      box.appendChild(gr);
      box.appendChild(el("p", { class: "modulo-nota", text: "A ogni round uno fa da giudice (a rotazione) e gli altri si dividono in due squadre. Da 3 giocatori in su." }));
    },

    avvia: function (t) {
      var dati = window.SG_SIPERO || { bonus: [], malus: [] };
      if (dati.bonus.length < 2 || dati.malus.length < 2) return niente(t);
      var imp = t.impostazioni || {};
      var seq = (imp.modalita === "custom" && imp.sequenza && imp.sequenza.length) ? imp.sequenza : CLASSICA;
      if (t.linkParams && t.linkParams.stanza) return ospiteSipero(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostSipero(t, seq);
      var punti = {}; t.giocatori.forEach(function (n) { punti[n] = 0; });
      var st = {
        giocatori: t.giocatori.slice(), punti: punti,
        bonus: dati.bonus, malus: dati.malus, sequenza: seq,
        round: 0, totale: imp.round || 6
      };
      iniziaRound(t, st);
    }
  });

  function niente(t) {
    var s = t.schermata({ icona: "🤨", titolo: "Sì... però", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { text: "Mancano le carte del gioco." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  function iniziaRound(t, st) {
    st.round += 1;
    if (st.round > st.totale) return finePartita(t, st);
    var n = st.giocatori.length;
    var gi = (st.round - 1) % n;
    st.giudice = st.giocatori[gi];
    var altri = [];
    for (var d = 1; d < n; d++) altri.push(st.giocatori[(gi + d) % n]);
    var h = Math.ceil(altri.length / 2);
    st.squadre = [
      { nome: "Squadra 1", membri: altri.slice(0, h) },
      { nome: "Squadra 2", membri: altri.slice(h) }
    ];
    st.scen = [{ bonus: [], malusRic: [], cerotto: null }, { bonus: [], malusRic: [], cerotto: null }];
    st.mani = [
      { bonus: ricarica(t, [], st.bonus, MAX_MANO), malus: ricarica(t, [], st.malus, MAX_MANO) },
      { bonus: ricarica(t, [], st.bonus, MAX_MANO), malus: ricarica(t, [], st.malus, MAX_MANO) }
    ];
    st.steps = [];
    st.sequenza.forEach(function (f) { st.steps.push({ sq: 0, f: f }); st.steps.push({ sq: 1, f: f }); });
    st.stepIdx = 0;

    var el = t.el;
    var s = t.schermata({ icona: "🥊", titolo: "Round " + st.round + " di " + st.totale, sotto: "Giudice: " + st.giudice });
    s._contenuto.appendChild(el("div", { style: "text-align:center;margin:12px 0" }, [
      el("div", { style: "font-size:1.15rem;font-weight:800", text: "🟥 " + membriTxt(st.squadre[0]) }),
      el("div", { style: "margin:6px 0", text: "contro" }),
      el("div", { style: "font-size:1.15rem;font-weight:800", text: "🟦 " + membriTxt(st.squadre[1]) }),
      el("p", { class: "modulo-nota", style: "margin-top:14px", text: "Passatevi il telefono a turno, senza far vedere le scelte all'altra squadra." })
    ]));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Via ▶", onclick: function () { prossimoStep(t, st); } }));
    t.mostra(s);
  }

  function membriTxt(sq) { return sq.nome + " (" + sq.membri.join(", ") + ")"; }

  function prossimoStep(t, st) {
    if (st.stepIdx >= st.steps.length) return rivelazione(t, st);
    var step = st.steps[st.stepIdx];
    t.passaA(membriTxt(st.squadre[step.sq]), function () { schermataFase(t, st, step); });
  }

  function schermataFase(t, st, step) {
    var f = step.f, sq = step.sq;
    var target = (f.bers === "se") ? sq : altra(sq);
    var manoTipo = st.mani[sq][f.tipo];
    var etichetta = (f.tipo === "bonus" ? "Bonus" : "Malus") + " ×" + f.n + " " + (f.bers === "se" ? "sul VOSTRO scenario" : "a " + st.squadre[altra(sq)].nome);
    scegliCarte(t, {
      titolo: st.squadre[sq].nome, sotto: etichetta, carte: manoTipo, quante: f.n, tipo: f.tipo
    }, function (scelte) {
      var dest = (f.tipo === "bonus") ? st.scen[target].bonus : st.scen[target].malusRic;
      scelte.forEach(function (c) { dest.push(c); });
      st.mani[sq][f.tipo] = manoTipo.filter(function (c) { return scelte.indexOf(c) < 0; });
      ricarica(t, st.mani[sq][f.tipo], f.tipo === "bonus" ? st.bonus : st.malus, MAX_MANO);
      st.stepIdx += 1; prossimoStep(t, st);
    });
  }

  function scegliCarte(t, opts, onOk) {
    var el = t.el;
    var s = t.schermata({ icona: "🃏", titolo: opts.titolo, sotto: opts.sotto });
    var sel = [];
    var conferma = el("button", { class: "btn btn-primario", text: "Conferma ▶", disabled: "disabled",
      onclick: function () { if (sel.length === opts.quante) onOk(sel.slice()); } });
    var lista = el("div", { style: "display:flex;flex-direction:column;gap:8px" });
    opts.carte.forEach(function (c) {
      var attiva = false;
      var b = el("button", { style: cardStyle(false, opts.tipo), html: c });
      b.addEventListener("click", function () {
        if (attiva) { attiva = false; sel = sel.filter(function (x) { return x !== c; }); }
        else { if (sel.length >= opts.quante) return; attiva = true; sel.push(c); }
        b.setAttribute("style", cardStyle(attiva, opts.tipo));
        if (sel.length === opts.quante) conferma.removeAttribute("disabled"); else conferma.setAttribute("disabled", "disabled");
      });
      lista.appendChild(b);
    });
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Seleziona " + opts.quante + (opts.quante === 1 ? " carta" : " carte") }));
    s._contenuto.appendChild(lista);
    s._piede.appendChild(conferma);
    t.mostra(s);
  }

  function cardStyle(attiva, tipo) {
    var base = "width:100%;text-align:left;padding:12px 14px;border-radius:12px;font-size:1rem;line-height:1.35;cursor:pointer;border:2px solid transparent;color:#fff;";
    var col = tipo === "malus" ? "rgba(255,80,80,.16)" : "rgba(80,220,120,.16)";
    var bord = tipo === "malus" ? "#ff6b6b" : "#2ecc71";
    return base + "background:" + col + ";" + (attiva ? "border-color:" + bord + ";font-weight:600;" : "");
  }

  function rivelazione(t, st) {
    var el = t.el;
    var s = t.schermata({ icona: "🎭", titolo: "Gli scenari", sotto: "Ora l'arringa, poi il giudice decide" });
    st.squadre.forEach(function (sq, k) {
      var box = el("div", { style: "margin-bottom:14px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.05)" });
      box.appendChild(el("div", { class: "etichetta", style: "margin:0 0 6px", text: (k === 0 ? "🟥 " : "🟦 ") + membriTxt(sq) }));
      st.scen[k].bonus.forEach(function (c) {
        box.appendChild(el("div", { style: "padding:6px 8px;border-radius:8px;margin-bottom:4px;background:rgba(80,220,120,.14)", html: "✅ " + c }));
      });
      st.scen[k].malusRic.forEach(function (c) {
        box.appendChild(el("div", { style: "padding:6px 8px;border-radius:8px;margin-bottom:4px;background:rgba(255,80,80,.14)", html: "❌ " + c }));
      });
      s._contenuto.appendChild(box);
    });
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "All'arringa ▶", onclick: function () { arringa(t, st, 0); } }));
    t.mostra(s);
  }

  function arringa(t, st, k) {
    if (k >= st.squadre.length) return giudizio(t, st);
    var el = t.el;
    var s = t.schermata({ icona: "🎤", titolo: st.squadre[k].nome + ", convincete il giudice", sotto: "Prendetevi il tempo che volete" });
    s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:2.8rem;margin:14px 0", text: (k === 0 ? "🟥" : "🟦") }));
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Spiegate a voce al giudice perché il vostro scenario, pur devastato, è il migliore da vivere. Nessuna fretta." }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: (k === 0 ? "Tocca all'altra squadra ▶" : "Al giudizio ▶"), onclick: function () { arringa(t, st, k + 1); } }));
    t.mostra(s);
  }

  function giudizio(t, st) {
    t.passaA(st.giudice, function () {
      var el = t.el;
      var s = t.schermata({ icona: "⚖️", titolo: "Giudice " + st.giudice, sotto: "Quale scenario è il migliore da vivere?" });
      var g = el("div", { style: "display:flex;flex-direction:column;gap:10px" });
      st.squadre.forEach(function (sq, k) {
        g.appendChild(el("button", { class: "btn btn-fantasma", style: "font-size:1.1rem;padding:16px;text-align:left", html: (k === 0 ? "🟥 " : "🟦 ") + membriTxt(sq),
          onclick: function () { sq.membri.forEach(function (m) { st.punti[m] = (st.punti[m] || 0) + 1; }); esitoRound(t, st, k); } }));
      });
      s._contenuto.appendChild(g);
      t.mostra(s);
    });
  }

  function esitoRound(t, st, vincitore) {
    var el = t.el;
    var s = t.schermata({ icona: "🏅", titolo: "Round a " + st.squadre[vincitore].nome + "!", sotto: membriTxt(st.squadre[vincitore]) });
    var ordine = st.giocatori.slice().sort(function (a, b) { return (st.punti[b] || 0) - (st.punti[a] || 0); });
    var ol = el("ol", { class: "classifica" });
    ordine.forEach(function (nome, i) {
      ol.appendChild(el("li", { class: i === 0 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: (i + 1) + "°" }),
        el("span", { class: "nome", text: nome }),
        el("span", { class: "punti", text: st.punti[nome] || 0 })
      ]));
    });
    s._contenuto.appendChild(ol);
    var ultimo = st.round >= st.totale;
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: ultimo ? "Classifica finale 🏆" : "Prossimo round ▶",
      onclick: function () { if (ultimo) finePartita(t, st); else iniziaRound(t, st); } }));
    t.mostra(s);
  }

  function finePartita(t, st) {
    var classifica = st.giocatori.slice()
      .sort(function (a, b) { return (st.punti[b] || 0) - (st.punti[a] || 0); })
      .map(function (nome) { return { nome: nome, punti: st.punti[nome] || 0 }; });
    t.fine(classifica);
  }

  // =========================================================
  //  ONLINE — ognuno dal suo telefono (host-authoritative).
  //  Giudice e squadre FISSI, scelti in lobby dall'host.
  //  Il tavolo (i due scenari) è sempre visibile a tutti; la
  //  propria mano di carte è visibile solo alla propria squadra.
  // =========================================================
  function squadreDa(giocatori, assegna) {
    var sq = [{ membri: [] }, { membri: [] }];
    giocatori.forEach(function (g) { var a = assegna[g.id]; if (a === 0 || a === 1) sq[a].membri.push({ id: g.id, nome: g.nome }); });
    return sq;
  }
  function giudiceDa(giocatori, assegna) {
    for (var i = 0; i < giocatori.length; i++) if (assegna[giocatori[i].id] === "g") return giocatori[i];
    return null;
  }
  function squadraDiId(assegna, id) { var a = assegna[id]; return (a === 0 || a === 1) ? a : -1; }
  function perIdS(st, id) { return st.giocatori.some(function (x) { return x.id === id; }); }

  function vmSipero(st) {
    var g = giudiceDa(st.giocatori, st.assegna);
    var vm = {
      fase: st.fase, codice: st.codice,
      giocatori: st.giocatori.map(function (x) { return { id: x.id, nome: x.nome }; }),
      assegna: st.assegna, giudiceId: g ? g.id : null, giudiceNome: g ? g.nome : "",
      squadre: squadreDa(st.giocatori, st.assegna),
      scen: st.scen, mani: st.mani || null, vincitore: st.vincitore, step: null
    };
    if (st.fase === "gioco" && st.steps && st.stepIdx < st.steps.length) {
      var s = st.steps[st.stepIdx];
      vm.step = { sq: s.sq, tipo: s.f.tipo, n: s.f.n, bers: s.f.bers, i: st.stepIdx + 1, tot: st.steps.length };
    }
    return vm;
  }

  function hostSipero(t, seq) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaReteS(t);
    var st = {
      fase: "lobby", codice: "…", iniziata: false,
      giocatori: [{ id: "host", nome: (t.giocatori && t.giocatori[0]) || "Host" }],
      assegna: {}, seq: seq, vincitore: null,
      scen: [{ bonus: [], malusRic: [] }, { bonus: [], malusRic: [] }],
      mani: null, steps: [], stepIdx: 0,
      bonus: (window.SG_SIPERO || {}).bonus || [], malus: (window.SG_SIPERO || {}).malus || []
    };
    var rete = SGNet.ospita("sipero", {
      onCodice: function (c) { st.codice = c; bd(); },
      onAddio: function (id) {
        st.giocatori = st.giocatori.filter(function (x) { return x.id !== id; });
        delete st.assegna[id];
        if (st.giocatori.length === 0) { rete.chiudi(); return t.esci(); }
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") { if (!perIdS(st, id) && st.giocatori.length < 10) st.giocatori.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16) }); bd(); }
        else if (m.t === "gioca") giocaCarte(id, m.carte);
        else if (m.t === "giudica") giudica(id, m.sq);
        else if (m.t === "avanti") avanti(id);
      },
      onErrore: function () { senzaReteS(t); }
    });
    function invia() { rete.invia({ t: "vm", vm: vmSipero(st) }); }
    function bd() { invia(); disegna(); }

    function comincia() {
      if (st.iniziata) return;
      var sq = squadreDa(st.giocatori, st.assegna), g = giudiceDa(st.giocatori, st.assegna);
      var tutti = st.giocatori.every(function (x) { var a = st.assegna[x.id]; return a === 0 || a === 1 || a === "g"; });
      if (!g || !sq[0].membri.length || !sq[1].membri.length || !tutti) return;
      st.iniziata = true; st.fase = "gioco"; st.vincitore = null;
      st.scen = [{ bonus: [], malusRic: [] }, { bonus: [], malusRic: [] }];
      st.mani = [
        { bonus: ricarica(t, [], st.bonus, MAX_MANO), malus: ricarica(t, [], st.malus, MAX_MANO) },
        { bonus: ricarica(t, [], st.bonus, MAX_MANO), malus: ricarica(t, [], st.malus, MAX_MANO) }
      ];
      st.steps = []; st.seq.forEach(function (f) { st.steps.push({ sq: 0, f: f }); st.steps.push({ sq: 1, f: f }); });
      st.stepIdx = 0; bd();
    }
    function giocaCarte(id, carte) {
      if (st.fase !== "gioco" || st.stepIdx >= st.steps.length) return;
      var step = st.steps[st.stepIdx];
      if (squadraDiId(st.assegna, id) !== step.sq) return;
      if (!Array.isArray(carte) || carte.length !== step.f.n) return;
      var mano = st.mani[step.sq][step.f.tipo];
      for (var i = 0; i < carte.length; i++) if (mano.indexOf(carte[i]) < 0) return;
      var target = (step.f.bers === "se") ? step.sq : altra(step.sq);
      var dest = (step.f.tipo === "bonus") ? st.scen[target].bonus : st.scen[target].malusRic;
      carte.forEach(function (c) { dest.push(c); });
      st.mani[step.sq][step.f.tipo] = mano.filter(function (c) { return carte.indexOf(c) < 0; });
      ricarica(t, st.mani[step.sq][step.f.tipo], step.f.tipo === "bonus" ? st.bonus : st.malus, MAX_MANO);
      st.stepIdx += 1;
      if (st.stepIdx >= st.steps.length) st.fase = "arringa";
      bd();
    }
    function avanti(id) {
      var g = giudiceDa(st.giocatori, st.assegna);
      if (st.fase === "arringa" && (id === "host" || (g && id === g.id))) { st.fase = "giudizio"; bd(); }
    }
    function giudica(id, sq) {
      var g = giudiceDa(st.giocatori, st.assegna);
      if (st.fase === "giudizio" && g && id === g.id && (sq === 0 || sq === 1)) { st.vincitore = sq; st.fase = "fine"; bd(); }
    }
    function nuova() {
      st.fase = "lobby"; st.iniziata = false; st.vincitore = null;
      st.scen = [{ bonus: [], malusRic: [] }, { bonus: [], malusRic: [] }];
      st.mani = null; st.steps = []; st.stepIdx = 0; bd();
    }
    var cb = {
      sonoHost: true, myId: "host",
      onAssegna: function (pid, val) { if (st.fase === "lobby") { st.assegna[pid] = val; bd(); } },
      onComincia: comincia,
      onGioca: function (carte) { giocaCarte("host", carte); },
      onGiudica: function (sq) { giudica("host", sq); },
      onAvanti: function () { avanti("host"); },
      onNuova: nuova,
      onEsci: function () { rete.chiudi(); t.esci(); }
    };
    function disegna() { disegnaSiperoVM(t, vmSipero(st), cb); }
    disegna();
  }

  function ospiteSipero(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaReteS(t);
    var el = t.el, S = { myId: null, vm: null, rete: null, nome: "", msg: null };
    var cb = {
      sonoHost: false, myId: null,
      onAssegna: function () {}, onComincia: function () {}, onNuova: function () {},
      onGioca: function (carte) { S.rete && S.rete.invia({ t: "gioca", carte: carte }); },
      onGiudica: function (sq) { S.rete && S.rete.invia({ t: "giudica", sq: sq }); },
      onAvanti: function () { S.rete && S.rete.invia({ t: "avanti" }); },
      onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); }
    };
    function disegna() { if (S.vm) { cb.myId = S.myId; disegnaSiperoVM(t, S.vm, cb); } }
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🤨", titolo: "Entra nella partita", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      S.msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(S.msg);
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        S.nome = (input.value || "Amico").trim() || "Amico"; S.msg.textContent = "Collegamento in corso…"; collega();
      }}));
      t.mostra(s);
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome });
          setTimeout(function () { if (!S.vm && S.msg) S.msg.textContent = "Non trovo la partita. Controlla il codice, o l'host non ha ancora aperto la stanza…"; }, 8000); },
        onMsg: function (m) { if (m && m.t === "vm") { S.vm = m.vm; disegna(); } },
        onChiuso: function () { erroreS(t, "Collegamento perso. L'host potrebbe aver chiuso la partita."); },
        onErrore: function () { erroreS(t, "Problema di collegamento. Controlla la connessione e riprova."); }
      });
    }
  }

  function erroreS(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaReteS(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità \"ognuno dal suo telefono\" funziona quando il gioco è aperto dal sito pubblicato online. Da un file locale non è disponibile: intanto usa \"Un telefono solo\"." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // ---- disegno condiviso (host e ospiti) ----
  function nodoScenari(t, vm, mySq) {
    var el = t.el, box = el("div");
    vm.squadre.forEach(function (sq, k) {
      var mia = (k === mySq);
      var b = el("div", { style: "margin-bottom:10px;padding:8px 10px;border-radius:12px;background:" + (mia ? "rgba(120,160,255,.16)" : "rgba(255,255,255,.05)") });
      b.appendChild(el("div", { class: "etichetta", style: "margin:0 0 4px",
        text: (k === 0 ? "🟥 " : "🟦 ") + "Squadra " + (k + 1) + (sq.membri.length ? " (" + sq.membri.map(function (m) { return m.nome; }).join(", ") + ")" : "") + (mia ? " · tu" : "") }));
      vm.scen[k].bonus.forEach(function (c) { b.appendChild(el("div", { style: "padding:5px 7px;border-radius:7px;margin-bottom:3px;font-size:.92rem;line-height:1.3;background:rgba(80,220,120,.14)", html: "✅ " + c })); });
      vm.scen[k].malusRic.forEach(function (c) { b.appendChild(el("div", { style: "padding:5px 7px;border-radius:7px;margin-bottom:3px;font-size:.92rem;line-height:1.3;background:rgba(255,80,80,.14)", html: "❌ " + c })); });
      if (!vm.scen[k].bonus.length && !vm.scen[k].malusRic.length) b.appendChild(el("div", { class: "tenue", text: "(ancora niente)" }));
      box.appendChild(b);
    });
    return box;
  }
  function tuttiAssegnati(vm) { return vm.giocatori.every(function (g) { var a = vm.assegna[g.id]; return a === 0 || a === 1 || a === "g"; }); }
  function mostraManoConsulta(t, s, mano, escludiTipo) {
    var el = t.el;
    ["bonus", "malus"].forEach(function (tp) {
      if (escludiTipo && tp === escludiTipo) return;
      if (!mano[tp] || !mano[tp].length) return;
      s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: tp === "bonus" ? "🟢 Le tue carte Bonus" : "🔴 I tuoi Malus da lanciare" }));
      mano[tp].forEach(function (c) { s._contenuto.appendChild(el("div", { style: cardStyle(false, tp) + "cursor:default;", html: c })); });
    });
  }
  function scegliOnline(t, s, carte, quante, tipo, onOk) {
    var el = t.el;
    s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:8px", text: "Scegli " + quante + " " + (tipo === "bonus" ? "Bonus" : "Malus") + (quante === 1 ? " carta" : " carte") }));
    var sel = [];
    var conferma = el("button", { class: "btn btn-primario", text: "Gioca ▶", disabled: "disabled",
      onclick: function () { if (sel.length === quante) onOk(sel.slice()); } });
    carte.forEach(function (c) {
      var attiva = false;
      var b = el("button", { style: cardStyle(false, tipo), html: c });
      b.addEventListener("click", function () {
        if (attiva) { attiva = false; sel = sel.filter(function (x) { return x !== c; }); }
        else { if (sel.length >= quante) return; attiva = true; sel.push(c); }
        b.setAttribute("style", cardStyle(attiva, tipo));
        if (sel.length === quante) conferma.removeAttribute("disabled"); else conferma.setAttribute("disabled", "disabled");
      });
      s._contenuto.appendChild(b);
    });
    s._piede.appendChild(conferma);
  }

  function disegnaSiperoVM(t, vm, cb) {
    var el = t.el, myId = cb.myId;
    var mySq = -1, sonoGiudice = (vm.giudiceId === myId);
    vm.squadre.forEach(function (sq, k) { if (sq.membri.some(function (m) { return m.id === myId; })) mySq = k; });

    if (vm.fase === "lobby") {
      var s = t.schermata({ icona: "🤨", titolo: "Sì... però · Lobby", sotto: "Stanza " + (vm.codice || ""),
        indietro: function () { if (window.confirm("Uscire?")) cb.onEsci(); } });
      s._contenuto.appendChild(el("p", { class: "modulo-nota", text: cb.sonoHost ? "Scegli chi fa il giudice (⚖️) e assegna ognuno a una squadra (🟥/🟦), poi comincia." : "L'host sta formando le squadre…" }));
      vm.giocatori.forEach(function (g) {
        var a = vm.assegna[g.id];
        var ruolo = a === "g" ? "⚖️ Giudice" : a === 0 ? "🟥 Squadra 1" : a === 1 ? "🟦 Squadra 2" : "—";
        var riga = el("div", { style: "padding:8px 10px;border-radius:10px;margin-bottom:6px;background:rgba(255,255,255,.06)" });
        riga.appendChild(el("div", { style: "display:flex;justify-content:space-between" }, [
          el("span", { text: g.nome + (g.id === myId ? " (tu)" : "") }), el("span", { text: ruolo })
        ]));
        if (cb.sonoHost) {
          var row = el("div", { style: "display:flex;gap:6px;margin-top:6px" });
          [["⚖️", "g"], ["🟥", 0], ["🟦", 1]].forEach(function (o) {
            row.appendChild(el("button", { class: "btn btn-fantasma", style: "flex:1;padding:8px", text: o[0], onclick: function () { cb.onAssegna(g.id, o[1]); } }));
          });
          riga.appendChild(row);
        }
        s._contenuto.appendChild(riga);
      });
      if (cb.sonoHost) {
        var ok = vm.giudiceId && vm.squadre[0].membri.length && vm.squadre[1].membri.length && tuttiAssegnati(vm);
        var b = el("button", { class: "btn btn-primario", text: "Comincia ▶", onclick: cb.onComincia });
        if (!ok) b.setAttribute("disabled", "disabled");
        s._piede.appendChild(b);
        if (!ok) s._piede.appendChild(el("p", { class: "modulo-nota", text: "Serve: 1 giudice, almeno 1 per squadra e tutti assegnati." }));
      } else s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa che l'host cominci…" }));
      return t.mostra(s);
    }

    if (vm.fase === "fine") {
      var s = t.schermata({ icona: "🏆", titolo: "Vince la Squadra " + (vm.vincitore + 1) + "!", sotto: "Stanza " + (vm.codice || "") });
      s._contenuto.appendChild(nodoScenari(t, vm, mySq));
      if (cb.sonoHost) {
        s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Nuova partita (rifai le squadre)", onclick: cb.onNuova }));
        s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Chiudi", onclick: cb.onEsci }));
      } else s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa dell'host per un'altra partita…" }));
      return t.mostra(s);
    }

    var titolo = vm.fase === "arringa" ? "L'arringa" : vm.fase === "giudizio" ? "Il verdetto" : "In gioco";
    var s = t.schermata({ icona: "🤨", titolo: titolo, sotto: "Stanza " + (vm.codice || ""),
      indietro: function () { if (window.confirm("Uscire dalla partita?")) cb.onEsci(); } });
    s._contenuto.appendChild(nodoScenari(t, vm, mySq));

    if (vm.fase === "gioco") {
      var step = vm.step;
      var etich = (step.tipo === "bonus" ? "Bonus" : "Malus") + " ×" + step.n + " " + (step.bers === "se" ? "sul proprio scenario" : "agli avversari");
      s._contenuto.appendChild(el("p", { class: "modulo-nota", text: (step.sq === 0 ? "🟥" : "🟦") + " Tocca alla Squadra " + (step.sq + 1) + " — " + etich + " (fase " + step.i + "/" + step.tot + ")" }));
      if (sonoGiudice) {
        s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Sei il giudice: osserva il tavolo, deciderai alla fine." }));
      } else if (mySq >= 0) {
        var mano = vm.mani ? vm.mani[mySq] : null;
        if (step.sq === mySq && mano) {
          scegliOnline(t, s, mano[step.tipo], step.n, step.tipo, cb.onGioca);
          mostraManoConsulta(t, s, mano, step.tipo);
        } else {
          s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "In attesa che la Squadra " + (step.sq + 1) + " giochi. Intanto guarda le tue carte:" }));
          if (mano) mostraManoConsulta(t, s, mano, null);
        }
      } else {
        s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "In attesa…" }));
      }
    } else if (vm.fase === "arringa") {
      s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "A voce, ogni squadra convince il giudice che il proprio scenario, per quanto devastato, è il migliore da vivere. Nessuna fretta." }));
      if (sonoGiudice) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Al verdetto ▶", onclick: cb.onAvanti }));
      else s._piede.appendChild(el("p", { class: "modulo-nota", text: "Poi il giudice deciderà." }));
    } else if (vm.fase === "giudizio") {
      if (sonoGiudice) {
        s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Quale scenario è il migliore da vivere?" }));
        var gg = el("div", { style: "display:flex;flex-direction:column;gap:10px" });
        vm.squadre.forEach(function (sq, k) {
          gg.appendChild(el("button", { class: "btn btn-fantasma", style: "padding:14px", html: (k === 0 ? "🟥 " : "🟦 ") + "Squadra " + (k + 1), onclick: function () { cb.onGiudica(k); } }));
        });
        s._contenuto.appendChild(gg);
      } else s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Il giudice sta decidendo…" }));
    }
    t.mostra(s);
  }
})();

/* =========================================================
   GIOCO — "Sì... però"
   Un telefono solo. A ogni round uno dei giocatori fa da
   GIUDICE (a rotazione) e gli altri si dividono in due
   SQUADRE che si sfidano. Bastano 3 giocatori (giudice + 1 vs 1).
   La sequenza delle fasi è configurabile dall'host:
     - CLASSICA (default): Paradiso (2 Bonus su di sé) → Schianto
       (2 Malus agli avversari) → Cerotto (1 Bonus per arginare un
       Malus ricevuto) → Ghigliottina (2 Malus agli avversari).
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
    { tipo: "bonus", n: 1, bers: "se", cerotto: true },
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
      "Nella modalità classica: <b>Paradiso</b> (2 Bonus su di sé), <b>Schianto</b> (2 Malus agli avversari), <b>Cerotto</b> (1 Bonus per arginare un Malus ricevuto), <b>Ghigliottina</b> (2 Malus finali). L'host può anche <b>comporre le fasi a piacere</b>.",
      "Ogni squadra ha <b>1 minuto</b> per convincere il giudice che il suo scenario, per quanto devastato, è il migliore da vivere.",
      "Il giudice sceglie la squadra vincente: chi ne fa parte prende un punto. Dopo tutti i round, vince chi ha più punti."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modalita = "classica";
      dove.sequenza = [];
      dove.round = 6;

      box.appendChild(el("div", { class: "etichetta", text: "Come si gioca" }));
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
      if (f.cerotto && f.tipo === "bonus" && st.scen[sq].malusRic.length) {
        scegliMalusTarget(t, st, sq, scelte[0]);
      } else {
        st.stepIdx += 1; prossimoStep(t, st);
      }
    });
  }

  function scegliMalusTarget(t, st, sqK, bonusCer) {
    scegliCarte(t, {
      titolo: st.squadre[sqK].nome + " · Cerotto", sotto: "Su quale Malus incolli il Bonus «" + taglia(bonusCer) + "»?",
      carte: st.scen[sqK].malusRic.slice(), quante: 1, tipo: "malus"
    }, function (scelte) {
      st.scen[sqK].cerotto = { bonus: bonusCer, malus: scelte[0] };
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
        var cer = st.scen[k].cerotto && st.scen[k].cerotto.bonus === c;
        box.appendChild(el("div", { style: "padding:6px 8px;border-radius:8px;margin-bottom:4px;background:rgba(80,220,120,.14)", html: (cer ? "🩹 " : "✅ ") + c }));
      });
      st.scen[k].malusRic.forEach(function (c) {
        var arg = st.scen[k].cerotto && st.scen[k].cerotto.malus === c;
        box.appendChild(el("div", { style: "padding:6px 8px;border-radius:8px;margin-bottom:4px;background:rgba(255,80,80,.14)" + (arg ? ";opacity:.6;text-decoration:line-through" : ""), html: "❌ " + c + (arg ? " <b>(arginato)</b>" : "") }));
      });
      s._contenuto.appendChild(box);
    });
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "All'arringa ▶", onclick: function () { arringa(t, st, 0); } }));
    t.mostra(s);
  }

  function arringa(t, st, k) {
    if (k >= st.squadre.length) return giudizio(t, st);
    var el = t.el;
    var s = t.schermata({ icona: "🎤", titolo: st.squadre[k].nome + ", convincete il giudice", sotto: "1 minuto" });
    var wrap = el("div", { class: "as-timer" }); var fill = el("div", { class: "as-timer-fill" });
    wrap.appendChild(fill); s._contenuto.appendChild(wrap);
    var num = el("div", { style: "text-align:center;font-size:3rem;font-weight:800;margin:10px 0", text: "60" });
    s._contenuto.appendChild(num);
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Spiegate al giudice perché il vostro scenario, pur devastato, è il migliore da vivere." }));
    var restano = 60, fatto = false;
    var timer = setInterval(function () {
      restano -= 0.1; fill.style.width = Math.max(0, restano / 60) * 100 + "%"; num.textContent = Math.max(0, Math.ceil(restano));
      if (restano <= 0) finee();
    }, 100);
    function finee() { if (fatto) return; fatto = true; clearInterval(timer); arringa(t, st, k + 1); }
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: (k === 0 ? "Tocca all'altra squadra ▶" : "Al giudizio ▶"), onclick: finee }));
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
})();

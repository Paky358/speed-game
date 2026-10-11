/* =========================================================
   SPeeD GAME — GARA DI PESCA (online, ognuno dal suo telefono)
   Tutti pescano nello stesso laghetto per 2, 3 o 5 minuti: vince chi pesca più chili.
   Si pesca con lo schermo della pesca (js/pesca.js, modo gara): canna e lombrichi uguali
   per tutti e senza limite, niente album né cesto. Ogni pesce preso va all'host, che tiene
   la classifica e il tempo e manda a tutti la "foto" (vm). Fatto dal modello dei giochi online.
   ========================================================= */
(function () {
  "use strict";

  var ID = "garapesca";
  var MIN = 2, MAX = 8;

  function fmtN(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }   // 1.000
  function kg(n) { return window.SGPesca ? SGPesca.kg(n) : fmtN(n) + " kg"; }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function audio() { try { return (window.SG && SG.audioCtx && SG.audioCtx()) || null; } catch (e) { return null; } }
  function nomePesce(id) { var sp = window.SGPesca && SGPesca.pesce(id); return sp ? sp.nome : "pesce"; }
  function righe(players, mioId) {   // la classifica dal vivo (dal più chili al meno)
    return players.filter(function (p) { return !p.via; }).slice().sort(function (a, b) { return (b.kg || 0) - (a.kg || 0); })
      .map(function (p) { return { nome: p.nome, kg: p.kg || 0, tu: p.id === mioId }; });
  }

  // =========================================================
  //  HOST: tiene la gara vera (tempo e chili) e manda a tutti la "foto" (vm)
  // =========================================================
  function host(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    var H = { fase: "lobby", codice: "…", pronta: false, durata: imp.durata || 180, fineT: 0, classifica: null, ultimo: null, nUlt: 0, scr: null, to: null, tick: null,
      players: [{ id: "host", nome: nomeHost, omino: t.mioOmino(nomeHost), kg: 0, n: 0, best: null }] };
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function ferma() { clearTimeout(H.to); clearInterval(H.tick); H.to = H.tick = null; }

    // "⚙️ Regole" nella saletta: l'host cambia la durata quando vuole
    t.onRegole = function (im) { if (H.fase !== "lobby") return; H.durata = im.durata || 180; bd(); };

    var rete = SGNet.ospita(ID, {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      onAddio: function (id) {
        var p = pById(id); if (!p) return;
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); bd(); return; }
        p.via = true;   // a gara iniziata resta in classifica coi suoi chili
        if (H.fase === "gioco" && presenti().length < MIN) return fine();
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          var p0 = pById(id);
          if (!p0 && H.fase === "lobby" && H.players.length < MAX)
            H.players.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), omino: avatarValido(m.omino), kg: 0, n: 0, best: null });
          else if (p0 && p0.via && H.fase === "gioco") p0.via = false;   // è tornato (stesso id): riprende a pescare
          bd();   // anche se c'era già: rimanda la foto (serve a chi si ricollega)
          return;
        }
        if (H.fase !== "gioco" || !pById(id)) return;
        if (m.t === "preso") preso(id, m);
      }
    });
    // la "foto" per tutti: SEMPRE con gli id; il tempo come "quanto manca" (gli orologi dei telefoni non sono uguali)
    function vm() {
      return { fase: H.fase, codice: H.codice, pronta: H.pronta, durata: H.durata, resta: H.fase === "gioco" ? Math.max(0, H.fineT - Date.now()) : 0, classifica: H.classifica, ultimo: H.ultimo,
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, kg: Math.round((p.kg || 0) * 100) / 100, n: p.n || 0, best: p.best, via: !!p.via, omino: H.fase === "lobby" ? (p.omino || null) : undefined }; }) };
    }
    function bd() { var v = vm(); rete.invia({ t: "vm", vm: v }); disegna(t, v, cbHost); }

    // ----- la gara -----
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < MIN) return;
      H.players = presenti(); H.players.forEach(function (p) { p.kg = 0; p.n = 0; p.best = null; });
      H.fase = "gioco"; H.classifica = null; H.ultimo = null; H.fineT = Date.now() + H.durata * 1000 + 1500;
      H.tick = setInterval(bd, 5000);   // ogni tanto il tempo giusto a tutti
      H.to = setTimeout(fine, H.durata * 1000 + 1500);
      bd();
    }
    function preso(id, m) {   // un pesce preso da qualcuno (anche dall'host)
      var p = pById(id), w = +m.kg;
      if (!p || !(w > 0) || w > 400 || Date.now() > H.fineT + 1500) return;
      p.kg = (p.kg || 0) + w; p.n = (p.n || 0) + 1;
      if (!p.best || w > p.best.kg) p.best = { id: String(m.id || "").slice(0, 20), cm: Math.round(+m.cm || 0), kg: w };
      if ((+m.r || 1) >= 2) H.ultimo = { s: ++H.nUlt, chi: id, testo: p.nome + " ha preso: " + nomePesce(m.id) + " da " + Math.round(+m.cm || 0) + " cm!" + ((+m.r || 1) >= 3 ? " 🤩" : "") };
      bd();
    }
    function fine() {
      ferma();
      var ord = H.players.slice().sort(function (a, b) { return (b.kg || 0) - (a.kg || 0); });
      H.classifica = ord.map(function (p) { return { id: p.id, nome: p.nome, kg: Math.round((p.kg || 0) * 100) / 100, n: p.n || 0, best: p.best, pos: 1 + ord.filter(function (q) { return (q.kg || 0) > (p.kg || 0); }).length }; });
      H.fase = "fine"; bd();
      // torneo online e XP: i NOMI dei giocatori col loro posto (pari merito = stesso posto)
      if (t.risultato) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // "Nuova gara": stessa stanza, stessi amici, tutti tornano nella saletta (MAI chiudere e riaprire la stanza)
    function nuova() { ferma(); H.fase = "lobby"; H.classifica = null; H.players = presenti(); H.players.forEach(function (p) { p.kg = 0; p.n = 0; p.best = null; }); bd(); }

    var cbHost = { sonoHost: true, myId: "host", onComincia: comincia, onNuova: nuova,
      onPreso: function (f) { preso("host", f); },
      onEsci: function () {
        function via() { ferma(); rete.chiudi(); chiudiSchermo(); t.esci(); }
        if (H.fase === "gioco" && UI && UI._gara) return UI._gara.chiedi("Chiudere la gara per tutti?", "Gli amici escono dalla gara.", "🏠 Chiudi ed esci", via);   // un tocco sbagliato non chiude la gara a tutti
        via();
      } };
    bd();
  }

  // =========================================================
  //  OSPITE: pesca sul suo telefono, manda all'host i pesci presi
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, myId: null, nome: "", vm: null };
    var cb = { sonoHost: false, myId: null,
      onPreso: function (f) { if (S.rete) S.rete.invia({ t: "preso", id: f.id, cm: f.cm, kg: f.kg, r: f.r }); },
      onEsci: function () {
        function via() { if (S.rete) S.rete.chiudi(); chiudiSchermo(); t.esci(); }
        if (S.vm && S.vm.fase === "gioco" && UI && UI._gara) return UI._gara.chiedi("Uscire dalla gara?", "Gli altri continuano a pescare senza di te.", "🏠 Esci", via);
        via();
      } };
    if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ icona: "🎣", titolo: "Entra nella gara", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      attesa();
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome) }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;          // era per un altro telefono
          if (m.t === "vm") { S.vm = m.vm; disegna(t, m.vm, cb); }
        },
        onChiuso: function () { chiudiSchermo(); errore(t, "La gara è stata chiusa dall'host."); },
        onErrore: function () { chiudiSchermo(); errore(t, "Problema di collegamento. Riprova."); }
      });
    }
    function attesa() {
      var s = t.schermata({ icona: "🎣", titolo: "Entro nella gara…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
    }
  }

  // =========================================================
  //  DISEGNO (uguale per host e ospiti): saletta, il laghetto della gara, la classifica finale
  // =========================================================
  var UI = null, finale0 = null;   // lo schermo della pesca si crea UNA volta e poi si aggiorna (tempo, classifica, avvisi)
  function chiudiSchermo() { if (UI && UI._chiudi) UI._chiudi(); UI = null; clearTimeout(finale0); }
  function disegna(t, vm, cb) {
    if (vm.fase === "lobby") { chiudiSchermo(); return lobby(t, vm, cb); }
    var io = null; vm.players.forEach(function (p) { if (p.id === cb.myId) io = p; });
    if (vm.fase === "fine") {
      if (UI && UI._gara) { UI._gara.ferma("⏱️ Tempo scaduto!"); UI._gara.stato({ righe: righe(vm.players, cb.myId) }); clearTimeout(finale0); finale0 = setTimeout(function () { chiudiSchermo(); finale(t, vm, cb); }, 1800); }   // si vede ancora un attimo il lago
      else if (!finale0) finale(t, vm, cb);
      return;
    }
    if (!io) return attesaFine(t);   // arrivato a gara iniziata: aspetta la prossima
    if (!UI) {
      if (!window.SGPesca) return errore(t, "Manca il laghetto: aggiorna l'app.");
      UI = SGPesca.crea({ omino: t.mioOmino(io.nome), audio: audio, indietro: cb.onEsci, gara: { onPreso: cb.onPreso } });
      t.mostra(UI); UI._monta();
    }
    UI._gara.stato({ fineAt: Date.now() + (vm.resta || 0), righe: righe(vm.players, cb.myId), avviso: vm.ultimo && vm.ultimo.chi !== cb.myId ? vm.ultimo : null });
  }
  function lobby(t, vm, cb) {
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN,
      vuoti: Math.max(0, MIN - vm.players.length),   // solo i posti che mancano per cominciare
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: [t.el("p", { class: "modulo-nota", text: "🎣 Gara di " + Math.round(vm.durata / 60) + " minuti nel laghetto: vince chi pesca più chili. Canna e lombrichi uguali per tutti." })],
      attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  function attesaFine(t) {
    if (UI) return;
    var s = t.schermata({ icona: "🎣", titolo: "Gara in corso", sotto: "Aspetta la prossima" });
    s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "La gara è già cominciata: quando l'host ne fa un'altra, entri da solo nella saletta." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: t.esci }));
    t.mostra(s);
  }
  function finale(t, vm, cb) {
    finale0 = null;
    var s = t.schermata({ icona: "🏆", titolo: "Classifica della gara" });
    var ol = t.el("ol", { class: "classifica" }), med = ["🥇", "🥈", "🥉"];
    (vm.classifica || []).forEach(function (r) {
      var sotto = r.n ? r.n + (r.n === 1 ? " pesce" : " pesci") + (r.best ? " · il più grosso: " + nomePesce(r.best.id) + " " + r.best.cm + " cm" : "") : "nessun pesce";
      ol.appendChild(t.el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        t.el("span", { class: "pos", text: med[r.pos - 1] || (r.pos + "°") }),
        t.el("span", { class: "nome" }, [t.el("span", { text: r.id === cb.myId ? r.nome + " (tu)" : r.nome }), t.el("small", { style: "display:block;font-size:.72rem;opacity:.8", text: sotto })]),
        t.el("span", { class: "punti", text: kg(r.kg) }) ]));
    });
    s._contenuto.appendChild(ol);
    if (cb.sonoHost) s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Nuova gara (stessi amici)", onclick: cb.onNuova }));
    else s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center", text: "Se l'host fa un'altra gara, torni da solo nella saletta." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    t.mostra(s);
  }
  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "La gara di pesca si gioca online: funziona quando l'app è aperta dal sito pubblicato." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  SG.registra({
    id: ID, nome: "Gara di pesca", icona: "🎣",
    descrizione: "Tutti nello stesso laghetto, ognuno dal suo telefono: in pochi minuti vince chi pesca più chili!",
    giocatoriMin: MIN, giocatoriMax: MAX, difficolta: 1,
    modi: [], soloOnline: true,
    regole: [
      "Ognuno pesca dal suo telefono nello <b>stesso laghetto</b>, per <b>2, 3 o 5 minuti</b> (lo sceglie l'host).",
      "Si pesca come al laghetto: tieni premuto per <b>lanciare</b>, tocca quando il galleggiante <b>va giù</b>, poi tira e molla il filo nella <b>lotta</b>.",
      "Canna e lombrichi sono <b>uguali per tutti</b> e senza limite. Ogni pesce preso vale il suo <b>peso</b>: i pesci grossi del largo valgono tantissimo!",
      "In alto vedi il tempo e la classifica dal vivo. Allo scadere vince chi ha pescato <b>più chili</b>."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      if (dove.durata == null) dove.durata = 180;
      // le scelte con bottoni .modo-chip: così l'host le ritrova in "⚙️ Regole" nella saletta
      box.appendChild(el("div", { class: "etichetta", text: "Quanto dura la gara" }));
      var g = el("div", { class: "modo-griglia", style: "display:grid;grid-template-columns:repeat(3,1fr)" });
      [[120, "2 minuti"], [180, "3 minuti"], [300, "5 minuti"]].forEach(function (x) {
        var b = el("button", { class: "modo-chip" + (dove.durata === x[0] ? " attiva" : ""), style: "justify-content:center", onclick: function () {
          dove.durata = x[0]; [].forEach.call(g.children, function (c) { c.classList.remove("attiva"); }); b.classList.add("attiva");
        } }, [el("div", { class: "mt", text: x[1] })]);
        g.appendChild(b);
      });
      box.appendChild(g);
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito
      return host(t);
    }
  });
})();

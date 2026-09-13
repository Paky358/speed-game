/* =========================================================
   GIOCO — "La Patata Bollente"  (ispirato a "Bomba a Tempo")
   Esce una categoria (la più votata fra 3). Ognuno ha un suo
   tempo (parte da 15s) che scende SOLO mentre tiene la bomba:
   dici a voce una parola della categoria e passi la bomba a chi
   vuoi, toccando il suo pallino nel cerchio. Non puoi ripassare
   alla stessa persona finché non hai fatto il giro. Se chi te
   l'ha data non ha detto la parola, usi "Rimanda indietro" e lui
   riprende col tempo che aveva. A chi finisce il tempo, la bomba
   esplode: eliminato. Si va avanti finché ne resta uno.
   Un telefono solo (si passa di mano) oppure ognuno dal suo
   (online): i nomi in cerchio, ognuno lancia la bomba dal suo
   telefono. Ogni round il tempo di partenza cala un po'.
   ========================================================= */
(function () {
  "use strict";

  var COLORI = ["#ff6b6b", "#4dabf7", "#51cf66", "#ffd43b", "#cc5de8", "#ff922b", "#20c997", "#f783ac", "#a9e34b", "#66d9e8"];
  // Il timer riparte a ogni "ricezione". Il tetto parte da 15s e cala di 2s
  // ogni 4 passaggi, fino a un minimo di 5s: 15, 13, 11, 9, 7, 5.
  function capMs(passaggi) { return Math.max(5000, 15000 - 2000 * Math.floor(passaggi / 4)); }

  function mischia(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function pescaCategorie(n) { var pool = (window.SG_PATATA || []).slice(); return mischia(pool).slice(0, n); }

  SG.registra({
    id: "patata",
    nome: "La Patata Bollente",
    icona: "💣",
    descrizione: "Esce una categoria: dici una parola a voce e lanci la bomba a chi vuoi. A chi scade il tempo, esplode! Si va avanti finché ne resta uno.",
    giocatoriMin: 2,
    giocatoriMax: 10,
    difficolta: 2,
    regole: [
      "Si vota fra <b>3 categorie</b>: si gioca la più votata.",
      "Ognuno ha un suo tempo (parte da <b>15 secondi</b>) che scende <b>solo mentre tiene la bomba</b>. Dici a voce una parola della categoria e <b>passi la bomba</b> toccando un altro giocatore nel cerchio.",
      "Non puoi ripassare alla <b>stessa persona</b> finché non hai fatto il giro. Se chi te l'ha data <b>non ha detto la parola</b>, usa <b>“Rimanda indietro”</b>: riprende lui, col tempo che aveva.",
      "A chi <b>finisce il tempo</b> la bomba esplode: eliminato. Ogni round il tempo di partenza cala. Vince l'<b>ultimo rimasto</b>."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = "telefono";
      if (aiuti.torneo) return;
      box.appendChild(el("div", { class: "etichetta", text: "Come si gioca" }));
      var nota = el("div", { class: "link-avviso", hidden: "hidden" });
      var bT, bO;
      function scegliModo(m) {
        dove.modo = m;
        bT.className = "modo-chip" + (m === "telefono" ? " attiva" : "");
        bO.className = "modo-chip" + (m === "online" ? " attiva" : "");
        nota.hidden = (m !== "online");
        nota.textContent = (window.SGNet && SGNet.disponibile())
          ? "Apri una stanza e manda il codice: ognuno gioca dal suo telefono e lancia la bomba a chi vuole, toccando il cerchio."
          : "Qui il collegamento non è disponibile. Funziona quando il gioco è aperto dal sito pubblicato online.";
      }
      bT = el("button", { class: "modo-chip attiva", onclick: function () { scegliModo("telefono"); } }, [
        el("span", { class: "mi", text: "📱" }), el("div", {}, [el("div", { class: "mt", text: "Un telefono solo" }), el("div", { class: "ms", text: "Si passa di mano" })])]);
      bO = el("button", { class: "modo-chip", onclick: function () { scegliModo("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Ognuno dal suo" }), el("div", { class: "ms", text: "La bomba nel cerchio" })])]);
      box.appendChild(el("div", { class: "modo-griglia" }, [bT, bO]));
      box.appendChild(nota);
    },

    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return ospitePatata(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostPatata(t);
      return singolaPatata(t);
    }
  });

  // =========================================================
  //  MOTORE condiviso (stato + timer + regole). onCambio() viene
  //  chiamato a ogni cambiamento (per ridisegnare / trasmettere).
  // =========================================================
  function creaMotore(giocatori, onCambio, extraCats) {
    var deck = (window.SG_PATATA || []);
    extraCats = extraCats || [];
    // se l'host ha scritto categorie sue, quelle si giocano direttamente (non finiscono
    // nel mazzo): riempiamo con categorie casuali solo se sono meno di quante ne servono.
    function pesca(n) {
      var out = mischia(extraCats).slice(0, n);
      if (out.length < n) out = out.concat(mischia(deck.filter(function (c) { return out.indexOf(c) < 0; })).slice(0, n - out.length));
      return out;
    }
    var st = {
      fase: "voto", cats: pesca(3), categoria: null,
      players: giocatori.map(function (g) { return { id: g.id, nome: g.nome, colore: g.colore, eliminato: false, voto: null }; }),
      holder: null, prev: null, ultimo: null, giro: [], round: 0, ts: 0, boom: null, vincitore: null,
      remaining: 0, cap: 15000, passaggi: 0, remPrima: null, giroPrima: [], eliminati: []
    };
    function pById(id) { for (var i = 0; i < st.players.length; i++) if (st.players[i].id === id) return st.players[i]; return null; }
    function vivi() { return st.players.filter(function (p) { return !p.eliminato; }); }
    function holderObj() { return pById(st.holder); }

    function aggiorna() {
      if (st.fase !== "gioco") return;
      var now = Date.now(), dt = now - st.ts; st.ts = now;
      if (!holderObj()) return;
      st.remaining -= dt;
      if (st.remaining <= 0) { st.remaining = 0; esplode(); }
    }
    var loop = setInterval(aggiorna, 120);

    function avviaGioco(cat) {
      st.categoria = cat; st.round = 0; st.boom = null; st.vincitore = null; st.passaggi = 0; st.remPrima = null; st.eliminati = [];
      st.players.forEach(function (p) { p.eliminato = false; });
      var vv = vivi(); st.holder = vv[Math.floor(Math.random() * vv.length)].id;
      st.prev = null; st.ultimo = null; st.giro = [st.holder]; st.cap = capMs(0); st.remaining = st.cap;
      st.fase = "gioco"; st.ts = Date.now(); onCambio();
    }
    function esplode() {
      var h = holderObj(); if (!h) return;
      h.eliminato = true; st.eliminati.push(h.id); st.boom = { id: h.id, nome: h.nome }; st.fase = "esplosione"; onCambio();
      setTimeout(function () {
        st.boom = null; var v = vivi();
        if (v.length <= 1) { st.fase = "fine"; st.vincitore = v[0] ? { nome: v[0].nome, colore: v[0].colore } : null; onCambio(); return; }
        st.round++;
        // togli gli eliminati dal giro, poi dai la bomba a caso a chi NON è ancora
        // stato scelto in questo giro (così si completa il giro); se hanno già avuto
        // tutti, si apre un giro nuovo.
        st.giro = st.giro.filter(function (id) { var p = pById(id); return p && !p.eliminato; });
        var cand = v.filter(function (p) { return st.giro.indexOf(p.id) < 0; });
        if (!cand.length) { st.giro = []; cand = v; }
        var nh = cand[Math.floor(Math.random() * cand.length)];
        st.holder = nh.id; st.giro.push(nh.id);
        if (st.giro.length >= v.length) st.giro = [nh.id];
        st.prev = null; st.ultimo = null;
        st.cap = capMs(st.passaggi); st.remaining = st.cap; st.remPrima = null;
        st.fase = "gioco"; st.ts = Date.now(); onCambio();
      }, 2600);
    }

    return {
      st: st, vivi: vivi,
      vota: function (id, idx) { var p = pById(id); if (p && st.fase === "voto") { p.voto = idx; onCambio(); } },
      via: function () {
        if (st.fase !== "voto") return;
        var conta = st.cats.map(function () { return 0; });
        st.players.forEach(function (p) { if (p.voto != null && conta[p.voto] != null) conta[p.voto]++; });
        var max = Math.max.apply(null, conta), top = [];
        conta.forEach(function (c, i) { if (c === max) top.push(i); });
        avviaGioco(st.cats[top[Math.floor(Math.random() * top.length)]]);
      },
      viaCon: function (idx) { if (st.fase === "voto") avviaGioco(st.cats[idx]); },
      passa: function (fromId, targetId) {
        aggiorna(); if (st.fase !== "gioco" || fromId !== st.holder) return;
        var tgt = pById(targetId); if (!tgt || tgt.eliminato || targetId === st.holder) return;
        if (st.giro.indexOf(targetId) >= 0) return;  // NON puoi ridarla a chi ha già avuto la bomba: prima finisci il giro
        st.remPrima = st.remaining;             // per l'eventuale "rimanda indietro"
        st.passaggi++; st.cap = capMs(st.passaggi); st.remaining = st.cap;  // riceve -> timer riparte
        st.ultimo = st.holder;                  // tenuto solo come info (il ritorno si fa col pulsante "Rimanda indietro")
        st.giroPrima = st.giro.slice();         // per ripristinarlo con "rimanda indietro"
        st.prev = st.holder; st.holder = targetId; st.giro.push(targetId);
        if (st.giro.length >= vivi().length) st.giro = [targetId];
        st.ts = Date.now(); onCambio();
      },
      indietro: function (fromId) {
        aggiorna(); if (st.fase !== "gioco" || fromId !== st.holder || !st.prev) return;
        var p = pById(st.prev); if (!p || p.eliminato) return;
        // il passaggio non valeva: torna a chi l'aveva, col tempo che aveva (NIENTE reset)
        st.passaggi = Math.max(0, st.passaggi - 1); st.cap = capMs(st.passaggi);
        if (st.remPrima != null) st.remaining = st.remPrima;
        st.ultimo = st.holder;                  // chi ha rimandato indietro: gli si può ridare subito
        // NON si resetta il giro: si ripristina com'era prima del passaggio annullato
        var back = st.prev; st.prev = null; st.holder = back; st.giro = st.giroPrima ? st.giroPrima.slice() : st.giro; st.ts = Date.now(); onCambio();
      },
      rimuovi: function (id) {
        var p = pById(id); if (!p) return; p.eliminato = true; if (st.eliminati.indexOf(id) < 0) st.eliminati.push(id);
        if (st.fase === "gioco" || st.fase === "esplosione") {
          var v = vivi();
          if (v.length <= 1) { st.fase = "fine"; st.vincitore = v[0] ? { nome: v[0].nome, colore: v[0].colore } : null; }
          else if (st.holder === id) { st.holder = v[Math.floor(Math.random() * v.length)].id; st.prev = null; st.giro = [st.holder]; st.cap = capMs(st.passaggi); st.remaining = st.cap; st.ts = Date.now(); }
        }
        onCambio();
      },
      nuova: function () { st.players.forEach(function (p) { p.eliminato = false; p.voto = null; }); st.eliminati = []; st.cats = pesca(3); st.fase = "voto"; st.categoria = null; st.boom = null; st.vincitore = null; onCambio(); },
      remaining: function () { return Math.max(0, st.remaining); },
      distruggi: function () { clearInterval(loop); },
      vm: function () {
        var classifica = null;
        if (st.fase === "fine") {
          // dal vincitore (ultimo rimasto) giù fino al primo esploso
          var ord = vivi().concat(st.eliminati.slice().reverse().map(function (id) { return pById(id); }).filter(Boolean));
          classifica = ord.map(function (p) { return { nome: p.nome, colore: p.colore }; });
        }
        return {
          fase: st.fase, categoria: st.categoria, cats: st.cats, round: st.round,
          players: st.players.map(function (p) { return { id: p.id, nome: p.nome, colore: p.colore, eliminato: p.eliminato, voto: p.voto }; }),
          holder: st.holder, prev: st.prev, ultimo: st.ultimo, giro: st.giro.slice(),
          remaining: Math.max(0, Math.round(st.remaining)), cap: st.cap, boom: st.boom, vincitore: st.vincitore, classifica: classifica
        };
      }
    };
  }

  // =========================================================
  //  SUONO — ticchettio che accelera + boom
  // =========================================================
  function acP() { try { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; acP._c = acP._c || new AC(); if (acP._c.state === "suspended") acP._c.resume(); return acP._c; } catch (e) { return null; } }
  function tickP(freq) {
    var ctx = acP(); if (!ctx) return;
    try { var o = ctx.createOscillator(), g = ctx.createGain(), n = ctx.currentTime;
      o.type = "square"; o.frequency.setValueAtTime(freq, n);
      g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(0.14, n + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.06);
      o.connect(g); g.connect(ctx.destination); o.start(n); o.stop(n + 0.07); } catch (e) {}
  }
  function boomP() {
    var ctx = acP(); if (!ctx) return;
    try {
      var n = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(180, n); o.frequency.exponentialRampToValueAtTime(40, n + 0.5);
      g.gain.setValueAtTime(0.35, n); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.6);
      o.connect(g); g.connect(ctx.destination); o.start(n); o.stop(n + 0.62);
    } catch (e) {}
  }

  var dispTimer = null, tickTimer = null, ultimoBoom = null;
  function stopTimers() { if (dispTimer) clearInterval(dispTimer); if (tickTimer) clearTimeout(tickTimer); dispTimer = tickTimer = null; }
  function assicuraStileP() {
    if (document.getElementById("sg-patata-css")) return;
    var s = document.createElement("style"); s.id = "sg-patata-css";
    s.textContent = "@keyframes sgBomba{0%,100%{box-shadow:0 0 0 3px rgba(255,80,80,.5),0 0 16px 6px rgba(255,80,80,.65)}50%{box-shadow:0 0 0 4px rgba(255,120,60,.9),0 0 26px 12px rgba(255,120,60,.95)}}.sg-bomba{animation:sgBomba .5s ease-in-out infinite}@keyframes sgScoppio{0%{transform:scale(.6);opacity:0}40%{transform:scale(1.25);opacity:1}100%{transform:scale(1);opacity:1}}.sg-scoppio{animation:sgScoppio .5s ease-out}@keyframes sgTocca{0%,100%{box-shadow:0 0 0 2px rgba(130,220,170,.55)}50%{box-shadow:0 0 0 5px rgba(130,220,170,.95),0 0 12px 3px rgba(130,220,170,.55)}}.sg-tocca{animation:sgTocca 1.1s ease-in-out infinite;cursor:pointer}";
    document.head.appendChild(s);
  }

  // =========================================================
  //  UN TELEFONO SOLO
  // =========================================================
  function singolaPatata(t) {
    var giocatori = t.giocatori.map(function (n, i) { return { id: "p" + i, nome: n, colore: COLORI[i % COLORI.length] }; });
    var motore = creaMotore(giocatori, function () { disegna(); });
    var cb = {
      locale: true, sonoHost: true, myId: null,
      getRemaining: function () { return motore.remaining(); },
      onScegliCat: function (idx) { motore.viaCon(idx); },
      onPassa: function (id) { motore.passa(motore.st.holder, id); },
      onIndietro: function () { motore.indietro(motore.st.holder); },
      onNuova: function () { motore.nuova(); },
      onEsci: function () { stopTimers(); motore.distruggi(); t.esci(); }
    };
    function disegna() { disegnaPatataVM(t, motore.vm(), cb); }
    disegna();
  }

  // =========================================================
  //  ONLINE — ospita / ospite
  // =========================================================
  function hostPatata(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaReteP(t);
    var H = { fase: "lobby", codice: "…", pronta: false, players: [{ id: "host", nome: (t.giocatori && t.giocatori[0]) || "Host", colore: COLORI[0] }], motore: null, customCats: [] };
    var rete = SGNet.ospita("patata", {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      onAddio: function (id) {
        if (H.fase === "lobby") { H.players = H.players.filter(function (p) { return p.id !== id; }); H.players.forEach(function (p, i) { p.colore = COLORI[i % COLORI.length]; }); bd(); }
        else if (H.motore) H.motore.rimuovi(id);
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") { if (H.fase === "lobby" && !H.players.some(function (p) { return p.id === id; }) && H.players.length < 10) H.players.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), colore: COLORI[H.players.length % COLORI.length] }); bd(); }
        else if (!H.motore) return;
        else if (m.t === "vota") H.motore.vota(id, m.idx);
        else if (m.t === "passa") H.motore.passa(id, m.target);
        else if (m.t === "indietro") H.motore.indietro(id);
      },
      onErrore: function () { senzaReteP(t); }
    });
    function vmHost() {
      if (H.fase === "lobby") return { fase: "lobby", codice: H.codice, pronta: H.pronta, players: H.players.map(function (p) { return { id: p.id, nome: p.nome, colore: p.colore }; }), customCats: H.customCats.slice() };
      var vm = H.motore.vm(); vm.codice = H.codice; vm.pronta = H.pronta; return vm;
    }
    function bd() { rete.invia({ t: "vm", vm: vmHost() }); disegna(); }
    var cb = {
      locale: false, sonoHost: true, myId: "host",
      getRemaining: function () { return H.motore ? H.motore.remaining() : 0; },
      onAggiungiCat: function (txt) { txt = String(txt || "").trim().slice(0, 40); if (H.fase === "lobby" && txt && H.customCats.indexOf(txt) < 0) { H.customCats.push(txt); bd(); } },
      onTogliCat: function (i) { if (H.fase === "lobby") { H.customCats.splice(i, 1); bd(); } },
      onContinua: function () { if (H.fase === "lobby" && H.players.length >= 2) { H.fase = "gioco"; H.motore = creaMotore(H.players, function () { bd(); }, H.customCats); bd(); } },
      onVota: function (idx) { H.motore && H.motore.vota("host", idx); },
      onVia: function () { H.motore && H.motore.via(); },
      onPassa: function (id) { H.motore && H.motore.passa("host", id); },
      onIndietro: function () { H.motore && H.motore.indietro("host"); },
      onNuova: function () { H.motore && H.motore.nuova(); },
      onEsci: function () { stopTimers(); if (H.motore) H.motore.distruggi(); rete.chiudi(); t.esci(); }
    };
    function disegna() { disegnaPatataVM(t, vmHost(), cb); }
    disegna();
  }

  function ospitePatata(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaReteP(t);
    var el = t.el, S = { myId: null, vm: null, vmTs: 0, rete: null, nome: "", msg: null };
    var cb = {
      locale: false, sonoHost: false, myId: null,
      getRemaining: function () { if (!S.vm) return 0; return Math.max(0, S.vm.remaining - (Date.now() - S.vmTs)); },
      onVota: function (idx) { S.rete && S.rete.invia({ t: "vota", idx: idx }); },
      onPassa: function (id) { S.rete && S.rete.invia({ t: "passa", target: id }); },
      onIndietro: function () { S.rete && S.rete.invia({ t: "indietro" }); },
      onEsci: function () { stopTimers(); if (S.rete) S.rete.chiudi(); t.esci(); }
    };
    function disegna() { if (S.vm) { cb.myId = S.myId; disegnaPatataVM(t, S.vm, cb); } }
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "💣", titolo: "Entra nella partita", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      S.msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(S.msg);
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        S.nome = (input.value || "Amico").trim() || "Amico"; S.msg.textContent = "Collegamento in corso…"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome });
          setTimeout(function () { if (!S.vm && S.msg) S.msg.textContent = "Non trovo la partita. Controlla il codice, o l'host non ha ancora aperto la stanza…"; }, 8000); },
        onMsg: function (m) { if (m && m.t === "vm") { S.vm = m.vm; S.vmTs = Date.now(); disegna(); } },
        onChiuso: function () { stopTimers(); erroreP(t, "Collegamento perso. L'host potrebbe aver chiuso la partita."); },
        onErrore: function () { stopTimers(); erroreP(t, "Problema di collegamento. Controlla la connessione e riprova."); }
      });
    }
  }

  function erroreP(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaReteP(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità \"ognuno dal suo telefono\" funziona quando il gioco è aperto dal sito pubblicato online. Da un file locale non è disponibile: intanto usa \"Un telefono solo\"." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // =========================================================
  //  DISEGNO condiviso
  // =========================================================
  function disegnaPatataVM(t, vm, cb) {
    assicuraStileP(); stopTimers();
    var el = t.el, myId = cb.myId;
    var puoi = cb.locale || (vm.holder && vm.holder === myId);

    // ---- LOBBY (solo online) ----
    if (vm.fase === "lobby") {
      var s = t.schermata({ icona: "💣", titolo: "La Patata Bollente · Lobby", sotto: "Ognuno dal suo telefono",
        indietro: function () { if (window.confirm("Uscire?")) cb.onEsci(); } });
      if (cb.sonoHost) {
        s._contenuto.appendChild(el("div", { class: "etichetta", text: "Codice della stanza" }));
        s._contenuto.appendChild(el("div", { class: "codice-stanza", text: (vm.codice || "…").toUpperCase() }));
        if (vm.codice && vm.codice !== "…") {
          var link = SG.creaLink({ gioco: "patata", stanza: vm.codice });
          var campo = el("input", { class: "link-campo", type: "text", readonly: "readonly", value: link });
          s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", html: "🔗 Copia il link da mandare",
            onclick: function () { campo.focus(); campo.select(); try { navigator.clipboard.writeText(link); } catch (e) {} } }));
          s._contenuto.appendChild(campo);
        }
        s._contenuto.appendChild(el("div", { style: "margin:8px 0 2px;font-size:.9rem;font-weight:700;color:" + (vm.pronta ? "#69db7c" : "#ffd43b"),
          text: vm.pronta ? "🟢 Stanza pronta — manda il codice agli amici" : "🟡 Sto aprendo la stanza… (attendi il verde)" }));
      }
      s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:12px", text: "Chi c'è (" + vm.players.length + ")" }));
      vm.players.forEach(function (p) {
        s._contenuto.appendChild(el("div", { style: "display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;margin-bottom:6px;background:rgba(255,255,255,.06)" }, [
          el("span", { style: "width:16px;height:16px;border-radius:50%;background:" + p.colore }),
          el("span", { style: "flex:1", text: p.nome + (p.id === myId ? " (tu)" : "") })
        ]));
      });
      if (cb.sonoHost) {
        s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:12px", text: "Categorie tue (facoltative)" }));
        var inpCat = el("input", { class: "link-campo", type: "text", maxlength: "40", placeholder: "Scrivi una categoria…" });
        function aggiungiCat() { if (inpCat.value.trim()) { cb.onAggiungiCat(inpCat.value); inpCat.value = ""; } }
        inpCat.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); aggiungiCat(); } });
        s._contenuto.appendChild(inpCat);
        s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", style: "margin-top:6px", text: "＋ Aggiungi categoria", onclick: aggiungiCat }));
        (vm.customCats || []).forEach(function (c, i) {
          s._contenuto.appendChild(el("div", { style: "display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;margin-top:6px;background:rgba(255,255,255,.06)" }, [
            el("span", { style: "flex:1", text: "📝 " + c }),
            el("button", { class: "togli", text: "×", onclick: function () { cb.onTogliCat(i); } })
          ]));
        });
        if ((vm.customCats || []).length) s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Si giocheranno queste (se sono meno di 3, si completa con categorie a caso)." }));
      }
      if (cb.sonoHost) {
        var ok = vm.players.length >= 2;
        var b = el("button", { class: "btn btn-primario", text: "Continua ▶", onclick: cb.onContinua });
        if (!ok) b.setAttribute("disabled", "disabled");
        s._piede.appendChild(b);
        if (!ok) s._piede.appendChild(el("p", { class: "modulo-nota", text: "Servono almeno 2 giocatori (aspetta che entrino)." }));
      } else s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa che l'host cominci…" }));
      return t.mostra(s);
    }

    // ---- VOTO CATEGORIA ----
    if (vm.fase === "voto") {
      var s2 = t.schermata({ icona: "🗳️", titolo: "Che categoria?", sotto: cb.locale ? "Toccatene una per iniziare" : "Vota: si gioca la più votata",
        indietro: function () { if (window.confirm("Uscire?")) cb.onEsci(); } });
      var mio = null; vm.players.forEach(function (p) { if (p.id === myId) mio = p; });
      vm.cats.forEach(function (cat, i) {
        var voti = vm.players.filter(function (p) { return p.voto === i; }).length;
        var scelto = mio && mio.voto === i;
        var card = el("button", { style: "display:block;width:100%;text-align:left;margin-bottom:10px;padding:16px 18px;border-radius:14px;border:2px solid " + (scelto ? "#ffd43b" : "transparent") + ";cursor:pointer;color:#fff;background:rgba(255,255,255,.07);font-size:1.15rem;font-weight:700",
          onclick: function () { if (cb.locale) cb.onScegliCat(i); else cb.onVota(i); } }, [
          el("div", { text: cat }),
          cb.locale ? null : el("div", { style: "font-size:.85rem;font-weight:600;opacity:.8;margin-top:4px", text: voti === 1 ? "1 voto" : voti + " voti" })
        ]);
        s2._contenuto.appendChild(card);
      });
      if (!cb.locale) {
        if (cb.sonoHost) s2._piede.appendChild(el("button", { class: "btn btn-primario", text: "Via! ▶", onclick: cb.onVia }));
        else s2._piede.appendChild(el("p", { class: "modulo-nota", text: "Vota pure; parte quando l'host dà il via." }));
      }
      return t.mostra(s2);
    }

    // ---- FINE ----
    if (vm.fase === "fine") {
      var sf = t.schermata({ icona: "🏆", titolo: "Vince " + (vm.vincitore ? vm.vincitore.nome : "") + "!", sotto: "La Patata Bollente" });
      sf._contenuto.appendChild(el("div", { style: "text-align:center;font-size:3rem;margin:6px 0 2px" , text: "🏆" }));
      var cl = vm.classifica || [];
      var ol = el("ol", { class: "classifica" });
      cl.forEach(function (p, i) {
        var etichetta = i === 0 ? "🏆 vincitore" : (i === cl.length - 1 ? "💥 primo esploso" : "");
        ol.appendChild(el("li", { class: i === 0 ? "vincitore" : "" }, [
          el("span", { class: "pos", text: (i + 1) + "°" }),
          el("span", { class: "nome" }, [
            el("span", { style: "display:inline-block;width:12px;height:12px;border-radius:50%;vertical-align:middle;margin-right:6px;background:" + p.colore }),
            el("span", { text: p.nome })
          ]),
          el("span", { class: "punti", style: "font-size:.8rem;opacity:.8", text: etichetta })
        ]));
      });
      sf._contenuto.appendChild(ol);
      if (cb.sonoHost) {
        sf._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Nuova partita", onclick: cb.onNuova }));
        sf._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Chiudi", onclick: cb.onEsci }));
      } else sf._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa dell'host per un'altra partita…" }));
      return t.mostra(sf);
    }

    // ---- GIOCO / ESPLOSIONE ----
    var esplo = (vm.fase === "esplosione");
    var holderP = null; vm.players.forEach(function (p) { if (p.id === vm.holder) holderP = p; });
    var s3 = t.schermata({ icona: "💣", titolo: vm.categoria || "Patata Bollente", sotto: esplo ? "💥 BOOM!" : "Di' una parola e passa la bomba",
      indietro: function () { if (window.confirm("Uscire dalla partita?")) cb.onEsci(); } });

    // messaggio in alto
    if (esplo && vm.boom) {
      s3._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;font-size:1.1rem;color:#ff8787;font-weight:700", text: "💥 " + vm.boom.nome + " è ESPLOSO! Eliminato." }));
    } else if (puoi) {
      s3._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", html: cb.locale ? ("Ha la bomba <b>" + (holderP ? holderP.nome : "") + "</b>: di' la parola, poi <b>tocca la testa</b> di chi la riceve 👇") : "Tocca a TE! Di' la parola a voce, poi <b>tocca la testa</b> (il pallino) di chi la riceve 👇" }));
    } else {
      s3._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: "Ha la bomba: " + (holderP ? holderP.nome : "") }));
    }
    if (!esplo) s3._contenuto.appendChild(el("p", { style: "text-align:center;margin:0 0 4px;font-size:.8rem;opacity:.7", text: "Chi riceve fa ripartire il timer · ora riparte da " + (vm.cap / 1000) + "s" }));

    // cerchio
    var BOX = 300, R = 116, cx = BOX / 2, cy = BOX / 2;
    var cerchio = el("div", { style: "position:relative;width:" + BOX + "px;max-width:92vw;aspect-ratio:1/1;margin:6px auto 2px" });
    var n = vm.players.length;
    var centro = el("div", { style: "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;z-index:1" }, [
      el("div", { style: "font-size:2.4rem" , text: "💣" }),
      el("div", { class: "sg-count", style: "font-size:1.8rem;font-weight:800;line-height:1", text: (vm.remaining / 1000).toFixed(1) })
    ]);
    cerchio.appendChild(centro);
    vm.players.forEach(function (p, i) {
      var ang = (i / n) * 2 * Math.PI - Math.PI / 2;
      var x = 50 + (R / cx) * 50 * Math.cos(ang), y = 50 + (R / cy) * 50 * Math.sin(ang);
      var isHolder = (p.id === vm.holder);
      var passabile = puoi && !esplo && !p.eliminato && !isHolder && vm.giro.indexOf(p.id) < 0;
      var nodo = el(passabile ? "button" : "div", { style: "position:absolute;left:" + x + "%;top:" + y + "%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:3px;width:72px;background:none;border:0;padding:4px 0;" + (passabile ? "cursor:pointer" : "cursor:default"),
        onclick: passabile ? function () { cb.onPassa(p.id); } : null });
      nodo.appendChild(el("div", { style: "font-size:.72rem;font-weight:700;max-width:72px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:" + (p.eliminato ? "rgba(255,255,255,.35)" : p.colore) + (isHolder ? ";text-shadow:0 0 6px rgba(255,120,60,.9)" : ""), text: (p.id === myId ? "▸ " : "") + p.nome }));
      var dotCls = (isHolder && !esplo) ? "sg-bomba" : (passabile ? "sg-tocca" : ((esplo && vm.boom && vm.boom.id === p.id) ? "sg-scoppio" : ""));
      var lato = passabile ? 40 : 34;
      var dot = el("div", { class: dotCls, style: "width:" + lato + "px;height:" + lato + "px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem;background:" + p.colore + ";border:2px solid rgba(255,255,255,.9);" + (p.eliminato ? "filter:grayscale(1);opacity:.4" : ""),
        text: p.eliminato ? "💀" : (esplo && vm.boom && vm.boom.id === p.id ? "💥" : (isHolder ? "💣" : "")) });
      nodo.appendChild(dot);
      if (p.eliminato) nodo.appendChild(el("div", { style: "font-size:.62rem;font-weight:700;color:rgba(255,255,255,.3)", text: "out" }));
      cerchio.appendChild(nodo);
    });
    s3._contenuto.appendChild(cerchio);

    // pulsante "rimanda indietro" (se l'altro non ha detto la parola giusta)
    if (puoi && !esplo && vm.prev) {
      var prevP = null; vm.players.forEach(function (p) { if (p.id === vm.prev) prevP = p; });
      if (prevP && !prevP.eliminato) s3._piede.appendChild(el("button", { style: "width:100%;padding:12px;border-radius:12px;border:2px solid #ffa94d;background:rgba(255,169,77,.15);color:#ffd8a8;font-weight:700;cursor:pointer", html: "🆘 SOLO se " + prevP.nome + " non ha detto la parola: <b>rimandagliela</b>", onclick: cb.onIndietro }));
    }

    t.mostra(s3);

    // countdown + suono, solo in gioco
    var num = centro.querySelector(".sg-count");
    if (!esplo && vm.fase === "gioco") {
      dispTimer = setInterval(function () {
        if (!document.body.contains(num)) { stopTimers(); return; }
        var r = Math.max(0, cb.getRemaining());
        num.textContent = (r / 1000).toFixed(1);
      }, 100);
      (function loopSuono() {
        if (!document.body.contains(num)) { tickTimer = null; return; }
        var r = cb.getRemaining();
        if (r > 0) tickP(560 + (1 - Math.min(1, r / 15000)) * 620);
        var iv = Math.max(85, Math.min(620, r / 12));
        tickTimer = setTimeout(loopSuono, iv);
      })();
    } else if (esplo) {
      if (vm.boom && vm.boom.id !== ultimoBoom) { ultimoBoom = vm.boom.id; boomP(); }
    }
  }
})();

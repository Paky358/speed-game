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

  var ST = window.SGStudio;   // lo studio del game show (condiviso, js/studio.js)
  var COLORI = ["#ff6b6b", "#4dabf7", "#51cf66", "#ffd43b", "#cc5de8", "#ff922b", "#20c997", "#f783ac", "#a9e34b", "#66d9e8"];
  // Il timer riparte a ogni "ricezione". Il tetto parte da 15s e cala di 2s
  // ogni 4 passaggi, fino a un minimo di 5s: 15, 13, 11, 9, 7, 5.
  function capMs(passaggi) { return Math.max(5000, 15000 - 2000 * Math.floor(passaggi / 4)); }
  // Pause dello spettacolo (il tempo della bomba NON scende): rivelazione della categoria con la bomba
  // che vola sul primo, bomba che passa al nuovo dopo un'esplosione, e l'esplosione stessa.
  var ATTESA_INIZIO = 4600, ATTESA_ROUND = 1800, DURATA_BOOM = 3400;

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
      players: giocatori.map(function (g) { return { id: g.id, nome: g.nome, colore: g.colore, omino: g.omino || null, eliminato: false, voto: null }; }),
      holder: null, prev: null, ultimo: null, giro: [], round: 0, ts: 0, boom: null, vincitore: null,
      remaining: 0, cap: 15000, passaggi: 0, remPrima: null, giroPrima: [], eliminati: [], soloDare: null, attesa: 0
    };
    function pById(id) { for (var i = 0; i < st.players.length; i++) if (st.players[i].id === id) return st.players[i]; return null; }
    function vivi() { return st.players.filter(function (p) { return !p.eliminato; }); }
    function holderObj() { return pById(st.holder); }

    function aggiorna() {
      if (st.fase !== "gioco") return;
      var now = Date.now(), dt = now - st.ts; st.ts = now;
      if (now < st.attesa) return;   // pausa dello spettacolo: il tempo è fermo
      if (!holderObj()) return;
      st.remaining -= dt;
      if (st.remaining <= 0) { st.remaining = 0; esplode(); }
    }
    var loop = setInterval(aggiorna, 120);

    function avviaGioco(cat) {
      st.categoria = cat; st.round = 0; st.boom = null; st.vincitore = null; st.passaggi = 0; st.remPrima = null; st.eliminati = [];
      st.players.forEach(function (p) { p.eliminato = false; });
      var vv = vivi(); st.holder = vv[Math.floor(Math.random() * vv.length)].id;
      st.prev = null; st.ultimo = null; st.soloDare = null; st.giro = [st.holder]; st.cap = capMs(0); st.remaining = st.cap;
      st.fase = "gioco"; st.ts = Date.now(); st.attesa = st.ts + ATTESA_INIZIO; onCambio();
    }
    function esplode() {
      var h = holderObj(); if (!h) return;
      h.eliminato = true; st.eliminati.push(h.id); st.boom = { id: h.id, nome: h.nome }; st.fase = "esplosione"; onCambio();
      setTimeout(function () {
        st.boom = null; var v = vivi();
        if (v.length <= 1) { st.fase = "fine"; st.vincitore = v[0] ? { id: v[0].id, nome: v[0].nome, colore: v[0].colore } : null; onCambio(); return; }
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
        st.prev = null; st.ultimo = null; st.soloDare = null;
        st.cap = capMs(st.passaggi); st.remaining = st.cap; st.remPrima = null;
        st.fase = "gioco"; st.ts = Date.now(); st.attesa = st.ts + ATTESA_ROUND; onCambio();
      }, DURATA_BOOM);
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
        aggiorna(); if (st.fase !== "gioco" || fromId !== st.holder || Date.now() < st.attesa) return;
        var tgt = pById(targetId); if (!tgt || tgt.eliminato || targetId === st.holder) return;
        if (st.soloDare != null) { var sd = pById(st.soloDare); if (!sd || sd.eliminato) st.soloDare = null; }
        if (st.soloDare != null) {
          if (targetId !== st.soloDare) return;      // dopo "Rimanda indietro": puoi ridarla SOLO a chi te l'ha rimandata
        } else if (st.giro.indexOf(targetId) >= 0) {
          return;                                    // regola normale: non a chi ha già avuto la bomba nel giro
        }
        st.soloDare = null;                     // vincolo consumato
        st.remPrima = st.remaining;             // per l'eventuale "rimanda indietro"
        st.passaggi++; st.cap = capMs(st.passaggi); st.remaining = st.cap;  // riceve -> timer riparte
        st.ultimo = st.holder;                  // tenuto solo come info (il ritorno si fa col pulsante "Rimanda indietro")
        st.giroPrima = st.giro.slice();         // per ripristinarlo con "rimanda indietro"
        st.prev = st.holder; st.holder = targetId; st.giro.push(targetId);
        if (st.giro.length >= vivi().length) st.giro = [targetId];
        st.ts = Date.now(); onCambio();
      },
      indietro: function (fromId) {
        aggiorna(); if (st.fase !== "gioco" || fromId !== st.holder || !st.prev || Date.now() < st.attesa) return;
        var p = pById(st.prev); if (!p || p.eliminato) return;
        // il passaggio non valeva: torna a chi l'aveva, col tempo che aveva (NIENTE reset)
        st.passaggi = Math.max(0, st.passaggi - 1); st.cap = capMs(st.passaggi);
        if (st.remPrima != null) st.remaining = st.remPrima;
        st.ultimo = st.holder;
        st.soloDare = st.holder;                 // chi riprende la bomba potrà ridarla SOLO a chi gliel'ha rimandata
        // NON si resetta il giro: si ripristina com'era prima del passaggio annullato
        var back = st.prev; st.prev = null; st.holder = back; st.giro = st.giroPrima ? st.giroPrima.slice() : st.giro; st.ts = Date.now(); onCambio();
      },
      rimuovi: function (id) {
        var p = pById(id); if (!p) return; p.eliminato = true; if (st.eliminati.indexOf(id) < 0) st.eliminati.push(id);
        if (st.soloDare === id) st.soloDare = null;   // il bersaglio del vincolo non c'è più
        if (st.fase === "gioco" || st.fase === "esplosione") {
          var v = vivi();
          if (v.length <= 1) { st.fase = "fine"; st.vincitore = v[0] ? { id: v[0].id, nome: v[0].nome, colore: v[0].colore } : null; }
          else if (st.holder === id) { st.holder = v[Math.floor(Math.random() * v.length)].id; st.prev = null; st.soloDare = null; st.giro = [st.holder]; st.cap = capMs(st.passaggi); st.remaining = st.cap; st.ts = Date.now(); }
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
          classifica = ord.map(function (p) { return { id: p.id, nome: p.nome, colore: p.colore, omino: p.omino || null }; });
        }
        return {
          fase: st.fase, categoria: st.categoria, cats: st.cats, round: st.round,
          players: st.players.map(function (p) { return { id: p.id, nome: p.nome, colore: p.colore, omino: p.omino || null, eliminato: p.eliminato, voto: p.voto }; }),
          holder: st.holder, prev: st.prev, ultimo: st.ultimo, giro: st.giro.slice(),
          soloDare: (function () { if (st.soloDare == null) return null; var s = pById(st.soloDare); return (s && !s.eliminato) ? st.soloDare : null; })(),
          remaining: Math.max(0, Math.round(st.remaining)), cap: st.cap, boom: st.boom, vincitore: st.vincitore, classifica: classifica,
          attesaMs: Math.max(0, st.attesa - Date.now())   // quanto manca prima che il tempo della bomba riparta
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

  function swishP() {   // "fiuu" della bomba che vola
    var ctx = acP(); if (!ctx) return;
    try {
      var n = ctx.currentTime, len = Math.floor(ctx.sampleRate * 0.18), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / len);
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = buf; f.type = "bandpass"; f.frequency.setValueAtTime(900, n); f.frequency.exponentialRampToValueAtTime(2600, n + 0.18); f.Q.value = 1.4; g.gain.value = 0.35;
      s.connect(f); f.connect(g); g.connect(ctx.destination); s.start(n); s.stop(n + 0.2);
    } catch (e) {}
  }

  var dispTimer = null, tickTimer = null;
  function stopTimers() { if (dispTimer) clearInterval(dispTimer); if (tickTimer) clearTimeout(tickTimer); dispTimer = tickTimer = null; }
  function assicuraStileP() {
    if (document.getElementById("sg-patata-css")) return;
    var s = document.createElement("style"); s.id = "sg-patata-css";
    // come nello studio: si anima solo transform/opacity
    s.textContent = [
      // maxischermo durante il gioco (si vede da lontano: scritte grandi)
      ".pt-sch{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px;padding:10px 6px}",
      ".pt-cat{font-size:22px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:#cdd6ff}",
      ".pt-catnome{font-size:44px;font-weight:900;line-height:1.08;color:#ffe066;text-shadow:0 4px 0 rgba(0,0,0,.35);padding:0 6px}",
      ".pt-bombona{font-size:110px;line-height:1;will-change:transform;animation:ptPulsa .6s ease-in-out infinite alternate}",
      "@keyframes ptPulsa{from{transform:scale(.94)}to{transform:scale(1.06)}}",
      ".pt-conto{font-family:'Courier New',ui-monospace,monospace;font-size:150px;font-weight:900;line-height:.95;color:#fff;text-shadow:0 0 30px rgba(255,120,60,.6)}",
      ".pt-conto.poco{color:#ff5d6c}",
      ".pt-chi{font-size:34px;font-weight:800;color:#fff}",
      ".pt-chi b{color:#ffd43b}",
      ".pt-regola{font-size:22px;font-weight:700;color:#cdd6ff;opacity:.85}",
      ".pt-boomtxt{font-size:96px;font-weight:900;color:#ff5d6c;text-shadow:0 6px 0 rgba(0,0,0,.35);animation:ptEsce .45s cubic-bezier(.3,1.5,.5,1) both}",
      // voto della categoria (si vede da vicino)
      ".pt-voto{flex:1;display:flex;flex-direction:column;justify-content:center;gap:12px;padding:8px 4px}",
      ".pt-titolo{font-size:26px;font-weight:900;text-align:center}",
      ".pt-sotto{font-size:14px;color:#cdd6ff;text-align:center;margin:-6px 0 4px}",
      ".pt-catbtn{display:flex;flex-direction:column;gap:4px;width:100%;text-align:left;padding:18px;border-radius:18px;border:3px solid transparent;cursor:pointer;color:#fff;font:inherit;font-size:21px;font-weight:900;",
        "background:linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.05));box-shadow:0 6px 16px rgba(0,0,0,.3)}",
      ".pt-catbtn small{font-size:13px;font-weight:700;opacity:.8}",
      ".pt-catbtn.scelta{border-color:#ffd43b;background:linear-gradient(135deg,rgba(255,212,59,.32),rgba(255,212,59,.08))}",
      ".pt-rivela{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center}",
      ".pt-catgrande{font-size:40px;font-weight:900;color:#ffe066;text-shadow:0 4px 0 rgba(0,0,0,.35);padding:0 10px;animation:ptEsce .5s cubic-bezier(.3,1.5,.5,1) both}",
      "@keyframes ptEsce{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}",
      // la bomba sopra la testa (trema, la miccia sfavilla) e l'esplosione
      ".pt-bomba{position:absolute;left:0;top:0;z-index:6;pointer-events:none;opacity:0;transition:opacity .25s;will-change:transform}",
      ".pt-bomba-in{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;line-height:1;will-change:transform;animation:ptTrema .18s ease-in-out infinite alternate}",
      ".pt-bomba.corri .pt-bomba-in{animation-duration:.07s}",
      "@keyframes ptTrema{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}",
      ".pt-miccia{position:absolute;right:6%;top:2%;width:24%;height:24%;border-radius:50%;background:radial-gradient(circle,#fff 0 25%,#ffd43b 45%,rgba(255,120,0,0) 70%);will-change:transform,opacity;animation:ptScintilla .12s steps(2) infinite}",
      "@keyframes ptScintilla{50%{transform:scale(1.6);opacity:.6}}",
      ".pt-boom{position:absolute;z-index:7;width:0;height:0;pointer-events:none}",
      ".pt-boom:before{content:'';position:absolute;left:-150px;top:-150px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,#fff 0,#ffd43b 25%,#ff6b00 50%,rgba(255,60,0,0) 70%);will-change:transform,opacity;animation:ptOnda .8s ease-out forwards}",
      ".pt-boom span{position:absolute;left:0;top:0;font-size:120px;line-height:1;will-change:transform,opacity;animation:ptBoom .9s ease-out forwards}",
      ".pt-boom i{position:absolute;left:-30px;top:-30px;width:60px;height:60px;border-radius:50%;background:radial-gradient(circle,rgba(120,110,125,.9),rgba(80,70,85,0) 70%);opacity:0;will-change:transform,opacity;animation:ptFumo 1.6s ease-out forwards}",
      ".pt-boom i:nth-child(1){--fx:-110px;--fy:-130px}.pt-boom i:nth-child(2){--fx:100px;--fy:-140px}.pt-boom i:nth-child(3){--fx:-150px;--fy:-20px}",
      ".pt-boom i:nth-child(4){--fx:150px;--fy:-30px}.pt-boom i:nth-child(5){--fx:-40px;--fy:-190px}.pt-boom i:nth-child(6){--fx:50px;--fy:-180px}",
      "@keyframes ptOnda{from{transform:scale(.2);opacity:1}to{transform:scale(1.8);opacity:0}}",
      "@keyframes ptBoom{0%{transform:translate(-50%,-50%) scale(.2);opacity:1}40%{transform:translate(-50%,-50%) scale(1.3);opacity:1}100%{transform:translate(-50%,-50%) scale(1.1);opacity:0}}",
      "@keyframes ptFumo{0%{transform:translate(0,0) scale(.3);opacity:0}20%{opacity:1}100%{transform:translate(var(--fx),var(--fy)) scale(2.2);opacity:0}}",
      // barra sotto
      ".pt-hint{font-size:.98rem}",
      ".pt-indietro{width:100%;padding:12px;border-radius:14px;border:2px solid #ffa94d;background:rgba(255,169,77,.18);color:#ffd8a8;font:inherit;font-weight:700;cursor:pointer}",
      // lobby e classifica con gli avatar
      ".pt-lobby{display:flex;align-items:center;gap:10px;padding:6px 10px 6px 6px;border-radius:12px;margin-bottom:6px;background:rgba(255,255,255,.06);font-weight:700}",
      ".pt-lobby .fac,.pt-riga .fac{width:38px;height:38px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1);flex:0 0 auto}",
      ".pt-lobby .fac svg,.pt-riga .fac svg,.pt-gradino .fac svg{width:100%;height:100%;display:block}",
      ".pt-podio{display:flex;align-items:flex-end;justify-content:center;gap:8px;margin:8px 0 14px}",
      ".pt-gradino{flex:1;max-width:120px;display:flex;flex-direction:column;align-items:center}",
      ".pt-gradino .fac{width:70px;height:70px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.1)}",
      ".pt-gradino.p1 .fac{width:90px;height:90px;box-shadow:0 0 0 3px #ffd43b,0 0 26px rgba(255,212,59,.55)}",
      ".pt-gradino .nm{font-weight:800;font-size:.85rem;margin:4px 0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pt-gradino .blocco{width:100%;border-radius:10px 10px 0 0;display:flex;justify-content:center;padding-top:6px;font-size:1.6rem}",
      ".pt-gradino.p1 .blocco{height:84px;background:linear-gradient(#ffd75a,#c99a10)}",
      ".pt-gradino.p2 .blocco{height:62px;background:linear-gradient(#e6ebf2,#98a3b3)}",
      ".pt-gradino.p3 .blocco{height:46px;background:linear-gradient(#e8a866,#a8662a)}",
      ".pt-riga{display:flex;align-items:center;gap:10px;padding:6px 12px 6px 6px;border-radius:14px;background:rgba(255,255,255,.06)}",
      ".pt-riga.primo{background:rgba(255,212,59,.16);border:1px solid rgba(255,212,59,.5)}",
      ".pt-riga .pos{width:28px;text-align:center;font-weight:900}",
      ".pt-riga .nm{flex:1;font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pt-riga .et{font-size:.8rem;opacity:.8}"
    ].join("");
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
    var H = { fase: "lobby", codice: "…", pronta: false, players: [{ id: "host", nome: (t.giocatori && t.giocatori[0]) || "Host", colore: COLORI[0], omino: ST.mioAvatar((t.giocatori && t.giocatori[0]) || "Host") }], motore: null, customCats: [] };
    var rete = SGNet.ospita("patata", {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      onAddio: function (id) {
        if (H.fase === "lobby") { H.players = H.players.filter(function (p) { return p.id !== id; }); H.players.forEach(function (p, i) { p.colore = COLORI[i % COLORI.length]; }); bd(); }
        else if (H.motore) H.motore.rimuovi(id);
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") { if (H.fase === "lobby" && !H.players.some(function (p) { return p.id === id; }) && H.players.length < 10) H.players.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), colore: COLORI[H.players.length % COLORI.length], omino: ST.avatarValido(m.omino) }); bd(); }
        else if (!H.motore) return;
        else if (m.t === "vota") H.motore.vota(id, m.idx);
        else if (m.t === "passa") H.motore.passa(id, m.target);
        else if (m.t === "indietro") H.motore.indietro(id);
      },
      onErrore: function () { senzaReteP(t); }
    });
    function vmHost() {
      if (H.fase === "lobby") return { fase: "lobby", codice: H.codice, pronta: H.pronta, players: H.players.map(function (p) { return { id: p.id, nome: p.nome, colore: p.colore, omino: p.omino || null }; }), customCats: H.customCats.slice() };
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
      // il tempo scende solo dopo la pausa dello spettacolo (attesaMs)
      getRemaining: function () { if (!S.vm) return 0; return Math.max(0, S.vm.remaining - Math.max(0, (Date.now() - S.vmTs) - (S.vm.attesaMs || 0))); },
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
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: ST.mioAvatar(S.nome) });
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
  //  DISEGNO: lo STUDIO del game show (condiviso con la Linea del tempo)
  //  Tutti ai leggii; sul maxischermo la categoria e il conto alla rovescia gigante.
  //  La bomba sta sopra la testa di chi la tiene e VOLA da un leggio all'altro:
  //  chi ce l'ha tocca il leggio di chi la riceve. Quando scade: BOOM, zoom sul leggio.
  // =========================================================
  var RP = null;   // la regia di questo telefono
  function idxP(vm, id) { for (var i = 0; i < vm.players.length; i++) if (vm.players[i].id === id) return i; return -1; }
  function disegnaPatataVM(t, vm, cb) {
    assicuraStileP();
    if (vm.fase === "lobby") { RP = null; stopTimers(); return disegnaLobbyP(t, vm, cb); }
    var ids = vm.players.map(function (p) { return p.id; }).join("|");
    if (!RP || RP.ids !== ids || (!RP.S.vivo() && vm.fase !== "fine")) {
      if (!(RP && RP.fineFatta && vm.fase === "fine")) {
        stopTimers();
        RP = { t: t, ids: ids, cb: cb, presentato: !!cb._presentato };
        RP.S = ST.crea(t, vm.players, { io: cb.locale ? -1 : idxP(vm, cb.myId), esci: function () { cb.onEsci(); }, titolo: "La Patata Bollente", logo: ["LA PATATA", "BOLLENTE"] });
        RP.S.onTocca = function (i) { var p = RP.vm && RP.vm.players[i]; if (p) { swishP(); RP.cb.onPassa(p.id); } };
        vm.players.forEach(function (p, i) { ST.testoLeggio(RP.S, i, p.eliminato ? "💀 OUT" : "IN GARA", p.eliminato); if (p.eliminato) { ST.fuori(RP.S, i, true); ST.faccia(RP.S, i, "esploso"); } });
        RP.bomba = creaBomba(RP.S);
      }
    }
    RP.vm = vm; RP.cb = cb; RP.vmTs = Date.now();
    regiaTickP(RP);
  }
  async function regiaTickP(R) {
    if (R.corre) { R.ancora = true; return; }
    R.corre = true;
    try {
      for (var giri = 0; giri < 30; giri++) {
        R.ancora = false;
        var fatto = await regiaPassoP(R);
        if (!fatto && !R.ancora) break;
      }
    } catch (e) {} finally { R.corre = false; }
  }
  async function regiaPassoP(R) {
    var vm = R.vm, S = R.S, cb = R.cb;
    if (vm.fase === "fine") {
      if (R.fineFatta) return false;
      R.fineFatta = true; stopTimers(); nascondiBomba(R);
      var vinc = vm.vincitore ? idxP(vm, vm.vincitore.id) : -1;
      if (S.vivo()) await ST.finale(S, vinc, "Ultimo sopravvissuto! 💣");
      schermataFineP(R.t, vm, cb);
      return true;
    }
    if (!S.vivo()) return false;
    if (!R.presentato) {   // la sigla, una volta sola per partita
      R.presentato = true; cb._presentato = true;
      await ST.apertura(S);
      return true;
    }
    if (vm.fase === "voto") { mostraVotoP(R, vm); return false; }
    if (vm.fase === "gioco") {
      var kR = vm.categoria + "|" + vm.round;
      if (R.kRound !== kR) {
        R.kRound = kR; stopTimers();
        if (R.kCat !== vm.categoria) { R.kCat = vm.categoria; await rivelaCategoria(R); }
        else await nuovoRound(R);
        return true;
      }
      aggiornaGioco(R);
      return false;
    }
    if (vm.fase === "esplosione" && vm.boom) {
      var kB = vm.categoria + "|" + vm.round + "|" + vm.boom.id;
      if (R.kBoom === kB) return false;
      R.kBoom = kB;
      await esplosione(R);
      return true;
    }
    return false;
  }

  // ---- il maxischermo ----
  function schermoPatata(R) {
    var el = R.t.el, S = R.S, vm = R.vm, h = null;
    ST.fermaTimer(S); ST.vuota(S.sch);
    vm.players.forEach(function (p) { if (p.id === vm.holder) h = p; });
    R.contoEl = el("div", { class: "pt-conto", text: (vm.cap / 1000).toFixed(1) });
    R.chiEl = el("b", { text: h ? h.nome : "" });
    S.sch.appendChild(el("div", { class: "pt-sch" }, [
      el("div", { class: "pt-cat", text: "🗂️ categoria" }),
      el("div", { class: "pt-catnome", text: vm.categoria || "" }),
      el("div", { class: "pt-bombona", text: "💣" }),
      R.contoEl,
      el("div", { class: "pt-chi" }, [ el("span", { text: "Ha la bomba " }), R.chiEl ]),
      el("div", { class: "pt-regola", text: "Chi la riceve riparte da " + (vm.cap / 1000) + "s" })
    ]));
  }
  function mostraVotoP(R, vm) {
    var S = R.S, el = R.t.el, cb = R.cb;
    stopTimers(); nascondiBomba(R); ST.tocca(S, []); ST.accendiSolo(S, -1);
    var mio = null; vm.players.forEach(function (p) { if (p.id === cb.myId) mio = p; });
    var chiave = "voto|" + vm.cats.join("|") + "|" + vm.players.map(function (p) { return p.voto; }).join(",");
    if (R.mostrato !== chiave) {
      R.mostrato = chiave;
      ST.fermaTimer(S); ST.vuota(S.sch);
      var box = el("div", { class: "pt-voto" }, [
        el("div", { class: "pt-titolo", text: "🗳️ Che categoria?" }),
        el("div", { class: "pt-sotto", text: cb.locale ? "Toccatene una per iniziare" : "Vota: si gioca la più votata" })
      ]);
      vm.cats.forEach(function (cat, i) {
        var voti = vm.players.filter(function (p) { return p.voto === i; }).length, scelto = mio && mio.voto === i;
        box.appendChild(el("button", { class: "pt-catbtn" + (scelto ? " scelta" : ""), onclick: function () { swishP(); if (cb.locale) cb.onScegliCat(i); else cb.onVota(i); } }, [
          el("span", { text: cat }), cb.locale ? null : el("small", { text: voti === 1 ? "1 voto" : voti + " voti" })
        ]));
      });
      S.sch.appendChild(box);
    }
    if (R.inq !== "schermo") { R.inq = "schermo"; ST.suSchermo(S, 900); }
    if (!cb.locale && cb.sonoHost) ST.barra(S, [ el("button", { class: "btn btn-primario", text: "Via! ▶", onclick: function () { ST.viaBarra(S); cb.onVia(); } }) ]);
    else if (!cb.locale) ST.barra(S, [ el("p", { class: "tl-attesa", text: "Vota pure: parte quando l'host dà il via" }) ]);
    else ST.viaBarra(S);
  }
  // la categoria esce dal maxischermo, poi la telecamera si allarga e la bomba vola sul primo
  async function rivelaCategoria(R) {
    var S = R.S, el = R.t.el, vm = R.vm;
    ST.viaBarra(S); ST.tocca(S, []); nascondiBomba(R);
    if (R.inq !== "schermo") { R.inq = "schermo"; await ST.suSchermo(S, 600); }
    ST.fermaTimer(S); ST.vuota(S.sch);
    var riv = el("div", { class: "pt-rivela" }, [ el("div", { class: "pt-titolo", text: "La categoria è…" }) ]);
    S.sch.appendChild(riv);
    ST.FX.rullo(1.1);
    await ST.dorme(1250);
    riv.appendChild(el("div", { class: "pt-catgrande", text: vm.categoria || "" }));
    ST.FX.applauso();
    await ST.dorme(1000);
    schermoPatata(R);
    R.inq = "largo"; await ST.largo(S, 800);
    await arrivaBomba(R, true);
  }
  async function nuovoRound(R) {
    var S = R.S;
    schermoPatata(R);
    if (R.inq !== "largo") { R.inq = "largo"; await ST.largo(S, 600); }
    await arrivaBomba(R, false);
  }
  async function arrivaBomba(R, dalloSchermo) {
    var S = R.S, vm = R.vm, i = idxP(vm, vm.holder); if (i < 0) return;
    var p = vm.players[i];
    ST.accendiSolo(S, i); ST.faccia(S, i, "paura");
    var da = dalloSchermo ? { x: S.R.schermo.x + S.R.schermo.w / 2, y: S.R.schermo.y + S.R.schermo.h * 0.45 } : { x: ST.sopraTesta(S, i).x, y: -80 };
    await voloBomba(R, da, puntoBomba(R, i), 650);
    R.holder = vm.holder;
    ST.terzo(S, i, "💣 Ha la bomba " + p.nome, "Di' una parola e passala!", "💣");
    setTimeout(function () { if (R.vm.holder === p.id) ST.viaTerzo(S); }, 1600);
    avviaCronometro(R);
    aggiornaGioco(R);
  }
  async function esplosione(R) {
    var S = R.S, vm = R.vm, i = idxP(vm, vm.boom.id), el = R.t.el;
    stopTimers(); ST.tocca(S, []); ST.viaBarra(S);
    boomP(); ST.lampo(S); ST.scossa(S);
    var dove = puntoBomba(R, i); nascondiBomba(R);
    var b = el("div", { class: "pt-boom" }, [ el("i"), el("i"), el("i"), el("i"), el("i"), el("i"), el("span", { text: "💥" }) ]);
    b.style.left = dove.x + "px"; b.style.top = dove.y + "px";
    S.mondo.appendChild(b); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 1800);
    ST.fermaTimer(S); ST.vuota(S.sch);
    S.sch.appendChild(el("div", { class: "pt-sch" }, [ el("div", { class: "pt-boomtxt", text: "💥 BOOM!" }), el("div", { class: "pt-chi" }, [ el("b", { text: vm.boom.nome }), el("span", { text: " è fuori!" }) ]) ]));
    R.inq = "leggio"; await ST.suLeggio(S, i, 450);
    ST.faccia(S, i, "esploso"); ST.fuori(S, i, true); ST.testoLeggio(S, i, "💀 OUT", true); ST.accendiSolo(S, -1);
    ST.pubblico(S, "ohh");
    ST.terzo(S, i, "💥 BOOM! " + vm.boom.nome, "è eliminato!", "💥");
    await ST.dorme(1500); ST.viaTerzo(S);
    R.inq = "largo"; await ST.largo(S, 700);
    R.holder = null;
  }

  // ---- durante il gioco: bomba, chi si può toccare, display dei leggii ----
  function aggiornaGioco(R) {
    var S = R.S, vm = R.vm, cb = R.cb, el = R.t.el;
    if (vm.fase !== "gioco") return;
    var hi = idxP(vm, vm.holder), inAttesa = Date.now() < R.vmTs + (vm.attesaMs || 0);
    if (R.holder && R.holder !== vm.holder && hi >= 0) {   // la bomba è passata: vola da un leggio all'altro
      var da = idxP(vm, R.holder);
      if (da >= 0) { ST.faccia(S, da, vm.players[da].eliminato ? "esploso" : null); voloBomba(R, puntoBomba(R, da), puntoBomba(R, hi), 420); }
      else posaBomba(R, hi);
      ST.accendiSolo(S, hi); ST.faccia(S, hi, "paura");
      if (R.chiEl) R.chiEl.textContent = vm.players[hi].nome;
    }
    if (hi >= 0 && !R.holder) posaBomba(R, hi);
    R.holder = vm.holder;
    vm.players.forEach(function (p, i) {
      if (p.eliminato) { ST.fuori(S, i, true); ST.testoLeggio(S, i, "💀 OUT", true); }
      else if (i !== hi) ST.testoLeggio(S, i, "IN GARA");
    });
    // chi si può toccare (solo chi ha la bomba: in locale tutti, online il suo telefono)
    var puoi = (cb.locale || vm.holder === cb.myId) && !inAttesa, lista = [];
    if (puoi) vm.players.forEach(function (p, i) {
      if (p.eliminato || i === hi) return;
      if (vm.soloDare != null ? p.id === vm.soloDare : vm.giro.indexOf(p.id) < 0) lista.push(i);
    });
    ST.tocca(S, lista);
    // la barra sotto: rimanda indietro / suggerimento
    var prevP = null; vm.players.forEach(function (p) { if (p.id === vm.prev) prevP = p; });
    var chiave = "b|" + vm.holder + "|" + (puoi ? 1 : 0) + "|" + (prevP && !prevP.eliminato ? prevP.id : "") + "|" + (vm.soloDare || "");
    if (R.barraK !== chiave) {
      R.barraK = chiave;
      var nodi = [];
      if (puoi && vm.soloDare) { var chiRi = null; vm.players.forEach(function (p) { if (p.id === vm.soloDare) chiRi = p; }); nodi.push(el("p", { class: "tl-attesa pt-hint", text: "Te l'hanno rimandata: di' la parola e ridàlla a " + (chiRi ? chiRi.nome : "chi te l'ha rimandata") + " 👇" })); }
      else if (puoi) nodi.push(el("p", { class: "tl-attesa pt-hint", text: "Di' una parola su «" + vm.categoria + "» e tocca chi la riceve 👇" }));
      else if (!cb.locale && hi >= 0) nodi.push(el("p", { class: "tl-attesa pt-hint", text: "💣 Ce l'ha " + vm.players[hi].nome + "… occhio che può toccare a te!" }));
      if (puoi && prevP && !prevP.eliminato) nodi.push(el("button", { class: "pt-indietro", html: "🆘 SOLO se " + prevP.nome + " non ha detto la parola: <b>rimandagliela</b>", onclick: function () { swishP(); cb.onIndietro(); } }));
      if (nodi.length) ST.barra(S, nodi); else ST.viaBarra(S);
    }
    if (R.inq !== "largo" && R.inq !== "leggio") { R.inq = "largo"; ST.largo(S, 700); }
    if (!dispTimer) avviaCronometro(R);
  }
  // countdown sul maxischermo e sul leggio di chi ha la bomba, ticchettio che accelera
  function avviaCronometro(R) {
    stopTimers();
    var S = R.S;
    dispTimer = setInterval(function () {
      if (!S.vivo() || R.vm.fase !== "gioco") { stopTimers(); return; }
      var r = Math.max(0, R.cb.getRemaining()), hi = idxP(R.vm, R.vm.holder), txt = (r / 1000).toFixed(1);
      if (R.contoEl) { R.contoEl.textContent = txt; R.contoEl.classList.toggle("poco", r < 3000); }
      if (hi >= 0) ST.testoLeggio(S, hi, "💣 " + txt, r < 3000);
      if (R.bomba) R.bomba.classList.toggle("corri", r < 3000);
      if (hi >= 0 && Date.now() >= R.vmTs + (R.vm.attesaMs || 0) && !R.toccaAttivo) { R.toccaAttivo = true; aggiornaGioco(R); }
    }, 100);
    R.toccaAttivo = Date.now() >= R.vmTs + (R.vm.attesaMs || 0);
    (function loopSuono() {
      if (!S.vivo() || R.vm.fase !== "gioco") { tickTimer = null; return; }
      var r = R.cb.getRemaining(), inAttesa = Date.now() < R.vmTs + (R.vm.attesaMs || 0);
      if (r > 0 && !inAttesa) tickP(560 + (1 - Math.min(1, r / 15000)) * 620);
      tickTimer = setTimeout(loopSuono, Math.max(85, Math.min(620, r / 12)));
    })();
  }

  // ---- la bomba (sopra la testa di chi la tiene) ----
  function creaBomba(S) {
    var b = document.createElement("div"); b.className = "pt-bomba";
    b.innerHTML = "<div class='pt-bomba-in'><span class='pt-em'>💣</span><i class='pt-miccia'></i></div>";
    S.mondo.appendChild(b);
    return b;
  }
  function misuraBomba(R) { var p = R.S.posti[0]; return Math.round((p ? p.w : 120) * 0.5); }
  function puntoBomba(R, i) { var q = ST.sopraTesta(R.S, i), d = misuraBomba(R); return { x: q.x, y: q.y - d * 0.45 }; }
  function trasfBomba(R, p, giro) { var d = misuraBomba(R); return "translate(" + (p.x - d / 2).toFixed(1) + "px," + (p.y - d / 2).toFixed(1) + "px) rotate(" + (giro || 0) + "deg)"; }
  function posaBomba(R, i) {
    var b = R.bomba, d = misuraBomba(R); if (!b || i < 0) return;
    b.style.width = b.style.height = d + "px"; b.style.fontSize = (d * 0.8) + "px";
    b.style.transform = trasfBomba(R, puntoBomba(R, i)); b.style.opacity = 1;
  }
  function voloBomba(R, da, a, ms) {
    var b = R.bomba, d = misuraBomba(R); if (!b) return Promise.resolve();
    b.style.width = b.style.height = d + "px"; b.style.fontSize = (d * 0.8) + "px"; b.style.opacity = 1;
    var mezzo = { x: (da.x + a.x) / 2, y: Math.min(da.y, a.y) - R.S.VH * 0.22 };   // parabola
    var fine = trasfBomba(R, a);
    b.style.transform = fine;
    try { b.animate([{ transform: trasfBomba(R, da) }, { transform: trasfBomba(R, mezzo, 200) }, { transform: trasfBomba(R, a, 360) }], { duration: ms, easing: "cubic-bezier(.3,.1,.3,1)" }); } catch (e) {}
    return ST.dorme(ms);
  }
  function nascondiBomba(R) { if (R.bomba) R.bomba.style.opacity = 0; R.holder = null; }

  // ---- lobby (online) ----
  function disegnaLobbyP(t, vm, cb) {
    var el = t.el, myId = cb.myId;
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
      s._contenuto.appendChild(el("div", { class: "pt-lobby" }, [
        el("span", { class: "fac", html: ST.avatarDi(p) }),
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
      var ok = vm.players.length >= 2;
      var b = el("button", { class: "btn btn-primario", text: "Continua ▶", onclick: cb.onContinua });
      if (!ok) b.setAttribute("disabled", "disabled");
      s._piede.appendChild(b);
      if (!ok) s._piede.appendChild(el("p", { class: "modulo-nota", text: "Servono almeno 2 giocatori (aspetta che entrino)." }));
    } else s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa che l'host cominci…" }));
    t.mostra(s);
  }

  // ---- classifica finale (dopo il finale nello studio) ----
  function schermataFineP(t, vm, cb) {
    var el = t.el;
    var sf = t.schermata({ icona: "🏆", titolo: "Vince " + (vm.vincitore ? vm.vincitore.nome : "") + "!", sotto: "La Patata Bollente" });
    var cl = vm.classifica || [];
    var podio = el("div", { class: "pt-podio" });
    [1, 0, 2].forEach(function (k) {
      var p = cl[k]; if (!p) return;
      podio.appendChild(el("div", { class: "pt-gradino p" + (k + 1) }, [
        el("div", { class: "fac", html: ST.avatarDi(p, k === 0 ? "esulta" : null) }),
        el("div", { class: "nm", text: p.nome }),
        el("div", { class: "blocco", text: ["🏆", "🥈", "🥉"][k] })
      ]));
    });
    sf._contenuto.appendChild(podio);
    var box = el("div", { style: "display:flex;flex-direction:column;gap:6px" });
    cl.forEach(function (p, i) {
      box.appendChild(el("div", { class: "pt-riga" + (i === 0 ? " primo" : "") }, [
        el("span", { class: "pos", text: (i + 1) + "°" }),
        el("span", { class: "fac", html: ST.avatarDi(p, i === cl.length - 1 && cl.length > 1 ? "esploso" : null) }),
        el("span", { class: "nm", text: p.nome }),
        el("span", { class: "et", text: i === 0 ? "🏆 vincitore" : (i === cl.length - 1 ? "💥 primo esploso" : "") })
      ]));
    });
    sf._contenuto.appendChild(box);
    if (cb.sonoHost) {
      sf._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Nuova partita", onclick: cb.onNuova }));
      sf._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Chiudi", onclick: cb.onEsci }));
    } else sf._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa dell'host per un'altra partita…" }));
    t.mostra(sf);
  }
})();

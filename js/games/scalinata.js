/* =========================================================
   GIOCO — "La Scalinata"  (ispirato a Wii Party, Scalinata a sorte)
   Solo in 4. A ogni round ognuno sceglie in segreto 1, 3 o 5
   gradini (4 secondi). Le scelte si scoprono tutte insieme: se
   due o più scelgono lo stesso numero restano fermi; avanza solo
   chi ha scelto un numero unico, di tanti gradini quanti il numero.
   Primo in cima (gradino TRAGUARDO) vince.
   Un telefono solo: il telefono si passa, ognuno sceglie in segreto.
   Ognuno dal suo (online): si sceglie tutti insieme; i posti liberi
   li riempiono dei bot (il primo è "Matt"). Quando uno sceglie, il
   suo pallino si illumina e il telefono fa un "bip".
   ========================================================= */
(function () {
  "use strict";

  var TRAGUARDO = 15;
  var SECONDI = 4;
  var SUSPENSE = 2000; // i numeri restano in testa 2 secondi prima di avanzare
  var SCELTE = [1, 3, 5];
  var COLORI = ["#ff6b6b", "#4dabf7", "#51cf66", "#ffd43b"];
  var NOMI_BOT = ["Matt", "Kevin", "Cody"];
  var beepStato = { round: -1, ids: {} };
  var scenaScelta = null; // schermata di scelta viva, per aggiornarla senza ridisegnare tutto

  function coloreScelta(n) { return n === 1 ? "#8ce99a" : n === 3 ? "#ffd43b" : "#ff922b"; }

  SG.registra({
    id: "scalinata",
    nome: "La Scalinata",
    icona: "🪜",
    descrizione: "In quattro sulla scala: scegli 1, 3 o 5. Avanza solo chi sceglie un numero che nessun altro ha scelto. Primo in cima, vince.",
    giocatoriMin: 4,
    giocatoriMax: 4,
    difficolta: 2,
    regole: [
      "Solo in <b>4</b>. A ogni round hai <b>4 secondi</b> per scegliere in segreto <b>1, 3 o 5</b> gradini.",
      "Le scelte si scoprono <b>tutte insieme</b>, sopra la testa di ognuno: se due o più scelgono lo <b>stesso</b> numero, restano <b>fermi</b>.",
      "Avanza solo chi ha scelto un numero <b>che nessun altro ha scelto</b>, di tanti gradini quanti il numero.",
      "Vince il primo che arriva in cima alla scalinata (gradino <b>" + TRAGUARDO + "</b>).",
      "Si può giocare <b>a un telefono solo</b> (in 4, si passa di mano) oppure <b>ognuno dal suo</b>: i posti liberi li riempiono dei <b>bot</b>, così giochi anche da solo, in 2 o in 3."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = "telefono";
      if (aiuti.torneo) return; // nel torneo si gioca sempre a un telefono solo
      box.appendChild(el("div", { class: "etichetta", text: "Come si gioca" }));
      var nota = el("div", { class: "link-avviso", hidden: "hidden" });
      var bT, bO;
      function scegliModo(m) {
        dove.modo = m;
        bT.className = "modo-chip" + (m === "telefono" ? " attiva" : "");
        bO.className = "modo-chip" + (m === "online" ? " attiva" : "");
        nota.hidden = (m !== "online");
        nota.textContent = (window.SGNet && SGNet.disponibile())
          ? "Apri una stanza e manda il codice: gli amici entrano dai loro telefoni. I posti liberi li riempiono dei bot, così puoi giocare anche da solo, in 2 o in 3."
          : "Qui il collegamento non è disponibile. Funziona quando il gioco è aperto dal sito pubblicato online.";
      }
      bT = el("button", { class: "modo-chip attiva", onclick: function () { scegliModo("telefono"); } }, [
        el("span", { class: "mi", text: "📱" }), el("div", {}, [el("div", { class: "mt", text: "Un telefono solo" }), el("div", { class: "ms", text: "In 4, si passa di mano" })])]);
      bO = el("button", { class: "modo-chip", onclick: function () { scegliModo("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Ognuno dal suo" }), el("div", { class: "ms", text: "Con i bot per fare 4" })])]);
      box.appendChild(el("div", { class: "modo-griglia" }, [bT, bO]));
      box.appendChild(nota);
    },

    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return ospiteScala(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostScala(t);
      if (t.giocatori.length !== 4) return niente(t);
      var st = { g: t.giocatori.map(function (n, i) { return { nome: n, colore: COLORI[i], passi: 0 }; }), scelte: [null, null, null, null], nRound: 0 };
      introRound(t, st);
    }
  });

  function niente(t) {
    var s = t.schermata({ icona: "🪜", titolo: "La Scalinata", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { text: "Questo gioco si fa esattamente in 4 giocatori." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  function introRound(t, st) {
    st.nRound += 1; st.scelte = [null, null, null, null];
    var el = t.el;
    var s = t.schermata({ icona: "🪜", titolo: "Round " + st.nRound, sotto: "Verso il gradino " + TRAGUARDO });
    s._contenuto.appendChild(disegnaScala(t, st.g, null, null));
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Passatevi il telefono: ognuno sceglie in segreto 1, 3 o 5. Ricordate: se scegliete lo stesso numero di un altro, restate fermi!" }));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Si comincia ▶", onclick: function () { turno(t, st, 0); } }));
    t.mostra(s);
  }

  function turno(t, st, i) {
    if (i >= 4) return rivela(t, st);
    t.passaA(st.g[i].nome, function () { schermataScelta(t, st, i); });
  }

  function schermataScelta(t, st, i) {
    var el = t.el, g = st.g[i];
    var s = t.schermata({ icona: "🪜", titolo: g.nome, sotto: "Sei al gradino " + g.passi + " di " + TRAGUARDO });
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Scegli in segreto quanti gradini fare. Svelto!" }));
    var timerBox = el("div", { style: "text-align:center;font-size:2.6rem;font-weight:800;margin:2px 0 6px", text: SECONDI });
    s._contenuto.appendChild(timerBox);
    var scelto = false, restano = SECONDI, tm;
    function scegli(n) { if (scelto) return; scelto = true; if (tm) clearInterval(tm); st.scelte[i] = n; turno(t, st, i + 1); }
    var griglia = el("div", { style: "display:flex;gap:12px;justify-content:center;margin-top:6px" });
    SCELTE.forEach(function (n) {
      griglia.appendChild(el("button", { style: "flex:1;max-width:130px;padding:28px 0;border-radius:18px;border:0;cursor:pointer;color:#08210f;font-weight:800;background:" + coloreScelta(n) + ";box-shadow:0 4px 10px rgba(0,0,0,.3)", onclick: function () { scegli(n); } }, [
        el("div", { style: "font-size:2.6rem;line-height:1", text: String(n) }),
        el("div", { style: "font-size:.8rem;font-weight:700;opacity:.8", text: n === 1 ? "gradino" : "gradini" })
      ]));
    });
    s._contenuto.appendChild(griglia);
    tm = setInterval(function () { restano -= 1; timerBox.textContent = Math.max(0, restano); if (restano <= 0) { clearInterval(tm); if (!scelto) scegli(SCELTE[Math.floor(Math.random() * 3)]); } }, 1000);
    t.mostra(s);
  }

  function rivela(t, st) {
    var scelte = st.scelte.slice();
    var conta = {}; scelte.forEach(function (n) { conta[n] = (conta[n] || 0) + 1; });
    var avanza = st.g.map(function (_, i) { return conta[scelte[i]] === 1; });
    var prev = st.g.map(function (g) { return g.passi; });
    st.g.forEach(function (g, i) { if (avanza[i]) g.passi = Math.min(TRAGUARDO, g.passi + scelte[i]); });

    var el = t.el;
    var s = t.schermata({ icona: "🪜", titolo: "Si scopre!", sotto: "Round " + st.nRound });
    s._contenuto.appendChild(disegnaScala(t, st.g, scelte, avanza, prev));

    var finiti = st.g.filter(function (g) { return g.passi >= TRAGUARDO; });
    var avanti = finiti.length
      ? el("button", { class: "btn btn-primario", text: "Vedi il podio 🏆", onclick: function () { finePartita(t, st); } })
      : el("button", { class: "btn btn-primario", text: "Prossimo round ▶", onclick: function () { introRound(t, st); } });
    // il pulsante compare dopo la pausa, a rivelazione completata
    avanti.setAttribute("style", "opacity:0;pointer-events:none;transition:opacity .4s");
    setTimeout(function () { avanti.style.opacity = "1"; avanti.style.pointerEvents = "auto"; }, SUSPENSE);
    s._piede.appendChild(avanti);
    t.mostra(s);
  }

  // ---- la scalinata a 4 corsie ----  (gioc = elenco {nome,colore,passi})
  // outDots (facoltativo): array che viene riempito con i pallini, per poterli
  // illuminare da fuori senza ridisegnare la scala.
  function disegnaScala(t, gioc, scelte, avanza, prev, outDots) {
    var el = t.el;
    var wrap = el("div", { style: "position:relative;height:330px;border-radius:16px;background:linear-gradient(180deg,#242c52 0%,#171634 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)" });
    wrap.appendChild(el("div", { style: "position:absolute;top:0;left:0;right:0;height:24px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.85rem;color:#ffe066;background:linear-gradient(180deg,rgba(255,224,102,.18),transparent)", text: "🏁 TRAGUARDO" }));
    // linee di riferimento ogni 5 gradini
    var area = el("div", { style: "position:absolute;top:28px;bottom:32px;left:8px;right:8px;display:flex;gap:6px" });
    for (var gr = 5; gr < TRAGUARDO; gr += 5) {
      var y = (gr / TRAGUARDO) * 100;
      area.appendChild(el("div", { style: "position:absolute;left:0;right:0;bottom:" + y + "%;height:1px;background:rgba(255,255,255,.1);pointer-events:none;z-index:1" }));
      area.appendChild(el("div", { style: "position:absolute;left:0;bottom:" + y + "%;transform:translateY(50%);font-size:.66rem;color:rgba(255,255,255,.35);z-index:1", text: gr }));
    }
    // corsie
    gioc.forEach(function (g, i) {
      var col = el("div", { style: "flex:1;height:100%;position:relative;border-radius:10px;background:rgba(255,255,255,.045)" });
      var da = prev ? prev[i] : g.passi;
      var pedina = el("div", { style: "position:absolute;left:50%;transform:translateX(-50%);bottom:" + (da / TRAGUARDO) * 100 + "%;transition:bottom .9s cubic-bezier(.2,.75,.3,1);display:flex;flex-direction:column;align-items:center;z-index:2" });
      var badge = null;
      if (scelte) {
        // il numero compare subito in un colore neutro (si legge solo la cifra),
        // poi dopo la pausa si colora: verde se avanza, grigio se resta fermo.
        badge = el("div", { style: "font-size:.95rem;font-weight:800;padding:1px 8px;border-radius:12px;margin-bottom:3px;color:#0b1020;background:#e9ecef;opacity:0;transition:opacity .3s,background .3s", text: String(scelte[i]) });
        pedina.appendChild(badge);
      }
      var dot = el("div", { style: "width:24px;height:24px;border-radius:50%;background:" + g.colore + ";border:2px solid rgba(255,255,255,.85);box-shadow:0 2px 6px rgba(0,0,0,.45)" });
      if (outDots) outDots[i] = dot;
      pedina.appendChild(dot);
      col.appendChild(pedina);
      area.appendChild(col);
      if (scelte) {
        // 1) subito: mostra il numero in testa (neutro)
        setTimeout(function () { if (badge) badge.style.opacity = "1"; }, 60);
        // 2) dopo la pausa: colora il numero e fa salire chi avanza
        setTimeout(function () {
          if (badge) badge.style.background = avanza[i] ? "#69db7c" : "#adb5bd";
          pedina.style.bottom = (g.passi / TRAGUARDO) * 100 + "%";
        }, SUSPENSE);
      }
    });
    wrap.appendChild(area);
    // i nomi in una fascia sotto le corsie, così il pallino a gradino 0 non li copre
    var nomi = el("div", { style: "position:absolute;left:8px;right:8px;bottom:7px;display:flex;gap:6px" });
    gioc.forEach(function (g) {
      nomi.appendChild(el("div", { style: "flex:1;text-align:center;font-size:.68rem;font-weight:700;color:" + g.colore + ";text-shadow:0 1px 2px rgba(0,0,0,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px", text: g.nome }));
    });
    wrap.appendChild(nomi);
    return wrap;
  }

  // =========================================================
  //  ONLINE — ognuno dal suo telefono (host-authoritative).
  //  Sempre 4 posti: i giocatori veri entrano, i posti liberi
  //  li riempiono dei bot (il primo è "Matt"). Nella fase di
  //  scelta si vedono tutti; quando uno sceglie, il suo pallino
  //  si illumina e il telefono fa un "bip".
  // =========================================================
  function assicuraStileScala() {
    if (document.getElementById("sg-scala-css")) return;
    var st = document.createElement("style");
    st.id = "sg-scala-css";
    st.textContent = "@keyframes sgScalaPulse{0%,100%{box-shadow:0 0 8px 3px rgba(105,219,124,.55)}50%{box-shadow:0 0 18px 8px rgba(105,219,124,.95)}}.sg-scelto{animation:sgScalaPulse 1s ease-in-out infinite}";
    document.head.appendChild(st);
  }
  function bipScala() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      var ctx = bipScala._c || (bipScala._c = new AC());
      if (ctx.state === "suspended") ctx.resume();
      var o = ctx.createOscillator(), g = ctx.createGain(), n = ctx.currentTime;
      o.type = "triangle"; o.frequency.setValueAtTime(880, n); o.frequency.exponentialRampToValueAtTime(1320, n + 0.08);
      g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(0.25, n + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.2);
      o.connect(g); g.connect(ctx.destination); o.start(n); o.stop(n + 0.22);
    } catch (e) {}
  }
  // fa il "bip" solo per chi ha appena scelto (una volta per giocatore, per round)
  function beepNuove(vm) {
    if (beepStato.round !== vm.nRound) { beepStato.round = vm.nRound; beepStato.ids = {}; }
    vm.posti.forEach(function (p) { if (p.chosen && !beepStato.ids[p.id]) { beepStato.ids[p.id] = true; bipScala(); } });
  }

  function postiPubblici(st) {
    return st.posti.map(function (p) { return { id: p.id, nome: p.nome, colore: p.colore, passi: p.passi, bot: p.bot, chosen: p.scelta != null }; });
  }
  function vmScala(st) {
    var vm = { fase: st.fase, codice: st.codice, pronta: st.pronta, nRound: st.nRound, traguardo: TRAGUARDO,
      posti: postiPubblici(st), deadline: st.deadline || 0,
      scelte: null, avanza: null, prev: null, vincitore: st.vincitore };
    if (st.fase === "rivela") { vm.scelte = st.scelte; vm.avanza = st.avanza; vm.prev = st.prev; }
    return vm;
  }
  function vincitoreDi(st) {
    var top = st.posti.slice().sort(function (a, b) { return b.passi - a.passi; })[0];
    return top ? top.nome : "";
  }

  function hostScala(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaReteScala(t);
    var st = {
      fase: "lobby", codice: "…", pronta: false, nRound: 0, iniziata: false, vincitore: null,
      posti: [{ id: "host", nome: (t.giocatori && t.giocatori[0]) || "Host", colore: COLORI[0], bot: false, passi: 0, scelta: null }],
      deadline: 0, timer: null
    };
    var rete = SGNet.ospita("scalinata", {
      onCodice: function (c) { st.codice = c; bd(); },
      onConnesso: function () { st.pronta = true; bd(); },
      onAddio: function (id) {
        if (st.fase !== "lobby") return; // a partita iniziata i posti restano
        st.posti = st.posti.filter(function (p) { return p.id !== id; });
        st.posti.forEach(function (p, i) { p.colore = COLORI[i]; });
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          if (st.fase === "lobby" && !st.posti.some(function (p) { return p.id === id; }) && st.posti.length < 4)
            st.posti.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), colore: COLORI[st.posti.length], bot: false, passi: 0, scelta: null });
          bd();
        } else if (m.t === "scegli") registraScelta(id, m.n);
      },
      onErrore: function () { senzaReteScala(t); }
    });
    function invia() { rete.invia({ t: "vm", vm: vmScala(st) }); }
    function bd() { invia(); disegna(); }

    function comincia() {
      if (st.iniziata || st.fase !== "lobby") return;
      var b = 0;
      while (st.posti.length < 4) { st.posti.push({ id: "bot" + b, nome: NOMI_BOT[b] || ("Bot " + (b + 1)), colore: COLORI[st.posti.length], bot: true, passi: 0, scelta: null }); b++; }
      st.iniziata = true; st.vincitore = null;
      st.posti.forEach(function (p) { p.passi = 0; });
      nuovaScelta();
    }
    function nuovaScelta() {
      st.nRound += 1; st.fase = "scelta"; st.vincitore = null;
      st.posti.forEach(function (p) { p.scelta = null; });
      st.deadline = Date.now() + SECONDI * 1000;
      bd();
      st.posti.forEach(function (p) {
        if (p.bot) setTimeout(function () { registraScelta(p.id, SCELTE[Math.floor(Math.random() * 3)]); }, 700 + Math.floor(Math.random() * 2200));
      });
      if (st.timer) clearTimeout(st.timer);
      st.timer = setTimeout(chiudiScelte, SECONDI * 1000 + 250);
    }
    function registraScelta(id, n) {
      if (st.fase !== "scelta" || SCELTE.indexOf(n) < 0) return;
      var p = null; st.posti.forEach(function (x) { if (x.id === id) p = x; });
      if (!p || p.scelta != null) return;
      p.scelta = n; bd();
      if (st.posti.every(function (x) { return x.scelta != null; })) { if (st.timer) clearTimeout(st.timer); chiudiScelte(); }
    }
    function chiudiScelte() {
      if (st.fase !== "scelta") return;
      if (st.timer) { clearTimeout(st.timer); st.timer = null; }
      st.posti.forEach(function (p) { if (p.scelta == null) p.scelta = SCELTE[Math.floor(Math.random() * 3)]; });
      var scelte = st.posti.map(function (p) { return p.scelta; });
      var conta = {}; scelte.forEach(function (n) { conta[n] = (conta[n] || 0) + 1; });
      st.prev = st.posti.map(function (p) { return p.passi; });
      st.avanza = st.posti.map(function (p, i) { return conta[scelte[i]] === 1; });
      st.scelte = scelte;
      st.posti.forEach(function (p, i) { if (st.avanza[i]) p.passi = Math.min(TRAGUARDO, p.passi + scelte[i]); });
      st.fase = "rivela"; bd();
    }
    function prossimo() {
      if (st.fase !== "rivela") return;
      if (st.posti.some(function (p) { return p.passi >= TRAGUARDO; })) { st.fase = "fine"; st.vincitore = vincitoreDi(st); bd(); }
      else nuovaScelta();
    }
    function nuova() {
      if (st.timer) { clearTimeout(st.timer); st.timer = null; }
      st.iniziata = false; st.fase = "lobby"; st.nRound = 0; st.vincitore = null;
      st.posti = st.posti.filter(function (p) { return !p.bot; });
      st.posti.forEach(function (p, i) { p.passi = 0; p.scelta = null; p.colore = COLORI[i]; });
      bd();
    }
    var cb = {
      sonoHost: true, myId: "host",
      onScegli: function (n) { registraScelta("host", n); },
      onComincia: comincia, onProssimo: prossimo, onNuova: nuova,
      onEsci: function () { if (st.timer) clearTimeout(st.timer); rete.chiudi(); t.esci(); }
    };
    function disegna() { disegnaScalaVM(t, vmScala(st), cb); }
    disegna();
  }

  function ospiteScala(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaReteScala(t);
    var el = t.el, S = { myId: null, vm: null, rete: null, nome: "", msg: null };
    var cb = {
      sonoHost: false, myId: null,
      onScegli: function (n) { S.rete && S.rete.invia({ t: "scegli", n: n }); },
      onComincia: function () {}, onProssimo: function () {}, onNuova: function () {},
      onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); }
    };
    function disegna() { if (S.vm) { cb.myId = S.myId; disegnaScalaVM(t, S.vm, cb); } }
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🪜", titolo: "Entra nella Scalinata", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
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
        onMsg: function (m) { if (m && m.t === "vm") { S.vm = m.vm; disegna(); } },
        onChiuso: function () { erroreScala(t, "Collegamento perso. L'host potrebbe aver chiuso la partita."); },
        onErrore: function () { erroreScala(t, "Problema di collegamento. Controlla la connessione e riprova."); }
      });
    }
  }

  function erroreScala(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaReteScala(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità \"ognuno dal suo telefono\" funziona quando il gioco è aperto dal sito pubblicato online. Da un file locale non è disponibile: intanto usa \"Un telefono solo\"." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  function rigaGiocatoreScala(el, p, sonoIo) {
    return el("div", { style: "display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;margin-bottom:6px;background:rgba(255,255,255,.06)" }, [
      el("span", { style: "width:16px;height:16px;border-radius:50%;background:" + p.colore }),
      el("span", { style: "flex:1", text: (p.bot ? "🤖 " : "") + p.nome + (sonoIo ? " (tu)" : "") }),
      el("span", { class: "tenue", text: p.bot ? "bot" : "" })
    ]);
  }

  function disegnaScalaVM(t, vm, cb) {
    assicuraStileScala();
    var el = t.el, myId = cb.myId;
    var mio = null; vm.posti.forEach(function (p) { if (p.id === myId) mio = p; });
    if (vm.fase !== "scelta") scenaScelta = null;

    // ---- lobby ----
    if (vm.fase === "lobby") {
      var s = t.schermata({ icona: "🪜", titolo: "La Scalinata · Lobby", sotto: "Ognuno dal suo telefono",
        indietro: function () { if (window.confirm("Uscire?")) cb.onEsci(); } });
      if (cb.sonoHost) {
        s._contenuto.appendChild(el("div", { class: "etichetta", text: "Codice della stanza" }));
        s._contenuto.appendChild(el("div", { class: "codice-stanza", text: (vm.codice || "…").toUpperCase() }));
        if (vm.codice && vm.codice !== "…") {
          var link = SG.creaLink({ gioco: "scalinata", stanza: vm.codice });
          var campo = el("input", { class: "link-campo", type: "text", readonly: "readonly", value: link });
          s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", html: "🔗 Copia il link da mandare",
            onclick: function () { campo.focus(); campo.select(); try { navigator.clipboard.writeText(link); } catch (e) {} } }));
          s._contenuto.appendChild(campo);
        }
        s._contenuto.appendChild(el("div", { style: "margin:8px 0 2px;font-size:.9rem;font-weight:700;color:" + (vm.pronta ? "#69db7c" : "#ffd43b"),
          text: vm.pronta ? "🟢 Stanza pronta — manda il codice agli amici" : "🟡 Sto aprendo la stanza… (attendi il verde)" }));
      }
      s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:12px", text: "Chi c'è (" + vm.posti.length + " di 4)" }));
      vm.posti.forEach(function (p) { s._contenuto.appendChild(rigaGiocatoreScala(el, p, p.id === myId)); });
      var liberi = 4 - vm.posti.length;
      for (var bi = 0; bi < liberi; bi++) {
        s._contenuto.appendChild(el("div", { style: "display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;margin-bottom:6px;background:rgba(255,255,255,.03);opacity:.6" }, [
          el("span", { style: "width:16px;height:16px;border-radius:50%;background:" + COLORI[vm.posti.length + bi] }),
          el("span", { style: "flex:1", text: "🤖 " + (NOMI_BOT[bi] || ("Bot " + (bi + 1))) }),
          el("span", { class: "tenue", text: "bot" })
        ]));
      }
      if (cb.sonoHost) {
        s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Comincia ▶", onclick: cb.onComincia }));
        if (liberi > 0) s._piede.appendChild(el("p", { class: "modulo-nota", text: "I " + liberi + " posti liberi li riempiono dei bot." }));
      } else s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa che l'host cominci…" }));
      return t.mostra(s);
    }

    var gioc = vm.posti.map(function (p) { return { nome: p.nome, colore: p.colore, passi: p.passi }; });

    // ---- fine ----
    if (vm.fase === "fine") {
      var sf = t.schermata({ icona: "🏆", titolo: "Vince " + (vm.vincitore || "") + "!", sotto: "La Scalinata" });
      var ordine = vm.posti.slice().sort(function (a, b) { return b.passi - a.passi; });
      var ol = el("ol", { class: "classifica" });
      ordine.forEach(function (p, i) {
        ol.appendChild(el("li", { class: i === 0 ? "vincitore" : "" }, [
          el("span", { class: "pos", text: (i + 1) + "°" }),
          el("span", { class: "nome", text: (p.bot ? "🤖 " : "") + p.nome }),
          el("span", { class: "punti", text: p.passi + "🪜" })
        ]));
      });
      sf._contenuto.appendChild(ol);
      if (cb.sonoHost) {
        sf._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Nuova partita", onclick: cb.onNuova }));
        sf._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Chiudi", onclick: cb.onEsci }));
      } else sf._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa dell'host per un'altra partita…" }));
      return t.mostra(sf);
    }

    // ---- rivela ----
    if (vm.fase === "rivela") {
      var sr = t.schermata({ icona: "🪜", titolo: "Si scopre!", sotto: "Round " + vm.nRound });
      sr._contenuto.appendChild(disegnaScala(t, gioc, vm.scelte, vm.avanza, vm.prev));
      if (cb.sonoHost) {
        var finito = vm.posti.some(function (p) { return p.passi >= vm.traguardo; });
        var av = el("button", { class: "btn btn-primario", text: finito ? "Vedi il podio 🏆" : "Prossimo round ▶", onclick: cb.onProssimo });
        av.setAttribute("style", "opacity:0;pointer-events:none;transition:opacity .4s");
        setTimeout(function () { av.style.opacity = "1"; av.style.pointerEvents = "auto"; }, SUSPENSE);
        sr._piede.appendChild(av);
      } else sr._piede.appendChild(el("p", { class: "modulo-nota", text: "Aspetta il prossimo round…" }));
      return t.mostra(sr);
    }

    // ---- scelta ----
    // Aggiornamento IN-PLACE: se stiamo già mostrando la scelta di questo round,
    // non ridisegniamo nulla (niente sfarfallio): illuminiamo solo il pallino di
    // chi ha appena scelto, facciamo il bip e togliamo i miei tasti se ho scelto.
    if (scenaScelta && scenaScelta.round === vm.nRound && document.body.contains(scenaScelta.root)) {
      beepNuove(vm);
      vm.posti.forEach(function (p, i) { var d = scenaScelta.dots[i]; if (d) d.className = p.chosen ? "sg-scelto" : ""; });
      if (mio && mio.chosen && scenaScelta.btnWrap && scenaScelta.btnWrap.parentNode) {
        scenaScelta.btnWrap.parentNode.removeChild(scenaScelta.btnWrap);
        scenaScelta.btnWrap = null;
        if (scenaScelta.attesa) scenaScelta.attesa.hidden = false;
      }
      return;
    }

    // costruzione della schermata (una volta per round)
    beepNuove(vm);
    var s = t.schermata({ icona: "🪜", titolo: "Round " + vm.nRound, sotto: "Verso il gradino " + vm.traguardo,
      indietro: function () { if (window.confirm("Uscire dalla partita?")) cb.onEsci(); } });
    var outDots = [];
    s._contenuto.appendChild(disegnaScala(t, gioc, null, null, null, outDots));
    vm.posti.forEach(function (p, i) { if (p.chosen && outDots[i]) outDots[i].className = "sg-scelto"; });

    var timerBox = el("div", { style: "text-align:center;font-size:1.9rem;font-weight:800;margin:6px 0 2px" });
    function tick() { timerBox.textContent = Math.max(0, Math.ceil((vm.deadline - Date.now()) / 1000)); }
    tick();
    var itv = setInterval(function () { if (!document.body.contains(timerBox)) return clearInterval(itv); tick(); }, 300);
    s._contenuto.appendChild(timerBox);

    var attesa = el("p", { class: "modulo-nota", style: "text-align:center", text: "Hai scelto! Il tuo pallino è acceso, aspetta gli altri…", hidden: "hidden" });
    var btnWrap = null;
    if (mio && !mio.bot && !mio.chosen) {
      btnWrap = el("div", { style: "display:flex;gap:12px;justify-content:center;margin-top:2px" });
      SCELTE.forEach(function (n) {
        btnWrap.appendChild(el("button", { style: "flex:1;max-width:130px;padding:22px 0;border-radius:18px;border:0;cursor:pointer;color:#08210f;font-weight:800;background:" + coloreScelta(n) + ";box-shadow:0 4px 10px rgba(0,0,0,.3)", onclick: function () { cb.onScegli(n); } }, [
          el("div", { style: "font-size:2.4rem;line-height:1", text: String(n) }),
          el("div", { style: "font-size:.8rem;font-weight:700;opacity:.8", text: n === 1 ? "gradino" : "gradini" })
        ]));
      });
      s._contenuto.appendChild(btnWrap);
    } else if (mio && mio.chosen) {
      attesa.hidden = false;
    }
    s._contenuto.appendChild(attesa);

    scenaScelta = { round: vm.nRound, root: s._contenuto, dots: outDots, btnWrap: btnWrap, attesa: attesa };
    t.mostra(s);
  }

  function finePartita(t, st) {
    var classifica = st.g.slice()
      .sort(function (a, b) { return b.passi - a.passi; })
      .map(function (g) { return { nome: g.nome, punti: g.passi + "🪜" }; });
    t.fine(classifica);
  }
})();

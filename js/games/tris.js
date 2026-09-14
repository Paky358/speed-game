/* =========================================================
   GIOCO — "Tris" (filetto / tic-tac-toe)
   Tre modalità:
     • Contro il bot (da solo): Facile / Medio / Impossibile.
     • In due sullo stesso telefono: X e O a turno.
     • Online, ognuno dal suo telefono: l'host è X, l'ospite è O
       (host-autoritativo, stesso collegamento a turni degli altri giochi).
   X e O si alternano nel muovere per primi a ogni rivincita (equità).
   ========================================================= */
(function () {
  "use strict";

  var LINEE = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  var CX = "#4dabf7", CO = "#ff6b6b";

  function altro(s) { return s === "X" ? "O" : "X"; }
  function libere(b) { var o = []; for (var i = 0; i < 9; i++) if (!b[i]) o.push(i); return o; }
  function pieno(b) { for (var i = 0; i < 9; i++) if (!b[i]) return false; return true; }
  function vincitore(b) {
    for (var k = 0; k < LINEE.length; k++) {
      var l = LINEE[k];
      if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return { s: b[l[0]], linea: l };
    }
    return null;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // suono: un pennarello che scrive veloce (raffica di rumore filtrato con qualche "tratto")
  function suonoPenna() {
    try { if (navigator.vibrate) navigator.vibrate(18); } catch (e) {}
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t = ctx.currentTime, dur = 0.2;
      var buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      var src = ctx.createBufferSource(); src.buffer = buf;
      var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 900;
      var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1950; bp.Q.value = 0.9;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      // envelope "a tratti": qualche picco rapido = scarabocchio veloce
      var seq = [[0.012, 0.30], [0.05, 0.12], [0.085, 0.28], [0.12, 0.10], [0.155, 0.22], [0.2, 0]];
      seq.forEach(function (s) { g.gain.linearRampToValueAtTime(s[1], t + s[0]); });
      src.connect(hp); hp.connect(bp); bp.connect(g); g.connect(ctx.destination);
      src.start(t); src.stop(t + dur + 0.02);
    } catch (e) {}
  }

  // ---- bot ----
  function vinceCon(b, s) { for (var i = 0; i < 9; i++) { if (b[i]) continue; b[i] = s; var w = vincitore(b); b[i] = null; if (w && w.s === s) return i; } return -1; }
  function minimax(b, me, turno, prof) {
    var w = vincitore(b);
    if (w) return { punti: w.s === me ? (10 - prof) : (prof - 10) };
    var libs = libere(b);
    if (!libs.length) return { punti: 0 };
    var best = null;
    for (var k = 0; k < libs.length; k++) {
      var i = libs[k];
      b[i] = turno;
      var r = minimax(b, me, altro(turno), prof + 1);
      b[i] = null;
      if (turno === me) { if (!best || r.punti > best.punti) best = { punti: r.punti, mossa: i }; }
      else { if (!best || r.punti < best.punti) best = { punti: r.punti, mossa: i }; }
    }
    return best;
  }
  function mossaBot(b, me, liv) {
    var libs = libere(b);
    if (!libs.length) return -1;
    if (liv === "facile") return libs[Math.floor(Math.random() * libs.length)];
    if (liv === "medio") {
      var v = vinceCon(b, me); if (v >= 0) return v;             // vinci se puoi
      var bl = vinceCon(b, altro(me)); if (bl >= 0) return bl;   // altrimenti blocca
      return libs[Math.floor(Math.random() * libs.length)];      // altrimenti a caso (battibile)
    }
    var r = minimax(b.slice(), me, me, 0);                        // impossibile: mai battuto
    return (r && r.mossa != null) ? r.mossa : libs[0];
  }

  SG.registra({
    id: "tris",
    nome: "Tris",
    icona: "⭕",
    descrizione: "Il filetto classico: allinea tre simboli. Da solo contro il bot, in due sullo stesso telefono o online.",
    giocatoriMin: 1, giocatoriMax: 2, difficolta: 1,
    regole: [
      "A turno si mette il proprio simbolo (<b>X</b> o <b>O</b>) in una casella libera della griglia 3×3.",
      "Vince chi per primo allinea <b>tre</b> simboli uguali: in orizzontale, verticale o diagonale.",
      "Se si riempie tutto senza allineamenti, è <b>pareggio</b>.",
      "Modalità: <b>contro il bot</b> (Facile / Medio / Impossibile), <b>in due sullo stesso telefono</b>, oppure <b>online</b> (ognuno dal suo, uno apre la stanza e l'altro entra col codice)."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = "bot"; dove.difficolta = "medio"; dove.torneo = !!aiuti.torneo;
      if (aiuti.torneo) { dove.modo = "telefono"; return; } // nel torneo: in due, stesso telefono
      var bBot, bTel, bOnl, boxDiff, notaOnline;
      function sel(m) {
        dove.modo = m;
        bBot.className = "modo-chip" + (m === "bot" ? " attiva" : "");
        bTel.className = "modo-chip" + (m === "telefono" ? " attiva" : "");
        bOnl.className = "modo-chip" + (m === "online" ? " attiva" : "");
        boxDiff.hidden = (m !== "bot");
        notaOnline.hidden = (m !== "online");
      }
      bBot = el("button", { class: "modo-chip attiva", onclick: function () { sel("bot"); } }, [
        el("span", { class: "mi", text: "🤖" }), el("div", {}, [el("div", { class: "mt", text: "Contro il bot" }), el("div", { class: "ms", text: "Da solo" })])]);
      bTel = el("button", { class: "modo-chip", onclick: function () { sel("telefono"); } }, [
        el("span", { class: "mi", text: "📱" }), el("div", {}, [el("div", { class: "mt", text: "In due" }), el("div", { class: "ms", text: "Stesso telefono" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { sel("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Online" }), el("div", { class: "ms", text: "Ognuno dal suo" })])]);
      box.appendChild(el("div", { class: "etichetta", text: "Come giocare" }));
      box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr 1fr" }, [bBot, bTel, bOnl]));

      boxDiff = el("div", {});
      boxDiff.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura del bot" }));
      var diffWrap = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["impossibile", "Impossibile"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.difficolta = d[0];
          [].forEach.call(diffWrap.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; });
          b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: d[1] })]);
        b.style.flex = "1";
        diffWrap.appendChild(b);
      });
      boxDiff.appendChild(diffWrap);
      box.appendChild(boxDiff);

      notaOnline = el("div", { class: "link-avviso", hidden: "hidden" });
      notaOnline.textContent = (window.SGNet && SGNet.disponibile())
        ? "Apri una stanza e manda il codice: l'altro entra dal suo telefono."
        : "Qui il collegamento non è disponibile: funziona quando il gioco è aperto dal sito pubblicato online.";
      box.appendChild(notaOnline);
    },

    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return ospiteTris(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostTris(t);
      return localeTris(t, imp.modo === "telefono" ? "telefono" : "bot", imp.difficolta || "medio", !!imp.torneo);
    }
  });

  // =========================================================
  //  DISEGNO DEL CAMPO (uguale per tutte le modalità)
  //  vm  = { fase:"gioco"|"fine", board:[9], turno:"X"|"O", fine:{vincitore,linea}|null, nomi:{X,O} }
  //  cb  = { mio:"X"|"O"|null, bot, locale, sonoHost, onCella(i), onRivincita, onEsci }
  // =========================================================
  function statoHtml(vm, cb) {
    if (vm.fase === "fine") {
      if (vm.fine && vm.fine.vincitore) {
        var col = vm.fine.vincitore === "X" ? CX : CO;
        return "🏆 Vince <span style='color:" + col + "'>" + esc(vm.nomi[vm.fine.vincitore]) + "</span>!";
      }
      return "🤝 Pareggio!";
    }
    var c = vm.turno === "X" ? CX : CO;
    if (cb.mio && cb.mio === vm.turno) return "Tocca a <b>te</b>";
    if (cb.mio && cb.mio !== vm.turno) return cb.bot ? "🤖 Il bot sta pensando…" : "Tocca a <span style='color:" + c + "'>" + esc(vm.nomi[vm.turno]) + "</span>";
    return "Tocca a <span style='color:" + c + "'>" + esc(vm.nomi[vm.turno]) + "</span>";
  }
  function cellaStile(v, vinc, puoi) {
    var col = v === "X" ? CX : v === "O" ? CO : "#fff";
    var bg = vinc ? "rgba(105,219,124,.28)" : "rgba(255,255,255,.06)";
    var bd = vinc ? "2px solid #69db7c" : "1px solid rgba(255,255,255,.12)";
    return "aspect-ratio:1;border-radius:14px;border:" + bd + ";background:" + bg + ";color:" + col +
      ";font-size:clamp(2.2rem,14vw,3.4rem);font-weight:800;display:flex;align-items:center;justify-content:center;" +
      "cursor:" + (puoi ? "pointer" : "default") + ";-webkit-tap-highlight-color:transparent;transition:background .15s,transform .05s";
  }
  var trMount = null; // schermata Tris montata: a ogni mossa aggiorniamo solo il contenuto (niente lampeggio)
  function campoTris(t, vm, cb) {
    var el = t.el;
    var box = el("div", {});
    box.appendChild(el("div", { style: "text-align:center;font-weight:800;font-size:1.2rem;margin:6px 0 12px;min-height:1.4em", html: statoHtml(vm, cb) }));
    var grid = el("div", { style: "display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:min(86vw,330px);margin:0 auto" });
    vm.board.forEach(function (v, i) {
      var vinc = !!(vm.fine && vm.fine.linea && vm.fine.linea.indexOf(i) >= 0);
      var puoi = vm.fase === "gioco" && v == null && (cb.mio == null || cb.mio === vm.turno);
      grid.appendChild(el("button", { style: cellaStile(v, vinc, puoi), onclick: puoi ? function () { cb.onCella(i); } : null },
        [el("span", { text: v || "" })]));
    });
    box.appendChild(grid);

    var piedeNodi = [];
    if (vm.fase === "fine") {
      if (cb.locale || cb.sonoHost) {
        piedeNodi.push(el("button", { class: "btn btn-primario", text: "🔄 Rivincita", onclick: cb.onRivincita }));
        piedeNodi.push(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
      } else {
        piedeNodi.push(el("p", { class: "modulo-nota", text: "In attesa dell'host per la rivincita…" }));
      }
    }

    // ---- montaggio: prima volta creo la schermata, poi aggiorno SOLO il contenuto (schermo fisso) ----
    if (trMount && trMount.cont && document.body.contains(trMount.box)) {
      trMount.cont.replaceChild(box, trMount.box); trMount.box = box;
      trMount.piede.innerHTML = ""; piedeNodi.forEach(function (n) { trMount.piede.appendChild(n); });
    } else {
      var sotto = vm.nomi.X + " (X) · " + vm.nomi.O + " (O)";
      var s = t.schermata({ icona: "⭕", titolo: "Tris", sotto: sotto,
        indietro: function () { if (window.confirm("Uscire dalla partita?")) cb.onEsci(); } });
      s._contenuto.appendChild(box); piedeNodi.forEach(function (n) { s._piede.appendChild(n); }); t.mostra(s);
      trMount = { cont: s._contenuto, box: box, piede: s._piede };
    }
  }

  // =========================================================
  //  LOCALE — contro il bot oppure in due sullo stesso telefono
  // =========================================================
  function localeTris(t, modo, difficolta, torneo) {
    var nomi = modo === "bot"
      ? { X: (t.giocatori[0] || "Tu"), O: "🤖 Bot" }
      : { X: (t.giocatori[0] || "Giocatore 1"), O: (t.giocatori[1] || "Giocatore 2") };
    var primo = "X", st;

    function render() {
      var vm = { fase: st.fine ? "fine" : "gioco", board: st.board, turno: st.turno, fine: st.fine, nomi: nomi };
      campoTris(t, vm, {
        locale: true, bot: modo === "bot", mio: modo === "bot" ? "X" : null,
        onCella: function (i) { gioca(i); },
        onRivincita: function () { primo = altro(primo); nuova(); },
        onEsci: t.esci
      });
    }
    function gioca(i) {
      if (st.fine || st.board[i]) return;
      st.board[i] = st.turno; suonoPenna();
      var w = vincitore(st.board);
      if (w) st.fine = { vincitore: w.s, linea: w.linea };
      else if (pieno(st.board)) st.fine = { vincitore: null, linea: null };
      else st.turno = altro(st.turno);
      if (st.fine && torneo) return t.fine(classifica());
      render();
      if (!st.fine && modo === "bot" && st.turno === "O") pensaBot();
    }
    function pensaBot() {
      setTimeout(function () { if (!st.fine) gioca(mossaBot(st.board.slice(), "O", difficolta)); }, 450 + Math.random() * 350);
    }
    function classifica() {
      if (!st.fine.vincitore) return [{ nome: nomi.X }, { nome: nomi.O }]; // pareggio
      return st.fine.vincitore === "X" ? [{ nome: nomi.X }, { nome: nomi.O }] : [{ nome: nomi.O }, { nome: nomi.X }];
    }
    function nuova() {
      st = { board: [null, null, null, null, null, null, null, null, null], turno: primo, fine: null };
      render();
      if (modo === "bot" && st.turno === "O") pensaBot();
    }
    nuova();
  }

  // =========================================================
  //  ONLINE — host è X, ospite è O (host-autoritativo, a turni)
  // =========================================================
  function boardVuota() { return [null, null, null, null, null, null, null, null, null]; }

  function hostTris(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var st = {
      fase: "lobby", codice: "…", pronta: false,
      board: boardVuota(), turno: "X", fine: null, primo: "X",
      nomiX: (t.giocatori && t.giocatori[0]) || "Host", nomiO: null, avvId: null
    };
    var rete = SGNet.ospita("tris", {
      onCodice: function (c) { st.codice = c; bd(); },
      onConnesso: function () { st.pronta = true; bd(); },
      onAddio: function (id) { if (id === st.avvId) { st.avvId = null; st.nomiO = null; if (st.fase !== "lobby") { st.fase = "lobby"; } bd(); } },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") { if (!st.avvId) { st.avvId = id; st.nomiO = String(m.nome || "Avversario").slice(0, 16); } bd(); }
        else if (m.t === "mossa") { if (st.fase === "gioco" && st.turno === "O" && id === st.avvId) applica(m.i); }
      },
      onErrore: function () { senzaRete(t); }
    });
    function vm() {
      return { fase: st.fase, codice: st.codice, pronta: st.pronta, board: st.board, turno: st.turno,
        fine: st.fine, nomi: { X: st.nomiX, O: st.nomiO || "Avversario" }, avversario: !!st.avvId };
    }
    function bd() { rete.invia({ t: "vm", vm: vm() }); disegna(); }
    function applica(i) {
      if (st.fase !== "gioco" || st.fine || st.board[i] != null) return;
      st.board[i] = st.turno; suonoPenna();
      var w = vincitore(st.board);
      if (w) { st.fine = { vincitore: w.s, linea: w.linea }; st.fase = "fine"; }
      else if (pieno(st.board)) { st.fine = { vincitore: null, linea: null }; st.fase = "fine"; }
      else st.turno = altro(st.turno);
      bd();
    }
    function comincia() {
      if (st.fase !== "lobby" || !st.avvId) return;
      st.board = boardVuota(); st.turno = st.primo; st.fine = null; st.fase = "gioco"; bd();
    }
    function rivincita() {
      st.primo = altro(st.primo); st.board = boardVuota(); st.turno = st.primo; st.fine = null; st.fase = "gioco"; bd();
    }
    var cb = {
      sonoHost: true, mio: "X",
      onCella: function (i) { if (st.fase === "gioco" && st.turno === "X") applica(i); },
      onComincia: comincia, onRivincita: rivincita,
      onEsci: function () { rete.chiudi(); t.esci(); }
    };
    function disegna() { disegnaVM(t, vm(), cb); }
    disegna();
  }

  function ospiteTris(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { myId: null, vm: null, rete: null, nome: "", msg: null, lastCount: 0 };
    var cb = {
      sonoHost: false, mio: "O",
      onCella: function (i) { S.rete && S.rete.invia({ t: "mossa", i: i }); },
      onComincia: function () {}, onRivincita: function () {},
      onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); }
    };
    function disegna() { if (S.vm) disegnaVM(t, S.vm, cb); }
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "⭕", titolo: "Entra nel Tris", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      S.msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(S.msg);
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "Amico").trim() || "Amico"; S.msg.textContent = "Collegamento in corso…"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome });
          setTimeout(function () { if (!S.vm && S.msg) S.msg.textContent = "Non trovo la partita: controlla il codice, o l'host non ha ancora aperto la stanza…"; }, 8000); },
        onMsg: function (m) { if (m && m.t === "vm") {
          var n = 0; if (m.vm && m.vm.board) for (var i = 0; i < m.vm.board.length; i++) if (m.vm.board[i]) n++;
          if (n > S.lastCount && m.vm.fase !== "lobby") suonoPenna();
          S.lastCount = n;
          S.vm = m.vm; disegna();
        } },
        onChiuso: function () { errore(t, "Collegamento perso. L'host potrebbe aver chiuso la partita."); },
        onErrore: function () { errore(t, "Problema di collegamento. Controlla la connessione e riprova."); }
      });
    }
  }

  function disegnaVM(t, vm, cb) {
    if (vm.fase === "lobby") return lobbyTris(t, vm, cb);
    campoTris(t, vm, cb);
  }

  function lobbyTris(t, vm, cb) {
    var el = t.el;
    var s = t.schermata({ icona: "⭕", titolo: "Tris · Lobby", sotto: "Ognuno dal suo telefono",
      indietro: function () { if (window.confirm("Uscire?")) cb.onEsci(); } });
    if (cb.sonoHost) {
      s._contenuto.appendChild(el("div", { class: "etichetta", text: "Codice della stanza" }));
      s._contenuto.appendChild(el("div", { class: "codice-stanza", text: (vm.codice || "…").toUpperCase() }));
      if (vm.codice && vm.codice !== "…") {
        var link = SG.creaLink({ gioco: "tris", stanza: vm.codice });
        var campo = el("input", { class: "link-campo", type: "text", readonly: "readonly", value: link });
        s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", html: "🔗 Copia il link da mandare",
          onclick: function () { campo.focus(); campo.select(); try { navigator.clipboard.writeText(link); } catch (e) {} } }));
        s._contenuto.appendChild(campo);
      }
      s._contenuto.appendChild(el("div", { style: "margin:8px 0 2px;font-size:.9rem;font-weight:700;color:" + (vm.pronta ? "#69db7c" : "#ffd43b"),
        text: vm.pronta ? "🟢 Stanza pronta — manda il codice" : "🟡 Sto aprendo la stanza…" }));
      s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "margin-top:10px",
        text: vm.avversario ? "✅ Avversario collegato!" : "In attesa dell'avversario…" }));
      var b = el("button", { class: "btn btn-primario", text: "Comincia ▶", onclick: cb.onComincia });
      if (!vm.avversario) b.setAttribute("disabled", "disabled");
      s._piede.appendChild(b);
    } else {
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-weight:700;color:#69db7c;margin:6px 0 2px", text: "✅ Sei nella stanza" }));
      s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Chi c'è" }));
      [["X", vm.nomi.X, CX], ["O", vm.nomi.O, CO]].forEach(function (p) {
        var mio = (p[0] === cb.mio);
        s._contenuto.appendChild(el("div", { style: "display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;margin-bottom:6px;background:" + (mio ? "rgba(255,202,58,.18)" : "rgba(255,255,255,.06)") + (mio ? ";border:1px solid var(--accento)" : "") }, [
          el("span", { style: "width:16px;height:16px;border-radius:50%;flex:0 0 auto;background:" + p[2] }),
          el("span", { style: "flex:1;font-weight:700", text: p[1] + (mio ? " (tu)" : "") + " (" + p[0] + ")" })
        ]));
      });
      s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa che l'host cominci…" }));
    }
    t.mostra(s);
  }

  function errore(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità online funziona quando il gioco è aperto dal sito pubblicato. Da un file locale non è disponibile: intanto gioca contro il bot o in due sullo stesso telefono." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
})();

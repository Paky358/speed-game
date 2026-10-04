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
    if (liv === "difficile") {   // difficile: forte, ma ogni tanto si distrae (si può battere); se può vincere, vince
      var vd = vinceCon(b, me); if (vd >= 0) return vd;
      if (Math.random() < 0.15) return libs[Math.floor(Math.random() * libs.length)];   // (simulato: un giocatore normale lo batte ~1 volta su 5)
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
    modi: [{ modo: "bot", icona: "🤖", nome: "Contro il computer", sotto: "Giochi da solo contro il bot" },
      { modo: "telefono", icona: "📱", nome: "In due su questo telefono", sotto: "Vi passate il telefono a ogni mossa", amici: true }],
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
      if (!aiuti.modo) {
        box.appendChild(el("div", { class: "etichetta", text: "Come giocare" }));
        box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr 1fr" }, [bBot, bTel, bOnl]));
      }

      boxDiff = el("div", {});
      boxDiff.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura del bot" }));
      var diffWrap = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"], ["impossibile", "Impossibile"]].forEach(function (d) {
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
      if (aiuti.modo) { sel(aiuti.modo); notaOnline.hidden = true; }
    },

    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return t.linkParams.guarda ? guardaTris(t, t.linkParams.stanza) : ospiteTris(t, t.linkParams.stanza);
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
  // ---- trofei: a fine partita si contano solo per chi ha il profilo su questo telefono ----
  // (contro il bot e online sei tu; in due sullo stesso telefono conta chi ha il nome del profilo)
  var TT = { fatta: null };
  function trofeiTris(vm, cb) {
    if (cb.guarda) return;   // chi guarda non gioca
    if (vm.fase !== "fine" || !vm.fine) { TT.fatta = null; return; }
    var chiave = vm.board.join(",") + "|" + vm.fine.vincitore;
    if (TT.fatta === chiave) return; TT.fatta = chiave;
    if (!(window.SGNube && SGNube.disponibile() && SGNube.profilo())) return;
    var io = cb.mio, nm = String(SGNube.profilo().nome || "").trim().toLowerCase();
    if (!io) io = String(vm.nomi.X || "").trim().toLowerCase() === nm ? "X" : (String(vm.nomi.O || "").trim().toLowerCase() === nm ? "O" : null);
    if (!io) return;
    var w = vm.fine.vincitore, vinta = w === io, pari = !w, online = !cb.locale, bot = !!cb.bot, liv = cb.liv;
    var miei = vm.board.filter(function (x) { return x === io; }).length, lin = (vm.fine.linea || []).join(",");
    var s0 = SGNube.statGioco("tris") || {};
    var c = { partite: 1, vinte: vinta, pareggi: pari, online: online, vinteOnline: online && vinta,
      vinteFacile: bot && liv === "facile" && vinta, vinteMedio: bot && liv === "medio" && vinta, vinteDifficile: bot && liv === "difficile" && vinta,
      vinteDiagonale: vinta && (lin === "0,4,8" || lin === "2,4,6"), vinteIn3: vinta && miei === 3 && !(bot && liv === "facile"), simboli: miei };   // (contro il Facile, che gioca a caso, non vale)
    var sPar = pari ? (s0.serieParOra || 0) + 1 : 0;                                                          // pareggi di fila (qualsiasi modo)
    var sOn = online ? (vinta ? (s0.serieOnlineOra || 0) + 1 : 0) : (s0.serieOnlineOra || 0);                 // vittorie online di fila
    var sDif = bot && liv === "difficile" ? (vinta || pari ? (s0.serieImbDiffOra || 0) + 1 : 0) : (s0.serieImbDiffOra || 0);   // imbattuto contro il Difficile
    var incrs = []; for (var k in c) if (c[k]) incrs.push([k, +c[k]]);
    SGNube.salvaProgressi(null, "tris", incrs, [["serieParMax", sPar], ["serieOnlineMax", sOn], ["serieImbDiffMax", sDif]],
      [["serieParOra", sPar], ["serieOnlineOra", sOn], ["serieImbDiffOra", sDif]]);
  }
  var trMount = null; // schermata Tris montata: a ogni mossa aggiorniamo solo il contenuto (niente lampeggio)
  function campoTris(t, vm, cb) {
    trofeiTris(vm, cb);
    var el = t.el;
    var box = el("div", {});
    if (cb.guarda) box.appendChild(el("div", { class: "guarda-riga", html: "👀 <span style='color:" + CX + "'>" + esc(vm.nomi.X) + "</span> 🆚 <span style='color:" + CO + "'>" + esc(vm.nomi.O) + "</span>" }));
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
      if (cb.guarda) {
        piedeNodi.push(el("p", { class: "modulo-nota", text: vm.fine && vm.fine.vincitore ? "Tra poco si torna al tabellone…" : "Pareggio: si rigioca!" }));
      } else if (cb.locale || cb.sonoHost) {
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
        indietro: function () { if (cb.guarda || window.confirm("Uscire dalla partita?")) cb.onEsci(); } });
      s.classList.add("tavolo-centro");   // il tavolo sta al centro dello schermo
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
      if (t.trasmetti) t.trasmetti({ t: "vm", vm: vm });   // torneo a eliminazione: gli altri guardano la partita col bot
      campoTris(t, vm, {
        locale: true, bot: modo === "bot", mio: modo === "bot" ? "X" : null, liv: difficolta,
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
      // torneo a eliminazione: chi ha vinto (pari = stesso posto, si rigioca)
      if (st.fine && t.risultato) t.risultato(classifica().map(function (r, i) { return { nome: r.nome, pos: st.fine.vincitore ? i + 1 : 1 }; }));
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
      nomiX: (t.giocatori && t.giocatori[0]) || "Host", nomiO: null, avvId: null, ominoX: t.mioOmino ? t.mioOmino() : null, ominoO: null
    };
    var rete = SGNet.ospita("tris", {
      onCodice: function (c) { st.codice = c; bd(); },
      onConnesso: function () { st.pronta = true; bd(); },
      onAddio: function (id) { if (id === st.avvId) { st.avvId = null; st.nomiO = null; if (st.fase !== "lobby") { st.fase = "lobby"; } bd(); } },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") { if (!st.avvId) { st.avvId = id; st.nomiO = String(m.nome || "Avversario").slice(0, 16); st.ominoO = avatarOk(m.omino); } bd(); }
        else if (m.t === "mossa") { if (st.fase === "gioco" && st.turno === "O" && id === st.avvId) applica(m.i); }
      },
      onErrore: function () { senzaRete(t); }
    });
    function vm() {
      return { fase: st.fase, codice: st.codice, pronta: st.pronta, board: st.board, turno: st.turno,
        fine: st.fine, nomi: { X: st.nomiX, O: st.nomiO || "Avversario" }, avversario: !!st.avvId, avvId: st.avvId, omini: { X: st.ominoX, O: st.avvId ? st.ominoO : null } };
    }
    function bd() { rete.invia({ t: "vm", vm: vm() }); disegna(); }
    function applica(i) {
      if (st.fase !== "gioco" || st.fine || st.board[i] != null) return;
      st.board[i] = st.turno; suonoPenna();
      var w = vincitore(st.board);
      if (w) { st.fine = { vincitore: w.s, linea: w.linea }; st.fase = "fine"; }
      else if (pieno(st.board)) { st.fine = { vincitore: null, linea: null }; st.fase = "fine"; }
      // per il torneo online: chi ha vinto (pari = stesso posto)
      if (st.fine && t.risultato) t.risultato(st.fine.vincitore === "O" ? [{ nome: st.nomiO, pos: 1 }, { nome: st.nomiX, pos: 2 }]
        : [{ nome: st.nomiX, pos: 1 }, { nome: st.nomiO, pos: st.fine.vincitore ? 2 : 1 }]);
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
      var bEntra = el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "Amico").trim() || "Amico"; S.msg.textContent = "Collegamento in corso…"; collega();
      } });
      s._piede.appendChild(bEntra);
      t.mostra(s);
      if (t.nomeProfilo && t.nomeProfilo()) { input.value = t.nomeProfilo(); bEntra.click(); }   // entra da solo col nome del profilo di questo telefono
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : null });
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

  // chi guarda una partita del torneo a eliminazione: la vede in diretta, senza poter toccare
  function guardaTris(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var rete = null, scritta = null;   // (chi guarda: niente suoni, farebbero vibrare il telefono)
    var cb = { guarda: true, sonoHost: false, mio: "-", onCella: function () {}, onRivincita: function () {},
      onEsci: function () { if (rete) rete.chiudi(); t.esci(); } };
    function attesa(txt) {
      if (scritta === txt) return; scritta = txt;
      var s = t.schermata({ indietro: cb.onEsci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota guarda-attesa", text: txt }));
      t.mostra(s);
    }
    attesa("👀 Mi collego alla partita…");
    rete = SGNet.entra(codice, {
      onMsg: function (m) {
        if (!m || m.t !== "vm" || !m.vm || !m.vm.board) return;
        if (m.vm.fase === "lobby") return attesa("👀 La partita sta per cominciare…");
        scritta = null;
        campoTris(t, m.vm, cb);
      },
      onChiuso: function () { cb.onEsci(); },   // partita finita e chiusa: si torna al tabellone
      onErrore: function () { errore(t, "Problema di collegamento. Controlla la connessione e riprova."); }
    });
  }

  function disegnaVM(t, vm, cb) {
    if (vm.fase === "lobby") return lobbyTris(t, vm, cb);
    campoTris(t, vm, cb);
  }

  function avatarOk(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  // la saletta d'attesa (uguale per tutti i giochi): tu e il tuo avversario
  function lobbyTris(t, vm, cb) {
    var om = vm.omini || {}, gio = [{ id: "X", nome: vm.nomi.X, omino: om.X || null, host: true, tu: cb.sonoHost }];
    if (vm.avversario) gio.push({ id: "O", nome: vm.nomi.O, omino: om.O || null, tu: !cb.sonoHost });
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 2, vuoti: vm.avversario ? 0 : 1, giocatori: gio,
      nota: cb.sonoHost ? (vm.avversario ? "✅ Avversario collegato! Quando vuoi, comincia." : "Manda il link: aspettiamo il tuo avversario.") : null,
      attesa: "Aspetta che l'host cominci: tu giochi con il cerchio ⭕.", onComincia: cb.onComincia, onEsci: cb.onEsci });
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

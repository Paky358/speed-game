/* =========================================================
   GIOCO — "Drop 4" (quattro in fila / a gravità)
   Griglia 7 colonne × 6 righe (42 caselle), struttura grigia.
   Giocatore 1 = pedine GIALLE (inizia), Giocatore 2 = pedine BIANCHE.
   Si sceglie una colonna: la pedina CADE in fondo, sul primo posto
   libero. Vince chi allinea 4 pedine (orizzontale, verticale o
   diagonale). Se si riempie tutto senza allineamenti: pareggio.
   Tre modalità: contro il bot (Facile/Medio/Difficile),
   in due sullo stesso telefono, oppure online (host=Giallo, ospite=Bianco).
   ========================================================= */
(function () {
  "use strict";

  var COLS = 7, ROWS = 6, PROF = 4;
  var CG = "#ffd43b", CB = "#f8f9fa";          // giallo, bianco
  var HOLE = "#1b2340", GRIGLIA = "#5b6472";   // buco vuoto, struttura grigia
  var ORD = [3, 2, 4, 1, 5, 0, 6];              // colonne dal centro (per il bot)

  function idx(r, c) { return r * COLS + c; }
  function altro(s) { return s === "G" ? "B" : "G"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pezzoColore(s) { return s === "G" ? CG : CB; }

  // suono: la pedina che cade e si incastra nel posto (un "tock" pieno + click di contatto + assestamento)
  function suonoDrop() {
    try { if (navigator.vibrate) navigator.vibrate(22); } catch (e) {}
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t = ctx.currentTime;
      // corpo: oscillatore che scende (il "tock")
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(85, t + 0.11);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.18);
      // click di contatto: breve rumore acuto
      var dur = 0.03, buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      var src = ctx.createBufferSource(); src.buffer = buf;
      var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2600;
      var gn = ctx.createGain(); gn.gain.setValueAtTime(0.35, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(hp); hp.connect(gn); gn.connect(ctx.destination); src.start(t); src.stop(t + dur + 0.01);
      // piccolo assestamento
      var o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = "triangle"; o2.frequency.setValueAtTime(150, t + 0.09); o2.frequency.exponentialRampToValueAtTime(92, t + 0.16);
      g2.gain.setValueAtTime(0.0001, t + 0.09); g2.gain.exponentialRampToValueAtTime(0.18, t + 0.1); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o2.connect(g2); g2.connect(ctx.destination); o2.start(t + 0.09); o2.stop(t + 0.22);
    } catch (e) {}
  }
  // suona quando la pedina "atterra" (sincronizzato con la fine dell'animazione di caduta)
  function suonoDropAtterra() { setTimeout(suonoDrop, 210); }

  // tutte le 69 quaterne vincenti (indici 0..41)
  var LINEE4 = (function () {
    var L = [], r, c;
    for (r = 0; r < ROWS; r++) for (c = 0; c < COLS - 3; c++) L.push([idx(r, c), idx(r, c + 1), idx(r, c + 2), idx(r, c + 3)]);          // orizzontali
    for (c = 0; c < COLS; c++) for (r = 0; r < ROWS - 3; r++) L.push([idx(r, c), idx(r + 1, c), idx(r + 2, c), idx(r + 3, c)]);          // verticali
    for (r = 0; r < ROWS - 3; r++) for (c = 0; c < COLS - 3; c++) L.push([idx(r, c), idx(r + 1, c + 1), idx(r + 2, c + 2), idx(r + 3, c + 3)]); // diag \
    for (r = 3; r < ROWS; r++) for (c = 0; c < COLS - 3; c++) L.push([idx(r, c), idx(r - 1, c + 1), idx(r - 2, c + 2), idx(r - 3, c + 3)]);     // diag /
    return L;
  })();

  function vincitoreDrop(b) {
    for (var k = 0; k < LINEE4.length; k++) {
      var l = LINEE4[k], a = b[l[0]];
      if (a && a === b[l[1]] && a === b[l[2]] && a === b[l[3]]) return { s: a, celle: l };
    }
    return null;
  }
  function colonnaLibera(b, c) { return b[idx(0, c)] == null; }
  function colonneLibere(b) { var o = []; for (var c = 0; c < COLS; c++) if (colonnaLibera(b, c)) o.push(c); return o; }
  function cadi(b, c, s) { for (var r = ROWS - 1; r >= 0; r--) { if (b[idx(r, c)] == null) { b[idx(r, c)] = s; return r; } } return -1; }
  function boardVuota() { var a = []; for (var i = 0; i < COLS * ROWS; i++) a.push(null); return a; }

  // ---- bot ----
  function vinceColonna(b, c, s) { var r = cadi(b, c, s); if (r < 0) return false; var w = vincitoreDrop(b); b[idx(r, c)] = null; return !!(w && w.s === s); }
  function valuta(b, me) {
    var opp = altro(me), score = 0, r, k;
    for (r = 0; r < ROWS; r++) if (b[idx(r, 3)] === me) score += 3; // centro
    for (k = 0; k < LINEE4.length; k++) {
      var l = LINEE4[k], nm = 0, no = 0, ne = 0;
      for (var j = 0; j < 4; j++) { var v = b[l[j]]; if (v === me) nm++; else if (v === opp) no++; else ne++; }
      if (nm && no) continue;
      if (nm === 3 && ne === 1) score += 8;
      else if (nm === 2 && ne === 2) score += 3;
      else if (no === 3 && ne === 1) score -= 10;
      else if (no === 2 && ne === 2) score -= 3;
    }
    return score;
  }
  function ordina(mosse) { var o = []; for (var i = 0; i < ORD.length; i++) if (mosse.indexOf(ORD[i]) >= 0) o.push(ORD[i]); return o; }
  function minimaxD(b, prof, alpha, beta, turno, me) {
    var w = vincitoreDrop(b);
    if (w) return { punti: w.s === me ? (100000 - (PROF - prof)) : -(100000 - (PROF - prof)) };
    var mosse = colonneLibere(b);
    if (!mosse.length) return { punti: 0 };
    if (prof === 0) return { punti: valuta(b, me) };
    mosse = ordina(mosse);
    var mm = mosse[0], k, c, r, s;
    if (turno === me) {
      var v = -Infinity;
      for (k = 0; k < mosse.length; k++) { c = mosse[k]; r = cadi(b, c, turno); s = minimaxD(b, prof - 1, alpha, beta, altro(turno), me).punti; b[idx(r, c)] = null; if (s > v) { v = s; mm = c; } if (v > alpha) alpha = v; if (alpha >= beta) break; }
      return { punti: v, mossa: mm };
    }
    var v2 = Infinity;
    for (k = 0; k < mosse.length; k++) { c = mosse[k]; r = cadi(b, c, turno); s = minimaxD(b, prof - 1, alpha, beta, altro(turno), me).punti; b[idx(r, c)] = null; if (s < v2) { v2 = s; mm = c; } if (v2 < beta) beta = v2; if (alpha >= beta) break; }
    return { punti: v2, mossa: mm };
  }
  function mossaBot(b, me, liv) {
    var mosse = colonneLibere(b);
    if (!mosse.length) return -1;
    if (liv === "facile") return mosse[Math.floor(Math.random() * mosse.length)];
    if (liv === "medio") {
      for (var i = 0; i < mosse.length; i++) if (vinceColonna(b, mosse[i], me)) return mosse[i];       // vinci
      for (var j = 0; j < mosse.length; j++) if (vinceColonna(b, mosse[j], altro(me))) return mosse[j]; // blocca
      return mosse[Math.floor(Math.random() * mosse.length)];
    }
    // difficile: apertura istantanea al centro quando il tabellone è quasi vuoto
    // (è la mossa migliore e evita la ricerca più pesante), poi minimax con potatura.
    var pezzi = 0; for (var p = 0; p < b.length; p++) if (b[p]) pezzi++;
    if (pezzi <= 1) return colonnaLibera(b, 3) ? 3 : mosse[0];
    var r = minimaxD(b.slice(), PROF, -Infinity, Infinity, me, me);
    return (r && r.mossa != null) ? r.mossa : mosse[0];
  }

  SG.registra({
    id: "drop4",
    nome: "Drop 4",
    icona: "🟡",
    descrizione: "Quattro in fila a gravità: fai cadere le pedine in colonna e allinea quattro dello stesso colore. Contro il bot, in due o online.",
    giocatoriMin: 1, giocatoriMax: 2, difficolta: 2,
    regole: [
      "Griglia di <b>7 colonne × 6 righe</b>. Il <b>Giallo</b> inizia; poi si gioca a turni alterni.",
      "Nel tuo turno scegli una <b>colonna</b>: la pedina <b>cade in fondo</b>, sul primo posto libero.",
      "Una colonna piena (6 pedine) non si può più usare: scegline un'altra.",
      "Vince chi allinea <b>4 pedine</b> del suo colore: in orizzontale, verticale o diagonale.",
      "Se si riempiono tutte le 42 caselle senza un allineamento, è <b>pareggio</b>.",
      "Modalità: <b>contro il bot</b> (Facile / Medio / Difficile), <b>in due sullo stesso telefono</b>, oppure <b>online</b> (uno apre la stanza, l'altro entra col codice)."
    ],

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = "bot"; dove.difficolta = "medio"; dove.torneo = !!aiuti.torneo;
      if (aiuti.torneo) { dove.modo = "telefono"; return; }
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
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
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
      if (t.linkParams && t.linkParams.stanza) return ospiteDrop(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostDrop(t);
      return localeDrop(t, imp.modo === "telefono" ? "telefono" : "bot", imp.difficolta || "medio", !!imp.torneo);
    }
  });

  // ---- stile per la caduta ----
  function assicuraStileDrop() {
    if (document.getElementById("sg-drop-css")) return;
    var st = document.createElement("style");
    st.id = "sg-drop-css";
    st.textContent = "@keyframes sgDropCade{0%{transform:translateY(-360px)}70%{transform:translateY(0)}82%{transform:translateY(-14px)}100%{transform:translateY(0)}}.sg-cade{animation:sgDropCade .34s cubic-bezier(.35,.65,.3,1)}";
    document.head.appendChild(st);
  }

  // =========================================================
  //  DISEGNO DEL CAMPO (uguale per tutte le modalità)
  //  vm = { fase, board:[42], turno:"G"|"B", fine:{vincitore,celle}|null, nomi:{G,B}, ultima:idx }
  //  cb = { mio:"G"|"B"|null, bot, locale, sonoHost, onColonna(c), onRivincita, onEsci }
  // =========================================================
  function statoDrop(vm, cb) {
    if (vm.fase === "fine") {
      if (vm.fine && vm.fine.vincitore) {
        var col = vm.fine.vincitore === "G" ? CG : CB;
        return "🏆 Vince <span style='color:" + col + "'>" + esc(vm.nomi[vm.fine.vincitore]) + "</span>!";
      }
      return "🤝 Pareggio!";
    }
    var c = vm.turno === "G" ? CG : CB;
    if (cb.mio && cb.mio === vm.turno) return "Tocca a <b>te</b>";
    if (cb.mio && cb.mio !== vm.turno) return cb.bot ? "🤖 Il bot sta pensando…" : "Tocca a <span style='color:" + c + "'>" + esc(vm.nomi[vm.turno]) + "</span>";
    return "Tocca a <span style='color:" + c + "'>" + esc(vm.nomi[vm.turno]) + "</span>";
  }
  var drMount = null; // schermata Drop 4 montata: a ogni mossa aggiorniamo solo il contenuto (niente lampeggio)
  function campoDrop(t, vm, cb) {
    assicuraStileDrop();
    var el = t.el;
    var box = el("div", {});
    box.appendChild(el("div", { style: "text-align:center;font-weight:800;font-size:1.15rem;margin:6px 0 10px;min-height:1.4em", html: statoDrop(vm, cb) }));
    var board = el("div", { style: "display:flex;gap:6px;width:min(94vw,380px);margin:0 auto;background:" + GRIGLIA + ";padding:8px;border-radius:16px;box-sizing:border-box;box-shadow:0 6px 16px rgba(0,0,0,.35)" });
    function colonna(c) {
      var full = !colonnaLibera(vm.board, c);
      var puoi = vm.fase === "gioco" && !full && (cb.mio == null || cb.mio === vm.turno);
      var col = el("button", { style: "flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;background:transparent;border:0;padding:0;overflow:hidden;cursor:" + (puoi ? "pointer" : "default") + ";-webkit-tap-highlight-color:transparent",
        onclick: puoi ? function () { cb.onColonna(c); } : null });
      for (var r = 0; r < ROWS; r++) {
        var i = idx(r, c), v = vm.board[i];
        var vinc = !!(vm.fine && vm.fine.celle && vm.fine.celle.indexOf(i) >= 0);
        var cell = el("div", { style: "aspect-ratio:1;border-radius:50%;background:" + (v ? pezzoColore(v) : HOLE) +
          ";box-shadow:inset 0 2px 5px rgba(0,0,0,.55)" + (vinc ? ";outline:3px solid #69db7c;outline-offset:-3px" : "") });
        if (v && i === vm.ultima) cell.className = "sg-cade";
        col.appendChild(cell);
      }
      return col;
    }
    for (var c = 0; c < COLS; c++) board.appendChild(colonna(c));
    box.appendChild(board);

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
    if (drMount && drMount.cont && document.body.contains(drMount.box)) {
      drMount.cont.replaceChild(box, drMount.box); drMount.box = box;
      drMount.piede.innerHTML = ""; piedeNodi.forEach(function (n) { drMount.piede.appendChild(n); });
    } else {
      var s = t.schermata({ icona: "🟡", titolo: "Drop 4", sotto: vm.nomi.G + " (gialla) · " + vm.nomi.B + " (bianca)",
        indietro: function () { if (window.confirm("Uscire dalla partita?")) cb.onEsci(); } });
      s._contenuto.appendChild(box); piedeNodi.forEach(function (n) { s._piede.appendChild(n); }); t.mostra(s);
      drMount = { cont: s._contenuto, box: box, piede: s._piede };
    }
  }

  // =========================================================
  //  LOCALE — contro il bot oppure in due sullo stesso telefono
  // =========================================================
  function localeDrop(t, modo, difficolta, torneo) {
    var nomi = modo === "bot"
      ? { G: (t.giocatori[0] || "Tu"), B: "🤖 Bot" }
      : { G: (t.giocatori[0] || "Giocatore 1"), B: (t.giocatori[1] || "Giocatore 2") };
    var primo = "G", st;

    function render() {
      var vm = { fase: st.fine ? "fine" : "gioco", board: st.board, turno: st.turno, fine: st.fine, nomi: nomi, ultima: st.ultima };
      campoDrop(t, vm, {
        locale: true, bot: modo === "bot", mio: modo === "bot" ? "G" : null,
        onColonna: function (c) { gioca(c); },
        onRivincita: function () { primo = altro(primo); nuova(); },
        onEsci: t.esci
      });
    }
    function gioca(c) {
      if (st.fine || !colonnaLibera(st.board, c)) return;
      var r = cadi(st.board, c, st.turno); st.ultima = idx(r, c); suonoDropAtterra();
      var w = vincitoreDrop(st.board);
      if (w) st.fine = { vincitore: w.s, celle: w.celle };
      else if (!colonneLibere(st.board).length) st.fine = { vincitore: null, celle: null };
      else st.turno = altro(st.turno);
      if (st.fine && torneo) return t.fine(classifica());
      render();
      if (!st.fine && modo === "bot" && st.turno === "B") pensaBot();
    }
    function pensaBot() {
      setTimeout(function () { if (!st.fine) gioca(mossaBot(st.board.slice(), "B", difficolta)); }, 420 + Math.random() * 320);
    }
    function classifica() {
      if (!st.fine.vincitore) return [{ nome: nomi.G }, { nome: nomi.B }];
      return st.fine.vincitore === "G" ? [{ nome: nomi.G }, { nome: nomi.B }] : [{ nome: nomi.B }, { nome: nomi.G }];
    }
    function nuova() {
      st = { board: boardVuota(), turno: primo, fine: null, ultima: -1 };
      render();
      if (modo === "bot" && st.turno === "B") pensaBot();
    }
    nuova();
  }

  // =========================================================
  //  ONLINE — host = Giallo (inizia), ospite = Bianco (host-autoritativo)
  // =========================================================
  function hostDrop(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var st = {
      fase: "lobby", codice: "…", pronta: false,
      board: boardVuota(), turno: "G", fine: null, primo: "G", ultima: -1,
      nomiG: (t.giocatori && t.giocatori[0]) || "Host", nomiB: null, avvId: null
    };
    var rete = SGNet.ospita("drop4", {
      onCodice: function (c) { st.codice = c; bd(); },
      onConnesso: function () { st.pronta = true; bd(); },
      onAddio: function (id) { if (id === st.avvId) { st.avvId = null; st.nomiB = null; if (st.fase !== "lobby") st.fase = "lobby"; bd(); } },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") { if (!st.avvId) { st.avvId = id; st.nomiB = String(m.nome || "Avversario").slice(0, 16); } bd(); }
        else if (m.t === "mossa") { if (st.fase === "gioco" && st.turno === "B" && id === st.avvId) applica(m.c); }
      },
      onErrore: function () { senzaRete(t); }
    });
    function vm() {
      return { fase: st.fase, codice: st.codice, pronta: st.pronta, board: st.board, turno: st.turno,
        fine: st.fine, nomi: { G: st.nomiG, B: st.nomiB || "Avversario" }, avversario: !!st.avvId, ultima: st.ultima };
    }
    function bd() { rete.invia({ t: "vm", vm: vm() }); disegna(); }
    function applica(c) {
      if (st.fase !== "gioco" || st.fine || !colonnaLibera(st.board, c)) return;
      var r = cadi(st.board, c, st.turno); st.ultima = idx(r, c); suonoDropAtterra();
      var w = vincitoreDrop(st.board);
      if (w) { st.fine = { vincitore: w.s, celle: w.celle }; st.fase = "fine"; }
      else if (!colonneLibere(st.board).length) { st.fine = { vincitore: null, celle: null }; st.fase = "fine"; }
      else st.turno = altro(st.turno);
      bd();
    }
    function comincia() { if (st.fase !== "lobby" || !st.avvId) return; st.board = boardVuota(); st.turno = st.primo; st.fine = null; st.ultima = -1; st.fase = "gioco"; bd(); }
    function rivincita() { st.primo = altro(st.primo); st.board = boardVuota(); st.turno = st.primo; st.fine = null; st.ultima = -1; st.fase = "gioco"; bd(); }
    var cb = {
      sonoHost: true, mio: "G",
      onColonna: function (c) { if (st.fase === "gioco" && st.turno === "G") applica(c); },
      onComincia: comincia, onRivincita: rivincita,
      onEsci: function () { rete.chiudi(); t.esci(); }
    };
    function disegna() { disegnaVM(t, vm(), cb); }
    disegna();
  }

  function ospiteDrop(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { myId: null, vm: null, rete: null, nome: "", msg: null, lastCount: 0 };
    var cb = {
      sonoHost: false, mio: "B",
      onColonna: function (c) { S.rete && S.rete.invia({ t: "mossa", c: c }); },
      onComincia: function () {}, onRivincita: function () {},
      onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); }
    };
    function disegna() { if (S.vm) disegnaVM(t, S.vm, cb); }
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🟡", titolo: "Entra in Drop 4", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
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
          if (n > S.lastCount && m.vm.fase !== "lobby") suonoDropAtterra();
          S.lastCount = n;
          S.vm = m.vm; disegna();
        } },
        onChiuso: function () { errore(t, "Collegamento perso. L'host potrebbe aver chiuso la partita."); },
        onErrore: function () { errore(t, "Problema di collegamento. Controlla la connessione e riprova."); }
      });
    }
  }

  function disegnaVM(t, vm, cb) {
    if (vm.fase === "lobby") return lobbyDrop(t, vm, cb);
    campoDrop(t, vm, cb);
  }

  function lobbyDrop(t, vm, cb) {
    var el = t.el;
    var s = t.schermata({ icona: "🟡", titolo: "Drop 4 · Lobby", sotto: "Ognuno dal suo telefono",
      indietro: function () { if (window.confirm("Uscire?")) cb.onEsci(); } });
    if (cb.sonoHost) {
      s._contenuto.appendChild(el("div", { class: "etichetta", text: "Codice della stanza" }));
      s._contenuto.appendChild(el("div", { class: "codice-stanza", text: (vm.codice || "…").toUpperCase() }));
      if (vm.codice && vm.codice !== "…") {
        var link = SG.creaLink({ gioco: "drop4", stanza: vm.codice });
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
      [["G", vm.nomi.G, CG, "gialla"], ["B", vm.nomi.B, CB, "bianca"]].forEach(function (p) {
        var mio = (p[0] === cb.mio);
        s._contenuto.appendChild(el("div", { style: "display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;margin-bottom:6px;background:" + (mio ? "rgba(255,202,58,.18)" : "rgba(255,255,255,.06)") + (mio ? ";border:1px solid var(--accento)" : "") }, [
          el("span", { style: "width:16px;height:16px;border-radius:50%;flex:0 0 auto;background:" + p[2] }),
          el("span", { style: "flex:1;font-weight:700", text: p[1] + (mio ? " (tu)" : "") + " (" + p[3] + ")" })
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

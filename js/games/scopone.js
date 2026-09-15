/* =========================================================
   GIOCO — "Scopone" (carte napoletane, stesse immagini della Scopa)
   In quattro, a due squadre: TU + Compagno (bot) contro due Rivali (bot).
   Due varianti:
     • Scientifico: 10 carte a testa, niente carte sul tavolo all'inizio.
     • Classico: 9 carte a testa + 4 sul tavolo.
   Tutte le carte sono distribuite subito (non si pesca). Regole di presa
   come la Scopa (valore uguale, singolo forzato, altrimenti somme). Scopa
   quando svuoti il tavolo (tranne l'ultima carta). A fine mano le carte
   rimaste vanno all'ultima squadra che ha preso. Punti a squadra: Carte,
   Denari, Settebello, Primiera + le Scope. Partita a 11.
   Riusa gli aiuti condivisi window.SGCarte (definiti in scopa.js).
   ========================================================= */
(function () {
  "use strict";
  var TARGET = 11;
  var NOMI_BOT = { 1: "🤖 Rivale 1", 2: "🤖 Compagno", 3: "🤖 Rivale 2" };
  function C() { return window.SGCarte; } // aiuti condivisi (carte + logica di presa)
  function squadra(s) { return (s % 2 === 0) ? "noi" : "loro"; }
  function trova(a, id) { for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function importanza(c) { return c.id === "D7" ? 12 : c.s === "D" ? 3 : c.v === 7 ? 2.2 : (c.v === 6 || c.v === 1) ? 1.6 : 1; }

  SG.registra({
    id: "scopone",
    nome: "Scopone",
    icona: "🃏",
    descrizione: "Lo scopone in quattro (a squadre): tu e il tuo compagno contro due avversari. Varianti classico e scientifico. Contro il computer.",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 3,
    regole: [
      "Si gioca <b>in quattro, a due squadre</b>: tu e il <b>Compagno</b> (di fronte) contro due <b>Rivali</b>. Qui giochi contro il computer.",
      "<b>Scientifico</b>: 10 carte a testa, niente carte sul tavolo. <b>Classico</b>: 9 a testa + 4 sul tavolo.",
      "Le carte sono date <b>tutte subito</b> (non si pesca). Nel tuo turno giochi una carta: se ha lo stesso valore di una del tavolo la <b>prendi</b>, altrimenti puoi prendere una <b>somma</b> di più carte.",
      "Svuoti il tavolo? <b>Scopa</b> (+1), tranne con l'ultima carta. A fine mano le carte rimaste vanno all'ultima squadra che ha preso.",
      "Punti a fine mano (sommando i due compagni): <b>Carte, Denari, Settebello, Primiera</b> e le <b>Scope</b>. Vince la squadra che arriva a <b>" + TARGET + "</b>."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.variante = "scientifico"; dove.difficolta = "medio";
      var bSci, bCla, dWrap;
      function selV(v) { dove.variante = v; bSci.className = "modo-chip" + (v === "scientifico" ? " attiva" : ""); bCla.className = "modo-chip" + (v === "classico" ? " attiva" : ""); }
      bSci = el("button", { class: "modo-chip attiva", onclick: function () { selV("scientifico"); } }, [
        el("span", { class: "mi", text: "🎓" }), el("div", {}, [el("div", { class: "mt", text: "Scientifico" }), el("div", { class: "ms", text: "10 carte, tavolo vuoto" })])]);
      bCla = el("button", { class: "modo-chip", onclick: function () { selV("classico"); } }, [
        el("span", { class: "mi", text: "📜" }), el("div", {}, [el("div", { class: "mt", text: "Classico" }), el("div", { class: "ms", text: "9 carte + 4 sul tavolo" })])]);
      box.appendChild(el("div", { class: "etichetta", text: "Variante" }));
      box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bSci, bCla]));
      dWrap = el("div", {});
      dWrap.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura dei bot" }));
      var dg = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.difficolta = d[0]; [].forEach.call(dg.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: d[1] })]);
        b.style.flex = "1"; dg.appendChild(b);
      });
      dWrap.appendChild(dg); box.appendChild(dWrap);
      box.appendChild(el("p", { class: "modulo-nota", style: "margin-top:10px", text: "Giochi tu (in basso) con il Compagno di fronte, contro i due Rivali." }));
    },
    avvia: function (t) {
      if (!window.SGCarte) { var s = t.schermata({ icona: "⚠️", titolo: "Un attimo" }); s._contenuto.appendChild(t.el("p", { text: "Ricarica la pagina e riprova." })); s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci })); return t.mostra(s); }
      var imp = t.impostazioni || {};
      localeScopone(t, imp.variante || "scientifico", imp.difficolta || "medio");
    }
  });

  // ---------- motore ----------
  function creaStato(variante) {
    var st = {
      variante: variante, mazzo: C().creaMazzo(mischia), tavolo: [], mani: [[], [], [], []], prese: [[], [], [], []],
      scope: [0, 0, 0, 0], turno: 0, ultimaPresa: null, fase: "gioco", primo: 0,
      punti: { noi: 0, loro: 0 }, ultimoRound: null, presa: null, messaGiu: null,
      nomi: {}
    };
    return st;
  }
  function mischia(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

  function distribuisci(st) {
    st.mazzo = C().creaMazzo(mischia);
    if (st.variante === "classico") { st.tavolo = st.mazzo.splice(0, 4); for (var s = 0; s < 4; s++) st.mani[s] = st.mazzo.splice(0, 9); }
    else { st.tavolo = []; for (var s2 = 0; s2 < 4; s2++) st.mani[s2] = st.mazzo.splice(0, 10); }
    st.prese = [[], [], [], []]; st.scope = [0, 0, 0, 0]; st.ultimaPresa = null; st.turno = st.primo; st.fase = "gioco"; st.presa = null; st.messaGiu = null;
  }

  // esegue una mossa del giocatore "seat": ritorna {presa, scopa}
  function applica(st, seat, cartaId, presaIds) {
    st.presa = null; st.messaGiu = null;
    var carta = trova(st.mani[seat], cartaId); if (!carta || st.turno !== seat || st.fase !== "gioco") return { errore: true };
    st.mani[seat] = st.mani[seat].filter(function (c) { return c.id !== cartaId; });
    var opts = C().catture(carta.v, st.tavolo);
    var ev = { presa: false, scopa: false };
    if (opts.length) {
      var set = presaIds && C().validaSet(opts, presaIds) ? presaIds : opts[0];
      var tavoloPrima = st.tavolo.slice();
      var presi = set.map(function (id) { return trova(st.tavolo, id); }).filter(Boolean);
      st.tavolo = st.tavolo.filter(function (c) { return set.indexOf(c.id) < 0; });
      st.prese[seat] = st.prese[seat].concat(presi, [carta]);
      st.ultimaPresa = seat; ev.presa = true;
      var maniVuote = st.mani[0].length === 0 && st.mani[1].length === 0 && st.mani[2].length === 0 && st.mani[3].length === 0;
      if (st.tavolo.length === 0 && !maniVuote) { st.scope[seat]++; ev.scopa = true; }
      st.presa = { chi: seat, carta: carta, scopa: ev.scopa, tavoloPrima: tavoloPrima, presiIds: set };
    } else {
      st.tavolo.push(carta); st.messaGiu = carta.id;
    }
    st.turno = (seat + 1) % 4;
    var vuote = st.mani[0].length === 0 && st.mani[1].length === 0 && st.mani[2].length === 0 && st.mani[3].length === 0;
    if (vuote) fineMano(st);
    return ev;
  }
  function fineMano(st) {
    if (st.tavolo.length && st.ultimaPresa != null) { st.prese[st.ultimaPresa] = st.prese[st.ultimaPresa].concat(st.tavolo); st.tavolo = []; }
    var r = contaScopone(st);
    st.punti.noi += r.puntiNoi; st.punti.loro += r.puntiLoro;
    r.tot = { noi: st.punti.noi, loro: st.punti.loro };
    st.ultimoRound = r;
    st.fase = (st.punti.noi >= TARGET || st.punti.loro >= TARGET) ? "fine" : "fineround";
  }
  function carteSquadra(st, team) { var o = []; for (var s = 0; s < 4; s++) if (squadra(s) === team) o = o.concat(st.prese[s]); return o; }
  function contaScopone(st) {
    var A = carteSquadra(st, "noi"), B = carteSquadra(st, "loro");
    function den(x) { var n = 0; x.forEach(function (c) { if (c.s === "D") n++; }); return n; }
    var carteA = A.length, carteB = B.length, denA = den(A), denB = den(B);
    var sette = trova(A, "D7") ? "noi" : (trova(B, "D7") ? "loro" : null);
    var primA = C().primiera(A), primB = C().primiera(B);
    var scopeNoi = st.scope[0] + st.scope[2], scopeLoro = st.scope[1] + st.scope[3];
    var pCarte = carteA > carteB ? "noi" : carteB > carteA ? "loro" : null;
    var pDen = denA > denB ? "noi" : denB > denA ? "loro" : null;
    var pPrim = primA > primB ? "noi" : primB > primA ? "loro" : null;
    function pts(team) { return (team === "noi" ? scopeNoi : scopeLoro) + (pCarte === team ? 1 : 0) + (pDen === team ? 1 : 0) + (sette === team ? 1 : 0) + (pPrim === team ? 1 : 0); }
    return { carteA: carteA, carteB: carteB, denA: denA, denB: denB, sette: sette, primA: primA, primB: primB,
      pCarte: pCarte, pDen: pDen, pPrim: pPrim, scopeNoi: scopeNoi, scopeLoro: scopeLoro, puntiNoi: pts("noi"), puntiLoro: pts("loro") };
  }

  // ---------- bot ----------
  function mossaBot(st, seat, diff) {
    var mano = st.mani[seat], tavolo = st.tavolo, mosse = [];
    mano.forEach(function (c) {
      var opts = C().catture(c.v, tavolo);
      if (opts.length) opts.forEach(function (set) { mosse.push({ carta: c.id, presa: set, cattura: true, c: c, set: set }); });
      else mosse.push({ carta: c.id, presa: null, cattura: false, c: c, set: [] });
    });
    if (diff === "facile") return mosse[Math.floor(Math.random() * mosse.length)];
    var prossimoAvv = (squadra((seat + 1) % 4) !== squadra(seat)); // il prossimo è un avversario?
    function punteggio(m) {
      var s = 0;
      if (m.cattura) {
        s += importanza(m.c);
        m.set.forEach(function (id) { s += importanza(trova(tavolo, id)); });
        if (tavolo.length - m.set.length === 0) s += 6; // scopa
      } else {
        s -= importanza(m.c) * 0.6;
        if (diff === "difficile" && prossimoAvv) {
          var tot = 0; tavolo.forEach(function (x) { tot += x.v; }); tot += m.c.v;
          var singoloUguale = tavolo.some(function (x) { return x.v === m.c.v; });
          if (tot <= 10 && !singoloUguale) s -= 3; // eviti di regalare la scopa all'avversario
        }
      }
      return s;
    }
    var best = mosse[0], bs = -1e9;
    mosse.forEach(function (m) { var s = punteggio(m) + Math.random() * 0.25; if (s > bs) { bs = s; best = m; } });
    return best;
  }

  // ---------- suono presa ----------
  function suonoPresa(scopa) {
    try { if (navigator.vibrate) navigator.vibrate(scopa ? [0, 20, 40, 30] : 12); } catch (e) {}
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try { var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.setValueAtTime(scopa ? 520 : 360, t); o.frequency.exponentialRampToValueAtTime(scopa ? 880 : 300, t + 0.12);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (scopa ? 0.28 : 0.16));
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.3);
    } catch (e) {}
  }

  // ---------- controller locale (tu = seat 0) ----------
  function localeScopone(t, variante, diff) {
    C().assicuraStile();
    var el = t.el;
    var st = creaStato(variante);
    st.nomi = { 0: (t.giocatori[0] || "Tu"), 1: NOMI_BOT[1], 2: NOMI_BOT[2], 3: NOMI_BOT[3] };
    var sel = { carta: null, presa: [] };
    distribuisci(st);

    function render() { disegna(t, st, sel, {
      onCella: function (i) { tapMano(i); },
      onTavolo: function (id) { tapTavolo(id); },
      onAvanti: function () { st.primo = (st.primo + 1) % 4; distribuisci(st); sel = { carta: null, presa: [] }; render(); avviaGiro(); },
      onNuova: function () { st = creaStato(variante); st.nomi = { 0: (t.giocatori[0] || "Tu"), 1: NOMI_BOT[1], 2: NOMI_BOT[2], 3: NOMI_BOT[3] }; distribuisci(st); sel = { carta: null, presa: [] }; render(); avviaGiro(); },
      onEsci: function () { if (window.SGMusica) window.SGMusica.ferma(); t.esci(); }
    }); }

    function tapMano(id) {
      if (st.turno !== 0 || st.fase !== "gioco" || st.presa) return;
      var carta = trova(st.mani[0], id); if (!carta) return;
      var opts = C().catture(carta.v, st.tavolo);
      if (opts.length === 0) { sel = { carta: null, presa: [] }; gioco(0, id, null); return; }
      if (opts.length === 1) { sel = { carta: null, presa: [] }; gioco(0, id, opts[0]); return; }
      sel = (sel.carta === id) ? { carta: null, presa: [] } : { carta: id, presa: [] }; render();
    }
    function tapTavolo(id) {
      var carta = sel.carta ? trova(st.mani[0], sel.carta) : null; if (!carta) return;
      var opts = C().catture(carta.v, st.tavolo);
      var p = sel.presa.slice(); var k = p.indexOf(id); if (k >= 0) p.splice(k, 1); else p.push(id);
      if (C().validaSet(opts, p)) { var cid = sel.carta; sel = { carta: null, presa: [] }; gioco(0, cid, p); return; }
      if (C().prefisso(opts, p)) sel.presa = p;
      render();
    }
    function gioco(seat, id, presa) {
      var ev = applica(st, seat, id, presa); if (ev.errore) return;
      suonoPresa(ev.scopa); render(); dopo(ev);
    }
    function dopo(ev) {
      if (ev.presa && st.fase === "gioco") setTimeout(function () { st.presa = null; render(); giro(); }, ev.scopa ? 1500 : 1000);
      else { st.presa = null; giro(); }
    }
    function giro() { // fa giocare i bot finché non tocca a te (o finisce)
      if (st.fase !== "gioco") { render(); return; }
      if (st.turno === 0) { render(); return; }
      setTimeout(function () {
        if (st.fase !== "gioco" || st.turno === 0) { render(); return; }
        var m = mossaBot(st, st.turno, diff); gioco(st.turno, m.carta, m.presa);
      }, 750 + Math.random() * 400);
    }
    function avviaGiro() { if (st.turno !== 0) giro(); }

    render();
    avviaGiro(); // se inizia un bot
  }

  // ---------- disegno ----------
  var spMount = null; // schermata Scopone montata: a ogni mossa aggiorniamo solo il contenuto (niente lampeggio)

  function disegna(t, st, sel, cb) {
    var el = t.el;
    if (st.fase === "fineround" || st.fase === "fine") { spMount = null; return fine(t, st, cb); }
    if (window.SGMusica) window.SGMusica.avvia();
    var box = el("div", { style: "display:flex;flex-direction:column;min-height:calc(100vh - 155px);min-height:calc(100dvh - 155px)" });

    // intestazione: punti squadre (a sinistra) + tasto musica (a destra)
    var mioTurno = (st.turno === 0 && st.fase === "gioco" && !st.presa);
    var head = el("div", { style: "display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:5px" });
    head.appendChild(el("div", { style: "font-size:.82rem;font-weight:700", html: "Noi <b style='color:#69db7c'>" + st.punti.noi + "</b> — Loro <b>" + st.punti.loro + "</b> <span class='tenue' style='font-weight:600'>(a " + TARGET + ")</span>" }));
    if (window.SGMusica) head.appendChild(window.SGMusica.bottone(el));
    box.appendChild(head);

    // tavolo verde: Compagno in alto (di fronte), i due Rivali ai lati, carte a terra al centro
    var cartaSel = sel.carta ? trova(st.mani[0], sel.carta) : null;
    var opts = cartaSel ? C().catture(cartaSel.v, st.tavolo) : [];
    var capIds = {}; opts.forEach(function (set) { set.forEach(function (id) { capIds[id] = true; }); });
    var feltro = el("div", { class: "sc-feltro" });
    feltro.appendChild(el("div", { class: "sc-cima" }, [ C().posto(el, { nome: st.nomi[2], n: st.mani[2].length, turno: st.turno === 2, mia: true }) ]));
    var fascia = el("div", { class: "sc-fascia" });
    fascia.appendChild(C().posto(el, { nome: st.nomi[1], n: st.mani[1].length, turno: st.turno === 1, mia: false, lato: true }));
    var area = el("div", { class: "sc-terra" });
    var pendingPlace = null;
    if (st.presa) {
      var dir = (st.presa.chi === 0) ? "giu" : "su";
      var tw0 = el("div", { style: "display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-content:center" });
      var presiEls = [];
      (st.presa.tavoloPrima || st.tavolo).forEach(function (c) { var cel = C().cartaEl(el, c, 62); if (st.presa.presiIds.indexOf(c.id) >= 0) { cel.classList.add("sc-lascia-" + dir); presiEls.push(cel); } tw0.appendChild(cel); });
      area.appendChild(tw0);
      // la carta giocata va SOPRA la/e carta/e che prende, poi vola via con la presa
      var gioc = C().cartaEl(el, st.presa.carta, 62);
      gioc.style.cssText += ";position:absolute;z-index:6;opacity:0";
      area.appendChild(gioc);
      pendingPlace = function () {
        var a = area.getBoundingClientRect();
        if (presiEls.length) {
          var cx = 0, cy = 0;
          presiEls.forEach(function (e) { var r = e.getBoundingClientRect(); cx += r.left + r.width / 2; cy += r.top + r.height / 2; });
          cx /= presiEls.length; cy /= presiEls.length;
          var g = gioc.getBoundingClientRect();
          gioc.style.left = (cx - a.left - g.width / 2) + "px";
          gioc.style.top = (cy - a.top - g.height / 2) + "px";
        } else { gioc.style.left = "50%"; gioc.style.top = "50%"; gioc.style.marginLeft = "-31px"; gioc.style.marginTop = "-51px"; }
        gioc.style.animation = "scGioca" + (dir === "giu" ? "Giu" : "Su") + " .95s ease-in forwards";
      };
    } else {
      var tw = el("div", { style: "display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-content:center" });
      if (!st.tavolo.length) tw.appendChild(el("div", { class: "tenue", text: "tavolo vuoto" }));
      st.tavolo.forEach(function (c) {
        var cap = mioTurno && cartaSel && capIds[c.id];
        var extra = (sel.presa.indexOf(c.id) >= 0) ? "presel" : (cap ? "cap" : "");
        var cel = C().cartaEl(el, c, 64, extra, cap ? function () { cb.onTavolo(c.id); } : null);
        if (c.id === st.messaGiu) cel.classList.add("sc-cade");
        tw.appendChild(cel);
      });
      area.appendChild(tw);
    }
    fascia.appendChild(area);
    fascia.appendChild(C().posto(el, { nome: st.nomi[3], n: st.mani[3].length, turno: st.turno === 3, mia: false, lato: true }));
    feltro.appendChild(fascia);
    box.appendChild(feltro);

    // stato (tocca a te / gioca un altro / scopa)
    box.appendChild(el("div", { style: "text-align:center;font-weight:800;font-size:1rem;margin:6px 0 3px;min-height:1.2em;color:" + (st.presa && st.presa.scopa ? "#ffd43b" : "inherit"),
      text: st.presa ? (st.presa.scopa ? "SCOPA! 🧹" : "") : (mioTurno ? "Tocca a te" : "Gioca " + st.nomi[st.turno]) }));

    // la tua mano (sulla mensola di legno, ben staccata dal tavolo)
    var mensola = el("div", { class: "sc-mensola" });
    var manoW = el("div", { class: "sc-mano-riga" });
    st.mani[0].forEach(function (c) { manoW.appendChild(C().cartaEl(el, c, 70, (sel.carta === c.id) ? "sel" : "", mioTurno ? function () { cb.onCella(c.id); } : null)); });
    mensola.appendChild(manoW);
    var mieCarte = st.prese[0].length + st.prese[2].length;
    mensola.appendChild(el("div", { class: "sc-prese", html: "prese squadra: <b>" + mieCarte + "</b>" + (trova(st.prese[0].concat(st.prese[2]), "D7") ? " · 7💰" : "") + ((st.scope[0] + st.scope[2]) ? " · scope " + (st.scope[0] + st.scope[2]) : "") }));
    box.appendChild(mensola);
    var piedeNodi = [];
    if (mioTurno && cartaSel && opts.length >= 2) piedeNodi.push(el("p", { class: "modulo-nota", style: "text-align:center", text: opts[0].length === 1 ? "Più prese: tocca la carta verde che vuoi." : "Tocca le carte verdi che sommano a " + cartaSel.v + "." }));
    else if (mioTurno) piedeNodi.push(el("p", { class: "modulo-nota", style: "text-align:center", text: "Tocca una tua carta per giocarla." }));
    else if (st.fase === "gioco") piedeNodi.push(el("p", { class: "modulo-nota", style: "text-align:center", text: "Giocano gli altri…" }));

    // ---- montaggio: prima volta creo la schermata, poi aggiorno SOLO il contenuto (schermo fisso, niente lampeggio) ----
    if (spMount && spMount.cont && document.body.contains(spMount.box)) {
      spMount.cont.replaceChild(box, spMount.box); spMount.box = box;
      spMount.piede.innerHTML = ""; piedeNodi.forEach(function (n) { spMount.piede.appendChild(n); });
    } else {
      var s = t.schermata({ icona: "🃏", titolo: "Scopone", sotto: (st.variante === "scientifico" ? "Scientifico" : "Classico") + " · tu + Compagno",
        indietro: function () { if (window.confirm("Uscire dalla partita?")) cb.onEsci(); } });
      s._contenuto.appendChild(box); piedeNodi.forEach(function (n) { s._piede.appendChild(n); }); t.mostra(s);
      spMount = { cont: s._contenuto, box: box, piede: s._piede };
    }
    if (pendingPlace) pendingPlace();
  }

  function fine(t, st, cb, s) {
    var el = t.el, r = st.ultimoRound;
    s = t.schermata({ icona: st.fase === "fine" ? "🏆" : "🧮",
      titolo: st.fase === "fine" ? (st.punti.noi > st.punti.loro ? "Avete vinto!" : "Hanno vinto i Rivali") : "Fine mano",
      sotto: "Scopone " + (st.variante === "scientifico" ? "scientifico" : "classico") });
    function riga(nome, a, b, vinc) {
      return el("div", { style: "display:flex;justify-content:space-between;padding:5px 8px;border-radius:8px;background:rgba(255,255,255,.05);margin-bottom:5px" }, [
        el("span", { text: nome }), el("span", { html: "<b style='color:" + (vinc === "noi" ? "#69db7c" : "inherit") + "'>" + a + "</b> — <b style='color:" + (vinc === "loro" ? "#69db7c" : "inherit") + "'>" + b + "</b>" })]);
    }
    if (r) {
      s._contenuto.appendChild(el("div", { class: "tenue", style: "text-align:center;margin-bottom:6px", text: "Noi — Loro" }));
      s._contenuto.appendChild(riga("Carte (" + r.carteA + " vs " + r.carteB + ")", r.carteA, r.carteB, r.pCarte));
      s._contenuto.appendChild(riga("Denari (" + r.denA + " vs " + r.denB + ")", r.denA, r.denB, r.pDen));
      s._contenuto.appendChild(riga("Settebello 7💰", r.sette === "noi" ? "sì" : "—", r.sette === "loro" ? "sì" : "—", r.sette));
      s._contenuto.appendChild(riga("Primiera (" + r.primA + " vs " + r.primB + ")", r.primA, r.primB, r.pPrim));
      s._contenuto.appendChild(riga("Scope", r.scopeNoi, r.scopeLoro, null));
      s._contenuto.appendChild(el("div", { style: "height:1px;background:rgba(255,255,255,.15);margin:8px 0" }));
      s._contenuto.appendChild(riga("Punti mano", r.puntiNoi, r.puntiLoro, null));
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:1.3rem;font-weight:800;margin-top:8px",
        html: "Noi <span style='color:#ffd43b'>" + r.tot.noi + "</span> — " + r.tot.loro + " Loro" }));
    }
    if (st.fase === "fine") {
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Nuova partita", onclick: cb.onNuova }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    } else s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Continua ▶", onclick: cb.onAvanti }));
    t.mostra(s);
  }
})();

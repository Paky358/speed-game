/* =========================================================
   GIOCO — "Scopone" (carte napoletane, stesse immagini della Scopa)
   In quattro, a due squadre: TU + un bot di fronte (il compagno) contro due bot (i bot fissi di SG.bot).
   Due varianti:
     • Scientifico: 10 carte a testa, niente carte sul tavolo all'inizio.
     • Classico: 9 carte a testa + 4 sul tavolo.
   Tutte le carte sono distribuite subito (non si pesca). Regole di presa
   come la Scopa (valore uguale, singolo forzato, altrimenti somme). Scopa
   quando svuoti il tavolo (tranne l'ultima carta). A fine mano le carte
   rimaste vanno all'ultima squadra che ha preso. Punti a squadra: Carte,
   Denari, Settebello, Primiera + le Scope. Partita a 11.
   Riusa gli aiuti condivisi window.SGCarte (definiti in scopa.js).
   La stanza si costruisce una volta per mano: a ogni mossa si aggiorna
   solo quello che cambia (niente lampeggio). La partita si salva sul
   telefono a ogni mossa: ricaricando la pagina si può riprendere.
   ========================================================= */
(function () {
  "use strict";
  var TARGET = 11;
  // i tre bot (1 e 3 rivali, 2 il tuo compagno) sono i bot fissi uguali in tutti i giochi (SG.bot), scelti dalla bravura
  var SALVA = "sg-scopone-partita";                     // la partita in corso, salvata sul telefono
  var SEMI_TXT = { D: "🪙", C: "🏆", S: "🗡️", B: "🪵" };   // denari, coppe, spade, bastoni
  // frasi dei bot a fumetto nei momenti forti (corte: stanno nel fumetto)
  var FRASI = {
    scopa: ["🧹 SCOPA!", "🧹 Pulito!", "🧹 Spazzato!", "🧹 Via tutto!", "🧹 Tutto mio!", "🧹 Che scopa!", "🧹 Lindo!", "🧹 E vai!", "🧹 Olé!", "🧹 Tavola pulita!"],
    sette: ["💰 Settebello!", "💰 Il bello!", "💰 Sette d'oro!", "💰 Lo tengo io!", "💰 Che bellezza!", "💰 Vieni qua!", "💰 Il re dei 7!", "💰 Mio, mio!"],
    somma: ["🎯 Spariglio!", "🎯 Conti fatti!", "🎯 Somma giusta!", "🎯 Calcolato!", "🎯 Tutto torna!", "🎯 Sparigliato!", "🎯 Matematica!"],
    bravo: ["👏 Grande!", "👏 Che colpo!", "👏 Così si fa!", "👏 Bellissima!", "👏 Da manuale!", "👏 Siamo forti!", "👏 Applausi!", "👏 Spettacolo!"],
    braviSette: ["💰 Bel colpo!", "💰 È nostro!", "💰 Evvai!", "💰 Preso, grande!", "💰 Che mano!"]
  };
  function C() { return window.SGCarte; } // aiuti condivisi (carte + logica di presa)
  function squadra(s) { return (s % 2 === 0) ? "noi" : "loro"; }
  function trova(a, id) { for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function importanza(c) { return c.id === "D7" ? 12 : c.s === "D" ? 3 : c.v === 7 ? 2.2 : (c.v === 6 || c.v === 1) ? 1.6 : 1; }
  function pesca(a) { return a[Math.floor(Math.random() * a.length)]; }
  function nomeCarta(c) { return (c.v === 1 ? "A" : c.v === 8 ? "F" : c.v === 9 ? "C" : c.v === 10 ? "R" : c.v) + (SEMI_TXT[c.s] || ""); }

  SG.registra({
    id: "scopone",
    nome: "Scopone",
    icona: "🃏",
    descrizione: "Lo scopone in quattro (a squadre): tu e il tuo compagno contro due avversari. Varianti classico e scientifico. Contro il computer.",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 3, etichettaGiocatori: "🤖 Contro il computer",   // (tu e 3 bot: non c'è ancora l'online)
    modi: [{ modo: "bot", icona: "🤖", nome: "Contro il computer", sotto: "Tu e un Bot contro due Bot" }],
    regole: [
      "Si gioca <b>in quattro, a due squadre</b>: tu e il tuo <b>compagno</b> (di fronte) contro due <b>avversari</b>. Qui giochi contro il computer: gli altri tre sono Bot.",
      "<b>Scientifico</b>: 10 carte a testa, niente carte sul tavolo. <b>Classico</b>: 9 a testa + 4 sul tavolo.",
      "Le carte sono date <b>tutte subito</b> (non si pesca). Nel tuo turno giochi una carta: se ha lo stesso valore di una del tavolo la <b>prendi</b>, altrimenti puoi prendere una <b>somma</b> di più carte.",
      "Svuoti il tavolo? <b>Scopa</b> (+1), tranne con l'ultima carta. A fine mano le carte rimaste vanno all'ultima squadra che ha preso.",
      "Punti a fine mano (sommando i due compagni): <b>Carte, Denari, Settebello, Primiera</b> e le <b>Scope</b>. Vince la squadra che arriva per prima ai <b>punti scelti</b> (di solito " + TARGET + "; a pari punti si gioca un'altra mano). Si può giocare anche <b>una mano sola</b>.",
      "Accanto al nome di ogni giocatore vedi l'<b>ultima carta</b> che ha giocato. Se chiudi l'app a metà, la prossima volta puoi <b>riprendere la partita</b>."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.variante = "scientifico"; dove.difficolta = "medio"; dove.aiuto = true;
      var bSci, bCla, dWrap;
      // c'è una partita lasciata a metà? lo diciamo subito (si riprende toccando Comincia)
      var prof = window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo(), sosp = leggiSalvata(prof && prof.nome ? String(prof.nome).trim().slice(0, 16) : undefined);
      if (sosp) box.appendChild(el("p", { class: "modulo-nota", style: "margin:0 0 10px;padding:8px 10px;border-radius:10px;background:rgba(255,212,59,.14);border:1.5px solid rgba(255,212,59,.5)",
        html: "⏸️ Hai una partita a metà (<b>Noi " + sosp.st.punti.noi + " — " + sosp.st.punti.loro + " Loro</b>): tocca <b>Comincia</b> per riprenderla o per farne una nuova." }));
      function selV(v) { dove.variante = v; bSci.className = "modo-chip" + (v === "scientifico" ? " attiva" : ""); bCla.className = "modo-chip" + (v === "classico" ? " attiva" : ""); }
      bSci = el("button", { class: "modo-chip attiva", onclick: function () { selV("scientifico"); } }, [
        el("span", { class: "mi", text: "🎓" }), el("div", {}, [el("div", { class: "mt", text: "Scientifico" }), el("div", { class: "ms", text: "10 carte, tavolo vuoto" })])]);
      bCla = el("button", { class: "modo-chip", onclick: function () { selV("classico"); } }, [
        el("span", { class: "mi", text: "📜" }), el("div", {}, [el("div", { class: "mt", text: "Classico" }), el("div", { class: "ms", text: "9 carte + 4 sul tavolo" })])]);
      box.appendChild(el("div", { class: "etichetta", text: "Variante" }));
      box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bSci, bCla]));
      dWrap = el("div", {});
      dWrap.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura dei Bot" }));
      function righina(scelte, chiave) {   // fila di scelte che si accendono
        var dg = el("div", { style: "display:flex;gap:8px" });
        scelte.forEach(function (d) {
          var b = el("button", { class: "modo-chip" + (d[0] === dove[chiave] ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
            dove[chiave] = d[0]; [].forEach.call(dg.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
          } }, [el("div", { class: "mt", text: d[1] })]);
          b.style.flex = "1"; dg.appendChild(b);
        });
        return dg;
      }
      dWrap.appendChild(righina([["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]], "difficolta"));
      box.appendChild(dWrap);
      C().sceltaTraguardo(el, box, dove);   // i punti da raggiungere
      box.appendChild(el("p", { class: "modulo-nota", style: "margin:4px 0 0", text: "Le vittorie contano per i trofei nelle partite da 11 punti in su." }));
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Illumina le carte che prendono" }));
      box.appendChild(righina([[true, "Sì"], [false, "No"]], "aiuto"));
      box.appendChild(el("p", { class: "modulo-nota", style: "margin-top:10px", text: "Giochi tu (in basso) col tuo compagno di fronte, contro due avversari ai lati: sono tutti Bot." }));
    },
    avvia: function (t) {
      if (!window.SGCarte) { var s = t.schermata({ icona: "⚠️", titolo: "Un attimo" }); s._contenuto.appendChild(t.el("p", { text: "Ricarica la pagina e riprova." })); s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci })); return t.mostra(s); }
      var imp = t.impostazioni || {};
      var mioNome = (t.nomeProfilo && t.nomeProfilo()) || t.giocatori[0] || "Tu";
      var sv = leggiSalvata(mioNome);
      function nuova() { cancellaSalvata(); localeScopone(t, imp.variante || "scientifico", imp.difficolta || "medio", imp.aiuto !== false, null); }
      if (!sv) return nuova();
      // c'era una partita lasciata a metà: si può riprendere
      var p = sv.st.punti, s2 = t.schermata({ icona: "🃏", titolo: "Partita in sospeso", sotto: "Scopone " + (sv.st.variante === "classico" ? "classico" : "scientifico"), indietro: t.esci });
      s2._contenuto.appendChild(t.el("p", { style: "text-align:center;font-size:1.05rem;line-height:1.5", text: "Avevi lasciato una partita a metà. Vuoi riprenderla?" }));
      s2._contenuto.appendChild(t.el("div", { style: "text-align:center;font-size:1.4rem;font-weight:800;margin:10px 0",
        html: "Noi <span style='color:#69db7c'>" + p.noi + "</span> — " + p.loro + " Loro <span class='tenue' style='font-size:.9rem'>(" + C().testoTraguardo(sv.st.traguardo) + ")</span>" }));
      s2._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "▶ Riprendi la partita", onclick: function () { localeScopone(t, sv.st.variante, sv.diff || "medio", sv.aiuto !== false, sv.st); } }));
      s2._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🔄 Nuova partita", onclick: nuova }));
      t.mostra(s2);
    }
  });

  // ---------- partita salvata sul telefono ----------
  function salvaPartita(st, diff, aiuto) {
    try {
      if (st.fase === "fine") return localStorage.removeItem(SALVA);
      localStorage.setItem(SALVA, JSON.stringify({ v: 1, quando: Date.now(), nome: st.nomi[0], diff: diff, aiuto: aiuto, st: st }));
    } catch (e) {}
  }
  function leggiSalvata(nome) {
    try {
      var o = JSON.parse(localStorage.getItem(SALVA) || "null");
      if (!o || o.v !== 1 || !o.st || !o.st.mani || !o.st.punti || o.st.fase === "fine") return null;
      if (Date.now() - (o.quando || 0) > 3 * 864e5 || (nome !== undefined && o.nome && o.nome !== nome)) return null;   // vecchia o di un altro profilo (senza nome: va bene qualsiasi)
      return o;
    } catch (e) { return null; }
  }
  function cancellaSalvata() { try { localStorage.removeItem(SALVA); } catch (e) {} }

  // ---------- motore ----------
  function creaStato(variante, traguardo) {   // traguardo: i punti da raggiungere (0 = una mano sola)
    var st = {
      traguardo: traguardo == null ? TARGET : traguardo,
      variante: variante, mazzo: [], tavolo: [], mani: [[], [], [], []], prese: [[], [], [], []],
      scope: [0, 0, 0, 0], turno: 0, ultimaPresa: null, fase: "gioco", primo: 0,
      punti: { noi: 0, loro: 0 }, ultimoRound: null, presa: null, messaGiu: null, messaDa: 0,
      nomi: {}, posti: {}, ultime: {}, manoN: 0, giocate: 0, fumo: null, resto: null, risultatoDato: false
    };
    return st;
  }
  function mischia(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function maniVuote(st) { return st.mani[0].length === 0 && st.mani[1].length === 0 && st.mani[2].length === 0 && st.mani[3].length === 0; }

  function distribuisci(st) {
    st.mazzo = C().creaMazzo(mischia);
    if (st.variante === "classico") { st.tavolo = st.mazzo.splice(0, 4); for (var s = 0; s < 4; s++) st.mani[s] = st.mazzo.splice(0, 9); }
    else { st.tavolo = []; for (var s2 = 0; s2 < 4; s2++) st.mani[s2] = st.mazzo.splice(0, 10); }
    st.prese = [[], [], [], []]; st.scope = [0, 0, 0, 0]; st.ultimaPresa = null; st.turno = st.primo; st.fase = "gioco"; st.presa = null; st.messaGiu = null;
    st.posti = {}; st.ultime = {}; st.manoN = (st.manoN || 0) + 1; st.giocate = 0; st.fumo = null; st.resto = null;
  }

  // esegue una mossa del giocatore "seat": ritorna {presa, scopa, sette, somma}. La fine mano la chiude chi chiama (dopo aver mostrato l'ultima giocata).
  function applica(st, seat, cartaId, presaIds) {
    st.presa = null; st.messaGiu = null;
    var carta = trova(st.mani[seat], cartaId); if (!carta || st.turno !== seat || st.fase !== "gioco") return { errore: true };
    st.mani[seat] = st.mani[seat].filter(function (c) { return c.id !== cartaId; });
    var opts = C().catture(carta.v, st.tavolo);
    var ev = { presa: false, scopa: false, sette: false, somma: false };
    st.ultime[seat] = carta; st.giocate++;
    if (opts.length) {
      var set = presaIds && C().validaSet(opts, presaIds) ? presaIds : opts[0];
      var tavoloPrima = st.tavolo.slice();
      var presi = set.map(function (id) { return trova(st.tavolo, id); }).filter(Boolean);
      st.tavolo = st.tavolo.filter(function (c) { return set.indexOf(c.id) < 0; });
      st.prese[seat] = st.prese[seat].concat(presi, [carta]);
      st.ultimaPresa = seat; ev.presa = true;
      ev.sette = carta.id === "D7" || set.indexOf("D7") >= 0; ev.somma = set.length >= 2;
      if (st.tavolo.length === 0 && !maniVuote(st)) { st.scope[seat]++; ev.scopa = true; }
      st.presa = { chi: seat, carta: carta, scopa: ev.scopa, tavoloPrima: tavoloPrima, presiIds: set, n: st.giocate };
    } else {
      st.tavolo.push(carta); st.messaGiu = carta.id; st.messaDa = seat;
    }
    st.turno = (seat + 1) % 4;
    return ev;
  }
  function fineMano(st) {
    if (st.tavolo.length && st.ultimaPresa != null) { st.prese[st.ultimaPresa] = st.prese[st.ultimaPresa].concat(st.tavolo); st.tavolo = []; }
    var r = contaScopone(st);
    st.punti.noi += r.puntiNoi; st.punti.loro += r.puntiLoro;
    r.tot = { noi: st.punti.noi, loro: st.punti.loro };
    st.ultimoRound = r; st.presa = null; st.resto = null; st.fumo = null;
    st.fase = C().partitaFinita(st.traguardo, st.punti.noi, st.punti.loro) ? "fine" : "fineround";
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
      pCarte: pCarte, pDen: pDen, pPrim: pPrim, scopeNoi: scopeNoi, scopeLoro: scopeLoro, scopeSeat: st.scope.slice(), puntiNoi: pts("noi"), puntiLoro: pts("loro") };
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
    if (diff === "difficile" && mosse.length > 1) return mossaDifficile(st, seat, mosse);
    function punteggio(m) {
      var s = 0;
      if (m.cattura) {
        s += importanza(m.c);
        m.set.forEach(function (id) { s += importanza(trova(tavolo, id)); });
        if (tavolo.length - m.set.length === 0) s += 6; // scopa
      } else s -= importanza(m.c) * 0.6;   // posa la carta meno preziosa
      return s;
    }
    var best = mosse[0], bs = -1e9;
    mosse.forEach(function (m) { var s = punteggio(m) + Math.random() * 0.25; if (s > bs) { bs = s; best = m; } });
    return best;
  }

  // prese possibili su un tavolo, calcolate una volta: valore -> liste di carte (singolo uguale obbligato)
  function tabellaPrese(tav) {
    var sing = {}, per = {}, n = tav.length;
    tav.forEach(function (c) { (sing[c.v] = sing[c.v] || []).push([c]); });
    if (n <= 12) for (var mask = 3; mask < (1 << n); mask++) {
      if (!(mask & (mask - 1))) continue;   // almeno due carte
      var s = 0, set = [];
      for (var i = 0; i < n && s <= 10; i++) if (mask & (1 << i)) { s += tav[i].v; set.push(tav[i]); }
      if (s <= 10) (per[s] = per[s] || []).push(set);
    }
    return function (v) { return sing[v] || per[v] || []; };
  }
  // Bot difficile: ricorda le carte uscite (le altre sono in mano agli altri tre) e immagina tante distribuzioni possibili.
  // Per ogni sua mossa: il prossimo avversario risponde col meglio per lui (pensando anche al mio compagno), poi il compagno.
  function mossaDifficile(st, seat, mosse) {
    var tavolo = st.tavolo, viste = {};
    st.mani[seat].concat(tavolo).forEach(function (c) { viste[c.id] = 1; });
    st.prese.forEach(function (p) { p.forEach(function (c) { viste[c.id] = 1; }); });
    var ignote = C().creaMazzo().filter(function (c) { return !viste[c.id]; });
    var avv = (seat + 1) % 4, comp = (seat + 2) % 4, nA = st.mani[avv].length, nC = st.mani[comp].length;
    var resto = st.mani[0].length + st.mani[1].length + st.mani[2].length + st.mani[3].length;   // carte ancora da giocare (con la mia)
    var K = tavolo.length > 8 ? 8 : 14, campioni = [];
    for (var k = 0; k < K; k++) { var mz = mischia(ignote); campioni.push([mz.slice(0, nA), mz.slice(nA, nA + nC)]); }
    function valore(carta, presi, restano, scopaVale) {
      var s = importanza(carta); presi.forEach(function (c) { s += importanza(c); });
      if (restano === 0 && scopaVale) s += 7;
      return s;
    }
    function togli(tav, presi) { return tav.filter(function (x) { return presi.indexOf(x) < 0; }); }
    function migliorePresa(mano, tav, prese, scopaVale) {   // la presa migliore che una mano può fare su questo tavolo (0 se nessuna)
      var b = 0;
      mano.forEach(function (c) { prese(c.v).forEach(function (pr) { var v = valore(c, pr, tav.length - pr.length, scopaVale); if (v > b) b = v; }); });
      return b;
    }
    var best = mosse[0], bs = -1e9;
    mosse.forEach(function (m) {
      var presi = m.cattura ? m.set.map(function (id) { return trova(tavolo, id); }) : [];
      var tav1 = m.cattura ? togli(tavolo, presi) : tavolo.concat([m.c]);
      var g1 = m.cattura ? valore(m.c, presi, tav1.length, resto > 1) : -0.35 * importanza(m.c);
      var prese1 = tabellaPrese(tav1), tot = 0;
      campioni.forEach(function (cp) {
        var hA = cp[0], hC = cp[1];
        if (!hA.length) { tot += g1 + 0.6 * migliorePresa(hC, tav1, prese1, resto > 3); return; }
        var bV = -1e9, g2b = 0, g3b = 0;
        hA.forEach(function (c) {
          var pp = prese1(c.v), giocate = pp.length ? pp : [null];
          giocate.forEach(function (pr) {
            var tav2 = pr ? togli(tav1, pr) : tav1.concat([c]);
            var g2 = pr ? valore(c, pr, tav2.length, resto > 2) : -0.35 * importanza(c);
            var g3 = hC.length ? migliorePresa(hC, tav2, tabellaPrese(tav2), resto > 3) : 0;
            var v = g2 - 0.6 * g3;
            if (v > bV) { bV = v; g2b = g2; g3b = g3; }
          });
        });
        tot += g1 - g2b + 0.6 * g3b;
      });
      var s = tot / K + Math.random() * 0.03;
      if (s > bs) { bs = s; best = m; }
    });
    return best;
  }

  // ---------- trofei: contatori per il profilo (tu = seat 0, squadra "noi") ----------
  function tracciaScopone(st, seat, ev, primaDellaMossa) {
    var R = st._T || (st._T = { scope: 0, primoTurno: 0 });
    if (seat === 0 && ev.scopa) {
      R.scope++;
      if (st.variante === "classico" && primaDellaMossa === 9) R.primoTurno++;   // la tua prima carta della smazzata
    }
    if (st.fase === "gioco") return;
    // fine smazzata: punti di squadra
    var r = st.ultimoRound, c = { scopePersonali: R.scope, scopaPrimoTurno: R.primoTurno };
    if (r.sette === "noi") c.settebello = 1;
    if (r.pDen === "noi") c.denari = 1;
    if (r.pCarte === "noi") c.carte = 1;
    if (r.pPrim === "noi") c.primiera = 1;
    if (r.sette === "noi" && r.pDen === "noi" && r.pCarte === "noi" && r.pPrim === "noi") c.grandeSlam = 1;
    st._T = null;
    var sets = [], recs = [];
    if (st.fase === "fine" && !(st.traguardo != null && st.traguardo < TARGET)) {   // (con una mano sola o pochi punti sarebbero regalati)
      var vinto = st.punti.noi > st.punti.loro, sci = st.variante === "scientifico";
      var s0 = (window.SGNube && SGNube.statGioco && SGNube.statGioco("scopone")) || {}, serie = s0.serieSciOra || 0;
      c.partite = 1;
      if (vinto) {
        c.vinte = 1; c[sci ? "vinteScientifico" : "vinteClassico"] = 1;
        if (st.punti.loro === 0) c.vinteAZero = 1;
      }
      if (sci) { serie = vinto ? serie + 1 : 0; recs.push(["serieSciMax", serie]); sets.push(["serieSciOra", serie]); }
    }
    if (!(window.SGNube && SGNube.disponibile() && SGNube.profilo())) return;
    var incrs = []; for (var k in c) if (c[k]) incrs.push([k, c[k]]);
    SGNube.salvaProgressi(null, "scopone", incrs, recs, sets);
  }

  // ---------- suoni (niente vibrazione da sola: vibra solo il tuo tocco) ----------
  function suonoPresa(scopa) {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try { var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.setValueAtTime(scopa ? 520 : 360, t); o.frequency.exponentialRampToValueAtTime(scopa ? 880 : 300, t + 0.12);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (scopa ? 0.28 : 0.16));
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.3);
    } catch (e) {}
  }
  function suonoVittoria() {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      [523, 659, 784, 1047].forEach(function (f, i) {
        var t = ctx.currentTime + i * 0.13, o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "triangle"; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + (i === 3 ? 0.6 : 0.22));
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.65);
      });
    } catch (e) {}
  }
  function tocco() { try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) {} }   // solo quando tocchi tu una carta per sceglierla

  // ---------- controller locale (tu = seat 0) ----------
  function localeScopone(t, variante, diff, aiuto, salvata) {
    C().assicuraStile(); stileScopone();
    var finita = false, timers = [];
    var mioNome = (t.nomeProfilo && t.nomeProfilo()) || t.giocatori[0] || "Tu";
    var st, sel = { carta: null, presa: [] };
    function nomi() {   // i tre bot fissi (SG.bot), scelti dalla bravura: 1 a sinistra, 2 il compagno di fronte, 3 a destra
      var b = SG.bot && SG.bot.prendi ? SG.bot.prendi(3, { livello: diff, escludi: [mioNome] }) : [];
      st.nomi = { 0: mioNome }; st.omini = {};
      [1, 2, 3].forEach(function (s, i) { var x = b[i] || { nome: "Bot " + s, omino: null }; st.nomi[s] = x.nome; st.omini[s] = x.omino || null; });
    }
    function nuovaPartita() { st = creaStato(variante, C().traguardoDa(t.impostazioni)); nomi(); distribuisci(st); }
    if (salvata) { st = salvata; nomi(); st.presa = null; st.fumo = null; st.resto = null; st.posti = st.posti || {}; st.ultime = st.ultime || {}; }
    else nuovaPartita();

    // i tempi dei bot: si fermano tutti quando si esce (così la partita non torna da sola sopra la home)
    function dopoMs(fn, ms) {
      var id = setTimeout(function () {
        timers = timers.filter(function (x) { return x !== id; });
        if (finita) return;
        if (V.uscito()) { chiudi(); return; }   // la schermata non c'è più (uscito in un altro modo)
        fn();
      }, ms);
      timers.push(id);
    }
    function chiudi() { finita = true; timers.forEach(clearTimeout); timers = []; if (window.SGMusica) window.SGMusica.ferma(); }

    var V = vista(t, {
      onCella: function (i) { tapMano(i); },
      onTavolo: function (id) { tapTavolo(id); },
      onAvanti: function () { st.primo = (st.primo + 1) % 4; distribuisci(st); sel = { carta: null, presa: [] }; salvaPartita(st, diff, aiuto); render(); avviaGiro(); },
      onNuova: function () { nuovaPartita(); sel = { carta: null, presa: [] }; salvaPartita(st, diff, aiuto); render(); avviaGiro(); },
      onEsci: function () { chiudi(); cancellaSalvata(); t.esci(); }
    }, aiuto, function () { return finita; });

    function render() { if (!finita) V.disegna(st, sel); }

    function tapMano(id) {
      if (finita || st.turno !== 0 || st.fase !== "gioco" || st.presa) return;
      var carta = trova(st.mani[0], id); if (!carta) return;
      tocco();
      var opts = C().catture(carta.v, st.tavolo);
      if (opts.length === 0) { sel = { carta: null, presa: [] }; gioco(0, id, null); return; }
      if (opts.length === 1) { sel = { carta: null, presa: [] }; gioco(0, id, opts[0]); return; }
      sel = (sel.carta === id) ? { carta: null, presa: [] } : { carta: id, presa: [] }; render();
    }
    function tapTavolo(id) {
      if (finita || st.turno !== 0 || st.fase !== "gioco" || st.presa) return;
      var carta = sel.carta ? trova(st.mani[0], sel.carta) : null; if (!carta) return;
      var opts = C().catture(carta.v, st.tavolo);
      var p = sel.presa.slice(); var k = p.indexOf(id); if (k >= 0) p.splice(k, 1); else p.push(id);
      if (C().validaSet(opts, p)) { tocco(); var cid = sel.carta; sel = { carta: null, presa: [] }; gioco(0, cid, p); return; }
      if (C().prefisso(opts, p)) { tocco(); sel.presa = p; }
      render();
    }
    function gioco(seat, id, presa) {
      var primaDellaMossa = st.mani[0].length;
      var ev = applica(st, seat, id, presa); if (ev.errore) return;
      tracciaScopone(st, seat, ev, primaDellaMossa);
      // il fumetto: chi ha fatto il colpo, oppure il compagno che ti fa i complimenti
      st.fumo = null;
      if (seat === 0) { if (ev.scopa) st.fumo = { s: 2, txt: pesca(FRASI.bravo) }; else if (ev.sette) st.fumo = { s: 2, txt: pesca(FRASI.braviSette) }; }
      else if (ev.scopa) st.fumo = { s: seat, txt: pesca(FRASI.scopa), forte: true };
      else if (ev.sette) st.fumo = { s: seat, txt: pesca(FRASI.sette), forte: true };
      else if (ev.somma && Math.random() < 0.5) st.fumo = { s: seat, txt: pesca(FRASI.somma) };
      if (ev.presa) suonoPresa(ev.scopa);
      salvaPartita(st, diff, aiuto);
      render(); dopo(ev);
    }
    function dopo(ev) {
      if (maniVuote(st)) {   // l'ultima carta: prima si vede la giocata, poi le carte rimaste, poi i punti
        dopoMs(function () {
          st.presa = null; st.fumo = null;
          if (st.tavolo.length && st.ultimaPresa != null) {
            st.resto = squadra(st.ultimaPresa); render();
            dopoMs(chiudiMano, 1600);
          } else chiudiMano();
        }, ev.presa ? (ev.scopa ? 1500 : 1100) : 800);
        return;
      }
      if (ev.presa) dopoMs(function () { st.presa = null; st.fumo = null; render(); giro(); }, ev.scopa ? 1500 : 1000);
      else giro();
    }
    function chiudiMano() {
      fineMano(st);
      tracciaScopone(st, -1, {}, 0);
      salvaPartita(st, diff, aiuto);   // a fine partita cancella il salvataggio
      render();
    }
    function giro() { // fa giocare i bot finché non tocca a te (o finisce)
      if (finita || st.fase !== "gioco") return;
      if (st.turno === 0) { render(); return; }
      dopoMs(function () {
        if (st.fase !== "gioco" || st.turno === 0 || st.presa) { render(); return; }
        var m = mossaBot(st, st.turno, diff); gioco(st.turno, m.carta, m.presa);
      }, Math.max(750 + Math.random() * 400, V.dealFino() - Date.now() + 250));   // i bot aspettano la fine della distribuzione
    }
    function avviaGiro() { if (st.fase === "gioco" && st.turno !== 0) giro(); }

    render();
    if (st.fase === "gioco" && maniVuote(st)) chiudiMano();   // ripresa proprio dopo l'ultima carta
    else avviaGiro(); // se inizia (o tocca) a un bot
  }

  // ---------- stile in più (solo Scopone) ----------
  var DIREZ = { 0: [0, 210], 1: [-150, -190], 2: [0, -210], 3: [150, -190] };   // verso ogni posto (sul tavolo inclinato)
  function stileScopone() {
    if (document.getElementById("sg-scopone-css")) return;
    var r = [
      ".sc-carta.sp-puo{box-shadow:0 0 0 3px rgba(105,219,124,.9),0 2px 6px rgba(0,0,0,.45)}",
      ".sc-carta.sp-no{opacity:.38;transition:opacity .2s}",
      ".sc-carta{transition:opacity .2s}",
      ".sp-ult{font-size:.66rem;font-weight:900;background:#fff7e0;color:#3b2400;border-radius:6px;padding:0 4px;line-height:1.35}",
      ".sp-ult:empty{display:none}",
      ".sc-avv-carte .sc-dorso{transition:transform .25s ease}",
      ".sc-fumetto.sp-dx{transform-origin:100% 100%}",
      ".sc-fumetto.sp-dx::after{left:auto;right:-6px;border:7px solid transparent;border-left-color:#fff;border-right:0}",
      ".sc-fumetto.scopa.sp-dx::after{border-left-color:#ffc21a}",
      ".sc-fumetto.sp-frase{font-size:.95rem}",
      // fine mano: tabella Noi / Loro
      ".sp-tab{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:4px;font-size:.95rem}",
      ".sp-tab > div{padding:5px 8px;border-radius:8px;background:rgba(255,255,255,.05);text-align:center}",
      ".sp-tab > div.sx{text-align:left}",
      ".sp-tab > div.th{background:none;font-weight:800;color:rgba(255,255,255,.75);padding:2px 8px}",
      ".sp-tab > div.ok{background:rgba(105,219,124,.18);font-weight:800}",
      ".sp-tab > div.tot{background:rgba(255,212,59,.14);font-weight:800}",
      ".sp-avs{display:flex;justify-content:center;gap:10px;margin:2px 0 6px}",
      ".sp-avs > div{width:78px}",
      ".sp-avs svg{display:block;width:100%;height:auto}",
      ".sp-avs.festa > div{animation:spSalta 1s ease-in-out infinite}",
      ".sp-avs.festa > div:nth-child(2){animation-delay:.25s}",
      "@keyframes spSalta{0%,100%{transform:none}40%{transform:translateY(-12px)}}",
      ".sp-cori{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:50}",
      ".sp-cori i{position:absolute;top:-20px;width:9px;height:14px;border-radius:2px;animation:spCade 2.6s ease-in forwards}",
      "@keyframes spCade{0%{transform:translateY(0) rotate(0);opacity:1}85%{opacity:1}100%{transform:translateY(105vh) rotate(540deg);opacity:0}}"
    ];
    // le carte volano verso chi le prende / arrivano da chi le gioca (solo transform e opacity)
    [0, 1, 2, 3].forEach(function (d) {
      var x = DIREZ[d][0], y = DIREZ[d][1], xa = Math.round(x * 0.7), ya = Math.round(y * 0.7);
      r.push("@keyframes spVia" + d + "{0%,35%{transform:none;opacity:1}100%{transform:translate(" + x + "px," + y + "px) scale(.4);opacity:0}}");
      r.push(".sp-via" + d + "{animation:spVia" + d + " .95s ease-in forwards;position:relative;z-index:4}");
      r.push("@keyframes spGioca" + d + "{0%{transform:translate(" + xa + "px," + ya + "px) scale(.92);opacity:0}16%{opacity:1}30%,38%{transform:none;opacity:1}100%{transform:translate(" + x + "px," + y + "px) scale(.4);opacity:0}}");
      r.push(".sp-gioca" + d + "{animation:spGioca" + d + " .95s ease-in forwards}");
      r.push("@keyframes spPosa" + d + "{0%{transform:translate(" + xa + "px," + ya + "px) scale(1.08);opacity:0}60%{opacity:1}100%{transform:none;opacity:1}}");
      r.push(".sp-posa" + d + "{animation:spPosa" + d + " .4s ease-out}");
    });
    var s = document.createElement("style"); s.id = "sg-scopone-css"; s.textContent = r.join(""); document.head.appendChild(s);
  }

  // ---------- disegno ----------
  // La stanza (avatar, tavolo, mensola) si costruisce una volta per mano; poi a ogni mossa si cambia solo quello che serve.
  var cacheFig = {};
  function vista(t, cb, aiuto, eFinita) {
    var el = t.el, mont = null, dealFino = 0, schermo = null;

    // il disegno di un avatar con un'espressione (lo fa la stanza condivisa; si tiene da parte)
    function figHtml(nome, cfg, faccia) {
      var k = nome + "|" + faccia + "|" + (cfg ? JSON.stringify(cfg) : "");
      if (cacheFig[k] == null) {
        var R0 = C().stanza4(el, { scH: 300, pianoW: 300, pianoH: 200 }, [{ nome: nome, cfg: cfg, n: 0, faccia: faccia }]);
        cacheFig[k] = R0.posti[0].fig.innerHTML;
      }
      return cacheFig[k];
    }
    function misure() {
      var A = Math.min(window.innerWidth || 375, 600) - 46, wH = Math.max(40, Math.min(70, Math.floor((A - 4 * 8) / 5)));
      var M = C().misureStanza4("scopone", wH, 2);
      return { M: M, wH: wH, k: M.corr.k + "|" + wH };
    }

    function disegna(st, sel) {
      if (st.fase === "fineround" || st.fase === "fine") { mont = null; return fine(st); }
      var ms = misure();
      var nuova = !mont || !document.body.contains(mont.s) || mont.manoN !== st.manoN;
      if (nuova || mont.k !== ms.k) return costruisci(st, sel, ms, nuova && st.giocate === 0);
      aggiorna(st, sel);
    }

    function costruisci(st, sel, ms, deal) {
      var M = ms.M, wH = ms.wH, ASP = C().ASP_CARTA;
      if (window.SGMusica) window.SGMusica.avvia();
      var box = el("div", { style: "display:flex;flex-direction:column" });
      var head = el("div", { class: "sc-testata" });   // punteggio e musica DENTRO la stanza (in alto; a sinistra c'è il tasto indietro)
      var punti = el("div", { style: "font-size:.82rem;font-weight:700" });
      head.appendChild(punti);
      if (window.SGMusica) head.appendChild(window.SGMusica.bottone(el));
      // la stanza: un bot a sinistra, il compagno di fronte, l'altro bot a destra
      var sedie = [1, 2, 3].map(function (s) { return { cfg: (st.omini && st.omini[s]) || null, nome: st.nomi[s], n: st.mani[s].length, turno: false, mia: s === 2, faccia: "normale", fumetto: null }; });
      var R = C().stanza4(el, M, sedie);
      R.scena.appendChild(head);
      R.posti.forEach(function (p) { p.ult = el("span", { class: "sp-ult" }); p.targa.appendChild(p.ult); p.stato = { faccia: "normale" }; });
      var area = el("div", { class: "sc-terra sc-t3d" });
      R.feltro.appendChild(area);
      box.appendChild(R.scena);
      var aiutoEl = el("div", { class: "sc-aiuto", style: "display:none" });
      R.scena.appendChild(aiutoEl);
      // la tua mano: due file da 5 sulla mensola di legno
      var mensola = el("div", { class: "sc-mensola", style: "min-height:" + (2 * Math.round(wH * ASP) + 6 + 34) + "px" });
      var manoW = el("div", { class: "sc-mano-riga", style: "max-width:" + (5 * wH + 4 * 8 + 4) + "px;margin:0 auto;row-gap:6px" });
      mensola.appendChild(manoW);
      var preseEl = el("div", { class: "sc-prese" });
      mensola.appendChild(preseEl);
      box.appendChild(mensola);

      // montaggio: la schermata resta la stessa per tutta la partita, cambia solo il contenuto quando serve
      if (mont && mont.cont && document.body.contains(mont.s)) {
        mont.cont.replaceChild(box, mont.box); mont.piede.innerHTML = "";
      } else {
        var s = t.schermata({ indietro: function () { if (window.confirm("Uscire dalla partita?")) cb.onEsci(); } });
        s.classList.add("sc-piena");   // stanza da bordo a bordo
        s._contenuto.appendChild(box); t.mostra(s); schermo = s;
        mont = { s: s, cont: s._contenuto, piede: s._piede };
      }
      mont.box = box; mont.R = R; mont.M = M; mont.wH = wH; mont.k = ms.k; mont.manoN = st.manoN;
      mont.punti = punti; mont.area = area; mont.grid = null; mont.tavEls = {}; mont.manoW = manoW; mont.manoEls = {};
      mont.preseEl = preseEl; mont.aiutoEl = aiutoEl; mont.presaVista = null; mont.restoVisto = false; mont.gioc = null; mont.costruendo = true;
      if (C().correggiStanza4(M, mont.cont.parentNode, mensola, function () { costruisci(st, sel, misure(), deal); })) return;
      R.siedi();
      R.posti.forEach(function (p) { p.w = parseFloat(p.box.style.width) || 100; });
      mont.nuoveTav = [];
      aggiorna(st, sel);
      mont.costruendo = false;
      // con le carte in mano la mensola può crescere un poco: se la schermata esce dallo schermo, si rifà più bassa (una volta)
      if (C().ricontrollaStanza4 && C().ricontrollaStanza4(M, mont.cont.parentNode)) return costruisci(st, sel, misure(), deal);
      if (deal) {
        var manoEls = [].slice.call(manoW.children);
        dealFino = Date.now() + C().animaDistribuzione4(mont.nuoveTav, manoEls,
          R.posti.map(function (p) { return [].slice.call(p.vent.children); }), R.feltro, 0.07);
      }
    }

    // solo le parti che cambiano
    function aggiorna(st, sel) {
      var R = mont.R, M = mont.M;
      var mioTurno = (st.turno === 0 && st.fase === "gioco" && !st.presa && !st.resto);
      mont.punti.innerHTML = "Noi <b style='color:#69db7c'>" + st.punti.noi + "</b> — Loro <b>" + st.punti.loro + "</b> <span class='tenue' style='font-weight:600'>(" + C().testoTraguardo(st.traguardo) + ")</span>";

      // --- i tre posti: faccia, fumetto, targa di turno, carte in mano, ultima carta giocata ---
      var diTurno = -1;
      R.posti.forEach(function (p, i) {
        var s = i + 1, faccia = "normale", fumetto = null, forte = false;
        if (st.presa && st.presa.scopa) faccia = squadra(s) === squadra(st.presa.chi) ? "esulta" : "triste";
        else if (st.presa && st.fumo && st.fumo.forte && st.fumo.s === s) faccia = "esulta";
        else if (st.turno === s && st.fase === "gioco" && !st.presa && !st.resto) { faccia = "pensa"; fumetto = "🤔"; }
        if (st.fumo && st.fumo.s === s) { fumetto = st.fumo.txt; forte = !!st.fumo.forte; if (faccia === "normale" || faccia === "pensa") faccia = "esulta"; }
        var turno = st.turno === s && !st.presa && !st.resto && st.fase === "gioco";
        if (turno) diTurno = i;
        var o = p.stato;
        if (o.faccia !== faccia) {
          p.fig.innerHTML = figHtml(st.nomi[s], (st.omini && st.omini[s]) || null, faccia);
          p.box.classList.toggle("pensa", faccia === "pensa");
          if (faccia === "esulta" && st.presa && st.presa.chi === s && p.fig.animate) p.fig.animate([{ transform: "none" }, { transform: "translateY(-18px)" }, { transform: "none" }], { duration: 650, easing: "ease-out" });
        }
        if (o.fumetto !== fumetto) {
          var vecchio = p.box.querySelector(".sc-fumetto"); if (vecchio) vecchio.parentNode.removeChild(vecchio);
          if (fumetto) {
            var fm = el("div", { class: "sc-fumetto" + (forte || faccia === "esulta" && fumetto.indexOf("🤔") < 0 ? " scopa" : "") + (fumetto.length > 9 ? " sp-frase" : ""), text: fumetto });
            p.box.appendChild(fm);
            fm.style.left = Math.round(p.w * (i === 2 ? 0.05 : 0.7)) + "px"; fm.style.top = Math.round(p.w * 0.15) + "px";
            // se esce dallo schermo a destra, il fumetto va dall'altra parte della testa
            var sw = R.scena.clientWidth;
            if (p.box.offsetLeft + fm.offsetLeft + fm.offsetWidth > sw - 4) { fm.classList.add("sp-dx"); fm.style.left = Math.round(p.w * 0.32 - fm.offsetWidth) + "px"; }
          }
        }
        if (o.turno !== turno) p.targa.classList.toggle("turno", turno);
        var n = st.mani[s].length;
        if (o.n !== n) {
          p.targa.querySelector(".sc-num").textContent = n;
          while (p.vent.children.length > n) p.vent.removeChild(p.vent.lastChild);
          ventaglio(p);
        }
        var u = st.ultime[s] ? nomeCarta(st.ultime[s]) : "";
        if (o.u !== u) p.ult.textContent = u;
        p.stato = { faccia: faccia, fumetto: fumetto, turno: turno, n: n, u: u };
      });
      // gli altri guardano chi deve giocare (solo gli occhi): verso la sedia di turno, o in basso se tocca a te
      R.posti.forEach(function (p, i) {
        var oc = p.fig.querySelector(".om-occhi"); if (!oc) return;
        var dx = 0, dy = 0;
        if (i !== diTurno) { dx = diTurno < 0 ? 0 : (diTurno > i ? 3 : -3); dy = diTurno < 0 && mioTurno ? 2.5 : 0; }
        oc.style.translate = (dx || dy) ? dx + "px " + dy + "px" : "";
      });

      // --- il tavolo: le carte restano al loro posto, si aggiungono o tolgono solo quelle che cambiano ---
      var carteTav = (st.presa && st.presa.tavoloPrima) ? st.presa.tavoloPrima : st.tavolo;
      var P = C().postiTavolo(st.posti, carteTav, M), wT = P.w;
      var g0 = P.griglia(el);
      if (!mont.grid || mont.grid.style.cssText !== g0.style.cssText) {   // cambia la misura (9 carte o più): griglia nuova
        if (mont.grid) mont.area.removeChild(mont.grid);
        mont.grid = g0; mont.area.insertBefore(g0, mont.area.firstChild); mont.tavEls = {};
      }
      var ids = {}; carteTav.forEach(function (c) { ids[c.id] = true; });
      Object.keys(mont.tavEls).forEach(function (id) { if (!ids[id]) { var e = mont.tavEls[id]; if (e.parentNode) e.parentNode.removeChild(e); delete mont.tavEls[id]; } });
      carteTav.forEach(function (c) {
        if (mont.tavEls[c.id]) return;
        var cel = C().cartaEl(el, c, wT, "", function () { cb.onTavolo(c.id); });
        if (c.id === st.messaGiu && !mont.costruendo) cel.classList.add("sp-posa" + (st.messaDa || 0));
        mont.grid.appendChild(P.metti(cel, c.id)); mont.tavEls[c.id] = cel;
        if (mont.nuoveTav) mont.nuoveTav.push(cel);
      });
      // aiuto alla presa: verdi le carte che puoi prendere, spente quelle che non stanno con quelle già toccate
      var cartaSel = (mioTurno && sel.carta) ? trova(st.mani[0], sel.carta) : null;
      var opts = cartaSel ? C().catture(cartaSel.v, st.tavolo) : [];
      var ok = {};
      opts.forEach(function (set) { if (sel.presa.every(function (id) { return set.indexOf(id) >= 0; })) set.forEach(function (id) { ok[id] = true; }); });
      carteTav.forEach(function (c) {
        var e = mont.tavEls[c.id]; if (!e || st.presa) return;
        var presel = sel.presa.indexOf(c.id) >= 0;
        e.classList.toggle("presel", !!cartaSel && presel);
        e.classList.toggle("cap", !!cartaSel && !presel && !!ok[c.id]);
        e.classList.toggle("sp-no", !!cartaSel && !ok[c.id]);
      });
      // la presa: la carta giocata arriva da chi gioca, si posa sopra le carte prese, poi volano tutte da lui
      if (st.presa && mont.presaVista !== st.presa.n) {
        mont.presaVista = st.presa.n;
        var dir = st.presa.chi, presiEls = [];
        st.presa.presiIds.forEach(function (id) { var e = mont.tavEls[id]; if (e) { e.classList.remove("cap", "presel", "sp-no"); e.classList.add("sp-via" + dir); presiEls.push(e); } });
        if (mont.gioc && mont.gioc.parentNode) mont.gioc.parentNode.removeChild(mont.gioc);
        var gioc = C().cartaEl(el, st.presa.carta, wT);
        gioc.style.cssText += ";position:absolute;z-index:6;opacity:0";
        mont.area.appendChild(gioc); mont.gioc = gioc;
        if (presiEls.length) {
          var cx = 0, cy = 0;
          presiEls.forEach(function (e) { cx += e.offsetLeft + e.offsetWidth / 2; cy += e.offsetTop + e.offsetHeight / 2; });
          cx /= presiEls.length; cy /= presiEls.length;
          gioc.style.left = (cx - gioc.offsetWidth / 2) + "px"; gioc.style.top = (cy - gioc.offsetHeight / 2) + "px";
        } else { gioc.style.left = "50%"; gioc.style.top = "50%"; gioc.style.marginLeft = (-wT / 2) + "px"; gioc.style.marginTop = (-Math.round(wT * C().ASP_CARTA) / 2) + "px"; }
        gioc.classList.add("sp-gioca" + dir);
      }
      if (!st.presa && mont.gioc) { if (mont.gioc.parentNode) mont.gioc.parentNode.removeChild(mont.gioc); mont.gioc = null; }
      // fine mano: le carte rimaste volano a chi ha preso per ultimo
      if (st.resto && !mont.restoVisto) {
        mont.restoVisto = true;
        Object.keys(mont.tavEls).forEach(function (id) { var e = mont.tavEls[id]; e.classList.remove("cap", "presel", "sp-no"); e.style.animationDelay = ".5s"; e.classList.add("sp-via" + (st.ultimaPresa || 0)); });
      }

      // --- la scritta d'aiuto sopra la mensola ---
      var testo = "", giallo = false;
      if (st.resto) testo = "Ultima presa: le carte rimaste vanno a " + (st.resto === "noi" ? "Noi" : "Loro");
      else if (st.presa && st.presa.scopa && st.presa.chi === 0) { testo = "SCOPA! 🧹"; giallo = true; }
      else if (cartaSel && opts.length >= 2) testo = opts[0].length === 1 ? "Tocca la carta verde da prendere." : "Tocca le carte verdi che sommano a " + cartaSel.v + ".";
      if (mont.aiutoTesto !== testo) {
        mont.aiutoTesto = testo;
        mont.aiutoEl.textContent = testo; mont.aiutoEl.style.display = testo ? "" : "none";
        mont.aiutoEl.style.borderColor = giallo ? "#ffd43b" : ""; mont.aiutoEl.style.fontSize = giallo ? "1.1rem" : "";
      }

      // --- la tua mano: si toglie solo la carta giocata ---
      var inMano = {}; st.mani[0].forEach(function (c) { inMano[c.id] = true; });
      Object.keys(mont.manoEls).forEach(function (id) { if (!inMano[id]) { var e = mont.manoEls[id]; if (e.parentNode) e.parentNode.removeChild(e); delete mont.manoEls[id]; } });
      st.mani[0].forEach(function (c) {
        var e = mont.manoEls[c.id];
        if (!e) { e = C().cartaEl(el, c, mont.wH, "", function () { cb.onCella(c.id); }); mont.manoW.appendChild(e); mont.manoEls[c.id] = e; }
        e.classList.toggle("sel", sel.carta === c.id);
        e.classList.toggle("sp-puo", aiuto && mioTurno && sel.carta !== c.id && C().catture(c.v, st.tavolo).length > 0);
      });
      var mie = st.prese[0].concat(st.prese[2]), scNoi = st.scope[0] + st.scope[2];
      var preseTxt = "prese squadra: <b>" + mie.length + "</b>" + (trova(mie, "D7") ? " · 7💰" : "") + (scNoi ? " · scope " + scNoi : "") + (mioTurno ? " · <b style='color:#ffd43b'>tocca a te</b>" : "");
      if (mont.preseTxt !== preseTxt) { mont.preseTxt = preseTxt; mont.preseEl.innerHTML = preseTxt; }
    }

    // il ventaglio dei dorsi in mano a un bot (come lo mette la stanza condivisa)
    function ventaglio(p) {
      var w = p.w || 100, cw = Math.round(w * 0.16), ch = Math.round(cw * C().ASP_CARTA), n = p.vent.children.length, ang = n > 5 ? 6 : 12;
      [].forEach.call(p.vent.children, function (d, k) {
        var a = (k - (n - 1) / 2) * ang;
        d.style.width = cw + "px"; d.style.height = ch + "px"; d.style.left = (-cw / 2) + "px";
        d.style.transform = "translateX(" + (a * 1.1) + "px) rotate(" + a + "deg)";
      });
    }

    // ---------- fine mano / fine partita ----------
    function fine(st) {
      var r = st.ultimoRound, finale = st.fase === "fine", vinto = st.punti.noi > st.punti.loro, pari = st.punti.noi === st.punti.loro;
      var s = t.schermata({ icona: finale ? (pari ? "🤝" : vinto ? "🏆" : "😮") : "🧮",
        titolo: finale ? (pari ? "Pareggio!" : (vinto ? "Avete vinto!" : "Hanno vinto " + st.nomi[1] + " e " + st.nomi[3])) : "Fine mano",
        sotto: "Scopone " + (st.variante === "scientifico" ? "scientifico" : "classico"),
        indietro: function () { if (finale || window.confirm("Uscire dalla partita?")) cb.onEsci(); } });
      schermo = s;
      var C0 = s._contenuto;
      if (finale && !pari) {   // la squadra che ha vinto fa festa
        var avs = el("div", { class: "sp-avs festa" });
        var chi = vinto ? [[st.nomi[0], C().mioAvatar ? C().mioAvatar(st.nomi[0]) : null], [st.nomi[2], st.omini && st.omini[2]]] : [[st.nomi[1], st.omini && st.omini[1]], [st.nomi[3], st.omini && st.omini[3]]];
        chi.forEach(function (x) { avs.appendChild(el("div", { html: figHtml(x[0], x[1], "esulta") })); });
        C0.appendChild(avs);
      }
      if (r) {
        var tab = el("div", { class: "sp-tab" });
        function cella(txt, cls) { tab.appendChild(el("div", { class: cls || "", html: txt })); }
        cella("", "th"); cella("Noi", "th"); cella("Loro", "th");
        function riga(nome, a, b, vinc) {
          cella(nome, "sx");
          cella(a + (vinc === "noi" ? " ✅" : ""), vinc === "noi" ? "ok" : "");
          cella(b + (vinc === "loro" ? " ✅" : ""), vinc === "loro" ? "ok" : "");
        }
        riga("🃏 Carte", r.carteA, r.carteB, r.pCarte);
        riga("🪙 Denari", r.denA, r.denB, r.pDen);
        riga("💰 Settebello", r.sette === "noi" ? "sì" : "—", r.sette === "loro" ? "sì" : "—", r.sette);
        riga("👑 Primiera", r.primA, r.primB, r.pPrim);
        riga("🧹 Scope", r.scopeNoi, r.scopeLoro, null);
        cella("<b>Punti mano</b>", "sx tot"); cella("+" + r.puntiNoi, "tot"); cella("+" + r.puntiLoro, "tot");
        C0.appendChild(tab);
        // chi ha fatto le scope
        var ss = r.scopeSeat || [], chiSc = [];
        [0, 2, 1, 3].forEach(function (seat) { if (ss[seat]) chiSc.push((seat === 0 ? "Tu" : st.nomi[seat]) + " " + ss[seat]); });
        if (chiSc.length) C0.appendChild(el("div", { class: "tenue", style: "text-align:center;font-size:.85rem;margin-top:6px", text: "Scope: " + chiSc.join(" · ") }));
        C0.appendChild(el("div", { style: "text-align:center;font-size:1.35rem;font-weight:800;margin-top:8px",
          html: "Noi <span style='color:#ffd43b'>" + r.tot.noi + "</span> — " + r.tot.loro + " Loro <span class='tenue' style='font-size:.85rem;font-weight:600'>(" + C().testoTraguardo(st.traguardo) + ")</span>" }));
      }
      if (finale) {
        // com'è finita (dà gli XP): tu e il compagno contro i rivali — una volta sola
        if (!st.risultatoDato) {
          st.risultatoDato = true;
          var pNoi = st.punti.noi >= st.punti.loro ? 1 : 2, pLoro = st.punti.loro >= st.punti.noi ? 1 : 2;
          if (t.risultato && st.nomi) t.risultato([0, 2, 1, 3].map(function (seat) { var r = { nome: st.nomi[seat], pos: seat % 2 === 0 ? pNoi : pLoro }; if (seat) r.bot = true; return r; }));
          if (vinto) { suonoVittoria(); coriandoli(s); }
        }
        s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Nuova partita", onclick: cb.onNuova }));
        s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
      } else {
        s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Continua ▶", onclick: cb.onAvanti }));
        s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: function () { if (window.confirm("Uscire dalla partita?")) cb.onEsci(); } }));
      }
      t.mostra(s);
    }
    function coriandoli(s) {
      var strato = el("div", { class: "sp-cori" }), col = ["#ffd43b", "#69db7c", "#4dabf7", "#ff6b6b", "#f783ac", "#fff"];
      for (var i = 0; i < 40; i++) {
        var c = el("i", {}); c.style.left = Math.round(Math.random() * 100) + "%"; c.style.background = col[i % col.length];
        c.style.animationDelay = (Math.random() * 0.9).toFixed(2) + "s"; c.style.animationDuration = (2 + Math.random() * 1.4).toFixed(2) + "s";
        strato.appendChild(c);
      }
      s.appendChild(strato);
      setTimeout(function () { if (strato.parentNode) strato.parentNode.removeChild(strato); }, 4600);
    }

    return {
      disegna: disegna,
      dealFino: function () { return dealFino; },
      uscito: function () { return !!schermo && !document.body.contains(schermo); }
    };
  }
})();

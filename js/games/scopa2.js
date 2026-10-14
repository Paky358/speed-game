/* =========================================================
   GIOCO — "Scopa 2 vs 2" (a squadre, 4 al tavolo)
   Squadre: seat 0 + seat 2 (Squadra 1) contro seat 1 + seat 3 (Squadra 2).
   Turni che alternano le squadre: 0 → 1 → 2 → 3 (S1, S2, altro S1, altro S2).
   Regole IDENTICHE alla Scopa (mazzo napoletano da 40): 3 carte in mano a
   testa, 4 sul tavolo; si pesca 3 a testa quando le mani sono vuote e il
   mazzo ha ancora carte; presa per valore uguale (singolo forzato) o per
   somma; scopa quando svuoti il tavolo (tranne l'ultima carta); a fine mano
   le carte rimaste vanno all'ultima squadra che ha preso. Punteggio a
   squadra: Carte, Denari, Settebello, Primiera + le Scope. Partita a 11.
   Modalità: contro i bot (tu + 3 bot), torneo sullo stesso telefono (fino a
   4 persone che si passano il telefono, gli altri posti ai bot) oppure online
   (ognuno dal suo telefono; i posti vuoti li riempiono i bot). Riusa window.SGCarte.
   ========================================================= */
(function () {
  "use strict";
  var TARGET = 11;
  // nomi di default dei posti bot, relativi al posto 0 (host/tu)
  var NOMI_BOT = { 1: "Bot", 2: "Giulia", 3: "Toni" };   // 1 e 3 avversari, 2 il tuo compagno (il primo bot si chiama sempre Bot)
  function C() { return window.SGCarte; }
  function team(seat) { return seat % 2; }                 // 0 = Squadra 1 (posti 0,2), 1 = Squadra 2 (posti 1,3)
  function trova(a, id) { for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function importanza(c) { return c.id === "D7" ? 12 : c.s === "D" ? 3 : c.v === 7 ? 2.2 : (c.v === 6 || c.v === 1) ? 1.6 : 1; }
  function mischia(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function nomeBotN(k) { return k === 1 ? "Bot" : "Bot " + k; }   // il primo bot si chiama "Bot", poi "Bot 2", "Bot 3"
  function vibra(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }   // solo quando TU tocchi per scegliere

  // ---------- motore (4 giocatori, 2 squadre, con pesca) ----------
  function creaStato(traguardo) {   // traguardo: i punti da raggiungere (0 = una mano sola)
    return {
      traguardo: traguardo == null ? TARGET : traguardo,
      mazzo: [], tavolo: [], mani: [[], [], [], []], prese: [[], [], [], []],
      scope: [0, 0, 0, 0], turno: 0, ultimaPresa: null, fase: "gioco", primo: 0,
      punti: [0, 0], ultimoRound: null, presa: null, messaGiu: null, nomi: {}, nMano: 0, resti: null, avviso: null,
      pid: Math.random().toString(36).slice(2, 8)   // codice della partita (per non confondere due partite)
    };
  }
  function nuovaMano(st) {
    st.mazzo = C().creaMazzo(mischia);
    st.tavolo = st.mazzo.splice(0, 4);
    for (var s = 0; s < 4; s++) st.mani[s] = st.mazzo.splice(0, 3);
    st.prese = [[], [], [], []]; st.scope = [0, 0, 0, 0];
    st.ultimaPresa = null; st.turno = st.primo; st.fase = "gioco"; st.presa = null; st.messaGiu = null;
    st.nMano = (st.nMano || 0) + 1; st.resti = null;
  }
  function pesca(st) { for (var s = 0; s < 4; s++) st.mani[s] = st.mazzo.splice(0, 3); }
  function maniVuote(st) { return !st.mani[0].length && !st.mani[1].length && !st.mani[2].length && !st.mani[3].length; }
  function carteInMano(st) { return st.mani[0].length + st.mani[1].length + st.mani[2].length + st.mani[3].length; }

  function applica(st, seat, cartaId, presaIds) {
    st.presa = null; st.messaGiu = null;
    var carta = trova(st.mani[seat], cartaId);
    if (!carta || st.turno !== seat || st.fase !== "gioco") return { errore: true };
    st.mani[seat] = st.mani[seat].filter(function (c) { return c.id !== cartaId; });
    var opts = C().catture(carta.v, st.tavolo);
    var ev = { presa: false, scopa: false, seat: seat };
    if (opts.length) {
      var set = presaIds && C().validaSet(opts, presaIds) ? presaIds : opts[0];
      var tavoloPrima = st.tavolo.slice();
      var presi = set.map(function (id) { return trova(st.tavolo, id); }).filter(Boolean);
      st.tavolo = st.tavolo.filter(function (c) { return set.indexOf(c.id) < 0; });
      st.prese[seat] = st.prese[seat].concat(presi, [carta]);
      st.ultimaPresa = seat; ev.presa = true;
      var ultimissima = (st.mazzo.length === 0 && maniVuote(st)); // ultima carta assoluta della mano
      if (st.tavolo.length === 0 && !ultimissima) { st.scope[seat]++; ev.scopa = true; }
      st.presa = { seat: seat, carta: carta, presiIds: set, tavoloPrima: tavoloPrima, scopa: ev.scopa };
    } else {
      st.tavolo.push(carta); st.messaGiu = carta.id;
    }
    st.turno = (seat + 1) % 4;
    if (maniVuote(st)) { if (st.mazzo.length > 0) pesca(st); else fineMano(st); }
    return ev;
  }
  function fineMano(st) {
    // le carte rimaste vanno a chi ha preso per ultimo (le ricordo per mostrarle prima del riepilogo)
    st.resti = { carte: st.tavolo.slice(), seat: st.ultimaPresa };
    if (st.tavolo.length && st.ultimaPresa != null) { st.prese[st.ultimaPresa] = st.prese[st.ultimaPresa].concat(st.tavolo); st.tavolo = []; }
    var r = conta(st);
    st.punti[0] += r.punti[0]; st.punti[1] += r.punti[1];
    r.tot = [st.punti[0], st.punti[1]];
    st.ultimoRound = r;
    st.fase = C().partitaFinita(st.traguardo, st.punti[0], st.punti[1]) ? "fine" : "fineround";
  }
  function prossimaMano(st) { if (st.fase !== "fineround") return; st.primo = (st.primo + 1) % 4; nuovaMano(st); }
  function carteTeam(st, tm) { var o = []; for (var s = 0; s < 4; s++) if (team(s) === tm) o = o.concat(st.prese[s]); return o; }
  function conta(st) {
    var A = carteTeam(st, 0), B = carteTeam(st, 1);
    function den(x) { var n = 0; x.forEach(function (c) { if (c.s === "D") n++; }); return n; }
    var carteA = A.length, carteB = B.length, denA = den(A), denB = den(B);
    var sette = trova(A, "D7") ? 0 : (trova(B, "D7") ? 1 : null);
    var primA = C().primiera(A), primB = C().primiera(B);
    var scopeA = st.scope[0] + st.scope[2], scopeB = st.scope[1] + st.scope[3];
    var pCarte = carteA > carteB ? 0 : carteB > carteA ? 1 : null;
    var pDen = denA > denB ? 0 : denB > denA ? 1 : null;
    var pPrim = primA > primB ? 0 : primB > primA ? 1 : null;
    function pts(tm) { return (tm === 0 ? scopeA : scopeB) + (pCarte === tm ? 1 : 0) + (pDen === tm ? 1 : 0) + (sette === tm ? 1 : 0) + (pPrim === tm ? 1 : 0); }
    return { carte: [carteA, carteB], den: [denA, denB], sette: sette, prim: [primA, primB],
      pCarte: pCarte, pDen: pDen, pPrim: pPrim, scope: [scopeA, scopeB], scopeSeat: st.scope.slice(), punti: [pts(0), pts(1)] };
  }

  // ---------- bot ----------
  // quanto vale una carta per la squadra (1 punto della partita ≈ 8), tenendo conto di quello che ha già preso
  function pesoCarta(c, prese) {
    var nc = prese.length, nd = 0, sette = 0;
    prese.forEach(function (x) { if (x.s === "D") nd++; if (x.v === 7) sette++; });
    var w = nc >= 21 ? 0.05 : 0.32;                                   // punto carte (già vinto a 21)
    if (c.s === "D") w += nd >= 6 ? 0.1 : 0.7;                         // punto denari (già vinto a 6)
    if (c.id === "D7") w += 8;                                         // settebello = 1 punto
    if (c.v === 7) w += sette >= 3 ? 0.3 : 1.1;                        // i 7 decidono la primiera
    else if (c.v === 6) w += 0.55; else if (c.v === 1) w += 0.4; else if (c.v === 5) w += 0.15;
    return w;
  }
  function valorePresa(carta, presi, restano, prese, scopaVale) {
    var s = pesoCarta(carta, prese);
    presi.forEach(function (c) { s += pesoCarta(c, prese); });
    if (restano === 0 && scopaVale) s += 8;
    return s;
  }
  // DIFFICILE: ricorda le carte uscite (prese di tutti e tavolo), conta le prese della squadra insieme
  // e guarda cosa può fare l'avversario che gioca subito dopo col tavolo che gli lascia (scope, settebello…)
  function mossaDifficile(st, seat, mosse) {
    var mano = st.mani[seat], tavolo = st.tavolo, tm = team(seat), av = (seat + 1) % 4;
    var mieP = carteTeam(st, tm), sueP = carteTeam(st, 1 - tm), viste = {};
    mano.concat(tavolo, mieP, sueP).forEach(function (c) { viste[c.id] = 1; });
    var ignote = C().creaMazzo().filter(function (c) { return !viste[c.id]; });
    var perValore = {}; ignote.forEach(function (c) { perValore[c.v] = (perValore[c.v] || 0) + 1; });
    var U = ignote.length, hAvv = st.mani[av].length || (st.mazzo.length > 0 ? 3 : 0);
    function probHa(v) {   // probabilità che l'avversario dopo di me abbia almeno una carta di valore v
      var u = perValore[v] || 0; if (!u || !hAvv || U <= 0) return 0;
      var p = 1; for (var i = 0; i < hAvv; i++) p *= Math.max(0, (U - u - i)) / (U - i);
      return 1 - p;
    }
    var restanti = carteInMano(st), ultimaMia = st.mazzo.length === 0 && restanti === 1, ultimaSua = st.mazzo.length === 0 && restanti === 2;
    var migliore = null, bs = -1e9;
    mosse.forEach(function (m) {
      var tav2 = m.cattura ? tavolo.filter(function (c) { return m.set.indexOf(c.id) < 0; }) : tavolo.concat([m.c]);
      var guadagno = m.cattura ? valorePresa(m.c, m.set.map(function (id) { return trova(tavolo, id); }), tav2.length, mieP, !ultimaMia) : -0.15 * pesoCarta(m.c, mieP);
      var risposte = [];
      for (var v = 1; v <= 10; v++) {
        var p = probHa(v); if (!p) continue;
        var best = 0;
        C().catture(v, tav2).forEach(function (set) {
          var presi = set.map(function (id) { return trova(tav2, id); });
          var val = valorePresa({ v: v, s: "?", id: "?" }, presi, tav2.length - set.length, sueP, !ultimaSua);
          if (val > best) best = val;
        });
        if (best > 0) risposte.push([best, p]);
      }
      risposte.sort(function (a, b) { return b[0] - a[0]; });
      var perdita = 0, nessunaMigliore = 1;
      risposte.forEach(function (r) { perdita += r[0] * r[1] * nessunaMigliore; nessunaMigliore *= (1 - r[1]); });
      var s = guadagno - perdita * 0.9 + Math.random() * 0.05;
      if (s > bs) { bs = s; migliore = m; }
    });
    return migliore;
  }
  function mossaBot(st, seat, diff) {
    var mano = st.mani[seat], tavolo = st.tavolo, mosse = [];
    mano.forEach(function (c) {
      var opts = C().catture(c.v, tavolo);
      if (opts.length) opts.forEach(function (set) { mosse.push({ carta: c.id, presa: set, cattura: true, c: c, set: set }); });
      else mosse.push({ carta: c.id, presa: null, cattura: false, c: c, set: [] });
    });
    if (!mosse.length) return null;
    if (diff === "facile") return mosse[Math.floor(Math.random() * mosse.length)];
    if (diff === "difficile") return mossaDifficile(st, seat, mosse);
    function punteggio(m) {
      var s = 0;
      if (m.cattura) {
        s += importanza(m.c);
        m.set.forEach(function (id) { s += importanza(trova(tavolo, id)); });
        if (tavolo.length - m.set.length === 0) s += 6; // scopa
      } else s -= importanza(m.c) * 0.6;
      return s;
    }
    var best = mosse[0], bs = -1e9;
    mosse.forEach(function (m) { var s = punteggio(m) + Math.random() * 0.25; if (s > bs) { bs = s; best = m; } });
    return best;
  }

  // ---------- suoni (niente vibrazione: vibra solo il tocco di chi sceglie) ----------
  function suonoPresa(scopa) {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try { var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.setValueAtTime(scopa ? 520 : 360, t); o.frequency.exponentialRampToValueAtTime(scopa ? 880 : 300, t + 0.12);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (scopa ? 0.28 : 0.16));
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.3);
    } catch (e) {}
  }
  function suonoNote(note, vol) {   // piccole note in fila (tocca a te, voci del riepilogo, vittoria)
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t0 = ctx.currentTime;
      note.forEach(function (n) {
        var o = ctx.createOscillator(), g = ctx.createGain(), t = t0 + n[1];
        o.type = "sine"; o.frequency.setValueAtTime(n[0], t);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.25);
      });
    } catch (e) {}
  }

  // ---------- vista per il giocatore "io" (0..3) ----------
  function vistaDa(st, io) {
    var mioTeam = team(io), comp = (io + 2) % 4;
    function relTeam(seat) { return team(seat) === mioTeam ? "mia" : "altra"; }
    var pr = st.ultimoRound, ultimo = null;
    if (pr) {
      // porto il risultato "relativo": mia squadra a sinistra
      var m = mioTeam, a = 1 - mioTeam;
      var chi = function (tm) {   // chi ha fatto le scope: "Paky ×2, Giulia"
        var o = []; for (var s = 0; s < 4; s++) if (team(s) === tm && pr.scopeSeat && pr.scopeSeat[s]) o.push(st.nomi[s] + (pr.scopeSeat[s] > 1 ? " ×" + pr.scopeSeat[s] : ""));
        return o.join(", ");
      };
      ultimo = {
        carte: [pr.carte[m], pr.carte[a]], den: [pr.den[m], pr.den[a]], prim: [pr.prim[m], pr.prim[a]],
        scope: [pr.scope[m], pr.scope[a]], punti: [pr.punti[m], pr.punti[a]], tot: [pr.tot[m], pr.tot[a]],
        scopeChi: [chi(m), chi(a)],
        sette: pr.sette == null ? null : (pr.sette === m ? "mia" : "altra"),
        pCarte: pr.pCarte == null ? null : (pr.pCarte === m ? "mia" : "altra"),
        pDen: pr.pDen == null ? null : (pr.pDen === m ? "mia" : "altra"),
        pPrim: pr.pPrim == null ? null : (pr.pPrim === m ? "mia" : "altra")
      };
    }
    var preseMioTeam = st.prese[io].concat(st.prese[comp]);
    var re = st.resti && st.fase !== "gioco" ? st.resti : null;
    return {
      fase: st.fase, io: io, turno: st.turno, traguardo: st.traguardo, nMano: st.nMano, pid: st.pid,
      nomi: [st.nomi[0], st.nomi[1], st.nomi[2], st.nomi[3]],
      squadre: { mia: [st.nomi[io], st.nomi[comp]], altra: [st.nomi[(io + 1) % 4], st.nomi[(io + 3) % 4]] },
      nCarte: [st.mani[0].length, st.mani[1].length, st.mani[2].length, st.mani[3].length],
      mano: st.mani[io].slice(), tavolo: st.tavolo.slice(), mazzoN: st.mazzo.length,
      punti: { mia: st.punti[mioTeam], altra: st.punti[1 - mioTeam] },
      preseMia: preseMioTeam.length, setteMia: !!trova(preseMioTeam, "D7"), scopeMia: st.scope[io] + st.scope[comp],
      relTeam: { 0: relTeam(0), 1: relTeam(1), 2: relTeam(2), 3: relTeam(3) },
      messaGiu: st.messaGiu, ultimoRound: ultimo, avatari: st.avatari || null, avviso: st.avviso || null,
      resti: re ? { carte: re.carte.slice(), n: re.carte.length, nome: re.seat != null ? st.nomi[re.seat] : null, mia: re.seat != null && team(re.seat) === mioTeam } : null,
      presa: st.presa ? { seat: st.presa.seat, mio: st.presa.seat === io, carta: st.presa.carta, presiIds: st.presa.presiIds, tavoloPrima: st.presa.tavoloPrima, scopa: st.presa.scopa } : null,
      vincitoreMio: st.fase === "fine" ? (st.punti[mioTeam] > st.punti[1 - mioTeam]) : false
    };
  }

  // ---------- statistiche per i trofei: il giocatore di QUESTO telefono (vm.io), se ha il profilo ----------
  // Dalle prese si sa CHI ha preso: scope personali, settebello tuo, assist al compagno.
  function nuovaTracciaS2() {
    return { presaKey: null, giuKey: null, mieGiu: {}, fase: null,
      round: { scopeMie: 0, setteMio: 0, assist: 0 }, match: { scopeMie: 0, scopeComp: 0, setteAvv: 0, scopeSubite: 0, oppA10: false } };
  }
  function tracciaS2(T, vm) {
    if (!vm) return;
    var io = vm.io, comp = (io + 2) % 4;
    // ricaricata la pagina sulla schermata di fine mano/partita: quella è già stata contata
    if (T.fase === null && vm.fase !== "gioco") { T.fase = vm.fase; return; }
    // le carte che HO messo giù io in questa mano (senza prendere): se il compagno ci fa scopa è un assist
    if (vm.messaGiu && vm.messaGiu !== T.giuKey) { T.giuKey = vm.messaGiu; if ((vm.turno + 3) % 4 === io) T.mieGiu[vm.messaGiu] = 1; }
    if (!vm.messaGiu) T.giuKey = null;
    if (vm.presa) {
      var pr = vm.presa, key = pr.seat + ":" + pr.carta.id + ":" + (pr.presiIds || []).join(",");
      if (key !== T.presaKey) {
        T.presaKey = key;
        var presi = pr.presiIds || [];
        if (pr.seat === io) {
          if (pr.scopa) { T.round.scopeMie++; T.match.scopeMie++; }
          if (pr.carta.id === "D7" || presi.indexOf("D7") >= 0) T.round.setteMio++;
        }
        if (pr.seat === comp && pr.scopa) {
          T.match.scopeComp++;
          if (presi.some(function (id) { return T.mieGiu[id]; })) T.round.assist++;
        }
        presi.forEach(function (id) { delete T.mieGiu[id]; });   // le mie carte ormai prese
      }
    } else T.presaKey = null;
    // fine smazzata / fine partita (ultimoRound è già "relativo": [0] = mia squadra, [1] = altra)
    var prima = T.fase; T.fase = vm.fase;
    if (!(vm.fase === "fineround" || vm.fase === "fine") || prima === vm.fase || !vm.ultimoRound) return;
    var r = vm.ultimoRound;
    var tutti4 = r.pCarte === "mia" && r.pDen === "mia" && r.sette === "mia" && r.pPrim === "mia";
    var c = { scopePersonali: T.round.scopeMie, settePersonale: T.round.setteMio, assist: T.round.assist,
      grandeSlam: tutti4 ? 1 : 0, primDenSquadra: (r.pPrim === "mia" && r.pDen === "mia") ? 1 : 0 };
    if (r.sette === "altra") T.match.setteAvv++;
    T.match.scopeSubite += r.scope[1];
    if (r.tot[1] >= 10 && r.tot[0] < 10) T.match.oppA10 = true;
    var sets = [], recs = [];
    if (vm.fase === "fine" && !(vm.traguardo != null && vm.traguardo < TARGET)) {   // (con una mano sola o pochi punti sarebbero regalati)
      var M = T.match, vinto = vm.vincitoreMio;
      var s0 = (window.SGNube && SGNube.statGioco && SGNube.statGioco("scopa2v2")) || {}, serie = s0.serieVinteOra || 0;
      c.partite = 1;
      if (M.scopeMie >= 2 && M.scopeComp >= 2) c.sincronizzati = 1;
      if (vinto) {
        c.vinte = 1; serie++;
        if (M.setteAvv === 0) c.vinteNoSetteAvv = 1;
        if (M.scopeSubite === 0) c.vinteNoScopeSubite = 1;
        if (r.tot[1] === 0) c.vinteAZero = 1;
        if (M.oppA10) c.rimonte = 1;
        if (M.scopeMie >= 3 && M.scopeComp === 0) c.trascinatore = 1;
      } else serie = 0;
      recs.push(["serieVinteMax", serie]); sets.push(["serieVinteOra", serie]);
    }
    if (vm.fase === "fine") T.match = { scopeMie: 0, scopeComp: 0, setteAvv: 0, scopeSubite: 0, oppA10: false };
    T.round = { scopeMie: 0, setteMio: 0, assist: 0 }; T.mieGiu = {};
    if (!(window.SGNube && SGNube.disponibile() && SGNube.profilo())) return;
    var incrs = []; for (var k in c) if (c[k]) incrs.push([k, c[k]]);
    SGNube.salvaProgressi(null, "scopa2v2", incrs, recs, sets);
  }

  // ---------- client (selezione + tap + tenuta minima dell'animazione) ----------
  // Cl.chiuso: la partita è stata lasciata (niente più disegni); Cl.pausa: c'è la schermata "passa il telefono"
  function creaClient(t, cb) {
    var Cl = { vm: null, sel: { carta: null, presa: [] }, chiuso: false, pausa: false }, T = nuovaTracciaS2();
    Cl.tapMano = function (id) {
      var vm = Cl.vm; if (!vm || vm.turno !== vm.io || vm.fase !== "gioco" || vm.presa) return;
      var carta = trova(vm.mano, id); if (!carta) return;
      vibra(10);
      var opts = C().catture(carta.v, vm.tavolo);
      if (opts.length === 0) { Cl.sel = { carta: null, presa: [] }; cb.onMossa(id, null); return; }
      if (opts.length === 1) { Cl.sel = { carta: null, presa: [] }; cb.onMossa(id, opts[0]); return; }
      Cl.sel = (Cl.sel.carta === id) ? { carta: null, presa: [] } : { carta: id, presa: [] }; Cl.disegna();
    };
    Cl.tapTavolo = function (id) {
      var vm = Cl.vm; if (!vm || vm.turno !== vm.io || vm.fase !== "gioco" || vm.presa) return;
      var carta = Cl.sel.carta ? trova(vm.mano, Cl.sel.carta) : null; if (!carta) return;
      var opts = C().catture(carta.v, vm.tavolo);
      var p = Cl.sel.presa.slice(); var k = p.indexOf(id); if (k >= 0) p.splice(k, 1); else p.push(id);
      vibra(10);
      if (C().validaSet(opts, p)) { var cid = Cl.sel.carta; Cl.sel = { carta: null, presa: [] }; cb.onMossa(cid, p); return; }
      if (C().prefisso(opts, p)) Cl.sel.presa = p;
      else if (C().prefisso(opts, [id])) Cl.sel.presa = [id];   // carta di un'altra presa: si ricomincia la scelta da quella
      Cl.disegna();
    };
    Cl.disegna = function () { if (!Cl.vm || Cl.chiuso || Cl.pausa) return; disegna(t, Cl, cb); };
    Cl._fino = 0; Cl._pend = null; Cl._fineVista = null; Cl._mioPrima = false;
    Cl.azzera = function () { if (Cl._pend) clearTimeout(Cl._pend); Cl._pend = null; Cl._fino = 0; Cl.vm = null; Cl.sel = { carta: null, presa: [] }; mont = null; };
    Cl.setVm = function (vm) {
      if (Cl.chiuso || !vm) return;
      if (!cb.noTrofei) tracciaS2(T, vm);   // trofei
      if (vm.turno !== vm.io || vm.fase !== "gioco") Cl.sel = { carta: null, presa: [] };
      // online: quando arriva il tuo turno, un piccolo suono
      var mio = vm.fase === "gioco" && vm.turno === vm.io && !vm.presa;
      if (mio && !Cl._mioPrima && cb.online) suonoNote([[660, 0], [880, 0.09]], 0.12);
      Cl._mioPrima = mio;
      if (Cl._pend) { clearTimeout(Cl._pend); Cl._pend = null; }
      // l'ultima giocata della mano: prima si vede sul tavolo, poi arriva il riepilogo
      var kFine = vm.pid + ":" + vm.nMano + ":" + vm.fase;
      if (vm.fase !== "gioco" && (vm.presa || vm.messaGiu) && kFine !== Cl._fineVista) {
        Cl._fineVista = kFine;
        var v2 = {}; for (var k in vm) v2[k] = vm[k];
        v2.fase = "gioco"; v2.turno = -1; v2.mano = [];
        if (!vm.presa) { v2.tavolo = vm.resti ? vm.resti.carte : []; }
        Cl._fino = Date.now() + (vm.presa ? (vm.presa.scopa ? 1500 : 1150) : 900);
        Cl.vm = v2; Cl.disegna();
        Cl._pend = setTimeout(function () { Cl._pend = null; Cl.vm = vm; Cl.disegna(); }, Cl._fino - Date.now());
        return;
      }
      if (vm.presa) { Cl._fino = Date.now() + 1050; Cl.vm = vm; Cl.disegna(); return; }
      if (Cl.vm && Date.now() < Cl._fino) {
        Cl._pend = setTimeout(function () { Cl._pend = null; Cl.vm = vm; Cl.disegna(); }, Cl._fino - Date.now());
        return;
      }
      Cl.vm = vm; Cl.disegna();
    };
    return Cl;
  }

  // ---------- stile in più (solo transform/opacity) ----------
  function stileS2() {
    if (document.getElementById("s2-stile")) return;
    var st = document.createElement("style"); st.id = "s2-stile";
    st.textContent = [
      ".s2-tocca{display:inline-block;background:linear-gradient(135deg,#ffe066,#ffb300);color:#3b2400;font-weight:900;border-radius:999px;padding:1px 10px;margin-right:6px;animation:s2Pulsa 1.2s ease-in-out infinite}",
      "@keyframes s2Pulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}",
      ".s2-avviso{position:absolute;left:50%;top:44px;transform:translateX(-50%);z-index:9;max-width:92%;text-align:center;background:rgba(10,18,50,.92);border:1.5px solid #ffd43b;color:#fff;font-weight:800;font-size:.85rem;padding:6px 12px;border-radius:12px;pointer-events:none;animation:s2Avviso 3.2s ease forwards}",
      "@keyframes s2Avviso{0%{opacity:0;transform:translate(-50%,-8px)}10%,85%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-8px)}}",
      ".s2-riga{opacity:0;animation:s2Entra .35s ease-out forwards}",
      "@keyframes s2Entra{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
      ".s2-festa{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:50}",
      ".s2-festa span{position:absolute;top:-30px;font-size:1.4rem;animation:s2Cade linear forwards}",
      "@keyframes s2Cade{to{transform:translateY(110vh) rotate(540deg);opacity:.9}}"
    ].join("");
    document.head.appendChild(st);
  }
  function coriandoli() {
    var f = document.createElement("div"); f.className = "s2-festa";
    var simboli = ["🎉", "🎊", "✨", "🃏", "🏆"];
    for (var i = 0; i < 28; i++) {
      var s = document.createElement("span"); s.textContent = simboli[i % simboli.length];
      s.style.left = Math.round(Math.random() * 96) + "%";
      s.style.animationDuration = (1.8 + Math.random() * 1.6).toFixed(2) + "s";
      s.style.animationDelay = (Math.random() * 0.9).toFixed(2) + "s";
      f.appendChild(s);
    }
    document.body.appendChild(f);
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 4500);
  }

  // ---------- disegno: la stanza si monta UNA volta, poi a ogni mossa si cambia solo quello che cambia ----------
  var mont = null, s2Posti = {};   // s2Posti: posto fisso di ogni carta in tavola
  var memo = { prevMano: 0, prevTav: {}, avvisoN: null };   // cosa c'era al disegno di prima (per la distribuzione animata)
  function sedieDa(vm) {
    var io = vm.io, comp = (io + 2) % 4, ordine = [(io + 1) % 4, comp, (io + 3) % 4];
    var mioTurno = (vm.turno === io && vm.fase === "gioco" && !vm.presa);
    var sedie = ordine.map(function (s) {
      var faccia = "normale", fumetto = null;
      if (vm.presa && vm.presa.scopa) { faccia = team(s) === team(vm.presa.seat) ? "esulta" : "triste"; if (s === vm.presa.seat) fumetto = "🧹 SCOPA!"; }
      else if (vm.turno === s && vm.fase === "gioco" && !vm.presa) { faccia = "pensa"; fumetto = "🤔"; }
      var cfg = (vm.avatari && C().avatarValido(vm.avatari[s])) || null;
      return { cfg: cfg, nome: vm.nomi[s] || "—", n: vm.nCarte[s], turno: vm.turno === s && !vm.presa, mia: s === comp, faccia: faccia, fumetto: fumetto,
        salta: faccia === "esulta" && s === (vm.presa && vm.presa.seat), seat: s };
    });
    sedie.ioTurno = mioTurno;   // se tocca a te, gli altri guardano in basso verso di te
    // chiave di ogni avatar: espressione, fumetto e dove guarda (come in stanza4)
    var diTurno = -1; sedie.forEach(function (p, i) { if (p.turno) diTurno = i; });
    sedie.forEach(function (p, i) {
      var dx = p.turno ? 0 : (diTurno < 0 ? 0 : (diTurno > i ? 3 : (diTurno < i ? -3 : 0))), dy = !p.turno && diTurno < 0 && mioTurno ? 2.5 : 0;
      p.chiave = p.faccia + "|" + (p.fumetto || "") + "|" + dx + "," + dy + "|" + (vm.presa && vm.presa.scopa ? vm.presa.carta.id : "");
    });
    return sedie;
  }
  function disegna(t, Cl, cb) {
    var vm = Cl.vm;
    C().assicuraStile(); stileS2();
    if (vm.fase === "fineround" || vm.fase === "fine") { mont = null; memo.prevMano = 0; memo.prevTav = {}; return renderFine(t, vm, cb); }
    if (window.SGMusica) window.SGMusica.avvia();
    var wH = C().larghezza(3, 10, 104);   // mano max 3 (grande)
    var M = C().misureStanza4("scopa2", wH, 1);
    var key = [vm.io, M.scW, M.scH, M.wT, wH, JSON.stringify(vm.nomi), JSON.stringify(vm.avatari || null)].join("|");
    if (!(mont && mont.key === key && document.body.contains(mont.box))) {
      if (!monta(t, Cl, cb, M, wH, key, vm)) return;   // (rifatta della misura giusta: ha già disegnato tutto)
    }
    aggiorna(t, Cl, vm, M);
    // con le carte in mano la mensola può crescere un poco: se la schermata esce dallo schermo, si rifà più bassa (una volta)
    if (C().ricontrollaStanza4 && C().ricontrollaStanza4(M, mont.cont.parentNode)) { mont = null; disegna(t, Cl, cb); }
  }
  // costruisce la stanza (una volta per schermo, o se cambiano giocatori o misure)
  function monta(t, Cl, cb, M, wH, key, vm) {
    var el = t.el, ASP = C().ASP_CARTA;
    var box = el("div", { style: "display:flex;flex-direction:column" });
    var head = el("div", { class: "sc-testata" });   // punteggio e musica DENTRO la stanza (in alto; a sinistra c'è il tasto indietro)
    var punti = el("div", { style: "font-size:.82rem;font-weight:700" });
    head.appendChild(punti);
    if (window.SGMusica) head.appendChild(window.SGMusica.bottone(el));
    var sedie = sedieDa(vm);
    var R = C().stanza4(el, M, sedie);
    R.scena.appendChild(head);
    var area = el("div", { class: "sc-terra sc-t3d" }), griglia = el("div");
    area.appendChild(griglia); R.feltro.appendChild(area);
    box.appendChild(R.scena);
    var mensola = el("div", { class: "sc-mensola", style: "min-height:" + (Math.round(wH * ASP) + 34) + "px" });
    // (altezze fisse: la mensola resta uguale con la mano piena o vuota e con "Tocca a te", così la stanza si misura giusta)
    var manoW = el("div", { class: "sc-mano-riga", style: "min-height:" + Math.round(wH * ASP) + "px" }), prese = el("div", { class: "sc-prese", style: "min-height:1.6em" });
    mensola.appendChild(manoW); mensola.appendChild(prese);
    box.appendChild(mensola);
    var cont;
    if (mont && mont.cont && document.body.contains(mont.box)) { mont.cont.replaceChild(box, mont.box); cont = mont.cont; }
    else {
      var s = t.schermata({ indietro: function () { if (window.confirm("Uscire dalla partita?")) cb.onEsci(); } });
      s.classList.add("sc-piena");   // stanza da bordo a bordo
      s._contenuto.appendChild(box); t.mostra(s);
      cont = s._contenuto;
    }
    mont = { key: key, box: box, cont: cont, R: R, punti: punti, area: area, griglia: griglia, mensola: mensola, manoW: manoW, prese: prese,
      tav: {}, mano: {}, wT: null, wH: wH, chiaviSedie: sedie.map(function (p) { return p.chiave; }), gioc: null, presaKey: null, aiuto: null };
    if (C().correggiStanza4(M, cont.parentNode, mensola, function () { disegna(t, Cl, cb); })) return false;
    R.siedi();
    return true;
  }
  // aggiorna SOLO le parti che cambiano: punteggio, avatar, targhe, carte coperte, tavolo, mano
  function aggiorna(t, Cl, vm, M) {
    var el = t.el, R = mont.R, ASP = C().ASP_CARTA, io = vm.io;
    var mioTurno = (vm.turno === io && vm.fase === "gioco" && !vm.presa);
    var testoPunti = "Noi <b style='color:#69db7c'>" + vm.punti.mia + "</b> — Loro <b>" + vm.punti.altra + "</b> <span class='tenue' style='font-weight:600'>(" + C().testoTraguardo(vm.traguardo) + ")</span>";
    if (mont.punti.innerHTML !== testoPunti) mont.punti.innerHTML = testoPunti;

    // gli avatar: cambio il disegno solo di chi cambia espressione (o direzione dello sguardo)
    var sedie = sedieDa(vm), nuove = null, rifai = false;
    sedie.forEach(function (p, i) {
      var pos = R.posti[i];
      pos.p.salta = false;
      if (mont.chiaviSedie[i] !== p.chiave) {
        if (!nuove) nuove = C().stanza4(el, M, sedie);   // disegni pronti (non montati): ne prendo solo l'avatar
        var nf = nuove.posti[i];
        while (pos.fig.firstChild) pos.fig.removeChild(pos.fig.firstChild);
        while (nf.fig.firstChild) pos.fig.appendChild(nf.fig.firstChild);
        var vf = pos.box.querySelector(".sc-fumetto"); if (vf) pos.box.removeChild(vf);
        var ff = nf.box.querySelector(".sc-fumetto"); if (ff) pos.box.appendChild(ff);
        pos.box.className = "sc-avv" + (p.faccia === "pensa" ? " pensa" : "");
        pos.p.faccia = p.faccia; pos.p.salta = p.salta;
        mont.chiaviSedie[i] = p.chiave; rifai = true;
      }
      var cl = "sc-targa4" + (p.turno ? " turno" : "") + (p.mia ? " mia" : "");
      if (pos.targa.className !== cl) pos.targa.className = cl;
      var num = pos.targa.querySelector(".sc-num"); if (num && num.textContent !== String(p.n)) num.textContent = p.n;
      while (pos.vent.children.length > p.n) { pos.vent.removeChild(pos.vent.lastChild); rifai = true; }
      while (pos.vent.children.length < p.n) { pos.vent.appendChild(el("div", { class: "sc-dorso" })); rifai = true; }
    });
    if (rifai) R.siedi();

    // il tavolo: le carte restano al loro posto, si aggiungono e si tolgono una per una
    var cartaSel = Cl.sel.carta ? trova(vm.mano, Cl.sel.carta) : null;
    var opts = cartaSel ? C().catture(cartaSel.v, vm.tavolo) : [];
    var tutte = {}, verdi = {};
    opts.forEach(function (set) { set.forEach(function (id) { tutte[id] = true; }); });
    opts.filter(function (set) { return Cl.sel.presa.every(function (id) { return set.indexOf(id) >= 0; }); })   // solo le prese che vanno ancora bene
      .forEach(function (set) { set.forEach(function (id) { if (Cl.sel.presa.indexOf(id) < 0) verdi[id] = true; }); });
    var carteTav = (vm.presa && vm.presa.tavoloPrima) ? vm.presa.tavoloPrima : vm.tavolo;
    var P = C().postiTavolo(s2Posti, carteTav, M), wT = P.w;
    if (mont.wT !== wT) { for (var k0 in mont.tav) { var e0 = mont.tav[k0]; if (e0.parentNode) e0.parentNode.removeChild(e0); } mont.tav = {}; mont.wT = wT; }
    var g0 = P.griglia(el); if (mont.griglia.style.cssText !== g0.style.cssText) mont.griglia.style.cssText = g0.style.cssText;
    var presente = {}, nuoveTav = [], dir = vm.presa ? (vm.presa.mio ? "giu" : "su") : null, presiEls = [];
    carteTav.forEach(function (c) {
      presente[c.id] = true;
      var cel = mont.tav[c.id];
      if (!cel) {
        cel = C().cartaEl(el, c, wT, "", function () { if (cel._tocca) Cl.tapTavolo(c.id); });
        mont.tav[c.id] = cel;
        if (c.id === vm.messaGiu && !vm.presa) cel.classList.add("sc-cade");   // appena messa giù: si posa sul tavolo
        else if (!memo.prevTav[c.id] && !vm.presa) nuoveTav.push(cel);
        mont.griglia.appendChild(cel);
      }
      P.metti(cel, c.id);
      var presa = !!(vm.presa && vm.presa.presiIds.indexOf(c.id) >= 0);
      var sceglibile = mioTurno && !!cartaSel && !!tutte[c.id];
      cel._tocca = sceglibile;
      cel.style.cursor = sceglibile ? "pointer" : "";
      cel.classList.toggle("presel", sceglibile && Cl.sel.presa.indexOf(c.id) >= 0);
      cel.classList.toggle("cap", sceglibile && !!verdi[c.id]);
      if (presa && !cel.classList.contains("sc-lascia-" + dir)) { cel.classList.add("sc-lascia-" + dir); }
      if (presa) presiEls.push(cel);
    });
    for (var id in mont.tav) if (!presente[id]) { var ev = mont.tav[id]; if (ev.parentNode) ev.parentNode.removeChild(ev); delete mont.tav[id]; }

    // la carta giocata che va a prendere (una volta per presa)
    var pKey = vm.presa ? vm.presa.seat + ":" + vm.presa.carta.id : null;
    if (pKey !== mont.presaKey) {
      if (mont.gioc && mont.gioc.parentNode) mont.gioc.parentNode.removeChild(mont.gioc);
      mont.gioc = null; mont.presaKey = pKey;
      if (vm.presa) {
        var gioc = C().cartaEl(el, vm.presa.carta, wT);
        gioc.style.cssText += ";position:absolute;z-index:6;opacity:0";
        mont.area.appendChild(gioc); mont.gioc = gioc;
        if (presiEls.length) {   // posizioni misurate SUL tavolo inclinato
          var cx = 0, cy = 0;
          presiEls.forEach(function (e) { cx += e.offsetLeft + e.offsetWidth / 2; cy += e.offsetTop + e.offsetHeight / 2; });
          cx /= presiEls.length; cy /= presiEls.length;
          gioc.style.left = (cx - gioc.offsetWidth / 2) + "px"; gioc.style.top = (cy - gioc.offsetHeight / 2) + "px";
        } else { gioc.style.left = "50%"; gioc.style.top = "50%"; gioc.style.marginLeft = (-wT / 2) + "px"; gioc.style.marginTop = (-Math.round(wT * ASP) / 2) + "px"; }
        gioc.style.animation = "scGioca" + (dir === "giu" ? "Giu" : "Su") + " .95s ease-in forwards";
      }
    }

    // i messaggi sul tavolo
    var testoAiuto = (mioTurno && cartaSel && opts.length >= 2) ? (opts[0].length === 1 ? "Tocca la carta verde da prendere." : (Cl.sel.presa.length ? "Ancora: tocca le carte verdi (in tutto " + cartaSel.v + ")." : "Tocca le carte verdi che sommano a " + cartaSel.v + ".")) : null;
    if (vm.presa && vm.presa.scopa && vm.presa.mio) testoAiuto = "SCOPA! 🧹";
    if (testoAiuto) {
      if (!mont.aiuto) { mont.aiuto = el("div", { class: "sc-aiuto" }); R.scena.appendChild(mont.aiuto); }
      if (mont.aiuto.textContent !== testoAiuto) mont.aiuto.textContent = testoAiuto;
      var scopaStile = testoAiuto === "SCOPA! 🧹" ? "border-color:#ffd43b;font-size:1.1rem" : "";
      if (mont.aiuto.getAttribute("style") !== scopaStile) mont.aiuto.setAttribute("style", scopaStile);
    } else if (mont.aiuto) { mont.aiuto.parentNode.removeChild(mont.aiuto); mont.aiuto = null; }
    // avviso di passaggio (un amico è uscito o è tornato)
    if (vm.avviso && vm.avviso.n !== memo.avvisoN) {
      memo.avvisoN = vm.avviso.n;
      var av = el("div", { class: "s2-avviso", text: vm.avviso.testo }); R.scena.appendChild(av);
      setTimeout(function () { if (av.parentNode) av.parentNode.removeChild(av); }, 3300);
    }

    // la tua mano (sulla mensola di legno)
    var presenteM = {}, nuoveMano = [];
    vm.mano.forEach(function (c, i) {
      presenteM[c.id] = true;
      var cel = mont.mano[c.id];
      if (!cel) { cel = C().cartaEl(el, c, mont.wH, "", function () { Cl.tapMano(c.id); }); mont.mano[c.id] = cel; nuoveMano.push(cel); }
      if (mont.manoW.children[i] !== cel) mont.manoW.insertBefore(cel, mont.manoW.children[i] || null);
      cel.classList.toggle("sel", Cl.sel.carta === c.id);
      cel.style.cursor = mioTurno ? "pointer" : "";
    });
    for (var idm in mont.mano) if (!presenteM[idm]) { var em = mont.mano[idm]; if (em.parentNode) em.parentNode.removeChild(em); delete mont.mano[idm]; }
    var testoPrese = (mioTurno ? "<span class='s2-tocca'>👉 Tocca a te!</span>" : "") + "prese squadra: <b>" + vm.preseMia + "</b>" + (vm.setteMia ? " · 7💰" : "") + (vm.scopeMia ? " · scope " + vm.scopeMia : "");
    if (mont.prese.innerHTML !== testoPrese) mont.prese.innerHTML = testoPrese;

    // distribuzione animata quando la mano si riempie (inizio mano e ogni pescata)
    var dealing = !vm.presa && vm.fase === "gioco" && vm.mano.length > memo.prevMano;
    memo.prevMano = vm.mano.length;
    memo.prevTav = {}; vm.tavolo.forEach(function (c) { memo.prevTav[c.id] = true; });
    if (dealing) Cl._dealFino = Date.now() + C().animaDistribuzione4(nuoveTav, nuoveMano,
      [R.posti[0], R.posti[1], R.posti[2]].map(function (p) { return [].slice.call(p.vent.children); }), R.feltro, 0.16);
  }

  function renderFine(t, vm, cb) {
    var kF = vm.pid + ":" + vm.nMano + ":" + vm.fase;   // la stessa schermata già mostrata: non si rifà (niente lampeggio, niente suoni doppi)
    if (memo.fineKey === kF && memo.fineS && document.body.contains(memo.fineS)) return;
    var el = t.el, r = vm.ultimoRound, sq = vm.squadre || { mia: ["Noi", ""], altra: ["Loro", ""] };
    function nomiSq(a) { return a.filter(Boolean).join(" e "); }
    var titolo = "Fine mano";
    if (vm.fase === "fine") {
      if (vm.punti.mia === vm.punti.altra) titolo = "Pareggio!";
      else if (cb.multi) titolo = "Vincono " + nomiSq(vm.vincitoreMio ? sq.mia : sq.altra) + "!";
      else titolo = vm.vincitoreMio ? "Avete vinto!" : "Hanno vinto gli altri";
    }
    var s = t.schermata({ icona: vm.fase === "fine" ? "🏆" : "🧮", titolo: titolo, sotto: "Scopa 2 vs 2",
      indietro: vm.fase === "fine" ? null : function () { if (window.confirm("Uscire dalla partita?")) cb.onEsci(); } });
    var nRiga = 0;
    function riga(nome, a, b, vinc, sotto) {
      var d = el("div", { class: "s2-riga", style: "padding:5px 8px;border-radius:8px;background:rgba(255,255,255,.05);margin-bottom:5px;animation-delay:" + (nRiga++ * 0.22).toFixed(2) + "s" }, [
        el("div", { style: "display:flex;justify-content:space-between" }, [
          el("span", { text: nome }), el("span", { html: "<b style='color:" + (vinc === "mia" ? "#69db7c" : "inherit") + "'>" + a + "</b> — <b style='color:" + (vinc === "altra" ? "#69db7c" : "inherit") + "'>" + b + "</b>" })]),
        sotto ? el("div", { class: "tenue", style: "font-size:.75rem;margin-top:2px", text: sotto }) : null ]);
      return d;
    }
    if (r) {
      s._contenuto.appendChild(el("div", { class: "tenue", style: "text-align:center;margin-bottom:6px;font-weight:700",
        html: "<span style='color:#69db7c'>" + nomiSq(sq.mia) + "</span> — <span style='color:#ff8787'>" + nomiSq(sq.altra) + "</span>" }));
      if (vm.resti && vm.resti.n && vm.resti.nome)
        s._contenuto.appendChild(el("div", { class: "tenue", style: "text-align:center;font-size:.8rem;margin-bottom:6px",
          text: (vm.resti.n === 1 ? "L'ultima carta rimasta sul tavolo va" : "Le " + vm.resti.n + " carte rimaste sul tavolo vanno") + " a " + vm.resti.nome + " (ha preso per ultimo)." }));
      s._contenuto.appendChild(riga("Carte (" + r.carte[0] + " vs " + r.carte[1] + ")", r.carte[0], r.carte[1], r.pCarte));
      s._contenuto.appendChild(riga("Denari (" + r.den[0] + " vs " + r.den[1] + ")", r.den[0], r.den[1], r.pDen));
      s._contenuto.appendChild(riga("Settebello 7💰", r.sette === "mia" ? "sì" : "—", r.sette === "altra" ? "sì" : "—", r.sette));
      s._contenuto.appendChild(riga("Primiera (" + r.prim[0] + " vs " + r.prim[1] + ")", r.prim[0], r.prim[1], r.pPrim));
      var chi = r.scopeChi ? [r.scopeChi[0], r.scopeChi[1]].filter(Boolean).join(" · ") : "";
      s._contenuto.appendChild(riga("Scope 🧹", r.scope[0], r.scope[1], null, chi ? "Le hanno fatte: " + chi : null));
      var linea = el("div", { class: "s2-riga", style: "height:1px;background:rgba(255,255,255,.15);margin:8px 0;animation-delay:" + (nRiga * 0.22).toFixed(2) + "s" });
      s._contenuto.appendChild(linea);
      s._contenuto.appendChild(riga("Punti mano", r.punti[0], r.punti[1], null));
      s._contenuto.appendChild(el("div", { class: "s2-riga", style: "text-align:center;font-size:" + (cb.multi ? "1.05rem" : "1.3rem") + ";font-weight:800;margin-top:8px;animation-delay:" + (nRiga * 0.22 + 0.1).toFixed(2) + "s",
        html: (cb.multi ? nomiSq(sq.mia) : "Noi") + " <span style='color:#ffd43b'>" + r.tot[0] + "</span> — " + r.tot[1] + " " + (cb.multi ? nomiSq(sq.altra) : "Loro") }));   // sullo stesso telefono "noi" non vuol dire niente: i nomi
      // una notina per ogni voce che compare
      var note = []; for (var i = 0; i < nRiga; i++) note.push([520 + i * 40, i * 0.22]);
      suonoNote(note, 0.06);
    }
    // online: la fila delle faccine (il mio avatar le fa sui telefoni di tutti)
    var fa = cb.online && t.faccine ? t.faccine() : null;
    if (fa) { fa.style.margin = "0 0 8px"; s._piede.appendChild(fa); }
    if (vm.fase === "fine") {
      if (cb.torneo) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏆 Punti del torneo", onclick: cb.onTorneo }));
      else if (cb.sonoHost || cb.locale) {
        s._piede.appendChild(el("button", { class: "btn btn-primario", text: cb.locale ? "🔄 Nuova partita" : "🔄 Nuova partita (in saletta)", onclick: cb.onNuova }));
        s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
      } else {
        s._piede.appendChild(el("p", { class: "modulo-nota", text: "Se l'host fa una nuova partita, torni in saletta con lui." }));
        s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
      }
      if (vm.punti.mia !== vm.punti.altra && (vm.vincitoreMio || cb.multi)) setTimeout(function () { coriandoli(); suonoNote([[523, 0], [659, 0.12], [784, 0.24], [1047, 0.38]], 0.16); }, 1300);
    } else {
      // online la prossima mano parte da sola: l'host vede il conto sul tasto, gli altri "Si va avanti tra 12…"
      var kConto = "mano|" + vm.pid + ":" + vm.nMano;
      if (cb.sonoHost || cb.locale) {
        var bC = el("button", { class: "btn btn-primario", text: "Continua ▶", onclick: cb.onAvanti });
        s._piede.appendChild(bC);
        if (cb.online && t.contoAvanti) t.contoAvanti(bC, 12, cb.onAvanti, kConto);   // (il conto chiama la funzione: niente vibrazione)
      } else {
        var po = el("p", { class: "modulo-nota", text: "In attesa dell'host per la prossima mano…" });
        s._piede.appendChild(po);
        if (cb.online && t.contoAvanti) t.contoAvanti(po, 12, null, kConto);
      }
    }
    t.mostra(s); memo.fineKey = kF; memo.fineS = s;
  }

  // ========================================================
  //  LOCALE — tu (posto 0) + 3 bot; nel torneo sullo stesso telefono fino a 4 persone
  //  (posti 0,1,2,3 in ordine) che si passano il telefono, gli altri posti ai bot
  // ========================================================
  function localeScopa2(t, diff, torneo) {
    var nomiG = ((t.giocatori && t.giocatori.length) ? t.giocatori : ["Tu"]).slice(0, torneo ? 4 : 1);
    var multi = nomiG.length > 1, vista = 0, finita = false, attesa = false, giroT = null, detto = false;
    function umano(s) { return s < nomiG.length; }
    function nomiIniziali() {
      var n = {}, k = 0;
      for (var s = 0; s < 4; s++) n[s] = umano(s) ? (nomiG[s] || "Giocatore " + (s + 1)) : (multi ? nomeBotN(++k) : NOMI_BOT[s]);
      return n;
    }
    function nuovaPartita() { var x = creaStato(C().traguardoDa(t.impostazioni)); x.nomi = nomiIniziali(); nuovaMano(x); detto = false; return x; }
    var st = nuovaPartita();
    function classifica() {
      var v = st.punti[0] > st.punti[1] ? 0 : 1, pari = st.punti[0] === st.punti[1];
      return [0, 1, 2, 3].filter(function (k) { return !torneo || umano(k); })
        .map(function (k) { return { nome: st.nomi[k], pos: (team(k) === v || pari) ? 1 : 2 }; })
        .sort(function (a, b) { return a.pos - b.pos; });
    }
    function esci() { finita = true; Cl.chiuso = true; if (giroT) clearTimeout(giroT); if (window.SGMusica) window.SGMusica.ferma(); t.esci(); }
    var Cl = creaClient(t, {
      locale: true, sonoHost: true, multi: multi, noTrofei: multi, torneo: !!torneo,
      onMossa: function (id, presa) { gioco(vista, id, presa); },
      onAvanti: function () { if (st.fase !== "fineround") return; prossimaMano(st); giro(); },
      onNuova: function () { st = nuovaPartita(); vista = 0; giro(); },
      onTorneo: function () { if (finita) return; finita = true; Cl.chiuso = true; if (window.SGMusica) window.SGMusica.ferma(); t.fine(classifica()); },
      onEsci: esci
    });
    function aggiorna() { if (finita) return; Cl.setVm(vistaDa(st, vista)); fineDetta(); }
    function fineDetta() {   // contro il computer: il risultato (XP con la vittoria); nel torneo lo dà il tasto "Punti del torneo"
      if (st.fase !== "fine" || detto || torneo) return;
      detto = true; if (t.risultato) t.risultato(classifica());
    }
    function gioco(seat, id, presa) {
      if (finita || attesa) return;
      var ev = applica(st, seat, id, presa); if (ev.errore) return;
      suonoPresa(ev.scopa); if (!ev.presa) suonoNote([[300, 0]], 0.05);
      aggiorna();
      if (ev.presa && st.fase === "gioco") {
        attesa = true;
        setTimeout(function () { attesa = false; if (finita) return; st.presa = null; aggiorna(); giro(); }, ev.scopa ? 1600 : 1050);
      } else { st.presa = null; giro(); }
    }
    function passaA(s) {   // torneo: tocca a un'altra persona, le si passa il telefono (le carte restano coperte)
      Cl.pausa = true;
      t.passaA(st.nomi[s], function () { if (finita) return; Cl.pausa = false; vista = s; mont = null; aggiorna(); });
    }
    function giro() {
      if (finita) return;
      if (st.fase !== "gioco") { aggiorna(); return; }
      if (umano(st.turno)) { if (multi && st.turno !== vista) passaA(st.turno); else aggiorna(); return; }
      aggiorna();
      if (giroT) clearTimeout(giroT);
      giroT = setTimeout(function () {
        giroT = null;
        if (finita || attesa || st.fase !== "gioco" || umano(st.turno)) return;
        var m = mossaBot(st, st.turno, diff); if (!m) return; gioco(st.turno, m.carta, m.presa);
      }, Math.max(700 + Math.random() * 350, (Cl._dealFino || 0) - Date.now() + 250));   // i bot aspettano la fine della distribuzione
    }
    giro();
  }

  // ========================================================
  //  ONLINE — host = posto 0; gli ospiti prendono i posti 1,2,3
  //  (in ordine di arrivo). I posti vuoti alla partenza = bot.
  //  A ognuno arriva solo la SUA vista (con le sue carte), mai quella degli altri.
  // ========================================================
  function hostScopa2(t, diff) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var st = null, rete = null, codice = "…", pronta = false, chiuso = false, attesa = false, giroT = null, nAvviso = 0;
    // posti[1..3]: id se umano collegato, null se libero. Il posto 0 è l'host.
    var posti = { 1: null, 2: null, 3: null };
    var nomiUmani = { 1: null, 2: null, 3: null }, avatariUmani = { 1: null, 2: null, 3: null };
    var via = {};   // via[posto] = chi è uscito a partita in corso: se torna si riprende il suo posto
    var botSeat = { 0: false, 1: true, 2: true, 3: true };  // chi è gestito dal computer durante la partita

    function esci() { chiuso = true; Cl.chiuso = true; if (giroT) clearTimeout(giroT); if (window.SGMusica) window.SGMusica.ferma(); if (rete) rete.chiudi(); t.esci(); }
    var Cl = creaClient(t, {
      sonoHost: true, online: true,
      onMossa: function (id, presa) { if (st) passo(0, id, presa); },
      onAvanti: function () { if (st && st.fase === "fineround") { prossimaMano(st); bcast(); giro(); } },
      onNuova: function () { tornaSaletta(); },
      onEsci: esci
    });
    t.onRegole = function () { if (!st) aggiornaLobby(); };   // l'host ha cambiato le regole in saletta: lo vedono tutti

    function mioNome() { return (t.giocatori && t.giocatori[0]) || "Host"; }
    function mioAv() { return t.mioOmino ? t.mioOmino(mioNome()) : C().mioAvatar(mioNome()); }
    function nomeBotLibero() {   // "Bot", poi "Bot 2", "Bot 3" (la squadra la mostrano il colore e il 🤝)
      var usati = {}; if (st) for (var s = 0; s < 4; s++) if (st.nomi[s]) usati[st.nomi[s]] = 1;
      for (var k = 1; k < 9; k++) if (!usati[nomeBotN(k)]) return nomeBotN(k);
      return "Bot";
    }
    function nomiPartenza() {
      st.nomi = { 0: mioNome() }; st.avatari = { 0: mioAv() };
      for (var s = 1; s <= 3; s++) if (posti[s]) { st.nomi[s] = nomiUmani[s]; st.avatari[s] = avatariUmani[s]; }
      for (s = 1; s <= 3; s++) if (!posti[s]) { st.nomi[s] = nomeBotLibero(); st.avatari[s] = null; }   // i bot: la loro faccia
    }
    function postoLibero() { for (var s = 1; s <= 3; s++) if (!posti[s]) return s; return 0; }
    function seatDi(id) { for (var s = 1; s <= 3; s++) if (posti[s] === id) return s; return -1; }
    function avviso(testo) { if (st) st.avviso = { n: ++nAvviso, testo: testo }; }

    var detto = false;   // il risultato della partita è già stato dato al torneo online?
    function mandaVm(s) { if (rete && posti[s]) rete.inviaVeloce({ t: "vm", to: posti[s], vm: vistaDa(st, s) }); }   // solo a lui, e non resta sul server
    function bcast() {
      if (chiuso) return;
      if (!st) { disegnaLobby(); return; }
      for (var s = 1; s <= 3; s++) mandaVm(s);
      Cl.setVm(vistaDa(st, 0));
      if (st.fase !== "fine") { detto = false; return; }
      if (!detto && t.risultato) {   // per il torneo online: la squadra che vince, poi l'altra (pari = stesso posto)
        detto = true;
        var v = st.punti[0] >= st.punti[1] ? 0 : 1, pari = st.punti[0] === st.punti[1];
        t.risultato([0, 1, 2, 3].map(function (k) { return { nome: st.nomi[k], pos: (k % 2 === v || pari) ? 1 : 3 }; })
          .sort(function (a, b) { return a.pos - b.pos; }));
      }
    }
    function passo(seat, id, presa) {
      if (chiuso || !st || st.turno !== seat || attesa) return;
      var ev = applica(st, seat, id, presa); if (ev.errore) return;
      suonoPresa(ev.scopa); if (!ev.presa) suonoNote([[300, 0]], 0.05);
      bcast();
      if (ev.presa && st.fase === "gioco") {
        attesa = true;
        setTimeout(function () { attesa = false; if (chiuso || !st) return; st.presa = null; bcast(); giro(); }, ev.scopa ? 1600 : 1050);
      } else { st.presa = null; giro(); }
    }
    function giro() {
      if (chiuso || !st) return;
      if (st.fase !== "gioco") { bcast(); return; }
      if (attesa || !botSeat[st.turno]) return;                 // tocca a un umano: aspetto la sua mossa
      if (giroT) clearTimeout(giroT);
      giroT = setTimeout(function () {
        giroT = null;
        if (chiuso || !st || attesa || st.fase !== "gioco" || !botSeat[st.turno]) return;
        var m = mossaBot(st, st.turno, diff); if (!m) return; passo(st.turno, m.carta, m.presa);
      }, Math.max(700 + Math.random() * 350, (Cl._dealFino || 0) - Date.now() + 250));   // i bot aspettano la fine della distribuzione
    }
    function rientra(s) {   // chi era uscito a partita in corso torna al suo posto (al posto del bot)
      var v = via[s]; delete via[s];
      posti[s] = v.id; nomiUmani[s] = v.nome; avatariUmani[s] = v.omino; botSeat[s] = false;
      st.nomi[s] = v.nome; st.avatari[s] = v.omino;
      avviso(v.nome + " è tornato al tavolo!");
      bcast(); giro();
    }
    function tornaSaletta() {   // "Nuova partita": tutti in saletta (chi era uscito può rientrare, l'host può cambiare regole e squadre)
      if (giroT) clearTimeout(giroT); giroT = null;
      st = null; via = {}; detto = false; attesa = false;
      for (var s = 1; s <= 3; s++) botSeat[s] = true;
      Cl.azzera();
      aggiornaLobby();
    }

    rete = SGNet.ospita("scopa2v2", {
      onCodice: function (c) { codice = c; if (!st) aggiornaLobby(); },
      onConnesso: function () { pronta = true; if (!st) aggiornaLobby(); },
      onAddio: function (id) {
        var s = seatDi(id);
        if (s <= 0) return;
        posti[s] = null;
        if (st) {   // il suo posto passa al bot (se torna, se lo riprende)
          var vecchio = nomiUmani[s] || st.nomi[s];
          via[s] = { id: id, nome: vecchio, omino: avatariUmani[s] };
          nomiUmani[s] = null; avatariUmani[s] = null; botSeat[s] = true;
          st.nomi[s] = nomeBotLibero(); st.avatari[s] = null;
          avviso(vecchio + " è uscito: gioca il bot");
          bcast(); giro();
        } else { nomiUmani[s] = null; avatariUmani[s] = null; aggiornaLobby(); }
      },
      onMsg: function (id, m) {
        if (chiuso || !m || !m.t) return;
        if (m.t === "join") {
          if (st) {   // a partita iniziata
            var sj = seatDi(id);
            if (sj > 0) { mandaVm(sj); return; }   // chi rientra al suo posto si riprende le sue carte
            for (var k = 1; k <= 3; k++) if (via[k] && via[k].id === id && !posti[k]) { rientra(k); return; }
            if (rete) rete.inviaVeloce({ t: "piena", to: id, inCorso: true });   // nessun posto per lui: glielo dico
            return;
          }
          if (seatDi(id) < 0) {
            var s = postoLibero();
            if (s > 0) { posti[s] = id; nomiUmani[s] = String(m.nome || "Amico").slice(0, 16); avatariUmani[s] = C().avatarValido(m.omino); }
            else { if (rete) rete.inviaVeloce({ t: "piena", to: id }); return; }
          }
          aggiornaLobby();   // trasmette la sala aggiornata a tutti gli ospiti
        } else if (m.t === "gioca" && st) { var sm = seatDi(id); if (sm > 0) passo(sm, m.carta, m.presa); }
      },
      // (arriva solo se il primo collegamento non riesce: a partita cominciata la rete si ricollega da sola)
      onErrore: function () { if (!chiuso && !pronta && !st) { chiuso = true; Cl.chiuso = true; erroreScopa2(t, "Problema di collegamento. Controlla la connessione e riprova."); } }
    });

    function seggiLobby() {
      var nh = mioNome();
      return [{ nome: nh, id: "host", omino: mioAv() },
        posti[1] ? { nome: nomiUmani[1], id: posti[1], omino: avatariUmani[1] } : null,
        posti[2] ? { nome: nomiUmani[2], id: posti[2], omino: avatariUmani[2] } : null,
        posti[3] ? { nome: nomiUmani[3], id: posti[3], omino: avatariUmani[3] } : null];
    }
    function regoleLobby() { var imp = t.impostazioni || {}; return { traguardo: C().traguardoDa(imp), diff: imp.difficolta || diff }; }
    function aggiornaLobby() {
      if (st || chiuso) return;
      var R = regoleLobby();
      if (rete) rete.invia({ t: "lobby", codice: codice, pronta: pronta, seggi: seggiLobby(), traguardo: R.traguardo, diff: R.diff });
      disegnaLobby();
    }
    function cambiaCompagno() {   // ruota i posti 1-2-3: cambia chi gioca con l'host
      if (st) return;
      var P = [posti[1], posti[2], posti[3]], N = [nomiUmani[1], nomiUmani[2], nomiUmani[3]], A = [avatariUmani[1], avatariUmani[2], avatariUmani[3]];
      for (var i = 0; i < 3; i++) { var d = ((i + 1) % 3) + 1; posti[d] = P[i]; nomiUmani[d] = N[i]; avatariUmani[d] = A[i]; }
      aggiornaLobby();
    }
    function disegnaLobby() {
      if (st || chiuso) return;
      var R = regoleLobby();
      renderLobby(t, { codice: codice, pronta: pronta, sonoHost: true, myId: "host", seggi: seggiLobby(), traguardo: R.traguardo, diff: R.diff }, {
        onComincia: function () {
          var imp = t.impostazioni || {}; diff = imp.difficolta || diff;
          st = creaStato(C().traguardoDa(imp)); nomiPartenza();
          for (var s = 1; s <= 3; s++) botSeat[s] = !posti[s];
          nuovaMano(st);
          if (rete) rete.invia({ t: "inCorso" });   // sul server resta solo "partita in corso" (niente carte di nessuno)
          bcast(); giro();
        },
        onCambia: cambiaCompagno,
        onEsci: esci
      });
    }
    disegnaLobby();
  }

  function ospiteScopa2(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { rete: null, myId: null, nome: "", msg: null, msg2: null, fuori: false, chiuso: false };
    function esci() { S.chiuso = true; Cl.chiuso = true; if (window.SGMusica) window.SGMusica.ferma(); if (S.rete) S.rete.chiudi(); t.esci(); }
    var Cl = creaClient(t, {
      sonoHost: false, online: true,
      onMossa: function (id, presa) { if (S.rete) S.rete.invia({ t: "gioca", carta: id, presa: presa }); },
      onAvanti: function () {}, onNuova: function () {}, onEsci: esci
    });
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🃏", titolo: "Entra nella Scopa 2 vs 2", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
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
        onAperto: function (id) {
          S.myId = id;
          S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : C().mioAvatar(S.nome) });
          mostraAttesa();
          setTimeout(function () { if (!Cl.vm && !S.fuori && S.msg2) S.msg2.textContent = "Non trovo la partita: controlla il codice o attendi l'host…"; }, 8000);
        },
        onMsg: function (m) {
          if (!m || S.chiuso) return;
          S.visto = true;
          if (m.to && m.to !== S.myId) return;   // un messaggio per un altro telefono (le sue carte): non è per me
          if (m.t === "vm") { if (!m.vm) return; S.fuori = false; suonoSeNuovaPresa(m.vm); Cl.setVm(m.vm); }
          else if (m.t === "lobby") {
            if (Cl.vm) Cl.azzera();   // l'host ha fatto "Nuova partita": si torna in saletta
            // non sono al tavolo: se c'è un posto libero lo chiedo (chi era arrivato a partita cominciata entra adesso)
            var seggi = m.seggi || [], dentro = seggi.some(function (g) { return g && g.id === S.myId; });
            if (!dentro && !seggi.slice(1).some(function (g) { return !g; })) return mostraPiena(false);
            if (!dentro && S.rete && Date.now() - (S.chiesto || 0) > 1500) { S.chiesto = Date.now(); S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : C().mioAvatar(S.nome) }); }
            S.fuori = false;
            mostraLobby(m);
          }
          else if (m.t === "piena") { if (!Cl.vm) mostraPiena(m.inCorso); }
          else if (m.t === "inCorso") { if (!Cl.vm && S.msg2 && document.body.contains(S.msg2)) S.msg2.textContent = "La partita è cominciata: sto entrando al tavolo…"; }
        },
        onChiuso: function () {
          if (S.chiuso) return;
          var finita = Cl.vm && Cl.vm.fase === "fine";
          Cl.chiuso = true; S.chiuso = true;
          if (finita) grazie(t); else erroreScopa2(t, S.fuori ? "La stanza è stata chiusa." : "L'host ha chiuso la partita (o si è perso il collegamento).");
        },
        onErrore: function () { if (!S.chiuso && !Cl.vm && !S.visto) erroreScopa2(t, "Problema di collegamento. Riprova."); }   // (solo se il primo collegamento non riesce)
      });
    }
    var lastPresa = null;
    function suonoSeNuovaPresa(vm) {
      var id = vm.presa ? (vm.presa.carta.id + ":" + (vm.presa.presiIds || []).length) : null;
      if (id && id !== lastPresa) suonoPresa(vm.presa.scopa);
      lastPresa = id;
    }
    function mostraLobby(m) {
      if (Cl.vm) return;
      renderLobby(t, { codice: m.codice, pronta: m.pronta, sonoHost: false, myId: S.myId, seggi: m.seggi, traguardo: m.traguardo, diff: m.diff }, { onEsci: esci });
    }
    function mostraAttesa() {   // finché non arriva la sala dall'host
      if (Cl.vm) return;
      var s = t.schermata({ icona: "🃏", titolo: "Scopa 2 vs 2 · Sala", sotto: "Stanza " + codice.toUpperCase(), indietro: esci });
      S.msg2 = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegato ✅ — sto entrando nella stanza…" });
      s._contenuto.appendChild(S.msg2); t.mostra(s);
    }
    function mostraPiena(inCorso) {   // nessun posto per me (per ora: alla prossima partita, se c'è posto, entro da solo)
      var k = inCorso ? "corso" : "piena";
      if (S.fuori === k && S.sPiena && document.body.contains(S.sPiena)) return;   // già mostrata: niente lampeggio
      S.fuori = k;
      var s = S.sPiena = t.schermata({ icona: inCorso ? "⏳" : "🈵", titolo: inCorso ? "Partita già cominciata" : "Tavolo al completo", indietro: esci });
      s._contenuto.appendChild(el("p", { style: "font-size:1.05rem;line-height:1.5;text-align:center",
        text: inCorso ? "Al tavolo si sta già giocando: entri alla prossima partita, se c'è un posto libero. Resta qui!"
          : "Al tavolo ci sono già 4 giocatori: se si libera un posto entri da solo." }));
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: esci }));
      t.mostra(s);
    }
  }

  // sala uguale per host e ospite: mostra le due squadre (relative a chi guarda) con i bot; controlli solo all'host
  function renderLobby(t, vm, cb) {
    var el = t.el, seggi = vm.seggi || [], mioSeat = 0;
    for (var k = 0; k < seggi.length; k++) if (seggi[k] && seggi[k].id === vm.myId) mioSeat = k;
    var gio = [], umani = 0;
    seggi.forEach(function (g, i) { if (g) { umani++; gio.push({ id: g.id, nome: g.nome, omino: g.omino || null, host: i === 0, tu: g.id === vm.myId }); } });
    function nomeSeat(i) { var g = seggi[i]; return g ? (g.id === vm.myId ? "tu" : g.nome) : "🤖 bot"; }
    var tr = vm.traguardo == null ? TARGET : vm.traguardo, livello = { facile: "facili", medio: "medi", difficile: "difficili" }[vm.diff] || "medi";
    // (compatto: con la saletta e i tasti deve stare tutto in uno schermo da 360x640, anche in 4 col "Cambia compagno")
    var righe = [
      el("div", {}, [ el("b", { text: "🟢 " + nomeSeat(mioSeat % 2) + " + " + nomeSeat(mioSeat % 2 + 2) }), document.createTextNode(" 🆚 "),
        el("b", { text: "🔴 " + nomeSeat(1 - mioSeat % 2) + " + " + nomeSeat(3 - mioSeat % 2) }) ]),
      el("div", { style: "opacity:.8;font-size:.85em", text: (tr ? "🎯 A " + tr + " punti" : "🎯 Una mano sola") + " · bot " + livello + (umani < 4 ? " · i posti liberi li fanno i bot" : "") }) ];
    if (vm.sonoHost && cb.onCambia && umani > 1)
      righe.push(el("button", { class: "btn btn-fantasma", style: "margin:4px auto 0;min-height:0;padding:5px 14px;font-size:.85rem;width:auto", text: "🔀 Cambia compagno", onclick: cb.onCambia }));
    var squadre = el("div", { class: "modulo-nota", style: "text-align:center;line-height:1.5" }, righe);
    t.lobby({ host: vm.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 1, puoiDaSolo: true, vuoti: 4 - umani, giocatori: gio, extra: [squadre],
      nota: vm.sonoHost ? "Puoi cominciare quando vuoi: i posti vuoti li fanno i bot." : null,
      attesa: "Aspetta che l'host cominci: si gioca in coppia! 🃏", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  function erroreScopa2(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function grazie(t) {   // l'host ha chiuso a partita finita: niente errore
    var s = t.schermata({ icona: "👋", titolo: "Partita chiusa" });
    s._contenuto.appendChild(t.el("p", { text: "L'host ha chiuso la stanza: grazie per aver giocato!", style: "font-size:1.05rem;line-height:1.5;text-align:center" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità online funziona quando il gioco è aperto dal sito pubblicato. Da un file locale non è disponibile: intanto gioca contro i bot." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  SG.registra({
    id: "scopa2v2",
    nome: "Scopa 2 vs 2",
    icona: "🃏",
    descrizione: "La Scopa a squadre, in quattro al tavolo: tu e il tuo compagno contro due. Contro i bot o online, ognuno dal suo telefono (i posti vuoti li fanno i bot).",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 3, etichettaGiocatori: "👥 1–4 giocatori",   // (i posti liberi li prendono i bot)
    modi: [{ modo: "bot", icona: "🤖", nome: "Contro il computer", sotto: "Tu e un bot contro due bot" }],
    regole: [
      "Si gioca <b>in quattro, due squadre</b>: tu + il compagno (di fronte) contro due avversari. Le carte sono le 40 napoletane.",
      "Si gioca a turno alternando le squadre: <b>tu, un avversario, il tuo compagno, l'altro avversario</b>.",
      "Come la Scopa normale: tre carte in mano a testa, quattro sul tavolo, si <b>pesca</b> tre a testa quando le mani finiscono, fino a esaurire il mazzo.",
      "Prendi con una carta di <b>valore uguale</b> (se c'è) oppure con una <b>somma</b>. Svuoti il tavolo? <b>Scopa</b> (+1), tranne con l'ultima carta.",
      "Punti a fine mano, sommando i due compagni: <b>Carte, Denari, Settebello, Primiera</b> e le <b>Scope</b>. Vince la squadra che arriva per prima ai <b>punti scelti</b> (di solito " + TARGET + "; a pari punti si gioca un'altra mano). Si può giocare anche <b>una mano sola</b>.",
      "Modalità: <b>contro i bot</b> (tu + 3 bot) oppure <b>online</b> (ognuno dal suo telefono; i posti liberi li giocano i bot). Nel <b>torneo sullo stesso telefono</b> giocano fino a 4 di voi passandovi il telefono."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = "bot"; dove.difficolta = "medio"; dove.torneo = !!aiuti.torneo;
      var bBot, bOnl, boxDiff, notaOnline;
      function sel(m) {
        dove.modo = m;
        bBot.className = "modo-chip" + (m === "bot" ? " attiva" : "");
        bOnl.className = "modo-chip" + (m === "online" ? " attiva" : "");
        notaOnline.hidden = (m !== "online");
      }
      bBot = el("button", { class: "modo-chip attiva", onclick: function () { sel("bot"); } }, [
        el("span", { class: "mi", text: "🤖" }), el("div", {}, [el("div", { class: "mt", text: "Contro i bot" }), el("div", { class: "ms", text: "Tu + 3 bot" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { sel("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Online" }), el("div", { class: "ms", text: "Ognuno dal suo" })])]);
      if (!aiuti.modo && !aiuti.torneo) {   // (se "come giocare" l'avete già scelto prima, qui non si sceglie)
        box.appendChild(el("div", { class: "etichetta", text: "Come giocare" }));
        box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bBot, bOnl]));
      }
      if (aiuti.torneo) box.appendChild(el("p", { class: "modulo-nota", text: "Nel torneo giocate fino a 4 di voi, passandovi il telefono: i posti che avanzano li fanno i bot." }));
      boxDiff = el("div", {});   // la bravura dei bot si sceglie anche online (⚙️ Regole in saletta)
      boxDiff.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura dei bot" }));
      var dg = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.difficolta = d[0]; [].forEach.call(dg.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: d[1] })]);
        b.style.flex = "1"; dg.appendChild(b);
      });
      boxDiff.appendChild(dg); box.appendChild(boxDiff);
      C().sceltaTraguardo(el, box, dove);   // i punti da raggiungere (anche online, ⚙️ Regole)
      notaOnline = el("div", { class: "link-avviso", hidden: "hidden" });
      notaOnline.textContent = (window.SGNet && SGNet.disponibile())
        ? "Apri la stanza e invita gli amici col tasto 📤: entrano dal loro telefono. I posti liberi li giocano i bot."
        : "Qui il collegamento non è disponibile: funziona quando il gioco è aperto dal sito pubblicato online.";
      box.appendChild(notaOnline);
      if (aiuti.torneo) { dove.modo = "bot"; return; }
      if (aiuti.modo) { sel(aiuti.modo); notaOnline.hidden = true; }
    },
    avvia: function (t) {
      if (!window.SGCarte) { var s = t.schermata({ icona: "⚠️", titolo: "Un attimo" }); s._contenuto.appendChild(t.el("p", { text: "Ricarica la pagina e riprova." })); s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci })); return t.mostra(s); }
      var imp = t.impostazioni || {};
      mont = null; memo = { prevMano: 0, prevTav: {}, avvisoN: null }; s2Posti = {};   // partita nuova: niente resti di quella prima
      if (t.linkParams && t.linkParams.stanza) return ospiteScopa2(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostScopa2(t, imp.difficolta || "medio");
      return localeScopa2(t, imp.difficolta || "medio", !!imp.torneo);
    }
  });
})();

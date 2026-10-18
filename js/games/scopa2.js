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
  var PAUSA_MANO = 12;   // online: secondi del riepilogo della mano (con "⏩ Avanti": se lo tocca più di metà si parte subito)
  // 🤫 Messaggio al compagno (online, tra due compagni veri): le frasi pronte, al massimo PSST_MAX a testa per smazzata
  var PSST = ["💰 Ho il settebello", "🪙 Ho i denari", "7️⃣ Ho un 7", "🚫 Non ho 7", "✋ Lascia, ci penso io", "🤝 Fidati di me"];
  var PSST_MAX = 2, PSST_MS = 4000;
  // i bot: quelli del gruppo fisso (SG.bot: sempre gli stessi nomi e avatar in tutti i giochi), scelti per la bravura;
  // escludi = i nomi di chi è al tavolo (nessun bot si chiama come uno di loro). Ognuno { nome, omino }
  function prendiBot(n, livello, escludi) {
    var b = null;
    try { if (window.SG && SG.bot && SG.bot.prendi) b = SG.bot.prendi(n, { livello: livello, escludi: escludi }); } catch (e) {}
    if (!b || b.length < n) { b = []; for (var k = 0; k < n; k++) b.push({ nome: "Bot " + (k + 1), omino: null }); }   // (di sicurezza)
    return b;
  }
  function C() { return window.SGCarte; }
  function team(seat) { return seat % 2; }                 // 0 = Squadra 1 (posti 0,2), 1 = Squadra 2 (posti 1,3)
  function trova(a, id) { for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function importanza(c) { return c.id === "D7" ? 12 : c.s === "D" ? 3 : c.v === 7 ? 2.2 : (c.v === 6 || c.v === 1) ? 1.6 : 1; }
  function mischia(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
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
    st.psst = null; st.psstN = [0, 0, 0, 0];   // 🤫 i messaggi al compagno ricominciano a ogni smazzata
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
    var mvp = migliori(st.prese, st.scope);   // 🏅 conta quello che ognuno ha preso LUI (le carte rimaste non sono merito suo)
    if (st.tavolo.length && st.ultimaPresa != null) { st.prese[st.ultimaPresa] = st.prese[st.ultimaPresa].concat(st.tavolo); st.tavolo = []; }
    var r = conta(st);
    r.mvp = mvp;
    st.punti[0] += r.punti[0]; st.punti[1] += r.punti[1];
    r.tot = [st.punti[0], st.punti[1]];
    st.ultimoRound = r;
    st.fase = C().partitaFinita(st.traguardo, st.punti[0], st.punti[1]) ? "fine" : "fineround";
  }
  // 🏅 Il migliore in campo: per ogni coppia, chi dei due ha portato di più (scope e settebello pesano di più; a pari, nessuno)
  function bravura(prese, scope) {
    var b = { n: prese.length, den: 0, sette: false, n7: 0, scope: scope || 0 }, n6 = 0, n1 = 0;
    prese.forEach(function (c) { if (c.s === "D") b.den++; if (c.id === "D7") b.sette = true; if (c.v === 7) b.n7++; else if (c.v === 6) n6++; else if (c.v === 1) n1++; });
    b.punti = 2 * b.n + 3 * b.den + (b.sette ? 20 : 0) + 20 * b.scope + 4 * b.n7 + 2 * n6 + n1;   // (tutto ×2: numeri interi, il pari è un pari vero)
    return b;
  }
  function testoBravura(b) {   // "2 scope e il settebello", "il settebello e 6 denari", "14 carte e 5 denari"
    var p = [];
    if (b.scope) p.push(b.scope === 1 ? "1 scopa" : b.scope + " scope");
    if (b.sette) p.push("il settebello");
    if (p.length < 2 && b.den) p.push(b.den === 1 ? "1 denaro" : b.den + " denari");
    if (p.length < 2 && b.n7 >= 2) p.push(b.n7 + " sette");
    if (p.length < 2) p.push(b.n === 1 ? "1 carta" : b.n + " carte");
    return p.length > 1 ? p[0] + " e " + p[1] : p[0];
  }
  function migliori(prese, scope) {   // [squadra dei posti 0-2, squadra dei posti 1-3]: { s, testo } o null
    return [[0, 2], [1, 3]].map(function (c) {
      var a = bravura(prese[c[0]], scope[c[0]]), b = bravura(prese[c[1]], scope[c[1]]);
      if (a.punti === b.punti) return null;
      var s = a.punti > b.punti ? c[0] : c[1];
      return { s: s, testo: testoBravura(s === c[0] ? a : b) };
    });
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

  function escH(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  // ---------- vista per chi guarda: il tavolo da chi sta al posto 0, senza le carte in mano di nessuno ----------
  function vistaGuarda(st) { var v = vistaDa(st, 0); v.mano = []; v.spett = 1; if (v.psst) v.psst.k = null; return v; }   // (chi guarda vede solo 🤫, mai la frase al compagno)
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
        pPrim: pr.pPrim == null ? null : (pr.pPrim === m ? "mia" : "altra"),
        // 🏅 [mia squadra, altra]: { nome, testo, io } o null
        mvp: [m, a].map(function (tm) { var x = pr.mvp && pr.mvp[tm]; return x ? { nome: st.nomi[x.s], testo: x.testo, io: x.s === io } : null; })
      };
    }
    // 🤫 il messaggio al compagno: tutti sanno CHI l'ha mandato (🤫 sopra il suo avatar); la frase solo lui e il compagno
    var ps = st.psst ? { s: st.psst.s, n: st.psst.n, k: (st.psst.s === io || st.psst.s === comp) ? st.psst.k : null } : null;
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
      vincitoreMio: st.fase === "fine" ? (st.punti[mioTeam] > st.punti[1 - mioTeam]) : false,
      psst: ps
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
    var Cl = { vm: null, sel: { carta: null, presa: [] }, chiuso: false, pausa: false, cb: cb }, T = nuovaTracciaS2();
    // 🤫 un messaggio nuovo: il compagno legge la frase sopra il mio avatar, gli altri solo 🤫 (per 4 secondi);
    // chi l'ha mandato vede passare "🤫 A Luca: «…»". Chi rientra non rivede quelli vecchi (l'host li tiene 4 secondi)
    Cl.vediPsst = function (vm) {
      var p = vm.psst; if (!p || p.n === Cl._psstN) return;
      Cl._psstN = p.n;
      var comp = (vm.io + 2) % 4, frase = p.k != null ? PSST[p.k] : null;
      if (p.s === vm.io) { if (frase) psstF = { n: p.n, mio: true, testo: "🤫 A " + vm.nomi[comp] + ": «" + frase + "»" }; return; }
      psstF = { n: p.n, s: p.s, txt: (p.s === comp && frase) ? frase : "🤫", fino: Date.now() + PSST_MS };
      if (p.s === comp && frase) { vibra(25); suonoNote([[988, 0], [1319, 0.08]], 0.07); }   // il compagno ti ha detto qualcosa: un momento che conta
      if (Cl._psstT) clearTimeout(Cl._psstT);
      Cl._psstT = setTimeout(function () { Cl._psstT = null; if (mont && document.body.contains(mont.box)) Cl.disegna(); }, PSST_MS + 80);   // il fumetto se ne va (solo se il tavolo c'è ancora)
    };
    Cl.tapMano = function (id) {
      var vm = Cl.vm; if (!vm || vm.spett || vm.turno !== vm.io || vm.fase !== "gioco" || vm.presa) return;
      var carta = trova(vm.mano, id); if (!carta) return;
      vibra(10);
      var opts = C().catture(carta.v, vm.tavolo);
      if (opts.length === 0) { Cl.sel = { carta: null, presa: [] }; cb.onMossa(id, null); return; }
      if (opts.length === 1) { Cl.sel = { carta: null, presa: [] }; cb.onMossa(id, opts[0]); return; }
      Cl.sel = (Cl.sel.carta === id) ? { carta: null, presa: [] } : { carta: id, presa: [] }; Cl.disegna();
    };
    Cl.tapTavolo = function (id) {
      var vm = Cl.vm; if (!vm || vm.spett || vm.turno !== vm.io || vm.fase !== "gioco" || vm.presa) return;
      var carta = Cl.sel.carta ? trova(vm.mano, Cl.sel.carta) : null; if (!carta) return;
      var opts = C().catture(carta.v, vm.tavolo);
      var p = Cl.sel.presa.slice(); var k = p.indexOf(id); if (k >= 0) p.splice(k, 1); else p.push(id);
      vibra(10);
      if (C().validaSet(opts, p)) { var cid = Cl.sel.carta; Cl.sel = { carta: null, presa: [] }; cb.onMossa(cid, p); return; }
      if (C().prefisso(opts, p)) Cl.sel.presa = p;
      else if (C().prefisso(opts, [id])) Cl.sel.presa = [id];   // carta di un'altra presa: si ricomincia la scelta da quella
      Cl.disegna();
    };
    Cl.disegna = function () { if (!Cl.vm || Cl.chiuso || Cl.pausa) return; clVivo = Cl; disegna(t, Cl, cb); };
    Cl._fino = 0; Cl._pend = null; Cl._fineVista = null; Cl._mioPrima = false;
    Cl.azzera = function () { if (Cl._pend) clearTimeout(Cl._pend); Cl._pend = null; Cl._fino = 0; Cl.vm = null; Cl.sel = { carta: null, presa: [] }; mont = null; psstF = null; };
    Cl.setVm = function (vm) {
      if (Cl.chiuso || !vm) return;
      if (!cb.noTrofei && !vm.spett) tracciaS2(T, vm);   // trofei (chi guarda, vm.spett, non conta niente)
      Cl.vediPsst(vm);
      if (vm.turno !== vm.io || vm.fase !== "gioco") Cl.sel = { carta: null, presa: [] };
      // online: quando arriva il tuo turno, un piccolo suono
      var mio = !vm.spett && vm.fase === "gioco" && vm.turno === vm.io && !vm.presa;
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
      // 🤫 il tasto vicino alla mano, il pannellino delle frasi e il fumetto lungo che non esce dallo schermo
      ".s2-psst{position:absolute;right:8px;bottom:calc(5px + env(safe-area-inset-bottom));z-index:7;margin:0;min-height:0;height:28px;padding:0 10px;border-radius:999px;border:1.5px solid rgba(255,255,255,.4);background:rgba(10,18,50,.8);color:#fff;font-weight:900;font-size:.85rem;line-height:1;cursor:pointer}",
      ".s2-psst[disabled]{opacity:.4;cursor:default}",
      ".s2-psst-pan{position:absolute;left:8px;right:8px;bottom:100%;margin-bottom:6px;z-index:8;background:rgba(10,18,50,.97);border:1.5px solid #ffd43b;border-radius:14px;padding:8px;box-shadow:0 6px 18px rgba(0,0,0,.45);animation:s2Pan .18s ease-out}",
      "@keyframes s2Pan{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
      ".s2-psst-tit{font-size:.8rem;font-weight:800;text-align:center;margin:0 26px 6px;color:#fff}",
      ".s2-psst-gr{display:grid;grid-template-columns:1fr 1fr;gap:6px}",
      ".s2-psst-f{margin:0;min-height:38px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff;font-weight:800;font-size:.82rem;padding:4px 6px;line-height:1.15;cursor:pointer}",
      ".s2-psst-x{position:absolute;top:3px;right:4px;margin:0;min-height:0;background:none;border:0;color:#fff;font-size:1.05rem;padding:3px 8px;cursor:pointer}",
      ".sc-fumetto.s2-dx{transform-origin:100% 100%}",
      ".sc-fumetto.s2-dx::after{left:auto;right:-6px;border:7px solid transparent;border-left-color:#fff;border-right:0}",
      ".s2-mvp{text-align:center;font-size:.8rem;font-weight:700;margin-top:6px;line-height:1.35}",
      ".s2-avanti{display:flex;flex-direction:column;align-items:center;gap:4px;margin-bottom:6px}",
      ".s2-avanti .btn{margin:0}",
      ".s2-avanti p{margin:0;text-align:center;font-weight:800}",
      ".btn.s2-fatto,.btn.s2-fatto[disabled]{opacity:.8;cursor:default}",
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
  // girato il telefono o cambiata l'altezza dello schermo: la stanza si rifà della misura giusta (solo se cambia, solo al tavolo)
  var clVivo = null, giraT = null;
  window.addEventListener("resize", function () {
    clearTimeout(giraT);
    giraT = setTimeout(function () {
      var Cl = clVivo;
      if (Cl && !Cl.chiuso && !Cl.pausa && Cl.vm && Cl.vm.fase === "gioco" && mont && document.body.contains(mont.box)) Cl.disegna();
    }, 250);
  });
  var psstF = null;   // 🤫 il fumetto del messaggio al compagno: { n, s (posto), txt, fino } (o { n, mio, testo } per chi l'ha mandato)
  function sedieDa(vm) {
    var io = vm.io, comp = (io + 2) % 4, ordine = [(io + 1) % 4, comp, (io + 3) % 4];
    var mioTurno = (vm.turno === io && vm.fase === "gioco" && !vm.presa);
    var sedie = ordine.map(function (s) {
      var faccia = "normale", fumetto = null;
      if (vm.presa && vm.presa.scopa) { faccia = team(s) === team(vm.presa.seat) ? "esulta" : "triste"; if (s === vm.presa.seat) fumetto = "🧹 SCOPA!"; }
      else if (vm.turno === s && vm.fase === "gioco" && !vm.presa) { faccia = "pensa"; fumetto = "🤔"; }
      if (psstF && !psstF.mio && psstF.s === s && Date.now() < psstF.fino && !(vm.presa && vm.presa.scopa)) fumetto = psstF.txt;   // 🤫
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
  // i fumetti lunghi (🤫 la frase del compagno) vanno a capo e, se escono dallo schermo a destra, passano dall'altra parte
  function sistemaFumetti(R) {
    var sw = R.scena.clientWidth;
    R.posti.forEach(function (pos) {
      var fm = pos.box.querySelector(".sc-fumetto");
      pos.box.style.zIndex = fm ? "6" : "";   // (chi parla sta sopra gli altri avatar e le targhe: il fumetto non resta coperto)
      if (!fm || fm.textContent.length <= 9) return;
      fm.classList.add("lungo");
      if (pos.box.offsetLeft + fm.offsetLeft + fm.offsetWidth > sw - 4) { fm.classList.add("s2-dx"); fm.style.left = Math.round(pos.box.offsetWidth * 0.32 - fm.offsetWidth) + "px"; }
    });
  }
  function disegna(t, Cl, cb) {
    var vm = Cl.vm;
    C().assicuraStile(); stileS2();
    if (vm.fase === "fineround" || vm.fase === "fine") { mont = null; memo.prevMano = 0; memo.prevTav = {}; return renderFine(t, vm, cb); }
    if (window.SGMusica) window.SGMusica.avvia();
    var wH = C().larghezza(3, 10, 104);   // mano max 3 (grande)
    var M = C().misureStanza4("scopa2", wH, 1);
    var key = [vm.io, vm.spett ? 1 : 0, M.scW, M.scH, M.wT, wH, JSON.stringify(vm.nomi), JSON.stringify(vm.avatari || null)].join("|");
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
    // 🤫 online tra due compagni veri: il tasto vicino alla mano apre le frasi pronte (le vede solo il compagno)
    mensola.style.position = "relative";
    var psstP = el("div", { class: "s2-psst-pan", hidden: "hidden" }), psstTit = el("div", { class: "s2-psst-tit" });
    psstP.appendChild(psstTit);
    psstP.appendChild(el("div", { class: "s2-psst-gr" }, PSST.map(function (f, i) {
      return el("button", { class: "s2-psst-f", type: "button", text: f, onclick: function () { psstP.hidden = true; if (Cl.cb.onPsst) Cl.cb.onPsst(i); } });
    })));
    psstP.appendChild(el("button", { class: "s2-psst-x", type: "button", text: "✕", "aria-label": "Chiudi", onclick: function () { psstP.hidden = true; } }));
    var psstB = el("button", { class: "s2-psst", type: "button", hidden: "hidden", onclick: function () { if (!psstB.disabled) psstP.hidden = !psstP.hidden; } });
    mensola.appendChild(psstP); mensola.appendChild(psstB);
    box.appendChild(mensola);
    var cont;
    if (mont && mont.cont && document.body.contains(mont.box)) { mont.cont.replaceChild(box, mont.box); cont = mont.cont; }
    else {
      var s = t.schermata({ indietro: function () { t.conferma(cb.guarda ? "Smetti di guardare?" : "Uscire dalla partita?", null, "Esci", function () { cb.onEsci(); }); } });   // (la finestra dell'app)
      s.classList.add("sc-piena");   // stanza da bordo a bordo
      if (cb.targa) s.classList.add("sc-con-targa");   // chi guarda soltanto: sotto, il posto per la targhetta del core (la stanza si misura da sola)
      s._contenuto.appendChild(box); t.mostra(s);
      cont = s._contenuto;
    }
    mont = { key: key, box: box, cont: cont, R: R, punti: punti, area: area, griglia: griglia, mensola: mensola, manoW: manoW, prese: prese, psstB: psstB, psstP: psstP, psstTit: psstTit,
      tav: {}, mano: {}, wT: null, wH: wH, chiaviSedie: sedie.map(function (p) { return p.chiave; }), gioc: null, presaKey: null, aiuto: null };
    if (C().correggiStanza4(M, cont.parentNode, mensola, function () { disegna(t, Cl, cb); })) return false;
    R.siedi(); sistemaFumetti(R);
    return true;
  }
  // aggiorna SOLO le parti che cambiano: punteggio, avatar, targhe, carte coperte, tavolo, mano
  function aggiorna(t, Cl, vm, M) {
    var el = t.el, R = mont.R, ASP = C().ASP_CARTA, io = vm.io;
    var mioTurno = !vm.spett && (vm.turno === io && vm.fase === "gioco" && !vm.presa);
    // (chi guarda, vm.spett: le squadre coi nomi, la prima è quella di chi sta in basso)
    var sqP = vm.spett && vm.squadre ? function (a) { return escH(a.filter(Boolean).map(function (n) { return String(n).slice(0, 8); }).join("+")); } : null;
    var testoPunti = (sqP ? sqP(vm.squadre.mia) + " <b style='color:#69db7c'>" + vm.punti.mia + "</b> — <b>" + vm.punti.altra + "</b> " + sqP(vm.squadre.altra)
      : "Noi <b style='color:#69db7c'>" + vm.punti.mia + "</b> — Loro <b>" + vm.punti.altra + "</b>") + " <span class='tenue' style='font-weight:600'>(" + C().testoTraguardo(vm.traguardo) + ")</span>";
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
    if (rifai) { R.siedi(); sistemaFumetti(R); }

    // 🤫 il tasto dei messaggi al compagno (solo online e se il compagno non è un Bot) e il pannellino delle frasi
    var resto = vm.psstResto, vedi = resto != null && resto >= 0 && vm.fase === "gioco";
    if (mont.psstB.hidden === vedi) mont.psstB.hidden = !vedi;
    if (vedi) {
      var tb = "🤫 " + Math.max(0, resto);
      if (mont.psstB.textContent !== tb) mont.psstB.textContent = tb;
      if (mont.psstB.disabled !== (resto <= 0)) mont.psstB.disabled = resto <= 0;
      var tt = "🤫 Solo " + (vm.nomi[(io + 2) % 4] || "il compagno") + " lo legge · ancora " + resto;
      if (mont.psstTit.textContent !== tt) mont.psstTit.textContent = tt;
    }
    if ((!vedi || resto <= 0) && !mont.psstP.hidden) mont.psstP.hidden = true;
    if (psstF && psstF.mio && psstF.n !== memo.psstAvv) {   // a chi l'ha mandato: "🤫 A Luca: «Ho il settebello»"
      memo.psstAvv = psstF.n;
      var avP = el("div", { class: "s2-avviso", text: psstF.testo }); R.scena.appendChild(avP);
      setTimeout(function () { if (avP.parentNode) avP.parentNode.removeChild(avP); }, 3300);
    }

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
    if (vm.presa && vm.presa.scopa && (vm.presa.mio || vm.spett)) testoAiuto = "SCOPA! 🧹";
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
    // chi guarda (vm.spett): sulla mensola le carte di chi sta in basso, coperte (se ne aggiunge o toglie una alla volta)
    if (vm.spett) {
      var nD = (vm.nCarte && vm.nCarte[io]) || 0; if (!mont.dorsi) mont.dorsi = [];
      while (mont.dorsi.length > nD) { var d0 = mont.dorsi.pop(); if (d0.parentNode) d0.parentNode.removeChild(d0); }
      while (mont.dorsi.length < nD) { var d1 = C().dorsoEl(el, mont.wH); mont.dorsi.push(d1); mont.manoW.appendChild(d1); }
    }
    var nome0 = vm.spett ? escH(String(vm.nomi[io] || "").slice(0, 12)) : "", tocca0 = vm.spett && vm.turno === io && vm.fase === "gioco" && !vm.presa;
    var testoPrese = vm.spett && Cl.notaGuardo   // (nella Sala non sono tra gli scelti: "👀 Questa volta guardi" sempre, poi di chi è il turno o le prese)
      ? "👀 " + Cl.notaGuardo + " · " + (tocca0 ? "tocca a <b>" + nome0 + "</b>" : "prese: <b>" + vm.preseMia + "</b>")
      : (mioTurno ? "<span class='s2-tocca'>👉 Tocca a te!</span>" : vm.spett ? (tocca0 ? "<span class='s2-tocca'>👉 " + nome0 + "</span>" : "👀 " + nome0 + " · ") : "") + "prese squadra: <b>" + vm.preseMia + "</b>" + (vm.setteMia ? " · 7💰" : "") + (vm.scopeMia ? " · scope " + vm.scopeMia : "");
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
    if (memo.fineKey === kF && memo.fineS && document.body.contains(memo.fineS)) {   // (online cambia solo la riga di "⏩ Avanti")
      if (memo.avBox && vm.fase === "fineround") avantiRiga(t, vm, cb);
      return;
    }
    memo.avBox = null; memo.avNodo = null;
    var el = t.el, r = vm.ultimoRound, sq = vm.squadre || { mia: ["Noi", ""], altra: ["Loro", ""] };
    function nomiSq(a) { return a.filter(Boolean).join(" e "); }
    var mvp = (r && r.mvp) || [null, null];
    function nomiMvp(a, mv) { return a.filter(Boolean).map(function (n) { return n + (mv && mv.nome === n ? " 🏅" : ""); }).join(" e "); }   // 🏅 accanto al migliore
    var titolo = "Fine mano";
    if (vm.fase === "fine") {
      if (vm.punti.mia === vm.punti.altra) titolo = "Pareggio!";
      else if (cb.multi || vm.spett) titolo = "Vincono " + nomiSq(vm.vincitoreMio ? sq.mia : sq.altra) + "!";   // (chi guarda: coi nomi)
      else titolo = vm.vincitoreMio ? "Avete vinto!" : "Hanno vinto gli altri";
    }
    var s = t.schermata({ icona: vm.fase === "fine" ? "🏆" : "🧮", titolo: titolo, sotto: "Scopa 2 vs 2",
      indietro: vm.fase === "fine" ? null : function () { t.conferma(cb.guarda ? "Smetti di guardare?" : "Uscire dalla partita?", null, "Esci", function () { cb.onEsci(); }); } });
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
        html: "<span style='color:#69db7c'>" + esc(nomiMvp(sq.mia, mvp[0])) + "</span> — <span style='color:#ff8787'>" + esc(nomiMvp(sq.altra, mvp[1])) + "</span>" }));
      if (vm.resti && vm.resti.n && vm.resti.nome)
        s._contenuto.appendChild(el("div", { class: "tenue", style: "text-align:center;font-size:.8rem;margin-bottom:6px",
          text: (vm.resti.n === 1 ? "L'ultima carta rimasta sul tavolo va" : "Le " + vm.resti.n + " carte rimaste sul tavolo vanno") + " a " + vm.resti.nome + " (ha preso per ultimo)." }));
      s._contenuto.appendChild(riga("Carte (" + r.carte[0] + " vs " + r.carte[1] + ")", r.carte[0], r.carte[1], r.pCarte));
      s._contenuto.appendChild(riga("Denari (" + r.den[0] + " vs " + r.den[1] + ")", r.den[0], r.den[1], r.pDen));
      s._contenuto.appendChild(riga("Settebello 7💰", r.sette === "mia" ? "sì" : "—", r.sette === "altra" ? "sì" : "—", r.sette));
      s._contenuto.appendChild(riga("Primiera (" + r.prim[0] + " vs " + r.prim[1] + ")", r.prim[0], r.prim[1], r.pPrim));
      var chi = r.scopeChi ? [r.scopeChi[0], r.scopeChi[1]].filter(Boolean).join(" · ") : "";
      s._contenuto.appendChild(riga("Scope 🧹", r.scope[0], r.scope[1], null, chi ? "Le hanno fatte: " + chi : null));
      // 🏅 Il migliore in campo di ogni coppia: "🏅 Luca: 2 scope e il settebello" (a pari, nessuna medaglia)
      var righeMvp = [0, 1].filter(function (i) { return mvp[i]; }).map(function (i) {
        var x = mvp[i], nome = x.io && !cb.multi ? "Tu" : x.nome;
        return "<span style='color:" + (i === 0 ? "#69db7c" : "#ff8787") + "'>🏅 " + esc(nome) + "</span>: " + esc(x.testo);
      });
      if (righeMvp.length) {
        var dMvp = nRiga++ * 0.22;
        s._contenuto.appendChild(el("div", { class: "s2-riga s2-mvp", style: "animation-delay:" + dMvp.toFixed(2) + "s", html: righeMvp.join("<br>") }));
        if (!cb.multi && ((mvp[0] && mvp[0].io) || (mvp[1] && mvp[1].io))) setTimeout(function () { vibra(30); }, Math.round(dMvp * 1000) + 200);   // la medaglia è tua: breve
      }
      var linea = el("div", { class: "s2-riga", style: "height:1px;background:rgba(255,255,255,.15);margin:8px 0;animation-delay:" + (nRiga * 0.22).toFixed(2) + "s" });
      s._contenuto.appendChild(linea);
      s._contenuto.appendChild(riga("Punti mano", r.punti[0], r.punti[1], null));
      var conNomi = cb.multi || vm.spett;   // (sullo stesso telefono e per chi guarda: i nomi)
      s._contenuto.appendChild(el("div", { class: "s2-riga", style: "text-align:center;font-size:" + (conNomi ? "1.05rem" : "1.3rem") + ";font-weight:800;margin-top:8px;animation-delay:" + (nRiga * 0.22 + 0.1).toFixed(2) + "s",
        html: (conNomi ? escH(nomiSq(sq.mia)) : "Noi") + " <span style='color:#ffd43b'>" + r.tot[0] + "</span> — " + r.tot[1] + " " + (conNomi ? escH(nomiSq(sq.altra)) : "Loro") }));   // sullo stesso telefono "noi" non vuol dire niente: i nomi
      // una notina per ogni voce che compare
      var note = []; for (var i = 0; i < nRiga; i++) note.push([520 + i * 40, i * 0.22]);
      if (!vm.spett) suonoNote(note, 0.06);   // (chi guarda: niente suoni suoi)
    }
    // online: la fila delle faccine (il mio avatar le fa sui telefoni di tutti)
    var fa = cb.online && !cb.targa && t.faccine ? t.faccine() : null;   // (chi guarda soltanto le ha nella targhetta del core)
    if (fa) { fa.style.margin = "0 0 8px"; s._piede.appendChild(fa); }
    if (cb.targa) s._piede.style.paddingBottom = "calc(62px + env(safe-area-inset-bottom))";   // (il posto della targhetta)
    if (vm.fase === "fine") {
      if (cb.torneo) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏆 Punti del torneo", onclick: cb.onTorneo }));
      // online: i tasti di fine uguali per tutti i giochi (Rivincita, Ci sto…); se il core non li mette, quelli di sempre
      else if (cb.online && t.tastiFine && t.tastiFine(s._piede, { host: !!cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci })) { /* fatto dal core */ }
      else if (cb.sonoHost || cb.locale) {
        s._piede.appendChild(el("button", { class: "btn btn-primario", text: cb.locale ? "🔄 Nuova partita" : "🔄 Nuova partita (in saletta)", onclick: cb.onNuova }));
        s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
      } else {
        s._piede.appendChild(el("p", { class: "modulo-nota", text: cb.guarda ? "👀 Se l'host fa una nuova partita, entri anche tu nella saletta." : "Se l'host fa una nuova partita, torni in saletta con lui." }));
        if (!cb.targa) s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));   // (chi guarda soltanto: esce dal ✕ della targhetta)
      }
      if (!vm.spett && vm.punti.mia !== vm.punti.altra && (vm.vincitoreMio || cb.multi)) setTimeout(function () { coriandoli(); suonoNote([[523, 0], [659, 0.12], [784, 0.24], [1047, 0.38]], 0.16); }, 1300);
    } else {
      if (cb.online) {
        // online la prossima mano parte da sola dopo il conto; "⏩ Avanti": se lo tocca più di metà di chi gioca si parte subito
        memo.avBox = el("div", { class: "s2-avanti" });
        memo.avConta = el("p", { class: "modulo-nota", style: "font-size:.8rem", hidden: "hidden" });
        memo.avBox.appendChild(memo.avConta);
        s._piede.insertBefore(memo.avBox, s._piede.firstChild);
        memo.fineKey = kF; memo.fineS = s;
        avantiRiga(t, vm, cb);
      } else {
        s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Continua ▶", onclick: cb.onAvanti }));
      }
    }
    t.mostra(s); memo.fineKey = kF; memo.fineS = s;
  }
  // la riga di "⏩ Avanti" sotto il riepilogo della mano (online): il mio tocco resta «✅ Avanti» e cambia solo il numero
  function avantiRiga(t, vm, cb) {
    var el = t.el, A = vm.avanti || { si: 0, tot: 0, resta: PAUSA_MANO }, kM = vm.pid + ":" + vm.nMano;
    if (memo.avK !== kM || vm.avanti) { memo.avK = kM; memo.avScade = Date.now() + (A.resta || PAUSA_MANO) * 1000; }   // (i secondi che mancano, dall'host)
    var toccato = !!A.mio || memo.mioVoto === kM;
    if (memo.avTocc !== toccato || !memo.avNodo || !memo.avBox.contains(memo.avNodo)) {
      memo.avTocc = toccato;
      var nodo = toccato
        ? el("button", { class: "btn btn-primario s2-fatto", type: "button", disabled: "disabled", text: "✅ Avanti " })
        : el("button", { class: "btn btn-primario", type: "button", text: "⏩ Avanti ", onclick: function () {
            memo.mioVoto = kM;
            if (cb.onVoto) cb.onVoto(vm.nMano, vm.pid);
            if (memo.avBox && document.body.contains(memo.avBox) && memo.avK === kM) avantiRiga(t, memo.vmFine || vm, cb);
          } });
      if (memo.avNodo && memo.avNodo.parentNode) memo.avNodo.parentNode.removeChild(memo.avNodo);
      memo.avBox.insertBefore(nodo, memo.avBox.firstChild); memo.avNodo = nodo;
      // il conto: a zero l'host fa partire la mano (gli altri vedono solo il numero); il conto chiama la funzione, niente vibrazione
      if (t.contoAvanti) t.contoAvanti(nodo, Math.max(1, Math.ceil((memo.avScade - Date.now()) / 1000)), cb.sonoHost ? cb.onAvanti : null, "mano|" + kM);
    }
    memo.vmFine = vm;
    var tx = A.si ? "⏩ " + A.si + " su " + A.tot + " vogliono andare avanti" : "";
    if (memo.avConta.textContent !== tx) memo.avConta.textContent = tx;
    if (memo.avConta.hidden !== !tx) memo.avConta.hidden = !tx;
  }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // ========================================================
  //  LOCALE — tu (posto 0) + 3 bot; nel torneo sullo stesso telefono fino a 4 persone
  //  (posti 0,1,2,3 in ordine) che si passano il telefono, gli altri posti ai bot
  // ========================================================
  function localeScopa2(t, diff, torneo) {
    var nomiG = ((t.giocatori && t.giocatori.length) ? t.giocatori : ["Tu"]).slice(0, torneo ? 4 : 1);
    var multi = nomiG.length > 1, vista = 0, finita = false, attesa = false, giroT = null, detto = false;
    function umano(s) { return s < nomiG.length; }
    // i posti liberi ai bot del gruppo fisso (col loro nome e il loro avatar): avversari e compagno
    var bots = prendiBot(4 - nomiG.length, diff, nomiG);
    function postiIniziali(x) {
      var k = 0; x.nomi = {}; x.avatari = {};
      for (var s = 0; s < 4; s++) {
        if (umano(s)) { x.nomi[s] = nomiG[s] || "Giocatore " + (s + 1); continue; }
        var b = bots[k++]; x.nomi[s] = b.nome; x.avatari[s] = b.omino || null;
      }
    }
    function nuovaPartita() { var x = creaStato(C().traguardoDa(t.impostazioni)); postiIniziali(x); nuovaMano(x); detto = false; return x; }
    var st = nuovaPartita();
    function classifica() {
      var v = st.punti[0] > st.punti[1] ? 0 : 1, pari = st.punti[0] === st.punti[1];
      return [0, 1, 2, 3].filter(function (k) { return !torneo || umano(k); })
        .map(function (k) { var x = { nome: st.nomi[k], pos: (team(k) === v || pari) ? 1 : 2 }; if (!umano(k)) x.bot = true; return x; })
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
    var IO = t.mioId || "host";   // chi tiene la partita su questo telefono (posto 0)
    // la ripresa (l'host ha ricaricato la pagina a metà partita): quello che si è ricordato in bcast()
    var RIP = t.ripresa && t.ripresa.stato && t.ripresa.stato.scopa2;
    var st = null, rete = null, codice = "…", pronta = false, chiuso = false, attesa = false, giroT = null, nAvviso = 0;
    var respiroFino = 0;   // (ripresa) fino a quando i bot aspettano a giocare: un attimo per accorgersi che si riprende
    // posti[1..3]: id se umano collegato, null se libero. Il posto 0 è l'host.
    var posti = { 0: null, 1: null, 2: null, 3: null };
    // il mio posto: lo 0; se ho preso il posto dell'host sparito (host di riserva), quello dove giocavo (l'host di prima
    // resta al suo posto come un amico: se non torna gioca il bot)
    var MIO = 0;
    function altri() { return [0, 1, 2, 3].filter(function (s) { return s !== MIO; }); }
    var guarda = [];   // nella Sala: chi non è stato scelto per giocare ({ id, nome }): niente posto al tavolo
    var nomiUmani = { 0: null, 1: null, 2: null, 3: null }, avatariUmani = { 0: null, 1: null, 2: null, 3: null };
    var via = {};   // via[posto] = chi è uscito a partita in corso: se torna si riprende il suo posto
    var botSeat = { 0: false, 1: true, 2: true, 3: true };  // chi è gestito dal computer durante la partita
    var avanti = {}, avKey = null, scad = 0;   // "⏩ Avanti" sul riepilogo della mano: chi l'ha toccato (per id) e quando scade il conto
    var psstCont = 0;                          // 🤫 il numero dell'ultimo messaggio al compagno

    function esci() { ricorda(null); chiuso = true; Cl.chiuso = true; if (giroT) clearTimeout(giroT); if (window.SGMusica) window.SGMusica.ferma(); if (rete) rete.chiudi(); t.esci(); }
    // dopo ogni cambiamento la partita si ricorda (se l'host ricarica, la mano continua); in saletta niente da riprendere
    var ricordato = !!RIP;
    function ricorda(x) {
      if (!t.ricorda) return;
      if (!x) { if (ricordato) { ricordato = false; t.ricorda(null); } return; }
      ricordato = true; t.ricorda(x);
    }
    // (il 🤫 messaggio al compagno di questo momento non si ricorda: dura 4 secondi e la copia per il vice passa dalla rete)
    function senzaPsst(x) { var c = JSON.parse(JSON.stringify(x)); delete c.psst; return c; }
    function ricordaOra() {
      ricorda(st ? { scopa2: { st: senzaPsst(st), mio: MIO, io: IO, posti: posti, nomiUmani: nomiUmani, avatariUmani: avatariUmani, via: via,
        botSeat: botSeat, guarda: guarda, diff: diff, nAvviso: nAvviso, detto: detto } } : null);
    }
    var Cl = creaClient(t, {
      sonoHost: true, online: true,
      onMossa: function (id, presa) { if (st) passo(MIO, id, presa); },
      onAvanti: avantiOra,
      onVoto: function (m, pid) { voto(IO, m, pid); },
      onPsst: function (k) { psstDa(MIO, k); },
      onNuova: function () { tornaSaletta(); },
      onEsci: esci
    });
    function avantiOra() { if (st && st.fase === "fineround") { prossimaMano(st); bcast(); giro(); } }
    // chi gioca davvero ed è presente (l'host e gli amici al tavolo; non i Bot né chi guarda)
    function umani() { var o = [IO]; altri().forEach(function (s) { if (posti[s] && !botSeat[s]) o.push(posti[s]); }); return o; }
    function idDi(s) { return s === MIO ? IO : posti[s]; }
    function infoAvanti(s) {
      var u = umani(), si = u.filter(function (id) { return avanti[id]; }).length;
      return { si: si, tot: u.length, resta: Math.max(1, Math.ceil((scad - Date.now()) / 1000)), mio: s != null && !!avanti[idDi(s)] };
    }
    // "⏩ Avanti": vale solo per QUESTA smazzata; se lo tocca più di metà di chi gioca si parte subito (se no, il conto alla rovescia)
    function voto(id, m, pid) {
      if (!st || st.fase !== "fineround" || m !== st.nMano || (pid && pid !== st.pid)) return;
      if (umani().indexOf(id) < 0) return;   // chi guarda e i Bot non contano
      avanti[id] = 1;
      var I = infoAvanti(null);
      if (I.si * 2 > I.tot) return avantiOra();
      bcast();
    }
    // 🤫 un messaggio al compagno: passa dall'host, la frase va solo a chi l'ha mandato e al compagno (nella LORO vista,
    // come le carte); agli altri solo "🤫" sopra l'avatar. Al massimo PSST_MAX a testa per smazzata; dopo 4 secondi sparisce
    function psstDa(s, k) {
      k = +k;
      if (!st || !st.conPsst || st.fase !== "gioco" || !(k >= 0 && k < PSST.length) || k % 1) return;
      if (botSeat[s] || botSeat[(s + 2) % 4]) return;   // il compagno è un Bot: niente messaggi
      if ((st.psstN[s] || 0) >= PSST_MAX) { if (s !== MIO) mandaVm(s); return; }
      st.psstN[s] = (st.psstN[s] || 0) + 1;
      var n = ++psstCont; st.psst = { s: s, k: k, n: n };
      bcast();
      setTimeout(function () { if (st && st.psst && st.psst.n === n) st.psst = null; }, PSST_MS);   // (chi rientra dopo non lo rivede)
    }
    // quello che il core non vede nella vista di un posto: "⏩ Avanti" e quanti 🤫 restano (-1 = niente tasto)
    function conVm(v, s) {
      v.avanti = st.fase === "fineround" ? infoAvanti(s) : null;
      v.psstResto = (st.conPsst && !botSeat[s] && !botSeat[(s + 2) % 4]) ? PSST_MAX - (st.psstN[s] || 0) : -1;
      return v;
    }
    t.onRegole = function () { if (!st) aggiornaLobby(); };   // l'host ha cambiato le regole in saletta: lo vedono tutti

    function mioNome() { return (t.giocatori && t.giocatori[0]) || "Host"; }
    function mioAv() { return t.mioOmino ? t.mioOmino(mioNome()) : C().mioAvatar(mioNome()); }
    // un bot del gruppo fisso per un posto libero (bravura di questa partita): mai uno già al tavolo,
    // né col nome di chi gioca, di chi è uscito o di chi guarda
    function botLibero() {
      var escludi = [mioNome()], s;
      altri().forEach(function (k) { if (nomiUmani[k]) escludi.push(nomiUmani[k]); });
      if (st) for (s = 0; s < 4; s++) if (st.nomi[s]) escludi.push(st.nomi[s]);
      Object.keys(via).forEach(function (k) { escludi.push(via[k].nome); });
      guarda.forEach(function (g) { escludi.push(g.nome); });
      return prendiBot(1, diff, escludi)[0];
    }
    function mettiBot(s) { var b = botLibero(); st.nomi[s] = b.nome; st.avatari[s] = b.omino || null; }
    function nomiPartenza() {
      st.nomi = { 0: mioNome() }; st.avatari = { 0: mioAv() };
      for (var s = 1; s <= 3; s++) if (posti[s]) { st.nomi[s] = nomiUmani[s]; st.avatari[s] = avatariUmani[s]; }
      for (s = 1; s <= 3; s++) if (!posti[s]) mettiBot(s);   // i bot del gruppo fisso, col loro avatar
    }
    function postoLibero() { var l = altri().filter(function (s) { return !posti[s]; }); return l.length ? l[0] : -1; }
    function seatDi(id) { var l = altri().filter(function (s) { return posti[s] === id; }); return l.length ? l[0] : -1; }
    function avviso(testo) { if (st) st.avviso = { n: ++nAvviso, testo: testo }; }

    var detto = false;   // il risultato della partita è già stato dato al torneo online?
    function mandaVm(s) { if (rete && posti[s]) rete.inviaVeloce({ t: "vm", to: posti[s], vm: conVm(vistaDa(st, s), s) }); }   // solo a lui, e non resta sul server
    // per chi non è seduto (guarda soltanto dal link, nella Sala non è stato scelto, è arrivato a tavolo pieno): il tavolo visto
    // da chi sta al posto 0, SENZA carte in mano (g, con vm.spett), dentro il "partita in corso" che resta sul server: chi
    // arriva a partita cominciata lo vede subito (e per chi gioca resta il messaggio di sempre)
    function mandaGuarda() { if (rete && st) rete.invia({ t: "inCorso", fase: st.fase === "fine" ? "fine" : "gioco", g: vistaGuarda(st) }); }
    // (host di riserva) chi porta avanti la partita se sparisco: chi è seduto al tavolo (ha già le sue carte e il suo posto)
    var viciK = "";
    function vici() {
      var l = altri().filter(function (s) { return posti[s]; }).map(function (s) { return posti[s]; }), k = l.join(",");
      if (k !== viciK && t.vici) { viciK = k; t.vici(l.length ? l : null); }
    }
    function bcast() {
      if (chiuso) return;
      if (!st) { disegnaLobby(); return; }
      ricordaOra();
      if (st.fase === "fineround" && avKey !== st.pid + ":" + st.nMano) { avKey = st.pid + ":" + st.nMano; avanti = {}; scad = Date.now() + PAUSA_MANO * 1000; }   // riepilogo nuovo
      altri().forEach(mandaVm);
      mandaGuarda();
      if (t.aCheSiamo && st.nMano) t.aCheSiamo("mano " + st.nMano);   // (nella Sala: a che punto è, per chi è fuori)
      vici();
      Cl.setVm(conVm(vistaDa(st, MIO), MIO));
      if (st.fase !== "fine") { detto = false; return; }
      if (!detto && t.risultato) {   // per il torneo online: la squadra che vince, poi l'altra (pari = stesso posto)
        detto = true; ricordaOra();
        var v = st.punti[0] >= st.punti[1] ? 0 : 1, pari = st.punti[0] === st.punti[1];
        t.risultato([0, 1, 2, 3].map(function (k) { var x = { nome: st.nomi[k], pos: (k % 2 === v || pari) ? 1 : 3 }; if (k !== MIO && botSeat[k]) x.bot = true; return x; })
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
      }, Math.max(700 + Math.random() * 350, (Cl._dealFino || 0) - Date.now() + 250, respiroFino - Date.now()));   // i bot aspettano la fine della distribuzione
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
      if (MIO !== 0) {   // (avevo preso il posto dell'host sparito: in saletta torno al posto 0, chi era lì prende il mio)
        posti[MIO] = posti[0]; nomiUmani[MIO] = nomiUmani[0]; avatariUmani[MIO] = avatariUmani[0];
        posti[0] = nomiUmani[0] = avatariUmani[0] = null; MIO = 0;
      }
      for (var s = 1; s <= 3; s++) botSeat[s] = true;
      Cl.azzera();
      aggiornaLobby();
    }
    t.onRivincita = tornaSaletta;   // la Rivincita della Sala

    // ---- la ripresa: stessa mano (carte in mano a tutti, tavolo, prese, punti), stessi posti e stesse squadre. Gli amici
    // restano al loro posto e rientrano da soli (il join gli rimanda le sue carte); chi non torna in 30 s lascia il posto al bot
    var attesi = {};
    if (RIP && RIP.st && Array.isArray(RIP.st.mani)) {
      st = RIP.st; st.presa = null;   // (una presa che si stava guardando è già fatta: si va avanti)
      ["posti", "nomiUmani", "avatariUmani", "botSeat"].forEach(function (k) {
        var x = RIP[k] || {}, d = ({ posti: posti, nomiUmani: nomiUmani, avatariUmani: avatariUmani, botSeat: botSeat })[k];
        for (var s = 0; s <= 3; s++) d[s] = k === "botSeat" ? !!x[s] : (x[s] || null);
      });
      via = RIP.via && typeof RIP.via === "object" ? RIP.via : {};
      guarda = Array.isArray(RIP.guarda) ? RIP.guarda : [];
      diff = RIP.diff || diff; nAvviso = +RIP.nAvviso || 0; detto = !!RIP.detto;
      // chi teneva la partita (il suo posto e il suo id); se adesso la tengo io da un altro posto (host di riserva),
      // il suo posto diventa quello di un amico che rientra (o del bot) e il mio quello dove giocavo
      var mioPrima = RIP.mio >= 0 && RIP.mio <= 3 ? +RIP.mio : 0, ioPrima = RIP.io || "host";
      MIO = mioPrima;
      if (ioPrima !== IO) {
        var sMio = [0, 1, 2, 3].filter(function (s) { return posti[s] === IO; })[0];
        if (sMio != null) {
          posti[mioPrima] = ioPrima; nomiUmani[mioPrima] = st.nomi[mioPrima]; avatariUmani[mioPrima] = st.avatari[mioPrima] || null; botSeat[mioPrima] = false;
          MIO = sMio; posti[MIO] = null; nomiUmani[MIO] = avatariUmani[MIO] = null; botSeat[MIO] = false;
          Object.keys(via).forEach(function (k) { if (+k === MIO) delete via[k]; });
        } else {   // (guardavo: mi siedo al posto di chi teneva la partita e gioco le sue carte)
          guarda = guarda.filter(function (g) { return g.id !== IO; }); st.nomi[MIO] = mioNome(); st.avatari[MIO] = mioAv();
        }
      }
      altri().forEach(function (sa) { if (posti[sa]) attesi[posti[sa]] = 1; });
    }
    var cbR = {
      onCodice: function (c) { codice = c; if (!st) aggiornaLobby(); },
      onConnesso: function () { pronta = true; if (!st) aggiornaLobby(); },
      onAddio: function (id) {
        delete attesi[id];
        var g0 = guarda.length; guarda = guarda.filter(function (g) { return g.id !== id; });
        if (guarda.length !== g0 && !st) aggiornaLobby();
        var s = seatDi(id);
        if (s < 0) return;
        posti[s] = null;
        if (st) {   // il suo posto passa al bot (se torna, se lo riprende)
          var vecchio = nomiUmani[s] || st.nomi[s];
          via[s] = { id: id, nome: vecchio, omino: avatariUmani[s] };
          nomiUmani[s] = null; avatariUmani[s] = null; botSeat[s] = true;
          st.nomi[s] = null; mettiBot(s);
          avviso(vecchio + " è uscito: gioca il bot");
          bcast(); giro();
        } else { nomiUmani[s] = null; avatariUmani[s] = null; aggiornaLobby(); }
      },
      onMsg: function (id, m) {
        if (chiuso || !m || !m.t) return;
        delete attesi[id];   // (ripresa: si è rifatto vivo)
        if (m.t === "join") {
          var nomeJ = String(m.nome || "Amico").slice(0, 16);
          // nella Sala chi non è stato scelto non si siede: questa volta guarda (lo vede scritto nella saletta)
          if (seatDi(id) < 0 && t.puoSedersi && !t.puoSedersi(id, nomeJ) && !(st && Object.keys(via).some(function (k) { return via[k].id === id; }))) {
            if (!guarda.some(function (g) { return g.id === id; }) && guarda.length < 12) guarda.push({ id: id, nome: nomeJ });
            if (st) { if (rete) rete.inviaVeloce({ t: "piena", to: id, inCorso: true, guardi: true }); }
            else aggiornaLobby();
            return;
          }
          if (st) {   // a partita iniziata
            var sj = seatDi(id);
            if (sj >= 0) { mandaVm(sj); return; }   // chi rientra al suo posto si riprende le sue carte
            var kv = altri().filter(function (k) { return via[k] && via[k].id === id && !posti[k]; })[0]; if (kv != null) { rientra(kv); return; }
            if (rete) rete.inviaVeloce({ t: "piena", to: id, inCorso: true });   // nessun posto per lui: glielo dico
            return;
          }
          if (seatDi(id) < 0) {
            var s = postoLibero();
            if (s >= 0) { posti[s] = id; nomiUmani[s] = String(m.nome || "Amico").slice(0, 16); avatariUmani[s] = C().avatarValido(m.omino); }
            else { if (rete) rete.inviaVeloce({ t: "piena", to: id }); return; }
          }
          aggiornaLobby();   // trasmette la sala aggiornata a tutti gli ospiti
        } else if (m.t === "gioca" && st) { var sm = seatDi(id); if (sm >= 0) passo(sm, m.carta, m.presa); }
        else if (m.t === "avanti" && st) voto(id, m.m, m.pid);
        else if (m.t === "psst" && st) { var sp = seatDi(id); if (sp >= 0) psstDa(sp, m.k); }
      },
      // (arriva solo se il primo collegamento non riesce: a partita cominciata la rete si ricollega da sola)
      onErrore: function () { if (!chiuso && !pronta && !st) { chiuso = true; Cl.chiuso = true; erroreScopa2(t, "Problema di collegamento. Controlla la connessione e riprova."); } }
    };
    rete = SGNet.ospita("scopa2v2", cbR, st ? { ripresa: true } : null);

    function seggiLobby() {
      var nh = mioNome();
      return [{ nome: nh, id: IO, omino: mioAv() },
        posti[1] ? { nome: nomiUmani[1], id: posti[1], omino: avatariUmani[1] } : null,
        posti[2] ? { nome: nomiUmani[2], id: posti[2], omino: avatariUmani[2] } : null,
        posti[3] ? { nome: nomiUmani[3], id: posti[3], omino: avatariUmani[3] } : null];
    }
    function regoleLobby() { var imp = t.impostazioni || {}; return { traguardo: C().traguardoDa(imp), diff: imp.difficolta || diff, psst: !!imp.psst }; }
    function aggiornaLobby() {
      if (st || chiuso) return;
      ricorda(null);   // (in saletta niente da riprendere)
      var R = regoleLobby();
      if (rete) rete.invia({ t: "lobby", codice: codice, pronta: pronta, seggi: seggiLobby(), traguardo: R.traguardo, diff: R.diff, psst: R.psst, guarda: guarda });
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
      renderLobby(t, { codice: codice, pronta: pronta, sonoHost: true, myId: IO, seggi: seggiLobby(), traguardo: R.traguardo, diff: R.diff, psst: R.psst, guarda: guarda }, {
        onComincia: function () {
          var imp = t.impostazioni || {}; diff = imp.difficolta || diff;
          st = creaStato(C().traguardoDa(imp)); nomiPartenza();
          st.conPsst = !!imp.psst;   // 🤫 messaggi al compagno (⚙️)
          for (var s = 1; s <= 3; s++) botSeat[s] = !posti[s];
          nuovaMano(st);
          if (rete) rete.invia({ t: "inCorso", fase: "gioco" });   // sul server resta solo "partita in corso" (niente carte di nessuno)
          bcast(); giro();
        },
        onCambia: cambiaCompagno,
        onEsci: esci
      });
    }
    window.__SCOPA2host = { st: function () { return st; }, posti: posti, botSeat: botSeat };   // (per le prove) lo stato vero della partita su questo telefono
    if (!st) { disegnaLobby(); return; }
    // (ripresa) il tavolo com'era, a ognuno le sue carte; dopo un attimo di respiro tocca a chi toccava (il Bot riparte dal suo turno)
    if (rete) rete.invia({ t: "inCorso", fase: st.fase === "fine" ? "fine" : "gioco" });
    bcast();
    respiroFino = Date.now() + 3000; giro();
    // chi non si rifà vivo in 30 s lascia il posto al bot (come quando se ne va; se torna, se lo riprende)
    setTimeout(function () { if (!chiuso && st) Object.keys(attesi).forEach(function (id) { cbR.onAddio(id); }); }, 30000);
  }

  function ospiteScopa2(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { rete: null, myId: null, nome: "", msg: null, msg2: null, fuori: false, chiuso: false };
    // guardo soltanto (link con guarda=1): il tavolo senza carte in mano (la foto "g" dell'host), niente trofei; in basso la targhetta del core
    var GUARDA = !!t.guarda, TARGA = GUARDA && !t.eliminazione;
    function esci() { S.chiuso = true; Cl.chiuso = true; if (window.SGMusica) window.SGMusica.ferma(); if (S.rete) S.rete.chiudi(); t.esci(); }
    var Cl = creaClient(t, {
      sonoHost: false, online: true,
      guarda: GUARDA, targa: TARGA, noTrofei: GUARDA,
      onMossa: function (id, presa) { if (S.rete) S.rete.invia({ t: "gioca", carta: id, presa: presa }); },
      onVoto: function (m, pid) { if (S.rete) S.rete.invia({ t: "avanti", m: m, pid: pid }); },   // "⏩ Avanti" (vale per questa smazzata)
      onPsst: function (k) { if (S.rete) S.rete.invia({ t: "psst", k: k }); },                      // 🤫 al compagno (passa dall'host)
      onAvanti: function () {}, onNuova: function () {}, onEsci: esci
    });
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: GUARDA ? "👀" : "🃏", titolo: GUARDA ? "Guardi la Scopa 2 vs 2" : "Entra nella Scopa 2 vs 2", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
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
          if (m.t === "vm") { if (!m.vm || GUARDA) return; S.fuori = false; suonoSeNuovaPresa(m.vm); Cl.setVm(m.vm); }
          else if (m.t === "lobby") {
            if (Cl.vm) Cl.azzera();   // l'host ha fatto "Nuova partita": si torna in saletta
            S.ultVmg = null;
            // non sono al tavolo: se c'è un posto libero lo chiedo (chi era arrivato a partita cominciata entra adesso)
            var seggi = m.seggi || [], dentro = seggi.some(function (g) { return g && g.id === S.myId; });
            var guardo = GUARDA || !dentro && (m.guarda || []).some(function (g) { return g.id === S.myId; });   // nella Sala: non sono tra gli scelti (o guardo soltanto)
            S.guardo = guardo;
            if (guardo) { S.fuori = false; return mostraLobby(m); }
            if (!dentro && !seggi.slice(1).some(function (g) { return !g; })) return mostraPiena(false);
            if (!dentro && S.rete && Date.now() - (S.chiesto || 0) > 1500) { S.chiesto = Date.now(); S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : C().mioAvatar(S.nome) }); }
            S.fuori = false;
            mostraLobby(m);
          }
          else if (m.t === "piena") { if (!Cl.vm) mostraPiena(m.inCorso, m.guardi); if (m.inCorso) mostraGuarda(); }   // (a partita cominciata: guardo il tavolo)
          else if (m.t === "inCorso") {
            if (m.g) S.ultVmg = m.g;   // il tavolo per chi non è seduto (senza carte in mano)
            if (S.guardo && !Cl.vm && !GUARDA) mostraPiena(true, true);
            else if (!Cl.vm && !GUARDA && S.msg2 && document.body.contains(S.msg2)) S.msg2.textContent = "La partita è cominciata: sto entrando al tavolo…";
            mostraGuarda();
          }
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
      renderLobby(t, { codice: m.codice, pronta: m.pronta, sonoHost: false, myId: S.myId, seggi: m.seggi, traguardo: m.traguardo, diff: m.diff, psst: m.psst, guarda: m.guarda, soloGuardo: GUARDA }, { onEsci: esci });
    }
    // il tavolo per chi non è seduto (guardo soltanto, nella Sala non sono tra gli scelti, tavolo pieno a partita cominciata):
    // l'ultima foto "g" dell'host (nel suo "inCorso"), senza carte in mano. Mai sopra il tavolo di chi è seduto
    function puoGuardare() { return GUARDA || S.guardo || S.fuori === "corso" || S.fuori === "guardi"; }
    function mostraGuarda() {
      var v = S.ultVmg; if (!v || S.chiuso || !puoGuardare() || (Cl.vm && !Cl.vm.spett)) return;
      Cl.notaGuardo = S.guardo && !GUARDA ? "Questa volta guardi" : null;   // (nella Sala non sono tra gli scelti: lo dice la mensola)
      suonoSeNuovaPresa(v); Cl.setVm(v);
    }
    function mostraAttesa() {   // finché non arriva la sala dall'host
      if (Cl.vm) return;
      var s = t.schermata({ icona: GUARDA ? "👀" : "🃏", titolo: "Scopa 2 vs 2 · Sala", sotto: "Stanza " + codice.toUpperCase(), indietro: esci });
      S.msg2 = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: GUARDA ? "Collegato ✅ — arriva il tavolo…" : "Collegato ✅ — sto entrando nella stanza…" });
      s._contenuto.appendChild(S.msg2); t.mostra(s);
    }
    function mostraPiena(inCorso, guardi) {   // nessun posto per me (per ora: alla prossima partita, se c'è posto, entro da solo)
      var k = guardi ? "guardi" : inCorso ? "corso" : "piena";   // guardi: nella Sala non sono tra gli scelti
      if (S.fuori === k && S.sPiena && document.body.contains(S.sPiena)) return;   // già mostrata: niente lampeggio
      S.fuori = k;
      var s = S.sPiena = t.schermata({ icona: guardi ? "👀" : inCorso ? "⏳" : "🈵", titolo: guardi ? "Questa volta guardi" : inCorso ? "Partita già cominciata" : "Tavolo al completo", indietro: esci });
      s._contenuto.appendChild(el("p", { style: "font-size:1.05rem;line-height:1.5;text-align:center",
        text: guardi ? "Al tavolo giocano gli amici scelti. Quando finiscono si torna nella saletta tutti insieme."
          : inCorso ? "Al tavolo si sta già giocando: entri alla prossima partita, se c'è un posto libero. Resta qui!"
          : "Al tavolo ci sono già 4 giocatori: se si libera un posto entri da solo." }));
      var f = guardi && t.faccine ? t.faccine() : null; if (f) { f.style.margin = "16px auto 0"; f.style.maxWidth = "320px"; s._contenuto.appendChild(f); }   // si aspetta: le faccine
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
    function nomeSeat(i) { var g = seggi[i]; return g ? (g.id === vm.myId ? "tu" : g.nome) : "🤖 Bot"; }
    var tr = vm.traguardo == null ? TARGET : vm.traguardo, livello = { facile: "facili", medio: "medi", difficile: "difficili" }[vm.diff] || "medi";
    // (compatto: con la saletta e i tasti deve stare tutto in uno schermo da 360x640, anche in 4 col "Cambia compagno")
    var righe = [
      el("div", {}, [ el("b", { text: "🟢 " + nomeSeat(mioSeat % 2) + " + " + nomeSeat(mioSeat % 2 + 2) }), document.createTextNode(" 🆚 "),
        el("b", { text: "🔴 " + nomeSeat(1 - mioSeat % 2) + " + " + nomeSeat(3 - mioSeat % 2) }) ]),
      el("div", { style: "opacity:.8;font-size:.85em", text: (tr ? "🎯 A " + tr + " punti" : "🎯 Una mano sola") + " · Bot " + livello + (vm.psst ? " · 🤫 messaggi al compagno" : "") + (umani < 4 ? " · i posti liberi li fanno i Bot" : "") }) ];
    if (vm.sonoHost && cb.onCambia && umani > 1)
      righe.push(el("button", { class: "btn btn-fantasma", style: "margin:4px auto 0;min-height:0;padding:5px 14px;font-size:.85rem;width:auto", text: "🔀 Cambia compagno", onclick: cb.onCambia }));
    // nella Sala: chi non è stato scelto guarda (niente posto al tavolo e niente "Sono pronto")
    var guarda = vm.guarda || [], guardo = !gio.some(function (g) { return g.tu; }) && guarda.some(function (g) { return g.id === vm.myId; });
    if (guarda.length) righe.push(el("div", { style: "opacity:.8;font-size:.85em", text: "👀 Guardano: " + guarda.map(function (g) { return g.id === vm.myId ? "tu" : g.nome; }).join(", ") }));
    var squadre = el("div", { class: "modulo-nota", style: "text-align:center;line-height:1.5" }, righe);
    t.lobby({ host: vm.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 1, puoiDaSolo: true, vuoti: 4 - umani, giocatori: gio, extra: [squadre],
      nota: vm.sonoHost ? "Puoi cominciare quando vuoi: i posti vuoti li fanno i bot." : null,
      spettatore: vm.soloGuardo ? "👀 Guardi la partita" : guardo ? "👀 Questa volta guardi" : null,   // (soloGuardo: guardo soltanto, dal link)
      attesa: vm.soloGuardo ? "Guardi la partita: si comincia tra poco! 🃏" : guardo ? "Al tavolo giocano gli amici scelti: questa partita la guardi." : "Aspetta che l'host cominci: si gioca in coppia! 🃏", onComincia: cb.onComincia, onEsci: cb.onEsci });
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

  // (per le prove) il motore, senza grafica
  window.__SCOPA2 = { creaStato: creaStato, nuovaMano: nuovaMano, applica: applica, fineMano: fineMano, prossimaMano: prossimaMano, vistaDa: vistaDa, mossaBot: mossaBot, migliori: migliori, bravura: bravura, maniVuote: maniVuote };

  SG.registra({
    id: "scopa2v2",
    nome: "Scopa 2 vs 2",
    icona: "🃏",
    descrizione: "La Scopa a squadre, in quattro al tavolo: tu e il tuo compagno contro due. Contro i Bot o online, ognuno dal suo telefono (i posti vuoti li fanno i Bot).",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 3, etichettaGiocatori: "👥 1–4 giocatori",   // (i posti liberi li prendono i bot)
    postiOnline: 4,   // 4 al tavolo: nella Sala, se siete di più, gioca chi sceglie l'host e gli altri guardano
    riprende: true,    // se l'host ricarica la pagina, la mano continua (a ognuno le sue carte, i Bot ripartono dal loro turno)
    riserva: true,   // online: se l'host sparisce del tutto (telefono spento), un amico porta avanti la partita
    ritardatari: "partita",   // chi arriva a partita cominciata guarda il tavolo (senza carte) ed entra alla prossima
    modi: [{ modo: "bot", icona: "🤖", nome: "Contro i Bot", sotto: "Tu e un Bot contro due Bot" }],
    regole: [
      "Si gioca <b>in quattro, due squadre</b>: tu + il compagno (di fronte) contro due avversari. Le carte sono le 40 napoletane.",
      "Si gioca a turno alternando le squadre: <b>tu, un avversario, il tuo compagno, l'altro avversario</b>.",
      "Come la Scopa normale: tre carte in mano a testa, quattro sul tavolo, si <b>pesca</b> tre a testa quando le mani finiscono, fino a esaurire il mazzo.",
      "Prendi con una carta di <b>valore uguale</b> (se c'è) oppure con una <b>somma</b>. Svuoti il tavolo? <b>Scopa</b> (+1), tranne con l'ultima carta.",
      "Punti a fine mano, sommando i due compagni: <b>Carte, Denari, Settebello, Primiera</b> e le <b>Scope</b>. Vince la squadra che arriva per prima ai <b>punti scelti</b> (di solito " + TARGET + "; a pari punti si gioca un'altra mano). Si può giocare anche <b>una mano sola</b>.",
      "A fine mano <b>🏅 Il migliore in campo</b>: in ogni coppia la medaglia va a chi ha portato di più (scope e settebello contano di più; a pari, niente medaglia).",
      "Modalità: <b>contro i Bot</b> (tu + 3 Bot) oppure <b>online</b> (ognuno dal suo telefono; i posti liberi li giocano i Bot). Nel <b>torneo sullo stesso telefono</b> giocano fino a 4 di voi passandovi il telefono.",
      "Online, a fine mano <b>⏩ Avanti</b>: se lo tocca più di metà di chi gioca si riparte subito, se no c'è il conto alla rovescia.",
      "<b>🤫 Messaggio al compagno</b> (si accende nel ⚙️): online, se il compagno non è un Bot, il tasto 🤫 vicino alla mano manda una frase pronta («Ho il settebello», «Lascia, ci penso io»…). La legge solo il compagno; gli avversari vedono solo 🤫. Al massimo 2 a testa per mano."
    ],
    // la riga "📜 Si gioca così" che gli amici leggono in saletta
    riassunto: function (imp) {
      imp = imp || {};
      var tr = C() ? C().traguardoDa(imp) : TARGET, liv = { facile: "facili", medio: "medi", difficile: "difficili" }[imp.difficolta] || "medi";
      var p = [tr ? "a " + tr + " punti" : "una mano sola", "Bot " + liv];
      if (imp.psst) p.push("🤫 messaggi al compagno");
      return p.join(" · ");
    },
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = "bot"; dove.difficolta = "medio"; dove.torneo = !!aiuti.torneo; dove.psst = false;
      var bBot, bOnl, boxDiff, notaOnline, boxPsst;
      function sel(m) {
        dove.modo = m;
        bBot.className = "modo-chip" + (m === "bot" ? " attiva" : "");
        bOnl.className = "modo-chip" + (m === "online" ? " attiva" : "");
        notaOnline.hidden = (m !== "online");
        if (boxPsst) boxPsst.hidden = (m !== "online");
      }
      bBot = el("button", { class: "modo-chip attiva", onclick: function () { sel("bot"); } }, [
        el("span", { class: "mi", text: "🤖" }), el("div", {}, [el("div", { class: "mt", text: "Contro i Bot" }), el("div", { class: "ms", text: "Tu + 3 Bot" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { sel("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Online" }), el("div", { class: "ms", text: "Ognuno dal suo" })])]);
      if (!aiuti.modo && !aiuti.torneo) {   // (se "come giocare" l'avete già scelto prima, qui non si sceglie)
        box.appendChild(el("div", { class: "etichetta", text: "Come giocare" }));
        box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bBot, bOnl]));
      }
      if (aiuti.torneo) box.appendChild(el("p", { class: "modulo-nota", text: "Nel torneo giocate fino a 4 di voi, passandovi il telefono: i posti che avanzano li fanno i bot." }));
      boxDiff = el("div", {});   // la bravura dei bot si sceglie anche online (⚙️ Regole in saletta)
      boxDiff.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura dei Bot" }));
      var dg = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.difficolta = d[0]; [].forEach.call(dg.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: d[1] })]);
        b.style.flex = "1"; dg.appendChild(b);
      });
      boxDiff.appendChild(dg); box.appendChild(boxDiff);
      C().sceltaTraguardo(el, box, dove);   // i punti da raggiungere (anche online, ⚙️ Regole)
      if (!aiuti.torneo) {   // 🤫 Messaggio al compagno: solo online (tra due compagni veri)
        boxPsst = el("div", { hidden: aiuti.modo === "online" ? null : "hidden" });
        boxPsst.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "🤫 Messaggio al compagno" }));
        var pg = el("div", { style: "display:flex;gap:8px" });
        [[false, "No"], [true, "Sì"]].forEach(function (d) {
          var b = el("button", { class: "modo-chip" + (d[0] === !!dove.psst ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
            dove.psst = d[0]; [].forEach.call(pg.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
          } }, [el("div", { class: "mt", text: d[1] })]);
          b.style.flex = "1"; pg.appendChild(b);
        });
        boxPsst.appendChild(pg);
        boxPsst.appendChild(el("p", { class: "modulo-nota", style: "margin:4px 0 0", text: "Un tasto 🤫 manda al compagno una frase pronta (2 a mano): la legge solo lui." }));
        box.appendChild(boxPsst);
      }
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
      mont = null; memo = { prevMano: 0, prevTav: {}, avvisoN: null }; s2Posti = {}; psstF = null;   // partita nuova: niente resti di quella prima
      if (t.linkParams && t.linkParams.stanza) return ospiteScopa2(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostScopa2(t, imp.difficolta || "medio");
      return localeScopa2(t, imp.difficolta || "medio", !!imp.torneo);
    }
  });
})();

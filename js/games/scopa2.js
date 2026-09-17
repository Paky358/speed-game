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
   Modalità: contro i bot (tu + 3 bot) oppure online (ognuno dal suo
   telefono; i posti vuoti li riempiono i bot). Riusa window.SGCarte.
   ========================================================= */
(function () {
  "use strict";
  var TARGET = 11;
  // nomi di default dei posti bot, relativi al posto 0 (host/tu)
  var NOMI_BOT = { 1: "🤖 Avversario 1", 2: "🤖 Compagno", 3: "🤖 Avversario 2" };
  function C() { return window.SGCarte; }
  function team(seat) { return seat % 2; }                 // 0 = Squadra 1 (posti 0,2), 1 = Squadra 2 (posti 1,3)
  function trova(a, id) { for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function importanza(c) { return c.id === "D7" ? 12 : c.s === "D" ? 3 : c.v === 7 ? 2.2 : (c.v === 6 || c.v === 1) ? 1.6 : 1; }
  function mischia(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

  // ---------- motore (4 giocatori, 2 squadre, con pesca) ----------
  function creaStato() {
    return {
      mazzo: [], tavolo: [], mani: [[], [], [], []], prese: [[], [], [], []],
      scope: [0, 0, 0, 0], turno: 0, ultimaPresa: null, fase: "gioco", primo: 0,
      punti: [0, 0], ultimoRound: null, presa: null, messaGiu: null, nomi: {}
    };
  }
  function nuovaMano(st) {
    st.mazzo = C().creaMazzo(mischia);
    st.tavolo = st.mazzo.splice(0, 4);
    for (var s = 0; s < 4; s++) st.mani[s] = st.mazzo.splice(0, 3);
    st.prese = [[], [], [], []]; st.scope = [0, 0, 0, 0];
    st.ultimaPresa = null; st.turno = st.primo; st.fase = "gioco"; st.presa = null; st.messaGiu = null;
  }
  function pesca(st) { for (var s = 0; s < 4; s++) st.mani[s] = st.mazzo.splice(0, 3); }
  function maniVuote(st) { return !st.mani[0].length && !st.mani[1].length && !st.mani[2].length && !st.mani[3].length; }

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
    if (st.tavolo.length && st.ultimaPresa != null) { st.prese[st.ultimaPresa] = st.prese[st.ultimaPresa].concat(st.tavolo); st.tavolo = []; }
    var r = conta(st);
    st.punti[0] += r.punti[0]; st.punti[1] += r.punti[1];
    r.tot = [st.punti[0], st.punti[1]];
    st.ultimoRound = r;
    st.fase = (st.punti[0] >= TARGET || st.punti[1] >= TARGET) ? "fine" : "fineround";
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
      pCarte: pCarte, pDen: pDen, pPrim: pPrim, scope: [scopeA, scopeB], punti: [pts(0), pts(1)] };
  }

  // ---------- bot ----------
  function mossaBot(st, seat, diff) {
    var mano = st.mani[seat], tavolo = st.tavolo, mosse = [];
    mano.forEach(function (c) {
      var opts = C().catture(c.v, tavolo);
      if (opts.length) opts.forEach(function (set) { mosse.push({ carta: c.id, presa: set, cattura: true, c: c, set: set }); });
      else mosse.push({ carta: c.id, presa: null, cattura: false, c: c, set: [] });
    });
    if (!mosse.length) return null;
    if (diff === "facile") return mosse[Math.floor(Math.random() * mosse.length)];
    var prossimoAvv = (team((seat + 1) % 4) !== team(seat));
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
          if (tot <= 10 && !singoloUguale) s -= 3;
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

  // ---------- vista per il giocatore "io" (0..3) ----------
  function vistaDa(st, io) {
    var mioTeam = team(io);
    function relTeam(seat) { return team(seat) === mioTeam ? "mia" : "altra"; }
    var pr = st.ultimoRound, ultimo = null;
    if (pr) {
      // porto il risultato "relativo": mia squadra a sinistra
      var m = mioTeam, a = 1 - mioTeam;
      ultimo = {
        carte: [pr.carte[m], pr.carte[a]], den: [pr.den[m], pr.den[a]], prim: [pr.prim[m], pr.prim[a]],
        scope: [pr.scope[m], pr.scope[a]], punti: [pr.punti[m], pr.punti[a]], tot: [pr.tot[m], pr.tot[a]],
        sette: pr.sette == null ? null : (pr.sette === m ? "mia" : "altra"),
        pCarte: pr.pCarte == null ? null : (pr.pCarte === m ? "mia" : "altra"),
        pDen: pr.pDen == null ? null : (pr.pDen === m ? "mia" : "altra"),
        pPrim: pr.pPrim == null ? null : (pr.pPrim === m ? "mia" : "altra")
      };
    }
    var preseMioTeam = st.prese[io].concat(st.prese[(io + 2) % 4]);
    return {
      fase: st.fase, io: io, turno: st.turno,
      nomi: [st.nomi[0], st.nomi[1], st.nomi[2], st.nomi[3]],
      nCarte: [st.mani[0].length, st.mani[1].length, st.mani[2].length, st.mani[3].length],
      mano: st.mani[io].slice(), tavolo: st.tavolo.slice(), mazzoN: st.mazzo.length,
      punti: { mia: st.punti[mioTeam], altra: st.punti[1 - mioTeam] },
      preseMia: preseMioTeam.length, setteMia: !!trova(preseMioTeam, "D7"), scopeMia: st.scope[io] + st.scope[(io + 2) % 4],
      relTeam: { 0: relTeam(0), 1: relTeam(1), 2: relTeam(2), 3: relTeam(3) },
      messaGiu: st.messaGiu, ultimoRound: ultimo,
      presa: st.presa ? { seat: st.presa.seat, mio: st.presa.seat === io, carta: st.presa.carta, presiIds: st.presa.presiIds, tavoloPrima: st.presa.tavoloPrima, scopa: st.presa.scopa } : null,
      vincitoreMio: st.fase === "fine" ? (st.punti[mioTeam] > st.punti[1 - mioTeam]) : false
    };
  }

  // ---------- client (selezione + tap + tenuta minima dell'animazione) ----------
  function creaClient(t, cb) {
    var Cl = { vm: null, sel: { carta: null, presa: [] } };
    Cl.tapMano = function (id) {
      var vm = Cl.vm; if (!vm || vm.turno !== vm.io || vm.fase !== "gioco" || vm.presa) return;
      var carta = trova(vm.mano, id); if (!carta) return;
      var opts = C().catture(carta.v, vm.tavolo);
      if (opts.length === 0) { Cl.sel = { carta: null, presa: [] }; cb.onMossa(id, null); return; }
      if (opts.length === 1) { Cl.sel = { carta: null, presa: [] }; cb.onMossa(id, opts[0]); return; }
      Cl.sel = (Cl.sel.carta === id) ? { carta: null, presa: [] } : { carta: id, presa: [] }; Cl.disegna();
    };
    Cl.tapTavolo = function (id) {
      var vm = Cl.vm; var carta = Cl.sel.carta ? trova(vm.mano, Cl.sel.carta) : null; if (!carta) return;
      var opts = C().catture(carta.v, vm.tavolo);
      var p = Cl.sel.presa.slice(); var k = p.indexOf(id); if (k >= 0) p.splice(k, 1); else p.push(id);
      if (C().validaSet(opts, p)) { var cid = Cl.sel.carta; Cl.sel = { carta: null, presa: [] }; cb.onMossa(cid, p); return; }
      if (C().prefisso(opts, p)) Cl.sel.presa = p;
      Cl.disegna();
    };
    Cl.disegna = function () { if (!Cl.vm) return; disegna(t, Cl, cb); };
    Cl._fino = 0; Cl._pend = null;
    Cl.setVm = function (vm) {
      if (!vm || vm.turno !== vm.io || vm.fase !== "gioco") Cl.sel = { carta: null, presa: [] };
      if (Cl._pend) { clearTimeout(Cl._pend); Cl._pend = null; }
      if (vm && vm.presa) { Cl._fino = Date.now() + 1050; Cl.vm = vm; Cl.disegna(); return; }
      if (vm && Cl.vm && Cl.vm.presa && Date.now() < Cl._fino) {
        Cl._pend = setTimeout(function () { Cl._pend = null; Cl.vm = vm; Cl.disegna(); }, Cl._fino - Date.now());
        return;
      }
      Cl.vm = vm; Cl.disegna();
    };
    return Cl;
  }

  // ---------- disegno (schermo fisso: si monta una volta e si aggiorna il contenuto) ----------
  var mont = null;
  function disegna(t, Cl, cb) {
    C().assicuraStile();
    var el = t.el, vm = Cl.vm;
    if (vm.fase === "fineround" || vm.fase === "fine") { mont = null; return renderFine(t, vm, cb); }
    if (window.SGMusica) window.SGMusica.avvia();
    var Lc = C().larghezza, ASP = C().ASP_CARTA;
    var centerW = Math.min(window.innerWidth || 375, 600) - 46 - 150;   // il tavolo sta fra i due Rivali laterali
    var wT = Lc(4, 4, 60, centerW), wH = Lc(3, 10, 96);   // tavolo va a capo nel feltro (fisso) · mano max 3 (grande)
    var io = vm.io, box = el("div", { style: "display:flex;flex-direction:column;min-height:calc(100vh - 108px);min-height:calc(100dvh - 108px)" });

    // intestazione: punti squadre (sx) + mazzo + tasto musica (dx)
    var mioTurno = (vm.turno === io && vm.fase === "gioco" && !vm.presa);
    var prevMano = mont ? (mont.prevMano || 0) : 0;
    var dealing = !vm.presa && vm.fase === "gioco" && vm.mano.length > prevMano;   // la mano è aumentata: si è distribuito
    var head = el("div", { style: "display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:5px" });
    head.appendChild(el("div", { style: "font-size:.82rem;font-weight:700", html: "Noi <b style='color:#69db7c'>" + vm.punti.mia + "</b> — Loro <b>" + vm.punti.altra + "</b> <span class='tenue' style='font-weight:600'>(a " + TARGET + ")</span>" }));
    if (window.SGMusica) head.appendChild(window.SGMusica.bottone(el));
    box.appendChild(head);

    // tavolo verde: Compagno in alto (di fronte), i due Rivali ai lati, carte a terra al centro
    var cartaSel = Cl.sel.carta ? trova(vm.mano, Cl.sel.carta) : null;
    var opts = cartaSel ? C().catture(cartaSel.v, vm.tavolo) : [];
    var capIds = {}; opts.forEach(function (set) { set.forEach(function (id) { capIds[id] = true; }); });
    var comp = (io + 2) % 4, latoSx = (io + 1) % 4, latoDx = (io + 3) % 4;
    var feltro = el("div", { class: "sc-feltro" });
    feltro.appendChild(el("div", { class: "sc-cima" }, [ C().posto(el, { nome: (vm.nomi[comp] || "—") + " 🤝", n: vm.nCarte[comp], turno: vm.turno === comp, mia: true }) ]));
    var fascia = el("div", { class: "sc-fascia" });
    fascia.appendChild(C().posto(el, { nome: vm.nomi[latoSx] || "—", n: vm.nCarte[latoSx], turno: vm.turno === latoSx, mia: false, lato: true }));
    var area = el("div", { class: "sc-terra" });
    var pendingPlace = null;
    if (vm.presa) {
      var dir = vm.presa.mio ? "giu" : "su";
      var tw0 = el("div", { style: "display:flex;flex-wrap:wrap;gap:4px;justify-content:center;align-content:center" });
      var presiEls = [];
      (vm.presa.tavoloPrima || vm.tavolo).forEach(function (c) { var cel = C().cartaEl(el, c, wT); if (vm.presa.presiIds.indexOf(c.id) >= 0) { cel.classList.add("sc-lascia-" + dir); presiEls.push(cel); } tw0.appendChild(cel); });
      area.appendChild(tw0);
      var gioc = C().cartaEl(el, vm.presa.carta, wT);
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
        } else { gioc.style.left = "50%"; gioc.style.top = "50%"; gioc.style.marginLeft = (-wT / 2) + "px"; gioc.style.marginTop = (-Math.round(wT * ASP) / 2) + "px"; }
        gioc.style.animation = "scGioca" + (dir === "giu" ? "Giu" : "Su") + " .95s ease-in forwards";
      };
    } else {
      var tw = el("div", { style: "display:flex;flex-wrap:wrap;gap:4px;justify-content:center;align-content:center" });
      if (!vm.tavolo.length) tw.appendChild(el("div", { class: "tenue", text: "tavolo vuoto" }));
      vm.tavolo.forEach(function (c) {
        var cap = mioTurno && cartaSel && capIds[c.id];
        var extra = (Cl.sel.presa.indexOf(c.id) >= 0) ? "presel" : (cap ? "cap" : "");
        var cel = C().cartaEl(el, c, wT, extra, cap ? function () { Cl.tapTavolo(c.id); } : null);
        if (c.id === vm.messaGiu) cel.classList.add("sc-cade");
        tw.appendChild(cel);
      });
      area.appendChild(tw);
    }
    fascia.appendChild(area);
    fascia.appendChild(C().posto(el, { nome: vm.nomi[latoDx] || "—", n: vm.nCarte[latoDx], turno: vm.turno === latoDx, mia: false, lato: true }));
    feltro.appendChild(fascia);
    if (vm.mazzoN > 0) { var deckEl = C().mazzo(el, vm.mazzoN); if (dealing) deckEl.classList.add("deal"); feltro.appendChild(deckEl); }
    box.appendChild(feltro);

    // stato (tocca a te / gioca un altro / scopa)
    if (vm.presa && vm.presa.scopa) box.appendChild(el("div", { style: "text-align:center;font-weight:900;font-size:1.1rem;margin:3px 0;color:#ffd43b", text: "SCOPA! 🧹" }));

    // la tua mano (sulla mensola di legno, ben staccata dal tavolo)
    var mensola = el("div", { class: "sc-mensola", style: "min-height:" + (Math.round(wH * ASP) + 34) + "px" });
    var manoW = el("div", { class: "sc-mano-riga" });
    vm.mano.forEach(function (c, i) {
      var extra = (Cl.sel.carta === c.id) ? "sel" : ""; if (dealing) extra += (extra ? " " : "") + "sc-deal";
      var cel = C().cartaEl(el, c, wH, extra, mioTurno ? function () { Cl.tapMano(c.id); } : null);
      if (dealing) cel.style.animationDelay = (i * 0.09) + "s"; manoW.appendChild(cel);
    });
    mensola.appendChild(manoW);
    mensola.appendChild(el("div", { class: "sc-prese", html: "prese squadra: <b>" + vm.preseMia + "</b>" + (vm.setteMia ? " · 7💰" : "") + (vm.scopeMia ? " · scope " + vm.scopeMia : "") }));
    box.appendChild(mensola);

    // piede
    var piedeNodi = [];
    if (mioTurno && cartaSel && opts.length >= 2) piedeNodi.push(el("p", { class: "modulo-nota", style: "text-align:center;margin:0", text: opts[0].length === 1 ? "Tocca la carta verde da prendere." : "Tocca le carte verdi che sommano a " + cartaSel.v + "." }));

    // montaggio: prima volta creo la schermata, poi aggiorno SOLO il contenuto (schermo fisso)
    if (mont && mont.cont && document.body.contains(mont.box)) {
      mont.cont.replaceChild(box, mont.box); mont.box = box;
      mont.piede.innerHTML = ""; piedeNodi.forEach(function (n) { mont.piede.appendChild(n); });
    } else {
      var s = t.schermata({ titoloNascosto: true,
        indietro: function () { if (window.confirm("Uscire dalla partita?")) cb.onEsci(); } });
      s._contenuto.appendChild(box); piedeNodi.forEach(function (n) { s._piede.appendChild(n); }); t.mostra(s);
      mont = { cont: s._contenuto, box: box, piede: s._piede };
    }
    mont.prevMano = vm.mano.length;
    if (pendingPlace) pendingPlace();
  }

  function renderFine(t, vm, cb) {
    var el = t.el, r = vm.ultimoRound;
    var s = t.schermata({ icona: vm.fase === "fine" ? "🏆" : "🧮",
      titolo: vm.fase === "fine" ? (vm.vincitoreMio ? "Avete vinto!" : "Hanno vinto gli altri") : "Fine mano",
      sotto: "Scopa 2 vs 2" });
    function riga(nome, a, b, vinc) {
      return el("div", { style: "display:flex;justify-content:space-between;padding:5px 8px;border-radius:8px;background:rgba(255,255,255,.05);margin-bottom:5px" }, [
        el("span", { text: nome }), el("span", { html: "<b style='color:" + (vinc === "mia" ? "#69db7c" : "inherit") + "'>" + a + "</b> — <b style='color:" + (vinc === "altra" ? "#69db7c" : "inherit") + "'>" + b + "</b>" })]);
    }
    if (r) {
      s._contenuto.appendChild(el("div", { class: "tenue", style: "text-align:center;margin-bottom:6px", text: "Noi — Loro" }));
      s._contenuto.appendChild(riga("Carte (" + r.carte[0] + " vs " + r.carte[1] + ")", r.carte[0], r.carte[1], r.pCarte));
      s._contenuto.appendChild(riga("Denari (" + r.den[0] + " vs " + r.den[1] + ")", r.den[0], r.den[1], r.pDen));
      s._contenuto.appendChild(riga("Settebello 7💰", r.sette === "mia" ? "sì" : "—", r.sette === "altra" ? "sì" : "—", r.sette));
      s._contenuto.appendChild(riga("Primiera (" + r.prim[0] + " vs " + r.prim[1] + ")", r.prim[0], r.prim[1], r.pPrim));
      s._contenuto.appendChild(riga("Scope", r.scope[0], r.scope[1], null));
      s._contenuto.appendChild(el("div", { style: "height:1px;background:rgba(255,255,255,.15);margin:8px 0" }));
      s._contenuto.appendChild(riga("Punti mano", r.punti[0], r.punti[1], null));
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:1.3rem;font-weight:800;margin-top:8px",
        html: "Noi <span style='color:#ffd43b'>" + r.tot[0] + "</span> — " + r.tot[1] + " Loro" }));
    }
    if (vm.fase === "fine") {
      if (cb.sonoHost || cb.locale) {
        s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Nuova partita", onclick: cb.onNuova }));
        s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
      } else s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa dell'host…" }));
    } else {
      if (cb.sonoHost || cb.locale) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Continua ▶", onclick: cb.onAvanti }));
      else s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa dell'host per la prossima mano…" }));
    }
    t.mostra(s);
  }

  // ========================================================
  //  LOCALE — tu (posto 0) + 3 bot
  // ========================================================
  function localeScopa2(t, diff) {
    var st = creaStato();
    st.nomi = { 0: (t.giocatori[0] || "Tu"), 1: NOMI_BOT[1], 2: NOMI_BOT[2], 3: NOMI_BOT[3] };
    nuovaMano(st);
    var Cl = creaClient(t, {
      locale: true, sonoHost: true,
      onMossa: function (id, presa) { gioco(0, id, presa); },
      onAvanti: function () { prossimaMano(st); aggiorna(); giro(); },
      onNuova: function () { st = creaStato(); st.nomi = { 0: (t.giocatori[0] || "Tu"), 1: NOMI_BOT[1], 2: NOMI_BOT[2], 3: NOMI_BOT[3] }; nuovaMano(st); aggiorna(); giro(); },
      onEsci: function () { if (window.SGMusica) window.SGMusica.ferma(); t.esci(); }
    });
    function aggiorna() { Cl.setVm(vistaDa(st, 0)); }
    function gioco(seat, id, presa) {
      var ev = applica(st, seat, id, presa); if (ev.errore) return;
      suonoPresa(ev.scopa); aggiorna(); dopo(ev);
    }
    function dopo(ev) {
      if (ev.presa && st.fase === "gioco") setTimeout(function () { st.presa = null; aggiorna(); giro(); }, ev.scopa ? 1600 : 1050);
      else { st.presa = null; giro(); }
    }
    function giro() {
      if (st.fase !== "gioco") { aggiorna(); return; }
      if (st.turno === 0) { aggiorna(); return; }
      setTimeout(function () {
        if (st.fase !== "gioco" || st.turno === 0) { aggiorna(); return; }
        var m = mossaBot(st, st.turno, diff); if (!m) return; gioco(st.turno, m.carta, m.presa);
      }, 700 + Math.random() * 350);
    }
    aggiorna();
    if (st.turno !== 0) giro();
  }

  // ========================================================
  //  ONLINE — host = posto 0; gli ospiti prendono i posti 1,2,3
  //  (in ordine di arrivo). I posti vuoti alla partenza = bot.
  // ========================================================
  function hostScopa2(t, diff) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var st = null, rete = null, codice = "…", pronta = false;
    // posti[1..3]: {id} se umano collegato, null se libero. Il posto 0 è l'host.
    var posti = { 1: null, 2: null, 3: null };
    var nomiUmani = { 1: null, 2: null, 3: null };
    var botSeat = { 0: false, 1: true, 2: true, 3: true };  // chi è gestito dal computer durante la partita

    var Cl = creaClient(t, {
      sonoHost: true,
      onMossa: function (id, presa) { if (st) passo(0, id, presa); },
      onAvanti: function () { if (st) { prossimaMano(st); bcast(); giro(); } },
      onNuova: function () { st = creaStato(); nomiPartenza(); nuovaMano(st); bcast(); giro(); },
      onEsci: function () { if (window.SGMusica) window.SGMusica.ferma(); if (rete) rete.chiudi(); t.esci(); }
    });

    // online: i bot hanno nomi NEUTRI ("🤖 Bot N") — la squadra la mostrano il colore e il 🤝,
    // così nessun ospite viene ingannato (un bot "Compagno" dell'host è avversario per un altro).
    function botNome(s) { return "🤖 Bot " + s; }
    function nomiPartenza() {
      st.nomi = { 0: (t.giocatori && t.giocatori[0]) || "Host",
        1: nomiUmani[1] || botNome(1), 2: nomiUmani[2] || botNome(2), 3: nomiUmani[3] || botNome(3) };
    }
    function postoLibero() { for (var s = 1; s <= 3; s++) if (!posti[s]) return s; return 0; }
    function seatDi(id) { for (var s = 1; s <= 3; s++) if (posti[s] === id) return s; return -1; }

    function bcast() {
      if (!st) { disegnaLobby(); return; }
      // a ogni ospite mando la SUA vista; io (host) disegno la vista del posto 0
      for (var s = 1; s <= 3; s++) if (posti[s] && rete) rete.invia({ t: "vm", to: posti[s], vm: vistaDa(st, s) });
      Cl.setVm(vistaDa(st, 0));
    }
    function passo(seat, id, presa) {
      if (!st || st.turno !== seat) return;
      var ev = applica(st, seat, id, presa); if (ev.errore) return;
      suonoPresa(ev.scopa); bcast();
      if (ev.presa && st.fase === "gioco") setTimeout(function () { st.presa = null; bcast(); giro(); }, ev.scopa ? 1600 : 1050);
      else { st.presa = null; giro(); }
    }
    function giro() {
      if (!st || st.fase !== "gioco") { bcast(); return; }
      if (!botSeat[st.turno]) return;                 // tocca a un umano: aspetto la sua mossa
      setTimeout(function () {
        if (!st || st.fase !== "gioco" || !botSeat[st.turno]) { bcast(); return; }
        var m = mossaBot(st, st.turno, diff); if (!m) return; passo(st.turno, m.carta, m.presa);
      }, 700 + Math.random() * 350);
    }

    rete = SGNet.ospita("scopa2v2", {
      onCodice: function (c) { codice = c; if (!st) aggiornaLobby(); },
      onConnesso: function () { pronta = true; if (!st) aggiornaLobby(); },
      onAddio: function (id) {
        var s = seatDi(id);
        if (s > 0) {
          posti[s] = null;
          if (st) { botSeat[s] = true; st.nomi[s] = botNome(s); bcast(); giro(); }   // il suo posto passa al bot
          else { nomiUmani[s] = null; aggiornaLobby(); }
        }
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          if (seatDi(id) < 0 && !st) { var s = postoLibero(); if (s > 0) { posti[s] = id; nomiUmani[s] = String(m.nome || "Amico").slice(0, 16); } }
          aggiornaLobby();   // trasmette la sala aggiornata a tutti gli ospiti
        } else if (m.t === "gioca" && st) { var sm = seatDi(id); if (sm > 0) passo(sm, m.carta, m.presa); }
      },
      onErrore: function () { senzaRete(t); }
    });

    function quanti() { var n = 0; for (var s = 1; s <= 3; s++) if (posti[s]) n++; return n; }
    function seggiLobby() {
      return [{ nome: (t.giocatori && t.giocatori[0]) || "Host", id: "host" },
        posti[1] ? { nome: nomiUmani[1], id: posti[1] } : null,
        posti[2] ? { nome: nomiUmani[2], id: posti[2] } : null,
        posti[3] ? { nome: nomiUmani[3], id: posti[3] } : null];
    }
    function aggiornaLobby() {
      if (st) return;
      if (rete) rete.invia({ t: "lobby", codice: codice, pronta: pronta, seggi: seggiLobby() });
      disegnaLobby();
    }
    function disegnaLobby() {
      if (st) return;
      renderLobby(t, { codice: codice, pronta: pronta, sonoHost: true, myId: "host", seggi: seggiLobby() }, {
        onComincia: function () { st = creaStato(); nomiPartenza(); for (var s = 1; s <= 3; s++) botSeat[s] = !posti[s]; nuovaMano(st); bcast(); giro(); },
        onEsci: function () { if (window.SGMusica) window.SGMusica.ferma(); if (rete) rete.chiudi(); t.esci(); }
      });
    }
    disegnaLobby();
  }

  function ospiteScopa2(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { rete: null, myId: null, nome: "", msg: null, msg2: null };
    var Cl = creaClient(t, {
      sonoHost: false,
      onMossa: function (id, presa) { if (S.rete) S.rete.invia({ t: "gioca", carta: id, presa: presa }); },
      onAvanti: function () {}, onNuova: function () {}, onEsci: function () { if (window.SGMusica) window.SGMusica.ferma(); if (S.rete) S.rete.chiudi(); t.esci(); }
    });
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🃏", titolo: "Entra nella Scopa 2 vs 2", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
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
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome }); mostraAttesa();
          setTimeout(function () { if (!Cl.vm && S.msg2) S.msg2.textContent = "Non trovo la partita: controlla il codice o attendi l'host…"; }, 8000); },
        onMsg: function (m) {
          if (!m) return;
          if (m.t === "vm") { suonoSeNuovaPresa(m.vm); Cl.setVm(m.vm); }
          else if (m.t === "lobby") { if (!Cl.vm) mostraLobby(m); }
        },
        onChiuso: function () { erroreScopa2(t, "Collegamento perso. L'host potrebbe aver chiuso la partita."); },
        onErrore: function () { erroreScopa2(t, "Problema di collegamento. Riprova."); }
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
      renderLobby(t, { codice: m.codice, pronta: m.pronta, sonoHost: false, myId: S.myId, seggi: m.seggi },
        { onEsci: function () { if (window.SGMusica) window.SGMusica.ferma(); if (S.rete) S.rete.chiudi(); t.esci(); } });
    }
    function mostraAttesa() {   // placeholder finché non arriva la sala dall'host
      if (Cl.vm) return;
      var s = t.schermata({ icona: "🃏", titolo: "Scopa 2 vs 2 · Sala", sotto: "Stanza " + codice.toUpperCase(),
        indietro: function () { if (window.SGMusica) window.SGMusica.ferma(); if (S.rete) S.rete.chiudi(); t.esci(); } });
      S.msg2 = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegato ✅ — sto entrando nella stanza…" });
      s._contenuto.appendChild(S.msg2); t.mostra(s);
    }
  }

  // sala uguale per host e ospite: mostra le due squadre (relative a chi guarda) con i bot; controlli solo all'host
  function renderLobby(t, vm, cb) {
    var el = t.el;
    var s = t.schermata({ icona: "🃏", titolo: "Scopa 2 vs 2 · Sala", sotto: "Ognuno dal suo telefono",
      indietro: function () { if (window.confirm("Uscire?")) cb.onEsci(); } });
    var seggi = vm.seggi || [];
    var mioSeat = 0; for (var k = 0; k < seggi.length; k++) if (seggi[k] && seggi[k].id === vm.myId) mioSeat = k;
    if (vm.sonoHost) {
      s._contenuto.appendChild(el("div", { class: "etichetta", text: "Codice della stanza" }));
      s._contenuto.appendChild(el("div", { class: "codice-stanza", text: (vm.codice || "…").toUpperCase() }));
      if (vm.codice && vm.codice !== "…") {
        var link = SG.creaLink({ gioco: "scopa2v2", stanza: vm.codice });
        var campo = el("input", { class: "link-campo", type: "text", readonly: "readonly", value: link });
        s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", html: "🔗 Copia il link da mandare",
          onclick: function () { campo.focus(); campo.select(); try { navigator.clipboard.writeText(link); } catch (e) {} } }));
        s._contenuto.appendChild(campo);
      }
      s._contenuto.appendChild(el("div", { style: "margin:8px 0 2px;font-size:.9rem;font-weight:700;color:" + (vm.pronta ? "#69db7c" : "#ffd43b"),
        text: vm.pronta ? "🟢 Stanza pronta — manda il codice" : "🟡 Sto aprendo la stanza…" }));
    } else {
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-weight:700;color:#69db7c;margin-bottom:2px", text: "✅ Sei nella stanza " + (vm.codice || "").toUpperCase() }));
    }
    s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:12px", text: "Le squadre (i posti vuoti li giocano i bot)" }));
    [0, 1, 2, 3].forEach(function (idx) {
      var g = seggi[idx], mia = (idx % 2 === mioSeat % 2), mio = g && g.id === vm.myId;
      var chi = g ? (g.nome + (mio ? " (tu)" : "")) : "🤖 bot";
      s._contenuto.appendChild(el("div", { style: "display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:10px;margin-bottom:5px;background:" + (mio ? "rgba(255,202,58,.16)" : "rgba(255,255,255,.06)") + ";border-left:4px solid " + (mia ? "#69db7c" : "#ff8787") }, [
        el("span", { style: "font-size:.7rem;font-weight:700;color:" + (mia ? "#69db7c" : "#ff8787"), text: mia ? "NOI" : "LORO" }),
        el("span", { style: "flex:1", text: chi })
      ]));
    });
    if (vm.sonoHost) {
      s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Turni: si alternano le squadre. Puoi cominciare quando vuoi (i posti vuoti li fanno i bot)." }));
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Comincia ▶", onclick: cb.onComincia }));
    } else {
      s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa che l'host cominci…" }));
    }
    t.mostra(s);
  }

  function erroreScopa2(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
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
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 3,
    regole: [
      "Si gioca <b>in quattro, due squadre</b>: tu + il Compagno (di fronte) contro due avversari. Le carte sono le 40 napoletane.",
      "Si gioca a turno alternando le squadre: <b>tu, un avversario, il tuo compagno, l'altro avversario</b>.",
      "Come la Scopa normale: tre carte in mano a testa, quattro sul tavolo, si <b>pesca</b> tre a testa quando le mani finiscono, fino a esaurire il mazzo.",
      "Prendi con una carta di <b>valore uguale</b> (se c'è) oppure con una <b>somma</b>. Svuoti il tavolo? <b>Scopa</b> (+1), tranne con l'ultima carta.",
      "Punti a fine mano, sommando i due compagni: <b>Carte, Denari, Settebello, Primiera</b> e le <b>Scope</b>. Vince la squadra che arriva a <b>" + TARGET + "</b>.",
      "Modalità: <b>contro i bot</b> (tu + 3 bot) oppure <b>online</b> (ognuno dal suo telefono; i posti liberi li giocano i bot)."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = "bot"; dove.difficolta = "medio";
      if (aiuti.torneo) { dove.modo = "bot"; return; }
      var bBot, bOnl, boxDiff, notaOnline;
      function sel(m) {
        dove.modo = m;
        bBot.className = "modo-chip" + (m === "bot" ? " attiva" : "");
        bOnl.className = "modo-chip" + (m === "online" ? " attiva" : "");
        boxDiff.hidden = (m !== "bot"); notaOnline.hidden = (m !== "online");
      }
      bBot = el("button", { class: "modo-chip attiva", onclick: function () { sel("bot"); } }, [
        el("span", { class: "mi", text: "🤖" }), el("div", {}, [el("div", { class: "mt", text: "Contro i bot" }), el("div", { class: "ms", text: "Tu + 3 bot" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { sel("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Online" }), el("div", { class: "ms", text: "Ognuno dal suo" })])]);
      box.appendChild(el("div", { class: "etichetta", text: "Come giocare" }));
      box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bBot, bOnl]));
      boxDiff = el("div", {});
      boxDiff.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura dei bot" }));
      var dg = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.difficolta = d[0]; [].forEach.call(dg.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: d[1] })]);
        b.style.flex = "1"; dg.appendChild(b);
      });
      boxDiff.appendChild(dg); box.appendChild(boxDiff);
      notaOnline = el("div", { class: "link-avviso", hidden: "hidden" });
      notaOnline.textContent = (window.SGNet && SGNet.disponibile())
        ? "Apri una stanza e manda il codice: gli altri entrano dal loro telefono. I posti liberi li giocano i bot."
        : "Qui il collegamento non è disponibile: funziona quando il gioco è aperto dal sito pubblicato online.";
      box.appendChild(notaOnline);
    },
    avvia: function (t) {
      if (!window.SGCarte) { var s = t.schermata({ icona: "⚠️", titolo: "Un attimo" }); s._contenuto.appendChild(t.el("p", { text: "Ricarica la pagina e riprova." })); s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci })); return t.mostra(s); }
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return ospiteScopa2(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostScopa2(t, imp.difficolta || "medio");
      return localeScopa2(t, imp.difficolta || "medio");
    }
  });
})();

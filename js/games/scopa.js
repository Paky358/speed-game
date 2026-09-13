/* =========================================================
   GIOCO — "Scopa" (carte napoletane, repliche nostre in SVG)
   In due. Modalità: contro il bot (Facile/Medio/Difficile) e online
   (ognuno dal suo telefono, mano coperta; host-autoritativo su SGNet).
   Regole: si gioca una carta; se ha lo stesso valore di una carta sul
   tavolo la prende (se c'è un valore uguale singolo si prende quello,
   niente somme); altrimenti può prendere una somma di più carte. Se
   svuoti il tavolo fai "Scopa" (+1), tranne con l'ultima carta. A fine
   mazzo le carte restano vanno all'ultimo che ha preso. Punti a fine
   smazzata: Carte, Denari, Settebello (7 di denari), Primiera, + le Scope.
   Partita a 11 punti.
   ========================================================= */
(function () {
  "use strict";

  var SEMI = ["D", "C", "S", "B"];                 // Denari, Coppe, Spade, Bastoni
  var SEME_NOME = { D: "Denari", C: "Coppe", S: "Spade", B: "Bastoni" };
  var COLORE = { D: "#e0a11b", C: "#d1495b", S: "#2f6fb0", B: "#2e8b57" };
  var FIG = { 8: "💂", 9: "🐎", 10: "👑" };         // Fante, Cavallo, Re
  var PRIM = { 1: 16, 2: 12, 3: 13, 4: 14, 5: 15, 6: 18, 7: 21, 8: 10, 9: 10, 10: 10 };
  var TARGET = 11;

  function altro(k) { return k === "A" ? "B" : "A"; }
  function trova(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }

  // ---------- logica pura ----------
  function creaMazzo(mischia) {
    var m = [];
    SEMI.forEach(function (s) { for (var v = 1; v <= 10; v++) m.push({ s: s, v: v, id: s + v }); });
    return mischia ? mischia(m) : m;
  }
  // prese possibili per un valore: insiemi di ID. Se c'è un singolo uguale, SOLO singoli.
  function catture(val, tavolo) {
    var singoli = [];
    tavolo.forEach(function (c) { if (c.v === val) singoli.push([c.id]); });
    if (singoli.length) return singoli;
    var combos = [], n = tavolo.length;
    for (var mask = 1; mask < (1 << n); mask++) {
      var s = 0, set = [];
      for (var i = 0; i < n; i++) if (mask & (1 << i)) { s += tavolo[i].v; set.push(tavolo[i].id); }
      if (s === val && set.length >= 2) combos.push(set);
    }
    return combos;
  }
  function primiera(cards) {
    var best = { D: 0, C: 0, S: 0, B: 0 };
    cards.forEach(function (c) { if (PRIM[c.v] > best[c.s]) best[c.s] = PRIM[c.v]; });
    return best.D + best.C + best.S + best.B;
  }
  function contaPunti(A, B) {
    function den(x) { var n = 0; x.forEach(function (c) { if (c.s === "D") n++; }); return n; }
    var carteA = A.length, carteB = B.length, denA = den(A), denB = den(B);
    var sette = trova(A, "D7") ? "A" : (trova(B, "D7") ? "B" : null);
    var primA = primiera(A), primB = primiera(B);
    return {
      carteA: carteA, carteB: carteB, puntoCarte: carteA > carteB ? "A" : carteB > carteA ? "B" : null,
      denA: denA, denB: denB, puntoDenari: denA > denB ? "A" : denB > denA ? "B" : null,
      settebello: sette,
      primA: primA, primB: primB, puntoPrimiera: primA > primB ? "A" : primB > primA ? "B" : null
    };
  }
  function puntiRound(p, scope, chi) {
    return scope[chi]
      + (p.puntoCarte === chi ? 1 : 0)
      + (p.puntoDenari === chi ? 1 : 0)
      + (p.settebello === chi ? 1 : 0)
      + (p.puntoPrimiera === chi ? 1 : 0);
  }

  // ---------- motore di partita (host-autoritativo / locale) ----------
  function creaMotore(nomi, mischia) {
    var st = {
      mazzo: [], tavolo: [], mani: { A: [], B: [] }, prese: { A: [], B: [] },
      scope: { A: 0, B: 0 }, turno: "A", ultimaPresa: null,
      fase: "gioco", primo: "A", punti: { A: 0, B: 0 }, nomi: nomi,
      ultimoRound: null, presa: null
    };
    function nuovoRound() {
      st.mazzo = creaMazzo(mischia);
      st.tavolo = st.mazzo.splice(0, 4);
      st.mani.A = st.mazzo.splice(0, 3);
      st.mani.B = st.mazzo.splice(0, 3);
      st.prese.A = []; st.prese.B = []; st.scope.A = 0; st.scope.B = 0;
      st.ultimaPresa = null; st.turno = st.primo; st.fase = "gioco"; st.presa = null;
    }
    function distribuisci() { // 3 a testa quando le mani sono vuote e il mazzo ha carte
      st.mani.A = st.mazzo.splice(0, 3);
      st.mani.B = st.mazzo.splice(0, 3);
    }
    // ritorna un evento: {presa:bool, scopa:bool, chi} oppure {errore:true}
    function gioca(pk, cartaId, presaIds) {
      if (st.fase !== "gioco" || pk !== st.turno) return { errore: true };
      var carta = trova(st.mani[pk], cartaId);
      if (!carta) return { errore: true };
      var opts = catture(carta.v, st.tavolo);
      var ev = { presa: false, scopa: false, chi: pk };
      st.presa = null;
      // togli la carta dalla mano
      st.mani[pk] = st.mani[pk].filter(function (c) { return c.id !== cartaId; });
      if (opts.length) {
        // DEVE prendere: valida il set scelto (o prendi il primo se non specificato/valido)
        var set = presaIds && validaSet(opts, presaIds) ? presaIds : opts[0];
        var presi = set.map(function (id) { return trova(st.tavolo, id); }).filter(Boolean);
        st.tavolo = st.tavolo.filter(function (c) { return set.indexOf(c.id) < 0; });
        st.prese[pk] = st.prese[pk].concat(presi, [carta]);
        st.ultimaPresa = pk; ev.presa = true;
        var ultimissima = (st.mazzo.length === 0 && st.mani.A.length === 0 && st.mani.B.length === 0);
        if (st.tavolo.length === 0 && !ultimissima) { st.scope[pk]++; ev.scopa = true; }
        st.presa = { chi: pk, carta: carta, presi: presi, scopa: ev.scopa }; // per mostrare cosa è stato preso
      } else {
        st.tavolo.push(carta); // niente presa: la carta resta sul tavolo (già visibile)
      }
      st.turno = altro(pk);
      // fine mano? (mani vuote)
      if (st.mani.A.length === 0 && st.mani.B.length === 0) {
        if (st.mazzo.length > 0) distribuisci();
        else fineRound();
      }
      return ev;
    }
    function fineRound() {
      // le carte rimaste sul tavolo vanno all'ultimo che ha preso
      if (st.tavolo.length && st.ultimaPresa) { st.prese[st.ultimaPresa] = st.prese[st.ultimaPresa].concat(st.tavolo); st.tavolo = []; }
      var p = contaPunti(st.prese.A, st.prese.B);
      var pa = puntiRound(p, st.scope, "A"), pb = puntiRound(p, st.scope, "B");
      st.punti.A += pa; st.punti.B += pb;
      st.ultimoRound = { p: p, scope: { A: st.scope.A, B: st.scope.B }, guad: { A: pa, B: pb }, tot: { A: st.punti.A, B: st.punti.B } };
      if (st.punti.A >= TARGET || st.punti.B >= TARGET) st.fase = "fine";
      else st.fase = "fineround";
    }
    function prossimoRound() {
      if (st.fase !== "fineround") return;
      st.primo = altro(st.primo);
      nuovoRound();
    }
    nuovoRound();
    return {
      st: st, gioca: gioca, prossimoRound: prossimoRound,
      catture: function (val) { return catture(val, st.tavolo); }
    };
  }
  function validaSet(opts, set) {
    for (var i = 0; i < opts.length; i++) if (stessoSet(opts[i], set)) return true;
    return false;
  }
  function stessoSet(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (b.indexOf(a[i]) < 0) return false; return true; }
  function prefisso(opts, set) { // set è sottoinsieme di qualche opt
    for (var i = 0; i < opts.length; i++) { var ok = true; for (var j = 0; j < set.length; j++) if (opts[i].indexOf(set[j]) < 0) { ok = false; break; } if (ok) return true; }
    return false;
  }

  // ---------- bot ----------
  function importanza(c) { return c.id === "D7" ? 12 : c.s === "D" ? 3 : c.v === 7 ? 2.2 : c.v === 6 ? 1.6 : c.v === 1 ? 1.6 : 1; }
  function valoreTavolo(t) { var s = 0; t.forEach(function (c) { s += importanza(c); }); return s; }
  function scegliMossaBot(mano, tavolo, diff) {
    var mosse = [];
    mano.forEach(function (c) {
      var opts = catture(c.v, tavolo);
      if (opts.length) opts.forEach(function (set) { mosse.push({ carta: c.id, presa: set, cattura: true, c: c, set: set }); });
      else mosse.push({ carta: c.id, presa: null, cattura: false, c: c, set: [] });
    });
    if (diff === "facile") return mosse[Math.floor(Math.random() * mosse.length)];
    function punteggio(m) {
      var s = 0;
      if (m.cattura) {
        s += importanza(m.c);
        m.set.forEach(function (id) { s += importanza(trova(tavolo, id)); });
        var restano = tavolo.length - m.set.length;
        if (restano === 0) s += 6; // scopa
        if (diff === "difficile") {
          // dopo la presa il tavolo è vuoto: se non è scopa, ok. Rischio: n/a qui.
        }
      } else {
        // scarto: perdo un po', meglio buttare la carta meno utile
        s -= importanza(m.c) * 0.6;
        if (diff === "difficile") {
          // evita di lasciare il tavolo a un totale "pulibile" con una sola carta (rischio scopa avversaria)
          var tot = 0; tavolo.forEach(function (x) { tot += x.v; }); tot += m.c.v;
          var singoloUguale = tavolo.some(function (x) { return x.v === m.c.v; });
          if (tot <= 10 && !singoloUguale) s -= 3; // l'avversario potrebbe fare scopa
        }
      }
      return s;
    }
    var best = mosse[0], bs = -1e9;
    mosse.forEach(function (m) { var s = punteggio(m) + Math.random() * 0.2; if (s > bs) { bs = s; best = m; } });
    return best;
  }

  // ---------- carte (SVG nostro) ----------
  function assicuraStile() {
    if (document.getElementById("sg-scopa-css")) return;
    var st = document.createElement("style");
    st.id = "sg-scopa-css";
    st.textContent = [
      ".sc-carta{position:relative;display:inline-block;border-radius:9px;box-shadow:0 2px 6px rgba(0,0,0,.45);line-height:0}",
      ".sc-carta svg{display:block;border-radius:9px}",
      ".sc-carta.sel{outline:3px solid #ffd43b;outline-offset:2px;transform:translateY(-10px)}",
      ".sc-carta.cap{outline:3px solid #69db7c;outline-offset:2px;cursor:pointer}",
      ".sc-carta.presel{outline:3px solid #4dabf7;outline-offset:2px}",
      ".sc-dorso{border-radius:9px;box-shadow:0 2px 6px rgba(0,0,0,.45);background:#b3161d;background-image:radial-gradient(circle at 3px 3px,rgba(255,235,180,.35) 1.1px,transparent 1.6px);background-size:8px 8px;border:2px solid #f2e2be;box-sizing:border-box;display:inline-block}",
      "@keyframes scScopaFlash{0%{opacity:0;transform:scale(.6)}30%{opacity:1;transform:scale(1.05)}80%{opacity:1}100%{opacity:0}}",
      ".sc-flash{animation:scScopaFlash 1.2s ease-out forwards}"
    ].join("");
    document.head.appendChild(st);
    var defs = document.createElement("div");
    defs.style.cssText = "position:absolute;width:0;height:0;overflow:hidden"; defs.setAttribute("aria-hidden", "true");
    defs.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"><defs>' +
      '<radialGradient id="scgD" cx="40%" cy="34%" r="70%"><stop offset="0" stop-color="#ffe9a3"/><stop offset="1" stop-color="#cf9310"/></radialGradient>' +
      '<linearGradient id="scgS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dce7f2"/><stop offset=".55" stop-color="#aebccc"/><stop offset="1" stop-color="#7f95ac"/></linearGradient>' +
      '<linearGradient id="scgB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c0925a"/><stop offset="1" stop-color="#6a4423"/></linearGradient>' +
      simbolo("D") + simbolo("C") + simbolo("S") + simbolo("B") + '</defs></svg>';
    document.body.appendChild(defs);
  }
  // simbolo del seme in un box 24x24, ispirato alle carte napoletane vere
  function simbolo(s) {
    var g;
    if (s === "D") // moneta d'oro
      g = '<circle cx="12" cy="12" r="10.3" fill="url(#scgD)" stroke="#8a6a1e" stroke-width="1.1"/>' +
        '<circle cx="12" cy="12" r="6.6" fill="none" stroke="#8a6a1e" stroke-width=".9"/>' +
        '<path d="M12 7.3l1.55 3.14 3.46.5-2.5 2.44.59 3.45L12 18.66l-3.1 1.63.59-3.45-2.5-2.44 3.46-.5z" fill="#8a6a1e"/>';
    else if (s === "C") // calice dorato con bordo rosso, fascia verde e manici
      g = '<path d="M6.5 8Q2.6 8.5 4.4 12.6" fill="none" stroke="#cf9310" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M17.5 8Q21.4 8.5 19.6 12.6" fill="none" stroke="#cf9310" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M5.4 6H18.6Q18.6 12.3 12 13.7Q5.4 12.3 5.4 6Z" fill="url(#scgD)" stroke="#8a6a1e" stroke-width=".6"/>' +
        '<rect x="4.7" y="3.9" width="14.6" height="2.7" rx="1.3" fill="#c62828" stroke="#8a1f1f" stroke-width=".3"/>' +
        '<path d="M6.4 8.8Q12 10.8 17.6 8.8" fill="none" stroke="#2e8b3d" stroke-width="1.6"/>' +
        '<rect x="10.7" y="13.5" width="2.6" height="4.4" fill="url(#scgD)"/>' +
        '<path d="M6.8 20.6Q12 17.9 17.2 20.6Q12 22 6.8 20.6Z" fill="url(#scgD)" stroke="#8a6a1e" stroke-width=".4"/>';
    else if (s === "S") // sciabola curva d'acciaio con elsa dorata
      g = '<path d="M11.3 18.6Q6.3 12.8 8.7 4.3Q9.2 2.7 10.8 3.2Q9.7 11 13.6 17.8Z" fill="url(#scgS)" stroke="#5f7386" stroke-width=".6"/>' +
        '<rect x="7.4" y="17.6" width="9.2" height="2.2" rx="1.1" fill="#cf9310" stroke="#8a6a1e" stroke-width=".35"/>' +
        '<rect x="10.9" y="19.6" width="2.7" height="3.4" rx="1.1" fill="#6a4a2a"/>';
    else // bastone di legno con nodi
      g = '<path d="M9.7 21.6Q8.2 13 10.4 4.9Q11 2.9 13 3.7Q14.8 13 14.3 21.6Q12 22.7 9.7 21.6Z" fill="url(#scgB)" stroke="#5a3d20" stroke-width=".6"/>' +
        '<circle cx="11.7" cy="3.7" r="1.8" fill="url(#scgB)" stroke="#5a3d20" stroke-width=".45"/>' +
        '<path d="M10.1 8.6 7.5 7.4" stroke="#5a3d20" stroke-width="1.2" stroke-linecap="round"/>' +
        '<path d="M13.7 11.2 16.4 10.1" stroke="#5a3d20" stroke-width="1.2" stroke-linecap="round"/>' +
        '<path d="M10.3 13.8 7.9 13.1" stroke="#5a3d20" stroke-width="1.2" stroke-linecap="round"/>' +
        '<path d="M11.6 6Q11.1 13.5 11.8 20.6" stroke="rgba(255,244,214,.5)" stroke-width=".9" fill="none"/>';
    return '<symbol id="scSeme' + s + '" viewBox="0 0 24 24">' + g + '</symbol>';
  }
  // posizioni dei "pips" (cx, cy, dimensione) su una carta 100x150, come sulle carte vere
  var PIPS = {
    1: [[50, 76, 54]],
    2: [[50, 50, 42], [50, 102, 42]],
    3: [[50, 40, 36], [50, 76, 36], [50, 112, 36]],
    4: [[34, 52, 34], [66, 52, 34], [34, 100, 34], [66, 100, 34]],
    5: [[34, 50, 31], [66, 50, 31], [50, 76, 33], [34, 102, 31], [66, 102, 31]],
    6: [[34, 48, 30], [66, 48, 30], [34, 76, 30], [66, 76, 30], [34, 104, 30], [66, 104, 30]],
    7: [[34, 45, 26], [66, 45, 26], [50, 61, 26], [34, 77, 26], [66, 77, 26], [34, 108, 26], [66, 108, 26]]
  };
  function uso(s, cx, cy, sz) { return '<use href="#scSeme' + s + '" xlink:href="#scSeme' + s + '" x="' + (cx - sz / 2) + '" y="' + (cy - sz / 2) + '" width="' + sz + '" height="' + sz + '"/>'; }
  function cartaSVG(carta, w) {
    var h = Math.round(w * 1.5), col = COLORE[carta.s], v = carta.v, s = carta.s, centro = "";
    if (v >= 8) {
      centro = '<rect x="20" y="32" width="60" height="86" rx="7" fill="rgba(0,0,0,.03)" stroke="' + col + '" stroke-width="1.4" opacity=".7"/>' +
        uso(s, 50, 55, 46) +                                                                  // seme MOLTO GRANDE (si capisce al volo)
        '<text x="50" y="112" font-size="28" text-anchor="middle">' + FIG[v] + '</text>';     // figura (Fante/Cavallo/Re)
    } else { (PIPS[v] || []).forEach(function (p) { centro += uso(s, p[0], p[1], p[2]); }); }
    function angolo() { return '<text x="8" y="22" font-size="21" font-weight="800" fill="' + col + '" font-family="Georgia,serif">' + v + '</text>' + uso(s, 13.5, 31, 13); }
    return '<svg viewBox="0 0 100 150" width="' + w + '" height="' + h + '" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
      '<rect x="1.2" y="1.2" width="97.6" height="147.6" rx="10" fill="#fbf5e6" stroke="#c8b273" stroke-width="2"/>' +
      '<rect x="5" y="5" width="90" height="140" rx="7" fill="none" stroke="' + col + '" stroke-width="1" opacity=".4"/>' +
      centro + angolo() + '<g transform="rotate(180 50 75)">' + angolo() + '</g></svg>';
  }
  function cartaEl(el, carta, w, extra, onclick) {
    var d = el("div", { class: "sc-carta" + (extra ? " " + extra : ""), onclick: onclick || null });
    d.innerHTML = cartaSVG(carta, w);
    return d;
  }
  function dorsoEl(el, w) { var h = Math.round(w * 1.5); return el("div", { class: "sc-dorso", style: "width:" + w + "px;height:" + h + "px" }); }

  // ---------- vista (uguale per bot/host/ospite) ----------
  // vm = { fase, io("A"|"B"), turno, nomi, mano:[carte], oppN, tavolo:[carte],
  //        preseIo, preseOpp, scopeIo, scopeOpp, settebelloIo, settebelloOpp,
  //        punti:{io,opp}, ultimoRound, presa:{mio,carta,presi,scopa}|null, vincitoreIo }
  // C = { vm, sel:{carta,presa}, ridisegna } ; cb = { onMossa(id,presa|null), onAvanti, onEsci, sonoHost, lobby... }
  function renderScopa(t, C, cb) {
    assicuraStile();
    var el = t.el, vm = C.vm;
    var s = t.schermata({ icona: "🃏", titolo: "Scopa", sotto: vm.nomi.io + " vs " + vm.nomi.opp,
      indietro: function () { if (window.confirm("Uscire dalla partita?")) cb.onEsci(); } });
    var box = el("div", { style: "display:flex;flex-direction:column;min-height:calc(100vh - 155px);min-height:calc(100dvh - 155px)" });

    // ---- avversario (in alto) ----
    var oppMano = el("div", { style: "display:flex;gap:3px" });
    for (var i = 0; i < vm.oppN; i++) oppMano.appendChild(dorsoEl(el, 22));
    box.appendChild(el("div", { style: "display:flex;align-items:center;gap:8px;justify-content:space-between" }, [
      el("div", { style: "display:flex;align-items:center;gap:8px" }, [ el("div", { style: "font-weight:700", text: vm.nomi.opp }), oppMano ]),
      el("div", { class: "tenue", style: "font-size:.78rem;text-align:right", html: "prese <b>" + vm.preseOpp + "</b>" + (vm.settebelloOpp ? " · 7💰" : "") + (vm.scopeOpp ? " · scope " + vm.scopeOpp : "") })
    ]));
    box.appendChild(el("div", { style: "font-size:.76rem;margin-top:3px", html: "Punti — <b>" + vm.nomi.io + " " + vm.punti.io + "</b> · " + vm.nomi.opp + " " + vm.punti.opp + " (a " + TARGET + ")" }));

    // ---- stato / banner della presa ----
    var mioTurno = (vm.turno === vm.io && vm.fase === "gioco" && !vm.presa);
    if (vm.presa) {
      var pr = vm.presa;
      var ban = el("div", { class: pr.scopa ? "sc-flash" : "", style: "margin:6px 0;padding:8px 6px;border-radius:12px;background:rgba(105,219,124,.16);border:1px solid rgba(105,219,124,.55)" });
      ban.appendChild(el("div", { style: "text-align:center;font-weight:800;margin-bottom:6px;color:" + (pr.scopa ? "#ffd43b" : "#8ce0a0"), text: (pr.mio ? "Prendi tu" : vm.nomi.opp + " prende") + (pr.scopa ? " — SCOPA! 🧹" : "") }));
      var row = el("div", { style: "display:flex;gap:6px;justify-content:center;align-items:center;flex-wrap:wrap" });
      row.appendChild(cartaEl(el, pr.carta, 42));
      row.appendChild(el("span", { style: "font-size:1.4rem;font-weight:800;color:#8ce0a0", text: "→" }));
      pr.presi.forEach(function (c) { row.appendChild(cartaEl(el, c, 42)); });
      ban.appendChild(row);
      box.appendChild(ban);
    } else {
      box.appendChild(el("div", { style: "text-align:center;font-weight:800;font-size:1.1rem;margin:8px 0", text: mioTurno ? "Tocca a te" : "Tocca a " + vm.nomi.opp }));
    }

    // ---- tavolo (centrato, occupa lo spazio) ----
    var cartaSel = C.sel.carta ? trova(vm.mano, C.sel.carta) : null;
    var opts = cartaSel ? catture(cartaSel.v, vm.tavolo) : [];
    var capIds = {}; opts.forEach(function (set) { set.forEach(function (id) { capIds[id] = true; }); });
    var tw = el("div", { style: "display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-content:center" });
    if (!vm.tavolo.length) tw.appendChild(el("div", { class: "tenue", text: "tavolo vuoto" }));
    vm.tavolo.forEach(function (c) {
      var extra = "";
      if (C.sel.presa.indexOf(c.id) >= 0) extra = "presel";
      else if (mioTurno && cartaSel && capIds[c.id]) extra = "cap";
      tw.appendChild(cartaEl(el, c, 70, extra, (mioTurno && cartaSel && capIds[c.id]) ? function () { C.tapTavolo(c.id); } : null));
    });
    box.appendChild(el("div", { style: "flex:1;display:flex;align-items:center;justify-content:center;padding:8px 0" }, [tw]));

    // ---- la mia mano (in basso) ----
    var manoW = el("div", { style: "display:flex;gap:12px;justify-content:center;align-items:flex-end" });
    vm.mano.forEach(function (c) {
      manoW.appendChild(cartaEl(el, c, 88, (C.sel.carta === c.id) ? "sel" : "", mioTurno ? function () { C.tapMano(c.id); } : null));
    });
    box.appendChild(manoW);
    box.appendChild(el("div", { class: "tenue", style: "text-align:center;font-size:.78rem;margin-top:6px",
      html: "le tue prese <b>" + vm.preseIo + "</b>" + (vm.settebelloIo ? " · 7💰" : "") + (vm.scopeIo ? " · scope " + vm.scopeIo : "") }));
    s._contenuto.appendChild(box);

    // ---- suggerimento (nel piede) ----
    if (mioTurno && cartaSel && opts.length >= 2) {
      s._piede.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: opts[0].length === 1 ? "Più prese possibili: tocca la carta verde che vuoi prendere." : "Tocca le carte verdi che sommano a " + cartaSel.v + "." }));
    } else if (mioTurno) {
      s._piede.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: "Tocca una tua carta per giocarla." }));
    } else if (vm.fase === "gioco") {
      s._piede.appendChild(el("p", { class: "modulo-nota", style: "text-align:center", text: "Aspetta il tuo turno…" }));
    }
    t.mostra(s);
  }

  // riepilogo di fine smazzata / fine partita
  function renderFine(t, C, cb) {
    var el = t.el, vm = C.vm, r = vm.ultimoRound;
    var s = t.schermata({ icona: vm.fase === "fine" ? "🏆" : "🧮",
      titolo: vm.fase === "fine" ? (vm.vincitoreIo ? "Hai vinto!" : "Ha vinto " + vm.nomi.opp) : "Fine smazzata",
      sotto: "Scopa · " + vm.nomi.io + " vs " + vm.nomi.opp });
    function riga(nome, a, b, vinc) {
      return el("div", { style: "display:flex;justify-content:space-between;padding:5px 8px;border-radius:8px;background:rgba(255,255,255,.05);margin-bottom:5px" }, [
        el("span", { text: nome }),
        el("span", { html: "<b style='color:" + (vinc === "io" ? "#69db7c" : "inherit") + "'>" + a + "</b> — <b style='color:" + (vinc === "opp" ? "#69db7c" : "inherit") + "'>" + b + "</b>" })
      ]);
    }
    if (r) {
      var p = r.p;
      // "io" = A o B a seconda della prospettiva
      var io = vm.io, opp = altro(io);
      function perLato(x) { return x === io ? "io" : x === opp ? "opp" : null; }
      s._contenuto.appendChild(el("div", { class: "tenue", style: "text-align:center;margin-bottom:6px", text: vm.nomi.io + " — " + vm.nomi.opp }));
      s._contenuto.appendChild(riga("Carte (" + (io === "A" ? p.carteA : p.carteB) + " vs " + (io === "A" ? p.carteB : p.carteA) + ")", io === "A" ? p.carteA : p.carteB, io === "A" ? p.carteB : p.carteA, perLato(p.puntoCarte)));
      s._contenuto.appendChild(riga("Denari (" + (io === "A" ? p.denA : p.denB) + " vs " + (io === "A" ? p.denB : p.denA) + ")", io === "A" ? p.denA : p.denB, io === "A" ? p.denB : p.denA, perLato(p.puntoDenari)));
      s._contenuto.appendChild(riga("Settebello 7💰", p.settebello === io ? "sì" : "—", p.settebello === opp ? "sì" : "—", perLato(p.settebello)));
      s._contenuto.appendChild(riga("Primiera (" + (io === "A" ? p.primA : p.primB) + " vs " + (io === "A" ? p.primB : p.primA) + ")", io === "A" ? p.primA : p.primB, io === "A" ? p.primB : p.primA, perLato(p.puntoPrimiera)));
      s._contenuto.appendChild(riga("Scope", io === "A" ? r.scope.A : r.scope.B, io === "A" ? r.scope.B : r.scope.A, null));
      s._contenuto.appendChild(el("div", { style: "height:1px;background:rgba(255,255,255,.15);margin:8px 0" }));
      s._contenuto.appendChild(riga("Punti smazzata", io === "A" ? r.guad.A : r.guad.B, io === "A" ? r.guad.B : r.guad.A, null));
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-size:1.3rem;font-weight:800;margin-top:8px",
        html: vm.nomi.io + " <span style='color:#ffd43b'>" + (io === "A" ? r.tot.A : r.tot.B) + "</span> — " + (io === "A" ? r.tot.B : r.tot.A) + " " + vm.nomi.opp }));
    }
    if (vm.fase === "fine") {
      if (cb.sonoHost || cb.locale) {
        s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Nuova partita", onclick: cb.onNuova }));
        s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
      } else s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa dell'host…" }));
    } else {
      if (cb.sonoHost || cb.locale) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "Continua ▶", onclick: cb.onAvanti }));
      else s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa dell'host per la prossima smazzata…" }));
    }
    t.mostra(s);
  }

  // client condiviso: tiene vm + selezione, gestisce i tap, chiama cb.onMossa
  function creaClient(t, cb) {
    var C = { vm: null, sel: { carta: null, presa: [] } };
    C.tapMano = function (id) {
      var carta = trova(C.vm.mano, id); if (!carta) return;
      var opts = catture(carta.v, C.vm.tavolo);
      if (opts.length === 0) { C.sel = { carta: null, presa: [] }; cb.onMossa(id, null); return; }   // niente presa: metti giù subito
      if (opts.length === 1) { C.sel = { carta: null, presa: [] }; cb.onMossa(id, opts[0]); return; }  // una sola presa: prendi subito
      C.sel = (C.sel.carta === id) ? { carta: null, presa: [] } : { carta: id, presa: [] };            // più prese: scegli
      C.disegna();
    };
    C.tapTavolo = function (id) {
      var carta = trova(C.vm.mano, C.sel.carta); if (!carta) return;
      var opts = catture(carta.v, C.vm.tavolo);
      var p = C.sel.presa.slice(); var k = p.indexOf(id); if (k >= 0) p.splice(k, 1); else p.push(id);
      if (validaSet(opts, p)) { cb.onMossa(C.sel.carta, p); C.sel = { carta: null, presa: [] }; return; }
      if (prefisso(opts, p)) C.sel.presa = p; // altrimenti ignora il tap
      C.disegna();
    };
    C.disegna = function () {
      if (!C.vm) return;
      if (C.vm.fase === "gioco") renderScopa(t, C, cb);
      else renderFine(t, C, cb);
    };
    C._presaFino = 0; C._pend = null;
    C.setVm = function (vm) {
      // pulisci la selezione se non è più il mio turno
      if (!vm || vm.turno !== vm.io || vm.fase !== "gioco") C.sel = { carta: null, presa: [] };
      if (C._pend) { clearTimeout(C._pend); C._pend = null; }
      if (vm && vm.presa) {                              // arriva una presa: mostrala (durata minima garantita)
        C._presaFino = Date.now() + 1300;
        C.vm = vm; C.disegna(); return;
      }
      if (vm && C.vm && C.vm.presa && Date.now() < C._presaFino) {   // il "pulisci" è arrivato troppo presto: tieni il banner
        var tenuto = {}; for (var k in vm) tenuto[k] = vm[k]; tenuto.presa = C.vm.presa;
        C.vm = tenuto; C.disegna();
        C._pend = setTimeout(function () { C._pend = null; C.vm = vm; C.disegna(); }, C._presaFino - Date.now());
        return;
      }
      C.vm = vm; C.disegna();
    };
    return C;
  }

  // costruisce la vista per il giocatore "io" ("A" o "B") dallo stato del motore
  function vistaDa(st, io) {
    var opp = altro(io);
    return {
      fase: st.fase, io: io, turno: st.turno,
      nomi: { io: st.nomi[io], opp: st.nomi[opp] },
      mano: st.mani[io].slice(), oppN: st.mani[opp].length, tavolo: st.tavolo.slice(),
      preseIo: st.prese[io].length, preseOpp: st.prese[opp].length,
      scopeIo: st.scope[io], scopeOpp: st.scope[opp],
      settebelloIo: !!trova(st.prese[io], "D7"), settebelloOpp: !!trova(st.prese[opp], "D7"),
      punti: { io: st.punti[io], opp: st.punti[opp] },
      ultimoRound: st.ultimoRound,
      presa: st.presa ? { mio: st.presa.chi === io, carta: st.presa.carta, presi: st.presa.presi, scopa: st.presa.scopa } : null,
      vincitoreIo: st.fase === "fine" ? (st.punti[io] > st.punti[opp]) : false
    };
  }

  SG.registra({
    id: "scopa",
    nome: "Scopa",
    icona: "🃏",
    descrizione: "Il classico gioco di carte napoletane: prendi le carte del tavolo e fai scopa. Contro il bot o online, ognuno dal suo telefono.",
    giocatoriMin: 1, giocatoriMax: 2, difficolta: 3,
    regole: [
      "Si gioca <b>in due</b> con le 40 carte napoletane. Tre carte in mano a testa, quattro sul tavolo.",
      "Nel tuo turno giochi una carta: se ha lo <b>stesso valore</b> di una carta sul tavolo la <b>prendi</b>. Se non c'è un valore uguale, puoi prendere <b>più carte che sommano</b> al valore della tua.",
      "Se dopo la presa il tavolo resta <b>vuoto</b> fai <b>Scopa</b> (+1 punto), tranne con l'ultima carta.",
      "A fine mazzo le carte rimaste sul tavolo vanno all'ultimo che ha preso.",
      "Punti a fine smazzata: <b>Carte</b> (chi ne prende di più), <b>Denari</b> (più carte di denari), <b>Settebello</b> (il 7 di denari), <b>Primiera</b>, più le <b>Scope</b>. Vince chi arriva a <b>" + TARGET + "</b>.",
      "Modalità: <b>contro il bot</b> (Facile/Medio/Difficile) oppure <b>online</b>, ognuno dal suo telefono."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = "bot"; dove.difficolta = "medio";
      if (aiuti.torneo) { dove.modo = "bot"; return; } // nel torneo: contro il bot
      var bBot, bOnl, boxDiff, notaOnline;
      function sel(m) {
        dove.modo = m;
        bBot.className = "modo-chip" + (m === "bot" ? " attiva" : "");
        bOnl.className = "modo-chip" + (m === "online" ? " attiva" : "");
        boxDiff.hidden = (m !== "bot"); notaOnline.hidden = (m !== "online");
      }
      bBot = el("button", { class: "modo-chip attiva", onclick: function () { sel("bot"); } }, [
        el("span", { class: "mi", text: "🤖" }), el("div", {}, [el("div", { class: "mt", text: "Contro il bot" }), el("div", { class: "ms", text: "Da solo" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { sel("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Online" }), el("div", { class: "ms", text: "Ognuno dal suo" })])]);
      box.appendChild(el("div", { class: "etichetta", text: "Come giocare" }));
      box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bBot, bOnl]));
      boxDiff = el("div", {});
      boxDiff.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura del bot" }));
      var diffWrap = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.difficolta = d[0];
          [].forEach.call(diffWrap.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; });
          b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: d[1] })]);
        b.style.flex = "1"; diffWrap.appendChild(b);
      });
      boxDiff.appendChild(diffWrap); box.appendChild(boxDiff);
      notaOnline = el("div", { class: "link-avviso", hidden: "hidden" });
      notaOnline.textContent = (window.SGNet && SGNet.disponibile())
        ? "Apri una stanza e manda il codice: l'altro entra dal suo telefono (ognuno vede solo le proprie carte)."
        : "Qui il collegamento non è disponibile: funziona quando il gioco è aperto dal sito pubblicato online.";
      box.appendChild(notaOnline);
    },
    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return ospiteScopa(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostScopa(t);
      return localeScopa(t, imp.difficolta || "medio");
    }
  });

  // suono/vibrazione presa
  function suonoPresa(scopa) {
    try { if (navigator.vibrate) navigator.vibrate(scopa ? [0, 20, 40, 30] : 14); } catch (e) {}
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t = ctx.currentTime;
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.setValueAtTime(scopa ? 520 : 360, t); o.frequency.exponentialRampToValueAtTime(scopa ? 880 : 300, t + 0.12);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (scopa ? 0.28 : 0.16));
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.3);
    } catch (e) {}
  }

  // ---------- LOCALE (contro il bot) : io = A, bot = B ----------
  function localeScopa(t, difficolta) {
    var nomi = { A: (t.giocatori[0] || "Tu"), B: "🤖 Bot" };
    var M = creaMotore(nomi, t.mischia);
    var C = creaClient(t, {
      locale: true, sonoHost: true,
      onMossa: function (id, presa) { mossaUmano(id, presa); },
      onAvanti: function () { M.prossimoRound(); aggiorna(); seTuraBot(); },
      onNuova: function () { M = creaMotore(nomi, t.mischia); aggiorna(); seTuraBot(); },
      onEsci: t.esci
    });
    function aggiorna() { C.setVm(vistaDa(M.st, "A")); }
    function continua(ev) {
      // se ha preso, mostra per un attimo cosa è stato preso, poi prosegue
      if (ev.presa && M.st.fase === "gioco") {
        setTimeout(function () { M.st.presa = null; aggiorna(); seTuraBot(); }, ev.scopa ? 1700 : 1250);
      } else { M.st.presa = null; seTuraBot(); }
    }
    function mossaUmano(id, presa) {
      var ev = M.gioca("A", id, presa); if (ev.errore) return;
      suonoPresa(ev.scopa); aggiorna(); continua(ev);
    }
    function seTuraBot() {
      if (M.st.fase === "gioco" && M.st.turno === "B") setTimeout(mossaBot, 650 + Math.random() * 400);
    }
    function mossaBot() {
      if (M.st.fase !== "gioco" || M.st.turno !== "B") return;
      var m = scegliMossaBot(M.st.mani.B, M.st.tavolo, difficolta);
      var ev = M.gioca("B", m.carta, m.presa);
      suonoPresa(ev.scopa); aggiorna(); continua(ev);
    }
    aggiorna();
    seTuraBot(); // se per qualche motivo B inizia
  }

  // ---------- ONLINE : host = A, ospite = B ----------
  function hostScopa(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var nomi = { A: (t.giocatori && t.giocatori[0]) || "Host", B: "Avversario" };
    var M = null, rete = null, avvId = null, pronta = false, codice = "…";
    var C = creaClient(t, {
      sonoHost: true,
      onMossa: function (id, presa) { if (!M) return; var ev = M.gioca("A", id, presa); dopo(ev); },
      onAvanti: function () { if (M) { M.prossimoRound(); bcast(); } },
      onNuova: function () { M = creaMotore(nomi, t.mischia); bcast(); },
      onEsci: function () { if (rete) rete.chiudi(); t.esci(); }
    });
    function lobbyVm() { return { lobby: true, codice: codice, pronta: pronta, avversario: !!avvId, sonoHost: true, nomi: nomi }; }
    function bcast() {
      // all'ospite mando la SUA vista (vede solo le proprie carte); io disegno la mia
      if (M) { if (rete) rete.invia({ t: "vm", vm: vistaDa(M.st, "B") }); C.setVm(vistaDa(M.st, "A")); }
      else disegnaLobby();
    }
    function dopo(ev) {
      if (!ev || ev.errore) return;
      suonoPresa(ev.scopa);
      bcast(); // mostra la presa (se c'è) su entrambi i telefoni
      if (ev.presa && M.st.fase === "gioco") {
        setTimeout(function () { M.st.presa = null; bcast(); }, ev.scopa ? 1700 : 1250);
      } else { M.st.presa = null; }
    }
    rete = SGNet.ospita("scopa", {
      onCodice: function (c) { codice = c; if (!M) disegnaLobby(); },
      onConnesso: function () { pronta = true; if (!M) disegnaLobby(); },
      onAddio: function (id) { if (id === avvId) { avvId = null; if (M) { M = null; } disegnaLobby(); } },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") { if (!avvId) { avvId = id; nomi.B = String(m.nome || "Avversario").slice(0, 16); } if (M) M.st.nomi.B = nomi.B; disegnaLobby(); if (rete) rete.invia({ t: "lobby", codice: codice, avversario: true }); }
        else if (m.t === "comincia") { /* solo host comincia */ }
        else if (m.t === "gioca" && M) { if (M.st.turno === "B") dopo(M.gioca("B", m.carta, m.presa)); }
        else if (m.t === "avanti") { /* ignora: avanza l'host */ }
      },
      onErrore: function () { senzaRete(t); }
    });
    var lobbyC = { sonoHost: true };
    function disegnaLobby() {
      if (M) return;
      renderLobby(t, lobbyVm(), {
        sonoHost: true,
        onComincia: function () { if (avvId) { M = creaMotore(nomi, t.mischia); bcast(); } },
        onEsci: function () { if (rete) rete.chiudi(); t.esci(); }
      });
    }
    disegnaLobby();
  }

  function ospiteScopa(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { rete: null, nome: "", msg: null, entrato: false };
    var C = creaClient(t, {
      sonoHost: false,
      onMossa: function (id, presa) { if (S.rete) S.rete.invia({ t: "gioca", carta: id, presa: presa }); },
      onAvanti: function () {}, onNuova: function () {},
      onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); }
    });
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🃏", titolo: "Entra nella Scopa", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
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
        onAperto: function (id) { S.entrato = true; S.rete.invia({ t: "join", nome: S.nome }); mostraAttesa();
          setTimeout(function () { if (!C.vm && S.msg2) S.msg2.textContent = "Non trovo la partita: controlla il codice o attendi l'host…"; }, 8000); },
        onMsg: function (m) {
          if (!m) return;
          if (m.t === "vm") { suonoSeNuovaPresa(m.vm); C.setVm(m.vm); }
          else if (m.t === "lobby") { if (!C.vm) mostraAttesa(); }
        },
        onChiuso: function () { erroreScopa(t, "Collegamento perso. L'host potrebbe aver chiuso la partita."); },
        onErrore: function () { erroreScopa(t, "Problema di collegamento. Riprova."); }
      });
    }
    var lastPresaId = null;
    function suonoSeNuovaPresa(vm) {
      var id = vm.presa ? (vm.presa.carta.id + ":" + vm.presa.presi.length) : null;
      if (id && id !== lastPresaId) suonoPresa(vm.presa.scopa);
      lastPresaId = id;
    }
    function mostraAttesa() {
      if (C.vm) return;
      var s = t.schermata({ icona: "🃏", titolo: "Scopa · Sala", sotto: "Stanza " + codice.toUpperCase(),
        indietro: function () { if (S.rete) S.rete.chiudi(); t.esci(); } });
      S.msg2 = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "✅ Sei dentro! In attesa che l'host cominci…" });
      s._contenuto.appendChild(S.msg2);
      t.mostra(s);
    }
  }

  function renderLobby(t, vm, cb) {
    var el = t.el;
    var s = t.schermata({ icona: "🃏", titolo: "Scopa · Lobby", sotto: "Ognuno dal suo telefono",
      indietro: function () { if (window.confirm("Uscire?")) cb.onEsci(); } });
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "Codice della stanza" }));
    s._contenuto.appendChild(el("div", { class: "codice-stanza", text: (vm.codice || "…").toUpperCase() }));
    if (vm.codice && vm.codice !== "…") {
      var link = SG.creaLink({ gioco: "scopa", stanza: vm.codice });
      var campo = el("input", { class: "link-campo", type: "text", readonly: "readonly", value: link });
      s._contenuto.appendChild(el("button", { class: "btn btn-fantasma", html: "🔗 Copia il link da mandare",
        onclick: function () { campo.focus(); campo.select(); try { navigator.clipboard.writeText(link); } catch (e) {} } }));
      s._contenuto.appendChild(campo);
    }
    s._contenuto.appendChild(el("div", { style: "margin:8px 0 2px;font-size:.9rem;font-weight:700;color:" + (vm.pronta ? "#69db7c" : "#ffd43b"),
      text: vm.pronta ? "🟢 Stanza pronta — manda il codice" : "🟡 Sto aprendo la stanza…" }));
    s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "margin-top:10px", text: vm.avversario ? "✅ Avversario collegato!" : "In attesa dell'avversario…" }));
    var b = el("button", { class: "btn btn-primario", text: "Comincia ▶", onclick: cb.onComincia });
    if (!vm.avversario) b.setAttribute("disabled", "disabled");
    s._piede.appendChild(b);
    t.mostra(s);
  }

  function erroreScopa(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità online funziona quando il gioco è aperto dal sito pubblicato. Da un file locale non è disponibile: intanto gioca contro il bot." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
})();

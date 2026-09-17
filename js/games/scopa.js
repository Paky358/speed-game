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

  // ---------- musichetta chill di sottofondo (generata, niente file) ----------
  // Condivisa da Scopa, Scopa 2 vs 2 e Scopone. Pad morbidi + arpeggio lento,
  // volume basso; tasto 🎵/🔇 per accendere/spegnere (scelta ricordata).
  window.SGMusica = window.SGMusica || (function () {
    var on = true, giocando = false, ctx = null, master = null, filtro = null, timer = null, nextT = 0, step = 0;
    try { on = (localStorage.getItem("sg-musica") !== "off"); } catch (e) {}
    // accordi morbidi (Cmaj7 · Am7 · Fmaj7 · G7): basso + tre note del pad
    var CH = [
      { b: 65.41, n: [329.63, 392.00, 493.88] },
      { b: 110.00, n: [261.63, 329.63, 392.00] },
      { b: 87.31, n: [220.00, 261.63, 329.63] },
      { b: 98.00, n: [246.94, 293.66, 349.23] }
    ];
    var DUR = 3.8;
    function nota(freq, t0, dur, tipo, vol) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = tipo; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.9, dur * 0.35));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function accordo(t0) {
      var c = CH[step % CH.length]; step++;
      nota(c.b, t0, DUR, "sine", 0.26);            // basso
      c.n.forEach(function (f) { nota(f, t0, DUR, "triangle", 0.075); });  // pad
      for (var i = 0; i < 4; i++) { nota(c.n[i % 3] * (i === 3 ? 2 : 1), t0 + i * (DUR / 4), DUR / 4 * 0.9, "triangle", 0.10); } // arpeggio
    }
    function loop() { if (!ctx) return; while (nextT < ctx.currentTime + 0.6) { accordo(nextT); nextT += DUR; } }
    function startAudio() {
      ctx = SG.audioCtx && SG.audioCtx(); if (!ctx || timer) return;
      if (!master) {
        master = ctx.createGain(); filtro = ctx.createBiquadFilter(); filtro.type = "lowpass"; filtro.frequency.value = 2600;
        var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -8; comp.knee.value = 6; comp.ratio.value = 12; comp.attack.value = 0.004; comp.release.value = 0.25;
        master.connect(filtro); filtro.connect(comp); comp.connect(ctx.destination);   // limitatore: alza il volume senza distorcere
      }
      master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 1.6);
      nextT = ctx.currentTime + 0.1; step = 0; loop(); timer = setInterval(loop, 250);
    }
    function stopAudio() {
      if (timer) { clearInterval(timer); timer = null; }
      if (ctx && master) { try { master.gain.cancelScheduledValues(ctx.currentTime); var v = master.gain.value || 0.0001; master.gain.setValueAtTime(v, ctx.currentTime); master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6); } catch (e) {} }
    }
    return {
      avvia: function () { giocando = true; if (on) startAudio(); },
      ferma: function () { giocando = false; stopAudio(); },
      attiva: function () { return on; },
      commuta: function () { on = !on; try { localStorage.setItem("sg-musica", on ? "on" : "off"); } catch (e) {} if (giocando) { if (on) startAudio(); else stopAudio(); } return on; },
      // pulsante 🎵/🔇 pronto da mettere in una schermata
      bottone: function (el) {
        var b = el("button", { class: "sc-musica", title: "Musica di sottofondo", text: on ? "🎵" : "🔇" });
        b.addEventListener("click", function () { b.textContent = (window.SGMusica.commuta() ? "🎵" : "🔇"); });
        return b;
      }
    };
  })();

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
      ultimoRound: null, presa: null, messaGiu: null
    };
    function nuovoRound() {
      st.mazzo = creaMazzo(mischia);
      st.tavolo = st.mazzo.splice(0, 4);
      st.mani.A = st.mazzo.splice(0, 3);
      st.mani.B = st.mazzo.splice(0, 3);
      st.prese.A = []; st.prese.B = []; st.scope.A = 0; st.scope.B = 0;
      st.ultimaPresa = null; st.turno = st.primo; st.fase = "gioco"; st.presa = null; st.messaGiu = null;
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
      st.presa = null; st.messaGiu = null;
      // togli la carta dalla mano
      st.mani[pk] = st.mani[pk].filter(function (c) { return c.id !== cartaId; });
      if (opts.length) {
        // DEVE prendere: valida il set scelto (o prendi il primo se non specificato/valido)
        var set = presaIds && validaSet(opts, presaIds) ? presaIds : opts[0];
        var tavoloPrima = st.tavolo.slice(); // il tavolo com'era, per l'animazione (resta fermo, volano via solo le prese)
        var presi = set.map(function (id) { return trova(st.tavolo, id); }).filter(Boolean);
        st.tavolo = st.tavolo.filter(function (c) { return set.indexOf(c.id) < 0; });
        st.prese[pk] = st.prese[pk].concat(presi, [carta]);
        st.ultimaPresa = pk; ev.presa = true;
        var ultimissima = (st.mazzo.length === 0 && st.mani.A.length === 0 && st.mani.B.length === 0);
        if (st.tavolo.length === 0 && !ultimissima) { st.scope[pk]++; ev.scopa = true; }
        st.presa = { chi: pk, carta: carta, presi: presi, scopa: ev.scopa, tavoloPrima: tavoloPrima, presiIds: set };
      } else {
        st.tavolo.push(carta); st.messaGiu = carta.id; // niente presa: la carta si posa sul tavolo (animata)
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

  // ---------- carte (immagini vere: mazzo napoletano di pubblico dominio, Wikimedia Commons) ----------
  var ASP_CARTA = 1.653; // proporzioni delle immagini (altezza/larghezza)
  // larghezza carta perché maxN carte stiano SEMPRE su una riga (tavolo/mano a dimensione fissa,
  // non cambia col numero di carte): si "vede da più lontano" sugli schermi stretti.
  function larghezza(maxN, gap, cap) {
    var A = Math.min(window.innerWidth || 375, 600) - 46;
    return Math.max(26, Math.min(cap || 70, Math.floor((A - (maxN - 1) * gap) / maxN)));
  }
  function assicuraStile() {
    if (document.getElementById("sg-scopa-css")) return;
    var st = document.createElement("style");
    st.id = "sg-scopa-css";
    st.textContent = [
      ".sc-carta{position:relative;display:inline-block;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,.45);line-height:0}",
      ".sc-carta img{display:block;border-radius:8px;-webkit-user-drag:none;user-select:none}",
      ".sc-carta.sel{outline:3px solid #ffd43b;outline-offset:2px;transform:translateY(-10px)}",
      ".sc-carta.cap{outline:3px solid #69db7c;outline-offset:2px;cursor:pointer}",
      ".sc-carta.presel{outline:3px solid #4dabf7;outline-offset:2px}",
      ".sc-dorso{border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,.45);background:#b3161d;background-image:radial-gradient(circle at 3px 3px,rgba(255,235,180,.35) 1.1px,transparent 1.6px);background-size:8px 8px;border:2px solid #f2e2be;box-sizing:border-box;display:inline-block}",
      // tasto musichetta di sottofondo
      ".sc-musica{border:0;background:rgba(255,255,255,.10);color:inherit;border-radius:999px;width:34px;height:34px;font-size:1rem;line-height:1;cursor:pointer;-webkit-tap-highlight-color:transparent;padding:0}",
      ".sc-musica:active{transform:scale(.92)}",
      // la carta scartata si posa sul tavolo
      "@keyframes scCade{0%{transform:translateY(-130px) scale(1.08);opacity:0}60%{opacity:1}100%{transform:translateY(0) scale(1);opacity:1}}",
      ".sc-cade{animation:scCade .34s ease-out}",
      // la presa: le carte prese volano via DALLA LORO POSIZIONE verso chi prende (il resto resta fermo)
      "@keyframes scLasciaSu{0%,35%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-210px) scale(.4);opacity:0}}",
      "@keyframes scLasciaGiu{0%,35%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(210px) scale(.4);opacity:0}}",
      ".sc-lascia-su{animation:scLasciaSu .95s ease-in forwards;position:relative;z-index:4}",
      ".sc-lascia-giu{animation:scLasciaGiu .95s ease-in forwards;position:relative;z-index:4}",
      // la carta giocata: arriva dalla mano, si posa al centro, poi vola via con le prese
      "@keyframes scGiocaGiu{0%{transform:translateY(150px) scale(.92);opacity:0}16%{opacity:1}30%,38%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(215px) scale(.4);opacity:0}}",
      "@keyframes scGiocaSu{0%{transform:translateY(-150px) scale(.92);opacity:0}16%{opacity:1}30%,38%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-215px) scale(.4);opacity:0}}",
      // ---- tavolo verde (feltro) + posti dei giocatori + mensola della mano: look condiviso da Scopa, Scopa 2vs2 e Scopone ----
      ".sc-feltro{flex:1;display:flex;flex-direction:column;min-height:0;background:radial-gradient(125% 95% at 50% 15%,#2fa268 0%,#1c7b4d 52%,#135c3a 100%);border:2px solid rgba(0,0,0,.35);border-radius:16px;box-shadow:inset 0 2px 16px rgba(0,0,0,.35),0 4px 12px rgba(0,0,0,.3);padding:8px 6px}",
      ".sc-cima{display:flex;justify-content:center;margin-bottom:2px}",
      ".sc-fascia{flex:1;display:flex;align-items:center;justify-content:center;gap:4px;min-height:0}",
      ".sc-terra{flex:1;display:flex;align-items:center;justify-content:center;padding:4px 0;position:relative;min-height:0}",
      ".sc-postobox{display:flex;flex-direction:column;align-items:center;gap:3px}",
      ".sc-postobox.v{width:74px;flex:0 0 auto}",
      ".sc-posto{display:flex;align-items:center;gap:5px;background:rgba(0,0,0,.30);border-radius:999px;padding:3px 9px;max-width:100%}",
      ".sc-nome{font-size:.72rem;font-weight:700;color:#eafff1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:118px}",
      ".sc-postobox.v .sc-nome{max-width:64px;font-size:.68rem}",
      ".sc-posto.rosso .sc-nome{color:#ffd9d9}",
      ".sc-posto.turno{box-shadow:0 0 0 2px #ffd43b,0 0 12px rgba(255,212,59,.55)}",
      ".sc-num{font-size:.64rem;font-weight:800;color:#fff;background:rgba(0,0,0,.35);border-radius:999px;padding:0 5px;min-width:15px;text-align:center}",
      ".sc-manina{display:flex}",
      ".sc-manina.v{flex-direction:column;align-items:center}",
      ".sc-mensola{background:linear-gradient(#6d4526,#472c17);border-radius:14px 14px 0 0;box-shadow:inset 0 2px 8px rgba(255,255,255,.07),0 -2px 8px rgba(0,0,0,.3);padding:9px 6px 8px;margin:6px -4px 0}",
      ".sc-mano-riga{display:flex;gap:8px;justify-content:center;align-items:flex-end;flex-wrap:wrap}",
      ".sc-prese{text-align:center;font-size:.74rem;margin-top:6px;color:rgba(255,255,255,.8)}"
    ].join("");
    document.head.appendChild(st);
  }
  function cartaEl(el, carta, w, extra, onclick) {
    var d = el("div", { class: "sc-carta" + (extra ? " " + extra : ""), onclick: onclick || null });
    d.appendChild(el("img", { src: "carte/" + carta.id + ".jpg", width: w, height: Math.round(w * ASP_CARTA), alt: "", draggable: "false" }));
    return d;
  }
  function dorsoEl(el, w) { var h = Math.round(w * ASP_CARTA); return el("div", { class: "sc-dorso", style: "width:" + w + "px;height:" + h + "px" }); }
  // mazzetto compatto delle carte coperte di un avversario (orizzontale in alto, verticale ai lati)
  function manina(el, n, vert) {
    var wrap = el("div", { class: "sc-manina" + (vert ? " v" : "") });
    var cap = Math.min(n, vert ? 6 : 8), w = vert ? 22 : 20;
    for (var i = 0; i < cap; i++) {
      var d = dorsoEl(el, w);
      if (i > 0) d.style[vert ? "marginTop" : "marginLeft"] = (vert ? -Math.round(w * ASP_CARTA * 0.72) : -Math.round(w * 0.55)) + "px";
      wrap.appendChild(d);
    }
    return wrap;
  }
  // etichetta di un giocatore attorno al tavolo: nome + numero carte + mazzetto coperto (turno = bordo dorato)
  function posto(el, o) {
    var b = el("div", { class: "sc-postobox" + (o.lato ? " v" : "") });
    var chip = el("div", { class: "sc-posto" + (o.mia ? "" : " rosso") + (o.turno ? " turno" : "") });
    chip.appendChild(el("span", { class: "sc-nome", text: o.nome }));
    if (o.n != null) chip.appendChild(el("span", { class: "sc-num", text: o.n }));
    b.appendChild(chip);
    if (o.n > 0) b.appendChild(manina(el, o.n, !!o.lato));
    return b;
  }

  // ---------- vista (uguale per bot/host/ospite) ----------
  // vm = { fase, io("A"|"B"), turno, nomi, mano:[carte], oppN, tavolo:[carte],
  //        preseIo, preseOpp, scopeIo, scopeOpp, settebelloIo, settebelloOpp,
  //        punti:{io,opp}, ultimoRound, presa:{mio,carta,presi,scopa}|null, vincitoreIo }
  // C = { vm, sel:{carta,presa}, ridisegna } ; cb = { onMossa(id,presa|null), onAvanti, onEsci, sonoHost, lobby... }
  var scMount = null; // schermata di gioco già montata: la aggiorniamo senza rifarla ogni volta (niente lampeggio)

  function renderScopa(t, C, cb) {
    assicuraStile();
    if (window.SGMusica) window.SGMusica.avvia();
    var el = t.el, vm = C.vm;
    var wT = larghezza(9, 4, 70), wH = larghezza(3, 8, 84);   // tavolo: 9 carte fisse · mano: max 3 (Scopa)
    var box = el("div", { style: "display:flex;flex-direction:column;min-height:calc(100vh - 155px);min-height:calc(100dvh - 155px)" });

    // ---- intestazione: punti (a sinistra) + tasto musica (a destra) ----
    var mioTurno = (vm.turno === vm.io && vm.fase === "gioco" && !vm.presa);
    var head = el("div", { style: "display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:5px" });
    head.appendChild(el("div", { style: "font-size:.8rem;font-weight:700", html: "<b>" + vm.nomi.io + " " + vm.punti.io + "</b> — " + vm.nomi.opp + " " + vm.punti.opp + " <span class='tenue' style='font-weight:600'>(a " + TARGET + ")</span>" }));
    if (window.SGMusica) head.appendChild(window.SGMusica.bottone(el));
    box.appendChild(head);

    // ---- tavolo verde: avversario in alto, carte a terra al centro ----
    var feltro = el("div", { class: "sc-feltro" });
    feltro.appendChild(el("div", { class: "sc-cima" }, [ posto(el, { nome: vm.nomi.opp, n: vm.oppN, turno: vm.turno !== vm.io && vm.fase === "gioco", mia: false }) ]));

    var cartaSel = C.sel.carta ? trova(vm.mano, C.sel.carta) : null;
    var opts = cartaSel ? catture(cartaSel.v, vm.tavolo) : [];
    var capIds = {}; opts.forEach(function (set) { set.forEach(function (id) { capIds[id] = true; }); });
    var areaTavolo = el("div", { class: "sc-terra" });
    var pendingPlace = null;
    if (vm.presa) {
      // il tavolo RESTA fermo: rimostro il tavolo com'era e faccio volare via SOLO le carte prese
      var dir = vm.presa.mio ? "giu" : "su";
      areaTavolo.style.position = "relative";
      var tw0 = el("div", { style: "display:flex;flex-wrap:wrap;gap:4px;justify-content:center;align-content:center" });
      var presiEls = [];
      (vm.presa.tavoloPrima || vm.tavolo).forEach(function (c) {
        var cel = cartaEl(el, c, wT);
        if (vm.presa.presiIds && vm.presa.presiIds.indexOf(c.id) >= 0) { cel.classList.add("sc-lascia-" + dir); presiEls.push(cel); }
        tw0.appendChild(cel);
      });
      areaTavolo.appendChild(tw0);
      // la mia carta giocata: parte dalla mano, va SOPRA la/e carta/e che prende, poi vola via con la presa
      var gioc = cartaEl(el, vm.presa.carta, wT);
      gioc.style.cssText += ";position:absolute;z-index:6;opacity:0";
      areaTavolo.appendChild(gioc);
      pendingPlace = function () {
        var a = areaTavolo.getBoundingClientRect();
        if (presiEls.length) {                       // si posa sulla carta presa (o al centro del gruppo preso)
          var cx = 0, cy = 0;
          presiEls.forEach(function (e) { var r = e.getBoundingClientRect(); cx += r.left + r.width / 2; cy += r.top + r.height / 2; });
          cx /= presiEls.length; cy /= presiEls.length;
          var g = gioc.getBoundingClientRect();
          gioc.style.left = (cx - a.left - g.width / 2) + "px";
          gioc.style.top = (cy - a.top - g.height / 2) + "px";
        } else {                                      // scopa: tavolo svuotato, si posa al centro
          gioc.style.left = "50%"; gioc.style.top = "50%"; gioc.style.marginLeft = (-wT / 2) + "px"; gioc.style.marginTop = (-Math.round(wT * ASP_CARTA) / 2) + "px";
        }
        gioc.style.animation = "scGioca" + (dir === "giu" ? "Giu" : "Su") + " .95s ease-in forwards";
      };
    } else {
      var tw = el("div", { style: "display:flex;flex-wrap:wrap;gap:4px;justify-content:center;align-content:center" });
      if (!vm.tavolo.length) tw.appendChild(el("div", { class: "tenue", text: "tavolo vuoto" }));
      vm.tavolo.forEach(function (c) {
        var cap = mioTurno && cartaSel && capIds[c.id];
        var extra = (C.sel.presa.indexOf(c.id) >= 0) ? "presel" : (cap ? "cap" : "");
        var cel = cartaEl(el, c, wT, extra, cap ? function () { C.tapTavolo(c.id); } : null);
        if (c.id === vm.messaGiu) cel.classList.add("sc-cade"); // appena scartata: si posa sul tavolo
        tw.appendChild(cel);
      });
      areaTavolo.appendChild(tw);
    }
    feltro.appendChild(areaTavolo);
    box.appendChild(feltro);

    // ---- stato (tocca a te / all'avversario / scopa) ----
    box.appendChild(el("div", { style: "text-align:center;font-weight:800;font-size:1.05rem;margin:6px 0 3px;min-height:1.25em;color:" + (vm.presa && vm.presa.scopa ? "#ffd43b" : "inherit"),
      text: vm.presa ? (vm.presa.scopa ? "SCOPA! 🧹" : "") : (mioTurno ? "Tocca a te" : "Tocca a " + vm.nomi.opp) }));

    // ---- la mia mano (in basso, sulla mensola di legno) ----
    var mensola = el("div", { class: "sc-mensola" });
    var manoW = el("div", { class: "sc-mano-riga" });
    vm.mano.forEach(function (c) {
      manoW.appendChild(cartaEl(el, c, wH, (C.sel.carta === c.id) ? "sel" : "", mioTurno ? function () { C.tapMano(c.id); } : null));
    });
    mensola.appendChild(manoW);
    mensola.appendChild(el("div", { class: "sc-prese", html: "le tue prese <b>" + vm.preseIo + "</b>" + (vm.settebelloIo ? " · 7💰" : "") + (vm.scopeIo ? " · scope " + vm.scopeIo : "") }));
    box.appendChild(mensola);

    // ---- suggerimento (nel piede) ----
    var piedeNodi = [];
    if (mioTurno && cartaSel && opts.length >= 2) {
      piedeNodi.push(el("p", { class: "modulo-nota", style: "text-align:center", text: opts[0].length === 1 ? "Più prese possibili: tocca la carta verde che vuoi prendere." : "Tocca le carte verdi che sommano a " + cartaSel.v + "." }));
    } else if (mioTurno) {
      piedeNodi.push(el("p", { class: "modulo-nota", style: "text-align:center", text: "Tocca una tua carta per giocarla." }));
    } else if (vm.fase === "gioco") {
      piedeNodi.push(el("p", { class: "modulo-nota", style: "text-align:center", text: "Aspetta il tuo turno…" }));
    }

    // ---- montaggio: la prima volta creo la schermata, poi aggiorno SOLO il contenuto (schermo fisso, niente lampeggio) ----
    if (scMount && scMount.cont && document.body.contains(scMount.box)) {
      scMount.cont.replaceChild(box, scMount.box);
      scMount.box = box;
      scMount.piede.innerHTML = "";
      piedeNodi.forEach(function (n) { scMount.piede.appendChild(n); });
    } else {
      var s = t.schermata({ icona: "🃏", titolo: "Scopa", sotto: vm.nomi.io + " vs " + vm.nomi.opp,
        indietro: function () { if (window.confirm("Uscire dalla partita?")) cb.onEsci(); } });
      s._contenuto.appendChild(box);
      piedeNodi.forEach(function (n) { s._piede.appendChild(n); });
      t.mostra(s);
      scMount = { cont: s._contenuto, box: box, piede: s._piede };
    }
    if (pendingPlace) pendingPlace();
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
      if (vm && vm.presa) {                              // arriva una presa: mostra l'animazione (durata minima garantita)
        C._presaFino = Date.now() + 1050;
        C.vm = vm; C.disegna(); return;
      }
      if (vm && C.vm && C.vm.presa && Date.now() < C._presaFino) {   // il "pulisci" è arrivato troppo presto:
        // NON ridisegno (l'animazione è in corso): rimando solo l'applicazione del nuovo stato
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
      ultimoRound: st.ultimoRound, messaGiu: st.messaGiu,
      presa: st.presa ? { mio: st.presa.chi === io, carta: st.presa.carta, presi: st.presa.presi, scopa: st.presa.scopa, tavoloPrima: st.presa.tavoloPrima, presiIds: st.presa.presiIds } : null,
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
      onEsci: function () { if (window.SGMusica) window.SGMusica.ferma(); t.esci(); }
    });
    function aggiorna() { C.setVm(vistaDa(M.st, "A")); }
    function continua(ev) {
      // se ha preso, mostra per un attimo cosa è stato preso, poi prosegue
      if (ev.presa && M.st.fase === "gioco") {
        setTimeout(function () { M.st.presa = null; aggiorna(); seTuraBot(); }, ev.scopa ? 1800 : 1200);
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
      onEsci: function () { if (window.SGMusica) window.SGMusica.ferma(); if (rete) rete.chiudi(); t.esci(); }
    });
    function lobbyVm() { return { lobby: true, codice: codice, pronta: pronta, avversario: !!avvId, sonoHost: true, io: "A", nomi: nomi }; }
    function aggiornaLobby() { if (M) return; if (rete) rete.invia({ t: "lobby", codice: codice, pronta: pronta, avversario: !!avvId, nomi: { A: nomi.A, B: nomi.B } }); disegnaLobby(); }
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
        setTimeout(function () { M.st.presa = null; bcast(); }, ev.scopa ? 1800 : 1200);
      } else { M.st.presa = null; }
    }
    rete = SGNet.ospita("scopa", {
      onCodice: function (c) { codice = c; if (!M) aggiornaLobby(); },
      onConnesso: function () { pronta = true; if (!M) aggiornaLobby(); },
      onAddio: function (id) { if (id === avvId) { avvId = null; nomi.B = "Avversario"; if (M) { M = null; } aggiornaLobby(); } },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") { if (!avvId) { avvId = id; nomi.B = String(m.nome || "Avversario").slice(0, 16); } if (M) M.st.nomi.B = nomi.B; aggiornaLobby(); }
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
      onEsci: function () { if (window.SGMusica) window.SGMusica.ferma(); if (S.rete) S.rete.chiudi(); t.esci(); }
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
          else if (m.t === "lobby") { if (!C.vm) mostraLobby(m); }
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
    function mostraLobby(m) {
      if (C.vm) return;
      renderLobby(t, { codice: m.codice, pronta: m.pronta, avversario: m.avversario, nomi: m.nomi, sonoHost: false, io: "B" },
        { onEsci: function () { if (window.SGMusica) window.SGMusica.ferma(); if (S.rete) S.rete.chiudi(); t.esci(); } });
    }
    function mostraAttesa() {   // placeholder finché non arriva la sala dall'host
      if (C.vm) return;
      var s = t.schermata({ icona: "🃏", titolo: "Scopa · Sala", sotto: "Stanza " + codice.toUpperCase(),
        indietro: function () { if (window.SGMusica) window.SGMusica.ferma(); if (S.rete) S.rete.chiudi(); t.esci(); } });
      S.msg2 = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegato ✅ — sto entrando nella stanza…" });
      s._contenuto.appendChild(S.msg2);
      t.mostra(s);
    }
  }

  // sala uguale per host e ospite: mostra i due giocatori; codice/Comincia solo all'host
  function renderLobby(t, vm, cb) {
    var el = t.el;
    var s = t.schermata({ icona: "🃏", titolo: "Scopa · Sala", sotto: "Ognuno dal suo telefono",
      indietro: function () { if (window.confirm("Uscire?")) cb.onEsci(); } });
    if (vm.sonoHost) {
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
    } else {
      s._contenuto.appendChild(el("div", { style: "text-align:center;font-weight:700;color:#69db7c;margin-bottom:2px", text: "✅ Sei nella stanza " + (vm.codice || "").toUpperCase() }));
    }
    var nomi = vm.nomi || {};
    s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:12px", text: "Chi c'è" }));
    [["A", nomi.A || "Host", "#e0a11b"], ["B", vm.avversario ? (nomi.B || "Avversario") : null, "#d1495b"]].forEach(function (p) {
      var mio = (p[0] === vm.io);
      s._contenuto.appendChild(el("div", { style: "display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;margin-bottom:6px;background:" + (mio ? "rgba(255,202,58,.16)" : "rgba(255,255,255,.06)") + (p[1] ? "" : ";opacity:.55") }, [
        el("span", { style: "width:16px;height:16px;border-radius:50%;flex:0 0 auto;background:" + p[2] }),
        el("span", { style: "flex:1;font-weight:700", text: p[1] ? (p[1] + (mio ? " (tu)" : "")) : "In attesa dell'avversario…" })
      ]));
    });
    if (vm.sonoHost) {
      var b = el("button", { class: "btn btn-primario", text: "Comincia ▶", onclick: cb.onComincia });
      if (!vm.avversario) b.setAttribute("disabled", "disabled");
      s._piede.appendChild(b);
    } else {
      s._piede.appendChild(el("p", { class: "modulo-nota", text: "In attesa che l'host cominci…" }));
    }
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

  // aiuti condivisi (usati anche dallo Scopone): carte e logica di presa
  window.SGCarte = {
    creaMazzo: creaMazzo, catture: catture, primiera: primiera, trova: trova,
    cartaEl: cartaEl, dorsoEl: dorsoEl, manina: manina, posto: posto, assicuraStile: assicuraStile,
    larghezza: larghezza, ASP_CARTA: ASP_CARTA,
    validaSet: validaSet, prefisso: prefisso, PRIM: PRIM
  };
})();

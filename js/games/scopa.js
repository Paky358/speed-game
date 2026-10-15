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

  // ---------- musichetta allegra di sottofondo (generata, niente file) ----------
  // Condivisa da Scopa, Scopa 2 vs 2 e Scopone. Stile osteria: basso "zum-pa", accordi pizzicati
  // tipo mandolino, melodia che si ripete, cassa e charleston leggeri. Tasto 🎵/🔇 (scelta ricordata).
  window.SGMusica = window.SGMusica || (function () {
    var on = true, giocando = false, ctx = null, master = null, filtro = null, timer = null, nextT = 0, step = 0, rumore = null;
    try { on = (localStorage.getItem("sg-musica") !== "off"); } catch (e) {}
    var S = 60 / 128 / 4;   // un sedicesimo a 128 battiti al minuto
    function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    // giro di accordi Do · La- · Fa · Sol (una battuta ciascuno): basso, accordo, melodia (ottavi, null = pausa)
    var GIRO = [
      { b: 36, a: [60, 64, 67], m: [76, 79, 84, 79, 76, null, 74, 76] },
      { b: 33, a: [57, 60, 64], m: [72, 76, 81, 76, 72, null, 71, 72] },
      { b: 41, a: [57, 60, 65], m: [69, 72, 77, 72, 69, null, 67, 69] },
      { b: 43, a: [55, 59, 62], m: [71, 74, 79, 74, 77, null, 76, 74] }
    ];
    function nota(freq, t0, dur, tipo, vol, attacco) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = tipo; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + (attacco || 0.006));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function cassa(t0) {   // colpo di grancassa: sinusoide che scende di tono
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(140, t0); o.frequency.exponentialRampToValueAtTime(45, t0 + 0.12);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 0.2);
    }
    function charleston(t0, vol) {   // "tss" corto: rumore filtrato
      if (!rumore) { rumore = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.1), ctx.sampleRate); var d = rumore.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = rumore; f.type = "highpass"; f.frequency.value = 7000;
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
      s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + 0.06);
    }
    function passo(t0) {
      var i = step % 16, battuta = Math.floor(step / 16), c = GIRO[battuta % 4], conMelodia = (battuta % 8) >= 4 || battuta >= 8;
      if (i === 0 || i === 8) cassa(t0);
      if (i % 2 === 0) charleston(t0, i % 4 === 2 ? 0.07 : 0.035);
      if (i % 4 === 0) nota(hz(c.b + (i % 8 === 4 ? 7 : 0)), t0, S * 3, "triangle", 0.34);                       // zum
      if (i % 4 === 2) c.a.forEach(function (m) { nota(hz(m), t0, S * 1.6, "triangle", 0.09); nota(hz(m + 12), t0, S * 0.9, "square", 0.018); });   // pa (pizzicato)
      if (conMelodia && i % 2 === 0) { var mm = c.m[i / 2]; if (mm) nota(hz(mm), t0, S * 1.8, "square", 0.035, 0.004); }
      step++;
    }
    function loop() { if (!ctx) return; while (nextT < ctx.currentTime + 0.3) { passo(nextT); nextT += S; } }
    function startAudio() {
      ctx = SG.audioCtx && SG.audioCtx(); if (!ctx || timer) return;
      if (!master) {
        master = ctx.createGain(); filtro = ctx.createBiquadFilter(); filtro.type = "lowpass"; filtro.frequency.value = 5200;
        var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.knee.value = 6; comp.ratio.value = 12; comp.attack.value = 0.004; comp.release.value = 0.2;
        master.connect(filtro); filtro.connect(comp); comp.connect(ctx.destination);   // limitatore: volume pieno senza distorcere
      }
      master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.42, ctx.currentTime + 1.2);
      nextT = ctx.currentTime + 0.1; step = 0; loop(); timer = setInterval(loop, 100);
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
  var TARGET = 11;   // i punti da raggiungere se non si sceglie altro

  // ---- punti da raggiungere (Scopa, Scopa 2 vs 2, Scopone): una mano sola, 7, 11, 21 o quanti si vuole (1–99) ----
  function traguardoDa(imp) {   // 0 = una mano sola
    var n = imp && imp.traguardo;
    if (n === 0) return 0;
    n = Math.floor(+n);
    return n >= 1 && n <= 99 ? n : TARGET;
  }
  function testoTraguardo(n) { if (n == null) n = TARGET; return n ? "a " + n : "una mano"; }
  // finita una mano, la partita è chiusa? Con una mano sola sì; altrimenti quando qualcuno arriva ai punti
  // (se arrivano tutti e due a pari punti si gioca un'altra mano)
  function partitaFinita(n, a, b) { return !n || ((a >= n || b >= n) && a !== b); }
  function sceltaTraguardo(el, box, dove, nota) {   // nota = scritta piccola sotto (facoltativa)
    dove.traguardo = TARGET;
    box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Punti da raggiungere" }));
    var scelte = [[0, "Una mano"], [7, "7"], [11, "11"], [21, "21"]], riga = el("div", { style: "display:flex;gap:6px" }), campo;
    function segna() {
      [].forEach.call(riga.children, function (c, i) { c.className = "modo-chip" + (scelte[i][0] === dove.traguardo ? " attiva" : ""); c.style.flex = i ? "1" : "1.7"; });
    }
    scelte.forEach(function (s) {
      riga.appendChild(el("button", { class: "modo-chip", style: "justify-content:center;text-align:center;padding-left:4px;padding-right:4px", onclick: function () {
        dove.traguardo = s[0]; campo.value = s[0] || ""; segna();
      } }, [el("div", { class: "mt", text: s[1] })]));
    });
    box.appendChild(riga);
    campo = el("input", { type: "number", min: "1", max: "99", inputmode: "numeric", class: "link-campo", placeholder: "1–99", "aria-label": "Punti da raggiungere", style: "width:5.5em;text-align:center;margin:0" });
    campo.value = String(dove.traguardo);
    campo.addEventListener("input", function () {
      var n = Math.floor(+campo.value);
      if (n >= 1 && n <= 99) { dove.traguardo = n; segna(); }
    });
    campo.addEventListener("change", function () {   // un numero fuori misura torna a quello scelto
      var n = Math.floor(+campo.value);
      if (n > 99) { dove.traguardo = 99; segna(); }
      campo.value = dove.traguardo ? String(dove.traguardo) : "";
    });
    box.appendChild(el("div", { style: "display:flex;align-items:center;gap:8px;margin-top:8px;font-size:.92rem" }, [
      el("span", { text: "✏️ Oppure scegli tu:" }), campo, el("span", { class: "tenue", text: "punti" }) ]));
    if (nota) box.appendChild(el("div", { class: "tenue", style: "font-size:.8rem;margin-top:6px", text: nota }));
    segna();
  }

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
  // la primiera vale solo con tutti e quattro i semi
  function tuttiSemi(cards) { var s = {}; cards.forEach(function (c) { s[c.s] = 1; }); return !!(s.D && s.C && s.S && s.B); }
  function contaPunti(A, B) {
    function den(x) { var n = 0; x.forEach(function (c) { if (c.s === "D") n++; }); return n; }
    var carteA = A.length, carteB = B.length, denA = den(A), denB = den(B);
    var sette = trova(A, "D7") ? "A" : (trova(B, "D7") ? "B" : null);
    var primA = primiera(A), primB = primiera(B), okA = tuttiSemi(A), okB = tuttiSemi(B);
    // a chi manca un seme non prende la primiera; se manca a tutti e due non la prende nessuno
    var pPrim = okA && okB ? (primA > primB ? "A" : primB > primA ? "B" : null) : okA ? "A" : okB ? "B" : null;
    return {
      carteA: carteA, carteB: carteB, puntoCarte: carteA > carteB ? "A" : carteB > carteA ? "B" : null,
      denA: denA, denB: denB, puntoDenari: denA > denB ? "A" : denB > denA ? "B" : null,
      settebello: sette,
      primA: primA, primB: primB, primOkA: okA, primOkB: okB, puntoPrimiera: pPrim
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
  // primo = chi comincia la prima smazzata ("A" o "B"; nelle partite dopo si alterna)
  function creaMotore(nomi, mischia, traguardo, primo) {
    var st = {
      traguardo: traguardo == null ? TARGET : traguardo,
      mazzo: [], tavolo: [], mani: { A: [], B: [] }, prese: { A: [], B: [] },
      scope: { A: 0, B: 0 }, turno: "A", ultimaPresa: null,
      fase: "gioco", primo: primo || "A", primoPartita: primo || "A", punti: { A: 0, B: 0 }, nomi: nomi,
      ultimoRound: null, presa: null, messaGiu: null,
      idPartita: Math.random().toString(36).slice(2, 9), nRound: 0, rifatta: false
    };
    function nuovoRound() {
      // tre o quattro Re in tavola: nessuno potrebbe fare scopa, si rimescola e si rifà la mano
      var giri = 0;
      do {
        st.mazzo = creaMazzo(mischia);
        st.tavolo = st.mazzo.splice(0, 4);
      } while (st.tavolo.filter(function (c) { return c.v === 10; }).length >= 3 && ++giri < 20);
      st.rifatta = giri > 0;
      st.mani.A = st.mazzo.splice(0, 3);
      st.mani.B = st.mazzo.splice(0, 3);
      st.prese.A = []; st.prese.B = []; st.scope.A = 0; st.scope.B = 0; st.nRound++;
      st.ultimaPresa = null; st.turno = st.primo; st.fase = "gioco"; st.presa = null; st.messaGiu = null;
    }
    function distribuisci() { // 3 a testa quando le mani sono vuote e il mazzo ha carte
      st.mani.A = st.mazzo.splice(0, 3);
      st.mani.B = st.mazzo.splice(0, 3);
    }
    // ritorna un evento: {presa:bool, scopa:bool, chi, chiudere} oppure {errore:true}
    // (finite le mani NON si distribuisce subito: prima si guarda la presa, poi chiudiPresa)
    function gioca(pk, cartaId, presaIds) {
      if (st.fase !== "gioco" || pk !== st.turno || st.presa) return { errore: true };
      var carta = trova(st.mani[pk], cartaId);
      if (!carta) return { errore: true };
      var opts = catture(carta.v, st.tavolo);
      var ev = { presa: false, scopa: false, chi: pk };
      st.presa = null; st.messaGiu = null; st.rifatta = false;
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
      ev.chiudere = st.mani.A.length === 0 && st.mani.B.length === 0;   // mani finite: poi si distribuisce (o finisce la smazzata)
      return ev;
    }
    // finita di guardare la presa: si pulisce; a mani vuote si distribuisce. A fine mazzo prima si fanno vedere
    // le carte rimaste che vanno all'ultimo che ha preso ("resto"), poi la smazzata finisce ("fine").
    function chiudiPresa() {
      st.presa = null; st.messaGiu = null;
      if (st.fase !== "gioco" || st.mani.A.length || st.mani.B.length) return "gioco";
      if (st.mazzo.length > 0) { distribuisci(); return "gioco"; }
      if (st.tavolo.length && st.ultimaPresa) {
        var resto = st.tavolo.slice(), chi = st.ultimaPresa;
        st.prese[chi] = st.prese[chi].concat(resto); st.tavolo = [];
        st.presa = { chi: chi, carta: null, presi: resto, scopa: false, tavoloPrima: resto, presiIds: resto.map(function (c) { return c.id; }), resto: true };
        return "resto";
      }
      fineRound();
      return "fine";
    }
    function fineRound() {
      // le carte rimaste sul tavolo vanno all'ultimo che ha preso
      if (st.tavolo.length && st.ultimaPresa) { st.prese[st.ultimaPresa] = st.prese[st.ultimaPresa].concat(st.tavolo); st.tavolo = []; }
      var p = contaPunti(st.prese.A, st.prese.B);
      var pa = puntiRound(p, st.scope, "A"), pb = puntiRound(p, st.scope, "B");
      st.punti.A += pa; st.punti.B += pb;
      st.ultimoRound = { p: p, scope: { A: st.scope.A, B: st.scope.B }, guad: { A: pa, B: pb }, tot: { A: st.punti.A, B: st.punti.B } };
      if (partitaFinita(st.traguardo, st.punti.A, st.punti.B)) st.fase = "fine";
      else st.fase = "fineround";
    }
    function prossimoRound() {
      if (st.fase !== "fineround") return;
      st.primo = altro(st.primo);
      nuovoRound();
    }
    nuovoRound();
    return {
      st: st, gioca: gioca, prossimoRound: prossimoRound, chiudiPresa: chiudiPresa,
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
  // ---------- bot DIFFICILE: ricorda le carte uscite e guarda una mossa avanti ----------
  // st = stato del motore, pk = chi gioca. Per ogni mossa: quanto guadagno SUBITO
  // meno quanto può guadagnare l'avversario col tavolo che gli lascio, pesando
  // le carte che può avere in mano (solo quelle non ancora uscite).
  // Scala: 1 punto della partita ≈ 8.
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
  function mossaDifficile(st, pk, mosse) {
    var av = altro(pk), mano = st.mani[pk], tavolo = st.tavolo;
    // carte non ancora viste: non sono nella mia mano, sul tavolo o nelle prese (le prese le vedono tutti)
    var viste = {};
    mano.concat(tavolo, st.prese.A, st.prese.B).forEach(function (c) { viste[c.id] = 1; });
    var ignote = creaMazzo().filter(function (c) { return !viste[c.id]; });
    var perValore = {}; ignote.forEach(function (c) { perValore[c.v] = (perValore[c.v] || 0) + 1; });
    var U = ignote.length;
    var hAvv = st.mani[av].length || (st.mazzo.length > 0 ? 3 : 0);   // se ha finito le carte, gliene arrivano 3 nuove
    function probHa(v) {   // probabilità che l'avversario abbia almeno una carta di valore v
      var u = perValore[v] || 0; if (!u || !hAvv || U <= 0) return 0;
      var p = 1; for (var i = 0; i < hAvv; i++) p *= Math.max(0, (U - u - i)) / (U - i);
      return 1 - p;
    }
    var ultimaMia = st.mazzo.length === 0 && mano.length === 1 && st.mani[av].length === 0;
    if (hAvv && U >= hAvv) return mossaSimulata(st, pk, mosse, ignote, hAvv, ultimaMia);
    return mosse.map(function (m) {
      var tav2 = m.cattura ? tavolo.filter(function (c) { return m.set.indexOf(c.id) < 0; }) : tavolo.concat([m.c]);
      var guadagno = m.cattura ? valorePresa(m.c, m.set.map(function (id) { return trova(tavolo, id); }), tav2.length, st.prese[pk], !ultimaMia) : -0.15 * pesoCarta(m.c, st.prese[pk]);
      // risposta dell'avversario: per ogni valore, la sua presa migliore; poi media pesata (prende la migliore che ha)
      var ultimaSua = st.mazzo.length === 0 && mano.length === 1 && st.mani[av].length === 1;
      var risposte = [];
      for (var v = 1; v <= 10; v++) {
        var p = probHa(v); if (!p) continue;
        var best = 0;
        catture(v, tav2).forEach(function (set) {
          var presi = set.map(function (id) { return trova(tav2, id); });
          var val = valorePresa({ v: v, s: "?", id: "?" }, presi, tav2.length - set.length, st.prese[av], !ultimaSua);
          if (val > best) best = val;
        });
        if (best > 0) risposte.push([best, p]);
      }
      risposte.sort(function (a, b) { return b[0] - a[0]; });
      var perdita = 0, nessunaMigliore = 1;
      risposte.forEach(function (r) { perdita += r[0] * r[1] * nessunaMigliore; nessunaMigliore *= (1 - r[1]); });
      return { m: m, s: guadagno - perdita * 0.9 + Math.random() * 0.05 };
    }).sort(function (a, b) { return b.s - a.s; })[0].m;
  }

  // Simulazione: immagina K mani possibili dell'avversario (tra le carte non uscite);
  // per ognuna: la mia mossa -> la sua risposta migliore -> la mia contromossa migliore.
  function mossaSimulata(st, pk, mosse, ignote, hAvv, ultimaMia) {
    var av = altro(pk), K = 16, tavolo = st.tavolo, mieP = st.prese[pk], sueP = st.prese[av];
    function mosseDi(mano, tav) {   // tutte le giocate possibili di una mano: [carta, set presi | null]
      var r = [];
      mano.forEach(function (c) { var o = catture(c.v, tav); if (o.length) o.forEach(function (s) { r.push([c, s]); }); else r.push([c, null]); });
      return r;
    }
    function applica(tav, c, set) { return set ? tav.filter(function (x) { return set.indexOf(x.id) < 0; }) : tav.concat([c]); }
    function guadagno(tav, c, set, prese, scopaVale) {
      if (!set) return -0.3 * pesoCarta(c, prese);
      return valorePresa(c, set.map(function (id) { return trova(tav, id); }), tav.length - set.length, prese, scopaVale);
    }
    function miglior(mano, tav, prese, scopaVale) {   // presa migliore immediata (0 se nulla di buono)
      var b = 0; mosseDi(mano, tav).forEach(function (g) { var v = guadagno(tav, g[0], g[1], prese, scopaVale); if (v > b) b = v; }); return b;
    }
    // mani avversarie campionate (le stesse per tutte le mie mosse: confronto equo)
    var campioni = [];
    for (var k = 0; k < K; k++) {
      var pool = ignote.slice(), h = [];
      for (var i = 0; i < hAvv; i++) h.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      campioni.push(h);
    }
    var mioResto = function (m) { return st.mani[pk].filter(function (c) { return c.id !== m.c.id; }); };
    var best = null, bs = -1e9;
    mosse.forEach(function (m) {
      var tav1 = applica(tavolo, m.c, m.cattura ? m.set : null);
      var g1 = guadagno(tavolo, m.c, m.cattura ? m.set : null, mieP, !ultimaMia);
      var resto = mioResto(m), tot = 0;
      campioni.forEach(function (hA) {
        var ultimaSua = st.mazzo.length === 0 && resto.length === 0 && hA.length === 1;
        // l'avversario sceglie la risposta migliore per lui (tenendo conto della mia contromossa)
        var bR = -1e9, g3R = 0, best2 = 0;
        mosseDi(hA, tav1).forEach(function (g) {
          var tav2 = applica(tav1, g[0], g[1]);
          var g2 = guadagno(tav1, g[0], g[1], sueP, !ultimaSua);
          var g3 = resto.length ? miglior(resto, tav2, mieP, true) : 0;
          var v = g2 - 0.6 * g3;
          if (v > bR) { bR = v; g3R = g3; best2 = g2; }
        });
        tot += g1 - (bR === -1e9 ? 0 : best2) + 0.7 * g3R;
      });
      var s = tot / K + Math.random() * 0.03;
      if (s > bs) { bs = s; best = m; }
    });
    return best;
  }

  function scegliMossaBot(mano, tavolo, diff, st, pk) {
    var mosse = [];
    mano.forEach(function (c) {
      var opts = catture(c.v, tavolo);
      if (opts.length) opts.forEach(function (set) { mosse.push({ carta: c.id, presa: set, cattura: true, c: c, set: set }); });
      else mosse.push({ carta: c.id, presa: null, cattura: false, c: c, set: [] });
    });
    if (diff === "facile") return mosse[Math.floor(Math.random() * mosse.length)];
    if (diff === "difficile" && st) return mossaDifficile(st, pk, mosse);
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
  function larghezza(maxN, gap, cap, availW) {
    var A = (availW != null ? availW : Math.min(window.innerWidth || 375, 600) - 46);
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
      ".sc-feltro{position:relative;flex:1;display:flex;flex-direction:column;min-height:0;background:radial-gradient(125% 95% at 50% 15%,#2fa268 0%,#1c7b4d 52%,#135c3a 100%);border:2px solid rgba(0,0,0,.35);border-radius:16px;box-shadow:inset 0 2px 16px rgba(0,0,0,.35),0 4px 12px rgba(0,0,0,.3);padding:8px 6px}",
      // mazzo sul tavolo (da cui si distribuisce): pila di dorsi + conteggio, in alto a sinistra
      ".sc-mazzo{position:absolute;top:8px;left:8px;z-index:2;display:flex;flex-direction:column;align-items:center;gap:3px;filter:drop-shadow(0 2px 5px rgba(0,0,0,.45))}",
      ".sc-mazzo .conta{font-size:.64rem;font-weight:800;color:#eafff1;background:rgba(0,0,0,.42);border-radius:999px;padding:1px 6px}",
      ".sc-mazzo.deal{animation:scPulse .5s ease}",
      "@keyframes scPulse{0%,100%{transform:none}42%{transform:scale(1.14) rotate(-3deg)}}",
      // le carte appena distribuite arrivano DAL MAZZO (in alto a sinistra) alla mano
      "@keyframes scDeal{0%{transform:translate(-38%,-220px) scale(.45) rotate(-8deg);opacity:0}45%{opacity:1}100%{transform:none;opacity:1}}",
      ".sc-deal{animation:scDeal .52s cubic-bezier(.2,.72,.3,1) backwards}",
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
      ".sc-prese{text-align:center;font-size:.74rem;margin-top:6px;color:rgba(255,255,255,.8)}",
      // ---- la stanza: avversario seduto dietro al tavolo in prospettiva (Scopa 1 contro 1) ----
      ".sc-scena{position:relative;overflow:hidden;border-radius:16px;background:radial-gradient(70% 50% at 50% 0%,rgba(255,214,140,.45),rgba(255,214,140,0) 70%),linear-gradient(#5a3a2a 0%,#3b2519 55%,#24160f 100%);box-shadow:inset 0 0 50px rgba(0,0,0,.55),0 4px 12px rgba(0,0,0,.3)}",
      ".sc-quadro{position:absolute;top:44px;width:54px;height:40px;border:4px solid #8a5a2b;box-shadow:0 4px 10px rgba(0,0,0,.4);opacity:.75}",
      ".sc-targa{position:absolute;left:50%;top:8px;transform:translateX(-50%);z-index:4;display:flex;align-items:center;gap:6px;background:rgba(10,18,50,.85);border:2px solid rgba(255,255,255,.18);border-radius:999px;padding:3px 11px;white-space:nowrap;transition:border-color .3s,box-shadow .3s}",
      ".sc-targa.turno{border-color:#ffd43b;box-shadow:0 0 14px rgba(255,212,59,.6)}",
      ".sc-targa .sc-nome{font-size:.8rem;max-width:140px}",
      ".sc-targa-sc{font-size:.72rem;font-weight:800;color:#ffe58a}",
      ".sc-avv{position:absolute;left:50%;z-index:1}",
      ".sc-avv-fig svg{display:block;width:100%;height:auto}",
      ".sc-avv-carte{position:absolute;left:50%;width:0;height:0;z-index:3}",
      ".sc-avv-carte .sc-dorso{position:absolute;border-radius:5px;transform-origin:50% 120%}",
      ".sc-fumetto{position:absolute;z-index:5;background:#fff;color:#1d2a5e;font-weight:900;border-radius:14px;padding:5px 10px;font-size:.85rem;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.35);transform-origin:0 100%;animation:scFum .28s cubic-bezier(.3,1.6,.5,1)}",
      ".sc-fumetto::after{content:'';position:absolute;left:-6px;bottom:6px;border:7px solid transparent;border-right-color:#fff;border-left:0}",
      ".sc-fumetto.scopa{background:linear-gradient(135deg,#ffe066,#ffb300);color:#3b2400;font-size:1.15rem}",
      ".sc-fumetto.scopa::after{border-right-color:#ffc21a}",
      "@keyframes scFum{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}",
      ".sc-prosp{position:absolute;inset:0;perspective-origin:50% 0%;z-index:2}",
      ".sc-piano{position:absolute;left:50%;bottom:0;transform-origin:50% 100%;border-radius:34px;background:linear-gradient(#6b3f1f,#4a2a14);padding:12px;box-shadow:0 -5px 0 #82502a inset;transform-style:preserve-3d}",
      ".sc-panno{position:relative;width:100%;height:100%;border-radius:24px;background:radial-gradient(90% 70% at 50% 30%,#35b273 0%,#1e8452 55%,#135c3a 100%);box-shadow:inset 0 0 26px rgba(0,0,0,.45);transform-style:preserve-3d}",
      ".sc-terra.sc-t3d{position:absolute;left:3%;right:3%;top:9%;bottom:4%;padding:0;transform-style:preserve-3d}",
      ".schermata.sc-piena{padding:env(safe-area-inset-top) 0 0 0}",
      ".sc-piena .sc-scena{border-radius:0;box-shadow:inset 0 0 50px rgba(0,0,0,.55)}",
      ".sc-piena .sc-mensola{margin:0;border-radius:0;padding-bottom:calc(8px + env(safe-area-inset-bottom))}",
      ".sc-testata{position:absolute;left:0;right:0;top:0;z-index:7;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 8px 0 54px;pointer-events:none}",
      ".sc-testata > *{pointer-events:auto}",
      ".sc-testata > div:first-child{background:rgba(10,18,50,.72);border:1.5px solid rgba(255,255,255,.15);border-radius:999px;padding:5px 12px;box-shadow:0 3px 8px rgba(0,0,0,.35)}",
      ".sc-scena .sc-quadro{top:62px}",
      ".sc-scena .sc-targa{top:56px}",
      ".sc-targa4{position:absolute;transform:translate(-50%,-100%);z-index:4;display:flex;align-items:center;gap:4px;background:rgba(10,18,50,.85);border:2px solid rgba(255,255,255,.18);border-radius:999px;padding:2px 8px;white-space:nowrap;font-weight:800;transition:border-color .2s,box-shadow .2s}",
      ".sc-targa4 .sc-nome{font-size:.7rem;max-width:92px;overflow:hidden;text-overflow:ellipsis}",
      ".sc-targa4{background:linear-gradient(180deg,#7a1f2b,#4e0f18);border-color:#ff6b6b}",
      ".sc-targa4.mia{background:linear-gradient(180deg,#1f7a44,#0f4e2a);border-color:#69db7c}",
      ".sc-scena .sc-targa{background:linear-gradient(180deg,#7a1f2b,#4e0f18);border-color:#ff6b6b}",
      ".sc-scena .sc-targa.turno{border-color:#ffd43b;box-shadow:0 0 14px rgba(255,212,59,.6)}",
      ".sc-targa4.turno{border-color:#ffd43b;box-shadow:0 0 12px rgba(255,212,59,.65)}",
      ".sc-aiuto{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:8;max-width:92%;text-align:center;background:rgba(10,18,50,.88);border:1.5px solid #69db7c;color:#fff;font-weight:800;font-size:.85rem;line-height:1.25;padding:6px 12px;border-radius:12px;pointer-events:none}",
      ".sc-panno .sc-mazzo{top:14px;left:16px}",
      // ---- solo Scopa 1 contro 1 ----
      ".sc-punti1{min-width:0;flex:0 1 auto;font-size:.8rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".sc-destra{display:flex;align-items:center;gap:6px;flex:0 0 auto}",
      // il mazzo che resta (e "Ultima mano!" quando è finito)
      ".sc-mazzino{display:flex;align-items:center;gap:5px;background:rgba(10,18,50,.72);border:1.5px solid rgba(255,255,255,.15);border-radius:999px;padding:3px 9px 3px 6px;font-size:.72rem;font-weight:800;color:#eafff1;white-space:nowrap;box-shadow:0 3px 8px rgba(0,0,0,.35)}",
      ".sc-mazzino i{display:inline-block;width:10px;height:16px;border-radius:2px;background:#b3161d;border:1.5px solid #f2e2be;box-sizing:border-box}",
      ".sc-mazzino.ultima{border-color:#ffd43b;color:#ffd43b}",
      ".sc-mazzino.ultima i{display:none}",
      // tocca a te: la mensola si illumina e le carte salgono un po'
      ".sc-mensola1{position:relative;transition:box-shadow .3s}",
      ".sc-mensola1.tuo{box-shadow:inset 0 2px 8px rgba(255,255,255,.07),0 -3px 0 #ffd43b,0 -8px 20px rgba(255,212,59,.45)}",
      ".sc-mensola1 .sc-carta{transition:transform .2s,opacity .2s}",
      ".sc-mensola1.tuo .sc-carta{transform:translateY(-4px)}",
      ".sc-mensola1 .sc-carta.sel,.sc-mensola1.tuo .sc-carta.sel{transform:translateY(-12px)}",
      ".sc-mensola1 .sc-carta.inviata{transform:translateY(-22px) scale(.94);opacity:.5}",
      ".sc-tocca{position:absolute;left:50%;top:-12px;transform:translateX(-50%);background:#ffd43b;color:#3b2400;font-weight:900;font-size:.72rem;border-radius:999px;padding:2px 11px;box-shadow:0 2px 6px rgba(0,0,0,.35);pointer-events:none;opacity:0;transition:opacity .25s;white-space:nowrap;z-index:2}",
      ".sc-mensola1.tuo .sc-tocca{opacity:1}",
      // scritte grandi sul tavolo (SCOPA!, carte rimaste, tre Re)
      ".sc-banner{position:absolute;left:50%;top:52%;z-index:8;transform:translate(-50%,-50%);max-width:88%;text-align:center;background:rgba(10,18,50,.9);border:2px solid #ffd43b;color:#fff;font-weight:900;font-size:.95rem;line-height:1.25;padding:8px 14px;border-radius:14px;pointer-events:none;box-shadow:0 6px 18px rgba(0,0,0,.45);animation:scBanner .35s cubic-bezier(.3,1.5,.5,1)}",
      ".sc-banner.scopa{background:linear-gradient(135deg,#ffe066,#ffb300);color:#3b2400;font-size:1.5rem;border-color:#fff3bf}",
      "@keyframes scBanner{from{transform:translate(-50%,-50%) scale(.4);opacity:0}to{transform:translate(-50%,-50%);opacity:1}}",
      ".sc-fumetto.lungo{white-space:normal;font-size:.76rem;line-height:1.2;font-weight:800;max-width:150px}",
      // avviso sopra al tavolo (avversario uscito)
      ".sc-avviso-sf{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px}",
      ".sc-avviso{background:#1d2a5e;border:2px solid rgba(255,255,255,.2);border-radius:18px;padding:18px 16px;max-width:330px;width:100%;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.5)}",
      ".sc-avviso p{margin:0 0 14px;font-weight:800;font-size:1.02rem;line-height:1.4}",
      // riepilogo di fine smazzata: le righe arrivano una alla volta
      ".sc-riep{max-width:440px;margin:0 auto}",
      ".sc-rg{display:grid;grid-template-columns:1fr 31% 31%;align-items:center;padding:4px 8px;border-radius:8px;background:rgba(255,255,255,.05);margin-bottom:4px;font-size:.92rem;animation:scRiga .35s ease-out backwards}",
      ".sc-rg > span:not(:first-child){text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".sc-rg.testa{background:none;font-weight:800;font-size:.8rem;padding-top:0;padding-bottom:0}",
      ".sc-rg .vinto{color:#69db7c;font-weight:900}",
      ".sc-rg .manca{font-size:.68rem;opacity:.75}",
      ".sc-piu{display:inline-block;font-size:.66rem;font-weight:900;background:#2b8a3e;color:#fff;border-radius:999px;padding:0 5px;margin-left:4px;vertical-align:1px}",
      ".sc-rg.tot{background:rgba(255,212,59,.12);font-size:1.25rem;font-weight:900}",
      ".sc-barra{height:7px;border-radius:99px;background:rgba(255,255,255,.14);overflow:hidden;margin:0 6px}",
      ".sc-barra b{display:block;height:100%;transform-origin:0 50%;border-radius:99px;transition:transform .8s ease-out .6s}",
      ".sc-detto{text-align:center;font-weight:800;font-size:.9rem;margin-top:8px;animation:scRiga .35s ease-out backwards}",
      "@keyframes scRiga{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}"
    ].join("");
    document.head.appendChild(st);
  }
  function cartaEl(el, carta, w, extra, onclick) {
    var d = el("div", { class: "sc-carta" + (extra ? " " + extra : ""), onclick: onclick || null });
    d.appendChild(el("img", { src: "carte/" + carta.id + ".jpg", width: w, height: Math.round(w * ASP_CARTA), alt: "", draggable: "false" }));
    return d;
  }
  function dorsoEl(el, w) { var h = Math.round(w * ASP_CARTA); return el("div", { class: "sc-dorso", style: "width:" + w + "px;height:" + h + "px" }); }
  // il MAZZO sul tavolo: pila di dorsi (fino a 3) + quante carte restano
  function mazzo(el, n, w) {
    w = w || 26;
    var wrap = el("div", { class: "sc-mazzo" });
    var st = Math.min(3, n), pila = el("div", { style: "position:relative;width:" + (w + (st - 1) * 2) + "px;height:" + (Math.round(w * ASP_CARTA) + (st - 1) * 2) + "px" });
    for (var i = 0; i < st; i++) { var d = dorsoEl(el, w); d.style.position = "absolute"; d.style.left = (i * 2) + "px"; d.style.top = (i * 2) + "px"; pila.appendChild(d); }
    wrap.appendChild(pila);
    wrap.appendChild(el("div", { class: "conta", text: String(n) }));
    return wrap;
  }
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

  // ---------- avatar dell'avversario seduto al tavolo ----------
  // il bot ha sempre la stessa faccia; online arriva l'avatar vero dell'altro
  var AVATAR_BOT = { forma: "uomo", corpo: "medio", pelle: 2, capelli: "ciuffo", colCap: 1, barba: "corta", capo: "felpa", maglia: 1,
    cappello: "cappellino", colAcc: 0, sopracc: "decise", occhi: "furbi", bocca: "ghigno" };
  var FACCE = {
    normale: {},
    pensa: { occhi: "assonnati", sopracc: "alzate", bocca: "neutro" },
    esulta: { occhi: "felici", sopracc: "alzate", bocca: "sorrisone" },
    triste: { occhi: "dolci", sopracc: "preoccupate", bocca: "smorfia" }
  };
  function mioAvatar(nome) {
    var p = window.SGNube && SGNube.profilo && SGNube.profilo();
    if (p && p.omino) return p.omino;
    return window.SGOmino ? SGOmino.casuale(nome || "io") : null;
  }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  // l'avversario di questa stanza, ricordato sul telefono dell'host: se la pagina dell'host si ricarica (la stanza si
  // riapre con lo stesso codice), per 15 secondi il posto resta a chi giocava, non a chi guardava ed è stato più svelto
  function ricordaAvv(gioco, codice, id) { try { if (codice && codice !== "…") localStorage.setItem("sg-avv-" + gioco, JSON.stringify({ c: codice, id: id || null, t: Date.now() })); } catch (e) {} }
  function riservaAvv(gioco, codice) {
    try { var x = JSON.parse(localStorage.getItem("sg-avv-" + gioco) || "null"); if (x && x.c === codice && x.id && Date.now() - x.t < 20 * 60000) return { id: x.id, fino: Date.now() + 15000 }; } catch (e) {}
    return null;
  }
  function postoRiservato(r, id) { return !!(r && r.id !== id && Date.now() < r.fino); }   // true = questo posto non è (ancora) per lui
  var svgCache = {};   // disegni già pronti (un avatar per espressione): non si rifanno a ogni mossa
  function svgAvatar(cfg, faccia) {
    var k = JSON.stringify(cfg) + "|" + faccia;
    if (!svgCache[k]) {
      var c = {}, x = FACCE[faccia] || {}, n;
      for (n in cfg) c[n] = cfg[n];
      for (n in x) c[n] = x[n];
      svgCache[k] = SGOmino.svg(c);
    }
    return svgCache[k];
  }

  // =====================================================================
  //  STANZA A 4 (Scopa 2 vs 2 e Scopone): compagno di fronte, i due avversari agli angoli del tavolo,
  //  tutti con avatar ed espressioni; tavolo a POSTI FISSI (8 posti, 4 per fila); distribuzione animata.
  // =====================================================================
  var stanzaCorr = {};   // correzione dell'altezza per gioco, misurata sullo schermo vero
  function misureStanza4(gioco, wH, righeMano) {
    var alt = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--alt")) || window.innerHeight || 700;
    var k = alt + "x" + (window.innerWidth || 0), c = stanzaCorr[gioco];
    if (!c || c.k !== k) c = stanzaCorr[gioco] = { k: k, v: 0, fatto: false };
    var scW = Math.min(window.innerWidth || 375, 600);   // la stanza va da bordo a bordo
    var manoH = righeMano * Math.round(wH * ASP_CARTA) + (righeMano - 1) * 6;
    var scH = Math.max(300, Math.min(900, Math.round(alt - (manoH + 52) + c.v)));
    var pianoW = Math.round(scW * 1.14), pianoH = Math.round(scH * 0.6);
    var tavAw = Math.min((pianoW - 24) * 0.94 - 4, scW - 22), tavAh = (pianoH - 24) * 0.87;
    var wT = Math.max(26, Math.min(110, Math.floor((tavAw - 15) / 4), Math.floor((tavAh - 5) / 2 / ASP_CARTA)));
    return { alt: alt, scW: scW, scH: scH, pianoW: pianoW, pianoH: pianoH, tavAw: tavAw, tavAh: tavAh, wT: wT, corr: c };
  }
  // dopo il montaggio: se avanza o manca spazio sotto la mensola, rifà subito la stanza della misura giusta (una volta per schermo)
  function correggiStanza4(M, sch, mensola, rifai) {
    if (M.corr.fatto) return false;
    // (misurato sulla schermata, non su tutta la pagina: pillole, la schermata di prima che esce o altro non falsano il conto)
    var rS = sch.getBoundingClientRect(), padB = parseFloat(getComputedStyle(sch).paddingBottom) || 0;
    if (!(rS.height > 0)) return false;   // (non ancora sullo schermo: si misura la volta dopo)
    M.corr.fatto = true;
    var trabocca = Math.max(0, sch.offsetTop + sch.offsetHeight - M.alt);
    var avanza = Math.floor((rS.bottom - padB - mensola.getBoundingClientRect().bottom) - trabocca);
    if (Math.abs(avanza) > 3) { M.corr.v += avanza; rifai(); return true; }
    return false;
  }
  // dopo il primo disegno con le carte (la mensola può crescere di qualche pixel col testo sotto la mano): se la
  // schermata esce ancora dallo schermo, la stanza si accorcia una volta (true = da rifare). Una volta per schermo.
  function ricontrollaStanza4(M, sch) {
    if (!M.corr.fatto || M.corr.ri || !sch || !(sch.offsetHeight > 0)) return false;
    M.corr.ri = true;
    var trabocca = sch.offsetTop + sch.offsetHeight - M.alt;
    if (trabocca > 1) { M.corr.v -= Math.ceil(trabocca); return true; }
    return false;
  }
  // posti fissi: stato = { idCarta: posto } che il gioco conserva fra un disegno e l'altro
  function postiTavolo(stato, carte, M) {
    var ids = {}, k, occ = {};
    carte.forEach(function (c) { ids[c.id] = true; });
    for (k in stato) if (!ids[k]) delete stato[k];   // chi è andato via libera il posto (gli altri NON si muovono)
    for (k in stato) occ[stato[k]] = true;
    carte.forEach(function (c) { if (stato[c.id] != null) return; var p = 0; while (occ[p]) p++; stato[c.id] = p; occ[p] = true; });
    var maxP = 0; for (k in stato) maxP = Math.max(maxP, stato[k] + 1);
    var col = 4, righe = Math.ceil(Math.max(8, maxP) / col), w = M.wT;
    if (righe > 2) w = Math.max(26, Math.min(w, Math.floor((M.tavAh - (righe - 1) * 5) / righe / ASP_CARTA)));   // solo con 9+ carte
    return {
      w: w,
      griglia: function (el) { return el("div", { style: "display:grid;grid-template-columns:repeat(" + col + "," + w + "px);grid-template-rows:repeat(" + righe + "," + Math.round(w * ASP_CARTA) + "px);gap:5px;justify-content:center;align-content:center;height:100%" }); },
      metti: function (cel, id) { var p = stato[id] || 0; cel.style.gridColumn = (p % col + 1); cel.style.gridRow = (Math.floor(p / col) + 1); return cel; }
    };
  }
  // i bot hanno sempre la stessa faccia: Bot la sua, gli altri stabili dal nome (e donna se il nome è da donna)
  var BOT_DONNA = { Giulia: "coda", Rosa: "riccilunghi" }, BOT_UOMO = { Toni: "spettinati", Peppe: "stempiato" };
  function facciaBot(nome) {
    if (nome === "Bot") return AVATAR_BOT;
    if (!window.SGOmino) return null;
    var c = SGOmino.casuale(nome);
    if (BOT_DONNA[nome]) { c.forma = "donna"; c.barba = "no"; c.capelli = BOT_DONNA[nome]; }
    else if (BOT_UOMO[nome]) { c.forma = "uomo"; c.capelli = BOT_UOMO[nome]; c.orecchini = "nessuno"; if (/^(fiocco|mollette|cerchietto)$/.test(c.cappello)) c.cappello = "nessuno"; c.trucco = "nessuno"; c.ombretto = c.eyeliner = c.mascara = c.rossetto = c.blush = "nessuno"; if (/^(gonna|minigonna|gonnapieghe|gonnatubino|gonnalunga)$/.test(c.sotto)) c.sotto = "jeans"; }
    return c;
  }
  // la stanza: sedie = [sinistra, compagno (di fronte), destra], ognuna { cfg, nome, n, turno, mia, faccia, fumetto }
  function stanza4(el, M, sedie) {
    var scena = el("div", { class: "sc-scena", style: "height:" + M.scH + "px" });
    scena.appendChild(el("div", { class: "sc-quadro", style: "left:16px;top:62px;background:linear-gradient(135deg,#3f6b8f,#9cc4d9 60%,#e7d9a8)" }));
    scena.appendChild(el("div", { class: "sc-quadro", style: "right:16px;top:62px;background:linear-gradient(135deg,#8f3f5c,#e3a26b 60%,#f2e3b5)" }));
    var posti = sedie.map(function (p) {
      var cfg = p.cfg || facciaBot(p.nome);
      var box = el("div", { class: "sc-avv" + (p.faccia === "pensa" ? " pensa" : "") }), fig = el("div", { class: "sc-avv-fig", html: cfg && window.SGOmino ? svgAvatar(cfg, p.faccia || "normale") : "" });
      box.appendChild(fig);
      if (p.fumetto) box.appendChild(el("div", { class: "sc-fumetto" + (p.faccia === "esulta" ? " scopa" : ""), text: p.fumetto }));
      var targa = el("div", { class: "sc-targa4" + (p.turno ? " turno" : "") + (p.mia ? " mia" : "") }, [
        el("span", { class: "sc-nome", text: (p.mia ? "🤝 " : "") + p.nome }), el("span", { class: "sc-num", text: p.n }) ]);
      var vent = el("div", { class: "sc-avv-carte" });
      for (var i = 0; i < p.n; i++) vent.appendChild(el("div", { class: "sc-dorso" }));
      scena.appendChild(vent); scena.appendChild(box); scena.appendChild(targa);
      return { box: box, fig: fig, targa: targa, vent: vent, p: p };
    });
    var prosp = el("div", { class: "sc-prosp", style: "perspective:" + Math.max(600, Math.round(M.scH * 1.15)) + "px" });
    var piano = el("div", { class: "sc-piano", style: "width:" + M.pianoW + "px;height:" + M.pianoH + "px;margin-left:" + (-M.pianoW / 2) + "px;transform:rotateX(54deg)" });
    var feltro = el("div", { class: "sc-panno" });
    piano.appendChild(feltro); prosp.appendChild(piano); scena.appendChild(prosp);
    function siedi() {   // dopo il montaggio: ognuno seduto con la vita al bordo lontano del tavolo
      var bordo = piano.getBoundingClientRect().top - scena.getBoundingClientRect().top, sw = scena.clientWidth;
      var w = Math.max(70, Math.min(Math.round(sw * 0.34), 150, Math.round((bordo + 6 - 30) / 0.975)));
      posti.forEach(function (s, i) {
        var cx = Math.round(sw * [0.2, 0.5, 0.8][i]), top = Math.round(bordo + 6 - w * 0.975);
        s.box.style.width = w + "px"; s.box.style.left = (cx - w / 2) + "px"; s.box.style.marginLeft = "0"; s.box.style.top = top + "px";
        s.targa.style.left = cx + "px"; s.targa.style.top = Math.round(top + w * 0.1) + "px";
        var cw = Math.round(w * 0.16), ch = Math.round(cw * ASP_CARTA), n = s.vent.children.length, ang = n > 5 ? 6 : 12;
        s.vent.style.left = cx + "px"; s.vent.style.top = Math.round(top + w * 0.76) + "px";
        [].forEach.call(s.vent.children, function (d, k) {
          var a = (k - (n - 1) / 2) * ang;
          d.style.width = cw + "px"; d.style.height = ch + "px"; d.style.left = (-cw / 2) + "px";
          d.style.transform = "translateX(" + (a * 1.1) + "px) rotate(" + a + "deg)";
        });
        var fm = s.box.querySelector(".sc-fumetto");
        if (fm) { fm.style.left = Math.round(w * (i === 2 ? 0.05 : 0.7)) + "px"; fm.style.top = Math.round(w * 0.15) + "px"; }
        if (s.p.faccia === "esulta" && s.p.salta && s.fig.animate) s.fig.animate([{ transform: "none" }, { transform: "translateY(-18px)" }, { transform: "none" }], { duration: 650, easing: "ease-out" });
      });
    }
    // gli altri guardano chi deve giocare (solo gli occhi): verso la sedia di turno, o in basso se tocca a te
    var diTurno = -1; sedie.forEach(function (p, i) { if (p.turno) diTurno = i; });
    posti.forEach(function (s, i) {
      var oc = s.fig.querySelector(".om-occhi"); if (!oc || s.p.turno) return;
      var dx = diTurno < 0 ? 0 : (diTurno > i ? 3 : (diTurno < i ? -3 : 0)), dy = diTurno < 0 && sedie.ioTurno ? 2.5 : 0;
      if (dx || dy) oc.style.translate = dx + "px " + dy + "px";
    });
    return { scena: scena, feltro: feltro, siedi: siedi, posti: posti };
  }
  // distribuzione come dal vero: prima le carte nuove in tavola, poi a giro (tu, poi gli altri tre nell'ordine delle sedie).
  // Restituisce quando finisce (ms dal momento della chiamata), così i bot aspettano.
  function animaDistribuzione4(nuoveTav, manoEls, dorsiPerSedia, feltro, passo) {
    var t0 = 0;
    nuoveTav.forEach(function (cel, i) {
      if (!cel.animate) return;
      cel.animate([{ translate: "0 -120px", scale: "0.5", opacity: 0 }, { translate: "0 0", scale: "1", opacity: 1 }],
        { duration: 420, delay: i * 200, easing: "cubic-bezier(.2,.7,.3,1)", fill: "backwards" });
    });
    if (nuoveTav.length) t0 = nuoveTav.length * 0.2 + 0.2;
    var fr = feltro.getBoundingClientRect(), ox = fr.left + fr.width / 2, oy = fr.top + fr.height * 0.4;
    function vola(e, rit) {
      if (!e || !e.animate) return;
      var r = e.getBoundingClientRect();
      e.animate([{ translate: Math.round(ox - (r.left + r.width / 2)) + "px " + Math.round(oy - (r.top + r.height / 2)) + "px", scale: "0.4", opacity: 0 },
        { opacity: 1, offset: 0.25 }, { translate: "0 0", scale: "1", opacity: 1 }], { duration: 420, delay: rit * 1000, easing: "cubic-bezier(.2,.7,.3,1)", fill: "backwards" });
    }
    var n = manoEls.length; dorsiPerSedia.forEach(function (d) { n = Math.max(n, d.length); });
    var giro = 1 + dorsiPerSedia.length;
    for (var k = 0; k < n; k++) {
      vola(manoEls[k], t0 + (k * giro) * passo);
      dorsiPerSedia.forEach(function (d, j) { vola(d[k], t0 + (k * giro + 1 + j) * passo); });
    }
    return (t0 + n * giro * passo) * 1000 + 450;
  }

  // ---------- battute di Bot nei fumetti (la lista lunga è in data/scopa-battute.js; qui poche di riserva) ----------
  var BATTUTE_BASE = {
    pensa: ["Mmh… e mo' che butto?", "Aspetta, fammi pensà…"],
    prende: ["Chesta è 'a mia!", "Vieni a papà!"],
    settebello: ["Settebello, viene a papà!"],
    scopa: ["Scopa! Pulito pulito!"],
    subisce: ["Mannaggia!", "Questa me la lego al dito."],
    vince: ["Ho vinto! Rivincita?"],
    perde: ["Complimenti, hai vinto tu!"],
    pari: ["Pari e patta: nessuno piange!"]
  };
  function numeroDa(s) { var h = 7; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  // la stessa situazione dà sempre la stessa battuta (ridisegnando non cambia, e chi guarda vede la stessa)
  function battuta(momento, seme) {
    var L = (window.SG_SCOPA_BATTUTE && window.SG_SCOPA_BATTUTE[momento]) || BATTUTE_BASE[momento] || [];
    return L.length ? L[numeroDa(momento + seme) % L.length] : null;
  }
  function corto(n, max) { n = String(n == null ? "" : n); return n.length > max ? n.slice(0, max - 1) + "…" : n; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // ---------- vista (uguale per bot/host/ospite) ----------
  // vm = { fase, io("A"|"B"), turno, nomi, mano:[carte], oppN, tavolo:[carte], mazzoN,
  //        preseIo, preseOpp, scopeIo, scopeOpp, settebelloIo, settebelloOpp,
  //        punti:{io,opp}, ultimoRound, presa:{mio,carta,presi,scopa,resto}|null, vincitoreIo,
  //        idPartita, nRound, rifatta, bot (contro il computer), idB (id dell'ospite online) }
  // C = { vm, sel:{carta,presa}, disegna, uscito } ; cb = { onMossa(id,presa|null), onAvanti, onEsci, sonoHost, guarda... }
  var scSlot = {};   // id carta in tavola -> numero del suo posto (resta fermo finché non viene presa)
  var scCorr = { k: null, v: 0 };   // correzione dell'altezza della stanza, misurata sullo schermo vero
  var scMount = null; // la stanza già montata: si aggiorna SOLO quello che cambia (niente lampeggio)

  // girato il telefono o cambiata l'altezza dello schermo: la stanza si rifà subito della misura giusta
  var scGiraT = null;
  window.addEventListener("resize", function () {
    clearTimeout(scGiraT);
    scGiraT = setTimeout(function () {
      var m = scMount;
      if (m && m.C && !m.C.uscito && m.C.vm && m.C.vm.fase === "gioco" && document.body.contains(m.s)) m.C.disegna();
    }, 250);
  });

  function misureScopa(sotto) {   // sotto: px in più sotto la mensola (la fila delle faccine di chi guarda)
    sotto = sotto || 0;
    var wH = larghezza(3, 10, 104);   // mano max 3
    var scW = Math.min(window.innerWidth || 375, 600);   // la stanza va da bordo a bordo
    // altezza della stanza: TUTTO lo spazio che resta sullo schermo vero (--alt), poi corretta misurando dopo il montaggio
    var alt = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--alt")) || window.innerHeight || 700;
    var chiave = alt + "x" + (window.innerWidth || 0) + (sotto ? "f" + sotto : "");
    if (scCorr.k !== chiave) scCorr = { k: chiave, v: 0 };
    var scH = Math.max(300, Math.min(900, Math.round(alt - (Math.round(wH * ASP_CARTA) + 52 + sotto) + scCorr.v)));
    var pianoW = Math.round(scW * 1.14), pianoH = Math.round(scH * 0.7);
    return { wH: wH, scW: scW, alt: alt, scH: scH, pianoW: pianoW, pianoH: pianoH, k: chiave + "|" + scCorr.v, sotto: sotto,
      tavAw: Math.min((pianoW - 24) * 0.94 - 4, scW - 22), tavAh: (pianoH - 24) * 0.87 };
  }

  // la stanza si costruisce UNA volta (avversario, quadri, tavolo, mensola); poi si aggiornano solo i pezzi
  function montaScopa(t, C, cb, Mi) {
    var el = t.el, m = { C: C, k: Mi.k, Mi: Mi, tav: {}, mano: {}, prevMano: 0 };
    var box = el("div", { style: "display:flex;flex-direction:column" });
    var head = el("div", { class: "sc-testata" });   // punteggio, mazzo e musica DENTRO la stanza (a sinistra c'è il tasto indietro)
    m.punti = el("div", { class: "sc-punti1" });
    m.mazzino = el("div", { class: "sc-mazzino" });
    head.appendChild(m.punti);
    var destra = el("div", { class: "sc-destra" }, [m.mazzino]);
    if (window.SGMusica && !cb.guarda) destra.appendChild(window.SGMusica.bottone(el));
    head.appendChild(destra);
    var scena = el("div", { class: "sc-scena", style: "height:" + Mi.scH + "px" });
    scena.appendChild(head);
    scena.appendChild(el("div", { class: "sc-quadro", style: "left:16px;background:linear-gradient(135deg,#3f6b8f,#9cc4d9 60%,#e7d9a8)" }));
    scena.appendChild(el("div", { class: "sc-quadro", style: "right:16px;background:linear-gradient(135deg,#8f3f5c,#e3a26b 60%,#f2e3b5)" }));
    m.targaNome = el("span", { class: "sc-nome" }); m.targaNum = el("span", { class: "sc-num" }); m.targaSc = el("span", { class: "sc-targa-sc" });
    m.targa = el("div", { class: "sc-targa" }, [m.targaNome, m.targaNum, m.targaSc]);
    scena.appendChild(m.targa);
    m.ventaglio = el("div", { class: "sc-avv-carte" }); scena.appendChild(m.ventaglio);
    m.avv = el("div", { class: "sc-avv" }); m.avvFig = el("div", { class: "sc-avv-fig" }); m.avv.appendChild(m.avvFig); scena.appendChild(m.avv);
    var prosp = el("div", { class: "sc-prosp", style: "perspective:" + Math.max(600, Math.round(Mi.scH * 1.15)) + "px" });
    m.piano = el("div", { class: "sc-piano", style: "width:" + Mi.pianoW + "px;height:" + Mi.pianoH + "px;margin-left:" + (-Mi.pianoW / 2) + "px;transform:rotateX(54deg)" });
    var feltro = el("div", { class: "sc-panno" });
    m.area = el("div", { class: "sc-terra sc-t3d" });
    m.griglia = el("div", { style: "display:grid;gap:5px;justify-content:center;align-content:center;height:100%" });
    m.area.appendChild(m.griglia); feltro.appendChild(m.area);
    m.piano.appendChild(feltro); prosp.appendChild(m.piano); scena.appendChild(prosp);
    m.feltro = feltro; m.scena = scena;
    m.aiuto = el("div", { class: "sc-aiuto" }); m.aiuto.hidden = true; scena.appendChild(m.aiuto);
    box.appendChild(scena);
    m.mensola = el("div", { class: "sc-mensola sc-mensola1", style: "min-height:" + (Math.round(Mi.wH * ASP_CARTA) + 34) + "px" });
    m.tocca = el("div", { class: "sc-tocca" });
    m.manoRiga = el("div", { class: "sc-mano-riga" });
    m.prese = el("div", { class: "sc-prese" });
    m.mensola.appendChild(m.tocca); m.mensola.appendChild(m.manoRiga); m.mensola.appendChild(m.prese);
    box.appendChild(m.mensola);
    // chi è in più e guarda (stanza online): sotto la mensola la fila delle faccine
    m.fa = null;
    if (Mi.sotto && t.faccine) { var fa = t.faccine(); if (fa) { fa.style.margin = "6px 8px 0"; box.appendChild(fa); m.fa = fa; } }
    var s = t.schermata({ indietro: function () { if (cb.guarda || window.confirm("Uscire dalla partita?")) cb.onEsci(); } });
    s.classList.add("sc-piena");   // stanza da bordo a bordo
    s._contenuto.appendChild(box);
    m.s = s;
    t.mostra(s);
    // l'avversario seduto: il bordo lontano del tavolo gli arriva in vita
    var bordo = m.piano.getBoundingClientRect().top - scena.getBoundingClientRect().top;
    var w = Math.max(90, Math.min(Math.round(Mi.scW * 0.46), 190, Math.round((bordo + 6 - 22) / 0.975)));
    m.avvW = w; m.cw = Math.round(w * 0.17);
    m.avv.style.width = w + "px"; m.avv.style.marginLeft = (-w / 2) + "px";
    m.avv.style.top = Math.round(bordo + 6 - w * 0.975) + "px";
    m.ventaglio.style.top = Math.round(bordo + 6 - w * 0.975 + w * 0.76) + "px";
    // tocchi: guardano lo stato di adesso (le carte restano le stesse fra un disegno e l'altro)
    m.aspetta = function () {   // tocco quando non è il tuo turno
      var vm = C.vm; if (cb.guarda || !vm || vm.fase !== "gioco") return;
      m.aiutoTemp = C.inviata ? "Carta giocata, un attimo…" : (vm.turno !== vm.io && vm.oppN ? "Aspetta: tocca a " + vm.nomi.opp : "Aspetta un attimo…");
      clearTimeout(m.aiutoT); m.aiutoT = setTimeout(function () { m.aiutoTemp = null; aggiornaAiuto(m); }, 1600);
      aggiornaAiuto(m);
    };
    return m;
  }
  function aggiornaAiuto(m) {
    var txt = m.aiutoTemp || m.aiutoFisso || null;
    if (txt) { if (m.aiuto.textContent !== txt) m.aiuto.textContent = txt; m.aiuto.hidden = false; }
    else m.aiuto.hidden = true;
  }
  function misuraCarta(cel, w) {   // cambia misura solo se serve (9+ carte in tavola)
    if (cel._w === w) return;
    cel._w = w; var img = cel.firstChild;
    if (img) { img.setAttribute("width", w); img.setAttribute("height", Math.round(w * ASP_CARTA)); }
  }
  function sceltaBanner(m, txt, cls) {   // le scritte grandi sul tavolo: si rifanno solo quando cambiano
    if (m.bannerTxt === txt) return;
    m.bannerTxt = txt;
    if (m.banner) { m.banner.remove(); m.banner = null; }
    if (txt) { m.banner = m.C._el("div", { class: "sc-banner" + (cls || ""), text: txt }); m.scena.appendChild(m.banner); }
  }

  function renderScopa(t, C, cb) {
    if (C.uscito) return;
    assicuraStile();
    if (window.SGMusica && !cb.guarda) window.SGMusica.avvia();   // chi guarda non ha suoni
    var el = t.el, vm = C.vm, Mi = misureScopa(cb.spettatore && t.faccine ? 50 : 0);
    var chiaveRound = vm.idPartita + ":" + vm.nRound;
    var m = scMount, nuovo = !(m && m.C === C && m.k === Mi.k && document.body.contains(m.s));
    if (nuovo) {
      var vecchio = m;
      m = scMount = montaScopa(t, C, cb, Mi);
      if (vecchio && vecchio.C === C && vecchio.round === chiaveRound) m.prevMano = vecchio.prevMano;   // rifatta per un giro del telefono: niente distribuzione
    }
    C._schermo = m.s;
    var mioTurno = !cb.guarda && vm.turno === vm.io && vm.fase === "gioco" && !vm.presa && !C.inviata && vm.mano.length > 0;
    var suoTurno = vm.turno === vm.io && vm.fase === "gioco" && !vm.presa && vm.mano.length > 0;   // (anche per chi guarda)
    var oppTurno = vm.turno !== vm.io && vm.fase === "gioco" && !vm.presa && vm.oppN > 0;
    m.mioTurno = mioTurno;

    // ---- in alto: punti, mazzo che resta ----
    var pTxt = (cb.guarda ? "👀 " : "") + "<b>" + esc(corto(vm.nomi.io, 9)) + " " + vm.punti.io + "</b> — " + esc(corto(vm.nomi.opp, 9)) + " " + vm.punti.opp +
      " <span class='tenue' style='font-weight:600'>(" + testoTraguardo(vm.traguardo) + ")</span>";
    if (m.pTxt !== pTxt) { m.pTxt = pTxt; m.punti.innerHTML = pTxt; }
    var ultima = !vm.mazzoN && (vm.mano.length || vm.oppN);
    var mzTxt = vm.mazzoN ? "<i></i>" + vm.mazzoN : (ultima ? "Ultima mano!" : "<i></i>0");
    if (m.mzTxt !== mzTxt) { m.mzTxt = mzTxt; m.mazzino.innerHTML = mzTxt; m.mazzino.className = "sc-mazzino" + (ultima ? " ultima" : ""); m.mazzino.title = vm.mazzoN ? "Carte rimaste nel mazzo" : ""; }

    // ---- l'avversario: targa, faccia, fumetto, carte in mano ----
    m.targaNome.textContent = corto(vm.nomi.opp, 16);
    m.targaNum.textContent = vm.oppN;
    m.targaSc.textContent = vm.scopeOpp ? "🧹 " + vm.scopeOpp : "";
    m.targaSc.hidden = !vm.scopeOpp;
    m.targa.classList.toggle("turno", oppTurno);
    var chiavePresa = vm.presa ? (vm.presa.carta ? vm.presa.carta.id : "resto") + ":" + (vm.presa.presiIds || []).join(",") : null;
    var faccia = "normale", fumetto = null;
    if (vm.presa && vm.presa.scopa) {
      faccia = vm.presa.mio ? "triste" : "esulta";
      if (!vm.presa.mio) fumetto = "🧹 " + (vm.bot ? battuta("scopa", chiavePresa) : "SCOPA!");
      else if (vm.bot) fumetto = battuta("subisce", chiavePresa);
    } else if (vm.presa && !vm.presa.resto) {
      var conSette = vm.presa.carta.id === "D7" || (vm.presa.presi || []).some(function (c) { return c.id === "D7"; });
      if (!vm.presa.mio && conSette) { faccia = "esulta"; if (vm.bot) fumetto = battuta("settebello", chiavePresa); }
      else if (vm.presa.mio && conSette) faccia = "triste";
      else if (!vm.presa.mio && vm.bot && numeroDa(chiavePresa) % 2 === 0) fumetto = battuta("prende", chiavePresa);
    } else if (oppTurno) {
      faccia = "pensa";
      var chiavePensa = chiaveRound + ":" + vm.mazzoN + ":" + vm.oppN + ":" + vm.tavolo.length;
      fumetto = vm.bot && numeroDa(chiavePensa) % 3 === 0 ? battuta("pensa", chiavePensa) : "🤔";
    }
    var cfgAvv = (vm.avatar && vm.avatar.opp) || (window.SGOmino ? SGOmino.casuale(vm.nomi.opp) : null);
    if (cfgAvv && window.SGOmino) {
      var kF = JSON.stringify(cfgAvv) + "|" + faccia;
      if (m.facciaK !== kF) { m.facciaK = kF; m.avvFig.innerHTML = svgAvatar(cfgAvv, faccia); }
      m.avv.classList.toggle("pensa", faccia === "pensa");
    }
    if (m.fumTxt !== fumetto) {
      m.fumTxt = fumetto;
      if (m.fum) { m.fum.remove(); m.fum = null; }
      if (fumetto) {
        var lungo = fumetto.length > 4;
        m.fum = el("div", { class: "sc-fumetto" + (faccia === "esulta" && /🧹/.test(fumetto) ? " scopa" : "") + (lungo ? " lungo" : ""), text: fumetto });
        m.fum.style.left = Math.round(m.avvW * 0.74) + "px"; m.fum.style.top = Math.round(m.avvW * (lungo ? 0.08 : 0.2)) + "px";
        if (lungo) m.fum.style.maxWidth = Math.max(110, Math.round(Mi.scW / 2 - m.avvW * 0.24 - 10)) + "px";
        m.avv.appendChild(m.fum);
      }
    }
    // la scopa (o il settebello) dell'avversario: salta dalla gioia (una volta sola per presa)
    if (faccia === "esulta" && chiavePresa !== m.salto && m.avvFig.animate) {
      m.salto = chiavePresa;
      m.avvFig.animate([{ transform: "none" }, { transform: "translateY(-22px)" }, { transform: "none" }, { transform: "translateY(-10px)" }, { transform: "none" }], { duration: 800, easing: "ease-out" });
    }
    var nuoviDorsi = [], v = m.ventaglio;
    while (v.children.length > vm.oppN) v.removeChild(v.lastChild);
    while (v.children.length < vm.oppN) { var dd = el("div", { class: "sc-dorso" }); v.appendChild(dd); nuoviDorsi.push(dd); }
    var ch = Math.round(m.cw * ASP_CARTA);
    [].forEach.call(v.children, function (d, i) {
      var ang = (i - (vm.oppN - 1) / 2) * 13;
      d.style.width = m.cw + "px"; d.style.height = ch + "px"; d.style.left = (-m.cw / 2) + "px";
      d.style.transform = "translateX(" + (ang * 1.1) + "px) rotate(" + ang + "deg)";
    });

    // ---- il tavolo: POSTI FISSI, ogni carta resta nel suo posto finché non viene presa (niente carte che "saltano") ----
    var carteTav = (vm.presa && vm.presa.tavoloPrima ? vm.presa.tavoloPrima : vm.tavolo), idsTav = {};
    carteTav.forEach(function (c) { idsTav[c.id] = true; });
    for (var sid in scSlot) if (!idsTav[sid]) delete scSlot[sid];   // le carte andate via liberano il posto
    var occupati = {}; for (sid in scSlot) occupati[scSlot[sid]] = true;
    carteTav.forEach(function (c) {
      if (scSlot[c.id] != null) return;
      var p = 0; while (occupati[p]) p++;
      scSlot[c.id] = p; occupati[p] = true;
    });
    var maxPosto = 0; for (sid in scSlot) maxPosto = Math.max(maxPosto, scSlot[sid] + 1);
    var nPosti = Math.max(8, maxPosto);
    // carte in tavola: grandezza FISSA (8 posti, 4 per fila, 2 file); solo con 9 o più si rimpiccioliscono quanto basta
    var wT = Math.min(110, Math.floor((Mi.tavAw - 15) / 4), Math.floor((Mi.tavAh - 5) / 2 / ASP_CARTA));
    if (carteTav.length > 8) {
      for (var pr = 1, best = 0; pr <= carteTav.length; pr++) {
        var rr = Math.ceil(carteTav.length / pr), ww = Math.min(110, Math.floor((Mi.tavAw - (pr - 1) * 5) / pr), Math.floor((Mi.tavAh - (rr - 1) * 5) / rr / ASP_CARTA));
        if (ww > best) best = ww;
      }
      wT = Math.min(wT, best);
    }
    wT = Math.max(26, wT);
    var maxFila = Math.max(1, Math.floor((Mi.tavAw + 5) / (wT + 5)));
    var colT = nPosti <= 8 ? Math.min(4, maxFila) : Math.min(maxFila, Math.ceil(nPosti / Math.ceil(nPosti / maxFila)));
    var righeT = Math.ceil(nPosti / colT);
    var gK = colT + "x" + righeT + "x" + wT;
    if (m.gK !== gK) {   // le file restano anche vuote: il tavolo non si sposta mai
      m.gK = gK;
      m.griglia.style.gridTemplateColumns = "repeat(" + colT + "," + wT + "px)";
      m.griglia.style.gridTemplateRows = "repeat(" + righeT + "," + Math.round(wT * ASP_CARTA) + "px)";
    }
    var cartaSel = C.sel.carta ? trova(vm.mano, C.sel.carta) : null;
    var opts = (mioTurno && cartaSel) ? catture(cartaSel.v, vm.tavolo) : [];
    // verdi solo le carte che, con quelle già scelte, portano ancora a una presa giusta
    var verdi = {}, cliccabili = {};
    opts.forEach(function (set) {
      if (!C.sel.presa.every(function (id) { return set.indexOf(id) >= 0; })) return;
      set.forEach(function (id) { if (C.sel.presa.indexOf(id) < 0) verdi[id] = true; });
    });
    for (var vid in verdi) cliccabili[vid] = true;
    if (cartaSel) C.sel.presa.forEach(function (id) { cliccabili[id] = true; });   // quelle scelte si possono togliere
    m.cliccabili = cliccabili;
    var dir = vm.presa ? (vm.presa.mio ? "giu" : "su") : null;
    var dealing = !vm.presa && vm.fase === "gioco" && vm.mano.length > m.prevMano;
    var nuoveTav = [], presiEls = [], vivi = {};
    carteTav.forEach(function (c) {
      vivi[c.id] = true;
      var cel = m.tav[c.id];
      if (!cel) {
        cel = cartaEl(el, c, wT); cel._w = wT;
        cel.addEventListener("click", function () { var mm = scMount; if (mm && mm.C === C && mm.cliccabili && mm.cliccabili[c.id]) C.tapTavolo(c.id); });
        if (c.id === vm.messaGiu && !vm.presa) {   // appena scartata: si posa sul tavolo
          cel.classList.add("sc-cade");
          cel.addEventListener("animationend", function () { cel.classList.remove("sc-cade"); }, { once: true });
        }
        m.tav[c.id] = cel; m.griglia.appendChild(cel);
        nuoveTav.push(cel);
      }
      misuraCarta(cel, wT);
      var p = scSlot[c.id] || 0, gc = String(p % colT + 1), gr = String(Math.floor(p / colT) + 1);
      if (cel.style.gridColumnStart !== gc || cel.style.gridRowStart !== gr) { cel.style.gridColumn = gc; cel.style.gridRow = gr; }
      var preso = !!(vm.presa && vm.presa.presiIds && vm.presa.presiIds.indexOf(c.id) >= 0);
      cel.classList.toggle("sc-lascia-su", preso && dir === "su");
      cel.classList.toggle("sc-lascia-giu", preso && dir === "giu");
      if (preso) presiEls.push(cel);
      cel.classList.toggle("cap", !!verdi[c.id]);
      cel.classList.toggle("presel", !!cartaSel && C.sel.presa.indexOf(c.id) >= 0);
    });
    for (var tid in m.tav) if (!vivi[tid]) { m.tav[tid].remove(); delete m.tav[tid]; }
    // la carta giocata: parte dalla mano (o dall'avversario), va SOPRA la/e carta/e che prende, poi vola via con la presa
    if (chiavePresa !== m.giocK) {
      m.giocK = chiavePresa;
      if (m.gioc) { m.gioc.remove(); m.gioc = null; }
      if (vm.presa && vm.presa.carta) {
        var gioc = m.gioc = cartaEl(el, vm.presa.carta, wT);
        gioc.style.cssText += ";position:absolute;z-index:6;opacity:0";
        m.area.appendChild(gioc);
        if (presiEls.length) {   // posizioni misurate SUL tavolo (non sullo schermo): il tavolo è inclinato
          var cx = 0, cy = 0;
          presiEls.forEach(function (e) { cx += e.offsetLeft + e.offsetWidth / 2; cy += e.offsetTop + e.offsetHeight / 2; });
          cx /= presiEls.length; cy /= presiEls.length;
          gioc.style.left = (cx - gioc.offsetWidth / 2) + "px"; gioc.style.top = (cy - gioc.offsetHeight / 2) + "px";
        } else {
          gioc.style.left = "50%"; gioc.style.top = "50%"; gioc.style.marginLeft = (-wT / 2) + "px"; gioc.style.marginTop = (-Math.round(wT * ASP_CARTA) / 2) + "px";
        }
        gioc.style.animation = "scGioca" + (dir === "giu" ? "Giu" : "Su") + " .95s ease-in forwards";
      }
    }

    // ---- scritte grandi: SCOPA!, le carte rimaste, i tre Re ----
    if (vm.presa && vm.presa.scopa && vm.presa.mio) sceltaBanner(m, cb.guarda ? "SCOPA di " + vm.nomi.io + "! 🧹" : "SCOPA! 🧹", " scopa");
    else if (vm.presa && vm.presa.resto) sceltaBanner(m, vm.presa.mio ? (cb.guarda ? "Le carte rimaste vanno a " + vm.nomi.io : "Le carte rimaste sono tue! 🙌") : "Le carte rimaste vanno a " + vm.nomi.opp, "");
    else if (vm.rifatta && m.rifK !== chiaveRound) {
      m.rifK = chiaveRound;
      sceltaBanner(m, "👑 Tre Re in tavola: si rimescola!", "");
      setTimeout(function () { if (m.bannerTxt && /Tre Re/.test(m.bannerTxt)) sceltaBanner(m, null); }, 2600);
    } else if (!(m.bannerTxt && /Tre Re/.test(m.bannerTxt) && vm.rifatta)) sceltaBanner(m, null);

    // ---- la mia mano (in basso, sulla mensola di legno a dimensione FISSA) ----
    var nuoveMano = [], viviM = {};
    vm.mano.forEach(function (c) {
      viviM[c.id] = true;
      var cel = m.mano[c.id];
      if (!cel) {
        cel = cartaEl(el, c, Mi.wH);
        cel.addEventListener("click", function () { var mm = scMount; if (!mm || mm.C !== C || C.uscito) return; if (mm.mioTurno) C.tapMano(c.id); else mm.aspetta(); });
        m.mano[c.id] = cel; m.manoRiga.appendChild(cel); nuoveMano.push(cel);
      }
      cel.classList.toggle("sel", C.sel.carta === c.id);
      cel.classList.toggle("inviata", C.inviata === c.id);
    });
    for (var mid in m.mano) if (!viviM[mid]) { m.mano[mid].remove(); delete m.mano[mid]; }
    m.mensola.classList.toggle("tuo", suoTurno && !C.inviata);
    var tTxt = cb.guarda ? "Tocca a " + corto(vm.nomi.io, 14) : "Tocca a te!";
    if (m.tocca.textContent !== tTxt) m.tocca.textContent = tTxt;
    var prTxt = (cb.guarda ? "le carte di " + esc(corto(vm.nomi.io, 14)) + " · prese" : "le tue prese") + " <b>" + vm.preseIo + "</b>" + (vm.settebelloIo ? " · 7💰" : "") + (vm.scopeIo ? " · scope " + vm.scopeIo : "");
    if (m.prTxt !== prTxt) { m.prTxt = prTxt; m.prese.innerHTML = prTxt; }

    // ---- aiuto in sovrimpressione sul tavolo (non sposta niente): solo per scegliere la presa ----
    m.aiutoFisso = (mioTurno && cartaSel && opts.length >= 2) ? (opts[0].length === 1 ? "Tocca la carta verde da prendere." : "Tocca le carte verdi che sommano a " + cartaSel.v + ".") : null;
    aggiornaAiuto(m);
    applicaAvviso(C);

    // misuro quanto spazio avanza (o manca) sotto la mensola e rifaccio SUBITO la stanza della misura giusta
    // (prima che il telefono disegni: non si vede nessun salto). Una volta sola per schermo.
    if (nuovo && !scCorr.fatto) {
      var sch = m.s, rS = sch.getBoundingClientRect(), padB = parseFloat(getComputedStyle(sch).paddingBottom) || 0;
      // (misure senza l'animazione d'entrata della schermata: quella sposta tutto di qualche pixel e falserebbe il conto)
      var fondo = (m.fa || m.mensola).getBoundingClientRect().bottom, trabocca = Math.max(0, sch.offsetTop + sch.offsetHeight - Mi.alt);
      var avanza = Math.floor((rS.bottom - padB - fondo) - trabocca);
      scCorr.fatto = true;
      if (rS.height > 0 && Math.abs(avanza) > 3) { scCorr.v += avanza; renderScopa(t, C, cb); return; }
    }
    m.prevMano = vm.mano.length; m.round = chiaveRound;
    // DISTRIBUZIONE come dal vero: prima le carte nuove in tavola una alla volta, poi una a te e una all'avversario, a turno
    if (dealing) {
      var passo = 0.2, t0 = 0, tavNuove = (vm.preseIo + vm.preseOpp === 0 && vm.mazzoN === 30) ? nuoveTav : [];
      tavNuove.forEach(function (cel, i) {   // sul tavolo inclinato: arrivano dal centro del panno
        if (!cel.animate) return;
        cel.animate([{ translate: "0 -120px", scale: "0.5", opacity: 0 }, { translate: "0 0", scale: "1", opacity: 1 }],
          { duration: 420, delay: i * passo * 1000, easing: "cubic-bezier(.2,.7,.3,1)", fill: "backwards" });
      });
      if (tavNuove.length) t0 = tavNuove.length * passo + 0.2;
      var fr = m.feltro.getBoundingClientRect(), ox = fr.left + fr.width / 2, oy = fr.top + fr.height * 0.4;   // da qui partono le carte
      var vola = function (elC, ritardo) {
        if (!elC || !elC.animate) return;
        var r = elC.getBoundingClientRect();
        elC.animate([{ translate: Math.round(ox - (r.left + r.width / 2)) + "px " + Math.round(oy - (r.top + r.height / 2)) + "px", scale: "0.4", opacity: 0 },
          { opacity: 1, offset: 0.25 }, { translate: "0 0", scale: "1", opacity: 1 }],
          { duration: 460, delay: ritardo * 1000, easing: "cubic-bezier(.2,.7,.3,1)", fill: "backwards" });
      };
      var n = Math.max(nuoveMano.length, nuoviDorsi.length);
      for (var k = 0; k < n; k++) { vola(nuoveMano[k], t0 + 2 * k * passo); vola(nuoviDorsi[k], t0 + (2 * k + 1) * passo); }
      C._dealFino = Date.now() + (t0 + 2 * n * passo) * 1000 + 450;   // il bot aspetta che la distribuzione finisca
    }
  }

  // avviso sopra al tavolo (es. "Luca è uscito"): C.avviso = { testo, tasto, onTasto } oppure null
  function applicaAvviso(C) {
    var s = C._schermo; if (!s) return;
    var vecchio = s.querySelector(".sc-avviso-sf");
    var k = C.avviso && !C.uscito ? C.avviso.testo + "|" + (C.avviso.tasto || "") : null;
    if (vecchio && vecchio._k === k) return;
    if (vecchio) vecchio.remove();
    if (!k) return;
    var el = C._el, box = el("div", { class: "sc-avviso" }, [el("p", { text: C.avviso.testo })]);
    if (C.avviso.tasto) box.appendChild(el("button", { class: "btn btn-primario", text: C.avviso.tasto, onclick: C.avviso.onTasto }));
    var sf = el("div", { class: "sc-avviso-sf" }, [box]); sf._k = k;
    s.appendChild(sf);
  }

  // riepilogo di fine smazzata / fine partita: le righe arrivano una alla volta, poi il totale e la strada verso il traguardo
  function renderFine(t, C, cb) {
    if (C.uscito) return;
    var el = t.el, vm = C.vm, r = vm.ultimoRound;
    var chiave = vm.idPartita + ":" + vm.nRound + ":" + vm.fase;
    if (C._fineK === chiave && C._schermo && document.body.contains(C._schermo)) { applicaAvviso(C); return; }   // già mostrato: niente da rifare
    C._fineK = chiave;
    var fine = vm.fase === "fine", pari = fine && vm.punti && vm.punti.io === vm.punti.opp;
    var titolo = !fine ? "Fine smazzata" : pari ? "Pareggio!" : cb.guarda ? "Ha vinto " + (vm.vincitoreIo ? vm.nomi.io : vm.nomi.opp) : (vm.vincitoreIo ? "Hai vinto!" : "Ha vinto " + vm.nomi.opp);
    function esci() { if (!fine && !cb.guarda && !window.confirm("Uscire dalla partita?")) return; cb.onEsci(); }
    var s = t.schermata({ icona: fine ? "🏆" : "🧮", titolo: titolo, indietro: esci });
    if (r) {
      var p = r.p, io = vm.io, opp = altro(io), n = 0, cont = el("div", { class: "sc-riep" });
      var lato = function (x) { return x === io ? "io" : x === opp ? "opp" : null; };
      var di = function (a, b) { return io === "A" ? [a, b] : [b, a]; };   // [mio, suo]
      var riga = function (nome, vals, vinc, cls, badge) {
        var celle = [0, 1].map(function (i) {
          var mio = (vinc === "io" && i === 0) || (vinc === "opp" && i === 1), b = badge ? badge[i] : (mio ? "+1" : "");
          return el("span", { class: mio ? "vinto" : "", html: vals[i] + (b ? "<span class='sc-piu'>" + b + "</span>" : "") });
        });
        cont.appendChild(el("div", { class: "sc-rg" + (cls ? " " + cls : ""), style: "animation-delay:" + (n++ * 0.2).toFixed(2) + "s" }, [el("span", { text: nome }), celle[0], celle[1]]));
      };
      cont.appendChild(el("div", { class: "sc-rg testa" }, [el("span"), el("span", { text: vm.nomi.io }), el("span", { text: vm.nomi.opp })]));
      riga("Carte", di(p.carteA, p.carteB), lato(p.puntoCarte));
      riga("Denari", di(p.denA, p.denB), lato(p.puntoDenari));
      riga("Settebello", di(p.settebello === "A" ? "7💰" : "—", p.settebello === "B" ? "7💰" : "—"), lato(p.settebello));
      var pr = function (x, ok) { return ok === false ? "<span class='manca'>manca un seme</span>" : x; };
      riga("Primiera", di(pr(p.primA, p.primOkA), pr(p.primB, p.primOkB)), lato(p.puntoPrimiera));
      var sc = di(r.scope.A, r.scope.B);
      riga("Scope", sc, null, "", [sc[0] ? "+" + sc[0] : "", sc[1] ? "+" + sc[1] : ""]);
      var g = di(r.guad.A, r.guad.B), tt = di(r.tot.A, r.tot.B);
      riga("Punti", ["+" + g[0], "+" + g[1]], null);
      riga("Totale", tt, fine && !pari ? (vm.vincitoreIo ? "io" : "opp") : null, "tot", ["", ""]);
      var barre = [];
      if (vm.traguardo) {   // la strada verso il traguardo
        var bb = [0, 1].map(function (i) { var b = el("b", { style: "transform:scaleX(0);background:" + (i ? "#ff8787" : "#69db7c") }); barre.push([b, Math.min(1, tt[i] / vm.traguardo)]); return el("div", { class: "sc-barra" }, [b]); });
        cont.appendChild(el("div", { class: "sc-rg", style: "animation-delay:" + (n++ * 0.2).toFixed(2) + "s;font-size:.8rem" }, [el("span", { text: "Verso " + vm.traguardo }), bb[0], bb[1]]));
      }
      // Bot dice la sua
      if (vm.bot && !cb.guarda) {
        var mom = fine ? (pari ? "pari" : vm.vincitoreIo ? "perde" : "vince") : null;
        var detta = mom ? battuta(mom, chiave) : null;
        if (detta) cont.appendChild(el("div", { class: "sc-detto", style: "animation-delay:" + (n++ * 0.2).toFixed(2) + "s", text: "💬 " + vm.nomi.opp + ": «" + detta + "»" }));
      }
      s._contenuto.appendChild(cont);
      if (barre.length) setTimeout(function () { barre.forEach(function (x) { x[0].style.transform = "scaleX(" + x[1] + ")"; }); }, 40);
    }
    var nota = function (txt) { var p = el("p", { class: "modulo-nota", style: "margin:0 0 6px;text-align:center", text: txt }); s._piede.appendChild(p); return p; };
    // online: la fila delle faccine (il mio avatar le fa sui telefoni di tutti); null se non serve
    var fa = !cb.locale && t.faccine ? t.faccine() : null;
    if (fa) { fa.style.margin = "0 0 8px"; s._piede.appendChild(fa); }
    // la prossima smazzata parte da sola: l'host vede il conto sul tasto, gli altri "Si va avanti tra 12…"
    var kConto = "smazzata|" + vm.idPartita + ":" + vm.nRound;
    if (cb.guarda) {   // chi guarda: niente tasti di gioco, solo cosa succede
      var pg = nota(!fine ? "In attesa della prossima smazzata…" : cb.spettatore ? "In attesa dell'host per un'altra partita…"
        : (pari ? "Pareggio: si rigioca!" : "Tra poco si torna al tabellone…"));   // (spettatore: stanza online; se no torneo)
      if (fine && cb.spettatore) s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
      if (!fine && !vm.bot && t.contoAvanti) t.contoAvanti(pg, 12, null, kConto);   // (la partita col Bot va avanti quando tocca chi gioca)
    } else if (fine) {
      // online: i tasti di fine uguali per tutti, se li disegna il core (se no quelli di sempre)
      if (!(!cb.locale && t.tastiFine && t.tastiFine(s._piede, { host: !!cb.sonoHost, nuova: cb.sonoHost ? cb.onSaletta : null, esci: cb.onEsci }))) {
        if (cb.sonoHost || cb.locale) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Nuova partita", onclick: cb.onNuova }));
        else nota("In attesa dell'host per un'altra partita…");
        s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: esci }));
      }
    } else {
      if (cb.sonoHost || cb.locale) {
        var bC = el("button", { class: "btn btn-primario", text: "Continua ▶", onclick: cb.onAvanti });
        s._piede.appendChild(bC);
        if (!cb.locale && t.contoAvanti) t.contoAvanti(bC, 12, cb.onAvantiDaSolo || cb.onAvanti, kConto);   // (il conto chiama la funzione: niente vibrazione)
      } else {
        var po = nota("La prossima smazzata parte tra pochi secondi…");
        if (t.contoAvanti) t.contoAvanti(po, 12, null, kConto);
      }
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: esci }));
    }
    C._schermo = s;
    t.mostra(s);
    applicaAvviso(C);
  }

  // ---- statistiche per i trofei: il giocatore di QUESTO telefono (vm.io), se ha il profilo.
  //      Funziona uguale contro il bot, da host e da ospite: guarda solo lo stato che arriva. ----
  // smazzate già contate (anche dopo aver ricaricato la pagina): non si contano due volte
  function giaContata(k) {
    try {
      var l = JSON.parse(localStorage.getItem("sg-scopa-contate") || "[]");
      if (l.indexOf(k) >= 0) return true;
      l.push(k); if (l.length > 30) l = l.slice(-30);
      localStorage.setItem("sg-scopa-contate", JSON.stringify(l));
    } catch (e) {}
    return false;
  }
  function tracciaScopa(T, vm) {
    if (!vm) return;
    // 1) le mosse: una mia scopa fatta con un denaro, o calando un asso
    if (vm.presa && vm.presa.carta) {
      var key = vm.presa.carta.id + ":" + (vm.presa.presiIds || []).join(",");
      if (key !== T.presaKey) {
        T.presaKey = key;
        if (vm.presa.mio && vm.presa.scopa) {
          var den = vm.presa.carta.s === "D" || (vm.presa.presi || []).some(function (c) { return c.s === "D"; });
          if (den) T.round.scopeDenari++;
          if (vm.presa.carta.v === 1) T.round.scopeAsso++;
        }
      }
    } else T.presaKey = null;
    // 2) fine smazzata (e fine partita)
    var prima = T.fase; T.fase = vm.fase;
    if (!(vm.fase === "fineround" || vm.fase === "fine") || prima === vm.fase || !vm.ultimoRound) return;
    if (vm.idPartita && giaContata(vm.idPartita + ":" + vm.nRound + ":" + vm.io)) { T.round = { scopeDenari: 0, scopeAsso: 0 }; return; }
    var r = vm.ultimoRound, p = r.p, io = vm.io, opp = altro(io);
    var tutti4 = p.puntoCarte === io && p.puntoDenari === io && p.settebello === io && p.puntoPrimiera === io;
    var c = { scope: r.scope[io], settebello: p.settebello === io ? 1 : 0, primiera: p.puntoPrimiera === io ? 1 : 0,
      denari: p.puntoDenari === io ? 1 : 0, carte: p.puntoCarte === io ? 1 : 0,
      scopeDenari: T.round.scopeDenari, scopeAsso: T.round.scopeAsso,
      cappotto: tutti4 ? 1 : 0, sopraMedia: (tutti4 && r.scope[io] >= 1) ? 1 : 0 };
    if (p.settebello === io) T.match.sette++;
    if (r.tot[opp] >= 10 && r.tot[io] < 10) T.match.oppA10 = true;   // l'avversario è arrivato a 10 prima di te
    // i trofei della partita intera valgono solo per le partite vere (almeno a 11): con una mano sola o pochi punti sarebbero regalati
    if (vm.fase === "fine" && !(vm.traguardo != null && vm.traguardo < TARGET)) {
      c.partite = 1;
      if (vm.vincitoreIo) {
        c.vinte = 1;
        if (T.match.sette === 0) c.vinteSenzaSette = 1;
        if (r.tot[opp] === 0) c.vinteAZero = 1;
        if (T.match.oppA10) c.rimonte = 1;
      }
    }
    if (vm.fase === "fine") T.match = { sette: 0, oppA10: false };
    T.round = { scopeDenari: 0, scopeAsso: 0 };
    if (!(window.SGNube && SGNube.disponibile() && SGNube.profilo())) return;
    var incrs = []; for (var k in c) if (c[k]) incrs.push([k, c[k]]);
    SGNube.salvaProgressi(null, "scopa", incrs, [["scopeRoundMax", r.scope[io]]]);
  }

  // client condiviso: tiene vm + selezione, gestisce i tap, chiama cb.onMossa
  function creaClient(t, cb) {
    var C = { vm: null, sel: { carta: null, presa: [] }, uscito: false, inviata: null, avviso: null, _el: t.el };
    var T = { presaKey: null, fase: null, round: { scopeDenari: 0, scopeAsso: 0 }, match: { sette: 0, oppA10: false } };
    C.tapMano = function (id) {
      if (C.uscito || C.inviata || !C.vm) return;
      var carta = trova(C.vm.mano, id); if (!carta) return;
      var opts = catture(carta.v, C.vm.tavolo);
      if (opts.length === 0) { C.sel = { carta: null, presa: [] }; cb.onMossa(id, null); return; }   // niente presa: metti giù subito
      if (opts.length === 1) { C.sel = { carta: null, presa: [] }; cb.onMossa(id, opts[0]); return; }  // una sola presa: prendi subito
      C.sel = (C.sel.carta === id) ? { carta: null, presa: [] } : { carta: id, presa: [] };            // più prese: scegli
      C.disegna();
    };
    C.tapTavolo = function (id) {
      if (C.uscito || !C.vm) return;
      var carta = trova(C.vm.mano, C.sel.carta); if (!carta) return;
      var opts = catture(carta.v, C.vm.tavolo);
      var p = C.sel.presa.slice(); var k = p.indexOf(id); if (k >= 0) p.splice(k, 1); else p.push(id);
      if (validaSet(opts, p)) { var cs = C.sel.carta; C.sel = { carta: null, presa: [] }; cb.onMossa(cs, p); return; }
      if (prefisso(opts, p)) C.sel.presa = p; // altrimenti ignora il tap
      C.disegna();
    };
    C.disegna = function () {
      if (!C.vm || C.uscito) return;
      if (C.vm.fase === "gioco") renderScopa(t, C, cb);
      else renderFine(t, C, cb);
    };
    // ospite online: la carta toccata parte subito (in attesa che l'host risponda)
    C.manda = function (id) {
      C.inviata = id; C.disegna();
      clearTimeout(C._invT);
      C._invT = setTimeout(function () { if (C.inviata === id) { C.inviata = null; C.disegna(); } }, 5000);   // risposta persa: si può ritoccare
    };
    C.mostraAvviso = function () { applicaAvviso(C); };
    // si esce: niente più disegni, attese o musica (anche se un'attesa vecchia scatta dopo)
    C.esci = function () {
      C.uscito = true;
      if (C._pend) { clearTimeout(C._pend); C._pend = null; }
      clearTimeout(C._invT);
      if (window.SGMusica) window.SGMusica.ferma();
    };
    C._presaFino = 0; C._pend = null;
    C.setVm = function (vm) {
      if (C.uscito) return;
      if (!cb.guarda) tracciaScopa(T, vm);   // trofei (chi guarda non gioca)
      if (C.inviata && (!vm || !trova(vm.mano || [], C.inviata) || vm.turno !== vm.io)) C.inviata = null;
      // pulisci la selezione se non è più il mio turno
      if (!vm || vm.turno !== vm.io || vm.fase !== "gioco" || vm.presa) C.sel = { carta: null, presa: [] };
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

  // costruisce la vista per il giocatore "io" ("A" o "B") dallo stato del motore (extra: bot, idB…)
  function vistaDa(st, io, omini, extra) {
    var opp = altro(io);
    var v = {
      fase: st.fase, io: io, turno: st.turno, traguardo: st.traguardo,
      nomi: { io: st.nomi[io], opp: st.nomi[opp] }, avatar: omini ? { opp: omini[opp] || null } : null,
      mano: st.mani[io].slice(), oppN: st.mani[opp].length, tavolo: st.tavolo.slice(), mazzoN: st.mazzo.length,
      preseIo: st.prese[io].length, preseOpp: st.prese[opp].length,
      scopeIo: st.scope[io], scopeOpp: st.scope[opp],
      settebelloIo: !!trova(st.prese[io], "D7"), settebelloOpp: !!trova(st.prese[opp], "D7"),
      punti: { io: st.punti[io], opp: st.punti[opp] },
      ultimoRound: st.ultimoRound, messaGiu: st.messaGiu,
      presa: st.presa ? { mio: st.presa.chi === io, carta: st.presa.carta, presi: st.presa.presi, scopa: st.presa.scopa, tavoloPrima: st.presa.tavoloPrima, presiIds: st.presa.presiIds, resto: !!st.presa.resto } : null,
      vincitoreIo: st.fase === "fine" ? (st.punti[io] > st.punti[opp]) : false,
      idPartita: st.idPartita, nRound: st.nRound, rifatta: !!st.rifatta
    };
    if (extra) for (var k in extra) v[k] = extra[k];
    return v;
  }

  SG.registra({
    id: "scopa",
    nome: "Scopa",
    icona: "🃏",
    descrizione: "Il classico gioco di carte napoletane: prendi le carte del tavolo e fai scopa. Contro il Bot o online, ognuno dal suo telefono.",
    giocatoriMin: 1, giocatoriMax: 2, difficolta: 3,
    postiOnline: 2,   // online si gioca in due: gli altri guardano
    modi: [{ modo: "bot", icona: "🤖", nome: "Contro il computer", sotto: "Giochi da solo contro il Bot" }],
    regole: [
      "Si gioca <b>in due</b> con le 40 carte napoletane. Tre carte in mano a testa, quattro sul tavolo.",
      "Nel tuo turno giochi una carta: se ha lo <b>stesso valore</b> di una carta sul tavolo la <b>prendi</b>. Se non c'è un valore uguale, puoi prendere <b>più carte che sommano</b> al valore della tua.",
      "Se dopo la presa il tavolo resta <b>vuoto</b> fai <b>Scopa</b> (+1 punto), tranne con l'ultima carta.",
      "A fine mazzo le carte rimaste sul tavolo vanno all'ultimo che ha preso. Se a inizio smazzata in tavola ci sono <b>tre o quattro Re</b>, si rimescola.",
      "Punti a fine smazzata: <b>Carte</b> (chi ne prende di più), <b>Denari</b> (più carte di denari), <b>Settebello</b> (il 7 di denari), <b>Primiera</b> (serve almeno una carta per seme), più le <b>Scope</b>. Vince chi arriva per primo ai <b>punti scelti</b> (di solito " + TARGET + "; a pari punti si gioca un'altra mano). Si può giocare anche <b>una mano sola</b>.",
      "Modalità: <b>contro il Bot</b> (Facile/Medio/Difficile) oppure <b>online</b>, ognuno dal suo telefono."
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
        el("span", { class: "mi", text: "🤖" }), el("div", {}, [el("div", { class: "mt", text: "Contro il Bot" }), el("div", { class: "ms", text: "Da solo" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { sel("online"); } }, [
        el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Online" }), el("div", { class: "ms", text: "Ognuno dal suo" })])]);
      if (!aiuti.modo) {   // (se "come giocare" l'avete già scelto prima, qui non si sceglie)
        box.appendChild(el("div", { class: "etichetta", text: "Come giocare" }));
        box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bBot, bOnl]));
      }
      boxDiff = el("div", {});
      boxDiff.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura del Bot" }));
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
      sceltaTraguardo(el, box, dove, "Le vittorie contano per i trofei e le sfide del giorno nelle partite da " + TARGET + " punti in su.");
      notaOnline = el("div", { class: "link-avviso", hidden: "hidden" });
      notaOnline.textContent = (window.SGNet && SGNet.disponibile())
        ? "Apri la stanza e invita l'altro col tasto 📤: entra dal suo telefono (ognuno vede solo le proprie carte)."
        : "Qui il collegamento non è disponibile: funziona quando il gioco è aperto dal sito pubblicato online.";
      box.appendChild(notaOnline);
      if (aiuti.modo) { sel(aiuti.modo); notaOnline.hidden = true; }
    },
    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return t.linkParams.guarda ? guardaScopa(t, t.linkParams.stanza) : ospiteScopa(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostScopa(t);
      return localeScopa(t, imp.difficolta || "medio");
    }
  });

  // suono della presa; la vibrazione solo per le mosse di chi ha il telefono (mai per quelle dell'altro)
  function suonoPresa(scopa, vibra) {
    if (vibra) try { if (navigator.vibrate) navigator.vibrate(scopa ? [0, 20, 40, 30] : 14); } catch (e) {}
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t = ctx.currentTime;
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.setValueAtTime(scopa ? 520 : 360, t); o.frequency.exponentialRampToValueAtTime(scopa ? 880 : 300, t + 0.12);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (scopa ? 0.28 : 0.16));
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.3);
    } catch (e) {}
  }

  // dopo una mossa: si guarda la presa, poi si pulisce il tavolo; a mani vuote si distribuisce, oppure (a fine mazzo)
  // si vedono le carte rimaste andare a chi ha preso per ultimo e poi arriva il riepilogo.
  // ridisegna() a ogni passo, pronto() quando si può giocare di nuovo, vivo() = la partita è ancora questa
  function dopoMossa(M, ev, ridisegna, pronto, vivo) {
    function passo() {
      if (!vivo()) return;
      var r = M.chiudiPresa(); ridisegna();
      if (r === "resto") setTimeout(passo, 1900); else pronto();
    }
    if (ev.presa) setTimeout(passo, ev.scopa ? 1800 : 1200);
    else if (ev.chiudere) setTimeout(passo, 550);
    else pronto();
  }

  // ---------- LOCALE (contro il bot) : io = A, bot = B ----------
  function localeScopa(t, difficolta) {
    // il Bot: quello deciso dal core (torneo a eliminazione) o uno dei bot fissi, scelto dalla bravura (nei tasti si dice "Bot")
    var ilBot = (t.impostazioni && t.impostazioni.bot && t.impostazioni.bot.nome) ? t.impostazioni.bot
      : ((SG.bot && SG.bot.prendi && SG.bot.prendi(1, { livello: difficolta, escludi: [t.giocatori[0] || "Tu", t.nomeProfilo && t.nomeProfilo()] })[0]) || { nome: "Bot", omino: null });
    var nomi = { A: (t.giocatori[0] || "Tu"), B: ilBot.nome };
    var M = creaMotore(nomi, t.mischia, traguardoDa(t.impostazioni));
    var botT = null;
    var C = creaClient(t, {
      locale: true, sonoHost: true,
      onMossa: function (id, presa) { mossaUmano(id, presa); },
      onAvanti: function () { if (M.st.fase !== "fineround") return; M.prossimoRound(); aggiorna(); seTuraBot(); },
      onNuova: function () { M = creaMotore(nomi, t.mischia, traguardoDa(t.impostazioni), altro(M.st.primoPartita)); aggiorna(); seTuraBot(); },   // nella partita dopo comincia l'altro
      onEsci: function () { C.esci(); clearTimeout(botT); t.esci(); }
    });
    var omini = { A: mioAvatar(nomi.A), B: ilBot.omino || AVATAR_BOT };
    var detto = false;   // il risultato di questa partita è già stato dato? (torneo a eliminazione)
    function aggiorna() {
      if (C.uscito) return;
      var v = vistaDa(M.st, "A", omini, { bot: true });
      if (t.trasmetti) t.trasmetti({ t: "vm", vm: v });   // torneo a eliminazione: chi guarda vede la partita col bot
      C.setVm(v);
      if (M.st.fase !== "fine") { detto = false; return; }
      if (!detto && t.risultato) {
        detto = true;
        var a = M.st.punti.A, b = M.st.punti.B;
        t.risultato(a >= b ? [{ nome: nomi.A, pos: 1 }, { nome: nomi.B, pos: a === b ? 1 : 2, bot: true }] : [{ nome: nomi.B, pos: 1, bot: true }, { nome: nomi.A, pos: 2 }]);   // (la riga del Bot: bot: true)
      }
    }
    function vivo(m0) { return function () { return !C.uscito && M === m0; }; }
    function mossaUmano(id, presa) {
      var ev = M.gioca("A", id, presa); if (ev.errore) return;
      suonoPresa(ev.scopa, true); aggiorna(); dopoMossa(M, ev, aggiorna, seTuraBot, vivo(M));
    }
    function seTuraBot() {
      if (C.uscito || botT || M.st.fase !== "gioco" || M.st.turno !== "B" || M.st.presa) return;
      var m0 = M;
      botT = setTimeout(function () { botT = null; if (!C.uscito && M === m0) mossaBot(); },
        Math.max(650 + Math.random() * 400, (C._dealFino || 0) - Date.now() + 250));   // dopo la distribuzione
    }
    function mossaBot() {
      if (M.st.fase !== "gioco" || M.st.turno !== "B" || M.st.presa || !M.st.mani.B.length) return;
      var m = scegliMossaBot(M.st.mani.B, M.st.tavolo, difficolta, M.st, "B");
      var ev = M.gioca("B", m.carta, m.presa); if (ev.errore) return;
      suonoPresa(ev.scopa, false); aggiorna(); dopoMossa(M, ev, aggiorna, seTuraBot, vivo(M));
    }
    aggiorna();
    seTuraBot(); // se comincia il bot
  }

  // ---------- ONLINE : host = A, ospite = B ----------
  function hostScopa(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var nomi = { A: (t.giocatori && t.giocatori[0]) || "Host", B: "Avversario" };
    var M = null, rete = null, avvId = null, avvVia = false, pronta = false, problema = false, codice = "…", omini = { A: mioAvatar(nomi.A), B: null };
    var detto = false, riserva = null;   // detto: il risultato della partita è già stato dato al torneo online? riserva: il posto di chi giocava (vedi riservaAvv)
    var C = creaClient(t, {
      sonoHost: true,
      onMossa: function (id, presa) { if (M) dopo(M.gioca("A", id, presa), true); },
      onAvanti: function () { avanti(); },
      // finita la smazzata, il conto sul tasto "Continua ▶" fa partire la prossima da sola (se l'avversario c'è)
      onAvantiDaSolo: function () { if (!avvVia) avanti(); },
      onNuova: function () { if (!M) return; M = creaMotore(nomi, t.mischia, traguardoDa(t.impostazioni), altro(M.st.primoPartita)); bcast(); },   // nella partita dopo comincia l'altro
      onSaletta: function () { allaSaletta(); },
      onEsci: function () { C.esci(); if (rete) rete.chiudi(); t.esci(); }
    });
    // la rivincita dei tasti di fine comuni: si torna nella saletta con lo stesso avversario (il core fa il 3-2-1), poi comincia l'altro
    var primoDopo = null;
    function allaSaletta() {
      if (!M || M.st.fase !== "fine" || !avvId || avvVia || C.uscito) return;
      primoDopo = altro(M.st.primoPartita); M = null; C.avviso = null; C.vm = null;
      aggiornaLobby();
    }
    t.onRivincita = allaSaletta;
    function avanti() { if (!C.uscito && M && M.st.fase === "fineround") { M.prossimoRound(); bcast(); } }
    function vistaB() { return vistaDa(M.st, "B", omini, { idB: avvId }); }
    function aggiornaLobby() {
      ricordaAvv("scopa", codice, avvId || (riserva && Date.now() < riserva.fino ? riserva.id : null));
      if (M || C.uscito) return;
      if (rete) rete.invia({ t: "lobby", codice: codice, pronta: pronta, avversario: !!avvId, avvId: avvId, traguardo: traguardoDa(t.impostazioni),
        nomi: { A: nomi.A, B: nomi.B }, omini: { A: omini.A, B: avvId ? omini.B : null } });
      disegnaLobby();
    }
    t.onRegole = function () { aggiornaLobby(); };   // l'host ha cambiato i punti in saletta: lo vede anche chi aspetta
    function bcast() {
      if (C.uscito) return;
      // all'ospite mando la SUA vista (vede solo le proprie carte, e c'è il suo id); io disegno la mia
      if (M) { if (rete) rete.invia({ t: "vm", vm: vistaB() }); C.setVm(vistaDa(M.st, "A", omini, { idB: avvId })); }
      else disegnaLobby();
      if (!M || M.st.fase !== "fine") detto = false;
      else if (!detto && t.risultato) {   // per il torneo online: chi è arrivato prima al traguardo
        detto = true;
        var a = M.st.punti.A, b = M.st.punti.B;
        t.risultato(a >= b ? [{ nome: nomi.A, pos: 1 }, { nome: nomi.B, pos: a === b ? 1 : 2 }] : [{ nome: nomi.B, pos: 1 }, { nome: nomi.A, pos: 2 }]);
      }
      // (finita la smazzata, la prossima parte da sola: il conto è sul tasto "Continua ▶", vedi renderFine)
    }
    function dopo(ev, mia) {
      if (!ev || ev.errore) return;
      suonoPresa(ev.scopa, mia);
      bcast();   // mostra la presa (se c'è) su entrambi i telefoni
      var m0 = M;
      dopoMossa(M, ev, bcast, function () {}, function () { return !C.uscito && M === m0; });
    }
    // l'avversario se n'è andato e l'host chiude: si torna in sala (chi abbandona perde a tavolino)
    function chiudiPartita() {
      if (M && M.st.fase !== "fine" && !detto && t.risultato) { detto = true; t.risultato([{ nome: nomi.A, pos: 1 }, { nome: nomi.B, pos: 2 }]); }
      M = null; avvId = null; avvVia = false; nomi.B = "Avversario"; omini.B = null; C.avviso = null; C.vm = null;
      aggiornaLobby();
    }
    function tornato() { if (!avvVia) return; avvVia = false; C.avviso = null; C.mostraAvviso(); }
    rete = SGNet.ospita("scopa", {
      onCodice: function (c) { codice = c; riserva = riservaAvv("scopa", c); if (!M) aggiornaLobby(); },
      onConnesso: function () { pronta = true; problema = false; if (!M) aggiornaLobby(); },
      onAddio: function (id) {
        if (id !== avvId || C.uscito) return;
        if (!M) { avvId = null; nomi.B = "Avversario"; omini.B = null; aggiornaLobby(); return; }
        // in partita: la partita NON si butta. Si aspetta che rientri (torna con lo stesso id), oppure l'host chiude
        avvVia = true;
        C.avviso = { testo: "🚪 " + nomi.B + " ha lasciato la partita. Se rientra, si riprende da qui.", tasto: "Chiudi la partita", onTasto: chiudiPartita };
        C.mostraAvviso();
      },
      onMsg: function (id, m) {
        if (!m || !m.t || C.uscito) return;
        if (m.t === "join") {
          // (nella Sala gioca solo chi è stato scelto: gli altri guardano)
          if (!avvId && !postoRiservato(riserva, id) && (!t.puoSedersi || t.puoSedersi(id, String(m.nome || "").slice(0, 16)))) { avvId = id; nomi.B = String(m.nome || "Avversario").slice(0, 16); omini.B = avatarValido(m.omino); }
          if (id !== avvId) return;   // un terzo telefono: la stanza è piena (lo capisce da solo: l'id nella sala e nella partita non è il suo)
          tornato();
          if (M) { if (rete) rete.invia({ t: "vm", vm: vistaB() }); }   // rientrato (pagina ricaricata): gli rimando la sua partita
          else aggiornaLobby();
        }
        else if (m.t === "gioca" && M && id === avvId) { tornato(); dopo(M.gioca("B", m.carta, m.presa), false); }
      },
      // (arriva solo se il primo collegamento non riesce: dopo, la rete si ricollega da sola e la partita resta)
      onErrore: function () { if (M || pronta || C.uscito) return; C.esci(); erroreScopa(t, "Problema di collegamento. Controlla la connessione e riprova."); }
    });
    function disegnaLobby() {
      if (M || C.uscito) return;
      renderLobby(t, { codice: codice, pronta: pronta, avversario: !!avvId, avvId: avvId, sonoHost: true, io: "A", nomi: nomi, omini: omini, traguardo: traguardoDa(t.impostazioni), problema: problema }, {
        sonoHost: true,
        onComincia: function () { if (avvId && !M) { M = creaMotore(nomi, t.mischia, traguardoDa(t.impostazioni), primoDopo || undefined); primoDopo = null; bcast(); } },
        onEsci: function () { C.esci(); if (rete) rete.chiudi(); t.esci(); }
      });
    }
    disegnaLobby();
  }

  function ospiteScopa(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { rete: null, nome: "", msg: null, myId: null, guardo: false };
    var C = creaClient(t, {
      sonoHost: false,
      onMossa: function (id, presa) { if (!S.rete) return; S.rete.invia({ t: "gioca", carta: id, presa: presa }); C.manda(id); },
      onAvanti: function () {}, onNuova: function () {},
      onEsci: esci
    });
    // si gioca in due: chi è in più guarda la partita (alle spalle di chi è entrato), senza toccare né suoni
    var Cg = creaClient(t, {
      guarda: true, spettatore: true, sonoHost: false,
      onMossa: function () {}, onAvanti: function () {}, onNuova: function () {},
      onEsci: esci
    });
    function esci() { C.esci(); Cg.esci(); if (S.rete) S.rete.chiudi(); t.esci(); }
    function lascia(X) { if (X._pend) { clearTimeout(X._pend); X._pend = null; } X.vm = null; X.sel = { carta: null, presa: [] }; X.inviata = null; }
    // gioco io (l'host mi ha messo come avversario) o guardo? Cambiando, il tavolo dell'altro modo non si ridisegna più
    function modo(guardo) {
      if (S.guardo === guardo) return;
      S.guardo = guardo; lascia(guardo ? C : Cg);
    }
    function join() { return { t: "join", nome: S.nome, omino: mioAvatar(S.nome) }; }
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🃏", titolo: "Entra nella Scopa", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      S.msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(S.msg);
      var bEntra = el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        if (S.rete) return;
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "Amico").trim() || "Amico"; S.msg.textContent = "Collegamento in corso…"; collega();
      } });
      s._piede.appendChild(bEntra);
      t.mostra(s);
      if (t.nomeProfilo && t.nomeProfilo()) { input.value = t.nomeProfilo(); bEntra.click(); }   // entra da solo col nome del profilo di questo telefono
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia(join()); mostraAttesa();
          setTimeout(function () { if (!C.vm && !Cg.vm && S.msg2 && document.body.contains(S.msg2)) S.msg2.textContent = "Non trovo la partita: controlla il codice o attendi l'host…"; }, 8000); },
        onMsg: function (m) {
          if (!m || C.uscito) return;
          if (m.t === "vm" && m.vm) {
            modo(!!(m.vm.idB && S.myId && m.vm.idB !== S.myId));   // la partita è di un altro: la guardo
            if (S.guardo) { Cg.setVm(m.vm); return; }
            suonoSeNuovaPresa(m.vm); C.setVm(m.vm);
          } else if (m.t === "lobby") {
            modo(!!(m.avvId && S.myId && m.avvId !== S.myId));
            if (C.vm || Cg.vm) { lascia(C); lascia(Cg); lastPresaId = null; }   // l'host è tornato in sala: si torna in sala anche qui
            if (!m.avvId && S.rete) S.rete.invia(join());   // si è liberato il posto (o non mi ha ancora visto): lo ridico
            mostraLobby(m);
          }
        },
        // (se l'host non torna più ci pensa il core: «La stanza è chiusa»; qui arriva quando l'ha chiusa apposta)
        onChiuso: function () { if (!C.uscito && !Cg.uscito) { C.esci(); Cg.esci(); erroreScopa(t, "🚪 L'host ha chiuso la partita."); } },
        onErrore: function () { if (!C.uscito && !S.myId) erroreScopa(t, "Problema di collegamento. Riprova."); }
      });
    }
    var lastPresaId = null;
    function suonoSeNuovaPresa(vm) {
      var id = vm.presa ? ((vm.presa.carta ? vm.presa.carta.id : "resto") + ":" + (vm.presa.presi || []).length) : null;
      if (id && id !== lastPresaId) suonoPresa(vm.presa.scopa, vm.presa.mio && !!vm.presa.carta);   // vibra solo la mia
      lastPresaId = id;
    }
    function mostraLobby(m) {
      if (C.vm || Cg.vm) return;
      renderLobby(t, { codice: m.codice, pronta: m.pronta, avversario: m.avversario, avvId: m.avvId, nomi: m.nomi, omini: m.omini, sonoHost: false,
        io: S.guardo ? "-" : (m.avvId === S.myId ? "B" : null), traguardo: m.traguardo }, { onEsci: esci });
    }
    function mostraAttesa() {   // finché non arriva la sala dall'host
      if (C.vm || Cg.vm) return;
      var s = t.schermata({ icona: "🃏", titolo: "Scopa · Sala", sotto: "Stanza " + codice.toUpperCase(), indietro: esci });
      S.msg2 = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegato ✅ — sto entrando nella stanza…" });
      s._contenuto.appendChild(S.msg2);
      t.mostra(s);
    }
  }

  // chi guarda una partita del torneo a eliminazione: la vede in diretta alle spalle di un giocatore, senza toccare.
  // (Niente suoni né musica: farebbero rumore e vibrare il telefono.)
  function guardaScopa(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var rete = null, scritta = null;
    var C = creaClient(t, {
      guarda: true, sonoHost: false,
      onMossa: function () {}, onAvanti: function () {}, onNuova: function () {},
      onEsci: function () { esci(); }
    });
    function esci() { C.esci(); if (rete) rete.chiudi(); t.esci(); }
    function attesa(txt) {
      if (scritta === txt) return; scritta = txt;
      var s = t.schermata({ indietro: esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota guarda-attesa", text: txt }));
      t.mostra(s);
    }
    attesa("👀 Mi collego alla partita…");
    rete = SGNet.entra(codice, {
      onMsg: function (m) {
        if (!m || C.uscito) return;
        if (m.t === "vm" && m.vm) { scritta = null; C.setVm(m.vm); }
        else if (m.t === "lobby") { C.vm = null; attesa("👀 La partita sta per cominciare…"); }
      },
      onChiuso: function () { if (!C.uscito) esci(); },   // partita finita e chiusa: si torna al tabellone
      onErrore: function () { if (!C.uscito && !C.vm) erroreScopa(t, "Problema di collegamento. Riprova."); }
    });
  }

  // la saletta d'attesa (uguale per tutti i giochi): tu e il tuo avversario
  function renderLobby(t, vm, cb) {
    // "tu" solo per l'avversario vero (il suo id è nella sala dell'host): chi è in più guarda
    var nomi = vm.nomi || {}, om = vm.omini || {}, gio = [{ id: "A", nome: nomi.A || "Host", omino: om.A || null, host: true, tu: vm.io === "A" }];
    if (vm.avversario) gio.push({ id: vm.avvId || "B", nome: nomi.B || "Avversario", omino: om.B || null, tu: vm.io === "B" });
    var punti = vm.traguardo == null ? "" : (vm.traguardo ? "a " + vm.traguardo + " punti" : "una mano sola");
    t.lobby({ host: vm.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 2, vuoti: vm.avversario ? 0 : 1, giocatori: gio,
      nota: vm.sonoHost ? (vm.problema ? "⚠️ Problema di collegamento, riprovo…" : vm.avversario ? "✅ Avversario collegato! Quando vuoi, comincia" + (punti ? " (" + punti + ")" : "") + "." : "Invita il tuo avversario col tasto 📤.") : null,
      attesa: vm.io === "-" ? "👀 Giocano " + (nomi.A || "l'host") + " e " + (nomi.B || "l'avversario") + ": tu guardi."
        : "Aspetta che l'host cominci: si gioca a Scopa" + (punti ? ", " + punti : "") + "! 🃏", onComincia: cb.onComincia, onEsci: cb.onEsci });
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
    mazzo: mazzo, larghezza: larghezza, ASP_CARTA: ASP_CARTA,
    validaSet: validaSet, prefisso: prefisso, PRIM: PRIM,
    // stanza a 4 con gli avatar (Scopa 2 vs 2 e Scopone)
    misureStanza4: misureStanza4, correggiStanza4: correggiStanza4, ricontrollaStanza4: ricontrollaStanza4, postiTavolo: postiTavolo, stanza4: stanza4, animaDistribuzione4: animaDistribuzione4,
    mioAvatar: mioAvatar, avatarValido: avatarValido,
    // i punti da raggiungere (anche Scopa 2 vs 2 e Scopone)
    traguardoDa: traguardoDa, testoTraguardo: testoTraguardo, partitaFinita: partitaFinita, sceltaTraguardo: sceltaTraguardo
  };
})();

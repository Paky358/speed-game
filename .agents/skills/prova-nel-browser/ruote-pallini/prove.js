// 🎡 PROVE DEI PALLINI DELLE RUOTE (19 nov 2026, chat «🪟 Saletta di vetro»). Profili finti, mai account veri.
// Il proprietario: il «tic» si sentiva anche dove non c'era un pallino. Ora in ogni ruota ci sono i pallini grandi (tra due
// spicchi) e quelli piccoli (metà, a metà spicchio), e il tic suona SOLO quando un pallino che si vede passa sotto la freccia.
// Uso (dopo copione-prova.js): await COPIONE.carica("ruote-pallini/prove.js"); await COPIONE.prova("rp1")
// rp1: «Scegliamo insieme»: ogni tic cade su un pallino (grande o piccolo), anche quando rallenta; un tic per pallino;
//      mai fermi sopra il pallino piccolo (theta 0,5 dell'host = spostato poco più in là, uguale su tutti).
// rp2: Ruota della Fortuna contro i Bot: Paky la lancia col dito; negli ultimi secondi ogni tic cade su un chiodo che si vede
//      (ogni 7,5 gradi: i grandi sui multipli di 15) e i chiodi passati sono tanti quanti i tic.
// rp3: Ruota del 100 (Il Prezzo è Giusto): un clic per pallino (tra un numero e l'altro e a metà numero), anche in frenata.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti;
  function no(p) { throw new Error(p); }
  async function foto(nome) { if (!W.__foto) return; W.__fotoOra = nome; await W.aspetta(function () { return W.__fotoFatta === nome; }, 60000); }
  // un motore audio finto: a ogni nota segna frequenza, ora e quello che dice leggi() in quel momento (l'angolo della ruota)
  function audio(w, leggi) {
    var note = [];
    function par(v) { return { value: v, setValueAtTime: function (x) { this.value = x; return this; }, exponentialRampToValueAtTime: function () { return this; }, linearRampToValueAtTime: function () { return this; }, cancelScheduledValues: function () { return this; } }; }
    function nodo(o) { o = o || {}; o.connect = function () {}; o.disconnect = function () {}; return o; }
    var ctx = { state: "running", destination: nodo(), currentTime: 0, resume: function () { return Promise.resolve(); },
      createOscillator: function () { var o = nodo({ type: "sine", frequency: par(440) }); o.start = function () { note.push({ f: Math.round(o.frequency.value), tipo: o.type, t: w.performance.now(), a: leggi() }); }; o.stop = function () {}; return o; },
      createGain: function () { return nodo({ gain: par(1) }); } };
    w.SG.audioCtx = function () { return ctx; };
    return note;
  }
  function rot(nodo) { var m = nodo && /rotate\(([-\d.]+)deg\)/.exec(nodo.style.transform); return m ? +m[1] : null; }
  // segue il disco: a ogni cambio (un fotogramma) segna ora e angolo; così per ogni tic si sa dov'era il fotogramma prima
  function segui(w, nodo, leggi) {
    var l = []; new w.MutationObserver(function () { l.push({ t: w.performance.now(), a: leggi() }); }).observe(nodo, { attributes: true, attributeFilter: ["style"] });
    return l;
  }
  // i tic della frenata: ognuno suona nel fotogramma in cui un pallino (un multiplo di «ogni») passa sotto la freccia,
  // cioè tra l'angolo del fotogramma prima e quello di adesso; e tra due tic passa un pallino solo
  function controllaTic(tic, fot, ogni, cosa) {
    if (tic.length < 4) no(cosa + ": troppo pochi tic nella frenata (" + tic.length + ")");
    tic.forEach(function (n, i) {
      var prima = null; fot.forEach(function (x) { if (x.t < n.t) prima = x.a; });
      if (prima == null) return;
      var lo = Math.min(prima, n.a) - 1e-6, hi = Math.max(prima, n.a) + 1e-6, k = Math.ceil(lo / ogni);
      n.salto = Math.floor(hi / ogni) - k >= 1;
      if (k * ogni > hi) no(cosa + ": il tic n. " + (i + 1) + " della frenata suona senza pallini sotto la freccia (da " + prima.toFixed(2) + " a " + n.a.toFixed(2) + ", un pallino ogni " + ogni.toFixed(2) + ")");
    });
    for (var i = 1; i < tic.length; i++) {
      var p = Math.abs(Math.floor(tic[i].a / ogni) - Math.floor(tic[i - 1].a / ogni));
      if (tic[i].t - tic[i - 1].t < 95) continue;   // (ancora veloce: al massimo un tic ogni 45 ms, come nella ruotina della Mini Asta: uno si salta)
      if (p > 1 && tic[i].salto) continue;           // (il computer di prova ha saltato dei fotogrammi: due pallini in un fotogramma solo)
      if (p !== 1) no(cosa + ": tra due tic della frenata passano " + p + " pallini (ne deve passare uno)");
    }
  }

  COPIONE.aggiungi("rp1", { nome: "Scegliamo insieme: un tic per pallino (grandi e piccoli), anche in frenata; mai fermi sul pallino piccolo", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 });
    await W.aspetta(function () { return w.SGScegliamo && w.SG; }, 8000);
    var cv = null, note = audio(w, function () { return rot(cv); });
    var giochi = [{ id: "tris", icona: "❌", nome: "Tris" }, { id: "balla", icona: "🤥", nome: "La Balla Colossale" }, { id: "timeline", icona: "⏳", nome: "La linea del tempo" }];
    var conti = [{ g: "tris", n: 3 }, { g: "balla", n: 2 }, { g: "timeline", n: 2 }];
    var sp = w.SGScegliamo.spicchi(giochi, conti), n = sp.length, passo = 360 / n, finito = null;
    var velo = w.SGScegliamo.ruota({ spicchi: sp, vince: 2, theta: 0.5, parte: Date.now() + 300, poi: function (g) { finito = g; } });
    cv = velo.querySelector(".rg-disco"); var fot = segui(w, cv, function () { return rot(cv); });
    if (!await W.aspetta(function () { return velo.querySelector(".rg-tutto.vinto"); }, 12000)) no("la ruota non si ferma");
    var fin = rot(cv), dentro = (((360 - fin % 360) % 360 + 360) % 360) / passo, fr = dentro - Math.floor(dentro);
    if (Math.floor(dentro) !== 2) no("si ferma sullo spicchio " + Math.floor(dentro) + " invece del 2");
    if (Math.abs(fr - 0.5) < 0.07) no("si ferma sopra il pallino piccolo (a " + fr.toFixed(3) + " dello spicchio)");
    var tic = note.filter(function (x) { return x.f === 1900; }), ultimo = tic.length ? tic[tic.length - 1].t : 0;
    var lenti = tic.filter(function (x) { return x.t > ultimo - 2000; });
    controllaTic(lenti, fot, passo / 2, "Scegliamo");
    // mai più tic che pallini passati (all'inizio, velocissima, più pallini nello stesso fotogramma fanno un tic solo)
    var passati = Math.floor(fin / (passo / 2)) - Math.floor(tic[0].a / (passo / 2)) + 1;
    if (tic.length > passati) no("tic " + tic.length + " ma i pallini passati sono " + passati);
    // un secondo giro solo per le foto (le foto fermano lo schermo: non si misura)
    await W.aspetta(function () { return finito; }, 6000);
    var st0 = w.setTimeout; w.setTimeout = function (fn, ms) { return st0.call(w, fn, ms === 1800 ? 60000 : ms); };   // (la ruota ferma resta per la foto)
    var velo2 = w.SGScegliamo.ruota({ spicchi: sp, vince: 0, theta: 0.3, parte: Date.now() + 300, poi: function () {} });
    await W.dorme(3300); await foto("sceg-gira");
    await W.aspetta(function () { return velo2.querySelector(".rg-tutto.vinto"); }, 12000); await W.dorme(200); w.setTimeout = st0; await foto("sceg-ferma"); if (velo2.chiudi) velo2.chiudi();
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return n + " spicchi, " + tic.length + " tic su " + passati + " pallini passati; frenata: " + lenti.length + " tic tutti sui pallini; fermata a " + fr.toFixed(2) + " dello spicchio";
  } });

  async function trascina(w, gradi, ms) {
    var R = w.document.querySelector(".ru-alto .ru-piatto-alto");
    if (!R) return "niente ruota";
    var r = R.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, rr = r.width * 0.36, a0 = -90, Ev = w.PointerEvent || w.MouseEvent, n = 8;
    function ev(t, a) { var x = cx + rr * Math.cos(a * Math.PI / 180), y = cy + rr * Math.sin(a * Math.PI / 180); R.dispatchEvent(new Ev(t, { bubbles: true, cancelable: true, pointerId: 9, pointerType: "touch", isPrimary: true, clientX: x, clientY: y })); }
    ev("pointerdown", a0);
    for (var k = 1; k <= n; k++) { await W.dorme(ms / n); ev("pointermove", a0 + gradi * k / n); }
    ev("pointerup", a0 + gradi);
    return "";
  }
  COPIONE.aggiungi("rp2", { nome: "Ruota della Fortuna: chiodi piccoli a metà spicchio, tic solo sui chiodi anche in frenata", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 });
    var tess = await W.aspetta(function () { return A.tessera(w, "La Ruota della Fortuna"); }, 6000); if (!tess) no("non trovo la Ruota"); tess.click(); await W.dorme(300);
    if (!W.clicca(w, /Contro i Bot/, ".modo-grande")) no("non c'è «Contro i Bot»");
    await W.dorme(300);
    if (!W.clicca(w, /Comincia/)) no("non trovo «Comincia»");
    var Rr = w.__RUOTA, disco = null, note = null, fot = null;
    function tasto(L) { return [].find.call(w.document.querySelectorAll(".ru-qwerty .ru-btn.lettera"), function (b) { return b.textContent === L && !b.disabled; }); }
    // la partita va avanti da sola: quando tocca a Paky la lancia col dito, quando deve dire una consonante ne dice una che non c'è
    async function prossimoGiro(conFoto) {
      var t0 = Date.now(), g0 = Rr.ultima ? Rr.ultima.giroN : -1;
      while (Date.now() - t0 < 120000) {
        var Q = Rr.ultima;
        if (Q && Q.giroN > g0 && Q.fase === "girando") return Q;
        if (Q && Q.giocatori && Rr.H && !Rr.H.sigla) {
          var p = Q.giocatori[Q.turno];
          if (p && !p.bot && Q.fase === "gira" && w.document.querySelector(".ru-alto.on.tocca")) {
            if (!disco) { disco = w.document.querySelector(".ru-alto .ru-disco"); note = audio(w, function () { return rot(disco); }); fot = segui(w, disco, function () { return rot(disco); }); }
            if (conFoto) await foto("fortuna-ferma");
            await W.dorme(500); var e = await trascina(w, 90, 100); if (e) no(e); await W.dorme(600); continue;
          }
          if (p && !p.bot && Q.fase === "consonante") {
            var Lx = "BCDFGHLMNPQRSTVZ".split("").filter(function (L) { return Q.frase.indexOf(L) < 0 && !Q.chiamate[L]; })[0];
            var bt = Lx && tasto(Lx); if (bt) { bt.click(); await W.dorme(200); bt.click(); }
          }
        }
        if (!disco && w.document.querySelector(".ru-alto .ru-disco")) { disco = w.document.querySelector(".ru-alto .ru-disco"); note = audio(w, function () { return rot(disco); }); fot = segui(w, disco, function () { return rot(disco); }); }
        await W.dorme(120);
      }
      no("in 2 minuti la ruota non gira");
    }
    var Q1 = await prossimoGiro(false), ms = Q1.giroMs || 6000, a = Q1.angolo;
    if (!await W.aspetta(function () { return Math.abs(rot(disco) - a) < 0.01 && !w.document.querySelector(".ru-alto.gira"); }, ms + 4000)) no("la ruota non si ferma sull'angolo della foto");
    var tic = note.filter(function (x) { return x.tipo === "square" && (x.f === 1650 || x.f === 1900); });
    var ultimo = tic.length ? tic[tic.length - 1].t : 0, lenti = tic.filter(function (x) { return x.t > ultimo - 2000; });
    controllaTic(lenti, fot, 7.5, "Fortuna");
    lenti.forEach(function (x, i) {   // il grande (1650) sui multipli di 15, il piccolo (1900) a metà
      var prima = null; fot.forEach(function (y) { if (y.t < x.t) prima = y.a; });
      var gr = Math.ceil((Math.min(prima, x.a) - 1e-6) / 7.5) % 2 === 0;
      if (gr !== (x.f === 1650)) no("Fortuna: il tic n. " + (i + 1) + " della frenata ha il suono del chiodo " + (x.f === 1650 ? "grande" : "piccolo") + " ma passa un chiodo " + (gr ? "grande" : "piccolo"));
    });
    // il giro dopo, solo per le foto
    if (W.__foto) {
      var Q2 = await prossimoGiro(true); await W.dorme(Math.max(0, (Q2.giroMs || 6000) - 2800)); await foto("fortuna-rallenta");
      await W.aspetta(function () { return !w.document.querySelector(".ru-alto.gira"); }, 9000); await W.dorme(300); await foto("fortuna-fermata");
    }
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return tic.length + " tic nel giro; frenata: " + lenti.length + " tic tutti sui chiodi (" + lenti.filter(function (x) { return x.f === 1900; }).length + " sui piccoli)";
  } });

  COPIONE.aggiungi("rp3", { nome: "Ruota del 100: un clic per pallino, anche in frenata", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 });
    if (!w.SGPrezzoScena) { var sc = w.document.createElement("script"); sc.src = "js/games/prezzo-scena.js?" + Date.now(); w.document.head.appendChild(sc); await W.aspetta(function () { return w.SGPrezzoScena; }, 15000); }
    if (!w.SGPrezzoScena) no("il Prezzo è Giusto non arriva");
    var Z = w.SGPrezzoScena; Z.stile();
    function el(tag, at, figli) { var n = w.document.createElement(tag); at = at || {}; if (at.class) n.className = at.class; if (at.text != null) n.textContent = at.text; (figli || []).forEach(function (f) { n.appendChild(f); }); return n; }
    var R = Z.ruota(el, { alt: 62 }), str = R.el.querySelector(".pz-rstr");
    var box = el("div"); box.style.cssText = "position:fixed;inset:0;z-index:99999;background:#0d1020;display:flex;align-items:center;justify-content:center";
    var dentro = el("div"); dentro.style.cssText = "width:150px"; dentro.appendChild(R.el); box.appendChild(dentro); w.document.body.appendChild(box);
    // pos della striscia: la freccia sta sulla seconda casella (y = -(pos * H) + H)
    function pos() { var m = /translate3d\(0px?,\s*([-\d.]+)px/.exec(str.style.transform); return m ? (62 - +m[1]) / 62 : null; }
    var note = audio(w, pos), fot = segui(w, str, pos);
    await W.dorme(400); await foto("cento-ferma");
    R.gira(0.7, 0, -1);
    await W.dorme(700);
    await R.arriva(55); await W.dorme(200); await foto("cento-fermata");
    if (R.valore() !== 55) no("la Ruota del 100 si ferma su " + R.valore() + " invece di 55");
    var clic = note.filter(function (x) { return x.tipo === "square" && x.f >= 1700 && x.f <= 1900; });
    var ultimo = clic.length ? clic[clic.length - 1].t : 0, lenti = clic.filter(function (x) { return x.t > ultimo - 1500; });
    // in caselle: un pallino ogni mezza casella (grande a x,5, piccolo a x,0); 1 casella = 2 «gradi» da 0,5
    controllaTic(lenti, fot, 0.5, "Ruota del 100");
    if (W.__foto) { R.gira(0.7, 0, -1); await W.dorme(700); var f2 = R.arriva(20); await W.dorme(900); await foto("cento-frena"); await f2; }
    box.remove();
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return clic.length + " clic; frenata: " + lenti.length + " clic tutti sui pallini; fermata sul 55";
  } });
})();

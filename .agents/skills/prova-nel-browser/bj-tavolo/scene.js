// IL BLACK JACK, la caccia ai difetti (22 nov 2026, chat «🃏 Black Jack»): le scene per le foto (partite intere online e sullo stesso telefono).
// Uso (dopo copione-prova.js e preferiti/blackjack.js): await COPIONE.carica("bj-tavolo/scene.js"); await BJT.apri(["Giulia", "Luca"], { mani: 4 }) …
// Lo strumento delle foto (foto.js qui accanto) le chiama e fotografa ogni telefono. Profili e monete finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T;
  function no(p) { throw new Error("NO: " + p); }
  function vm() { return W.vmDi(BJT.C) || {}; }
  function tasto(w, re) { return w && [].find.call(w.document.querySelectorAll(".bj-hero button, .bj-hero .bj-b"), function (x) { return re.test(x.textContent.trim()) && !x.disabled; }); }
  function tocca(w, re) { var b = tasto(w, re); if (b) b.click(); return !!b; }
  // le monete finte del profilo di prova (mai vere): ogni telefono parte con queste
  function portafoglio(nome, monete) {
    W.__portafogli = W.__portafogli || {}; W.__portafogli[nome] = monete;
    return function (w) {
      try { w.SGNube.fiches = function () { return W.__portafogli[nome]; }; w.SGNube.salvaFiches = function (id, v) { W.__portafogli[nome] = v; }; } catch (e) {}
    };
  }
  function prepara(nome, opz) {
    var pf = portafoglio(nome, (opz && opz.monete) || 25000), tr = opz && opz.mazzo;
    return function (w) { pf(w); if (tr) A.bjTrucca(w, tr); if (W.__BJPROP != null) try { w.localStorage.setItem("sg-bj-prop", W.__BJPROP); } catch (e) {} };
  }
  var BJT = W.BJT = {
    C: null, nomi: [], vm: vm, tasto: tasto, tocca: tocca,
    // la stanza del Black Jack (senza la Sala): Paky tiene la partita, gli amici entrano col link
    apri: async function (amici, imp, opz) {
      opz = opz || {};
      if (!W.__prepCH) await COPIONE.carica("migliora/casino-horto.js");
      var P = await W.apriTel("Paky", { x: 0, ch: true, prima: prepara("Paky", { monete: opz.monete, mazzo: opz.mazzo }) });
      P.__imp = Object.assign({ tempo: 0 }, imp || {});
      var C = BJT.C = await W.apriStanza(P, "Black Jack");
      BJT.nomi = ["Paky"];
      for (var i = 0; i < amici.length; i++) {
        var n = amici[i], k = i + 2;
        await W.apriTel(n, { hash: "gioco=blackjack&stanza=" + C, x: 150 * (i + 1), ch: true, prima: prepara(n, { monete: (opz.moneteAmici || {})[n] || opz.monete }) });
        if (!await W.aspetta(function () { return A.contaDentro(vm()) >= k || ((vm().giocatori || []).length >= k); }, 15000) && !await W.aspetta(function () { return new RegExp(n).test(T(P)); }, 4000)) no(n + " non entra in saletta");
        BJT.nomi.push(n);
        await W.dorme(250);
      }
      await W.dorme(opz.attesa || 1200);
      return C;
    },
    comincia: async function () {
      var P = W.finestra("Paky");
      if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go") || W.clicca(P, /Comincia/); }, 6000)) no("l'host non ha «Comincia»");
      var v = await W.aspetta(function () { var x = vm(); return x.fase === "punta" ? x : null; }, 15000);
      if (!v) no("la partita non comincia (" + vm().fase + ")");
      return v;
    },
    // puntano tutti (ognuno dal suo telefono, coi suoi tasti)
    punta: async function (salta) {
      var v = vm(); if (v.fase !== "punta") return;
      for (var i = 0; i < v.giocatori.length; i++) {
        var g = v.giocatori[i]; if (g.via || g.puntata || (salta && salta.indexOf(g.nome) >= 0)) continue;
        var w = W.finestra(g.nome); if (!w) continue;
        await W.aspetta(function () { return tocca(w, /^Punta /); }, 5000);
        await W.dorme(150);
      }
    },
    // una mossa della mano di turno: chi gioca tocca i SUOI tasti (scelta: funzione (g, mano, punteggio) → "Carta"/"Stai"/…)
    turno: async function (scelta) {
      var v = vm();
      if (v.fase === "assic") { v.giocatori.forEach(function (g) { var w = W.finestra(g.nome); if (w) tocca(w, /^No$|Niente/); }); await W.dorme(300); return true; }
      if (v.fase !== "gioca") return false;
      var g = v.giocatori[v.turno]; if (!g) return false;
      var m = g.mani[g.attiva] || { carte: [] }, w = W.finestra(g.nome);
      var p = 0, assi = 0; m.carte.forEach(function (c) { p += Math.min(10, c.v); if (c.v === 1) assi++; }); if (assi && p + 10 <= 21) p += 10;
      var vuole = (scelta && scelta(g, m, p)) || (p < 15 ? "Carta" : "Stai");
      var ok = await W.aspetta(function () { return tocca(w, new RegExp("^" + vuole)) || (vuole !== "Stai" && vuole !== "Carta" && tocca(w, /^Carta$/)); }, 4000);
      if (!ok) tocca(w, /^Stai$/);
      await W.dorme(250);
      return true;
    },
    // una mano intera fino all'esito (fermati = funzione chiamata a ogni passo: torna true per fermarsi lì)
    mano: async function (scelta, fermati) {
      var fine = Date.now() + 90000;
      while (Date.now() < fine) {
        var v = vm();
        if (fermati && await fermati(v)) return v;
        if (v.fase === "esito" || v.fase === "fine") return v;
        if (v.fase === "punta") await BJT.punta();
        else if (v.fase === "assic" || v.fase === "gioca") await BJT.turno(scelta);
        await W.dorme(200);
      }
      no("la mano non finisce (" + vm().fase + ")");
    },
    nuova: async function () {
      var P = W.finestra("Paky"), g = vm().giro;
      await W.aspetta(function () { return tocca(P, /Nuova mano/); }, 15000);
      return W.aspetta(function () { var x = vm(); return x.fase === "punta" && x.giro !== g ? x : null; }, 15000);
    },
    basta: async function () {
      var P = W.finestra("Paky");
      await W.aspetta(function () { return tocca(P, /Basta così/); }, 8000);
      await W.dorme(300);
      W.clicca(P, /^Sì|Chiudi|Basta/, ".cf-si");
      return W.aspetta(function () { return vm().fase === "fine" ? vm() : null; }, 15000);
    },
    // chi arriva tardi (col link) e chi guarda soltanto (&guarda=1)
    tardi: async function (n, x) { await W.apriTel(n, { hash: "gioco=blackjack&stanza=" + BJT.C, x: x || 1300, ch: true, prima: prepara(n, {}) }); await W.dorme(3500); },
    guarda: async function (n, x) { await W.apriTel(n, { hash: "gioco=blackjack&stanza=" + BJT.C + "&guarda=1", x: x || 1450, ch: true, prima: prepara(n, {}) }); await W.dorme(3500); },
    // sullo stesso telefono: i nomi nelle impostazioni
    locale: async function (nomi, imp, opz) {
      opz = opz || {};
      if (!W.__prepCH) await COPIONE.carica("migliora/casino-horto.js");
      var P = await W.apriTel("Paky", { x: 0, ch: true, prima: prepara("Paky", { monete: opz.monete, mazzo: opz.mazzo }) });
      P.__imp = Object.assign({}, imp || {});
      var tess = await W.aspetta(function () { return A.tessera(P, "Black Jack"); }, 8000); if (!tess) no("non trovo il Black Jack");
      tess.click(); await W.dorme(400);
      if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non c'è «Su questo telefono»");
      await W.dorme(500);
      // i giocatori in più (fino al primo che c'è già: il profilo)
      for (var i = 0; i < (nomi || []).length; i++) {
        var inp = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll("input"), function (x) { return !x.value && x.offsetParent; }); }, 2000);
        if (!inp) { if (!W.clicca(P, /Aggiungi|＋|\+ /)) break; await W.dorme(200); inp = [].find.call(P.document.querySelectorAll("input"), function (x) { return !x.value && x.offsetParent; }); }
        if (!inp) break;
        inp.value = nomi[i]; inp.dispatchEvent(new P.Event("input", { bubbles: true })); await W.dorme(120);
        W.clicca(P, /Aggiungi|＋/);
        await W.dorme(150);
      }
      for (var k = 0; k < 20 && !P.document.querySelector(".bj-wrap"); k++) { await W.dorme(400); W.clicca(P, /Avanti|Comincia|Gioca|Si parte|Iniziamo/); }
      if (!await W.aspetta(function () { return P.document.querySelector(".bj-wrap"); }, 5000)) no("il tavolo non si apre («" + T(P).slice(0, 100) + "»)");
      await W.dorme(700); var sala = P.document.querySelector(".bj-sala"); if (sala) sala.click(); await W.dorme(400);
      return P;
    },
    // sullo stesso telefono si passa il telefono: tocca i tasti che ci sono (scelta come sopra, sul punteggio scritto)
    passoLocale: async function () {
      var P = W.finestra("Paky");
      if (tocca(P, /^Punta /)) return "punta";
      if (tocca(P, /^No$|Niente/)) return "assic";
      var h = (P.document.querySelector(".bj-hero") || {}).innerText || "";
      var n = +((h.match(/\b(\d{1,2})\b/) || [])[1] || 0);
      if (n && n < 15 && tocca(P, /^Carta$/)) return "carta";
      if (tocca(P, /^Stai$/)) return "stai";
      if (tocca(P, /^Carta$/)) return "carta";
      return null;
    }
  };
})();

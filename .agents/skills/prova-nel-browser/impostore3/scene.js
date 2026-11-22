// L'IMPOSTORE, la caccia ai difetti (22 nov 2026): le scene per le foto (partite intere online e sullo stesso telefono).
// Uso (dopo copione-prova.js): await COPIONE.carica("impostore3/scene.js"); await I3.apri(["Giulia", "Luca"], { mani: 2 }) …
// Lo strumento delle foto (foto.js qui accanto) le chiama e fotografa ogni telefono. Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, CHIAVE = "sg_impostore_regole", NOME = "L'Impostore", GID = "impostore";
  function no(p) { throw new Error("NO: " + p); }
  function vm() { return W.vmDi(I3.C) || {}; }
  function prima(nome, regole) {
    var conta = A.contaPartite(nome);
    return function (w) { if (regole) try { w.localStorage.setItem(CHIAVE, JSON.stringify(regole)); } catch (e) {} conta(w); };
  }
  function scriviIn(w, testo) {
    var inp = w.document.querySelector(".im-input"), b = w.document.querySelector(".im-invia");
    if (!inp || !b) return false;
    inp.value = testo; inp.dispatchEvent(new w.Event("input", { bubbles: true })); b.click(); return true;
  }
  function votaIn(w, nome) {
    var b = [].filter.call(w.document.querySelectorAll(".im-vb"), function (x) { return (x.querySelector("b") || {}).textContent === nome; })[0];
    if (!b || b.disabled) return false; b.click(); return true;
  }
  function carta(w) { var d = w && w.document, q = function (s) { var e = d && d.querySelector(s); return e ? e.textContent : ""; }; return { su: q(".im-c-su"), grande: q(".im-c-grande"), giu: q(".im-c-giu") }; }
  function ruoloDi(w) { var c = carta(w); return /impostore/.test(c.su) ? "imp" : /spia/.test(c.su) ? "spia" : /La tua parola/.test(c.su) ? "civ" : null; }
  var INDIZI = ["frizzante", "rotondo", "estate", "nonna", "lontano", "rumore", "morbido", "veloce", "antico", "piccante", "festa", "notte"];
  var I3 = W.I3 = {
    C: null, nomi: [], reg: null,
    vm: vm, carta: carta, ruoloDi: ruoloDi,
    // chi gioca adesso (anche chi è entrato dopo): i nomi dalla foto
    ora: function () { return (vm().players || []).filter(function (p) { return !p.via && !p.fuori; }).map(function (p) { return p.nome; }); },
    // la stanza dell'Impostore (senza la Sala): Paky tiene la partita, gli amici entrano col link
    apri: async function (amici, regole, opz) {
      opz = opz || {};
      I3.reg = Object.assign({ mani: 1, giri: 2, tempo: 0, indizi: "scritti", spia: "no", aiuto: "simile", voto: "una" }, regole || {});
      var P = await W.apriTel("Paky", { x: 0, prima: prima("Paky", I3.reg) });
      var C = I3.C = await W.apriStanza(P, NOME);
      I3.nomi = ["Paky"];
      for (var i = 0; i < amici.length; i++) {
        var n = amici[i], k = i + 2;
        await W.apriTel(n, { hash: "gioco=" + GID + "&stanza=" + C, x: 150 * (i + 1), prima: prima(n) });
        if (!await W.aspetta(function () { return A.contaDentro(vm()) >= k; }, 12000)) no(n + " non entra in saletta");
        I3.nomi.push(n);
        await W.dorme(250);
      }
      await W.dorme(opz.attesa || 1200);
      return C;
    },
    comincia: async function () {
      var P = W.finestra("Paky");
      if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go") || W.clicca(P, /Comincia/); }, 6000)) no("l'host non ha «Comincia»");
      var v = await W.aspetta(function () { var x = vm(); return x.fase === "gioco" && x.passo ? x : null; }, 12000);
      if (!v) no("la partita non comincia");
      await W.aspetta(function () { return I3.nomi.every(function (n) { return ruoloDi(W.finestra(n)); }); }, 8000);
      return v;
    },
    // i ruoli di tutti quelli in partita (anche chi a eliminazione è già fuori)
    ruoli: function () { var r = {}; (vm().players || []).filter(function (p) { return !p.via; }).forEach(function (p) { r[p.nome] = ruoloDi(W.finestra(p.nome)); }); return r; },
    chi: function (ruolo) { var r = I3.ruoli(); return Object.keys(r).filter(function (n) { return r[n] === ruolo; }); },
    passo: async function (p, ms) { return W.aspetta(function () { var v = vm(); return v.fase === "gioco" && v.passo === p ? v : null; }, ms || 12000); },
    // gli indizi del giro: scrivono tutti tranne quelli in "salta" (con la frase "a" dopo, l'indizio)
    scrivi: async function (salta, chiudi) {
      var v = await I3.passo("indizi"); if (!v) return false;
      var g = v.giro, k = 0;
      var nomi = I3.ora();
      for (var i = 0; i < nomi.length; i++) {
        var n = nomi[i]; if (salta && salta.indexOf(n) >= 0) continue;
        var w = W.finestra(n); if (!w) continue;
        if (!await W.aspetta(function () { return w.document.querySelector(".im-input") || w.document.querySelector(".im-fatto"); }, 5000)) continue;
        if (w.document.querySelector(".im-input")) scriviIn(w, INDIZI[(i + g * 3 + k++) % INDIZI.length]);
        await W.dorme(120);
      }
      if (chiudi !== false) await W.aspetta(function () { var x = vm(); return x.passo !== "indizi" || x.giro !== g; }, 15000);
    },
    // «🗳️ Votiamo» da tutti
    pronti: async function (nomi) {
      nomi = nomi || I3.ora();
      for (var i = 0; i < nomi.length; i++) { var w = W.finestra(nomi[i]); var b = w && await W.aspetta(function () { var x = w.document.querySelector(".im-pronto"); return x && !x.disabled ? x : null; }, 3000); if (b) b.click(); await W.dorme(100); }
    },
    // i voti: chi = funzione (nome) → nome votato
    vota: async function (chi, salta) {
      if (!await I3.passo("voto")) no("non si vota (" + vm().passo + ")");
      await W.dorme(500);
      var nomi = I3.ora();
      for (var i = 0; i < nomi.length; i++) {
        var n = nomi[i]; if (salta && salta.indexOf(n) >= 0) continue;
        var w = W.finestra(n); if (!w) continue;
        var t = chi(n); if (t) { await W.aspetta(function () { return votaIn(w, t); }, 3000); await W.dorme(120); }
      }
    },
    // l'ultima possibilità: l'impostore tocca una parola (giusta o no)
    indovina: async function (giusta) {
      var v = await I3.passo("ultima", 15000); if (!v) return false;
      var imp = I3.chi("imp")[0], w = W.finestra(imp); await W.dorme(1200);
      var par = carta(W.finestra(I3.chi("civ")[0])).grande;
      var bs = [].slice.call(w.document.querySelectorAll(".im-sc, .im-scl"));
      var b = bs.filter(function (x) { return giusta ? x.textContent === par : x.textContent !== par; })[0];
      if (b) b.click(); return !!b;
    },
    blocca: function (n) {
      var w = W.finestra(n);
      try { Object.defineProperty(w.document, "hidden", { configurable: true, get: function () { return true; } }); w.document.dispatchEvent(new w.Event("visibilitychange")); } catch (e) {}
      W.spegni(n);
    },
    sblocca: function (n) {
      var w = W.finestra(n); W.riaccendi(n);
      try { Object.defineProperty(w.document, "hidden", { configurable: true, get: function () { return false; } }); w.document.dispatchEvent(new w.Event("visibilitychange")); } catch (e) {}
    },
    // chi arriva tardi (col link) e chi guarda soltanto (&guarda=1)
    tardi: async function (n, x) { await W.apriTel(n, { hash: "gioco=" + GID + "&stanza=" + I3.C, x: x || 1300, prima: prima(n) }); await W.dorme(3500); },
    guarda: async function (n, x) { await W.apriTel(n, { hash: "gioco=" + GID + "&stanza=" + I3.C + "&guarda=1", x: x || 1450, prima: prima(n) }); await W.dorme(3500); },
    testo: function (n) { return T(W.finestra(n)).replace(/\s+/g, " ").trim(); },
    // le parole che non devono mai passare nella foto per tutti: le cerco nella vm
    spoiler: function () {
      var v = vm(), s = JSON.stringify(v), civ = I3.chi("civ")[0], imp = I3.chi("imp")[0], male = [];
      if (v.passo === "esito" || v.fase !== "gioco") return male;
      var par = civ ? carta(W.finestra(civ)).grande : null;
      if (par && s.toLowerCase().indexOf("\"" + par.toLowerCase() + "\"") >= 0) male.push("la parola «" + par + "» nella foto (" + v.passo + ")");
      return male;
    }
  };
})();

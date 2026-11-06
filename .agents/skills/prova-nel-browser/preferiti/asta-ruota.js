// 🎡 LA RUOTA DELLO SPAREGGIO (6 nov 2026, il proprietario: «tanti spicchi con i due nomi… rallenta piano piano… fino all'ultimo non si
// capisce mai di chi è»; online deve girare uguale su tutti i telefoni e fermarsi nello stesso istante).
// ru1 Online in 3 a buste, rete a 300 ms, orologi sfasati (Giulia 3,2 s avanti, Luca 1,8 s indietro): tutti scrivono 2, nello spareggio
//     tutti restano → la ruota tra 3. Su tutti i telefoni: tanti spicchi coi nomi alternati, lo stesso angolo negli stessi istanti
//     (da metà giro, quando rallenta), la fermata nello stesso istante (entro 150 ms) sullo stesso angolo, e il calciatore a chi vince.
// Si carica dopo preferiti/asta.js (usa gli stessi telefoni finti).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  var OROLOGI = { Paky: 0, Giulia: 3200, Luca: -1800 };
  function angolo(w) { var c = q(w, ".st-ruota canvas.disco"); if (!c) return null; var m = /rotate\(([-\d.]+)deg\)/.exec(c.style.transform || ""); return m ? +m[1] : 0; }
  COPIONE.aggiungi("ru1", { nome: "🎡 La ruota dello spareggio online in 3 (rete 300 ms, orologi sfasati): tanti spicchi, gira uguale e si ferma insieme su tutti", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"], vecchio = W.BR.ritardo, x = [];
    try {
      W.BR.ritardo = 300;
      var imp = { formato: "fanta", compra: "buste", giornata: false };
      var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
      for (var i = 1; i < NOMI.length; i++) await W.apriTel(NOMI[i], { hash: "gioco=astafanta&stanza=" + C, x: 185 * i });
      NOMI.forEach(function (n) { if (OROLOGI[n]) W.spostaOrologio(n, OROLOGI[n]); });
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 15000)) no("non entrano in 3");
      W.clicca(P, /Comincia/);
      if (!await W.aspetta(function () { return vm(C).fase === "busta" && vm(C).busta && vm(C).busta.gara.length === 3; }, 20000)) no("la prima busta in 3 non arriva");
      function win(n) { return n === "Paky" ? P : W.finestra(n); }
      async function chiudi(n, quanto) {
        var w = win(n), ok;
        if (!quanto) { ok = await W.aspetta(function () { return bott(w, ".st-bf-tasti .btn", /Passo|Resto a/); }, 6000); if (!ok) no(n + " non ha «Resto»"); ok.click(); return; }
        var piu = await W.aspetta(function () { return bott(w, ".st-bst button", /^\+$/); }, 6000); if (!piu) no(n + " non ha il + della busta");
        for (var k = 0; k < 40 && parseInt((q(w, ".st-bst .v") || {}).textContent, 10) < quanto; k++) piu.click();
        ok = bott(w, ".st-bf-tasti .btn", new RegExp("Chiudo: " + quanto + " ")); if (!ok) no(n + ": niente «Chiudo: " + quanto + "»"); ok.click();
      }
      for (var a = 0; a < 3; a++) await chiudi(NOMI[a], 2);
      if (!await W.aspetta(function () { return vm(C).fase === "busta" && vm(C).busta && vm(C).busta.sp; }, 20000)) no("niente spareggio dopo tre buste da 2");
      await W.dorme(1200);   // (l'orologio è misurato da tempo: le domande vanno da sole ogni 4 s)
      for (a = 0; a < 3; a++) await chiudi(NOMI[a], 0);
      if (!await W.aspetta(function () { return vm(C).fase === "ruota"; }, 20000)) no("ancora pari: niente ruota");
      var ru = vm(C).ruota;
      if (!ru.piano || ru.piano.K < 12 || ru.piano.K % 3 || ru.piano.sp % 3 !== ru.vince) no("il piano della ruota non va: " + JSON.stringify(ru.piano));
      if (!await W.aspetta(function () { return NOMI.every(function (n) { return q(win(n), ".st-ruota canvas.disco"); }); }, 4000)) no("la ruota non c'è su tutti i telefoni");
      NOMI.forEach(function (n) { var c = q(win(n), ".st-ruota canvas.disco"), nm = c.getAttribute("data-nomi").split(","), k = +c.getAttribute("data-spicchi"); if (nm.length !== 3 || k !== ru.piano.K) no(n + ": " + k + " spicchi, nomi " + nm.join(", ")); if (nm.indexOf("Tu") < 0) no(n + " non si vede come «Tu» sulla ruota"); });
      // gli angoli negli stessi istanti (da metà giro: all'inizio va a quasi un grado al millisecondo) e la fermata
      var fermi = {}, campioni = [], t0 = performance.now(), peggio = 0;
      while (performance.now() - t0 < 14000 && Object.keys(fermi).length < 3) {
        var an = NOMI.map(function (n) { return angolo(win(n)); });
        NOMI.forEach(function (n, j) { var f = q(win(n), ".st-ruota .fine"); if (f && f.textContent && fermi[n] == null) fermi[n] = { t: performance.now(), a: an[j] }; });
        if (an.every(function (v) { return v != null; }) && an.some(function (v) { return v > 0; })) campioni.push(an);
        await new Promise(function (r) { requestAnimationFrame(r); });
      }
      if (Object.keys(fermi).length < 3) no("la ruota non si ferma su tutti (" + JSON.stringify(fermi) + ")");
      var fin = ru.piano.giri * 360 - (ru.piano.sp + ru.piano.fra) * 360 / ru.piano.K;
      campioni.forEach(function (c) { if (Math.min.apply(null, c) > fin * 0.5) peggio = Math.max(peggio, Math.max.apply(null, c) - Math.min.apply(null, c)); });
      var ts = NOMI.map(function (n) { return fermi[n].t; }), sc = Math.round(Math.max.apply(null, ts) - Math.min.apply(null, ts));
      NOMI.forEach(function (n) { if (Math.abs(fermi[n].a - fin) > 0.6) no(n + " si ferma a " + fermi[n].a + "° invece di " + fin.toFixed(2) + "°"); });
      x.push(ru.piano.K + " spicchi, " + ru.piano.giri + " giri, si ferma al " + Math.round(ru.piano.fra * 100) + "% dello spicchio di " + ru.nomi[ru.vince]);
      x.push("da metà giro lo scarto più grande tra i telefoni " + peggio.toFixed(1) + "° (" + campioni.length + " istanti)");
      x.push("si fermano insieme entro " + sc + " ms");
      if (peggio > 6) no("i telefoni girano sfasati: " + x.join(" · "));
      if (sc > 150) no("non si fermano insieme: " + x.join(" · "));
      if (!await W.aspetta(function () { return vm(C).fase === "esito" || (vm(C).esito && vm(C).esito.chiId); }, 8000) || vm(C).esito.chiId !== ru.ids[ru.vince] || vm(C).esito.prezzo !== 2) no("la ruota non dà il calciatore a chi vince (" + JSON.stringify(vm(C).esito) + ")");
      x.push("il calciatore va a " + ru.nomi[ru.vince] + " per 2");
      return x.join(" · ");
    } finally { W.BR.ritardo = vecchio; }
  } });
})();

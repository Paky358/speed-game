// 🃏 LE BUSTE SUL TAVOLO (6 nov 2026, il proprietario ha scelto l'idea A: le buste di tutti coperte con la faccina e il pallone, le luci
// che si abbassano col battito, chi passa col cartellino rosso, poi una alla volta dalla più bassa, le ultime due testa a testa e aperte
// NELLO STESSO ISTANTE).
// tv1 I tempi del piano (pianoApri) dipendono solo da quante buste ci sono e da quante passano, MAI da chi vince o dalle cifre: 2.000 aperture
//     a caso (da 2 a 10, spareggi compresi) confrontate con le stesse buste rimescolate. Durata in 3 e in 10.
// tv2 Online in 8 (rete a 300 ms, orologi sfasati): stessa sequenza su tutti gli 8 telefoni negli stessi istanti (luci giù, chi passa,
//     ogni busta girata, testa a testa, apertura, la scritta finale: scarto entro 150 ms), e niente spoiler prima dell'apertura (né la
//     scritta di chi vince, né la busta d'oro, né il nome di chi vince in alto); poi il calciatore a chi vince.
// Si carica dopo preferiti/asta.js (usa gli stessi telefoni finti).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  async function motore(w) {
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), fuori = {}, ag = "function costruisciMazzoFanta(n) {";
    if (src.indexOf(ag) < 0) no("non trovo il punto del motore");
    src = src.replace(ag, "FUORI.pianoApri = pianoApri; FUORI.apriMs = apriMs; FUORI.contaBuste = contaBuste; FUORI.apertura = apertura; " + ag);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, fuori);
    return fuori;
  }
  COPIONE.aggiungi("tv1", { nome: "🃏 Le buste sul tavolo: i tempi dell'apertura non dicono chi vince (solo quante buste e quante passano)", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), x = [], prove = 0;
    function rnd(n) { return Math.floor(Math.random() * n); }
    function firma(P) { return JSON.stringify([P.passa, P.testa, P.apre, P.fine, P.dur, Object.keys(P.giro).map(function (k) { return P.giro[k]; }).sort(), P.duo.length]); }
    for (var k = 0; k < 2000; k++) {
      var n = 2 + rnd(9), sp = rnd(4) === 0 ? 1 + rnd(5) : 0, l = [];
      for (var i = 0; i < n; i++) l.push({ id: "g" + i, nome: "G" + i, q: rnd(3) === 0 ? 0 : (sp ? sp + 1 : 1) + rnd(12) });
      // le stesse buste con le cifre rimescolate tra le persone (chi passa resta chi passa): un altro vincitore, la stessa forma
      var cifre = l.filter(function (o) { return o.q; }).map(function (o) { return o.q; }).sort(function () { return Math.random() - 0.5; }), j = 0;
      var l2 = l.map(function (o) { return { id: o.id, nome: o.nome, q: o.q ? cifre[j++] : 0 }; });
      var B = { n: 1, sp: sp }, a1 = M.apertura(B, l, M.contaBuste(l, sp)), a2 = M.apertura(B, l2, M.contaBuste(l2, sp));
      var f1 = firma(M.pianoApri(a1)), f2 = firma(M.pianoApri(a2));
      if (f1 !== f2) no("i tempi cambiano con chi vince: " + JSON.stringify(l) + " → " + f1 + " / " + JSON.stringify(l2) + " → " + f2);
      var P = M.pianoApri(a1);
      if (P.testa != null && !(P.testa < P.apre && P.apre < P.fine && P.fine < P.dur)) no("ordine dei tempi sbagliato: " + JSON.stringify(P));
      prove++;
    }
    var ms3 = M.apriMs(3), ms10 = M.apriMs(10);
    if (ms3 < 5000 || ms3 > 8000 || ms10 > 10500) no("l'apertura dura " + ms3 + " ms in 3 e " + ms10 + " in 10");
    x.push(prove + " aperture a caso (da 2 a 10, spareggi compresi): i tempi sono sempre gli stessi con le cifre rimescolate");
    x.push("durata in 3 " + ms3 + " ms, in 10 " + ms10 + " ms");
    return x.join(" · ");
  } });
  var OROLOGI = { Giulia: 3200, Luca: -1800, Sara: 900, Ugo: -2500 };
  COPIONE.aggiungi("tv2", { nome: "🃏 Le buste sul tavolo online in 8 (rete 300 ms, orologi sfasati): stessi momenti su tutti, niente spoiler prima dell'apertura", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca", "Marco", "Sara", "Anna", "Ugo", "Ivo"], OFF = { Paky: 7, Giulia: 9, Luca: 8, Marco: 0, Sara: 3, Anna: 0, Ugo: 5, Ivo: 1 };
    var vecchio = W.BR.ritardo, x = [];
    try {
      W.BR.ritardo = 300;
      var imp = { formato: "fanta", compra: "buste", giornata: false };
      var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
      for (var i = 1; i < NOMI.length; i++) await W.apriTel(NOMI[i], { hash: "gioco=astafanta&stanza=" + C, x: 185 * i });
      NOMI.forEach(function (n) { if (OROLOGI[n]) W.spostaOrologio(n, OROLOGI[n]); });
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 8; }, 20000)) no("non entrano in 8 (" + (vm(C).giocatori || []).length + ")");
      W.clicca(P, /Comincia/);
      if (!await W.aspetta(function () { return vm(C).fase === "busta" && vm(C).busta && vm(C).busta.gara.length === 8; }, 20000)) no("la prima busta in 8 non arriva");
      function win(n) { return n === "Paky" ? P : W.finestra(n); }
      async function chiudi(n, quanto) {
        var w = win(n), ok;
        if (!quanto) { ok = await W.aspetta(function () { return bott(w, ".st-bf-tasti .btn", /Passo/); }, 6000); if (!ok) no(n + " non ha «Passo»"); ok.click(); return; }
        var piu = await W.aspetta(function () { return bott(w, ".st-bst button", /^\+$/); }, 6000); if (!piu) no(n + " non ha il + della busta");
        for (var k = 0; k < 40 && parseInt((q(w, ".st-bst .v") || {}).textContent, 10) < quanto; k++) piu.click();
        ok = bott(w, ".st-bf-tasti .btn", new RegExp("Chiudo: " + quanto + " ")); if (!ok) no(n + ": niente «Chiudo: " + quanto + "»"); ok.click();
      }
      await W.dorme(1500);   // (l'orologio dell'host si misura da solo)
      for (var a = 0; a < NOMI.length; a++) await chiudi(NOMI[a], OFF[NOMI[a]]);
      if (!await W.aspetta(function () { return vm(C).fase === "apri"; }, 20000)) no("le buste non si aprono");
      var ap = vm(C).apri;
      if (ap.fine !== "vince" || ap.prezzo !== 9 || ap.primi[0] !== A.mioId("Giulia")) no("l'apertura non dice Giulia a 9: " + JSON.stringify(ap));
      // ogni telefono: quando vede ogni momento (performance.now è lo stesso orologio per tutte le finestre della prova)
      var mom = {}, t0 = performance.now(), spoiler = [];
      NOMI.forEach(function (n) { mom[n] = {}; });
      function segna(n, k) { if (mom[n][k] == null) mom[n][k] = performance.now(); }
      while (performance.now() - t0 < 16000 && !NOMI.every(function (n) { return mom[n].fine != null; })) {
        NOMI.forEach(function (n) {
          var w = win(n), tv = q(w, ".st-tavolo"); if (!tv) return;
          var c = tv.className, ban = (q(w, ".st-tavolo .ban") || {}).textContent || "";
          if (/\bgiu\b/.test(c)) segna(n, "giu");
          var ap2 = qa(w, ".st-tavolo .tav .bt.aperta").length; for (var z = 1; z <= ap2; z++) segna(n, "aperte" + z);
          if (/\btesta\b/.test(c)) segna(n, "testa");
          if (/\bsu\b/.test(c)) segna(n, "apre");
          if (/\bfinita\b/.test(c)) segna(n, "fine");
          if (!/\bsu\b/.test(c)) {   // prima dell'apertura: niente che dica chi vince
            var f = q(w, ".st-tavolo .fine"); if (f && w.getComputedStyle(f).visibility !== "hidden") spoiler.push(n + ": la scritta finale si vede prima");
            if (q(w, ".st-tavolo .duo .bt.vince, .st-tavolo .duo .bt.aperta")) spoiler.push(n + ": una busta del testa a testa aperta prima");
            if ((n === "Giulia" ? /Tu:/ : /Giulia/).test(ban)) spoiler.push(n + ": in alto «" + ban + "»");
          }
        });
        await new Promise(function (r) { requestAnimationFrame(r); });
      }
      if (spoiler.length) no("spoiler: " + spoiler.slice(0, 4).join(" · "));
      // (i primi momenti possono arrivare tardi a chi monta il tavolo dopo gli altri: 8 telefoni finti nello stesso computer si rallentano a
      // vicenda; chi arriva tardi si rimette in pari da solo. Insieme entro 150 ms devono essere le ultime buste girate, il testa a testa,
      // l'apertura e la scritta finale)
      var chiavi = Object.keys(mom.Paky), peggio = 0, dove = "";
      ["aperte5", "aperte6", "testa", "apre", "fine"].forEach(function (k) {
        var ts = NOMI.map(function (n) { return mom[n][k]; });
        if (ts.some(function (v) { return v == null; })) no("«" + k + "» non si vede su tutti: " + NOMI.filter(function (n, j) { return ts[j] == null; }).join(", ") + " (Paky ha visto: " + chiavi.join(", ") + "); " + NOMI.filter(function (n, j) { return ts[j] == null; }).map(function (n) { return n + ": " + Object.keys(mom[n]).map(function (kk) { return kk + " " + Math.round(mom[n][kk] - mom.Paky.giu); }).join(", ") + " ora " + Math.round(performance.now() - mom.Paky.giu) + " tavolo " + !!q(win(n), ".st-tavolo") + " fase " + vm(C).fase; }).join(" | "));
        var sc = Math.max.apply(null, ts) - Math.min.apply(null, ts); if (sc > peggio) { peggio = sc; dove = k; }
      });
      x.push("2 passano, 4 girate una alla volta, testa a testa Luca 8 contro Giulia 9: stessi momenti su 8 telefoni, lo scarto più grande " + Math.round(peggio) + " ms («" + dove + "»)");
      x.push("momenti di Paky (ms dall'inizio): " + Object.keys(mom.Paky).map(function (k) { return k + " " + Math.round(mom.Paky[k] - mom.Paky.giu); }).join(", ") + "; il più indietro per momento: " + ["giu", "aperte2", "aperte3", "aperte4", "aperte5", "aperte6", "testa", "apre", "fine"].map(function (k) { var ts = NOMI.map(function (n) { return mom[n][k]; }); return k + " " + Math.round(Math.max.apply(null, ts) - Math.min.apply(null, ts)); }).join(", "));
      if (peggio > 150) no("i telefoni non vanno insieme: " + x.join(" · "));
      var duo = qa(P, ".st-tavolo .duo .bt b").map(function (b) { return b.textContent; }).filter(function (s, i, l) { return l.indexOf(s) === i; });
      if (duo.join(",") !== "Luca,Giulia") no("nel testa a testa non ci sono Luca e Giulia: " + duo.join(","));
      var gv = q(win("Giulia"), ".st-tavolo .duo .bt.vince"), fg = (q(win("Giulia"), ".st-tavolo .fine") || {}).textContent || "", fl = (q(win("Luca"), ".st-tavolo .fine") || {}).textContent || "";
      if (!gv || !/È tuo a 9/.test(fg) || !/Giulia a 9/.test(fl)) no("alla fine: Giulia «" + fg + "», Luca «" + fl + "»");
      x.push("fine: Giulia «" + fg + "», gli altri «" + fl + "»; nessuno spoiler prima dell'apertura");
      if (!await W.aspetta(function () { return vm(C).esito && vm(C).esito.chiId === A.mioId("Giulia") && vm(C).esito.prezzo === 9; }, 9000)) no("il calciatore non va a Giulia per 9 (" + JSON.stringify(vm(C).esito) + ")");
      x.push("il calciatore va a Giulia per 9");
      return x.join(" · ");
    } finally { W.BR.ritardo = vecchio; }
  } });
})();

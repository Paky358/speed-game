// PROVE DI PAROLA D'ORDINE, giro 2 (22 ott 2026), revisione del compito «Il tabellone grande, sempre in vista, in stile C».
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("ordine2/tabellone-rev.js"); await COPIONE.prova("o2r1")
// (carica da sola ordine2/tabellone.js, di cui usa gli aiuti: COPIONE.o2t)
// Con Edge invisibile: prova.js --porta 8995 --carica ordine2/tabellone.js,ordine2/tabellone-rev.js --prova o2r1,o2r2,o2r3,o2r4,o2r5 --rifai
// o2r1 la parola nera vista dal capo (e svelata a fine partita) come nella proposta C scelta dal proprietario: a righe scure col
//      teschio bianco, niente cornice a strisce gialle e nere (ci finivano sopra le parole lunghe: CAVATAPPI, ASTRONAVE a 360 px)
// o2r2 l'indizio dato durante la presentazione la taglia (si legge sul tabellone, non sopra lo studio); «💭 … pensava a» del
//      turno di prima non copre l'indizio nuovo
// o2r3 «🧪 Prova da solo» di IL PAPPONE col capo Bot: il Bot dà il primo indizio quando la presentazione è finita
// o2r4 a 360x640 la scritta grande (indizio con la faccia, «😬 … era dei Blu!» su due righe) non scende sulle caselle
// o2r5 il capo che scrive l'indizio con la tastiera aperta (schermo 360x380): il tabellone prende il posto della chat, si legge
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no;
  async function prep() { if (!COPIONE.o2t) await COPIONE.carica("ordine2/tabellone.js"); return COPIONE.o2t; }
  function senzaErrori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  async function aMisura(nome, L, H) {
    var w = W.finestra(nome), f = document.getElementById("tel-" + nome), d = w.document, vec = { w: f.style.width, h: f.style.height };
    var st = d.createElement("style"); st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}"; d.head.appendChild(st);
    f.style.width = L + "px"; f.style.height = H + "px"; void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(800); w.dispatchEvent(new w.Event("resize")); await W.dorme(400);
    return function () { if (st.parentNode) st.parentNode.removeChild(st); f.style.width = vec.w; f.style.height = vec.h; w.dispatchEvent(new w.Event("resize")); };
  }
  // la nera (coperta, vista dal capo o svelata a fine partita) come nella proposta C: righe scure #2e2e2e/#1d1d1d, teschio bianco,
  // niente giallo e niente pezzi disegnati sopra (::before/::after); la parola dentro la carta
  function controllaNera(w, i, chi) {
    var b = w.document.querySelectorAll(".or-tab .or-carta")[i]; if (!b) no(chi + ": non trovo la nera");
    if (!/(^|\s)cx(\s|$)/.test(b.className) || b.classList.contains("g")) no(chi + ": la nera non è coperta col suo colore (" + b.className + ")");
    var cs = w.getComputedStyle(b), bg = cs.backgroundImage;
    if (!/46, 46, 46/.test(bg) || !/29, 29, 29/.test(bg)) no(chi + ": la nera non è a righe scure come nella proposta C (" + bg.slice(0, 90) + ")");
    if (/252, 196, 25/.test(bg + cs.boxShadow)) no(chi + ": la nera ha ancora il giallo");
    ["::before", "::after"].forEach(function (pe) {
      var c = w.getComputedStyle(b, pe).content;
      if (c && c !== "none" && c !== "normal") no(chi + ": sulla nera c'è ancora un pezzo disegnato sopra (" + pe + " " + c + ")");
    });
    var sg = b.querySelector(":scope > .or-sg[data-s='x'] svg"); if (!sg) no(chi + ": la nera senza teschio");
    if (w.getComputedStyle(b.querySelector(":scope > .or-sg")).color !== "rgb(255, 255, 255)") no(chi + ": il teschio non è bianco (" + w.getComputedStyle(b.querySelector(":scope > .or-sg")).color + ")");
    var s = b.querySelector(".or-w"), br = b.getBoundingClientRect(), sr = s.getBoundingClientRect();
    if (sr.left < br.left - 0.5 || sr.right > br.right + 0.5) no(chi + ": «" + s.textContent + "» esce dalla nera (" + Math.round(sr.width) + " in " + Math.round(br.width) + ")");
    if (w.getComputedStyle(s).color !== "rgb(255, 255, 255)") no(chi + ": la parola sulla nera non è bianca");
    return s.textContent + " " + Math.round(br.width) + "x" + Math.round(br.height);
  }

  // ================= o2r1: la nera come nella proposta C =================
  COPIONE.aggiungi("o2r1", { nome: "Parola d'ordine (revisione): la nera del capo e a fine partita come nella proposta C (righe scure, teschio bianco, niente cornice gialla)", fai: async function () {
    var O = await prep(), N = [];
    var X = await O.partita(["Giulia", "Luca", "Sara"], { Luca: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]), C = X.C;
    await O.comincia(X);
    var ch = await O.chiaveDi("Luca"), ix = ch.indexOf("x");
    await O.tuttiCalmi(X.nomi, 15000);
    var M = [[360, 640], [412, 915]];
    for (var q = 0; q < M.length; q++) {
      var rim = await aMisura("Luca", M[q][0], M[q][1]);
      try {
        await W.aspetta(function () { return O.calmo(W.finestra("Luca")); }, 8000);
        N.push("capo a " + M[q].join("x") + ": " + controllaNera(W.finestra("Luca"), ix, "Luca (capo) a " + M[q].join("x")));
      } finally { rim(); }
    }
    // chi indovina non vede la nera
    var bP = W.finestra("Paky").document.querySelectorAll(".or-tab .or-carta")[ix];
    if (/(^|\s)cx(\s|$)/.test(bP.className) || bP.querySelector(":scope > .or-sg[data-s]")) no("Paky (indovina) vede la nera");
    // l'host chiude la partita: la nera si svela, uguale
    O.manda("Paky", { t: "chiudi" });
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 8000)) no("la partita non si chiude");
    await W.dorme(5500);
    rim = await aMisura("Paky", 360, 640);
    try { N.push("svelata a fine partita (360x640): " + controllaNera(W.finestra("Paky"), ix, "Paky a fine partita")); } finally { rim(); }
    senzaErrori();
    return N.join(" · ");
  } });

  // ================= o2r2: l'indizio taglia la presentazione; «pensava a» non copre l'indizio nuovo =================
  COPIONE.aggiungi("o2r2", { nome: "Parola d'ordine (revisione): l'indizio dato durante la presentazione la taglia; «pensava a» non copre l'indizio nuovo", fai: async function () {
    var O = await prep(), N = [];
    var X = await O.partita(["Giulia", "Luca", "Sara"], { Luca: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]), C = X.C;
    // 1. il capo di turno dà l'indizio mentre la presentazione c'è ancora (ha già il campo per scriverlo)
    if (!await W.aspetta(function () { return W.clicca(X.P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 15000)) no("non comincia");
    var inPres = function (n) { var w = W.finestra(n), ui = w && w.__ORDINE && w.__ORDINE.ui; return !!(ui && ui.inPres && ui.vm && ui.vm.fase === "gioco"); };
    if (!await W.aspetta(function () { return X.nomi.filter(inPres).length >= 2; }, 12000, 20)) no("la presentazione non parte");
    var dentro = X.nomi.filter(inPres), k = vm(C).turno, capo = O.nomeDi(C, vm(C).capo[k]);
    var p = await O.indizio(C, capo, 1, []);
    var tagliate = [];
    for (var j = 0; j < dentro.length; j++) {
      var n = dentro[j], w = W.finestra(n);
      if (!await W.aspetta(function () { var ui = w.__ORDINE.ui; return ui.vm && ui.vm.passo === "indovina"; }, 3000, 20)) no(n + ": l'indizio non arriva");
      var t0 = Date.now();
      var ok = await W.aspetta(function () { var ui = w.__ORDINE.ui; return !ui.inPres && O.suTabellone(w) && w.document.querySelector(".or-cart.su.ind"); }, 1000, 20);
      if (!ok) no(n + ": l'indizio arriva durante la presentazione e non la taglia (inPres " + w.__ORDINE.ui.inPres + ", tabellone " + O.suTabellone(w) + ", scritta «" + O.cart(w) + "»)");
      tagliate.push(n + " " + (Date.now() - t0) + " ms");
    }
    N.push("indizio " + p + " durante la presentazione: tagliata su " + tagliate.join(", "));
    await O.tuttiCalmi(X.nomi, 8000);
    // 2. «💭 … pensava a»: il capo dice cosa intendeva, la squadra ne trova una e passa; l'altro capo dà subito l'indizio
    var ch = await O.chiaveDi(capo), mie = O.coperteDi(C, ch, k);
    O.manda(capo, { t: "intendo", x: vm(C).indizio.x, l: [mie[0], mie[1]] });
    await W.dorme(300);
    var ind = O.indovinoDi(C, k);
    await O.gira(C, ind, mie[0]);
    if (vm(C).turno === k && vm(C).passo === "indovina") O.manda(ind, { t: "passo" });
    if (!await W.aspetta(function () { return vm(C).turno === 1 - k && vm(C).passo === "indizio"; }, 8000)) no("il turno non passa");
    if (!(vm(C).log || []).some(function (e) { return e.t === "pens"; })) no("niente «pensava a» nella partita");
    var p2 = await O.indizio(C, O.nomeDi(C, vm(C).capo[1 - k]), 2, [p]);
    var visti = {}, t1 = Date.now();
    while (Date.now() - t1 < 5500) {
      X.nomi.forEach(function (n) {
        var w = W.finestra(n), ui = w.__ORDINE.ui;
        if (!ui.vm || ui.vm.passo !== "indovina" || !ui.vm.indizio || ui.vm.indizio.parola !== p2) return;
        if (w.document.querySelector(".or-pens.su")) visti[n] = (visti[n] || 0) + 1;
      });
      await W.dorme(50);
    }
    var copre = Object.keys(visti);
    if (copre.length) no("«pensava a» copre l'indizio nuovo " + p2 + " su " + copre.map(function (n) { return n + " (" + visti[n] * 50 + " ms)"; }).join(", "));
    N.push("«pensava a» del turno di prima non copre l'indizio nuovo " + p2 + " (5,5 s guardati su " + X.nomi.length + " telefoni)");
    senzaErrori();
    return N.join(" · ");
  } });

  // ================= o2r4: a 360x640 la scritta grande non copre le caselle =================
  // l'indizio grande (fascia + faccia del capo) e «😬 … era dei Blu!» (a 360 px va su due righe): la scritta sale sopra le
  // squadre ma non scende sulla prima riga di caselle, e non esce dallo schermo
  COPIONE.aggiungi("o2r4", { nome: "Parola d'ordine (revisione): a 360x640 la scritta grande (indizio, parola sbagliata) non copre le caselle", fai: async function () {
    var O = await prep(), N = [];
    var X = await O.partita(["Giulia", "Luca", "Sara"], { Luca: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]), C = X.C;
    await O.comincia(X);
    var ch = await O.chiaveDi("Luca");
    await O.tuttiCalmi(X.nomi, 15000);
    var rim = await aMisura("Paky", 360, 640), wP = W.finestra("Paky");
    function misura(cosa, re) {
      var c = wP.document.querySelector(".or-cart.su"); if (!c || !re.test(c.textContent)) return null;
      var cr = c.getBoundingClientRect(), prima = O.carte(wP)[0].getBoundingClientRect();
      if (cr.bottom > prima.top + 1) no(cosa + ": la scritta grande scende sulle caselle (fino a " + Math.round(cr.bottom) + ", caselle da " + Math.round(prima.top) + ")");
      if (cr.top < 0) no(cosa + ": la scritta grande esce dallo schermo in alto (" + Math.round(cr.top) + ")");
      return cosa + " " + Math.round(cr.top) + "-" + Math.round(cr.bottom) + " (caselle da " + Math.round(prima.top) + ")";
    }
    try {
      var k = vm(C).turno, p = await O.indizio(C, X.capi[k], 2, []), m1 = null;
      await W.aspetta(function () { m1 = misura("indizio " + p, new RegExp(p)); return m1; }, 2000, 30);
      if (!m1) no("niente indizio grande su Paky");
      await W.dorme(1700);
      var ind = O.indovinoDi(C, k);
      await O.gira(C, ind, O.coperteDi(C, ch, k)[0]);
      await O.tuttiCalmi(X.nomi, 8000);
      O.manda(ind, { t: "gira", i: O.coperteDi(C, ch, 1 - k)[0] });
      var m2 = null;
      await W.aspetta(function () { m2 = misura("parola sbagliata", /era dei/); return m2; }, 5000, 30);
      if (!m2) no("niente «… era dei …» su Paky");
      N.push("a 360x640: " + m1 + " · " + m2);
    } finally { rim(); }
    senzaErrori();
    return N.join(" · ");
  } });

  // ================= o2r5: il capo che scrive l'indizio con la tastiera aperta =================
  // sul telefono la tastiera si prende mezzo schermo (lo schermo del gioco si accorcia: 360x380 su un 360x640): mentre il capo
  // scrive, il tabellone prende il posto della chat e delle faccine e resta leggibile; mandato l'indizio, tutto torna com'era
  COPIONE.aggiungi("o2r5", { nome: "Parola d'ordine (revisione): il capo che scrive l'indizio con la tastiera aperta (360x380) vede il tabellone", fai: async function () {
    var O = await prep(), N = [];
    var X = await O.partita(["Giulia", "Luca", "Sara"], { Luca: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]), C = X.C;
    await O.comincia(X);
    await O.tuttiCalmi(X.nomi, 15000);
    var k = vm(C).turno, capo = X.capi[k], w = W.finestra(capo);
    var inp = await W.aspetta(function () { return w.document.querySelector(".or-sotto .or-input"); }, 5000); if (!inp) no(capo + " non ha il campo dell'indizio");
    var rim = await aMisura(capo, 360, 380);
    try {
      inp.focus(); await W.dorme(700);
      if (!w.document.querySelector(".or-scrive")) no("scrivendo l'indizio lo schermo non lascia il posto al tabellone");
      var cc = O.carte(w), r0 = cc[0].getBoundingClientRect(), ult = cc[cc.length - 1].getBoundingClientRect(), bt = w.document.querySelector(".st-barra").getBoundingClientRect().top;
      if (r0.height < 20) no("con la tastiera aperta (360x380) le caselle sono alte " + Math.round(r0.height) + " px");
      if (ult.bottom > bt + 1) no("con la tastiera aperta l'ultima riga va sotto la barra (" + Math.round(ult.bottom) + " / " + Math.round(bt) + ")");
      var chat = w.document.querySelector(".or-chat"); if (chat && chat.getClientRects().length) no("con la tastiera aperta c'è ancora la chat");
      [].forEach.call(cc, function (b) { var s = b.querySelector(".or-w"), br = b.getBoundingClientRect(), sr = s.getBoundingClientRect(); if (sr.left < br.left - 0.5 || sr.right > br.right + 0.5 || sr.top < br.top - 1 || sr.bottom > br.bottom + 1) no("con la tastiera aperta «" + s.textContent + "» esce dalla casella"); });
      N.push("tastiera aperta a 360x380: caselle " + Math.round(r0.width) + "x" + Math.round(r0.height) + ", scritte da " + w.getComputedStyle(cc[0].querySelector(".or-w")).fontSize);
      // l'indizio scritto nel campo e mandato con «Invia»: lo schermo torna com'era
      var p = ["QUOKKA", "ZEFIRO", "GNOMO", "YETI", "FIORDO"].filter(function (x) { return !w.__ORDINE.erroreIndizio(x, vm(C).tab); })[0];
      inp.value = p; inp.dispatchEvent(new w.Event("input", { bubbles: true }));
      if (!W.clicca(w, /^Invia$/)) no("niente «Invia»");
      if (!await W.aspetta(function () { return vm(C).passo === "indovina" && vm(C).indizio && vm(C).indizio.parola === p; }, 6000)) no("l'indizio " + p + " non arriva");
      if (!await W.aspetta(function () { return !w.document.querySelector(".or-scrive"); }, 3000)) no("mandato l'indizio lo schermo resta «or-scrive»");
      if (!w.document.querySelector(".or-chat").getClientRects().length) no("mandato l'indizio la chat non torna");
      N.push("mandato " + p + " con «Invia»: torna la chat");
    } finally { rim(); }
    senzaErrori();
    return N.join(" · ");
  } });

  // ================= o2r3: nella prova da solo il Bot capo aspetta la fine della presentazione =================
  COPIONE.aggiungi("o2r3", { nome: "Parola d'ordine (revisione): «🧪 Prova da solo» col capo Bot: il primo indizio arriva a presentazione finita", fai: async function () {
    await prep();
    var w = await W.apriTel("Pap", { x: 0, profilo: { nome: "IL PAPPONE", uid: "finto-pap" } });
    var tess = await W.aspetta(function () { return A.tessera(w, "Parola d'ordine"); }, 5000); if (!tess) no("niente tessera");
    tess.click(); await W.dorme(400);
    if (!W.clicca(w, /Prova da solo/)) no("IL PAPPONE non vede «Prova da solo»");
    await W.dorme(400);
    var chipBot = [].filter.call(w.document.querySelectorAll(".modo-chip"), function (c) { return c.textContent.trim() === "Bot"; })[0];
    if (!chipBot) no("nelle regole della prova non trovo «il capo è… Bot»");
    chipBot.click();
    // (tUltimo = l'ultima volta che la presentazione c'era: se l'indizio la tagliasse, sarebbe a un passo dall'indizio)
    var visto = false, tFine = 0, tInd = 0, t0 = Date.now(), tagliata = false, tUltimo = 0;
    var spia = setInterval(function () {
      var ui = w.__ORDINE && w.__ORDINE.ui; if (!ui || !ui.vm || ui.vm.fase !== "gioco") return;
      if (ui.inPres) { visto = true; tUltimo = Date.now() - t0; }
      else if (visto && !tFine) tFine = Date.now() - t0;
      if (!tInd && (ui.vm.log || []).some(function (e) { return e.t === "ind"; })) { tInd = Date.now() - t0; if (ui.inPres || tInd - tUltimo < 300) tagliata = true; }
    }, 20);
    try {
      if (!w.document.querySelector(".or-tab")) { W.clicca(w, /Comincia|Gioca|Via|Avanti/); }
      if (!await W.aspetta(function () { return w.document.querySelector(".or-tab"); }, 6000)) no("la prova non parte");
      if (!await W.aspetta(function () { return tInd; }, 15000, 50)) no("il Bot capo non dà l'indizio");
    } finally { clearInterval(spia); }
    if (!visto) no("nella prova non c'è la presentazione");
    if (tagliata || !tFine || tInd < tFine) no("il Bot capo dà l'indizio durante la presentazione (indizio a " + tInd + " ms, presentazione vista l'ultima volta a " + tUltimo + " ms, finita a " + tFine + " ms)");
    var r = "prova da solo: presentazione finita a " + (tFine / 1000).toFixed(1) + " s, primo indizio del Bot a " + (tInd / 1000).toFixed(1) + " s";
    var f = document.getElementById("tel-Pap"); if (f) f.remove();
    senzaErrori();
    return r;
  } });
})();

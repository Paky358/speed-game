// PROVE DI «SÌ... PERÒ», LA SCHERMATA DEI RUOLI (23 nov 2026, il proprietario: «deve essere molto chiaro… giudice, squadra 1 e
// squadra 2. Ogni turno si ritorna a scegliere i ruoli»). Online a squadre, prima di ogni round: tre colonne, ognuno tocca dove va.
// Si carica dopo migliora2/g3-sipero.js e preferiti/sipero.js (che dà gli aiuti COPIONE.aiuti.sp):
//   prova.js --porta 8997 --carica migliora2/g3-sipero.js,preferiti/sipero.js,preferiti/sipero-ruoli.js --prova spr1,spr2,spr3
// spr1 in 5: dopo «Comincia» la schermata dei ruoli su tutti i telefoni; un giudice solo (il secondo che tocca resta fuori);
//      in una squadra con 2 persone più dell'altra non si entra; niente timer (dopo 4 s si è ancora lì); «Si parte» → i ruoli
//      scelti, «Sei nella Squadra 1» / «⚖️ Sei il giudice»; chi vince prende 1 punto a testa, il giudice 0; dopo il round di
//      nuovo i ruoli con le squadre di prima già segnate e il giudice libero; 3 round e la classifica.
// spr2 in 3: una squadra vuota = «Si parte» spento col perché; nessun giudice = lo sceglie il gioco tra chi l'ha fatto meno;
//      chi non tocca niente va nella squadra più piccola; chi esce libera il posto; l'host sparisce e il vice ha «Si parte».
// spr3 le misure della schermata dei ruoli in 10 a 360x640 e 412x915 (niente scorre, niente esce, tasto intero).
// spl1 sullo stesso telefono a squadre in 5 con 3 round: la schermata dei ruoli di chi ha il telefono (tocca un nome, poi la
//      colonna), un giudice solo, squadra vuota = «Si parte» spento, nessun giudice = lo sceglie il gioco; dopo il round le
//      squadre di prima già segnate e il giudice libero; 3 round e la classifica. spl2 le misure in 8 a 360x640 e 412x915.
//   (spl1-spl2 vogliono anche migliora2/g3-sipero.js caricato: COPIONE.aiuti.spLocale)
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T, S = A.sp;
  if (!S) throw new Error("prima carica preferiti/sipero.js");
  function col(w, r) { return w.document.querySelector(".sp-rc." + (r === "g" ? "cg" : "c" + r)); }
  async function scegli(C, nome, r, attesa) {
    var w = W.finestra(nome), c = await W.aspetta(function () { return col(w, r); }, 5000);
    if (!c) no(nome + " non vede la schermata dei ruoli («" + T(w).slice(0, 140) + "»)");
    c.click();
    var id = S.idDi(C, nome);
    if (attesa !== false && !await W.aspetta(function () { return (vm(C).scelte || {})[id] === r; }, 4000)) no(nome + " tocca " + r + " ma non ci va (" + JSON.stringify(vm(C).scelte) + ")");
  }
  async function avantiTutti(C) {
    var fine = Date.now() + 30000;
    while (vm(C).fase === "esito" && Date.now() < fine) { (vm(C).giocatori || []).forEach(function (g) { var w = W.finestra(g.nome); if (w) W.clicca(w, /Avanti|Classifica/); }); await W.dorme(600); }
  }

  // ===================== spr1 =====================
  COPIONE.aggiungi("spr1", { nome: "Sì… però, i ruoli: un giudice solo, squadre pari, niente timer, «Sei nella Squadra», punti a persona, di nuovo i ruoli", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Sara", "Marco"], note = [];
    var X = await S.stanza(nomi.slice(1), { round: 3 }, { ruoli: true }), C = X.C;
    if (vm(C).fase !== "ruoli") no("dopo «Comincia» non c'è la schermata dei ruoli (" + vm(C).fase + ")");
    for (var i = 0; i < nomi.length; i++) if (!await W.aspetta(function () { return W.finestra(nomi[i]).document.querySelectorAll(".sp-rc").length === 3; }, 5000)) no(nomi[i] + " non vede le tre colonne");
    if (!/Round 1 di 3/.test(T(W.finestra("Giulia")))) no("la schermata non dice «Round 1 di 3»");
    // un giudice solo
    await scegli(C, "Giulia", "g");
    var wl = W.finestra("Luca");
    if (!await W.aspetta(function () { return col(wl, "g").classList.contains("no"); }, 3000)) no("per Luca il giudice non è spento quando c'è già Giulia");
    W.reteDi("Luca").invia({ t: "ruolo", r: "g" }); await W.dorme(700);
    if ((vm(C).scelte || {})[S.idDi(C, "Luca")] === "g") no("Luca diventa giudice anche se c'è già Giulia");
    // squadre: Paky e Sara nella 1; Luca nella 1 no (3 contro 0), nella 2 sì
    await scegli(C, "Paky", 0); await scegli(C, "Sara", 0);
    if (!await W.aspetta(function () { return col(wl, 0).classList.contains("no") && /Troppi/.test(col(wl, 0).textContent); }, 3000)) no("per Luca la Squadra 1 non è spenta («Troppi…»)");
    W.reteDi("Luca").invia({ t: "ruolo", r: 0 }); await W.dorme(700);
    if ((vm(C).scelte || {})[S.idDi(C, "Luca")] === 0) no("Luca entra nella Squadra 1 che ha già 2 persone più dell'altra");
    await scegli(C, "Luca", 1);
    // niente timer
    await W.dorme(4000);
    if (vm(C).fase !== "ruoli" || vm(C).resta) no("la schermata dei ruoli ha un tempo o va avanti da sola (" + vm(C).fase + ", " + vm(C).resta + ")");
    if (!/Devono ancora scegliere: Marco/.test(T(W.finestra("Paky")))) no("non si legge chi deve ancora scegliere (Marco)");
    note.push("un giudice solo, squadre pari, niente timer");
    // si parte: Marco (non ha scelto) va nella squadra più piccola (la 2)
    await S.partiRuoli(C);
    var a = vm(C).assegna, id = function (n) { return S.idDi(C, n); };
    if (a[id("Giulia")] !== "g" || a[id("Paky")] !== 0 || a[id("Sara")] !== 0 || a[id("Luca")] !== 1 || a[id("Marco")] !== 1) no("i ruoli del round non sono quelli scelti (" + JSON.stringify(a) + ")");
    var mio = function (n) { return (W.finestra(n).document.querySelector(".sp-mio") || {}).textContent || ""; };
    if (!await W.aspetta(function () { return /Sei il giudice/.test(mio("Giulia")) && /Squadra 1/.test(mio("Sara")) && /Squadra 2/.test(mio("Marco")); }, 4000)) no("le scritte «Sei…» non tornano (" + [mio("Giulia"), mio("Sara"), mio("Marco")].join(" | ") + ")");
    note.push("Marco nella 2, scritte «Sei nella…» giuste");
    // il round: vince la Squadra 2 → Luca e Marco 1 punto, gli altri 0
    await S.finoGiudizio(C); await S.decidi(C, 1);
    var pt = {}; (vm(C).giocatori || []).forEach(function (g) { pt[g.nome] = g.punti; });
    if (pt.Luca !== 1 || pt.Marco !== 1 || pt.Paky || pt.Sara || pt.Giulia) no("i punti dopo il round non tornano (" + JSON.stringify(pt) + ")");
    note.push("punti a persona " + JSON.stringify(pt));
    await avantiTutti(C);
    if (vm(C).fase !== "ruoli") no("dopo il round non si torna ai ruoli (" + vm(C).fase + ")");
    var sc = vm(C).scelte || {};
    if (sc[id("Giulia")] != null) no("il giudice di prima è ancora segnato");
    if (sc[id("Paky")] !== 0 || sc[id("Luca")] !== 1) no("le squadre di prima non sono già segnate (" + JSON.stringify(sc) + ")");
    if (!/Round 2 di 3/.test(T(W.finestra("Sara")))) no("la seconda schermata non dice «Round 2 di 3»");
    if (!/🏆/.test(T(W.finestra("Sara")))) no("nella schermata dei ruoli non ci sono i punti");
    // round 2: Luca giudice (lascia la 2)
    await scegli(C, "Luca", "g");
    await S.partiRuoli(C);
    if (vm(C).giudiceId !== id("Luca")) no("al round 2 il giudice non è Luca");
    await S.finoAllaFine(C, 300000);
    if (vm(C).round !== 3) no("la partita non dura 3 round (" + vm(C).round + ")");
    note.push("3 round e classifica");
    return note.join(" · ");
  } });

  // ===================== spr2 =====================
  COPIONE.aggiungi("spr2", { nome: "Sì… però, i ruoli: squadra vuota = «Si parte» spento, giudice scelto dal gioco, chi esce libera il posto, il vice ha «Si parte»", fai: async function () {
    var note = [], X = await S.stanza(["Giulia", "Luca"], { round: 3 }, { ruoli: true }), C = X.C, P = W.finestra("Paky");
    // tutti nella Squadra 1 tranne uno giudice: la 2 è vuota
    await scegli(C, "Paky", 0); await scegli(C, "Giulia", "g"); await scegli(C, "Luca", 0);
    var b = await W.aspetta(function () { return S.bottone(P, /Si parte/); }, 3000);
    if (!b || !b.disabled) no("con la Squadra 2 vuota «Si parte» non è spento");
    if (!/Squadra 2 è vuota/.test(T(P))) no("non si legge perché non si parte («" + T(P).slice(-160) + "»)");
    note.push("squadra vuota: tasto spento col perché");
    // Luca torna libero (tocca di nuovo la sua colonna) e Giulia lascia il giudice: nessuno giudice, Luca libero
    await scegli(C, "Luca", 0, false); await W.dorme(500);
    if ((vm(C).scelte || {})[S.idDi(C, "Luca")] != null) no("toccando di nuovo la sua colonna Luca non torna libero");
    await scegli(C, "Giulia", "g", false); await W.dorme(500);
    if (!vm(C).piano || !vm(C).piano.ok) no("senza giudice e con Luca libero non si può partire (" + JSON.stringify(vm(C).piano) + ")");
    if (!vm(C).piano.auto) no("nel piano non c'è il giudice scelto dal gioco");
    var nAuto = S.nomeDi(C, vm(C).piano.auto);
    if (!await W.aspetta(function () { return /Se nessuno lo sceglie, il giudice lo f/.test(T(P)); }, 3000)) no("non si dice chi fa il giudice se nessuno lo sceglie");
    if (!await W.aspetta(function () { return /il giudice lo fai tu/.test(T(W.finestra(nAuto))); }, 3000)) no(nAuto + " non legge «il giudice lo fai tu»");
    await S.partiRuoli(C);
    var a = vm(C).assegna, g = Object.keys(a).filter(function (k) { return a[k] === "g"; });
    if (g.length !== 1 || g[0] === S.idDi(C, "Paky")) no("il giudice scelto dal gioco non è uno libero o senza squadra (" + JSON.stringify(a) + ")");
    note.push("giudice scelto dal gioco: " + S.nomeDi(C, g[0]));
    // fino ai ruoli del round 2
    await S.finoGiudizio(C); await S.decidi(C, 0); await avantiTutti(C);
    if (vm(C).fase !== "ruoli") no("non si torna ai ruoli");
    // Luca sceglie la 2 e poi esce: il suo posto si libera
    await scegli(C, "Luca", 1);
    A.muore("Luca");
    if (!await W.aspetta(function () { return (vm(C).scelte || {})[S.idDi(C, "Luca")] == null; }, 40000)) no("Luca è uscito ma resta nella Squadra 2");
    note.push("chi esce libera il posto");
    // torna Luca; poi l'host sparisce e il vice ha «Si parte»
    if (A.torna) await A.torna("Luca"); else await W.ricarica("Luca");
    await W.dorme(2500);
    A.muore("Paky");
    if (!await W.aspetta(function () { var h = A.chiTiene(C).h; return h && h !== "host"; }, 40000)) no("nessun vice prende la partita nella schermata dei ruoli");
    var vice = S.nomeDi(C, A.chiTiene(C).h), wv = W.finestra(vice);
    if (vm(C).fase !== "ruoli") no("col vice non si è più nella schermata dei ruoli (" + vm(C).fase + ")");
    if (!await W.aspetta(function () { return S.bottone(wv, /Si parte/); }, 6000)) no("il vice " + vice + " non ha «Si parte»");
    note.push("il vice " + vice + " ha «Si parte»");
    return note.join(" · ");
  } });

  // ===================== spr3: le misure =====================
  COPIONE.aggiungi("spr3", { nome: "Sì… però, i ruoli in 10: la schermata a 360x640 e 412x915 senza scorrere né uscire", fai: async function () {
    var amici = ["Giulia", "Luca", "Sara", "Marco", "Bea", "Tom", "Ugo", "Rita", "Nina"];
    var X = await S.stanza(amici, { round: 5 }, { ruoli: true }), C = X.C;
    var tutti = ["Paky"].concat(amici);
    for (var i = 0; i < tutti.length; i++) { await scegli(C, tutti[i], i === 0 ? "g" : i % 2 ? 0 : 1); }
    var note = [];
    for (var j = 0; j < 2; j++) {
      var nome = j ? "Paky" : "Giulia", w = W.finestra(nome), f = document.getElementById("tel-" + nome);
      [[360, 640], [412, 915]].forEach(function () {});
      for (var m = 0; m < 2; m++) {
        var L = m ? 412 : 360, H = m ? 915 : 640;
        f.style.width = L + "px"; f.style.height = H + "px"; void w.document.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
        await W.dorme(450);
        var d = w.document;
        if (d.documentElement.scrollHeight > H + 1) no(nome + " " + L + "x" + H + ": la pagina scorre");
        var p = d.querySelector(".sp-ruoli-sc .sp-piede").getBoundingClientRect();
        if (p.bottom > H + 1) no(nome + " " + L + "x" + H + ": il piede esce");
        [].forEach.call(d.querySelectorAll(".sp-rc"), function (c) {
          var r = c.getBoundingClientRect(); if (r.bottom > H + 1 || r.right > L + 1) no(nome + " " + L + "x" + H + ": una colonna esce");
          [].forEach.call(c.querySelectorAll(".sp-rc-p"), function (x) { var q = x.getBoundingClientRect(); if (q.bottom > r.bottom + 1) no(nome + " " + L + "x" + H + ": un nome esce dalla colonna"); });
        });
        var b = S.bottone(w, /Si parte/); if (b && b.scrollWidth > b.clientWidth + 2) no(nome + ": «Si parte» tagliato");
        note.push(nome + " " + L + "x" + H + " ok");
      }
      f.style.width = "360px"; f.style.height = "740px";
    }
    return note.join(" · ");
  } });
  // ===================== spl1-spl2: sullo stesso telefono (23 nov 2026) =====================
  function chipL(w, nome) { return [].find.call(w.document.querySelectorAll(".sp-ruoli-sc button.sp-rc-p"), function (b) { return (b.lastChild && b.lastChild.textContent.trim()) === nome; }); }
  function doveL(w, nome) {
    var b = chipL(w, nome); if (!b) return "?";
    var c = b.closest(".sp-rc"); if (!c) return "liberi";
    return c.classList.contains("cg") ? "g" : c.classList.contains("c0") ? 0 : 1;
  }
  async function mettiL(w, nome, r) {
    var b = chipL(w, nome); if (!b) no("nella schermata dei ruoli non c'è " + nome);
    b.click(); await W.dorme(60);
    if (!/Ora tocca dove va/.test(T(w))) no("toccato " + nome + " ma la guida non lo dice");
    if (r === "liberi") w.document.querySelector(".sp-rcl-liberi").click(); else col(w, r).click();
    await W.dorme(60);
    if (doveL(w, nome) !== r) no(nome + " doveva andare in " + r + " ed è in " + doveL(w, nome));
  }
  function siParte(w) { return S.bottone(w, /Si parte/); }
  // gioca un round a squadre fino alla schermata dei ruoli dopo (o alla classifica): tocca quello che c'è
  async function roundL(w) {
    var fine = Date.now() + 120000;
    W.clicca(w, /Via ▶/);
    while (Date.now() < fine) {
      await W.dorme(250);
      var d = w.document;
      if (d.querySelector(".sp-ruoli-sc")) return "ruoli";
      if (!d.querySelector(".sp-scena") && /Fine partita/.test(T(w))) return "fine";
      if (W.clicca(w, /^Sono /)) continue;
      var cc = [].slice.call(d.querySelectorAll(".sp-carta[role=button]")), g = S.bottone(w, /^Gioca ▶|^Conferma ▶/);
      if (cc.length && g) {
        for (var i = 0; i < cc.length && g.disabled; i++) if (!cc[i].classList.contains("su")) { cc[i].click(); await W.dorme(40); }
        if (!g.disabled) { g.click(); await W.dorme(1300); continue; }
      }
      var vv = d.querySelector(".sp-vota:not([disabled])"); if (vv) { vv.click(); await W.dorme(150); vv.click(); await W.dorme(4500); continue; }
      var tabs = d.querySelectorAll(".sp-tab button");
      if (tabs.length && S.bottone(w, /Scelgo/)) { tabs[0].click(); await W.dorme(80); W.clicca(w, /Scelgo/); await W.dorme(300); W.clicca(w, /Scelgo|Conferma/); await W.dorme(3800); continue; }
      if (W.clicca(w, /Scopriamo gli scenari|Prossimo scenario|Al verdetto|Tocca alla Squadra|Prossimo round|Classifica finale|Avanti|Via ▶/)) continue;
    }
    no("il round non finisce («" + T(w).slice(0, 140) + "»)");
  }
  COPIONE.aggiungi("spl1", { nome: "Sì… però sullo stesso telefono: i ruoli di chi ha il telefono, un giudice solo, squadra vuota, giudice del gioco, squadre di prima, 3 round", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Sara", "Bea"], note = [];
    var w = await COPIONE.aiuti.spLocale.avvia(nomi, { si: "squadre", round: 3, bianca: 0 });
    if (!await W.aspetta(function () { return w.document.querySelector(".sp-ruoli-sc"); }, 4000)) no("a squadre non parte con la schermata dei ruoli («" + T(w).slice(0, 120) + "»)");
    if (!/Round 1 di 3/.test(T(w))) no("il titolo non dice «Round 1 di 3» («" + T(w).slice(0, 80) + "»)");
    if (!nomi.every(function (n) { return doveL(w, n) === "liberi"; })) no("al primo round non sono tutti da sistemare (" + nomi.map(function (n) { return n + ":" + doveL(w, n); }).join(" ") + ") «" + T(w).slice(0, 300) + "»");
    if (!/il giudice lo fa Paky/.test(T(w))) no("senza giudice non dice chi lo fa («" + T(w).slice(0, 200) + "»)");
    if (siParte(w).disabled) no("«Si parte» spento con tutti da sistemare (il gioco può sistemarli)");
    // un giudice solo: Giulia, poi Luca al suo posto → Giulia torna da sistemare
    await mettiL(w, "Giulia", "g"); await mettiL(w, "Luca", "g");
    if (doveL(w, "Giulia") !== "liberi") no("con due giudici Giulia non è tornata da sistemare");
    note.push("un giudice solo");
    // tutti nella Squadra 1 (tranne il giudice): «Si parte» spento col perché
    var tutti4 = ["Paky", "Giulia", "Sara", "Bea"];
    for (var k = 0; k < tutti4.length; k++) await mettiL(w, tutti4[k], 0);
    if (!siParte(w).disabled || !/vuota/.test(T(w))) no("con la Squadra 2 vuota «Si parte» non è spento col perché");
    await mettiL(w, "Sara", 1); await mettiL(w, "Bea", "liberi");
    if (siParte(w).disabled) no("«Si parte» spento con una squadra per parte");
    if (!/squadra più piccola/.test(T(w))) no("non dice che chi resta va nella squadra più piccola");
    note.push("squadra vuota = spento");
    siParte(w).click();
    if (!await W.aspetta(function () { return S.bottone(w, /Via ▶/); }, 3000)) no("dopo «Si parte» niente presentazione del round");
    if (!/Luca/.test(T(w))) no("nella presentazione non c'è il giudice Luca");
    note.push("si parte");
    var r = await roundL(w);
    if (r !== "ruoli") no("dopo il round 1 niente schermata dei ruoli (" + r + ")");
    if (!/Round 2 di 3/.test(T(w))) no("niente «Round 2 di 3»");
    var gia = { Paky: 0, Giulia: 0, Sara: 1, Bea: 1 };   // (Bea era da sistemare: è andata nella squadra più piccola, la 2)
    Object.keys(gia).forEach(function (n) { if (doveL(w, n) !== gia[n]) no("round 2: " + n + " non è già nella squadra di prima (" + doveL(w, n) + ")"); });
    if (doveL(w, "Luca") !== "liberi") no("round 2: il giudice di prima è ancora giudice");
    if (/il giudice lo fa Luca/.test(T(w))) no("round 2: il gioco rifà giudice Luca");
    note.push("round 2: squadre di prima segnate, giudice libero");
    siParte(w).click();
    if (!await W.aspetta(function () { return S.bottone(w, /Via ▶/); }, 3000)) no("round 2 non parte");
    r = await roundL(w); if (r !== "ruoli") no("dopo il round 2 niente ruoli (" + r + ")");
    siParte(w).click(); await W.aspetta(function () { return S.bottone(w, /Via ▶/); }, 3000);
    r = await roundL(w); if (r !== "fine") no("dopo 3 round non c'è la classifica (" + r + ")");
    note.push("3 round e la classifica");
    return note.join(" · ");
  } });
  COPIONE.aggiungi("spl2", { nome: "Sì… però sullo stesso telefono: la schermata dei ruoli in 8 a 360x640 e 412x915", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Sara", "Marco", "Bea", "Tom", "Ugo"], note = [];
    var w = await COPIONE.aiuti.spLocale.avvia(nomi, { si: "squadre", round: 3 });
    if (!await W.aspetta(function () { return w.document.querySelector(".sp-ruoli-sc"); }, 4000)) no("niente schermata dei ruoli");
    var f = document.getElementById("tel-Paky");
    for (var fase = 0; fase < 2; fase++) {
      if (fase) { await mettiL(w, "Giulia", "g"); for (var i = 2; i < 8; i++) await mettiL(w, nomi[i], i % 2 ? 0 : 1); await mettiL(w, "Paky", 0); }
      for (var m = 0; m < 2; m++) {
        var L = m ? 412 : 360, H = m ? 915 : 640;
        f.style.width = L + "px"; f.style.height = H + "px"; void w.document.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
        await W.dorme(450);
        var d = w.document, q = (fase ? "sistemati " : "tutti liberi ") + L + "x" + H;
        if (d.documentElement.scrollHeight > H + 1) no(q + ": la pagina scorre");
        var p = d.querySelector(".sp-ruoli-sc .sp-piede").getBoundingClientRect(); if (p.bottom > H + 1) no(q + ": il piede esce");
        [].forEach.call(d.querySelectorAll(".sp-ruoli-sc button.sp-rc-p"), function (x) { var b = x.getBoundingClientRect(); if (b.right > L + 1 || b.bottom > H + 1) no(q + ": " + x.textContent + " esce"); });
        [].forEach.call(d.querySelectorAll(".sp-rc"), function (c) { var r = c.getBoundingClientRect(); [].forEach.call(c.querySelectorAll(".sp-rc-p"), function (x) { if (x.getBoundingClientRect().bottom > r.bottom + 1) no(q + ": un nome esce dalla colonna"); }); });
        note.push(q + " ok");
      }
    }
    f.style.width = "360px"; f.style.height = "740px";
    return note.join(" · ");
  } });
})();

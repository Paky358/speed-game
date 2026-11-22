// PROVE «OGNI SCRITTA HA PIÙ DI UN ESITO» NELLA GIORNATA DELLA MINI ASTA (14 nov 2026, il proprietario: «se un'azione con una scritta ha
// come risultato sempre la stessa cosa, vuol dire che è uno spoiler»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta-esiti.js"); await COPIONE.prova("es1")
// Con Edge invisibile: prova.js --porta 8991 --carica preferiti/asta-esiti.js --prova es1,es2,fg1,es3
//
// es1 Senza telefoni, 400 giornate in 4 e 150 in 2 con le 3 giornate: ogni scritta che si vede finisce in almeno due modi, e ognuno almeno
//     1 volta su 5: «📺 IL VAR CONTROLLA…» dopo un gol (annullato / convalidato), «📺 IL VAR RICHIAMA L'ARBITRO…» (rigore / niente rigore),
//     «✋ FALLO TATTICO», «🗣️ PROTESTE», «🤿 SI BUTTA», «😠 NERVI TESI», «🏃 FALLO DA ULTIMO UOMO» (giallo / rosso), «😬 … ERA GIÀ
//     AMMONITO!» (si salva / rosso), «😱 RIBATTUTA!» (gol / parata). I punti non cambiano: le versioni senza cartellino non toccano il voto,
//     il rigore negato non dà niente, la ribattuta parata non ha punti; i falli senza cartellino non si tagliano nelle giornate lunghe.
// es2 Le scene, 200 semi: fallo tattico, proteste, si butta e nervi tesi col cartellino e senza (e col rosso) identici fino al cartellino
//     (giocatori, arbitro, pallone, telecamera, tempo dell'esito); l'ultimo uomo col giallo e col rosso identici; la ribattuta col gol e
//     parata identiche fino al tiro; il rigore parato con la ribattuta che entra e con quella parata IDENTICO dall'inizio alla fine.
// fg1 Senza telefoni (15 nov 2026, il proprietario: «come si fa ad annullare una punizione per fuorigioco?»): su 300 giornate il fuorigioco solo su
//     palla filtrante e lancio in profondità, mai il VAR dopo il gol su punizioni, angoli diretti, ribattute e tiri da centrocampo; la bandierina
//     finisce annullato o convalidato; due guardalinee in ogni scena (fuori dalle linee laterali, uno per metà campo); la bandierina solo dopo il gol
//     e fino al gol il guardalinee uguale col fuorigioco e senza; quando parte il passaggio l'attaccante è in linea col penultimo difendente.
// es3 Online in 2 (Paky tiene la partita, Giulia): nei primi 20 minuti solo i momenti messi apposta (aggancio SG_PROVA_SERIEA): un gol di
//     Paky che passa dal VAR e viene convalidato, un rigore di Giulia che il VAR non dà, un fallo tattico senza cartellino di Paky, un
//     fallo da ultimo uomo di Giulia col giallo, un giallo a Paky e poi «era già ammonito» che si salva, un rigore di Giulia parato con la
//     ribattuta parata. Sullo schermo le scritte giuste in ordine, e i punti del gol arrivano solo dopo «✅ GOL CONVALIDATO!».
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function vm(C) { return W.vmDi(C) || {}; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function manda(nome, m) { if (nome === "Paky") return false; W.reteDi(nome).invia(m); return true; }
  async function telefoni(imp, nomi) {   // (come in asta-gufo.js)
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    for (var i = 1; i < nomi.length; i++) await W.apriTel(nomi[i], { hash: "gioco=astafanta&stanza=" + C, x: 185 * i });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 15000)) no("non sono entrati in " + nomi.length);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    return { P: P, C: C };
  }
  async function astaVeloce(P, C) {   // se nessuno ha offerto lo prende il primo che può, poi passano gli altri (come in asta-gufo.js)
    var fino = Date.now() + 300000, visti = {};
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), a = v.asta;
      if (v.fase !== "asta" || !a || visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId]) { await W.dorme(250); continue; }
      visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1;
      var elegg = v.giocatori.filter(function (g) { return (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
      if (!a.leaderId) { var pr = v.giocatori.filter(function (g) { return elegg.indexOf(g.nome) >= 0 && g.max >= a.offerta; })[0]; if (pr) { if (pr.nome === "Paky") { var bt = bott(P, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } else manda(pr.nome, { t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta, vl: "", tk: 1 }); } }
      else elegg.forEach(function (n) { if (idDi(n) === a.leaderId) return; if (n === "Paky") { var bp = bott(P, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } else manda(n, { t: "passa", n: a.nCarta }); });
      await W.dorme(300);
    }
    if (vm(C).fase !== "fine") no("il fanta online non finisce");
  }
  async function motore(w) {   // il file del gioco con le funzioni di dentro portate fuori (solo per la prova), dentro un telefono
    w = w || await W.apriTel("Paky", { x: 0 });
    w.SGCuore.precarica("astafanta");
    if (!await W.aspetta(function () { return w.SG_FANTA_CALCIATORI && w.SG_FANTA_SQUADRE && w.SG_FANTA_STATISTICHE && w.SG_FANTA_RUOLI; }, 20000)) no("i dati del fanta (con i ruoli) non arrivano");
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {}, ag = "  function costruisciMazzoFanta(n) {";
    if (src.indexOf(ag) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    src = src.replace(ag, "FUORI.cl = classificaFanta; FUORI.lista = listaMomenti; FUORI.taglio = taglioGiornata; FUORI.veloce = sceltaVeloce; FUORI.scena = scena; FUORI.campo = campoAzioni; FUORI.kit = kitDi; FUORI.kitP = kitPortiere; FUORI.latoDifK = latoDifK; FUORI.SC_FASCIA = SC_FASCIA; FUORI.roseSA = roseSerieA;" + ag);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, F);
    F.w = w; return F;
  }
  function rose(w, n) {   // n rose da 5 senza doppioni, un portiere per squadra
    var L = w.SG_FANTA_CALCIATORI, Q = (w.SG_FANTA_QUOTAZIONI || {}).valori || {}, pool = {};
    "PDCA".split("").forEach(function (r) { pool[r] = []; ["A", "B", "C"].forEach(function (t) { (L[r][t] || []).forEach(function (k) { var m = /^(.*) \((.*)\)$/.exec(k); pool[r].push({ nome: m[1], squadra: m[2], ruolo: r, q: Q[k] || 1 }); }); }); });
    var usati = {}, sqP = {}, out = [];
    for (var i = 0; i < n; i++) {
      var kit = [];
      ["P", "D", "C", "C", "A"].forEach(function (r) { var c, g = 0; do { c = pool[r][Math.floor(Math.random() * pool[r].length)]; g++; } while ((usati[c.nome + c.squadra] || (r === "P" && sqP[c.squadra])) && g < 500); usati[c.nome + c.squadra] = 1; if (r === "P") sqP[c.squadra] = 1; kit.push(Object.assign({ prezzo: 1 }, c)); });
      out.push({ id: "g" + i, nome: "G" + i, crediti: 0, kit: kit });
    }
    return out;
  }

  COPIONE.aggiungi("es1", { nome: "Mini Asta, la giornata: ogni scritta finisce in almeno due modi (VAR, rigore dal VAR, falli, ultimo uomo, era già ammonito, ribattuta), senza punti in più", fai: async function () {
    var F = await motore(), w = F.w, tab = {}, ko = [], nvDati = 0, nvVisti = 0;
    function conta(a, es) { var t = tab[a] = tab[a] || {}; t[es] = (t[es] || 0) + 1; }
    [[4, 1, 400], [2, 3, 150]].forEach(function (cfg) {
      for (var i = 0; i < cfg[2]; i++) {
        var g = rose(w, cfg[0]), SA = {}, r = F.cl(g, SA, cfg[1], null), giornate = cfg[1] === 3 ? [SA.prima[0], SA.prima[1], SA] : [SA];
        giornate.forEach(function (Aq, gi) {
          var veloce = cfg[1] === 3 && gi < 2, gioDi = function (x) { return veloce ? x.prima[gi] : x.gio; };
          // i punti: le scene senza cartellino (nv) col voto fermo, il rigore negato senza punti
          r.forEach(function (x) { (gioDi(x).cal || []).forEach(function (c) { (c.ev || []).forEach(function (q) {
            var e = q.e >= 0 && Aq.partite[q.p] ? Aq.partite[q.p].ev[q.e] : null; if (!e) return;
            if (e.t === "rec" && e.nv && q.vo !== 0) ko.push("senza cartellino col voto che cambia (" + e.come + ")");
            if (e.t === "rigN" && (q.d || q.vo)) ko.push("rigore negato con dei punti");
          }); }); });
          var lista = F.lista(Aq, r, gioDi, veloce);
          if (!veloce) Aq.partite.forEach(function (P) { P.ev.forEach(function (e) { if (e.t === "rec" && e.nv && e.m < 75) nvDati++; }); });
          if (veloce) F.veloce(lista); else F.taglio(lista);
          lista.forEach(function (x) {
            if (!x.focus || x.via || x.lampo || !x.e) return;
            var e = x.e, t = e.t;
            if (!veloce && t === "rec" && e.nv && e.m < 75) nvVisti++;
            if (t === "ribP" && x.chi.length) ko.push("la ribattuta parata ha dei punti");
            if (t === "amm" || t === "esp" || t === "rec") conta("fallo: " + (e.dg ? "dg" : e.come || "entrata"), t === "rec" ? (e.nv ? "niente" : "pulita") : t === "esp" ? "rosso" : "giallo");
            if (/^rig[PFN]?$/.test(t) && e.come === "var") conta("VAR richiama per il rigore", t === "rigN" ? "niente rigore" : "rigore");
            if (/^rig[PFN]?$/.test(t) && e.come === "tratt") conta("trattenuta sull'angolo (VAR)", t === "rigN" ? "niente rigore" : "rigore");   // (22 nov 2026, gruppo 3)
            if (/^rig[PFN]?$/.test(t) && e.come === "dato") conta("rigore dato e rivisto al VAR", t === "rigN" ? "tolto" : "confermato");
            if (t === "ann" || (t === "gol" && e.varOk)) conta("VAR dopo il gol", t === "ann" ? "annullato" : "convalidato");
            if (t === "ribP" || (t === "gol" && e.v === "ribattuta")) conta("ribattuta", t === "ribP" ? "parata" : "gol");
          });
        });
      }
    });
    var out = [];
    Object.keys(tab).sort().forEach(function (a) {
      var t = tab[a], tot = 0; Object.keys(t).forEach(function (k) { tot += t[k]; });
      var pc = function (k) { return (t[k] || 0) / tot; }, riga = a + " (" + tot + "): " + Object.keys(t).map(function (k) { return k + " " + Math.round(pc(k) * 100) + "%"; }).join(", ");
      out.push(riga);
      if (tot < 25) return;   // (troppo poche per dirlo)
      if (Object.keys(t).length < 2) { ko.push("«" + a + "» finisce sempre allo stesso modo: " + riga); return; }
      var lim = /entrata|pressing/.test(a) ? 0.15 : 0.2;
      if (a === "fallo: reazione") { if (pc("niente") < lim || pc("niente") > 1 - lim) ko.push("«" + a + "» quasi sempre uguale: " + riga); return; }
      Object.keys(t).forEach(function (k) { if (k !== "rosso" || !/entrata|pressing/.test(a)) if (pc(k) < lim) ko.push("«" + a + "» finisce " + k + " solo il " + Math.round(pc(k) * 100) + "%: " + riga); });
    });
    ["VAR dopo il gol", "VAR richiama per il rigore", "fallo: tattico", "fallo: proteste", "fallo: simula", "fallo: dg", "fallo: ultimo", "ribattuta", "fallo: tempo", "fallo: gomitata", "fallo: manoc", "fallo: spintoni", "fallo: maglia", "trattenuta sull'angolo (VAR)", "rigore dato e rivisto al VAR"].forEach(function (a) { if (!tab[a]) ko.push("«" + a + "» non compare mai"); });
    if (nvVisti < nvDati) ko.push("dei falli senza cartellino sono stati tagliati (" + nvVisti + " su " + nvDati + ")");
    if (ko.length) no(ko.length + " problemi: " + ko.slice(0, 6).join(" · "));
    return out.join(" · ") + " · falli senza cartellino visti tutti (" + nvVisti + ")";
  } });

  function dove(pts, t, n) {   // dove sta a quel momento (fra un punto e l'altro, in linea retta)
    if (!pts.length) return null;
    if (t <= pts[0][0]) return pts[0].slice(1, n);
    for (var i = 1; i < pts.length; i++) if (t <= pts[i][0]) { var a = pts[i - 1], b = pts[i], k = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 1; return a.slice(1, n).map(function (v, j) { return v + (b[j + 1] - v) * k; }); }
    return pts[pts.length - 1].slice(1, n);
  }
  function posa(pose, t) { var q = {}; pose.forEach(function (p) { if (p[0] <= t) q = p[1]; }); return JSON.stringify(q); }
  function diversi(a, b) { if (!a || !b) return a !== b; for (var i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 1e-6) return true; return false; }
  // due scene uguali fino a «fin» (e il pallone fino a quando prende strade diverse, che non deve essere prima di «palla»)
  function confronta(g, s, fin, palla, qui, ko, tutta) {
    var cam = function (z) { return JSON.stringify([z.lento && z.lento[0], z.lento && z.lento[2], z.zoomFine, z.tz, tutta ? z.dunque : 0]); };
    if (cam(s) !== cam(g)) ko.push(qui + ": rallentatore, telecamera o tempo dell'esito diversi " + cam(g) + " / " + cam(s));
    if (s.attori.length !== g.attori.length) { ko.push(qui + ": " + g.attori.length + " in campo contro " + s.attori.length); return 1; }
    var tP = 1;
    for (var t = 0; t <= 1; t += 0.0025) if (diversi(dove(g.palla, t, 4), dove(s.palla, t, 4))) { tP = t; break; }
    if (tP < palla) ko.push(qui + ": il pallone cambia strada già a " + tP.toFixed(3));
    var f = Math.min(fin, tP);
    for (t = 0; t < f - 0.0025; t += 0.0025) {
      for (var k = 0; k < g.attori.length; k++) {
        var a = g.attori[k], b = s.attori[k];
        if (a.sq !== b.sq || a.chi !== b.chi || diversi(dove(a.pts, t, 3), dove(b.pts, t, 3)) || posa(a.pose, t) !== posa(b.pose, t)) { ko.push(qui + ": " + (a.sq === "arb" ? "l'arbitro" : a.sq === "pD" ? "il portiere" : "un giocatore") + " (n° " + k + ") diverso a " + t.toFixed(3)); return tP; }
      }
    }
    return tP;
  }
  COPIONE.aggiungi("es2", { nome: "Mini Asta, le scene: falli col cartellino e senza, ultimo uomo giallo e rosso, ribattuta gol e parata identici fino all'esito", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), F = await motore(w), ko = [], prove = 0;
    var CARTA = { tattico: 0.6, proteste: 0.72, simula: 0.6, reazione: 0.6, ultimo: 0.6, tempo: 0.6, gomitata: 0.86, manoc: 0.6, spintoni: 0.82, maglia: 0.48 };   // (gruppo 3: la mano, gli spintoni, la maglia: lì si decide a 0,5)   // (22 nov 2026: il portiere che perde tempo, la gomitata col VAR)   // (quando l'arbitro tira fuori il cartellino)
    [["tattico", ["amm", "rec"]], ["proteste", ["amm", "rec"]], ["simula", ["amm", "rec"]], ["reazione", ["amm", "rec", "esp"]], ["ultimo", ["amm", "esp"]], ["tempo", ["amm", "rec"]], ["gomitata", ["amm", "rec", "esp"]], ["manoc", ["amm", "rec"]], ["spintoni", ["amm", "rec"]], ["maglia", ["amm", "rec"]]].forEach(function (cp) {
      for (var seme = 1; seme <= 200; seme++) [false, true].forEach(function (difesa) {
        var op = { verso: seme % 3 ? 1 : -1, lato: seme % 2 ? 1 : -1, seme: seme * 7919, come: cp[0], difesa: difesa, lento: false };
        var sc = cp[1].map(function (t) { return F.scena(t, null, null, null, { fallo: "Fallo" }, op); });
        prove++;
        for (var i = 1; i < sc.length; i++) confronta(sc[0], sc[i], CARTA[cp[0]] + 0.02, 0, cp[0] + (difesa ? " in difesa" : "") + " seme " + seme + " " + cp[1][0] + "/" + cp[1][i], ko, true);
        if (cp[1].indexOf("rec") >= 0 && !sc[cp[1].indexOf("rec")].attori.some(function (a) { return a.sq === "arb"; })) ko.push(cp[0] + ": senza cartellino non c'è l'arbitro");
      });
    });
    for (var seme = 1; seme <= 200; seme++) {
      var et = { tira: "Tira", para: "Para" }, op = { verso: seme % 3 ? 1 : -1, lato: seme % 2 ? 1 : -1, seme: seme * 7919, lento: true };
      var g = F.scena("gol", "ribattuta", "gol", null, et, op), p = F.scena("occ", "ribattuta", "parata", null, et, op); prove++;
      var tp = confronta(g, p, 1, 0.3, "ribattuta seme " + seme + " gol/parata", ko, false);
      if (tp > 0.36) ko.push("ribattuta seme " + seme + ": gol e parata uguali fino a " + tp.toFixed(3) + " (la parata non si vede?)");
      if (!p.titOcc || !/RIBATTUTA/.test(p.titOcc)) ko.push("ribattuta parata senza la sua scritta");
      var o1 = Object.assign({ rib: 1 }, op), o2 = Object.assign({ ribGol: 1 }, op), o0 = Object.assign({}, op);
      var r1 = F.scena("rig", null, "parata", null, et, o1), r2 = F.scena("rig", null, "parata", null, et, o2), r0 = F.scena("rig", null, "parata", null, et, o0); prove++;
      confronta(r1, r2, 1, 1, "rigore parato seme " + seme + " ribattuta parata/che entra", ko, true);
      confronta(r0, r1, 0.43, 0.43, "rigore parato seme " + seme + " senza ribattuta/con", ko, false);
    }
    if (ko.length) no(ko.length + " differenze: " + ko.slice(0, 5).join(" · "));
    return prove + " confronti: falli col cartellino e senza identici fino al cartellino, ultimo uomo giallo e rosso uguali, ribattuta gol e parata uguali fino al tiro, rigore con la ribattuta che entra o parata identico";
  } });

  COPIONE.aggiungi("es3", { nome: "Mini Asta online in 2: gol convalidato dal VAR, rigore negato dal VAR, fallo senza cartellino, ultimo uomo col giallo, «era già ammonito» che si salva, ribattuta parata: le scritte giuste in ordine", fai: async function () {
    var NOMI = ["Paky", "Giulia"], messi = [], scritte = [], sbagli = [];
    var o = await telefoni({ formato: "fanta" }, NOMI), P = o.P, C = o.C;
    P.SG_PROVA_SERIEA = function (Aq, h) {
      Aq.partite.forEach(function (Pq) { Pq.ev = Pq.ev.filter(function (e) { return e.m >= 20; }); h.rifai(Pq); });   // (nei primi 20 minuti solo i momenti messi apposta)
      var usati = [];
      function metti(nome, ev, chi) {
        var r = h.righe.filter(function (y) { return y.nome === nome; })[0];
        var c = chi || (r && r.kit.filter(function (y) { return y.ruolo !== "P" && usati.indexOf(h.chiave(y)) < 0; }).sort(function (a, b) { return "ACD".indexOf(a.ruolo) - "ACD".indexOf(b.ruolo); })[0]); if (!c) return null;
        var Pq = Aq.partite.filter(function (y) { return y.c === c.squadra || y.f === c.squadra; })[0]; if (!Pq) return null;
        ev.s = Pq.c === c.squadra ? "c" : "f"; ev.chi = h.chiave(c); if (usati.indexOf(ev.chi) < 0) usati.push(ev.chi);
        Pq.ev.push(ev); Pq.ev.sort(function (a, b) { return a.m - b.m; }); h.rifai(Pq); messi.push(ev.prova + " " + nome + " " + c.nome); return c;
      }
      metti("Paky", { m: 2, t: "gol", ass: null, v: "filtrante", varOk: "fuorigioco", prova: "V1" });
      metti("Giulia", { m: 4, t: "rigN", come: "var", prova: "V2" });
      metti("Paky", { m: 6, t: "rec", come: "tattico", nv: 1, prova: "V3" });
      metti("Giulia", { m: 8, t: "amm", come: "ultimo", prova: "V4" });
      var c5 = metti("Paky", { m: 10, t: "amm", come: "entrata", prova: "V5a" });
      if (c5) metti("Paky", { m: 12, t: "rec", come: "entrata", dg: 1, nv: 1, prova: "V5b" }, c5);
      metti("Giulia", { m: 15, t: "rigP", come: "fallo", rib: 1, ribChi: null, prova: "V6" });
      metti("Paky", { m: 17, t: "ann", ass: null, v: "pallonetto", perche: "fuorigioco", prova: "V7" });   // (🚩 15 nov 2026: il fuorigioco annullato, su un lancio in profondità)
    };
    await astaVeloce(P, C);
    await W.aspetta(function () { return W.clicca(P, /Salta/); }, 30000);   // (le rose: dritti alla giornata; Salta lo tocca chi tiene la partita)
    // le scritte sul campo (e la banda della TV) man mano che arrivano, coi punti dei due quadretti
    function punti() { var o = {}; qa(P, ".st-gio-riga").forEach(function (r) { var n = r.querySelector(".st-gio-nome"), p = r.querySelector(".st-gio-pt"); if (n && p) o[n.textContent.trim()] = parseFloat(p.textContent.replace(",", ".")); }); return o; }
    var ultima = "", fineAt = 0;
    var fino = Date.now() + 150000;
    while (Date.now() < fino) {
      var m = q(P, ".st-msg"), tv = q(P, ".st-tv"), tx = (m && m.classList.contains("on") ? m.textContent : "") + (tv && tv.classList.contains("on") ? " [TV] " + tv.textContent : "");
      if (tx && tx !== ultima) { ultima = tx; scritte.push({ t: tx, p: punti(), ora: Date.now() }); }
      if (!fineAt && /GOL ANNULLATO/.test(tx)) fineAt = Date.now() + 2500;
      if (fineAt && Date.now() > fineAt) break;
      await W.dorme(60);
    }
    function dopo(re, re2, max) {   // la scritta re, e poi (tra le prossime max) re2
      for (var i = 0; i < scritte.length; i++) if (re.test(scritte[i].t)) { for (var j = i + 1; j < Math.min(scritte.length, i + 1 + (max || 3)); j++) if (re2.test(scritte[j].t)) return [i, j]; return [i, -1]; }
      return [-1, -1];
    }
    var x;
    // V1 il gol che passa dal VAR: «ma l'arbitro si tocca l'orecchio», il VAR, «convalidato», poi i punti
    x = dopo(/bandierina/, /IL VAR CONTROLLA/); if (x[1] >= 0 && !/linee del fuorigioco/.test(scritte[x[1]].t)) sbagli.push("V1: il VAR non dice che traccia le linee"); if (x[1] < 0) sbagli.push("V1: dopo il gol niente «📺 IL VAR CONTROLLA»");
    else {
      var y = dopo(/IL VAR CONTROLLA/, /GOL CONVALIDATO/, 2);
      if (y[1] < 0) sbagli.push("V1: dopo il VAR non arriva «✅ GOL CONVALIDATO» (" + (scritte[y[0] + 1] || {}).t + ")");
      else {
        var p0 = scritte[x[0]].p.Paky, p1 = scritte[y[1]].p.Paky, dopoTV = scritte.slice(y[1] + 1).filter(function (s) { return s.ora - scritte[y[1]].ora < 4000; }).map(function (s) { return s.p.Paky; }), pMax = Math.max.apply(null, [p1].concat(dopoTV));
        if (p1 !== p0) sbagli.push("V1: i punti del gol arrivano prima che il VAR decida (" + p0 + " → " + p1 + ")");
        if (!(pMax - p0 >= 2.5)) sbagli.push("V1: dopo «convalidato» i punti del gol non arrivano (" + p0 + " → " + pMax + ")");
      }
    }
    if (scritte.filter(function (s) { return /GOL ANNULLATO/.test(s.t); }).length > 2) sbagli.push("c'è più di un gol annullato");
    // V2 il rigore che il VAR non dà
    x = dopo(/RICHIAMA L'ARBITRO/, /NIENTE RIGORE/, 3); if (x[1] < 0) sbagli.push("V2: dopo «📺 IL VAR RICHIAMA» niente «❌ NIENTE RIGORE» (" + (x[0] >= 0 ? (scritte[x[0] + 1] || {}).t : "il VAR non c'è") + ")");
    else if (JSON.stringify(scritte[x[0]].p) !== JSON.stringify(scritte[x[1]].p)) sbagli.push("V2: col rigore negato i punti cambiano");
    // V3 il fallo tattico senza cartellino
    x = dopo(/FALLO TATTICO/, /SOLO FALLO/, 3); if (x[1] < 0) sbagli.push("V3: dopo «✋ FALLO TATTICO» niente «🤚 SOLO FALLO»");
    else if (/voto ↑|👏/.test(scritte[x[1]].t)) sbagli.push("V3: senza cartellino c'è «voto ↑» o 👏");
    // V4 l'ultimo uomo col giallo
    x = dopo(/ULTIMO UOMO/, /SOLO GIALLO/, 3); if (x[1] < 0) sbagli.push("V4: dopo «🏃 FALLO DA ULTIMO UOMO» niente «🟨 SOLO GIALLO»");
    // V5 il giallo e poi «era già ammonito» che si salva
    x = dopo(/ERA GIÀ AMMONITO/, /SI SALVA/, 3); if (x[1] < 0) sbagli.push("V5: dopo «😬 … ERA GIÀ AMMONITO» niente «😮‍💨 SI SALVA»");
    if (scritte.some(function (s) { return /SECONDO GIALLO/.test(s.t); })) sbagli.push("V5: c'è un secondo giallo");
    // V6 il rigore parato e la ribattuta parata, un momento a sé
    x = dopo(/RIGORE PARATO/, /RIBATTUTA!/, 3); if (x[1] < 0) sbagli.push("V6: dopo «🧤 RIGORE PARATO» non arriva «😱 RIBATTUTA!»");
    else { var z = dopo(/😱 RIBATTUTA!/, /PARA ANCHE LA RIBATTUTA/, 3); if (z[1] < 0) sbagli.push("V6: la ribattuta non finisce con «🧤 PARA ANCHE LA RIBATTUTA»"); }
    if (scritte.some(function (s) { return /PARA IL RIGORE E ANCHE/.test(s.t); })) sbagli.push("V6: c'è ancora la scritta vecchia dentro il rigore");
    // V7 il fuorigioco annullato: bandierina, VAR con le linee, «annullato per fuorigioco», nessun punto
    var i7 = -1; scritte.forEach(function (s, i) { if (/bandierina/.test(s.t)) i7 = i; });
    if (i7 < 0 || i7 === x[0]) sbagli.push("V7: nel gol in fuorigioco non c'è la bandierina");
    else {
      var j7 = -1; for (var k7 = i7 + 1; k7 < Math.min(scritte.length, i7 + 6); k7++) if (/GOL ANNULLATO/.test(scritte[k7].t)) { j7 = k7; break; }
      if (j7 < 0) sbagli.push("V7: dopo la bandierina non arriva «❌ GOL ANNULLATO»");
      else {
        if (!/per fuorigioco/.test(scritte[j7].t)) sbagli.push("V7: annullato ma non «per fuorigioco»");
        var dopo7 = scritte.slice(j7).filter(function (s) { return s.ora - scritte[j7].ora < 2000; }).map(function (s) { return s.p.Paky; });
        if (dopo7.some(function (v) { return v !== scritte[i7].p.Paky; })) sbagli.push("V7: col gol annullato i punti di Paky cambiano");
      }
    }
    var err = W.erroriTel(); if (err.length) sbagli.push("errori: " + err.slice(0, 3).join(" | "));
    var riass = scritte.map(function (s) { return s.t.replace(/\s+/g, " ").slice(0, 60); }).join(" ⟶ ");
    if (sbagli.length) no(sbagli.join(" / ") + " — messi: " + messi.join(", ") + " — visti: " + riass);
    return "messi: " + messi.join(", ") + " — visti: " + riass;
  } });

  COPIONE.aggiungi("fg1", { nome: "Mini Asta, il fuorigioco: solo su palla filtrante e lancio in profondità, mai su punizioni, angoli diretti, ribattute; i guardalinee in ogni scena e la bandierina solo dopo il gol", fai: async function () {
    var F = await motore(), w = F.w, ko = [], fg = { ann: 0, ok: 0 }, doveFg = {}, n = 0;
    for (var i = 0; i < 300; i++) {
      var g = rose(w, 4), SA = {}; F.cl(g, SA, 1, null);
      SA.partite.forEach(function (P) { P.ev.forEach(function (e) {
        var fgE = (e.t === "ann" && e.perche === "fuorigioco") || (e.t === "gol" && e.varOk === "fuorigioco"), vE = e.t === "ann" || (e.t === "gol" && e.varOk);
        if (fgE) { n++; fg[e.t === "ann" ? "ann" : "ok"]++; doveFg[e.v] = (doveFg[e.v] || 0) + 1; if (e.v !== "filtrante" && e.v !== "pallonetto" && e.v !== "fuga") ko.push("fuorigioco su «" + e.v + "»"); }
        if (vE && /^(punizione|olimpico|portiere|ribattuta|centrocampo)$/.test(e.v || "")) ko.push("VAR dopo il gol su «" + e.v + "»");
      }); });
    }
    if (!n) ko.push("il fuorigioco non c'è mai");
    else if (fg.ann / n < 0.2 || fg.ok / n < 0.2) ko.push("la bandierina finisce quasi sempre allo stesso modo: " + JSON.stringify(fg));
    // le scene: due guardalinee sempre, sulle linee laterali (uno per metà campo)
    var et = { tira: "Tira", passa: "Passa", para: "Para", fallo: "Fallo" }, prove = [["gol", "cross", "gol"], ["occ", "filtrante", "parata"], ["ann", "pallonetto", "gol"], ["rig", null, "gol"], ["aut", "cross", "gol"], ["amm", null, null], ["rec", null, null], ["esp", null, null]];
    prove.forEach(function (pv) { for (var seme = 1; seme <= 40; seme++) {
      var sc = F.scena(pv[0], pv[1], pv[2], null, et, { verso: 1, lato: seme % 2 ? 1 : -1, seme: seme * 7919, come: "entrata" }), gl = sc.attori.filter(function (a) { return a.sq === "gl"; });
      if (gl.length !== 2) { ko.push(pv[0] + ": " + gl.length + " guardalinee"); return; }
      var x0 = gl[0].pts[0][1], y0 = gl[1].pts[0][2];
      if (Math.abs(x0 - 0.5) < 0.5 || Math.abs(gl[1].pts[0][1] - 0.5) < 0.5) ko.push(pv[0] + ": un guardalinee dentro il campo");
      if (y0 >= 0) ko.push(pv[0] + ": il secondo guardalinee non è nell'altra metà campo");
      if (gl.some(function (a) { return a.pose.some(function (q) { return q[1].bandiera; }); })) ko.push(pv[0] + ": la bandierina senza fuorigioco");
    } });
    // la bandierina: solo dopo il gol, e fino al gol il guardalinee fa le stesse cose col fuorigioco e senza
    // 📏 (15 nov 2026, il proprietario: «sono tutti compresi nel fuorigioco, non solo chi marca») quando parte il passaggio TUTTI i difensori (anche quelli
    // di contorno, disegnati dal campo) sono sulla linea o più avanti; l'attaccante è nella metà campo avversaria e davanti al pallone (mai un passaggio all'indietro)
    var box = w.document.createElement("div"); box.style.cssText = "position:fixed;left:0;top:0;width:360px;height:520px;"; w.document.body.appendChild(box);
    var Ac = null; try { Ac = F.campo(w.SGCuore.el, box); if (Ac.misura) Ac.misura(); } catch (e) { ko.push("il campo per la prova non parte: " + e.message); }
    var contorno = 0;
    for (var s3 = 1; s3 <= 60; s3++) ["filtrante", "pallonetto", "fuga"].forEach(function (v) {
      ["gol", "parata", "fuori"].forEach(function (es) {
        var sc = F.scena(es === "gol" ? "gol" : "occ", v, es, null, et, { verso: s3 % 2 ? 1 : -1, lato: s3 % 3 ? 1 : -1, seme: s3 * 7919, lento: true }), tv = sc.varT, lin = sc.lineaFG;
        if (tv == null || lin == null) { ko.push(v + ": manca la linea"); return; }
        var at = sc.attori.filter(function (q) { return q.chi === "Tira"; })[0], ya = at ? dove(at.pts, tv, 3)[1] : null, yb = dove(sc.palla, tv, 4)[1];
        if (!(lin > 0)) ko.push(v + ": la linea nella propria metà campo");
        if (ya == null || Math.abs(ya - lin) > 0.002) ko.push(v + ": l'attaccante non è in linea quando parte il passaggio");
        if (!(yb < ya)) ko.push(v + ": il passaggio non va in avanti (il pallone è più avanti dell'attaccante)");
        sc.attori.forEach(function (q) { if (q.sq === "D") { var y = dove(q.pts, tv, 3)[1]; if (y > lin + 0.002) ko.push(v + " seme " + s3 + ": un difensore dietro la linea (" + y.toFixed(3) + " > " + lin + ")"); } });
        if (!at || !at.pts.some(function (q) { return Math.abs(q[0] - tv) < 1e-9; })) ko.push(v + ": l'attaccante non ha un punto proprio quando parte il passaggio (sulla curva può finire dietro la linea)");
        sc.attori.forEach(function (q) { if (q.sq === "D" && !q.pts.some(function (z) { return Math.abs(z[0] - tv) < 1e-9; })) ko.push(v + ": un difensore senza un punto proprio quando parte il passaggio"); });
        if (Ac && Ac.fermo) {
          sc.kA = F.kit("Inter", false); sc.kD = F.kit("Milan", false); sc.pA = F.kitP(sc.kA, sc.kD); sc.pD = F.kitP(sc.kA, sc.kD, sc.pA.a);
          Ac.fermo(sc); var fX = 0.5 + yb * 0.496;
          (sc.folla || []).forEach(function (o) { if (o.sq !== "D") return; contorno++; var y = (o.x + (fX - o.x) * (sc.segui || 0.14) - 0.5) / 0.496; if (y > lin + 0.002) ko.push(v + " seme " + s3 + ": un difensore di contorno dietro la linea (" + y.toFixed(3) + " > " + lin + ")"); });
        }
      });
    });
    if (box.parentNode) box.parentNode.removeChild(box);
    if (Ac && !contorno) ko.push("i difensori di contorno non si vedono");
    for (var s2 = 1; s2 <= 100; s2++) ["filtrante", "pallonetto", "fuga"].forEach(function (v) {
      var op = { verso: 1, lato: s2 % 2 ? 1 : -1, seme: s2 * 7919, lento: true }, a = F.scena("gol", v, "gol", null, et, op), b = F.scena("ann", v, "gol", null, et, Object.assign({ bandiera: true, fgOltre: true }, op));
      var ga = a.attori.filter(function (q) { return q.sq === "gl"; })[0], gb = b.attori.filter(function (q) { return q.sq === "gl"; })[0];
      var tb = gb.pose.filter(function (q) { return q[1].bandiera; })[0];
      if (!tb) { ko.push(v + ": nel fuorigioco niente bandierina"); return; }
      if (tb[0] < b.rete) ko.push(v + ": la bandierina prima del gol");
      for (var t = 0; t <= b.rete; t += 0.01) { var pa = dove(ga.pts, t, 3), pb = dove(gb.pts, t, 3); if (diversi(pa, pb)) { ko.push(v + " seme " + s2 + ": il guardalinee si muove diverso già a " + t.toFixed(2)); break; } }
      if (b.varT == null) ko.push(v + ": manca l'istante del passaggio per il VAR");
      else { var at = b.attori.filter(function (q) { return q.chi === "Tira"; })[0], yA = at ? dove(at.pts, b.varT, 3)[1] : null, yD = null;
        b.attori.forEach(function (q) { if (q.sq !== "D") return; var y = dove(q.pts, b.varT, 3)[1]; if (y <= 0.88 && (yD == null || y > yD)) yD = y; });
        if (yA == null || Math.abs(yA - yD) > 0.002) ko.push(v + ": quando parte il passaggio l'attaccante non è in linea (" + yA + " / " + yD + ")"); }
    });
    if (ko.length) no(ko.length + " problemi: " + ko.slice(0, 6).join(" · "));
    return n + " fuorigioco in 300 giornate, tutti su " + JSON.stringify(doveFg) + " (annullati " + fg.ann + ", convalidati " + fg.ok + "); guardalinee in ogni scena; bandierina solo dopo il gol; quando parte il passaggio tutta la difesa (" + contorno + " difensori di contorno controllati) in linea o più avanti";
  } });
  // td1 🏃 LE AZIONI DALLA FASCIA LE FANNO I TERZINI (19 nov 2026, il proprietario: «quella è più una cosa da terzini»): i ruoli Mantra dei
  //     difensori (Dd;Dc terzino destro, B;Ds;E sinistro, Dd;Ds tutte e due, solo Dc o B centrale, senza ruolo centrale) e, su 300 giornate,
  //     tra i difensori chi passa dalla fascia (cross, sovrapposizioni, uno-due, palla dal fondo, rimessa) è SEMPRE un terzino; i centrali
  //     fanno assist (e passaggi) solo in modi da centrale, e ne fanno
  COPIONE.aggiungi("td1", { nome: "Mini Asta: le azioni dalla fascia le fanno i terzini, i centrali passano solo da centrali", fai: async function () {
    var F = await motore(), w = F.w, ko = [], R0 = w.SG_FANTA_RUOLI, k;
    var prova = { "T1 (X)": "Dd;Dc", "T2 (X)": "B;Ds;E", "T3 (X)": "Dc", "T4 (X)": "B;Dc", "T5 (X)": "Dd;Ds", "T6 (X)": "CD" };
    var atteso = { "T1 (X)": "d", "T2 (X)": "s", "T3 (X)": null, "T4 (X)": null, "T5 (X)": "e", "T6 (X)": "d", "T7 (X)": null };
    for (k in prova) R0[k] = prova[k];
    for (k in atteso) if (F.latoDifK(k) !== atteso[k]) ko.push(k + " «" + (prova[k] || "senza ruolo") + "»: " + F.latoDifK(k) + " invece di " + atteso[k]);
    for (k in prova) delete R0[k];
    var ruolo = {}, rs = F.roseSA(); Object.keys(rs).forEach(function (sq) { rs[sq].forEach(function (c) { ruolo[c.k] = c.ruolo; }); });
    var fasciaTerz = 0, centrali = 0, n = 0, scCentrali = {};
    for (var i = 0; i < 300; i++) {
      var g = rose(w, 4), SA = {}; F.cl(g, SA, 1, null);
      SA.partite.forEach(function (P) { P.ev.forEach(function (e) {
        if (!e.ass || !/^(gol|occ|ann)$/.test(e.t) || ruolo[e.ass] !== "D") return; n++;
        var ld = F.latoDifK(e.ass);
        if (!ld) { centrali++; scCentrali[e.v] = (scCentrali[e.v] || 0) + 1; if (F.SC_FASCIA[e.v] && ko.length < 8) ko.push("il centrale " + e.ass + " («" + (R0[e.ass] || "senza ruolo") + "») passa su «" + e.v + "»"); }
        else if (F.SC_FASCIA[e.v]) fasciaTerz++;
      }); });
    }
    if (!fasciaTerz) ko.push("i terzini non passano mai dalla fascia");
    if (!centrali) ko.push("i centrali non passano mai");
    if (ko.length) no(ko.slice(0, 6).join(" · "));
    return "ruoli dei difensori giusti (Dd;Dc destro, B;Ds;E sinistro, Dc e B centrali, senza ruolo centrale) · in 300 giornate " + n + " passaggi di difensori: " + fasciaTerz + " dalla fascia, tutti di terzini; " + centrali + " di centrali, mai dalla fascia (" + Object.keys(scCentrali).map(function (x) { return x + " " + scCentrali[x]; }).join(", ") + ")";
  } });
})();

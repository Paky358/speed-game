// TRIS GIGANTE (8 nov 2026): prove tg1-tg6. Si carica dopo il copione:
//   await COPIONE.carica("passo2/trisgigante.js"); await COPIONE.prova("tg1")
// tg1 stesso telefono Classica (spiegazione, prima mossa libera, la casella manda nel campo, campo chiuso = dove vuoi,
//     vittoria col tris di campi, vittoria e pareggio ai campi: partite d'esempio trovate col motore e rigiocate a tocchi)
// tg2 stesso telefono Campo a caso (la luce, tocchi spenti mentre gira, il campo scelto è sempre aperto)
// tg3 contro il Bot ai 3 livelli, partite intere (t.risultato col Bot)
// tg4 online in 2 + Luca che entra (guarda) + Bea col link guarda=1; Giulia ricarica e si spegne; l'host ricarica (riprende); fine e rivincita
// tg5 online Campo a caso: la luce su tutti i telefoni si ferma sullo stesso campo
// tg6 torneo a eliminazione in 3 dalla Sala col Bot: partita vera, partita col Bot trasmessa, fino al campione
(function () {
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T, vm = A.vm;
  // partite d'esempio (le caselle in ordine, comincia la X), trovate col motore del gioco
  var SEQ = {"chiuso":[27,0,3,33,54,6,55,9,8,76,43,67,36,4,40,42,56,19,11,24],"pari":[34,67,36,4,41,49,40,44,79,70,64,11,20,22,37,15,61,66,28,14,51,55,16,65,25,63,0,7,68,48,32,53,78,56,24,58,39,33,59,47,23,52,71,76,50,45,2,21,29,26,80,13,27,1,54,62,60,57,69,19,18],"conti":[70,65,19,16,64,13,39,29,18,0,6,56,21,33,60,58,37,15,54,7,71,80,78,61,63,5,45,4,41,51,62,79,66,34,67,36,8,74,23,48,35,73,11,22,38,25,26,76,43,57,30,31,40,12,55,10,20,53,2,52,3,59,1],"linea":[14,46,13,42,59,48,29,26,77,53,75,27,8,79,70,66,31,41,47,23,51,60,54,2,22,38,21,35,78,61,69,58,40,39,32,50,49,44,73,11,24,56,18,1,10,15,4,80,76]};
  function celle(w) { return w.document.querySelectorAll(".tg-c"); }
  function accese(w) { return [].filter.call(celle(w), function (c) { return !c.disabled; }).length; }
  function stato(w) { var s = w.document.querySelector(".tg-stato"); return s ? s.textContent : ""; }
  function campiCls(w, cls) { return [].map.call(w.document.querySelectorAll(".tg-campo"), function (c, b) { return c.classList.contains(cls) ? b : -1; }).filter(function (b) { return b >= 0; }); }
  function chiudiSpiega(w) { var s = w.document.querySelector(".tg-sp"); if (s) s.click(); }
  function legale(v, i) { var b = (i / 9) | 0; return v.c.charAt(i) === "." && v.v.charAt(b) === "." && (v.campo < 0 || v.campo === b); }
  function primaLegale(v) { for (var i = 0; i < 81; i++) if (legale(v, i)) return i; return -1; }
  function aCasoLegale(v) { var l = []; for (var i = 0; i < 81; i++) if (legale(v, i)) l.push(i); return l[Math.floor(Math.random() * l.length)]; }
  // dalla home al tavolo sullo stesso telefono: "Contro il Bot" o "Su questo telefono", con le scelte (testi dei tasti delle regole)
  async function apriLocale(P, modo, scelte) {
    var tess = await W.aspetta(function () { return A.tessera(P, "Tris Gigante"); }, 6000); if (!tess) no("niente tessera «Tris Gigante» in home");
    tess.click();
    var bm = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".modo-grande"), function (b) { return b.textContent.indexOf(modo) >= 0; }); }, 4000);
    if (!bm) no("in «Come giocate?» non c'è «" + modo + "»"); bm.click();
    if (await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 1500)) {
      while (P.document.querySelectorAll(".sala-riga input").length < 2) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
      [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = ["Paky", "Giulia"][k] || "Amico"; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    }
    for (var k = 0; k < 8 && !P.document.querySelector(".tg-tab"); k++) {
      await W.dorme(300);
      (scelte || []).forEach(function (s) { var c = [].find.call(P.document.querySelectorAll(".modo-chip"), function (x) { return x.textContent.indexOf(s) >= 0; }); if (c && !c.classList.contains("attiva")) c.click(); });
      var b = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Avanti|Comincia|Gioca|Inizia|Via|▶/.test(x.textContent) && !x.disabled; });
      if (b) b.click();
    }
    if (!await W.aspetta(function () { return P.document.querySelector(".tg-tab"); }, 3000)) no("il Tris Gigante non parte («" + T(P).slice(0, 80) + "»)");
  }
  // rigioca a tocchi una partita d'esempio (sullo stesso telefono)
  async function rigioca(P, seq) {
    for (var j = 0; j < seq.length; j++) {
      var c = celle(P)[seq[j]];
      if (!c || c.disabled) no("mossa " + (j + 1) + ": la casella " + seq[j] + " non si tocca («" + stato(P) + "», accese " + accese(P) + ")");
      c.click(); await W.dorme(15);
    }
  }
  async function nuovaLocale(P) {
    if (!await W.aspetta(function () { return W.clicca(P, /Rivincita/); }, 3000)) no("niente «Rivincita»");
    if (!await W.aspetta(function () { return [].filter.call(celle(P), function (c) { return c.querySelector("svg"); }).length === 0; }, 3000)) no("la rivincita non svuota il tabellone");
  }

  COPIONE.aggiungi("tg1", { nome: "Tris Gigante sullo stesso telefono, Classica: spiegazione, regola del campo, campo chiuso, vittorie e pareggio ai campi", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), note = [];
    P.localStorage.removeItem("sg-trisg-visto");
    await apriLocale(P, "Su questo telefono", ["Classica", "A turno"]);
    var sp = await W.aspetta(function () { return P.document.querySelector(".tg-sp"); }, 2000);
    if (!sp || !/manda l'altro/.test(sp.textContent) || !sp.querySelector(".tg-spm")) no("al primo avvio non c'è la spiegazione con l'esempio («" + (sp ? sp.textContent.slice(0, 80) : "-") + "»)");
    sp.click();
    if (!await W.aspetta(function () { return !P.document.querySelector(".tg-sp"); }, 1500)) no("la spiegazione non si chiude col tocco");
    if (!/classica/.test(P.localStorage.getItem("sg-trisg-visto") || "")) no("la spiegazione vista non si ricorda");
    note.push("spiegazione col tocco");
    if (accese(P) !== 81) no("alla prima mossa non sono accese tutte le 81 caselle (" + accese(P) + ")");
    if (!/dove vuoi|dove vuole/.test(stato(P))) no("alla prima mossa la scritta non dice «dove vuoi» («" + stato(P) + "»)");
    // X nella casella in alto a destra del campo in alto a sinistra (casella 2): l'altro gioca nel campo in alto a destra (2)
    celle(P)[2].click(); await W.dorme(60);
    var gi = campiCls(P, "gioca");
    if (gi.join() !== "2") no("dopo la casella 2 il campo acceso è " + JSON.stringify(gi));
    if (accese(P) !== 9 || [].some.call(celle(P), function (c, i) { return !c.disabled && ((i / 9) | 0) !== 2; })) no("dopo la casella 2 si può toccare fuori dal campo 2 (" + accese(P) + " accese)");
    if (campiCls(P, "spento").length !== 8) no("gli altri campi non sono spenti");
    if (!P.document.querySelector(".tg-fr.on path.punta")) no("non c'è la freccia dall'ultima mossa al campo");
    if (!P.document.querySelectorAll(".tg-c")[2].classList.contains("ultima")) no("l'ultima mossa non si vede");
    celle(P)[0].click(); await W.dorme(40);   // (un tocco fuori dal campo non fa niente)
    if (celle(P)[0].querySelector("svg")) no("un tocco fuori dal campo ha messo il segno");
    note.push("casella 2 → campo 2 acceso, freccia, fuori campo spento");
    await W.ricarica("Paky"); P = W.finestra("Paky");
    // il campo chiuso manda l'altro dove vuole
    await apriLocale(P, "Su questo telefono", ["Classica"]);
    if (P.document.querySelector(".tg-sp")) no("la spiegazione torna anche se già vista");
    await rigioca(P, SEQ.chiuso);
    var chiusi = campiCls(P, "chiuso"), libere = 0;
    [].forEach.call(celle(P), function (c, i) { if (!c.querySelector("svg") && chiusi.indexOf((i / 9) | 0) < 0) libere++; });
    if (!chiusi.length) no("nessun campo chiuso dopo la partita d'esempio");
    if (accese(P) !== libere) no("mandato in un campo chiuso: accese " + accese(P) + " caselle, libere nei campi aperti " + libere);
    if (!/campo chiuso: dove vuo/.test(stato(P))) no("la scritta non dice «campo chiuso: dove vuoi» («" + stato(P) + "»)");
    if (!P.document.querySelector(".tg-vinto.on svg")) no("il campo vinto non ha la X o la O grande");
    note.push("campo chiuso: " + accese(P) + " caselle libere tutte accese");
    // vittoria col tris di campi
    await W.ricarica("Paky"); P = W.finestra("Paky");
    await apriLocale(P, "Su questo telefono", ["Classica"]);
    await rigioca(P, SEQ.linea);
    if (!await W.aspetta(function () { return /Vince/.test(stato(P)); }, 2000)) no("dopo il tris di campi non vince nessuno («" + stato(P) + "»)");
    if (!P.document.querySelector(".tg-linea.on")) no("non c'è la linea sul tris di campi");
    if (/campi a/.test(stato(P))) no("col tris di campi la scritta parla dei campi contati");
    note.push("tris di campi: «" + stato(P) + "»");
    // vittoria ai campi (nessun tris di campi) e pareggio ai campi: X e O si danno il turno, la seconda partita comincia la O
    await W.ricarica("Paky"); P = W.finestra("Paky");
    await apriLocale(P, "Su questo telefono", ["Classica"]);
    await rigioca(P, SEQ.conti);
    if (!await W.aspetta(function () { return /Vince .*5 campi a 3/.test(stato(P)); }, 2000)) no("vinta ai campi: la scritta è «" + stato(P) + "»");
    if (campiCls(P, "suo").length !== 5) no("i 5 campi di chi vince non sono illuminati (" + campiCls(P, "suo").length + ")");
    note.push("ai campi: «" + stato(P) + "»");
    await W.ricarica("Paky"); P = W.finestra("Paky");
    await apriLocale(P, "Su questo telefono", ["Classica"]);
    await rigioca(P, SEQ.pari);
    if (!await W.aspetta(function () { return /Pareggio.*3 campi a 3/.test(stato(P)); }, 2000)) no("pari ai campi: la scritta è «" + stato(P) + "»");
    var pu = P.document.querySelector(".tg-punti").textContent;
    if (!/1 pari/.test(pu)) no("il conto non segna il pareggio («" + pu + "»)");
    note.push("pari: «" + stato(P) + "»");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return note.join(" · ");
  } });

  COPIONE.aggiungi("tg2", { nome: "Tris Gigante sullo stesso telefono, Campo a caso: la luce, tocchi spenti mentre gira, campo sempre aperto", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    P.localStorage.setItem("sg-trisg-visto", JSON.stringify({ classica: 1 }));
    await apriLocale(P, "Su questo telefono", ["Campo a caso"]);
    var sp = await W.aspetta(function () { return P.document.querySelector(".tg-sp"); }, 2000);
    if (!sp || !/sceglie a caso/.test(sp.textContent)) no("la spiegazione del Campo a caso non c'è («" + (sp ? sp.textContent.slice(0, 80) : "-") + "»)");
    sp.click(); await W.dorme(300);
    var giri = 0, durate = [];
    for (var j = 0; j < 14; j++) {
      var tav = P.__tav, libere = [].map.call(celle(P), function (c, i) { return c.disabled ? -1 : i; }).filter(function (i) { return i >= 0; });
      if (!libere.length) break;
      celle(P)[libere[Math.floor(Math.random() * libere.length)]].click();
      await W.dorme(30);
      if (/Vince|Pareggio/.test(stato(P))) break;
      if (!P.document.querySelector(".tg-luce.on")) no("mossa " + (j + 1) + ": la luce non gira");
      if (accese(P) !== 0) no("mossa " + (j + 1) + ": mentre la luce gira si può toccare (" + accese(P) + ")");
      if (!/sceglie il campo/.test(stato(P))) no("mentre la luce gira la scritta è «" + stato(P) + "»");
      var t0 = Date.now();
      if (!await W.aspetta(function () { return accese(P) > 0; }, 3000, 20)) no("dopo la luce non si può toccare");
      durate.push(Date.now() - t0);
      var gi = campiCls(P, "gioca"), chiusi = campiCls(P, "chiuso");
      if (gi.length !== 1 || chiusi.indexOf(gi[0]) >= 0) no("dopo la luce i campi accesi sono " + JSON.stringify(gi) + " (chiusi " + JSON.stringify(chiusi) + ")");
      if ([].some.call(celle(P), function (c, i) { return !c.disabled && ((i / 9) | 0) !== gi[0]; })) no("si può toccare fuori dal campo scelto");
      giri++;
    }
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    var med = durate.reduce(function (a, b) { return a + b; }, 0) / Math.max(1, durate.length);
    return giri + " mosse col campo a caso: la luce gira (in media " + Math.round(med) + " ms prima di poter toccare), un campo solo acceso e sempre aperto";
  } });

  COPIONE.aggiungi("tg3", { nome: "Tris Gigante contro il Bot ai 3 livelli: partite intere, risultato al core", fai: async function () {
    A.spiaTavolo();
    var esiti = [];
    var liv = ["Facile", "Medio", "Difficile"];
    for (var l = 0; l < liv.length; l++) {
      var P = l === 0 ? await W.apriTel("Paky", { x: 0, spiaTav: ["trisgigante"] }) : await W.ricarica("Paky");
      P.localStorage.setItem("sg-trisg-visto", JSON.stringify({ classica: 1, caso: 1 }));
      await apriLocale(P, "Contro il Bot", [liv[l], "Classica"]);
      var ris = [], tav = await W.aspetta(function () { return P.__tav; }, 3000);
      if (!tav) no("niente tavolo");
      var r0 = tav.risultato; tav.risultato = function (c) { ris.push(c); return r0 && r0.apply(this, arguments); };
      var attese = [], fino = Date.now() + 120000;
      while (Date.now() < fino && !/Hai vinto|Vince|Pareggio/.test(stato(P))) {
        var lib = [].map.call(celle(P), function (c, i) { return c.disabled ? -1 : i; }).filter(function (i) { return i >= 0; });
        if (lib.length && /Tocca a te/.test(stato(P))) {
          var n0 = P.document.querySelectorAll(".tg-c svg").length;
          celle(P)[lib[Math.floor(Math.random() * lib.length)]].click();
          var t0 = Date.now();
          var ok = await W.aspetta(function () { return P.document.querySelectorAll(".tg-c svg").length >= n0 + 2 || /Hai vinto|Vince|Pareggio/.test(stato(P)); }, 6000, 20);
          if (!ok) no(liv[l] + ": il Bot non risponde («" + stato(P) + "»)");
          if (!/Hai vinto|Vince|Pareggio/.test(stato(P))) attese.push(Date.now() - t0);
        } else await W.dorme(60);
      }
      if (!/Hai vinto|Vince|Pareggio/.test(stato(P))) no(liv[l] + ": la partita non finisce");
      if (ris.length !== 1 || !ris[0].some(function (x) { return x.bot; })) no(liv[l] + ": il risultato al core è " + JSON.stringify(ris));
      var max = Math.max.apply(null, attese), med = attese.reduce(function (a, b) { return a + b; }, 0) / attese.length;
      esiti.push(liv[l] + ": «" + stato(P) + "», il Bot risponde in " + Math.round(med) + " ms (al massimo " + max + ")");
    }
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return esiti.join(" · ");
  } });

  // ---- online: la casella da toccare (la prima giusta) per chi è di turno ----
  async function toccaOnline(C, nomi) {
    var v = vm(C), chi = v.turno === "X" ? nomi.X : nomi.O, i = primaLegale(v), k0 = v.k;
    if (i < 0) no("nessuna casella giusta (" + JSON.stringify(v).slice(0, 120) + ")");
    var ok = await W.aspetta(function () { var w = W.finestra(chi), c = w && celle(w)[i]; if (c && !c.disabled) { c.click(); return true; } return false; }, 6000, 40);
    if (!ok) no("la casella " + i + " non si tocca per " + chi + " («" + stato(W.finestra(chi)) + "»)");
    if (!await W.aspetta(function () { return vm(C).k === k0 + 1 || vm(C).fase === "fine"; }, 5000)) no("la mossa di " + chi + " non arriva all'host");
    return chi;
  }
  async function finoAllaFine(C, nomi, fino) {
    var lim = Date.now() + (fino || 60000);
    while (Date.now() < lim && vm(C).fase === "gioco") await toccaOnline(C, nomi);
    return vm(C).fase === "fine";
  }
  function sentinella(nomi) {
    var visti = [];
    var t = setInterval(function () { nomi.forEach(function (n) { var w = W.finestra(n); if (!w || !w.document || !w.document.body) return; var m = W.testo(w).match(/Problema di collegamento|Collegamento perso|Ops|La stanza è chiusa|non risponde/); if (m && visti.indexOf(n + ": " + m[0]) < 0) visti.push(n + ": " + m[0]); }); }, 50);
    return { stop: function () { clearInterval(t); return visti; } };
  }

  COPIONE.aggiungi("tg4", { nome: "Tris Gigante online: in 2, Luca guarda, Bea col link guarda; ricariche, telefono spento, l'host ricarica e riprende, fine e rivincita", fai: async function () {
    var note = [], nomi = { X: "Paky", O: "Giulia" };
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris Gigante");
    await W.apriTel("Giulia", { hash: "gioco=trisgigante&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return vm(C).avvId && A.dentro(W.finestra("Giulia")); }, 8000)) no("Giulia non entra");
    await W.apriTel("Luca", { hash: "gioco=trisgigante&stanza=" + C, x: 370 });
    await W.apriTel("Bea", { hash: "gioco=trisgigante&stanza=" + C + "&guarda=1", x: 555 });
    if (!await W.aspetta(function () { return /tu guardi/.test(T(W.finestra("Luca"))); }, 6000)) no("Luca (il terzo) non legge che guarda («" + T(W.finestra("Luca")).slice(0, 80) + "»)");
    var sent = sentinella(["Paky", "Giulia", "Luca", "Bea"]);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 5000)) no("non comincia");
    ["Paky", "Giulia"].forEach(function (n) { chiudiSpiega(W.finestra(n)); });
    if (!await W.aspetta(function () { return ["Luca", "Bea"].every(function (n) { return W.finestra(n).document.querySelector(".tg-tab"); }); }, 6000)) no("chi guarda non vede il tabellone");
    if (W.finestra("Luca").document.querySelector(".tg-sp") || W.finestra("Bea").document.querySelector(".tg-sp")) no("a chi guarda compare la spiegazione");
    await toccaOnline(C, nomi);
    var vedono = await W.aspetta(function () { return ["Giulia", "Luca", "Bea"].every(function (n) { return W.finestra(n).document.querySelectorAll(".tg-c svg").length === 1; }); }, 4000);
    if (!vedono) no("non tutti vedono la prima mossa");
    if (accese(W.finestra("Luca")) || accese(W.finestra("Bea"))) no("chi guarda può toccare");
    if (/Tocca a te/.test(stato(W.finestra("Luca")))) no("Luca (guarda) legge «Tocca a te»");
    note.push("la mossa arriva a tutti, chi guarda non tocca");
    var id0 = A.mioId("Giulia");
    await W.ricarica("Giulia");
    if (!await W.aspetta(function () { var g = W.finestra("Giulia"); return g.document.querySelectorAll(".tg-c svg").length === 1 && A.mioId("Giulia") === id0; }, 8000)) no("Giulia dopo la ricarica non ritrova la partita");
    note.push("Giulia ricarica: stesso posto");
    await toccaOnline(C, nomi);
    W.spegni("Giulia"); await W.dorme(5000); W.riaccendi("Giulia"); await W.dorme(1500);
    await toccaOnline(C, nomi); await toccaOnline(C, nomi);
    note.push("Giulia spenta 5 s: si continua");
    await W.dorme(900);
    var c0 = vm(C).c, t0 = vm(C).turno, s0 = (W.statoStanza(C) || {})._s;
    P = await W.ricarica("Paky");
    var ok = await W.aspetta(function () { var s = W.statoStanza(C) || {}, v = vm(C); return s._s && s._s !== s0 && s._r && v.fase === "gioco" && v.c === c0 && v.turno === t0; }, 12000);
    if (!ok) no("l'host ricarica: la partita non riprende uguale (fase " + vm(C).fase + ")");
    if (!await W.aspetta(function () { return /riprende da dove era/.test(A.pill(W.finestra("Giulia"))); }, 4000)) no("Giulia non legge «la partita riprende da dove era»");
    if (W.finestra("Giulia").document.querySelector(".saletta-schermo")) no("Giulia è tornata in saletta");
    note.push("l'host ricarica: riprende con le stesse mosse");
    if (!await finoAllaFine(C, nomi, 90000)) no("la partita non finisce");
    if (!await W.aspetta(function () { return ["Giulia", "Luca", "Bea"].every(function (n) { return /Hai vinto|Vince|Pareggio/.test(stato(W.finestra(n))); }); }, 4000)) no("non tutti vedono la fine");
    note.push("fine: «" + stato(W.finestra("Luca")) + "» per chi guarda, " + vm(C).k + " mosse");
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Rivincita|Nuova partita/); }, 4000)) no("niente Rivincita");
    // (con Luca nella stanza la saletta non parte da sola: l'host tocca «▶ Comincia senza Luca», come nel Tris)
    await W.aspetta(function () { return vm(C).fase === "lobby" && W.clicca(W.finestra("Paky"), /Comincia senza Luca/); }, 6000);
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).k === 0; }, 9000)) no("la rivincita non parte (fase " + vm(C).fase + ", k " + vm(C).k + "; Paky «" + T(W.finestra("Paky")).slice(0, 160) + "»; Giulia «" + T(W.finestra("Giulia")).slice(0, 120) + "»; Luca «" + T(W.finestra("Luca")).slice(0, 100) + "»)");
    if (!await W.aspetta(function () { return W.finestra("Bea").document.querySelector(".tg-tab"); }, 6000)) no("Bea non vede la rivincita");
    var v = sent.stop(); if (v.length) no("schermate viste: " + v.join("; "));
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return note.join(" · ") + " · rivincita partita";
  } });

  COPIONE.aggiungi("tg5", { nome: "Tris Gigante online, Campo a caso: lo decide l'host, la luce si ferma sullo stesso campo per tutti", fai: async function () {
    var nomi = { X: "Paky", O: "Giulia" };
    var P = await W.apriTel("Paky", { x: 0 });
    var tess = await W.aspetta(function () { return A.tessera(P, "Tris Gigante"); }, 5000); if (!tess) no("niente tessera"); tess.click(); await W.dorme(200);
    if (!W.clicca(P, /apro io/)) no("niente «apro io»"); await W.dorme(250);
    var ch = [].find.call(P.document.querySelectorAll(".modo-chip"), function (x) { return /Campo a caso/.test(x.textContent); }); if (!ch) no("nelle regole non c'è «Campo a caso»"); ch.click();
    if (!W.clicca(P, /Apri la stanza/)) no("niente «Apri la stanza»");
    var C = await W.aspetta(function () { var b = P.document.querySelector(".sl-cod b"); return b && /^[A-Z0-9]{4}$/.test(b.textContent) ? b.textContent : null; }, 5000);
    await W.apriTel("Giulia", { hash: "gioco=trisgigante&stanza=" + C, x: 185 });
    await W.apriTel("Bea", { hash: "gioco=trisgigante&stanza=" + C + "&guarda=1", x: 370 });
    if (!await W.aspetta(function () { return vm(C).avvId; }, 8000)) no("Giulia non entra");
    if (!/Campo a caso/.test(T(W.finestra("Giulia")))) no("in saletta Giulia non legge che si gioca a Campo a caso");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 5000)) no("non comincia");
    ["Paky", "Giulia"].forEach(function (n) { chiudiSpiega(W.finestra(n)); });
    var uguali = 0;
    for (var j = 0; j < 8 && vm(C).fase === "gioco"; j++) {
      var chi = await toccaOnline(C, nomi), v = vm(C);
      if (v.fase !== "gioco") break;
      if (v.campo < 0 || v.v.charAt(v.campo) !== ".") no("l'host ha scelto un campo chiuso o nessuno (" + v.campo + ")");
      var altro = chi === "Paky" ? "Giulia" : "Paky";
      var luci = await W.aspetta(function () { return [altro, "Bea"].every(function (n) { return W.finestra(n).document.querySelector(".tg-luce.on"); }); }, 2500, 30);
      if (!luci) no("mossa " + (j + 1) + ": la luce non gira per tutti");
      var fermi = await W.aspetta(function () { return ["Paky", "Giulia", "Bea"].every(function (n) { var g = campiCls(W.finestra(n), "gioca"); return g.length === 1 && g[0] === v.campo; }); }, 4000, 40);
      if (!fermi) no("mossa " + (j + 1) + ": la luce non si ferma su " + v.campo + " per tutti (" + ["Paky", "Giulia", "Bea"].map(function (n) { return n + " " + JSON.stringify(campiCls(W.finestra(n), "gioca")); }).join(", ") + ")");
      uguali++;
    }
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return uguali + " mosse: il campo lo sceglie l'host, la luce si ferma sullo stesso campo su tutti e tre i telefoni";
  } });

  COPIONE.aggiungi("tg6", { nome: "Tris Gigante nel torneo a eliminazione in 3 col Bot: partita vera, partita col Bot trasmessa, campione", fai: async function () {
    var S0 = await A.salaConAmici(["Giulia", "Luca"]), S = S0.S, P = S0.w.Paky;
    await A.apriSceltaTn(P, "Tris Gigante");
    A.chipTn(P, "Gioca col Bot");
    var E = await A.viaTn(P, S);
    if (!E.bot) no("il torneo non ha il Bot");
    var t0 = E.turni[0], pb = t0.filter(function (p) { return p.b === "bot"; })[0], pv = t0.filter(function (p) { return p.b && p.b !== "bot"; })[0];
    if (!pb || !pv) no("primo turno strano: " + JSON.stringify(t0));
    var chiB = A.nomeTn(E, pb.a), wB = W.finestra(chiB);
    if (!await W.aspetta(function () { return wB.document.querySelectorAll(".tg-c").length === 81; }, 9000)) no(chiB + " non ha la partita col Bot («" + T(wB).slice(0, 80) + "»)");
    chiudiSpiega(wB);
    if (!await W.aspetta(function () { var v = vm(pb.stanza); return v && typeof v.c === "string"; }, 8000)) no("la partita col Bot non si trasmette");
    // la partita vera: chi l'ha aperta è la X
    var nA = A.nomeTn(E, pv.a), nB = A.nomeTn(E, pv.b), wA = W.finestra(nA);
    if (!await W.aspetta(function () { return vm(pv.stanza).avvId; }, 12000)) no("la partita " + nA + "–" + nB + " non si apre con tutti e due");
    await W.aspetta(function () { return W.clicca(wA, /Comincia/, ".sl-go"); }, 8000);
    if (!await W.aspetta(function () { return vm(pv.stanza).fase === "gioco"; }, 8000)) no("la partita vera non comincia");
    [nA, nB].forEach(function (n) { chiudiSpiega(W.finestra(n)); });
    var vince = null, lim = Date.now() + 150000, partite = 0;
    while (Date.now() < lim && !vince) {
      var q = A.partitaTn(S, pv.k); if (q && q.vince) { vince = q.vince; break; }
      if (vm(pv.stanza).fase === "gioco") { await toccaOnline(pv.stanza, { X: nA, O: nB }); if (vm(pv.stanza).fase === "fine") partite++; }
      else await W.dorme(200);
    }
    if (!vince) no("la partita vera del torneo non decide chi passa");
    var Ef = await A.finoAllaFineTn(P, S);
    if (!Ef.campione) no("il torneo non ha il campione");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "partita vera " + nA + "–" + nB + " (" + partite + " partite) → passa " + A.nomeTn(Ef, vince) + "; " + chiB + " col Bot " + E.bot.nome + " (trasmessa); campione " + A.nomeTn(Ef, Ef.campione);
  } });

  COPIONE.aggiungi("tg7", { nome: "Tris Gigante con «👑 Chi vince resta» in 3: la sfida, chi vince resta, la sfida dopo parte da sola", fai: async function () {
    var S0 = await A.salaConAmici(["Giulia", "Luca"]), S = S0.S, P = S0.w.Paky, tutti = ["Paky", "Giulia", "Luca"];
    await A.apriSceltaTn(P, "Tris Gigante");
    if (!W.clicca(P, /Una sfida/, ".tn-scelta")) no("non c'è «Una sfida»");
    if (!W.clicca(P, /Scegli chi gioca/, ".piede button")) no("non c'è «Scegli chi gioca»");
    if (!await W.aspetta(function () { return A.chiGioca(P); }, 4000)) no("non si arriva a «Chi gioca?»");
    A.chiGioca(P).forEach(function (x) { A.toccaChi(P, x); }); A.toccaChi(P, "Paky"); A.toccaChi(P, "Giulia");
    if (!W.clicca(P, /^👑 Chi vince resta$/, ".piede button")) no("in «Chi gioca?» non c'è «👑 Chi vince resta»");
    async function sfida(n) {
      var sf = await W.aspetta(function () { var r = vm(S).resta; return r && r.n === n && r.sfida && r.sfida.stanza && vm(S).stanza === r.sfida.stanza ? r.sfida : null; }, 25000);
      if (!sf) no("la sfida " + n + " non parte da sola (" + JSON.stringify(vm(S).resta || null).slice(0, 160) + ")");
      if (!await W.aspetta(function () { return vm(sf.stanza).fase === "gioco"; }, 20000)) no("la sfida " + n + " non comincia (fase " + vm(sf.stanza).fase + ")");
      return sf.stanza;
    }
    var C1 = await sfida(1), v = vm(C1), nomi = { X: v.nomi.X, O: v.nomi.O };
    if ([nomi.X, nomi.O].sort().join() !== "Giulia,Paky") no("la prima sfida è " + nomi.X + "–" + nomi.O);
    tutti.forEach(function (n) { chiudiSpiega(W.finestra(n)); });
    if (!await W.aspetta(function () { var w = W.finestra("Luca"); return w.document.querySelector(".tg-tab") && w.document.querySelector(".sg-guardo"); }, 8000)) no("Luca in coda non guarda la partita con la targhetta («" + T(W.finestra("Luca")).slice(0, 80) + "»)");
    if (!await finoAllaFine(C1, nomi, 90000)) no("la prima sfida non finisce");
    var esito = stato(W.finestra("Luca"));
    if (!await W.aspetta(function () { return tutti.every(function (n) { return W.finestra(n).document.querySelector(".fine-resta"); }); }, 9000)) no("a fine sfida non tutti leggono chi resta");
    var tit = (W.finestra("Luca").document.querySelector(".fine-resta .fr-tit") || {}).textContent || "";
    var C2 = await sfida(2), v2 = vm(C2);
    if ([v2.nomi.X, v2.nomi.O].indexOf("Luca") < 0) no("nella seconda sfida non gioca Luca (" + v2.nomi.X + "–" + v2.nomi.O + ")");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "prima sfida " + nomi.X + "–" + nomi.O + " («" + esito + "», «" + tit + "»), la seconda parte da sola: " + v2.nomi.X + "–" + v2.nomi.O;
  } });
})();

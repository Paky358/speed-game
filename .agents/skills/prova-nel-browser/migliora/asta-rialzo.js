// PROVE "L'ASTA: CHI HA L'OFFERTA PIÙ ALTA PUÒ RIALZARE DA SOLO" (regola fissa del proprietario, 13 e 16 ott 2026:
// «te lo dirò per sempre, ci deve essere»: è strategia, offro di più così chi ha pochi crediti non ci arriva più).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("migliora/asta-rialzo.js"); await COPIONE.prova("ar1")
//
// ar1 Stesso telefono, temi: chi ha l'offerta tocca 2 volte il suo avatar → 2, 3 (stesso capo), il tempo riparte
//     (dopo 12 s l'asta è ancora aperta); «passo» del capo nascosto; nel round 2 chi ha pochi crediti si ferma al suo
//     massimo (niente luce, il tocco non fa niente) mentre gli altri possono ancora; il rialzo che lascia fuori tutti chiude subito.
// ar2 Stesso telefono, fantacalcio: «lo prendo a 1», poi rialza 2 volte (2, 3) e il tempo riparte; arrivato a 16 (20 crediti
//     meno 1 per ogni altro posto vuoto) nessuno può più seguirlo e il calciatore è suo subito, a 16.
// ar3 Online coi temi, 3 telefoni: l'host e un amico rialzano da soli col tasto «🙋 Rialzo» (2 volte di fila: +1 ogni volta,
//     giro nuovo e tempo pieno), il doppio messaggio vecchio non conta e non dà «Troppo tardi», chi ricarica da capo vede
//     ancora «🙋 Rialzo» e «tocca ancora per rialzare»; nel round 2 chi ha pochi crediti ha il tasto spento al suo massimo e
//     l'host non accetta il suo messaggio; «Passo» del capo resta impossibile.
// ar4 Online fantacalcio, 3 telefoni: rialzo da solo 2 volte (tasto e messaggio), tempo pieno (8 s), fino a 16: aggiudicato subito.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  function vm(C) { return W.vmDi(C) || {}; }

  // ---- la spia dell'Asta (apriTel(nome, { ar: true })): w.__t = il tavolo, w.__imp = regole cambiate per la prova ----
  if (!W.__prepAR) {
    W.__prepAR = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepAR(w, nome, opz);
      if (!opz || !opz.ar) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && g.id === "asta") {
            var av = g.avvia;
            g.avvia = function (t) {
              w.__t = t;
              if (w.__imp && t.impostazioni) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
              return av.apply(this, arguments);
            };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }

  // ---- aiuti ----
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function prezzo(w) { var b = q(w, ".sa-prezzo b, .st-prezzo b"); return b ? parseInt(b.textContent, 10) : null; }   // (sala dei temi o stadio)
  function pers(w) { return qa(w, ".sa-pers"); }   // in ordine di file (non di numero): si cerca per nome
  function persDi(w, nome) { return pers(w).filter(function (p) { var b = p.querySelector("b"); return b && b.textContent === nome; })[0] || null; }
  function tocca(w, nome) { var p = persDi(w, nome); if (!p) no("non trovo l'avatar di " + nome); p.click(); }
  function capoNome(w) { var p = pers(w).filter(function (x) { return x.classList.contains("guida"); })[0]; return p ? p.querySelector("b").textContent : null; }

  // stesso telefono: dalla home fino alla sala d'asta (3 amici)
  async function partitaLocale(imp) {
    var P = await W.apriTel("Paky", { x: 0, ar: true, prima: function (w) { w.__imp = imp; } });
    var tess = await W.aspetta(function () { return A.tessera(P, "L'Asta"); }, 6000);
    if (!tess) no("non trovo la tessera dell'Asta");
    tess.click(); await W.dorme(400);
    var bm = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".modo-grande"), function (b) { return /Su questo telefono/.test(b.textContent); }); }, 4000);
    if (!bm) no("non c'è «Su questo telefono»");
    bm.click();
    await W.aspetta(function () { return q(P, ".sala-riga input"); }, 3000);
    while (qa(P, ".sala-riga input").length < 3) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    qa(P, ".sala-riga input").forEach(function (c, k) { c.value = ["Paky", "Giulia", "Luca"][k] || ("Amico " + k); c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    for (var k = 0; k < 8 && !P.__t; k++) {
      await W.dorme(300);
      if (P.__t) break;
      var b = qa(P, ".schermata .piede button").filter(function (x) { return /Avanti|Comincia|Gioca|Inizia|Via|Pronti|Partiamo|▶/.test(x.textContent) && !x.disabled; })[0];
      if (b) b.click();
    }
    if (!await W.aspetta(function () { return P.__t; }, 3000)) no("l'Asta non parte («" + T(P).slice(0, 70) + "»)");
    return P;
  }
  // stesso telefono: va avanti (tasti di passaggio) finché c'è la sala o lo stadio; sceglie la prima carta libera
  async function finoAllAsta(P, ms) {
    return W.aspetta(function () {
      if (q(P, ".sa-pers") && prezzo(P) != null && !q(P, ".sa-aggiudicato")) return true;
      var c = q(P, ".as-carta:not([disabled])"); if (c) { c.click(); return false; }
      W.clicca(P, /Avanti|Comincia|Vai|Pronti|Si parte|Prossim|Continua|▶/);
      return false;
    }, ms || 15000, 250);
  }

  // ===== ar1: stesso telefono, temi =====
  COPIONE.aggiungi("ar1", { nome: "Asta stesso telefono (temi): chi ha l'offerta rialza da solo", fai: async function () {
    var P = await partitaLocale({ formato: "temi", crediti: 15, round: "normali", maledetta: false }), note = [];
    if (!await finoAllAsta(P)) no("non arrivo alla sala d'asta («" + T(P).slice(0, 80) + "»)");
    var capo = capoNome(P); if (!capo) no("all'apertura non c'è chi guida (chi sceglie parte da 1)");
    if (prezzo(P) !== 1) no("si parte da " + prezzo(P) + " invece di 1");
    var pc = persDi(P, capo);
    if (!pc.classList.contains("puo")) no("il capo (" + capo + ") non ha la luce per rialzare");
    var passo = pc.querySelector(".sa-passo"); if (passo && passo.style.visibility !== "hidden" && passo.style.display !== "none") no("il capo ha il tasto «passo»");
    if (!/rialzare/.test(T(P))) no("la scritta non dice che chi ha l'offerta può rialzare");
    await W.dorme(6000);
    tocca(P, capo); await W.dorme(150);
    if (prezzo(P) !== 2 || capoNome(P) !== capo) no("dopo il primo rialzo: " + prezzo(P) + " di " + capoNome(P) + " (voluto 2 di " + capo + ")");
    tocca(P, capo); await W.dorme(150);
    if (prezzo(P) !== 3 || capoNome(P) !== capo) no("dopo il secondo rialzo: " + prezzo(P) + " di " + capoNome(P) + " (voluto 3 di " + capo + ")");
    await W.dorme(6500);   // 12,5 s dall'apertura: senza il tempo che riparte sarebbe già chiusa
    if (!q(P, ".sa-pers") || q(P, ".sa-aggiudicato") || prezzo(P) !== 3) no("il tempo non è ripartito col rialzo (asta chiusa o cambiata a 12 s)");
    note.push("rialzo 1→2→3 da " + capo + ", tempo ripartito");
    // passare per il capo resta impossibile (anche a codice)
    var altri = ["Paky", "Giulia", "Luca"].filter(function (n) { return n !== capo; });
    // ora un altro rilancia (4) e si va a chiudere: tutti gli altri passano tranne il nuovo capo
    tocca(P, altri[0]); await W.dorme(150);
    if (prezzo(P) !== 4 || capoNome(P) !== altri[0]) no("il rilancio di " + altri[0] + " non va: " + prezzo(P) + " di " + capoNome(P));
    // a 12 crediti massimo (15 - 3 round dopo): altri[0] rialza da solo fino a 10
    for (var i = 0; i < 6; i++) { tocca(P, altri[0]); await W.dorme(120); }
    if (prezzo(P) !== 10 || capoNome(P) !== altri[0]) no("6 rialzi di fila: " + prezzo(P) + " di " + capoNome(P) + " (voluto 10)");
    // gli altri due passano: è sua a 10
    [capo, altri[1]].forEach(function (n) { var b = persDi(P, n).querySelector(".sa-passo"); if (b) b.click(); });
    if (!await W.aspetta(function () { return q(P, ".sa-aggiudicato") || !q(P, ".sa-pers"); }, 4000)) no("dopo i due «passo» l'asta non si chiude");
    note.push(altri[0] + " rialza da solo fino a 10 e la prende");
    // il resto del round 1: chi resta senza carta la prende a 1 (passa l'altro)
    var fine1 = Date.now() + 40000, ricco = altri[0];
    while (Date.now() < fine1) {
      if (!await finoAllAsta(P, 8000)) break;
      if (/Round 2/.test((q(P, ".sa-info") || {}).textContent || "")) break;
      var c2 = capoNome(P), gara = pers(P).filter(function (x) { return !x.classList.contains("fuori") && x.querySelector("b").textContent !== c2; });
      gara.forEach(function (x) { var b = x.querySelector(".sa-passo"); if (b && b.style.visibility !== "hidden") b.click(); });
      await W.dorme(600);
    }
    if (!/Round 2/.test((q(P, ".sa-info") || {}).textContent || "")) no("non si arriva al round 2 («" + T(P).slice(0, 80) + "»)");
    // round 2: il "povero" (ricco = ha speso 10: gli restano 5, con 2 round dopo può arrivare a 3)
    var povero = ricco;
    // porto il povero a guidare: se non guida già, rilancia lui
    if (capoNome(P) !== povero) { tocca(P, povero); await W.dorme(150); }
    for (var j = 0; j < 5; j++) { tocca(P, povero); await W.dorme(120); }
    if (prezzo(P) !== 3 || capoNome(P) !== povero) no("il povero (" + povero + ", 5 crediti, round 2) arriva a " + prezzo(P) + " invece di fermarsi a 3");
    if (persDi(P, povero).classList.contains("puo")) no("al suo massimo il povero ha ancora la luce per rialzare");
    var unAltro = ["Paky", "Giulia", "Luca"].filter(function (n) { return n !== povero; })[0];
    if (!persDi(P, unAltro).classList.contains("puo")) no(unAltro + " (crediti pieni) non può più rilanciare");
    note.push("round 2: " + povero + " con 5 crediti si ferma a 3, gli altri possono ancora");
    // il rialzo che lascia fuori tutti: unAltro rilancia e poi rialza da solo finché nessuno può più seguirlo → chiusa subito (non a tempo)
    var t0 = Date.now(), tocchi = 0;
    while (tocchi < 15 && q(P, ".sa-pers") && !q(P, ".sa-aggiudicato") && /Round 2/.test((q(P, ".sa-info") || {}).textContent || "")) { tocca(P, unAltro); tocchi++; await W.dorme(120); }
    var chiusa = await W.aspetta(function () { return q(P, ".sa-aggiudicato") || !/Round 2/.test((q(P, ".sa-info") || {}).textContent || "") || !q(P, ".sa-pers"); }, 1500);
    if (!chiusa || Date.now() - t0 > 8000) no("il rialzo che lascia fuori tutti non chiude subito l'asta");
    note.push(unAltro + " rialza da solo finché nessuno lo segue: chiusa subito (" + tocchi + " tocchi, " + (prezzo(P) || "?") + " 💰)");
    var errori = (P.__err || []).length; if (errori) no("errori nella pagina: " + P.__err.slice(0, 2).join(" / "));
    return note.join(" · ");
  } });

  // ===== ar2: stesso telefono, fantacalcio =====
  COPIONE.aggiungi("ar2", { nome: "Asta stesso telefono (fantacalcio): chi ha l'offerta rialza da solo", fai: async function () {
    var P = await partitaLocale({ formato: "fanta" }), note = [];
    if (!await finoAllAsta(P, 20000)) no("non arrivo allo stadio («" + T(P).slice(0, 80) + "»)");
    if (capoNome(P)) no("all'inizio c'è già un capo");
    tocca(P, "Giulia"); await W.dorme(150);
    if (prezzo(P) !== 1 || capoNome(P) !== "Giulia") no("«lo prendo a 1» non va: " + prezzo(P) + " di " + capoNome(P));
    if (!persDi(P, "Giulia").classList.contains("puo")) no("Giulia (capo) non ha la luce per rialzare");
    await W.dorme(5000);
    tocca(P, "Giulia"); await W.dorme(150);
    tocca(P, "Giulia"); await W.dorme(150);
    if (prezzo(P) !== 3 || capoNome(P) !== "Giulia") no("2 rialzi da sola: " + prezzo(P) + " di " + capoNome(P) + " (voluto 3)");
    await W.dorme(5000);   // 10 s dal primo tocco: senza il tempo che riparte (8 s) sarebbe già chiusa
    if (q(P, ".sa-aggiudicato") || prezzo(P) !== 3 || capoNome(P) !== "Giulia") no("il tempo non è ripartito col rialzo");
    note.push("1→2→3 da Giulia, tempo ripartito");
    for (var i = 0; i < 13; i++) { if (capoNome(P) !== "Giulia") break; tocca(P, "Giulia"); await W.dorme(100); }
    // a 16 nessuno può seguirla: si chiude subito ed è sua a 16
    var ok = await W.aspetta(function () { return /Aggiudicato/.test((q(P, ".sa-info") || {}).textContent || ""); }, 3000);
    if (!ok) no("arrivata a " + prezzo(P) + " l'asta non si chiude da sola («" + ((q(P, ".sa-info") || {}).textContent || "") + "»)");
    if (prezzo(P) !== 16) no("aggiudicato a " + prezzo(P) + " invece di 16 (massimo: 20 meno 1 per ogni altro posto)");
    note.push("a 16 nessuno la segue: aggiudicato subito");
    if ((P.__err || []).length) no("errori nella pagina: " + P.__err.slice(0, 2).join(" / "));
    return note.join(" · ");
  } });

  // ===== online: 3 telefoni =====
  async function treTelefoni(imp) {
    var P = await W.apriTel("Paky", { x: 0, ar: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "L'Asta");
    await W.apriTel("Giulia", { hash: "gioco=asta&stanza=" + C, x: 185 });
    await W.apriTel("Luca", { hash: "gioco=asta&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 8000)) no("non sono entrati in 3");
    W.clicca(P, /Comincia/);
    return { P: P, C: C };
  }
  function mio(n) { return A.mioId(n); }
  function tasto(w, re) { return qa(w, ".sa-piede button").filter(function (b) { return re.test(b.textContent); })[0] || null; }

  COPIONE.aggiungi("ar3", { nome: "Asta online (temi), 3 telefoni: rialzo da soli", fai: async function () {
    var o = await treTelefoni({ formato: "temi", crediti: 15, round: "normali", maledetta: false }), P = o.P, C = o.C, G = W.finestra("Giulia"), note = [];
    // l'host sceglie (o chi tocca): aspetto la scelta e scelgo la prima carta
    var fino = Date.now() + 20000;
    while (Date.now() < fino && vm(C).fase !== "asta") {
      var v = vm(C);
      if (v.fase === "scelta") { if (v.sceglieId === "host") { var c = q(P, ".as-carta:not([disabled])"); if (c) c.click(); } else W.reteDi(v.sceglieId === mio("Giulia") ? "Giulia" : "Luca").invia({ t: "scegli", idx: 0, n: v.nScelta, nome: v.tavolo[0].nome }); }
      W.clicca(P, /Vedi le carte|Avanti/);
      await W.dorme(300);
    }
    var a = vm(C).asta; if (!a) no("non parte l'asta (fase " + vm(C).fase + ")");
    // porto Giulia a guidare col suo tasto
    var nG = mio("Giulia");
    if (a.leaderId !== nG) {
      if (!await W.aspetta(function () { return tasto(G, /Rilancio/); }, 4000)) no("Giulia non ha «Rilancio»");
      tasto(G, /Rilancio/).click();
      if (!await W.aspetta(function () { return (vm(C).asta || {}).leaderId === nG; }, 3000)) no("il rilancio di Giulia non arriva");
    }
    var a0 = vm(C).asta, p0 = a0.offerta, g0 = a0.giro;
    if (!await W.aspetta(function () { var b = tasto(G, /Rialzo/); return b && !b.disabled; }, 3000)) no("Giulia guida ma non ha «🙋 Rialzo» («" + T(G).slice(-120) + "»)");
    if (tasto(G, /^\s*Passo\s*$/)) no("Giulia guida e ha ancora «Passo»");
    if (!/tocca ancora per rialzare/.test(T(G))) no("Giulia guida e la scritta non dice «tocca ancora per rialzare»");
    if (!persDi(G, "Giulia") || !persDi(G, "Giulia").classList.contains("puo")) no("l'avatar di Giulia (capo) non ha la luce per rialzare");
    await W.dorme(600);
    tasto(G, /Rialzo/).click();
    if (!await W.aspetta(function () { return (vm(C).asta || {}).offerta === p0 + 1; }, 3000)) no("il primo rialzo di Giulia non arriva");
    var a1 = vm(C).asta;
    if (a1.leaderId !== nG || a1.giro <= g0 || a1.resta < 8500) no("dopo il rialzo: capo " + a1.leaderNome + ", giro " + g0 + "→" + a1.giro + ", resta " + a1.resta + " ms");
    // il secondo: tocco l'avatar (dopo 600 ms, il tasto doppio non conta prima)
    await W.aspetta(function () { var b = tasto(G, /Rialzo/); return b && b.textContent.indexOf(String(p0 + 2)) >= 0; }, 3000);
    await W.dorme(600);
    persDi(G, "Giulia").click();
    if (!await W.aspetta(function () { return (vm(C).asta || {}).offerta === p0 + 2; }, 3000)) no("il secondo rialzo di Giulia (toccando l'avatar) non arriva");
    if (vm(C).asta.leaderId !== nG) no("dopo il secondo rialzo il capo non è più Giulia");
    note.push("Giulia " + p0 + "→" + (p0 + 1) + "→" + (p0 + 2) + " (tasto e avatar), tempo pieno");
    // il messaggio doppio (prezzo già visto) non conta e niente «Troppo tardi»
    W.reteDi("Giulia").invia({ t: "rilancia", n: a1.n, prezzo: p0 + 2 });
    await W.dorme(700);
    if (vm(C).asta.offerta !== p0 + 2) no("il messaggio doppio ha fatto salire il prezzo");
    if (/Troppo tardi/.test(T(G))) no("al capo col messaggio doppio compare «Troppo tardi»");
    // passare da capo: non conta
    W.reteDi("Giulia").invia({ t: "passa", n: a1.n }); await W.dorme(500);
    if ((vm(C).asta.passati || []).indexOf(nG) >= 0) no("il capo è riuscito a passare");
    // Giulia ricarica: vede ancora «🙋 Rialzo»
    await W.ricarica("Giulia"); G = W.finestra("Giulia");
    if (!await W.aspetta(function () { var b = tasto(G, /Rialzo/); return b && b.textContent.indexOf(String(p0 + 3)) >= 0; }, 8000)) no("dopo la ricarica Giulia non ha «🙋 Rialzo: " + (p0 + 3) + "» («" + T(G).slice(-120) + "»)");
    if (!/tocca ancora per rialzare/.test(T(G))) no("dopo la ricarica la scritta non dice «tocca ancora per rialzare»");
    note.push("ricarica ok");
    // l'host: rilancia lui e rialza da solo col suo tasto
    if (!await W.aspetta(function () { return tasto(P, /Rilancio/); }, 3000)) no("l'host non ha «Rilancio»");
    tasto(P, /Rilancio/).click(); await W.dorme(700);
    if (!await W.aspetta(function () { var b = tasto(P, /Rialzo/); return b && !b.disabled; }, 3000)) no("l'host guida ma non ha «🙋 Rialzo»");
    tasto(P, /Rialzo/).click();
    if (!await W.aspetta(function () { var x = vm(C).asta || {}; return x.offerta === p0 + 4 && x.leaderId === "host"; }, 3000)) no("il rialzo dell'host non va (" + JSON.stringify(vm(C).asta && [vm(C).asta.offerta, vm(C).asta.leaderId]) + ")");
    note.push("host " + (p0 + 3) + "→" + (p0 + 4));
    // Giulia la prende a 10 (rialzi a messaggio, uno alla volta), gli altri passano
    var giro = 0;
    while (vm(C).asta && vm(C).asta.offerta < 10 && giro++ < 20) { W.reteDi("Giulia").invia({ t: "rilancia", n: vm(C).asta.n, prezzo: vm(C).asta.offerta + 1 }); await W.dorme(250); }
    if ((vm(C).asta || {}).offerta !== 10 || vm(C).asta.leaderId !== nG) no("Giulia non arriva a 10 coi rialzi");
    W.reteDi("Luca").invia({ t: "passa", n: vm(C).asta.n }); tasto(P, /^\s*Passo\s*$/) && tasto(P, /^\s*Passo\s*$/).click();
    if (!await W.aspetta(function () { return vm(C).fase !== "asta"; }, 4000)) no("l'asta non si chiude dopo i due «Passo»");
    // fino al round 2: chi sceglie prende la prima carta, chi può passa
    fino = Date.now() + 60000;
    while (Date.now() < fino && !(vm(C).roundIdx === 1 && vm(C).fase === "asta")) {
      var v2 = vm(C);
      if (v2.fase === "scelta") { if (v2.sceglieId === "host") { var c2 = q(P, ".as-carta:not([disabled])"); if (c2) c2.click(); } else W.reteDi(v2.sceglieId === nG ? "Giulia" : "Luca").invia({ t: "scegli", idx: 0, n: v2.nScelta, nome: v2.tavolo[0].nome }); }
      if (v2.fase === "asta" && v2.roundIdx === 0) { W.reteDi("Luca").invia({ t: "passa", n: v2.asta.n }); var bp = tasto(P, /^\s*Passo\s*$/); if (bp) bp.click(); }
      W.clicca(P, /Vedi le carte|Avanti/);
      await W.dorme(400);
    }
    if (!(vm(C).roundIdx === 1 && vm(C).fase === "asta")) no("non si arriva all'asta del round 2 (round " + vm(C).roundIdx + ", fase " + vm(C).fase + ")");
    // round 2: Giulia ha 5 crediti, 2 round dopo: arriva al massimo a 3
    var gi = (vm(C).giocatori || []).filter(function (x) { return x.id === nG; })[0];
    if (!gi || gi.crediti !== 5) no("Giulia nel round 2 ha " + (gi && gi.crediti) + " crediti invece di 5");
    giro = 0;
    while (vm(C).asta && vm(C).asta.offerta < 3 && giro++ < 10) { W.reteDi("Giulia").invia({ t: "rilancia", n: vm(C).asta.n, prezzo: vm(C).asta.offerta + 1 }); await W.dorme(250); }
    if ((vm(C).asta || {}).offerta !== 3 || vm(C).asta.leaderId !== nG) no("nel round 2 Giulia non arriva a 3 (" + JSON.stringify(vm(C).asta && [vm(C).asta.offerta, vm(C).asta.leaderNome]) + ")");
    if (!await W.aspetta(function () { var b = tasto(G, /Rialzo/); return b && b.disabled; }, 3000)) no("al suo massimo Giulia ha il tasto «Rialzo» acceso");
    if (/tocca ancora per rialzare/.test(T(G))) no("al suo massimo la scritta dice ancora «tocca ancora per rialzare»");
    W.reteDi("Giulia").invia({ t: "rilancia", n: vm(C).asta.n, prezzo: 4 }); await W.dorme(600);
    if (vm(C).asta.offerta !== 3) no("l'host ha accettato il rialzo di Giulia oltre il suo massimo");
    if (!tasto(P, /Rilancio: 4/) || tasto(P, /Rilancio: 4/).disabled) no("l'host (crediti pieni) non può più rilanciare a 4");
    note.push("round 2: Giulia (5 crediti) ferma a 3, gli altri no");
    if (W.erroriTel().length) no("errori: " + W.erroriTel().slice(0, 3).join(" / "));
    return note.join(" · ");
  } });

  COPIONE.aggiungi("ar4", { nome: "Asta online (fantacalcio), 3 telefoni: rialzo da soli", fai: async function () {
    var o = await treTelefoni({ formato: "fanta" }), P = o.P, C = o.C, G = W.finestra("Giulia"), note = [];
    if (!await W.aspetta(function () { return vm(C).fase === "asta" && vm(C).asta; }, 15000)) no("non parte l'asta (fase " + vm(C).fase + ")");
    var nG = mio("Giulia");
    if (!await W.aspetta(function () { return tasto(G, /Lo prendo a/); }, 4000)) no("Giulia non ha «Lo prendo a 1»");
    tasto(G, /Lo prendo a/).click();
    if (!await W.aspetta(function () { return (vm(C).asta || {}).leaderId === nG; }, 3000)) no("«Lo prendo» di Giulia non arriva");
    if (!await W.aspetta(function () { var b = tasto(G, /Rialzo: 2/); return b && !b.disabled; }, 3000)) no("Giulia guida ma non ha «🙋 Rialzo: 2» («" + T(G).slice(-120) + "»)");
    if (!/tocca ancora per rialzare/.test(T(G))) no("la scritta non dice «tocca ancora per rialzare»");
    await W.dorme(3500);
    var g0 = vm(C).asta.giro;
    tasto(G, /Rialzo/).click();
    if (!await W.aspetta(function () { return (vm(C).asta || {}).offerta === 2; }, 3000)) no("il primo rialzo non arriva");
    if (vm(C).asta.giro <= g0 || vm(C).asta.resta < 6500 || vm(C).asta.durata !== 8000) no("il tempo non riparte pieno (giro " + vm(C).asta.giro + ", resta " + vm(C).asta.resta + ", durata " + vm(C).asta.durata + ")");
    await W.aspetta(function () { return tasto(G, /Rialzo: 3/); }, 3000); await W.dorme(600);
    tasto(G, /Rialzo: 3/).click();   // (dal 21 ott online non c'è più la panchina da toccare: si offre coi tasti)
    if (!await W.aspetta(function () { return (vm(C).asta || {}).offerta === 3 && vm(C).asta.leaderId === nG; }, 3000)) no("il secondo rialzo (tasto) non arriva");
    note.push("1→2→3 da Giulia, tempo pieno (8 s)");
    W.reteDi("Giulia").invia({ t: "rilancia", n: vm(C).asta.nCarta, prezzo: 3 }); await W.dorme(600);
    if (vm(C).asta.offerta !== 3 || /Troppo tardi/.test(T(G))) no("il messaggio doppio conta o dà «Troppo tardi»");
    W.reteDi("Giulia").invia({ t: "passa", n: vm(C).asta.nCarta }); await W.dorme(400);
    if ((vm(C).asta.passati || []).indexOf(nG) >= 0) no("il capo è riuscito a passare");
    await W.ricarica("Giulia"); G = W.finestra("Giulia");
    if (!await W.aspetta(function () { var b = tasto(G, /Rialzo: 4/); return b && !b.disabled; }, 8000)) no("dopo la ricarica Giulia non ha «🙋 Rialzo: 4»");
    note.push("ricarica ok");
    var giro = 0, n = vm(C).asta.nCarta;
    while (vm(C).fase === "asta" && vm(C).asta && vm(C).asta.nCarta === n && giro++ < 20) { W.reteDi("Giulia").invia({ t: "rilancia", n: n, prezzo: vm(C).asta.offerta + 1 }); await W.dorme(250); }
    var e = vm(C).esito;
    if (!e || e.chiId !== nG || e.prezzo !== 16 || e.tipo !== "vinta") no("a 16 non è subito di Giulia: " + JSON.stringify(e && [e.chiNome, e.prezzo, e.tipo]) + " fase " + vm(C).fase);
    note.push("a 16 nessuno la segue: aggiudicato subito");
    if (W.erroriTel().length) no("errori: " + W.erroriTel().slice(0, 3).join(" / "));
    return note.join(" · ");
  } });
})();

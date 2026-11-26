// PROVE DI «🐑 PECORA NERA» (26 nov 2026, chat «🐑 Holy Sheep»): il gioco del gregge.
//   prova.js --porta 8990 --carica preferiti/pecoranera.js --prova pn1,pn2,…
// pn1 in 4 dalla stanza: la risposta segreta (mai nella foto mentre si scrive), i gruppi uguali da soli («il qwerty» = «Qwerty»),
//     Luca unisce due carte, Giulia le separa (✂️), Marco le riunisce; i punti col tasto di Paky (2 a testa); poi la partita
//     fino a Giulia prima al traguardo (in 4 «corta» = 10), classifica coi tasti del core.
// pn2 chi arriva tardi (Sara col link: «✋ Entri dalla prossima», niente campo, poi gioca con 0 punti), chi guarda (Dina col
//     link &guarda=1: niente campo né carte da toccare, la targhetta del core), chi ricarica mentre scrive (ritrova «✅ …»).
// pn3 l'host ricarica mentre si scrive (la risposta di Giulia resta) e sui gruppi (i punti si danno una volta sola).
// pn4 l'host sparisce sui gruppi: Giulia (la vice) porta avanti la partita fino alla classifica.
// pn5 sullo stesso telefono in 3: ci si passa il telefono, rivelazione, unione, partita intera fino a t.fine.
// pn6 le misure in 10 a 360x640 e 412x915: si scrive, 10 gruppi, la classifica: niente scorre, niente esce dallo schermo.
// pn7 la pari al traguardo: un'altra domanda (⚔️), poi vince chi ha più punti.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T;
  var PN = W.PN = {};
  var DOM = ["Una bibita estiva", "Il miglior giorno della settimana", "Un liquido bianco", "Un frutto rosso", "Un numero da 1 a 10", "Un animale della fattoria", "Una stanza della casa", "Un colore", "Se dico Gian, voi dite…", "Un dolce di Natale"];
  function vib(w) { w.__vib = []; try { Object.defineProperty(w.navigator, "vibrate", { configurable: true, value: function (p) { w.__vib.push(p); return true; } }); } catch (e) {} }
  function prima(extra) { return function (w) { w.__PN_PROVA = Object.assign({ durata: "corta", domande: DOM }, extra || {}); vib(w); }; }
  PN.prima = prima;
  function F(n) { return W.finestra(n); }
  function giocatore(C, nome) { return (vm(C).players || []).filter(function (p) { return p.nome === nome; })[0] || null; }
  function punti(C) { var o = {}; (vm(C).players || []).forEach(function (p) { o[p.nome] = p.punti; }); return o; }
  PN.punti = punti;
  function campo(w) { var c = w && w.document.querySelector(".pn-input"); return c && c.offsetParent ? c : null; }
  PN.campo = campo;
  PN.scrivi = async function (w, testo) {
    if (!await W.aspetta(function () { return campo(w); }, 8000)) return false;
    var c = campo(w); c.value = testo; c.dispatchEvent(new w.Event("input", { bubbles: true }));
    var b = w.document.querySelector(".pn-invia"); if (!b) return false; b.click(); return true;
  };
  // la carta di un gruppo col suo testo (sui gruppi)
  function carta(w, testo) { return [].find.call(w.document.querySelectorAll(".pn-g"), function (c) { var t = c.querySelector(".pn-gt"); return t && t.textContent === testo; }) || null; }
  PN.carta = carta;
  // la stanza: Paky apre, gli amici entrano col link; poi «Comincia»
  PN.stanza = async function (amici, opz) {
    opz = opz || {};
    var P = await W.apriTel("Paky", { x: 0, prima: prima(opz.prova) });
    var C = await W.apriStanza(P, "Pecora Nera");
    for (var i = 0; i < amici.length; i++) {
      await W.apriTel(amici[i], { hash: "gioco=pecoranera&stanza=" + C, x: 185 * ((i + 1) % 6), prima: prima(opz.prova) });
      var n = amici[i];
      if (!await W.aspetta(function () { return !!giocatore(C, n); }, 8000)) no(n + " non entra");
    }
    if (!opz.fermo) {
      W.clicca(P, /Comincia/);
      if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 9000)) no("la partita non comincia (" + vm(C).fase + ")");
    }
    return { C: C, P: P };
  };
  // una domanda: ognuno scrive la sua (risp = { nome: testo }); torna quando si è sui gruppi
  PN.domanda = async function (C, risp, opz) {
    opz = opz || {};
    var n0 = vm(C).n;
    if (!await W.aspetta(function () { return vm(C).passo === "scrivi"; }, 12000)) no("non si scrive (passo " + vm(C).passo + ")");
    var nomi = Object.keys(risp);
    for (var i = 0; i < nomi.length; i++) if (!await PN.scrivi(F(nomi[i]), risp[nomi[i]])) no(nomi[i] + " non ha il campo per scrivere («" + T(F(nomi[i])).slice(0, 100) + "»)");
    if (opz.segreto) {   // mentre si scrive la foto non deve avere le risposte
      var s = JSON.stringify(vm(C)).toLowerCase();
      nomi.forEach(function (x) { var r = String(risp[x]).toLowerCase(); if (vm(C).passo === "scrivi" && s.indexOf(r) >= 0) no("la risposta di " + x + " («" + r + "») è nella foto mentre si scrive"); });
    }
    if (!await W.aspetta(function () { return vm(C).passo === "gruppi" && vm(C).n === n0 || vm(C).fase === "fine"; }, 25000)) no("non si arriva ai gruppi (passo " + vm(C).passo + ")");
  };
  PN.avanti = async function (C, chi) {
    var w = F(chi || "Paky"), n0 = vm(C).n;
    if (!await W.aspetta(function () { var b = w.document.querySelector(".pn-vai"); return b && !b.disabled ? b : null; }, 6000)) no((chi || "Paky") + " non ha «▶ Avanti»");
    w.document.querySelector(".pn-vai").click();
    if (!await W.aspetta(function () { return vm(C).n !== n0 || vm(C).fase === "fine"; }, 6000)) no("dopo «Avanti» non si va avanti");
  };

  COPIONE.aggiungi("pn1", { nome: "Pecora Nera in 4: risposte segrete, gruppi, unire e separare, punti, partita intera", fai: async function () {
    var Z = await PN.stanza(["Giulia", "Luca", "Marco"]), C = Z.C, P = Z.P, G = F("Giulia"), L = F("Luca"), M = F("Marco");
    if (vm(C).meta !== 10) no("in 4 «corta» il traguardo è " + vm(C).meta + " (doveva essere 10)");
    if (!await W.aspetta(function () { return campo(G) && /Una bibita estiva/.test(T(G)); }, 6000)) no("Giulia non vede la domanda col campo («" + T(G).slice(0, 100) + "»)");
    // le risposte uscite mentre si scrive: mai nella foto
    var segreti = [];
    var spia = setInterval(function () { var v = vm(C); if (v.passo === "scrivi" && /qwerty|zorbak/i.test(JSON.stringify(v))) segreti.push(v.n); }, 50);
    await PN.domanda(C, { Paky: "Qwerty", Giulia: "il qwerty", Luca: "Zorbak", Marco: "Zorbak-Cola" }, { segreto: true });
    clearInterval(spia);
    if (segreti.length) no("le risposte sono passate nella foto mentre si scriveva");
    var gr = vm(C).gruppi || [];
    if (gr.length !== 3) no("i gruppi sono " + gr.length + " (" + JSON.stringify(gr) + "), dovevano essere 3");
    var gq = gr.filter(function (g) { return /qwerty/i.test(g.t); })[0];
    if (!gq || gq.ids.length !== 2) no("«Qwerty» e «il qwerty» non stanno insieme");
    // Luca unisce Zorbak e Zorbak-Cola
    if (!await W.aspetta(function () { return carta(L, "Zorbak") && carta(L, "Zorbak-Cola"); }, 4000)) no("Luca non vede le carte dei gruppi");
    carta(L, "Zorbak").click(); carta(L, "Zorbak-Cola").click();
    if (!await W.aspetta(function () { return (vm(C).unioni || []).length === 1; }, 4000)) no("l'unione di Luca non arriva");
    if (!await W.aspetta(function () { return /unite da Luca/.test(T(G)); }, 4000)) no("Giulia non legge «unite da Luca» («" + T(G).slice(0, 160) + "»)");
    // Giulia separa
    var sep = await W.aspetta(function () { return G.document.querySelector(".pn-sep"); }, 3000);
    if (!sep) no("Giulia non ha ✂️"); sep.click();
    if (!await W.aspetta(function () { return (vm(C).unioni || []).length === 0; }, 4000)) no("✂️ di Giulia non separa");
    // Marco riunisce
    if (!await W.aspetta(function () { return carta(M, "Zorbak") && carta(M, "Zorbak-Cola"); }, 4000)) no("Marco non vede le due carte separate");
    carta(M, "Zorbak-Cola").click(); carta(M, "Zorbak").click();
    if (!await W.aspetta(function () { return (vm(C).unioni || []).length === 1; }, 4000)) no("l'unione di Marco non arriva");
    if (G.document.querySelector(".pn-vai")) no("Giulia ha il tasto «Avanti» (ce l'ha solo chi tiene la partita)");
    if (!/va avanti Paky/.test(T(G))) no("Giulia non legge chi va avanti («" + T(G).slice(-120) + "»)");
    await PN.avanti(C);
    var pt = punti(C);
    if (pt.Paky !== 2 || pt.Giulia !== 2 || pt.Luca !== 2 || pt.Marco !== 2) no("i punti dopo la prima domanda sono " + JSON.stringify(pt) + " (2 a testa)");
    // poi Giulia va in coppia a turno con gli altri: arriva prima a 10 (alla 5ª domanda), gli altri al massimo a 6
    var compagni = ["Paky", "Luca", "Marco"], nomi = ["Paky", "Giulia", "Luca", "Marco"];
    for (var d = 2; d <= 8 && vm(C).fase !== "fine"; d++) {
      var r = {}, socio = compagni[(d - 2) % 3];
      nomi.forEach(function (x) { r[x] = x === "Giulia" || x === socio ? "pecora" + d : x + d; });
      await PN.domanda(C, r);
      if (vm(C).fase === "fine") break;
      await PN.avanti(C);
    }
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 6000)) no("la partita non finisce (" + JSON.stringify(punti(C)) + ")");
    var cl = vm(C).classifica || [];
    if (!cl[0] || cl[0].nome !== "Giulia" || cl[0].pos !== 1 || cl[0].punti !== 10) no("la classifica è " + JSON.stringify(cl));
    if (cl.filter(function (r) { return r.pos === 1; }).length !== 1) no("più di un primo posto");
    if (!await W.aspetta(function () { return A.tastiFineDi(P) && A.tastiFineDi(G); }, 5000)) no("a fine partita mancano i tasti del core");
    if (!/primo a 10/.test(T(G))) no("la classifica non dice chi è arrivato primo («" + T(G).slice(0, 120) + "»)");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "segreto ok, «il qwerty» = «Qwerty», unisci/separa/riunisci, 2 punti a testa; vince Giulia a " + cl[0].punti + " (" + cl.map(function (r) { return r.nome + " " + r.punti; }).join(", ") + ")";
  } });

  COPIONE.aggiungi("pn2", { nome: "Pecora Nera: chi arriva tardi, chi guarda col link, chi ricarica mentre scrive", fai: async function () {
    var Z = await PN.stanza(["Giulia", "Luca"]), C = Z.C;
    if (!await W.aspetta(function () { return campo(F("Luca")); }, 6000)) no("Luca non ha il campo");
    await PN.scrivi(F("Luca"), "Limonata");
    if (!await W.aspetta(function () { return (vm(C).scritto || {})[giocatore(C, "Luca").id]; }, 4000)) no("la risposta di Luca non arriva");
    // Luca ricarica: ritrova la sua risposta
    var L = await W.ricarica("Luca");
    if (!await W.aspetta(function () { return /✅ «Limonata»/.test(T(F("Luca"))); }, 8000)) no("Luca dopo la ricarica non ritrova «✅ «Limonata»» («" + T(F("Luca")).slice(0, 140) + "»)");
    // Sara arriva tardi, Dina guarda
    var S = await W.apriTel("Sara", { hash: "gioco=pecoranera&stanza=" + C, x: 555, prima: prima() });
    var D = await W.apriTel("Dina", { hash: "gioco=pecoranera&stanza=" + C + "&guarda=1", x: 740, prima: prima() });
    if (!await W.aspetta(function () { return (vm(C).prossimi || []).some(function (p) { return p.nome === "Sara"; }); }, 8000)) no("Sara non è tra chi entra alla prossima");
    if (!await W.aspetta(function () { return /Entri dalla prossima/.test(T(F("Sara"))); }, 6000)) no("Sara non legge «Entri dalla prossima» («" + T(F("Sara")).slice(0, 140) + "»)");
    if (campo(F("Sara"))) no("Sara ha il campo per scrivere prima del suo turno");
    if (!await W.aspetta(function () { return /Gli altri scrivono|Guardi/.test(T(F("Dina"))); }, 6000)) no("Dina non vede la partita («" + T(F("Dina")).slice(0, 140) + "»)");
    if (campo(F("Dina"))) no("Dina (guarda) ha il campo per scrivere");
    if (giocatore(C, "Dina")) no("Dina è tra i giocatori");
    if (!F("Dina").document.querySelector(".sg-guardo")) no("Dina non ha la targhetta del core");
    await PN.domanda(C, { Paky: "tè freddo", Giulia: "te freddo" });
    if (F("Dina").document.querySelector(".pn-g.tocca")) no("Dina può toccare le carte dei gruppi");
    await PN.avanti(C);
    var sa = giocatore(C, "Sara");
    if (!sa) no("Sara non entra alla seconda domanda");
    if (sa.punti !== 0) no("Sara entra con " + sa.punti + " punti");
    if (!await W.aspetta(function () { return campo(F("Sara")); }, 6000)) no("Sara alla seconda domanda non ha il campo");
    var pt = punti(C);
    if (pt.Paky !== 2 || pt.Giulia !== 2 || pt.Luca !== 0) no("punti dopo la prima: " + JSON.stringify(pt));
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "Luca ritrova la risposta; Sara entra alla 2ª con 0; Dina guarda senza tasti; punti " + JSON.stringify(pt);
  } });

  COPIONE.aggiungi("pn3", { nome: "Pecora Nera: l'host ricarica mentre si scrive e sui gruppi, punti una volta sola", fai: async function () {
    var r = await A.provaRipresa({ gioco: "pecoranera", nomeTessera: "Pecora Nera", prima: prima(), amici: ["Giulia", "Luca"],
      fase: function (v) { return v.fase === "gioco" && v.passo === "scrivi"; },
      prepara: async function (C) {
        await PN.scrivi(F("Giulia"), "Aranciata");
        if (!await W.aspetta(function () { return Object.keys(vm(C).scritto || {}).length === 1; }, 4000)) no("la risposta di Giulia non arriva");
      },
      controlla: function (a, b) { return b.n === a.n ? true : "la domanda era la " + a.n + " e ora è la " + b.n; } });
    var C = r.C;
    // dopo il respiro si riscrive la stessa domanda e la risposta di Giulia c'è ancora
    if (!await W.aspetta(function () { return vm(C).passo === "scrivi"; }, 15000)) no("dopo il respiro non si riscrive (" + vm(C).passo + ")");
    var idG = giocatore(C, "Giulia").id;
    if (!(vm(C).scritto || {})[idG]) no("dopo la ricarica la risposta di Giulia è persa");
    if (!await W.aspetta(function () { return /✅ «Aranciata»/.test(T(F("Giulia"))); }, 4000)) no("Giulia non vede più la sua risposta («" + T(F("Giulia")).slice(0, 120) + "»)");
    await PN.scrivi(F("Paky"), "aranciata"); await PN.scrivi(F("Luca"), "Coca");
    if (!await W.aspetta(function () { return vm(C).passo === "gruppi"; }, 20000)) no("non si arriva ai gruppi");
    // ricarica sui gruppi
    await W.dorme(900);
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { return vm(C).passo === "ripresa"; }, 10000)) no("dopo la seconda ricarica niente respiro");
    if (!await W.aspetta(function () { return vm(C).passo === "gruppi"; }, 20000)) no("dopo il respiro non si torna ai gruppi (" + vm(C).passo + ")");
    var pt0 = punti(C);
    if (pt0.Paky || pt0.Giulia) no("i punti sono stati dati prima di «Avanti»: " + JSON.stringify(pt0));
    await PN.avanti(C);
    var pt = punti(C);
    if (pt.Paky !== 2 || pt.Giulia !== 2 || pt.Luca !== 0) no("punti dopo la ricarica sui gruppi: " + JSON.stringify(pt));
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "ripresa in " + r.dt + " s, risposta di Giulia salva, ricarica sui gruppi senza punti doppi " + JSON.stringify(pt);
  } });

  COPIONE.aggiungi("pn4", { nome: "Pecora Nera: l'host sparisce sui gruppi, la vice porta avanti la partita fino alla fine", fai: async function () {
    var Z = await PN.stanza(["Giulia", "Luca", "Marco"]), C = Z.C;
    await PN.domanda(C, { Paky: "uno", Giulia: "1", Luca: "due", Marco: "tre" });
    await W.dorme(1500);   // (la copia ai vice)
    var idG = giocatore(C, "Giulia").id;
    A.muore("Paky");
    if (!await W.aspetta(function () { return A.chiTiene(C).h === idG; }, 25000)) no("dopo 25 s la partita non la tiene Giulia (" + JSON.stringify(A.chiTiene(C)) + ")");
    if (!await W.aspetta(function () { return vm(C).passo === "gruppi" || vm(C).passo === "scrivi"; }, 15000)) no("la vice non riparte (passo " + vm(C).passo + ")");
    if (vm(C).passo === "gruppi") await PN.avanti(C, "Giulia");
    var p1 = punti(C);
    if (p1.Giulia !== 2 && p1.Giulia !== 0) no("dopo il subentro Giulia ha " + p1.Giulia + " punti");
    var nomi = ["Giulia", "Luca", "Marco"];
    for (var d = 0; d < 12 && vm(C).fase !== "fine"; d++) {
      var r = {}; nomi.forEach(function (x) { r[x] = x === "Marco" ? "solo" + d : "noi" + d; });
      await PN.domanda(C, r);
      if (vm(C).fase === "fine") break;
      await PN.avanti(C, "Giulia");
    }
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 6000)) no("la partita non finisce con la vice");
    var cl = vm(C).classifica || [];
    if (!cl.some(function (x) { return x.nome === "Paky"; })) no("Paky non è nella classifica");
    return "la vice Giulia porta avanti fino alla fine: " + cl.map(function (x) { return x.nome + " " + x.punti; }).join(", ");
  } });

  COPIONE.aggiungi("pn5", { nome: "Pecora Nera sullo stesso telefono in 3: passaggi, rivelazione, unione, partita intera", fai: async function () {
    A.spiaTavolo && A.spiaTavolo();
    var P = await W.apriTel("Paky", { x: 0, prima: prima() });
    var tess = await W.aspetta(function () { return A.tessera(P, "Pecora Nera"); }, 6000);
    if (!tess) no("non trovo la tessera"); tess.click(); await W.dorme(500);
    var bm = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".modo-grande"), function (b) { return /Su questo telefono/.test(b.textContent); }); }, 5000);
    if (!bm) no("non c'è «Su questo telefono»"); bm.click();
    if (!await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 4000)) no("non si aggiungono gli amici");
    while (P.document.querySelectorAll(".sala-riga input").length < 3) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    var nomi = ["Paky", "Giulia", "Luca"];
    [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = nomi[k]; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    for (var k = 0; k < 6 && !campo(P) && !/Passa/.test(T(P)); k++) {
      await W.dorme(300);
      var b = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Avanti|Comincia|Gioca|Inizia|Via|▶/.test(x.textContent) && !x.disabled; });
      if (b) b.click();
    }
    var dom = 0, vinto = false;
    for (var giro = 0; giro < 400 && !vinto; giro++) {
      await W.dorme(250);
      var tx = T(P);
      if (/Fine partita/.test(tx) && !P.document.querySelector(".pn-scena")) { vinto = true; break; }
      // il passaggio del telefono
      var pass = [].find.call(P.document.querySelectorAll("button"), function (x) { return /^Sono /.test(x.textContent.trim()) && x.offsetParent; });
      if (pass) { pass.click(); continue; }
      var c = campo(P);
      if (c) {
        var chi = (P.document.querySelector(".pn-stato") || {}).textContent || "";
        var nome = (chi.match(/Scrive (\w+)/) || [])[1] || "?";
        // Giulia sempre in coppia: con Paky alle domande pari, con Luca alle dispari (così arriva prima lei)
        var conG = dom % 2 ? "Luca" : "Paky";
        c.value = nome === "Giulia" || nome === conG ? "gregge" + dom : "boh" + giro; c.dispatchEvent(new P.Event("input", { bubbles: true }));
        P.document.querySelector(".pn-invia").click();
        if (nome === "Luca") dom++;
        continue;
      }
      var vai = P.document.querySelector(".pn-vai");
      if (vai && !vai.disabled) { vai.click(); continue; }
    }
    if (!vinto && !/Fine partita/.test(T(P))) no("sullo stesso telefono la partita non finisce («" + T(P).slice(0, 160) + "»)");
    var err = (P.__err || []); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "partita intera sullo stesso telefono («" + T(P).slice(0, 120) + "»)";
  } });

  // le misure: dentro lo schermo e senza scorrere
  function misura(nome, L, H) {
    var w = F(nome);
    var f = W.document.getElementById("tel-" + nome);
    if (f) { f.style.width = L + "px"; f.style.height = H + "px"; }
    w.dispatchEvent(new w.Event("resize"));
  }
  function difetti(w) {
    var d = w.document, out = [];
    [].forEach.call(d.querySelectorAll(".pn-scena, .schermata .contenuto"), function (c) { if (c.offsetParent && c.scrollHeight > c.clientHeight + 2 && /pn-scena/.test(c.className)) out.push("scorre " + c.className + " +" + (c.scrollHeight - c.clientHeight)); });
    [].forEach.call(d.querySelectorAll(".pn-chip, .pn-domanda, .pn-g, .pn-vai, .pn-input, .pn-invia, .pn-tempo"), function (e) {
      if (!e.offsetParent) return;
      var r = e.getBoundingClientRect();
      if (r.bottom > w.innerHeight + 1 || r.right > w.innerWidth + 1 || r.top < -1 || r.left < -1) out.push("fuori " + e.className.split(" ")[0] + " «" + e.textContent.trim().slice(0, 16) + "»");
    });
    return out;
  }
  COPIONE.aggiungi("pn6", { nome: "Pecora Nera in 10 a 360x640 e 412x915: si scrive, 10 gruppi, classifica, niente scorre", fai: async function () {
    var amici = ["Giulia", "Luca", "Marco", "Sara", "Dina", "Bea", "Nino", "Ugo", "Teo"];
    var Z = await PN.stanza(amici), C = Z.C, P = Z.P, tutti = ["Paky"].concat(amici), probl = [];
    async function guarda(nome, dove) {
      for (var i = 0; i < 2; i++) {
        var LH = i ? [412, 915] : [360, 640];
        misura(nome, LH[0], LH[1]); await W.dorme(400);
        difetti(F(nome)).forEach(function (x) { probl.push(dove + " " + LH.join("x") + " " + nome + ": " + x); });
      }
    }
    if (!await W.aspetta(function () { return campo(P); }, 6000)) no("Paky non ha il campo");
    await guarda("Paky", "scrivi"); await guarda("Giulia", "scrivi");
    var LUNGHE = ["la cioccolata calda", "spremuta d'arancia", "acqua frizzante", "tè freddo alla pesca", "Coca-Cola Zero", "succo di mirtillo", "frullato di banana", "limonata fresca", "caffè shakerato", "birra ghiacciata"];
    var r = {}; tutti.forEach(function (x, i) { r[x] = LUNGHE[i]; });
    await PN.domanda(C, r);
    await guarda("Paky", "gruppi"); await guarda("Luca", "gruppi");
    if ((vm(C).gruppi || []).length !== 10) no("i gruppi sono " + (vm(C).gruppi || []).length);
    if (probl.length) no(probl.slice(0, 6).join(" | "));
    return "10 telefoni: scrivi e gruppi dentro lo schermo a 360x640 e 412x915";
  } });

  COPIONE.aggiungi("pn7", { nome: "Pecora Nera: pari al traguardo, un'altra domanda, poi vince chi ha più punti", fai: async function () {
    var Z = await PN.stanza(["Giulia", "Luca"], { prova: { durata: "normale" } }), C = Z.C;   // in 3 «normale»: traguardo 10
    if (vm(C).meta !== 10) no("in 3 «normale» il traguardo è " + vm(C).meta);
    for (var d = 0; d < 5; d++) {   // Paky e Giulia sempre uguali: 2 a testa a domanda → a 10 insieme alla 5ª
      await PN.domanda(C, { Paky: "x" + d, Giulia: "x" + d, Luca: "solo" + d });
      await PN.avanti(C);
    }
    if (vm(C).fase === "fine") no("a pari punti la partita è finita (" + JSON.stringify(punti(C)) + ")");
    if (!vm(C).pari || vm(C).pari.ids.length !== 2) no("la foto non dice la pari (" + JSON.stringify(vm(C).pari) + ")");
    if (!await W.aspetta(function () { return /Pari a 10/.test(T(F("Luca"))); }, 4000)) no("Luca non legge «⚔️ Pari a 10» («" + T(F("Luca")).slice(0, 160) + "»)");
    await PN.domanda(C, { Paky: "io", Giulia: "noi", Luca: "noi" });   // Giulia +2
    await PN.avanti(C);
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 5000)) no("dopo la domanda di spareggio la partita non finisce");
    var cl = vm(C).classifica;
    if (cl[0].nome !== "Giulia") no("vince " + cl[0].nome);
    return "pari a 10 → un'altra domanda → vince Giulia (" + cl.map(function (x) { return x.nome + " " + x.punti; }).join(", ") + ")";
  } });

  COPIONE.aggiungi("pn8", { nome: "Pecora Nera: le unioni del gioco (plurale, errore di battitura) si vedono e si separano", fai: async function () {
    var Z = await PN.stanza(["Giulia", "Luca", "Marco"]), C = Z.C, G = F("Giulia");
    await PN.domanda(C, { Paky: "Gatti", Giulia: "gatto", Luca: "Martina", Marco: "Marina" });
    var v = vm(C);
    if ((v.gruppi || []).length !== 4) no("i gruppi esatti sono " + (v.gruppi || []).length + " (dovevano essere 4)");
    if ((v.unioni || []).filter(function (u) { return u[2] === "gioco"; }).length !== 2) no("le unioni del gioco sono " + JSON.stringify(v.unioni));
    if (!await W.aspetta(function () { return (T(G).match(/unite dal gioco/g) || []).length === 2; }, 4000)) no("Giulia non vede due «unite dal gioco» («" + T(G).slice(0, 200) + "»)");
    // Giulia separa Martina e Marina
    var c = carta(G, "Martina") || carta(G, "Marina"); if (!c) no("Giulia non vede la carta di Martina");
    var sep = c.querySelector(".pn-sep"); if (!sep) no("la carta unita dal gioco non ha ✂️"); sep.click();
    if (!await W.aspetta(function () { return (vm(C).unioni || []).length === 1; }, 4000)) no("✂️ non separa l'unione del gioco");
    await PN.avanti(C);
    var pt = punti(C);
    if (pt.Paky !== 2 || pt.Giulia !== 2 || pt.Luca !== 0 || pt.Marco !== 0) no("punti: " + JSON.stringify(pt));
    return "gatti = gatto e Martina = Marina unite dal gioco; Martina/Marina separate da Giulia; punti " + JSON.stringify(pt);
  } });

  // pn9 il proprietario (IL PAPPONE) parte da solo e in due, online; da solo anche sullo stesso telefono. Gli altri no.
  COPIONE.aggiungi("pn9", { nome: "Pecora Nera: IL PAPPONE parte da solo o in due (online e stesso telefono), gli altri no", fai: async function () {
    var P = await W.apriTel("IL PAPPONE", { x: 0, prima: prima() });
    var C = await W.apriStanza(P, "Pecora Nera");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("da solo IL PAPPONE non può cominciare («" + T(P).slice(0, 120) + "»)");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && campo(P); }, 8000)) no("da solo la partita non parte");
    await PN.domanda(C, { "IL PAPPONE": "latte" });
    await PN.avanti(C, "IL PAPPONE");
    if (vm(C).n !== 2) no("da solo non si va alla seconda domanda");
    // in due: un'altra stanza con Giulia
    W.COPIONE && COPIONE.aiuti.pulisci && COPIONE.aiuti.pulisci();
    var P2 = await W.apriTel("IL PAPPONE", { x: 0, prima: prima() }), C2 = await W.apriStanza(P2, "Pecora Nera");
    await W.apriTel("Giulia", { hash: "gioco=pecoranera&stanza=" + C2, x: 185, prima: prima() });
    if (!await W.aspetta(function () { return !!giocatore(C2, "Giulia"); }, 8000)) no("Giulia non entra");
    if (!await W.aspetta(function () { return W.clicca(P2, /Comincia/); }, 5000)) no("in due IL PAPPONE non può cominciare");
    if (!await W.aspetta(function () { return vm(C2).fase === "gioco" && vm(C2).passo === "scrivi"; }, 8000)) no("in due la partita non parte");
    await PN.domanda(C2, { "IL PAPPONE": "Coca", Giulia: "coca" });
    await PN.avanti(C2, "IL PAPPONE");
    var pt = punti(C2); if (pt["IL PAPPONE"] !== 2 || pt.Giulia !== 2) no("in due i punti sono " + JSON.stringify(pt));
    // un altro account in due: non parte
    COPIONE.aiuti.pulisci();
    var L = await W.apriTel("Luca", { x: 0, prima: prima() }), C3 = await W.apriStanza(L, "Pecora Nera");
    await W.apriTel("Sara", { hash: "gioco=pecoranera&stanza=" + C3, x: 185, prima: prima() });
    if (!await W.aspetta(function () { return !!giocatore(C3, "Sara"); }, 8000)) no("Sara non entra");
    W.clicca(L, /Comincia/); await W.dorme(1500);
    if (vm(C3).fase !== "lobby") no("Luca in due ha fatto partire la partita");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "IL PAPPONE da solo e in due ok (2 punti a testa); Luca in due resta in saletta";
  } });
})();

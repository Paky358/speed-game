// PROVE DEI MIGLIORAMENTI: Scarabocchio («📝 Le nostre parole») e Nomi, Cose e Città («✋ STOP» e «⏩ Avanti» a maggioranza).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("migliora/scarabocchio-ncc.js"); await COPIONE.prova("sb1")
//
// sb1: le regole ⚙️ della saletta: si scrivono le parole del gruppo (anche "Peppe/Giuseppe"), quelle sbagliate non entrano,
//      si salvano sul profilo, le prime parole accendono «Mescolate», la ✕ ne toglie una; gli amici leggono «📝 3 parole vostre».
// sb2: partita intera online con «📝 Solo le nostre»: le 3 scelte sono tutte vostre (col 📝), vale anche l'altro modo di dirla
//      ("Giuseppe" per "Peppe", "vespa" per "la vespa di Ciro"), «📝 una parola vostra» sui punti, le parole non passano mai
//      dalla foto che vedono tutti; misure delle scelte a 360x640 e 412x915; poi «Mescolate»: una sola delle 3 è vostra.
// sb3: chi rientra: chi disegna ricarica la pagina mentre sceglie e ritrova le 3 parole col 📝; chi ha indovinato ricarica e
//      ritrova la parola.
// nc1: online in 3, ✋ STOP: «✋ STOP 0/5» spento, con una lettera sbagliata «4/5», tutte buone «✋ STOP!»; toccato: agli altri
//      restano 10 secondi (scritta grande col conto, il loro STOP sparisce), il tabellone segna «✋ STOP»; partita fino alla fine.
// nc2: STOP finto (caselle non tutte buone) = foglio consegnato e basta; regola spenta (⚙️ STOP: No) = niente tasto STOP.
// nc3: chi rientra durante i 10 secondi dello STOP ritrova il foglio col tempo corto e la scritta grande.
// nc4: 2 giri: alla classifica del giro «⏩ Avanti» col conto; uno lo tocca «1 su 3», il secondo (più di metà) si parte subito.
// nc5: sullo stesso telefono con lo STOP: chi fa STOP decide il tempo di chi scrive dopo (il suo + 10 s), «✋ STOP» al tabellone,
//      partita fino alla classifica; con lo STOP spento si gioca come prima.
// Le regole si cambiano per la prova con w.__imp (solo l'host le legge). Le liste del profilo finto stanno in BR.mem[nome].liste.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T;
  var GRUPPO = ["scarabocchio", "nomicose"];

  // ---- la spia (solo con apriTel(nome, { fintiM: true })): w.__imp = regole per la prova, w.__t = il tavolo,
  //      w.__cbH[gid] = la stanza dell'host (per mandare le sue mosse), liste del profilo che restano nella memoria del telefono ----
  if (!W.__prepMigSN) {
    W.__prepMigSN = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepMigSN(w, nome, opz);
      if (!opz || !opz.fintiM) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) { if (g && GRUPPO.indexOf(g.id) >= 0) spia(w, g); return reg.apply(this, arguments); };
      } });
      var dn = Object.getOwnPropertyDescriptor(w, "SGNube");
      Object.defineProperty(w, "SGNube", { configurable: true, get: dn.get, set: function (v) {
        dn.set(v);
        var mem = W.BR.mem[nome]; mem.liste = mem.liste || {};
        v.lista = function (n) { return (mem.liste[n] || []).slice(); };
        v.salvaLista = function (n, l) { mem.liste[n] = (l || []).slice(); W.BR.log.push("LISTA " + nome + " " + n + ": " + mem.liste[n].length); };
      } });
    };
  }
  function spia(w, g) {
    var avvia = g.avvia;
    g.avvia = function (t) {
      w.__t = t;
      if (w.__imp && t.impostazioni) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
      if (!w.__cbH) {
        w.__cbH = {};
        var osp = w.SGNet.ospita;
        w.SGNet.ospita = function (gid, cb) { w.__cbH[gid] = cb; return osp.apply(this, arguments); };
      }
      return avvia.apply(this, arguments);
    };
  }
  function nota(N, x) { N.push(x); }
  function sentinella(nomi) {
    var visti = [];
    var t = setInterval(function () { nomi.forEach(function (n) { var w = W.finestra(n); if (!w || !w.document || !w.document.body) return; var m = W.testo(w).match(/Problema di collegamento|Collegamento perso|Ops|La stanza è chiusa|non risponde|è ferma|stanza è piena/); if (m && visti.indexOf(n + ": " + m[0]) < 0) visti.push(n + ": " + m[0]); }); }, 80);
    return { stop: function () { clearInterval(t); return visti; } };
  }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function nomeDiId(id, nomi) { for (var i = 0; i < nomi.length; i++) if (idDi(nomi[i]) === id) return nomi[i]; return null; }
  function tocca(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click();
  }
  function scrivi(w, inp, testo) { inp.value = testo; inp.dispatchEvent(new w.Event("input", { bubbles: true })); inp.dispatchEvent(new w.Event("change", { bubbles: true })); }
  // le misure: niente scorre e i nodi scelti stanno dentro lo schermo
  async function misura(nome, sel, cosa) {
    var w = W.finestra(nome), f = document.getElementById("tel-" + nome), d = w.document, M = [[360, 640], [412, 915]], fatte = [];
    // (con la finestra del browser nascosta le transizioni restano ferme a metà: per misurare si tolgono)
    var st = d.createElement("style"); st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}"; d.head.appendChild(st);
    try {
    for (var k = 0; k < M.length; k++) {
      f.style.width = M[k][0] + "px"; f.style.height = M[k][1] + "px";
      void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
      await W.dorme(450);
      if (d.documentElement.scrollHeight > M[k][1] + 1) no(nome + " a " + M[k].join("x") + ": " + cosa + " scorre (" + d.documentElement.scrollHeight + " px)");
      [].forEach.call(d.querySelectorAll(sel), function (b) {
        if (!b.offsetParent) return;
        var r = b.getBoundingClientRect();
        if (r.bottom > M[k][1] + 1 || r.right > M[k][0] + 1 || r.left < -1) no(nome + " a " + M[k].join("x") + ": «" + b.textContent.trim().slice(0, 30) + "» esce dallo schermo");
        if (b.scrollWidth > b.clientWidth + 2) no(nome + " a " + M[k].join("x") + ": «" + b.textContent.trim().slice(0, 30) + "» non ci sta");
      });
      fatte.push(M[k].join("x"));
    }
    } finally {
      if (st.parentNode) st.parentNode.removeChild(st);
      f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    }
    return fatte.join(" e ");
  }

  // =========================================================
  //  SCARABOCCHIO
  // =========================================================
  var NOSTRE = { "Peppe": "Giuseppe", "la vespa di Ciro": "vespa", "Ibiza": "Ibizza" };
  // apre la stanza (percorso di prima) con le parole già sul profilo di Paky; entrano Luca e Giulia
  async function stanzaScara(liste, imp, amici) {
    var P = await W.apriTel("Paky", { x: 0, fintiM: true, prima: function (w) { w.__imp = imp || null; } });
    if (liste) W.BR.mem.Paky.liste = { scarabocchio: liste.slice() };
    var C = await W.apriStanza(P, "Scarabocchio");
    amici = amici || ["Luca", "Giulia"];
    for (var i = 0; i < amici.length; i++) {
      await W.apriTel(amici[i], { hash: "gioco=scarabocchio&stanza=" + C, x: 185 * (i + 1), fintiM: true });
      var n = amici[i];
      if (!await W.aspetta(function () { return (vm(C).players || []).some(function (p) { return p.nome === n; }); }, 8000)) no(n + " non entra nella stanza");
    }
    return { P: P, C: C, nomi: ["Paky"].concat(amici) };
  }
  // la foglia "⚙️ Regole" della saletta dell'host
  async function apriRegole(P) {
    if (!await W.aspetta(function () { return W.clicca(P, /⚙️ Regole/); }, 4000)) no("nella saletta non c'è «⚙️ Regole» (" + (P.document.querySelector(".sl-velo") ? "regole ancora aperte" : T(P).slice(0, 120)) + ")");
    var inp = await W.aspetta(function () { return P.document.querySelector(".sl-velo .sb-agg input"); }, 3000);
    if (!inp) no("nelle regole non c'è il campo delle «Le nostre parole»");
    return inp;
  }
  function chiudiRegole(P) { if (!W.clicca(P, /✅ Fatto/, ".sl-velo button")) no("non trovo «✅ Fatto» nelle regole"); }
  // una partita fino alla fine: chi disegna sceglie la prima parola, gli altri scrivono l'altro modo di dirla (se c'è)
  async function giocaScara(X, controllo) {
    var C = X.C, fino = Date.now() + 160000, parola = {}, detto = {}, scelte = {};
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), chi = nomeDiId(v.disegnatore, X.nomi);
      if (v.fase === "scelta" && chi && !parola[v.turno]) {
        var bb = W.finestra(chi).document.querySelectorAll(".sb-scelte button");
        if (bb.length === 3) {
          scelte[v.turno] = [].map.call(bb, function (b) { return { w: b.firstChild.textContent, nostra: b.classList.contains("nostra"), segno: !!b.querySelector(".sb-nostra") }; });
          if (controllo) controllo(v, scelte[v.turno], chi);
          parola[v.turno] = scelte[v.turno][0].w; tocca(W.finestra(chi), bb[0]);
        }
      }
      if (v.fase === "disegno" && parola[v.turno]) {
        var vj = JSON.stringify(v);
        (scelte[v.turno] || []).forEach(function (s) { if (vj.indexOf(s.w) >= 0 && !(X.svelate || {})[s.w]) no("la parola «" + s.w + "» è nella foto che vedono tutti mentre si disegna"); });
        X.nomi.forEach(function (n) {
          if (n === chi || detto[v.turno + n]) return;
          detto[v.turno + n] = 1;
          var x = NOSTRE[parola[v.turno]] || parola[v.turno];   // l'altro modo di dirla
          if (n === "Paky") { var w = W.finestra(n), inp = w.document.querySelector(".sb-inp"), f = w.document.querySelector(".sb-scrivi"); if (inp && f) { inp.value = x; f.dispatchEvent(new w.Event("submit", { cancelable: true, bubbles: true })); } }
          else W.reteDi(n).invia({ t: "prova", x: x });
        });
      }
      if (v.fase === "punti" && v.ultimo) {
        X.svelate = X.svelate || {}; X.svelate[v.ultimo.parola] = 1;
        X.ultimi = X.ultimi || {}; X.ultimi[v.turno] = v.ultimo;
      }
      await W.dorme(250);
    }
    if (vm(C).fase !== "fine") no("lo Scarabocchio non arriva alla classifica (fase " + vm(C).fase + ")");
    return { scelte: scelte, ultimi: X.ultimi || {} };
  }

  COPIONE.aggiungi("sb1", { nome: "Scarabocchio: «📝 Le nostre parole» nelle regole della saletta (scrivere, salvare, togliere)", fai: async function () {
    var N = [], X = await stanzaScara(null, null, ["Luca"]), P = X.P, C = X.C, L = W.finestra("Luca");
    if (vm(C).nostre) no("senza parole la stanza dice già " + vm(C).nostre + " parole vostre");
    var inp = await apriRegole(P);
    scrivi(P, inp, "Peppe/Giuseppe, la vespa di Ciro, x1!, Ibiza, peppe");
    W.clicca(P, /➕ Aggiungi/, ".sl-velo button");
    await W.dorme(200);
    var lista = (W.BR.mem.Paky.liste || {}).scarabocchio || [];
    if (lista.length !== 3) no("sul profilo ci sono " + lista.length + " parole invece di 3 (" + lista.join(", ") + ")");
    if (lista[0] !== "Peppe/Giuseppe") no("«Peppe/Giuseppe» salvata come «" + lista[0] + "»");
    var esN = P.document.querySelector(".sl-velo .sb-esito"), esito = esN ? esN.textContent : "";
    if (!/Aggiunte: 3/.test(esito) || !/x1!/.test(esito)) no("l'esito non dice le 3 aggiunte e «x1!» scartata («" + esito + "»)");
    var mix = [].find.call(P.document.querySelectorAll(".sl-velo .modo-chip"), function (b) { return /Mescolate/.test(b.textContent); });
    if (!mix || !mix.classList.contains("attiva")) no("con le prime parole «🔀 Mescolate» non si accende");
    nota(N, "3 parole salvate (doppione e «x1!» scartati), «Mescolate» acceso da solo");
    // la ✕ ne toglie una
    var x = P.document.querySelector(".sl-velo .sb-x"); x.click(); await W.dorme(150);
    if ((W.BR.mem.Paky.liste.scarabocchio || []).length !== 2) no("la ✕ non toglie la parola dal profilo");
    scrivi(P, P.document.querySelector(".sl-velo .sb-agg input"), "Peppe/Giuseppe");
    P.document.querySelector(".sl-velo .sb-agg input").dispatchEvent(new P.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await W.dorme(150);
    if ((W.BR.mem.Paky.liste.scarabocchio || []).length !== 3) no("con Invio la parola non si aggiunge");
    // la foglia non deve uscire dallo schermo di lato (parole lunghe)
    var velo = P.document.querySelector(".sl-velo .sl-foglio");
    if (velo && velo.scrollWidth > velo.clientWidth + 2) no("la foglia delle regole è più larga dello schermo");
    chiudiRegole(P);
    if (!await W.aspetta(function () { return vm(C).nostre === 3 && vm(C).nostreModo === "mix"; }, 3000)) no("la stanza non sa delle 3 parole vostre (" + vm(C).nostre + ", " + vm(C).nostreModo + ")");
    if (/Peppe|vespa|Ibiza/.test(JSON.stringify(vm(C)))) no("le parole vostre sono nella foto che vedono tutti");
    if (!await W.aspetta(function () { return /3 parole vostre \(mescolate\)/.test(T(L)); }, 4000)) no("Luca non legge «📝 3 parole vostre (mescolate)» («" + T(L).slice(0, 160) + "»)");
    var rr = await W.aspetta(function () { var x = A.regoleDi(L); return /3 parole vostre/.test(x) ? x : null; }, 5000) || A.regoleDi(L);
    if (!/3 parole vostre/.test(rr)) no("la riga «📜 Si gioca così» di Luca non dice le parole vostre («" + rr + "»)");
    nota(N, "Luca legge «" + rr + "»");
    // «🗑️ Cancella tutte»: chiede prima con la finestra al centro dell'app (mai quella del browser); «Resta» non cancella
    await W.aspetta(function () { return !P.document.querySelector(".sl-velo"); }, 3000);
    await W.dorme(300);
    await apriRegole(P);
    // (i telefoni finti dicono «sì» da soli alle conferme: qui si ferma, se no «Resta» e il tasto rosso fanno a gara; pulisci() lo rimette)
    clearInterval(W.__autoConferma); W.__autoConferma = null; W.__siFermo = true;
    if (!W.clicca(P, /Cancella tutte/, ".sl-velo button")) no("non trovo «🗑️ Cancella tutte»");
    var cf = await W.aspetta(function () { return P.document.querySelector(".conferma-sfondo"); }, 2000);
    if (!cf) no("«Cancella tutte» non chiede conferma con la finestra al centro");
    W.clicca(P, /^Resta$/, ".conferma-sfondo button"); await W.dorme(150);
    if ((W.BR.mem.Paky.liste.scarabocchio || []).length !== 3) no("con «Resta» le parole si sono cancellate");
    W.clicca(P, /Cancella tutte/, ".sl-velo button");
    var si = await W.aspetta(function () { var b = P.document.querySelector(".conferma-sfondo .btn-rosso"); return b && !b.disabled ? b : null; }, 4000);
    if (!si) no("il tasto «🗑️ Cancella» della conferma non si accende");
    si.click(); await W.dorme(150);
    if ((W.BR.mem.Paky.liste.scarabocchio || []).length !== 0) no("dopo la conferma le parole sono ancora sul profilo");
    if (P.document.querySelector(".sl-velo .sb-pw")) no("dopo la conferma le parole si vedono ancora nella lista");
    chiudiRegole(P);
    nota(N, "«🗑️ Cancella tutte» chiede conferma al centro («Resta» non cancella)");
    return N.join(" · ");
  } });

  COPIONE.aggiungi("sb2", { nome: "Scarabocchio: partita con «📝 Solo le nostre» e poi «Mescolate» (sinonimi, 📝, niente parole nella foto)", fai: async function () {
    var N = [], sent = sentinella(["Paky", "Luca", "Giulia"]);
    var X = await stanzaScara(["Peppe/Giuseppe", "la vespa di Ciro/vespa", "Ibiza/Ibizza"], { giri: 1, nostreModo: "solo" });
    var P = X.P, C = X.C;
    if (vm(C).nostreModo !== "solo" || vm(C).nostre !== 3) no("la stanza non è «solo le nostre» con 3 parole (" + vm(C).nostreModo + ", " + vm(C).nostre + ")");
    W.clicca(P, /Comincia/);
    var misurato = false, misure = "";
    var r = await giocaScara(X, function (v, sc, chi) {
      if (sc.some(function (s) { return !s.nostra || !s.segno || !NOSTRE.hasOwnProperty(s.w); })) no("con «Solo le nostre» a " + chi + " escono scelte non vostre: " + sc.map(function (s) { return s.w + (s.nostra ? "📝" : ""); }).join(", "));
      if (!misurato) { misurato = chi; }
    });
    var ok = Object.keys(r.ultimi).map(function (k) { return r.ultimi[k]; });
    if (ok.length < 3) no("turni con i punti: " + ok.length);
    ok.forEach(function (u) {
      if (!u.nostra) no("ai punti la parola «" + u.parola + "» non è segnata come vostra");
      if ((u.righe || []).filter(function (x) { return !x.dis; }).length < 2) no("«" + u.parola + "»: l'altro modo di dirla (" + NOSTRE[u.parola] + ") non vale (" + JSON.stringify(u.righe) + ")");
    });
    nota(N, "3 turni, tutte vostre, indovinate con «Giuseppe», «vespa», «Ibizza»");
    // la classifica arriva a tutti
    if (!await W.aspetta(function () { return /Classifica finale/.test(T(W.finestra("Luca"))); }, 6000)) no("Luca non vede la classifica");
    // 2ª partita: «Mescolate» (cambiate dall'host nelle regole: onRegole) → una sola delle 3 è vostra
    W.clicca(P, /Nuova partita|Rivincita/);
    if (!await W.aspetta(function () { return vm(C).fase === "lobby"; }, 6000)) no("non si torna nella saletta");
    P.__t.onRegole({ secondi: 80, giri: 1, difficili: false, nostre: ["Peppe/Giuseppe", "la vespa di Ciro/vespa", "Ibiza/Ibizza"], nostreModo: "mix" });
    if (!await W.aspetta(function () { return vm(C).nostreModo === "mix"; }, 3000)) no("le regole cambiate non arrivano («mix»)");
    await W.aspetta(function () { return X.nomi.every(function (n) { return n === "Paky" || A.dentro(W.finestra(n)); }); }, 5000);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "scelta"; }, 6000)) no("la 2ª partita non comincia");
    // misure delle 3 scelte (parole lunghe) a 360x640 e 412x915 sul telefono di chi disegna
    var chi = nomeDiId(vm(C).disegnatore, X.nomi);
    await W.aspetta(function () { return W.finestra(chi).document.querySelectorAll(".sb-scelte button").length === 3; }, 4000);
    misure = await misura(chi, ".sb-scelte button, .sb-righe", "la scelta della parola");
    var r2 = await giocaScara(X, function (v, sc, chi2) {
      var n = sc.filter(function (s) { return s.nostra; }).length;
      if (n !== 1) no("con «Mescolate» le scelte vostre sono " + n + " invece di 1 (" + sc.map(function (s) { return s.w + (s.nostra ? "📝" : ""); }).join(", ") + ")");
    });
    nota(N, "«Mescolate»: " + Object.keys(r2.scelte).length + " turni con una sola scelta 📝; scelte a misura a " + misure);
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    return N.join(" · ");
  } });

  COPIONE.aggiungi("sb3", { nome: "Scarabocchio: chi rientra ritrova le 3 scelte col 📝 (e la parola, se l'ha indovinata)", fai: async function () {
    var N = [], X = await stanzaScara(["Peppe/Giuseppe", "la vespa di Ciro/vespa", "Ibiza/Ibizza"], { giri: 1, nostreModo: "solo" });
    var P = X.P, C = X.C;
    W.clicca(P, /Comincia/);
    // aspetto un turno in cui disegna un amico
    var fino = Date.now() + 90000, fatto1 = false, fatto2 = false, detto = {};
    while (Date.now() < fino && vm(C).fase !== "fine" && !(fatto1 && fatto2)) {
      var v = vm(C), chi = nomeDiId(v.disegnatore, X.nomi);
      if (v.fase === "scelta" && chi && chi !== "Paky" && !fatto1) {
        await W.aspetta(function () { return W.finestra(chi).document.querySelectorAll(".sb-scelte button").length === 3; }, 4000);
        await W.ricarica(chi);
        var ok = await W.aspetta(function () { var bb = W.finestra(chi).document.querySelectorAll(".sb-scelte button.nostra .sb-nostra"); return bb.length === 3; }, 8000);
        if (!ok && vm(C).fase === "scelta") no(chi + " ha ricaricato mentre sceglieva e non ritrova le 3 scelte col 📝 («" + T(W.finestra(chi)).slice(0, 80) + "»)");
        if (ok) { fatto1 = true; nota(N, chi + " ricarica mentre sceglie: ritrova le 3 scelte col 📝"); tocca(W.finestra(chi), W.finestra(chi).document.querySelector(".sb-scelte button")); }
      }
      v = vm(C); chi = nomeDiId(v.disegnatore, X.nomi);
      if (v.fase === "disegno" && !fatto2) {
        var altro = X.nomi.filter(function (n) { return n !== chi && n !== "Paky"; })[0];
        var w0 = W.finestra(chi).document.querySelector(".sb-centro b");
        var parola = w0 ? w0.textContent : null;
        if (altro && parola && !detto[v.turno]) {
          detto[v.turno] = 1;
          W.reteDi(altro).invia({ t: "prova", x: NOSTRE[parola] || parola });
          if (await W.aspetta(function () { return (vm(C).players || []).some(function (p) { return p.nome === altro && p.ok; }); }, 4000)) {
            await W.ricarica(altro);
            var vista = await W.aspetta(function () { var b = W.finestra(altro).document.querySelector(".sb-centro b"); return b && b.textContent === parola; }, 8000);
            if (!vista && vm(C).fase === "disegno") no(altro + " ha indovinato, ha ricaricato e non vede più la parola");
            if (vista) { fatto2 = true; nota(N, altro + " indovina, ricarica e rivede «" + parola + "»"); }
          }
        }
      }
      // (per non aspettare tutto il tempo: gli altri indovinano e il turno finisce)
      v = vm(C); chi = nomeDiId(v.disegnatore, X.nomi);
      if (v.fase === "disegno" && !detto["tutti" + v.turno]) {
        var wd = W.finestra(chi).document.querySelector(".sb-centro b"), pd = wd ? wd.textContent : null;
        if (pd) {
          detto["tutti" + v.turno] = 1;
          X.nomi.forEach(function (n) {
            if (n === chi) return;
            if (n === "Paky") { var wp = W.finestra(n), ip = wp.document.querySelector(".sb-inp"), fp = wp.document.querySelector(".sb-scrivi"); if (ip && fp) { ip.value = NOSTRE[pd] || pd; fp.dispatchEvent(new wp.Event("submit", { cancelable: true, bubbles: true })); } }
            else { var h = W.reteDi(n); if (h) h.invia({ t: "prova", x: NOSTRE[pd] || pd }); }
          });
        }
      }
      await W.dorme(250);
    }
    if (!fatto1) no("non sono riuscito a provare chi disegna e ricarica");
    if (!fatto2) no("non sono riuscito a provare chi ha indovinato e ricarica");
    return N.join(" · ");
  } });

  // =========================================================
  //  NOMI, COSE E CITTÀ
  // =========================================================
  async function stanzaNcc(imp, amici) {
    var P = await W.apriTel("Paky", { x: 0, fintiM: true, prima: function (w) { w.__imp = imp || null; } });
    var C = await W.apriStanza(P, "Nomi, Cose e Città");
    amici = amici || ["Luca", "Giulia"];
    for (var i = 0; i < amici.length; i++) {
      await W.apriTel(amici[i], { hash: "gioco=nomicose&stanza=" + C, x: 185 * (i + 1), fintiM: true });
      var n = amici[i];
      if (!await W.aspetta(function () { return (vm(C).players || []).some(function (p) { return p.nome === n; }); }, 8000)) no(n + " non entra nella stanza");
    }
    return { P: P, C: C, nomi: ["Paky"].concat(amici) };
  }
  function foglio(w) { var f = w.document.querySelector(".nc-foglio.on:not(.via)"); return f ? [].slice.call(f.querySelectorAll("input")) : []; }
  function tastoStop(w) { return w.document.querySelector(".st-barra .nc-stop-btn"); }
  async function aspettaFoglio(nome, ms) { return W.aspetta(function () { var c = foglio(W.finestra(nome)); return c.length ? c : null; }, ms || 20000); }
  // tutti votano "fatto" a ogni categoria del tabellone finché la partita (o il giro) finisce
  async function votaTutto(X, finoA) {
    var C = X.C, fino = Date.now() + 120000, fatti = {};
    while (Date.now() < fino && !finoA(vm(C))) {
      var v = vm(C);
      if (v.fase === "tabellone") (v.players || []).forEach(function (p) {
        if (p.via || (v.pronti || []).indexOf(p.id) >= 0) return;
        var k = v.giro + "|" + v.ci + "|" + p.id; if (fatti[k]) return; fatti[k] = 1;
        if (p.id === "host") X.P.__cbH.nomicose.onMsg("host", { t: "pronto", ci: v.ci });
        else { var n = nomeDiId(p.id, X.nomi); if (n) W.reteDi(n).invia({ t: "pronto", ci: v.ci }); }
      });
      await W.dorme(300);
    }
  }

  COPIONE.aggiungi("nc1", { nome: "Nomi Cose Città online: ✋ STOP (tasto che si accende, 10 secondi agli altri, scritta grande, tabellone)", fai: async function () {
    var N = [], sent = sentinella(["Paky", "Luca", "Giulia"]);
    var X = await stanzaNcc({ round: 1, secondi: 120 }), P = X.P, C = X.C, L = W.finestra("Luca"), G = W.finestra("Giulia");
    if (!vm(C).stopAcceso) no("lo STOP non è acceso di partenza");
    if (!/STOP/.test(T(L))) no("nella saletta Luca non legge che c'è lo STOP («" + T(L).slice(0, 120) + "»)");
    W.clicca(P, /Via ▶|Comincia/);
    var campi = await aspettaFoglio("Luca", 45000);
    if (!campi) no("a Luca non si apre il foglio");
    var lett = vm(C).lettera, cats = vm(C).cats.length;
    var b = await W.aspetta(function () { return tastoStop(L); }, 3000);
    if (!b || !b.disabled || b.textContent.indexOf("0/" + cats) < 0) no("all'inizio lo STOP non è «✋ STOP 0/" + cats + "» spento («" + (b ? b.textContent : "nessuno") + "»)");
    // tutte buone tranne l'ultima (lettera sbagliata)
    var sbagliata = lett === "Z" ? "Albero" : "Zorro";
    campi.forEach(function (inp, k) { scrivi(L, inp, k === campi.length - 1 ? sbagliata : lett + "ondra" + k); });
    await W.dorme(150);
    b = tastoStop(L);
    if (!b || !b.disabled || b.textContent.indexOf((cats - 1) + "/" + cats) < 0) no("con una lettera sbagliata non c'è «✋ STOP " + (cats - 1) + "/" + cats + "» spento («" + (b ? b.textContent : "nessuno") + "»)");
    scrivi(L, campi[campi.length - 1], "il " + lett + "ondra");   // con l'articolo vale lo stesso
    await W.dorme(150);
    b = tastoStop(L);
    if (!b || b.disabled || !/✋ STOP!/.test(b.textContent) || !b.classList.contains("grande")) no("con tutte le caselle buone non c'è «✋ STOP!» acceso («" + (b ? b.textContent : "nessuno") + "»)");
    if (W.clicca(L, /Ho finito/, ".st-barra button")) no("con lo STOP acceso c'è ancora «Ho finito»");
    nota(N, "«✋ STOP 0/" + cats + "» → «" + (cats - 1) + "/" + cats + "» → «✋ STOP!»");
    // Paky e Giulia scrivono qualcosa
    var cP = await aspettaFoglio("Paky", 15000), cG = await aspettaFoglio("Giulia", 15000);
    if (!cP || !cG) no("a Paky o Giulia non si è aperto il foglio");
    scrivi(P, cP[0], lett + "aky"); scrivi(G, cG[0], lett + "iulia");
    var t0 = Date.now();
    tocca(L, tastoStop(L));
    if (!await W.aspetta(function () { return vm(C).stopDi === idDi("Luca"); }, 4000)) no("l'host non sa dello STOP di Luca");
    var rim = vm(C).rimMs;
    if (!(rim <= 10500 && rim > 3000)) no("dopo lo STOP restano " + rim + " ms invece di circa 10 secondi");
    // gli altri: scritta grande col conto, niente più tasto STOP, foglio ancora aperto
    var cart = await W.aspetta(function () { var c = G.document.querySelector(".nc-stop"); return c && /STOP di Luca/.test(c.textContent) ? c : null; }, 3000);
    if (!cart) no("Giulia non vede «✋ STOP di Luca!»");
    var num = +((cart.querySelector(".nc-stop-n") || {}).textContent);
    if (!(num >= 3 && num <= 10)) no("il conto della scritta di Giulia dice " + num);
    if (!P.document.querySelector(".nc-stop")) no("Paky non vede la scritta dello STOP");
    if (tastoStop(P)) no("dopo lo STOP di Luca, Paky ha ancora il tasto STOP");
    if (!foglio(G).length) no("dopo lo STOP il foglio di Giulia si è chiuso subito");
    if (!L.document.querySelector(".nc-stop") || !/Hai fatto STOP/.test(L.document.querySelector(".nc-stop").textContent)) no("Luca non vede «✋ Hai fatto STOP!»");
    // la scritta non copre la lettera del foglio
    var lt = G.document.querySelector(".nc-foglio .nc-lett"), rc = cart.getBoundingClientRect(), rl = lt && lt.getBoundingClientRect();
    if (rl && rl.top < rc.bottom && rl.bottom > rc.top && rl.left < rc.right && rl.right > rc.left) no("la scritta dello STOP copre la lettera del foglio di Giulia");
    nota(N, "STOP di Luca: restano " + Math.round(rim / 1000) + " s, scritta col conto a Paky e Giulia, il loro STOP sparisce");
    // dopo i 10 secondi il tabellone, con «✋ STOP» accanto a Luca
    if (!await W.aspetta(function () { return vm(C).fase === "tabellone"; }, 16000)) no("dopo lo STOP non si va al tabellone (fase " + vm(C).fase + ")");
    var dur = Date.now() - t0;
    if (dur > 15500) no("dal tocco dello STOP al tabellone " + dur + " ms");
    var tab = (vm(C).tab || []).filter(function (x) { return x.id === idDi("Giulia"); })[0];
    if (!tab || tab.parola !== lett + "iulia") no("la parola scritta da Giulia prima dello STOP non c'è al tabellone (" + JSON.stringify(tab) + ")");
    if (!await W.aspetta(function () { return /Luca · ✋ STOP/.test(T(P)); }, 6000)) no("al tabellone di Paky non c'è «Luca · ✋ STOP»");
    nota(N, "tabellone dopo " + Math.round(dur / 1000) + " s, Luca segnato «✋ STOP», vale la parola di Giulia scritta prima");
    await votaTutto(X, function (v) { return v.fase === "fine"; });
    if (vm(C).fase !== "fine") no("la partita non arriva alla fine");
    var luca = (vm(C).players || []).filter(function (p) { return p.nome === "Luca"; })[0];
    nota(N, "fine partita (Luca " + (luca ? luca.punti : "?") + " punti)");
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    return N.join(" · ");
  } });

  COPIONE.aggiungi("nc2", { nome: "Nomi Cose Città online: STOP finto = foglio consegnato; ⚙️ STOP spento = niente tasto", fai: async function () {
    var N = [], X = await stanzaNcc({ round: 1, secondi: 60 }, ["Luca"]), P = X.P, C = X.C;
    W.clicca(P, /Via ▶|Comincia/);
    await aspettaFoglio("Luca", 45000);
    W.reteDi("Luca").invia({ t: "stop", r: ["Abc"] });
    if (!await W.aspetta(function () { return (vm(C).fatti || []).indexOf(idDi("Luca")) >= 0; }, 3000)) no("lo STOP finto di Luca non vale nemmeno come foglio consegnato");
    if (vm(C).stopDi) no("con le caselle non tutte buone lo STOP vale lo stesso");
    if (vm(C).rimMs < 30000) no("con uno STOP finto il tempo si è accorciato (" + vm(C).rimMs + ")");
    nota(N, "STOP con le caselle vuote: foglio consegnato, tempo intatto");
    // regola spenta: il tasto non c'è
    A.pulisci();
    X = await stanzaNcc({ round: 1, secondi: 60, stop: false }, ["Luca"]); P = X.P; C = X.C;
    if (vm(C).stopAcceso) no("con ⚙️ STOP: No la stanza ha lo STOP acceso");
    W.clicca(P, /Via ▶|Comincia/);
    var c = await aspettaFoglio("Luca", 45000), L = W.finestra("Luca"), lett = vm(C).lettera;
    c.forEach(function (inp, k) { scrivi(L, inp, lett + "x" + k); });
    await W.dorme(200);
    if (tastoStop(L)) no("con lo STOP spento Luca ha il tasto STOP");
    if (!W.clicca(L, /Ho finito/, ".st-barra button")) no("con lo STOP spento non c'è «Ho finito»");
    W.reteDi("Luca").invia({ t: "stop", r: c.map(function (_, k) { return lett + "x" + k; }) });
    await W.dorme(400);
    if (vm(C).stopDi) no("con lo STOP spento uno STOP mandato a mano vale");
    nota(N, "⚙️ STOP spento: niente tasto, «Ho finito» come prima");
    // il riassunto delle regole e le impostazioni (box fuori dalla pagina)
    var src = await (await fetch("/js/games/nomicoseecitta.js?" + Date.now())).text(), g = null, reg = P.SG.registra;
    P.SG.registra = function (x) { g = x; }; P.eval(src); P.SG.registra = reg;
    var box = P.document.createElement("div"), imp = {};
    g.impostazioni(box, imp, { el: P.__t.el, sala: true, modo: "online", giocatori: ["Paky", "Luca"] });
    if (imp.stop !== true) no("nelle impostazioni lo STOP non parte acceso");
    var bNo = [].find.call(box.querySelectorAll(".modo-chip"), function (b) { return b.textContent.trim() === "No" && /STOP/.test((b.parentNode.previousElementSibling || {}).textContent || ""); });
    if (!bNo) no("non trovo «No» dello STOP nelle impostazioni"); bNo.click();
    if (imp.stop !== false) no("toccato «No» lo STOP non si spegne");
    nota(N, "impostazioni: STOP Sì di partenza, «No» lo spegne");
    return N.join(" · ");
  } });

  COPIONE.aggiungi("nc3", { nome: "Nomi Cose Città online: chi ricarica durante i 10 secondi dello STOP ritrova il foglio col tempo corto", fai: async function () {
    var N = [], X = await stanzaNcc({ round: 1, secondi: 120 }), P = X.P, C = X.C, L = W.finestra("Luca");
    W.clicca(P, /Via ▶|Comincia/);
    var c = await aspettaFoglio("Luca", 45000), cG = await aspettaFoglio("Giulia", 15000), lett = vm(C).lettera;
    scrivi(W.finestra("Giulia"), cG[0], lett + "iulia");
    await W.dorme(2300);   // (la bozza parte dopo 2 secondi)
    c.forEach(function (inp, k) { scrivi(L, inp, lett + "uca" + k); });
    await W.dorme(150);
    tocca(L, tastoStop(L));
    if (!await W.aspetta(function () { return vm(C).stopDi === idDi("Luca"); }, 4000)) no("lo STOP di Luca non arriva");
    await W.ricarica("Giulia");
    var G = W.finestra("Giulia");
    var ok = await W.aspetta(function () { return foglio(G).length && G.document.querySelector(".nc-stop"); }, 8000);
    if (!ok && vm(C).fase === "scrittura") no("Giulia ricarica dopo lo STOP e non ritrova il foglio con la scritta («" + T(G).slice(0, 100) + "»)");
    if (ok) {
      var v0 = foglio(G)[0].value;
      if (v0 !== lett + "iulia") no("dopo la ricarica il foglio di Giulia non ha la sua parola («" + v0 + "»)");
      var num = +((G.document.querySelector(".nc-stop-n") || {}).textContent);
      if (!(num > 0 && num <= 10)) no("dopo la ricarica il conto dice " + num);
      nota(N, "Giulia ricarica: foglio con «" + v0 + "», scritta dello STOP a " + num + " s");
    }
    if (!await W.aspetta(function () { return vm(C).fase === "tabellone"; }, 16000)) no("non si arriva al tabellone");
    var tab = (vm(C).tab || []).filter(function (x) { return x.id === idDi("Giulia"); })[0];
    if (!tab || tab.parola !== lett + "iulia") no("al tabellone la parola di Giulia non c'è (" + JSON.stringify(tab) + ")");
    nota(N, "al tabellone c'è la parola di Giulia");
    return N.join(" · ");
  } });

  COPIONE.aggiungi("nc4", { nome: "Nomi Cose Città online: «⏩ Avanti» alla classifica del giro (più di metà = si parte subito)", fai: async function () {
    var N = [], X = await stanzaNcc({ round: 2, secondi: 60 }), P = X.P, C = X.C;
    W.clicca(P, /Via ▶|Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "scrittura"; }, 30000)) no("non si comincia a scrivere");
    X.nomi.forEach(function (n) { if (n === "Paky") P.__cbH.nomicose.onMsg("host", { t: "risposte", r: [] }); else W.reteDi(n).invia({ t: "risposte", r: [] }); });
    await votaTutto(X, function (v) { return v.fase === "punti" || v.fase === "fine"; });
    if (vm(C).fase !== "punti") no("dopo il primo giro non c'è la classifica del giro (fase " + vm(C).fase + ")");
    var L = W.finestra("Luca"), G = W.finestra("Giulia");
    var bL = await W.aspetta(function () { return [].find.call(L.document.querySelectorAll(".st-barra button"), function (b) { return /⏩ Avanti/.test(b.textContent); }); }, 12000);
    if (!bL) no("alla classifica del giro Luca non ha «⏩ Avanti» («" + T(L).slice(-120) + "»)");
    var conto = bL.querySelector(".conto-avanti");
    if (!conto || !(+conto.textContent > 0)) no("«⏩ Avanti» non ha il conto alla rovescia");
    if (!await W.aspetta(function () { return [].some.call(P.document.querySelectorAll(".st-barra button"), function (b) { return /⏩ Avanti/.test(b.textContent); }); }, 4000)) no("anche Paky deve avere «⏩ Avanti»");
    await misura("Luca", ".st-barra button, .nc-cl", "la classifica del giro");
    var giro = vm(C).giro;
    tocca(L, [].find.call(L.document.querySelectorAll(".st-barra button"), function (b) { return /⏩ Avanti/.test(b.textContent); }));
    if (!await W.aspetta(function () { return (vm(C).avanti || []).length === 1; }, 3000)) no("l'host non conta il tocco di Luca");
    if (vm(C).fase !== "punti") no("con 1 su 3 si è già partiti");
    if (!await W.aspetta(function () { return /1 su 3 vogliono andare avanti/.test(T(G)); }, 3000)) no("Giulia non legge «⏩ 1 su 3 vogliono andare avanti»");
    if (!await W.aspetta(function () { return /Si va avanti tra \d+/.test(T(L)); }, 3000)) no("dopo il tocco Luca non vede «Si va avanti tra…»");
    nota(N, "Luca tocca: «1 su 3», per lui «Si va avanti tra…»");
    tocca(G, [].find.call(G.document.querySelectorAll(".st-barra button"), function (b) { return /⏩ Avanti/.test(b.textContent); }));
    if (!await W.aspetta(function () { return vm(C).giro === giro + 1 && vm(C).fase === "lettera"; }, 3000)) no("con 2 su 3 non si parte subito (fase " + vm(C).fase + ", giro " + vm(C).giro + ")");
    nota(N, "Giulia tocca: 2 su 3, giro 2 subito");
    return N.join(" · ");
  } });

  // sullo stesso telefono: dalla home al tavolo, 2 giocatori, 1 giro
  async function localeNcc(imp) {
    var P = await W.apriTel("Paky", { x: 0, fintiM: true, prima: function (w) { w.__imp = imp; } });
    var tess = await W.aspetta(function () { return A.tessera(P, "Nomi, Cose e Città"); }, 6000);
    if (!tess) no("non trovo la tessera"); tess.click(); await W.dorme(400);
    if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non trovo «Su questo telefono»");
    await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 3000);
    while (P.document.querySelectorAll(".sala-riga input").length < 2) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = ["Paky", "Luca"][k] || "Amico"; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    for (var k = 0; k < 6 && !P.__t; k++) {
      await W.dorme(300);
      var b = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Avanti|Comincia|Gioca|Inizia|Via|Pronti|Partiamo|▶/.test(x.textContent) && !x.disabled; });
      if (b) b.click();
    }
    if (!await W.aspetta(function () { return P.__t; }, 4000)) no("il gioco sullo stesso telefono non parte («" + T(P).slice(0, 80) + "»)");
    return P;
  }
  // tocca i tasti dello studio (Sono X, tocca a me ▶ / Avanti / Calcola / Prossimo) finché trova un foglio aperto o la fine
  async function versoFoglio(P, ms) {
    var fino = Date.now() + (ms || 30000);
    while (Date.now() < fino) {
      if (foglio(P).length) return foglio(P);
      W.clicca(P, /tocca a me ▶|Avanti ▶|Calcola i punti|Prossimo giro/, ".st-barra button");
      await W.dorme(250);
    }
    return null;
  }

  COPIONE.aggiungi("nc5", { nome: "Nomi Cose Città sullo stesso telefono: ✋ STOP fissa il tempo di chi scrive dopo; spento come prima", fai: async function () {
    var N = [], sent = sentinella(["Paky"]);
    var P = await localeNcc({ round: 1, secondi: 60, stop: true });
    var c1 = await versoFoglio(P, 30000);
    if (!c1) no("non si apre il primo foglio");
    var chi1 = P.document.querySelector(".nc-foglio.on:not(.via) .nc-chi2 > span:not(.fac)").textContent, lett = P.document.querySelector(".nc-foglio.on:not(.via) .nc-lett").textContent;
    if (!tastoStop(P)) no("sullo stesso telefono non c'è il tasto STOP");
    await W.dorme(2000);
    c1.forEach(function (inp, k) { scrivi(P, inp, lett + "aaa" + k); });
    await W.dorme(150);
    if (!tastoStop(P) || tastoStop(P).disabled) no("con tutte le caselle buone lo STOP non si accende");
    tocca(P, tastoStop(P));
    if (!await W.aspetta(function () { return /STOP di/.test(T(P)); }, 4000)) no("dopo lo STOP non si vede «✋ STOP di " + chi1 + "!»");
    var c2 = await versoFoglio(P, 30000);
    if (!c2) no("non si apre il foglio del secondo");
    var chi2 = P.document.querySelector(".nc-foglio.on:not(.via) .nc-chi2 > span:not(.fac)").textContent;
    if (chi2 === chi1) no("scrive due volte " + chi1);
    var cart = P.document.querySelector(".nc-stop");
    if (!cart || !new RegExp(chi1 + " ha fatto STOP in \\d+ secondi: tu ne hai \\d+").test(cart.textContent)) no("a " + chi2 + " non si dice il tempo dello STOP («" + (cart ? cart.textContent : "niente") + "»)");
    var sec = +(cart.textContent.match(/tu ne hai (\d+)/) || [])[1];
    if (!(sec >= 11 && sec <= 14)) no("dopo uno STOP in circa 2 secondi " + chi2 + " ha " + sec + " secondi invece di circa 12");
    if (tastoStop(P)) no("dopo lo STOP di un altro c'è ancora il tasto STOP");
    nota(N, chi1 + " fa STOP in ~2 s → " + chi2 + " ha " + sec + " s («" + cart.textContent + "»)");
    var t0 = Date.now();
    if (!await W.aspetta(function () { return !foglio(P).length; }, (sec + 3) * 1000)) no("il foglio di " + chi2 + " non si chiude da solo a tempo");
    nota(N, "foglio chiuso da solo dopo " + Math.round((Date.now() - t0) / 1000) + " s");
    if (!await W.aspetta(function () { W.clicca(P, /Avanti ▶/, ".st-barra button"); return /✋ STOP/.test(T(P)) && P.document.querySelector(".nc-tab"); }, 15000)) no("al tabellone non c'è «✋ STOP» accanto a " + chi1);
    // fino alla fine
    var fine = await W.aspetta(function () { W.clicca(P, /Avanti ▶|Calcola i punti/, ".st-barra button"); return /Vince|Pareggio|Classifica|Rivincita|Nuova partita/.test(T(P)) && !P.document.querySelector(".nc-tab"); }, 60000, 400);
    if (!fine) no("la partita sullo stesso telefono non arriva alla fine («" + T(P).slice(-100) + "»)");
    nota(N, "partita fino alla fine");
    // STOP spento: niente tasto
    var P2 = await localeNcc({ round: 1, secondi: 60, stop: false });
    var c3 = await versoFoglio(P2, 30000);
    if (!c3) no("con lo STOP spento non si apre il foglio");
    if (tastoStop(P2)) no("con lo STOP spento c'è il tasto STOP");
    if (!W.clicca(P2, /Ho finito/, ".st-barra button")) no("con lo STOP spento non c'è «Ho finito»");
    nota(N, "STOP spento: «Ho finito» come prima");
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    return N.join(" · ");
  } });
})();

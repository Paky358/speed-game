// PROVE DI TABOO «📱 SU QUESTO TELEFONO» (il classico: chi spiega tiene il telefono, un avversario guarda e preme BUZZ).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("migliora/taboo.js"); await COPIONE.prova("tb1")
//
// tb1: dalla home in 4 (Paky, Giulia, Luca, Marco), 60 s, 1 giro, solo coi tasti: «Come giocate?» → «Su questo telefono» →
//      nomi → regole → le squadre (tocco un nome = cambia squadra, «Via» spento se una squadra ha meno di 2) → a ogni turno
//      «Passa il telefono a…» con chi controlla → «Pronti, via!» → ✅ ✅ ⏭️ ❌ (al primo turno «↩️ Annulla BUZZ») → tempo
//      finito → riepilogo con la carta allo scadere ⏰ che si tocca e diventa ✅ (punti giusti in alto) → fine coi premi →
//      «Classifica 🏆» del core. Misure a 360x640 e 412x915 di squadre, passa, turno, riepilogo e fine (niente scorre,
//      niente resta nascosto). I trofei di Paky (salvaProgressi). Niente errori.
// tb2: in 5, 1 giro: 6 turni, le squadre si alternano, dentro la squadra si va a giro (chi è in 2 spiega due volte),
//      chi controlla cambia a ogni turno; la pausa ferma il tempo e nasconde la carta; ✕ a metà turno chiede e poi esce
//      (e l'orologio di Taboo si spegne: niente errori dopo).
// tb3: online (stanza di un gioco solo) in 4: ✕ di un amico e dell'host con la finestra dell'app (mai quella del browser).
// Per le partite online di Taboo (com'erano): COPIONE.carica("passo2/gruppo-d.js") e gli scenari 234, 234f, 237;
// poi 286 e 56 con { solo: ["taboo"] }.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;

  // l'orologio di taboo.js (e solo quello) va avanti di w.__salto millisecondi: così un turno finisce subito
  function salto(w) {
    var ora = w.Date.now.bind(w.Date); w.__salto = 0;
    w.Date.now = function () { if (w.__salto && /taboo\.js/.test(new Error().stack || "")) return ora() + w.__salto; return ora(); };
  }
  // un tocco col dito (i tasti di Taboo rispondono al pointerup)
  function tocca(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click();
  }
  function tasto(w, re) { return [].find.call(w.document.querySelectorAll(".tb button, .tb-tasti button"), function (b) { return re.test(b.textContent) && !b.disabled; }) || null; }
  async function premi(w, re, cosa) {
    var b = await W.aspetta(function () { return tasto(w, re); }, 4000);
    if (!b) no("non trovo «" + (cosa || re) + "» («" + T(w).slice(0, 120) + "»)");
    tocca(w, b); await W.dorme(460);   // (dopo un tocco i tasti si fermano 400 ms)
  }
  function punti(w) { return [].map.call(w.document.querySelectorAll(".tb-squadra b"), function (b) { return Number(b.textContent); }); }
  function errori(w) { var e = (w.__err || []); return e.length ? e.slice(0, 3).join(" / ") : ""; }
  // tutto lo schermo del gioco sta dentro il telefono? (niente scorre, niente resta tagliato dentro i riquadri)
  function dentro(w, sel) {
    var d = w.document, x = [];
    if (d.scrollingElement.scrollHeight > w.innerHeight + 2) x.push("la pagina scorre");
    sel.forEach(function (s) {
      var el = d.querySelector(s); if (!el) { x.push("manca " + s); return; }
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.left < -1 || r.top < -1 || r.right > w.innerWidth + 1 || r.bottom > w.innerHeight + 1) x.push(s + " fuori schermo");
    });
    [].forEach.call(d.querySelectorAll(".tb-corpo, .tb-nascondi, .tb-riep, .tb-chips, .tb-fine, .tb-col, .tb-loc-nomi"), function (el) {
      if (el.scrollHeight > el.clientHeight + 2) x.push((el.className.split(" ")[0]) + " tagliato (" + el.scrollHeight + " su " + el.clientHeight + ")");
    });
    return x.join(", ");
  }
  async function misura(nome, cosa, sel) {
    var f = document.getElementById("tel-" + nome), w = W.finestra(nome), out = [];
    var M = [[360, 640], [412, 915]];
    for (var i = 0; i < M.length; i++) {
      f.style.width = M[i][0] + "px"; f.style.height = M[i][1] + "px"; void w.document.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
      await W.dorme(450);
      var e = dentro(w, sel); if (e) out.push(cosa + " a " + M[i][0] + "x" + M[i][1] + ": " + e);
    }
    f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize")); await W.dorme(200);
    return out;
  }
  // dalla home alle squadre sullo stesso telefono, coi nomi e le regole date
  async function apriLocale(nomi, regole) {
    var P = await W.apriTel("Paky", { x: 0, prima: salto });
    var st = P.document.createElement("style"); st.textContent = ".schermata{animation:none!important}.tb-entra,.tb-bump{animation:none!important}"; P.document.head.appendChild(st);
    P.__salvati = []; P.SGNube.salvaProgressi = function () { P.__salvati.push([].slice.call(arguments)); };
    var tess = await W.aspetta(function () { return A.tessera(P, "Taboo"); }, 6000);
    if (!tess) no("non trovo la tessera di Taboo"); tess.click();
    var bm = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".modo-grande"), function (b) { return /Su questo telefono/.test(b.textContent); }); }, 4000);
    if (!bm) no("in «Come giocate?» non c'è «Su questo telefono» («" + T(P).slice(0, 120) + "»)");
    if (!/Online/.test(T(P))) no("in «Come giocate?» è sparito «Online»");
    bm.click();
    if (!await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 3000)) no("non si scrivono i nomi");
    while (P.document.querySelectorAll(".sala-riga input").length < nomi.length) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = nomi[k]; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    W.clicca(P, /Avanti/);
    if (!await W.aspetta(function () { return /Tempo del turno/i.test(T(P)); }, 4000)) no("non vedo le regole («" + T(P).slice(0, 100) + "»)");
    (regole || []).forEach(function (r) { if (!W.clicca(P, r, ".modo-chip")) no("nelle regole non c'è «" + r + "»"); });
    if (!W.clicca(P, /Comincia/)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return P.document.querySelector(".tb-loc-squadre"); }, 4000)) no("non si vedono le squadre («" + T(P).slice(0, 100) + "»)");
    return P;
  }
  function squadreDi(P) {
    return [].map.call(P.document.querySelectorAll(".tb-loc-squadre .tb-col"), function (c) { return [].map.call(c.querySelectorAll(".tb-scelta"), function (b) { return b.textContent; }); });
  }

  COPIONE.aggiungi("tb1", { nome: "Taboo su questo telefono in 4: squadre, passa, ✅ ⏭️ ❌, Annulla, ⏰ corretta, fine, misure", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Marco"], misure = [];
    var P = await apriLocale(nomi, [/60 s/, /^1$/]);
    // le squadre: 2 e 2; spostando un nome «Via» si spegne, rimettendolo si riaccende
    var sq = squadreDi(P);
    if (sq.length !== 2 || sq[0].length !== 2 || sq[1].length !== 2) no("squadre attese 2 e 2: " + JSON.stringify(sq));
    misure = misure.concat(await misura("Paky", "le squadre", [".tb-loc-squadre", ".tb-tasti"]));
    var primo = P.document.querySelector(".tb-loc-squadre .tb-col.a .tb-scelta"), chi = primo.textContent;
    primo.click(); await W.dorme(150);
    if (squadreDi(P)[1].indexOf(chi) < 0) no("toccando " + chi + " non cambia squadra");
    if (tasto(P, /Via ▶/)) no("con una squadra da 1 «Via» è acceso");
    if (!/almeno 2/.test(T(P))) no("manca la nota «almeno 2 persone»");
    [].find.call(P.document.querySelectorAll(".tb-loc-squadre .tb-col.b .tb-scelta"), function (b) { return b.textContent === chi; }).click(); await W.dorme(150);
    sq = squadreDi(P);
    await premi(P, /Via ▶/, "Via");
    var attesi = [0, 0], visti = [], conto = 0, annullato = false, corretta = false;
    while (true) {
      // «Passa il telefono a …» con chi controlla (un avversario)
      if (!await W.aspetta(function () { return tasto(P, /Pronti, via/) || tasto(P, /Classifica/); }, 5000)) no("non arriva il turno («" + T(P).slice(0, 120) + "»)");
      if (tasto(P, /Classifica/)) break;
      var testo = T(P);
      var spieg = P.document.querySelector(".tb-nascondi .tb-indovina").textContent;
      var ctrl = (P.document.querySelector(".tb-loc-ctrl b").textContent.match(/👀 (\S+) controlla/) || [])[1];
      var sS = sq[0].indexOf(spieg) >= 0 ? 0 : 1;
      if (!/Passa il telefono a/.test(testo)) no("manca «Passa il telefono a»");
      if (!ctrl || sq[1 - sS].indexOf(ctrl) < 0) no("chi controlla (" + ctrl + ") non è un avversario di " + spieg);
      if (testo.indexOf("Squadra " + "AB"[sS]) < 0) no("non dice la squadra di chi spiega");
      if (P.document.querySelector(".tb-carta")) no("la carta si vede prima di «Pronti, via!»");
      visti.push(spieg + ">" + ctrl);
      if (!conto) misure = misure.concat(await misura("Paky", "«Passa il telefono»", [".tb-loc-ctrl", ".tb-tasti button"]));
      await premi(P, /Pronti, via/);
      if (!await W.aspetta(function () { return P.document.querySelector(".tb-carta .tb-parola"); }, 3000)) no("dopo «Pronti, via!» non c'è la carta");
      if (!/controlla/.test(P.document.querySelector(".tb-turno").textContent)) no("nella riga del turno manca chi controlla");
      var p0 = P.document.querySelector(".tb-parola").textContent;
      await premi(P, /Indovinata/); attesi[sS]++;
      await premi(P, /Indovinata/); attesi[sS]++;
      if (P.document.querySelector(".tb-parola").textContent === p0) no("dopo ✅ la carta non cambia");
      await premi(P, /Passo 0\/3/, "Passo 0/3");
      if (!tasto(P, /Passo 1\/3/)) no("il tasto dei passi non conta («Passo 1/3»)");
      await premi(P, /BUZZ/); attesi[sS]--;
      if (!await W.aspetta(function () { return P.document.querySelector(".tb-banner.vis"); }, 1500)) no("dopo il BUZZ non c'è l'avviso");
      await W.dorme(500);
      if (punti(P)[sS] !== attesi[sS]) no("punti dopo il BUZZ: " + punti(P) + " invece di " + attesi);
      if (!conto) {
        misure = misure.concat(await misura("Paky", "il turno", [".tb-carta", ".tb-btn.buzz", ".tb-top"]));
        await premi(P, /Annulla BUZZ/); attesi[sS]++; annullato = true;
        if (punti(P)[sS] !== attesi[sS]) no("«Annulla BUZZ» non ridà il punto: " + punti(P) + " invece di " + attesi);
      }
      // il tempo finisce (solo l'orologio di Taboo va avanti)
      P.__salto += 62000;
      if (!await W.aspetta(function () { return P.document.querySelector(".tb-riep"); }, 4000)) no("finito il tempo non arriva il riepilogo («" + T(P).slice(0, 100) + "»)");
      var chips = [].slice.call(P.document.querySelectorAll(".tb-riep button.tb-chip"));
      var attesiChip = conto ? 5 : 5;   // ✅ ✅ ⏭️ ❌ (o ↩️) e ⏰
      if (chips.length !== attesiChip) no("nel riepilogo " + chips.length + " carte invece di " + attesiChip + " («" + P.document.querySelector(".tb-riep").textContent + "»)");
      var tempoC = chips.find(function (b) { return /⏰/.test(b.textContent); });
      if (!tempoC) no("manca la carta allo scadere ⏰");
      if (!conto && !chips.some(function (b) { return /↩️/.test(b.textContent); })) no("la carta del BUZZ annullato non è ↩️");
      if (punti(P)[sS] !== attesi[sS]) no("punti al riepilogo: " + punti(P) + " invece di " + attesi);
      if (conto === 1) {   // «l'avevamo detta in tempo!»: la ⏰ diventa ✅
        tempoC.click(); await W.dorme(150); attesi[sS]++; corretta = true;
        if (!/✅/.test(tempoC.textContent) || punti(P)[sS] !== attesi[sS]) no("toccando la ⏰ non diventa ✅ (" + tempoC.textContent + ", punti " + punti(P) + ")");
        var em = P.document.querySelector(".tb-riep h3 em").textContent;
        if (em !== "+2") no("il conto del turno dopo la correzione è " + em + " invece di +2");
      }
      if (!conto) misure = misure.concat(await misura("Paky", "il riepilogo", [".tb-riep", ".tb-tasti button"]));
      conto++;
      await premi(P, /Avanti ▶|Chi ha vinto/, "Avanti");
    }
    if (conto !== 4) no("turni giocati " + conto + " invece di 4 (" + visti.join(", ") + ")");
    // fine: chi vince, i premi, poi la classifica del core
    var h1 = P.document.querySelector(".tb-fine h1").textContent, win = attesi[0] === attesi[1] ? -1 : (attesi[0] > attesi[1] ? 0 : 1);
    if (win < 0 ? !/Pareggio/.test(h1) : h1.indexOf("Squadra " + "AB"[win]) < 0) no("alla fine «" + h1 + "» con i punti " + attesi);
    if (!/Miglior spiegatore/.test(T(P))) no("mancano i premi");
    misure = misure.concat(await misura("Paky", "la fine", [".tb-fine h1", ".tb-colonne", ".tb-tasti button"]));
    var sal = P.__salvati.filter(function (x) { return x[1] === "taboo"; })[0];
    if (!sal) no("i trofei di Paky non sono salvati");
    var inc = {}; sal[2].forEach(function (x) { inc[x[0]] = x[1]; });
    if (inc.partite !== 1 || inc.turniSpiegati !== 1 || !(inc.carteIndovinate >= 2) || inc.cartePassate !== 1) no("trofei di Paky strani: " + JSON.stringify(sal[2]));
    await premi(P, /Classifica/);
    if (!await W.aspetta(function () { return /Fine partita/.test(T(P)); }, 4000)) no("«Classifica» non porta alla classifica («" + T(P).slice(0, 80) + "»)");
    if (misure.length) no("misure: " + misure.join(" | "));
    var e = errori(P); if (e) no("errori: " + e);
    if (!annullato || !corretta) no("non provati Annulla o la correzione");
    return "ok · 4 turni (" + visti.join(", ") + "), punti " + attesi.join("-") + ", Annulla BUZZ e ⏰ corretta, trofei " + JSON.stringify(inc) + ", misure ok";
  } });

  COPIONE.aggiungi("tb2", { nome: "Taboo su questo telefono in 5: 6 turni a giro, chi controlla cambia, pausa, ✕ a metà", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Marco", "Bea"];
    var P = await apriLocale(nomi, [/60 s/, /^1$/]);
    var sq = squadreDi(P);
    if (Math.abs(sq[0].length - sq[1].length) !== 1) no("in 5 le squadre dovrebbero essere 3 e 2: " + JSON.stringify(sq));
    await premi(P, /Via ▶/, "Via");
    var turni = [], pausaOk = false;
    for (var k = 0; k < 6; k++) {
      if (!await W.aspetta(function () { return tasto(P, /Pronti, via/); }, 5000)) no("turno " + (k + 1) + ": non arriva «Pronti, via!» («" + T(P).slice(0, 100) + "»)");
      var spieg = P.document.querySelector(".tb-nascondi .tb-indovina").textContent;
      var ctrl = (P.document.querySelector(".tb-loc-ctrl b").textContent.match(/👀 (\S+) controlla/) || [])[1];
      if (!new RegExp("Turno " + (k + 1) + " di 6").test(T(P))) no("non dice «Turno " + (k + 1) + " di 6» («" + P.document.querySelector(".tb-turno").textContent + "»)");
      turni.push({ s: spieg, c: ctrl, q: sq[0].indexOf(spieg) >= 0 ? 0 : 1 });
      await premi(P, /Pronti, via/);
      if (k === 1) {   // la pausa: il tempo si ferma e la carta sparisce
        await W.dorme(300);
        tocca(P, P.document.querySelector(".tb-mini")); await W.dorme(300);
        var t1 = P.document.querySelector(".tb-timer").textContent;
        if (P.document.querySelector(".tb-carta")) no("in pausa la carta si vede ancora");
        if (tasto(P, /Indovinata/)) no("in pausa «Indovinata» è acceso");
        P.__salto += 30000; await W.dorme(600);
        if (P.document.querySelector(".tb-riep")) no("in pausa il turno è finito lo stesso");
        if (P.document.querySelector(".tb-timer").textContent !== t1) no("in pausa il tempo va avanti (" + t1 + " → " + P.document.querySelector(".tb-timer").textContent + ")");
        await premi(P, /Riprendi/);
        if (!P.document.querySelector(".tb-carta")) no("dopo «Riprendi» la carta non torna");
        pausaOk = true;
      }
      if (k === 5) {   // ✕ a metà dell'ultimo turno: si chiede (il telefono finto dice sì) e si esce
        tocca(P, P.document.querySelectorAll(".tb-mini")[1]);
        if (!await W.aspetta(function () { return A.home(P) || P.document.querySelector(".tessera"); }, 4000)) no("✕ non porta fuori dal gioco («" + T(P).slice(0, 80) + "»)");
        P.__salto += 120000; await W.dorme(1200);   // l'orologio vecchio non deve fare niente
        break;
      }
      P.__salto += 62000;
      if (!await W.aspetta(function () { return P.document.querySelector(".tb-riep"); }, 4000)) no("turno " + (k + 1) + ": niente riepilogo");
      await premi(P, /Avanti ▶/, "Avanti");
    }
    // le squadre si alternano; dentro la squadra a giro; chi controlla è sempre un avversario e cambia
    for (var i = 1; i < turni.length; i++) if (turni[i].q === turni[i - 1].q) no("due turni di fila alla stessa squadra: " + JSON.stringify(turni));
    var grande = sq[0].length === 3 ? 0 : 1, piccola = 1 - grande;
    var spG = turni.filter(function (x) { return x.q === grande; }).map(function (x) { return x.s; });
    var spP = turni.filter(function (x) { return x.q === piccola; }).map(function (x) { return x.s; });
    if (spG.slice().sort().join() !== sq[grande].slice().sort().join()) no("nella squadra da 3 non spiegano tutti una volta: " + spG);
    if (spP.length !== 3 || spP[0] === spP[1] || spP[2] !== spP[0]) no("nella squadra da 2 non si va a giro: " + spP);
    turni.forEach(function (x) { if (sq[1 - x.q].indexOf(x.c) < 0) no("chi controlla non è un avversario: " + JSON.stringify(x)); });
    var ctrlP = turni.filter(function (x) { return x.q === grande; }).map(function (x) { return x.c; });
    if (ctrlP[0] === ctrlP[1]) no("chi controlla non cambia: " + ctrlP);
    var e = errori(P); if (e) no("errori: " + e);
    if (!pausaOk) no("pausa non provata");
    return "ok · " + turni.map(function (x) { return x.s + ">" + x.c; }).join(", ") + " · pausa ok · ✕ esce senza errori";
  } });

  // tb3: online (stanza di un gioco solo) in 4: ✕ di un amico a partita iniziata chiede con la finestra dell'app (non quella
  //      del browser) e lo fa uscire; poi ✕ dell'host: «Chiudere la partita per tutti?» e gli amici trovano la stanza chiusa.
  COPIONE.aggiungi("tb3", { nome: "Taboo online: ✕ di un amico e dell'host con la finestra dell'app", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: salto }), conf = [];
    P.confirm = function () { conf.push("browser"); return true; };
    var tess = await W.aspetta(function () { return A.tessera(P, "Taboo"); }, 6000); if (!tess) no("non trovo Taboo"); tess.click();
    if (!await W.aspetta(function () { return W.clicca(P, /Online: apro io/, ".modo-grande"); }, 3000)) no("non c'è «Online: apro io la stanza»");
    if (!await W.aspetta(function () { return W.clicca(P, /Apri la stanza/); }, 3000)) no("non c'è «Apri la stanza»");
    var cod = await W.aspetta(function () { var m = T(P).match(/CODICE\s*([A-Z0-9]{4})\b/i); return P.document.querySelector(".saletta-schermo") && m ? m[1] : null; }, 6000);
    if (!cod) no("non vedo il codice della stanza");
    var amici = ["Giulia", "Luca", "Marco"], F = {};
    for (var i = 0; i < amici.length; i++) { F[amici[i]] = await W.apriTel(amici[i], { hash: "gioco=taboo&stanza=" + cod, x: 185 * (i + 1) }); F[amici[i]].confirm = function () { conf.push("browser"); return true; }; }
    if (!await W.aspetta(function () { return P.document.querySelectorAll(".tb-scelta").length === 4; }, 12000)) no("nella saletta non ci sono 4 nomi nelle squadre");
    await W.dorme(600);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("«Comincia» spento");
    if (!await W.aspetta(function () { return P.document.querySelector(".tb-top"); }, 8000)) no("la partita non parte sull'host");
    var G = F.Giulia;
    if (!await W.aspetta(function () { return G.document.querySelector(".tb-top"); }, 8000)) no("la partita non arriva a Giulia");
    G.document.querySelectorAll(".tb-mini")[1].click();
    if (!await W.aspetta(function () { return A.home(G) || G.document.querySelector(".tessera"); }, 5000)) no("✕ di Giulia non la fa uscire («" + T(G).slice(0, 80) + "»)");
    P.document.querySelectorAll(".tb-mini")[1].click();
    if (!await W.aspetta(function () { return A.home(P) || P.document.querySelector(".tessera"); }, 5000)) no("✕ dell'host non chiude («" + T(P).slice(0, 80) + "»)");
    if (!await W.aspetta(function () { return /chiusa/i.test(T(F.Luca)); }, 8000)) no("Luca non vede la stanza chiusa («" + T(F.Luca).slice(0, 80) + "»)");
    if (conf.length) no("si è usata la finestra del browser (" + conf.length + " volte)");
    var e = errori(P) || errori(G) || errori(F.Luca); if (e) no("errori: " + e);
    return "ok · stanza " + cod + ": Giulia esce con la finestra dell'app, l'host chiude per tutti, Luca vede la stanza chiusa";
  } });
})();

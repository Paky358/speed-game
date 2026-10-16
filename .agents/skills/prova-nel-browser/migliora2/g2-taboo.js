// PROVE DI TABOO: «🧺 Tre round» (spiega / una parola sola / solo mimo, le stesse carte) e «🫳 Rubata!».
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("migliora2/g2-taboo.js"); await COPIONE.prova("g2t1")
//
// g2t0: le regole (⚙️ fuori pagina): «Partita» Classica/Tre round, «Carte della partita» solo coi tre round, «Rubata» No/Sì;
//       la riga «📜 Si gioca così» (riassunto) per classica, tre round e rubata.
// g2t1: su questo telefono in 4, Tre round con 20 carte, 60 s: nel round 1 si vedono le vietate; ⏭️ rimette la carta in fondo
//       (il conto 🧺 non scende); le carte finite a metà turno → «Round 2 di 3 · ☝️ Una parola sola» con i punti del round 1 e
//       «⏩ Avanti» col conto → «Tieni il telefono… restano N s» → le vietate spariscono; round 3 «🤐 Solo mimo» parte da solo
//       col conto alla rovescia; fine del terzo round → «🏁 Tre round finiti!»; una correzione nel riepilogo rimette la carta nel
//       mazzo (torna «Ora tocca a…»); fine con «🧺 Round per round». Misure a 360x640 e 412x915.
// g2t2: su questo telefono, Tre round + Rubata: a fine tempo «🫳 RUBATA? 5…» coi tasti di chi spiega; «✅ L'hanno presa» = +1
//       all'altra squadra e la carta esce dal mazzo; correggendola nel riepilogo (🫳 → ⏰) il punto sparisce e la carta torna;
//       «❌ No» dopo i 5 secondi: la carta resta nel mazzo. Misure della rubata.
// g2t3: online in 4 (stanza di un gioco solo) + Bea che arriva tardi e guarda: Tre round con 20 carte e Rubata. Tra gli
//       avversari controlla uno solo (carta + BUZZ), l'altro «🫳 Occhio!» non vede la carta e il suo BUZZ non vale; carte finite a
//       metà turno → tutti nel cambio di round, «⏩ Avanti» a maggioranza (3 su 4): il mio tocco resta «✅ Avanti» e cambia solo
//       il numero (stesso tasto, niente lampeggio), chi ricarica ritrova il suo ✅, al terzo si parte subito e chi spiegava
//       continua col tempo rimasto; nel round 2 niente vietate; rubata presa e annullata dall'host, rubata che nessuno decide
//       (niente rubata da sola), rubata presa che resta nel riepilogo; partita fino alla fine con «🧺 Round per round».
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;

  function salto(w) {   // l'orologio di taboo.js (e solo quello) va avanti di w.__salto millisecondi
    var ora = w.Date.now.bind(w.Date); w.__salto = 0;
    w.Date.now = function () { if (w.__salto && /taboo\.js/.test(new Error().stack || "")) return ora() + w.__salto; return ora(); };
  }
  function tocca(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click();
  }
  function tasto(w, re) { return [].find.call(w.document.querySelectorAll(".tb button, .tb-tasti button"), function (b) { return re.test(b.textContent) && !b.disabled; }) || null; }
  async function premi(w, re, cosa) {
    var b = await W.aspetta(function () { return tasto(w, re); }, 5000);
    if (!b) no("non trovo «" + (cosa || re) + "» («" + T(w).slice(0, 140) + "»)");
    tocca(w, b); await W.dorme(460);
  }
  function punti(w) { return [].map.call(w.document.querySelectorAll(".tb-squadra b"), function (b) { return Number(b.textContent); }); }
  function riga(w) { var r = w.document.querySelector(".tb-turno"); return r ? r.textContent : ""; }
  function nelMazzo(w) { var m = riga(w).match(/🧺 (\d+)/); return m ? Number(m[1]) : -1; }
  function errori(w) { var e = (w.__err || []); return e.length ? e.slice(0, 3).join(" / ") : ""; }
  function dentro(w, sel) {
    var d = w.document, x = [];
    if (d.scrollingElement.scrollHeight > w.innerHeight + 2) x.push("la pagina scorre");
    sel.forEach(function (s) {
      var el = d.querySelector(s); if (!el) { x.push("manca " + s); return; }
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.left < -1 || r.top < -1 || r.right > w.innerWidth + 1 || r.bottom > w.innerHeight + 1) x.push(s + " fuori schermo");
    });
    [].forEach.call(d.querySelectorAll(".tb-corpo, .tb-nascondi, .tb-riep, .tb-fine, .tb-round, .tb-rtab, .tb-tasti"), function (el) {
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
  function senzaAnimazioni(w) { var st = w.document.createElement("style"); st.textContent = ".schermata{animation:none!important}.tb-entra,.tb-bump,.tb-trema{animation:none!important}"; w.document.head.appendChild(st); }
  async function apriLocale(nomi, regole) {
    var P = await W.apriTel("Paky", { x: 0, prima: salto });
    senzaAnimazioni(P);
    P.__salvati = []; P.SGNube.salvaProgressi = function () { P.__salvati.push([].slice.call(arguments)); };
    var tess = await W.aspetta(function () { return A.tessera(P, "Taboo"); }, 6000);
    if (!tess) no("non trovo la tessera di Taboo"); tess.click();
    var bm = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".modo-grande"), function (b) { return /Su questo telefono/.test(b.textContent); }); }, 4000);
    if (!bm) no("in «Come giocate?» non c'è «Su questo telefono»");
    bm.click();
    if (!await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 3000)) no("non si scrivono i nomi");
    while (P.document.querySelectorAll(".sala-riga input").length < nomi.length) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = nomi[k]; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    W.clicca(P, /Avanti/);
    if (!await W.aspetta(function () { return /Tempo del turno/i.test(T(P)); }, 4000)) no("non vedo le regole");
    for (var i = 0; i < (regole || []).length; i++) { if (!W.clicca(P, regole[i], ".modo-chip")) no("nelle regole non c'è «" + regole[i] + "»"); await W.dorme(60); }
    if (!W.clicca(P, /Comincia/)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return P.document.querySelector(".tb-loc-squadre"); }, 4000)) no("non si vedono le squadre");
    return P;
  }
  function squadreDi(P) {
    return [].map.call(P.document.querySelectorAll(".tb-loc-squadre .tb-col"), function (c) { return [].map.call(c.querySelectorAll(".tb-scelta"), function (b) { return b.textContent; }); });
  }
  function squadraLocale(P, sq) { var spieg = P.document.querySelector(".tb-nascondi .tb-indovina").textContent; return sq[0].indexOf(spieg) >= 0 ? 0 : 1; }

  // ---------------------------------------------------------------- g2t0
  COPIONE.aggiungi("g2t0", { nome: "Taboo: regole nuove (Partita, Carte della partita, Rubata) e riassunto", fai: async function () {
    var src = await (await fetch("/js/games/taboo.js?" + Date.now())).text(), g = {};
    new Function("SG", src)({ registra: function (x) { Object.assign(g, x); } });
    var r0 = g.riassunto({}), r1 = g.riassunto({ partita: "tre", mazzo: 20, tempo: 60, carte: 1, rubata: 1 }), r2 = g.riassunto({ giri: 2, rubata: 1 });
    if (r0 !== "90 secondi a turno · 1 giro · carte miste") no("riassunto di base cambiato: " + r0);
    if (r1 !== "🧺 Tre round con 20 carte · 60 secondi a turno · carte facili · 🫳 Rubata") no("riassunto tre round: " + r1);
    if (r2 !== "90 secondi a turno · 2 giri · carte miste · 🫳 Rubata") no("riassunto classica con rubata: " + r2);
    if ([r0, r1, r2].some(function (x) { return x.length > 90; })) no("riassunto più lungo di 90");
    // il box delle regole fuori dalla pagina (come lo prepara la Sala)
    var box = document.createElement("div"), dove = {};
    var el = function (tag, a, figli) { var e = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { if (k === "text") e.textContent = a[k]; else if (k === "class") e.className = a[k]; else if (k === "style") e.style.cssText = a[k]; else if (k === "onclick") e.onclick = a[k]; else e.setAttribute(k, a[k]); }); (figli || []).forEach(function (f) { e.appendChild(f); }); return e; };
    g.impostazioni(box, dove, { el: el });
    if (dove.partita !== "classica" || dove.mazzo !== 30 || dove.rubata !== 0 || dove.tempo !== 90 || dove.giri !== 1 || dove.carte !== 2) no("valori di base: " + JSON.stringify(dove));
    var chip = function (re) { return [].find.call(box.querySelectorAll(".modo-chip"), function (b) { return re.test(b.textContent); }); };
    var visibile = function (re) { var c = chip(re); for (var n = c; n && n !== box; n = n.parentNode) if (n.hidden) return false; return !!c; };
    if (visibile(/^20$/)) no("«Carte della partita» si vede nella classica");
    if (!visibile(/^4$/)) no("«Quanti giri» non si vede nella classica");
    chip(/Tre round/).click();
    if (dove.partita !== "tre" || !visibile(/^20$/) || visibile(/^4$/)) no("toccando «Tre round» non cambiano le scelte visibili");
    chip(/^40$/).click(); chip(/^Sì$/).click();
    if (dove.mazzo !== 40 || dove.rubata !== 1) no("le scelte non si salvano: " + JSON.stringify(dove));
    var g2 = {}, box2 = document.createElement("div"); g.impostazioni(box2, g2 = { partita: "tre", mazzo: 20, rubata: 1 }, { el: el });
    if (!/attiva/.test([].find.call(box2.querySelectorAll(".modo-chip"), function (b) { return /Tre round/.test(b.textContent); }).className)) no("riaprendo le regole «Tre round» non è acceso");
    if (!g.regole.some(function (r) { return /Tre round/.test(r) && /Una parola sola/.test(r) && /Solo mimo/.test(r); })) no("le regole non spiegano i tre round");
    if (!g.regole.some(function (r) { return /Rubata/.test(r) && /5 secondi/.test(r); })) no("le regole non spiegano la Rubata");
    return "ok · " + r1 + " · scelte e regole ok";
  } });

  // ---------------------------------------------------------------- g2t1
  COPIONE.aggiungi("g2t1", { nome: "Taboo su questo telefono: 🧺 Tre round con 20 carte, cambio di round a metà turno, correzione, fine", fai: async function () {
    var misure = [];
    var P = await apriLocale(["Paky", "Giulia", "Luca", "Marco"], [/Tre round/, /^20$/, /60 s/]);
    if (!/Tre round con 20 carte/.test(riga(P))) no("nelle squadre non si dice «Tre round con 20 carte» («" + riga(P) + "»)");
    var sq = squadreDi(P), att = [0, 0];
    await premi(P, /Via ▶/, "Via");
    // turno 1 (round 1): vietate, passo che rimette la carta in fondo, 5 indovinate, tempo
    if (!await W.aspetta(function () { return tasto(P, /Pronti, via/); }, 4000)) no("non arriva il primo turno");
    var s1 = squadraLocale(P, sq);
    if (!/Spiega/.test(riga(P))) no("riga del turno senza il round («" + riga(P) + "»)");
    await premi(P, /Pronti, via/);
    if (!P.document.querySelector(".tb-carta .tb-vietata")) no("nel round 1 non si vedono le vietate");
    if (nelMazzo(P) !== 20) no("all'inizio nel mazzo " + nelMazzo(P) + " invece di 20");
    await premi(P, /Passo 0\/3/, "Passo");
    if (nelMazzo(P) !== 20) no("dopo ⏭️ il mazzo scende (" + nelMazzo(P) + "): la carta passata deve tornare in fondo");
    for (var i = 0; i < 5; i++) { await premi(P, /Indovinata/); att[s1]++; }
    if (nelMazzo(P) !== 15) no("dopo 5 indovinate nel mazzo " + nelMazzo(P) + " invece di 15");
    P.__salto += 62000;
    if (!await W.aspetta(function () { return P.document.querySelector(".tb-riep"); }, 4000)) no("non arriva il riepilogo");
    P.__salto = 0;   // (il conto alla rovescia del core non deve sentire il salto)
    if (punti(P)[s1] !== att[s1]) no("punti " + punti(P) + " invece di " + att);
    await premi(P, /Avanti ▶/, "Avanti");
    // turno 2: tutte le 15 → carte finite a metà turno
    await premi(P, /Pronti, via/);
    var s2 = 1 - s1, giri = 0, chi2 = null;
    while (!P.document.querySelector(".tb-round") && giri++ < 25) { if (tasto(P, /Indovinata/)) { await premi(P, /Indovinata/); att[s2]++; } else await W.dorme(200); }
    if (!await W.aspetta(function () { return P.document.querySelector(".tb-round"); }, 3000)) no("finite le carte non arriva il round 2 («" + T(P).slice(0, 120) + "»)");
    if (att[s2] !== 15) no("indovinate nel turno 2: " + att[s2] + " invece di 15");
    var tr = T(P);
    if (!/Round 2 di 3/.test(tr) || !/Una parola sola/.test(tr)) no("il cambio di round non dice «Round 2 di 3 · ☝️ Una parola sola»");
    if (!/Poi continua/.test(tr) || !/tempo che restava/.test(tr)) no("non dice che il turno continua col tempo rimasto");
    var rt = P.document.querySelector(".tb-rtab").textContent;
    if (rt.indexOf(String(att[0])) < 0 || rt.indexOf(String(att[1])) < 0 || !/Spiega/.test(rt)) no("tabella dei round strana: " + rt);
    if (!P.document.querySelector(".tb-tasti .conto-avanti")) no("«⏩ Avanti» senza conto alla rovescia");
    misure = misure.concat(await misura("Paky", "il cambio di round", [".tb-round", ".tb-rtab", ".tb-tasti button"]));
    await premi(P, /Avanti/, "⏩ Avanti");
    if (!await W.aspetta(function () { return tasto(P, /Si riparte/); }, 3000)) no("dopo il cambio di round non c'è «Si riparte!» («" + T(P).slice(0, 120) + "»)");
    if (!/Tieni il telefono/.test(T(P)) || !/restano \d+ s/.test(T(P))) no("la ripresa non dice «Tieni il telefono… restano N s»");
    if (!/una parola sola/i.test(T(P))) no("prima di ripartire non si ricorda la regola del round 2");
    await premi(P, /Si riparte/);
    if (!P.document.querySelector(".tb-carta .tb-parola")) no("nel round 2 non c'è la carta");
    if (P.document.querySelector(".tb-carta .tb-vietata")) no("nel round 2 si vedono ancora le vietate");
    if (!/Una parola sola/.test(P.document.querySelector(".tb-promemoria").textContent)) no("manca il promemoria «Una parola sola»");
    var sec = Number(P.document.querySelector(".tb-timer").textContent);
    if (!(sec > 3 && sec < 60)) no("la ripresa non tiene il tempo rimasto (" + sec + " s)");
    if (nelMazzo(P) !== 20) no("nel round 2 il mazzo ha " + nelMazzo(P) + " carte invece di 20");
    giri = 0;
    while (!P.document.querySelector(".tb-round") && giri++ < 30) { if (tasto(P, /Indovinata/)) { await premi(P, /Indovinata/); att[s2]++; } else await W.dorme(200); }
    if (!await W.aspetta(function () { return /Solo mimo/.test(T(P)) && P.document.querySelector(".tb-round"); }, 3000)) no("non arriva il round 3 «🤐 Solo mimo»");
    // il round 3 parte da solo col conto alla rovescia (15 s)
    var t0 = Date.now();
    if (!await W.aspetta(function () { return tasto(P, /Si riparte/); }, 19000)) no("il conto alla rovescia non porta avanti da solo");
    var dt = Math.round((Date.now() - t0) / 1000);
    await premi(P, /Si riparte/);
    if (P.document.querySelector(".tb-carta .tb-vietata") || !/Solo gesti/.test(P.document.querySelector(".tb-promemoria").textContent)) no("nel round 3 la carta non è da mimo");
    giri = 0;
    while (!P.document.querySelector(".tb-riep") && giri++ < 30) { if (tasto(P, /Indovinata/)) { await premi(P, /Indovinata/); att[s2]++; } else await W.dorme(200); }
    if (!await W.aspetta(function () { return P.document.querySelector(".tb-riep"); }, 4000)) no("finito il round 3 non arriva il riepilogo");
    if (!/Tre round finiti/.test(T(P)) || !tasto(P, /Chi ha vinto/)) no("finito il round 3 non dice «Tre round finiti!»");
    misure = misure.concat(await misura("Paky", "il riepilogo del turno lungo", [".tb-riep", ".tb-tasti button"]));
    // correzione: un ✅ del round 3 diventa ❌ → la carta torna nel mazzo e si gioca ancora
    var ch = [].filter.call(P.document.querySelectorAll(".tb-riep button.tb-chip.ok"), function () { return true; }).pop();
    ch.click(); await W.dorme(200); att[s2]--; att[s2]--;   // (da +1 a −1)
    if (!/Ora tocca a/.test(T(P)) || tasto(P, /Chi ha vinto/)) no("dopo la correzione la carta non torna nel mazzo (dovrebbe toccare a qualcuno)");
    if (punti(P)[s2] !== att[s2]) no("punti dopo la correzione " + punti(P) + " invece di " + att);
    ch.click(); await W.dorme(150); att[s2]++;   // ❌ → ⏭️
    ch.click(); await W.dorme(150); att[s2]++;   // ⏭️ → ✅: di nuovo detta
    if (!/Tre round finiti/.test(T(P))) no("rimessa ✅ la carta non torna «Tre round finiti!»");
    if (punti(P)[0] !== att[0] || punti(P)[1] !== att[1]) no("punti finali " + punti(P) + " invece di " + att);
    await premi(P, /Chi ha vinto/);
    if (!await W.aspetta(function () { return P.document.querySelector(".tb-fine"); }, 3000)) no("non arriva la fine");
    if (!/Round per round \(A–B\): \d+–\d+ · \d+–\d+ · \d+–\d+/.test(T(P))) no("alla fine manca «🧺 Round per round» («" + T(P).slice(0, 200) + "»)");
    misure = misure.concat(await misura("Paky", "la fine", [".tb-fine h1", ".tb-colonne", ".tb-tasti button"]));
    await premi(P, /Classifica/);
    if (!await W.aspetta(function () { return /Fine partita/.test(T(P)); }, 4000)) no("«Classifica» non porta alla classifica");
    if (misure.length) no("misure: " + misure.join(" | "));
    var e = errori(P); if (e) no("errori: " + e);
    return "ok · punti " + att.join("-") + " · round 2 a metà turno (" + sec + " s rimasti), round 3 da solo dopo " + dt + " s, correzione che rimette la carta, misure ok";
  } });

  // ---------------------------------------------------------------- g2t2
  COPIONE.aggiungi("g2t2", { nome: "Taboo su questo telefono: 🫳 Rubata (presa, corretta, no) nei Tre round", fai: async function () {
    var misure = [];
    var P = await apriLocale(["Paky", "Giulia", "Luca", "Marco"], [/Tre round/, /^20$/, /60 s/, /^Sì$/]);
    var sq = squadreDi(P), att = [0, 0];
    await premi(P, /Via ▶/, "Via");
    if (!await W.aspetta(function () { return tasto(P, /Pronti, via/); }, 4000)) no("non arriva il primo turno");
    var s1 = squadraLocale(P, sq);
    if (!/rubare l'ultima carta/.test(T(P))) no("prima del turno non si avvisa della rubata");
    await premi(P, /Pronti, via/);
    await premi(P, /Indovinata/); await premi(P, /Indovinata/); att[s1] += 2;
    var parola = P.document.querySelector(".tb-parola").textContent;
    P.__salto += 62000;
    if (!await W.aspetta(function () { return P.document.querySelector(".tb-rub"); }, 4000)) no("a fine tempo non c'è «🫳 RUBATA?» («" + T(P).slice(0, 120) + "»)");
    if (!/RUBATA\?/.test(T(P)) || !/Squadra [AB]: dite subito/.test(T(P))) no("la rubata non dice chi ruba");
    if (T(P).indexOf(parola) >= 0) no("durata la rubata la parola si vede sullo schermo");
    misure = misure.concat(await misura("Paky", "la rubata", [".tb-rub", ".tb-tasti button"]));
    await premi(P, /L'hanno presa/); att[1 - s1]++;
    if (!await W.aspetta(function () { return P.document.querySelector(".tb-riep"); }, 4000)) no("dopo la rubata non arriva il riepilogo");
    var ru = P.document.querySelector(".tb-riep button.tb-chip.ru");
    if (!ru || ru.textContent.indexOf(parola) < 0 || !/rubata da [AB]/.test(ru.textContent)) no("nel riepilogo la carta rubata non c'è («" + P.document.querySelector(".tb-riep").textContent + "»)");
    if (punti(P)[0] !== att[0] || punti(P)[1] !== att[1]) no("punti dopo la rubata " + punti(P) + " invece di " + att);
    if (!/🫳 → ⏰/.test(T(P))) no("il promemoria della correzione non dice 🫳");
    ru.click(); await W.dorme(150); att[1 - s1]--;   // 🫳 → ⏰: non l'hanno presa
    if (!/⏰/.test(ru.textContent) || punti(P)[1 - s1] !== att[1 - s1]) no("correggendo la rubata il punto non sparisce (" + ru.textContent + ", " + punti(P) + ")");
    await premi(P, /Avanti ▶/, "Avanti");
    if (!await W.aspetta(function () { return tasto(P, /Pronti, via/); }, 3000)) no("non arriva il turno 2");
    await premi(P, /Pronti, via/);
    if (nelMazzo(P) !== 18) no("la carta tolta dalla rubata non è tornata nel mazzo (" + nelMazzo(P) + " invece di 18)");
    P.__salto += 62000;
    if (!await W.aspetta(function () { return P.document.querySelector(".tb-rub"); }, 4000)) no("turno 2: niente rubata");
    await W.dorme(5600);
    if (!/l'hanno detta in tempo\?/.test(T(P))) no("dopo 5 secondi non si chiede «l'hanno detta in tempo?»");
    if (!tasto(P, /L'hanno presa/) || !tasto(P, /❌ No/)) no("dopo i 5 secondi i tasti di chi spiega sono spariti");
    await premi(P, /❌ No/);
    if (!await W.aspetta(function () { return P.document.querySelector(".tb-riep"); }, 4000)) no("dopo «No» non arriva il riepilogo");
    if (P.document.querySelector(".tb-riep .tb-chip.ru")) no("con «No» c'è una carta rubata");
    if (!P.document.querySelector(".tb-riep .tb-chip.nu")) no("con «No» manca la carta ⏰");
    if (punti(P)[0] !== att[0] || punti(P)[1] !== att[1]) no("punti " + punti(P) + " invece di " + att);
    await premi(P, /Avanti ▶/, "Avanti");
    await premi(P, /Pronti, via/);
    if (nelMazzo(P) !== 18) no("con «No» la carta non resta nel mazzo (" + nelMazzo(P) + ")");
    if (misure.length) no("misure: " + misure.join(" | "));
    var e = errori(P); if (e) no("errori: " + e);
    return "ok · rubata presa (+1 " + "AB"[1 - s1] + "), corretta e tornata nel mazzo, «No» dopo i 5 s; misure ok";
  } });

  // ---------------------------------------------------------------- g2t3
  COPIONE.aggiungi("g2t3", { nome: "Taboo online: 🧺 Tre round + 🫳 Rubata in 4 (+ Bea che guarda), Avanti a maggioranza, rientro", fai: async function () {
    var misure = [], nomi = ["Paky", "Giulia", "Luca", "Marco"], F = {};
    var P = await W.apriTel("Paky", { x: 0, prima: salto }); F.Paky = P; senzaAnimazioni(P);
    var tess = await W.aspetta(function () { return A.tessera(P, "Taboo"); }, 6000); if (!tess) no("non trovo Taboo"); tess.click();
    if (!await W.aspetta(function () { return W.clicca(P, /Online: apro io/, ".modo-grande"); }, 3000)) no("non c'è «Online: apro io la stanza»");
    if (!await W.aspetta(function () { return /Tempo del turno/i.test(T(P)); }, 3000)) no("non vedo le regole");
    [/Tre round/, /^20$/, /60 s/, /^Sì$/].forEach(function (r) { if (!W.clicca(P, r, ".modo-chip")) no("nelle regole manca «" + r + "»"); });
    if (!W.clicca(P, /Apri la stanza/)) no("non c'è «Apri la stanza»");
    var cod = await W.aspetta(function () { var b = P.document.querySelector(".sl-cod b"); return b && /^[A-Z0-9]{4}$/.test(b.textContent) ? b.textContent : null; }, 6000);
    if (!cod) no("non vedo il codice");
    for (var i = 1; i < 4; i++) { F[nomi[i]] = await W.apriTel(nomi[i], { hash: "gioco=taboo&stanza=" + cod, x: 185 * i }); senzaAnimazioni(F[nomi[i]]); }
    if (!await W.aspetta(function () { return P.document.querySelectorAll(".tb-scelta").length === 4; }, 12000)) no("in saletta non ci sono 4 nomi");
    await W.dorme(500);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("«Comincia» spento");
    function tutti() { return nomi.map(function (n) { return F[n]; }); }
    function chi(fn) { return nomi.filter(function (n) { return fn(F[n]); }); }
    // il primo turno: chi spiega tocca «Pronti, via!»
    if (!await W.aspetta(function () { return chi(function (w) { return tasto(w, /Pronti, via/); }).length === 1; }, 8000)) no("nessuno ha «Pronti, via!»");
    var sp = chi(function (w) { return tasto(w, /Pronti, via/); })[0];
    var ctrlNome = chi(function (w) { return /Tu controlli/.test(T(w)); }), rubaNome = chi(function (w) { return /potete rubare l'ultima carta/.test(T(w)); });
    if (ctrlNome.length !== 1 || rubaNome.length !== 1) no("tra gli avversari non controlla uno solo (controlla " + ctrlNome + ", ruba " + rubaNome + ")");
    await premi(F[sp], /Pronti, via/);
    if (!await W.aspetta(function () { return F[ctrlNome[0]].document.querySelector(".tb-carta .tb-vietata") && F[sp].document.querySelector(".tb-carta .tb-vietata"); }, 4000)) no("chi spiega o chi controlla non vede la carta del round 1");
    var R = F[rubaNome[0]];
    if (R.document.querySelector(".tb-carta") || !/Occhio!/.test(T(R))) no(rubaNome[0] + " (ruba) vede la carta o non ha «🫳 Occhio!»");
    if (tasto(R, /BUZZ/)) no(rubaNome[0] + " ha il BUZZ");
    misure = misure.concat(await misura(rubaNome[0], "chi può rubare", [".tb-nascondi", ".tb-top"]));
    var p0 = punti(P).slice();
    W.reteDi(rubaNome[0]).invia({ t: "buzz", chiave: (W.vmDi(cod) || {}).chiaveCarta });   // un BUZZ a mano da chi non controlla: non vale
    await W.dorme(500);
    if (punti(P).join() !== p0.join()) no("il BUZZ di chi non controlla è valso (" + p0 + " → " + punti(P) + ")");
    // tutte le 20 carte: cambio di round a metà turno
    var giri = 0;
    while (!P.document.querySelector(".tb-round") && giri++ < 30) { if (tasto(F[sp], /Indovinata/)) await premi(F[sp], /Indovinata/); else await W.dorme(200); }
    if (!await W.aspetta(function () { return tutti().every(function (w) { return w.document.querySelector(".tb-round") && /Round 2 di 3/.test(T(w)); }); }, 5000)) no("non tutti vedono «Round 2 di 3»");
    var tasti = {}; nomi.forEach(function (n) { tasti[n] = F[n].document.querySelector(".tb-tasti .tb-btn.viola"); });
    if (nomi.some(function (n) { return !tasti[n] || !/⏩ Avanti/.test(tasti[n].textContent) || !/0 su 3/.test(tasti[n].textContent); })) no("«⏩ Avanti · 0 su 3» non c'è su tutti (" + nomi.map(function (n) { return tasti[n] && tasti[n].textContent; }) + ")");
    if (!/Si va avanti tra \d+/.test(T(P))) no("manca il conto «Si va avanti tra…»");
    if (!/continua|continui/.test(T(F[sp])) && !/Poi continui tu/.test(T(F[sp]))) no("chi spiegava non sa che continua lui");
    misure = misure.concat(await misura("Giulia", "il cambio di round online", [".tb-round", ".tb-rtab", ".tb-tasti .tb-btn"]));
    var altri = nomi.filter(function (n) { return n !== "Paky"; });
    var a1 = altri[0], a2 = altri[1];
    await premi(F[a1], /⏩ Avanti/);
    if (!await W.aspetta(function () { return /1 su 3/.test(F.Paky.document.querySelector(".tb-tasti .tb-btn.viola").textContent); }, 3000)) no("il numero non sale a «1 su 3» sull'host");
    var b1 = F[a1].document.querySelector(".tb-tasti .tb-btn.viola");
    if (!/✅ Avanti/.test(b1.textContent) || !b1.disabled) no("il mio tocco non resta «✅ Avanti» (" + b1.textContent + ")");
    if (P.document.querySelector(".tb-tasti .tb-btn.viola") !== tasti.Paky) no("sull'host il tasto è stato ridisegnato (lampeggio)");
    // chi ha toccato ricarica la pagina: ritrova il suo ✅
    F[a1] = await W.ricarica(a1); senzaAnimazioni(F[a1]);
    if (!await W.aspetta(function () { var b = F[a1].document.querySelector(".tb-tasti .tb-btn.viola"); return b && /✅ Avanti/.test(b.textContent) && /1 su 3/.test(b.textContent); }, 8000)) no(a1 + " dopo la ricarica non ritrova «✅ Avanti · 1 su 3» («" + T(F[a1]).slice(0, 120) + "»)");
    await premi(F[a2], /⏩ Avanti/);
    if (!/2 su 3/.test(P.document.querySelector(".tb-tasti .tb-btn.viola").textContent)) await W.dorme(400);
    if (!/2 su 3/.test(P.document.querySelector(".tb-tasti .tb-btn.viola").textContent)) no("non arriva a «2 su 3»");
    await premi(P, /⏩ Avanti/);
    if (!await W.aspetta(function () { return tasto(F[sp], /Pronti, via/) && /Tocca ancora a te/.test(T(F[sp])); }, 4000)) no("al terzo tocco non si riparte con «Tocca ancora a te» («" + T(F[sp]).slice(0, 120) + "»)");
    if (!/restano \d+ s/.test(T(F[sp]))) no("la ripresa non dice il tempo rimasto");
    await premi(F[sp], /Pronti, via/);
    if (!await W.aspetta(function () { return F[sp].document.querySelector(".tb-carta .tb-parola"); }, 3000)) no("round 2: niente carta");
    if (F[sp].document.querySelector(".tb-vietata") || F[ctrlNome[0]].document.querySelector(".tb-vietata")) no("nel round 2 si vedono le vietate");
    if (!/Una parola sola/.test(riga(F[sp]))) no("la riga del turno non dice il round 2 («" + riga(F[sp]) + "»)");
    // Bea arriva tardi e guarda
    F.Bea = await W.apriTel("Bea", { hash: "gioco=taboo&stanza=" + cod, x: 185 * 4 }); senzaAnimazioni(F.Bea);
    if (!await W.aspetta(function () { return F.Bea.document.querySelector(".tb-top"); }, 8000)) no("Bea non vede la partita");
    // 🫳 rubata presa e annullata dall'host
    var sqSp = (W.vmDi(cod) || {}).squadre;
    P.__salto += 70000;
    if (!await W.aspetta(function () { return tutti().every(function (w) { return /RUBATA\?/.test(T(w)); }); }, 4000)) no("a fine tempo non tutti vedono «🫳 RUBATA?»");
    if (!tasto(F[sp], /L'hanno presa/) || nomi.some(function (n) { return n !== sp && tasto(F[n], /L'hanno presa/); })) no("i tasti della rubata non sono solo di chi spiega");
    if (!/RUBATA/.test(T(F.Bea))) no("Bea (guarda) non vede la rubata");
    misure = misure.concat(await misura(sp, "la rubata online (chi spiega)", [".tb-rub", ".tb-tasti .tb-btn"]));
    var pPrima = punti(P).slice();
    await premi(F[sp], /L'hanno presa/);
    if (!await W.aspetta(function () { return tutti().every(function (w) { return /Rubata!/.test(T(w)); }); }, 3000)) no("non tutti vedono «🫳 Rubata!»");
    var pDopo = punti(P);
    if (pDopo[0] + pDopo[1] !== pPrima[0] + pPrima[1] + 1) no("la rubata non dà +1 (" + pPrima + " → " + pDopo + ")");
    await premi(P, /Annulla rubata/);
    if (!await W.aspetta(function () { return /Rubata annullata/.test(T(F[sp])); }, 3000)) no("l'annullamento non arriva a chi spiegava");
    if (punti(P).join() !== pPrima.join()) no("annullata, i punti non tornano (" + punti(P) + " invece di " + pPrima + ")");
    if (!await W.aspetta(function () { return P.document.querySelector(".tb-riep"); }, 5000)) no("dopo la rubata non arriva il riepilogo");
    if (P.document.querySelector(".tb-riep .tb-chip.ru")) no("la rubata annullata è nel riepilogo");
    // turno dopo: nessuno decide → niente rubata da sola
    var sp2 = await W.aspetta(function () { return chi(function (w) { return tasto(w, /Pronti, via/); })[0]; }, 5000);
    if (!sp2) no("non arriva il turno dopo");
    await premi(F[sp2], /Pronti, via/);
    P.__salto += 70000;
    if (!await W.aspetta(function () { return /RUBATA\?/.test(T(P)); }, 4000)) no("turno 2: niente rubata");
    P.__salto += 13000;
    if (!await W.aspetta(function () { return /Niente rubata/.test(T(F[sp2])); }, 4000)) no("senza decisione non arriva «Niente rubata» da sola");
    // terzo: rubata presa che resta nel riepilogo
    var sp3 = await W.aspetta(function () { return chi(function (w) { return tasto(w, /Pronti, via/); })[0]; }, 6000);
    if (!sp3) no("non arriva il terzo turno");
    await premi(F[sp3], /Pronti, via/);
    P.__salto += 70000;
    if (!await W.aspetta(function () { return tasto(F[sp3], /L'hanno presa/); }, 4000)) no("turno 3: niente rubata");
    await premi(F[sp3], /L'hanno presa/);
    P.__salto += 6000;
    if (!await W.aspetta(function () { return tutti().every(function (w) { var c = w.document.querySelector(".tb-riep .tb-chip.ru"); return c && /rubata da [AB]/.test(c.textContent); }); }, 5000)) no("la carta rubata non è nel riepilogo di tutti");
    // fino alla fine: chi spiega dice tutte le carte, gli altri toccano Avanti
    var passi = 0;
    while (!P.document.querySelector(".tb-fine") && passi++ < 250) {
      var fatto = false;
      for (var k = 0; k < nomi.length && !fatto; k++) {
        var w = F[nomi[k]];
        var b = tasto(w, /Pronti, via|Indovinata|⏩ Avanti|❌ No/);
        if (b) { tocca(w, b); fatto = true; }
      }
      await W.dorme(fatto ? 470 : 250);
    }
    if (!await W.aspetta(function () { return tutti().concat([F.Bea]).every(function (w) { return w.document.querySelector(".tb-fine"); }); }, 9000)) no("la partita non finisce per tutti («" + T(P).slice(0, 120) + "»)");
    if (!/Round per round \(A–B\)/.test(T(P)) || !/Carte rubate/.test(T(P))) no("alla fine mancano «Round per round» o «Carte rubate»");
    misure = misure.concat(await misura("Giulia", "la fine online", [".tb-fine h1", ".tb-colonne"]));
    if (misure.length) no("misure: " + misure.join(" | "));
    var err = W.erroriTel ? W.erroriTel() : []; if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "ok · stanza " + cod + ": controlla " + ctrlNome[0] + ", ruba " + rubaNome[0] + ", Avanti 3 su 4 col rientro, rubata presa/annullata/da sola/presa, fine per tutti";
  } });

  // ---------------------------------------------------------------- g2t4
  // g2t4: online, partita classica con la Rubata: i turni contati come prima («Turno 1 di 4»), vietate per chi controlla,
  //       rubata presa (+1 all'altra squadra, nel riepilogo di tutti), poi «❌ No»; chi spiega ricarica durante la rubata e
  //       ritrova i suoi due tasti.
  COPIONE.aggiungi("g2t4", { nome: "Taboo online classica + 🫳 Rubata: presa, rientro durante la rubata, No", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Marco"], F = {};
    var P = await W.apriTel("Paky", { x: 0, prima: salto }); F.Paky = P; senzaAnimazioni(P);
    var tess = await W.aspetta(function () { return A.tessera(P, "Taboo"); }, 6000); if (!tess) no("non trovo Taboo"); tess.click();
    if (!await W.aspetta(function () { return W.clicca(P, /Online: apro io/, ".modo-grande"); }, 3000)) no("non c'è «Online: apro io la stanza»");
    if (!await W.aspetta(function () { return /Tempo del turno/i.test(T(P)); }, 3000)) no("non vedo le regole");
    [/60 s/, /^Sì$/].forEach(function (r) { if (!W.clicca(P, r, ".modo-chip")) no("nelle regole manca «" + r + "»"); });
    W.clicca(P, /Apri la stanza/);
    var cod = await W.aspetta(function () { var b = P.document.querySelector(".sl-cod b"); return b && /^[A-Z0-9]{4}$/.test(b.textContent) ? b.textContent : null; }, 6000);
    if (!cod) no("non vedo il codice");
    for (var i = 1; i < 4; i++) { F[nomi[i]] = await W.apriTel(nomi[i], { hash: "gioco=taboo&stanza=" + cod, x: 185 * i }); senzaAnimazioni(F[nomi[i]]); }
    if (!await W.aspetta(function () { return P.document.querySelectorAll(".tb-scelta").length === 4; }, 12000)) no("in saletta non ci sono 4 nomi");
    await W.dorme(500);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("«Comincia» spento");
    function tutti() { return nomi.map(function (n) { return F[n]; }); }
    function chi(fn) { return nomi.filter(function (n) { return fn(F[n]); }); }
    var sp = await W.aspetta(function () { return chi(function (w) { return tasto(w, /Pronti, via/); })[0]; }, 8000);
    if (!sp) no("nessuno ha «Pronti, via!»");
    if (!/Turno 1 di 4/.test(riga(P))) no("nella classica non si contano i turni («" + riga(P) + "»)");
    await premi(F[sp], /Pronti, via/);
    var ctrl = await W.aspetta(function () { return chi(function (w) { return tasto(w, /BUZZ/) && w.document.querySelector(".tb-vietata"); })[0]; }, 4000);
    if (!ctrl) no("nessuno controlla con le vietate");
    if (chi(function (w) { return /Occhio!/.test(T(w)); }).length !== 1) no("non c'è uno solo che può rubare");
    await premi(F[sp], /Indovinata/);
    var p0 = punti(P).slice(), sqSp = p0[0] === 1 ? 0 : 1;
    P.__salto += 65000;
    if (!await W.aspetta(function () { return tasto(F[sp], /L'hanno presa/); }, 4000)) no("niente rubata a fine tempo");
    // chi spiega ricarica la pagina durante la rubata: ritrova i due tasti
    // (l'host che ricarica è del Passo 5: se spiega l'host, ricarica un amico che deve vedere la rubata)
    var ric = sp !== "Paky" ? sp : nomi.filter(function (n) { return n !== "Paky"; })[0];
    F[ric] = await W.ricarica(ric); senzaAnimazioni(F[ric]);
    if (!await W.aspetta(function () { return /RUBATA\?/.test(T(F[ric])); }, 6000)) no(ric + " dopo la ricarica non vede la rubata («" + T(F[ric]).slice(0, 120) + "»)");
    if (!await W.aspetta(function () { return tasto(F[sp], /L'hanno presa/) && tasto(F[sp], /❌ No/); }, 6000)) no(sp + " dopo la ricarica non ritrova i tasti della rubata («" + T(F[sp]).slice(0, 120) + "»)");
    await premi(F[sp], /L'hanno presa/);
    P.__salto += 6000;
    if (!await W.aspetta(function () { return tutti().every(function (w) { var c = w.document.querySelector(".tb-riep .tb-chip.ru"); return c && c.textContent.indexOf("rubata da " + "AB"[1 - sqSp]) >= 0; }); }, 5000)) no("la carta rubata non è nel riepilogo di tutti");
    if (punti(P)[1 - sqSp] !== p0[1 - sqSp] + 1) no("la rubata non dà +1 all'altra squadra (" + p0 + " → " + punti(P) + ")");
    var sp2 = await W.aspetta(function () { return chi(function (w) { return tasto(w, /Pronti, via/); })[0]; }, 5000);
    if (!sp2 || !/Turno 2 di 4/.test(riga(P))) no("non arriva «Turno 2 di 4»");
    await premi(F[sp2], /Pronti, via/);
    P.__salto += 65000;
    if (!await W.aspetta(function () { return tasto(F[sp2], /❌ No/); }, 4000)) no("turno 2: niente rubata");
    var p1 = punti(P).slice();
    await premi(F[sp2], /❌ No/);
    if (!await W.aspetta(function () { return /Niente rubata/.test(T(P)); }, 3000)) no("dopo «No» non si vede «Niente rubata»");
    if (punti(P).join() !== p1.join()) no("con «No» cambiano i punti");
    var err = W.erroriTel ? W.erroriTel() : []; if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "ok · stanza " + cod + ": turni contati, rubata presa (spiega " + sp + ", " + ric + " ricarica e la ritrova), poi «No»";
  } });
})();

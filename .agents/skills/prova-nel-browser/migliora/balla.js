// PROVE DEI MIGLIORAMENTI DELLA BALLA COLOSSALE: «😂 Che balla!» (risate, Balla d'oro) e «👥 Parliamo di te».
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("migliora/balla.js"); await COPIONE.prova("balla1")
//
// balla1: le regole senza grafica (punti del protagonista, Balla d'oro, piano dei round) e le 140 domande sugli amici
//         (tutte col {nome}, 3 balle della redazione corte, niente maschile/femminile tipo "stanco").
// balla2: online in 3 (Paky host, Luca, Sara), 2 round «Solo amici», «Che balla!» accesa, tutto dai tasti dei telefoni:
//         il protagonista vede «Scrivi la VERITÀ», chi aveva già scritto proprio la verità deve riscriverla, il protagonista
//         non vota, i 😂 (mai sulla propria balla), la Balla d'oro (pari: due), i punti del round, chi ricarica sulla
//         classifica ritrova tutto, «⏩ Avanti» toccato da 2 su 3 fa partire subito, secondo protagonista diverso, fine coi premi.
// balla3: online, il protagonista spegne il telefono mentre si scrive: «si passa a una notizia» e la partita finisce lo stesso.
// balla4: sullo stesso telefono in 3, 3 round «Notizie e amici» con «Che balla!», dalla home alla fine, solo coi tasti;
//         misure (360x640 e 412x915) del foglio della verità, del tasto 😂 e della Balla d'oro.
// balla5: nella Sala (Paky, Luca, Sara giocano; Giulia non scelta guarda e può ridere), 1 round fino alla fine.
// balla6: chi ricarica: il protagonista dopo aver scritto la verità (niente foglio di nuovo), un amico al voto (ritrova il foglio),
//         chi ha toccato 😂 (lo ritrova già messo).
// Le regole della partita per la prova: w.__imp (le legge solo l'host, all'avvio), con apriTel(nome, { spiaBalla: true }).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }

  // ---- la spia: le regole accorciate (w.__imp) entrano nelle impostazioni della Balla ----
  if (!W.__prepBalla) {
    W.__prepBalla = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepBalla(w, nome, opz);
      if (!opz || !opz.spiaBalla) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && g.id === "balla") w.__gBalla = g;
          if (g && g.id === "balla" && !g.__spiato) {
            g.__spiato = true; var av = g.avvia;
            g.avvia = function (t) { if (w.__imp && t.impostazioni) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; }); w.__tB = t;
              if (w.__scelti) t.puoSedersi = function (id, nome) { return w.__scelti.indexOf(String(nome || "").trim()) >= 0; };   // nella Sala si siede solo chi è in lista
              return av.apply(this, arguments); };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }

  // ---- aiuti ----
  function veloAperto(w) { return w && w.document.querySelector(".bc-velo.on:not(.via)"); }
  function foglio(w) { var v = veloAperto(w); return v ? v.innerText.replace(/\s+/g, " ") : ""; }
  function scrivi(w, testo) {
    var v = veloAperto(w), ta = v && v.querySelector(".bc-penna"), ok = v && v.querySelector(".bc-ok"); if (!ta || !ok) return false;
    ta.value = testo; ta.dispatchEvent(new w.Event("input", { bubbles: true })); ok.click(); return true;
  }
  // vota la prima risposta che va bene (pred sul testo); false se il foglio del voto non c'è
  function vota(w, pred) {
    var v = veloAperto(w); if (!v) return false;
    var b = [].filter.call(v.querySelectorAll(".bc-scelta"), function (x) { return !x.disabled && pred(x.querySelector(".tx").textContent); })[0];
    if (!b) return false;
    b.click(); var ok = v.querySelector(".bc-ok"); if (!ok || ok.disabled) return false; ok.click(); return true;
  }
  function nomeDi(v, id) { var p = (v.players || []).filter(function (x) { return x.id === id; })[0]; return p ? p.nome : null; }
  function telDi(v, id) { var n = nomeDi(v, id); return n ? W.finestra(n) : null; }
  // tocca tutti i 😂 a vista e accesi di un telefono (una volta per tasto); restituisce quanti
  function rideTutti(w) {
    var n = 0;
    [].forEach.call(w.document.querySelectorAll(".bc-ride"), function (b) { if (b.disabled || b.__toccato) return; b.__toccato = 1; b.click(); n++; });
    return n;
  }
  // l'elemento sta tutto dentro lo schermo del telefono?
  function dentroSchermo(w, el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.left >= -1 && r.top >= -1 && r.right <= w.innerWidth + 1 && r.bottom <= w.innerHeight + 1;
  }
  async function misura(nome, wh, cosa) {
    var f = document.getElementById("tel-" + nome), w = W.finestra(nome);
    f.style.width = wh[0] + "px"; f.style.height = wh[1] + "px"; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(900);
    var esito = cosa(w), scorre = w.document.scrollingElement.scrollHeight > w.innerHeight + 2;
    if (scorre) esito = (esito || "") + " · la pagina scorre";
    return esito;
  }
  async function torna360(nome) { var f = document.getElementById("tel-" + nome), w = W.finestra(nome); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize")); await W.dorme(300); }
  function errori() { var e = W.erroriTel(); return e.length ? e.slice(0, 3).join(" / ") : ""; }

  // ===================== balla1: le regole =====================
  COPIONE.aggiungi("balla1", { nome: "Balla: regole di «Che balla!» e «Parliamo di te», domande sugli amici", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0, spiaBalla: true }), B = w.__balla, note = [];
    if (!B || !B.calcolaOro) no("non vedo le regole della Balla (window.__balla)");
    // scelte: 0 = verità, 1 = balla di Luca (posto 1), 2 = balla di Sara (posto 2), 3 = della redazione
    var sc = [{ testo: "vero", vera: true, autori: [] }, { testo: "a", vera: false, autori: [1] }, { testo: "b", vera: false, autori: [2] }, { testo: "c", vera: false, autori: [], casa: true }];
    // Paky (0) è il protagonista: non vota; Luca trova la verità, Sara ci casca con la balla di Luca
    var d = B.calcola(sc, [null, 0, 1], 3, 1, 2, 0, [0, 2, 1, 3]);
    if (d[0].capito !== 1) no("il protagonista doveva prendere +1 (l'ha trovata Luca): " + JSON.stringify(d[0]));
    if (d[1].vera !== 2 || d[1].inganni !== 1 || d[1].oro !== 1) no("Luca: verità +2, inganno +1, Balla d'oro +1 attesi: " + JSON.stringify(d[1]));
    if (d[2].oro !== 0 || d[2].risate !== 1) no("Sara: niente Balla d'oro e 1 risata: " + JSON.stringify(d[2]));
    if (d[3]) no("calcola ha più giocatori del dovuto");
    // il voto del protagonista (se arrivasse) non conta
    var d2 = B.calcola(sc, [0, 0, null], 3, 2, 2, 0, null);
    if (d2[0].vera !== 0 || d2[0].capito !== 2) no("con punti doppi: il protagonista non prende il suo voto e +2 per Luca: " + JSON.stringify(d2[0]));
    // Balla d'oro: la redazione non vince mai; pari = tutte
    var o = B.calcolaOro(sc, [0, 2, 2, 9]);
    if (!o || o.n !== 2 || o.ks.join() !== "1,2") no("Balla d'oro a pari 😂: " + JSON.stringify(o));
    if (B.calcolaOro(sc, [5, 0, 0, 4])) no("Balla d'oro senza 😂 sulle balle dei giocatori");
    // il piano dei round
    var pr = function (n, m) { return B.pianoRound(n, m).join(""); };
    if (pr(5, "misto") !== "nanan" || pr(3, "misto") !== "nan" || pr(7, "misto") !== "nananan" || pr(3, "solo") !== "aaa" || pr(5, "no") !== "nnnnn" || pr(1, "misto") !== "n")
      no("piano dei round: " + [pr(5, "misto"), pr(3, "misto"), pr(7, "misto"), pr(3, "solo"), pr(5, "no"), pr(1, "misto")].join(" "));
    // le domande sugli amici
    var L = w.SG_BALLA_AMICI || [], visti = {}, male = [];
    if (L.length < 120) no("poche domande sugli amici: " + L.length);
    L.forEach(function (q, i) {
      var tx = String(q.domanda || "");
      if (!/\{nome\}/.test(tx)) male.push(i + " senza {nome}");
      if (!/\.\.\.$/.test(tx)) male.push(i + " non finisce con ...");
      if (/\b(stanc|piccol|nervos|arrabbiat|dispost)[oa]\b/i.test(tx.replace(/il piccolo principe/i, ""))) male.push(i + " maschile/femminile: " + tx);
      var k = B.norm(tx); if (visti[k]) male.push(i + " doppia"); visti[k] = 1;
      if (!q.balleCasa || q.balleCasa.length !== 3) male.push(i + " balleCasa ≠ 3");
      (q.balleCasa || []).forEach(function (b) { if (!b || b.length > 45 || !B.norm(b)) male.push(i + " balla «" + b + "»"); });
      var full = B.riempi(tx, "Gianmarco"), p = B.pezzi(full);
      if (!p.prima || /\{|\}/.test(full) || full.length > 120) male.push(i + " lunga o rotta: " + full);
    });
    if (male.length) no(male.length + " domande da sistemare: " + male.slice(0, 4).join(" | "));
    // la riga «📜 Si gioca così»
    var g = w.__gBalla;
    if (g && g.riassunto) {
      var r1 = g.riassunto({ round: 5, amici: "misto", ride: true }), r2 = g.riassunto({ round: 3, amici: "no", ride: false });
      if (r1 !== "5 round · Notizie e amici · 😂 Che balla!" || r2 !== "3 round · Solo notizie · senza «Che balla!»") no("riassunto: " + r1 + " / " + r2);
    } else no("non vedo il gioco registrato (riassunto)");
    return "regole ok, " + L.length + " domande sugli amici ok " + note.join(" ");
  } });

  // ===================== l'online: host + 2 amici =====================
  async function partita(imp) {
    var P = await W.apriTel("Paky", { x: 0, spiaBalla: true, prima: function (w) { w.__imp = imp; } });
    var C = await W.apriStanza(P, "La Balla Colossale");
    await W.apriTel("Luca", { hash: "gioco=balla&stanza=" + C, x: 185, spiaBalla: true });
    await W.apriTel("Sara", { hash: "gioco=balla&stanza=" + C, x: 370, spiaBalla: true });
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 3; }, 10000)) no("nella saletta non ci sono in 3 (" + (vm(C).players || []).map(function (p) { return p.nome; }) + ")");
    var riga = await W.aspetta(function () { var e = P.document.querySelector(".bc-lobby"); return e && e.textContent; }, 3000);
    if (!riga || !/round/.test(riga)) no("nella saletta manca la riga della Balla («" + riga + "»)");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 8000)) no("Paky non trova «Comincia» («" + T(P).slice(0, 90) + "»)");
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    return { P: P, C: C };
  }
  // un round qualsiasi, fino alla classifica (o alla fine): tutti scrivono, votano la prima risposta, niente 😂
  async function roundSemplice(C, ride, verita) {
    var fino = Date.now() + 180000, fatti = {}, g0 = vm(C).giro;
    while (Date.now() < fino) {
      var v = vm(C);
      if (v.fase === "fine" || (v.giro !== g0 && v.fase === "notizia") || v.fase === "punti") return v;
      (v.players || []).forEach(function (p) {
        if (p.via) return; var w = W.finestra(p.nome), k = v.fase + "|" + v.giro + "." + (v.rif || 0) + "|" + p.id;
        if (fatti[k] || !w) return;
        if (v.fase === "scrittura" && veloAperto(w)) { fatti[k] = scrivi(w, v.amici && v.prot === p.id ? (verita || "il mare d'inverno") : "balla " + p.nome + " " + v.giro); }
        if (v.fase === "voto" && veloAperto(w)) { fatti[k] = vota(w, function () { return true; }); }
      });
      if (ride && v.fase === "rivela") Object.keys(W.BR.tel).forEach(function (n) { var w = W.finestra(n); if (w) rideTutti(w); });   // (anche chi guarda)
      await W.dorme(300);
    }
    no("il round non finisce (fase " + vm(C).fase + ")");
  }

  // ===================== balla2 =====================
  COPIONE.aggiungi("balla2", { nome: "Balla online: Parliamo di te, Che balla!, Balla d'oro, ricarica, ⏩ Avanti", fai: async function () {
    var X0 = await partita({ round: 2, amici: "solo", ride: true }), P = X0.P, C = X0.C, note = [];
    if (!await W.aspetta(function () { return vm(C).fase === "scrittura"; }, 30000)) no("non si arriva a scrivere (fase " + vm(C).fase + ")");
    var v = vm(C), prot = v.prot;
    if (!v.amici || !prot) no("il primo round non è «Parliamo di te» (amici " + v.amici + ", prot " + prot + ")");
    var altri = v.players.map(function (p) { return p.id; }).filter(function (id) { return id !== prot; });
    var wP = telDi(v, prot), wX = telDi(v, altri[0]), wY = telDi(v, altri[1]), nP = nomeDi(v, prot), nX = nomeDi(v, altri[0]), nY = nomeDi(v, altri[1]);
    if (!/parliamo di/i.test(T(wX)) || v.domanda.indexOf(nP) < 0) no("la domanda non parla di " + nP + ": " + v.domanda);
    if (!await W.aspetta(function () { return veloAperto(wP) && veloAperto(wX) && veloAperto(wY); }, 8000)) no("i fogli non si aprono");
    if (!/Scrivi la VERITÀ/.test(foglio(wP))) no(nP + " (protagonista) non legge «Scrivi la VERITÀ» («" + foglio(wP).slice(0, 80) + "»)");
    if (!/La tua balla/.test(foglio(wX))) no(nX + " non legge «La tua balla»");
    if (!/parliamo di/i.test(T(wY))) no("sul telefono di " + nY + " non c'è «Parliamo di»");
    // X scrive proprio la verità prima che il protagonista la scriva: poi dovrà cambiarla
    scrivi(wX, "pizza con ananas");
    if (!await W.aspetta(function () { return (vm(C).fatti || []).indexOf(altri[0]) >= 0; }, 5000)) no("la balla di " + nX + " non arriva");
    scrivi(wP, "la pizza con l'ananas");
    if (!await W.aspetta(function () { var f = vm(C).fatti || []; return f.indexOf(prot) >= 0 && f.indexOf(altri[0]) < 0; }, 5000)) no("la verità del protagonista non toglie la balla uguale di " + nX + " (" + JSON.stringify(vm(C).fatti) + ")");
    if (!await W.aspetta(function () { return /proprio la risposta di/.test(foglio(wX)); }, 8000)) no(nX + " non riapre il foglio con «È proprio la risposta di…» («" + foglio(wX).slice(0, 80) + "»)");
    scrivi(wX, "il sushi col ketchup"); scrivi(wY, "le lumache al cioccolato");
    // si vota: il protagonista no
    if (!await W.aspetta(function () { return vm(C).fase === "voto"; }, 30000)) no("non si arriva al voto (fase " + vm(C).fase + ")");
    var testi = vm(C).scelte.map(function (s) { return s.testo; });
    ["la pizza con l'ananas", "il sushi col ketchup", "le lumache al cioccolato"].forEach(function (x) { if (testi.indexOf(x) < 0) no("sul tabellone manca «" + x + "» (" + testi.join(" | ") + ")"); });
    if (testi.indexOf("pizza con ananas") >= 0) no("la balla uguale alla verità è rimasta sul tabellone");
    if (!await W.aspetta(function () { return veloAperto(wX) && veloAperto(wY); }, 8000)) no("i fogli del voto non si aprono");
    if (!await W.aspetta(function () { return /non voti/.test(T(wP)); }, 6000)) no(nP + " (protagonista) non legge «non voti» («" + T(wP).slice(-120) + "»)");
    if (veloAperto(wP)) no("il protagonista ha il foglio del voto aperto");
    var miaX = [].filter.call(veloAperto(wX).querySelectorAll(".bc-scelta"), function (b) { return /sushi/.test(b.textContent); })[0];
    if (!miaX || !miaX.disabled || !/la tua/.test(miaX.textContent)) no("la balla di " + nX + " non è segnata «la tua» nel suo voto");
    vota(wX, function (t) { return t === "la pizza con l'ananas"; });
    vota(wY, function (t) { return t === "il sushi col ketchup"; });
    // la rivelazione: tutti toccano i 😂 che hanno a vista
    if (!await W.aspetta(function () { return vm(C).fase === "rivela"; }, 30000)) no("non si arriva alla rivelazione");
    var miaVista = false, fino = Date.now() + 60000;
    while (Date.now() < fino && vm(C).fase === "rivela") {
      [wP, wX, wY].forEach(rideTutti);
      [].forEach.call(wX.document.querySelectorAll(".bc-ride.mia"), function () { miaVista = true; });
      await W.dorme(250);
    }
    if (!miaVista) no(nX + " non ha visto il suo 😂 spento sulla sua balla");
    v = vm(C);
    if (v.fase !== "oro") no("dopo la rivelazione non c'è la Balla d'oro (fase " + v.fase + ", risate " + JSON.stringify(v.risate) + ")");
    var kX = testi.indexOf("il sushi col ketchup"), kY = testi.indexOf("le lumache al cioccolato");
    var rX = v.risate[v.scelte.map(function (s) { return s.testo; }).indexOf("il sushi col ketchup")] || [], rY = v.risate[v.scelte.map(function (s) { return s.testo; }).indexOf("le lumache al cioccolato")] || [];
    if (rX.indexOf(altri[0]) >= 0 || rY.indexOf(altri[1]) >= 0) no("qualcuno ha riso della sua balla");
    if (rX.length !== 2 || rY.length !== 2) no("😂 attesi 2 e 2: sushi " + rX.length + ", lumache " + rY.length);
    if (!v.oro || v.oro.n !== 2 || v.oro.ks.length !== 2) no("Balla d'oro: attese due a pari 😂: " + JSON.stringify(v.oro));
    if (!await W.aspetta(function () { return /Balle d'oro del round/.test(T(wY)); }, 4000)) no("sul telefono non c'è «Balle d'oro del round»");
    // i punti: protagonista +1 (l'ha capita X), X +2 verità +1 inganno +1 oro = 4, Y +1 oro
    if (!await W.aspetta(function () { return vm(C).fase === "punti"; }, 12000)) no("non arrivano i punti");
    v = vm(C);
    var u = v.ultimo || {};
    if (u[prot] !== 1 || u[altri[0]] !== 4 || u[altri[1]] !== 1) no("punti del round sbagliati: " + JSON.stringify(u) + " (prot " + nP + ", X " + nX + ", Y " + nY + ")");
    // chi ricarica sulla classifica ritrova la classifica e «⏩ Avanti»
    var chiRic = nX === "Paky" ? nY : nX;
    await W.ricarica(chiRic);
    var wR = W.finestra(chiRic);
    if (!await W.aspetta(function () { return wR.document.querySelector(".bc-avanti"); }, 15000)) no(chiRic + " dopo la ricarica non ritrova «⏩ Avanti» («" + T(wR).slice(0, 100) + "»)");
    if (vm(C).fase !== "punti") no("la classifica è finita prima della prova di «⏩ Avanti»");
    var rim0 = vm(C).rimMs, t0 = Date.now();
    wR.document.querySelector(".bc-avanti").click();
    if (!await W.aspetta(function () { return (vm(C).avanti || []).length === 1 && /1 su 2/.test(T(P)); }, 4000)) no("dopo un tocco di «⏩ Avanti» non c'è «1 su 2» (" + JSON.stringify(vm(C).avanti) + ")");
    if (vm(C).fase !== "punti") no("con un tocco solo su 3 si è andati avanti");
    var altroW = chiRic === "Paky" ? W.finestra("Luca") : P;
    if (!await W.aspetta(function () { var b = altroW.document.querySelector(".bc-avanti"); return b && !b.disabled && (b.click(), true); }, 4000)) no("il secondo telefono non trova «⏩ Avanti»");
    if (!await W.aspetta(function () { return vm(C).fase === "notizia"; }, 4000)) no("con 2 «⏩ Avanti» su 3 non si parte subito (fase " + vm(C).fase + ")");
    note.push("Avanti dopo " + Math.round((Date.now() - t0) / 1000) + " s invece di " + Math.round((rim0 || 0) / 1000));
    // round 2: un altro protagonista, a punti doppi; fino alla fine
    if (!await W.aspetta(function () { return vm(C).fase === "scrittura"; }, 20000)) no("il secondo round non arriva a scrivere");
    var prot2 = vm(C).prot;
    if (!vm(C).amici || prot2 === prot) no("il secondo protagonista doveva essere un altro (" + prot + " → " + prot2 + ")");
    var fine = await roundSemplice(C, false);
    if (fine.fase !== "fine") no("la partita non finisce dopo 2 round (fase " + fine.fase + ")");
    if (!fine.classifica || fine.classifica.length !== 3) no("classifica finale strana: " + JSON.stringify(fine.classifica));
    var tot = fine.classifica.filter(function (r) { return r.id === altri[0]; })[0].tot;
    if (!tot || tot.risate !== 2 || tot.ori !== 1) no("i numeri della partita di " + nX + " (risate 2, Balle d'oro 1): " + JSON.stringify(tot));
    // (dopo la «fine» il telefono fa vedere ancora la rivelazione dell'ultimo round: i premi arrivano dopo; li guarda chi ha ricaricato)
    var vistoPremi = false;
    if (!await W.aspetta(function () { var s = T(W.finestra(chiRic)); if (/premi della serata/.test(s)) vistoPremi = true; return vistoPremi && /😂\s*Balla d'oro/.test(s); }, 60000)) no("tra i premi della serata non c'è «Balla d'oro» (premi visti: " + vistoPremi + ", «" + T(W.finestra(chiRic)).slice(0, 100) + "»)");
    var e = errori(); if (e) no("errori: " + e);
    return "ok · " + note.join(" · ");
  } });

  // ===================== balla6: chi rientra =====================
  // online in 3, 1 round «Solo amici» con «Che balla!»: il protagonista scrive la verità e ricarica (ritrova l'attesa, non il foglio);
  // un amico ricarica prima di votare (ritrova il foglio del voto); un altro tocca 😂 e ricarica (ritrova il suo 😂 già messo).
  COPIONE.aggiungi("balla6", { nome: "Balla online: chi ricarica mentre si scrive, si vota e si ride ritrova tutto", fai: async function () {
    var X0 = await partita({ round: 1, amici: "solo", ride: true }), C = X0.C, note = [];
    if (!await W.aspetta(function () { return vm(C).fase === "scrittura"; }, 30000)) no("non si arriva a scrivere");
    var v = vm(C), prot = v.prot, altri = v.players.map(function (p) { return p.id; }).filter(function (id) { return id !== prot && id !== "host"; });
    if (!altri.length) no("nessun amico oltre all'host e al protagonista");
    var nP = nomeDi(v, prot), nA = nomeDi(v, altri[0]);
    if (!await W.aspetta(function () { return veloAperto(W.finestra(nP)); }, 8000)) no(nP + " non ha il foglio della verità");
    scrivi(W.finestra(nP), "le patatine fritte");
    if (!await W.aspetta(function () { return (vm(C).fatti || []).indexOf(prot) >= 0; }, 5000)) no("la verità di " + nP + " non arriva");
    if (prot !== "host") {
      await W.ricarica(nP);
      var wP = W.finestra(nP);
      if (!await W.aspetta(function () { return wP.document.querySelector(".st-vista") && /parliamo di/i.test(T(wP)); }, 15000)) no(nP + " dopo la ricarica non ritrova la partita («" + T(wP).slice(0, 100) + "»)");
      await W.dorme(1500);
      if (veloAperto(wP)) no(nP + " dopo la ricarica ha di nuovo il foglio per scrivere (la verità l'aveva già scritta)");
      note.push(nP + " (protagonista) ricarica: aspetta gli altri");
    }
    v = vm(C);
    v.players.forEach(function (p) { if (p.id !== prot) { var w = W.finestra(p.nome); if (veloAperto(w)) scrivi(w, "balla di " + p.nome); } });
    if (!await W.aspetta(function () { return vm(C).fase === "voto"; }, 40000)) no("non si arriva al voto (fase " + vm(C).fase + ")");
    // un amico ricarica prima di votare: ritrova il foglio del voto
    await W.ricarica(nA);
    if (!await W.aspetta(function () { return veloAperto(W.finestra(nA)) && W.finestra(nA).document.querySelector(".bc-scelta"); }, 15000)) no(nA + " dopo la ricarica non ritrova il foglio del voto («" + T(W.finestra(nA)).slice(0, 100) + "»)");
    note.push(nA + " ricarica al voto: ritrova il foglio");
    v = vm(C);
    v.players.forEach(function (p) { if (p.id !== prot) vota(W.finestra(p.nome), function () { return true; }); });
    if (!await W.aspetta(function () { return vm(C).fase === "rivela"; }, 30000)) no("non si arriva alla rivelazione");
    // chi tocca 😂 e ricarica ritrova il suo 😂 già messo (arancione, non si tocca due volte)
    var chiR = altri[0], nR = nomeDi(v, chiR), fatto = false, fino = Date.now() + 50000;
    while (Date.now() < fino && vm(C).fase === "rivela" && !fatto) {
      var w = W.finestra(nR), b = w.document.querySelector(".bc-ride:not([disabled]):not(.mio)");
      if (b) {
        b.click();
        if (await W.aspetta(function () { return (vm(C).risate || []).some(function (l) { return l.indexOf(chiR) >= 0; }); }, 4000)) {
          var passo = vm(C).passo;
          await W.ricarica(nR);
          if (vm(C).fase === "rivela" && vm(C).passo === passo) {
            var ok = await W.aspetta(function () { return W.finestra(nR).document.querySelector(".bc-ride.mio"); }, 8000);
            if (vm(C).fase === "rivela" && vm(C).passo === passo) { if (!ok) no(nR + " dopo la ricarica non vede il suo 😂 già messo"); fatto = true; note.push(nR + " ricarica dopo 😂: lo ritrova"); }
          }
        }
      }
      await W.dorme(300);
    }
    if (!fatto) note.push("(😂 + ricarica: la rivelazione è andata avanti troppo in fretta, non provato)");
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 90000)) no("la partita non finisce (fase " + vm(C).fase + ")");
    var e = errori(); if (e) no("errori: " + e);
    return "ok · " + note.join(" · ");
  } });

  // ===================== balla3 =====================
  COPIONE.aggiungi("balla3", { nome: "Balla online: il protagonista spegne il telefono, si passa a una notizia", fai: async function () {
    var X0 = await partita({ round: 2, amici: "solo", ride: false }), C = X0.C, fatto = false, giri = 0;
    while (!fatto && giri++ < 2) {
      if (!await W.aspetta(function () { return vm(C).fase === "scrittura"; }, 40000)) no("non si arriva a scrivere");
      var v = vm(C);
      if (v.amici && v.prot !== "host") {
        var n = nomeDi(v, v.prot);
        W.spegni(n);   // (l'«addio» arriva dopo 20 secondi: prima si aspetta che il telefono torni)
        if (!await W.aspetta(function () { var x = vm(C); return x.fase === "notizia" && x.saltato === n && !x.amici; }, 35000)) no("spento " + n + " (protagonista), non si passa a una notizia (fase " + vm(C).fase + ", saltato " + vm(C).saltato + ")");
        if (!await W.aspetta(function () { return /non ha scritto la risposta/.test(T(X0.P)); }, 5000)) no("l'host non legge «… non ha scritto la risposta»");
        fatto = true;
      }
      var r = await roundSemplice(C, false);
      if (r.fase === "punti") { await W.aspetta(function () { return vm(C).fase !== "punti"; }, 25000); }
    }
    if (!fatto) return "(per caso il protagonista è stato sempre l'host: niente da provare, ripeti)";
    if (vm(C).fase !== "fine") { var r2 = await roundSemplice(C, false); if (r2.fase === "punti") await W.aspetta(function () { return vm(C).fase === "fine"; }, 120000); }
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 120000)) no("la partita non finisce (fase " + vm(C).fase + ")");
    var e = errori(); if (e) no("errori: " + e);
    return "ok: si è passati a una notizia e la partita è finita";
  } });

  // ===================== balla5 =====================
  // nella Sala: Paky apre la Balla («Online con gli amici»), Luca e Sara giocano, Giulia (non scelta) guarda e può ridere;
  // un round (notizia) fino alla fine; regole dell'host nella riga «📜 Si gioca così».
  COPIONE.aggiungi("balla5", { nome: "Balla nella Sala: chi guarda ride anche lui, partita fino alla fine", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true, spiaBalla: true, prima: function (w) { w.__imp = { round: 1, amici: "misto", ride: true }; w.__scelti = ["Paky", "Luca", "Sara"]; } });
    var X0 = await A.salaDaGioco("Paky", "La Balla Colossale"), S = X0.S, C = X0.C;
    var tel = {};
    for (var i = 0; i < 3; i++) { var n = ["Luca", "Sara", "Giulia"][i]; tel[n] = await W.apriTel(n, { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true, spiaBalla: true }); }
    if (!await W.aspetta(function () { return (vm(C).players || []).length >= 3; }, 15000)) no("nella saletta della Balla non sono in 3 (" + JSON.stringify((vm(C).players || []).map(function (p) { return p.nome; })) + ", guarda " + JSON.stringify(vm(C).guarda) + ")");
    await W.dorme(800);
    var t0 = Date.now(), visto = "";
    while (Date.now() - t0 < 20000 && (vm(C).fase || "lobby") === "lobby") {
      W.clicca(P, /^\s*(▶\s*)?(Comincia|Via ▶|Continua ▶)/, ".sl-go, .piede button, button");
      visto = T(P).slice(0, 160);
      await W.dorme(500);
    }
    if ((vm(C).fase || "lobby") === "lobby") no("la Balla non comincia nella Sala («" + visto + "»)");
    var v0 = vm(C), chi = v0.players.map(function (p) { return p.nome; }), guarda = (v0.guarda || []).length;
    var r = await roundSemplice(C, true);
    if (r.fase !== "fine") no("la partita non finisce (fase " + r.fase + ")");
    var idG = A.mioId("Giulia");
    if (!idG || (v0.guarda || []).indexOf(idG) < 0) no("Giulia (non scelta) non guarda (guarda " + JSON.stringify(v0.guarda) + ")");
    if (!(r.risate || []).some(function (l) { return l.indexOf(idG) >= 0; })) no("i 😂 di Giulia (guarda) non sono arrivati: " + JSON.stringify(r.risate));
    var e = errori(); if (e) no("errori: " + e);
    return "ok · giocano " + chi.join(", ") + (guarda ? " · " + guarda + " guarda" : "") + " · risate " + JSON.stringify((r.risate || []).map(function (l) { return l.length; }));
  } });

  // ===================== balla4 =====================
  COPIONE.aggiungi("balla4", { nome: "Balla sullo stesso telefono: 3 round notizie e amici con Che balla!, misure", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), note = [], misure = [];
    // (con la finestra del browser nascosta le transizioni restano ferme al primo fotogramma: la barra dei tasti resterebbe sotto lo schermo)
    var stF = P.document.createElement("style"); stF.textContent = ".st-barra{transition:none!important}"; P.document.head.appendChild(stF);
    var tess = await W.aspetta(function () { return A.tessera(P, "La Balla Colossale"); }, 6000);
    if (!tess) no("non trovo la tessera"); tess.click();
    var bm = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".modo-grande"), function (b) { return /Su questo telefono/.test(b.textContent); }); }, 4000);
    if (!bm) no("non c'è «Su questo telefono»"); bm.click();
    if (!await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 3000)) no("non si scrivono i nomi");
    while (P.document.querySelectorAll(".sala-riga input").length < 3) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = ["Paky", "Giulia", "Luca"][k]; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    W.clicca(P, /Avanti/);
    if (!await W.aspetta(function () { return W.clicca(P, /3 round/, ".modo-chip"); }, 4000)) no("nelle regole non c'è «3 round» («" + T(P).slice(0, 100) + "»)");
    if (!/notizie e amici/i.test(T(P)) || !/che balla/i.test(T(P))) no("nelle regole mancano «Notizie e amici» o «Che balla!» («" + T(P).slice(0, 200) + "»)");
    var bAv = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Avanti|Comincia|Gioca|Via|▶/.test(x.textContent) && !x.disabled; });
    if (!bAv) no("non trovo il tasto per cominciare"); bAv.click();
    if (!await W.aspetta(function () { return P.document.querySelector(".st-vista"); }, 5000)) no("lo studio non si apre");
    var fino = Date.now() + 420000, n = 0, testate = {}, visto = { vero: 0, ride: 0, oro: 0 };
    while (Date.now() < fino) {
      if (!P.document.querySelector(".st-vista") && /🏆|Rivincita|Vince/.test(T(P))) break;
      var ts = P.document.querySelector(".bc-sch .bc-testata"); if (ts) testate[ts.textContent.replace(/ · round.*/, "") + " · " + ts.textContent.replace(/.* · /, "")] = 1;
      var v = veloAperto(P);
      if (v) {
        if (v.querySelector(".bc-penna")) {
          var vero = /Scrivi la VERITÀ/.test(foglio(P));
          if (vero && !visto.vero++) {
            misure.push(await misura("Paky", [360, 640], function (w) { return dentroSchermo(w, veloAperto(w).querySelector(".bc-ok")) ? "" : "360x640: «Fatto» fuori schermo"; }));
            misure.push(await misura("Paky", [412, 915], function (w) { return dentroSchermo(w, veloAperto(w).querySelector(".bc-ok")) ? "" : "412x915: «Fatto» fuori schermo"; }));
            await torna360("Paky");
          }
          scrivi(P, vero ? "la verita numero " + (n++) : "balla numero " + (n++));
        } else vota(P, function () { return true; });
      } else {
        var r = P.document.querySelector(".bc-ride:not([disabled])");
        if (r && !r.__toccato && !visto.ride++) {
          misure.push(await misura("Paky", [360, 640], function (w) { var b = w.document.querySelector(".bc-ride"); return dentroSchermo(w, b) ? "" : "360x640: 😂 fuori schermo"; }));
          misure.push(await misura("Paky", [412, 915], function (w) { var b = w.document.querySelector(".bc-ride"); return dentroSchermo(w, b) ? "" : "412x915: 😂 fuori schermo"; }));
          await torna360("Paky");
        }
        rideTutti(P);
        if (P.document.querySelector(".bc-oro") && !visto.oro++) {
          await W.dorme(1200);
          var tutto = function (w) { var m = [".bc-coppa", ".bc-big.oro", ".bc-autori", ".st-barra.on button"].filter(function (s) { return !dentroSchermo(w, w.document.querySelector(s)); }); return m.length ? w.innerWidth + "x" + w.innerHeight + ": fuori " + m.join(", ") : ""; };
          misure.push(await misura("Paky", [360, 640], tutto));
          misure.push(await misura("Paky", [412, 915], tutto));
          await torna360("Paky");
        }
        var bb = P.document.querySelector(".st-barra.on button");
        if (bb && !bb.disabled) bb.click();
      }
      await W.dorme(250);
    }
    if (P.document.querySelector(".st-vista")) no("la partita non finisce (" + T(P).slice(0, 80) + ")");
    var am = Object.keys(testate).filter(function (k) { return /Parliamo di/.test(k); }), nt = Object.keys(testate).filter(function (k) { return /Notizia vera/.test(k); });
    if (am.length !== 1 || nt.length !== 2) no("attesi 1 round «Parliamo di» e 2 notizie: " + Object.keys(testate).join(" | "));
    if (!visto.vero || !visto.ride || !visto.oro) no("non visti: " + JSON.stringify(visto));
    var m = misure.filter(Boolean); if (m.length) no("misure: " + m.join(" | "));
    var e = errori(); if (e) no("errori: " + e);
    return "ok · " + Object.keys(testate).join(" | ") + " · misure ok (360x640, 412x915)";
  } });
})();

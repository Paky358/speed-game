// LA RUOTA DELLA FORTUNA RIFATTA (27 nov 2026, la notte dei 30 punti del proprietario).
// Uso (dopo copione-prova.js): await COPIONE.carica("ruota-notte/prove.js"); await COPIONE.prova("nt1")
// Con Edge invisibile: prova.js --porta P --carica ruota-notte/prove.js --prova nt1,nt2,nt3 --rifai
//
// nt1 il motore: all'inizio solo la frase lampo (niente Triplete né Ruota del tempo), le frasi della Ruota del tempo sono una
//     categoria («ANNO 79») e stanno nel tabellone, la finestra che spiega (fase «spiega»: nella foto niente lettere della frase
//     lampo), il giro (spinta leggera = poco più di mezzo giro, la più forte al massimo un giro e tre quarti; durata), «La so!» solo
//     con i punti che si perderebbero.
// nt2 contro i Bot sul telefono del proprietario (360x780): la finestra della frase lampo e «⏩ Ho capito»; la frase lampo
//     (tabellone e PRENOTO, una scritta sola); la finestra della manche; quando gira: niente tasto «Gira», la ruota «si sveglia»,
//     è INTERA tra i punteggi e i tasti, un tocco non la fa girare, la spinta sì; i punteggi col nome intero, Manche e Totale;
//     la consonante: una scritta sopra la tastiera in basso; «Non ci sono» con la lettera intera; «La so!» con la finestra la prima
//     volta, la conferma «Sei sicuro?» e il valore di quando si è toccato.
// nt3 come nt2 sul telefono basso (360x640).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti;
  function no(p) { throw new Error("NO: " + p); }
  function base(ch) { return { "À": "A", "È": "E", "É": "E", "Ì": "I", "Ò": "O", "Ù": "U" }[ch] || ch; }
  function tocca(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (t) { b.dispatchEvent(new Ev(t, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click();
  }
  function vis(w, e) { return !!e && e.getClientRects().length > 0 && w.getComputedStyle(e).visibility !== "hidden" && +w.getComputedStyle(e).opacity > 0.05; }
  function lettera(w, L) { return [].find.call(w.document.querySelectorAll(".ru-qwerty .ru-btn.lettera, .ru-azioni .ru-btn.lettera"), function (b) { return b.textContent === L && !b.disabled && vis(w, b); }) || null; }
  function tasto(w, re) { return [].find.call(w.document.querySelectorAll(".ru-azioni button, .ru-spg button, .finestra button, button"), function (b) { return re.test(b.textContent) && !b.disabled && vis(w, b); }) || null; }
  async function scrivi(w, frase, tab) {
    for (var i = 0; i < tab.length; i++) { if (tab.charAt(i) !== "_") continue; var b = lettera(w, base(frase.charAt(i))); if (!b) return false; tocca(w, b); await W.dorme(50); }
    return true;
  }

  COPIONE.aggiungi("nt1", { nome: "Ruota rifatta: il motore (una sola frase lampo all'inizio, ANNO come categoria, la finestra, il giro, «La so!» coi punti)", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0, spiega: true }); if (!w.__RUOTA && w.SGCuore && w.SGCuore.scaricaGioco) await w.SGCuore.scaricaGioco(w.SGCuore.giocoDa("ruota"));
    var R = w.__RUOTA, L = [];
    var gg = [{ id: "a", nome: "Paky" }, { id: "b", nome: "Luca" }, { id: "c", nome: "Bea" }];
    for (var k = 0; k < 20; k++) {
      var P = R.creaPartita(gg, 4, { prenota: true, express: true, veloce: true, finale: true, mistero: true });
      if (P.scaletta[0] !== "classica") no("la prima non è la frase lampo: " + P.scaletta.join(","));
      if (P.scaletta.indexOf("triplete") >= 0 || P.scaletta.indexOf("tempo") >= 0) no("c'è ancora " + P.scaletta.join(","));
    }
    L.push("scaletta: " + P.scaletta.join(" → "));
    // ⏳ la Ruota del tempo come categoria
    var tutte = R.frasi(), anni = tutte.filter(function (x) { return /^ANNO /.test(x.c); });
    if (anni.length < 150) no("frasi con l'anno: " + anni.length);
    anni.forEach(function (x) { if (R.righeIdx(String(x.f).toUpperCase()).length > 4) no("«" + x.f + "» non sta nel tabellone"); if (x.g !== "tempo") no("senza gruppo: " + x.c); });
    L.push(anni.length + " frasi con l'anno (es. «" + anni[0].c + "»: " + anni[0].f + ")");
    // 📖 la finestra che spiega
    P = R.creaPartita(gg, 4, { prenota: true, express: true, veloce: true, finale: true, mistero: true });
    P.nuovaManche();
    if (P.fase !== "spiega" || !P.spg || P.spg.t !== "lampo:classica" || P.spg.poi !== "lampo") no("prima della frase lampo niente finestra (" + P.fase + ")");
    var v = P.vista();
    if (!v.spg || v.tab !== "") no("nella foto della finestra c'è il tabellone della frase lampo: «" + v.tab + "»");
    P.dopoSpiega(); if (P.fase !== "lampo") no("dopo la finestra non parte la frase lampo (" + P.fase + ")");
    P.prenota("b", 0, 300); P.lampoAssegna(); P.lampoSoluzione("b", P.lampo.frase); P.dopoLampo();
    if (P.fase !== "spiega" || P.spg.t !== "manche" || P.spg.poi !== "gira" || !P.spg.prima || P.spg.chi !== "b") no("prima della manche niente finestra giusta (" + P.fase + " " + JSON.stringify(P.spg) + ")");
    P.dopoSpiega(); if (P.fase !== "gira" || P.giocatori[P.turno].id !== "b") no("la manche non comincia da chi ha vinto la frase lampo");
    L.push("finestre: frase lampo, manche (comincia chi ha vinto la frase lampo)");
    // 🎡 il giro
    var piano = [], forte = [], dur = [];
    for (k = 0; k < 1500; k++) {
      P.fase = "gira"; var f = k % 2 ? 1 : 0.1, a0 = P.angolo;
      if (!P.gira({ f: f, d: 1 })) no("il giro non parte");
      var g = Math.abs(P.angolo - a0);
      if (g < R.GIRO_MIN - 16 || g > R.GIRO_MAX + 26) no("giro di " + Math.round(g) + " gradi");
      (f === 1 ? forte : piano).push(g); dur.push(P.giroMs);
    }
    function media(a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; }
    if (!(media(forte) > media(piano) * 2)) no("la forza non conta abbastanza: " + Math.round(media(piano)) + "° e " + Math.round(media(forte)) + "°");
    if (Math.max.apply(null, forte) / 360 > 1.8) no("più di un giro e tre quarti");
    L.push("giro: piano " + Math.round(media(piano)) + "° (" + (media(piano) / 360).toFixed(2) + " giri), forte " + Math.round(media(forte)) + "° (" + (media(forte) / 360).toFixed(2) + " giri), " + Math.min.apply(null, dur) + "-" + Math.max.apply(null, dur) + " ms");
    // 🔒 «La so!» coi punti
    P.fase = "consonante"; P.turno = 1; P.spicchio = 1;
    var q = R.quotaTab(R.coperta(P.frase, P.rivelate)), val = R.valoreSeg(q), serve = Math.round(val / 20) * 10;
    P.trova("a").totale = 0;
    if (P.puoSegreta("a")) no("«La so!» con 0 punti");
    P.trova("a").totale = serve - 10; if (P.puoSegreta("a")) no("«La so!» con " + (serve - 10) + " punti (ne servono " + serve + ")");
    P.trova("a").totale = serve; if (!P.puoSegreta("a")) no("«La so!» con i punti giusti (" + serve + ") non si può");
    L.push("«La so!» vale " + val + ": servono " + serve + " punti");
    return L.join(" · ");
  } });

  // ---- contro i Bot, sul telefono che si sceglie ----
  async function partitaBot(mis) {
    var L = [], P = await W.apriTel("Paky", { x: 0, spiega: true }), fr = document.getElementById("tel-Paky");
    fr.style.width = mis[0] + "px"; fr.style.height = mis[1] + "px"; P.dispatchEvent(new P.Event("resize"));
    var tess = await W.aspetta(function () { return A.tessera(P, "La Ruota della Fortuna"); }, 8000); if (!tess) no("non trovo la Ruota"); tess.click(); await W.dorme(400);
    if (!await W.aspetta(function () { return W.clicca(P, /Contro i Bot/, ".modo-grande"); }, 6000)) no("niente «Contro i Bot»");
    await W.dorme(500);
    if (!W.clicca(P, /Comincia/)) no("niente «Comincia»");
    var Q = await W.aspetta(function () { var x = P.__RUOTA && P.__RUOTA.ultima; return x && x.fase === "spiega" && x.spg && x.spg.t === "lampo:classica" ? x : null; }, 20000);
    if (!Q) no("non arriva la finestra della frase lampo");
    var box = await W.aspetta(function () { var b = P.document.querySelector(".ru-spg.on"); return b && vis(P, b) ? b : null; }, 8000);
    if (!box || !/frase lampo/i.test(box.textContent) || !/PRENOTO/.test(box.textContent)) no("la finestra della frase lampo dice «" + (box ? box.textContent : "") + "»");
    var hc = tasto(P, /Ho capito/); if (!hc) no("niente «⏩ Ho capito»");
    tocca(P, hc);
    if (!await W.aspetta(function () { return Q.fase === "lampo" && !vis(P, P.document.querySelector(".ru-spg.on")); }, 3000)) no("«Ho capito» non chiude la finestra (" + Q.fase + ")");
    L.push("finestra della frase lampo chiusa con «Ho capito»");
    // la frase lampo: una scritta sola (il tasto), niente doppioni
    await W.aspetta(function () { return Q.lampo && Q.lampo.n >= 2; }, 8000);
    var az = (P.document.querySelector(".ru-azioni") || {}).innerText || "", msg = (P.document.querySelector(".ru-msg") || {}).textContent || "";
    if (/Prenota! Vale|Chi la sa prenota/.test(az + " " + msg)) no("la frase lampo ripete la regola: «" + az + "» / «" + msg + "»");
    var bp = tasto(P, /PRENOTO/); if (!bp) no("niente PRENOTO");
    tocca(P, bp);
    if (!await W.aspetta(function () { return Q.lampo && Q.lampo.chi === "host"; }, 4000)) no("Paky non prenota");
    await W.dorme(300); if (!await scrivi(P, Q.lampo.frase, Q.lampoTab())) no("non riesco a scrivere la frase lampo");
    var bok = await W.aspetta(function () { return tasto(P, /✓ Risolvi/); }, 3000); if (!bok) no("niente «✓ Risolvi»"); tocca(P, bok);
    // la finestra della manche
    if (!await W.aspetta(function () { return Q.fase === "spiega" && Q.spg && Q.spg.t === "manche"; }, 12000)) no("dopo la frase lampo niente finestra della manche (" + Q.fase + ")");
    box = await W.aspetta(function () { var b = P.document.querySelector(".ru-spg.on"); return b && /Manche 1 di/.test(b.textContent) ? b : null; }, 5000);
    if (!box || !/Cominci tu/.test(box.textContent)) no("la finestra della manche dice «" + (box ? box.textContent : "") + "»");
    tocca(P, tasto(P, /Ho capito/));
    if (!await W.aspetta(function () { return Q.fase === "gira"; }, 3000)) no("la manche non comincia");
    L.push("finestra della manche: «Cominci tu»");
    // 🎡 si gira: niente tasto, la ruota sveglia e intera, un tocco non basta
    await W.dorme(900);
    if ([].some.call(P.document.querySelectorAll(".ru-azioni button, .st-barra button"), function (b) { return /Gira/.test(b.textContent) && vis(P, b); })) no("c'è ancora il tasto «Gira»");
    var alto = P.document.querySelector(".ru-alto"), piatto = P.document.querySelector(".ru-piatto-alto");
    if (!alto.classList.contains("tocca")) no("la ruota non si sveglia quando tocca a me");
    function intera(perche) {
      var a = piatto.getBoundingClientRect(), barra = P.document.querySelector(".st-barra"), bt = barra && barra.classList.contains("on") ? barra.getBoundingClientRect().top : P.innerHeight;
      var punti = P.document.querySelector(".ru-punti").getBoundingClientRect(), msgR = P.document.querySelector(".ru-msg").getBoundingClientRect();
      var sopra = Math.max(punti.bottom, msgR.height ? msgR.bottom : 0);
      if (a.top < sopra - 2 || a.bottom > bt + 1 || a.bottom > P.innerHeight || a.left < -1 || a.right > P.innerWidth + 1) no(perche + ": la ruota è tagliata o sopra le scritte (" + Math.round(a.top) + "-" + Math.round(a.bottom) + ", spazio " + Math.round(sopra) + "-" + Math.round(bt) + ")");
      return Math.round(a.width);
    }
    var dRuota = intera("quando tocca a me");
    var g0 = Q.giroN, r = piatto.getBoundingClientRect(), Ev = P.PointerEvent || P.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (t) { piatto.dispatchEvent(new Ev(t, { bubbles: true, cancelable: true, pointerId: 9, pointerType: "touch", isPrimary: true, clientX: r.left + r.width * 0.8, clientY: r.top + r.height * 0.5 })); });
    await W.dorme(900);
    if (Q.giroN !== g0) no("un semplice tocco fa girare la ruota");
    if (!await W.spingiRuota(P, 0.2)) no("la ruota non si può spingere");
    if (!await W.aspetta(function () { return Q.giroN === g0 + 1; }, 3000)) no("la spinta non fa girare la ruota");
    var giro = Math.abs(Q.angolo - (Q._a0 || 0));
    L.push("ruota " + dRuota + " px intera, niente tasto «Gira», un tocco non la gira, la spinta sì (" + Q.giroMs + " ms)");
    await W.dorme(1200); intera("mentre gira (prima dello zoom)");
    // i punteggi: il nome intero, Manche e Totale
    [].forEach.call(P.document.querySelectorAll(".ru-chip"), function (c) {
      var n = c.querySelector(".n"), m = c.querySelector(".r.m i"), t = c.querySelector(".r.t i");
      if (!m || !t || !/Manche/i.test(m.textContent) || !/Totale/i.test(t.textContent)) no("un punteggio senza «Manche» e «Totale»: " + c.textContent);
      if (n.scrollWidth > n.clientWidth + 1) no("il nome «" + n.textContent + "» è tagliato");
      if (c.querySelector("canvas")) no("c'è ancora la faccina nei punteggi");
    });
    // la consonante: una scritta sopra la tastiera in basso
    if (!await W.aspetta(function () { return Q.fase === "consonante" || Q.fase === "gira" && Q.giroN > g0; }, 12000)) no("la ruota non si ferma (" + Q.fase + ")");
    if (Q.fase !== "consonante") { L.push("(spicchio speciale: niente consonante)"); return L.join(" · "); }
    await W.dorme(600);
    var aiuto = P.document.querySelector(".ru-stato.aiuto"), kb = P.document.querySelector(".ru-qwerty");
    if (!aiuto || !/Scegli una consonante/.test(aiuto.textContent)) no("sopra la tastiera non c'è «Scegli una consonante»");
    if (!(kb.getBoundingClientRect().top >= aiuto.getBoundingClientRect().bottom - 1)) no("la scritta non sta sopra la tastiera");
    if (kb.getBoundingClientRect().bottom < P.innerHeight - 90) no("la tastiera non sta in basso (" + Math.round(kb.getBoundingClientRect().bottom) + " su " + P.innerHeight + ")");
    if ((P.document.querySelector(".ru-msg") || {}).textContent) no("la riga sopra ripete «" + P.document.querySelector(".ru-msg").textContent + "»");
    var fuori = "BCDFGHLMNPRSTVZ".split("").filter(function (x) { return Q.frase.split("").map(base).indexOf(x) < 0; })[0] || "Q";
    var bl = lettera(P, fuori); if (!bl) no("niente tasto " + fuori);
    tocca(P, bl); await W.dorme(300);
    var bc = tasto(P, new RegExp("✓ Chiama la " + fuori)); if (!bc) no("niente «✓ Chiama la " + fuori + "»");
    tocca(P, bc);
    var no1 = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".ru-sbagli b.no"), function (b) { return b.textContent === fuori; }); }, 4000);
    if (!no1) no("«Non ci sono» non mostra la " + fuori + " intera");
    if (/line-through/.test(P.getComputedStyle(no1).textDecorationLine)) no("la " + fuori + " è ancora sbarrata con la riga");
    L.push("«Scegli una consonante» sopra la tastiera in basso; la " + fuori + " intera in «Non ci sono»");
    // 🔒 «La so!» mentre gioca un Bot: la prima volta la finestra, poi la conferma
    var bs = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".ru-btn.segreta"), function (b) { return vis(P, b); }); }, 15000);
    if (!bs) no("mentre gioca il Bot non c'è «La so!»");
    var me = Q.trova("host"), servono = Math.round(R0(P).valoreSeg(R0(P).quotaTab(Q.vista().tab)) / 20) * 10;
    if ((me.totale >= servono) !== !bs.classList.contains("spento")) no("«La so!» acceso/spento sbagliato (" + me.totale + " punti, ne servono " + servono + ")");
    if (bs.classList.contains("spento")) { L.push("«La so!» spento: «" + bs.textContent + "»"); return L.join(" · "); }
    tocca(P, bs);
    var fin = await W.aspetta(function () { var b = P.document.querySelector(".ru-spg.on"); return b && /La so/.test(b.textContent) ? b : null; }, 3000);
    if (!fin) no("la prima volta di «La so!» niente finestra che spiega");
    tocca(P, tasto(P, /La scrivo/));
    await W.dorme(400);
    var tab = Q.vista().tab; if (!await scrivi(P, Q.frase, tab)) no("non riesco a scrivere in segreto");
    var bb = tasto(P, /Blocca · vale/); if (!bb) no("niente «Blocca»");
    var vTasto = +bb.textContent.replace(/[^\d]/g, "");
    tocca(P, bb);
    var si = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll("button"), function (b) { return /Sì, la so/.test(b.textContent) && vis(P, b); }); }, 3000);
    if (!si || !/Sei sicuro\? Se sbagli perdi/.test(P.document.body.innerText)) no("niente conferma «Sei sicuro? Se sbagli perdi…»");
    await W.dorme(700);   // (intanto può uscire una lettera: vale quello che c'era scritto quando ho toccato)
    tocca(P, si);
    if (!await W.aspetta(function () { return Q.segrete && Q.segrete.host; }, 4000)) no("la soluzione non si blocca");
    if (Q.segrete.host.v !== vTasto) no("vale " + Q.segrete.host.v + " invece di " + vTasto + " (il tasto)");
    L.push("«La so!»: finestra la prima volta, «Sei sicuro?», vale " + vTasto + " come diceva il tasto");
    return L.join(" · ");
  }
  function R0(w) { return w.__RUOTA; }
  COPIONE.aggiungi("nt2", { nome: "Ruota rifatta contro i Bot sul 360x780: finestre, frase lampo, ruota intera senza «Gira», tocco e spinta, punteggi, tastiera in basso, «Non ci sono», «La so!»", fai: async function () { return await partitaBot([360, 780]); } });
  COPIONE.aggiungi("nt3", { nome: "Ruota rifatta contro i Bot sul 360x640", fai: async function () { return await partitaBot([360, 640]); } });
})();

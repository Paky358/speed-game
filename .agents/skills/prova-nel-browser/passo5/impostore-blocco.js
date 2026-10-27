// PROVE «L'IMPOSTORE»: CHI BLOCCA IL TELEFONO MENTRE SI PARLA (26 ott 2026, domanda del proprietario: «le persone leggono la
// parola e poi bloccano il telefono, anche per 3 o 4 minuti: cosa succede quando lo riaprono? Tutti fanno così»).
// Prima della correzione, 20 s dopo il blocco l'amico era fuori e con meno di 3 rimasti la partita finiva per tutti.
// Ora chi blocca resta in partita (📱, `dorme` nella foto), il voto e gli indizi lo aspettano una volta T_DORME (50 s) in più,
// esce solo chi dorme da una mano intera. Telefono bloccato = blocca(nome): la pagina se ne accorge, poi spegni(nome).
// ATTENZIONE: nei telefoni finti la pagina di chi è bloccato va avanti (timer compresi); su un iPhone vero si ferma.
// Uso: prova.js --porta <porta> --carica passo5/impostore-blocco.js --prova 5ib1,5ib2,5ib3,5ib4,5ib5 --timeout 900
// 5ib1 In 4, 3 mani, tempo libero: si discute; Giulia e Luca bloccano il telefono per 70 s → la partita NON finisce, hanno 📱;
//      riaprono → di nuovo dentro con la stessa parola.
// 5ib2 In 4: Giulia blocca mentre si discute; gli altri 3 votano → il voto la aspetta («⏳ Aspettiamo Giulia 📱»); Giulia
//      riapre e vota → il voto si chiude con 4 voti.
// 5ib3 In 4: l'host (Paky) esce dall'app e blocca il telefono per 80 s → la porta avanti un amico; Paky rientra da giocatore.
// 5ib4 In 4: bloccano TUTTI (prima l'host) per 60 s, poi riaprono → la partita continua con tutti e 4.
// 5ib5 In 4, 3 mani: Giulia blocca e non torna più → il voto si chiude da solo dopo 40 + 50 s coi 3 voti; nella 2ª mano
//      Giulia c'è ancora (ha il ruolo, 📱); alla fine della 2ª mano è fuori (🚪) e la 3ª si gioca in 3.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T;
  var GID = "impostore", NOME = "L'Impostore", CHIAVE = "sg_impostore_regole";
  var REG = { mani: 3, giri: 1, tempo: 0, indizi: "scritti", spia: "no", aiuto: "categoria", voto: "una" };
  function no(p) { throw new Error("NO: " + p); }
  function vm(C) { return W.vmDi(C) || {}; }
  function HI(n) { var w = W.finestra(n); return w && w.__impHost; }
  function H(n) { var h = HI(n); return h && h.H(); }
  function prima(nome, regole) {
    var conta = A.contaPartite(nome);
    return function (w) { if (regole) try { w.localStorage.setItem(CHIAVE, JSON.stringify(regole)); } catch (e) {} conta(w); };
  }
  function scrivi(w, testo) {
    var inp = w.document.querySelector(".im-input"), b = w.document.querySelector(".im-invia");
    if (!inp || !b) return false;
    inp.value = testo; inp.dispatchEvent(new w.Event("input", { bubbles: true })); b.click(); return true;
  }
  function vota(w, nome) {
    var b = [].filter.call(w.document.querySelectorAll(".im-vb"), function (x) { return (x.querySelector("b") || {}).textContent === nome; })[0];
    if (!b || b.disabled) return false; b.click(); return true;
  }
  function carta(w) { var e = w && w.document.querySelector(".im-c-grande"); return e ? e.textContent : ""; }
  async function pronto(w) { var b = await W.aspetta(function () { var x = w && w.document.querySelector(".im-pronto"); return x && !x.disabled ? x : null; }, 3000); if (!b) return false; b.click(); return true; }
  async function aspettaPasso(C, passo, ms) { return W.aspetta(function () { var v = vm(C); return v.fase === "gioco" && v.passo === passo ? v : null; }, ms || 8000); }
  async function apri(amici) {
    var P = await W.apriTel("Paky", { x: 0, prima: prima("Paky", REG) });
    var C = await W.apriStanza(P, NOME);
    for (var i = 0; i < amici.length; i++) {
      var n = amici[i], k = i + 2;
      await W.apriTel(n, { hash: "gioco=" + GID + "&stanza=" + C, x: 185 * (i + 1), prima: prima(n) });
      if (!await W.aspetta(function () { return A.contaDentro(vm(C)) >= k; }, 10000)) no(n + " non entra in saletta");
      await W.dorme(300);
    }
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go") || W.clicca(P, /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    if (!await aspettaPasso(C, "indizi", 10000)) no("la partita non comincia");
    return C;
  }
  // chi è nella lista scrive l'indizio: si arriva alla discussione (gli altri, se dormono, si aspettano: lì ci vuole di più)
  async function finoADiscutere(C, nomi, ms) {
    for (var i = 0; i < nomi.length; i++) {
      var w = W.finestra(nomi[i]);
      if (!await W.aspetta(function () { return w.document.querySelector(".im-input"); }, 6000)) no(nomi[i] + " non ha il campo dell'indizio");
      scrivi(w, "indizio" + nomi[i].slice(0, 3).toLowerCase());
    }
    if (!await aspettaPasso(C, "discuti", ms || 15000)) no("non si arriva alla discussione (" + vm(C).passo + ")");
  }
  function pl(C, nome) { return (vm(C).players || []).filter(function (p) { return p.nome === nome; })[0] || {}; }
  function stato(C) {
    var v = vm(C), l = v.players || [];
    return "fase " + v.fase + (v.passo ? "/" + v.passo : "") + (v.mano ? " mano " + v.mano : "") +
      " · " + l.map(function (p) { return p.nome + (p.via ? "🚪" : p.dorme ? "📱" : p.forse ? "📶" : ""); }).join(", ");
  }
  function schermo(n) { return T(W.finestra(n)).replace(/\s+/g, " ").trim().slice(0, 110); }
  function blocca(n) {
    var w = W.finestra(n);
    try { Object.defineProperty(w.document, "hidden", { configurable: true, get: function () { return true; } }); w.document.dispatchEvent(new w.Event("visibilitychange")); } catch (e) {}
    W.spegni(n);
  }
  function sblocca(n) {
    var w = W.finestra(n);
    W.riaccendi(n);
    try { Object.defineProperty(w.document, "hidden", { configurable: true, get: function () { return false; } }); w.document.dispatchEvent(new w.Event("visibilitychange")); } catch (e) {}
  }
  // guarda la partita per ms millisecondi: NO se finisce; torna le righe quando cambia
  async function senzaFine(C, ms, extra) {
    var t0 = Date.now(), righe = [], prec = "";
    while (Date.now() - t0 < ms) {
      if (vm(C).fase === "fine") no("la partita è finita da sola: " + stato(C));
      var s = stato(C) + (extra ? extra() : "");
      if (s !== prec) { righe.push(Math.round((Date.now() - t0) / 1000) + " s: " + s); prec = s; }
      await W.dorme(2000);
    }
    return righe;
  }
  function errori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / ")); }

  COPIONE.aggiungi("5ib1", { nome: "Impostore · in 4, 3 mani: Giulia e Luca bloccano il telefono 70 s mentre si discute → la partita resta, hanno 📱; riaprono con la stessa parola", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Sara"], L = [];
    var C = await apri(nomi.slice(1));
    await finoADiscutere(C, nomi);
    var parole = {}; nomi.forEach(function (n) { parole[n] = carta(W.finestra(n)); });
    blocca("Giulia"); blocca("Luca");
    L.push("bloccano Giulia e Luca → " + (await senzaFine(C, 70000)).join(" | "));
    if (!pl(C, "Giulia").dorme || !pl(C, "Luca").dorme) no("dopo 70 s Giulia e Luca non hanno 📱: " + stato(C));
    if ((T(W.finestra("Sara")).match(/📱/g) || []).length < 2) no("Sara non vede 📱 accanto a Giulia e Luca («" + T(W.finestra("Sara")).replace(/\s+/g, " ").slice(0, 300) + "»)");
    sblocca("Giulia"); sblocca("Luca");
    if (!await W.aspetta(function () { return !pl(C, "Giulia").dorme && !pl(C, "Luca").dorme && !pl(C, "Giulia").via && !pl(C, "Luca").via; }, 10000)) no("riaprendo non tornano dentro: " + stato(C));
    if (!await W.aspetta(function () { return carta(W.finestra("Giulia")) === parole.Giulia && carta(W.finestra("Luca")) === parole.Luca; }, 8000)) no("riaprendo non ritrovano la loro parola");
    if (vm(C).passo !== "discuti") no("dopo la riapertura non si discute più: " + stato(C));
    L.push("riaprono: " + stato(C) + ", stessa parola");
    errori();
    return L.join(" ·· ");
  } });

  COPIONE.aggiungi("5ib2", { nome: "Impostore · in 4: Giulia blocca mentre si discute; il voto la aspetta («⏳ Aspettiamo Giulia»); riapre e vota → 4 voti", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Sara"], L = [], altri = ["Paky", "Luca", "Sara"];
    var C = await apri(nomi.slice(1));
    await finoADiscutere(C, nomi);
    blocca("Giulia");
    await senzaFine(C, 24000);
    if (!pl(C, "Giulia").dorme) no("dopo 24 s Giulia non ha 📱: " + stato(C));
    for (var i = 0; i < altri.length; i++) await pronto(W.finestra(altri[i]));
    if (!await aspettaPasso(C, "voto", 6000)) no("con «🗳️ Votiamo» dei 3 col telefono acceso non si vota (" + stato(C) + ")");
    for (var k = 0; k < altri.length; k++) { var chi = altri[(k + 1) % altri.length]; if (!await W.aspetta(function () { return vota(W.finestra(altri[k]), chi); }, 4000)) no(altri[k] + " non riesce a votare"); await W.dorme(150); }
    if (!await W.aspetta(function () { return (vm(C).votato || []).length === 3; }, 5000)) no("i 3 voti non arrivano");
    await W.dorme(4000);
    if (vm(C).passo !== "voto") no("con 3 voti su 4 il voto si è chiuso senza Giulia: " + stato(C));
    if (!/Aspettiamo Giulia/.test(schermo("Paky")) && !/Aspettiamo Giulia/.test(T(W.finestra("Paky")))) no("Paky non legge «⏳ Aspettiamo Giulia 📱» («" + schermo("Paky") + "»)");
    L.push("il voto aspetta Giulia («⏳ Aspettiamo Giulia 📱»)");
    sblocca("Giulia");
    if (!await W.aspetta(function () { return vota(W.finestra("Giulia"), "Paky"); }, 10000)) no("Giulia riaperto il telefono non può votare («" + schermo("Giulia") + "»)");
    if (!await W.aspetta(function () { var v = vm(C); return v.passo !== "voto" && v.spoglio; }, 8000)) no("col voto di Giulia il voto non si chiude: " + stato(C));
    var sp = vm(C).spoglio, somma = 0; Object.keys(sp.conte || {}).forEach(function (id) { somma += sp.conte[id]; });
    if (somma !== 4) no("allo spoglio i voti sono " + somma + " invece di 4: " + JSON.stringify(sp.conte));
    L.push("Giulia riapre e vota: spoglio con 4 voti");
    errori();
    return L.join(" ·· ");
  } });

  COPIONE.aggiungi("5ib3", { nome: "Impostore · in 4: l'host blocca il telefono 80 s mentre si discute → la porta avanti un amico; l'host rientra da giocatore", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Sara"], L = [];
    var C = await apri(nomi.slice(1));
    await finoADiscutere(C, nomi);
    var pk = carta(W.finestra("Paky"));
    blocca("Paky");
    var chi = function () { var c = A.chiTiene(C); return " · tiene: " + (c.h || "?") + " (gen " + c.g + ")"; };
    await W.dorme(3000);
    L.push("Paky blocca → " + (await senzaFine(C, 77000, chi)).join(" | "));
    if (A.chiTiene(C).g !== 2) no("dopo 80 s la partita non la tiene un amico (" + JSON.stringify(A.chiTiene(C)) + ")");
    sblocca("Paky");
    if (!await W.aspetta(function () { var p = pl(C, "Paky"); return p.nome && !p.via && !p.dorme; }, 20000)) no("Paky non rientra: " + stato(C));
    if (!await W.aspetta(function () { return carta(W.finestra("Paky")) === pk; }, 8000)) no("Paky non ritrova la sua parola");
    L.push("Paky riapre e rientra con la sua parola: " + stato(C));
    errori();
    return L.join(" ·· ");
  } });

  COPIONE.aggiungi("5ib4", { nome: "Impostore · in 4: bloccano tutti (prima l'host) per 60 s mentre si discute, poi riaprono → la partita continua con tutti", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Sara"], L = [];
    var C = await apri(nomi.slice(1));
    await finoADiscutere(C, nomi);
    blocca("Paky"); await W.dorme(1500);
    ["Giulia", "Luca", "Sara"].forEach(blocca);
    await W.dorme(60000);
    sblocca("Giulia"); sblocca("Luca"); sblocca("Sara"); await W.dorme(3000); sblocca("Paky");
    var chi = function () { var c = A.chiTiene(C); return " · tiene: " + (c.h || "?") + " (gen " + c.g + ")"; };
    L.push("tutti riaprono → " + (await senzaFine(C, 15000, chi)).join(" | "));
    if (!nomi.every(function (n) { var p = pl(C, n); return p.nome && !p.via && !p.dorme; })) no("non sono tutti dentro: " + stato(C));
    errori();
    return L.join(" ·· ");
  } });

  COPIONE.aggiungi("5ib5", { nome: "Impostore · in 4, 3 mani: Giulia blocca e non torna → il voto si chiude dopo 40 + 50 s; nella 2ª mano c'è ancora; dalla 3ª è fuori", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Sara"], L = [], altri = ["Paky", "Luca", "Sara"];
    var C = await apri(nomi.slice(1));
    await finoADiscutere(C, nomi);
    blocca("Giulia");
    await senzaFine(C, 24000);
    for (var i = 0; i < altri.length; i++) await pronto(W.finestra(altri[i]));
    if (!await aspettaPasso(C, "voto", 6000)) no("non si vota");
    var t0 = Date.now();
    for (var k = 0; k < altri.length; k++) { var chi = altri[(k + 1) % altri.length]; await W.aspetta(function () { return vota(W.finestra(altri[k]), chi); }, 4000); await W.dorme(150); }
    if (!await W.aspetta(function () { return vm(C).passo !== "voto"; }, 100000)) no("il voto non si chiude mai");
    var dt = (Date.now() - t0) / 1000;
    if (dt < 80) no("il voto si è chiuso dopo " + dt.toFixed(0) + " s: non ha aspettato Giulia");
    if (vm(C).fase === "fine") no("la partita è finita");
    L.push("senza Giulia il voto si chiude da solo dopo " + dt.toFixed(0) + " s");
    // fine della 1ª mano → la 2ª: Giulia c'è ancora (ha il ruolo), col 📱
    if (!await aspettaPasso(C, "esito", 20000)) no("la mano non finisce: " + stato(C));
    for (var a = 0; a < altri.length; a++) await pronto(W.finestra(altri[a]));
    if (!await W.aspetta(function () { var v = vm(C); return v.mano === 2 && v.passo === "indizi"; }, 15000)) no("la 2ª mano non parte: " + stato(C));
    var h = H("Paky"), idG = pl(C, "Giulia").id;
    if (pl(C, "Giulia").via || h.ordine.indexOf(idG) < 0) no("nella 2ª mano Giulia non c'è: " + stato(C));
    L.push("2ª mano: Giulia ancora in partita (" + stato(C) + ")");
    // la 2ª mano senza di lei fino alla fine: poi Giulia è fuori e la 3ª si gioca in 3
    await finoADiscutere(C, altri, 110000);
    for (var b = 0; b < altri.length; b++) await pronto(W.finestra(altri[b]));
    if (!await aspettaPasso(C, "voto", 6000)) no("2ª mano: non si vota");
    for (var q = 0; q < altri.length; q++) { var c2 = altri[(q + 1) % altri.length]; await W.aspetta(function () { return vota(W.finestra(altri[q]), c2); }, 4000); await W.dorme(150); }
    if (!await aspettaPasso(C, "esito", 110000)) no("2ª mano: la mano non finisce: " + stato(C));
    for (var d = 0; d < altri.length; d++) await pronto(W.finestra(altri[d]));
    if (!await W.aspetta(function () { var v = vm(C); return v.mano === 3 && v.passo === "indizi"; }, 15000)) no("la 3ª mano non parte: " + stato(C));
    if (!pl(C, "Giulia").via || H("Paky").ordine.indexOf(idG) >= 0) no("nella 3ª mano Giulia è ancora in gioco: " + stato(C));
    L.push("3ª mano in 3, Giulia fuori 🚪 (" + stato(C) + ")");
    errori();
    return L.join(" ·· ");
  } });
})();

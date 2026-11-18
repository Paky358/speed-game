// PROVA DELLA FINESTRA «📋 I CALCIATORI DI …» NELLA GIORNATA DELLA MINI ASTA (18 nov 2026, il proprietario dal suo iPhone: «vergognoso, fa
// schifo»: righe schiacciate una sull'altra, nomi sopra la squadra, «VOTO · FANTAVOTO» ripetuto, la stagione in mezzo). La finestra si misura
// quando si apre (su iPhone la misura presa all'inizio della giornata non valeva più) e ogni riga ha la sua altezza.
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-scheda.js"); await COPIONE.prova("sc1")
// Con Edge invisibile: prova.js --porta 8991 --carica preferiti/asta.js,preferiti/asta-scheda.js --prova sc1 (asta.js serve: mette le regole della prova)
//
// sc1 Online in 3 con la stagione 2017-18, coi telefoni di misure diverse (Paky 360x740, Giulia 360x640, Luca 412x915): nella giornata,
//     toccando un quadretto, su ogni telefono la finestra copre il campo, sta tutta dentro la giornata (niente tagliato), ha la stagione
//     sotto il titolo, «VOTO» e «FANTAVOTO» una volta sola, e ogni calciatore ha la sua riga (alta almeno 29 px, mai sopra la riga dopo) con
//     nome e squadra che non si toccano e voto e fantavoto dentro la riga. Su Luca prima di toccare la finestra perde la misura di partenza
//     (com'era su iPhone): si deve rimisurare da sola.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, S17 = "2017-18";
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  var MISURE = { Paky: [360, 740], Giulia: [360, 640], Luca: [412, 915] };
  async function online(imp, nomi) {
    var P = await W.apriTel(nomi[0], { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    for (var i = 1; i < nomi.length; i++) await W.apriTel(nomi[i], { hash: "gioco=astafanta&stanza=" + C, x: 220 * i });
    nomi.forEach(function (n) { var f = document.getElementById("tel-" + n), m = MISURE[n]; if (f && m) { f.style.width = m[0] + "px"; f.style.height = m[1] + "px"; } });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 15000)) no("non sono entrati in " + nomi.length);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "asta" && vm(C).asta; }, 20000)) no("l'asta non comincia");
    return { P: P, C: C };
  }
  async function asta(P, C) {   // (l'asta veloce, come ov2)
    var fino = Date.now() + 300000, visti = {};
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), a = v.asta;
      if (v.fase !== "asta" || !a || visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId]) { await W.dorme(150); continue; }
      visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1;
      var elegg = v.giocatori.filter(function (g) { return (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
      if (!a.leaderId) { var ok = v.giocatori.filter(function (g) { return elegg.indexOf(g.nome) >= 0 && g.max >= a.offerta; }), pr = ok[a.nCarta % 2] || ok[0]; if (pr) { if (pr.nome === "Paky") { var bt = bott(P, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } else W.reteDi(pr.nome).invia({ t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta }); } }
      else elegg.forEach(function (n) { if (idDi(n) === a.leaderId) return; if (n === "Paky") { var bp = bott(P, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } else W.reteDi(n).invia({ t: "passa", n: a.nCarta }); });
      await W.dorme(250);
    }
    if (vm(C).fase !== "fine") no("l'asta non finisce");
  }
  function controlla(nome, w) {   // la finestra aperta sul telefono w
    var pag = q(w, ".st-pag.live.on"), gio = q(w, ".st-gio"); if (!pag) no("su " + nome + " la finestra dei calciatori non si apre");
    var R = function (e) { return e.getBoundingClientRect(); }, P = R(pag), G = R(gio), az = q(w, ".st-az-box"), x = [];
    if (P.top < G.top - 1 || P.bottom > G.bottom + 1) no("su " + nome + " la finestra esce dalla giornata (" + Math.round(P.top) + "-" + Math.round(P.bottom) + " su " + Math.round(G.top) + "-" + Math.round(G.bottom) + ")");
    if (az && P.top > R(az).top + 2) no("su " + nome + " la finestra comincia sotto il campo (" + Math.round(P.top) + " invece di " + Math.round(R(az).top) + ")");
    if (pag.scrollHeight > pag.clientHeight + 1) no("su " + nome + " la finestra non ci sta: " + pag.scrollHeight + " su " + pag.clientHeight);
    var anno = q(w, ".st-pag.live .st-pf-anno"), testa = q(w, ".st-pag.live .st-pf-testa");
    if (!anno || !/2017-18/.test(anno.textContent)) no("su " + nome + " non c'è la stagione sotto il titolo");
    if (testa && R(anno).bottom > R(testa).top + 1) no("su " + nome + " la stagione non sta sopra la riga del giocatore");
    var int = qa(w, ".st-pag.live .st-pf-int"), parole = (pag.textContent.match(/fantavoto/gi) || []).length;
    if (int.length === 1 && (+w.getComputedStyle(int[0]).opacity < 0.9 || !visibile(int[0]))) no("su " + nome + " l'intestazione VOTO / FANTAVOTO non si vede");
    if (int.length !== 1 || parole !== 1) no("su " + nome + " l'intestazione VOTO / FANTAVOTO c'è " + int.length + " volte («fantavoto» scritto " + parole + " volte)");
    var righe = qa(w, ".st-pag.live .st-pf.on");
    if (righe.length < 5) no("su " + nome + " le righe dei calciatori sono " + righe.length);
    righe.forEach(function (r, i) {
      var rr = R(r), b = r.querySelector(".st-pf-nome b"), sq = r.querySelector(".st-pf-sq"), v = r.querySelector(".st-pf-v b"), fv = r.querySelector(".st-pf-fv b");
      if (rr.height < 29) no("su " + nome + " la riga " + (i + 1) + " è alta solo " + Math.round(rr.height) + " px");
      if (i && rr.top < R(righe[i - 1]).bottom - 0.5) no("su " + nome + " la riga " + (i + 1) + " sta sopra quella prima");
      if (R(b).bottom > R(sq).top + 1) no("su " + nome + " il nome «" + b.textContent + "» tocca la squadra");
      [b, sq, v, fv].forEach(function (e) { var er = R(e); if (er.top < rr.top - 1 || er.bottom > rr.bottom + 1) no("su " + nome + " nella riga " + (i + 1) + " «" + e.textContent + "» esce dalla riga"); });
      var fg = r.querySelector(".st-pf-busto"); if (fg) { var fr = R(fg); if (fr.top < rr.top - 1 || fr.bottom > rr.bottom + 1 || fr.right > R(b).left + 1) no("su " + nome + " nella riga " + (i + 1) + " la figurina esce dalla riga o copre il nome"); }
      if (r.querySelector(".st-pf-v small, .st-pf-fv small")) no("su " + nome + " la riga " + (i + 1) + " ripete «voto» sopra i numeri");
    });
    return nome + " " + Math.round(P.width) + "x" + Math.round(P.height) + ", righe da " + Math.round(R(righe[0]).height) + " px";
  }
  COPIONE.aggiungi("sc1", { nome: "Mini Asta online in 3 con la 2017-18 e telefoni di misure diverse: la finestra «📋 I calciatori di …» ordinata (una riga per calciatore, intestazione una volta, stagione nel titolo)", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"], o = await online({ formato: "fanta", stagione: S17 }, NOMI), P = o.P, C = o.C, x = [];
    await asta(P, C);
    if (!await W.aspetta(function () { return q(P, ".st-rivela"); }, 15000)) no("niente classifica delle rose");
    for (var k = 0; k < 20 && !q(P, ".st-gio-riga"); k++) { W.clicca(P, /Salta/); await W.dorme(500); }
    if (!await W.aspetta(function () { return NOMI.every(function (n) { var w = W.finestra(n); return w && q(w, ".st-gio-riga") && visibile(q(w, ".st-gio")); }); }, 30000)) no("la giornata non parte su tutti");
    await W.dorme(800);
    for (var i = 0; i < NOMI.length; i++) {
      var w = W.finestra(NOMI[i]), qs = qa(w, ".st-gio-riga:not(.st-gio-altri)"), pg = q(w, ".st-pag");
      if (NOMI[i] === "Luca" && pg) { pg.style.top = ""; pg.style.height = ""; pg.style.bottom = ""; }   // (come su iPhone: la misura di partenza non vale più)
      (qs[1] || qs[0]).click();
      if (!await W.aspetta(function () { return q(w, ".st-pag.live.on"); }, 3000)) no("su " + NOMI[i] + " toccando il quadretto non si apre niente");
      await W.dorme(500);
      x.push(controlla(NOMI[i], w));
    }
    return x.join(" · ");
  } });
})();

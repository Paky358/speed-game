// PROVE DEL CONTROLLO DEL PASSO 6 (i casi cattivi cercati dal controllore, 17 ott 2026). Profili finti, mai account veri.
// Uso (dopo copione-prova.js): await COPIONE.carica("passo6/controllo.js"); await COPIONE.prova("6c1")
// 6c1 chi guarda col link ricarica la pagina e torna a guardare; poi l'host sparisce e la partita passa alla vice: chi guarda
//     segue la vice, non diventa mai vice e non entra mai a giocare.
// 6c2 chi guarda e la rete: rete che salta e telefono spento e riacceso → l'host lo conta di nuovo («👀 1»); le sue mosse non
//     arrivano mai (né nel gioco né sul broker).
// 6c3 il proprietario (IL PAPPONE) guarda col link come tutti; in home «Prova da solo» di Parola d'ordine c'è solo per lui.
// 6c4 «👑 Chi vince resta»: chi è in coda ricarica a metà sfida e torna a guardare da solo col suo posto; chi spegne il telefono
//     e lo riaccende resta in coda; alla sfida dopo chi tocca entra a giocare senza toccare niente.
// 6c5 «🗳️ Scegliamo insieme»: un'amica ricarica mentre la ruota gira → finisce nel gioco uscito come gli altri.
// 6c6 «🗳️ Scegliamo insieme»: l'host ricarica mentre la ruota gira → la Sala si riapre e il gioco uscito parte per tutti.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, P6 = COPIONE.p6;
  var aggiungi = COPIONE.aggiungi.bind(COPIONE);
  function no(p) { throw new Error(p); }
  function n(w) { var x = w && w.document.querySelector(".ct-n"); return x ? x.textContent : null; }
  function targa(w) { return w && w.document.querySelector(".sg-guardo"); }
  function joinDa(nome, C) { return W.BR.log.filter(function (l) { return l.indexOf(nome + " → " + C + "/") === 0 && l.indexOf('"join"') >= 0; }); }
  function gu(P) { var x = P.document.querySelector(".sl-guardano"); return x && !x.hidden ? x.textContent : ""; }

  aggiungi("6c1", { nome: "Controllo: chi guarda ricarica e torna a guardare; l'host sparisce, chi guarda segue la vice", fai: async function () {
    var r = await A.apriRiserva(), C = r.C;
    var B = await P6.apriGuarda("Bea", "contatore", C, 740, A.contatore({ riserva: true }));
    if (!await W.aspetta(function () { return targa(B) && n(B) === String(r.n0); }, 8000)) no("Bea non guarda la partita (targhetta " + !!targa(B) + ", n «" + n(B) + "»)");
    var idB = A.mioId("Bea");
    await W.ricarica("Bea"); B = W.finestra("Bea");
    if (!await W.aspetta(function () { return targa(B) && n(B) === String(r.n0); }, 10000)) no("dopo la ricarica Bea non guarda più («" + A.T(B).slice(0, 80) + "»)");
    A.tocca(r.w.Giulia, ".ct-piu");
    if (!await W.aspetta(function () { return n(B) === String(r.n0 + 1); }, 4000)) no("Bea non vede il +1 di Giulia");
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === r.ids.Giulia; }, 10000)) no("Giulia non subentra " + JSON.stringify(A.chiTiene(C)));
    var c = A.chiTiene(C); if (c.h === idB || c.h === A.mioId("Bea")) no("la partita la tiene chi guarda");
    if (!await W.aspetta(function () { return A.vm(C).fase === "gioco" && A.contaDentro(A.vm(C)) === 3; }, 10000)) no("non si torna a giocare in tre");
    var n1 = A.vm(C).n;
    A.tocca(r.w.Luca, ".ct-piu");
    if (!await W.aspetta(function () { return A.vm(C).n === n1 + 1 && n(B) === String(n1 + 1); }, 8000)) no("Bea non segue la partita della vice (vede «" + n(B) + "», la partita è a " + A.vm(C).n + ")");
    if (!targa(B)) no("dopo il subentro Bea non ha più la targhetta");
    var dentro = (A.vm(C).giocatori || []).map(function (p) { return p.id; });
    if (dentro.indexOf(idB) >= 0 || dentro.indexOf(A.mioId("Bea")) >= 0) no("Bea è finita tra i giocatori");
    if (joinDa("Bea", C).length) no("Bea ha mandato un join: " + joinDa("Bea", C)[0]);
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Bea ricarica e torna a guardare (niente join); la vice Giulia tiene la partita e Bea la segue fino al +1 di Luca";
  } });

  aggiungi("6c2", { nome: "Controllo: chi guarda con la rete che salta e il telefono spento; le sue mosse non arrivano mai", fai: async function () {
    var X = await P6.apriCt({}, ["Giulia"]), C = X.C, P = X.P;
    var B = await P6.apriGuarda("Bea", "contatore", C, 370, X.pr);
    if (!await W.aspetta(function () { return gu(P) === "👀 1"; }, 6000)) no("Paky non legge «👀 1» («" + gu(P) + "»)");
    W.inciampa("Bea", 3000);
    await W.dorme(5000);
    if (!await W.aspetta(function () { return gu(P) === "👀 1"; }, 25000, 500)) no("dopo la rete che salta Paky legge «" + gu(P) + "»");
    W.spegni("Bea");
    if (!await W.aspetta(function () { return gu(P) === ""; }, 30000, 500)) no("Bea spenta: Paky legge ancora «" + gu(P) + "»");
    var t0 = Date.now(); W.riaccendi("Bea");
    if (!await W.aspetta(function () { return gu(P) === "👀 1"; }, 26000, 500)) no("Bea riaccesa: dopo 26 s Paky legge «" + gu(P) + "»");
    var dt = Math.round((Date.now() - t0) / 1000);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return A.vm(C).fase === "gioco"; }, 5000)) no("non comincia");
    if (!await W.aspetta(function () { return targa(B) && n(B) === "0"; }, 5000)) no("Bea non vede la partita");
    var k0 = W.BR.log.length;
    for (var i = 0; i < 3; i++) { try { W.reteDi("Bea").invia({ t: "piu" }); } catch (e) {} }
    var bt = B.document.querySelector(".ct-piu"); if (bt) bt.click();
    await W.dorme(1500);
    if (A.vm(C).n !== 0) no("le mosse di Bea sono arrivate (n " + A.vm(C).n + ")");
    var fuori = W.BR.log.slice(k0).filter(function (l) { return l.indexOf("Bea → " + C + "/") === 0 && l.indexOf('"piu"') >= 0; });
    if (fuori.length) no("sul broker passano le mosse di Bea: " + fuori[0]);
    if (A.contaDentro(A.vm(C)) !== 2) no("nel Contatore sono in " + A.contaDentro(A.vm(C)));
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "«👀 1» resta dopo la rete che salta, sparisce col telefono spento e torna " + dt + " s dopo la riaccensione; 4 mosse di Bea buttate";
  } });

  aggiungi("6c3", { nome: "Controllo: IL PAPPONE guarda col link come tutti; «Prova da solo» solo per lui", fai: async function () {
    var X = await P6.apriCt({}, ["Giulia"]), C = X.C, P = X.P;
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return A.vm(C).fase === "gioco"; }, 5000)) no("non comincia");
    var O = await W.apriTel("Pap", { hash: "gioco=contatore&stanza=" + C + "&guarda=1", x: 370, prima: X.pr, profilo: { nome: "IL PAPPONE", uid: "finto-PAPPONE" } });
    if (!await W.aspetta(function () { return targa(O) && n(O) === "0"; }, 8000)) no("IL PAPPONE non guarda («" + A.T(O).slice(0, 80) + "»)");
    A.tocca(X.w.Giulia, ".ct-piu");
    if (!await W.aspetta(function () { return n(O) === "1"; }, 4000)) no("IL PAPPONE non vede il +1");
    if (A.contaDentro(A.vm(C)) !== 2 || joinDa("Pap", C).length) no("IL PAPPONE è entrato a giocare");
    // ✕ della targhetta → «Smetti di guardare?» (i telefoni finti dicono sì) → si esce
    W.clicca(O, /✕/, ".sg-guardo button");
    if (!await W.aspetta(function () { return !targa(O) && O.document.querySelector(".tessera"); }, 6000)) no("IL PAPPONE non torna in home («" + A.T(O).slice(0, 80) + "»)");
    var t = A.tessera(O, "Parola d'ordine"); if (!t) no("in home IL PAPPONE non trova Parola d'ordine");
    t.click();
    if (!await W.aspetta(function () { return A.modiVisti(O).length; }, 4000)) no("Parola d'ordine non apre «Come giocate?»");
    if (!A.modiVisti(O).some(function (x) { return /Prova da solo/.test(x); })) no("IL PAPPONE non vede «Prova da solo» (" + A.modiVisti(O).join(" | ") + ")");
    var G = await W.apriTel("Giulia2", { x: 555, profilo: { nome: "Giulia", uid: "finto-Giulia2" } });
    var tg = await W.aspetta(function () { return A.tessera(G, "Parola d'ordine"); }, 6000); if (!tg) no("Giulia non trova Parola d'ordine");
    tg.click();
    if (!await W.aspetta(function () { return A.modiVisti(G).length; }, 4000)) no("Parola d'ordine non apre «Come giocate?» per Giulia");
    if (A.modiVisti(G).some(function (x) { return /Prova da solo/.test(x); })) no("anche Giulia vede «Prova da solo»");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "IL PAPPONE guarda senza entrare ed esce col ✕; «Prova da solo» lui sì (" + A.modiVisti(O).length + " modi), Giulia no";
  } });

  aggiungi("6c4", { nome: "Controllo: Chi vince resta, chi è in coda ricarica o spegne il telefono e resta in coda", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Marco"], R = await P6.salaResta(nomi.slice(1), "Paky", "Giulia"), S = R.S;
    var s1 = await P6.sfidaResta(S, 1);
    if (!await W.aspetta(function () { return P6.testoTarga(W.finestra("Luca")) === "👀 Guardi · in coda: sei 1°"; }, 8000)) no("Luca non guarda («" + P6.testoTarga(W.finestra("Luca")) + "»)");
    await W.ricarica("Luca");
    if (!await W.aspetta(function () { return P6.testoTarga(W.finestra("Luca")) === "👀 Guardi · in coda: sei 1°"; }, 15000))
      no("dopo la ricarica Luca non torna a guardare la sfida («" + P6.testoTarga(W.finestra("Luca")) + "», «" + A.T(W.finestra("Luca")).slice(0, 80) + "»)");
    var nm1 = A.vm(s1.C).nomi || {}; if (nm1.X === "Luca" || nm1.O === "Luca") no("Luca è entrato a giocare la prima sfida");
    W.spegni("Marco"); await W.dorme(6000); W.riaccendi("Marco");
    if (!await W.aspetta(function () { return P6.testoTarga(W.finestra("Marco")) === "👀 Guardi · in coda: sei 2°"; }, 20000)) no("Marco riacceso non è più in coda («" + P6.testoTarga(W.finestra("Marco")) + "»)");
    var cd = A.vm(S).resta.coda;
    if (JSON.stringify(cd) !== JSON.stringify([A.idInSala(S, "Luca"), A.idInSala(S, "Marco")])) no("la coda è " + JSON.stringify(cd));
    await P6.trisMosse(s1.C, P6.TRIS_X);
    await P6.tuttiFineResta(nomi, /^👑 Resta Paky$/, /^Ora tocca a Luca$|^Ora tocca a te!$/);
    var s2 = await P6.sfidaResta(S, 2, 20000);
    if (s2.a !== "Paky" || s2.b !== "Luca") no("la seconda sfida è " + s2.a + "–" + s2.b);
    var nm2 = A.vm(s2.C).nomi || {}; if (nm2.X !== "Luca" && nm2.O !== "Luca") no("Luca non gioca la seconda sfida (" + JSON.stringify(nm2) + ")");
    if (!await W.aspetta(function () { return P6.testoTarga(W.finestra("Marco")) === "👀 Guardi · in coda: sei 1°" && P6.testoTarga(W.finestra("Giulia")) === "👀 Guardi · in coda: sei 2°"; }, 8000))
      no("nella seconda sfida le targhette dicono «" + P6.testoTarga(W.finestra("Marco")) + "» e «" + P6.testoTarga(W.finestra("Giulia")) + "»");
    await P6.trisMosse(s2.C, P6.TRIS_X);
    await P6.tuttiFineResta(nomi, /^👑 Resta Paky · 🔥 2 di fila$/, /Ora tocca a (Marco|te!)/);
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Luca ricarica a metà sfida e torna a guardare (1° in coda), Marco spento e riacceso resta 2°; Paky–Luca parte da sola, «🔥 2 di fila»";
  } });

  // la ruota del voto con 3 giochi a più posti (niente «Tris in N»): { V, P, w, S, R }
  async function votoConRuota(nomi) {
    var X = await COPIONE.aiuti.salaInsieme(nomi.slice(1)), S = X.S, P = X.w.Paky;
    var V = await COPIONE.aiuti.proponiQuesti(P, S, ["La Balla Colossale", "La Scalinata", "La linea del tempo"]);
    await COPIONE.aiuti.vota(X.w.Giulia, "balla"); await COPIONE.aiuti.vota(X.w.Luca, "scalinata");
    var b = await W.aspetta(function () { var x = P.document.querySelector(".sgs-gira"); return x && !x.disabled ? x : null; }, 4000);
    if (!b) no("l'host non ha «🎡 Gira la ruota»");
    b.click();
    var Rr = await W.aspetta(function () { var v = A.vm(S).voto; return v && v.fase === "ruota" && v.ruota; }, 4000);
    if (!Rr) no("la ruota non parte");
    var gv = P.SGScegliamo.spicchi([{ id: "balla" }, { id: "scalinata" }, { id: "timeline" }], Rr.spicchi)[Rr.vince].g;
    return { X: X, S: S, P: P, R: Rr, gv: gv };
  }

  aggiungi("6c5", { nome: "Controllo: Scegliamo insieme, un'amica ricarica mentre la ruota gira e finisce nel gioco uscito", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca"], v = await votoConRuota(nomi);
    await W.dorme(1200);
    await W.ricarica("Giulia");
    var C = await COPIONE.aiuti.giocoPerTutti(nomi, v.S, v.gv);
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Giulia ricarica a ruota che gira: è uscito " + v.gv + " e tutti e 3 sono nella sua saletta (" + C + ")";
  } });

  aggiungi("6c6", { nome: "Controllo: Scegliamo insieme, l'host ricarica mentre la ruota gira: il gioco uscito parte per tutti", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca"], v = await votoConRuota(nomi);
    await W.dorme(1500);
    await W.ricarica("Paky");
    var C = await COPIONE.aiuti.giocoPerTutti(nomi, v.S, v.gv);
    if (A.vm(v.S).voto) no("dopo la ricarica il voto è ancora aperto");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Paky ricarica a ruota che gira: la Sala si riapre ed esce " + v.gv + " per tutti e 3 (" + C + ")";
  } });
})();

// 6c7 nella Sala: Bea guarda il Contatore (👀 Guarda del riquadro); l'host ricarica e la partita riprende: Bea guarda ancora
//     e vede i punti nuovi; poi Bea ricarica: resta fuori dalla partita (Sala col riquadro o di nuovo a guardare), mai un join
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, P6 = COPIONE.p6;
  function no(p) { throw new Error(p); }
  function n(w) { var x = w && w.document.querySelector(".ct-n"); return x ? x.textContent : null; }
  function targa(w) { return w && w.document.querySelector(".sg-guardo"); }
  COPIONE.aggiungi("6c7", { nome: "Controllo: nella Sala chi guarda resta a guardare quando l'host ricarica e la partita riprende", fai: async function () {
    var X = await P6.salaCt({ ritardatari: "partita" }, ["Giulia"]), S = X.S, P = X.w.Paky;
    var C = await A.lanciaDallaSala("Paky", S, "Contatore");
    if (!await W.aspetta(function () { return A.contaDentro(A.vm(C)) === 2; }, 10000)) no("nel Contatore non sono in 2");
    W.clicca(P, /Comincia/, ".sl-go");
    if (!await W.aspetta(function () { return A.vm(C).fase === "gioco"; }, 6000)) no("il Contatore non comincia");
    var B = await W.apriTel("Bea", { hash: "sala=" + S, x: 370, salaSempre: true, prima: X.pr });
    if (!await W.aspetta(function () { return P6.rigaInCorso(B); }, 8000)) no("Bea non vede il riquadro");
    W.clicca(B, /Guarda/, ".sl-incorso button");
    if (!await W.aspetta(function () { return targa(B) && n(B) === "0"; }, 6000)) no("Bea non guarda («" + A.T(B).slice(0, 80) + "»)");
    var idB = A.idInSala(S, "Bea");
    A.tocca(X.w.Giulia, ".ct-piu");
    if (!await W.aspetta(function () { return n(B) === "1"; }, 4000)) no("Bea non vede il +1");
    await W.dorme(1200);
    await W.ricarica("Paky"); P = W.finestra("Paky");
    if (!await W.aspetta(function () { return A.vm(C).fase === "gioco" && A.contaDentro(A.vm(C)) === 2 && P.document.querySelector(".ct-piu"); }, 15000))
      no("dopo la ricarica dell'host la partita non riprende (fase " + A.vm(C).fase + ", dentro " + A.contaDentro(A.vm(C)) + ")");
    await W.dorme(1500);
    A.tocca(X.w.Giulia, ".ct-piu");
    if (!await W.aspetta(function () { return A.vm(C).n === 2 && n(B) === "2"; }, 8000)) no("Bea non segue la partita ripresa (vede «" + n(B) + "», partita " + A.vm(C).n + ", «" + A.T(B).slice(0, 60) + "»)");
    if (!targa(B)) no("Bea non ha più la targhetta");
    if ((A.vm(C).giocatori || []).some(function (p) { return p.id === idB; })) no("Bea è finita tra i giocatori");
    await W.ricarica("Bea"); B = W.finestra("Bea");
    if (!await W.aspetta(function () { return P6.rigaInCorso(B) || targa(B); }, 12000)) no("dopo la ricarica Bea non è né nella Sala né a guardare («" + A.T(B).slice(0, 80) + "»)");
    await W.dorme(2000);
    if ((A.vm(C).giocatori || []).some(function (p) { return p.id === idB || p.nome === "Bea"; })) no("dopo la ricarica Bea è finita tra i giocatori");
    if (P6.logDa("Bea", C, '"t":"join"').length) no("Bea ha mandato «join» nella stanza della partita");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Bea guarda nella Sala; l'host ricarica, la partita riprende e Bea la segue; Bea ricarica e resta fuori (" + (targa(B) ? "guarda" : "riquadro") + ")";
  } });
})();

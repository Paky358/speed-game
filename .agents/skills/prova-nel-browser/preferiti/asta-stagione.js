// PROVE DELLE «📅 STAGIONI DEL PASSATO» DELLA MINI ASTA FANTACALCIO (16 nov 2026, deciso dal proprietario il 15 nov: «rivivere» la Serie A
// 2017-18; ⚙️ «📅 Stagione» = «Oggi» di partenza o «2017-18»; i dati di quell'anno in un pezzo a parte che si scarica solo se serve).
// Uso: prova.js --porta 8941 --carica preferiti/asta.js,preferiti/asta-stagione.js --prova st0,st1,st2,st3,st4 --timeout 900
//
// st0 I dati della 2017-18: NON arrivano col gioco (solo col pezzo "asta-2017"); 199 all'asta (P 20: uno per squadra, D 58, C 76, A 45; Brignoli, Meret, Milik, Simy e Rafinha aggiunti dal proprietario), le 20 squadre di
//     allora con gol fatti e subiti, colori e maglie, Chievo e Verona (Bentegodi) e Genoa e Sampdoria (Marassi) mai in casa insieme, ogni
//     calciatore all'asta con la sua quotazione, il gruppo «solo in campo» mai all'asta, numeri di maglia da 1 a 99 e mai doppi in una squadra,
//     un portiere per squadra in 3.000 mazzi; usaStagione cambia i dati e torna a oggi.
// st1 Online in 3 (Paky tiene la partita con «2017-18», Giulia e Luca entrano col telefono appena aperto, senza il pezzo): prima che parta
//     l'asta il pezzo è arrivato anche a loro; tutti vedono lo stesso calciatore della 2017-18 e la scritta «⚽ Serie A 2017-18»; asta veloce
//     fino in fondo, la giornata con le squadre di allora (Benevento, Chievo, SPAL…) e la scritta anche lì; nessun errore.
// st2 La ripresa: Paky ricarica a metà asta con la 2017-18: la partita riprende con la stessa stagione e i calciatori di quell'anno.
// st3 Il vice: Paky si spegne a metà asta e non torna: la tiene Giulia, sempre con la 2017-18, e l'asta va avanti con quei calciatori.
// st4 Dopo una partita della 2017-18, una partita con «Oggi» sullo stesso telefono: i calciatori e le squadre di oggi (niente Chievo).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, S17 = "2017-18";
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function manda(nome, m) { if (nome === "Paky") return false; W.reteDi(nome).invia(m); return true; }
  async function dati(w) { await w.SG.scaricaGioco("asta"); await w.SGCuore.caricaPezzo("asta-2017"); return w.SG_FANTA_STAGIONI[S17]; }
  function chiaviAsta(S) { var o = {}; ["P", "D", "C", "A"].forEach(function (r) { ["A", "B", "C"].forEach(function (t) { (S.CALCIATORI[r][t] || []).forEach(function (k) { o[k] = r; }); }); }); return o; }
  async function telefoniOnline(imp, nomi) {
    var P = await W.apriTel(nomi[0], { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    for (var i = 1; i < nomi.length; i++) await W.apriTel(nomi[i], { hash: "gioco=astafanta&stanza=" + C, x: 185 * i });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 15000)) no("non sono entrati in " + nomi.length + " (" + (vm(C).giocatori || []).length + ")");
    return { P: P, C: C };
  }
  async function comincia(P, C) {
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 15000)) no("la partita non comincia («" + A.T(P).slice(0, 80) + "»)");
  }
  // un passo dell'asta veloce (come pg1): se nessuno ha offerto lo prende il primo che può, poi passano gli altri
  function passoAsta(C, P, nomi, visti, chi) {
    var v = vm(C), a = v.asta; if (v.fase !== "asta" || !a || visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId]) return null;
    visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1;
    var capo = chi || "Paky", Pc = W.finestra(capo) || P;
    var elegg = v.giocatori.filter(function (g) { return !g.via && (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
    if (!a.leaderId) { var pr = v.giocatori.filter(function (g) { return elegg.indexOf(g.nome) >= 0 && g.max >= a.offerta; })[0]; if (pr) { if (pr.nome === capo) { var bt = bott(Pc, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } else manda(pr.nome, { t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta }); } }
    else elegg.forEach(function (n) { if (idDi(n) === a.leaderId) return; if (n === capo) { var bp = bott(Pc, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } else manda(n, { t: "passa", n: a.nCarta }); });
    return a;
  }
  function cartaDi(C) { var a = vm(C).asta; return a && a.carta ? a.carta.nome + " (" + a.carta.squadra + ")" : null; }

  // ===================================================================== st0
  COPIONE.aggiungi("st0", { nome: "Stagione 2017-18: i dati (pezzo a parte, listone, squadre, stadi, numeri, portieri) e il cambio di stagione", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), x = [];
    await w.SG.scaricaGioco("asta");
    if (w.SG_FANTA_STAGIONI) no("la 2017-18 arriva insieme al gioco: deve arrivare solo quando la si sceglie");
    var S = await dati(w); if (!S) no("il pezzo asta-2017 non porta la 2017-18");
    var K = chiaviAsta(S), conta = { P: 0, D: 0, C: 0, A: 0 }; Object.keys(K).forEach(function (k) { conta[K[k]]++; });
    if (conta.P !== 20 || conta.D !== 58 || conta.C !== 76 || conta.A !== 45) no("all'asta " + JSON.stringify(conta) + " (attesi P 20, D 58, C 76, A 45)");
    ["Brignoli (Benevento)", "Meret (SPAL)", "Milik (Napoli)", "Simy (Crotone)", "Rafinha (Inter)"].forEach(function (k) { if (!K[k]) no(k + " non è all'asta (aggiunto dal proprietario)"); });
    Object.keys(K).forEach(function (k) { if (!(S.QUOTAZIONI.valori[k] > 0)) no(k + " è all'asta senza quotazione"); });
    ["D", "C", "A", "P"].forEach(function (r) { (S.CALCIATORI[r].X || []).forEach(function (k) { if (K[k]) no(k + " è «solo in campo» ma anche all'asta"); }); });
    var SQ = Object.keys(S.SQUADRE.squadre).sort();
    var attese = ["Atalanta", "Benevento", "Bologna", "Cagliari", "Chievo", "Crotone", "Fiorentina", "Genoa", "Inter", "Juventus", "Lazio", "Milan", "Napoli", "Roma", "SPAL", "Sampdoria", "Sassuolo", "Torino", "Udinese", "Verona"].sort();
    if (SQ.join() !== attese.join()) no("le squadre: " + SQ.join(", "));
    var gf = 0, gs = 0; SQ.forEach(function (s) { var d = S.SQUADRE.squadre[s]; gf += d.gf; gs += d.gs; if (!(d.gf > 0 && d.gs > 0)) no(s + " senza gol fatti o subiti"); if (!(d.rigori || []).length) no(s + " senza rigoristi");
      if (!S.squadre20.colori[s]) no(s + " senza colori"); if (!S.squadre20.maglie[s]) no(s + " senza maglia"); if (!S.MODULI.squadre[s]) no(s + " senza modulo"); });
    if (Math.abs(gf - gs) > 0.1) no("gol fatti " + gf.toFixed(2) + " e subiti " + gs.toFixed(2) + " non tornano");
    var stc = JSON.stringify(S.squadre20.stadiComuni);
    if (stc.indexOf('["Chievo","Verona"]') < 0 || stc.indexOf('["Genoa","Sampdoria"]') < 0) no("stadi in comune: " + stc);
    var perSq = {}; Object.keys(S.NUMERI).forEach(function (k) { var n = S.NUMERI[k], nn = Array.isArray(n) ? n[0] : n, sq = /\(([^)]+)\)$/.exec(k)[1];
      if (!(nn >= 1 && nn <= 99)) no(k + " ha il numero " + nn); perSq[sq] = perSq[sq] || {}; if (perSq[sq][nn]) no("il " + nn + " due volte nel " + sq + ": " + perSq[sq][nn] + " e " + k); perSq[sq][nn] = k; });
    // il cambio di stagione nel motore vero (il gioco col suo file, tre funzioni portate fuori)
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {}, ag = "function costruisciMazzoFanta(n) {";
    src = src.replace(ag, "FUORI.mazzo = costruisciMazzoFanta; FUORI.usa = usaStagione; FUORI.rose = roseSerieA; FUORI.stadi = function () { return STADI_COMUNI; }; " + ag);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, F);
    var oggiQ = w.SG_FANTA_QUOTAZIONI;
    F.usa(S17);
    if (w.SG_FANTA_QUOTAZIONI !== S.QUOTAZIONI || w.SG_FANTA_CALCIATORI !== S.CALCIATORI) no("usaStagione non mette i dati della 2017-18");
    if (!F.rose().Benevento || F.rose().Frosinone) no("le rose della giornata non sono quelle della 2017-18");
    if (JSON.stringify(F.stadi()).indexOf("Chievo") < 0) no("gli stadi in comune non sono quelli della 2017-18");
    for (var i = 0; i < 3000; i++) {
      var n = 2 + (i % 11), m = F.mazzo(n), P = m.filter(function (c) { return c.ruolo === "P"; }), sq = {};
      if (P.length !== n) no("con " + n + " giocatori i portieri sono " + P.length);
      P.forEach(function (c) { if (sq[c.squadra]) no("due portieri del " + c.squadra); sq[c.squadra] = 1; });
      m.forEach(function (c) { if (!K[c.nome + " (" + c.squadra + ")"]) no(c.nome + " (" + c.squadra + ") esce all'asta ma non è nel listone 2017-18"); });
    }
    F.usa(null);
    if (w.SG_FANTA_QUOTAZIONI !== oggiQ || F.rose().Benevento) no("usaStagione(null) non torna a oggi");
    try { Object.keys(w.localStorage).forEach(function (k) { if (/fanta_/.test(k)) w.localStorage.removeItem(k); }); } catch (e) {}
    x.push("pezzo a parte; all'asta P 20 (uno per squadra), D 58, C 76, A 45 (coi 5 aggiunti dal proprietario); 20 squadre; gol " + gf.toFixed(1) + "/" + gs.toFixed(1) + " a giornata; " + Object.keys(S.NUMERI).length + " numeri; 3.000 mazzi da 2 a 12: un portiere per squadra, solo calciatori del listone; ritorno a oggi");
    return x.join("; ");
  } });

  // ===================================================================== st1
  COPIONE.aggiungi("st1", { nome: "Stagione 2017-18 online in 3: chi entra scarica il pezzo prima dell'asta, stessi calciatori, scritta dell'anno, giornata con le squadre di allora", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"], o = await telefoniOnline({ formato: "fanta", stagione: S17 }, NOMI), P = o.P, C = o.C, x = [];
    if (vm(C).stagione !== S17) no("nella foto della saletta la stagione è " + vm(C).stagione);
    // (in saletta chi entra comincia già a scaricare il pezzo)
    if (!await W.aspetta(function () { return NOMI.every(function (n) { var w = W.finestra(n); return w && w.SG_FANTA_STAGIONI && w.SG_FANTA_STAGIONI[S17]; }); }, 15000)) no("in saletta il pezzo della 2017-18 non arriva a tutti");
    x.push("in saletta il pezzo arriva a tutti");
    await comincia(P, C);
    var S = W.finestra("Paky").SG_FANTA_STAGIONI[S17], K = chiaviAsta(S);
    if (!await W.aspetta(function () { return cartaDi(C); }, 10000)) no("non esce il primo calciatore");
    var c0 = cartaDi(C); if (!K[c0]) no(c0 + " non è nel listone 2017-18");
    if (!await W.aspetta(function () { return NOMI.every(function (n) { var w = W.finestra(n), b = w && q(w, ".st-stadio .as-stagione"); return b && visibile(b) && /Serie A 2017-18/.test(b.textContent); }); }, 10000))
      no("all'asta la scritta «⚽ Serie A 2017-18» non c'è su tutti: " + NOMI.map(function (n) { var w = W.finestra(n); return n + " " + !!(w && q(w, ".as-stagione")); }).join(", "));
    x.push("primo calciatore " + c0 + ", scritta dell'anno su tutti");
    var visti = {}, carte = {}, fino = Date.now() + 360000;
    while (Date.now() < fino && vm(C).fase !== "fine") { var a = passoAsta(C, P, NOMI, visti); if (a && a.carta) carte[a.carta.nome + " (" + a.carta.squadra + ")"] = 1; await W.dorme(300); }
    if (vm(C).fase !== "fine") no("il fanta online non finisce (" + vm(C).fase + ")");
    Object.keys(carte).forEach(function (k) { if (!K[k]) no(k + " è uscito all'asta ma non è della 2017-18"); });
    var sa = vm(C).serieA; if (!sa || !sa.partite) no("niente giornata");
    var sqG = {}; sa.partite.forEach(function (p) { sqG[p.c] = 1; sqG[p.f] = 1; });
    if (Object.keys(sqG).length !== 20 || !sqG.Benevento || !sqG.Chievo || !sqG.SPAL || sqG.Frosinone) no("le squadre della giornata: " + Object.keys(sqG).join(", "));
    var casa = {}; sa.partite.forEach(function (p) { casa[p.c] = 1; });
    if (casa.Chievo && casa.Verona && !sa.partite.some(function (p) { return (p.c === "Chievo" && p.f === "Verona") || (p.c === "Verona" && p.f === "Chievo"); })) no("Chievo e Verona in casa tutte e due");
    if (!await W.aspetta(function () { return ["Giulia", "Luca"].every(function (n) { var w = W.finestra(n), b = w && q(w, ".st-gio .as-stagione"); return b && visibile(b); }); }, 60000)) no("nella giornata la scritta dell'anno non si vede");
    // i calciatori comprati: tutti della 2017-18, e sul telefono di Luca la quotazione di quell'anno
    var L = W.finestra("Luca"), kit = [].concat.apply([], vm(C).giocatori.map(function (g) { return g.kit || []; }));
    kit.forEach(function (c) { var k = c.nome + " (" + c.squadra + ")"; if (L.SG_FANTA_QUOTAZIONI.valori[k] !== S.QUOTAZIONI.valori[k]) no("sul telefono di Luca " + k + " non ha la quotazione 2017-18"); });
    var er = W.erroriTel(); if (er.length) no("errori: " + er.slice(0, 3).join(" | "));
    x.push(Object.keys(carte).length + " calciatori all'asta, tutti della 2017-18; giornata con " + Object.keys(sqG).length + " squadre di allora e la scritta dell'anno");
    return x.join("; ");
  } });

  // ===================================================================== st2
  COPIONE.aggiungi("st2", { nome: "Stagione 2017-18: l'host ricarica a metà asta, la partita riprende con la stessa stagione", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"], IMP = { formato: "fanta", stagione: S17 }, o = await telefoniOnline(IMP, NOMI), P = o.P, C = o.C, x = [];
    await comincia(P, C);
    var visti = {}, n0 = 0, fino = Date.now() + 120000;
    while (Date.now() < fino && n0 < 4) { var a = passoAsta(C, P, NOMI, visti); if (a && !a.leaderId) n0++; await W.dorme(300); }
    var S = W.finestra("Luca").SG_FANTA_STAGIONI[S17], K = chiaviAsta(S), prima = vm(C).sessione;
    var tR = Date.now();
    P = await W.ricarica("Paky", { pa: true, prima: function (w) { w.__imp = IMP; } });
    if (!await W.aspetta(function () { var v = vm(C), Pw = W.finestra("Paky"); return v.fase === "asta" && v.asta && Pw && Pw.__t && Pw.__t.ripresa; }, 25000)) no("dopo la ricarica la partita non riprende (" + vm(C).fase + ")");
    if (vm(C).stagione !== S17) no("dopo la ricarica la stagione è " + vm(C).stagione);
    if (vm(C).sessione !== prima) no("dopo la ricarica è un'altra partita");
    var c = cartaDi(C); if (!K[c]) no("dopo la ricarica all'asta c'è " + c + ", che non è della 2017-18");
    var Pw = W.finestra("Paky"); if (!(Pw.SG_FANTA_STAGIONI && Pw.SG_FANTA_STAGIONI[S17]) || Pw.SG_FANTA_QUOTAZIONI !== Pw.SG_FANTA_STAGIONI[S17].QUOTAZIONI) no("sul telefono di Paky ricaricato i dati non sono della 2017-18");
    if (!await W.aspetta(function () { var b = q(Pw, ".st-stadio .as-stagione"); return b && visibile(b); }, 8000)) no("dopo la ricarica la scritta dell'anno non c'è");
    x.push("ripresa con la 2017-18 (" + c + ")");
    return x.join("; ");
  } });

  // ===================================================================== st3
  COPIONE.aggiungi("st3", { nome: "Stagione 2017-18: l'host si spegne a metà asta, la tiene Giulia con la stessa stagione", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"], o = await telefoniOnline({ formato: "fanta", stagione: S17 }, NOMI), P = o.P, C = o.C, x = [], idG = A.mioId("Giulia");
    await comincia(P, C);
    var visti = {}, n0 = 0, fino = Date.now() + 120000;
    while (Date.now() < fino && n0 < 3) { var a = passoAsta(C, P, NOMI, visti); if (a && !a.leaderId) n0++; await W.dorme(300); }
    await W.dorme(1600);   // (la copia ai vice: al massimo una al secondo)
    var S = W.finestra("Luca").SG_FANTA_STAGIONI[S17], K = chiaviAsta(S);
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === idG; }, 15000)) no("la partita non la tiene Giulia (" + JSON.stringify(A.chiTiene(C)) + ")");
    if (!await W.aspetta(function () { var v = vm(C); return v.fase === "asta" && v.asta; }, 10000)) no("con Giulia l'asta non va avanti (" + vm(C).fase + ")");
    if (vm(C).stagione !== S17) no("con Giulia la stagione è " + vm(C).stagione);
    var carte = {}, visti2 = {}, fino2 = Date.now() + 60000, n1 = 0;
    while (Date.now() < fino2 && n1 < 3) { var b = passoAsta(C, null, ["Giulia", "Luca"], visti2, "Giulia"); if (b && b.carta) { carte[b.carta.nome + " (" + b.carta.squadra + ")"] = 1; if (!b.leaderId) n1++; } await W.dorme(300); }
    if (!Object.keys(carte).length) no("con Giulia non esce nessun calciatore");
    Object.keys(carte).forEach(function (k) { if (!K[k]) no("con Giulia esce " + k + ", che non è della 2017-18"); });
    x.push("Giulia tiene la partita con la 2017-18: " + Object.keys(carte).join(", "));
    return x.join("; ");
  } });

  // ===================================================================== st4
  COPIONE.aggiungi("st4", { nome: "Stagione: dopo la 2017-18, «Oggi» sullo stesso telefono ha i calciatori e le squadre di oggi", fai: async function () {
    var NOMI = ["Paky", "Giulia"], o = await telefoniOnline({ formato: "fanta", stagione: S17 }, NOMI), P = o.P, C = o.C, x = [];
    await comincia(P, C);
    if (!await W.aspetta(function () { return cartaDi(C); }, 10000)) no("non esce il primo calciatore");
    var S = P.SG_FANTA_STAGIONI[S17], K = chiaviAsta(S), c1 = cartaDi(C); if (!K[c1]) no(c1 + " non è della 2017-18");
    // la stessa pagina di Paky esce e apre un'altra partita con «Oggi» (Sara entra col telefono nuovo)
    var esci = bott(P, ".sa-testa .sa-tasto", /‹/); if (esci) esci.click(); await W.dorme(600);
    for (var k = 0; k < 3 && !A.tessera(P, "Mini Asta Fantacalcio"); k++) { W.clicca(P, /Chiudi per tutti|^Sì|Esci/); await W.dorme(900); }
    P.__imp = { formato: "fanta", stagione: null };
    var C2 = await W.apriStanza(P, "Mini Asta Fantacalcio"), P2 = P;
    await W.apriTel("Sara", { hash: "gioco=astafanta&stanza=" + C2, x: 370 });
    if (!await W.aspetta(function () { return (vm(C2).giocatori || []).length === 2; }, 15000)) no("Sara non entra nella partita nuova");
    await comincia(P2, C2);
    if (!await W.aspetta(function () { return cartaDi(C2); }, 10000)) no("non esce il primo calciatore di oggi");
    if (vm(C2).stagione) no("con «Oggi» nella foto c'è la stagione " + vm(C2).stagione);
    var Q = P2.SG_FANTA_QUOTAZIONI; if (!Q || /2017/.test(Q.aggiornate || "")) no("con «Oggi» le quotazioni sono quelle della 2017-18");
    var c2 = cartaDi(C2); if (!(Q.valori[c2] > 0)) no(c2 + " non è nel listone di oggi");
    if (q(P2, ".as-stagione")) no("con «Oggi» c'è la scritta di una stagione");
    x.push("2017-18: " + c1 + "; poi oggi: " + c2 + ", senza scritta");
    return x.join("; ");
  } });

  // ===================================================================== stF (solo per le foto: asta-grafica/foto-stagione.js)
  // apre l'asta online in 2 con la 2017-18 e si ferma lì; W.__stagioneGiornata() porta l'asta fino alla giornata
  COPIONE.aggiungi("stF", { nome: "Stagione 2017-18: i telefoni per le foto (asta e giornata)", fai: async function () {
    var NOMI = ["Paky", "Giulia"], o = await telefoniOnline({ formato: "fanta", stagione: S17 }, NOMI), P = o.P, C = o.C;
    await comincia(P, C);
    if (!await W.aspetta(function () { return cartaDi(C) && q(P, ".st-stadio .as-stagione"); }, 10000)) no("l'asta non si vede");
    W.__stagioneGiornata = async function () {
      var visti = {}, fino = Date.now() + 300000;
      while (Date.now() < fino && vm(C).fase !== "fine") { passoAsta(C, P, NOMI, visti); await W.dorme(300); }
      return await W.aspetta(function () { var b = q(P, ".st-gio .as-stagione"); return b && visibile(b) && q(P, ".st-gio-riga"); }, 90000);
    };
    return "pronti: " + cartaDi(C);
  } });
})();

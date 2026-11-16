// PROVE DELLE «📅 STAGIONI DEL PASSATO» DELLA MINI ASTA FANTACALCIO (16 nov 2026, deciso dal proprietario il 15 nov: «rivivere» la Serie A
// 2017-18; ⚙️ «📅 Stagione» = «Oggi» di partenza o «2017-18»; i dati di quell'anno in un pezzo a parte che si scarica solo se serve).
// Uso: prova.js --porta 8941 --carica preferiti/asta.js,preferiti/asta-stagione.js --prova st0,st1,st2,st3,st4 --timeout 900
//
// st0 I dati della 2017-18: NON arrivano col gioco (solo col pezzo "asta-2017"); 203 all'asta (P 20: uno per squadra, D 58, C 77, A 48; Brignoli, Meret, Milik, Simy, Rafinha, Diabaté, Schick, Bernardeschi e Pazzini aggiunti dal proprietario), le 20 squadre di
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
    if (conta.P !== 20 || conta.D !== 58 || conta.C !== 77 || conta.A !== 48) no("all'asta " + JSON.stringify(conta) + " (attesi P 20, D 58, C 77, A 48)");
    ["Brignoli (Benevento)", "Meret (SPAL)", "Milik (Napoli)", "Simy (Crotone)", "Rafinha (Inter)", "Diabaté (Benevento)", "Schick (Roma)", "Bernardeschi (Juventus)", "Pazzini (Verona)"].forEach(function (k) { if (!K[k]) no(k + " non è all'asta (aggiunto dal proprietario)"); });
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
    x.push("pezzo a parte; all'asta P 20 (uno per squadra), D 58, C 77, A 48 (coi 9 aggiunti dal proprietario); 20 squadre; gol " + gf.toFixed(1) + "/" + gs.toFixed(1) + " a giornata; " + Object.keys(S.NUMERI).length + " numeri; 3.000 mazzi da 2 a 12: un portiere per squadra, solo calciatori del listone; ritorno a oggi");
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

// st5 (16 nov 2026) LE FACCE CONDIVISE: la faccia fatta da IL PAPPONE per un calciatore di oggi (salvata col nome, come prima) vale anche
//     nella 2017-18 per lo stesso calciatore in un'altra squadra (Barella: Inter oggi, Cagliari allora); una faccia salvata sul calciatore
//     (fc<numero>) vale in tutte e due; una «solo nel 2017-18» vale solo lì; senza faccia sua, una stagione senza foto prende i dati di oggi.
(function () {
  var W = window, A = COPIONE.aiuti, no = A.no;
  COPIONE.aggiungi("st5", { nome: "Stagioni: le facce condivise (stesso calciatore, stessa faccia in tutte le stagioni; eccezione solo per un anno)", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }); await w.SG.scaricaGioco("asta"); await w.SGCuore.caricaPezzo("asta-2017");
    var G = w.SGAstaAspetto, P = G.prop(), x = [];
    if (G.persona("Barella (Inter)") !== "fc1870") no("Barella di oggi non ha il suo numero (" + G.persona("Barella (Inter)") + ")");
    G.stagione(null); P["Barella (Inter)"] = { p: 7, c: "rosso", t: "cresta", b: "piena", ok: 1 };
    G.stagione("2017-18");
    if (G.persona("Barella (Cagliari)") !== "fc1870") no("Barella del 2017-18 non ha lo stesso numero");
    var a = G.vero("Barella (Cagliari)"); if (a.p !== 7 || a.t !== "cresta" || a.fonte !== "prop") no("nel 2017-18 Barella non ha la faccia fatta oggi: " + JSON.stringify(a));
    x.push("faccia di oggi anche nel 2017-18");
    delete P["Barella (Inter)"]; P.fc1870 = { p: 6, c: "nero", t: "ricci", b: "corta", ok: 1 };
    if (G.vero("Barella (Cagliari)").p !== 6) no("la faccia sul calciatore non vale nel 2017-18");
    P["fc1870|2017-18"] = { p: 2, c: "biondo", t: "lunghi", b: "niente", ok: 1 };
    if (G.vero("Barella (Cagliari)").p !== 2) no("la faccia «solo nel 2017-18» non vale nel 2017-18");
    G.stagione(null);
    if (G.vero("Barella (Inter)").p !== 6) no("la faccia «solo nel 2017-18» vale anche oggi (o quella di sempre no): " + JSON.stringify(G.vero("Barella (Inter)")));
    x.push("faccia sul calciatore in tutte e due; «solo nel 2017-18» solo lì");
    delete P.fc1870; delete P["fc1870|2017-18"];
    // un calciatore della 2017-18 senza foto quell'anno ma con la foto oggi: prende i dati di oggi (stesso numero)
    var oggi = w.SG_FANTA_IDS; G.stagione("2017-18");
    var S = w.SG_FANTA_STAGIONI["2017-18"], inv = {};
 Object.keys(oggi || {}).forEach(function (k) { inv[oggi[k]] = k; });
    var dopp = Object.keys(S.IDS).filter(function (k) { return inv[S.IDS[k]] && !(S.ASPETTO[k] && S.ASPETTO[k].p); });
    x.push(dopp.length + " calciatori del 2017-18 che giocano anche oggi senza foto di allora");
    G.stagione(null);
    try { w.localStorage.removeItem("sg-fanta-aspetto"); } catch (e) {}
    return x.join("; ");
  } });
})();

// PROVE PER OGNI STAGIONE (16-17 nov 2026, «tutte le stagioni»): la stagione si sceglie con --opz '{"stagione":"2022-23"}'.
// stD I dati: pezzo a parte (non arriva col gioco), abbastanza calciatori per giocare in 12 (P 12 di squadre diverse, D 12, C 24, A 12),
//     un portiere per squadra all'asta, ogni calciatore all'asta con la quotazione, «solo in campo» mai all'asta, squadre con gol, rigoristi,
//     colori e maglia (di oggi o della stagione), stadi in comune giusti, 2.000 mazzi da 2 a 12 solo con calciatori di quell'anno, ritorno a oggi.
// stG Online in 3 con quella stagione: chi entra scarica il pezzo in saletta, stessi calciatori, scritta dell'anno all'asta e nella giornata,
//     asta fino in fondo, giornata con tutte le squadre di quell'anno, nessun errore.
(function () {
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function manda(nome, m) { if (nome === "Paky") return false; W.reteDi(nome).invia(m); return true; }
  function chiaviAsta(S) { var o = {}; ["P", "D", "C", "A"].forEach(function (r) { ["A", "B", "C"].forEach(function (t) { (S.CALCIATORI[r][t] || []).forEach(function (k) { o[k] = r; }); }); }); return o; }
  function stag(opz) { return (opz && opz.stagione) || "2017-18"; }
  COPIONE.aggiungi("stD", { nome: "Stagione (--opz stagione): i dati, abbastanza per giocare in 12, un portiere per squadra, squadre complete, mazzi giusti", fai: async function (opz) {
    var ST = stag(opz), w = await W.apriTel("Paky", { x: 0 });
    await w.SG.scaricaGioco("asta");
    if (w.SG_FANTA_STAGIONI && w.SG_FANTA_STAGIONI[ST]) no("la " + ST + " arriva insieme al gioco");
    await w.SGCuore.caricaPezzo("asta-" + ST.slice(0, 4));
    var S = w.SG_FANTA_STAGIONI && w.SG_FANTA_STAGIONI[ST]; if (!S) no("il pezzo asta-" + ST.slice(0, 4) + " non porta la " + ST);
    var K = chiaviAsta(S), conta = { P: 0, D: 0, C: 0, A: 0 }, portSq = {}; Object.keys(K).forEach(function (k) { conta[K[k]]++; if (K[k] === "P") portSq[/\(([^)]+)\)$/.exec(k)[1]] = 1; });
    if (conta.D < 12 || conta.C < 24 || conta.A < 12 || Object.keys(portSq).length < 12) no("non bastano per giocare in 12: " + JSON.stringify(conta) + ", portieri di " + Object.keys(portSq).length + " squadre");
    var SQ = Object.keys(S.SQUADRE.squadre); if (SQ.length !== 20) no(SQ.length + " squadre: " + SQ.join(", "));
    SQ.forEach(function (s) { if (!portSq[s]) no(s + " senza portiere all'asta"); });
    Object.keys(K).forEach(function (k) { if (!(S.QUOTAZIONI.valori[k] > 0)) no(k + " all'asta senza quotazione"); if (!S.IDS[k]) no(k + " senza numero di fantacalcio.it"); });
    ["P", "D", "C", "A"].forEach(function (r) { (S.CALCIATORI[r].X || []).forEach(function (k) { if (K[k]) no(k + " è sia in campo sia all'asta"); }); });
    var gf = 0, gs = 0, colOggi = ["Napoli", "Juventus", "Inter", "Atalanta", "Roma", "Milan", "Como", "Lazio", "Torino", "Sassuolo", "Fiorentina", "Bologna", "Cagliari", "Parma", "Venezia", "Udinese", "Monza", "Genoa", "Lecce", "Frosinone"];
    SQ.forEach(function (s) { var d = S.SQUADRE.squadre[s]; gf += d.gf; gs += d.gs; if (!(d.gf > 0 && d.gs > 0)) no(s + " senza gol fatti o subiti"); if (!(d.rigori || []).length) no(s + " senza rigoristi");
      if (colOggi.indexOf(s) < 0 && (!S.squadre20.colori[s] || !S.squadre20.maglie[s])) no(s + " senza colori o maglia"); });
    if (Math.abs(gf - gs) > 0.15) no("gol fatti " + gf.toFixed(2) + " e subiti " + gs.toFixed(2) + " non tornano");
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {}, ag = "function costruisciMazzoFanta(n) {";
    src = src.replace(ag, "FUORI.mazzo = costruisciMazzoFanta; FUORI.usa = usaStagione; FUORI.rose = roseSerieA; FUORI.stadi = function () { return STADI_COMUNI; }; " + ag);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, F);
    var oggiQ = w.SG_FANTA_QUOTAZIONI; F.usa(ST);
    if (w.SG_FANTA_QUOTAZIONI !== S.QUOTAZIONI) no("usaStagione non mette i dati della " + ST);
    var rs = Object.keys(F.rose()).sort().join(","); if (rs !== SQ.slice().sort().join(",")) no("le rose della giornata non sono le squadre della " + ST + ": " + rs);
    var stc = JSON.stringify(F.stadi()); [["Inter", "Milan"], ["Roma", "Lazio"], ["Chievo", "Verona"], ["Genoa", "Sampdoria"]].forEach(function (c) { if (SQ.indexOf(c[0]) >= 0 && SQ.indexOf(c[1]) >= 0 && stc.indexOf(JSON.stringify(c)) < 0) no("stadio in comune mancante: " + c.join("-")); });
    for (var i = 0; i < 2000; i++) {
      var n = 2 + (i % 11), m = F.mazzo(n), P = m.filter(function (c) { return c.ruolo === "P"; }), sq = {};
      if (P.length !== n) no("con " + n + " giocatori i portieri sono " + P.length);
      P.forEach(function (c) { if (sq[c.squadra]) no("due portieri del " + c.squadra); sq[c.squadra] = 1; });
      m.forEach(function (c) { if (!K[c.nome + " (" + c.squadra + ")"]) no(c.nome + " (" + c.squadra + ") esce all'asta ma non è nel listone"); });
    }
    F.usa(null); if (w.SG_FANTA_QUOTAZIONI !== oggiQ) no("usaStagione(null) non torna a oggi");
    try { Object.keys(w.localStorage).forEach(function (k) { if (/fanta_/.test(k)) w.localStorage.removeItem(k); }); } catch (e) {}
    return ST + ": all'asta " + Object.keys(K).length + " " + JSON.stringify(conta) + ", portieri di " + Object.keys(portSq).length + " squadre; gol " + gf.toFixed(1) + "/" + gs.toFixed(1) + "; " + Object.keys(S.NUMERI).length + " numeri, " + Object.keys(S.ALTEZZE).length + " altezze; 2.000 mazzi giusti; ritorno a oggi";
  } });
  COPIONE.aggiungi("stG", { nome: "Stagione (--opz stagione) online in 3: pezzo in saletta, stessi calciatori, scritta dell'anno, asta e giornata con le squadre di allora", fai: async function (opz) {
    var ST = stag(opz), NOMI = ["Paky", "Giulia", "Luca"];
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = { formato: "fanta", stagione: ST }; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    for (var i = 1; i < 3; i++) await W.apriTel(NOMI[i], { hash: "gioco=astafanta&stanza=" + C, x: 185 * i });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 15000)) no("non entrano in 3");
    if (vm(C).stagione !== ST) no("nella foto della saletta la stagione è " + vm(C).stagione);
    if (!await W.aspetta(function () { return NOMI.every(function (n) { var w = W.finestra(n); return w && w.SG_FANTA_STAGIONI && w.SG_FANTA_STAGIONI[ST]; }); }, 15000)) no("in saletta il pezzo non arriva a tutti");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 15000)) no("la partita non comincia");
    var S = W.finestra("Paky").SG_FANTA_STAGIONI[ST], K = chiaviAsta(S), re = new RegExp("Serie A " + ST);
    if (!await W.aspetta(function () { return NOMI.every(function (n) { var w = W.finestra(n), b = w && q(w, ".st-stadio .as-stagione"); return b && visibile(b) && re.test(b.textContent); }); }, 10000)) no("all'asta la scritta dell'anno non c'è su tutti");
    var visti = {}, carte = {}, fino = Date.now() + 360000;
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), a = v.asta;
      if (v.fase === "asta" && a && !visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId]) {
        visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1; if (a.carta) carte[a.carta.nome + " (" + a.carta.squadra + ")"] = 1;
        var el = v.giocatori.filter(function (g) { return (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
        if (!a.leaderId) { var pr = v.giocatori.filter(function (g) { return el.indexOf(g.nome) >= 0 && g.max >= a.offerta; })[0]; if (pr) { if (pr.nome === "Paky") { var bt = bott(P, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } else manda(pr.nome, { t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta }); } }
        else el.forEach(function (nn) { if (idDi(nn) === a.leaderId) return; if (nn === "Paky") { var bp = bott(P, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } else manda(nn, { t: "passa", n: a.nCarta }); });
      }
      await W.dorme(300);
    }
    if (vm(C).fase !== "fine") no("l'asta non finisce (" + vm(C).fase + ")");
    Object.keys(carte).forEach(function (k) { if (!K[k]) no(k + " è uscito all'asta ma non è della " + ST); });
    var sa = vm(C).serieA; if (!sa || !sa.partite) no("niente giornata");
    var sqG = {}; sa.partite.forEach(function (p) { sqG[p.c] = 1; sqG[p.f] = 1; });
    if (Object.keys(sqG).sort().join() !== Object.keys(S.SQUADRE.squadre).sort().join()) no("le squadre della giornata: " + Object.keys(sqG).join(", "));
    if (!await W.aspetta(function () { return ["Giulia", "Luca"].every(function (n) { var w = W.finestra(n), b = w && q(w, ".st-gio .as-stagione"); return b && visibile(b); }); }, 60000)) no("nella giornata la scritta dell'anno non si vede");
    var er = W.erroriTel(); if (er.length) no("errori: " + er.slice(0, 3).join(" | "));
    return ST + ": " + Object.keys(carte).length + " calciatori all'asta, tutti di quell'anno; giornata con le " + Object.keys(sqG).length + " squadre di allora; scritta dell'anno all'asta e nella giornata";
  } });
})();

// fe1 (16 nov 2026) «🎨 Facce dei calciatori» dal profilo di IL PAPPONE: il tasto c'è solo per lui; l'editor ha TUTTI i calciatori unici di oggi
//     e di tutte le stagioni (uno per numero di fantacalcio.it: Barella una volta sola), dal più quotato; «Da fare» di partenza; la pelle a tasti
//     grandi; «Salva e avanti ▶» salva sul calciatore e passa al prossimo da fare; contatore «fatte X su Y»; filtri stagione e squadra, «Fatte»;
//     la faccia salvata si vede uguale con «Oggi» e nella 2017-18 (Barella dell'Inter e del Cagliari).
(function () {
  var W = window, A = COPIONE.aiuti, no = A.no;
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  COPIONE.aggiungi("fe1", { nome: "«🎨 Facce dei calciatori» nel profilo di IL PAPPONE: tutti i calciatori di tutte le stagioni, Salva e avanti, contatore, filtri", fai: async function () {
    var x = [], ko = [];
    var w0 = await W.apriTel("Paky", { x: 0 }); await w0.SG.scaricaGioco("asta"); w0.SGAstaAspetto.facce(); await W.dorme(1500);
    if (w0.document.querySelector(".fa-ed")) ko.push("l'editor si apre anche per Paky");
    var w = await W.apriTel("IL PAPPONE", { x: 420 }), d = w.document;
    try { w.localStorage.removeItem("sg-fanta-aspetto"); } catch (e) {}
    // il tasto nel profilo
    if (!await W.aspetta(function () { return W.clicca(w, /Profilo/, ".menu-sotto button, .ms-menu button, button"); }, 6000)) ko.push("non trovo il Profilo");
    await W.dorme(800);
    var tasto = qa(w, ".st-tasto").filter(function (b) { return /Facce dei calciatori/.test(b.textContent); })[0];
    if (!tasto) ko.push("nel profilo di IL PAPPONE non c'è «🎨 Facce dei calciatori»"); else tasto.click();
    if (!await W.aspetta(function () { return d.querySelector(".fa-ed.fa-ovunque .fa-ed-r"); }, 30000)) no("l'editor di tutte le stagioni non si apre (" + ko.join(" | ") + ")");
    var S = w.SGAstaAspetto, P = S.prop(); Object.keys(P).forEach(function (k) { delete P[k]; });
    var conta = function () { return (d.querySelector(".fa-ed-conta") || {}).textContent || ""; };
    var tot = +(conta().replace(/\./g, "").match(/su (\d+)/) || [])[1];
    if (!(tot > 1000)) ko.push("i calciatori in tutto sono " + tot + " (attesi più di 1.000)");
    var schede = qa(w, ".fa-ed-schede button").map(function (b) { return b.textContent; });
    if (!/^Da fare/.test(schede[0]) || !/on/.test(qa(w, ".fa-ed-schede button")[0].className)) ko.push("di partenza non è «Da fare»: " + schede.join(" / "));
    var pelle = qa(w, ".fa-ed-riga.pelle .fa-ed-c"); if (pelle.length !== 7 || pelle[0].getBoundingClientRect().width < 40) ko.push("la pelle non ha 7 tasti grandi");
    var nome = function () { return (d.querySelector(".fa-ed-info b") || {}).textContent; };
    var n1 = nome(); pelle[6].click(); await W.dorme(200);
    var avanti = qa(w, ".fa-ed-tasti button").filter(function (b) { return /Salva e avanti/.test(b.textContent); })[0];
    if (!avanti) no("manca «Salva e avanti ▶»");
    avanti.click(); await W.dorme(300);
    var n2 = nome(); if (n2 === n1) ko.push("«Salva e avanti» non passa al prossimo");
    pelle = qa(w, ".fa-ed-riga.pelle .fa-ed-c"); pelle[0].click(); await W.dorme(150); qa(w, ".fa-ed-tasti button").filter(function (b) { return /Salva e avanti/.test(b.textContent); })[0].click(); await W.dorme(300);
    if (!/fatte 2 su/.test(conta())) ko.push("il contatore dice «" + conta() + "» dopo 2");
    var fatte = Object.keys(P).filter(function (k) { return /^fc\d+$/.test(k); }); if (fatte.length !== 2) ko.push("salvate " + JSON.stringify(Object.keys(P)) + " (attese 2 sul calciatore fc<numero>)");
    // un calciatore che c'è in più stagioni: Barella (oggi Inter, 2017-18 Cagliari) una volta sola, e la sua faccia vale in tutte e due
    var cerca = d.querySelector(".fa-ed-cerca"); cerca.value = "barella"; cerca.dispatchEvent(new w.Event("input")); await W.dorme(200);
    qa(w, ".fa-ed-schede button")[2].click(); await W.dorme(200);
    var righe = qa(w, ".fa-ed-r").filter(function (r) { return /Barella/.test(r.textContent); });
    if (righe.length !== 1) ko.push("Barella compare " + righe.length + " volte (deve essere una)"); else { righe[0].click(); await W.dorme(200); }
    if (!/2017-18/.test((d.querySelector(".fa-ed-stag") || {}).textContent || "")) ko.push("nella scheda di Barella non c'è la 2017-18: «" + ((d.querySelector(".fa-ed-stag") || {}).textContent) + "»");
    pelle = qa(w, ".fa-ed-riga.pelle .fa-ed-c"); pelle[1].click(); await W.dorme(200);
    if (S.vero("Barella (Inter)").p !== 2) ko.push("la faccia di Barella non vale con «Oggi»");
    S.stagione("2017-18"); if (S.vero("Barella (Cagliari)").p !== 2) ko.push("la faccia di Barella non vale nella 2017-18"); S.stagione(null);
    // filtri
    cerca.value = ""; cerca.dispatchEvent(new w.Event("input"));
    var sel = d.querySelectorAll(".fa-ed-fil select"); sel[0].value = "2017-18"; sel[0].dispatchEvent(new w.Event("change")); sel[1].value = "Chievo"; sel[1].dispatchEvent(new w.Event("change")); await W.dorme(200);
    var r2 = qa(w, ".fa-ed-r"); if (!r2.length || r2.some(function (r) { return !/Chievo/.test(r.textContent); })) ko.push("il filtro 2017-18 + Chievo non funziona (" + r2.length + ")");
    qa(w, ".fa-ed-schede button")[1].click(); await W.dorme(200);
    var mis = d.querySelector(".fa-ed").scrollWidth > w.innerWidth + 1; if (mis) ko.push("l'editor scorre di lato");
    Object.keys(P).forEach(function (k) { delete P[k]; }); try { w.localStorage.removeItem("sg-fanta-aspetto"); } catch (e) {}
    if (ko.length) no(ko.slice(0, 8).join(" | "));
    return "solo IL PAPPONE; " + tot + " calciatori unici; Da fare di partenza; pelle a 7 tasti grandi; Salva e avanti; contatore; Barella una volta, faccia uguale oggi e 2017-18; filtri stagione e squadra";
  } });
})();

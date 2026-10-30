// PROVE DELLA RUOTA DELLA FORTUNA, giro 2 (30 ott 2026): i giochi veloci della scaletta (frase lampo, Ruota del tempo,
// GiraMondo, Triplete, CruciRuota), lo spicchio Raddoppia, «🔒 La so!», la memoria delle frasi, la finale con 3 tabelloni.
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("preferiti/ruota2.js"); await COPIONE.prova("rv1")
//
// rv1: il motore, senza rete: i contenuti nuovi stanno nel tabellone; la scaletta ha i 5 giochi; CruciRuota (una parola
//      giusta resta scoperta e vale 500, una sbagliata = fuori, chi ne trova di più comincia), Triplete (3 frasi, +2.000
//      a chi le fa tutte), Ruota del tempo e GiraMondo; «La so!» (31 ott: vale da 500 a 0 fino al 40% di lettere scoperte,
//      giusta + il valore, sbagliata − metà, mai sotto zero; mai a chi è di turno, nella foto solo CHI ha bloccato); Raddoppia;
//      la finale per tutti (lettere scelte da ognuno, tabelloni diversi, punti 500 + 1.000 × il tempo che resta, Testacoda
//      uguale per tutti, Rubasecondi −3 s solo a chi chiama, i punti nel totale cambiano chi vince) e la busta a chi vince
//      (anche sullo stesso telefono, dove la finale non c'è; niente busta se vince un Bot).
// rv3: online in 3 (Paky host, Luca, Giulia), 1 manche e la finale per tutti: tab. 1 ognuno sceglie le sue lettere (Luca dal
//      telefono), tabelloni diversi nella foto, la frase mai sul broker prima della fine del tabellone; Luca risolve presto
//      dal suo telefono (vede la sua frase e «aspettiamo gli altri»), Giulia tardi, Paky passa: punti 500 + 1.000 × il tempo
//      che restava; l'host ricarica a metà del Testacoda e la finale riprende con lo stesso tempo e gli stessi punti;
//      Rubasecondi: la lettera che non c'è toglie 3 secondi solo a Luca; chi vince sceglie la busta dal suo telefono e le
//      Speed Coins le incassa solo lui.
// rv4: contro i Bot (Difficile), 1 manche: i Bot giocano la finale e prendono punti; se vince Paky la busta vale un decimo.
// rv6: a pari merito al primo posto una busta a testa (motore + online in 3, vedi sotto).
// rv5: sullo stesso telefono in 2: niente «🏆 Finale» nelle regole né finale; chi vince sceglie la busta (un decimo, le Speed
//      Coins solo se è il nome del profilo).
// rv2: online in 2 (Paky tiene la partita, Luca dal suo telefono): Luca entra con le frasi già viste (l'host le riceve);
//      CruciRuota: Luca prenota e scrive UNA parola (+500, la parola resta, le lettere ripartono); poi «🔒 La so!» di Luca
//      mentre tocca a Paky: la frase non passa MAI sul broker prima della fine, il lucchetto sì; a fine manche il premio
//      a Luca; il telefono di Luca si segna la frase risolta.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  async function finche(C, fino, passo, ms, perche) {
    var t = Date.now() + (ms || 60000);
    while (Date.now() < t) {
      var v = vm(C);
      if (fino(v)) return v;
      try { if (passo) await passo(v); } catch (e) { if (/^NO:/.test(e.message)) throw e; }
      await W.dorme(250);
    }
    no((perche || "non si arriva al punto della prova") + " (fase " + vm(C).fase + ")");
  }

  COPIONE.aggiungi("rv1", { nome: "Ruota giro 2: il motore dei giochi veloci, «La so!», Raddoppia e la finale con 3 tabelloni", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), R = w.__RUOTA, L = [];
    if (!R || !w.SG_RUOTA_TEMPO || !w.SG_RUOTA_MONDO || !w.SG_RUOTA_CRUCI) no("mancano i contenuti nuovi (Ruota del tempo, GiraMondo, CruciRuota)");
    var tutte = w.SG_RUOTA_FRASI.length; if (tutte < 3000) no("le frasi sono solo " + tutte);
    L.push(tutte + " frasi, " + w.SG_RUOTA_TEMPO.length + " anni, " + w.SG_RUOTA_MONDO.length + " parole, " + w.SG_RUOTA_CRUCI.length + " cruciverba");
    var gg = [{ id: "a", nome: "Paky" }, { id: "b", nome: "Luca" }, { id: "c", nome: "Bea" }];
    var P = R.creaPartita(gg, 4, { prenota: true, express: false, veloce: true, finale: true, mistero: false });
    if (P.scaletta.length !== 5) no("la scaletta ha " + P.scaletta.length + " giochi: " + P.scaletta.join(","));
    // 🧩 CruciRuota
    P.scaletta = ["cruci", "triplete", "tempo", "mondo"]; P.nuovaManche();
    var Lp = P.lampo, righe = Lp.frase.split("|");
    if (Lp.tipo !== "cruci" || righe.length !== 4) no("il primo gioco non è il CruciRuota a 4 righe (" + Lp.tipo + ")");
    if (R.righeIdx(Lp.frase).length !== 4) no("le 4 parole non vanno una per riga");
    P.prenota("b", 0, 300); P.lampoAssegna();
    P.lampoSoluzione("b", righe.map(function (x, i) { return i === 2 ? x : x.replace(/./g, "?"); }).join("|"));
    if (P.fase !== "lampo" || Lp.ok[2] !== "b" || P.trova("b").totale !== 500) no("una parola giusta: fase " + P.fase + ", ok " + JSON.stringify(Lp.ok) + ", Luca " + P.trova("b").totale);
    if (P.lampoTab().split("|")[2] !== righe[2]) no("la parola trovata non resta scoperta");
    if (P.vista().tab.indexOf(righe[0]) >= 0) no("nella foto c'è una parola non ancora trovata");
    P.prenota("c", 0, 300); P.lampoAssegna();
    P.lampoSoluzione("c", righe.map(function (x, i) { return i === 0 ? x.replace(/./g, "X") : x.replace(/./g, "?"); }).join("|"));
    if (!Lp.fuori.c) no("una parola sbagliata non mette fuori");
    P.prenota("b", 0, 300); P.lampoAssegna(); P.lampoSoluzione("b", righe.join("|"));
    if (P.fase !== "lampofine" || Lp.vince !== "b" || P.trova("b").totale !== 2000) no("CruciRuota finito: fase " + P.fase + ", vince " + Lp.vince + ", Luca " + P.trova("b").totale);
    L.push("CruciRuota «" + Lp.cat + "» ok");
    P.dopoLampo();
    if (P.fase !== "gira" || P.giocatori[P.turno].id !== "b") no("dopo il CruciRuota non comincia chi ha trovato più parole");
    // 🔒 La so!
    if (P.puoSegreta("b")) no("chi è di turno può bloccare la soluzione");
    var vAtteso = R.valoreSeg(R.quotaTab(P.vista().tab));
    if (!P.puoSegreta("a") || !P.segreta("a", P.frase) || P.segreta("a", P.frase)) no("«La so!» non va (o va due volte)");
    if (P.segrete.a.v !== vAtteso) no("«La so!»: l'host dà " + P.segrete.a.v + ", il tasto diceva " + vAtteso);
    P.trova("c").totale += 1000;
    var vC = R.valoreSeg(R.quotaTab(P.vista().tab));
    P.segreta("c", P.frase.replace(/[A-Z]/, "Q"));
    var v = P.vista();
    if (JSON.stringify(v).indexOf(P.frase) >= 0) no("la frase (o la soluzione segreta) è nella foto");
    if (!v.lock || v.lock.indexOf("a") < 0 || v.lock.indexOf("c") < 0) no("nella foto manca chi ha bloccato");
    var ta = P.trova("a").totale, tc = P.trova("c").totale, mezzoC = Math.round(vC / 20) * 10;
    P.esce("c");   // (Bea esce prima della fine: la sua soluzione sbagliata le costa lo stesso)
    P.risolvi(); P.soluzione(P.frase); P.torna("c");
    if (P.trova("a").totale !== ta + vAtteso || P.trova("c").totale !== tc - mezzoC) no("premi della soluzione segreta sbagliati: Paky " + (P.trova("a").totale - ta) + " (doveva +" + vAtteso + "), Bea " + (P.trova("c").totale - tc) + " (doveva −" + mezzoC + ")");
    if (P.msg.indexOf("Paky l'aveva capita: +" + vAtteso) < 0 || P.msg.indexOf("Bea ha sbagliato: −" + mezzoC) < 0) no("il messaggio di fine manche: " + P.msg);
    tc = P.trova("c").totale;
    // il 40%: con più lettere scoperte non si blocca più, e il valore scende dritto
    var Q = R.creaPartita(gg, 1, {}); Q.nuovaManche(); Q.turno = 0;
    var lettere = R.solo(Q.frase).split(""), k0 = 0;
    while (R.quotaTab(Q.vista().tab) < 0.4 && k0 < lettere.length) Q.rivelate[lettere[k0++]] = 1;
    if (Q.puoSegreta("b")) no("«La so!» si può bloccare col " + Math.round(R.quotaTab(Q.vista().tab) * 100) + "% di lettere scoperte");
    if (R.valoreSeg(0) !== 500 || R.valoreSeg(0.2) !== 250 || R.valoreSeg(0.1) !== 380 || R.valoreSeg(0.4) !== 0 || R.valoreSeg(0.39) !== 10) no("valori di «La so!»: " + [0, 0.1, 0.2, 0.39, 0.4].map(R.valoreSeg).join(","));
    L.push("La so! ok (Paky +" + vAtteso + ", Bea sbaglia −" + mezzoC + ", niente oltre il 40%)");
    // 🎯 Triplete
    P.dopoManche();
    if (P.lampo.tipo !== "triplete") no("il secondo gioco non è il Triplete");
    var cat = P.lampo.cat;
    for (var k = 1; k <= 3; k++) {
      var Lt = P.lampo; if (Lt.tri.n !== k || Lt.cat !== cat) no("Triplete: frase " + Lt.tri.n + " di " + Lt.cat);
      P.prenota("c", 0, 300); P.lampoAssegna(); P.lampoSoluzione("c", Lt.frase); P.dopoLampo();
    }
    if (P.trova("c").totale !== tc + 5000 || P.giocatori[P.turno].id !== "c") no("Triplete: Bea doveva avere +5.000 e cominciare (" + (P.trova("c").totale - tc) + ")");
    L.push("Triplete «" + cat + "» ok");
    // ⏳ e 🌍
    P.risolvi(); P.soluzione(P.frase); P.dopoManche();
    if (P.lampo.tipo !== "tempo" || !/^\d+( a\.C\.)?$/.test(P.lampo.cat)) no("Ruota del tempo: " + P.lampo.tipo + " " + P.lampo.cat);
    L.push("⏳ " + P.lampo.cat + ": " + P.lampo.frase);
    P.lampoNessuno(); P.dopoLampo(); P.risolvi(); P.soluzione(P.frase); P.dopoManche();
    if (P.lampo.tipo !== "mondo" || P.lampo.cat.indexOf(": ") < 0) no("GiraMondo: " + P.lampo.tipo + " " + P.lampo.cat);
    L.push("🌍 " + P.lampo.cat + " = " + P.lampo.frase);
    // ✖️2 Raddoppia (nel giro finale non esce: la ruota si ferma solo sulle cifre)
    var P2 = R.creaPartita(gg, 2, { prenota: false, express: false, veloce: false, finale: false, mistero: false });
    P2.nuovaManche(); P2.giocatori[P2.turno].soldi = 700; P2.spicchio = 1; P2.fase = "girando"; P2.dopoGiro();
    if (P2.giocatori[P2.turno].soldi !== 1400 || P2.fase !== "gira") no("Raddoppia: " + P2.giocatori[P2.turno].soldi + " " + P2.fase);
    // 🏆 la finale per tutti (31 ott): Paky e Luca persone, Matt Bot (qui senza piano: passa)
    var g3 = [{ id: "a", nome: "Paky" }, { id: "b", nome: "Luca" }, { id: "c", nome: "Matt", bot: true }];
    var P3 = R.creaPartita(g3, 1, { prenota: false, express: false, veloce: false, finale: true, mistero: false, modo: "online" });
    P3.nuovaManche(); P3.turno = 0; P3.risolvi(); P3.soluzione(P3.frase); P3.dopoManche();
    if (P3.fase !== "fintro" || !P3.fin || P3.fin.ids.length !== 3) no("la finale non è per tutti (" + P3.fase + ")");
    if (P3.classifica) no("la classifica è già fatta prima della finale");
    var t0 = {}; ["a", "b", "c"].forEach(function (id) { t0[id] = P3.trova(id).totale; });
    P3.finInizia();
    if (P3.fase !== "flettere" || !P3.fin.g.c.scelte || P3.fin.g.a.scelte) no("tabellone 1: le lettere (" + P3.fase + ")");
    P3.finLettere("a", ["B", "M", "P", "A"]); if (P3.fase !== "flettere") no("si parte prima che scelga Luca");
    if (P3.finLettere("b", ["C", "D", "R", "O"])) no("Luca sceglie una lettera già data (R)");
    P3.finLettere("b", ["C", "D", "G", "O"]);
    if (P3.fase !== "frivela") no("hanno scelto tutti e non si va avanti (" + P3.fase + ")");
    P3.finVia(); P3.fin.bot = {};
    var v3 = P3.vista(), fr3 = R.solo(P3.frase);
    if (JSON.stringify(v3).indexOf(P3.frase) >= 0) no("tabellone 1: la frase è nella foto");
    if (/[BMPA]/.test(fr3) && v3.fin.g.a.tab === v3.tab) no("il tabellone di Paky non ha le sue lettere");
    if (/[CDGO]/.test(fr3) && v3.fin.g.b.tab === v3.tab) no("il tabellone di Luca non ha le sue lettere");
    if (v3.fin.g.a.resta < 29000 || v3.fin.g.a.resta > 30000) no("il tempo di Paky: " + v3.fin.g.a.resta);
    P3.fin.da = Date.now() - 6000; P3.finSoluzione("b", P3.frase);
    if (!P3.fin.g.b.ok || P3.fin.g.b.punti !== 1300) no("Luca risolve a 6 s su 30: " + P3.fin.g.b.punti + " (doveva 1.300)");
    if (JSON.stringify(P3.vista()).indexOf(P3.frase) >= 0) no("Luca ha risolto e la frase finisce nella foto");
    P3.finSoluzione("a", "SBAGLIATA"); if (P3.fin.g.a.ok || P3.fin.g.a.prove !== 1 || P3.fase !== "ftempo") no("una soluzione sbagliata chiude o vale");
    P3.fin.da = Date.now() - 21000; P3.finSoluzione("a", P3.frase);
    if (P3.fin.g.a.punti !== 800) no("Paky risolve a 21 s su 30: " + P3.fin.g.a.punti + " (doveva 800)");
    if (P3.fase !== "fcambio" || P3.vista().tab !== P3.frase) no("finite le persone, il tabellone non finisce (o non si scopre): " + P3.fase);
    // Testacoda: uguale per tutti
    P3.dopoCambio(); P3.fin.bot = {};
    var tab = P3.vista().tab, frase = P3.frase, parole = frase.split(" "), visto = tab.split(" ");
    if (!parole.every(function (p, i) { return visto[i].charAt(0) === p.charAt(0) && visto[i].slice(-1) === p.slice(-1); })) no("Testacoda: " + tab + " per " + frase);
    if (P3.vista().fin.g.a.tab !== tab || P3.vista().fin.g.b.tab !== tab) no("il Testacoda non è uguale per tutti");
    P3.finPassa("a"); P3.finPassa("b");
    if (P3.fase !== "fcambio") no("passano tutti e il Testacoda non finisce (" + P3.fase + ")");
    // Rubasecondi: i 3 secondi li perde solo chi chiama la lettera che non c'è
    P3.dopoCambio(); P3.fin.bot = {};
    var ass = "ZQWXKJYHBF".split("").filter(function (x) { return R.solo(P3.frase).indexOf(x) < 0; })[0], ra = P3.finResta("a"), rb = P3.finResta("b");
    P3.finLettera("a", ass);
    if (ra - P3.finResta("a") < 2900 || rb - P3.finResta("b") > 200) no("Rubasecondi: Paky −" + (ra - P3.finResta("a")) + " ms, Luca −" + (rb - P3.finResta("b")) + " ms");
    var vv = "AEIOU".split("").filter(function (x) { return R.solo(P3.frase).indexOf(x) >= 0; });
    P3.finLettera("b", vv[0]); if (vv[1] && P3.finLettera("b", vv[1])) no("Rubasecondi: due vocali");
    P3.finPassa("a"); P3.fin.da = Date.now() - 10000; P3.finSoluzione("b", P3.frase);
    var pb = P3.fin.g.b.punti, attB = Math.round((500 + 1000 * (40000 - 10000 - P3.fin.g.b.pen) / 40000) / 50) * 50;
    if (pb !== attB) no("Rubasecondi: Luca a 10 s prende " + pb + " invece di " + attB);
    P3.dopoCambio();
    if (!P3.classifica) no("finita la finale, niente classifica");
    var sb = P3.fin.g.b.tot, sa = P3.fin.g.a.tot;
    if (P3.trova("b").totale !== t0.b + sb || P3.trova("a").totale !== t0.a + sa) no("i punti della finale non vanno nel totale");
    if (P3.classifica[0].id !== "b") no("Luca (1.000 in meno dopo le manche) doveva vincere con la finale: " + JSON.stringify(P3.classifica));
    if (P3.fase !== "fbusta" || P3.busta.id !== "b") no("la busta non è di Luca (" + P3.fase + ")");
    if (P3.finBusta(7)) no("si apre la busta 7");
    P3.finBusta(3);
    if (P3.fase !== "fesito" || P3.busta.premio !== P3.busta.premi[3] || R.BUSTE.indexOf(P3.busta.premio) < 0) no("busta: " + JSON.stringify(P3.busta));
    L.push("finale per tutti: Luca +" + sb + ", Paky +" + sa + ", vince Luca e apre " + P3.busta.premio);
    // sullo stesso telefono: niente finale, ma la busta sì (un decimo); se vince un Bot niente busta
    var P4 = R.creaPartita(g3, 1, { prenota: false, express: false, veloce: false, finale: true, mistero: false, modo: "telefono", decimo: true });
    P4.nuovaManche(); P4.turno = 0; P4.risolvi(); P4.soluzione(P4.frase); P4.dopoManche();
    if (P4.fin || P4.fase !== "fbusta" || P4.busta.premi || P4.busta.valori.indexOf(500) < 0 || P4.busta.valori.indexOf(50) < 0) no("stesso telefono: " + P4.fase + " " + JSON.stringify(P4.busta));   // (i premi si mescolano solo quando si apre)
    var P5 = R.creaPartita(g3, 1, { prenota: false, express: false, veloce: false, finale: false, mistero: false });
    P5.nuovaManche(); P5.turno = 2; P5.risolvi(); P5.soluzione(P5.frase); P5.dopoManche();
    if (P5.fase !== "fine" || P5.busta) no("vince il Bot e c'è la busta (" + P5.fase + ")");
    L.push("Raddoppia ok · stesso telefono: busta senza finale · vince il Bot: niente busta");
    // Rubasecondi: chi la risolve chiamando le lettere non la mette nella foto; un Bot chiuso in anticipo paga le lettere che non ci sono
    var P6 = R.creaPartita(g3, 1, { prenota: false, express: false, veloce: false, finale: true, mistero: false, modo: "online" });
    P6.nuovaManche(); P6.turno = 0; P6.risolvi(); P6.soluzione(P6.frase); P6.dopoManche(); P6.finInizia(); P6.finAuto(); P6.finVia();
    ["a", "b", "c"].forEach(function (id) { if (!P6.finFatto(id)) P6.finPassa(id); }); P6.dopoCambio();
    ["a", "b", "c"].forEach(function (id) { if (!P6.finFatto(id)) P6.finPassa(id); }); P6.dopoCambio();
    if (P6.fin.b !== 3 || P6.fase !== "ftempo") no("non si arriva al Rubasecondi (" + P6.fase + ")");
    P6.frase = "LA CASA"; P6.fin.vis = null;
    var sbagliata = "ZQWXKJYHBF".split("")[0];
    P6.fin.bot = { c: { t: 20000, no: null, passa: null, lettere: [{ t: 2200, L: sbagliata }] } };
    ["C", "S", "L", "A"].forEach(function (x) { P6.finLettera("a", x); });
    if (!P6.fin.g.a.ok) no("Rubasecondi: tutte le lettere fuori e non è risolta");
    if (JSON.stringify(P6.vista()).indexOf("LA CASA") >= 0) no("Rubasecondi: chi l'ha risolta con le lettere mette la frase nella foto");
    if (!P6.finTutta("a") || P6.vista().fin.g.a.tab !== "__ ____") no("Rubasecondi: il tabellone di chi ha risolto nella foto: " + P6.vista().fin.g.a.tab);
    P6.finPassa("b");
    var g6 = P6.fin.g.c, att6 = Math.round((500 + 1000 * (40000 - 20000 - 3000) / 40000) / 50) * 50;
    if (!g6.ok || g6.pen !== 3000 || g6.punti !== att6) no("il Bot chiuso in anticipo: ok " + g6.ok + ", −" + g6.pen + " ms, " + g6.punti + " punti (doveva " + att6 + ")");
    L.push("Rubasecondi risolta con le lettere: niente frase nella foto · Bot chiuso prima: " + g6.punti + " con −3 s");
    return L.join(" · ");
  } });

  COPIONE.aggiungi("rv2", { nome: "Ruota giro 2 online in 2: frasi già viste da Luca, CruciRuota con una parola, «🔒 La so!» segreta fino alla fine", fai: async function () {
    var L = [];
    var P = await W.apriTel("Paky", { x: 0, prima: function (w) { w.__RUOTA_SCALETTA = ["cruci", "classica"]; } });
    var C = await W.apriStanza(P, "La Ruota della Fortuna");
    var Lw = await W.apriTel("Luca", { hash: "gioco=ruota&stanza=" + C, x: 185, prima: function (w) { try { w.localStorage.setItem("sg-ruota-viste", JSON.stringify(["zz9prova"])); } catch (e) {} } });
    if (!await W.aspetta(function () { return A.contaDentro(vm(C)) === 2; }, 10000)) no("Luca non entra in saletta");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    var H = await W.aspetta(function () { return P.__RUOTA.H; }, 5000);
    if (!H || !H.visteAmici || !H.visteAmici.zz9prova) no("l'host non ha ricevuto le frasi già viste da Luca");
    L.push("frasi viste da Luca arrivate all'host");
    var idL = (vm(C).giocatori || []).filter(function (g) { return g.nome === "Luca"; })[0].id;
    function az(a, x) { W.reteDi("Luca").invia({ t: "azione", a: a, x: x }); }
    // 🧩 CruciRuota: Luca scrive una parola sola
    var v = await finche(C, function (x) { return x.fase === "lampo" && x.lampo && x.lampo.tipo === "cruci" && x.lampo.n >= 3 && !x.sigla; }, null, 45000, "non arriva il CruciRuota");
    var Pp = P.__RUOTA.ultima, righe = Pp.lampo.frase.split("|");
    az("prenoto", { n: v.lampo.n, ms: 300 });
    await finche(C, function (x) { return x.lampo && x.lampo.chi === idL; }, null, 5000, "Luca non riesce a prenotare");
    az("soluzione", righe.map(function (x, i) { return i === 1 ? x : x.replace(/./g, "?"); }).join("|"));
    v = await finche(C, function (x) { return x.lampo && x.lampo.ok && x.lampo.ok[1] === idL; }, null, 5000, "la parola di Luca non vale");
    var gL = v.giocatori.filter(function (g) { return g.id === idL; })[0];
    if (v.fase !== "lampo" || gL.totale !== 500 || v.tab.split("|")[1] !== righe[1]) no("dopo la parola: fase " + v.fase + ", Luca " + gL.totale + ", tab " + v.tab);
    if (!await W.aspetta(function () { return /trovate 1 di 4/.test(W.testo(Lw)); }, 4000)) no("sul telefono di Luca non si legge «trovate 1 di 4»");
    L.push("CruciRuota: Luca trova " + righe[1] + " (+500)");
    // Paky finisce il CruciRuota
    var ok = await W.aspetta(function () {
      var Q = P.__RUOTA.ultima; if (Q.fase === "gira") return true;
      if (Q.fase === "lampo" && Q.lampo && !Q.lampo.chi && !Q.lampo.cand.length && W.clicca(P, /PRENOTO/)) return false;
      if (Q.fase === "lampo" && Q.lampo && Q.lampo.chi === "host") {
        var tab = Q.lampoTab();
        for (var k = 0; k < tab.length; k++) if (tab.charAt(k) === "_") W.clicca(P, new RegExp("^" + Q.lampo.frase.charAt(k) + "$"));
        W.clicca(P, /✓ Risolvi/);
      }
      return false;
    }, 40000);
    if (!ok) no("il CruciRuota non finisce (fase " + P.__RUOTA.ultima.fase + ")");
    // 🔒 La so! di Luca mentre tocca a Paky (o a chi tocca: se tocca a Luca, Paky gira e sbaglia per passargli il turno)
    Pp = P.__RUOTA.ultima;
    if (Pp.giocatori[Pp.turno].id === idL) { az("risolvi"); await W.dorme(400); az("soluzione", "SBAGLIATA"); await W.dorme(600); }
    v = await finche(C, function (x) { return x.fase === "gira" && x.turno !== idL; }, null, 8000, "non tocca a Paky");
    if (!await W.aspetta(function () { return W.clicca(Lw, /La so!/); }, 5000)) no("Luca non ha «🔒 La so!» mentre tocca a Paky");
    az("segreta", Pp.frase);
    v = await finche(C, function (x) { return x.lock && x.lock.indexOf(idL) >= 0; }, null, 5000, "nella foto non c'è il lucchetto di Luca");
    // (la copia per il vice, __ris, contiene già la partita intera: è il punto #5 del registro; qui si guardano le foto)
    var foto = (W.BR.storia || []).filter(function (x) { return x.topic.indexOf("/" + C + "/") >= 0 && x.p.indexOf(Pp.frase) >= 0 && x.p.indexOf('"__ris"') < 0; });
    if (foto.length) no("la frase è passata sul broker prima della fine della manche: " + foto[0].p.slice(0, 120));
    if (!await W.aspetta(function () { return /Soluzione bloccata/.test(W.testo(Lw)); }, 4000)) no("Luca non legge «Soluzione bloccata»");
    L.push("«La so!»: lucchetto nella foto, frase mai sul broker");
    var prima = v.giocatori.filter(function (g) { return g.id === idL; })[0].totale;
    // l'host risolve con la tastiera
    await W.aspetta(function () { return W.clicca(P, /💡 Risolvi/) || P.__RUOTA.ultima.fase === "risolvi"; }, 3000);
    var Q = P.__RUOTA.ultima, tab = Q.vista().tab;
    for (var k = 0; k < tab.length; k++) if (tab.charAt(k) === "_") W.clicca(P, new RegExp("^" + Q.frase.charAt(k).normalize("NFD").charAt(0) + "$"));
    W.clicca(P, /✓ Risolvi/);
    v = await finche(C, function (x) { return x.fase === "finemanche"; }, null, 8000, "la manche non finisce");
    var dopo = v.giocatori.filter(function (g) { return g.id === idL; })[0].totale;
    var seg = (v.vince && v.vince.seg || []).filter(function (s) { return s.id === idL; })[0];
    if (!seg || !seg.b || dopo !== prima + seg.b) no("Luca non ha il premio della soluzione segreta (" + prima + " → " + dopo + ")");
    if (!await W.aspetta(function () { return /l'aveva capita/.test(W.testo(Lw)); }, 4000)) no("sul telefono di Luca non si legge «l'aveva capita»");
    L.push("premio a Luca +" + seg.b + " (" + seg.pct + "% di lettere)");
    var segnata = await W.aspetta(function () { try { return (JSON.parse(Lw.localStorage.getItem("sg-ruota-viste") || "[]")).length >= 3; } catch (e) { return false; } }, 4000);
    if (!segnata) no("il telefono di Luca non si segna le frasi risolte");
    L.push("frasi risolte segnate anche sul telefono di Luca");
    return L.join(" · ");
  } });

  // =====================================================================
  //  rv3-rv5: la finale PER TUTTI (31 ott 2026) e la busta a chi vince
  // =====================================================================
  // la spia per le regole dell'host (come in passo5/g3.js): apriTel(nome, { spiaRv: true }) e w.__impR = le regole della
  // prova (solo l'host le legge); w.__cbR = la stanza dell'host (per mandare le sue mosse senza toccare lo schermo)
  if (!W.__prepRv) {
    W.__prepRv = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepRv(w, nome, opz);
      if (!opz || !opz.spiaRv) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && g.id === "ruota" && !g.__spiaRv) {
            g.__spiaRv = true; var av = g.avvia;
            g.avvia = function (t) {
              if (w.__impR && t.impostazioni && !(t.linkParams && t.linkParams.stanza)) Object.keys(w.__impR).forEach(function (k) { t.impostazioni[k] = w.__impR[k]; });
              if (!w.__cbR && w.SGNet) { var osp = w.SGNet.ospita; w.SGNet.ospita = function (gid, cb) { w.__cbR = cb; return osp.apply(this, arguments); }; }
              return av.apply(this, arguments);
            };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }
  function tocca(w, b) {
    if (!b) return false;
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click(); return true;
  }
  function tasto(w, re) { return [].find.call(w.document.querySelectorAll(".ru-azioni button"), function (b) { return re.test(b.textContent) && !b.disabled && b.getClientRects().length > 0; }) || null; }
  function lettera(w, L) { return [].find.call(w.document.querySelectorAll(".ru-azioni .ru-btn.lettera"), function (b) { return b.textContent === L && !b.disabled; }) || null; }
  function base(ch) { return { "À": "A", "È": "E", "É": "E", "Ì": "I", "Ò": "O", "Ù": "U" }[ch] || ch; }
  function Pdi(w) { return w.__RUOTA && w.__RUOTA.ultima; }
  function azioni(w) { var a = w.document.querySelector(".ru-azioni"); return a ? a.textContent : ""; }
  function senzaAnimazioni(w) { var st = w.document.createElement("style"); st.textContent = ".schermata{animation:none!important}.st-barra,.ru-mist,.ru-form,.ru-sopra{transition:none!important}"; w.document.head.appendChild(st); }
  // scrive la soluzione con la tastiera del gioco (le caselle coperte del SUO tabellone, nell'ordine) e tocca «✓ Risolvi»
  async function scriviUI(w, frase, tab) {
    for (var i = 0; i < tab.length; i++) {
      if (tab.charAt(i) !== "_") continue;
      var b = lettera(w, base(frase.charAt(i))); if (!b) return false;
      tocca(w, b); await W.dorme(25);
    }
    return tocca(w, tasto(w, /✓ Risolvi/));
  }
  // le caselle del tabellone sullo schermo: quante lettere si vedono e quante sono coperte
  function celle(w) {
    var l = [].slice.call(w.document.querySelectorAll(".ru-tab .ru-cella"));
    return { lettere: l.filter(function (c) { return /^[A-ZÀÈÉÌÒÙ]$/.test(c.textContent) && !/coperta|scritta/.test(c.className); }).length, coperte: l.filter(function (c) { return /coperta/.test(c.className); }).length };
  }
  function puntiFin(ms, T, pen) { return Math.round((500 + 1000 * Math.max(0, T - ms - (pen || 0)) / T) / 50) * 50; }
  var IMP1 = { manche: 1, prenota: false, express: false, veloce: false, mistero: false, finale: true };

  COPIONE.aggiungi("rv3", { nome: "Ruota online in 3: la finale per tutti (lettere diverse, frase mai nella foto, punti col tempo, l'host ricarica a metà, Rubasecondi solo a chi sbaglia) e la busta al vincitore", fai: async function () {
    var L = [], F = {};
    var P = F.Paky = await W.apriTel("Paky", { x: 0, spiaRv: true, prima: function (w) { w.__impR = IMP1; } }); senzaAnimazioni(P);
    var C = await W.apriStanza(P, "La Ruota della Fortuna");
    F.Luca = await W.apriTel("Luca", { hash: "gioco=ruota&stanza=" + C, x: 185 }); senzaAnimazioni(F.Luca);
    F.Giulia = await W.apriTel("Giulia", { hash: "gioco=ruota&stanza=" + C, x: 370 }); senzaAnimazioni(F.Giulia);
    if (!await W.aspetta(function () { return A.contaDentro(vm(C)) === 3; }, 10000)) no("in saletta non sono in 3");
    await W.dorme(400);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    var v = await finche(C, function (x) { return x.fase === "gira" && !x.sigla; }, null, 60000, "la manche non comincia");
    function idDi(n) { return (vm(C).giocatori || []).filter(function (g) { return g.nome === n; })[0].id; }
    var idL = idDi("Luca"), idG = idDi("Giulia"), ID = { Paky: "host", Luca: idL, Giulia: idG };
    function nomeDi(id) { return Object.keys(ID).filter(function (n) { return ID[n] === id; })[0]; }
    function az(n, a, x) {
      if (n === "Paky") { var w = W.finestra("Paky"); if (w.__cbR) w.__cbR.onMsg("host", { t: "azione", a: a, x: x }); }
      else W.reteDi(n).invia({ t: "azione", a: a, x: x });
    }
    function storiaConFrase(frase) { return (W.BR.storia || []).filter(function (x) { return x.topic.indexOf("/" + C + "/") >= 0 && x.p.indexOf(frase) >= 0 && x.p.indexOf('"__ris"') < 0 && x.p.indexOf('"finSua"') < 0; }); }   // (finSua: la frase solo per chi l'ha già, controllato a parte)
    // la manche: chi è di turno risolve subito; poi «⏩ Avanti» di Luca e Giulia
    var chi = nomeDi(v.turno), frase0 = Pdi(P).frase;
    az(chi, "risolvi"); await W.dorme(300); az(chi, "soluzione", frase0);
    await finche(C, function (x) { return x.fase === "finemanche"; }, null, 8000, "la manche non finisce");
    var kAv = vm(C).kAv; az("Luca", "avanti", kAv); az("Giulia", "avanti", kAv);
    v = await finche(C, function (x) { return x.fase === "fintro"; }, null, 15000, "dopo l'ultima manche non arriva la finale");
    if (!v.fin || Object.keys(v.fin.g).length !== 3) no("la finale non è per tutti e 3: " + JSON.stringify(v.fin));
    if (v.classifica) no("la classifica arriva prima della finale");
    var tot0 = {}; v.giocatori.forEach(function (g) { tot0[g.id] = g.totale; });
    // ---- tabellone 1: ognuno sceglie le sue lettere in segreto (Luca dal suo telefono, gli altri con le mosse) ----
    v = await finche(C, function (x) { return x.fase === "flettere"; }, null, 10000, "non si scelgono le lettere");
    var lu = await W.aspetta(function () { return lettera(F.Luca, "B") && /Ecco le mie lettere/.test(azioni(F.Luca)) ? true : null; }, 5000);
    if (!lu) no("Luca non ha i tasti per scegliere le lettere («" + azioni(F.Luca).slice(0, 80) + "»)");
    if (lettera(F.Luca, "R") || lettera(F.Luca, "E")) no("Luca può scegliere R o E (sono già date)");
    ["B", "C", "D", "A"].forEach(function (x) { tocca(F.Luca, lettera(F.Luca, x)); });
    await W.dorme(150); tocca(F.Luca, tasto(F.Luca, /Ecco le mie lettere/));
    az("Giulia", "lettere", ["M", "P", "G", "O"]);
    await W.dorme(600);
    var vL = vm(C);
    if (vL.fase !== "flettere") no("si va avanti prima che scelga Paky (" + vL.fase + ")");
    if (!vL.fin.g[idL].scelto || vL.fin.g[idL].ch !== "RSTLNE") no("le lettere di Luca si vedono prima del tempo (o non sono arrivate): " + JSON.stringify(vL.fin.g[idL]));
    if (!/Lettere scelte/.test(azioni(F.Luca))) no("Luca, scelte le lettere, non legge «✅ Lettere scelte!» («" + azioni(F.Luca).slice(0, 80) + "»)");
    az("Paky", "lettere", ["F", "V", "Z", "I"]);
    v = await finche(C, function (x) { return x.fase === "ftempo" && x.fin.b === 1; }, null, 8000, "il tempo del tabellone 1 non parte");
    var G1 = Pdi(W.finestra("Paky")), fr1 = G1.frase;
    if (v.fin.g[idL].ch !== "RSTLNEBCDA" || v.fin.g[idG].ch !== "RSTLNEMPGO" || v.fin.g.host.ch !== "RSTLNEFVZI") no("le lettere nella foto: " + [v.fin.g[idL].ch, v.fin.g[idG].ch, v.fin.g.host.ch].join(" "));
    ["host", idL, idG].forEach(function (id) { if (v.fin.g[id].tab !== G1.finTab(v.fin.g[id].ch.split(""))) no("il tabellone di " + nomeDi(id) + " nella foto non è il suo"); });
    if (/[BCDAMPGO]/.test(R0(fr1)) && v.fin.g[idL].tab === v.fin.g[idG].tab) no("Luca e Giulia hanno lo stesso tabellone (" + fr1.length + " caselle)");
    var cL = await W.aspetta(function () { var c = celle(F.Luca); return c.lettere === v.fin.g[idL].tab.replace(/[^A-ZÀÈÉÌÒÙ]/g, "").length ? c : null; }, 4000);
    if (!cL) no("sul telefono di Luca non c'è il suo tabellone (" + JSON.stringify(celle(F.Luca)) + " per " + v.fin.g[idL].tab + ")");
    if (storiaConFrase(fr1).length) no("tabellone 1: la frase è passata sul broker");
    L.push("tab. 1: Luca " + v.fin.g[idL].tab + " · Giulia " + v.fin.g[idG].tab);
    // Luca risolve presto, dal suo telefono
    await W.dorme(1500);
    var tabL = v.fin.g[idL].tab;
    if (!await W.aspetta(function () { return tasto(F.Luca, /✓ Risolvi/) || lettera(F.Luca, "Q"); }, 4000)) no("Luca non ha la tastiera per risolvere");
    if (!await scriviUI(F.Luca, fr1, tabL)) no("Luca non riesce a scrivere la soluzione");
    v = await finche(C, function (x) { return x.fin && x.fin.g[idL].ok; }, null, 5000, "la soluzione di Luca non vale");
    var gL = v.fin.g[idL];
    if (gL.punti !== puntiFin(gL.ms, 30000)) no("Luca: " + gL.punti + " punti in " + gL.ms + " ms (dovevano essere " + puntiFin(gL.ms, 30000) + ")");
    if (gL.ms > 8000) no("Luca ci ha messo " + gL.ms + " ms (doveva essere presto)");
    if (v.fin.g[idL].tab && v.fin.g[idL].tab.indexOf("_") < 0) no("nella foto il tabellone di Luca è scoperto");
    if (storiaConFrase(fr1).length || JSON.stringify(vm(C)).indexOf(fr1) >= 0) no("Luca ha risolto e la frase è passata nella foto");
    if (!await W.aspetta(function () { return /Risolta in \d+ s: \+[\d.]+ · aspettiamo gli altri/.test(azioni(F.Luca)) && celle(F.Luca).coperte === 0; }, 4000)) no("Luca non legge «✅ Risolta in … · aspettiamo gli altri» o non vede la sua frase («" + azioni(F.Luca).slice(0, 90) + "»)");
    if (!await W.aspetta(function () { return /Luca ✅/.test(azioni(F.Giulia)) || /✅/.test((F.Giulia.document.querySelector(".ru-chip:nth-child(2)") || {}).textContent || ""); }, 4000)) L.push("(Giulia non vede ancora ✅ di Luca)");
    L.push("Luca risolve in " + (gL.ms / 1000).toFixed(1) + " s: +" + gL.punti);
    // Luca ricarica la pagina dopo aver risolto: ritrova la sua frase (gliela rimanda l'host in un messaggio solo per lui)
    await W.ricarica("Luca"); F.Luca = W.finestra("Luca"); senzaAnimazioni(F.Luca);
    if (!await W.aspetta(function () { var c = celle(F.Luca); return /Risolta in/.test(azioni(F.Luca)) && c.coperte === 0 && c.lettere > 0; }, 15000)) no("Luca ricarica dopo aver risolto e non ritrova la sua frase (" + JSON.stringify(celle(F.Luca)) + " · «" + azioni(F.Luca).slice(0, 60) + "»)");
    var sua = (W.BR.storia || []).filter(function (x) { return x.topic.indexOf("/" + C + "/") >= 0 && x.p.indexOf('"finSua"') >= 0; });
    if (!sua.length || sua.some(function (x) { return x.p.indexOf('"to":"' + idL + '"') < 0; })) no("la frase di chi rientra non va solo a Luca (" + sua.length + " messaggi)");
    L.push("Luca ricarica: ritrova la sua frase");
    // Giulia tardi (a 20 secondi), Paky passa
    await finche(C, function () { var Q = Pdi(W.finestra("Paky")); return Q.fin && Q.fin.da && Date.now() - Q.fin.da >= 20000; }, null, 25000, "il tempo del tabellone non scorre");   // (l'host è su questo stesso computer: stesso orologio)
    az("Giulia", "soluzione", fr1);
    v = await finche(C, function (x) { return x.fin && x.fin.g[idG].ok; }, null, 5000, "la soluzione di Giulia non vale");
    var gG = v.fin.g[idG];
    if (gG.punti !== puntiFin(gG.ms, 30000) || gG.punti > 900) no("Giulia: " + gG.punti + " punti in " + gG.ms + " ms");
    if (storiaConFrase(fr1).length) no("Giulia ha risolto e la frase è passata sul broker prima della fine del tabellone");
    az("Paky", "passa");
    v = await finche(C, function (x) { return x.fase === "fcambio"; }, null, 5000, "risolto e passato tutti, il tabellone 1 non finisce");
    if (v.tab !== fr1) no("alla fine del tabellone la frase non si scopre a tutti");
    L.push("Giulia in " + (gG.ms / 1000).toFixed(1) + " s: +" + gG.punti + ", Paky passa");
    // ---- tabellone 2 (Testacoda): l'host ricarica a metà ----
    v = await finche(C, function (x) { return x.fase === "ftempo" && x.fin.b === 2; }, null, 8000, "non arriva il Testacoda");
    if (v.fin.g[idL].tab !== v.tab || v.fin.g[idG].tab !== v.tab) no("il Testacoda non è uguale per tutti");
    await W.dorme(4500);
    var prima = JSON.parse(JSON.stringify(vm(C))), sPrima = (W.statoStanza(C) || {})._s, restaVera = Math.round(Pdi(W.finestra("Paky")).finResta(idL));   // (la foto è di quando è partito il tabellone: il tempo vero lo sa l'host)
    W.finestra("Paky").__cbR = null;
    await W.ricarica("Paky"); senzaAnimazioni(W.finestra("Paky"));
    var dopo = await W.aspetta(function () { var s = W.statoStanza(C) || {}, x = vm(C); return s._s && s._s !== sPrima && s._r && x.fase === "ftempo" && x.fin && x.fin.b === 2 && A.contaDentro(x) === 3 ? JSON.parse(JSON.stringify(x)) : null; }, 20000);
    if (!dopo) no("l'host ricarica a metà del Testacoda e la finale non riprende (fase " + vm(C).fase + ")");
    var tP = prima.giocatori.map(function (g) { return g.nome + ":" + g.totale; }).join(","), tD = dopo.giocatori.map(function (g) { return g.nome + ":" + g.totale; }).join(",");
    if (tP !== tD) no("dopo la ripresa i totali sono cambiati: " + tP + " → " + tD);
    if (JSON.stringify(prima.fin.g[idL].esiti) !== JSON.stringify(dopo.fin.g[idL].esiti) || prima.fin.g[idL].tot !== dopo.fin.g[idL].tot) no("dopo la ripresa i punti della finale di Luca sono cambiati");
    var dr = dopo.fin.g[idL].resta - restaVera;
    if (!(dopo.fin.g[idL].resta > 0) || dr < -2500 || dr > 3000) no("dopo la ripresa il tempo di Luca è " + dopo.fin.g[idL].resta + " ms (quando l'host ha ricaricato era " + restaVera + ")");
    if (dopo.fin.g[idL].tab !== prima.fin.g[idL].tab) no("dopo la ripresa il tabellone è cambiato");
    // l'orologio di Luca riparte dal tempo che gli ridà l'host (non resta sul conto di prima, che è andato avanti durante la ricarica)
    var orL = await W.aspetta(function () { var n = +((F.Luca.document.querySelector(".ru-orol b") || {}).textContent || NaN), att = Math.ceil(dopo.fin.g[idL].resta / 1000); return n >= att - 2 && n <= att + 1 ? n : null; }, 4000);
    if (orL == null) no("dopo la ripresa l'orologio di Luca dice " + (F.Luca.document.querySelector(".ru-orol b") || {}).textContent + " (l'host gli dà " + Math.round(dopo.fin.g[idL].resta / 1000) + " s)");
    L.push("l'host ricarica a metà del Testacoda: riprende con " + Math.round(restaVera / 1000) + " → " + Math.round(dopo.fin.g[idL].resta / 1000) + " s, stessi punti");
    await W.aspetta(function () { return W.finestra("Paky").__cbR; }, 5000);
    await W.dorme(800);
    az("Luca", "passa"); az("Giulia", "passa"); az("Paky", "passa");
    // ---- tabellone 3 (Rubasecondi): la lettera che non c'è toglie 3 secondi solo a Luca ----
    v = await finche(C, function (x) { return x.fase === "ftempo" && x.fin.b === 3; }, null, 12000, "non arriva il Rubasecondi");
    var G3 = Pdi(W.finestra("Paky")), fr3 = G3.frase;
    var no3 = "ZQWXKJYHBF".split("").filter(function (x) { return R0(fr3).indexOf(x) < 0; })[0];
    az("Luca", "lettera", no3);
    v = await finche(C, function (x) { return x.fin.g[idL].pen === 3000; }, null, 4000, "la lettera sbagliata di Luca non toglie 3 secondi");
    var dL = v.fin.g[idG].resta - v.fin.g[idL].resta;
    if (v.fin.g[idG].pen || dL < 2700 || dL > 3300) no("Rubasecondi: Giulia pen " + v.fin.g[idG].pen + ", differenza di tempo " + dL + " ms");
    if (v.fin.g[idL].ch.indexOf(no3) < 0 || v.fin.g[idG].ch.indexOf(no3) >= 0) no("la lettera chiamata da Luca va anche a Giulia");
    L.push("Rubasecondi: Luca chiama " + no3 + " (non c'è): −3 s solo a lui");
    await W.dorme(800);
    az("Luca", "soluzione", fr3); await W.dorme(300); az("Giulia", "soluzione", fr3); await W.dorme(300); az("Paky", "passa");
    v = await finche(C, function (x) { return x.fase === "fbusta" || x.fase === "fine"; }, null, 12000, "finita la finale non arriva la busta");
    if (!v.classifica) no("finita la finale niente classifica");
    var win = v.classifica[0], ok = true;
    v.giocatori.forEach(function (g) { var ft = v.fin.g[g.id] ? v.fin.g[g.id].tot : 0; if (g.totale !== tot0[g.id] + ft) ok = false; });
    if (!ok) no("i punti della finale non sono nel totale");
    if (v.fase !== "fbusta" || v.busta.id !== win.id) no("la busta non va a chi ha vinto (" + win.nome + ")");
    var WW = F[win.nome] || W.finestra(win.nome);
    if (!await W.aspetta(function () { return tasto(WW, /✉️ 3/); }, 6000)) no(win.nome + " non ha le buste («" + azioni(WW).slice(0, 80) + "»)");
    Object.keys(F).filter(function (n) { return n !== win.nome; }).forEach(function (n) { if (!/sceglie una busta/.test(azioni(W.finestra(n)))) no(n + " non legge «✉️ " + win.nome + " sceglie una busta…» («" + azioni(W.finestra(n)).slice(0, 80) + "»)"); });
    tocca(WW, tasto(WW, /✉️ 3/));
    v = await finche(C, function (x) { return x.fase === "fesito" || x.fase === "fine"; }, null, 6000, "la busta non si apre");
    var gid = v.gameId, premio = v.busta.premio;
    if ([500, 1000, 2000, 5000].indexOf(premio) < 0) no("busta da " + premio + " (online con gli amici vale tutta)");
    if (!await W.aspetta(function () { return (WW.__RUOTA.INCASSI || {})[gid] === "ok"; }, 5000)) no(win.nome + " non incassa le Speed Coins");
    Object.keys(F).filter(function (n) { return n !== win.nome; }).forEach(function (n) { var w = W.finestra(n); if ((w.__RUOTA.INCASSI || {})[gid] || w.localStorage.getItem("sg-ruota-premio|" + gid)) no("anche " + n + " incassa le Speed Coins"); });
    if (!await W.aspetta(function () { return ["Paky", "Luca", "Giulia"].every(function (n) { return W.finestra(n).document.querySelector(".classifica"); }); }, 20000)) no("non arriva la classifica a tutti");
    if (!/ha aperto la busta/.test(W.testo(W.finestra("Giulia")))) no("nella classifica di Giulia non c'è la busta");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    L.push("vince " + win.nome + " (" + v.classifica.map(function (r) { return r.nome + " " + r.punti; }).join(", ") + "), busta " + premio + " solo a lui");
    return L.join(" · ");
  } });
  function R0(fr) { return String(fr || "").toUpperCase().replace(/[ÀÈÉÌÒÙ]/g, function (c) { return base(c); }).replace(/[^A-Z]/g, ""); }

  // ---- rv4: contro i Bot ----
  COPIONE.aggiungi("rv4", { nome: "Ruota contro i Bot: i Bot giocano la finale e prendono punti; la busta (un decimo) se vince la persona", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, spiaRv: true, prima: function (w) { w.__impR = Object.assign({ difficolta: "difficile", avversari: 2 }, IMP1); } }); senzaAnimazioni(P);
    var tess = await W.aspetta(function () { return A.tessera(P, "La Ruota della Fortuna"); }, 6000); if (!tess) no("non trovo la Ruota"); tess.click(); await W.dorme(300);
    if (!W.clicca(P, /Contro i Bot/, ".modo-grande")) no("non c'è «Contro i Bot»");
    await W.dorme(300);
    if (!W.clicca(P, /Comincia/)) no("non trovo «Comincia»");
    var fine = Date.now() + 200000, visti = {}, fatto = {}, misure = [];
    while (Date.now() < fine) {
      var G = Pdi(P); if (!G) { await W.dorme(200); continue; }
      var f = G.fase, k = f + ":" + (G.fin ? G.fin.b : "") + ":" + G.giroN;
      visti[f] = 1;
      if (f === "fine" || P.document.querySelector(".classifica")) break;
      try {
        if (f === "gira" && G.giocatori[G.turno].id === "host") { var br = tasto(P, /💡 Risolvi/); if (br) tocca(P, br); }
        else if (f === "risolvi" && G.giocatori[G.turno].id === "host" && !fatto[k]) { await W.dorme(200); if (await scriviUI(P, G.frase, G.vista().tab)) fatto[k] = 1; }
        else if (f === "flettere" && !G.fin.g.host.scelte && !fatto[k]) {
          if (!misure.length) misure.push("lettere");
          ["B", "C", "D", "A"].forEach(function (x) { tocca(P, lettera(P, x)); }); await W.dorme(100);
          if (tocca(P, tasto(P, /Ecco le mie lettere/))) fatto[k] = 1;
        }
        else if (f === "ftempo" && !G.finFatto("host") && !fatto[k]) {
          await W.dorme(1200);
          if (G.fin.b === 3) { var bs = tasto(P, /La so: scrivo/); if (bs) { tocca(P, bs); await W.dorme(200); } }
          if (await scriviUI(P, G.frase, G.finTab(G.fin.g.host.ch))) fatto[k] = 1;
        }
        else if (f === "fbusta" && G.busta && G.busta.id === "host") { var bb = tasto(P, /✉️ 2/); if (bb) tocca(P, bb); }
      } catch (e) {}
      await W.dorme(250);
    }
    var G2 = Pdi(P);
    if (!G2.fin) no("contro i Bot non c'è stata la finale");
    var bot = G2.giocatori.filter(function (g) { return g.bot; }), punti = bot.map(function (b) { return b.nome + " +" + G2.fin.g[b.id].tot + " (" + G2.fin.g[b.id].risolte + " su 3)"; });
    if (!bot.some(function (b) { return G2.fin.g[b.id].tot > 0; })) no("nessun Bot ha preso punti nella finale: " + punti.join(", "));
    if (!visti.flettere || !visti.frivela || !visti.fcambio) no("momenti della finale visti: " + Object.keys(visti).join(","));
    var win = G2.classifica[0], esito;
    if (win.id === "host") {
      if (!G2.busta || G2.busta.premio == null || [50, 100, 200, 500].indexOf(G2.busta.premio) < 0) no("busta contro i Bot: " + JSON.stringify(G2.busta) + " (doveva valere un decimo)");
      if (!await W.aspetta(function () { return (P.__RUOTA.INCASSI || {})[G2.busta && P.__RUOTA.H.gameId] === "ok"; }, 5000)) no("Paky non incassa la busta");
      esito = "vince Paky: busta da " + G2.busta.premio + " (un decimo)";
    } else {
      if (G2.busta) no("vince il Bot " + win.nome + " e c'è la busta");
      esito = "vince il Bot " + win.nome + ": niente busta";
    }
    if (!await W.aspetta(function () { return P.document.querySelector(".classifica"); }, 20000)) no("non arriva la classifica");
    return "Bot nella finale: " + punti.join(", ") + " · " + esito + " · " + W.testo(P).replace(/\s+/g, " ").slice(0, 120);
  } });

  // ---- rv5: sullo stesso telefono ----
  COPIONE.aggiungi("rv5", { nome: "Ruota sullo stesso telefono: niente finale (né il suo tasto), la busta a chi vince", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, spiaRv: true, prima: function (w) { w.__impR = IMP1; } }); senzaAnimazioni(P);
    var tess = await W.aspetta(function () { return A.tessera(P, "La Ruota della Fortuna"); }, 6000); if (!tess) no("non trovo la Ruota"); tess.click(); await W.dorme(300);
    if (!W.clicca(P, /Sullo stesso telefono/, ".modo-grande")) no("non c'è «Sullo stesso telefono»");
    if (!await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 3000)) no("non si scrivono i nomi");
    while (P.document.querySelectorAll(".sala-riga input").length < 2) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = ["Paky", "Giulia"][k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    W.clicca(P, /Avanti/); await W.dorme(300);
    if ([].some.call(P.document.querySelectorAll(".modo-chip"), function (b) { return /Finale/.test(b.textContent); })) no("sullo stesso telefono c'è il tasto «🏆 Finale»");
    if (!W.clicca(P, /Comincia/)) no("non trovo «Comincia»");
    var fine = Date.now() + 90000, fatto = {}, vistaBusta = null;
    while (Date.now() < fine) {
      var G = Pdi(P); if (!G) { await W.dorme(200); continue; }
      var f = G.fase;
      if (G.fin) no("sullo stesso telefono è partita la finale");
      if (f === "fine" || P.document.querySelector(".classifica")) break;
      try {
        if (f === "gira" && G.turno === 0) { var br = tasto(P, /💡 Risolvi/); if (br) tocca(P, br); }
        else if (f === "gira") { tocca(P, tasto(P, /💡 Risolvi/)); }
        else if (f === "risolvi" && !fatto[G.manche + ":" + G.turno]) { await W.dorme(200); if (await scriviUI(P, G.frase, G.vista().tab)) fatto[G.manche + ":" + G.turno] = 1; }
        else if (f === "fbusta") {
          await W.dorme(400);
          if (!vistaBusta) vistaBusta = { stato: azioni(P), nome: G.busta.nome };
          var bb = tasto(P, /✉️ 4/); if (bb) tocca(P, bb);
        }
      } catch (e) {}
      await W.dorme(250);
    }
    var G2 = Pdi(P);
    if (G2.fin) no("sullo stesso telefono c'è stata la finale");
    if (!G2.busta || !vistaBusta) no("sullo stesso telefono chi vince non sceglie la busta (fase " + G2.fase + ")");
    if (!new RegExp(G2.busta.nome + ", hai vinto! Scegli una busta").test(vistaBusta.stato)) no("la scritta della busta: «" + vistaBusta.stato.slice(0, 80) + "»");
    if ([50, 100, 200, 500].indexOf(G2.busta.premio) < 0) no("sullo stesso telefono la busta vale " + G2.busta.premio + " (doveva valere un decimo)");
    var inc = (P.__RUOTA.INCASSI || {})[P.__RUOTA.H.gameId];
    if (G2.busta.nome === "Paky" ? inc !== "ok" : inc) no("Speed Coins sullo stesso telefono: " + inc + " (vince " + G2.busta.nome + ")");
    if (!await W.aspetta(function () { return P.document.querySelector(".classifica") && /ha aperto la busta/.test(W.testo(P)); }, 20000)) no("nella classifica non c'è la busta");
    return "vince " + G2.busta.nome + ", busta 4 = " + G2.busta.premio + " Speed Coins (" + (inc || "—") + ") · " + W.testo(P).replace(/\s+/g, " ").slice(0, 110);
  } });
  // ---- rv6: ✉️ pari merito al primo posto, una busta a testa (30 ott 2026, il proprietario: «la busta non può andare ad entrambi?») ----
  // motore: due persone pari = due buste una dopo l'altra (chi è uscito un attimo ha il suo turno: a caso se non torna); un Bot pari = la busta solo
  // alla persona; un Bot primo da solo = niente; tutti a 0 = solo il primo. Online in 3 (finale spenta, 1 manche): Paky e
  // Luca pari, Giulia dietro: sceglie prima Paky (Luca legge «Poi tocca a te!»), poi Luca dal suo telefono; ognuno incassa
  // la SUA busta sul suo telefono e basta, Giulia niente; in classifica «Pari merito, una busta a testa».
  COPIONE.aggiungi("rv6", { nome: "Ruota: a pari merito al primo posto una busta a testa (motore e online in 3)", fai: async function () {
    var L = [];
    var w0 = await W.apriTel("Prova", { x: 0 }), R = w0.__RUOTA;
    var gg = [{ id: "a", nome: "Paky" }, { id: "b", nome: "Luca" }, { id: "c", nome: "Matt", bot: true }];
    function fine1(tot, prima) {
      var Q = R.creaPartita(gg, 1, { prenota: false, express: false, veloce: false, finale: false, mistero: false, modo: "online" });
      Q.nuovaManche(); Q.turno = 0; Q.risolvi(); Q.soluzione(Q.frase);
      if (Q.fase !== "finemanche") no("motore: la manche non finisce (" + Q.fase + ")");
      Object.keys(tot).forEach(function (id) { Q.trova(id).totale = tot[id]; });
      if (prima) prima(Q);
      Q.dopoManche(); return Q;
    }
    var Q = fine1({ a: 3000, b: 3000, c: 100 });
    if (Q.fase !== "fbusta" || Q.busta.id !== "a" || !/Pari merito/.test(Q.msg) || Q.vista().busta.pari !== 2 || (Q.vista().busta.dopo || []).join() !== "b") no("pari merito: " + Q.fase + " " + Q.msg + " " + JSON.stringify(Q.vista().busta));
    Q.finBusta(1);
    if (Q.fase !== "fesito" || (Q.vista().buste || []).length !== 1) no("la prima busta non si apre");
    Q.dopoFinale();
    if (Q.fase !== "fbusta" || Q.busta.id !== "b" || !/Ora tocca a Luca/.test(Q.msg) || Q.busta.premi) no("dopo la prima busta non tocca a Luca: " + Q.fase + " " + Q.msg);
    Q.finBusta(0); Q.dopoFinale();
    var bb = Q.vista().buste || [];
    if (Q.fase !== "fine" || bb.length !== 2 || bb[0].id !== "a" || bb[1].id !== "b" || !bb[0].premio || !bb[1].premio) no("due buste: " + Q.fase + " " + JSON.stringify(bb));
    L.push("motore: Paky e Luca pari, due buste (" + bb[0].premio + ", " + bb[1].premio + ")");
    Q = fine1({ a: 3000, b: 100, c: 3000 });
    if (Q.fase !== "fbusta" || Q.busta.id !== "a" || Q.vista().busta.pari || !/vince la partita/.test(Q.msg)) no("pari col Bot: " + Q.fase + " " + Q.msg);
    Q.finBusta(2); Q.dopoFinale(); if (Q.fase !== "fine") no("pari col Bot: dopo la busta di Paky c'è altro (" + Q.fase + ")");
    Q = fine1({ a: 100, b: 100, c: 3000 }); if (Q.fase !== "fine" || Q.busta) no("vince il Bot da solo e c'è la busta");
    Q = fine1({ a: 0, b: 0, c: 0 }); if (Q.fase !== "fbusta" || Q.busta.id !== "a" || Q.vista().busta.pari) no("tutti a 0: " + Q.fase + " " + JSON.stringify(Q.vista().busta));
    Q = fine1({ a: 3000, b: 3000, c: 0 }); Q.trova("b").via = true; Q.finBusta(4); Q.dopoFinale();
    if (Q.fase !== "fbusta" || Q.busta.id !== "b") no("Luca è uscito un attimo e perde la busta (" + Q.fase + ")");
    Q.bustaAuto(); Q.dopoFinale();   // (allo scadere dei 20 secondi: busta a caso, la incassa quando torna)
    if (Q.fase !== "fine" || (Q.vista().buste || []).length !== 2 || !Q.vista().buste[1].premio) no("la busta a caso di Luca uscito: " + Q.fase + " " + JSON.stringify(Q.vista().buste));
    L.push("pari col Bot: solo Paky · Bot primo: niente · tutti a 0: solo il primo · chi è uscito un attimo ha la sua busta a caso");

    // online in 3: Paky e Luca pari
    var F = {};
    var P = F.Paky = await W.apriTel("Paky", { x: 0, spiaRv: true, prima: function (w) { w.__impR = { manche: 1, prenota: false, express: false, veloce: false, mistero: false, finale: false }; } }); senzaAnimazioni(P);
    var C = await W.apriStanza(P, "La Ruota della Fortuna");
    F.Luca = await W.apriTel("Luca", { hash: "gioco=ruota&stanza=" + C, x: 185 }); senzaAnimazioni(F.Luca);
    F.Giulia = await W.apriTel("Giulia", { hash: "gioco=ruota&stanza=" + C, x: 370 }); senzaAnimazioni(F.Giulia);
    if (!await W.aspetta(function () { return A.contaDentro(vm(C)) === 3; }, 10000)) no("in saletta non sono in 3");
    await W.dorme(400);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    var v = await finche(C, function (x) { return x.fase === "gira" && !x.sigla; }, null, 60000, "la manche non comincia");
    function idDi(n) { return (vm(C).giocatori || []).filter(function (g) { return g.nome === n; })[0].id; }
    var ID = { Paky: "host", Luca: idDi("Luca"), Giulia: idDi("Giulia") };
    function nomeDi(id) { return Object.keys(ID).filter(function (n) { return ID[n] === id; })[0]; }
    function az(n, a, x) {
      if (n === "Paky") { var w = W.finestra("Paky"); if (w.__cbR) w.__cbR.onMsg("host", { t: "azione", a: a, x: x }); }
      else W.reteDi(n).invia({ t: "azione", a: a, x: x });
    }
    var chi = nomeDi(v.turno), Pp = P.__RUOTA.ultima;
    az(chi, "risolvi"); await W.dorme(500); az(chi, "soluzione", Pp.frase);
    v = await finche(C, function (x) { return x.fase === "finemanche"; }, null, 8000, "la manche non finisce");
    Pp = P.__RUOTA.ultima;
    Pp.trova("host").totale = 3000; Pp.trova(ID.Luca).totale = 3000; Pp.trova(ID.Giulia).totale = 500;
    v = await finche(C, function (x) { return x.fase === "fbusta"; }, null, 20000, "finita la manche non arriva la busta");
    if (v.busta.id !== "host" || v.busta.pari !== 2 || (v.busta.dopo || []).join() !== ID.Luca || !/Pari merito/.test(v.msg)) no("la prima busta: " + JSON.stringify(v.busta) + " · " + v.msg);
    if (!await W.aspetta(function () { return /Poi tocca a te/.test(azioni(F.Luca)); }, 5000)) no("Luca non legge «Poi tocca a te!» («" + azioni(F.Luca).slice(0, 80) + "»)");
    if (/Poi tocca a te/.test(azioni(F.Giulia)) || !/sceglie una busta/.test(azioni(F.Giulia))) no("Giulia legge «" + azioni(F.Giulia).slice(0, 80) + "»");
    if (!await W.aspetta(function () { return tasto(P, /✉️ 2/); }, 6000)) no("Paky non ha le buste");
    tocca(P, tasto(P, /✉️ 2/));
    v = await finche(C, function (x) { return x.fase === "fesito"; }, null, 6000, "la busta di Paky non si apre");
    var gid = v.gameId, pk = v.busta.premio;
    if (!await W.aspetta(function () { return (P.__RUOTA.INCASSI || {})[gid] === "ok"; }, 5000)) no("Paky non incassa la sua busta");
    if (!await W.aspetta(function () { return /Ora tocca a te!/.test(azioni(F.Luca)) && /Ora la busta di Luca/.test(azioni(F.Giulia)); }, 4000)) no("mentre si apre la busta di Paky: Luca legge «" + azioni(F.Luca).slice(0, 80) + "», Giulia «" + azioni(F.Giulia).slice(0, 80) + "»");
    v = await finche(C, function (x) { return x.fase === "fbusta" && x.busta.id === ID.Luca; }, null, 15000, "dopo Paky non tocca a Luca");
    if (!/Ora tocca a Luca/.test(v.msg) || v.busta.premio || v.busta.premi) no("la busta di Luca: " + v.msg + " " + JSON.stringify(v.busta));
    if (!await W.aspetta(function () { return tasto(F.Luca, /✉️ 5/); }, 6000)) no("Luca non ha le buste («" + azioni(F.Luca).slice(0, 80) + "»)");
    if (tasto(P, /✉️ 1/)) no("Paky ha ancora le buste mentre sceglie Luca");
    tocca(F.Luca, tasto(F.Luca, /✉️ 5/));
    v = await finche(C, function (x) { return x.fase === "fesito" && x.busta.id === ID.Luca; }, null, 6000, "la busta di Luca non si apre");
    var lk = v.busta.premio;
    if ((v.buste || []).length !== 2 || [500, 1000, 2000, 5000].indexOf(lk) < 0 || [500, 1000, 2000, 5000].indexOf(pk) < 0) no("le buste: " + JSON.stringify(v.buste));
    if (!await W.aspetta(function () { return (F.Luca.__RUOTA.INCASSI || {})[gid] === "ok"; }, 5000)) no("Luca non incassa la sua busta");
    if ((F.Giulia.__RUOTA.INCASSI || {})[gid] || F.Giulia.localStorage.getItem("sg-ruota-premio|" + gid)) no("anche Giulia incassa");
    if (!await W.aspetta(function () { return ["Paky", "Luca", "Giulia"].every(function (n) { return F[n].document.querySelector(".classifica"); }); }, 20000)) no("non arriva la classifica a tutti");
    ["Paky", "Luca", "Giulia"].forEach(function (n) { if (!/Pari merito, una busta a testa/.test(W.testo(F[n]))) no("nella classifica di " + n + " non c'è «Pari merito, una busta a testa»"); });
    if (!/salvadanaio/.test(W.testo(F.Luca)) || /salvadanaio/.test(W.testo(F.Giulia))) no("«Sono già nel tuo salvadanaio» al posto sbagliato");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    L.push("online: Paky busta " + pk + ", poi Luca busta " + lk + " (Luca leggeva «Poi tocca a te!»), ognuno incassa la sua, Giulia niente");
    return L.join(" · ");
  } });
})();

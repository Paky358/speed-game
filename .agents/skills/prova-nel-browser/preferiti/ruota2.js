// PROVE DELLA RUOTA DELLA FORTUNA, giro 2 (30 ott 2026): i giochi veloci della scaletta (frase lampo, Ruota del tempo,
// GiraMondo, Triplete, CruciRuota), lo spicchio Raddoppia, «🔒 La so!», la memoria delle frasi, la finale con 3 tabelloni.
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("preferiti/ruota2.js"); await COPIONE.prova("rv1")
//
// rv1: il motore, senza rete: i contenuti nuovi stanno nel tabellone; la scaletta ha i 5 giochi; CruciRuota (una parola
//      giusta resta scoperta e vale 500, una sbagliata = fuori, chi ne trova di più comincia), Triplete (3 frasi, +2.000
//      a chi le fa tutte), Ruota del tempo e GiraMondo; «La so!» (premio solo se giusta, mai a chi è di turno, nella foto
//      solo CHI ha bloccato); Raddoppia; la finale (Testacoda, Rubasecondi −3 s, una busta per frase, vince la più ricca).
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
    if (!P.puoSegreta("a") || !P.segreta("a", P.frase) || P.segreta("a", P.frase)) no("«La so!» non va (o va due volte)");
    P.segreta("c", P.frase.replace(/[A-Z]/, "Q"));
    var v = P.vista();
    if (JSON.stringify(v).indexOf(P.frase) >= 0) no("la frase (o la soluzione segreta) è nella foto");
    if (!v.lock || v.lock.indexOf("a") < 0 || v.lock.indexOf("c") < 0) no("nella foto manca chi ha bloccato");
    var ta = P.trova("a").totale, tc = P.trova("c").totale;
    P.risolvi(); P.soluzione(P.frase);
    if (P.trova("a").totale !== ta + 1500 || P.trova("c").totale !== tc) no("premi della soluzione segreta sbagliati: Paky " + (P.trova("a").totale - ta) + ", Bea " + (P.trova("c").totale - tc));
    L.push("La so! ok (+1.500 a lettere coperte, niente a chi sbaglia)");
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
    // 🏆 la finale
    var P3 = R.creaPartita(gg, 1, { prenota: false, express: false, veloce: false, finale: true, mistero: false });
    P3.nuovaManche(); P3.turno = 0; P3.risolvi(); P3.soluzione(P3.frase); P3.dopoManche();
    if (P3.fase !== "fintro") no("niente finale");
    P3.finInizia(); P3.finAuto(); P3.finVia(); P3.finSoluzione(P3.frase);
    if (P3.fase !== "fcambio") no("dopo il primo tabellone: " + P3.fase);
    P3.dopoCambio(); var tab = P3.vista().tab, frase = P3.frase;
    var parole = frase.split(" "), visto = tab.split(" ");
    if (!parole.every(function (p, i) { return visto[i].charAt(0) === p.charAt(0) && visto[i].slice(-1) === p.slice(-1); })) no("Testacoda: " + tab + " per " + frase);
    P3.finPassa(); P3.dopoCambio();
    var r0 = P3.fin.resta, ass = "ZQWXKJYHBF".split("").filter(function (x) { return P3.frase.indexOf(x) < 0; })[0];
    P3.finLettera(ass);
    if (r0 - P3.fin.resta < 2900) no("Rubasecondi: una lettera che non c'è non toglie 3 secondi");
    P3.finSoluzione(P3.frase);
    if (P3.fase !== "fbusta") no("dopo 2 frasi risolte non si scelgono le buste (" + P3.fase + ")");
    P3.finBusta(0); if (P3.fase !== "fbusta") no("con 2 frasi si sceglie una busta sola");
    P3.finBusta(1);
    var atteso = Math.max(P3.fin.premi[0], P3.fin.premi[1]);
    if (P3.fase !== "fesito" || !P3.fin.vinto || P3.fin.premio !== atteso) no("buste: premio " + P3.fin.premio + " invece di " + atteso);
    var P4 = R.creaPartita(gg, 1, { prenota: false, express: false, veloce: false, finale: true, mistero: false });
    P4.nuovaManche(); P4.turno = 0; P4.risolvi(); P4.soluzione(P4.frase); P4.dopoManche(); P4.finInizia(); P4.finAuto(); P4.finVia(); P4.finTempo();
    if (P4.fase !== "fesito" || P4.fin.vinto) no("tempo scaduto senza frasi: " + P4.fase);
    L.push("Raddoppia, finale (Testacoda, Rubasecondi, 2 buste → " + atteso + ") ok");
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
})();

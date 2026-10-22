// PROVE DI PAROLA D'ORDINE, giro 2 (22 ott 2026), compito «L'indizio» (js/games/ordine.js).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("ordine2/indizio.js"); await COPIONE.prova("o2i1")
// (carica da sola ordine2/tabellone.js, di cui usa gli aiuti: COPIONE.o2t)
// Con Edge invisibile: prova.js --porta 8995 --carica ordine2/tabellone.js,ordine2/indizio.js --prova o2i1,o2i2,o2i3,o2i4,o2i5,o2i6,o2i7,o2i8,o2i9,o2i10 --rifai
// o2i1 il controllo degli indizi del gioco con 312 esempi (blocca / avviso / vale), coi messaggi che dicono le due parole
// o2i2 il numero: nessuno scelto all'inizio, «Invia» spento con «Scegli il numero», numeri su due file sopra il campo e grandi,
//      l'Invio della tastiera chiude e basta (manda solo col numero e l'indizio buono), il blocco e l'avviso «è un'altra parola?»
//      (secondo tocco su «Sì, invia»; l'Invio non conferma)
// o2i3 il capo segna le sue parole mentre scrive: il numero si mette da solo (e lui lo cambia), le vede solo lui, dopo
//      l'invio non gli si chiede «Quali parole intendevi?», a fine turno «💭 pensava a»; senza segni la domanda c'è come prima
// o2i4 (c3) l'host che fa il capo scrive l'indizio e intanto uno esce e rientra: il campo resta lo stesso, col testo, il
//      numero, le parole segnate e il cursore (la tastiera non si chiude)
// o2i5 lo «0» vero accanto all'∞: «0: nessuna nostra parola c'entra, tentativi liberi» (e «loro» per gli altri), l'∞ come prima
// o2i6 i nomi di più parole: SAN GENNARO, L'AQUILA con l'apostrofo storto dell'iPhone, al massimo 3 parole, un pezzo che è
//      sul tabellone non vale; l'indizio lungo si legge tutto (indizio, scritta grande, chat) a 360x640
// o2i7 contro il Bot (il capo segna mentre scrive, «pensava a» dopo il turno del Bot) e «🧪 Prova da solo» di IL PAPPONE
//      (il capo sei tu: segni e mandi; il capo Bot segna le sue di nascosto)
// o2i8 la tastiera: a 360x640 la barra del capo e le caselle; con lo schermo che si accorcia (360x380, Android) e con lo studio
//      fermo e la pagina spostata come su iPhone (360x640 → 340 visibili) numeri, campo e «Invia» si vedono tutti
// o2i9 la bozza (testo, numero, segni) resta per il turno del capo, anche se la foto si rifà; al turno dopo (anche saltando delle
//      foto) il campo riparte vuoto e funziona
// o2i10 tanti indizi veri scritti nel campo contro il Bot a 360x640 con la tastiera aperta: la riga dice il blocco o l'avviso
//      giusto e si vede, niente parte; poi un nome di due parole con l'Invio
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T;
  var INDIZI = ["QUOKKA", "ZEFIRO", "GNOMO", "YETI", "FIORDO", "WAFER", "OBLO", "ZUAVO", "KIWI", "PUFFO", "VICHINGO", "BRADIPO", "KOALA", "OCEANO"];
  async function prep() { if (!COPIONE.o2t) await COPIONE.carica("ordine2/tabellone.js"); return COPIONE.o2t; }
  function senzaErrori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  function q(w, sel) { return w.document.querySelector(sel); }
  function qa(w, sel) { return [].slice.call(w.document.querySelectorAll(sel)); }
  function inp(w) { return q(w, ".or-sotto .or-input"); }
  function bInvia(w) { return q(w, ".or-sotto .or-invia"); }
  function numB(w, n) { return q(w, ".or-sotto .or-num[data-n='" + n + "']"); }
  function msg(w) { var m = q(w, ".or-sotto .or-scr-msg"); return m ? { t: m.querySelector(".tx").textContent, c: m.className } : { t: "", c: "" }; }
  function scrivi(w, testo) { var i = inp(w); i.value = testo; i.dispatchEvent(new w.Event("input", { bubbles: true })); }
  function invio(w) { inp(w).dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })); }
  function pensate(w) { return qa(w, ".or-tab .or-carta").map(function (b, i) { return b.classList.contains("pensata") ? i : -1; }).filter(function (i) { return i >= 0; }); }
  function chatTx(w) { var x = q(w, ".or-log"); return x ? x.textContent : ""; }
  function indTx(w) { var x = q(w, ".or-ind"); return x ? x.textContent : ""; }
  function prevenuto(el, w) { var ev = new w.MouseEvent("mousedown", { bubbles: true, cancelable: true }); el.dispatchEvent(ev); return ev.defaultPrevented; }
  // un indizio che va bene per questo tabellone (né blocco né avviso)
  function buono(w, C, usati) {
    var tab = vm(C).tab || [], O = w.__ORDINE;
    for (var i = 0; i < INDIZI.length; i++) { if ((usati || []).indexOf(INDIZI[i]) >= 0) continue; var c = O.controllaIndizio(INDIZI[i], tab); if (!c.blocca && !c.dubbio) return INDIZI[i]; }
    no("nessun indizio buono per questo tabellone");
  }
  async function aMisura(nome, L, H) {
    var w = W.finestra(nome), f = document.getElementById("tel-" + nome), d = w.document, vec = { w: f.style.width, h: f.style.height };
    var st = d.createElement("style"); st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}"; d.head.appendChild(st);
    f.style.width = L + "px"; f.style.height = H + "px"; void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(800); w.dispatchEvent(new w.Event("resize")); await W.dorme(400);
    return function () { if (st.parentNode) st.parentNode.removeChild(st); f.style.width = vec.w; f.style.height = vec.h; w.dispatchEvent(new w.Event("resize")); };
  }
  // la squadra di turno sbaglia apposta (gira una parola di nessuno o degli altri): il turno passa
  async function sbaglia(O, X, C, chiave, nomeInd) {
    var v = vm(C), k = v.turno, i = O.coperteDi(C, chiave, "n")[0];
    if (i == null) i = O.coperteDi(C, chiave, 1 - k)[0];
    var mossa = X.mossa || O.manda;
    for (var giri = 0; giri < 3 && vm(C).turno === k && vm(C).fase === "gioco"; giri++) {
      mossa(nomeInd, { t: "gira", i: i });
      await W.aspetta(function () { var x = vm(C); return (x.tab[i] && x.tab[i].g && !x.sospeso) || x.turno !== k; }, 9000, 50);
      if (vm(C).turno === k) i = O.coperteDi(C, chiave, 1 - k)[0];   // (era la parola d'oro: si continua)
    }
    if (!await W.aspetta(function () { return vm(C).turno !== k || vm(C).fase !== "gioco"; }, 8000)) no("il turno non passa");
  }
  // aspetta che tocchi alla squadra k (le altre squadre danno un indizio e sbagliano subito)
  async function finoA(O, X, C, k, chiaveDi, usati) {
    for (var giri = 0; giri < 4 && vm(C).turno !== k; giri++) {
      var v = vm(C), k2 = v.turno, capo = O.nomeDi(C, v.capo[k2]), ind = O.indovinoDi(C, k2) || ((v.players || []).filter(function (p) { return p.team === k2 && p.id !== v.capo[k2] && !p.via; })[0] || {}).nome;
      if (!await W.aspetta(function () { return vm(C).passo === "indizio"; }, 8000)) no("non arriva il turno dell'indizio");
      var w0 = W.finestra(capo) || X.P, p = buono(w0, C, usati); usati.push(p);
      (X.mossa || O.manda)(capo, { t: "indizio", parola: p, n: 1 });
      if (!await W.aspetta(function () { return vm(C).passo === "indovina"; }, 6000)) no("l'indizio di " + capo + " non arriva");
      await sbaglia(O, X, C, chiaveDi, ind);
    }
    if (!await W.aspetta(function () { return vm(C).turno === k && vm(C).passo === "indizio" && !vm(C).sospeso; }, 8000)) no("non tocca alla squadra " + k);
  }

  // ================= o2i1: il controllo degli indizi =================
  // [tabellone, indizio, atteso]: b = non vale, d = avviso «è un'altra parola?», ok = vale
  var CASI = [
    ["MARE","MARINAIO","d"],["PANE","PANTERA","ok"],["CANE","CANESTRO","d"],["PIANO","PIANETA","d"],["LETTO","LETTERA","d"],["LETTERA","LETTO","d"],
    ["CAMPO","CAMPANA","d"],["CAMPO","CAMPIONE","d"],["CAMPIONE","CAMPO","d"],["PALAZZO","PALA","d"],["SALAME","SALA","d"],["MOSCA","MOSCATO","d"],
    ["MOSCA","MOSCHEA","d"],["CASTELLO","CASTA","d"],["TEMPO","TEMPESTA","d"],["TEMPESTA","TEMPO","d"],["ZUCCA","ZUCCHERO","d"],["SUCCO","SUCCESSO","d"],
    ["CERVO","CERVELLO","d"],["PULCE","PULCINO","d"],["BRINA","BRINDISI","d"],["UNIVERSO","UNIVERSITÀ","d"],["RUBINO","RUBINETTO","d"],["TORRE","TORRONE","d"],
    ["PETTO","PETTINE","d"],["CASA","CASACCA","d"],["PALO","PALOMBARO","d"],["OCA","OCEANO","ok"],["RETE","RETTILE","ok"],["COLLO","COLLINA","d"],
    ["OMBRA","OMBRELLO","d"],["TAPPO","TAPPETO","d"],["PORTO","PORTIERE","d"],["CANNA","CANNELLA","d"],["BAMBU","BAMBINO","d"],["TASSA","TASSISTA","d"],
    ["SPARTA","SPARTITO","d"],["CORSO","ORSO","ok"],["ORSO","CORSO","ok"],["TORO","TORRE","ok"],
    ["MARE","MARESCIALLO","d"],["MARTE","MARTELLO","d"],["MARTELLO","MARTE","d"],["MELA","MELANZANA","d"],["SALE","SALENTO","d"],["ROSA","ROSARIO","d"],
    ["TESTA","TESTARDO","d"],["COLLA","COLLANA","d"],["PALLA","PALLADIO","d"],
    ["PIANTA","PIANTO","d"],["POSTA","POSTO","d"],["CASA","CASO","d"],["CASA","CASI","d"],["CASO","CASE","d"],["PALO","PALA","d"],["COLLO","COLLA","d"],
    ["CALCIO","CALCE","d"],["PORTA","PORTO","d"],["MODA","MODO","d"],["PASTA","PASTO","d"],["MENTA","MENTE","d"],["CAPO","CAPRA","ok"],["BANCO","BANCA","d"],
    ["PESCA","PESCE","d"],["VELA","VELO","d"],["TEMPO","TEMPIO","d"],["MAGO","MAGIA","b"],["ORO","ORA","d"],["ORA","ORO","d"],["MOSTRO","MOSTRA","d"],
    ["TORTA","TORTO","d"],["COLLO","COLLE","d"],["VITE","VITA","d"],["BAR","BARA","d"],["SET","SETA","d"],["TRAM","TRAMA","d"],["DUE","DUO","d"],
    ["GATTO","GATTI","b"],["GATTO","GATTA","b"],["GATTO","GATTINO","d"],["GATTO","GATTONE","d"],["MANO","MANI","b"],["UOVO","UOVA","b"],["OSSO","OSSA","b"],
    ["LABBRA","LABBRO","b"],["OCCHIO","OCCHI","b"],["LAGO","LAGHI","b"],["OCA","OCHE","b"],["ARANCIA","ARANCE","b"],["VALIGIA","VALIGE","b"],
    ["CILIEGIA","CILIEGE","b"],["MEDICO","MEDICI","b"],["AMICO","AMICHE","b"],["PIZZA","PIZZERIA","d"],["PIZZA","PIZZAIOLO","d"],["LIBRO","LIBRERIA","d"],
    ["LIBRO","LIBRETTO","d"],["PESCA","PESCATORE","d"],["FIORE","FIORAIO","d"],["FIORE","FIORELLINO","d"],["GELATO","GELATERIA","d"],["GELATO","GELATAIO","d"],
    ["CARTA","CARTOLINA","d"],["CARTA","CARTOLERIA","d"],["PESCE","PESCHERIA","d"],["PESCE","PESCIOLINO","d"],
    ["NAPOLI","NAPOLETANO","b"],["ROMA","ROMANO","b"],["VENEZIA","VENEZIANO","b"],["SPAGNA","SPAGNOLO","b"],["GRECIA","GRECO","b"],["SICILIA","SICILIANO","b"],
    ["FRANCIA","FRANCESE","b"],["GIAPPONE","GIAPPONESE","b"],["EGITTO","EGIZIANO","b"],["UOMO","UOMINI","b"],["DIO","DEI","b"],["DEA","DIO","b"],["BUE","BUOI","b"],
    ["CANE","CAGNOLINO","b"],["CANE","CAGNA","b"],["CANE","CANI","b"],["MILLE","MILA","b"],["RE","REGINA","ok"],["MOGLIE","MOGLI","b"],["ALA","ALI","b"],["ARMA","ARMI","b"],
    ["DENTE","DENTISTA","d"],["BARBA","BARBIERE","d"],["CALCIO","CALCIATORE","d"],["CALCIO","CALCETTO","d"],["SCARPA","SCARPONE","d"],["SCARPA","SCARPETTA","d"],
    ["CAMERA","CAMERIERE","d"],["CUCINA","CUCINARE","d"],["CUOCO","CUOCHI","b"],["NUOTO","NUOTARE","d"],["BALLO","BALLARE","d"],["BALLO","BALLERINA","d"],
    ["SOGNO","SOGNARE","d"],["VOLO","VOLARE","d"],["PITTORE","PITTURA","ok"],["MAGIA","MAGICO","d"],["SOLE","SOLARE","d"],["LUNA","LUNARE","d"],
    ["FUOCO","FUOCHI","b"],["GIOCO","GIOCHI","b"],["LUOGO","LUOGHI","b"],["BACIO","BACI","b"],["ZIO","ZII","b"],["CASA","CASETTA","d"],["LAGO","LAGHETTO","d"],
    ["MARE","MAREA","b"],["MAREA","MARE","b"],["CINA","CINESE","b"],["CUBA","CUBANO","b"],["TORINO","TORINESE","b"],
    ["ARCOBALENO","ARCO","d"],["ARCOBALENO","BALENO","b"],["CAVATAPPI","TAPPO","b"],["CAVATAPPI","TAPPI","b"],["PARACADUTE","CADUTA","b"],
    ["GIRADISCHI","DISCO","b"],["FERRAGOSTO","AGOSTO","b"],["TERREMOTO","MOTO","b"],["MELOGRANO","GRANO","b"],["FUORIGIOCO","GIOCO","b"],
    ["PALLAVOLO","VOLO","b"],["PALLAVOLO","PALLA","d"],["SEGGIOVIA","SEGGIO","d"],["CAPODANNO","ANNO","b"],["SPACCANAPOLI","NAPOLI","b"],
    ["CRUCIVERBA","VERBO","b"],["MONOPOLI","POLI","b"],["PASSAMONTAGNA","MONTAGNA","b"],["SALVAGENTE","GENTE","b"],["ASCIUGAMANO","MANO","b"],
    ["PORTAFOGLIO","FOGLIO","b"],["CAPOLINEA","LINEA","b"],["AUTOSCONTRO","SCONTRO","b"],["CERCAPERSONE","PERSONE","b"],["GIRASOLE","SOLE","b"],
    ["TAGLIAERBA","ERBA","b"],["NAVE","ASTRONAVE","b"],["NAVE","ASTRONAVI","b"],["SOLE","GIRASOLE","b"],["FOGLIO","PORTAFOGLIO","b"],["TAPPO","CAVATAPPI","b"],
    ["STRADA","AUTOSTRADA","b"],["STRADA","AUTOSTRADE","b"],["CANE","PESCECANE","b"],["LUNA","MEZZALUNA","b"],["TERRA","SOTTOTERRA","b"],["VENTO","PARAVENTO","b"],
    ["PORTO","PASSAPORTO","b"],["PORTA","PASSAPORTO","ok"],["PORTA","AEROPORTO","ok"],["PORTO","AEROPORTO","b"],["CHIAVE","PORTACHIAVI","b"],
    ["MENTA","STRUMENTO","ok"],["LINO","TOPOLINO","ok"],["TOPO","TOPOLINO","d"],["ROSA","GENEROSA","ok"],["ORSO","PERCORSO","ok"],["TETTO","ARCHITETTO","ok"],
    ["CANE","AFRICANE","ok"],["MANO","MUSULMANO","ok"],["OLIO","RAVIOLI","ok"],["LETTO","BRACCIALETTO","ok"],["AZIONE","STAZIONE","ok"],["TRADIMENTO","MENTA","ok"],
    ["MARE","mare","b"],["MARE"," Mare ","b"],["CAFFÈ","CAFFE","b"],["CAFFÈ","caffé","b"],["PERÙ","PERU","b"],["MARE","MÂRE","b"],["MARE","MARË","b"],["MARE","MÀRE","b"],
    ["CANE","ÇANE","b"],["GATTO","GÄTTO","b"],["GATTO","GATTÖ","b"],["MARE","MAARE","b"],["MARE","MAREE","b"],["GATTO","GATO","b"],["GATTO","GATTTO","b"],["PIZZA","PIZA","b"],
    ["MARE","ERAM","ok"],["MARE","M-ARE","b"],["MARE","MA RE","b"],["MARE","MARE2","b"],["OTTO","8","b"],["CANE","K9","b"],["MARE","MARE" + String.fromCharCode(0x200b),"b"],
    ["MARE","MA" + String.fromCharCode(0xad) + "RE","b"],
    ["KING KONG","KONG","b"],["KING KONG","KING","b"],["PETER PAN","PETER","b"],["PETER PAN","PANE","ok"],["MAGLIA ROSA","ROSA","b"],["FORMULA UNO","UNO","b"],
    ["FORMULA UNO","FORMULE","b"],["DON MATTEO","DON","b"],["STAR WARS","STAR","b"],["X FACTOR","X","b"],["X FACTOR","FATTORE","ok"],["L'AQUILA","AQUILA","b"],
    ["ROSA","ROSE","b"],["ROSE","ROSSO","ok"],["RE","RENNA","ok"],["RE","REGNO","ok"],["X","X","b"],["ZIO GINO","ZIO","b"],["ZIO GINO","ZII","b"],
    ["SANGUE","SAN GENNARO","ok"],["MIRACOLO","SAN GENNARO","ok"],["MELA","NEW YORK","ok"],["CALCIO","DEL PIERO","ok"],["MONTAGNA","L'AQUILA","ok"],
    ["MONTAGNA","L" + String.fromCharCode(0x2019) + "AQUILA","ok"],["MONTAGNA","SAN  GENNARO","ok"],["KONG","KING KONG","b"],["AQUILA","L'AQUILA","b"],["RE","RE MAGI","b"],
    ["MAGO","RE MAGI","b"],["MARE","LA CASA DI CARTA","b"],["ROTONDA","SAN GIOVANNI ROTONDO","b"],["PANE","SAN GIOVANNI ROTONDO","ok"],["OTTO","OTTO","b"],
    ["MELA","OTTO","ok"],["NAVE","NEW YORK","ok"],["YORK","NEW YORK","b"],["MARE","SALE E PEPE","ok"],["MARE","MARE CALDO","b"],["MARE","CALDO MARE","b"],
    ["MARE","ACQUA SALATA","ok"],
    // parole vere che cambiano solo per una doppia: avviso, non blocco (la doppia sbagliata, GATO, resta un blocco)
    ["CASSA","CASA","d"],["PALLA","PALA","d"],["CAPPELLO","CAPELLO","d"],["NOTTE","NOTE","d"],["ANNO","ANO","d"],
    // (revisione del 22 ott 2026) l'accento che fa un'altra parola, una consonante in più, i femminili, gli abitanti e le parole che
    // perdono la U, le doppie di parole vere, CAPELLINI (non è CAPEL + LINI)
    ["PAPA","PAPÀ","d"],["COMO","COMÒ","d"],["META","METÀ","d"],["PAPA","PAPA","b"],["BOXE","BOXER","d"],["META","METAL","d"],["TIGRE","TIGRES","d"],
    ["ATTORE","ATTRICE","b"],["ATTRICI","ATTORE","b"],["PITTORE","PITTRICE","b"],["CONTE","CONTESSA","b"],["LEONE","LEONESSA","b"],["PRINCIPE","PRINCIPESSA","b"],
    ["STUDENTE","STUDENTESSA","b"],["DUCA","DUCHESSA","b"],["POETA","POETESSA","b"],["COMMA","COMMESSA","d"],["RIMA","RIMESSA","ok"],["PROMO","PROMESSA","d"],
    ["SIENA","SENESE","b"],["PADOVA","PADOVANO","b"],["AREZZO","ARETINO","b"],["POLONIA","POLACCO","b"],["UOVO","OVETTO","b"],["RUOTA","ROTELLA","b"],
    ["SCUOLA","SCOLARO","b"],["CANE","CANNE","d"],["CASETTA","CASSETTA","d"],["PEPE","PEPPE","d"],["LUCA","LUCCA","d"],["LINO","CAPELLINI","ok"]
  ];
  COPIONE.aggiungi("o2i1", { nome: "Parola d'ordine, l'indizio: il controllo del gioco con 312 esempi (non vale / è un'altra parola? / vale)", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 });
    if (!await W.aspetta(function () { return w.__ORDINE && w.__ORDINE.controllaIndizio; }, 8000)) no("il gioco non ha il controllo nuovo (__ORDINE.controllaIndizio)");
    var O = w.__ORDINE, sbagli = [], conta = { b: 0, d: 0, ok: 0 };
    CASI.forEach(function (x) {
      var r = O.controllaIndizio(x[1], [{ w: x[0], g: false }]), es = r.blocca ? "b" : r.dubbio ? "d" : "ok";
      conta[es]++;
      if (es !== x[2]) sbagli.push(x[0] + "/" + x[1] + ": " + es + " invece di " + x[2] + " (" + (r.blocca || r.dubbio || "vale") + ")");
      // l'errore vecchio (lo usa anche l'host) dice solo i blocchi
      if (!!O.erroreIndizio(x[1], [{ w: x[0], g: false }]) !== (es === "b")) sbagli.push(x[0] + "/" + x[1] + ": erroreIndizio diverso");
    });
    if (sbagli.length) no(sbagli.length + " sbagliati: " + sbagli.slice(0, 6).join(" · "));
    // i messaggi dicono la parola scritta e quella del tabellone
    function m(b, c) { var r = O.controllaIndizio(c, [{ w: b, g: false }]); return r.blocca || r.dubbio || ""; }
    var att = [["NAVE", "ASTRONAVE", /«ASTRONAVE» contiene «NAVE», che è sul tabellone/], ["CANE", "CANESTRO", /«CANESTRO» somiglia a «CANE».*è un'altra parola\?/],
      ["CASA", "CASO", /«CASO» somiglia a «CASA»/], ["GATTO", "GATTI", /«GATTI» è un'altra forma di «GATTO»/], ["GATTO", "GATO", /«GATO».*«GATTO».*doppia/],
      ["MARE", "MAREA", /«MAREA» è quasi uguale a «MARE»/], ["CAVATAPPI", "TAPPO", /«TAPPO» è dentro «CAVATAPPI»/], ["KONG", "KING KONG", /«KING KONG» contiene «KONG»/],
      ["MARE", "8", /^Scrivi i numeri in lettere \(OTTO\)/], ["MARE", "LA CASA DI CARTA", /^Al massimo 3 parole, solo per i nomi \(SAN GENNARO\)/], ["MARE", "MÂRE", /«MÂRE» è come «MARE»/]];
    att.forEach(function (x) { var t = m(x[0], x[1]); if (!x[2].test(t)) no("con " + x[0] + " l'indizio " + x[1] + " dice «" + t + "»"); });
    // le parole già girate non bloccano niente; apostrofi e spazi messi a posto
    if (O.controllaIndizio("MAREA", [{ w: "MARE", g: true }]).blocca) no("una parola già girata blocca ancora");
    var p1 = O.pulisciIndizio("  l" + String.fromCharCode(0x2019) + "  aquila "), p2 = O.pulisciIndizio("san   gennaro");
    if (p1 !== "L'AQUILA" || p2 !== "SAN GENNARO") no("l'indizio non si mette a posto: «" + p1 + "», «" + p2 + "»");
    if (O.numTx(0) !== "∞" || O.numTx(0, 1) !== "0" || O.numTx(3) !== "3") no("i numeri dell'indizio: " + [O.numTx(0), O.numTx(0, 1), O.numTx(3)].join(" "));
    return CASI.length + " esempi giusti (non vale " + conta.b + ", avviso " + conta.d + ", vale " + conta.ok + "); messaggi con le due parole; girate libere; «L'AQUILA», «SAN GENNARO»";
  } });

  // ================= o2i2: il numero =================
  COPIONE.aggiungi("o2i2", { nome: "Parola d'ordine, l'indizio: nessun numero scelto, numeri sopra il campo su due file, Invio che chiude, blocco e «è un'altra parola?»", fai: async function () {
    var O = await prep(), N = [], usati = [];
    var X = await O.partita(["Giulia", "Luca", "Sara"], { Luca: 0, Giulia: 1, Sara: 1 }, ["Paky", "Giulia"]), C = X.C;
    await O.comincia(X); await O.tuttiCalmi(X.nomi, 15000);
    var k = vm(C).turno, capo = X.capi[k], w = W.finestra(capo), ind = k === 0 ? "Luca" : "Sara";
    if (!await W.aspetta(function () { return inp(w); }, 5000)) no(capo + " non ha il campo dell'indizio");
    var rimL = await aMisura(capo, 412, 915);
    try {
      var aL = Math.min.apply(null, qa(w, ".or-sotto .or-num[data-n]").map(function (b) { return b.getBoundingClientRect().height; }));
      if (aL < 40) no("a 412x915 i numeri sono alti " + Math.round(aL) + " px");
      N.push("a 412x915 numeri alti " + Math.round(aL) + " px");
    } finally { rimL(); }
    var rim = await aMisura(capo, 360, 640);
    try {
      // 1. all'inizio: nessun numero acceso, «Invia» spento con «Scegli il numero»
      if (qa(w, ".or-sotto .or-num.on").length) no("all'inizio c'è già un numero scelto");
      var bi = bInvia(w); if (!bi || bi.getAttribute("aria-disabled") !== "true" || !bi.classList.contains("manca") || !/Scegli il numero/.test(bi.textContent)) no("«Invia» non è spento con «Scegli il numero» («" + (bi && bi.textContent) + "», spento " + (bi && bi.getAttribute("aria-disabled")) + ")");
      // 2. i numeri: 11 (1-9, 0, ∞), su due file, sopra il campo, grandi
      var nn = qa(w, ".or-sotto .or-num[data-n]"), file = {}, ir = inp(w).getBoundingClientRect();
      if (nn.length !== 11) no("i tasti dei numeri sono " + nn.length);
      if (nn.map(function (b) { return b.textContent; }).join(" ") !== "1 2 3 4 5 6 7 8 9 0 ∞") no("i numeri sono «" + nn.map(function (b) { return b.textContent; }).join(" ") + "»");
      var minL = 999, minA = 999;
      nn.forEach(function (b) { var r = b.getBoundingClientRect(); file[Math.round(r.top)] = 1; minL = Math.min(minL, r.width); minA = Math.min(minA, r.height); if (r.bottom > ir.top + 1) no("il numero " + b.textContent + " non sta sopra il campo"); });
      if (Object.keys(file).length !== 2) no("i numeri stanno su " + Object.keys(file).length + " file");
      if (minL < 44 || minA < 36) no("i numeri sono piccoli: " + Math.round(minL) + "x" + Math.round(minA) + " px (prima 30 px di larghezza)");
      N.push("a 360x640 numeri su 2 file sopra il campo, " + Math.round(minL) + "x" + Math.round(minA) + " px, nessuno scelto, «Scegli il numero»");
      // 3. scrivo e premo Invio senza numero: non parte, la tastiera si chiude, la riga dice di scegliere il numero
      var p = buono(w, C, usati); usati.push(p);
      inp(w).focus(); await W.dorme(200); scrivi(w, p);
      bInvia(w).click(); await W.dorme(500);
      if (vm(C).passo !== "indizio") no("il tocco su «Scegli il numero» ha mandato l'indizio");
      if (!/Scegli il numero qui sopra/.test(msg(w).t) || w.document.activeElement !== inp(w)) no("il tocco su «Scegli il numero» non lo dice o chiude la tastiera («" + msg(w).t + "»)");
      invio(w); await W.dorme(900);
      if (vm(C).passo !== "indizio") no("l'Invio della tastiera ha mandato l'indizio senza numero");
      if (w.document.activeElement === inp(w)) no("l'Invio della tastiera non chiude la tastiera");
      if (!/Scegli il numero/.test(msg(w).t)) no("dopo l'Invio senza numero la riga dice «" + msg(w).t + "»");
      N.push("Invio senza numero: non parte, tastiera chiusa, «" + msg(w).t + "»");
      // 4. un indizio che non vale (la parola del tabellone): la riga lo dice con le due parole, niente parte
      var tab = vm(C).tab, cop = tab.filter(function (c) { return !c.g; }), W0 = cop[0].w;
      numB(w, 3).click();
      if (!numB(w, 3).classList.contains("on") || bInvia(w).getAttribute("aria-disabled") !== "false" || bInvia(w).textContent !== "Invia") no("toccato il 3, «Invia» non si accende");
      scrivi(w, W0.toLowerCase()); bInvia(w).click(); await W.dorme(600);
      if (vm(C).passo !== "indizio") no("è partito un indizio che non vale (" + W0 + ")");
      if (!/err/.test(msg(w).c) || msg(w).t.indexOf("«" + W0 + "»") < 0) no("l'errore non dice la parola: «" + msg(w).t + "»");
      N.push("«" + W0.toLowerCase() + "»: «" + msg(w).t + "»");
      // 5. un indizio che comincia come una parola del tabellone: «è un'altra parola?», poi «Sì, invia»
      var dub = null;
      cop.some(function (c) { if (c.w.length < 4 || / /.test(c.w)) return false; return ["STRO", "LLONE", "TTIERA", "SCHINO"].some(function (s) { var t = c.w + s, r = w.__ORDINE.controllaIndizio(t, tab); if (r.dubbio && !r.blocca) { dub = { w: c.w, p: t }; return true; } return false; }); });
      if (!dub) no("non trovo un indizio da avviso su questo tabellone");
      scrivi(w, dub.p); bInvia(w).click(); await W.dorme(600);
      if (vm(C).passo !== "indizio") no("«" + dub.p + "» è partito senza la conferma");
      if (!/dub/.test(msg(w).c) || msg(w).t.indexOf("«" + dub.w + "»") < 0 || msg(w).t.indexOf("«" + dub.p + "»") < 0 || !/un'altra parola\?/.test(msg(w).t)) no("l'avviso dice «" + msg(w).t + "»");
      if (bInvia(w).textContent !== "Sì, invia") no("dopo l'avviso il tasto dice «" + bInvia(w).textContent + "»");
      invio(w); await W.dorme(600);
      if (vm(C).passo !== "indizio") no("l'Invio della tastiera ha confermato l'avviso");
      N.push("«" + dub.p + "»: «" + msg(w).t + "»");
      // cambio il numero: l'avviso è sulla parola, resta (e «Sì, invia» con lui)
      numB(w, 4).click(); await W.dorme(100);
      if (bInvia(w).textContent !== "Sì, invia" || !/dub/.test(msg(w).c)) no("cambiato il numero, l'avviso sparisce («" + bInvia(w).textContent + "», «" + msg(w).t + "»)");
      bInvia(w).click();
      if (!await W.aspetta(function () { var v = vm(C); return v.passo === "indovina" && v.indizio && v.indizio.parola === dub.p && v.indizio.n === 4; }, 6000)) no("«Sì, invia» non manda «" + dub.p + " 4»");
      N.push("cambiato il numero l'avviso resta; «Sì, invia»: parte «" + dub.p + " 4»");
    } finally { rim(); }
    // 6. l'altro capo: numero scelto e indizio buono, l'Invio della tastiera lo manda
    var chiave = await O.chiaveDi(X.capi[k]);
    await sbaglia(O, X, C, chiave, ind);
    var k2 = vm(C).turno, capo2 = X.capi[k2], w2 = W.finestra(capo2);
    if (!await W.aspetta(function () { return vm(C).passo === "indizio" && inp(w2); }, 8000)) no(capo2 + " non ha il campo");
    var p2 = buono(w2, C, usati); usati.push(p2);
    numB(w2, 2).click(); inp(w2).focus(); scrivi(w2, p2); invio(w2);
    if (!await W.aspetta(function () { var v = vm(C); return v.passo === "indovina" && v.indizio && v.indizio.parola === p2 && v.indizio.n === 2; }, 6000)) no("con il numero scelto l'Invio della tastiera non manda l'indizio");
    N.push(capo2 + ": 2 + Invio della tastiera: parte «" + p2 + " 2»");
    senzaErrori();
    return N.join(" · ");
  } });

  // ================= o2i3: il capo segna mentre scrive =================
  COPIONE.aggiungi("o2i3", { nome: "Parola d'ordine, l'indizio: il capo segna le sue parole mentre scrive (numero da solo, segreto, niente domanda dopo)", fai: async function () {
    var O = await prep(), N = [], usati = [];
    var X = await O.partita(["Giulia", "Luca", "Sara"], { Luca: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]), C = X.C;
    await O.comincia(X); await O.tuttiCalmi(X.nomi, 15000);
    var k = vm(C).turno, capo = X.capi[k], w = W.finestra(capo), ind = k === 0 ? "Paky" : "Sara", wI = W.finestra(ind), altri = X.nomi.filter(function (n) { return n !== capo; });
    var chiave = await O.chiaveDi(capo), mie = O.coperteDi(C, chiave, k), loro = O.coperteDi(C, chiave, 1 - k);
    if (!await W.aspetta(function () { return inp(w); }, 5000)) no(capo + " non ha il campo");
    inp(w).focus(); await W.dorme(200);
    // la casella toccata non toglie il cursore dal campo (la tastiera resta aperta)
    if (!prevenuto(q(w, ".or-tab .or-carta"), w)) no("toccare una casella mentre scrive toglierebbe il cursore dal campo");
    if (!prevenuto(numB(w, 4), w)) no("toccare un numero mentre scrive toglierebbe il cursore dal campo");
    var C0 = O.carte(w);
    C0[mie[0]].click(); C0[mie[1]].click(); C0[mie[2]].click(); await W.dorme(200);
    if (pensate(w).join() !== [mie[0], mie[1], mie[2]].sort(function (a, b) { return a - b; }).join()) no("le parole segnate dal capo sono " + pensate(w).join());
    if (!numB(w, 3).classList.contains("on")) no("con 3 parole segnate il numero non è 3");
    if (!/Pensi a: /.test(msg(w).t) || msg(w).t.indexOf(vm(C).tab[mie[0]].w) < 0) no("la riga non dice a cosa pensa: «" + msg(w).t + "»");
    C0[mie[2]].click(); await W.dorme(150);
    if (!numB(w, 2).classList.contains("on")) no("tolta una parola il numero non torna 2");
    C0[loro[0]].click(); await W.dorme(150);
    if (pensate(w).indexOf(loro[0]) >= 0) no("si può segnare una parola degli altri");
    N.push("3 segnate = 3, una tolta = 2, quelle degli altri no");
    // le vede solo lui (niente sugli altri telefoni, niente nella foto)
    altri.forEach(function (n) { var x = pensate(W.finestra(n)); if (x.length) no(n + " vede le parole pensate dal capo (" + x.join() + ")"); });
    // il capo sceglie lui ∞: un'altra parola segnata non cambia il numero
    numB(w, "inf").click(); C0[mie[3]].click(); await W.dorme(150);
    if (!numB(w, "inf").classList.contains("on")) no("scelto ∞, segnando un'altra parola il numero cambia");
    C0[mie[3]].click(); numB(w, 2).click(); await W.dorme(100);
    var p = buono(w, C, usati); usati.push(p);
    scrivi(w, p); bInvia(w).click();
    if (!await W.aspetta(function () { var v = vm(C); return v.passo === "indovina" && v.indizio && v.indizio.parola === p; }, 6000)) no("l'indizio non parte");
    var v = vm(C); if (v.indizio.n !== 2 || !v.indizio.pen) no("l'indizio è partito come " + JSON.stringify(v.indizio));
    var foto = JSON.stringify(v); if (/pensate|"l":/.test(foto)) no("le parole pensate sono nella foto della partita");
    await W.dorme(700);
    if (/Quali parole intendevi/.test(T(w)) || O.bottone(w, /^Salta$/)) no("dopo l'invio gli si chiedono ancora le parole che intendeva");
    altri.forEach(function (n) { var x = pensate(W.finestra(n)); if (x.length) no(n + " vede le parole pensate dopo l'invio"); });
    N.push("mandato «" + p + " 2» con 2 parole segnate: niente «Quali parole intendevi?», nessuno le vede");
    // la squadra ne trova una e poi sbaglia: a fine turno «💭 … pensava a» con quella trovata e +1 segreta
    var wTrova = vm(C).tab[mie[0]].w;
    await O.gira(C, ind, mie[0]);
    await sbaglia(O, X, C, chiave, ind);
    var pens = await W.aspetta(function () { return (vm(C).log || []).filter(function (e) { return e.t === "pens"; }).pop(); }, 5000);
    if (!pens || pens.ok.join() !== wTrova || pens.nasc !== 1) no("a fine turno «pensava a» dice " + JSON.stringify(pens));
    if (!await W.aspetta(function () { return /pensava a/.test(chatTx(wI)) && chatTx(wI).indexOf(wTrova + " ✓") >= 0; }, 3000)) no("nella chat di " + ind + " non c'è «pensava a " + wTrova + " ✓»");
    N.push("a fine turno «💭 pensava a " + wTrova + " ✓ +1 🤫»");
    // il turno dopo lo stesso capo non segna niente: dopo l'invio la domanda c'è, come prima
    await finoA(O, X, C, k, chiave, usati);
    var p3 = buono(w, C, usati); usati.push(p3);
    if (!await W.aspetta(function () { return inp(w); }, 5000)) no(capo + " non ha il campo al secondo turno");
    if (qa(w, ".or-sotto .or-num.on").length || pensate(w).length) no("al turno nuovo restano il numero o le parole segnate prima");
    numB(w, 1).click(); scrivi(w, p3); bInvia(w).click();
    if (!await W.aspetta(function () { return vm(C).passo === "indovina" && vm(C).indizio.parola === p3; }, 6000)) no("il secondo indizio non parte");
    if (vm(C).indizio.pen) no("senza parole segnate l'indizio dice che le ha già date");
    if (!await W.aspetta(function () { return /Quali parole intendevi/.test(T(w)) && O.bottone(w, /^Salta$/); }, 4000)) no("senza parole segnate non gli si chiede più «Quali parole intendevi?»");
    N.push("senza segni: «🤔 Quali parole intendevi?» come prima");
    senzaErrori();
    return N.join(" · ");
  } });

  // ================= o2i4: (c3) l'indizio dell'host non si cancella =================
  COPIONE.aggiungi("o2i4", { nome: "Parola d'ordine, l'indizio (c3): l'host che fa il capo scrive, uno esce e rientra: testo, numero, segni e tastiera restano", fai: async function () {
    var O = await prep(), N = [], usati = [];
    var X = await O.partitaGrande({ virtuali: ["Anna", "Bruno", "Carla"] }), C = X.C, P = X.P;
    var v0 = vm(C), mioT = (v0.players.filter(function (p) { return p.id === "host"; })[0] || {}).team;
    if (v0.capo[mioT] !== "host") X.mossa("Paky", { t: "capo" });
    if (!await W.aspetta(function () { return vm(C).capo[mioT] === "host"; }, 4000)) no("Paky non diventa capo");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && O.carte(P).length >= 20; }, 15000)) no("non comincia");
    await O.tuttiCalmi(["Paky"], 15000);
    var chiave = await O.chiaveDi("Paky");
    await finoA(O, X, C, mioT, chiave, usati);
    var altra = 1 - mioT, via = (vm(C).players.filter(function (p) { return p.team === altra && p.id !== vm(C).capo[altra]; })[0] || {}).nome;
    if (!via) no("nell'altra squadra non c'è chi esce");
    if (!await W.aspetta(function () { return inp(P); }, 5000)) no("Paky non ha il campo");
    var el0 = inp(P), mie = O.coperteDi(C, chiave, mioT);
    el0.focus(); await W.dorme(200);
    scrivi(P, "QUOK"); numB(P, 3).click(); O.carte(P)[mie[0]].click(); O.carte(P)[mie[1]].click(); await W.dorme(200);
    numB(P, 3).click();   // (le due segnate avrebbero messo 2: lui vuole 3)
    function uguale(quando) {
      var e = inp(P);
      if (e !== el0) no(quando + ": il campo è stato rifatto");
      if (e.value !== "QUOK") no(quando + ": il testo è diventato «" + e.value + "»");
      if (P.document.activeElement !== e) no(quando + ": il cursore non è più nel campo (la tastiera si chiude)");
      if (!numB(P, 3).classList.contains("on")) no(quando + ": il numero non è più 3");
      if (pensate(P).length !== 2) no(quando + ": le parole segnate sono " + pensate(P).length);
      if (!P.document.querySelector(".or-scrive")) no(quando + ": lo schermo non è più quello di chi scrive");
    }
    // esce uno dell'altra squadra: la barra dell'host cambia (compare «🏁 Chiudi la partita»), il campo no
    var cb = P.__cbH.ordine; cb.onAddio(X.virtuali[via]);
    if (!await W.aspetta(function () { return O.bottone(P, /Chiudi la partita/); }, 4000)) no("uscito " + via + ", all'host non compare «🏁 Chiudi la partita» (la barra non si è rifatta: la prova non vale)");
    await W.dorme(300); uguale("uscito " + via);
    N.push(via + " esce: compare «🏁 Chiudi la partita», il campo resta («QUOK», 3, 2 segnate, cursore)");
    cb.onMsg(X.virtuali[via], { t: "join", nome: via, omino: P.SGOmino ? P.SGOmino.casuale(via) : null });
    if (!await W.aspetta(function () { return !O.bottone(P, /Chiudi la partita/); }, 4000)) no("rientrato " + via + ", «🏁 Chiudi la partita» resta");
    await W.dorme(300); uguale("rientrato " + via);
    N.push("rientra: idem");
    // e manda l'indizio così com'è
    var p = buono(P, C, usati); scrivi(P, p); bInvia(P).click();
    if (!await W.aspetta(function () { var v = vm(C); return v.passo === "indovina" && v.indizio && v.indizio.parola === p && v.indizio.n === 3 && v.indizio.pen; }, 6000)) no("l'indizio non parte con 3 e le parole segnate (" + JSON.stringify(vm(C).indizio) + ")");
    N.push("mandato «" + p + " 3» con le parole segnate");
    senzaErrori();
    return N.join(" · ");
  } });

  // ================= o2i5: lo «0» e l'∞ =================
  COPIONE.aggiungi("o2i5", { nome: "Parola d'ordine, l'indizio: lo «0» vero («nessuna nostra parola c'entra», tentativi liberi) accanto all'∞", fai: async function () {
    var O = await prep(), N = [], usati = [];
    var X = await O.partita(["Giulia", "Luca", "Sara"], { Luca: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]), C = X.C;
    await O.comincia(X); await O.tuttiCalmi(X.nomi, 15000);
    var k = vm(C).turno, capo = X.capi[k], w = W.finestra(capo), ind = k === 0 ? "Paky" : "Sara", avv = k === 0 ? "Sara" : "Paky";
    var chiave = await O.chiaveDi(capo), mie = O.coperteDi(C, chiave, k);
    if (!await W.aspetta(function () { return inp(w); }, 5000)) no(capo + " non ha il campo");
    O.carte(w)[mie[0]].click(); await W.dorme(100);
    numB(w, 0).click(); await W.dorme(100);
    if (pensate(w).length) no("scelto lo 0, restano parole segnate");
    if (!/^0 = nessuna vostra parola c.entra/.test(msg(w).t)) no("scelto lo 0 la riga dice «" + msg(w).t + "»");
    var p = buono(w, C, usati); usati.push(p); scrivi(w, p); bInvia(w).click();
    if (!await W.aspetta(function () { var v = vm(C); return v.passo === "indovina" && v.indizio && v.indizio.parola === p; }, 6000)) no("lo 0 non parte");
    var v = vm(C); if (v.indizio.n !== 0 || !v.indizio.z || v.tentativi < 99) no("lo 0 è partito come " + JSON.stringify(v.indizio) + " · tentativi " + v.tentativi);
    await W.dorme(1800);
    var tI = indTx(W.finestra(ind)), tA = indTx(W.finestra(avv)), fz = q(W.finestra(ind), ".or-ind .or-fascia .n");
    if (!/0: nessuna nostra parola c'entra, tentativi liberi/.test(tI)) no(ind + " (squadra) legge «" + tI + "»");
    if (!/0: nessuna loro parola c'entra, tentativi liberi/.test(tA)) no(avv + " (avversari) legge «" + tA + "»");
    if (!fz || fz.textContent !== "0") no("sull'indizio il numero è «" + (fz && fz.textContent) + "»");
    if (chatTx(W.finestra(avv)).indexOf(p + " 0") < 0) no("nella chat non c'è «" + p + " 0»");
    if (/Quali parole intendevi/.test(T(w))) no("con lo 0 gli si chiedono le parole che intendeva");
    N.push("«" + p + " 0»: squadra «0: nessuna nostra parola c'entra, tentativi liberi», avversari «… loro …», chat «" + p + " 0», niente domanda");
    // la squadra gira due parole sue (tentativi liberi) e poi sbaglia
    await O.gira(C, ind, mie[0]); await O.gira(C, ind, mie[1]);
    if (vm(C).turno !== k) no("con lo 0 i tentativi non sono liberi");
    await sbaglia(O, X, C, chiave, ind);
    // l'altro capo dà ∞: come prima
    var k2 = vm(C).turno, capo2 = X.capi[k2], w2 = W.finestra(capo2);
    if (!await W.aspetta(function () { return vm(C).passo === "indizio" && inp(w2); }, 8000)) no(capo2 + " non ha il campo");
    numB(w2, "inf").click();
    if (!/^∞ = tentativi liberi/.test(msg(w2).t)) no("scelto ∞ la riga dice «" + msg(w2).t + "»");
    var p2 = buono(w2, C, usati); scrivi(w2, p2); bInvia(w2).click();
    if (!await W.aspetta(function () { var x = vm(C); return x.passo === "indovina" && x.indizio && x.indizio.parola === p2; }, 6000)) no("l'∞ non parte");
    v = vm(C); if (v.indizio.n !== 0 || v.indizio.z || v.tentativi < 99) no("l'∞ è partito come " + JSON.stringify(v.indizio));
    await W.dorme(1800);
    var f2 = q(W.finestra(ind), ".or-ind .or-fascia .n"); if (!f2 || f2.textContent !== "∞") no("sull'indizio ∞ il numero è «" + (f2 && f2.textContent) + "»");
    if (!/tentativi liberi/.test(indTx(W.finestra(ind))) || /nessuna/.test(indTx(W.finestra(ind)))) no("con ∞ si legge «" + indTx(W.finestra(ind)) + "»");
    if (!await W.aspetta(function () { return /Quali parole intendevi/.test(T(w2)); }, 3000)) no("con ∞ senza parole segnate non gli si chiedono");
    N.push("«" + p2 + " ∞»: tentativi liberi, la domanda c'è");
    senzaErrori();
    return N.join(" · ");
  } });

  // ================= o2i6: i nomi di più parole =================
  COPIONE.aggiungi("o2i6", { nome: "Parola d'ordine, l'indizio: nomi fino a 3 parole (SAN GENNARO, L'AQUILA), il pezzo che è sul tabellone, l'indizio lungo che si legge", fai: async function () {
    var O = await prep(), N = [];
    var X = await O.partita(["Giulia", "Luca", "Sara"], { Luca: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]), C = X.C;
    await O.comincia(X); await O.tuttiCalmi(X.nomi, 15000);
    var k = vm(C).turno, capo = X.capi[k], w = W.finestra(capo), ind = k === 0 ? "Paky" : "Sara";
    var chiave = await O.chiaveDi(capo), tab = vm(C).tab, cop = tab.filter(function (c) { return !c.g; });
    if (!await W.aspetta(function () { return inp(w); }, 5000)) no(capo + " non ha il campo");
    numB(w, 2).click();
    // più di 3 parole
    scrivi(w, "la casa di carta"); bInvia(w).click(); await W.dorme(400);
    if (!/Al massimo 3 parole, solo per i nomi \(SAN GENNARO\)/.test(msg(w).t)) no("4 parole: «" + msg(w).t + "»");
    // un pezzo che è sul tabellone
    var W0 = cop.filter(function (c) { return !/ /.test(c.w); })[0].w;
    scrivi(w, "new " + W0.toLowerCase()); bInvia(w).click(); await W.dorme(400);
    if (vm(C).passo !== "indizio" || msg(w).t.indexOf("«NEW " + W0 + "» contiene «" + W0 + "»") < 0) no("«NEW " + W0 + "»: «" + msg(w).t + "»");
    N.push("«la casa di carta» e «new " + W0.toLowerCase() + "» non valgono");
    // un nome lungo che vale: SAN GIOVANNI ROTONDO (o un altro), mandato e letto tutto a 360x640
    var lunghi = ["SAN GIOVANNI ROTONDO", "CRISTOFORO COLOMBO", "LEONARDO DA VINCI", "SAN GENNARO"], lungo = lunghi.filter(function (x) { var r = w.__ORDINE.controllaIndizio(x, tab); return !r.blocca && !r.dubbio; })[0];
    if (!lungo) no("nessun nome lungo vale su questo tabellone");
    var rimS = await aMisura(ind, 360, 640), rimC = await aMisura(capo, 360, 640);
    try {
      scrivi(w, lungo.toLowerCase()); bInvia(w).click();
      if (!await W.aspetta(function () { var v = vm(C); return v.passo === "indovina" && v.indizio && v.indizio.parola === lungo; }, 6000)) no("«" + lungo + "» non parte (" + msg(w).t + ")");
      var wS = W.finestra(ind);
      // la scritta grande con la faccia del capo: tutta dentro
      var cartOk = await W.aspetta(function () { var f = q(wS, ".or-cart.su.ind .or-fascia-w"); return f && f; }, 2500, 30);
      if (!cartOk) no("non vedo la scritta grande dell'indizio");
      if (cartOk.scrollWidth > cartOk.clientWidth + 1) no("nella scritta grande «" + lungo + "» è tagliato (" + cartOk.scrollWidth + " in " + cartOk.clientWidth + ")");
      var cr = q(wS, ".or-cart.su").getBoundingClientRect(); if (cr.left < -1 || cr.right > 361) no("la scritta grande esce dallo schermo");
      await W.dorme(1800);
      var fw = q(wS, ".or-ind .or-fascia-w"); if (!fw || fw.textContent !== lungo) no("sull'indizio c'è «" + (fw && fw.textContent) + "»");
      if (fw.scrollWidth > fw.clientWidth + 1) no("sull'indizio «" + lungo + "» è tagliato (" + fw.scrollWidth + " in " + fw.clientWidth + ")");
      var li = qa(wS, ".or-log .or-l-ind").pop(); if (!li || li.textContent !== lungo + " 2") no("nella chat c'è «" + (li && li.textContent) + "»");
      var lr = li.getBoundingClientRect(), chr = q(wS, ".or-chat").getBoundingClientRect(); if (lr.right > chr.right + 1) no("nella chat «" + lungo + " 2» esce a destra (" + Math.round(lr.right) + " / " + Math.round(chr.right) + ")");
      N.push("«" + lungo + " 2» a 360x640: scritta grande, indizio e chat interi (" + w.getComputedStyle(fw).fontSize + ")");
    } finally { rimS(); rimC(); }
    await sbaglia(O, X, C, chiave, ind);
    // l'altro capo: L'AQUILA con l'apostrofo storto dell'iPhone, o SAN GENNARO
    var k2 = vm(C).turno, capo2 = X.capi[k2], w2 = W.finestra(capo2);
    if (!await W.aspetta(function () { return vm(C).passo === "indizio" && inp(w2); }, 8000)) no(capo2 + " non ha il campo");
    var apo = "l" + String.fromCharCode(0x2019) + "aquila", atteso = "L'AQUILA";
    var rr = w2.__ORDINE.controllaIndizio(apo, vm(C).tab); if (rr.blocca || rr.dubbio) { apo = "san gennaro"; atteso = "SAN GENNARO"; }
    numB(w2, 1).click(); scrivi(w2, apo); bInvia(w2).click();
    if (!await W.aspetta(function () { var v = vm(C); return v.passo === "indovina" && v.indizio && v.indizio.parola === atteso; }, 6000)) no("«" + apo + "» non parte come «" + atteso + "» (" + JSON.stringify(vm(C).indizio) + " · " + msg(w2).t + ")");
    N.push("«" + apo + "» → «" + atteso + " 1»");
    senzaErrori();
    return N.join(" · ");
  } });

  // ================= o2i7: contro il Bot e «🧪 Prova da solo» =================
  COPIONE.aggiungi("o2i7", { nome: "Parola d'ordine, l'indizio: contro il Bot (segni mentre scrive, «pensava a») e «🧪 Prova da solo» (tu capo, il Bot capo)", fai: async function () {
    var O = await prep(), N = [], usati = [];
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Parola d'ordine");
    await W.apriTel("Giulia", { hash: "gioco=ordine&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return (vm(C).players || []).length >= 2; }, 8000)) no("Giulia non entra");
    if (!await W.aspetta(function () { return W.clicca(P, /contro il Bot/); }, 4000)) no("niente «🤖 … giocate contro il Bot»");
    if (!await W.aspetta(function () { return vm(C).vsBot; }, 4000)) no("non si passa a «contro il Bot»");
    if (vm(C).capo[0] !== "host") { O.manda("Paky", { t: "capo" }); if (!await W.aspetta(function () { return vm(C).capo[0] === "host"; }, 4000)) no("Paky non diventa capo"); }
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).turno === 0 && vm(C).passo === "indizio"; }, 10000)) no("la partita contro il Bot non comincia");
    await O.tuttiCalmi(["Paky", "Giulia"], 15000);
    var chiave = await O.chiaveDi("Paky"), mie = O.coperteDi(C, chiave, 0);
    if (!await W.aspetta(function () { return inp(P); }, 5000)) no("Paky non ha il campo");
    O.carte(P)[mie[0]].click(); O.carte(P)[mie[1]].click(); await W.dorme(150);
    if (!numB(P, 2).classList.contains("on")) no("contro il Bot 2 segnate non fanno 2");
    var p = buono(P, C, usati); usati.push(p); scrivi(P, p); bInvia(P).click();
    if (!await W.aspetta(function () { var v = vm(C); return v.passo === "indovina" && v.indizio && v.indizio.parola === p && v.indizio.pen; }, 6000)) no("contro il Bot l'indizio non parte con le parole segnate");
    if (pensate(W.finestra("Giulia")).length) no("Giulia vede le parole pensate");
    await W.dorme(600); if (O.bottone(P, /^Salta$/)) no("contro il Bot gli si chiedono le parole dopo averle segnate");
    var wT = vm(C).tab[mie[1]].w;
    await O.gira(C, "Giulia", mie[1]);
    O.manda("Giulia", { t: "passo" });
    var pens = await W.aspetta(function () { return (vm(C).log || []).filter(function (e) { return e.t === "pens"; }).pop(); }, 8000);
    if (!pens || pens.ok.join() !== wT || pens.nasc !== 1) no("contro il Bot «pensava a» dice " + JSON.stringify(pens));
    if (!await W.aspetta(function () { return vm(C).turno === 0 && vm(C).passo === "indizio"; }, 12000)) no("dopo il Bot non torna il vostro turno");
    N.push("contro il Bot: 2 segnate = 2, niente domanda, «💭 Paky pensava a " + wT + " ✓ +1»");
    // 🧪 la prova da solo: tu capo (segni e mandi), poi il capo Bot dell'altra squadra segna le sue di nascosto
    var wp = await W.apriTel("Pap", { x: 370, profilo: { nome: "IL PAPPONE", uid: "finto-pap" } });
    var tess = await W.aspetta(function () { return A.tessera(wp, "Parola d'ordine"); }, 5000); if (!tess) no("niente tessera");
    tess.click(); await W.dorme(400);
    if (!W.clicca(wp, /Prova da solo/)) no("IL PAPPONE non vede «Prova da solo»");
    await W.dorme(400);
    if (!wp.document.querySelector(".or-tab")) { W.clicca(wp, /Comincia|Gioca|Via|Avanti/); await W.dorme(600); }
    if (!await W.aspetta(function () { return wp.document.querySelector(".or-tab"); }, 8000)) no("la prova non parte");
    var ui = function () { return wp.__ORDINE.ui; };
    var visto = { bot: false, io: false };
    for (var giri = 0; giri < 80 && !(visto.bot && visto.io); giri++) {
      var v = ui() && ui().vm; if (!v || v.fase !== "gioco") { await W.dorme(300); continue; }
      if (v.passo === "indovina" && v.indizio && v.indizio.id !== ui().cb.myId && v.indizio.pen) visto.bot = true;
      if (v.passo === "indizio" && v.capo[v.turno] === ui().cb.myId && inp(wp) && !visto.io) {
        var key = ui().cb.chiave(), sue = []; (key || []).forEach(function (c, i) { if (c === v.turno && !v.tab[i].g) sue.push(i); });
        O.carte(wp)[sue[0]].click(); await W.dorme(100);
        var pp = ["QUOKKA", "ZEFIRO", "GNOMO", "YETI"].filter(function (x) { var r = wp.__ORDINE.controllaIndizio(x, v.tab); return !r.blocca && !r.dubbio; })[0];
        scrivi(wp, pp); bInvia(wp).click();
        if (!await W.aspetta(function () { var x = ui().vm; return x.passo === "indovina" && x.indizio && x.indizio.parola === pp; }, 5000)) no("nella prova il tuo indizio non parte");
        if (ui().vm.indizio.n !== 1 || !ui().vm.indizio.pen) no("nella prova il tuo indizio è " + JSON.stringify(ui().vm.indizio));
        visto.io = true;
      }
      await W.dorme(400);
    }
    if (!visto.io) no("nella prova non è mai toccato a te dare l'indizio");
    if (!visto.bot) no("nella prova il capo Bot non segna le sue parole");
    N.push("prova da solo: tu segni 1 = 1 e mandi; il capo Bot segna le sue");
    senzaErrori();
    return N.join(" · ");
  } });

  // ================= o2i8: la tastiera =================
  COPIONE.aggiungi("o2i8", { nome: "Parola d'ordine, l'indizio: la barra del capo a 360x640 e con la tastiera aperta (Android 360x380, iPhone con lo studio fermo)", fai: async function () {
    var O = await prep(), N = [];
    var X = await O.partita(["Giulia", "Luca", "Sara"], { Luca: 0, Giulia: 1, Sara: 1 }, ["Paky", "Giulia"]), C = X.C;
    await O.comincia(X); await O.tuttiCalmi(X.nomi, 15000);
    var k = vm(C).turno, capo = X.capi[k], w = W.finestra(capo);
    if (!await W.aspetta(function () { return inp(w); }, 5000)) no(capo + " non ha il campo");
    function dentro(quando, H, cima) {
      var ri = inp(w).getBoundingClientRect(), rb = bInvia(w).getBoundingClientRect(), nn = qa(w, ".or-sotto .or-num[data-n]"), top = Math.min.apply(null, nn.map(function (b) { return b.getBoundingClientRect().top; }));
      var basso = Math.max(ri.bottom, rb.bottom);
      if (top < (cima || 0) - 1 || basso > H + 1) no(quando + ": numeri, campo e «Invia» non si vedono tutti (da " + Math.round(top) + " a " + Math.round(basso) + " in " + (cima || 0) + "-" + H + ")");
      return Math.round(basso - top);
    }
    // 1. a 360x640, campo chiuso: le caselle e la barra
    var m1 = await O.misuraTab(capo, 360, 640, { resta: true });
    try {
      if (m1.err) no("a 360x640: " + m1.err);
      var bh = Math.round(w.document.querySelector(".st-barra").getBoundingClientRect().height);
      if (m1.info.alt < 44) no("a 360x640 col campo dell'indizio le caselle sono alte " + Math.round(m1.info.alt) + " px");
      N.push("360x640: caselle " + m1.info.casella + ", barra del capo " + bh + " px, numeri+campo " + dentro("360x640", 640) + " px");
    } finally { var f = document.getElementById("tel-" + capo); f.style.width = ""; f.style.height = ""; w.dispatchEvent(new w.Event("resize")); }
    // 2. Android: lo schermo si accorcia con la tastiera (360x380)
    var rim = await aMisura(capo, 360, 380);
    try {
      inp(w).focus(); await W.dorme(700);
      if (!w.document.querySelector(".or-scrive")) no("scrivendo lo schermo non lascia il posto al tabellone");
      dentro("tastiera aperta (360x380)", 380);
      var cc = O.carte(w), r0 = cc[0].getBoundingClientRect(), bt = w.document.querySelector(".st-barra").getBoundingClientRect().top;
      if (r0.height < 18) no("con la tastiera (360x380) le caselle sono alte " + Math.round(r0.height) + " px");
      if (cc[cc.length - 1].getBoundingClientRect().bottom > bt + 1) no("con la tastiera l'ultima riga va sotto la barra");
      N.push("Android 360x380: caselle " + Math.round(r0.width) + "x" + Math.round(r0.height) + ", numeri e campo in vista");
      inp(w).blur(); await W.dorme(500);
    } finally { rim(); }
    // 3. iPhone: la pagina non si accorcia (si accorcia solo la parte visibile, e il core abbassa --alt); lo studio resta alto
    // (congela) e il telefono sposta la vista per far vedere il campo sopra la tastiera: i numeri, subito sopra, devono stare
    // nei circa 300 px che restano visibili sopra la tastiera di un iPhone piccolo
    var rim2 = await aMisura(capo, 360, 640);
    try {
      inp(w).focus(); await W.dorme(500);
      w.document.documentElement.style.setProperty("--alt", "320px"); w.dispatchEvent(new w.Event("resize")); await W.dorme(700);
      var vh = Math.round(w.document.querySelector(".st-vista").getBoundingClientRect().height);
      if (vh < 600) no("iPhone: con la tastiera lo studio si è accorciato (" + vh + " px): non è fermo");
      var ri = inp(w).getBoundingClientRect(), nn = qa(w, ".or-sotto .or-num[data-n]"), top = Math.min.apply(null, nn.map(function (b) { return b.getBoundingClientRect().top; }));
      var serve = Math.round(ri.bottom - top);
      if (serve > 290) no("iPhone: dai numeri al campo servono " + serve + " px (sopra la tastiera ne restano circa 300)");
      N.push("iPhone (studio fermo a " + vh + " px): numeri e campo in " + serve + " px, sopra la tastiera");
      inp(w).blur(); await W.dorme(400);
    } finally { rim2(); }
    senzaErrori();
    return N.join(" · ");
  } });

  // ================= o2i9: la bozza del capo vale per il suo turno =================
  COPIONE.aggiungi("o2i9", { nome: "Parola d'ordine, l'indizio: testo, numero e segni restano per tutto il turno del capo; al turno dopo si riparte vuoti (anche se il telefono ha perso delle foto)", fai: async function () {
    var O = await prep(), N = [];
    var X = await O.partita(["Giulia", "Luca", "Sara"], { Luca: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]), C = X.C;
    await O.comincia(X); await O.tuttiCalmi(X.nomi, 15000);
    var k = vm(C).turno, capo = X.capi[k], w = W.finestra(capo);
    var chiave = await O.chiaveDi(capo), mie = O.coperteDi(C, chiave, k);
    if (!await W.aspetta(function () { return inp(w); }, 5000)) no(capo + " non ha il campo");
    var Og = w.__ORDINE, ui = Og && Og.ui;
    if (!Og || !Og.aggiorna || !ui) no("niente __ORDINE.aggiorna o __ORDINE.ui");
    if (ui.vm.nt == null) no("nella foto non c'è il numero del turno (nt)");
    scrivi(w, "QUOK"); O.carte(w)[mie[0]].click(); O.carte(w)[mie[1]].click(); await W.dorme(150);
    var el0 = inp(w), v0 = ui.vm;
    // 1. la stessa foto ridisegnata (stesso turno): tutto resta
    Og.aggiorna(ui, JSON.parse(JSON.stringify(v0))); await W.dorme(100);
    if (inp(w) !== el0 || inp(w).value !== "QUOK" || !numB(w, 2).classList.contains("on") || pensate(w).length !== 2) no("con la stessa foto la bozza cambia");
    // 2. una foto di due turni dopo (il telefono ha perso quelle in mezzo), di nuovo col suo indizio da dare: campo vuoto
    var dopo = JSON.parse(JSON.stringify(v0)); dopo.nt = (dopo.nt || 0) + 2; Og.aggiorna(ui, dopo); await W.dorme(150);
    if (!inp(w) || inp(w) === el0) no("al turno nuovo il campo non si rifà");
    if (inp(w).value !== "" || qa(w, ".or-sotto .or-num.on").length || pensate(w).length) no("al turno nuovo restano testo, numero o segni («" + inp(w).value + "», " + qa(w, ".or-sotto .or-num.on").length + ", " + pensate(w).length + ")");
    numB(w, 3).click(); if (!numB(w, 3).classList.contains("on")) no("il campo nuovo non risponde");
    N.push("stessa foto: «QUOK», 2 e 2 segnate restano · due turni dopo: campo vuoto e vivo");
    // 3. torna la foto vera: si scrive e si manda
    Og.aggiorna(ui, v0); await W.dorme(150);
    var p = buono(w, C, []); numB(w, 1).click(); scrivi(w, p); bInvia(w).click();
    if (!await W.aspetta(function () { var v = vm(C); return v.passo === "indovina" && v.indizio && v.indizio.parola === p && v.indizio.n === 1; }, 6000)) no("l'indizio non parte (" + msg(w).t + ")");
    N.push("poi «" + p + " 1» parte");
    senzaErrori();
    return N.join(" · ");
  } });

  // ================= o2i10: tanti indizi veri scritti nel campo (contro il Bot, 360x640, tastiera aperta) =================
  COPIONE.aggiungi("o2i10", { nome: "Parola d'ordine, l'indizio: tanti indizi veri scritti nel campo contro il Bot, a 360x640 con la tastiera aperta (blocchi e avvisi nella riga, mai mandati), poi un nome di due parole con l'Invio", fai: async function () {
    var O = await prep(), N = [];
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Parola d'ordine");
    await W.apriTel("Giulia", { hash: "gioco=ordine&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return (vm(C).players || []).length >= 2; }, 8000)) no("Giulia non entra");
    if (!await W.aspetta(function () { return W.clicca(P, /contro il Bot/); }, 4000)) no("niente «🤖 … giocate contro il Bot»");
    if (!await W.aspetta(function () { return vm(C).vsBot; }, 4000)) no("non si passa a «contro il Bot»");
    if (vm(C).capo[0] !== "host") { O.manda("Paky", { t: "capo" }); if (!await W.aspetta(function () { return vm(C).capo[0] === "host"; }, 4000)) no("Paky non diventa capo"); }
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).turno === 0 && vm(C).passo === "indizio"; }, 10000)) no("la partita contro il Bot non comincia");
    await O.tuttiCalmi(["Paky", "Giulia"], 15000);
    if (!await W.aspetta(function () { return inp(P); }, 5000)) no("Paky non ha il campo");
    var tab = vm(C).tab, cop = tab.filter(function (c) { return !c.g && !/[ ']/.test(c.w); }).map(function (c) { return c.w; }), Og = P.__ORDINE;
    // gli indizi che un capo vero potrebbe scrivere con QUESTO tabellone: la parola stessa (minuscola, con l'accento), il plurale,
    // un pezzo davanti (ASTRO…, PORTA…), un pezzo dietro (…STRO, …INO), il nome con la parola dentro, i numeri, 4 parole
    var prove = [];
    cop.slice(0, 8).forEach(function (w) {
      var l = w.toLowerCase();
      prove.push(l, " " + l + " ", w.replace(/[AEIOU]$/, function (v) { return v === "A" ? "E" : "I"; }), "astro" + l, "porta" + l, w + "STRO", w + "INO", "new " + l, "san " + l);
    });
    prove.push("8", "otto 3", "la casa di carta", "m@re", "l'", "x");
    var visti = { b: 0, d: 0 }, mandati = 0, rim = await aMisura("Paky", 360, 640);
    try {
      inp(P).focus(); await W.dorme(300);
      if (!P.document.querySelector(".or-scrive")) no("col cursore nel campo lo schermo non è quello di chi scrive");
      numB(P, 2).click();
      var giaScritti = {};
      for (var i = 0; i < prove.length; i++) {
        var x = prove[i], r = Og.controllaIndizio(x, vm(C).tab), px = Og.pulisciIndizio(x);
        if (!r.blocca && !r.dubbio) continue;   // (quelli buoni non li mando: finirebbe il turno)
        if (giaScritti[px]) continue; giaScritti[px] = 1;   // (lo stesso avviso due volte di fila sarebbe la conferma)
        scrivi(P, x); bInvia(P).click(); await W.dorme(120);
        var m = msg(P), el = P.document.querySelector(".or-sotto .or-scr-msg"), er = el.getBoundingClientRect();
        if (vm(C).passo !== "indizio") { mandati++; no("«" + x + "» è partito"); }
        if (r.blocca) { visti.b++; if (!/err/.test(m.c) || m.t.indexOf(r.blocca) < 0) no("«" + x + "»: la riga dice «" + m.t + "» invece di «" + r.blocca + "»"); }
        else { visti.d++; if (!/dub/.test(m.c) || m.t.indexOf(r.dubbio) < 0 || bInvia(P).textContent !== "Sì, invia") no("«" + x + "»: la riga dice «" + m.t + "», il tasto «" + bInvia(P).textContent + "»"); }
        if (P.getComputedStyle(el).display === "none" || er.height < 10 || er.bottom > 641) no("«" + x + "»: con la tastiera aperta la riga non si vede (" + Math.round(er.top) + "-" + Math.round(er.bottom) + ")");
        if (P.document.activeElement !== inp(P)) no("«" + x + "»: il tocco su Invia ha chiuso la tastiera");
      }
      if (visti.b < 20 || visti.d < 3) no("pochi casi: " + visti.b + " blocchi, " + visti.d + " avvisi");
      N.push(visti.b + " blocchi e " + visti.d + " avvisi scritti nel campo a 360x640 con la tastiera aperta: riga giusta e visibile, niente mandato");
      // un nome di due parole che vale, con l'Invio della tastiera
      var nomi = ["san gennaro", "new york", "del piero", "l'aquila", "monna lisa", "babbo natale"], buono2 = nomi.filter(function (x) { var r = Og.controllaIndizio(x, vm(C).tab); return !r.blocca && !r.dubbio; })[0];
      if (!buono2) no("nessun nome di due parole vale su questo tabellone");
      scrivi(P, buono2); invio(P);
      var atteso = Og.pulisciIndizio(buono2);
      if (!await W.aspetta(function () { var v = vm(C); return v.passo === "indovina" && v.indizio && v.indizio.parola === atteso && v.indizio.n === 2; }, 6000)) no("«" + buono2 + "» con l'Invio non parte (" + msg(P).t + ")");
      N.push("«" + buono2 + "» + Invio → «" + atteso + " 2»");
    } finally { rim(); }
    senzaErrori();
    return N.join(" · ");
  } });

  COPIONE.o2i = { inp: inp, bInvia: bInvia, numB: numB, msg: msg, scrivi: scrivi, invio: invio, pensate: pensate, buono: buono, sbaglia: sbaglia, finoA: finoA, aMisura: aMisura };
})();

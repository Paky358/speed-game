// PROVE DI PAROLA D'ORDINE, giro 2 (22 ott 2026): la REVISIONE del compito «L'indizio» (js/games/ordine.js).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("ordine2/indizio-rev.js"); await COPIONE.prova("o2v1")
// (carica da sola ordine2/tabellone.js, di cui usa gli aiuti: COPIONE.o2t)
// Con Edge invisibile: prova.js --porta 8995 --carica ordine2/tabellone.js,ordine2/indizio-rev.js --prova o2v1,o2v2 --rifai
// o2v1 116 indizi italiani veri contro parole vere del tabellone, con le decisioni del proprietario: le parole composte con un
//      primo pezzo che mancava (LUNGOMARE con MARE, MALTEMPO, CENTROCAMPO, ACQUAVITE, MADRELINGUA, CAVOLFIORE, DOPOBARBA…: prima
//      passavano senza nemmeno l'avviso), i nomi col trattino (COCA-COLA, SPIDER-MAN, anche col trattino lungo «–» del telefono),
//      e le parole che NON devono bloccarsi (SUDDITO con DITO, VICEVERSA con VERSO, PERCORSO con ORSO, CONVENTO con VENTO)
// o2v2 in partita a 360x640: «lungo» + una parola del tabellone scritta nel campo non vale (la riga lo dice e si vede, niente
//      parte); un nome col trattino scritto «coca – cola» parte come «COCA-COLA 2» e tutti lo leggono così (indizio e chat)
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no;
  async function prep() { if (!COPIONE.o2t) await COPIONE.carica("ordine2/tabellone.js"); return COPIONE.o2t; }
  function senzaErrori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  function q(w, sel) { return w.document.querySelector(sel); }
  function inp(w) { return q(w, ".or-sotto .or-input"); }
  function bInvia(w) { return q(w, ".or-sotto .or-invia"); }
  function numB(w, n) { return q(w, ".or-sotto .or-num[data-n='" + n + "']"); }
  function msg(w) { var m = q(w, ".or-sotto .or-scr-msg"); return m ? { t: m.querySelector(".tx").textContent, c: m.className, el: m } : { t: "", c: "" }; }
  function scrivi(w, testo) { var i = inp(w); i.value = testo; i.dispatchEvent(new w.Event("input", { bubbles: true })); }
  async function aMisura(nome, L, H) {
    var w = W.finestra(nome), f = document.getElementById("tel-" + nome), d = w.document, vec = { w: f.style.width, h: f.style.height };
    var st = d.createElement("style"); st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}"; d.head.appendChild(st);
    f.style.width = L + "px"; f.style.height = H + "px"; void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(800); w.dispatchEvent(new w.Event("resize")); await W.dorme(400);
    return function () { if (st.parentNode) st.parentNode.removeChild(st); f.style.width = vec.w; f.style.height = vec.h; w.dispatchEvent(new w.Event("resize")); };
  }

  // ================= o2v1: indizi veri =================
  // [parole del tabellone, indizio, atteso]: b = non vale, d = avviso «è un'altra parola?», ok = vale
  var CASI = [
    // stessa parola, plurale, femminile, doppia, accenti
    [["MARE"], "MARE", "b"], [["MARE"], "mare", "b"], [["MARE"], "MARI", "b"], [["MARE"], "MAREA", "b"], [["MARE"], "MÂRE", "b"],
    [["GATTO"], "GATO", "b"], [["GATTO"], "GATTI", "b"], [["GATTO"], "GATTA", "b"], [["PIZZA"], "PIZA", "b"], [["CAFFÈ"], "CAFFE", "b"],
    [["LEONE"], "LEONESSA", "b"], [["PRINCIPE"], "PRINCIPESSA", "b"], [["ATTORE", "PIZZA"], "ATTRICE", "b"],
    [["AMICO"], "AMICHE", "b"], [["LAGO"], "LAGHI", "b"], [["BANCA"], "BANCHE", "b"], [["OCCHIO"], "OCCHI", "b"],
    // forme irregolari e abitanti
    [["UOMO"], "UOMINI", "b"], [["UOVO"], "UOVA", "b"], [["CANE"], "CAGNOLINO", "b"], [["CANE"], "CANI", "b"], [["CANE"], "CAGNA", "b"],
    [["NAPOLI"], "NAPOLETANO", "b"], [["FRANCIA"], "FRANCESE", "b"], [["EGITTO"], "EGIZIANO", "b"], [["MILANO"], "MILANESE", "b"],
    // composte che finiscono con una parola del tabellone (decisione del proprietario: non valgono)
    [["NAVE"], "ASTRONAVE", "b"], [["SOLE"], "GIRASOLE", "b"], [["STRADA"], "AUTOSTRADA", "b"], [["TAPPO"], "CAVATAPPI", "b"],
    [["FOGLIO"], "PORTAFOGLIO", "b"], [["CANE"], "PESCECANE", "b"], [["LUNA"], "MEZZALUNA", "b"], [["TERRA"], "SOTTOTERRA", "b"],
    [["CIELO"], "GRATTACIELO", "b"], [["NOCE"], "SCHIACCIANOCI", "b"], [["MARE"], "OLTREMARE", "b"], [["CAMERA"], "TELECAMERA", "b"],
    [["VITE"], "CACCIAVITE", "b"], [["SVEGLIA"], "RADIOSVEGLIA", "b"], [["PORTO"], "PASSAPORTO", "b"], [["LUCE"], "CONTROLUCE", "b"],
    // (revisione: prima passavano senza nemmeno l'avviso)
    [["MARE"], "LUNGOMARE", "b"], [["LAGO"], "LUNGOLAGO", "b"], [["FIORE"], "CAVOLFIORE", "b"], [["CAMPO"], "CENTROCAMPO", "b"],
    [["TEMPO"], "MALTEMPO", "b"], [["LINGUA"], "MADRELINGUA", "b"], [["VITE"], "ACQUAVITE", "b"], [["COLLO"], "GIROCOLLO", "b"],
    [["NOTTE"], "BUONANOTTE", "b"], [["OCCHIO"], "MALOCCHIO", "b"], [["FORTE"], "PIANOFORTE", "b"], [["BARBA"], "DOPOBARBA", "b"],
    [["TETTO"], "SENZATETTO", "b"], [["FACCIA"], "VOLTAFACCIA", "b"], [["GUARDIA"], "AVANGUARDIA", "b"], [["SCENICO"], "PALCOSCENICO", "b"],
    [["METRO"], "MANOMETRO", "b"], [["LUPO"], "CANTALUPO", "b"], [["ANNO"], "MALANNO", "b"], [["GIORNO"], "BUONGIORNO", "b"],
    // un pezzo dell'indizio è sul tabellone
    [["AQUILA"], "L'AQUILA", "b"], [["MARE"], "MARE NOSTRUM", "b"], [["MARE"], "MA RE", "b"], [["GATTO"], "GATTO NERO", "b"],
    [["KING KONG"], "KONG", "b"], [["ROSA"], "ROSA SPINA", "b"], [["COLA"], "COCA-COLA", "b"], [["MARE"], "M-ARE", "b"],
    // cifre, troppe parole, simboli
    [["MARE"], "8", "b"], [["MARE"], "SAN GIOVANNI ROTONDO PIO", "b"], [["MARE"], "MARE!", "b"], [["MARE"], "-MARE", "b"],
    // comincia come una parola del tabellone ma è un'altra, o coppie quasi uguali: solo l'avviso
    [["CANE"], "CANESTRO", "d"], [["MARTELLO"], "MARTE", "d"], [["MARE"], "MARESCIALLO", "d"], [["CASA"], "CASO", "d"],
    [["PORTA"], "PORTO", "d"], [["CASA"], "CASSA", "d"], [["PAPA"], "PAPÀ", "d"], [["PIANO"], "PIANETA", "d"], [["LETTO"], "LETTERA", "d"],
    [["CAMPO"], "CAMPIONE", "d"], [["MELA"], "MELANZANA", "d"], [["SALE"], "SALENTO", "d"], [["PESCA"], "PESCE", "d"],
    [["PORTA"], "PORTAFOGLIO", "d"], [["PIANO"], "PIANOFORTE", "d"], [["TEMPO"], "TEMPORALE", "d"],
    // valgono
    [["MARE"], "ONDA", "ok"], [["NAPOLI"], "SAN GENNARO", "ok"], [["MELA"], "NEW YORK", "ok"], [["CALCIO"], "DEL PIERO", "ok"],
    [["TERREMOTO"], "L'AQUILA", "ok"], [["TERREMOTO"], "L" + String.fromCharCode(0x2019) + "AQUILA", "ok"], [["ORSO"], "CORSO", "ok"], [["ARTE"], "CARTE", "ok"],
    [["ORO"], "TESORO", "ok"], [["PANE"], "PETER PAN", "ok"], [["MENTA"], "STRUMENTO", "ok"], [["ORSO"], "PERCORSO", "ok"],
    [["VENTO"], "CONVENTO", "ok"], [["LETTO"], "DIALETTO", "ok"], [["PORTA"], "PASSAPORTO", "ok"], [["CANE"], "  san   gennaro ", "ok"],
    [["MARE"], "SPIDER MAN", "ok"], [["SOLE"], "SANT'ANTONIO", "ok"], [["CANE"], "D'ANNUNZIO", "ok"], [["MARE"], "PIANETA", "ok"],
    [["MARE"], "COCA-COLA", "ok"], [["MARE"], "spider " + String.fromCharCode(0x2013) + " man", "ok"], [["MARE"], "HIP-HOP", "ok"],
    [["DITO"], "SUDDITO", "ok"], [["VERSO"], "VICEVERSA", "ok"], [["MARE"], "MALE", "ok"], [["CAMPO"], "CENTRALE", "ok"]
  ];
  COPIONE.aggiungi("o2v1", { nome: "Parola d'ordine, revisione dell'indizio: " + CASI.length + " indizi veri (composte con LUNGO, MAL, CENTRO…, nomi col trattino, parole che restano libere)", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 });
    if (!await W.aspetta(function () { return w.__ORDINE && w.__ORDINE.controllaIndizio; }, 8000)) no("il gioco non ha il controllo degli indizi");
    var O = w.__ORDINE, sbagli = [], conta = { b: 0, d: 0, ok: 0 };
    CASI.forEach(function (x) {
      var tab = x[0].map(function (p) { return { w: p, g: false }; }), r = O.controllaIndizio(x[1], tab), es = r.blocca ? "b" : r.dubbio ? "d" : "ok";
      conta[es]++;
      if (es !== x[2]) sbagli.push(x[0][0] + "/" + x[1] + ": " + es + " invece di " + x[2] + " (" + (r.blocca || r.dubbio || "vale") + ")");
    });
    if (sbagli.length) no(sbagli.length + " sbagliati: " + sbagli.slice(0, 6).join(" · "));
    function m(b, c) { var r = O.controllaIndizio(c, [{ w: b, g: false }]); return r.blocca || r.dubbio || ""; }
    if (!/^«LUNGOMARE» contiene «MARE», che è sul tabellone: non vale!$/.test(m("MARE", "LUNGOMARE"))) no("LUNGOMARE con MARE dice «" + m("MARE", "LUNGOMARE") + "»");
    var p1 = O.pulisciIndizio("coca " + String.fromCharCode(0x2013) + " cola"), p2 = O.pulisciIndizio("Spider-Man");
    if (p1 !== "COCA-COLA" || p2 !== "SPIDER-MAN") no("i nomi col trattino non si mettono a posto: «" + p1 + "», «" + p2 + "»");
    return CASI.length + " indizi giusti (non vale " + conta.b + ", avviso " + conta.d + ", vale " + conta.ok + "); «LUNGOMARE contiene MARE»; «coca – cola» → «COCA-COLA»";
  } });

  // ================= o2v2: in partita =================
  COPIONE.aggiungi("o2v2", { nome: "Parola d'ordine, revisione dell'indizio: in partita a 360x640 «LUNGO…» non vale, «coca – cola» parte come «COCA-COLA 2» e si legge così", fai: async function () {
    var O = await prep(), N = [];
    var X = await O.partita(["Giulia", "Luca", "Sara"], { Luca: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]), C = X.C;
    await O.comincia(X); await O.tuttiCalmi(X.nomi, 15000);
    var k = vm(C).turno, capo = X.capi[k], w = W.finestra(capo), ind = k === 0 ? "Paky" : "Sara", avv = k === 0 ? "Sara" : "Paky";
    if (!await W.aspetta(function () { return inp(w); }, 5000)) no(capo + " non ha il campo dell'indizio");
    var rim = await aMisura(capo, 360, 640);
    try {
      // 1. «lungo» + una parola coperta del tabellone: non vale, la riga lo dice (e si vede), niente parte
      var tab = vm(C).tab, W0 = (tab.filter(function (c) { return !c.g && !/[ ']/.test(c.w) && c.w.length >= 4; })[0] || {}).w;
      if (!W0) no("niente parola adatta sul tabellone");
      inp(w).focus(); await W.dorme(150);
      numB(w, 2).click(); scrivi(w, "lungo" + W0.toLowerCase()); bInvia(w).click(); await W.dorme(600);
      if (vm(C).passo !== "indizio") no("è partito «LUNGO" + W0 + "» con " + W0 + " sul tabellone");
      var mm = msg(w);
      if (!/err/.test(mm.c) || mm.t.indexOf("«LUNGO" + W0 + "» contiene «" + W0 + "»") < 0) no("la riga dice «" + mm.t + "»");
      var r = mm.el.getBoundingClientRect(), H = w.innerHeight;
      if (r.height < 8 || r.top < 0 || r.bottom > H + 1) no("la riga dell'errore non si vede (" + Math.round(r.top) + "-" + Math.round(r.bottom) + " su " + H + ")");
      N.push("«lungo" + W0.toLowerCase() + "»: «" + mm.t + "»");
      // 2. un nome col trattino lungo e gli spazi, come lo scrive il telefono: parte come «COCA-COLA 2»
      var cand = ["coca " + String.fromCharCode(0x2013) + " cola", "spider-man", "hip-hop", "jay-z"], scelto = null;
      cand.some(function (c) { var x = w.__ORDINE.controllaIndizio(c, vm(C).tab); if (!x.blocca && !x.dubbio) { scelto = c; return true; } return false; });
      if (!scelto) no("nessun nome col trattino buono per questo tabellone");
      var atteso = w.__ORDINE.pulisciIndizio(scelto);
      scrivi(w, scelto); bInvia(w).click();
      if (!await W.aspetta(function () { var v = vm(C); return v.passo === "indovina" && v.indizio && v.indizio.parola === atteso && v.indizio.n === 2; }, 6000)) no("«" + scelto + "» non parte come «" + atteso + " 2» (" + JSON.stringify(vm(C).indizio) + ")");
      N.push("«" + scelto + "» → «" + atteso + " 2»");
    } finally { rim(); }
    // 3. tutti lo leggono così: sull'indizio e nella chat (compagno e avversario)
    for (var i = 0; i < 2; i++) {
      var chi = [ind, avv][i], wc = W.finestra(chi);
      if (!await W.aspetta(function () { var f = q(wc, ".or-ind .or-fascia-w"), l = q(wc, ".or-log"); return f && f.textContent === atteso && l && l.textContent.indexOf(atteso + " 2") >= 0; }, 5000))
        no(chi + " non legge «" + atteso + " 2» (indizio «" + ((q(wc, ".or-ind .or-fascia-w") || {}).textContent || "") + "»)");
    }
    N.push(ind + " e " + avv + " leggono «" + atteso + " 2» sull'indizio e nella chat");
    senzaErrori();
    return N.join(" · ");
  } });
})();

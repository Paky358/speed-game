// PROVE DELLA COMPAGNIA nel core (Passo 3). Pezzo p3-a: il codice fisso e la regola "una Sala sola" (311-319). Pezzo p3-b: la
// Compagnia che nasce dalla Sala, il trasloco e la rinomina (321-325, 321b, 325b: vedi più in fondo).
// Pezzo p3-c: l'host che se ne va (331-340, 336b). Pezzo p3-d: la home con le tessere, il modo "Compagnia" in 2 tocchi,
// "🔁 Riapri la Sala di ieri sera" e le misure (341-346). Pezzo p3-e: "Giocato di recente" (351 la riga a fine partita, il ➕
// e la home; 352 al massimo 20 senza doppioni; 353 la fine a misura).
// Pezzo p3-z: 420 le due sere (Sala → Compagnia → la Sala passa; 7 giorni dopo tutti dalla tessera, Marco senza profilo aspetta,
// Luca apre e sparisce, Giulia tiene la Sala; "mai due host" guardato ogni 5 s), 421 le misure di tutte le schermate nuove,
// 422 tutto il copione file per file (COPIONE.prova(422, { file: [...] }) per farlo a pezzi).
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("passo3/comune.js"); await COPIONE.carica("passo3/compagnia.js"); await COPIONE.prova(311)
// 311 il primo apre, il secondo entra · 312 due insieme (5 volte, poi con l'orologio avanti) · 313 Sala morta riaperta da un
// altro (gen 2) e chi la teneva torna da amico · 314 senza profilo: prima il profilo, poi apre lei · 314b senza profilo davvero:
// "🕐 Nessuno ancora" e si entra da soli · 315 "Ho un codice" a 6 lettere (e la Compagnia sconosciuta vuota chiede prima)
// · 316 foto viva ma host congelato (8 s) · 317 telefono addormentato che torna: non ricopre la Sala · 318 la Sala normale
// di 4 lettere come prima (anche l'host che ricarica) · 318b l'host della Compagnia ricarica: resta host, niente 👑
// · 319 misure (testata a 6 lettere, "Ho un codice" a 6 caselle, "Nessuno ancora") a 360x640 e 412x915.
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window;
  var aggiungi = (W.COPIONE && W.COPIONE.aggiungi) ? W.COPIONE.aggiungi.bind(W.COPIONE) : function (n, s) { W.COPIONE.scenari[n] = s; };
  var A = W.COPIONE.aiuti, P3 = W.COPIONE.passo3 || W.P3;
  function no(p) { throw new Error(p); }
  var C = "KFRTPQ", NOME = "Quelli del giovedì";
  function vm(c) { return A.vm(c || C); }
  function nomeHost(m) { var h = ((m && m.membri) || []).filter(function (x) { return x && x.id === "host"; })[0]; return h ? h.nome : ""; }
  function hostDi(c) { return nomeHost(vm(c)); }
  function nomi(c) { return (vm(c).membri || []).map(function (m) { return m.nome; }); }
  function eHost(w) { return !!(w && w.document.querySelector(".saletta-schermo .sl-go")); }
  function eOspite(w) { return !!(w && w.document.querySelector(".saletta-schermo .sl-attesa") && /Sei dentro/.test(W.testo(w))); }
  function titolo(w) { var h = w && w.document.querySelector(".saletta-schermo .testa h1"); return h ? h.textContent : ""; }
  function apri(nome, x, opz) { return P3.apriCompagnia(nome, C, NOME, Object.assign({ x: x, emoji: "🍻" }, opz || {})); }
  // le pillole che compaiono su un telefono (anche per un attimo): s.stop() → tutte quelle viste
  function spiaPillole(w) {
    var viste = [], t = setInterval(function () { [].forEach.call(w.document.querySelectorAll(".sg-pillola"), function (p) { if (viste.indexOf(p.textContent) < 0) viste.push(p.textContent); }); }, 30);
    return { stop: function () { clearInterval(t); return viste; }, viste: viste };
  }
  // "Ho un codice": scrive le lettere una alla volta (il campo ne tiene 6)
  async function batti6(w, testo, pausa) {
    for (var i = 0; i < testo.length; i++) {
      var inp = w.document.querySelector("input.codice4-campo"); if (!inp) no("non c'è il campo del codice");
      if (inp.value.length >= 6) return;
      inp.value += testo[i]; inp.dispatchEvent(new w.Event("input", { bubbles: true }));
      await W.dorme(pausa || 80);
    }
  }
  async function hostCompagnia(nome, x, opz) {
    var w = await apri(nome, x, opz);
    if (!await W.aspetta(function () { return eHost(w) && hostDi() === nome && (W.statoStanza(C) || {}).t === "sala"; }, 6000)) no(nome + " non apre la Sala della compagnia («" + A.T(w).slice(0, 80) + "»)");
    return w;
  }
  async function entraComp(nome, x, quanti, opz) {
    var w = await apri(nome, x, opz);
    if (!await W.aspetta(function () { return nomi().indexOf(nome) >= 0 && eOspite(w) && (!quanti || nomi().length === quanti); }, 8000)) no(nome + " non entra nella Sala della compagnia (membri: " + nomi().join(", ") + "; «" + A.T(w).slice(0, 80) + "»)");
    return w;
  }

  // 311. Il primo apre, il secondo entra
  aggiungi(311, { nome: "Compagnia: il primo apre (titolo, codice di 6 lettere), il secondo entra nella sua Sala", fai: async function () {
    var t0 = Date.now();
    var P = await hostCompagnia("Paky", 0);
    var dt = Date.now() - t0, v = vm();
    if (titolo(P) !== "🍻 " + NOME) no("titolo della Sala di Paky: «" + titolo(P) + "»");
    if (A.codiceTestata(P) !== C) no("in testata il codice è " + A.codiceTestata(P));
    var cod = P.document.querySelector(".sl-cod");
    if (!cod.classList.contains("sei")) no("la casella del codice non ha la classe «sei»");
    if (!/Compagnia/.test(cod.querySelector("small").textContent)) no("sopra il codice c'è «" + cod.querySelector("small").textContent + "»");
    if (v.gen !== 1 || !v.nato || !v.dev || !v.comp || v.comp.nome !== NOME || v.comp.emoji !== "🍻") no("foto della Sala: gen " + v.gen + ", nato " + v.nato + ", dev " + v.dev + ", comp " + JSON.stringify(v.comp));
    if (!Array.isArray(v.vice)) no("nella foto non c'è vice");
    if (!P.SGCompagnia.trova(C)) no("la compagnia non è tra quelle di Paky");
    if (P.SGCompagnia.link(C).indexOf("#gruppo=" + C) < 0) no("il link della compagnia: " + P.SGCompagnia.link(C));
    if (P.localStorage.getItem("sg-dev") !== v.dev) no("il dev della foto non è quello del telefono");
    var G = await entraComp("Giulia", 185, 2);
    if (titolo(G) !== "🍻 " + NOME) no("titolo della Sala per Giulia: «" + titolo(G) + "»");
    if (A.codiceTestata(G) !== C) no("testata di Giulia: " + A.codiceTestata(G));
    if (!G.SGCompagnia.trova(C)) no("la compagnia non è tra quelle di Giulia");
    var gi = (vm().membri || []).filter(function (m) { return m.nome === "Giulia"; })[0];
    if (!gi || gi.pr !== 1) no("Giulia nei membri senza pr: " + JSON.stringify(gi));
    if ((vm().vice || [])[0] !== gi.id) no("vice: " + JSON.stringify(vm().vice) + " invece di Giulia");
    await P3.unSoloHost(C, 3000);
    // Giulia ricarica: torna nella stessa Sala
    G = await W.ricarica("Giulia");
    if (!await W.aspetta(function () { return eOspite(G) && nomi().length === 2; }, 8000)) no("Giulia ricaricando non torna nella Sala");
    return "Paky host in " + dt + " ms (gen 1, 🍻 " + NOME + ", codice " + C + "), Giulia dentro e vice, un solo host, ricarica ok";
  } });

  // 311b. Il link fisso con un nome particolare (completa la 362 di tessere.js: il core lo legge ed entra davvero),
  // "📤 Invita" manda il messaggio della compagnia col link fisso
  aggiungi("311b", { nome: "Link fisso con «Giovedì & co=1»: titolo e compagnia salvata uguali; «📤 Invita» col messaggio della compagnia", fai: async function () {
    var nomeX = "Giovedì & co=1";
    var P = await P3.apriCompagnia("Paky", C, nomeX, { x: 0, emoji: "🎲" });
    if (!await W.aspetta(function () { return eHost(P) && vm().t === "sala"; }, 6000)) no("Paky non apre la compagnia");
    if (titolo(P) !== "🎲 " + nomeX) no("titolo: «" + titolo(P) + "»");
    var v = P.SGCompagnia.trova(C);
    if (!v || v.n !== nomeX || v.e !== "🎲") no("salvata come " + JSON.stringify(v));
    if (!vm().comp || vm().comp.nome !== nomeX) no("nella foto: " + JSON.stringify(vm().comp));
    // "📤 Invita": senza navigator.share il messaggio va negli appunti
    var copiato = null;
    try { Object.defineProperty(P.navigator, "share", { configurable: true, value: undefined }); } catch (e) {}
    Object.defineProperty(P.navigator, "clipboard", { configurable: true, value: { writeText: function (t) { copiato = t; return P.Promise.resolve(); } } });
    if (!W.clicca(P, /Invita/, ".sl-invito .sl-link")) no("non trovo «📤 Invita»");
    await W.dorme(100);
    if (!copiato) no("Invita non ha copiato niente");
    if (copiato.indexOf("È il link fisso della nostra compagnia «🎲 " + nomeX + "»") < 0 || copiato.indexOf("scrivi " + C) < 0) no("messaggio: " + copiato.slice(0, 160));
    if (copiato.indexOf("#gruppo=" + C + "&n=") < 0) no("nel messaggio non c'è il link fisso: " + copiato.slice(-120));
    // chi apre quel link (copiato) entra ed è nella stessa compagnia, con lo stesso nome
    var hash = copiato.split("#")[1];
    var G = await W.apriTel("Giulia", { x: 185, hash: hash, salaSempre: true });
    if (!await W.aspetta(function () { return eOspite(G); }, 8000)) no("Giulia dal link copiato non entra");
    var vg = G.SGCompagnia.trova(C);
    if (!vg || vg.n !== nomeX || vg.e !== "🎲" || titolo(G) !== "🎲 " + nomeX) no("Giulia: " + JSON.stringify(vg) + " titolo «" + titolo(G) + "»");
    return "titolo e compagnia «🎲 " + nomeX + "»; Invita: «" + copiato.split("\n")[0].slice(0, 70) + "…»; Giulia entra dal link copiato";
  } });

  // 312. Due aprono il link insieme: una Sala sola (5 volte, poi con l'orologio di Giulia avanti 90 s)
  aggiungi(312, { nome: "Compagnia: due aprono il link insieme → una Sala sola (5 volte + orologio sfasato)", fai: async function () {
    // giri 1-5: come capita; 6: l'orologio di Giulia avanti 90 s; 7-8: la rete lenta (mezzo secondo per ogni messaggio):
    // tutti e due non vedono l'altro e aprono, poi resta una Sala sola (7: Giulia avanti → Paky; 8: Paky avanti → Giulia,
    // che l'ha aperta "prima" per gli orologi: conta quello scritto nelle foto, uguale per tutti)
    var esiti = [];
    try {
      for (var giro = 0; giro < 8; giro++) {
        A.pulisci();
        W.BR.ritardo = giro >= 6 ? 500 : 4;
        var oG = giro === 5 || giro === 6 ? 90000 : 0, oP = giro === 7 ? 90000 : 0;
        var tel = await Promise.all([apri("Paky", 0, oP ? { orologio: oP } : {}), apri("Giulia", 185, oG ? { orologio: oG } : {})]);
        var t0 = Date.now();
        var ok = await W.aspetta(function () {
          var n = nomi(); return n.length === 2 && (eHost(tel[0]) !== eHost(tel[1])) && (eOspite(tel[0]) || eOspite(tel[1]));
        }, 9000);
        if (!ok) no("giro " + (giro + 1) + ": non c'è una Sala sola con tutti e due (membri " + nomi().join(", ") + ", host Paky " + eHost(tel[0]) + ", host Giulia " + eHost(tel[1]) + ")");
        var dt = Date.now() - t0;
        if (dt > (giro >= 6 ? 7000 : 3500)) no("giro " + (giro + 1) + ": una Sala sola solo dopo " + dt + " ms");
        await P3.unSoloHost(C, 1500 + (giro >= 6 ? 1500 : 0));
        var atteso = giro === 7 ? "Giulia" : (oG ? "Paky" : null);
        if (atteso && hostDi() !== atteso) no("giro " + (giro + 1) + ": la Sala dovrebbe essere di " + atteso + " (aperta prima): è di " + hostDi());
        if (giro >= 6 && !P3.fotoSale(C).some(function (f) { return f.da !== atteso; })) no("giro " + (giro + 1) + ": con la rete lenta non hanno aperto tutti e due (la prova non prova niente)");
        var err = W.erroriTel(); if (err.length) no("giro " + (giro + 1) + ": errori " + err.slice(0, 2).join(" / "));
        esiti.push(hostDi() + " " + dt + " ms");
      }
    } finally { W.BR.ritardo = 4; }
    return esiti.join(" · ");
  } });

  // 313. Sala morta: la riapre un altro (gen 2); chi la teneva torna da amico
  aggiungi(313, { nome: "Compagnia: Sala morta riaperta da Marco (gen 2), Paky torna e diventa amico", fai: async function () {
    var P = await hostCompagnia("Paky", 0);
    var G = await entraComp("Giulia", 185, 2);
    var sp = spiaPillole(G);
    W.spegni("Paky");
    if ((W.statoStanza(C) || {}).t !== "__hostgone" || W.statoStanza(C).g !== 1) no("testamento di Paky: " + JSON.stringify(W.statoStanza(C)));
    var t0 = Date.now();
    var M = await apri("Marco", 370);
    if (!await W.aspetta(function () { return eHost(M) && hostDi() === "Marco" && vm().gen === 2; }, 5000)) no("Marco non riapre la Sala con gen 2 (host " + hostDi() + ", gen " + vm().gen + ", «" + A.T(M).slice(0, 80) + "»)");
    var dt = Date.now() - t0;
    if (dt > 3500) no("Marco host solo dopo " + dt + " ms");
    if (titolo(M) !== "🍻 " + NOME) no("titolo della Sala di Marco: «" + titolo(M) + "»");
    // Giulia (che c'era) passa da sola nella Sala di Marco
    if (!await W.aspetta(function () { return nomi().indexOf("Giulia") >= 0 && eOspite(G); }, 6000)) no("Giulia non passa nella Sala di Marco (" + nomi().join(", ") + ")");
    var pg = sp.stop();
    if (!pg.some(function (t) { return /👑 Ora la Sala la tiene Marco/.test(t); })) no("Giulia non legge «👑 Ora la Sala la tiene Marco» (" + pg.join(" | ") + ")");
    // Paky torna: trova la Sala di Marco e diventa amico
    var spP = spiaPillole(P);
    W.riaccendi("Paky");
    if (!await W.aspetta(function () { return nomi().indexOf("Paky") >= 0 && eOspite(P); }, 8000)) no("Paky tornato non entra nella Sala di Marco (" + nomi().join(", ") + "; «" + A.T(P).slice(0, 80) + "»)");
    var pp = spP.stop();
    if (!pp.some(function (t) { return /Bentornato! Ora la Sala la tiene Marco/.test(t); })) no("Paky non legge «👋 Bentornato…» (" + pp.join(" | ") + ")");
    if (hostDi() !== "Marco" || vm().gen !== 2) no("dopo il ritorno di Paky: host " + hostDi() + " gen " + vm().gen);
    await P3.unSoloHost(C, 3000);
    if (P.localStorage.getItem("sg-mia-sala")) no("Paky ricorda ancora la Sala come sua");
    return "Marco host in " + dt + " ms (gen 2), Giulia lo segue (👑), Paky torna da amico (👋 Bentornato), un solo host";
  } });

  // 314. Senza profilo su una Compagnia vuota: prima il profilo (obbligatorio), poi la apre lei; Paky entra da lei
  aggiungi(314, { nome: "Compagnia vuota, Bea senza profilo: crea il profilo e apre lei la serata; Paky entra", fai: async function () {
    var B = await apri("Bea", 0, { profilo: false });
    var usato = await A.creaProfilo(B, "Bea", "segreto1");
    if (!await W.aspetta(function () { return eHost(B) && hostDi() === "Bea"; }, 8000)) no("Bea dopo il profilo non apre la compagnia («" + A.T(B).slice(0, 80) + "»)");
    if (titolo(B) !== "🍻 " + NOME) no("titolo: «" + titolo(B) + "»");
    var P = await entraComp("Paky", 185, 2);
    return usato + " ha fatto il profilo e aperto la serata; Paky entra in " + nomi().join(", ");
  } });

  // 314b. Senza profilo davvero (es. il profilo non c'è più su questo telefono): "🕐 Nessuno ancora", e appena Paky apre si entra
  aggiungi("314b", { nome: "Compagnia vuota senza profilo: «🕐 Nessuno ancora» e si entra da soli quando Paky apre", fai: async function () {
    var B = await W.apriTel("Bea", { x: 0, salaSempre: true });
    await W.aspetta(function () { return B.document.querySelector(".home-online"); }, 5000);
    // il profilo sparisce (come se non ci fosse): resta il nome usato su questo telefono
    B.SGNube.profilo = function () { return null; }; B.SGNube.utente = function () { return null; };
    B.localStorage.removeItem("sg-ultimo-profilo"); B.localStorage.setItem("sg-nome-ospite", "Bea");
    B.SGCompagnia.salva({ c: C, n: NOME, e: "🍻" });
    if (!W.clicca(B, /Ho un codice/, ".home-online button")) no("in home non c'è «🔑 Ho un codice»");
    await W.aspetta(function () { return B.document.querySelector("input.codice4-campo"); }, 3000);
    await batti6(B, C);
    if (!await W.aspetta(function () { return /Nessuno ancora nella compagnia/.test(W.testo(B)); }, 5000)) no("Bea non vede «🕐 Nessuno ancora» («" + A.T(B).slice(0, 80) + "»)");
    if (!/Crea il profilo e aprila tu/.test(W.testo(B))) no("manca «👤 Crea il profilo e aprila tu»");
    if ((W.statoStanza(C) || {}).t) no("Bea senza profilo ha scritto qualcosa nella stanza: " + JSON.stringify(W.statoStanza(C)));
    await W.dorme(9000);   // (oltre gli 8 s di "non risponde": resta l'attesa, niente schermo "ferma")
    if (!/Nessuno ancora nella compagnia/.test(W.testo(B)) || B.document.querySelector(".sg-ferma")) no("dopo 9 s Bea non è più nell'attesa («" + A.T(B).slice(0, 80) + "»)");
    var t0 = Date.now();
    await hostCompagnia("Paky", 185);
    if (!await W.aspetta(function () { return nomi().indexOf("Bea") >= 0 && eOspite(B); }, 12000)) no("Bea non entra da sola nella Sala di Paky (" + nomi().join(", ") + "; «" + A.T(B).slice(0, 80) + "»)");
    return "attesa ok, Bea entra da sola " + (Date.now() - t0) + " ms dopo che Paky ha aperto";
  } });

  // 315. "Ho un codice" a 6 lettere
  aggiungi(315, { nome: "«🔑 Ho un codice» a 6 lettere: alla quarta aspetta, alla sesta entra; codice sconosciuto vuoto chiede prima", fai: async function () {
    await hostCompagnia("Paky", 0);
    var G = await W.apriTel("Giulia", { x: 185, salaSempre: true });
    await W.aspetta(function () { return G.document.querySelector(".home-online"); }, 5000);
    if (G.SGCompagnia.trova(C)) no("Giulia ha già la compagnia");
    var sp = spiaPillole(G);
    W.clicca(G, /Ho un codice/, ".home-online button");
    await W.aspetta(function () { return G.document.querySelector("input.codice4-campo"); }, 3000);
    await batti6(G, "KFRT");
    await W.dorme(450);
    if (!G.document.querySelector("input.codice4-campo")) no("alla quarta lettera Giulia è già partita");
    if (G.document.querySelector(".codice4.sei")) no("con 4 lettere le caselle sono già 6");
    await batti6(G, "P");
    if (!G.document.querySelector(".codice4.sei")) no("alla quinta lettera le caselle non diventano 6");
    if (A.caselle(G) !== "KFRTP") no("caselle: " + A.caselle(G));
    await W.dorme(900);
    if (!G.document.querySelector("input.codice4-campo")) no("con 5 lettere Giulia è partita da sola");
    await batti6(G, "Q");
    if (!await W.aspetta(function () { return nomi().indexOf("Giulia") >= 0 && eOspite(G); }, 8000)) no("Giulia col codice non entra (" + nomi().join(", ") + "; «" + A.T(G).slice(0, 80) + "»)");
    if (!G.SGCompagnia.trova(C) || G.SGCompagnia.trova(C).n !== NOME) no("la compagnia non è stata salvata da Giulia");
    var pv = sp.stop();
    if (!pv.some(function (t) { return t.indexOf("📌 «🍻 " + NOME + "» è nella tua home") >= 0; })) no("Giulia non legge «📌 … è nella tua home» (" + pv.join(" | ") + ")");
    // un codice sconosciuto senza nessuno: prima chiede
    var L = await W.apriTel("Luca", { x: 370, salaSempre: true });
    await W.aspetta(function () { return L.document.querySelector(".home-online"); }, 5000);
    W.clicca(L, /Ho un codice/, ".home-online button");
    await W.aspetta(function () { return L.document.querySelector("input.codice4-campo"); }, 3000);
    await batti6(L, "ZZZZZZ");
    if (!await W.aspetta(function () { return /Non c'è nessuno nella compagnia ZZZZZZ/.test(W.testo(L)); }, 5000)) no("per ZZZZZZ non chiede («" + A.T(L).slice(0, 80) + "»)");
    await W.dorme(1500);
    if (W.statoStanza("ZZZZZZ")) no("ZZZZZZ aperta senza chiedere");
    if (!/Riscrivi il codice/.test(W.testo(L))) no("manca «✏️ Riscrivi il codice»");
    if (!W.clicca(L, /Apri la serata/)) no("manca «📌 Apri la serata»");
    if (!await W.aspetta(function () { return eHost(L) && (W.statoStanza("ZZZZZZ") || {}).t === "sala"; }, 5000)) no("«Apri la serata» non apre ZZZZZZ");
    if (titolo(L) !== "📌 Compagnia ZZZZZZ") no("titolo della compagnia nuova: «" + titolo(L) + "»");
    return "KFRT aspetta, KFRTP 6 caselle, KFRTPQ entra e salva (📌), ZZZZZZ chiede e poi apre";
  } });

  // 316. La foto della Sala c'è ma l'host è congelato (niente testamento): dopo ~8 s Marco la riapre (gen 2) con gli stessi amici
  aggiungi(316, { nome: "Compagnia con la foto viva ma l'host fermo: Marco entra, dopo ~8 s la riapre (gen 2) con Paky tra chi arriva", fai: async function () {
    var P = await hostCompagnia("Paky", 0);
    var G = await entraComp("Giulia", 185, 2);
    W.congela("Paky");
    var t0 = Date.now();
    var M = await apri("Marco", 370);
    if (!await W.aspetta(function () { return eHost(M) && hostDi() === "Marco" && vm().gen === 2; }, 16000)) no("Marco non riapre la Sala (host " + hostDi() + ", gen " + vm().gen + ", «" + A.T(M).slice(0, 80) + "»)");
    var dt = Date.now() - t0;
    if (dt < 7000) no("Marco ha riaperto troppo presto (" + dt + " ms): l'host poteva rispondere");
    var n0 = nomi();
    if (n0.indexOf("Paky") < 0) no("Paky non è tra chi arriva (" + n0.join(", ") + ")");
    if (!await W.aspetta(function () { return nomi().indexOf("Giulia") >= 0 && eOspite(G); }, 6000)) no("Giulia non passa nella Sala di Marco");
    // Paky si risveglia e si ricollega: diventa amico al posto suo (stesso nome, niente "Paky 2")
    W.scongela("Paky"); W.inciampa("Paky", 400);
    if (!await W.aspetta(function () { return eOspite(P) && nomi().filter(function (n) { return /^Paky/.test(n); }).length === 1 && nomi().indexOf("Paky") >= 0; }, 10000)) no("Paky non torna da amico al suo posto (" + nomi().join(", ") + "; «" + A.T(P).slice(0, 80) + "»)");
    if ((vm().membri || []).some(function (m) { return m.ex; })) no("resta il segnaposto di Paky");
    await P3.unSoloHost(C, 3000);
    return "Marco host dopo " + dt + " ms (gen 2, " + n0.join(", ") + "), Giulia lo segue, Paky torna al suo posto";
  } });

  // 317. Il telefono addormentato torna e NON ricopre la Sala di stasera
  aggiungi(317, { nome: "Telefono addormentato: Paky torna mentre Marco gioca e non ripubblica la sua Sala", fai: async function () {
    var P = await hostCompagnia("Paky", 0);
    var G = await entraComp("Giulia", 185, 2);
    var sP = (P3.fotoSale(C).filter(function (f) { return f.da === "Paky"; }).pop() || {}).s;
    if (!sP) no("non trovo la sessione di Paky");
    W.spegni("Paky");
    var M = await apri("Marco", 370);
    if (!await W.aspetta(function () { return eHost(M) && hostDi() === "Marco" && nomi().indexOf("Giulia") >= 0; }, 8000)) no("Marco non riapre con Giulia");
    var K = await A.lanciaDallaSala("Marco", C, "Tris");
    if (!await W.aspetta(function () { return A.codiceSaletta(G) === K; }, 6000)) no("Giulia non arriva nella saletta del Tris");
    W.clicca(M, /Comincia|Si parte|▶/, ".sl-go");
    await W.dorme(4000);
    var tR = Date.now();
    W.riaccendi("Paky");
    await W.dorme(3500);
    var mie = P3.passati(C, tR).filter(function (x) { return x.m && x.m._s === sP; });
    if (mie.length) no("Paky tornato ha pubblicato " + mie.length + " messaggi della sua Sala vecchia");
    if ((W.statoStanza(C) || {}).t !== "sala" || W.statoStanza(C)._s === sP) no("la foto trattenuta non è più quella di Marco");
    if (!await W.aspetta(function () { return nomi().indexOf("Paky") >= 0; }, 8000)) no("Paky non entra da amico nella Sala di Marco (" + nomi().join(", ") + ")");
    if (eHost(P)) no("Paky è ancora host");
    await P3.unSoloHost(C, 2500);
    return "Paky tornato: nessuna foto vecchia, entra da amico (" + nomi().join(", ") + ")";
  } });

  // 318. La Sala normale (4 lettere) come prima: dati nuovi nella foto, l'host che ricarica resta host
  aggiungi(318, { nome: "Sala normale di 4 lettere: come prima (gen/nato/dev nella foto, l'host che ricarica resta host, niente 👑)", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true });
    var S = await A.apriSalaNuova("Paky");
    if (S.length !== 4) no("la Sala normale ha il codice " + S);
    var G = await W.apriTel("Giulia", { hash: "sala=" + S, x: 185, salaSempre: true });
    if (!await W.aspetta(function () { return nomi(S).length === 2 && eOspite(G); }, 8000)) no("Giulia non entra");
    var v = vm(S);
    if (v.gen !== 1 || !v.nato || !v.dev || v.comp) no("foto: gen " + v.gen + " nato " + v.nato + " dev " + v.dev + " comp " + JSON.stringify(v.comp));
    if (titolo(P) !== "Sala online" || P.document.querySelector(".sl-cod.sei")) no("titolo o testata della Sala normale cambiati: «" + titolo(P) + "»");
    if (P.document.querySelector(".sl-cod small").textContent !== "Sala") no("etichetta del codice: " + P.document.querySelector(".sl-cod small").textContent);
    var sp = spiaPillole(G);
    P = await W.ricarica("Paky");
    if (!await W.aspetta(function () { return eHost(P) && nomi(S).length === 2 && eOspite(G) && vm(S).gen === 1; }, 10000)) no("Paky ricaricando non torna host con Giulia (" + nomi(S).join(", ") + ")");
    var pv = sp.stop();
    if (pv.some(function (t) { return /👑/.test(t); })) no("Giulia ha letto " + pv.filter(function (t) { return /👑/.test(t); }).join(" | "));
    if (vm(S).nato !== v.nato) no("ricaricando è cambiato nato");
    await P3.unSoloHost(S, 2000);
    return "Sala " + S + " gen 1, ricarica ok, pillole di Giulia: " + (pv.join(" | ") || "nessuna");
  } });

  // 318b. L'host della Compagnia ricarica: torna host, gli amici lo seguono, nessuna pillola 👑
  aggiungi("318b", { nome: "L'host della Compagnia ricarica: resta host, gli amici lo seguono, niente «👑»", fai: async function () {
    var P = await hostCompagnia("Paky", 0);
    var G = await entraComp("Giulia", 185, 2);
    var L = await entraComp("Luca", 370, 3);
    var v0 = vm(), sG = spiaPillole(G), sL = spiaPillole(L);
    P = await W.ricarica("Paky");
    if (!await W.aspetta(function () { return eHost(P) && hostDi() === "Paky" && nomi().length === 3 && eOspite(G) && eOspite(L); }, 10000)) no("dopo la ricarica: host " + hostDi() + ", membri " + nomi().join(", ") + " («" + A.T(P).slice(0, 60) + "»)");
    var v1 = vm();
    if (v1.gen !== v0.gen || v1.nato !== v0.nato || v1._s === v0._s) no("gen/nato/sessione: " + [v0.gen, v1.gen, v0.nato, v1.nato].join(" "));
    if (titolo(P) !== "🍻 " + NOME) no("titolo dopo la ricarica: «" + titolo(P) + "»");
    await W.dorme(800);
    var pg = sG.stop(), pl = sL.stop();
    if (pg.concat(pl).some(function (t) { return /👑/.test(t); })) no("pillola 👑: " + pg.concat(pl).filter(function (t) { return /👑/.test(t); }).join(" | "));
    await P3.unSoloHost(C, 3000);
    return "Paky di nuovo host (gen " + v1.gen + "), Giulia e Luca dentro; pillole: " + (pg.join(" | ") || "nessuna");
  } });

  // 319. Misure: la Sala della compagnia (host e amico), "Ho un codice" a 6 caselle, "🕐 Nessuno ancora"
  aggiungi(319, { nome: "Misure della Compagnia a 360x640 e 412x915 (testata a 6 lettere, 6 caselle, attesa)", fai: async function () {
    var P = await hostCompagnia("Paky", 0);
    var G = await entraComp("Giulia", 185, 2);
    var L = await entraComp("Luca", 370, 3);
    var M = [[360, 640], [412, 915]], fatte = [];
    for (var k = 0; k < M.length; k++) {
      var tel = [["Paky", P], ["Giulia", G]];
      for (var j = 0; j < tel.length; j++) {
        var e = await A.controllaSchermo(tel[j][1], tel[j][0], M[k][0], M[k][1], 3);
        if (e) no(tel[j][0] + " a " + M[k].join("x") + ": " + e);
        var d = tel[j][1].document, cod = d.querySelector(".sl-cod"), b = cod.querySelector("b"), inv = d.querySelector(".sl-invito .sl-link");
        if (b.scrollWidth > b.clientWidth + 1 || cod.getBoundingClientRect().right > inv.getBoundingClientRect().left + 1) no(tel[j][0] + " a " + M[k].join("x") + ": il codice non sta nella sua casella");
        if (Math.abs(cod.getBoundingClientRect().top - inv.getBoundingClientRect().top) > 2) no(tel[j][0] + ": codice e Invita non sono in una riga");
        if (inv.getBoundingClientRect().right > M[k][0] + 1) no(tel[j][0] + ": «Invita» esce di lato");
      }
      fatte.push(M[k].join("x"));
    }
    // "Ho un codice" con 6 lettere, e "Nessuno ancora", sul telefono di Luca
    var f = document.getElementById("tel-Luca");
    W.clicca(L, /‹/, ".saletta-schermo .testa .btn");   // (Luca esce dalla Sala: in home)
    if (!await W.aspetta(function () { return L.document.querySelector(".home-online"); }, 5000)) no("Luca non torna in home");
    W.clicca(L, /Ho un codice/, ".home-online button");
    await W.aspetta(function () { return L.document.querySelector("input.codice4-campo"); }, 3000);
    // (scritte 5 lettere: le caselle sono 6 e non parte)
    await batti6(L, "ABCDE");
    for (var r = 0; r < M.length; r++) {
      f.style.width = M[r][0] + "px"; f.style.height = M[r][1] + "px"; void L.document.documentElement.offsetHeight; L.dispatchEvent(new L.Event("resize"));
      await W.dorme(300);
      var bx = L.document.querySelector(".codice4").getBoundingClientRect();
      if (bx.left < 0 || bx.right > M[r][0] + 1) no("le 6 caselle a " + M[r].join("x") + " escono di lato (" + Math.round(bx.left) + "-" + Math.round(bx.right) + ")");
      if (L.document.documentElement.scrollWidth > M[r][0] + 1) no("«Ho un codice» a " + M[r].join("x") + " scorre di lato");
    }
    f.style.width = "360px"; f.style.height = "740px"; L.dispatchEvent(new L.Event("resize"));
    fatte.push("6 caselle ok");
    return fatte.join(", ");
  } });

  // =========================================================
  // Pezzo p3-b: la Compagnia nasce dalla Sala, si rinomina, la Sala trasloca (321-325, 321b)
  // 321 «Fanne la nostra Compagnia» con la classifica e le partite: stessi id, stessi punti, la Sala vecchia lasciata con
  // il trasloco · 321b il link VECCHIO (e un amico col telefono fermo durante il trasloco) finisce nella Compagnia
  // · 322 rinomina dell'host, di un amico fuori dalla Sala (vince il più nuovo) e di un amico dentro · 323 con un gioco in
  // corso il tasto è spento · 324 il suggerimento con ✕ (al massimo 3 chiusure) · 325 misure
  // =========================================================
  // l'host della Sala tocca ⚙️ → «📌 Fanne la nostra Compagnia» → nome ed emoji → «📌 Crea». Restituisce il codice nuovo
  async function fanneComp(P, nomeC, emoji) {
    var b = P.document.querySelector(".saletta-schermo .sl-regole");
    if (!b) no("nella Sala non c'è il ⚙️");
    b.click();
    var f = await W.aspetta(function () { return P.document.querySelector(".sl-velo .sl-comp-fai"); }, 2000);
    if (!f) no("nel ⚙️ della Sala non c'è «📌 Fanne la nostra Compagnia»");
    if (f.disabled) no("«📌 Fanne la nostra Compagnia» è spento («" + f.parentNode.textContent + "»)");
    f.click();
    await scriviNome(P, nomeC, emoji);
    var C = await W.aspetta(function () { var c = A.codiceTestata(P); return c && c.length === 6 ? c : null; }, 4000);
    if (!C) no("dopo «Crea» la Sala di Paky non ha un codice di 6 lettere («" + A.T(P).slice(0, 80) + "»)");
    return C;
  }
  // nel foglio del nome della compagnia: scrive il nome, tocca l'emoji e il tasto
  async function scriviNome(w, nomeC, emoji) {
    var campo = await W.aspetta(function () { return w.document.querySelector(".cmp-velo .cmp-campo"); }, 2000);
    if (!campo) no("non si apre il foglio del nome della compagnia");
    campo.value = nomeC; campo.dispatchEvent(new w.Event("input", { bubbles: true }));
    var e = [].find.call(w.document.querySelectorAll(".cmp-velo .cmp-e"), function (x) { return x.textContent === emoji; });
    if (!e) no("nel foglio non c'è l'emoji " + emoji);
    e.click();
    w.document.querySelector(".cmp-velo .cmp-ok").click();
  }
  // la classifica e le partite della serata "già giocate": si scrivono nella Sala ricordata dall'host e l'host ricarica
  // (la Sala si riapre con quelle: è la strada di tutti i giorni quando la pagina si ricarica)
  var PUNTI = { Paky: 178, Giulia: 140, Luca: 96 }, GIOCATE = { Paky: 2, Giulia: 2, Luca: 1 };
  async function puntiDellaSerata(S, amici) {
    var P = W.finestra("Paky"), o = JSON.parse(P.localStorage.getItem("sg-mia-sala") || "null");
    if (!o || o.codice !== S) no("Paky non ha la Sala " + S + " ricordata");
    o.torneo = { punti: Object.assign({}, PUNTI), nomi: ["Paky", "Giulia", "Luca"], n: 2, ultima: null, finito: false };
    o.giocate = Object.assign({}, GIOCATE);
    P.localStorage.setItem("sg-mia-sala", JSON.stringify(o));
    P = await W.ricarica("Paky");
    if (!await W.aspetta(function () { var t = vm(S).torneo; return eHost(P) && t && t.n === 2 && nomi(S).length === amici.length + 1 && amici.every(function (n) { return eOspite(W.finestra(n)); }); }, 12000))
      no("Paky ricaricando non riapre la Sala con i punti (" + JSON.stringify(vm(S).torneo) + ", " + nomi(S).join(", ") + ")");
    return P;
  }
  function uguali(a, b) { return JSON.stringify(a, Object.keys(a || {}).sort()) === JSON.stringify(b, Object.keys(b || {}).sort()); }
  function chiDentro(nomeTel, C) { var w = W.finestra(nomeTel); return nomi(C).indexOf(nomeTel) >= 0 && eOspite(w) && A.codiceTestata(w) === C; }
  // i telefoni del broker ancora collegati alla stanza (ascoltano le sue "azioni": è l'host)
  function hostCollegati(S) { var t = "seratagiochi/v1/" + S + "/azioni"; return Object.keys(W.BR.perNome || {}).filter(function (n) { return (W.BR.perNome[n] || []).some(function (c) { return c.connected && !c.morto && c.subs && c.subs.has(t); }); }); }

  // 321. «Fanne la nostra Compagnia» da una Sala con 3 persone, la classifica accesa e 2 partite di punti
  aggiungi(321, { nome: "«📌 Fanne la nostra Compagnia»: tutti nella Sala di 6 lettere, stessi id, stessi punti; la Sala vecchia lasciata col trasloco", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca"]), S = X.S, G = X.w.Giulia, L = X.w.Luca;
    var P = await puntiDellaSerata(S, ["Giulia", "Luca"]);
    var idG = A.idInSala(S, "Giulia"), idL = A.idInSala(S, "Luca");
    var sG = spiaPillole(G), sL = spiaPillole(L), t0 = Date.now();
    var C = await fanneComp(P, NOME, "🍻");
    if (!await W.aspetta(function () { return eHost(P) && hostDi(C) === "Paky" && chiDentro("Giulia", C) && chiDentro("Luca", C) && nomi(C).length === 3; }, 4000))
      no("in 4 s non sono tutti nella Compagnia " + C + " (" + nomi(C).join(", ") + "; Giulia «" + A.T(G).slice(0, 60) + "»)");
    var dt = Date.now() - t0, v = vm(C);
    if (A.idInSala(C, "Giulia") !== idG || A.idInSala(C, "Luca") !== idL) no("gli id sono cambiati: Giulia " + idG + " → " + A.idInSala(C, "Giulia") + ", Luca " + idL + " → " + A.idInSala(C, "Luca"));
    if (!v.torneo || v.torneo.n !== 2 || !uguali(v.torneo.punti, PUNTI)) no("i punti nella Compagnia: " + JSON.stringify(v.torneo));
    if (!uguali(v.giocate, GIOCATE)) no("le partite giocate nella Compagnia: " + JSON.stringify(v.giocate));
    if (!v.comp || v.comp.nome !== NOME || v.comp.emoji !== "🍻" || v.gen !== 1) no("la foto della Compagnia: " + JSON.stringify(v.comp) + " gen " + v.gen);
    [["Paky", P], ["Giulia", G], ["Luca", L]].forEach(function (x) {
      if (titolo(x[1]) !== "🍻 " + NOME) no("titolo per " + x[0] + ": «" + titolo(x[1]) + "»");
      var c = x[1].SGCompagnia.trova(C); if (!c || c.n !== NOME || c.e !== "🍻") no(x[0] + " non ha la compagnia tra le sue (" + JSON.stringify(x[1].SGCompagnia.elenco()) + ")");
    });
    var pg = sG.stop(), pl = sL.stop(), pill = "📌 Ora siete «🍻 " + NOME + "»: la trovi in home";
    if (pg.indexOf(pill) < 0 || pl.indexOf(pill) < 0) no("pillole: Giulia «" + pg.join(" | ") + "», Luca «" + pl.join(" | ") + "»");
    // il foglio «Fatto!» con il link fisso; «📤 Manda nel gruppo» manda il link con gruppo= e n=
    var fog = P.document.querySelector(".sl-velo .comp-fatta");
    if (!fog || !/Fatto! Ecco il link fisso/.test(fog.textContent)) no("non c'è il foglio «📌 Fatto! Ecco il link fisso»");
    var lk = fog.querySelector(".comp-fatta-link").textContent;
    if (lk.indexOf("gruppo=" + C) < 0 || lk.indexOf("&n=") < 0) no("il link scritto nel foglio: " + lk);
    var copiato = null; P.navigator.share = function (d) { copiato = d; return Promise.resolve(); };
    W.clicca(P, /Manda nel gruppo/, ".comp-fatta button");
    if (!copiato || String(copiato.url).indexOf("gruppo=" + C) < 0 || String(copiato.url).indexOf("&n=") < 0 || copiato.text.indexOf(C) < 0) no("«Manda nel gruppo»: " + JSON.stringify(copiato));
    delete P.navigator.share;
    W.clicca(P, /Più tardi/, ".comp-fatta button");
    if (P.document.querySelector(".sl-velo")) no("«Più tardi» non chiude il foglio");
    // la Sala vecchia: la sua ultima foto trattenuta dice dove si è andati; dopo 8 s nessuno la tiene più
    var vec = W.statoStanza(S) || {};
    if (!vec.trasloco || vec.trasloco.codice !== C || !vec.trasloco.comp || vec.trasloco.comp.nome !== NOME) no("la foto trattenuta della Sala vecchia: " + JSON.stringify(vec.trasloco));
    if (JSON.parse(P.localStorage.getItem("sg-mia-sala") || "{}").codice !== C) no("Paky ricorda ancora la Sala vecchia");
    await W.aspetta(function () { return !hostCollegati(S).length; }, 10000 - (Date.now() - t0));
    var dopo = Date.now() - t0;
    if (hostCollegati(S).length) no("dopo " + dopo + " ms la Sala vecchia è ancora tenuta da " + hostCollegati(S).join(", "));
    if (dopo < 7500) no("la Sala vecchia è stata lasciata dopo " + dopo + " ms (prima di 8 s)");
    if ((W.statoStanza(S) || {}).t !== "sala" || !(W.statoStanza(S).trasloco)) no("lasciata la Sala vecchia, la foto col trasloco non c'è più");
    if (nomi(C).length !== 3) no("dopo il trasloco la Compagnia ha " + nomi(C).join(", "));
    await P3.unSoloHost(C, 1500);
    // nei giochi dopo lo stesso id
    var K = await A.lanciaDallaSala("Paky", C, "La Scalinata");
    if (!await W.aspetta(function () { var ii = A.ids(K); return ii.indexOf(idG) >= 0 && ii.indexOf(idL) >= 0; }, 8000)) no("nella Scalinata Giulia e Luca non hanno l'id di prima (" + A.ids(K).join(", ") + ")");
    return "in " + dt + " ms tutti nella Compagnia " + C + " (stessi id, punti " + JSON.stringify(v.torneo.punti) + "), Sala vecchia " + S + " lasciata dopo " + dopo + " ms con il trasloco, Scalinata con gli stessi id";
  } });

  // 321b. Il link VECCHIO dopo il trasloco porta nella Compagnia; un amico col telefono fermo durante il trasloco ci arriva da solo
  aggiungi("321b", { nome: "Dopo il trasloco: il link vecchio (#sala=) porta nella Compagnia, e chi era fermo ci arriva da solo", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca"]), S = X.S, P = X.w.Paky, L = X.w.Luca;
    var idL = A.idInSala(S, "Luca");
    W.spegni("Luca");   // (telefono bloccato: la rete cade proprio mentre Paky fa la Compagnia)
    var c = await fanneComp(P, "Quelli del venerdì", "🎉");
    W.clicca(P, /Più tardi/, ".comp-fatta button");
    if (!await W.aspetta(function () { return chiDentro("Giulia", c); }, 4000)) no("Giulia non passa nella Compagnia");
    await W.aspetta(function () { return !hostCollegati(S).length; }, 10000);
    if (hostCollegati(S).length) no("la Sala vecchia è ancora tenuta");
    // Luca torna (il telefono si sblocca e si ricollega): legge il trasloco e va nella Compagnia col suo id
    W.riaccendi("Luca");
    if (!await W.aspetta(function () { return chiDentro("Luca", c); }, 10000)) no("Luca, svegliato, non arriva nella Compagnia (" + nomi(c).join(", ") + "; «" + A.T(L).slice(0, 80) + "»)");
    if (A.idInSala(c, "Luca") !== idL) no("Luca ha cambiato id: " + idL + " → " + A.idInSala(c, "Luca"));
    if (!L.SGCompagnia.trova(c)) no("Luca non ha la compagnia tra le sue");
    // Marco apre il link vecchio della Sala
    var M = await W.apriTel("Marco", { hash: "sala=" + S, x: 555, salaSempre: true });
    var sM = spiaPillole(M);
    if (!await W.aspetta(function () { return chiDentro("Marco", c); }, 10000)) no("Marco col link vecchio non arriva nella Compagnia (" + nomi(c).join(", ") + "; «" + A.T(M).slice(0, 80) + "»)");
    var pm = sM.stop();
    if (!M.SGCompagnia.trova(c) || titolo(M) !== "🎉 Quelli del venerdì") no("Marco: compagnia " + JSON.stringify(M.SGCompagnia.trova(c)) + ", titolo «" + titolo(M) + "»");
    if (hostCollegati(S).length) no("qualcuno ha riaperto la Sala vecchia " + S + ": " + hostCollegati(S).join(", "));
    if (nomi(c).length !== 4) no("nella Compagnia: " + nomi(c).join(", "));
    await P3.unSoloHost(c, 1500);
    return "Luca svegliato dopo il trasloco: nella Compagnia col suo id; Marco dal link vecchio: dentro (pillole «" + pm.join(" | ") + "»)";
  } });

  // 322. Rinomina: l'host, un amico fuori dalla Sala (il più nuovo vince) e un amico dentro (dalla lista delle compagnie)
  aggiungi(322, { nome: "Rinomina della Compagnia: dall'host a tutti in meno di 1 s; Giulia fuori rinomina e rientra (vince lei); Luca dentro", fai: async function () {
    var P = await hostCompagnia("Paky", 0), G = await entraComp("Giulia", 185, 2), L = await entraComp("Luca", 370, 3);
    // l'host: ⚙️ → «✏️ Nome della compagnia»
    P.document.querySelector(".saletta-schermo .sl-regole").click();
    await W.aspetta(function () { return P.document.querySelector(".sl-velo .sl-comp-opz"); }, 2000);
    if (!/Manda il link fisso/.test(P.document.querySelector(".sl-velo .sl-comp-opz").textContent)) no("nel ⚙️ della Compagnia non c'è «📤 Manda il link fisso»");
    if (P.document.querySelector(".sl-velo .sl-comp-fai")) no("nel ⚙️ di una Compagnia c'è ancora «Fanne la nostra Compagnia»");
    if (!W.clicca(P, /Nome della compagnia/, ".sl-velo button")) no("nel ⚙️ della Compagnia non c'è «✏️ Nome della compagnia»");
    var t0 = Date.now();
    await scriviNome(P, "Il giovedì", "🎲");
    if (!await W.aspetta(function () { return [P, G, L].every(function (w) { return titolo(w) === "🎲 Il giovedì"; }); }, 1000))
      no("in 1 s il titolo non è cambiato su tutti: " + [P, G, L].map(titolo).join(" / "));
    var dt = Date.now() - t0;
    [["Paky", P], ["Giulia", G], ["Luca", L]].forEach(function (x) { var c = x[1].SGCompagnia.trova(C); if (!c || c.n !== "Il giovedì" || c.e !== "🎲") no(x[0] + ": la lista dice " + JSON.stringify(c)); });
    // Giulia esce, rinomina dalla lista delle compagnie («✏️ Nome»), poi rientra dalla tessera: vince il suo (più nuovo)
    W.clicca(G, /‹/, ".saletta-schermo .testa .btn");
    if (!await W.aspetta(function () { return G.document.querySelector(".home-online") && nomi().indexOf("Giulia") < 0; }, 6000)) no("Giulia non torna in home (" + nomi().join(", ") + ")");
    G.SGCompagnia.gestione();
    var bn = await W.aspetta(function () { return G.document.querySelector(".cmp-g-voce[data-codice='" + C + "'] .cmp-g-nome"); }, 2000);
    if (!bn) no("nella lista delle compagnie di Giulia non c'è «✏️ Nome»");
    bn.click();
    await W.dorme(30);
    await scriviNome(G, "Giovedì sera", "🌙");
    await W.dorme(100);
    if (titolo(P) !== "🎲 Il giovedì") no("Giulia fuori dalla Sala ha cambiato il nome per tutti");
    W.clicca(G, /‹/, ".testa .btn");   // (dalla lista delle compagnie alla home)
    // (rientra con «🔑 Ho un codice»: le tessere in home le mette p3-d)
    if (!await W.aspetta(function () { return G.document.querySelector(".home-online"); }, 4000)) no("dalla lista Giulia non torna in home");
    W.clicca(G, /Ho un codice/, ".home-online button");
    await W.aspetta(function () { return G.document.querySelector("input.codice4-campo"); }, 3000);
    await batti6(G, C);
    if (!await W.aspetta(function () { return eOspite(G) && [P, G, L].every(function (w) { return titolo(w) === "🌙 Giovedì sera"; }); }, 8000))
      no("rientrata Giulia, il nome di Giulia non vince: " + [P, G, L].map(titolo).join(" / "));
    if (P.SGCompagnia.trova(C).n !== "Giovedì sera" || L.SGCompagnia.trova(C).n !== "Giovedì sera") no("le liste non hanno il nome di Giulia");
    // Luca dentro la Sala rinomina dalla sua lista: il nome passa all'host e a tutti
    L.SGCompagnia.gestione();
    var bl = await W.aspetta(function () { return L.document.querySelector(".cmp-g-voce[data-codice='" + C + "'] .cmp-g-nome"); }, 2000);
    bl.click(); await W.dorme(30);
    await scriviNome(L, "Giovedì sera e notte", "🔥");
    if (!await W.aspetta(function () { return vm().comp && vm().comp.nome === "Giovedì sera e notte" && [P, G].every(function (w) { return titolo(w) === "🔥 Giovedì sera e notte"; }); }, 3000))
      no("il nome di Luca non arriva a tutti: " + JSON.stringify(vm().comp) + " / " + [P, G].map(titolo).join(" / "));
    // un nome più vecchio non torna indietro
    var rv = vm().comp.rv;
    G.SGCompagnia.aggiorna(C, { nome: "Vecchio", emoji: "🍕", rv: rv - 5000 });
    if (G.SGCompagnia.trova(C).n !== "Giovedì sera e notte") no("un nome più vecchio ha preso il posto del nuovo");
    return "host → tutti in " + dt + " ms; Giulia fuori → vince lei al rientro; Luca dentro → a tutti; un nome più vecchio non vince";
  } });

  // 323. Con una partita in corso (il duello tra due amici, Paky nella Sala) il tasto è spento e non c'è il suggerimento
  aggiungi(323, { nome: "Con un gioco in corso «📌 Fanne la nostra Compagnia» è spento («Si fa tra una partita e l'altra»)", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca"]), S = X.S, P = X.w.Paky;
    // prima, senza gioco: acceso
    P.document.querySelector(".saletta-schermo .sl-regole").click();
    var f = await W.aspetta(function () { return P.document.querySelector(".sl-velo .sl-comp-fai"); }, 2000);
    if (!f || f.disabled || !/Un link fisso che vale per sempre/.test(f.parentNode.textContent)) no("senza gioco il tasto non è acceso con la sua spiegazione");
    W.clicca(P, /Fatto/, ".sl-velo .btn-primario");
    // il duello Giulia-Luca (Paky guarda e torna nella Sala con «👥 Sala»)
    var r = await A.toccaGiocoSala(P, "Tris");
    if (r.dove !== "chi") no("non si apre «Chi gioca?»");
    var sc = A.chiGioca(P);
    if (sc.indexOf("Paky") >= 0) A.toccaChi(P, "Paky");
    if (A.chiGioca(P).indexOf("Luca") < 0) A.toccaChi(P, "Luca");
    if (A.chiGioca(P).indexOf("Giulia") < 0) A.toccaChi(P, "Giulia");
    W.clicca(P, /Si gioca/, ".piede button");
    if (!await W.aspetta(function () { return vm(S).duello && vm(S).gioco; }, 5000)) no("il duello non parte");
    if (!await W.aspetta(function () { return P.document.querySelector(".tab-sala"); }, 6000)) no("Paky non ha «👥 Sala»");
    P.document.querySelector(".tab-sala").click();
    if (!await W.aspetta(function () { return P.document.querySelector(".sl-duello") && P.document.querySelector(".saletta-schermo .sl-regole"); }, 4000)) no("Paky non torna nella Sala col duello in corso");
    if (P.document.querySelector(".sl-consiglio-comp:not([hidden])")) no("col gioco in corso c'è il suggerimento della Compagnia");
    P.document.querySelector(".saletta-schermo .sl-regole").click();
    f = await W.aspetta(function () { return P.document.querySelector(".sl-velo .sl-comp-fai"); }, 2000);
    if (!f) no("nel ⚙️ non c'è «Fanne la nostra Compagnia»");
    if (!f.disabled) no("col duello in corso il tasto è acceso");
    if (!/Si fa tra una partita e l'altra/.test(f.parentNode.textContent)) no("sotto il tasto spento c'è «" + f.parentNode.textContent + "»");
    f.click(); await W.dorme(150);
    if (P.document.querySelector(".cmp-velo")) no("il tasto spento apre lo stesso il foglio del nome");
    W.clicca(P, /Fatto/, ".sl-velo .btn-primario");
    if (A.codiceTestata(P) !== S) no("la Sala ha cambiato codice");
    return "senza gioco acceso; col duello Giulia-Luca spento con «Si fa tra una partita e l'altra», niente suggerimento";
  } });

  // 324. Il suggerimento «📌 Giocate spesso insieme?»: con 2 amici sì (con 1 no), ✕ lo chiude, dopo 3 chiusure non torna
  aggiungi(324, { nome: "Il suggerimento della Compagnia: compare con 2 amici, ✕ lo chiude, dopo 3 chiusure non torna", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true });
    var S = await A.apriSalaNuova("Paky");
    var G = await W.apriTel("Giulia", { hash: "sala=" + S, x: 185, salaSempre: true });
    if (!await W.aspetta(function () { return nomi(S).length === 2; }, 8000)) no("Giulia non entra");
    await W.dorme(300);
    function cons() { var n = P.document.querySelector(".saletta-schermo .sl-consiglio-comp"); return n && !n.hidden ? n : null; }
    if (cons()) no("con un amico solo c'è già il suggerimento");
    var L = await W.apriTel("Luca", { hash: "sala=" + S, x: 370, salaSempre: true });
    if (!await W.aspetta(function () { return nomi(S).length === 3 && cons(); }, 8000)) no("con 2 amici il suggerimento non compare");
    if (!/Giocate spesso insieme\? Fatene una Compagnia/.test(cons().textContent)) no("il suggerimento dice «" + cons().textContent + "»");
    if (G.document.querySelector(".sl-consiglio-comp") || L.document.querySelector(".sl-consiglio-comp")) no("il suggerimento c'è anche sui telefoni degli amici");
    var r = cons().getBoundingClientRect(); if (r.height > 46) no("il suggerimento è alto " + Math.round(r.height) + " px (non è una riga)");
    // il tocco apre il foglio del nome (poi lo chiudo)
    cons().querySelector(".sl-cc-testo").click();
    if (!await W.aspetta(function () { return P.document.querySelector(".cmp-velo .cmp-campo"); }, 2000)) no("il suggerimento non apre il foglio del nome");
    P.document.querySelector(".cmp-velo .cmp-f-x").click();
    var giri = [];
    for (var k = 1; k <= 3; k++) {
      if (!await W.aspetta(function () { return cons(); }, 10000)) no("alla volta " + k + " il suggerimento non c'è");
      var n0 = cons();
      n0.querySelector(".sl-cc-x").click();
      await W.dorme(150);
      if (cons()) no("✕ non chiude il suggerimento");
      if (+P.localStorage.getItem("sg-consiglio-comp") !== k) no("chiusure ricordate: " + P.localStorage.getItem("sg-consiglio-comp"));
      giri.push(k);
      P = await W.ricarica("Paky");   // (la Sala si riapre: torna, finché non è stato chiuso 3 volte)
      if (!await W.aspetta(function () { return eHost(P) && nomi(S).length === 3 && eOspite(W.finestra("Giulia")) && eOspite(W.finestra("Luca")); }, 12000)) no("Paky ricaricando non riapre la Sala con tutti");
      await W.dorme(400);
    }
    if (cons()) no("dopo 3 chiusure il suggerimento torna");
    return "con 1 amico niente, con 2 sì (una riga, solo dall'host); il tocco apre il foglio; 3 chiusure e non torna più";
  } });

  // 325. Misure: la Sala-Compagnia (host e amico), il ⚙️ con la Compagnia, il foglio del nome e il foglio «Fatto!»
  aggiungi(325, { nome: "Misure a 360x640 e 412x915: Sala-Compagnia (host e amico, dopo il trasloco), ⚙️, foglio del nome, foglio «Fatto!»", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca"]), S = X.S, P = X.w.Paky, G = X.w.Giulia;
    var M = [[360, 640], [412, 915]], fatte = [];
    function aMisura(w, nome, m) { var f = document.getElementById("tel-" + nome); f.style.width = m[0] + "px"; f.style.height = m[1] + "px"; void w.document.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize")); }
    // un foglio sta nello schermo: dentro di lato e in altezza, i tasti si vedono, il centro non scorre
    async function foglioOk(w, sel, m, cosa) {
      await W.dorme(300);
      var fg = w.document.querySelector(sel); if (!fg) no(cosa + ": non c'è");
      var r = fg.getBoundingClientRect();
      if (r.left < -1 || r.right > m[0] + 1 || r.top < -1 || r.bottom > m[1] + 1) no(cosa + " a " + m.join("x") + " esce dallo schermo (" + [r.left, r.top, r.right, r.bottom].map(Math.round).join(",") + ")");
      var corpo = fg.querySelector(".sl-foglio-corpo"); if (corpo && corpo.scrollHeight > corpo.clientHeight + 1) no(cosa + " a " + m.join("x") + ": il centro scorre");
      [].forEach.call(fg.querySelectorAll("button"), function (b) { var q = b.getBoundingClientRect(); if (q.bottom > m[1] + 1 || q.right > m[0] + 1) no(cosa + " a " + m.join("x") + ": «" + b.textContent + "» non si vede"); if (b.scrollWidth > b.clientWidth + 1 && !b.classList.contains("cmp-e")) no(cosa + ": la scritta «" + b.textContent + "» è tagliata"); });
      if (w.document.documentElement.scrollWidth > m[0] + 1) no(cosa + " a " + m.join("x") + ": la pagina scorre di lato");
    }
    // il ⚙️ della Sala con «Fanne la nostra Compagnia»
    P.document.querySelector(".saletta-schermo .sl-regole").click();
    for (var i = 0; i < M.length; i++) { aMisura(P, "Paky", M[i]); await foglioOk(P, ".sl-velo .sl-foglio", M[i], "il ⚙️ della Sala"); }
    fatte.push("⚙️");
    P.document.querySelector(".sl-velo .sl-comp-fai").click();
    for (i = 0; i < M.length; i++) { aMisura(P, "Paky", M[i]); await foglioOk(P, ".cmp-velo .sl-foglio", M[i], "il foglio del nome"); }
    fatte.push("foglio del nome");
    aMisura(P, "Paky", [360, 740]);
    await scriviNome(P, "Quelli del giovedì sera!", "🍕");
    var c = await W.aspetta(function () { var k = A.codiceTestata(P); return k && k.length === 6 && P.document.querySelector(".comp-fatta") ? k : null; }, 4000);
    if (!c) no("non arriva il foglio «Fatto!»");
    for (i = 0; i < M.length; i++) { aMisura(P, "Paky", M[i]); await foglioOk(P, ".sl-velo .comp-fatta", M[i], "il foglio «Fatto!»"); }
    fatte.push("«Fatto!»");
    W.clicca(P, /Più tardi/, ".comp-fatta button");
    if (!await W.aspetta(function () { return chiDentro("Giulia", c) && chiDentro("Luca", c); }, 5000)) no("gli amici non arrivano nella Compagnia");
    for (i = 0; i < M.length; i++) {
      var tel = [["Paky", P], ["Giulia", G]];
      for (var j = 0; j < tel.length; j++) {
        var e = await A.controllaSchermo(tel[j][1], tel[j][0], M[i][0], M[i][1], 3);
        if (e) no(tel[j][0] + " nella Compagnia a " + M[i].join("x") + ": " + e);
      }
      // il ⚙️ della Compagnia (nome e link fisso)
      P.document.querySelector(".saletta-schermo .sl-regole").click();
      await foglioOk(P, ".sl-velo .sl-foglio", M[i], "il ⚙️ della Compagnia");
      W.clicca(P, /Fatto/, ".sl-velo .btn-primario");
      fatte.push("Compagnia " + M[i].join("x"));
    }
    ["Paky", "Giulia", "Luca"].forEach(function (n) { var f = document.getElementById("tel-" + n); if (f) { f.style.width = "360px"; f.style.height = "740px"; } });
    return fatte.join(", ");
  } });

  // 325b. La Sala normale con il suggerimento: a 360x640 e 412x915 niente scorre (se non ci sta, non c'è)
  aggiungi("325b", { nome: "Il suggerimento della Compagnia nella Sala a 360x640 e 412x915: niente scorre (se non ci sta non compare)", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca"]), P = X.w.Paky;
    var M = [[360, 640], [412, 915]], visto = [];
    for (var i = 0; i < M.length; i++) {
      var e = await A.controllaSchermo(P, "Paky", M[i][0], M[i][1], 3);
      if (e) no("Paky a " + M[i].join("x") + ": " + e);
      var n = P.document.querySelector(".sl-consiglio-comp");
      visto.push(M[i].join("x") + (n && !n.hidden ? " c'è" : " non c'è"));
    }
    if (!/412x915 c'è/.test(visto.join())) no("a 412x915 il suggerimento non c'è");
    var f = document.getElementById("tel-Paky"); f.style.width = "360px"; f.style.height = "740px"; P.dispatchEvent(new P.Event("resize"));
    return visto.join(", ");
  } });

  // =========================================================
  // Pezzo p3-c: l'host che se ne va (331-340)
  // 331 «👑 Passa la Sala a Giulia» · 332 l'host sparisce: il vice la prende dopo 20 s, chi la teneva torna da amico
  // · 333 il vice deve avere il profilo · 334 sparisce anche il primo vice: il secondo dopo 30 s · 335 partita in corso
  // (Scalinata) persa, il nuovo host lancia Tris · 336 il duello continua e l'esito arriva alla Sala nuova · 336b Parola
  // d'ordine: il gioco va avanti col suo host di riserva e la Sala passa senza fermarlo · 337 torneo a eliminazione: nessun
  // vice · 338 ricarica veloce dell'host: nessun subentro · 339 Sala addormentata (11 minuti) · 340 la pausa (WhatsApp):
  // 40 s via niente subentro, poi via davvero: il vice aspetta 90 s.
  // (sui telefoni finti il testamento arriva subito: sui telefoni veri 30-40 s dopo, e il subentro vero è ~50-60 s dopo)
  // =========================================================
  // la conferma automatica dei telefoni finti tocca il tasto rosso: per scegliere a mano la si ferma (e poi si rimette)
  function fermaAuto() { if (W.__autoConferma) { clearInterval(W.__autoConferma); W.__autoConferma = null; } }
  function rimettiAuto() {
    if (W.__autoConferma) return;
    W.__autoConferma = setInterval(function () {
      document.querySelectorAll("iframe").forEach(function (f) { try { var b = f.contentWindow.document.querySelector(".conferma-sfondo .btn-rosso:not([disabled])"); if (b) b.click(); } catch (e) {} });
    }, 100);
  }
  // la pagina del telefono va nascosta (si cambia app) o torna visibile
  function nascondi(w, si) {
    Object.defineProperty(w.document, "hidden", { configurable: true, get: function () { return !!si; } });
    Object.defineProperty(w.document, "visibilityState", { configurable: true, get: function () { return si ? "hidden" : "visible"; } });
    w.document.dispatchEvent(new w.Event("visibilitychange"));
  }
  // il telefono si spegne davvero: la rete tace (anche i collegamenti nuovi) e il broker manda il testamento
  function spentoDavvero(nome) { W.congela(nome); W.spegni(nome); }
  function idDi(S, nome) { return A.idInSala(S, nome); }
  function inHome(w) { return !!(w && w.document.querySelector(".home-online") && !w.document.querySelector(".saletta-schermo")); }
  function salaDi(w, S) { return eOspite(w) && A.codiceTestata(w) === S; }
  // la Sala presa da un vice (foto della Sala con gen 2 o più): il nome del nuovo host, se no ""
  function presa(S) { var v = vm(S); return v && v.t === "sala" && (+v.gen || 1) >= 2 ? nomeHost(v) || "?" : ""; }
  function erroriVuoti() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }

  // 331. «👑 Passa la Sala a Giulia»
  aggiungi(331, { nome: "Esci e passa: «👑 Passa la Sala a Giulia» → Giulia host (gen 2), stessi punti, Luca la segue, Paky in home", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca"]), S = X.S, G = X.w.Giulia, L = X.w.Luca;
    var P = await puntiDellaSerata(S, ["Giulia", "Luca"]);
    var idG = idDi(S, "Giulia"), idL = idDi(S, "Luca"), v0 = vm(S);
    if (!await W.aspetta(function () { return (vm(S).vice || [])[0] === idG && vm(S).vice[1] === idL; }, 4000)) no("vice: " + JSON.stringify(vm(S).vice) + " invece di Giulia e Luca");
    fermaAuto();
    try {
      var sL = spiaPillole(L), sP = spiaPillole(P);
      W.clicca(P, /‹/, ".saletta-schermo .testa .btn");
      var box = await W.aspetta(function () { return P.document.querySelector(".conferma-sfondo"); }, 2000);
      if (!box) no("toccato «‹» non si apre la scelta");
      var tasti = [].map.call(box.querySelectorAll("button"), function (b) { return b.textContent; }).join(" | ");
      if (tasti !== "👑 Passa la Sala a Giulia | 🚪 Chiudi per tutti | Resta") no("tasti della scelta: «" + tasti + "»");
      if (!box.querySelector(".conferma-tasti.colonna")) no("i tasti non sono in colonna");
      if (!box.querySelector("button").disabled) no("«Passa la Sala» è subito attivo (deve aspettare un attimo)");
      for (var k = 0; k < 2; k++) { var e = await A.controllaSchermo(P, "Paky", [360, 412][k], [640, 915][k], 3); if (e) no("la scelta a " + [360, 412][k] + ": " + e); }
      var b = await W.aspetta(function () { var x = P.document.querySelector(".conferma-sfondo .btn-primario"); return x && !x.disabled ? x : null; }, 2000);
      var t0 = Date.now();
      b.click();
      if (!await W.aspetta(function () { return hostDi(S) === "Giulia" && vm(S).gen === 2 && eHost(G) && salaDi(L, S) && inHome(P); }, 6000))
        no("dopo «Passa»: host " + hostDi(S) + " gen " + vm(S).gen + ", Giulia «" + A.T(G).slice(0, 50) + "», Luca «" + A.T(L).slice(0, 50) + "», Paky «" + A.T(P).slice(0, 50) + "»");
      var dt = Date.now() - t0, v = vm(S);
      if (v._s === v0._s || v.nato === v0.nato && v.dev === v0.dev) no("la foto non è della Sala di Giulia");
      if (nomi(S).sort().join(",") !== "Giulia,Luca") no("membri: " + nomi(S).join(", "));
      if (idDi(S, "Luca") !== idL) no("Luca ha cambiato id");
      if (!uguali(v.torneo.punti, PUNTI) || v.torneo.n !== 2) no("punti dopo il passaggio: " + JSON.stringify(v.torneo));
      if (!uguali(v.giocate, GIOCATE)) no("partite giocate: " + JSON.stringify(v.giocate));
      if (v.cede) no("nella foto di Giulia c'è ancora cede");
      await W.dorme(600);
      var pl = sL.stop(), pp = sP.stop();
      if (!pl.some(function (t) { return /👑 Ora la Sala la tiene Giulia/.test(t); })) no("Luca non ha letto «👑 Ora la Sala la tiene Giulia» (" + pl.join(" | ") + ")");
      if (!pp.some(function (t) { return /👑 Ora la Sala la tiene Giulia/.test(t); })) no("Paky non ha letto «👑 Ora la Sala la tiene Giulia» (" + pp.join(" | ") + ")");
      if (P.localStorage.getItem("sg-mia-sala")) no("Paky ricorda ancora la Sala come sua");
      if (!JSON.parse(G.localStorage.getItem("sg-mia-sala") || "null")) no("Giulia non si ricorda la Sala come sua");
      await P3.unSoloHost(S, 3000);
      erroriVuoti();
      return "Giulia host in " + dt + " ms (gen 2), stessi punti e partite, Luca dentro con lo stesso id, Paky in home; pillole di Luca: " + pl.join(" | ");
    } finally { rimettiAuto(); }
  } });

  // 332. L'host sparisce: il primo vice dopo 20 s
  aggiungi(332, { nome: "L'host sparisce: dopo 20 s la Sala la tiene Giulia (stessi amici tranne Paky, stessi punti); Paky torna da amico", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca"]), S = X.S, G = X.w.Giulia, L = X.w.Luca;
    var P = await puntiDellaSerata(S, ["Giulia", "Luca"]);
    var idL = idDi(S, "Luca");
    if (!await W.aspetta(function () { return (vm(S).vice || []).length === 2; }, 4000)) no("vice: " + JSON.stringify(vm(S).vice));
    var sL = spiaPillole(L), sG = spiaPillole(G), t0 = Date.now();
    W.spegni("Paky");
    await W.dorme(15000);
    if (presa(S) || eHost(G)) no("dopo 15 s Giulia ha già preso la Sala");
    if (!await W.aspetta(function () { return hostDi(S) === "Giulia" && vm(S).gen === 2 && eHost(G) && salaDi(L, S); }, 12000, 200)) no("entro 27 s Giulia non tiene la Sala (host " + hostDi(S) + ", gen " + vm(S).gen + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1), v = vm(S);
    if (nomi(S).sort().join(",") !== "Giulia,Luca") no("membri: " + nomi(S).join(", "));
    if (idDi(S, "Luca") !== idL) no("Luca ha cambiato id");
    if (!uguali(v.torneo.punti, PUNTI)) no("punti: " + JSON.stringify(v.torneo.punti));
    await W.dorme(500);
    var pl = sL.stop(), pg = sG.stop();
    if (!pl.some(function (t) { return /👑 Ora la Sala la tiene Giulia/.test(t); })) no("Luca: " + pl.join(" | "));
    if (!pg.some(function (t) { return /👑 Paky è uscito: ora la Sala la tieni tu/.test(t); })) no("Giulia: " + pg.join(" | "));
    // Paky si riaccende: entra da amico nella Sala di Giulia
    var sP = spiaPillole(P);
    W.riaccendi("Paky");
    if (!await W.aspetta(function () { return salaDi(P, S) && nomi(S).indexOf("Paky") >= 0 && hostDi(S) === "Giulia"; }, 10000)) no("Paky riacceso non entra da amico (" + nomi(S).join(", ") + "; «" + A.T(P).slice(0, 60) + "»)");
    await W.dorme(400);
    var pp = sP.stop();
    if (!pp.some(function (t) { return /Bentornato! Ora la Sala la tiene Giulia/.test(t); })) no("Paky: " + pp.join(" | "));
    await P3.unSoloHost(S, 3000);
    if (vm(S).torneo.punti.Paky !== PUNTI.Paky) no("i punti di Paky: " + vm(S).torneo.punti.Paky);
    erroriVuoti();
    return "Giulia host dopo " + dt + " s (gen 2), stessi punti; Paky torna da amico («" + pp.filter(function (t) { return /Bentornato/.test(t); })[0] + "»), un host solo";
  } });

  // 333. Il vice deve avere il profilo
  aggiungi(333, { nome: "Il vice deve avere il profilo: Giulia senza, Luca con → la Sala la prende Luca", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca"]), S = X.S, G = X.w.Giulia, L = X.w.Luca;
    // Giulia "perde" il profilo (come chi non l'ha): ripete il suo join, ora senza pr
    W.BR.mem.Giulia.fp = null;
    var rg = (G.__reti || []).filter(function (h) { return h.__sala && !(h.stato && h.stato().chiusa); }).pop();
    if (!rg) no("non trovo il collegamento della Sala di Giulia");
    rg.invia({ t: "join", nome: "Giulia", emoji: "🙂", omino: null });
    var idL = idDi(S, "Luca");
    if (!await W.aspetta(function () { var m = (vm(S).membri || []).filter(function (x) { return x.nome === "Giulia"; })[0]; return m && !m.pr && JSON.stringify(vm(S).vice) === JSON.stringify([idL]); }, 5000)) no("vice: " + JSON.stringify(vm(S).vice));
    W.spegni("Paky");
    if (!await W.aspetta(function () { return hostDi(S) === "Luca" && vm(S).gen === 2 && eHost(L); }, 27000, 250)) no("Luca non prende la Sala (host " + hostDi(S) + ")");
    if (eHost(G)) no("Giulia è diventata host");
    if (!await W.aspetta(function () { return nomi(S).indexOf("Giulia") >= 0 && eOspite(G); }, 6000)) no("Giulia non è nella Sala di Luca");
    await P3.unSoloHost(S, 2000);
    erroriVuoti();
    return "vice [Luca] (Giulia senza profilo), la Sala la prende Luca; Giulia resta dentro da amica";
  } });

  // 334. Anche il primo vice sparisce: il secondo dopo 30 s
  aggiungi(334, { nome: "Sparisce anche il primo vice: dopo 30 s la Sala la prende il secondo (Luca); Marco lo segue", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca", "Marco"]), S = X.S, L = X.w.Luca, M = X.w.Marco;
    if (!await W.aspetta(function () { return JSON.stringify(vm(S).vice) === JSON.stringify([idDi(S, "Giulia"), idDi(S, "Luca")]); }, 4000)) no("vice: " + JSON.stringify(vm(S).vice));
    var t0 = Date.now();
    spentoDavvero("Paky"); spentoDavvero("Giulia");
    await W.dorme(24000);
    if (presa(S)) no("dopo 24 s la Sala è già di " + presa(S));
    if (!await W.aspetta(function () { return hostDi(S) === "Luca" && vm(S).gen === 2 && eHost(L) && salaDi(M, S); }, 12000, 250)) no("entro 36 s Luca non tiene la Sala (host " + hostDi(S) + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    if (nomi(S).indexOf("Paky") >= 0) no("Paky è ancora tra i membri");
    await P3.unSoloHost(S, 2000);
    erroriVuoti();
    return "Luca host dopo " + dt + " s (gen 2), Marco lo segue";
  } });

  // 335. Partita in corso: la Scalinata era sul telefono di Paky.
  // (Passo 5, p5-z) la Scalinata ha l'host di riserva del core (riprende + riserva): la partita NON si perde. Un amico la porta
  // avanti (6 s), la Sala passa a Giulia (20 s) col gioco ancora dentro, si arriva al podio; poi tutti nella Sala di Giulia,
  // Tris, e nella Classifica della serata contano tutte e due le partite
  aggiungi(335, { nome: "Partita in corso (Scalinata) e Paky sparisce: un amico porta avanti la Scalinata, la Sala passa a Giulia col gioco dentro; podio, tutti nella Sala, Giulia lancia Tris e si gioca", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca"]), S = X.S, P = X.w.Paky, G = X.w.Giulia, L = X.w.Luca;
    var C = await A.lanciaDallaSala("Paky", S, "La Scalinata");
    if (!await W.aspetta(function () { return vm(S).stanza === C && [G, L].every(function (w) { return A.codiceSaletta(w) === C; }); }, 8000)) no("gli amici non arrivano nella saletta della Scalinata");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 4000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(S).fase === "gioco"; }, 10000)) no("la Scalinata non comincia (fase " + vm(S).fase + ")");
    await W.dorme(2500);
    var nomeDi = {}; ["Giulia", "Luca"].forEach(function (n) { nomeDi[idDi(S, n)] = n; });   // (gli id del gioco = quelli della Sala)
    var gen0 = +(W.statoStanza(C) || {})._g || 1;
    spentoDavvero("Paky");
    var sG = await W.aspetta(function () { var s = W.statoStanza(C) || {}; return (+s._g || 1) > gen0 && nomeDi[s._h] ? s : null; }, 15000, 250);
    if (!sG) no("nessun amico porta avanti la Scalinata (_h " + (W.statoStanza(C) || {})._h + ", _g " + (W.statoStanza(C) || {})._g + ")");
    var VG = nomeDi[sG._h];
    if (!await W.aspetta(function () { return hostDi(S) === "Giulia" && vm(S).gen === 2; }, 28000, 250)) no("la Sala non passa a Giulia (host " + hostDi(S) + ", Giulia «" + A.T(G).slice(0, 50) + "», Luca «" + A.T(L).slice(0, 50) + "»)");
    await W.dorme(1500);
    if (vm(S).gioco !== "scalinata" || vm(S).stanza !== C) no("la Sala di Giulia ha chiuso la Scalinata (gioco " + vm(S).gioco + ", stanza " + vm(S).stanza + ")");
    var fuori = [G, L].filter(function (w) { return w.document.querySelector(".saletta-schermo"); });
    if (fuori.length) no("con la Sala nuova Giulia o Luca non sono più nella Scalinata");
    if (!await A.scalinataFinoAllaFine(C, ["Giulia", "Luca"], VG)) no("la Scalinata tenuta da " + VG + " non arriva al podio (fase " + vm(C).fase + ")");
    // al podio Giulia (host della Sala) porta tutti nella Sala: «🏠 Torna in Sala» o «🎮 Cambia gioco» (e poi ‹)
    var tocco = await W.aspetta(function () { return W.clicca(G, /Torna in Sala/, ".fine-tasti button") ? "Torna in Sala" : W.clicca(G, /Cambia gioco/, ".fine-tasti button") ? "Cambia gioco" : null; }, 40000, 300);
    if (!tocco) no("al podio Giulia non ha «🏠 Torna in Sala» né «🎮 Cambia gioco» («" + A.T(G).slice(-80) + "»)");
    if (tocco === "Cambia gioco") { await W.aspetta(function () { return /Quale gioco/.test(A.T(G)); }, 8000); await W.dorme(500); W.clicca(G, /^‹$/); }
    if (!await W.aspetta(function () { return eHost(G) && salaDi(L, S) && !vm(S).gioco; }, 10000)) no("dopo il podio non sono tutti nella Sala di Giulia (Giulia «" + A.T(G).slice(0, 50) + "», Luca «" + A.T(L).slice(0, 50) + "»)");
    await W.dorme(3000);   // (nessun timer della Scalinata deve disegnare sopra la Sala)
    if (!eHost(G) || !salaDi(L, S)) no("dopo 3 s qualcosa ha coperto la Sala (Giulia «" + A.T(G).slice(0, 50) + "», Luca «" + A.T(L).slice(0, 50) + "»)");
    var n0 = ((vm(S).torneo || {}).n) || 0;
    if (n0 < 1) no("la Scalinata finita da " + VG + " non conta nella Classifica della serata");
    var C2 = await A.lanciaDallaSala("Giulia", S, "Tris");
    if (!await W.aspetta(function () { return vm(C2).avvId === idDi(S, "Luca"); }, 8000)) no("Luca non entra nel Tris di Giulia");
    if (!await W.aspetta(function () { return W.clicca(G, /Comincia/, ".sl-go"); }, 4000)) no("niente «Comincia» per Giulia");
    if (!await A.trisFinoAllaFine(C2, "Giulia", "Luca")) no("il Tris non finisce");
    if (!await W.aspetta(function () { var t = vm(S).torneo; return t && t.n === n0 + 1; }, 6000)) no("il Tris non conta nella Classifica della serata");
    erroriVuoti();
    return "Scalinata portata avanti da " + VG + " fino al podio, la Sala a Giulia (gen 2) col gioco dentro, poi «" + tocco + "» e tutti nella Sala; Tris giocato; " + (n0 + 1) + " partite nella Classifica della serata";
  } });

  // 336. Il duello continua: l'esito arriva alla Sala nuova
  aggiungi(336, { nome: "Duello Giulia-Luca con Paky che guarda: Paky sparisce, il duello continua, l'esito arriva alla Sala di Giulia", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca", "Marco"]), S = X.S, P = X.w.Paky, G = X.w.Giulia, L = X.w.Luca, M = X.w.Marco;
    var r = await A.toccaGiocoSala(P, "Tris");
    if (r.dove !== "chi") no("non si apre «Chi gioca?»");
    A.toccaChi(P, "Paky"); A.toccaChi(P, "Luca");
    W.clicca(P, /Si gioca/, ".piede button");
    var D = await W.aspetta(function () { return vm(S).duello; }, 4000);
    if (!D || D.a !== idDi(S, "Giulia") || D.b !== idDi(S, "Luca")) no("il duello non è Giulia-Luca: " + JSON.stringify(D));
    var C = D.stanza;
    if (!await W.aspetta(function () { return W.clicca(G, /Comincia/, ".sl-go"); }, 8000)) no("Giulia non ha «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 6000)) no("il duello non comincia");
    spentoDavvero("Paky");
    if (!await W.aspetta(function () { return hostDi(S) === "Giulia" && vm(S).gen === 2; }, 28000, 250)) no("la Sala non passa a Giulia");
    var v = vm(S);
    if (v.gioco !== "tris" || v.stanza !== C || !v.duello) no("la Sala di Giulia non ha più il duello: " + JSON.stringify({ g: v.gioco, s: v.stanza, d: v.duello }));
    if (v.duello.a !== "host" || v.duello.b !== idDi(S, "Luca")) no("duello rimappato male: " + v.duello.a + "-" + v.duello.b);
    if (!G.document.querySelector(".tr-cella") || !L.document.querySelector(".tr-cella")) no("Giulia o Luca non sono più nel Tris");
    if (!await W.aspetta(function () { return M.document.querySelectorAll(".tr-cella").length === 9; }, 4000)) no("Marco non guarda più il duello");
    if (!await A.trisFinoAllaFine(C, "Giulia", "Luca")) no("il duello non finisce");
    var T1 = await W.aspetta(function () { var t = vm(S).torneo; return t && t.n === 1 && t; }, 6000);
    if (!T1) no("l'esito del duello non arriva alla Sala di Giulia");
    var ass = T1.ultima.assegnati.map(function (a) { return a.nome + " +" + a.punti; }).join(" · ");
    if (!/Giulia \+/.test(ass) || !/Luca \+/.test(ass) || /Paky|Marco/.test(ass)) no("punti del duello: «" + ass + "»");
    await W.dorme(2500);
    if (!G.document.querySelector(".fine-tasti") || !G.document.querySelector(".tr-cella, .classifica")) no("Giulia non ha la sua fine partita («" + A.T(G).slice(0, 60) + "»)");
    if (T1.n !== vm(S).torneo.n) no("la partita è contata due volte");
    erroriVuoti();
    return "duello " + C + " continuato, esito alla Sala di Giulia: " + ass + "; fine di Giulia: " + (A.tastiFineDi(G) || []).join(" | ");
  } });

  // 336b. Parola d'ordine: il gioco ha il suo host di riserva, la Sala passa senza fermarlo
  aggiungi("336b", { nome: "Parola d'ordine nella Sala: Paky sparisce, il gioco continua (host di riserva) e la Sala passa a Giulia senza fermarlo", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca", "Marco"]), S = X.S, P = X.w.Paky, G = X.w.Giulia;
    var C = await A.lanciaDallaSala("Paky", S, "Parola d'ordine");
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 4; }, 10000)) no("non entrano in 4 (" + (vm(C).players || []).length + ")");
    W.clicca(P, /Squadre a caso/); await W.dorme(600);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 4000)) no("niente Comincia");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 9000)) no("Parola d'ordine non comincia");
    await W.dorme(3000);
    var gen0 = +(W.statoStanza(C) || {})._g || 1;   // (Passo 5: chi tiene il gioco sta nella foto: _g, _h)
    spentoDavvero("Paky");
    if (!await W.aspetta(function () { var s = W.statoStanza(C) || {}; return (+s._g || 1) > gen0 && s._h && s._h !== "host" && vm(C).fase === "gioco"; }, 15000, 250)) no("nessuno porta avanti Parola d'ordine");
    if (!await W.aspetta(function () { return hostDi(S) === "Giulia" && vm(S).gen === 2; }, 28000, 250)) no("la Sala non passa a Giulia");
    var v = vm(S);
    if (v.gioco !== "ordine" || v.stanza !== C) no("la Sala di Giulia ha perso Parola d'ordine (" + v.gioco + ")");
    await W.dorme(2000);
    var sotto = ["Giulia", "Luca", "Marco"].filter(function (n) { var w = W.finestra(n); return w.document.querySelector(".saletta-schermo") || w.document.querySelector(".sg-ferma") || /Ops|chiusa|Problema/.test(W.testo(w)); });
    if (sotto.length) no("dopo il cambio della Sala sono usciti dal gioco: " + sotto.join(", "));
    if (vm(C).fase !== "gioco") no("il gioco si è fermato (" + vm(C).fase + ")");
    erroriVuoti();
    return "Parola d'ordine avanti (_g " + (W.statoStanza(C) || {})._g + "), la Sala a Giulia (gen 2) col gioco ancora dentro, nessuno uscito";
  } });

  // 337. Torneo a eliminazione: nessun vice
  aggiungi(337, { nome: "Torneo a eliminazione: nessun vice, l'host spento non viene sostituito", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca"]), S = X.S, P = X.w.Paky;
    await A.apriSceltaTn(P);
    await A.viaTn(P, S);
    if (!await W.aspetta(function () { return vm(S).elim && Array.isArray(vm(S).vice) && !vm(S).vice.length; }, 4000)) no("nel torneo i vice sono " + JSON.stringify(vm(S).vice));
    spentoDavvero("Paky");
    await W.dorme(26000);
    if (presa(S)) no("qualcuno ha preso la Sala del torneo (" + hostDi(S) + ", gen " + vm(S).gen + ")");
    // (host della Sala, non della sua partita del torneo: quella la apre uno dei due della coppia)
    if (["Giulia", "Luca"].some(function (n) { var w = W.finestra(n); return eHost(w) && A.codiceTestata(w) === S; })) no("un amico è diventato host");
    return "nessun vice e nessun subentro in 26 s (si aspetta l'host come prima)";
  } });

  // 338. Ricarica veloce: torna l'host di prima, nessun subentro
  aggiungi(338, { nome: "Ricarica veloce dell'host: la Sala la riapre Paky (stessa gen), nessun subentro, nessuna pillola 👑", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca"]), S = X.S, G = X.w.Giulia, L = X.w.Luca, v0 = vm(S);
    var sG = spiaPillole(G), sL = spiaPillole(L);
    var P = await W.ricarica("Paky");
    if (!await W.aspetta(function () { return eHost(P) && hostDi(S) === "Paky" && vm(S)._s !== v0._s && salaDi(G, S) && salaDi(L, S); }, 10000)) no("Paky ricaricando non torna host");
    await W.dorme(24000);
    if (hostDi(S) !== "Paky" || vm(S).gen !== v0.gen || eHost(G) || eHost(L)) no("dopo 24 s: host " + hostDi(S) + ", gen " + vm(S).gen);
    var pv = sG.stop().concat(sL.stop());
    if (pv.some(function (t) { return /👑/.test(t); })) no("pillole 👑: " + pv.join(" | "));
    await P3.unSoloHost(S, 2000);
    erroriVuoti();
    return "Paky di nuovo host (gen " + vm(S).gen + "), nessun subentro in 24 s; pillole: " + (pv.join(" | ") || "nessuna");
  } });

  // 339. Sala addormentata: l'host torna dopo 11 minuti
  aggiungi(339, { nome: "Sala addormentata: l'host torna dopo 11 minuti, non ripubblica niente e va in home con «😴»", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca"]), S = X.S, P = X.w.Paky, G = X.w.Giulia;
    nascondi(P, true);
    if (!await W.aspetta(function () { return vm(S).pausa; }, 3000)) no("nascosta la pagina, nella foto non c'è la pausa");
    await W.dorme(300);   // (la foto della pausa deve stare prima di t0: se no, nello stesso millesimo, conterebbe come «ripubblicata»)
    // a) la rete è caduta (telefono in tasca): torna dopo 11 minuti
    W.spegni("Paky");
    W.spostaOrologio("Paky", 11 * 60 * 1000);
    var sP = spiaPillole(P), t0 = Date.now();
    nascondi(P, false);
    W.riaccendi("Paky");
    if (!await W.aspetta(function () { return inHome(P); }, 4000)) no("Paky non va in home («" + A.T(P).slice(0, 60) + "»)");
    await W.dorme(2500);
    var dopo = P3.fotoSale(S).filter(function (f) { return f.da === "Paky" && f.ms >= t0; });   // (solo quelle dopo il ritorno: la pausa era prima)
    if (dopo.length) no("Paky tornando ha ripubblicato " + dopo.length + " foto");
    if (P.localStorage.getItem("sg-mia-sala")) no("Paky ricorda ancora la Sala");
    var pp = sP.stop();
    if (!pp.some(function (t) { return /😴 Eri via da un po'/.test(t); })) no("pillole di Paky: " + pp.join(" | "));
    // b) la rete era rimasta su (telefono acceso, app in sottofondo): gli amici sanno che non c'è più (il vice si prepara)
    W.spostaOrologio("Paky", 0);
    A.pulisci();
    var Y = await A.salaConAmici(["Giulia", "Luca"]), S2 = Y.S, P2 = Y.w.Paky, G2 = Y.w.Giulia;
    nascondi(P2, true);
    await W.aspetta(function () { return vm(S2).pausa; }, 3000);
    W.spostaOrologio("Paky", 11 * 60 * 1000);
    var sG = spiaPillole(G2);
    nascondi(P2, false);
    if (!await W.aspetta(function () { return inHome(P2); }, 4000)) no("(rete su) Paky non va in home");
    if (!await W.aspetta(function () { return sG.viste.some(function (t) { return /Aspettiamo l'host/.test(t); }); }, 3000)) no("(rete su) Giulia non sa che l'host non c'è più (" + sG.viste.join(" | ") + ")");
    sG.stop();
    W.spostaOrologio("Paky", 0);
    return "rete giù: niente foto ripubblicate, Paky in home con «😴»; rete su: Giulia aspetta l'host (il vice si prepara)";
  } });

  // 340. La pausa: chi va su WhatsApp 40 s non perde la Sala; via davvero, il vice aspetta 90 s
  aggiungi(340, { nome: "La pausa: host nascosto 40 s (e spento) → nessun subentro, torna host; via davvero → Giulia la prende dopo 90 s", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca"]), S = X.S, P = X.w.Paky, G = X.w.Giulia, L = X.w.Luca;
    nascondi(P, true);
    if (!await W.aspetta(function () { return vm(S).pausa; }, 3000)) no("nella foto non c'è la pausa");
    W.spegni("Paky");
    await W.dorme(40000);
    if (presa(S) || eHost(G) || eHost(L)) no("dopo 40 s con la pausa la Sala è passata a " + presa(S));
    W.riaccendi("Paky"); nascondi(P, false);
    if (!await W.aspetta(function () { return eHost(P) && hostDi(S) === "Paky" && !vm(S).pausa && salaDi(G, S) && salaDi(L, S); }, 8000)) no("Paky tornato non è di nuovo host con tutti (pausa " + vm(S).pausa + ")");
    // ora va via davvero (app in sottofondo e poi la rete cade)
    nascondi(P, true);
    await W.aspetta(function () { return vm(S).pausa; }, 3000);
    spentoDavvero("Paky");
    var t0 = Date.now();
    await W.dorme(80000);
    if (presa(S)) no("con la pausa la Sala è passata prima di 80 s (" + presa(S) + ")");
    if (!await W.aspetta(function () { return hostDi(S) === "Giulia" && vm(S).gen === 2 && eHost(G) && salaDi(L, S); }, 20000, 250)) no("entro 100 s Giulia non prende la Sala");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    erroriVuoti();
    return "40 s via: nessun subentro, Paky torna host; via davvero: Giulia host dopo " + dt + " s";
  } });

  // ============ p3-d: la home con le Compagnie, il modo "Compagnia" nei giochi, "Riapri la Sala di ieri sera" (341-346) ============
  // le compagnie già salvate sul telefono prima che parta l'app (come aperte un'altra sera): [[codice, nome, emoji], …]
  function conComp(lista) {
    return function (w) {
      var ora = Date.now();
      w.localStorage.setItem("sg-compagnie", JSON.stringify(lista.map(function (x, i) { return { c: x[0], n: x[1], e: x[2] || "🍻", rv: 0, t: ora - 9000 - i, u: ora - 9000 - i }; })));
    };
  }
  // la Sala di ieri già ricordata sul telefono (codice, nomi degli amici, quante ore fa)
  function conIeri(codice, nomiA, ore) {
    return function (w) { w.localStorage.setItem("sg-sala-ieri", JSON.stringify({ codice: codice, nomi: nomiA, t: Date.now() - ore * 3600000 })); };
  }
  async function telHome(nome, x, opz) {
    var w = await W.apriTel(nome, Object.assign({ x: x, salaSempre: true }, opz || {}));
    if (!await W.aspetta(function () { return inHome(w); }, 6000)) no(nome + " non è in home («" + A.T(w).slice(0, 80) + "»)");
    return w;
  }
  function tesseraDi(w, c) { return w.document.querySelector(".cmp-tessera[data-codice='" + (c || C) + "']"); }
  // il tasto «Riapri» in una riga: "🔁 Riapri la Sala di ieri sera (con Giulia e Luca)" ("" se non c'è)
  function rigaIeri(w) { var r = w.document.querySelector(".home-ieri .hi-riapri"); if (!r) return ""; var t = r.querySelector(".hi-t"), c = r.querySelector(".hi-chi"); return t && c ? t.textContent + " (" + c.textContent + ")" : r.textContent; }
  // torna in home senza ricaricare (da «Ho un codice» indietro): la home si ridisegna
  async function rifaiHome(w) {
    W.clicca(w, /Ho un codice/, ".home-online button");
    if (!await W.aspetta(function () { return w.document.querySelector("input.codice4-campo"); }, 3000)) no("non si apre «Ho un codice»");
    W.clicca(w, /‹/, ".testa .btn");
    if (!await W.aspetta(function () { return inHome(w); }, 3000)) no("da «Ho un codice» non si torna in home");
  }
  // l'host chiude la Sala per tutti (da solo nella Sala: la conferma la dicono di sì i telefoni finti)
  async function chiudiPerTutti(w, nome) {
    W.clicca(w, /‹/, ".saletta-schermo .testa .btn");
    var b = await W.aspetta(function () { return [].filter.call(w.document.querySelectorAll(".conferma-sfondo button"), function (x) { return /Chiudi per tutti/.test(x.textContent) && !x.disabled; })[0]; }, 1500);
    if (b) b.click();   // (con un vice: la scelta a tre tasti)
    if (!await W.aspetta(function () { return inHome(w); }, 6000)) no(nome + " non torna in home dopo aver chiuso la Sala («" + A.T(w).slice(0, 60) + "»)");
  }

  // 341. La tessera in home
  aggiungi(341, { nome: "Tessera in home: «🟢 Giulia è dentro» con l'avatar; Giulia chiude → «Nessuno ancora» al suo posto; poche sbirciate; un tocco ed entri", fai: async function () {
    var G = await hostCompagnia("Giulia", 185);
    var P = await telHome("Paky", 0, { prima: conComp([[C, NOME]]) });
    var t0 = Date.now(), n0 = W.contaCollegamenti("Paky", 0), sP = spiaPillole(P);
    if (!await W.aspetta(function () { return P3.tessera(P, C) === "🍻 " + NOME + " · 🟢 Giulia è dentro · Entra ›"; }, 8000)) no("tessera di Paky: «" + P3.tessera(P, C) + "»");
    var nodo = tesseraDi(P), av = nodo.querySelectorAll(".cmp-av:not([hidden]) svg");
    if (av.length !== 1) no("sulla tessera ci sono " + av.length + " avatar (deve esserci quello di Giulia)");
    if (P.document.querySelector(".home-comp + .home-online") == null) no("le tessere non sono subito sopra la riga online");
    // Giulia chiude per tutti: la tessera di Paky cambia da sola, al suo posto
    var tc = Date.now();
    await chiudiPerTutti(G, "Giulia");
    if (!await W.aspetta(function () { return P3.tessera(P, C) === "🍻 " + NOME + " · Nessuno ancora · Apri la serata ›"; }, 34000, 250)) no("dopo 34 s la tessera di Paky dice «" + P3.tessera(P, C) + "»");
    var dtc = ((Date.now() - tc) / 1000).toFixed(1);
    if (tesseraDi(P) !== nodo || !P.document.body.contains(nodo)) no("la tessera è stata ridisegnata (nodo nuovo)");
    if (!inHome(P)) no("Paky non è più in home");
    // la home aperta 70 s: al massimo 3 sbirciate
    var resta = 70000 - (Date.now() - t0); if (resta > 0) await W.dorme(resta);
    var nSb = W.contaCollegamenti("Paky", 0) - n0;   // (Passo 5: una sbirciata apre un collegamento per ufficio postale: si contano quelli del primo)
    if (nSb > 3) no("in 70 s di home Paky ha aperto " + nSb + " collegamenti");
    var pp = sP.stop();
    if (pp.some(function (t) { return /Mi ricollego/.test(t); })) no("pillola «Mi ricollego» in home: " + pp.join(" | "));
    // Giulia riapre dalla sua tessera; quando la tessera di Paky la vede, un tocco e Paky è dentro
    var tg = tesseraDi(G); if (!tg) no("Giulia in home non ha la tessera della compagnia");
    tg.click();
    if (!await W.aspetta(function () { return eHost(G) && hostDi() === "Giulia"; }, 8000)) no("Giulia dalla tessera non riapre la Sala («" + A.T(G).slice(0, 60) + "»)");
    if (!await W.aspetta(function () { return /Giulia è dentro/.test(P3.tessera(P, C)); }, 34000, 250)) no("la tessera di Paky non vede Giulia di nuovo («" + P3.tessera(P, C) + "»)");
    var t1 = Date.now();
    tesseraDi(P).click();
    if (!await W.aspetta(function () { return eOspite(P) && nomi().indexOf("Paky") >= 0 && A.codiceTestata(P) === C; }, 2000, 50)) no("2 s dopo il tocco Paky non è nella Sala di Giulia («" + A.T(P).slice(0, 60) + "»)");
    var dt = Date.now() - t1;
    erroriVuoti();
    return "tessera «Giulia è dentro» con l'avatar; chiusa → «Nessuno ancora» in " + dtc + " s, stesso nodo; " + nSb + " collegamenti in 70 s; tocco → nella Sala in " + dt + " ms";
  } });

  // 342. Due tocchi dalla home con la Compagnia
  aggiungi(342, { nome: "Due tocchi: Tris → «Online con «Quelli del giovedì»» → saletta del Tris nella Sala della compagnia; Giulia con un tocco; Sala di un altro → la pillola", fai: async function () {
    var P = await telHome("Paky", 0, { prima: conComp([[C, NOME]]) });
    var tt = A.tessera(P, "Tris"); if (!tt) no("in home non c'è il Tris");
    tt.click();   // 1° tocco
    var bm = await W.aspetta(function () { return P.document.querySelector(".modo-grande.compagnia"); }, 3000);
    var mv = A.modiVisti(P);
    if (!bm) no("in «Come giocate?» non c'è la compagnia (" + mv.join(" / ") + ")");
    var iO = -1, iC = -1, iK = -1;
    mv.forEach(function (t, k) { if (/Online con gli amici/.test(t)) iO = k; if (/Online con «Quelli del giovedì»/.test(t)) iC = k; if (/ho un codice/.test(t)) iK = k; });
    if (iC !== iO + 1 || iK !== iC + 1) no("ordine dei modi: " + mv.join(" / "));
    if (!/La apri tu|Entri nella Sala/.test(mv[iC])) no("sotto la compagnia: «" + mv[iC] + "»");
    if (bm.querySelector(".mg-ico").textContent !== "🍻") no("l'icona della compagnia è " + bm.querySelector(".mg-ico").textContent);
    var spia = A.spiaTesto(P, /Apri la stanza|Comincia per tutti|impostazioni/);
    bm.click();   // 2° tocco
    var S = await W.aspetta(function () { var v = vm(), c = A.codiceSaletta(P); return v.t === "sala" && hostDi() === "Paky" && v.gioco === "tris" && c && c !== C && c === v.stanza && P.document.querySelector(".saletta-schermo") ? c : null; }, 8000);
    var visto = spia.stop();
    if (!S) no("dopo il 2° tocco Paky non è nella saletta del Tris della compagnia (Sala: " + JSON.stringify({ gioco: vm().gioco, host: hostDi() }) + "; «" + A.T(P).slice(0, 60) + "»)");
    if (visto) no("tra il tocco e la saletta si è vista «" + visto + "»");
    if (!/Tris/.test(A.T(P))) no("la saletta non è quella del Tris");
    // Giulia (ha la compagnia) apre l'app: in home la tessera dice chi c'è; un tocco ed è nella saletta del Tris
    var G = await telHome("Giulia", 185, { prima: conComp([[C, NOME]]) });
    if (!await W.aspetta(function () { return /🟢 Paky è dentro · giocano a Tris · Entra ›/.test(P3.tessera(G, C)); }, 8000)) no("tessera di Giulia: «" + P3.tessera(G, C) + "»");
    var t0 = Date.now();
    tesseraDi(G).click();
    if (!await W.aspetta(function () { return A.codiceSaletta(G) === S && G.document.querySelector(".saletta-schermo") && A.vm(S).avvId; }, 6000)) no("Giulia dalla tessera non arriva nella saletta del Tris («" + A.T(G).slice(0, 60) + "»)");
    var dt = Date.now() - t0;
    // ora la Sala la tiene Paky: Luca (ha la compagnia) sceglie la compagnia dal Tris → entra e legge la pillola
    var L = await telHome("Luca", 370, { prima: conComp([[C, NOME]]) });
    A.tessera(L, "Tris").click();
    var bl = await W.aspetta(function () { return L.document.querySelector(".modo-grande.compagnia"); }, 3000);
    if (!bl) no("Luca non ha la compagnia tra i modi");
    var sL = spiaPillole(L);
    bl.click();
    if (!await W.aspetta(function () { return nomi().indexOf("Luca") >= 0 && sL.viste.some(function (t) { return /🎮 La Sala la tiene Paky: digli che vuoi giocare a Tris/.test(t); }); }, 8000))
      no("Luca: membri " + nomi().join(", ") + ", pillole " + sL.viste.join(" | "));
    sL.stop();
    erroriVuoti();
    return "Paky nella saletta del Tris (Sala " + C + ", Tris " + S + ") in 2 tocchi; Giulia dalla tessera in " + dt + " ms; Luca entra e legge «🎮 La Sala la tiene Paky…»";
  } });

  // 343. Riapri la Sala di ieri sera
  aggiungi(343, { nome: "«🔁 Riapri la Sala di ieri sera (Giulia, Luca)»: stesso codice dopo 20 ore, Giulia dal link vecchio; dopo 25 ore niente; ✕", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca"]), S = X.S, P = X.w.Paky;
    if (rigaIeri(P)) no("con la Sala aperta c'è già «Riapri»");
    await chiudiPerTutti(P, "Paky");
    var o = JSON.parse(P.localStorage.getItem("sg-sala-ieri") || "null");
    if (!o || o.codice !== S || o.nomi.slice().sort().join(",") !== "Giulia,Luca") no("sg-sala-ieri: " + JSON.stringify(o));
    if (P.localStorage.getItem("sg-mia-sala")) no("sg-mia-sala non è stata cancellata");
    if (!await W.aspetta(function () { return rigaIeri(P); }, 2000)) no("dopo la chiusura in home non c'è «Riapri»");
    if (!/^🔁 Riapri la Sala di prima \((con (Giulia e Luca|Luca e Giulia))\)$/.test(rigaIeri(P))) no("subito dopo: «" + rigaIeri(P) + "»");
    // 25 ore dopo: niente
    W.spostaOrologio("Paky", 25 * 3600000);
    P = await W.ricarica("Paky");
    if (!await W.aspetta(function () { return inHome(P); }, 6000)) no("Paky (+25 ore) non è in home");
    await W.dorme(300);
    if (rigaIeri(P)) no("dopo 25 ore c'è ancora «" + rigaIeri(P) + "»");
    // 20 ore dopo: "ieri sera"
    W.spostaOrologio("Paky", 20 * 3600000);
    P = await W.ricarica("Paky");
    if (!await W.aspetta(function () { return inHome(P) && rigaIeri(P); }, 6000)) no("dopo 20 ore in home non c'è «Riapri»");
    if (!/^🔁 Riapri la Sala di ieri sera \((con (Giulia e Luca|Luca e Giulia))\)$/.test(rigaIeri(P))) no("dopo 20 ore: «" + rigaIeri(P) + "»");
    var sP = spiaPillole(P);
    W.clicca(P, /Riapri la Sala/, ".home-ieri button");
    if (!await W.aspetta(function () { return eHost(P) && A.codiceTestata(P) === S && hostDi(S) === "Paky" && (vm(S).membri || []).length === 1; }, 8000)) no("toccato «Riapri» Paky non è host della Sala " + S + " («" + A.T(P).slice(0, 60) + "»)");
    var v = vm(S);
    if (v.comp || v.gen !== 1) no("la Sala riaperta: comp " + JSON.stringify(v.comp) + ", gen " + v.gen);
    if (v.torneo && v.torneo.n) no("la Sala riaperta ha i punti di ieri: " + JSON.stringify(v.torneo));
    // Giulia apre il link vecchio della chat
    var G = await W.apriTel("Giulia", { hash: "sala=" + S, x: 185, salaSempre: true });
    if (!await W.aspetta(function () { return nomi(S).indexOf("Giulia") >= 0 && eOspite(G) && A.codiceTestata(G) === S; }, 8000)) no("Giulia dal link vecchio non entra (membri " + nomi(S).join(", ") + ")");
    var pp = sP.stop();
    if (!pp.some(function (t) { return /riaperta: il link di ieri vale ancora/.test(t); })) no("pillole di Paky: " + pp.join(" | "));
    await P3.unSoloHost(S, 2000);
    // il ✕ la toglie (solo la riga, la home resta)
    await chiudiPerTutti(P, "Paky");
    if (!await W.aspetta(function () { return rigaIeri(P); }, 2000)) no("chiusa di nuovo, «Riapri» non c'è");
    var barra = P.document.querySelector(".cat-barra");
    W.clicca(P, /✕/, ".home-ieri .hi-x");
    await W.dorme(100);
    if (rigaIeri(P) || P.localStorage.getItem("sg-sala-ieri")) no("il ✕ non toglie «Riapri»");
    if (P.document.querySelector(".cat-barra") !== barra) no("il ✕ ha ridisegnato la home");
    W.spostaOrologio("Paky", 0);
    erroriVuoti();
    return "«di prima» → +25 h niente → +20 h «di ieri sera (Giulia, Luca)» → Sala " + S + " riaperta (gen 1, senza punti), Giulia dal link vecchio; ✕ ok";
  } });

  // 344. Il codice di ieri è occupato
  aggiungi(344, { nome: "Riapri ieri con il codice occupato: stanza di un gioco di altri → codice nuovo e avviso; Sala viva con gli amici di ieri → si entra", fai: async function () {
    var M = await W.apriTel("Marco", { x: 370, salaSempre: true });
    var S2 = await A.apriSalaNuova("Marco");
    var Z = await W.apriTel("Sara", { hash: "sala=" + S2, x: 555, salaSempre: true });
    if (!await W.aspetta(function () { return nomi(S2).length === 2; }, 8000)) no("Sara non entra nella Sala di Marco");
    var T2 = await A.lanciaDallaSala("Marco", S2, "Tris");
    // a) ieri Paky aveva la Sala T2 (oggi è il Tris di Marco)
    var P = await telHome("Paky", 0, { prima: conIeri(T2, ["Giulia"], 3) });
    if (!/^🔁 Riapri la Sala di prima \(con Giulia\)$/.test(rigaIeri(P))) no("«Riapri»: «" + rigaIeri(P) + "»");
    var sP = spiaPillole(P), vT = JSON.stringify(A.vm(T2));
    W.clicca(P, /Riapri la Sala/, ".home-ieri button");
    var S = await W.aspetta(function () { var c = A.codiceTestata(P); return eHost(P) && c && c !== T2 ? c : null; }, 8000);
    if (!S) no("Paky non apre una Sala col codice nuovo («" + A.T(P).slice(0, 60) + "»)");
    if (!await W.aspetta(function () { return sP.viste.some(function (t) { return /Il codice di ieri era occupato: la Sala ha un codice nuovo, rimanda il link/.test(t); }); }, 2000)) no("pillole: " + sP.viste.join(" | "));
    sP.stop();
    if (P3.fotoSale(T2).length) no("sul codice del Tris di Marco è passata una foto della Sala");
    if (vm(T2).t === "sala" || !A.vm(T2) || JSON.stringify(A.vm(T2)).length < 20) no("il Tris di Marco è stato coperto: " + JSON.stringify(vm(T2)).slice(0, 80));
    // b) ieri la Sala era S2 con Sara: oggi è viva con Sara dentro (l'ha ripresa un amico) → Paky entra da amico
    await chiudiPerTutti(P, "Paky");
    P.localStorage.setItem("sg-sala-ieri", JSON.stringify({ codice: S2, nomi: ["Sara"], t: Date.now() - 20 * 3600000 }));
    await rifaiHome(P);
    if (!/^🔁 Riapri la Sala di ieri sera \(con Sara\)$/.test(rigaIeri(P))) no("«Riapri» (b): «" + rigaIeri(P) + "»");
    W.clicca(P, /Riapri la Sala/, ".home-ieri button");
    // (nella Sala di Marco c'è il Tris in saletta: Paky ci arriva come gli altri, da amico)
    if (!await W.aspetta(function () { return nomi(S2).indexOf("Paky") >= 0 && !eHost(P) && (A.codiceTestata(P) === S2 || A.codiceSaletta(P) === T2); }, 8000))
      no("Paky non entra nella Sala viva di Marco (membri " + nomi(S2).join(", ") + "; testata " + A.codiceTestata(P) + ", saletta " + A.codiceSaletta(P) + "; «" + A.T(P).slice(0, 80) + "»)");
    if (hostDi(S2) !== "Marco") no("la Sala " + S2 + " ora la tiene " + hostDi(S2));
    erroriVuoti();
    return "codice del Tris di Marco (" + T2 + ") → Sala nuova " + S + " con l'avviso, il Tris intatto; Sala viva con Sara → Paky entra da amico";
  } });

  // 345. Lo stesso profilo su due telefoni
  aggiungi(345, { nome: "Un altro telefono: Paky2 (stesso profilo) vede in home la compagnia salvata da Paky; tolta da Paky2, sparisce da Paky alla prossima home", fai: async function () {
    var P = await hostCompagnia("Paky", 0);
    await chiudiPerTutti(P, "Paky");
    if (!await W.aspetta(function () { return tesseraDi(P); }, 3000)) no("in home Paky non ha la tessera della compagnia");
    var Q = await telHome("Paky2", 185, { profilo: { nome: "Paky", uid: "finto-Paky" } });
    if (!await W.aspetta(function () { return tesseraDi(Q); }, 3000)) no("Paky2 in home non vede la compagnia salvata da Paky (" + JSON.stringify(Q.SG.listaProfilo("compagnie")) + ")");
    if (P3.tessera(Q, C).indexOf("🍻 " + NOME) !== 0) no("tessera di Paky2: «" + P3.tessera(Q, C) + "»");
    // Paky2 la toglie da «📌 Le tue compagnie»
    W.clicca(Q, /Le tue compagnie/, ".cmp-tutte");
    var bt = await W.aspetta(function () { return Q.document.querySelector(".cmp-g-voce[data-codice='" + C + "'] .cmp-g-togli"); }, 3000);
    if (!bt) no("nella lista di Paky2 non c'è «✕ Togli»");
    bt.click();
    if (!await W.aspetta(function () { return !Q.SGCompagnia.trova(C); }, 3000)) no("Paky2 non riesce a toglierla");
    W.clicca(Q, /‹/, ".testa .btn");
    if (!await W.aspetta(function () { return inHome(Q) && !tesseraDi(Q); }, 3000)) no("in home Paky2 la vede ancora");
    // Paky: alla prossima home non c'è più
    await rifaiHome(P);
    if (tesseraDi(P)) no("Paky alla prossima home vede ancora la compagnia tolta da Paky2");
    if (P.document.querySelector(".home-comp")) no("con nessuna compagnia c'è ancora il posto delle tessere");
    erroriVuoti();
    return "Paky2 vede la compagnia di Paky; tolta da Paky2, sparisce da Paky alla prossima home";
  } });

  // 346. Misure della home e di «Come giocate?»
  aggiungi(346, { nome: "Misure: home con 2 compagnie, «Riapri ieri» e la riga online (categorie entro 640 px, meno di 230 px in più) e «Come giocate?» con la compagnia", fai: async function () {
    var P = await telHome("Paky", 0, { prima: function (w) { conComp([[C, NOME], ["MNPQRS", "La squadra del calcetto", "⚽"]])(w); conIeri("WXYZ", ["Giulia", "Luca", "Marco", "Bea"], 20)(w); } });
    if (!await W.aspetta(function () { return P.document.querySelectorAll(".cmp-tessera").length === 2 && rigaIeri(P); }, 3000)) no("in home non ci sono 2 tessere e «Riapri» (" + P.document.querySelectorAll(".cmp-tessera").length + ", «" + rigaIeri(P) + "»)");
    if (!/^🔁 Riapri la Sala di ieri sera \(con Giulia, Luca e altri 2\)$/.test(rigaIeri(P))) no("«Riapri» con 4 nomi: «" + rigaIeri(P) + "»");
    await W.aspetta(function () { return !/…/.test(P3.tessere(P).join("")); }, 8000);
    var fuori = [], righe = [];
    var M = [[360, 640], [412, 915]];
    for (var i = 0; i < M.length; i++) {
      var L = M[i][0], H = M[i][1];
      var e = await A.misuraHome(P, "Paky", L, H); if (e) no("home a " + L + "x" + H + ": " + e);
      var d = P.document, q = function (s) { return d.querySelector(s).getBoundingClientRect(); };
      var rc = q(".home-comp"), ro = q(".home-online"), ri = q(".home-ieri"), rb = q(".cat-barra");
      var piu = Math.round((ro.top - rc.top) + (ri.bottom - ro.bottom));
      righe.push(L + "x" + H + ": categorie a " + Math.round(rb.top) + " px, " + piu + " px in più");
      if (rb.top > 640) fuori.push(L + ": la barra delle categorie comincia a " + Math.round(rb.top) + " px");
      if (L === 360 && piu >= 230) fuori.push("a 360 le compagnie e «Riapri» aggiungono " + piu + " px");
      [].forEach.call(d.querySelectorAll(".cmp-tessera, .home-ieri button"), function (b) {
        var r = b.getBoundingClientRect(); if (r.left < 0 || r.right > L + 1) fuori.push(L + ": «" + b.textContent.slice(0, 30) + "» esce di lato");
      });
      var hx = q(".home-ieri .hi-x"); if (hx.width < 30 || hx.height < 30) fuori.push(L + ": il ✕ è piccolo (" + Math.round(hx.width) + "x" + Math.round(hx.height) + ")");
    }
    if (fuori.length) no(fuori.join(" · ") + " (" + righe.join("; ") + ")");
    // «Come giocate?» del Tris (6 modi) a misura: tutti i tasti in vista
    var f = document.getElementById("tel-Paky");
    A.tessera(P, "Tris").click();
    if (!await W.aspetta(function () { return P.document.querySelector(".modo-grande.compagnia"); }, 3000)) no("nel Tris non c'è la compagnia");
    for (var j = 0; j < M.length; j++) {
      f.style.width = M[j][0] + "px"; f.style.height = M[j][1] + "px"; P.dispatchEvent(new P.Event("resize")); await W.dorme(300);
      var bb = P.document.querySelectorAll(".modo-grande"), ult = bb[bb.length - 1].getBoundingClientRect();
      if (ult.bottom > M[j][1] + 1) no("«Come giocate?» a " + M[j].join("x") + ": l'ultimo modo finisce a " + Math.round(ult.bottom) + " px (" + bb.length + " modi)");
      if (P.document.documentElement.scrollWidth > M[j][0] + 1) no("«Come giocate?» a " + M[j][0] + " scorre di lato");
    }
    f.style.width = "360px"; f.style.height = "740px";
    erroriVuoti();
    return righe.join("; ") + "; «Come giocate?» con " + P.document.querySelectorAll(".modo-grande").length + " modi in vista";
  } });

  // ============ p3-e: "Giocato di recente" (351-353) ============
  // la riga "👥 Avete giocato con: …" della fine partita: i nomi ("" se non c'è o è nascosta)
  function rigaRec(w) {
    var r = w && w.document.querySelector(".ft-rec");
    if (!r || r.hidden) return "";
    return [].map.call(r.querySelectorAll(".cmp-fine-n"), function (x) { return x.textContent; }).join(", ");
  }
  // i chip di "👥 Giocato di recente" in home ("Giulia · 🪜 La Scalinata", …)
  function chipRec(w) { return [].map.call(w.document.querySelectorAll(".home-rec .cmp-chip"), function (c) { return c.textContent; }); }
  // spia: i messaggi del core ("__…") che arrivano a un gioco (dopo l'avvio dell'app; la Sala no)
  function spiaGioco(w) {
    w.__giocoVede = [];
    var prima = w.SGNet.entra, primaO = w.SGNet.ospita;
    w.SGNet.entra = function (cod, cb, opz) {
      if (cb && !(opz && opz.tieni)) { var o = cb.onMsg; cb.onMsg = function (m) { if (m && typeof m.t === "string" && m.t.slice(0, 2) === "__") w.__giocoVede.push(m.t); return o ? o.apply(this, arguments) : undefined; }; }
      return prima.apply(this, arguments);
    };
    w.SGNet.ospita = function (gid, cb, opz) {
      if (cb && gid !== "__sala") { var o = cb.onMsg; cb.onMsg = function (id, m) { if (m && typeof m.t === "string" && m.t.slice(0, 2) === "__") w.__giocoVede.push(m.t); return o ? o.apply(this, arguments) : undefined; }; }
      return primaO.apply(this, arguments);
    };
  }
  // dalla fine partita (host) alla Sala: «🎮 Cambia gioco» (apre «Quale gioco?»), poi ‹
  async function allaSala(P, S) {
    if (!W.clicca(P, /Cambia gioco/, ".fine-tasti button")) no("a fine partita Paky non ha «🎮 Cambia gioco»");
    if (!await W.aspetta(function () { return !P.document.querySelector(".fine-tasti") && A.tessera(P, "Tris"); }, 6000)) no("«Cambia gioco» non apre la scelta del gioco («" + A.T(P).slice(0, 60) + "»)");
    W.clicca(P, /‹/, ".testa .btn");
    if (!await W.aspetta(function () { return eHost(P) && A.codiceTestata(P) === S && !P.document.querySelector(".fine-tasti"); }, 6000)) no("Paky non torna nella Sala («" + A.T(P).slice(0, 60) + "»)");
  }

  // 351. Tris (Paky contro Giulia, Bea guarda) e Scalinata in tre: la riga a fine partita, il ➕, la home
  aggiungi(351, { nome: "Giocato di recente: a fine Scalinata «👥 Avete giocato con: Giulia ➕» (Bea senza profilo online no), ➕ → richiesta, in home Giulia e Bea; __chi mai ai giochi", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true });
    var S = await A.apriSalaNuova("Paky");
    var G = await W.apriTel("Giulia", { hash: "sala=" + S, x: 185, salaSempre: true });
    // Bea senza profilo online (come chi gioca col profilo ricordato, senza rete): niente uid
    var B = await W.apriTel("Bea", { hash: "sala=" + S, x: 370, salaSempre: true });
    B.SGNube.utente = function () { return null; }; B.__fp.uid = "";
    if (!await W.aspetta(function () { return nomi(S).length === 3; }, 10000)) no("nella Sala non sono in 3 (" + nomi(S).join(", ") + ")");
    [P, G, B].forEach(spiaGioco);
    // Tris: Paky contro Giulia, Bea guarda
    var T1 = await A.lanciaDallaSala("Paky", S, "Tris");
    if (!await W.aspetta(function () { return A.vm(T1).avvId === A.idInSala(S, "Giulia") && A.dentro(G); }, 8000)) no("Giulia non è l'avversaria nel Tris (avvId " + A.vm(T1).avvId + ")");
    W.clicca(P, /Comincia/, ".sl-go");
    if (!await W.aspetta(function () { return A.vm(T1).fase === "gioco"; }, 6000)) no("il Tris non comincia");
    if (!await A.trisFinoAllaFine(T1, "Paky", "Giulia")) no("il Tris non finisce");
    if (!await W.aspetta(function () { return rigaRec(P) === "Giulia" && rigaRec(G) === "Paky"; }, 5000)) no("a fine Tris: Paky «" + rigaRec(P) + "», Giulia «" + rigaRec(G) + "»");
    if (B.SGCompagnia.recenti().length) no("Bea ha solo guardato il Tris ma ha già dei recenti: " + JSON.stringify(B.SGCompagnia.recenti()));
    // Scalinata in tre
    await allaSala(P, S);
    var T2 = await A.lanciaDallaSala("Paky", S, "La Scalinata");
    if (!await W.aspetta(function () { return A.ids(T2).length === 3; }, 8000)) no("non arrivano in 3 nella Scalinata");
    W.clicca(P, /Comincia/, ".sl-go");
    if (!await W.aspetta(function () { return A.vm(T2).fase === "scelta"; }, 6000)) no("la Scalinata non comincia");
    if (!await A.scalinataFinoAllaFine(T2, ["Paky", "Giulia", "Bea"], "Paky")) no("la Scalinata non finisce");
    if (!await W.aspetta(function () { return rigaRec(P) && A.tastiFineDi(P); }, 8000)) no("a fine Scalinata Paky non ha la riga («" + A.T(P).slice(-100) + "»)");
    if (rigaRec(P) !== "Giulia") no("a fine Scalinata Paky legge «Avete giocato con: " + rigaRec(P) + "»");
    if (!await W.aspetta(function () { return rigaRec(G) === "Paky"; }, 4000)) no("a fine Scalinata Giulia legge «" + rigaRec(G) + "» (__chi non arrivato?)");
    if (rigaRec(B)) no("Bea (senza profilo online) ha la riga: «" + rigaRec(B) + "»");
    var rB = B.SGCompagnia.recenti().map(function (r) { return r.n + (r.u ? "+" : ""); }).sort().join(", ");
    if (rB !== "Giulia+, Paky+") no("i recenti di Bea: " + rB);
    // ➕ → richiesta d'amicizia e il chip diventa ⏳
    var piu = P.document.querySelector(".ft-rec .cmp-piu");
    if (!piu) no("nella riga di Paky non c'è il ➕");
    piu.click();
    if (!await W.aspetta(function () { return (W.BR.amicizie || []).some(function (a) { return a.da === "finto-Paky" && a.a === "finto-Giulia"; }); }, 4000)) no("➕ non manda la richiesta (" + JSON.stringify(W.BR.amicizie) + ")");
    if (!await W.aspetta(function () { var r = P.document.querySelector(".ft-rec"); return r && /⏳/.test(r.textContent); }, 3000)) no("dopo ➕ il chip non è ⏳ («" + (P.document.querySelector(".ft-rec") || {}).textContent + "»)");
    // nessun __chi ai giochi
    var visti = [P, G, B].map(function (w) { return w.__giocoVede.filter(function (t) { return t === "__chi"; }).length; });
    if (visti.some(Boolean)) no("__chi è arrivato ai giochi (Paky " + visti[0] + ", Giulia " + visti[1] + ", Bea " + visti[2] + ")");
    // la home di Paky
    await allaSala(P, S);
    await chiudiPerTutti(P, "Paky");
    if (!await W.aspetta(function () { return chipRec(P).length >= 2; }, 3000)) no("in home Paky non ha «Giocato di recente» (" + JSON.stringify(chipRec(P)) + ")");
    var ch = chipRec(P);
    // (la Scalinata è l'ultima partita: Giulia e Bea, nell'ordine della classifica)
    if (!ch.some(function (c) { return /^Giulia · .*Scalinata/.test(c); }) || !ch.some(function (c) { return /^Bea · .*Scalinata/.test(c); })) no("in home: " + ch.join(" | "));
    if (ch.length !== 2) no("in home i chip sono " + ch.length + ": " + ch.join(" | "));
    var chips = [].slice.call(P.document.querySelectorAll(".home-rec .cmp-chip"));
    var chB = chips.filter(function (c) { return /^Bea/.test(c.textContent); })[0], chG = chips.filter(function (c) { return /^Giulia/.test(c.textContent); })[0];
    if (chB.querySelector(".cmp-piu")) no("Bea (senza uid) ha il ➕ in home");
    if (!/⏳/.test(chG.textContent)) no("in home Giulia non ha ⏳: «" + chG.textContent + "»");
    erroriVuoti();
    return "fine Tris: Paky «Giulia», Giulia «Paky», Bea niente; fine Scalinata: Paky «Giulia ➕» (Bea no) → richiesta e ⏳; in home «" + ch.join(" | ") + "»; __chi mai ai giochi";
  } });

  // 352. 25 partite finte → 20 voci, niente doppioni
  aggiungi(352, { nome: "Giocato di recente: 25 partite finte → 20 voci, niente doppioni, l'ultimo in cima", fai: async function () {
    var P = await telHome("Paky", 0);
    var R = P.SGCompagnia;
    for (var i = 0; i < 25; i++) {
      // ogni partita: uno nuovo (col profilo o no) e un ritorno di Giulia (stesso uid) o di Bea (stesso nome, senza uid)
      R.segnaRecenti([{ nome: "Amico " + i, uid: i % 2 ? "finto-amico-" + i : null }, i % 3 ? { nome: "Giulia", uid: "finto-Giulia" } : { nome: "Bea", uid: null }], i % 2 ? "tris" : "scalinata");
    }
    R.segnaRecenti([{ nome: "Giulia (nuovo nome)", uid: "finto-Giulia" }, { nome: "Paky", uid: "finto-Paky" }], "tris");
    var l = R.recenti();
    if (l.length !== 20) no("voci: " + l.length);
    var chiavi = l.map(function (r) { return r.u || ("n:" + r.n); });
    if (chiavi.some(function (k, j) { return chiavi.indexOf(k) !== j; })) no("doppioni: " + chiavi.join(", "));
    if (l[0].n !== "Giulia (nuovo nome)" || l[0].u !== "finto-Giulia") no("in cima c'è " + JSON.stringify(l[0]));
    if (l.some(function (r) { return r.u === "finto-Paky"; })) no("ci sono anch'io");
    if (l.filter(function (r) { return r.n === "Bea" && !r.u; }).length !== 1) no("Bea (senza uid) non c'è una volta sola: " + l.map(function (r) { return r.n; }).join(", "));
    // in home: 20 chip in una fila che scorre di lato (la pagina no)
    await rifaiHome(P);
    if (chipRec(P).length !== 20) no("in home i chip sono " + chipRec(P).length);
    if (P.document.documentElement.scrollWidth > P.innerWidth + 1) no("la home scorre di lato");
    erroriVuoti();
    return "20 voci, niente doppioni, «" + l[0].n + "» in cima, Bea senza uid c'è una volta sola; in home 20 chip";
  } });

  // 353. La fine partita con la riga a misura (host e ospite)
  aggiungi(353, { nome: "Fine partita con «👥 Avete giocato con» a 360x640 e 412x915: niente scorre, la riga c'è se ci sta (host e ospite)", fai: async function () {
    var X = await A.salaConAmici(["Giulia"]), S = X.S, P = X.w.Paky, G = X.w.Giulia;
    var T1 = await A.lanciaDallaSala("Paky", S, "Tris");
    if (!await W.aspetta(function () { return A.vm(T1).avvId && A.dentro(G); }, 8000)) no("Giulia non entra nella saletta del Tris");
    W.clicca(P, /Comincia/, ".sl-go");
    if (!await W.aspetta(function () { return A.vm(T1).fase === "gioco"; }, 6000)) no("il Tris non comincia");
    if (!await A.trisFinoAllaFine(T1, "Paky", "Giulia")) no("il Tris non finisce");
    if (!await W.aspetta(function () { return rigaRec(P) && rigaRec(G); }, 5000)) no("manca la riga (Paky «" + rigaRec(P) + "», Giulia «" + rigaRec(G) + "»)");
    var M = [[360, 640], [412, 915]], fatte = [];
    for (var k = 0; k < 2; k++) {
      var w = k ? G : P, nome = k ? "Giulia" : "Paky";
      for (var j = 0; j < M.length; j++) {
        var e = await A.misuraFine(w, nome, M[j][0], M[j][1]);
        if (e) no(nome + " a " + M[j].join("x") + ": " + e);
        var r = w.document.querySelector(".ft-rec"), vista = !r.hidden;
        if (vista) {
          var b = r.getBoundingClientRect(), ft = w.document.querySelector(".fine-tasti").getBoundingClientRect();
          if (b.bottom > ft.top + 1 || b.left < -1 || b.right > M[j][0] + 1) no(nome + " a " + M[j].join("x") + ": la riga esce o va sopra i tasti");
          if (b.height > 34) no(nome + ": la riga è alta " + Math.round(b.height) + " px");
        } else {
          // nascosta: solo se con la riga qualcosa sarebbe uscito dallo schermo
          r.hidden = false;
          var d = w.document, troppo = d.documentElement.scrollHeight > M[j][1] + 1 || r.parentNode.getBoundingClientRect().bottom > M[j][1] + 1;
          r.hidden = true;
          if (!troppo) no(nome + " a " + M[j].join("x") + ": la riga è nascosta ma ci stava");
        }
        fatte.push(nome + " " + M[j].join("x") + (vista ? " con la riga" : " senza (non ci sta)"));
      }
      var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    }
    erroriVuoti();
    return fatte.join("; ");
  } });

  // ============ p3-z: la prova delle due sere (420), le misure di tutte le schermate nuove (421), tutto il copione (422) ============
  // "Mai due host", guardato per tutta la prova: ogni 5 s si leggono le foto passate sullo stato di quei codici. Due host =
  // una sessione che pubblica di nuovo dopo che ne è arrivata una più nuova (A, poi B, poi ancora A), o due sessioni che
  // pubblicano tutte e due negli stessi 5 s dopo il cambio. (I testamenti non contano: li manda il broker, non un host.)
  function guardiaHost(codici) {
    var t0 = Date.now(), errori = [], giri = 0, cambi = {};
    function guarda() {
      giri++;
      codici.forEach(function (c) {
        var l = P3.passati(c, t0).filter(function (x) { return x.m && x.m._s && !/✝$/.test(x.da); });
        var viste = [], cor = null;
        l.forEach(function (x) {
          var s = x.m._s;
          if (s === cor) return;
          if (viste.indexOf(s) >= 0) { var e = c + ": la sessione di " + x.da + " (" + s + ") pubblica di nuovo dopo un'altra"; if (errori.indexOf(e) < 0) errori.push(e); }
          else viste.push(s);
          cor = s;
        });
        cambi[c] = viste.length;
        // negli ultimi 5 s: al massimo una sessione, se no quella vecchia deve aver smesso prima che parlasse la nuova
        var ult = l.filter(function (x) { return x.ms >= Date.now() - 5200; }), ss = [];
        ult.forEach(function (x) { if (ss.indexOf(x.m._s) < 0) ss.push(x.m._s); });
        if (ss.length > 1) {
          var primaN = ult.filter(function (x) { return x.m._s === ss[ss.length - 1]; })[0].ms;
          if (ult.some(function (x) { return x.m._s !== ss[ss.length - 1] && x.ms > primaN; })) { var e2 = c + ": due host negli stessi 5 s (" + ss.join(", ") + ")"; if (errori.indexOf(e2) < 0) errori.push(e2); }
        }
      });
    }
    var t = setInterval(guarda, 5000);
    return {
      aggiungi: function (c) { if (codici.indexOf(c) < 0) codici.push(c); },
      ora: function () { guarda(); if (errori.length) no("due host: " + errori.join(" · ")); },
      stop: function () { clearInterval(t); guarda(); if (errori.length) no("due host: " + errori.join(" · ")); return giri + " controlli, sessioni viste " + JSON.stringify(cambi); }
    };
  }
  // il nome di chi ha quell'id nella Sala
  function nomeDi(S, id) { var m = (vm(S).membri || []).filter(function (x) { return x.id === id; })[0]; return m ? m.nome : ""; }
  // alcune mosse del Tris (non fino alla fine): chi è di turno tocca la prima casella libera
  async function mosseTris(T, host, avv, quante) {
    for (var k = 0; k < quante; k++) {
      var ok = await W.aspetta(function () { var v = vm(T); return v.fase === "gioco" && W.finestra(v.turno === "X" ? host : avv); }, 6000);
      if (!ok) no("il Tris " + T + " non è in gioco (fase " + vm(T).fase + ")");
      var v = vm(T), w = W.finestra(v.turno === "X" ? host : avv), n0 = (v.board || []).filter(Boolean).length;
      var cel = await W.aspetta(function () { var c = w.document.querySelectorAll(".tr-cella"), i = (vm(T).board || []).indexOf(null); return c[i] && !c[i].disabled ? c[i] : null; }, 4000);
      if (!cel) no("nel Tris di " + T + " non si può toccare");
      cel.click();
      if (!await W.aspetta(function () { return (vm(T).board || []).filter(Boolean).length > n0; }, 4000)) no("la mossa nel Tris non arriva");
    }
  }
  // un Tris intero lanciato dall'host della Sala: si gioca con chi «Chi gioca?» ha già scelto; restituisce l'avversario
  // («Chi gioca?» sceglie di partenza chi ha giocato meno, anche senza l'host: qui si mettono l'host e avv)
  async function trisNellaSala(host, S, avv) {
    var w = W.finestra(host), r = await A.toccaGiocoSala(w, "Tris");
    if (r.dove === "chi") {
      if (!await W.aspetta(function () { return w.document.querySelectorAll(".chi-gioca .cg-chi.scelto").length; }, 4000)) no("«Chi gioca?» resta vuoto");
      for (var g = 0; g < 6; g++) {
        var sel = A.chiGioca(w) || [], via = sel.filter(function (n) { return n !== host && n !== avv; })[0], manca = [host, avv].filter(function (n) { return sel.indexOf(n) < 0; })[0];
        if (!via && !manca) break;
        try { A.toccaChi(w, via || manca); } catch (eC) { no(eC.message + " (in «Chi gioca?»: " + [].map.call(w.document.querySelectorAll(".chi-gioca .cg-chi .cg-nome"), function (x) { return x.textContent; }).join(", ") + "; «" + A.T(w).slice(0, 80) + "»)"); }
        await W.dorme(150);
      }
      if ((A.chiGioca(w) || []).sort().join() !== [host, avv].sort().join()) no("in «Chi gioca?» non riesco a scegliere " + host + " e " + avv + " (" + (A.chiGioca(w) || []).join(", ") + ")");
      if (!W.clicca(w, /Si gioca/, ".piede button")) no("in «Chi gioca?» non c'è «▶ Si gioca»");
    }
    var T = await W.aspetta(function () { var c = A.codiceSaletta(w); return w.document.querySelector(".saletta-schermo") && c && c !== S ? c : null; }, 8000);
    if (!T) no("dopo Tris " + host + " non è nella saletta del gioco («" + A.T(w).slice(0, 80) + "»)");
    if (!await W.aspetta(function () { return vm(T).avvId && nomeDi(S, vm(T).avvId) === avv; }, 8000)) no("nel Tris di " + host + " l'avversario non è " + avv + " (avvId " + vm(T).avvId + ")");
    if (!await W.aspetta(function () { return W.clicca(W.finestra(host), /Comincia/, ".sl-go"); }, 6000)) no("niente «Comincia» per " + host);
    if (!await W.aspetta(function () { return vm(T).fase === "gioco"; }, 8000)) no("il Tris non comincia");
    return { T: T, avv: avv };
  }

  // 420. Le due sere
  aggiungi(420, { nome: "Due sere: Sala → «📌 Fanne la nostra Compagnia» → la Sala passa a Giulia; 7 giorni dopo tutti dalla tessera (nessun link), Marco senza profilo aspetta, Luca apre e sparisce, Giulia tiene la Sala, Luca torna; mai due host", fai: async function () {
    var fatti = [], tutti = ["Paky", "Giulia", "Luca", "Marco"];
    // ---------- SERA 1 ----------
    var X = await A.salaConAmici(["Giulia", "Luca", "Marco"]), S = X.S, P = X.w.Paky;
    var G0 = guardiaHost([S]);
    // gioco 1: Tris
    var t1 = await trisNellaSala("Paky", S, "Giulia");
    if (!await A.trisFinoAllaFine(t1.T, "Paky", t1.avv)) no("sera 1: il primo Tris non finisce");
    if (!await W.aspetta(function () { var t = vm(S).torneo; return t && t.n === 1; }, 6000)) no("sera 1: il Tris non conta nella Classifica della serata");
    await allaSala(P, S);
    // gioco 2: la Scalinata in quattro
    var T2 = await A.lanciaDallaSala("Paky", S, "La Scalinata");
    await W.aspetta(function () { return A.ids(T2).length === 4; }, 8000);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 6000)) no("sera 1: niente «Comincia» nella Scalinata");
    if (!await W.aspetta(function () { return vm(T2).fase === "scelta"; }, 8000)) no("sera 1: la Scalinata non comincia");
    if (!await A.scalinataFinoAllaFine(T2, tutti, "Paky")) no("sera 1: la Scalinata non finisce");
    if (!await W.aspetta(function () { var t = vm(S).torneo; return t && t.n === 2 && A.tastiFineDi(P); }, 8000)) no("sera 1: la Scalinata non conta (" + JSON.stringify(vm(S).torneo) + ")");
    await allaSala(P, S);
    fatti.push("sera 1: Tris con " + t1.avv + " e Scalinata in 4 nella Sala " + S);
    // «📌 Fanne la nostra Compagnia»
    var ids = {}; ["Giulia", "Luca", "Marco"].forEach(function (n) { ids[n] = A.idInSala(S, n); });
    var punti = JSON.stringify(vm(S).torneo.punti);
    var C2 = await fanneComp(P, NOME, "🍻");
    W.clicca(P, /Più tardi/, ".comp-fatta button");
    G0.aggiungi(C2);
    if (!await W.aspetta(function () { return ["Giulia", "Luca", "Marco"].every(function (n) { return chiDentro(n, C2); }); }, 6000)) no("sera 1: non arrivano tutti nella Compagnia " + C2 + " (" + nomi(C2).join(", ") + ")");
    ["Giulia", "Luca", "Marco"].forEach(function (n) { if (A.idInSala(C2, n) !== ids[n]) no("sera 1: " + n + " ha cambiato id nel trasloco"); if (!W.finestra(n).SGCompagnia.trova(C2)) no("sera 1: " + n + " non ha salvato la Compagnia"); });
    if (JSON.stringify(vm(C2).torneo.punti) !== punti) no("sera 1: i punti dopo il trasloco: " + JSON.stringify(vm(C2).torneo.punti) + " invece di " + punti);
    // gioco 3, nella Compagnia
    var t3 = await trisNellaSala("Paky", C2, "Marco");
    if (!await A.trisFinoAllaFine(t3.T, "Paky", t3.avv)) no("sera 1: il Tris nella Compagnia non finisce");
    if (!await W.aspetta(function () { var t = vm(C2).torneo; return t && t.n === 3; }, 6000)) no("sera 1: il Tris nella Compagnia non conta");
    await allaSala(P, C2);
    // Paky passa la Sala a Giulia ed esce
    if (!await W.aspetta(function () { return (vm(C2).vice || [])[0] === ids.Giulia; }, 4000)) no("sera 1: il primo vice non è Giulia (" + JSON.stringify(vm(C2).vice) + ")");
    fermaAuto();
    try {
      W.clicca(P, /‹/, ".saletta-schermo .testa .btn");
      var bp = await W.aspetta(function () { var x = P.document.querySelector(".conferma-sfondo .btn-primario"); return x && !x.disabled && /Passa la Sala a Giulia/.test(x.textContent) ? x : null; }, 4000);
      if (!bp) no("sera 1: niente «👑 Passa la Sala a Giulia»");
      bp.click();
    } finally { rimettiAuto(); }
    var GL = W.finestra("Giulia");
    if (!await W.aspetta(function () { return hostDi(C2) === "Giulia" && eHost(GL) && inHome(P) && chiDentro("Luca", C2) && chiDentro("Marco", C2); }, 8000)) no("sera 1: la Sala non passa a Giulia con tutti (host " + hostDi(C2) + ")");
    var gen1 = vm(C2).gen;
    if (vm(C2).torneo.n !== 3) no("sera 1: dopo il passaggio la classifica ha " + vm(C2).torneo.n + " partite");
    await P3.unSoloHost(C2, 5000);
    G0.ora();
    fatti.push("Compagnia " + C2 + " (stessi id e punti), Tris contato, Sala a Giulia (gen " + gen1 + ")");
    // ---------- SERA 2: sette giorni dopo, le app si riaprono (nessun link) ----------
    var SETTE = 7 * 24 * 3600000;
    var gen2 = vm(C2).gen;
    for (var i = 0; i < tutti.length; i++) { W.spostaOrologio(tutti[i], SETTE); }
    // (prima si chiudono tutte le app, come a fine serata; poi, sette giorni dopo, si riaprono)
    tutti.forEach(function (n) { (W.BR.perNome[n] || []).forEach(function (c) { if (c.connected) c.sparisci(); c.morto = true; }); var f = document.getElementById("tel-" + n); if (f) f.src = "about:blank"; });
    await W.dorme(300);
    var w2 = {};
    for (i = 0; i < tutti.length; i++) {
      w2[tutti[i]] = await W.chiudiApp(tutti[i]);
      if (/#/.test(document.getElementById("tel-" + tutti[i]).src)) no("sera 2: " + tutti[i] + " ha riaperto con un link");
    }
    var t2 = Date.now();
    if ((W.statoStanza(C2) || {}).t !== "__hostgone") no("sera 2: chiuse le app, sulla Compagnia c'è " + JSON.stringify(W.statoStanza(C2)).slice(0, 80));
    var vuota = "🍻 " + NOME + " · Nessuno ancora · Apri la serata ›";
    for (i = 0; i < tutti.length; i++) {
      var w = w2[tutti[i]];
      if (!await W.aspetta(function () { return inHome(w) && P3.tessera(w, C2) === vuota; }, 9000)) no("sera 2: " + tutti[i] + " in home legge «" + P3.tessera(w, C2) + "» («" + A.T(w).slice(0, 60) + "»)");
    }
    if (P3.fotoSale(C2).some(function (f) { return f.ms >= t2; })) no("sera 2: qualcuno ha riaperto la Sala da solo");
    // Marco (senza profilo su questo telefono) tocca la tessera: «Nessuno ancora», aspetta
    var M = w2.Marco;
    M.SGNube.profilo = function () { return null; }; M.SGNube.utente = function () { return null; };
    M.localStorage.removeItem("sg-ultimo-profilo"); M.localStorage.setItem("sg-nome-ospite", "Marco");
    tesseraDi(M, C2).click();
    if (!await W.aspetta(function () { return /Nessuno ancora nella compagnia/.test(W.testo(M)); }, 8000)) no("sera 2: Marco senza profilo non aspetta («" + A.T(M).slice(0, 80) + "»)");
    if ((W.statoStanza(C2) || {}).t !== "__hostgone") no("sera 2: Marco senza profilo ha scritto sulla Compagnia");
    // Luca apre dalla sua tessera
    var L = w2.Luca, tL = Date.now();
    tesseraDi(L, C2).click();
    if (!await W.aspetta(function () { return eHost(L) && hostDi(C2) === "Luca" && vm(C2).gen > gen2; }, 8000)) no("sera 2: Luca dalla tessera non apre la serata (host " + hostDi(C2) + ", gen " + vm(C2).gen + ")");
    var gen3 = vm(C2).gen;
    if (titolo(L) !== "🍻 " + NOME) no("sera 2: titolo della Sala di Luca «" + titolo(L) + "»");
    if (!await W.aspetta(function () { return chiDentro("Marco", C2); }, 12000)) no("sera 2: Marco non entra da solo quando Luca apre («" + A.T(M).slice(0, 60) + "»)");
    var dM = Date.now() - tL;
    // Giulia e Paky: la tessera dice chi c'è, un tocco ed entrano (Giulia per prima: sarà la vice)
    var GG = w2.Giulia, PP = w2.Paky;
    for (var nn of ["Giulia", "Paky"]) {
      var ww = w2[nn];
      if (!await W.aspetta(function () { return /🟢 .*Luca.* dentro/.test(P3.tessera(ww, C2)); }, 36000, 250)) no("sera 2: la tessera di " + nn + " dice «" + P3.tessera(ww, C2) + "»");
      tesseraDi(ww, C2).click();
      if (!await W.aspetta(function () { return chiDentro(nn, C2); }, 4000)) no("sera 2: " + nn + " dalla tessera non entra («" + A.T(ww).slice(0, 60) + "»)");
    }
    if (!await W.aspetta(function () { return nomi(C2).length === 4 && (vm(C2).vice || [])[0] === A.idInSala(C2, "Giulia"); }, 4000)) no("sera 2: membri " + nomi(C2).join(", ") + ", vice " + JSON.stringify(vm(C2).vice));
    fatti.push("sera 2: tutti «Nessuno ancora», Marco aspetta, Luca apre (gen " + gen3 + "), Marco dentro in " + dM + " ms, Giulia e Paky dalla tessera");
    // Luca lancia un Tris e sparisce a metà
    var t4 = await trisNellaSala("Luca", C2, "Paky");
    await mosseTris(t4.T, "Luca", t4.avv, 2);
    var sGG = spiaPillole(GG), tv = Date.now();
    spentoDavvero("Luca");
    if (!await W.aspetta(function () { return hostDi(C2) === "Giulia" && vm(C2).gen > gen3 && eHost(GG) && salaDi(PP, C2) && salaDi(M, C2); }, 32000, 250))
      no("sera 2: la Sala non passa a Giulia (host " + hostDi(C2) + ", gen " + vm(C2).gen + "; Giulia «" + A.T(GG).slice(0, 50) + "», Paky «" + A.T(PP).slice(0, 50) + "», Marco «" + A.T(M).slice(0, 50) + "»)");
    var dv = ((Date.now() - tv) / 1000).toFixed(1);
    if (vm(C2).gioco || vm(C2).stanza) no("sera 2: la Sala di Giulia ha ancora il Tris di Luca");
    // (una sera nuova: la classifica riparte da zero, e il Tris di Luca era sul suo telefono: perso, non conta)
    if (vm(C2).torneo && vm(C2).torneo.n !== 0) no("sera 2: la classifica nella Sala di Giulia: " + JSON.stringify(vm(C2).torneo));
    await W.dorme(600);
    var pgg = sGG.stop();
    if (!pgg.some(function (t) { return /ora la Sala la tieni tu/.test(t); })) no("sera 2: Giulia non legge che la Sala è sua (" + pgg.join(" | ") + ")");
    // Luca torna: entra da amico
    var sL = spiaPillole(L);
    W.scongela("Luca"); W.riaccendi("Luca");
    if (!await W.aspetta(function () { return salaDi(L, C2) && nomi(C2).indexOf("Luca") >= 0 && hostDi(C2) === "Giulia"; }, 12000)) no("sera 2: Luca tornato non entra da amico (" + nomi(C2).join(", ") + "; «" + A.T(L).slice(0, 60) + "»)");
    await W.dorme(500);
    var pl = sL.stop();
    if (!pl.some(function (t) { return /Bentornato/.test(t); })) no("sera 2: Luca non legge «👋 Bentornato…» (" + pl.join(" | ") + ")");
    await P3.unSoloHost(C2, 5000);
    // nessun link mandato la sera 2: nessun telefono si è aperto con un "#"
    tutti.forEach(function (n) { if (/#/.test(document.getElementById("tel-" + n).src)) no("sera 2: " + n + " ha usato un link"); });
    var g = G0.stop();
    tutti.forEach(function (n) { W.spostaOrologio(n, 0); });
    erroriVuoti();
    fatti.push("Luca sparisce a metà Tris → Giulia host dopo " + dv + " s (gen " + vm(C2).gen + "), Luca torna da amico; " + g);
    return fatti.join(" · ");
  } });

  // 421. Misure di tutte le schermate nuove del Passo 3 a 360x640 e 412x915
  // (le schermate che le prove di prima non misuravano qui; poi si rifanno le misure dei pezzi: 319, 325, 325b, 346, 353, 367)
  async function aMisura(w, nome, L, H) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata,.sl-velo,.conferma-sfondo{ animation:none !important; }"; d.head.appendChild(st); }
    f.style.width = L + "px"; f.style.height = H + "px"; void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(400); w.scrollTo(0, 0);
  }
  function rimettiMisura(nomiT) { nomiT.forEach(function (n) { var f = document.getElementById("tel-" + n); if (f) { f.style.width = "360px"; f.style.height = "740px"; } }); }
  // una schermata qualsiasi a misura: niente scorre (la pagina né il centro), i tasti del piede si vedono interi
  function schermoOk(w, L, H, cosa) {
    var d = w.document, s = d.querySelector("#app > .schermata") || d.querySelector(".schermata");
    if (d.documentElement.scrollHeight > H + 1) return cosa + ": la pagina scorre (" + d.documentElement.scrollHeight + " px)";
    if (d.documentElement.scrollWidth > L + 1) return cosa + ": la pagina scorre di lato";
    var c = s && s.querySelector(".contenuto"); if (c && c.scrollHeight > c.clientHeight + 1) return cosa + ": il centro scorre (" + c.scrollHeight + " su " + c.clientHeight + ")";
    var b = [].slice.call(d.querySelectorAll(".schermata .piede .btn, .schermata .testa .btn"));
    for (var i = 0; i < b.length; i++) { var r = b[i].getBoundingClientRect(); if (r.width && (r.bottom > H + 1 || r.right > L + 1 || r.left < -1)) return cosa + ": «" + b[i].textContent + "» esce dallo schermo"; if (b[i].scrollWidth > b[i].clientWidth + 1) return cosa + ": «" + b[i].textContent + "» è tagliato"; }
    var h = d.querySelector(".schermata .testa h1"); if (h && h.scrollWidth > h.clientWidth + 1 && getComputedStyle(h).textOverflow !== "ellipsis") return cosa + ": il titolo esce";
    return "";
  }
  aggiungi(421, { nome: "Misure di tutte le schermate nuove del Passo 3 a 360x640 e 412x915 («Nessuno ancora», «👑 Passo la Sala…», «Le tue compagnie», e di nuovo 319, 325, 325b, 346, 353, 367)", fai: async function () {
    var M = [[360, 640], [412, 915]], fatte = [];
    // a) «🕐 Nessuno ancora nella compagnia» (chi non ha il profilo aspetta)
    var B = await telHome("Bea", 0, { prima: conComp([[C, NOME]]) });
    B.SGNube.profilo = function () { return null; }; B.SGNube.utente = function () { return null; };
    B.localStorage.removeItem("sg-ultimo-profilo"); B.localStorage.setItem("sg-nome-ospite", "Bea");
    tesseraDi(B).click();
    if (!await W.aspetta(function () { return /Nessuno ancora nella compagnia/.test(W.testo(B)); }, 8000)) no("Bea non arriva in «Nessuno ancora» («" + A.T(B).slice(0, 60) + "»)");
    for (var k = 0; k < M.length; k++) {
      await aMisura(B, "Bea", M[k][0], M[k][1]);
      var e = schermoOk(B, M[k][0], M[k][1], "«Nessuno ancora» a " + M[k].join("x")); if (e) no(e);
      var at = B.document.querySelector(".cmp-attesa").getBoundingClientRect(); if (at.right > M[k][0] + 1 || at.left < -1) no("«Nessuno ancora» a " + M[k].join("x") + ": il riquadro esce di lato");
    }
    fatte.push("«Nessuno ancora»");
    // b) «Le tue compagnie» con 3 compagnie: niente scorre
    var Q = await telHome("Sara", 185, { prima: conComp([[C, NOME], ["MNPQRS", "La squadra del calcetto", "⚽"], ["GHJKLM", "I cugini di campagna", "🏠"]]) });
    if (!W.clicca(Q, /Le tue compagnie/, ".cmp-tutte")) no("in home non c'è «📌 Le tue compagnie»");
    if (!await W.aspetta(function () { return Q.document.querySelectorAll(".cmp-g-voce").length === 3; }, 3000)) no("«Le tue compagnie» non ha 3 voci");
    for (k = 0; k < M.length; k++) { await aMisura(Q, "Sara", M[k][0], M[k][1]); var e2 = schermoOk(Q, M[k][0], M[k][1], "«Le tue compagnie» a " + M[k].join("x")); if (e2) no(e2); }
    fatte.push("«Le tue compagnie» con 3");
    rimettiMisura(["Bea", "Sara"]);
    // c) «👑 Passo la Sala a Giulia…» (Giulia ferma: la schermata resta fino al piano B)
    A.pulisci();
    var X = await A.salaConAmici(["Giulia"]), S = X.S, P = X.w.Paky;
    if (!await W.aspetta(function () { return (vm(S).vice || []).length === 1; }, 4000)) no("Giulia non è vice");
    fermaAuto();
    try {
      W.clicca(P, /‹/, ".saletta-schermo .testa .btn");
      var bp = await W.aspetta(function () { var x = P.document.querySelector(".conferma-sfondo .btn-primario"); return x && !x.disabled ? x : null; }, 4000);
      if (!bp) no("niente «👑 Passa la Sala»");
      W.congela("Giulia");
      bp.click();
      if (!await W.aspetta(function () { return /Passo la Sala a Giulia/.test(W.testo(P)); }, 2000)) no("non si vede «👑 Passo la Sala a Giulia…»");
      for (k = 0; k < M.length; k++) { await aMisura(P, "Paky", M[k][0], M[k][1]); var e3 = schermoOk(P, M[k][0], M[k][1], "«Passo la Sala…» a " + M[k].join("x")); if (e3) no(e3); }
      // dopo 8 s il piano B: «Giulia non risponde» con due tasti, a misura
      var sc = await W.aspetta(function () { return /non risponde/.test(W.testo(P)) && P.document.querySelector(".conferma-sfondo"); }, 10000);
      if (!sc) no("dopo 8 s non arriva «Giulia non risponde»");
      for (k = 0; k < M.length; k++) {
        await aMisura(P, "Paky", M[k][0], M[k][1]);
        [].forEach.call(P.document.querySelectorAll(".conferma-sfondo button"), function (b) { var r = b.getBoundingClientRect(); if (r.bottom > M[k][1] + 1 || r.right > M[k][0] + 1 || b.scrollWidth > b.clientWidth + 1) no("«non risponde» a " + M[k].join("x") + ": «" + b.textContent + "» non si vede intero"); });
      }
      W.clicca(P, /Resto nella Sala/, ".conferma-sfondo button");
      W.scongela("Giulia");
    } finally { rimettiAuto(); }
    fatte.push("«Passo la Sala…» e «non risponde»");
    rimettiMisura(["Paky"]);
    // d) le misure dei pezzi, di nuovo (una per una, da zero)
    if (!W.COPIONE.scenari[367]) await W.COPIONE.carica("passo3/tessere.js");
    var rifatte = [319, 325, "325b", 346, 353, 367];
    for (var j = 0; j < rifatte.length; j++) {
      A.pulisci();
      try { await W.COPIONE.scenari[rifatte[j]].fai(); } catch (er) { no(rifatte[j] + ": " + (er && er.message || er)); }
      fatte.push(String(rifatte[j]));
    }
    erroriVuoti();
    return fatte.join(", ") + " a 360x640 e 412x915";
  } });

  // 422. Tutto il copione, file per file (ogni file si carica e i suoi scenari girano subito: così due file che usano
  // gli stessi numeri non si coprono). opz = { file: ["passo3/rete.js", …], salta: [56, …], da: "…" } (senza: tutti)
  // Gli esiti finiscono anche in window.__esiti422. Lungo (ore): meglio a pezzi, con la scheda ricaricata tra un pezzo e l'altro.
  var FILE422 = ["copione-prova.js", "copione-giochi.js", "passo2/gruppo-a.js", "passo2/gruppo-b.js", "passo2/gruppo-c.js", "passo2/gruppo-d.js",
    "passo2/bot-gruppo-a.js", "passo2/bot-gruppo-b.js", "passo2/bot-gruppo-c.js", "passo2/bot-gruppo-d.js", "passo2/modello.js", "passo2/controllo.js", "passo2/lunghezza.js", "passo2/chidinoi.js",
    "passo3/comune.js", "passo3/rete.js", "passo3/tessere.js", "passo3/compagnia.js", "passo3/giochi-a.js", "passo3/giochi-b.js", "passo3/giochi-c.js", "passo3/giochi-d.js",
    "passo5/rete.js", "passo5/g1.js", "passo5/g2.js", "passo5/g3.js", "passo5/g4.js", "passo5/g5.js", "passo5/ordine.js", "passo5/riserva.js", "passo5/modello.js", "passo5/controllo.js"];
  // gli scenari di un file (quelli che il file aggiunge o cambia quando si carica)
  async function scenariDi(file) {
    var Sc = W.COPIONE.scenari, prima = {};
    Object.keys(Sc).forEach(function (k) { prima[k] = Sc[k]; });
    if (file === "copione-prova.js") return Object.keys(Sc).filter(function (k) { var n = parseInt(k, 10); return n < 100 || (n >= 500 && n < 520); });   // (501-519: Passo 5 nel copione)
    await W.COPIONE.carica(file);
    if (file === "passo3/compagnia.js") W.COPIONE.passo3 = W.P3;
    return Object.keys(Sc).filter(function (k) { return Sc[k] !== prima[k] && ["420", "421", "422"].indexOf(k) < 0; });
  }
  aggiungi(422, { nome: "Tutto il copione: 1-99, 101-111, 501-519, passo2/*, passo3/* e passo5/* (file per file)", fai: async function (opz) {
    opz = opz || {};
    var file = opz.file || FILE422, salta = (opz.salta || []).map(String), esiti = W.__esiti422 = W.__esiti422 || [], no422 = [], quanti = 0;
    for (var i = 0; i < file.length; i++) {
      var lista = await scenariDi(file[i]);
      if (opz.da) { var p = lista.indexOf(String(opz.da)); if (p >= 0) { lista = lista.slice(p); delete opz.da; } else if (i === 0) lista = []; }
      for (var j = 0; j < lista.length; j++) {
        if (salta.indexOf(lista[j]) >= 0) continue;
        var n = isNaN(+lista[j]) ? lista[j] : +lista[j];
        var r = await W.COPIONE.prova(n);
        quanti++; esiti.push(file[i] + " · " + r);
        if (/^\S+ NO /.test(r)) no422.push(r.slice(0, 160));
      }
    }
    // (il 422 stesso torna nell'elenco degli esiti come riassunto)
    if (no422.length) no(no422.length + " NO su " + quanti + ": " + no422.join(" || "));
    return quanti + " scenari tutti OK";
  } });
})();

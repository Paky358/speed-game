// PROVE DI «☝️ UNA PAROLA SOLA» (js/games/unaparola.js, data/unaparola-parole.js).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("unaparola/base.js"); await COPIONE.prova("up1")
// Con Edge invisibile: prova.js --porta 8972 --carica unaparola/base.js --prova up1,up2 --rifai --timeout 900
//
// up1: le regole senza grafica (doppioni e normalizzazione, «non vale», la risposta giusta con l'articolo, il plurale e
//      un errore di battitura, i punti dello schema 2, «Tutti insieme», i quasi uguali), le parole (almeno 400, nessun
//      doppione, una parola sola), il «📜 Si gioca così» e le impostazioni col box fuori dalla pagina.
// up2: online nella Sala in 4 (Paky, Giulia, Luca, Sara; 1 giro): turno 1 doppione («FELINO»/«felini» 💥 «stessa idea!»,
//      la stella va da sola all'unico indizio rimasto), Marco arriva a metà e tocca «▶ Entra» (entra al turno dopo con 0 punti),
//      turno 2 i quasi uguali (PANE/PANINO toccati da chi ha scritto) e Sara che ricarica dopo aver scritto, poi «Passo»,
//      turno 3 «non vale» e risposta sbagliata, turno 4 giusta con la ⭐ scelta, turno 5 la stella non scelta (va avanti da
//      sola), classifica coi punti giusti e i tasti del core; la parola e gli indizi mai nei messaggi per tutti prima del
//      momento giusto; misure 360x640 e 412x915 in ogni momento.
// up3: online in 3 (due indizi a testa): 4 carte, i punti con due indizi a testa, partita intera.
// up4: la ripresa: l'host ricarica mentre si scrive (gli indizi restano, nessuno in saletta) e sull'esito (niente punti
//      doppi), poi l'host si spegne mentre si indovina e la partita la porta avanti un amico fino alla classifica.
// up5: sullo stesso telefono in 3 (🏆 a punti, 1 giro): «Passa il telefono a Giulia — Luca, non guardare!», due indizi a
//      testa, i quasi uguali, la stella, la classifica del core.
// up6: sullo stesso telefono in 3, 🤝 Tutti insieme: risposte sbagliate (si perde anche la parola dopo) fino a «… su 13».
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  var NOME = "Una parola sola";
  var PAROLE = "OMBRELLO|CHITARRA|TELESCOPIO|GIRAFFA|POMODORO|LAVATRICE|ARCOBALENO|CAMMELLO";
  var EXTRA = ["KAPPA", "SIGMA", "OMEGA", "DELTA", "GAMMA", "THETA", "ZULU", "ECHO", "BRAVO"];
  function vm(C) { return W.vmDi(C) || {}; }
  function errori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / ")); }

  // ---- la spia di tutti i messaggi del broker finto (la parola e gli indizi non passano nei messaggi per tutti) ----
  if (!W.__ccUp) {
    var cc = W.__ccUp = W.creaClient;
    W.creaClient = function (nome, opts) {
      var c = cc.apply(this, arguments), pub = c.publish;
      c.publish = function (topic, payload) { if (W.__spiaUp) W.__spiaUp.push({ da: nome, topic: String(topic), p: String(payload) }); return pub.apply(this, arguments); };
      return c;
    };
  }
  // i messaggi "per tutti" (sullo stato della stanza): la parola segreta solo dalla risposta in poi, i testi degli indizi solo
  // dallo svelo in poi; i segreti ("seg") sempre con "to"
  function controllaSpia(parole, testi) {
    var male = [], foto = 0, conParola = 0;
    (W.__spiaUp || []).forEach(function (m) {
      if (!/\/stato$/.test(m.topic) || !m.p) return;
      var x; try { x = JSON.parse(m.p); } catch (e) { return; }
      var d = x && (x.data || x); if (!d || !d.t) return;
      if (d.t === "seg" || d.t === "no") { if (!d.to) male.push("segreto senza «to» da " + m.da); return; }
      if (d.t === "__ris") { if (!(d.vici || []).length) male.push("copia per i vice senza vice"); return; }
      if (d.t !== "vm" || !d.vm || d.vm.fase !== "gioco") return;
      var p = d.vm.passo, s = m.p.toUpperCase();
      foto++; if (p === "esito" && parole.some(function (w) { return s.indexOf('"' + w + '"') >= 0; })) conParola++;
      if (["scrivi", "controllo", "svela", "indovina"].indexOf(p) >= 0) parole.forEach(function (w) { if (s.indexOf('"' + w + '"') >= 0 && d.vm.persa !== w) male.push("«" + w + "» nella foto per tutti (" + p + ")"); });
      if (p === "scrivi" || p === "controllo") testi.forEach(function (w) { if (s.indexOf('"' + w.toUpperCase() + '"') >= 0) male.push("l'indizio «" + w + "» nella foto per tutti (" + p + ")"); });
    });
    if (!foto || !conParola) male.push("la spia non vede le foto (" + foto + " foto, " + conParola + " con la parola all'esito)");
    return male;
  }

  // ---- le regole della prova: parole fisse sull'host, e le impostazioni salvate ----
  function primaHost(regole) {
    return function (w) {
      w.SG_UNAPAROLA = [{ id: "facile", icona: "🟢", nome: "Facile", parole: PAROLE }];
      try { w.localStorage.setItem("sg-unaparola-regole", JSON.stringify(regole)); w.localStorage.removeItem("sg-unaparola-usate"); } catch (e) {}
    };
  }
  async function sala(amici, regole) {
    W.__spiaUp = [];
    var w = { Paky: await W.apriTel("Paky", { x: 0, salaSempre: true, prima: primaHost(regole) }) };
    var S = await A.apriSalaNuova("Paky");
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true });
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === amici.length + 1; }, 15000)) no("nella Sala non sono entrati in " + (amici.length + 1));
    var C = await A.lanciaDallaSala("Paky", S, NOME);
    if (!await W.aspetta(function () { return (vm(C).players || []).length === amici.length + 1; }, 15000)) no("nella saletta non arrivano in " + (amici.length + 1));
    var regoleTx = await W.aspetta(function () { return A.regoleDi(W.finestra(amici[0])) || null; }, 5000) || "";
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).passo === "scrivi"; }, 12000)) no("la partita non comincia");
    return { S: S, C: C, w: w, regole: regoleTx };
  }
  function nomeDi(C, id) { var p = (vm(C).players || []).filter(function (x) { return x.id === id; })[0]; return p ? p.nome : null; }
  function idDi(C, nome) { var p = (vm(C).players || []).filter(function (x) { return x.nome === nome; })[0]; return p ? p.id : null; }
  function punti(C) { var o = {}; (vm(C).players || []).forEach(function (p) { o[p.nome] = p.punti; }); return o; }
  function tocca(w, n) { if (!n) return false; n.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, cancelable: true })); return true; }
  function carte(w) { return [].slice.call(w.document.querySelectorAll(".up-carte .up-carta")); }
  function testoCarte(w) { return carte(w).map(function (c) { return c.querySelector(".w").textContent; }); }
  function parolaSu(w) { var p = w && w.document.querySelector(".up-palco .up-parola"); return p ? p.textContent : ""; }
  // scrive gli indizi sul telefono (uno o due: le righe col campo vuoto, una alla volta)
  async function scriviSu(w, lista) {
    for (var i = 0; i < lista.length; i++) {
      var inp = await W.aspetta(function () { return w.document.querySelector(".up-zona .up-input"); }, 5000);
      if (!inp) no("non c'è il campo dell'indizio («" + T(w).slice(0, 80) + "»)");
      inp.value = lista[i]; inp.dispatchEvent(new w.Event("input", { bubbles: true }));
      inp.parentNode.querySelector(".up-invia").click();
      await W.dorme(120);
    }
  }
  async function aspettaPasso(C, passo, ms, turno) { return W.aspetta(function () { var v = vm(C); return v.fase === "gioco" && v.passo === passo && (turno == null || v.turno === turno) ? v : null; }, ms || 10000); }
  // misure: lo schermo a quella grandezza non scorre e niente esce in basso. "" = tutto bene
  async function misura(nome, larg, alt) {
    var f = document.getElementById("tel-" + nome), w = W.finestra(nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{ animation:none !important; }"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize")); await W.dorme(450);
    var r = "", sc = d.querySelector(".up-scena");
    if (!sc) r = "non c'è la scena";
    else if (d.documentElement.scrollHeight > alt + 1) r = "la pagina scorre (" + d.documentElement.scrollHeight + ")";
    else if (sc.scrollHeight > sc.clientHeight + 1) r = "la scena scorre (" + sc.scrollHeight + " su " + sc.clientHeight + ")";
    else {
      var ca = d.querySelector(".up-carte"), rc = ca.getBoundingClientRect();
      [].forEach.call(sc.children, function (x) { if (!r && x.offsetParent && !x.classList.contains("up-avviso") && x.getBoundingClientRect().bottom > alt + 1) r = "«" + x.className + "» esce in basso"; });
      carte(w).forEach(function (c) { var b = c.getBoundingClientRect(); if (!r && (b.bottom > rc.bottom + 1 || b.right > larg + 1 || b.height < 30)) r = "una carta esce o è schiacciata (" + Math.round(b.height) + " px)"; });
      [].forEach.call(d.querySelectorAll(".up-azione button"), function (b) { if (!r && b.getBoundingClientRect().bottom > alt + 1) r = "il tasto «" + b.textContent + "» esce"; });
    }
    f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    return r ? nome + " " + larg + "x" + alt + ": " + r : "";
  }
  async function misure(nomi) {
    for (var i = 0; i < nomi.length; i++) { var a = await misura(nomi[i], 360, 640); if (a) return a; var b = await misura(nomi[i], 412, 915); if (b) return b; }
    return "";
  }
  function rigaInCorso(w) {
    var n = w && w.document.querySelector(".saletta-schermo .sl-incorso:not(.sl-duello)"); if (!n) return null;
    return { testo: n.innerText.replace(/\s+/g, " ").trim(), tasti: [].map.call(n.querySelectorAll("button"), function (b) { return b.textContent; }) };
  }

  // ---- un turno intero (piano: clues, simili, risposta, stella, durante(fase, …)) → { chi, parola, scrittori, v (l'esito) } ----
  async function turno(C, piano, nTurno) {
    var v = await aspettaPasso(C, "scrivi", 15000, nTurno); if (!v) no("non parte il turno " + nTurno + " (" + vm(C).passo + " " + vm(C).turno + ")");
    var chi = nomeDi(C, v.chi), scr = v.scrittori.map(function (id) { return nomeDi(C, id); }), WC = function () { return W.finestra(chi); };
    var q = v.doppio ? 2 : 1;
    var parola = await W.aspetta(function () { var p = parolaSu(W.finestra(scr[0])); return p && p !== "…" ? p : null; }, 6000);
    if (!parola) no(scr[0] + " non vede la parola");
    if (T(WC()).indexOf(parola) >= 0) no(chi + " (indovina) vede la parola");
    if (!/Indovini tu/.test(T(WC()))) no(chi + " non legge «Indovini tu!»");
    var lista = [], k = 0;
    scr.forEach(function (n, i) { var l = []; for (var j = 0; j < q; j++) { var c = (piano.clues || [])[k]; l.push(typeof c === "function" ? c(parola) : c || EXTRA[k % EXTRA.length]); k++; } lista.push(l); });
    var gia = (piano.durante && await piano.durante("prima", { chi: chi, scr: scr, parola: parola, lista: lista })) || [];
    for (var i = 0; i < scr.length; i++) if (gia.indexOf(scr[i]) < 0) await scriviSu(W.finestra(scr[i]), lista[i]);
    if (piano.durante) await piano.durante("scritto", { chi: chi, scr: scr, parola: parola, lista: lista });
    v = await W.aspetta(function () { var x = vm(C); return x.turno === nTurno && x.passo !== "scrivi" ? x : null; }, 10000);
    if (!v) no("dopo gli indizi il turno resta su «scrivi» (scritto: " + JSON.stringify(vm(C).scritto) + ")");
    if (v.passo === "controllo") {
      if (!await W.aspetta(function () { return testoCarte(W.finestra(scr[0])).filter(function (x) { return x && x !== "🔍"; }).length === v.indizi.length; }, 5000)) no(scr[0] + " non vede gli indizi da controllare (" + testoCarte(W.finestra(scr[0])).join(",") + ")");
      var tutti = [].concat.apply([], lista);
      tutti.forEach(function (x) { if (T(WC()).toUpperCase().indexOf(x.toUpperCase()) >= 0 && x.length > 2) no(chi + " (indovina) vede l'indizio «" + x + "» mentre si controlla"); });
      if (!/controllano gli indizi/.test(T(WC()))) no(chi + " non legge «Gli altri controllano gli indizi…»");
      if (piano.simili) {
        var w0 = W.finestra(scr[0]), cs = carte(w0);
        tocca(w0, cs[piano.simili[0]]); await W.dorme(150); tocca(w0, cs[piano.simili[1]]);
        if (!await W.aspetta(function () { var x = vm(C).indizi || []; return x[piano.simili[0]] && x[piano.simili[0]].canc === "simile" && x[piano.simili[1]].canc === "simile"; }, 4000)) no("i quasi uguali toccati non si cancellano (" + JSON.stringify(vm(C).indizi) + ")");
      }
      if (piano.durante) await piano.durante("controllo", { chi: chi, scr: scr, parola: parola });
      scr.forEach(function (n) { var b = W.finestra(n).document.querySelector(".up-ok"); if (b) b.click(); });
    }
    v = await aspettaPasso(C, "indovina", 15000, nTurno); if (!v) no("non si arriva a «indovina» (" + vm(C).passo + ")");
    var validi = (v.indizi || []).filter(function (x) { return !x.canc; }).map(function (x) { return x.testo; });
    if (!await W.aspetta(function () { return validi.every(function (x) { return testoCarte(WC()).indexOf(x) >= 0; }); }, 6000)) no(chi + " non vede gli indizi rimasti " + validi.join(",") + " (vede " + testoCarte(WC()).join(",") + ")");
    if (piano.durante) await piano.durante("indovina", { chi: chi, scr: scr, parola: parola });
    if (vm(C).passo === "indovina") {
      if (piano.risposta === "passo") { var bp = await W.aspetta(function () { return WC().document.querySelector(".up-passo"); }, 4000); if (!bp) no("non c'è «🤷 Passo»"); bp.click(); }
      else {
        var r = piano.risposta === "giusta" ? "il " + parola.toLowerCase() : piano.risposta === "esatta" ? parola : "SBAGLIATISSIMA";
        var inp = await W.aspetta(function () { return WC().document.querySelector(".up-azione .up-input"); }, 4000); if (!inp) no(chi + " non ha il campo della risposta");
        inp.value = r; inp.parentNode.querySelector(".up-invia").click();
      }
    }
    v = await W.aspetta(function () { var x = vm(C); return x.turno === nTurno && (x.passo === "risposta" || x.passo === "stella" || x.passo === "esito") ? x : null; }, 8000);
    if (!v) no("la risposta non arriva (" + vm(C).passo + ")");
    if (v.passo === "risposta" && !await W.aspetta(function () { return /Giusto!|No! Era|La parola era/.test(T(W.finestra(scr[0]))); }, 4000)) no("non si vede il verdetto della risposta");
    if (piano.stella != null) {
      v = await aspettaPasso(C, "stella", 8000, nTurno); if (!v) no("non c'è la stella (" + vm(C).passo + ")");
      if (piano.stella !== "nessuna") {
        var idx = (v.indizi || []).map(function (x, i) { return x.canc ? -1 : i; }).filter(function (i) { return i >= 0; })[piano.stella];
        if (!await W.aspetta(function () { return carte(WC())[idx] && carte(WC())[idx].classList.contains("tocca"); }, 4000)) no("le carte della stella non si toccano");
        tocca(WC(), carte(WC())[idx]);
      }
    }
    v = await aspettaPasso(C, "esito", piano.stella === "nessuna" ? 16000 : 9000, nTurno); if (!v) no("non si arriva all'esito (" + vm(C).passo + ")");
    if (v.parola !== parola) no("l'esito non svela la parola giusta (" + v.parola + ")");
    if (piano.durante) await piano.durante("esito", { chi: chi, scr: scr, parola: parola, v: v });
    var tutti2 = [chi].concat(scr);
    await W.dorme(300);
    tutti2.forEach(function (n) { var b = W.finestra(n).document.querySelector(".up-ok"); if (b && !b.disabled) b.click(); });
    return { chi: chi, parola: parola, scr: scr, v: v, lista: lista };
  }
  function puntiAttesi(res, idNome) {
    var o = {};
    res.forEach(function (r) { var pt = r.v.punteggi || {}; Object.keys(pt).forEach(function (id) { var n = idNome[id] || id; o[n] = (o[n] || 0) + pt[id]; }); });
    return o;
  }

  // ===================== up1: le regole =====================
  COPIONE.aggiungi("up1", { nome: "Una parola sola: regole senza grafica, parole, riassunto, impostazioni fuori pagina", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), U = w.__unaparola, g = null;
    if (!U) no("non vedo le regole (window.__unaparola)");
    var ok = function (c, m) { if (!c) no(m); };
    // doppioni e normalizzazione
    ok(U.stessoIndizio("Gatto", "gatti"), "Gatto = gatti"); ok(U.stessoIndizio("gatto", "GATTA"), "gatto = gatta");
    ok(U.stessoIndizio("Caffè", "caffe"), "Caffè = caffe"); ok(U.stessoIndizio("banca", "banche"), "banca = banche");
    ok(U.stessoIndizio("lago", "laghi"), "lago = laghi"); ok(U.stessoIndizio("orologio", "orologi"), "orologio = orologi");
    ok(U.stessoIndizio("amico", "amici"), "amico = amici"); ok(U.stessoIndizio("ape", "api"), "ape = api");
    ok(!U.stessoIndizio("pane", "panino"), "pane e panino NON sono doppioni automatici"); ok(!U.stessoIndizio("mare", "monte"), "mare ≠ monte");
    // non vale
    ok(U.nonVale("marea", "MARE"), "marea per MARE non vale"); ok(U.nonVale("gattino", "GATTO"), "gattino per GATTO non vale");
    ok(U.nonVale("girasole", "SOLE"), "girasole per SOLE non vale"); ok(U.nonVale("Mari", "MARE"), "mari per MARE non vale");
    ok(U.nonVale("pallone", "PALLONCINO"), "pallone per PALLONCINO non vale");
    ok(!U.nonVale("onde", "MARE"), "onde per MARE vale"); ok(!U.nonVale("capelli", "APE"), "capelli per APE vale"); ok(!U.nonVale("miele", "APE"), "miele per APE vale");
    ok(!U.unaParola("due parole"), "«due parole» non è una parola sola"); ok(!U.unaParola("l'acqua"), "«l'acqua» non è una parola sola"); ok(U.unaParola("Wi-Fi"), "«Wi-Fi» è una parola");
    // la risposta
    ok(U.giusta("gatti", "GATTO"), "gatti per GATTO è giusta"); ok(U.giusta("il gatto", "GATTO"), "«il gatto» è giusta"); ok(U.giusta("l'ombrello", "OMBRELLO"), "«l'ombrello» è giusta");
    ok(!U.giusta("gatta", "GATTO"), "gatta per GATTO è sbagliata"); ok(U.giusta("ombrelo", "OMBRELLO"), "un errore di battitura da 6 lettere in su va");
    ok(!U.giusta("sle", "SOLE"), "per le parole corte niente errori"); ok(U.giusta("Caffe", "CAFFÈ"), "senza accento va"); ok(!U.giusta("", "SOLE"), "vuota è sbagliata");
    ok(U.giusta("tiramisu", "TIRAMISÙ"), "tiramisu senza accento");
    // i punti (schema 2)
    var I = [{ id: "b" }, { id: "c" }, { id: "d", canc: "doppio" }, { id: "e", canc: "doppio" }];
    var p1 = U.puntiTurno({ giusta: true, chi: "a", indizi: I, stella: 1 });
    ok(p1.a === 3 && p1.b === 1 && p1.c === 3 && !p1.d && !p1.e, "punti giusta+stella: " + JSON.stringify(p1));
    ok(Object.keys(U.puntiTurno({ giusta: false, chi: "a", indizi: I, stella: 1 })).length === 0, "sbagliata: nessun punto");
    var p2 = U.puntiTurno({ giusta: true, chi: "a", indizi: [{ id: "b" }, { id: "b" }, { id: "c", canc: "nonvale" }], stella: 0 });
    ok(p2.a === 3 && p2.b === 4 && !p2.c, "due indizi dello stesso (in 3): " + JSON.stringify(p2));
    ok(U.puntiTurno({ giusta: true, chi: "a", indizi: I, stella: 2 }).d == null, "la stella su un doppione non vale");
    // tutti insieme
    var c1 = U.coopPasso({ fatte: 0, punti: 0 }, "giusta"), c2 = U.coopPasso({ fatte: 5, punti: 3 }, "sbagliata"), c3 = U.coopPasso({ fatte: 12, punti: 3 }, "sbagliata"), c4 = U.coopPasso({ fatte: 3, punti: 1 }, "passo");
    ok(c1.fatte === 1 && c1.punti === 1, "coop giusta"); ok(c2.fatte === 7 && c2.punti === 3 && c2.persa, "coop sbagliata: si perde anche la dopo");
    ok(c3.fatte === 13 && !c3.persa, "coop sbagliata all'ultima"); ok(c4.fatte === 4 && c4.punti === 1, "coop passo");
    ok(/Perfetto/.test(U.fraseCoop(13)) && /Ritentate/.test(U.fraseCoop(0)), "frasi di fine");
    // cancellati da soli e quasi uguali
    var L = U.cancellaDaSoli([{ id: "a", testo: "Felino" }, { id: "b", testo: "felini" }, { id: "c", testo: "Miao" }, { id: "d", testo: "gattone" }, { id: "e", testo: "Pane" }, { id: "f", testo: "panino" }], "GATTO");
    ok(L[0].canc === "doppio" && L[1].canc === "doppio" && L[0].gr === L[1].gr, "Felino/felini doppioni"); ok(!L[2].canc, "Miao resta"); ok(L[3].canc === "nonvale", "gattone non vale");
    U.applicaSimili(L, [[4, 5]]);
    ok(L[4].canc === "simile" && L[5].canc === "simile" && L[4].gr === L[5].gr && L[4].gr !== L[0].gr, "pane/panino toccati: simili");
    U.applicaSimili(L, []); ok(!L[4].canc && !L[5].canc && L[0].canc === "doppio", "tolti i simili, i doppioni restano");
    // la pesca: mai due volte la stessa in una partita
    var R = U.regoleDa({ mazzi: ["facile"] }), us = [], visti = {};
    for (var i = 0; i < 60; i++) { var x = U.pesca(R, us); if (visti[x]) no("la parola «" + x + "» è uscita due volte"); visti[x] = 1; }
    // le parole
    var mz = w.SG_UNAPAROLA || [], tot = 0, tutte = {};
    ok(mz.length >= 3, "servono 3 mazzi");
    mz.forEach(function (m) { m.parole.split("|").forEach(function (p) { tot++; var k = U.norma(p); if (tutte[k]) no("doppione: " + p); tutte[k] = 1; if (!/^[A-ZÀÈÉÌÒÙ]+$/.test(p)) no("parola strana: «" + p + "»"); }); });
    ok(tot >= 400, "solo " + tot + " parole");
    // riassunto e impostazioni col box fuori dalla pagina
    var reg = null; w.SG.registra = function () {};
    var src = await (await fetch("/js/games/unaparola.js?" + Date.now())).text();
    w.SG.registra = function (x) { reg = x; }; w.eval(src); g = reg;
    if (!g) no("non riesco a leggere il gioco");
    var r0 = g.riassunto({});
    ok(r0 === "🏆 A punti · 2 giri · 🟢 Facile, 🟡 Media", "riassunto di partenza: " + r0);
    var r1 = g.riassunto({ stile: "insieme", mazzi: ["serata"] }); ok(r1 === "🤝 Tutti insieme · 13 parole · 🌶️ Serata", "riassunto tutti insieme: " + r1);
    try { w.localStorage.removeItem("sg-unaparola-regole"); } catch (e) {}
    var box = w.document.createElement("div"), dove = {};
    g.impostazioni(box, dove, { el: w.SG._util.el, sala: true, modo: "online", giocatori: ["Paky", "Luca", "Sara"] });
    ok(dove.stile === "punti" && dove.giri === 2 && dove.mazzi.join() === "facile,media", "di partenza: " + JSON.stringify(dove));
    var bott = function (re) { return [].filter.call(box.querySelectorAll("button"), function (b) { return re.test(b.textContent); })[0]; };
    bott(/Tutti insieme/).click(); ok(dove.stile === "insieme" && bott(/^1 volta/).parentNode.style.display === "none", "«Tutti insieme» nasconde i giri");
    bott(/A punti/).click(); bott(/^3 volte/).click(); ok(dove.giri === 3 && bott(/^1 volta/).parentNode.style.display === "", "3 giri");
    bott(/Serata/).click(); bott(/Facile/).click(); bott(/Media/).click(); ok(dove.mazzi.join() === "serata", "solo serata: " + dove.mazzi.join());
    bott(/Serata/).click(); ok(dove.mazzi.join() === "serata", "almeno un mazzo resta");
    ok(/Serata \(\d+\)/.test(box.textContent), "il numero di parole del mazzo");
    var salv = JSON.parse(w.localStorage.getItem("sg-unaparola-regole") || "{}");
    ok(salv.giri === 3 && salv.mazzi.join() === "serata", "le scelte non si salvano: " + JSON.stringify(salv));
    try { w.localStorage.removeItem("sg-unaparola-regole"); } catch (e) {}
    errori();
    return "regole, punti, tutti insieme, quasi uguali, " + tot + " parole senza doppioni, riassunti e impostazioni ok";
  } });

  // ===================== up2: online in 4 nella Sala =====================
  COPIONE.aggiungi("up2", { nome: "Una parola sola online in 4 nella Sala: doppioni, chi arriva tardi, quasi uguali, ricarica, Passo, non vale, stella, classifica", fai: async function () {
    var Z = await sala(["Giulia", "Luca", "Sara"], { stile: "punti", giri: 1, mazzi: ["facile"] }), C = Z.C, S = Z.S, P = Z.w.Paky;
    if (!/A punti · 1 giro/.test(Z.regole)) no("Giulia non legge le regole («" + Z.regole + "»)");
    var res = [], note = [], mis = "", idM = null, avvisi = [];
    // 1: FELINO/felini 💥, la stella da sola a BAFFI; intanto arriva Marco
    res.push(await turno(C, { clues: ["FELINO", "felini", "BAFFI"], risposta: "giusta", durante: async function (f, o) {
      if (f === "prima") mis = mis || await misure([o.scr[0], o.chi]);
      if (f === "scritto") {
        var M = await W.apriTel("Marco", { hash: "sala=" + S, x: 740, salaSempre: true });
        var r = await W.aspetta(function () { var x = rigaInCorso(M); return x && x.tasti.length ? x : null; }, 10000);
        if (!r || !/Entra · giochi dal prossimo turno/.test(r.tasti[0] || "")) no("Marco non ha «▶ Entra · giochi dal prossimo turno» (" + JSON.stringify(r) + ")");
        W.clicca(M, /Entra · giochi/, ".sl-incorso button");
        idM = A.idInSala(S, "Marco");
        if (!await W.aspetta(function () { return (vm(C).prossimi || []).some(function (x) { return x.id === idM; }); }, 8000)) no("Marco non è tra i prossimi");
        if ((vm(C).players || []).some(function (x) { return x.id === idM; })) no("Marco è entrato a metà turno");
      }
      if (f === "indovina") {
        [o.scr[0], o.chi].forEach(function (n) { var a = W.finestra(n).document.querySelector(".up-avviso"); avvisi.push(a ? a.textContent : ""); });
        mis = mis || await misure([o.chi]);
      }
    } }, 1));
    var r1 = res[0], v1 = r1.v, idChi1 = idDi(C, r1.chi), idB = v1.indizi.filter(function (x) { return x.testo === "BAFFI"; })[0].id;
    if (v1.indizi[0].canc !== "doppio" || v1.indizi[1].canc !== "doppio") no("FELINO/felini non sono doppioni: " + JSON.stringify(v1.indizi));
    if (!avvisi.some(function (a) { return /stessa idea!/.test(a); })) no("nessuno ha letto «… : stessa idea!» (" + avvisi.join(" | ") + ")");
    if (v1.stella == null || v1.indizi[v1.stella].id !== idB) no("con un indizio solo la stella non va da sola a BAFFI");
    if (v1.punteggi[idChi1] !== 3 || v1.punteggi[idB] !== 3 || Object.keys(v1.punteggi).length !== 2) no("punti del turno 1: " + JSON.stringify(v1.punteggi));
    note.push("t1 💥 doppione, ⭐ da sola");
    // 2: entra Marco (0 punti); PANE/PANINO quasi uguali; Sara ricarica dopo aver scritto; Passo
    res.push(await turno(C, { clues: ["PANE", "PANINO", "CODA", "ZETA"], simili: [0, 1], risposta: "passo", durante: async function (f, o) {
      if (f === "prima") {
        var pM = (vm(C).players || []).filter(function (x) { return x.id === idM; })[0];
        if (!pM || pM.punti !== 0) no("al turno 2 Marco non è entrato con 0 punti (" + JSON.stringify(pM) + ")");
        if (o.scr.indexOf("Marco") < 0) no("Marco non scrive al turno 2");
        // Sara scrive, ricarica e ritrova il suo indizio
        var sara = o.scr.indexOf("Sara"); if (sara < 0) return [];
        var mio = o.lista[sara][0], idS = idDi(C, "Sara");
        await scriviSu(W.finestra("Sara"), [mio]);
        if (!await W.aspetta(function () { return (vm(C).scritto || {})[idS] === 1; }, 5000)) no("l'indizio di Sara non arriva");
        await W.ricarica("Sara");
        if (!await W.aspetta(function () { return T(W.finestra("Sara")).indexOf("✅ «" + mio + "»") >= 0; }, 10000)) no("Sara ricarica e non ritrova «" + mio + "» («" + T(W.finestra("Sara")).slice(0, 100) + "»)");
        note.push("Sara ricarica e ritrova il suo indizio");
        return ["Sara"];
      }
      if (f === "controllo") { mis = mis || await misure([o.scr[0], o.chi]); }
    } }, 2));
    var v2 = res[1].v;
    if (v2.indizi[0].canc !== "simile" || v2.indizi[1].canc !== "simile" || v2.indizi[2].canc || v2.indizi[3].canc) no("turno 2: " + JSON.stringify(v2.indizi));
    if (Object.keys(v2.punteggi || {}).length) no("con Passo qualcuno prende punti: " + JSON.stringify(v2.punteggi));
    note.push("t2 Marco dentro, 🤝 quasi uguali, Passo 0");
    // 3: «non vale» e risposta sbagliata
    res.push(await turno(C, { clues: [function (p) { return p.toLowerCase() + "ccio"; }, "UNO", "DUE", "TRE"], risposta: "sbagliata", durante: async function (f, o) {
      if (f === "esito") mis = mis || await misure([o.chi, o.scr[1]]);
    } }, 3));
    var v3 = res[2].v;
    if (v3.indizi[0].canc !== "nonvale") no("l'indizio che contiene la parola vale: " + JSON.stringify(v3.indizi[0]));
    if (v3.giusta || Object.keys(v3.punteggi || {}).length) no("risposta sbagliata con punti");
    note.push("t3 🚫 non vale, ❌ 0");
    // 4: giusta, stella sul secondo indizio
    res.push(await turno(C, { clues: ["ROSSO", "VERDE", "BLU", "GIALLO"], risposta: "esatta", stella: 1 }, 4));
    var v4 = res[3].v, id4 = idDi(C, res[3].chi), st4 = v4.indizi[v4.stella];
    if (!st4 || st4.testo !== "VERDE") no("la stella non è su VERDE (" + JSON.stringify(st4) + ")");
    if (v4.punteggi[id4] !== 3 || v4.punteggi[st4.id] !== 3 || v4.indizi.filter(function (x) { return v4.punteggi[x.id] === 1; }).length !== 3) no("punti del turno 4: " + JSON.stringify(v4.punteggi));
    note.push("t4 ✅ ⭐ scelta");
    // 5 (Marco indovina): la stella non scelta → si va avanti da soli
    res.push(await turno(C, { clues: [], risposta: "giusta", stella: "nessuna" }, 5));
    var v5 = res[4].v;
    if (v5.stella != null) no("senza stella scelta c'è una stella");
    if (res[4].chi !== "Marco") no("al turno 5 non indovina Marco ma " + res[4].chi);
    note.push("t5 ⭐ non scelta: avanti da sola");
    // la classifica
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 10000)) no("dopo 5 turni la partita non finisce (" + vm(C).passo + " " + vm(C).turno + ")");
    var idNome = {}; (vm(C).players || []).forEach(function (p) { idNome[p.id] = p.nome; });
    var att = puntiAttesi(res, idNome), cl = vm(C).classifica || [];
    cl.forEach(function (r) { if ((att[r.nome] || 0) !== r.punti) no("in classifica " + r.nome + " ha " + r.punti + " invece di " + (att[r.nome] || 0) + " " + JSON.stringify(att)); });
    if (cl.length !== 5) no("in classifica non sono in 5");
    if (!await W.aspetta(function () { return A.tastiFineDi(P) && A.tastiFineDi(W.finestra("Giulia")); }, 6000)) no("a fine partita mancano i tasti del core");
    if (A.tastiFineDi(P).join(" | ") !== "↻ Rivincita | 🎮 Cambia gioco") no("Paky ha «" + A.tastiFineDi(P).join(" | ") + "»");
    var parole = res.map(function (r) { return r.parola.toUpperCase(); }), testi = [].concat.apply([], res.map(function (r) { return [].concat.apply([], r.lista); })).filter(function (x) { return x.length > 2; });
    var male = controllaSpia(parole, testi); if (male.length) no(male.slice(0, 3).join(" | "));
    if (mis) no("misure: " + mis);
    errori();
    return note.join(" · ") + " · classifica " + cl.map(function (r) { return r.nome + " " + r.punti; }).join(", ") + " · segreti mai per tutti · misure ok";
  } });

  // ===================== up3: online in 3, due indizi a testa =====================
  COPIONE.aggiungi("up3", { nome: "Una parola sola online in 3: due indizi a testa, partita intera", fai: async function () {
    var Z = await sala(["Giulia", "Luca"], { stile: "punti", giri: 1, mazzi: ["facile"] }), C = Z.C, mis = "";
    var v = vm(C);
    if (!v.doppio || v.scrittori.length !== 2) no("in 3 non si scrivono due indizi a testa");
    var res = [];
    res.push(await turno(C, { clues: ["SOLE", "LUNA", "STELLA", "COMETA"], risposta: "giusta", stella: 3, durante: async function (f, o) {
      if (f === "prima") {
        var w = W.finestra(o.scr[0]);
        if (w.document.querySelectorAll(".up-zona .up-input").length !== 2) no(o.scr[0] + " non ha due campi");
        if (carte(w).length !== 4) no("le carte non sono 4 (" + carte(w).length + ")");
        mis = await misure([o.scr[0]]);
      }
    } }, 1));
    var v1 = res[0].v, chi = idDi(C, res[0].chi);
    if (v1.indizi.length !== 4) no("indizi del turno 1: " + v1.indizi.length);
    var a = v1.indizi[0].id, b = v1.indizi[2].id;
    if (v1.punteggi[chi] !== 3 || v1.punteggi[a] !== 2 || v1.punteggi[b] !== 4) no("punti con due indizi a testa: " + JSON.stringify(v1.punteggi));
    res.push(await turno(C, { clues: ["ALFA", "alfa", "BETA", "GAMMA"], risposta: "giusta", stella: 0 }, 2));
    var v2 = res[1].v;
    if (v2.indizi[0].canc !== "doppio" || v2.indizi[1].canc !== "doppio") no("lo stesso indizio scritto due volte dallo stesso non si cancella");
    res.push(await turno(C, { clues: ["QUOKKA", "TAPIRO", "VOMBATO", "OKAPI"], risposta: "passo" }, 3));
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 10000)) no("dopo 3 turni la partita non finisce");
    var idNome = {}; (vm(C).players || []).forEach(function (p) { idNome[p.id] = p.nome; });
    var att = puntiAttesi(res, idNome);
    (vm(C).classifica || []).forEach(function (r) { if ((att[r.nome] || 0) !== r.punti) no(r.nome + " ha " + r.punti + " invece di " + (att[r.nome] || 0)); });
    if (mis) no("misure: " + mis);
    errori();
    return "in 3: 2 campi e 4 carte, punti " + JSON.stringify(att) + ", doppione dello stesso, misure ok";
  } });

  // ===================== up4: la ripresa e la riserva =====================
  COPIONE.aggiungi("up4", { nome: "Una parola sola: l'host ricarica (scrivi, esito), poi si spegne e un amico porta avanti la partita", fai: async function () {
    var Z = await sala(["Giulia", "Luca", "Sara"], { stile: "punti", giri: 1, mazzi: ["facile"] }), C = Z.C, note = [];
    var res = [];
    // turno 1: l'host ricarica dopo che due hanno scritto
    res.push(await turno(C, { clues: ["ROSSO", "VERDE", "BLU"], risposta: "giusta", stella: 0, durante: async function (f, o) {
      if (f !== "prima") return;
      var n0 = o.scr.filter(function (n) { return n !== "Paky"; })[0];
      await scriviSu(W.finestra(n0), o.lista[o.scr.indexOf(n0)]);
      if (!await W.aspetta(function () { return Object.keys(vm(C).scritto || {}).some(function (k) { return vm(C).scritto[k] > 0; }); }, 4000)) no("l'indizio non arriva");
      var rip0 = vm(C).rip || 0;
      await W.ricarica("Paky");
      if (!await W.aspetta(function () { var x = vm(C); return x.fase === "gioco" && (x.rip || 0) > rip0 && x.passo === "scrivi"; }, 15000)) no("dopo la ricarica dell'host la partita non riprende su «scrivi» (" + vm(C).fase + " " + vm(C).passo + ")");
      if (!Object.keys(vm(C).scritto || {}).some(function (k) { return vm(C).scritto[k] > 0; })) no("dopo la ricarica l'indizio scritto è perso");
      if (["Giulia", "Luca", "Sara"].some(function (n) { return W.finestra(n).document.querySelector(".saletta-schermo"); })) no("qualcuno è tornato in saletta");
      note.push("ricarica su «scrivi»: indizi tenuti");
      return [n0];
    } }, 1));
    // turno 2: l'host ricarica sull'esito (niente punti doppi)
    res.push(await turno(C, { clues: ["UNO", "DUE", "TRE"], risposta: "giusta", stella: 1, durante: async function (f, o) {
      if (f !== "esito") return;
      var p0 = JSON.stringify(punti(C)), rip0 = vm(C).rip || 0;
      await W.ricarica("Paky");
      if (!await W.aspetta(function () { var x = vm(C); return (x.rip || 0) > rip0; }, 15000)) no("la ricarica sull'esito non riprende");
      var p1 = JSON.stringify(punti(C));
      if (p0 !== p1) no("dopo la ricarica sull'esito i punti cambiano: " + p0 + " → " + p1);
      note.push("ricarica sull'esito: punti uguali");
    } }, 2));
    // turno 3: l'host si spegne mentre si indovina → un amico porta avanti la partita
    var v = await aspettaPasso(C, "scrivi", 20000, 3); if (!v) no("non parte il turno 3");
    var chi = nomeDi(C, v.chi), scr = v.scrittori.map(function (id) { return nomeDi(C, id); });
    for (var i = 0; i < scr.length; i++) await scriviSu(W.finestra(scr[i]), [EXTRA[i]]);
    v = await W.aspetta(function () { var x = vm(C); return x.passo === "controllo" || x.passo === "indovina" ? x : null; }, 10000);
    if (v && v.passo === "controllo") scr.forEach(function (n) { var b = W.finestra(n).document.querySelector(".up-ok"); if (b) b.click(); });
    if (!await aspettaPasso(C, "indovina", 12000, 3)) no("non si arriva a indovinare al turno 3");
    var pPrima = punti(C);
    W.congela("Paky"); W.spegni("Paky");
    var amici = ["Giulia", "Luca", "Sara"];
    var tiene = await W.aspetta(function () { var s = W.statoStanza(C) || {}; return s._h && s._h !== "host" ? s._h : null; }, 25000);
    if (!tiene) no("dopo che l'host si spegne nessun amico tiene la partita");
    note.push("l'host si spegne: la tiene " + (amici.filter(function (n) { return A.mioId(n) === tiene; })[0] || tiene));
    // il turno 3 va avanti (chi indovina era Paky? allora il turno salta)
    var fino = Date.now() + 90000;
    while (Date.now() < fino && vm(C).fase === "gioco") {
      var x = vm(C), chiN = nomeDi(C, x.chi);
      if (x.passo === "indovina" && chiN !== "Paky") {
        var wc = W.finestra(chiN), inp = wc.document.querySelector(".up-azione .up-input");
        if (inp && !inp.disabled) { inp.value = "SBAGLIATA"; inp.parentNode.querySelector(".up-invia").click(); }
      } else if (x.passo === "scrivi") {
        for (var j = 0; j < x.scrittori.length; j++) { var n = nomeDi(C, x.scrittori[j]); if (n === "Paky") continue; var ww = W.finestra(n); if (ww.document.querySelector(".up-zona .up-input")) await scriviSu(ww, [EXTRA[(j + x.turno) % EXTRA.length]]); }
      } else if (x.passo === "controllo" || x.passo === "esito") {
        amici.forEach(function (n2) { var b = W.finestra(n2).document.querySelector(".up-ok"); if (b && !b.disabled) b.click(); });
      }
      await W.dorme(400);
    }
    if (vm(C).fase !== "fine") no("la partita tenuta dall'amico non arriva alla classifica (" + vm(C).passo + " " + vm(C).turno + ")");
    var cl = vm(C).classifica || [];
    Object.keys(pPrima).forEach(function (n) { var r = cl.filter(function (q) { return q.nome === n; })[0]; if (!r || r.punti < pPrima[n]) no(n + " ha perso punti col cambio di host"); });
    errori();
    return note.join(" · ") + " · classifica " + cl.map(function (r) { return r.nome + " " + r.punti; }).join(", ");
  } });

  // ===================== sullo stesso telefono =====================
  async function locale(regole, nomi) {
    var P = await W.apriTel("Paky", { x: 0, prima: primaHost(regole) });
    var tess = await W.aspetta(function () { return A.tessera(P, NOME); }, 5000); if (!tess) no("in home non c'è «" + NOME + "»");
    tess.click();
    if (!await W.aspetta(function () { return W.clicca(P, /Su questo telefono/, ".modo-grande"); }, 3000)) no("in «Come giocate?» non c'è «Su questo telefono»");
    if (!await W.aspetta(function () { return P.document.querySelectorAll(".sala-riga input").length; }, 3000)) no("non c'è la lista di chi gioca");
    while (P.document.querySelectorAll(".sala-riga input").length < nomi.length) { if (!W.clicca(P, /Aggiungi giocatore/)) no("non c'è «＋ Aggiungi giocatore»"); await W.dorme(100); }
    var c = P.document.querySelectorAll(".sala-riga input");
    nomi.forEach(function (n, i) { c[i].value = n; c[i].dispatchEvent(new P.Event("input", { bubbles: true })); });
    while (P.document.querySelectorAll(".sala-riga input").length > nomi.length) { P.document.querySelectorAll(".sala-riga .togli")[nomi.length].click(); await W.dorme(100); }
    if (!W.clicca(P, /Avanti/, ".piede button")) no("non c'è «Avanti ▶»");
    if (!await W.aspetta(function () { return W.clicca(P, /^Comincia/, ".piede button"); }, 3000)) no("non c'è «Comincia ▶»");
    return P;
  }
  async function premi(P, re, ms) { var ok = await W.aspetta(function () { return [].some.call(P.document.querySelectorAll(".up-azione button"), function (b) { return re.test(b.textContent) && !b.disabled; }); }, ms || 5000); if (!ok) no("non trovo «" + re + "» («" + T(P).slice(0, 120) + "»)"); await W.dorme(520); W.clicca(P, re, ".up-azione button"); await W.dorme(80); }
  async function turnoLocale(P, nomi, indizi, risposta, simili, stella) {
    await premi(P, /Si comincia a scrivere/);
    var info = T(P), k = 0, chi = null;
    for (var i = 0; i < nomi.length - 1; i++) {
      if (!await W.aspetta(function () { return /Passa il telefono a/.test(T(P)) && /non guardare!/.test(T(P)); }, 4000)) no("non c'è «Passa il telefono a … — … non guardare!»");
      var m = /🙈 (\S+), non guardare/.exec(T(P)); chi = m && m[1];
      await premi(P, /^Sono /);
      var ins = await W.aspetta(function () { var l = P.document.querySelectorAll(".up-azione .up-input"); return l.length ? l : null; }, 3000);
      if (!ins) no("non ci sono i campi per scrivere");
      [].forEach.call(ins, function (inp) { inp.value = indizi[k++] || EXTRA[k % EXTRA.length]; });
      await premi(P, /^Fatto ▶/);
    }
    if (simili) {
      if (!await W.aspetta(function () { return /quasi uguali/.test(T(P)); }, 3000)) no("non c'è il controllo dei quasi uguali");
      var cs = carte(P); tocca(P, cs[simili[0]]); await W.dorme(100); tocca(P, cs[simili[1]]); await W.dorme(100);
      if (!carte(P)[simili[0]].classList.contains("canc")) no("i quasi uguali non si cancellano");
      await premi(P, /Fatto ▶/);
    } else if (/quasi uguali/.test(T(P))) await premi(P, /Fatto ▶/);
    if (!await W.aspetta(function () { return /Ora puoi guardare/.test(T(P)); }, 3000)) no("il telefono non torna a chi indovina");
    await premi(P, /^Sono /);
    var inp = await W.aspetta(function () { return P.document.querySelector(".up-azione .up-input"); }, 12000); if (!inp) no("chi indovina non ha il campo");
    if (risposta === "passo") await premi(P, /Passo/);
    else { inp.value = risposta; await W.dorme(520); W.clicca(P, /Rispondi/, ".up-azione button"); }
    if (stella != null) {
      if (!await W.aspetta(function () { return /Quale indizio ti ha aiutato/.test(T(P)); }, 8000)) no("non c'è la stella");
      await W.dorme(300);
      var tt = carte(P).filter(function (c) { return c.classList.contains("tocca"); }); tocca(P, tt[stella]);
    }
    await premi(P, /^Avanti ▶/, 10000);
    return chi;
  }
  // ===================== up5: stesso telefono in 3, a punti =====================
  COPIONE.aggiungi("up5", { nome: "Una parola sola sullo stesso telefono in 3 (a punti): tre turni fino alla classifica", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca"], P = await locale({ stile: "punti", giri: 1, mazzi: ["facile"] }, nomi), note = [], mis = "";
    if (!await W.aspetta(function () { return /Tocca a Paky indovinare/.test(T(P)); }, 4000)) no("il primo turno non dice «Tocca a Paky indovinare»");
    if (!/due indizi a testa/.test(T(P))) no("in 3 non dice «due indizi a testa»");
    mis = await misura("Paky", 360, 640);
    // turno 1 (Paky indovina): quasi uguali PANE/PANINO, risposta giusta? Paky non sa la parola: la leggo dal telefono mentre scrive Giulia
    var parola = null;
    var obs = new P.MutationObserver(function () { var w = P.document.querySelector(".up-palco .up-parola"); if (w && /Scrivi DUE indizi/.test(T(P)) && /^[A-ZÀ-Ù]+$/.test(w.textContent)) parola = w.textContent; });
    obs.observe(P.document.body, { childList: true, subtree: true, characterData: true });
    await premi(P, /Si comincia a scrivere/);
    // scrivo a mano il turno 1 per controllare le schermate
    if (!await W.aspetta(function () { return /Passa il telefono a/.test(T(P)) && /Paky, non guardare!/.test(T(P)); }, 4000)) no("non c'è «🙈 Paky, non guardare!»");
    await premi(P, /^Sono Giulia/);
    if (!await W.aspetta(function () { return parola; }, 3000)) no("Giulia non vede la parola");
    if (P.document.querySelectorAll(".up-azione .up-input").length !== 2) no("Giulia non ha due campi");
    mis = mis || await misura("Paky", 360, 640) || await misura("Paky", 412, 915);
    var ins = P.document.querySelectorAll(".up-azione .up-input"); ins[0].value = "PANE"; ins[1].value = "CODA";
    await premi(P, /^Fatto ▶/);
    await premi(P, /^Sono Luca/);
    ins = P.document.querySelectorAll(".up-azione .up-input"); ins[0].value = "PANINO"; ins[1].value = "ZETA";
    await premi(P, /^Fatto ▶/);
    if (!await W.aspetta(function () { return /quasi uguali/.test(T(P)); }, 3000)) no("Luca non controlla i quasi uguali");
    var cs = carte(P); tocca(P, cs[0]); await W.dorme(100); tocca(P, cs[2]); await W.dorme(150);
    if (!carte(P)[0].classList.contains("canc") || !carte(P)[2].classList.contains("canc")) no("PANE/PANINO non si cancellano");
    mis = mis || await misura("Paky", 360, 640);
    await premi(P, /Fatto ▶/);
    if (!await W.aspetta(function () { return /Ora puoi guardare/.test(T(P)); }, 3000)) no("il telefono non torna a Paky");
    obs.disconnect();
    await premi(P, /^Sono Paky/);
    if (T(P).indexOf(parola) >= 0) no("Paky vede la parola prima di indovinare");
    var inp = await W.aspetta(function () { return P.document.querySelector(".up-azione .up-input"); }, 12000); if (!inp) no("Paky non ha il campo della risposta");
    var tc = testoCarte(P);
    if (tc.indexOf("CODA") < 0 || tc.indexOf("ZETA") < 0 || tc.indexOf("PANE") >= 0) no("Paky vede " + tc.join(","));
    mis = mis || await misura("Paky", 360, 640) || await misura("Paky", 412, 915);
    inp.value = parola.toLowerCase(); await W.dorme(520); W.clicca(P, /Rispondi/, ".up-azione button");
    if (!await W.aspetta(function () { return /Quale indizio ti ha aiutato/.test(T(P)); }, 8000)) no("non c'è la stella");
    await W.dorme(300);
    var tt = carte(P).filter(function (c) { return c.classList.contains("tocca"); }); tocca(P, tt[1]);
    if (!await W.aspetta(function () { return /ha indovinato/.test(T(P)); }, 4000)) no("non c'è l'esito");
    var chip = T(P);
    if (!/Paky 3/.test(chip) || !/Giulia 1/.test(chip) || !/Luca 3/.test(chip)) no("punti dopo il turno 1 (Paky 3, Giulia 1, Luca 1+2): «" + chip.replace(/\s+/g, " ").slice(-80) + "»");
    mis = mis || await misura("Paky", 360, 640);
    await premi(P, /^Avanti ▶/);
    note.push("t1: «Paky, non guardare!», 2 campi, PANE/PANINO, ⭐ a Luca");
    // turni 2 e 3 col giocatore automatico: Passo e sbagliata
    await turnoLocale(P, nomi, ["UNO", "DUE", "TRE", "QUATTRO"], "passo");
    await turnoLocale(P, nomi, ["ROSSO", "VERDE", "BLU", "GIALLO"], "SBAGLIATA");
    if (!await W.aspetta(function () { return P.document.querySelector(".classifica"); }, 6000)) no("dopo 3 turni non c'è la classifica («" + T(P).slice(0, 100) + "»)");
    var cl = [].map.call(P.document.querySelectorAll(".classifica li"), function (li) { return li.textContent.replace(/\s+/g, " "); }).join(" | ");
    if (!/Paky ?3/.test(cl) || !/Luca ?3/.test(cl) || !/Giulia ?1/.test(cl)) no("classifica: " + cl);
    if (mis) no("misure: " + mis);
    errori();
    return note.join(" · ") + " · Passo, sbagliata · classifica " + cl;
  } });
  // ===================== up6: stesso telefono, tutti insieme =====================
  COPIONE.aggiungi("up6", { nome: "Una parola sola sullo stesso telefono, 🤝 Tutti insieme: le sbagliate fanno perdere anche la parola dopo, fino a «… su 13»", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca"], P = await locale({ stile: "insieme", giri: 2, mazzi: ["facile"] }, nomi), turni = 0;
    if (!await W.aspetta(function () { return /Parola 1 di 13/.test(T(P)); }, 4000)) no("non dice «Parola 1 di 13»");
    while (turni < 9 && !/su 13/.test(T(P))) {
      turni++;
      await turnoLocale(P, nomi, ["UNO", "DUE", "TRE", "QUATTRO"], turni === 1 ? "passo" : "SBAGLIATA");
      await W.dorme(300);
      if (turni === 1 && !/Parola 2 di 13/.test(T(P))) no("dopo un Passo non si passa alla parola 2 («" + T(P).slice(0, 60) + "»)");
      if (turni === 2 && !/Parola 4 di 13/.test(T(P))) no("dopo una sbagliata non si salta la parola dopo («" + T(P).slice(0, 60) + "»)");
    }
    if (!await W.aspetta(function () { return /0 su 13/.test(T(P)); }, 5000)) no("alla fine non c'è «0 su 13» («" + T(P).slice(0, 100) + "»)");
    if (turni !== 7) no("con un Passo e tutte sbagliate i turni sono " + turni + " invece di 7");
    if (!/Ritentate/.test(T(P))) no("manca la frase di fine");
    await premi(P, /Fine partita/);
    if (!await W.aspetta(function () { return P.document.querySelector(".classifica"); }, 4000)) no("non c'è la classifica del core");
    errori();
    return turni + " turni (1 Passo + 6 sbagliate), «0 su 13 · Ritentate», classifica del core";
  } });
})();

// PROVE DELL'UNIONE (17 ott 2026): la ripresa del Passo 5 con le regole nuove del secondo giro (miglioramenti2).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("unione/ripresa-nuove.js"); await COPIONE.prova("un1")
//
// un1 Taboo «🧺 Tre round» + «🫳 Rubata» online in 4: l'host ricarica tra un turno e l'altro (stesso round, stesse carte del
//     round, la Rubata resta accesa), a metà turno (il turno si rifà da capo coi punti e le carte del round di inizio turno),
//     nel cambio di round (si resta lì: stesso round nuovo, stesso «poi continua») e prima del turno che continua nel round
//     dopo (resta «continui tu» col tempo che restava).
// un2 Sì… però «🙋 Ognuno per sé» online in 4 (Paky giudice o no, 3 che presentano): l'host ricarica mentre si giocano i
//     Bonus (stesso passo, chi ha già giocato resta fatto, le mani tornano a chi deve giocare), allo svelamento (stesso
//     scenario), al verdetto e sull'esito (stesso vincitore, stessi punti).
// Ogni volta: stesso codice, la foto dice che la partita riprende (_r), gli amici non passano dalla saletta e leggono
// «🔁 Paky è tornato: la partita riprende da dove era», l'host «🔁 Partita ripresa!», nessun errore.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no, pill = A.pill, contaDentro = A.contaDentro;
  var GIOCHI = ["taboo", "sipero"];
  function vm(C) { return W.vmDi(C) || {}; }

  // ---- la spia (solo con apriTel(nome, { spiaUn: true })): w.__imp = regole per la prova (solo l'host le legge) ----
  if (!W.__prepUn) {
    W.__prepUn = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepUn(w, nome, opz);
      if (!opz || !opz.spiaUn) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && GIOCHI.indexOf(g.id) >= 0 && !g.__spiaUn) {
            g.__spiaUn = true; var av = g.avvia;
            g.avvia = function (t) {
              if (w.__imp && t.impostazioni && !t.linkParams.stanza) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
              return av.apply(this, arguments);
            };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }

  function N() { var l = []; l.nota = function (x) { l.push(x); }; return l; }
  function nomeDi(v, id) { var p = ((v.giocatori || []).filter(function (x) { return x.id === id; }))[0]; return p ? p.nome : null; }
  function punti(v) { return (v.giocatori || []).map(function (p) { return p.nome + ":" + (p.punti != null ? p.punti : "?"); }).join(",") + (v.punti && v.punti.length === 2 ? " [" + v.punti.join("-") + "]" : ""); }
  function stessiPunti(a, b) { return punti(a) === punti(b) ? true : "punti cambiati: " + punti(a) + " → " + punti(b); }
  function sentinella(nomi) {
    var visti = [];
    var t = setInterval(function () { nomi.forEach(function (n) { var w = W.finestra(n); if (!w || !w.document || !w.document.body) return; var m = W.testo(w).match(/Problema di collegamento|Collegamento perso|Ops|La stanza è chiusa|non risponde|è ferma|stata chiusa/); if (m && visti.indexOf(n + ": " + m[0]) < 0) visti.push(n + ": " + m[0]); }); }, 80);
    return { stop: function () { clearInterval(t); return visti; } };
  }
  // un tocco vero (pointerdown + pointerup) sul primo tasto attivo con quel testo
  function tocca(w, re) {
    if (!w) return false;
    var b = [].filter.call(w.document.querySelectorAll("button"), function (x) { return re.test(x.textContent) && !x.disabled; })[0];
    if (!b) return false;
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tp) { b.dispatchEvent(new Ev(tp, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    return true;
  }
  async function stanza(nomeTessera, gid, imp, amici) {
    W.__partite = {};
    var P = await W.apriTel("Paky", { x: 0, spiaUn: true, prima: function (w) { w.__imp = imp || null; A.contaPartite("Paky")(w); } });
    var C = await W.apriStanza(P, nomeTessera);
    for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], { hash: "gioco=" + gid + "&stanza=" + C, x: 185 * (i + 1), spiaUn: true, prima: A.contaPartite(amici[i]) });
    if (!await W.aspetta(function () { return contaDentro(vm(C)) === amici.length + 1; }, 10000)) no("nella saletta non ci sono in " + (amici.length + 1));
    return { P: P, C: C };
  }
  async function finche(C, fino, passo, ms, perche) {
    var t = Date.now() + (ms || 60000);
    while (Date.now() < t) {
      var v = vm(C);
      if (fino(v)) return v;
      try { if (passo) await passo(v); } catch (e) { if (/^NO:/.test(e.message)) throw e; }
      await W.dorme(300);
    }
    no((perche || "non si arriva al punto della prova") + " (fase " + vm(C).fase + ")");
  }
  // L'HOST RICARICA e la partita riprende (come in passo5/g3.js)
  async function ricaricaHost(C, amici, o) {
    o = o || {};
    await W.aspetta(function () { return amici.every(function (n) { return !/tornato/.test(pill(W.finestra(n))); }) && !/ripresa/i.test(pill(W.finestra("Paky"))); }, 6000);
    await W.dorme(o.salva || 900);
    var prima = JSON.parse(JSON.stringify(vm(C))), sPrima = (W.statoStanza(C) || {})._s, t0 = Date.now();
    await W.ricarica("Paky");
    var pillAmici = {}, pillHost = "", saletta = {}, perche = "";
    var ok = await W.aspetta(function () {
      amici.forEach(function (n) {
        var f = W.finestra(n); if (!f) return;
        var p = pill(f); if (/tornato/.test(p)) pillAmici[n] = p;
        if (f.document.querySelector(".saletta-schermo")) saletta[n] = 1;
      });
      var ph = pill(W.finestra("Paky")); if (/ripresa/i.test(ph)) pillHost = ph;
      var s = W.statoStanza(C) || {}, v = vm(C);
      if (!s._s || s._s === sPrima) { perche = "nessuna foto nuova dell'host"; return false; }
      if (!s._r) { perche = "la foto nuova non dice che la partita riprende (_r)"; return false; }
      if (!v.fase || v.fase === "lobby") { perche = "la partita è tornata in saletta"; return false; }
      if (contaDentro(v) < amici.length + 1) { perche = "non sono tutti di nuovo dentro (" + contaDentro(v) + ")"; return false; }
      var c = o.controlla ? o.controlla(prima, v) : true;
      if (c !== true) { perche = typeof c === "string" ? c : "la partita non è quella di prima"; return false; }
      if (!amici.every(function (n) { return pillAmici[n]; })) { perche = "non tutti gli amici leggono «è tornato»"; return false; }
      if (!pillHost) { perche = "l'host non legge «🔁 Partita ripresa!»"; return false; }
      return true;
    }, o.attesa || 12000);
    if (!ok) no("ricarica dell'host in " + prima.fase + ": " + perche + " (fase " + vm(C).fase + ")");
    var ns = Object.keys(saletta); if (ns.length) no("ricarica dell'host in " + prima.fase + ": " + ns.join(", ") + " è passato dalla saletta");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return { prima: prima, dopo: JSON.parse(JSON.stringify(vm(C))), dt: ((Date.now() - t0) / 1000).toFixed(1) };
  }

  // =====================================================================
  //  un1 TABOO: tre round + rubata
  // =====================================================================
  function treDi(v) { return v.tre ? "round " + v.tre.n + ", " + v.tre.carte + " carte, " + JSON.stringify(v.tre.punti) : "niente tre round"; }
  COPIONE.aggiungi("un1", { nome: "Taboo «🧺 Tre round» + «🫳 Rubata»: l'host ricarica tra i turni, a metà turno, nel cambio di round e prima del turno che continua", fai: async function () {
    var L = N(), amici = ["Giulia", "Luca", "Sara"], nomi = ["Paky"].concat(amici), sent = sentinella(nomi);
    var X = await stanza("Taboo", "taboo", { tempo: 60, giri: 1, carte: 1, partita: "tre", mazzo: 20, rubata: 1 }, amici), C = X.C;
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    await finche(C, function (v) { return v.fase === "pronto" && v.attivo; }, null, 10000, "non comincia");
    if (!vm(C).tre || vm(C).tre.n !== 1 || !vm(C).rubataOn) no("la partita non è a tre round con la Rubata (" + treDi(vm(C)) + ", rubata " + vm(C).rubataOn + ")");
    // 1) tra un turno e l'altro
    var r = await ricaricaHost(C, amici, { controlla: function (a, b) {
      if (b.fase !== "pronto" || b.attivo !== a.attivo) return "fase " + b.fase + " / chi spiega " + b.attivo;
      if (treDi(a) !== treDi(b)) return "tre round: " + treDi(a) + " → " + treDi(b);
      return b.rubataOn ? stessiPunti(a, b) : "la Rubata si è spenta";
    } });
    L.nota("pronto → stesso round (" + treDi(r.dopo) + ", " + r.dt + " s)");
    // 2) a metà turno: due carte indovinate, poi ricarica → turno da capo con le carte del round di inizio turno
    var chi = nomeDi(vm(C), vm(C).attivo), wChi = W.finestra(chi), puntiPrima = vm(C).punti.slice(), trePrima = treDi(vm(C));
    if (!await W.aspetta(function () { return tocca(wChi, /Pronti, via/); }, 5000)) no(chi + " non ha «Pronti, via!»");
    await finche(C, function (v) { return v.fase === "turno" && v.carta; }, null, 6000, "il turno non parte");
    await W.dorme(600);
    for (var k = 0; k < 2; k++) {
      var c0 = vm(C).chiaveCarta;
      if (!tocca(wChi, /Indovinata/)) no(chi + " non ha «✅ Indovinata»");
      await finche(C, function (v) { return v.chiaveCarta !== c0; }, null, 4000, "la carta indovinata non conta");
      await W.dorme(450);
    }
    if (vm(C).tre.carte !== 18) no("dopo 2 carte indovinate nel round ne restano " + vm(C).tre.carte + " (dovevano essere 18)");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) {
      if (b.fase !== "pronto") return "fase " + b.fase + " (il turno non si rifà da capo)";
      if (b.attivo !== a.attivo) return "chi spiega è cambiato";
      if (b.punti.join("-") !== puntiPrima.join("-")) return "punti " + puntiPrima.join("-") + " → " + b.punti.join("-");
      if (treDi(b) !== trePrima) return "tre round: " + trePrima + " → " + treDi(b) + " (il mazzo del round non è quello di inizio turno)";
      return b.rifatto ? true : "la foto non dice che il turno si rifà";
    } });
    L.nota("turno a metà → da capo (" + treDi(r.dopo) + ", " + r.dt + " s)");
    // 3) il turno rifatto: tutte le carte del round indovinate → cambio di round a metà turno («poi continua»)
    wChi = W.finestra(chi);
    if (!await W.aspetta(function () { return tocca(wChi, /Pronti, via/); }, 5000)) no(chi + " non ha di nuovo «Pronti, via!»");
    await finche(C, function (v) { return v.fase === "turno" && v.carta; }, null, 6000, "il turno rifatto non parte");
    await W.dorme(600);
    await finche(C, function (v) { return v.fase !== "turno"; }, async function (v) {
      if (v.fase !== "turno" || !v.carta) return;
      var c1 = v.chiaveCarta; if (!tocca(wChi, /Indovinata/)) return;
      await W.aspetta(function () { return vm(C).chiaveCarta !== c1 || vm(C).fase !== "turno"; }, 3000);
      await W.dorme(430);
    }, 45000, "il round 1 non finisce indovinando tutte le carte");
    var vR = await finche(C, function (v) { return v.fase === "round" && v.inter; }, null, 4000, "finite le carte non si passa al round 2");
    if (vR.inter.n !== 2 || vR.inter.chi !== vm(C).inter.chi || !vR.inter.chi) no("il cambio di round: " + JSON.stringify(vR.inter));
    r = await ricaricaHost(C, amici, { controlla: function (a, b) {
      if (b.fase !== "round" || !b.inter) return "fase " + b.fase + " (il cambio di round non resta)";
      if (b.inter.n !== a.inter.n || b.inter.chi !== a.inter.chi) return "cambio di round: " + JSON.stringify(a.inter) + " → " + JSON.stringify(b.inter);
      if (treDi(a) !== treDi(b)) return "tre round: " + treDi(a) + " → " + treDi(b);
      return b.restano >= 5000 ? stessiPunti(a, b) : "il conto del cambio di round è " + b.restano + " ms";
    } });
    L.nota("cambio di round → resta (round " + r.dopo.inter.n + ", " + Math.round(r.dopo.restano / 1000) + " s, " + r.dt + " s)");
    // 4) «⏩ Avanti» di tutti → si torna a «Pronti?» con il turno che continua; l'host ricarica → resta «continui tu»
    await finche(C, function (v) { return v.fase === "pronto"; }, function () { nomi.forEach(function (n) { tocca(W.finestra(n), /Avanti/); }); }, 20000, "«⏩ Avanti» di tutti non fa ripartire");
    var vP = vm(C);
    if (!(vP.ripresa > 3000) || nomeDi(vP, vP.attivo) !== chi) no("dopo il cambio di round non continua " + chi + " col tempo che restava (" + nomeDi(vP, vP.attivo) + ", " + vP.ripresa + " ms)");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) {
      if (b.fase !== "pronto" || b.attivo !== a.attivo) return "fase " + b.fase + " / chi spiega " + nomeDi(b, b.attivo);
      if (!(b.ripresa > 3000) || Math.abs(b.ripresa - a.ripresa) > 1500) return "il tempo che restava: " + a.ripresa + " → " + b.ripresa + " ms";
      return treDi(a) === treDi(b) ? stessiPunti(a, b) : "tre round: " + treDi(a) + " → " + treDi(b);
    } });
    L.nota("turno che continua → resta a " + chi + " con " + Math.round(r.dopo.ripresa / 1000) + " s (" + r.dt + " s)");
    wChi = W.finestra(chi);
    if (!await W.aspetta(function () { return tocca(wChi, /Pronti, via/); }, 5000)) no(chi + " non ha «Pronti, via!» per continuare");
    var vT = await finche(C, function (v) { return v.fase === "turno" && v.carta; }, null, 6000, "il turno che continua non parte");
    if (vT.restano > r.dopo.ripresa + 1500) no("il turno che continua ha " + vT.restano + " ms invece di quelli che restavano (" + r.dopo.ripresa + ")");
    if (vT.tre.n !== 2) no("il turno che continua non è nel round 2 (" + treDi(vT) + ")");
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    return L.join(" · ");
  } });

  // =====================================================================
  //  un2 SÌ… PERÒ: ognuno per sé
  // =====================================================================
  function carteDi(w) { return [].slice.call(w.document.querySelectorAll(".sp-carta[role=button]")); }
  async function gioca(w, n) {
    var cc = await W.aspetta(function () { var x = carteDi(w); return x.length ? x : null; }, 6000);
    if (!cc) no("niente carte da toccare («" + T(w).slice(0, 100) + "»)");
    var Ev = w.PointerEvent || w.MouseEvent;
    for (var i = 0; i < cc.length && w.document.querySelectorAll(".sp-carta.su").length < n; i++) if (!cc[i].classList.contains("su")) {
      ["pointerdown", "pointerup"].forEach(function (tp) { cc[i].dispatchEvent(new Ev(tp, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
      cc[i].click();
    }
    var b = [].filter.call(w.document.querySelectorAll("button"), function (x) { return /^Gioca ▶|^Conferma ▶/.test(x.textContent); })[0];
    if (!b || b.disabled) no("il tasto per giocare non c'è o è spento («" + T(w).slice(0, 100) + "»)");
    b.click();
  }
  function soloDi(v) { return [v.fase, v.passoS, JSON.stringify(v.pres), JSON.stringify(v.fatti), v.mostra, JSON.stringify(v.schede)].join(" | "); }
  COPIONE.aggiungi("un2", { nome: "Sì… però «🙋 Ognuno per sé»: l'host ricarica nei Bonus, allo svelamento, al verdetto e sull'esito", fai: async function () {
    var L = N(), amici = ["Giulia", "Luca", "Sara"], nomi = ["Paky"].concat(amici), sent = sentinella(nomi);
    var X = await stanza("Sì... però", "sipero", { giri: 1, arringa: 0, si: "solo", bianca: 0 }, amici), C = X.C;
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    var v = await finche(C, function (x) { return x.fase === "gioco" && x.passoS === "bonus" && x.pres && x.pres.length; }, null, 10000, "non si arriva ai Bonus di «Ognuno per sé»");
    if (!v.solo) no("la partita non è «Ognuno per sé»");
    // 1) nei Bonus: il primo che presenta gioca, poi l'host ricarica
    var primo = nomeDi(v, v.pres[0]), idPrimo = v.pres[0];
    await gioca(W.finestra(primo), 2);
    await finche(C, function (x) { return (x.fatti || []).indexOf(idPrimo) >= 0; }, null, 5000, "i Bonus di " + primo + " non arrivano");
    var r = await ricaricaHost(C, amici, { controlla: function (a, b) {
      if (!b.solo) return "non è più «Ognuno per sé»";
      if (soloDi(a) !== soloDi(b)) return "il round è cambiato: " + soloDi(a) + " → " + soloDi(b);
      return b.resta >= 8 ? stessiPunti(a, b) : "il tempo per giocare è " + b.resta + " s";
    } });
    // le mani tornano a chi deve ancora giocare
    var altri = r.dopo.pres.filter(function (id) { return id !== idPrimo; }).map(function (id) { return nomeDi(r.dopo, id); });
    for (var i = 0; i < altri.length; i++) {
      var n = altri[i];
      if (!await W.aspetta(function () { return carteDi(W.finestra(n)).length > 0; }, 8000)) no(n + " non ritrova la sua mano dopo la ripresa");
    }
    L.nota("Bonus → stesso passo, " + primo + " ha già giocato, le mani tornano a " + altri.join(" e ") + " (" + r.dt + " s)");
    // gli altri Bonus e tutti i Malus
    for (i = 0; i < altri.length; i++) await gioca(W.finestra(altri[i]), 2);
    v = await finche(C, function (x) { return x.fase === "gioco" && x.passoS === "malus"; }, null, 8000, "non si arriva ai Malus");
    for (i = 0; i < v.pres.length; i++) await gioca(W.finestra(nomeDi(v, v.pres[i])), 1);
    v = await finche(C, function (x) { return x.fase === "arringa"; }, null, 8000, "dopo i Malus non si svelano gli scenari");
    // 2) allo svelamento: il giudice va al secondo scenario, poi ricarica
    var g = nomeDi(v, v.giudiceId), wg = W.finestra(g);
    if (!await W.aspetta(function () { return W.clicca(wg, /Prossimo scenario/); }, 5000)) no("il giudice " + g + " non ha «Prossimo scenario»");
    await finche(C, function (x) { return x.fase === "arringa" && x.mostra === 1; }, null, 4000, "il secondo scenario non si svela");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return soloDi(a) !== soloDi(b) ? "lo svelamento è cambiato: " + soloDi(a) + " → " + soloDi(b) : true; } });
    L.nota("svelamento → stesso scenario (" + (r.dopo.mostra + 1) + "° di " + r.dopo.pres.length + ", " + r.dt + " s)");
    // 3) al verdetto
    wg = W.finestra(g);
    await finche(C, function (x) { return x.fase === "giudizio"; }, function () { W.clicca(W.finestra(g), /Prossimo scenario|Al verdetto/); }, 15000, "non si arriva al verdetto");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "giudizio" ? "fase " + b.fase : soloDi(a) !== soloDi(b) ? "il tavolo è cambiato" : b.resta >= 8 ? stessiPunti(a, b) : "il giudice ha " + b.resta + " s"; } });
    L.nota("verdetto → verdetto (" + r.dt + " s)");
    // 4) il giudice sceglie il secondo che presenta → esito, poi ricarica
    var scelto = r.dopo.pres[1];
    wg = W.finestra(g);
    var tab = await W.aspetta(function () { return wg.document.querySelector(".sp-tab button[data-id='" + scelto + "']"); }, 5000);
    if (!tab) no("il giudice non ha la linguetta di " + nomeDi(r.dopo, scelto));
    tab.click();
    await W.dorme(200);
    var bs = [].filter.call(wg.document.querySelectorAll("button"), function (x) { return /Scelgo/.test(x.textContent) && !x.disabled; })[0];
    if (!bs) no("il giudice non ha «Scelgo …» («" + T(wg).slice(0, 100) + "»)");
    bs.click();
    v = await finche(C, function (x) { return x.fase === "esito"; }, null, 8000, "il verdetto del giudice non arriva");
    if (v.vincitore !== scelto) no("ha vinto " + nomeDi(v, v.vincitore) + " invece di " + nomeDi(v, scelto));
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "esito" ? "fase " + b.fase : b.vincitore !== a.vincitore ? "ha vinto un altro" : stessiPunti(a, b); } });
    if (!(r.dopo.resta >= 5)) no("sull'esito dopo la ripresa non c'è il conto per andare avanti (" + r.dopo.resta + ")");
    L.nota("esito → esito, vince " + nomeDi(r.dopo, r.dopo.vincitore) + " (" + punti(r.dopo) + ", " + r.dt + " s)");
    // e si va avanti da soli (o con «⏩ Avanti»)
    await finche(C, function (x) { return x.fase !== "esito"; }, function () { nomi.forEach(function (n) { W.clicca(W.finestra(n), /Avanti/); }); }, 30000, "dopo l'esito ripreso non si va avanti");
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    return L.join(" · ");
  } });
})();

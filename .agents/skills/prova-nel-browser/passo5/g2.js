// PROVE DEL PASSO 5, pezzo p5-g2: la partita riprende quando l'host ricarica, nei cinque giochi del progetto
// (Linea del tempo, Scalinata, Balla Colossale, Nomi Cose e Città, Scarabocchio).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("passo5/g2.js"); await COPIONE.prova(540)
//
// 540 Linea del tempo, 541 Scalinata, 542 Balla, 543 Nomi Cose Città, 544 Scarabocchio: in una partita sola l'host ricarica
//     IN OGNI FASE: in saletta (→ saletta, come prima), a metà turno/scrittura, al voto, sul risultato, sulla classifica finale.
//     Ogni volta: stesso codice, la foto nuova dice che la partita riprende (_r), gli amici non passano dalla saletta e leggono
//     «🔁 Paky è tornato: la partita riprende da dove era», l'host «🔁 Partita ripresa!», stessi punti, la stessa fase (o
//     quella dopo), nessun errore; sulla classifica finale niente partita (XP) data di nuovo né "__esito" doppio.
// 545 Linea del tempo: la vecchia chiave "sg-tl-host" (il salvataggio fatto in casa di prima) sparisce e la ripresa funziona.
// 546 Scalinata: un amico ha il telefono spento mentre l'host ricarica → per lui sceglie il bot, poi riacceso rientra.
// Le regole si accorciano per la prova con w.__imp (solo l'host le legge): apriTel(nome, { spiaG2: true, prima: … }).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no, pill = A.pill, mioId = A.mioId, contaDentro = A.contaDentro;
  var GIOCHI = ["timeline", "scalinata", "balla", "nomicose", "scarabocchio"];
  function vm(C) { return W.vmDi(C) || {}; }

  // ---- la spia (solo con apriTel(nome, { spiaG2: true })): w.__imp = regole per la prova, w.__cbH[gid] = la stanza
  //      dell'host (per mandare le sue mosse senza toccare lo schermo) ----
  if (!W.__prepG2) {
    W.__prepG2 = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepG2(w, nome, opz);
      if (!opz || !opz.spiaG2) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && GIOCHI.indexOf(g.id) >= 0 && !g.__spiaG2) {
            g.__spiaG2 = true; var av = g.avvia;
            g.avvia = function (t) {
              if (w.__imp && t.impostazioni) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
              w.__t = t;
              if (!w.__cbH) {
                w.__cbH = {};
                var osp = w.SGNet.ospita;
                w.SGNet.ospita = function (gid, cb) { w.__cbH[gid] = cb; return osp.apply(this, arguments); };
              }
              return av.apply(this, arguments);
            };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }

  // ---- aiuti ----
  function N() { var l = []; l.nota = function (x) { l.push(x); }; return l; }
  function punti(v) { return ((v.giocatori || v.players || v.posti) || []).map(function (p) { return p.nome + ":" + (p.punti != null ? p.punti : p.passi); }).join(","); }
  function sentinella(nomi) {
    var visti = [];
    var t = setInterval(function () { nomi.forEach(function (n) { var w = W.finestra(n); if (!w || !w.document || !w.document.body) return; var m = W.testo(w).match(/Problema di collegamento|Collegamento perso|Ops|La stanza è chiusa|non risponde|è ferma/); if (m && visti.indexOf(n + ": " + m[0]) < 0) visti.push(n + ": " + m[0]); }); }, 80);
    return { stop: function () { clearInterval(t); return visti; } };
  }
  // apre la stanza col percorso di prima e fa entrare gli amici; tutti col contatore delle partite date (XP)
  async function stanza(nomeTessera, gid, imp, amici, opzAmici) {
    W.__partite = {};
    var P = await W.apriTel("Paky", { x: 0, spiaG2: true, prima: function (w) { w.__imp = imp || null; A.contaPartite("Paky")(w); } });
    var C = await W.apriStanza(P, nomeTessera);
    for (var i = 0; i < amici.length; i++) {
      var n = amici[i];
      await W.apriTel(n, Object.assign({ hash: "gioco=" + gid + "&stanza=" + C, x: 185 * (i + 1), spiaG2: true, prima: A.contaPartite(n) }, (opzAmici || {})[n] || {}));
    }
    if (!await W.aspetta(function () { return contaDentro(vm(C)) === amici.length + 1; }, 10000)) no("nella saletta non ci sono in " + (amici.length + 1) + " (" + punti(vm(C)) + ")");
    return { P: P, C: C };
  }
  function cbHost() { var w = W.finestra("Paky"); return w && w.__cbH; }
  // gira finché fino(vm) è vero, facendo passo(vm) ogni 300 ms
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
  // L'HOST RICARICA e la partita riprende: o = { controlla(prima, dopo): true o il perché, lobby: true (in saletta: si torna
  // in saletta), assenti: ["Giulia"] (amici spenti: non rientrano né leggono la pillola), attesa }.
  // Restituisce { prima, dopo, dt }
  async function ricaricaHost(C, amici, o) {
    o = o || {};
    var presenti = amici.filter(function (n) { return (o.assenti || []).indexOf(n) < 0; });
    // (le pillole della ricarica di prima se ne vanno da sole in 3,5 s)
    await W.aspetta(function () { return presenti.every(function (n) { return !/tornato/.test(pill(W.finestra(n))); }) && !/ripresa/i.test(pill(W.finestra("Paky"))); }, 6000);
    await W.dorme(o.salva || 900);   // (la ripresa si salva al massimo ogni mezzo secondo)
    var prima = JSON.parse(JSON.stringify(vm(C))), sPrima = (W.statoStanza(C) || {})._s, t0 = Date.now();
    await W.ricarica("Paky");
    var pillAmici = {}, pillHost = "", saletta = {}, perche = "";
    var ok = await W.aspetta(function () {
      presenti.forEach(function (n) {
        var f = W.finestra(n); if (!f) return;
        var p = pill(f); if (/tornato/.test(p)) pillAmici[n] = p;
        if (!o.lobby && f.document.querySelector(".saletta-schermo")) saletta[n] = 1;
      });
      var ph = pill(W.finestra("Paky")); if (/ripresa/i.test(ph)) pillHost = ph;
      var s = W.statoStanza(C) || {}, v = vm(C);
      if (!s._s || s._s === sPrima) { perche = "nessuna foto nuova dell'host sul codice " + C; return false; }
      if (o.lobby) {
        if (v.fase !== "lobby") { perche = "dalla saletta la stanza riapre in fase " + v.fase; return false; }
        if (s._r) { perche = "dalla saletta la foto dice _r"; return false; }
        if (contaDentro(v) < presenti.length + 1) { perche = "in saletta non sono tutti di nuovo dentro (" + contaDentro(v) + ")"; return false; }
        return true;
      }
      if (!s._r) { perche = "la foto nuova non dice che la partita riprende (_r)"; return false; }
      if (!v.fase || v.fase === "lobby") { perche = "la partita è tornata in saletta"; return false; }
      if (contaDentro(v) < presenti.length + 1) { perche = "non sono tutti di nuovo dentro (" + contaDentro(v) + ")"; return false; }
      var c = o.controlla ? o.controlla(prima, v) : true;
      if (c !== true) { perche = typeof c === "string" ? c : "la partita non è quella di prima"; return false; }
      if (!presenti.every(function (n) { return pillAmici[n]; })) { perche = "non tutti gli amici leggono la pillola «è tornato»"; return false; }
      if (!pillHost) { perche = "l'host non legge «🔁 Partita ripresa!»"; return false; }
      return true;
    }, o.attesa || 12000);
    if (!ok) no("ricarica dell'host in " + prima.fase + ": " + perche + " (fase " + vm(C).fase + ")");
    var ns = Object.keys(saletta); if (ns.length) no("ricarica dell'host in " + prima.fase + ": " + ns.join(", ") + " è passato dalla saletta");
    if (!o.lobby) presenti.forEach(function (n) { if (!/riprende da dove era/.test(pillAmici[n])) no(n + " legge «" + pillAmici[n] + "» invece di «… la partita riprende da dove era»"); });
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return { prima: prima, dopo: JSON.parse(JSON.stringify(vm(C))), dt: ((Date.now() - t0) / 1000).toFixed(1) };
  }
  // sulla classifica finale: niente partita (XP) data di nuovo, un solo "__esito"
  async function fineSenzaDoppi(C, nomi, nE) {
    await W.dorme(2500);
    nomi.forEach(function (n) { if ((W.__partite || {})[n] !== 1) no("partite date dopo la ricarica sulla classifica: " + JSON.stringify(W.__partite)); });
    var e = A.contaStoria(C, '"__esito"'); if (e !== nE) no("dopo la ricarica sulla classifica gli __esito sono " + e + " (prima " + nE + ")");
  }
  function stessiPunti(a, b) { return punti(a) === punti(b) ? true : "punti cambiati: " + punti(a) + " → " + punti(b); }

  // =====================================================================
  //  540 LINEA DEL TEMPO
  // =====================================================================
  function passoTl(C, amici, fatto) {
    return function (v) {
      var Pw = W.finestra("Paky"), k = v.fase + "|" + v.n;
      if (v.fase === "turno") {
        if (v.turnoId === "host") { var s = Pw.document.querySelector(".tl-slot"); if (s) { s.click(); var cf = Pw.document.querySelector(".tl-conferma"); if (cf && !cf.disabled) cf.click(); } }
        else amici.forEach(function (n) { if (mioId(n) === v.turnoId && !fatto[k + n]) { var h = W.reteDi(n); if (h) { h.invia({ t: "scelta", gap: 0, n: v.n }); fatto[k + n] = 1; } } });
      } else if (v.fase === "votazione") {
        amici.forEach(function (n) { if (mioId(n) !== v.turnoId && !fatto[k + n]) { var h = W.reteDi(n); if (h) { h.invia({ t: "voto", d: true, n: v.n }); fatto[k + n] = 1; } } });
        if (v.turnoId !== "host") W.clicca(Pw, /Giusto/);
      } else if (v.fase === "esito") W.clicca(Pw, /Avanti/);
    };
  }
  function lineaTl(v) { return (v.linea || []).length; }
  COPIONE.aggiungi(540, { nome: "Linea del tempo: l'host ricarica in saletta, a metà turno, al voto, sul risultato e sulla classifica", fai: async function () {
    var L = N(), amici = ["Giulia", "Luca"], sent = sentinella(["Paky"].concat(amici));
    var X = await stanza("La linea del tempo", "timeline", { carte: 2 }, amici), C = X.C, fatto = {};
    // in saletta: si torna in saletta, come prima
    var r = await ricaricaHost(C, amici, { lobby: true }); L.nota("saletta → saletta (" + r.dt + " s)");
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    // a metà turno: lo stesso turno rifatto da capo, stessi punti e stessa linea
    await finche(C, function (v) { return v.fase === "turno"; }, null, 30000, "il primo turno non arriva");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return lineaTl(a) === lineaTl(b) ? stessiPunti(a, b) : "la linea aveva " + lineaTl(a) + " carte e ora " + lineaTl(b); } });
    var t0 = r.prima.turnoId;
    var v1 = await finche(C, function (v) { return v.fase === "turno"; }, null, 12000, "dopo la ripresa il turno non riparte");
    if (v1.turnoId !== t0) no("dopo la ripresa a metà turno tocca a " + v1.turnoId + " invece di " + t0);
    L.nota("turno → ripresa e stesso turno (" + r.dt + " s)");
    // al voto: stessi punti, il turno si rifà con la stessa carta
    await finche(C, function (v) { return v.fase === "votazione"; }, passoTl(C, amici, fatto), 20000, "niente votazione");
    r = await ricaricaHost(C, amici, { controlla: stessiPunti });
    v1 = await finche(C, function (v) { return v.fase === "turno"; }, null, 12000, "dopo la ripresa al voto il turno non riparte");
    if (v1.turnoId !== r.prima.turnoId) no("dopo la ripresa al voto tocca a " + v1.turnoId + " invece di " + r.prima.turnoId);
    L.nota("voto → stesso turno da capo (" + r.dt + " s)");
    // sul risultato: stessi punti (già contati), poi il turno dopo
    await finche(C, function (v) { return v.fase === "esito"; }, function (v) { if (v.fase !== "esito") return passoTl(C, amici, fatto)(v); }, 25000, "niente risultato");
    r = await ricaricaHost(C, amici, { controlla: stessiPunti });
    v1 = await finche(C, function (v) { return v.fase === "turno" || v.fase === "fine"; }, null, 12000, "dopo la ripresa sul risultato non si va avanti");
    if (v1.fase === "turno" && v1.n === r.prima.n) no("dopo la ripresa sul risultato si rifà lo stesso turno");
    L.nota("risultato → turno dopo (" + r.dt + " s)");
    // fino alla classifica finale, poi l'host ricarica lì
    await finche(C, function (v) { return v.fase === "fine"; }, passoTl(C, amici, fatto), 150000, "la partita non finisce");
    await W.dorme(1500);
    var nE = A.contaStoria(C, '"__esito"');
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "fine" ? "fase " + b.fase : JSON.stringify(a.classifica) === JSON.stringify(b.classifica) ? true : "classifica cambiata"; } });
    if (!await W.aspetta(function () { return /Classifica finale/.test(W.testo(W.finestra("Paky"))); }, 25000)) no("l'host ricaricato non vede la classifica finale («" + T(W.finestra("Paky")).slice(0, 80) + "»)");
    await fineSenzaDoppi(C, ["Paky"].concat(amici), nE);
    L.nota("classifica → classifica, niente XP doppi (" + r.dt + " s)");
    // si rigioca: «Nuova partita» porta tutti in saletta
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Rivincita|Nuova partita|Rigioca/); }, 5000)) no("sulla classifica ripresa non c'è la Rivincita");
    if (!await W.aspetta(function () { return vm(C).fase === "lobby" || vm(C).fase === "apertura" || vm(C).fase === "turno"; }, 15000)) no("la rivincita non parte (fase " + vm(C).fase + ")");
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    return L.join(" · ");
  } });

  // =====================================================================
  //  541 SCALINATA
  // =====================================================================
  function sceglieScala(nomi) { nomi.forEach(function (n) { var w = W.finestra(n); if (w) W.clicca(w, new RegExp("^\\s*" + [1, 3, 5][Math.floor(Math.random() * 3)] + "\\s*gradin")); }); }
  function passi(v) { return (v.posti || []).map(function (p) { return p.nome + ":" + p.passi; }).join(","); }
  COPIONE.aggiungi(541, { nome: "Scalinata: l'host ricarica in saletta, a metà round, sul risultato e sul podio", fai: async function () {
    var L = N(), amici = ["Giulia", "Luca"], sent = sentinella(["Paky"].concat(amici));
    var X = await stanza("La Scalinata", "scalinata", null, amici), C = X.C;
    var r = await ricaricaHost(C, amici, { lobby: true }); L.nota("saletta → saletta (" + r.dt + " s)");
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    await finche(C, function (v) { return v.fase === "scelta"; }, null, 10000, "non comincia");
    // a metà round (Giulia ha già scelto): il round si rifà con gli stessi gradini, «Partita ripresa»
    sceglieScala(["Giulia"]);
    await W.aspetta(function () { return (vm(C).posti || []).some(function (p) { return p.nome === "Giulia" && p.chosen; }); }, 3000);
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return passi(a) !== passi(b) ? "gradini cambiati: " + passi(a) + " → " + passi(b) : b.nRound !== a.nRound ? "round " + a.nRound + " → " + b.nRound : true; } });
    if (vm(C).ripresa !== r.prima.nRound) no("la foto non dice in che round è ripresa (" + vm(C).ripresa + ")");
    if (!await W.aspetta(function () { return /Partita ripresa/.test(T(W.finestra("Giulia"))); }, 5000)) no("Giulia non legge «🔁 Partita ripresa: si continua da qui!»");
    L.nota("round a metà → stesso round da capo (" + r.dt + " s)");
    // sul risultato del round: poi il round dopo
    await finche(C, function (v) { return v.fase === "rivela" && !(v.vincitori || []).length; }, function (v) { if (v.fase === "scelta") sceglieScala(["Paky"].concat(amici)); }, 30000, "niente risultato del round");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return passi(a) === passi(b) ? true : "gradini cambiati: " + passi(a) + " → " + passi(b); } });
    var v1 = await finche(C, function (v) { return (v.fase === "scelta" && v.nRound === r.prima.nRound + 1) || v.fase === "fine"; }, null, 10000, "dopo la ripresa sul risultato non arriva il round dopo");
    L.nota("risultato → round " + v1.nRound + " (" + r.dt + " s)");
    // fino al podio, poi l'host ricarica lì
    await finche(C, function (v) { return v.fase === "fine"; }, function (v) {
      if (v.fase === "scelta") sceglieScala(["Paky"].concat(amici));
      if (v.fase === "rivela") W.clicca(W.finestra("Paky"), /Prossimo round|Vedi il podio/);
    }, 150000, "la scalata non finisce");
    await W.dorme(1500);
    var nE = A.contaStoria(C, '"__esito"');
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "fine" ? "fase " + b.fase : passi(a) === passi(b) && JSON.stringify(a.vincitori) === JSON.stringify(b.vincitori) ? true : "podio cambiato"; } });
    await fineSenzaDoppi(C, ["Paky"].concat(amici), nE);
    L.nota("podio → podio, niente XP doppi (" + r.dt + " s)");
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    return L.join(" · ");
  } });

  // =====================================================================
  //  542 BALLA COLOSSALE
  // =====================================================================
  function veloAperto(w) { return w && w.document.querySelector(".bc-velo.on:not(.via)"); }
  function scriviB(w, testo) {
    var v = veloAperto(w), ta = v && v.querySelector(".bc-penna"), ok = v && v.querySelector(".bc-ok"); if (!ta || !ok) return false;
    ta.value = testo; ta.dispatchEvent(new w.Event("input", { bubbles: true })); ok.click(); return true;
  }
  function votaB(w) {
    var v = veloAperto(w); if (!v || !v.querySelector(".bc-scelta")) return false;
    var b = [].filter.call(v.querySelectorAll(".bc-scelta"), function (x) { return !x.disabled; })[0]; if (!b) return false;
    b.click(); var ok = v.querySelector(".bc-ok"); if (!ok || ok.disabled) return false; ok.click(); return true;
  }
  function idB(v, nome) { var p = (v.players || []).filter(function (x) { return x.nome === nome; })[0]; return p ? p.id : null; }
  // tutti scrivono e votano dal loro telefono (solo, se c'è, chi è in «chi»; solo, se c'è, nella fase «fase»)
  function passoB(fatti, chi, fase) {
    return function (v) {
      if (fase && v.fase !== fase) return;
      (v.players || []).forEach(function (p) {
        if (p.via || (chi && chi.indexOf(p.nome) < 0)) return;
        var w = W.finestra(p.nome), k = v.fase + "|" + v.giro + "." + (v.rif || 0) + "|" + p.id;
        if (fatti[k] || !w) return;
        if (v.fase === "scrittura" && veloAperto(w)) fatti[k] = scriviB(w, "balla di " + p.nome + " " + v.giro + "." + (v.rif || 0));
        if (v.fase === "voto" && veloAperto(w)) fatti[k] = votaB(w);
      });
    };
  }
  COPIONE.aggiungi(542, { nome: "Balla Colossale: l'host ricarica in saletta, mentre si scrive, al voto, alla rivelazione, ai punti e sulla classifica", fai: async function () {
    var L = N(), amici = ["Luca", "Sara"], sent = sentinella(["Paky"].concat(amici)), fatti = {};
    var X = await stanza("La Balla Colossale", "balla", { round: 2, amici: "no", ride: false }, amici), C = X.C;
    var r = await ricaricaHost(C, amici, { lobby: true }); L.nota("saletta → saletta (" + r.dt + " s)");
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    // mentre si scrive: Luca ha già scritto, Sara no → si riparte dalla notizia, poi si scrive col tempo intero:
    // Luca ha già fatto, a Sara si riapre il foglio
    await finche(C, function (v) { return v.fase === "scrittura" && veloAperto(W.finestra("Luca")); }, null, 40000, "non si arriva a scrivere");
    if (!scriviB(W.finestra("Luca"), "la balla di Luca")) no("Luca non riesce a scrivere la balla");
    var idL = idB(vm(C), "Luca");
    if (!await W.aspetta(function () { return (vm(C).fatti || []).indexOf(idL) >= 0; }, 5000)) no("la balla di Luca non arriva");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) {
      if (b.fase !== "notizia" && b.fase !== "scrittura") return "fase " + b.fase;
      if ((b.rif || 0) !== (a.rif || 0) + 1) return "il giro non è stato rifatto (rif " + a.rif + " → " + b.rif + ")";
      return (b.fatti || []).indexOf(idL) < 0 ? "la balla di Luca non c'è più" : stessiPunti(a, b);
    } });
    var vS = await finche(C, function (v) { return v.fase === "scrittura" && veloAperto(W.finestra("Sara")); }, null, 15000, "dopo la ripresa a Sara non si riapre il foglio");
    if (vS.rimMs < 60000) no("dopo la ripresa il tempo per scrivere non è intero (" + vS.rimMs + " ms)");
    await W.dorme(1200);
    if (veloAperto(W.finestra("Luca"))) no("Luca aveva già scritto ma gli si riapre il foglio");
    L.nota("scrittura → notizia e scrittura col tempo intero, la balla di Luca resta (" + r.dt + " s)");
    // al voto: Luca ha già votato → si rivedono le risposte, poi si vota (Luca ha già fatto)
    await finche(C, function (v) { return v.fase === "voto" && veloAperto(W.finestra("Luca")); }, passoB(fatti, ["Paky", "Sara"], "scrittura"), 60000, "non si arriva al voto");
    if (!votaB(W.finestra("Luca"))) no("Luca non riesce a votare");
    if (!await W.aspetta(function () { return (vm(C).fatti || []).indexOf(idL) >= 0; }, 5000)) no("il voto di Luca non arriva");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) {
      if (b.fase !== "risposte" && b.fase !== "voto") return "fase " + b.fase;
      return (b.fatti || []).indexOf(idL) < 0 ? "il voto di Luca non c'è più" : stessiPunti(a, b);
    } });
    await finche(C, function (v) { return v.fase === "voto" && veloAperto(W.finestra("Sara")); }, null, 20000, "dopo la ripresa al voto a Sara non si riapre il voto");
    L.nota("voto → risposte e voto, il voto di Luca resta (" + r.dt + " s)");
    // alla rivelazione: si va ai punti del round (contati una volta)
    await finche(C, function (v) { return v.fase === "rivela"; }, passoB(fatti, ["Paky", "Sara"]), 60000, "non si arriva alla rivelazione");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.giro !== a.giro ? "giro " + a.giro + " → " + b.giro : (b.fase === "rivela" || b.fase === "oro") ? stessiPunti(a, b) : b.fase === "punti" ? true : "fase " + b.fase; } });
    var vP = await finche(C, function (v) { return v.fase === "punti"; }, null, 15000, "dopo la ripresa alla rivelazione non arrivano i punti");
    L.nota("rivelazione → punti del round (" + r.dt + " s)");
    // ai punti: stessi punti, poi la notizia dopo
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "punti" ? "fase " + b.fase : stessiPunti(a, b); } });
    await finche(C, function (v) { return v.giro === vP.giro + 1 && (v.fase === "notizia" || v.fase === "scrittura"); }, null, 25000, "dopo la ripresa ai punti non arriva il round dopo");
    L.nota("punti → round dopo (" + r.dt + " s)");
    // fino alla classifica finale
    await finche(C, function (v) { return v.fase === "fine"; }, passoB(fatti), 150000, "la partita non finisce");
    await W.dorme(2500);
    var nE = A.contaStoria(C, '"__esito"');
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "fine" ? "fase " + b.fase : JSON.stringify(a.classifica) === JSON.stringify(b.classifica) ? true : "classifica cambiata"; } });
    await fineSenzaDoppi(C, ["Paky"].concat(amici), nE);
    L.nota("classifica → classifica, niente XP doppi (" + r.dt + " s)");
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    return L.join(" · ");
  } });

  // =====================================================================
  //  543 NOMI, COSE E CITTÀ
  // =====================================================================
  function idN(v, nome) { return idB(v, nome); }
  function paroleN(v, chi) { return (v.cats || []).map(function (c, i) { return v.lettera + "parola" + chi + i; }); }
  function mandaN(nome, msg) {
    if (nome === "Paky") { var cb = cbHost(); if (cb && cb.nomicose) cb.nomicose.onMsg("host", msg); }
    else { var h = W.reteDi(nome); if (h) h.invia(msg); }
  }
  function passoN(fatti, chi) {
    return function (v) {
      (v.players || []).forEach(function (p) {
        if (p.via || (chi && chi.indexOf(p.nome) < 0)) return;
        var k = v.fase + "|" + v.giro + "|" + (v.ci || 0) + "|" + (v.rip || 0) + "|" + p.id; if (fatti[k]) return;
        if (v.fase === "scrittura" && (v.fatti || []).indexOf(p.id) < 0) { fatti[k] = 1; mandaN(p.nome, { t: "risposte", r: paroleN(v, p.nome) }); }
        if (v.fase === "tabellone" && (v.pronti || []).indexOf(p.id) < 0) { fatti[k] = 1; mandaN(p.nome, { t: "pronto", ci: v.ci }); }
        if (v.fase === "punti") { fatti[k] = 1; mandaN(p.nome, { t: "avanti", g: v.giro }); }
      });
    };
  }
  function foglioN(w) { var f = w && w.document.querySelector(".nc-foglio.on:not(.via)"); return f ? [].slice.call(f.querySelectorAll("input")) : []; }
  COPIONE.aggiungi(543, { nome: "Nomi Cose Città: l'host ricarica in saletta, mentre si scrive, al tabellone, alla classifica del giro e alla fine", fai: async function () {
    var L = N(), amici = ["Luca", "Giulia"], sent = sentinella(["Paky"].concat(amici)), fatti = {};
    var X = await stanza("Nomi, Cose e Città", "nomicose", { round: 2, secondi: 60 }, amici), C = X.C;
    var r = await ricaricaHost(C, amici, { lobby: true }); L.nota("saletta → saletta (" + r.dt + " s)");
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Via ▶|Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    // mentre si scrive: Luca ha consegnato; Giulia ha scritto due parole nel foglio (bozza) → tempo intero, Luca ha fatto,
    // Giulia ritrova il suo foglio con le sue parole
    var campi = await W.aspetta(function () { var c = foglioN(W.finestra("Giulia")); return c.length ? c : null; }, 40000);
    if (!campi) no("a Giulia non si apre il foglio");
    var G = W.finestra("Giulia"), v0 = vm(C), mie = [v0.lettera + "anna", v0.lettera + "occo"];
    [0, 1].forEach(function (i) { campi[i].value = mie[i]; campi[i].dispatchEvent(new G.Event("input", { bubbles: true })); campi[i].dispatchEvent(new G.Event("change", { bubbles: true })); });
    mandaN("Luca", { t: "risposte", r: paroleN(v0, "Luca") });
    var idL = idN(v0, "Luca");
    if (!await W.aspetta(function () { return (vm(C).fatti || []).indexOf(idL) >= 0; }, 5000)) no("le parole di Luca non arrivano");
    await W.dorme(2500);   // (la bozza di Giulia va all'host)
    r = await ricaricaHost(C, amici, { controlla: function (a, b) {
      if (b.fase !== "scrittura") return "fase " + b.fase;
      if (b.lettera !== a.lettera) return "lettera " + a.lettera + " → " + b.lettera;
      if ((b.rip || 0) !== (a.rip || 0) + 1) return "la foto non dice che si riscrive (rip " + a.rip + " → " + b.rip + ")";
      if ((b.fatti || []).indexOf(idL) < 0) return "le parole di Luca non ci sono più";
      return b.rimMs < 55000 ? "il tempo non è intero (" + b.rimMs + " ms)" : true;
    } });
    var fg = foglioN(W.finestra("Giulia"));
    if (!fg.length || fg[0].value !== mie[0] || fg[1].value !== mie[1]) no("Giulia non ritrova il foglio con le sue parole (" + fg.map(function (x) { return x.value; }).join(", ") + ")");
    L.nota("scrittura → tempo intero, Luca ha fatto, Giulia ritrova «" + mie.join(", ") + "» (" + r.dt + " s)");
    // al tabellone: stessa categoria, stessi voti
    await finche(C, function (v) { return v.fase === "tabellone" && v.ci === 1; }, function (v) { passoN(fatti)(v); }, 40000, "non si arriva alla seconda categoria del tabellone");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "tabellone" ? "fase " + b.fase : b.ci !== a.ci ? "categoria " + a.ci + " → " + b.ci : JSON.stringify(a.tab) !== JSON.stringify(b.tab) ? "il tabellone è cambiato" : true; } });
    L.nota("tabellone → stessa categoria e stessi voti (" + r.dt + " s)");
    // alla classifica del giro
    await finche(C, function (v) { return v.fase === "punti"; }, function (v) { if (v.fase !== "punti") passoN(fatti)(v); }, 60000, "non arriva la classifica del giro");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "punti" ? "fase " + b.fase : stessiPunti(a, b); } });
    if (!(r.dopo.rimMs >= 4000)) no("alla classifica del giro ripresa il tempo è " + r.dopo.rimMs + " ms");
    L.nota("classifica del giro → stessa classifica (" + r.dt + " s)");
    // fino alla fine
    await finche(C, function (v) { return v.fase === "fine"; }, passoN(fatti), 150000, "la partita non finisce");
    await W.dorme(3000);
    var nE = A.contaStoria(C, '"__esito"');
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "fine" ? "fase " + b.fase : stessiPunti(a, b); } });
    await fineSenzaDoppi(C, ["Paky"].concat(amici), nE);
    L.nota("fine → fine, niente XP doppi (" + r.dt + " s)");
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    return L.join(" · ");
  } });

  // =====================================================================
  //  544 SCARABOCCHIO
  // =====================================================================
  function toccaB(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click();
  }
  function nomeDiId(v, id) { var p = (v.players || []).filter(function (x) { return x.id === id; })[0]; return p ? p.nome : null; }
  function provaS(nome, x) {
    if (nome === "Paky") { var cb = cbHost(); if (cb && cb.scarabocchio) cb.scarabocchio.onMsg("host", { t: "prova", x: x }); }
    else { var h = W.reteDi(nome); if (h) h.invia({ t: "prova", x: x }); }
  }
  COPIONE.aggiungi(544, { nome: "Scarabocchio: l'host ricarica in saletta, mentre si sceglie, mentre si disegna (si ridisegna, i punti restano), ai punti e alla fine", fai: async function () {
    var L = N(), amici = ["Luca", "Giulia"], nomi = ["Paky"].concat(amici), sent = sentinella(nomi);
    var X = await stanza("Scarabocchio", "scarabocchio", { giri: 1, secondi: 60 }, amici), C = X.C;
    var r = await ricaricaHost(C, amici, { lobby: true }); L.nota("saletta → saletta (" + r.dt + " s)");
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    // mentre chi disegna sceglie: si sceglie di nuovo (turno nuovo), stesso disegnatore
    await finche(C, function (v) { return v.fase === "scelta"; }, null, 10000, "non comincia");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "scelta" ? "fase " + b.fase : b.disegnatore !== a.disegnatore ? "il disegnatore è cambiato" : b.turno !== a.turno + 1 ? "turno " + a.turno + " → " + b.turno : true; } });
    L.nota("scelta → si sceglie di nuovo (" + r.dt + " s)");
    // si sceglie la prima parola (la leggo sul telefono di chi disegna)
    var v = vm(C), chi = nomeDiId(v, v.disegnatore), parola = null;
    var bb = await W.aspetta(function () { var l = W.finestra(chi).document.querySelectorAll(".sb-scelte button"); return l.length === 3 ? l : null; }, 6000);
    if (!bb) no(chi + " non vede le 3 parole da scegliere");
    parola = bb[0].firstChild.textContent; toccaB(W.finestra(chi), bb[0]);
    await finche(C, function (x) { return x.fase === "disegno"; }, null, 8000, "dopo la scelta non si disegna");
    // uno indovina (prende i punti), poi l'host ricarica mentre si disegna
    var altri = nomi.filter(function (n) { return n !== chi; }), primo = altri[0], secondo = altri[1];
    provaS(primo, parola);
    if (!await W.aspetta(function () { return (vm(C).players || []).some(function (p) { return p.nome === primo && p.ok; }); }, 5000)) no(primo + " non indovina «" + parola + "»");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) {
      if (b.fase !== "disegno") return "fase " + b.fase;
      if (b.disegnatore !== a.disegnatore) return "il disegnatore è cambiato";
      if (b.turno !== a.turno + 1) return "il turno non ricomincia (turno " + a.turno + " → " + b.turno + ")";
      if (!(b.players || []).some(function (p) { return p.nome === primo && p.ok; })) return primo + " non risulta più tra chi ha indovinato";
      if (!(b.chat || []).some(function (m) { return /ridisegna/i.test(m.x || ""); })) return "nella chat non c'è «ridisegna»";
      return b.rimMs < 55000 ? "il tempo non è intero (" + b.rimMs + " ms)" : stessiPunti(a, b);
    } });
    if (!await W.aspetta(function () { return /Ridisegna: la partita è ripresa/.test(T(W.finestra(chi))); }, 6000)) no(chi + " (disegna) non legge «🔁 Ridisegna: la partita è ripresa»");
    if (!await W.aspetta(function () { return new RegExp("Disegna: " + parola, "i").test(T(W.finestra(chi))); }, 6000)) no(chi + " non ha più la parola da disegnare («" + T(W.finestra(chi)).slice(0, 80) + "»)");
    L.nota("disegno → " + chi + " ridisegna «" + parola + "» col tempo intero, i punti di " + primo + " restano (" + r.dt + " s)");
    // il secondo indovina: il turno finisce, punti del turno
    provaS(secondo, parola);
    await finche(C, function (x) { return x.fase === "punti"; }, null, 8000, "indovinata da tutti, non arrivano i punti");
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "punti" && b.fase !== "scelta" ? "fase " + b.fase : stessiPunti(a, b); } });
    L.nota("punti → si va avanti (" + r.dt + " s)");
    // fino alla fine (chi disegna sceglie, gli altri indovinano)
    var parole = {};
    await finche(C, function (x) { return x.fase === "fine"; }, function (x) {
      var d = nomeDiId(x, x.disegnatore);
      if (x.fase === "scelta" && d && !parole[x.turno]) {
        var l = W.finestra(d).document.querySelectorAll(".sb-scelte button");
        if (l.length === 3) { parole[x.turno] = l[0].firstChild.textContent; toccaB(W.finestra(d), l[0]); }
      }
      if (x.fase === "disegno" && parole[x.turno - 0]) nomi.forEach(function (n) { if (n !== d && !(x.players || []).some(function (p) { return p.nome === n && p.ok; })) provaS(n, parole[x.turno]); });
    }, 120000, "lo Scarabocchio non finisce");
    await W.dorme(2500);
    var nE = A.contaStoria(C, '"__esito"');
    r = await ricaricaHost(C, amici, { controlla: function (a, b) { return b.fase !== "fine" ? "fase " + b.fase : JSON.stringify(a.classifica) === JSON.stringify(b.classifica) ? true : "classifica cambiata"; } });
    await fineSenzaDoppi(C, nomi, nE);
    L.nota("fine → fine, niente XP doppi (" + r.dt + " s)");
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    return L.join(" · ");
  } });

  // =====================================================================
  //  545 LINEA DEL TEMPO: la vecchia chiave sparisce
  // =====================================================================
  COPIONE.aggiungi(545, { nome: "Linea del tempo: la vecchia chiave «sg-tl-host» sparisce e la ripresa funziona lo stesso", fai: async function () {
    var amici = ["Giulia"];
    W.BR.mem.Paky = W.BR.mem.Paky || { l: { "sg-sala-sempre": "0" }, s: {} };   // (il telefono nuovo, col percorso di prima)
    // il salvataggio fatto in casa di una partita vecchia (come lo scriveva la versione di prima)
    W.BR.mem.Paky.l["sg-tl-host"] = JSON.stringify({ t: Date.now(), codice: "ZZZZ", T: null, st: { fase: "turno", giocatori: [{ id: "host", nome: "Paky", punti: 7 }], mazzo: [] } });
    var X = await stanza("La linea del tempo", "timeline", { carte: 2 }, amici), C = X.C;
    if (W.BR.mem.Paky.l["sg-tl-host"]) no("aperta la stanza, la vecchia chiave «sg-tl-host» c'è ancora");
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    await finche(C, function (v) { return v.fase === "turno"; }, null, 30000, "il primo turno non arriva");
    var r = await ricaricaHost(C, amici, { controlla: stessiPunti });
    if (W.BR.mem.Paky.l["sg-tl-host"]) no("dopo la ricarica la vecchia chiave «sg-tl-host» è tornata");
    if (!W.BR.mem.Paky.l["sg-ripresa"]) no("la partita non è in «sg-ripresa»");
    return "la vecchia chiave sparisce; ripresa col modo comune in " + r.dt + " s (" + punti(r.dopo) + ")";
  } });

  // =====================================================================
  //  546 SCALINATA: un amico spento durante la ripresa
  // =====================================================================
  COPIONE.aggiungi(546, { nome: "Scalinata: un amico spento mentre l'host ricarica → per lui sceglie il bot, poi rientra", fai: async function () {
    var amici = ["Giulia", "Luca"];
    var X = await stanza("La Scalinata", "scalinata", null, amici), C = X.C;
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    await finche(C, function (v) { return v.fase === "scelta"; }, null, 10000, "non comincia");
    var idG = mioId("Giulia");
    W.spegni("Giulia");
    await W.dorme(500);
    var r = await ricaricaHost(C, amici, { assenti: ["Giulia"], controlla: function (a, b) { return passi(a) === passi(b) ? true : "gradini cambiati"; } });
    var g = function () { return (vm(C).posti || []).filter(function (p) { return p.id === idG; })[0] || {}; };
    if (!g().via) no("Giulia spenta non risulta fuori dopo la ripresa");
    // Paky e Luca scelgono: per Giulia sceglie il bot, il round si chiude
    var v1 = await finche(C, function (v) { return v.fase === "rivela"; }, function (v) { if (v.fase === "scelta") sceglieScala(["Paky", "Luca"]); }, 30000, "senza Giulia il round non si chiude");
    var k = (v1.posti || []).findIndex(function (p) { return p.id === idG; });
    if (k < 0 || v1.scelte[k] == null) no("per Giulia non ha scelto nessuno");
    W.riaccendi("Giulia");
    if (!await W.aspetta(function () { return !g().via; }, 15000)) no("Giulia riaccesa non rientra");
    if (W.finestra("Giulia").document.querySelector(".saletta-schermo")) no("Giulia riaccesa è in saletta");
    return "ripresa in " + r.dt + " s senza Giulia; per lei ha scelto il bot (" + v1.scelte[k] + "), riaccesa rientra";
  } });
})();

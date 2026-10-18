// CONTROLLO DEL RIALZO DA SOLI NELL'ASTA (16 ott 2026): partite INTERE con rialzi a caso, confrontate mossa per mossa con le regole.
// Uso (dopo copione-prova.js e migliora/asta-rialzo.js, che ha la spia «ar»):
//   await COPIONE.carica("migliora/asta-rialzo-controllo.js"); await COPIONE.prova("ac1")
// ac1 Online temi, 4 telefoni, partita intera fino alla classifica: ogni rilancio/rialzo (tasto, avatar o messaggio) deve
//     passare solo se chi offre può pagarlo (1 credito per ogni round che resta), +1 alla volta, giro nuovo e tempo pieno;
//     il capo non passa; il messaggio doppio del capo non conta e non dà «Troppo tardi»; il rialzo vecchio del capo superato
//     dà «Troppo tardi»; chiusa subito quando resta solo il capo; una volta si aspetta il tempo (aperta a 8 s, chiusa entro 12 s);
//     chi vince paga esattamente l'offerta.
// ac2 Online fantacalcio, 4 telefoni, partita intera fino alla classifica: le stesse cose coi posti in rosa (1 credito per
//     ogni posto vuoto, ruolo pieno = niente offerte), rosa da 5 per tutti, crediti mai sotto zero.
// ac3 Stesso telefono, temi, partita intera fino alla classifica con rialzi da soli a caso (la luce dice il vero).
// ac4 Stesso telefono, fantacalcio, partita intera fino al podio con rialzi da soli a caso.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function tasto(w, re) { return qa(w, ".sa-piede button").filter(function (b) { return re.test(b.textContent); })[0] || null; }
  function persDi(w, nome) { return qa(w, ".sa-pers").filter(function (p) { var b = p.querySelector("b"); return b && b.textContent === nome; })[0] || null; }
  function capoNome(w) { var p = qa(w, ".sa-pers.guida")[0]; return p ? p.querySelector("b").textContent : null; }
  function prezzo(w) { var b = q(w, ".sa-prezzo b, .st-prezzo b"); return b ? parseInt(b.textContent, 10) : null; }
  function caso(n) { return Math.floor(Math.random() * n); }
  var NOMI = ["Paky", "Giulia", "Luca", "Marta"];
  var SLOT = { P: 1, D: 1, C: 2, A: 1 }, ULT = {};   // ULT: l ultimo tocco di ogni telefono (qui tra un tocco e l altro si aspetta la foto nuova; i tocchi fulminei, che contano tutti, li prova preferiti/asta-tocchi.js)

  async function quattroTelefoni(imp) {
    var P = await W.apriTel("Paky", { x: 0, ar: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "L'Asta");
    for (var i = 1; i < 4; i++) await W.apriTel(NOMI[i], { hash: "gioco=asta&stanza=" + C, x: 185 * i });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 4; }, 10000)) no("non sono entrati in 4");
    W.clicca(P, /Comincia/);
    return { P: P, C: C };
  }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function nomeDiId(C, id) { var g = (vm(C).giocatori || []).filter(function (x) { return x.id === id; })[0]; return g ? g.nome : null; }

  // ---------- un'offerta online, controllata con le regole ----------
  // fanta: prezzo = offerta se nessuno ha ancora offerto, se no offerta + 1; puo(g) = posto libero nel ruolo e crediti
  async function offriOnline(C, nome, modo, conti, fanta) {
    var v = vm(C), a = v.asta; if (!a) return "chiusa";
    var id = idDi(nome), g = (v.giocatori || []).filter(function (x) { return x.id === id; })[0]; if (!g) no("non trovo " + nome + " nella foto");
    var n = fanta ? a.nCarta : a.n, p = fanta ? (a.leaderId ? a.offerta + 1 : a.offerta) : a.offerta + 1;
    var guido = a.leaderId === id, giro0 = a.giro;
    var puo = fanta ? ((g.conta[a.ruolo] || 0) < SLOT[a.ruolo] && g.max >= p) : (!g.haCarta && g.crediti - ((v.totRound - 1) - v.roundIdx) >= p);
    if ((a.passati || []).indexOf(id) >= 0) return "passato";
    var w = W.finestra(nome);
    if (modo !== "msg") {   // col tasto (o toccando il suo avatar): prima aspetto che il telefono veda questo prezzo
      var re = new RegExp("(Rialzo|Rilancio|Lo prendo a):? " + p + " ");
      var b = await W.aspetta(function () { return tasto(w, re); }, 3000);
      if (!b) {
        var pieno = fanta && (g.conta[a.ruolo] || 0) >= SLOT[a.ruolo];
        if (!pieno && !(!fanta && g.haCarta)) no(nome + " non ha il tasto per offrire " + p + " («" + T(w).slice(-140) + "»)");
        return "senza tasto";
      }
      if (fanta ? false : true) { if (guido && !/Rialzo/.test(b.textContent)) no(nome + " guida ma il tasto dice «" + b.textContent + "»"); }
      if (guido && fanta && a.leaderId && !/Rialzo/.test(b.textContent)) no(nome + " guida ma il tasto dice «" + b.textContent + "»");
      if (!guido && /Rialzo/.test(b.textContent)) no(nome + " non guida ma il tasto dice «Rialzo»");
      if (b.disabled === puo) no(nome + " tasto " + (b.disabled ? "spento" : "acceso") + " ma per le regole " + (puo ? "può" : "non può") + " offrire " + p + " (crediti " + g.crediti + ")");
      var av = persDi(w, nome);
      if (av && av.classList.contains("puo") !== puo) no("la luce dell'avatar di " + nome + " non dice il vero (" + puo + ")");
      if (guido && puo && !/tocca ancora per rialzare/.test(T(w))) no(nome + " guida e può, ma la scritta non dice «tocca ancora per rialzare»");
      if (guido && !puo && /tocca ancora per rialzare/.test(T(w))) no(nome + " al suo massimo legge «tocca ancora per rialzare»");
      if (!puo) { if (nome !== "Paky") W.reteDi(nome).invia({ t: "rilancia", n: n, prezzo: p }); }
      else { var at = Date.now() - (ULT[nome] || 0); if (at < 650) await W.dorme(650 - at); ULT[nome] = Date.now(); if (modo === "avatar" && av) av.click(); else b.click(); }
    } else if (nome === "Paky") {
      var bp = await W.aspetta(function () { return tasto(w, /Rialzo|Rilancio|Lo prendo/); }, 3000);
      if (!bp) return "senza tasto";
      if (!puo) return "non può";
      var at2 = Date.now() - (ULT[nome] || 0); if (at2 < 650) await W.dorme(650 - at2); ULT[nome] = Date.now();
      bp.click();
    } else W.reteDi(nome).invia({ t: "rilancia", n: n, prezzo: p });
    if (puo) {
      var ok = await W.aspetta(function () {
        var x = vm(C), xa = x.asta;
        if (xa && (fanta ? xa.nCarta : xa.n) === n) return xa.offerta === p && xa.leaderId === id ? "aperta" : false;
        return x.esito && x.esito.chiId === id && x.esito.prezzo === p ? "chiusa" : false;
      }, 3000);
      if (!ok) no("l'offerta di " + nome + " a " + p + " (" + (guido ? "rialzo da solo" : "rilancio") + ", può) non passa: " + JSON.stringify(vm(C).asta && [vm(C).asta.offerta, vm(C).asta.leaderNome]) + " esito " + JSON.stringify(vm(C).esito && [vm(C).esito.chiNome, vm(C).esito.prezzo]));
      if (ok === "aperta") {
        var xa = vm(C).asta, tot = fanta ? 8000 : 10000;
        if (xa.giro <= giro0) no("dopo l'offerta di " + nome + " il tempo non riparte (giro " + giro0 + "→" + xa.giro + ")");
        if (xa.resta < tot - 1600) no("dopo l'offerta di " + nome + " il tempo non è pieno (" + xa.resta + " ms)");
        if (fanta && xa.durata !== 8000) no("durata " + xa.durata + " invece di 8000 dopo un'offerta");
      }
      conti.offerte++; if (guido) conti.rialzi++;
      return ok;
    }
    await W.dorme(500);
    var y = vm(C).asta;
    if (y && (fanta ? y.nCarta : y.n) === n && (y.offerta !== a.offerta || y.leaderId !== a.leaderId)) no("l'host ha accettato l'offerta di " + nome + " a " + p + " che non può pagare");
    conti.rifiuti++;
    return "rifiutata";
  }

  // tutti quelli in gara tranne il capo passano: l'asta si deve chiudere SUBITO col capo vincitore
  async function chiudiPassando(C, fanta, conti) {
    var v = vm(C), a = v.asta; if (!a) return;
    var n = fanta ? a.nCarta : a.n, capo = a.leaderId, prezzo0 = a.offerta;
    var crediti0 = {}; (v.giocatori || []).forEach(function (g) { crediti0[g.id] = g.crediti; });
    // il capo prova a passare: non deve contare
    if (capo) {
      var nc = nomeDiId(C, capo);
      if (nc === "Paky") { if (tasto(W.finestra("Paky"), /^\s*Passo\s*$/)) no("l'host guida e ha «Passo»"); }
      else { W.reteDi(nc).invia({ t: "passa", n: n }); await W.dorme(300); if (vm(C).asta && (vm(C).asta.passati || []).indexOf(capo) >= 0) no("il capo " + nc + " è riuscito a passare"); }
    }
    var altri = NOMI.filter(function (nm) { return idDi(nm) !== capo; });
    for (var i = 0; i < altri.length; i++) {
      var x = vm(C); if (!x.asta || (fanta ? x.asta.nCarta : x.asta.n) !== n) break;
      var nm = altri[i];
      if (nm === "Paky") { var bp = tasto(W.finestra("Paky"), /^\s*Passo\s*$/); if (bp) bp.click(); }
      else W.reteDi(nm).invia({ t: "passa", n: n });
      await W.dorme(250);
    }
    var t0 = Date.now();
    var ok = await W.aspetta(function () { var x = vm(C); return !x.asta || (fanta ? x.asta.nCarta : x.asta.n) !== n; }, 2500);
    if (!ok) no("tutti gli altri hanno passato ma l'asta non si chiude subito (capo " + nomeDiId(C, capo) + ", " + prezzo0 + ")");
    var e = vm(C).esito;
    if (capo) {
      if (!e || e.chiId !== capo) no("l'asta chiusa non va al capo: " + JSON.stringify(e && [e.chiNome, e.prezzo, e.tipo]));
      var gv = (vm(C).giocatori || []).filter(function (g) { return g.id === capo; })[0];
      if (gv.crediti !== crediti0[capo] - e.prezzo) no(nomeDiId(C, capo) + " paga " + (crediti0[capo] - gv.crediti) + " invece di " + e.prezzo);
      conti.vinte.push(nomeDiId(C, capo) + " " + e.prezzo);
    }
  }

  // ===== ac1: online temi, 4 telefoni, partita intera =====
  COPIONE.aggiungi("ac1", { nome: "Asta online (temi), 4 telefoni: partita intera coi rialzi da soli controllati mossa per mossa", fai: async function () {
    var o = await quattroTelefoni({ formato: "temi", crediti: 15, round: "normali", maledetta: false }), P = o.P, C = o.C;
    var conti = { offerte: 0, rialzi: 0, rifiuti: 0, vinte: [] }, aspettato = false, tardiFatto = false, doppioFatto = false, aste = 0;
    var fino = Date.now() + 300000;
    while (Date.now() < fino && vm(C).fase !== "voto" && vm(C).fase !== "fine") {
      var v = vm(C);
      if (v.fase === "scelta") {
        if (v.sceglieId === "host") { var c = q(P, ".as-carta:not([disabled])"); if (c) c.click(); }
        else { var ns = nomeDiId(C, v.sceglieId); if (ns) W.reteDi(ns).invia({ t: "scegli", idx: 0, n: v.nScelta, nome: v.tavolo[0].nome }); }
        await W.dorme(400); continue;
      }
      if (v.fase !== "asta" || !v.asta) { W.clicca(P, /Vedi le carte|Avanti|Si vota/); await W.dorme(400); continue; }
      aste++;
      var nAsta = v.asta.n, mosse = 2 + caso(5);
      for (var k = 0; k < mosse; k++) {
        var x = vm(C); if (!x.asta || x.asta.n !== nAsta) break;
        var gara = x.giocatori.filter(function (g) { return !g.haCarta && (x.asta.passati || []).indexOf(g.id) < 0; });
        if (gara.length < 2) break;
        var capo = x.asta.leaderId;
        var chi = Math.random() < 0.55 && capo ? capo : gara[caso(gara.length)].id;   // spesso il capo rialza da solo
        var nome = nomeDiId(C, chi), modo = ["tasto", "avatar", "msg"][caso(3)];
        var r = await offriOnline(C, nome, modo, conti, false);
        if (r === "chiusa") break;
        // il messaggio doppio del capo (stesso prezzo già usato): non conta, niente «Troppo tardi»
        if (r === "aperta" && !doppioFatto && nome !== "Paky") {
          doppioFatto = true; var y = vm(C).asta;
          W.reteDi(nome).invia({ t: "rilancia", n: y.n, prezzo: y.offerta }); await W.dorme(600);
          if (vm(C).asta && (vm(C).asta.offerta !== y.offerta || vm(C).asta.giro !== y.giro)) no("il messaggio doppio di " + nome + " ha cambiato l'asta");
          if (/Troppo tardi/.test(T(W.finestra(nome)))) no("il messaggio doppio dà «Troppo tardi» al capo " + nome);
        }
        await W.dorme(150);
      }
      // una volta: il capo superato manda un rialzo vecchio → «Troppo tardi» per lui
      var z = vm(C);
      if (!tardiFatto && z.asta && z.asta.n === nAsta && z.asta.leaderId && z.asta.leaderId !== "host") {
        var L = nomeDiId(C, z.asta.leaderId), altro = z.giocatori.filter(function (g) { return !g.haCarta && g.id !== z.asta.leaderId && g.id !== "host" && g.crediti - ((z.totRound - 1) - z.roundIdx) >= z.asta.offerta + 1 && (z.asta.passati || []).indexOf(g.id) < 0; })[0];
        var Lmax = z.giocatori.filter(function (g) { return g.id === z.asta.leaderId; })[0];
        if (altro && Lmax.crediti - ((z.totRound - 1) - z.roundIdx) >= z.asta.offerta + 1) {
          tardiFatto = true; var pv = z.asta.offerta + 1;
          W.reteDi(altro.nome).invia({ t: "rilancia", n: nAsta, prezzo: pv });
          await W.aspetta(function () { return (vm(C).asta || {}).leaderId === altro.id; }, 2000);
          W.reteDi(L).invia({ t: "rilancia", n: nAsta, prezzo: pv });   // L aveva visto la sua offerta: il suo rialzo è vecchio
          if (!await W.aspetta(function () { return /Troppo tardi/.test(T(W.finestra(L))); }, 2500)) no(L + " (superato) col rialzo vecchio non legge «Troppo tardi»");
          if (vm(C).asta && vm(C).asta.n === nAsta && (vm(C).asta.leaderId !== altro.id || vm(C).asta.offerta !== pv)) no("il rialzo vecchio di " + L + " ha contato");
          conti.offerte++;
        }
      }
      z = vm(C);
      if (!z.asta || z.asta.n !== nAsta) continue;
      // una volta: lascio scadere il tempo dopo un rialzo da solo (aperta a 8 s, chiusa entro 12 s)
      if (!aspettato && z.asta.leaderId) {
        var capoN = nomeDiId(C, z.asta.leaderId), rr = await offriOnline(C, capoN, "msg", conti, false);
        if (rr === "aperta") {
          aspettato = true; var t0 = Date.now(), n0 = z.asta.n;
          await W.dorme(8000);
          if (!vm(C).asta || vm(C).asta.n !== n0) no("dopo il rialzo da solo l'asta si chiude prima di 8 s");
          if (!await W.aspetta(function () { return !vm(C).asta || vm(C).asta.n !== n0; }, 4500)) no("dopo 12 s l'asta è ancora aperta");
          conti.vinte.push(capoN + " " + vm(C).esito.prezzo + " (a tempo, " + Math.round((Date.now() - t0) / 1000) + " s)");
          continue;
        }
      }
      await chiudiPassando(C, false, conti);
    }
    if (vm(C).fase !== "voto") no("la partita non arriva al voto (fase " + vm(C).fase + ")");
    var gs = vm(C).giocatori;
    gs.forEach(function (g) { if (g.crediti < 0) no(g.nome + " ha crediti negativi: " + g.crediti); });
    NOMI.forEach(function (nm) { if (nm !== "Paky") W.reteDi(nm).invia({ t: "voto", voti: {}, s: vm(C).sessione }); });
    if (!await W.aspetta(function () { return vm(C).fase === "fine" || W.clicca(P, /Chiudi il voto/); }, 8000)) no("il voto non si chiude");
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 6000)) no("niente classifica");
    if (conti.rialzi < 3) no("troppo pochi rialzi da soli provati (" + conti.rialzi + ")");
    if (!aspettato) no("non ho provato l'asta che scade a tempo");
    if (W.erroriTel().length) no("errori: " + W.erroriTel().slice(0, 3).join(" / "));
    return aste + " aste, " + conti.offerte + " offerte (" + conti.rialzi + " rialzi da soli), " + conti.rifiuti + " offerte oltre i crediti respinte; vinte: " + conti.vinte.join(", ") + "; crediti finali " + gs.map(function (g) { return g.nome + " " + g.crediti; }).join(", ") + (tardiFatto ? "; «Troppo tardi» al capo superato ok" : "") + (doppioFatto ? "; doppio ok" : "");
  } });

  // ===== ac2: online fantacalcio, 4 telefoni, partita intera =====
  COPIONE.aggiungi("ac2", { nome: "Asta online (fantacalcio), 4 telefoni: partita intera coi rialzi da soli controllati mossa per mossa", fai: async function () {
    var o = await quattroTelefoni({ formato: "fanta" }), P = o.P, C = o.C;
    var conti = { offerte: 0, rialzi: 0, rifiuti: 0, vinte: [] }, aste = 0, aspettato = false, visti = {};
    var fino = Date.now() + 420000;
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C);
      if (v.fase !== "asta" || !v.asta || visti[v.asta.nCarta]) { await W.dorme(250); continue; }
      var nC = v.asta.nCarta; visti[nC] = 1; aste++;
      var elegg = v.giocatori.filter(function (g) { return (g.conta[v.asta.ruolo] || 0) < SLOT[v.asta.ruolo]; });
      // il primo che può lo prende a 1 (a volte nessuno: torna in fondo al mazzo)
      if (Math.random() < 0.12) {
        for (var e0 = 0; e0 < elegg.length; e0++) { var nm0 = elegg[e0].nome; if (nm0 === "Paky") { var bp0 = tasto(P, /^\s*Passo\s*$/); if (bp0) bp0.click(); } else W.reteDi(nm0).invia({ t: "passa", n: nC }); await W.dorme(150); }
        if (!await W.aspetta(function () { var x = vm(C); return !x.asta || x.asta.nCarta !== nC; }, 3000)) no("nessuno lo vuole ma l'asta non si chiude subito");
        continue;
      }
      var mosse = 1 + caso(5);
      for (var k = 0; k < mosse; k++) {
        var x = vm(C); if (!x.asta || x.asta.nCarta !== nC) break;
        var gara = x.giocatori.filter(function (g) { return (g.conta[x.asta.ruolo] || 0) < SLOT[x.asta.ruolo] && (x.asta.passati || []).indexOf(g.id) < 0; });
        if (!gara.length) break;
        var capo = x.asta.leaderId, chi = Math.random() < 0.55 && capo ? capo : gara[caso(gara.length)].id;
        // ogni tanto anche chi ha già il ruolo pieno ci prova a messaggio: non deve contare
        if (Math.random() < 0.15) {
          var pieno = x.giocatori.filter(function (g) { return (g.conta[x.asta.ruolo] || 0) >= SLOT[x.asta.ruolo] && g.id !== "host"; })[0];
          if (pieno) {
            var pp = x.asta.leaderId ? x.asta.offerta + 1 : x.asta.offerta;
            W.reteDi(pieno.nome).invia({ t: "rilancia", n: nC, prezzo: pp }); await W.dorme(400);
            var y = vm(C).asta; if (y && y.nCarta === nC && y.leaderId === pieno.id) no(pieno.nome + " col ruolo pieno ha offerto");
            conti.rifiuti++;
          }
        }
        var r = await offriOnline(C, nomeDiId(C, chi), ["tasto", "avatar", "msg"][caso(3)], conti, true);
        if (r === "chiusa") break;
        await W.dorme(120);
      }
      var z = vm(C); if (!z.asta || z.asta.nCarta !== nC) continue;
      if (!z.asta.leaderId) {   // nessuno ha offerto davvero: lo prende il primo che può
        var primo = z.giocatori.filter(function (g) { return (g.conta[z.asta.ruolo] || 0) < SLOT[z.asta.ruolo] && g.max >= z.asta.offerta; })[0];
        if (primo) await offriOnline(C, primo.nome, "msg", conti, true);
        z = vm(C); if (!z.asta || z.asta.nCarta !== nC) continue;
      }
      if (!aspettato && z.asta.leaderId) {
        var cn = nomeDiId(C, z.asta.leaderId), rr = await offriOnline(C, cn, "msg", conti, true);
        if (rr === "aperta") {
          aspettato = true; await W.dorme(6500);
          if (!vm(C).asta || vm(C).asta.nCarta !== nC) no("dopo il rialzo da solo il calciatore è assegnato prima di 6,5 s");
          if (!await W.aspetta(function () { return !vm(C).asta || vm(C).asta.nCarta !== nC; }, 3500)) no("dopo 10 s l'asta del calciatore è ancora aperta");
          conti.vinte.push(cn + " " + vm(C).esito.prezzo + " (a tempo)");
          continue;
        }
      }
      await chiudiPassando(C, true, conti);
    }
    if (vm(C).fase !== "fine") no("il Fantacalcio non arriva alla classifica (fase " + vm(C).fase + ")");
    // controlli finali: rosa piena per tutti, crediti mai sotto zero
    var gs = vm(C).classifica || vm(C).giocatori || [];
    (vm(C).giocatori || []).forEach(function (g) {
      if (g.crediti < 0) no(g.nome + " ha crediti negativi");
      if (g.conta && (g.conta.P !== 1 || g.conta.D !== 1 || g.conta.C !== 2 || g.conta.A !== 1)) no(g.nome + " ha la rosa sbagliata: " + JSON.stringify(g.conta));
    });
    if (conti.rialzi < 3) no("troppo pochi rialzi da soli (" + conti.rialzi + ")");
    if (W.erroriTel().length) no("errori: " + W.erroriTel().slice(0, 3).join(" / "));
    await W.dorme(600); NOMI.forEach(function (n) { W.clicca(W.finestra(n), /Salta/); });
    return aste + " aste, " + conti.offerte + " offerte (" + conti.rialzi + " rialzi da soli), " + conti.rifiuti + " offerte non valide respinte; " + (vm(C).giocatori || []).map(function (g) { return g.nome + " " + g.crediti + " 💰 " + JSON.stringify(g.conta); }).join(", ");
  } });

  // ---------- stesso telefono ----------
  async function partitaLocale(imp) {
    var P = await W.apriTel("Paky", { x: 0, ar: true, prima: function (w) { w.__imp = imp; } });
    var tess = await W.aspetta(function () { return A.tessera(P, "L'Asta"); }, 6000); if (!tess) no("non trovo la tessera");
    tess.click(); await W.dorme(400);
    var bm = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".modo-grande"), function (b) { return /Su questo telefono/.test(b.textContent); }); }, 4000);
    if (!bm) no("non c'è «Su questo telefono»"); bm.click();
    await W.aspetta(function () { return q(P, ".sala-riga input"); }, 3000);
    while (qa(P, ".sala-riga input").length < 4) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    qa(P, ".sala-riga input").forEach(function (c, k) { c.value = NOMI[k] || ("Amico " + k); c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    for (var k = 0; k < 8 && !P.__t; k++) {
      await W.dorme(300); if (P.__t) break;
      var b = qa(P, ".schermata .piede button").filter(function (x) { return /Avanti|Comincia|Gioca|Inizia|Via|Pronti|Partiamo|▶/.test(x.textContent) && !x.disabled; })[0];
      if (b) b.click();
    }
    if (!await W.aspetta(function () { return P.__t; }, 3000)) no("l'Asta non parte");
    return P;
  }
  // nella sala (o nello stadio) sullo stesso telefono: rialzi a caso controllati con la luce, poi passano tutti tranne il capo
  async function astaLocale(P, conti, fanta) {
    var info0 = (q(P, ".sa-info") || {}).textContent || "", mosse = 1 + caso(6);
    for (var k = 0; k < mosse; k++) {
      if (!q(P, ".sa-pers") || q(P, ".sa-aggiudicato")) return;
      var gara = qa(P, ".sa-pers").filter(function (p) { return !p.classList.contains("fuori") && !p.classList.contains("passato"); });
      if (!gara.length) return;
      var capo = capoNome(P), nome = Math.random() < 0.55 && capo ? capo : gara[caso(gara.length)].querySelector("b").textContent;
      var av = persDi(P, nome); if (!av) return;
      var puo = av.classList.contains("puo"), p0 = prezzo(P), c0 = capo;
      av.click(); await W.dorme(130);
      if (!q(P, ".sa-pers") || ((q(P, ".sa-info") || {}).textContent || "") !== info0 && !/all'asta/.test(info0)) return;
      if (/Aggiudicato|Nessuno/.test((q(P, ".sa-info") || {}).textContent || "")) { conti.offerte++; if (nome === c0) conti.rialzi++; return; }
      var atteso = puo ? (fanta && !c0 ? p0 : p0 + 1) : p0;
      if (prezzo(P) !== atteso) no("tocco su " + nome + " (luce " + puo + "): prezzo " + p0 + "→" + prezzo(P) + " invece di " + atteso);
      if (puo && capoNome(P) !== nome) no("dopo il tocco di " + nome + " il capo è " + capoNome(P));
      if (!puo && capoNome(P) !== c0) no("tocco senza luce di " + nome + " ha cambiato il capo");
      if (puo) { conti.offerte++; if (nome === c0) conti.rialzi++; } else conti.rifiuti++;
    }
    if (!q(P, ".sa-pers") || q(P, ".sa-aggiudicato")) return;
    var capo2 = capoNome(P);
    if (!capo2 && fanta) { var lib = qa(P, ".sa-pers.puo")[0]; if (lib) { lib.click(); await W.dorme(130); capo2 = capoNome(P); } }
    if (capo2) { var pc = persDi(P, capo2).querySelector(".sa-passo"); if (pc && pc.style.visibility !== "hidden" && pc.style.display !== "none") no("il capo " + capo2 + " ha «passo»"); }
    qa(P, ".sa-pers").forEach(function (p) { var b = p.querySelector(".sa-passo"); if (b && b.style.visibility !== "hidden" && b.style.display !== "none" && p.querySelector("b").textContent !== capo2) b.click(); });
    var ok = await W.aspetta(function () { return !q(P, ".sa-pers") || q(P, ".sa-aggiudicato") || /Aggiudicato|Nessuno/.test((q(P, ".sa-info") || {}).textContent || "") || ((q(P, ".sa-info") || {}).textContent || "") !== info0; }, 2500);
    if (!ok) no("passati tutti tranne il capo, l'asta non si chiude subito («" + info0 + "»)");
    if (capo2) conti.vinte.push(capo2);
  }

  COPIONE.aggiungi("ac3", { nome: "Asta stesso telefono (temi), 4 giocatori: partita intera coi rialzi da soli", fai: async function () {
    var P = await partitaLocale({ formato: "temi", crediti: 15, round: "normali", maledetta: false }), conti = { offerte: 0, rialzi: 0, rifiuti: 0, vinte: [] }, aste = 0;
    var fino = Date.now() + 240000;
    while (Date.now() < fino) {
      if (/vota|stelle|Classifica|Vince/i.test(T(P)) && !q(P, ".sa-pers") && !q(P, ".as-carta")) break;
      if (q(P, ".sa-pers") && prezzo(P) != null && !q(P, ".sa-aggiudicato") && /Round/.test((q(P, ".sa-info") || {}).textContent || "")) { aste++; await astaLocale(P, conti, false); await W.dorme(300); continue; }
      var c = q(P, ".as-carta:not([disabled])"); if (c) { c.click(); await W.dorme(300); continue; }
      W.clicca(P, /Avanti|Comincia|Vai|Pronti|Si parte|Prossim|Continua|Vedi|▶/);
      await W.dorme(300);
    }
    var tx = T(P);
    if (aste < 12) no("solo " + aste + " aste (ne servono 16 per 4 round da 4) — «" + tx.slice(0, 100) + "»");
    if (conti.rialzi < 3) no("pochi rialzi da soli (" + conti.rialzi + ")");
    if ((P.__err || []).length) no("errori: " + P.__err.slice(0, 2).join(" / "));
    return aste + " aste, " + conti.offerte + " offerte (" + conti.rialzi + " rialzi da soli), " + conti.rifiuti + " tocchi senza luce senza effetto; arrivo: «" + tx.replace(/\s+/g, " ").slice(0, 90) + "»";
  } });

  COPIONE.aggiungi("ac4", { nome: "Asta stesso telefono (fantacalcio), 4 giocatori: partita intera coi rialzi da soli", fai: async function () {
    var P = await partitaLocale({ formato: "fanta" }), conti = { offerte: 0, rialzi: 0, rifiuti: 0, vinte: [] }, aste = 0, ultimo = "";
    var fino = Date.now() + 360000;
    while (Date.now() < fino) {
      if (q(P, ".st-gradini") || /vince! 🏆|pari merito/.test(T(P))) break;
      var info = (q(P, ".sa-info") || {}).textContent || "";
      if (q(P, ".sa-pers") && /all'asta/.test(info) && prezzo(P) != null) {
        var k = info + "|" + ((q(P, ".st-nome") || {}).textContent || "");
        if (k !== ultimo) { ultimo = k; aste++; await astaLocale(P, conti, true); }
        await W.dorme(250); continue;
      }
      W.clicca(P, /Avanti|Comincia|Vai|Pronti|Si parte|Prossim|Continua|Salta|▶/);
      await W.dorme(300);
    }
    if (!q(P, ".st-gradini") && !/vince! 🏆|pari merito/.test(T(P))) no("non si arriva al podio («" + T(P).slice(0, 100) + "»)");
    if (conti.rialzi < 3) no("pochi rialzi da soli (" + conti.rialzi + ")");
    if ((P.__err || []).length) no("errori: " + P.__err.slice(0, 2).join(" / "));
    return aste + " aste, " + conti.offerte + " offerte (" + conti.rialzi + " rialzi da soli), " + conti.rifiuti + " tocchi senza luce senza effetto; podio ok";
  } });
})();

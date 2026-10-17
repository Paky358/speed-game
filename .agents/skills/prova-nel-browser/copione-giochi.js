// COPIONE DEI GIOCHI: partite online intere con ricariche e telefoni spenti (101 Tris, 102 Scalinata, 103 Linea del tempo,
// 104 Black Jack) e casi in più dell'online (105 host che chiude apposta, 106 host di riserva di Parola d'ordine,
// 108 host che ricarica due volte, 109 amico che ricarica nella Sala, 110 Linea del tempo con l'host che ricarica
// durante il voto: la partita riprende, 111 Tris con l'avversario spento più di 20 s). Rispondono OK o NO come copione-prova.js.
// Uso (dopo aver caricato copione-prova.js): const g = await (await fetch("/.agents/skills/prova-nel-browser/copione-giochi.js?" + Date.now())).text(); (0, eval)(g); await COPIONE.prova(101)
(function () {
  var W = window, S = COPIONE.scenari;
  function no(p) { throw new Error(p); }
  function vm(C) { return W.vmDi(C) || {}; }
  function mioId(n) { var h = W.reteDi(n); return h && h.stato ? h.stato().id : null; }
  function dentro(w) { return /Sei dentro/.test(W.testo(w)); }
  function T(w) { return W.testo(w).replace(/\s+/g, " "); }
  function pill(w) { return [].map.call(w.document.querySelectorAll(".sg-pillola"), function (x) { return x.textContent; }).join(" | "); }
  var note = [];
  function nota(x) { note.push(x); }
  // controlla ogni 50 ms che nessun telefono mostri schermate d'errore
  function sentinella(nomi) {
    var visti = [];
    var t = setInterval(function () { nomi.forEach(function (n) { var w = W.finestra(n); if (!w || !w.document || !w.document.body) return; var tx = W.testo(w); var m = tx.match(/Problema di collegamento|Collegamento perso|Ops|La stanza è chiusa|non risponde|è ferma/); if (m && visti.indexOf(n + ": " + m[0]) < 0) visti.push(n + ": " + m[0]); }); }, 50);
    return { stop: function () { clearInterval(t); return visti; } };
  }
  // (Passo 5) l'host (Paky) ricarica la pagina o chiude e riapre l'app: la partita RIPRENDE da dove era (non più la saletta).
  // Foto nuova dell'host con _r, la fase non è "lobby", controlla(vm) vero, nessun amico passa dalla saletta e tutti leggono
  // «🔁 Paky è tornato: la partita riprende da dove era». Restituisce { P, dt }
  async function ripresaHost(C, amici, come, controlla) {
    var s0 = (W.statoStanza(C) || {})._s, t0 = Date.now(), pills = {}, sal = {}, perche = "";
    var P = come === "chiudiApp" ? await W.chiudiApp("Paky") : await W.ricarica("Paky");
    var ok = await W.aspetta(function () {
      amici.forEach(function (n) { var f = W.finestra(n); if (!f) return; var p = pill(f); if (/riprende da dove era/.test(p)) pills[n] = p; if (f.document.querySelector(".saletta-schermo")) sal[n] = 1; });
      var s = W.statoStanza(C) || {}, v = vm(C);
      if (!s._s || s._s === s0) { perche = "nessuna foto nuova dell'host"; return false; }
      if (!s._r) { perche = "la foto nuova non dice che la partita riprende (_r)"; return false; }
      if (!v.fase || v.fase === "lobby") { perche = "la partita è tornata in saletta"; return false; }
      var c = controlla ? controlla(v) : true;
      if (c !== true) { perche = typeof c === "string" ? c : "la partita non è quella di prima"; return false; }
      if (!amici.every(function (n) { return pills[n]; })) { perche = "non tutti leggono «la partita riprende da dove era» (" + amici.filter(function (n) { return !pills[n]; }).map(function (n) { return n + ": " + (pill(W.finestra(n)) || "-"); }).join("; ") + ")"; return false; }
      return true;
    }, 12000);
    if (!ok) no("ricarica dell'host: " + perche + " (fase " + vm(C).fase + ") · " + note.join(" · "));
    var ns = Object.keys(sal); if (ns.length) no("dopo la ricarica dell'host " + ns.join(", ") + " è passato dalla saletta · " + note.join(" · "));
    return { P: P, dt: ((Date.now() - t0) / 1000).toFixed(1) };
  }

  // ---------- 101 TRIS ----------
  S[101] = { nome: "Tris: ricarica dell'ospite, telefono spento, ricarica dell'host (la partita riprende), fine e rivincita", fai: async function () {
    note = [];
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
    await W.apriTel("Giulia", { hash: "gioco=tris&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return vm(C).avvId && dentro(W.finestra("Giulia")); }, 6000)) no("Giulia non entra");
    var sent = sentinella(["Paky", "Giulia"]);
    var cella = function (w, i) { return w.document.querySelectorAll(".tr-cella")[i]; };
    var tocca = async function (i) { var chi = vm(C).turno === "X" ? "Paky" : "Giulia"; var ok = await W.aspetta(function () { var c = cella(W.finestra(chi), i); if (c && !c.disabled) { c.click(); return true; } return false; }, 5000); if (!ok) no("la casella " + i + " non si tocca per " + chi + " (" + T(W.finestra(chi)).slice(0, 80) + ")"); return chi; };
    var n = function () { return (vm(C).board || []).filter(Boolean).length; };
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 4000)) no("non comincia");
    await tocca(4); if (!await W.aspetta(function () { return n() === 1; }, 3000)) no("mossa 1");
    // Giulia ricarica: torna al suo posto, stesso id, vede la mossa
    var id0 = mioId("Giulia");
    var G = await W.ricarica("Giulia");
    var ok = await W.aspetta(function () { var c = cella(W.finestra("Giulia"), 4); return c && c.querySelector("svg") && mioId("Giulia") === id0; }, 8000);
    if (!ok) no("dopo la ricarica Giulia non ritrova la partita (" + T(W.finestra("Giulia")).slice(0, 80) + ", id " + mioId("Giulia") + " / " + id0 + ")");
    nota("Giulia ricarica: ritrova il tavolo, stesso id");
    await tocca(0); if (!await W.aspetta(function () { return n() === 2; }, 4000)) no("mossa 2 dopo la ricarica");
    // telefono di Giulia spento 5 s
    W.spegni("Giulia"); await W.dorme(5000); W.riaccendi("Giulia");
    await W.dorme(1500);
    await tocca(8); if (!await W.aspetta(function () { return n() === 3; }, 5000)) no("mossa 3 dopo il telefono spento");
    nota("Giulia spenta 5 s: si continua");
    // l'host ricarica a metà partita (Passo 5): la partita riprende, stesse 3 mosse, tocca a chi toccava, stesso codice
    await W.dorme(900);   // (la ripresa si salva al massimo ogni mezzo secondo)
    var board0 = JSON.stringify(vm(C).board), turno0 = vm(C).turno, idG = mioId("Giulia");
    var r = await ripresaHost(C, ["Giulia"], "ricarica", function (v) { return v.fase === "gioco" && JSON.stringify(v.board) === board0 && v.turno === turno0 && v.avvId === idG || "tavolo diverso (" + JSON.stringify(v.board) + ", turno " + v.turno + ")"; });
    P = r.P;
    nota("host ricarica: partita ripresa in " + r.dt + " s (stesse 3 mosse)");
    // si finisce la partita sulle caselle libere (X vince con 2-5-8)
    var libere = [1, 2, 3, 5, 6, 7], chi1 = null;
    for (var i = 0; i < libere.length && vm(C).fase !== "fine"; i++) { var nn = n(), c = await tocca(libere[i]); if (!await W.aspetta(function () { return n() === nn + 1 || vm(C).fase === "fine"; }, 4000)) no("mossa dopo la ripresa " + (i + 1)); chi1 = c; }
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 4000)) no("non finisce");
    if (!await W.aspetta(function () { return /vinto|vince|perso|pari/i.test(W.testo(W.finestra("Giulia"))); }, 3000)) no("Giulia non vede la fine");
    // (dal p2-f la fine online è del core: "↻ Nuova partita (stessi amici)" → saletta → 3-2-1 da solo con tutti dentro)
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Rivincita|Nuova partita/); }, 3000)) no("niente Rivincita");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && n() === 0; }, 8000)) no("la rivincita non parte");
    var v = sent.stop();
    if (v.length) no("schermate viste: " + v.join("; "));
    return note.join(" · ") + " · ultima mossa di " + chi1 + " (partita finita), rivincita partita";
  } };

  // ---------- 102 SCALINATA ----------
  S[102] = { nome: "Scalinata: ospite che ricarica, telefono spento 25 s, host che chiude l'app sul podio (lo ritrova) e nuova partita", fai: async function () {
    note = [];
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La Scalinata");
    await W.apriTel("Giulia", { hash: "gioco=scalinata&stanza=" + C, x: 185 });
    await W.apriTel("Luca", { hash: "gioco=scalinata&stanza=" + C, x: 370 });
    var ids = function () { return (vm(C).posti || []).map(function (p) { return p.id; }); };
    if (!await W.aspetta(function () { return ids().length === 3; }, 8000)) no("non entrano in 3");
    var sent = sentinella(["Paky", "Giulia", "Luca"]);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "scelta"; }, 5000)) no("non comincia");
    var idL = mioId("Luca");
    await W.ricarica("Luca");
    var ok = await W.aspetta(function () { var w = W.finestra("Luca"); return mioId("Luca") === idL && /gradin/i.test(W.testo(w)) && !w.document.querySelector(".saletta-schermo"); }, 8000);
    if (!ok) no("Luca dopo la ricarica non è nella partita (" + T(W.finestra("Luca")).slice(0, 100) + ")");
    nota("Luca ricarica in scelta: torna nella partita");
    var sceglie = function (nomi) { nomi.forEach(function (n) { var w = W.finestra(n); if (w) W.clicca(w, new RegExp("^\\s*" + [1, 3, 5][Math.floor(Math.random() * 3)] + "\\s*gradin")); }); };
    var spenta = false, tSpenta = 0, riaccesa = false, round0 = null, fine = Date.now() + 200000;
    while (Date.now() < fine && vm(C).fase !== "fine") {
      var v = vm(C);
      if (v.fase === "scelta") sceglie(["Paky", "Luca"].concat(spenta && !riaccesa ? [] : ["Giulia"]));
      if (v.fase === "rivela") W.clicca(W.finestra("Paky"), /Prossimo round|Vedi il podio/);
      if (!spenta && v.nRound >= 2) { spenta = true; tSpenta = Date.now(); round0 = v.nRound; W.spegni("Giulia"); }
      if (spenta && !riaccesa && Date.now() - tSpenta > 25000) { riaccesa = true; W.riaccendi("Giulia"); nota("Giulia spenta 25 s dal round " + round0 + ", ora round " + vm(C).nRound + " (posti: " + ids().length + ")"); }
      await W.dorme(400);
    }
    if (vm(C).fase !== "fine") no("non finisce (fase " + vm(C).fase + ", round " + vm(C).nRound + ")");
    await W.dorme(800);
    var gw = W.finestra("Giulia");
    nota("Giulia riaccesa vede: «" + T(gw).slice(0, 60) + "» pillole: " + (pill(gw) || "-"));
    // l'host chiude l'app sul podio e la riapre (Passo 5): ritrova il podio, nessuno passa dalla saletta
    await W.dorme(900);
    var nR = vm(C).nRound, nP = ids().length;
    var r = await ripresaHost(C, ["Giulia", "Luca"], "chiudiApp", function (v) { var np = ids().length; return v.fase === "fine" && v.nRound === nR && np === nP || "non è il podio di prima (fase " + v.fase + ", round " + v.nRound + "/" + nR + ", posti " + np + "/" + nP + ")"; });
    nota("host chiude e riapre l'app sul podio: podio ripreso in " + r.dt + " s, Giulia e Luca sul podio");
    // e da lì si rigioca: «Nuova partita» porta tutti nella saletta della stessa stanza
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Rivincita|Nuova partita/); }, 6000)) no("sul podio ripreso niente «Nuova partita» · " + note.join(" · "));
    if (!await W.aspetta(function () { return vm(C).fase === "lobby" || vm(C).fase === "scelta"; }, 8000)) no("«Nuova partita» dal podio ripreso non riparte (fase " + vm(C).fase + ")");
    var vv = sent.stop();
    if (vv.length) nota("schermate viste: " + vv.join("; "));
    return note.join(" · ");
  } };

  // ---------- 103 LINEA DEL TEMPO ----------
  S[103] = { nome: "Linea del tempo in 3: ospite che ricarica, telefono spento, partita intera", fai: async function () {
    note = [];
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La linea del tempo");
    await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185 });
    await W.apriTel("Luca", { hash: "gioco=timeline&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 8000)) no("non entrano in 3");
    W.clicca(P, /Regole/); await W.dorme(200);
    var meno = P.document.querySelector(".sl-foglio .stepper button"); if (meno) { meno.click(); meno.click(); }
    W.clicca(P, /Fatto/, ".sl-foglio button");
    if (!await W.aspetta(function () { return vm(C).carte === 3; }, 3000)) no("regole (3 carte) non arrivate");
    var sent = sentinella(["Paky", "Giulia", "Luca"]);
    W.clicca(P, /Comincia/);
    var fatto = {}, turni = 0, ultimoK = "", ricaricato = false, spento = false, fine = Date.now() + 540000;
    var ospiti = ["Giulia", "Luca"];
    while (Date.now() < fine && vm(C).fase !== "fine") {
      var v = vm(C), k = v.fase + "|" + v.turnoId + "|" + (v.carta ? v.carta.titolo : "");
      var Pw = W.finestra("Paky");
      if (k !== ultimoK && v.fase === "esito") turni++;
      if (!ricaricato && turni === 1 && v.fase === "turno") {
        ricaricato = true; var id0 = mioId("Luca"); await W.ricarica("Luca");
        var ok = await W.aspetta(function () { return mioId("Luca") === id0 && !W.finestra("Luca").document.querySelector(".saletta-schermo") && !/prossima|guardi/.test(pill(W.finestra("Luca"))) && /Paky/.test(W.testo(W.finestra("Luca"))) && /Giulia/.test(W.testo(W.finestra("Luca"))); }, 10000);
        nota("Luca ricarica a metà: " + (ok ? "torna nella partita" : "NON torna: " + T(W.finestra("Luca")).slice(0, 60)));
        if (!ok) no(note.join(" · "));
        continue;
      }
      if (!spento && turni === 2 && v.fase === "votazione") { spento = true; W.spegni("Giulia"); setTimeout(function () { W.riaccendi("Giulia"); }, 6000); nota("Giulia spenta 6 s durante il voto"); }
      if (v.fase === "turno") {
        if (v.turnoId === "host") { var slot = Pw.document.querySelector(".tl-slot"); if (slot) { slot.click(); await W.dorme(150); var conf = Pw.document.querySelector(".tl-conferma"); if (conf && !conf.disabled) conf.click(); } }
        else ospiti.forEach(function (n) { if (mioId(n) === v.turnoId && !fatto[k + n]) { var h = W.reteDi(n); if (h) { h.invia({ t: "scelta", gap: 0 }); fatto[k + n] = 1; } } });
      } else if (v.fase === "votazione") {
        ospiti.forEach(function (n) { if (mioId(n) !== v.turnoId && !fatto[k + n]) { var h = W.reteDi(n); if (h) { h.invia({ t: "voto", d: true }); fatto[k + n] = 1; } } });
        if (v.turnoId !== "host") W.clicca(Pw, /Giusto/);
      } else if (v.fase === "esito") {
        if (v.turnoId === "host") W.clicca(Pw, /Avanti/);
        else ospiti.forEach(function (n) { if (mioId(n) === v.turnoId && !fatto[k + n]) { var h = W.reteDi(n); if (h) { h.invia({ t: "avanti" }); fatto[k + n] = 1; } } });
      }
      ultimoK = k;
      await W.dorme(300);
    }
    if (vm(C).fase !== "fine") no("non finisce (fase " + vm(C).fase + ", turni " + turni + ") · " + note.join(" · "));
    var cl = (vm(C).classifica || []).map(function (r) { return r.nome + " " + r.punti; }).join(", ");
    for (var i = 0; i < ospiti.length; i++) { var n = ospiti[i]; if (!await W.aspetta(function () { return /Classifica finale/.test(W.testo(W.finestra(n))); }, 25000)) no(n + " non vede la classifica finale"); }
    var vv = sent.stop(); if (vv.length) nota("schermate viste: " + vv.join("; "));
    return note.join(" · ") + " · " + turni + " turni, classifica: " + cl;
  } };

  // ---------- 104 BLACK JACK ----------
  S[104] = { nome: "Black Jack in 3: ospite che ricarica, telefono spento 25 s, mani intere, host che ricarica (la partita riprende)", fai: async function () {
    note = [];
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Black Jack");
    await W.apriTel("Giulia", { hash: "gioco=blackjack&stanza=" + C, x: 185 });
    await W.apriTel("Luca", { hash: "gioco=blackjack&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3 && dentro(W.finestra("Giulia")) && dentro(W.finestra("Luca")); }, 8000)) no("non entrano in 3");
    var sent = sentinella(["Paky", "Giulia", "Luca"]);
    W.clicca(P, /Comincia/);
    var seatDi = function (n) { return (vm(C).giocatori || []).findIndex(function (g) { return g.nome === n; }); };
    var mani = 0, ultimaFase = "", fatto = {}, ricaricata = false, spento = false, tSp = 0, riacceso = false, G = {};
    var difetti = [];   // (la partita va avanti lo stesso, ma alla fine si risponde NO)
    async function giocaFinoA(nMani, maxMs) {
      var fine = Date.now() + maxMs;
      while (Date.now() < fine && mani < nMani) {
        var v = vm(C), Pw = W.finestra("Paky"), k = mani + "|" + v.fase + "|" + v.turno;
        if (v.fase === "esito" && ultimaFase !== "esito") mani++;
        ultimaFase = v.fase;
        if (v.fase === "punta") {
          // dopo la ricarica Giulia deve poter puntare dal suo telefono (tasto "Punta")
          if (ricaricata && !G.provato && v.giocatori[seatDi("Giulia")] && !v.giocatori[seatDi("Giulia")].puntata) {
            await W.dorme(600); G.provato = true;
            var tasto = [].some.call(W.finestra("Giulia").document.querySelectorAll("button"), function (b) { return /^Punta /.test(b.textContent); });
            nota("Giulia dopo la ricarica " + (tasto ? "ha il tasto Punta" : "NON ha il tasto Punta (" + T(W.finestra("Giulia")).slice(-60) + ")"));
            if (!tasto) difetti.push("dopo la ricarica Giulia non può puntare");
          }
          ["Giulia", "Luca"].forEach(function (n) { var s = seatDi(n), g = v.giocatori[s]; if (g && !g.via && !g.puntata && !fatto[k + n]) { var h = W.reteDi(n); if (h) { h.invia({ t: "mossa", kind: "punta", val: 100 }); fatto[k + n] = 1; } } });
          if (v.giocatori[0] && !v.giocatori[0].puntata) W.clicca(Pw, /^Punta /);
        } else if (v.fase === "assic") {
          ["Giulia", "Luca"].forEach(function (n) { var h = W.reteDi(n); if (h && !fatto[k + n]) { h.invia({ t: "mossa", kind: "assic", si: false }); fatto[k + n] = 1; } });
          W.clicca(Pw, /^No$/);
        } else if (v.fase === "gioca") {
          if (v.turno === 0) W.clicca(Pw, /^Stai$/);
          else ["Giulia", "Luca"].forEach(function (n) { if (seatDi(n) === v.turno && !fatto[k + n + (v.giocatori[v.turno].attiva)]) { var h = W.reteDi(n); if (h) { h.invia({ t: "mossa", kind: "azione", mossa: "stai" }); fatto[k + n + (v.giocatori[v.turno].attiva)] = 1; } } });
        } else if (v.fase === "esito" && mani < nMani) W.clicca(Pw, /Nuova mano/);
        // durante la prima mano: Giulia ricarica
        if (!ricaricata && mani === 0 && v.fase === "gioca") {
          ricaricata = true; var id0 = mioId("Giulia"); await W.ricarica("Giulia");
          var ok = await W.aspetta(function () { return mioId("Giulia") === id0 && W.finestra("Giulia").document.querySelector(".bj-hero, .bj-tavolo, [class*='bj-']") && !W.finestra("Giulia").document.querySelector(".saletta-schermo"); }, 8000);
          await W.dorme(3500);
          if (/prossima|guardi/.test(pill(W.finestra("Giulia")))) difetti.push("dopo la ricarica Giulia legge «" + pill(W.finestra("Giulia")) + "» ma ha il suo posto");
          nota("Giulia ricarica a metà mano: " + (ok ? "ritrova il tavolo" : "NON ritrova il tavolo: " + T(W.finestra("Giulia")).slice(0, 60)) + " (pillole: " + (pill(W.finestra("Giulia")) || "-") + ")");
        }
        if (!spento && mani === 1 && v.fase === "punta") { spento = true; tSp = Date.now(); W.spegni("Luca"); }
        if (spento && !riacceso && Date.now() - tSp > 25000) { riacceso = true; W.riaccendi("Luca"); nota("Luca spento 25 s: mani giocate " + mani + ", Luca via=" + !!(vm(C).giocatori[seatDi("Luca")] || {}).via); }
        await W.dorme(300);
      }
      return mani >= nMani;
    }
    if (!await giocaFinoA(4, 240000)) no("le mani non vanno avanti (fase " + vm(C).fase + ", mani " + mani + ") · " + note.join(" · "));
    // Giulia può ancora giocare dopo la ricarica? (deve poter puntare da sola sul suo telefono)
    var gw = W.finestra("Giulia");
    nota("Giulia dopo la ricarica, alla mano " + mani + ": " + (seatDi("Giulia") >= 0 ? "seat " + seatDi("Giulia") : "senza posto"));
    // l'host ricarica (Passo 5): la partita riprende, stessi posti e stesse fiches, nessuno in saletta; poi un'altra mano
    await W.dorme(900);
    var nomi0 = (vm(C).giocatori || []).map(function (g) { return g.nome; }).join(","), fiches0 = (vm(C).giocatori || []).map(function (g) { return g.fiches; }).join(",");
    var r = await ripresaHost(C, ["Giulia", "Luca"], "ricarica", function (v) {
      var gg = v.giocatori || [];
      if (gg.map(function (g) { return g.nome; }).join(",") !== nomi0) return "posti diversi (" + gg.map(function (g) { return g.nome; }).join(",") + " / " + nomi0 + ")";
      if (gg.map(function (g) { return g.fiches; }).join(",") !== fiches0) return "fiches diverse (" + gg.map(function (g) { return g.fiches; }).join(",") + " / " + fiches0 + ")";
      return true;
    });
    nota("host ricarica: partita ripresa in " + r.dt + " s con " + nomi0);
    mani = 0; ultimaFase = vm(C).fase; fatto = {};
    if (!await giocaFinoA(1, 60000)) no("dopo la ripresa la mano non va avanti (fase " + vm(C).fase + ") · " + note.join(" · "));
    var vv = sent.stop(); if (vv.length) nota("schermate viste: " + vv.join("; "));
    if (difetti.length) no(difetti.join("; ") + " (blackjack.js: nelle foto della partita mancano gli id dei giocatori) · " + note.join(" · "));
    return note.join(" · ");
  } };

  function codS(w) { var b = w.document.querySelector(".sl-cod b"); return b && /^[A-Z0-9]{4}$/.test(b.textContent) ? b.textContent : null; }

  // ---------- 105 L'host chiude apposta ----------
  S[105] = { nome: "L'host chiude apposta: l'ospite che ricarica non prova a rientrare", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
    var G = await W.apriTel("Giulia", { hash: "gioco=tris&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return vm(C).avvId && dentro(G); }, 6000)) no("Giulia non entra");
    W.clicca(P, /‹/, ".testa button");   // l'host chiude la stanza (la conferma risponde sì da sola)
    await W.dorme(1500);
    var visto = T(G).slice(0, 70);
    G = await W.ricarica("Giulia"); await W.dorme(10000);
    var rientra = /Rientra nella partita/.test(W.testo(G)), ferma = !!G.document.querySelector(".sg-ferma");
    if (ferma || rientra || !G.document.querySelector(".home")) no("dopo la ricarica: «" + T(G).slice(0, 90) + "» (rientra " + rientra + ", ferma " + ferma + ")");
    await W.ricarica("Paky"); await W.dorme(1500);
    if (W.finestra("Paky").document.querySelector(".sl-cod")) no("l'host che ha chiuso apposta, ricaricando, riapre la stanza");
    return "chiusa: Giulia legge «" + visto + "»; ricaricando va in home senza «Rientra»; l'host ricaricando non riapre";
  } };

  // ---------- 106 Parola d'ordine: host di riserva ----------
  // (dal Passo 5 il cambio di host lo fa il core: riprende + riserva; vedi anche passo5/ordine.js 580-582)
  S[106] = { nome: "Parola d'ordine: l'host sparisce a metà partita, un amico la porta avanti; l'host torna e rientra", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Parola d'ordine");
    var amici = ["Giulia", "Luca", "Sara"];
    for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], { hash: "gioco=ordine&stanza=" + C, x: 185 * (i + 1) });
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 4; }, 8000)) no("non entrano in 4");
    W.clicca(P, /Squadre a caso/); await W.dorme(600);
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/); }, 4000)) no("niente Comincia");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 9000)) no("non comincia (" + vm(C).fase + ")");   // (c'è il 3-2-1-Via!)
    await W.dorme(3000);
    // (Passo 5: l'host di riserva è del core: chi tiene la partita sta nella foto, _g = il cambio, _h = il suo id)
    var s0 = W.statoStanza(C) || {}, gen0 = s0._g || 0;
    W.spegni("Paky");
    var t0 = Date.now();
    var nuovo = await W.aspetta(function () { var s = W.statoStanza(C) || {}, v = s.vm || s; return (s._g || 0) > gen0 && v.fase === "gioco" && s._h && s._h !== "host" && s; }, 40000, 250);
    if (!nuovo) no("nessun amico ha preso il posto (_g " + (W.statoStanza(C) || {})._g + ", _h " + (W.statoStanza(C) || {})._h + ")");
    var chi = ((nuovo.vm || nuovo).players || []).filter(function (p) { return p.id === nuovo._h; })[0], dt = ((Date.now() - t0) / 1000).toFixed(1);
    await W.dorme(8000);
    var sbagli = amici.filter(function (n) { var w = W.finestra(n); return w.document.querySelector(".sg-ferma") || /Ops|chiusa|Problema/.test(W.testo(w)) || w.document.querySelector(".saletta-schermo"); });
    if (sbagli.length) no("dopo il cambio di host: " + sbagli.map(function (n) { return n + ": " + T(W.finestra(n)).slice(0, 50); }).join("; "));
    await W.chiudiApp("Paky");   // l'host di prima riapre l'app: rientra come giocatore
    var torna = await W.aspetta(function () { var v = vm(C), w = W.finestra("Paky"); return v.fase === "gioco" && !w.document.querySelector(".sl-cod") && !w.document.querySelector(".saletta-schermo") && (v.players || []).some(function (p) { return p.nome === "Paky" && !p.via; }); }, 12000);
    var pv = (vm(C).players || []).map(function (p) { return p.nome + (p.via ? "(via)" : ""); }).join(", ");
    if (!torna) no("subentra " + (chi && chi.nome) + " in " + dt + " s, ma Paky non rientra: «" + T(W.finestra("Paky")).slice(0, 80) + "» giocatori: " + pv);
    return "subentra " + (chi && chi.nome) + " in " + dt + " s, gli amici continuano; Paky riapre l'app e rientra come giocatore (" + pv + ")";
  } };

  // ---------- 108 L'host ricarica due volte di fila ----------
  S[108] = { nome: "L'host ricarica due volte di fila", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
    await W.apriTel("Giulia", { hash: "gioco=tris&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return vm(C).avvId && dentro(W.finestra("Giulia")); }, 6000)) no("Giulia non entra");
    var t0 = Date.now();
    await W.ricarica("Paky"); await W.dorme(400); await W.ricarica("Paky");
    if (!await W.aspetta(function () { return codS(W.finestra("Paky")) === C && vm(C).avvId && dentro(W.finestra("Giulia")); }, 10000)) no("dopo due ricariche: " + T(W.finestra("Giulia")).slice(0, 80));
    return "tutti in saletta " + C + " in " + ((Date.now() - t0) / 1000).toFixed(1) + " s";
  } };

  // ---------- 110 Linea del tempo: l'host ricarica durante il voto ----------
  S[110] = { nome: "Linea del tempo: l'host ricarica durante il voto, la partita riprende (stessi punti, tutti dentro) e si gioca", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La linea del tempo");
    await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185 });
    await W.apriTel("Luca", { hash: "gioco=timeline&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 8000)) no("non entrano in 3");
    var sent = sentinella(["Paky", "Giulia", "Luca"]);
    W.clicca(P, /Comincia/);
    var slot = await W.aspetta(function () { return vm(C).fase === "turno" && P.document.querySelector(".tl-slot"); }, 30000);
    if (!slot) no("il primo turno non arriva");
    slot.click(); await W.dorme(200); var conf = P.document.querySelector(".tl-conferma"); if (conf) conf.click();
    if (!await W.aspetta(function () { return vm(C).fase === "votazione"; }, 8000)) no("niente votazione");
    var punti = function () { return (vm(C).giocatori || []).map(function (g) { return g.nome + g.punti; }).join(","); };
    var prima = punti(), t0 = Date.now(), pg = "";
    P = await W.ricarica("Paky");
    // la Linea del tempo (riprende: true) riprende la partita: "🔁 Partita ripresa!", poi lo stesso turno con tutti dentro
    var okR = await W.aspetta(function () { var p = pill(W.finestra("Giulia")); if (/tornato/.test(p)) pg = p; return vm(C).fase === "ripresa"; }, 10000);
    if (!okR) no("dopo la ricarica la partita non riprende (fase " + vm(C).fase + ", Giulia: " + T(W.finestra("Giulia")).slice(0, 80) + ")");
    var ok = await W.aspetta(function () { var p = pill(W.finestra("Giulia")); if (/tornato/.test(p)) pg = p; var x = vm(C); return (x.fase === "turno" || x.fase === "votazione") && (x.giocatori || []).length === 3 && x.giocatori.every(function (g) { return !g.via; }); }, 15000);
    if (!ok) no("dopo la ripresa non sono tutti di nuovo in gioco (fase " + vm(C).fase + ", " + (vm(C).giocatori || []).map(function (g) { return g.nome + (g.via ? " via" : ""); }).join(",") + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    if (punti() !== prima) no("punti cambiati: " + prima + " → " + punti());
    if (!/riprende da dove era/.test(pg)) no("Giulia non legge «la partita riprende da dove era» (" + (pg || "niente") + ")");
    // si gioca: il turno dopo la ripresa arriva fino all'esito
    var fine = Date.now() + 40000, visto = false;
    while (Date.now() < fine && !visto) {
      var v = vm(C), Pw = W.finestra("Paky");
      if (v.fase === "esito") visto = true;
      else if (v.fase === "turno") { if (v.turnoId === "host") { var sl = Pw.document.querySelector(".tl-slot"); if (sl) { sl.click(); await W.dorme(150); var cf = Pw.document.querySelector(".tl-conferma"); if (cf && !cf.disabled) cf.click(); } } else ["Giulia", "Luca"].forEach(function (n) { if (mioId(n) === v.turnoId) W.reteDi(n).invia({ t: "scelta", gap: 0, n: v.n }); }); }
      else if (v.fase === "votazione") { ["Giulia", "Luca"].forEach(function (n) { if (mioId(n) !== v.turnoId) W.reteDi(n).invia({ t: "voto", d: true, n: v.n }); }); if (v.turnoId !== "host") W.clicca(Pw, /Giusto/); }
      await W.dorme(400);
    }
    if (!visto) no("dopo la ripresa il turno non arriva all'esito (fase " + vm(C).fase + ")");
    var sbagli = ["Giulia", "Luca"].filter(function (n) { var w = W.finestra(n); return w.document.querySelector(".saletta-schermo") || /prossima|guardi/.test(pill(w)); });
    var vv = sent.stop();
    if (sbagli.length) no("dopo la ripresa " + sbagli.join(", ") + " non giocano (" + sbagli.map(function (n) { return pill(W.finestra(n)) || T(W.finestra(n)).slice(0, 50); }).join("; ") + ")");
    if (vv.length) no("schermate viste: " + vv.join("; "));
    return "partita ripresa in " + dt + " s con gli stessi punti e tutti dentro, Giulia legge «" + pg + "»; il turno arriva all'esito";
  } };

  // ---------- 111 Tris: l'avversario ha il telefono spento più di 20 s ----------
  S[111] = { nome: "Tris: l'avversario spento 25 s (l'host lo toglie), poi torna", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
    await W.apriTel("Giulia", { hash: "gioco=tris&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return vm(C).avvId && dentro(W.finestra("Giulia")); }, 6000)) no("Giulia non entra");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 4000)) no("non comincia");
    W.spegni("Giulia"); await W.dorme(25000);
    var dopo = vm(C).fase + " avv " + vm(C).avvId, hostVede = T(W.finestra("Paky")).slice(0, 70);
    W.riaccendi("Giulia");
    var ok = await W.aspetta(function () { return vm(C).avvId === mioId("Giulia") && (dentro(W.finestra("Giulia")) || vm(C).fase === "gioco"); }, 15000);
    var gv = T(W.finestra("Giulia")).slice(0, 70);
    if (!ok) no("Giulia tornata non rientra (" + gv + " · pillole " + (pill(W.finestra("Giulia")) || "-") + ") · dopo 25 s: " + dopo + " · host: " + hostVede);
    return "dopo 25 s: " + dopo + " (host: «" + hostVede + "»); Giulia tornata: «" + gv + "»";
  } };

  // ---------- 109 Sala: l'amico ricarica ----------
  S[109] = { nome: "Sala: l'amico ricarica (nella Sala e dentro un gioco)", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    W.clicca(P, /Sala online/); var SC = await W.aspetta(function () { return codS(P); }, 5000);
    await W.apriTel("Giulia", { hash: "sala=" + SC, x: 185 });
    if (!await W.aspetta(function () { return (vm(SC).membri || []).length === 2; }, 6000)) no("Giulia non entra nella Sala");
    var id0 = vm(SC).membri[1].id;
    await W.ricarica("Giulia");
    if (!await W.aspetta(function () { var w = W.finestra("Giulia"); return /Sala online/.test(W.testo(w)) && w.document.querySelector(".saletta-schermo") && dentro(w); }, 8000)) no("dopo la ricarica Giulia non è nella Sala: " + T(W.finestra("Giulia")).slice(0, 80));
    var mem = (vm(SC).membri || []).map(function (m) { return m.nome + ":" + m.id; });
    if (mem.length !== 2 || vm(SC).membri[1].id !== id0) no("membri dopo la ricarica: " + mem.join(", "));
    W.clicca(P, /Scegli (un|il primo) gioco|Prossimo gioco/); await W.dorme(300);
    var tess = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".tessera"), function (t) { return (t.querySelector("h2") || {}).textContent === "La Scalinata"; }); }, 4000);
    if (!tess) no("niente Scalinata nella Sala");
    tess.click(); await W.dorme(250); W.clicca(P, /Comincia per tutti/);
    var C = await W.aspetta(function () { var c = codS(P); return c && c !== SC ? c : null; }, 5000);
    if (!await W.aspetta(function () { return ((vm(C).posti) || []).length === 2; }, 8000)) no("Giulia non entra nel gioco");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "scelta"; }, 5000)) no("il gioco non comincia");
    await W.ricarica("Giulia");
    if (!await W.aspetta(function () { var w = W.finestra("Giulia"); return /gradin/i.test(W.testo(w)) && !w.document.querySelector(".saletta-schermo"); }, 10000)) no("ricaricando dentro il gioco della Sala Giulia non torna nella partita: «" + T(W.finestra("Giulia")).slice(0, 80) + "»");
    return "Giulia ricarica nella Sala: stesso posto (" + mem.join(", ") + "); ricarica nel gioco: torna nella partita";
  } };
})();

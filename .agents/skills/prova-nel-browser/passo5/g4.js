// PROVE DEL PASSO 5, GRUPPO 4 (giochi col motore che riprendono): Black Jack, Poker, Scopa 2 vs 2, Patata Bollente.
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("passo5/g4.js"); await COPIONE.prova(561)      (oppure await COPIONE.gruppo5g4(): 560-564 in fila)
// Tutte col percorso di prima (stanza di un gioco solo: i telefoni finti partono con sg-sala-sempre = "0").
// 560 Black Jack in 3 (la 104 di prima con l'id giusto): Giulia ricarica a metà mano e punta di nuovo dal suo telefono,
//     Luca spento 25 s, 4 mani intere; poi l'host ricarica: la partita RIPRENDE (niente saletta) e si gioca un'altra mano.
// 561 Black Jack: l'host ricarica a metà mano → stesse carte, stesse puntate, stesse fiches, tocca a chi toccava; finita la
//     mano le fiches e la mano giocata si salvano una volta sola (host e Giulia uguali).
// 562 Poker: l'host ricarica al turno → stessa mano, stesse carte in mano (Giulia le ha ancora), stesso piatto; si va avanti.
// 563 Scopa 2 vs 2 (Paky e Giulia + 2 Bot): l'host ricarica a metà mano → stesse carte a tutti, stesso tavolo, stessi punti;
//     i Bot ripartono dal loro turno e si continua a giocare.
// 564 Patata: l'host ricarica con la bomba in mano a un amico → la bomba resta a lui col tempo intero (non scoppia durante la
//     ricarica), poi se la passano.
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T;
  var aggiungi = COPIONE.aggiungi.bind(COPIONE);
  function no(p) { throw new Error(p); }
  function vm(c) { return A.vm(c); }
  function ripresaDi(nome) { try { return JSON.parse(W.BR.mem[nome].l["sg-ripresa"] || "null"); } catch (e) { return null; } }
  function pill(w) { return [].map.call(w.document.querySelectorAll(".sg-pillola"), function (x) { return x.textContent; }).join(" | "); }
  function errori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / ")); }

  // ---- il profilo finto che ricorda le fiches (come la nube vera): salvaFiches/salvaProgressi si contano per telefono ----
  // W.__nube[nome] = { fiches, nFiches, mani }   (mani: le mani di Black Jack salvate, cioè salvaProgressi con dei contatori)
  function spiaNube(w) {
    var nome = String((w.frameElement && w.frameElement.id) || "").replace(/^tel-/, "");
    W.__nube = W.__nube || {};
    var N = W.__nube[nome] = W.__nube[nome] || { fiches: 1000, nFiches: 0, mani: 0 };
    var V = w.SGNube; if (!V) return;
    V.fiches = function () { return N.fiches; };
    V.salvaFiches = function (g, f) { N.nFiches++; if (typeof f === "number") N.fiches = f; return Promise.resolve(); };
    V.salvaProgressi = function (f, gioco, incr) {
      if (typeof f === "number") N.fiches = f;
      if (gioco === "blackjack" && Array.isArray(incr) && incr.length) N.mani++;
      return Promise.resolve();
    };
  }
  function nube(nome) { return (W.__nube || {})[nome] || {}; }

  // ---------- BLACK JACK: le mosse a copione ----------
  function seatDi(C, n) { return (vm(C).giocatori || []).findIndex(function (g) { return g.nome === n; }); }
  // un passo del tavolo: chi deve decidere decide (ospiti dalla rete, host coi tasti). fatto = memoria delle mosse già mandate
  function passoBJ(C, ospiti, fatto) {
    var v = vm(C), Pw = W.finestra("Paky"), k = (v.giro || 0) + "|" + v.fase + "|" + v.turno;
    if (v.fase === "punta") {
      ospiti.forEach(function (n) { var g = v.giocatori[seatDi(C, n)]; if (g && !g.via && !g.puntata && !fatto[k + n]) { var h = W.reteDi(n); if (h) { h.invia({ t: "mossa", kind: "punta", val: 100 }); fatto[k + n] = 1; } } });
      var io = v.giocatori[seatDi(C, "Paky")]; if (io && !io.puntata) W.clicca(Pw, /^Punta /);
    } else if (v.fase === "assic") {
      ospiti.forEach(function (n) { var h = W.reteDi(n); if (h && !fatto[k + n]) { h.invia({ t: "mossa", kind: "assic", si: false }); fatto[k + n] = 1; } });
      W.clicca(Pw, /^No$/);
    } else if (v.fase === "gioca") {
      if (v.turno === seatDi(C, "Paky")) W.clicca(Pw, /^Stai$/);
      else ospiti.forEach(function (n) { var g = v.giocatori[v.turno]; if (seatDi(C, n) === v.turno && !fatto[k + n + g.attiva]) { var h = W.reteDi(n); if (h) { h.invia({ t: "mossa", kind: "azione", mossa: "stai" }); fatto[k + n + g.attiva] = 1; } } });
    }
  }
  function carteBJ(v) { return JSON.stringify((v.giocatori || []).map(function (g) { return [g.nome, g.fiches, g.puntata, g.mani.map(function (m) { return m.carte.map(function (c) { return c.v + "" + c.s; }).join(","); })]; })) + "|" + JSON.stringify((v.banco || [])[0] || null); }

  // ---- 560 Black Jack in 3 (la 104 con l'id giusto e la ripresa) ----
  aggiungi(560, { nome: "Black Jack in 3: Giulia ricarica e punta di nuovo, Luca spento 25 s, 4 mani; l'host ricarica e la partita riprende", fai: async function () {
    var note = [];
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Black Jack");
    await W.apriTel("Giulia", { hash: "gioco=blackjack&stanza=" + C, x: 185 });
    await W.apriTel("Luca", { hash: "gioco=blackjack&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 8000)) no("non entrano in 3");
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/); }, 4000)) no("l'host non ha «Comincia»");
    var mani = 0, ultimaFase = "", fatto = {}, ricaricata = false, spento = false, tSp = 0, riacceso = false, provato = false, difetti = [];
    async function giocaFinoA(nMani, maxMs, ospiti) {
      var fine = Date.now() + maxMs;
      while (Date.now() < fine && mani < nMani) {
        var v = vm(C);
        if (v.fase === "esito" && ultimaFase !== "esito") mani++;
        ultimaFase = v.fase;
        // dopo la ricarica Giulia deve poter puntare dal suo telefono (tasto "Punta")
        if (v.fase === "punta" && ricaricata && !provato) {
          var gg = v.giocatori[seatDi(C, "Giulia")];
          if (gg && !gg.puntata) {
            await W.dorme(600); provato = true;
            var tasto = [].some.call(W.finestra("Giulia").document.querySelectorAll("button"), function (b) { return /^Punta /.test(b.textContent); });
            note.push("Giulia dopo la ricarica " + (tasto ? "ha il tasto Punta" : "NON ha il tasto Punta"));
            if (!tasto) difetti.push("dopo la ricarica Giulia non può puntare");
          }
        }
        passoBJ(C, ospiti, fatto);
        if (v.fase === "esito" && mani < nMani) W.clicca(W.finestra("Paky"), /Nuova mano/);
        if (!ricaricata && mani === 0 && v.fase === "gioca") {   // durante la prima mano: Giulia ricarica
          ricaricata = true; var id0 = A.mioId("Giulia"); await W.ricarica("Giulia");
          var ok = await W.aspetta(function () { var g = W.finestra("Giulia"); return A.mioId("Giulia") === id0 && g.document.querySelector("[class*='bj-']") && !g.document.querySelector(".saletta-schermo"); }, 8000);
          await W.dorme(3500);
          if (!ok) difetti.push("dopo la ricarica Giulia non ritrova il tavolo");
          if (/prossima|guardi/.test(pill(W.finestra("Giulia")))) difetti.push("dopo la ricarica Giulia legge «" + pill(W.finestra("Giulia")) + "» ma ha il suo posto");
          note.push("Giulia ricarica a metà mano: " + (ok ? "ritrova il tavolo" : "NO"));
        }
        if (!spento && mani === 1 && v.fase === "punta") { spento = true; tSp = Date.now(); W.spegni("Luca"); }
        if (spento && !riacceso && Date.now() - tSp > 25000) { riacceso = true; W.riaccendi("Luca"); note.push("Luca spento 25 s (via=" + !!(vm(C).giocatori[seatDi(C, "Luca")] || {}).via + ")"); }
        await W.dorme(300);
      }
      return mani >= nMani;
    }
    if (!await giocaFinoA(4, 240000, ["Giulia", "Luca"])) no("le mani non vanno avanti (fase " + vm(C).fase + ", mani " + mani + ") · " + note.join(" · "));
    if (difetti.length) no(difetti.join("; ") + " · " + note.join(" · "));
    // l'host ricarica: la partita riprende (stesso codice, niente saletta, le stesse fiches)
    await W.aspetta(function () { return vm(C).fase === "punta" || vm(C).fase === "esito"; }, 8000);
    await W.dorme(900);
    var prima = JSON.parse(JSON.stringify(vm(C))), s0 = (W.statoStanza(C) || {})._s, t0 = Date.now();
    await W.ricarica("Paky");
    var salette = {};
    var ok = await W.aspetta(function () {
      ["Giulia", "Luca"].forEach(function (n) { if (W.finestra(n).document.querySelector(".saletta-schermo")) salette[n] = 1; });
      var s = W.statoStanza(C) || {}, v = vm(C);
      return s._s && s._s !== s0 && s._r && v.giocatori && v.giocatori.length === 3 &&
        JSON.stringify(v.giocatori.map(function (g) { return g.fiches + g.puntata; })) === JSON.stringify(prima.giocatori.map(function (g) { return g.fiches + g.puntata; })) &&
        /riprende da dove era/.test(pill(W.finestra("Giulia")));
    }, 12000);
    if (!ok) no("ricarica dell'host: la partita non riprende (fase " + vm(C).fase + ", _r " + (W.statoStanza(C) || {})._r + ", pillola Giulia «" + pill(W.finestra("Giulia")) + "») · " + note.join(" · "));
    if (Object.keys(salette).length) no(Object.keys(salette).join(", ") + " è passato dalla saletta");
    note.push("host ricarica: ripresa in " + ((Date.now() - t0) / 1000).toFixed(1) + " s, stesse fiches");
    mani = 0; ultimaFase = vm(C).fase === "esito" ? "esito" : ""; fatto = {};
    if (vm(C).fase === "esito") W.clicca(W.finestra("Paky"), /Nuova mano/);
    if (!await giocaFinoA(1, 60000, ["Giulia", "Luca"])) no("dopo la ripresa la mano non va avanti (fase " + vm(C).fase + ") · " + note.join(" · "));
    errori();
    return note.join(" · ") + " · un'altra mano giocata dopo la ripresa";
  } });

  // ---- 561 Black Jack: l'host ricarica a metà mano ----
  aggiungi(561, { nome: "Black Jack: l'host ricarica a metà mano → stesse carte, puntate e fiches; mano e fiches salvate una volta", fai: async function () {
    W.__nube = {};
    var fatto = {};
    var r = await A.provaRipresa({ gioco: "blackjack", nomeTessera: "Black Jack", amici: ["Giulia"], prima: spiaNube,
      arriva: function (v) { return (v.giocatori || []).filter(function (g) { return !g.via; }).length === 2; },
      comincia: async function (C, P) {
        if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 4000)) no("l'host non ha «Comincia»");
        // si punta (e si risponde all'assicurazione) finché la mano non è in gioco con una mano aperta
        var ok = await W.aspetta(function () {
          var v = vm(C);
          if (v.fase === "gioca") { var g = v.giocatori[v.turno], m = g && g.mani[g.attiva]; if (m && !m.chiusa && m.carte.length >= 2) return true; }
          if (v.fase === "punta" || v.fase === "assic") passoBJ(C, ["Giulia"], fatto);
          return false;
        }, 30000, 250);
        if (!ok) no("la mano non arriva al gioco (fase " + vm(C).fase + ")");
      },
      fase: function (v) { return v.fase === "gioca"; },
      controlla: function (a, b) {
        if (b.fase !== "gioca") return "fase " + b.fase;
        if (b.turno !== a.turno) return "toccava a " + a.turno + " e ora a " + b.turno;
        return carteBJ(a) === carteBJ(b) ? true : "carte o fiches cambiate: " + carteBJ(a) + " → " + carteBJ(b);
      } });
    var C = r.C;
    var nF = nube("Paky").nFiches, giulia = r.prima.giocatori[seatDi(C, "Giulia")];
    if (nube("Paky").mani || nube("Giulia").mani) no("una mano salvata prima che finisca");
    // Giulia vede ancora la sua mano (le sue carte sul tavolo, il suo posto)
    if (!W.finestra("Giulia").document.querySelector("[class*='bj-']")) no("Giulia non vede più il tavolo");
    await W.dorme(1500);
    if (nube("Paky").nFiches !== nF) no("dopo la ripresa l'host risalva le fiches senza che siano cambiate");
    // si finisce la mano
    var fatto2 = {};
    var fine = await W.aspetta(function () { var v = vm(C); if (v.fase === "esito") return true; passoBJ(C, ["Giulia"], fatto2); return false; }, 40000, 300);
    if (!fine) no("dopo la ripresa la mano non finisce (fase " + vm(C).fase + ")");
    await W.dorme(1500);
    var nP = nube("Paky").mani, nG = nube("Giulia").mani;
    if (nP !== 1 || nG !== 1) no("mani salvate: Paky " + nP + ", Giulia " + nG + " (doveva essere 1 a testa)");
    var v = vm(C), fP = v.giocatori[seatDi(C, "Paky")].fiches, fG = v.giocatori[seatDi(C, "Giulia")].fiches;
    if (nube("Paky").fiches !== fP) no("nel profilo dell'host " + nube("Paky").fiches + " fiches, al tavolo " + fP);
    if (nube("Giulia").fiches !== fG) no("nel profilo di Giulia " + nube("Giulia").fiches + " fiches, al tavolo " + fG);
    errori();
    return "ripresa in " + r.dt + " s: stesse carte e puntate (Giulia " + giulia.puntata + "), tocca a chi toccava; a fine mano una mano salvata a testa, fiches giuste (Paky " + fP + ", Giulia " + fG + ")";
  } });

  // ---------- POKER ----------
  function manoDi(nome, id) { var r = ripresaDi(nome), M = r && r.stato && r.stato.poker && r.stato.poker.M; if (!M) return null; var p = M.giocatori.filter(function (x) { return x.id === id; })[0]; return p ? JSON.stringify(p.mano) : null; }
  aggiungi(562, { nome: "Poker: l'host ricarica al turno → stessa mano, stesse carte, stesso piatto; si va avanti", fai: async function () {
    var carte = {};
    var r = await A.provaRipresa({ gioco: "poker", nomeTessera: "Poker", amici: ["Giulia"],
      arriva: function (v) { return (v.players || []).filter(function (p) { return !p.bot && !p.via; }).length >= 2; },
      fase: function (v) { return v.fase === "gioco" && !!v.turno && v.stato === "preflop"; },
      prepara: async function (C) {
        await W.dorme(700);
        carte.host = manoDi("Paky", "host"); carte.giulia = manoDi("Paky", A.mioId("Giulia"));
        if (!carte.host || !carte.giulia) no("l'host non ha salvato le carte della mano");
        if (W.finestra("Giulia").document.querySelectorAll(".pk-mie > *").length < 2) no("Giulia non vede le sue carte prima della ricarica");
      },
      controlla: function (a, b) {
        if (b.n !== a.n || b.stato !== a.stato) return "mano " + a.n + "/" + a.stato + " → " + b.n + "/" + b.stato;
        if (b.turno !== a.turno) return "toccava a " + a.turno + " e ora a " + b.turno;
        if (b.piatto !== a.piatto) return "il piatto era " + a.piatto + " e ora " + b.piatto;
        var st = function (v) { return JSON.stringify(v.players.map(function (p) { return [p.id, p.stack, p.inGiro]; })); };
        return st(a) === st(b) ? true : "fiches cambiate";
      } });
    var C = r.C;
    await W.dorme(900);
    if (manoDi("Paky", "host") !== carte.host) no("le carte dell'host sono cambiate");
    if (manoDi("Paky", A.mioId("Giulia")) !== carte.giulia) no("le carte di Giulia sono cambiate");
    if (W.finestra("Giulia").document.querySelectorAll(".pk-mie > *").length < 2) no("dopo la ripresa Giulia non vede le sue carte");
    // si va avanti: chi tocca lascia, la mano finisce e ne parte un'altra
    var n0 = vm(C).n, v = vm(C);
    if (v.turno === "host") { if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /^Lascia$/, ".pk-btn"); }, 4000)) no("l'host non ha «Lascia»"); }
    else W.reteDi("Giulia").invia({ t: "azione", tipo: "lascia", tot: 0, n: v.n, st: v.stato, dc: v.daChiamare });
    if (!await W.aspetta(function () { return vm(C).n > n0 && vm(C).stato !== "finemano"; }, 20000)) no("dopo la ripresa la mano non finisce o la nuova non parte (n " + vm(C).n + ", " + vm(C).stato + ")");
    errori();
    return "ripresa in " + r.dt + " s: stessa mano " + n0 + ", stesse carte (anche quelle di Giulia), stesso piatto; poi mano " + vm(C).n + " partita";
  } });

  // ---------- SCOPA 2 VS 2 ----------
  function statoS2() { var r = ripresaDi("Paky"); return r && r.stato && r.stato.scopa2; }
  function seatS2(id) { var s = statoS2(); if (!s) return -1; for (var k = 1; k <= 3; k++) if (s.posti[k] === id) return k; return -1; }
  // un passo: se tocca a Giulia gioca la prima carta; se tocca all'host tocca la sua prima carta (e, se serve, il tavolo)
  async function mossaS2() {
    var s = statoS2(); if (!s || s.st.fase !== "gioco" || s.st.presa) return false;
    var tu = s.st.turno, gs = seatS2(A.mioId("Giulia"));
    if (tu === gs && s.st.mani[gs].length) { W.reteDi("Giulia").invia({ t: "gioca", carta: s.st.mani[gs][0].id, presa: null }); return true; }
    if (tu === 0) {
      var P = W.finestra("Paky"), mano = [].slice.call(P.document.querySelectorAll(".sc-mano-riga .sc-carta"));
      if (!mano.length) return false;
      mano[0].click(); await W.dorme(150);
      [].slice.call(P.document.querySelectorAll(".sc-terra .sc-carta")).forEach(function (c) { c.click(); });
      return true;
    }
    return false;
  }
  async function giocaS2(quante, ms) {
    var fatte = 0, fino = Date.now() + (ms || 40000), ultimo = "";
    while (Date.now() < fino && fatte < quante) {
      var s = statoS2(); if (!s) { await W.dorme(200); continue; }
      if (s.st.fase === "fineround") { W.clicca(W.finestra("Paky"), /Continua|Avanti|Prossima/); await W.dorme(600); continue; }
      if (s.st.fase === "fine") return fatte;
      var k = JSON.stringify(s.st.mani);
      if (k !== ultimo) { if (ultimo) fatte++; ultimo = k; }
      await mossaS2();
      await W.dorme(700);
    }
    return fatte;
  }
  aggiungi(563, { nome: "Scopa 2 vs 2: l'host ricarica a metà mano → stesse carte a tutti, stesso tavolo e punti; i Bot ripartono", fai: async function () {
    var primaS = null;
    var r = await A.provaRipresa({ gioco: "scopa2v2", nomeTessera: "Scopa 2 vs 2", amici: ["Giulia"],
      arriva: function (v) { return v.t === "inCorso" || ((v.seggi || []).filter(Boolean).length >= 2); },
      fase: function (v) { return v.t === "inCorso"; },
      prepara: async function () {
        var f = await giocaS2(5, 40000); if (f < 5) no("non si giocano 5 carte (" + f + ")");
        // (si ricarica quando tocca a una persona: i Bot non giocano mentre si controlla che sia tutto uguale)
        var gs0 = seatS2(A.mioId("Giulia"));
        if (!await W.aspetta(function () { var s = statoS2(); return s && !s.st.presa && s.st.fase === "gioco" && (s.st.turno === 0 || s.st.turno === gs0); }, 8000)) no("non arriva il turno di una persona");
        await W.dorme(900);
        primaS = statoS2();
        if (!primaS) no("l'host non ha salvato la partita");
      },
      controlla: function () {
        var s = statoS2(); if (!s || s === primaS) return "nessun salvataggio nuovo";
        var a = primaS.st, b = s.st;
        if (JSON.stringify(a.mani) !== JSON.stringify(b.mani)) return "le carte in mano sono cambiate";
        if (JSON.stringify(a.tavolo) !== JSON.stringify(b.tavolo) || a.mazzo.length !== b.mazzo.length) return "tavolo o mazzo cambiati";
        if (JSON.stringify(a.punti) !== JSON.stringify(b.punti) || JSON.stringify(a.prese) !== JSON.stringify(b.prese)) return "punti o prese cambiati";
        return a.turno === b.turno ? true : "toccava a " + a.turno + " e ora a " + b.turno;
      } });
    var gs = seatS2(A.mioId("Giulia"));
    if (gs < 1) no("Giulia non ha più il suo posto");
    var nG = W.finestra("Giulia").document.querySelectorAll(".sc-mano-riga .sc-carta").length, mG = statoS2().st.mani[gs].length;
    if (nG !== mG) no("sullo schermo di Giulia " + nG + " carte invece di " + mG);
    var f = await giocaS2(6, 40000);
    if (f < 6) no("dopo la ripresa non si gioca (" + f + " carte): i Bot o il turno sono fermi");
    errori();
    return "ripresa in " + r.dt + " s: stesse carte, tavolo e punti, Giulia al posto " + gs + " con " + mG + " carte; poi " + f + " carte giocate";
  } });

  // ---------- PATATA ----------
  // nella finestra dell'host: tocca il leggio di chi deve ricevere la bomba
  function toccaLeggio(w, i) { var L = w.document.querySelectorAll(".st-leggio")[i]; if (L && L.classList.contains("tocca")) { L.click(); return true; } return false; }
  aggiungi(564, { nome: "Patata: l'host ricarica con la bomba in mano a un amico → resta a lui col tempo intero, non scoppia", fai: async function () {
    var r = await A.provaRipresa({ gioco: "patata", nomeTessera: "La Patata Bollente", amici: ["Giulia", "Luca"],
      comincia: async function (C, P) {
        if (!await W.aspetta(function () { return W.clicca(P, /Comincia|Continua/); }, 4000)) no("l'host non ha «Comincia»");
        if (!await W.aspetta(function () { return vm(C).fase === "voto"; }, 15000)) no("non si vota la categoria");
        ["Giulia", "Luca"].forEach(function (n) { W.reteDi(n).invia({ t: "vota", idx: 0 }); });
        await W.dorme(400);
        if (!await W.aspetta(function () { return W.clicca(P, /Via!/); }, 20000)) no("l'host non ha «Via!»");
        if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 15000)) no("la bomba non parte");
        await W.dorme((vm(C).attesaMs || 0) + 300);   // (la foto dice quanto manca prima che il tempo della bomba parta)
        // la bomba deve stare a un amico: se ce l'ha l'host la passa a Giulia
        if (vm(C).holder === "host") {
          var ig = vm(C).players.findIndex(function (p) { return p.id === A.mioId("Giulia"); });
          if (!await W.aspetta(function () { return toccaLeggio(W.finestra("Paky"), ig); }, 4000)) no("l'host non riesce a passare la bomba");
          if (!await W.aspetta(function () { return vm(C).holder !== "host"; }, 3000)) no("la bomba resta all'host");
        }
      },
      fase: function (v) { return v.fase === "gioco" && v.holder && v.holder !== "host"; },
      salva: 700,
      controlla: function (a, b) {
        if (b.fase !== "gioco") return "fase " + b.fase + (b.boom ? " (è scoppiata durante la ricarica)" : "");
        if (b.holder !== a.holder) return "la bomba era a " + a.holder + " e ora a " + b.holder;
        if (b.categoria !== a.categoria) return "categoria cambiata";
        if (b.remaining !== b.cap) return "il tempo non è intero (" + b.remaining + " su " + b.cap + ")";
        if (!(b.attesaMs > 1000)) return "nessun respiro prima che il tempo riparta (" + b.attesaMs + " ms)";
        var vive = function (v) { return JSON.stringify(v.players.map(function (p) { return [p.id, p.eliminato, p.vite]; })); };
        return vive(a) === vive(b) ? true : "vite o eliminati cambiati";
      } });
    var C = r.C, chi = r.prima.holder, nome = chi === A.mioId("Giulia") ? "Giulia" : "Luca", altro = nome === "Giulia" ? "Luca" : "Giulia";
    // dopo il respiro chi ha la bomba la passa all'altro amico
    await W.dorme((vm(C).attesaMs || 0) + 500);   // (il respiro dopo la ripresa)
    if (vm(C).fase !== "gioco" || vm(C).holder !== chi) no("dopo il respiro la bomba non è più a " + nome + " (fase " + vm(C).fase + ")");
    W.reteDi(nome).invia({ t: "passa", target: A.mioId(altro) });
    if (!await W.aspetta(function () { return vm(C).holder === A.mioId(altro); }, 4000)) no(nome + " non riesce a passare la bomba a " + altro + " dopo la ripresa");
    if (!W.finestra(nome).document.querySelector(".st-leggio")) no(nome + " non vede più lo studio");
    errori();
    return "ripresa in " + r.dt + " s: la bomba resta a " + nome + " col tempo intero (" + r.dopo.cap / 1000 + " s) e " + Math.round(r.dopo.attesaMs / 100) / 10 + " s di respiro; poi " + nome + " la passa a " + altro;
  } });

  COPIONE.gruppo5g4 = async function () { var out = []; var l = [560, 561, 562, 563, 564]; for (var i = 0; i < l.length; i++) out.push(await COPIONE.prova(l[i])); return out; };
})();

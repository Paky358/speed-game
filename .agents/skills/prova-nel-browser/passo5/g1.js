// PROVE DEL PASSO 5, GRUPPO 1 (giochi a due che riprendono): Tris, Drop 4, Scopa, Battaglia Navale, Calcio Biliardo.
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("passo5/g1.js"); await COPIONE.prova(530)      (oppure await COPIONE.gruppo5g1(): 530-537, 532b e 536b in fila)
// Tutte col percorso di prima (stanza di un gioco solo: i telefoni finti partono con sg-sala-sempre = "0") e l'aiuto
// comune provaRipresa: l'host ricarica la pagina a metà partita, la stanza si riapre con lo stesso codice, la foto nuova
// dice _r, nessuno passa dalla saletta, gli amici leggono «🔁 Paky è tornato: la partita riprende da dove era».
// 530 Tris: ricarica dell'host dopo 3 mosse → stesse 3 mosse, tocca a chi toccava; si finisce e si fa la rivincita.
// 531 Drop 4: ricarica dell'host a metà partita e poi sulla fine (niente esito doppio, si fa la rivincita).
// 532 Scopa: ricarica dell'host a metà smazzata → stesse carte in mano a tutti e due, stesso tavolo, stessi punti.
// 533 Navale: ricarica dell'host mentre sistema le navi (Giulia già pronta): l'host ritrova le navi messe, Giulia non rifà niente.
// 534 Navale: ricarica dell'host in battaglia → stessi colpi, stesse navi, stesso turno; si va avanti a sparare.
// 535 Navale: ricarica dell'OSPITE mentre sistema (3 navi messe) → le ritrova; dopo «Pronto» ricarica ancora → non le rifà;
//     poi ricarica l'host prima di avere la flotta di Giulia: Giulia gliela rimanda da sola. A fine partita la chiave sparisce.
// 536 Calcio Biliardo: ricarica dell'host dopo un gol → stessi gol, stesso turno, si continua a tirare.
// 532b Scopa in tre (3 telefoni): ricarica dell'host a metà mano → stesso tavolo, stessi posti, tocca a chi toccava.
// 536b Calcio Biliardo: ricarica dell'host col tiro in volo → il tiro non vale, stesse pedine, chi tirava rifà la mira.
// 537 Tris con chi guarda (Luca): durante la ripresa Luca continua a guardare, mai «Tocca a te».
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T;
  var aggiungi = COPIONE.aggiungi.bind(COPIONE);
  function no(p) { throw new Error(p); }
  function vm(c) { return A.vm(c); }
  function premi(w, nodo, x, y, tipo, id) {
    var Ev = w.PointerEvent || w.MouseEvent;
    nodo.dispatchEvent(new Ev(tipo, { clientX: x, clientY: y, pointerId: id || 7, pointerType: "touch", bubbles: true, cancelable: true, isPrimary: true }));
  }
  function ripresaDi(nome) { try { return JSON.parse(W.BR.mem[nome].l["sg-ripresa"] || "null"); } catch (e) { return null; } }
  function pieni(b) { return (b || []).filter(Boolean).length; }

  // l'host apre la stanza di un gioco (percorso di prima) toccando prima le scelte delle regole (es. [/Una mano/])
  async function apriCon(w, tessera, scelte) {
    // (aperto col link del gioco, #gioco=…: si è già in «Come giocate?»)
    var gia = await W.aspetta(function () { return /apro io/.test(T(w)) || w.document.querySelector(".tessera"); }, 5000);
    if (!gia) no("non trovo né la home né «Come giocate?» di " + tessera);
    if (!/apro io/.test(T(w))) {
      var tess = await W.aspetta(function () { return [].slice.call(w.document.querySelectorAll(".tessera")).filter(function (t) { return (t.querySelector("h2") || {}).textContent === tessera; })[0]; }, 5000);
      if (!tess) no("non trovo la tessera " + tessera);
      tess.click(); await W.dorme(200);
    }
    if (!W.clicca(w, /apro io/)) no("non trovo «Online: apro io la stanza» di " + tessera);
    await W.dorme(250);
    (scelte || []).forEach(function (re) { if (!W.clicca(w, re, ".modo-chip")) no("nelle regole di " + tessera + " non trovo " + re); });
    if (!W.clicca(w, /Apri la stanza/)) no("non trovo «Apri la stanza» di " + tessera);
    var C = await W.aspetta(function () { var b = w.document.querySelector(".sl-cod b"); return b && /^[A-Z0-9]{4}$/.test(b.textContent) ? b.textContent : null; }, 5000);
    if (!C) no("la stanza di " + tessera + " non ha il codice");
    return C;
  }

  // ---- le mosse a copione (H tiene la stanza, B è l'avversario; si fermano dopo "quante" mosse o alla fine) ----
  async function mosseTris(C, H, B, quante) {
    var fatte = 0, fino = Date.now() + 30000;
    while (Date.now() < fino && vm(C).fase !== "fine" && fatte < quante) {
      var v = vm(C), w = W.finestra(v.turno === "X" ? H : B);
      if (v.fase === "gioco") {
        var celle = w.document.querySelectorAll(".tr-cella"), k = (v.board || []).indexOf(null), n0 = pieni(v.board);
        if (k >= 0 && celle[k] && !celle[k].disabled) { celle[k].click(); fatte++; await W.aspetta(function () { return pieni(vm(C).board) > n0 || vm(C).fase === "fine"; }, 3000); continue; }
      }
      await W.dorme(120);
    }
    return fatte;
  }
  async function mosseDrop(C, H, B, quante) {
    var fatte = 0, fino = Date.now() + 40000;
    while (Date.now() < fino && vm(C).fase !== "fine" && fatte < quante) {
      var v = vm(C);
      if (v.fase === "gioco") {
        var w = W.finestra(v.turno === "G" ? H : B), tav = w.document.querySelector(".d4-tav"), area = w.document.querySelector(".d4-area");
        var pref = v.turno === "G" ? [0, 2, 4, 6, 1, 3, 5] : [1, 3, 5, 2, 4, 6, 0];
        var col = pref.filter(function (c) { return v.board[c] == null; })[0];
        if (tav && area && col != null) {
          var r = tav.getBoundingClientRect(), x = r.left + (col + 0.5) * r.width / 7, y = r.top + r.height / 2, n0 = pieni(v.board);
          premi(w, area, x, y, "pointerdown"); premi(w, area, x, y, "pointerup"); fatte++;
          await W.aspetta(function () { return pieni(vm(C).board) > n0 || vm(C).fase === "fine"; }, 3000);
          await W.dorme(450);
          continue;
        }
      }
      await W.dorme(150);
    }
    return fatte;
  }
  // Scopa: B manda la sua carta (la presa la sceglie il gioco), H tocca le sue
  async function mosseScopa(C, H, B, quante) {
    var P = W.finestra(H), fatte = 0, fino = Date.now() + 60000;
    while (Date.now() < fino && fatte < quante) {
      var v = vm(C);
      if (v.fase === "fine") return fatte;
      if (v.mano) {
        if (v.fase === "gioco" && !v.presa && v.turno === v.io && v.mano.length) {   // tocca a B (la foto è la sua)
          var t0 = JSON.stringify(v.mano);
          W.reteDi(B).invia({ t: "gioca", carta: v.mano[0].id, presa: null }); fatte++;
          await W.aspetta(function () { return JSON.stringify(vm(C).mano) !== t0 || vm(C).fase !== "gioco"; }, 3000);
          continue;
        }
        var mens = P.document.querySelector(".sc-mensola.tuo");
        if (v.fase === "gioco" && !v.presa && v.turno !== v.io && mens) {
          var mano = [].slice.call(P.document.querySelectorAll(".sc-mano-riga .sc-carta")), tav = [].slice.call(P.document.querySelectorAll(".sc-terra .sc-carta"));
          var nTav = (v.tavolo || []).length;
          if (mano.length) {
            mano[0].click(); await W.dorme(120);
            if (mano[0].classList.contains("sel")) tav.forEach(function (c) { c.click(); });
            fatte++;
            await W.aspetta(function () { var x = vm(C); return x.turno === x.io || x.fase !== "gioco" || (x.tavolo || []).length !== nTav; }, 3000);
            continue;
          }
        }
        if (v.fase === "fineround") W.clicca(P, /Continua/);
      }
      await W.dorme(200);
    }
    return fatte;
  }
  // Navale: un colpo per volta (H tocca il campo, B manda il colpo); B ha le navi in fila sulle righe pari
  var NAVI_B = [{ x: 0, y: 0, o: 1 }, { x: 0, y: 2, o: 1 }, { x: 0, y: 4, o: 1 }, { x: 0, y: 6, o: 1 }, { x: 0, y: 8, o: 1 }];
  function bersagliB() { var l = [], lens = [5, 4, 3, 3, 2]; NAVI_B.forEach(function (n, k) { for (var i = 0; i < lens[k]; i++) l.push({ x: n.x + i, y: n.y }); }); return l; }
  async function colpiNavale(C, H, B, quante) {
    var P = W.finestra(H), fatte = 0, fino = Date.now() + 40000, bers = bersagliB();
    var mare = []; for (var y = 9; y >= 0; y--) for (var x = 9; x >= 0; x--) mare.push({ x: x, y: y });
    while (Date.now() < fino && vm(C).fase !== "fine" && fatte < quante) {
      var v = vm(C);
      if (v.fase === "battaglia") {
        var n0 = v.n;
        if (v.tocca === 0) {
          var b = bers.filter(function (c) { return v.campi[1].charAt(c.y * 10 + c.x) === "0"; })[0];
          var cel = b && [].filter.call(P.document.querySelectorAll(".nav-board:not(.nav-mini) .nav-c"), function (d) { return d._i === b.y * 10 + b.x; })[0];
          if (cel) cel.click();
        } else {
          var m = mare.filter(function (c) { return v.campi[0].charAt(c.y * 10 + c.x) === "0"; })[0];
          if (m) W.reteDi(B).invia({ t: "colpo", x: m.x, y: m.y, n: v.n });
        }
        fatte++;
        await W.aspetta(function () { return vm(C).n !== n0 || vm(C).fase === "fine"; }, 3000);
        continue;
      }
      await W.dorme(150);
    }
    return fatte;
  }
  // una casella del mare grande (sistemare le navi): un tocco = anteprima, il secondo = nave messa
  function casella(w, x, y) { return [].filter.call(w.document.querySelectorAll(".nav-board:not(.nav-mini) .nav-c"), function (d) { return d._i === y * 10 + x; })[0]; }
  async function mettiNave(w, x, y) {
    var c = casella(w, x, y); if (!c) no("non trovo la casella " + x + "," + y);
    c.click(); await W.dorme(80); c = casella(w, x, y); c.click(); await W.dorme(120);
  }
  function naviFatte(w) { return w.document.querySelectorAll(".nav-nave.fatta").length; }
  // Calcio: tirano tutti e due col Bot del gioco; H col dito finto, B manda il tiro
  async function tiriCalcio(C, H, B, finche) {
    var fino = Date.now() + 150000, ultimo = -1;
    while (Date.now() < fino && vm(C).fase !== "fine" && !finche(vm(C))) {
      var v = vm(C);
      if (v.fase === "gioco" && v.stato === "mira" && v.st && v.n !== ultimo) {
        var w = W.finestra(v.turno === 0 ? H : B), CB = w.__CB, z = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var s = { x: v.st.x.slice(), y: v.st.y.slice(), vx: z.slice(), vy: z.slice() };
        var sc = CB.sceltaBot(s, v.turno, "difficile", v.solo || null);
        var vx = Math.cos(sc.a) * CB.VMAX * sc.p, vy = Math.sin(sc.a) * CB.VMAX * sc.p;
        ultimo = v.n;
        if (v.turno === 1) W.reteDi(B).invia({ t: "tiro", i: sc.i, vx: vx, vy: vy });
        else {
          var cv = w.document.querySelector(".cb-scena canvas") || w.document.querySelector("canvas");
          var sce = cv.parentNode, cw = sce.clientWidth, ch = sce.clientHeight, S = Math.min((cw - 20) / 1, (ch - 2 * 62) / (1.55 + 2 * 0.07));
          var ox = (cw - S) / 2, oy = (ch - S * 1.55) / 2, r = cv.getBoundingClientRect();
          var x0 = ox + s.x[sc.i] * S, y0 = oy + s.y[sc.i] * S, fx = -Math.cos(sc.a), fy = -Math.sin(sc.a), posto = Infinity;
          if (fx > 0.01) posto = Math.min(posto, (cw - x0) / fx); else if (fx < -0.01) posto = Math.min(posto, x0 / -fx);
          if (fy > 0.01) posto = Math.min(posto, (ch - y0) / fy); else if (fy < -0.01) posto = Math.min(posto, y0 / -fy);
          var pieno = Math.max(24, Math.min(0.22 * S, posto - 8)), len = Math.max(0.1, sc.p) * pieno;
          premi(w, cv, r.left + x0, r.top + y0, "pointerdown", 9);
          premi(w, cv, r.left + x0 + fx * len, r.top + y0 + fy * len, "pointermove", 9);
          premi(w, cv, r.left + x0 + fx * len, r.top + y0 + fy * len, "pointerup", 9);
        }
        await W.aspetta(function () { var x = vm(C); return x.n !== ultimo || x.fase === "fine"; }, 35000);
        continue;
      }
      await W.dorme(200);
    }
  }
  // chi è sullo schermo di un ospite (il gioco a due): mai «Tocca a te» per chi guarda
  function toccaA(w) { return /Tocca a te/.test(T(w)); }

  // ---- 530 Tris ----
  aggiungi(530, { nome: "Tris: l'host ricarica dopo 3 mosse → stesse mosse, tocca a chi toccava; si finisce e rivincita", fai: async function () {
    var r = await A.provaRipresa({ gioco: "tris", nomeTessera: "Tris", amici: ["Giulia"],
      arriva: function (v) { return !!v.avvId && v.avversario; }, fase: "gioco",
      prepara: async function (C) { var f = await mosseTris(C, "Paky", "Giulia", 3); if (f < 3 || pieni(vm(C).board) !== 3) no("non si fanno 3 mosse (" + f + ")"); },
      controlla: function (a, b) {
        if (JSON.stringify(a.board) !== JSON.stringify(b.board)) return "la griglia era " + JSON.stringify(a.board) + " e ora è " + JSON.stringify(b.board);
        if (a.turno !== b.turno) return "toccava a " + a.turno + " e ora a " + b.turno;
        return a.avvId === b.avvId ? true : "l'avversario è cambiato";
      } });
    var C = r.C;
    var chi = vm(C).turno === "X" ? W.finestra("Paky") : W.finestra("Giulia");
    if (!await W.aspetta(function () { return [].some.call(chi.document.querySelectorAll(".tr-cella"), function (c) { return !c.disabled; }); }, 4000)) no("dopo la ripresa chi deve muovere non può toccare");
    await mosseTris(C, "Paky", "Giulia", 9);
    if (vm(C).fase !== "fine") no("dopo la ripresa la partita non finisce (fase " + vm(C).fase + ")");
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Rivincita|Nuova partita/); }, 4000)) no("a fine partita niente Rivincita");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && pieni(vm(C).board) === 0; }, 8000)) no("la rivincita non parte (fase " + vm(C).fase + ")");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "ripresa in " + r.dt + " s con le stesse 3 mosse (tocca a " + r.prima.turno + "), partita finita e rivincita partita";
  } });

  // ---- 531 Drop 4 ----
  aggiungi(531, { nome: "Drop 4: l'host ricarica a metà partita e sulla fine", fai: async function () {
    var r = await A.provaRipresa({ gioco: "drop4", nomeTessera: "Drop 4", amici: ["Giulia"],
      arriva: function (v) { return !!v.avvId && v.avversario && !v.assente; }, fase: "gioco",
      prepara: async function (C) { var f = await mosseDrop(C, "Paky", "Giulia", 4); if (f < 4) no("non si fanno 4 mosse"); },
      controlla: function (a, b) {
        if (JSON.stringify(a.board) !== JSON.stringify(b.board)) return "la griglia non è quella di prima";
        return a.turno === b.turno && a.n === b.n ? true : "turno o partita cambiati";
      } });
    var C = r.C;
    await mosseDrop(C, "Paky", "Giulia", 42);
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 5000)) no("la partita non finisce (fase " + vm(C).fase + ")");
    var e1 = A.contaStoria(C, '"__esito"'), serie = JSON.stringify(vm(C).serie);
    await W.dorme(900);
    var s0 = (W.statoStanza(C) || {})._s;
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { var s = W.statoStanza(C) || {}; return s._s && s._s !== s0 && s._r && vm(C).fase === "fine"; }, 10000)) no("ricaricando sulla fine la fine non torna (fase " + vm(C).fase + ")");
    await W.dorme(2500);
    if (A.contaStoria(C, '"__esito"') !== e1) no("ricaricando sulla fine l'esito è arrivato di nuovo");
    if (JSON.stringify(vm(C).serie) !== serie) no("la serie era " + serie + " e ora è " + JSON.stringify(vm(C).serie));
    if (W.finestra("Giulia").document.querySelector(".saletta-schermo")) no("Giulia è tornata in saletta");
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Rivincita|Nuova partita/); }, 4000)) no("dopo la ripresa sulla fine niente Rivincita");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && pieni(vm(C).board) === 0; }, 8000)) no("la rivincita non parte");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "a metà: ripresa in " + r.dt + " s, stessa griglia; sulla fine: stessa serie " + serie + ", un solo esito; rivincita partita";
  } });

  // ---- 532 Scopa ----
  aggiungi(532, { nome: "Scopa: l'host ricarica a metà smazzata → stesse carte e stessi punti", fai: async function () {
    var manoHost = null;
    var r = await A.provaRipresa({ gioco: "scopa", amici: ["Giulia"], apri: async function (P) { return apriCon(P, "Scopa", [/Una mano/]); },
      arriva: function (v) { return (v.mano ? v.idB : v.avvId) === A.mioId("Giulia"); }, fase: function (v) { return !!v.mano && v.fase === "gioco"; },
      prepara: async function (C) {
        var f = await mosseScopa(C, "Paky", "Giulia", 3); if (f < 3) no("non si giocano 3 carte");
        await W.aspetta(function () { return !vm(C).presa; }, 4000);
        await W.dorme(700);
        var rp = ripresaDi("Paky"); manoHost = rp && rp.stato && rp.stato.scopa && JSON.stringify(rp.stato.scopa.st.mani.A);
        if (!manoHost) no("a metà smazzata l'host non ha salvato la partita");
      },
      controlla: function (a, b) {
        if (JSON.stringify(a.mano) !== JSON.stringify(b.mano)) return "Giulia aveva " + JSON.stringify(a.mano) + " e ora " + JSON.stringify(b.mano);
        if (JSON.stringify(a.tavolo) !== JSON.stringify(b.tavolo)) return "il tavolo è cambiato";
        if (a.oppN !== b.oppN || a.mazzoN !== b.mazzoN || a.turno !== b.turno) return "carte dell'host, mazzo o turno cambiati";
        return JSON.stringify(a.punti) === JSON.stringify(b.punti) && a.preseIo === b.preseIo ? true : "punti o prese cambiati";
      } });
    var C = r.C;
    await W.dorme(900);
    var rp = ripresaDi("Paky"), dopo = rp && rp.stato && rp.stato.scopa && JSON.stringify(rp.stato.scopa.st.mani.A);
    if (dopo !== manoHost) no("le carte dell'host erano " + manoHost + " e ora " + dopo);
    var nHost = W.finestra("Paky").document.querySelectorAll(".sc-mano-riga .sc-carta").length;
    if (nHost !== JSON.parse(manoHost).length) no("sullo schermo dell'host ci sono " + nHost + " carte invece di " + JSON.parse(manoHost).length);
    var f = await mosseScopa(C, "Paky", "Giulia", 4);
    if (f < 4) no("dopo la ripresa non si gioca (" + f + " carte)");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "ripresa in " + r.dt + " s: stesse carte (host " + manoHost + "), stesso tavolo e punti; poi 4 carte giocate";
  } });

  // ---- 533 Navale: l'host ricarica mentre sistema le navi (Giulia già pronta) ----
  aggiungi(533, { nome: "Navale: l'host ricarica mentre sistema le navi, Giulia già pronta non rifà niente", fai: async function () {
    var P, G;
    var r = await A.provaRipresa({ gioco: "navale", nomeTessera: "Battaglia Navale", amici: ["Giulia"],
      arriva: function (v) { return (v.ids || {}).avv === A.mioId("Giulia"); }, fase: "piazza",
      prepara: async function (C, P0, w) {
        P = P0; G = w.Giulia;
        if (!await W.aspetta(function () { return W.clicca(G, /A caso/); }, 4000)) no("Giulia non trova «A caso»");
        await W.dorme(150);
        if (!W.clicca(G, /Pronto, si combatte/)) no("Giulia non trova «Pronto»");
        if (!await W.aspetta(function () { return (vm(C).pronti || [])[1]; }, 4000)) no("l'host non riceve le navi di Giulia");
        await mettiNave(P, 0, 0); await mettiNave(P, 0, 2);
        if (naviFatte(P) !== 2) no("l'host non mette 2 navi (" + naviFatte(P) + ")");
      },
      controlla: function (a, b) { return b.fase === "piazza" && b.g === a.g && (b.pronti || [])[1] ? true : "la partita non è più quella (fase " + b.fase + ", pronti " + JSON.stringify(b.pronti) + ")"; } });
    var C = r.C; P = W.finestra("Paky"); G = W.finestra("Giulia");
    if (!await W.aspetta(function () { return naviFatte(P) === 2; }, 4000)) no("ricaricando l'host non ritrova le 2 navi messe (" + naviFatte(P) + ")");
    if (/A caso|Sistema le tue navi/.test(T(G)) && !/Flotta pronta/.test(T(G))) no("Giulia deve rifare le navi («" + T(G).slice(0, 80) + "»)");
    await mettiNave(P, 0, 4); await mettiNave(P, 0, 6); await mettiNave(P, 0, 8);
    if (!await W.aspetta(function () { return W.clicca(P, /Pronto, si combatte/); }, 3000)) no("dopo 5 navi l'host non ha «Pronto»");
    if (!await W.aspetta(function () { return vm(C).fase === "battaglia"; }, 5000)) no("la battaglia non comincia");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "ripresa in " + r.dt + " s: l'host ritrova le 2 navi messe, Giulia resta pronta; battaglia cominciata";
  } });

  // ---- 534 Navale: l'host ricarica in battaglia ----
  aggiungi(534, { nome: "Navale: l'host ricarica in battaglia → stessi colpi, stesse navi, stesso turno", fai: async function () {
    var naviHost = null;
    var r = await A.provaRipresa({ gioco: "navale", nomeTessera: "Battaglia Navale", amici: ["Giulia"],
      arriva: function (v) { return (v.ids || {}).avv === A.mioId("Giulia"); }, fase: "piazza",
      prepara: async function (C, P, w) {
        W.reteDi("Giulia").invia({ t: "pronto", navi: NAVI_B });
        if (!await W.aspetta(function () { return W.clicca(P, /A caso/); }, 4000)) no("Paky non trova «A caso»");
        await W.dorme(150);
        if (!W.clicca(P, /Pronto, si combatte/)) no("Paky non trova «Pronto»");
        if (!await W.aspetta(function () { return vm(C).fase === "battaglia"; }, 6000)) no("la battaglia non comincia");
        var f = await colpiNavale(C, "Paky", "Giulia", 5); if (f < 5) no("non si sparano 5 colpi");
        await W.dorme(700);
        var rp = ripresaDi("Paky"); naviHost = rp && JSON.stringify(rp.stato.navale.P.flotte[0].mappa);
      },
      controlla: function (a, b) {
        if (b.fase !== "battaglia") return "fase " + b.fase;
        if (JSON.stringify(a.campi) !== JSON.stringify(b.campi)) return "i colpi sono cambiati";
        return a.n === b.n && a.tocca === b.tocca && a.g === b.g ? true : "turno o colpi cambiati (n " + a.n + "→" + b.n + ", tocca " + a.tocca + "→" + b.tocca + ")";
      } });
    var C = r.C;
    await W.dorme(900);
    var rp = ripresaDi("Paky");
    if (!rp || JSON.stringify(rp.stato.navale.P.flotte[0].mappa) !== naviHost) no("le navi dell'host sono cambiate");
    var n0 = vm(C).n, f = await colpiNavale(C, "Paky", "Giulia", 4);
    if (f < 4 || vm(C).n < n0 + 3) no("dopo la ripresa non si spara (n " + n0 + " → " + vm(C).n + ")");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "ripresa in " + r.dt + " s: stessi " + r.prima.n + " colpi, stesse navi, tocca a " + (r.prima.tocca ? "Giulia" : "Paky") + "; poi altri colpi";
  } });

  // ---- 535 Navale: l'ospite ricarica mentre sistema, dopo «Pronto», e l'host che non ha ancora la sua flotta ----
  aggiungi(535, { nome: "Navale: Giulia ricarica mentre sistema (3 navi) e dopo «Pronto»; l'host ricarica senza la sua flotta", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Battaglia Navale");
    var G = await W.apriTel("Giulia", { hash: "gioco=navale&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return (vm(C).ids || {}).avv === A.mioId("Giulia"); }, 8000)) no("Giulia non entra");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "piazza" && casella(G, 0, 0); }, 5000)) no("non si comincia a sistemare le navi");
    var chiave = "sg-nav-" + C, memG = W.BR.mem.Giulia.l;
    await mettiNave(G, 0, 0); await mettiNave(G, 0, 2); await mettiNave(G, 0, 4);
    if (naviFatte(G) !== 3) no("Giulia non mette 3 navi (" + naviFatte(G) + ")");
    if (!memG[chiave]) no("le navi a metà di Giulia non sono salvate in " + chiave);
    G = await W.ricarica("Giulia", { hash: "gioco=navale&stanza=" + C });
    if (!await W.aspetta(function () { return naviFatte(G) === 3 && /Sistema le tue navi/.test(T(G)); }, 8000)) no("ricaricando Giulia non ritrova le 3 navi (" + naviFatte(G) + ", «" + T(G).slice(0, 80) + "»)");
    await mettiNave(G, 0, 6); await mettiNave(G, 0, 8);
    if (!W.clicca(G, /Pronto, si combatte/)) no("Giulia non ha «Pronto» dopo 5 navi");
    if (!await W.aspetta(function () { return (vm(C).pronti || [])[1]; }, 4000)) no("l'host non riceve le navi di Giulia");
    // dopo «Pronto» ricarica: non rifà niente
    G = await W.ricarica("Giulia", { hash: "gioco=navale&stanza=" + C });
    if (!await W.aspetta(function () { return /Flotta pronta/.test(T(G)); }, 8000)) no("dopo «Pronto» e la ricarica Giulia non ha la flotta pronta («" + T(G).slice(0, 80) + "»)");
    if (casella(G, 0, 0) && !/sh/.test(casella(G, 0, 0).className)) no("le navi di Giulia non sono quelle di prima");
    // l'host ricarica PRIMA di avere le navi di Giulia (si toglie la flotta dal salvataggio, come se fosse stato salvato prima):
    // Giulia gliele rimanda da sola
    await W.dorme(900);
    var s0 = (W.statoStanza(C) || {})._s;
    var tolta = function (w) { var mem = W.BR.mem.Paky.l, x = JSON.parse(mem["sg-ripresa"] || "null"); if (x && x.stato && x.stato.navale) { x.stato.navale.P.flotte[1] = null; mem["sg-ripresa"] = JSON.stringify(x); } };
    P = await W.ricarica("Paky", { prima: tolta });
    if (!await W.aspetta(function () { var s = W.statoStanza(C) || {}; return s._s && s._s !== s0 && s._r && vm(C).fase === "piazza" && (vm(C).pronti || [])[1]; }, 10000))
      no("l'host ricaricato senza la flotta di Giulia non la riceve di nuovo (pronti " + JSON.stringify(vm(C).pronti) + ")");
    if (!/Flotta pronta/.test(T(W.finestra("Giulia")))) no("Giulia ha dovuto rifare le navi");
    // si gioca fino alla fine: la chiave di Giulia sparisce
    if (!await W.aspetta(function () { return W.clicca(P, /A caso/); }, 4000)) no("Paky non trova «A caso»");
    await W.dorme(150); W.clicca(P, /Pronto, si combatte/);
    if (!await W.aspetta(function () { return vm(C).fase === "battaglia"; }, 6000)) no("la battaglia non comincia");
    await colpiNavale(C, "Paky", "Giulia", 300);
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 5000)) no("la battaglia non finisce");
    if (!await W.aspetta(function () { return !memG[chiave]; }, 4000)) no("a fine partita " + chiave + " c'è ancora");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Giulia ritrova le 3 navi a metà e la flotta pronta; l'host ricaricato riceve di nuovo la flotta da sola; a fine partita la chiave sparisce";
  } });

  // ---- 536 Calcio Biliardo ----
  aggiungi(536, { nome: "Calcio Biliardo: l'host ricarica dopo un gol → stessi gol, si continua", fai: async function () {
    var r = await A.provaRipresa({ gioco: "calciobiliardo", nomeTessera: "Calcio Biliardo", amici: ["Giulia"],
      arriva: function (v) { var p = v.players || []; return p.length === 2 && p[1].id === A.mioId("Giulia") && !p[1].via; }, fase: "gioco",
      prepara: async function (C) {
        await tiriCalcio(C, "Paky", "Giulia", function (v) { return (v.gol || [0, 0])[0] + (v.gol || [0, 0])[1] >= 1 && v.stato === "mira"; });
        var v = vm(C); if (!v.gol || v.gol[0] + v.gol[1] < 1) no("nessun gol in 150 s");
        if (v.fase === "fine") no("la partita è già finita col primo gol");
      },
      attesa: 15000,
      controlla: function (a, b) {
        if (JSON.stringify(a.gol) !== JSON.stringify(b.gol)) return "i gol erano " + a.gol + " e ora " + b.gol;
        if (b.stato !== "mira") return "si aspetta ancora (stato " + b.stato + ")";
        return a.turno === b.turno ? true : "toccava a " + a.turno + " e ora a " + b.turno;
      } });
    var C = r.C, n0 = vm(C).n;
    await tiriCalcio(C, "Paky", "Giulia", function (v) { return v.n >= n0 + 2; });
    if (vm(C).n < n0 + 2 && vm(C).fase !== "fine") no("dopo la ripresa non si tira (n " + n0 + " → " + vm(C).n + ")");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "ripresa in " + r.dt + " s con " + r.prima.gol.join("-") + ", tocca a chi toccava; poi altri tiri";
  } });

  // ---- 536b Calcio Biliardo: l'host ricarica col tiro in volo → il tiro non vale, chi tirava rifà la mira ----
  aggiungi("536b", { nome: "Calcio Biliardo: l'host ricarica col tiro in volo → si rifà la mira", fai: async function () {
    var r = await A.provaRipresa({ gioco: "calciobiliardo", nomeTessera: "Calcio Biliardo", amici: ["Giulia"],
      arriva: function (v) { var p = v.players || []; return p.length === 2 && p[1].id === A.mioId("Giulia") && !p[1].via; }, fase: "gioco",
      prepara: async function (C) {
        await tiriCalcio(C, "Paky", "Giulia", function (v) { return v.n >= 2 && v.stato === "mira"; });
        var v = vm(C); if (v.stato !== "mira") no("non si arriva a una mira");
        // Giulia tira (se tocca a lei) o tira l'host: subito dopo, mentre la palla corre, l'host ricarica
        var n0 = v.n, q = v.turno, w = W.finestra(q === 0 ? "Paky" : "Giulia"), CB = w.__CB, z = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var sc = CB.sceltaBot({ x: v.st.x.slice(), y: v.st.y.slice(), vx: z.slice(), vy: z.slice() }, q, "facile", v.solo || null);
        var vx = Math.cos(sc.a) * CB.VMAX * sc.p, vy = Math.sin(sc.a) * CB.VMAX * sc.p;
        if (q === 1) W.reteDi("Giulia").invia({ t: "tiro", i: sc.i, vx: vx, vy: vy });
        else {   // tocca all'host: si gioca finché tocca a Giulia, e tira lei
          await tiriCalcio(C, "Paky", "Giulia", function (x) { return x.turno === 1 && x.stato === "mira"; });
          v = vm(C); n0 = v.n; w = W.finestra("Giulia"); CB = w.__CB;
          sc = CB.sceltaBot({ x: v.st.x.slice(), y: v.st.y.slice(), vx: z.slice(), vy: z.slice() }, 1, "facile", v.solo || null);
          W.reteDi("Giulia").invia({ t: "tiro", i: sc.i, vx: Math.cos(sc.a) * CB.VMAX * sc.p, vy: Math.sin(sc.a) * CB.VMAX * sc.p });
        }
        if (!await W.aspetta(function () { return vm(C).stato === "moto" && vm(C).n === n0 + 1; }, 3000)) no("il tiro non parte");
        W.__tiro536 = { n: vm(C).n, turno: vm(C).turno, gol: JSON.stringify(vm(C).gol), st: JSON.stringify(vm(C).st) };
      },
      salva: 300,   // (si ricarica mentre la palla corre)
      controlla: function (a, b) {
        var x = W.__tiro536;
        if (b.stato !== "mira") return "stato " + b.stato;
        if (b.turno !== x.turno) return "il tiro in volo è valso (toccava a " + x.turno + ", ora a " + b.turno + ")";
        return JSON.stringify(b.gol) === x.gol && JSON.stringify(b.st) === x.st ? true : "gol o pedine cambiati";
      } });
    var C = r.C, n0 = vm(C).n;
    await tiriCalcio(C, "Paky", "Giulia", function (v) { return v.n >= n0 + 2; });
    if (vm(C).n < n0 + 1 && vm(C).fase !== "fine") no("dopo la ripresa Giulia non rifà il tiro");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "ripresa in " + r.dt + " s: il tiro in volo non vale, stesse pedine, Giulia rifà la mira e si continua";
  } });

  // ---- 532b Scopa in tre: l'host ricarica a metà mano ----
  aggiungi("532b", { nome: "Scopa in tre: l'host ricarica a metà mano → stesso tavolo e stessi posti", fai: async function () {
    var r = await A.provaRipresa({ gioco: "scopa", amici: ["Giulia", "Luca"], apri: async function (P) { return apriCon(P, "Scopa", [/Una mano/, /In tre/]); },
      arriva: function (v) { var s = v.seggi || (v.vm && v.vm.seggi); return v.tre ? true : false; },
      comincia: async function (C, P) {
        if (!await W.aspetta(function () { var v = W.statoStanza(C) || {}; return v.t === "lobby" && v.tre && (v.seggi || []).filter(Boolean).length === 3; }, 8000)) no("al tavolo a tre non ci sono in tre");
        if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 4000)) no("l'host non ha «Comincia»");
      },
      fase: function (v) { return v.tre && v.fase === "gioco" && v.nMano; },
      prepara: async function (C, P) {
        // gioca l'host la sua carta quando tocca a lui; gli amici col turno lungo: si aspetta che passino 3 carte
        var fino = Date.now() + 25000, k = 0;
        while (Date.now() < fino && k < 3) {
          var v = vm(C);
          var mia = P.document.querySelector(".sc-mano-riga .sc-carta");
          var tv = JSON.stringify(v.tavolo);
          if (v.turno === 0 && !v.presa && mia) {
            mia.click(); await W.dorme(150);
            if (mia.classList.contains("sel")) [].forEach.call(P.document.querySelectorAll(".sc-terra .sc-carta"), function (c) { c.click(); });
            k++; await W.aspetta(function () { return JSON.stringify(vm(C).tavolo) !== tv || vm(C).turno !== 0; }, 3000); await W.dorme(600); continue;
          }
          if (v.turno === 1 || v.turno === 2) {
            var chi = v.turno === 1 ? "Giulia" : "Luca", mano = null;
            try { mano = JSON.parse(W.BR.mem.Paky.l["sg-ripresa"] || "null").stato.scopa.st.mani[v.turno]; } catch (e) {}
            if (mano && mano.length) { W.reteDi(chi).invia({ t: "gioca", carta: mano[0].id, presa: null }); k++; await W.aspetta(function () { return JSON.stringify(vm(C).tavolo) !== tv || vm(C).turno !== v.turno; }, 3000); await W.dorme(600); continue; }
          }
          await W.dorme(300);
        }
        await W.aspetta(function () { return !vm(C).presa; }, 4000);
      },
      controlla: function (a, b) {
        if (!b.tre) return "non è più il tavolo a tre";
        if (JSON.stringify(a.tavolo) !== JSON.stringify(b.tavolo)) return "il tavolo è cambiato";
        return a.turno === b.turno && a.nMano === b.nMano ? true : "turno o mano cambiati";
      } });
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    var v = vm(r.C);
    return "ripresa in " + r.dt + " s al tavolo a tre (tocca al posto " + v.turno + ")";
  } });

  // ---- 537 Tris con chi guarda ----
  aggiungi(537, { nome: "Tris con Luca che guarda: durante la ripresa continua a guardare, mai «Tocca a te»", fai: async function () {
    var visto = false, guardia = null;
    var r = await A.provaRipresa({ gioco: "tris", nomeTessera: "Tris", amici: ["Giulia", "Luca"],
      arriva: function (v) { return !!v.avvId && v.avvId === A.mioId("Giulia"); }, fase: "gioco",
      prepara: async function (C, P, w) {
        await mosseTris(C, "Paky", "Giulia", 2);
        if (!/Giocano|guardi/i.test(T(w.Luca)) && !w.Luca.document.querySelector(".tr-cella")) no("Luca non guarda («" + T(w.Luca).slice(0, 80) + "»)");
        guardia = setInterval(function () { var L = W.finestra("Luca"); if (L && toccaA(L)) visto = true; }, 50);
      },
      controlla: function (a, b) { return JSON.stringify(a.board) === JSON.stringify(b.board) && b.avvId === a.avvId ? true : "partita o avversario cambiati"; } });
    var C = r.C;
    await mosseTris(C, "Paky", "Giulia", 9);
    clearInterval(guardia);
    if (visto) no("Luca ha letto «Tocca a te»");
    var L = W.finestra("Luca");
    if (vm(C).avvId === A.mioId("Luca")) no("Luca è diventato l'avversario");
    if (!L.document.querySelector(".tr-cella") && !/Giocano|guardi/i.test(T(L))) no("Luca non vede più la partita («" + T(L).slice(0, 80) + "»)");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "ripresa in " + r.dt + " s; Luca ha guardato tutta la partita senza mai «Tocca a te»";
  } });

  COPIONE.gruppo5g1 = async function () { var out = []; var l = [530, 531, 532, "532b", 533, 534, 535, 536, "536b", 537]; for (var i = 0; i < l.length; i++) out.push(await COPIONE.prova(l[i])); return out; };
})();

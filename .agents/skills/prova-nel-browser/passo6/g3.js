// PROVE DEL PASSO 6, GRUPPO 3 (carte e feste: chi arriva tardi e chi guarda): Black Jack, Poker, L'Asta, Sì… però, Gara di pesca.
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("passo6/g3.js"); await COPIONE.prova(680)      (oppure await COPIONE.gruppo6g3(): 680-686 in fila)
// 680 Black Jack: Marco arriva a mano cominciata → si siede subito con le SUE monete, legge "✋ Giochi dalla prossima mano" e non
//     ha tasti; alla mano dopo punta e ha le carte. Bea apre il link con guarda=1: targhetta, "👀 Guardi il tavolo", nessun
//     tasto, nessun messaggio per lei (to/per col suo id), dal suo telefono solo "__".
// 681 Poker: Marco arriva a mano cominciata → si siede con le sue fiches (700: le sue, al massimo 1.000), "✋ Giochi dalla prossima
//     mano", niente tasti; alla mano dopo ha le carte (il messaggio "mie" per lui).
// 682 L'Asta, 683 Sì… però, 684 Gara di pesca, 685 Poker: Bea guarda col link a partita cominciata: targhetta (una), nessun
//     "🏠 Esci" del gioco, niente fila di faccine doppia, nessun messaggio per lei, dal suo telefono solo "__", a 360x640 e
//     412x915 la pagina non scorre e la targhetta non copre quello che si legge; Gara di pesca e Poker fino alla fine e alla
//     "Nuova partita": Bea entra da sola nella saletta.
// 686 Black Jack a tavolo pieno: in saletta 10 su 10 (8 posti finti) Anna arriva → guarda ("🪑 Tavolo pieno…"), non "pieno";
//     si libera un posto → si siede da sola. A partita cominciata e tavolo pieno Anna guarda (vm.guardano/pieni), niente "pieno".
// Regole corte solo nelle prove (opz.g3imp): Gara di pesca da 10 secondi. Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, vm = A.vm, no = A.no, mioId = A.mioId;
  var aggiungi = COPIONE.aggiungi.bind(COPIONE);
  var NOMI = { blackjack: "Black Jack", poker: "Poker", asta: "L'Asta", sipero: "Sì... però", garapesca: "Gara di pesca" };
  var IMP = { garapesca: { durata: 10 } };

  // ---- i telefoni con le regole corte (solo per le prove) ----
  if (!W.__prepG3p6) {
    W.__prepG3p6 = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepG3p6(w, nome, opz);
      if (!opz || !opz.g3imp) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && IMP[g.id]) {
            var av = g.avvia;
            g.avvia = function (t) { if (t.impostazioni) Object.keys(IMP[g.id]).forEach(function (k) { t.impostazioni[k] = IMP[g.id][k]; }); return av.apply(this, arguments); };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }
  function tel(nome, o) { return W.apriTel(nome, Object.assign({ g3imp: true }, o || {})); }
  // le monete del profilo finto di questo telefono (per vedere che chi arriva si siede con le SUE)
  function conMonete(n) { return function (w) { try { w.SGNube.fiches = function () { return n; }; } catch (e) {} }; }

  // ---- aiuti ----
  function visibile(e) { if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.ownerDocument.defaultView.getComputedStyle(e).visibility !== "hidden"; }
  function logDa(nome, C) { return W.BR.log.filter(function (l) { return l.indexOf(nome + " → " + C + "/") === 0; }); }
  function esciDelGioco(w) {
    return [].filter.call(w.document.querySelectorAll("button"), function (b) { return /Esci|Mi alzo|Torna alla home/.test(b.textContent) && !b.closest(".sg-guardo") && !b.closest(".sl-velo, .conferma-velo, .bj-dlg") && visibile(b); }).map(function (b) { return b.textContent; });
  }
  // i messaggi dell'host (stato della stanza C) per un telefono solo: to = id, o per = [.., id, ..] (le carte, i segreti)
  function perLui(C, id) {
    var st = [].concat(W.BR.storia || []); try { st = st.concat(ufficio(1).storia || []); } catch (e) {}
    return st.filter(function (s) {
      if (s.topic.indexOf("/" + C + "/") < 0 && s.topic.indexOf("/" + C.toLowerCase() + "/") < 0) return false;
      var m = null; try { m = JSON.parse(s.p); } catch (e) { return false; }
      if (!m) return false;
      return m.to === id || (Array.isArray(m.per) && m.per.indexOf(id) >= 0) || (m.data && (m.data.to === id || (Array.isArray(m.data.per) && m.data.per.indexOf(id) >= 0)));
    }).map(function (s) { return s.p.slice(0, 60); });
  }
  // l'host apre la stanza di un gioco (percorso di prima)
  async function apriStanzaDi(w, gid) {
    var gia = await W.aspetta(function () { return /apro io/.test(T(w)) || w.document.querySelector(".tessera"); }, 5000);
    if (!gia) no("non trovo né la home né «Come giocate?»");
    if (!/apro io/.test(T(w))) {
      var tess = await W.aspetta(function () { return A.tessera(w, NOMI[gid]); }, 5000);
      if (!tess) no("non trovo la tessera " + NOMI[gid]);
      tess.click(); await W.dorme(250);
    }
    if (!await W.aspetta(function () { return W.clicca(w, /apro io/); }, 4000)) no("non trovo «Online: apro io la stanza» («" + T(w).slice(0, 80) + "»)");
    await W.dorme(250);
    if (!await W.aspetta(function () { return W.clicca(w, /Apri la stanza/); }, 4000)) no("non trovo «Apri la stanza»");
    var C = await W.aspetta(function () { var b = w.document.querySelector(".sl-cod b"); return b && /^[A-Z0-9]{4}$/.test(b.textContent) ? b.textContent : null; }, 6000);
    if (!C) no("la stanza non ha il codice");
    return C;
  }
  // chi guarda: una targhetta, nessuna uscita del gioco, niente "Tocca a te"/"(tu)", nessun messaggio per lui, solo "__" da lui
  function controllaGuarda(w, nome, C, quando) {
    var g = w.document.querySelectorAll(".sg-guardo");
    if (g.length !== 1) no(nome + " (" + quando + ") ha " + g.length + " targhette");
    var e = esciDelGioco(w); if (e.length) no(nome + " (" + quando + ") ha anche l'uscita del gioco: " + e.join(", "));
    if (/Tocca a te|\(tu\)|Tocca a voi/.test(T(w))) no(nome + " (" + quando + ") legge «Tocca a te» o «(tu)»");
    var fd = [].filter.call(w.document.querySelectorAll(".sl-faccine"), function (x) { return visibile(x) && !x.closest(".sg-guardo-fila"); });
    if (fd.length) no(nome + " (" + quando + ") ha anche la fila delle faccine del gioco (c'è già il 😂 della targhetta)");
    var id = mioId(nome), p = id ? perLui(C, id) : [];
    if (p.length) no("a " + nome + " (guarda) arrivano messaggi solo per lui: " + p.slice(0, 2).join(" / "));
    var altri = logDa(nome, C).filter(function (l) { return !/"t":"__/.test(l); });
    if (altri.length) no("dal telefono di " + nome + " passano mosse del gioco: " + altri.slice(0, 2).join(" / "));
  }
  // a misura (larg x alt): la pagina non scorre e la targhetta non copre "sel". "" = tutto bene
  async function misura(w, nome, larg, alt, sel) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{ animation:none !important; }"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(600); w.scrollTo(0, 0);
    if (d.documentElement.scrollHeight > alt + 1) return "la pagina scorre (" + d.documentElement.scrollHeight + " px)";
    if (d.documentElement.scrollWidth > larg + 1) return "la pagina scorre di lato";
    var g = d.querySelector(".sg-guardo"); if (!g) return "non c'è la targhetta";
    var rg = g.getBoundingClientRect();
    var cose = [].filter.call(d.querySelectorAll(sel), visibile);
    if (!cose.length) return "non trovo «" + sel + "»";
    for (var i = 0; i < cose.length; i++) {
      var r = cose[i].getBoundingClientRect();
      if (r.bottom > alt + 1) return "«" + sel + "» esce dallo schermo (" + Math.round(r.bottom) + ")";
      if (r.left < rg.right - 1 && rg.left < r.right - 1 && r.top < rg.bottom - 1 && rg.top < r.bottom - 1) return "la targhetta copre «" + (cose[i].className || sel) + "» (" + Math.round(r.bottom) + " > " + Math.round(rg.top) + ")";
    }
    return "";
  }
  async function misure(w, nome, sel) {
    var M = [[360, 640], [412, 915]], fatte = [];
    for (var k = 0; k < M.length; k++) { var e = await misura(w, nome, M[k][0], M[k][1], sel); if (e) no(nome + " a " + M[k].join("x") + ": " + e); fatte.push(M[k].join("x")); }
    var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(300);
    return fatte.join(" e ");
  }
  function errori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / ")); }

  // ---- Black Jack: un passo della mano (Paky tocca, gli altri mandano la mossa); fatto = per non mandare due volte ----
  function seatDi(C, n) { var id = mioId(n); return (vm(C).giocatori || []).findIndex(function (g) { return n === "Paky" ? g.rid === "host" : g.rid === id; }); }
  function bjPasso(C, ospiti, fatto, nuova) {
    var v = vm(C), P = W.finestra("Paky"), k = v.giro + "|" + v.fase + "|" + v.turno;
    if (v.fase === "punta") {
      ospiti.forEach(function (n) { var s = seatDi(C, n), g = v.giocatori[s]; if (g && !g.via && !g.puntata && !fatto[k + n]) { var h = W.reteDi(n); if (h) { h.invia({ t: "mossa", kind: "punta", val: 100 }); fatto[k + n] = 1; } } });
      if (v.giocatori[0] && !v.giocatori[0].puntata) W.clicca(P, /^Punta /);
    } else if (v.fase === "assic") {
      ospiti.forEach(function (n) { var h = W.reteDi(n); if (h && !fatto[k + n]) { h.invia({ t: "mossa", kind: "assic", si: false }); fatto[k + n] = 1; } });
      W.clicca(P, /^No$/);
    } else if (v.fase === "gioca") {
      if (v.turno === 0) W.clicca(P, /^Stai$/);
      else ospiti.forEach(function (n) { var g = v.giocatori[v.turno]; if (seatDi(C, n) === v.turno && g && !fatto[k + n + g.attiva]) { var h = W.reteDi(n); if (h) { h.invia({ t: "mossa", kind: "azione", mossa: "stai" }); fatto[k + n + g.attiva] = 1; } } });
    } else if (v.fase === "esito" && nuova) W.clicca(P, /Nuova mano/);
  }
  async function bjFinoA(C, ospiti, cond, ms, nuova) {
    var fatto = {}, fino = Date.now() + ms;
    while (Date.now() < fino) { if (cond(vm(C))) return true; bjPasso(C, ospiti, fatto, nuova); await W.dorme(300); }
    return !!cond(vm(C));
  }
  function bjTasti(w) { return [].filter.call(w.document.querySelectorAll(".bj-hero button"), function (b) { return visibile(b) && !b.disabled; }).map(function (b) { return b.textContent; }); }

  // 680. Black Jack: chi arriva a mano cominciata, chi guarda
  aggiungi(680, { nome: "Black Jack: chi arriva a mano cominciata si siede con le sue monete e gioca dalla mano dopo; chi guarda col link non riceve niente di suo", fai: async function () {
    var P = await tel("Paky", { x: 0 }), C = await apriStanzaDi(P, "blackjack");
    await tel("Giulia", { hash: "gioco=blackjack&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 2; }, 8000)) no("Giulia non entra");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("Paky non trova «Comincia»");
    // la prima mano: si punta, poi a carte date arriva Marco
    if (!await bjFinoA(C, ["Giulia"], function (v) { return v.fase === "gioca" || v.fase === "assic" || v.fase === "esito"; }, 30000, false)) no("la prima mano non arriva alle carte (fase " + vm(C).fase + ")");
    var M = await tel("Marco", { hash: "gioco=blackjack&stanza=" + C, x: 370, prima: conMonete(2345) });
    var gm = await W.aspetta(function () { var id = mioId("Marco"); return id && (vm(C).giocatori || []).filter(function (g) { return g.rid === id; })[0]; }, 8000);
    if (!gm) no("Marco non si siede al tavolo");
    if (gm.fiches !== 2345) no("Marco si siede con " + gm.fiches + " monete invece delle sue 2.345");
    var faseM = vm(C).fase;
    if (["gioca", "assic", "banco", "distrib"].indexOf(faseM) >= 0) {
      if (!await W.aspetta(function () { return /Giochi dalla prossima mano/.test(T(M)); }, 5000)) no("Marco non legge «✋ Giochi dalla prossima mano» («" + T(M).slice(-100) + "»)");
      var tm = bjTasti(M); if (tm.length) no("Marco a mano non sua ha dei tasti: " + tm.join(", "));
    }
    // Bea guarda col link
    var B = await W.apriTel("Bea", { hash: "gioco=blackjack&stanza=" + C + "&guarda=1", x: 555 });
    if (!await W.aspetta(function () { return B.document.querySelector(".sg-guardo") && /Guardi il tavolo/.test(T(B)); }, 8000)) no("Bea non ha la targhetta o «👀 Guardi il tavolo» («" + T(B).slice(-100) + "»)");
    if (bjTasti(B).length) no("Bea (guarda) ha dei tasti: " + bjTasti(B).join(", "));
    // la mano dopo: Marco punta dal suo telefono e ha le carte
    if (!await bjFinoA(C, ["Giulia"], function (v) { return v.fase === "punta" && v.mano >= 1; }, 40000, true)) no("non si arriva alla mano dopo (fase " + vm(C).fase + ")");
    var bP = await W.aspetta(function () { return [].find.call(M.document.querySelectorAll(".bj-hero button"), function (b) { return /^Punta /.test(b.textContent) && visibile(b); }); }, 6000);
    if (!bP) no("alla mano dopo Marco non ha il tasto «Punta» («" + T(M).slice(-100) + "»)");
    bP.click();
    if (!await bjFinoA(C, ["Giulia"], function (v) { var g = v.giocatori[seatDi(C, "Marco")]; return g && g.mani && g.mani.length && g.mani[0].carte.length >= 2; }, 30000, false)) no("Marco alla mano dopo non ha le carte");
    await W.dorme(800);
    if (bjTasti(B).length) no("Bea (guarda) ha dei tasti: " + bjTasti(B).join(", "));
    controllaGuarda(B, "Bea", C, "in partita");
    var mis = await misure(B, "Bea", ".bj-hero");
    errori();
    return "Marco a mano cominciata: seduto con le sue 2.345 monete, «✋ Giochi dalla prossima mano» senza tasti" + (["gioca", "assic", "banco", "distrib"].indexOf(faseM) >= 0 ? "" : " (arrivato in fase " + faseM + ")") + ", alla mano dopo punta e ha le carte · Bea guarda: targhetta, nessun tasto, niente di suo, solo «__» (" + mis + ")";
  } });

  // ---- Poker: chi tocca lascia (la mano finisce subito) ----
  async function pkLascia(C) {
    var v = vm(C); if (!v || v.fase !== "gioco" || !v.turno) return false;
    if (v.turno === "host") return W.clicca(W.finestra("Paky"), /^Lascia$/);
    var n = ["Giulia", "Marco", "Luca"].filter(function (x) { return mioId(x) === v.turno; })[0];
    if (!n) return false;
    W.reteDi(n).invia({ t: "azione", tipo: "lascia", tot: 0, n: v.n, st: v.stato, dc: v.daChiamare });
    return true;
  }
  function pkMe(C, n) { var id = n === "Paky" ? "host" : mioId(n); return (vm(C).players || []).filter(function (p) { return p.id === id; })[0] || null; }
  function pkTasti(w) { return [].filter.call(w.document.querySelectorAll(".pk-azioni button"), function (b) { return visibile(b) && !b.disabled; }).map(function (b) { return b.textContent; }); }
  async function pkApri(conGiulia) {
    var P = await tel("Paky", { x: 0, prima: conMonete(5000) }), C = await apriStanzaDi(P, "poker");
    if (conGiulia) {
      await tel("Giulia", { hash: "gioco=poker&stanza=" + C, x: 185, prima: conMonete(5000) });
      if (!await W.aspetta(function () { return !!pkMe(C, "Giulia"); }, 8000)) no("Giulia non si siede");
    }
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("Paky non trova «Comincia» («" + T(P).slice(0, 80) + "»)");
    if (!await W.aspetta(function () { var v = vm(C); return v.fase === "gioco" && v.turno; }, 10000)) no("la prima mano non comincia");
    return { P: P, C: C };
  }

  // 681. Poker: chi arriva a mano cominciata
  aggiungi(681, { nome: "Poker: chi arriva a mano cominciata si siede con le sue fiches (al massimo 1.000) e gioca dalla mano dopo", fai: async function () {
    var o = await pkApri(true), C = o.C;
    var M = await tel("Marco", { hash: "gioco=poker&stanza=" + C, x: 370, prima: conMonete(700) });
    var pm = await W.aspetta(function () { return pkMe(C, "Marco"); }, 8000);
    if (!pm) no("Marco non si siede al tavolo");
    if (pm.stack + (pm.inGiro || 0) !== 700) no("Marco si siede con " + pm.stack + " fiches invece delle sue 700");
    if (pm.inMano) no("Marco è subito nella mano cominciata");
    if (!await W.aspetta(function () { return /Giochi dalla prossima mano/.test(T(M)); }, 5000)) no("Marco non legge «✋ Giochi dalla prossima mano» («" + T(M).slice(-100) + "»)");
    var tm = pkTasti(M); if (tm.length) no("Marco a mano non sua ha dei tasti: " + tm.join(", "));
    var n0 = vm(C).n;
    await pkLascia(C);   // la mano finisce: alla prossima c'è anche Marco
    var fino = Date.now() + 30000;
    while (Date.now() < fino && !(vm(C).n > n0 && (pkMe(C, "Marco") || {}).inMano)) await W.dorme(300);
    if (!(vm(C).n > n0 && (pkMe(C, "Marco") || {}).inMano)) no("alla mano dopo Marco non gioca (mano " + vm(C).n + ")");
    var idM = mioId("Marco");
    if (!await W.aspetta(function () { return perLui(C, idM).some(function (p) { return /"t":"mie"/.test(p); }); }, 5000)) no("alla mano dopo a Marco non arrivano le sue carte");
    if (!await W.aspetta(function () { return M.document.querySelectorAll(".pk-mie > *").length >= 2; }, 5000)) no("Marco non vede le sue carte");
    errori();
    return "Marco a mano cominciata: seduto con le sue 700 fiches, «✋ Giochi dalla prossima mano» senza tasti, alla mano dopo ha le sue carte";
  } });

  // ---- chi guarda col link: Asta, Sì… però, Gara di pesca, Poker ----
  async function beaGuarda(gid, C, x) {
    var B = await W.apriTel("Bea", { hash: "gioco=" + gid + "&stanza=" + C + "&guarda=1", x: x || 555, g3imp: true });
    if (!await W.aspetta(function () { return B.document.querySelector(".sg-guardo"); }, 8000)) no("Bea non ha la targhetta («" + T(B).slice(0, 80) + "»)");
    return B;
  }
  // il 😂 della targhetta: la faccina arriva a "a" col nome di chi guarda
  async function faccinaDa(w, nome, a) {
    var b = w.document.querySelector(".sg-guardo-fa"); if (!b) no(nome + ": la targhetta non ha il 😂");
    b.click();
    var fa = await W.aspetta(function () { return [].find.call(w.document.querySelectorAll(".sg-guardo-fila .sl-fa"), function (x) { return x.textContent === "👏"; }); }, 2000);
    if (!fa) no(nome + ": il 😂 non apre la fila delle faccine");
    fa.click();
    var wa = W.finestra(a);
    if (!await W.aspetta(function () { return [].some.call(wa.document.querySelectorAll(".sg-fa-volante"), function (x) { return /👏/.test(x.textContent) && x.textContent.indexOf(nome) >= 0; }); }, 4000))
      no(a + " non vede «👏 " + nome + "»");
    b.click();
  }
  // a fine partita l'host fa "Nuova partita": chi guardava entra da solo nella saletta
  async function nuovaEdEntra(P, C, chiave) {
    if (!await W.aspetta(function () { return W.clicca(P, /Nuova partita|Nuova gara|Rivincita/); }, 8000)) no("a fine partita Paky non trova «Nuova partita» («" + T(P).slice(-100) + "»)");
    var B = W.finestra("Bea");
    if (!await W.aspetta(function () { return (vm(C)[chiave] || []).some(function (p) { return p.nome === "Bea"; }) && B.document.querySelector(".saletta-schermo"); }, 8000))
      no("alla «Nuova partita» Bea non entra nella saletta («" + T(B).slice(0, 100) + "»)");
    if (B.document.querySelector(".sg-guardo")) no("Bea è entrata ma ha ancora la targhetta «👀 Guardi»");
  }

  // 682. L'Asta guardata
  aggiungi(682, { nome: "L'Asta guardata col link: niente rilanci né voto, niente di suo, targhetta", fai: async function () {
    var P = await tel("Paky", { x: 0 }), C = await apriStanzaDi(P, "asta");
    await tel("Giulia", { hash: "gioco=asta&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 2; }, 8000)) no("Giulia non entra");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { var f = vm(C).fase; return f && f !== "lobby"; }, 8000)) no("l'asta non comincia");
    var B = await beaGuarda("asta", C);
    // fino all'asta di una carta: chi sceglie, sceglie la prima
    var fino = Date.now() + 40000, visto = "";
    while (Date.now() < fino && vm(C).fase !== "asta") {
      var v = vm(C);
      if (v.fase === "scelta") { var chi = v.sceglieId === "host" ? P : W.finestra("Giulia"); var c = chi.document.querySelector(".as-carta:not([disabled])"); if (c) c.click(); }
      else if (v.fase === "round") W.clicca(P, /Vedi le carte/);
      await W.dorme(400);
    }
    if (vm(C).fase !== "asta") no("non si arriva all'asta di una carta (fase " + vm(C).fase + ")");
    if (!await W.aspetta(function () { return /Stai guardando la partita/.test(T(B)); }, 6000)) no("all'asta Bea non legge «Stai guardando la partita» («" + T(B).slice(0, 100) + "»)");
    visto = T(B);
    if ([].some.call(B.document.querySelectorAll("button"), function (b) { return /Rilancio|Passo/.test(b.textContent) && visibile(b) && !b.disabled; })) no("Bea (guarda) ha «Rilancio» o «Passo»");
    await faccinaDa(B, "Bea", "Giulia");
    controllaGuarda(B, "Bea", C, "all'asta");
    var mis = await misure(B, "Bea", ".sa-nota, .sa-pannello, .sa-platea");
    errori();
    return "Bea guarda l'asta: «Stai guardando la partita», niente Rilancio/Passo, 👏 a Giulia col nome, niente di suo, solo «__» (" + mis + ")" + (visto ? "" : "");
  } });

  // 683. Sì… però guardato
  aggiungi(683, { nome: "Sì… però guardato col link: niente carte (nessun «mano» per lei), «👀 Guardi la partita», targhetta", fai: async function () {
    var P = await tel("Paky", { x: 0 }), C = await apriStanzaDi(P, "sipero");
    await tel("Giulia", { hash: "gioco=sipero&stanza=" + C, x: 185 });
    await tel("Luca", { hash: "gioco=sipero&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 8000)) no("non entrano in 3");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 8000)) no("la partita non comincia");
    var B = await beaGuarda("sipero", C);
    if (!await W.aspetta(function () { return /Guardi la partita/.test(T(B)); }, 6000)) no("Bea non legge «👀 Guardi la partita» («" + T(B).slice(0, 120) + "»)");
    if (B.document.querySelector(".sp-azione .sp-carta, .sp-azione button")) no("Bea (guarda) ha carte o tasti");
    if ((vm(C).giocatori || []).some(function (g) { return g.nome === "Bea"; })) no("Bea è finita tra i giocatori");
    await faccinaDa(B, "Bea", "Luca");
    controllaGuarda(B, "Bea", C, "in partita");
    var mis = await misure(B, "Bea", ".sp-turno, .sp-azione");
    errori();
    return "Bea guarda: «Guardi la partita: fai il tifo!», niente carte né tasti, non è tra i giocatori, 👏 a Luca, niente di suo, solo «__» (" + mis + ")";
  } });

  // 684. Gara di pesca guardata fino alla fine, poi Bea entra alla gara dopo
  aggiungi(684, { nome: "Gara di pesca guardata col link fino alla fine; alla «Nuova partita» chi guardava entra nella saletta", fai: async function () {
    var P = await tel("Paky", { x: 0 }), C = await apriStanzaDi(P, "garapesca");
    await tel("Giulia", { hash: "gioco=garapesca&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 2; }, 8000)) no("Giulia non entra");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 8000)) no("la gara non comincia");
    var B = await beaGuarda("garapesca", C);
    if (!await W.aspetta(function () { return /Guardi la gara/.test(T(B)) && B.document.querySelector(".gp-guarda-tempo"); }, 6000)) no("Bea non vede la gara («" + T(B).slice(0, 100) + "»)");
    if ((vm(C).coda || []).length || (vm(C).players || []).some(function (p) { return p.nome === "Bea"; })) no("Bea è finita tra i pescatori o in coda");
    controllaGuarda(B, "Bea", C, "in gara");
    var mis = await misure(B, "Bea", ".gp-guarda-tempo, .gp-guarda, .schermata .modulo-nota");
    if (!await W.aspetta(function () { return vm(C).fase === "fine" && B.document.querySelector(".gp-fin"); }, 25000)) no("la gara non finisce sul telefono di Bea");
    await W.dorme(500);
    if (!/entri anche tu/.test(T(B))) no("a fine gara Bea non legge «👀 Quando l'host fa un'altra gara entri anche tu…»");
    controllaGuarda(B, "Bea", C, "a fine gara");
    var mf = await misure(B, "Bea", ".gp-podio, .schermata .modulo-nota");
    await nuovaEdEntra(P, C, "players");
    errori();
    return "Bea guarda la gara (tempo e classifica, niente coda né lago), fine con la nota e nessuna uscita del gioco (" + mis + "; fine " + mf + "), alla «Nuova partita» entra da sola nella saletta";
  } });

  // 685. Poker guardato fino alla fine
  aggiungi(685, { nome: "Poker guardato col link: niente carte sue, «👀 Guardi il tavolo», fino alla classifica e alla «Nuova partita»", fai: async function () {
    var o = await pkApri(true), P = o.P, C = o.C;
    var B = await beaGuarda("poker", C);
    if (!await W.aspetta(function () { return /Guardi il tavolo/.test(T(B)) && B.document.querySelector(".pk-tavolo"); }, 6000)) no("Bea non vede il tavolo con «👀 Guardi il tavolo» («" + T(B).slice(0, 100) + "»)");
    if (pkTasti(B).length) no("Bea (guarda) ha dei tasti: " + pkTasti(B).join(", "));
    if (pkMe(C, "Bea") || (vm(C).guardano || []).length) no("Bea è finita al tavolo o tra chi aspetta un posto");
    await pkLascia(C); await W.dorme(1500);
    await faccinaDa(B, "Bea", "Giulia");
    controllaGuarda(B, "Bea", C, "in partita");
    var mis = await misure(B, "Bea", ".pk-azioni, .pk-tavolo");
    // l'host chiude la partita (🏁): Bea vede la classifica, senza uscite del gioco
    var b = P.document.querySelector(".pk-tastino[aria-label='Fine partita']"); if (!b) no("Paky non ha il 🏁");
    b.click();
    if (!await W.aspetta(function () { return vm(C).fase === "fine" && /entri anche tu/.test(T(B)); }, 10000)) no("a fine partita Bea non legge «👀 Se l'host fa un'altra partita, entri anche tu…» («" + T(B).slice(0, 120) + "»)");
    controllaGuarda(B, "Bea", C, "a fine partita");
    await nuovaEdEntra(P, C, "players");
    errori();
    return "Bea guarda il tavolo (niente carte sue, niente tasti, 👏 a Giulia, solo «__», " + mis + "), classifica senza uscite del gioco, alla «Nuova partita» entra da sola nella saletta";
  } });

  // 686. Black Jack a tavolo pieno: si guarda invece di "pieno"
  aggiungi(686, { nome: "Black Jack a tavolo pieno: chi arriva guarda (in saletta si siede appena si libera un posto), niente «tavolo pieno, riprova»", fai: async function () {
    var P = await tel("Paky", { x: 0, prima: function (w) {   // (le richieste dell'host: per riempire il tavolo con 8 posti finti)
      // (prima che parta l'app: lo strato comune del core ci si mette sopra, quindi qui arrivano le richieste come dal broker)
      var vera = w.SGNet.ospita;
      w.SGNet.ospita = function (gid, cb, o) { if (gid === "blackjack") w.__cbBJ = cb; return vera.apply(this, arguments); };
    } });
    var C = await apriStanzaDi(P, "blackjack");
    if (!await W.aspetta(function () { return P.__cbBJ; }, 3000)) no("non trovo la stanza del Black Jack sul telefono di Paky");
    await tel("Giulia", { hash: "gioco=blackjack&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 2; }, 8000)) no("Giulia non entra");
    for (var i = 1; i <= 8; i++) P.__cbBJ.onMsg("finto" + i, { t: "join", nome: "Finto" + i, fiches: 500 });
    await W.dorme(400);
    if ((vm(C).giocatori || []).length !== 10) no("il tavolo non è pieno (" + (vm(C).giocatori || []).length + ")");
    var An = await tel("Anna", { hash: "gioco=blackjack&stanza=" + C, x: 370 });
    var idA = await W.aspetta(function () { return mioId("Anna"); }, 5000);
    if (!await W.aspetta(function () { return (vm(C).pieni || []).indexOf(idA) >= 0 && /Tavolo pieno/.test(T(An)); }, 6000)) no("in saletta piena Anna non guarda («" + T(An).slice(0, 100) + "», pieni: " + JSON.stringify(vm(C).pieni || null) + ")");
    if (/Riprova più tardi/.test(T(An))) no("Anna legge ancora «Il tavolo è pieno… Riprova più tardi»");
    // un posto finto se ne va: Anna si siede da sola
    P.__cbBJ.onAddio("finto8");
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).some(function (g) { return g.id === idA; }) && /Sei dentro/.test(T(An)); }, 6000)) no("si libera un posto ma Anna non si siede («" + T(An).slice(0, 100) + "»)");
    // a partita cominciata e tavolo pieno: chi arriva guarda
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "punta"; }, 8000)) no("la partita non comincia");
    var Lu = await tel("Luca", { hash: "gioco=blackjack&stanza=" + C, x: 555 });
    var idL = await W.aspetta(function () { return mioId("Luca"); }, 5000);
    if (!await W.aspetta(function () { return (vm(C).pieni || []).indexOf(idL) >= 0 && (vm(C).guardano || []).indexOf(idL) >= 0; }, 6000)) no("a tavolo pieno Luca non è tra chi guarda");
    if (!await W.aspetta(function () { return /tavolo è pieno \(10 su 10\): guardi/.test(T(Lu)) && Lu.document.querySelector(".bj-wrap"); }, 6000)) no("Luca non guarda il tavolo («" + T(Lu).slice(-100) + "»)");
    if (/Riprova più tardi|Tavolo chiuso/.test(T(Lu))) no("Luca è stato mandato via");
    if ((vm(C).giocatori || []).length !== 10) no("Luca ha preso un undicesimo posto");
    errori();
    return "saletta piena: Anna guarda («🪑 Tavolo pieno…») e si siede da sola quando si libera un posto; a partita cominciata Luca guarda il tavolo (10 su 10), nessuno mandato via";
  } });

  COPIONE.gruppo6g3 = async function () { var r = []; for (var n = 680; n <= 686; n++) r.push(await COPIONE.prova(n)); return r; };
  // (per la serata di prova 633 del copione: la mano di Black Jack a copione)
  COPIONE.g3p6 = { bjPasso: bjPasso, bjFinoA: bjFinoA, seatDi: seatDi };
})();

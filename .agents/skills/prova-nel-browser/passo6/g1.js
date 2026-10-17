// PROVE DEL PASSO 6, GRUPPO 1 (giochi a due, chi guarda): Tris, Drop 4, Battaglia Navale, Scopa, Calcio Biliardo.
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("passo6/g1.js"); await COPIONE.prova(661)      (oppure await COPIONE.gruppo6g1(): 661-665 in fila)
// 661 Tris · 662 Drop 4 · 663 Battaglia Navale · 664 Scopa · 665 Calcio Biliardo. Ogni scenario ha due parti:
//  A (percorso di prima, stanza di un gioco solo): Paky apre, Giulia gioca, Marco entra in più (guarda nella stanza) e Bea
//    apre il link con guarda=1. Bea: una sola targhetta "👀 Guardi", nessun "🏠 Esci" del gioco, niente "Tocca a te" né
//    "(tu)", niente 💬 (le sue mosse il core le butta: dal suo telefono passano solo messaggi "__"), il 😂 della targhetta
//    manda la faccina a Giulia col suo nome; a 360x640 e 412x915 la pagina non scorre e la targhetta non copre il tavolo.
//    Marco: niente "Tocca a te" né "(tu)". Si gioca fino alla fine: Bea legge "👀 Aspettiamo la prossima partita…" (mai
//    "si torna al tabellone", che vale solo nel torneo a eliminazione) e ancora nessun "🏠 Esci" del gioco.
//  B ("👑 Chi vince resta", DOPO p6-d: la fa girare p6-z): Sala con 4 (Paky, Giulia, Luca, Marco), il gioco a due →
//    "⚔️ Una sfida" → "Chi gioca?" → "👑 Chi vince resta"; due sfide di fila senza toccare niente tra l'una e l'altra; chi
//    guarda ha la targhetta e un solo modo per uscire; a fine sfida su tutti i telefoni niente tasti del gioco
//    ("👥 Nuovo avversario", "👥 Torna alla saletta", "🔄 Rivincita", "🏠 Esci" del gioco). Se il tasto non c'è ancora la
//    parte B dice "si fa dopo p6-d" (opz.senzaResta: true la salta).
// 666 Torneo a eliminazione (Tris in 3): chi guarda dal tabellone ha la fila delle faccine del core al posto del 💬 (il core
//     butta i messaggi del gioco di chi guarda); il suo 👏 arriva ai due col nome. Prende il posto della 807.
// Regole corte per fare presto (solo nelle prove, sui telefoni con opz.g1imp): Scopa una mano sola, Calcio a 1 gol.
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, vm = A.vm, no = A.no;
  var aggiungi = COPIONE.aggiungi.bind(COPIONE);
  var GRUPPO = ["tris", "drop4", "navale", "scopa", "calciobiliardo"];
  var NOMI = { tris: "Tris", drop4: "Drop 4", navale: "Battaglia Navale", scopa: "Scopa", calciobiliardo: "Calcio Biliardo" };
  var IMP = { scopa: { traguardo: 0 }, calciobiliardo: { gol: 1, vince: "gol" } };
  // quello che la targhetta non deve coprire (il tavolo di chi guarda)
  var TAVOLO = { tris: ".tr-griglia, .tr-stato", drop4: ".d4-tav, .d4-stato", navale: ".nav-guarda", scopa: ".sc-mensola", calciobiliardo: ".cb-targa.giu" };
  // e a fine partita (la nota "👀 Aspettiamo la prossima partita…" compresa)
  var FINE = { tris: ".tr-griglia, .tr-nota", drop4: ".d4-tav, .d4-nota", navale: ".nav-guarda, .nav-scena .modulo-nota", scopa: ".schermata .modulo-nota", calciobiliardo: ".schermata .modulo-nota, .cb-fine" };

  // ---- i telefoni con le regole corte (solo per le prove): Scopa una mano, Calcio a 1 gol ----
  if (!W.__prepG1p6) {
    W.__prepG1p6 = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepG1p6(w, nome, opz);
      if (!opz || !opz.g1imp) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && GRUPPO.indexOf(g.id) >= 0 && IMP[g.id]) {
            var av = g.avvia;
            g.avvia = function (t) { if (t.impostazioni) Object.keys(IMP[g.id]).forEach(function (k) { t.impostazioni[k] = IMP[g.id][k]; }); return av.apply(this, arguments); };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }
  function tel(nome, o) { return W.apriTel(nome, Object.assign({ g1imp: true }, o || {})); }

  // ---- aiuti ----
  function premi(w, nodo, x, y, tipo, id) {
    var Ev = w.PointerEvent || w.MouseEvent;
    nodo.dispatchEvent(new Ev(tipo, { clientX: x, clientY: y, pointerId: id || 7, pointerType: "touch", bubbles: true, cancelable: true, isPrimary: true }));
  }
  function pieni(b) { return (b || []).filter(Boolean).length; }
  function logDa(nome, C) { return W.BR.log.filter(function (l) { return l.indexOf(nome + " → " + C + "/") === 0; }); }
  function visibile(e) { if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.ownerDocument.defaultView.getComputedStyle(e).visibility !== "hidden"; }
  // i tasti "🏠 Esci" (o "Esci") del gioco che si vedono (quelli della targhetta del core no)
  function esciDelGioco(w) {
    return [].filter.call(w.document.querySelectorAll("button"), function (b) { return /Esci/.test(b.textContent) && !b.closest(".sg-guardo") && !b.closest(".sl-velo, .conferma-velo") && visibile(b); }).map(function (b) { return b.textContent; });
  }
  function avvDi(gid, v) {
    if (!v) return null;
    if (gid === "navale") return (v.ids || {}).avv || null;
    if (gid === "scopa") return v.avvId || v.idB || null;
    if (gid === "calciobiliardo") return ((v.players || [])[1] || {}).id || null;
    return v.avvId || null;
  }
  function inGioco(gid, v) {
    if (!v) return false;
    if (gid === "scopa") return v.t !== "lobby" && !!v.mano;
    if (gid === "navale") return v.fase === "piazza" || v.fase === "battaglia";
    return v.fase === "gioco";
  }
  // l'host apre la stanza di un gioco (percorso di prima)
  async function apriStanzaDi(w, gid) {
    var gia = await W.aspetta(function () { return /apro io/.test(T(w)) || w.document.querySelector(".tessera"); }, 5000);
    if (!gia) no("non trovo né la home né «Come giocate?»");
    if (!/apro io/.test(T(w))) {
      var tess = await W.aspetta(function () { return A.tessera(w, NOMI[gid]); }, 5000);
      if (!tess) no("non trovo la tessera " + NOMI[gid]);
      tess.click(); await W.dorme(200);
    }
    if (!W.clicca(w, /apro io/)) no("non trovo «Online: apro io la stanza»");
    await W.dorme(250);
    if (!W.clicca(w, /Apri la stanza/)) no("non trovo «Apri la stanza»");
    var C = await W.aspetta(function () { var b = w.document.querySelector(".sl-cod b"); return b && /^[A-Z0-9]{4}$/.test(b.textContent) ? b.textContent : null; }, 5000);
    if (!C) no("la stanza non ha il codice");
    return C;
  }

  // ---- le mosse a copione (H tiene la stanza, B è l'avversario) fino alla fine della partita ----
  async function finoAllaFine(gid, C, H, B) {
    var fine = function () { var v = vm(C); return !!v && v.fase === "fine"; };
    if (gid === "tris") { if (!await A.trisFinoAllaFine(C, H, B)) no("il Tris non finisce"); return; }
    if (gid === "drop4") {
      var fino = Date.now() + 60000;
      while (Date.now() < fino && !fine()) {
        var v = vm(C);
        if (v.fase === "gioco") {
          var w = W.finestra(v.turno === "G" ? H : B), tav = w.document.querySelector(".d4-tav"), area = w.document.querySelector(".d4-area");
          var pref = v.turno === "G" ? [0, 2, 4, 6, 1, 3, 5] : [1, 3, 5, 2, 4, 6, 0];
          var col = pref.filter(function (c) { return v.board[c] == null; })[0];
          if (tav && area && col != null) {
            var r = tav.getBoundingClientRect(), x = r.left + (col + 0.5) * r.width / 7, y = r.top + r.height / 2, n0 = pieni(v.board);
            premi(w, area, x, y, "pointerdown"); premi(w, area, x, y, "pointerup");
            await W.aspetta(function () { return pieni(vm(C).board) > n0 || fine(); }, 3000);
            await W.dorme(450);
            continue;
          }
        }
        await W.dorme(150);
      }
      if (!fine()) no("il Drop 4 non finisce");
      return;
    }
    if (gid === "navale") {
      await naviPronte(C, H, B);
      var NAVI = [{ x: 0, y: 0, o: 1 }, { x: 0, y: 2, o: 1 }, { x: 0, y: 4, o: 1 }, { x: 0, y: 6, o: 1 }, { x: 0, y: 8, o: 1 }], lens = [5, 4, 3, 3, 2], bers = [];
      NAVI.forEach(function (n, k) { for (var i = 0; i < lens[k]; i++) bers.push({ x: n.x + i, y: n.y }); });
      var mare = []; for (var yy = 9; yy >= 0; yy--) for (var xx = 9; xx >= 0; xx--) mare.push({ x: xx, y: yy });
      var P = W.finestra(H), fn = Date.now() + 60000;
      while (Date.now() < fn && !fine()) {
        var vn = vm(C);
        if (vn.fase === "battaglia") {
          var n1 = vn.n;
          if (vn.tocca === 0) {
            var b = bers.filter(function (c) { return vn.campi[1].charAt(c.y * 10 + c.x) === "0"; })[0];
            var cel = b && [].filter.call(P.document.querySelectorAll(".nav-board:not(.nav-mini) .nav-c"), function (d) { return d._i === b.y * 10 + b.x; })[0];
            if (cel) cel.click();
          } else {
            var m = mare.filter(function (c) { return vn.campi[0].charAt(c.y * 10 + c.x) === "0"; })[0];
            if (m) W.reteDi(B).invia({ t: "colpo", x: m.x, y: m.y, n: vn.n });
          }
          await W.aspetta(function () { return vm(C).n !== n1 || fine(); }, 3000);
          continue;
        }
        await W.dorme(150);
      }
      if (!fine()) no("la Battaglia non finisce");
      return;
    }
    if (gid === "scopa") {
      var Ps = W.finestra(H), fs = Date.now() + 120000;
      while (Date.now() < fs && !fine()) {
        var vs = vm(C);
        if (vs.mano) {
          if (vs.fase === "gioco" && !vs.presa && vs.turno === vs.io && vs.mano.length) {   // tocca a B (la foto è la sua)
            var t0 = JSON.stringify(vs.mano);
            W.reteDi(B).invia({ t: "gioca", carta: vs.mano[0].id, presa: null });
            await W.aspetta(function () { return JSON.stringify(vm(C).mano) !== t0 || vm(C).fase !== "gioco"; }, 3000);
            continue;
          }
          if (vs.fase === "gioco" && !vs.presa && vs.turno !== vs.io && Ps.document.querySelector(".sc-mensola.tuo")) {
            var mano = [].slice.call(Ps.document.querySelectorAll(".sc-mano-riga .sc-carta")), tv = [].slice.call(Ps.document.querySelectorAll(".sc-terra .sc-carta")), nT = (vs.tavolo || []).length;
            if (mano.length) {
              mano[0].click(); await W.dorme(120);
              if (mano[0].classList.contains("sel")) tv.forEach(function (c) { c.click(); });
              await W.aspetta(function () { var x = vm(C); return x.turno === x.io || x.fase !== "gioco" || (x.tavolo || []).length !== nT; }, 3000);
              continue;
            }
          }
          if (vs.fase === "fineround") W.clicca(Ps, /Continua/);
        }
        await W.dorme(200);
      }
      if (!fine()) no("la Scopa non finisce in 2 minuti");
      return;
    }
    // calciobiliardo: tirano tutti e due col Bot del gioco; H col dito finto, B manda il tiro
    var fc = Date.now() + 150000, ultimo = -1;
    while (Date.now() < fc && !fine()) {
      var vc = vm(C);
      if (vc.fase === "gioco" && vc.stato === "mira" && vc.st && vc.n !== ultimo) {
        var wc = W.finestra(vc.turno === 0 ? H : B), CB = wc.__CB, z = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var s = { x: vc.st.x.slice(), y: vc.st.y.slice(), vx: z.slice(), vy: z.slice() };
        var sc = CB.sceltaBot(s, vc.turno, "difficile", vc.solo || null);
        var vx = Math.cos(sc.a) * CB.VMAX * sc.p, vy = Math.sin(sc.a) * CB.VMAX * sc.p;
        ultimo = vc.n;
        if (vc.turno === 1) W.reteDi(B).invia({ t: "tiro", i: sc.i, vx: vx, vy: vy });
        else {
          var cv = wc.document.querySelector(".cb-scena canvas") || wc.document.querySelector("canvas");
          var sce = cv.parentNode, cw = sce.clientWidth, ch = sce.clientHeight, S = Math.min((cw - 20) / 1, (ch - 2 * 62) / (1.55 + 2 * 0.07));
          var ox = (cw - S) / 2, oy = (ch - S * 1.55) / 2, rc = cv.getBoundingClientRect();
          var x0 = ox + s.x[sc.i] * S, y0 = oy + s.y[sc.i] * S, fx = -Math.cos(sc.a), fy = -Math.sin(sc.a), posto = Infinity;
          if (fx > 0.01) posto = Math.min(posto, (cw - x0) / fx); else if (fx < -0.01) posto = Math.min(posto, x0 / -fx);
          if (fy > 0.01) posto = Math.min(posto, (ch - y0) / fy); else if (fy < -0.01) posto = Math.min(posto, y0 / -fy);
          var pieno = Math.max(24, Math.min(0.22 * S, posto - 8)), len = Math.max(0.1, sc.p) * pieno;
          premi(wc, cv, rc.left + x0, rc.top + y0, "pointerdown", 9);
          premi(wc, cv, rc.left + x0 + fx * len, rc.top + y0 + fy * len, "pointermove", 9);
          premi(wc, cv, rc.left + x0 + fx * len, rc.top + y0 + fy * len, "pointerup", 9);
        }
        await W.aspetta(function () { var x = vm(C); return x.n !== ultimo || x.fase === "fine"; }, 35000);
        continue;
      }
      await W.dorme(200);
    }
    if (!fine()) no("il Calcio Biliardo non finisce");
  }
  // Battaglia: B manda le navi in fila sulle righe pari, H "A caso" e "Pronto"
  async function naviPronte(C, H, B) {
    if (vm(C).fase === "battaglia") return;
    if (!await W.aspetta(function () { return vm(C).fase === "piazza"; }, 6000)) no("la Battaglia non arriva a «sistema le navi»");
    W.reteDi(B).invia({ t: "pronto", navi: [{ x: 0, y: 0, o: 1 }, { x: 0, y: 2, o: 1 }, { x: 0, y: 4, o: 1 }, { x: 0, y: 6, o: 1 }, { x: 0, y: 8, o: 1 }] });
    var P = W.finestra(H);
    if (!await W.aspetta(function () { return W.clicca(P, /A caso/); }, 5000)) no(H + " non trova «A caso»");
    await W.dorme(150);
    if (!W.clicca(P, /Pronto, si combatte/)) no(H + " non trova «Pronto»");
    if (!await W.aspetta(function () { return vm(C).fase === "battaglia"; }, 6000)) no("la battaglia non comincia");
  }

  // ---- chi guarda soltanto: i controlli sul telefono di chi guarda (durante la partita o alla fine) ----
  function controllaGuarda(gid, w, nome, quando) {
    var g = w.document.querySelectorAll(".sg-guardo");
    if (g.length !== 1) no(nome + " (" + quando + ") ha " + g.length + " targhette");
    var e = esciDelGioco(w); if (e.length) no(nome + " (" + quando + ") ha anche l'uscita del gioco: " + e.join(", "));
    var tx = T(w);
    if (/Tocca a te|\(tu\)/.test(tx)) no(nome + " (" + quando + ") legge «Tocca a te» o «(tu)»");
    if ([].some.call(w.document.querySelectorAll(".sgc-tasto"), visibile)) no(nome + " (" + quando + ") ha il 💬 (le sue mosse il core le butta)");
  }
  // a misura (larg x alt): la pagina non scorre e la targhetta non copre il tavolo. "" = tutto bene
  async function misuraGuarda(gid, w, nome, larg, alt, sel) {
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
    if (!cose.length) return "non trovo il tavolo (" + sel + ")";
    for (var i = 0; i < cose.length; i++) {
      var r = cose[i].getBoundingClientRect();
      if (r.bottom > alt + 1) return "«" + sel + "» esce dallo schermo (" + Math.round(r.bottom) + ")";
      if (r.left < rg.right - 1 && rg.left < r.right - 1 && r.top < rg.bottom - 1 && rg.top < r.bottom - 1) return "la targhetta copre «" + (cose[i].className || sel) + "» (" + Math.round(r.bottom) + " > " + Math.round(rg.top) + ")";
    }
    return "";
  }
  async function misureGuarda(gid, w, nome, sel) {
    var M = [[360, 640], [412, 915]], fatte = [];
    for (var k = 0; k < M.length; k++) { var e = await misuraGuarda(gid, w, nome, M[k][0], M[k][1], sel); if (e) no(nome + " a " + M[k].join("x") + ": " + e); fatte.push(M[k].join("x")); }
    var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(300);
    return fatte.join(" e ");
  }
  // il 😂 della targhetta: la fila delle faccine del core; la faccina arriva sul telefono di "a" col nome di chi guarda
  async function faccinaDa(w, nome, a) {
    var b = w.document.querySelector(".sg-guardo-fa"); if (!b) no(nome + ": la targhetta non ha il 😂");
    b.click();
    var fa = await W.aspetta(function () { return [].find.call(w.document.querySelectorAll(".sg-guardo-fila .sl-fa"), function (x) { return x.textContent === "👏"; }); }, 2000);
    if (!fa) no(nome + ": il 😂 non apre la fila delle faccine");
    fa.click();
    var wa = W.finestra(a);
    if (!await W.aspetta(function () { return [].some.call(wa.document.querySelectorAll(".sg-fa-volante"), function (x) { return /👏/.test(x.textContent) && x.textContent.indexOf(nome) >= 0; }); }, 4000))
      no(a + " non vede «👏 " + nome + "»");
    b.click();   // (si richiude)
  }

  // ---- parte A: chi guarda col link e chi è in più nella stanza ----
  async function parteA(gid) {
    var P = await tel("Paky", { x: 0 }), C = await apriStanzaDi(P, gid);
    var G = await tel("Giulia", { hash: "gioco=" + gid + "&stanza=" + C, x: 185 });
    var idG = await W.aspetta(function () { var a = avvDi(gid, vm(C)); return a && a === A.mioId("Giulia") ? a : null; }, 8000);
    if (!idG) no("Giulia non diventa l'avversario");
    var M = await tel("Marco", { hash: "gioco=" + gid + "&stanza=" + C, x: 370 });
    await W.dorme(1500);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("Paky non trova «Comincia» («" + T(P).slice(0, 80) + "»)");
    if (!await W.aspetta(function () { return inGioco(gid, vm(C)); }, 6000)) no("la partita non comincia");
    var B = await W.apriTel("Bea", { hash: "gioco=" + gid + "&stanza=" + C + "&guarda=1", x: 555, g1imp: true });
    if (!await W.aspetta(function () { return B.document.querySelector(".sg-guardo"); }, 6000)) no("Bea non ha la targhetta («" + T(B).slice(0, 80) + "»)");
    if (gid === "navale") await naviPronte(C, "Paky", "Giulia");
    var sel = TAVOLO[gid];
    if (!await W.aspetta(function () { return [].some.call(B.document.querySelectorAll(sel), visibile); }, 8000)) no("Bea non vede il tavolo («" + T(B).slice(0, 80) + "»)");
    await W.dorme(800);
    controllaGuarda(gid, B, "Bea", "in partita");
    if (/Tocca a te|\(tu\)/.test(T(M))) no("Marco (in più) legge «Tocca a te» o «(tu)»");
    await faccinaDa(B, "Bea", "Giulia");
    var mis = await misureGuarda(gid, B, "Bea", sel);
    // dal telefono di Bea passano solo messaggi del core ("__")
    var altri = logDa("Bea", C).filter(function (l) { return !/"t":"__/.test(l); });
    if (altri.length) no("dal telefono di Bea passano mosse del gioco: " + altri.slice(0, 2).join(" / "));
    await finoAllaFine(gid, C, "Paky", "Giulia");
    if (!await W.aspetta(function () { return /Aspettiamo la prossima partita/.test(T(B)); }, 6000)) no("a fine partita Bea non legge «👀 Aspettiamo la prossima partita…» («" + T(B).slice(-120) + "»)");
    if (/tabellone/.test(T(B))) no("fuori dal torneo Bea legge «si torna al tabellone»");
    controllaGuarda(gid, B, "Bea", "a fine partita");
    if (/Tocca a te|\(tu\)/.test(T(M))) no("Marco (in più) a fine partita legge «Tocca a te» o «(tu)»");
    var mf = await misureGuarda(gid, B, "Bea", FINE[gid]);   // (a fine partita: niente scorre, la nota si legge)
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "A: Bea guarda (una targhetta, nessun «🏠 Esci» del gioco, 👏 a Giulia col nome, solo messaggi «__», misure " + mis + "; fine " + mf + "), Marco in più senza «Tocca a te»";
  }

  // ---- parte B: "👑 Chi vince resta" (dopo p6-d) ----
  function nomeId(S, id) { var m = (vm(S).membri || []).filter(function (x) { return x.id === id; })[0]; return m ? m.nome : null; }
  var TASTI_GIOCO = /Nuovo avversario|Torna alla saletta|🔄 Rivincita|🔄 Nuova partita|Nuova partita \(stessi amici\)/;
  async function parteB(gid) {
    var w = {}, nomi = ["Paky", "Giulia", "Luca", "Marco"];
    w.Paky = await tel("Paky", { x: 0, salaSempre: true });
    var S = await A.apriSalaNuova("Paky");
    for (var i = 1; i < nomi.length; i++) w[nomi[i]] = await tel(nomi[i], { hash: "sala=" + S, x: 185 * i, salaSempre: true });
    if (!await W.aspetta(function () { return (vm(S).membri || []).length === 4; }, 10000)) no("nella Sala non sono entrati in 4");
    var dove = await A.toccaGiocoSala(w.Paky, NOMI[gid]);
    if (dove.dove !== "chi") no("con 4 nella Sala " + NOMI[gid] + " non apre «Chi gioca?» (" + dove.dove + ")");
    var bR = await W.aspetta(function () { return [].find.call(w.Paky.document.querySelectorAll("button"), function (b) { return /Chi vince resta/.test(b.textContent); }); }, 2000);
    if (!bR) return "B: «👑 Chi vince resta» non c'è ancora (si fa dopo p6-d)";
    bR.click();
    var sfide = [];
    for (var n = 1; n <= 2; n++) {
      var sf = await W.aspetta(function () { var r = vm(S).resta; return r && r.sfida && r.sfida.stanza && (r.n || 1) >= n ? r.sfida : null; }, 15000);
      if (!sf) no("la sfida " + n + " non parte (resta: " + JSON.stringify(vm(S).resta || null).slice(0, 120) + ")");
      var C = sf.stanza, a = nomeId(S, sf.a), b = nomeId(S, sf.b);
      if (!await W.aspetta(function () { return avvDi(gid, vm(C)) === sf.b || (inGioco(gid, vm(C)) && avvDi(gid, vm(C))); }, 15000)) no("sfida " + n + ": " + b + " non arriva al tavolo di " + a);
      if (!inGioco(gid, vm(C))) await W.aspetta(function () { return W.clicca(W.finestra(a), /Comincia/) || inGioco(gid, vm(C)); }, 15000);
      if (!await W.aspetta(function () { return inGioco(gid, vm(C)); }, 15000)) no("sfida " + n + " (" + a + "–" + b + ") non comincia");
      // chi guarda: la targhetta e un'uscita sola
      var guardano = nomi.filter(function (x) { return x !== a && x !== b; });
      await W.dorme(1500);
      guardano.forEach(function (x) {
        var wx = w[x];
        if (wx.document.querySelectorAll(".sg-guardo").length !== 1) no("sfida " + n + ": " + x + " guarda ma ha " + wx.document.querySelectorAll(".sg-guardo").length + " targhette");
        var e = esciDelGioco(wx); if (e.length) no("sfida " + n + ": " + x + " ha anche l'uscita del gioco: " + e.join(", "));
        if (/Tocca a te/.test(T(wx))) no("sfida " + n + ": " + x + " guarda e legge «Tocca a te»");
      });
      await finoAllaFine(gid, C, a, b);
      await W.dorme(1500);
      nomi.forEach(function (x) {
        var wx = w[x], tasti = [].filter.call(wx.document.querySelectorAll("button"), function (bt) { return TASTI_GIOCO.test(bt.textContent) && !bt.closest(".fine-tasti") && visibile(bt); });
        if (tasti.length) no("fine sfida " + n + ": " + x + " ha ancora i tasti del gioco (" + tasti.map(function (bt) { return bt.textContent; }).join(", ") + ")");
      });
      sfide.push(a + "–" + b);
    }
    var e2 = W.erroriTel(); if (e2.length) no("errori: " + e2.slice(0, 3).join(" / "));
    return "B: Chi vince resta, due sfide di fila (" + sfide.join(", ") + ") senza tocchi, chi guarda con la targhetta e un'uscita sola, niente tasti del gioco a fine sfida";
  }

  function scenario(n, gid) {
    aggiungi(n, { nome: NOMI[gid] + ": chi guarda (targhetta, faccine, un'uscita sola, misure) e «👑 Chi vince resta»", fai: async function (opz) {
      var a = await parteA(gid);
      if (opz && opz.senzaResta) return a;
      await A.pulisci();
      var b = await parteB(gid);
      return a + " · " + b;
    } });
  }
  scenario(661, "tris"); scenario(662, "drop4"); scenario(663, "navale"); scenario(664, "scopa"); scenario(665, "calciobiliardo");

  // 666. Torneo a eliminazione (Tris in 3, uno passa il turno e guarda dal tabellone): chi guarda non ha più il 💬 (le sue
  //      mosse il core le butta) ma la fila delle faccine del core; il suo 👏 arriva ai due che giocano col suo nome; la
  //      frase di chi gioca (💬) arriva a chi guarda. Niente targhetta (c'è il tabellone), niente "🏠 Esci" del gioco;
  //      a 360x640 la pagina non scorre e la fila sta sotto la griglia. (Prende il posto della 807 di migliora/adue-faccine.js)
  aggiungi(666, { nome: "Torneo a eliminazione: chi guarda manda le faccine del core, chi gioca le frasi, tutti le vedono", fai: async function () {
    var Sa = await A.salaConAmici(["Giulia", "Luca"]), S = Sa.S, P = Sa.w.Paky;
    var tn = function () { var e = vm(S).elim; return e && e.torneino ? e : null; };
    var nomeTn = function (E, id) { return id === "bot" ? "Bot" : (E.nomi || {})[id]; };
    if (!await W.aspetta(function () { return W.clicca(P, /Scegli (un|il primo) gioco|Prossimo gioco/); }, 4000)) no("non trovo «Scegli un gioco» nella Sala");
    var tess = await W.aspetta(function () { return A.tessera(P, "Tris"); }, 4000); if (!tess) no("non trovo il Tris nella Sala");
    tess.click();
    if (!await W.aspetta(function () { return P.document.querySelector(".torneino-sc"); }, 4000)) no("non si apre «Tris in 3»");
    var pass = [].find.call(P.document.querySelectorAll(".tn-opz .modo-chip"), function (x) { return x.textContent.indexOf("Passa il turno") >= 0; });
    if (!pass) no("non c'è «Passa il turno»");
    pass.click();
    if (!W.clicca(P, /Via al torneo/, ".piede button")) no("non c'è «⚔️ Via al torneo»");
    var E = await W.aspetta(function () { var e = tn(); return e && e.iniziato ? e : null; }, 5000); if (!E) no("il torneino non parte");
    var t0 = E.turni[0], gioca = t0.filter(function (p) { return p.b; })[0], passa = t0.filter(function (p) { return !p.b; })[0];
    var nA = nomeTn(E, gioca.a), nB = nomeTn(E, gioca.b), nG = nomeTn(E, passa.a), wA = W.finestra(nA), wB = W.finestra(nB), wG = W.finestra(nG);
    if (!await W.aspetta(function () { return vm(gioca.stanza).avvId; }, 12000)) no("la partita non si apre con tutti e due");
    await W.aspetta(function () { return W.clicca(wA, /Comincia/, ".sl-go"); }, 8000);
    if (!await W.aspetta(function () { return vm(gioca.stanza).fase === "gioco"; }, 8000)) no("la partita non comincia");
    var bg = await W.aspetta(function () { return wG.document.querySelector(".tb-guarda"); }, 8000); if (!bg) no(nG + " non ha «👀 Guarda»");
    bg.click();
    var fa = await W.aspetta(function () { return wG.document.querySelectorAll(".tr-cella").length === 9 && [].find.call(wG.document.querySelectorAll(".tr-piede .sl-fa"), function (x) { return x.textContent === "👏"; }); }, 8000);
    if (!fa) no(nG + " guarda ma non ha la fila delle faccine («" + T(wG).slice(0, 80) + "»)");
    if ([].some.call(wG.document.querySelectorAll(".sgc-tasto"), visibile)) no(nG + " guarda e ha ancora il 💬");
    if (wG.document.querySelector(".sg-guardo")) no(nG + " ha la targhetta anche nel torneo");
    var e0 = esciDelGioco(wG); if (e0.length) no(nG + " ha l'uscita del gioco: " + e0.join(", "));
    fa.click();
    var reG = function (w) { return [].some.call(w.document.querySelectorAll(".sg-fa-volante"), function (x) { return /👏/.test(x.textContent) && x.textContent.indexOf(nG) >= 0; }); };
    if (!await W.aspetta(function () { return reG(wA) && reG(wB); }, 4000)) no("i due che giocano non vedono «👏 " + nG + "»");
    // chi gioca (B, cerchio) manda una frase col 💬: chi guarda la vede
    var tB = [].find.call(wB.document.querySelectorAll(".sgc-tasto"), visibile); if (!tB) no(nB + " (gioca) non ha il 💬");
    tB.click(); await W.dorme(150);
    var fr = wB.document.querySelectorAll(".sgc-frasi button")[4]; if (!fr) no("il foglio delle frasi non si apre"); fr.click();
    if (!await W.aspetta(function () { return [].some.call(wG.document.querySelectorAll(".sgc-bolla"), function (b) { return /Dai, muoviti!/.test(b.textContent); }); }, 3000)) no(nG + " non vede la frase di " + nB);
    // a misura: la pagina non scorre e la fila sta sotto la griglia
    var f = document.getElementById("tel-" + nG), d = wG.document;
    f.style.width = "360px"; f.style.height = "640px"; void d.documentElement.offsetHeight; wG.dispatchEvent(new wG.Event("resize")); await W.dorme(500);
    if (d.documentElement.scrollHeight > 641) no(nG + " a 360x640: la pagina scorre");
    var rg = d.querySelector(".tr-griglia").getBoundingClientRect(), rf = d.querySelector(".tr-piede .sl-faccine").getBoundingClientRect();
    if (rf.top < rg.bottom - 1 || rf.bottom > 641) no(nG + " a 360x640: la fila delle faccine copre la griglia o esce dallo schermo");
    f.style.height = "740px"; wG.dispatchEvent(new wG.Event("resize"));
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return nA + "–" + nB + " giocano, " + nG + " guarda dal tabellone: «👏 " + nG + "» ai due con la fila del core (niente 💬, niente targhetta), «Dai, muoviti!» di " + nB + " a chi guarda, 360x640 senza scorrere";
  } });
  // 667. Scopa in tre: Bea apre il link con guarda=1 a partita cominciata e vede il tavolo a tre (la foto di chi guarda, senza
  //      carte in mano di nessuno, «👀» nei punti), una targhetta, nessun «🏠 Esci» del gioco, dal suo telefono solo «__»;
  //      a 360x640 e 412x915 niente scorre e la targhetta non copre la mensola
  aggiungi(667, { nome: "Scopa in tre: chi guarda col link vede il tavolo a tre", fai: async function () {
    var P = await tel("Paky", { x: 0 });
    var tess = await W.aspetta(function () { return A.tessera(P, "Scopa"); }, 6000); if (!tess) no("non trovo la tessera della Scopa");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /apro io/)) no("non trovo «Online: apro io la stanza»");
    await W.dorme(400);
    if (!W.clicca(P, /In tre/)) no("nelle impostazioni non c'è «In tre»");
    if (!W.clicca(P, /Apri la stanza/)) no("non trovo «Apri la stanza»");
    var C = await W.aspetta(function () { return A.codiceSaletta(P) || A.codiceTestata(P); }, 5000); if (!C) no("la stanza non ha il codice");
    await tel("Giulia", { hash: "gioco=scopa&stanza=" + C, x: 185 });
    await tel("Luca", { hash: "gioco=scopa&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return P.document.querySelectorAll(".sl-av:not(.sl-vuoto)").length >= 3; }, 9000)) no("i tre non sono nella saletta a tre");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 4000)) no("non trovo «Comincia»");
    var B = await W.apriTel("Bea", { hash: "gioco=scopa&stanza=" + C + "&guarda=1", x: 555, g1imp: true });
    var alTavolo3 = function (w) { return !!(w.document.querySelector(".sc-mensola1") && w.document.querySelectorAll(".sc-targa4").length === 2); };
    if (!await W.aspetta(function () { return alTavolo3(B) && /👀/.test((B.document.querySelector(".sc-punti1") || {}).textContent || ""); }, 9000)) no("Bea non vede il tavolo a tre («" + T(B).slice(0, 80) + "»)");
    await W.dorme(800);
    if (B.document.querySelectorAll(".sc-mano-riga .sc-carta").length) no("Bea vede le carte in mano di qualcuno");
    controllaGuarda("scopa", B, "Bea", "al tavolo a tre");
    var mis = await misureGuarda("scopa", B, "Bea", ".sc-mensola");
    var altri = logDa("Bea", C).filter(function (l) { return !/"t":"__/.test(l); });
    if (altri.length) no("dal telefono di Bea passano mosse del gioco: " + altri.slice(0, 2).join(" / "));
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Bea guarda il tavolo a tre (senza carte in mano, «👀»), una targhetta, nessun «🏠 Esci» del gioco, solo «__», misure " + mis;
  } });
  COPIONE.gruppo6g1 = async function (opz) { var out = []; for (var n = 661; n <= 667; n++) out.push(await COPIONE.prova(n, opz)); return out; };
})();

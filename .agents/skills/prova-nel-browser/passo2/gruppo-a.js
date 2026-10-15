// PROVE DEL PASSO 2, GRUPPO A (giochi a due): Tris, Drop 4, Battaglia Navale, Scopa, Calcio Biliardo.
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("passo2/gruppo-a.js"); await COPIONE.prova(201)
//
// 201-205 (riscritti da p2-z dopo p2-f: la fine è quella del core; prima erano col contratto "neutro"), uno per gioco. Sala con 3 telefoni (salaSempre):
//   Paky apre il gioco dalla tessera ("Online con gli amici"), Giulia e Luca arrivano dal link della Sala.
//   Nel telefono di Paky "gioca solo chi è scelto" è finto (Paky e Luca): Giulia entra per prima ma GUARDA, Luca gioca.
//   1ª partita fino alla fine: col contratto neutro la fine è quella di sempre (host "Rivincita/Nuova partita", Luca
//   "In attesa dell'host…", Giulia senza tasti di chi gioca). Poi la Rivincita di sempre → 2ª partita.
//   Nella 2ª partita i tasti di fine del core sono FINTI (w.__tfFinto, li disegna questo file): i giochi devono metterli
//   nel piede al posto dei loro (le faccine restano sopra) e "↻" (o.nuova) deve riportare tutti nella saletta, con lo
//   stesso avversario; "Comincia" → 3ª partita. (Quando p2-f è unito i tasti finti non servono più: vedi 201f…)
// 201f-205f (DOPO p2-f, le fa girare p2-z): fine vera del core: Paky "↻ Rivincita" e "🎮 Cambia gioco", Luca "👍 Ci sto!" e
//   "🏠 Torna in Sala"; Ci sto → "👍 1" sul tasto di Paky; Rivincita → 3-2-1 e si gioca senza altri tocchi; alla fine
//   "Cambia gioco" porta tutti nella Sala.
// 201h-205h (DOPO p2-h, le fa girare p2-z): Sala con 4; dalla Sala Paky lancia il gioco: "Chi gioca a …?" (o il torneino:
//   si sceglie "⚔️ Una sfida"), sceglie Luca: gioca Luca, Giulia e Marco guardano (nessun "Tocca a te").
// Mosse a copione: Tris e Drop 4 coi tocchi veri; Battaglia: Luca manda navi messe da qui (così Paky sa dove sparare);
// Scopa "una mano sola" e Calcio "a 1 gol" (regole cambiate da qui solo per la prova); Calcio: tiri scelti col Bot del gioco.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T;
  var GRUPPO = ["tris", "drop4", "navale", "scopa", "calciobiliardo"];

  // ---- i telefoni con la "spia" dei giochi: prima che il gioco parta, si può cambiare il tavolo (solo per le prove) ----
  // opz.finti = true: sui giochi del gruppo A, t.tastiFine e t.puoSedersi diventano finti QUANDO lo dice il telefono
  // (w.__tfFinto = true: tasti di fine finti; w.__scelti = ["Paky","Luca"]: si siede solo chi è in lista);
  // w.__imp = { traguardo: 0 } cambia le regole del gioco che parte (solo l'host le legge)
  if (!W.__prepGruppoA) {
    W.__prepGruppoA = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepGruppoA(w, nome, opz);
      if (!opz || !opz.finti) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) { if (g && GRUPPO.indexOf(g.id) >= 0) spia(w, g); return reg.apply(this, arguments); };
      } });
    };
  }
  function spia(w, g) {
    var avvia = g.avvia;
    g.avvia = function (t) {
      if (w.__imp && t.impostazioni) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
      var tf = t.tastiFine, ps = t.puoSedersi;
      t.tastiFine = function (piede, o) {
        if (!w.__tfFinto) return tf ? tf.apply(this, arguments) : false;
        w.__tf = (w.__tf || []).concat([{ host: !!o.host, nuova: !!o.nuova, esci: !!o.esci }]);
        var box = w.document.createElement("div"); box.className = "tf-finto";
        if (o.host && o.nuova) { var b = w.document.createElement("button"); b.className = "btn btn-primario"; b.textContent = "FINTO ↻"; b.onclick = function () { o.nuova(); }; box.appendChild(b); }
        if (!o.host) { var c = w.document.createElement("button"); c.className = "btn btn-primario"; c.textContent = "FINTO 👍"; box.appendChild(c); }
        var e = w.document.createElement("button"); e.className = "btn btn-fantasma"; e.textContent = "FINTO 🏠"; e.onclick = function () { if (o.esci) o.esci(); }; box.appendChild(e);
        piede.appendChild(box);
        return true;
      };
      t.puoSedersi = function (id, nome) {
        if (!w.__scelti) return ps ? ps.apply(this, arguments) : true;
        return w.__scelti.indexOf(String(nome || "").trim()) >= 0;
      };
      return avvia.apply(this, arguments);
    };
  }

  // ---- aiuti ----
  function premi(w, nodo, x, y, tipo, id) {
    var Ev = w.PointerEvent || w.MouseEvent;
    nodo.dispatchEvent(new Ev(tipo, { clientX: x, clientY: y, pointerId: id || 7, pointerType: "touch", bubbles: true, cancelable: true, isPrimary: true }));
  }
  function tf(w) { return w.document.querySelector(".tf-finto"); }
  function faccineSopra(w) {   // nel piede le faccine stanno prima dei tasti finti
    var b = tf(w); if (!b || !b.parentNode) return false;
    var fa = b.parentNode.querySelector(".sl-faccine");
    return !fa || !!(fa.compareDocumentPosition(b) & 4);
  }
  function avvDi(gid, v) {   // l'id di chi gioca contro l'host, dalla foto
    if (!v) return null;
    if (gid === "navale") return (v.ids || {}).avv || null;
    if (gid === "scopa") return v.avvId || v.idB || null;
    if (gid === "calciobiliardo") return ((v.players || [])[1] || {}).id || null;
    return v.avvId || null;
  }
  function finita(gid, v) { return !!v && v.fase === "fine"; }
  function inGioco(gid, v) {
    if (!v) return false;
    if (gid === "scopa") return v.t !== "lobby" && !!v.mano;   // (la foto della saletta è { t: "lobby" })
    if (gid === "navale") return v.fase === "piazza" || v.fase === "battaglia";
    return v.fase === "gioco";
  }
  function inSaletta(gid, v) { return !!v && (gid === "scopa" ? v.t === "lobby" : v.fase === "lobby"); }

  // ---- le partite a copione: giocano Paky (host) e Luca; finiscono quando la foto dice "fine" ----
  var MOSSE = {
    tris: async function (C) {
      var fino = Date.now() + 30000;
      while (Date.now() < fino && !finita("tris", vm(C))) {
        var v = vm(C), chi = v.turno === "X" ? "Paky" : "Luca", w = W.finestra(chi);
        if (v.fase === "gioco") {
          var celle = w.document.querySelectorAll(".tr-cella"), k = (v.board || []).indexOf(null);
          var n0 = (v.board || []).filter(Boolean).length;
          if (k >= 0 && celle[k] && !celle[k].disabled) { celle[k].click(); await W.aspetta(function () { return (vm(C).board || []).filter(Boolean).length > n0 || finita("tris", vm(C)); }, 3000); continue; }
        }
        await W.dorme(120);
      }
    },
    drop4: async function (C) {
      var fino = Date.now() + 40000;
      while (Date.now() < fino && !finita("drop4", vm(C))) {
        var v = vm(C);
        if (v.fase === "gioco") {
          var chi = v.turno === "G" ? "Paky" : "Luca", w = W.finestra(chi), tav = w.document.querySelector(".d4-tav"), area = w.document.querySelector(".d4-area");
          var pref = v.turno === "G" ? [0, 2, 4, 6, 1, 3, 5] : [1, 3, 5, 2, 4, 6, 0];
          var col = pref.filter(function (c) { return v.board[c] == null; })[0];
          if (tav && area && col != null) {
            var r = tav.getBoundingClientRect(), x = r.left + (col + 0.5) * r.width / 7, y = r.top + r.height / 2, n0 = (v.board || []).filter(Boolean).length;
            premi(w, area, x, y, "pointerdown"); premi(w, area, x, y, "pointerup");
            await W.aspetta(function () { return (vm(C).board || []).filter(Boolean).length > n0 || finita("drop4", vm(C)); }, 3000);
            await W.dorme(450);   // (niente doppio tocco: la pedina deve cadere)
            continue;
          }
        }
        await W.dorme(150);
      }
    },
    navale: async function (C) {
      // Luca: le navi in fila sulle righe pari (si sa dove sono: Paky spara lì); Paky: "A caso" e "Pronto"
      var naviL = [{ x: 0, y: 0, o: 1 }, { x: 0, y: 2, o: 1 }, { x: 0, y: 4, o: 1 }, { x: 0, y: 6, o: 1 }, { x: 0, y: 8, o: 1 }], lens = [5, 4, 3, 3, 2], bersagli = [];
      naviL.forEach(function (n, k) { for (var i = 0; i < lens[k]; i++) bersagli.push({ x: n.x + i, y: n.y }); });
      var P = W.finestra("Paky");
      if (!await W.aspetta(function () { return vm(C).fase === "piazza"; }, 5000)) no("la Battaglia non arriva a «sistema le navi»");
      W.reteDi("Luca").invia({ t: "pronto", navi: naviL });
      if (!await W.aspetta(function () { return W.clicca(P, /A caso/); }, 4000)) no("Paky non trova «A caso»");
      await W.dorme(150);
      if (!W.clicca(P, /Pronto, si combatte/)) no("Paky non trova «Pronto»");
      if (!await W.aspetta(function () { return vm(C).fase === "battaglia"; }, 6000)) no("la battaglia non comincia");
      var mare = []; for (var y = 9; y >= 0; y--) for (var x = 9; x >= 0; x--) mare.push({ x: x, y: y });
      var fino = Date.now() + 60000;
      while (Date.now() < fino && !finita("navale", vm(C))) {
        var v = vm(C);
        if (v.fase === "battaglia") {
          var n0 = v.n;
          if (v.tocca === 0) {
            var b = bersagli.filter(function (c) { return v.campi[1].charAt(c.y * 10 + c.x) === "0"; })[0];
            var cel = b && [].filter.call(P.document.querySelectorAll(".nav-board:not(.nav-mini) .nav-c"), function (d) { return d._i === b.y * 10 + b.x; })[0];
            if (cel) cel.click();
          } else {
            var m = mare.filter(function (c) { return v.campi[0].charAt(c.y * 10 + c.x) === "0"; })[0];
            if (m) W.reteDi("Luca").invia({ t: "colpo", x: m.x, y: m.y, n: v.n });
          }
          await W.aspetta(function () { return vm(C).n !== n0 || finita("navale", vm(C)); }, 3000);
          continue;
        }
        await W.dorme(150);
      }
    },
    scopa: async function (C) {
      // una mano sola (w.__imp): Luca manda la sua carta (la presa la sceglie il gioco), Paky tocca le sue carte
      var P = W.finestra("Paky"), fino = Date.now() + 120000;
      while (Date.now() < fino) {
        var v = vm(C);
        if (v.fase === "fine") return;
        if (v.mano) {
          if (v.fase === "gioco" && !v.presa && v.turno === v.io && v.mano && v.mano.length) {   // tocca a Luca (la foto è la sua)
            var t0 = JSON.stringify(v.mano);
            W.reteDi("Luca").invia({ t: "gioca", carta: v.mano[0].id, presa: null });
            await W.aspetta(function () { return JSON.stringify(vm(C).mano) !== t0 || vm(C).fase !== "gioco"; }, 3000);
            continue;
          }
          var mens = P.document.querySelector(".sc-mensola.tuo");
          if (v.fase === "gioco" && !v.presa && v.turno !== v.io && mens) {
            var mano = [].slice.call(P.document.querySelectorAll(".sc-mano-riga .sc-carta")), tav = [].slice.call(P.document.querySelectorAll(".sc-terra .sc-carta"));
            var nTav = (v.tavolo || []).length, nOpp = v.oppN;
            if (mano.length) {
              mano[0].click(); await W.dorme(120);
              if (mano[0].classList.contains("sel")) { tav.forEach(function (c) { c.click(); }); }   // più prese: si sceglie (tocchi in fila)
              await W.aspetta(function () { var x = vm(C); return x.turno === x.io || x.fase !== "gioco" || (x.tavolo || []).length !== nTav; }, 3000);
              continue;
            }
          }
          if (v.fase === "fineround") { W.clicca(P, /Continua/); }
        }
        await W.dorme(200);
      }
      no("la Scopa non finisce in 2 minuti");
    },
    calciobiliardo: async function (C) {
      // a 1 gol (w.__imp): tirano tutti e due col Bot del gioco; Paky col dito finto (dal campo allo schermo)
      var fino = Date.now() + 150000, ultimo = -1;
      while (Date.now() < fino && !finita("calciobiliardo", vm(C))) {
        var v = vm(C);
        if (v.fase === "gioco" && v.stato === "mira" && v.st && v.n !== ultimo) {
          var chi = v.turno === 0 ? "Paky" : "Luca", w = W.finestra(chi), CB = w.__CB, z = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          var s = { x: v.st.x.slice(), y: v.st.y.slice(), vx: z.slice(), vy: z.slice() };
          var sc = CB.sceltaBot(s, v.turno, "difficile", v.solo || null);
          var vx = Math.cos(sc.a) * CB.VMAX * sc.p, vy = Math.sin(sc.a) * CB.VMAX * sc.p;
          ultimo = v.n;
          if (v.turno === 1) W.reteDi("Luca").invia({ t: "tiro", i: sc.i, vx: vx, vy: vy });
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
  };
  var NOMI = { tris: "Tris", drop4: "Drop 4", navale: "Battaglia Navale", scopa: "Scopa", calciobiliardo: "Calcio Biliardo" };
  var IMP = { scopa: { traguardo: 0 }, calciobiliardo: { gol: 1 } };

  // la Sala con Paky, Giulia e Luca nel gioco: Giulia arriva prima ma guarda (scelti finti: Paky e Luca)
  async function salaTre(gid, scelti) {
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true, finti: true, prima: function (w) { w.__scelti = scelti || ["Paky", "Luca"]; w.__imp = IMP[gid] || null; } });
    var nomeG = NOMI[gid];
    var tess = await W.aspetta(function () { return A.tessera(P, nomeG); }, 5000);
    if (!tess) {   // (il nome della tessera: si cerca per id del gioco nelle tessere)
      var tutte = [].map.call(P.document.querySelectorAll(".tessera h2"), function (h) { return h.textContent; });
      no("non trovo la tessera «" + nomeG + "» (" + tutte.slice(0, 30).join(", ") + ")");
    }
    var X = await A.salaDaGioco("Paky", nomeG), S = X.S, C = X.C;
    var G = await W.apriTel("Giulia", { hash: "sala=" + S, x: 185, salaSempre: true, finti: true });
    if (!await W.aspetta(function () { var h = W.reteDi("Giulia"); return h && h.stato && h.stato().id && Object.keys(vm(C)).length; }, 6000)) no("Giulia non entra nella stanza del gioco");
    await W.dorme(600);
    if (avvDi(gid, vm(C))) no("Giulia (non scelta) si è seduta a giocare");
    var L = await W.apriTel("Luca", { hash: "sala=" + S, x: 370, salaSempre: true, finti: true });
    var idL = await W.aspetta(function () { var a = avvDi(gid, vm(C)); return a && a === A.mioId("Luca") ? a : null; }, 8000);
    if (!idL) no("Luca (scelto) non diventa l'avversario (avversario: " + avvDi(gid, vm(C)) + ", Luca " + A.mioId("Luca") + ")");
    return { P: P, G: G, L: L, S: S, C: C, idL: idL };
  }
  async function comincia(gid, X) {
    if (!await W.aspetta(function () { return W.clicca(X.P, /Comincia/); }, 6000)) no("Paky non trova «Comincia» («" + T(X.P).slice(0, 80) + "»)");
    if (!await W.aspetta(function () { return inGioco(gid, vm(X.C)); }, 6000)) no("la partita non comincia");
  }
  // la fine di sempre (contratto neutro): l'host ha il suo tasto, Luca aspetta l'host, Giulia guarda
  var RIV = /Rivincita|Nuova partita/;
  function fineOggi(gid, X) {
    var tP = T(X.P), tL = T(X.L), tG = T(X.G);
    if (!RIV.test(tP)) no("a fine partita Paky non ha la sua Rivincita («" + tP.slice(-120) + "»)");
    if (gid !== "calciobiliardo" && !/In attesa dell'host|Aspetta: la rivincita/.test(tL)) no("a fine partita Luca non legge l'attesa dell'host («" + tL.slice(-120) + "»)");
    if (RIV.test(tL) || RIV.test(tG)) no("Luca o Giulia hanno il tasto della rivincita");
    if (tf(X.P) || tf(X.L) || tf(X.G)) no("ci sono tasti finti senza averli chiesti");
    if (gid !== "drop4" && !/Esci/.test(tL)) no("Luca non ha «🏠 Esci»");   // (in Drop 4 si esce col ‹ in alto)
  }

  // (p2-z, 15 ott) dopo p2-f la fine nella Sala è sempre quella del core: 201-205 provano chi non è scelto (guarda), i tasti
  // del core nel piede (faccine sopra, niente ridisegni) e la Rivincita del core con lo stesso avversario.
  // (fineOggi e i tasti finti restano per chi vuole riprovare il contratto neutro a mano)
  function fineCore(w) { return w.document.querySelector(".fine-tasti"); }
  function faccineSopraCore(w) {
    var b = fineCore(w); if (!b || !b.parentNode) return false;
    var fa = b.parentNode.querySelector(".sl-faccine");
    return !fa || !!(fa.compareDocumentPosition(b) & 4);
  }
  function scenario201(gid) {
    return { nome: NOMI[gid] + " nella Sala (gruppo A): chi non è scelto guarda, tasti di fine del core nel piede, Rivincita con lo stesso avversario", fai: async function () {
      var X = await salaTre(gid), C = X.C, note = [];
      await comincia(gid, X);
      await MOSSE[gid](C);
      if (!finita(gid, vm(C))) no("la 1ª partita non finisce («" + T(X.P).slice(0, 80) + "»)");
      // (la fine di Luca arriva un attimo dopo: l'animazione della vittoria)
      if (!await W.aspetta(function () { return fineCore(X.P) && fineCore(X.L); }, 6000)) no("a fine partita i tasti del core non ci sono (Paky " + !!fineCore(X.P) + ", Luca " + !!fineCore(X.L) + ")");
      await W.dorme(400);
      if (!/Rivincita/.test(fineCore(X.P).textContent)) no("Paky non ha «↻ Rivincita» («" + fineCore(X.P).textContent + "»)");
      if (!/Ci sto/.test(fineCore(X.L).textContent)) no("Luca non ha «👍 Ci sto!» («" + fineCore(X.L).textContent + "»)");
      if (/Ci sto/.test(T(X.G))) no("Giulia (guarda) ha «Ci sto»");
      if (/In attesa dell'host|Aspetta: la rivincita/.test(T(X.L))) no("Luca ha i tasti del core e anche l'attesa di sempre");
      if ([].some.call(X.P.document.querySelectorAll("button"), function (b) { return /Nuova partita/.test(b.textContent) && !b.closest(".fine-tasti"); })) no("Paky ha i tasti del core e anche quelli di sempre del gioco");
      if (!faccineSopraCore(X.P) || !faccineSopraCore(X.L)) no("le faccine non stanno sopra i tasti");
      var nodoP = fineCore(X.P);
      await W.dorme(1500);
      if (fineCore(X.P) !== nodoP) no("i tasti di fine si ridisegnano da soli");
      note.push("fine: tasti del core (faccine sopra, fermi), Giulia guarda");
      W.clicca(X.P, /Rivincita/, ".fine-tasti button");
      if (!await W.aspetta(function () { return inGioco(gid, vm(C)); }, 9000)) no("dopo «↻ Rivincita» la partita non riparte");
      if (avvDi(gid, vm(C)) !== X.idL) no("nella rivincita l'avversario non è più Luca (" + avvDi(gid, vm(C)) + ")");
      note.push("Rivincita → di nuovo Luca");
      return note.join("; ");
    } };
  }

  // ---- DOPO p2-f (le fa girare p2-z): la fine vera del core ----
  function scenarioF(gid) {
    return { nome: "(dopo p2-f) " + NOMI[gid] + " nella Sala: Ci sto, Rivincita col 3-2-1, Cambia gioco", fai: async function () {
      var X = await salaTre(gid), C = X.C;

      await comincia(gid, X);
      await MOSSE[gid](C);
      if (!await W.aspetta(function () { return X.P.document.querySelector(".fine-tasti"); }, 5000)) no("serve p2-f: a fine partita il core non disegna i tasti («" + T(X.P).slice(-80) + "»)");
      await W.aspetta(function () { return fineCore(X.L) && /Ci sto/.test(T(X.L)); }, 6000);   // (la fine di Luca arriva un attimo dopo: l'animazione)
      if (!/Rivincita/.test(T(X.P)) || !/Cambia gioco/.test(T(X.P))) no("Paky non ha «↻ Rivincita» e «🎮 Cambia gioco» («" + T(X.P).slice(-120) + "»)");
      if (!/Ci sto/.test(T(X.L)) || !/Torna in Sala/.test(T(X.L))) no("Luca non ha «👍 Ci sto!» e «🏠 Torna in Sala» («" + T(X.L).slice(-120) + "»)");
      if (/Ci sto/.test(T(X.G))) no("Giulia (guarda) ha «Ci sto»");
      W.clicca(X.L, /Ci sto/);
      if (!await W.aspetta(function () { return /Rivincita · 👍 1/.test(T(X.P)); }, 4000)) no("sul tasto di Paky non compare «👍 1»");
      W.clicca(X.P, /Rivincita/);
      var t0 = Date.now();
      if (!await W.aspetta(function () { return inGioco(gid, vm(C)); }, 9000)) no("dopo «Rivincita» la partita non riparte da sola col 3-2-1");
      var dt = ((Date.now() - t0) / 1000).toFixed(1);
      if (avvDi(gid, vm(C)) !== X.idL) no("nella rivincita l'avversario non è Luca");
      await MOSSE[gid](C);
      if (!await W.aspetta(function () { return W.clicca(X.P, /Cambia gioco/); }, 5000)) no("alla 2ª fine Paky non trova «Cambia gioco»");
      var inSala = function (w) { return /Sala/.test(W.testo(w)) && w.document.querySelector(".saletta-schermo, .tessera"); };
      if (!await W.aspetta(function () { return !vm(X.S).gioco && inSala(X.L) && inSala(X.G); }, 6000)) no("«Cambia gioco» non porta tutti nella Sala");
      return "Ci sto → 👍 1; Rivincita → si gioca in " + dt + " s senza altri tocchi; Cambia gioco → tutti nella Sala";
    } };
  }

  // ---- DOPO p2-h (le fa girare p2-z): "Chi gioca a …?" con 4 nella Sala ----
  function scenarioH(gid) {
    return { nome: "(dopo p2-h) " + NOMI[gid] + ": Sala con 4, Paky sceglie Luca, gli altri guardano", fai: async function () {
      var P = await W.apriTel("Paky", { x: 0, salaSempre: true });
      var X = await A.salaDaGioco("Paky", "Tris"), S = X.S;
      var nomi = ["Giulia", "Luca", "Marco"];
      for (var i = 0; i < nomi.length; i++) await W.apriTel(nomi[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true });
      if (!await W.aspetta(function () { return (vm(S).membri || []).length === 4; }, 8000)) no("nella Sala non sono in 4");
      W.clicca(P, /‹/, ".testa button, .sc-esci, .d4-esci");
      if (!await W.aspetta(function () { return !vm(S).gioco && W.clicca(P, /Scegli (un|il primo) gioco|Prossimo gioco|Cambia gioco/); }, 6000)) no("nella Sala non c'è «Scegli un gioco»");
      var tess = await W.aspetta(function () { return A.tessera(P, NOMI[gid]); }, 4000); if (!tess) no("non trovo " + NOMI[gid] + " tra i giochi della Sala");
      tess.click(); await W.dorme(300);
      if (W.clicca(P, /Una sfida/, ".tn-scelta")) { await W.dorme(200); W.clicca(P, /Scegli chi gioca/, ".piede button"); await W.dorme(300); }   // (il torneo è la prima scelta: qui si prova la sfida)
      if (!/Chi gioca/.test(T(P))) no("serve p2-h: non si apre «Chi gioca a " + NOMI[gid] + "?» («" + T(P).slice(0, 80) + "»)");
      // Luca al posto di chi è già scelto (se Paky è dentro, tocca Luca; se non basta, tocca anche Giulia per toglierla)
      var av = A.avatarDi(P, "Luca") || [].find.call(P.document.querySelectorAll("button, [role=button], .chi-gioca *"), function (b) { return /Luca/.test(b.textContent) && b.children.length < 4; });
      if (!av) no("in «Chi gioca» non trovo Luca");
      av.click(); await W.dorme(200);
      if (!W.clicca(P, /Si gioca/)) no("non trovo «▶ Si gioca»");
      var C = await W.aspetta(function () { return vm(S).gioco === gid && vm(S).stanza; }, 5000); if (!C) no("il gioco non parte nella Sala");
      var idL = await W.aspetta(function () { var a = avvDi(gid, vm(C)); return a && a === A.mioId("Luca") ? a : null; }, 8000);
      if (!idL) no("non gioca Luca (avversario " + avvDi(gid, vm(C)) + ")");
      await W.dorme(800);
      ["Giulia", "Marco"].forEach(function (n) { if (/Tocca a te/.test(T(W.finestra(n)))) no(n + " legge «Tocca a te»"); });
      return "Chi gioca: Luca contro Paky, Giulia e Marco guardano";
    } };
  }

  GRUPPO.forEach(function (gid, k) {
    COPIONE.aggiungi(201 + k, scenario201(gid));
    COPIONE.aggiungi((201 + k) + "f", scenarioF(gid));
    COPIONE.aggiungi((201 + k) + "h", scenarioH(gid));
  });
  // le prove di questo file in fila: await COPIONE.gruppoA()          (solo 201-205)
  //                                  await COPIONE.gruppoA(true)      (anche 201f-205h: dopo p2-f e p2-h)
  COPIONE.gruppoA = async function (tutte) {
    var r = [];
    for (var k = 0; k < GRUPPO.length; k++) {
      r.push(await COPIONE.prova(201 + k));
      if (tutte) { r.push(await COPIONE.prova((201 + k) + "f")); r.push(await COPIONE.prova((201 + k) + "h")); }
    }
    return r;
  };
})();

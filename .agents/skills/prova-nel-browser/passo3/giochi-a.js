// PROVE DEL PASSO 3, GRUPPO A (giochi a due): Tris, Drop 4, Battaglia Navale, Scopa, Calcio Biliardo col cambio di host.
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("passo3/comune.js"); await COPIONE.carica("passo3/giochi-a.js"); await COPIONE.prova(371)
//   (oppure await COPIONE.gruppoA3(): 371-375 e 376-376e in fila)
// 371-375, uno per gioco: Compagnia con 3 telefoni (Paky, Giulia, Luca, Sala nuova). Paky lancia il gioco dalla Sala e gioca
//   (contro Giulia, il primo vice, o contro Luca, con Giulia che guarda); a metà partita Paky si spegne davvero. Dopo il
//   subentro Giulia tiene la Sala e Luca è con lei, nessun pezzo del gioco vecchio torna sopra la Sala (5 s), nessun errore.
//   Poi Giulia rilancia lo stesso gioco con Luca fino alla fine: «👍 Ci sto!» di Luca, «↻ Rivincita» col 3-2-1 e si gioca di
//   nuovo con lo stesso avversario; la partita conta nella Classifica della serata.
// 376 (Tris), 376b (Drop 4), 376c (Battaglia), 376d (Scopa), 376e (Calcio): duello Luca-Marco nella Compagnia con Paky (host)
//   e Giulia che guardano; Paky sparisce: Giulia tiene la Sala col duello dentro, il duello continua fino alla fine e l'esito
//   arriva alla Sala di Giulia (punti a Luca e Marco, contati una volta sola). (Il duello con il vice che gioca è la 336.)
// Regole corte solo per la prova: Scopa "una mano sola", Calcio "a 1 gol" (opz.corte dei telefoni, come passo2/gruppo-a.js).
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, P3 = COPIONE.passo3 || W.P3, T = A.T;
  var aggiungi = COPIONE.aggiungi.bind(COPIONE);
  function no(p) { throw new Error(p); }
  function vm(c) { return A.vm(c); }
  var GRUPPO = ["tris", "drop4", "navale", "scopa", "calciobiliardo"];
  var NOMI = { tris: "Tris", drop4: "Drop 4", navale: "Battaglia Navale", scopa: "Scopa", calciobiliardo: "Calcio Biliardo" };
  var IMP = { scopa: { traguardo: 0 }, calciobiliardo: { gol: 1 } };
  // i pezzi del tavolo di ogni gioco (se uno di questi c'è, il gioco è sullo schermo)
  var PEZZI = { tris: ".tr-cella", drop4: ".d4-tav", navale: ".nav-board", scopa: ".sc-mensola, .sc-terra, .sc-mano-riga", calciobiliardo: ".cb-scena" };

  // ---- regole corte: sui telefoni aperti con opz.corte, il gioco che parte legge IMP (solo per le prove) ----
  if (!W.__prepGruppoA3 && W.preparaFinestra) {
    W.__prepGruppoA3 = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepGruppoA3(w, nome, opz);
      if (!opz || !opz.corte) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && IMP[g.id]) {
            var avvia = g.avvia;
            g.avvia = function (t) { if (t.impostazioni) Object.keys(IMP[g.id]).forEach(function (k) { t.impostazioni[k] = IMP[g.id][k]; }); return avvia.apply(this, arguments); };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }

  // ---- aiuti ----
  var CMP = "QZWXNM", NOMEC = "Quelli del venerdì";
  function nomeHost(m) { var h = ((m && m.membri) || []).filter(function (x) { return x && x.id === "host"; })[0]; return h ? h.nome : ""; }
  function hostDi(S) { return nomeHost(vm(S)); }
  function nomi(S) { return (vm(S).membri || []).map(function (m) { return m.nome; }); }
  function eHost(w) { return !!(w && w.document.querySelector(".saletta-schermo .sl-go")); }
  function eOspite(w) { return !!(w && w.document.querySelector(".saletta-schermo .sl-attesa") && /Sei dentro/.test(W.testo(w))); }
  function salaDi(w, S) { return eOspite(w) && A.codiceTestata(w) === S; }
  function idDi(S, nome) { return A.idInSala(S, nome); }
  function spentoDavvero(nome) { W.congela(nome); W.spegni(nome); }
  function erroriVuoti() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  function premi(w, nodo, x, y, tipo, id) {
    var Ev = w.PointerEvent || w.MouseEvent;
    nodo.dispatchEvent(new Ev(tipo, { clientX: x, clientY: y, pointerId: id || 7, pointerType: "touch", bubbles: true, cancelable: true, isPrimary: true }));
  }
  function avvDi(gid, v) {   // l'id di chi gioca contro l'host della stanza, dalla foto
    if (!v) return null;
    if (gid === "navale") return (v.ids || {}).avv || null;
    if (gid === "scopa") return v.avvId || v.idB || null;
    if (gid === "calciobiliardo") return ((v.players || [])[1] || {}).id || null;
    return v.avvId || null;
  }
  function finita(gid, v) { return !!v && v.fase === "fine"; }
  function inGioco(gid, v) {
    if (!v) return false;
    if (gid === "scopa") return v.t !== "lobby" && !!v.mano;
    if (gid === "navale") return v.fase === "piazza" || v.fase === "battaglia";
    return v.fase === "gioco";
  }
  function fineCore(w) { return w && w.document.querySelector(".fine-tasti"); }
  // un pezzo del gioco sullo schermo del telefono (fuori dalla Sala)
  function tavoloVisto(w, gid) { return !!(w && w.document.querySelector(PEZZI[gid])); }

  // la musica della Scopa (SGMusica): w.__musica = true mentre suona (i suoni sono spenti sul computer di prova: si segna e basta)
  function spiaMusica(w) {
    var M = w.SGMusica; if (!M || M.__spia) return;
    var av = M.avvia, fe = M.ferma;
    M.avvia = function () { w.__musica = true; return av.apply(this, arguments); };
    M.ferma = function () { w.__musica = false; return fe.apply(this, arguments); };
    M.__spia = true;
  }
  // la Compagnia con chi serve: il primo apre (host), gli altri entrano dal link fisso
  async function compagnia(chi) {
    var w = {};
    for (var i = 0; i < chi.length; i++) {
      w[chi[i]] = await P3.apriCompagnia(chi[i], CMP, NOMEC, { x: 185 * i, emoji: "🎲", corte: true, prima: spiaMusica });
      var n = chi[i], k = i + 1;
      var ok = await W.aspetta(function () { return nomi(CMP).length === k && nomi(CMP).indexOf(n) >= 0 && (k === 1 ? eHost(w[n]) : eOspite(w[n])); }, 8000);
      if (!ok) no(n + " non entra nella Compagnia (membri: " + nomi(CMP).join(", ") + "; «" + T(w[n]).slice(0, 80) + "»)");
    }
    if (hostDi(CMP) !== chi[0]) no("la Sala la tiene " + hostDi(CMP) + " invece di " + chi[0]);
    return w;
  }
  // l'host della Sala lancia un gioco a due scegliendo chi gioca ("⚔️ Una sfida" → «Chi gioca?»)
  async function lanciaCon(host, S, gid, due) {
    var w = W.finestra(host);
    var r = await A.toccaGiocoSala(w, NOMI[gid]);
    if (r.dove === "chi") {
      var sc = A.chiGioca(w) || [];
      sc.forEach(function (n) { if (due.indexOf(n) < 0) A.toccaChi(w, n); });
      await W.dorme(150);
      due.forEach(function (n) { if ((A.chiGioca(w) || []).indexOf(n) < 0) A.toccaChi(w, n); });
      await W.dorme(150);
      var ora = (A.chiGioca(w) || []).slice().sort().join(",");
      if (ora !== due.slice().sort().join(",")) no("in «Chi gioca?» sono scelti " + ora + " invece di " + due.join(","));
      if (!W.clicca(w, /Si gioca/, ".piede button")) no("in «Chi gioca?» non c'è «▶ Si gioca»");
    } else if (r.dove !== "saletta") no("toccato " + NOMI[gid] + " non si arriva né a «Chi gioca?» né alla saletta");
    var C = await W.aspetta(function () { var v = vm(S); return v.gioco === gid && v.stanza; }, 6000);
    if (!C) no("il gioco " + gid + " non parte nella Sala");
    return C;
  }

  // ---- le mosse a copione (da passo2/gruppo-a.js, coi nomi di chi tiene la stanza e dell'avversario) ----
  // fai(C, H, B, quante): H tiene la stanza del gioco, B è l'avversario; si fermano dopo "quante" mosse (o alla fine)
  var MOSSE = {
    tris: async function (C, H, B, quante) {
      var fatte = 0, fino = Date.now() + 30000;
      while (Date.now() < fino && !finita("tris", vm(C)) && fatte < quante) {
        var v = vm(C), w = W.finestra(v.turno === "X" ? H : B);
        if (v.fase === "gioco") {
          var celle = w.document.querySelectorAll(".tr-cella"), k = (v.board || []).indexOf(null), n0 = (v.board || []).filter(Boolean).length;
          if (k >= 0 && celle[k] && !celle[k].disabled) { celle[k].click(); fatte++; await W.aspetta(function () { return (vm(C).board || []).filter(Boolean).length > n0 || finita("tris", vm(C)); }, 3000); continue; }
        }
        await W.dorme(120);
      }
    },
    drop4: async function (C, H, B, quante) {
      var fatte = 0, fino = Date.now() + 40000;
      while (Date.now() < fino && !finita("drop4", vm(C)) && fatte < quante) {
        var v = vm(C);
        if (v.fase === "gioco") {
          var w = W.finestra(v.turno === "G" ? H : B), tav = w.document.querySelector(".d4-tav"), area = w.document.querySelector(".d4-area");
          var pref = v.turno === "G" ? [0, 2, 4, 6, 1, 3, 5] : [1, 3, 5, 2, 4, 6, 0];
          var col = pref.filter(function (c) { return v.board[c] == null; })[0];
          if (tav && area && col != null) {
            var r = tav.getBoundingClientRect(), x = r.left + (col + 0.5) * r.width / 7, y = r.top + r.height / 2, n0 = (v.board || []).filter(Boolean).length;
            premi(w, area, x, y, "pointerdown"); premi(w, area, x, y, "pointerup"); fatte++;
            await W.aspetta(function () { return (vm(C).board || []).filter(Boolean).length > n0 || finita("drop4", vm(C)); }, 3000);
            await W.dorme(450);
            continue;
          }
        }
        await W.dorme(150);
      }
    },
    navale: async function (C, H, B, quante) {
      // B: navi in fila sulle righe pari (si sa dove sono: H spara lì); H: "A caso" e "Pronto"
      var naviB = [{ x: 0, y: 0, o: 1 }, { x: 0, y: 2, o: 1 }, { x: 0, y: 4, o: 1 }, { x: 0, y: 6, o: 1 }, { x: 0, y: 8, o: 1 }], lens = [5, 4, 3, 3, 2], bersagli = [];
      naviB.forEach(function (n, k) { for (var i = 0; i < lens[k]; i++) bersagli.push({ x: n.x + i, y: n.y }); });
      var P = W.finestra(H), fatte = 0;
      if (vm(C).fase === "piazza") {
        W.reteDi(B).invia({ t: "pronto", navi: naviB });
        if (!await W.aspetta(function () { return W.clicca(P, /A caso/); }, 4000)) no(H + " non trova «A caso»");
        await W.dorme(150);
        if (!W.clicca(P, /Pronto, si combatte/)) no(H + " non trova «Pronto»");
        if (!await W.aspetta(function () { return vm(C).fase === "battaglia"; }, 6000)) no("la battaglia non comincia");
      }
      var mare = []; for (var y = 9; y >= 0; y--) for (var x = 9; x >= 0; x--) mare.push({ x: x, y: y });
      var fino = Date.now() + 60000;
      while (Date.now() < fino && !finita("navale", vm(C)) && fatte < quante) {
        var v = vm(C);
        if (v.fase === "battaglia") {
          var n0 = v.n;
          if (v.tocca === 0) {
            var b = bersagli.filter(function (c) { return v.campi[1].charAt(c.y * 10 + c.x) === "0"; })[0];
            var cel = b && [].filter.call(P.document.querySelectorAll(".nav-board:not(.nav-mini) .nav-c"), function (d) { return d._i === b.y * 10 + b.x; })[0];
            if (cel) cel.click();
          } else {
            var m = mare.filter(function (c) { return v.campi[0].charAt(c.y * 10 + c.x) === "0"; })[0];
            if (m) W.reteDi(B).invia({ t: "colpo", x: m.x, y: m.y, n: v.n });
          }
          fatte++;
          await W.aspetta(function () { return vm(C).n !== n0 || finita("navale", vm(C)); }, 3000);
          continue;
        }
        await W.dorme(150);
      }
    },
    scopa: async function (C, H, B, quante) {
      // una mano sola: B manda la sua carta (la presa la sceglie il gioco), H tocca le sue carte
      var P = W.finestra(H), fatte = 0, fino = Date.now() + 120000;
      while (Date.now() < fino && fatte < quante) {
        var v = vm(C);
        if (v.fase === "fine") return;
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
              if (mano[0].classList.contains("sel")) { tav.forEach(function (c) { c.click(); }); }
              fatte++;
              await W.aspetta(function () { var x = vm(C); return x.turno === x.io || x.fase !== "gioco" || (x.tavolo || []).length !== nTav; }, 3000);
              continue;
            }
          }
          if (v.fase === "fineround") { W.clicca(P, /Continua/); }
        }
        await W.dorme(200);
      }
      if (quante === Infinity) no("la Scopa non finisce in 2 minuti");
    },
    calciobiliardo: async function (C, H, B, quante) {
      // a 1 gol: tirano tutti e due col Bot del gioco; H col dito finto (dal campo allo schermo), B manda il tiro
      var fatte = 0, fino = Date.now() + 150000, ultimo = -1;
      while (Date.now() < fino && !finita("calciobiliardo", vm(C)) && fatte < quante) {
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
          fatte++;
          await W.aspetta(function () { var x = vm(C); return x.n !== ultimo || x.fase === "fine"; }, 35000);
          continue;
        }
        await W.dorme(200);
      }
    }
  };
  // a metà partita: quante mosse fare prima di spegnere l'host
  var META = { tris: 2, drop4: 3, navale: 4, scopa: 2, calciobiliardo: 1 };

  // ---- 371-375: l'host della Sala gioca e sparisce a metà; Giulia tiene la Sala e rilancia lo stesso gioco ----
  function scenarioCambio(gid, avv) {
    return { nome: NOMI[gid] + " nella Compagnia: Paky (host) gioca con " + avv + " e sparisce a metà → tutti nella Sala di Giulia, niente gioco sopra la Sala; Giulia rilancia " + NOMI[gid] + " con Luca fino alla Rivincita col 3-2-1", fai: async function () {
      var X = await compagnia(["Paky", "Giulia", "Luca"]), S = CMP, P = X.Paky, G = X.Giulia, L = X.Luca, note = [];
      var idG = idDi(S, "Giulia"), idL = idDi(S, "Luca");
      if (!await W.aspetta(function () { return (vm(S).vice || [])[0] === idG; }, 4000)) no("il primo vice non è Giulia: " + JSON.stringify(vm(S).vice));
      // 1ª partita: Paky contro avv (l'altro guarda)
      var C = await lanciaCon("Paky", S, gid, ["Paky", avv]);
      var idA = idDi(S, avv);
      if (!await W.aspetta(function () { return avvDi(gid, vm(C)) === idA; }, 9000)) no(avv + " non diventa l'avversario di Paky (" + avvDi(gid, vm(C)) + ")");
      if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non ha «Comincia»");
      if (!await W.aspetta(function () { return inGioco(gid, vm(C)); }, 8000)) no("la partita di Paky non comincia");
      await MOSSE[gid](C, "Paky", avv, META[gid]);
      if (finita(gid, vm(C))) no("la partita è finita prima di spegnere Paky");
      var gio = [G, L].filter(function (w) { return tavoloVisto(w, gid); }).length;
      if (!gio) no("né Giulia né Luca vedono il tavolo di " + NOMI[gid]);
      note.push("1ª partita Paky-" + avv + " a metà (" + META[gid] + " mosse)");
      // Paky si spegne davvero
      var t0 = Date.now();
      spentoDavvero("Paky");
      if (!await W.aspetta(function () { return hostDi(S) === "Giulia" && vm(S).gen === 2 && eHost(G) && salaDi(L, S); }, 30000, 250))
        no("la Sala non passa a Giulia (host " + hostDi(S) + ", gen " + vm(S).gen + ", Giulia «" + T(G).slice(0, 60) + "», Luca «" + T(L).slice(0, 60) + "»)");
      var dt = ((Date.now() - t0) / 1000).toFixed(1);
      if (vm(S).gioco || vm(S).stanza) no("la Sala di Giulia ha ancora il gioco " + vm(S).gioco);
      if (nomi(S).slice().sort().join(",") !== "Giulia,Luca") no("membri della Sala di Giulia: " + nomi(S).join(", "));
      if (idDi(S, "Luca") !== idL) no("Luca ha cambiato id nella Sala");
      // 5 s: nessun pezzo del gioco vecchio torna sopra la Sala, nessuna finestra del gioco
      var visto = "", fermo = Date.now() + 5000;
      while (Date.now() < fermo) {
        [["Giulia", G], ["Luca", L]].forEach(function (x) {
          var w = x[1];
          if (!visto && tavoloVisto(w, gid)) visto = x[0] + " vede il tavolo di " + NOMI[gid];
          if (!visto && !w.document.querySelector(".saletta-schermo")) visto = x[0] + " non è più nella Sala («" + T(w).slice(0, 60) + "»)";
          if (!visto && /partita è stata chiusa|Collegamento perso|Problema di collegamento/.test(W.testo(w))) visto = x[0] + " legge «" + (W.testo(w).match(/partita è stata chiusa|Collegamento perso|Problema di collegamento/) || [""])[0] + "»";
        });
        if (visto) no("dopo il subentro: " + visto);
        await W.dorme(100);
      }
      if (!eHost(G) || !salaDi(L, S)) no("dopo 5 s qualcosa ha coperto la Sala");
      var suona = [["Giulia", G], ["Luca", L]].filter(function (x) { return x[1].__musica; }).map(function (x) { return x[0]; });
      if (suona.length) no("nella Sala suona ancora la musica del gioco vecchio per " + suona.join(" e "));
      erroriVuoti();
      note.push("Paky spento: Giulia tiene la Sala dopo " + dt + " s, Luca con lei, niente gioco sopra la Sala per 5 s");
      // Giulia rilancia lo stesso gioco con Luca
      var C2 = await lanciaCon("Giulia", S, gid, ["Giulia", "Luca"]);
      if (C2 === C) no("il gioco nuovo ha la stanza vecchia");
      if (!await W.aspetta(function () { return avvDi(gid, vm(C2)) === idL; }, 9000)) no("Luca non entra nel " + NOMI[gid] + " di Giulia (" + avvDi(gid, vm(C2)) + ")");
      if (!await W.aspetta(function () { return W.clicca(G, /Comincia/, ".sl-go"); }, 5000)) no("Giulia non ha «Comincia»");
      if (!await W.aspetta(function () { return inGioco(gid, vm(C2)); }, 8000)) no("la partita di Giulia non comincia");
      await MOSSE[gid](C2, "Giulia", "Luca", Infinity);
      if (!finita(gid, vm(C2))) no("la partita di Giulia non finisce");
      if (!await W.aspetta(function () { return fineCore(G) && fineCore(L) && /Ci sto/.test(fineCore(L).textContent); }, 8000)) no("a fine partita mancano i tasti del core (Giulia " + !!fineCore(G) + ", Luca " + !!fineCore(L) + ")");
      if (!/Rivincita/.test(fineCore(G).textContent)) no("Giulia non ha «↻ Rivincita» («" + fineCore(G).textContent + "»)");
      var T1 = await W.aspetta(function () { var t = vm(S).torneo; return t && t.n === 1 && t; }, 6000);
      if (!T1) no("la partita non conta nella Classifica della serata (" + JSON.stringify(vm(S).torneo || null).slice(0, 120) + ")");
      note.push("partita di Giulia finita e contata");
      W.clicca(L, /Ci sto/, ".fine-tasti button");
      if (!await W.aspetta(function () { return /Rivincita · 👍 1/.test(T(G)); }, 4000)) no("sul tasto di Giulia non compare «👍 1»");
      var via = A.spiaVia(L);
      W.clicca(G, /Rivincita/, ".fine-tasti button");
      var t1 = Date.now();
      if (!await W.aspetta(function () { return inGioco(gid, vm(C2)) && !finita(gid, vm(C2)); }, 10000)) { via.stop(); no("dopo «↻ Rivincita» la partita non riparte da sola"); }
      var dt2 = ((Date.now() - t1) / 1000).toFixed(1), tre = via.stop();
      if (!tre) no("Luca non ha visto il 3-2-1");
      if (avvDi(gid, vm(C2)) !== idL) no("nella rivincita l'avversario non è Luca");
      if (!await W.aspetta(function () { return tavoloVisto(G, gid) && tavoloVisto(L, gid); }, 4000)) no("nella rivincita Giulia o Luca non vedono il tavolo");
      if (gid === "scopa") {   // la musica riparte con la partita e non si ferma da sola mentre si gioca
        await W.dorme(1500);
        if (!G.__musica || !L.__musica) no("nella rivincita la musica della Scopa non suona (Giulia " + !!G.__musica + ", Luca " + !!L.__musica + ")");
        note.push("musica: ferma nella Sala, riparte nella rivincita");
      }
      await P3.unSoloHost(S, 2000);
      erroriVuoti();
      note.push("Ci sto → 👍 1; Rivincita col 3-2-1 → si gioca in " + dt2 + " s, sempre Luca");
      return note.join("; ");
    } };
  }

  // ---- 376-376e: duello Luca-Marco, Paky (host) e Giulia guardano; Paky sparisce ----
  function scenarioDuello(gid) {
    return { nome: "Duello di " + NOMI[gid] + " Luca-Marco con Paky (host) e Giulia che guardano: Paky sparisce, il duello continua e l'esito arriva alla Sala di Giulia", fai: async function () {
      var X = await compagnia(["Paky", "Giulia", "Luca", "Marco"]), S = CMP, G = X.Giulia, note = [];
      var idL = idDi(S, "Luca"), idM = idDi(S, "Marco");
      var C = await lanciaCon("Paky", S, gid, ["Luca", "Marco"]);
      var D = await W.aspetta(function () { return vm(S).duello; }, 4000);
      if (!D || [D.a, D.b].sort().join(",") !== [idL, idM].sort().join(",")) no("il duello non è Luca-Marco: " + JSON.stringify(D));
      var H = D.a === idL ? "Luca" : "Marco", B = H === "Luca" ? "Marco" : "Luca";
      if (D.stanza !== C) no("la stanza del duello non è quella della Sala");
      if (!await W.aspetta(function () { return avvDi(gid, vm(C)) === idDi(S, B); }, 9000)) no(B + " non entra nel duello di " + H);
      if (!await W.aspetta(function () { return W.clicca(W.finestra(H), /Comincia/, ".sl-go"); }, 6000)) no(H + " non ha «Comincia»");
      if (!await W.aspetta(function () { return inGioco(gid, vm(C)); }, 8000)) no("il duello non comincia");
      await MOSSE[gid](C, H, B, META[gid]);
      if (finita(gid, vm(C))) no("il duello è finito prima di spegnere Paky");
      note.push("duello " + H + "-" + B + " a metà");
      var t0 = Date.now();
      spentoDavvero("Paky");
      if (!await W.aspetta(function () { return hostDi(S) === "Giulia" && vm(S).gen === 2; }, 30000, 250)) no("la Sala non passa a Giulia (host " + hostDi(S) + ")");
      var dt = ((Date.now() - t0) / 1000).toFixed(1), v = vm(S);
      if (v.gioco !== gid || v.stanza !== C || !v.duello) no("la Sala di Giulia ha perso il duello: " + JSON.stringify({ g: v.gioco, s: v.stanza, d: v.duello }));
      if ([v.duello.a, v.duello.b].sort().join(",") !== [idL, idM].sort().join(",")) no("il duello nella Sala di Giulia è " + v.duello.a + "-" + v.duello.b);
      await W.dorme(1500);
      ["Luca", "Marco"].forEach(function (n) { if (!tavoloVisto(W.finestra(n), gid)) no(n + " non è più nel duello («" + T(W.finestra(n)).slice(0, 60) + "»)"); });
      if (finita(gid, vm(C))) no("il duello è finito da solo");
      note.push("Giulia tiene la Sala dopo " + dt + " s col duello dentro");
      await MOSSE[gid](C, H, B, Infinity);
      if (!finita(gid, vm(C))) no("il duello non finisce");
      var T1 = await W.aspetta(function () { var t = vm(S).torneo; return t && t.n === 1 && t; }, 8000);
      if (!T1) no("l'esito del duello non arriva alla Sala di Giulia (" + JSON.stringify(vm(S).torneo || null).slice(0, 120) + ")");
      var ass = (T1.ultima && T1.ultima.assegnati || []).map(function (a) { return a.nome + " +" + a.punti; }).join(" · ");
      if (!/Luca \+/.test(ass) || !/Marco \+/.test(ass) || /Paky|Giulia/.test(ass)) no("punti del duello: «" + ass + "»");
      if (!await W.aspetta(function () { return fineCore(W.finestra(H)) && fineCore(W.finestra(B)); }, 8000)) no("Luca o Marco non hanno la fine partita");
      await W.dorme(2500);
      if (vm(S).torneo.n !== 1) no("il duello è contato " + vm(S).torneo.n + " volte");
      if (hostDi(S) !== "Giulia") no("dopo il duello la Sala la tiene " + hostDi(S));
      note.push("esito alla Sala di Giulia: " + ass);
      // Giulia (ora host) ha i tasti dell'host a fine duello: «🎮 Cambia gioco» porta tutti nella sua Sala
      if (!await W.aspetta(function () { return W.clicca(G, /Cambia gioco/, ".fine-tasti button"); }, 5000)) no("a fine duello Giulia non ha «🎮 Cambia gioco» («" + T(G).slice(0, 80) + "»)");
      // (Giulia è nella scelta dei giochi della sua Sala: «🎮 Quale gioco?»)
      if (!await W.aspetta(function () { return !vm(S).gioco && !vm(S).duello && (eHost(G) || /Quale gioco/.test(T(G))) && salaDi(W.finestra("Luca"), S) && salaDi(W.finestra("Marco"), S); }, 8000))
        no("«Cambia gioco» non porta tutti nella Sala di Giulia (gioco " + vm(S).gioco + ", Giulia «" + T(G).slice(0, 50) + "», Luca «" + T(W.finestra("Luca")).slice(0, 50) + "»)");
      await P3.unSoloHost(S, 2000);
      erroriVuoti();
      note.push("«Cambia gioco» di Giulia → tutti nella sua Sala");
      return note.join("; ");
    } };
  }

  // Tris e Scopa: Paky gioca contro Luca (Giulia, il vice, guarda); Drop 4, Battaglia e Calcio: contro Giulia (il vice gioca)
  var AVV = { tris: "Luca", drop4: "Giulia", navale: "Giulia", scopa: "Luca", calciobiliardo: "Giulia" };
  GRUPPO.forEach(function (gid, k) {
    aggiungi(371 + k, scenarioCambio(gid, AVV[gid]));
    aggiungi(k ? "376" + "abcde".charAt(k) : 376, scenarioDuello(gid));
  });
  COPIONE.gruppoA3 = async function () {
    var r = [];
    for (var k = 0; k < GRUPPO.length; k++) r.push(await COPIONE.prova(371 + k));
    for (k = 0; k < GRUPPO.length; k++) r.push(await COPIONE.prova(k ? "376" + "abcde".charAt(k) : 376));
    return r;
  };
})();

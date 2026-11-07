// PROVE DELLA RUOTA DELLA FORTUNA, giro 3 parte 2 (7 nov 2026): la ruota sul pavimento davanti ai concorrenti, vista
// dall'alto quando si gira, girata col dito (la forza conta), lancetta, lampadine, mano di chi gira, niente maxischermo.
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("preferiti/ruota3.js"); await COPIONE.prova("rv8")
//
// rv8:  il motore, senza rete: 1.200 girate con forze a caso. Lo spicchio è SEMPRE quello sotto la lancetta (dall'angolo),
//       più forza = più giri (piano in media meno di 1.000 gradi, forte più di 1.900), la durata sta tra 4,3 e 7 secondi,
//       circa un terzo delle volte si ferma a un soffio dal confine, all'indietro l'angolo scende, ogni spicchio esce;
//       il caso «fermo» delle prove porta ancora sullo spicchio voluto.
// rv9:  online in 3 (Paky host, Luca, Giulia): niente maxischermo; quando tocca a uno la ruota è «alta» (vista dall'alto)
//       su tutti e tre i telefoni e si può trascinare SOLO su quello di chi gioca; chi gioca la trascina col dito e la
//       lancia: parte il giro con la sua direzione, sugli altri telefoni la mano spinge un piolo, le lampadine corrono,
//       la lancetta batte; alla fine tutti e tre i dischi sono fermi sullo stesso angolo e lo spicchio sotto la lancetta è
//       quello della foto; dopo il giro la ruota torna sul pavimento (prospettiva) e la telecamera va sul leggio.
//       Poi Luca la lancia all'indietro (verso opposto). 360x640 e 412x915: la pagina non scorre.
// rv10: sullo stesso telefono in 2: si trascina chi ha il turno; contro i Bot: il Bot lancia (senza dito) e la mano si vede.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  async function finche(C, fino, passo, ms, perche) {
    var t = Date.now() + (ms || 60000);
    while (Date.now() < t) {
      var v = vm(C);
      if (fino(v)) return v;
      try { if (passo) await passo(v); } catch (e) { if (/^NO:/.test(e.message)) throw e; }
      await W.dorme(150);
    }
    no((perche || "non si arriva al punto della prova") + " (fase " + vm(C).fase + ")");
  }
  function sotto(ang) { return Math.floor(((((-ang) % 360) + 360) % 360) / 15) % 24; }
  function angDi(w) { var c = w.document.querySelector(".ru-disco"); var m = c && /rotate\((-?[\d.]+)deg\)/.exec(c.style.transform); return m ? +m[1] : null; }
  // il dito: trascina la ruota da un punto del bordo per «gradi» gradi in «ms» millisecondi e la lascia andare
  async function trascina(w, gradi, ms) {
    var R = w.document.querySelector(".ru-ruota"), pi = w.document.querySelector(".ru-piatto");
    if (!R || !pi) return "niente ruota";
    var r = pi.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, rr = r.width * 0.36, a0 = -90, Ev = w.PointerEvent || w.MouseEvent, n = 8;
    function ev(t, a) { var x = cx + rr * Math.cos(a * Math.PI / 180), y = cy + rr * Math.sin(a * Math.PI / 180); R.dispatchEvent(new Ev(t, { bubbles: true, cancelable: true, pointerId: 9, pointerType: "touch", isPrimary: true, clientX: x, clientY: y })); }
    ev("pointerdown", a0);
    for (var k = 1; k <= n; k++) { await W.dorme(ms / n); ev("pointermove", a0 + gradi * k / n); }
    ev("pointerup", a0 + gradi);
    return "";
  }
  function misuraOk(w, f, lw, lh) {
    var css = f.style.cssText; f.style.cssText = "position:absolute;left:0;top:0;width:" + lw + "px;height:" + lh + "px;border:0;transform:none;z-index:9999";
    w.dispatchEvent(new w.Event("resize"));
    return W.dorme(700).then(function () {
      var se = w.document.scrollingElement || w.document.documentElement, pb = "";
      if (se.scrollHeight > w.innerHeight + 1) pb = lw + "x" + lh + ": la pagina scorre";
      var q = w.document.querySelector(".ru-qwerty"); if (q && q.getClientRects().length && q.getBoundingClientRect().bottom > w.innerHeight + 1) pb = lw + "x" + lh + ": la tastiera esce";
      f.style.cssText = css; w.dispatchEvent(new w.Event("resize"));
      return pb;
    });
  }

  COPIONE.aggiungi("rv8", { nome: "Ruota giro 3: il motore della girata col dito (spicchio sotto la lancetta, la forza conta, confine, durata)", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }); if (!w.__RUOTA && w.SGCuore && w.SGCuore.scaricaGioco) await w.SGCuore.scaricaGioco(w.SGCuore.giocoDa("ruota"));
    var R = w.__RUOTA, L = [];
    var P = R.creaPartita([{ id: "a", nome: "Paky" }, { id: "b", nome: "Luca" }], 4, { prenota: false, express: false, veloce: false, finale: false, mistero: false });
    P.nuovaManche();
    if (P.fase !== "gira") no("la manche non comincia col giro (" + P.fase + ")");
    var piano = [], forte = [], confine = 0, n = 0, visti = {}, durate = [];
    for (var k = 0; k < 1200; k++) {
      P.fase = "gira"; var f = k % 3 === 0 ? 0.1 : k % 3 === 1 ? 1 : Math.random(), d = k % 7 === 0 ? -1 : 1, prima = P.angolo;
      if (!P.gira({ f: f, d: d })) no("il giro " + k + " non parte (fase " + P.fase + ")");
      if (P.fase !== "girando") no("dopo il giro la fase è " + P.fase);
      var giro = P.angolo - prima;
      if (d === -1 && giro >= 0) no("all'indietro l'angolo sale (" + giro + ")");
      if (d === 1 && giro <= 0) no("in avanti l'angolo scende (" + giro + ")");
      if (sotto(P.angolo) !== P.spicchio) no("lo spicchio " + P.spicchio + " non è quello sotto la lancetta (" + sotto(P.angolo) + ", angolo " + P.angolo + ")");
      var fr = ((((-P.angolo) % 360) + 360) % 360) / 15 % 1; if (fr < 0.1 || fr > 0.9) confine++;
      if (P.giroMs < 4300 || P.giroMs > 7000) no("durata del giro " + P.giroMs + " ms");
      if (P.vista().giroMs !== P.giroMs || P.vista().giroDir !== d) no("nella foto mancano durata e verso del giro");
      if (f === 0.1) piano.push(Math.abs(giro)); else if (f === 1) forte.push(Math.abs(giro));
      durate.push(P.giroMs); visti[P.spicchio] = 1; n++;
    }
    function media(a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; }
    var mp = media(piano), mf = media(forte), qc = confine / n;
    if (!(mp < 1000)) no("piano gira troppo: " + Math.round(mp) + " gradi");
    if (!(mf > 1900)) no("forte gira troppo poco: " + Math.round(mf) + " gradi");
    if (qc < 0.25 || qc > 0.55) no("a un soffio dal confine " + Math.round(qc * 100) + "% delle volte");
    if (Object.keys(visti).length !== 24) no("escono solo " + Object.keys(visti).length + " spicchi su 24");
    L.push(n + " giri · piano " + Math.round(mp) + "° in media, forte " + Math.round(mf) + "° · vicino al confine " + Math.round(qc * 100) + "% · durata " + Math.min.apply(null, durate) + "-" + Math.max.apply(null, durate) + " ms · 24 spicchi");
    // il caso «fermo» delle prove: si va dritti sullo spicchio
    var rr = w.Math.random; w.Math.random = function () { return 22.5 / 24; };
    P.fase = "gira"; P.gira(); w.Math.random = rr;
    if (P.spicchio !== 22 || sotto(P.angolo) !== 22) no("col caso fermo non si arriva sullo spicchio 22 (" + P.spicchio + ")");
    L.push("caso fermo → spicchio 22");
    return L.join(" · ");
  } });

  COPIONE.aggiungi("rv9", { nome: "Ruota online in 3: la ruota sul pavimento, vista dall'alto quando si gira, girata col dito, mano, lancetta, stesso angolo per tutti", fai: async function () {
    var L = [], F = {};
    var IMP = { manche: 2, prenota: false, express: false, veloce: false, mistero: false, finale: false };
    var P = F.Paky = await W.apriTel("Paky", { x: 0, spiaRv: true, prima: function (w) { w.__impR = IMP; } });
    var C = await W.apriStanza(P, "La Ruota della Fortuna");
    F.Luca = await W.apriTel("Luca", { hash: "gioco=ruota&stanza=" + C, x: 185 });
    F.Giulia = await W.apriTel("Giulia", { hash: "gioco=ruota&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return A.contaDentro(vm(C)) === 3; }, 10000)) no("in saletta non sono in 3");
    await W.dorme(400);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    // la sigla: il tabellone scrive il nome del gioco
    var nome = await W.aspetta(function () { var t = [].map.call(P.document.querySelectorAll(".ru-cella"), function (c) { return c.textContent; }).join(""); return /LARUOTADELLAFORTUNA/.test(t) ? t : null; }, 8000);
    if (!nome) no("durante la sigla il tabellone non scrive «LA RUOTA DELLA FORTUNA»");
    L.push("sigla: il nome sul tabellone");
    var v = await finche(C, function (x) { return x.fase === "gira" && !x.sigla; }, null, 60000, "la manche non comincia");
    function idDi(n) { return (vm(C).giocatori || []).filter(function (g) { return g.nome === n; })[0].id; }
    var ID = { Paky: "host", Luca: idDi("Luca"), Giulia: idDi("Giulia") };
    function nomeDi(id) { return Object.keys(ID).filter(function (n) { return ID[n] === id; })[0]; }
    ["Paky", "Luca", "Giulia"].forEach(function (n) {
      var s = F[n].document.querySelector(".st-schermo"); if (s && s.style.display !== "none") no("su " + n + " c'è ancora il maxischermo");
    });
    async function unGiro(chi, gradi, ms, dir) {
      var altri = ["Paky", "Luca", "Giulia"].filter(function (n) { return n !== chi; });
      await W.aspetta(function () { return F[chi].document.querySelector(".ru-ruota.alta.tocca"); }, 5000);
      ["Paky", "Luca", "Giulia"].forEach(function (n) {
        var R = F[n].document.querySelector(".ru-ruota");
        if (!R || !R.classList.contains("alta")) no("quando tocca a " + chi + " su " + n + " la ruota non è vista dall'alto");
        if (R.classList.contains("tocca") !== (n === chi)) no("su " + n + " la ruota " + (n === chi ? "non " : "") + "si può trascinare");
      });
      await W.dorme(900);   // (la telecamera arriva sulla ruota)
      var g0 = vm(C).giroN, e = await trascina(F[chi], gradi, ms); if (e) no(e);
      var vv = await finche(C, function (x) { return x.giroN === g0 + 1 && x.fase === "girando"; }, null, 3000, chi + " trascina ma la ruota non parte");
      if (vv.giroDir !== dir) no("il verso del giro è " + vv.giroDir + " invece di " + dir);
      // sugli altri telefoni la mano spinge un piolo; le lampadine corrono; la lancetta batte
      await W.dorme(250);
      var mani = altri.filter(function (n) { var m = F[n].document.querySelector(".ru-mano"); return m && m.getAnimations && m.getAnimations().length; });
      if (mani.length !== 2) no("la mano di " + chi + " si vede solo su " + mani.join(", "));
      var mia = F[chi].document.querySelector(".ru-mano"); if (mia.getAnimations && mia.getAnimations().length) no("su " + chi + " (che l'ha lanciata col dito) c'è anche la mano");
      await W.dorme(900);
      var lan = 0, t1 = Date.now(), corre = 0;
      while (Date.now() - t1 < 1200) { var l = F[altri[0]].document.querySelector(".ru-lancetta").style.transform; if (/rotate\(-?[1-9]/.test(l)) lan++; if (F[altri[0]].document.querySelector(".ru-ruota.gira")) corre++; await W.dorme(40); }
      if (!lan) no("la lancetta non batte sui chiodi");
      if (!corre) no("le lampadine non corrono mentre gira");
      var dopo = await finche(C, function (x) { return x.fase !== "girando"; }, null, 9000, "la ruota non si ferma");
      await W.dorme(500);
      var angs = ["Paky", "Luca", "Giulia"].map(function (n) { return angDi(F[n]); });
      if (angs.some(function (a) { return a === null || Math.abs(a - vv.angolo) > 0.01; })) no("i dischi non sono fermi sull'angolo della foto: " + angs.join(", ") + " invece di " + vv.angolo);
      if (sotto(vv.angolo) !== vv.spicchio) no("sotto la lancetta c'è lo spicchio " + sotto(vv.angolo) + ", nella foto " + vv.spicchio);
      return { v: vv, dopo: dopo };
    }
    var chi = nomeDi(v.turno);
    // il giro sul 1.000 (spicchio 10) col caso fermo? No: qui la forza vera. Poi, se c'è da scegliere una consonante, la ruota torna sul pavimento
    var r1 = await unGiro(chi, 70, 110, 1);
    L.push(chi + " la lancia col dito: " + Math.round(r1.v.angolo - (r1.v.angolo % 1)) + "°, spicchio " + r1.v.spicchio + " (" + r1.v.giroMs + " ms), mano sugli altri due, lancetta e lampadine, stesso angolo dappertutto");
    if (r1.dopo.fase === "consonante") {
      await W.dorme(1400);
      var alta = ["Paky", "Luca", "Giulia"].filter(function (n) { return F[n].document.querySelector(".ru-ruota.alta"); });
      if (alta.length) no("mentre si sceglie la consonante la ruota è ancora vista dall'alto su " + alta.join(", "));
      L.push("poi la ruota torna sul pavimento");
      // sceglie una consonante qualunque che c'è
      var Pp = P.__RUOTA.ultima, Lc = Pp.frase.split("").filter(function (ch) { return "BCDFGHLMNPRSTVZ".indexOf(ch) >= 0 && !Pp.chiamate[ch]; })[0] || "Q";
      if (chi === "Paky") { if (P.__cbR) P.__cbR.onMsg("host", { t: "azione", a: "lettera", x: Lc }); } else W.reteDi(chi).invia({ t: "azione", a: "lettera", x: Lc });
    }
    // le misure con la ruota dall'alto e il tocco
    var pb = await misuraOk(F[chi], document.getElementById("tel-" + chi), 360, 640) || await misuraOk(F[chi], document.getElementById("tel-" + chi), 412, 915);
    if (pb) no(pb);
    L.push("360x640 e 412x915 senza scorrere");
    // all'indietro: chi ha il turno adesso la lancia verso sinistra
    var v2 = await finche(C, function (x) { return x.fase === "gira"; }, null, 20000, "non si torna a girare");
    var r2 = await unGiro(nomeDi(v2.turno), -80, 110, -1);
    L.push(nomeDi(v2.turno) + " all'indietro: verso −1, spicchio " + r2.v.spicchio);
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return L.join(" · ");
  } });

  COPIONE.aggiungi("rv10", { nome: "Ruota sullo stesso telefono e contro i Bot: il dito di chi ha il turno, il Bot lancia con la sua mano", fai: async function () {
    var L = [];
    // contro i Bot (Facile, 1 manche)
    var w = await W.apriTel("Paky", { x: 0 });
    var tess = await W.aspetta(function () { return A.tessera(w, "La Ruota della Fortuna"); }, 6000); if (!tess) no("non trovo la Ruota"); tess.click(); await W.dorme(300);
    if (!W.clicca(w, /Contro i Bot/, ".modo-grande")) no("non c'è «Contro i Bot»");
    await W.dorme(300);
    if (!W.clicca(w, /Comincia/)) no("non trovo «Comincia»");
    var Rr = w.__RUOTA;
    if (!await W.aspetta(function () { var Q = Rr.ultima; return Q && Q.fase === "gira" && Rr.H && !Rr.H.sigla; }, 60000)) no("la partita coi Bot non comincia");
    function tasto(L) { return [].find.call(w.document.querySelectorAll(".ru-qwerty .ru-btn.lettera"), function (b) { return b.textContent === L && !b.disabled; }); }
    var Q = Rr.ultima, giaBot = false, mano = false, t0 = Date.now(), lanciata = false;
    while (Date.now() - t0 < 90000 && !giaBot) {
      Q = Rr.ultima; var p = Q.giocatori[Q.turno];
      if (Q.fase === "girando" && p.bot) { giaBot = true; await W.dorme(350); var m = w.document.querySelector(".ru-mano"); mano = !!(m.getAnimations && m.getAnimations().length); break; }
      if (!p.bot && Q.fase === "gira" && w.document.querySelector(".ru-ruota.alta.tocca")) {
        await W.dorme(900); var g0 = Q.giroN, e = await trascina(w, 90, 100); if (e) no(e);
        if (!await W.aspetta(function () { return Rr.ultima.giroN === g0 + 1; }, 2500)) no("contro i Bot Paky trascina ma la ruota non parte");
        lanciata = true;
      }
      if (!p.bot && Q.fase === "consonante") {   // una consonante che non c'è: tocca a un Bot
        var Lx = "BCDFGHLMNPQRSTVZ".split("").filter(function (L) { return Q.frase.indexOf(L) < 0 && !Q.chiamate[L]; })[0];
        var bt = Lx && tasto(Lx); if (bt) { bt.click(); await W.dorme(200); bt.click(); }
      }
      await W.dorme(200);
    }
    if (lanciata) L.push("Paky la lancia col dito contro i Bot");
    if (!giaBot) no("in 90 secondi nessun Bot gira la ruota");
    if (!mano) no("il Bot gira ma la sua mano non si vede");
    L.push("il Bot lancia la ruota con la sua mano");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return L.join(" · ");
  } });
})();

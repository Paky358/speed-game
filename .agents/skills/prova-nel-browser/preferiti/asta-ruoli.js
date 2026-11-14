// PROVE DEI RUOLI E DEL MINIMO DI AZIONI NELLA GIORNATA DELLA MINI ASTA (14 nov 2026, il proprietario: «quando mai Orsolini gioca in
// difesa?»; «a volte qualcuno non vede quasi mai un'azione dei suoi calciatori»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta-ruoli.js"); await COPIONE.prova("rz1")
// Con Edge invisibile: prova.js --porta 8991 --carica preferiti/asta-ruoli.js --prova rz1,mz1,sp3
//
// rz1 Senza telefoni, su 400 giornate con 8 rose a caso: i ruoli Mantra ci sono (Orsolini ala, Lobotka mediano); degli interventi in difesa
//     (entrate, entrate pulite, ultimo uomo, falli in difesa) le punte ne fanno meno dell'1%, ali e trequartisti pochi, difensori e mediani
//     la maggior parte; i gialli di punte, ali e trequartisti arrivano SOLO in pressing, per proteste, simulazione o reazione e MAI in
//     difesa; il pressing finisce a volte col giallo e a volte pulito (l'annuncio non svela niente); i gialli restano quelli veri (quanti
//     ne prende ognuno: per i giocatori che ne prendono di più, di più).
// mz1 Senza telefoni: in 2, 8 e 12, giornata sola e 3 giornate (300 partite per tipo): nei dati ognuno ha almeno 3 azioni d'attacco nella
//     giornata intera e almeno 1 nelle veloci; e anche dopo i tagli (giornata troppo lunga, scelta delle veloci) nessuno scende sotto;
//     le azioni non stanno tutte alla fine (almeno il 20% nel primo tempo).
// sp3 Le scene dei falli, 300 semi: il pressing col giallo, col rosso e pulito (palla rubata), e l'entrata col giallo e pulita, sono
//     IDENTICHE fino a quando il pallone cambia strada (tutti i giocatori, l'arbitro e la telecamera): l'esito si vede solo dopo il contatto.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  async function motore() {   // il file del gioco con le funzioni di dentro portate fuori (solo per la prova), dentro un telefono
    var w = await W.apriTel("Paky", { x: 0 });
    w.SGCuore.precarica("astafanta");
    if (!await W.aspetta(function () { return w.SG_FANTA_CALCIATORI && w.SG_FANTA_SQUADRE && w.SG_FANTA_STATISTICHE && w.SG_FANTA_RUOLI; }, 20000)) no("i dati del fanta (con i ruoli) non arrivano");
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {}, ag = "  function costruisciMazzoFanta(n) {";
    if (src.indexOf(ag) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    src = src.replace(ag, "FUORI.cl = classificaFanta; FUORI.rf = ruoloFine; FUORI.dif = difesaFallo; FUORI.lista = listaMomenti; FUORI.taglio = taglioGiornata; FUORI.veloce = sceltaVeloce; FUORI.azione = azioneDi; FUORI.scena = scena; FUORI.cart = cartelliniDi; FUORI.MIN = [MIN_AZIONI, MIN_VELOCE];" + ag);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, F);
    F.w = w; return F;
  }
  function rose(w, n) {   // n rose da 5 senza doppioni, un portiere per squadra
    var L = w.SG_FANTA_CALCIATORI, Q = (w.SG_FANTA_QUOTAZIONI || {}).valori || {}, pool = {};
    "PDCA".split("").forEach(function (r) { pool[r] = []; ["A", "B", "C"].forEach(function (t) { (L[r][t] || []).forEach(function (k) { var m = /^(.*) \((.*)\)$/.exec(k); pool[r].push({ nome: m[1], squadra: m[2], ruolo: r, q: Q[k] || 1 }); }); }); });
    var usati = {}, sqP = {}, out = [];
    for (var i = 0; i < n; i++) {
      var kit = [];
      ["P", "D", "C", "C", "A"].forEach(function (r) { var c, g = 0; do { c = pool[r][Math.floor(Math.random() * pool[r].length)]; g++; } while ((usati[c.nome + c.squadra] || (r === "P" && sqP[c.squadra])) && g < 500); usati[c.nome + c.squadra] = 1; if (r === "P") sqP[c.squadra] = 1; kit.push(Object.assign({ prezzo: 1 }, c)); });
      out.push({ id: "g" + i, nome: "G" + i, crediti: 0, kit: kit });
    }
    return out;
  }
  function key(c) { return c.nome + " (" + c.squadra + ")"; }

  COPIONE.aggiungi("rz1", { nome: "Mini Asta, la giornata coi ruoli precisi: punte quasi mai in difesa, gialli da attaccante per punte, ali e trequartisti, pressing a volte pulito", fai: async function () {
    var F = await motore(), w = F.w, x = [];
    var orso = F.rf({ nome: "Orsolini", squadra: "Bologna", ruolo: "A" }), lobo = F.rf({ nome: "Lobotka", squadra: "Napoli", ruolo: "C" });
    if (orso !== "W") no("Orsolini non è un'ala (" + orso + ")");
    if (lobo !== "M") no("Lobotka non è un mediano (" + lobo + ")");
    var dif = {}, totDif = 0, gialli = {}, presAmm = 0, presRec = 0, ko = [], gPer = {};
    for (var i = 0; i < 400; i++) {
      var g = rose(w, 8), SA = {}, r = F.cl(g, SA, 1, null), tutti = {};
      r.forEach(function (x) { x.kit.forEach(function (c) { tutti[key(c)] = c; }); });
      SA.partite.forEach(function (P) {
        P.ev.forEach(function (e) {
          var c = tutti[e.chi]; if (!c || !/^(amm|esp|rec)$/.test(e.t)) return;
          var rf = F.rf(c), d = F.dif(P, e, rf);
          if (d) { dif[rf] = (dif[rf] || 0) + 1; totDif++; }
          var av = rf === "A" || rf === "W" || rf === "T";
          if (av && e.t !== "rec" && !/^(pressing|proteste|simula|reazione)$/.test(e.come || "")) ko.push(key(c) + " (" + rf + ") " + e.t + " " + (e.come || "entrata"));
          if (av && e.t !== "rec" && d) ko.push(key(c) + " (" + rf + ") cartellino in difesa");
          if (e.come === "pressing") { if (e.t === "rec") presRec++; else presAmm++; }
          if (e.t === "amm") { var k = key(c); gPer[k] = gPer[k] || [0, 0, F.cart(c)[0]]; gPer[k][0]++; }
        });
      });
      r.forEach(function (x) { x.kit.forEach(function (c) { var k = key(c); gPer[k] = gPer[k] || [0, 0, F.cart(c)[0]]; gPer[k][1]++; }); });
    }
    if (ko.length) no(ko.length + " cartellini di punte, ali o trequartisti in scene da difensore: " + ko.slice(0, 4).join(" · "));
    var pA = (dif.A || 0) / totDif, pW = (dif.W || 0) / totDif, pT = (dif.T || 0) / totDif, pDM = ((dif.D || 0) + (dif.M || 0)) / totDif;
    if (totDif < 500) no("troppi pochi interventi in difesa per misurare (" + totDif + ")");
    if (pA >= 0.01) no("le punte fanno l'" + (pA * 100).toFixed(1) + "% degli interventi in difesa (deve essere sotto l'1%)");
    if (pW + pT > 0.06) no("ali e trequartisti fanno troppi interventi in difesa: " + ((pW + pT) * 100).toFixed(1) + "%");
    if (pDM < 0.7) no("difensori e mediani fanno solo il " + (pDM * 100).toFixed(0) + "% degli interventi in difesa");
    var qp = presAmm / Math.max(1, presAmm + presRec);
    if (presAmm < 20 || qp < 0.3 || qp > 0.7) no("il pressing svela l'esito: " + presAmm + " gialli e rossi su " + (presAmm + presRec) + " pressing");
    // i gialli restano quelli veri: chi ne prende di più nelle statistiche vere ne prende di più anche qui (i due gruppi da almeno 200 presenze)
    var alto = [0, 0], basso = [0, 0]; Object.keys(gPer).forEach(function (k) { var v = gPer[k]; var z = v[2] >= 0.2 ? alto : v[2] <= 0.1 ? basso : null; if (z) { z[0] += v[0]; z[1] += v[1]; } });
    if (alto[1] > 200 && basso[1] > 200 && alto[0] / alto[1] <= basso[0] / basso[1] * 1.3) no("i gialli non seguono più quelli veri (" + (alto[0] / alto[1]).toFixed(3) + " contro " + (basso[0] / basso[1]).toFixed(3) + ")");
    x.push("Orsolini ala, Lobotka mediano");
    x.push("interventi in difesa su " + totDif + ": " + ["D", "M", "C", "T", "W", "A"].map(function (k) { return k + " " + ((dif[k] || 0) / totDif * 100).toFixed(1) + "%"; }).join(", "));
    x.push("pressing: " + presAmm + " cartellini e " + presRec + " puliti");
    x.push("gialli a partita: chi ne prende tanti nelle statistiche vere " + (alto[0] / Math.max(1, alto[1])).toFixed(3) + ", chi pochi " + (basso[0] / Math.max(1, basso[1])).toFixed(3));
    return x.join(" · ");
  } });

  COPIONE.aggiungi("mz1", { nome: "Mini Asta, il minimo di azioni: in 2, 8 e 12, giornata sola e 3 giornate, nessuno sotto il minimo (nei dati e dopo i tagli)", fai: async function () {
    var F = await motore(), w = F.w, x = [], MIN = F.MIN[0], MINV = F.MIN[1];   // (azioni nel primo tempo: le azioni non stanno tutte alla fine; dal 75' ce ne sono tante anche prima, per la Zona Cesarini)
    [[2, 1], [8, 1], [12, 1], [2, 3], [8, 3], [12, 3]].forEach(function (cfg) {
      var n = cfg[0], gio = cfg[1], sotto = 0, sottoV = 0, tot = 0, primoT = 0, tutte = 0, minimo = 99;
      for (var i = 0; i < 300; i++) {
        var g = rose(w, n), SA = {}, r = F.cl(g, SA, gio, null), giornate = gio === 3 ? [SA.prima[0], SA.prima[1], SA] : [SA];
        giornate.forEach(function (A, gi) {
          var veloce = gio === 3 && gi < 2, min = veloce ? MINV : MIN;
          r.forEach(function (x) {
            var mie = x.kit.map(key), c = 0;
            A.partite.forEach(function (P) { P.ev.forEach(function (e) { if (mie.some(function (k) { return F.azione(e, k); })) { c++; tutte++; if (e.m < 45) primoT++; } }); });
            tot++; if (c < min) sotto++; if (!veloce && c < minimo) minimo = c;
          });
          var lista = F.lista(A, r, function (x) { return veloce ? x.prima[gi] : x.gio; }, veloce);
          if (veloce) F.veloce(lista); else F.taglio(lista);
          var cnt = {}; lista.forEach(function (y) { if (!y.focus || y.via || y.lampo || !y.e) return; var v = {}; (y.chi || []).forEach(function (q) { if (!v[q.r.id] && F.azione(y.e, key(q.c))) { v[q.r.id] = 1; cnt[q.r.id] = (cnt[q.r.id] || 0) + 1; } }); });
          r.forEach(function (x) { if ((cnt[x.id] || 0) < min) sottoV++; });
        });
      }
      var dove = n + " giocatori, " + (gio === 3 ? "3 giornate" : "giornata sola") + ": ";
      if (sotto) no(dove + sotto + " volte qualcuno sotto il minimo nei dati");
      if (sottoV) no(dove + sottoV + " volte qualcuno sotto il minimo dopo i tagli");
      if (primoT / tutte < 0.2) no(dove + "poche azioni nel primo tempo (" + (primoT / tutte * 100).toFixed(0) + "%): stanno tutte alla fine");
      x.push(dove + "minimo " + minimo + " nelle giornate intere, " + (primoT / tutte * 100).toFixed(0) + "% delle azioni nel primo tempo");
    });
    return x.join(" · ");
  } });

  function dove(pts, t, n) {   // dove sta a quel momento (fra un punto e l'altro, in linea retta)
    if (!pts.length) return null;
    if (t <= pts[0][0]) return pts[0].slice(1, n);
    for (var i = 1; i < pts.length; i++) if (t <= pts[i][0]) { var a = pts[i - 1], b = pts[i], k = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 1; return a.slice(1, n).map(function (v, j) { return v + (b[j + 1] - v) * k; }); }
    return pts[pts.length - 1].slice(1, n);
  }
  function posa(pose, t) { var q = {}; pose.forEach(function (p) { if (p[0] <= t) q = p[1]; }); return JSON.stringify(q); }
  function diversi(a, b) { if (!a || !b) return a !== b; for (var i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 1e-6) return true; return false; }
  COPIONE.aggiungi("sp3", { nome: "Mini Asta, le scene dei falli: pressing (giallo, rosso, pulito) ed entrata (giallo, pulita) identici fino al contatto", fai: async function () {
    var F = await motore(), ko = [], prove = 0, x = [];
    [["pressing", ["amm", "esp", "rec"]], ["entrata", ["amm", "esp", "rec"]]].forEach(function (cp) {
      var come = cp[0], tipi = cp[1], tPalla0 = 1;
      for (var seme = 1; seme <= 300; seme++) {
        [false, true].forEach(function (difesa) {
          if (come === "pressing" && difesa) return;
          var et = { fallo: "Fallo" }, sc = tipi.map(function (t) { return F.scena(t, null, null, null, et, { verso: 1, lato: seme % 2 ? 1 : -1, seme: seme * 7919, come: come, difesa: difesa, lento: false }); });
          prove++;
          sc.forEach(function (s, i) {
            if (!i) return;
            var g = sc[0], qui = come + (difesa ? " in difesa" : "") + " seme " + seme + " " + tipi[0] + "/" + tipi[i];
            var cam = function (z) { return JSON.stringify([z.lento && z.lento[0], z.lento && z.lento[2], z.zoomFine, z.tz, z.dunque]); };
            if (cam(s) !== cam(g)) ko.push(qui + ": rallentatore, telecamera o tempo dell'esito diversi " + cam(g) + " / " + cam(s));
            if (s.attori.length !== g.attori.length) { ko.push(qui + ": " + g.attori.length + " in campo contro " + s.attori.length); return; }
            var tPalla = 1;
            for (var t = 0; t <= 1; t += 0.0025) if (diversi(dove(g.palla, t, 4), dove(s.palla, t, 4))) { tPalla = t; break; }
            if (tPalla < 0.49) ko.push(qui + ": il pallone cambia strada già a " + tPalla.toFixed(3) + " (prima del contatto)");
            tPalla0 = Math.min(tPalla0, tPalla);
            var fin = Math.min(tPalla, 0.5);   // (fino al contatto: dopo, giallo, rosso e intervento pulito si vedono diversi)
            for (t = 0; t < fin - 0.0025; t += 0.0025) {
              for (var k = 0; k < g.attori.length; k++) {
                var a = g.attori[k], b = s.attori[k];
                if (a.sq !== b.sq || a.chi !== b.chi || diversi(dove(a.pts, t, 3), dove(b.pts, t, 3)) || posa(a.pose, t) !== posa(b.pose, t)) { ko.push(qui + ": " + (a.sq === "arb" ? "l'arbitro" : "un giocatore") + " (n° " + k + ") diverso a " + t.toFixed(3) + ", il pallone solo da " + tPalla.toFixed(3)); t = 2; break; }
              }
            }
          });
        });
      }
      x.push(come + ": identici fino a " + tPalla0.toFixed(3));
    });
    if (ko.length) no(ko.length + " differenze prima del contatto: " + ko.slice(0, 5).join(" · "));
    return prove + " scene con 3 esiti: " + x.join(", ");
  } });
})();

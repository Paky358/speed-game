// PROVA «MAI DUE CALCIATORI UGUALI IN CAMPO» NELLA GIORNATA DELLA MINI ASTA (25 nov 2026, il proprietario: «non deve succedere che ci sono
// due giocatori uguali in campo»; nel Sassuolo 2015-16, sull'uno-due, Magnanelli col 4 c'era due volte: passava e tirava).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-doppioni.js"); await COPIONE.prova("dd1")
// Con Edge invisibile: prova.js --porta 8995 --carica preferiti/asta.js,preferiti/asta-doppioni.js --prova dd0,dd1
//
// dd1 Tutte le stagioni (oggi e le 11 passate), in 2, 4 e 8, la giornata sola e le 3 giornate: ogni momento che si vede passa per
//     momentoSerieA come nel gioco (chi tira, chi passa, chi batte la rimessa, chi subisce il rigore, i portieri veri, le scene nuove dei gruppi
//     1-3), poi chi sta negli altri posti (comparse: i titolari, la panchina, i vostri, i calciatori solo per il campo). In ogni squadra MAI lo
//     stesso calciatore due volte e MAI lo stesso numero di maglia due volte; anche nell'azione che porta al rigore.
// dd0 La stessa prova col gioco di prima (chi tira poteva essere chi passa, senza la rete di sicurezza): deve trovare i doppioni, se no la prova
//     non guarda davvero.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  async function motore(w, vecchio) {   // il file del gioco con le funzioni di dentro portate fuori (solo per la prova), dentro un telefono
    w.SGCuore.precarica("astafanta");
    if (!await W.aspetta(function () { return w.SG_FANTA_CALCIATORI && w.SG_FANTA_SQUADRE && w.SG_FANTA_STATISTICHE && w.SG_FANTA_RUOLI; }, 20000)) no("i dati del fanta non arrivano");
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {}, ag = "  function costruisciMazzoFanta(n) {";
    if (src.indexOf(ag) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    if (vecchio) {   // (dd0: come prima del 25 nov 2026; vecchio = "rete": solo senza la rete di sicurezza, per vedere se le cause vere sono tutte sistemate)
      [["if (e.ass) presi[e.ass] = 1;", ""], ["if (et && et.passa && et.passa.k) presi[et.passa.k] = 1;", ""], ["if (et && et.tira && et.tira.k) presi[et.tira.k] = 1;", ""], ["if (visti[kv]) a.doppio = true; else visti[kv] = 1;", ""]].filter(function (r, i) { return vecchio !== "rete" || i === 3; })
        .forEach(function (r) { if (src.indexOf(r[0]) < 0) no("dd0: non trovo «" + r[0] + "»"); src = src.split(r[0]).join(r[1]); });
    }
    src = src.replace(ag, "FUORI.cl = classificaFanta; FUORI.lista = listaMomenti; FUORI.momento = momentoSerieA; FUORI.campo = campoAzioni; FUORI.usa = usaStagione; FUORI.carica = caricaStagione; FUORI.pronta = stagionePronta; FUORI.ELENCO = ELENCO_STAGIONI; FUORI.chiave = chiaveCalc; " + ag);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, F);
    F.w = w; return F;
  }
  function rose(w, n) {   // n rose da 5 senza doppioni, un portiere per squadra (dalla stagione in uso)
    var L = w.SG_FANTA_CALCIATORI, Q = (w.SG_FANTA_QUOTAZIONI || {}).valori || {}, pool = {};
    "PDCA".split("").forEach(function (r) { pool[r] = []; ["A", "B", "C"].forEach(function (t) { ((L[r] || {})[t] || []).forEach(function (k) { var m = /^(.*) \((.*)\)$/.exec(k); if (m) pool[r].push({ nome: m[1], squadra: m[2], ruolo: r, q: Q[k] || 1 }); }); }); });
    var usati = {}, sqP = {}, out = [];
    for (var i = 0; i < n; i++) {
      var kit = [];
      ["P", "D", "C", "C", "A"].forEach(function (r) { var c, g = 0; do { c = pool[r][Math.floor(Math.random() * pool[r].length)]; g++; } while ((usati[c.nome + c.squadra] || (r === "P" && sqP[c.squadra])) && g < 500); usati[c.nome + c.squadra] = 1; if (r === "P") sqP[c.squadra] = 1; kit.push(c); });
      out.push({ id: "g" + i, nome: "G" + i, crediti: 0, kit: kit });
    }
    return out;
  }
  async function giro(vecchio, quante) {
    var w = await W.apriTel("Paky", { x: 0 }), F = await motore(w, vecchio), d = w.document;
    var box = d.createElement("div"); box.style.cssText = "position:fixed;left:0;top:0;width:360px;height:560px;z-index:99999"; d.body.appendChild(box);
    var el = function (tag, a) { var e = d.createElement(tag); if (a && a.class) e.className = a.class; return e; };
    var az = F.campo(el, box); az.ps = true; az.misura();
    var stag = [null].concat(F.ELENCO), conti = { momenti: 0, scene: 0, giornate: 0 }, ko = [], esempi = {};
    function controlla(sc, x, s, dove) {
      conti.scene++;
      var folla = az.comparse(sc), per = { A: { id: {}, num: {} }, D: { id: {}, num: {} } };
      function metti(team, id, num, chi) {
        var T = per[team]; if (!T) return;
        if (id) { if (T.id[id]) { var c1 = (s || "oggi") + " · " + id + " due volte (" + T.id[id] + " e " + chi + ") · " + (sc.tipo || "") + "/" + (sc.v || "") + " " + dove; ko.push(c1); } else T.id[id] = chi; }
        if (num != null && num !== "") { var nk = String(num); if (T.num[nk]) ko.push((s || "oggi") + " · il " + nk + " due volte nella stessa squadra (" + T.num[nk] + " e " + (id || chi) + ") · " + (sc.tipo || "") + "/" + (sc.v || "") + " " + dove); else T.num[nk] = id || chi; }
      }
      (sc.attori || []).forEach(function (a) {
        var team = String(a.sq || ""); if (!/^p?[AD]$/.test(team)) return; team = team.slice(-1);
        var c = a.chi || null, f = a.fig || null, id = (c && c.k) || (f && f.k) || null, num = c && c.num != null ? c.num : f && f.num != null ? f.num : null;
        metti(team, id, num, "attore " + (a.ruolo || a.id || a.sq));
      });
      folla.forEach(function (o) { var team = String(o.sq || ""); if (!/^p?[AD]$/.test(team)) return; metti(team.slice(-1), o.id || null, o.num != null ? o.num : o.numA != null ? o.numA : null, "posto " + o.n); });
    }
    for (var si = 0; si < stag.length; si++) {
      var s = stag[si];
      if (s && !F.pronta(s)) { await new Promise(function (ok) { F.carica(s, function () { ok(); }); }); }
      if (s && !F.pronta(s)) { ko.push(s + ": la stagione non si carica"); continue; }
      F.usa(s);
      [[2, 1], [4, 1], [8, 1], [4, 3]].forEach(function (cfg) {
        for (var g = 0; g < quante; g++) {
          var gl = rose(w, cfg[0]), SA = {}, righe = F.cl(gl, SA, cfg[1], null); conti.giornate++;
          var gior = cfg[1] === 3 ? [[SA.prima[0], 0], [SA.prima[1], 1], [SA, 2]] : [[SA, null]];
          gior.forEach(function (gq) {
            var Aq = gq[0], gk = gq[1], veloce = gk === 0 || gk === 1, gioDi = function (r) { return veloce ? r.prima[gk] : r.gio; };
            var lista = F.lista(Aq, righe, gioDi, veloce), facce = {}, colP = {}; righe.forEach(function (r) { facce[r.id] = null; colP[r.id] = "#e0225a"; });
            lista.forEach(function (x) {
              if (!x || !x.e || x.sp) return;
              var R = { righe: righe, fuori: {}, facce: facce, colP: colP, gk: gk, opz: {}, az: az, gioVel: 1, gufi: {}, soloScene: function (sc, scF) { controlla(sc, x, s, ""); if (scF) controlla(scF, x, s, "(l'azione del rigore)"); } };
              try { F.momento(R, x, 0, null); conti.momenti++; } catch (er) { ko.push((s || "oggi") + " · errore: " + (er && er.message) + " in " + x.e.t + "/" + (x.e.v || "")); }
            });
          });
        }
      });
      await W.dorme(0);
    }
    return { conti: conti, ko: ko };
  }
  COPIONE.aggiungi("dd1", { nome: "Mini Asta: mai due calciatori uguali in campo né lo stesso numero due volte nella stessa squadra (tutte le stagioni, tutte le scene)", fai: async function (opz) {
    var r = await giro(false, (opz && opz.quante) || 12), visti = {};
    var ko = r.ko.filter(function (k) { if (visti[k]) return false; visti[k] = 1; return true; });
    if (ko.length) no(ko.length + " doppioni: " + ko.slice(0, 6).join(" / ") + " (su " + r.conti.scene + " scene)");
    return r.conti.giornate + " giornate, " + r.conti.momenti + " momenti, " + r.conti.scene + " scene in 12 stagioni (in 2, 4, 8 e con le 3 giornate): nessun calciatore due volte, nessun numero due volte nella stessa squadra";
  } });
  COPIONE.aggiungi("dd2", { nome: "Mini Asta, i doppioni senza la rete di sicurezza: le cause vere sono sistemate (chi tira, chi passa, chi batte la rimessa)", fai: async function (opz) {
    var r = await giro("rete", (opz && opz.quante) || 12);
    if (r.ko.length) no(r.ko.length + " doppioni senza la rete di sicurezza: " + r.ko.slice(0, 5).join(" / "));
    return r.conti.scene + " scene senza la rete di sicurezza: nessun doppione (le cause vere sono sistemate)";
  } });
  COPIONE.aggiungi("dd0", { nome: "Mini Asta, la prova dei doppioni guarda davvero: col gioco di prima li trova", fai: async function (opz) {
    var r = await giro(true, (opz && opz.quante) || 12);
    if (!r.ko.length) no("col gioco di prima non trova nessun doppione (" + r.conti.scene + " scene): la prova non guarda");
    var tipi = {}; r.ko.forEach(function (k) { var m = / · ([a-z]+\/[a-z]*) /.exec(k); var t = m ? m[1] : "?"; tipi[t] = (tipi[t] || 0) + 1; });
    return "col gioco di prima " + r.ko.length + " doppioni su " + r.conti.scene + " scene (" + Object.keys(tipi).map(function (t) { return t + " " + tipi[t]; }).join(", ") + "); es. " + r.ko[0];
  } });
})();

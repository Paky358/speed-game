// PROVE DEL «🦉 GUFA! / 🍀 PORTAFORTUNA» NELLA GIORNATA DEL FANTA (30 ott 2026, deciso dal proprietario): a ogni rigore e a ogni punizione
// dal limite, per 2-3 secondi prima del tiro, chi gioca online ha un tasto rotondo (chi ha chi tira «🍀 Portafortuna», gli altri «🦉 Gufa!»),
// al massimo 5 tocchi a testa, i gufetti salgono dai quadretti, in alto il conto «🦉 ×7 🍀 ×3»; dopo l'esito «🦉 Gufata riuscita!» o
// «🍀 Il portafortuna ha vinto!»; a fine partita «🦉 Il gufo della serata».
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta-gufo.js"); await COPIONE.prova("gf1")
//
// gf1 Giornata online in 3 (Paky tiene la partita, rete a 300 ms, orologi sfasati). Nella giornata si mettono apposta (aggancio
//     SG_PROVA_SERIEA sul telefono di Paky): al 12' un rigore SBAGLIATO di un calciatore di Luca (K1), al 30' una punizione SEGNATA da
//     un calciatore di Giulia (K2), al 60' un rigore SEGNATO da un calciatore di Paky (K3). K1: Giulia gufa 3 volte, Paky 2, Luca tocca
//     il portafortuna 4 volte → su tutti e tre «🦉 ×5 🍀 ×4» e poi «🦉 Gufata riuscita! Giulia e Paky». K2: Giulia tocca 7 volte (ne
//     contano 5), Luca gufa 2, Paky 1 → «🦉 ×3 🍀 ×5», «🍀 Il portafortuna ha vinto!». Poi Luca ricarica la pagina. K3: Paky 1, Giulia 1,
//     Luca 2 → «🦉 ×3 🍀 ×1», «🍀 Il portafortuna ha vinto!». Controlla anche: il tasto giusto a ognuno (e anche sui tiri segnati), i
//     tocchi che non vibrano, i gufetti che salgono sugli altri telefoni, il tasto dentro il campo e lontano dall'annuncio, niente che
//     scorre, la finestra e la scritta nello stesso istante su tutti (al massimo 150 ms), «🦉 Il gufo della serata: Giulia» nella foto e
//     sul maxischermo del podio.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function manda(nome, m) { if (nome === "Paky") return false; W.reteDi(nome).invia(m); return true; }
  var OROLOGI = { Paky: 0, Giulia: 3200, Luca: -1800 };
  var MISURE = { Paky: [360, 640], Giulia: [360, 740], Luca: [412, 915] };   // (il telefono piccolo e quello grande)
  function misura(nome) { var f = document.getElementById("tel-" + nome), w = W.finestra(nome), m = MISURE[nome]; if (!f || !w || !m) return; f.style.width = m[0] + "px"; f.style.height = m[1] + "px"; w.dispatchEvent(new w.Event("resize")); }
  // 📸 (solo se chi fa girare la prova sa fare le foto: window.__scatta(nome, file), es. D:\SG-asta-prove\foto-gufo.js)
  function scatta(nome, file, ms) { if (W.__scatta) W.setTimeout(function () { W.__scatta(nome, file); }, ms || 0); }

  async function telefoni(imp, nomi) {
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    for (var i = 1; i < nomi.length; i++) await W.apriTel(nomi[i], { hash: "gioco=astafanta&stanza=" + C, x: 185 * i });
    nomi.forEach(function (n) { if (OROLOGI[n]) W.spostaOrologio(n, OROLOGI[n]); });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 15000)) no("non sono entrati in " + nomi.length);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    return { P: P, C: C };
  }
  async function astaVeloce(P, C) {   // se nessuno ha offerto lo prende il primo che può, poi passano gli altri
    var fino = Date.now() + 300000, visti = {};
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), a = v.asta;
      if (v.fase !== "asta" || !a || visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId]) { await W.dorme(250); continue; }
      visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1;
      var elegg = v.giocatori.filter(function (g) { return (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
      if (!a.leaderId) { var pr = v.giocatori.filter(function (g) { return elegg.indexOf(g.nome) >= 0 && g.max >= a.offerta; })[0]; if (pr) { if (pr.nome === "Paky") { var bt = bott(P, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } else manda(pr.nome, { t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta, vl: "", tk: 1 }); } }
      else elegg.forEach(function (n) { if (idDi(n) === a.leaderId) return; if (n === "Paky") { var bp = bott(P, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } else manda(n, { t: "passa", n: a.nCarta }); });
      await W.dorme(300);
    }
    if (vm(C).fase !== "fine") no("il fanta online non finisce");
  }
  // l'aggancio nella giornata (gira sul telefono di Paky, quando la giornata si decide): i tre tiri messi apposta
  function aggancio(Aq, h) {
    var messi = [];
    function rosa(nome) { return h.righe.filter(function (r) { return r.nome === nome; })[0]; }
    function metti(nome, ev, usati) {
      var r = rosa(nome); if (!r) return;
      var c = r.kit.filter(function (x) { return x.ruolo !== "P" && usati.indexOf(h.chiave(x)) < 0; }).sort(function (a, b) { return "ACD".indexOf(a.ruolo) - "ACD".indexOf(b.ruolo); })[0]; if (!c) return;
      var P = Aq.partite.filter(function (x) { return x.c === c.squadra || x.f === c.squadra; })[0]; if (!P) return;
      ev.s = P.c === c.squadra ? "c" : "f"; ev.chi = h.chiave(c);
      P.ev.push(ev); P.ev.sort(function (a, b) { return a.m - b.m; }); h.rifai(P);
      usati.push(ev.chi); messi.push(ev.prova + " " + nome + " " + c.nome + " (" + c.squadra + ")");
    }
    var usati = [];
    metti("Luca", { m: 12, t: "rigF", fin: "palo", come: "fallo", prova: "K1" }, usati);
    metti("Giulia", { m: 30, t: "gol", ass: null, v: "punizione", prova: "K2" }, usati);
    metti("Paky", { m: 60, t: "rig", come: "fallo", prova: "K3" }, usati);
    W.__gufoMessi = messi;
  }
  function chiaviMesse(C) {   // "partita|momento" dei tre tiri messi apposta, dalla foto
    var out = {}, A0 = vm(C).serieA; if (!A0 || !A0.partite) return out;
    A0.partite.forEach(function (P, pi) { P.ev.forEach(function (e, ei) { if (e.prova) out[e.prova] = pi + "|" + ei; }); });
    return out;
  }
  // chi tocca e quante volte, momento per momento
  var TOCCHI = { K1: { Giulia: 3, Paky: 2, Luca: 4 }, K2: { Giulia: 7, Luca: 2, Paky: 1 }, K3: { Paky: 1, Giulia: 1, Luca: 2 } };
  var TIPO = { K1: { Paky: "g", Giulia: "g", Luca: "f" }, K2: { Paky: "g", Giulia: "f", Luca: "g" }, K3: { Paky: "f", Giulia: "g", Luca: "g" } };
  var CONTO = { K1: ["🦉 ×5", "🍀 ×4"], K2: ["🦉 ×3", "🍀 ×5"], K3: ["🦉 ×3", "🍀 ×1"] };
  var ESITO = { K1: /Gufata riuscita!.*Giulia e Paky/, K2: /Il portafortuna ha vinto!.*tifava Giulia/, K3: /Il portafortuna ha vinto!.*tifava Paky/ };

  COPIONE.aggiungi("gf1", { nome: "Fanta online: 🦉 Gufa! / 🍀 Portafortuna a rigori e punizioni (in 3, rete 300 ms, una ricarica), conto uguale per tutti, scritta dopo l'esito, gufo della serata", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"], vecchio = W.BR.ritardo, LOG = [], sbagli = [], note = [], voli = {}, K = {}, inv = {};
    try {
      W.BR.ritardo = 300;
      var o = await telefoni({ formato: "fanta" }, NOMI), P = o.P, C = o.C;
      P.SG_PROVA_SERIEA = aggancio;
      // ogni telefono: la spia del gufo (quando si apre il tasto tocca chi deve toccare) e le vibrazioni contate
      function prepara(nome) {
        var w = W.finestra(nome); if (!w) return;
        w.__vib = 0;
        try { w.navigator.vibrate = function () { w.__vib++; return true; }; } catch (e) {}
        if (w.navigator.vibrate && !/__vib/.test(String(w.navigator.vibrate))) { try { Object.defineProperty(w.navigator, "vibrate", { configurable: true, value: function () { w.__vib++; return true; } }); } catch (e) {} }
        w.SG_PROVA_GUFO = function (cosa, d) {
          var kk = Object.keys(K).filter(function (x) { return K[x] === d.k; })[0] || null, t = performance.now();
          var e = { nome: nome, cosa: cosa, k: kk, mio: d.mio, testo: d.testo, t: t };
          var top = q(w, ".st-gufo-top"); e.top = top ? top.textContent : "";
          // (chi ricarica a metà di un momento lo rivede da dove era, in silenzio: conta solo la prima volta di ogni telefono)
          var gia = LOG.some(function (y) { return y.nome === nome && y.k === kk && y.cosa === cosa; });
          e.ripeti = gia; LOG.push(e);
          if (!kk || gia) return;
          if (cosa === "apri") {
            var b = q(w, ".st-gufo.on"), az = q(w, ".st-az-box"), msg = q(w, ".st-msg.on"), de = w.document.documentElement;
            if (d.mio !== TIPO[kk][nome]) sbagli.push(kk + " " + nome + ": tasto «" + d.mio + "» invece di «" + TIPO[kk][nome] + "»");
            if (!b) { sbagli.push(kk + " " + nome + ": il tasto non c'è"); return; }
            var et = (q(w, ".st-gufo.on .st-gufo-et") || {}).textContent || "";
            if (et !== (TIPO[kk][nome] === "f" ? "Portafortuna" : "Gufa!")) sbagli.push(kk + " " + nome + ": sul tasto «" + et + "»");
            var rb = b.getBoundingClientRect(), ra = az.getBoundingClientRect();
            // (il tasto si apre con una piccola animazione: si misura il riquadro finale, senza scala)
            var lg = b.offsetWidth, al = b.offsetHeight, x0 = b.offsetLeft, y0 = b.offsetTop;
            if (x0 < 0 || y0 < 0 || x0 + lg > az.clientWidth + 0.5 || y0 + al > az.clientHeight + 0.5) sbagli.push(kk + " " + nome + ": il tasto esce dal campo (" + [x0, y0, lg, al].join(",") + " in " + az.clientWidth + "x" + az.clientHeight + ")");
            if (msg) { var rm = msg.getBoundingClientRect(), bx = { l: ra.left + x0, t: ra.top + y0, r: ra.left + x0 + lg, b: ra.top + y0 + al };
              if (bx.l < rm.right && bx.r > rm.left && bx.t < rm.bottom && bx.b > rm.top) sbagli.push(kk + " " + nome + ": il tasto copre l'annuncio «" + msg.textContent + "»"); }
            if (de.scrollHeight > w.innerHeight + 1 || de.scrollWidth > w.innerWidth + 1) sbagli.push(kk + " " + nome + ": la pagina scorre (" + de.scrollWidth + "x" + de.scrollHeight + " su " + w.innerWidth + "x" + w.innerHeight + ")");
            if (nome === "Paky") e.annuncio = msg ? msg.textContent : "";
            if (kk !== "K3") scatta(nome, "gf1-" + kk + "-tasto-" + nome + ".png", 650);
            var n = (TOCCHI[kk] || {})[nome] || 0;
            for (var j = 0; j < n; j++) (function (j) { W.setTimeout(function () {
              var bb = q(w, ".st-gufo.on"); if (!bb) { sbagli.push(kk + " " + nome + ": al tocco " + (j + 1) + " il tasto non c'è più"); return; }
              var v0 = w.__vib; bb.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
              try { bb.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true })); } catch (x) {}
              if (w.__vib !== v0) inv[nome] = (inv[nome] || 0) + 1;
            }, 80 + j * 160); })(j);
          }
          if (cosa === "chiudi") {
            CONTO[kk].forEach(function (c) { if (e.top.indexOf(c) < 0) sbagli.push(kk + " " + nome + ": al tiro il conto è «" + e.top + "» (doveva esserci «" + c + "»)"); });
            var mio = q(w, ".st-gufo-n"), atteso = Math.min(5, (TOCCHI[kk] || {})[nome] || 0);
            if (mio && atteso && mio.textContent !== "×" + atteso) sbagli.push(kk + " " + nome + ": sul tasto «" + mio.textContent + "» invece di «×" + atteso + "»");
          }
          if (cosa === "esito" && !ESITO[kk].test(d.testo || "")) sbagli.push(kk + " " + nome + ": dopo il tiro «" + (d.testo || "niente") + "»");
          if (cosa === "esito" && kk !== "K3") scatta(nome, "gf1-" + kk + "-esito-" + nome + ".png", 450);
        };
      }
      NOMI.forEach(prepara); NOMI.forEach(misura);
      await astaVeloce(P, C);
      K = chiaviMesse(C);
      if (!K.K1 || !K.K2 || !K.K3) no("nella giornata non ci sono i tre tiri messi apposta: " + JSON.stringify(K) + " " + JSON.stringify(W.__gufoMessi));
      note.push("messi: " + (W.__gufoMessi || []).join(" · "));
      var fino = Date.now() + 420000, ricaricato = false, tornato = null;
      while (Date.now() < fino) {
        if (NOMI.every(function (n) { var w = W.finestra(n); return w && q(w, ".st-gradini"); })) break;
        NOMI.forEach(function (n) { var w = W.finestra(n); if (w && q(w, ".st-gufo-v")) voli[n] = 1; });
        if (!ricaricato && LOG.some(function (e) { return e.nome === "Luca" && e.cosa === "esito" && e.k === "K2"; })) {
          ricaricato = true; await W.dorme(1200); await W.ricarica("Luca"); tornato = performance.now();
          await W.aspetta(function () { var w = W.finestra("Luca"); return w && q(w, ".st-rivela"); }, 15000); prepara("Luca"); misura("Luca");
        }
        var av = bott(P, ".st-pag-av", /Avanti|Mostra tutta/); if (av && !av.disabled && Math.random() < 0.25) av.click();
        await W.dorme(150);
      }
      var mancano = NOMI.filter(function (n) { var w = W.finestra(n); return !(w && q(w, ".st-gradini")); });
      if (mancano.length) no("non arrivano al podio: " + mancano.join(", "));
      // ogni tiro: aperto, chiuso e la scritta su tutti e tre, nello stesso istante
      ["K1", "K2", "K3"].forEach(function (kk) {
        ["apri", "chiudi", "esito"].forEach(function (cosa) {
          var l = NOMI.map(function (n) { return LOG.filter(function (e) { return e.nome === n && e.k === kk && e.cosa === cosa; })[0]; });
          var manca = NOMI.filter(function (n, i) { return !l[i]; }); if (manca.length) { sbagli.push(kk + " «" + cosa + "» non arriva a " + manca.join(", ")); return; }
          var ts = l.map(function (e) { return e.t; }), sc = Math.max.apply(null, ts) - Math.min.apply(null, ts);
          if (sc > 150) sbagli.push(kk + " «" + cosa + "» sfasato di " + Math.round(sc) + " ms (" + l.map(function (e) { return e.nome + " " + Math.round(e.t - l[0].t); }).join(", ") + ")");
          if (cosa === "esito") note.push(kk + " «" + l[0].testo + "» (scarto " + Math.round(sc) + " ms)");
        });
      });
      var rip = LOG.filter(function (e) { return e.nome === "Luca" && e.ripeti && e.cosa === "esito" && e.k; })[0];   // (Luca ha ricaricato a metà del K2: lo rivede col conto della foto)
      if (rip) note.push("Luca dopo la ricarica rivede la fine del " + rip.k + ": «" + rip.testo + "»");
      var aP = LOG.filter(function (e) { return e.nome === "Paky" && e.cosa === "apri" && e.k; });
      aP.forEach(function (e) { var re = e.k === "K2" ? /PUNIZIONE DAL LIMITE/ : /RIGORE/; if (!re.test(e.annuncio || "")) sbagli.push(e.k + ": quando compare il tasto l'annuncio è «" + (e.annuncio || "niente") + "»"); });
      NOMI.forEach(function (n) { if (!voli[n]) sbagli.push("su " + n + " non si è visto salire nessun gufetto"); });
      Object.keys(inv).forEach(function (n) { sbagli.push(n + ": " + inv[n] + " tocchi hanno fatto vibrare"); });
      var altri = LOG.filter(function (e) { return e.nome === "Paky" && e.cosa === "apri" && !e.k; }).length;
      if (altri) note.push(altri + " altri rigori o punizioni nella giornata (tasto anche lì)");
      // il gufo della serata: nella foto e sul maxischermo del podio
      var F = vm(C), g0 = (F.titoli || [])[0];
      if (!g0 || g0.icona !== "🦉" || g0.titolo !== "Il gufo della serata" || g0.chi !== "Giulia" || g0.dett !== "1 gufata riuscita") sbagli.push("titoli nella foto: " + JSON.stringify(F.titoli));
      var L = W.finestra("Luca"), tk = await W.aspetta(function () { var t = (q(L, ".st-ticker") || {}).textContent || ""; return /Il gufo della serata: Giulia/.test(t) && t; }, 12000);
      if (!tk) sbagli.push("sul podio di Luca il titolo del gufo non gira"); else if (W.__scatta) await W.__scatta("Luca", "gf1-podio-Luca.png");
      var err = W.erroriTel(); if (err.length) sbagli.push("errori: " + err.slice(0, 3).join(" | "));
      if (sbagli.length) no(sbagli.slice(0, 8).join(" / ") + (sbagli.length > 8 ? " … (" + sbagli.length + ")" : ""));
      note.push("titolo «" + g0.icona + " " + g0.titolo + ": " + g0.chi + " (" + g0.dett + ")», ticker «" + tk + "»");
      return note.join(" · ");
    } finally { W.BR.ritardo = vecchio; }
  } });

  // gf2 Stesso telefono, fanta in 3: niente tasti né conto, solo «🤞 Dita incrociate!» al rigore (messo apposta al 3') e alla punizione (al 6')
  COPIONE.aggiungi("gf2", { nome: "Fanta sullo stesso telefono: al rigore e alla punizione solo «🤞 Dita incrociate!» (niente tasti né conto)", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"], visti = [], sbagli = [];
    var P = await W.apriTel("Paky", { x: 0 });
    P.SG_PROVA_SERIEA = function (Aq, h) {
      var usati = [];
      [["Giulia", { m: 3, t: "rigF", fin: "alto", come: "fallo", prova: "L1" }], ["Luca", { m: 6, t: "occ", esito: "parata", v: "punizione", prova: "L2" }]].forEach(function (x) {
        var r = h.righe.filter(function (y) { return y.nome === x[0]; })[0], c = r && r.kit.filter(function (y) { return y.ruolo !== "P" && usati.indexOf(h.chiave(y)) < 0; })[0]; if (!c) return;
        var Pq = Aq.partite.filter(function (y) { return y.c === c.squadra || y.f === c.squadra; })[0]; if (!Pq) return;
        x[1].s = Pq.c === c.squadra ? "c" : "f"; x[1].chi = h.chiave(c); usati.push(x[1].chi);
        Pq.ev.push(x[1]); Pq.ev.sort(function (a, b) { return a.m - b.m; }); h.rifai(Pq);
      });
    };
    P.SG_PROVA_GUFO = function (cosa, d) {
      if (cosa !== "apri") return;
      var b = q(P, ".st-gufo.on"), top = q(P, ".sa-testa.gufo");
      visti.push(b ? b.textContent : "(niente)");
      if (!b || !b.classList.contains("dita") || b.textContent !== "🤞 Dita incrociate!") sbagli.push("al tiro «" + (b ? b.textContent : "niente") + "»");
      if (top) sbagli.push("in alto c'è il conto");
      if (d.mio) sbagli.push("c'è un tasto da toccare (" + d.mio + ")");
    };
    var tess = await W.aspetta(function () { return A.tessera(P, "Mini Asta Fantacalcio"); }, 6000); if (!tess) no("non trovo la tessera");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non c'è «Su questo telefono»");
    await W.aspetta(function () { return q(P, ".sala-riga input"); }, 3000);
    while (qa(P, ".sala-riga input").length < NOMI.length) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    qa(P, ".sala-riga input").forEach(function (c, k) { c.value = NOMI[k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    if (!await W.aspetta(function () { if (q(P, ".st-stadio .sa-pers")) return true; var b = qa(P, ".schermata .piede button, .btn").filter(function (x) { return /Avanti|Comincia|Gioca|Inizia|Via|▶/.test(x.textContent) && !x.disabled && visibile(x); })[0]; if (b) b.click(); return false; }, 12000)) no("non arrivo allo stadio");
    var fino = Date.now() + 200000;
    while (Date.now() < fino && !q(P, ".st-rivela")) {
      var pz = q(P, ".sa-prezzo b, .st-prezzo b");
      if (q(P, ".st-stadio .sa-pers") && !q(P, ".sa-aggiudicato") && pz) {
        var cp = qa(P, ".sa-pers.guida")[0];
        if (!cp) { var pu = q(P, ".sa-pers.puo"); if (pu) pu.click(); }
        else { var c0 = cp.querySelector("b").textContent; qa(P, ".sa-pers").forEach(function (p) { var b = p.querySelector("b").textContent, ps = p.querySelector(".sa-passo"); if (b !== c0 && ps && ps.style.visibility !== "hidden" && !p.classList.contains("fuori")) ps.click(); }); }
      }
      await W.dorme(250);
    }
    if (!q(P, ".st-rivela")) no("il fanta non arriva alla classifica delle rose");
    W.clicca(P, /Salta/);   // (le rose: dritti alla giornata)
    if (!await W.aspetta(function () { return visti.length >= 2; }, 90000)) no("il rigore e la punizione non arrivano (" + visti.length + ")");
    var err = W.erroriTel(); if (err.length) sbagli.push("errori: " + err.slice(0, 3).join(" | "));
    if (sbagli.length) no(sbagli.join(" / "));
    return "al rigore e alla punizione: " + visti.join(" · ");
  } });
})();

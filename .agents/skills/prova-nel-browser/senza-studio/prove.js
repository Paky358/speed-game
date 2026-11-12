// PROVE DEI GIOCHI SENZA LO STUDIO TV (11 nov 2026, chat «📺 I giochi senza lo studio»).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("senza-studio/prove.js"); await COPIONE.prova("ss1")
// Con Edge invisibile: prova.js --porta 8962 --carica senza-studio/prove.js --prova ss1,ss2
//
// ss1: i 7 giochi che avevano lo studio (Ruota, Balla, Prezzo, Linea del tempo, Nomi Cose e Città, Patata, Parola d'ordine),
//      online in 3 (Paky tiene la partita, Luca e Sara dal link): lo studio è quello piatto (SGStudio.piatto), niente pezzi
//      della scena (pubblico, parete, leggii, fari), in alto i punteggi con la faccina (tranne Ruota e Parola d'ordine, che li
//      hanno nel tabellone), la partita parte entro 12 secondi dal «Comincia» (la presentazione dura poco), nessun errore,
//      e a 360x640 e 412x915 la pagina non scorre e niente esce dallo schermo.
// ss2: la Ruota senza studio, online in 3: il tabellone sempre in alto; quando si gira la ruota grande e niente tastiera
//      (con la fila delle vocali se si può comprare); quando si sceglie la consonante la tastiera coi tasti grandi e la ruota
//      piccola sopra (o nascosta), mai sotto i tasti; le vocali azzurre; 360x640 e 412x915.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  var GIOCHI = [
    { id: "ruota", nome: "La Ruota della Fortuna", punti: false },
    { id: "balla", nome: "La Balla Colossale", punti: true },
    { id: "prezzo", nome: "Il Prezzo è Giusto!", punti: true },
    { id: "timeline", nome: "La linea del tempo", punti: true },
    { id: "nomicose", nome: "Nomi, Cose e Città", punti: true },
    { id: "patata", nome: "La Patata Bollente", punti: true },
    { id: "ordine", nome: "Parola d'ordine", punti: false, amici: ["Luca", "Sara", "Giulia"] }
  ];
  // la pagina non scorre e niente di visibile esce dallo schermo (a questa misura)
  async function misura(w, f, lw, lh) {
    var css = f.style.cssText; f.style.cssText = "position:absolute;left:0;top:0;width:" + lw + "px;height:" + lh + "px;border:0;transform:none;z-index:9999";
    w.dispatchEvent(new w.Event("resize")); await W.dorme(600);
    var pb = "", se = w.document.scrollingElement || w.document.documentElement;
    if (se.scrollHeight > w.innerHeight + 1) pb = lw + "x" + lh + ": la pagina scorre";
    var v = w.document.querySelector(".st-vista");
    if (!pb && v) {
      var r = v.getBoundingClientRect(); if (r.bottom > w.innerHeight + 1 || r.right > w.innerWidth + 1) pb = lw + "x" + lh + ": lo schermo del gioco esce (" + Math.round(r.right) + "x" + Math.round(r.bottom) + ")";
      if (!w.document.querySelector(".stp-punti.riga")) [].forEach.call(w.document.querySelectorAll(".stp-chip"), function (c) { var q = c.getBoundingClientRect(); if (!pb && q.width && (q.right > w.innerWidth + 1 || q.left < -1)) pb = lw + "x" + lh + ": un punteggio esce di lato"; });
    }
    f.style.cssText = css; w.dispatchEvent(new w.Event("resize")); await W.dorme(200);
    return pb;
  }
  COPIONE.aggiungi("ss1", { nome: "I 7 giochi dello studio senza studio: partono subito, niente scena, punteggi in alto, schermi giusti", fai: async function (opz) {
    var L = [], solo = opz && opz.solo;
    for (var gi = 0; gi < GIOCHI.length; gi++) {
      var G = GIOCHI[gi]; if (solo && solo.indexOf(G.id) < 0) continue;
      A.pulisci && A.pulisci();
      var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, G.nome), amici = G.amici || ["Luca", "Sara"];
      for (var n of amici) await W.apriTel(n, { hash: "gioco=" + G.id + "&stanza=" + C, x: 185 });
      if (!await W.aspetta(function () { var v = vm(C); return (v.players || v.giocatori || []).length >= amici.length + 1; }, 15000)) no(G.nome + ": in saletta non ci sono tutti");
      await W.dorme(600);
      if (!W.clicca(P, /Comincia|Via ▶|Continua ▶/)) no(G.nome + ": non trovo «Comincia»");
      var t0 = Date.now();
      // parte: la fase del gioco (non più saletta, presentazione o sigla) e sul telefono la presentazione è finita
      var ok = await W.aspetta(function () {
        var v = vm(C), d = P.document;
        return v.fase && ["lobby", "apertura"].indexOf(v.fase) < 0 && !v.sigla && d.querySelector(".st-vista") && !d.querySelector(".stp-intro, .stp-palco.on");
      }, 20000);
      if (!ok) no(G.nome + ": dopo 20 s non si gioca ancora (fase " + vm(C).fase + ")");
      var ms = Date.now() - t0;
      if (ms > 12000) no(G.nome + ": per partire ci mette " + (ms / 1000).toFixed(1) + " s");
      var S = P.SGStudio; if (!S || !S.piatto) no(G.nome + ": lo studio non è quello piatto");
      var d = P.document;
      if (d.querySelector(".st-leggio, .st-pubwrap, .st-parete, .st-fascio, .st-tela")) no(G.nome + ": ci sono ancora pezzi della scena dello studio");
      var chip = [].filter.call(d.querySelectorAll(".stp-chip"), function (c) { return c.getClientRects().length; }).length;
      if (G.punti && chip < amici.length + 1) no(G.nome + ": in alto ci sono " + chip + " punteggi invece di " + (amici.length + 1));
      if (!G.punti && chip) no(G.nome + ": ci sono i punteggi dello studio (doppioni)");
      var f = document.getElementById("tel-Paky");
      var pb = await misura(P, f, 360, 640) || await misura(P, f, 412, 915); if (pb) no(G.nome + ": " + pb);
      var err = W.erroriTel(); if (err.length) no(G.nome + ": errori " + err.slice(0, 3).join(" / "));
      L.push(G.id + " " + (ms / 1000).toFixed(1) + " s");
      ["Paky"].concat(amici).forEach(function (n) { var fr = document.getElementById("tel-" + n); if (fr) fr.remove(); });
      await W.dorme(300);
    }
    return "partono: " + L.join(", ");
  } });

  COPIONE.aggiungi("ss2", { nome: "Ruota senza studio: tabellone in alto, la ruota grande per girare e la tastiera grande per le lettere", fai: async function () {
    var L = [], F = {};
    var P = F.Paky = await W.apriTel("Paky", { x: 0 });
    var C = await W.apriStanza(P, "La Ruota della Fortuna");
    F.Luca = await W.apriTel("Luca", { hash: "gioco=ruota&stanza=" + C, x: 185 });
    F.Giulia = await W.apriTel("Giulia", { hash: "gioco=ruota&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return A.contaDentro(vm(C)) === 3; }, 10000)) no("in saletta non sono in 3");
    await W.dorme(400);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia|Via ▶|Continua ▶/); }, 5000)) no("l'host non ha «Comincia»");
    var tutti = ["Paky", "Luca", "Giulia"];
    function idDi(n) { return n === "Paky" ? "host" : ((vm(C).giocatori || []).filter(function (g) { return g.nome === n; })[0] || {}).id; }
    function nomeDi(id) { return tutti.filter(function (n) { return idDi(n) === id; })[0]; }
    function controlla(n, cosa) {
      var w = F[n], d = w.document, tab = d.querySelector(".ru-tab"), pa = d.querySelector(".ru-alto .ru-piatto-alto"), b = d.querySelector(".st-barra");
      var rt = tab && tab.getBoundingClientRect(), rp = pa && pa.getBoundingClientRect(), rb = b && b.getBoundingClientRect(), vw = w.innerWidth;
      if (!rt || rt.top < 0 || rt.top > 0.2 * w.innerHeight) no(cosa + ": su " + n + " il tabellone non è in alto");
      var righe = [].filter.call(d.querySelectorAll(".ru-qwerty .ru-qr"), function (q) { return q.getClientRects().length; }).length;
      return { tab: rt, ruota: rp, barra: rb, vw: vw, righe: righe, nascosta: !!d.querySelector(".ru-alto.nascosta"), voc: !!(d.querySelector(".ru-qv") && d.querySelector(".ru-qv").getClientRects().length), d: d };
    }
    // ---- quando si gira: la ruota grande, niente tastiera ----
    var v = await (async function () { var t = Date.now() + 70000; while (Date.now() < t) { var x = vm(C); if (x.fase === "gira" && !x.sigla) return x; await W.dorme(200); } return null; })();
    if (!v) no("la manche non comincia (fase " + vm(C).fase + ")");
    await W.dorme(900);
    tutti.forEach(function (n) {
      var c = controlla(n, "si gira");
      if (!c.ruota || c.ruota.width < 0.7 * c.vw) no("si gira: su " + n + " la ruota non è grande (" + (c.ruota ? Math.round(c.ruota.width) : 0) + " px)");
      if (c.righe) no("si gira: su " + n + " c'è la tastiera");
      if (c.ruota.top < c.tab.bottom - 2) no("si gira: su " + n + " la ruota copre il tabellone");
    });
    L.push("si gira: ruota grande, niente tastiera");
    // chi gira la trascina: col tasto «🎡 Gira» (va bene anche così)
    var chi = nomeDi(v.turno), g0 = v.giroN;
    var bg = F[chi].document.querySelector(".ru-btn.gira"); if (!bg || bg.disabled) no(chi + " non ha «Gira»"); bg.click();
    var t1 = Date.now() + 15000, dopo = null;
    while (Date.now() < t1) { var x = vm(C); if (x.giroN > g0 && x.fase !== "girando") { dopo = x; break; } await W.dorme(200); }
    if (!dopo) no("la ruota non si ferma");
    if (dopo.fase === "consonante") {
      await W.dorme(1300);
      tutti.forEach(function (n) {
        var c = controlla(n, "si sceglie la consonante");
        if (c.righe !== 3) no("si sceglie la consonante: su " + n + " la tastiera ha " + c.righe + " righe a vista");
        var k = c.d.querySelector(".ru-qr .ru-btn.lettera"), hk = k ? k.getBoundingClientRect().height : 0;
        if (hk < 40) no("su " + n + " i tasti sono alti solo " + Math.round(hk) + " px");
        if (!c.nascosta && c.ruota && c.ruota.width > 0.75 * c.vw) no("su " + n + " la ruota è ancora grande mentre si sceglie");
        if (!c.nascosta && c.ruota && c.barra && c.ruota.bottom > c.barra.top + 2 + 0.06 * c.ruota.height) no("su " + n + " la ruota piccola finisce sotto i tasti");
        var voc = c.d.querySelector(".ru-qr .ru-btn.lettera.voc"); if (!voc || !/63, 216, 255|rgba\(63/.test(w0(F[n]).getComputedStyle(voc).backgroundImage + w0(F[n]).getComputedStyle(voc).boxShadow)) no("su " + n + " le vocali non sono azzurre");
      });
      L.push("si sceglie: tastiera a 3 righe, tasti alti, ruota piccola sopra");
    } else L.push("(la ruota si è fermata su «" + dopo.fase + "»: niente consonante questa volta)");
    // ---- le misure ----
    for (var m of [[360, 640], [412, 915]]) {
      var f = document.getElementById("tel-Paky"), css = f.style.cssText;
      f.style.cssText = "position:absolute;left:0;top:0;width:" + m[0] + "px;height:" + m[1] + "px;border:0;transform:none;z-index:9999";
      P.dispatchEvent(new P.Event("resize")); await W.dorme(800);
      var se = P.document.scrollingElement || P.document.documentElement; if (se.scrollHeight > P.innerHeight + 1) no(m.join("x") + ": la pagina scorre");
      var q = P.document.querySelector(".ru-qwerty"); if (q && q.getClientRects().length && q.getBoundingClientRect().bottom > P.innerHeight + 1) no(m.join("x") + ": la tastiera esce");
      f.style.cssText = css; P.dispatchEvent(new P.Event("resize")); await W.dorme(300);
    }
    L.push("360x640 e 412x915 senza scorrere");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return L.join(" · ");
  } });
  function w0(w) { return w; }
})();

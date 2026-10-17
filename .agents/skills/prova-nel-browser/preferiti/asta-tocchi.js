// PROVE "L'ASTA ONLINE: OGNI TOCCO È UNA MOSSA A SÉ" (17 ott 2026). Regola fissa del proprietario: due tocchi di fila = +2
// SEMPRE (il primo ti dà l'offerta più alta, il secondo è un rialzo da solo), anche coi tocchi fulminei e con la rete lenta,
// e i rilanci a salto si sommano (+2 poi +5 = +7). Lo stesso tocco arrivato due volte non conta due volte, nessuno supera
// i suoi crediti e un messaggio vecchio non ruba l'offerta a un altro.
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta-tocchi.js"); await COPIONE.prova("at1")
// (tutte: for (const n of ["at1","at2","at3","at4","at5"]) await COPIONE.prova(n), circa 2 minuti)
//
// La rete finta lenta: W.__lento = [300, 800] = ogni messaggio arriva dopo 300-800 ms (in ordine, come il broker vero).
//
// at1 Temi online in 3, rete lenta, tocchi a 50 ms: 2 tocchi = +2 (e il tabellone di chi tocca lo mostra subito, coi tasti
//     che restano gli stessi), 3 tocchi = +3, +3 poi +1 = +4; lo stesso messaggio rimandato non conta; un tocco vecchio di un
//     altro non ruba l'offerta («Troppo tardi»); un tocco perso: dopo 4 s il tabellone torna giusto e si riparte; tanti tocchi
//     fino al massimo: mai oltre i crediti, la carta a chi ha l'offerta più alta e al prezzo giusto.
// at2 Temi online in 4, rete lenta: tre telefoni toccano insieme (4 tocchi a 50 ms ciascuno, anche l'host): l'offerta sale
//     sempre, mai oltre il massimo di chi la tiene, e la carta va a chi ha davvero l'offerta più alta, coi crediti giusti.
// at3 Fantacalcio online in 3, rete lenta: «Lo prendo» + «Rialzo» fulminei = 2; +2 poi +5 = +7; 3 tocchi = +3; il doppione
//     non conta; fino a 16 (il massimo) e mai oltre: aggiudicato subito a 16, crediti 4.
// at5 Temi online: un tocco perso proprio mentre l'asta si chiude: dopo 4 s la schermata non torna alla sala di prima.
// at4 L'host (rete normale): due tocchi fulminei = +2 nei temi e nel fantacalcio («Lo prendo» + «Rialzo» = 2).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent.replace(/\s+/g, " ")) && visibile(b); })[0] || null; }
  function prezzo(w) { var b = q(w, ".sa-prezzo b, .st-prezzo b"); return b ? parseInt(b.textContent, 10) : null; }
  function chi(w) { var s = q(w, ".sa-prezzo span, .st-prezzo span"); return s ? s.textContent : ""; }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function gioc(C, nome) { return (vm(C).giocatori || []).filter(function (g) { return g.nome === nome; })[0] || null; }
  function senzaErrori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  function fermo(w) { var st = w.document.createElement("style"); st.textContent = ".schermata,.as-mal-carta,.as-scen,.as-sorpresa,.as-buste .r{animation:none!important;opacity:1!important} .btn.as-auto::after{animation:none!important}"; w.document.head.appendChild(st); }

  // ---- la rete finta lenta (in ordine): W.__lento = [min, max] ms; null = come prima ----
  if (!W.__creaTT) {
    W.__creaTT = W.creaClient;
    W.creaClient = function (nome, opts) {
      var c = W.__creaTT(nome, opts), dl = c.deliver;
      c.deliver = function (topic, payload, ret) {
        if (!W.__lento) return dl.apply(this, arguments);
        var ora = Date.now(), d = W.__lento[0] + Math.random() * (W.__lento[1] - W.__lento[0]);
        var quando = Math.max(ora + d, (this.__ultimoL || 0) + 1), self = this; this.__ultimoL = quando;
        setTimeout(function () { if (self.connected && !self.frozen) self.emit("message", topic, { toString: function () { return payload; } }, { retain: ret }); }, quando - ora);
      };
      return c;
    };
  }
  // ---- la spia: apriTel(nome, { tt: imp }) → w.__t (il tavolo); l'host legge imp come regole ----
  // (si mette una volta sola: ricaricando il file non si tolgono le spie messe dopo dagli altri file di prova)
  if (!W.__prepTT) {
    W.__prepTT = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepTT(w, nome, opz);
      if (!opz || !opz.tt) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && g.id === "asta") {
            var av = g.avvia;
            g.avvia = function (t) { w.__t = t; if (t.impostazioni) Object.keys(opz.tt).forEach(function (k) { t.impostazioni[k] = opz.tt[k]; }); return av.apply(this, arguments); };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }
  // i messaggi che manda un telefono (w.__mandati) e, se serve, uno da perdere (w.__perdi = n: il prossimo rilancio non parte)
  function spiaRete(nome) {
    var h = W.reteDi(nome); if (!h) no("non trovo la rete di " + nome);
    if (h.__spia) return h;
    var inv = h.invia, w = W.finestra(nome); w.__mandati = [];
    h.invia = function (m) {
      if (m && m.t === "rilancia") { w.__mandati.push(JSON.parse(JSON.stringify(m))); if (w.__perdi) { w.__perdi--; return; } }
      return inv.apply(this, arguments);
    };
    h.__spia = true; return h;
  }
  async function telefoni(imp, nomi) {
    var P = await W.apriTel("Paky", { x: 0, tt: imp }), C = await W.apriStanza(P, "L'Asta"); fermo(P);
    for (var i = 1; i < nomi.length; i++) { var w = await W.apriTel(nomi[i], { hash: "gioco=asta&stanza=" + C, x: 185 * i }); fermo(w); }
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 12000)) no("non sono entrati in " + nomi.length);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    nomi.slice(1).forEach(spiaRete);
    return { P: P, C: C };
  }
  function nomeDiId(C, id) { var g = (vm(C).giocatori || []).filter(function (x) { return x.id === id; })[0]; return g ? g.nome : null; }
  // (temi) fino all'asta: chi sceglie prende la prima carta
  async function finoAllAsta(P, C, ms) {
    var fino = Date.now() + (ms || 25000);
    while (Date.now() < fino && vm(C).fase !== "asta") {
      var v = vm(C);
      if (v.fase === "scelta" && v.tavolo && v.tavolo.length) {
        if (v.sceglieId === "host") { var c = q(P, ".as-carta:not([disabled])"); if (c) c.click(); }
        else W.reteDi(nomeDiId(C, v.sceglieId)).invia({ t: "scegli", idx: 0, n: v.nScelta, nome: v.tavolo[0].nome });
      }
      W.clicca(P, /Vedi le carte|Avanti/);
      await W.dorme(400);
    }
    return vm(C).fase === "asta";
  }
  // l'offerta nella foto si ferma (nessun messaggio per strada) e torna { offerta, leader }
  async function ferma(C, ms) {
    var ultimo = "", da = Date.now(), fino = Date.now() + (ms || 6000);
    while (Date.now() < fino) {
      var a = vm(C).asta, k = a ? a.offerta + "|" + a.leaderId : vm(C).fase;
      if (k !== ultimo) { ultimo = k; da = Date.now(); }
      if (Date.now() - da > 1900) break;
      await W.dorme(100);
    }
    var x = vm(C).asta; return x ? { offerta: x.offerta, leader: x.leaderId, n: x.n != null ? x.n : x.nCarta } : null;
  }
  // tocchi fulminei: sel = dove stanno i tasti, re = quale tasto, ogni 50 ms (il tasto si cerca di nuovo a ogni tocco, come il dito)
  async function tocchi(w, sel, lista) {
    var nodi = [];
    for (var i = 0; i < lista.length; i++) {
      var b = bott(w, sel, lista[i]); if (!b) no("non trovo il tasto " + lista[i] + " («" + T(w).slice(-120) + "»)");
      nodi.push(b); b.click();
      if (i < lista.length - 1) await W.dorme(50);
    }
    return nodi;
  }
  // tutte le foto della partita (per controllare che l'offerta non superi mai il massimo di chi la tiene)
  function guardaFoto(C) {
    var G = { foto: [], stop: false };
    (async function () { while (!G.stop) { var v = vm(C); if (v.asta) G.foto.push({ off: v.asta.offerta, lead: v.asta.leaderId, n: v.asta.n != null ? v.asta.n : v.asta.nCarta, max: ((v.giocatori || []).filter(function (g) { return g.id === v.asta.leaderId; })[0] || {}).max }); await W.dorme(40); } })();
    return G;
  }
  function controllaFoto(G) {
    G.stop = true;
    var prima = null;
    G.foto.forEach(function (f) {
      if (f.max != null && f.off > f.max) no("l'offerta " + f.off + " supera il massimo di chi la tiene (" + f.max + ")");
      if (prima && prima.n === f.n && f.off < prima.off) no("l'offerta scende da " + prima.off + " a " + f.off);
      prima = f;
    });
  }

  // ===================================================================== at1
  COPIONE.aggiungi("at1", { nome: "Asta temi online, rete lenta, tocchi a 50 ms: 2 = +2, 3 = +3, +3 poi +1 = +4, doppione, tocco vecchio, tocco perso, crediti", fai: async function () {
    var o = await telefoni({ formato: "temi", crediti: 25, round: "normali", maledetta: false }, ["Paky", "Giulia", "Luca"]), P = o.P, C = o.C, x = [];
    try {
      if (!await finoAllAsta(P, C)) no("non parte l'asta (fase " + vm(C).fase + ")");
      var a = vm(C).asta, X = nomeDiId(C, a.leaderId) === "Giulia" ? "Luca" : "Giulia", Y = X === "Giulia" ? "Luca" : "Giulia", wX = W.finestra(X), wY = W.finestra(Y);
      var SEL = ".sa-piede .btn";
      if (!await W.aspetta(function () { return bott(wX, SEL, /Rilancio/); }, 4000)) no(X + " non ha «Rilancio»");
      var radice = q(wX, ".sa-sala");
      W.__lento = [300, 800];
      // --- 2 tocchi = +2 (il primo lo prende, il secondo è un rialzo da solo); il tabellone lo mostra subito
      var p0 = vm(C).asta.offerta;
      var nodi = await tocchi(wX, SEL, [/Rilancio/, /Rialzo/]);
      if (prezzo(wX) !== p0 + 2 || !/è tua/.test(chi(wX))) no("subito dopo 2 tocchi il tabellone di " + X + " dice " + prezzo(wX) + " «" + chi(wX) + "» invece di " + (p0 + 2) + " tua");
      if (nodi[0] !== nodi[1]) no("tra i due tocchi il tasto è stato rifatto (lampeggio, e il secondo tocco può cadere nel vuoto)");
      var f = await ferma(C);
      if (!f || f.offerta !== p0 + 2 || f.leader !== idDi(X)) no("2 tocchi: l'host dice " + JSON.stringify(f) + " invece di " + (p0 + 2) + " a " + X);
      if (q(wX, ".sa-sala") !== radice) no("la sala di " + X + " è stata rifatta (lampeggio)");
      if (prezzo(wX) !== p0 + 2 || prezzo(wY) !== p0 + 2) no("dopo i 2 tocchi i tabelloni dicono " + prezzo(wX) + " e " + prezzo(wY));
      x.push("2 tocchi " + p0 + "→" + (p0 + 2));
      // --- 3 tocchi = +3
      await tocchi(wX, SEL, [/Rialzo/, /Rialzo/, /Rialzo/]);
      if (prezzo(wX) !== p0 + 5) no("subito dopo 3 tocchi il tabellone dice " + prezzo(wX) + " invece di " + (p0 + 5));
      f = await ferma(C);
      if (!f || f.offerta !== p0 + 5 || f.leader !== idDi(X)) no("3 tocchi: l'host dice " + JSON.stringify(f) + " invece di " + (p0 + 5));
      x.push("3 tocchi →" + (p0 + 5));
      // --- un altro rilancia (Y), poi un suo tocco si perde per strada: il tabellone lo mostra, dopo 4 s torna giusto; i tocchi dopo valgono
      if (!await W.aspetta(function () { return bott(wY, SEL, /Rilancio/); }, 4000)) no(Y + " non ha «Rilancio»");
      await tocchi(wY, SEL, [/Rilancio/]);
      f = await ferma(C);
      if (!f || f.offerta !== p0 + 6 || f.leader !== idDi(Y)) no("il rilancio di " + Y + ": " + JSON.stringify(f));
      wY.__perdi = 1; await tocchi(wY, SEL, [/Rialzo/]);
      if (prezzo(wY) !== p0 + 7) no("il tocco (perso) non si vede subito sul tabellone di " + Y);
      if (!await W.aspetta(function () { return prezzo(wY) === p0 + 6; }, 6000)) no("dopo il tocco perso il tabellone di " + Y + " resta a " + prezzo(wY));
      await tocchi(wY, SEL, [/Rialzo/, /Rialzo/]);
      f = await ferma(C);
      if (!f || f.offerta !== p0 + 8 || f.leader !== idDi(Y)) no("dopo il tocco perso, 2 tocchi di " + Y + ": " + JSON.stringify(f) + " invece di " + (p0 + 8));
      x.push("tocco perso: tabellone tornato, poi +2 →" + (p0 + 8));
      // --- X: +3 e +1 fulminei = +4
      await tocchi(wX, ".as-salti .btn", [/^\+3/]); await W.dorme(50); await tocchi(wX, SEL, [/Rialzo/]);
      if (prezzo(wX) !== p0 + 12) no("subito dopo +3 e +1 il tabellone dice " + prezzo(wX) + " invece di " + (p0 + 12));
      f = await ferma(C);
      if (!f || f.offerta !== p0 + 12 || f.leader !== idDi(X)) no("+3 poi +1: l'host dice " + JSON.stringify(f) + " invece di " + (p0 + 12) + " a " + X);
      x.push("+3 e +1 →" + (p0 + 12));
      // --- lo stesso messaggio arrivato due volte: non conta
      var ult = wX.__mandati[wX.__mandati.length - 1];
      W.reteDi(X).invia(ult); W.reteDi(X).invia(ult);
      // --- un tocco vecchio di Y (partito dal suo 8, che non c'è più) non ruba l'offerta; neanche uno che finge di avere lui il 12
      W.reteDi(Y).invia({ t: "rilancia", n: f.n, prezzo: p0 + 9, vista: p0 + 8, vl: String(idDi(Y)), tk: Date.now() });
      W.reteDi(Y).invia({ t: "rilancia", n: f.n, prezzo: p0 + 13, vista: p0 + 12, vl: String(idDi(Y)), tk: Date.now() + 1 });
      if (!await W.aspetta(function () { return /Troppo tardi di un soffio/.test(T(wY)); }, 4000)) no(Y + " col tocco vecchio non legge «Troppo tardi»");
      await W.dorme(900);
      f = vm(C).asta;
      if (!f || f.offerta !== p0 + 12 || f.leaderId !== idDi(X)) no("il doppione o un tocco vecchio di " + Y + " ha cambiato l'offerta: " + JSON.stringify(f && [f.offerta, f.leaderNome]));
      x.push("doppione e tocco vecchio: niente");
      // --- tanti tocchi fino al massimo (22 = 25 meno 1 per ogni round dopo): mai oltre, e la carta a chi l'ha al prezzo giusto
      var G = guardaFoto(C), maxY = gioc(C, Y).max, crY = gioc(C, Y).crediti, carta = vm(C).asta.carta.nome;
      for (var k = 0; k < maxY - (p0 + 12) + 4; k++) { var bb = bott(wY, SEL, /Rilancio|Rialzo/); if (bb) bb.click(); await W.dorme(50); }   // (4 di troppo: al massimo il tasto si spegne e i tocchi non fanno niente)
      if (prezzo(wY) > maxY) no("il tabellone di " + Y + " mostra " + prezzo(wY) + ", oltre il suo massimo " + maxY);
      if (!await W.aspetta(function () { return vm(C).fase === "esito"; }, 8000)) no("al massimo l'asta non si chiude (fase " + vm(C).fase + ", " + JSON.stringify(vm(C).asta && [vm(C).asta.offerta, vm(C).asta.leaderNome]) + ")");
      controllaFoto(G);
      var e = vm(C).esito;
      if (e.chiId !== idDi(Y) || e.prezzo !== maxY || e.carta.nome !== carta) no("aggiudicata a " + e.chiNome + " per " + e.prezzo + " invece di " + Y + " per " + maxY);
      if (gioc(C, Y).crediti !== crY - maxY) no(Y + " ha " + gioc(C, Y).crediti + " crediti invece di " + (crY - maxY));
      x.push("fino al massimo: " + Y + " a " + maxY + ", crediti " + gioc(C, Y).crediti);
      senzaErrori();
    } finally { W.__lento = null; }
    return x.join(" · ");
  } });

  // ===================================================================== at2
  COPIONE.aggiungi("at2", { nome: "Asta temi online in 4, rete lenta: tre telefoni toccano insieme, la carta a chi ha davvero l'offerta più alta", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca", "Marta"];
    var o = await telefoni({ formato: "temi", crediti: 15, round: "normali", maledetta: false }, NOMI), P = o.P, C = o.C, x = [];
    try {
      for (var giro = 0; giro < 2; giro++) {
        if (!await finoAllAsta(P, C)) no("non parte l'asta " + (giro + 1));
        var a = vm(C).asta, nA = a.n, carta = a.carta.nome, cr = {};
        NOMI.forEach(function (n) { var g = gioc(C, n); cr[n] = g.crediti; });
        var chi3 = NOMI.filter(function (n) { var g = gioc(C, n); return !g.haCarta && g.max > a.offerta; }).slice(0, 3);
        W.__lento = [300, 800];
        var G = guardaFoto(C);
        // tre telefoni toccano insieme: 4 tocchi a 50 ms ciascuno, sfalsati di 15 ms
        await Promise.all(chi3.map(function (n, j) { return (async function () {
          await W.dorme(j * 15);
          var w = W.finestra(n);
          for (var k = 0; k < 4; k++) { var b = bott(w, ".sa-piede .btn", /Rilancio|Rialzo/); if (b && !b.disabled) b.click(); await W.dorme(50); }
        })(); }));
        var f = await ferma(C, 8000);
        if (!f || f.n !== nA) no("l'asta " + (giro + 1) + " si è chiusa da sola mentre si toccava");
        var capo = nomeDiId(C, f.leader);
        // gli altri vedono tutti la stessa offerta, e chi non guida non vede «è tua»
        await W.dorme(1200);
        NOMI.forEach(function (n) { var w = W.finestra(n); if (prezzo(w) !== f.offerta) no(n + " vede " + prezzo(w) + " invece di " + f.offerta); if (n !== capo && /è tua/.test(chi(w))) no(n + " legge «è tua» ma l'offerta è di " + capo); });
        // gli altri passano: la carta va al capo al prezzo giusto
        NOMI.forEach(function (n) { if (n === capo || gioc(C, n).haCarta) return; var w = W.finestra(n), b = bott(w, ".sa-piede .btn", /^Passo$/); if (b) b.click(); });
        if (!await W.aspetta(function () { return vm(C).fase === "esito"; }, 8000)) no("l'asta " + (giro + 1) + " non si chiude dopo i «Passo»");
        controllaFoto(G);
        var e = vm(C).esito;
        if (e.chiId !== f.leader || e.prezzo !== f.offerta || e.carta.nome !== carta) no("aggiudicata a " + e.chiNome + " per " + e.prezzo + " invece di " + capo + " per " + f.offerta);
        if (gioc(C, capo).crediti !== cr[capo] - f.offerta) no(capo + " ha " + gioc(C, capo).crediti + " crediti invece di " + (cr[capo] - f.offerta));
        NOMI.forEach(function (n) { if (n !== capo && gioc(C, n).crediti !== cr[n]) no(n + " ha pagato senza vincere"); });
        x.push("asta " + (giro + 1) + ": " + chi3.join("+") + " insieme → " + capo + " a " + f.offerta);
        W.__lento = null;
      }
      senzaErrori();
    } finally { W.__lento = null; }
    return x.join(" · ");
  } });

  // ===================================================================== at3
  COPIONE.aggiungi("at3", { nome: "Asta fantacalcio online, rete lenta: «Lo prendo» + «Rialzo» = 2, +2 poi +5 = +7, 3 tocchi = +3, doppione, fino a 16", fai: async function () {
    var o = await telefoni({ formato: "fanta" }, ["Paky", "Giulia", "Luca"]), P = o.P, C = o.C, x = [];
    try {
      if (!await W.aspetta(function () { var v = vm(C); return v.fase === "asta" && v.asta && !v.asta.leaderId; }, 15000)) no("non arrivo al primo calciatore");
      var X = "Giulia", wX = W.finestra(X), SEL = ".st-piede .btn";
      if (!await W.aspetta(function () { return bott(wX, SEL, /Lo prendo/); }, 4000)) no(X + " non ha «Lo prendo»");
      W.__lento = [300, 800];
      var nodi = await tocchi(wX, SEL, [/Lo prendo/, /Rialzo/]);
      if (prezzo(wX) !== 2 || !/è tua/.test(chi(wX))) no("subito dopo «Lo prendo» + «Rialzo» il maxischermo dice " + prezzo(wX) + " «" + chi(wX) + "»");
      if (nodi[0] !== nodi[1]) no("tra i due tocchi il tasto è stato rifatto");
      var f = await ferma(C);
      if (!f || f.offerta !== 2 || f.leader !== idDi(X)) no("«Lo prendo» + «Rialzo»: l'host dice " + JSON.stringify(f) + " invece di 2");
      x.push("lo prendo + rialzo = 2");
      await tocchi(wX, ".as-salti .btn", [/^\+2/]); await W.dorme(50); await tocchi(wX, ".as-salti .btn", [/^\+5/]);
      if (prezzo(wX) !== 9) no("subito dopo +2 e +5 il maxischermo dice " + prezzo(wX) + " invece di 9");
      f = await ferma(C);
      if (!f || f.offerta !== 9 || f.leader !== idDi(X)) no("+2 poi +5: l'host dice " + JSON.stringify(f) + " invece di 9");
      x.push("+2 e +5 → 9");
      await tocchi(wX, SEL, [/Rialzo/, /Rialzo/, /Rialzo/]);
      f = await ferma(C);
      if (!f || f.offerta !== 12) no("3 tocchi: l'host dice " + JSON.stringify(f) + " invece di 12");
      var ult = wX.__mandati[wX.__mandati.length - 1];
      W.reteDi(X).invia(ult); W.reteDi(X).invia(ult);
      f = await ferma(C, 4000);
      if (f.offerta !== 12) no("il doppione ha fatto salire l'offerta a " + f.offerta);
      x.push("3 tocchi → 12, doppione niente");
      // fino al massimo (16): +5 non ci arriva (spento), poi tocchi fulminei: mai oltre
      var G = guardaFoto(C), b5 = bott(wX, ".as-salti .btn", /^\+5/);
      if (!b5 || !b5.disabled) no("a 12 il +5 (17) di " + X + " è acceso");
      for (var k = 0; k < 7; k++) { var bb = bott(wX, SEL, /Rialzo/); if (bb && !bb.disabled) bb.click(); await W.dorme(50); }
      if (prezzo(wX) > 16) no("il maxischermo di " + X + " mostra " + prezzo(wX) + ", oltre 16");
      if (!await W.aspetta(function () { return vm(C).fase === "esito"; }, 8000)) no("a 16 l'asta non si chiude da sola (" + JSON.stringify(vm(C).asta && [vm(C).asta.offerta]) + ")");
      controllaFoto(G);
      var e = vm(C).esito;
      if (e.chiId !== idDi(X) || e.prezzo !== 16) no("aggiudicato a " + e.chiNome + " per " + e.prezzo + " invece di " + X + " per 16");
      if (gioc(C, X).crediti !== 4) no(X + " ha " + gioc(C, X).crediti + " crediti invece di 4");
      x.push("fino a 16: aggiudicato, crediti 4");
      senzaErrori();
    } finally { W.__lento = null; }
    return x.join(" · ");
  } });

  // ===================================================================== at5
  COPIONE.aggiungi("at5", { nome: "Asta temi online: un tocco perso proprio mentre l'asta si chiude non riporta indietro la schermata", fai: async function () {
    var o = await telefoni({ formato: "temi", crediti: 15, round: "normali", maledetta: false }, ["Paky", "Giulia", "Luca"]), P = o.P, C = o.C;
    if (!await finoAllAsta(P, C)) no("non parte l'asta");
    var a = vm(C).asta, nA = a.n, X = nomeDiId(C, a.leaderId) === "Giulia" ? "Luca" : "Giulia", Y = X === "Giulia" ? "Luca" : "Giulia", wX = W.finestra(X);
    if (!await W.aspetta(function () { return bott(wX, ".sa-piede .btn", /Rilancio/); }, 4000)) no(X + " non ha «Rilancio»");
    wX.__perdi = 1; await tocchi(wX, ".sa-piede .btn", [/Rilancio/]);
    if (prezzo(wX) !== a.offerta + 1) no("il tocco non si vede subito");
    // tutti gli altri passano (anche X, a messaggio): l'asta si chiude col capo di prima
    W.reteDi(X).invia({ t: "passa", n: nA });
    if (a.leaderId !== idDi(Y)) W.reteDi(Y).invia({ t: "passa", n: nA });
    if (a.leaderId !== "host") { var bp = await W.aspetta(function () { return bott(P, ".sa-piede .btn", /^Passo$/); }, 2000); if (bp) bp.click(); }
    if (!await W.aspetta(function () { return vm(C).fase !== "asta" || (vm(C).asta && vm(C).asta.n !== nA); }, 5000)) no("l'asta non si chiude dopo i «Passo»");
    var e = vm(C).esito; if (e && e.chiId !== a.leaderId) no("la carta è andata a " + e.chiNome + " (il tocco perso ha contato?)");
    await W.dorme(5500);   // (oltre i 4 secondi del tocco perso)
    var v = vm(C);
    if (!(v.fase === "asta" && v.asta && v.asta.n !== nA) && bott(wX, ".sa-piede .btn", /Rilancio|Rialzo/)) no("dopo l'asta chiusa " + X + " rivede la sala di prima coi tasti per rilanciare (fase " + v.fase + ")");
    senzaErrori();
    return "tocco perso, asta chiusa a " + (e ? e.chiNome + " per " + e.prezzo : "?") + ", schermata di " + X + " giusta (fase " + v.fase + ")";
  } });

  // ===================================================================== at4
  COPIONE.aggiungi("at4", { nome: "Asta online: l'host con due tocchi fulminei = +2 (temi e fantacalcio)", fai: async function () {
    var x = [];
    var o = await telefoni({ formato: "temi", crediti: 15, round: "normali", maledetta: false }, ["Paky", "Giulia"]), P = o.P, C = o.C;
    if (!await finoAllAsta(P, C)) no("non parte l'asta");
    var a = vm(C).asta;
    if (a.leaderId === "host") { await tocchi(W.finestra("Giulia"), ".sa-piede .btn", [/Rilancio/]); await ferma(C, 3000); }
    var p0 = vm(C).asta.offerta;
    if (!await W.aspetta(function () { return bott(P, ".sa-piede .btn", /Rilancio/); }, 4000)) no("l'host non ha «Rilancio»");
    await tocchi(P, ".sa-piede .btn", [/Rilancio/, /Rialzo/]);
    var f = await ferma(C, 3000);
    if (f.offerta !== p0 + 2 || f.leader !== "host") no("l'host con 2 tocchi: " + JSON.stringify(f) + " invece di " + (p0 + 2));
    x.push("temi " + p0 + "→" + f.offerta);
    // il fantacalcio: telefoni nuovi
    A.pulisci();
    o = await telefoni({ formato: "fanta" }, ["Paky", "Giulia"]); P = o.P; C = o.C;
    if (!await W.aspetta(function () { var v = vm(C); return v.fase === "asta" && v.asta && !v.asta.leaderId; }, 15000)) no("non arrivo al primo calciatore");
    if (!await W.aspetta(function () { return bott(P, ".st-piede .btn", /Lo prendo/); }, 4000)) no("l'host non ha «Lo prendo»");
    await tocchi(P, ".st-piede .btn", [/Lo prendo/, /Rialzo/]);
    f = await ferma(C, 3000);
    if (f.offerta !== 2 || f.leader !== "host") no("l'host nel fanta con 2 tocchi: " + JSON.stringify(f) + " invece di 2");
    x.push("fanta lo prendo + rialzo = 2");
    senzaErrori();
    return x.join(" · ");
  } });
})();

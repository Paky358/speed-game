// PROVE DEL PASSO 5, pezzo p5-r: l'host di riserva acceso nei 13 giochi lunghi.
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("passo5/riserva.js"); await COPIONE.prova(585)
//   (oppure await COPIONE.gruppo5r(): 585-599 in fila; COPIONE.gruppo5r([586, 590]) solo quelle)
//
// Ogni scenario: 4 telefoni (Paky apre la stanza col percorso di prima, Giulia, Luca e Sara entrano uno alla volta: i vice
// sono Giulia e Luca), si comincia, si gioca un po', poi il telefono di Paky si SPEGNE e non torna (muore: testamento e
// niente collegamenti nuovi). Si controlla:
//   - entro 8 s la partita la tiene Giulia (foto trattenuta con _g 2 e _h = il suo id), Giulia legge «👑 … la porti avanti
//     tu», Luca e Sara «👑 Ora la partita la tiene Giulia»;
//   - la partita va avanti (Giulia gioca da host, Luca e Sara dal loro telefono) fino alla classifica finale;
//   - la partita (XP) arriva una volta sola a Giulia, Luca e Sara, un solo "__esito"; nessuna «stanza chiusa», nessun errore.
// 585 Linea del tempo, 586 Scalinata, 587 Balla Colossale, 588 Nomi Cose e Città, 589 Scarabocchio, 590 Taboo,
// 591 Sì… però, 592 L'Asta, 593 Ruota della Fortuna, 594 Black Jack, 595 Poker, 596 Scopa 2 vs 2, 597 Patata Bollente.
// In 585 (Linea del tempo), 589 (Scarabocchio) e 594 (Black Jack) Paky poi TORNA (l'app era solo in secondo piano):
//   legge «👋 Bentornato! Ora la partita la tiene Giulia: rientri come giocatore», rientra al suo posto, mai due host, e
//   a fine partita anche lui ha la partita una volta sola.
// 598 Scalinata piccola con 5 telefoni: Marco arriva per quinto e guarda; è lui il primo vice (t.vici: prima chi guarda),
//   porta avanti la salita senza giocare e alla «Nuova partita» è il primo della saletta, con la corona.
// 599 Nella Sala (Linea del tempo lanciata dalla Sala, 3 telefoni): Paky sparisce, Giulia tiene il gioco (6 s) e poi la Sala
//   (gen 2) senza buttare il gioco; classifica, la partita conta una volta nella serata, tasti di fine del core.
// Le mosse dell'host si mandano come se arrivassero dal suo id (cb della stanza, spia w.__cbH); le regole si accorciano
// con w.__imp (le legge solo chi apre la stanza: il vice le riceve nella copia). Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T;
  var GIOCHI = ["timeline", "scalinata", "balla", "nomicose", "scarabocchio", "taboo", "sipero", "asta", "ruota", "blackjack", "poker", "scopa2v2", "patata"];
  function no(p) { throw new Error("NO: " + p); }
  function vm(C) { return W.vmDi(C) || {}; }
  function pill(w) { return w ? [].map.call(w.document.querySelectorAll(".sg-pillola"), function (x) { return x.textContent; }).join(" | ") : ""; }
  function ripresaDi(nome) { try { return JSON.parse(W.BR.mem[nome].l["sg-ripresa"] || "null"); } catch (e) { return null; } }

  // ---- la spia (apriTel(nome, { spiaR: true })): w.__imp = regole accorciate (le legge chi apre), w.__cbH[gid] = la stanza
  //      tenuta da questo telefono (per le mosse dell'host senza toccare lo schermo) ----
  if (!W.__prepR) {
    W.__prepR = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepR(w, nome, opz);
      if (!opz || !opz.spiaR) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && GIOCHI.indexOf(g.id) >= 0 && !g.__spiaR) {
            g.__spiaR = true; var av = g.avvia;
            g.avvia = function (t) {
              if (w.__imp && t.impostazioni && !t.ripresa) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
              if (!w.__cbH) {
                w.__cbH = {};
                var osp = w.SGNet.ospita;
                w.SGNet.ospita = function (gid, cb) { w.__cbH[gid] = cb; return osp.apply(this, arguments); };
              }
              return av.apply(this, arguments);
            };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }

  // ---- il tavolo della prova: chi c'è, chi tiene la partita, le mosse ----
  // X = { C, gid, ids: { nome: id }, vivi: [nomi dei telefoni accesi] }
  function nomeDi(X, id) { var n = null; Object.keys(X.ids).forEach(function (k) { if (X.ids[k] === id) n = k; }); return n; }
  function chiTiene(X) { var c = A.chiTiene(X.C); return nomeDi(X, c.h || "host") || "Paky"; }
  // una mossa come la manderebbe quel telefono (chi tiene la partita: come se arrivasse dal suo id)
  function manda(X, nome, msg) {
    if (X.vivi.indexOf(nome) < 0) return false;
    if (nome === chiTiene(X)) {
      var w = W.finestra(nome), cb = w && w.__cbH && w.__cbH[X.gid];
      if (!cb) return false;
      try { cb.onMsg(X.ids[nome], JSON.parse(JSON.stringify(msg))); } catch (e) { console.warn("mossa dell'host", e); }
      return true;
    }
    var h = W.reteDi(nome); if (!h) return false;
    h.invia(msg); return true;
  }
  function wTiene(X) { return W.finestra(chiTiene(X)); }
  // un tocco vero (pointerdown + pointerup + click) sul primo tasto attivo col testo
  function tocca(w, re, sel) {
    if (!w) return false;
    var b = [].filter.call(w.document.querySelectorAll(sel || "button"), function (x) { return re.test(x.textContent || x.getAttribute("aria-label") || "") && !x.disabled; })[0];
    if (!b) return false;
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tp) { b.dispatchEvent(new Ev(tp, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click(); return true;
  }
  function toccaEl(w, b) {
    if (!w || !b) return false;
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tp) { b.dispatchEvent(new Ev(tp, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click(); return true;
  }
  function sentinella(nomi) {
    var visti = [];
    var t = setInterval(function () { nomi.forEach(function (n) { var w = W.finestra(n); if (!w || !w.document || !w.document.body) return; var m = W.testo(w).match(/Problema di collegamento|Collegamento perso|La stanza è chiusa|stata chiusa|ha chiuso la/); if (m && visti.indexOf(n + ": " + m[0]) < 0) visti.push(n + ": " + m[0]); }); }, 120);
    return { stop: function () { clearInterval(t); return visti; } };
  }
  // gira finché fino(vm) è vero, facendo passo(vm) ogni 300 ms
  async function finche(X, fino, passo, ms, perche) {
    var t = Date.now() + (ms || 60000);
    while (Date.now() < t) {
      var v = vm(X.C);
      if (fino(v)) return v;
      try { if (passo) await passo(v); } catch (e) { if (/^NO:/.test(e.message)) throw e; console.warn("passo", e); }
      await W.dorme(300);
    }
    no((perche || "non si arriva al punto della prova") + " (fase " + vm(X.C).fase + ", tiene " + chiTiene(X) + ")");
  }

  // ---- LA PROVA DELLA RISERVA ----
  // o = { gid, tessera, imp, quanti(vm): persone in saletta, comincia: async X, prima(vm): il punto della partita in cui
  //       spegnere Paky, passoPrima(vm, X), passo(vm, X), fine(vm, X), torna: true (Paky torna dopo il subentro),
  //       dentroPaky(vm): Paky è di nuovo al suo posto, maxMs }
  async function provaRiserva(o) {
    var L = [], amici = o.amici || ["Giulia", "Luca", "Sara"], nomi = ["Paky"].concat(amici);
    var V0 = o.vice || "Giulia", altri = amici.filter(function (n) { return n !== V0; });   // chi deve prendere il posto e gli altri
    W.__partite = {};
    var X = { gid: o.gid, ids: { Paky: "host" }, vivi: nomi.slice(), fatti: {} };
    var P = await W.apriTel("Paky", { x: 0, spiaR: true, prima: function (w) { w.__imp = o.imp || null; A.contaPartite("Paky")(w); if (o.primaTel) o.primaTel(w, "Paky"); } });
    X.C = await W.apriStanza(P, o.tessera);
    var quanti = o.quanti || A.contaDentro;
    for (var i = 0; i < amici.length; i++) {
      var n = amici[i], k = i + 2;
      await W.apriTel(n, { hash: "gioco=" + o.gid + "&stanza=" + X.C, x: 185 * (i + 1), spiaR: true, prima: (function (n) { return function (w) { A.contaPartite(n)(w); if (o.primaTel) o.primaTel(w, n); }; })(n) });
      if (!await W.aspetta(function () { return quanti(vm(X.C)) >= k; }, 10000)) no(n + " non entra in saletta (" + JSON.stringify(vm(X.C)).slice(0, 140) + ")");
      X.ids[n] = A.mioId(n);
      await W.dorme(300);
    }
    if (o.comincia) await o.comincia(X);
    else if (!await W.aspetta(function () { return W.clicca(P, /Comincia|Via ▶/); }, 5000)) no("l'host non ha «Comincia»");
    await finche(X, function (v) { return o.prima(v, X); }, o.passoPrima ? function (v) { return o.passoPrima(v, X); } : null, o.attesaPrima || 60000, "non si arriva al punto in cui spegnere l'host");
    await W.dorme(1600);   // (la copia ai vice: al massimo una al secondo)
    var sent = sentinella(amici), t0 = Date.now();
    // ---- Paky si spegne e non torna ----
    A.muore("Paky"); X.vivi = amici.slice();
    if (!await W.aspetta(function () { var c = A.chiTiene(X.C); return c.g === 2 && c.h === X.ids[V0]; }, 8000))
      no("dopo 8 s la partita non la tiene " + V0 + " (" + JSON.stringify(A.chiTiene(X.C)) + ", fase " + vm(X.C).fase + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    var pg = await A.pilloleDi([V0], /porti avanti tu/, 3000), pa = await A.pilloleDi(altri, new RegExp("Ora la partita la tiene " + V0), 4000);
    if (!pg[V0]) no(V0 + " non legge «… la porti avanti tu» («" + pill(W.finestra(V0)) + "»)");
    if (!altri.every(function (n) { return pa[n]; })) no(altri.join(" e ") + " non leggono «Ora la partita la tiene " + V0 + "» (" + JSON.stringify(pa) + ")");
    L.push(V0 + " tiene la partita in " + dt + " s (fase " + vm(X.C).fase + ")");
    // ---- (585, 589, 594) Paky torna: rientra come giocatore ----
    if (o.torna) {
      await finche(X, function () { return Date.now() - t0 > 9000; }, function (v) { return o.passo(v, X); }, 15000);
      var t1 = Date.now();
      A.torna("Paky");
      var pp = await A.pilloleDi(["Paky"], new RegExp("Bentornato.*" + V0 + ".*rientri come giocatore"), 8000);
      if (!pp.Paky) no("Paky non legge «👋 Bentornato! Ora la partita la tiene Giulia…» («" + pill(W.finestra("Paky")) + "»)");
      X.vivi = nomi.slice();
      await finche(X, function (v) { return o.dentroPaky(v); }, function (v) { return o.passo(v, X); }, 30000, "Paky non rientra al suo posto");
      var altre = A.fotoDa(X.C, t1 + 2500).filter(function (x) { return x.h !== X.ids[V0]; });
      if (altre.length) no("dopo il ritorno di Paky ci sono foto di un altro host: " + JSON.stringify(altre.slice(0, 3)));
      L.push("Paky torna e gioca da giocatore");
    }
    // ---- fino alla classifica ----
    var fine = o.fine || function (v) { return v.fase === "fine"; };
    var vF = await finche(X, function (v) { return fine(v, X); }, function (v) { return o.passo(v, X); }, o.maxMs || 240000, "la partita tenuta da " + V0 + " non arriva alla classifica");
    await W.dorme(3000);
    var c = A.chiTiene(X.C); if (c.g !== 2 || c.h !== X.ids[V0]) no("alla fine la partita non la tiene più " + V0 + " (" + JSON.stringify(c) + ")");
    // (p5-z) chi tiene la partita vede davvero la sua classifica coi tasti dell'host (prima alcuni giochi la disegnavano
    // sul tavolo di quando era ospite, che non c'è più, e restava fermo sull'ultima schermata)
    var wV0 = W.finestra(V0);
    if (!o.senzaTasti && !await W.aspetta(function () { return /Nuova partita|Rivincita/.test(T(wV0)); }, 25000, 300)) no(V0 + " (tiene la partita) non vede la classifica con «Nuova partita» («" + T(wV0).slice(0, 90) + "»)");
    var chi = o.torna ? nomi : amici, pt = W.__partite || {};
    chi.forEach(function (n) { if (pt[n] !== 1) no("partite (XP) date: " + JSON.stringify(pt) + " (" + n + " doveva averne 1)"); });
    // (Paky spento non conta: sul telefono finto il suo gioco continua da solo senza rete, come un telefono vero che resta acceso
    // senza linea; quello che conta è che la sua partita non arrivi a nessuno)
    var es = (W.BR.storia || []).filter(function (x) { return x.topic.indexOf("/" + X.C + "/stato") >= 0 && x.p.indexOf('"__esito"') >= 0; });
    if (es.length !== 1 || es[0].da !== V0) no("gli __esito sono " + es.length + " (" + es.map(function (x) { return x.da; }).join(", ") + "): doveva essere 1, di " + V0);
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    L.push("classifica raggiunta (" + ((Date.now() - t0) / 1000).toFixed(0) + " s dopo lo spegnimento), XP una volta sola, un __esito");
    if (o.dopo) L.push(await o.dopo(X, vF));
    return L.join(" · ");
  }

  // =====================================================================
  //  585 LINEA DEL TEMPO
  // =====================================================================
  function passoTl(v, X) {
    var k = v.fase + "|" + v.n, chi = nomeDi(X, v.turnoId);
    if (v.fase === "turno" && chi && !X.fatti[k + chi]) { if (manda(X, chi, { t: "scelta", gap: 0, n: v.n })) X.fatti[k + chi] = 1; }
    else if (v.fase === "votazione") X.vivi.forEach(function (n) { if (n !== chi && !X.fatti[k + n] && (v.giocatori || []).some(function (g) { return g.id === X.ids[n] && !g.via; })) { if (manda(X, n, { t: "voto", d: true, n: v.n })) X.fatti[k + n] = 1; } });
    else if (v.fase === "esito" && chi && !X.fatti[k + "av"]) { if (X.vivi.indexOf(chi) >= 0) { manda(X, chi, { t: "avanti", n: v.n }); X.fatti[k + "av"] = 1; } }
    else if (v.fase === "attesa") tocca(wTiene(X), /Finisci qui la partita/);
  }
  COPIONE.aggiungi(585, { nome: "Riserva · Linea del tempo: l'host si spegne, Giulia porta avanti la partita fino alla classifica; poi l'host torna da giocatore", fai: function () {
    return provaRiserva({ gid: "timeline", tessera: "La linea del tempo", imp: { carte: 2 }, torna: true,
      prima: function (v) { return v.fase === "turno" && v.n >= 2; }, passoPrima: passoTl, passo: passoTl,
      dentroPaky: function (v) { return (v.giocatori || []).some(function (g) { return g.id === "host" && !g.via; }); } });
  } });

  // =====================================================================
  //  586 SCALINATA
  // =====================================================================
  function passoSc(v, X) {
    if (v.fase !== "scelta") return;
    X.vivi.forEach(function (n) {
      var p = (v.posti || []).filter(function (x) { return x.id === X.ids[n]; })[0], k = "s" + v.nRound + "." + (v.nRip || 0) + n;
      if (!p || p.chosen || X.fatti[k]) return;
      var sc = v.sc || [1, 3, 5];
      if (manda(X, n, { t: "scegli", n: sc[Math.floor(Math.random() * sc.length)], r: v.nRound })) X.fatti[k] = 1;
    });
  }
  COPIONE.aggiungi(586, { nome: "Riserva · Scalinata: l'host si spegne, Giulia porta avanti la salita fino al podio", fai: function () {
    return provaRiserva({ gid: "scalinata", tessera: "La Scalinata",
      prima: function (v) { return v.fase === "scelta" && v.nRound >= 2; }, passoPrima: passoSc, passo: passoSc, maxMs: 300000 });
  } });

  // =====================================================================
  //  587 BALLA COLOSSALE
  // =====================================================================
  function passoB(v, X) {
    (v.players || []).forEach(function (p) {
      var n = nomeDi(X, p.id); if (!n || p.via || X.vivi.indexOf(n) < 0) return;
      var k = v.fase + "|" + v.giro + "." + (v.rif || 0) + "|" + n; if (X.fatti[k]) return;
      if (v.fase === "scrittura" && (v.fatti || []).indexOf(p.id) < 0) { if (manda(X, n, { t: "balla", testo: "balla di " + n + " " + v.giro + "." + (v.rif || 0) })) X.fatti[k] = 1; }
      if (v.fase === "voto" && (v.fatti || []).indexOf(p.id) < 0 && v.scelte) {
        var kk = -1; v.scelte.forEach(function (s, i) { if (kk < 0 && String(s.testo || "").toLowerCase().indexOf("balla di " + n.toLowerCase()) < 0) kk = i; });
        if (kk >= 0 && manda(X, n, { t: "voto", k: kk })) X.fatti[k] = 1;
      }
      if (v.fase === "punti" && (v.avanti || []).indexOf(p.id) < 0) { if (manda(X, n, { t: "avanti" })) X.fatti[k] = 1; }
    });
  }
  COPIONE.aggiungi(587, { nome: "Riserva · Balla Colossale: l'host si spegne mentre si scrive, Giulia porta avanti la partita fino alla classifica", fai: function () {
    return provaRiserva({ gid: "balla", tessera: "La Balla Colossale", imp: { round: 2, amici: "no", ride: false },
      prima: function (v) { return v.fase === "scrittura"; }, passo: passoB });
  } });

  // =====================================================================
  //  588 NOMI, COSE E CITTÀ
  // =====================================================================
  function passoN(v, X) {
    (v.players || []).forEach(function (p) {
      var n = nomeDi(X, p.id); if (!n || p.via || X.vivi.indexOf(n) < 0) return;
      var k = v.fase + "|" + v.giro + "|" + (v.ci || 0) + "|" + (v.rip || 0) + "|" + n; if (X.fatti[k]) return;
      if (v.fase === "scrittura" && (v.fatti || []).indexOf(p.id) < 0) { if (manda(X, n, { t: "risposte", r: (v.cats || []).map(function (c, i) { return v.lettera + "parola" + n + i; }) })) X.fatti[k] = 1; }
      if (v.fase === "tabellone" && (v.pronti || []).indexOf(p.id) < 0) { if (manda(X, n, { t: "pronto", ci: v.ci })) X.fatti[k] = 1; }
      if (v.fase === "punti") { if (manda(X, n, { t: "avanti", g: v.giro })) X.fatti[k] = 1; }
    });
  }
  COPIONE.aggiungi(588, { nome: "Riserva · Nomi Cose e Città: l'host si spegne mentre si scrive, Giulia porta avanti la partita fino alla classifica", fai: function () {
    return provaRiserva({ gid: "nomicose", tessera: "Nomi, Cose e Città", imp: { round: 2, secondi: 60 },
      comincia: async function (X) { if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Via ▶|Comincia/); }, 5000)) no("l'host non ha «Via ▶»"); },
      prima: function (v) { return v.fase === "scrittura"; }, passo: passoN });
  } });

  // =====================================================================
  //  589 SCARABOCCHIO
  // =====================================================================
  function passoS(v, X) {
    var d = nomeDi(X, v.disegnatore), w = d && X.vivi.indexOf(d) >= 0 ? W.finestra(d) : null;
    if (v.fase === "scelta" && w && !X.fatti["s" + v.turno]) {
      var l = w.document.querySelectorAll(".sb-scelte button");
      if (l.length) { toccaEl(w, l[0]); X.fatti["s" + v.turno] = 1; }
    }
    if (v.fase === "disegno") {
      var r = ripresaDi(chiTiene(X)), parola = r && r.stato && r.stato.parola;
      if (!parola) return;
      X.vivi.forEach(function (n) {
        var p = (v.players || []).filter(function (x) { return x.id === X.ids[n]; })[0];
        if (!p || p.ok || p.via || n === d || X.fatti["p" + v.turno + n]) return;
        if (manda(X, n, { t: "prova", x: parola })) X.fatti["p" + v.turno + n] = 1;
      });
    }
  }
  COPIONE.aggiungi(589, { nome: "Riserva · Scarabocchio: l'host si spegne mentre si disegna, Giulia porta avanti la partita fino alla classifica; poi l'host torna", fai: function () {
    return provaRiserva({ gid: "scarabocchio", tessera: "Scarabocchio", imp: { giri: 1, secondi: 60 }, torna: true,
      prima: function (v) { return v.fase === "disegno"; }, passoPrima: function (v, X) { if (v.fase === "scelta") passoS(v, X); }, passo: passoS,
      dentroPaky: function (v) { return (v.players || []).some(function (p) { return p.id === "host" && !p.via; }); }, maxMs: 300000 });
  } });

  // =====================================================================
  //  590 TABOO (il tempo dei turni lo fa passare l'orologio di chi tiene la partita)
  // =====================================================================
  var OFF = {};
  function avantiOra(nome, ms) { OFF[nome] = (OFF[nome] || 0) + ms; W.spostaOrologio(nome, OFF[nome]); }
  function passoTb(v, X) {
    var k = v.fase + "|" + v.turno + "|" + (v.rifatto || 0), chi = chiTiene(X);
    if (X.fatti[k + chi]) return;
    if (v.fase === "turno") { X.fatti[k + chi] = 1; avantiOra(chi, 61000); }
    else if (v.fase === "pronto" && v.attivo) { X.fatti[k + chi] = 1; avantiOra(chi, 21000); }
  }
  COPIONE.aggiungi(590, { nome: "Riserva · Taboo: l'host si spegne tra un turno e l'altro, Giulia porta avanti la partita fino alla classifica", fai: async function () {
    OFF = {};
    try {
      return await provaRiserva({ gid: "taboo", tessera: "Taboo", imp: { tempo: 60, giri: 1, carte: 2 },
        prima: function (v) { return v.fase === "pronto" && v.attivo; }, passo: passoTb, maxMs: 180000 });
    } finally { Object.keys(OFF).forEach(function (n) { try { W.spostaOrologio(n, 0); } catch (e) {} }); }
  } });

  // =====================================================================
  //  591 SÌ… PERÒ
  // =====================================================================
  function passoSp(v, X) {
    var st = v.step;
    if (v.fase === "gioco" && st) {
      var k = "g|" + v.round + "|" + st.i;
      if (!X.fatti[k]) (v.giocatori || []).forEach(function (p) {
        var n = nomeDi(X, p.id);
        if (X.fatti[k] || !n || X.vivi.indexOf(n) < 0 || v.assegna[p.id] !== st.sq) return;
        var w = W.finestra(n), cc = w.document.querySelectorAll(".sp-carta"); if (cc.length < st.n) return;
        [].slice.call(cc, 0, st.n).forEach(function (c) { if (!c.classList.contains("su")) c.click(); });
        if (W.clicca(w, /Gioca ▶/)) X.fatti[k] = 1;
      });
    }
    // decide il giudice; se è uscito (es. era l'host sparito) decide chi tiene la partita
    var g = nomeDi(X, v.giudiceId), wg = g && !v.giudiceVia && X.vivi.indexOf(g) >= 0 ? W.finestra(g) : (v.giudiceVia || !v.giudiceId ? wTiene(X) : null);
    if (v.fase === "arringa" && wg && !X.fatti["a|" + v.round + "|" + v.parla]) { if (W.clicca(wg, /Tocca alla Squadra|Al verdetto/)) X.fatti["a|" + v.round + "|" + v.parla] = 1; }
    if (v.fase === "giudizio" && wg && !X.fatti["d|" + v.round]) { var b = wg.document.querySelector(".sp-vota"); if (b) { b.click(); X.fatti["d|" + v.round] = 1; } }
    if (v.fase === "esito" && !X.fatti["e|" + v.round]) { if (W.clicca(wTiene(X), /Prossimo round|Classifica finale/)) X.fatti["e|" + v.round] = 1; }
  }
  COPIONE.aggiungi(591, { nome: "Riserva · Sì… però: l'host si spegne mentre si giocano le carte, Giulia porta avanti la partita fino alla classifica", fai: function () {
    return provaRiserva({ gid: "sipero", tessera: "Sì... però", imp: { giri: 1, arringa: 0, modalita: "classica" },
      prima: function (v) { return v.fase === "gioco"; }, passo: passoSp, maxMs: 300000 });
  } });

  // =====================================================================
  //  592 L'ASTA (coi temi)
  // =====================================================================
  function nomeG(X, v, id) { return nomeDi(X, id); }
  function passoA(v, X) {
    if (v.fase === "scelta" && v.sceglieId && v.tavolo && v.tavolo.length && !X.fatti["s" + v.nScelta]) {
      if (manda(X, nomeG(X, v, v.sceglieId), { t: "scegli", idx: 0, n: v.nScelta, nome: v.tavolo[0].nome })) X.fatti["s" + v.nScelta] = 1;
    }
    if (v.fase === "asta" && v.asta) (v.giocatori || []).forEach(function (g) {
      var k = "p" + v.asta.n + g.id;
      if (X.fatti[k] || g.haCarta || g.id === v.asta.leaderId) return;
      if (manda(X, nomeDi(X, g.id), { t: "passa", n: v.asta.n })) X.fatti[k] = 1;
    });
    if (v.fase === "voto") (v.giocatori || []).forEach(function (g) {
      if (X.fatti["v" + g.id] || (v.hannoVotato || []).indexOf(g.id) >= 0) return;
      var voti = {}; v.giocatori.forEach(function (x) { if (x.id !== g.id) voti[x.id] = 4; });
      if (manda(X, nomeDi(X, g.id), { t: "voto", voti: voti, s: v.sessione })) X.fatti["v" + g.id] = 1;
    });
  }
  COPIONE.aggiungi(592, { nome: "Riserva · L'Asta: l'host si spegne durante un'asta, Giulia porta avanti la partita fino alla classifica", fai: function () {
    return provaRiserva({ gid: "asta", tessera: "L'Asta", imp: { formato: "temi", crediti: 15 },
      prima: function (v) { return v.fase === "asta"; }, passoPrima: passoA, passo: passoA, maxMs: 300000 });
  } });

  // =====================================================================
  //  593 RUOTA DELLA FORTUNA
  // =====================================================================
  function passoR(v, X) {
    var r = ripresaDi(chiTiene(X)), P = r && r.stato && r.stato.P; if (!P) return;
    var k = v.fase + "|" + v.manche + "|" + v.turno + "|" + (v.lampo ? v.lampo.n + "." + v.lampo.prove + "." + (v.lampo.chi || "") : "") + "|" + v.giroN;
    if (X.fatti[k]) return;
    var chi = nomeDi(X, v.turno);
    if (v.fase === "lampo" && v.lampo && !v.lampo.chi && v.lampo.n >= 2) { if (manda(X, "Giulia", { t: "azione", a: "prenoto", x: { n: v.lampo.n, ms: 300 } })) X.fatti[k] = 1; }
    else if (v.fase === "lampo" && v.lampo && v.lampo.chi && P.lampo) { if (manda(X, nomeDi(X, v.lampo.chi), { t: "azione", a: "soluzione", x: P.lampo.frase })) X.fatti[k] = 1; }
    else if (v.fase === "gira" && chi) { if (manda(X, chi, { t: "azione", a: "risolvi" })) X.fatti[k] = 1; }
    else if (v.fase === "risolvi" && chi) { if (manda(X, chi, { t: "azione", a: "soluzione", x: P.frase })) X.fatti[k] = 1; }
  }
  COPIONE.aggiungi(593, { nome: "Riserva · Ruota della Fortuna: l'host si spegne quando tocca a uno, Giulia porta avanti la partita fino alla classifica", fai: function () {
    return provaRiserva({ gid: "ruota", tessera: "La Ruota della Fortuna", imp: { manche: 2, prenota: true, express: false, veloce: false, finale: false },
      prima: function (v) { return v.fase === "gira" && !v.sigla; }, passoPrima: function (v, X) { if (v.fase === "lampo") passoR(v, X); }, passo: passoR, maxMs: 240000 });
  } });

  // il profilo finto che ricorda le monete (come la nube vera): Paky ne ha 5.000, gli altri 1.000. W.__nube[nome] = { fiches, n }
  function spiaNube(w, nome) {
    W.__nube = W.__nube || {};
    var N = W.__nube[nome] = W.__nube[nome] || { fiches: nome === "Paky" ? 5000 : 1000, n: 0 };
    var V = w.SGNube; if (!V) return;
    V.fiches = function () { return N.fiches; };
    V.salvaFiches = function (g, f) { N.n++; if (typeof f === "number") N.fiches = f; return Promise.resolve(); };
    var sp = V.salvaProgressi;
    V.salvaProgressi = function (f) { if (typeof f === "number") N.fiches = f; return sp ? sp.apply(this, arguments) : Promise.resolve(); };
  }
  // =====================================================================
  //  594 BLACK JACK (2 mani dopo il subentro, poi chi tiene il tavolo chiude: classifica)
  // =====================================================================
  function nomeSeat(X, g) { return g ? nomeDi(X, g.rid || g.id) : null; }
  function passoBJ(v, X) {
    var k = (v.giro || 0) + "|" + v.fase + "|" + v.turno;
    if (v.fase === "punta") (v.giocatori || []).forEach(function (g) { var n = nomeSeat(X, g); if (n && !g.via && !g.puntata && g.fiches > 0 && !X.fatti[k + n]) { if (manda(X, n, { t: "mossa", kind: "punta", val: 100 })) X.fatti[k + n] = 1; } });
    else if (v.fase === "assic") (v.giocatori || []).forEach(function (g) { var n = nomeSeat(X, g); if (n && !X.fatti[k + n]) { if (manda(X, n, { t: "mossa", kind: "assic", si: false })) X.fatti[k + n] = 1; } });
    else if (v.fase === "gioca") { var g = (v.giocatori || [])[v.turno], n = nomeSeat(X, g); if (n && !X.fatti[k + n + g.attiva]) { if (manda(X, n, { t: "mossa", kind: "azione", mossa: "stai" })) X.fatti[k + n + g.attiva] = 1; } }
    else if (v.fase === "esito") {
      var ke = "e" + (v.giro || 0); if (X.fatti[ke]) return;
      X.mani = (X.mani || 0) + (X.subentro ? 1 : 0); X.fatti[ke] = 1;
      var w = wTiene(X);
      setTimeout(function () { if ((X.mani || 0) >= 3) tocca(w, /Basta così|Classifica/); else tocca(w, /Nuova mano/); }, 1500);
    }
  }
  COPIONE.aggiungi(594, { nome: "Riserva · Black Jack: l'host si spegne a metà mano, Giulia tiene il tavolo fino alla classifica; poi l'host torna al suo posto", fai: function () {
    W.__nube = {};
    return provaRiserva({ gid: "blackjack", tessera: "Black Jack", torna: true, primaTel: spiaNube,
      dopo: async function (X, v) {   // le monete di Giulia nel suo profilo sono le sue (quelle del tavolo), mai quelle di Paky
        var g = (v.giocatori || []).filter(function (x) { return x.rid === X.ids.Giulia; })[0], nG = W.__nube.Giulia || {};
        if (!g) no("Giulia non è al tavolo");
        if (nG.fiches !== g.fiches) no("nel profilo di Giulia " + nG.fiches + " monete, al tavolo " + g.fiches);
        return "monete di Giulia giuste nel suo profilo (" + nG.fiches + ")";
      },
      prima: function (v) { return v.fase === "gioca"; }, passoPrima: passoBJ,
      passo: function (v, X) { X.subentro = true; passoBJ(v, X); },
      dentroPaky: function (v) { return (v.giocatori || []).some(function (g) { return g.rid === "host" && !g.via; }); }, maxMs: 300000 });
  } });

  // =====================================================================
  //  595 POKER (chi tocca lascia; 2 mani dopo il subentro, poi 🏁)
  // =====================================================================
  function passoPk(v, X) {
    if (v.fase !== "gioco") return;
    if (v.turno && v.stato !== "finemano") {
      var n = nomeDi(X, v.turno), k = "a" + v.n + v.stato + v.turno + v.daChiamare;
      if (n && !X.fatti[k]) { if (manda(X, n, { t: "azione", tipo: v.daChiamare > 0 ? "lascia" : "passa", tot: 0, n: v.n, st: v.stato, dc: v.daChiamare })) X.fatti[k] = 1; }
    }
    if (X.subentro && v.n >= (X.n0 || 0) + 2 && !X.fatti.fine) { if (tocca(wTiene(X), /🏁|Fine partita/)) X.fatti.fine = 1; }
  }
  COPIONE.aggiungi(595, { nome: "Riserva · Poker: l'host si spegne al suo turno o a quello di un amico, Giulia tiene il tavolo fino alla classifica", fai: function () {
    W.__nube = {};
    return provaRiserva({ gid: "poker", tessera: "Poker", primaTel: spiaNube,
      dopo: async function (X, v) {   // le monete di Giulia nel profilo: le sue fuori dal tavolo (0) più quelle del tavolo, mai quelle fuori di Paky (4.000)
        await W.dorme(2000);
        var nG = W.__nube.Giulia || {};
        if (!(nG.fiches < 3000)) no("nel profilo di Giulia " + nG.fiches + " monete: ci sono finite quelle di Paky");
        return "monete di Giulia nel suo profilo: " + nG.fiches;
      },
      quanti: function (v) { return (v.players || []).filter(function (p) { return !p.bot && !p.via; }).length; },
      prima: function (v) { return v.fase === "gioco" && !!v.turno && v.stato === "preflop"; },
      passo: function (v, X) { if (!X.subentro) { X.subentro = true; X.n0 = v.n; } passoPk(v, X); }, maxMs: 180000 });
  } });

  // =====================================================================
  //  596 SCOPA 2 VS 2 (una mano sola: la partita la segue la copia ricordata di chi tiene la partita)
  // =====================================================================
  function statoS2(X) { var r = ripresaDi(chiTiene(X)); return r && r.stato && r.stato.scopa2; }
  function passoS2(v, X) {
    var s = statoS2(X); if (!s || !s.st || s.st.fase !== "gioco" || s.st.presa) return;
    var tu = s.st.turno, mio = s.mio || 0, k = "t" + s.st.mazzo.length + "|" + s.st.mani.map(function (m) { return m.length; }).join(",") + "|" + tu;
    if (X.fatti[k]) return;
    if (tu === mio) {   // tocca a chi tiene la partita: dal suo schermo (una carta; se può prendere in più modi, le carte verdi)
      var w = wTiene(X), d = w.document;
      if (d.querySelector(".sc-mano-riga .sc-carta.sel")) { var verde = d.querySelector(".sc-terra .sc-carta.cap:not(.presel)"); if (verde) verde.click(); return; }
      var mano = d.querySelectorAll(".sc-mano-riga .sc-carta"); if (mano.length) mano[0].click();
      return;
    }
    var id = s.posti && s.posti[tu], n = id && nomeDi(X, id);
    if (n && s.st.mani[tu] && s.st.mani[tu].length && manda(X, n, { t: "gioca", carta: s.st.mani[tu][0].id, presa: null })) X.fatti[k] = 1;
  }
  COPIONE.aggiungi(596, { nome: "Riserva · Scopa 2 vs 2: l'host si spegne a metà mano, Giulia gioca dal suo posto e tiene la partita fino alla fine", fai: function () {
    return provaRiserva({ gid: "scopa2v2", tessera: "Scopa 2 vs 2", imp: { traguardo: 0 },
      quanti: function (v) { return v.t === "inCorso" ? 9 : (v.seggi || []).filter(Boolean).length; },
      prima: function (v, X) { var s = statoS2(X); return v.t === "inCorso" && !!(s && s.st && s.st.fase === "gioco" && !s.st.presa && s.st.mani.reduce(function (a, m) { return a + m.length; }, 0) <= 33); },
      passoPrima: passoS2,
      passo: passoS2, fine: function (v, X) { var s = statoS2(X); return !!(s && s.st && s.st.fase === "fine"); },
      dopo: async function (X) {
        var s = statoS2(X), gs = (s.posti || {})[s.mio];
        return "Giulia al posto " + s.mio + " (" + (s.st.nomi || {})[s.mio] + "), il posto di Paky: " + (s.st.nomi || {})[0];
      } });
  } });

  // =====================================================================
  //  597 PATATA BOLLENTE (la bomba scoppia da sola: 10 s, una vita)
  // =====================================================================
  function passoPt(v, X) {
    if (v.fase === "voto") {
      X.vivi.forEach(function (n) { var k = "v" + (v.round || 0) + n; if (!X.fatti[k] && n !== chiTiene(X)) { if (manda(X, n, { t: "vota", idx: 0 })) X.fatti[k] = 1; } });
      tocca(wTiene(X), /Via!/);
    }
  }
  COPIONE.aggiungi(597, { nome: "Riserva · Patata Bollente: l'host si spegne con la bomba in giro, Giulia porta avanti la partita fino alla classifica", fai: function () {
    return provaRiserva({ gid: "patata", tessera: "La Patata Bollente", imp: { tempo: 10, vite: 1 },
      comincia: async function (X) {
        var P = W.finestra("Paky");
        if (!await W.aspetta(function () { return W.clicca(P, /Comincia|Continua/); }, 4000)) no("l'host non ha «Comincia»");
        if (!await W.aspetta(function () { return vm(X.C).fase === "voto"; }, 15000)) no("non si vota la categoria");
        ["Giulia", "Luca", "Sara"].forEach(function (n) { W.reteDi(n).invia({ t: "vota", idx: 0 }); });
        await W.dorme(400);
        if (!await W.aspetta(function () { return W.clicca(P, /Via!/); }, 20000)) no("l'host non ha «Via!»");
      },
      prima: function (v) { return v.fase === "gioco"; }, passo: passoPt, maxMs: 180000 });
  } });

  // =====================================================================
  //  598 SCALINATA PICCOLA: chi guarda è il primo vice (t.vici). Sulla scala ci sono in 4 (Paky, Giulia, Luca, Sara),
  //  Marco arriva per quinto e guarda: quando Paky si spegne la partita la porta avanti Marco (che non gioca), gli altri
  //  salgono fino al podio; poi «Nuova partita» di Marco: lui è il primo della saletta (la corona) e sale sulla scala.
  // =====================================================================
  COPIONE.aggiungi(598, { nome: "Riserva · Scalinata piccola: chi guarda prende il posto dell'host sparito (t.vici) e porta avanti la salita", fai: function () {
    return provaRiserva({ gid: "scalinata", tessera: "La Scalinata", imp: { scala: "piccola" }, amici: ["Giulia", "Luca", "Sara", "Marco"], vice: "Marco",
      quanti: function (v) { return A.contaDentro(v) + (v.guarda || []).length; },
      prima: function (v) { return v.fase === "scelta" && v.nRound >= 2; }, passoPrima: passoSc, passo: passoSc, maxMs: 300000,
      dopo: async function (X, v) {
        if ((v.posti || []).some(function (p) { return p.id === X.ids.Marco; })) no("Marco guardava ma risulta sulla scala");
        // «Nuova partita» dal telefono di Marco: torna in saletta per primo (corona) e sale sulla scala
        var w = W.finestra("Marco");
        if (!await W.aspetta(function () { return W.clicca(w, /Nuova partita|Rivincita/); }, 6000)) no("Marco (tiene la partita) non ha «Nuova partita» («" + T(w).slice(0, 80) + "»)");
        var ok = await W.aspetta(function () { var x = vm(X.C); return x.fase === "lobby" && x.posti && x.posti[0] && x.posti[0].id === X.ids.Marco; }, 6000);
        if (!ok) no("nella saletta nuova Marco non è il primo (" + JSON.stringify((vm(X.C).posti || []).map(function (p) { return p.nome; })) + ", fase " + vm(X.C).fase + ")");
        var cor = await W.aspetta(function () { var f = [].filter.call(w.document.querySelectorAll(".sl-cor"), function (c) { return c.offsetParent !== null; }); return f.length === 1 && /Tu/.test(f[0].parentNode.textContent) ? f : null; }, 4000);
        if (!cor) no("nella saletta di Marco la corona 👑 non è sul suo avatar");
        return "Marco (guardava) ha tenuto la partita fino al podio; in saletta è il primo, con la corona";
      } });
  } });

  // =====================================================================
  //  599 NELLA SALA: Linea del tempo lanciata dalla Sala di Paky (3 telefoni). Paky si spegne a metà partita: Giulia porta
  //  avanti il gioco (6 s) e poi prende anche la Sala (gen 2) SENZA buttare il gioco; si arriva alla classifica, la partita
  //  conta una volta nella Classifica della serata di Giulia e tutti hanno i tasti di fine del core.
  // =====================================================================
  COPIONE.aggiungi(599, { nome: "Riserva nella Sala: Linea del tempo, l'host della Sala sparisce, Giulia tiene il gioco e la Sala fino alla classifica", fai: async function () {
    W.__partite = {};
    var amici = ["Giulia", "Luca"], nomi = ["Paky"].concat(amici), w = {};
    w.Paky = await W.apriTel("Paky", { x: 0, salaSempre: true, spiaR: true, prima: function (x) { x.__imp = { carte: 2 }; A.contaPartite("Paky")(x); } });
    var S = await A.apriSalaNuova("Paky");
    for (var i = 0; i < amici.length; i++) {
      var q = i + 2;
      w[amici[i]] = await W.apriTel(amici[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true, spiaR: true, prima: A.contaPartite(amici[i]) });
      if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === q; }, 10000)) no(amici[i] + " non entra nella Sala");
    }
    var C = await A.lanciaDallaSala("Paky", S, "La linea del tempo");
    if (!await W.aspetta(function () { return A.contaDentro(vm(C)) === 3; }, 10000)) no("nella Linea del tempo della Sala non sono in 3");
    var X = { gid: "timeline", C: C, ids: { Paky: "host", Giulia: A.mioId("Giulia"), Luca: A.mioId("Luca") }, vivi: nomi.slice(), fatti: {} };
    var pTl = function (v) { return passoTl(v, X); };
    if (!await W.aspetta(function () { return W.clicca(w.Paky, /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    await finche(X, function (v) { return v.fase === "turno" && v.n >= 2; }, pTl, 60000, "non si arriva al secondo turno");
    await W.dorme(1600);
    var sent = sentinella(amici), t0 = Date.now();
    A.muore("Paky"); X.vivi = amici.slice();
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === X.ids.Giulia; }, 9000)) no("dopo 9 s il gioco non lo tiene Giulia (" + JSON.stringify(A.chiTiene(C)) + ")");
    var dG = ((Date.now() - t0) / 1000).toFixed(1);
    await finche(X, function () { return (W.statoStanza(S) || {}).gen === 2; }, pTl, 35000, "la Sala non passa a Giulia");
    var dS = ((Date.now() - t0) / 1000).toFixed(1), s2 = W.statoStanza(S) || {};
    if (s2.stanza !== C || s2.gioco !== "timeline") no("la Sala di Giulia ha perso il gioco (stanza " + s2.stanza + ", gioco " + s2.gioco + ")");
    var p0 = (s2.torneo || {}).n || 0;
    await finche(X, function (v) { return v.fase === "fine"; }, pTl, 180000, "la partita tenuta da Giulia non arriva alla classifica");
    if (!await W.aspetta(function () { return (((W.statoStanza(S) || {}).torneo || {}).n || 0) === p0 + 1; }, 8000)) no("la partita non conta nella Classifica della serata di Giulia");
    await W.dorme(3000);
    if ((((W.statoStanza(S) || {}).torneo || {}).n || 0) !== p0 + 1) no("la partita conta più di una volta nella serata");
    var pt = W.__partite || {}; amici.forEach(function (n) { if (pt[n] !== 1) no("partite (XP) date: " + JSON.stringify(pt)); });
    if (!await W.aspetta(function () { return /Rivincita/.test(T(w.Giulia)) && /Ci sto|Torna in Sala/.test(T(w.Luca)); }, 8000)) no("a fine partita mancano i tasti del core («" + T(w.Giulia).slice(-80) + "» / «" + T(w.Luca).slice(-80) + "»)");
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "Giulia tiene il gioco in " + dG + " s e la Sala in " + dS + " s (gen 2) col gioco dentro; classifica, una partita nella serata, XP una volta, tasti di fine del core";
  } });

  // tutte in fila (o solo quelle della lista)
  COPIONE.gruppo5r = async function (lista) {
    var esiti = {};
    for (var n of (lista || [585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599])) esiti[n] = await COPIONE.prova(n);
    return esiti;
  };
})();

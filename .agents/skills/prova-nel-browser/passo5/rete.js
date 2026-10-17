// PROVE DELLA RETE del Passo 5 (pezzo p5-n, js/net.js): l'ufficio postale di riserva (il secondo broker).
// Scenari 520-529:
//   520 il primo ufficio è giù dall'inizio: host e 2 amici entrano col link e giocano a Tris (dentro entro 6 s);
//   521 il primo ufficio cade a metà della Linea del tempo: in meno di 20 s tutti di nuovo in partita, pillola
//       «📶 La rete è lenta: passo al collegamento di riserva…», niente «stanza chiusa»;
//   522 il primo ufficio è lento (4 s): nessun cambio inutile, nessuna pillola, si gioca come sempre;
//   523 solo l'host non arriva al primo ufficio: gli amici guardano in silenzio nel secondo, ci passano e giocano;
//   524 «Ho un codice» col primo ufficio giù: risponde in meno di 3 s col gioco giusto e si entra;
//   525 nessuna mossa doppia: un amico passa all'altro ufficio con mosse perse e mosse in coda → l'host le conta una volta;
//   526 RISERVA spenta (sg-riserva = "0"): un ufficio solo e le prove 3, 4, 5, 10, 19, 22 come prima;
//   527 Sala: il primo ufficio cade, la Sala e il Tris lanciato continuano;
//   528 l'host perde solo il primo ufficio a metà Tris («host sparito» lì): gli amici passano al secondo da soli;
//   529 sbirciata e «Ho un codice» guardano tutti e due gli uffici (viva se uno la dice viva; un ufficio giù non blocca).
// Uso (dopo copione-prova.js, da una pagina qualsiasi del sito):
//   await COPIONE.carica("passo5/rete.js"); await COPIONE.prova(520)
// Dai telefoni finti: giuBroker(n, si), lentoBroker(n, ms), statoStanza(cod, n), congela(nome, n), contaCollegamenti(nome, n),
// BR.riserva = false / apriTel(nome, { riserva: false }). L'ufficio 0 è HiveMQ (il primo), l'1 è EMQX (la riserva).
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = W.COPIONE.aiuti, T = A.T, TOP = "seratagiochi/v1/";
  var aggiungi = W.COPIONE.aggiungi.bind(W.COPIONE);
  function no(p) { throw new Error(p); }
  function U(n) { return W.BR.indirizzi[n]; }
  // la foto (vm) di una stanza sull'ufficio n
  function vmU(C, n) { var s = W.statoStanza(C, n); return (s && (s.vm || s)) || {}; }
  function pill(w) { return [].map.call(w.document.querySelectorAll(".sg-pillola"), function (x) { return x.textContent; }).join(" | "); }
  function dentro(w) { return /Sei dentro/.test(W.testo(w)); }
  // i collegamenti da ospite ancora aperti di un telefono (gioco e Sala)
  function reti(nome) { var w = W.finestra(nome); return ((w && w.__reti) || []).filter(function (h) { return !(h.stato && h.stato().chiusa); }); }
  function ufficioDi(nome) { var h = W.reteDi(nome); return h && h.stato ? h.stato().ufficio : null; }
  // spia: le pillole viste e le scritte brutte ("stanza chiusa", "Collegamento perso"…) su più telefoni
  function spia(nomi, brutte) {
    var viste = {}, male = [];
    var re = brutte || /stanza è chiusa|Sala è chiusa|Collegamento perso|Problema di collegamento|non risponde|è ferma/;
    var t = setInterval(function () {
      nomi.forEach(function (n) {
        var w = W.finestra(n); if (!w || !w.document || !w.document.body) return;
        [].forEach.call(w.document.querySelectorAll(".sg-pillola"), function (x) { viste[n + ": " + x.textContent] = (viste[n + ": " + x.textContent] || 0) + 1; });
        var tx = W.testo(w); if (re.test(tx) && male.length < 5) male.push(n + ": «" + (tx.match(re) || [""])[0] + "»");
      });
    }, 60);
    return { stop: function () { clearInterval(t); return { pillole: Object.keys(viste), male: male }; } };
  }
  function vistaPillola(r, re) { return r.pillole.filter(function (p) { return re.test(p); }); }
  // la pagina del telefono "in primo piano" (il cambio d'ufficio dopo 12 s si fa solo con l'app in vista)
  function inVista(w) { try { Object.defineProperty(w.document, "hidden", { configurable: true, get: function () { return false; } }); } catch (e) {} }
  // il nome del telefono che ha quell'id nella stanza
  function chiE(id, nomi) { for (var i = 0; i < nomi.length; i++) { var h = W.reteDi(nomi[i]); if (h && h.stato && h.stato().id === id) return nomi[i]; } return null; }
  // il Tris fino alla fine leggendo la foto sull'ufficio n: chi è di turno tocca la prima casella libera
  async function trisFino(C, n, host, amici) {
    var fino = Date.now() + 40000;
    while (Date.now() < fino && vmU(C, n).fase !== "fine") {
      var v = vmU(C, n), nome = v.turno === "X" ? host : chiE(v.avvId, amici), w = nome && W.finestra(nome);
      if (v.fase === "gioco" && w) {
        var celle = w.document.querySelectorAll(".tr-cella"), k = (v.board || []).indexOf(null), n0 = (v.board || []).filter(Boolean).length;
        if (k >= 0 && celle[k] && !celle[k].disabled) {
          celle[k].click();
          await W.aspetta(function () { return (vmU(C, n).board || []).filter(Boolean).length > n0 || vmU(C, n).fase === "fine"; }, 4000);
          continue;
        }
      }
      await W.dorme(120);
    }
    return vmU(C, n).fase === "fine";
  }
  // Paky apre il Tris (percorso di prima, «apro io la stanza») e gli amici entrano col link
  async function trisConAmici(amici, prima) {
    var P = await W.apriTel("Paky", { x: 0 });
    if (prima) await prima(P);
    var C = await W.apriStanza(P, "Tris"), w = {};
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], { hash: "gioco=tris&stanza=" + C, x: 185 * (i + 1) });
    return { P: P, C: C, w: w };
  }
  function erroriVuoti() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }

  // ---------- 520 primo ufficio giù dall'inizio ----------
  aggiungi(520, { nome: "Primo ufficio postale giù dall'inizio: si entra dal secondo e si gioca a Tris", fai: async function () {
    W.giuBroker(0, true);
    var sp = spia(["Paky", "Giulia", "Luca"]);
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
    var t0 = Date.now();
    await W.apriTel("Giulia", { hash: "gioco=tris&stanza=" + C, x: 185 });
    await W.apriTel("Luca", { hash: "gioco=tris&stanza=" + C, x: 370 });
    var ok = await W.aspetta(function () {
      // (nel Tris giocano in due: uno è dentro, l'altro guarda; tutti e due sentono l'host dal vivo dal secondo ufficio)
      var st = ["Giulia", "Luca"].map(function (n) { var h = W.reteDi(n); return h && h.stato(); });
      return vmU(C, 1).avvId && st.every(function (s) { return s && s.vivo && !s.ferma && s.ufficio === U(1); }) && st.some(function (s) { return s.dentro; });
    }, 9000);
    var dt = (Date.now() - t0) / 1000;
    if (!ok) no("non sono entrati dal secondo ufficio: " + ["Giulia", "Luca"].map(function (n) { var h = W.reteDi(n); return n + " " + JSON.stringify(h && h.stato()); }).join(" · "));
    if (dt > 6.5) no("dentro dopo " + dt.toFixed(1) + " s (aperti uno dopo l'altro: deve bastare meno di 6 s a testa)");
    if (W.statoStanza(C, 0)) no("sul primo ufficio (giù) c'è una foto");
    var gioca = W.reteDi("Giulia").stato().dentro ? "Giulia" : "Luca";
    if (W.finestra(gioca).SGNet.broker() !== U(1)) no("SGNet.broker() di " + gioca + ": " + W.finestra(gioca).SGNet.broker());
    var sb = JSON.parse(W.BR.mem[gioca].l["sg-broker"] || "null");
    if (!sb || sb.url !== U(1)) no(gioca + " non ricorda l'ufficio buono (sg-broker " + JSON.stringify(sb) + ")");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vmU(C, 1).fase === "gioco"; }, 5000)) no("il Tris non comincia");
    if (!await trisFino(C, 1, "Paky", ["Giulia", "Luca"])) no("il Tris non arriva alla fine (fase " + vmU(C, 1).fase + ")");
    var r = sp.stop();
    if (r.male.length) no("scritte sbagliate: " + r.male.join(" · "));
    if (vistaPillola(r, /Mi ricollego/).length) no("pillola «Mi ricollego» con il secondo ufficio buono: " + vistaPillola(r, /Mi ricollego/).join(" · "));
    erroriVuoti();
    return "Giulia e Luca dentro in " + dt.toFixed(1) + " s dal secondo ufficio, Tris finito (" + (vmU(C, 1).fine ? "vince " + vmU(C, 1).fine.vincitore : "") + "), nessun «Mi ricollego»";
  } });

  // ---------- 521 il primo ufficio cade a metà della Linea del tempo ----------
  aggiungi(521, { nome: "Il primo ufficio cade a metà della Linea del tempo: tutti di nuovo in partita in meno di 20 s", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La linea del tempo");
    var G = await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185 }), L = await W.apriTel("Luca", { hash: "gioco=timeline&stanza=" + C, x: 370 });
    inVista(G); inVista(L);
    if (!await W.aspetta(function () { return (vmU(C, 0).giocatori || []).length === 3; }, 8000)) no("non sono entrati in 3");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vmU(C, 0).fase === "turno"; }, 20000)) no("la partita non comincia (fase " + vmU(C, 0).fase + ")");
    var sp = spia(["Paky", "Giulia", "Luca"], /stanza è chiusa|Collegamento perso|Problema di collegamento/);
    var t0 = Date.now();
    W.giuBroker(0, true);
    var ok = await W.aspetta(function () {
      return ["Giulia", "Luca"].every(function (n) { var h = W.reteDi(n); return h && h.stato().ufficio === U(1) && h.stato().dentro && !h.stato().ferma; });
    }, 20000, 200);
    var dt = (Date.now() - t0) / 1000;
    if (!ok) no("dopo 20 s non sono passati al secondo ufficio: " + ["Giulia", "Luca"].map(function (n) { var h = W.reteDi(n); return n + " " + JSON.stringify(h && h.stato()); }).join(" · "));
    // la partita va avanti sul secondo ufficio: chi è di turno gioca e la foto cambia
    var v0 = vmU(C, 1), k0 = v0.fase + "|" + v0.turnoId + "|" + (v0.carta ? v0.carta.titolo : "");
    var idG = A.mioId("Giulia"), idL = A.mioId("Luca"), fino = Date.now() + 25000, mosso = false;
    while (Date.now() < fino && !mosso) {
      var v = vmU(C, 1), k = v.fase + "|" + v.turnoId + "|" + (v.carta ? v.carta.titolo : "");
      if (k !== k0) { mosso = true; break; }
      if (v.fase === "turno" && v.turnoId === "host") { var slot = P.document.querySelector(".tl-slot"); if (slot) { slot.click(); await W.dorme(150); var conf = P.document.querySelector(".tl-conferma"); if (conf && !conf.disabled) conf.click(); } }
      else if (v.fase === "turno" && (v.turnoId === idG || v.turnoId === idL)) W.reteDi(v.turnoId === idG ? "Giulia" : "Luca").invia({ t: "scelta", gap: 0 });
      else if (v.fase === "esito") W.clicca(P, /Avanti/);
      await W.dorme(400);
    }
    var r = sp.stop();
    if (!mosso) no("dopo il cambio d'ufficio la partita non va avanti (fase " + vmU(C, 1).fase + ")");
    if (r.male.length) no("scritte sbagliate: " + r.male.join(" · "));
    var pr = r.pillole.filter(function (p) { return /collegamento di riserva/.test(p); });
    if (!pr.some(function (p) { return /^Giulia/.test(p); }) || !pr.some(function (p) { return /^Luca/.test(p); })) no("pillola «collegamento di riserva»: " + (pr.join(" · ") || "mai vista"));
    if (vistaPillola(r, /^Paky: .*Mi ricollego/).length) no("l'host (ancora sul secondo ufficio) mostra «Mi ricollego»");
    erroriVuoti();
    return "passati al secondo ufficio in " + dt.toFixed(1) + " s, la partita continua (" + k0 + " → " + vmU(C, 1).fase + "), pillola vista da Giulia e Luca";
  } });

  // ---------- 522 primo ufficio lento ----------
  aggiungi(522, { nome: "Primo ufficio lento (4 s a collegarsi): nessun cambio inutile, si gioca come sempre", fai: async function () {
    W.lentoBroker(0, 4000);
    try {
      var sp = spia(["Paky", "Giulia", "Luca"]);
      var o = await trisConAmici(["Giulia", "Luca"]), C = o.C, t0 = Date.now();
      // dentro: l'host è su tutti e due, gli amici su quello che risponde prima (anche il secondo va bene)
      if (!await W.aspetta(function () {   // (uno gioca, l'altro guarda)
        var st = ["Giulia", "Luca"].map(function (n) { var h = W.reteDi(n); return h && h.stato(); });
        return st.every(function (s) { return s && s.vivo && !s.ferma; }) && st.some(function (s) { return s.dentro; });
      }, 9000)) no("gli amici non entrano");
      var dt = (Date.now() - t0) / 1000, uff = ["Giulia", "Luca"].map(ufficioDi);
      var n = uff[0] === U(0) ? 0 : 1;
      var conti = ["Giulia", "Luca"].map(function (x) { return W.contaCollegamenti(x); });
      W.clicca(o.P, /Comincia/);
      if (!await W.aspetta(function () { return vmU(C, 1).fase === "gioco"; }, 6000)) no("il Tris non comincia");
      if (!await trisFino(C, 1, "Paky", ["Giulia", "Luca"])) no("il Tris non arriva alla fine");
      await W.dorme(13000);   // (più dei 12 s del cambio: non deve succedere niente)
      var dopo = ["Giulia", "Luca"].map(function (x) { return W.contaCollegamenti(x); });
      if (dopo.join() !== conti.join()) no("collegamenti nuovi dopo l'entrata (cambi inutili): " + conti.join() + " → " + dopo.join());
      if (["Giulia", "Luca"].map(ufficioDi).join() !== uff.join()) no("un amico ha cambiato ufficio: " + uff.join() + " → " + ["Giulia", "Luca"].map(ufficioDi).join());
      var r = sp.stop();
      if (r.male.length) no("scritte sbagliate: " + r.male.join(" · "));
      if (vistaPillola(r, /collegamento di riserva/).length) no("pillola del cambio d'ufficio senza motivo");
      erroriVuoti();
      return "dentro in " + dt.toFixed(1) + " s (uffici " + uff.map(function (u) { return BR.indirizzi.indexOf(u); }).join(",") + "), Tris finito, nessun cambio in 13 s, nessuna pillola (n " + n + ")";
    } finally { W.lentoBroker(0, 0); }
  } });

  // ---------- 523 solo l'host non arriva al primo ufficio ----------
  aggiungi(523, { nome: "Solo l'host non arriva al primo ufficio: gli amici passano al secondo e giocano", fai: async function () {
    var o = await trisConAmici([], function () { W.congela("Paky", 0); }), C = o.C, t0 = Date.now();
    var sp = spia(["Giulia", "Luca"]);
    await W.apriTel("Giulia", { hash: "gioco=tris&stanza=" + C, x: 185 }); await W.apriTel("Luca", { hash: "gioco=tris&stanza=" + C, x: 370 });
    var ok = await W.aspetta(function () {   // (uno gioca, l'altro guarda: tutti e due sentono l'host dal vivo dal secondo ufficio)
      var st = ["Giulia", "Luca"].map(function (n) { var h = W.reteDi(n); return h && h.stato(); });
      return st.every(function (s) { return s && s.vivo && !s.ferma && s.ufficio === U(1); }) && st.some(function (s) { return s.dentro; });
    }, 9000);
    var dt = (Date.now() - t0) / 1000;
    if (!ok) no("gli amici non passano al secondo ufficio: " + ["Giulia", "Luca"].map(function (n) { var h = W.reteDi(n); return n + " " + JSON.stringify(h && h.stato()); }).join(" · "));
    if (W.contaCollegamenti("Paky", 0) < 1 || W.viviDi("Paky", 0).some(function (c) { return !c.frozen; })) no("l'host arriva al primo ufficio (la prova non vale)");
    W.clicca(o.P, /Comincia/);
    if (!await W.aspetta(function () { return vmU(C, 1).fase === "gioco"; }, 5000)) no("il Tris non comincia");
    if (!await trisFino(C, 1, "Paky", ["Giulia", "Luca"])) no("il Tris non arriva alla fine");
    var r = sp.stop();
    if (r.male.length) no("scritte sbagliate: " + r.male.join(" · "));
    if (vistaPillola(r, /collegamento di riserva/).length) no("la pillola del cambio per rete giù (qui l'ufficio va: cambio in silenzio)");
    erroriVuoti();
    return "Giulia e Luca nel secondo ufficio in " + dt.toFixed(1) + " s (in silenzio, senza «non risponde»), Tris finito";
  } });

  // ---------- 524 «Ho un codice» col primo ufficio giù ----------
  aggiungi(524, { nome: "«Ho un codice» col primo ufficio giù: risponde in meno di 3 s col gioco giusto", fai: async function () {
    W.giuBroker(0, true);
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Tris");
    var M = await W.apriTel("Marco", { x: 185 });
    if (!await W.aspetta(function () { return W.statoStanza(C, 1) || (W.ufficio(1).retained[TOP + C + "/meta"]); }, 4000)) no("l'host non è sul secondo ufficio");
    // la rete da sola
    var t0 = Date.now(), r = await new Promise(function (ok) { M.SGNet.scopriGioco(C, function (g, i) { ok({ g: g, i: i }); }); }), dt = (Date.now() - t0) / 1000;
    if (r.g !== "tris" || r.i.ferma) no("scopriGioco: " + JSON.stringify(r));
    if (dt > 3) no("scopriGioco risponde dopo " + dt.toFixed(1) + " s");
    // dall'app: «Ho un codice» → dentro senza ricaricare
    M.__segno = 1;
    if (!W.clicca(M, /Ho un codice/)) no("in home non c'è «Ho un codice»");
    var inp = await W.aspetta(function () { return M.document.querySelector("input.codice-campo"); }, 3000);
    if (!inp) no("niente casella del codice");
    var t1 = Date.now(); inp.value = C; W.clicca(M, /Entra/);
    if (!await W.aspetta(function () { return dentro(M) && vmU(C, 1).avvId === A.mioId("Marco"); }, 8000)) no("con il codice Marco non entra (" + T(M).slice(0, 60) + ")");
    var dt2 = (Date.now() - t1) / 1000;
    if (!M.__segno) no("l'app si è ricaricata");
    erroriVuoti();
    return "scopriGioco: tris in " + dt.toFixed(1) + " s; dall'app Marco è dentro in " + dt2.toFixed(1) + " s";
  } });

  // ---------- 525 nessuna mossa doppia ----------
  aggiungi(525, { nome: "Nessuna mossa doppia: chi passa all'altro ufficio rimanda le ultime mosse, l'host le conta una volta", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), G = await W.apriTel("Giulia", { x: 185 });
    inVista(G);
    var mosse = [], addii = [], conn = 0;
    var h = P.SGNet.ospita("prova", { onConnesso: function () { conn++; }, onMsg: function (id, m) { if (m && m.t === "mossa") mosse.push(id + ":" + m.n); }, onAddio: function (id) { addii.push(id); } });
    if (!await W.aspetta(function () { return conn > 0 && h.uffici().every(function (u) { return u.pronto; }); }, 3000)) no("l'host non è pronto su tutti e due: " + JSON.stringify(h.uffici()));
    var C = h.codice, ev = [];
    var g = G.SGNet.entra(C, { onAperto: function () { ev.push("aperto"); }, onMsg: function () {} });
    if (!await W.aspetta(function () { return ev.length; }, 3000)) no("Giulia non si collega");
    g.invia({ t: "join", nome: "Giulia" });
    h.invia({ t: "vm", vm: { fase: "gioco", posti: [{ id: "host" }, { id: g.mioId }] } });
    if (!await W.aspetta(function () { return g.stato().dentro; }, 3000)) no("Giulia non è dentro");
    if (g.stato().ufficio !== U(0)) no("Giulia non parte dal primo ufficio");
    g.invia({ t: "mossa", n: 1 }); g.invia({ t: "mossa", n: 2 });
    if (!await W.aspetta(function () { return mosse.length === 2; }, 2000)) no("le prime due mosse non arrivano: " + mosse.join(","));
    // la rete verso il primo ufficio muore senza che il telefono lo sappia: 3 mosse partono e si perdono
    W.congela("Giulia", 0);
    g.invia({ t: "mossa", n: 3 }); g.invia({ t: "mossa", n: 4 }); g.invia({ t: "mossa", n: 5 });
    await W.dorme(300);
    if (mosse.length !== 2) no("le mosse perse sono arrivate lo stesso (la prova non vale)");
    // il telefono se ne accorge (il collegamento si chiude): le mosse dopo restano in coda
    W.viviDi("Giulia", 0).forEach(function (c) { c.sparisci(); });
    g.invia({ t: "mossa", n: 6 }); g.invia({ t: "mossa", n: 7 });
    var t0 = Date.now();
    if (!await W.aspetta(function () { return g.stato().ufficio === U(1); }, 16000, 200)) no("dopo 16 s Giulia non è passata al secondo ufficio (" + JSON.stringify(g.stato()) + ")");
    var dt = (Date.now() - t0) / 1000;
    if (dt < 10) no("è passata troppo presto (" + dt.toFixed(1) + " s: deve aspettare 12 s)");
    await W.aspetta(function () { return mosse.length >= 7; }, 3000);
    await W.dorme(600);
    var conta = {}; mosse.forEach(function (m) { conta[m] = (conta[m] || 0) + 1; });
    var doppie = Object.keys(conta).filter(function (k) { return conta[k] > 1; });
    if (doppie.length) no("mosse contate due volte: " + doppie.join(", ") + " (" + mosse.join(",") + ")");
    var mancano = [1, 2, 3, 4, 5, 6, 7].filter(function (k) { return !conta[g.mioId + ":" + k]; });
    if (mancano.length) no("mosse perse: " + mancano.join(",") + " (arrivate " + mosse.join(",") + ")");
    if (addii.length) no("l'host ha tolto Giulia: " + addii.join(","));
    var pr = /collegamento di riserva/.test(pill(G));
    h.chiudi(); g.chiudi();
    erroriVuoti();
    return "passata al secondo ufficio dopo " + dt.toFixed(1) + " s; 7 mosse, ognuna una volta (" + mosse.map(function (m) { return m.split(":")[1]; }).join(",") + ")" + (pr ? ", pillola vista" : "");
  } });

  // ---------- 526 RISERVA spenta ----------
  aggiungi(526, { nome: "Riserva spenta (sg-riserva = \"0\"): un ufficio solo e le prove 3, 4, 5, 10, 19, 22 come prima", fai: async function (opz) {
    var lista = (opz && opz.solo) || [3, 4, 5, 10, 19, 22], esiti = [];
    W.BR.riserva = false;
    try {
      var o = await trisConAmici(["Giulia"]);
      if (!await W.aspetta(function () { var h = W.reteDi("Giulia"); return h && h.stato().dentro; }, 6000)) no("con la riserva spenta Giulia non entra");
      var w = W.finestra("Giulia");
      if (w.SGNet.uffici().length !== 1 || w.SGNet.uffici()[0] !== U(0)) no("uffici con la riserva spenta: " + w.SGNet.uffici().join(", "));
      var altri = W.contaCollegamenti("Paky", 1) + W.contaCollegamenti("Giulia", 1);
      if (altri) no("con la riserva spenta ci sono " + altri + " collegamenti al secondo ufficio");
      for (var i = 0; i < lista.length; i++) esiti.push(await W.COPIONE.prova(lista[i]));
    } finally { W.BR.riserva = true; }
    var nonOk = esiti.filter(function (e) { return !/^\d+ OK/.test(e); });
    if (nonOk.length) no("con la riserva spenta: " + nonOk.join(" ‖ "));
    return "un ufficio solo; " + esiti.map(function (e) { return e.split(" · ")[0]; }).join(", ");
  } });

  // ---------- 527 Sala: il primo ufficio cade ----------
  aggiungi(527, { nome: "Sala: il primo ufficio cade, la Sala e il Tris lanciato continuano", fai: async function () {
    var o = await A.salaConAmici(["Giulia", "Luca"]), S = o.S;
    inVista(o.w.Giulia); inVista(o.w.Luca);
    var C = await A.lanciaDallaSala("Paky", S, "Tris");
    // (Tris in 2: chi gioca è dentro la stanza del Tris, l'altro guarda o aspetta nella Sala)
    var gioca = null;
    if (!await W.aspetta(function () { var id = vmU(C, 0).avvId; gioca = id && chiE(id, ["Giulia", "Luca"]); return gioca && W.reteDi(gioca).stato().dentro; }, 8000)) no("l'avversario non è nella saletta del Tris");
    var sp = spia(["Paky", "Giulia", "Luca"], /stanza è chiusa|Sala è chiusa|Collegamento perso|Problema di collegamento/);
    var t0 = Date.now();
    W.giuBroker(0, true);
    // tutti e due i collegamenti di ogni amico (Sala e Tris) passano al secondo ufficio
    var ok = await W.aspetta(function () {
      return ["Giulia", "Luca"].every(function (n) { var l = reti(n); return l.length >= (n === gioca ? 2 : 1) && l.every(function (h) { return h.stato().ufficio === U(1); }); });
    }, 22000, 200);
    var dt = (Date.now() - t0) / 1000;
    if (!ok) no("dopo 22 s: " + ["Giulia", "Luca"].map(function (n) { return n + " " + reti(n).map(function (h) { return (h.__sala ? "Sala " : "gioco ") + BR.indirizzi.indexOf(h.stato().ufficio); }).join("/"); }).join(" · "));
    if (!await W.aspetta(function () { return W.reteDi(gioca).stato().dentro; }, 4000)) no("nel Tris " + gioca + " non è di nuovo dentro");
    W.clicca(W.finestra("Paky"), /Comincia/);
    if (!await W.aspetta(function () { return vmU(C, 1).fase === "gioco"; }, 6000)) no("il Tris non comincia dopo il cambio d'ufficio (fase " + vmU(C, 1).fase + ")");
    if (!await trisFino(C, 1, "Paky", ["Giulia", "Luca"])) no("il Tris non arriva alla fine");
    // la Sala sul secondo ufficio sa che il gioco è finito (la foto della Sala arriva agli amici di lì)
    if (!await W.aspetta(function () { return vmU(S, 1).fase === "fine"; }, 6000)) no("la Sala sul secondo ufficio non dice «fine» (" + vmU(S, 1).fase + ")");
    var sale = ["Giulia", "Luca"].map(function (n) { return reti(n).filter(function (h) { return h.__sala; })[0]; });
    if (sale.some(function (h) { return !h || !h.stato().vivo || h.stato().ferma; })) no("la Sala degli amici non sente l'host: " + sale.map(function (h) { return JSON.stringify(h && h.stato()); }).join(" · "));
    var r = sp.stop();
    if (r.male.length) no("scritte sbagliate: " + r.male.join(" · "));
    erroriVuoti();
    return "Sala e Tris sul secondo ufficio in " + dt.toFixed(1) + " s, Tris finito, la Sala dice «fine» a tutti";
  } });

  // ---------- 528 l'host perde solo il primo ufficio ----------
  aggiungi(528, { nome: "L'host perde solo il primo ufficio a metà Tris: gli amici passano al secondo senza aspettare", fai: async function () {
    var o = await trisConAmici(["Giulia"]), C = o.C;
    if (!await W.aspetta(function () { return vmU(C, 0).avvId; }, 6000)) no("Giulia non entra");
    W.clicca(o.P, /Comincia/);
    if (!await W.aspetta(function () { return vmU(C, 0).fase === "gioco"; }, 4000)) no("il Tris non comincia");
    var sp = spia(["Giulia"], /stanza è chiusa|Collegamento perso|è ferma/);
    // il collegamento dell'host al primo ufficio muore (il broker manda il suo «host sparito») e non torna
    W.congela("Paky", 0);
    W.viviDi("Paky", 0).forEach(function (c) { c.sparisci(); });
    if (!W.statoStanza(C, 0) || W.statoStanza(C, 0).t !== "__hostgone") no("sul primo ufficio non c'è il testamento dell'host");
    var t0 = Date.now();
    if (!await W.aspetta(function () { var h = W.reteDi("Giulia"); return h && h.stato().ufficio === U(1) && h.stato().vivo; }, 5000)) no("Giulia non passa al secondo ufficio (" + JSON.stringify(W.reteDi("Giulia").stato()) + ")");
    var dt = (Date.now() - t0) / 1000;
    await W.dorme(800);
    if (/Aspettiamo l'host/.test(pill(o.w.Giulia))) no("Giulia aspetta ancora l'host");
    if (!await trisFino(C, 1, "Paky", ["Giulia"])) no("il Tris non arriva alla fine");
    var r = sp.stop();
    if (r.male.length) no("scritte sbagliate: " + r.male.join(" · "));
    erroriVuoti();
    return "Giulia nel secondo ufficio " + dt.toFixed(1) + " s dopo l'«host sparito» del primo, Tris finito";
  } });

  // ---------- 529 sbirciata e scopriGioco su tutti e due ----------
  aggiungi(529, { nome: "Sbirciata e «Ho un codice» su tutti e due gli uffici: viva se uno la dice viva, un ufficio giù non blocca", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), G = await W.apriTel("Giulia", { x: 185 });
    var conn = 0, h = P.SGNet.ospita("tris", { onConnesso: function () { conn++; } }, { testamento: { g: 2 } });
    if (!await W.aspetta(function () { return conn && h.uffici().every(function (u) { return u.pronto; }); }, 3000)) no("l'host non è pronto");
    var A1 = h.codice; h.invia({ t: "sala", gen: 2, membri: [] });
    // sul primo ufficio una foto vecchia di «host sparito» (l'host ha perso solo quello): conta il secondo, dove è viva
    var regia = W.creaClient("Regia", {});
    await W.aspetta(function () { return regia.connected && W.statoStanza(A1, 1); }, 2000);
    regia.publish(TOP + A1 + "/stato", JSON.stringify({ t: "__hostgone", s: h.sessione, g: 2 }), { retain: true });
    var V = G.SGNet.nuovoCodice(), c0 = (W.BR.perNome.Giulia || []).length, t0 = Date.now();
    var es = await new Promise(function (r) { G.SGNet.sbircia([A1, V], r); }), dt = Date.now() - t0;
    if (es[A1].stato !== "viva" || es[A1].gen !== 2) no("ferma sul primo e viva sul secondo: " + JSON.stringify(es[A1]));
    if (es[V].stato !== "vuota") no("stanza vuota: " + JSON.stringify(es[V]));
    if (dt > 2500) no("sbirciata lenta: " + dt + " ms");
    var g1 = await new Promise(function (r) { G.SGNet.scopriGioco(A1, function (g, i) { r({ g: g, i: i }); }); });
    if (g1.g !== "tris" || g1.i.ferma) no("scopriGioco con l'host vivo solo sul secondo: " + JSON.stringify(g1));
    // il primo ufficio giù: la sbirciata risponde lo stesso (non aspetta i 6 s)
    W.giuBroker(0, true);
    var t1 = Date.now(), es2 = await new Promise(function (r) { G.SGNet.sbircia([A1, V], r); }), dt2 = Date.now() - t1;
    if (es2[A1].stato !== "viva" || es2[V].stato !== "vuota") no("col primo giù: " + JSON.stringify(es2));
    if (dt2 > 3000) no("col primo giù la sbirciata ci mette " + dt2 + " ms");
    var t2 = Date.now(), g2 = await new Promise(function (r) { G.SGNet.scopriGioco(V, function (g, i) { r({ g: g, i: i }); }); }), dt3 = Date.now() - t2;
    if (g2.g !== null) no("codice che non c'è: " + JSON.stringify(g2));
    if (dt3 > 4500) no("codice che non c'è col primo giù: risposta dopo " + dt3 + " ms");
    // le due sbirciate e la scoperta: un collegamento per ufficio, tutti chiusi
    await W.dorme(100);
    var aperti = (W.BR.perNome.Giulia || []).slice(c0).filter(function (c) { return c.connected; }).length;
    if (aperti) no("restano " + aperti + " collegamenti aperti");
    W.giuBroker(0, false); h.chiudi(); regia.end();
    erroriVuoti();
    return "viva (secondo) batte ferma (primo) in " + dt + " ms; col primo giù: sbirciata in " + dt2 + " ms, codice inesistente in " + dt3 + " ms";
  } });
})();

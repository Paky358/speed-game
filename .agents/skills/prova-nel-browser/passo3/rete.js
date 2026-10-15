// PROVE DELLA RETE del Passo 3 (pezzo p3-n, js/net.js): 301 sbirciata, 302-303 "prima guardo, poi parlo",
// 304 seguire un host nuovo (anche con decideApp, la Sala), 305 testamento con la generazione, 306 ritorno dopo un buco
// con un altro che ha preso la stanza, 307 codici di 6 lettere, 308 un testamento di una sessione più nuova non "avvelena".
// Si provano le funzioni della rete direttamente sui telefoni finti (w.SGNet...), con una "regia" che scrive nel broker
// finto i messaggi di host inventati (sessioni scelte apposta: "più piccola", "più grande").
// Uso (dopo aver caricato copione-prova.js):
//   const r = await (await fetch("/.agents/skills/prova-nel-browser/passo3/rete.js?" + Date.now())).text(); (0, eval)(r);
//   await COPIONE.prova(301)   // … fino a 308
(function () {
  var W = window, TOP = "seratagiochi/v1/";
  function aggiungi(n, s) { if (W.COPIONE.aggiungi) W.COPIONE.aggiungi(n, s); else W.COPIONE.scenari[n] = s; }
  function no(p) { throw new Error(p); }
  function stato(C) { return W.statoStanza(C) || {}; }
  // un collegamento al broker finto che non è un telefono: scrive i messaggi degli host inventati
  async function regia() {
    var c = W.creaClient("Regia", {});
    await W.aspetta(function () { return c.connected; }, 1000);
    return {
      foto: function (C, m) { c.publish(TOP + C + "/stato", JSON.stringify(m), { retain: true }); },     // foto trattenuta (arriva dal vivo a chi c'è)
      vivo: function (C, m) { c.publish(TOP + C + "/stato", JSON.stringify(m), { retain: false }); }     // solo dal vivo ("ci sono", testamento)
    };
  }
  // quello che un telefono ha pubblicato da quando è cominciata la riga "da" del registro del broker
  function scritti(nome, da) { return W.BR.log.slice(da).filter(function (l) { return l.indexOf(nome + " → ") === 0; }); }
  // un host di prova su un telefono: aspetta che sia collegato (onConnesso)
  async function host(w, opz, cb) {
    var x = { conn: 0, occ: [] };
    cb = cb || {};
    var occ = cb.onOccupata;
    var h = w.SGNet.ospita("prova", Object.assign({}, cb, {
      onConnesso: function () { x.conn++; },
      onOccupata: function (m) { x.occ.push({ m: m, t: Date.now() }); return occ ? occ(m) : false; }
    }), opz || {});
    x.h = h;
    return x;
  }
  // un ospite di prova: registra quello che succede (ev) e chiama seguiHost quando la regola dell'app lo dice
  function ospite(w, C, opz, scegli) {
    var o = { ev: [] };
    o.h = w.SGNet.entra(C, {
      onAperto: function () { o.ev.push("aperto"); },
      onMsg: function (m) { o.ev.push("msg:" + (m && m._s)); if (scegli && m && m._s && scegli(m)) o.h.seguiHost(m._s); },
      onHostVia: function (v) { o.ev.push("via:" + v); },
      onHostNuovo: function (a, b, m) { o.ev.push("nuovo:" + (m && (m._s || m.s))); },
      onChiuso: function (p) { o.ev.push("chiuso:" + JSON.stringify(p)); }
    }, opz || {});
    return o;
  }
  function dopo(o, n) { return o.ev.slice(n); }
  // sessioni inventate: confronto di stringhe, Y "più piccola" di X, Z "più grande"
  var X = "m00000000xxx", Y = "k00000000yyy", Z = "z00000000zzz";

  // ---------- 301 Sbirciata ----------
  aggiungi(301, { nome: "Sbircia: viva, ferma, vuota (e boh) con un collegamento solo, senza «Mi ricollego…»", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), L = await W.apriTel("Luca", { x: 185 }), G = await W.apriTel("Giulia", { x: 370 });
    var hp = await host(P, {}), hl = await host(L, { testamento: { g: 4 } });
    if (!await W.aspetta(function () { return hp.conn && hl.conn; }, 3000)) no("gli host non si collegano");
    var A = hp.h.codice, B = hl.h.codice, V = G.SGNet.nuovoCodice();
    hp.h.invia({ t: "sala", gen: 2, membri: [] }); hl.h.invia({ t: "sala", gen: 4, membri: [] });
    if (!await W.aspetta(function () { return stato(A).t === "sala" && stato(B).t === "sala"; }, 2000)) no("le foto non sono trattenute");
    W.spegni("Luca");
    if (stato(B).t !== "__hostgone" || stato(B).g !== 4) no("testamento di Luca: " + JSON.stringify(stato(B)));
    // la sbirciata da Giulia: un collegamento solo, che si chiude; nessun avviso di rete
    var reti = 0; G.addEventListener("sg-rete", function () { reti++; });
    var prima = (W.BR.perNome.Giulia || []).length, t0 = Date.now();
    var es = await new Promise(function (r) { G.SGNet.sbircia([A, B, V, A.toLowerCase(), " " + B + " "], r); });
    var dt = Date.now() - t0, nuovi = (W.BR.perNome.Giulia || []).slice(prima);
    if (Object.keys(es).length !== 3) no("codici nell'esito: " + Object.keys(es).join(","));
    if (es[A].stato !== "viva" || es[A].gen !== 2 || !es[A].msg || es[A].msg._s !== hp.h.sessione) no("Sala viva: " + JSON.stringify(es[A]));
    if (es[B].stato !== "ferma" || es[B].gen !== 4) no("Sala ferma: " + JSON.stringify(es[B]));
    if (es[V].stato !== "vuota" || es[V].msg !== null) no("stanza vuota: " + JSON.stringify(es[V]));
    if (dt > 2500) no("troppo lenta: " + dt + " ms");
    if (nuovi.length !== 1) no("collegamenti aperti: " + nuovi.length);
    await W.dorme(50);
    if (nuovi[0].connected) no("il collegamento della sbirciata resta aperto");
    // un codice solo che risponde subito: non aspetta i 400 ms
    var t1 = Date.now(), e1 = await new Promise(function (r) { G.SGNet.sbircia([A], r); }), dt1 = Date.now() - t1;
    if (e1[A].stato !== "viva" || dt1 > 300) no("un codice solo: " + e1[A].stato + " in " + dt1 + " ms");
    // al massimo 12 codici
    var tanti = [A]; for (var i = 0; i < 14; i++) tanti.push(G.SGNet.nuovoCodice());
    var e2 = await new Promise(function (r) { G.SGNet.sbircia(tanti, r); });
    if (Object.keys(e2).length !== 12 || e2[A].stato !== "viva") no("con 15 codici: " + Object.keys(e2).length);
    // il collegamento non arriva: "boh" dopo 6 s, ancora niente avvisi
    var fm = G.mqtt, vero = fm.connect;
    fm.connect = function () { return { on: function () { return this; }, subscribe: function () {}, publish: function () {}, end: function () {} }; };
    var t2 = Date.now(), e3;
    try { e3 = await new Promise(function (r) { G.SGNet.sbircia([A, V], r); }); } finally { fm.connect = vero; }
    var dt2 = Date.now() - t2;
    if (e3[A].stato !== "boh" || e3[V].stato !== "boh" || dt2 < 5500 || dt2 > 7000) no("senza collegamento: " + JSON.stringify(e3) + " in " + dt2 + " ms");
    var pi = [].map.call(G.document.querySelectorAll(".sg-pillola"), function (x) { return x.textContent; }).join(" | ");
    if (reti || /ricollego/i.test(pi)) no("avviso di rete sullo schermo (" + reti + " eventi, «" + pi + "»)");
    return "viva/ferma/vuota in " + dt + " ms, un codice solo in " + dt1 + " ms, 12 al massimo, boh in " + (dt2 / 1000).toFixed(1) + " s, nessun avviso";
  } });

  // ---------- 302 Prima guardo: la Sala viva di un altro ----------
  aggiungi(302, { nome: "guardaPrima: c'è la Sala viva di un altro → onOccupata, niente pubblicato (o pubblica se l'app dice sì)", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), G = await W.apriTel("Giulia", { x: 185 });
    var hp = await host(P, {});
    if (!await W.aspetta(function () { return hp.conn; }, 3000)) no("Paky non si collega");
    var C = hp.h.codice;
    hp.h.invia({ t: "sala", gen: 1, membri: [] });
    if (!await W.aspetta(function () { return stato(C).t === "sala"; }, 2000)) no("la foto di Paky non è trattenuta");
    var trattenuto = W.BR.retained[TOP + C + "/stato"], da = W.BR.log.length, t0 = Date.now();
    var hg = await host(G, { codice: C, guardaPrima: 1200 });
    hg.h.invia({ t: "sala", gen: 1, io: "Giulia" });   // (va in coda: non parte finché guarda)
    await W.dorme(1500);
    if (hg.occ.length !== 1) no("onOccupata chiamata " + hg.occ.length + " volte");
    if (hg.occ[0].m._s !== hp.h.sessione || hg.occ[0].m.t !== "sala") no("onOccupata col messaggio sbagliato: " + JSON.stringify(hg.occ[0].m));
    var dec = hg.occ[0].t - t0;
    if (dec > 600) no("decide tardi: " + dec + " ms");
    var sc = scritti("Giulia", da);
    if (sc.length) no("Giulia ha pubblicato: " + sc.join(" / "));
    if (W.BR.retained[TOP + C + "/stato"] !== trattenuto) no("la foto di Paky è stata toccata");
    if (hg.conn) no("onConnesso è arrivato anche se la stanza era occupata");
    hg.h.lascia();
    // la mia Sala vince (l'app dice sì): si pubblica come sempre
    var da2 = W.BR.log.length;
    var hg2 = await host(G, { codice: C, guardaPrima: 1200 }, { onOccupata: function () { return true; } });
    hg2.h.invia({ t: "sala", gen: 2, io: "Giulia" });
    if (!await W.aspetta(function () { return stato(C)._s === hg2.h.sessione && stato(C).io === "Giulia"; }, 2000)) no("con onOccupata = sì non pubblica (" + JSON.stringify(stato(C)) + ")");
    if (hg2.occ.length !== 1 || !hg2.conn) no("onOccupata " + hg2.occ.length + ", onConnesso " + hg2.conn);
    if (!scritti("Giulia", da2).some(function (l) { return /__hostqui/.test(l); })) no("non ha detto «ci sono»");
    return "occupata decisa in " + dec + " ms, niente pubblicato, foto di Paky intatta; con sì pubblica";
  } });

  // ---------- 303 Prima guardo: stanza ferma, Sala morta che riapro, stanza vuota ----------
  aggiungi(303, { nome: "guardaPrima: «host sparito» di un altro, la Sala morta che riapro (sopra), stanza vuota → pubblica", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), L = await W.apriTel("Luca", { x: 185 }), G = await W.apriTel("Giulia", { x: 370 });
    var hl = await host(L, {}), hp = await host(P, {});
    if (!await W.aspetta(function () { return hl.conn && hp.conn; }, 3000)) no("gli host non si collegano");
    var C1 = hl.h.codice, C2 = hp.h.codice, C3 = G.SGNet.nuovoCodice();
    hl.h.invia({ t: "sala", gen: 1 }); hp.h.invia({ t: "sala", gen: 1 });
    await W.aspetta(function () { return stato(C1).t === "sala" && stato(C2).t === "sala"; }, 2000);
    W.spegni("Luca");                                     // C1: resta il testamento di Luca
    var sP = hp.h.sessione; hp.h.lascia();                // C2: Paky esce in silenzio, resta la sua foto (Sala "morta")
    await W.dorme(100);
    if (stato(C1).t !== "__hostgone" || stato(C2)._s !== sP) no("preparazione: " + JSON.stringify([stato(C1), stato(C2)]));
    var t0 = Date.now();
    var a = await host(G, { codice: C1, guardaPrima: 1200 }), b = await host(G, { codice: C2, guardaPrima: 1200, sopra: sP }), c = await host(G, { codice: C3, guardaPrima: 1200 });
    a.h.invia({ t: "sala", gen: 2 }); b.h.invia({ t: "sala", gen: 2 }); c.h.invia({ t: "sala", gen: 1 });
    var ok = await W.aspetta(function () { return stato(C1)._s === a.h.sessione && stato(C2)._s === b.h.sessione && stato(C3)._s === c.h.sessione && a.conn && b.conn && c.conn; }, 2500);
    var dt = Date.now() - t0;
    if (!ok) no("non pubblica: " + JSON.stringify({ C1: stato(C1), C2: stato(C2), C3: stato(C3), conn: [a.conn, b.conn, c.conn] }));
    if (a.occ.length || b.occ.length || c.occ.length) no("onOccupata chiamata a torto");
    return "pubblica su stanza ferma, Sala morta (sopra) e stanza vuota in " + dt + " ms";
  } });

  // ---------- 304 seguiHost ----------
  aggiungi(304, { nome: "seguiHost: seguo un host nuovo «più piccolo», quello di prima non conta più; decideApp (la Sala)", fai: async function () {
    var G = await W.apriTel("Giulia", { x: 0 }), L = await W.apriTel("Luca", { x: 185 }), R = await regia();
    var K = G.SGNet.nuovoCodice(), K2 = G.SGNet.nuovoCodice();
    G.SGNet.ricordaId(K, "gGIU"); L.SGNet.ricordaId(K2, "gLUC");
    // --- senza decideApp (le stanze dei giochi) ---
    var o = ospite(G, K);
    if (!await W.aspetta(function () { return o.ev.indexOf("aperto") >= 0; }, 2000)) no("Giulia non si collega");
    o.h.invia({ t: "join", nome: "Giulia" });
    R.foto(K, { t: "sala", membri: ["host", "gGIU"], _s: X });
    if (!await W.aspetta(function () { var s = o.h.stato(); return s.dentro && s.sessione === X; }, 2000)) no("Giulia non è dentro la sessione X");
    R.foto(K, { t: "sala", membri: ["host"], _s: Y });   // un host nuovo con la sessione "più piccola"
    await W.dorme(80);
    if (o.h.stato().sessione !== X || o.ev.some(function (e) { return /^nuovo/.test(e); })) no("è passata da sola a Y: " + o.ev.join(","));
    var da = W.BR.log.length;
    o.h.seguiHost(Y);
    var st = o.h.stato();
    if (st.sessione !== Y || st.dentro) no("dopo seguiHost: " + JSON.stringify(st));
    await W.dorme(60);
    if (!scritti("Giulia", da).some(function (l) { return /azioni.*"join"/.test(l); })) no("dopo seguiHost non ripete «sono entrato»");
    // 304b: la sessione di prima (X, "più grande") non fa più niente
    var n = o.ev.length;
    R.foto(K, { t: "sala", membri: ["host", "gGIU"], _s: X }); R.vivo(K, { t: "__hostqui", s: X }); R.vivo(K, { t: "__hostgone", s: X });
    await W.dorme(100);
    if (dopo(o, n).length || o.h.stato().sessione !== Y) no("la sessione X conta ancora: " + dopo(o, n).join(","));
    R.foto(K, { t: "sala", membri: ["host", "gGIU"], _s: Y });
    if (!await W.aspetta(function () { return o.h.stato().dentro; }, 1500)) no("Y non mi mette dentro");
    // il testamento di Y arriva (non è "vecchio" rispetto a X)
    R.vivo(K, { t: "__hostgone", s: Y });
    if (!await W.aspetta(function () { return o.ev.indexOf("via:true") >= 0; }, 1000)) no("il testamento di Y non arriva: " + o.ev.join(","));
    // --- con decideApp (la Sala): la rete non cambia da sola, decide l'app ---
    var segui = false;
    var q = ospite(L, K2, { decideApp: true }, function (m) { return segui && m._s === Z; });
    if (!await W.aspetta(function () { return q.ev.indexOf("aperto") >= 0; }, 2000)) no("Luca non si collega");
    q.h.invia({ t: "join", nome: "Luca" });
    R.foto(K2, { t: "sala", membri: ["host", "gLUC"], _s: X });
    if (!await W.aspetta(function () { var s = q.h.stato(); return s.dentro && s.sessione === X; }, 2000)) no("Luca non è dentro X");
    var m0 = q.ev.length;
    R.foto(K2, { t: "sala", membri: ["host"], _s: Z }); R.vivo(K2, { t: "__hostqui", s: Z }); R.vivo(K2, { t: "__hostgone", s: Z }); R.vivo(K2, { t: "__hostgone", voluto: 1, s: Z });
    await W.dorme(100);
    var e1 = dopo(q, m0);
    if (e1.join(",") !== "msg:" + Z) no("decideApp, Sala Z che l'app non segue: " + e1.join(","));
    if (q.h.stato().sessione !== X || !q.h.stato().dentro) no("decideApp: è cambiata da sola: " + JSON.stringify(q.h.stato()));
    segui = true; m0 = q.ev.length;
    R.foto(K2, { t: "sala", membri: ["host", "gLUC"], _s: Z });
    await W.dorme(80);
    var e2 = dopo(q, m0);
    if (e2.join(",") !== "msg:" + Z + ",nuovo:" + Z) no("decideApp, l'app segue Z: " + e2.join(","));
    if (q.h.stato().sessione !== Z || !q.h.stato().dentro) no("dopo seguiHost(Z) da dentro onMsg: " + JSON.stringify(q.h.stato()));
    m0 = q.ev.length;
    R.foto(K2, { t: "sala", membri: ["host", "gLUC"], _s: X }); R.vivo(K2, { t: "__hostgone", s: X });
    await W.dorme(80);
    if (dopo(q, m0).length) no("decideApp: la Sala X lasciata conta ancora: " + dopo(q, m0).join(","));
    R.vivo(K2, { t: "__hostgone", s: Z });
    if (!await W.aspetta(function () { return q.ev.indexOf("via:true") >= 0; }, 1000)) no("decideApp: il testamento di Z non arriva");
    return "seguiHost(Y): ripete il join, X ignorata (304b), testamento di Y arrivato; decideApp: Z passata all'app, seguita solo quando l'app lo dice (con onHostNuovo e il messaggio)";
  } });

  // ---------- 305 Testamento con la generazione ----------
  aggiungi(305, { nome: "Testamento con campi in più: { t: \"__hostgone\", s, g: 3 }", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    var hp = await host(P, { testamento: { g: 3, t: "no", s: "no" } });
    if (!await W.aspetta(function () { return hp.conn; }, 3000)) no("Paky non si collega");
    hp.h.invia({ t: "sala", gen: 3 });
    await W.aspetta(function () { return stato(hp.h.codice).t === "sala"; }, 1000);
    W.spegni("Paky");
    var s = stato(hp.h.codice);
    if (s.t !== "__hostgone" || s.s !== hp.h.sessione || s.g !== 3 || Object.keys(s).length !== 3) no("testamento: " + JSON.stringify(s));
    // senza testamento: come prima
    var P2 = await W.apriTel("Pia", { x: 185 }), h2 = await host(P2, {});
    await W.aspetta(function () { return h2.conn; }, 3000);
    W.spegni("Pia");
    var s2 = stato(h2.h.codice);
    if (JSON.stringify(s2) !== JSON.stringify({ t: "__hostgone", s: h2.h.sessione })) no("testamento normale: " + JSON.stringify(s2));
    return JSON.stringify(s).replace(s.s, "…");
  } });

  // ---------- 306 Ritorno dopo un buco: un altro ha preso la stanza ----------
  aggiungi(306, { nome: "guardaRitorno: host spento, un altro apre la stessa stanza, l'host torna e non ripubblica", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), M = await W.apriTel("Marco", { x: 185 });
    var hp = await host(P, { guardaRitorno: 1200 }), hp2 = await host(P, { guardaRitorno: 1200 });
    var t0 = Date.now();
    if (!await W.aspetta(function () { return hp.conn && hp2.conn; }, 3000)) no("Paky non si collega");
    var primo = Date.now() - t0;   // (il primo collegamento non guarda: parte subito)
    var C = hp.h.codice, C2 = hp2.h.codice;
    hp.h.invia({ t: "sala", gen: 1 }); hp2.h.invia({ t: "sala", gen: 1, io: "Paky" });
    await W.aspetta(function () { return stato(C).t === "sala" && stato(C2).t === "sala"; }, 1000);
    if (hp.occ.length) no("al primo collegamento ha guardato");
    W.spegni("Paky");
    await W.dorme(1000);
    var hm = await host(M, { codice: C, guardaPrima: 1200 });
    hm.h.invia({ t: "sala", gen: 2, io: "Marco" });
    if (!await W.aspetta(function () { return stato(C)._s === hm.h.sessione; }, 2000)) no("Marco non prende la stanza ferma");
    await W.dorme(2000);
    var trattenuto = W.BR.retained[TOP + C + "/stato"], da = W.BR.log.length;
    W.riaccendi("Paky");
    await W.dorme(1500);
    if (hp.occ.length !== 1 || hp.occ[0].m._s !== hm.h.sessione) no("onOccupata: " + hp.occ.length);
    var sc = scritti("Paky", da), suC = sc.filter(function (l) { return l.indexOf("/" + C + "/") >= 0 || l.indexOf(" " + C + "/") >= 0; });
    if (suC.length) no("Paky ripubblica nella stanza di Marco: " + suC.join(" / "));
    if (W.BR.retained[TOP + C + "/stato"] !== trattenuto) no("la foto di Marco è stata coperta");
    hp.h.invia({ t: "sala", gen: 1, dopo: 1 });   // l'app non ha ancora chiuso: comunque niente esce
    await W.dorme(100);
    if (stato(C)._s !== hm.h.sessione) no("dopo aver ceduto invia pubblica ancora");
    // l'altra stanza di Paky, libera: al ritorno guarda, trova il suo testamento e rimette la sua foto
    if (!await W.aspetta(function () { return stato(C2)._s === hp2.h.sessione && stato(C2).io === "Paky"; }, 2000)) no("la stanza libera non torna com'era: " + JSON.stringify(stato(C2)));
    if (hp2.occ.length) no("onOccupata sulla stanza libera");
    return "primo collegamento in " + primo + " ms; al ritorno cede a Marco (niente pubblicato) e rimette la foto dove era libero";
  } });

  // ---------- 307 Codici di 6 lettere ----------
  aggiungi(307, { nome: "nuovoCodice(6): 6 lettere dall'alfabeto; senza numero 4", fai: async function () {
    var G = await W.apriTel("Giulia", { x: 0 }), alfa = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
    for (var i = 0; i < 200; i++) {
      var a = G.SGNet.nuovoCodice(6), b = G.SGNet.nuovoCodice(), c = G.SGNet.nuovoCodice(5);
      if (a.length !== 6 || !alfa.test(a)) no("nuovoCodice(6) = " + a);
      if (b.length !== 4 || !alfa.test(b)) no("nuovoCodice() = " + b);
      if (c.length !== 4) no("nuovoCodice(5) = " + c);
    }
    return "200 volte: 6 e 4 lettere giuste (es. " + G.SGNet.nuovoCodice(6) + ", " + G.SGNet.nuovoCodice() + ")";
  } });

  // ---------- 308 Testamento di una sessione più nuova ----------
  aggiungi(308, { nome: "Un «host sparito» di una sessione più nuova non avvelena: il testamento vero dopo arriva", fai: async function () {
    var G = await W.apriTel("Giulia", { x: 0 }), L = await W.apriTel("Luca", { x: 185 }), R = await regia();
    var K = G.SGNet.nuovoCodice(), K2 = G.SGNet.nuovoCodice();
    G.SGNet.ricordaId(K, "gGIU"); L.SGNet.ricordaId(K2, "gLUC");
    var o = ospite(G, K), q = ospite(L, K2, { decideApp: true });
    await W.aspetta(function () { return o.ev.indexOf("aperto") >= 0 && q.ev.indexOf("aperto") >= 0; }, 2000);
    o.h.invia({ t: "join", nome: "Giulia" }); q.h.invia({ t: "join", nome: "Luca" });
    R.foto(K, { t: "sala", membri: ["host", "gGIU"], _s: X }); R.foto(K2, { t: "sala", membri: ["host", "gLUC"], _s: X });
    if (!await W.aspetta(function () { return o.h.stato().dentro && q.h.stato().dentro; }, 2000)) no("non sono dentro");
    // un testamento di una sessione più nuova (un altro telefono che ha aperto un attimo la stessa stanza)
    R.vivo(K, { t: "__hostgone", s: Z }); R.vivo(K2, { t: "__hostgone", s: Z });
    await W.dorme(80);
    if (o.h.stato().sessione !== X || q.h.stato().sessione !== X) no("il testamento ha cambiato la sessione: " + o.h.stato().sessione + " / " + q.h.stato().sessione);
    if (q.ev.some(function (e) { return /^via/.test(e); })) no("decideApp: il testamento di un'altra sessione conta");
    // l'host vero c'è ancora, poi sparisce davvero
    R.foto(K, { t: "sala", membri: ["host", "gGIU"], _s: X, n: 2 }); R.foto(K2, { t: "sala", membri: ["host", "gLUC"], _s: X, n: 2 });
    await W.dorme(80);
    var n = o.ev.length, n2 = q.ev.length;
    R.vivo(K, { t: "__hostgone", s: X }); R.vivo(K2, { t: "__hostgone", s: X });
    await W.dorme(80);
    if (dopo(o, n).indexOf("via:true") < 0) no("il testamento vero è stato scartato (" + o.ev.join(",") + ")");
    if (dopo(q, n2).indexOf("via:true") < 0) no("decideApp: il testamento vero è stato scartato (" + q.ev.join(",") + ")");
    return "sessione rimasta X, il testamento vero arriva (stanza di gioco: " + o.ev.filter(function (e) { return /^via/.test(e); }).join(",") + "; Sala: " + q.ev.filter(function (e) { return /^via/.test(e); }).join(",") + ")";
  } });
})();

// PROVE DEGLI AMICI ONLINE del Passo 6 (scenari 655-660).
// 655 (pezzo p6-n, js/net.js): la presenza sul broker, provata direttamente con SGNet.impronta e SGNet.presenza
// sui telefoni finti (pallino verde, testamento, invito trattenuto, risposta, invito tolto).
// 656-660 (pezzo p6-p, js/amici-online.js) si aggiungono in fondo a questo file.
// Uso (dopo aver caricato copione-prova.js):
//   const a = await (await fetch("/.agents/skills/prova-nel-browser/passo6/amici.js?" + Date.now())).text(); (0, eval)(a);
//   await COPIONE.prova(655)
(function () {
  var W = window, TOP = "seratagiochi/v1/u/";
  function aggiungi(n, s) { if (W.COPIONE.aggiungi) W.COPIONE.aggiungi(n, s); else W.COPIONE.scenari[n] = s; }
  function no(p) { throw new Error(p); }
  // una presenza su un telefono finto, che registra tutto quello che riceve
  function presenzaDi(w, h, stato) {
    var x = { amici: [], inviti: [], msg: [] };
    x.p = w.SGNet.presenza({ h: h, stato: stato || "app" }, {
      onAmico: function (hh, d) { x.amici.push({ h: hh, d: d }); },
      onInvito: function (d) { x.inviti.push(d); },
      onMsg: function (d) { x.msg.push(d); }
    });
    return x;
  }
  // l'ultimo stato ricevuto di un amico
  function ultimo(x, h) { var a = x.amici.filter(function (e) { return e.h === h; }).pop(); return a ? a.d : null; }
  // quello che c'è scritto (trattenuto) nel broker finto per un'impronta
  function scritto(h, cosa) { var v = W.BR.retained[TOP + h + "/" + cosa]; try { return v == null ? null : JSON.parse(v); } catch (e) { return v; } }
  W.COPIONE_AMICI = { presenzaDi: presenzaDi, ultimo: ultimo, scritto: scritto };   // (servono anche a 656-660)

  // ---------- 655 Presenza a due ----------
  aggiungi(655, { nome: "Presenza a due: pallino verde, testamento, invito trattenuto, risposta, invito tolto", fai: async function () {
    var A = await W.apriTel("Paky", { x: 0 }), B = await W.apriTel("Giulia", { x: 185 });
    // l'impronta: FNV-1a a 64 bit (valori ufficiali di prova), 12 caratteri, sempre uguale, diversa per uid diversi
    var imp = A.SGNet.impronta;
    function sei(x) { return ("000000" + (x % 2176782336).toString(36)).slice(-6); }
    [["", 0xcbf29ce4, 0x84222325], ["a", 0xaf63dc4c, 0x8601ec8c], ["foobar", 0x85944171, 0xf73967e8]].forEach(function (v) {
      if (imp(v[0]) !== sei(v[1]) + sei(v[2])) no("impronta di '" + v[0] + "' sbagliata: " + imp(v[0]));
    });
    var hA = imp("finto-Paky"), hB = imp("finto-Giulia");
    if (!/^[0-9a-z]{12}$/.test(hA) || !/^[0-9a-z]{12}$/.test(hB)) no("impronte non di 12 caratteri: " + hA + " " + hB);
    if (B.SGNet.impronta("finto-Paky") !== hA) no("la stessa impronta cambia da un telefono all'altro");
    if (hA === hB || imp("finto-paky") === hA) no("impronte uguali per uid diversi");
    if (!/^[0-9a-z]{12}$/.test(imp("ü😀 uid strano"))) no("impronta di un uid con lettere strane");
    // nessun "📶 Mi ricollego…" per tutta la prova
    var rete = [];
    [A, B].forEach(function (w) { w.addEventListener("sg-rete", function (e) { rete.push(e.detail); }); });
    if (A.SGNet.presenza({ h: "+#" }, {}) !== null) no("presenza con un'impronta sbagliata");

    // A segue B (con doppioni, un'impronta sbagliata e sé stesso: contano solo quelle buone)
    var pa = presenzaDi(A, hA);
    if (!await W.aspetta(function () { return pa.p.collegata(); }, 3000)) no("la presenza di Paky non si collega");
    pa.p.segui([hB, hB, "+#", hA]);
    if (ultimo(pa, hB)) no("Paky vede Giulia prima che lei si colleghi");
    if ((scritto(hA, "on") || {}).on !== 1) no("Paky non ha scritto che c'è: " + JSON.stringify(scritto(hA, "on")));
    // B si collega → A la vede
    var pb = presenzaDi(B, hB, "app");
    if (!await W.aspetta(function () { return (ultimo(pa, hB) || {}).on === 1; }, 2000)) no("Paky non vede Giulia online");
    var d = ultimo(pa, hB); if (d.s !== "app" || !(d.t > 0)) no("stato di Giulia: " + JSON.stringify(d));

    // stato: ripubblica solo se cambia
    var n0 = W.BR.log.length;
    pb.p.stato("app");
    pb.p.stato("sala");
    if (!await W.aspetta(function () { return (ultimo(pa, hB) || {}).s === "sala"; }, 2000)) no("Paky non vede Giulia nella Sala");
    var scritte = W.BR.log.slice(n0).filter(function (l) { return l.indexOf("Giulia → u/" + hB + "/on") === 0; }).length;
    if (scritte !== 1) no("Giulia ha ripubblicato il suo stato " + scritte + " volte (doveva 1)");

    // B si spegne → A riceve il testamento { on: 0 }
    W.spegni("Giulia");
    if (!await W.aspetta(function () { return (ultimo(pa, hB) || {}).on === 0; }, 2000)) no("spenta, Giulia risulta ancora online");
    if ((scritto(hB, "on") || {}).on !== 0) no("il testamento non è trattenuto");

    // A invita B mentre è spenta: l'invito resta scritto
    var inv = { id: "inv1", da: hA, nome: "Paky", om: null, sala: "KFRT", gioco: "", t: Date.now() };
    if (pa.p.invita(hB, inv) !== true) no("l'invito non è partito");
    if ((scritto(hB, "inv") || {}).id !== "inv1") no("l'invito non è trattenuto");
    if (pa.p.invita("+#", inv) !== false) no("invito a un'impronta sbagliata");
    // B si riaccende → di nuovo online (stesso stato) e trova l'invito, una volta sola
    W.riaccendi("Giulia");
    if (!await W.aspetta(function () { var x = ultimo(pa, hB) || {}; return x.on === 1 && x.s === "sala"; }, 2000)) no("riaccesa, Paky non la vede di nuovo nella Sala");
    if (!await W.aspetta(function () { return pb.inviti.length; }, 2000)) no("riaccendendosi Giulia non trova l'invito");
    if (pb.inviti[0].id !== "inv1" || pb.inviti[0].sala !== "KFRT") no("invito trovato: " + JSON.stringify(pb.inviti[0]));
    await W.dorme(300);
    if (pb.inviti.length !== 1) no("l'invito è arrivato " + pb.inviti.length + " volte");

    // la risposta (non trattenuta) arriva a Paky
    pb.p.rispondi(hA, { t: "risposta", id: "inv1", si: true, nome: "Giulia" });
    if (!await W.aspetta(function () { return pa.msg.length; }, 2000)) no("la risposta non arriva a Paky");
    if (!pa.msg[0].si || pa.msg[0].id !== "inv1") no("risposta: " + JSON.stringify(pa.msg[0]));
    if (W.BR.retained[TOP + hA + "/msg"] != null) no("la risposta è rimasta trattenuta");

    // B toglie l'invito → un terzo che si iscrive non trova più niente
    pb.p.togliInvito();
    await W.dorme(100);
    if (W.BR.retained[TOP + hB + "/inv"] != null) no("l'invito è ancora trattenuto");
    var terzo = W.creaClient("Terzo", {}), visti = [];
    await W.aspetta(function () { return terzo.connected; }, 1000);
    terzo.on("message", function (t, p) { visti.push(t + " " + p.toString()); });
    terzo.subscribe(TOP + hB + "/inv");
    await W.dorme(300);
    if (visti.length) no("il terzo trova ancora: " + visti.join(" / "));

    // nascondi: per Paky Giulia non c'è, poi torna
    pb.p.nascondi(true);
    if (!await W.aspetta(function () { return (ultimo(pa, hB) || {}).on === 0; }, 2000)) no("nascosta, Paky la vede ancora");
    pb.p.stato("gioco");   // (nascosta: lo stato si ricorda ma non si pubblica)
    await W.dorme(150);
    if ((ultimo(pa, hB) || {}).on !== 0) no("nascosta, il cambio di stato la fa vedere");
    pb.p.nascondi(false);
    if (!await W.aspetta(function () { var x = ultimo(pa, hB) || {}; return x.on === 1 && x.s === "gioco"; }, 2000)) no("tornata visibile, Paky non la vede (o stato sbagliato)");
    // nascosta riceve lo stesso gli inviti
    pb.p.nascondi(true);
    pa.p.invita(hB, { id: "inv2", da: hA, nome: "Paky", sala: "KFRT", t: Date.now() });
    if (!await W.aspetta(function () { return pb.inviti.length === 2; }, 2000)) no("nascosta, Giulia non riceve l'invito");
    pb.p.togliInvito(); pb.p.nascondi(false);
    await W.aspetta(function () { return (ultimo(pa, hB) || {}).on === 1; }, 2000);

    // il testamento di un collegamento vecchio arriva in ritardo: Giulia rimette il suo "on"
    terzo.publish(TOP + hB + "/on", '{"on":0}', { retain: true });
    if (!await W.aspetta(function () { return (scritto(hB, "on") || {}).on === 1; }, 2000)) no("dopo un testamento in ritardo Giulia resta offline");

    // non è una stanza: chiudiGiochi non la chiude
    B.SGNet.chiudiGiochi();
    await W.dorme(100);
    if (!pb.p.collegata()) no("chiudiGiochi ha chiuso la presenza");

    // segui con una lista diversa: le iscrizioni vecchie si tolgono
    pa.p.segui([]);
    var nA = pa.amici.length;
    pb.p.stato("app");
    await W.dorme(300);
    if (pa.amici.length !== nA) no("Paky riceve ancora Giulia dopo averla tolta");
    pa.p.segui([hB]);   // ri-seguita: ritrova subito lo stato trattenuto
    if (!await W.aspetta(function () { return pa.amici.length > nA && (ultimo(pa, hB) || {}).s === "app"; }, 2000)) no("ri-seguita, Paky non ritrova Giulia");
    // al massimo 200 amici seguiti
    var tante = [];
    for (var i = 0; i < 250; i++) tante.push(imp("finto-amico-" + i));
    pa.p.segui(tante);
    await W.dorme(100);
    var cliA = (W.BR.perNome.Paky || []).find(function (c) { return c.connected && c.subs.has(TOP + hA + "/inv"); });
    if (!cliA) no("non trovo il collegamento della presenza di Paky");
    var amiciSeguiti = [].filter.call(Array.from(cliA.subs), function (t) { return /\/on$/.test(t) && t !== TOP + hA + "/on"; }).length;
    if (amiciSeguiti !== 200) no("amici seguiti: " + amiciSeguiti + " (dovevano essere 200)");
    if (cliA.opts.keepalive !== 60 || cliA.opts.reconnectPeriod !== 5000 || !cliA.opts.will || !cliA.opts.will.retain) no("collegamento: " + JSON.stringify({ k: cliA.opts.keepalive, r: cliA.opts.reconnectPeriod, w: cliA.opts.will }));
    var colA = (W.BR.perNome.Paky || []).filter(function (c) { return c.connected; }).length;

    // chiudi: per gli amici non c'è più, uscita educata
    pb.p.chiudi(); pa.p.chiudi();
    await W.dorme(100);
    if ((scritto(hB, "on") || {}).on !== 0 || !((scritto(hB, "on") || {}).t > 0)) no("chiusa, Giulia risulta ancora online: " + JSON.stringify(scritto(hB, "on")));
    if ((W.BR.perNome.Giulia || []).some(function (c) { return c.connected; })) no("dopo chiudi Giulia ha ancora collegamenti aperti");
    if (rete.length) no("è comparso «Mi ricollego…»: " + JSON.stringify(rete));
    return "impronte " + hA + "/" + hB + ", collegamenti di Paky: " + colA + ", 200 amici su 250";
  } });
})();

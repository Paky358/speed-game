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

  // =================== 656-660: SGAmiciOnline (pezzo p6-p, js/amici-online.js) ===================
  // Il core non lo avvia ancora (lo farà p6-f): qui si chiama SGAmiciOnline.avvia() a mano dopo l'apertura del telefono.
  function imp(nome) { var w = W.finestra(Object.keys(W.BR.tel)[0]); return w.SGNet.impronta("finto-" + nome); }
  // un telefono con il profilo finto e i suoi amici (nomi): amici = ["Giulia"] → profilo.amici = ["finto-Giulia"]
  async function telAmici(nome, amici, x, opz) {
    return W.apriTel(nome, Object.assign({ x: x, profilo: { amici: (amici || []).map(function (n) { return "finto-" + n; }) } }, opz || {}));
  }
  // avvia gli amici online e aspetta che la presenza abbia scritto il suo stato
  async function avvia(w, nome) {
    if (w.SGAmiciOnline.avvia() !== true) no("SGAmiciOnline.avvia() non parte su " + nome);
    var h = w.SGNet.impronta("finto-" + nome);
    if (!await W.aspetta(function () { return scritto(h, "on"); }, 3000)) no("la presenza di " + nome + " non scrive niente");
  }
  function nomiOnline(w) { return w.SGAmiciOnline.online().map(function (x) { return x.nome + ":" + x.s; }).join(","); }
  // un motore audio finto che segna le note (i suoni veri sul computer di prova sono spenti)
  function audioNote(w) {
    var note = w.__note = [], t0 = Date.now();
    function par(v) { return { value: v, setValueAtTime: function (x) { this.value = x; return this; }, exponentialRampToValueAtTime: function () { return this; }, linearRampToValueAtTime: function () { return this; } }; }
    function nodo(o) { o = o || {}; o.connect = function () {}; o.disconnect = function () {}; return o; }
    function F() { this.state = "running"; this.destination = nodo(); Object.defineProperty(this, "currentTime", { get: function () { return (Date.now() - t0) / 1000; } }); }
    F.prototype.createOscillator = function () { var o = nodo({ type: "sine", frequency: par(440) }); o.start = function () { note.push(Math.round(o.frequency.value)); }; o.stop = function () {}; return o; };
    F.prototype.createGain = function () { return nodo({ gain: par(1) }); };
    F.prototype.createBiquadFilter = function () { return nodo({ type: "lowpass", frequency: par(1000), Q: par(1), gain: par(0) }); };
    F.prototype.createDynamicsCompressor = function () { return nodo({ threshold: par(0), ratio: par(1), knee: par(0), attack: par(0), release: par(0) }); };
    F.prototype.createBuffer = function (c, n) { return { getChannelData: function () { return new Float32Array(n); } }; };
    F.prototype.createBufferSource = function () { return nodo({ buffer: null, start: function () {}, stop: function () {} }); };
    F.prototype.resume = function () { return Promise.resolve(); };
    F.prototype.suspend = function () { return Promise.resolve(); };
    F.prototype.addEventListener = function () {};
    w.AudioContext = F; w.webkitAudioContext = F;
    w.__vibra = 0;
    try { w.navigator.vibrate = function () { w.__vibra++; return true; }; } catch (e) {}
  }
  // con la finestra del browser nascosta le animazioni restano al primo fotogramma: per misurare si tolgono
  function senzaAnimazioni(w) { if (w.document.getElementById("ao-ferme")) return; var s = w.document.createElement("style"); s.id = "ao-ferme"; s.textContent = ".ao-invito, .ao-mini{ animation:none !important; }"; w.document.head.appendChild(s); }
  function avviso(w) { var n = w.document.querySelector(".ao-invito"); return n && !n.classList.contains("via") ? n : null; }
  function rigaDi(w, nome) { return [].find.call(w.document.querySelectorAll(".ao-riga"), function (r) { return r.querySelector(".ao-nome").textContent === nome; }) || null; }
  function tastoDi(w, nome) { var r = rigaDi(w, nome); return r ? r.querySelector(".ao-chiama") : null; }
  // un invito scritto a mano (come se l'avesse mandato qualcuno) sul broker finto, trattenuto
  function invitoAMano(perNome, d) {
    var c = W.creaClient("Mano", {});
    return W.aspetta(function () { return c.connected; }, 1000).then(function () {
      c.publish(TOP + imp(perNome) + "/inv", JSON.stringify(d), { retain: true }); c.end();
    });
  }

  // ---------- 656 Pallino verde ----------
  aggiungi(656, { nome: "Amici online: pallino verde, nomi dalla memoria, badge, evento al massimo 1 al secondo, testamento", fai: async function () {
    var P = await telAmici("Paky", ["Giulia", "Luca"], 0), G = await telAmici("Giulia", ["Paky"], 185);
    var eventi = [];
    P.addEventListener("sg-amici-online", function (e) { eventi.push({ t: Date.now(), n: e.detail.n }); });
    if (P.SGAmiciOnline.badge() !== null) no("badge prima di avvia (senza presenza) non è null");
    await avvia(P, "Paky");
    if (P.SGAmiciOnline.online().length) no("Paky vede amici online prima che ci siano: " + nomiOnline(P));
    if (P.SGAmiciOnline.badge() !== null) no("badge con nessuno online non è null");
    var t0 = Date.now();
    await avvia(G, "Giulia");
    if (!await W.aspetta(function () { return /Giulia:app/.test(nomiOnline(P)); }, 2000)) no("in 2 s Paky non vede Giulia online: " + nomiOnline(P));
    var ms = Date.now() - t0;
    var x = P.SGAmiciOnline.online()[0];
    if (x.uid !== "finto-Giulia" || x.nome !== "Giulia" || !("omino" in x)) no("riga di online(): " + JSON.stringify(x));
    if (!await W.aspetta(function () { return eventi.length && eventi[eventi.length - 1].n === 1; }, 1500)) no("niente evento sg-amici-online con Giulia");
    // nomi e avatar dalla memoria del telefono (una lettura delle schede per telefono, non a ogni apertura)
    var c = JSON.parse(P.localStorage.getItem("sg-amici-cache") || "null");
    if (!c || c.di !== "finto-Paky" || !c.amici["finto-Giulia"] || c.amici["finto-Giulia"].H !== imp("Giulia")) no("sg-amici-cache: " + JSON.stringify(c));
    var letture = W.BR.schede;
    P.SGAmiciOnline.avvia();   // (stesso profilo: rilegge solo la lista)
    await W.dorme(200);
    if (W.BR.schede !== letture) no("avvia di nuovo ha riletto le schede");
    // il badge: si aggiorna da solo
    var b = P.SGAmiciOnline.badge();
    if (!b || b.className.indexOf("ao-badge") < 0 || b.textContent !== "🟢 1") no("badge: " + (b && b.outerHTML));
    P.document.body.appendChild(b);
    // lo stato cambia tante volte in fretta: l'evento arriva al massimo una volta al secondo
    var n0 = eventi.length;
    ["sala", "gioco", "app", "sala"].forEach(function (s, i) { setTimeout(function () { G.SGAmiciOnline.stato(s, "KFRT"); }, i * 60); });
    if (!await W.aspetta(function () { return /Giulia:sala/.test(nomiOnline(P)); }, 2000)) no("Paky non vede Giulia nella Sala: " + nomiOnline(P));
    await W.dorme(1500);
    var nuovi = eventi.slice(n0);
    for (var i = 1; i < eventi.length; i++) if (eventi[i].t - eventi[i - 1].t < 950) no("due eventi a " + (eventi[i].t - eventi[i - 1].t) + " ms");
    if (nuovi.length > 2) no(nuovi.length + " eventi per 4 cambi in 200 ms");
    if (b.textContent !== "🟢 1") no("badge dopo i cambi: " + b.textContent);
    // un "on" rimasto lì da 3 ore (un telefono morto senza testamento) non conta
    var mano = W.creaClient("Mano", {});
    await W.aspetta(function () { return mano.connected; }, 1000);
    mano.publish(TOP + imp("Luca") + "/on", JSON.stringify({ on: 1, s: "app", t: Date.now() - 3 * 3600000 }), { retain: true });
    await W.dorme(1300);
    if (/Luca/.test(nomiOnline(P))) no("un «on» di 3 ore fa conta: " + nomiOnline(P));
    // la lista degli amici cambia: i nomi si rileggono (lista diversa), Luca adesso si vede quando c'è
    mano.publish(TOP + imp("Luca") + "/on", JSON.stringify({ on: 1, s: "gioco", t: Date.now() }), { retain: true });
    if (!await W.aspetta(function () { return /Luca:gioco/.test(nomiOnline(P)); }, 2000)) no("Luca online non si vede: " + nomiOnline(P));
    if (!await W.aspetta(function () { return b.textContent === "🟢 2"; }, 1500)) no("badge con due: " + b.textContent);
    // Giulia chiude l'app → sparisce (testamento)
    await W.chiudiApp("Giulia");
    if (!await W.aspetta(function () { return !/Giulia/.test(nomiOnline(P)); }, 2000)) no("Giulia chiusa resta online per Paky");
    // Luca tolto dagli amici → non si vede più
    letture = W.BR.schede;
    W.BR.mem.Paky.fp.amici = ["finto-Giulia"];
    P.SGAmiciOnline.avvia();
    if (!await W.aspetta(function () { return !P.SGAmiciOnline.online().length; }, 1500)) no("tolto Luca, Paky lo vede ancora: " + nomiOnline(P));
    await W.dorme(200);
    if (W.BR.schede !== letture + 1) no("con la lista cambiata le schede non si rileggono (" + (W.BR.schede - letture) + ")");
    if (!b.classList.contains("zero")) no("badge con 0 si vede ancora: " + b.outerHTML);
    // ricaricando: la memoria basta, niente letture
    letture = W.BR.schede;
    var P2 = await W.ricarica("Paky");
    await avvia(P2, "Paky");
    await W.dorme(300);
    if (W.BR.schede !== letture) no("ricaricando ha riletto le schede (stesso giorno, stessa lista)");
    // ferma: per gli amici non c'è più, niente online, badge null
    var G2 = await W.apriTel("Giulia", { x: 185 }); await avvia(G2, "Giulia");
    if (!await W.aspetta(function () { return /Giulia/.test(nomiOnline(P2)); }, 2000)) no("Giulia riaperta non si vede");
    G2.SGAmiciOnline.ferma();
    if (!await W.aspetta(function () { return !/Giulia/.test(nomiOnline(P2)); }, 2000)) no("Giulia fermata resta online");
    if (G2.SGAmiciOnline.online().length || G2.SGAmiciOnline.badge() !== null) no("dopo ferma Giulia vede ancora amici");
    // senza profilo: niente
    var N = await W.apriTel("Nuovo", { x: 370, profilo: false });
    if (N.SGAmiciOnline.avvia() !== false) no("senza profilo avvia parte");
    return "Giulia vista in " + ms + " ms, " + nuovi.length + " eventi per 4 cambi, letture schede " + W.BR.schede;
  } });

  // ---------- 657 Invito con l'app aperta ----------
  aggiungi(657, { nome: "Invito con l'app aperta: «📨 Chiama» → avviso in alto → «Entra» → «👍 Arriva!»; «Non ora»; 📨 nell'angolo dopo 20 s", fai: async function () {
    var P = await telAmici("Paky", ["Giulia", "Luca"], 0);
    var G = await telAmici("Giulia", ["Paky"], 185, { prima: audioNote });
    var L = await telAmici("Luca", ["Paky"], 370, { prima: audioNote });
    await avvia(P, "Paky"); await avvia(G, "Giulia"); await avvia(L, "Luca");
    var vai = [];
    G.SGAmiciOnline.onInvito(function (cod, d) { vai.push(cod + "/" + d.nome); });
    var risposte = [];
    P.addEventListener("sg-amici-risposta", function (e) { risposte.push(e.detail.nome + ":" + e.detail.si); });
    if (!await W.aspetta(function () { return P.SGAmiciOnline.online().length === 2; }, 2000)) no("Paky non vede Giulia e Luca: " + nomiOnline(P));
    // il foglio "➕ Invita"
    var link = 0;
    var F = P.SGAmiciOnline.foglioInvita({ codice: "KFRT", nomeSala: "Sala di Paky", gioco: "Tris", condividi: function () { link++; } });
    if (!F || !P.document.querySelector(".sl-velo .sl-foglio")) no("il foglio non si apre");
    if (P.SGAmiciOnline.foglioInvita({ codice: "KFRT" }) !== null) no("un secondo foglio si apre sopra il primo");
    var tg = tastoDi(P, "Giulia");
    if (!tg || tg.textContent !== "📨 Chiama" || tg.disabled) no("riga di Giulia: " + (rigaDi(P, "Giulia") || {}).textContent);
    if (!/nell'app/.test(rigaDi(P, "Giulia").textContent)) no("Giulia non è «🟢 nell'app»: " + rigaDi(P, "Giulia").textContent);
    if (!/Sala di Paky · si gioca a Tris/.test(W.testo(P))) no("manca «Sala di Paky · si gioca a Tris»");
    W.clicca(P, /Manda il link/);
    if (link !== 1) no("«📤 Manda il link» non chiama condividi");
    if (P.document.querySelector(".ao-foglio .btn") && /QR/.test(P.document.querySelector(".ao-foglio").textContent)) no("c'è il QR senza o.qr");
    var rigaG = rigaDi(P, "Giulia");
    tg.click();
    if (tastoDi(P, "Giulia").textContent !== "✅ Chiamato" || !tastoDi(P, "Giulia").disabled) no("dopo «Chiama»: " + tastoDi(P, "Giulia").textContent);
    if (rigaDi(P, "Giulia") !== rigaG) no("la riga di Giulia è stata rifatta (lampeggio)");
    // a Giulia: l'avviso in alto, suono piccolo, nessuna vibrazione
    if (!await W.aspetta(function () { return avviso(G); }, 2000)) no("a Giulia non arriva l'avviso");
    senzaAnimazioni(G);
    var a = avviso(G), r = a.getBoundingClientRect();
    if (!/Paky ti chiama nella Sala/.test(a.textContent) || !/si gioca a Tris/.test(a.textContent)) no("avviso: " + a.textContent);
    if (r.height > 72 || r.top > 12) no("avviso alto " + r.height + " px, in cima a " + r.top);
    if (!/Entra ▶/.test(a.textContent) || !/Non ora/.test(a.textContent)) no("mancano i tasti: " + a.textContent);
    await W.dorme(100);
    if (G.__note.join(",") !== "784,1175") no("suono dell'invito: " + G.__note.join(","));
    if (G.__vibra) no("l'invito che arriva ha fatto vibrare");
    // dopo 20 secondi si fa piccolo: 📨 nell'angolo; un tocco lo riapre
    await W.dorme(19000);
    if (!avviso(G)) no("l'avviso è sparito prima dei 20 s");
    if (!await W.aspetta(function () { return !avviso(G) && G.document.querySelector(".ao-mini"); }, 2500)) no("dopo 20 s non c'è 📨 nell'angolo");
    var m = G.document.querySelector(".ao-mini").getBoundingClientRect();
    if (m.right < 300 || m.top > 20) no("📨 non è in alto a destra: " + JSON.stringify(m));
    G.document.querySelector(".ao-mini").click();
    if (!avviso(G) || G.document.querySelector(".ao-mini")) no("toccando 📨 l'avviso non torna grande");
    // "Entra" → la Sala di Paky; Paky legge "👍 Arriva!"
    if (!W.clicca(G, /Entra ▶/, ".ao-invito button")) no("non trovo «Entra ▶»");
    if (vai.join() !== "KFRT/Paky") no("Entra non porta nella Sala: " + vai.join());
    if (!await W.aspetta(function () { return tastoDi(P, "Giulia").textContent === "👍 Arriva!"; }, 2000)) no("Paky non legge «👍 Arriva!»: " + tastoDi(P, "Giulia").textContent);
    if (rigaDi(P, "Giulia") !== rigaG) no("la riga di Giulia è stata rifatta (lampeggio)");
    if (risposte.join() !== "Giulia:true") no("evento della risposta: " + risposte.join());
    await W.dorme(300);
    if (avviso(G) || G.document.querySelector(".ao-mini")) no("dopo «Entra» l'avviso resta");
    if (W.BR.retained[TOP + imp("Giulia") + "/inv"] != null) no("l'invito risposto è ancora trattenuto");
    if ((JSON.parse(G.localStorage.getItem("sg-inviti-visti") || "[]")).length !== 1) no("sg-inviti-visti: " + G.localStorage.getItem("sg-inviti-visti"));
    // Luca: "Non ora" → "🙅 Non ora"; dopo 30 s si può richiamare
    tastoDi(P, "Luca").click();
    if (!await W.aspetta(function () { return avviso(L); }, 2000)) no("a Luca non arriva l'avviso");
    W.clicca(L, /Non ora/, ".ao-invito button");
    if (!await W.aspetta(function () { return tastoDi(P, "Luca").textContent === "🙅 Non ora"; }, 2000)) no("Paky non legge «🙅 Non ora»: " + tastoDi(P, "Luca").textContent);
    if (!tastoDi(P, "Luca").disabled) no("«🙅 Non ora» si può richiamare subito");
    await W.dorme(300);
    if (avviso(L) || L.document.querySelector(".ao-mini")) no("dopo «Non ora» l'avviso resta");
    var vero = P.Date.now; P.Date.now = function () { return vero.call(P.Date) + 31000; };   // (31 secondi dopo)
    L.SGAmiciOnline.stato("gioco");
    if (!await W.aspetta(function () { return tastoDi(P, "Luca").textContent === "📨 Richiama" && !tastoDi(P, "Luca").disabled; }, 2500)) no("dopo 30 s niente «📨 Richiama»: " + tastoDi(P, "Luca").textContent);
    if (!/sta giocando/.test(rigaDi(P, "Luca").textContent)) no("Luca non «🎮 sta giocando»: " + rigaDi(P, "Luca").textContent);
    P.Date.now = vero;
    F.chiudi();
    if (P.document.querySelector(".sl-velo")) no("chiudi() non toglie il foglio");
    if (L.__vibra > 1) no("Luca ha vibrato " + L.__vibra + " volte (solo il suo tocco)");
    return "avviso " + Math.round(r.height) + " px, note " + G.__note.join("+") + ", vibrazioni all'arrivo 0";
  } });

  // ---------- 658 Invito con l'app chiusa ----------
  aggiungi(658, { nome: "Invito con l'app chiusa: trovato riaprendo entro 10 minuti, non dopo; il secondo prende il posto del primo; scade da solo", fai: async function () {
    var P = await telAmici("Paky", ["Giulia"], 0), G = await telAmici("Giulia", ["Paky"], 185);
    await avvia(P, "Paky"); await avvia(G, "Giulia");
    if (!await W.aspetta(function () { return P.SGAmiciOnline.online().length === 1; }, 2000)) no("Paky non vede Giulia");
    W.spegni("Giulia");
    if (!await W.aspetta(function () { return !P.SGAmiciOnline.online().length; }, 2000)) no("Giulia spenta resta online");
    P.SGAmiciOnline.foglioInvita({ codice: "KFRT", nomeSala: "Sala di Paky", gioco: "" });
    var rg = rigaDi(P, "Giulia");
    if (!rg || !rg.classList.contains("via") || !/non è nell'app/.test(rg.textContent)) no("Giulia spenta non è in grigio: " + (rg && rg.textContent));
    if (!/entro 10 minuti/.test(W.testo(P))) no("manca «se la aprono entro 10 minuti»");
    tastoDi(P, "Giulia").click();
    if ((scritto(imp("Giulia"), "inv") || {}).sala !== "KFRT") no("l'invito non è rimasto scritto");
    // Giulia riapre l'app → trova l'invito (senza "si gioca a")
    var G2 = await W.chiudiApp("Giulia"); await avvia(G2, "Giulia");
    if (!await W.aspetta(function () { return avviso(G2); }, 2000)) no("riaprendo, Giulia non trova l'invito");
    if (/si gioca/.test(avviso(G2).textContent)) no("«si gioca a» senza gioco");
    W.clicca(G2, /Non ora/, ".ao-invito button");
    // un invito di 11 minuti fa: niente
    await invitoAMano("Giulia", { id: "vecchio", da: imp("Paky"), nome: "Paky", sala: "ABCD", gioco: "Tris", t: Date.now() - 11 * 60000 });
    var G3 = await W.chiudiApp("Giulia"); await avvia(G3, "Giulia");
    await W.dorme(600);
    if (avviso(G3) || G3.document.querySelector(".ao-mini")) no("si vede un invito di 11 minuti fa");
    // di 9 minuti fa: sì
    await invitoAMano("Giulia", { id: "nove", da: imp("Paky"), nome: "Paky", sala: "ABCD", t: Date.now() - 9 * 60000 });
    if (!await W.aspetta(function () { return avviso(G3); }, 2000)) no("un invito di 9 minuti fa non si vede");
    W.clicca(G3, /Non ora/, ".ao-invito button");
    // due inviti mentre è chiusa: si vede solo il secondo
    W.spegni("Giulia");
    await invitoAMano("Giulia", { id: "primo", da: imp("Paky"), nome: "Paky", sala: "AAAA", t: Date.now() });
    await invitoAMano("Giulia", { id: "secondo", da: imp("Paky"), nome: "Paky", sala: "BBBB", gioco: "Scopa", t: Date.now() });
    var vai = [];
    var G4 = await W.chiudiApp("Giulia");
    G4.SGAmiciOnline.onInvito(function (c, d) { vai.push(c + "/" + d.id); });
    await avvia(G4, "Giulia");
    if (!await W.aspetta(function () { return avviso(G4); }, 2000)) no("riaprendo non trova il secondo invito");
    if (!/Scopa/.test(avviso(G4).textContent)) no("non è il secondo invito: " + avviso(G4).textContent);
    W.clicca(G4, /Entra ▶/, ".ao-invito button");
    if (vai.join() !== "BBBB/secondo") no("Entra: " + vai.join());
    // un invito che scade mentre si vede: sparisce da solo e si toglie dal broker
    await invitoAMano("Giulia", { id: "scade", da: imp("Paky"), nome: "Paky", sala: "CCCC", t: Date.now() - 10 * 60000 + 1500 });
    if (!await W.aspetta(function () { return avviso(G4); }, 1000)) no("l'invito che sta per scadere non si vede");
    if (!await W.aspetta(function () { return !avviso(G4) && !G4.document.querySelector(".ao-mini"); }, 3000)) no("l'invito scaduto resta sullo schermo");
    await W.dorme(200);
    if (W.BR.retained[TOP + imp("Giulia") + "/inv"] != null) no("l'invito scaduto resta trattenuto");
    return "trovato riaprendo, 11 minuti no, 9 sì, il secondo al posto del primo, scaduto sparisce";
  } });

  // ---------- 659 Solo dagli amici ----------
  aggiungi(659, { nome: "Inviti solo dagli amici: niente da sconosciuti, già visti, per la Sala dove sono già, codici strani", fai: async function () {
    var G = await telAmici("Giulia", ["Paky"], 185);
    await avvia(G, "Giulia");
    async function niente(d, perche) {
      await invitoAMano("Giulia", d); await W.dorme(400);
      if (avviso(G) || G.document.querySelector(".ao-mini")) no("si vede un invito " + perche);
    }
    await niente({ id: "s1", da: imp("Sconosciuto"), nome: "Sconosciuto", sala: "KFRT", t: Date.now() }, "di uno che non è amico");
    await niente({ id: "s2", da: "abc", nome: "Paky", sala: "KFRT", t: Date.now() }, "con un'impronta sbagliata");
    await niente({ id: "s3", da: imp("Paky"), nome: "Paky", sala: "K/#+", t: Date.now() }, "con un codice strano");
    await niente({ id: "s4", da: imp("Paky"), nome: "Paky", sala: "KFRT", t: Date.now() + 3600000 }, "con l'ora nel futuro");
    G.localStorage.setItem("sg-inviti-visti", JSON.stringify(["gia"]));
    await niente({ id: "gia", da: imp("Paky"), nome: "Paky", sala: "KFRT", t: Date.now() }, "già risposto");
    G.SGAmiciOnline.stato("sala", "kfrt");
    await niente({ id: "s5", da: imp("Paky"), nome: "Paky", sala: "KFRT", t: Date.now() }, "per la Sala dove è già");
    // da un amico per un'altra Sala: sì; e se ci arriva da sola l'avviso sparisce
    await invitoAMano("Giulia", { id: "s6", da: imp("Paky"), nome: "Paky", sala: "ZZZZ", t: Date.now() });
    if (!await W.aspetta(function () { return avviso(G); }, 1500)) no("l'invito di un amico per un'altra Sala non si vede");
    G.SGAmiciOnline.stato("sala", "ZZZZ");
    await W.dorme(400);
    if (avviso(G)) no("arrivata nella Sala dell'invito, l'avviso resta");
    var visti = G.localStorage.getItem("sg-inviti-visti");
    if (JSON.parse(visti || "[]").indexOf("s6") < 0) no("arrivata nella Sala, l'invito non è segnato visto: " + visti);
    if (W.BR.retained[TOP + imp("Giulia") + "/inv"] != null) no("arrivata nella Sala, l'invito resta trattenuto");
    // lo stesso invito ripetuto (uscita dalla Sala) non torna
    G.SGAmiciOnline.stato("app");
    await niente({ id: "s6", da: imp("Paky"), nome: "Paky", sala: "ZZZZ", t: Date.now() + 1 }, "già tolto arrivando nella Sala");
    return "6 inviti scartati, 1 mostrato e tolto arrivando nella Sala · visti " + visti;
  } });

  // ---------- 660 Non farti vedere ----------
  aggiungi(660, { nome: "«Non farti vedere» (sg-presenza = 0) e app in secondo piano; l'avviso sopra un gioco a 360x640 e 412x915 non copre più di 72 px", fai: async function () {
    var P = await telAmici("Paky", ["Giulia"], 0);
    var G = await telAmici("Giulia", ["Paky"], 185, { prima: function (w) { w.localStorage.setItem("sg-presenza", "0"); } });
    await avvia(P, "Paky"); await avvia(G, "Giulia");
    await W.dorme(800);
    if (P.SGAmiciOnline.online().length) no("con sg-presenza = 0 Paky vede Giulia: " + nomiOnline(P));
    if ((scritto(imp("Giulia"), "on") || {}).on !== 0) no("nascosta, Giulia ha scritto on: " + JSON.stringify(scritto(imp("Giulia"), "on")));
    if (G.SGAmiciOnline.visibile() !== false) no("visibile() non dice false");
    G.SGAmiciOnline.stato("sala", "QQQQ"); await W.dorme(300);
    if (P.SGAmiciOnline.online().length) no("cambiando stato, Giulia nascosta si vede");
    // Giulia apre un gioco (Tris, sullo stesso telefono) e Paky la chiama: l'avviso arriva lo stesso
    G.SGAmiciOnline.stato("gioco");
    var tess = await W.aspetta(function () { return [].find.call(G.document.querySelectorAll(".tessera"), function (t) { return (t.querySelector("h2") || {}).textContent === "Tris"; }); }, 4000);
    if (!tess) no("non trovo la tessera del Tris");
    tess.click(); await W.dorme(300);
    W.clicca(G, /stesso telefono|Contro il Bot|Bot/, ".modo-grande, button"); await W.dorme(300);
    W.clicca(G, /Comincia|Gioca|Inizia/); await W.dorme(400);
    P.SGAmiciOnline.foglioInvita({ codice: "KFRT", nomeSala: "Sala di Paky", gioco: "Tris" });
    tastoDi(P, "Giulia").click();
    if (!await W.aspetta(function () { return avviso(G); }, 2000)) no("nascosta, Giulia non riceve l'invito");
    senzaAnimazioni(G);
    var misure = [];
    for (var dim of [[360, 640], [412, 915]]) {
      var f = document.getElementById("tel-Giulia");
      f.style.width = dim[0] + "px"; f.style.height = dim[1] + "px";
      G.dispatchEvent(new G.Event("resize")); await W.dorme(300);
      var a = avviso(G), r = a.getBoundingClientRect();
      if (r.height > 72 || r.top < 0 || r.top > 12 || r.left < 0 || r.right > dim[0]) no(dim.join("x") + ": avviso " + JSON.stringify({ t: r.top, h: r.height, l: r.left, r: r.right }));
      var dentro = [].slice.call(a.querySelectorAll("button")).every(function (b) { return b.scrollWidth <= b.clientWidth + 1 && b.getBoundingClientRect().right <= dim[0]; });
      if (!dentro) no(dim.join("x") + ": i tasti dell'avviso escono");
      // sotto l'avviso si tocca il gioco
      var sotto = G.document.elementFromPoint(dim[0] / 2, r.bottom + 30), sopra = G.document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!sotto || a.contains(sotto)) no(dim.join("x") + ": sotto l'avviso non si tocca il gioco");
      if (!sopra || !a.contains(sopra)) no(dim.join("x") + ": l'avviso non si tocca");
      if (G.document.documentElement.scrollHeight > dim[1] + 1) no(dim.join("x") + ": la pagina scorre");
      misure.push(dim.join("x") + " " + Math.round(r.height) + " px");
    }
    // le pillole della rete scendono sotto l'avviso
    var box = G.document.createElement("div"); box.className = "sg-pillole"; box.innerHTML = '<div class="sg-pillola">📶 Mi ricollego…</div>'; G.document.body.appendChild(box);
    var rp = box.getBoundingClientRect(), ra = avviso(G).getBoundingClientRect();
    if (rp.top < ra.bottom) no("le pillole stanno sotto l'avviso (" + rp.top + " < " + ra.bottom + ")");
    box.remove();
    W.clicca(G, /Non ora/, ".ao-invito button");
    // "Fatti vedere" acceso → Paky la vede; spento → no
    G.SGAmiciOnline.visibile(true);
    if (!await W.aspetta(function () { return /Giulia:gioco/.test(nomiOnline(P)); }, 2000)) no("visibile(true): Paky non vede Giulia: " + nomiOnline(P));
    if (G.localStorage.getItem("sg-presenza") === "0") no("visibile(true) non ha cambiato sg-presenza");
    // in secondo piano: sparisce; tornando: c'è di nuovo
    Object.defineProperty(G.document, "visibilityState", { configurable: true, get: function () { return "hidden"; } });
    G.document.dispatchEvent(new G.Event("visibilitychange"));
    if (!await W.aspetta(function () { return !P.SGAmiciOnline.online().length; }, 2000)) no("in secondo piano Giulia resta online");
    Object.defineProperty(G.document, "visibilityState", { configurable: true, get: function () { return "visible"; } });
    G.document.dispatchEvent(new G.Event("visibilitychange"));
    if (!await W.aspetta(function () { return P.SGAmiciOnline.online().length === 1; }, 2000)) no("tornata nell'app Giulia non si vede");
    G.SGAmiciOnline.visibile(false);
    if (!await W.aspetta(function () { return !P.SGAmiciOnline.online().length; }, 2000)) no("visibile(false): Paky la vede ancora");
    if (G.localStorage.getItem("sg-presenza") !== "0") no("visibile(false) non scrive sg-presenza = 0");
    return misure.join(", ");
  } });

  // ---------- il foglio "➕ Invita" a misura (aiuto per p6-f e per la foto) ----------
  W.COPIONE_AMICI.avviso = avviso; W.COPIONE_AMICI.rigaDi = rigaDi; W.COPIONE_AMICI.telAmici = telAmici; W.COPIONE_AMICI.avvia = avvia;
})();

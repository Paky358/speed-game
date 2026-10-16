// PROVE dei miglioramenti di Poker («Fai vedere!» e Torneo della serata), Black Jack (Torneo a fiches uguali) e Horto Muso (Gran Premio).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("migliora/casino-horto.js"); window.__run = COPIONE.prova("pk1")
// Gli scenari durano 1-4 minuti: lanciali senza aspettarli e poi leggi COPIONE.esiti (o await window.__run).
//
// pk1: Poker online in due (stanza normale): chi vince perché l'altro lascia ha «🃏 Fai vedere!» / «🤐 Segreto» (solo lui);
//      Paky le gira → nella foto le sue carte e svela { bluff } giusto (calcolato di nuovo qui), su Giulia il cartello BLUFF!/Ce l'aveva;
//      poi vince Giulia, ricarica la pagina nei 7 secondi e ritrova i tasti, tocca «Segreto»: le sue carte non vanno MAI nella foto,
//      la mano dopo parte subito. Fiches sempre giuste (somma uguale). Misure 360x640 e 412x915 col cartello.
// pk2: Poker online, Torneo della serata in 3 (Paky 700 monete, Giulia 400, Luca 1.500): nel ⚙️ «Fiches uguali» → tutti a 1.000 e
//      la riga «📜 Si gioca così» lo dice; 5 mani a «chiama» poi i bui salgono (15/30); poi tutti all-in fino alla fine.
//      Sara arriva a torneo iniziato: guarda («Torneo in corso»), niente posto; Luca ricarica e ritrova il posto con le sue fiches.
//      Fine: classifica col posto di uscita, t.risultato una volta con 3 nomi, mai salvaFiches; «Nuova partita» → in saletta
//      tutti e 4 a 1.000 (Sara seduta); torneo spento → di nuovo 700 / 400 / 1.000 / 1.000.
// pk3: Poker contro i Bot col torneo: all-in a ogni mano fino alla fine; «Fai vedere!» quando capita; classifica del torneo con
//      «🔄 Un altro torneo» (riparte a 1.000, bui 10/20), t.risultato una volta, mai salvaFiches.
// bj1: Black Jack nella Sala in 3 (Paky 700, Giulia 300 di prova): ⚙️ «Fiches uguali» → tutti 1.000, niente «di prova»; 2 mani;
//      a fine partita i punti nella Classifica della serata (vm(S).torneo.n = 1), mai salvaFiches; misure della fine;
//      la Rivincita riporta tutti a 1.000.
// bj2: Black Jack in una stanza normale, torneo: Sara arriva a partita iniziata e guarda («Torneo in corso»), Giulia ricarica
//      e ritrova il posto; alla serie nuova Sara è seduta e tutti hanno 1.000.
// bj3: Black Jack sullo stesso telefono in 2 col torneo: tutti 1.000, 2 mani, podio «Classifica del torneo», «🏆 Punti della
//      serata ▶» → t.fine (Classifica della serata); da solo: «🔄 Un altro torneo ▶» riporta a 1.000.
// ho1: Horto Muso contro i Bot, Gran Premio (3 cavalli): scritta «corsa 1 di 3», classifica a punti (10-6-4), «⏩ Avanti» parte
//      subito, la seconda volta il conto alla rovescia, all'ultima «punti doppi» (20-12-8), podio finale, t.risultato una volta;
//      misure della classifica 360x640 e 412x915.
// ho2: Horto Muso online in 3 con 8 cavalli e Gran Premio: dopo la 1ª corsa Giulia e Luca toccano «⏩ Avanti» (2 su 3) → si parte
//      subito; dopo la 2ª Luca ricarica e ritrova la classifica col conto, nessuno tocca → parte da sola; ultima a punti doppi;
//      totale dei punti giusto (26 + 26 + 52); t.risultato una volta sola, alla fine; misure; «Nuova partita» = un altro GP.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T, vm = A.vm;
  var GIOCHI = ["poker", "blackjack", "horto"];

  // ---- la spia di questi tre giochi (apriTel(nome, { ch: true })): w.__t = il tavolo, w.__imp = regole cambiate per la prova,
  //      w.__ris = i t.risultato, w.__fine = i t.fine ----
  if (!W.__prepCH) {
    W.__prepCH = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepCH(w, nome, opz);
      if (!opz || !opz.ch) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && GIOCHI.indexOf(g.id) >= 0) {
            var av = g.avvia;
            g.avvia = function (t) {
              w.__t = t;
              if (w.__imp && t.impostazioni) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
              var ris = t.risultato, fin = t.fine;
              t.risultato = function (c) { w.__ris = (w.__ris || []).concat([JSON.parse(JSON.stringify(c))]); return ris ? ris.apply(this, arguments) : undefined; };
              t.fine = function (c) { w.__fine = (w.__fine || []).concat([JSON.parse(JSON.stringify(c || null))]); return fin ? fin.apply(this, arguments) : undefined; };
              return av.apply(this, arguments);
            };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }
  // un telefono con la spia; monete = le Speed Coins del profilo finto (fiches del Black Jack e del Poker)
  async function tel(nome, o) {
    o = o || {};
    // (le monete e la spia prima che parta l'app: chi entra da un link legge il portafoglio subito)
    var w = await W.apriTel(nome, Object.assign({ ch: true, prima: function (x) { spiaMonete(x, o.monete); } }, o));
    return w;
  }
  function spiaMonete(w, monete) {
    w.__salvaF = w.__salvaF || 0;
    if (!w.SGNube) return;
    if (monete != null) w.SGNube.fiches = function () { return monete; };
    w.SGNube.salvaFiches = function () { w.__salvaF++; };
    var sp = w.SGNube.salvaProgressi;
    w.SGNube.salvaProgressi = function (f) { if (f != null) w.__salvaF++; return sp && sp.apply(this, arguments); };
  }
  function senzaErrori(cosa) { var e = W.erroriTel(); if (e.length) no((cosa ? cosa + ": " : "") + "errori: " + e.slice(0, 3).join(" | ")); }
  async function regola(P, re, poi) {   // l'host cambia una regola dal ⚙️ della saletta
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/, ".sl-regole, button"); }, 5000)) no("non trovo ⚙️ Regole");
    await W.dorme(300);
    if (!W.clicca(P, re, ".sl-foglio .modo-chip")) no("nel ⚙️ non trovo la regola " + re);
    await W.dorme(150);
    if (poi) await poi(P.document.querySelector(".sl-foglio"));
    W.clicca(P, /Fatto|Ok/, ".sl-foglio button"); await W.dorme(500);
  }
  // a misura (larg x alt): la pagina non scorre, niente esce di lato; sel = cose che devono stare dentro lo schermo
  async function misura(w, nome, larg, alt, sel) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(600);
    var e = "";
    if (d.documentElement.scrollHeight > alt + 1) e = "la pagina scorre (" + d.documentElement.scrollHeight + ")";
    else if (d.documentElement.scrollWidth > larg + 1) e = "la pagina scorre di lato (" + d.documentElement.scrollWidth + ")";
    else if (sel) [].forEach.call(d.querySelectorAll(sel), function (x) {
      var r = x.getBoundingClientRect(); if (!e && r.width && (r.bottom > alt + 1 || r.right > larg + 1 || r.left < -1)) e = "«" + x.textContent.trim().slice(0, 30) + "» esce dallo schermo";
    });
    return e ? nome + " a " + larg + "x" + alt + ": " + e : "";
  }
  async function misure(w, nome, sel) {
    var M = [[360, 640], [412, 915]], err = [];
    for (var k = 0; k < M.length; k++) { var e = await misura(w, nome, M[k][0], M[k][1], sel); if (e) err.push(e); }
    var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    if (err.length) no(err.join(" · "));
    return "misure ok";
  }
  // gioco in locale: tessera → modo → (amici) → Comincia, finché il gioco non parte (w.__t)
  async function avviaLocale(P, nomeGioco, nomeModo, amici) {
    P.__t = null;
    var tess = await W.aspetta(function () { return A.tessera(P, nomeGioco); }, 6000);
    if (!tess) no("non trovo la tessera " + nomeGioco);
    tess.click(); await W.dorme(500);
    var bm = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".modo-grande"), function (b) { return b.textContent.indexOf(nomeModo) >= 0; }); }, 4000);
    if (!bm) no("in «Come giocate?» non c'è «" + nomeModo + "»");
    bm.click(); await W.dorme(400);
    if (amici && await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 2500)) {
      while (P.document.querySelectorAll(".sala-riga input").length < amici.length) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
      [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = amici[k] || ("Amico " + k); c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    }
    for (var k = 0; k < 8 && !P.__t; k++) {
      await W.dorme(300);
      var b = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Avanti|Comincia|Gioca|▶/.test(x.textContent) && !x.disabled; });
      if (b) b.click();
    }
    if (!await W.aspetta(function () { return P.__t; }, 3000)) no(nomeGioco + " non parte («" + T(P).slice(0, 70) + "»)");
  }
  // stanza online normale (non la Sala): l'host la apre, gli amici entrano dal link; ritorna il codice
  async function stanza(P, nomeGioco, idGioco, amici, monete) {
    var C = await W.apriStanza(P, nomeGioco);
    for (var i = 0; i < amici.length; i++) await tel(amici[i], { hash: "gioco=" + idGioco + "&stanza=" + C, x: 185 * (i + 1), monete: monete && monete[amici[i]] });
    return C;
  }

  // =================== POKER ===================
  function pkIo(v, id) { return (v.players || []).filter(function (p) { return p.id === id; })[0] || null; }
  function somma(v) { return (v.players || []).reduce(function (s, p) { return s + p.stack + (p.inGiro || 0); }, 0) + (v.piatto || 0) - (v.players || []).reduce(function (s, p) { return s + (p.inGiro || 0); }, 0); }
  // l'host fa una mossa toccando i suoi tasti: "lascia" | "passa" (o chiama) | "allin"
  async function pkHost(P, tipo) {
    var d = P.document;
    if (tipo === "lascia") { var l = d.querySelector(".pk-azioni .pk-btn.lascia"); if (l) l.click(); return !!l; }
    if (tipo === "passa") { var p = d.querySelector(".pk-azioni .pk-btn.passa"); if (p) p.click(); return !!p; }
    var b = d.querySelector(".pk-azioni .pk-btn.punta");
    if (!b) { var c = d.querySelector(".pk-azioni .pk-btn.passa"); if (c) c.click(); return !!c; }   // (non può rilanciare: chiama)
    if (/^All-in/.test(b.textContent)) { b.click(); return true; }
    b.click(); await W.dorme(700);
    W.clicca(P, /^All-in$/, ".pk-azioni .pk-btn.piccolo"); await W.dorme(100);
    var ok = d.querySelector(".pk-azioni .pk-btn.ok"); if (ok) ok.click();
    return !!ok;
  }
  // un amico manda la sua mossa (come i tasti del suo telefono)
  function pkOsp(nome, v, tipo, tot) { var h = W.reteDi(nome); if (h) h.invia({ t: "azione", tipo: tipo, tot: tot || 0, n: v.n, st: v.stato, dc: v.daChiamare }); }
  function pkMosse(v, id) {   // quello che può fare chi ha il turno (come mossePer)
    var io = pkIo(v, id); if (!io) return null;
    var serve = Math.max(0, v.daChiamare - io.inGiro), tutto = io.inGiro + io.stack;
    return { passa: serve === 0, chiama: serve > 0, max: tutto, punta: tutto > v.daChiamare && !io.chiuso };
  }
  // fa giocare la mano a tutti con una strategia: strat(v, id) → "lascia" | "passa" | "allin"; nomi = { id: nome }
  async function pkMano(C, nomi, strat, ms) {
    var fino = Date.now() + (ms || 30000), n0 = vm(C).n, fatto = {};
    while (Date.now() < fino) {
      var v = vm(C);
      if (v.fase !== "gioco") return v;
      if (v.stato === "finemano" || v.n !== n0) return v;
      if (v.turno && !fatto[v.n + "|" + v.stato + "|" + v.turno + "|" + v.daChiamare]) {
        var k = v.n + "|" + v.stato + "|" + v.turno + "|" + v.daChiamare, s = strat(v, v.turno), m = pkMosse(v, v.turno);
        fatto[k] = 1;
        if (v.turno === "host") await pkHost(W.finestra("Paky"), s);
        else if (nomi[v.turno]) {
          if (s === "allin") { if (m.punta) pkOsp(nomi[v.turno], v, "punta", m.max); else pkOsp(nomi[v.turno], v, m.passa ? "passa" : "chiama"); }
          else if (s === "passa") pkOsp(nomi[v.turno], v, m.passa ? "passa" : "chiama");
          else pkOsp(nomi[v.turno], v, "lascia");
        } else delete fatto[k];
      }
      await W.dorme(250);
    }
    return vm(C);
  }
  function nomiId(lista) { var o = {}; lista.forEach(function (n) { var id = A.mioId(n); if (id) o[id] = n; }); return o; }
  async function cominciaPoker(P, C, quanti) {
    if (!await W.aspetta(function () { return (vm(C).players || []).length === quanti; }, 10000)) no("al tavolo non arrivano in " + quanti + " (" + (vm(C).players || []).length + ")");
    await W.dorme(400);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 4000)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).n >= 1; }, 6000)) no("la partita non comincia");
  }

  COPIONE.aggiungi("pk1", { nome: "Poker online: «Fai vedere!» (BLUFF su tutti i telefoni), «Segreto», chi ricarica ritrova i tasti", fai: async function () {
    var P = await tel("Paky", { x: 0 }), C = await stanza(P, "Poker", "poker", ["Giulia"]), G = W.finestra("Giulia");
    await cominciaPoker(P, C, 2);
    var ids = nomiId(["Giulia"]), gid = A.mioId("Giulia"), totale = somma(vm(C)), note = [];
    // 1) vince Paky: lui va all-in, Giulia lascia
    var v = await pkMano(C, ids, function (v, id) { return id === "host" ? "allin" : "lascia"; });
    if (v.stato !== "finemano" || !v.vinti || !v.vinti.host) no("la prima mano non la vince Paky senza mostrare (" + JSON.stringify(v.vinti) + ")");
    if (v.svelabile !== "host") no("nella foto chi può girare le carte non è Paky (" + v.svelabile + ")");
    if (pkIo(v, "host").carte) no("le carte di Paky sono nella foto prima che le giri");
    if (!await W.aspetta(function () { return /Fai vedere!/.test(T(P)); }, 3000)) no("Paky non ha «🃏 Fai vedere!»");
    if (/Fai vedere!/.test(T(G))) no("anche Giulia (che ha lasciato) ha «Fai vedere!»");
    if (!P.document.querySelector(".pk-tempo:not(.piccolo)") || P.document.querySelector(".pk-tempo:not(.piccolo)").style.visibility !== "visible") note.push("(barretta del tempo non visibile)");
    await W.dorme(800); W.clicca(P, /Fai vedere!/);   // (dopo una mossa i tasti restano fermi 0,6 s: niente doppio tocco)
    var vs = await W.aspetta(function () { var x = vm(C); return x.svela && x.svela.id === "host" ? x : null; }, 3000);
    if (!vs) no("toccato «Fai vedere!» la foto non ha svela");
    var mie = pkIo(vs, "host").carte; if (!mie || mie.length !== 2) no("dopo «Fai vedere!» le carte di Paky non sono nella foto");
    var atteso = P.__POKER.bluffDi(mie, vs.tavolo, vs.variante, vs.basso);
    if (atteso.bluff !== vs.svela.bluff) no("BLUFF sbagliato: la foto dice " + vs.svela.bluff + ", le carte " + JSON.stringify(mie) + " sul tavolo " + JSON.stringify(vs.tavolo));
    var cart = await W.aspetta(function () { return G.document.querySelector(".pk-bluff"); }, 3000);
    if (!cart) no("su Giulia non compare il cartello del bluff");
    var testoC = cart.textContent;
    if (vs.svela.bluff ? !/BLUFF!/.test(testoC) : !/Ce l'aveva!/.test(testoC)) no("su Giulia il cartello dice «" + testoC + "» (bluff: " + vs.svela.bluff + ")");
    if (!/Paky/.test(testoC)) no("il cartello non dice di chi sono le carte («" + testoC + "»)");
    note.push("Paky: «" + testoC.replace(/\s+/g, " ").slice(0, 50) + "»");
    note.push(await misure(G, "Giulia", ".pk-bluff, .pk-btn"));
    // 2) la mano dopo vince Giulia; ricarica nei 7 secondi e ritrova i tasti; tocca «Segreto»
    if (!await W.aspetta(function () { return vm(C).n > vs.n && vm(C).stato !== "finemano"; }, 8000)) no("dopo «Fai vedere!» la mano nuova non parte");
    if (somma(vm(C)) !== totale) no("le fiches non tornano: " + somma(vm(C)) + " invece di " + totale);
    v = await pkMano(C, ids, function (v, id) { return id === "host" ? "lascia" : "allin"; });
    if (!v.vinti || !v.vinti[gid] || v.svelabile !== gid) no("la seconda mano non la vince Giulia col «Fai vedere!» (" + JSON.stringify(v.vinti) + ", " + v.svelabile + ")");
    await W.ricarica("Giulia"); G = W.finestra("Giulia"); spiaMonete(G);
    if (!await W.aspetta(function () { return /Segreto/.test(T(G)) && /Fai vedere!/.test(T(G)); }, 6000)) no("Giulia, dopo aver ricaricato, non ritrova «Fai vedere!» e «Segreto» («" + T(G).slice(0, 80) + "»)");
    if (/Fai vedere!/.test(T(P))) no("Paky ha «Fai vedere!» sulla mano vinta da Giulia");
    await W.dorme(800); var nS = vm(C).n, t0 = Date.now();
    W.clicca(G, /Segreto/);
    if (!await W.aspetta(function () { return vm(C).n > nS; }, 4000)) no("dopo «Segreto» la mano dopo non parte subito");
    note.push("Segreto → mano nuova in " + ((Date.now() - t0) / 1000).toFixed(1) + " s");
    if (W.BR.log.some(function (l) { return false; })) void 0;
    if (pkIo(vm(C), gid) && vm(C).svela) no("dopo «Segreto» c'è ancora svela nella foto");
    if (somma(vm(C)) !== totale) no("le fiches non tornano dopo la seconda mano");
    senzaErrori();
    return note.join(" · ");
  } });

  COPIONE.aggiungi("pk2", { nome: "Poker online: Torneo della serata in 3 (bui che salgono, chi arriva guarda, ricarica, fine, rivincita, spento)", fai: async function () {
    var P = await tel("Paky", { x: 0, monete: 700 });
    var C = await stanza(P, "Poker", "poker", ["Giulia", "Luca"], { Giulia: 400, Luca: 1500 }), note = [];
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 3; }, 10000)) no("al tavolo non arrivano in 3");
    var st = function () { return (vm(C).players || []).map(function (p) { return p.nome + ":" + p.stack; }).join(" "); };
    if (!/Paky:700/.test(st()) || !/Giulia:400/.test(st()) || !/Luca:1000/.test(st())) no("in saletta le fiches non sono quelle del profilo (" + st() + ")");
    await regola(P, /Fiches uguali/);
    if (!await W.aspetta(function () { return vm(C).torneo && (vm(C).players || []).every(function (p) { return p.stack === 1000; }); }, 4000)) no("acceso il torneo le fiches non sono 1.000 per tutti (" + st() + ")");
    if (!await W.aspetta(function () { return /Torneo/.test(A.regoleDi(W.finestra("Giulia"))); }, 4000)) no("la riga «Si gioca così» di Giulia non dice del torneo («" + A.regoleDi(W.finestra("Giulia")) + "»)");
    await cominciaPoker(P, C, 3);
    var ids = nomiId(["Giulia", "Luca"]), lid = A.mioId("Luca");
    // 5 mani tranquille (tutti chiamano/passano): poi i bui salgono
    for (var m = 0; m < 5; m++) {
      await pkMano(C, ids, function () { return "passa"; }, 40000);
      if (!await W.aspetta(function () { return vm(C).stato !== "finemano"; }, 8000)) no("la mano " + (m + 2) + " non parte");
      if (m === 1) {   // Sara arriva a torneo iniziato: guarda
        var S = await tel("Sara", { hash: "gioco=poker&stanza=" + C, x: 555 });
        if (!await W.aspetta(function () { return (vm(C).guardano || []).indexOf(A.mioId("Sara")) >= 0; }, 6000)) no("Sara, arrivata a torneo iniziato, non è tra chi guarda");
        if (pkIo(vm(C), A.mioId("Sara"))) no("Sara si è seduta a torneo iniziato");
        if (!await W.aspetta(function () { return /Torneo in corso/.test(T(S)); }, 4000)) no("Sara non legge «Torneo in corso» («" + T(S).slice(0, 80) + "»)");
      }
      if (m === 2) {   // Luca ricarica: ritrova il posto con le sue fiches
        var prima = pkIo(vm(C), lid).stack;
        await W.ricarica("Luca"); spiaMonete(W.finestra("Luca"), 1500);
        if (!await W.aspetta(function () { var p = pkIo(vm(C), lid); return p && !(vm(C).players.find(function (x) { return x.id === lid; }) || {}).pausa; }, 6000)) no("Luca, ricaricato, non ritrova il posto");
        ids = nomiId(["Giulia", "Luca"]);
        if (Math.abs(pkIo(vm(C), lid).stack - prima) > 200) no("Luca ricaricato ha fiches strane (" + pkIo(vm(C), lid).stack + " invece di circa " + prima + ")");
      }
    }
    var v = vm(C);
    if (!v.bui || v.bui.grande !== 30) no("dopo 5 mani i bui non sono saliti a 15/30 (" + JSON.stringify(v.bui) + ", mano " + v.n + ")");
    if (!await W.aspetta(function () { return /bui 15\/30/.test(T(W.finestra("Giulia"))); }, 3000)) no("Giulia non legge «bui 15/30»");
    note.push("bui saliti alla mano " + v.n);
    // poi tutti all-in fino alla fine del torneo
    var fino = Date.now() + 150000, elim = {};
    while (Date.now() < fino && vm(C).fase === "gioco") {
      await pkMano(C, ids, function () { return "allin"; }, 30000);
      (vm(C).players || []).forEach(function (p) { if (p.elim) elim[p.nome] = p.elim; });
      await W.dorme(300);
    }
    v = vm(C);
    if (v.fase !== "fine") no("il torneo non arriva alla fine (" + v.fase + "/" + v.stato + ", " + st() + ")");
    var cl = v.classifica || [];
    if (cl.length !== 3 || cl[0].pos !== 1 || cl[0].punti !== 3000) no("classifica del torneo sbagliata: " + JSON.stringify(cl));
    note.push("classifica: " + cl.map(function (r) { return r.nome + " " + r.pos + "° " + r.punti; }).join(", "));
    note.push("uscite: " + JSON.stringify(elim));
    if (!P.__ris || P.__ris.length !== 1 || P.__ris[0].length !== 3) no("t.risultato non è arrivato una volta con 3 nomi (" + JSON.stringify(P.__ris) + ")");
    if (P.__ris[0].map(function (r) { return r.pos; }).join() !== cl.map(function (r) { return r.pos; }).join()) no("t.risultato ha posti diversi dalla classifica");
    if (!await W.aspetta(function () { return /Classifica del torneo/.test(T(W.finestra("Giulia"))); }, 4000)) no("Giulia non vede «Classifica del torneo»");
    note.push(await misure(W.finestra("Giulia"), "Giulia", ".classifica li, .fine-tasti button"));
    ["Paky", "Giulia", "Luca", "Sara"].forEach(function (n) { if (W.finestra(n).__salvaF) no(n + " ha salvato le monete durante il torneo (" + W.finestra(n).__salvaF + ")"); });
    // nuova partita: in saletta tutti e 4 con 1.000 (Sara seduta)
    if (!await W.aspetta(function () { return W.clicca(P, /Nuova partita|Rivincita|Un altro torneo/); }, 4000)) no("non trovo «Nuova partita» sulla classifica");
    if (!await W.aspetta(function () { return vm(C).fase === "lobby" && (vm(C).players || []).length === 4; }, 6000)) no("in saletta non ci sono tutti e 4 (" + st() + ", guardano " + JSON.stringify(vm(C).guardano) + ")");
    if (!(vm(C).players || []).every(function (p) { return p.stack === 1000; })) no("di nuovo in saletta non sono tutti a 1.000 (" + st() + ")");
    // torneo spento: le monete di prima
    await regola(P, /^\s*No\s*$/);
    if (!await W.aspetta(function () { return !vm(C).torneo && /Paky:700/.test(st()) && /Giulia:400/.test(st()) && /Luca:1000/.test(st()) && /Sara:1000/.test(st()); }, 4000)) no("spento il torneo le fiches non tornano quelle del profilo (" + st() + ")");
    ["Paky", "Giulia", "Luca", "Sara"].forEach(function (n) { if (W.finestra(n).__salvaF) no(n + " ha salvato le monete (" + W.finestra(n).__salvaF + ")"); });
    senzaErrori();
    return note.join(" · ");
  } });

  COPIONE.aggiungi("pk3", { nome: "Poker contro i Bot col torneo: fino alla fine, Fai vedere, Un altro torneo", fai: async function () {
    var P = await tel("Paky", { x: 0, monete: 5 });   // (5 monete: senza torneo non potrebbe sedersi)
    // il motore da solo: chi vince perché l'altro lascia può girare le carte una volta sola; chi ha perso no; dopo lo showdown no
    var PK = P.__POKER, M = PK.creaMotore("he");
    M.siedi({ id: "a", nome: "A", stack: 1000 }); M.siedi({ id: "b", nome: "B", stack: 1000 }); M.nuovaMano();
    M.azione(M.turno, "lascia");
    var vinc = M.esito && M.esito.vincitore, iv = M.trova(vinc), ip = 1 - iv;
    if (M.stato !== "finemano" || !vinc) no("motore: chi lascia non chiude la mano");
    if (M.puoSvelare(ip)) no("motore: chi ha lasciato può girare le carte");
    if (!M.svela(iv) || !M.esito.svela || M.svela(iv)) no("motore: «Fai vedere!» non va (o va due volte)");
    if (M.esito.svela.bluff !== PK.bluffDi(M.giocatori[iv].mano, [], "he", 2).bluff) no("motore: il bluff non è quello di bluffDi");
    var M2 = PK.creaMotore("he"); M2.siedi({ id: "a", nome: "A", stack: 1000 }); M2.siedi({ id: "b", nome: "B", stack: 1000 }); M2.nuovaMano();
    M2.azione(M2.turno, "lascia"); if (!M2.tace(M2.trova(M2.esito.vincitore)) || M2.puoSvelare(M2.trova(M2.esito.vincitore))) no("motore: dopo «Segreto» si possono ancora girare");
    P.__imp = { torneo: true, avversari: 3, difficolta: "facile", ogni: 5 };
    await avviaLocale(P, "Poker", "Contro i Bot");
    if (!await W.aspetta(function () { return /Torneo · bui 10\/20/.test(T(P)); }, 5000)) no("al tavolo non c'è «🏆 Torneo · bui 10/20» («" + T(P).slice(0, 80) + "»)");
    var fino = Date.now() + 200000, svelate = 0, mani = 0, visto = {}, rilanci = Date.now() + 120000;
    while (Date.now() < fino && !/Classifica del torneo/.test(T(P))) {
      var d = P.document;
      if (/Fai vedere!/.test(T(P))) { await W.dorme(700); W.clicca(P, /Fai vedere!/); svelate++; await W.dorme(900); if (!d.querySelector(".pk-bluff")) no("toccato «Fai vedere!» non compare il cartello"); }
      else if (d.querySelector(".pk-azioni .pk-btn.lascia")) {
        // prima rilanci piccoli (i Bot lasciano spesso: si vince senza mostrare), dopo il primo «Fai vedere!» tutto dentro
        if (!svelate && Date.now() < rilanci) {
          var bp = d.querySelector(".pk-azioni .pk-btn.punta");
          if (bp && !/^All-in/.test(bp.textContent)) { bp.click(); await W.dorme(700); W.clicca(P, /^Piatto$/, ".pk-azioni .pk-btn.piccolo"); var okb = d.querySelector(".pk-azioni .pk-btn.ok"); if (okb) okb.click(); }
          else await pkHost(P, "passa");
        } else await pkHost(P, "allin");
        mani++;
      }
      else if (/Servito/.test(T(P))) W.clicca(P, /Servito/);
      var info = (d.querySelector(".pk-info") || {}).textContent || ""; visto[info.replace(/ · ⬆️.*$/, "")] = 1;
      await W.dorme(400);
    }
    if (!/Classifica del torneo/.test(T(P))) no("il torneo contro i Bot non finisce (" + T(P).slice(0, 80) + ")");
    if (!P.__ris || P.__ris.length !== 1) no("t.risultato non è arrivato una volta (" + JSON.stringify(P.__ris) + ")");
    if (P.__salvaF) no("contro i Bot nel torneo si sono salvate monete (" + P.__salvaF + ")");
    var pos = P.__ris[0][0].pos;
    await misure(P, "Paky", ".classifica li, .piede button");
    if (!W.clicca(P, /Un altro torneo/)) no("non c'è «🔄 Un altro torneo»");
    if (!await W.aspetta(function () { return /Torneo · bui 10\/20/.test(T(P)) && /Tu · 1\.000 fiches|Tu · 9[0-9]0 fiches|Tu · 98/.test(T(P)); }, 6000)) no("«Un altro torneo» non riparte da 1.000 coi bui 10/20 («" + T(P).slice(0, 100) + "»)");
    W.clicca(P, /^‹$/, ".pk-tastino"); await W.dorme(800);
    if (P.__ris.length !== 2) no("uscendo dal secondo torneo t.risultato non arriva (" + P.__ris.length + ")");
    senzaErrori();
    return "arrivato " + pos + "° · mani all-in " + mani + " · «Fai vedere!» " + svelate + " · bui visti: " + Object.keys(visto).filter(Boolean).join(" | ");
  } });

  // =================== BLACK JACK ===================
  function bjSeat(v, nome) { return (v.giocatori || []).findIndex(function (g) { return g.nome === nome; }); }
  // gioca le mani finché non c'è la classifica: tutti puntano 10 e stanno; umani = chi c'è (Paky è l'host)
  async function bjFinoAllaFine(C, umani, ogni) {
    var fatto = {}, fino = Date.now() + 120000, P = W.finestra("Paky");
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), k = v.mano + "|" + v.fase + "|" + v.turno;
      if (ogni) await ogni(v);
      v = vm(C);
      if (v.fase === "punta") {
        umani.forEach(function (n) { if (n === "Paky") return; var g = v.giocatori[bjSeat(v, n)]; if (g && !g.puntata && g.fiches > 0 && !fatto[k + n]) { var h = W.reteDi(n); if (h) { h.invia({ t: "mossa", kind: "punta", val: 10 }); fatto[k + n] = 1; } } });
        if (v.giocatori[0] && !v.giocatori[0].puntata) W.clicca(P, /^Punta /);
      } else if (v.fase === "assic") {
        umani.forEach(function (n) { if (n !== "Paky" && !fatto[k + n]) { var h = W.reteDi(n); if (h) { h.invia({ t: "mossa", kind: "assic", si: false }); fatto[k + n] = 1; } } });
        W.clicca(P, /^No$/);
      } else if (v.fase === "gioca") {
        if (v.turno === 0) W.clicca(P, /^Stai$/);
        else umani.forEach(function (n) { var g = v.giocatori[v.turno]; if (n !== "Paky" && bjSeat(v, n) === v.turno && !fatto[k + n + g.attiva]) { var h = W.reteDi(n); if (h) { h.invia({ t: "mossa", kind: "azione", mossa: "stai" }); fatto[k + n + g.attiva] = 1; } } });
      } else if (v.fase === "esito") W.clicca(P, /Classifica ▶|Nuova mano/);
      await W.dorme(300);
    }
    if (vm(C).fase !== "fine") no("il Black Jack non arriva alla classifica (fase " + vm(C).fase + ")");
    return vm(C);
  }
  function fiche(v) { return (v.giocatori || []).map(function (g) { return g.nome + ":" + g.fiches; }).join(" "); }

  COPIONE.aggiungi("bj1", { nome: "Black Jack nella Sala: Torneo a fiches uguali, Classifica della serata, Rivincita a 1.000", fai: async function () {
    // la Sala coi telefoni spiati (Paky 700 monete, Giulia 0 = di prova, Luca 2.000); 2 mani sole (w.__imp: solo per la prova)
    var P = await tel("Paky", { x: 0, salaSempre: true, monete: 700 }), S = await A.apriSalaNuova("Paky"), note = [];
    await tel("Giulia", { hash: "sala=" + S, x: 185, salaSempre: true, monete: 0 });
    await tel("Luca", { hash: "sala=" + S, x: 370, salaSempre: true, monete: 2000 });
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === 3; }, 10000)) no("nella Sala non arrivano in 3");
    P.__imp = { mani: 2 };
    var C = await A.lanciaDallaSala("Paky", S, "Black Jack");
    if (!await W.aspetta(function () { return /Regole/.test(T(P)); }, 4000)) no("nella saletta del Black Jack non c'è ⚙️ Regole");
    await regola(P, /Fiches uguali/);
    if (!await W.aspetta(function () { return /Torneo/.test(A.regoleDi(W.finestra("Giulia"))); }, 4000)) no("la riga «Si gioca così» di Giulia non dice del torneo («" + A.regoleDi(W.finestra("Giulia")) + "»)");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "punta"; }, 15000)) no("il Black Jack non parte");
    var v = vm(C);
    if (!v.uguali) no("nella foto manca «uguali»");
    if (!(v.giocatori || []).every(function (g) { return g.fiches === 1000 && !g.prova; })) no("al via non sono tutti a 1.000 senza «prova» (" + fiche(v) + ")");
    v = await bjFinoAllaFine(C, ["Paky", "Giulia", "Luca"]);
    if (v.mano !== 2) note.push("(mani giocate: " + v.mano + ")");
    var cl = v.classifica || [];
    if (cl.length !== 3) no("la classifica non ha 3 righe");
    if (!await W.aspetta(function () { var t = vm(S).torneo; return t && t.n === 1 && ["Paky", "Giulia", "Luca"].every(function (n) { return t.punti[n] != null; }); }, 6000)) no("i punti del torneo non arrivano nella Classifica della serata (" + JSON.stringify(vm(S).torneo) + ")");
    note.push("serata: " + JSON.stringify(vm(S).torneo.punti));
    ["Paky", "Giulia", "Luca"].forEach(function (n) { if (W.finestra(n).__salvaF) no(n + " ha salvato monete nel torneo (" + W.finestra(n).__salvaF + ")"); });
    if (!await W.aspetta(function () { return /Classifica del torneo/.test(T(W.finestra("Giulia"))); }, 4000)) no("Giulia non legge «Classifica del torneo» sul podio");
    note.push(await misure(W.finestra("Giulia"), "Giulia", ".bj-pr, .fine-tasti button, .bj-azioni button"));
    // la Rivincita: tutti di nuovo a 1.000
    if (!await W.aspetta(function () { return W.clicca(P, /Rivincita/); }, 4000)) no("non trovo «↻ Rivincita»");
    if (!await W.aspetta(function () { var x = vm(C); return x.fase === "punta" && x.mano === 0 && (x.giocatori || []).every(function (g) { return g.fiches === 1000; }); }, 15000)) no("dopo la Rivincita non sono tutti a 1.000 (" + fiche(vm(C)) + ")");
    senzaErrori();
    return note.join(" · ");
  } });

  COPIONE.aggiungi("bj2", { nome: "Black Jack in stanza col torneo: chi arriva guarda, chi ricarica ritrova il posto, serie nuova con tutti", fai: async function () {
    var P = await tel("Paky", { x: 0, monete: 700 }); P.__imp = { mani: 2 };
    var C = await stanza(P, "Black Jack", "blackjack", ["Giulia"], { Giulia: 300 }), note = [];
    if (!await W.aspetta(function () { return /Giulia/.test(T(P)); }, 6000)) no("Giulia non arriva in saletta");
    await regola(P, /Fiches uguali/);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 4000)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "punta"; }, 15000)) no("il Black Jack non parte");
    if (vm(C).maniTot !== 2) note.push("(mani: " + vm(C).maniTot + ")");
    var Sara = null, ricaricata = false, visti = [];
    var v = await bjFinoAllaFine(C, ["Paky", "Giulia"], async function (v) {
      var kv = v.fase + v.mano + (Sara ? "S" : ""); if (visti[visti.length - 1] !== kv) visti.push(kv);
      if (!Sara && v.fase === "gioca") {
        Sara = await tel("Sara", { hash: "gioco=blackjack&stanza=" + C, x: 370 });
        if (!await W.aspetta(function () { return (vm(C).guardano || []).length === 1; }, 6000)) no("Sara, arrivata a torneo iniziato, non guarda (" + JSON.stringify(vm(C).guardano) + ", " + fiche(vm(C)) + ")");
        if (bjSeat(vm(C), "Sara") >= 0) no("Sara si è seduta a torneo iniziato");
        if (!await W.aspetta(function () { return /Torneo in corso/.test(T(Sara)); }, 5000)) no("Sara non legge «Torneo in corso» («" + T(Sara).slice(0, 80) + "»)");
      }
      if (Sara && !ricaricata && v.fase === "punta" && v.mano === 1) {
        ricaricata = true;
        var prima = v.giocatori[bjSeat(v, "Giulia")].fiches;
        await W.ricarica("Giulia"); spiaMonete(W.finestra("Giulia"), 300);
        if (!await W.aspetta(function () { var x = vm(C), g = x.giocatori[bjSeat(x, "Giulia")]; return g && !g.via; }, 6000)) no("Giulia ricaricata non ritrova il posto");
        var g2 = vm(C).giocatori[bjSeat(vm(C), "Giulia")];
        if (g2.fiches + (g2.puntata || 0) !== prima) no("Giulia ricaricata ha " + g2.fiches + " fiches invece di " + prima);
        if (!await W.aspetta(function () { return W.finestra("Giulia").document.querySelector(".bj-wrap"); }, 5000)) no("Giulia ricaricata non vede il tavolo");
      }
    });
    if (!ricaricata) no("la ricarica di Giulia non è stata provata (fasi viste: " + visti.join(" ") + ")");
    ["Paky", "Giulia", "Sara"].forEach(function (n) { if (W.finestra(n).__salvaF) no(n + " ha salvato monete nel torneo (" + W.finestra(n).__salvaF + ")"); });
    // la serie nuova (i tasti di fine del core: «Nuova partita (stessi amici)»): Sara si siede, tutti a 1.000
    if (!await W.aspetta(function () { return W.clicca(P, /Nuova partita|Un altro torneo|Rivincita/); }, 5000)) no("non trovo «Nuova partita» a fine torneo («" + T(P).slice(-120) + "»)");
    if (!await W.aspetta(function () { var x = vm(C); return x.fase === "punta" && bjSeat(x, "Sara") >= 0 && (x.giocatori || []).every(function (g) { return g.fiches === 1000; }); }, 10000)) no("alla serie nuova Sara non è seduta o non sono tutti a 1.000 (" + fiche(vm(C)) + ")");
    if (!await W.aspetta(function () { return /Punta /.test(T(W.finestra("Sara"))); }, 5000)) no("Sara non può puntare alla serie nuova («" + T(W.finestra("Sara")).slice(-80) + "»)");
    senzaErrori();
    return "ok " + note.join(" · ");
  } });

  COPIONE.aggiungi("bj3", { nome: "Black Jack sullo stesso telefono col torneo: 2 giocatori (Punti della serata) e da solo (Un altro torneo)", fai: async function () {
    var P = await tel("Paky", { x: 0, monete: 700 }); P.__imp = { uguali: true, mani: 2 };
    await avviaLocale(P, "Black Jack", "Su questo telefono", ["Paky", "Giulia"]);
    var fino = Date.now() + 90000;
    while (Date.now() < fino && !/Punti della serata/.test(T(P))) {
      if (/^Punta /m.test(P.document.querySelector(".bj-hero") ? P.document.querySelector(".bj-hero").innerText : "")) W.clicca(P, /^Punta /);
      W.clicca(P, /^No$/); W.clicca(P, /^Stai$/); W.clicca(P, /Nuova mano|Classifica ▶/);
      await W.dorme(400);
    }
    if (!/Punti della serata/.test(T(P))) no("in due col torneo alla fine non c'è «🏆 Punti della serata ▶» («" + T(P).slice(-100) + "»)");
    if (!/Classifica del torneo/.test(T(P))) no("il podio non dice «Classifica del torneo»");
    if (P.__salvaF) no("sullo stesso telefono col torneo si sono salvate monete");
    if (P.__ris && P.__ris.length) no("t.risultato arriva già prima del tasto (doppio con t.fine)");
    W.clicca(P, /Punti della serata/);
    if (!await W.aspetta(function () { return P.__fine && P.__fine.length === 1; }, 3000)) no("«Punti della serata» non chiama t.fine");
    var cl = P.__fine[0];
    // da solo: «Un altro torneo» riparte a 1.000
    await W.ricarica("Paky"); P = W.finestra("Paky"); spiaMonete(P, 700); P.__imp = { uguali: true, mani: 1 };
    await avviaLocale(P, "Black Jack", "Su questo telefono", ["Paky"]);
    fino = Date.now() + 60000;
    while (Date.now() < fino && !/Un altro torneo/.test(T(P))) { W.clicca(P, /^Punta /); W.clicca(P, /^No$/); W.clicca(P, /^Stai$/); W.clicca(P, /Classifica ▶/); await W.dorme(400); }
    if (!/Un altro torneo/.test(T(P))) no("da solo col torneo non c'è «🔄 Un altro torneo ▶»");
    W.clicca(P, /Un altro torneo/);
    if (!await W.aspetta(function () { return /1\.000 🪙/.test(T(P)) && /Punta /.test(T(P)); }, 5000)) no("«Un altro torneo» non riparte da 1.000 («" + T(P).slice(0, 120) + "»)");
    if (P.__salvaF) no("da solo col torneo si sono salvate monete");
    senzaErrori();
    return "t.fine: " + JSON.stringify(cl);
  } });

  // =================== HORTO MUSO ===================
  function frusta(w) { var b = w.document.querySelector(".ho-frusta"); if (b && !b.disabled) b.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true })); }
  // la classifica del Gran Premio sullo schermo: [{ nome, piu, tot }]
  function righeGP(w) {
    return [].map.call(w.document.querySelectorAll(".ho-gp-riga"), function (r) {
      return { nome: (r.querySelector(".nm") || {}).textContent.replace(/ \(tu\)$/, ""), piu: +((r.querySelector(".ho-gp-piu") || {}).textContent || "0").replace("+", "") || 0, tot: +((r.querySelector(".ho-gp-tot") || {}).textContent || "0").replace(/\./g, "") };
    });
  }
  async function corriFinoA(w, cond, ms, chi) {   // frusta a ritmo (chi: altri telefoni che mandano la frustata) finché cond()
    var fino = Date.now() + (ms || 60000), n = 0;
    while (Date.now() < fino) {
      if (cond()) return true;
      if (n++ % 2 === 0) { frusta(w); (chi || []).forEach(function (x) { var h = W.reteDi(x); if (h) h.invia({ t: "frusta" }); }); }
      await W.dorme(350);
    }
    return cond();
  }

  COPIONE.aggiungi("ho1", { nome: "Horto Muso contro i Bot: Gran Premio a 3 corse (Avanti, conto alla rovescia, punti doppi, podio)", fai: async function () {
    var P = await tel("Paky", { x: 0 }); P.__imp = { gp: true, cavalli: 3, difficolta: "facile" };
    await avviaLocale(P, "Horto Muso", "Contro i Bot");
    var note = [];
    if (!await W.aspetta(function () { return /corsa 1 di 3/.test(T(P)); }, 3000)) no("al via non c'è «Gran Premio · corsa 1 di 3»");
    // 1ª corsa
    if (!await corriFinoA(P, function () { return P.document.querySelector(".ho-gp-lista"); }, 70000)) no("dopo la prima corsa non c'è la classifica a punti");
    var r1 = righeGP(P);
    if (r1.length !== 3 || r1.map(function (r) { return r.piu; }).sort(function (a, b) { return b - a; }).join() !== "10,6,4") no("punti della 1ª corsa sbagliati: " + JSON.stringify(r1));
    if (!/corsa 1 di 3/.test(T(P))) no("la classifica non dice «corsa 1 di 3»");
    note.push(await misure(P, "Paky", ".ho-gp-riga, .piede button"));
    if (P.__ris && P.__ris.length) no("t.risultato arriva già dopo la prima corsa");
    var t0 = Date.now(); W.clicca(P, /Avanti/);
    if (!await W.aspetta(function () { return /corsa 2 di 3/.test(T(P)) && P.document.querySelector(".ho-scena"); }, 3000)) no("«⏩ Avanti» non fa partire subito la corsa 2");
    note.push("Avanti → corsa 2 in " + ((Date.now() - t0) / 1000).toFixed(1) + " s");
    // 2ª corsa: niente Avanti, parte da sola col conto
    if (!await corriFinoA(P, function () { return P.document.querySelector(".ho-gp-lista"); }, 70000)) no("dopo la seconda corsa non c'è la classifica");
    if (!/l'ultima: punti doppi/.test(T(P))) no("prima dell'ultima corsa non si dice dei punti doppi");
    if (!await W.aspetta(function () { return /Si va avanti tra/.test(T(P)); }, 2000)) no("non c'è «Si va avanti tra…»");
    var t1 = Date.now();
    if (!await W.aspetta(function () { return /Ultima corsa: punti doppi/.test(T(P)); }, 16000)) no("la corsa 3 non parte da sola col conto alla rovescia (o manca la scritta dei punti doppi)");
    note.push("conto → corsa 3 dopo " + Math.round((Date.now() - t1) / 1000) + " s");
    var prima = righeGP(P); void prima;
    if (!await corriFinoA(P, function () { return /Gran Premio|Hai vinto il Gran Premio/.test(T(P)) && P.document.querySelector(".ho-gp-podio"); }, 70000)) no("dopo la terza corsa non c'è il podio del Gran Premio");
    var fin = righeGP(P), totali = [].map.call(P.document.querySelectorAll(".ho-gp-podio .cv"), function (x) { return parseInt(x.textContent.replace(/\./g, ""), 10); });
    var tutti = totali.concat(fin.map(function (r) { return r.tot; }));
    var s = tutti.reduce(function (a, b) { return a + b; }, 0);
    if (s !== (20 + 20 + 40)) no("i punti del Gran Premio non tornano: somma " + s + " invece di 80 (" + JSON.stringify(tutti) + ")");
    if (!P.__ris || P.__ris.length !== 1) no("t.risultato non è arrivato una volta sola alla fine (" + JSON.stringify(P.__ris) + ")");
    note.push("podio " + JSON.stringify(totali) + ", mio posto " + P.__ris[0][0].pos);
    note.push(await misure(P, "Paky", ".ho-gradino, .piede button"));
    if (!W.clicca(P, /Un altro Gran Premio/)) no("non c'è «🏆 Un altro Gran Premio»");
    if (!await W.aspetta(function () { return /corsa 1 di 3/.test(T(P)); }, 3000)) no("«Un altro Gran Premio» non riparte dalla corsa 1");
    W.clicca(P, /^‹$/, ".ho-esci"); await W.dorme(500);
    senzaErrori();
    return note.join(" · ");
  } });

  COPIONE.aggiungi("ho2", { nome: "Horto Muso online in 3, Gran Premio con 8 cavalli: Avanti (2 su 3), ricarica, conto, punti doppi, fine", fai: async function () {
    var P = await tel("Paky", { x: 0 }), C = await stanza(P, "Horto Muso", "horto", ["Giulia", "Luca"]), note = [];
    var G = W.finestra("Giulia");
    if (!await W.aspetta(function () { return /Giulia/.test(T(P)) && /Luca/.test(T(P)); }, 8000)) no("in saletta non arrivano Giulia e Luca");
    await regola(P, /3 corse a punti/, async function (f) { var otto = [].find.call(f.querySelectorAll(".modo-chip"), function (c) { return c.textContent.trim() === "8"; }); if (otto) otto.click(); });
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 4000)) no("non trovo «Comincia la corsa»");
    if (!await W.aspetta(function () { return /corsa 1 di 3/.test(T(G)); }, 15000)) no("Giulia non vede «corsa 1 di 3» al via");
    var finita = function () { return ["Paky", "Giulia", "Luca"].every(function (n) { return W.finestra(n).document.querySelector(".ho-gp-lista"); }); };
    if (!await corriFinoA(P, finita, 80000, ["Giulia", "Luca"])) no("dopo la 1ª corsa non tutti vedono la classifica a punti");
    var r1 = righeGP(G);
    if (r1.length !== 8) no("la classifica di Giulia non ha 8 righe (" + r1.length + ")");
    if (r1.reduce(function (a, r) { return a + r.tot; }, 0) !== 26) no("i punti della 1ª corsa non fanno 26 (" + JSON.stringify(r1) + ")");
    note.push(await misure(G, "Giulia", ".ho-gp-riga, .piede button"));
    if (P.__ris && P.__ris.length) no("t.risultato arriva dopo la prima corsa");
    // Giulia e Luca toccano «⏩ Avanti»: 2 su 3, si parte subito
    W.clicca(G, /Avanti/);
    await W.aspetta(function () { return /1 su 3/.test(T(W.finestra("Luca"))); }, 2500);
    if (!/1 su 3/.test(T(P))) note.push("(Paky non legge «1 su 3»)");
    var t0 = Date.now(); W.clicca(W.finestra("Luca"), /Avanti/);
    if (!await W.aspetta(function () { return /corsa 2 di 3/.test(T(P)) && P.document.querySelector(".ho-scena"); }, 3000)) no("con 2 su 3 «⏩ Avanti» la corsa 2 non parte subito");
    note.push("2 su 3 → corsa 2 in " + ((Date.now() - t0) / 1000).toFixed(1) + " s");
    // 2ª corsa: Luca ricarica durante la classifica e la ritrova (dritto alla classifica, niente photo finish da capo).
    // Con la finestra del browser nascosta i tempi del browser rallentano molto: qui il conto alla rovescia dell'host si
    // ferma (t.contoAvanti finto, solo per la prova) e si riparte con «⏩ Avanti»; il conto che parte da solo lo prova ho1
    var contoVero = P.__t.contoAvanti;
    P.__t.contoAvanti = function (nodo) { if (nodo) nodo.textContent = "Si va avanti tra 12…"; return { ferma: function () {} }; };
    if (!await corriFinoA(P, function () { return P.document.querySelector(".ho-gp-lista"); }, 80000, ["Giulia", "Luca"])) no("dopo la 2ª corsa Paky non vede la classifica");
    await W.ricarica("Luca");
    var primo = await W.aspetta(function () { var L = W.finestra("Luca"), d = L && L.document; if (!d) return null; return d.querySelector(".ho-gp-lista") ? (/Si va avanti tra/.test(T(L)) ? "classifica" : null) : d.querySelector(".ho-ff") ? "fotofinish" : d.querySelector(".ho-scena") ? "corsa" : null; }, 25000, 60);
    if (primo !== "classifica") no("Luca ricaricato non va dritto alla classifica col conto (vede: " + primo + ", «" + T(W.finestra("Luca")).slice(0, 80) + "»)");
    note.push("Luca rientrato: classifica col conto");
    await W.aspetta(function () { return W.finestra("Giulia").document.querySelector(".ho-gp-lista"); }, 25000);
    W.clicca(W.finestra("Giulia"), /Avanti/); await W.dorme(500); W.clicca(W.finestra("Luca"), /Avanti/);
    if (!await W.aspetta(function () { return /Ultima corsa: punti doppi/.test(T(G)) && G.document.querySelector(".ho-scena"); }, 15000)) no("la 3ª corsa non parte (o Giulia non legge «Ultima corsa: punti doppi!»)");
    P.__t.contoAvanti = contoVero;
    // 3ª corsa
    var fineGP = function () { return ["Paky", "Giulia", "Luca"].every(function (n) { return W.finestra(n).document.querySelector(".ho-gp-podio"); }); };
    if (!await corriFinoA(P, fineGP, 80000, ["Giulia", "Luca"])) no("dopo la 3ª corsa non tutti vedono il podio del Gran Premio");
    var tot = [].map.call(G.document.querySelectorAll(".ho-gp-podio .cv"), function (x) { return parseInt(x.textContent.replace(/\./g, ""), 10); }).concat(righeGP(G).map(function (r) { return r.tot; }));
    var s = tot.reduce(function (a, b) { return a + b; }, 0);
    if (s !== 26 + 26 + 52) no("i punti del Gran Premio non fanno 104 (" + s + ": " + JSON.stringify(tot) + ")");
    if (!P.__ris || P.__ris.length !== 1 || P.__ris[0].length !== 3) no("t.risultato non arriva una volta con 3 persone (" + JSON.stringify(P.__ris) + ")");
    note.push("risultato " + JSON.stringify(P.__ris[0]));
    note.push(await misure(G, "Giulia", ".ho-gradino, .ho-gp-riga, .fine-tasti button"));
    // «Nuova partita (stessi amici)»: un altro Gran Premio, dalla corsa 1
    if (!await W.aspetta(function () { return W.clicca(P, /Nuova partita|Un altro Gran Premio|Rivincita/); }, 4000)) no("non trovo «Nuova partita» sul podio");
    if (!await W.aspetta(function () { return /corsa 1 di 3/.test(T(G)) || G.document.querySelector(".saletta-schermo"); }, 8000)) no("«Nuova partita» non porta a un altro Gran Premio");
    senzaErrori();
    return note.join(" · ");
  } });
})();

// PROVE DI PAROLA D'ORDINE, giro 2 (22 ott 2026), compito «Il tabellone grande, sempre in vista, in stile C» (js/games/ordine.js).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("ordine2/tabellone.js"); await COPIONE.prova("o2t1")
// Con Edge invisibile: prova.js --porta 8995 --carica ordine2/tabellone.js --prova o2t1,o2t2,o2t3,o2t4,o2t5,o2t6 --rifai
// o2t1 tabellone grande (misure a 360x640, 390x844, 412x915), segni nel DOM, chat a striscia · o2t2 parole lunghe su una riga ·
// o2t3 il tabellone non sparisce (indizio, sbaglio, capo che pensa, «pensava a», clessidra dopo la presentazione) · o2t4 il
// Bot in un secondo · o2t5 la presentazione (corta, un tocco la salta, alla rivincita solo i capi nuovi) · o2t6 a 360x640:
// saletta senza scorrere, 3 squadre in 12, nella Sala
// (gli scenari sono scritti in fondo; qui sopra gli aiuti, che usa anche lo strumento delle foto fuori dal progetto: COPIONE.o2t)
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T;
  var INDIZI = ["QUOKKA", "ZEFIRO", "GNOMO", "YETI", "FIORDO", "WAFER", "OBLO", "JAZZ", "ZUAVO", "KIWI", "PUFFO", "VICHINGO", "BRADIPO", "KOALA", "MUSICA", "OCEANO"];

  // ---------------- aiuti ----------------
  function nota(N, x) { N.push(x); }
  function senzaErrori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  function chiDi(C, nome) { return ((vm(C).players || []).filter(function (p) { return p.nome === nome; }))[0] || null; }
  function idDi(C, nome) { var p = chiDi(C, nome); return p ? p.id : null; }
  function nomeDi(C, id) { var p = ((vm(C).players || []).filter(function (x) { return x.id === id; }))[0]; return p ? p.nome : null; }
  function carte(w) { return w.document.querySelectorAll(".or-tab .or-carta"); }
  function chiaveDa(w) { return [].map.call(carte(w), function (b) { var m = / c(\d|n|x)(\s|$)/.exec(" " + b.className + " "); return m ? (/\d/.test(m[1]) ? +m[1] : m[1]) : null; }); }
  function cart(w) { var c = w.document.querySelector(".or-cart.su"); return c ? c.textContent : ""; }
  function bottone(w, re, sel) { return [].filter.call(w.document.querySelectorAll(sel || "button"), function (b) { return re.test(b.textContent) && b.offsetParent && !b.disabled; })[0] || null; }
  function manda(nome, m) {
    if (nome === "Paky") { var u = W.finestra("Paky").__ORDINE.ui; if (!u) no("Paky non ha il tavolo"); u.cb.manda(m); return; }
    var h = W.reteDi(nome); if (!h) no("non trovo la rete di " + nome); h.invia(m);
  }
  function indizioBuono(w, C, usati) {
    var tab = vm(C).tab || [];
    for (var i = 0; i < INDIZI.length; i++) if ((usati || []).indexOf(INDIZI[i]) < 0 && !w.__ORDINE.erroreIndizio(INDIZI[i], tab)) return INDIZI[i];
    no("nessun indizio buono per questo tabellone");
  }
  async function indizio(C, nomeCapo, n, usati, X) {   // (X: una partitaGrande, se il capo può essere un amico virtuale)
    var w = W.finestra(nomeCapo) || W.finestra("Paky"), p = indizioBuono(w, C, usati);
    (X && X.mossa ? X.mossa : manda)(nomeCapo, { t: "indizio", parola: p, n: n });
    if (!await W.aspetta(function () { var v = vm(C); return v.passo === "indovina" && v.indizio && v.indizio.parola === p; }, 6000)) no("l'indizio " + p + " di " + nomeCapo + " non arriva (" + vm(C).passo + ")");
    if (usati) usati.push(p);
    return p;
  }
  function coperteDi(C, chiave, col) { var v = vm(C); return chiave.map(function (c, i) { return c === col && !v.tab[i].g ? i : -1; }).filter(function (i) { return i >= 0; }); }
  async function gira(C, chi, i) {
    var l0 = vm(C).log || [], n0 = l0.length ? l0[l0.length - 1].n : 0;
    manda(chi, { t: "gira", i: i });
    if (!await W.aspetta(function () { var v = vm(C); var l = v.log || []; return l.length && l[l.length - 1].n > n0 && !v.sospeso; }, 9000, 50)) no(chi + " non riesce a girare " + vm(C).tab[i].w);
  }
  function indovinoDi(C, k) { var v = vm(C); return ((v.players || []).filter(function (p) { return p.team === k && p.id !== v.capo[k] && !p.via && !p.bot; })[0] || {}).nome; }
  // la regia ferma sul tabellone (niente scene in corso, telecamera sul maxischermo)
  function calmo(w) {
    var ui = w.__ORDINE && w.__ORDINE.ui; if (!ui || !ui.S) return false;
    if (ui.inScena || (ui.coda && ui.coda.length)) return false;
    if (ui.S.shot && ui.S.R && ui.S.shot() !== ui.S.R.schermo) return false;
    return !w.document.querySelector(".or-vignetta.su, .st-terzo.on");
  }
  // la telecamera è sul tabellone (il maxischermo) in questo momento
  function suTabellone(w) { var ui = w.__ORDINE && w.__ORDINE.ui; return !!(ui && ui.S && ui.S.shot && ui.S.R && ui.S.shot() === ui.S.R.schermo && !ui.S.rec.classList.contains("on")); }
  async function chiaveDi(nomeCapo) {
    var c = await W.aspetta(function () { var x = chiaveDa(W.finestra(nomeCapo)); return x.length && x.every(function (y) { return y != null; }) && x; }, 6000);
    if (!c) no(nomeCapo + " (capo) non vede la chiave");
    return c;
  }
  // apre la stanza (fuori dalla Sala) con gli amici, sistema squadre e capi. sq = { nome: squadra }, capi = [nomeRossi, nomeBlu]
  async function partita(amici, sq, capi, opzP) {
    var P = await W.apriTel("Paky", Object.assign({ x: 0 }, opzP || {}));
    var C = await W.apriStanza(P, "Parola d'ordine");
    for (var i = 0; i < amici.length; i++) {
      await W.apriTel(amici[i], { hash: "gioco=ordine&stanza=" + C, x: Math.min(185, 1400 / amici.length) * (i + 1) });
      var quanti = i + 2;
      if (!await W.aspetta(function () { return (vm(C).players || []).length >= quanti; }, 8000)) no(amici[i] + " non entra");
    }
    if (sq) {
      Object.keys(sq).forEach(function (n) { if (n !== "Paky") W.reteDi(n).invia({ t: "squadra", s: sq[n] }); });
      if (!await W.aspetta(function () { return Object.keys(sq).every(function (n) { var p = chiDi(C, n); return p && p.team === sq[n]; }); }, 5000))
        no("le squadre non si sistemano: " + JSON.stringify((vm(C).players || []).map(function (p) { return p.nome + p.team; })));
    }
    (capi || []).forEach(function (n) { if (n !== "Paky") W.reteDi(n).invia({ t: "capo" }); });
    if (capi && !await W.aspetta(function () { var c = vm(C).capo || []; return capi.every(function (n, k) { return c[k] === idDi(C, n); }); }, 5000)) no("i capi non sono " + capi.join(" e "));
    return { P: P, C: C, nomi: ["Paky"].concat(amici), capi: capi };
  }
  // una stanza grande senza tanti telefoni (12 telefoni veri in una pagina sola rallentano tutto): l'host Paky (con la spia
  // delle regole di preferiti/ordine.js: o.imp = { squadre: 3 }…), qualche amico vero (o.veri) e gli altri «virtuali» (o.virtuali)
  // che entrano e giocano mandando le loro mosse direttamente all'host (id "v1", "v2"…, avatar a caso). X.mossa(nome, m) vale
  // per tutti; X.nomi sono solo i telefoni veri
  async function partitaGrande(o) {
    if (!W.__prepPO) await COPIONE.carica("preferiti/ordine.js");
    var P = await W.apriTel("Paky", Object.assign({ x: 0, po: true, prima: function (w) { w.__imp = o.imp || {}; } }, o.opzP || {}));
    var C = await W.apriStanza(P, "Parola d'ordine"), veri = o.veri || [], virt = o.virtuali || [], idV = {};
    for (var i = 0; i < veri.length; i++) {
      await W.apriTel(veri[i], { hash: "gioco=ordine&stanza=" + C, x: 185 * (i + 1) });
      var q = i + 2; if (!await W.aspetta(function () { return (vm(C).players || []).length >= q; }, 8000)) no(veri[i] + " non entra");
    }
    var wP = W.finestra("Paky"), cbH = wP.__cbH && wP.__cbH.ordine; if (!cbH) no("niente spia dell'host");
    virt.forEach(function (n, j) { idV[n] = "v" + (j + 1); cbH.onMsg(idV[n], { t: "join", nome: n, omino: wP.SGOmino ? wP.SGOmino.casuale(n) : null }); });
    var tot = 1 + veri.length + virt.length;
    if (!await W.aspetta(function () { return (vm(C).players || []).length >= tot; }, 8000)) no("non entrano in " + tot + " (" + (vm(C).players || []).length + ")");
    var X = { P: P, C: C, nomi: ["Paky"].concat(veri), virtuali: idV };
    X.mossa = function (nome, m) { if (idV[nome]) { W.finestra("Paky").__cbH.ordine.onMsg(idV[nome], m); return; } manda(nome, m); };
    X.capiNomi = function () { return (vm(C).capo || []).map(function (id) { return nomeDi(C, id); }); };
    return X;
  }
  async function comincia(X) {
    if (!await W.aspetta(function () { return W.clicca(X.P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(X.C).fase === "gioco" && vm(X.C).tab; }, 20000)) no("non comincia (" + vm(X.C).fase + ")");
    if (!await W.aspetta(function () { return X.nomi.every(function (n) { var w = W.finestra(n); return w && carte(w).length >= 20; }); }, 15000)) no("non tutti vedono il tabellone");
  }
  // aspetta che tutti abbiano la regia ferma sul tabellone (dopo la presentazione)
  async function tuttiCalmi(nomi, ms) {
    if (!await W.aspetta(function () { return nomi.every(function (n) { return calmo(W.finestra(n)); }); }, ms || 12000)) no("la regia non si ferma sul tabellone (" + nomi.filter(function (n) { return !calmo(W.finestra(n)); }).join(", ") + ")");
  }
  // a metà partita: girate di ogni tipo (giuste delle due squadre, una di nessuno, la parola d'oro se c'è), poi tocca alla
  // squadra «finale» con l'indizio dato e qualche segno sulle caselle. Restituisce { k, chiave, segnate }
  async function metaPartita(X, chiave, finale) {
    var C = X.C, usati = [], fatto = { 0: false, 1: false };
    for (var giri = 0; giri < 8; giri++) {
      var v = vm(C), k = v.turno;
      if (fatto[0] && fatto[1] && k === finale) break;
      if (!await W.aspetta(function () { return vm(C).passo === "indizio"; }, 8000)) no("non arriva il turno dell'indizio");
      await indizio(C, X.capi[k], 2, usati);
      var ind = indovinoDi(C, k);
      if (!fatto[k]) {
        var mie = coperteDi(C, chiave, k);
        await gira(C, ind, mie[0]);
        await gira(C, ind, mie[1]);
        if (vm(C).turno === k) { var n0 = coperteDi(C, chiave, "n")[0]; if (n0 != null) await gira(C, ind, n0); }   // una di nessuno (o la parola d'oro: si continua)
        if (vm(C).turno === k && vm(C).passo === "indovina") { var al = coperteDi(C, chiave, 1 - k)[0]; await gira(C, ind, al); }   // una degli altri
        fatto[k] = true;
      } else { await gira(C, ind, coperteDi(C, chiave, k)[0]); if (vm(C).turno === k && vm(C).passo === "indovina") manda(ind, { t: "passo" }); }
      if (!await W.aspetta(function () { return vm(C).turno !== k || vm(C).fase !== "gioco"; }, 8000)) no("il turno non passa");
    }
    if (!await W.aspetta(function () { return vm(C).passo === "indizio" && vm(C).turno === finale; }, 8000)) no("non tocca alla squadra " + finale);
    await indizio(C, X.capi[finale], 2, usati);
    return { k: finale, usati: usati };
  }

  // ---------------- le misure del tabellone su un telefono ----------------
  // il tabellone prende tutto lo spazio libero: niente scorre, niente esce, nessuna parola va a capo a metà, le scritte almeno
  // 9 px, la chat è una striscia (al massimo 2 righe + bordi) subito sotto il tabellone e sopra la barra
  async function misuraTab(nome, L, H, opz) {
    opz = opz || {};
    var w = W.finestra(nome), f = document.getElementById("tel-" + nome), d = w.document, out = [], info = {};
    var st = d.createElement("style"); st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}"; d.head.appendChild(st);
    var vec = { w: f.style.width, h: f.style.height };
    try {
      f.style.width = L + "px"; f.style.height = H + "px"; void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
      await W.dorme(900); w.dispatchEvent(new w.Event("resize")); await W.dorme(500);
      if (!await W.aspetta(function () { return calmo(w); }, 12000)) out.push("la regia non si ferma sul tabellone");
      await W.dorme(200);
      if (d.documentElement.scrollHeight > H + 1) out.push("la pagina scorre (" + d.documentElement.scrollHeight + ")");
      if (d.documentElement.scrollWidth > L + 1) out.push("scorre di lato");
      var cc = carte(w), tab = d.querySelector(".or-tab"), tr = tab.getBoundingClientRect(), barra = d.querySelector(".st-barra"), bt = barra.getBoundingClientRect().top;
      var r0 = cc[0].getBoundingClientRect();
      info.casella = Math.round(r0.width) + "x" + Math.round(r0.height);
      var fs = [], spezzate = [];
      [].forEach.call(cc, function (b) {
        var s = b.querySelector(".or-w"), r = b.getBoundingClientRect(); if (!s) return;
        var px = parseFloat(w.getComputedStyle(s).fontSize), sr = s.getBoundingClientRect(), righe = s.textContent.indexOf(" ") >= 0 ? 2 : 1;
        fs.push(px);
        if (px < 8.95) out.push("«" + s.textContent + "» scritta a " + px.toFixed(1) + " px");
        if (sr.height > px * 1.35 * righe + 1) spezzate.push(s.textContent + " (" + Math.round(sr.height) + " px)");
        if (sr.left < r.left - 0.5 || sr.right > r.right + 0.5) out.push("«" + s.textContent + "» esce dalla casella");
        if (r.bottom > bt + 1) out.push("la casella «" + s.textContent + "» va sotto la barra");
        if (r.bottom > H + 1 || r.top < -1) out.push("la casella «" + s.textContent + "» esce dallo schermo");
      });
      if (spezzate.length) out.push("parole a capo: " + spezzate.slice(0, 4).join(", "));
      fs.sort(function (a, b) { return a - b; });
      info.scritte = fs.length ? fs[0].toFixed(1) + "-" + fs[fs.length - 1].toFixed(1) + " px" : "?";
      info.fsMax = fs[fs.length - 1] || 0; info.alt = r0.height;
      // la chat: striscia sotto il tabellone, sopra la barra
      var ch = d.querySelector(".or-chat");
      if (ch && ch.getClientRects().length && !opz.fine) {
        var cr = ch.getBoundingClientRect();
        info.chat = Math.round(cr.height);
        if (cr.height > 66) out.push("la chat chiusa è alta " + Math.round(cr.height) + " px (deve essere una striscia di 2 righe)");
        if (cr.top < tr.bottom - 1) out.push("la chat copre il tabellone");
        if (cr.bottom > bt + 1) out.push("la chat va sotto la barra");
        var vuoto = bt - cr.bottom; if (vuoto > 24) out.push("tra la chat e la barra restano " + Math.round(vuoto) + " px vuoti");
        var vuoto2 = cr.top - tr.bottom; if (vuoto2 > 16) out.push("tra il tabellone e la chat restano " + Math.round(vuoto2) + " px vuoti");
        // l'ultima riga della chat si vede tutta
        var righeC = ch.querySelectorAll(".or-l"), ult = righeC[righeC.length - 1];
        if (ult) { var ur = ult.getBoundingClientRect(); if (ur.bottom > cr.bottom + 1 || ur.top < cr.top - 1) out.push("l'ultima riga della chat non si vede tutta"); }
      } else if (!opz.fine && !opz.senzaChat) out.push("non c'è la striscia della chat");
      // le cose in alto non si toccano
      var pan = d.querySelector(".or-pannelli"), ind = d.querySelector(".or-ind-zona");
      if (pan && ind && pan.getBoundingClientRect().bottom > ind.getBoundingClientRect().top + 1) out.push("le squadre coprono l'indizio");
      if (ind && ind.getBoundingClientRect().bottom > tr.top + 1) out.push("l'indizio copre il tabellone");
      return { err: out.join("; "), info: info };
    } finally {
      if (!opz.resta) { if (st.parentNode) st.parentNode.removeChild(st); f.style.width = vec.w; f.style.height = vec.h; w.dispatchEvent(new w.Event("resize")); }
    }
  }

  // ---- spie: per ogni telefono, ogni 40 ms, se la telecamera è sul tabellone (fuori = momenti in cui il tabellone non si vede) ----
  function spiaCamera(nomi) {
    var S = { fuori: {}, campioni: 0, t: null };
    nomi.forEach(function (n) { S.fuori[n] = 0; });
    S.t = setInterval(function () { S.campioni++; nomi.forEach(function (n) { var w = W.finestra(n); if (w && !suTabellone(w)) S.fuori[n]++; }); }, 40);
    S.ferma = function () { clearInterval(S.t); var out = {}; nomi.forEach(function (n) { out[n] = S.fuori[n] * 40; }); return out; };   // (ms fuori dal tabellone)
    return S;
  }
  function rett(w, sel) { var e = w.document.querySelector(sel); return e && e.getClientRects().length ? e.getBoundingClientRect() : null; }
  function siToccano(a, b) { return !!(a && b && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1); }
  // un telefono a una misura, con le animazioni ferme (per misurare); torna la funzione che lo rimette com'era
  async function aMisura(nome, L, H) {
    var w = W.finestra(nome), f = document.getElementById("tel-" + nome), d = w.document, vec = { w: f.style.width, h: f.style.height };
    var st = d.createElement("style"); st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}"; d.head.appendChild(st);
    f.style.width = L + "px"; f.style.height = H + "px"; void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(800); w.dispatchEvent(new w.Event("resize")); await W.dorme(400);
    return function () { if (st.parentNode) st.parentNode.removeChild(st); f.style.width = vec.w; f.style.height = vec.h; w.dispatchEvent(new w.Event("resize")); };
  }

  // ================= o2t1: il tabellone grande, lo stile C coi segni nel DOM, la chat a striscia =================
  // online in 4 (Rossi = Luca capo + Paky; Blu = Giulia capo + Sara). Misure a 360x640, 390x844 e 412x915 per chi indovina, il
  // capo e l'altra squadra: il tabellone prende tutto lo spazio (niente riquadro vuoto: la chat è una striscia di 2 righe),
  // caselle alte almeno 44 px a 360x640, scritte più grandi sui telefoni lunghi (fino a 17 px), mai sotto 9, nessuna parola a
  // capo. All'inizio la striscia dice grande «COMINCIANO I …» col segno della squadra. Dopo qualche mossa: i segni ▲ ● ■ e il
  // teschio nel DOM (caselle girate, chiave del capo, pannelli, chat), la nera del capo a righe scure come nella proposta C,
  // le girate del capo piene con la ✓; la striscia mostra le ultime 2 righe intere, un tocco la apre sopra il tabellone (scesa fino
  // all'ultima riga), il tocco sulla riga di una parola la chiude e illumina la casella, un altro tocco la richiude.
  COPIONE.aggiungi("o2t1", { nome: "Parola d'ordine: tabellone grande (misure), stile C coi segni nel DOM, chat a striscia che si apre", fai: async function () {
    var N = [];
    var X = await partita(["Giulia", "Luca", "Sara"], { Luca: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]), C = X.C;
    await comincia(X);
    var chiave = await chiaveDi("Luca");
    await tuttiCalmi(X.nomi, 15000);
    // la striscia all'inizio: «▲ COMINCIANO I ROSSI» grande, col colore e il segno della squadra
    var k0 = vm(C).turno, wP = W.finestra("Paky");
    X.nomi.forEach(function (n) {
      var w = W.finestra(n), log = w.document.querySelector(".or-log"), via = log && log.querySelector(".or-l.via");
      if (!log || !log.classList.contains("solo") || !via) no(n + ": all'inizio la chat non è la scritta grande «Cominciano…» (" + (log && log.textContent) + ")");
      var cs = w.getComputedStyle(via);
      if (cs.textTransform !== "uppercase" || parseFloat(cs.fontSize) < 15) no(n + ": «" + via.textContent + "» non è grande (" + cs.textTransform + ", " + cs.fontSize + ")");
      var sg = via.querySelector(".or-sg[data-s='" + k0 + "'] svg"); if (!sg) no(n + ": «Cominciano…» senza il segno della squadra");
      if (w.getComputedStyle(via).color !== (k0 ? "rgb(28, 126, 214)" : "rgb(224, 49, 49)")) no(n + ": «Cominciano…» non ha il colore della squadra (" + cs.color + ")");
    });
    nota(N, "all'inizio «" + wP.document.querySelector(".or-l.via").textContent.toUpperCase() + "» grande col segno");
    // le misure del tabellone a inizio partita
    var M = [[360, 640], [390, 844], [412, 915]], righe = [];
    for (var q = 0; q < M.length; q++) {
      var r = [], m0 = null;
      for (var j = 0; j < 3; j++) {
        var nm = ["Paky", "Luca", "Giulia"][j], m = await misuraTab(nm, M[q][0], M[q][1]);
        if (!j) m0 = m;
        if (m.err) no(nm + " a " + M[q].join("x") + ": " + m.err);
        if (M[q][1] === 640 && m.info.alt < 44) no(nm + " a 360x640: caselle alte " + Math.round(m.info.alt) + " px");
        if (M[q][1] === 915 && m.info.fsMax < 15) no(nm + " a 412x915: la scritta più grande è " + m.info.fsMax.toFixed(1) + " px (sui telefoni lunghi deve crescere)");
        r.push(nm + " " + m.info.casella);
      }
      righe.push(M[q].join("x") + ": " + r[0] + ", scritte " + m0.info.scritte + ", chat " + m0.info.chat + " px");
    }
    nota(N, "misure " + righe.join(" · "));
    // qualche mossa: una giusta, una di nessuno o dell'altra squadra; poi l'altra squadra ne gira una sua
    var usati = [];
    await indizio(C, X.capi[k0], 2, usati);
    await gira(C, indovinoDi(C, k0), coperteDi(C, chiave, k0)[0]);
    var neutra = coperteDi(C, chiave, "n")[0];
    if (vm(C).turno === k0) await gira(C, indovinoDi(C, k0), neutra);
    if (vm(C).turno === k0 && vm(C).passo === "indovina") await gira(C, indovinoDi(C, k0), coperteDi(C, chiave, 1 - k0)[0]);
    if (!await W.aspetta(function () { return vm(C).turno === 1 - k0 && vm(C).passo === "indizio"; }, 8000)) no("il turno non passa");
    await indizio(C, X.capi[1 - k0], 1, usati);
    await gira(C, indovinoDi(C, 1 - k0), coperteDi(C, chiave, 1 - k0)[0]);
    await tuttiCalmi(X.nomi, 8000);
    // i segni nel DOM: ogni casella girata (non di nessuno) ha il segno della sua squadra; il capo li ha anche sulle coperte
    var v = vm(C), wL = W.finestra("Luca");
    v.tab.forEach(function (c, i) {
      ["Paky", "Luca"].forEach(function (n) {
        var b = carte(W.finestra(n))[i], s = b.querySelector(":scope > .or-sg"), ds = s && s.getAttribute("data-s");
        var atteso = c.g ? (c.oro ? "oro" : c.c === "n" ? null : String(c.c)) : n === "Luca" ? (chiave[i] === "n" ? null : String(chiave[i])) : null;
        if ((ds || null) !== atteso) no(n + ": la casella " + c.w + " ha il segno «" + ds + "» invece di «" + atteso + "»");
        if (atteso && !s.querySelector("svg")) no(n + ": il segno di " + c.w + " non è un disegno");
      });
    });
    // (revisione del 22 ott 2026: la nera del capo come nella proposta C, a righe scure; niente più cornice gialla e nera)
    var nera = carte(wL)[chiave.indexOf("x")], bg = wL.getComputedStyle(nera).backgroundImage;
    if (!/repeating-linear-gradient/.test(bg) || !/46, 46, 46/.test(bg) || /252, 196, 25/.test(bg)) no("la nera del capo non è a righe scure come nella proposta C (" + bg.slice(0, 80) + ")");
    if (!wL.document.querySelector(".or-tab.capo")) no("per il capo il tabellone non è «capo» (girate con la ✓)");
    // (22 ott 2026, il proprietario: «i colori per il capo sono un po' troppo spenti»: le girate del capo restano piene, con la ✓)
    // (la girata appena girata ha l'animazione orGira, che parte da opacity .4: con la scheda nascosta resta ferma lì, quindi
    // l'opacità si misura su una girata che non è «appena»)
    var gir = [].filter.call(carte(wL), function (b) { return b.classList.contains("g"); })[0];
    var girFerma = [].filter.call(carte(wL), function (b) { return b.classList.contains("g") && !b.classList.contains("appena"); })[0];
    if (girFerma && +wL.getComputedStyle(girFerma).opacity < 0.95) no("per il capo le girate sono ancora sbiadite (" + wL.getComputedStyle(girFerma).opacity + ")");
    if (gir && !/✓/.test(wL.getComputedStyle(gir, ":after").content)) no("per il capo le girate non hanno la ✓");
    if (wP.document.querySelector(".or-tab.capo")) no("per chi indovina il tabellone è «capo»");
    [0, 1].forEach(function (k) { if (!wP.document.querySelector(".or-pan.s" + k + " .or-pan-nome .or-sg[data-s='" + k + "'] svg")) no("il pannello " + k + " non ha il suo segno"); });
    if (!wP.document.querySelector(".or-chat .or-l-w.c" + k0 + " .or-sg svg")) no("nella chat le parole girate non hanno il segno");
    // niente più trucchi del CSS sullo stile in linea («[style*=…]»): le classi e i segni bastano
    var css = ([].filter.call(wP.document.querySelectorAll("style"), function (s) { return s.textContent.indexOf(".or-sg{") >= 0; })[0] || {}).textContent || "";
    if (!css) no("non trovo lo stile del gioco");
    if (/\[style\*=/.test(css)) no("nello stile ci sono ancora selettori [style*=…]");
    if (/filter:|backdrop-filter|mask:|-webkit-mask|clip-path/.test(css)) no("nello stile del gioco ci sono filtri, mask o clip-path");
    nota(N, "segni nel DOM su caselle girate, chiave del capo, pannelli e chat; la nera del capo a righe scure (proposta C); girate del capo piene con la ✓");
    // la chat chiusa: le ultime 2 righe intere (le altre nascoste); un tocco la apre
    var log = wP.document.querySelector(".or-log"), viste = [].filter.call(log.querySelectorAll(".or-l"), function (r) { return r.getClientRects().length; });
    if (viste.length !== 2) no("la chat chiusa mostra " + viste.length + " righe invece di 2");
    var lr = log.getBoundingClientRect();
    viste.forEach(function (r) { var rr = r.getBoundingClientRect(); if (rr.top < lr.top - 0.5 || rr.bottom > lr.bottom + 0.5) no("nella striscia una riga è tagliata («" + r.textContent + "»)"); });
    if (viste[1] !== log.lastElementChild) no("la striscia non mostra l'ultima riga");
    log.click(); await W.dorme(250);
    var chat = wP.document.querySelector(".or-chat"), tabR = rett(wP, ".or-tab");
    if (!chat.classList.contains("aperta")) no("un tocco sulla striscia non apre la chat");
    lr = log.getBoundingClientRect();
    if (lr.top > tabR.top + 2 || lr.height < tabR.height * 0.9) no("la chat aperta non copre il tabellone (" + Math.round(lr.top) + "/" + Math.round(tabR.top) + ", alta " + Math.round(lr.height) + ")");
    var tutte = [].filter.call(log.querySelectorAll(".or-l"), function (r) { return r.getClientRects().length; }).length;
    if (tutte < log.querySelectorAll(".or-l").length) no("la chat aperta non mostra tutte le righe");
    if (log.scrollHeight > log.clientHeight + 1 && log.scrollTop + log.clientHeight < log.scrollHeight - 2) no("la chat aperta non è scesa fino all'ultima riga");
    // tocco la riga di una parola girata: la chat si chiude e la casella si illumina
    var riga = [].filter.call(log.querySelectorAll(".or-l.tocca"), function (r) { return r.querySelector(".or-l-w"); })[0], parola = riga.querySelector(".or-l-w").textContent;
    riga.click(); await W.dorme(200);
    if (chat.classList.contains("aperta")) no("toccando una riga la chat non si chiude");
    var ic = v.tab.map(function (c) { return c.w; }).indexOf(parola);
    if (!carte(wP)[ic].querySelector(".or-lampo")) no("toccando la riga di " + parola + " la casella non si illumina");
    log.click(); await W.dorme(150);
    if (!chat.classList.contains("aperta")) no("la chat non si riapre");
    log.click(); await W.dorme(150);
    if (chat.classList.contains("aperta")) no("un altro tocco non chiude la chat");
    nota(N, "chat: striscia con le ultime 2 righe intere, si apre sopra il tabellone (" + tutte + " righe), la riga di " + parola + " illumina la casella, si richiude");
    senzaErrori();
    return N.join(" · ");
  } });

  // ================= o2t2: le parole lunghe non vanno mai a capo a metà (p3) =================
  // le parole vostre (dalle regole dell'host): le più lunghe del Classico e qualcuna da 11-12 lettere e con lo spazio. A 360x640
  // e 412x915 (e nella saletta… no: sul tabellone) ogni parola sta su una riga sola, si legge tutta dentro la sua casella
  // (se a 9 px non ci sta si stringe), mai sotto 9 px; IPPOPOTAMO e MATRIMONIO senza stringere.
  var LUNGHE = ["IPPOPOTAMO", "MATRIMONIO", "CATAMARANO", "MARGHERITA", "MOZZARELLA", "PROSCIUTTO", "TRANSFORMERS", "SPACCANAPOLI", "TELECOMANDO", "CAPODIMONTE", "ZIO GINO", "COCCINELLA"];
  COPIONE.aggiungi("o2t2", { nome: "Parola d'ordine: le parole lunghe su una riga (mai a capo a metà, al massimo si stringono), mai sotto 9 px", fai: async function () {
    var N = [];
    var X = await partitaGrande({ imp: { gruppo: LUNGHE.slice(), quante: "tutte", usaMie: true }, veri: ["Giulia"], virtuali: ["Luca", "Sara"] });
    var C = X.C;
    W.finestra("Paky").__cbH.ordine.onMsg("v1", { t: "squadra", s: 0 });
    await comincia(X);
    await tuttiCalmi(X.nomi, 15000);
    var parole = vm(C).tab.map(function (c) { return c.w; }), messe = LUNGHE.filter(function (w) { return parole.indexOf(w) >= 0; });
    if (messe.length < 8) no("sul tabellone ci sono solo " + messe.length + " parole lunghe: " + messe.join(", "));
    var M = [[360, 640], [412, 915]], out = [];
    for (var q = 0; q < M.length; q++) {
      for (var j = 0; j < 2; j++) {
        var nm = ["Paky", "Giulia"][j], rimetti = await aMisura(nm, M[q][0], M[q][1]), w = W.finestra(nm);
        try {
          await W.aspetta(function () { return calmo(w); }, 8000);
          var strette = [];
          [].forEach.call(carte(w), function (b) {
            var s = b.querySelector(".or-w"), px = parseFloat(w.getComputedStyle(s).fontSize), br = b.getBoundingClientRect(), sr = s.getBoundingClientRect();
            var R = w.document.createRange(); R.selectNodeContents(s); var lin = {}; [].forEach.call(R.getClientRects(), function (x) { lin[Math.round(x.top)] = 1; });
            var nl = Object.keys(lin).length, max = s.textContent.indexOf(" ") >= 0 ? 2 : 1;
            if (nl > max) no(nm + " a " + M[q].join("x") + ": «" + s.textContent + "» va a capo (" + nl + " righe)");
            if (px < 8.95) no(nm + ": «" + s.textContent + "» a " + px + " px");
            if (sr.left < br.left - 0.5 || sr.right > br.right + 0.5) no(nm + " a " + M[q].join("x") + ": «" + s.textContent + "» esce dalla casella (" + Math.round(sr.width) + " in " + Math.round(br.width) + ")");
            var tr = s.style.transform; if (tr) { strette.push(s.textContent + " " + tr.replace(/[^0-9.]/g, "")); if (/IPPOPOTAMO|MATRIMONIO/.test(s.textContent)) no(nm + " a " + M[q].join("x") + ": " + s.textContent + " è stretta (" + tr + ")"); }
          });
          var bI = [].filter.call(carte(w), function (b) { return (b.querySelector(".or-w") || {}).textContent === "IPPOPOTAMO"; })[0];
          if (!j) out.push(M[q].join("x") + ": IPPOPOTAMO " + (bI ? w.getComputedStyle(bI.querySelector(".or-w")).fontSize : "(non c'è)") + (strette.length ? ", strette: " + strette.join(", ") : ", nessuna stretta"));
        } finally { rimetti(); }
      }
    }
    nota(N, messe.length + " parole lunghe sul tabellone, tutte su una riga e dentro la casella · " + out.join(" · "));
    senzaErrori();
    return N.join(" · ");
  } });

  // ================= o2t3: il tabellone non sparisce (p9, c10, p13, p11) =================
  // online in 4 con le clessidre (⏳ 90 s per l'indizio, 1 minuto per indovinare). Dopo l'indizio: la telecamera resta sul
  // tabellone su tutti i telefoni e l'indizio esce grande (la scritta con la fascia e la faccia del capo) entro mezzo secondo;
  // una parola sbagliata: la telecamera non si muove (la reazione è la faccia arrabbiata del capo nella scritta grande, che sta
  // sopra l'indizio e non sopra le caselle); il capo di turno non perde mai il tabellone mentre pensa e la sua clessidra parte
  // piena; «💭 … pensava a» sta al posto dell'indizio: non copre il tabellone né i punteggi; la prima clessidra parte quando
  // finisce la presentazione.
  COPIONE.aggiungi("o2t3", { nome: "Parola d'ordine: il tabellone non sparisce (indizio, sbaglio, capo che pensa, pensava a, clessidra dopo la presentazione)", fai: async function () {
    var N = [];
    var X = await partitaGrande({ imp: { tempo: 90, tempoInd: 60 }, veri: ["Giulia", "Luca", "Sara"] });
    var C = X.C;
    ["Luca"].forEach(function (n) { W.reteDi(n).invia({ t: "squadra", s: 0 }); });
    ["Giulia", "Sara"].forEach(function (n) { W.reteDi(n).invia({ t: "squadra", s: 1 }); });
    if (!await W.aspetta(function () { var p = chiDi(C, "Luca"), g = chiDi(C, "Giulia"), s = chiDi(C, "Sara"); return p && p.team === 0 && g && g.team === 1 && s && s.team === 1; }, 5000)) no("le squadre non si sistemano");
    W.reteDi("Luca").invia({ t: "capo" }); W.reteDi("Giulia").invia({ t: "capo" });
    if (!await W.aspetta(function () { var c = vm(C).capo; return c[0] === idDi(C, "Luca") && c[1] === idDi(C, "Giulia"); }, 5000)) no("i capi non sono Luca e Giulia");
    X.capi = ["Luca", "Giulia"];
    // la prima clessidra aspetta la presentazione
    if (!await W.aspetta(function () { return W.clicca(X.P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 15000)) no("non comincia");
    var t0 = Date.now(), clVista = null;
    await W.aspetta(function () { var v = vm(C); if (v.cless && !clVista) clVista = { dopo: Date.now() - t0, ms: v.cless.ms }; return clVista; }, 9000, 50);
    if (!clVista) no("la clessidra del primo indizio non parte");
    if (clVista.ms < 175000) no("la clessidra del primo indizio parte da " + Math.round(clVista.ms / 1000) + " s invece di 180 (tempo doppio)");
    // (le ore dell'host, dalla partita che ricorda: la clessidra è partita quando è finita la presentazione)
    await W.dorme(700);
    var stH = (JSON.parse(W.BR.mem.Paky.l["sg-ripresa"] || "null") || {}).stato || {};
    if (!stH.presFino || !stH.cless) no("nella partita dell'host mancano presFino o la clessidra");
    var partita0 = stH.cless.fino - 180000, durPres = stH.presFino - (stH.indDa || 0);
    if (partita0 < stH.presFino - 100) no("la clessidra parte " + (stH.presFino - partita0) + " ms prima della fine della presentazione");
    if (durPres < 2000 || durPres > 3500) no("la presentazione dura " + durPres + " ms (2 squadre: circa 2,4 s)");
    nota(N, "prima clessidra (180 s, tempo doppio) partita alla fine della presentazione (" + (durPres / 1000).toFixed(1) + " s dopo l'inizio)");
    var chiave = await chiaveDi("Luca");
    await tuttiCalmi(X.nomi, 10000);
    var k0 = vm(C).turno, k1 = 1 - k0, usati = [];
    // 1. l'indizio: la telecamera resta sul tabellone, l'indizio esce grande con la faccia del capo
    var spia = spiaCamera(X.nomi), p = await indizio(C, X.capi[k0], 2, usati), tI = Date.now();
    var visti = {};
    await W.aspetta(function () { X.nomi.forEach(function (n) { var w = W.finestra(n), c = w.document.querySelector(".or-cart.su.ind"); if (c && c.textContent.indexOf(p) >= 0 && c.querySelector(".or-cart-f img") && !visti[n]) visti[n] = Date.now() - tI; }); return X.nomi.every(function (n) { return visti[n]; }); }, 1500, 30);
    X.nomi.forEach(function (n) { if (!visti[n]) no(n + " non vede l'indizio grande con la faccia del capo"); else if (visti[n] > 700) no(n + " vede l'indizio grande dopo " + visti[n] + " ms"); });
    var cap = W.finestra(X.capi[k0]).document.querySelector(".or-cart.su .or-fascia.s" + k0 + " .n");
    if (!cap) no("l'indizio grande non è sulla fascia della squadra col numero");
    else if (!/250, 176, 5|255, 224, 102/.test(W.finestra(X.capi[k0]).getComputedStyle(cap).backgroundImage)) no("il numero dell'indizio non è dorato");
    await W.dorme(1900);
    var fuori = spia.ferma();
    X.nomi.forEach(function (n) { if (fuori[n] > 0) no(n + ": dopo l'indizio il tabellone sparisce per " + fuori[n] + " ms"); });
    // la scritta grande sta sopra l'indizio, non sopra le caselle
    nota(N, "indizio: grande su tutti in " + Math.max.apply(null, X.nomi.map(function (n) { return visti[n]; })) + " ms, tabellone sempre in vista");
    // 2. una giusta (la prima: la suspense lunga può portare la telecamera da chi la dice), poi una sbagliata: il tabellone resta
    var ind0 = indovinoDi(C, k0);
    await gira(C, ind0, coperteDi(C, chiave, k0)[0]);
    await tuttiCalmi(X.nomi, 6000);
    var capoDopo = X.capi[k1], wCD = W.finestra(capoDopo);
    spia = spiaCamera(X.nomi);
    var loro = coperteDi(C, chiave, k1)[0], tS = Date.now();
    manda(ind0, { t: "gira", i: loro });
    var cw = null;
    await W.aspetta(function () { var c = W.finestra("Paky").document.querySelector(".or-cart.su"); if (c && /era dei/.test(c.textContent)) cw = c; return cw; }, 4000, 30);
    if (!cw) no("dopo la parola sbagliata niente scritta grande");
    if (!cw.querySelector(".or-cart-f img")) no("nella scritta grande della parola sbagliata manca la faccia del capo");
    var tabR = rett(W.finestra("Paky"), ".or-tab"), cr = cw.getBoundingClientRect();
    if (cr.top + cr.height / 2 > tabR.top + 4) no("la scritta grande sta sopra le caselle (centro " + Math.round(cr.top + cr.height / 2) + ", tabellone da " + Math.round(tabR.top) + ")");
    if (!await W.aspetta(function () { return vm(C).turno === k1 && vm(C).passo === "indizio"; }, 4000)) no("il turno non passa");
    var clCapo = vm(C).cless ? vm(C).cless.ms : 0;
    await W.dorme(2600);
    fuori = spia.ferma();
    X.nomi.forEach(function (n) { if (fuori[n] > 0) no(n + ": dopo la parola sbagliata il tabellone sparisce per " + fuori[n] + " ms"); });
    if (clCapo < 87000) no("la clessidra del capo dopo parte da " + Math.round(clCapo / 1000) + " s invece di 90");
    nota(N, "parola sbagliata: tabellone sempre in vista su tutti (anche per " + capoDopo + ", capo di turno), scritta con la faccia sopra l'indizio, clessidra di " + capoDopo + " da " + Math.round(clCapo / 1000) + " s");
    // 3. «💭 … pensava a»: Giulia (capo) dice cosa intendeva, la squadra ne trova una e passa; la riga non copre tabellone né punteggi
    await indizio(C, capoDopo, 2, usati);
    var sue = coperteDi(C, chiave, k1);
    manda(capoDopo, { t: "intendo", x: (vm(C).indizio || {}).x, l: [sue[0], sue[1]] });
    await W.dorme(300);
    var ind1 = indovinoDi(C, k1);
    await gira(C, ind1, sue[0]);
    manda(ind1, { t: "passo" });
    var wS = W.finestra("Paky"), pens = await W.aspetta(function () { var e = wS.document.querySelector(".or-pens.su"); return e && /pensava a/.test(e.textContent) && e; }, 6000, 40);
    if (!pens) no("niente «💭 … pensava a»");
    var pr = pens.getBoundingClientRect(), tR = rett(wS, ".or-tab"), panR = rett(wS, ".or-pannelli"), primaRiga = carte(wS)[0].getBoundingClientRect();
    if (pr.bottom > tR.top + 1 || siToccano(pr, primaRiga)) no("«pensava a» copre il tabellone (fino a " + Math.round(pr.bottom) + ", tabellone da " + Math.round(tR.top) + ")");
    if (siToccano(pr, panR)) no("«pensava a» copre i punteggi delle squadre");
    if (wS.document.querySelector(".or-cart.su")) no("«pensava a» compare insieme alla scritta grande");
    nota(N, "«" + pens.textContent.slice(0, 60) + "…» tra le squadre e il tabellone");
    senzaErrori();
    return N.join(" · ");
  } });

  // ================= o2t4: contro il Bot: il Bot scopre la sua parola in un secondo, col tabellone in vista (p14) =================
  COPIONE.aggiungi("o2t4", { nome: "Parola d'ordine contro il Bot: il Bot scopre la sua parola in circa un secondo, il tabellone resta in vista, «pensava a» dopo", fai: async function () {
    var N = [];
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Parola d'ordine");
    await W.apriTel("Giulia", { hash: "gioco=ordine&stanza=" + C, x: 185 }); await W.apriTel("Luca", { hash: "gioco=ordine&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (vm(C).players || []).length >= 3; }, 8000)) no("non entrano in 3");
    if (!await W.aspetta(function () { return W.clicca(P, /contro il Bot/); }, 4000)) no("niente «🤖 Siete in 3: giocate contro il Bot»");
    if (!await W.aspetta(function () { return vm(C).vsBot; }, 4000)) no("non si passa a «contro il Bot»");
    W.reteDi("Giulia").invia({ t: "capo" });
    if (!await W.aspetta(function () { return vm(C).capo[0] === idDi(C, "Giulia"); }, 4000)) no("Giulia non diventa capo");
    var X = { P: P, C: C, nomi: ["Paky", "Giulia", "Luca"] };
    await comincia(X);
    var chiave = await chiaveDi("Giulia");
    await tuttiCalmi(X.nomi, 12000);
    var tempi = [];
    for (var giro = 0; giro < 2; giro++) {
      if (!await W.aspetta(function () { return vm(C).turno === 0 && vm(C).passo === "indizio"; }, 8000)) no("non tocca a voi");
      await indizio(C, "Giulia", 1, ["Q" + giro]);
      var mie = coperteDi(C, chiave, 0);
      manda("Giulia", { t: "intendo", x: vm(C).indizio.x, l: [mie[0]] });
      await gira(C, "Luca", mie[0]);
      await tuttiCalmi(X.nomi, 6000);
      var spia = spiaCamera(X.nomi), n0 = (vm(C).log || []).length ? vm(C).log[vm(C).log.length - 1].n : 0, tP = Date.now();
      manda("Luca", { t: "passo" });
      var tBot = await W.aspetta(function () { var l = vm(C).log || []; return l.some(function (e) { return e.n > n0 && e.t === "gira" && e.id === "botsq"; }) && Date.now() - tP; }, 6000, 30);
      if (!tBot) no("il Bot non scopre la sua parola");
      var visto = await W.aspetta(function () { return /scopre/.test(cart(W.finestra("Paky"))) && Date.now() - tP; }, 2000, 30);
      if (!visto) no("niente scritta grande «🤖 … scopre …»");
      // «💭 Giulia pensava a» dopo la scritta del Bot, non insieme
      var pens = await W.aspetta(function () { var w = W.finestra("Paky"), e = w.document.querySelector(".or-pens.su"); var cs = w.document.querySelector(".or-cart.su"); return e && { insieme: cs ? cs.textContent : "", t: Date.now() - tP }; }, 6000, 30);
      if (!pens) no("niente «pensava a» contro il Bot");
      if (pens.insieme) no("«pensava a» esce insieme alla scritta grande «" + pens.insieme + "» (a " + pens.t + " ms, Bot a " + tBot + " ms)");
      await W.dorme(300);
      var fuori = spia.ferma();
      X.nomi.forEach(function (n) { if (fuori[n] > 0) no(n + ": durante il turno del Bot il tabellone sparisce per " + fuori[n] + " ms"); });
      if (tBot > 1600) no("il Bot scopre la sua parola dopo " + tBot + " ms");
      tempi.push("Bot dopo " + tBot + " ms, scritta a " + visto + " ms, «pensava a» a " + pens.t + " ms");
    }
    nota(N, tempi.join(" · ") + "; tabellone sempre in vista");
    senzaErrori();
    return N.join(" · ");
  } });

  // ================= o2t5: la presentazione (p10) =================
  // in 4: dal «Comincia» al tabellone al massimo 6,5 s (sui telefoni finti c'è anche il 3-2-1); la presentazione intera c'è
  // (le squadre ai banconi: «I Rossi!»); un tocco la salta (solo a chi tocca); alla rivincita con «Stessi capi» niente
  // presentazione, con «Capo nuovo» solo i capi nuovi (circa 2 s)
  COPIONE.aggiungi("o2t5", { nome: "Parola d'ordine: la presentazione corta solo alla prima partita, un tocco la salta, alla rivincita solo i capi nuovi", fai: async function () {
    var N = [];
    var X = await partita(["Giulia", "Luca", "Sara"], { Luca: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]), C = X.C;
    function spiaTerzi() { var S = { testi: {} }; S.t = setInterval(function () { X.nomi.forEach(function (n) { var w = W.finestra(n), e = w && w.document.querySelector(".st-terzo.on"); if (e) (S.testi[n] = S.testi[n] || {})[e.textContent] = 1; }); }, 50); S.ferma = function () { clearInterval(S.t); return S.testi; }; return S; }
    // 1. la prima partita: presentazione intera, Giulia la salta con un tocco
    var st = spiaTerzi(), t0 = Date.now(), tCalmi = {}, inPres = {};
    // (dal «Comincia»: quando ognuno ha visto la presentazione e poi è fermo sul tabellone)
    var camp = setInterval(function () { X.nomi.forEach(function (n) { var w = W.finestra(n), ui = w && w.__ORDINE && w.__ORDINE.ui; if (!ui) return; if (ui.inPres) inPres[n] = 1; if (inPres[n] && !tCalmi[n] && calmo(w)) tCalmi[n] = Date.now() - t0; }); }, 40);
    if (!await W.aspetta(function () { return W.clicca(X.P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return ["Giulia", "Sara"].every(function (n) { var w = W.finestra(n); return w && carte(w).length >= 20 && w.__ORDINE.ui && w.__ORDINE.ui.inPres; }); }, 10000)) no("la presentazione non parte su Giulia e Sara");
    await W.dorme(400);
    var wG = W.finestra("Giulia"), Ev = wG.PointerEvent || wG.MouseEvent;
    wG.document.querySelector(".st-vista").dispatchEvent(new Ev("pointerdown", { bubbles: true, pointerId: 3, pointerType: "touch", isPrimary: true }));
    var tSalta = Date.now();
    if (!await W.aspetta(function () { return calmo(wG); }, 1500)) no("il tocco non salta la presentazione di Giulia");
    var saltata = Date.now() - tSalta;
    if (calmo(W.finestra("Sara"))) no("il tocco di Giulia ha saltato la presentazione anche a Sara");
    await W.aspetta(function () { return X.nomi.every(function (n) { return tCalmi[n]; }); }, 12000, 40);
    clearInterval(camp);
    var testi = st.ferma();
    // (sui telefoni finti tutti i telefoni stanno in una pagina sola: gli studi degli amici si costruiscono uno dopo l'altro
    // e arrivano più tardi. Il tempo vero è quello dell'host: dal «Comincia» al tabellone, col 3-2-1 di 2,4 s)
    var maxT = tCalmi.Paky || 99999;
    if (maxT > 6000) no("dal «Comincia» al tabellone l'host aspetta " + (maxT / 1000).toFixed(1) + " s");
    var tS = Object.keys(testi.Sara || {}).join(" | ");
    if (!/I Rossi!/.test(tS) || !/I Blu!/.test(tS)) no("la presentazione intera non presenta le squadre a Sara («" + tS + "»)");
    nota(N, "prima partita: dal «Comincia» al tabellone " + (maxT / 1000).toFixed(1) + " s per l'host (amici " + ["Luca", "Sara"].map(function (n) { return ((tCalmi[n] || 0) / 1000).toFixed(1); }).join(" e ") + " s), presentazione «" + tS.slice(0, 80) + "»; Giulia la salta con un tocco (" + saltata + " ms)");
    // 2. fine veloce (la nera) e rivincita con «Stessi capi»: niente presentazione
    async function fineVeloce() {
      var ch = await chiaveDi(nomeDi(C, vm(C).capo[0]));
      var k = vm(C).turno, capoK = nomeDi(C, vm(C).capo[k]);
      if (!await W.aspetta(function () { return vm(C).passo === "indizio"; }, 8000)) no("non arriva l'indizio");
      await indizio(C, capoK, 1, []);
      manda(indovinoDi(C, k), { t: "gira", i: ch.indexOf("x") });
      if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 9000)) no("la partita non finisce");
      await W.dorme(1500);
    }
    async function rivincita(modo) {
      var bm = await W.aspetta(function () { return bottone(X.P, modo, ".or-rm"); }, 4000); if (!bm) no("niente «" + modo + "»");
      bm.click(); await W.dorme(400);
      if (!W.clicca(X.P, /Nuova partita|Rivincita/)) no("niente Rivincita");
      if (!await W.aspetta(function () { return vm(C).fase === "lobby"; }, 8000)) no("la Rivincita non torna in saletta");
      if (!await W.aspetta(function () { return vm(C).fase === "gioco" || W.clicca(X.P, /Comincia/, ".sl-go"); }, 12000)) no("niente «Comincia» (rivincita)");
      if (!await W.aspetta(function () { return vm(C).fase === "gioco" && X.nomi.every(function (n) { var w = W.finestra(n); return w && carte(w).length >= 20 && w.__ORDINE.ui && w.__ORDINE.ui.vm && w.__ORDINE.ui.vm.bid === vm(C).bid; }); }, 12000)) no("la rivincita non parte");
    }
    await fineVeloce();
    st = spiaTerzi();
    await rivincita(/Stessi capi/);
    var tR0 = Date.now();
    await W.aspetta(function () { return X.nomi.every(function (n) { return calmo(W.finestra(n)); }); }, 4000, 40);
    var tR = Date.now() - tR0;
    testi = st.ferma();
    if (tR > 900) no("con «Stessi capi» il tabellone arriva dopo " + tR + " ms");
    if (Object.keys(testi).length) no("con «Stessi capi» c'è ancora la presentazione: " + JSON.stringify(testi));
    if ((vm(C).pres || null) !== null) no("con «Stessi capi» la partita ha una presentazione: " + JSON.stringify(vm(C).pres));
    nota(N, "rivincita «Stessi capi»: niente presentazione (tabellone in " + tR + " ms)");
    // 3. rivincita con «Capo nuovo»: solo i capi nuovi, circa 2 s
    await fineVeloce();
    var capiPrima = vm(C).capo.slice();
    st = spiaTerzi();
    await rivincita(/Capo nuovo/);
    var tC0 = Date.now();
    await W.aspetta(function () { return X.nomi.every(function (n) { return calmo(W.finestra(n)); }); }, 6000, 40);
    var tC = Date.now() - tC0;
    testi = st.ferma();
    var tSa = Object.keys(testi.Sara || {}).join(" | ");
    if (!/Il capo dei/.test(tSa) || /I Rossi!|I Blu!/.test(tSa)) no("con «Capo nuovo» la presentazione non è dei soli capi («" + tSa + "»)");
    if (tC > 3200) no("con «Capo nuovo» il tabellone arriva dopo " + (tC / 1000).toFixed(1) + " s");
    var pres = vm(C).pres; if (!pres || pres.t !== "capi" || (pres.k || []).length !== 2) no("la presentazione della rivincita è " + JSON.stringify(pres) + " (capi prima " + capiPrima.join(",") + ", ora " + vm(C).capo.join(",") + ")");
    nota(N, "rivincita «Capo nuovo»: solo i capi («" + tSa.slice(0, 70) + "»), tabellone in " + (tC / 1000).toFixed(1) + " s");
    senzaErrori();
    return N.join(" · ");
  } });

  // ================= o2t6: saletta e partite grandi a 360x640 (p17, Sala, 3 squadre in 12) =================
  // la saletta dell'host a 360x640: in 6 a 2 squadre e in 12 a 3 squadre tutte le squadre (e «🔀 Squadre a caso») si vedono
  // senza scorrere; la partita a 3 squadre in 12: tabellone a misura (caselle ≥ 44 px, 4 faccine per squadra su una riga);
  // nella Sala in 6 a 360x640 il tabellone a misura per l'host e per un'amica, e a fine partita tutto sopra la barra
  COPIONE.aggiungi("o2t6", { nome: "Parola d'ordine a 360x640: saletta con tutte le squadre senza scorrere, 3 squadre in 12, nella Sala", fai: async function () {
    var N = [];
    async function salettaSenzaScorrere(nome, cosa) {
      var rimetti = await aMisura(nome, 360, 640), w = W.finestra(nome), d = w.document;
      try {
        var cont = d.querySelector(".saletta-schermo > .contenuto"); if (!cont) no(cosa + ": niente saletta");
        cont.scrollTop = 0; await W.dorme(100);
        var cr = cont.getBoundingClientRect(), out = [];
        [].forEach.call(d.querySelectorAll(".or-sq, .or-sq-tasti button, .or-squadre > button"), function (e) {
          var r = e.getBoundingClientRect(); if (r.top < cr.top - 1 || r.bottom > cr.bottom + 1) out.push("«" + e.textContent.trim().slice(0, 30) + "» (" + Math.round(r.top) + "-" + Math.round(r.bottom) + ", visibile " + Math.round(cr.top) + "-" + Math.round(cr.bottom) + ")");
        });
        if (out.length) no(cosa + ": a 360x640 non si vede senza scorrere " + out.join(", "));
        return d.querySelectorAll(".or-sq").length;
      } finally { rimetti(); }
    }
    // 1. in 6 a 2 squadre
    var X = await partitaGrande({ veri: ["Giulia"], virtuali: ["Luca", "Marco", "Sara", "Anna"] });
    var n2 = await salettaSenzaScorrere("Paky", "in 6");
    COPIONE.aiuti.pulisci();
    // 2. in 12 a 3 squadre, poi la partita
    X = await partitaGrande({ imp: { squadre: 3 }, veri: ["Giulia", "Luca"], virtuali: ["Sara", "Ugo", "Bea", "Marco", "Anna", "Dario", "Elena", "Fabio", "Gina"] });
    var C = X.C;
    if (!await W.aspetta(function () { return vm(C).nsq === 3 && vm(C).players.length === 12; }, 5000)) no("non siamo in 12 a 3 squadre");
    var n3 = await salettaSenzaScorrere("Paky", "in 12 a 3 squadre");
    nota(N, "saletta a 360x640: " + n2 + " squadre in 6 e " + n3 + " squadre in 12 senza scorrere");
    await comincia(X);
    await tuttiCalmi(X.nomi, 15000);
    var mis = [];
    for (var j = 0; j < 2; j++) {
      var nm = ["Paky", "Giulia"][j], m = await misuraTab(nm, 360, 640);
      if (m.err) no(nm + " (3 squadre in 12) a 360x640: " + m.err);
      if (m.info.alt < 44) no(nm + " (3 squadre in 12): caselle alte " + Math.round(m.info.alt) + " px");
      mis.push(nm + " " + m.info.casella);
    }
    var wP = W.finestra("Paky"), facce = [].map.call(wP.document.querySelectorAll(".or-pan .or-facce"), function (f) { var tops = {}; [].forEach.call(f.querySelectorAll(".or-f"), function (x) { tops[Math.round(x.getBoundingClientRect().top)] = 1; }); return Object.keys(tops).length; });
    if (facce.some(function (x) { return x > 1; })) no("a 3 squadre in 12 le faccine vanno su più righe (" + facce.join(",") + ")");
    nota(N, "3 squadre in 12 a 360x640: " + mis.join(", ") + ", faccine su una riga");
    COPIONE.aiuti.pulisci();
    // 3. nella Sala in 6
    var r = await A.salaConAmici(["Giulia", "Luca", "Marco", "Sara", "Anna"]);
    C = await A.lanciaDallaSala("Paky", r.S, "Parola d'ordine");
    if (!await W.aspetta(function () { return (vm(C).players || []).length >= 6; }, 10000)) no("nella Sala non entrano in 6");
    X = { P: W.finestra("Paky"), C: C, nomi: ["Paky", "Giulia", "Luca", "Marco", "Sara", "Anna"] };
    await comincia(X);
    await tuttiCalmi(X.nomi, 15000);
    var capi = vm(C).capo.map(function (id) { return nomeDi(C, id); }), k = vm(C).turno;
    await indizio(C, capi[k], 2, []);
    await tuttiCalmi(X.nomi, 8000);
    var amica = ["Giulia", "Luca", "Marco", "Sara", "Anna"].filter(function (n) { return capi.indexOf(n) < 0; })[0];
    mis = [];
    for (j = 0; j < 2; j++) {
      nm = ["Paky", amica][j]; m = await misuraTab(nm, 360, 640);
      if (m.err) no(nm + " nella Sala a 360x640: " + m.err);
      if (m.info.alt < 44) no(nm + " nella Sala a 360x640: caselle alte " + Math.round(m.info.alt) + " px (prima erano 29)");
      mis.push(nm + " " + m.info.casella);
    }
    nota(N, "nella Sala a 360x640: " + mis.join(", "));
    senzaErrori();
    return N.join(" · ");
  } });

  COPIONE.o2t = { partita: partita, partitaGrande: partitaGrande, comincia: comincia, indizio: indizio, gira: gira, coperteDi: coperteDi, chiaveDa: chiaveDa, chiaveDi: chiaveDi,
    indovinoDi: indovinoDi, manda: manda, calmo: calmo, tuttiCalmi: tuttiCalmi, metaPartita: metaPartita, misuraTab: misuraTab, suTabellone: suTabellone,
    idDi: idDi, nomeDi: nomeDi, chiDi: chiDi, cart: cart, bottone: bottone, carte: carte };
})();

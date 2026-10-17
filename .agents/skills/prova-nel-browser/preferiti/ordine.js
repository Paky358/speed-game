// PROVE DEI PREFERITI: Parola d'ordine (ritmo «🎬 Show / ⚡ Veloce», «💭 Paky pensava a…» a fine turno, clessidre col tempo
// doppio al primo indizio, «🏆 Rossi 2 – 1 Blu» e la scelta della rivincita, niente parole ripetute nella serata, le parole di
// tutti e quante usarne, i mazzi «⚽ Serie A e Fanta» e «🌶️ Serata», «🤖 Contro il Bot» in 2-3).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("preferiti/ordine.js"); await COPIONE.prova("po1")
//
// po1: online in 4: regole di partenza, le parole di Paky (host) e di Luca (dal suo profilo) tutte sul tabellone, «📝 6 parole
//      vostre (di Paky, Luca)», la suspense lunga sulla prima parola e breve sulla seconda, «💭 pensava a» a fine turno (la
//      parola pensata trovata sì, quella non trovata mai fuori dall'host), le parole uscite ricordate sul telefono dell'host.
// po2: ⏳ le clessidre: tempo doppio al primo indizio (capo e squadra), poi normali; la scritta su chi indovina; negli ultimi
//      10 secondi rossa; allo zero il turno passa da solo.
// po3: 🏆 la serata a squadre: fine partita con «🏆 Rossi 0 – 1 Blu», la scelta della rivincita solo all'host («Stessi capi»
//      tiene i capi, «🔀 Squadre a caso» rifà le squadre e azzera il conto), nella seconda partita nessuna parola della prima;
//      misure della fine a 360x640 e 412x915.
// po4: 🤖 contro il Bot in 3: «🤖 Siete in 3: giocate contro il Bot» in saletta, il Bot nei Blu (non è in classifica), dopo il
//      vostro turno scopre da solo una sua parola, chi ricarica ritrova tutto, «🎉 Avete battuto …»; misure della saletta.
// po5: 🤖 contro il Bot, l'host sparisce durante il turno del Bot: l'amico che porta avanti la partita fa giocare il Bot.
// po6: nella Sala in 3: la partita parte già «contro il Bot», la riga «📜» lo dice, fino alla fine e Rivincita.
// po7: i mazzi nuovi «⚽ Serie A e Fanta» e «🌶️ Serata» (spento di partenza): il tabellone è tutto del mazzo, la riga «📜».
// po8: ⚡ ritmo veloce: suspense sempre breve, regole nella saletta e riga «📜».
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T;

  // ---- la spia (solo con apriTel(nome, { po: true })): w.__imp = regole per la prova (le legge l'host), w.__cbH[gid] = la stanza
  //      dell'host, w.__usciti = tutto quello che l'host manda (per cercare i segreti) ----
  if (!W.__prepPO) {
    W.__prepPO = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepPO(w, nome, opz);
      if (!opz || !opz.po) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) { if (g && g.id === "ordine") spia(w, g); return reg.apply(this, arguments); };
      } });
    };
  }
  function spia(w, g) {
    w.__gOrdine = g;
    var avvia = g.avvia;
    g.avvia = function (t) {
      w.__t = t;
      if (w.__imp && t.impostazioni && !(t.linkParams && t.linkParams.stanza)) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
      if (!w.__cbH) {
        w.__cbH = {}; w.__usciti = [];
        var osp = w.SGNet.ospita;
        w.SGNet.ospita = function (gid, cb) {
          w.__cbH[gid] = cb;
          var h = osp.apply(this, arguments);
          if (h) ["invia", "inviaVeloce"].forEach(function (k) { var f = h[k]; if (f) h[k] = function (m) { try { w.__usciti.push(JSON.stringify(m)); } catch (e) {} return f.apply(this, arguments); }; });
          return h;
        };
      }
      return avvia.apply(this, arguments);
    };
  }
  function nota(N, x) { N.push(x); }
  function nomeDi(C, id) { var p = (vm(C).players || []).filter(function (x) { return x.id === id; })[0]; return p ? p.nome : null; }
  function tocca(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click();
  }
  function bottone(w, re, sel) { return [].filter.call(w.document.querySelectorAll(sel || "button"), function (b) { return re.test(b.textContent) && b.offsetParent; })[0] || null; }
  function senzaErrori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  async function misura(nome, sel, cosa) {
    var w = W.finestra(nome), f = document.getElementById("tel-" + nome), d = w.document, M = [[360, 640], [412, 915]], fatte = [];
    var st = d.createElement("style"); st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}"; d.head.appendChild(st);
    try {
      for (var k = 0; k < M.length; k++) {
        f.style.width = M[k][0] + "px"; f.style.height = M[k][1] + "px";
        void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
        await W.dorme(500);
        if (d.documentElement.scrollHeight > M[k][1] + 1) no(nome + " a " + M[k].join("x") + ": " + cosa + " scorre (" + d.documentElement.scrollHeight + " px)");
        [].forEach.call(d.querySelectorAll(sel), function (b) {
          if (!b.offsetParent) return;
          var r = b.getBoundingClientRect();
          if (r.bottom > M[k][1] + 1 || r.right > M[k][0] + 1 || r.left < -1 || r.top < -1) no(nome + " a " + M[k].join("x") + ": «" + b.textContent.trim().slice(0, 40) + "» esce dallo schermo (" + Math.round(r.top) + "-" + Math.round(r.bottom) + ")");
          if (b.scrollWidth > b.clientWidth + 2 && getComputedStyle(b).overflow !== "visible") no(nome + " a " + M[k].join("x") + ": «" + b.textContent.trim().slice(0, 40) + "» non ci sta");
        });
        fatte.push(M[k].join("x"));
      }
    } finally {
      if (st.parentNode) st.parentNode.removeChild(st);
      f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    }
    return fatte.join(" e ");
  }
  function chiaveDa(w) { return [].map.call(w.document.querySelectorAll(".or-tab .or-carta"), function (b) { var m = / c(\d|n|x)(\s|$)/.exec(b.className); return m ? (/\d/.test(m[1]) ? +m[1] : m[1]) : null; }); }
  function mandaO(X, id, m) {
    if (id === X.hostId) { var wh = X.hostId === "host" ? X.P : W.finestra(nomeDi(X.C, id)), cb = wh && wh.__cbH && wh.__cbH.ordine; if (!cb) no("non trovo la stanza dell'host"); cb.onMsg(X.hostId, m); return; }   // (anche l'amico che ha preso il posto dell'host)
    var n = nomeDi(X.C, id); var h = n && W.reteDi(n); if (h) h.invia(m);
  }
  // Paky apre la stanza (percorso di prima) e gli amici entrano; opz.profili = { Luca: { ordine: [...] } } (le liste del profilo)
  async function stanzaOrdine(amici, imp, opz) {
    opz = opz || {};
    var P = await W.apriTel("Paky", { x: 0, po: true, prima: function (w) { w.__imp = imp || null; } });
    var C = await W.apriStanza(P, "Parola d'ordine");
    for (var i = 0; i < amici.length; i++) {
      var o = { hash: "gioco=ordine&stanza=" + C, x: 185 * (i + 1), po: true }, li = (opz.profili || {})[amici[i]];
      if (li) o.profilo = { nome: amici[i], uid: "finto-" + amici[i], liste: li };
      await W.apriTel(amici[i], o);
    }
    if (!await W.aspetta(function () { return (vm(C).players || []).filter(function (p) { return !p.bot; }).length === amici.length + 1; }, 10000)) no("non entrano tutti (" + (vm(C).players || []).length + ")");
    return { P: P, C: C, hostId: "host", nomi: ["Paky"].concat(amici) };
  }
  async function capoLuca(X) {
    var luca = (vm(X.C).players || []).filter(function (p) { return p.nome === "Luca"; })[0];
    if (luca) mandaO(X, luca.id, { t: "capo" });
    await W.aspetta(function () { var x = vm(X.C); return x.capo && x.capo.indexOf(luca.id) >= 0; }, 3000);
  }
  async function comincia(X) {
    if (!await W.aspetta(function () { return W.clicca(X.P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(X.C).fase === "gioco"; }, 10000)) no("la partita non comincia (" + vm(X.C).fase + ")");
    await W.dorme(600);
  }
  function capoDi(X) { var v = vm(X.C); return v.capo[v.turno]; }
  function indovinoDi(X, v) { v = v || vm(X.C); return (v.players || []).filter(function (p) { return p.team === v.turno && p.id !== v.capo[v.turno] && !p.via && !p.bot; })[0]; }
  function chiaveCapo(X, k) { var v = vm(X.C), n = nomeDi(X.C, v.capo[k == null ? v.turno : k]); return n ? chiaveDa(W.finestra(n)) : []; }
  function coperte(X) { return (vm(X.C).tab || []).map(function (c, i) { return c.g ? -1 : i; }).filter(function (i) { return i >= 0; }); }
  async function aspettaIndovina(X, k) { return W.aspetta(function () { var v = vm(X.C); return v.passo === "indovina" && !v.sospeso && (k == null || (v.storia || []).length > k); }, 8000); }
  async function aspettaIndizio(X, k) { return W.aspetta(function () { var v = vm(X.C); return v.fase !== "gioco" || (v.passo === "indizio" && (v.storia || []).length === k && !v.sospeso); }, 12000); }
  // gira una parola e aspetta che si scopra; torna { lungo, ms } della suspense
  async function gira(X, chi, i) {
    var l0 = vm(X.C).log || [], n0 = l0.length ? l0[l0.length - 1].n : 0, t0 = Date.now(), lungo = null;
    mandaO(X, chi, { t: "gira", i: i });
    await W.aspetta(function () { var v = vm(X.C); if (v.sospeso && lungo == null) lungo = v.sospeso.lungo; var l = v.log || []; return l.length && l[l.length - 1].n > n0 && !v.sospeso; }, 8000, 50);
    return { lungo: lungo, ms: Date.now() - t0 };
  }
  // il turno della squadra di turno finisce subito: gira una parola di nessuno o degli altri (mai la nera)
  async function sbaglia(X) {
    var v = vm(X.C), key = chiaveCapo(X), chi = indovinoDi(X, v), i = -1;
    key.forEach(function (c, j) { if (i < 0 && c !== v.turno && c !== "x" && c !== "n" && c != null && !v.tab[j].g) i = j; });
    if (i < 0) key.forEach(function (c, j) { if (i < 0 && c === "n" && !v.tab[j].g) i = j; });
    return gira(X, chi.id, i);
  }
  async function finisciConNera(X) {
    var v = vm(X.C);
    if (v.passo === "indizio") { mandaO(X, v.capo[v.turno], { t: "indizio", parola: "PLUTONIO", n: 1 }); await aspettaIndovina(X); }
    var key = chiaveCapo(X); await gira(X, indovinoDi(X).id, key.indexOf("x"));
    if (!await W.aspetta(function () { return vm(X.C).fase === "fine"; }, 8000)) no("la partita non finisce con la parola nera");
  }

  COPIONE.aggiungi("po1", { nome: "Parola d'ordine: parole di tutti, ritmo Show, «💭 pensava a» a fine turno, parole uscite ricordate", fai: async function () {
    var N = [];
    var X = await stanzaOrdine(["Giulia", "Luca", "Sara"], { gruppo: ["Sasa", "Pinuccio"], quante: "tutte" }, { profili: { Luca: { ordine: ["Peppe", "Ibiza", "Kebab", "Zio Gino", "sasa"] } } });
    var C = X.C, P = X.P, v = vm(C);
    if (v.ritmo !== "show" || v.tempoInd !== 0 || v.vsBot || v.nsq !== 2) no("regole di partenza strane: ritmo " + v.ritmo + ", tempo per indovinare " + v.tempoInd + ", vsBot " + v.vsBot + ", squadre " + v.nsq);
    if (v.gruppoN !== 6 || (v.gruppoDa || []).join(",") !== "Paky,Luca") no("parole vostre: " + v.gruppoN + " di " + (v.gruppoDa || []).join(",") + " invece di 6 di Paky,Luca");
    if (!/6 parole vostre \(di Paky, Luca\), tutte/.test(T(P))) no("la saletta non dice «📝 6 parole vostre (di Paky, Luca), tutte» («" + T(P).slice(0, 300) + "»)");
    if (JSON.stringify(v).indexOf("KEBAB") >= 0) no("le parole di Luca sono nella foto prima della partita");
    nota(N, "saletta: 📝 6 parole vostre (di Paky, Luca), tutte; regole di partenza giuste");
    await capoLuca(X); await comincia(X);
    v = vm(C);
    var parole = v.tab.map(function (c) { return c.w; }), mie = ["SASA", "PINUCCIO", "PEPPE", "IBIZA", "KEBAB", "ZIO GINO"];
    var mancano = mie.filter(function (w) { return parole.indexOf(w) < 0; });
    if (mancano.length) no("sul tabellone mancano le parole vostre: " + mancano.join(", "));
    nota(N, "tabellone con tutte e 6 le parole vostre");
    var u = JSON.parse(P.localStorage.getItem("sg-ordine-uscite") || "{}");
    if (Object.keys(u).length !== 19) no("il telefono dell'host ricorda " + Object.keys(u).length + " parole uscite invece di 19 (25 meno le 6 vostre)");
    // il capo di turno dà l'indizio, segna 2 parole (ne verrà trovata una sola)
    var capo = capoDi(X), team = v.turno, key = chiaveCapo(X), sue = [];
    key.forEach(function (c, i) { if (c === team) sue.push(i); });
    mandaO(X, capo, { t: "indizio", parola: "ZIGOMAR", n: 2 });
    if (!await aspettaIndovina(X, 0)) no("dopo l'indizio non si indovina");
    mandaO(X, capo, { t: "intendo", x: 0, l: [sue[0], sue[1]] });
    await W.dorme(300);
    var chi = indovinoDi(X);
    var g1 = await gira(X, chi.id, sue[0]);
    if (g1.lungo !== 1) no("la prima parola dell'indizio non ha la suspense lunga (" + g1.lungo + ")");
    var g2 = await gira(X, chi.id, sue[2]);
    if (g2.lungo !== 0 || g2.ms > 1800) no("la seconda parola (si va sicuri) ha la suspense lunga: " + g2.lungo + ", " + g2.ms + " ms");
    nota(N, "suspense: prima parola " + g1.ms + " ms, seconda " + g2.ms + " ms");
    await sbaglia(X);
    var pens = await W.aspetta(function () { return (vm(C).log || []).filter(function (e) { return e.t === "pens"; })[0]; }, 4000);
    if (!pens) no("a fine turno niente «💭 pensava a»");
    if (pens.ok.length !== 1 || pens.ok[0] !== parole[sue[0]] || pens.nasc !== 1) no("«💭 pensava a» sbagliato: " + JSON.stringify(pens));
    var nascosta = parole[sue[1]];
    var card = await W.aspetta(function () { var e = W.finestra("Sara").document.querySelector(".or-pens.su"); return e && /pensava a/.test(e.textContent) ? e : null; }, 5000);
    if (!card) no("Sara non vede la scheda «💭 … pensava a»");
    else {
      if (card.textContent.indexOf(parole[sue[0]]) < 0 || !/🤫/.test(card.textContent)) no("la scheda non dice la parola trovata e 🤫 («" + card.textContent + "»)");
      if (card.textContent.indexOf(nascosta) >= 0) no("la scheda fa vedere la parola pensata non trovata");
      nota(N, "Sara vede «" + card.textContent.replace(/\s+/g, " ").trim() + "»");
    }
    if (!/pensava a/.test(T(W.finestra("Giulia")))) no("nella chat di Giulia manca la riga «💭 pensava a»");
    // la parola non trovata: mai fuori dall'host (solo nella copia di riserva)
    var sporchi = (P.__usciti || []).filter(function (s) { return !/"t":"riserva"/.test(s) && /"t":"vm"/.test(s) && /"pens"/.test(s) && s.indexOf('"nasc"') >= 0 && new RegExp('"ok":\\[[^\\]]*"' + nascosta + '"').test(s); });
    if (sporchi.length) no("la parola pensata non trovata esce dall'host");
    if (JSON.stringify(vm(C)).indexOf('"pensate"') >= 0) no("le parole pensate sono nella foto");
    // il tabellone del capo dopo: la «Cosa intendevi?» di un indizio non accetta parole girate prima
    await aspettaIndizio(X, 1);
    var capo2 = capoDi(X), t2 = vm(C).turno, k2 = chiaveCapo(X), gir = -1;
    vm(C).tab.forEach(function (c, i) { if (gir < 0 && c.g && c.c === t2) gir = i; });
    mandaO(X, capo2, { t: "indizio", parola: "PLUTONIO", n: 1 });
    await aspettaIndovina(X, 1);
    if (gir >= 0) {
      mandaO(X, capo2, { t: "intendo", x: 1, l: [gir] }); await W.dorme(400);
      await finisciConNera(X);
      var e2 = (vm(C).cosa ? vm(C).cosa.l : []).filter(function (x) { return x.p === "PLUTONIO"; })[0];
      if (e2) no("una parola girata prima dell'indizio vale come «pensata»");
      nota(N, "una parola girata prima dell'indizio non vale come pensata");
    } else await finisciConNera(X);
    senzaErrori();
    return N.join(" · ");
  } });

  COPIONE.aggiungi("po2", { nome: "Parola d'ordine: ⏳ clessidre (capo e squadra), tempo doppio al primo indizio, rossa negli ultimi 10 s, il turno passa", fai: async function () {
    var N = [], X = await stanzaOrdine(["Giulia", "Luca", "Sara"], { tempo: 90, tempoInd: 60 }), C = X.C;
    await capoLuca(X); await comincia(X);
    var v = vm(C);
    if (!v.cless || v.cless.p !== "indizio" || !v.cless.doppio || v.cless.ms < 170000) no("primo indizio: clessidra del capo " + JSON.stringify(v.cless) + " invece di 3 minuti (doppio)");
    mandaO(X, capoDi(X), { t: "indizio", parola: "ZIGOMAR", n: 2 });
    await aspettaIndovina(X, 0); v = vm(C);
    if (!v.cless || v.cless.p !== "indovina" || !v.cless.doppio || v.cless.ms < 110000) no("primo indizio: clessidra della squadra " + JSON.stringify(v.cless) + " invece di 2 minuti (doppio)");
    var ind = indovinoDi(X), wI = W.finestra(nomeDi(C, ind.id));
    if (!await W.aspetta(function () { var e = wI.document.querySelector(".or-ind"); return e && /tempo doppio/.test(e.textContent) && /\d:\d\d/.test(e.textContent); }, 3000)) no("chi indovina non vede «⏳ tempo doppio 1:59» («" + (wI.document.querySelector(".or-ind") || {}).textContent + "»)");
    nota(N, "primo indizio: capo 3:00 e squadra 2:00 (doppio)");
    await sbaglia(X);
    await aspettaIndizio(X, 1); v = vm(C);
    if (!v.cless || v.cless.doppio || v.cless.ms > 91000 || v.cless.ms < 80000) no("secondo turno: clessidra del capo " + JSON.stringify(v.cless) + " invece di 1:30");
    mandaO(X, capoDi(X), { t: "indizio", parola: "PLUTONIO", n: 1 });
    await aspettaIndovina(X, 1); v = vm(C);
    if (!v.cless || v.cless.doppio || v.cless.ms > 61000 || v.cless.ms < 50000) no("secondo indizio: clessidra della squadra " + JSON.stringify(v.cless) + " invece di 1:00");
    var turno = v.turno, ind2 = indovinoDi(X), w2 = W.finestra(nomeDi(C, ind2.id));
    var uiI = w2.__ORDINE && w2.__ORDINE.ui;
    if (uiI && !uiI.ticMio) no("a chi indovina il tic della clessidra non toccherebbe");
    // gli ultimi 10 secondi
    var rossa = await W.aspetta(function () { return w2.document.querySelector(".or-ind .or-cless.rosso"); }, 62000, 500);
    if (!rossa) no("negli ultimi 10 secondi la clessidra non diventa rossa");
    else nota(N, "rossa a " + rossa.textContent.trim());
    if (!await W.aspetta(function () { var x = vm(C); return x.turno !== turno && x.passo === "indizio"; }, 15000)) no("allo zero il turno non passa (" + vm(C).passo + ")");
    if (!(vm(C).log || []).some(function (e) { return e.t === "sis" && /Tempo scaduto per i /.test(e.testo); })) no("nella chat manca «⏳ Tempo scaduto per i …»");
    nota(N, "allo zero «⏳ Tempo scaduto» e il turno passa");
    senzaErrori();
    return N.join(" · ");
  } });

  COPIONE.aggiungi("po3", { nome: "Parola d'ordine: 🏆 serata a squadre, scelta della rivincita, niente parole ripetute, misure", fai: async function () {
    var N = [], X = await stanzaOrdine(["Giulia", "Luca", "Sara"]), C = X.C, P = X.P;
    await capoLuca(X); await comincia(X);
    var parole1 = vm(C).tab.map(function (c) { return c.w; });
    await finisciConNera(X);
    var v = vm(C), vince = v.vince;
    if (!v.serie || v.serie.n !== 1 || v.serie.v[vince] !== 1) no("dopo la prima partita la serata è " + JSON.stringify(v.serie));
    var atteso = vince === 0 ? "Rossi 1 – 0 Blu" : "Rossi 0 – 1 Blu";
    if (!await W.aspetta(function () { return X.nomi.every(function (n) { return T(W.finestra(n)).indexOf(atteso) >= 0; }); }, 6000)) no("non tutti vedono «🏆 " + atteso + "»");
    nota(N, "fine: «🏆 🔴 " + atteso + " 🔵» su tutti");
    var rm = await W.aspetta(function () { return P.document.querySelector(".or-riv-modo"); }, 4000);
    if (!rm || rm.querySelectorAll(".or-rm").length !== 3) no("l'host non ha la scelta della rivincita (3 tasti)");
    if (W.finestra("Giulia").document.querySelector(".or-riv-modo")) no("anche Giulia ha la scelta della rivincita");
    nota(N, "misure fine (host): " + await misura("Paky", ".or-sotto button, .or-stato, .or-riv-modo", "la fine con la scelta della rivincita"));
    var capi0 = vm(C).capo.slice();
    tocca(P, bottone(P, /Stessi capi/));
    if (!await W.aspetta(function () { return vm(C).rivModo === "stessi"; }, 3000)) no("«Stessi capi» non arriva all'host");
    if (!await W.aspetta(function () { return W.clicca(P, /Rivincita|Nuova partita/); }, 4000)) no("niente Rivincita");
    if (!await W.aspetta(function () { return vm(C).fase === "lobby"; }, 10000)) no("la rivincita non torna in saletta");
    if (vm(C).capo.join() !== capi0.join()) no("con «Stessi capi» i capi cambiano (" + capi0 + " → " + vm(C).capo + ")");
    if (!await W.aspetta(function () { var e = W.finestra("Sara").document.querySelector(".or-serie"); return e && e.textContent.indexOf(atteso) >= 0; }, 4000)) no("in saletta Sara non vede la serata «🏆 " + atteso + "»");
    nota(N, "saletta: stessi capi e «🏆 " + atteso + "»");
    await comincia(X);
    var parole2 = vm(C).tab.map(function (c) { return c.w; });
    var doppie = parole2.filter(function (w) { return parole1.indexOf(w) >= 0; });
    if (doppie.length) no("nella seconda partita tornano parole della prima: " + doppie.join(", "));
    nota(N, "seconda partita: 0 parole ripetute");
    await finisciConNera(X);
    if (vm(C).serie.n !== 2) no("dopo la seconda partita la serata ha " + vm(C).serie.n + " partite");
    await W.aspetta(function () { return bottone(P, /Squadre a caso/); }, 4000);
    tocca(P, bottone(P, /Squadre a caso/));
    if (!await W.aspetta(function () { return vm(C).rivModo === "caso"; }, 3000)) no("«🔀 Squadre a caso» non arriva all'host");
    W.clicca(P, /Rivincita|Nuova partita/);
    if (!await W.aspetta(function () { return vm(C).fase === "lobby"; }, 10000)) no("la seconda rivincita non torna in saletta");
    if (vm(C).serie) no("con «🔀 Squadre a caso» la serata non riparte da 0 – 0");
    var squadre = [0, 1].map(function (k) { return vm(C).players.filter(function (p) { return p.team === k; }).length; });
    if (squadre[0] !== 2 || squadre[1] !== 2) no("squadre a caso sbilanciate: " + squadre.join(" e "));
    nota(N, "«🔀 Squadre a caso»: squadre 2 e 2, serata da capo");
    senzaErrori();
    return N.join(" · ");
  } });

  // gioca contro il Bot fino alla vittoria: il capo dà «∞» e chi indovina gira tutte le parole sue
  async function battiIlBot(X, prima) {
    var fino = Date.now() + 60000;
    while (Date.now() < fino && vm(X.C).fase === "gioco") {
      var v = vm(X.C);
      if (v.passo === "indizio" && v.turno === 0 && !v.sospeso) { mandaO(X, v.capo[0], { t: "indizio", parola: "ZIGOMAR" + "ABCDEFG"[(v.storia || []).length % 7], n: 0 }); await aspettaIndovina(X); continue; }
      if (v.passo === "indovina" && !v.sospeso) {
        var key = chiaveCapo(X, 0), i = -1;
        key.forEach(function (c, j) { if (i < 0 && c === 0 && !v.tab[j].g) i = j; });
        if (prima && (v.storia || []).length === 1 && v.girate >= 1) { await sbaglia(X); prima = null; continue; }
        if (i >= 0) await gira(X, indovinoDi(X, v).id, i);
        continue;
      }
      await W.dorme(300);
    }
  }

  COPIONE.aggiungi("po4", { nome: "Parola d'ordine: 🤖 contro il Bot in 3 (saletta, turno del Bot, chi ricarica, vittoria, misure)", fai: async function () {
    var N = [], X = await stanzaOrdine(["Luca", "Sara"]), C = X.C, P = X.P;
    if (!/in 2 o 3 si gioca contro il Bot/.test(T(P))) no("la saletta in 3 non dice che si gioca contro il Bot");
    var b = await W.aspetta(function () { return bottone(P, /Siete in 3: giocate contro il Bot/); }, 4000);
    if (!b) no("l'host non ha «🤖 Siete in 3: giocate contro il Bot»");
    if (bottone(W.finestra("Luca"), /contro il Bot/)) no("anche Luca ha il tasto del Bot");
    tocca(P, b);
    if (!await W.aspetta(function () { return vm(C).vsBot; }, 3000)) no("il tasto non accende «contro il Bot»");
    var v = vm(C), bot = v.players.filter(function (p) { return p.bot; })[0];
    if (!bot || bot.team !== 1 || v.players.some(function (p) { return !p.bot && p.team !== 0; })) no("squadre sbagliate contro il Bot: " + JSON.stringify(v.players));
    if (!await W.aspetta(function () { return /Voi contro 🤖 .+ \(Bot\)/.test(T(W.finestra("Sara"))) && /Voi contro/.test(T(P)); }, 3000)) no("Sara o Paky non vedono «Voi contro 🤖 … (Bot)»");
    nota(N, "saletta: contro " + bot.nome + " (Bot), tutti nei Rossi");
    nota(N, "misure saletta: " + await misura("Sara", ".sl-go, .or-squadre, .or-squadre button", "la saletta contro il Bot"));
    await capoLuca(X); await comincia(X);
    v = vm(C);
    if (v.turno !== 0 || v.passo !== "indizio") no("contro il Bot non cominciate voi (" + v.turno + "/" + v.passo + ")");
    if (vm(C).resto[0] !== 9 || vm(C).resto[1] !== 8) no("parole: voi " + vm(C).resto[0] + ", il Bot " + vm(C).resto[1] + " invece di 9 e 8");
    // primo turno: una giusta e poi una sbagliata → tocca al Bot
    mandaO(X, capoDi(X), { t: "indizio", parola: "ZIGOMAR", n: 2 });
    await aspettaIndovina(X, 0);
    var key = chiaveCapo(X, 0), i0 = key.indexOf(0);
    await gira(X, indovinoDi(X).id, i0);
    var r1 = vm(C).resto[1];
    await sbaglia(X);
    var r1b = vm(C).resto[1];
    var botT = await W.aspetta(function () { var x = vm(C); return x.passo === "bot" || (x.turno === 0 && x.resto[1] < r1b) ? x : null; }, 4000, 100);
    if (!botT) no("dopo il vostro turno non tocca al Bot (" + vm(C).passo + ")");
    if (!/scopre una sua parola/.test(T(W.finestra("Sara"))) && vm(C).passo === "bot") no("Sara non vede «🤖 … scopre una sua parola»");
    if (!await W.aspetta(function () { var x = vm(C); return x.turno === 0 && x.passo === "indizio" && x.resto[1] === r1b - 1; }, 9000)) no("il Bot non scopre una sua parola (resto " + r1 + " → " + vm(C).resto[1] + ")");
    var rigaBot = (vm(C).log || []).filter(function (e) { return e.t === "gira" && e.id === "botsq"; })[0];
    if (!rigaBot || rigaBot.nome !== bot.nome) no("nella chat manca la parola scoperta dal Bot");
    nota(N, "turno del Bot: " + bot.nome + " scopre " + (rigaBot && rigaBot.w));
    // Sara ricarica a metà
    await W.ricarica("Sara");
    var wS = await W.aspetta(function () { var w = W.finestra("Sara"); return w && w.document.querySelector(".or-tab .or-carta.g") ? w : null; }, 12000);
    if (!wS) no("Sara dopo la ricarica non ritrova il tabellone");
    nota(N, "Sara ricarica e ritrova il tabellone");
    await battiIlBot(X);
    v = vm(C);
    if (v.fase !== "fine" || v.vince !== 0) no("la partita contro il Bot non finisce con la vostra vittoria (" + v.fase + ", vince " + v.vince + ")");
    if ((v.classifica || []).some(function (r) { return r.id === "botsq"; })) no("il Bot è nella classifica");
    if (!await W.aspetta(function () { return /Avete battuto/.test(T(W.finestra("Luca"))); }, 4000)) no("Luca non vede «🎉 Avete battuto …»");
    if (!v.serie || v.serie.v[0] !== 1) no("la serata contro il Bot non conta la vittoria");
    if (!/Voi 1 – 0/.test(T(P))) no("la fine non dice «🏆 Voi 1 – 0 " + bot.nome + "»");
    if (P.document.querySelectorAll(".or-riv-modo .or-rm").length !== 2) no("contro il Bot la scelta della rivincita non ha 2 tasti");
    nota(N, "fine: «Avete battuto " + bot.nome + "», 🏆 Voi 1 – 0, Bot fuori classifica");
    // si torna alle squadre? Con 3 no: il tasto «fate 2 squadre» non c'è
    W.clicca(P, /Rivincita|Nuova partita/);
    if (!await W.aspetta(function () { return vm(C).fase === "lobby"; }, 10000)) no("la rivincita non torna in saletta");
    if (!vm(C).vsBot || !vm(C).players.some(function (p) { return p.bot; })) no("alla rivincita il Bot non c'è più");
    if (bottone(P, /fate 2 squadre/)) no("in 3 c'è «fate 2 squadre»");
    senzaErrori();
    return N.join(" · ");
  } });

  COPIONE.aggiungi("po5", { nome: "Parola d'ordine: 🤖 contro il Bot, l'host sparisce: l'amico che porta avanti la partita fa giocare il Bot", fai: async function () {
    var N = [], X = await stanzaOrdine(["Luca", "Sara"], { squadre: "bot" }), C = X.C;
    if (!await W.aspetta(function () { return vm(C).vsBot; }, 3000)) no("con la regola «🤖 Contro il Bot» la saletta non è contro il Bot");
    await capoLuca(X); await comincia(X);
    mandaO(X, capoDi(X), { t: "indizio", parola: "ZIGOMAR", n: 1 });
    await aspettaIndovina(X, 0);
    await W.dorme(3500);   // (la copia di riserva parte)
    // (dal Passo 5 la riserva è del core: chi tiene la partita è in _g/_h della stanza)
    var r1 = vm(C).resto[1], g0 = (W.statoStanza(C) || {})._g || 1;
    await sbaglia(X);
    A.muore("Paky");   // l'host sparisce mentre tocca al Bot
    var nuovo = await W.aspetta(function () { var s2 = W.statoStanza(C) || {}, x = vm(C); return s2._g > g0 && s2._h && s2._h !== "host" && x.hostId === s2._h && x; }, 40000, 250);
    if (!nuovo) no("nessun amico prende il posto dell'host");
    X.hostId = nuovo.hostId;
    nota(N, "subentra " + nomeDi(C, nuovo.hostId));
    if (!await W.aspetta(function () { var x = vm(C); return x.turno === 0 && x.passo === "indizio" && x.resto[1] < r1 - (x.log.some(function (e) { return e.t === "gira" && e.c === 1 && e.id !== "botsq"; }) ? 1 : 0); }, 15000)) no("col nuovo host il Bot non gioca il suo turno (" + vm(C).passo + ", resto " + vm(C).resto[1] + ")");
    nota(N, "il Bot ha giocato col nuovo host");
    await battiIlBot(X);
    if (vm(C).fase !== "fine") no("la partita col nuovo host non finisce");
    senzaErrori();
    return N.join(" · ");
  } });

  COPIONE.aggiungi("po6", { nome: "Parola d'ordine nella Sala in 3: parte già contro il Bot, riga «📜», fino alla fine e Rivincita", fai: async function () {
    var N = [];
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true, po: true });
    var S = await A.apriSalaNuova("Paky");
    var amici = ["Luca", "Sara"];
    for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true, po: true });
    if (!await W.aspetta(function () { return (vm(S).membri || []).length === 3; }, 10000)) no("nella Sala non entrano in 3");
    var C = await A.lanciaDallaSala("Paky", S, "Parola d'ordine");
    if (!await W.aspetta(function () { return (vm(C).players || []).filter(function (p) { return !p.bot; }).length === 3; }, 10000)) no("nella saletta del gioco non arrivano in 3");
    var X = { P: P, C: C, hostId: "host", nomi: ["Paky"].concat(amici) };
    if (!vm(C).vsBot) {
      nota(N, "(la Sala non ha passato i giocatori alle regole: tocco il tasto)");
      var b = await W.aspetta(function () { return bottone(P, /giocate contro il Bot/); }, 4000);
      if (!b) no("nella Sala in 3 non c'è «🤖 … giocate contro il Bot»"); else tocca(P, b);
      await W.aspetta(function () { return vm(C).vsBot; }, 3000);
    } else nota(N, "nella Sala in 3 si parte già contro il Bot");
    var rr = await W.aspetta(function () { var x = A.regoleDi(W.finestra("Luca")); return /contro il Bot/.test(x) ? x : null; }, 5000);
    if (!rr) nota(N, "riga 📜: «" + A.regoleDi(W.finestra("Luca")) + "»"); else nota(N, "📜 " + rr);
    await capoLuca(X);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 10000)) no("non comincia");
    await battiIlBot(X, true);
    if (vm(C).fase !== "fine") no("nella Sala la partita contro il Bot non finisce");
    if (!await W.aspetta(function () { return /Rivincita/.test(T(P)); }, 6000)) no("nella Sala niente tasti di fine");
    W.clicca(P, /Rivincita/);
    if (!await W.aspetta(function () { return vm(C).fase === "lobby" || (vm(C).fase === "gioco" && vm(C).serie); }, 12000)) no("la Rivincita nella Sala non riparte");
    if (!vm(C).vsBot) no("alla Rivincita nella Sala non si è più contro il Bot");
    nota(N, "Rivincita nella Sala: ancora contro il Bot, 🏆 " + JSON.stringify(vm(C).serie && vm(C).serie.v));
    senzaErrori();
    return N.join(" · ");
  } });

  COPIONE.aggiungi("po7", { nome: "Parola d'ordine: i mazzi «⚽ Serie A e Fanta» e «🌶️ Serata»", fai: async function () {
    var N = [];
    var P = await W.apriTel("Paky", { x: 0, po: true, prima: function (w) { w.__imp = { mazzo: "fanta" }; } });
    var M = P.SG_ORDINE_MAZZI || {};
    ["fanta", "serata"].forEach(function (id) {
      var l = M[id] || [];
      if (l.length < 120) no("il mazzo " + id + " ha solo " + l.length + " parole");
      var brutte = l.filter(function (w) { return w.length > 12 || /[^A-ZÀÈÉÌÒÙ' ]/.test(w); });
      if (brutte.length) no("nel mazzo " + id + " parole che non stanno nelle caselle: " + brutte.join(", "));
    });
    nota(N, "mazzi: fanta " + (M.fanta || []).length + ", serata " + (M.serata || []).length);
    var C = await W.apriStanza(P, "Parola d'ordine");
    var amici = ["Giulia", "Luca", "Sara"];
    for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], { hash: "gioco=ordine&stanza=" + C, x: 185 * (i + 1), po: true });
    await W.aspetta(function () { return (vm(C).players || []).length === 4; }, 10000);
    var X = { P: P, C: C, hostId: "host", nomi: ["Paky"].concat(amici) };
    if (!/Mazzo ⚽ Serie A e Fanta/.test(T(P))) no("la saletta non dice «Mazzo ⚽ Serie A e Fanta»");
    await comincia(X);
    var fuori = vm(C).tab.map(function (c) { return c.w; }).filter(function (w) { return M.fanta.indexOf(w) < 0; });
    if (fuori.length) no("parole non del mazzo Fanta: " + fuori.join(", "));
    nota(N, "tabellone tutto ⚽ Serie A e Fanta: " + vm(C).tab.slice(0, 6).map(function (c) { return c.w; }).join(", ") + "…");
    // le regole: il Classico di partenza, 🌶️ Serata spento
    var g = P.__gOrdine;
    if (g) {
      var box = P.document.createElement("div"), dove = {};
      g.impostazioni(box, dove, { el: P.__t.el, modo: "online" });
      if (dove.mazzo !== "classico") no("il mazzo di partenza è " + dove.mazzo);
      var r = g.riassunto({ mazzo: "serata" });
      if (!/🌶️ Serata/.test(r)) no("la riga 📜 non dice il mazzo 🌶️ Serata («" + r + "»)");
      nota(N, "di partenza Classico; 📜 «" + r + "»");
    }
    senzaErrori();
    return N.join(" · ");
  } });

  COPIONE.aggiungi("po8", { nome: "Parola d'ordine: ⚡ ritmo veloce (suspense sempre breve)", fai: async function () {
    var N = [], X = await stanzaOrdine(["Giulia", "Luca", "Sara"], { ritmo: "veloce" }), C = X.C;
    if (vm(C).ritmo !== "veloce" || !/⚡ Ritmo veloce/.test(T(X.P))) no("la saletta non è in ritmo veloce");
    await capoLuca(X); await comincia(X);
    var team = vm(C).turno, key = chiaveCapo(X), sue = [];
    key.forEach(function (c, i) { if (c === team) sue.push(i); });
    mandaO(X, capoDi(X), { t: "indizio", parola: "ZIGOMAR", n: 1 });
    await aspettaIndovina(X, 0);
    var g = await gira(X, indovinoDi(X).id, sue[0]);
    if (g.lungo !== 0 || g.ms > 1600) no("in ritmo veloce la prima parola ha la suspense lunga (" + g.lungo + ", " + g.ms + " ms)");
    nota(N, "prima parola in " + g.ms + " ms");
    await finisciConNera(X);
    senzaErrori();
    return N.join(" · ");
  } });
})();

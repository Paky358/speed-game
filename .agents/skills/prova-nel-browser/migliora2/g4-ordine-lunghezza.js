// PROVE DEI MIGLIORAMENTI (giro 2, g4): Parola d'ordine («🤔 Cosa intendevi?») e Stessa Lunghezza d'Onda («📝 Le nostre scale»
// e «⏩ Avanti» a maggioranza dopo la rivelazione).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("migliora2/g4-ordine-lunghezza.js"); await COPIONE.prova("or1")
//
// or1: online in 4 (Luca e Giulia capi): dopo l'indizio solo il capo vede «🤔 Quali parole intendevi?»; parole degli altri e
//      troppe parole rifiutate, «✅ Fatto · 2/2»; le parole pensate MAI nella foto né nei messaggi dell'host durante la partita;
//      il capo ricarica e la riga non torna; a fine partita «🤔 Cosa intendevi?» su tutti i telefoni (‹ › un indizio alla volta,
//      ✅ / 🍀 / ❌, premio «🧠 Più in sintonia»), «⏩ Avanti 0 su 3» → «✅ Avanti 1 su 3», chi ricarica la ritrova, con più di metà
//      si va ai tasti di fine; «🤔 Rivedi» la riapre; misure a 360x640 e 412x915 (riga del capo e schermata di fine).
// or2: l'host sparisce dopo che il capo ha detto cosa intendeva: l'amico che porta avanti la partita ha ancora le parole pensate
//      (a fine partita ci sono), e l'«Avanti» conta solo chi è rimasto.
// or3: nella Sala: «Cosa intendevi?», poi i tasti di fine comuni (Rivincita) e la Rivincita riparte pulita; con la regola spenta
//      (⚙️ «🤔 Cosa intendevi?: No») niente riga e niente schermata; la riga «📜 Si gioca così» la dice.
// or4: «🧪 Prova da solo» (IL PAPPONE): tu capo coi Bot, il Bot capo dice anche lui cosa intendeva, schermata a fine prova,
//      «⏩ Avanti 0 su 1» e poi i tasti della prova.
// or5: squadre fisse, chi indovina per il capo si spegne mentre il capo può ancora segnare: «⏳ aspettiamo Sara» su tutti senza
//      errori, lei torna, il capo segna e «Fatto», a fine partita l'indizio c'è.
// lu1: «📝 Le nostre scale» nelle regole della saletta: righe giuste e sbagliate, doppioni (anche girati), salvate sul profilo e sul
//      telefono, ✕, «📋 Copia» una per riga, «Solo le nostre»; la riga «📜» e la riassunto le dicono; misure della foglia.
// lu2: online in 3 + uno che guarda, «Solo le nostre» e Misto: ogni scala è vostra (firma «📝 della compagnia» su tutti i telefoni,
//      📝 sulle carte del Classico), nessuna si ripete; nella rivelazione «⏩ Avanti 0 su 2», il mio tocco «✅ Avanti 1 su 2»,
//      chi guarda non ha il tasto, il secondo tocco fa partire subito; senza tocchi si va avanti col conto; chi ricarica ritrova
//      il suo «✅»; misure della rivelazione.
// lu3: sullo stesso telefono, tutti insieme, «Solo le nostre»: le scale vostre con la firma, nessuna ripetuta, fino al voto.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T;
  var GRUPPO = ["ordine", "lunghezza"];

  // ---- la spia (solo con apriTel(nome, { g4: true })): w.__imp = regole per la prova (le legge l'host), w.__g4[id] = il gioco,
  //      w.__cbH[gid] = la stanza dell'host, w.__usciti = tutto quello che l'host manda (per cercare i segreti) ----
  if (!W.__prepG4) {
    W.__prepG4 = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepG4(w, nome, opz);
      if (!opz || !opz.g4) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) { if (g && GRUPPO.indexOf(g.id) >= 0) spia(w, g); return reg.apply(this, arguments); };
      } });
    };
  }
  function spia(w, g) {
    w.__g4 = w.__g4 || {}; w.__g4[g.id] = g;
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
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function nomeDi(C, id) { var p = (vm(C).players || []).filter(function (x) { return x.id === id; })[0]; return p ? p.nome : null; }
  function tocca(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click();
  }
  function bottone(w, re, sel) { return [].filter.call(w.document.querySelectorAll(sel || "button"), function (b) { return re.test(b.textContent) && b.offsetParent; })[0] || null; }
  function scrivi(w, inp, testo) { inp.value = testo; inp.dispatchEvent(new w.Event("input", { bubbles: true })); inp.dispatchEvent(new w.Event("change", { bubbles: true })); }
  function senzaErrori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  // le misure: niente scorre e i nodi scelti stanno dentro lo schermo
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

  // =========================================================
  //  PAROLA D'ORDINE
  // =========================================================
  // la chiave letta dal tabellone di un capo (le classi c0/c1/c2/cn/cx delle caselle)
  function chiaveDa(w) { return [].map.call(w.document.querySelectorAll(".or-tab .or-carta"), function (b) { var m = / c(\d|n|x)(\s|$)/.exec(b.className); return m ? (/\d/.test(m[1]) ? +m[1] : m[1]) : null; }); }
  function carte(w) { return w.document.querySelectorAll(".or-tab .or-carta"); }
  function mandaO(X, id, m) {
    if (id === X.hostId) { var cb = X.P.__cbH.ordine; if (!cb) no("non trovo la stanza dell'host"); cb.onMsg(X.hostId, m); return; }
    var n = nomeDi(X.C, id); var h = n && W.reteDi(n); if (h) h.invia(m);
  }
  // Paky apre la stanza (percorso di prima) e gli amici entrano; capi: Luca (squadra di Paky) e Giulia
  async function stanzaOrdine(amici, imp) {
    var P = await W.apriTel("Paky", { x: 0, g4: true, prima: function (w) { w.__imp = imp || null; } });
    var C = await W.apriStanza(P, "Parola d'ordine");
    for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], { hash: "gioco=ordine&stanza=" + C, x: 185 * (i + 1), g4: true });
    if (!await W.aspetta(function () { return (vm(C).players || []).length === amici.length + 1; }, 10000)) no("non entrano tutti (" + (vm(C).players || []).length + ")");
    return { P: P, C: C, hostId: "host", nomi: ["Paky"].concat(amici) };
  }
  async function capiECominci(X) {
    var v = vm(X.C), luca = (v.players || []).filter(function (p) { return p.nome === "Luca"; })[0];
    if (luca) mandaO(X, luca.id, { t: "capo" });
    await W.aspetta(function () { var x = vm(X.C); return x.capo && x.capo.indexOf(luca.id) >= 0; }, 3000);
    if (!await W.aspetta(function () { return W.clicca(X.P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(X.C).fase === "gioco"; }, 10000)) no("la partita non comincia (" + vm(X.C).fase + ")");
    await W.dorme(600);
  }
  function capoDi(X) { var v = vm(X.C); return v.capo[v.turno]; }
  function indovinoDi(X, v) { v = v || vm(X.C); return (v.players || []).filter(function (p) { return p.team === v.turno && p.id !== v.capo[v.turno] && !p.via; })[0]; }
  async function aspettaIndovina(X, k) { return W.aspetta(function () { var v = vm(X.C); return v.passo === "indovina" && !v.sospeso && (k == null || (v.storia || []).length > k); }, 6000); }
  async function aspettaTurno(X, k) { return W.aspetta(function () { var v = vm(X.C); return v.fase !== "gioco" || (v.passo === "indizio" && (v.storia || []).length === k && !v.sospeso); }, 9000); }
  async function gira(X, chi, i) {
    var n0 = (vm(X.C).log || []).length ? vm(X.C).log[vm(X.C).log.length - 1].n : 0;
    mandaO(X, chi, { t: "gira", i: i });
    await W.aspetta(function () { var v = vm(X.C); var l = v.log || []; return l.length && l[l.length - 1].n > n0 && !v.sospeso; }, 6000);
  }
  // un capo (dal suo telefono) tocca le sue parole sul tabellone e «Fatto»
  function caselleDi(w, team) { return [].filter.call(carte(w), function (b) { return b.classList.contains("c" + team) && !b.classList.contains("g"); }); }

  COPIONE.aggiungi("or1", { nome: "Parola d'ordine: «🤔 Cosa intendevi?» online in 4 (capo, segreti, ricarica, fine, Avanti a maggioranza, misure)", fai: async function () {
    var N = [], X = await stanzaOrdine(["Giulia", "Luca", "Sara"]), C = X.C, P = X.P;
    if (!vm(C).intendi) no("la regola «Cosa intendevi?» non è accesa di base");
    if (!/Cosa intendevi/.test(T(P))) no("la saletta non dice «🤔 Cosa intendevi?»");
    await capiECominci(X);
    // ---- turno 1 ----
    var v = vm(C), capo = capoDi(X), nCapo = nomeDi(C, capo), wC = W.finestra(nCapo), team = v.turno;
    mandaO(X, capo, { t: "indizio", parola: "ZIGOMAR", n: 2 });
    if (!await aspettaIndovina(X, 0)) no("dopo l'indizio non si indovina");
    var riga = await W.aspetta(function () { return /Quali parole intendevi/.test(T(wC)) ? 1 : null; }, 4000);
    if (!riga) no(nCapo + " (capo) non vede «Quali parole intendevi?» («" + T(wC).slice(-160) + "»)");
    X.nomi.filter(function (n) { return n !== nCapo; }).forEach(function (n) { if (/Quali parole intendevi/.test(T(W.finestra(n)))) no(n + " vede la riga del capo"); });
    nota(N, "riga «🤔 Quali parole intendevi?» solo a " + nCapo);
    var fatto = bottone(wC, /Fatto/);
    if (!fatto || !fatto.disabled) no("«Fatto» non c'è o è acceso senza parole");
    // una parola degli altri: niente
    var altra = [].filter.call(carte(wC), function (b) { return !b.classList.contains("c" + team) && !b.classList.contains("g"); })[0];
    altra.click(); await W.dorme(150);
    if (wC.document.querySelector(".or-carta.pensata")) no("una parola dell'altra squadra si segna come pensata");
    var mie = caselleDi(wC, team);
    mie[0].click(); await W.dorme(100); mie[1].click(); await W.dorme(100); mie[2].click(); await W.dorme(150);
    var pensate = [].filter.call(carte(wC), function (b) { return b.classList.contains("pensata"); });
    if (pensate.length !== 2) no("segnate " + pensate.length + " parole invece di 2 (il numero dell'indizio)");
    if (!/Fatto · 2\/2/.test(bottone(wC, /Fatto/).textContent)) no("il tasto dice «" + bottone(wC, /Fatto/).textContent + "» invece di «✅ Fatto · 2/2»");
    var parolePensate = pensate.map(function (b) { return b.querySelector(".or-w").textContent; });
    var iPensate = [].map.call(carte(wC), function (b, i) { return b.classList.contains("pensata") ? i : -1; }).filter(function (i) { return i >= 0; });
    tocca(wC, bottone(wC, /Fatto/));
    if (!await W.aspetta(function () { return !/Quali parole intendevi/.test(T(wC)) && /non puoi aiutarli/.test(T(wC)); }, 3000)) no("dopo «Fatto» la riga resta («" + T(wC).slice(-120) + "»)");
    nota(N, nCapo + " intende " + parolePensate.join(", "));
    // il capo ricarica: la riga non torna
    if (nCapo !== "Paky") {
      await W.ricarica(nCapo);
      var wC2 = await W.aspetta(function () { var w = W.finestra(nCapo); return w && w.document.querySelector(".or-tab .or-carta.chiave") ? w : null; }, 12000);
      if (!wC2) no(nCapo + " dopo la ricarica non ritrova il tabellone con la chiave");
      await W.dorme(800);
      if (/Quali parole intendevi/.test(T(wC2))) no(nCapo + " dopo la ricarica rivede la riga «Quali parole intendevi?»");
      nota(N, nCapo + " ricarica: la riga non torna");
    }
    // la squadra trova una parola pensata, poi ne sbaglia una
    var chi = indovinoDi(X), key = chiaveDa(W.finestra(nCapo));
    await gira(X, chi.id, iPensate[0]);
    await gira(X, chi.id, key.indexOf(1 - team));   // (una parola degli altri: il turno passa sempre; una di nessuno poteva essere quella d'oro)
    // ---- turno 2: l'altro capo dice 1 parola per messaggio ----
    if (!await aspettaTurno(X, 1)) no("il turno non passa");
    var capo2 = capoDi(X), team2 = vm(C).turno;
    mandaO(X, capo2, { t: "indizio", parola: "PLUTONIO", n: 1 });
    await aspettaIndovina(X, 1);
    var key2 = chiaveDa(W.finestra(nomeDi(C, capo2)));
    var cc2 = carte(W.finestra(nomeDi(C, capo2))), sua = key2.findIndex(function (c, i) { return c === team2 && !cc2[i].classList.contains("g"); });   // (una ancora coperta: quelle girate prima dell'indizio non valgono)
    mandaO(X, capo2, { t: "intendo", x: 1, l: [sua, key2.indexOf(team2 === 0 ? 1 : 0)] });   // (la parola dell'altra squadra non vale)
    await W.dorme(400);
    // i segreti: mai nella foto, mai nei messaggi dell'host durante la partita
    if (JSON.stringify(vm(C)).match(/"pensate"|"cosa":\{|"pen"/)) no("le parole pensate sono nella foto durante la partita");
    var sporchi = (P.__usciti || []).filter(function (s) { return /"pensate"|"intendo"/.test(s) && !/"t":"riserva"/.test(s); });
    if (sporchi.length) no("l'host manda le parole pensate: " + sporchi[0].slice(0, 120));
    nota(N, "le parole pensate non escono dall'host (solo nella copia di riserva per il vice)");
    var chi2 = indovinoDi(X);
    await gira(X, chi2.id, key2.indexOf("x"));   // la parola nera: fine
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 6000)) no("la partita non finisce");
    v = vm(C);
    if (!v.cosa || v.cosa.l.length !== 2) no("a fine partita «cosa» ha " + (v.cosa ? v.cosa.l.length : 0) + " indizi invece di 2");
    var e1 = v.cosa.l[0];
    if (e1.p !== "ZIGOMAR" || e1.pen.length !== 2 || e1.pen.filter(function (x) { return x.ok; }).length !== 1) no("primo indizio sbagliato: " + JSON.stringify(e1));
    if (v.cosa.l[1].pen.length !== 1) no("il secondo capo ha più parole pensate del permesso: " + JSON.stringify(v.cosa.l[1].pen));
    if (!v.rivedi || v.rivedi.servono !== 3) no("«Avanti»: servono " + (v.rivedi && v.rivedi.servono) + " invece di 3");
    // la schermata su tutti i telefoni (dopo la festa)
    var tutti = await W.aspetta(function () { return X.nomi.every(function (n) { var r = W.finestra(n).document.querySelector(".or-riv.su"); return r && /pensava/.test(r.textContent); }); }, 7000);
    if (!tutti) no("«🤔 Cosa intendevi?» non compare su tutti: " + X.nomi.map(function (n) { return n + ":" + !!W.finestra(n).document.querySelector(".or-riv.su"); }).join(" "));
    var R = P.document.querySelector(".or-riv");
    if (!/1 di 2/.test(R.textContent)) no("la schermata non dice «1 di 2»");
    if (R.textContent.indexOf(parolePensate[0]) < 0 || R.textContent.indexOf("ZIGOMAR") < 0) no("la prima pagina non ha l'indizio e le parole pensate («" + R.textContent.slice(0, 160) + "»)");
    if (!/✅/.test(R.textContent) || !/Più in sintonia/.test(R.textContent)) no("mancano ✅ o il premio «🧠 Più in sintonia»");
    var frecce = R.querySelectorAll(".or-riv-fr");
    if (!frecce[0].disabled || frecce[1].disabled) no("le frecce ‹ › non sono giuste alla prima pagina");
    frecce[1].click(); await W.dorme(150);
    if (!/2 di 2/.test(R.textContent) || R.textContent.indexOf("PLUTONIO") < 0) no("› non porta al secondo indizio");
    if (!/💣/.test(R.textContent)) no("la parola nera toccata non ha 💣");
    nota(N, "fine: «" + R.querySelector(".or-riv-premio").textContent + "»");
    // le misure della schermata
    nota(N, "misure fine: " + await misura("Sara", ".or-riv, .or-riv button, .or-sotto button, .or-riv-premio", "«Cosa intendevi?»"));
    // «⏩ Avanti» a maggioranza (servono 3 su 4)
    var bP = bottone(P, /Avanti/, ".or-sotto button");
    if (!bP || !/0 su 3/.test(bP.textContent)) no("Paky non ha «⏩ Avanti 0 su 3» («" + (bP && bP.textContent) + "»)");
    if (!/Si va avanti tra/.test(T(P))) no("manca il conto «Si va avanti tra…»");
    tocca(P, bP); await W.dorme(300);
    if (!/✅ Avanti/.test(bP.textContent) || !/1 su 3/.test(bP.textContent) || !bP.disabled) no("dopo il tocco Paky ha «" + bP.textContent + "»");
    var bG = bottone(W.finestra("Giulia"), /Avanti/, ".or-sotto button");
    if (!await W.aspetta(function () { return /1 su 3/.test(bG.textContent); }, 2000)) no("Giulia non vede «1 su 3» («" + bG.textContent + "»)");
    tocca(W.finestra("Giulia"), bG); await W.dorme(300);
    // Sara ricarica: ritrova la schermata subito
    await W.ricarica("Sara");
    var wS = await W.aspetta(function () { var w = W.finestra("Sara"); return w && w.document.querySelector(".or-riv.su") && bottone(w, /Avanti/, ".or-sotto button") ? w : null; }, 12000);
    if (!wS) no("Sara dopo la ricarica non ritrova «Cosa intendevi?» («" + T(W.finestra("Sara")).slice(-120) + "»)");
    if (!/2 su 3/.test(bottone(wS, /Avanti/, ".or-sotto button").textContent)) no("Sara ricaricata non vede «2 su 3»");
    if (vm(C).rivedi == null) no("con 2 su 3 la schermata si è già chiusa");
    tocca(wS, bottone(wS, /Avanti/, ".or-sotto button"));
    if (!await W.aspetta(function () { return !vm(C).rivedi; }, 3000)) no("con 3 su 4 non si va avanti");
    if (!await W.aspetta(function () { return !P.document.querySelector(".or-riv.su") && /Nuova partita|Rivincita/.test(T(P)); }, 3000)) no("dopo «Avanti» Paky non ha i tasti di fine («" + T(P).slice(-120) + "»)");
    // «🤔 Rivedi» la riapre, ✕ la chiude
    var riv = bottone(P, /Rivedi/);
    if (!riv) no("a fine partita non c'è «🤔 Rivedi»");
    riv.click(); await W.dorme(300);
    if (!P.document.querySelector(".or-riv.su")) no("«🤔 Rivedi» non riapre la schermata");
    P.document.querySelector(".or-riv-x").click(); await W.dorme(300);
    if (P.document.querySelector(".or-riv.su")) no("✕ non chiude la schermata");
    nota(N, "Avanti 1 → 2 → (Sara ricarica) 3 su 3: tasti di fine; «🤔 Rivedi» riapre");
    senzaErrori();
    return N.join(" · ");
  } });

  // misure della riga del capo (a parte: serve un turno fresco)
  COPIONE.aggiungi("or1b", { nome: "Parola d'ordine: misure della riga «Quali parole intendevi?» del capo", fai: async function () {
    var X = await stanzaOrdine(["Giulia", "Luca", "Sara"]), C = X.C;
    await capiECominci(X);
    var capo = capoDi(X), nCapo = nomeDi(C, capo);
    mandaO(X, capo, { t: "indizio", parola: "ZIGOMAR", n: 3 });
    await aspettaIndovina(X, 0);
    if (!await W.aspetta(function () { return /Quali parole intendevi/.test(T(W.finestra(nCapo))); }, 4000)) no("niente riga del capo");
    await W.dorme(9000);   // (prima finisce la regia: presentazione e indizio, la telecamera torna sul tabellone)
    var r = await misura(nCapo, ".or-sotto button, .or-stato", "la riga del capo");   // (le caselle stanno nello studio: le sposta la telecamera)
    senzaErrori();
    return "riga del capo senza scorrere: " + r;
  } });

  COPIONE.aggiungi("or2", { nome: "Parola d'ordine: l'host sparisce, le parole pensate restano col nuovo host", fai: async function () {
    var X = await stanzaOrdine(["Giulia", "Luca", "Sara", "Marco"]), C = X.C;
    await capiECominci(X);
    // si aspetta il turno di Luca o di Giulia (capi ospiti)
    var capo = capoDi(X), nCapo = nomeDi(C, capo);
    mandaO(X, capo, { t: "indizio", parola: "ZIGOMAR", n: 2 });
    await aspettaIndovina(X, 0);
    var team = vm(C).turno, key = chiaveDa(W.finestra(nCapo === "Paky" ? "Paky" : nCapo));
    var mie = []; key.forEach(function (c, i) { if (c === team) mie.push(i); });
    mandaO(X, capo, { t: "intendo", x: 0, l: mie.slice(0, 2) });
    await W.dorme(3500);   // (la copia di riserva parte)
    var gen0 = vm(C).gen;
    W.spegni("Paky");
    var nuovo = await W.aspetta(function () { var v = vm(C); return v.gen > gen0 && v.hostId !== "host" && v; }, 40000, 250);
    if (!nuovo) no("nessun amico prende il posto dell'host");
    X.hostId = nuovo.hostId;
    var nHost = nomeDi(C, nuovo.hostId);
    await W.dorme(6000);   // (l'appello)
    // si finisce: chi indovina gira una parola pensata e poi la nera
    var v = vm(C);
    if (v.fase === "gioco" && v.passo === "indovina" && v.turno === team) {
      var chi = indovinoDi(X, v);
      if (chi) { await gira(X, chi.id, mie[0]); }
    }
    var fino = Date.now() + 60000;
    while (Date.now() < fino && vm(C).fase !== "fine") {
      v = vm(C);
      var cp = v.capo[v.turno], wcp = W.finestra(nomeDi(C, cp) || "");
      if (v.passo === "indizio" && cp) mandaO(X, cp, { t: "indizio", parola: "PLUTONIO", n: 1 });
      else if (v.passo === "indovina" && !v.sospeso && wcp) { var k2 = chiaveDa(wcp), ch = indovinoDi(X, v); if (ch) await gira(X, ch.id, k2.indexOf("x")); }
      await W.dorme(700);
    }
    v = vm(C);
    if (v.fase !== "fine") no("la partita col nuovo host non finisce (" + v.fase + "/" + v.passo + ")");
    var e = v.cosa && v.cosa.l.filter(function (x) { return x.p === "ZIGOMAR"; })[0];
    if (!e || e.pen.length !== 2) no("col nuovo host (" + nHost + ") le parole pensate prima del cambio si sono perse: " + JSON.stringify(v.cosa));
    if (v.rivedi && v.rivedi.servono !== 3) no("«Avanti» col nuovo host: servono " + v.rivedi.servono + " invece di 3 (4 presenti)");
    senzaErrori();
    return "subentra " + nHost + "; a fine partita ZIGOMAR ha ancora le 2 parole pensate (" + e.pen.map(function (x) { return x.w + (x.ok ? "✅" : ""); }).join(", ") + "), Avanti su " + (v.rivedi ? v.rivedi.servono : "?");
  } });

  COPIONE.aggiungi("or3", { nome: "Parola d'ordine nella Sala: «Cosa intendevi?», poi Rivincita; regola spenta = niente riga", fai: async function () {
    var N = [];
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true, g4: true });
    var S = await A.apriSalaNuova("Paky");
    var amici = ["Giulia", "Luca", "Sara"];
    for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true, g4: true });
    if (!await W.aspetta(function () { return (vm(S).membri || []).length === 4; }, 10000)) no("nella Sala non entrano in 4");
    var C = await A.lanciaDallaSala("Paky", S, "Parola d'ordine");
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 4; }, 10000)) no("nella saletta del gioco non arrivano in 4");
    var rr = await W.aspetta(function () { var x = A.regoleDi(W.finestra("Giulia")); return /Cosa intendevi/.test(x) ? x : null; }, 5000);
    if (!rr) no("la riga «📜 Si gioca così» di Giulia non dice «🤔 Cosa intendevi?» («" + A.regoleDi(W.finestra("Giulia")) + "»)");
    nota(N, "📜 " + rr);
    var X = { P: P, C: C, hostId: "host", nomi: ["Paky"].concat(amici) };
    var luca = vm(C).players.filter(function (p) { return p.nome === "Luca"; })[0];
    mandaO(X, luca.id, { t: "capo" }); await W.dorme(500);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 10000)) no("non comincia");
    var capo = capoDi(X), nCapo = nomeDi(C, capo);
    mandaO(X, capo, { t: "indizio", parola: "ZIGOMAR", n: 1 });
    await aspettaIndovina(X, 0);
    var wC = W.finestra(nCapo);
    if (!await W.aspetta(function () { return /Quali parole intendevi/.test(T(wC)); }, 4000)) no("nella Sala il capo non ha la riga");
    tocca(wC, caselleDi(wC, vm(C).turno)[0]); await W.dorme(150); tocca(wC, bottone(wC, /Fatto/));
    var key = chiaveDa(wC); await gira(X, indovinoDi(X).id, key.indexOf("x"));
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 6000)) no("non finisce");
    if (!await W.aspetta(function () { return X.nomi.every(function (n) { return W.finestra(n).document.querySelector(".or-riv.su"); }); }, 7000)) no("nella Sala la schermata non compare a tutti");
    if (/Rivincita|Cambia gioco/.test(T(P).slice(-200)) && P.document.querySelector(".or-riv.su")) {
      // (i tasti di fine arrivano dopo «Avanti»)
      var tf = [].filter.call(P.document.querySelectorAll(".or-sotto button"), function (b) { return /Rivincita|Cambia gioco/.test(b.textContent); });
      if (tf.length) no("i tasti di fine ci sono già durante «Cosa intendevi?»");
    }
    X.nomi.forEach(function (n) { var b = bottone(W.finestra(n), /Avanti/, ".or-sotto button"); if (b) tocca(W.finestra(n), b); });
    if (!await W.aspetta(function () { return !vm(C).rivedi && /Rivincita/.test(T(P)); }, 5000)) no("dopo «Avanti» nella Sala non ci sono i tasti di fine («" + T(P).slice(-150) + "»)");
    nota(N, "nella Sala: schermata a tutti, poi i tasti di fine del core");
    // la Rivincita: tutti di nuovo in saletta, niente «Cosa intendevi?» vecchio
    W.clicca(P, /Rivincita/);
    if (!await W.aspetta(function () { return vm(C).fase === "lobby"; }, 12000)) no("la Rivincita non torna in saletta (" + vm(C).fase + ")");
    if (vm(C).cosa || vm(C).rivedi) no("in saletta resta «Cosa intendevi?» della partita prima");
    // regola spenta dalle regole della saletta
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/, ".sl-regole, button"); }, 4000)) no("non trovo ⚙️ Regole");
    await W.dorme(300);
    var no1 = [].filter.call(P.document.querySelectorAll(".sl-velo .modo-chip"), function (b) { var et = b.parentNode.previousElementSibling; return et && /Cosa intendevi/.test(et.textContent) && /^No$/.test(b.textContent.trim()); })[0];
    if (!no1) no("nelle regole non c'è «🤔 Cosa intendevi?: No»");
    no1.click(); W.clicca(P, /Fatto/, ".sl-foglio button, .sl-velo button"); await W.dorme(500);
    if (!await W.aspetta(function () { return vm(C).intendi === false; }, 3000)) no("la regola spenta non arriva alla stanza");
    if (!await W.aspetta(function () { return !/Cosa intendevi/.test(A.regoleDi(W.finestra("Giulia"))); }, 5000)) no("la riga «📜» dice ancora «Cosa intendevi?»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" || W.clicca(P, /Comincia/, ".sl-go"); }, 12000)) no("niente «Comincia» (2)");   // (la Rivincita della Sala riparte da sola col 3-2-1)
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 10000)) no("non ricomincia");
    capo = capoDi(X); nCapo = nomeDi(C, capo);
    mandaO(X, capo, { t: "indizio", parola: "PLUTONIO", n: 1 });
    await aspettaIndovina(X, 0); await W.dorme(800);
    if (/Quali parole intendevi/.test(T(W.finestra(nCapo)))) no("con la regola spenta il capo vede la riga");
    key = chiaveDa(W.finestra(nCapo)); await gira(X, indovinoDi(X).id, key.indexOf("x"));
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 6000)) no("non finisce (2)");
    await W.dorme(3800);
    if (vm(C).cosa || P.document.querySelector(".or-riv.su")) no("con la regola spenta c'è «Cosa intendevi?»");
    if (!/Rivincita/.test(T(P))) no("con la regola spenta i tasti di fine non arrivano subito");
    nota(N, "regola spenta: niente riga, niente schermata");
    senzaErrori();
    return N.join(" · ");
  } });

  COPIONE.aggiungi("or4", { nome: "Parola d'ordine: «🧪 Prova da solo» (IL PAPPONE) con «Cosa intendevi?»", fai: async function () {
    var w = await W.apriTel("Pap", { x: 0, g4: true, profilo: { nome: "IL PAPPONE", uid: "finto-pap" } });
    var tess = await W.aspetta(function () { return A.tessera(w, "Parola d'ordine"); }, 5000); if (!tess) no("niente tessera");
    tess.click(); await W.dorme(400);
    if (!W.clicca(w, /Prova da solo/)) no("IL PAPPONE non vede «Prova da solo» (" + A.modiVisti(w).join(" / ") + ")");
    await W.dorme(400);
    if (!w.document.querySelector(".or-tab")) { W.clicca(w, /Comincia|Gioca|Via|Avanti/); await W.dorme(600); }
    if (!await W.aspetta(function () { return w.document.querySelector(".or-tab"); }, 6000)) no("la prova non parte («" + T(w).slice(0, 120) + "»)");
    var fino = Date.now() + 240000, mie = 0, giri = 0;
    while (Date.now() < fino) {
      var tt = T(w);
      if (w.document.querySelector(".or-riv.su")) break;
      if (/Tocca a te: dai l'indizio/.test(tt) && w.document.querySelector(".or-input")) {
        var inp = w.document.querySelector(".or-input"); scrivi(w, inp, "ZIGOMAR" + "ABCDEFG"[giri % 7]); giri++;
        tocca(w, bottone(w, /Invia/)); await W.dorme(500);
      } else if (/Quali parole intendevi/.test(tt)) {
        var team = 0, cs = caselleDi(w, team);
        if (cs[0]) { cs[0].click(); await W.dorme(100); }
        var f = bottone(w, /Fatto/); if (f && !f.disabled) { tocca(w, f); mie++; } else tocca(w, bottone(w, /Salta/));
      }
      await W.dorme(400);
    }
    if (!await W.aspetta(function () { return w.document.querySelector(".or-riv.su"); }, 8000)) no("a fine prova niente «Cosa intendevi?» («" + T(w).slice(-160) + "»)");
    var R = w.document.querySelector(".or-riv"), n = (R.querySelector(".or-riv-num") || {}).textContent;
    var b = bottone(w, /Avanti/, ".or-sotto button");
    if (!b || !/0 su 1/.test(b.textContent)) no("nella prova il tasto è «" + (b && b.textContent) + "» invece di «⏩ Avanti 0 su 1»");
    tocca(w, b);
    if (!await W.aspetta(function () { return !w.document.querySelector(".or-riv.su") && /Nuova partita/.test(T(w)); }, 4000)) no("dopo «Avanti» la prova non ha i suoi tasti («" + T(w).slice(-120) + "»)");
    senzaErrori();
    return "prova fino alla fine: " + mie + " indizi miei con le parole pensate, schermata «" + n + "», poi «↻ Nuova partita»";
  } });

  // =========================================================
  //  STESSA LUNGHEZZA D'ONDA
  // =========================================================
  var NOSTRE = ["Pizza al ristorante|Pizza a casa", "Zio Gino calmo|Zio Gino arrabbiato", "Vacanza al mare|Vacanza in montagna", "Serie tv|Film al cinema", "Caffè amaro|Caffè dolce"];
  async function stanzaLu(amici, imp) {
    var P = await W.apriTel("Paky", { x: 0, g4: true, prima: function (w) { w.__imp = imp || null; } });
    var C = await W.apriStanza(P, "Stessa Lunghezza d'Onda");
    for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], { hash: "gioco=lunghezza&stanza=" + C, x: 185 * (i + 1), g4: true });
    if (!await W.aspetta(function () { return (vm(C).players || []).length === amici.length + 1; }, 10000)) no("non entrano tutti");
    return { P: P, C: C };
  }

  COPIONE.aggiungi("lu1", { nome: "Lunghezza d'Onda: «📝 Le nostre scale» nelle regole della saletta", fai: async function () {
    var N = [], X = await stanzaLu(["Luca"]), P = X.P, C = X.C, L = W.finestra("Luca");
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/); }, 4000)) no("niente ⚙️ Regole");
    var area = await W.aspetta(function () { return P.document.querySelector(".sl-velo .lu-nostre-in"); }, 3000);
    if (!area) no("nelle regole non c'è il campo «📝 Le nostre scale»");
    if (!/circa un turno su 3|nessuna scala vostra/.test(T(P))) no("manca la nota delle scale");
    scrivi(P, area, "Caldo ↔ Freddo\nPizza al ristorante - Pizza a casa\nsolo una parte\nGatto / Cane\ncaldo ↔ freddo\nFreddo <-> Caldo\nUna cosa lunghissima lunghissima ↔ x");
    W.clicca(P, /➕ Aggiungi/, ".sl-velo button"); await W.dorme(250);
    var l = ((W.BR.nube["finto-Paky"] || {}).liste || {}).lunghezza || [];
    if (l.length !== 3) no("sul profilo ci sono " + l.length + " scale invece di 3 (" + l.join(" / ") + ")");
    if (l[0] !== "Caldo|Freddo" || l[1] !== "Pizza al ristorante|Pizza a casa" || l[2] !== "Gatto|Cane") no("scale salvate male: " + l.join(" / "));
    var ls = JSON.parse(P.localStorage.getItem("sg-lu-nostre") || "[]");
    if (ls.length !== 3) no("sul telefono ci sono " + ls.length + " scale");
    var es = P.document.querySelector(".sl-velo .lu-nostre-esito").textContent;
    if (!/Aggiunte: 3/.test(es) || !/solo una parte/.test(es)) no("l'esito non dice le 3 aggiunte e la riga sbagliata («" + es + "»)");
    nota(N, "3 scale salvate (sbagliate e doppioni, anche girati, scartati)");
    // 📋 Copia: una per riga
    var copiato = null; try { Object.defineProperty(P.navigator, "clipboard", { configurable: true, value: { writeText: function (x) { copiato = x; return Promise.resolve(); } } }); } catch (e) {}
    W.clicca(P, /📋 Copia/, ".sl-velo button"); await W.dorme(200);
    if (copiato !== "Caldo ↔ Freddo\nPizza al ristorante ↔ Pizza a casa\nGatto ↔ Cane") no("«📋 Copia» copia «" + copiato + "»");
    // ✕ ne toglie una, poi si incolla quello copiato da un amico (tornano 3, niente doppioni)
    P.document.querySelector(".sl-velo .lu-nx").click(); await W.dorme(150);
    if ((W.BR.nube["finto-Paky"].liste.lunghezza || []).length !== 2) no("la ✕ non toglie la scala");
    scrivi(P, P.document.querySelector(".sl-velo .lu-nostre-in"), copiato);
    W.clicca(P, /➕ Aggiungi/, ".sl-velo button"); await W.dorme(200);
    if ((W.BR.nube["finto-Paky"].liste.lunghezza || []).length !== 3) no("incollando le scale copiate non tornano 3");
    // «Solo le nostre»
    if (!W.clicca(P, /Solo le nostre/, ".sl-velo .modo-chip")) no("non c'è «📝 Solo le nostre»");
    var mix = [].filter.call(P.document.querySelectorAll(".sl-velo .modo-chip"), function (b) { return /Mescolate/.test(b.textContent); })[0];
    if (!mix) no("non c'è «🔀 Mescolate»");
    var foglio = P.document.querySelector(".sl-velo .sl-foglio");
    if (foglio && foglio.scrollWidth > foglio.clientWidth + 2) no("la foglia delle regole è più larga dello schermo");
    W.clicca(P, /Fatto/, ".sl-velo button"); await W.dorme(400);
    var imp = P.__t && P.__t.impostazioni, rias = P.__g4.lunghezza.riassunto(imp);
    if (!/📝 3 scale vostre \(solo quelle\)/.test(rias)) no("il riassunto è «" + rias + "»");
    if (!/scale vostre \(mescolate\)/.test(P.__g4.lunghezza.riassunto({ nostre: ["A b|C d", "Ee|Ff"] }))) no("il riassunto di base non dice «mescolate»");
    nota(N, "riassunto: «" + rias + "»");
    var rr = await W.aspetta(function () { var x = A.regoleDi(L); return /scale vostre/.test(x) ? x : null; }, 5000);
    if (rr) nota(N, "Luca legge «" + rr + "»");
    senzaErrori();
    return N.join(" · ");
  } });

  // la rivelazione: i tasti «Avanti» di chi gioca
  function tastoAv(w) { return bottone(w, /Avanti|Classifica/, ".lu-pan button"); }
  async function turnoLu(C, opz) {   // gioca un passo (dalla collezione del Passo 2); la rivelazione la gestisce chi chiama
    var v = vm(C);
    if (v.passo === "rivela") return;
    await COPIONE.lu.giocaPasso(C, { veloce: true });
  }

  COPIONE.aggiungi("lu2", { nome: "Lunghezza d'Onda online: «Solo le nostre» con la firma, nessuna ripetuta, «⏩ Avanti» a maggioranza", fai: async function () {
    if (!COPIONE.lu) await COPIONE.carica("passo2/lunghezza.js");
    var N = [], X = await stanzaLu(["Giulia", "Luca"], { nostre: NOSTRE.slice(), nostreModo: "solo", domande: "misto", giri: 1, formula: "solo" }), C = X.C, P = X.P;
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 8000)) no("non comincia");
    // chi arriva a partita cominciata guarda
    await W.apriTel("Marco", { hash: "gioco=lunghezza&stanza=" + C, x: 555, g4: true });
    if (!await W.aspetta(function () { return (vm(C).guarda || []).some(function (g) { return g.nome === "Marco"; }); }, 8000)) no("Marco non guarda");
    var nomi = ["Paky", "Giulia", "Luca"], scale = [], firme = 0, rivelazioni = 0, carta = false;
    var fino = Date.now() + 200000;
    while (Date.now() < fino && vm(C).fase === "gioco") {
      var v = vm(C);
      if (v.scala && scale.indexOf(v.scala.join("|")) < 0 && v.passo !== "rivela") {
        scale.push(v.scala.join("|"));
        if (NOSTRE.indexOf(v.scala.join("|")) < 0) no("la scala «" + v.scala.join(" ↔ ") + "» non è vostra (con «Solo le nostre»)");
        if (!v.scalaN) no("la foto non segna la scala come vostra");
        var ok = await W.aspetta(function () { return nomi.concat(["Marco"]).every(function (n) { var f = W.finestra(n).document.querySelector(".lu-firma"); return f && f.classList.contains("vis") && f.offsetParent; }); }, 3000);
        if (!ok) no("la firma «📝 della compagnia» non si vede su tutti i telefoni");
        firme++;
      }
      if (v.passo === "sceglie" && v.modo === "classico" && v.sub === "scala") {
        var wS = W.finestra(nomeDi(C, v.sens));
        var cc = await W.aspetta(function () { var l = wS.document.querySelectorAll(".lu-carta"); return l.length === 2 ? l : null; }, 3000);
        if (cc && [].every.call(cc, function (c) { return c.classList.contains("nostra") && /📝/.test(c.textContent); })) carta = true;
        else no("nel Classico le carte delle scale vostre non hanno il 📝");
      }
      if (v.passo === "rivela") {
        rivelazioni++;
        var k = v.partita + "|" + v.turno;
        await W.dorme(400);
        if (rivelazioni === 1) {
          var bP = tastoAv(P), bG = tastoAv(W.finestra("Giulia")), bM = tastoAv(W.finestra("Marco"));
          if (!bP || !/0 su 2/.test(bP.textContent)) no("Paky ha «" + (bP && bP.textContent) + "» invece di «⏩ Avanti 0 su 2»");
          if (bM) no("Marco (guarda) ha il tasto «Avanti»");
          if (!/Si va avanti tra/.test(T(P)) || !/Si va avanti tra/.test(T(W.finestra("Giulia")))) no("manca il conto «Si va avanti tra…»");
          tocca(W.finestra("Giulia"), bG); await W.dorme(300);
          if (!/✅ Avanti/.test(bG.textContent) || !/1 su 2/.test(bG.textContent) || !bG.disabled) no("dopo il tocco Giulia ha «" + bG.textContent + "»");
          if (!await W.aspetta(function () { return /1 su 2/.test(bP.textContent); }, 2000)) no("Paky non vede «1 su 2»");
          nota(N, "rivelazione: misure " + await misura("Luca", ".lu-pan button, .lu-pan p, .lu-esito, .lu-firma", "la rivelazione"));
          if (vm(C).partita + "|" + vm(C).turno !== k) no("con 1 su 2 si è già andati avanti");
          var t0 = Date.now();
          tocca(P, bP);
          if (!await W.aspetta(function () { var x = vm(C); return x.passo !== "rivela" || x.partita + "|" + x.turno !== k; }, 1500)) no("con 2 su 2 non si parte subito");
          nota(N, "Avanti 1 su 2 → 2 su 2: si parte in " + (Date.now() - t0) + " ms");
        } else if (rivelazioni === 2) {
          // Luca tocca e ricarica: ritrova il suo «✅»; poi nessun altro tocca: il conto va avanti da solo
          var bL = tastoAv(W.finestra("Luca")); if (bL) tocca(W.finestra("Luca"), bL);
          await W.dorme(300);
          await W.ricarica("Luca");
          var wL = await W.aspetta(function () { var w = W.finestra("Luca"); var b = w && tastoAv(w); return b && /✅/.test(b.textContent) ? w : null; }, 9000);
          if (!wL && vm(C).passo === "rivela") no("Luca dopo la ricarica non ritrova «✅ Avanti» («" + T(W.finestra("Luca")).slice(-100) + "»)");
          var t1 = Date.now();
          if (!await W.aspetta(function () { var x = vm(C); return x.fase !== "gioco" || x.partita + "|" + x.turno !== k; }, 14000)) no("senza tocchi il conto non va avanti");
          nota(N, "Luca ricarica e ritrova «✅»; senza altri tocchi si va avanti col conto (" + Math.round((Date.now() - t1) / 1000) + " s)");
        } else {
          nomi.forEach(function (n) { var b = tastoAv(W.finestra(n)); if (b && !b.disabled) tocca(W.finestra(n), b); });
          await W.aspetta(function () { var x = vm(C); return x.fase !== "gioco" || x.partita + "|" + x.turno !== k; }, 4000);
        }
        continue;
      }
      await turnoLu(C);
    }
    if (vm(C).fase !== "fine") no("la partita non finisce (" + vm(C).fase + "/" + vm(C).passo + ")");
    if (scale.length < 3) no("solo " + scale.length + " scale giocate");
    if (!carta) nota(N, "(nessun turno Classico con la scelta delle carte)");
    senzaErrori();
    return N.concat(["scale tutte vostre e mai ripetute: " + scale.map(function (s) { return s.replace("|", " ↔ "); }).join(" / "), "la firma su tutti e 4 i telefoni per ognuna (" + firme + ")"]).join(" · ");
  } });

  COPIONE.aggiungi("lu3", { nome: "Lunghezza d'Onda sullo stesso telefono con «Solo le nostre»", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0, g4: true, profilo: { liste: { lunghezza: NOSTRE.slice() } } });
    var tess = await W.aspetta(function () { return A.tessera(w, "Stessa Lunghezza d'Onda"); }, 4000); if (!tess) no("niente tessera"); tess.click(); await W.dorme(400);
    W.clicca(w, /Sullo stesso telefono/, ".modo-grande, button, [role=button]"); await W.dorme(500);
    if (/Aggiungi giocatore/.test(T(w))) {
      while (w.document.querySelectorAll("input[placeholder^='Giocatore']").length < 3) { W.clicca(w, /Aggiungi giocatore/); await W.dorme(120); }
      ["Paky", "Giulia", "Luca"].forEach(function (n, i) { var inp = w.document.querySelectorAll("input[placeholder^='Giocatore']")[i]; if (inp) scrivi(w, inp, n); });
      W.clicca(w, /Avanti/); await W.dorme(500);
    }
    if (!/5 scale vostre/.test(T(w))) no("le regole non mostrano le 5 scale vostre del profilo («" + T(w).slice(0, 200) + "»)");
    W.clicca(w, /Tutti insieme/, ".modo-chip"); W.clicca(w, /Misto/, ".modo-chip"); W.clicca(w, /Solo le nostre/, ".modo-chip"); await W.dorme(150);
    W.clicca(w, /Comincia/); await W.dorme(500);
    var viste = [], firme = 0;
    for (var i = 0; i < 160; i++) {
      var d = w.document, tt = T(w);
      if (/Fine partita|Classifica finale|Il voto alla compagnia/.test(tt) && !d.querySelector(".lu-pan button:not([disabled])")) break;
      var sx = d.querySelector(".lu-est.sx"), dx = d.querySelector(".lu-est.dx");
      if (sx && !sx.classList.contains("vuoto")) {
        var s = sx.textContent + "|" + dx.textContent;
        if (viste[viste.length - 1] !== s) {
          if (viste.indexOf(s) >= 0) no("la scala «" + s + "» si ripete");
          viste.push(s);
          if (NOSTRE.indexOf(s) >= 0) { var f = d.querySelector(".lu-firma"); if (!f || !f.classList.contains("vis")) no("sullo stesso telefono la scala vostra non ha la firma"); firme++; }
        }
      }
      if (/Passa il telefono/.test(tt) && W.clicca(w, /^Sono /)) { await W.dorme(150); continue; }
      var p = d.querySelector(".lu-btn.parola"); if (p) { p.click(); await W.dorme(150); continue; }
      var c = d.querySelector(".lu-carta"); if (c) { if (!c.classList.contains("nostra") && NOSTRE.length > viste.length) no("carta del Classico senza 📝 con «Solo le nostre»"); c.click(); await W.dorme(150); continue; }
      var bt = [].filter.call(d.querySelectorAll(".lu-pan button"), function (b) { return !b.disabled && b.offsetParent; });
      var lm = bt.filter(function (b) { return /Lo metto qui/.test(b.textContent); })[0];
      if (/Lo metto qui/.test(tt)) { await COPIONE.lu.trascina(w, 30 + Math.random() * 40); await W.dorme(100); var lm2 = bottone(w, /Lo metto qui/, ".lu-pan button"); if (lm2) lm2.click(); await W.dorme(150); continue; }
      var f2 = bt.filter(function (b) { return /Fatto: telefono/.test(b.textContent); })[0]; if (f2) { f2.click(); await W.dorme(150); continue; }   // (solo click: il tocco finto pointerup+click farebbe due volte)
      if (/Ci siamo/.test(tt)) { await COPIONE.lu.trascina(w, 50); bottone(w, /Ci siamo/, ".lu-pan button").click(); await W.dorme(150); continue; }
      var sv = bottone(w, /Svela/, ".lu-pan button"); if (sv) { sv.click(); await W.dorme(2300); continue; }
      var av = bottone(w, /Avanti|Classifica/, ".lu-pan button"); if (av) { av.click(); await W.dorme(200); continue; }
      await W.dorme(200);
    }
    if (viste.length < 5) no("solo " + viste.length + " scale viste (" + viste.join(" / ") + ")");
    var nostreViste = viste.filter(function (s) { return NOSTRE.indexOf(s) >= 0; }).length;
    if (nostreViste < 5) no("con «Solo le nostre» le scale vostre giocate sono " + nostreViste + " su 5");
    senzaErrori();
    return viste.length + " scale (" + nostreViste + " vostre con la firma, poi quelle del gioco), nessuna ripetuta";
  } });

  // or5: «⏳ aspettiamo Sara» mentre il capo può ancora dire cosa intendeva (prima la scritta dell'attesa mandava in errore
  //      tutta la parte sotto il tabellone: una variabile col nome del conto). Squadre fisse: Paky+Giulia, Luca+Sara (capo Luca).
  COPIONE.aggiungi("or5", { nome: "Parola d'ordine: «⏳ Aspettiamo…» durante «Quali parole intendevi?», poi chi torna e il capo che segna", fai: async function () {
    var N = [], X = await stanzaOrdine(["Giulia", "Luca", "Sara"]), C = X.C, id = {};
    ["Giulia", "Luca", "Sara"].forEach(function (n) { id[n] = (vm(C).players || []).filter(function (p) { return p.nome === n; })[0].id; });
    mandaO(X, "host", { t: "squadra", s: 0 }); mandaO(X, id.Giulia, { t: "squadra", s: 0 });
    mandaO(X, id.Luca, { t: "squadra", s: 1 }); mandaO(X, id.Sara, { t: "squadra", s: 1 });
    if (!await W.aspetta(function () { var v = vm(C); return (v.players || []).every(function (p) { return p.team === (p.nome === "Paky" || p.nome === "Giulia" ? 0 : 1); }); }, 4000)) no("le squadre non si sistemano");
    await capiECominci(X);
    if (vm(C).capo[1] !== id.Luca) no("Luca non è il capo dei Blu");
    // se cominciano i Rossi: indizio e una parola dei Blu (non di nessuno: poteva essere quella d.oro), così il turno passa ai Blu
    if (vm(C).turno === 0) {
      var c0 = capoDi(X); mandaO(X, c0, { t: "indizio", parola: "PLUTONIO", n: 1 });
      await aspettaIndovina(X, 0);
      var k0 = chiaveDa(W.finestra(nomeDi(C, c0))), ind0 = indovinoDi(X);
      await gira(X, ind0.id, k0.indexOf(1));
      if (!await aspettaTurno(X, 1)) no("il turno non passa ai Blu");
    }
    var nS = (vm(C).storia || []).length, wL = W.finestra("Luca");
    mandaO(X, id.Luca, { t: "indizio", parola: "ZIGOMAR", n: 2 });
    if (!await aspettaIndovina(X, nS)) no("dopo l'indizio di Luca non si indovina");
    if (!await W.aspetta(function () { return /Quali parole intendevi/.test(T(wL)); }, 4000)) no("Luca non vede «Quali parole intendevi?»");
    // Sara (l'unica che indovina per i Blu) si spegne: dopo l'addio, «⏳ … aspettiamo Sara» su tutti i telefoni, senza errori
    W.spegni("Sara");
    if (!await W.aspetta(function () { return vm(C).attesa; }, 45000, 250)) no("con Sara spenta non compare l'attesa");
    await W.dorme(700);
    ["Paky", "Giulia", "Luca"].forEach(function (n) { if (!/aspettiamo Sara/.test(T(W.finestra(n)))) no(n + " non legge «aspettiamo Sara» («" + T(W.finestra(n)).slice(-140) + "»)"); });
    senzaErrori();
    nota(N, "Sara spenta: «⏳ aspettiamo Sara» su tutti, niente errori");
    // Sara torna: l'attesa sparisce e Luca può ancora segnare le parole che intendeva
    W.riaccendi("Sara");
    if (!await W.aspetta(function () { var v = vm(C); return !v.attesa && v.passo === "indovina"; }, 30000, 250)) {
      await W.ricarica("Sara");
      if (!await W.aspetta(function () { var v = vm(C); return !v.attesa && v.passo === "indovina"; }, 20000, 250)) no("Sara torna ma l'attesa resta (" + JSON.stringify(vm(C).attesa) + ")");
    }
    if (!await W.aspetta(function () { return /Quali parole intendevi/.test(T(wL)); }, 4000)) no("dopo l'attesa Luca non ritrova «Quali parole intendevi?»");
    var mie = caselleDi(wL, 1);
    mie[0].click(); await W.dorme(100); mie[1].click(); await W.dorme(150);
    tocca(wL, bottone(wL, /Fatto/));
    if (!await W.aspetta(function () { return !/Quali parole intendevi/.test(T(wL)); }, 3000)) no("dopo «Fatto» la riga resta");
    nota(N, "Sara torna, Luca segna 2 parole e «Fatto»");
    // si chiude con la parola nera: a fine partita c'è ZIGOMAR con le 2 parole pensate
    var kL = chiaveDa(wL), sara = indovinoDi(X);
    if (!sara) no("i Blu non hanno chi indovina");
    await gira(X, sara.id, kL.indexOf("x"));
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 6000)) no("la partita non finisce");
    var e = (vm(C).cosa || { l: [] }).l.filter(function (x) { return x.p === "ZIGOMAR"; })[0];
    if (!e || e.pen.length !== 2) no("a fine partita ZIGOMAR non ha le 2 parole pensate: " + JSON.stringify(vm(C).cosa));
    await W.dorme(3600);
    if (!/Cosa intendevi/.test(T(W.finestra("Giulia")))) no("Giulia non vede «🤔 Cosa intendevi?» a fine partita");
    senzaErrori();
    nota(N, "fine: «Cosa intendevi?» con ZIGOMAR (" + e.pen.map(function (x) { return x.w; }).join(", ") + ")");
    return N.join(" · ");
  } });
})();

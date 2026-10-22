// PROVE DI PAROLA D'ORDINE, giro 2 (21 ott 2026), compito «La fine partita e i momenti forti» (js/games/ordine.js).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("ordine2/fine.js"); await COPIONE.prova("o2f1")
// Con Edge invisibile: prova.js --porta 8995 --carica ordine2/fine.js --prova o2f1,o2f2,o2f3,o2f4,o2f5 --rifai
//
// o2f1: online in 4 (Rossi = Luca capo + Paky host; Blu = Giulia capo + Sara). Tre turni con le scritte grandi delle mosse
//       sopra il tabellone su tutti i telefoni («✅ … giusta! / Finiti i tentativi · Tocca ai …», «😬 … era dei …!», «✋ I …
//       passano»), poi chi indovina gira la PAROLA NERA:
//       - prima un secondo e mezzo per il capo che esplode («💣 Noooo!» nella vignetta), i coriandoli solo dopo;
//       - in alto su tutti «💣 Vincono i …: <chi> ha girato la parola nera!»; sotto, a chi ha vinto «🏆 Avete vinto!» e a
//         chi ha perso «😞 Avete perso…»;
//       - i tasti di fine del core SUBITO (entro 1,5 s: «Nuova partita» all'host, «Ci sto» agli amici) e nessuna scheda che si
//         apre da sola (niente «Cosa intendevi?» sopra il tabellone);
//       - 📳 vibrazione: [60,40,120] una volta a chi vince, 120 una volta a chi ha girato la nera, nient'altro;
//       - 🎭 titoli: uno a testa (4, diversi), «💣 L'artificiere» a chi ha girato la nera, il mio sul tasto piccolo e per un
//         attimo grande sopra il tabellone dopo la festa;
//       - misure a 360x640 e 412x915 (host e amica): il tabellone svelato TUTTO sopra la barra, niente scorre, i tasti piccoli
//         ci stanno; la scritta di fine è bianca su fondo scuro;
//       - «🤔 Cosa intendevi?» e «🎭» aprono la loro scheda (✕ la chiude), «📸 Foto» fa l'immagine 1080x1350;
//       - Rivincita: si torna in saletta senza titoli vecchi.
// o2f2: 🤖 contro il Bot in 3 + Bea che guarda col link: saletta «Voi contro il Bot (🤖 …)», «Tutti insieme contro il Bot»
//       (mai «contro Matt» nei menu), chat «Cominciate voi», «… era di <Bot>» (non «dei Blu») anche nella scritta grande, sul
//       turno del Bot «🤖 … scopre una sua parola…» (non «🥁 Vediamo se è giusta…») e «🤖 … scopre X · Gliene mancano N»;
//       vittoria con un indizio ∞ lungo: «🎉 Avete battuto …!» ai giocatori e «🎉 Battuto …!» a Bea, «🎯 N punti: …» (N = le
//       parole che mancavano al Bot), niente «Più parole trovate: <Bot>», titoli solo ai 3 giocatori, Bea «👀 Hai guardato»;
//       «Cosa intendevi?» con 7 parole a 360x640 scorre dentro di sé (niente tagliato); Rivincita e partita persa con
//       l'ultima parola del Bot girata da voi: «🤖 Vince …: <chi> ha girato la sua ultima parola!».
// o2f3: la fine che non si perde: l'host ricarica sulla fine (stessi titoli, stessa scritta, niente scheda da sola), poi
//       sparisce e il vice (un amico) tiene la fine coi titoli e fa la Rivincita; la clessidra rossa negli ultimi 10 secondi
//       (le cifre diventano rosse davvero, p12); in saletta «🤔 Cosa intendevi?» senza «?.»; «📋 Copia tutte» senza la
//       finestra del browser (le parole compaiono già selezionate nell'app).
// o2f4 (revisione, 22 ott 2026): contro il Bot in 3. 🎭 «Il consigliere» conta le PAROLE segnate (togliere e rimettere il
//       segno sulla stessa non conta di più); 🏁 la partita chiusa dall'host non dà 🎯 punti né record anche se vincete voi;
//       il mio titolo grande non compare sopra una scheda già aperta (a chi non l'ha aperta sì, e aprendo una scheda mentre
//       c'è la scritta se ne va); nella 📸 foto il «pensava
//       a» più buffo dice «la squadra ha girato anche …» quando qualcuna delle parole pensate è stata trovata.
// o2f5 (revisione, 22 ott 2026): a 3 squadre in 6 (regole con la spia di preferiti/ordine.js): la squadra di turno gira la
//       parola nera a metà partita («… sono fuori · Tocca ai …», la partita va avanti), poi un'altra trova tutte le sue con un
//       indizio ∞: in alto «🎉 Vincono i …!», vinto/perso giusti su 6 telefoni, «💣 L'artificiere» dice la parola nera VERA
//       (prima diceva l'ultima parola girata della partita), tabellone sopra la barra a 360x640.
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T;
  var INDIZI = ["QUOKKA", "ZEFIRO", "GNOMO", "YETI", "FIORDO", "WAFER", "OBLO", "JAZZ", "ZUAVO", "KIWI", "PUFFO", "VICHINGO", "BRADIPO", "KOALA"];

  // ---------------- aiuti ----------------
  function nota(N, x) { N.push(x); }
  function senzaErrori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  function chiDi(C, nome) { return ((vm(C).players || []).filter(function (p) { return p.nome === nome; }))[0] || null; }
  function idDi(C, nome) { var p = chiDi(C, nome); return p ? p.id : null; }
  function nomeDi(C, id) { var p = ((vm(C).players || []).filter(function (x) { return x.id === id; }))[0]; return p ? p.nome : null; }
  function carte(w) { return w.document.querySelectorAll(".or-tab .or-carta"); }
  function chiaveDa(w) { return [].map.call(carte(w), function (b) { var m = / c(\d|n|x)(\s|$)/.exec(" " + b.className + " "); return m ? (/\d/.test(m[1]) ? +m[1] : m[1]) : null; }); }
  function vmTel(w) { var u = w && w.__ORDINE && w.__ORDINE.ui; return u && u.vm; }
  function cart(w) { var c = w.document.querySelector(".or-cart.su"); return c ? c.textContent : ""; }
  function testa(w) { var x = w.document.querySelector(".or-ind"); return x ? x.textContent : ""; }
  function statoFine(w) { var x = w.document.querySelector(".or-fine-stato"); return x ? x.textContent : ""; }
  function logTx(w) { var x = w.document.querySelector(".or-log"); return x ? x.textContent : ""; }   // (la chat, anche quando a fine partita è nascosta)
  function sottoTx(w) { var x = w.document.querySelector(".or-sotto"); return x ? x.textContent : ""; }
  function bottone(w, re, sel) { return [].filter.call(w.document.querySelectorAll(sel || "button"), function (b) { return re.test(b.textContent) && b.offsetParent && !b.disabled; })[0] || null; }
  // una mossa a nome di qualcuno (l'host dal suo tavolo, gli amici dalla loro rete)
  function manda(nome, m) {
    if (nome === "Paky") { var u = W.finestra("Paky").__ORDINE.ui; if (!u) no("Paky non ha il tavolo"); u.cb.manda(m); return; }
    var h = W.reteDi(nome); if (!h) no("non trovo la rete di " + nome); h.invia(m);
  }
  // 📳 le vibrazioni del telefono (quelle del gioco: le «10» del tocco sui tasti no)
  function spiaVibra(w) { w.__vib = []; w.navigator.vibrate = function (x) { if (x !== 10) w.__vib.push(JSON.stringify(x)); return true; }; }
  function vib(w) { return (w.__vib || []).slice(); }
  function indizioBuono(w, C, usati) {
    var tab = vm(C).tab || [];
    for (var i = 0; i < INDIZI.length; i++) if ((usati || []).indexOf(INDIZI[i]) < 0 && !w.__ORDINE.erroreIndizio(INDIZI[i], tab)) return INDIZI[i];
    no("nessun indizio buono per questo tabellone");
  }
  async function indizio(C, nomeCapo, n, usati) {
    var w = W.finestra(nomeCapo), p = indizioBuono(w, C, usati);
    manda(nomeCapo, { t: "indizio", parola: p, n: n });
    if (!await W.aspetta(function () { var v = vm(C); return v.passo === "indovina" && v.indizio && v.indizio.parola === p; }, 6000)) no("l'indizio " + p + " di " + nomeCapo + " non arriva (" + vm(C).passo + ")");
    if (usati) usati.push(p);
    return p;
  }
  function coperteDi(C, chiave, col) { var v = vm(C); return chiave.map(function (c, i) { return c === col && !v.tab[i].g ? i : -1; }).filter(function (i) { return i >= 0; }); }
  // gira una parola e aspetta che si scopra (e che la scritta grande arrivi a tutti, se ce ne deve essere una)
  async function gira(C, chi, i) {
    var l0 = vm(C).log || [], n0 = l0.length ? l0[l0.length - 1].n : 0;
    manda(chi, { t: "gira", i: i });
    if (!await W.aspetta(function () { var v = vm(C); var l = v.log || []; return l.length && l[l.length - 1].n > n0 && !v.sospeso; }, 9000, 50)) no(chi + " non riesce a girare " + vm(C).tab[i].w);
  }
  // la scritta grande sopra il tabellone su tutti i telefoni (entro ms): restituisce il testo visto da ognuno
  async function cartelloSuTutti(nomi, re, ms) {
    var visti = {};
    await W.aspetta(function () { nomi.forEach(function (n) { var t = cart(W.finestra(n)); if (re.test(t)) visti[n] = t; }); return nomi.every(function (n) { return visti[n]; }); }, ms || 2500, 40);
    var manca = nomi.filter(function (n) { return !visti[n]; });
    if (manca.length) no("la scritta grande «" + re + "» non arriva a " + manca.join(", ") + " (" + manca.map(function (n) { return n + ": «" + cart(W.finestra(n)) + "»"; }).join(" ") + ")");
    return visti[nomi[0]];
  }
  // apre la stanza con gli amici, sistema squadre e capi e comincia. sq = { nome: squadra }, capi = [nomeRossi, nomeBlu]
  async function partita(amici, sq, capi) {
    var P = await W.apriTel("Paky", { x: 0 });
    var C = await W.apriStanza(P, "Parola d'ordine");
    for (var i = 0; i < amici.length; i++) {
      await W.apriTel(amici[i], { hash: "gioco=ordine&stanza=" + C, x: 185 * (i + 1) });
      var quanti = i + 2;
      if (!await W.aspetta(function () { return (vm(C).players || []).length >= quanti; }, 8000)) no(amici[i] + " non entra");
    }
    Object.keys(sq).forEach(function (n) { if (n !== "Paky") W.reteDi(n).invia({ t: "squadra", s: sq[n] }); });
    if (!await W.aspetta(function () { return Object.keys(sq).every(function (n) { var p = chiDi(C, n); return p && p.team === sq[n]; }); }, 5000))
      no("le squadre non si sistemano: " + JSON.stringify((vm(C).players || []).map(function (p) { return p.nome + p.team; })));
    capi.forEach(function (n) { if (n !== "Paky") W.reteDi(n).invia({ t: "capo" }); });
    if (!await W.aspetta(function () { var c = vm(C).capo || []; return capi.every(function (n, k) { return c[k] === idDi(C, n); }); }, 5000)) no("i capi non sono " + capi.join(" e "));
    return { P: P, C: C, nomi: ["Paky"].concat(amici), capi: capi };
  }
  async function comincia(X) {
    if (!await W.aspetta(function () { return W.clicca(X.P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(X.C).fase === "gioco" && vm(X.C).tab; }, 10000)) no("non comincia (" + vm(X.C).fase + ")");
    if (!await W.aspetta(function () { return X.nomi.every(function (n) { var w = W.finestra(n); return w && carte(w).length >= 20; }); }, 6000)) no("non tutti vedono il tabellone");
  }
  function indovinoDi(C, k) { var v = vm(C); return ((v.players || []).filter(function (p) { return p.team === k && p.id !== v.capo[k] && !p.via && !p.bot; })[0] || {}).nome; }
  // aspetta che la regia sia ferma sul tabellone (niente scene in corso)
  function calmo(w) {
    var ui = w.__ORDINE && w.__ORDINE.ui; if (!ui || !ui.S) return false;
    if (ui.inScena || (ui.coda && ui.coda.length)) return false;
    return !w.document.querySelector(".or-vignetta.su, .st-terzo.on");
  }
  // le misure della fine su un telefono: il tabellone svelato tutto sopra la barra, niente scorre, i tasti piccoli ci stanno
  async function misuraFine(nome, L, H) {
    var w = W.finestra(nome), f = document.getElementById("tel-" + nome), d = w.document, out = [];
    var st = d.createElement("style"); st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}"; d.head.appendChild(st);
    var vec = { w: f.style.width, h: f.style.height };
    try {
      f.style.width = L + "px"; f.style.height = H + "px"; void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
      await W.dorme(900); w.dispatchEvent(new w.Event("resize")); await W.dorme(400);
      if (!await W.aspetta(function () { return calmo(w); }, 12000)) out.push("la regia non si ferma");
      if (d.documentElement.scrollHeight > H + 1) out.push("la pagina scorre (" + d.documentElement.scrollHeight + ")");
      if (d.documentElement.scrollWidth > L + 1) out.push("scorre di lato");
      var barra = d.querySelector(".st-barra"), bt = barra.getBoundingClientRect().top, cc = carte(w), basso = 0, alto = 1e9;
      [].forEach.call(cc, function (b) { var r = b.getBoundingClientRect(); basso = Math.max(basso, r.bottom); alto = Math.min(alto, r.top); });
      if (basso > bt + 1) out.push("la barra copre il tabellone (ultima riga fino a " + Math.round(basso) + ", barra da " + Math.round(bt) + ")");
      var h0 = cc[0].getBoundingClientRect().height;
      if (h0 < 26) out.push("caselle troppo basse (" + Math.round(h0) + " px)");
      var tit = d.querySelector(".or-fine-tit"); if (!tit || !tit.getClientRects().length) out.push("manca la scritta di fine in alto");
      else { var tr = tit.getBoundingClientRect(); if (tr.bottom > alto + 1) out.push("la scritta di fine copre il tabellone"); }
      var ch = d.querySelector(".or-chips");
      if (ch) [].forEach.call(ch.children, function (b) { var r = b.getBoundingClientRect(); if (r.right > L + 1 || r.left < -1 || r.bottom > H + 1) out.push("«" + b.textContent + "» esce"); });
      [].forEach.call(d.querySelectorAll(".or-sotto button, .or-fine-stato, .or-riv-modo"), function (b) {
        if (!b.getClientRects().length || !b.offsetWidth) return;
        var r = b.getBoundingClientRect(); if (r.bottom > H + 1 || r.right > L + 1 || r.left < -1 || r.top < -1) out.push("«" + b.textContent.trim().slice(0, 30) + "» esce dallo schermo");
      });
      var sf = d.querySelector(".or-fine-stato");
      if (sf && sf.scrollHeight > sf.clientHeight + 2) out.push("la scritta «" + sf.textContent + "» va a capo");
      return { err: out.join("; "), righe: Math.round(h0) };
    } finally {
      if (st.parentNode) st.parentNode.removeChild(st);
      f.style.width = vec.w; f.style.height = vec.h; w.dispatchEvent(new w.Event("resize"));
    }
  }

  // ---------------- o2f1 ----------------
  COPIONE.aggiungi("o2f1", { nome: "Parola d'ordine: scritte delle mosse, parola nera, fine subito pronta, titoli, vibrazioni, misure, foto", fai: async function () {
    var N = [], amici = ["Giulia", "Luca", "Sara"];
    var X = await partita(amici, { Luca: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]), C = X.C;
    await comincia(X);
    X.nomi.forEach(function (n) { spiaVibra(W.finestra(n)); });
    var capi = X.capi, usati = [], SQN = ["Rossi", "Blu"];
    var chiave = await W.aspetta(function () { var c = chiaveDa(W.finestra("Luca")); return c.length && c.every(function (x) { return x != null; }) && c; }, 6000);
    if (!chiave) no("Luca (capo) non vede la chiave");
    var k0 = vm(C).turno, k1 = 1 - k0, ind0 = indovinoDi(C, k0), ind1 = indovinoDi(C, k1);
    // 1. la prima squadra: indizio 2, il capo dice cosa intendeva (una che trovano e una no), tre giuste = finiti i tentativi
    await W.dorme(9000);   // (la presentazione)
    await indizio(C, capi[k0], 2, usati);
    var mie = coperteDi(C, chiave, k0);
    manda(capi[k0], { t: "intendo", x: 0, l: [mie[0], mie[4]] });
    await gira(C, ind0, mie[0]); await gira(C, ind0, mie[1]);
    if (vm(C).turno !== k0) no("dopo due parole giuste il turno è passato");
    await gira(C, ind0, mie[2]);
    var c1 = await cartelloSuTutti(X.nomi, /giusta!.*Finiti i tentativi/, 2000);
    if (c1.indexOf("Tocca ai " + SQN[k1]) < 0) no("la scritta dei tentativi finiti non dice a chi tocca («" + c1 + "»)");
    if (!/finiti i tentativi/.test(T(W.finestra("Paky")))) no("nella chat la riga non dice «finiti i tentativi»");
    nota(N, "«" + c1 + "» su 4 telefoni");
    await W.dorme(1700);
    if (cart(W.finestra("Paky"))) no("la scritta grande resta sopra il tabellone più di un secondo e mezzo («" + cart(W.finestra("Paky")) + "»)");
    // 2. l'altra squadra gira una parola della prima: «😬 … era dei …!»
    await indizio(C, capi[k1], 1, usati);
    var loro = coperteDi(C, chiave, k0)[0];
    await gira(C, ind1, loro);
    var c2 = await cartelloSuTutti(X.nomi, /era dei/, 2000);
    if (c2.indexOf(vm(C).tab[loro].w + " era dei " + SQN[k0]) < 0 || c2.indexOf("Tocca ai " + SQN[k0]) < 0) no("la scritta dice «" + c2 + "»");
    nota(N, "«" + c2 + "»");
    // 3. la prima squadra: una giusta e «passo»
    if (!await W.aspetta(function () { return vm(C).turno === k0 && vm(C).passo === "indizio"; }, 9000)) no("non torna la prima squadra");
    await indizio(C, capi[k0], 2, usati);
    await gira(C, ind0, coperteDi(C, chiave, k0)[0]);
    manda(ind0, { t: "passo" });
    var c3 = await cartelloSuTutti(X.nomi, /passano/, 2500);
    if (c3.indexOf("I " + SQN[k0] + " passano") < 0 || c3.indexOf("Tocca ai " + SQN[k1]) < 0) no("la scritta del passo dice «" + c3 + "»");
    nota(N, "«" + c3 + "»");
    // nessuna vibrazione finora (niente parola d'oro né nera)
    X.nomi.forEach(function (n) { var v = vib(W.finestra(n)); if (v.length) no(n + " ha vibrato prima della fine: " + v.join(" ")); });
    // 4. l'altra squadra gira la parola NERA
    if (!await W.aspetta(function () { return vm(C).turno === k1 && vm(C).passo === "indizio"; }, 9000)) no("non torna la seconda squadra");
    await indizio(C, capi[k1], 1, usati);
    await W.dorme(3500);   // (la telecamera torna sul tabellone)
    var nera = chiave.indexOf("x");
    manda(ind1, { t: "gira", i: nera });
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 9000)) no("la parola nera non chiude la partita");
    var t0 = Date.now(), wG = W.finestra("Giulia"), wP = W.finestra("Paky"), tf = 0;
    // i tasti di fine subito (guardati insieme all'esplosione), e l'esplosione del capo prima della festa
    function tasti() { if (!tf && bottone(wP, /Nuova partita|Rivincita/) && bottone(wG, /Ci sto/)) tf = Date.now() - t0 || 1; }
    var boom = await W.aspetta(function () { tasti(); var v = wG.document.querySelector(".or-vignetta.su"); return v && /Noooo/.test(v.textContent) && Date.now() - t0; }, 1500, 30);
    if (!boom) no("niente «💣 Noooo!» del capo che esplode");
    if (wG.document.querySelector(".st-coriandoli")) no("i coriandoli partono insieme all'esplosione");
    var cor = await W.aspetta(function () { tasti(); return wG.document.querySelector(".st-coriandoli") && Date.now() - t0; }, 4000, 40);
    if (!cor) no("niente coriandoli dopo l'esplosione");
    if (cor < 1200) no("i coriandoli partono dopo " + cor + " ms (l'esplosione deve durare un secondo e mezzo)");
    nota(N, "parola nera: «Noooo» dopo " + boom + " ms, coriandoli dopo " + cor + " ms");
    if (!tf || tf > 1000) no("i tasti di fine non arrivano subito (" + (tf || "mai") + " ms; «" + T(wP).slice(-120) + "»)");
    nota(N, "tasti di fine dopo " + tf + " ms");
    var chi = ind1, attesa = "💣 Vincono i " + SQN[k0] + ": " + chi + " ha girato la parola nera!";
    X.nomi.forEach(function (n) {
      var w = W.finestra(n);
      if (testa(w).indexOf(attesa) < 0) no(n + ": in alto «" + testa(w) + "» invece di «" + attesa + "»");
      var p = chiDi(C, n), sf = statoFine(w);
      if (p.team === k0 ? !/Avete vinto/.test(sf) : !/Avete perso/.test(sf)) no(n + " (" + SQN[p.team] + ") legge «" + sf + "»");
    });
    nota(N, "in alto «" + attesa + "», sotto «Avete vinto» / «Avete perso»");
    // i titoli: uno a testa, diversi, l'artificiere a chi ha girato la nera
    var v = vm(C), tit = v.titoli || [];
    if (tit.length !== 4) no("i titoli sono " + tit.length + " invece di 4: " + JSON.stringify(tit));
    var idsT = tit.map(function (x) { return x.id; }).sort().join(), idsP = v.players.map(function (p) { return p.id; }).sort().join();
    if (idsT !== idsP) no("i titoli non sono uno a testa: " + idsT + " / " + idsP);
    var nomiT = tit.map(function (x) { return x.titolo; }); if (nomiT.some(function (x, i) { return nomiT.indexOf(x) !== i; })) no("due titoli uguali: " + nomiT.join(", "));
    var art = tit.filter(function (x) { return x.titolo === "L'artificiere"; })[0];
    if (!art || art.nome !== chi) no("«💣 L'artificiere» non è di " + chi + ": " + JSON.stringify(art));
    X.nomi.forEach(function (n) {
      var w = W.finestra(n), mio = tit.filter(function (x) { return x.nome === n; })[0], ch = w.document.querySelector(".or-chip.mio");
      if (!ch || ch.textContent !== mio.icona + " " + mio.titolo) no(n + ": il tasto del titolo dice «" + (ch && ch.textContent) + "» invece di «" + mio.icona + " " + mio.titolo + "»");
    });
    nota(N, "titoli: " + tit.map(function (x) { return x.nome + " " + x.icona + " " + x.titolo + " (" + x.dett + ")"; }).join(", "));
    // il mio titolo grande per un attimo, dopo la festa
    var mioP = tit.filter(function (x) { return x.nome === "Paky"; })[0];
    var grande = await W.aspetta(function () { return cart(wP).indexOf(mioP.titolo) >= 0 && Date.now() - t0; }, 9000, 50);
    if (!grande) no("a Paky non compare il suo titolo grande dopo la festa");
    nota(N, "titolo grande dopo " + grande + " ms");
    // in tutto questo tempo niente «Cosa intendevi?» da solo
    X.nomi.forEach(function (n) { if (W.finestra(n).document.querySelector(".or-riv.su")) no(n + ": «Cosa intendevi?» si è aperta da sola"); });
    // 📳 le vibrazioni
    X.nomi.forEach(function (n) {
      var w = W.finestra(n), p = chiDi(C, n), l = vib(w), att = p.team === k0 ? ["[60,40,120]"] : ["120"];
      if (l.join(" ") !== att.join(" ")) no(n + " ha vibrato «" + l.join(" ") + "» invece di «" + att.join(" ") + "»");
    });
    nota(N, "vibrazioni: [60,40,120] a chi vince, 120 a chi ha girato la nera");
    // la scritta di fine si legge: bianca su fondo scuro
    var sfP = wP.document.querySelector(".or-fine-stato"), colS = wP.getComputedStyle(sfP).color, bgB = wP.getComputedStyle(wP.document.querySelector(".st-barra")).backgroundImage;
    if (colS !== "rgb(255, 255, 255)") no("la scritta di fine è «" + colS + "»");
    if (bgB.indexOf("rgba(7, 4, 26, 0.88)") < 0) no("la barra non ha il fondo scuro in alto (" + bgB + ")");
    // le misure
    await W.aspetta(function () { return calmo(wP) && !cart(wP); }, 9000);
    var mis = [];
    for (var q = 0; q < 2; q++) {
      var nm = ["Paky", "Sara"][q];
      var m1 = await misuraFine(nm, 360, 640), m2 = await misuraFine(nm, 412, 915);
      if (m1.err) no(nm + " a 360x640: " + m1.err);
      if (m2.err) no(nm + " a 412x915: " + m2.err);
      mis.push(nm + " righe " + m1.righe + "/" + m2.righe + " px");
    }
    nota(N, "misure a 360x640 e 412x915: tabellone tutto sopra la barra (" + mis.join(", ") + ")");
    // le schede: «🤔 Cosa intendevi?» e i titoli (si aprono col tasto, ✕ le chiude)
    var wS = W.finestra("Sara");
    var bCosa = bottone(wS, /Cosa intendevi/, ".or-chip");
    if (!bCosa) no("Sara non ha il tasto «🤔 Cosa intendevi?»");
    bCosa.click(); await W.dorme(300);
    var R = wS.document.querySelector(".or-riv.su");
    if (!R || !/pensava/.test(R.textContent)) no("«🤔 Cosa intendevi?» non apre la sua scheda");
    if (/Cosa intendevi\?\./.test(T(wS))) no("c'è ancora «Cosa intendevi?.»");
    R.querySelector(".or-riv-x").click(); await W.dorme(300);
    if (wS.document.querySelector(".or-riv.su")) no("✕ non chiude «Cosa intendevi?»");
    wS.document.querySelector(".or-chip.mio").click(); await W.dorme(300);
    var F = wS.document.querySelector(".or-tit-f.su");
    if (!F || F.querySelectorAll(".or-tit").length !== 4 || F.querySelectorAll(".or-tit.mio").length !== 1) no("la scheda dei titoli non ha 4 righe con la mia in evidenza");
    F.querySelector(".or-riv-x").click(); await W.dorme(300);
    if (wS.document.querySelector(".or-tit-f.su")) no("✕ non chiude i titoli");
    nota(N, "schede «Cosa intendevi?» e «🎭» col tasto, ✕ le chiude");
    // 📸 la foto
    wG.__ORDINE.fotoFinta = function (url) { wG.__fotoUrl = url; };
    bottone(wG, /Foto/, ".or-chip").click();
    if (!await W.aspetta(function () { return wG.__fotoUrl; }, 3000)) no("«📸 Foto» non fa l'immagine");
    var cv = wG.__ORDINE.foto;
    if (!cv || cv.width !== 1080 || cv.height !== 1350 || wG.__fotoUrl.indexOf("data:image/png") !== 0 || wG.__fotoUrl.length < 40000) no("la foto è strana (" + (cv && cv.width) + "x" + (cv && cv.height) + ", " + (wG.__fotoUrl || "").length + " caratteri)");
    W.__o2fFoto = wG.__fotoUrl;
    nota(N, "📸 foto 1080x1350 (" + Math.round(wG.__fotoUrl.length / 1024) + " KB)");
    // la Rivincita: saletta pulita
    if (!W.clicca(wP, /Nuova partita|Rivincita/)) no("Paky non trova la Rivincita");
    if (!await W.aspetta(function () { return vm(C).fase === "lobby"; }, 8000)) no("la Rivincita non torna in saletta");
    if (vm(C).titoli || vm(C).fineCome) no("in saletta restano i titoli della partita prima");
    senzaErrori();
    return N.join(" · ");
  } });

  // ---------------- o2f2 ----------------
  COPIONE.aggiungi("o2f2", { nome: "Parola d'ordine contro il Bot: niente frasi a squadre, punti, chi guarda, Cosa intendevi? lungo, l'ultima parola del Bot", fai: async function () {
    var N = [];
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Parola d'ordine");
    await W.apriTel("Giulia", { hash: "gioco=ordine&stanza=" + C, x: 185 }); await W.apriTel("Luca", { hash: "gioco=ordine&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (vm(C).players || []).length >= 3; }, 8000)) no("non entrano in 3");
    if (!await W.aspetta(function () { return W.clicca(P, /contro il Bot/); }, 4000)) no("niente «🤖 Siete in 3: giocate contro il Bot»");
    if (!await W.aspetta(function () { return vm(C).vsBot; }, 4000)) no("non si passa a «contro il Bot»");
    var bot = (vm(C).players.filter(function (p) { return p.bot; })[0] || {}).nome;
    W.reteDi("Giulia").invia({ t: "capo" });
    if (!await W.aspetta(function () { return vm(C).capo[0] === idDi(C, "Giulia"); }, 4000)) no("Giulia non diventa capo");
    // la saletta: «contro il Bot», mai «contro Matt»
    var tP = await W.aspetta(function () { var t = T(P); return /Voi contro il Bot \(🤖 /.test(t) && /Tutti insieme contro il Bot/.test(t) && t; }, 4000);
    if (!tP) no("la saletta non dice «Voi contro il Bot (🤖 …)» e «Tutti insieme contro il Bot» («" + T(P).slice(0, 300) + "»)");
    if (tP.indexOf("contro " + bot) >= 0) no("la saletta dice ancora «contro " + bot + "»");
    if (/Cosa intendevi\?\./.test(tP)) no("in saletta c'è «Cosa intendevi?.»");
    nota(N, "saletta: «Voi contro il Bot (🤖 " + bot + ")», «Tutti insieme contro il Bot»");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).passo === "indizio" && vm(C).turno === 0; }, 10000)) no("la partita contro il Bot non comincia");
    var nomi = ["Paky", "Giulia", "Luca"];
    nomi.forEach(function (n) { spiaVibra(W.finestra(n)); });
    var wB = await W.apriTel("Bea", { hash: "gioco=ordine&stanza=" + C + "&guarda=1", x: 555 });
    if (!await W.aspetta(function () { var w = W.finestra("Bea"); return w && carte(w).length >= 20; }, 8000)) no("Bea (guarda) non vede il tabellone");
    wB = W.finestra("Bea"); spiaVibra(wB);
    var tutti = nomi.concat(["Bea"]);
    if (!/Cominciate voi/.test(logTx(P))) no("nella chat non c'è «Cominciate voi»");
    var chiave = await W.aspetta(function () { var c = chiaveDa(W.finestra("Giulia")); return c.length && c.every(function (x) { return x != null; }) && c; }, 6000);
    if (!chiave) no("Giulia non vede la chiave");
    await W.dorme(8000);   // (la presentazione)
    // turno 1: Paky ne trova una, Luca gira una del Bot
    await indizio(C, "Giulia", 2);
    await gira(C, "Paky", coperteDi(C, chiave, 0)[0]);
    var suaW = coperteDi(C, chiave, 1)[0], parolaBot = vm(C).tab[suaW].w;
    await gira(C, "Luca", suaW);
    var c1 = await cartelloSuTutti(tutti, /era di /, 2000);
    if (c1.indexOf(parolaBot + " era di " + bot) < 0 || c1.indexOf("Tocca a " + bot) < 0) no("la scritta dice «" + c1 + "»");
    if (logTx(P).indexOf("era di " + bot) < 0) no("nella chat non c'è «era di " + bot + "»");
    if (/era dei Blu/.test(logTx(P))) no("nella chat c'è ancora «era dei Blu»");
    nota(N, "«" + c1 + "», chat «era di " + bot + "»");
    // il turno del Bot: «🤖 … scopre una sua parola…» (mai «Vediamo se è giusta»), poi «🤖 … scopre X · Gliene mancano N»
    var wL = W.finestra("Luca"), visto = null, vediamo = false;
    await W.aspetta(function () {
      var v = vm(C), t = sottoTx(wL);   // (la barra in basso: in alto c'è già «🤖 … scopre una sua parola…» di suo)
      if (/Vediamo se è giusta/.test(t)) vediamo = true;
      if (v.sospeso && v.sospeso.id === "botsq" && t.indexOf(bot + " scopre una sua parola") >= 0) visto = true;
      return v.turno === 0 && v.passo === "indizio" && visto !== null;
    }, 12000, 40);
    if (vediamo) no("sul turno del Bot Luca legge «🥁 Vediamo se è giusta…»");
    if (!visto) no("sul turno del Bot Luca non legge «🤖 " + bot + " scopre una sua parola…»");
    var c2 = await cartelloSuTutti(tutti, /scopre .*Gliene manca/, 3000);
    nota(N, "turno del Bot: «" + c2 + "»");
    // turno 2: indizio ∞, Giulia intende tutte le sue parole, Paky le gira tutte: vittoria
    if (!await W.aspetta(function () { return vm(C).turno === 0 && vm(C).passo === "indizio"; }, 9000)) no("non tocca a voi");
    await indizio(C, "Giulia", 0);
    var mie = coperteDi(C, chiave, 0);
    manda("Giulia", { t: "intendo", x: 1, l: mie.slice() });
    var restoBot = coperteDi(C, chiave, 1).length;
    for (var i = 0; i < mie.length && vm(C).fase === "gioco"; i++) await gira(C, "Paky", mie[i]);
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 6000)) no("la partita non finisce");
    var v = vm(C);
    if (v.vince !== 0) no("vince " + v.vince + " invece di voi");
    if (!v.punti || v.punti.n !== restoBot) no("i punti sono " + JSON.stringify(v.punti) + " invece di " + restoBot + " (le parole che mancavano al Bot)");
    await W.dorme(600);
    ["Paky", "Giulia", "Luca"].forEach(function (n) { var t = testa(W.finestra(n)); if (t.indexOf("🎉 Avete battuto " + bot + "!") < 0 || t.indexOf("🎯 " + restoBot + " punti") < 0) no(n + ": in alto «" + t + "»"); });
    var tB = testa(wB);
    if (tB.indexOf("🎉 Battuto " + bot + "!") < 0 || /Avete battuto/.test(tB)) no("Bea (guarda) legge in alto «" + tB + "»");
    if (!/Hai guardato/.test(statoFine(wB))) no("Bea legge «" + statoFine(wB) + "»");
    if (new RegExp("Più parole trovate: " + bot).test(logTx(P))) no("nella chat c'è «Più parole trovate: " + bot + "»");
    var tit = v.titoli || [];
    if (tit.length !== 3 || tit.some(function (x) { return x.nome === bot; })) no("i titoli contro il Bot: " + JSON.stringify(tit.map(function (x) { return x.nome; })));
    nota(N, "vittoria: «" + testa(W.finestra("Luca")) + "», Bea «" + tB + "», titoli a " + tit.map(function (x) { return x.nome; }).join(", "));
    nomi.forEach(function (n) { var l = vib(W.finestra(n)); if (l.join(" ") !== "[60,40,120]") no(n + " ha vibrato «" + l.join(" ") + "»"); });
    if (vib(wB).length) no("Bea (guarda) ha vibrato");
    // «Cosa intendevi?» lungo a 360x640: scorre dentro di sé e non taglia niente
    var f = document.getElementById("tel-Luca"); f.style.width = "360px"; f.style.height = "640px"; wL.dispatchEvent(new wL.Event("resize"));
    await W.dorme(900);
    var bc = bottone(wL, /Cosa intendevi/, ".or-chip"); if (!bc) no("Luca non ha «🤔 Cosa intendevi?»");
    bc.click(); await W.dorme(400);
    var R = wL.document.querySelector(".or-riv.su"); if (!R) no("la scheda non si apre");
    R.querySelectorAll(".or-riv-fr")[1].click(); await W.dorme(300);
    var corpo = R.querySelector(".or-riv-corpo"), rr = R.getBoundingClientRect();
    if (wL.getComputedStyle(corpo).overflowY !== "auto") no("il riepilogo non scorre dentro di sé");
    if (rr.bottom > 641 || rr.top < 0) no("la scheda esce dallo schermo");
    corpo.scrollTop = corpo.scrollHeight; await W.dorme(200);
    var es = R.querySelector(".or-riv-esito"), er = es.getBoundingClientRect(), cr = corpo.getBoundingClientRect();
    if (er.bottom > cr.bottom + 1 || er.top < cr.top - 1) no("in fondo al riepilogo l'esito resta tagliato");
    var pr = R.querySelector(".or-riv-premio");
    if (!/Sintonia: \d+ su \d+/.test(pr.textContent) || /Più in sintonia/.test(pr.textContent)) no("contro il Bot il premio dice «" + pr.textContent + "»");
    nota(N, "«Cosa intendevi?» con " + R.querySelectorAll(".or-riv-c").length + " parole a 360x640: scorre (" + corpo.scrollHeight + " in " + corpo.clientHeight + "), «" + pr.textContent + "»");
    R.querySelector(".or-riv-x").click();
    f.style.width = "360px"; f.style.height = "740px"; wL.dispatchEvent(new wL.Event("resize"));
    // seconda partita: girate voi l'ultima parola del Bot
    if (!await W.aspetta(function () { return W.clicca(P, /Nuova partita|Rivincita/); }, 4000)) no("niente Rivincita");
    if (!await W.aspetta(function () { return vm(C).fase === "lobby"; }, 8000)) no("la Rivincita non torna in saletta");
    var capoN = nomeDi(C, vm(C).capo[0]), altri = ["Paky", "Giulia", "Luca"].filter(function (n) { return n !== capoN; });
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("niente «Comincia» (2)");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).passo === "indizio"; }, 10000)) no("non ricomincia");
    var ch2 = await W.aspetta(function () { var c = chiaveDa(W.finestra(capoN)); return c.length && c.every(function (x) { return x != null; }) && c; }, 6000);
    await W.dorme(8000);
    var usati = [], giri = 0;
    while (vm(C).fase === "gioco" && giri++ < 12) {
      if (!await W.aspetta(function () { return vm(C).fase !== "gioco" || (vm(C).turno === 0 && vm(C).passo === "indizio"); }, 12000)) no("non torna il vostro turno");
      if (vm(C).fase !== "gioco") break;
      await indizio(C, capoN, 1, usati);
      var sue = coperteDi(C, ch2, 1);
      // al primo giro una di nessuno (così all'ultimo giro al Bot ne resta una sola da girare a voi)
      var x = giri === 1 ? coperteDi(C, ch2, "n").filter(function (j) { return !vm(C).tab[j].g; })[0] : sue[0];
      await gira(C, altri[0], x);
      if (vm(C).fase === "gioco" && vm(C).turno === 0 && vm(C).passo === "indovina") await gira(C, altri[0], coperteDi(C, ch2, "n").filter(function (j) { return !vm(C).tab[j].g; })[0]);   // (era la parola d'oro: un'altra)
    }
    v = vm(C);
    if (v.fase !== "fine" || v.vince !== 1) no("la seconda partita non la vince il Bot (" + v.fase + ", " + v.vince + ")");
    if (!v.fineCome || v.fineCome.t !== "regalo") no("la fine non è «l'ultima parola del Bot girata da voi»: " + JSON.stringify(v.fineCome));
    var atteso = "🤖 Vince " + bot + ": " + altri[0] + " ha girato la sua ultima parola!";
    await W.dorme(500);
    if (testa(W.finestra("Luca")).indexOf(atteso) < 0) no("Luca legge in alto «" + testa(W.finestra("Luca")) + "» invece di «" + atteso + "»");
    if (!/Avete perso/.test(statoFine(W.finestra("Luca")))) no("Luca legge «" + statoFine(W.finestra("Luca")) + "»");
    nota(N, "seconda partita: «" + atteso + "»");
    senzaErrori();
    return N.join(" · ");
  } });

  // ---------------- o2f3 ----------------
  COPIONE.aggiungi("o2f3", { nome: "Parola d'ordine: la fine resta con chi ricarica e col vice, clessidra rossa, «?.», Copia tutte senza finestra del browser", fai: async function () {
    var N = [], amici = ["Giulia", "Luca", "Sara"];
    var X = await partita(amici, { Luca: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]), C = X.C, P = X.P;
    if (!/Cosa intendevi\?/.test(T(P)) || /Cosa intendevi\?\./.test(T(P))) no("in saletta «" + (T(P).match(/[^·]*Cosa intendevi[^·]*/) || [""])[0] + "»");
    await comincia(X);
    // la clessidra: le cifre rosse negli ultimi 10 secondi (lo stile vero del gioco, sul tavolo vero)
    var wG = W.finestra("Giulia"), I = wG.document.querySelector(".or-ind");
    var prova = wG.document.createElement("div");
    prova.innerHTML = "<span class='or-cless'><b class='or-conto'>0:42</b></span> <span class='or-cless rosso'><b class='or-conto'>0:08</b></span>";
    I.appendChild(prova);
    var bs = prova.querySelectorAll("b"), c0 = wG.getComputedStyle(bs[0]).color, c1 = wG.getComputedStyle(bs[1]).color;
    prova.remove();
    if (c1 !== "rgb(224, 49, 49)") no("negli ultimi 10 secondi le cifre sono «" + c1 + "» invece di rosse");
    if (c0 !== "rgb(230, 119, 0)") no("prima degli ultimi 10 secondi le cifre sono «" + c0 + "»");
    nota(N, "clessidra: cifre " + c0 + " → " + c1 + " negli ultimi 10 s");
    // fine veloce: chi è di turno gira la nera
    var chiave = await W.aspetta(function () { var c = chiaveDa(W.finestra("Luca")); return c.length && c.every(function (x) { return x != null; }) && c; }, 6000);
    await W.dorme(8000);
    var k = vm(C).turno; await indizio(C, X.capi[k], 1);
    manda(indovinoDi(C, k), { t: "gira", i: chiave.indexOf("x") });
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 9000)) no("non finisce");
    var v0 = vm(C), tit0 = JSON.stringify(v0.titoli), fc0 = JSON.stringify(v0.fineCome), testa0 = testa(W.finestra("Sara"));
    // l'host ricarica sulla fine: stessa fine, stessi titoli, niente scheda da sola
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { var s = W.statoStanza(C) || {}; return s._r && (s.vm || s).fase === "fine"; }, 10000)) no("dopo la ricarica dell'host la fine non riprende");
    var wP = await W.aspetta(function () { var w = W.finestra("Paky"); return w && w.document.querySelector(".or-chip") && bottone(w, /Nuova partita|Rivincita/) && w; }, 8000);
    if (!wP) no("Paky ricaricato non ha la fine coi tasti («" + T(W.finestra("Paky")).slice(-120) + "»)");
    if (JSON.stringify(vm(C).titoli) !== tit0 || JSON.stringify(vm(C).fineCome) !== fc0) no("dopo la ricarica i titoli o la fine sono cambiati");
    await W.dorme(1500);
    X.nomi.forEach(function (n) { if (W.finestra(n).document.querySelector(".or-riv.su, .or-tit-f.su")) no(n + ": dopo la ricarica una scheda si è aperta da sola"); });
    if (testa(wP) !== testa0) no("Paky ricaricato legge in alto «" + testa(wP) + "» invece di «" + testa0 + "»");
    nota(N, "l'host ricarica: stessa fine («" + testa0 + "»), stessi titoli, tasti subito");
    // l'host sparisce: la vice tiene la fine
    A.muore("Paky");
    var g0 = A.chiTiene(C).g || 1, viceId = await W.aspetta(function () { var c = A.chiTiene(C); return c.g > g0 && c.h && c.h !== "host" && c.h; }, 15000);
    if (!viceId) no("nessun amico tiene la fine (" + JSON.stringify(A.chiTiene(C)) + ")");
    var nVice = nomeDi(C, viceId);
    if (!await W.aspetta(function () { return vm(C).hostId === viceId && vm(C).fase === "fine"; }, 6000)) no("la foto del vice (" + nVice + ") non arriva");
    if (JSON.stringify(vm(C).titoli) !== tit0) no("col vice i titoli sono cambiati: " + JSON.stringify(vm(C).titoli));
    if (JSON.stringify(vm(C).fineCome) !== fc0) no("col vice la fine è cambiata: " + JSON.stringify(vm(C).fineCome));
    wG = W.finestra(nVice);
    var bR = await W.aspetta(function () { return bottone(wG, /Nuova partita|Rivincita/); }, 6000);
    if (!bR) no(nVice + " (vice) non ha la Rivincita («" + T(wG).slice(-120) + "»)");
    if (!wG.document.querySelector(".or-chip.mio")) no(nVice + " (vice) non ha il tasto del suo titolo");
    if (testa(wG) !== testa0) no(nVice + " (vice) legge in alto «" + testa(wG) + "»");
    bR.click();
    if (!await W.aspetta(function () { return vm(C).fase === "lobby"; }, 8000)) no("la Rivincita della vice non torna in saletta");
    nota(N, "l'host sparisce: " + nVice + " tiene la fine coi titoli e fa la Rivincita");
    // «📋 Copia tutte» senza la finestra del browser
    var wZ = await W.apriTel("Zia", { x: 740 });
    var tess = await W.aspetta(function () { return [].filter.call(wZ.document.querySelectorAll(".tessera"), function (t) { return (t.querySelector("h2") || {}).textContent === "Parola d'ordine"; })[0]; }, 5000);
    if (!tess) no("Zia non trova la tessera");
    tess.click(); await W.dorme(300);
    if (!W.clicca(wZ, /apro io/)) no("Zia non trova «Online: apro io»");
    var inp = await W.aspetta(function () { return wZ.document.querySelector(".or-aggiungi input"); }, 3000);
    if (!inp) no("nelle regole non c'è il campo delle parole");
    inp.value = "Peppe, Ibiza"; W.clicca(wZ, /Aggiungi/); await W.dorme(200);
    var prompt = 0; wZ.prompt = function () { prompt++; return null; };
    try { Object.defineProperty(wZ.navigator, "clipboard", { configurable: true, value: { writeText: function () { return Promise.reject(new Error("no")); } } }); } catch (e) {}
    if (!W.clicca(wZ, /Copia tutte/)) no("niente «📋 Copia tutte»");
    var campo = await W.aspetta(function () { var c = wZ.document.querySelector(".or-copia"); return c && c.offsetParent && c; }, 2000);
    if (!campo || campo.value !== "Peppe, Ibiza") no("le parole non compaiono nell'app («" + (campo && campo.value) + "»)");
    if (prompt) no("si è aperta la finestra del browser");
    nota(N, "«📋 Copia tutte» senza permesso: «" + campo.value + "» nell'app, niente finestra del browser");
    var errs = W.erroriTel().filter(function (e) { return !/^Paky/.test(e); });   // (Paky è stato spento apposta)
    if (errs.length) no("errori: " + errs.slice(0, 3).join(" | "));
    return N.join(" · ");
  } });

  // ---------------- o2f4 (revisione del 22 ott 2026) ----------------
  COPIONE.aggiungi("o2f4", { nome: "Parola d'ordine (revisione della fine): «Il consigliere» conta le parole, la partita chiusa non dà punti, il titolo grande non copre una scheda aperta, «ha girato anche»", fai: async function () {
    var N = [];
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "Parola d'ordine");
    await W.apriTel("Giulia", { hash: "gioco=ordine&stanza=" + C, x: 185 }); await W.apriTel("Luca", { hash: "gioco=ordine&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (vm(C).players || []).length >= 3; }, 8000)) no("non entrano in 3");
    if (!await W.aspetta(function () { return W.clicca(P, /contro il Bot/); }, 4000)) no("niente «🤖 Siete in 3: giocate contro il Bot»");
    if (!await W.aspetta(function () { return vm(C).vsBot; }, 4000)) no("non si passa a «contro il Bot»");
    W.reteDi("Giulia").invia({ t: "capo" });
    if (!await W.aspetta(function () { return vm(C).capo[0] === idDi(C, "Giulia"); }, 4000)) no("Giulia non diventa capo");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).passo === "indizio" && vm(C).turno === 0; }, 10000)) no("la partita contro il Bot non comincia");
    var chiave = await W.aspetta(function () { var c = chiaveDa(W.finestra("Giulia")); return c.length && c.every(function (x) { return x != null; }) && c; }, 6000);
    if (!chiave) no("Giulia non vede la chiave");
    await W.dorme(8000);   // (la presentazione)
    await indizio(C, "Giulia", 2);
    var mie = coperteDi(C, chiave, 0), a = mie[0], b = mie[1], c = mie[2];
    manda("Giulia", { t: "intendo", x: 0, l: [a, c] });   // Giulia pensava ad A e C
    // 🎭 Luca segna A, toglie il segno e lo rimette (tre volte la stessa parola), poi segna B: per «Il consigliere» sono 2 parole
    var luca = idDi(C, "Luca");
    async function segno(m, ok) {
      manda("Luca", m);
      if (!await W.aspetta(function () { return ok((vm(C).prop || {})[luca] || []); }, 3000)) no("il segno di Luca (" + JSON.stringify(m) + ") non arriva");
    }
    for (var r = 0; r < 3; r++) {
      await segno({ t: "proponi", i: a }, function (l) { return l.indexOf(a) >= 0; });
      if (r < 2) await segno({ t: "togli", i: a }, function (l) { return l.indexOf(a) < 0; });
    }
    await segno({ t: "proponi", i: b }, function (l) { return l.indexOf(b) >= 0; });
    await W.dorme(900);   // (il core salva la partita ricordata al massimo ogni mezzo secondo)
    var st =(JSON.parse(W.BR.mem.Paky.l["sg-ripresa"] || "null") || {}).stato || {}, sg = (st.st || {})[luca];
    if (!sg) no("nella partita ricordata non ci sono i numeri di Luca");
    if (sg.segni !== 2) no("«Il consigliere»: Luca ha segnato 2 parole (una tre volte) ma ne contano " + sg.segni);
    nota(N, "🎭 Luca segna la stessa parola 3 volte e un'altra: " + sg.segni + " parole segnate");
    // Luca gira A (pensata) e B (non pensata): i Rossi sono avanti sul Bot
    await gira(C, "Luca", a); await gira(C, "Luca", b);
    var v = vm(C);
    if (v.fase !== "gioco" || !(v.resto[0] < v.resto[1])) no("dopo due parole giuste i Rossi non sono avanti (" + v.resto.join("/") + ", " + v.fase + ")");
    // la spia del titolo grande: chi lo vede, e se in quel momento ha una scheda aperta
    var spiati = { Paky: [], Luca: [] };
    var spia = setInterval(function () {
      Object.keys(spiati).forEach(function (n) {
        var w = W.finestra(n), x = w && w.document.querySelector(".or-cart.su");
        if (x && /Il tuo titolo/.test(x.textContent)) spiati[n].push(!!w.document.querySelector(".or-riv.su, .or-tit-f.su"));
      });
    }, 80);
    try {
      // 🏁 l'host chiude: vincete voi (meno parole da trovare), ma niente 🎯 punti né record (si vince trovando tutte le parole)
      W.finestra("Paky").__ORDINE.ui.cb.manda({ t: "chiudi" });
      if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 6000)) no("la partita non si chiude");
      var wL = W.finestra("Luca");
      var chip = await W.aspetta(function () { return wL.document.querySelector(".or-chip[data-f='titoli']"); }, 3000);
      if (!chip) no("Luca non ha il tasto del suo titolo");
      chip.click();   // Luca apre subito «🎭 I titoli», prima della fine della festa
      await W.dorme(300);
      if (!wL.document.querySelector(".or-tit-f.su")) no("il tasto del titolo non apre la scheda di Luca");
      // Paky (niente scheda aperta) vede il suo titolo grande; se apre «🤔 Cosa intendevi?» mentre c'è, la scritta se ne va
      var wP = W.finestra("Paky");
      var visto = await W.aspetta(function () { var x = wP.document.querySelector(".or-cart.su"); return x && /Il tuo titolo/.test(x.textContent); }, 8000, 40);
      if (!visto) no("a Paky (nessuna scheda aperta) il titolo grande non compare");
      var bc = bottone(wP, /Cosa intendevi/, ".or-chip"); if (!bc) no("Paky non ha «🤔 Cosa intendevi?»");
      bc.click(); await W.dorme(250);
      if (!wP.document.querySelector(".or-riv.su")) no("il tasto non apre la scheda di Paky");
      if (wP.document.querySelector(".or-cart.su")) no("aprendo la scheda la scritta grande del titolo resta sopra");
      await W.dorme(3000);
    } finally { clearInterval(spia); }
    v = vm(C);
    if (v.vince !== 0 || !v.fineCome || v.fineCome.t !== "chiusa") no("la partita chiusa non la vincete voi (" + v.vince + ", " + JSON.stringify(v.fineCome) + ")");
    if (v.punti) no("la partita chiusa dall'host dà i punti: " + JSON.stringify(v.punti));
    var st2 = (JSON.parse(W.BR.mem.Paky.l["sg-ripresa"] || "null") || {}).stato || {};
    if (st2.recBot) no("la partita chiusa fa il record della serata (" + st2.recBot + ")");
    var alto = testa(P);
    if (!/Partita chiusa: vincete voi/.test(alto) || /🎯|punt/.test(alto)) no("in alto Paky legge «" + alto + "»");
    nota(N, "🏁 chiusa dall'host: «" + alto + "», niente punti né record");
    if (spiati.Luca.some(Boolean)) no("il titolo grande compare sopra la scheda aperta di Luca");
    if (spiati.Paky.some(Boolean)) no("a Paky il titolo grande resta sopra la scheda aperta");
    nota(N, "titolo grande: a Paky sì (e se ne va quando apre «Cosa intendevi?»), a Luca (scheda già aperta) no");
    // 📸 il «pensava a» più buffo: A trovata, B girata senza che Giulia ci pensasse → «la squadra ha girato anche B»
    var tx = W.finestra("Paky").__ORDINE.pensavaBuffo(v), wa = v.tab[a].w, wb = v.tab[b].w, wc = v.tab[c].w;
    if (tx.indexOf("Giulia pensava a " + wa + " e " + wc + ", la squadra ha girato anche " + wb) < 0) no("nella foto il «pensava a» dice «" + tx + "»");
    nota(N, "📸 «" + tx + "»");
    senzaErrori();
    return N.join(" · ");
  } });

  // ---------------- o2f5 (revisione del 22 ott 2026) ----------------
  COPIONE.aggiungi("o2f5", { nome: "Parola d'ordine a 3 squadre (revisione della fine): la nera a metà partita, poi vince un'altra squadra; «L'artificiere» dice la parola nera vera", fai: async function () {
    var N = [];
    if (!W.__prepPO) await COPIONE.carica("preferiti/ordine.js");   // (la spia delle regole: w.__imp = { squadre: 3 })
    var P = await W.apriTel("Paky", { x: 0, po: true, prima: function (w) { w.__imp = { squadre: 3 }; } });
    var C = await W.apriStanza(P, "Parola d'ordine"), amici = ["Giulia", "Luca", "Sara", "Ugo", "Bea"];
    for (var i = 0; i < amici.length; i++) {
      await W.apriTel(amici[i], { hash: "gioco=ordine&stanza=" + C, x: 150 * (i + 1), po: true });
      var quanti = i + 2;
      if (!await W.aspetta(function () { return (vm(C).players || []).length >= quanti; }, 8000)) no(amici[i] + " non entra");
    }
    if (!await W.aspetta(function () { return vm(C).nsq === 3; }, 4000)) no("la stanza non è a 3 squadre");
    var nomi = ["Paky"].concat(amici);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).tab; }, 10000)) no("non comincia (" + vm(C).fase + ")");
    if (!await W.aspetta(function () { return nomi.every(function (n) { return carte(W.finestra(n)).length >= 20; }); }, 6000)) no("non tutti vedono il tabellone");
    await W.dorme(10000);   // (la presentazione di tre squadre)
    // la squadra di turno gira la parola nera: esce, ma la partita va avanti
    var v = vm(C), k0 = v.turno, capo0 = nomeDi(C, v.capo[k0]);
    await indizio(C, capo0, 1);
    var chiave = await W.aspetta(function () { var c = chiaveDa(W.finestra(capo0)); return c.length && c.every(function (x) { return x != null; }) && c; }, 6000);
    if (!chiave) no(capo0 + " non vede la chiave");
    var iNera = chiave.indexOf("x"), wNera = vm(C).tab[iNera].w, chiNera = indovinoDi(C, k0);
    await gira(C, chiNera, iNera);
    var c0 = await cartelloSuTutti(nomi, /la parola nera/, 2500);
    if (c0.indexOf("sono fuori") < 0 || !/Tocca ai /.test(c0)) no("la scritta della nera a metà partita dice «" + c0 + "»");
    if (vm(C).fase !== "gioco" || vm(C).fuori.indexOf(k0) < 0) no("dopo la nera i " + k0 + " non sono fuori o la partita è finita (" + vm(C).fase + ")");
    nota(N, "nera a metà partita: «" + c0 + "»");
    // la squadra dopo trova tutte le sue parole con un indizio ∞
    if (!await W.aspetta(function () { var x = vm(C); return x.passo === "indizio" && x.turno !== k0 && !x.sospeso; }, 8000)) no("il turno non passa");
    await W.dorme(2500);
    v = vm(C); var k1 = v.turno, capo1 = nomeDi(C, v.capo[k1]);
    await indizio(C, capo1, 0, ["QUOKKA"]);
    var mie = coperteDi(C, chiave, k1), ultima = vm(C).tab[mie[mie.length - 1]].w;
    for (var j = 0; j < mie.length && vm(C).fase === "gioco"; j++) await gira(C, indovinoDi(C, k1), mie[j]);
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 8000)) no("la partita non finisce");
    v = vm(C);
    if (v.vince !== k1 || !v.fineCome || v.fineCome.t !== "tutte") no("vince " + v.vince + " (" + JSON.stringify(v.fineCome) + ") invece di " + k1);
    // 🎭 «L'artificiere»: la parola nera vera, non l'ultima parola girata
    var art = (v.titoli || []).filter(function (x) { return x && x.nome === chiNera; })[0];
    if (!art || art.titolo !== "L'artificiere") no(chiNera + " (ha girato la nera) ha il titolo " + JSON.stringify(art));
    if (art.dett.indexOf(wNera) < 0 || art.dett.indexOf(ultima) >= 0) no("«L'artificiere» dice «" + art.dett + "» (la nera era " + wNera + ", l'ultima girata " + ultima + ")");
    nota(N, "fine: vincono i " + k1 + ", " + chiNera + " 💣 «" + art.dett + "»");
    // in alto e sotto, su tutti
    await W.dorme(1500);
    nomi.forEach(function (n) {
      var w = W.finestra(n), p = chiDi(C, n), sf = statoFine(w);
      if (!/^🎉 Vincono i /.test(testa(w))) no(n + " legge in alto «" + testa(w) + "»");
      if (p.team === k1 ? !/Avete vinto/.test(sf) : !/Avete perso/.test(sf)) no(n + " (squadra " + p.team + ") legge «" + sf + "»");
    });
    var m = await misuraFine("Paky", 360, 640);
    if (m.err) no("a 360x640 (3 squadre): " + m.err);
    nota(N, "in alto «" + testa(P) + "», vinto/perso giusti su 6 telefoni, 360x640 a posto (righe " + m.righe + " px)");
    senzaErrori();
    return N.join(" · ");
  } });

  // per lo strumento delle foto (fuori dal progetto): gli aiuti di questo file
  COPIONE.o2f = { partita: partita, comincia: comincia, indizio: indizio, gira: gira, coperteDi: coperteDi, chiaveDa: chiaveDa, indovinoDi: indovinoDi, manda: manda, calmo: calmo };
})();

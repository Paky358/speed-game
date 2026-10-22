// PROVE DI PAROLA D'ORDINE, giro 2 (22 ott 2026), compito «Online e casi rari» (js/games/ordine.js, più due agganci in core.js).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("ordine2/online.js"); await COPIONE.prova("o2o1")
// Con Edge invisibile: prova.js --porta 8995 --carica ordine2/online.js --prova o2o1,o2o2,o2o3,o2o4,o2o5,o2o6,o2o7 --rifai
//
// o2o1 🚪 IL CAPO CHE ESCE APPOSTA (decisione del proprietario, 22 ott 2026). In 5, due squadre. Al turno dei Rossi il loro capo
//      (Luca) tocca ‹: una finestra sola, «Uscire dalla partita?» con «Sei il capo dei Rossi: i compagni ne scelgono subito un
//      altro». Esce: entro pochi secondi (non 3 minuti) Paky e Ugo hanno «👑 Faccio io il capo» e leggono «🚪 Luca, il vostro capo,
//      è uscito…», i Blu «🚪 I Rossi: il capo è uscito…» e nessun tasto; in chat «🚪 Luca, il capo dei Rossi, è uscito dalla
//      partita». Ugo fa il capo (vede la mappa, Paky no) e dà l'indizio. Luca torna dallo stesso link: GUARDA il resto della
//      partita («👀 … guardi fino alla fine», niente mappa, non segna né gira; un suo «proponi» l'host lo butta), Paky gira una
//      parola. Partita chiusa e nuova partita: Luca gioca di nuovo come sempre.
// o2o2 💣 A 3 SQUADRE IN 7: la squadra di turno gira la parola nera, esce, e una parola di nessuno coperta diventa la NUOVA parola
//      nera: i capi la vedono col teschio sulla mappa (chi non è capo no, nella foto non c'è), la chiave nuova va solo ai capi,
//      «💣 Attenti: c'è una nuova parola nera!» grande su tutti e in chat. Sara (della squadra uscita) se ne va: Marco arriva tardi
//      e NON finisce nella squadra uscita (c14), legge «🎉 Sei dentro! Giochi già da adesso» (c20). Dina guarda col link e vede
//      gli avatar veri di tutti (c11). L'host ricarica: le due nere restano, i capi rivedono la nuova. Le copie per i vice vanno
//      solo ai capi (c12); l'host sparisce e la partita la prende un capo.
// o2o3 👑 L'HOST CHE ESCE (c1). In 5, l'host è il capo dei Rossi. ‹ → «Esci dalla partita?» con «👑 Lascia la partita a Giulia»,
//      «🏁 Chiudi per tutti» e «Resta» (Resta: si continua). «👑 Lascia…»: Paky va in home, in chat «👋 Paky lascia la partita a
//      Giulia», entro pochi secondi la partita la tiene Giulia (stesso tabellone), nessuno legge «chiusa»; i Rossi hanno subito
//      «👑 Faccio io il capo» (Paky è uscito apposta) e Luca fa il capo.
// o2o4 🏠 NELLA SALA in 5 (+ Bea che arriva dopo): il riquadro della Sala dice a che punto è la partita («🔴 9 · 🔵 8 da
//      trovare», t.aCheSiamo) e «▶ Entra · giochi subito»; l'host che tocca ‹ legge solo «Chiudere la partita per tutti?» (si torna
//      nella Sala: niente «Lascia la partita») e «Resta» la tiene; Bea entra e gioca subito.
// o2o5 ⏸ LA CLESSIDRA FERMA: in 4 con le clessidre. L'host tocca la clessidra: «⏸ ferma» su tutti e il tempo non scende; un amico
//      non la può toccare; l'host ricarica e la clessidra resta ferma (t.ricorda); un altro tocco la fa ripartire. Il 📶 accanto a
//      chi si sta ricollegando (onForse) e via quando torna (onTornato).
// o2o6 🤖 CONTRO IL BOT (c15) + chi arriva a partita finita: dopo la ricarica dell'host il Bot ha ancora il suo avatar fisso
//      (SG.bot); Marco arriva sulla classifica (aspetta la prossima), l'host ricarica, e alla nuova partita Marco ha il suo avatar.
// o2o7 📶 IL PRIMO COLLEGAMENTO NON RIESCE (c19): tutti e due gli uffici postali giù, chi entra legge «📶 Non riesco a entrare…»
//      con «↻ Riprova» e «🏠 Torna alla home»; la rete torna, «↻ Riprova» e si entra.
// Profili finti, mai account veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T, pill = A.pill;
  var INDIZI = ["QUOKKA", "ZEFIRO", "GNOMO", "YETI", "FIORDO", "WAFER", "OBLO", "JAZZ", "ZUAVO", "KIWI", "PUFFO", "VICHINGO", "BRADIPO", "KOALA"];

  // ---------------- aiuti ----------------
  function nota(N, x) { N.push(x); }
  function senzaErrori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  function chiDi(C, nome) { return ((vm(C).players || []).filter(function (p) { return p.nome === nome; }))[0] || null; }
  function idDi(C, nome) { var p = chiDi(C, nome); return p ? p.id : null; }
  function nomeDi(C, id) { var p = ((vm(C).players || []).filter(function (x) { return x.id === id; }))[0]; return p ? p.nome : null; }
  function carte(w) { return w ? w.document.querySelectorAll(".or-tab .or-carta") : []; }
  // la mappa vista da un telefono: per ogni casella il colore che vede (0, 1, 2, "n", "x") o null
  function chiaveDa(w) { return [].map.call(carte(w), function (b) { var m = / c(\d|n|x)(\s|$)/.exec(" " + b.className + " "); return m ? (/\d/.test(m[1]) ? +m[1] : m[1]) : null; }); }
  function vedeMappa(w) { return [].some.call(carte(w), function (b) { return b.classList.contains("chiave"); }); }
  function cart(w) { var c = w.document.querySelector(".or-cart.su"); return c ? c.textContent : ""; }
  function logTx(w) { var x = w.document.querySelector(".or-log"); return x ? x.textContent : ""; }
  function sottoTx(w) { var x = w.document.querySelector(".or-sotto"); return x ? x.textContent : ""; }
  function ruoloTx(w) { var x = w.document.querySelector(".or-ruolo"); return x ? x.textContent : ""; }
  function bottone(w, re, sel) { return [].filter.call(w.document.querySelectorAll(sel || "button"), function (b) { return re.test(b.textContent) && b.offsetParent && !b.disabled; })[0] || null; }
  function dialogo(w) { var d = w.document.querySelector(".conferma-sfondo"); return d ? d.innerText.replace(/\s+/g, " ") : ""; }
  // i telefoni finti dicono «sì» da soli alle finestre dell'app (il tasto rosso): per scegliere un altro tasto si ferma un attimo
  function fermaSi() { clearInterval(W.__autoConferma); W.__autoConferma = null; W.__siFermo = true; }
  function riprendiSi() {
    if (!W.__siFermo) return;
    W.__siFermo = false;
    W.__autoConferma = setInterval(function () { document.querySelectorAll("iframe").forEach(function (fr) { try { var b = fr.contentWindow.document.querySelector(".conferma-sfondo .btn-rosso:not([disabled])"); if (b) b.click(); } catch (e) {} }); }, 100);
  }
  // una mossa a nome di qualcuno (l'host dal suo tavolo, gli amici dalla loro rete)
  function manda(nome, m) {
    var w = W.finestra(nome), u = w && w.__ORDINE && w.__ORDINE.ui;
    if (u && u.cb && u.cb.sonoHost) { u.cb.manda(m); return; }
    var h = W.reteDi(nome); if (!h) no("non trovo la rete di " + nome); h.invia(m);
  }
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
  async function gira(C, chi, i) {
    var l0 = vm(C).log || [], n0 = l0.length ? l0[l0.length - 1].n : 0;
    manda(chi, { t: "gira", i: i });
    if (!await W.aspetta(function () { var v = vm(C); var l = v.log || []; return l.length && l[l.length - 1].n > n0 && !v.sospeso && v.tab[i].g; }, 9000, 50)) no(chi + " non riesce a girare " + vm(C).tab[i].w);
  }
  function indovinoDi(C, k) { var v = vm(C); return ((v.players || []).filter(function (p) { return p.team === k && p.id !== v.capo[k] && !p.via && !p.bot && !p.gu; })[0] || {}).nome; }
  async function cartelloSuTutti(nomi, re, ms) {
    var visti = {};
    await W.aspetta(function () { nomi.forEach(function (n) { var t = cart(W.finestra(n)); if (re.test(t)) visti[n] = t; }); return nomi.every(function (n) { return visti[n]; }); }, ms || 2500, 40);
    var manca = nomi.filter(function (n) { return !visti[n]; });
    if (manca.length) no("la scritta grande «" + re + "» non arriva a " + manca.join(", ") + " (" + manca.map(function (n) { return n + ": «" + cart(W.finestra(n)) + "»"; }).join(" ") + ")");
    return visti[nomi[0]];
  }
  // la partita di prova: Paky apre (con la spia delle regole di preferiti/ordine.js: imp), gli amici entrano dal link, squadre e
  // capi come chiesto. sq = { nome: squadra }, capi = [nomeRossi, nomeBlu, (nomeVerdi)]
  async function partita(amici, sq, capi, imp) {
    if (!W.__prepPO) await COPIONE.carica("preferiti/ordine.js");
    var P = await W.apriTel("Paky", { x: 0, po: true, prima: function (w) { w.__imp = Object.assign({ oro: false }, imp || {}); } });
    var C = await W.apriStanza(P, "Parola d'ordine");
    for (var i = 0; i < amici.length; i++) {
      await W.apriTel(amici[i], { hash: "gioco=ordine&stanza=" + C, x: 130 * (i + 1) });
      var quanti = i + 2;
      if (!await W.aspetta(function () { return (vm(C).players || []).length >= quanti; }, 8000)) no(amici[i] + " non entra");
    }
    Object.keys(sq).forEach(function (n) { if (n !== "Paky") W.reteDi(n).invia({ t: "squadra", s: sq[n] }); });
    if (!await W.aspetta(function () { return Object.keys(sq).every(function (n) { var p = chiDi(C, n); return p && p.team === sq[n]; }); }, 6000))
      no("le squadre non si sistemano: " + JSON.stringify((vm(C).players || []).map(function (p) { return p.nome + p.team; })));
    capi.forEach(function (n) { if (n !== "Paky") W.reteDi(n).invia({ t: "capo" }); });
    if (!await W.aspetta(function () { var c = vm(C).capo || []; return capi.every(function (n, k) { return c[k] === idDi(C, n); }); }, 5000)) no("i capi non sono " + capi.join(", ") + " (" + JSON.stringify(vm(C).capo) + ")");
    var X = { P: P, C: C, nomi: ["Paky"].concat(amici), capi: capi };
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).tab; }, 10000)) no("non comincia (" + vm(C).fase + ")");
    if (!await W.aspetta(function () { return X.nomi.every(function (n) { return carte(W.finestra(n)).length >= 20; }); }, 6000)) no("non tutti vedono il tabellone");
    await W.dorme(capi.length === 3 ? 3600 : 2800);   // (la presentazione)
    return X;
  }
  // si gioca finché non tocca alla squadra k, all'indizio: il capo di turno dà un indizio e un suo compagno gira una parola di
  // nessuno (dalla mappa del capo), così il turno passa
  async function turnoDi(C, k, usati) {
    for (var giro = 0; giro < 6; giro++) {
      var v = vm(C);
      if (v.turno === k && v.passo === "indizio" && !v.sospeso) return;
      if (v.passo === "indizio") await indizio(C, nomeDi(C, v.capo[v.turno]), 1, usati);
      v = vm(C);
      var t0 = v.turno, capoW = W.finestra(nomeDi(C, v.capo[t0])), ch = chiaveDa(capoW), neutra = -1;
      ch.forEach(function (c, i) { if (neutra < 0 && c === "n" && !v.tab[i].g) neutra = i; });
      if (neutra < 0) no("non trovo una parola di nessuno sulla mappa di " + nomeDi(C, v.capo[t0]));
      await gira(C, indovinoDi(C, t0), neutra);
      await W.aspetta(function () { return vm(C).turno !== t0; }, 6000);
      await W.dorme(1200);
    }
    no("non arriva il turno della squadra " + k + " (turno " + vm(C).turno + ")");
  }
  // com'è la foto trattenuta della stanza (per i messaggi dei NO)
  function statoBreve(C) { var s = W.statoStanza(C) || {}; return JSON.stringify({ t: s.t, r: s._r, g: s._g, h: s._h, fase: s.vm && s.vm.fase, pronta: s.vm && s.vm.pronta }); }
  // la partita ricordata dall'host (t.ricorda, sul suo telefono): H com'è adesso
  function ricordata(nome) { var r = null; try { r = JSON.parse(W.BR.mem[nome || "Paky"].l["sg-ripresa"] || "null"); } catch (e) {} return r && r.stato; }

  // ---------------- o2o1 · il capo che esce apposta ----------------
  COPIONE.aggiungi("o2o1", { nome: "Parola d'ordine: il capo esce apposta (‹ Esci) → «👑 Faccio io il capo» SUBITO ai compagni; se torna guarda il resto della partita", fai: async function () {
    var N = [], usati = [];
    var X = await partita(["Luca", "Ugo", "Giulia", "Sara"], { Paky: 0, Luca: 0, Ugo: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]), C = X.C, P = X.P;
    await turnoDi(C, 0, usati);
    var idL = idDi(C, "Luca"), L = W.finestra("Luca"), U = W.finestra("Ugo"), G = W.finestra("Giulia"), S = W.finestra("Sara");
    // Luca tocca ‹: UNA finestra (quella del gioco, non anche quella dello studio), che gli dice che è il capo
    fermaSi();
    var esci = L.document.querySelector(".st-esci"); if (!esci) no("Luca non ha il tasto ‹");
    esci.click();
    var dl = await W.aspetta(function () { return dialogo(L); }, 2000);
    if (!dl || !/Uscire dalla partita\?/.test(dl)) no("toccando ‹ Luca legge «" + dl + "»");
    if (!/Sei il capo dei Rossi: i compagni ne scelgono subito un altro/.test(dl)) no("la finestra di Luca non dice che è il capo: «" + dl + "»");
    if (L.document.querySelectorAll(".conferma-sfondo").length !== 1) no("toccando ‹ si aprono " + L.document.querySelectorAll(".conferma-sfondo").length + " finestre");
    var bEsci = await W.aspetta(function () { var b = L.document.querySelector(".conferma-sfondo .btn-rosso"); return b && !b.disabled && b; }, 2000);
    if (!bEsci) no("niente «Esci» nella finestra");
    bEsci.click();
    var t0 = Date.now();
    riprendiSi();
    nota(N, "‹ di Luca: «" + dl + "»");
    // subito (non dopo 3 minuti): «👑 Faccio io il capo» ai Rossi rimasti, niente ai Blu
    var ok = await W.aspetta(function () { return bottone(P, /Faccio io il capo/) && bottone(U, /Faccio io il capo/); }, 6000);
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    if (!ok) no("uscito Luca, entro 6 s Paky e Ugo non hanno «👑 Faccio io il capo» (" + JSON.stringify(vm(C).attesa) + ", Ugo: «" + sottoTx(U) + "»)");
    var v = vm(C), pl = chiDi(C, "Luca");
    if (!pl || !pl.via || !pl.esc) no("nella foto Luca non risulta uscito apposta (" + JSON.stringify(pl) + ")");
    if (!v.attesa || !v.attesa.usc || !v.attesa.capo || v.attesa.k !== 0) no("la foto non dice «il capo dei Rossi è uscito» (" + JSON.stringify(v.attesa) + ")");
    if (bottone(G, /Faccio io il capo/) || bottone(S, /Faccio io il capo/)) no("anche i Blu hanno «👑 Faccio io il capo»");
    if (!/Luca, il vostro capo, è uscito dalla partita/.test(sottoTx(U))) no("Ugo legge «" + sottoTx(U) + "»");
    if (!/I Rossi: il capo è uscito/.test(sottoTx(G))) no("Giulia legge «" + sottoTx(G) + "»");
    if (!await W.aspetta(function () { return /Luca, il capo dei Rossi, è uscito dalla partita/.test(logTx(G)); }, 3000)) no("in chat non c'è «🚪 Luca, il capo dei Rossi, è uscito dalla partita»");
    nota(N, "«👑 Faccio io il capo» a Paky e Ugo dopo " + dt + " s; Ugo legge «" + sottoTx(U).slice(0, 70) + "», Giulia «" + sottoTx(G).slice(0, 50) + "»");
    // Ugo fa il capo: vede la mappa (Paky no) e dà l'indizio
    bottone(U, /Faccio io il capo/).click();
    if (!await W.aspetta(function () { return vm(C).capo[0] === idDi(C, "Ugo"); }, 4000)) no("Ugo non diventa il capo (" + JSON.stringify(vm(C).capo) + ")");
    if (!await W.aspetta(function () { return vedeMappa(U); }, 4000)) no("Ugo, capo nuovo, non vede la mappa");
    if (vedeMappa(P)) no("Paky (non capo) vede la mappa");
    var mappa = chiaveDa(U);
    await indizio(C, "Ugo", 2, usati);
    nota(N, "Ugo fa il capo, vede la mappa e dà «" + usati[usati.length - 1] + " 2»");
    // Luca torna dallo stesso link: ha visto la mappa, quindi guarda il resto della partita
    var L2 = await W.apriTel("Luca", { hash: "gioco=ordine&stanza=" + C, x: 130 });
    if (!await W.aspetta(function () { var p = chiDi(C, "Luca"); return p && !p.via && p.gu && p.id === idL; }, 8000)) no("tornato Luca non guarda (" + JSON.stringify(chiDi(C, "Luca")) + ")");
    if (!await W.aspetta(function () { return carte(L2).length >= 20 && /guardi fino alla fine/.test(ruoloTx(L2)); }, 6000)) no("Luca in alto legge «" + ruoloTx(L2) + "»");
    if (!/Hai visto la mappa del capo/.test(sottoTx(L2))) no("Luca in basso legge «" + sottoTx(L2) + "»");
    if (vedeMappa(L2)) no("tornato da semplice giocatore, Luca vede la mappa");
    if (L2.document.querySelector(".or-carta.attiva")) no("Luca può toccare le parole");
    manda("Luca", { t: "proponi", i: mappa.indexOf(0) });
    await W.dorme(900);
    if ((vm(C).prop || {})[idL]) no("l'host ha preso il segno di Luca");
    if (bottone(L2, /Faccio io il capo/)) no("Luca ha «👑 Faccio io il capo»");
    // Paky (che indovina) gira una parola dei Rossi
    var mia = -1; mappa.forEach(function (c, i) { if (mia < 0 && c === 0 && !vm(C).tab[i].g) mia = i; });
    await gira(C, "Paky", mia);
    nota(N, "Luca torna: guarda («" + ruoloTx(L2) + "»), niente mappa né segni; Paky gira " + vm(C).tab[mia].w);
    // la partita dopo: Luca gioca di nuovo come sempre
    manda("Paky", { t: "chiudi" });
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 6000)) no("la partita non si chiude");
    if (chiDi(C, "Luca").gu) no("a fine partita Luca è ancora «guarda»");
    var ui = P.__ORDINE.ui; ui.cb.onNuova();
    if (!await W.aspetta(function () { return vm(C).fase === "lobby"; }, 5000)) no("non si torna in saletta");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("niente «Comincia» per la nuova partita");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).tab; }, 10000)) no("la nuova partita non comincia");
    var pl2 = chiDi(C, "Luca");
    if (!pl2 || pl2.gu || pl2.via) no("nella nuova partita Luca non gioca (" + JSON.stringify(pl2) + ")");
    nota(N, "nuova partita: Luca gioca (squadra " + pl2.team + ")");
    senzaErrori();
    return N.join(" · ");
  } });

  // ---------------- o2o2 · tre squadre: la nuova parola nera, chi arriva tardi, chi guarda, ricarica e vice ----------------
  COPIONE.aggiungi("o2o2", { nome: "Parola d'ordine a 3 squadre in 7: la nuova parola nera, chi arriva tardi, chi guarda (avatar veri), ricarica e vice tra i capi", fai: async function () {
    var N = [], usati = [];
    var X = await partita(["Luca", "Ugo", "Giulia", "Sara", "Bea", "Ciro"], { Paky: 0, Luca: 0, Ugo: 0, Giulia: 1, Sara: 1, Bea: 2, Ciro: 2 }, ["Luca", "Giulia", "Bea"], { squadre: 3 }), C = X.C;
    var capiId = ["Luca", "Giulia", "Bea"].map(function (n) { return idDi(C, n); });
    // i Blu (Giulia capo, Sara) girano la parola nera
    await turnoDi(C, 1, usati);
    await indizio(C, "Giulia", 1, usati);
    var Gw = W.finestra("Giulia"), ch0 = chiaveDa(Gw), iNera = ch0.indexOf("x");
    if (iNera < 0) no("Giulia non vede la parola nera");
    await gira(C, "Sara", iNera);
    if (!await W.aspetta(function () { return vm(C).fuori.indexOf(1) >= 0 && vm(C).fase === "gioco"; }, 4000)) no("girata la nera i Blu non sono fuori (" + vm(C).fase + ")");
    // la nuova nera sulla mappa dei capi (Luca, Bea, e Giulia), mai su quella degli altri né nella foto
    var Lw = W.finestra("Luca"), Bw = W.finestra("Bea");
    var iNuova = await W.aspetta(function () { var c = chiaveDa(Lw), j = -1; c.forEach(function (x, i) { if (x === "x" && i !== iNera) j = i; }); return j >= 0 ? j + 1 : null; }, 5000);
    if (!iNuova) no("sulla mappa di Luca non c'è una nuova parola nera (" + JSON.stringify(chiaveDa(Lw)) + ")");
    iNuova--;
    if (ch0[iNuova] !== "n") no("la nuova nera era una parola " + ch0[iNuova] + " (doveva essere di nessuno)");
    if (vm(C).tab[iNuova].g || vm(C).tab[iNuova].c != null) no("la nuova nera è nella foto (" + JSON.stringify(vm(C).tab[iNuova]) + ")");
    if (!await W.aspetta(function () { return chiaveDa(Bw)[iNuova] === "x" && chiaveDa(Gw)[iNuova] === "x"; }, 4000)) no("Bea o Giulia non vedono la nuova nera");
    ["Paky", "Ugo", "Sara", "Ciro"].forEach(function (n) { if (chiaveDa(W.finestra(n))[iNuova] != null) no(n + " vede la nuova parola nera"); });
    var H0 = ricordata(); if (!H0 || H0.tab[iNuova].c !== "x" || H0.tab[iNuova].oro) no("nella partita ricordata la nuova nera non c'è (" + JSON.stringify(H0 && H0.tab[iNuova]) + ")");
    // la chiave nuova: solo ai capi (i messaggi «chiave» mandati dall'host dopo la nera)
    var chiavi = (X.P.__usciti || []).map(function (s) { try { return JSON.parse(s); } catch (e) { return {}; } }).filter(function (m) { return m.t === "chiave" && m.col && m.col.filter(function (c) { return c === "x"; }).length === 2; });
    if (!chiavi.length) no("l'host non ha mandato la chiave nuova");
    chiavi.forEach(function (m) { if (capiId.indexOf(m.to) < 0) no("la chiave nuova è andata a " + m.to + " (non è un capo)"); });
    var nomi = X.nomi;
    var c1 = await cartelloSuTutti(nomi, /nuova parola nera/, 5000);
    if (!/Attenti: c'è una nuova parola nera!/.test(logTx(W.finestra("Ciro")))) no("in chat non c'è «💣 Attenti: c'è una nuova parola nera!»");
    nota(N, "la nera (" + vm(C).tab[iNera].w + ") → Blu fuori; nuova nera " + vm(C).tab[iNuova].w + " solo sulle mappe dei capi (" + chiavi.length + " chiavi, tutte ai capi); «" + c1 + "» su 7");
    // Sara se ne va: la squadra uscita è la più piccola. Marco arriva: va in un'altra (c14) e gioca subito (c20)
    W.reteDi("Sara").chiudi();
    if (!await W.aspetta(function () { var p = chiDi(C, "Sara"); return p && p.via; }, 4000)) no("Sara non risulta uscita");
    var M = await W.apriTel("Marco", { hash: "gioco=ordine&stanza=" + C, x: 900 }), pm = null, vista = "";
    if (!await W.aspetta(function () { var p = pill(M); if (/Sei dentro! Giochi già da adesso/.test(p)) vista = p; pm = chiDi(C, "Marco"); return pm && vista; }, 10000, 100))
      no("Marco: «" + pill(M) + "», nella foto " + JSON.stringify(pm));
    if (pm.team === 1) no("Marco è finito nei Blu, che sono fuori (c14)");
    if (pm.team !== 2) no("Marco è nella squadra " + pm.team + " (la più piccola tra quelle in gioco è la 2)");
    nota(N, "Marco arriva: Verdi (non i Blu fuori), «" + vista + "»");
    // Dina guarda col link: gli avatar veri di tutti (c11)
    var D = await W.apriTel("Dina", { hash: "gioco=ordine&stanza=" + C + "&guarda=1", x: 1030 });
    var Pom = X.P.__ORDINE.ui.cb.omini();
    var giusti = await W.aspetta(function () {
      var u = D.__ORDINE && D.__ORDINE.ui; if (!u || !u.cb) return false;
      var om = u.cb.omini() || {}, ok = (vm(C).players || []).every(function (p) { return om[p.id] && JSON.stringify(om[p.id]) === JSON.stringify(Pom[p.id]); });
      var imgs = D.document.querySelectorAll(".or-pan .or-f img").length, tutte = D.document.querySelectorAll(".or-pan .or-f").length;
      return ok && tutte && imgs === tutte ? imgs : false;
    }, 8000);
    if (!giusti) {
      var u0 = D.__ORDINE && D.__ORDINE.ui, om0 = u0 && u0.cb ? u0.cb.omini() : {};
      no("Dina (guarda) non ha gli avatar veri: " + Object.keys(om0 || {}).length + " avatar, facce con l'immagine " + D.document.querySelectorAll(".or-pan .or-f img").length + "/" + D.document.querySelectorAll(".or-pan .or-f").length);
    }
    nota(N, "Dina guarda: " + giusti + " faccine con l'avatar vero");
    // le copie per i vice (con la mappa) finora: solo ai capi (c12)
    var risPrima = (X.P.__usciti || []).map(function (s) { try { return JSON.parse(s); } catch (e) { return {}; } }).filter(function (m) { return m.t === "__ris" && m.s; });
    if (!risPrima.length) no("l'host non manda copie ai vice");
    risPrima.forEach(function (m) { (m.vici || []).forEach(function (id) { if (capiId.indexOf(id) < 0) no("una copia della partita (con la mappa) è andata a " + (nomeDi(C, id) || id) + ", che non è un capo"); }); });
    nota(N, risPrima.length + " copie per i vice, tutte ai capi (" + risPrima[risPrima.length - 1].vici.map(function (id) { return nomeDi(C, id); }).join(" e ") + ")");
    // l'host ricarica: le due nere restano, i capi rivedono la nuova
    var t1 = Date.now(), P2 = await W.ricarica("Paky");
    if (!await W.aspetta(function () { var s = W.statoStanza(C) || {}; return s._r && s.vm && s.vm.pronta && (W.BR.storia || []).some(function (x) { return x.ms >= t1 && x.topic.indexOf("/" + C + "/stato") >= 0 && x.da === "Paky"; }); }, 15000))
      no("la partita non riprende dopo la ricarica dell'host (" + statoBreve(C) + "; Paky: «" + T(P2).slice(0, 80) + "»)");
    if (vm(C).fuori.indexOf(1) < 0 || !vm(C).tab[iNera].g || vm(C).tab[iNuova].g) no("dopo la ricarica la partita non è quella di prima");
    if (!await W.aspetta(function () { return chiaveDa(W.finestra("Luca"))[iNuova] === "x" && chiaveDa(W.finestra("Bea"))[iNuova] === "x"; }, 8000)) no("dopo la ricarica i capi non vedono più la nuova nera");
    var H1 = ricordata(); if (!H1 || H1.tab.filter(function (c) { return c.c === "x"; }).length !== 2) no("dopo la ricarica la partita ricordata non ha due nere");
    nota(N, "l'host ricarica: due nere, i capi rivedono la nuova");
    // le copie per i vice dopo la ricarica: rientrati tutti, di nuovo ai capi. (Nei primi secondi il core manda la copia anche
    // a chi è rientrato per primo, se i capi non sono ancora rientrati: t.vici mette prima i capi, ma il core ci aggiunge
    // sempre i primi arrivati. Per chiuderla del tutto servirebbe in core.js un t.vici «solo questi»: lo si conta e basta)
    await W.dorme(2500);
    var ris = (P2.__usciti || []).map(function (s) { try { return JSON.parse(s); } catch (e) { return {}; } }).filter(function (m) { return m.t === "__ris" && m.s; });
    if (!ris.length) no("dopo la ricarica l'host non manda copie ai vice");
    var ult = ris[ris.length - 1];
    (ult.vici || []).forEach(function (id) { if (capiId.indexOf(id) < 0) no("rientrati tutti, la copia della partita va ancora a " + (nomeDi(C, id) || id) + ", che non è un capo"); });
    var fuoriCapi = ris.filter(function (m) { return (m.vici || []).some(function (id) { return capiId.indexOf(id) < 0; }); }).length;
    var vici = ult.vici.map(function (id) { return nomeDi(C, id); });
    nota(N, "dopo la ricarica " + ris.length + " copie, " + fuoriCapi + " nei primi secondi anche a chi è rientrato prima dei capi");
    // l'host sparisce: la partita la prende un capo
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && capiId.indexOf(c.h) >= 0; }, 12000)) no("la partita non la prende un capo (" + JSON.stringify(A.chiTiene(C)) + ")");
    var chi = nomeDi(C, A.chiTiene(C).h);
    if (!await W.aspetta(function () { return chiaveDa(W.finestra("Luca"))[iNuova] === "x"; }, 6000)) no("dopo il cambio Luca non vede la nuova nera");
    nota(N, "vice " + vici.join(" e ") + " (capi); sparito l'host la partita la tiene " + chi);
    senzaErrori();
    return N.join(" · ");
  } });

  // ---------------- o2o3 · l'host che esce: «👑 Lascia la partita a Giulia» ----------------
  COPIONE.aggiungi("o2o3", { nome: "Parola d'ordine: l'host esce → «👑 Lascia la partita a Giulia» (il vice la porta avanti) o «🏁 Chiudi per tutti»", fai: async function () {
    var N = [];
    var X = await partita(["Luca", "Ugo", "Giulia", "Sara"], { Paky: 0, Luca: 0, Ugo: 0, Giulia: 1, Sara: 1 }, ["Paky", "Giulia"]), C = X.C, P = X.P;
    var bid = vm(C).bid, idG = idDi(C, "Giulia");
    fermaSi();
    // ‹ → la scelta: lascia, chiudi, resta. «Resta»: si continua
    P.document.querySelector(".st-esci").click();
    var dl = await W.aspetta(function () { return dialogo(P); }, 2000);
    if (!/Esci dalla partita\?/.test(dl) || !/👑 Lascia la partita a Giulia/.test(dl) || !/🏁 Chiudi per tutti/.test(dl) || !/Resta/.test(dl)) no("l'host legge «" + dl + "»");
    if (!/Sei il capo dei Rossi/.test(dl)) no("la finestra non dice che Paky è il capo: «" + dl + "»");
    if (P.document.querySelectorAll(".conferma-sfondo").length !== 1) no("si aprono due finestre");
    nota(N, "‹ dell'host: «" + dl + "»");
    W.clicca(P, /^Resta$/, ".conferma-sfondo button");
    await W.dorme(600);
    if (dialogo(P) || vm(C).fase !== "gioco" || A.chiTiene(C).h !== "host") no("«Resta» non lascia la partita com'era");
    // ‹ → «👑 Lascia la partita a Giulia»
    P.document.querySelector(".st-esci").click();
    var bL = await W.aspetta(function () { var b = bottone(P, /Lascia la partita a Giulia/, ".conferma-sfondo button"); return b; }, 2500);
    if (!bL) no("niente «👑 Lascia la partita a Giulia»");
    var t0 = Date.now();
    bL.click();
    riprendiSi();
    if (!await W.aspetta(function () { return !P.document.querySelector(".or-carta"); }, 5000)) no("Paky non esce dalla partita");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === idG; }, 15000)) no("la partita non la prende Giulia (" + JSON.stringify(A.chiTiene(C)) + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1), v = vm(C);
    if (v.fase !== "gioco" || v.bid !== bid) no("non è la partita di prima (" + v.fase + ")");
    var pa = await A.pilloleDi(["Luca", "Sara", "Ugo"], /Ora la partita la tiene Giulia/, 4000);
    if (!pa.Luca || !pa.Sara) no("gli amici non leggono «👑 Ora la partita la tiene Giulia» (" + JSON.stringify(pa) + ")");
    var chiuse = ["Luca", "Ugo", "Giulia", "Sara"].filter(function (n) { return /chiusa dall'host|non è più tornato|La stanza è chiusa/.test(T(W.finestra(n))); });
    if (chiuse.length) no("leggono la partita chiusa: " + chiuse.join(", "));
    if (!/Paky lascia la partita a Giulia/.test(logTx(W.finestra("Sara")))) no("in chat non c'è «👋 Paky lascia la partita a Giulia»");
    nota(N, "Giulia tiene la partita dopo " + dt + " s (stesso tabellone), «" + pa.Luca + "»");
    // Paky era il capo dei Rossi ed è uscito apposta: Luca e Ugo lo sostituiscono subito
    var Lw = W.finestra("Luca"), Uw = W.finestra("Ugo");
    if (!await W.aspetta(function () { return bottone(Lw, /Faccio io il capo/) && bottone(Uw, /Faccio io il capo/); }, 6000)) no("i Rossi non hanno «👑 Faccio io il capo» (" + JSON.stringify(vm(C).attesa) + ", «" + sottoTx(Lw) + "»)");
    bottone(Lw, /Faccio io il capo/).click();
    if (!await W.aspetta(function () { return vm(C).capo[0] === idDi(C, "Luca") && vedeMappa(Lw); }, 5000)) no("Luca non diventa il capo con la mappa");
    if (!vedeMappa(W.finestra("Giulia"))) no("Giulia (capo, ora tiene la partita) non vede la mappa");
    nota(N, "Luca fa subito il capo dei Rossi");
    senzaErrori();
    return N.join(" · ");
  } });

  // ---------------- o2o4 · nella Sala ----------------
  function rigaInCorso(w) {
    var n = w && w.document.querySelector(".saletta-schermo .sl-incorso:not(.sl-duello)"); if (!n) return null;
    return { testo: n.innerText.replace(/\s+/g, " ").trim(), tasti: [].map.call(n.querySelectorAll("button"), function (b) { return b.textContent; }), nodo: n };
  }
  COPIONE.aggiungi("o2o4", { nome: "Parola d'ordine nella Sala: «a che punto siamo» nel riquadro, «▶ Entra · giochi subito», l'host che esce legge «si torna nella Sala»", fai: async function () {
    var N = [];
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true });
    var S = await A.apriSalaNuova("Paky"), amici = ["Luca", "Ugo", "Giulia", "Sara"];
    for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], { hash: "sala=" + S, x: 130 * (i + 1), salaSempre: true });
    if (!await W.aspetta(function () { return (vm(S).membri || []).length === 5; }, 10000)) no("nella Sala non entrano in 5");
    var C = await A.lanciaDallaSala("Paky", S, "Parola d'ordine");
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 5; }, 10000)) no("nella saletta del gioco non arrivano in 5");
    var sq = { Luca: 0, Ugo: 0, Giulia: 1, Sara: 1 };
    Object.keys(sq).forEach(function (n) { W.reteDi(n).invia({ t: "squadra", s: sq[n] }); });
    if (!await W.aspetta(function () { return Object.keys(sq).every(function (n) { var p = chiDi(C, n); return p && p.team === sq[n]; }) && chiDi(C, "Paky").team === 0; }, 6000)) no("le squadre non si sistemano");
    W.reteDi("Giulia").invia({ t: "capo" });
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go, button"); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).tab; }, 12000)) no("non comincia");
    await W.dorme(3500);
    // Bea arriva nella Sala: il riquadro dice a che punto è la partita e «▶ Entra · giochi subito»
    var B = await W.apriTel("Bea", { hash: "sala=" + S, x: 700, salaSempre: true });
    var r = await W.aspetta(function () { var x = rigaInCorso(B); return x && /da trovare/.test(x.testo) ? x : null; }, 12000);
    if (!r) no("nel riquadro della Sala di Bea non c'è a che punto è la partita («" + ((rigaInCorso(B) || {}).testo || T(B).slice(0, 100)) + "»)");
    var v = vm(C), atteso = "🔴 " + v.resto[0] + " · 🔵 " + v.resto[1] + " da trovare";
    if (r.testo.indexOf(atteso) < 0) no("il riquadro dice «" + r.testo + "» (atteso «" + atteso + "»)");
    if (r.tasti[0] !== "▶ Entra · giochi subito" || !/Guarda/.test(r.tasti[1] || "")) no("i tasti del riquadro sono " + JSON.stringify(r.tasti));
    if (!/Puoi entrare: giochi subito/.test(T(B))) no("nella Sala di Bea non c'è «✋ Puoi entrare: giochi subito.»");
    nota(N, "riquadro: «" + r.testo + "»");
    // l'host tocca ‹: nella Sala solo «Chiudere la partita per tutti?» (si torna nella Sala), niente «Lascia la partita»
    fermaSi();
    P.document.querySelector(".st-esci").click();
    var dl = await W.aspetta(function () { return dialogo(P); }, 2000);
    if (!/Chiudere la partita per tutti\?/.test(dl) || !/si torna nella Sala/.test(dl) || /Lascia la partita/.test(dl)) no("nella Sala l'host legge «" + dl + "»");
    await W.dorme(800);
    W.clicca(P, /^Resta$/, ".conferma-sfondo button");
    riprendiSi();
    await W.dorme(600);
    if (vm(C).fase !== "gioco") no("«Resta» ha chiuso la partita");
    nota(N, "‹ dell'host nella Sala: «" + dl + "»");
    // Bea entra e gioca subito, nella squadra più piccola
    var bE = r.nodo.querySelector("button"); bE.click();
    if (!await W.aspetta(function () { var p = chiDi(C, "Bea"); return p && !p.via; }, 10000)) no("Bea non entra nella partita");
    var pb = chiDi(C, "Bea");
    if (pb.team !== 1) no("Bea è nella squadra " + pb.team + " (la più piccola è la 1)");
    nota(N, "Bea entra nei Blu");
    senzaErrori();
    return N.join(" · ");
  } });

  // ---------------- o2o5 · la clessidra ferma, il 📶 ----------------
  COPIONE.aggiungi("o2o5", { nome: "Parola d'ordine: ⏸ l'host ferma la clessidra per tutti (anche dopo una ricarica) e la fa ripartire; il 📶 di chi si ricollega", fai: async function () {
    var N = [];
    var X = await partita(["Luca", "Giulia", "Sara"], { Paky: 0, Luca: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"], { tempo: 90, tempoInd: 60 }), C = X.C, P = X.P;
    if (!await W.aspetta(function () { return vm(C).cless && P.document.querySelector(".or-cless.tocca"); }, 8000)) no("l'host non ha la clessidra da toccare (" + JSON.stringify(vm(C).cless) + ")");
    var Lw = W.finestra("Luca");
    if (Lw.document.querySelector(".or-cless.tocca")) no("anche Luca può toccare la clessidra");
    P.document.querySelector(".or-cless.tocca").click();
    if (!await W.aspetta(function () { return vm(C).cless && vm(C).cless.ferma; }, 3000)) no("toccata la clessidra non si ferma");
    var ms0 = vm(C).cless.ms;
    if (!await W.aspetta(function () { return X.nomi.every(function (n) { var c = W.finestra(n).document.querySelector(".or-cless"); return c && /⏸ ferma/.test(c.textContent); }); }, 3000))
      no("non tutti leggono «⏸ ferma» (" + X.nomi.map(function (n) { var c = W.finestra(n).document.querySelector(".or-cless"); return n + ": " + (c ? c.textContent : "-"); }).join(", ") + ")");
    var tx0 = Lw.document.querySelector(".or-cless").textContent;
    await W.dorme(3200);
    var tx1 = Lw.document.querySelector(".or-cless").textContent;
    if (tx1 !== tx0) no("la clessidra ferma scende lo stesso su Luca («" + tx0 + "» → «" + tx1 + "»)");
    if (!/ha fermato la clessidra/.test(logTx(Lw))) no("in chat non c'è «⏸ Paky ha fermato la clessidra»");
    nota(N, "ferma su tutti: «" + tx1 + "» anche dopo 3 s");
    // l'host ricarica: resta ferma, con lo stesso tempo
    var t1 = Date.now(), P2 = await W.ricarica("Paky");
    if (!await W.aspetta(function () { var s = W.statoStanza(C) || {}; return s._r && s.vm && s.vm.pronta && (W.BR.storia || []).some(function (x) { return x.ms >= t1 && x.topic.indexOf("/" + C + "/stato") >= 0 && x.da === "Paky"; }); }, 10000)) no("non riprende");
    await W.dorme(1500);
    var c2 = vm(C).cless;
    if (!c2 || !c2.ferma || Math.abs(c2.ms - ms0) > 1500) no("dopo la ricarica la clessidra non è più ferma com'era (" + JSON.stringify(c2) + ", prima " + ms0 + ")");
    nota(N, "dopo la ricarica ancora ferma (" + Math.round(c2.ms / 1000) + " s)");
    // un altro tocco: riparte da lì
    var b = await W.aspetta(function () { return P2.document.querySelector(".or-cless.tocca"); }, 5000); if (!b) no("dopo la ricarica l'host non ha la clessidra da toccare");
    b.click();
    if (!await W.aspetta(function () { return vm(C).cless && !vm(C).cless.ferma; }, 3000)) no("la clessidra non riparte");
    var ms2 = vm(C).cless.ms; await W.dorme(2500);
    var tx2 = Lw.document.querySelector(".or-cless").textContent;
    if (/ferma/.test(tx2)) no("Luca legge ancora «" + tx2 + "»");
    if (!(ms2 <= ms0 + 1500)) no("ripartita da " + ms2 + " ms (era ferma a " + ms0 + ")");
    nota(N, "ripartita: «" + tx2 + "»");
    // 📶 chi si ricollega: Sara si spegne → 📶 accanto alla sua faccina su tutti; torna → via
    var idS = idDi(C, "Sara");
    W.spegni("Sara");
    if (!await W.aspetta(function () { var p = chiDi(C, "Sara"); return p && p.fs && !p.via; }, 5000)) no("spenta Sara, nella foto niente 📶 (" + JSON.stringify(chiDi(C, "Sara")) + ")");
    if (!await W.aspetta(function () { return Lw.document.querySelector(".or-pan .or-f.forse"); }, 3000)) no("Luca non vede il 📶 accanto a Sara");
    W.riaccendi("Sara");
    if (!await W.aspetta(function () { var p = chiDi(C, "Sara"); return p && !p.fs && !p.via; }, 8000)) no("tornata Sara, il 📶 resta (" + JSON.stringify(chiDi(C, "Sara")) + ")");
    nota(N, "📶 accanto a Sara mentre si ricollega, via quando torna");
    senzaErrori();
    return N.join(" · ");
  } });

  // ---------------- o2o6 · contro il Bot: gli avatar dopo la ricarica (c15) ----------------
  COPIONE.aggiungi("o2o6", { nome: "Parola d'ordine contro il Bot: dopo la ricarica dell'host il Bot tiene il suo avatar; chi aspetta la prossima ha il suo avatar", fai: async function () {
    var N = [];
    if (!W.__prepPO) await COPIONE.carica("preferiti/ordine.js");
    var P = await W.apriTel("Paky", { x: 0, po: true, prima: function (w) { w.__imp = { squadre: "bot", oro: false }; } });
    var C = await W.apriStanza(P, "Parola d'ordine");
    var amici = ["Luca", "Sara"];
    for (var i = 0; i < amici.length; i++) {
      await W.apriTel(amici[i], { hash: "gioco=ordine&stanza=" + C, x: 185 * (i + 1) });
      var q = i + 2; if (!await W.aspetta(function () { return (vm(C).players || []).filter(function (p) { return !p.bot; }).length >= q; }, 8000)) no(amici[i] + " non entra");
    }
    if (!vm(C).vsBot) no("non è «contro il Bot»");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).tab; }, 10000)) no("non comincia");
    await W.dorme(3000);
    var bot = (vm(C).players || []).filter(function (p) { return p.bot; })[0];
    var vero = (P.SG.bot.tutti() || []).filter(function (b) { return b.nome === bot.nome; })[0];
    if (!vero) no("il Bot " + bot.nome + " non è tra i bot fissi");
    var av0 = JSON.stringify(P.__ORDINE.ui.cb.omini()[bot.id]);
    if (av0 !== JSON.stringify(vero.omino)) no("all'inizio il Bot non ha il suo avatar fisso");
    // l'host ricarica a metà partita
    var t1 = Date.now(), P2 = await W.ricarica("Paky");
    if (!await W.aspetta(function () { var s = W.statoStanza(C) || {}; return s._r && s.vm && s.vm.pronta && (W.BR.storia || []).some(function (x) { return x.ms >= t1 && x.topic.indexOf("/" + C + "/stato") >= 0 && x.da === "Paky"; }); }, 10000)) no("non riprende");
    if (!await W.aspetta(function () { var u = P2.__ORDINE && P2.__ORDINE.ui; return u && u.cb && JSON.stringify(u.cb.omini()[bot.id]) === JSON.stringify(vero.omino); }, 6000)) no("dopo la ricarica il Bot non ha più il suo avatar (" + JSON.stringify(P2.__ORDINE.ui.cb.omini()[bot.id]).slice(0, 60) + ")");
    var Lw = W.finestra("Luca");
    if (!await W.aspetta(function () { var u = Lw.__ORDINE.ui; return u && JSON.stringify(u.cb.omini()[bot.id]) === JSON.stringify(vero.omino); }, 6000)) no("Luca non ha l'avatar del Bot dopo la ricarica");
    nota(N, "dopo la ricarica il Bot " + bot.nome + " ha ancora il suo avatar (host e Luca)");
    // fine partita, Marco arriva e aspetta la prossima; l'host ricarica; alla nuova partita Marco ha il suo avatar
    P2.__ORDINE.ui.cb.manda({ t: "chiudi" });
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 6000)) no("la partita non si chiude");
    var M = await W.apriTel("Marco", { hash: "gioco=ordine&stanza=" + C, x: 600 });
    if (!await W.aspetta(function () { return (vm(C).prossimi || []).some(function (p) { return p.nome === "Marco"; }); }, 8000)) no("Marco non aspetta la prossima partita");
    var avM = M.SGNube && M.SGNube.profilo && M.SGNube.profilo() ? M.SGNube.profilo().omino : null;
    var t2 = Date.now(), P3 = await W.ricarica("Paky");
    if (!await W.aspetta(function () { var s = W.statoStanza(C) || {}; return s.vm && s.vm.fase === "fine" && s.vm.pronta && (W.BR.storia || []).some(function (x) { return x.ms >= t2 && x.topic.indexOf("/" + C + "/stato") >= 0 && x.da === "Paky"; }); }, 10000)) no("la fine non riprende");
    await W.dorme(2500);   // (chi c'era rimanda il suo «join»)
    var u3 = await W.aspetta(function () { return P3.__ORDINE && P3.__ORDINE.ui; }, 4000);
    if (!u3) no("dopo la ricarica l'host non è sulla fine");
    u3.cb.onNuova();
    if (!await W.aspetta(function () { return vm(C).fase === "lobby" && chiDi(C, "Marco"); }, 6000)) no("alla nuova partita Marco non è tra i giocatori");
    var idM = idDi(C, "Marco"), om = (vm(C).players || []).filter(function (p) { return p.id === idM; })[0].omino;
    if (!om) no("alla nuova partita Marco non ha l'avatar (nella saletta)");
    if (avM && JSON.stringify(om) !== JSON.stringify(avM)) no("alla nuova partita Marco ha un avatar diverso dal suo");
    nota(N, "Marco, arrivato sulla fine, entra alla nuova partita col suo avatar anche dopo la ricarica dell'host");
    senzaErrori();
    return N.join(" · ");
  } });

  // ---------------- o2o7 · il primo collegamento non riesce: «↻ Riprova» (c19) ----------------
  COPIONE.aggiungi("o2o7", { nome: "Parola d'ordine: chi entra e non riesce a collegarsi legge «↻ Riprova» (e funziona)", fai: async function () {
    var N = [];
    var P = await W.apriTel("Paky", { x: 0 });
    var C = await W.apriStanza(P, "Parola d'ordine");
    W.giuBroker(0, true); W.giuBroker(1, true);
    var L = await W.apriTel("Luca", { hash: "gioco=ordine&stanza=" + C, x: 185 });
    var ok = await W.aspetta(function () { return /Non riesco a entrare nella partita/.test(T(L)) && bottone(L, /Riprova/) && bottone(L, /Torna alla home/); }, 30000, 300);
    if (!ok) no("con la rete giù Luca legge «" + T(L).slice(0, 120) + "»");
    nota(N, "rete giù: «" + (/📶[^.]*\./.exec(T(L)) || [""])[0] + "» con «↻ Riprova» e «🏠 Torna alla home»");
    W.giuBroker(0, false); W.giuBroker(1, false);
    await W.dorme(500);
    bottone(L, /Riprova/).click();
    if (!await W.aspetta(function () { return chiDi(C, "Luca"); }, 15000)) no("«↻ Riprova» non fa entrare Luca («" + T(L).slice(0, 100) + "»)");
    nota(N, "↻ Riprova: Luca entra");
    senzaErrori();
    return N.join(" · ");
  } });

  // per le foto (strumenti fuori dal progetto): gli aiuti di questo file
  COPIONE.o2o = { partita: partita, turnoDi: turnoDi, indizio: indizio, gira: gira, chiaveDa: chiaveDa, vedeMappa: vedeMappa, manda: manda, chiDi: chiDi, idDi: idDi,
    nomeDi: nomeDi, bottone: bottone, dialogo: dialogo, fermaSi: fermaSi, riprendiSi: riprendiSi, sottoTx: sottoTx, ruoloTx: ruoloTx, cart: cart, indovinoDi: indovinoDi, rigaInCorso: rigaInCorso };
})();

// PROVE dei giochi a coppie, giro 2 (g6): Scopa 2 vs 2 e Scopone.
//   «🤫 Messaggio al compagno» (⚙️, solo online tra due compagni veri), «🏅 Il migliore in campo» a fine mano,
//   Scopone «👫 Storico delle coppie» di oggi + «🔁 Rivincita a coppie scambiate», Scopa 2 vs 2 «⏩ Avanti» a maggioranza.
// Uso (da una pagina del sito, dopo copione-prova.js):
//   await COPIONE.carica("migliora2/g6-scopa-coppie.js"); window.__run = COPIONE.prova("g6a")   (poi "g6b" … "g6f")
// Gli scenari col tavolo durano 1-4 minuti: lanciali senza aspettarli e poi leggi COPIONE.esiti (o await window.__run).
//
// g6a il motore (tutti e due i giochi): 300 mani simulate; la 🏅 va sempre a chi dei due compagni ha portato di più (mai a
//     pari), con la frase giusta ("2 scope e il settebello"); conta solo quello che ha preso LUI (non le carte rimaste);
//     🤫 nelle viste: la frase solo a chi l'ha mandato e al compagno, agli altri e a chi guarda (Scopone) solo chi.
// g6b Scopa 2 vs 2 online in 4 (Paky, Giulia, Luca, Marco), ⚙️ «🤫 Sì»: la riga «📜 Si gioca così» e la saletta lo dicono;
//     tasto «🤫 2» su tutti; Luca (compagno di Paky) manda «Ho il settebello»: Paky legge la frase sopra Luca, Giulia e Marco
//     solo «🤫», Luca vede passare «🤫 A Paky: …»; sul broker la frase non va mai a Giulia e Marco; vibrazione solo a Paky;
//     dopo 4 s il fumetto sparisce; 2 a testa («🤫 0» spento, il terzo l'host lo rifiuta); pannellino a 360x640 e 412x915.
//     Fine mano: 🏅 nel riepilogo; «⏩ Avanti»: Giulia tocca → «✅ Avanti» e «1 su 4» (stesso tasto quando cambia il
//     numero), Marco → 2 su 4 non basta, Luca → 3 su 4 si riparte subito; nella mano nuova di nuovo «🤫 2».
//     Marco spegne il telefono > 20 s: gioca un Bot → Giulia non ha più il tasto 🤫.
// g6c Scopa 2 vs 2 contro i Bot: una mano intera; nessun tasto 🤫; riepilogo con 🏅 (o nessuna a pari), «Continua ▶»;
//     misure del riepilogo a 360x640 e 412x915.
// g6d Scopone online (stanza): Paky, Giulia, Luca + Bot, ⚙️ «🤫 Sì» e «Una mano»; Luca (di fronte a Paky) manda un 🤫;
//     Marco arriva e guarda: vede solo «🤫» (mai la frase, nemmeno guardando le carte di Paky); a fine partita 🏅 e
//     «👫 Paky e Luca: 1 vinta, 0 perse» (o persa); l'host ha «🔁 Rivincita a coppie scambiate»: si torna in saletta con le
//     coppie cambiate; con 🔀 si torna a Paky + Luca e la saletta dice il loro storico; Paky ricarica: lo storico c'è ancora
//     (è sul suo telefono, per oggi); misure con 🏅 e storico a 360x640.
// g6e Scopone nella Sala in 4: una mano; a fine partita Paky ha «🔁 Rivincita a coppie scambiate» sopra «↻ Rivincita |
//     🎮 Cambia gioco»: col tocco parte il 3-2-1 e la partita nuova ha i compagni cambiati; gli amici non hanno il tasto.
// g6f Scopone contro i Bot: una mano, riepilogo con 🏅 (o nessuna a pari), nessun tasto 🤫, «🔄 Nuova partita».
// g6g Scopa 2 vs 2 nella Sala in 4: ⚙️ «Una mano» e «🤫 Sì» (lo dice «📜 Si gioca così»), un 🤫 dal compagno, fine partita
//     con 🏅 e la riga della serata in uno schermo per tutti e 4 (360x640 e 412x915).
// g6h Scopone online in 4 a 11 punti: due 🤫 → «🤫 0»; riepilogo della mano con 🏅 e ⏩ in uno schermo per tutti;
//     3 su 4 toccano «⏩ Avanti» → si riparte; nella mano nuova di nuovo «🤫 2».
// Esiti del 16 ott 2026 (giro2-g6): g6a-g6h tutti OK.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;

  // ---- spia del broker: tutto quello che i telefoni pubblicano mentre W.__g6spia è un array ----
  if (!W.__g6cc) {
    var cc = W.__g6cc = W.creaClient;
    W.creaClient = function (n, o) {
      var c = cc(n, o), pub = c.publish;
      c.publish = function (topic, payload) { if (W.__g6spia) W.__g6spia.push({ da: n, topic: topic, pl: String(payload) }); return pub.apply(this, arguments); };
      return c;
    };
  }
  function spiaVibra(w) { w.__vibra = w.__vibra || []; try { w.navigator.vibrate = function (x) { w.__vibra.push(x); return true; }; } catch (e) {} }
  async function tel(nome, o) { return W.apriTel(nome, Object.assign({ prima: spiaVibra }, o || {})); }

  // ---- aiuti comuni ----
  function hostS2(P) { return P.__SCOPA2host && P.__SCOPA2host.st(); }
  function hostSp(P) { return P.__SCOPONEhost && P.__SCOPONEhost.st(); }
  function stato(w) {   // "gioco" | "mano" (riepilogo) | "fine" | "lobby" | "?"
    var d = w.document;
    if (d.querySelector(".sc-mensola")) return "gioco";
    if (d.querySelector(".sp-tab") || d.querySelector(".s2-riga")) return /Fine mano/.test(T(w)) ? "mano" : "fine";
    if (d.querySelector(".saletta-schermo")) return "lobby";
    return "?";
  }
  function toccaAMe(w) { var p = w.document.querySelector(".sc-prese"); return !!w.document.querySelector(".sp-tocca, .s2-tocca") || !!(p && /tocca a te/.test(p.textContent)); }
  async function giocaUna(w) {
    var c = w.document.querySelector(".sc-mano-riga .sc-carta"); if (!c) return false;
    c.click(); await W.dorme(120);
    for (var i = 0; i < 6; i++) {
      if (!w.document.querySelector(".sc-mano-riga .sc-carta.sel")) break;
      var cap = w.document.querySelector(".sc-terra .sc-carta.cap"); if (!cap) break;
      cap.click(); await W.dorme(90);
    }
    return true;
  }
  async function giocaFinche(tels, ferma, ms) {
    var fino = Date.now() + (ms || 120000);
    while (Date.now() < fino) {
      if (ferma()) return true;
      for (var i = 0; i < tels.length; i++) if (stato(tels[i]) === "gioco" && toccaAMe(tels[i])) { await giocaUna(tels[i]); await W.dorme(150); }
      await W.dorme(120);
    }
    return !!ferma();
  }
  function chipDopo(w, etichetta, re) {   // la scelta re nella riga sotto l'etichetta
    var et = [].find.call(w.document.querySelectorAll(".etichetta"), function (x) { return etichetta.test(x.textContent) && x.offsetParent !== null; }); if (!et) no("non trovo «" + etichetta + "»");
    var riga = et.nextElementSibling, b = riga && [].find.call(riga.querySelectorAll(".modo-chip"), function (x) { return re.test(x.textContent); });
    if (!b) no("sotto «" + et.textContent + "» non c'è " + re); b.click();
  }
  function chip(w, re) { var b = [].find.call(w.document.querySelectorAll(".modo-chip"), function (x) { return re.test(x.textContent) && x.offsetParent !== null; }); if (!b) no("non trovo la scelta " + re); b.click(); }
  async function apriStanza(P, nome, prepara) {
    var tess = await W.aspetta(function () { return A.tessera(P, nome); }, 6000); if (!tess) no("non trovo la tessera " + nome);
    tess.click(); await W.dorme(300);
    if (!W.clicca(P, /apro io/)) no("non trovo «Online: apro io la stanza» (" + A.modiVisti(P).join(" / ") + ")");
    await W.dorme(300);
    if (prepara) { prepara(P); await W.dorme(150); }
    if (!W.clicca(P, /Apri la stanza/)) no("non trovo «Apri la stanza»");
    var C = await W.aspetta(function () { return A.codiceSaletta(P); }, 6000); if (!C) no("la stanza non ha il codice");
    return C;
  }
  function errori() { return W.erroriTel().filter(function (e) { return !/\.jpg|favicon/.test(e); }); }
  async function misura(w, nome, larg, alt, fondo) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata,.s2-riga,.s2-psst-pan,.sp-psst-pan{ animation:none !important; opacity:1 !important }"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(900);
    if (d.documentElement.scrollHeight > alt + 1) return larg + "x" + alt + ": la pagina scorre (" + d.documentElement.scrollHeight + " px)";
    if (d.documentElement.scrollWidth > larg + 1) return larg + "x" + alt + ": la pagina scorre di lato";
    var bad = "";
    if (fondo) [].forEach.call(d.querySelectorAll(fondo), function (n) {
      var r = n.getBoundingClientRect(); if (!bad && r.width && (r.bottom > alt + 1 || r.right > larg + 1 || r.left < -1 || r.top < -1)) bad = larg + "x" + alt + ": «" + (n.textContent || "").trim().slice(0, 30) + "» esce dallo schermo";
    });
    return bad;
  }
  // per guardarle a occhio: W.__g6foto = async function (w, cosa) { … } (es. mette il telefono davanti e aspetta una foto)
  async function fotoTel(w, cosa) { if (W.__g6foto) { try { await W.__g6foto(w, cosa); } catch (e) {} } }
  function rimetti(nome) { var f = document.getElementById("tel-" + nome); if (f) { f.style.width = "360px"; f.style.height = "740px"; } }
  function tastoPsst(w) { return w.document.querySelector(".s2-psst:not([hidden]), .sp-psst:not([hidden])"); }
  function fumetti(w) { return [].map.call(w.document.querySelectorAll(".sc-avv .sc-fumetto"), function (f) { return f.textContent; }); }
  async function mandaPsst(w, re) {   // tocca 🤫, poi la frase
    var b = tastoPsst(w); if (!b) no("non c'è il tasto 🤫");
    b.click(); await W.dorme(150);
    var pan = w.document.querySelector(".s2-psst-pan:not([hidden]), .sp-psst-pan:not([hidden])"); if (!pan) no("il pannellino delle frasi non si apre");
    var f = [].find.call(pan.querySelectorAll("button"), function (x) { return re.test(x.textContent); }); if (!f) no("nel pannellino non c'è " + re);
    f.click();
  }

  // ===== g6a: il motore =====
  COPIONE.aggiungi("g6a", { nome: "Coppie: il motore (🏅 il migliore in campo, 🤫 solo al compagno) in Scopa 2 vs 2 e Scopone", fai: async function () {
    var P = await tel("Paky", { x: 0 });
    var S2 = P.__SCOPA2, SP = P.__SCOPONE; if (!S2 || !SP) no("manca il motore (Scopa 2 vs 2 o Scopone)");
    var err = [], medaglie = 0, pari = 0, esempi = {};
    function controlla(E, st, gioco) {
      var mvp = st.ultimoRound.mvp; if (!mvp || mvp.length !== 2) { err.push(gioco + ": niente mvp"); return; }
      [[0, 2], [1, 3]].forEach(function (c, i) {
        var a = E.bravura(st.__preseOra[c[0]], st.scope[c[0]]), b = E.bravura(st.__preseOra[c[1]], st.scope[c[1]]), x = mvp[i];
        if (a.punti === b.punti) { if (x) err.push(gioco + ": medaglia a pari"); pari++; return; }
        var giusto = a.punti > b.punti ? c[0] : c[1];
        if (!x || x.s !== giusto) err.push(gioco + ": medaglia al posto sbagliato");
        else { medaglie++; if (!x.testo) err.push("frase vuota"); esempi[x.testo] = 1; }
      });
    }
    for (var g = 0; g < 150; g++) {
      // Scopa 2 vs 2
      var st = S2.creaStato(11); st.nomi = { 0: "A", 1: "B", 2: "C", 3: "D" }; S2.nuovaMano(st);
      while (st.fase === "gioco") {
        var m = S2.mossaBot(st, st.turno, ["facile", "medio", "difficile"][g % 3]);
        if (!m) { err.push("scopa2: nessuna mossa"); break; }
        var ev = S2.applica(st, st.turno, m.carta, m.presa); if (ev.errore) { err.push("scopa2: mossa rifiutata"); break; }
      }
      if (st.fase !== "fineround" && st.fase !== "fine") { err.push("scopa2: la mano non finisce"); continue; }
      // le prese "sue" = quelle prima delle carte rimaste: le ricostruisco togliendo le carte rimaste a chi ha preso per ultimo
      var re = st.resti; st.__preseOra = st.prese.map(function (p, s) { return re && s === re.seat ? p.filter(function (c) { return !re.carte.some(function (x) { return x.id === c.id; }); }) : p; });
      controlla(S2, st, "scopa2");
      // la vista: mvp[0] = la mia coppia
      var v1 = S2.vistaDa(st, 1), mv = st.ultimoRound.mvp;
      if (mv[1] && (!v1.ultimoRound.mvp[0] || v1.ultimoRound.mvp[0].nome !== st.nomi[mv[1].s])) err.push("scopa2: la vista del posto 1 non ha la sua 🏅");
      // Scopone
      var sp = SP.creaStato(g % 2 ? "classico" : "scientifico", 11, { napola: false, ultima: false }); sp.nomi = { 0: "A", 1: "B", 2: "C", 3: "D" }; sp.omini = {};
      SP.distribuisci(sp);
      while (!SP.maniVuote(sp)) { var m2 = SP.mossaBot(sp, sp.turno, "medio"); var e2 = SP.applica(sp, sp.turno, m2.carta, m2.presa); if (e2.errore) { err.push("scopone: mossa rifiutata"); break; } sp.presa = null; }
      sp.__preseOra = sp.prese.map(function (p) { return p.slice(); });   // (le carte rimaste le aggiunge fineMano)
      SP.fineMano(sp);
      controlla(SP, sp, "scopone");
      for (var io = 0; io < 4; io++) {
        var vu = SP.vistaDa(sp, io).ultimoRound.mvp;
        var atteso = sp.ultimoRound.mvp.filter(Boolean).map(function (x) { return ((x.s - io + 4) % 4) + ":" + x.testo; }).sort().join("|");
        if (vu.map(function (x) { return x.s + ":" + x.testo; }).sort().join("|") !== atteso) { err.push("scopone: 🏅 girata male per il posto " + io); break; }
      }
    }
    // 🤫 nelle viste: la frase solo a chi l'ha mandato (posto 2) e al compagno (posto 0)
    var s2 = S2.creaStato(11); s2.nomi = { 0: "A", 1: "B", 2: "C", 3: "D" }; S2.nuovaMano(s2); s2.psst = { s: 2, k: 0, n: 1 };
    [0, 1, 2, 3].forEach(function (io) { var p = S2.vistaDa(s2, io).psst; if (!p || p.s !== 2) err.push("scopa2: il posto " + io + " non sa chi ha mandato 🤫"); else if ((io % 2 === 0) !== (p.k === 0)) err.push("scopa2: la frase al posto " + io + " " + (p.k === 0 ? "c'è" : "manca")); });
    var s3 = SP.creaStato("scientifico", 11, {}); s3.nomi = { 0: "A", 1: "B", 2: "C", 3: "D" }; s3.omini = {}; SP.distribuisci(s3); s3.psst = { s: 3, k: 4, n: 7 };
    [0, 1, 2, 3].forEach(function (io) { var p = SP.vistaDa(s3, io).psst; if (!p || p.s !== (3 - io + 4) % 4) err.push("scopone: posto " + io + " 🤫 nel posto sbagliato"); else if ((io % 2 === 1) !== (p.k === 4)) err.push("scopone: la frase al posto " + io + " " + (p.k === 4 ? "c'è" : "manca")); });
    if (SP.vistaDa(s3, 1, true).psst.k != null) err.push("scopone: chi guarda legge la frase");
    if (err.length) no(err.slice(0, 4).join(" / ") + " (" + err.length + ")");
    return "300 mani: " + medaglie + " medaglie sempre al compagno che ha portato di più, " + pari + " volte a pari (nessuna medaglia); frasi: " + Object.keys(esempi).slice(0, 4).join(" · ") + "; 🤫 la frase solo a chi l'ha mandata e al compagno (mai a chi guarda)";
  } });

  // ===== g6b: Scopa 2 vs 2 online in 4 =====
  COPIONE.aggiungi("g6b", { nome: "Scopa 2 vs 2 online in 4: 🤫 al compagno, 🏅 nel riepilogo, ⏩ Avanti a maggioranza, chi esce", fai: async function () {
    var P = await tel("Paky", { x: 0 });
    var C = await apriStanza(P, "Scopa 2 vs 2", function (w) { chipDopo(w, /Bravura/, /Facile/); chipDopo(w, /Messaggio al compagno/, /^Sì$/); });
    var G = await tel("Giulia", { hash: "gioco=scopa2v2&stanza=" + C, x: 185 });
    var L = await tel("Luca", { hash: "gioco=scopa2v2&stanza=" + C, x: 370 });
    var M = await tel("Marco", { hash: "gioco=scopa2v2&stanza=" + C, x: 555 });
    if (!await W.aspetta(function () { return (A.vm(C).seggi || []).filter(Boolean).length === 4; }, 12000)) no("in saletta non sono in 4");
    if (!await W.aspetta(function () { return /🤫 messaggi al compagno/.test(T(G)); }, 4000)) no("la saletta di Giulia non dice «🤫 messaggi al compagno»");
    if (!/🤫 messaggi al compagno/.test(A.regoleDi(G) || "")) no("la riga «📜 Si gioca così» non dice «🤫 messaggi al compagno» («" + A.regoleDi(G) + "»)");
    if (!W.clicca(P, /Comincia/, ".sl-go") && !W.clicca(P, /Comincia/)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return hostS2(P) && [P, G, L, M].every(function (x) { return stato(x) === "gioco"; }); }, 10000)) no("non tutti arrivano al tavolo");
    var st = hostS2(P);
    if (st.nomi[1] !== "Giulia" || st.nomi[2] !== "Luca" || st.nomi[3] !== "Marco") no("posti inattesi " + JSON.stringify(st.nomi));
    if (!await W.aspetta(function () { return [P, G, L, M].every(function (x) { var b = tastoPsst(x); return b && b.textContent === "🤫 2"; }); }, 4000)) no("non tutti hanno «🤫 2» vicino alla mano");
    // il pannellino aperto a 360x640 e 412x915
    tastoPsst(G).click(); await W.dorme(200);
    if (!/Solo Marco lo legge · ancora 2/.test(T(G))) no("il pannellino di Giulia non dice «Solo Marco lo legge · ancora 2»");
    var mm = [];
    for (var di = 0; di < 2; di++) {   // (cambiata la misura la stanza si rifà: il pannellino si riapre e si misura)
      var dim = di ? [412, 915] : [360, 640];
      mm.push(await misura(G, "Giulia", dim[0], dim[1], ".sc-mensola"));
      if (G.document.querySelector(".s2-psst-pan[hidden]")) { tastoPsst(G).click(); await W.dorme(200); }
      mm.push(await misura(G, "Giulia", dim[0], dim[1], ".s2-psst-pan button, .s2-psst"));
      if (dim[0] === 360) await fotoTel(G, "g6b-pannello-360");
    }
    rimetti("Giulia"); await W.dorme(600);
    mm = mm.filter(Boolean); if (mm.length) no("pannellino 🤫: " + mm.join(" / "));
    if (G.document.querySelector(".s2-psst-pan[hidden]")) { tastoPsst(G).click(); await W.dorme(200); }
    G.document.querySelector(".s2-psst-x").click(); await W.dorme(150);
    if (G.document.querySelector(".s2-psst-pan:not([hidden])")) no("✕ non chiude il pannellino");
    // Luca → Paky: «Ho il settebello»
    W.__g6spia = []; P.__vibra = []; G.__vibra = []; M.__vibra = [];
    await mandaPsst(L, /Ho il settebello/);
    if (!await W.aspetta(function () { return fumetti(P).some(function (f) { return /Ho il settebello/.test(f); }); }, 3000)) no("Paky non legge «Ho il settebello» sopra Luca (" + fumetti(P).join(",") + ")");
    if (!await W.aspetta(function () { return fumetti(G).indexOf("🤫") >= 0 && fumetti(M).indexOf("🤫") >= 0; }, 3000)) no("Giulia e Marco non vedono «🤫» sopra Luca (" + fumetti(G).join(",") + " / " + fumetti(M).join(",") + ")");
    if (/settebello»?/.test(fumetti(G).concat(fumetti(M)).join(" ")) && /Ho il settebello/.test(T(G) + T(M))) no("Giulia o Marco leggono la frase");
    if (!await W.aspetta(function () { return /🤫 A Paky: «💰 Ho il settebello»/.test(T(L)); }, 3000)) no("Luca non vede passare «🤫 A Paky: …»");
    await fotoTel(P, "g6b-fumetto-del-compagno");
    if (!P.__vibra.length) no("il telefono di Paky non vibra al messaggio del compagno");
    if (G.__vibra.length || M.__vibra.length) no("vibrano anche gli avversari");
    await W.dorme(300);
    var idG = A.vm(C).seggi ? null : null;   // (gli id dal riepilogo dell'host)
    var spia = W.__g6spia.slice(); W.__g6spia = null;
    var conPsst = spia.filter(function (x) { return /"psst":\{/.test(x.pl); });
    if (!conPsst.length) no("la spia del broker non vede i messaggi (forse sono codificati)");
    var posti = P.__SCOPA2host.posti, aGL = conPsst.filter(function (x) { return x.da === "Paky" && (x.pl.indexOf('"to":"' + posti[1] + '"') >= 0 || x.pl.indexOf('"to":"' + posti[3] + '"') >= 0); });
    if (!aGL.length) no("non trovo le foto mandate a Giulia e Marco");
    if (aGL.some(function (x) { return /"k":0/.test(x.pl); })) no("la frase arriva sul telefono di Giulia o Marco");
    var aTutti = spia.filter(function (x) { return x.da === "Paky" && /"psst"/.test(x.pl) && !/"to":/.test(x.pl) && !/"t":"__ris"/.test(x.pl); });
    // (la copia per i vice del Passo 5, __ris, va a tutta la stanza: dentro c'è la regola «psst», mai il messaggio di adesso)
    if (spia.some(function (x) { return x.da === "Paky" && /"t":"__ris"/.test(x.pl) && /"psst":\{/.test(x.pl); })) no("il 🤫 di questo momento è nella copia per i vice (__ris), che passa a tutti");
    if (aTutti.length) no("l'host manda 🤫 a tutti invece che a ognuno la sua foto: " + aTutti[0].pl.slice(0, 160));
    // dopo 4 secondi sparisce
    if (!await W.aspetta(function () { return !fumetti(P).some(function (f) { return /settebello/.test(f); }) && fumetti(G).indexOf("🤫") < 0; }, 6000)) no("dopo 4 secondi il fumetto 🤫 resta");
    // 2 a testa: Luca ne manda un altro → «🤫 0» spento; il terzo (mandato a mano) l'host lo rifiuta
    await mandaPsst(L, /Fidati di me/);
    if (!await W.aspetta(function () { var b = tastoPsst(L); return b && b.textContent === "🤫 0" && b.disabled; }, 3000)) no("dopo 2 messaggi Luca non ha «🤫 0» spento");
    var n0 = hostS2(P).psstN[2];
    W.reteDi("Luca").invia({ t: "psst", k: 3 }); await W.dorme(500);
    if (hostS2(P).psstN[2] !== n0 || (hostS2(P).psst && hostS2(P).psst.k === 3)) no("l'host accetta il terzo messaggio di Luca");
    if (tastoPsst(G).textContent !== "🤫 2") no("i messaggi di Luca hanno tolto quelli di Giulia");
    // fino al riepilogo della mano
    if (!await giocaFinche([P, G, L, M], function () { return [P, G, L, M].every(function (x) { return stato(x) !== "gioco"; }); }, 180000)) no("la mano non finisce");
    if (hostS2(P).fase === "fine") return "(la prima mano ha già chiuso la partita: rifai la prova)";
    if (!await W.aspetta(function () { return [P, G, L, M].every(function (x) { return stato(x) === "mano"; }); }, 6000)) no("non tutti vedono il riepilogo");
    var mvp = hostS2(P).ultimoRound.mvp, conM = mvp.filter(Boolean).length;
    if (conM && !/🏅/.test(T(G))) no("nel riepilogo di Giulia non c'è 🏅");
    if (!conM && /🏅/.test(T(G))) no("a pari c'è una 🏅");
    var riga = (G.document.querySelector(".s2-mvp") || {}).textContent || "";
    await fotoTel(G, "g6b-riepilogo");
    var mR = [await misura(G, "Giulia", 360, 640, ".piede .btn"), await misura(G, "Giulia", 412, 915, ".piede .btn")].filter(Boolean); rimetti("Giulia");
    if (mR.length) no("riepilogo: " + mR.join(" / "));
    // ⏩ Avanti a maggioranza (4 giocano: servono 3)
    var bG = G.document.querySelector(".s2-avanti button"); if (!bG || !/⏩ Avanti/.test(bG.textContent)) no("Giulia non ha «⏩ Avanti» («" + (bG && bG.textContent) + "»)");
    bG.click();
    if (!await W.aspetta(function () { return /1 su 4 vogliono/.test(T(P)) && /✅ Avanti/.test(T(G)); }, 4000)) no("dopo il tocco di Giulia non c'è «✅ Avanti» e «1 su 4»");
    var bG2 = G.document.querySelector(".s2-avanti button");
    await fotoTel(G, "g6b-avanti-toccato");
    M.document.querySelector(".s2-avanti button").click();
    if (!await W.aspetta(function () { return /2 su 4 vogliono/.test(T(G)); }, 4000)) no("Giulia non legge «2 su 4»");
    if (G.document.querySelector(".s2-avanti button") !== bG2) no("il tasto «✅ Avanti» di Giulia è stato rifatto quando è cambiato il numero");
    if (hostS2(P).fase !== "fineround") no("con 2 su 4 si è già ripartiti");
    L.document.querySelector(".s2-avanti button").click();
    if (!await W.aspetta(function () { return hostS2(P).nMano === 2 && stato(P) === "gioco" && stato(G) === "gioco"; }, 5000)) no("con 3 su 4 non si riparte subito");
    if (!await W.aspetta(function () { var b = tastoPsst(L); return b && b.textContent === "🤫 2" && !b.disabled; }, 4000)) no("nella mano nuova Luca non ha di nuovo «🤫 2»");
    // un voto vecchio (della mano 1) non vale nella mano nuova
    W.reteDi("Giulia").invia({ t: "avanti", m: 1, pid: hostS2(P).pid });
    // Marco spegne il telefono: dopo 20 s gioca un Bot → Giulia (sua compagna) non ha più il tasto
    W.spegni("Marco");
    if (!await W.aspetta(function () { return hostS2(P).nomi[3] !== "Marco"; }, 40000)) no("al posto di Marco non gioca un Bot");
    if (!await W.aspetta(function () { return !tastoPsst(G); }, 4000)) no("Giulia ha ancora il tasto 🤫 col compagno Bot");
    if (!tastoPsst(P)) no("Paky ha perso il tasto 🤫 (il suo compagno è ancora Luca)");
    var e = errori(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "🤫: Paky legge la frase sopra Luca, Giulia e Marco solo 🤫 (mai la frase sul broker), vibra solo Paky, sparisce dopo 4 s, 2 a testa (il terzo rifiutato); 🏅 «" + riga.replace(/\s+/g, " ").trim() + "»; ⏩ 1 e 2 su 4 aspettano (stesso tasto «✅ Avanti»), 3 su 4 si riparte; Marco → Bot: Giulia senza 🤫";
  } });

  // ===== g6c: Scopa 2 vs 2 contro i Bot =====
  COPIONE.aggiungi("g6c", { nome: "Scopa 2 vs 2 contro i Bot: una mano, niente 🤫, 🏅 nel riepilogo, misure", fai: async function () {
    var P = await tel("Paky", { x: 0 });
    var tess = await W.aspetta(function () { return A.tessera(P, "Scopa 2 vs 2"); }, 6000); if (!tess) no("non trovo la tessera Scopa 2 vs 2");
    tess.click(); await W.dorme(400);
    if (A.modiVisti(P).length) { if (!W.clicca(P, /Contro i Bot/, ".modo-grande")) no("non c'è «Contro i Bot»"); await W.dorme(400); }
    if (/Messaggio al compagno/.test(T(P))) no("contro i Bot c'è la scelta «🤫 Messaggio al compagno»");
    chipDopo(P, /Bravura/, /Facile/);
    if (!W.clicca(P, /Comincia|Gioca/)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return stato(P) === "gioco"; }, 6000)) no("non si arriva al tavolo");
    if (tastoPsst(P)) no("contro i Bot c'è il tasto 🤫");
    if (!await giocaFinche([P], function () { return stato(P) === "mano" || stato(P) === "fine"; }, 150000)) no("la mano non finisce («" + T(P).slice(0, 80) + "»)");
    await W.dorme(2500);
    var t = T(P), riga = (P.document.querySelector(".s2-mvp") || {}).textContent || "";
    if (!/🏅/.test(t)) return "(nessuna 🏅: a pari in tutte e due le coppie — capita di rado, rifai) " + t.slice(0, 80);
    if (/Tu:/.test(riga) && !P.__vibra.some(function (x) { return x === 30; })) no("la 🏅 è mia ma il telefono non vibra");
    var m = [await misura(P, "Paky", 360, 640, ".piede .btn, .s2-mvp"), await misura(P, "Paky", 412, 915, ".piede .btn")].filter(Boolean); rimetti("Paky");
    if (m.length) no("riepilogo: " + m.join(" / "));
    if (stato(P) === "mano" && !W.clicca(P, /Continua/)) no("non c'è «Continua ▶»");
    var e = errori(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "contro i Bot: niente 🤫; riepilogo «" + riga.replace(/\s+/g, " ").trim() + "»; misure ok";
  } });

  // ===== g6d: Scopone online (stanza) =====
  COPIONE.aggiungi("g6d", { nome: "Scopone online: 🤫 (chi guarda vede solo 🤫), 🏅, 👫 storico di oggi, 🔁 Rivincita a coppie scambiate", fai: async function () {
    var P = await tel("Paky", { x: 0 });
    try { P.localStorage.removeItem("sg-scopone-coppie"); } catch (e) {}
    var C = await apriStanza(P, "Scopone", function (w) { chip(w, /^Una mano$/); chipDopo(w, /Messaggio al compagno/, /^Sì$/); });
    var G = await tel("Giulia", { hash: "gioco=scopone&stanza=" + C, x: 185 });
    var L = await tel("Luca", { hash: "gioco=scopone&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (A.vm(C).seggi || []).filter(Boolean).length === 3; }, 10000)) no("in saletta non sono in 3");
    if (!/🤫 messaggi al compagno/.test(A.regoleDi(G) || "")) no("«📜 Si gioca così» non dice «🤫 messaggi al compagno» («" + A.regoleDi(G) + "»)");
    if (!W.clicca(P, /Comincia/, ".sl-go") && !W.clicca(P, /Comincia/)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return hostSp(P) && [P, G, L].every(function (x) { return stato(x) === "gioco"; }); }, 10000)) no("non tutti al tavolo");
    var st = hostSp(P);
    if (st.nomi[2] !== "Luca") no("Luca non è di fronte a Paky (" + JSON.stringify(st.nomi) + ")");
    if (!tastoPsst(P) || !tastoPsst(L)) no("Paky o Luca non hanno il tasto 🤫");
    if (tastoPsst(G)) no("Giulia (compagna di un Bot) ha il tasto 🤫");
    var M = await tel("Marco", { hash: "gioco=scopone&stanza=" + C, x: 555 });
    if (!await W.aspetta(function () { return /Guardi le carte di/.test(T(M)); }, 10000)) no("Marco non guarda la partita");
    if (tastoPsst(M)) no("Marco (che guarda) ha il tasto 🤫");
    P.__vibra = [];
    await mandaPsst(P, /Lascia, ci penso io/);
    if (!await W.aspetta(function () { return fumetti(L).some(function (f) { return /Lascia, ci penso io/.test(f); }); }, 3000)) no("Luca non legge «Lascia, ci penso io» sopra Paky (" + fumetti(L).join(",") + ")");
    if (!await W.aspetta(function () { return fumetti(G).indexOf("🤫") >= 0; }, 3000)) no("Giulia non vede «🤫» sopra Paky (" + fumetti(G).join(",") + ")");
    if (/ci penso io/.test(T(G))) no("Giulia legge la frase");
    if (!await W.aspetta(function () { return /🤫 A Luca: «✋ Lascia, ci penso io»/.test(T(P)); }, 3000)) no("Paky non vede passare «🤫 A Luca: …»");
    // Marco guarda le carte di un altro: sempre solo 🤫, mai la frase
    var visti = []; for (var k = 0; k < 4; k++) { visti = visti.concat(fumetti(M)); if (/ci penso io/.test(T(M))) no("Marco (che guarda) legge la frase"); M.document.querySelector(".sc-prese").click(); await W.dorme(200); }
    if (visti.indexOf("🤫") < 0) no("Marco non vede mai «🤫» (" + visti.join(",") + ")");
    // (i tocchi per scegliere vibrano piano, 10: va bene; la vibrazione del messaggio arrivato è 25 e va solo al compagno)
    if (P.__vibra.some(function (x) { return x !== 10; })) no("vibra chi manda il messaggio (" + JSON.stringify(P.__vibra) + ")");
    if (!await giocaFinche([P, G, L], function () { return [P, G, L].every(function (x) { return stato(x) === "fine"; }); }, 180000)) no("la mano non finisce per tutti");
    st = hostSp(P);
    var vinto = st.punti.noi > st.punti.loro, pari = st.punti.noi === st.punti.loro;
    var atteso = pari ? /Paky e Luca: 0 vinte, 0 perse/ : vinto ? /Paky e Luca: 1 vinta, 0 perse/ : /Paky e Luca: 0 vinte, 1 persa/;
    if (!await W.aspetta(function () { return atteso.test(T(P)) && atteso.test(T(L)); }, 4000)) no("a fine partita non c'è «👫 " + atteso.source + "» («" + ((P.document.querySelector(".sp-storico") || {}).textContent) + "»)");
    if (!/👫/.test(T(M))) no("chi guarda non vede lo storico");
    var mvpN = st.ultimoRound.mvp.filter(Boolean).length;
    if (mvpN && !(/🏅/.test(T(G)) && /🏅/.test(T(M)))) no("nel riepilogo finale di Giulia o Marco non c'è 🏅");
    var mF = [await misura(G, "Giulia", 360, 640, ".fine-tasti button, .piede .btn"), await misura(P, "Paky", 360, 640, ".fine-tasti button, .piede .btn"), await misura(P, "Paky", 412, 915, ".fine-tasti button, .piede .btn")].filter(Boolean); rimetti("Giulia"); rimetti("Paky");
    if (mF.length) no("fine partita: " + mF.join(" / "));
    var sc = [].find.call(P.document.querySelectorAll(".piede button"), function (b) { return /coppie scambiate/.test(b.textContent); });
    if (!sc) no("Paky non ha «🔁 Rivincita a coppie scambiate»");
    if (/coppie scambiate/.test(T(G))) no("Giulia ha «🔁 Rivincita a coppie scambiate»");
    var mem = JSON.parse(P.localStorage.getItem("sg-scopone-coppie") || "null");
    if (!mem || !mem.c || !mem.c["Luca|Paky"]) no("lo storico non è sul telefono di Paky (" + JSON.stringify(mem).slice(0, 80) + ")");
    sc.click();
    if (!await W.aspetta(function () { return stato(P) === "lobby" && stato(G) === "lobby"; }, 8000)) no("dopo «🔁» non si torna in saletta");
    var seg = (A.vm(C).seggi || []).map(function (x) { return x ? x.nome : "Bot"; });
    if (seg[2] === "Luca") no("dopo «🔁 a coppie scambiate» Luca è ancora il compagno di Paky (" + seg.join(",") + ")");
    // con 🔀 si torna a Paky + Luca: la saletta dice il loro storico
    for (var r = 0; r < 3 && !/🟢 tu \+ Luca/.test(T(P)); r++) { W.clicca(P, /Cambia compagno/); await W.dorme(400); }
    if (!/🟢 tu \+ Luca/.test(T(P))) no("con 🔀 non si torna a Paky + Luca");
    if (!await W.aspetta(function () { return atteso.test(T(G)); }, 4000)) no("in saletta Giulia non legge lo storico di Paky e Luca («" + T(G).slice(0, 200) + "»)");
    // Paky ricarica: lo storico di oggi resta
    var P2 = await W.ricarica("Paky");
    if (!await W.aspetta(function () { return A.codiceSaletta(P2) === C && (A.vm(C).seggi || []).filter(Boolean).length >= 3; }, 20000)) no("dopo la ricarica Paky non riapre la saletta " + C);
    for (r = 0; r < 3 && !/🟢 tu \+ Luca/.test(T(P2)); r++) { W.clicca(P2, /Cambia compagno/); await W.dorme(400); }
    if (!await W.aspetta(function () { return atteso.test(T(P2)); }, 4000)) no("dopo la ricarica lo storico di Paky e Luca non c'è più («" + T(P2).slice(0, 200) + "»)");
    var mL = await misura(P2, "Paky", 360, 640, ".sl-go, .piede .btn"); rimetti("Paky");
    if (mL) no("saletta con lo storico: " + mL);
    var e = errori(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "🤫 Paky → Luca (Giulia e Marco che guarda: solo 🤫); fine: " + (mvpN ? "🏅 e " : "") + "«👫 " + ((P.document.querySelector(".sp-storico") || {}).textContent || atteso.source) + "»; 🔁 → coppie cambiate; 🔀 di nuovo Paky + Luca col loro storico; dopo la ricarica lo storico resta";
  } });

  // ===== g6e: Scopone nella Sala, 🔁 Rivincita a coppie scambiate col 3-2-1 =====
  COPIONE.aggiungi("g6e", { nome: "Scopone nella Sala in 4: «🔁 Rivincita a coppie scambiate» col 3-2-1 del core", fai: async function () {
    var w = { Paky: await tel("Paky", { x: 0, salaSempre: true }) };
    var S = await A.apriSalaNuova("Paky"), amici = ["Giulia", "Luca", "Marco"];
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await tel(amici[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true });
    if (!await W.aspetta(function () { return ((A.vm(S).membri) || []).length === 4; }, 10000)) no("nella Sala non sono in 4");
    var P = w.Paky, G = w.Giulia, tutti = [P, G, w.Luca, w.Marco];
    var dove = await A.toccaGiocoSala(P, "Scopone");
    if (dove.dove === "chi") W.clicca(P, /Si gioca/, ".piede button");
    var C = await W.aspetta(function () { var c = A.codiceSaletta(P); return P.document.querySelector(".saletta-schermo") && c && c !== S ? c : null; }, 6000);
    if (!C) no("Paky non arriva nella saletta dello Scopone");
    if (!await W.aspetta(function () { return (A.vm(C).seggi || []).filter(Boolean).length === 4; }, 10000)) no("nella saletta non sono in 4");
    var b = P.document.querySelector("button.sl-regole"); if (!b) no("non c'è ⚙️"); b.click();
    var f = await W.aspetta(function () { return P.document.querySelector(".sl-foglio"); }, 2000); if (!f) no("il ⚙️ non si apre");
    chip(P, /^Una mano$/); await W.dorme(100); W.clicca(P, /Fatto/); await W.dorme(300);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return hostSp(P) && tutti.every(function (x) { return stato(x) === "gioco"; }); }, 12000)) no("non tutti al tavolo");
    var prima = hostSp(P).nomi[2];
    if (!await giocaFinche(tutti, function () { return tutti.every(function (x) { return stato(x) === "fine"; }); }, 180000)) no("la mano non finisce");
    if (!await W.aspetta(function () { return A.tastiFineDi(P); }, 5000)) no("mancano i tasti del core");
    var tP = A.tastiFineDi(P).join(" | ");
    if (tP !== "↻ Rivincita | 🎮 Cambia gioco") no("Paky ha «" + tP + "»");
    if (/coppie scambiate/.test(T(G))) no("Giulia ha il tasto «🔁 … coppie scambiate»");
    var sc = [].find.call(P.document.querySelectorAll(".piede button"), function (x) { return /coppie scambiate/.test(x.textContent); });
    if (!sc) no("Paky non ha «🔁 Rivincita a coppie scambiate»");
    var m = await misura(P, "Paky", 360, 640, ".fine-tasti button, .sp-scambia"); rimetti("Paky");
    if (m) no("fine partita con 🔁: " + m);
    // anche gli amici (titolo su due righe, 🏅, 👫 e la riga della serata): tutto in uno schermo
    var mA = [];
    for (var j = 0; j < amici.length; j++) { mA.push(await misura(w[amici[j]], amici[j], 360, 640, ".fine-tasti button")); mA.push(await misura(w[amici[j]], amici[j], 412, 915, ".fine-tasti button")); rimetti(amici[j]); }
    mA = mA.filter(Boolean); if (mA.length) no("fine partita degli amici: " + mA.join(" / "));
    var vP = A.spiaVia(P);
    sc.click();
    var ok = await W.aspetta(function () { var s = hostSp(P); return s && s.fase === "gioco" && tutti.every(function (x) { return stato(x) === "gioco"; }); }, 15000);
    var via = vP.stop();
    if (!ok) no("dopo «🔁» la partita non riparte per tutti («" + T(G).slice(0, 80) + "»)");
    if (!via) no("il 3-2-1 non si è visto");
    var dopo = hostSp(P).nomi[2];
    if (dopo === prima) no("il compagno di Paky è sempre " + prima);
    var e = errori(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Sala in 4: fine con «↻ Rivincita | 🎮 Cambia gioco» + «🔁 Rivincita a coppie scambiate» (solo Paky); tocco → 3-2-1 e partita nuova: il compagno di Paky passa da " + prima + " a " + dopo;
  } });

  // ===== g6f: Scopone contro i Bot =====
  COPIONE.aggiungi("g6f", { nome: "Scopone contro i Bot: una mano, 🏅 nel riepilogo, niente 🤫", fai: async function () {
    var P = await tel("Paky", { x: 0 });
    try { P.localStorage.removeItem("sg-scopone-partita"); } catch (e) {}
    var tess = await W.aspetta(function () { return A.tessera(P, "Scopone"); }, 6000); if (!tess) no("non trovo la tessera Scopone");
    tess.click(); await W.dorme(400);
    if (A.modiVisti(P).length) { if (!W.clicca(P, /Contro i Bot/, ".modo-grande")) no("non c'è «Contro i Bot»"); await W.dorme(400); }
    if (/Messaggio al compagno/.test(T(P))) no("contro i Bot c'è la scelta «🤫»");
    chip(P, /^Una mano$/);
    if (!W.clicca(P, /Comincia|Gioca/)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return stato(P) === "gioco"; }, 6000)) no("non si arriva al tavolo");
    if (tastoPsst(P)) no("contro i Bot c'è il tasto 🤫");
    if (!await giocaFinche([P], function () { return stato(P) === "fine"; }, 150000)) no("la mano non finisce");
    var riga = (P.document.querySelector(".sp-mvp") || {}).textContent || "";
    var m = [await misura(P, "Paky", 360, 640, ".piede .btn, .sp-mvp"), await misura(P, "Paky", 412, 915, ".piede .btn")].filter(Boolean); rimetti("Paky");
    if (m.length) no("riepilogo: " + m.join(" / "));
    if (/coppie scambiate|👫/.test(T(P))) no("contro i Bot ci sono lo storico o «🔁»");
    if (!W.clicca(P, /Nuova partita/)) no("non c'è «🔄 Nuova partita»");
    var e = errori(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return riga ? "contro i Bot: «" + riga.replace(/\s+/g, " ").trim() + "», niente 🤫, misure ok" : "(nessuna 🏅: a pari in tutte e due le coppie) niente 🤫, misure ok";
  } });

  // ===== g6g: Scopa 2 vs 2 nella Sala in 4 =====
  COPIONE.aggiungi("g6g", { nome: "Scopa 2 vs 2 nella Sala in 4: ⚙️ «🤫 Sì», un messaggio, fine partita con 🏅 in uno schermo per tutti", fai: async function () {
    var w = { Paky: await tel("Paky", { x: 0, salaSempre: true }) };
    var S = await A.apriSalaNuova("Paky"), amici = ["Giulia", "Luca", "Marco"];
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await tel(amici[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true });
    if (!await W.aspetta(function () { return ((A.vm(S).membri) || []).length === 4; }, 10000)) no("nella Sala non sono in 4");
    var P = w.Paky, tutti = [P, w.Giulia, w.Luca, w.Marco];
    var dove = await A.toccaGiocoSala(P, "Scopa 2 vs 2");
    if (dove.dove === "chi") W.clicca(P, /Si gioca/, ".piede button");
    var C = await W.aspetta(function () { var c = A.codiceSaletta(P); return P.document.querySelector(".saletta-schermo") && c && c !== S ? c : null; }, 6000);
    if (!C) no("Paky non arriva nella saletta della Scopa 2 vs 2");
    if (!await W.aspetta(function () { return (A.vm(C).seggi || []).filter(Boolean).length === 4; }, 10000)) no("nella saletta non sono in 4");
    var b = P.document.querySelector("button.sl-regole"); if (!b) no("non c'è ⚙️"); b.click();
    if (!await W.aspetta(function () { return P.document.querySelector(".sl-foglio"); }, 2000)) no("il ⚙️ non si apre");
    chip(P, /^Una mano$/); await W.dorme(100);
    chipDopo(P, /Messaggio al compagno/, /^Sì$/); await W.dorme(100);
    W.clicca(P, /Fatto/); await W.dorme(400);
    if (!await W.aspetta(function () { return /🤫 messaggi al compagno/.test(A.regoleDi(w.Giulia) || ""); }, 5000)) no("«📜 Si gioca così» di Giulia non dice «🤫 messaggi al compagno» («" + A.regoleDi(w.Giulia) + "»)");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return hostS2(P) && tutti.every(function (x) { return stato(x) === "gioco"; }); }, 12000)) no("non tutti al tavolo");
    if (!tutti.every(function (x) { return tastoPsst(x); })) no("non tutti hanno il tasto 🤫");
    var st = hostS2(P), comp = st.nomi[2], cw = w[comp];
    await mandaPsst(cw, /Ho un 7/);
    if (!await W.aspetta(function () { return fumetti(P).some(function (f) { return /Ho un 7/.test(f); }); }, 3000)) no("Paky non legge «Ho un 7» sopra " + comp);
    if (!await giocaFinche(tutti, function () { return tutti.every(function (x) { return stato(x) === "fine"; }); }, 180000)) no("la partita non finisce per tutti");
    if (!await W.aspetta(function () { return A.tastiFineDi(P); }, 5000)) no("mancano i tasti del core");
    var mvpN = hostS2(P).ultimoRound.mvp.filter(Boolean).length;
    if (mvpN && !tutti.every(function (x) { return /🏅/.test(T(x)); })) no("non tutti vedono la 🏅");
    await W.dorme(1600);
    var nomi = ["Paky"].concat(amici), mm = [];
    for (var j = 0; j < 4; j++) { mm.push(await misura(w[nomi[j]], nomi[j], 360, 640, ".fine-tasti button")); mm.push(await misura(w[nomi[j]], nomi[j], 412, 915, ".fine-tasti button")); rimetti(nomi[j]); }
    mm = mm.filter(Boolean); if (mm.length) no("fine partita: " + mm.join(" / "));
    var e = errori(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Sala: ⚙️ 🤫 Sì (lo dice «Si gioca così»), " + comp + " → Paky «Ho un 7»; fine con " + (mvpN ? "🏅 «" + ((P.document.querySelector(".s2-mvp") || {}).textContent || "").trim() + "»" : "nessuna 🏅") + " in uno schermo per tutti e 4 (360x640 e 412x915)";
  } });

  // ===== g6h: Scopone online a 11 punti: il riepilogo della mano =====
  COPIONE.aggiungi("g6h", { nome: "Scopone online in 4 a 11: riepilogo della mano con 🏅 e ⏩ in uno schermo, 🤫 di nuovo 2 nella mano nuova", fai: async function () {
    var P = await tel("Paky", { x: 0 });
    var C = await apriStanza(P, "Scopone", function (w) { chipDopo(w, /Messaggio al compagno/, /^Sì$/); });
    var G = await tel("Giulia", { hash: "gioco=scopone&stanza=" + C, x: 185 });
    var L = await tel("Luca", { hash: "gioco=scopone&stanza=" + C, x: 370 });
    var M = await tel("Marco", { hash: "gioco=scopone&stanza=" + C, x: 555 });
    var tutti = [P, G, L, M], nomi = ["Paky", "Giulia", "Luca", "Marco"], w = { Paky: P, Giulia: G, Luca: L, Marco: M };
    if (!await W.aspetta(function () { return (A.vm(C).seggi || []).filter(Boolean).length === 4; }, 10000)) no("in saletta non sono in 4");
    if (!W.clicca(P, /Comincia/, ".sl-go") && !W.clicca(P, /Comincia/)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return hostSp(P) && tutti.every(function (x) { return stato(x) === "gioco"; }); }, 10000)) no("non tutti al tavolo");
    var st = hostSp(P), cw = w[st.nomi[1]];
    await mandaPsst(cw, /Non ho 7/); await W.dorme(400);
    await mandaPsst(cw, /Fidati di me/);
    if (!await W.aspetta(function () { var b = tastoPsst(cw); return b && b.disabled && b.textContent === "🤫 0"; }, 3000)) no(st.nomi[1] + " non ha «🤫 0» dopo 2 messaggi");
    if (!await giocaFinche(tutti, function () { return tutti.every(function (x) { return stato(x) !== "gioco"; }); }, 180000)) no("la mano non finisce");
    if (hostSp(P).fase === "fine") return "(la prima mano ha già chiuso la partita: rifai)";
    if (!await W.aspetta(function () { return tutti.every(function (x) { return stato(x) === "mano"; }); }, 6000)) no("non tutti vedono il riepilogo della mano");
    var mvpN = hostSp(P).ultimoRound.mvp.filter(Boolean).length;
    if (mvpN && !tutti.every(function (x) { return /🏅/.test(T(x)); })) no("non tutti vedono la 🏅 nel riepilogo");
    var mm = [];
    for (var j = 0; j < 4; j++) { mm.push(await misura(w[nomi[j]], nomi[j], 360, 640, ".sp-avanti .btn, .sl-faccine")); mm.push(await misura(w[nomi[j]], nomi[j], 412, 915, ".sp-avanti .btn")); rimetti(nomi[j]); }
    mm = mm.filter(Boolean); if (mm.length) no("riepilogo della mano: " + mm.join(" / "));
    [G, L, M].forEach(function (x) { var bb = x.document.querySelector(".sp-avanti .btn"); if (bb) bb.click(); });
    if (!await W.aspetta(function () { return hostSp(P).manoN === 2 && stato(P) === "gioco"; }, 6000)) no("con 3 su 4 non si riparte");
    if (!await W.aspetta(function () { var b = tastoPsst(cw); return b && !b.disabled && b.textContent === "🤫 2"; }, 4000)) no("nella mano nuova " + st.nomi[1] + " non ha di nuovo «🤫 2»");
    var e = errori(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "riepilogo della mano con " + (mvpN ? "🏅" : "nessuna 🏅") + " e ⏩ in uno schermo per tutti; 3 su 4 → si riparte; 🤫 di nuovo 2";
  } });
})();

// PROVE DEL PASSO 6, pezzo p6-m: il MODELLO dei giochi nuovi (.agents/skills/nuovo-gioco/modello-gioco-online.js) con chi
// guarda e chi arriva a metà. Come passo2/modello.js il modello si registra al posto di "garapesca" (opz.comeGioco).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("passo6/modello.js"); await COPIONE.prova("6m1")
//
// 6m1 (RITARDATARI "partita", come nel modello): Sala con Paky, Giulia e Luca → «Il più veloce», partita cominciata.
//   Bea apre il link della stanza con &guarda=1: niente nome, niente join (solo «__guardo»), targhetta «👀 Guardi», niente
//   faccine né «🏠 Esci» del gioco, posto in basso per la targhetta (360x640 e 412x915), il suo tocco non conta.
//   Marco arriva nella Sala a metà: riquadro «🎮 Si gioca a… · Giro N di 5» (t.aCheSiamo) con «👀 Guarda» e «entri alla
//   prossima partita»; Guarda → targhetta, niente join. Partita intera; alla fine «l'hai guardata», niente «🏠 Esci».
//   «↻ Rivincita» → Bea e Marco entrano da soli e giocano la seconda partita fino in fondo.
// 6m2 (il modello con RITARDATARI "turno"): Marco arriva nella Sala a metà → «▶ Entra · giochi dal prossimo turno»; Entra →
//   aspetta in «prossimi» («✋ Entri al prossimo giro», «🎉 Sei dentro!»), NON gioca il giro in corso, entra al giro dopo
//   con 0 punti, prende un punto, ed è nella classifica finale.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T, vm = A.vm, ids = A.ids;
  var COME = "garapesca";

  // i telefoni con opz.comeGioco non registrano quel gioco vero (il modello prende il suo posto). Uguale a passo2/modello.js
  if (!W.__pfModello) {
    var pf = W.__pfModello = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      pf.apply(this, arguments);
      if (!opz || !opz.comeGioco) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) { if (g && g.id === opz.comeGioco && !g.__modello) return; return reg.apply(v, arguments); };
      } });
    };
  }
  async function testoModello(rit) {
    var src = await (await fetch("/.agents/skills/nuovo-gioco/modello-gioco-online.js?" + Date.now())).text();
    src = src.replace('var ID = "modello";', 'var ID = "' + COME + '";').replace("SG.registra({", "SG.registra({ __modello: true,");
    if (rit) src = src.replace('var RITARDATARI = "partita";', 'var RITARDATARI = "' + rit + '";');
    if (src.indexOf("__modello") < 0 || src.indexOf('"' + COME + '"') < 0 || (rit && src.indexOf('var RITARDATARI = "' + rit + '"') < 0)) no("non riesco a preparare il modello per la prova");
    return src;
  }
  function opzModello(src, extra) { return Object.assign({ salaSempre: true, comeGioco: COME, prima: function (w) { w.eval(src); } }, extra || {}); }
  async function salaModello(src, amici) {
    var w = { Paky: await W.apriTel("Paky", opzModello(src, { x: 0 })) };
    var S = await A.apriSalaNuova("Paky");
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], opzModello(src, { hash: "sala=" + S, x: 185 * (i + 1) }));
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === amici.length + 1; }, 10000)) no("nella Sala non sono entrati in " + (amici.length + 1));
    return { S: S, w: w };
  }
  async function lancia(Z, n) {
    var C = await A.lanciaDallaSala("Paky", Z.S, "Il più veloce");
    if (!await W.aspetta(function () { return ids(C, "players").length === n; }, 9000)) no("nella saletta non sono in " + n + " (" + ids(C, "players").length + ")");
    if (!W.clicca(Z.w.Paky, /Comincia/, ".sl-go")) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 8000)) no("la partita non comincia");
    return C;
  }
  function tocca(w) { var b = w && w.document.querySelector(".mo-tasto"); if (b) b.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, cancelable: true })); return !!b; }
  // un passo della partita: tasto verde → tocca chi deve (a turno); punto preso → l'host va avanti. true = è successo qualcosa
  async function passo(C, P, chi, k) {
    var v = vm(C);
    if (v.fase === "gioco" && v.stato === "via") { tocca(chi[k % chi.length]); await W.aspetta(function () { return vm(C).stato !== "via"; }, 3000); return true; }
    if (v.fase === "gioco" && v.stato === "preso") { var b = P.document.querySelector(".mo-vai"); if (b) { b.click(); await W.aspetta(function () { return vm(C).stato !== "preso"; }, 3000); return true; } }
    await W.dorme(100); return false;
  }
  async function finoAllaFine(C, P, chi) {
    var fino = Date.now() + 90000, k = 0;
    while (Date.now() < fino) { if (vm(C).fase === "fine") return true; if (await passo(C, P, chi, k)) k++; }
    return vm(C).fase === "fine";
  }
  // i messaggi passati sul broker da quel telefono (solo il primo ufficio: l'host parla su due)
  function logDa(nome, C, testo) { return W.BR.log.filter(function (l) { return l.indexOf(nome + " → " + C + "/") === 0 && l.indexOf("[u2]") < 0 && (!testo || l.indexOf(testo) >= 0); }); }
  function rigaInCorso(w) {
    var n = w && w.document.querySelector(".saletta-schermo .sl-incorso:not(.sl-duello)"); if (!n) return null;
    return { nodo: n, testo: n.innerText.replace(/\s+/g, " ").trim(), tasti: [].map.call(n.querySelectorAll("button"), function (b) { return b.textContent; }) };
  }
  function visibile(e) { if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
  function esciDelGioco(w) { return [].filter.call(w.document.querySelectorAll("button"), function (b) { return /Esci/.test(b.textContent) && !b.closest(".sg-guardo, .sg-guardo-fila, .conferma-velo") && visibile(b); }).length; }
  function faccineDelGioco(w) { return [].filter.call(w.document.querySelectorAll(".sl-faccine"), function (x) { return !x.closest(".sg-guardo-fila") && visibile(x); }).length; }
  function errori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / ")); }
  // chi guarda a misura: la pagina non scorre, la targhetta non copre i punti né il tasto. "" = tutto bene
  async function misura(w, nome, larg, alt, sel) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    if (!d.getElementById("senza-entrata")) { var st = d.createElement("style"); st.id = "senza-entrata"; st.textContent = ".schermata{ animation:none !important; }"; d.head.appendChild(st); }
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(600); w.scrollTo(0, 0);
    if (d.documentElement.scrollHeight > alt + 1) return "la pagina scorre (" + d.documentElement.scrollHeight + " px)";
    if (d.documentElement.scrollWidth > larg + 1) return "la pagina scorre di lato";
    var g = d.querySelector(".sg-guardo"); if (!g) return "non c'è la targhetta";
    var rg = g.getBoundingClientRect();
    var cose = [].filter.call(d.querySelectorAll(sel), visibile);
    if (!cose.length) return "non trovo " + sel;
    for (var i = 0; i < cose.length; i++) {
      var r = cose[i].getBoundingClientRect();
      if (r.bottom > alt + 1) return "«" + cose[i].className + "» esce dallo schermo";
      if (r.left < rg.right - 1 && rg.left < r.right - 1 && r.top < rg.bottom - 1 && rg.top < r.bottom - 1) return "la targhetta copre «" + (cose[i].className || cose[i].textContent.slice(0, 30)) + "»";
    }
    return "";
  }
  async function misure(w, nome, sel) {
    var M = [[360, 640], [412, 915]];
    for (var k = 0; k < M.length; k++) { var e = await misura(w, nome, M[k][0], M[k][1], sel); if (e) no(nome + " a " + M[k].join("x") + ": " + e); }
    var f = document.getElementById("tel-" + nome); f.style.width = ""; f.style.height = "";
    return "360x640 e 412x915 ok";
  }
  function controllaGuarda(w, nome, quando) {
    if (w.document.querySelectorAll(".sg-guardo").length !== 1) no(nome + " (" + quando + ") non ha una targhetta sola");
    if (esciDelGioco(w)) no(nome + " (" + quando + ") ha anche «Esci» del gioco");
    if (faccineDelGioco(w)) no(nome + " (" + quando + ") ha anche la fila delle faccine del gioco");
    if (/Tu \d|\(tu\)/.test(T(w))) no(nome + " (" + quando + ") legge «Tu» o «(tu)»");
  }

  COPIONE.aggiungi("6m1", { nome: "Il modello dalla Sala: Bea guarda col link, Marco arriva a metà e guarda, alla Rivincita giocano tutti e due", fai: async function () {
    var src = await testoModello(), Z = await salaModello(src, ["Giulia", "Luca"]), S = Z.S, P = Z.w.Paky, G = Z.w.Giulia, L = Z.w.Luca;
    var C = await lancia(Z, 3);
    // --- Bea col link &guarda=1 ---
    var B = await W.apriTel("Bea", opzModello(src, { hash: "gioco=" + COME + "&stanza=" + C + "&guarda=1", x: 555 }));
    if (!await W.aspetta(function () { return B.document.querySelector(".sg-guardo") && B.document.querySelector(".mo-scena.mo-con-targa"); }, 8000)) no("Bea non guarda la partita con la targhetta («" + T(B).slice(0, 100) + "»)");
    if (/Il tuo nome/.test(T(B))) no("Bea vede la schermata del nome");
    if (!await W.aspetta(function () { var g = B.document.querySelector(".mo-giro"); return g && /👀 Guardi · Giro/.test(g.textContent); }, 4000)) no("in alto Bea non legge «👀 Guardi · Giro…»");
    await W.dorme(1500);
    var idB = A.mioId("Bea");
    if (logDa("Bea", C, '"t":"join"').length) no("Bea ha mandato «join»");
    if (!logDa("Bea", C, '"__guardo"').length) no("Bea non ha mandato «__guardo»");
    if (ids(C, "players").indexOf(idB) >= 0 || ids(C, "guarda").indexOf(idB) >= 0) no("Bea è nella foto della partita");
    controllaGuarda(B, "Bea", "in partita");
    var mis = await misure(B, "Bea", ".mo-punti, .mo-avanti, .mo-tasto");
    // il tocco di chi guarda non conta (il core butta le sue mosse)
    if (!await W.aspetta(function () { return vm(C).stato === "via"; }, 8000)) no("il tasto non diventa verde");
    tocca(B); await W.dorme(400);
    if (vm(C).stato !== "via") no("il tocco di Bea (che guarda) ha preso il punto");
    // --- Marco arriva nella Sala a partita cominciata ---
    var M = await W.apriTel("Marco", opzModello(src, { hash: "sala=" + S, x: 740 }));
    var r = await W.aspetta(function () { var x = rigaInCorso(M); return x && /Giro \d di 5/.test(x.testo) ? x : null; }, 10000);
    if (!r) no("Marco non vede il riquadro con «Giro N di 5» («" + ((rigaInCorso(M) || {}).testo || T(M).slice(0, 100)) + "»)");
    if (r.tasti.length !== 1 || r.tasti[0] !== "👀 Guarda" || !/entri alla prossima partita/.test(r.testo)) no("il riquadro di Marco dice «" + r.testo + "» con " + JSON.stringify(r.tasti));
    var idM = A.idInSala(S, "Marco");
    if (ids(C, "players").indexOf(idM) >= 0) no("Marco è stato buttato dentro la partita");
    W.clicca(M, /Guarda/, ".sl-incorso button");
    if (!await W.aspetta(function () { return M.document.querySelector(".sg-guardo") && M.document.querySelector(".mo-scena"); }, 8000)) no("Marco non guarda la partita («" + T(M).slice(0, 80) + "»)");
    await W.dorme(1200);
    if (logDa("Marco", C, '"t":"join"').length) no("Marco (che guarda) ha mandato «join»");
    controllaGuarda(M, "Marco", "in partita");
    // --- fino alla fine ---
    var tocchi = 0, cnt = 0;
    var fino = Date.now() + 90000;
    while (Date.now() < fino && vm(C).fase !== "fine") { if (await passo(C, P, [P, G, L], cnt)) cnt++; if (cnt % 5 === 4 && !tocchi++) controllaGuarda(B, "Bea", "a metà"); }
    if (vm(C).fase !== "fine") no("la prima partita non finisce");
    if (!await W.aspetta(function () { return /Questa partita l'hai guardata/.test(T(B)) && /Questa partita l'hai guardata/.test(T(M)); }, 6000)) no("a fine partita Bea e Marco non leggono «l'hai guardata»");
    await W.dorme(800);
    controllaGuarda(B, "Bea", "a fine partita"); controllaGuarda(M, "Marco", "a fine partita");
    if (!/entri anche tu nella saletta/.test(T(B))) no("Bea non legge che alla prossima entra anche lei («" + T(B).slice(-120) + "»)");
    if (!B.document.querySelector(".schermata.mo-fine-targa")) no("la classifica di Bea non lascia il posto alla targhetta");
    var tP = (A.tastiFineDi(P) || []).join(" | ");
    if (tP !== "↻ Rivincita | 🎮 Cambia gioco") no("Paky ha «" + tP + "»");
    // --- Rivincita: Bea (link) e Marco (Sala) entrano da soli ---
    if (!W.clicca(P, /Rivincita/, ".fine-tasti button")) no("Paky non trova «↻ Rivincita»");
    if (!await W.aspetta(function () { var l = ids(C, "players"); return l.indexOf(idB) >= 0 && l.indexOf(idM) >= 0; }, 12000))
      no("alla Rivincita Bea e Marco non entrano (" + ids(C, "players").join(",") + ", fase " + vm(C).fase + ")");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).partita === 2; }, 15000)) {
      // (se il 3-2-1 aspetta qualcuno, l'host comincia)
      W.clicca(P, /Comincia/, ".sl-go");
      if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).partita === 2; }, 8000)) no("la seconda partita non comincia (fase " + vm(C).fase + ")");
    }
    if (ids(C, "players").length !== 5) no("nella seconda partita non sono in 5 (" + ids(C, "players").length + ")");
    if (B.document.querySelector(".sg-guardo") || M.document.querySelector(".sg-guardo")) no("chi è entrato ha ancora la targhetta");
    if (!await finoAllaFine(C, P, [B, M, G])) no("la seconda partita non finisce");
    var cl = vm(C).classifica || [], pB = cl.filter(function (x) { return x.id === idB; })[0], pM = cl.filter(function (x) { return x.id === idM; })[0];
    if (!pB || !pM) no("Bea o Marco non sono nella classifica della seconda partita");
    if (!(pB.punti > 0 || pM.punti > 0)) no("i tocchi di Bea e Marco non hanno preso punti");
    if (!await W.aspetta(function () { return A.tastiFineDi(M); }, 5000)) no("Marco non ha i tasti di fine");
    var tM = A.tastiFineDi(M).join(" | ");
    if (tM !== "👍 Ci sto! | 🏠 Torna in Sala") no("Marco ha «" + tM + "»");
    errori();
    return "Bea col link: targhetta, solo «__guardo», niente faccine né Esci del gioco (" + mis + "), tocco che non conta; Marco: «" + r.testo + "» → Guarda; alla Rivincita giocano tutti e due (Bea " + pB.punti + ", Marco " + pM.punti + "), Marco «" + tM + "»";
  } });

  COPIONE.aggiungi("6m2", { nome: "Il modello «dal prossimo turno»: Marco arriva a metà, Entra, aspetta il giro dopo ed entra con 0 punti", fai: async function () {
    var src = await testoModello("turno"), Z = await salaModello(src, ["Giulia", "Luca"]), S = Z.S, P = Z.w.Paky, G = Z.w.Giulia, L = Z.w.Luca;
    var C = await lancia(Z, 3);
    if (!await W.aspetta(function () { return /^Giro \d di 5$/.test(vm(S).punto || ""); }, 6000)) no("nella foto della Sala non c'è «Giro N di 5» («" + vm(S).punto + "»)");
    // un giro giocato, così Marco arriva davvero a metà partita
    var k = 0, fino = Date.now() + 20000;
    while (Date.now() < fino && !(vm(C).giro >= 2)) { if (await passo(C, P, [G, L], k)) k++; }
    var M = await W.apriTel("Marco", opzModello(src, { hash: "sala=" + S, x: 555 }));
    var r = await W.aspetta(function () { var x = rigaInCorso(M); return x && x.tasti.length === 2 ? x : null; }, 10000);
    if (!r) no("Marco non vede il riquadro con due tasti («" + ((rigaInCorso(M) || {}).testo || T(M).slice(0, 100)) + "»)");
    if (r.tasti[0] !== "▶ Entra · giochi dal prossimo turno" || r.tasti[1] !== "👀 Guarda") no("i tasti sono " + JSON.stringify(r.tasti));
    if (!/Giro \d di 5/.test(r.testo)) no("il riquadro non dice a che giro siamo («" + r.testo + "»)");
    var idM = A.idInSala(S, "Marco");
    // aspetta che il giro sia "in corso" (tasto rosso o verde): così si vede che Marco non lo gioca
    await W.aspetta(function () { return vm(C).stato === "attesa"; }, 8000);
    var giro0 = vm(C).giro, pill = "";
    if (!W.clicca(M, /Entra · giochi/, ".sl-incorso button")) no("non trovo «▶ Entra»");
    if (!await W.aspetta(function () { var p = A.pill(M); if (/Sei dentro/.test(p)) pill = p; return (vm(C).prossimi || []).some(function (x) { return x.id === idM; }) || ids(C, "players").indexOf(idM) >= 0; }, 8000)) no("Marco non è né tra i prossimi né tra i giocatori");
    var inProssimi = (vm(C).prossimi || []).some(function (x) { return x.id === idM; }) && vm(C).giro === giro0;
    if (inProssimi) {
      if (ids(C, "players").indexOf(idM) >= 0) no("Marco è nei giocatori a metà giro");
      if (!await W.aspetta(function () { var g = M.document.querySelector(".mo-giro"); return g && /Entri al prossimo giro/.test(g.textContent); }, 5000)) no("Marco non legge «✋ Entri al prossimo giro»");
      // il giro in corso finisce senza di lui; al giro dopo entra con 0 punti
      var fino2 = Date.now() + 20000, k2 = 0;
      while (Date.now() < fino2 && ids(C, "players").indexOf(idM) < 0) { if (await passo(C, P, [G], k2)) k2++; }
    }
    var pM = (vm(C).players || []).filter(function (x) { return x.id === idM; })[0];
    if (!pM) no("Marco non entra al giro dopo (giro " + vm(C).giro + ")");
    if (pM.punti !== 0) no("Marco entra con " + pM.punti + " punti");
    if (inProssimi && vm(C).giro !== giro0 + 1) no("Marco entra al giro " + vm(C).giro + " invece del " + (giro0 + 1));
    await W.aspetta(function () { var p = A.pill(M); if (/Sei dentro/.test(p)) pill = p; return pill; }, 3000);
    if (!/Sei dentro! Giochi dal prossimo turno/.test(pill)) no("Marco non legge «🎉 Sei dentro! Giochi dal prossimo turno» (" + (pill || A.pill(M) || "niente") + ")");
    if (M.document.querySelector(".sg-guardo")) no("Marco ha la targhetta di chi guarda");
    // Marco gioca: il suo tocco conta
    if (!await W.aspetta(function () { return vm(C).stato === "via"; }, 8000)) no("il tasto non diventa verde");
    tocca(M);
    if (!await W.aspetta(function () { var p = (vm(C).players || []).filter(function (x) { return x.id === idM; })[0]; return p && p.punti === 1; }, 3000)) no("il tocco di Marco non prende il punto");
    if (!await finoAllaFine(C, P, [G, L, M])) no("la partita non finisce");
    var cl = vm(C).classifica || [];
    if (!cl.some(function (x) { return x.id === idM; })) no("Marco non è nella classifica finale");
    if (!await W.aspetta(function () { return /Classifica finale|🏆/.test(T(M)) && A.tastiFineDi(M); }, 5000)) no("Marco non ha la classifica coi tasti di fine");
    errori();
    return "riquadro «" + r.testo + "»; Entra al giro " + giro0 + (inProssimi ? " → prossimi («✋ Entri al prossimo giro»), entra al giro " + (giro0 + 1) : " (tra due giri: entra subito)") + " con 0 punti, «" + pill + "», tocco che conta, in classifica";
  } });

  COPIONE.gruppo6m = async function () { return [await COPIONE.prova("6m1"), await COPIONE.prova("6m2")]; };
})();

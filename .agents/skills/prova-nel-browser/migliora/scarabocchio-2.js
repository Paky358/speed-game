// PROVE DI SCARABOCCHIO, 1 nov 2026: strumenti nuovi, «🔤 Ha scritto!», festa di chi indovina per primo, punti da 6 in su,
// memoria delle parole uscite.
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("migliora/scarabocchio-2.js"); await COPIONE.prova("sb4")
//
// sb4: chi disegna ha 16 colori, 5 grandezze, matita/linea/tondo/secchiello, annulla e ripeti; una linea dritta e un tondo
//      arrivano uguali sul telefono di chi indovina; annulla li toglie, «↷ Ripeti» li rimette; il promemoria «niente lettere»
//      compare a chi disegna; a 360x640 e 412x915 niente scorre, gli strumenti stanno nello schermo e la lavagna resta grande.
// sb5: in 4, «🔤 Ha scritto!» (serve 2 su 3): al primo «1/2» per tutti, al secondo il turno finisce, chi disegnava torna ai
//      punti di prima del turno e la schermata dei punti lo dice; in 2 il tasto non c'è.
// sb6: chi indovina per primo: la sua faccina salta su tutti i telefoni («⚡ Luca per primo!», a lui «⚡ Per primo! +…»).
// sb7: in 6 chi disegna prende una volta e mezza la sua parte (punti / 5 × 1,5).
// sb8: le parole uscite si ricordano: con tutte le facili «uscite ieri» tranne 8, le 3 proposte sono tra quelle 8; dopo la
//      scelta le 3 proposte sono nella memoria e quelle più vecchie di 30 giorni spariscono.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, vm = A.vm, no = A.no, T = A.T;

  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function nomeDiId(id, nomi) { for (var i = 0; i < nomi.length; i++) if (idDi(nomi[i]) === id) return nomi[i]; return null; }
  function tocca(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click();
  }
  async function stanza(amici, prima) {
    var P = await W.apriTel("Paky", { x: 0, prima: prima });
    var C = await W.apriStanza(P, "Scarabocchio");
    for (var i = 0; i < amici.length; i++) {
      await W.apriTel(amici[i], { hash: "gioco=scarabocchio&stanza=" + C, x: 185 * (i + 1) });
      var n = amici[i];
      if (!await W.aspetta(function () { return (vm(C).players || []).some(function (p) { return p.nome === n; }); }, 8000)) no(n + " non entra nella stanza");
    }
    return { P: P, C: C, nomi: ["Paky"].concat(amici) };
  }
  // fino al disegno: chi disegna sceglie la prima parola; torna chi disegna e la parola
  async function alDisegno(X) {
    var C = X.C, chi = null;
    if (!await W.aspetta(function () { return W.clicca(X.P, /Comincia/); }, 6000)) no("non trovo «Comincia» nella saletta");
    if (!await W.aspetta(function () { var v = vm(C); chi = v.fase === "scelta" ? nomeDiId(v.disegnatore, X.nomi) : null; return chi && W.finestra(chi).document.querySelectorAll(".sb-scelte button").length === 3; }, 10000)) no("non si arriva alla scelta della parola");
    var w = W.finestra(chi), b = w.document.querySelectorAll(".sb-scelte button")[0];
    tocca(w, b);
    if (!await W.aspetta(function () { return vm(C).fase === "disegno"; }, 5000)) no("dopo la scelta non si disegna");
    var parola = await W.aspetta(function () { var e = w.document.querySelector(".sb-centro b"); return e && e.textContent !== "…" ? e.textContent : null; }, 4000);
    if (!parola) no("chi disegna non vede la parola");
    return { chi: chi, w: w, parola: parola };
  }
  function prova(X, n, x) {
    if (n === "Paky") { var w = W.finestra(n), inp = w.document.querySelector(".sb-inp"), f = w.document.querySelector(".sb-scrivi"); inp.value = x; f.dispatchEvent(new w.Event("submit", { cancelable: true, bubbles: true })); }
    else W.reteDi(n).invia({ t: "prova", x: x });
  }
  // un gesto del dito sulla lavagna, in coordinate della lavagna (1000x1200)
  async function gesto(w, punti) {
    var cv = w.document.querySelector(".sb-cv"), r = cv.getBoundingClientRect(), Ev = w.PointerEvent || w.MouseEvent;
    function ev(tipo, p) { cv.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 7, pointerType: "touch", isPrimary: true, clientX: r.left + p[0] / 1000 * r.width, clientY: r.top + p[1] / 1200 * r.height })); }
    ev("pointerdown", punti[0]);
    for (var i = 1; i < punti.length; i++) { ev("pointermove", punti[i]); await W.dorme(20); }
    ev("pointerup", punti[punti.length - 1]);
    await W.dorme(500);
  }
  function scuro(w, x, y) {   // il punto (x, y) della lavagna è scuro?
    var cv = w.document.querySelector(".sb-cv"), d = cv.getContext("2d").getImageData(Math.round(x / 1000 * cv.width), Math.round(y / 1200 * cv.height), 1, 1).data;
    return d[0] + d[1] + d[2] < 200;
  }

  COPIONE.aggiungi("sb4", { nome: "Scarabocchio: 16 colori, 5 grandezze, linea, tondo, annulla e ripeti (anche sugli altri telefoni) e misure", fai: async function () {
    var N = [], X = await stanza(["Luca", "Giulia"]), D = await alDisegno(X), w = D.w, d = w.document;
    var altro = X.nomi.filter(function (n) { return n !== D.chi; })[0], wa = W.finestra(altro);
    if (d.querySelectorAll(".sb-col").length !== 16) no("chi disegna ha " + d.querySelectorAll(".sb-col").length + " colori, non 16");
    if (d.querySelectorAll(".sb-spess").length !== 5) no("le grandezze sono " + d.querySelectorAll(".sb-spess").length + ", non 5");
    ["matita", "linea", "tondo", "secchio"].forEach(function (k) { if (!d.querySelector(".sb-m-" + k)) no("manca lo strumento «" + k + "»"); });
    var rip = d.querySelector("[aria-label='Ripeti']");
    if (!rip || !rip.disabled) no("«↷ Ripeti» dovrebbe essere spento a inizio turno");
    if (!d.querySelector(".sb-nolett")) no("a chi disegna non compare «Disegna senza lettere né numeri»"); else N.push("promemoria ✓");
    // una linea dritta grossa, nera
    tocca(w, d.querySelector(".sb-spess.s3")); tocca(w, d.querySelector(".sb-m-linea"));
    await gesto(w, [[100, 600], [300, 650], [600, 500], [900, 600]]);   // il dito fa un giro: conta solo dall'inizio alla fine
    if (!await W.aspetta(function () { return scuro(wa, 500, 600); }, 3000)) no("la linea dritta non arriva a " + altro);
    if (scuro(wa, 600, 500)) no("la linea non è dritta: ha seguito il dito");
    if (!scuro(w, 500, 600)) no("chi disegna non vede la sua linea");
    // un tondo
    tocca(w, d.querySelector(".sb-m-tondo"));
    await gesto(w, [[200, 150], [500, 300], [800, 450]]);
    if (!await W.aspetta(function () { return scuro(wa, 500, 150) && !scuro(wa, 500, 300); }, 3000)) no("il tondo non arriva a " + altro + " (o è pieno)");
    N.push("linea e tondo ✓");
    // annulla e ripeti
    tocca(w, d.querySelector("[aria-label='Annulla']"));
    if (!await W.aspetta(function () { return !scuro(wa, 500, 150); }, 3000)) no("annullato il tondo, " + altro + " lo vede ancora");
    if (rip.disabled) no("dopo «Annulla» il «↷ Ripeti» è ancora spento");
    tocca(w, rip);
    if (!await W.aspetta(function () { return scuro(wa, 500, 150); }, 3000)) no("«↷ Ripeti» non rimette il tondo a " + altro);
    if (!scuro(wa, 500, 600)) no("dopo ripeti la linea è sparita");
    if (!rip.disabled) no("dopo il ripeti il tasto dovrebbe spegnersi");
    N.push("annulla e ripeti ✓");
    // in 3 «🔤 Ha scritto!» c'è (servono 2)
    var bl = wa.document.querySelector(".sb-lett");
    if (!bl || bl.hidden) no("in 3 chi indovina non vede «🔤 Ha scritto!»");
    // misure di chi disegna: niente scorre, gli strumenti stanno nello schermo
    var f = document.getElementById("tel-" + D.chi), M = [[360, 640], [412, 915]], st = d.createElement("style");
    st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}"; d.head.appendChild(st);
    try {
      for (var k = 0; k < M.length; k++) {
        f.style.width = M[k][0] + "px"; f.style.height = M[k][1] + "px"; w.dispatchEvent(new w.Event("resize")); await W.dorme(500);
        if (d.documentElement.scrollHeight > M[k][1] + 1) no(D.chi + " a " + M[k].join("x") + ": la schermata scorre");
        [].forEach.call(d.querySelectorAll(".sb-strumenti button,.sb-cv"), function (b) {
          var r = b.getBoundingClientRect();
          if (r.bottom > M[k][1] + 1 || r.right > M[k][0] + 1 || r.left < -1) no(D.chi + " a " + M[k].join("x") + ": «" + (b.getAttribute("aria-label") || b.className) + "» esce dallo schermo");
        });
        var cv = d.querySelector(".sb-cv").getBoundingClientRect();
        if (cv.width < M[k][0] * 0.72) no(D.chi + " a " + M[k].join("x") + ": la lavagna è stretta (" + Math.round(cv.width) + " px)");
        N.push(M[k].join("x") + " lavagna " + Math.round(cv.width) + "x" + Math.round(cv.height));
      }
    } finally { st.parentNode.removeChild(st); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize")); }
    return N.join(" · ");
  } });

  COPIONE.aggiungi("sb5", { nome: "Scarabocchio: «🔤 Ha scritto!» in 4 (2 su 3 chiudono il turno, 0 punti a chi disegna); in 2 niente tasto", fai: async function () {
    var N = [], X = await stanza(["Luca", "Giulia", "Marco"]), C = X.C, D = await alDisegno(X);
    var gli = X.nomi.filter(function (n) { return n !== D.chi; }), idD = idDi(D.chi);
    function puntiDi(id) { return ((vm(C).players || []).filter(function (p) { return p.id === id; })[0] || {}).punti || 0; }
    var prima = puntiDi(idD);
    prova(X, gli[0], D.parola);   // uno indovina: chi disegna prende la sua parte
    if (!await W.aspetta(function () { return puntiDi(idD) > prima; }, 4000)) no("chi disegna non prende punti quando uno indovina");
    if (vm(C).lettServe !== 2) no("in 4 per «Ha scritto» ne servono " + vm(C).lettServe + ", non 2");
    var w1 = W.finestra(gli[1]), b1 = await W.aspetta(function () { var b = w1.document.querySelector(".sb-lett"); return b && !b.hidden ? b : null; }, 3000);
    if (!b1) no(gli[1] + " non vede «🔤 Ha scritto!»");
    tocca(w1, b1);
    if (!await W.aspetta(function () { var b = W.finestra(gli[2]).document.querySelector(".sb-lett"); return b && /1\/2/.test(b.textContent); }, 3000)) no("dopo il primo tocco gli altri non leggono «1/2»");
    if (!/Segnalato/.test(b1.textContent)) no("chi l'ha toccato non legge «Segnalato»");
    if (vm(C).fase !== "disegno") no("con un solo «Ha scritto» il turno è già finito");
    N.push("1/2 ✓");
    var w2 = W.finestra(gli[2]); tocca(w2, w2.document.querySelector(".sb-lett"));
    if (!await W.aspetta(function () { return vm(C).fase === "punti"; }, 3000)) no("con 2 su 3 il turno non finisce");
    if (!(vm(C).ultimo || {}).lettere) no("la schermata dei punti non sa delle lettere");
    if (puntiDi(idD) !== prima) no("chi disegnava ha " + puntiDi(idD) + " punti invece di " + prima);
    if (!await W.aspetta(function () { return /0 punti/.test(T(W.finestra(gli[2]))); }, 2000)) no("la schermata dei punti non dice «0 punti»");
    N.push("turno chiuso, 0 punti ✓");
    return N.join(" · ");
  } });

  COPIONE.aggiungi("sb5b", { nome: "Scarabocchio: in 2 niente «🔤 Ha scritto!» (deciderebbe uno solo)", fai: async function () {
    var Y = await stanza(["Luca"]), E = await alDisegno(Y), altro = E.chi === "Paky" ? "Luca" : "Paky";
    await W.dorme(600);
    var bx = W.finestra(altro).document.querySelector(".sb-lett");
    if (bx && !bx.hidden) no("in 2 c'è «🔤 Ha scritto!»");
    return "in 2 niente tasto";
  } });

  COPIONE.aggiungi("sb6", { nome: "Scarabocchio: la festa di chi indovina per primo su tutti i telefoni", fai: async function () {
    var X = await stanza(["Luca", "Giulia"]), C = X.C, D = await alDisegno(X);
    var gli = X.nomi.filter(function (n) { return n !== D.chi; }), primo = gli[0], terzo = gli[1];
    prova(X, primo, "è un " + D.parola + "!");
    var f3 = await W.aspetta(function () { return W.finestra(terzo).document.querySelector(".sb-primo"); }, 3000);
    if (!f3) no(terzo + " non vede la festa del primo");
    else if (f3.textContent.indexOf(primo === "Paky" ? "Paky" : primo) < 0) no("la festa non dice il nome giusto: " + f3.textContent);
    if (!f3.querySelector("svg")) no("nella festa manca la faccina");
    var f1 = await W.aspetta(function () { return W.finestra(primo).document.querySelector(".sb-primo"); }, 3000);
    if (!f1 || !/Per primo! \+\d/.test(f1.textContent)) no(primo + " non legge «⚡ Per primo! +…»");
    if (W.finestra(primo).document.querySelector(".sb-evviva")) no(primo + " vede anche «Hai indovinato» sopra la festa");
    if (!W.finestra(D.chi).document.querySelector(".sb-primo")) no("chi disegna non vede la festa");
    // il secondo che indovina non ha la festa
    prova(X, terzo, D.parola);
    await W.dorme(800);
    var ev = W.finestra(terzo).document.querySelector(".sb-evviva");
    if (!ev && vm(C).fase === "disegno") no(terzo + " (secondo) non legge «Hai indovinato»");
    return "festa: «" + (f3 ? f3.textContent : "") + "» · " + (f1 ? f1.textContent : "");
  } });

  COPIONE.aggiungi("sb7", { nome: "Scarabocchio: in 6 chi disegna prende una volta e mezza la sua parte", fai: async function () {
    var X = await stanza(["Luca", "Giulia", "Marco", "Sara", "Ciro"]), C = X.C, D = await alDisegno(X);
    function puntiDi(id) { return ((vm(C).players || []).filter(function (p) { return p.id === id; })[0] || {}).punti || 0; }
    var chi = X.nomi.filter(function (n) { return n !== D.chi; })[1], idD = idDi(D.chi), idC = idDi(chi), pd0 = puntiDi(idD);
    prova(X, chi, D.parola);
    if (!await W.aspetta(function () { return puntiDi(idC) > 0; }, 4000)) no(chi + " non prende punti");
    await W.dorme(300);
    var pts = puntiDi(idC), pd = puntiDi(idD) - pd0, atteso = Math.max(1, Math.round(pts / 5 * 1.5));
    if (pd !== atteso) no("chi disegna prende " + pd + " invece di " + atteso + " (" + pts + " / 5 × 1,5)");
    return chi + " +" + pts + ", chi disegna +" + pd;
  } });

  COPIONE.aggiungi("sb8", { nome: "Scarabocchio: le parole uscite non tornano per 30 giorni", fai: async function () {
    var src = await (await fetch("/js/games/scarabocchio.js?" + Date.now())).text();
    var i = src.indexOf("var FACILI_TESTO"), j = src.indexOf("].join", i);
    var arr = new Function("return " + src.slice(src.indexOf("[", i), j + 1))();   // (le righe dell'elenco come le legge il gioco)
    var facili = arr.join("|").split("|").filter(Boolean).map(function (v) { return v.split("/")[0].trim(); });
    var libere = facili.slice(40, 48), mem = {}, ieri = Date.now() - 86400000, vecchia = Date.now() - 40 * 86400000;
    facili.forEach(function (w) { if (libere.indexOf(w) < 0) mem[w] = ieri; });
    mem[libere[0]] = vecchia;   // uscita 40 giorni fa: vale come nuova
    var X = await stanza(["Luca"], function (w) { try { w.localStorage.setItem("sg-scara-uscite", JSON.stringify(mem)); } catch (e) {} });
    var C = X.C, chi = null;
    if (!await W.aspetta(function () { return W.clicca(X.P, /Comincia/); }, 6000)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { var v = vm(C); chi = v.fase === "scelta" ? nomeDiId(v.disegnatore, X.nomi) : null; return chi && W.finestra(chi).document.querySelectorAll(".sb-scelte button").length === 3; }, 10000)) no("non si arriva alla scelta");
    var bb = W.finestra(chi).document.querySelectorAll(".sb-scelte button"), offerte = [].map.call(bb, function (b) { return b.firstChild.textContent; });
    var mm = JSON.parse(X.P.localStorage.getItem("sg-scara-uscite") || "{}");
    offerte.forEach(function (w) { if (libere.indexOf(w) < 0) no("è tornata «" + w + "», uscita ieri (memoria: " + Object.keys(mm).length + " parole, " + (mm[w] ? "c'è" : "non c'è") + "; facili lette " + facili.length + ")"); });
    tocca(W.finestra(chi), bb[0]);
    if (!await W.aspetta(function () { return vm(C).fase === "disegno"; }, 5000)) no("dopo la scelta non si disegna");
    var m2 = JSON.parse(X.P.localStorage.getItem("sg-scara-uscite") || "{}");
    offerte.forEach(function (w) { if (!(Date.now() - (m2[w] || 0) < 60000)) no("«" + w + "» non è nella memoria delle uscite"); });
    if (libere.indexOf(offerte[0]) >= 0 && offerte.indexOf(libere[0]) < 0 && m2[libere[0]]) no("la parola di 40 giorni fa è ancora nella memoria");
    return "proposte: " + offerte.join(", ") + " (tutte tra le 8 non uscite)";
  } });
})();

// Mini Asta — le facce fatte in due: IL PAPPONE e Sery (17 nov 2026).
// Uso: prova.js --porta 8941 --carica preferiti/asta.js,preferiti/asta-sery.js --prova sy1,sy2,sy3 --timeout 600
//
// sy1 Sery: nel suo profilo c'è «🎨 Facce dei calciatori» (e NON «🤖 I Bot»); l'editor apre di partenza la «📋 Lista Sery» (la divisione
//     alternata: 1° a Paky, 2° a Sery…), le sue facce vanno nella SUA scheda (fantaAspetto) e MAI in quella di IL PAPPONE; nella scheda
//     del calciatore «✓ fatto da te»; il calciatore fatto sparisce dal «Da fare»; Luca (un altro) il tasto non ce l'ha.
// sy2 La partita legge le facce di tutti e due: Luca, che non ha fatto niente, carica le due schede e vede le facce di Paky e di Sery;
//     IL PAPPONE vede la faccia di Sery con «✓ fatto da Sery», e il calciatore non è nel suo «Da fare».
// sy3 Lo stesso calciatore fatto da tutti e due: vince la modifica più recente (in tutti e due i versi); «↩ Di partenza» di uno toglie
//     anche la faccia più vecchia dell'altro; le due liste non cambiano quando uno ne fa (e sono quelle salvate da IL PAPPONE).
(function () {
  var W = window, no = COPIONE.aiuti.no;
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  var SERY = "Sery💗🎀";
  function schedeFinte(w) {   // le schede pubbliche finte (W.BR.pubblici), cercate per chiave del nome come quelle vere
    W.BR.pubblici = W.BR.pubblici || {};
    var nome = w.__fp && w.__fp.nome, ch = function (n) { return w.SGNube.chiaveNome(n); };
    w.SGNube.pubblica = function (d) { if (!nome) return Promise.resolve(); var s = W.BR.pubblici[nome] = W.BR.pubblici[nome] || { nome: nome }; for (var k in d) s[k] = JSON.parse(JSON.stringify(d[k])); return Promise.resolve(); };
    w.SGNube.cercaNome = function (n) { var k = Object.keys(W.BR.pubblici).filter(function (x) { return ch(x) === ch(n); })[0]; return Promise.resolve(k ? JSON.parse(JSON.stringify(W.BR.pubblici[k])) : null); };
  }
  async function apri(nome, x) {
    var w = await W.apriTel(nome, { x: x, prima: schedeFinte });
    try { w.localStorage.removeItem("sg-fanta-aspetto"); w.localStorage.removeItem("sg-fanta-aspetto-s"); } catch (e) {}
    return w;
  }
  async function editor(w) {   // dal profilo, il tasto «🎨 Facce dei calciatori»
    if (!await W.aspetta(function () { return W.clicca(w, /Profilo/, ".menu-sotto button, .ms-menu button, button"); }, 6000)) return "non trovo il Profilo";
    await W.dorme(800);
    var t = qa(w, ".st-tasto").filter(function (b) { return /Facce dei calciatori/.test(b.textContent); })[0];
    if (!t) return "manca «🎨 Facce dei calciatori»";
    t.click();
    if (!await W.aspetta(function () { return w.document.querySelector(".fa-ed.fa-ovunque .fa-ed-r"); }, 40000)) return "l'editor non si apre";
    return "";
  }
  function pelle(w, i) { qa(w, ".fa-ed-riga.pelle .fa-ed-c")[i].click(); }
  function nome(w) { return (w.document.querySelector(".fa-ed-info b") || {}).textContent; }
  function scritta(w) { return (w.document.querySelector(".fa-ed-da") || {}).textContent || ""; }
  function lista(w, q) { var b = w.document.querySelector(".fa-ed-liste button[data-lista=" + q + "]"); if (b) b.click(); return b; }
  function cerca(w, t) { var c = w.document.querySelector(".fa-ed-cerca"); c.value = t; c.dispatchEvent(new w.Event("input")); }
  function pidDi(w, n) { var S = w.SGAstaAspetto; return S.persona(n); }

  COPIONE.aggiungi("sy1", { nome: "Facce: Sery ha l'editor (solo quello), la Lista Sery di partenza, salva nella SUA scheda, «fatto da te»", fai: async function () {
    W.BR.pubblici = {}; var ko = [];
    var wL = await apri("Luca", 0); await W.aspetta(function () { return W.clicca(wL, /Profilo/, ".menu-sotto button, .ms-menu button, button"); }, 6000); await W.dorme(800);
    if (qa(wL, ".st-tasto").some(function (b) { return /Facce dei calciatori/.test(b.textContent); })) ko.push("anche Luca ha «Facce dei calciatori»");
    var w = await apri(SERY, 420), d = w.document;
    var e = await editor(w); if (e) no(e);
    if (qa(w, ".st-tasto").some(function (b) { return /I Bot/.test(b.textContent); })) ko.push("Sery vede «🤖 I Bot»");
    var S = w.SGAstaAspetto;
    if (S.mio() !== "s") ko.push("Sery non scrive nella sua mappa (" + S.mio() + ")");
    var on = d.querySelector(".fa-ed-liste button.on"); if (!on || on.dataset.lista !== "s") ko.push("di partenza non è aperta la «Lista Sery»: " + (on && on.textContent));
    var testi = qa(w, ".fa-ed-liste button").map(function (b) { return b.textContent; });
    var nS = +((testi[1] || "").replace(/\./g, "").match(/\/(\d+)/) || [])[1], nP = +((testi[0] || "").replace(/\./g, "").match(/\/(\d+)/) || [])[1], nT = +((testi[2] || "").replace(/\./g, "").match(/\/(\d+)/) || [])[1];
    if (!(nS > 300) || Math.abs(nS - nP) > 1 || nS + nP !== nT) ko.push("le liste non sono a metà: " + testi.join(" / "));
    if (!/fatte 0 su/.test((d.querySelector(".fa-ed-conta") || {}).textContent)) ko.push("contatore: " + (d.querySelector(".fa-ed-conta") || {}).textContent);
    // la divisione alternata: il primo calciatore di tutti è di Paky, il secondo di Sery
    lista(w, "t"); await W.dorme(200); qa(w, ".fa-ed-schede button")[2].click(); await W.dorme(200);
    var righe = qa(w, ".fa-ed-r").map(function (r) { return r.querySelector("b").textContent; });
    lista(w, "s"); await W.dorme(200); qa(w, ".fa-ed-schede button")[0].click(); await W.dorme(200);
    var primoS = nome(w); if (primoS !== righe[1]) ko.push("il primo della Lista Sery è " + primoS + " (atteso il 2° di tutti: " + righe[1] + ")");
    var n1 = nome(w); pelle(w, 5); await W.dorme(200);
    if (!/fatto da te/.test(scritta(w))) ko.push("nella scheda: «" + scritta(w) + "» (atteso «fatto da te»)");
    qa(w, ".fa-ed-tasti button").filter(function (b) { return /Salva e avanti/.test(b.textContent); })[0].click(); await W.dorme(300);
    if (nome(w) === n1) ko.push("Salva e avanti non passa al prossimo");
    if (!/fatte 1 su/.test((d.querySelector(".fa-ed-conta") || {}).textContent)) ko.push("dopo 1: " + (d.querySelector(".fa-ed-conta") || {}).textContent);
    if (qa(w, ".fa-ed-r").some(function (r) { return r.querySelector("b").textContent === n1; })) ko.push(n1 + " è ancora nel Da fare");
    await W.dorme(2200);   // (si salva nella scheda 1,5 s dopo)
    var sS = (W.BR.pubblici[SERY] || {}).fantaAspetto || {}, sP = (W.BR.pubblici["IL PAPPONE"] || {}).fantaAspetto;
    var pid = Object.keys(sS).filter(function (k) { return /^fc\d+$/.test(k); });
    if (pid.length !== 1 || sS[pid[0]].p !== 6 || !sS[pid[0]].ts) ko.push("nella scheda di Sery: " + JSON.stringify(sS).slice(0, 200));
    if (sP) ko.push("Sery ha scritto nella scheda di IL PAPPONE");
    if (d.querySelector(".fa-ed").scrollWidth > w.innerWidth + 1) ko.push("l'editor scorre di lato");
    if (ko.length) no(ko.join(" | "));
    return "Luca senza tasto; Sery: editor sì, Bot no; Lista Sery di partenza (" + testi.join(" / ") + "), il 1° è il 2° di tutti; «fatto da te»; salvata nella sua scheda (" + pid[0] + "), niente in quella di IL PAPPONE; sparisce dal Da fare";
  } });

  COPIONE.aggiungi("sy2", { nome: "Facce: la partita legge le facce di Paky e di Sery; IL PAPPONE vede «fatto da Sery» e il calciatore non è nel suo Da fare", fai: async function () {
    var ko = [], ora = Date.now();
    var wL = await apri("Luca", 0); await wL.SG.scaricaGioco("asta"); var SL = wL.SGAstaAspetto;
    var pB = pidDi(wL, "Barella (Inter)"), pL = pidDi(wL, "Thuram (Inter)"); if (!pB || !pL) no("non trovo i numeri di Barella e Thuram: " + pB + " " + pL);
    W.BR.pubblici = { "IL PAPPONE": { nome: "IL PAPPONE", fantaAspetto: {} }, "Sery💗🎀": { nome: SERY, fantaAspetto: {} } };
    W.BR.pubblici["IL PAPPONE"].fantaAspetto[pL] = { p: 4, c: "nero", t: "rasato", b: "corta", ok: 1 };   // (una faccia di prima, senza ora)
    W.BR.pubblici[SERY].fantaAspetto[pB] = { p: 7, c: "biondo", t: "cresta", b: "niente", ok: 1, ts: ora };
    if (SL.vero("Barella (Inter)").p === 7) ko.push("Luca vede la faccia di Sery prima di caricarla");
    await W.dorme(5500);   // (il cuore riusa la stessa lettura della scheda per 5 s)
    await new Promise(function (r) { SL.carica(r); });
    if (SL.vero("Barella (Inter)").p !== 7 || SL.vero("Barella (Inter)").t !== "cresta") ko.push("Luca non vede la faccia di Sery (" + JSON.stringify(SL.vero("Barella (Inter)")) + ")");
    if (SL.vero("Thuram (Inter)").p !== 4) ko.push("Luca non vede la faccia di Paky");
    // IL PAPPONE: «fatto da Sery» e Barella non è da fare
    var w = await apri("IL PAPPONE", 420); var e = await editor(w); if (e) no(e);
    lista(w, "t"); await W.dorme(200);
    if (qa(w, ".fa-ed-r").some(function (r) { return /Barella/.test(r.textContent); })) ko.push("Barella è nel Da fare di IL PAPPONE");
    cerca(w, "barella"); await W.dorme(200); qa(w, ".fa-ed-schede button")[2].click(); await W.dorme(200);
    var r = qa(w, ".fa-ed-r").filter(function (x) { return /Barella/.test(x.textContent); })[0]; if (!r) no("Barella non si trova"); r.click(); await W.dorme(200);
    if (!/fatto da Sery/.test(scritta(w))) ko.push("IL PAPPONE legge «" + scritta(w) + "» (atteso «fatto da Sery»)");
    await W.dorme(2000);
    var L = (W.BR.pubblici["IL PAPPONE"].fantaAspetto || {})._liste; if (!L || !L.p || !L.s) ko.push("IL PAPPONE non ha salvato le due liste");
    else if (L.p.indexOf(pL) >= 0 || L.s.indexOf(pL) >= 0) ko.push("Thuram (fatto prima) è finito in una lista");
    if (ko.length) no(ko.join(" | "));
    return "Luca carica le due schede: Barella di Sery (pelle 7, cresta) e Thuram di Paky; per IL PAPPONE Barella «fatto da Sery», non da fare; liste salvate (" + (L ? L.p.length + " + " + L.s.length : "?") + "), senza chi era già fatto";
  } });

  COPIONE.aggiungi("sy3", { nome: "Facce: lo stesso calciatore fatto da tutti e due, vince la modifica più recente; Di partenza toglie la più vecchia; liste fisse", fai: async function () {
    var ko = []; W.BR.pubblici = {};
    var w = await apri(SERY, 0), e = await editor(w); if (e) no(e);
    var S = w.SGAstaAspetto, M = S.mappe(), pB = pidDi(w, "Barella (Inter)");
    var testi0 = qa(w, ".fa-ed-liste button").map(function (b) { return b.textContent.replace(/ · .*/, "") + "/" + (b.textContent.match(/\/([\d.]+)/) || [])[1]; }).join(" ");
    // Paky dopo, Sery prima: vince Paky
    M.p = {}; M.s = {}; M.s[pB] = { p: 2, ok: 1, ts: 1000 }; M.p[pB] = { p: 5, ok: 1, ts: 2000 }; S.unisci();
    if (S.vero("Barella (Inter)").p !== 5 || S.prop()[pB].da !== "p") ko.push("Paky più recente: vince " + JSON.stringify(S.prop()[pB]));
    M.s[pB] = { p: 3, ok: 1, ts: 3000 }; S.unisci();
    if (S.vero("Barella (Inter)").p !== 3 || S.prop()[pB].da !== "s") ko.push("Sery più recente: vince " + JSON.stringify(S.prop()[pB]));
    // Sery la rifà dall'editor: la sua è la più nuova anche se quella di Paky ha un'ora alta… di poco prima
    M.p[pB] = { p: 5, ok: 1, ts: Date.now() - 5000 }; S.unisci();
    lista(w, "t"); await W.dorme(150); cerca(w, "barella"); await W.dorme(200); qa(w, ".fa-ed-schede button")[2].click(); await W.dorme(200);
    var r = qa(w, ".fa-ed-r").filter(function (x) { return /Barella/.test(x.textContent); })[0]; if (!r) no("Barella non si trova"); r.click(); await W.dorme(200);
    if (!/fatto da Paky/.test(scritta(w))) ko.push("prima di cambiare: «" + scritta(w) + "» (atteso «fatto da Paky»)");
    pelle(w, 0); await W.dorme(200);
    if (S.vero("Barella (Inter)").p !== 1 || !/fatto da te/.test(scritta(w))) ko.push("dopo la modifica di Sery: " + JSON.stringify(S.prop()[pB]) + " «" + scritta(w) + "»");
    if (M.p[pB].p !== 5) ko.push("Sery ha cambiato la mappa di Paky");
    // Di partenza di Sery toglie anche quella più vecchia di Paky
    var torna = qa(w, ".fa-ed-tasti button").filter(function (b) { return /Di partenza/.test(b.textContent); })[0];
    if (!torna) ko.push("manca «↩ Di partenza»"); else { torna.click(); await W.dorme(200); }
    if (S.prop()[pB]) ko.push("dopo «Di partenza» resta " + JSON.stringify(S.prop()[pB]));
    if (!M.s[pB] || !M.s[pB].del) ko.push("«Di partenza» non lascia la voce tolta nella mappa di Sery: " + JSON.stringify(M.s[pB]));
    // le liste non cambiano quando uno ne fa
    var testi1 = qa(w, ".fa-ed-liste button").map(function (b) { return b.textContent.replace(/ · .*/, "") + "/" + (b.textContent.match(/\/([\d.]+)/) || [])[1]; }).join(" ");
    if (testi0 !== testi1) ko.push("le liste cambiano: " + testi0 + " → " + testi1);
    // le liste salvate da IL PAPPONE vincono sul calcolo
    W.BR.pubblici["IL PAPPONE"] = { nome: "IL PAPPONE", fantaAspetto: { _liste: { p: [pB], s: [], ts: 1 } } }; w.document.querySelector(".fa-ed-x").click(); await W.dorme(5500);
    w.SGAstaAspetto.facce(); if (!await W.aspetta(function () { return w.document.querySelector(".fa-ed.fa-ovunque .fa-ed-liste"); }, 30000)) ko.push("l'editor non si riapre");
    await W.dorme(300);
    var tp = (w.document.querySelector(".fa-ed-liste button[data-lista=p]") || {}).textContent || "";
    if (!/\/1$/.test(tp.trim())) ko.push("con le liste salvate la Lista Paky dice «" + tp + "» (atteso 1 calciatore)");
    if (ko.length) no(ko.join(" | "));
    return "vince il più recente in tutti e due i versi; Sery rifà sopra Paky senza toccare la sua mappa; Di partenza toglie anche la sua; liste fisse (" + testi0 + "); le liste salvate da IL PAPPONE valgono";
  } });

  // sy4 (18 nov 2026) le facce proposte dalle foto (data/fanta-facce-bot.js): valgono in partita, nell'editor «🤖 da controllare» (scheda e
  //     segno nella riga), e con «Salva e avanti» diventano di chi le conferma; una faccia fatta a mano vince sempre sulla proposta.
  COPIONE.aggiungi("sy4", { nome: "Facce: le proposte 🤖 dalle foto valgono in partita, si vedono «da controllare» e si confermano", fai: async function () {
    var ko = []; W.BR.pubblici = {};
    var w = await apri("IL PAPPONE", 0); await w.SG.scaricaGioco("asta"); var S = w.SGAstaAspetto, M = S.mappe(); M.p = {}; M.s = {}; S.unisci();
    var pB = pidDi(w, "Barella (Inter)"), pT = pidDi(w, "Thuram (Inter)");
    var vecchie = JSON.stringify(w.SG_FANTA_FACCE_BOT || {}); w.SG_FANTA_FACCE_BOT = {};   // (solo le due di prova: quelle vere le rimette alla fine)
    w.SG_FANTA_FACCE_BOT[pB] = { p: 6, c: "biondo", t: "cresta", b: "piena", f: "squadrato" };
    w.SG_FANTA_FACCE_BOT[pT] = { p: 7, c: "nero", t: "rasato", b: "corta" };
    var v = S.vero("Barella (Inter)"); if (v.p !== 6 || v.t !== "cresta" || v.fonte !== "bot" || v.f !== "squadrato") ko.push("la proposta non vale in partita: " + JSON.stringify(v));
    M.p[pT] = { p: 2, c: "castano", t: "corti", b: "niente", ok: 1, ts: Date.now() }; S.unisci();
    if (S.vero("Thuram (Inter)").p !== 2) ko.push("la faccia fatta a mano non vince sulla proposta");
    var e = await editor(w); if (e) no(e);
    lista(w, "t"); await W.dorme(200);
    var tBo = qa(w, ".fa-ed-schede button")[3]; if (!tBo || !/Da controllare · 1$/.test(tBo.textContent)) ko.push("la scheda dice «" + (tBo && tBo.textContent) + "» (attesa «🤖 Da controllare · 1»)");
    if (tBo) { tBo.click(); await W.dorme(200); }
    var righe = qa(w, ".fa-ed-r"); if (righe.length !== 1 || !/Barella/.test(righe[0].textContent) || !/🤖/.test(righe[0].textContent)) ko.push("righe: " + righe.map(function (r) { return r.textContent; }).join(" / "));
    if (righe[0]) { righe[0].click(); await W.dorme(200); }
    if (!/proposta dalla foto/.test(scritta(w))) ko.push("nella scheda: «" + scritta(w) + "»");
    var av = qa(w, ".fa-ed-tasti button").filter(function (b) { return /Salva e avanti/.test(b.textContent); })[0]; if (av) { av.click(); await W.dorme(300); }
    if (!(M.p[pB] && M.p[pB].p === 6 && M.p[pB].t === "cresta")) ko.push("confermata, non è nella mappa di IL PAPPONE: " + JSON.stringify(M.p[pB]));
    if (S.vero("Barella (Inter)").fonte !== "prop") ko.push("confermata, la fonte è " + S.vero("Barella (Inter)").fonte);
    if (!/Da controllare · 0$/.test(qa(w, ".fa-ed-schede button")[3].textContent)) ko.push("dopo la conferma: «" + qa(w, ".fa-ed-schede button")[3].textContent + "»");
    w.SG_FANTA_FACCE_BOT = JSON.parse(vecchie); M.p = {}; S.unisci();
    if (ko.length) no(ko.join(" | "));
    return "la proposta vale in partita (pelle, taglio, forma); la faccia a mano vince; «🤖 Da controllare · 1» con il segno nella riga e la scritta nella scheda; Salva e avanti la conferma (va nella mappa di IL PAPPONE, poi 0)";
  } });
})();

// PROVE DELL'ASPETTO VERO DEI CALCIATORI E DEL CALCIATORE D'UFFICIO (8 nov 2026)
// Uso: prova.js --porta 8991 --carica preferiti/asta.js,preferiti/asta-aspetto.js --prova asp1,asp2 --timeout 600
//
// asp1 I dati (data/fanta-aspetto.js): ogni nome è nel listone, pelle 1-7, capelli/taglio/barba tra quelli che si sanno disegnare;
//      chi non c'è ha un aspetto «a caso» FISSO (uguale rifacendo il conto) ed è da controllare; le correzioni di IL PAPPONE vincono sui dati.
// asp2 L'editor «🎨 Personalizza i calciatori»: lo apre SOLO IL PAPPONE (nel ⚙️ della Mini Asta c'è il tasto solo per lui); in cima
//      sulla lista di TUTTI i calciatori (305), il primo con la quotazione più alta; «✓ Va bene» lo conferma e apre il prossimo; una
//      correzione si salva e RESTA su quel calciatore (8 nov 2026: mai da solo al prossimo); «↩ Di partenza» torna ai dati; la ricerca.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  var TAGLI = ["corti", "corti col ciuffo", "sfumati alti", "rasato", "ricci corti", "ricci", "afro", "treccine", "dreadlocks", "lunghi", "lunghi raccolti", "cresta", "calvo", "riga di lato", "mossi", "medi", "spettinati"];
  var CAP = ["nero", "castano scuro", "castano", "biondo scuro", "biondo", "biondo platino / tinto", "rosso", "grigio", "nessuno"], BAR = ["niente", "accennata", "corta", "piena", "baffi", "pizzetto", "baffi e pizzetto"];
  async function gioco(w) { if (w.SG && w.SG.scaricaGioco) await w.SG.scaricaGioco("asta"); if (!w.SGAstaAspetto) no("il gioco non espone l'aspetto"); return w.SGAstaAspetto; }
  COPIONE.aggiungi("asp1", { nome: "Fanta: l'aspetto vero dei calciatori (dati, a caso fisso, correzioni del proprietario)", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), S = await gioco(w), D = w.SG_FANTA_ASPETTO, L = w.SG_FANTA_CALCIATORI, ko = [], tutti = [];
    if (!D) no("data/fanta-aspetto.js non arriva col gioco");
    Object.keys(L).forEach(function (r) { Object.keys(L[r]).forEach(function (f) { L[r][f].forEach(function (s) { tutti.push(s); }); }); });
    Object.keys(D).forEach(function (k) {
      var d = D[k]; if (tutti.indexOf(k) < 0) ko.push("non è nel listone: " + k);
      if (!(d.p >= 1 && d.p <= 7)) ko.push("pelle strana: " + k);
      if (d.c && CAP.indexOf(d.c) < 0) ko.push("capelli strani: " + k + " " + d.c);
      if (d.t && TAGLI.indexOf(d.t) < 0) ko.push("taglio strano: " + k + " " + d.t);
      if (d.b && BAR.indexOf(d.b) < 0) ko.push("barba strana: " + k + " " + d.b);
    });
    var caso = 0, dc = 0;
    tutti.forEach(function (k) {
      var a = S.vero(k), b = S.vero(k); if (JSON.stringify(a) !== JSON.stringify(b)) ko.push("non è fisso: " + k);
      if (TAGLI.indexOf(a.t) < 0 || CAP.indexOf(a.c) < 0 || BAR.indexOf(a.b) < 0 || !(a.p >= 1 && a.p <= 7)) ko.push("aspetto rotto: " + k + " " + JSON.stringify(a));
      if (a.fonte === "caso") { caso++; if (!a.dc) ko.push("a caso ma non da controllare: " + k); }
      if (a.dc) dc++;
      var c = S.colori(a); if (!/^#/.test(c.pelle)) ko.push("colore della pelle: " + k);
    });
    var P = S.prop(), k0 = "Maignan (Milan)", prima = P[k0];
    P[k0] = { p: 1, c: "rosso", t: "afro", b: "piena", ok: 1 };
    var x = S.vero(k0); if (x.p !== 1 || x.c !== "rosso" || x.fonte !== "prop" || x.dc) ko.push("la correzione del proprietario non vince: " + JSON.stringify(x));
    if (prima) P[k0] = prima; else delete P[k0];
    if (S.vero(k0).fonte !== "dati" || S.vero(k0).p !== 6) ko.push("tolta la correzione Maignan non torna ai dati");
    if (ko.length) no(ko.slice(0, 8).join(" | "));
    return Object.keys(D).length + " dalle foto, " + caso + " a caso fissi, " + dc + " da controllare su " + tutti.length + "; la correzione del proprietario vince";
  } });
  COPIONE.aggiungi("asp2", { nome: "Fanta: «🎨 Personalizza i calciatori» solo per IL PAPPONE (Va bene, correzione, Di partenza, ricerca)", fai: async function () {
    var ko = [];
    var w0 = await W.apriTel("Paky", { x: 0 }), S0 = await gioco(w0);
    S0.apri(); await W.dorme(200); if (w0.document.querySelector(".fa-ed")) ko.push("l'editor si apre anche per Paky");
    var w = await W.apriTel("IL PAPPONE", { x: 420 }), S = await gioco(w), d = w.document;
    try { w.localStorage.removeItem("sg-fanta-aspetto"); } catch (e) {}
    var P = S.prop(); Object.keys(P).forEach(function (k) { delete P[k]; });
    S.apri(); await W.dorme(300);
    var R = d.querySelector(".fa-ed"); if (!R) no("l'editor non si apre per IL PAPPONE");
    var Q = w.SG_FANTA_QUOTAZIONI.valori, nome = function () { return (d.querySelector(".fa-ed-info b") || {}).textContent; }, squad = function () { return ((d.querySelector(".fa-ed-info span") || {}).textContent || "").split(" · ")[0]; };
    var k1 = nome() + " (" + squad() + ")", maxQ = 0;
    Object.keys(Q).forEach(function (k) { maxQ = Math.max(maxQ, Q[k]); });
    if (Q[k1] !== maxQ) ko.push("il primo (" + k1 + ", " + Q[k1] + ") non ha la quotazione più alta (" + maxQ + ")");
    if (d.querySelectorAll(".fa-ed-r").length !== 305) ko.push("nella lista ci sono " + d.querySelectorAll(".fa-ed-r").length + " calciatori invece di 305 (deve esserci TUTTA la lista)");
    var resta = function () { return +((d.querySelectorAll(".fa-ed-schede button")[1] || {}).textContent || "").replace(/\D+/g, ""); }, n0 = resta(), eraDc = S.vero(k1).dc;
    var ok = [].slice.call(d.querySelectorAll(".fa-ed-tasti button")).filter(function (b) { return /Va bene/.test(b.textContent); })[0]; ok.click(); await W.dorme(150);
    if (!P[k1] || !P[k1].ok) ko.push("«Va bene» non salva la conferma");
    if (resta() !== n0 - (eraDc ? 1 : 0)) ko.push("dopo «Va bene» da controllare " + resta() + " (prima " + n0 + ")");
    var k2 = nome() + " (" + squad() + ")"; if (k2 === k1) ko.push("«Va bene» non apre il prossimo");
    var pelle = [].slice.call(d.querySelectorAll(".fa-ed-riga"))[0].children[6]; pelle.click(); await W.dorme(150);
    if (!P[k2] || P[k2].p !== 7) ko.push("la pelle cambiata non si salva: " + JSON.stringify(P[k2]));
    await W.dorme(3500);
    if (nome() + " (" + squad() + ")" !== k2) ko.push("dopo una correzione è passato da solo a un altro calciatore (deve restare lì)");
    var cerca = d.querySelector(".fa-ed-cerca"); cerca.value = "maignan"; cerca.dispatchEvent(new w.Event("input")); await W.dorme(150);
    var r = d.querySelector(".fa-ed-r"); if (!r || !/Maignan/.test(r.textContent)) ko.push("la ricerca non trova Maignan"); else { r.click(); await W.dorme(150); }
    var pel = [].slice.call(d.querySelectorAll(".fa-ed-riga"))[0].children[0]; pel.click(); await W.dorme(150);
    if (S.vero("Maignan (Milan)").p !== 1) ko.push("Maignan non cambia");
    var torna = [].slice.call(d.querySelectorAll(".fa-ed-tasti button")).filter(function (b) { return /Di partenza/.test(b.textContent); })[0];
    if (!torna) ko.push("manca «↩ Di partenza»"); else { torna.click(); await W.dorme(150); if (S.vero("Maignan (Milan)").p !== 6 || P["Maignan (Milan)"]) ko.push("«Di partenza» non torna ai dati"); }
    var salvato = JSON.parse(w.localStorage.getItem("sg-fanta-aspetto") || "{}"); if (!salvato[k1]) ko.push("la conferma non è sul telefono");
    var mis = R.scrollWidth > w.innerWidth + 1 ? "l'editor scorre di lato" : null; if (mis) ko.push(mis);
    d.querySelector(".fa-ed-x").click(); Object.keys(P).forEach(function (k) { delete P[k]; }); try { w.localStorage.removeItem("sg-fanta-aspetto"); } catch (e) {}
    if (ko.length) no(ko.slice(0, 8).join(" | "));
    return "solo IL PAPPONE; lista di 305, primo " + k1 + " (" + Q[k1] + "); Va bene apre il prossimo, la correzione resta lì, ricerca, Di partenza: tutto a posto (" + n0 + " da controllare)";
  } });
})();

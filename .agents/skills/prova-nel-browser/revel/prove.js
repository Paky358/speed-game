// 🏠 REVEL HOUSE (26 nov 2026): il nome nuovo e i giochi nascosti. Si carica dopo copione-prova.js.
// rh1: un amico qualunque: in home niente Gara di pesca, Battaglia Navale e Palla a Pendolo (né in «Chi gioca?» della Sala, né nel torneo),
//      ma un link vecchio li trova (giocoDa); il titolo dice «Revel House» con l'icona.
// rh2: IL PAPPONE li vede ancora (NASCOSTI_AL_PROPRIETARIO = false).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  var NASCOSTI = ["garapesca", "navale", "pendolo"];
  function tessere(w) { return [].map.call(w.document.querySelectorAll(".home [data-gioco]"), function (n) { return n.getAttribute("data-gioco"); }); }
  async function home(nome) {
    var P = await W.apriTel(nome, { x: 0 });
    if (!await W.aspetta(function () { return P.document.querySelector(".home [data-gioco]"); }, 15000)) no("la home non arriva");
    await W.aspetta(function () { return false; }, 800);
    return P;
  }
  COPIONE.aggiungi("rh1", { nome: "Revel House: titolo nuovo; Gara di pesca, Battaglia Navale e Palla a Pendolo nascoste (ma i link vecchi le trovano)", fai: async function () {
    var P = await home("Luca"), t = tessere(P), err = [];
    NASCOSTI.forEach(function (id) { if (t.indexOf(id) >= 0) err.push("c'è la tessera " + id); });
    if (t.indexOf("tris") < 0) err.push("manca la tessera del Tris (" + t.join(",") + ")");
    var C = P.SGCuore;
    NASCOSTI.forEach(function (id) {
      if (C.giochi.some(function (g) { return g.id === id; })) err.push(id + " è nella lista dei giochi (Sala, torneo, voto)");
      if (!C.giocoDa(id)) err.push("giocoDa(" + id + ") non lo trova: i link vecchi non andrebbero");
    });
    var h = P.document.querySelector(".home-titolo");
    if (!h || !/Revel\s*House/.test(h.textContent)) err.push("titolo: «" + (h && h.textContent) + "»");
    if (!h || !h.querySelector("img.home-icona")) err.push("niente icona nel titolo");
    else { var r = h.querySelector("img.home-icona").getBoundingClientRect(); if (r.width < 12 || r.height < 12) err.push("icona di " + r.width + "x" + r.height); }
    if (P.document.title !== "Revel House") err.push("titolo della pagina: «" + P.document.title + "»");
    if (err.length) no(err.join("; "));
    return t.length + " tessere, titolo «" + h.textContent.trim() + "»";
  } });
  COPIONE.aggiungi("rh2", { nome: "Revel House: IL PAPPONE vede ancora i giochi nascosti", fai: async function () {
    var P = await home("IL PAPPONE"), t = tessere(P), err = [];
    NASCOSTI.forEach(function (id) { if (t.indexOf(id) < 0) err.push("manca la tessera " + id); });
    if (err.length) no(err.join("; ") + " (tessere: " + t.join(",") + ")");
    return t.length + " tessere, coi nascosti";
  } });
})();

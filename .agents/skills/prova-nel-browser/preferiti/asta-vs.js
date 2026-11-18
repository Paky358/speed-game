// PROVE DELLA RIGA «🆚» SUL PRIMO CALCIATORE DELLA MINI ASTA (18 nov 2026, il proprietario: sugli iPhone degli amici il PRIMO calciatore
// dell'asta non diceva contro chi gioca, dal secondo sì). La causa: chi entra riceveva le partite sorteggiate e subito dopo la stagione si
// caricava e le azzerava (usaStagione); il primo calciatore restava senza riga, dal secondo le partite c'erano. Lo stesso a chi ricarica.
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-vs.js"); await COPIONE.prova("vs1")
// Con Edge invisibile: prova.js --porta 8991 --carica preferiti/asta.js,preferiti/asta-vs.js --prova vs1,vs2,vs3 (asta.js serve: mette le regole della prova)
//
// vs1 Online in 3 con una stagione passata (2017-18): sul PRIMO calciatore il maxischermo di Paky (tiene la partita), Giulia e Luca dice
//     «🆚 …» (squadre vere, mai «?») entro 2,5 s.
// vs2 Online in 3 con la stagione di oggi: Giulia ricarica la pagina all'asta; tornata, il primo calciatore che vede ha la riga «🆚».
// vs3 Sullo stesso telefono in 3 con una stagione passata: il primo calciatore ha la riga «🆚».
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, S17 = "2017-18";
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function vsDi(w) {   // la riga «🆚» del calciatore sul maxischermo, se si vede (null = non c'è)
    var v = w && q(w, ".st-vs"), n = w && q(w, ".st-nome"); if (!v || !n || !n.textContent) return null;
    var t = (v.textContent || "").trim(); if (v.style.display === "none" || !v.getClientRects().length || !/^🆚 \S/.test(t) || t.indexOf("?") >= 0) return { nome: n.textContent, vs: null };
    return { nome: n.textContent, vs: t };
  }
  async function online(imp, nomi) {
    var P = await W.apriTel(nomi[0], { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    for (var i = 1; i < nomi.length; i++) await W.apriTel(nomi[i], { hash: "gioco=astafanta&stanza=" + C, x: 185 * i });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 15000)) no("non sono entrati in " + nomi.length);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "asta" && vm(C).asta; }, 20000)) no("l'asta non comincia («" + A.T(P).slice(0, 80) + "»)");
    return { P: P, C: C };
  }
  async function guardaPrimo(tel, quanto) {   // tel: [[nome, finestra]]: tutti devono avere la riga sul calciatore che vedono per primo
    var primo = {}, fino = Date.now() + quanto;
    while (Date.now() < fino) {
      var tutti = true;
      tel.forEach(function (x) { var d = vsDi(x[1]); if (!d) { tutti = false; return; } if (!primo[x[0]]) primo[x[0]] = { nome: d.nome, da: Date.now() }; if (primo[x[0]].nome !== d.nome) return; if (d.vs) primo[x[0]].vs = d.vs; else tutti = false; });
      if (tutti && tel.every(function (x) { return primo[x[0]] && primo[x[0]].vs; })) break;
      await W.dorme(100);
    }
    tel.forEach(function (x) { var p = primo[x[0]]; if (!p) no("sul telefono di " + x[0] + " non arriva il primo calciatore"); if (!p.vs) no("sul telefono di " + x[0] + " il primo calciatore (" + p.nome + ") non dice contro chi gioca"); });
    return tel.map(function (x) { return x[0] + ": " + primo[x[0]].nome + " «" + primo[x[0]].vs + "»"; }).join(" · ");
  }
  COPIONE.aggiungi("vs1", { nome: "Mini Asta online in 3 con la stagione 2017-18: il PRIMO calciatore dice contro chi gioca su tutti i telefoni", fai: async function () {
    var o = await online({ formato: "fanta", stagione: S17 }, ["Paky", "Giulia", "Luca"]);
    if (vm(o.C).stagione !== S17) no("nella foto la stagione è «" + vm(o.C).stagione + "», non la 2017-18");
    return "primo calciatore → " + await guardaPrimo([["Paky", o.P], ["Giulia", W.finestra("Giulia")], ["Luca", W.finestra("Luca")]], 2500);
  } });
  COPIONE.aggiungi("vs2", { nome: "Mini Asta online in 3: Giulia ricarica all'asta e il primo calciatore che vede dice contro chi gioca", fai: async function () {
    var o = await online({ formato: "fanta" }, ["Paky", "Giulia", "Luca"]);
    var prima = await guardaPrimo([["Giulia", W.finestra("Giulia")]], 2500);
    var G = await W.ricarica("Giulia");
    if (!await W.aspetta(function () { return vsDi(G); }, 15000)) no("dopo la ricarica Giulia non torna all'asta («" + A.T(G).slice(0, 80) + "»)");
    return "prima: " + prima + " · dopo la ricarica: " + await guardaPrimo([["Giulia", G]], 2500);
  } });
  COPIONE.aggiungi("vs3", { nome: "Mini Asta sullo stesso telefono in 3 con la stagione 2017-18: il primo calciatore dice contro chi gioca", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca"], P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = { formato: "fanta", stagione: S17 }; } });
    var tess = await W.aspetta(function () { return A.tessera(P, "Mini Asta Fantacalcio"); }, 6000); if (!tess) no("non trovo la tessera della Mini Asta");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non c'è «Su questo telefono»");
    await W.aspetta(function () { return q(P, ".sala-riga input"); }, 3000);
    while (qa(P, ".sala-riga input").length < nomi.length) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    qa(P, ".sala-riga input").forEach(function (c, k) { c.value = nomi[k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    var ok = await W.aspetta(function () { if (q(P, ".st-stadio .st-nome") && q(P, ".st-nome").textContent) return true; var b = qa(P, ".schermata .piede button, .btn").filter(function (x) { return /Avanti|Comincia|Gioca|Inizia|▶/.test(x.textContent) && !x.disabled; })[0]; if (b) b.click(); return false; }, 20000);
    if (!ok) no("non arrivo al primo calciatore («" + A.T(P).slice(0, 80) + "»)");
    return "primo calciatore → " + await guardaPrimo([["Paky", P]], 2500);
  } });
})();

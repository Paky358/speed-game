// PROVE DEI GETTONI (13 nov 2026, chat «😀 Emoji 3D al posto degli avatar»): al posto degli avatar ognuno ha un gettone
// (emoji 3D + 3 colori in ordine). Uso: await COPIONE.carica("emoji/gettone.js"); await COPIONE.prova("gt1")
// gt1: la scelta è obbligatoria (profilo senza gettone: «Scegli la tua emoji», niente «‹», «Fatto» solo con emoji + 3 colori),
//      poi la home; il gettone resta nel profilo e sul telefono (ricaricando non si richiede).
// gt2: il cambio dal profilo («✏️ Cambia emoji e colori»): emoji e colori nuovi, salvati.
// gt3: un amico con l'app vecchia (manda l'avatar di prima): nella saletta un gettone di riserva, niente errori.
// gt4: i colori della stanza: Giulia e Luca hanno lo stesso 1° colore di Paky (chi tiene la stanza): Giulia (prima) prende il 2°,
//      Luca il suo 2° se libero, se no il 3°; tutti i telefoni vedono gli stessi colori; chi esce e rientra tiene il suo.
// gt5: il gettone nei posti stretti a 360x740: Sala in 8, ogni gettone a vista, dentro la stanza e grande almeno 24 px.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function gettoneNelProfilo(w) { try { return w.SGNube.profilo().gettone || null; } catch (e) { return null; } }
  // il colore (chiave) con cui un telefono disegna il gettone di «nome» nella saletta
  function coloreSaletta(w, nome) {
    var av = A.avatarDi(w, nome), s = av && av.querySelector("svg.gettone");
    if (!s) return null;
    var c = (s.getAttribute("style") || "").replace(/^.*--gt:\s*/, "").replace(/;.*$/, "").trim();
    var k = (w.SGGettone.COLORI.filter(function (x) { return x.c === c; })[0] || {}).k;
    return k || c;
  }

  COPIONE.aggiungi("gt1", { nome: "Gettone: la scelta obbligatoria, poi la home; resta anche ricaricando", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, senzaGettone: true });
    if (!await W.aspetta(function () { return P.document.querySelector(".gt-scelta .gt-em"); }, 8000)) no("senza gettone non si apre «Scegli la tua emoji» («" + T(P).slice(0, 80) + "»)");
    if ([].some.call(P.document.querySelectorAll(".gt-scelta button"), function (b) { return b.textContent.trim() === "‹"; })) no("nella scelta obbligatoria c'è «‹»: si potrebbe saltare");
    if (P.document.querySelectorAll(".gt-scelta .gt-em").length < 100) no("meno di 100 emoji nella griglia");
    if (P.document.querySelectorAll(".gt-scelta .gt-col").length !== 12) no("i colori non sono 12");
    await A.primoGettone(P, 0, ["Oro", "Blu", "Verde"]);
    if (!await W.aspetta(function () { return P.document.querySelector(".tessera"); }, 8000)) no("dopo la scelta non arriva la home («" + T(P).slice(0, 80) + "»)");
    var g = gettoneNelProfilo(P);
    if (!g || g.e !== "⚡" || g.c.join() !== "oro,blu,verde") no("nel profilo il gettone è " + JSON.stringify(g));
    P = await W.ricarica("Paky");
    if (!await W.aspetta(function () { return P.document.querySelector(".tessera"); }, 8000)) no("ricaricando non arriva la home");
    if (P.document.querySelector(".gt-scelta")) no("ricaricando richiede la scelta");
    return "scelta obbligatoria (niente «‹», 12 colori, «Fatto» solo con emoji + 3 colori), ⚡ oro-blu-verde nel profilo, ricaricando si entra";
  } });

  COPIONE.aggiungi("gt2", { nome: "Gettone: si cambia dal profilo", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    if (!await W.aspetta(function () { return P.document.querySelector(".tessera"); }, 8000)) no("la home non arriva");
    if (!await W.aspetta(function () { return W.clicca(P, /Profilo/, ".menu-sotto button, nav button, button"); }, 4000)) no("non trovo «Profilo»");
    if (!await W.aspetta(function () { return W.clicca(P, /Cambia emoji e colori/); }, 6000)) no("nel profilo non c'è «✏️ Cambia emoji e colori» («" + T(P).slice(0, 120) + "»)");
    if (!await W.aspetta(function () { return P.document.querySelector(".gt-scelta .gt-em"); }, 4000)) no("non si apre la scelta");
    var em = P.document.querySelectorAll(".gt-scelta .gt-em"), scelta = em[30].getAttribute("aria-label");
    em[30].click();
    // i colori di prima sono già segnati: si tolgono e si rimettono in un ordine nuovo
    [].forEach.call(P.document.querySelectorAll(".gt-col.on"), function (b) { b.click(); });
    [].forEach.call(P.document.querySelectorAll(".gt-col.on"), function (b) { b.click(); });
    ["Rosso", "Viola", "Acqua"].forEach(function (k) { var b = [].find.call(P.document.querySelectorAll(".gt-col"), function (x) { return x.getAttribute("aria-label") === k; }); b.click(); });
    if (!W.clicca(P, /Fatto/)) no("non c'è «Fatto»");
    if (!await W.aspetta(function () { return P.document.querySelector(".gt-profilo svg.gettone"); }, 4000)) no("dopo «Fatto» non torna al profilo col gettone");
    var g = gettoneNelProfilo(P);
    if (!g || g.e !== scelta || g.c.join() !== "rosso,viola,acqua") no("nel profilo il gettone è " + JSON.stringify(g) + " (atteso " + scelta + " rosso,viola,acqua)");
    if (P.document.querySelector(".gt-profilo svg.gettone").getAttribute("data-gt") !== scelta) no("il profilo mostra ancora il gettone di prima");
    return "cambiato in " + scelta + " rosso-viola-acqua, il profilo lo mostra";
  } });

  COPIONE.aggiungi("gt3", { nome: "Gettone: un amico con l'app vecchia (manda l'avatar) vede e si vede con un gettone di riserva", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, "La linea del tempo");
    var avatarDiPrima = null;
    var L = await W.apriTel("Luca", { hash: "gioco=timeline&stanza=" + C, x: 185, prima: function (w) {
      // l'app vecchia: quando entra manda l'avatar di prima (il disegno vero degli avatar c'è ancora in SGOmino.__avatar)
      avatarDiPrima = w.SGOmino.__avatar.norm(w.SGOmino.__avatar.casuale("Luca"));
      var ent = w.SGNet.entra;   // (quello che manda entrando: il «join» col vecchio avatar)
      w.SGNet.entra = function () {
        var h = ent.apply(this, arguments);
        if (h && h.invia) { var inv = h.invia; h.invia = function (m) { if (m && m.t === "join") m = Object.assign({}, m, { omino: avatarDiPrima }); return inv.apply(h, [m].concat([].slice.call(arguments, 1))); }; }
        return h;
      };
    } });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 2; }, 8000)) no("Luca non entra");
    var gL = (vm(C).giocatori || []).filter(function (x) { return x.nome === "Luca"; })[0];
    var om = gL && (gL.omino || null);
    if (!om || om.g !== 1 || !om.r || !om.k) no("nella foto dell'host Luca non ha un gettone di riserva col colore: " + JSON.stringify(om).slice(0, 120));
    if (!await W.aspetta(function () { var a = A.avatarDi(P, "Luca"); return a && a.querySelector("svg.gettone"); }, 4000)) no("nella saletta dell'host Luca non è un gettone");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" | "));
    return "Luca manda l'avatar di prima: l'host lo mette in partita col gettone di riserva " + om.e + " (" + om.k + "), niente errori";
  } });

  COPIONE.aggiungi("gt4", { nome: "Gettone: i colori della stanza (chi entra prima tiene il suo 1°), uguali su tutti i telefoni", fai: async function () {
    // Paky (host) oro-blu-verde; Giulia oro-blu-rosso; Luca oro-blu-lime: Giulia prende blu (il 2°), Luca lime (il 3°)
    var P = await W.apriTel("Paky", { x: 0, profilo: { gettone: { g: 1, e: "⚡", c: ["oro", "blu", "verde"] } } }), C = await W.apriStanza(P, "La linea del tempo");
    var G = await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185, profilo: { gettone: { g: 1, e: "🦊", c: ["oro", "blu", "rosso"] } } });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 2; }, 8000)) no("Giulia non entra");
    var L = await W.apriTel("Luca", { hash: "gioco=timeline&stanza=" + C, x: 370, profilo: { gettone: { g: 1, e: "🐸", c: ["oro", "blu", "lime"] } } });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 8000)) no("Luca non entra");
    var atteso = { Paky: "oro", Giulia: "blu", Luca: "lime" };
    var ok = await W.aspetta(function () {
      return [["Paky", P], ["Giulia", G], ["Luca", L]].every(function (t) {
        return ["Paky", "Giulia", "Luca"].every(function (n) { var vede = coloreSaletta(t[1], t[0] === n ? "Tu" : n) || coloreSaletta(t[1], n); return vede === atteso[n]; });
      });
    }, 6000);
    if (!ok) {
      var visti = [["Paky", P], ["Giulia", G], ["Luca", L]].map(function (t) { return t[0] + ": " + ["Paky", "Giulia", "Luca"].map(function (n) { return n + "=" + (coloreSaletta(t[1], t[0] === n ? "Tu" : n) || coloreSaletta(t[1], n)); }).join(","); });
      no("colori diversi da quelli attesi (Paky oro, Giulia blu, Luca lime): " + visti.join(" · "));
    }
    // Giulia esce e rientra: tiene il blu (anche se intanto il blu sarebbe libero per un altro)
    W.clicca(G, /‹/);
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).filter(function (x) { return x.nome === "Giulia" && !x.via; }).length === 0 || !A.avatarDi(P, "Giulia"); }, 6000)) {}
    G = await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return coloreSaletta(P, "Giulia") === "blu"; }, 8000)) no("Giulia rientrata non ha più il blu (" + coloreSaletta(P, "Giulia") + ")");
    return "Paky oro, Giulia blu (2°), Luca lime (3°) su tutti e tre i telefoni; Giulia rientra e tiene il blu";
  } });

  COPIONE.aggiungi("gt5", { nome: "Gettone nei posti stretti: Sala in 8 a 360x740, ogni gettone a vista e grande almeno 24 px", fai: async function () {
    var r = await A.salaConAmici(["Giulia", "Luca", "Sara", "Marco", "Anna", "Pino", "Ugo"]), P = r.w.Paky;
    await W.dorme(1500);
    var st = P.document.querySelector(".sl-stanza"); if (!st) no("non vedo la stanza della Sala");
    var rs = st.getBoundingClientRect(), g = [].slice.call(P.document.querySelectorAll(".sl-av:not(.sl-vuoto) svg.gettone"));
    if (g.length < 8) no("nella Sala dell'host ci sono " + g.length + " gettoni su 8");
    var piccoli = [], fuori = [];
    g.forEach(function (s) { var b = (s.querySelector("circle") || s).getBoundingClientRect(), d = Math.min(b.width, b.height); if (d < 24) piccoli.push(Math.round(d)); if (b.left < rs.left - 2 || b.right > rs.right + 2) fuori.push(Math.round(b.left)); });
    if (piccoli.length) no("gettoni troppo piccoli: " + piccoli.join(", ") + " px");
    if (fuori.length) no("gettoni fuori dalla stanza");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" | "));
    return "8 gettoni a vista nella Sala, il più piccolo " + Math.round(Math.min.apply(null, g.map(function (s) { return s.getBoundingClientRect().width; }))) + " px";
  } });
})();

// PROVE DEL PORTIERE UNICO E DELLE SCRITTE DEI TIRATORI (2 nov 2026, decise dal proprietario il 30 ott e il 2 nov).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta-portiere.js"); await COPIONE.prova("pu1")
//
// pu1 All'asta del fanta esce UN SOLO portiere per squadra (Inter e Napoli ne hanno due nel listone): 3.000 mazzi da 2 a 10
//     giocatori, sempre un portiere a testa, mai due della stessa squadra; e i portieri escono tutti, prima o poi.
//     (10 nov 2026) E il gruppo X «solo in campo» (difensori da 4 in giù, centrocampisti e attaccanti da 5 in giù, tranne Geubbels, il rigorista del Lecce)
//     non esce MAI all'asta, ma gioca nella giornata: tutti sono nelle squadre di Serie A del gioco.
// pu2 Sul maxischermo «🎯 1° RIGORISTA», «🦶 2° PUNIZIONI», «🚩 1° ANGOLI»: sempre il numero e la scritta per intero, piccole, una
//     sotto l'altra a destra in basso; la maglia grande come senza scritte; nome, squadra e prezzo interi e mai sotto le scritte
//     (360x640, 320x568, 412x915, 390x844).
// mo1 Ogni squadra col suo modulo (data/fanta-moduli.js) in campo e nell'overall; i vostri attaccanti mai in difesa (11 nov 2026).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  async function motore(w) {   // il file del gioco con tre funzioni di dentro portate fuori (solo per la prova), dentro il telefono w
    if (w.SG && w.SG.scaricaGioco) await w.SG.scaricaGioco("asta");   // (dal 4 nov 2026 il listone arriva col gioco)
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), fuori = {};
    var aggancio = "function costruisciMazzoFanta(n) {";
    if (src.indexOf(aggancio) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    src = src.replace(aggancio, "FUORI.mazzo = costruisciMazzoFanta; FUORI.rose = roseSerieA; FUORI.prezzo = prezzoSchermo; FUORI.etichette = etichetteTiri; FUORI.maxischermo = maxischermo; " + aggancio);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, fuori);
    return fuori;
  }
  COPIONE.aggiungi("pu1", { nome: "Mini Asta Fantacalcio: un solo portiere per squadra all'asta", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), db = w.SG_FANTA_CALCIATORI.P, perSq = {}, visti = {}, x = [];
    ["A", "B", "C"].forEach(function (t) { (db[t] || []).forEach(function (s) { var sq = /\(([^)]+)\)/.exec(s)[1]; perSq[sq] = (perSq[sq] || 0) + 1; }); });
    var doppie = Object.keys(perSq).filter(function (k) { return perSq[k] > 1; });
    if (doppie.length < 2) no("nel listone non ci sono più squadre con due portieri (" + doppie.join(", ") + "): la prova non serve più così");
    var L = w.SG_FANTA_CALCIATORI, Q = w.SG_FANTA_QUOTAZIONI.valori, SOGLIA = { D: 4, C: 5, A: 5 }, X = {}, nX = 0;
    ["D", "C", "A"].forEach(function (r) {
      (L[r].X || []).forEach(function (k) { var mk = /^(.*) \(([^)]+)\)$/.exec(k); X[mk[1] + "|" + mk[2]] = 1; nX++; if (!(Q[k] <= SOGLIA[r])) no(k + " è «solo in campo» ma vale " + Q[k]); });
      ["A", "B", "C"].forEach(function (t) { (L[r][t] || []).forEach(function (k) { if (Q[k] <= SOGLIA[r] && k !== "Geubbels (Lecce)") no(k + " vale " + Q[k] + " ma è ancora all'asta"); }); });
    });
    if (nX < 30) no("il gruppo «solo in campo» ha solo " + nX + " calciatori");
    // (11 nov 2026, il proprietario: «così c'è un rigorista per ogni squadra») ogni squadra ha almeno uno dei suoi rigoristi all'asta
    var SQ = w.SG_FANTA_SQUADRE.squadre, all = {}, nn = function (x) { return String(x).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z. ]/g, "").trim(); };
    ["P", "D", "C", "A"].forEach(function (r) { ["A", "B", "C"].forEach(function (t) { (L[r][t] || []).forEach(function (k) { var mk = /^(.*) \(([^)]+)\)$/.exec(k); all[nn(mk[1]) + "|" + mk[2]] = 1; }); }); });
    var senza = Object.keys(SQ).filter(function (sq) { return !(SQ[sq].rigori || []).some(function (x) { return all[nn(x[0]) + "|" + sq]; }); });
    if (senza.length) no("senza nessun rigorista all'asta: " + senza.join(", "));
    var rose = M.rose(), inRosa = {}; Object.keys(rose).forEach(function (sq) { rose[sq].forEach(function (c) { inRosa[c.nome + "|" + c.squadra] = 1; }); });
    Object.keys(X).forEach(function (k) { if (!inRosa[k]) no(k + " non gioca nella giornata"); });
    for (var i = 0; i < 3000; i++) {
      var n = 2 + (i % 9), m = M.mazzo(n), P = m.filter(function (c) { return c.ruolo === "P"; }), sq = {};
      m.forEach(function (c) { if (X[c.nome + "|" + c.squadra]) no(c.nome + " (" + c.squadra + ") è «solo in campo» ma esce all'asta"); });
      if (P.length !== n) no("con " + n + " giocatori i portieri sono " + P.length);
      P.forEach(function (c) { if (sq[c.squadra]) no("due portieri del " + c.squadra + " nello stesso mazzo: " + P.map(function (y) { return y.nome; }).join(", ")); sq[c.squadra] = 1; visti[c.nome] = 1; });
    }
    var tutti = 0; ["A", "B", "C"].forEach(function (t) { tutti += (db[t] || []).length; });
    if (Object.keys(visti).length !== tutti) no("escono solo " + Object.keys(visti).length + " portieri su " + tutti);
    try { Object.keys(w.localStorage).forEach(function (k) { if (/fanta_/.test(k)) w.localStorage.removeItem(k); }); } catch (e) {}
    x.push("3.000 mazzi da 2 a 10: sempre un portiere a testa, mai due della stessa squadra (" + doppie.join(", ") + " ne hanno due); escono tutti i " + tutti);
    x.push(nX + " «solo in campo»: mai all'asta, tutti nelle squadre della giornata; ogni squadra ha almeno un rigorista all'asta");
    return x.join("; ");
  } });
  COPIONE.aggiungi("pu2", { nome: "Mini Asta Fantacalcio: rigorista, punizioni e angoli sempre col numero e la scritta intera", fai: async function () {
    // lo stadio vero (stesso telefono, in 3): accanto al maxischermo vero se ne mette uno uguale fatto dal gioco e lo si riempie coi casi
    var P = await W.apriTel("Paky", { x: 0, pa: true }), x = [], ko = [];
    var tess = await W.aspetta(function () { return A.tessera(P, "Mini Asta Fantacalcio"); }, 6000); if (!tess) no("non trovo la tessera del fanta");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non c'è «Su questo telefono»");
    await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 3000);
    while (P.document.querySelectorAll(".sala-riga input").length < 3) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = ["Paky", "Giulia", "Luca"][k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    if (!await W.aspetta(function () { if (P.document.querySelector(".st-stadio .st-board")) return true; W.clicca(P, /Comincia|Avanti|Gioca|Inizia/); return false; }, 10000)) no("non arrivo allo stadio");
    var M = await motore(P), document = P.document, f = window.document.getElementById("tel-Paky");
    var el = function (tag, a, figli) { var e = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { if (k === "class") e.className = a[k]; else if (k === "style") e.style.cssText = a[k]; else e.setAttribute(k, a[k]); }); (figli || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e; };
    var casi = [[0, 0, 0], [1, 1, 1], [2, 3, 1], [3, 3, 3], [1, 0, 2], [0, 2, 0]], parole = ["RIGORISTA", "PUNIZIONI", "ANGOLI"], nomi = ["Mastantuono", "Calhanoglu", "Kean"];
    var misure = [[360, 640], [320, 568], [412, 915], [390, 844], [360, 700], [384, 780]];   // (360x700: il Galaxy del proprietario con l'app installata, 10 nov 2026)
    for (var i = 0; i < misure.length; i++) {
      f.style.width = misure[i][0] + "px"; f.style.height = misure[i][1] + "px"; void document.documentElement.offsetHeight; P.dispatchEvent(new P.Event("resize")); await W.dorme(400);
      var vero = document.querySelector(".st-stadio .st-board"), base = null;   // (base: dove stanno nome e prezzo senza scritte, su questo telefono)
      casi.forEach(function (cs, k) {
        var S = {}, b2 = M.maxischermo(el, S, true); vero.parentNode.insertBefore(b2, vero); vero.style.display = "none";
        S.schermo.classList.remove("vuoto"); S.ruolo.textContent = "CEN"; S.ruolo.className = "st-ruolo as-rb-C"; S.squadra.textContent = "FIORENTINA"; S.nome.textContent = nomi[k % 3];
        S.magliaImg.src = vero.querySelector(".st-maglia").src || "carte/giochi/astafanta.jpg";
        var conVs = k % 2 === 0; S.vs.textContent = conVs ? (k % 4 === 0 ? "🆚 Frosinone (81)" : "🆚 Inter (86) · Milan (82) · Roma (85)") : ""; S.vs.style.display = conVs ? "" : "none";   // (🆚 contro chi gioca, con l'overall della squadra dall'11 nov: prima delle scritte, come nel gioco)
        M.etichette(S, cs[0], cs[1], cs[2]);   // (come nel gioco: il prezzo e chi offre arrivano subito dopo)
        M.prezzo(S.prezzoN, "12"); S.chi.textContent = S.corto ? "di IL PAPPONE" : "offerta di IL PAPPONE";
        var d = S.schermo.querySelector(".st-dati").getBoundingClientRect(), sc = S.schermo.getBoundingClientRect(), dove = misure[i].join("x") + " " + cs.join("/") + " " + S.nome.textContent;
        // (10 nov 2026, il proprietario: «il ruolo si vede tagliato»): tutto dentro lo schermo, dal ruolo in alto al prezzo in basso (sopra la scritta che scorre)
        var dentro = S.schermo.querySelector(".st-dentro").getBoundingClientRect(), ru0 = S.ruolo.getBoundingClientRect(), pz0 = S.prezzoN.getBoundingClientRect(), chi0 = S.chi.getBoundingClientRect(), vs0 = S.vs.getBoundingClientRect();
        // («🆚 Frosinone» sta nella riga di ruolo e squadra, sopra il nome: almeno un pezzo leggibile, mai fuori dal riquadro)
        if (ru0.top < sc.top + 1 || pz0.bottom > dentro.bottom + 1 || chi0.bottom > dentro.bottom + 1 || (conVs && (vs0.top < ru0.top - 3 || vs0.bottom > testo(S.nome).top + 3 || vs0.right > d.right + 1 || vs0.width < 24 || (k % 4 === 0 && misure[i][0] >= 360 && S.vs.scrollWidth > S.vs.clientWidth + 1)))) ko.push(dove + (conVs ? " con 🆚" : "") + ": tagliato (ruolo " + Math.round(ru0.top - sc.top) + " px dal bordo di sopra, prezzo " + Math.round(dentro.bottom - pz0.bottom) + " px dal fondo" + (conVs ? ", 🆚 " + S.vs.scrollWidth + " su " + S.vs.clientWidth + " px, squadra " + S.squadra.scrollWidth + "/" + S.squadra.clientWidth + ", riga " + Math.round(S.ruolo.parentNode.getBoundingClientRect().width) : "") + ")");
        function testo(n) { var r = document.createRange(); r.selectNodeContents(n); return r.getBoundingClientRect(); }   // (dove sta davvero la scritta)
        function sopra(a, b) { return a.width && b.width && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1; }
        var occupati = [["il nome", testo(S.nome)], ["il prezzo", testo(S.prezzoN)], ["chi offre", S.chi.getBoundingClientRect()], ["il ruolo", S.ruolo.getBoundingClientRect()], ["la squadra", testo(S.squadra)]].concat(conVs ? [["il 🆚", vs0]] : []);
        [S.rig, S.pun, S.ang].forEach(function (b, j) {
          var atteso = cs[j] ? (["🎯 ", "🦶 ", "🚩 "][j] + cs[j] + "° " + parole[j]) : "";
          if (b.textContent !== atteso) ko.push(dove + ": «" + b.textContent + "» invece di «" + atteso + "»");
          if (!atteso) return;
          var r = b.getBoundingClientRect();
          if (b.scrollWidth > b.clientWidth + 1 || r.right > d.right + 1 || r.bottom > d.bottom + 1 || r.top < d.top - 1 || r.width < 20 || r.left < d.left + d.width * 0.4) ko.push(dove + ": «" + atteso + "» tagliata, fuori dal tabellone o non a destra");
          occupati.forEach(function (o) { if (sopra(r, o[1])) ko.push(dove + ": «" + atteso + "» copre " + o[0]); });
        });
        var n = S.nome.getBoundingClientRect(), sq = S.squadra.getBoundingClientRect(), pz = S.prezzoN.getBoundingClientRect(), mh = S.magliaImg.getBoundingClientRect().height;
        if (!base) base = { n: n.bottom, pz: pz.bottom, mh: mh };
        if (n.bottom > base.n + 1 || pz.bottom > base.pz + 1 || sq.width < 30 || mh < base.mh - 1 || testo(S.nome).width > S.nome.clientWidth - parseFloat(P.getComputedStyle(S.nome).paddingLeft) - parseFloat(P.getComputedStyle(S.nome).paddingRight) + 1 || parseFloat(P.getComputedStyle(S.nome).fontSize) < 12) ko.push(dove + ": il nome, la squadra o il prezzo non si vedono più (" + Math.round(n.bottom) + "/" + Math.round(pz.bottom) + " invece di " + Math.round(base.n) + "/" + Math.round(base.pz) + ", maglia " + Math.round(mh) + " px, squadra " + Math.round(sq.width) + " px)");
        if (misure[i][0] >= 390 && S.corto && S.chi.scrollWidth > S.chi.clientWidth + 1) ko.push(dove + ": «" + S.chi.textContent + "» tagliato (" + S.chi.clientWidth + " su " + S.chi.scrollWidth + " px)");
        b2.remove(); vero.style.display = "";
      });
    }
    f.style.width = "360px"; f.style.height = "740px"; P.dispatchEvent(new P.Event("resize"));
    if (ko.length) no(ko.slice(0, W.__tutti ? 99 : 6).join(" · ") + (ko.length > 6 ? " … (" + ko.length + ")" : ""));
    x.push("6 casi su 6 telefoni (360x640, 320x568, 412x915, 390x844, 360x700, 384x780) nello stadio vero, con e senza «🆚»: numero e scritta sempre interi, a destra in basso; maglia grande come prima; nome, squadra e prezzo interi e scoperti; ruolo e prezzo dentro lo schermo");
    return x.join("; ");
  } });
  // mo1 🧩 I MODULI (11 nov 2026, il proprietario: «ogni squadra ha il suo modulo… la formazione più forte possibile… e si prende l'overall di quella»;
  //     «deve succedere molto raramente che il mio attaccante sta in difesa»): per ognuna delle 20 squadre, attaccando e difendendo, 11 posti col portiere
  //     in porta, tanti difensori, centrocampisti e attaccanti quanti ne dice data/fanta-moduli.js, gli attaccanti sempre più avanti dei difensori; un
  //     vostro attaccante che non c'entra non va MAI in un posto da difensore (prima i posti da attaccante, poi uno nuovo davanti, poi il centrocampo);
  //     l'overall dell'Inter è quello della formazione più forte nel 3-5-2, con Lautaro e Thuram.
  COPIONE.aggiungi("mo1", { nome: "Mini Asta Fantacalcio: ogni squadra col suo modulo in campo e nell'overall", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 });
    if (w.SG && w.SG.scaricaGioco) await w.SG.scaricaGioco("asta");
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), fuori = {};
    if (src.indexOf("function postiModulo(") < 0) no("non trovo i posti del modulo nel file del gioco");
    src = src.replace("  SG.registra(gioco);", " FUORI.reparti = repartiSquadra; FUORI.posti = postiModulo; FUORI.ordine = ordineRuolo; FUORI.modulo = moduloDi; FUORI.ovr = overallSquadra; FUORI.ovrQ = ovrDaQ; FUORI.rose = roseSerieA; SG.registra(gioco);");
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, fuori);
    var MOD = (w.SG_FANTA_MODULI && w.SG_FANTA_MODULI.squadre) || {}, sq = Object.keys(MOD), ko = [];
    if (sq.length !== 20) no("i moduli sono " + sq.length + " squadre invece di 20");
    sq.forEach(function (s) {
      var m = fuori.modulo(s), tot = 1 + m.D + m.C + m.A, linee = m.linee.reduce(function (t, x) { return t + x; }, 0);
      if (tot !== 11 || linee !== 10) ko.push(s + ": il modulo " + m.mod + " non fa 11 (" + tot + ", linee " + linee + ")");
      [true, false].forEach(function (att) {
        var p = fuori.posti(s, att), c = { P: 0, D: 0, C: 0, A: 0 }; p.forEach(function (o) { c[o.ru]++; });
        if (p.length !== 11 || c.P !== 1 || c.D !== m.D || c.C !== m.C || c.A !== m.A || p[0].ru !== "P") ko.push(s + (att ? " (attacca)" : " (difende)") + ": posti " + JSON.stringify(c));
        var xA = p.filter(function (o) { return o.ru === "A"; }).map(function (o) { return o.x; }), xD = p.filter(function (o) { return o.ru === "D"; }).map(function (o) { return o.x; });
        if (att ? Math.min.apply(null, xA) <= Math.max.apply(null, xD) : Math.max.apply(null, xA) >= Math.min.apply(null, xD)) ko.push(s + (att ? " (attacca)" : " (difende)") + ": un attaccante non è davanti ai difensori");
        var o = fuori.ordine(p, "A", att), primi = o.slice(0, o.indexOf("su"));
        if (primi.some(function (i) { return p[i].ru !== "A"; }) || o.some(function (i) { return i !== "su" && p[i].ru === "D"; })) ko.push(s + ": un vostro attaccante può finire in difesa");
      });
    });
    var inter = fuori.rose()["Inter"].filter(function (c) { return c.ruolo === "A"; }).sort(function (x, y) { return y.q - x.q; }).slice(0, 2).map(function (c) { return c.nome; });
    if (fuori.modulo("Inter").A !== 2 || inter.join(",").indexOf("Martinez L.") < 0 || inter.join(",").indexOf("Thuram") < 0) ko.push("l'Inter: le due punte più forti sono " + inter.join(", "));
    // ⚔️ (11 nov sera) attacco, centrocampo e difesa coi ruoli del fantacalcio (il proprietario: «Pulisic fa il centrocampista, quindi ha solo Ramos
    // in attacco»): l'attacco del Milan (un attaccante solo nel suo 4-3-3) è l'overall del suo attaccante più forte
    var rp = {}; sq.forEach(function (s) { var r = fuori.reparti(s); rp[s] = r; ["att", "cen", "dif"].forEach(function (k) { if (!(r[k] >= 60 && r[k] <= 95)) ko.push(s + ": " + k + " " + r[k]); }); });
    var milA = fuori.rose()["Milan"].filter(function (c) { return c.ruolo === "A"; }).sort(function (x, y) { return y.q - x.q; })[0];
    if (fuori.modulo("Milan").A === 1 && (!milA || Math.abs(rp.Milan.att - fuori.ovrQ("A", milA.q)) > 0.01)) ko.push("il Milan: l'attacco è " + rp.Milan.att + ", non quello di " + (milA && milA.nome));
    if (ko.length) no(ko.slice(0, 6).join(" · ") + (ko.length > 6 ? " … (" + ko.length + ")" : ""));
    return "Inter attacco " + Math.round(rp.Inter.att) + ", centrocampo " + Math.round(rp.Inter.cen) + ", difesa " + Math.round(rp.Inter.dif) + "; Milan attacco " + Math.round(rp.Milan.att) + " · 20 squadre col loro modulo (" + sq.map(function (s) { return s + " " + MOD[s][0]; }).slice(0, 4).join(", ") + "…): 11 posti, ruoli del modulo, attaccanti sempre davanti, i vostri attaccanti mai in difesa; Inter " + fuori.ovr("Inter") + " con " + inter.join(" e ");
  } });
})();

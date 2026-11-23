// 🏆 LA RIGA «SERATA» SEMPRE INTERA E LE MEDAGLIE PER POSTO (24 nov 2026, chat «🪟 Saletta di vetro», dal Cervello).
// Si carica da sola (copione-prova.js prima). Con prezzo/difetti/foto.js fa anche le foto (W.scatta).
// sm1: le medaglie per posto (1° oro, 2° argento, 3° bronzo, poi «4°»; a pari merito lo stesso posto, il dopo salta).
// sm2: sullo stesso telefono (Patata, la fine chiamata dal tavolo) con 4, 6, 8, 10 persone dai nomi lunghi, a 360x640 e 412x915:
//      la riga «🏆 Classifica della serata» sta in due righe, niente «…», ogni nome intero, chi non ci sta = «e altri N»;
//      le medaglie della classifica di fine partita per posto.
// sm3: online nella Sala in 6 e in 10 coi nomi lunghi (Linea del tempo, la fine dal tavolo), 360x640: la riga «🏆 Serata» intera,
//      sempre il proprio posto, «e altri N» giusto.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no, vm = A.vm;
  if (!W.scatta) W.scatta = async function () {};
  if (!W.misuraTel) W.misuraTel = function (nome, L, Al, x) {
    var f = document.getElementById("tel-" + nome); if (!f) return;
    f.style.transform = "none"; f.style.width = L + "px"; f.style.height = Al + "px"; f.style.left = (x || 0) + "px"; f.style.top = "0px";
    try { f.contentWindow.dispatchEvent(new f.contentWindow.Event("resize")); } catch (e) {}
  };
  function soloFoto() { return !!(W.__pfOpz && W.__pfOpz.solofoto); }
  var LUNGHI = ["Massimiliano P.", "Bartolomeo Russo", "Giovannangelo B", "Mariacristina T", "Annunziata Esp.", "Pierfrancesco G", "Ermenegildo Fa", "Gianfilippo Sca", "Carmelina Ventu", "Leopoldina Ferr"];
  var ATTESE = { "1,2,2,4": "🥇🥈🥈4°", "1,1,3": "🥇🥇🥉", "1,1,2,2": "🥇🥇🥉🥉", "1,2,3,4,5": "🥇🥈🥉4°5°", "1,1,1,4,5": "🥇🥇🥇4°5°", "1,2,2,2,5": "🥇🥈🥈🥈5°" };
  // i posti da gara di una classifica coi pari (punti uguali = stesso posto)
  function postiDi(cl) { var p = []; cl.forEach(function (r, i) { p.push(i && r.punti === cl[i - 1].punti ? p[i - 1] : i + 1); }); return p; }
  function medaglia(posto) { return ["🥇", "🥈", "🥉"][posto - 1] || posto + "°"; }
  // la riga intera? testo, nomi interi, niente «…», sta nelle sue due righe, «e altri N» giusto
  function controllaRiga(nodoTx, nomi, chi, io) {
    var tx = (nodoTx.textContent || "").replace(/ /g, " "), err = [];
    if (/…/.test(tx)) err.push("ci sono i «…»");
    if (nodoTx.scrollHeight > nodoTx.clientHeight + 1) err.push("non ci sta (" + nodoTx.scrollHeight + " su " + nodoTx.clientHeight + ")");
    var visti = nomi.filter(function (n) { return tx.indexOf(n + " ") >= 0; });
    var m = tx.match(/e altri (\d+)/), altri = m ? +m[1] : 0;
    if (visti.length + altri !== nomi.length) err.push("nomi " + visti.length + " + altri " + altri + " ≠ " + nomi.length + " («" + tx + "»)");
    if (io && visti.indexOf(io) < 0) err.push("non c'è il mio posto (" + io + ")");
    var r = nodoTx.getBoundingClientRect();
    if (r.right > nodoTx.ownerDocument.defaultView.innerWidth + 1) err.push("esce di lato");
    return { err: err, tx: tx, visti: visti.length, altri: altri, chi: chi };
  }

  COPIONE.aggiungi("sm1", { nome: "Le medaglie per posto (1° oro, 2° argento, 3° bronzo, poi 4°; i pari lo stesso posto)", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    if (!await W.aspetta(function () { return P.SGCuore && P.SGCuore.medaglieAPari; }, 6000)) no("non trovo medaglieAPari");
    var err = [];
    Object.keys(ATTESE).forEach(function (k) {
      var got = P.SGCuore.medaglieAPari(k.split(",").map(Number)).join("");
      if (got !== ATTESE[k]) err.push("[" + k + "] → " + got + " invece di " + ATTESE[k]);
    });
    if (err.length) no(err.join("; "));
    return Object.keys(ATTESE).map(function (k) { return "[" + k + "] " + ATTESE[k]; }).join(" · ");
  } });

  COPIONE.aggiungi("sm2", { nome: "Sullo stesso telefono: la riga «Classifica della serata» intera e le medaglie per posto (4-10 nomi lunghi)", fai: async function () {
    A.spiaTavolo();
    var esiti = [], nTel = 0;
    for (var n of [4, 6, 8, 10]) {
      for (var mis of [[360, 640], [412, 915]]) {
        var nome = "Tel" + (++nTel), P = await W.apriTel(nome, { x: 0, spiaTav: ["patata"] });
        W.misuraTel(nome, mis[0], mis[1], 1150);
        var nomi = LUNGHI.slice(0, n);
        var tess = await W.aspetta(function () { return A.tessera(P, "La Patata Bollente"); }, 6000); if (!tess) no("non trovo la Patata Bollente");
        tess.click();
        if (!await W.aspetta(function () { return W.clicca(P, /Su questo telefono/, ".modo-grande"); }, 4000)) no("niente «Su questo telefono»");
        if (!await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 3000)) no("non c'è la lista di chi gioca");
        while (P.document.querySelectorAll(".sala-riga input").length < n) { if (!W.clicca(P, /Aggiungi giocatore/)) no("non c'è «＋ Aggiungi giocatore»"); await W.dorme(60); }
        [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = nomi[k]; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
        if (!W.clicca(P, /Avanti/, ".piede button")) no("non c'è «Avanti ▶»");
        if (!await W.aspetta(function () { return W.clicca(P, /^Comincia/, ".piede button"); }, 4000)) no("non c'è «Comincia ▶»");
        var t1 = await W.aspetta(function () { return P.__tav; }, 5000); if (!t1) no("la Patata non parte");
        // la classifica coi pari: il 2° e il 3° a pari, poi gli altri (i posti da gara)
        var cl = nomi.map(function (x, i) { return { nome: x, punti: i === 2 ? 900 - 100 : 900 - 100 * i }; });
        cl[2].punti = cl[1].punti;
        var po = postiDi(cl); cl.forEach(function (r, i) { r.pos = po[i]; });
        t1.fine(cl.map(function (r) { return { nome: r.nome, pos: r.pos, punti: r.punti }; }));
        var bt = await W.aspetta(function () { return P.document.querySelector(".fine-serata .fine-serata-tx") || (soloFoto() && P.document.querySelector(".fine-serata")); }, 4000);
        if (!bt) no("in " + n + " a " + mis.join("x") + " a fine partita non c'è la riga della serata («" + T(P).slice(-120) + "»)");
        await W.dorme(1500);
        var c = controllaRiga(bt, nomi, n + " a " + mis.join("x"));
        var med = [].map.call(P.document.querySelectorAll(".classifica .pos"), function (x) { return x.textContent; }).join("");
        var vuole = po.map(medaglia).join("");
        if (med !== vuole) c.err.push("medaglie " + med + " invece di " + vuole);
        await W.scatta(nome, "sm2-" + n + "-" + mis.join("x"));
        esiti.push(c);
        var fr = document.getElementById("tel-" + nome); if (fr) fr.remove();   // (il telefono finito non pesa sugli altri)
      }
    }
    var rotte = esiti.filter(function (x) { return x.err.length; });
    if (rotte.length && !soloFoto()) no(rotte.map(function (x) { return x.chi + ": " + x.err.join(", "); }).join(" | "));
    return esiti.map(function (x) { return x.chi + " " + x.visti + (x.altri ? "+" + x.altri : "") + " nomi"; }).join(" · ") + " · medaglie per posto";
  } });

  function scenarioSala(n) { return { nome: "Online nella Sala in " + n + " (nomi lunghi, 360x640): la riga «Serata» intera e sempre il mio posto", fai: async function () {
    A.spiaTavolo();
    var esiti = [];
    {
      var amici = LUNGHI.slice(1, n), w = { Paky: await W.apriTel("Paky", { x: 0, salaSempre: true, spiaTav: ["timeline"] }) };
      var S = await A.apriSalaNuova("Paky");
      for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], { hash: "sala=" + S, x: 100 * (i + 1), salaSempre: true, spiaTav: ["timeline"] });
      if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === n; }, 20000)) no("nella Sala non sono entrati in " + n);
      var ultimo = amici[amici.length - 1];
      W.misuraTel("Paky", 360, 640, 1150); W.misuraTel(ultimo, 360, 640, 1530);
      var C = await A.lanciaDallaSala("Paky", S, "La linea del tempo");
      if (!await W.aspetta(function () { return A.ids(C, "giocatori").length === n && A.dentro(w[ultimo]); }, 20000)) no("non sono in " + n + " nella saletta");
      await W.dorme(600);
      W.clicca(w.Paky, /Comincia/, ".sl-go");
      if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 10000)) no("la partita non comincia");
      await W.dorme(1200);
      // la fine: Paky primo, l'ultimo amico ultimo (il suo posto deve vedersi lo stesso)
      var nomi = ["Paky"].concat(amici), cl = nomi.map(function (x, k) { return { nome: x, punti: 1000 - 50 * k, pos: k + 1 }; });
      Object.keys(w).forEach(function (k) { if (w[k].__tav) w[k].__tav.fine(cl); });
      var tx = await W.aspetta(function () { var b = w[ultimo].document.querySelector(".fine-tasti .ft-punti"); return b && !b.hidden ? b.querySelector(".ft-pt-testo") : null; }, 8000);
      if (!tx) no("in " + n + " l'ultimo non ha la riga della serata");
      await W.dorme(1500);
      var c = controllaRiga(tx, nomi, n + " (" + ultimo + ")", ultimo);
      var txP = w.Paky.document.querySelector(".fine-tasti .ft-punti .ft-pt-testo");
      if (txP) { var cP = controllaRiga(txP, nomi, n + " (Paky)", "Paky"); c.err = c.err.concat(cP.err.map(function (e) { return "Paky: " + e; })); }
      await W.scatta(ultimo, "sm3-" + n + "-ultimo"); await W.scatta("Paky", "sm3-" + n + "-Paky");
      esiti.push(c);
    }
    var rotte = esiti.filter(function (x) { return x.err.length; });
    if (rotte.length && !soloFoto()) no(rotte.map(function (x) { return x.chi + ": " + x.err.join(", "); }).join(" | "));
    return esiti.map(function (x) { return x.chi + ": «" + x.tx + "»"; }).join(" · ") + (W.erroriTel().length ? " · ERRORI: " + W.erroriTel().slice(0, 3).join(" / ") : "");
  } }; }
  COPIONE.aggiungi("sm3", scenarioSala(6));
  COPIONE.aggiungi("sm4", scenarioSala(10));
})();

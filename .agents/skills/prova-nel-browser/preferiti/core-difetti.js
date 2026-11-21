// 📸 I DIFETTI DELLA PARTE COMUNE FOTOGRAFATI (21 nov 2026, chat «🪟 Saletta di vetro», dalle cacce ai difetti del Prezzo e della
// Linea del tempo). Si carica dopo preferiti/timeline.js e preferiti/linea-difetti.js; si fa girare con prezzo/difetti/foto.js.
// cdf: sullo stesso telefono «Come giocate?» e le impostazioni (360x640 e 412x915); online nella Sala con la Linea del tempo:
//      la saletta con le regole, l'host che le cambia, Mario che arriva tardi (la pillola), la fila dei punteggi che scorre
//      (il primo e il tasto ‹), i nomi con la «y», la fine con «Serata» e «Avete giocato con». Telefoni: Luca 360x640,
//      Sara 412x915, Mario 360x640 (arriva tardi). Con prova.js W.scatta non fa niente: resta una prova che arriva in fondo.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no, vm = A.vm;
  if (!W.scatta) W.scatta = async function () {};
  if (!W.misuraTel) W.misuraTel = function (nome, L, Al, x) {
    var f = document.getElementById("tel-" + nome); if (!f) return;
    f.style.transform = "none"; f.style.width = L + "px"; f.style.height = Al + "px"; f.style.left = (x || 0) + "px"; f.style.top = "0px";
    try { f.contentWindow.dispatchEvent(new f.contentWindow.Event("resize")); } catch (e) {}
  };
  function vis(e) { if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }

  COPIONE.aggiungi("cdf", { nome: "Foto: i difetti della parte comune", fai: async function () {
    var o = W.__pfOpz || {}, nf = 0, diario = W.__pfLog = [];
    async function foto(nome, cosa) {
      var w = W.finestra(nome); if (!w) return;
      var file = String(++nf).padStart(2, "0") + "-" + cosa + "-" + nome;
      diario.push({ file: file, testo: T(w).replace(/\s+/g, " ").slice(0, 300) });
      await W.scatta(nome, file);
    }
    // ===== A. sullo stesso telefono: «Come giocate?» e le impostazioni, basso e alto =====
    var loc = [["Ugo", 360, 640], ["Tea", 412, 915]];
    for (var q = 0; q < loc.length; q++) {
      var nm = loc[q][0], P = await W.apriTel(nm, { x: 0 });
      W.misuraTel(nm, loc[q][1], loc[q][2], 1150);
      await W.dorme(600);
      var tess = await W.aspetta(function () { return A.tessera(P, "La linea del tempo"); }, 8000); if (!tess) no("non trovo la tessera");
      tess.click(); await W.dorme(1200); await foto(nm, "come-giocate");
      if (!await W.aspetta(function () { return W.clicca(P, /Su questo telefono/); }, 8000)) no("non c'è «Su questo telefono»");
      await W.dorme(700);
      if (await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 3000)) {
        while (P.document.querySelectorAll(".sala-riga input").length < 2) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
        [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = ["Paky", "Giulia"][k] || c.value; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
      }
      for (var k = 0; k < 6 && !P.document.querySelector(".stepper"); k++) {
        var b2 = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Avanti|▶/.test(x.textContent) && !x.disabled; });
        if (!b2) break; b2.click(); await W.dorme(600);
      }
      if (!P.document.querySelector(".stepper")) no(nm + ": non arrivo alle impostazioni");
      await W.dorme(900); await foto(nm, "impostazioni");
    }
    // ===== B. online nella Sala =====
    var amici = ["Luca", "Sara", "Gina"];
    var Z = await A.salaConAmici(amici);
    var C = await A.lanciaDallaSala("Paky", Z.S, "La linea del tempo"), PK = W.finestra("Paky");
    var oo = { C: C, giusto: 0.6, ruba: 0 };
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 4; }, 15000)) no("nella saletta non arrivano tutti");
    W.misuraTel("Luca", 360, 640, 1150); W.misuraTel("Sara", 412, 915, 1530);
    await W.dorme(1800);
    await foto("Luca", "saletta"); await foto("Sara", "saletta");
    // l'host cambia le regole: «Tutti insieme» e due carte in meno
    if (!await W.aspetta(function () { return W.clicca(PK, /Regole/, ".sl-regole, button"); }, 5000)) no("non trovo ⚙️ Regole");
    await W.dorme(400);
    var f = PK.document.querySelector(".sl-foglio"); if (!f) no("il foglio delle regole non si apre");
    var tutti = [].find.call(f.querySelectorAll(".modo-chip"), function (x) { return /Tutti insieme/.test(x.textContent) && vis(x); }); if (tutti) tutti.click();
    await W.dorme(150);
    for (var i = 0; i < 3; i++) { var m = [].find.call(f.querySelectorAll(".stepper button"), vis); if (m) m.click(); await W.dorme(60); }
    W.clicca(PK, /Fatto/, ".sl-foglio button");
    await W.dorme(900);
    await foto("Luca", "regole-cambiate"); await foto("Sara", "regole-cambiate");
    if (!await W.aspetta(function () { return W.clicca(PK, /Comincia/, ".sl-go"); }, 8000)) no("Paky non trova «Comincia»");
    // la partita: tutti giocano col giocatore automatico; Mario arriva tardi alla seconda carta
    var giocano = ["Paky"].concat(amici), rit = { Paky: 2500, Luca: 3000, Sara: 4000, Gina: 3500, Mario: 3000 }, visto = {}, fino = Date.now() + 600000;
    var mario = false, pillVista = {}, scorsa = 0, nCarte = 0, kC = "";
    while (Date.now() < fino) {
      var v = vm(C) || {};
      if (v.fase === "fine") break;
      var kc = (v.fase || "") + "|" + (v.carta ? v.carta.titolo : "");
      if (kc !== kC) { kC = kc; if (v.fase === "tutti" || v.fase === "turno") nCarte++; }
      if (!mario && nCarte >= 2) {
        mario = true; await W.apriTel("Mario", { hash: "gioco=timeline&stanza=" + C, x: 1000, salaSempre: true }); W.misuraTel("Mario", 360, 640, 1950); giocano.push("Mario");
      }
      // le pillole di Mario (la grigia «Partita in corso…» e la verde «Sei dentro!»): una foto per ognuna
      var MW = mario && W.finestra("Mario");
      var daFare = [];
      if (MW) [].forEach.call(MW.document.querySelectorAll(".sg-pillola"), function (p) {
        var kp = /Sei dentro/.test(p.textContent) ? "dentro" : (/Partita in corso/.test(p.textContent) ? "corso" : "");
        if (kp && !pillVista[kp]) { pillVista[kp] = 1; daFare.push(kp); }
      });
      for (var dp = 0; dp < daFare.length; dp++) await foto("Mario", "pillola-" + daFare[dp]);
      // la fila dei punteggi che scorre (col dito): una volta col risultato in vista, Luca (360) e Mario
      if (mario && scorsa < 2 && /tEsito|esito/i.test(v.fase || "") && (vm(C).giocatori || []).length >= 5) {
        for (var nn of ["Luca", "Mario"]) {
          var w2 = W.finestra(nn); if (!w2) continue;
          var sc = w2.document.querySelector(".stp-scorre") || w2.document.querySelector(".stp-punti.riga .stp-riga");
          if (sc && sc.scrollWidth > sc.clientWidth + 4) { sc.scrollLeft = 70 + 60 * scorsa; await W.dorme(250); await foto(nn, "fila-scorre"); }
        }
        await foto("Sara", "fila-alta");
        scorsa++;
      }
      var chiave = kc;
      for (var j = 0; j < giocano.length; j++) {
        var g = giocano[j], kk = chiave + "|" + g;
        if (!visto[kk]) visto[kk] = Date.now();
        if (Date.now() - visto[kk] < (rit[g] || 3000)) continue;
        try { await W.TLagisci(g, oo); } catch (e) {}
      }
      await W.dorme(200);
    }
    if ((vm(C) || {}).fase !== "fine") no("la partita non arriva alla fine");
    await W.dorme(3500);
    for (var nf2 of ["Luca", "Sara", "Mario", "Paky"]) await foto(nf2, "fine");
    return nf + " foto · " + (W.erroriTel().length ? "ERRORI: " + W.erroriTel().slice(0, 4).join(" / ") : "nessun errore");
  } });
})();

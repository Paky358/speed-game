// PROVA «I RILANCI DELL'OSPITE VANNO LISCI» NELLA MINI ASTA (26 nov 2026, il proprietario da ospite, in 2: «lagga un pochino durante i rilanci,
// giusto un po' più che per l'host»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-rilanci.js"); await COPIONE.prova("lr1")
// Con Edge invisibile: prova.js --porta 8995 --carica preferiti/asta.js,preferiti/asta-rilanci.js --prova lr1
// Le misure (fotogrammi e lavoro di ogni telefono a ogni foto): .agents/skills/prova-nel-browser/asta-grafica/scatti-rilanci.js
//
// lr1 Online in 2 (Paky tiene la partita, Giulia ospite), la rete lenta (250 ms a messaggio). Giulia rilancia più volte, anche su sé stessa (il
//     rialzo da solo), e Paky rilancia: a OGNI tocco la barra del tempo di chi tocca riparte subito (entro un fotogramma), e quando arriva la foto
//     che lo conferma la barra dell'ospite NON riparte di nuovo (prima ripartiva solo con la foto: scendeva ancora un attimo e poi saltava su).
//     I prezzi finiscono giusti su tutti e due i telefoni.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function q(w, s) { return w.document.querySelector(s); }
  function vm(C) { return W.vmDi(C) || {}; }
  function piu(w) { return [].slice.call(w.document.querySelectorAll(".st-piede .btn")).filter(function (x) { return !x.disabled && !/Passo/.test(x.textContent) && x.getClientRects().length; })[0] || null; }
  function anim(w) { var b = q(w, ".sa-tempo i"); var l = b && b.getAnimations ? b.getAnimations() : []; return l[l.length - 1] || null; }
  COPIONE.aggiungi("lr1", { nome: "Mini Asta online in 2 con la rete lenta: al tocco dell'ospite la barra del tempo riparte subito e non salta quando arriva la foto", fai: async function () {
    var imp = { formato: "fanta", giornata: false }, x = [];
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    var G = await W.apriTel("Giulia", { hash: "gioco=astafanta&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 2; }, 15000)) no("Giulia non entra");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "asta" && q(G, ".sa-tempo i") && piu(G); }, 15000)) no("l'asta non comincia");
    await W.dorme(1500);
    var ritardo = W.BR.ritardo; W.BR.ritardo = 250;
    try {
      var giro = [["Giulia", G], ["Giulia", G], ["Paky", P], ["Giulia", G], ["Giulia", G], ["Paky", P]], ok = 0;
      for (var i = 0; i < giro.length; i++) {
        var chi = giro[i][0], w = giro[i][1], v0 = vm(C), a0 = v0.asta; if (v0.fase !== "asta" || !a0) break;
        var b = piu(w); if (!b) { x.push(chi + ": niente tasto (" + v0.fase + ")"); break; }
        var prima = anim(w); b.click();
        var dopo = anim(w);
        if (!dopo || dopo === prima) no(chi + ", tocco " + (i + 1) + ": la barra del tempo non riparte al tocco");
        if ((dopo.currentTime || 0) > 120) no(chi + ", tocco " + (i + 1) + ": la barra non riparte da capo (" + Math.round(dopo.currentTime) + " ms)");
        // la foto che conferma il tocco arriva (rete lenta): la barra dell'ospite non deve ripartire di nuovo
        var atteso = a0.leaderId ? a0.offerta + 1 : a0.offerta;
        if (!await W.aspetta(function () { var a = vm(C).asta; return vm(C).fase !== "asta" || (a && a.offerta >= atteso); }, 4000)) no(chi + ": il rilancio non arriva a chi tiene la partita");
        if (vm(C).fase !== "asta") break;
        await W.dorme(700);   // (la foto arriva a Giulia 250 ms dopo, più il disegno)
        if (chi === "Giulia") {
          var ora = anim(G);
          if (ora !== dopo) no("Giulia, tocco " + (i + 1) + ": quando arriva la foto la barra riparte di nuovo (salta)");
        }
        ok++;
      }
      // i prezzi giusti su tutti e due i telefoni (il maxischermo)
      await W.dorme(600);
      var pP = (q(P, ".st-prezzo b") || {}).textContent, pG = (q(G, ".st-prezzo b") || {}).textContent;
      if (vm(C).fase === "asta" && pP !== pG) no("il prezzo sul maxischermo non è uguale: Paky " + pP + ", Giulia " + pG);
      x.push(ok + " tocchi (Giulia anche due di fila, Paky): la barra riparte subito al tocco, all'arrivo della foto non salta; prezzo " + pP + " su tutti e due");
    } finally { W.BR.ritardo = ritardo; }
    return x.join(" · ");
  } });
})();

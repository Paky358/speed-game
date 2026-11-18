// PROVA DELLE PAGINE DELLE PAGELLE DELLA MINI ASTA (18 nov 2026, il proprietario: «a volte stanno tutte in una pagina e a volte no»: in 5, una
// partita tutte e 5 in una pagina, la dopo 3 e 2, anche se il posto c'era. Si misurava una rosa sola, e i simboli dei bonus che vanno a capo
// cambiavano la misura). Ora pagineRose misura TUTTE le rose; fino a 6 sempre una pagina sola (stretta se serve).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta-pagine.js"); await COPIONE.prova("pf1")
// Con Edge invisibile: prova.js --porta 8991 --carica preferiti/asta-pagine.js --prova pf1
//
// pf1 Senza partita, con lo stile vero del gioco: su 360x640, 390x844 e 412x915, da 2 a 10 rose, 40 giornate a testa con voti e bonus
//     diversi (da 0 a 6 simboli per calciatore, nomi lunghi e corti), pagelle finali e dell'intervallo: fino a 6 rose SEMPRE una pagina sola;
//     per lo stesso telefono e lo stesso numero di rose le pagine sono sempre le stesse; ogni pagina ci sta davvero (niente tagliato) e ogni
//     simbolo dei bonus sta dentro la sua casella.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  async function motore(w) {
    if (w.SG && w.SG.scaricaGioco) await w.SG.scaricaGioco("asta");
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {}, ag = "function costruisciMazzoFanta(n) {";
    if (src.indexOf(ag) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    if (src.indexOf("function pagineRose(") < 0) no("nel gioco non c'è pagineRose");
    src = src.replace(ag, "FUORI.pagine = pagineRose; FUORI.misuraPv = misuraPv; FUORI.bonusIcone = bonusIcone; FUORI.classeVoto = classeVoto; " + ag);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, F);
    return F;
  }
  var NOMI = ["Lautaro", "Dimarco", "Calhanoglu", "Kvaratskhelia", "Dumfries", "Sommer", "Ndicka", "Pellegrini", "Zaccagni", "Di Lorenzo", "Barella", "Thuram"];
  var SIMBOLI = ["⚽", "👟", "🧤", "❌", "🙈", "🟨", "🟥", "🥅", "🔒"];
  function caso(seme) { var x = seme % 2147483647 || 1; return function () { x = x * 16807 % 2147483647; return (x - 1) / 2147483646; }; }
  COPIONE.aggiungi("pf1", { nome: "Fanta, le pagelle: fino a 6 rose sempre in una pagina, le pagine uguali per lo stesso telefono e lo stesso numero di rose, qualunque bonus", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), d = w.document, ko = [], visto = {};
    function mk(tag, cls, txt) { var e = d.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
    function blocco(rnd, fin, k) {   // una rosa come nel gioco (5 calciatori, voti, fantavoti e simboli a caso)
      var tiles = ["P", "D", "C", "C", "A"].map(function (ru) {
        var v = 5 + Math.round(rnd() * 6) / 2, ic = "", q = Math.floor(rnd() * rnd() * 7); for (var i = 0; i < q; i++) ic += SIMBOLI[Math.floor(rnd() * SIMBOLI.length)];
        var t = mk("div", "st-pv " + (fin ? "nasc " : "") + M.classeVoto(v)); t.appendChild(mk("i", "as-rb-" + ru)); t.appendChild(mk("span", "", NOMI[Math.floor(rnd() * NOMI.length)]));
        var num = mk("div", "st-pv-num"), c1 = mk("div", "st-pv-c"), c2 = mk("div", "st-pv-c fv"); c1.appendChild(mk("b", "", String(v).replace(".", ","))); c1.appendChild(mk("small", "", "voto")); c2.appendChild(mk("b", "", String(v + 1).replace(".", ","))); c2.appendChild(mk("small", "", "fanta")); num.appendChild(c1); num.appendChild(c2); t.appendChild(num);
        t.appendChild(M.bonusIcone(mk("em", "st-pv-ic"), ic)); return t;
      });
      var b = mk("div", "st-pag-p" + (fin ? " st-pfb" : "")), te = mk("div", "st-pag-testa" + (fin ? " st-pf-testa" : "")), img = mk("img"); img.alt = ""; te.appendChild(img); te.appendChild(mk("span", "", ["Paky", "Giulia", "Luca", "Marta", "IL PAPPONE", "Sara"][k % 6]));
      if (fin) { te.appendChild(mk("i", "st-pf-pos", "1°")); te.appendChild(mk("b", "st-pf-tot", "34,5")); } else te.appendChild(mk("b", "", "34,5"));
      b.appendChild(te); var vo = mk("div", "st-pag-voti"); tiles.forEach(function (t) { vo.appendChild(t); }); b.appendChild(vo); return b;
    }
    var schermo = mk("div", "schermata st-rivela gio oro"); schermo.style.cssText = "position:fixed;left:0;top:0;z-index:99999;background:#0d1020;display:flex;flex-direction:column;"; d.body.appendChild(schermo);
    var gio = mk("div", "st-gio"); schermo.appendChild(gio); var pag = mk("div", "st-pag"); gio.appendChild(pag);
    [[360, 640], [390, 844], [412, 915]].forEach(function (mis) {
      schermo.style.width = mis[0] + "px"; schermo.style.height = mis[1] + "px"; gio.style.height = (mis[1] - 12) + "px";
      [true, false].forEach(function (fin) {
        for (var n = 2; n <= 10; n++) {
          var chiave = mis.join("x") + (fin ? " finali" : " intervallo") + " in " + n, per0 = null;
          for (var g = 0; g < 40; g++) {
            var rnd = caso(n * 1000 + g * 37 + (fin ? 7 : 3)), bl = []; for (var k = 0; k < n; k++) bl.push(blocco(rnd, fin, k));
            pag.style.top = "8px";
            var tM = mk("div", "st-pag-tit", "📋 La pagella · 1/2"), bM = mk("button", "btn st-pag-av", "Avanti ▶ (20)"), sc = M.pagine(pag, bl, tM, bM, fin ? "st-pag fin" : "st-pag");
            if (per0 == null) per0 = sc.per; else if (sc.per !== per0) { ko.push(chiave + ": le pagine cambiano (" + per0 + " poi " + sc.per + " per pagina)"); break; }
            if (n <= 6 && sc.per < n) { ko.push(chiave + ": non stanno in una pagina (" + sc.per + " per pagina, " + (sc.liv || "normale") + ")"); break; }
            visto[chiave] = sc.per + (sc.liv ? " " + sc.liv : "");
            // ogni pagina ci sta davvero e i simboli stanno nelle caselle
            for (var i = 0; i < n; i += sc.per) {
              var cls = pag.className; while (pag.firstChild) pag.removeChild(pag.firstChild); pag.className = cls;
              pag.appendChild(tM); bl.slice(i, i + sc.per).forEach(function (b) { pag.appendChild(b); }); pag.appendChild(bM); M.misuraPv(pag);
              var ult = bl.slice(i, i + sc.per).pop(), cs3 = w.getComputedStyle(pag), fondo = ult.offsetTop + ult.offsetHeight + (parseFloat(cs3.rowGap) || 0) + bM.offsetHeight + (parseFloat(w.getComputedStyle(bM).marginBottom) || 0);   // (le posizioni vere: le rose entrano con un'animazione)
              if (fondo > pag.clientHeight - (parseFloat(cs3.paddingBottom) || 0) + 1) { var cs2 = w.getComputedStyle(pag); ko.push(chiave + " (giornata " + g + "): la pagina " + (i / sc.per + 1) + " non ci sta (" + Math.round(fondo) + " su " + pag.clientHeight + "; tit " + tM.getBoundingClientRect().height + ", rose " + bl.slice(i, i + sc.per).map(function (b) { return Math.round(b.getBoundingClientRect().height); }).join("+") + ", tasto " + bM.getBoundingClientRect().height + " mb " + w.getComputedStyle(bM).marginBottom + ", gap " + cs2.rowGap + ", pad " + cs2.paddingTop + "/" + cs2.paddingBottom + ", liv " + sc.liv + ")"); break; }
              [].forEach.call(pag.querySelectorAll(".st-pv"), function (t) { var r = t.getBoundingClientRect(); [].forEach.call(t.querySelectorAll(".st-pv-ic .ic"), function (ic) { var q = ic.getBoundingClientRect(); if (q.bottom > r.bottom + 1 || q.top < r.top - 1 || q.right > r.right + 1) ko.push(chiave + ": un simbolo esce dalla casella"); }); });
            }
            if (ko.length > 12) break;
          }
          if (ko.length > 12) break;
        }
      });
    });
    schermo.remove();
    if (ko.length) no(ko.length + " problemi: " + ko.slice(0, 6).join(" · "));
    return ["360x640", "390x844", "412x915"].map(function (m) { return m + ": finali " + [2, 4, 5, 6, 8, 10].map(function (n) { return n + "→" + visto[m + " finali in " + n]; }).join(", ") + "; intervallo " + [5, 6, 8, 10].map(function (n) { return n + "→" + visto[m + " intervallo in " + n]; }).join(", "); }).join(" · ");
  } });
})();

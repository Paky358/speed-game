// PROVE DELLA CACCIA AI DIFETTI DELLA RUOTA (23 nov 2026). Dopo copione-prova.js e preferiti/ruota2.js (la spia delle regole).
// rd1: online in 3, telefono basso 360x640: dopo ogni giro (6 giri) passati 2,5 secondi la ruota non è più ingrandita sulla lancetta
//      su nessun telefono (prima, se dopo il giro arrivava l'Express, il Mistero o la scelta della consonante, restava ingrandita e tagliata);
//      i punteggi in alto non sono mai tagliati (numero e «in gioco» interi, i 4 riquadri larghi uguali).
// rd2: la busta: finché non si apre, la riga in basso non dice la cifra (sullo stesso motore: vince Paky contro i Bot).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti;
  function no(p) { throw new Error("NO: " + p); }
  function vm(C) { return W.vmDi(C) || {}; }
  function tocca(w, b) { if (!b) return false; var Ev = w.PointerEvent || w.MouseEvent; ["pointerdown", "pointerup"].forEach(function (t) { b.dispatchEvent(new Ev(t, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); }); b.click(); return true; }
  function tasto(w, re) { return [].find.call(w.document.querySelectorAll(".ru-azioni button"), function (b) { return re.test(b.textContent) && !b.disabled && b.getClientRects().length > 0; }) || null; }
  function lettera(w, L) { return [].find.call(w.document.querySelectorAll(".ru-qwerty .ru-btn.lettera"), function (b) { return b.textContent === L && !b.disabled && b.getClientRects().length > 0; }) || null; }
  async function apri(nome, opz) { var w = await W.apriTel(nome, opz), f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "640px"; w.dispatchEvent(new w.Event("resize")); return w; }
  function chipOk(w, nome) {
    var d = w.document, ch = [].slice.call(d.querySelectorAll(".ru-flat .ru-chip")), pb = [];
    if (!ch.length) return "";
    var larg = ch.map(function (c) { return Math.round(c.getBoundingClientRect().width); });
    if (Math.max.apply(null, larg) - Math.min.apply(null, larg) > 2) pb.push("riquadri diversi " + larg.join(","));
    ch.forEach(function (c) { [c.querySelector("b"), c.querySelector("small")].forEach(function (e) { if (e && e.textContent && e.scrollWidth > e.clientWidth + 1) pb.push("tagliato «" + e.textContent + "»"); }); });
    return pb.length ? nome + ": " + pb.join(", ") : "";
  }
  COPIONE.aggiungi("rd1", { nome: "Ruota: dopo il giro la ruota torna intera su tutti i telefoni (anche con Express e consonante), punteggi mai tagliati", fai: async function () {
    var IMP = { manche: 2, prenota: false, express: true, veloce: false, mistero: true, finale: false }, F = {}, L = [];
    F.Paky = await apri("Paky", { x: 0, spiaRv: true, prima: function (w) { w.__impR = IMP; } });
    var C = await W.apriStanza(F.Paky, "La Ruota della Fortuna");
    F.Giulia = await apri("Giulia", { hash: "gioco=ruota&stanza=" + C, x: 380 });
    F.Luca = await apri("Luca", { hash: "gioco=ruota&stanza=" + C, x: 760 });
    if (!await W.aspetta(function () { return A.contaDentro(vm(C)) === 3; }, 12000)) no("in saletta non sono in 3");
    await W.dorme(500);
    if (!await W.aspetta(function () { return W.clicca(F.Paky, /Comincia/); }, 6000)) no("niente «Comincia»");
    var nomeDi = {}, giri = 0, zoomati = [], chipPb = [], t0 = Date.now();
    while (giri < 6 && Date.now() - t0 < 150000) {
      var v = vm(C);
      (v.giocatori || []).forEach(function (g) { nomeDi[g.id] = g.nome; });
      var w = F[nomeDi[v.turno]];
      if (v.fase === "gira" && w && w.document.querySelector(".ru-alto.tocca .ru-piatto-alto")) {   // (27 nov 2026: niente tasto «Gira», si spinge la ruota col dito)
        var g0 = v.giroN; await W.spingiRuota(w, 0.6);
        if (!await W.aspetta(function () { return vm(C).giroN !== g0; }, 4000)) continue;
        await W.aspetta(function () { return vm(C).fase !== "girando"; }, 12000);
        var dopoF = vm(C).fase; await W.dorme(2500); giri++;
        ["Paky", "Giulia", "Luca"].forEach(function (n) {
          var d = F[n].document, al = d.querySelector(".ru-alto"), pa = d.querySelector(".ru-alto .ru-piatto-alto");
          if (al && al.classList.contains("vicino")) zoomati.push(n + " dopo il giro (" + dopoF + ")");
          else if (al && al.classList.contains("on") && pa) { var a = pa.getBoundingClientRect(), r = al.getBoundingClientRect(); if (a.bottom > r.bottom + 1 || a.top < r.top - 30 || a.left < -1 || a.right > F[n].innerWidth + 1) zoomati.push(n + " ruota tagliata (" + dopoF + ")"); }
          var c = chipOk(F[n], n); if (c) chipPb.push(c);
        });
        L.push(dopoF);
        // chi sceglie: una consonante qualunque (o l'Express: «gioco 1.000 e basta»; il Mistero: mi tengo i soldi)
        var Pp = F.Paky.__RUOTA.ultima, att = F[nomeDi[vm(C).turno]];
        if (vm(C).fase === "sceltaexp") tocca(att, tasto(att, /Gioco/));
        if (vm(C).fase === "mistero") tocca(att, tasto(att, /Mi tengo/));
        await W.dorme(600);
        if (vm(C).fase === "consonante" && att) { var c2 = "BCDFGHLMNPRSTVZ".split("").filter(function (x) { return !Pp.chiamate[x]; })[0]; tocca(att, lettera(att, c2)); await W.dorme(400); tocca(att, lettera(att, c2)); }
      } else if (v.fase === "risolvi" || v.fase === "vocale") { await W.dorme(500); }
      await W.dorme(300);
    }
    if (giri < 3) no("si gira solo " + giri + " volte");
    if (zoomati.length) no("ruota ancora ingrandita: " + zoomati.slice(0, 4).join("; "));
    if (chipPb.length) no("punteggi: " + chipPb.slice(0, 3).join("; "));
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return giri + " giri, dopo: " + L.join(", ") + " · ruota intera dopo 2,5 s su tutti · punteggi interi";
  } });


  // rd2: sullo stesso telefono in 2, quando il turno passa all'altro compare in grande «📱 Tocca a Giulia» (e sparisce da sola)
  COPIONE.aggiungi("rd2", { nome: "Ruota sullo stesso telefono: «📱 Tocca a …» in grande quando cambia il turno", fai: async function () {
    var P = await apri("Paky", { x: 0 });
    var tess = await W.aspetta(function () { return A.tessera(P, "La Ruota della Fortuna"); }, 8000); if (!tess) no("non trovo la Ruota"); tess.click(); await W.dorme(400);
    if (!W.clicca(P, /Sullo stesso telefono/, ".modo-grande")) no("niente «Sullo stesso telefono»");
    await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 4000);
    while (P.document.querySelectorAll(".sala-riga input").length < 2) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = ["Paky", "Giulia"][k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    W.clicca(P, /Avanti/); await W.dorme(400);
    [].forEach.call(P.document.querySelectorAll(".modo-chip"), function (x) { if (/Giochi veloci/.test(x.textContent) && /attiva/.test(x.className)) x.click(); });
    if (!W.clicca(P, /Comincia/)) no("niente «Comincia»");
    var R = P.__RUOTA, visti = [], t0 = Date.now();
    if (!await W.aspetta(function () { return R.ultima && R.ultima.fase === "gira" && R.H && !R.H.sigla; }, 60000)) no("non comincia");
    var on = false; var o = new P.MutationObserver(function () { var e = P.document.querySelector(".ru-passa"); if (e && e.classList.contains("on")) { on = true; visti.push(e.textContent); } });
    o.observe(P.document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });
    var primo = R.ultima.giocatori[R.ultima.turno].nome;
    // chi ha il turno chiama una consonante che non c'è: il turno passa
    var storia = [];
    for (var k = 0; k < 60 && !on; k++) {
      var Q = R.ultima; var sk = Q.fase + ":" + Q.turno; if (storia[storia.length - 1] !== sk) storia.push(sk);
      if (Q.fase === "gira" && P.document.querySelector(".ru-alto.tocca .ru-piatto-alto")) await W.spingiRuota(P, 0.6);
      if (Q.fase === "consonante") { var L = "BCDFGHLMNPRSTVZ".split("").filter(function (x) { return Q.frase.indexOf(x) < 0 && !Q.chiamate[x]; })[0] || "Q"; var b = lettera(P, L); if (b) { tocca(P, b); await W.dorme(300); b = lettera(P, L); if (b) tocca(P, b); } }
      await W.dorme(900);
    }
    o.disconnect();
    var pe = P.document.querySelector(".ru-passa"); if (!on) no("quando il turno passa non compare «Tocca a …» (" + storia.join(" ") + ") · elemento " + (pe ? "c'è, testo «" + pe.textContent + "» classi " + pe.className + " piatto " + !!(P.SGStudio && P.SGStudio.piatto) : "manca"));
    if (!/📱 Tocca a /.test(visti[0])) no("la scritta è «" + visti[0] + "»");
    await W.dorme(2200);
    var e = P.document.querySelector(".ru-passa"), op = +P.getComputedStyle(e).opacity;
    if (op > 0.05) no("la scritta resta (opacità " + op + ")");
    var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" / "));
    return "primo turno " + primo + ", poi «" + visti[0] + "», sparita dopo 2 s";
  } });
})();
// PROVE DEI PUNTI DEL PROPRIETARIO DOPO LA SERATA VERA (13 nov 2026, 2 ore di Mini Asta con gli amici: «troppo divertente»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-overall.js");
// Con Edge invisibile: prova.js --porta 8991 --carica preferiti/asta.js,preferiti/asta-overall.js --prova ov1,ov2,ov3 --timeout 1500
//
// ov1 Senza telefoni: nel ⚙️ «⭐ L'overall all'asta» (di partenza «Segreto», «Visibile» si accende), il riassunto sotto i 90 caratteri anche
//     con tutte le scelte accese, le regole ne parlano.
// ov2 Online in 3 con «⭐ L'overall all'asta» acceso: sul maxischermo di Giulia «⭐ 84» col calciatore all'asta; comprato, nel suo campetto
//     c'è il suo overall; il fumetto del banditore sta sempre SOTTO la barra del tempo; nella formazione finale le figurine sono già
//     scoperte e i valori arrivano dal più scarso al più forte; nella giornata (col ⏩) le icone dei quadretti ci stanno tutte e nelle
//     pagelle del primo tempo tutti i voti hanno la stessa misura e bonus e malus si vedono interi.
// ov3 Online in 3 come sempre (overall segreto): niente «⭐» sul maxischermo né nei campetti, e nella formazione finale i valori arrivano
//     lo stesso dal più scarso al più forte.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function mk(tag, a, figli) { var e = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { if (k === "class") e.className = a[k]; else if (k === "text") e.textContent = a[k]; else if (k === "style") e.style.cssText = a[k]; else if (k.slice(0, 2) === "on") e[k] = a[k]; else e.setAttribute(k, a[k]); }); (figli || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }

  COPIONE.aggiungi("ov1", { nome: "Mini Asta Fantacalcio, ⚙️ «⭐ L'overall all'asta»: di partenza segreto, si accende, riassunto e regole", fai: async function () {
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), g = {};
    new Function("SG", src)({ registra: function (x) { if (x.id === "astafanta") Object.assign(g, x); }, bot: W.SG && SG.bot });
    var box = document.createElement("div"), dove = {};
    g.impostazioni(box, dove, { el: mk, modo: "online" });
    var chip = function (re) { return [].filter.call(box.querySelectorAll(".modo-chip"), function (b) { return re.test(b.textContent); })[0]; };
    if (!/L'overall all'asta/.test(box.textContent)) no("nel ⚙️ non c'è «⭐ L'overall all'asta»");
    if (dove.ovrAsta !== false || !/attiva/.test(chip(/Segreto/).className)) no("di partenza l'overall all'asta non è segreto: " + dove.ovrAsta);
    chip(/Visibile/).click(); if (dove.ovrAsta !== true || !/attiva/.test(chip(/Visibile/).className)) no("«Visibile» non si accende");
    var r1 = g.riassunto({ formato: "fanta", ovrAsta: true }), r2 = g.riassunto({ formato: "fanta", compra: "big", giornate: 3, ovrAsta: true }), r0 = g.riassunto({ formato: "fanta" });
    if (!/⭐ overall all'asta/.test(r1) || !/⭐ overall all'asta/.test(r2) || r2.length > 90 || /⭐/.test(r0)) no("riassunti: «" + r0 + "» / «" + r1 + "» / «" + r2 + "» (" + r2.length + ")");
    if (!/L'overall all'asta<\/b> \(nel ⚙️, spento di partenza\)/.test(g.regole.join(" "))) no("le regole non parlano dell'overall all'asta");
    return "di partenza «Segreto», «Visibile» si accende · «" + r2 + "» (" + r2.length + ")";
  } });

  async function telefoni(imp) {
    var NOMI = ["Paky", "Giulia", "Luca"];
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    for (var i = 1; i < NOMI.length; i++) await W.apriTel(NOMI[i], { hash: "gioco=astafanta&stanza=" + C, x: 200 * i });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === NOMI.length; }, 15000)) no("non entrano tutti");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    return { P: P, C: C, G: W.finestra("Giulia"), L: W.finestra("Luca") };
  }
  // l'asta veloce; a ogni passo guarda(v) per i controlli sui telefoni
  async function asta(o, guarda) {
    var P = o.P, C = o.C, fino = Date.now() + 300000, visti = {};
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), a = v.asta;
      if (guarda) guarda(v);
      if (v.fase !== "asta" || !a || visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId]) { await W.dorme(150); continue; }
      visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1;
      var elegg = v.giocatori.filter(function (g) { return (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
      if (!a.leaderId) { var pr = v.giocatori.filter(function (g) { return elegg.indexOf(g.nome) >= 0 && g.max >= a.offerta; })[a.nCarta % 2] || v.giocatori.filter(function (g) { return elegg.indexOf(g.nome) >= 0 && g.max >= a.offerta; })[0]; if (pr) { if (pr.nome === "Paky") { var bt = bott(P, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } else W.reteDi(pr.nome).invia({ t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta }); } }
      else elegg.forEach(function (n) { if (idDi(n) === a.leaderId) return; if (n === "Paky") { var bp = bott(P, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } else W.reteDi(n).invia({ t: "passa", n: a.nCarta }); });
      await W.dorme(250);
    }
    if (vm(C).fase !== "fine") no("l'asta non finisce");
  }
  // la formazione finale di Giulia: l'ordine in cui compaiono i valori sulle figurine (deve salire), e se partono coperte
  async function formazione(w, x) {
    if (!await W.aspetta(function () { return q(w, ".st-rivela .st-campo"); }, 15000)) no("niente classifica delle rose");
    var visti = [], fino = Date.now() + 9000;
    while (Date.now() < fino && visti.length < 5) {
      qa(w, ".st-campo .st-slot").forEach(function (s, i) { var v = s.querySelector(".st-val"); if (v && v.classList.contains("su") && !visti.some(function (y) { return y.i === i; })) visti.push({ i: i, v: +v.textContent }); });
      await W.dorme(60);
    }
    if (visti.length < 5) no("nella formazione finale non compaiono 5 valori (" + visti.length + ")");
    for (var k = 1; k < visti.length; k++) if (visti[k].v < visti[k - 1].v) no("la formazione non va dal più scarso al più forte: " + visti.map(function (y) { return y.v; }).join(", "));
    x.push("formazione: " + visti.map(function (y) { return y.v; }).join(" → "));
    return visti;
  }

  COPIONE.aggiungi("ov2", { nome: "Mini Asta Fantacalcio online in 3 con «⭐ L'overall all'asta»: maxischermo, campetti, fumetto sotto il tempo, formazione in ordine, icone dei quadretti, voti delle pagelle", fai: async function () {
    var o = await telefoni({ formato: "fanta", ovrAsta: true, giornate: 3 }), G = o.G, P = o.P, x = [], visto = { ovr: 0, campo: 0, fum: 0, vs: 0 }, carta = {};
    await asta(o, function () {
      // (13 nov 2026) l'overall degli avversari sempre intero: guardato un secondo e mezzo dopo che il calciatore è arrivato
      [P, G].forEach(function (w, j) {
        var vs = q(w, ".st-vs"), nm = (q(w, ".st-nome") || {}).textContent || "", kk = j + nm; if (!vs || !nm || vs.style.display === "none") return;
        if (!carta[kk]) { carta[kk] = Date.now(); return; } if (carta[kk] < 0 || Date.now() - carta[kk] < 1500) return; carta[kk] = -1; visto.vs++;
        var r = vs.getBoundingClientRect(), ov = [].slice.call(vs.querySelectorAll(".st-vs-o"));
        if (!ov.length || vs.scrollWidth > vs.clientWidth || ov.some(function (b) { return b.getBoundingClientRect().right > r.right + 0.5; })) no("sul telefono " + (j ? "di Giulia" : "di Paky") + " l'overall dell'avversario è tagliato («" + vs.textContent + "»)");
      });
      var b = q(G, ".st-ovr-asta"); if (b && b.textContent) { if (!/^⭐ \d{2}$/.test(b.textContent)) no("sul maxischermo «" + b.textContent + "»"); visto.ovr++; }
      if (qa(G, ".st-sq .st-slot:not(.vuoto) .st-val.su").some(function (v) { return /^\d{2}$/.test(v.textContent); })) visto.campo++;
      [P, G, o.L].forEach(function (w) {
        var f = q(w, ".st-fum"), t = q(w, ".sa-tempo"); if (!f || !t || f.__visto) return; f.__visto = 1; visto.fum++;
        if (f.getBoundingClientRect().top < t.getBoundingClientRect().bottom - 0.5) no("il fumetto del banditore copre la barra del tempo («" + f.textContent + "»)");
      });
    });
    if (!visto.ovr) no("sul maxischermo non si è mai visto l'overall del calciatore all'asta");
    if (!visto.campo) no("nei campetti non si vede l'overall dei calciatori comprati");
    if (!visto.vs) no("non ho mai visto gli avversari sul maxischermo");
    x.push("asta: «⭐ NN» sul maxischermo, overall nei campetti, 🆚 con 3 avversari interi " + visto.vs + " volte, " + visto.fum + " fumetti sotto la barra del tempo");
    await formazione(G, x);
    // la giornata: Paky salta le rose, ⏩, fino alle pagelle del primo tempo
    W.clicca(P, /Salta/);
    if (!await W.aspetta(function () { return q(G, ".st-gio-riga"); }, 20000)) no("la giornata non parte");
    var bv = q(P, ".st-bar-vel"); if (bv && !bv.classList.contains("on")) bv.click();
    var fino = Date.now() + 200000, icone = 0, pag = null;
    while (Date.now() < fino) {
      qa(G, ".st-gio-ev").forEach(function (e) { if (e.childNodes.length) { icone = Math.max(icone, e.childNodes.length); if (e.scrollWidth > e.clientWidth + 1) no("nel quadretto le icone non ci stanno tutte («" + e.textContent + "», " + e.clientWidth + " su " + e.scrollWidth + " px)"); } });
      pag = q(G, ".st-pag.on .st-pv") && q(G, ".st-pag.on"); if (pag && /primo tempo/.test((pag.querySelector(".st-pag-tit") || {}).textContent || "")) break;
      await W.dorme(200);
    }
    if (!pag) no("le pagelle del primo tempo non arrivano");
    await W.dorme(700);
    var fs = qa(G, ".st-pag.on .st-pv-c b").map(function (b) { return G.getComputedStyle(b).fontSize; }), uno = fs.filter(function (f, i) { return fs.indexOf(f) === i; });
    if (uno.length !== 1) no("nelle pagelle i voti hanno misure diverse: " + uno.join(", "));
    qa(G, ".st-pag.on .st-pv-c b").forEach(function (b) { if (b.scrollWidth > b.clientWidth + 1 || b.getBoundingClientRect().width > b.parentNode.getBoundingClientRect().width + 1) no("nelle pagelle il voto «" + b.textContent + "» esce dalla casella"); });
    qa(G, ".st-pag.on .st-pv-ic").forEach(function (e) { if (e.textContent && e.scrollWidth > e.clientWidth + 1) no("nelle pagelle bonus e malus tagliati: «" + e.textContent + "»"); });
    x.push("quadretti: fino a " + icone + " icone, tutte dentro · pagelle: voti tutti a " + uno[0]);
    return x.join(" · ");
  } });

  COPIONE.aggiungi("ov3", { nome: "Mini Asta Fantacalcio online in 3 come sempre: overall segreto all'asta, formazione finale dal più scarso al più forte", fai: async function () {
    var o = await telefoni({ formato: "fanta" }), G = o.G, x = [];
    await asta(o, function () {
      var b = q(G, ".st-ovr-asta"); if (b && b.textContent) no("con l'overall segreto il maxischermo dice «" + b.textContent + "»");
      if (qa(G, ".st-sq .st-slot .st-val.su").length) no("con l'overall segreto nei campetti si vede un overall");
    });
    x.push("asta: niente overall prima della fine");
    await formazione(G, x);
    return x.join(" · ");
  } });
})();

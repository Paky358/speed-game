// PROVE DELL'ASTA («🧨 La carta maledetta», «⏩ Avanti» a maggioranza sui kit) E DELLA GARA DI PESCA («🎯 Obiettivo della gara»).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("migliora2/g8-asta-pesca.js"); await COPIONE.prova("g8a0")
// (si carica da solo anche passo2/gruppo-c.js: le regole accorciate per la prova con w.__imp)
//
// g8a0: senza telefoni: le 15 carte maledette, riassunto e regole di tutti e due i giochi, il ⚙️ fuori pagina (🧨 di base No, si accende,
//       sparisce nel Fantacalcio, riaprendo resta «Sì»; 🎯 di base «Più chili», le 4 scelte).
// g8a1, g8a2: tolte (18 ott). La carta maledetta col voto a un tocco la provano paM e paMo in preferiti/asta.js.
// g8p1: Gara di pesca online, 🎯 «Il pesce più lungo» (dal ⚙️): saletta e annuncio, classifica dal vivo in cm (Luca più chili, Giulia
//       più lunga = prima), il cronista «📏 …» al sorpasso, Bea che guarda vede i cm, Luca ricarica, fine: Giulia 1ª, t.risultato,
//       «🎯 Il pesce più lungo» sulla classifica, misure 360x640 e 412x915.
// g8p2: Gara di pesca online, 🎯 «Più specie» con la parità: 2 specie a testa, vince chi ha più chili; poi «Nuova gara» con «Più pesci»
//       dal ⚙️ della saletta (t.onRegole) e la classifica dal vivo in pesci.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;

  function tocca(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click();
  }
  function senzaAnimazioni(w) { var st = w.document.createElement("style"); st.textContent = ".schermata,.as-mal-carta{animation:none!important} .btn.as-auto::after{animation:none!important}"; w.document.head.appendChild(st); }
  function chip(w, re) { var b = [].find.call(w.document.querySelectorAll(".modo-chip"), function (x) { return re.test(x.textContent); }); if (b) b.click(); return !!b; }
  function chipAcceso(w, re) { var b = [].find.call(w.document.querySelectorAll(".modo-chip"), function (x) { return re.test(x.textContent); }); return !!b && /attiva/.test(b.className); }
  function vede(w, sel) { var e = w.document.querySelector(sel); return !!e && e.getClientRects().length > 0; }
  function dentro(w, sel) {
    var d = w.document, x = [];
    if (d.scrollingElement.scrollHeight > w.innerHeight + 2) x.push("la pagina scorre (" + d.scrollingElement.scrollHeight + ")");
    sel.forEach(function (s) {
      var el = d.querySelector(s); if (!el) { x.push("manca " + s); return; }
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.left < -1 || r.top < -1 || r.right > w.innerWidth + 1 || r.bottom > w.innerHeight + 1) x.push(s + " fuori schermo (" + Math.round(r.top) + "-" + Math.round(r.bottom) + " su " + w.innerHeight + ")");
    });
    return x.join(", ");
  }
  async function misura(nome, cosa, sel) {
    var f = document.getElementById("tel-" + nome), w = W.finestra(nome), out = [], M = [[360, 640], [412, 915]];
    for (var i = 0; i < M.length; i++) {
      f.style.width = M[i][0] + "px"; f.style.height = M[i][1] + "px"; void w.document.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
      await W.dorme(350);
      var e = dentro(w, sel); if (e) out.push(cosa + " a " + M[i][0] + "x" + M[i][1] + ": " + e);
    }
    f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize")); await W.dorme(150);
    return out;
  }
  async function apriGioco(w, nome) {
    var tess = await W.aspetta(function () { return A.tessera(w, nome); }, 6000);
    if (!tess) no("non trovo la tessera «" + nome + "»"); tess.click(); await W.dorme(300);
  }
  // il gioco caricato a parte (per le regole e il ⚙️, senza telefoni)
  async function caricaGioco(file) {
    var src = await (await fetch("/js/games/" + file + "?" + Date.now())).text(), g = {};
    new Function("SG", src)({ registra: function (x) { Object.assign(g, x); }, bot: window.SG && SG.bot, audioCtx: function () { return null; } });
    return g;
  }
  var el = function (tag, a, figli) { var e = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { if (k === "text") e.textContent = a[k]; else if (k === "class") e.className = a[k]; else if (k === "style") e.style.cssText = a[k]; else if (k === "onclick") e.onclick = a[k]; else if (k === "hidden") e.hidden = true; else e.setAttribute(k, a[k]); }); (figli || []).forEach(function (f) { if (f) e.appendChild(f); }); return e; };
  function chipBox(box, re) { return [].find.call(box.querySelectorAll(".modo-chip"), function (b) { return re.test(b.textContent); }); }

  // ---------------------------------------------------------------- g8a0
  COPIONE.aggiungi("g8a0", { nome: "Asta e Gara di pesca: carte maledette, riassunto, regole, ⚙️ fuori pagina", fai: async function () {
    var x = [];
    // con lo strumento in Edge invisibile la pagina è /sw.js: i dati dell'Asta si caricano qui (come fa index.html)
    if (!(window.SG_ASTA_MALEDETTE || []).length) {
      var idx = await (await fetch("/index.html?" + Date.now())).text(), fileAsta = idx.match(/data\/asta-[a-z0-9-]+\.js/g) || [];
      for (var fa = 0; fa < fileAsta.length; fa++) (0, eval)(await (await fetch("/" + fileAsta[fa] + "?" + Date.now())).text());
    }
    var L = window.SG_ASTA_MALEDETTE || [];
    if (L.length < 10 || L.length > 15) no("carte maledette: " + L.length);
    L.forEach(function (c) { if (!c.nome || !c.emoji) no("carta maledetta senza nome o emoji: " + JSON.stringify(c)); });
    var g = await caricaGioco("asta.js");
    var r0 = g.riassunto({ tema: (window.SG_ASTA_TEMI || [])[0].id, crediti: 15 }), r1 = g.riassunto({ crediti: 20, maledetta: true }), r2 = g.riassunto({ formato: "fanta", maledetta: true });
    if (/🧨/.test(r0) || !/🧨 carta maledetta/.test(r1) || /🧨/.test(r2)) no("riassunti: «" + r0 + "» / «" + r1 + "» / «" + r2 + "»");
    if (!g.regole.some(function (s) { return /carta maledetta/.test(s) && /−0,5 ⭐/.test(s) && /primo che se la prende/.test(s); })) no("le regole non spiegano la carta maledetta");
    var tieni = localStorage.getItem("sg_asta_formato"); localStorage.removeItem("sg_asta_formato");
    try {
      var box = document.createElement("div"), dove = {};
      g.impostazioni(box, dove, { el: el, modo: "online" });
      if (dove.maledetta !== false) no("🧨 di base non è «No»: " + dove.maledetta);
      var si = chipBox(box, /Una volta: si paga/), nob = chipBox(box, /Solo carte buone/);
      if (!si || !nob || !/attiva/.test(nob.className)) no("le scelte 🧨 Sì/No non ci sono o «No» non è acceso");
      si.click(); if (dove.maledetta !== true || !/attiva/.test(si.className)) no("🧨 Sì non si accende");
      var wrap = si.parentNode.parentNode;
      chipBox(box, /Mini asta Fantacalcio/).click(); if (!wrap.hidden) no("nel Fantacalcio la carta maledetta si vede ancora");
      chipBox(box, /Temi classici/).click(); if (wrap.hidden) no("tornando ai temi la carta maledetta non si vede");
      var box2 = document.createElement("div"); g.impostazioni(box2, dove, { el: el, modo: "online" });
      if (dove.maledetta !== true || !/attiva/.test(chipBox(box2, /Una volta: si paga/).className)) no("riaprendo il ⚙️ la carta maledetta torna «No»");
      x.push("asta: «" + r1 + "»");
    } finally { if (tieni == null) localStorage.removeItem("sg_asta_formato"); else localStorage.setItem("sg_asta_formato", tieni); }
    var p = await caricaGioco("garapesca.js");
    var q0 = p.riassunto({}), q1 = p.riassunto({ durata: 180, obiettivo: "lungo" }), q2 = p.riassunto({ durata: 60, obiettivo: "specie" }), q3 = p.riassunto({ durata: 300, obiettivo: "pesci" });
    if (q1 !== "🎯 vince il pesce più lungo · 3 minuti") no("riassunto pesca: «" + q1 + "»");
    if (!/più chili · 3 minuti/.test(q0) || !/specie diverse · 1 minuto/.test(q2) || !/più pesci · 5 minuti/.test(q3)) no("riassunti pesca: " + [q0, q2, q3].join(" / "));
    if (!p.regole.some(function (s) { return /obiettivo della gara/i.test(s) && /a parità vince chi ha più chili/.test(s); })) no("le regole della pesca non spiegano l'obiettivo");
    var b3 = document.createElement("div"), d3 = {};
    p.impostazioni(b3, d3, { el: el, modo: "online" });
    if (d3.obiettivo !== "kg" || !/attiva/.test(chipBox(b3, /Più chili/).className)) no("🎯 di base non è «Più chili»: " + d3.obiettivo);
    [["lungo", /pesce più lungo/], ["specie", /Più specie/], ["pesci", /Più pesci/], ["kg", /Più chili/]].forEach(function (k) {
      var b = chipBox(b3, k[1]); b.click();
      if (d3.obiettivo !== k[0] || b3.querySelectorAll(".modo-chip.attiva").length !== 2) no("toccando «" + b.textContent + "» l'obiettivo è " + d3.obiettivo);
    });
    var b4 = document.createElement("div"); p.impostazioni(b4, { obiettivo: "specie", durata: 60 }, { el: el });
    if (!/attiva/.test(chipBox(b4, /Più specie/).className)) no("riaprendo il ⚙️ della pesca l'obiettivo non resta");
    x.push("pesca: «" + q1 + "»");
    return x.join(" · ");
  } });

  // (g8a1 e g8a2, la carta maledetta sullo stesso telefono e online, erano fatte per il voto a mezze stelle e i «Kit completi»,
  // che non ci sono più: le hanno prese al loro posto paM e paMo in preferiti/asta.js, col voto a un tocco)

  // ---------------------------------------------------------------- la Gara di pesca
  function pesci(w) { return w.SGPesca.PESCI.filter(function (s) { return s.r < 4; }); }
  async function apriGara(P, obiettivo) {
    await apriGioco(P, "Gara di pesca");
    if (!W.clicca(P, /apro io/, ".modo-grande")) no("non c'è «Online: apro io»");
    await W.dorme(300);
    if (!chipAcceso(P, /Più chili/)) no("🎯 di base non è «Più chili»");
    if (obiettivo && !chip(P, obiettivo)) no("nel ⚙️ non c'è " + obiettivo);
    if (!W.clicca(P, /Apri la stanza/)) no("non c'è «Apri la stanza»");
    var C = await W.aspetta(function () { var b = P.document.querySelector(".sl-cod b"); return b && /^[A-Z0-9]{4}$/.test(b.textContent) ? b.textContent : null; }, 6000);
    if (!C) no("niente codice");
    return C;
  }
  function riga(w) { return [].map.call(w.document.querySelectorAll(".pe-classi .pe-cl"), function (x) { return x.textContent; }); }

  COPIONE.aggiungi("g8p1", { nome: "Gara di pesca online, 🎯 il pesce più lungo: saletta, annuncio, classifica dal vivo in cm, cronista, chi guarda, ricarica, fine", fai: async function () {
    await COPIONE.carica("passo2/gruppo-c.js");
    var F = {}, misure = [];
    var P = F.Paky = await W.apriTel("Paky", { x: 0, fintiC: true }); senzaAnimazioni(P);
    P.__imp = { durata: 25 };
    var C = await apriGara(P, /pesce più lungo/);
    F.Luca = await W.apriTel("Luca", { hash: "gioco=garapesca&stanza=" + C, x: 185 }); senzaAnimazioni(F.Luca);
    F.Giulia = await W.apriTel("Giulia", { hash: "gioco=garapesca&stanza=" + C, x: 370 }); senzaAnimazioni(F.Giulia);
    if (!await W.aspetta(function () { return (W.vmDi(C).players || []).length === 3; }, 10000)) no("in saletta non sono in 3");
    if (!/🎯 vince il pesce più lungo \(a parità, chi ha più chili\)/.test(T(F.Luca))) no("in saletta Luca non legge l'obiettivo («" + T(F.Luca).slice(0, 200) + "»)");
    await W.dorme(400);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("«Comincia» spento");
    if (!await W.aspetta(function () { return W.vmDi(C).fase === "gioco"; }, 15000)) no("la gara non comincia");
    var v = W.vmDi(C);
    if (v.obiettivo !== "lungo") no("nella foto l'obiettivo è " + v.obiettivo);
    if (!v.ultimo || !/🎯 Oggi vince il pesce più lungo!/.test(v.ultimo.testo)) no("l'annuncio di inizio è «" + (v.ultimo && v.ultimo.testo) + "»");
    await W.aspetta(function () { return F.Luca.document.querySelector(".pe-classi"); }, 6000);
    var aiuto = (F.Luca.document.querySelector(".pe-aiuto") || {}).textContent || "";
    if (!/vince il pesce più lungo/.test(aiuto)) no("l'aiuto del laghetto di Luca non dice l'obiettivo («" + aiuto + "»)");
    // Luca: tanti chili coi pesci corti; Giulia: un pesce solo, il più lungo (meno chili)
    var L = pesci(P), lungo = L.slice().sort(function (a, b) { return b.cm[1] - a.cm[1]; })[0];
    var corti = L.filter(function (s) { return s.cm[1] < lungo.cm[1] - 5; }).sort(function (a, b) { return P.SGPesca.pesoKg(b, b.cm[1]) - P.SGPesca.pesoKg(a, a.cm[1]); });
    var grosso = corti[0], kgG = P.SGPesca.pesoKg(lungo, lungo.cm[1]), kgL = 0, nL = 0;
    while (kgL <= kgG + 0.5 && nL < 20) { W.reteDi("Luca").invia({ t: "preso", id: grosso.id, cm: grosso.cm[1], k: "l" + nL }); kgL += P.SGPesca.pesoKg(grosso, grosso.cm[1]); nL++; }
    await W.dorme(700);
    W.reteDi("Giulia").invia({ t: "preso", id: lungo.id, cm: lungo.cm[1], k: "g0" });
    if (!await W.aspetta(function () { var p = (W.vmDi(C).players || []).filter(function (x) { return x.nome === "Giulia"; })[0]; return p && p.lungo && p.lungo.cm === lungo.cm[1]; }, 3000)) no("il pesce di Giulia non arriva");
    var vu = W.vmDi(C).ultimo;
    if (!vu || !/📏/.test(vu.testo) || !/Giulia/.test(vu.testo)) no("il cronista al sorpasso dice «" + (vu && vu.testo) + "»");
    await W.dorme(800);
    var rP = riga(P);
    if (!/^1\. Giulia · 📏 /.test(rP[0] || "") || rP[0].indexOf(lungo.cm[1] + " cm") < 0) no("in alto Paky legge: " + rP.join(" | "));
    if (!/^2\. Luca · 📏 /.test(rP[1] || "")) no("Luca non è secondo coi cm: " + rP.join(" | "));
    var chipG = (F.Giulia.document.querySelector(".pe-testa .pe-chip") || {}).textContent;
    if (chipG !== "🏆 📏 " + lungo.cm[1] + " cm") no("in alto Giulia legge «" + chipG + "»");
    misure = misure.concat(await misura("Giulia", "il laghetto", [".pe-classi", ".pe-testa"]));
    // Bea arriva a gara cominciata e guarda: la classifica in cm
    F.Bea = await W.apriTel("Bea", { hash: "gioco=garapesca&stanza=" + C, x: 555 }); senzaAnimazioni(F.Bea);
    if (!await W.aspetta(function () { return /📏 \d+ cm/.test(T(F.Bea)); }, 8000)) no("Bea che guarda non vede i cm («" + T(F.Bea).slice(0, 160) + "»)");
    // Luca ricarica e ritrova il laghetto coi cm
    F.Luca = await W.ricarica("Luca"); senzaAnimazioni(F.Luca);
    if (!await W.aspetta(function () { var r = riga(F.Luca); return r.length >= 2 && /📏/.test(r[1]) && /Tu/.test(r[1]); }, 10000)) no("Luca, ricaricata la pagina, legge: " + riga(F.Luca).join(" | "));
    // la fine
    if (!await W.aspetta(function () { return W.vmDi(C).fase === "fine"; }, 40000)) no("la gara non finisce");
    var cl = W.vmDi(C).classifica;
    if (cl[0].nome !== "Giulia" || cl[0].pos !== 1 || cl[1].nome !== "Luca") no("classifica: " + cl.map(function (r) { return r.pos + " " + r.nome; }).join(", "));
    await W.dorme(2600);
    var tf = await W.aspetta(function () { return /Classifica della gara/.test(T(P)) && T(P); }, 6000);
    if (!tf || !/🎯 Il pesce più lungo/.test(tf) || !/📏 \d+ cm · /.test(tf)) no("la classifica finale non dice l'obiettivo («" + (tf || T(P)).slice(0, 200) + "»)");
    misure = misure.concat(await misura("Luca", "la classifica finale", [".gp-fin", ".fine-tasti, .piede, .schermata .btn"]));
    if (misure.length) no(misure.join(" · "));
    return "Luca " + nL + " pesci (" + kgL.toFixed(2) + " kg) contro Giulia 1 da " + lungo.cm[1] + " cm · in alto: " + rP.join(" | ") + " · cronista «" + vu.testo + "»";
  } });

  COPIONE.aggiungi("g8p2", { nome: "Gara di pesca online, 🎯 più specie con la parità ai chili, poi «Più pesci» dal ⚙️ della saletta", fai: async function () {
    await COPIONE.carica("passo2/gruppo-c.js");
    var F = {};
    var P = F.Paky = await W.apriTel("Paky", { x: 0, fintiC: true }); senzaAnimazioni(P);
    P.__imp = { durata: 15 };
    var C = await apriGara(P, /Più specie/);
    F.Luca = await W.apriTel("Luca", { hash: "gioco=garapesca&stanza=" + C, x: 185 }); senzaAnimazioni(F.Luca);
    F.Giulia = await W.apriTel("Giulia", { hash: "gioco=garapesca&stanza=" + C, x: 370 }); senzaAnimazioni(F.Giulia);
    if (!await W.aspetta(function () { return (W.vmDi(C).players || []).length === 3; }, 10000)) no("in saletta non sono in 3");
    await W.dorme(400);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return W.vmDi(C).fase === "gioco"; }, 15000)) no("la gara non comincia");
    var L = pesci(P).slice().sort(function (a, b) { return P.SGPesca.pesoKg(a, a.cm[0]) - P.SGPesca.pesoKg(b, b.cm[0]); });
    var a = L[0], b = L[1], z = L[L.length - 1];
    // Luca: 3 pesci di 2 specie leggere (più pesci); Giulia: 2 pesci di 2 specie, più chili → a parità di specie vince Giulia
    W.reteDi("Luca").invia({ t: "preso", id: a.id, cm: a.cm[0], k: "l1" }); W.reteDi("Luca").invia({ t: "preso", id: a.id, cm: a.cm[0], k: "l2" }); W.reteDi("Luca").invia({ t: "preso", id: b.id, cm: b.cm[0], k: "l3" });
    await W.dorme(500);
    W.reteDi("Giulia").invia({ t: "preso", id: z.id, cm: z.cm[1], k: "g1" }); W.reteDi("Giulia").invia({ t: "preso", id: b.id, cm: b.cm[1], k: "g2" });
    await W.dorme(900);
    var rP = riga(P);
    if (!/^1\. Giulia · 🐠 2 specie/.test(rP[0] || "") || !/^2\. Luca · 🐠 2 specie/.test(rP[1] || "")) no("in alto: " + rP.join(" | "));
    var vu = W.vmDi(C).ultimo;
    if (!await W.aspetta(function () { return W.vmDi(C).fase === "fine"; }, 30000)) no("la gara non finisce");
    var cl = W.vmDi(C).classifica;
    if (cl[0].nome !== "Giulia" || cl[1].nome !== "Luca" || cl[1].pos !== 2) no("a parità di specie: " + cl.map(function (r) { return r.pos + " " + r.nome + " " + r.sp + "sp " + r.kg + "kg"; }).join(", "));
    await W.dorme(2600);
    var tf = await W.aspetta(function () { return /Classifica della gara/.test(T(F.Giulia)) && T(F.Giulia); }, 6000);
    if (!tf || !/🐠 2 specie · /.test(tf) || !/🎯 Più specie diverse/.test(tf)) no("la classifica finale di Giulia: «" + (tf || "").slice(0, 200) + "»");
    // Nuova gara, e dalla saletta l'host cambia l'obiettivo (t.onRegole)
    var nuova = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll("button"), function (x) { return /Nuova gara|Nuova partita|Rivincita/.test(x.textContent); }); }, 5000);
    if (!nuova) no("l'host non ha «Nuova gara»");
    nuova.click();
    if (!await W.aspetta(function () { return W.vmDi(C).fase === "lobby"; }, 10000)) no("non si torna in saletta");
    var t = P.__t; if (!t || !t.onRegole) no("niente t.onRegole");
    t.onRegole({ durata: 15, obiettivo: "pesci" });
    if (!await W.aspetta(function () { return W.vmDi(C).obiettivo === "pesci" && /🎯 vince chi prende più pesci/.test(T(F.Luca)); }, 4000)) no("cambiato l'obiettivo, Luca in saletta non legge «più pesci»");
    await W.dorme(400);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return W.vmDi(C).fase === "gioco"; }, 15000)) no("la seconda gara non comincia");
    W.reteDi("Luca").invia({ t: "preso", id: a.id, cm: a.cm[0], k: "m1" }); W.reteDi("Luca").invia({ t: "preso", id: a.id, cm: a.cm[0], k: "m2" });
    W.reteDi("Giulia").invia({ t: "preso", id: z.id, cm: z.cm[1], k: "m3" });
    await W.dorme(900);
    var r2 = riga(F.Giulia);
    if (!/^1\. Luca · 🔢 2 pesci/.test(r2[0] || "") || !/^2\. Tu · 🔢 1 pesce$/.test(r2[1] || "")) no("in alto (più pesci) Giulia legge: " + r2.join(" | "));
    return "specie: " + rP.join(" | ") + " · finale " + cl.map(function (r) { return r.pos + ". " + r.nome; }).join(", ") + " · più pesci: " + r2.join(" | ");
  } });
})();

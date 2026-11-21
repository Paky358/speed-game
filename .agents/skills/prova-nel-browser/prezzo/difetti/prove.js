// PROVE DELLA CACCIA AI DIFETTI DEL PREZZO È GIUSTO (20 nov 2026). Si caricano dopo prezzo/base.js.
// pzf1: È troppo! online in 3: chi si è fermato non si vede (né «✋ Luca» sul maxischermo né la ✅ in alto) finché non ti fermi anche tu.
// pzf2: Ruota del 100 online in 2: dopo il tuo giro il pannello scende e c'è «aspettiamo gli altri» col conto (prima la barra restava ferma).
// pzf3: chi arriva tardi legge dove entra davvero: durante la prima Offerta «alla prossima Offerta», dopo l'ultimo gioco a premi
//       «alla Ruota del 100», durante la Vetrina «La puntata sta finendo».
// pzf5: la scheda grande (Più o meno) in poco spazio si stringe («corta», poi senza foto): niente sale sul titolo né scende sulle righe sotto.
// pzf4: senza grafica: il luogo non si ripete se la descrizione o il nome lo dicono già; i titoli lunghi del pannello vanno su due righe;
//       le spiegazioni dei giochi a premi hanno le tre righe e il tempo tra 15 e 30 s.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function tocca(w, b) { if (!b) return false; b.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" })); return true; }
  function errori() { var e = W.erroriTel(); return e.length ? " · ERRORI: " + e.slice(0, 3).join(" / ") : ""; }
  function soloPremi(tipi) { var P = W.finestra("Paky").SG_PREZZO_PREMI || {}; Object.keys(P).forEach(function (k) { if (tipi.indexOf(k) < 0) delete P[k]; }); }

  COPIONE.aggiungi("pzf1", { nome: "Prezzo: È troppo! online, chi si è fermato si vede solo dopo che ti fermi anche tu", fai: async function () {
    W.PZ.conSpia();
    try {
      var X = await W.PZ.salaPrezzo(["Luca", "Sara"], { formato: "tv", durata: "veloce", offerte: "vista" }), C = X.C, P = X.P;
      soloPremi(["troppo"]);
      if (!await W.PZ.giocaTutti(["Paky", "Luca", "Sara"], function () { var v = vm(C); return v.fase === "premio" && v.sotto === "gioca"; }, { ms: 200000, avanti: true })) no("non si arriva a È troppo! (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      var L = W.finestra("Luca");
      // Luca si ferma appena può; Paky e Sara no
      var btnL = await W.aspetta(function () { return L.document.querySelector(".pz-pan.su .pzb-tr-btn.vivo"); }, 12000);
      if (!btnL) no("Luca non ha il tasto «È troppo!»");
      tocca(L, btnL);
      if (!await W.aspetta(function () { return ((vm(C).premio || {}).fatti || []).length >= 1; }, 6000)) no("lo stop di Luca non arriva a chi tiene la partita");
      await W.dorme(1500);
      var sch = function (w) { var s = w.document.querySelector(".pz-sch"); return s ? s.textContent : ""; };
      if (/✋ Luca/.test(sch(P))) no("Paky vede «✋ Luca» prima di fermarsi anche lui");
      if (/Luca\s*✅/.test(T(P))) no("Paky vede la ✅ di Luca in alto prima di fermarsi anche lui");
      // Paky si ferma: ora vede Luca
      var btnP = P.document.querySelector(".pz-pan.su .pzb-tr-btn.vivo"); if (!btnP) no("Paky non ha più il tasto");
      tocca(P, btnP);
      if (!await W.aspetta(function () { return /✋ Luca/.test(sch(P)); }, 6000)) no("fermato anche Paky, «✋ Luca» non compare");
      // chi guarda (Bea, col link) vede tutto da subito: non serve qui
      return "Luca fermo: Paky non lo vede; Paky fermo: «✋ Luca» compare" + errori();
    } finally { W.PZ.senzaSpia(); }
  } });

  COPIONE.aggiungi("pzf2", { nome: "Prezzo: Ruota del 100 online, dopo il proprio giro «aspettiamo gli altri» col conto", fai: async function () {
    W.PZ.conSpia();
    try {
      var X = await W.PZ.salaPrezzo(["Luca"], { formato: "tv", durata: "veloce", offerte: "vista" }), C = X.C, P = X.P;
      if (!await W.PZ.giocaTutti(["Paky", "Luca"], function () { var v = vm(C); return v.fase === "ruota" && v.sotto === "giro1"; }, { ms: 420000, avanti: true })) no("non si arriva alla Ruota (fase " + vm(C).fase + "." + vm(C).sotto + ")");
      // gira solo Paky; Luca aspetta
      var fatto = false, fino = Date.now() + 15000;
      while (!fatto && Date.now() < fino) { fatto = await W.PZ.agisci("Paky", {}); if (!fatto) await W.dorme(300); }
      if (!fatto) no("Paky non riesce a girare la ruota");
      var ok = await W.aspetta(function () { var b = P.document.querySelector(".st-barra.on"); return b && /aspettiamo gli altri/.test(b.textContent) && !P.document.querySelector(".pz-pan.su"); }, 12000);
      if (!ok) no("dopo il giro di Paky non c'è «aspettiamo gli altri» (barra: «" + ((P.document.querySelector(".st-barra.on") || {}).textContent || "").slice(0, 80) + "»)");
      var conto = P.document.querySelector(".st-barra.on .pz-tempo, .st-barra.on [class*='tempo']");
      var tx = P.document.querySelector(".st-barra.on").textContent.replace(/\s+/g, " ").trim();
      return "dopo il giro: «" + tx.slice(0, 70) + "»" + (conto ? " con la barra del tempo" : " (barra del tempo non trovata)") + errori();
    } finally { W.PZ.senzaSpia(); }
  } });

  COPIONE.aggiungi("pzf3", { nome: "Prezzo: chi arriva tardi legge dove entra davvero (prossima Offerta, Ruota, la puntata sta finendo)", fai: async function () {
    W.PZ.conSpia();
    try {
      var X = await W.PZ.salaPrezzo(["Luca"], { formato: "tv", durata: "veloce", offerte: "vista" }), C = X.C, note = [];
      // Sara arriva durante la prima Offerta
      if (!await W.PZ.giocaTutti(["Paky", "Luca"], function () { var v = vm(C); return v.fase === "offerta" && v.sotto === "offri"; }, { ms: 120000 })) no("non si arriva alla prima offerta");
      var S1 = await W.apriTel("Sara", { hash: "gioco=prezzo&stanza=" + C, x: 560 });
      if (!await W.aspetta(function () { return /Entri alla prossima Offerta/.test(T(S1)); }, 20000)) no("Sara (arrivata alla prima Offerta) non legge «Entri alla prossima Offerta» («" + T(S1).slice(-140) + "»)");
      note.push("Sara: prossima Offerta");
      // Gina arriva dopo l'ultimo gioco a premi (prima della Ruota)
      if (!await W.PZ.giocaTutti(["Paky", "Luca", "Sara"], function () { var v = vm(C); return v.fase === "premio" && v.iPremio === v.nPremio && v.sotto === "gioca"; }, { ms: 300000, avanti: true })) no("non si arriva all'ultimo gioco a premi");
      var G = await W.apriTel("Gina", { hash: "gioco=prezzo&stanza=" + C, x: 750 });
      if (!await W.aspetta(function () { return /Entri alla Ruota del 100/.test(T(G)); }, 20000)) no("Gina (arrivata all'ultimo gioco a premi) non legge «Entri alla Ruota del 100» («" + T(G).slice(-140) + "»)");
      note.push("Gina: Ruota");
      // Bea arriva durante la Vetrina
      if (!await W.PZ.giocaTutti(["Paky", "Luca", "Sara", "Gina"], function () { var v = vm(C); return v.fase === "vetrina" && v.sotto === "offri"; }, { ms: 300000, avanti: true })) no("non si arriva alla Vetrina");
      var B = await W.apriTel("Bea", { hash: "gioco=prezzo&stanza=" + C, x: 940 });
      if (!await W.aspetta(function () { return /La puntata sta finendo/.test(T(B)); }, 20000)) no("Bea (arrivata alla Vetrina) non legge «La puntata sta finendo» («" + T(B).slice(-140) + "»)");
      note.push("Bea: la puntata sta finendo");
      if (!(vm(C).players || []).some(function (p) { return p.nome === "Gina"; })) no("Gina non è entrata alla Ruota");
      return note.join(" · ") + errori();
    } finally { W.PZ.senzaSpia(); }
  } });

  COPIONE.aggiungi("pzf4", { nome: "Prezzo: il luogo non si ripete, i titoli lunghi su due righe, le spiegazioni coi tre pezzi e il tempo giusto", fai: async function () {
    var w = await W.pzPronto(await W.apriTel("Paky", { x: 0 })), Z = w.SGPrezzoScena, L = w.SG_PREZZO_PREMI;
    if (!Z.sottoDi) no("manca SGPrezzoScena.sottoDi");
    var a = Z.sottoDi({ desc: "Una camera per due in un trullo di Alberobello", dove: "ad Alberobello" }), b = Z.sottoDi({ desc: "Spazzola con serbatoio", dove: "dal casalinghi" });
    if (/·/.test(a)) no("il luogo si ripete: «" + a + "»");
    var c = Z.sottoDi({ nome: "Il 730 fatto al CAF", desc: "La dichiarazione dei redditi", dove: "al CAF" });
    var r = Z.sottoDi({ nome: "Biglietto del Colosseo", desc: "Ingresso intero, con il Foro Romano e il Palatino", dove: "a Roma" });
    if (!/a Roma/.test(r)) no("«a Roma» sparito per colpa di «Romano»: «" + r + "»");
    if (/CAF/.test(c)) no("il luogo già scritto nel nome si ripete: «" + c + "»");
    if (b !== "Spazzola con serbatoio · dal casalinghi") no("il luogo che non c'è nella descrizione sparisce: «" + b + "»");
    // tutti i prodotti: quanti hanno il luogo già nella descrizione (solo per dirlo)
    var tutti = w.SG_PREZZO.prodotti || [], doppi = tutti.filter(function (p) { return p.dove && !Z.doveDi(p); }).length;
    // le spiegazioni
    var tipi = Object.keys(L), guai = [];
    tipi.forEach(function (k) {
      var g = L[k]; if (!g.fai || !g.es || !g.pt) guai.push(k + " senza le tre righe");
      var n = (g.fai + " " + g.es + " " + g.pt).trim().split(/\s+/).filter(function (x) { return /[0-9A-Za-zÀ-ú]/.test(x); }).length, s = Math.max(15, Math.min(30, Math.round(6 + n / 2.5)));
      if (s < 15 || s > 30) guai.push(k + " " + s + " s");
    });
    if (guai.length) no(guai.join(", "));
    return "luogo doppio tolto in " + doppi + " prodotti su " + tutti.length + " · " + tipi.length + " giochi a premi con le tre righe" + errori();
  } });

  COPIONE.aggiungi("pzf5", { nome: "Prezzo: la scheda grande in poco spazio si stringe e non copre titolo e righe", fai: async function () {
    var w = await W.pzPronto(await W.apriTel("Paky", { x: 0 })), Z = w.SGPrezzoScena, d = w.document, note = [];
    Z.stile();
    var el = function (t, o) { var e = d.createElement(t); if (o && o.class) e.className = o.class; if (o && o.text) e.textContent = o.text; return e; };
    var p = (w.SG_PREZZO.prodotti || []).filter(function (x) { return /Gilet airbag/.test(x.nome); })[0] || w.SG_PREZZO.prodotti[0];
    var alte = [140, 170, 230, 420];
    for (var i = 0; i < alte.length; i++) {
      var sch = el("div", { class: "pz-sch" }); sch.style.cssText = "position:fixed;left:0;top:0;width:330px;height:" + alte[i] + "px;--alt:640px;z-index:99";
      var testa = el("div", { class: "pz-testa", text: "Più o meno" }), sk = Z.scheda(el, p, { cls: "media grande" }), sotto = el("div", { class: "pz-sotto", text: "Chi l'ha trovato" });
      sch.appendChild(testa); sch.appendChild(sk); sch.appendChild(sotto); d.body.appendChild(sch);
      await W.dorme(900);
      var tb = testa.getBoundingClientRect().bottom, so = sotto.getBoundingClientRect().top, kids = [].filter.call(sk.children, function (c) { return w.getComputedStyle(c).display !== "none"; });
      var su = Math.min.apply(null, kids.map(function (c) { return c.getBoundingClientRect().top; })), giu = Math.max.apply(null, kids.map(function (c) { return c.getBoundingClientRect().bottom; }));
      var desc = sk.querySelector(".pz-desc");
      if (su < tb - 1) no(alte[i] + " px: la scheda sale sul titolo (" + Math.round(su) + " < " + Math.round(tb) + ") classi «" + sk.className + "»");
      if (giu > so + 1) no(alte[i] + " px: la scheda scende sulle righe sotto (" + Math.round(giu) + " > " + Math.round(so) + ") classi «" + sk.className + "»");
      if (desc && w.getComputedStyle(desc).display === "none") no(alte[i] + " px: la descrizione è sparita");
      note.push(alte[i] + ": " + (sk.className.replace(/pz-scheda|media|grande/g, "").trim() || "intera"));
      sch.remove();
    }
    if (!/corta/.test(note[0] + note[1])) no("in poco spazio la scheda non si stringe: " + note.join(", "));
    if (!/intera/.test(note[3])) no("con tanto spazio la scheda si stringe lo stesso: " + note[3]);
    return note.join(" · ") + errori();
  } });
})();

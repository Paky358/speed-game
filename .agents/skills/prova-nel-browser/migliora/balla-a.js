// PROVE DELLA BALLA RIFATTA (20 nov 2026, chat «🪟 Saletta di vetro», strada A scelta dal proprietario).
// Si caricano DOPO migliora/balla.js (usano la sua spia delle regole): --carica migliora/balla.js,migliora/balla-a.js
//
// bA1: online in 3, 2 round «Solo notizie» (notizia + Balla Finale): al voto il foglio è pieno (non trasparente) con la notizia in alto
//      e la propria balla spenta; chi ricarica dopo aver scritto rilegge la sua balla; la rivelazione va in ordine (prima «Nessuno ci è
//      cascato», poi le balle una alla volta dalla meno votata, la VERITÀ sempre per ultima, stampata dentro il giornale); chi ci è
//      cascato coi nomi, chi l'ha scritta coi punti ×100; la classifica del round (posizioni, punti ×100, annuncio della Balla Finale);
//      il podio coi premi a fine partita.
// bA2: online in 3, l'host ricarica mentre si vota: entro 15 s tutti hanno di nuovo il foglio del voto e la partita finisce.
// bA3: sullo stesso telefono in 3, 2 round: ogni schermata nuova (scrittura, scrittura con la tastiera aperta, voto, balle ignorate,
//      balla, verità, classifica, podio) misurata a 360×640, 390×844 e 412×915: tutto dentro lo schermo, sopra la barra dei tasti,
//      la pagina non scorre, «Fatto!» non copre la balla.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function veloAperto(w) { return w && w.document.querySelector(".bc-velo.on:not(.via)"); }
  function scrivi(w, testo) {
    var v = veloAperto(w), ok = v && v.querySelector(".bc-ok"); if (!ok || !v.querySelector(".bc-penna")) return false;
    [].forEach.call(v.querySelectorAll(".bc-penna"), function (t, n) { t.value = n ? testo + " bis" : testo; t.dispatchEvent(new w.Event("input", { bubbles: true })); }); ok.click(); return true;
  }
  function vota(w, pred) {
    var v = veloAperto(w); if (!v) return false;
    var b = [].filter.call(v.querySelectorAll(".bc-scelta"), function (x) { return !x.disabled && pred(x.querySelector(".tx").textContent); })[0];
    if (!b) return false;
    b.click(); var ok = v.querySelector(".bc-ok"); if (!ok || ok.disabled) return false; ok.click(); return true;
  }
  function errori() { var e = W.erroriTel(); return e.length ? e.slice(0, 3).join(" / ") : ""; }
  async function partita(imp) {
    var P = await W.apriTel("Paky", { x: 0, spiaBalla: true, prima: function (w) { w.__imp = imp; } });
    var C = await W.apriStanza(P, "La Balla Colossale");
    await W.apriTel("Luca", { hash: "gioco=balla&stanza=" + C, x: 185, spiaBalla: true });
    await W.apriTel("Sara", { hash: "gioco=balla&stanza=" + C, x: 370, spiaBalla: true });
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 3; }, 10000)) no("nella saletta non ci sono in 3");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 8000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    return { P: P, C: C };
  }
  // scrivono tutti (balla «balla di <nome>»), poi ognuno vota quello che dice voti[nome] (testo esatto, o "vera")
  async function scriviTutti(C, salta) {
    if (!await W.aspetta(function () { return vm(C).fase === "scrittura"; }, 30000)) no("non si arriva a scrivere (fase " + vm(C).fase + ")");
    var fatti = {};
    if (!await W.aspetta(function () {
      ["Paky", "Luca", "Sara"].forEach(function (n) { if (!fatti[n] && (!salta || salta.indexOf(n) < 0)) fatti[n] = scrivi(W.finestra(n), "balla di " + n); });
      return vm(C).fase === "voto" || ["Paky", "Luca", "Sara"].every(function (n) { return fatti[n] || (salta && salta.indexOf(n) >= 0); });
    }, 15000)) no("non riescono a scrivere tutti");
  }
  async function votaTutti(C, voti) {
    if (!await W.aspetta(function () { return vm(C).fase === "voto"; }, 30000)) no("non si arriva al voto (fase " + vm(C).fase + ")");
    var vera = P_vera(C), fatti = {};
    if (!await W.aspetta(function () {
      Object.keys(voti).forEach(function (n) { if (!fatti[n]) fatti[n] = vota(W.finestra(n), function (t) { return voti[n] === "vera" ? t === vera : t === voti[n]; }); });
      return Object.keys(voti).every(function (n) { return fatti[n]; });
    }, 15000)) no("non riescono a votare tutti (" + JSON.stringify(fatti) + ", vera «" + vera + "»)");
  }
  function P_vera(C) {
    var v = vm(C), P = W.finestra("Paky"), d;
    if (v.doppia) { d = (P.SG_BALLA_FINALE || []).filter(function (x) { return x.domanda === v.domanda; })[0]; return d ? d.risposteVere.join(" / ") : ""; }
    d = (P.SG_BALLA || []).filter(function (x) { return x.domanda === v.domanda; })[0]; return d ? d.rispostaVera : "";
  }

  // che cosa c'è sul maxischermo di un telefono durante la rivelazione
  function momento(w) {
    var d = w.document;
    if (d.querySelector(".bc-ign-sch")) return "I";
    var b = d.querySelector(".bc-sch.riv2 .bc-big");
    if (b) return b.classList.contains("vera") ? "V" : "B:" + b.querySelector(".tx").textContent;
    if (d.querySelector(".bc-clas2")) return "K";
    return "";
  }

  // ===================== bA1 =====================
  COPIONE.aggiungi("bA1", { nome: "Balla rifatta online: voto pieno, chi ricarica rilegge la balla, rivelazione in ordine, classifica, podio", fai: async function () {
    var X0 = await partita({ round: 2, amici: "no", ride: false, sceglie: false }), P = X0.P, C = X0.C, note = [];
    // ---- scrittura: Luca scrive e ricarica: rilegge la sua balla ----
    await scriviTutti(C, ["Paky", "Sara"]);
    if (!await W.aspetta(function () { return (vm(C).fatti || []).length >= 1; }, 5000)) no("la balla di Luca non arriva");
    await W.ricarica("Luca");
    var wL = W.finestra("Luca");
    if (!await W.aspetta(function () { return /La tua balla: «balla di Luca»/.test(T(wL)); }, 15000)) no("Luca dopo la ricarica non rilegge la sua balla («" + T(wL).slice(0, 140) + "»)");
    if (veloAperto(wL) && veloAperto(wL).querySelector(".bc-penna")) no("Luca dopo la ricarica ha di nuovo il foglio per scrivere");
    note.push("chi ricarica rilegge la balla");
    scrivi(P, "balla di Paky"); scrivi(W.finestra("Sara"), "balla di Sara");
    // ---- voto: foglio pieno, notizia in alto, la propria spenta ----
    if (!await W.aspetta(function () { return vm(C).fase === "voto" && veloAperto(W.finestra("Sara")) && veloAperto(W.finestra("Sara")).querySelector(".bc-scelta"); }, 30000)) no("non si arriva al voto");
    var wS = W.finestra("Sara"), vS = veloAperto(wS), cs = wS.getComputedStyle(vS), bg = cs.backgroundColor;
    var alfa = /rgba\(.*,\s*([\d.]+)\)/.test(bg) ? +RegExp.$1 : 1;
    if (alfa < 0.97 && cs.backgroundImage === "none") no("il foglio del voto è ancora trasparente (" + bg + ")");
    if (!vS.querySelector(".bc-ritaglio")) no("nel foglio del voto non c'è la notizia");
    var nt = vS.querySelector(".bc-ritaglio").getBoundingClientRect(), pr = vS.querySelector(".bc-scelta").getBoundingClientRect();
    if (nt.top > pr.top) no("nel voto la notizia non sta sopra le risposte");
    var mia = [].filter.call(vS.querySelectorAll(".bc-scelta"), function (b) { return /balla di Sara/.test(b.textContent); })[0];
    if (!mia || !mia.disabled) no("la balla di Sara non è spenta nel suo voto");
    // Paky trova la verità; Luca ci casca con Sara; Sara ci casca con Luca: la balla di Paky (e quelle della redazione) non le vota nessuno
    await votaTutti(C, { Paky: "vera", Luca: "balla di Sara", Sara: "balla di Luca" });
    // ---- la rivelazione, guardata dal telefono di Luca ----
    if (!await W.aspetta(function () { return vm(C).fase === "rivela"; }, 20000)) no("non si arriva alla rivelazione");
    var seq = [], fino = Date.now() + 90000, autoreVisto = "", cascatiVisti = "", stampata = false, ultimo = "";
    while (Date.now() < fino) {
      var m = momento(wL);
      if (m && m !== ultimo) { seq.push(m); ultimo = m; }
      if (m === "B:balla di Sara") {
        var au = wL.document.querySelector(".bc-autore-sch"); if (au) autoreVisto = au.textContent.replace(/\s+/g, " ");
        var vv = wL.document.querySelectorAll(".bc-riv-gente .bc-votante"); if (vv.length) cascatiVisti = wL.document.querySelector(".bc-riv-gente").textContent.replace(/\s+/g, " ");
      }
      if (m === "V" && wL.document.querySelector(".bc-riv-testa .stampata")) stampata = true;
      if (m === "K") break;
      await W.dorme(120);
    }
    var s = seq.join(" > ");
    if (seq[0] !== "I") no("la rivelazione non comincia da «Nessuno ci è cascato»: " + s);
    var iV = seq.indexOf("V"), iK = seq.indexOf("K");
    if (iV < 0 || iK !== iV + 1) no("la verità non è l'ultima prima della classifica: " + s);
    var balle = seq.filter(function (x) { return /^B:/.test(x); });
    if (balle.length !== 2 || balle.indexOf("B:balla di Sara") < 0 || balle.indexOf("B:balla di Luca") < 0) no("le balle votate non escono una alla volta: " + s);
    if (seq.slice(iV).some(function (x) { return x === "I" || /^B:/.test(x); })) no("dopo la verità esce ancora qualcosa: " + s);
    if (!/L'ha scritta/.test(autoreVisto) || !/Sara/.test(autoreVisto) || !/\+100/.test(autoreVisto)) no("chi l'ha scritta non si vede coi punti ×100 («" + autoreVisto + "»)");
    if (!/Ci è cascato/.test(cascatiVisti) || !/Luca/.test(cascatiVisti)) no("non si vede chi ci è cascato («" + cascatiVisti + "»)");
    if (!stampata) no("la verità non si stampa dentro il giornale");
    note.push("rivelazione " + s.replace(/B:balla di /g, ""));
    // ---- la classifica del round ----
    if (!await W.aspetta(function () { return wL.document.querySelectorAll(".bc-clas2 .bc-cl").length === 3; }, 8000)) no("la classifica del round non ha 3 righe");
    var kt = wL.document.querySelector(".bc-clas2").textContent.replace(/\s+/g, " ");
    if (!/200/.test(kt) || !/100/.test(kt)) no("nella classifica i punti non sono ×100 («" + kt.slice(0, 160) + "»)");
    if (!/Balla Finale/.test(kt) || !wL.document.querySelector(".bc-annuncio")) no("la classifica non annuncia la Balla Finale («" + kt.slice(-120) + "»)");
    var pos1 = wL.document.querySelector(".bc-cl .pos"); if (!pos1 || pos1.textContent !== "1°") no("la classifica non ha le posizioni");
    if (/Fine del round/.test(T(wL))) no("c'è ancora l'avviso «Fine del round»");
    note.push("classifica «" + (wL.document.querySelector(".bc-frase") || {}).textContent + "»");
    // ---- la Balla Finale e il podio ----
    if (!await W.aspetta(function () { return vm(C).fase !== "punti"; }, 30000)) no("la classifica non va avanti");
    await scriviTutti(C);
    await votaTutti(C, { Paky: "vera", Luca: "vera", Sara: "vera" });
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 90000)) no("la partita non finisce (fase " + vm(C).fase + ")");
    if (!await W.aspetta(function () { return wL.document.querySelectorAll(".bc-podio .bc-gradino").length === 3; }, 40000)) no("non c'è il podio coi 3 gradini («" + T(wL).slice(0, 120) + "»)");
    var pt = wL.document.querySelector(".bc-fine").textContent.replace(/\s+/g, " ");
    if (!/Vince Paky|Pareggio/.test(pt)) no("sul podio non vince Paky («" + pt.slice(0, 120) + "»)");
    if (!/Detective/.test(pt) || !/Credulone/.test(pt) || !/Re delle balle/.test(pt)) no("sul podio mancano i premi («" + pt + "»)");
    var e = errori(); if (e) no("errori: " + e);
    return "ok · " + note.join(" · ");
  } });

  // ===================== bA2 =====================
  COPIONE.aggiungi("bA2", { nome: "Balla rifatta online: l'host ricarica mentre si vota, il voto torna a tutti entro 15 s", fai: async function () {
    var X0 = await partita({ round: 1, amici: "no", ride: false, sceglie: false }), C = X0.C;
    await scriviTutti(C);
    if (!await W.aspetta(function () { return vm(C).fase === "voto" && veloAperto(W.finestra("Luca")) && veloAperto(W.finestra("Sara")); }, 30000)) no("non si arriva al voto");
    vota(W.finestra("Luca"), function () { return true; });
    await W.dorme(600);
    await W.ricarica("Paky");
    var t0 = Date.now();
    if (!await W.aspetta(function () { return ["Paky", "Sara"].every(function (n) { var v = veloAperto(W.finestra(n)); return v && v.querySelector(".bc-scelta:not(:disabled)"); }); }, 15000))
      no("dopo la ricarica dell'host non tutti hanno il foglio del voto (Paky «" + T(W.finestra("Paky")).slice(0, 80) + "», Sara «" + T(W.finestra("Sara")).slice(0, 80) + "»)");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    vota(W.finestra("Paky"), function () { return true; }); vota(W.finestra("Sara"), function () { return true; });
    if (veloAperto(W.finestra("Luca")) && veloAperto(W.finestra("Luca")).querySelector(".bc-scelta:not(:disabled)")) vota(W.finestra("Luca"), function () { return true; });
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 90000)) no("la partita non finisce (fase " + vm(C).fase + ")");
    var e = errori(); if (e) no("errori: " + e);
    return "ok · voto di nuovo a tutti dopo " + dt + " s";
  } });

  // ===================== bA3: le misure sullo stesso telefono =====================
  var MISURE = {
    scrivi: [".bc-velo.on .bc-penna", ".bc-velo.on .bc-ok"],
    voto: [".bc-velo.on .bc-scelta", ".bc-velo.on .bc-ok", ".bc-velo.on .bc-ritaglio"],
    ign: [".bc-chi-sch", ".bc-ign", ".bc-ign-sch .bc-riv-testa"],
    balla: [".bc-riv2 .bc-riv-testa, .riv2 .bc-riv-testa", ".riv2 .bc-big", ".riv2 .bc-votante, .riv2 .bc-nessuno", ".riv2 .bc-autore"],
    vera: [".riv2 .bc-riv-testa", ".riv2 .bc-big", ".riv2 .bc-votante, .riv2 .bc-nessuno", ".riv2 .bc-premio"],
    clas: [".bc-clas2 .bc-cl", ".bc-clas2 .bc-giro"],
    podio: [".bc-vince", ".bc-gradino", ".bc-premio-riga"]
  };
  function controlla(w, chiave) {
    var d = w.document, guai = [], barra = d.querySelector(".st-barra.on"), bTop = barra ? barra.getBoundingClientRect().top : w.innerHeight;
    MISURE[chiave].forEach(function (sel) {
      var l = d.querySelectorAll(sel);
      if (!l.length) { guai.push("manca " + sel); return; }
      [].forEach.call(l, function (x) {
        var r = x.getBoundingClientRect(); if (!r.width) return;
        var limite = x.closest(".bc-velo") ? w.innerHeight : bTop;
        if (r.top < -1 || r.left < -1 || r.right > w.innerWidth + 1 || r.bottom > limite + 1) guai.push(sel.split(",")[0].trim() + " fuori (" + Math.round(r.top) + "-" + Math.round(r.bottom) + " su " + Math.round(limite) + ")");
      });
    });
    if (chiave === "scrivi") {
      var p = d.querySelector(".bc-velo.on .bc-penna"), ok = d.querySelector(".bc-velo.on .bc-ok");
      if (p && ok) { var a = p.getBoundingClientRect(), b = ok.getBoundingClientRect(); if (a.bottom > b.top + 1 && a.top < b.bottom - 1 && a.right > b.left + 1 && a.left < b.right - 1) guai.push("«Fatto» copre la balla"); }
    }
    if (d.scrollingElement.scrollHeight > w.innerHeight + 2) guai.push("la pagina scorre");
    return guai.length ? w.innerWidth + "x" + w.innerHeight + " " + chiave + ": " + guai.slice(0, 3).join(", ") : "";
  }
  async function aMisura(nome, wh) { var f = document.getElementById("tel-" + nome), w = W.finestra(nome); f.style.width = wh[0] + "px"; f.style.height = wh[1] + "px"; w.dispatchEvent(new w.Event("resize")); await W.dorme(900); return w; }
  COPIONE.aggiungi("bA3", { nome: "Balla rifatta sullo stesso telefono: ogni schermata nuova a 360×640, 390×844, 412×915", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), guai = [], viste = {}, MIS = [[360, 640], [390, 844], [412, 915]];
    var stF = P.document.createElement("style"); stF.textContent = ".st-barra{transition:none!important}"; P.document.head.appendChild(stF);
    var tess = await W.aspetta(function () { return A.tessera(P, "La Balla Colossale"); }, 6000);
    if (!tess) no("non trovo la tessera"); tess.click();
    var bm = await W.aspetta(function () { return [].find.call(P.document.querySelectorAll(".modo-grande"), function (b) { return /Su questo telefono/.test(b.textContent); }); }, 4000);
    if (!bm) no("non c'è «Su questo telefono»"); bm.click();
    if (!await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 3000)) no("non si scrivono i nomi");
    while (P.document.querySelectorAll(".sala-riga input").length < 3) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = ["Paky", "Giulia", "Luca"][k]; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    W.clicca(P, /Avanti/);
    if (!await W.aspetta(function () { return W.clicca(P, /3 round/, ".modo-chip"); }, 4000)) no("nelle regole non c'è «3 round»");
    W.clicca(P, /Solo notizie/, ".modo-chip");
    var bAv = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Avanti|Comincia|Gioca|Via|▶/.test(x.textContent) && !x.disabled; });
    if (!bAv) no("non trovo il tasto per cominciare"); bAv.click();
    if (!await W.aspetta(function () { return P.document.querySelector(".st-vista"); }, 5000)) no("lo studio non si apre");
    async function misuraTutte(chiave) {
      viste[chiave] = 1;
      for (var i = 0; i < MIS.length; i++) { var w = await aMisura("Paky", MIS[i]); var g = controlla(w, chiave); if (g) guai.push(g); }
      if (chiave === "scrivi") {   // la tastiera aperta: rimane mezzo schermo
        var w2 = await aMisura("Paky", [360, 360]); var g2 = controlla(w2, "scrivi"); if (g2) guai.push("tastiera " + g2.replace(/ scrivi: /, ": "));
      }
      await aMisura("Paky", [360, 740]);
    }
    var fino = Date.now() + 480000, n = 0, nv = 0;
    while (Date.now() < fino) {
      if (P.document.querySelector(".bc-podio") && P.document.querySelector(".st-barra.on button")) { if (!viste.podio) await misuraTutte("podio"); break; }
      var cc = P.document.querySelector(".bc-cat-c:not(:disabled)"); if (cc) { cc.click(); await W.dorme(250); continue; }
      var v = veloAperto(P);
      if (v) {
        if (v.querySelector(".bc-penna")) { if (!viste.scrivi) await misuraTutte("scrivi"); scrivi(P, "balla numero " + (n++)); }
        else if (v.querySelector(".bc-scelta")) {
          if (!viste.voto) await misuraTutte("voto");
          var acc = [].filter.call(v.querySelectorAll(".bc-scelta"), function (x) { return !x.disabled; }), sc = acc[(nv++) % 2];
          if (sc) { sc.click(); var ok = v.querySelector(".bc-ok"); if (ok && !ok.disabled) ok.click(); }
        }
        await W.dorme(250); continue;
      }
      var bb = P.document.querySelector(".st-barra.on button");
      if (bb && !bb.disabled) {
        var d = P.document, k = d.querySelector(".bc-ign-sch") ? "ign" : d.querySelector(".riv2 .bc-big.vera") ? "vera" : d.querySelector(".riv2 .bc-big") ? "balla" : d.querySelector(".bc-clas2") ? "clas" : "";
        if (k && !viste[k]) await misuraTutte(k);
        bb = P.document.querySelector(".st-barra.on button"); if (bb && !bb.disabled) bb.click();
      }
      await W.dorme(250);
    }
    ["scrivi", "voto", "balla", "vera", "clas", "podio"].forEach(function (k) { if (!viste[k]) guai.push("non vista la schermata «" + k + "»"); });
    if (guai.length) no(guai.length + " guai: " + guai.slice(0, 8).join(" | "));
    var e = errori(); if (e) no("errori: " + e);
    return "ok · misurate " + Object.keys(viste).join(", ") + " a 360×640, 390×844, 412×915 (scrittura anche con la tastiera aperta)";
  } });
})();

// ===================== bAF: le foto vere (solo con lo strumento D:/SG-balla-studio/foto3.js, che guarda window.__fotoOra) =====================
// online in 3, 2 round «Solo notizie» con «Che balla!»: Paky 412×915, Luca 390×844, Sara 360×640 affiancati; una foto per momento.
(function () {
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function velo(w) { return w && w.document.querySelector(".bc-velo.on:not(.via)"); }
  function scrivi(w, testo) { var v = velo(w), ok = v && v.querySelector(".bc-ok"); if (!ok || !v.querySelector(".bc-penna")) return false; [].forEach.call(v.querySelectorAll(".bc-penna"), function (t, n) { t.value = n ? "una pentola di rame" : testo; t.dispatchEvent(new w.Event("input", { bubbles: true })); }); ok.click(); return true; }
  function vota(w, pred) { var v = velo(w); if (!v) return false; var b = [].filter.call(v.querySelectorAll(".bc-scelta"), function (x) { return !x.disabled && pred(x.querySelector(".tx").textContent); })[0]; if (!b) return false; b.click(); var ok = v.querySelector(".bc-ok"); if (!ok || ok.disabled) return false; ok.click(); return true; }
  async function foto(nome, aspetta) { await W.dorme(aspetta == null ? 900 : aspetta); W.__fotoOra = nome; await W.aspetta(function () { return W.__fotoFatta === nome; }, 20000); }
  function sistema() {
    [["Paky", 0, 412, 915], ["Luca", 432, 390, 844], ["Sara", 842, 360, 640]].forEach(function (x) {
      var f = document.getElementById("tel-" + x[0]); if (!f) return;
      f.style.position = "fixed"; f.style.left = x[1] + "px"; f.style.top = "34px"; f.style.width = x[2] + "px"; f.style.height = x[3] + "px"; f.style.transform = "none"; f.style.zIndex = 50;
      var w = W.finestra(x[0]); if (w) w.dispatchEvent(new w.Event("resize"));
    });
  }
  COPIONE.aggiungi("bAF", { nome: "Balla rifatta: foto vere su tre telefoni", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, spiaBalla: true, prima: function (w) { w.__imp = { round: 2, amici: "no", ride: true, sceglie: false }; } });
    var C = await W.apriStanza(P, "La Balla Colossale");
    await W.apriTel("Luca", { hash: "gioco=balla&stanza=" + C, x: 185, spiaBalla: true });
    await W.apriTel("Sara", { hash: "gioco=balla&stanza=" + C, x: 370, spiaBalla: true });
    sistema(); var tieni = setInterval(sistema, 1500);
    try {
      if (!await W.aspetta(function () { return (vm(C).players || []).length === 3; }, 10000)) no("non sono in 3");
      await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 8000);
      var fatte = {}, fino = Date.now() + 400000, passo = -1, n = 0;
      var vera = function () { var v = vm(C), d = v.doppia ? (P.SG_BALLA_FINALE || []).filter(function (x) { return x.domanda === v.domanda; })[0] : (P.SG_BALLA || []).filter(function (x) { return x.domanda === v.domanda; })[0]; return d ? (v.doppia ? d.risposteVere.join(" / ") : d.rispostaVera) : ""; };
      var BALLE = { Paky: "un pappagallo di Arezzo", Luca: "la nonna di Totò", Sara: "l'ex sindaco di Perugia" };
      while (Date.now() < fino) {
        var v = vm(C), f = v.fase, k = f + "|" + v.giro;
        if (f === "notizia" && !fatte[k]) { fatte[k] = 1; await foto((v.giro + 1) + "a-notizia", 1800); continue; }
        if (f === "scrittura" && !fatte[k]) {
          if (!await W.aspetta(function () { return velo(P) && velo(W.finestra("Luca")) && velo(W.finestra("Sara")); }, 8000)) continue;
          fatte[k] = 1;
          [].forEach.call(velo(W.finestra("Sara")).querySelectorAll(".bc-penna"), function (t, i) { t.value = i ? "una pentola" : "l'ex sindaco di Perugia"; t.dispatchEvent(new (W.finestra("Sara").Event)("input", { bubbles: true })); });
          await foto((v.giro + 1) + "b-scrittura", 900);
          scrivi(P, BALLA_O(BALLE.Paky)); scrivi(W.finestra("Luca"), BALLE.Luca);
          await foto((v.giro + 1) + "c-scrittura-aspetta", 1200);
          scrivi(W.finestra("Sara"), BALLE.Sara);
          continue;
        }
        if (f === "voto" && !fatte[k]) {
          if (!await W.aspetta(function () { return velo(P) && velo(W.finestra("Luca")) && velo(W.finestra("Sara")); }, 8000)) continue;
          fatte[k] = 1;
          await foto((v.giro + 1) + "d-voto", 900);
          var ve = vera();
          vota(P, function (t) { return t === ve; }); vota(W.finestra("Luca"), function (t) { return t.indexOf(BALLE.Sara) === 0; }); vota(W.finestra("Sara"), function (t) { return t.indexOf(BALLE.Luca) === 0; });
          continue;
        }
        if (f === "rivela") {
          var d = P.document;
          if (d.querySelector(".bc-ign-sch") && !fatte[k + "i"]) { fatte[k + "i"] = 1; await foto((v.giro + 1) + "e-nessuno-ci-e-cascato", 1500); continue; }
          var tb = d.querySelector(".riv2 .bc-timbro.on");
          if (tb && v.passo !== passo) { passo = v.passo; await foto((v.giro + 1) + "f-rivela-" + (n++) + (d.querySelector(".riv2 .bc-big.vera") ? "-verita" : "-balla"), 1700); continue; }
          W.BR && Object.keys(W.BR.tel).forEach(function (nn) { var w = W.finestra(nn); if (w) [].forEach.call(w.document.querySelectorAll(".bc-ride:not([disabled])"), function (b) { if (!b.__t) { b.__t = 1; b.click(); } }); });
        }
        if (f === "oro" && !fatte[k]) { fatte[k] = 1; await foto((v.giro + 1) + "g-balla-d-oro", 2200); continue; }
        if (f === "punti" && !fatte[k]) {
          if (!await W.aspetta(function () { return P.document.querySelector(".bc-clas2") && P.document.querySelector(".bc-avanti"); }, 12000)) continue;
          fatte[k] = 1; await foto((v.giro + 1) + "h-classifica", 1500);
          W.clicca(W.finestra("Luca"), /Avanti/, ".bc-avanti"); await foto((v.giro + 1) + "i-classifica-un-avanti", 700);
          W.clicca(P, /Avanti/, ".bc-avanti");
          continue;
        }
        if (f === "fine") {
          if (await W.aspetta(function () { return P.document.querySelector(".bc-podio"); }, 40000)) await foto("9-podio", 1800);
          break;
        }
        await W.dorme(150);
      }
    } finally { clearInterval(tieni); }
    return "foto fatte";
  } });
  function BALLA_O(x) { return x; }
})();

// ===================== bAG: altre foto vere (solo con D:/SG-balla-studio/foto4.js … bAG): chi sceglie, chi guarda, chi arriva tardi =====================
// online, 3 round «Solo notizie» con «🎯 Sceglie chi è ultimo» (il 3° è la Balla Finale): giocano Paky (412×915), Luca (390×844) e Sara
// (fuori dalla foto); Bea guarda col link (360×640); Gino arriva durante il 1° round e gioca dal 2° (360×640).
(function () {
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function velo(w) { return w && w.document.querySelector(".bc-velo.on:not(.via)"); }
  function scrivi(w, testo) { var v = velo(w), ok = v && v.querySelector(".bc-ok"); if (!ok || !v.querySelector(".bc-penna")) return false; [].forEach.call(v.querySelectorAll(".bc-penna"), function (t, n) { t.value = n ? "una pentola di rame comprata al mercato di Porta Portese".slice(0, 50) : testo; t.dispatchEvent(new w.Event("input", { bubbles: true })); }); ok.click(); return true; }
  function vota(w, pred) { var v = velo(w); if (!v) return false; var tutte = [].filter.call(v.querySelectorAll(".bc-scelta"), function (x) { return !x.disabled; }); var b = tutte.filter(function (x) { return pred(x.querySelector(".tx").textContent); })[0] || tutte[0]; if (!b) return false; b.click(); var ok = v.querySelector(".bc-ok"); if (!ok || ok.disabled) return false; ok.click(); return true; }
  async function foto(nome, aspetta) { await W.dorme(aspetta == null ? 900 : aspetta); W.__fotoOra = nome; await W.aspetta(function () { return W.__fotoFatta === nome; }, 20000); }
  var POSTI = [["Paky", 0, 412, 915], ["Luca", 422, 390, 844], ["Bea", 822, 360, 640], ["Gino", 1192, 360, 640], ["Sara", 3000, 360, 640]];
  function sistema() {
    POSTI.forEach(function (x) {
      var f = document.getElementById("tel-" + x[0]); if (!f) return;
      f.style.position = "fixed"; f.style.left = x[1] + "px"; f.style.top = "34px"; f.style.width = x[2] + "px"; f.style.height = x[3] + "px"; f.style.transform = "none"; f.style.zIndex = 50;
      var w = W.finestra(x[0]); if (w && f.__l !== x[2]) { f.__l = x[2]; w.dispatchEvent(new w.Event("resize")); }
    });
  }
  COPIONE.aggiungi("bAG", { nome: "Balla rifatta: foto di chi sceglie, chi guarda, chi arriva tardi e la Balla Finale", fai: async function () {
    W.__etichette = [[8, "Paky (host) · 412×915"], [430, "Luca · 390×844"], [830, "Bea guarda · 360×640"], [1200, "Gino arriva tardi · 360×640"]];
    var P = await W.apriTel("Paky", { x: 0, spiaBalla: true, prima: function (w) { w.__imp = { round: 3, amici: "no", ride: true, sceglie: true }; } });
    var C = await W.apriStanza(P, "La Balla Colossale");
    await W.apriTel("Luca", { hash: "gioco=balla&stanza=" + C, x: 185, spiaBalla: true });
    await W.apriTel("Sara", { hash: "gioco=balla&stanza=" + C, x: 370, spiaBalla: true });
    sistema(); var tieni = setInterval(sistema, 1500);
    try {
      if (!await W.aspetta(function () { return (vm(C).players || []).length === 3; }, 10000)) no("non sono in 3");
      await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 8000);
      await W.apriTel("Bea", { hash: "gioco=balla&stanza=" + C + "&guarda=1", x: 555, spiaBalla: true }); sistema();
      var fatte = {}, fino = Date.now() + 600000, passo = -1, n = 0, gino = false;
      var vera = function () { var v = vm(C), d = v.doppia ? (P.SG_BALLA_FINALE || []).filter(function (x) { return x.domanda === v.domanda; })[0] : (P.SG_BALLA || []).filter(function (x) { return x.domanda === v.domanda; })[0]; return d ? (v.doppia ? d.risposteVere.join(" / ") : d.rispostaVera) : ""; };
      // (balle lunghe 50 lettere, il massimo: devono stare intere ovunque)
      var BALLE = { Paky: "un pappagallo di Arezzo che recitava Dante a memoria", Luca: "la nonna di Totò, che correva più veloce di un Ape", Sara: "l'ex sindaco di Perugia, già campione di briscola!", Gino: "un idraulico di Bari con tre lauree e un monopattino" };
      BALLE = Object.keys(BALLE).reduce(function (o, k) { o[k] = BALLE[k].slice(0, 50); return o; }, {});
      var gioca = function () { return (vm(C).players || []).map(function (p) { return p.nome; }).filter(function (x) { return BALLE[x]; }); };
      while (Date.now() < fino) {
        var v = vm(C), f = v.fase, k = f + "|" + v.giro;
        if (f === "categoria" && !fatte[k]) {
          var c = v.cat || {}; if (!c.opz) { await W.dorme(150); continue; }
          fatte[k] = 1; var nC = ((v.players || []).filter(function (p) { return p.id === c.chi; })[0] || {}).nome;
          await foto((v.giro + 1) + "0-sceglie-" + nC, 1500);
          var wc = W.finestra(nC); if (wc) { var cc = wc.document.querySelectorAll(".bc-cat-c"); if (cc[1]) cc[1].click(); }
          await foto((v.giro + 1) + "0-scelto", 900);
          continue;
        }
        if (f === "notizia" && !fatte[k]) { fatte[k] = 1; await foto((v.giro + 1) + "a-notizia", 1800); continue; }
        if (f === "scrittura" && !fatte[k]) {
          var chi = gioca();
          if (!await W.aspetta(function () { return chi.every(function (x) { return velo(W.finestra(x)); }); }, 8000)) continue;
          fatte[k] = 1;
          if (!gino && v.giro === 0) {
            gino = true; await W.apriTel("Gino", { hash: "gioco=balla&stanza=" + C, x: 740, spiaBalla: true }); sistema();
            await W.dorme(4000); await foto("1b-gino-arriva-mentre-si-scrive", 600);
          }
          if (v.giro === 0) {   // il conto delle lettere che mancano: Paky a 44 lettere, Luca a 50
            var tP = velo(P).querySelector(".bc-penna"), tL = velo(W.finestra("Luca")).querySelector(".bc-penna");
            tP.value = BALLE.Paky.slice(0, 44); tP.dispatchEvent(new P.Event("input", { bubbles: true }));
            tL.value = BALLE.Luca; tL.dispatchEvent(new (W.finestra("Luca").Event)("input", { bubbles: true }));
            await foto("1b2-conto-delle-lettere", 600);
          }
          scrivi(P, BALLE.Paky); scrivi(W.finestra("Luca"), BALLE.Luca);
          await foto((v.giro + 1) + "c-scrittura-aspetta", 1200);
          chi.forEach(function (x) { if (x !== "Paky" && x !== "Luca") scrivi(W.finestra(x), BALLE[x]); });
          continue;
        }
        if (f === "voto" && !fatte[k]) {
          var chi2 = gioca();
          if (!await W.aspetta(function () { return chi2.every(function (x) { return velo(W.finestra(x)); }); }, 8000)) continue;
          fatte[k] = 1;
          await foto((v.giro + 1) + "d-voto", 900);
          var ve = vera();
          vota(P, function (t) { return t.indexOf(BALLE.Luca) === 0; }); vota(W.finestra("Luca"), function (t) { return t.indexOf(BALLE.Sara) === 0; });
          await foto((v.giro + 1) + "d-voto-due-hanno-votato", 900);
          vota(W.finestra("Sara"), function (t) { return t === ve; });
          if (chi2.indexOf("Gino") >= 0) vota(W.finestra("Gino"), function (t) { return t.indexOf(BALLE.Paky) === 0; });
          continue;
        }
        if (f === "rivela") {
          var d = P.document;
          if (d.querySelector(".bc-ign-sch") && !fatte[k + "i"]) { fatte[k + "i"] = 1; await foto((v.giro + 1) + "e-nessuno-ci-e-cascato", 1500); continue; }
          var tb = d.querySelector(".riv2 .bc-timbro.on");
          if (tb && v.passo !== passo) { passo = v.passo; await foto((v.giro + 1) + "f-rivela-" + (n++) + (d.querySelector(".riv2 .bc-big.vera") ? "-verita" : "-balla"), 1700); continue; }
        }
        if (f === "oro" && !fatte[k]) { fatte[k] = 1; await foto((v.giro + 1) + "g-balla-d-oro", 2200); continue; }
        if (f === "punti" && !fatte[k]) {
          if (!await W.aspetta(function () { return P.document.querySelector(".bc-clas2") && P.document.querySelector(".bc-avanti"); }, 12000)) continue;
          fatte[k] = 1; await foto((v.giro + 1) + "h-classifica", 1500);
          gioca().forEach(function (x) { W.clicca(W.finestra(x), /Avanti/, ".bc-avanti"); });
          continue;
        }
        if (f === "fine") {
          if (await W.aspetta(function () { return P.document.querySelector(".bc-podio"); }, 40000)) await foto("9-podio", 1800);
          await W.dorme(6000); await foto("9z-dopo-il-podio", 300);
          break;
        }
        await W.dorme(150);
      }
    } finally { clearInterval(tieni); }
    return "foto fatte";
  } });
})();

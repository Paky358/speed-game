// SCENE DA FOTOGRAFARE DEL PREZZO È GIUSTO (20 nov 2026, caccia ai difetti). Si caricano dopo prezzo/base.js.
// Con lo strumento delle foto (difetti/foto.js) W.scatta fa la foto; con prova.js non fa niente (le scene restano prove).
// pfi: le regole dei giochi a premi («Come si gioca»): per ogni coppia di giochi a premi (W.__pfOpz.coppie) e ogni misura
//      (W.__pfOpz.misure) una partita «Contro il Bot» con solo quei due giochi: foto della scelta (chi ha vinto l'Offerta
//      vede i due giochi) e della schermata delle regole di ognuno; misura il testo (parole) e il tempo vero della schermata.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;
  if (!W.scatta) W.scatta = async function () {};
  // il telefono alla misura vera (L × A), senza rimpicciolirlo, a x punti da sinistra
  W.misuraTel = function (nome, L, Al, x) {
    var f = document.getElementById("tel-" + nome); if (!f) return;
    f.style.transform = "none"; f.style.width = L + "px"; f.style.height = Al + "px"; f.style.left = (x || 0) + "px"; f.style.top = "0px";
    try { f.contentWindow.dispatchEvent(new f.contentWindow.Event("resize")); } catch (e) {}
  };
  function log(s) { try { console.log("[pf] " + s); } catch (e) {} }
  var TUTTI = ["piuomeno", "alpinista", "ordine", "troppo", "plinko", "spesa", "cassaforte", "dadi", "mirino", "prova5", "togli"];

  // apre «Contro il Bot» con solo i giochi a premi scelti (gli altri si tolgono appena il gioco è arrivato)
  async function botCon(premi, imp, L, Al) {
    var w = await W.apriTel("Paky", { x: 0, spiaPrezzo: true, prima: function (w2) { w2.__imp = imp; var f = w2.frameElement; if (f && L) { f.style.transform = "none"; f.style.width = L + "px"; f.style.height = Al + "px"; } } });
    await W.pzPronto(w);
    Object.keys(w.SG_PREZZO_PREMI).forEach(function (k) { if (premi.indexOf(k) < 0) delete w.SG_PREZZO_PREMI[k]; });
    var tess = await W.aspetta(function () { return [].filter.call(w.document.querySelectorAll(".tessera"), function (t) { return /Prezzo è Giusto/.test(t.textContent); })[0]; }, 8000);
    if (!tess) no("in home non c'è la tessera del Prezzo è Giusto");
    tess.click(); await W.dorme(500);
    if (!await W.aspetta(function () { return W.clicca(w, /Contro il Bot/); }, 8000)) no("non trovo «Contro il Bot» (" + T(w).slice(0, 120) + ")");
    if (!await W.aspetta(function () { return w.__prezzoH && w.__prezzoH.fase !== "lobby"; }, 8000)) no("la partita col Bot non parte");
    return w;
  }
  function parole(s) { return (s || "").trim().split(/\s+/).filter(function (x) { return /[0-9A-Za-zÀ-ú]/.test(x); }).length; }

  COPIONE.aggiungi("pfi", { nome: "Foto: le regole dei giochi a premi", fai: async function () {
    var o = W.__pfOpz || {}, coppie = o.coppie || [["spesa", "dadi"]], misure = o.misure || [[360, 640], [412, 915]], pre = o.pre || "prima";
    var misurati = {}, righe = [];
    for (var m = 0; m < misure.length; m++) for (var c = 0; c < coppie.length; c++) {
      var L = misure[m][0], Al = misure[m][1], tag = L + "x" + Al, coppia = coppie[c];
      var w = await botCon(coppia, { formato: "tv", durata: "veloce", offerte: "vista", liv: "medio", nBot: o.nBot || 2 }, L, Al);
      var H = function () { return w.__prezzoH || {}; }, visti = {}, sceltaFatta = false, fino = Date.now() + 240000, tIntro = {};
      while (Date.now() < fino && Object.keys(visti).length < coppia.length) {
        var h = H(), f = h.fase + (h.sotto ? "." + h.sotto : "");
        if (f === "scegli" && !sceltaFatta) {
          await W.dorme(1300); sceltaFatta = true;
          await W.scatta("Paky", pre + "-scegli-" + coppia.join("+") + "-" + tag);
          continue;
        }
        if (f === "premio.intro" && h.premio && !visti[h.premio.tipo]) {
          var tipo = h.premio.tipo, k = h.k, t0 = Date.now();
          visti[tipo] = 1;
          await W.dorme(1500);
          var d = w.document, p = d.querySelector(".pz-come") || d.querySelector(".pz-intro p"), testo = p ? p.textContent : "", righe3 = d.querySelectorAll(".pz-come .r").length, gv = W.PZ.controllaVista(w);
          if (pre === "dopo" && righe3 !== 3) no(tipo + ": sulla regola non ci sono le tre righe (come si gioca, esempio, punti)");
          if (gv.length) no(tipo + " a " + tag + ": " + gv.join("; "));
          await W.scatta("Paky", pre + "-regole-" + tipo + "-" + tag);
          // quanto dura davvero la schermata (senza «Avanti»)
          await W.aspetta(function () { return H().k !== k; }, 60000);
          tIntro[tipo] = Math.round((Date.now() - t0) / 100) / 10;
          if (pre === "dopo" && (tIntro[tipo] < 14.5 || tIntro[tipo] > 31)) no(tipo + ": la regola resta " + tIntro[tipo] + " s (deve essere tra 15 e 30)");
          if (!misurati[tipo]) { misurati[tipo] = 1; righe.push(tipo + ": " + parole(testo) + " parole, " + testo.length + " lettere, " + tIntro[tipo] + " s"); }
          continue;
        }
        // il giocatore automatico: offre giusto (così vince l'Offerta e sceglie lui), gioca i giochi a premi; mai «Avanti»
        if (f !== "premio.intro" && f !== "scegli") try { await W.PZ.agisci("Paky", { avanti: f === "punti", offerta: function (pr) { return pr * 0.98; } }); } catch (e) {}
        else if (f === "scegli" && sceltaFatta) try { await W.PZ.agisci("Paky", { avanti: false }); } catch (e) {}
        await W.dorme(250);
      }
      if (Object.keys(visti).length < coppia.length) no("a " + tag + " non si arriva alle regole di " + coppia.join(" e ") + " (fase " + H().fase + "." + H().sotto + ")");
      log(tag + " " + coppia.join("+") + " fatto");
    }
    righe.forEach(log);
    return righe.join(" · ") + (W.erroriTel().length ? " · ERRORI: " + W.erroriTel().slice(0, 3).join(" / ") : "");
  } });

  // ===================== pfo: la puntata intera, fotografata =====================
  // W.__pfOpz: { nome: "o2", amici: ["Luca"], misure: { Paky: [360, 640], Luca: [412, 915] }, foto: ["Paky", "Luca"],
  //   guarda: "Bea" (entra a guardare al primo gioco a premi), tardi: "Mario" (arriva col link alla seconda Offerta),
  //   imp: {…}, stesso: true (sullo stesso telefono, coi nomi degli amici), ritardi: { Paky: 3000 } (dopo quanto ognuno gioca) }
  // Foto di ogni telefono in W.__pfOpz.foto a ogni cambio di momento (dopo 0,9 s) e poi ogni 3,5 s (al massimo W.__pfOpz.extra in più, di partenza 1);
  // il diario (W.__pfLog): per ogni foto il momento, la barra in basso, il testo dello schermo e i guai di controllaVista.
  function testoBarra(w) { var b = w.document.querySelector(".st-barra.on"); return b ? b.innerText.replace(/\s+/g, " ").trim().slice(0, 120) : ""; }
  COPIONE.aggiungi("pfo", { nome: "Foto: la puntata intera", fai: async function () {
    var o = W.__pfOpz || {}, nomeRun = o.nome || "o", amici = o.amici || ["Luca"], misure = o.misure || { Paky: [360, 640], Luca: [412, 915] };
    var fotoDi = o.foto || Object.keys(misure), imp = o.imp || { formato: "tv", durata: "veloce", offerte: "vista" };
    var rit = Object.assign({ Paky: 3000, Luca: 5500, Sara: 2000, Gina: 4000, Ugo: 2500, Tea: 6500, Mario: 3500 }, o.ritardi || {});
    W.__pfLog = [];
    var xFoto = 1200;
    function metti(nome) { var m = misure[nome]; if (!m) return; W.misuraTel(nome, m[0], m[1], xFoto); xFoto += m[0] + 24; }
    var C = null, host = "Paky", giocano;
    if (o.stesso) {
      var w0 = await W.PZ.stessoTelefono(amici, imp); metti("Paky"); giocano = ["Paky"];
      if (!await W.aspetta(function () { return W.clicca(w0, /Comincia/); }, 6000)) no("sullo stesso telefono non trovo «Comincia»");
      if (!await W.aspetta(function () { return w0.__prezzoH && w0.__prezzoH.fase !== "lobby"; }, 6000)) no("sullo stesso telefono la partita non comincia");
    } else {
      W.PZ.conSpia();
      var X = await W.PZ.salaPrezzo(amici, imp); C = X.C;
      if (o.premi) { var PP = W.finestra("Paky").SG_PREZZO_PREMI || {}; Object.keys(PP).forEach(function (k) { if (o.premi.indexOf(k) < 0) delete PP[k]; }); }   // (solo i giochi a premi scelti)
      giocano = ["Paky"].concat(amici);
      fotoDi.forEach(function (n) { if (n !== o.guarda && n !== o.tardi) metti(n); });
    }
    var H = function () { var w = W.finestra(host); return (w && w.__prezzoH) || {}; };
    var visto = {}, ult = {}, nf = 0, entrati = {}, fino = Date.now() + (o.ms || 900000), t0 = Date.now();
    async function foto(nome, chiave) {
      var w = W.finestra(nome); if (!w || !w.document) return;
      var h = H(), file = nomeRun + "-" + String(++nf).padStart(3, "0") + "-" + nome + "-" + (h.fase || "") + (h.sotto ? "." + h.sotto : "");
      var guai = []; try { var vv = W.PZ.controllaVista(w); guai = Array.isArray(vv) ? vv : (vv ? [String(vv)] : []); } catch (e) { guai = ["(controllo: " + e.message + ")"]; }
      W.__pfLog.push({ file: file, nome: nome, t: Math.round((Date.now() - t0) / 100) / 10, fase: h.fase, sotto: h.sotto || null, k: h.k, barra: testoBarra(w), testo: T(w).replace(/\s+/g, " ").slice(0, 400), guai: guai });
      await W.scatta(nome, file);
    }
    while (Date.now() < fino) {
      var h = H(); if (h.fase === "fine" && !o.stesso && !(W.finestra("Paky").document.querySelector(".st-vista"))) { await W.dorme(2500); for (var q of fotoDi) if (W.finestra(q)) await foto(q, "fine"); break; }
      if (o.stesso && h.fase === "fine" && !W.finestra("Paky").document.querySelector(".st-vista")) { await W.dorme(2500); await foto("Paky", "fine"); break; }
      // chi guarda entra al primo gioco a premi, chi arriva tardi alla seconda Offerta
      if (o.guarda && !entrati[o.guarda] && h.fase === "scegli") { entrati[o.guarda] = 1; await W.apriTel(o.guarda, { hash: "gioco=prezzo&stanza=" + C + "&guarda=1", x: 900 }); metti(o.guarda); }
      if (o.tardi && !entrati[o.tardi] && h.fase === "offerta" && (h.iOff || 1) >= 2) { entrati[o.tardi] = 1; await W.apriTel(o.tardi, { hash: "gioco=prezzo&stanza=" + C, x: 950 }); metti(o.tardi); giocano.push(o.tardi); }
      var chiave = (h.fase || "") + "|" + (h.sotto || "") + "|" + h.k;
      // le foto
      for (var i = 0; i < fotoDi.length; i++) {
        var n = fotoDi[i]; if (!W.finestra(n)) continue;
        var u = ult[n] || {};
        if (u.chiave !== chiave) { ult[n] = { chiave: chiave, da: Date.now(), quante: 0, prossima: Date.now() + 900 }; continue; }
        var max = 1 + ((o.pocheFoto || []).indexOf(n) >= 0 ? 0 : (o.extra != null ? o.extra : 1));
        if (Date.now() >= u.prossima && u.quante < max) { u.quante++; u.prossima = Date.now() + 3600; await foto(n, chiave); }
      }
      // si gioca (ognuno dopo un po', così si vedono anche i pannelli aperti e le attese); mai «Avanti» (i tempi si vedono interi)
      for (var j = 0; j < giocano.length; j++) {
        var g = giocano[j], kk = chiave + "|" + g;
        if (!visto[kk]) visto[kk] = Date.now();
        if (Date.now() - visto[kk] < (rit[g] || 3000)) continue;
        try { await W.PZ.agisci(g, { avanti: false, host: host }); } catch (e) {}
      }
      await W.dorme(200);
    }
    W.PZ.senzaSpia();
    if (H().fase !== "fine") no("la puntata non arriva alla fine (fase " + H().fase + "." + H().sotto + ")");
    return nf + " foto · " + (W.erroriTel().length ? "ERRORI: " + W.erroriTel().slice(0, 4).join(" / ") : "nessun errore");
  } });
})();

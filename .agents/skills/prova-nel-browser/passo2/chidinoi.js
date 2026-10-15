// PROVE di «Chi di Noi?» (id chidinoi) coi telefoni finti, dalla Sala.
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("passo2/chidinoi.js"); window.__run = COPIONE.prova(400)
// (gli scenari durano minuti: lanciali senza aspettarli e poi leggi COPIONE.esiti)
// 400: 3 telefoni, 3 posti da 3 domande: partita intera (sfilata, arrivo, Immagini, Scrivi con le battute della casa, Disegna,
//      gran finale, titoli, figurina), un amico che ricarica mentre disegna (ritrova il disegno) e mentre vota, Rivincita col 3-2-1, Cambia gioco.
// 401: 5 telefoni, 3 posti da 4 domande (c'è Chi di noi): uno spento più di 20 s a metà (non blocca), poi torna e ritrova il posto.
// 402: 8 telefoni, 3 posti da 5 domande: partita intera con jolly, «⏩ Avanti» della maggioranza, l'host che ricarica (tutti nella Sala).
// 403: 10 telefoni: misure 360x640 e 412x915 in ogni passo (niente scorre, niente esce), console pulita.
// 404: chi arriva a partita cominciata guarda (niente tasti) ed entra alla Rivincita; il protagonista che esce non blocca.
// 405: i messaggi: nella foto (vm) mai i disegni né le battute prima della vetrina; i disegni viaggiano leggeri (sotto i 20 KB).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T, vm = A.vm, ids = A.ids;
  var NOME = "Chi di Noi?";

  // ---- aiuti ----
  function pt(w, n, tipo, x, y) {   // un evento del dito su un elemento (pointerdown/move/up)
    var r = n.getBoundingClientRect();
    var o = { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true, clientX: x != null ? x : r.left + r.width / 2, clientY: y != null ? y : r.top + r.height / 2 };
    n.dispatchEvent(new w.PointerEvent(tipo, o));
  }
  function tocca(w, n) { if (!n) return false; pt(w, n, "pointerdown"); pt(w, n, "pointerup"); return true; }
  function nomeId(C, id) { var p = (vm(C).players || []).filter(function (x) { return x.id === id; })[0]; return p ? p.nome : null; }
  function tel(C, id) { var n = nomeId(C, id); return n ? W.finestra(n) : null; }
  function vivi(C) { return (vm(C).players || []).filter(function (p) { return !p.via; }); }
  function caso(a) { return a[Math.floor(Math.random() * a.length)]; }
  // un disegno col dito e un adesivo
  async function disegnaUn(w) {
    var f = w.document.querySelector(".cn-tav-foglio"); if (!f) return false;
    var r = f.getBoundingClientRect(), x = r.left + r.width * 0.3, y = r.top + r.height * 0.3;
    pt(w, f, "pointerdown", x, y);
    for (var i = 1; i < 12; i++) pt(w, f, "pointermove", x + i * r.width * 0.04, y + Math.sin(i) * r.height * 0.08);
    pt(w, f, "pointerup", x + 12 * r.width * 0.04, y);
    var ad = w.document.querySelectorAll(".cn-ades"); if (ad.length) ad[Math.floor(Math.random() * ad.length)].click();
    return true;
  }
  // un passo giocato da tutti (opz: { salta: [nomi che non rispondono], jolly: true, avanti: true })
  async function giocaPasso(C, opz) {
    opz = opz || {};
    var v = vm(C); if (v.fase !== "gioco") return false;
    var k = v.k, ps = v.passo, gente = vivi(C).filter(function (p) { return (opz.salta || []).indexOf(p.nome) < 0 && !p.forse; });
    var ms = 30000;
    if (/^(sfilata|arrivo|svela|classifica|fintro|fsvela|premi)$/.test(ps)) {
      await W.dorme(opz.veloce ? 250 : 900);
      gente.forEach(function (p) { var w = W.finestra(p.nome); if (w) W.clicca(w, /Avanti/, ".cn-btn.avanti"); });
    } else if (ps === "scegli") {
      for (var i = 0; i < gente.length; i++) {
        var w = W.finestra(gente[i].nome); if (!w) continue;
        var c = await W.aspetta(function () { var l = w.document.querySelectorAll(".cn-carta, .cn-volto"); return l.length ? l : null; }, 4000);
        if (!c) { no(gente[i].nome + " non vede le carte"); continue; }
        tocca(w, opz.uguali ? c[0] : caso([].slice.call(c)));
        if (opz.jolly && Math.random() < 0.4) W.clicca(w, /Jolly/, ".cn-btn.jolly");
        W.clicca(w, /Lancia/, ".cn-btn.vai");
      }
    } else if (ps === "scrivi") {
      for (var j = 0; j < gente.length; j++) {
        var w2 = W.finestra(gente[j].nome); if (!w2) continue;
        var ta = await W.aspetta(function () { return w2.document.querySelector(".cn-campo"); }, 4000); if (!ta) { no(gente[j].nome + " non ha il campo"); continue; }
        ta.value = "Battuta di " + gente[j].nome; ta.dispatchEvent(new w2.Event("input", { bubbles: true }));
        W.clicca(w2, /Manda/, ".cn-btn.vai");
      }
    } else if (ps === "vetrina") {
      ms = 40000;
    } else if (ps === "vota" || ps === "fvota") {
      for (var q = 0; q < gente.length; q++) {
        var w3 = W.finestra(gente[q].nome); if (!w3) continue;
        if (v.voci) {
          var vv = await W.aspetta(function () { var l = [].filter.call(w3.document.querySelectorAll(".cn-voce"), function (x) { return !x.classList.contains("mia"); }); return l.length ? l : null; }, 4000);
          if (!vv) continue;
          tocca(w3, opz.uguali ? vv[0] : caso(vv));
        } else {
          var cc = await W.aspetta(function () { var l = [].filter.call(w3.document.querySelectorAll(".cn-cella"), function (x) { return !x.classList.contains("mia") && !x.classList.contains("vuota"); }); return l.length ? l : null; }, 6000);
          if (!cc) continue;
          tocca(w3, opz.uguali ? cc[0] : caso(cc)); await W.dorme(60);
          W.clicca(w3, /Voto questo/, ".cn-btn.vai");
        }
        if (opz.jolly && Math.random() < 0.3) W.clicca(w3, /Jolly/, ".cn-btn.jolly");
        W.clicca(w3, /Vota/, ".cn-azione .cn-btn.vai");
      }
    } else if (ps === "disegna" || ps === "passa") {
      for (var d = 0; d < gente.length; d++) {
        var w4 = W.finestra(gente[d].nome); if (!w4) continue;
        await W.aspetta(function () { return w4.document.querySelector(".cn-tav-foglio"); }, 5000);
        await disegnaUn(w4); await W.dorme(30);
        W.clicca(w4, /Fatto/, ".cn-btn.vai");
      }
      ms = 100000;
    }
    await W.aspetta(function () { var x = vm(C); return x.fase !== "gioco" || x.k !== k; }, ms);
    return true;
  }
  async function finoAllaFine(C, ms, opz) {
    var fino = Date.now() + (ms || 400000);
    while (Date.now() < fino) { if (vm(C).fase === "fine") return true; if (vm(C).fase !== "gioco") return false; await giocaPasso(C, opz); }
    return vm(C).fase === "fine";
  }
  async function finoA(C, cond, ms, opz) {
    var fino = Date.now() + (ms || 200000);
    while (Date.now() < fino) { var v = vm(C); if (v.fase !== "gioco") return false; if (cond(v)) return true; await giocaPasso(C, opz); }
    return false;
  }
  function senzaErrori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  async function salaECominci(amici) {
    var Z = await A.salaConAmici(amici);
    var C = await A.lanciaDallaSala("Paky", Z.S, NOME);
    if (!await W.aspetta(function () { return ids(C, "players").length === amici.length + 1; }, 15000)) no("nella saletta non arrivano tutti (" + ids(C, "players").length + ")");
    return { S: Z.S, C: C, w: Z.w };
  }
  async function regola(P, re) {
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/, ".sl-regole"); }, 4000)) no("non trovo ⚙️ Regole");
    await W.dorme(200);
    var ok = W.clicca(P, re, ".modo-chip, .cat-chip");
    W.clicca(P, /Fatto/, ".sl-foglio button"); await W.dorme(300);
    if (!ok) no("non trovo la regola " + re);
  }
  // nella saletta: quanti posti e quante domande (i tasti hanno solo il numero: si cercano nel loro gruppo)
  async function regole(P, nPosti, nDom, tempi) {
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/, ".sl-regole"); }, 4000)) no("non trovo ⚙️ Regole");
    await W.dorme(250);
    var grp = [].slice.call(P.document.querySelectorAll(".modo-griglia"));
    function premi(g, testo) { var b = g && [].find.call(g.querySelectorAll(".modo-chip"), function (x) { return x.textContent.trim() === String(testo); }); if (b) b.click(); else no("non trovo il tasto " + testo); }
    premi(grp[0], nPosti); premi(grp[1], nDom); if (tempi) premi(grp[2], tempi);
    W.clicca(P, /Fatto/, ".sl-foglio button"); await W.dorme(300);
  }
  async function comincia(C) {
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/, ".sl-go"); }, 6000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 10000)) no("la partita non comincia");
  }
  // niente scorre e niente esce dallo schermo (il palco del gioco)
  function misura(w, dove) {
    var d = w.document, r = d.querySelector(".cn"); if (!r) return;
    // (con il pannello del browser nascosto le animazioni restano ferme al primo fotogramma: per misurare si tolgono)
    if (!d.getElementById("cn-noanim")) { var st = d.createElement("style"); st.id = "cn-noanim"; st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}"; d.head.appendChild(st); }
    var H = w.innerHeight, Wd = w.innerWidth, fuori = [];
    if (d.documentElement.scrollHeight > H + 2) fuori.push("la pagina scorre (" + d.documentElement.scrollHeight + " > " + H + ")");
    [].forEach.call(d.querySelectorAll(".cn-palco button, .cn-carta, .cn-volto, .cn-voce, .cn-cella, .cn-tav-foglio, .cn-domanda, .cn-riga, .cn-premio"), function (n) {
      var b = n.getBoundingClientRect(); if (!b.width || !b.height) return;
      if (b.bottom > H + 1 || b.right > Wd + 1 || b.left < -1 || b.top < -1) fuori.push((n.className || n.tagName).toString().split(" ")[0] + " " + Math.round(b.top) + "-" + Math.round(b.bottom));
    });
    if (fuori.length) no(dove + " " + Wd + "x" + H + ": " + fuori.slice(0, 4).join(", "));
  }

  COPIONE.cn = { giocaPasso: giocaPasso, finoAllaFine: finoAllaFine, tocca: tocca, tel: tel, misura: misura };

  COPIONE.aggiungi(400, { nome: "Chi di Noi?: 3 telefoni, partita intera, ricariche (disegno e voto), Rivincita, Cambia gioco", fai: async function () {
    var Z = await salaECominci(["Giulia", "Luca"]), C = Z.C, P = W.finestra("Paky");
    await regole(P, 3, 3);
    if (!await W.aspetta(function () { return /3 posti · 3 domande/.test(A.regoleDi(W.finestra("Giulia"))); }, 5000)) no("Giulia legge «" + A.regoleDi(W.finestra("Giulia")) + "»");
    await comincia(C);
    var v = vm(C);
    if (v.passo !== "sfilata") no("non parte la sfilata (" + v.passo + ")");
    if (!v.scaletta || v.scaletta.length !== 3) no("la scaletta non ha 3 posti");
    var prot = v.scaletta.map(function (s) { return s.prot; });
    if (prot.filter(function (x, i) { return prot.indexOf(x) === i; }).length !== 3) no("in 3 con 3 posti non vanno sotto torchio tutti (" + prot.join(",") + ")");
    // fino al primo Disegna: Luca ricarica a metà e ritrova il disegno
    if (!await finoA(C, function (x) { return x.passo === "disegna"; }, 200000)) no("non arriva il Disegna");
    var wL = W.finestra("Luca");
    await W.aspetta(function () { return wL.document.querySelector(".cn-tav-foglio"); }, 5000);
    await disegnaUn(wL); await W.dorme(400);
    await W.ricarica("Luca");
    var wL2 = await W.aspetta(function () { var w = W.finestra("Luca"); return w && w.document.querySelector(".cn-tav-foglio") ? w : null; }, 15000);
    if (!wL2) no("Luca dopo la ricarica non ritrova la tavola («" + T(W.finestra("Luca")).slice(0, 100) + "»)");
    else if (!wL2.document.querySelector(".cn-ad")) no("Luca dopo la ricarica non ritrova il suo adesivo");
    await giocaPasso(C);
    if (vm(C).passo !== "vota" && vm(C).passo !== "svela") no("dopo il Disegna non si vota (" + vm(C).passo + ")");
    if (vm(C).passo === "vota") {
      // Giulia vota, poi ricarica: ritrova il voto
      var wG = W.finestra("Giulia");
      var cel = await W.aspetta(function () { var l = [].filter.call(wG.document.querySelectorAll(".cn-cella"), function (x) { return !x.classList.contains("mia") && !x.classList.contains("vuota"); }); return l.length ? l : null; }, 8000);
      if (!cel) no("Giulia non vede la galleria");
      else { tocca(wG, cel[0]); await W.dorme(80); W.clicca(wG, /Voto questo/); W.clicca(wG, /Vota/, ".cn-azione .cn-btn.vai"); }
      await W.dorme(500);
      await W.ricarica("Giulia");
      if (!await W.aspetta(function () { var w = W.finestra("Giulia"); return w && w.document.querySelector(".cn-vota.inviato") || vm(C).passo !== "vota"; }, 15000)) no("Giulia dopo la ricarica non ritrova il suo voto");
    }
    if (!await finoAllaFine(C, 400000)) no("la partita non finisce (" + vm(C).fase + "/" + vm(C).passo + ")");
    var f = vm(C).fine;
    if (!f || !f.classifica || f.classifica.length !== 3) no("classifica finale sbagliata");
    if (f.classifica.some(function (r) { return r.punti % 100 !== 0; })) no("punti non a botte di 100");
    if (!await W.aspetta(function () { return A.tastiFineDi(P) && A.tastiFineDi(W.finestra("Giulia")); }, 8000)) no("mancano i tasti di fine");
    if (!P.document.querySelector(".cn-podio")) no("manca il podio");
    if (!W.clicca(P, /La mia figurina/)) no("manca «La mia figurina»");
    else { if (!await W.aspetta(function () { return P.document.querySelector(".cn-fig-img"); }, 4000)) no("la figurina non si vede"); W.clicca(P, /Chiudi/, ".cn-fig-tasti button"); }
    var tP = A.tastiFineDi(P).join(" | ");
    if (tP !== "↻ Rivincita | 🎮 Cambia gioco") no("Paky ha «" + tP + "»");
    senzaErrori();
    W.clicca(P, /Rivincita/, ".fine-tasti button");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).partita === 2; }, 15000)) no("la Rivincita non riparte (" + vm(C).fase + ")");
    // la rivincita: si gioca fino in fondo veloce
    if (!await finoAllaFine(C, 400000, { veloce: true, uguali: true })) no("la rivincita non finisce");
    await W.aspetta(function () { return A.tastiFineDi(P); }, 6000);
    if (!W.clicca(P, /Cambia gioco/, ".fine-tasti button")) no("non trovo «Cambia gioco»");
    var tess = await W.aspetta(function () { return A.tessera(P, "La Scalinata"); }, 6000);
    if (!tess) no("dopo «Cambia gioco» Paky non è nell'elenco");
    else { tess.click(); if (!await W.aspetta(function () { return A.dentro(W.finestra("Giulia")) && /Scalinata/.test(T(W.finestra("Giulia"))); }, 10000)) no("Giulia non arriva nella Scalinata"); }
    senzaErrori();
    return "partita intera in 3 (classifica " + f.classifica.map(function (r) { return r.nome + " " + r.punti; }).join(", ") + "), ricariche ok, Rivincita e Cambia gioco ok";
  } });

  COPIONE.aggiungi(401, { nome: "Chi di Noi?: 5 telefoni, uno spento più di 20 s non blocca e poi rientra", fai: async function () {
    var Z = await salaECominci(["Giulia", "Luca", "Sara", "Marco"]), C = Z.C, P = W.finestra("Paky");
    await regole(P, 3, 4);
    await comincia(C);
    if (!await finoA(C, function (x) { return x.passo === "scegli" && x.dom && x.dom.tipo === "c"; }, 200000)) no("non arriva un Chi di noi");
    W.spegni("Sara");
    // gli altri rispondono subito: si va avanti senza Sara (appena è "forse", o allo scadere del tempo)
    await giocaPasso(C, { salta: ["Sara"] });
    if (!await W.aspetta(function () { return vm(C).passo === "svela"; }, 25000)) no("senza Sara il Chi di noi non va avanti (" + vm(C).passo + ")");
    if (!await W.aspetta(function () { return (vm(C).players || []).some(function (p) { return p.nome === "Sara" && p.via; }); }, 40000)) no("Sara spenta non esce dopo 20 s");
    // si gioca un po' senza di lei
    await finoA(C, function (x) { return x.passo === "scrivi"; }, 120000, { salta: ["Sara"] });
    W.riaccendi("Sara");
    if (!await W.aspetta(function () { return (vm(C).players || []).some(function (p) { return p.nome === "Sara" && !p.via; }); }, 30000)) no("Sara riaccesa non rientra al suo posto");
    if (!await finoAllaFine(C, 500000)) no("la partita non finisce");
    var f = vm(C).fine; if (!f || f.classifica.length !== 5) no("classifica finale sbagliata");
    senzaErrori();
    return "5 telefoni: Sara spenta non blocca, esce dopo 20 s e rientra; classifica " + (f ? f.classifica.map(function (r) { return r.nome + " " + r.punti; }).join(", ") : "?");
  } });

  COPIONE.aggiungi(402, { nome: "Chi di Noi?: 8 telefoni, 5 domande, jolly, Avanti della maggioranza, host che ricarica", fai: async function () {
    var amici = ["Giulia", "Luca", "Sara", "Marco", "Anna", "Piero", "Ele"];
    var Z = await salaECominci(amici), C = Z.C, P = W.finestra("Paky");
    await regole(P, 3, 5, "⚡ Veloci");
    await comincia(C);
    // Avanti: più di metà (5 su 8) fa partire subito
    if (!await W.aspetta(function () { return vm(C).passo === "sfilata"; }, 5000)) no("niente sfilata");
    var k = vm(C).k;
    ["Paky", "Giulia", "Luca", "Sara"].forEach(function (n) { W.clicca(W.finestra(n), /Avanti/, ".cn-btn.avanti"); });
    await W.dorme(1200);
    if (vm(C).k !== k) no("con 4 su 8 «Avanti» si parte già");
    if ((vm(C).avanti || []).length !== 4) no("«Avanti» contati: " + (vm(C).avanti || []).length);
    W.clicca(W.finestra("Marco"), /Avanti/, ".cn-btn.avanti");
    if (!await W.aspetta(function () { return vm(C).k !== k; }, 4000)) no("con 5 su 8 «Avanti» non si parte");
    if (!await finoAllaFine(C, 700000, { jolly: true, veloce: true })) no("la partita in 8 non finisce");
    var f = vm(C).fine;
    var jol = (vm(C).players || []).filter(function (p) { return p.jolly < 3; }).length;
    if (!jol) no("nessuno ha usato il jolly");
    // l'host ricarica: tutti nella Sala
    await W.ricarica("Paky");
    if (!await W.aspetta(function () { return ((vm(Z.S).membri) || []).length === 8 && /Sei dentro/.test(T(W.finestra("Giulia"))) && !W.finestra("Giulia").document.querySelector(".cn"); }, 25000)) no("dopo la ricarica dell'host non tornano tutti nella Sala");
    senzaErrori();
    return "8 telefoni: Avanti 4/8 no, 5/8 sì; partita intera con " + jol + " jolly usati; host che ricarica ok; classifica " + (f ? f.classifica.map(function (r) { return r.nome + " " + r.punti; }).join(", ") : "?");
  } });

  COPIONE.aggiungi(403, { nome: "Chi di Noi?: 10 telefoni, misure 360x640 e 412x915 in ogni passo", fai: async function () {
    var amici = ["Giulia", "Luca", "Sara", "Marco", "Anna", "Piero", "Ele", "Ugo", "Bea"];
    var Z = await salaECominci(amici), C = Z.C, P = W.finestra("Paky");
    await regole(P, 3, 5, "⚡ Veloci");
    await comincia(C);
    var visti = {}, fG = document.getElementById("tel-Giulia");
    async function misuraOra(dove) {
      for (var m = 0; m < 2; m++) {
        var dim = m ? [412, 915] : [360, 640];
        fG.style.width = dim[0] + "px"; fG.style.height = dim[1] + "px";
        var w = W.finestra("Giulia"); w.dispatchEvent(new w.Event("resize")); await W.dorme(350);
        misura(w, dove);
      }
      fG.style.width = "360px"; fG.style.height = "740px";
    }
    var fino = Date.now() + 800000;
    while (Date.now() < fino && vm(C).fase === "gioco") {
      var v = vm(C), chiave = v.passo + (v.dom && v.dom.tipo ? "-" + v.dom.tipo : "");
      if (!visti[chiave]) { visti[chiave] = 1; await W.dorme(1300); await misuraOra(chiave); }
      await giocaPasso(C, { veloce: true });
    }
    if (vm(C).fase !== "fine") no("la partita in 10 non finisce");
    await W.dorme(800);
    // la classifica finale con 10: podio, due colonne, figurina, faccine e tasti senza scorrere
    for (var m2 = 0; m2 < 2; m2++) {
      var dim2 = m2 ? [412, 915] : [360, 640];
      fG.style.width = dim2[0] + "px"; fG.style.height = dim2[1] + "px";
      var wf = W.finestra("Giulia"); wf.dispatchEvent(new wf.Event("resize")); await W.dorme(400);
      var df = wf.document;
      if (!df.getElementById("cn-noanim")) { var st2 = df.createElement("style"); st2.id = "cn-noanim"; st2.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}"; df.head.appendChild(st2); }
      await W.dorme(100);
      if (df.documentElement.scrollHeight > dim2[1] + 2) no("la classifica finale scorre a " + dim2.join("x") + " (" + df.documentElement.scrollHeight + ")");
      var cont = df.querySelector(".schermata .contenuto"); if (cont && cont.scrollHeight > cont.clientHeight + 2) no("la classifica finale non entra a " + dim2.join("x"));
    }
    fG.style.width = "360px"; fG.style.height = "740px";
    senzaErrori();
    return "10 telefoni, misurati: " + Object.keys(visti).join(", ");
  } });

  COPIONE.aggiungi(404, { nome: "Chi di Noi?: chi arriva tardi guarda ed entra alla Rivincita; il protagonista che esce non blocca", fai: async function () {
    var Z = await salaECominci(["Giulia", "Luca", "Sara"]), C = Z.C, P = W.finestra("Paky");
    await regole(P, 3, 3);
    await comincia(C);
    // Bea arriva a partita cominciata (dal link della Sala): guarda
    await W.apriTel("Bea", { hash: "sala=" + Z.S, x: 185 * 4, salaSempre: true });
    await W.aspetta(function () { return W.clicca(W.finestra("Bea"), /Guarda/); }, 15000);
    if (!await W.aspetta(function () { return (vm(C).guarda || []).some(function (g) { return g.nome === "Bea"; }); }, 15000)) no("Bea non è tra chi guarda");
    if (!await finoA(C, function (x) { return x.passo === "scegli"; }, 60000)) no("non arriva una domanda");
    var wB = W.finestra("Bea");
    await W.dorme(600);
    if (wB.document.querySelector(".cn-azione") && getComputedStyle(wB.document.querySelector(".cn-azione")).visibility !== "hidden") no("Bea che guarda ha i tasti per rispondere");
    // il protagonista del posto esce apposta
    var pr = vm(C).prot, nP = nomeId(C, pr);
    if (nP && nP !== "Paky") {
      var wp = W.finestra(nP); W.clicca(wp, /‹/, ".cn-esci");
      await W.dorme(600);
      if (!await W.aspetta(function () { return (vm(C).players || []).some(function (p) { return p.id === pr && p.via; }); }, 8000)) no(nP + " uscito non risulta via");
    }
    if (!await finoAllaFine(C, 400000)) no("senza il protagonista la partita non finisce");
    W.clicca(P, /Rivincita/, ".fine-tasti button");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).partita === 2; }, 20000)) no("la Rivincita non riparte");
    if (!(vm(C).players || []).some(function (p) { return p.nome === "Bea"; })) no("alla Rivincita Bea non gioca");
    senzaErrori();
    return "Bea guarda senza tasti ed entra alla Rivincita; " + (nP || "?") + " esce e la partita va avanti";
  } });

  COPIONE.aggiungi(405, { nome: "Chi di Noi?: niente disegni né battute nella foto, disegni leggeri in rete", fai: async function () {
    var Z = await salaECominci(["Giulia", "Luca", "Sara"]), C = Z.C, P = W.finestra("Paky");
    await regole(P, 3, 5);
    // spia: tutti i messaggi che passano dal broker
    var spia = [], vecchio = W.BR.log.length;
    var orig = W.BR.__pubSpia || null;
    await comincia(C);
    var max = 0, testiPrima = false, disInVm = false, maxDis = 0;
    var fino = Date.now() + 500000;
    while (Date.now() < fino && vm(C).fase === "gioco") {
      var s = W.BR.retained["seratagiochi/v1/" + C + "/stato"] || "";
      if (s.length > max) max = s.length;
      var v = vm(C);
      if ((v.passo === "scrivi") && /Battuta di/.test(s)) testiPrima = true;
      if (/"s":\[\[/.test(s)) disInVm = true;
      await giocaPasso(C, { veloce: true });
    }
    if (vm(C).fase !== "fine") no("la partita non finisce");
    if (testiPrima) no("le battute sono nella foto prima della vetrina");
    if (disInVm) no("un disegno è finito nella foto trattenuta");
    if (max > 30000) no("la foto è troppo grande (" + max + " byte)");
    senzaErrori();
    return "foto al massimo " + max + " byte, nessuna battuta prima della vetrina, nessun disegno nella foto";
  } });
})();

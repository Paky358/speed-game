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
// LA FOTO VERA (fotocamera finta: un canvas con una faccia disegnata, mai la fotocamera vera):
// 406: selfie, galleria e avatar, i filtri (solo il nome del filtro viaggia), chi entra col codice vede gli avatar, ricarica, Rivincita,
//      Cambia gioco (le foto spariscono); nel broker: chiave mai nei messaggi, foto mai trattenute né in chiaro, si aprono solo con la chiave.
// 407: l'host ricarica in saletta e le foto tornano; «📸 Rifai» con una foto nuova.
// 408: l'host spegne le foto («🙂 Solo avatar») e le riaccende.
// 409: il camerino a 360x640 e 412x915 (scelta, fotocamera, sistema, filtri).
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
    // (tutti i telefoni devono avere già la sfilata a schermo)
    if (!await W.aspetta(function () { return ["Paky", "Giulia", "Luca", "Sara", "Marco"].every(function (n) { return W.finestra(n).document.querySelector(".cn-sf .cn-btn.avanti"); }); }, 15000)) no("la sfilata non arriva su tutti");
    if (vm(C).k !== k) no("la sfilata è finita da sola prima della prova (telefoni lenti)");
    for (var a = 0; a < 4; a++) W.clicca(W.finestra(["Paky", "Giulia", "Luca", "Sara"][a]), /Avanti/, ".cn-btn.avanti");
    await W.dorme(800);
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
    // (chi è uscito apposta manca: il core propone «▶ Comincia senza …»)
    await W.aspetta(function () { return vm(C).fase === "lobby"; }, 10000); await W.dorme(1500);
    if (vm(C).fase === "lobby") W.clicca(P, /Comincia/, ".sl-go");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).partita === 2; }, 20000)) no("la Rivincita non riparte");
    if (!(vm(C).players || []).some(function (p) { return p.nome === "Bea"; })) no("alla Rivincita Bea non gioca");
    senzaErrori();
    return "Bea guarda senza tasti ed entra alla Rivincita; " + (nP || "?") + " esce e la partita va avanti";
  } });

  COPIONE.aggiungi(405, { nome: "Chi di Noi?: niente disegni né battute nella foto, disegni leggeri in rete", fai: async function () {
    var Z = await salaECominci(["Giulia", "Luca", "Sara"]), C = Z.C, P = W.finestra("Paky");
    await regole(P, 3, 5);
    // spia: la misura di ogni messaggio con un disegno che passa dal broker
    var maxDis = 0, nDis = 0;
    function spia() {
      W.BR.clients.forEach(function (k) {
        if (k.__spiaCn) return; k.__spiaCn = true;
        var pub = k.publish;
        k.publish = function (topic, payload, o) {
          var s = String(payload);
          if (/"t":"(dis|gal)"/.test(s)) { nDis++; if (s.length > maxDis) maxDis = s.length; }
          return pub.call(this, topic, payload, o);
        };
      });
    }
    // un disegno pesante: 40 tratti da 40 punti l'uno
    async function disegnoPesante(w) {
      var f = w.document.querySelector(".cn-tav-foglio"); if (!f) return;
      var r = f.getBoundingClientRect();
      for (var t = 0; t < 40; t++) {
        var x = r.left + r.width * (0.1 + 0.8 * Math.random()), y = r.top + r.height * (0.1 + 0.8 * Math.random());
        pt(w, f, "pointerdown", x, y);
        for (var i = 1; i < 40; i++) pt(w, f, "pointermove", x + Math.cos(i / 3 + t) * r.width * 0.2, y + Math.sin(i / 2) * r.height * 0.2);
        pt(w, f, "pointerup", x, y);
      }
    }
    await comincia(C);
    var max = 0, testiPrima = false, disInVm = false, pesanti = 0;
    var fino = Date.now() + 500000;
    while (Date.now() < fino && vm(C).fase === "gioco") {
      spia();
      var s = W.BR.retained["seratagiochi/v1/" + C + "/stato"] || "";
      if (s.length > max) max = s.length;
      var v = vm(C);
      if ((v.passo === "scrivi") && /Battuta di/.test(s)) testiPrima = true;
      if (/"s":\[\[/.test(s)) disInVm = true;
      if (v.passo === "disegna" && pesanti < 2) {
        var wg = W.finestra("Giulia");
        if (await W.aspetta(function () { return wg.document.querySelector(".cn-tav-foglio"); }, 5000)) { await disegnoPesante(wg); pesanti++; }
      }
      await giocaPasso(C, { veloce: true });
    }
    if (!nDis) no("nessun disegno è passato in rete");
    if (maxDis > 20000) no("un disegno pesa troppo in rete (" + maxDis + " byte)");
    if (vm(C).fase !== "fine") no("la partita non finisce");
    if (testiPrima) no("le battute sono nella foto prima della vetrina");
    if (disInVm) no("un disegno è finito nella foto trattenuta");
    if (max > 30000) no("la foto è troppo grande (" + max + " byte)");
    senzaErrori();
    return "foto al massimo " + max + " byte, nessuna battuta prima della vetrina, nessun disegno nella foto; disegno di 40 tratti in rete al massimo " + maxDis + " byte (" + nDis + " messaggi)";
  } });

  // =========================================================
  //  LA FOTO VERA (406-409): fotocamera finta (un canvas con una faccia disegnata: MAI la fotocamera vera),
  //  galleria finta (un file fatto da un canvas), chiave nel link della Sala, foto cifrate a pezzi
  // =========================================================
  // una faccia disegnata (la foto finta), 480×640: la faccia sta dove la sagoma ovale la chiede
  function facciaFinta(w, pelle, scritta) {
    var cv = w.document.createElement("canvas"); cv.width = 480; cv.height = 640; var c = cv.getContext("2d");
    var g = c.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, "#6a8fbf"); g.addColorStop(1, "#c9d8e8"); c.fillStyle = g; c.fillRect(0, 0, 480, 640);
    c.save(); c.translate(240, 320); c.scale(1.6, 1.6); c.translate(-120, -152);
    c.fillStyle = "#3b2a20"; c.beginPath(); c.ellipse(120, 120, 100, 95, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = pelle || "#e9b48f"; c.beginPath(); c.ellipse(120, 165, 82, 105, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#3b2a20"; c.beginPath(); c.ellipse(120, 80, 90, 40, 0, Math.PI, 0); c.fill();
    [84, 156].forEach(function (x) { c.fillStyle = "#fff"; c.beginPath(); c.ellipse(x, 140, 15, 9, 0, 0, 7); c.fill(); c.fillStyle = "#3a6"; c.beginPath(); c.arc(x, 140, 7, 0, 7); c.fill(); c.fillStyle = "#000"; c.beginPath(); c.arc(x, 140, 3.5, 0, 7); c.fill(); });
    c.strokeStyle = "#b97a5a"; c.lineWidth = 4; c.beginPath(); c.moveTo(120, 150); c.lineTo(112, 185); c.lineTo(128, 186); c.stroke();
    c.strokeStyle = "#a33"; c.lineWidth = 6; c.beginPath(); c.arc(120, 200, 24, 0.2, Math.PI - 0.2); c.stroke();
    c.restore();
    if (scritta) { c.fillStyle = "#fff"; c.font = "bold 40px sans-serif"; c.fillText(scritta, 20, 620); }
    return cv;
  }
  // la fotocamera finta del telefono (si mette prima che parta l'app, anche dopo le ricariche)
  function camFinta(pelle) {
    return function (w) {
      var md = w.navigator.mediaDevices;
      if (!md) { md = {}; try { Object.defineProperty(w.navigator, "mediaDevices", { configurable: true, value: md }); } catch (e) {} }
      md.getUserMedia = function () {
        var cv = facciaFinta(w, pelle), c = cv.getContext("2d"), n = 0;
        w.__camAccesa = (w.__camAccesa || 0) + 1;
        w.setInterval(function () { n++; c.fillStyle = n % 2 ? "#6a8fbf" : "#6b8fbf"; c.fillRect(0, 0, 3, 3); }, 80);   // (il video finto si muove: così arrivano i fotogrammi)
        return Promise.resolve(cv.captureStream(15));
      };
    };
  }
  // tutto quello che passa dal broker finto (per controllare che una foto non passi MAI in chiaro)
  function spiaBroker() {
    W.__pub = [];
    function avvolgi(k) {
      if (k.__spiaFoto) return; k.__spiaFoto = true;
      var pub = k.publish;
      k.publish = function (topic, payload, o) { if (this.connected && !this.frozen) W.__pub.push({ n: k.nome, topic: topic, p: String(payload), r: !!(o && o.retain) }); return pub.call(this, topic, payload, o); };
    }
    if (!W.__creaVero) W.__creaVero = W.creaClient;
    W.creaClient = function () { var c = W.__creaVero.apply(this, arguments); avvolgi(c); return c; };
    W.BR.clients.forEach(avvolgi);
  }
  function fineSpia() { if (W.__creaVero) { W.creaClient = W.__creaVero; W.__creaVero = null; } }
  // i messaggi "foto" visti nel broker (dagli amici all'host e dall'host a tutti)
  function pezziFoto() {
    var out = [];
    (W.__pub || []).forEach(function (x) {
      if (x.p.indexOf('"t":"foto"') < 0) return;
      var m = null; try { m = JSON.parse(x.p); } catch (e) { return; }
      var d = m && m.data ? m.data : m;
      if (d && d.t === "foto") out.push({ n: x.n, r: x.r, len: x.p.length, m: d, id: d.id || m.from || null });
    });
    return out;
  }
  async function salaFoto(amici, senzaChiave) {
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true, prima: camFinta("#e9b48f") });
    spiaBroker();
    var S = await A.apriSalaNuova("Paky");
    var link = P.SG.creaLink({ sala: S }), hash = link.split("#")[1] || "";
    var k = (/(?:^|&)k=([A-Za-z0-9_-]{22})$/.exec(hash) || [])[1];
    if (!k) no("il link della Sala non ha la chiave («" + hash + "»)");
    var pelli = ["#c98d6a", "#f2c9a8", "#8d5a3b", "#e0a982", "#b07a55"];
    for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], { hash: (senzaChiave || []).indexOf(amici[i]) >= 0 ? "sala=" + S : hash, x: 185 * (i + 1), salaSempre: true, prima: camFinta(pelli[i % pelli.length]) });
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === amici.length + 1; }, 12000)) no("nella Sala non entrano tutti");
    var C = await A.lanciaDallaSala("Paky", S, NOME);
    if (!await W.aspetta(function () { return ids(C, "players").length === amici.length + 1; }, 15000)) no("nella saletta non arrivano tutti");
    return { S: S, C: C, P: P, k: k, hash: hash };
  }
  function idDi(C, nome) { var p = (vm(C).players || []).concat(vm(C).guarda || []).filter(function (x) { return x.nome === nome; })[0]; return p ? p.id : null; }
  function foDi(C, nome) { var p = (vm(C).players || []).concat(vm(C).guarda || []).filter(function (x) { return x.nome === nome; })[0]; return p ? p.fo || null : null; }
  function camAperto(w) { return w && w.document.querySelector(".cnf"); }
  async function selfie(nome, filtro) {
    var w = W.finestra(nome);
    if (!await W.aspetta(function () { return camAperto(w); }, 10000)) no(nome + ": non si apre «📸 La tua faccia»");
    if (!W.clicca(w, /Selfie/, ".cnf-b")) no(nome + ": manca «🤳 Selfie»");
    var sc = await W.aspetta(function () { var b = w.document.querySelector(".cnf-scatto"); return b && !b.disabled ? b : null; }, 8000);
    if (!sc) no(nome + ": la fotocamera (finta) non parte («" + T(w).slice(0, 80) + "»)");
    if (!w.document.querySelector(".cnf-sagoma ellipse")) no(nome + ": manca la sagoma ovale");
    sc.click();
    if (!await W.aspetta(function () { return w.document.querySelector(".cnf-filtri"); }, 8000)) no(nome + ": dopo lo scatto non arrivano i filtri");
    if (w.document.querySelectorAll(".cnf-f").length !== 10) no(nome + ": i filtri non sono 10");
    if (filtro && !W.clicca(w, new RegExp(filtro), ".cnf-f")) no(nome + ": non trovo il filtro " + filtro);
    W.clicca(w, /Fatto/, ".cnf-b");
    if (!await W.aspetta(function () { return !camAperto(w); }, 4000)) no(nome + ": il camerino non si chiude");
  }
  async function galleria(nome, filtro) {
    var w = W.finestra(nome);
    if (!await W.aspetta(function () { return camAperto(w); }, 10000)) no(nome + ": non si apre «📸 La tua faccia»");
    var inp = w.document.querySelector(".cnf input[type=file]");
    var cv = facciaFinta(w, "#d9a17a", "galleria"), blob = await new Promise(function (r) { cv.toBlob(r, "image/jpeg", 0.9); });
    var dt = new w.DataTransfer(); dt.items.add(new w.File([blob], "io.jpg", { type: "image/jpeg" })); inp.files = dt.files; inp.dispatchEvent(new w.Event("change"));
    if (!await W.aspetta(function () { return w.document.querySelector(".cnf-sist"); }, 6000)) no(nome + ": la foto della galleria non si apre per sistemarla");
    W.clicca(w, /\+/, ".cnf-zoom button");
    if (!W.clicca(w, /Così/, ".cnf-b")) no(nome + ": manca «✅ Così»");
    if (!await W.aspetta(function () { return w.document.querySelector(".cnf-filtri"); }, 6000)) no(nome + ": dopo la galleria non arrivano i filtri");
    if (filtro && !W.clicca(w, new RegExp(filtro), ".cnf-f")) no(nome + ": non trovo il filtro " + filtro);
    W.clicca(w, /Fatto/, ".cnf-b");
    if (!await W.aspetta(function () { return !camAperto(w); }, 4000)) no(nome + ": il camerino non si chiude");
  }
  async function avatar(nome) {
    var w = W.finestra(nome);
    if (!await W.aspetta(function () { return camAperto(w); }, 10000)) no(nome + ": non si apre «📸 La tua faccia»");
    if (!W.clicca(w, /Uso l'avatar/, ".cnf-b")) no(nome + ": manca «🙂 Uso l'avatar»");
    if (!await W.aspetta(function () { return !camAperto(w); }, 4000)) no(nome + ": il camerino non si chiude");
  }
  // sul telefono di "chi", la foto di "di" c'è (quella giusta)
  function vede(C, chi, di) { var w = W.finestra(chi), fo = foDi(C, di), id = idDi(C, di); return !!(w && w.SG_CDN_FOTO && fo && id && w.SG_CDN_FOTO.ha(id, fo.f)); }
  async function vedonoTutti(C, nomi, conFoto, ms) {
    var ok = await W.aspetta(function () { return nomi.every(function (a) { return conFoto.every(function (b) { return a === b || vede(C, a, b); }); }); }, ms || 15000);
    if (!ok) { var manca = []; nomi.forEach(function (a) { conFoto.forEach(function (b) { if (a !== b && !vede(C, a, b)) manca.push(a + "→" + b); }); }); no("le foto non arrivano: " + manca.join(", ")); }
  }
  function testoBox(w) { var b = w && w.document.querySelector(".cn-fb"); return b ? b.innerText.replace(/\s+/g, " ") : ""; }
  // i controlli della rete: la chiave mai nei messaggi, le foto mai trattenute né in chiaro, i pezzi si aprono con la chiave
  async function controllaRete(k) {
    var pub = W.__pub || [];
    if (pub.some(function (x) { return x.p.indexOf(k) >= 0; })) no("la chiave è passata in un messaggio del broker!");
    if (pub.some(function (x) { return x.r && /"t":"foto"|"pz":/.test(x.p); })) no("un pezzo di foto è stato mandato come messaggio trattenuto");
    if (pub.some(function (x) { return /data:image|image\/jpeg|base64,/.test(x.p); })) no("un'immagine è passata in chiaro (data:image)");
    var maxVm = 0; pub.forEach(function (x) { if (x.r && x.p.length > maxVm) maxVm = x.p.length; });
    var pz = pezziFoto(); if (!pz.length) no("nessuna foto è passata in rete");
    // le foto: per ognuna (numero + iv) i pezzi rimessi insieme NON sono un JPEG, ma con la chiave si aprono e diventano un JPEG
    var grp = {};
    pz.forEach(function (x) { var g = grp[x.m.f + "|" + x.m.iv] || (grp[x.m.f + "|" + x.m.iv] = { f: x.m.f, iv: x.m.iv, di: x.m.di, c: {}, max: 0 }); g.c[x.m.pz] = x.m.c; if (x.len > g.max) g.max = x.len; });
    var raw = Uint8Array.from(atob(k.replace(/-/g, "+").replace(/_/g, "/") + "=="), function (ch) { return ch.charCodeAt(0); });
    var key = await crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["decrypt"]);
    var pesi = [], maxMsg = 0, nFoto = 0;
    for (var gk in grp) {
      var g = grp[gk], s = ""; if (Object.keys(g.c).length !== g.di) continue;
      for (var i = 0; i < g.di; i++) s += g.c[i];
      var b = Uint8Array.from(atob(s), function (ch) { return ch.charCodeAt(0); });
      if (b[0] === 0xFF && b[1] === 0xD8) no("una foto è passata in chiaro (JPEG)");
      var chiaro = null;
      try { chiaro = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: Uint8Array.from(atob(g.iv), function (ch) { return ch.charCodeAt(0); }), additionalData: new TextEncoder().encode("cn|" + g.f) }, key, b)); } catch (e) { no("una foto non si apre con la chiave del link"); }
      if (!(chiaro[0] === 0xFF && chiaro[1] === 0xD8)) no("la foto aperta non è un JPEG");
      // e con una chiave sbagliata non si apre
      var sbagliata = await crypto.subtle.importKey("raw", crypto.getRandomValues(new Uint8Array(16)), { name: "AES-GCM" }, false, ["decrypt"]), aperta = true;
      try { await crypto.subtle.decrypt({ name: "AES-GCM", iv: Uint8Array.from(atob(g.iv), function (ch) { return ch.charCodeAt(0); }), additionalData: new TextEncoder().encode("cn|" + g.f) }, sbagliata, b); } catch (e) { aperta = false; }
      if (aperta) no("una foto si apre anche con una chiave sbagliata");
      pesi.push(chiaro.length); nFoto++; if (g.max > maxMsg) maxMsg = g.max;
    }
    if (!nFoto) no("nessuna foto intera nel broker");
    return { nFoto: nFoto, pesoMax: Math.max.apply(null, pesi), pesoMin: Math.min.apply(null, pesi), msgMax: maxMsg, vmMax: maxVm, nPezzi: pz.length };
  }
  function kb(n) { return (Math.round(n / 100) / 10).toString().replace(".", ",") + " KB"; }

  COPIONE.aggiungi(406, { nome: "Chi di Noi?: la foto vera (selfie, galleria, avatar, filtri), cifrata nel link, rientro, Rivincita, chi entra col codice", fai: async function () {
    var Z = await salaFoto(["Giulia", "Luca"]), C = Z.C, P = Z.P;
    // il camerino si apre da solo a tutti, prima di tutto
    await selfie("Paky", "Occhioni Anime");
    await galleria("Giulia", "Testa a Cono");
    await avatar("Luca");
    if (!await W.aspetta(function () { var a = foDi(C, "Paky"), b = foDi(C, "Giulia"); return a && a.h && a.x === 3 && b && b.h && b.x === 6 && !foDi(C, "Luca"); }, 15000))
      no("nella vm le facce non tornano: Paky " + JSON.stringify(foDi(C, "Paky")) + " Giulia " + JSON.stringify(foDi(C, "Giulia")) + " Luca " + JSON.stringify(foDi(C, "Luca")));
    await vedonoTutti(C, ["Paky", "Giulia", "Luca"], ["Paky", "Giulia"]);
    if (!/La tua faccia/.test(testoBox(P)) || !/Occhioni Anime/.test(testoBox(P))) no("Paky in saletta legge «" + testoBox(P) + "»");
    if (!/Giochi con l'avatar/.test(testoBox(W.finestra("Luca")))) no("Luca in saletta legge «" + testoBox(W.finestra("Luca")) + "»");
    var fb = P.document.querySelector(".cn-fb-f"); if (!fb || fb.src.indexOf("data:image/png") !== 0) no("in saletta la faccina di Paky non è la sua foto");
    // Giulia cambia solo il filtro: viaggia il nome del filtro, la foto no
    var prima = pezziFoto().length, fG = foDi(C, "Giulia").f, wG = W.finestra("Giulia");
    if (!W.clicca(wG, /Filtro/, ".cn-fb-b")) no("Giulia non trova «🎭 Filtro»");
    if (!await W.aspetta(function () { return wG.document.querySelector(".cnf-filtri"); }, 5000)) no("«🎭 Filtro» non apre i filtri");
    W.clicca(wG, /Nasone da Strega/, ".cnf-f"); W.clicca(wG, /Fatto/, ".cnf-b");
    if (!await W.aspetta(function () { var b = foDi(C, "Giulia"); return b && b.x === 8 && b.f === fG; }, 8000)) no("il filtro nuovo di Giulia non arriva all'host");
    await W.dorme(1500);
    if (pezziFoto().length !== prima) no("cambiando solo il filtro la foto è ripartita (" + (pezziFoto().length - prima) + " pezzi)");
    // si gioca: nella sfilata e nelle facce in fondo c'è la foto
    await regole(P, 3, 3, "⚡ Veloci");
    await comincia(C);
    var wL = W.finestra("Luca");
    if (!await W.aspetta(function () { var i = [].filter.call(wL.document.querySelectorAll(".cn-mini img"), function (x) { return x._cnf && x._cnf.id === "host"; })[0]; return i && i.src.indexOf("data:image/png") === 0; }, 8000)) no("Luca non vede la foto di Paky nelle facce in fondo");
    // Bea entra solo col codice (senza chiave): guarda, e vede tutti con l'avatar
    await W.apriTel("Bea", { hash: "sala=" + Z.S, x: 185 * 3, salaSempre: true, prima: camFinta("#a0704f") });
    await W.aspetta(function () { return W.clicca(W.finestra("Bea"), /Guarda/); }, 15000);
    if (!await W.aspetta(function () { return idDi(C, "Bea"); }, 15000)) no("Bea non arriva a guardare");
    await W.dorme(4000);
    var wB = W.finestra("Bea");
    if (wB.SG_CDN_FOTO.ha("host") || wB.SG_CDN_FOTO.ha(idDi(C, "Giulia"))) no("Bea senza chiave ha le foto!");
    if (camAperto(wB)) no("a Bea senza chiave si apre il camerino");
    // Giulia ricarica a metà partita: ritrova la sua foto (dalla sua scheda) e riceve quelle degli altri
    await giocaPasso(C, { veloce: true });
    await W.ricarica("Giulia");
    await vedonoTutti(C, ["Giulia"], ["Paky"], 20000);
    if (!await W.aspetta(function () { var w = W.finestra("Giulia"); return w.SG_CDN_FOTO.ha(idDi(C, "Giulia"), fG); }, 10000)) no("Giulia dopo la ricarica non ritrova la sua foto");
    if (camAperto(W.finestra("Giulia"))) no("dopo la ricarica a Giulia si riapre il camerino");
    if (!await finoAllaFine(C, 500000, { veloce: true })) no("la partita non finisce");
    // la Rivincita: le foto restano, nessuno rifà il selfie; Bea (senza chiave) entra e legge perché non vede le foto
    await W.aspetta(function () { return A.tastiFineDi(P); }, 8000);
    W.clicca(P, /Rivincita/, ".fine-tasti button");
    if (!await W.aspetta(function () { return vm(C).fase === "lobby" || (vm(C).fase === "gioco" && vm(C).partita === 2); }, 15000)) no("la Rivincita non arriva");
    await W.dorme(1500);
    ["Paky", "Giulia", "Luca"].forEach(function (n) { if (camAperto(W.finestra(n))) no("alla Rivincita a " + n + " si riapre il camerino"); });
    await vedonoTutti(C, ["Paky", "Giulia", "Luca"], ["Paky", "Giulia"], 8000);
    if (vm(C).fase === "lobby" && !/solo entrando dal link/.test(testoBox(W.finestra("Bea")))) no("Bea in saletta legge «" + testoBox(W.finestra("Bea")) + "»");
    var R = await controllaRete(Z.k);
    // Cambia gioco: dopo pochi secondi le foto degli altri spariscono dalla memoria, e la mia dalla scheda
    if (vm(C).fase === "lobby") W.clicca(P, /Comincia/, ".sl-go");
    await W.aspetta(function () { return vm(C).fase === "gioco"; }, 10000);
    if (!await finoAllaFine(C, 500000, { veloce: true, uguali: true })) no("la Rivincita non finisce");
    await W.aspetta(function () { return A.tastiFineDi(P); }, 8000);
    if (!W.clicca(P, /Cambia gioco/, ".fine-tasti button")) no("non trovo «Cambia gioco»");
    var tess = await W.aspetta(function () { return A.tessera(P, "La Scalinata"); }, 6000); if (tess) tess.click();
    if (!await W.aspetta(function () { var w = W.finestra("Giulia"), m = W.BR.mem.Giulia.s["sg-cn-mia"]; return w && !w.SG_CDN_FOTO.ha("host") && m && JSON.parse(m).u; }, 20000)) no("uscendo dal gioco le foto degli altri restano sul telefono di Giulia (o la sua non ha la scadenza)");
    fineSpia(); senzaErrori();
    return "selfie, galleria e avatar ok; filtro cambiato senza rimandare la foto; Bea col codice vede gli avatar; ricarica e Rivincita con le foto; " +
      R.nFoto + " foto in rete, tutte cifrate (con la chiave si aprono, con un'altra no), " + kb(R.pesoMin) + "-" + kb(R.pesoMax) + " l'una, pezzi da al massimo " + R.msgMax + " byte; chiave mai nei messaggi; vm al massimo " + R.vmMax + " byte";
  } });

  COPIONE.aggiungi(407, { nome: "Chi di Noi?: l'host ricarica (tutti nella Sala), si rilancia il gioco e le foto tornano da sole, «📸 Rifai» con una foto nuova", fai: async function () {
    var Z = await salaFoto(["Giulia", "Luca"]), C = Z.C;
    await selfie("Paky", "Testa Schiacciata"); await selfie("Giulia", "Sdoppiamento"); await selfie("Luca", "Faccia Liquida");
    await vedonoTutti(C, ["Paky", "Giulia", "Luca"], ["Paky", "Giulia", "Luca"]);
    var fL = foDi(C, "Luca").f;
    await W.ricarica("Paky");
    // (nella Sala l'host che ricarica riporta tutti nella Sala: si rilancia il gioco e le foto tornano da sole, senza rifare il selfie)
    if (!await W.aspetta(function () { return ((vm(Z.S).membri) || []).length === 3 && !W.finestra("Giulia").document.querySelector(".cn") && /Sei dentro/.test(T(W.finestra("Giulia"))); }, 25000)) no("dopo la ricarica dell'host non tornano tutti nella Sala");
    await W.dorme(9500);   // (fuori dal gioco più di 8 secondi: le foto degli altri si buttano)
    if (W.finestra("Giulia").SG_CDN_FOTO.ha("host")) no("fuori dal gioco Giulia ha ancora la foto di Paky");
    C = Z.C = await A.lanciaDallaSala("Paky", Z.S, NOME);
    if (!await W.aspetta(function () { var v = vm(C); return v.fase === "lobby" && (v.players || []).length === 3 && ["Paky", "Giulia", "Luca"].every(function (n) { var f = foDi(C, n); return f && f.h; }); }, 30000))
      no("dopo la ricarica dell'host le foto non tornano tutte nella vm (" + JSON.stringify((vm(C).players || []).map(function (p) { return p.nome + ":" + JSON.stringify(p.fo); })) + ")");
    ["Paky", "Giulia", "Luca"].forEach(function (n) { if (camAperto(W.finestra(n))) no("rilanciando il gioco a " + n + " si riapre il camerino"); });
    await vedonoTutti(C, ["Paky", "Giulia", "Luca"], ["Paky", "Giulia", "Luca"], 20000);
    // Luca rifà la foto
    var wL = W.finestra("Luca");
    if (!W.clicca(wL, /Rifai/, ".cn-fb-b")) no("Luca non trova «📸 Rifai»");
    await selfie("Luca", "Faccia da Uovo");
    if (!await W.aspetta(function () { var f = foDi(C, "Luca"); return f && f.h && f.f !== fL && f.x === 7; }, 10000)) no("la foto nuova di Luca non arriva all'host");
    await vedonoTutti(C, ["Paky", "Giulia"], ["Luca"]);
    if (W.finestra("Giulia").SG_CDN_FOTO.ha(idDi(C, "Luca"), fL)) no("Giulia ha ancora la foto vecchia di Luca");
    var R = await controllaRete(Z.k);
    fineSpia(); senzaErrori();
    return "l'host ricarica e le 3 foto tornano; «📸 Rifai» manda la foto nuova e quella vecchia sparisce; " + R.nFoto + " foto cifrate in rete, " + kb(R.pesoMin) + "-" + kb(R.pesoMax);
  } });

  COPIONE.aggiungi(408, { nome: "Chi di Noi?: l'host spegne le foto («🙂 Solo avatar») e le riaccende", fai: async function () {
    var Z = await salaFoto(["Giulia", "Luca"]), C = Z.C, P = Z.P;
    await selfie("Paky"); await selfie("Giulia", "Specchio"); await avatar("Luca");
    await vedonoTutti(C, ["Paky", "Giulia", "Luca"], ["Paky", "Giulia"]);
    async function facce(spente) {
      var w = W.finestra("Luca");
      return W.aspetta(function () { var s = w.SG_CDN_ARTE.faccia({ id: "host", nome: "Paky" }, {}); return spente ? s.indexOf("data:image/svg") === 0 : s.indexOf("data:image/png") === 0; }, 10000);
    }
    // spente
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/, ".sl-regole"); }, 4000)) no("non trovo ⚙️ Regole");
    await W.dorme(250); if (!W.clicca(P, /Solo avatar/, ".modo-chip")) no("non trovo «🙂 Solo avatar»"); W.clicca(P, /Fatto/, ".sl-foglio button"); await W.dorme(600);
    if (!await facce(true)) no("con le foto spente Luca vede ancora la foto di Paky");
    if (!await W.aspetta(function () { return !foDi(C, "Giulia") && /foto spente/.test(testoBox(W.finestra("Giulia"))); }, 8000)) no("con le foto spente Giulia legge «" + testoBox(W.finestra("Giulia")) + "»");
    if (!/solo avatar/.test(A.regoleDi(W.finestra("Giulia")))) no("la riga delle regole non dice «solo avatar»");
    // riaccese
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/, ".sl-regole"); }, 4000)) no("non trovo ⚙️ Regole");
    await W.dorme(250); W.clicca(P, /Foto vere/, ".modo-chip"); W.clicca(P, /Fatto/, ".sl-foglio button");
    if (!await facce(false)) no("riaccese le foto, Luca non vede la foto di Paky");
    await vedonoTutti(C, ["Paky", "Luca"], ["Giulia"], 15000);
    fineSpia(); senzaErrori();
    return "foto spente: tutti con l'avatar e la riga lo dice; riaccese: le foto tornano";
  } });

  COPIONE.aggiungi(409, { nome: "Chi di Noi?: il camerino a 360x640 e 412x915 (scelta, fotocamera, sistema, filtri), niente scorre", fai: async function () {
    var Z = await salaFoto(["Giulia", "Luca"]), w = W.finestra("Giulia"), f = document.getElementById("tel-Giulia"), viste = [];
    if (!await W.aspetta(function () { return camAperto(w); }, 10000)) no("non si apre il camerino");
    var st = w.document.createElement("style"); st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}"; w.document.head.appendChild(st);
    async function misura(dove) {
      for (var m = 0; m < 2; m++) {
        var dim = m ? [412, 915] : [360, 640];
        f.style.width = dim[0] + "px"; f.style.height = dim[1] + "px"; w.dispatchEvent(new w.Event("resize")); await W.dorme(400);
        var d = w.document, H = w.innerHeight, Wd = w.innerWidth, fuori = [];
        [].forEach.call(d.querySelectorAll(".cnf button, .cnf-palco, .cnf-grande, .cnf-tondo, .cnf-f"), function (n) {
          var b = n.getBoundingClientRect(); if (!b.width || !b.height || n.closest(".cnf-zoom")) return;
          if (b.bottom > H + 1 || b.right > Wd + 1 || b.left < -1 || b.top < -1) fuori.push((n.className || n.tagName) + " " + Math.round(b.top) + "-" + Math.round(b.bottom));
        });
        var pal = d.querySelector(".cnf-palco"); if (pal && pal.getBoundingClientRect().height < 150) fuori.push("palco basso " + Math.round(pal.getBoundingClientRect().height));
        if (fuori.length) no(dove + " a " + dim.join("x") + ": " + fuori.slice(0, 4).join(", "));
        viste.push(dove + " " + dim.join("x"));
      }
    }
    await misura("scelta");
    W.clicca(w, /Selfie/, ".cnf-b");
    await W.aspetta(function () { var b = w.document.querySelector(".cnf-scatto"); return b && !b.disabled; }, 8000);
    await misura("fotocamera");
    w.document.querySelector(".cnf-scatto").click();
    await W.aspetta(function () { return w.document.querySelector(".cnf-filtri"); }, 8000);
    await misura("filtri");
    W.clicca(w, /Rifai/, ".cnf-b");
    var inp = w.document.querySelector(".cnf input[type=file]"), cv = facciaFinta(w, "#d9a17a"), blob = await new Promise(function (r) { cv.toBlob(r, "image/jpeg", 0.9); });
    var dt = new w.DataTransfer(); dt.items.add(new w.File([blob], "io.jpg", { type: "image/jpeg" })); inp.files = dt.files; inp.dispatchEvent(new w.Event("change"));
    await W.aspetta(function () { return w.document.querySelector(".cnf-sist"); }, 6000);
    await misura("sistema");
    W.clicca(w, /Così/, ".cnf-b"); await W.aspetta(function () { return w.document.querySelector(".cnf-filtri"); }, 6000);
    W.clicca(w, /Fatto/, ".cnf-b");
    // la saletta col riquadro della foto, a 360x640: niente scorre
    f.style.width = "360px"; f.style.height = "640px"; w.dispatchEvent(new w.Event("resize")); await W.dorme(500);
    var fb = w.document.querySelector(".cn-fb"); if (!fb) no("manca il riquadro della foto in saletta");
    var r = fb.getBoundingClientRect(); if (r.right > 361 || r.left < -1) no("il riquadro della foto esce di lato");
    f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    if (w.__camAccesa && w.document.querySelector("video") ) no("la fotocamera è rimasta accesa");
    fineSpia(); senzaErrori();
    return "misurati: " + viste.join(", ");
  } });
})();

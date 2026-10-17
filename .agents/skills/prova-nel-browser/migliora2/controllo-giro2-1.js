// PROVE DEL CONTROLLO (giro 2, controllore 1): i casi cattivi dei miglioramenti di Impostore, Taboo, Sì… però,
// Parola d'ordine e Stessa Lunghezza d'Onda. Si caricano DOPO i file dei giochi:
//   await COPIONE.carica("migliora2/g1-impostore.js"); await COPIONE.carica("migliora2/controllo-giro2-1.js"); await COPIONE.prova("cg1")
// cg1: Impostore a eliminazione in 5 (Sala): uno spegne il telefono durante gli indizi e non torna (dopo 20 s è «uscito»):
//      la partita va avanti, chi è uscito resta VOTABILE (se no un impostore uscito non si scoprirebbe più), esce, si svela;
//      poi riaccende e ritrova la partita da fuori; Bea arriva tardi e guarda (vede il segreto). Nessun errore.
// cg2: Stessa Lunghezza d'Onda: le scale con un trattino dentro una parola («Ex-fidanzato ↔ Fidanzato») si possono scrivere.
// cg3: Sì… però «Ognuno per sé» online in 4: chi presenta spegne (dopo 20 s le sue carte le sceglie il caso), Marco arriva
//      tardi e gioca dal round 2, nel round 2 il giudice spegne e decide l'host («Il giudice è uscito…»), chi era spento rientra.
// cg4: Taboo online «Tre round» + «Rubata»: chi spiega spegne a metà turno (la carta torna nel mazzo, la partita aspetta),
//      riaccende e si riparte; Bea arriva proprio durante la rubata e guarda senza tasti; rubata presa nel riepilogo.
// (cg2 serve g4-ordine-lunghezza.js caricato prima, cg3 serve g3-sipero.js)
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  function vm(C) { return W.vmDi(C) || {}; }
  function opzR(extra) { return Object.assign({ salaSempre: true, impR: true }, extra || {}); }
  function carta(w) {
    var d = w && w.document; if (!d) return {};
    var q = function (s) { var e = d.querySelector(s); return e ? e.textContent : ""; };
    return { su: q(".im-c-su"), grande: q(".im-c-grande"), giu: q(".im-c-giu"), socio: q(".im-c-socio"), coperta: q(".im-c-tx") };
  }
  function ruoloDi(w) { var c = carta(w); return /impostore!/.test(c.su) ? "imp" : /spia/.test(c.su) ? "spia" : /La tua parola/.test(c.su) ? "civ" : null; }
  function scrivi(w, testo) {
    var inp = w.document.querySelector(".im-input"), b = w.document.querySelector(".im-invia");
    if (!inp || !b) return false;
    inp.value = testo; inp.dispatchEvent(new w.Event("input", { bubbles: true })); b.click(); return true;
  }
  function bottoniVoto(w) { return [].map.call(w.document.querySelectorAll(".im-vb"), function (x) { return (x.querySelector("b") || {}).textContent; }); }
  function vota(w, nome) {
    var b = [].filter.call(w.document.querySelectorAll(".im-vb"), function (x) { return (x.querySelector("b") || {}).textContent === nome; })[0];
    if (!b || b.disabled) return false; b.click(); return true;
  }
  async function pronto(w) { var b = await W.aspetta(function () { var x = w && w.document.querySelector(".im-pronto"); return x && !x.disabled ? x : null; }, 3000); if (!b) return false; b.click(); return true; }
  async function aspettaPasso(C, passo, ms) { return W.aspetta(function () { var v = vm(C); return v.fase === "gioco" && v.passo === passo ? v : null; }, ms || 8000); }
  function nomeDi(C, id) { var p = (vm(C).players || []).filter(function (x) { return x.id === id; })[0]; return p ? p.nome : null; }
  function errori() { var e = W.erroriTel(); return e.length ? e.slice(0, 3).join(" / ") : ""; }

  COPIONE.aggiungi("cg1", { nome: "Impostore a eliminazione: chi spegne il telefono e non torna resta votabile, poi rientra da fuori; chi arriva tardi guarda", fai: async function (opz) {
    var imp0 = { aiuto: "simile", spia: "no", mani: 1, tempo: 60, indizi: "scritti", voto: "elim", nimp: 1 };
    var amici = ["Giulia", "Luca", "Sara", "Marco"];
    var w = { Paky: await W.apriTel("Paky", opzR({ x: 0, prima: function (x) { x.__imp = imp0; } })) };
    var S = await A.apriSalaNuova("Paky");
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], opzR({ hash: "sala=" + S, x: 150 * (i + 1) }));
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === 5; }, 15000)) no("nella Sala non sono entrati in 5");
    var P = W.finestra("Paky"), C = await A.lanciaDallaSala("Paky", S, "L'Impostore");
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 5; }, 15000)) no("nella saletta non arrivano in 5");
    if (!W.clicca(P, /Comincia/, ".sl-go")) no("Paky non trova «Comincia»");
    var nomi = ["Paky"].concat(amici);
    if (!await aspettaPasso(C, "indizi", 12000)) no("la partita non comincia");
    if (!await W.aspetta(function () { return nomi.every(function (n) { return ruoloDi(W.finestra(n)); }); }, 8000)) no("non tutti hanno la carta");
    var ruoli = {}; nomi.forEach(function (n) { ruoli[n] = ruoloDi(W.finestra(n)); });
    var imp = nomi.filter(function (n) { return ruoli[n] === "imp"; })[0];
    // chi spegne: l'impostore (se non è l'host), se no un cittadino che non è l'host
    // (con COPIONE.prova("cg1", { cit: true }) spegne sempre un cittadino: si prova la schermata di chi esce e chi arriva tardi)
    var X = imp !== "Paky" && !(opz && opz.cit) ? imp : amici.filter(function (n) { return n !== imp; })[0];
    W.spegni(X);
    var resto = nomi.filter(function (n) { return n !== X; });
    resto.forEach(function (n) { scrivi(W.finestra(n), "ind" + n.slice(0, 3)); });
    // dopo 20 s il core dice addio a X: gli indizi si chiudono senza aspettare i 55 s
    var v = await aspettaPasso(C, "discuti", 40000);
    if (!v) no("con " + X + " spento gli indizi non si chiudono (" + vm(C).passo + ")");
    var px = (v.players || []).filter(function (p) { return p.nome === X; })[0];
    if (!px || !px.via) no(X + " non risulta uscito");
    for (var k = 0; k < resto.length; k++) await pronto(W.finestra(resto[k]));
    if (!await aspettaPasso(C, "voto", 6000)) no("«🗳️ Votiamo» non porta al voto");
    var G = W.finestra(resto[1]);
    if (!await W.aspetta(function () { return bottoniVoto(G).indexOf(X) >= 0; }, 3000)) no(X + " (uscito) non si può votare: " + bottoniVoto(G).join(","));
    resto.forEach(function (n) { if (!vota(W.finestra(n), X)) no(n + " non riesce a votare " + X); });
    if (X === imp) {
      v = await aspettaPasso(C, "esito", 20000);
      if (!v) no("l'impostore uscito e votato fuori: la mano non finisce (" + vm(C).passo + ")");
      if (v.esito.vince !== "cit") no("dovrebbero vincere i cittadini: " + v.esito.vince);
    } else {
      v = await aspettaPasso(C, "fuori", 15000);
      if (!v) no(X + " votato fuori: non si svela (" + vm(C).passo + ")");
      if (nomeDi(C, v.ultimoFuori.id) !== X || v.ultimoFuori.ruolo !== "cit") no("ultimoFuori: " + JSON.stringify(v.ultimoFuori));
    }
    // X riaccende: rientra e vede la partita da fuori (o la fine mano)
    W.riaccendi(X);
    var wx = W.finestra(X);
    if (!await W.aspetta(function () { var p = (vm(C).players || []).filter(function (q) { return q.nome === X; })[0]; return p && !p.via; }, 15000)) no(X + " riacceso non rientra");
    if (X !== imp && !await W.aspetta(function () { return /Tu eri un cittadino|Sei fuori/.test(T(wx)); }, 8000)) no(X + " rientrato non sa di essere fuori («" + T(wx).slice(0, 80) + "»)");
    if (X !== imp && !await W.aspetta(function () { return carta(wx).grande === "🕵️ " + imp; }, 8000)) no(X + " rientrato da fuori non vede il segreto: " + JSON.stringify(carta(wx)));
    // Bea arriva tardi: guarda e vede il segreto
    if (vm(C).passo !== "esito") {
      var B = await W.apriTel("Bea", opzR({ hash: "sala=" + S, x: 750 }));
      if (!await W.aspetta(function () { return W.clicca(B, /👀 Guarda/); }, 10000)) no("Bea non ha «👀 Guarda»");
      if (!await W.aspetta(function () { return carta(B).grande === "🕵️ " + imp; }, 15000)) no("Bea non vede il segreto: " + JSON.stringify(carta(B)));
      if (B.document.querySelector(".im-input") || B.document.querySelector(".im-pronto")) no("Bea (guarda) ha tasti da giocatore");
    }
    var e = errori(); if (e) no("errori: " + e);
    return "uscito " + X + " (" + ruoli[X] + "): votabile, svelato, rientrato da fuori" + (vm(C).passo !== "esito" ? "; Bea guarda" : "");
  } });

  // ===================== cg2: Lunghezza, le scale col trattino =====================
  // (serve migliora2/g4-ordine-lunghezza.js caricato prima: apriTel(nome, { g4: true }) dà w.__g4.lunghezza)
  function elDi(w) {
    return function (tag, a, f) {
      var n = w.document.createElement(tag); a = a || {};
      Object.keys(a).forEach(function (k) { var v = a[k]; if (v == null) return; if (k === "class") n.className = v; else if (k === "text") n.textContent = v; else if (k === "html") n.innerHTML = v; else if (k === "style") n.style.cssText = v; else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v); else n.setAttribute(k, v); });
      [].concat(f == null ? [] : f).forEach(function (c) { if (c == null) return; n.appendChild(typeof c === "string" ? w.document.createTextNode(c) : c); });
      return n;
    };
  }
  COPIONE.aggiungi("cg2", { nome: "Lunghezza d'Onda: «📝 Le nostre scale» col trattino e la virgola dentro un lato", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0, g4: true });
    var g = await W.aspetta(function () { return w.__g4 && w.__g4.lunghezza; }, 8000); if (!g) no("il gioco non si registra");
    var box = w.document.createElement("div"), dove = { modo: "online" };
    g.impostazioni(box, dove, { el: elDi(w), modo: "online" });
    var area = box.querySelector(".lu-nostre-in"); if (!area) no("niente campo delle scale");
    area.value = "Ex-fidanzato ↔ Fidanzato\nWi-Fi lento - Wi-Fi veloce\nPane, burro ↔ Pane e basta\nCaldo-Freddo-Tiepido\nCaldo - Freddo";
    var b = [].filter.call(box.querySelectorAll("button"), function (x) { return /Aggiungi/.test(x.textContent); })[0]; b.click();
    var l = dove.nostre || [];
    ["Ex-fidanzato|Fidanzato", "Wi-Fi lento|Wi-Fi veloce", "Pane, burro|Pane e basta", "Caldo|Freddo"].forEach(function (s) { if (l.indexOf(s) < 0) no("manca «" + s + "» (" + l.join(" / ") + ")"); });
    if (l.length !== 4) no("scale: " + l.join(" / ") + " (la riga a tre lati va scartata)");
    if (!/Caldo-Freddo-Tiepido/.test(box.querySelector(".lu-nostre-esito").textContent)) no("la riga a tre lati non è segnalata");
    var r = g.riassunto({ nostre: l, nostreModo: "solo" });
    if (!/4 scale vostre \(solo quelle\)/.test(r)) no("riassunto: " + r);
    return "4 scale col trattino e la virgola, la riga a tre lati scartata";
  } });

  // ===================== cg3: Sì… però, Ognuno per sé coi telefoni che si spengono =====================
  // (serve migliora2/g3-sipero.js caricato prima: apriTel(nome, { spiaSp: true }) legge w.__imp)
  function toccaSp(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click();
  }
  function bottoneSp(w, re) { return [].filter.call(w.document.querySelectorAll("button"), function (b) { return re.test(b.textContent); })[0] || null; }
  async function giocaSp(w, n) {
    var cc = await W.aspetta(function () { var x = [].slice.call(w.document.querySelectorAll(".sp-carta[role=button]")); return x.length ? x : null; }, 8000);
    if (!cc) no("niente carte da toccare («" + T(w).slice(0, 100) + "»)");
    for (var i = 0; i < cc.length && w.document.querySelectorAll(".sp-carta.su").length < n; i++) if (!cc[i].classList.contains("su")) toccaSp(w, cc[i]);
    var b = bottoneSp(w, /^Gioca ▶|^Conferma ▶/);
    if (!b || b.disabled) no("il tasto per giocare è spento");
    b.click();
  }
  function nomeSp(C, id) { var g = (vm(C).giocatori || []).filter(function (x) { return x.id === id; })[0]; return g ? g.nome : null; }
  COPIONE.aggiungi("cg3", { nome: "Sì… però Ognuno per sé: chi presenta spegne (le carte le sceglie il caso), Marco arriva tardi e gioca dal round dopo, il giudice spegne e decide l'host", fai: async function () {
    var note = [];
    var P = await W.apriTel("Paky", { x: 0, spiaSp: true, prima: function (w) { w.__imp = { giri: 1, si: "solo", arringa: 0, bianca: 1 }; } });
    var C = await W.apriStanza(P, "Sì... però");
    var amici = ["Giulia", "Luca", "Sara"];
    for (var i = 0; i < amici.length; i++) {
      await W.apriTel(amici[i], { hash: "gioco=sipero&stanza=" + C, x: 185 * (i + 1), spiaSp: true });
      var n0 = amici[i];
      if (!await W.aspetta(function () { return (vm(C).giocatori || []).some(function (p) { return p.nome === n0; }); }, 8000)) no(n0 + " non entra");
    }
    W.clicca(P, /Comincia/);
    var v = await W.aspetta(function () { var x = vm(C); return x.fase === "gioco" && x.solo && x.pres ? x : null; }, 10000);
    if (!v) no("non parte «Ognuno per sé»");
    var giud = nomeSp(C, v.giudiceId), pres = v.pres.map(function (id) { return nomeSp(C, id); });
    var X = pres.filter(function (n) { return n !== "Paky"; })[0];
    note.push("giudice " + giud + ", spegne " + X);
    W.spegni(X);
    for (var k = 0; k < pres.length; k++) if (pres[k] !== X) await giocaSp(W.finestra(pres[k]), 2);
    // dopo 20 s X è «uscito»: i suoi Bonus li sceglie il caso e si passa ai Malus
    v = await W.aspetta(function () { var x = vm(C); return x.passoS === "malus" ? x : null; }, 40000);
    if (!v) no("con " + X + " spento i Bonus non si chiudono (" + vm(C).passoS + ")");
    var idX = v.pres[pres.indexOf(X)];
    if (!v.schede[idX] || v.schede[idX].b.length !== 2) no("lo scenario di " + X + " non ha 2 Bonus scelti dal caso");
    // Marco arriva a partita in corso: guarda
    await W.apriTel("Marco", { hash: "gioco=sipero&stanza=" + C, x: 740, spiaSp: true });
    if (!await W.aspetta(function () { return /entri dal prossimo round|guardi|Guardi/.test(T(W.finestra("Marco"))); }, 8000)) no("Marco arrivato tardi non guarda («" + T(W.finestra("Marco")).slice(0, 80) + "»)");
    if (W.finestra("Marco").document.querySelector(".sp-carta[role=button], .sp-scrivi-b")) no("Marco (guarda) ha carte o «Scrivi tu»");
    for (k = 0; k < pres.length; k++) if (pres[k] !== X) await giocaSp(W.finestra(pres[k]), 1);
    v = await W.aspetta(function () { var x = vm(C); return x.fase === "arringa" ? x : null; }, 10000);
    if (!v) no("dopo i Malus non si svela (" + vm(C).fase + " " + vm(C).passoS + ")");
    // il giudice (se non è l'host) spegne: dopo 20 s decide l'host
    var wg = W.finestra(giud), chiDecide = giud;
    if (giud !== "Paky") { W.spegni(giud); chiDecide = "Paky"; }
    var wd = W.finestra(chiDecide);
    for (k = 0; k < 3; k++) {
      var bb = await W.aspetta(function () { var x = bottoneSp(wd, /Prossimo scenario|Al verdetto/); return x && !x.disabled ? x : null; }, 30000);
      if (!bb) no(chiDecide + " non può andare avanti allo svelamento " + (k + 1) + " («" + T(wd).slice(0, 100) + "»)");
      bb.click(); await W.dorme(300);
    }
    v = await W.aspetta(function () { var x = vm(C); return x.fase === "giudizio" ? x : null; }, 5000); if (!v) no("niente verdetto");
    var bs = await W.aspetta(function () { var x = bottoneSp(wd, /Scelgo/); return x && !x.disabled ? x : null; }, 5000);
    if (!bs) no(chiDecide + " non ha «Scelgo»");
    bs.click();
    v = await W.aspetta(function () { var x = vm(C); return x.fase === "esito" ? x : null; }, 5000); if (!v) no("niente esito");
    // ⏩ Avanti: chi c'è ed era in partita (non X, non il giudice spento, non Marco che guarda)
    var vivi = ["Paky"].concat(amici).filter(function (n) { return n !== X && n !== giud; });
    if (giud === "Paky") vivi = ["Paky"].concat(amici).filter(function (n) { return n !== X; });
    if (v.servono !== Math.floor(vivi.length / 2) + 1) no("servono " + v.servono + " (presenti in partita: " + vivi.join(",") + ")");
    if (W.finestra("Marco").document.querySelector(".sp-pronto")) no("Marco (guarda) ha «⏩ Avanti»");
    for (k = 0; k < vivi.length && vm(C).fase === "esito"; k++) { var bp = await W.aspetta(function () { var x = W.finestra(vivi[k]).document.querySelector(".sp-pronto"); return x && !x.disabled ? x : null; }, 3000); if (bp) bp.click(); await W.dorme(250); }
    v = await W.aspetta(function () { var x = vm(C); return x.round === 2 && x.fase === "gioco" ? x : null; }, 6000);
    if (!v) no("non parte il round 2 (" + vm(C).fase + " " + vm(C).round + ")");
    var idM = (v.giocatori.filter(function (g) { return g.nome === "Marco"; })[0] || {}).id;
    if (v.pres.indexOf(idM) < 0 && v.giudiceId !== idM) no("Marco non gioca dal round 2 (presentano " + v.pres.map(function (id) { return nomeSp(C, id); }).join(",") + ")");
    note.push("Marco nel round 2: " + (v.giudiceId === idM ? "giudice" : "presenta"));
    if (v.pres.indexOf(idX) >= 0 || (giud !== "Paky" && v.pres.indexOf(v.giudiceId) >= 0 && nomeSp(C, v.giudiceId) === giud)) no("chi è uscito presenta ancora nel round 2");
    var wm = W.finestra("Marco");
    if (v.pres.indexOf(idM) >= 0 && !await W.aspetta(function () { return wm.document.querySelectorAll(".sp-carta[role=button]").length === 4; }, 8000)) no("Marco non riceve la sua mano («" + T(wm).slice(0, 100) + "»)");
    // round 2: il giudice non è l'host (nel round 1 lo era). Si gioca, poi il giudice spegne: dopo 20 s decide l'host
    var giud2 = nomeSp(C, v.giudiceId), pres2 = v.pres.map(function (id) { return nomeSp(C, id); });
    if (giud2 === "Paky") no("nel round 2 il giudice è ancora l'host");
    for (k = 0; k < pres2.length; k++) await giocaSp(W.finestra(pres2[k]), 2);
    if (!await W.aspetta(function () { return vm(C).passoS === "malus"; }, 8000)) no("round 2: non si passa ai Malus");
    for (k = 0; k < pres2.length; k++) await giocaSp(W.finestra(pres2[k]), 1);
    if (!await W.aspetta(function () { return vm(C).fase === "arringa"; }, 8000)) no("round 2: non si svela");
    W.spegni(giud2);
    for (k = 0; k < pres2.length; k++) {
      var b2 = await W.aspetta(function () { var x = bottoneSp(P, /Prossimo scenario|Al verdetto/); return x && !x.disabled ? x : null; }, 35000);
      if (!b2) no("col giudice " + giud2 + " spento l'host non può andare avanti («" + T(P).slice(0, 100) + "»)");
      b2.click(); await W.dorme(300);
    }
    if (!await W.aspetta(function () { return vm(C).fase === "giudizio"; }, 5000)) no("round 2: niente verdetto");
    var altroT = W.finestra(pres2.filter(function (n) { return n !== "Paky"; })[0]);
    if (!await W.aspetta(function () { return /Il giudice è uscito/.test(T(altroT)); }, 4000)) no("gli altri non leggono «Il giudice è uscito: decide chi organizza…»");
    var bs2 = await W.aspetta(function () { var x = bottoneSp(P, /Scelgo/); return x && !x.disabled ? x : null; }, 5000);
    if (!bs2) no("l'host non ha «Scelgo» col giudice spento");
    bs2.click();
    if (!await W.aspetta(function () { return vm(C).fase === "esito" && vm(C).round === 2; }, 5000)) no("round 2: niente esito");
    note.push("round 2: giudice " + giud2 + " spento, decide l'host");
    // X e il giudice riaccendono e rientrano, senza errori
    W.riaccendi(X); W.riaccendi(giud2);
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).filter(function (g) { return g.nome === X; }).every(function (g) { return !g.via; }); }, 15000)) no(X + " riacceso non rientra");
    var e = errori(); if (e) no("errori: " + e);
    return note.join(" · ");
  } });

  // ===================== cg4: Taboo Tre round + Rubata, chi spiega spegne il telefono =====================
  function tastoTb(w, re) { return [].find.call(w.document.querySelectorAll(".tb button, .tb-tasti button"), function (b) { return re.test(b.textContent) && !b.disabled; }) || null; }
  async function premiTb(w, re) { var b = await W.aspetta(function () { return tastoTb(w, re); }, 6000); if (!b) no("non trovo «" + re + "» («" + T(w).slice(0, 120) + "»)"); toccaSp(w, b); await W.dorme(460); }
  COPIONE.aggiungi("cg4", { nome: "Taboo online Tre round + Rubata: chi spiega spegne a metà turno (la carta torna nel mazzo, la partita aspetta), riaccende e si riparte; Bea arriva tardi nella rubata", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Marco"], F = {}, note = [];
    var P = await W.apriTel("Paky", { x: 0 }); F.Paky = P;
    var tess = await W.aspetta(function () { return A.tessera(P, "Taboo"); }, 6000); if (!tess) no("non trovo Taboo"); tess.click();
    if (!await W.aspetta(function () { return W.clicca(P, /Online: apro io/, ".modo-grande"); }, 3000)) no("non c'è «Online: apro io la stanza»");
    if (!await W.aspetta(function () { return /Tempo del turno/i.test(T(P)); }, 3000)) no("non vedo le regole");
    [/Tre round/, /^20$/, /60 s/, /^Sì$/].forEach(function (r) { if (!W.clicca(P, r, ".modo-chip")) no("nelle regole manca «" + r + "»"); });
    if (!W.clicca(P, /Apri la stanza/)) no("non c'è «Apri la stanza»");
    var cod = await W.aspetta(function () { var b = P.document.querySelector(".sl-cod b"); return b && /^[A-Z0-9]{4}$/.test(b.textContent) ? b.textContent : null; }, 6000);
    if (!cod) no("non vedo il codice");
    for (var i = 1; i < 4; i++) F[nomi[i]] = await W.apriTel(nomi[i], { hash: "gioco=taboo&stanza=" + cod, x: 185 * i });
    if (!await W.aspetta(function () { return P.document.querySelectorAll(".tb-scelta").length === 4; }, 12000)) no("in saletta non ci sono 4 nomi");
    await W.dorme(500);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("«Comincia» spento");
    function chi(fn) { return nomi.filter(function (n) { return fn(F[n]); }); }
    // fa finire il tempo del turno: l'orologio di taboo.js sull'host va avanti di 61 s finché la fase cambia
    async function finisciTempo(fase) {
      var ora = P.Date.now.bind(P.Date);
      P.Date.now = function () { return /taboo\.js/.test(new Error().stack || "") ? ora() + 61000 : ora(); };
      var x = await W.aspetta(function () { var y = W.vmDi(cod) || {}; return y.fase === fase ? y : null; }, 6000);
      P.Date.now = ora;
      return x;
    }
    // il primo che spiega e non è l'host (se tocca all'host, il suo turno finisce col tempo e la rubata «No»)
    var sp = null;
    for (var g = 0; g < 3 && !sp; g++) {
      if (!await W.aspetta(function () { return chi(function (w) { return tastoTb(w, /Pronti, via/); }).length === 1; }, 10000)) no("nessuno ha «Pronti, via!»");
      var s0 = chi(function (w) { return tastoTb(w, /Pronti, via/); })[0];
      await premiTb(F[s0], /Pronti, via/);
      if (s0 !== "Paky") { sp = s0; break; }
      if (!await finisciTempo("rubata")) no("il turno dell'host non finisce in rubata");
      await premiTb(P, /^❌ No/);
      if (!await W.aspetta(function () { return (W.vmDi(cod) || {}).fase === "pronto"; }, 8000)) no("dopo «No» non si torna a «Pronti»");
    }
    if (!sp) no("non spiega mai un amico");
    await premiTb(F[sp], /Indovinata/);
    var v = W.vmDi(cod), carte0 = v.tre.carte, pt0 = v.punti.slice();
    W.spegni(sp);
    // dopo 20 s: turno chiuso (la carta in mano torna nel mazzo), la squadra di sp ha 1 presente: partita ferma
    v = await W.aspetta(function () { var x = W.vmDi(cod) || {}; return x.fase === "pronto" && x.avviso ? x : null; }, 35000);
    if (!v) no("con " + sp + " spento la partita non si ferma ad aspettare (" + (W.vmDi(cod) || {}).fase + ")");
    if (v.tre.carte !== carte0) no("la carta che " + sp + " aveva in mano non è tornata nel mazzo (" + carte0 + " → " + v.tre.carte + ")");
    if (v.punti.join() !== pt0.join()) no("i punti sono cambiati uscendo: " + pt0 + " → " + v.punti);
    note.push("spento " + sp + ": partita ferma, carte " + v.tre.carte);
    W.riaccendi(sp);
    v = await W.aspetta(function () { var x = W.vmDi(cod) || {}; return x.fase === "pronto" && !x.avviso && x.attivo ? x : null; }, 15000);
    if (!v) no(sp + " riacceso: la partita non riparte");
    var sp2 = chi(function (w) { return tastoTb(w, /Pronti, via/); })[0];
    if (!sp2) { await W.dorme(1500); sp2 = chi(function (w) { return tastoTb(w, /Pronti, via/); })[0]; }
    if (!sp2) no("dopo il rientro nessuno ha «Pronti, via!»");
    await premiTb(F[sp2], /Pronti, via/);
    // il tempo finisce con una carta in mano: la rubata (orologio di taboo.js avanti di 61 s solo sull'host)
    v = await finisciTempo("rubata");
    if (!v) no("a fine tempo con la carta in mano non c'è la rubata (" + (W.vmDi(cod) || {}).fase + ")");
    // Bea arriva proprio adesso: guarda (vede la carta della rubata, nessun tasto)
    var B = await W.apriTel("Bea", { hash: "gioco=taboo&stanza=" + cod, x: 740 });
    if (!await W.aspetta(function () { return /RUBATA|Rubata|rubata/.test(T(B)) || (W.vmDi(cod) || {}).fase !== "rubata"; }, 8000)) no("Bea non vede la rubata («" + T(B).slice(0, 100) + "»)");
    if (tastoTb(B, /L'hanno presa|BUZZ|Avanti/)) no("Bea (guarda) ha dei tasti di gioco");
    await premiTb(F[sp2], /L'hanno presa/);
    v = await W.aspetta(function () { var x = W.vmDi(cod) || {}; return x.fase === "pronto" ? x : null; }, 12000);
    if (!v) no("dopo la rubata non si torna a «Pronti»");
    if ((v.riepilogo || {}).rubata == null) no("la rubata non è nel riepilogo");
    var errs = W.erroriTel(); if (errs.length) no("errori: " + errs.slice(0, 3).join(" / "));
    return note.join(" · ") + " · rubata presa con Bea che guarda";
  } });
})();

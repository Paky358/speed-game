// CONTROLLO SEVERO DEI PREFERITI (17 ott 2026): partite intere online con 5-6 telefoni finti, giocate coi TASTI dei telefoni
// (non coi messaggi a mano), cercando di rompere le migliorie: tocchi doppi, rialzo da soli, telefoni spenti nel momento
// nuovo (busta chiusa, voto, turno), ricariche, chi arriva tardi, misure a 360x640. I segreti si cercano in TUTTO quello che
// passa sul finto broker (non solo nella foto).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/controllo.js"); await COPIONE.prova("cpa1")
//
// cpa1 Asta temi online in 5 + Bea che arriva tardi: si gioca coi tasti; doppio tocco veloce di un amico = +2 (il secondo è un rialzo da solo); il rialzo
//      da soli col tasto «🙋 Rialzo» (anche due volte di fila); Marta spenta durante la busta chiusa (la busta si apre lo stesso
//      e la sua offerta non c'è), Sara ricarica a metà asta, Luca spento durante il voto (il voto si chiude lo stesso, col
//      tempo), le offerte in busta mai sul broker prima che si aprano, il pacco coperto; misure a 360x640 di asta, busta, voto
//      e classifica coi 5 kit.
// cpa2 Asta fantacalcio online in 6: partita intera coi tasti; rialzo da soli nel fanta (anche col +5); doppio tocco su «Lo prendo» = 2 (lo prende e rialza);
//      Tommi spento a metà (passa da solo, la partita non si ferma) e poi torna; misure a 360x640 dello stadio in 6.
// cpo1 Parola d'ordine online in 6 (3 contro 3), ⏳ 1 minuto: partita intera fino alla vittoria vera; il capo segna le
//      parole pensate col dito; doppio «gira» veloce; i due che indovinano di una squadra spenti (il turno non resta fermo);
//      il capo ricarica dopo aver segnato le parole; Nino arriva a partita cominciata; nessuna parola pensata e nessun colore
//      coperto sul broker a chi non deve; a fine partita «🤔 Cosa intendevi?», la serata e la scelta della rivincita solo
//      all'host (un amico che manda la scelta non conta); misure a 360x640.
// ctp1 Linea del tempo online in 6 (parte ⚡ Tutti insieme): partita intera coi tasti; doppio tocco sul posto; uno spento a
//      metà, uno che ricarica, Nino che arriva tardi e guarda; ⏩ Avanti di tutti; misure a 360x640.
// ctp2 Linea del tempo a turno in 4 con ✋ Rubala: furti coi tasti, gettoni che finiscono (il terzo furto non si può), chi è
//      di turno non può rubarsi la carta, l'anno del furto mai sul broker prima del risultato, chi è di turno spento (il turno
//      passa), misure a 360x640.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent.replace(/\s+/g, " ")) && visibile(b) && !b.disabled; })[0] || null; }
  function senzaErrori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function fermo(w) { var st = w.document.createElement("style"); st.textContent = ".schermata,.as-mal-carta,.as-scen,.as-sorpresa,.as-buste .r{animation:none!important;opacity:1!important} .btn.as-auto::after{animation:none!important}"; w.document.head.appendChild(st); }

  // ---- tutto quello che passa sul finto broker (payload interi), per cercare i segreti: W.__tutti = [{ ms, da, topic, p }] ----
  if (!W.__creaCP) {
    W.__creaCP = W.creaClient;
    W.creaClient = function (nome, opts) {
      var c = W.__creaCP(nome, opts), pub = c.publish;
      c.publish = function (topic, payload, o) {
        if (this.connected && !this.frozen) { (W.__tutti = W.__tutti || []).push({ ms: Date.now(), da: nome, topic: topic, p: String(payload) }); if (W.__tutti.length > 6000) W.__tutti.splice(0, 2000); }
        return pub.apply(this, arguments);
      };
      return c;
    };
  }
  function broker(C, dal) { return (W.__tutti || []).filter(function (x) { return x.topic.indexOf("/" + C + "/") >= 0 && (!dal || x.ms >= dal); }); }

  // ---- la spia dei giochi: apriTel(nome, { cp: "asta" }) → w.__t (il tavolo), w.__imp (le regole della prova, le legge l'host) ----
  {
    if (!W.__prepCP) W.__prepCP = W.preparaFinestra;
    W.preparaFinestra = function (w, nome, opz) {
      W.__prepCP(w, nome, opz);
      if (!opz || !opz.cp) return;
      var d = Object.getOwnPropertyDescriptor(w, "SG");
      Object.defineProperty(w, "SG", { configurable: true, get: d.get, set: function (v) {
        d.set(v);
        var reg = v.registra;
        v.registra = function (g) {
          if (g && g.id === opz.cp) {
            var av = g.avvia;
            g.avvia = function (t) {
              w.__t = t;
              if (w.__imp && t.impostazioni && !(t.linkParams && t.linkParams.stanza)) Object.keys(w.__imp).forEach(function (k) { t.impostazioni[k] = w.__imp[k]; });
              return av.apply(this, arguments);
            };
          }
          return reg.apply(this, arguments);
        };
      } });
    };
  }

  // ---- le misure: a 360x640 niente scorre e le cose dette stanno nello schermo ----
  function fuori(w, sels) {
    var d = w.document, x = [];
    if (d.scrollingElement.scrollHeight > w.innerHeight + 2) x.push("la pagina scorre (" + d.scrollingElement.scrollHeight + " su " + w.innerHeight + ")");
    if (d.scrollingElement.scrollWidth > w.innerWidth + 2) x.push("la pagina scorre di lato");
    sels.forEach(function (s) {
      qa(w, s).forEach(function (e) {
        if (!visibile(e)) return;
        var r = e.getBoundingClientRect();
        if (r.width > 0 && (r.left < -1 || r.top < -1 || r.right > w.innerWidth + 1 || r.bottom > w.innerHeight + 1)) x.push(s + " «" + e.textContent.replace(/\s+/g, " ").trim().slice(0, 30) + "» fuori schermo (" + Math.round(r.top) + "-" + Math.round(r.bottom) + ")");
      });
    });
    return x;
  }
  async function misura(nome, cosa, sels) {
    var f = document.getElementById("tel-" + nome), w = W.finestra(nome), out = [], M = [[360, 640], [412, 915]];
    // (animazioni e transizioni ferme; in Parola d'ordine si aspetta che la telecamera torni sul tabellone)
    var st = w.document.createElement("style"); st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}"; w.document.head.appendChild(st);
    var regia = function () { var u = w.__ORDINE && w.__ORDINE.ui; return !u || !u.inScena; };
    try {
      for (var i = 0; i < M.length; i++) {
        f.style.width = M[i][0] + "px"; f.style.height = M[i][1] + "px"; void w.document.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
        await W.dorme(350); await W.aspetta(regia, 12000); await W.dorme(150);
        fuori(w, sels).forEach(function (e) { out.push(nome + " " + cosa + " a " + M[i].join("x") + ": " + e); });
      }
    } finally { st.remove(); }
    f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize")); await W.dorme(120);
    return out;
  }

  // =================================================================================================== L'ASTA
  async function astaOnline(imp, nomi) {
    var P = await W.apriTel("Paky", { x: 0, cp: "asta", prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "L'Asta");
    fermo(P);
    for (var i = 1; i < nomi.length; i++) { var w = await W.apriTel(nomi[i], { hash: "gioco=asta&stanza=" + C, x: 185 * i, cp: "asta" }); fermo(w); }
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 15000)) no("non sono entrati in " + nomi.length + " (" + (vm(C).giocatori || []).length + ")");
    if (!W.clicca(P, /Comincia/)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    return { P: P, C: C };
  }
  function gioc(C, nome) { return (vm(C).giocatori || []).filter(function (g) { return g.nome === nome; })[0] || null; }
  function nomeId(C, id) { var g = (vm(C).giocatori || []).filter(function (x) { return x.id === id; })[0]; return g ? g.nome : null; }

  COPIONE.aggiungi("cpa1", { nome: "Controllo Asta temi online in 5 + chi guarda: tasti veri, doppio tocco, rialzo da soli, busta con un telefono spento, ricarica, voto con un telefono spento, segreti, misure", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca", "Marta", "Sara"], x = [], mis = [];
    var o = await astaOnline({ formato: "temi", crediti: 15, round: "misti", maledetta: false }, NOMI), P = o.P, C = o.C, t0 = Date.now();
    var Bea = await W.apriTel("Bea", { hash: "gioco=asta&stanza=" + C, x: 185 * 5 }); fermo(Bea);
    if (!await W.aspetta(function () { return /Stai guardando|guardi/i.test(T(Bea)); }, 8000)) no("Bea (arrivata tardi) non legge che sta guardando («" + T(Bea).slice(0, 120) + "»)");
    if (gioc(C, "Bea")) no("Bea, arrivata a partita cominciata, è tra i giocatori");
    var F = { doppio: false, rialzo: false, busta: false, ricarica: false, misAsta: false, aste: 0, rialzi: 0, buste: [] }, fino = Date.now() + 420000, ultimaAsta = -1;
    while (Date.now() < fino && vm(C).fase !== "voto" && vm(C).fase !== "fine") {
      var v = vm(C);
      if (v.fase === "scelta") {
        var chi = nomeId(C, v.sceglieId), wc = chi && W.finestra(chi);
        var carte = wc ? qa(wc, ".as-carta:not([disabled])") : [];
        if (carte.length) { var dp = v.tavolo.findIndex(function (c) { return c.bonus || c.pacco; }); (carte[dp >= 0 && dp < carte.length ? dp : 0]).click(); }
        await W.aspetta(function () { return vm(C).fase !== "scelta" || vm(C).nScelta !== v.nScelta; }, 25000);
        continue;
      }
      if (v.fase === "busta" && v.busta) {
        var B = v.busta, nB = B.n, dal = Date.now();
        if (!F.busta && B.gara.indexOf(idDi("Marta")) >= 0) {
          F.busta = true;
          W.spegni("Marta");   // Marta si spegne a busta aperta: non ha chiuso niente
          x.push("Marta spenta nella busta");
        }
        // gli altri in gara chiudono la busta coi tasti: +1 (o +3) e «Chiudo la busta»
        for (var k = 0; k < NOMI.length; k++) {
          var n = NOMI[k]; if (n === "Marta" && F.busta) continue;
          if (B.gara.indexOf(idDi(n)) < 0) continue;
          var w = W.finestra(n); if (!w) continue;
          var piu = qa(w, ".as-bst button").filter(function (b) { return /\+1|\+3/.test(b.textContent) && !b.disabled; });
          if (piu.length && k % 2) piu[0].click();
          if (piu.length > 1 && k === 2) piu[piu.length - 1].click();
          await W.dorme(60);
          var chiudo = bott(w, ".as-bus-piede .btn", /Chiudo la busta|Non offro/);
          if (chiudo) { chiudo.click(); chiudo.click(); }   // (doppio tocco: una busta sola)
        }
        if (!F.misBusta) { F.misBusta = true; mis = mis.concat(await misura("Luca", "busta", [".as-bus-carta", ".as-bst", ".as-bus-piede .btn"])); }
        var ok = await W.aspetta(function () { return vm(C).fase !== "busta" || (vm(C).busta || {}).n !== nB; }, 20000);
        if (!ok) no("la busta " + nB + " non si apre in 20 s (Marta spenta?)");
        // le offerte non devono essere passate sul broker prima di aprirsi (solo { t:"busta", q } verso l'host, mai nelle foto)
        var aperta = Date.now();
        broker(C, dal).forEach(function (m) { if (/"t":"vm"/.test(m.p) && /"fase":"busta"/.test(m.p) && /"buste"|"offerte"|"q":/.test(m.p)) no("nella foto prima di aprire le buste ci sono le offerte: " + m.p.slice(0, 160)); });
        var e = vm(C).esito;
        if (e && e.buste) {
          F.buste.push(e.buste.map(function (z) { return z.nome + " " + z.q; }).join(", ") + " → " + e.chiNome + " " + e.prezzo);
          var bm = e.buste.filter(function (z) { return z.nome === "Marta"; })[0];
          if (bm && bm.q > 0 && bm.id !== B.chooserId) no("Marta (spenta, mai chiusa la busta) risulta aver offerto " + bm.q);
        }
        continue;
      }
      if (v.fase === "asta" && v.asta && v.asta.n !== ultimaAsta) {
        var a = v.asta, nA = a.n; ultimaAsta = nA; F.aste++;
        if (!F.misAsta) { F.misAsta = true; mis = mis.concat(await misura("Giulia", "asta", [".sa-piede .btn", ".sa-pers", ".as-salti .btn"])); }
        // il primo amico in gara (non chi guida) fa un doppio tocco veloce sul tasto grande: deve salire di 2 (il secondo tocco è un rialzo da solo: due tocchi = +2)
        var gara = NOMI.filter(function (nn) { var g = gioc(C, nn); return g && !g.haCarta && !g.via && nn !== "Paky" && idDi(nn) !== a.leaderId && g.max >= a.offerta + 2; });
        if (!F.doppio && gara.length) {
          var wd = W.finestra(gara[0]), big = bott(wd, ".sa-piede .sa-grande, .sa-piede .btn", /Rilancio/);
          if (big) {
            var prima = a.offerta; big.click(); big.click();
            await W.dorme(700);
            var dopo = vm(C).asta;
            if (dopo && dopo.n === nA) {
              F.doppio = true;
              if (dopo.offerta !== prima + 2 || dopo.leaderId !== idDi(gara[0])) no("il doppio tocco veloce di " + gara[0] + " fa salire di " + (dopo.offerta - prima) + " invece di 2 (capo " + dopo.leaderNome + ")");
              x.push("doppio tocco di " + gara[0] + ": " + prima + " → " + dopo.offerta);
            }
          }
        }
        // chi guida rialza da solo col tasto (regola fissa), quando ci arriva: «🙋 Rialzo»
        var y = vm(C).asta, cap = y && nomeId(C, y.leaderId);
        if (y && y.n === nA && cap && F.rialzi < 3) {
          var gc = gioc(C, cap), wl = W.finestra(cap);
          if (gc && gc.max >= y.offerta + 1) {
            var rb = await W.aspetta(function () { return bott(wl, ".sa-piede .btn", /Rialzo/); }, 2500);
            if (!rb) no(cap + " (guida, max " + gc.max + ", offerta " + y.offerta + ") non ha il tasto «🙋 Rialzo»: «" + ((q(wl, ".sa-piede") || {}).textContent || "").slice(0, 120) + "»");
            else {
              var p0 = y.offerta; rb.click();
              if (!await W.aspetta(function () { var z = vm(C).asta; return z && z.offerta === p0 + 1 && z.leaderId === y.leaderId; }, 2500)) no("il rialzo da soli di " + cap + " non passa (" + JSON.stringify(vm(C).asta && [vm(C).asta.offerta, vm(C).asta.leaderNome]) + ")");
              else {
                F.rialzi++; F.rialzo = cap + " " + p0 + " → " + (p0 + 1);
                // e ancora una volta, dopo aver visto la foto nuova (due rialzi di fila)
                var gc2 = gioc(C, cap);
                if (gc2.max >= p0 + 2) {
                  var rb2 = await W.aspetta(function () { var b = bott(wl, ".sa-piede .btn", /Rialzo: /); return b && new RegExp("Rialzo: " + (p0 + 2)).test(b.textContent) ? b : null; }, 2500);
                  if (!rb2) no(cap + " non può rialzare di nuovo da solo (seconda volta)");
                  else { rb2.click(); if (!await W.aspetta(function () { var z = vm(C).asta; return z && z.offerta === p0 + 2; }, 2500)) no("il secondo rialzo da soli di " + cap + " non passa"); else F.rialzo += " → " + (p0 + 2); }
                }
              }
            }
          }
        }
        // Sara ricarica la pagina a metà della seconda asta
        if (!F.ricarica && F.aste === 2) {
          F.ricarica = true;
          await W.ricarica("Sara"); fermo(W.finestra("Sara"));
          if (!await W.aspetta(function () { var s = W.finestra("Sara"); return s && (q(s, ".sa-pers") || q(s, ".as-carta") || q(s, ".as-bus-carta")); }, 10000)) no("Sara ricaricata non torna al tavolo («" + T(W.finestra("Sara")).slice(0, 120) + "»)");
          else x.push("Sara ricarica e torna al tavolo");
        }
        // tutti gli altri passano col tasto
        var z = vm(C).asta; if (!z || z.n !== nA) continue;
        NOMI.forEach(function (nn) { if (idDi(nn) === z.leaderId) return; var wp = W.finestra(nn); var bp = wp && bott(wp, ".sa-piede .btn", /^Passo$/); if (bp) bp.click(); });
        await W.aspetta(function () { return !vm(C).asta || vm(C).asta.n !== nA; }, 13000);
        continue;
      }
      if (v.fase === "esito" || v.fase === "round") { W.clicca(P, /Vedi le carte|Avanti/); }
      await W.dorme(300);
    }
    if (vm(C).fase !== "voto") no("non si arriva al voto (fase " + vm(C).fase + ")");
    if (!F.doppio) no("non sono riuscito a provare il doppio tocco");
    if (!F.rialzo) no("non sono riuscito a provare il rialzo da soli");
    x.push("rialzo da soli: " + F.rialzo + " (" + F.rialzi + " volte)");
    x.push("buste: " + F.buste.join(" | "));
    // Marta torna (si riaccende) prima del voto
    W.riaccendi("Marta");
    // ---- il voto: Luca si spegne senza votare, gli altri votano coi tasti; Bea non può votare ----
    var V = vm(C), dalV = Date.now();
    W.spegni("Luca");
    mis = mis.concat(await misura("Giulia", "voto", [".as-scen", ".as-vk"]));
    if (qa(Bea, ".as-vk:not([disabled])").length) no("Bea (guarda) può votare");
    ["Paky", "Giulia", "Marta", "Sara"].forEach(function (n) { var w = W.finestra(n), k = w && qa(w, ".as-vk:not(.mio):not([disabled])"); if (k && k.length) { k[0].click(); k[0].click(); } });
    await W.dorme(600);
    var hv = vm(C).hannoVotato || [];
    if (vm(C).fase === "voto" && hv.length < 3) no("i voti coi tasti non arrivano (" + hv.length + ")");
    var chiuso = await W.aspetta(function () { return vm(C).fase === "fine"; }, (V.restaVoto || 30000) + 25000);
    if (!chiuso) no("con Luca spento il voto non si chiude (resta " + vm(C).restaVoto + " ms)");
    x.push("voto chiuso in " + Math.round((Date.now() - dalV) / 1000) + " s con Luca spento");
    var Fi = vm(C), stelle = Fi.giocatori.reduce(function (s, g) { return s + g.stelle; }, 0);
    if (stelle > 4 || stelle < 3) no("stelle date " + stelle + " (votavano in 4, Luca spento)");
    Fi.giocatori.forEach(function (g) { if ((g.votiDa || []).indexOf(g.nome) >= 0) no(g.nome + " si è votato da solo"); });
    W.riaccendi("Luca");
    if (!await W.aspetta(function () { return /Classifica finale/.test(T(W.finestra("Giulia"))); }, 6000)) no("Giulia non vede la classifica");
    mis = mis.concat(await misura("Giulia", "classifica", [".classifica", ".schermata .piede .btn"]));
    if (mis.length) no(mis.join(" / "));
    x.push("classifica: " + Fi.classifica.map(function (r) { return r.nome + " " + r.punti; }).join(", "));
    x.push("titoli: " + (Fi.titoli || []).map(function (t) { return t.icona + " " + t.chi; }).join(" "));
    // la Rivincita: tutti di nuovo in saletta, Bea compresa? (chi guardava entra alla prossima)
    senzaErrori();
    return x.join(" · ") + " · " + Math.round((Date.now() - t0) / 1000) + " s di partita";
  } });

  COPIONE.aggiungi("cpa2", { nome: "Controllo Asta fantacalcio online in 6: tasti veri, rialzo da soli (+1 e +5), doppio tocco, Tommi spento e poi di nuovo dentro, misure dello stadio", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca", "Marta", "Sara", "Tommi"], x = [], mis = [];
    var o = await astaOnline({ formato: "fanta" }, NOMI), P = o.P, C = o.C, t0 = Date.now();
    var F = { doppio: false, rialzo1: false, rialzo5: false, spento: false, tornato: false, mis: false, n: 0 }, fino = Date.now() + 600000, visti = {};
    var SLOT = { P: 1, D: 1, C: 2, A: 1 };
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), a = v.asta;
      if (v.fase !== "asta" || !a) { await W.dorme(200); continue; }
      var chiave = a.nCarta + "|" + a.offerta + "|" + a.leaderId; if (visti[chiave]) { await W.dorme(150); continue; }
      visti[chiave] = 1;
      var nC = a.nCarta;
      var elegg = NOMI.filter(function (n) { var g = gioc(C, n); return g && !g.via && (g.conta[a.ruolo] || 0) < SLOT[a.ruolo]; });
      if (!F.mis && elegg.indexOf("Giulia") >= 0) { F.mis = true; mis = mis.concat(await misura("Giulia", "stadio in 6", [".st-piede .btn", ".as-salti .btn"])); }
      // Tommi si spegne alla sesta asta (in gara o no), torna alla dodicesima
      F.n++;
      if (F.n === 6 && !F.spento) { F.spento = true; W.spegni("Tommi"); x.push("Tommi spento all'asta " + F.n); }
      if (F.n === 14 && F.spento && !F.tornato) { F.tornato = true; W.riaccendi("Tommi"); x.push("Tommi riacceso all'asta " + F.n); }
      var vivi = elegg.filter(function (n) { return !(F.spento && !F.tornato && n === "Tommi"); });
      if (!a.leaderId) {
        // il primo che può lo prende coi tasti; alla terza asta un doppio tocco veloce sul «Lo prendo» (= 2: lo prende e rialza da solo)
        var pr = vivi.filter(function (n) { var g = gioc(C, n); return g.max >= a.offerta; })[0];
        if (pr) {
          var w = W.finestra(pr), b = await W.aspetta(function () { return bott(w, ".st-piede .btn", /Lo prendo|Rilancio/); }, 2500);
          if (b) {
            if (!F.doppio && pr !== "Paky" && gioc(C, pr).max >= 2) { b.click(); b.click(); F.doppio = pr; await W.dorme(600); var dd = vm(C).asta; if (dd && dd.nCarta === nC && (dd.offerta !== 2 || dd.leaderId !== idDi(pr))) no("doppio tocco su «Lo prendo» di " + pr + ": offerta " + dd.offerta + " di " + dd.leaderNome + " invece di 2"); }
            else b.click();
          }
        }
        await W.dorme(250); continue;
      }
      // chi guida: rialzo da solo, una volta col +1 grande e una volta col +5
      var cap = nomeId(C, a.leaderId), gc = gioc(C, cap), wl = cap && W.finestra(cap);
      if (wl && !(F.spento && !F.tornato && cap === "Tommi")) {
        if (!F.rialzo1 && gc.max >= a.offerta + 1) {
          var r1 = await W.aspetta(function () { return bott(wl, ".st-piede .btn", /Rialzo/); }, 2500);
          if (!r1) no(cap + " guida il fanta ma non ha «🙋 Rialzo» («" + ((q(wl, ".st-piede") || {}).textContent || "") + "»)");
          else { var o1 = a.offerta; r1.click(); if (!await W.aspetta(function () { var z = vm(C).asta; return z && z.offerta === o1 + 1 && z.leaderId === a.leaderId; }, 2500)) no("il rialzo da soli nel fanta non passa"); else F.rialzo1 = cap + " " + o1 + "→" + (o1 + 1); }
          continue;
        }
        if (F.rialzo1 && !F.rialzo5 && gc.max >= a.offerta + 5) {
          var r5 = await W.aspetta(function () { return bott(wl, ".st-piede .as-salti .btn", /^\+5/); }, 2500);
          if (!r5) no(cap + " guida (max " + gc.max + ", offerta " + a.offerta + ") ma non ha il +5 acceso");
          else { var o5 = a.offerta; r5.click(); if (!await W.aspetta(function () { var z = vm(C).asta; return z && z.offerta === o5 + 5 && z.leaderId === a.leaderId; }, 2500)) no("il +5 da soli nel fanta non passa"); else F.rialzo5 = cap + " " + o5 + "→" + (o5 + 5); }
          continue;
        }
      }
      // gli altri passano coi tasti
      vivi.forEach(function (n) { if (idDi(n) === a.leaderId) return; var wp = W.finestra(n), bp = wp && bott(wp, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); });
      await W.aspetta(function () { var z = vm(C).asta; return !z || z.nCarta !== nC || z.offerta !== a.offerta || z.leaderId !== a.leaderId; }, 13000);
    }
    if (vm(C).fase !== "fine") no("il fanta online in 6 non finisce (fase " + vm(C).fase + ")");
    if (!F.rialzo1 || !F.rialzo5) no("rialzo da soli non provato del tutto: +1 " + F.rialzo1 + ", +5 " + F.rialzo5);
    var Fi = vm(C);
    var tom = gioc(C, "Tommi");
    if (tom) { var tot = 0; Object.keys(SLOT).forEach(function (r) { tot += (tom.conta[r] || 0); }); x.push("Tommi finisce con " + tot + " calciatori"); }
    Fi.giocatori.forEach(function (g) { var tot = 0; Object.keys(SLOT).forEach(function (r) { tot += (g.conta[r] || 0); }); if (tot !== 5) no(g.nome + " finisce con " + tot + " calciatori invece di 5"); if (g.crediti < 0) no(g.nome + " ha crediti negativi"); });
    x.push("rialzo da soli " + F.rialzo1 + ", +5 " + F.rialzo5 + "; doppio tocco di " + F.doppio + " = 2");
    if (mis.length) no(mis.join(" / "));
    senzaErrori();
    return x.join(" · ") + " · " + Math.round((Date.now() - t0) / 1000) + " s";
  } });

  // =================================================================================================== PAROLA D'ORDINE
  function chiaveDa(w) { return [].map.call(w.document.querySelectorAll(".or-tab .or-carta"), function (b) { var m = / c(\d|n|x)(\s|$)/.exec(b.className); return m ? (/\d/.test(m[1]) ? +m[1] : m[1]) : null; }); }
  function pOrd(C, id) { return (vm(C).players || []).filter(function (p) { return p.id === id; })[0] || null; }
  function nOrd(C, id) { var p = pOrd(C, id); return p ? p.nome : null; }
  function cartaOrd(w, i) { return w.document.querySelectorAll(".or-tab .or-carta")[i]; }
  function rawO(nome, m) { var h = W.reteDi(nome); if (!h) no("non trovo la rete di " + nome); h.invia(m); }

  COPIONE.aggiungi("cpo1", { nome: "Controllo Parola d'ordine online in 6 (3 contro 3) coi tasti: parole pensate, doppio gira, squadra spenta, capo che ricarica, chi arriva tardi, segreti sul broker, fine e rivincita", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca", "Marta", "Sara", "Tommi"], x = [], mis = [], t0 = Date.now();
    var P = await W.apriTel("Paky", { x: 0, cp: "ordine", prima: function (w) { w.__imp = { tempoInd: 60 }; } }), C = await W.apriStanza(P, "Parola d'ordine");
    for (var i = 1; i < NOMI.length; i++) await W.apriTel(NOMI[i], { hash: "gioco=ordine&stanza=" + C, x: 185 * i, cp: "ordine" });
    if (!await W.aspetta(function () { return (vm(C).players || []).filter(function (p) { return !p.bot; }).length === 6; }, 15000)) no("non entrano in 6");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 10000)) no("non comincia");
    var dal = Date.now(), F = { ind: 0, doppio: false, spenti: null, ricaricato: false, nino: false, pens: 0, mis: false }, fino = Date.now() + 900000, parola = 0;
    var spenti = {};
    function capoNome() { var v = vm(C); return nOrd(C, v.capo[v.turno]); }
    function indovini(v) { return (v.players || []).filter(function (p) { return p.team === v.turno && p.id !== v.capo[v.turno] && !p.via && !p.bot && !spenti[p.nome]; }); }
    while (Date.now() < fino && vm(C).fase === "gioco") {
      var v = vm(C);
      if (v.sospeso || v.attesa) { await W.dorme(250); continue; }
      if (v.passo === "indizio") {
        F.ind++;
        var cn = capoNome(), wC = W.finestra(cn), key = chiaveDa(wC), team = v.turno;
        // il 4° indizio: prima spengo i due che indovinano della squadra di turno (se non c'è l'host tra loro)
        if (F.ind >= 4 && !F.spenti) {
          var ind = indovini(v).map(function (p) { return p.nome; });
          if (ind.indexOf("Paky") < 0 && ind.length === 2) {
            F.spenti = { quando: Date.now(), team: team, nomi: ind, ind: F.ind };
            ind.forEach(function (n) { spenti[n] = 1; W.spegni(n); });
            x.push("spenti " + ind.join(" e ") + " (squadra " + team + ") prima dell'indizio");
          }
        }
        // due indizi dopo, i due spenti si riaccendono: devono tornare in squadra
        if (F.spenti && !F.riacc && F.ind >= F.spenti.ind + 3) {
          F.riacc = true;
          F.spenti.nomi.forEach(function (n) { W.riaccendi(n); delete spenti[n]; });
          if (!await W.aspetta(function () { return F.spenti.nomi.every(function (n) { var p = (vm(C).players || []).filter(function (z) { return z.nome === n; })[0]; return p && !p.via; }); }, 10000)) no(F.spenti.nomi.join(" e ") + " riaccesi non tornano in squadra");
          else x.push(F.spenti.nomi.join(" e ") + " riaccesi: di nuovo in squadra");
          v = vm(C); if (v.passo !== "indizio") continue;
          cn = capoNome(); wC = W.finestra(cn); key = chiaveDa(wC); team = v.turno;
        }
        var inp = await W.aspetta(function () { return q(wC, ".or-input"); }, 4000);
        if (!inp) { no(cn + " (capo) non ha la casella dell'indizio («" + T(wC).slice(-160) + "»)"); }
        inp.value = "ZIGO" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[parola++ % 26];
        var due = qa(wC, ".or-num").filter(function (b) { return b.textContent === "2"; })[0]; if (due) due.click();
        bott(wC, ".or-riga button", /^Invia$/).click();
        if (!await W.aspetta(function () { var y = vm(C); return y.passo === "indovina" || y.turno !== team || y.fase !== "gioco"; }, 90000)) no("dopo l'indizio di " + cn + " non si indovina");
        var y = vm(C);
        if (y.passo !== "indovina" || y.turno !== team) continue;
        // il capo segna col dito 2 parole sue ancora coperte e tocca «✅ Fatto»
        var sue = []; key.forEach(function (c, j) { if (c === team && !y.tab[j].g) sue.push(j); });
        var salta = await W.aspetta(function () { return bott(wC, "button", /^Salta$/); }, 3000);
        if (!salta) no(cn + " non ha la scelta «🤔 Quali parole intendevi?»");
        else {
          sue.slice(0, 2).forEach(function (j) { cartaOrd(wC, j).click(); });
          var ok = salta.previousElementSibling;
          if (!ok || !new RegExp("Fatto · " + Math.min(2, sue.length) + "/2").test(ok.textContent)) no("il tasto dopo " + Math.min(2, sue.length) + " parole segnate dice «" + (ok && ok.textContent) + "»");
          ok.click(); F.pens++;
          // il 2° indizio: il capo ricarica subito dopo aver segnato le parole: ritrova il tabellone coi colori e non gliele richiede
          if (F.ind >= 2 && !F.ricaricato && cn !== "Paky") {
            F.ricaricato = true; await W.dorme(300);
            await W.ricarica(cn); wC = W.finestra(cn);
            if (!await W.aspetta(function () { return chiaveDa(W.finestra(cn)).filter(function (c) { return c != null; }).length === 25; }, 10000)) no(cn + " (capo) ricaricato non ritrova i colori del tabellone");
            await W.dorme(600);
            if (bott(W.finestra(cn), "button", /^Salta$/)) no(cn + " ricaricato si vede richiedere le parole pensate");
            x.push(cn + " (capo) ricarica dopo aver segnato: colori sì, non gliele richiede");
          }
        }
        // Nino arriva a partita cominciata (al 3° indizio)
        if (F.ind === 3 && !F.nino) {
          F.nino = true;
          var Nn = await W.apriTel("Nino", { hash: "gioco=ordine&stanza=" + C, x: 185 * 6, cp: "ordine" });
          var pn = await W.aspetta(function () { return (vm(C).players || []).filter(function (p) { return p.nome === "Nino"; })[0]; }, 8000);
          if (!pn) no("Nino (arrivato tardi) non entra in una squadra");
          else {
            if (vm(C).capo.indexOf(pn.id) >= 0) no("Nino arrivato tardi fa il capo");
            await W.dorme(800);
            var kn = chiaveDa(Nn), cop = vm(C).tab.map(function (c, j) { return c.g ? null : kn[j]; }).filter(function (c) { return c != null; });
            if (cop.length) no("Nino (non capo) vede i colori delle parole coperte");
            x.push("Nino arriva tardi: nella squadra " + pn.team + ", niente colori");
          }
        }
        continue;
      }
      if (v.passo === "indovina") {
        var team2 = v.turno, cn2 = capoNome(), key2 = chiaveDa(W.finestra(cn2)), gu = indovini(v);
        var mie = []; key2.forEach(function (c, j) { if (c === team2 && !v.tab[j].g) mie.push(j); });
        if (!gu.length) { await W.dorme(500); continue; }
        var chi = gu[0].nome, wG = W.finestra(chi);
        if (!F.mis && chi !== "Paky") { F.mis = true; mis = mis.concat(await misura(chi, "tabellone in 6", [".or-tab .or-carta", ".or-sotto button"])); }
        var trovate = v.girate || 0;
        if (trovate >= (F.ind % 2 ? 1 : 2) || !mie.length) { var bp = bott(wG, "button", /Basta così, passo/); if (bp) { bp.click(); await W.aspetta(function () { return vm(C).turno !== team2 || vm(C).fase !== "gioco"; }, 6000); } else await W.dorme(300); continue; }
        var gir0 = v.tab.filter(function (c) { return c.g; }).length;
        if (!F.doppio && chi !== "Paky" && mie.length >= 2 && trovate === 0) {
          // doppio «gira» veloce di due parole diverse: deve girarsi solo la prima
          F.doppio = true;
          rawO(chi, { t: "gira", i: mie[0] }); rawO(chi, { t: "gira", i: mie[1] });
          await W.aspetta(function () { var z = vm(C); return !z.sospeso && z.tab.filter(function (c) { return c.g; }).length > gir0; }, 8000);
          await W.dorme(300);
          var z = vm(C);
          if (!z.tab[mie[0]].g) no("il primo gira veloce non gira la parola");
          if (z.tab[mie[1]].g) no("il secondo gira (mentre la prima era in sospeso) ha girato anche un'altra parola");
          x.push("doppio gira veloce: una parola sola");
          continue;
        }
        // coi tasti: tocca la parola (segno) e poi di nuovo (gira)
        cartaOrd(wG, mie[0]).click();
        await W.aspetta(function () { var z = vm(C); return (z.prop || {})[gu[0].id] || z.sospeso; }, 2000);
        cartaOrd(wG, mie[0]).click();
        await W.aspetta(function () { var z = vm(C); return z.fase !== "gioco" || (!z.sospeso && z.tab[mie[0]].g); }, 8000);
        continue;
      }
      await W.dorme(300);
    }
    // la squadra spenta: il turno non è rimasto fermo
    if (F.spenti) {
      x.push("con la squadra spenta il turno è passato");
      F.spenti.nomi.forEach(function (n) { W.riaccendi(n); });
    }
    var Fi = vm(C);
    if (Fi.fase !== "fine") no("la partita non finisce (fase " + Fi.fase + ", " + Math.round((Date.now() - dal) / 1000) + " s)");
    x.push("vince la squadra " + Fi.vince + " dopo " + F.ind + " indizi in " + Math.round((Date.now() - dal) / 1000) + " s");
    // i segreti sul broker: la chiave solo ai capi, le parole pensate mai fuori prima della fine
    var fineMs = Date.now();
    broker(C, dal).forEach(function (m) {
      var s = m.p;
      if (/"t":"vm"/.test(s) && /"pensate"/.test(s)) no("le parole pensate sono in una foto: " + s.slice(0, 120));
      if (/"t":"vm"/.test(s) && /"fase":"gioco"/.test(s)) {
        var mm = /"tab":(\[[^\]]*\])/.exec(s);
        if (mm) { try { JSON.parse(mm[1]).forEach(function (c) { if (!c.g && c.c != null) no("una parola coperta col suo colore in una foto"); }); } catch (e) {} }
      }
      if (/"t":"chiave"/.test(s)) { var to = /"to":"([^"]+)"/.exec(s); if (!to) no("una chiave senza destinatario"); }
    });
    // la fine: «🤔 Cosa intendevi?», la serata, la scelta della rivincita solo all'host
    if (!Fi.cosa || !(Fi.cosa.l || []).length) no("a fine partita niente «🤔 Cosa intendevi?» (parole pensate segnate: " + F.pens + ")");
    else x.push("Cosa intendevi: " + Fi.cosa.l.length + " indizi" + (Fi.cosa.premio && Fi.cosa.premio.length ? ", 🧠 squadra " + Fi.cosa.premio.map(function (s) { return s.k; }).join("+") : ""));
    var Gw = W.finestra("Giulia");
    var av = await W.aspetta(function () { return bott(Gw, "button", /Avanti/); }, 6000);
    if (av) { NOMI.forEach(function (n) { var w = W.finestra(n), b = w && bott(w, "button", /Avanti/); if (b) b.click(); }); }
    if (!await W.aspetta(function () { return P.document.querySelector(".or-riv-modo"); }, 15000)) no("l'host non ha la scelta della rivincita");
    var rm0 = vm(C).rivModo;
    rawO("Giulia", { t: "rivmodo", v: "caso" }); await W.dorme(500);
    if (vm(C).rivModo !== rm0) no("la scelta della rivincita mandata da Giulia (non host) conta");
    if (Gw.document.querySelector(".or-riv-modo")) no("Giulia vede la scelta della rivincita");
    if (!/Rossi \d – \d Blu/.test(T(Gw))) no("Giulia non vede la serata «Rossi 1 – 0 Blu»");
    mis = mis.concat(await misura("Giulia", "fine", [".or-sotto button", ".or-stato"]));
    mis = mis.concat(await misura("Paky", "fine host", [".or-sotto button", ".or-riv-modo"]));
    var capi = vm(C).capo.slice();
    var bc = bott(P, ".or-riv-modo button", /Capo nuovo/); if (bc) bc.click();
    await W.aspetta(function () { return vm(C).rivModo === "capo"; }, 3000);
    if (!await W.aspetta(function () { return W.clicca(P, /Rivincita|Nuova partita/); }, 4000)) no("niente Rivincita");
    if (!await W.aspetta(function () { return vm(C).fase === "lobby"; }, 10000)) no("la rivincita non torna in saletta");
    var capi2 = vm(C).capo;
    if (capi2[0] === capi[0] && capi2[1] === capi[1]) no("con «👑 Capo nuovo» i capi restano gli stessi");
    var pl = vm(C).players.filter(function (p) { return !p.bot; });
    x.push("rivincita in saletta: " + pl.length + " giocatori, capi nuovi");
    if (mis.length) no(mis.join(" / "));
    senzaErrori();
    return x.join(" · ") + " · " + Math.round((Date.now() - t0) / 1000) + " s";
  } });

  // =================================================================================================== LA LINEA DEL TEMPO
  function annoDi(w, tit) {
    var cats = w.SG_CATEGORIE || [];
    for (var i = 0; i < cats.length; i++) for (var j = 0; j < (cats[i].eventi || []).length; j++) if (cats[i].eventi[j].titolo === tit) return cats[i].eventi[j].anno;
    return null;
  }
  function gapOk(linea, Y) { return linea.filter(function (e) { return e.anno < Y; }).length; }
  function gapKo(linea, Y) { if (linea.length && linea[0].anno < Y) return 0; if (linea.length && linea[linea.length - 1].anno > Y) return linea.length; return -1; }
  function gTl(C, nome) { return (vm(C).giocatori || []).filter(function (g) { return g.nome === nome; })[0] || null; }
  function nTl(C, id) { var g = (vm(C).giocatori || []).filter(function (x) { return x.id === id; })[0]; return g ? g.nome : null; }
  function scriviAnno(w, Y) { var inp = w.document.querySelector(".st-barra .tl-anno .v"); if (!inp) return false; inp.focus(); inp.value = String(Y); inp.dispatchEvent(new w.Event("input")); inp.blur(); return true; }
  // col dito: tocca il posto, (l'anno), «✅ Mettila qui»; doppio = due tocchi veloci sul tasto
  async function piazza(w, gap, anno, doppio) {
    var sl = await W.aspetta(function () { var s = w.document.querySelectorAll(".tl-slot"); return s.length ? s : null; }, 9000);
    if (!sl) return "niente posti («" + T(w).replace(/\s+/g, " ").slice(0, 160) + "»" + (w.__cerr ? ", errori: " + w.__cerr.slice(-3).join(" / ") : "") + ")";
    var b = sl[Math.max(0, Math.min(gap, sl.length - 1))]; b.click(); await W.dorme(120);
    if (anno != null) { scriviAnno(w, anno); await W.dorme(80); }
    var c = await W.aspetta(function () { var x = w.document.querySelector(".tl-conferma"); return x && !x.disabled ? x : null; }, 2000);
    if (!c) return "niente «Mettila qui»";
    c.click(); if (doppio) c.click();
    return "";
  }
  async function tlStanza(imp, nomi) {
    var P = await W.apriTel("Paky", { x: 0, cp: "timeline", prima: function (w) { w.__imp = imp; var ce = w.console.error; w.console.error = function () { (w.__cerr = w.__cerr || []).push([].map.call(arguments, function (a) { return a && a.stack ? String(a.stack).split(String.fromCharCode(10)).slice(0, 3).join(" ") : String(a); }).join(" ")); return ce.apply(this, arguments); }; } }), C = await W.apriStanza(P, "La linea del tempo");
    for (var i = 1; i < nomi.length; i++) await W.apriTel(nomi[i], { hash: "gioco=timeline&stanza=" + C, x: 185 * i, cp: "timeline" });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === nomi.length; }, 15000)) no("non entrano in " + nomi.length);
    return { P: P, C: C };
  }
  function idTl(n) { return n === "Paky" ? "host" : A.mioId(n); }

  COPIONE.aggiungi("ctp1", { nome: "Controllo Linea del tempo online in 6 (⚡ tutti insieme da solo) coi tasti: doppio tocco, uno spento, uno che ricarica, chi arriva tardi, Avanti di tutti, misure", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca", "Marta", "Sara", "Tommi"], x = [], mis = [], t0 = Date.now();
    var o = await tlStanza({}, NOMI), P = o.P, C = o.C;
    if (!vm(C).insieme) no("in 6 la saletta non dice ⚡ Tutti insieme");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("niente «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "tutti"; }, 20000)) no("la prima carta non arriva (" + vm(C).fase + ")");
    var F = { spento: false, ricarica: false, nino: false, doppio: false, avanti: [], mis: false }, fino = Date.now() + 600000, fatti = {}, viaT = {};
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C);
      if (v.fase === "tutti" && !fatti[v.n]) {
        fatti[v.n] = 1;
        var Y = annoDi(P, v.carta.titolo);
        if (v.giro === 2 && !F.spento) { F.spento = true; W.spegni("Marta"); viaT.Marta = 1; x.push("Marta spenta alla carta 2"); }
        else if (v.giro >= 3 && viaT.Marta) { W.riaccendi("Marta"); delete viaT.Marta; await W.dorme(600); }
        if (v.giro === 2 && !F.nino) {
          F.nino = true;
          var Nn = await W.apriTel("Nino", { hash: "gioco=timeline&stanza=" + C, x: 185 * 6, cp: "timeline" });
          await W.dorme(2500);
          if (gTl(C, "Nino")) no("Nino (arrivato tardi) è tra chi gioca");
          if (Nn.document.querySelectorAll(".tl-slot").length) no("Nino (guarda) può mettere la carta");
          x.push("Nino arriva tardi e guarda");
        }
        var t1 = Date.now();
        for (var k = 0; k < NOMI.length; k++) {
          var n = NOMI[k]; if (viaT[n]) continue;
          if (vm(C).fase !== "tutti" || vm(C).n !== v.n) break;
          if (v.giro === 3 && n === "Sara" && !F.ricarica) {
            F.ricarica = true; await W.ricarica("Sara");
            if (!await W.aspetta(function () { return W.finestra("Sara").document.querySelector(".tl-slot"); }, 12000)) no("Sara ricaricata non può più mettere la carta");
            else x.push("Sara ricarica a metà carta e la mette");
          }
          if (v.carta.autore === idTl(n)) continue;
          var w = W.finestra(n), giusto = (k + v.giro) % 3 !== 0, gap = giusto ? gapOk(v.linea, Y) : Math.max(0, gapKo(v.linea, Y));
          var dop = !F.doppio && n === "Giulia";
          var err = await piazza(w, gap, k === 1 && Y != null ? Y + (v.giro % 2) : null, dop);
          if (err) no(n + " alla carta " + v.giro + ": " + err);
          if (dop) {
            F.doppio = true; await W.dorme(400);
            // e un'altra posa a messaggio, in un posto diverso: vale la prima
            W.reteDi("Giulia").invia({ t: "posa", n: v.n, gap: gap === 0 ? 1 : 0 });
          }
        }
        if (!F.mis) { F.mis = true; mis = mis.concat(await misura("Luca", "carta tutti insieme", [".st-barra.on button", ".tl-slot"])); }
        var chiusa = await W.aspetta(function () { return vm(C).fase !== "tutti" || vm(C).n !== v.n; }, 40000);
        if (!chiusa) no("la carta " + v.giro + " non si chiude");
        var sec = (Date.now() - t1) / 1000;
        if (v.giro !== 2 && v.giro !== 3 && sec > 20) no("con tutti che hanno scelto la carta " + v.giro + " si chiude dopo " + Math.round(sec) + " s");
        continue;
      }
      if (v.fase === "tEsito" && !fatti["e" + v.n]) {
        fatti["e" + v.n] = 1;
        if (F.doppio && v.esitoT && !F.chkDoppio) {
          F.chkDoppio = true;
          var rg = v.esitoT.risultati.filter(function (r) { return r.id === idTl("Giulia"); })[0];
          if (rg && !rg.scelto) no("il doppio tocco di Giulia non ha messo la carta");
        }
        var ta = Date.now();
        if (!F.misE) { await W.aspetta(function () { return bott(W.finestra("Giulia"), ".st-barra button", /Avanti/); }, 15000); F.misE = true; mis = mis.concat(await misura("Giulia", "risultato tutti insieme", [".st-barra.on button"])); }
        await W.aspetta(function () {
          if (vm(C).fase !== "tEsito" || vm(C).n !== v.n) return true;
          NOMI.forEach(function (n) { if (viaT[n]) return; var w = W.finestra(n), b = w && bott(w, ".st-barra button", /Avanti/); if (b && (vm(C).avanti || []).indexOf(idTl(n)) < 0) b.click(); });
          return false;
        }, 30000, 400);
        F.avanti.push(Math.round((Date.now() - ta) / 100) / 10);
        continue;
      }
      await W.dorme(250);
    }
    if (vm(C).fase !== "fine") no("la partita non finisce (fase " + vm(C).fase + ")");
    var Fi = vm(C);
    x.push("classifica: " + (Fi.classifica || []).map(function (r) { return r.nome + " " + r.punti; }).join(", "));
    x.push("risultati: avanti dopo " + F.avanti.join(", ") + " s");
    if (!await W.aspetta(function () { return /Rivincita|Nuova partita/.test(T(P)); }, 20000)) no("a fine partita l'host non ha i tasti");
    if (mis.length) no(mis.join(" / "));
    senzaErrori();
    return x.join(" · ") + " · " + Math.round((Date.now() - t0) / 1000) + " s";
  } });

  COPIONE.aggiungi("ctp2", { nome: "Controllo Linea del tempo a turno in 4 con ✋ Rubala coi tasti: furti, gettoni finiti, chi gioca non ruba, anno segreto sul broker, chi gioca spento, misure", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca", "Sara"], x = [], mis = [], t0 = Date.now();
    var o = await tlStanza({ gara: "turno", rubala: true, carte: 4 }, NOMI), P = o.P, C = o.C;
    if (vm(C).insieme || !vm(C).rubala) no("la saletta non è a turno con ✋ Rubala (" + vm(C).insieme + ", " + vm(C).rubala + ")");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("niente «Comincia»");
    var F = { furti: 0, presa: 0, persi: 0, finiti: false, spento: false, mis: false, turni: 0 }, fino = Date.now() + 720000, fatti = {}, viaT = {};
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C);
      if (v.fase === "turno" && !fatti["t" + v.n]) {
        fatti["t" + v.n] = 1; F.turni++;
        var chi = nTl(C, v.turnoId), w = W.finestra(chi), Y = annoDi(P, v.carta.titolo);
        // il 7° turno: chi gioca (non l'host) si spegne prima di scegliere: il turno non deve restare fermo
        if (F.turni >= 7 && chi !== "Paky" && !F.spento) {
          F.spento = true; W.spegni(chi); viaT[chi] = 1; var ts = Date.now();
          if (!await W.aspetta(function () { return vm(C).n !== v.n || vm(C).fase !== "turno"; }, 50000)) no("con " + chi + " spento il suo turno resta fermo");
          else x.push(chi + " spento al suo turno: si va avanti dopo " + Math.round((Date.now() - ts) / 1000) + " s");
          W.riaccendi(chi); delete viaT[chi];
          continue;
        }
        // sbaglia apposta un turno su due (così si può rubare)
        var sbaglia = F.turni % 2 === 1 && gapKo(v.linea, Y) >= 0;
        var err = await piazza(w, sbaglia ? gapKo(v.linea, Y) : gapOk(v.linea, Y), sbaglia ? null : Y);
        if (err) no(chi + " al turno " + F.turni + ": " + err);
        fatti["s" + v.n] = { sbaglia: sbaglia, Y: Y, chi: chi };
        continue;
      }
      if (v.fase === "votazione" && !fatti["v" + v.n]) {
        fatti["v" + v.n] = 1;
        var info = fatti["s" + v.n] || { Y: annoDi(P, v.carta.titolo), chi: nTl(C, v.turnoId) }, Y2 = info.Y, gioca = info.chi;
        // chi gioca prova a votare/rubare la sua carta a messaggio: non conta
        if (gioca !== "Paky") { W.reteDi(gioca).invia({ t: "voto", n: v.n, d: true, ruba: Y2 }); await W.dorme(300); if ((vm(C).rubano || []).indexOf(v.turnoId) >= 0) no(gioca + " ruba la sua stessa carta"); }
        var dalV = Date.now();
        for (var k = 0; k < NOMI.length; k++) {
          var n = NOMI[k]; if (n === gioca || viaT[n]) continue;
          if (vm(C).fase !== "votazione" || vm(C).n !== v.n) break;
          var wv = W.finestra(n);
          await W.aspetta(function () { return bott(wv, ".st-barra button", /Giusto/); }, 8000);
          var gg = gTl(C, n);
          // Giulia ruba sempre con l'anno sbagliato (finché ha gettoni); Luca ruba con l'anno giusto quando chi gioca ha sbagliato
          var vuoleRubare = (n === "Giulia") || (n === "Luca" && info.sbaglia);
          if (vuoleRubare) {
            var br = bott(wv, ".st-barra button", /Rubala con l'anno/);
            var dis = qa(wv, ".st-barra button.tl-ruba").filter(function (b) { return b.disabled; })[0];
            if (gg.gettoni <= 0) {
              if (br) no(n + " ha 0 gettoni ma «✋ Rubala» è acceso");
              if (dis && !F.finiti) { F.finiti = true; x.push(n + ": «" + dis.textContent + "»"); }
              // a messaggio, senza gettoni: non deve rubare
              W.reteDi(n).invia({ t: "voto", n: v.n, d: false, ruba: Y2 }); await W.dorme(300);
              if ((vm(C).rubano || []).indexOf(gg.id) >= 0) no(n + " ruba senza gettoni");
              continue;
            }
            if (!br) { no(n + " (gettoni " + gg.gettoni + ") non ha «✋ Rubala con l'anno»"); continue; }
            br.click(); await W.dorme(200);
            if (!F.mis) { F.mis = true; mis = mis.concat(await misura(n, "rubala aperto", [".st-barra.on button", ".st-barra.on input"])); }
            var an = vm(C).anni || [-3000, 2026], anno = n === "Giulia" ? (Y2 + 7 <= an[1] ? Y2 + 7 : Y2 - 7) : Y2;
            scriviAnno(wv, anno); await W.dorme(150);
            var bR = await W.aspetta(function () { return bott(wv, ".st-barra button", /Rubala! \(/); }, 2000);
            if (!bR) { no(n + ": dopo l'anno niente «✋ Rubala! (…)»"); continue; }
            bR.click(); F.furti++;
            await W.aspetta(function () { return (vm(C).rubano || []).indexOf(gg.id) >= 0; }, 3000);
          } else {
            var bv = bott(wv, ".st-barra button", k % 2 ? /Giusto/ : /No/); if (bv) bv.click();
          }
        }
        // l'anno dei furti non deve passare nelle foto prima del risultato
        await W.aspetta(function () { return vm(C).fase !== "votazione" || vm(C).n !== v.n; }, 35000);
        broker(C, dalV).forEach(function (m) { if (/"t":"vm"/.test(m.p) && /"fase":"votazione"/.test(m.p) && /"rube"/.test(m.p)) no("l'anno di chi ruba è nella foto durante il voto"); });
        var e = vm(C).esito;
        if (e && e.rubate) e.rubate.forEach(function (r) { if (r.esito === "presa") F.presa++; if (r.esito === "perso") F.persi++; });
        continue;
      }
      if (v.fase === "esito" && !fatti["e" + v.n]) {
        fatti["e" + v.n] = 1;
        (vm(C).giocatori || []).forEach(function (g) { if (g.gettoni < 0 || g.gettoni > 3) no(g.nome + " ha " + g.gettoni + " gettoni"); });
        var chiE = nTl(C, v.turnoId), wE = W.finestra(chiE), ba = await W.aspetta(function () { return vm(C).fase !== "esito" || bott(wE, ".st-barra button", /Avanti/); }, 15000);
        if (ba && ba.click) ba.click();
        await W.aspetta(function () { return vm(C).fase !== "esito" || vm(C).n !== v.n; }, 20000);
        continue;
      }
      await W.dorme(250);
    }
    if (vm(C).fase !== "fine") no("la partita non finisce (fase " + vm(C).fase + ")");
    if (!F.presa) no("nessun furto riuscito (furti " + F.furti + ")");
    if (!F.finiti) no("i gettoni di Giulia non sono mai finiti");
    var Fi = vm(C);
    x.push("furti " + F.furti + ": " + F.presa + " presi, " + F.persi + " persi");
    x.push("classifica: " + (Fi.classifica || []).map(function (r) { return r.nome + " " + r.punti; }).join(", "));
    if (mis.length) no(mis.join(" / "));
    senzaErrori();
    return x.join(" · ") + " · " + Math.round((Date.now() - t0) / 1000) + " s";
  } });
})();

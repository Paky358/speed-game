// PROVE dei miglioramenti di Patata Bollente (miccia segreta), Linea del tempo («⚡ Tutti insieme») e Scalinata (scala grande 5-8).
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("migliora/patata-timeline-scalinata.js"); window.__run = COPIONE.prova("pat1")
// Gli scenari durano 1-3 minuti: lanciali senza aspettarli e poi leggi COPIONE.esiti (o await window.__run).
//
// pat1: Patata online nella Sala (3 telefoni) con la 🤫 miccia segreta: nel ⚙️ «Segreta» nasconde tempo e «cala»,
//       la riga «📜 Si gioca così» la dice agli amici; nella foto MAI la durata della miccia prima dello scoppio; sul
//       maxischermo «???» (niente secondi); passarla non rimette a posto il tempo (bruciato sempre in salita); uno
//       ricarica a metà e ritrova la partita; ogni scoppio tra 20 e 60 secondi, detto dopo («La miccia durava…»); fino alla fine.
// pat2: Patata sullo stesso telefono con la miccia segreta (3 nomi): «???», bomba passata, scoppio con la durata; 360x640 e 412x915.
// pat3: Patata online normale (miccia a vista): i secondi ci sono ancora e la foto non ha «segreta» (non si è rotto niente).
// tl1:  Linea del tempo nella Sala in 3, «⚡ Tutti insieme» con 5 carte: la regola nel ⚙️ (le carte diventano «in tutto»,
//       da 5 a 15), tutti piazzano la stessa carta, nella foto solo CHI ha scelto (mai dove), quando hanno scelto tutti si
//       scopre subito; chi ricarica dopo aver scelto legge «Hai già scelto»; chi non sceglie resta a 0; +100 ai giusti,
//       +50 al più veloce; «⏩ Avanti» parte subito solo se lo tocca più di metà; l'ultima carta vale doppio; punti finali giusti;
//       misure 360x640 e 412x915 (carta da piazzare e risultato) senza scorrere la pagina.
// tl2:  Linea del tempo «⚡ Tutti insieme» fuori dalla Sala: l'host ricarica a metà carta → «🔁 Partita ripresa», la
//       stessa carta si rigioca da capo; poi fino alla fine.
// tl3:  Linea del tempo online a turno (com'era): un giro intero a turno con voto, niente «insieme» nella foto.
// sc1:  Scalinata nella Sala in 6: niente «Chi gioca?», tutti e 6 sulla scala (niente Bot), numeri da 1 a 5 su ogni
//       telefono, scritta «Scala grande» in saletta; 360x640 e 412x915: corsie e tasti dentro lo schermo; partita intera;
//       poi «Piccola» nel ⚙️: in 4 sulla scala e 2 guardano.
// sc2:  Scalinata sullo stesso telefono: in 7 (numeri 1-6, partita intera passando il telefono); da solo con «Grande»
//       (8 corsie, 7 Bot, numeri 1-6, fino al podio); da solo normale (4 corsie, 1-3-5: com'era).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T, vm = A.vm;

  // ---- aiuti comuni ----
  function caso(a) { return a[Math.floor(Math.random() * a.length)]; }
  function senzaErrori(cosa) { var e = W.erroriTel(); if (e.length) no((cosa ? cosa + ": " : "") + "errori: " + e.slice(0, 3).join(" | ")); }
  async function regola(P, re, poi) {   // l'host cambia una regola dal ⚙️ della saletta (poi: prima di «Fatto»)
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/, ".sl-regole, button"); }, 5000)) no("non trovo ⚙️ Regole");
    await W.dorme(250);
    var ok = W.clicca(P, re, ".sl-foglio .modo-chip");
    if (!ok) no("nel ⚙️ non trovo la regola " + re);
    await W.dorme(150);
    if (poi) await poi(P.document.querySelector(".sl-foglio"));
    W.clicca(P, /Fatto/, ".sl-foglio button"); await W.dorme(400);
  }
  async function sala(gioco, amici) {
    var Z = await A.salaConAmici(amici);
    var C = await A.lanciaDallaSala("Paky", Z.S, gioco);
    return { S: Z.S, C: C };
  }
  // un telefono a misura: la pagina non scorre (né in giù né di lato). sel: un pezzo che non deve scorrere dentro
  async function misura(w, nome, larg, alt, sel) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(600);
    if (d.documentElement.scrollHeight > alt + 1) return larg + "x" + alt + ": la pagina scorre (" + d.documentElement.scrollHeight + ")";
    if (d.documentElement.scrollWidth > larg + 1) return larg + "x" + alt + ": la pagina scorre di lato (" + d.documentElement.scrollWidth + ")";
    if (sel) { var x = d.querySelector(sel); if (x && x.scrollHeight > x.clientHeight + 2) return larg + "x" + alt + ": «" + sel + "» scorre (" + x.scrollHeight + " su " + x.clientHeight + ")"; }
    return "";
  }
  function rimetti(w, nome) { var f = document.getElementById("tel-" + nome); f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize")); }
  function nomeDi(C, id, campo) { var p = (vm(C)[campo] || []).filter(function (x) { return x.id === id; })[0]; return p ? p.nome : null; }

  // =================== PATATA ===================
  // chi ha la bomba tocca il primo leggio che si può toccare (come col dito)
  function passaBomba(w) {
    var L = w && w.document.querySelector(".st-leggio.tocca"); if (!L) return false;
    L.click(); return true;
  }
  async function patataFinoAllaFine(C, ms, ogni) {
    var fino = Date.now() + (ms || 240000), visti = { boom: [], passaggi: 0, bruciatoGiu: 0 }, ultimo = null;
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C);
      if (v.fase === "voto") { W.clicca(W.finestra("Paky"), /Via!/); }
      if (v.fase === "gioco" && v.holder) {
        var k = v.categoria + "|" + v.round;
        if (ultimo && ultimo.k === k && v.segreta && v.bruciato + 50 < ultimo.b) visti.bruciatoGiu++;
        ultimo = { k: k, b: v.bruciato };
        if (v.segreta && JSON.stringify(v).match(/"miccia":\s*\d/)) no("nella foto c'è la durata della miccia prima dello scoppio");
        visti.perRound = visti.perRound || {};
        var w = (!v.segreta && (visti.perRound[k] || 0) >= 6) ? null : W.finestra(nomeDi(C, v.holder, "players"));   // (a vista: dopo 6 passaggi la si tiene, così scoppia)
        if (w && passaBomba(w)) { visti.passaggi++; visti.perRound[k] = (visti.perRound[k] || 0) + 1; }
      }
      if (v.fase === "esplosione" && v.boom && visti.boom.indexOf(v.boom.id + "|" + v.round + "|" + v.categoria) < 0) {
        visti.boom.push(v.boom.id + "|" + v.round + "|" + v.categoria);
        visti.durate = (visti.durate || []).concat([v.boom.miccia]);
      }
      if (ogni) await ogni(v, visti);
      await W.dorme(1300);
    }
    return visti;
  }

  COPIONE.aggiungi("pat1", { nome: "Patata online con la miccia segreta: niente secondi, durata mai nella foto, fino alla fine", fai: async function () {
    var Z = await sala("La Patata Bollente", ["Giulia", "Luca"]), C = Z.C, P = W.finestra("Paky"), G = W.finestra("Giulia");
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 3; }, 10000)) no("nella saletta non arrivano in 3");
    var nascosti = null;
    await regola(P, /Segreta/, async function (f) {
      var b10 = [].find.call(f.querySelectorAll(".modo-chip"), function (x) { return /10 s/.test(x.textContent); });
      nascosti = !!b10 && !b10.offsetParent;
    });
    if (!nascosti) no("con la miccia segreta nel ⚙️ si vedono ancora i secondi per passarla");
    if (!await W.aspetta(function () { return /Miccia segreta/.test(A.regoleDi(G)); }, 5000)) no("Giulia non legge la miccia segreta nelle regole («" + A.regoleDi(G) + "»)");
    if (!await W.aspetta(function () { return W.clicca(P, /Continua|Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Continua»");
    if (!await W.aspetta(function () { return vm(C).fase === "voto"; }, 8000)) no("non si arriva al voto");
    if (!await W.aspetta(function () { W.clicca(P, /Via!/); return vm(C).fase === "gioco" && vm(C).segreta; }, 40000)) no("la partita non parte con la miccia segreta (" + JSON.stringify(vm(C)).slice(0, 120) + ")");
    if (!await W.aspetta(function () { var c = G.document.querySelector(".pt-conto"); return c && c.textContent === "???"; }, 12000)) no("sul maxischermo di Giulia non c'è «???» («" + (G.document.querySelector(".pt-conto") || {}).textContent + "»)");
    var ricaricato = "";
    var V = await patataFinoAllaFine(C, 260000, async function (v) {
      if (ricaricato || v.fase !== "gioco") return;
      var chi = ["Giulia", "Luca"].filter(function (n) { var p = (v.players || []).filter(function (x) { return x.nome === n; })[0]; return p && !p.eliminato && p.id !== v.holder; })[0];
      if (!chi) return;
      ricaricato = chi;
      var w2 = await W.ricarica(chi);
      var ok = await W.aspetta(function () { var w = W.finestra(chi), c = w && w.document.querySelector(".pt-conto"); return (c && c.textContent === "???") || vm(C).fase !== "gioco"; }, 15000);
      if (!ok) no(chi + " dopo la ricarica non ritrova la partita («" + T(W.finestra(chi)).slice(0, 100) + "»)");
      var p = (vm(C).players || []).filter(function (x) { return x.nome === chi; })[0];
      if (p && p.via) no(chi + " dopo la ricarica risulta uscito");
    });
    if (vm(C).fase !== "fine") no("la partita non finisce (fase " + vm(C).fase + ", scoppi " + V.boom.length + ")");
    if (V.passaggi < 4) no("la bomba è passata solo " + V.passaggi + " volte");
    if (V.bruciatoGiu) no("la miccia è tornata indietro " + V.bruciatoGiu + " volte (passarla non deve rimettere il tempo)");
    if (!V.durate || V.durate.length < 2) no("scoppi visti: " + JSON.stringify(V.durate));
    V.durate.forEach(function (d) { if (!(d >= 20 && d <= 60)) no("una miccia durava " + d + " secondi (fuori da 20-60)"); });
    var cl = (vm(C).classifica || []).map(function (r) { return r.pos + "° " + r.nome; }).join(", ");
    senzaErrori();
    return "miccia segreta: «???» sul maxischermo, " + V.passaggi + " passaggi senza che il tempo torni indietro; micce di " + V.durate.join(", ") + " s; " +
      (ricaricato ? ricaricato + " ha ricaricato ed è tornato; " : "") + "classifica: " + cl;
  } });

  // la partita sullo stesso telefono: dalla home ai nomi, alle impostazioni
  async function localeDa(P, nomeGioco, nomi, chip) {
    var tess = await W.aspetta(function () { return A.tessera(P, nomeGioco); }, 6000); if (!tess) no("non trovo la tessera " + nomeGioco);
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non c'è «Su questo telefono» («" + A.modiVisti(P).join(" / ") + "»)");
    if (await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 3000)) {
      while (P.document.querySelectorAll(".sala-riga input").length < nomi.length) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
      while (P.document.querySelectorAll(".sala-riga input").length > nomi.length) { var x = P.document.querySelector(".sala-riga .togli, .sala-riga button"); if (!x) break; x.click(); await W.dorme(80); }
      [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = nomi[k]; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    }
    for (var k = 0; k < 6; k++) {
      if (chip && [].some.call(P.document.querySelectorAll(".modo-chip"), function (b) { return chip.test(b.textContent); })) { W.clicca(P, chip, ".modo-chip"); await W.dorme(150); chip = null; }
      var b = [].find.call(P.document.querySelectorAll(".schermata .piede button"), function (x) { return /Avanti|Comincia|Gioca|Inizia|Pronti|▶/.test(x.textContent) && !x.disabled; });
      if (!b) break;
      var era = /Comincia|Gioca|Inizia/.test(b.textContent) && !chip;
      b.click(); await W.dorme(400);
      if (era) break;
    }
    if (chip) no("non ho trovato la regola " + chip);
  }

  COPIONE.aggiungi("pat2", { nome: "Patata sullo stesso telefono con la miccia segreta: «???», scoppio con la durata, misure", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    await localeDa(P, "La Patata Bollente", ["Paky", "Giulia", "Luca"], /Segreta/);
    var cat = await W.aspetta(function () { return P.document.querySelector(".pt-catbtn"); }, 30000);
    if (!cat) no("non si arriva alla scelta della categoria («" + T(P).slice(0, 80) + "»)");
    cat.click();
    if (!await W.aspetta(function () { var c = P.document.querySelector(".pt-conto"); return c && c.textContent === "???"; }, 12000)) no("niente «???» sul maxischermo");
    var mis = await misura(P, "Paky", 360, 640) || await misura(P, "Paky", 412, 915); rimetti(P, "Paky");
    if (mis) no("il tavolo: " + mis);
    var t0 = Date.now(), passaggi = 0, durava = "";
    while (Date.now() - t0 < 95000) {
      var d = P.document.body.innerText.match(/La miccia durava (\d+) secondi/);
      if (d) { durava = d[1]; break; }
      if (passaBomba(P)) passaggi++;
      await W.dorme(1400);
    }
    if (!durava) no("dopo 95 secondi la bomba non è scoppiata (o non dice quanto durava la miccia)");
    if (+durava < 20 || +durava > 60) no("la miccia durava " + durava + " secondi");
    var sec = Math.round((Date.now() - t0) / 1000);
    W.clicca(P, /‹|Esci/, ".st-esci, .tl-esci, button");
    senzaErrori();
    return "«???» sul maxischermo, " + passaggi + " passaggi, BOOM dopo circa " + sec + " s: «La miccia durava " + durava + " secondi»; 360x640 e 412x915 senza scorrere";
  } });

  COPIONE.aggiungi("pat3", { nome: "Patata online con la miccia a vista (com'era): i secondi ci sono ancora", fai: async function () {
    var Z = await sala("La Patata Bollente", ["Giulia"]), C = Z.C, P = W.finestra("Paky"), G = W.finestra("Giulia");
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 2; }, 10000)) no("nella saletta non arrivano in 2");
    if (/Miccia segreta/.test(A.regoleDi(G))) no("la miccia segreta è accesa da sola");
    if (!await W.aspetta(function () { return W.clicca(P, /Continua|Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Continua»");
    if (!await W.aspetta(function () { return vm(C).fase === "voto"; }, 8000)) no("non si arriva al voto");
    if (!await W.aspetta(function () { W.clicca(P, /Via!/); return vm(C).fase === "gioco"; }, 40000)) no("non parte");
    if (vm(C).segreta) no("nella foto la miccia è segreta");
    if (!await W.aspetta(function () { var c = G.document.querySelector(".pt-conto"); return c && /^\d+\.\d$/.test(c.textContent); }, 12000)) no("sul maxischermo non ci sono i secondi («" + (G.document.querySelector(".pt-conto") || {}).textContent + "»)");
    var V = await patataFinoAllaFine(C, 120000);
    if (vm(C).fase !== "fine") no("non finisce");
    senzaErrori();
    return "a vista: secondi sul maxischermo, " + V.passaggi + " passaggi, finita (vince " + ((vm(C).vincitore || {}).nome || "?") + ")";
  } });

  // =================== LINEA DEL TEMPO ===================
  function giocTl(C) { return vm(C).giocatori || []; }
  // l'host piazza toccando il primo «Metti qui» e poi «✅ Mettila qui»
  async function hostPiazza(P) {
    var s = await W.aspetta(function () { return P.document.querySelector(".tl-slot"); }, 4000); if (!s) return false;
    s.click(); await W.dorme(150);
    var c = P.document.querySelector(".tl-conferma"); if (c && !c.disabled) { c.click(); return true; }
    return false;
  }
  function posaDa(nome, C, gap) { var h = W.reteDi(nome); if (h) h.invia({ t: "posa", gap: gap, n: vm(C).n }); }
  function avantiDa(nome, C) { var h = W.reteDi(nome); if (h) h.invia({ t: "avanti", n: vm(C).n }); }

  COPIONE.aggiungi("tl1", { nome: "Linea del tempo «⚡ Tutti insieme» nella Sala in 3: la stessa carta per tutti, fino alla fine", fai: async function () {
    var Z = await sala("La linea del tempo", ["Giulia", "Luca"]), C = Z.C, P = W.finestra("Paky"), G = W.finestra("Giulia");
    if (!await W.aspetta(function () { return giocTl(C).length === 3; }, 10000)) no("nella saletta non arrivano in 3");
    var et = "", val = "";
    await regola(P, /Tutti insieme/, async function (f) {
      var v = f.querySelector(".stepper .valore"); val = v && v.textContent;
      var ets = [].map.call(f.querySelectorAll(".etichetta"), function (e) { return e.textContent; }); et = ets.filter(function (x) { return /Carte/.test(x); })[0] || "";
      var meno = f.querySelector(".stepper button"); for (var i = 0; i < 8; i++) meno.click();
    });
    if (val !== "10") no("con «Tutti insieme» le carte non partono da 10 (" + val + ")");
    if (!/in tutto/.test(et)) no("l'etichetta delle carte dice «" + et + "»");
    if (!await W.aspetta(function () { return /Tutti insieme · 5 carte/.test(A.regoleDi(G)); }, 5000)) no("Giulia legge «" + A.regoleDi(G) + "»");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    var note = [], punti = {}, carte = 0, ultimaN = -1, ripasso = {};
    giocTl(C).forEach(function (g) { punti[g.id] = 0; });
    var fino = Date.now() + 300000;
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C);
      if (v.fase === "tutti" && v.n !== ultimaN) {
        ultimaN = v.n; carte++;
        if (!v.insieme) no("la foto non dice «insieme»");
        if (v.carte !== 5) no("le carte sono " + v.carte);
        // misure al primo giro (Giulia ha la carta da piazzare)
        if (carte === 1) {
          await W.aspetta(function () { return G.document.querySelector(".tl-slot"); }, 8000);
          var m1 = await misura(G, "Giulia", 360, 640) || await misura(G, "Giulia", 412, 915); rimetti(G, "Giulia");
          if (m1) no("Giulia mentre piazza: " + m1);
        }
        await W.aspetta(function () { return P.document.querySelector(".tl-slot"); }, 8000);
        if (carte === 3) {   // Paky non sceglie: resta a 0, si scopre allo scadere del tempo
          posaDa("Giulia", C, 0); posaDa("Luca", C, vm(C).linea.length);
          var t3 = Date.now();
          if (!await W.aspetta(function () { return vm(C).fase === "tEsito"; }, 35000)) no("allo scadere del tempo non si scopre");
          note.push("carta 3 senza Paky: scoperta dopo " + Math.round((Date.now() - t3) / 1000) + " s");
        } else {
          posaDa("Giulia", C, 0);
          await W.dorme(700);
          if (JSON.stringify(vm(C)).indexOf('"gap"') >= 0) no("nella foto c'è dove ha messo la carta qualcuno");
          if ((vm(C).hannoScelto || []).length !== 1) no("chi ha scelto: " + JSON.stringify(vm(C).hannoScelto));
          if (!await W.aspetta(function () { return /1 su 3 ha scelto/.test(T(W.finestra("Luca"))); }, 4000)) no("Luca non legge «1 su 3 ha scelto»");
          if (carte === 2) {   // Giulia ricarica dopo aver scelto
            await W.ricarica("Giulia"); G = W.finestra("Giulia");
            if (!await W.aspetta(function () { return /Hai già scelto/.test(T(W.finestra("Giulia"))); }, 15000)) no("Giulia dopo la ricarica non legge «Hai già scelto» («" + T(W.finestra("Giulia")).slice(0, 100) + "»)");
            G = W.finestra("Giulia"); note.push("Giulia ricarica: «Hai già scelto»");
          }
          posaDa("Luca", C, Math.floor(Math.random() * (vm(C).linea.length + 1)));
          await W.dorme(300);
          if (vm(C).fase !== "tutti") no("si scopre prima che abbia scelto Paky");
          await hostPiazza(P);
          var t1 = Date.now();
          if (!await W.aspetta(function () { return vm(C).fase === "tEsito"; }, 4000)) no("hanno scelto tutti ma non si scopre");
          if (Date.now() - t1 > 1500) note.push("scoperta lenta (" + (Date.now() - t1) + " ms)");
        }
        // il risultato
        var e = vm(C).esitoT || {}, ris = e.risultati || [];
        var veloci = ris.filter(function (r) { return r.veloce; });
        if (veloci.length > 1 || veloci.some(function (r) { return !r.giusto; })) no("il più veloce è sbagliato: " + JSON.stringify(ris));
        var molt = e.doppio ? 2 : 1;
        ris.forEach(function (r) {
          var att = r.giusto ? (100 + (r.veloce ? 50 : 0)) * molt : 0;
          if (r.delta !== att) no("carta " + carte + ": " + r.id + " prende " + r.delta + " invece di " + att);
          if (!r.scelto && r.delta) no("chi non ha scelto prende punti");
          punti[r.id] += r.delta;
        });
        if (carte === 3 && ris.filter(function (r) { return r.id === "host"; })[0].scelto) no("Paky risulta aver scelto");
        if (carte === 5 && !e.doppio) no("l'ultima carta non vale doppio");
        if (carte < 5 && e.doppio) no("la carta " + carte + " vale doppio");
        if (vm(C).linea.filter(function (x) { return x.titolo === e.titolo; }).length !== 1) no("la carta non è entrata nella linea");
        // misure del risultato su Giulia
        if (carte === 1) {
          if (!await W.aspetta(function () { return /Avanti/.test(T(G)); }, 15000)) no("Giulia non ha «⏩ Avanti»");
          var m2 = await misura(G, "Giulia", 360, 640, ".tl-esito") || await misura(G, "Giulia", 412, 915, ".tl-esito"); rimetti(G, "Giulia");
          if (m2) no("Giulia sul risultato: " + m2);
        }
        // «⏩ Avanti»: Paky da solo non basta (1 su 3), con Giulia sì (2 su 3)
        if (vm(C).fase === "tEsito" && carte < 5) {
          if (!await W.aspetta(function () { return W.clicca(P, /Avanti/, "button") || vm(C).n !== ultimaN; }, 15000)) no("Paky non trova «⏩ Avanti»");
          await W.dorme(1500);
          if (vm(C).fase !== "tEsito" && vm(C).n === ultimaN) no("con 1 su 3 si è già andati avanti");
          if (!await W.aspetta(function () { return /Pronto · 1 su 3/.test(T(P)); }, 3000)) note.push("Paky non legge «Pronto · 1 su 3» («" + T(P).slice(-80) + "»)");
          avantiDa("Giulia", C);
          var t2 = Date.now();
          if (!await W.aspetta(function () { return vm(C).n !== ultimaN || vm(C).fase === "fine"; }, 3000)) no("con 2 su 3 non si va avanti");
          ripasso[carte] = Date.now() - t2;
        } else if (carte >= 5) avantiDa("Giulia", C), avantiDa("Luca", C);
      }
      await W.dorme(250);
    }
    if (vm(C).fase !== "fine") no("non finisce (fase " + vm(C).fase + ", carta " + carte + ") · " + note.join(" · "));
    if (carte !== 5) no("le carte giocate sono " + carte);
    var cl = vm(C).classifica || [];
    cl.forEach(function (r) { if (r.punti !== punti[r.id]) no(r.nome + " ha " + r.punti + " punti invece di " + punti[r.id]); });
    senzaErrori();
    return "5 carte tutti insieme; " + note.join("; ") + "; Avanti a maggioranza in " + Object.keys(ripasso).map(function (k) { return ripasso[k] + " ms"; }).join(", ") +
      "; classifica " + cl.map(function (r) { return r.nome + " " + r.punti; }).join(", ") + "; 360x640 e 412x915 senza scorrere";
  } });

  // la stanza fuori dalla Sala, con una regola scelta prima di aprirla
  async function apriStanzaCon(P, nomeGioco, chip) {
    var tess = await W.aspetta(function () { return A.tessera(P, nomeGioco); }, 5000); if (!tess) no("non trovo " + nomeGioco);
    tess.click(); await W.dorme(250);
    if (!W.clicca(P, /apro io/)) no("non trovo «Online: apro io la stanza»");
    await W.dorme(300);
    if (chip && !W.clicca(P, chip, ".modo-chip")) no("prima di aprire la stanza non trovo " + chip);
    if (!W.clicca(P, /Apri la stanza/)) no("non trovo «Apri la stanza»");
    var cod = await W.aspetta(function () { var b = P.document.querySelector(".sl-cod b"); return b && /^[A-Z0-9]{4}$/.test(b.textContent) ? b.textContent : null; }, 5000);
    if (!cod) no("la stanza non ha il codice");
    return cod;
  }

  COPIONE.aggiungi("tl2", { nome: "Linea del tempo «⚡ Tutti insieme»: l'host ricarica a metà carta, la carta si rigioca", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), C = await apriStanzaCon(P, "La linea del tempo", /Tutti insieme/);
    await W.apriTel("Giulia", { hash: "gioco=timeline&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return giocTl(C).length === 2; }, 8000)) no("Giulia non entra");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "tutti"; }, 40000)) no("la prima carta non arriva");
    var tit = vm(C).carta.titolo;
    posaDa("Giulia", C, 0); await W.dorme(600);
    P = await W.ricarica("Paky");
    if (!await W.aspetta(function () { return vm(C).fase === "ripresa"; }, 12000)) no("dopo la ricarica dell'host niente «Partita ripresa» (fase " + vm(C).fase + ")");
    if (!await W.aspetta(function () { return vm(C).fase === "tutti"; }, 12000)) no("dopo la ripresa la carta non riparte");
    var v = vm(C);
    if (v.carta.titolo !== tit) no("dopo la ripresa la carta è un'altra");
    if (v.giro !== 1) no("dopo la ripresa la carta è la numero " + v.giro);
    if ((v.hannoScelto || []).length) no("dopo la ripresa le scelte non sono azzerate");
    var fino = Date.now() + 200000, n0 = -1;
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var x = vm(C);
      if (x.fase === "tutti" && x.n !== n0) { n0 = x.n; posaDa("Giulia", C, 0); await hostPiazza(W.finestra("Paky")); }
      if (x.fase === "tEsito") { avantiDa("Giulia", C); W.clicca(W.finestra("Paky"), /Avanti/); }
      await W.dorme(500);
    }
    if (vm(C).fase !== "fine") no("non finisce (fase " + vm(C).fase + ")");
    senzaErrori();
    return "ripresa con la stessa carta («" + tit.slice(0, 40) + "») e scelte azzerate; finita: " + (vm(C).classifica || []).map(function (r) { return r.nome + " " + r.punti; }).join(", ");
  } });

  COPIONE.aggiungi("tl3", { nome: "Linea del tempo online a turno (com'era): un giro intero col voto", fai: async function () {
    var Z = await sala("La linea del tempo", ["Giulia"]), C = Z.C, P = W.finestra("Paky");
    if (!await W.aspetta(function () { return giocTl(C).length === 2; }, 10000)) no("Giulia non entra");
    if (/Tutti insieme/.test(A.regoleDi(W.finestra("Giulia")))) no("«Tutti insieme» acceso da solo");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    var turni = 0, k0 = "", fino = Date.now() + 240000;
    while (Date.now() < fino && turni < 2) {
      var v = vm(C), k = v.fase + "|" + v.n;
      if (v.insieme) no("la foto dice «insieme»");
      if (k !== k0) {
        k0 = k;
        if (v.fase === "turno") { if (v.turnoId === "host") await hostPiazza(P); else { var h = W.reteDi("Giulia"); h.invia({ t: "scelta", gap: 0, n: v.n }); } }
        if (v.fase === "votazione") { if (v.turnoId === "host") W.reteDi("Giulia").invia({ t: "voto", d: true, n: v.n }); else W.clicca(P, /Giusto/); }
        if (v.fase === "esito") { turni++; await W.dorme(6000); if (v.turnoId === "host") W.clicca(P, /Avanti/); else W.reteDi("Giulia").invia({ t: "avanti", n: v.n }); }
      }
      await W.dorme(400);
    }
    if (turni < 2) no("a turno non si arriva a 2 turni (fase " + vm(C).fase + ")");
    senzaErrori();
    return "a turno: 2 turni con voto e risultato, come prima";
  } });

  // =================== SCALINATA ===================
  async function scalaFinoAllaFine(C, umani, host, ms) {
    var fino = Date.now() + (ms || 200000), round = 0, rr = -1;
    while (Date.now() < fino) {
      var v = vm(C);
      if (v.fase === "fine") return round;
      if (v.fase === "scelta" && v.nRound !== rr) {
        rr = v.nRound; round++;
        var sc = v.sc || [1, 3, 5];
        umani.forEach(function (n) { var w = W.finestra(n); if (w) W.clicca(w, new RegExp("^\\s*" + caso(sc) + "\\s*gradin"), ".sc-tasto"); });
      }
      if (v.fase === "rivela") W.clicca(W.finestra(host), /Prossimo round|Vedi il podio/);
      await W.dorme(400);
    }
    return -1;
  }
  // la scala di un telefono: corsie e avatar dentro lo schermo e senza sovrapporsi, tasti visibili
  async function misuraScala(w, nome, larg, alt, nTasti) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(600);
    var tag = larg + "x" + alt + ": ";
    if (d.documentElement.scrollHeight > alt + 1 || d.documentElement.scrollWidth > larg + 1) return tag + "la pagina scorre";
    var cors = [].map.call(d.querySelectorAll(".sc-corsia"), function (c) { return c.getBoundingClientRect(); });
    for (var i = 0; i < cors.length; i++) if (cors[i].left < 0 || cors[i].right > larg + 1 || cors[i].width < 28) return tag + "la corsia " + (i + 1) + " non sta nello schermo (" + Math.round(cors[i].left) + "-" + Math.round(cors[i].right) + ")";
    var avs = [].map.call(d.querySelectorAll(".sc-av"), function (a) { return a.getBoundingClientRect(); });
    for (var j = 0; j + 1 < avs.length; j++) if (avs[j].right > avs[j + 1].left + 2 && Math.abs(avs[j].top - avs[j + 1].top) < avs[j].height) return tag + "gli avatar " + (j + 1) + " e " + (j + 2) + " si coprono";
    var tasti = d.querySelectorAll(".sc-tasto");
    if (nTasti != null && tasti.length !== nTasti) return tag + "i tasti sono " + tasti.length + " invece di " + nTasti;
    for (var k = 0; k < tasti.length; k++) { var r = tasti[k].getBoundingClientRect(); if (r.left < 0 || r.right > larg + 1 || r.bottom > alt + 1) return tag + "il tasto " + tasti[k].innerText.replace(/\s+/g, " ") + " esce dallo schermo"; }
    var nomi = [].filter.call(d.querySelectorAll(".sc-nome"), function (x) { return x.scrollWidth > x.clientWidth + 1 && x.textContent.length < 4; });
    if (nomi.length) return tag + "nomi corti tagliati";
    return "";
  }

  COPIONE.aggiungi("sc1", { nome: "Scalinata nella Sala in 6: tutti sulla scala, numeri da 1 a 5, partita intera, poi «Piccola»", fai: async function () {
    var amici = ["Giulia", "Luca", "Marco", "Bea", "Nino"];
    var Z = await sala("La Scalinata", amici), C = Z.C, P = W.finestra("Paky"), G = W.finestra("Giulia");
    if (!await W.aspetta(function () { return (vm(C).posti || []).length === 6; }, 15000)) no("sulla scala in saletta non sono in 6 (" + (vm(C).posti || []).length + ", guardano " + (vm(C).guarda || []).length + ")");
    if (!await W.aspetta(function () { return /Scala grande: in 6 sulla scala, si sceglie da 1 a 5/.test(T(G)); }, 5000)) no("in saletta Giulia non legge «Scala grande…»");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "scelta"; }, 8000)) no("la salita non comincia");
    var v = vm(C);
    if ((v.posti || []).some(function (p) { return p.bot; })) no("ci sono dei Bot sulla scala");
    if ((v.sc || []).join() !== "1,2,3,4,5") no("i numeri sono " + JSON.stringify(v.sc));
    if (!await W.aspetta(function () { return G.document.querySelectorAll(".sc-tasto").length === 5; }, 5000)) no("Giulia non ha 5 tasti");
    var m = await misuraScala(G, "Giulia", 360, 640, 5) || await misuraScala(G, "Giulia", 412, 915, 5); rimetti(G, "Giulia");
    if (m) no("la scala di Giulia: " + m);
    var r = await scalaFinoAllaFine(C, amici.concat(["Paky"]), "Paky", 240000);
    if (r < 0) no("la salita non finisce (fase " + vm(C).fase + ", round " + vm(C).nRound + ")");
    var cl = (vm(C).posti || []).map(function (p) { return p.nome + " " + p.passi; }).join(", ");
    // la Rivincita riporta in saletta; poi «Piccola»: 4 sulla scala, 2 guardano
    await W.dorme(1500);
    if (!await W.aspetta(function () { return W.clicca(P, /Rivincita|Nuova partita/); }, 6000)) no("a fine partita Paky non trova «Rivincita»");
    if (!await W.aspetta(function () { return vm(C).fase === "lobby" || vm(C).fase === "scelta"; }, 12000)) no("la rivincita non riporta in saletta");
    if (vm(C).fase === "lobby") {
      await regola(P, /Piccola/);
      if (!await W.aspetta(function () { return (vm(C).posti || []).length === 4 && (vm(C).guarda || []).length === 2; }, 5000)) no("con la scala piccola: " + (vm(C).posti || []).length + " sulla scala e " + (vm(C).guarda || []).length + " guardano");
    }
    senzaErrori();
    return "in 6 sulla scala con 1-5, " + r + " round (" + cl + "); 360x640 e 412x915 ok; rivincita e «Piccola»: 4 salgono, 2 guardano";
  } });

  COPIONE.aggiungi("sc2", { nome: "Scalinata sullo stesso telefono: in 7 (1-6), da solo con «Grande» (8 corsie), da solo normale", fai: async function () {
    var esiti = [];
    async function gioca(P, attesiCorsie, attesiTasti) {
      if (!await W.aspetta(function () { return P.document.querySelectorAll(".sc-corsia").length; }, 8000)) no("la scala non si apre («" + T(P).slice(0, 80) + "»)");
      var nc = P.document.querySelectorAll(".sc-corsia").length;
      if (nc !== attesiCorsie) no("le corsie sono " + nc + " invece di " + attesiCorsie);
      var fino = Date.now() + 240000, misurato = false, tasti = -1, round = 0;
      while (Date.now() < fino && !/Fine partita/.test(T(P))) {
        var bt = P.document.querySelectorAll(".sc-tasto");
        if (bt.length) {
          tasti = bt.length;
          if (!misurato) { misurato = true; var m = await misuraScala(P, "Paky", 360, 640, attesiTasti) || await misuraScala(P, "Paky", 412, 915, attesiTasti); rimetti(P, "Paky"); if (m) no(m); }
          caso([].slice.call(bt)).click(); round++;
        } else W.clicca(P, /Via!|Sono .* ▶|Passa il telefono|Prossimo round|Vedi il podio/);
        await W.dorme(250);
      }
      if (!/Fine partita/.test(T(P))) no("la partita non finisce («" + T(P).slice(-100) + "»)");
      if (tasti !== attesiTasti) no("i tasti erano " + tasti + " invece di " + attesiTasti);
      return round;
    }
    var P = await W.apriTel("Paky", { x: 0 });
    var sette = ["Paky", "Giulia", "Luca", "Marco", "Bea", "Nino", "Sara"];
    await localeDa(P, "La Scalinata", sette);
    var r1 = await gioca(P, 7, 6);
    esiti.push("in 7: 7 corsie, tasti 1-6, " + r1 + " scelte fino al podio");
    P = await W.ricarica("Paky");
    await localeDa(P, "La Scalinata", ["Paky"], /Grande/);
    var r2 = await gioca(P, 8, 6);
    esiti.push("da solo con «Grande»: 8 corsie, 7 Bot, tasti 1-6, " + r2 + " round");
    P = await W.ricarica("Paky");
    await localeDa(P, "La Scalinata", ["Paky"]);
    var r3 = await gioca(P, 4, 3);
    esiti.push("da solo normale: 4 corsie, 1-3-5, " + r3 + " round");
    senzaErrori();
    return esiti.join("; ") + "; 360x640 e 412x915 ok";
  } });
})();

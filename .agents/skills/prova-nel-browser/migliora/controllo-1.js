// PROVE DEL CONTROLLO dei miglioramenti (Balla, Patata, Linea del tempo, Scalinata, Poker, Horto Muso):
// i casi che le prove degli autori non toccavano (telefono spento, chi arriva tardi, la Sala tra una corsa e l'altra).
// Uso (dopo copione-prova.js e i file migliora/balla.js e migliora/casino-horto.js, che preparano le spie):
//   await COPIONE.carica("migliora/controllo-1.js"); window.__run = COPIONE.prova("ck1")
//
// ck1: Poker online, Torneo della serata in 3: Luca spegne il telefono e non torna; Paky e Giulia vanno all-in finché
//      una delle due resta senza fiches: il torneo deve finire da solo (non restare fermo ad aspettare Luca).
// ck2: Horto Muso nella Sala, Gran Premio in 3; Giulia entra nella Sala durante la prima corsa. Tra una corsa e l'altra
//      nessuno vede i tasti di fine del core e la Classifica della serata non si muove; alla fine sì, una volta sola.
// ck3: Patata online (stanza) con la miccia segreta: chi ha la bomba spegne il telefono e non torna; Sara arriva a partita
//      cominciata e guarda; la partita va avanti fino alla fine, la durata non è mai nella foto prima dello scoppio.
// ck4: Linea del tempo «⚡ Tutti insieme» (stanza, 5 carte): Luca spegne a metà carta (la carta si scopre lo stesso a
//      tempo scaduto), Sara arriva e guarda, Luca riaccende e gioca la carta dopo; fino alla fine.
// ck5: Scalinata online (stanza) in 5: tutti sulla scala con 1-5; Luca spegne (sceglie il Bot per lui), Sara arriva e
//      guarda; fino al podio; il telefono di chi guarda a 360x640.
// ck6: Balla online (stanza) in 3, solo notizie: Giulia arriva a partita cominciata (non gioca, niente errori), fino alla fine.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T, vm = A.vm;

  function senzaErrori(cosa) { var e = W.erroriTel(); if (e.length) no((cosa ? cosa + ": " : "") + "errori: " + e.slice(0, 3).join(" | ")); }
  function caso(a) { return a[Math.floor(Math.random() * a.length)]; }
  async function regola(P, re, poi) {   // l'host cambia una regola dal ⚙️ della saletta (poi: prima di «Fatto»)
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/, ".sl-regole, button"); }, 5000)) no("non trovo ⚙️ Regole");
    await W.dorme(300);
    if (re && !W.clicca(P, re, ".sl-foglio .modo-chip")) no("nel ⚙️ non trovo la regola " + re);
    await W.dorme(150);
    if (poi) await poi(P.document.querySelector(".sl-foglio"));
    W.clicca(P, /Fatto|Ok/, ".sl-foglio button"); await W.dorme(500);
  }
  async function stanza(P, nomeGioco, idGioco, amici, opz) {
    var C = await W.apriStanza(P, nomeGioco);
    for (var i = 0; i < amici.length; i++) await W.apriTel(amici[i], Object.assign({ hash: "gioco=" + idGioco + "&stanza=" + C, x: 185 * (i + 1) }, opz || {}));
    return C;
  }
  function nomeDiId(lista, id) { var p = (lista || []).filter(function (x) { return x.id === id; })[0]; return p ? p.nome : null; }
  // la pagina di un telefono sta nello schermo (niente scorrimento)
  async function misura(w, nome, larg, alt) {
    var f = document.getElementById("tel-" + nome), d = w.document;
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(700);
    var e = "";
    if (d.documentElement.scrollHeight > alt + 1) e = "la pagina scorre (" + d.documentElement.scrollHeight + ")";
    else if (d.documentElement.scrollWidth > larg + 1) e = "la pagina scorre di lato (" + d.documentElement.scrollWidth + ")";
    f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize"));
    return e ? nome + " a " + larg + "x" + alt + ": " + e : "";
  }

  // =================== ck1: Poker, torneo e telefono spento ===================
  function pkIo(v, id) { return (v.players || []).filter(function (p) { return p.id === id; })[0] || null; }
  function pkMosse(v, id) { var io = pkIo(v, id); if (!io) return null; var serve = Math.max(0, v.daChiamare - io.inGiro); return { passa: serve === 0, max: io.inGiro + io.stack, punta: io.inGiro + io.stack > v.daChiamare && !io.chiuso }; }
  function pkOsp(nome, v, tipo, tot) { var h = W.reteDi(nome); if (h) h.invia({ t: "azione", tipo: tipo, tot: tot || 0, n: v.n, st: v.stato, dc: v.daChiamare }); }
  async function pkHost(P, tipo) {
    var d = P.document;
    if (tipo === "passa") { var p = d.querySelector(".pk-azioni .pk-btn.passa"); if (p) p.click(); return !!p; }
    var b = d.querySelector(".pk-azioni .pk-btn.punta");
    if (!b) { var c = d.querySelector(".pk-azioni .pk-btn.passa"); if (c) c.click(); return !!c; }
    if (/^All-in/.test(b.textContent)) { b.click(); return true; }
    b.click(); await W.dorme(700);
    W.clicca(P, /^All-in$/, ".pk-azioni .pk-btn.piccolo"); await W.dorme(100);
    var ok = d.querySelector(".pk-azioni .pk-btn.ok"); if (ok) ok.click();
    return !!ok;
  }
  async function pkMano(C, nomi, tipo, ms) {
    var fino = Date.now() + (ms || 30000), n0 = vm(C).n, fatto = {};
    while (Date.now() < fino) {
      var v = vm(C);
      if (v.fase !== "gioco" || v.stato === "finemano" || v.n !== n0 || v.stato === "attesa") return v;
      var k = v.n + "|" + v.stato + "|" + v.turno + "|" + v.daChiamare;
      if (v.turno && !fatto[k]) {
        fatto[k] = 1;
        var m = pkMosse(v, v.turno);
        if (v.turno === "host") await pkHost(W.finestra("Paky"), tipo);
        else if (nomi[v.turno] && m) {
          if (tipo === "allin" && m.punta) pkOsp(nomi[v.turno], v, "punta", m.max); else pkOsp(nomi[v.turno], v, m.passa ? "passa" : "chiama");
        } else delete fatto[k];
      }
      await W.dorme(250);
    }
    return vm(C);
  }
  COPIONE.aggiungi("ck1", { nome: "Poker, Torneo della serata: uno spegne il telefono e non torna, il torneo finisce lo stesso", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, ch: true });
    var C = await stanza(P, "Poker", "poker", ["Giulia", "Luca"], { ch: true }), note = [];
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 3; }, 10000)) no("al tavolo non arrivano in 3");
    await regola(P, /Fiches uguali/);
    if (!await W.aspetta(function () { return vm(C).torneo; }, 4000)) no("il torneo non si accende");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 4000)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).n >= 1; }, 6000)) no("la partita non comincia");
    var gid = A.mioId("Giulia"), lid = A.mioId("Luca"), nomi = {}; nomi[gid] = "Giulia"; nomi[lid] = "Luca";
    await pkMano(C, nomi, "passa", 40000);
    W.spegni("Luca");
    note.push("Luca spento alla mano " + vm(C).n);
    if (!await W.aspetta(function () { var p = pkIo(vm(C), lid); return !p || p.via || (vm(C).players || []).every(function (x) { return x.id !== lid; }); }, 40000)) no("dopo 40 s Luca risulta ancora al tavolo");
    delete nomi[lid];
    var fino = Date.now() + 150000, ferma = 0;
    while (Date.now() < fino && vm(C).fase === "gioco") {
      var v = await pkMano(C, nomi, "allin", 30000);
      if (v.stato === "attesa") { ferma++; if (ferma > 40) break; } else ferma = 0;
      await W.dorme(300);
    }
    var v2 = vm(C);
    if (v2.fase !== "fine") no("il torneo resta fermo (fase " + v2.fase + ", stato " + v2.stato + ", fiches " + (v2.players || []).map(function (p) { return p.nome + ":" + p.stack + (p.via ? "(via)" : "") + (p.elim ? "(fuori " + p.elim + ")" : ""); }).join(" ") + ")");
    var cl = (v2.classifica || []).map(function (r) { return r.pos + "° " + r.nome + " " + r.punti + (r.fuori ? " fuori" : ""); });
    if (cl.length !== 3) no("la classifica del torneo non ha 3 righe: " + JSON.stringify(v2.classifica));
    if (!P.__ris || P.__ris.length !== 1) no("t.risultato non arriva una volta (" + JSON.stringify(P.__ris) + ")");
    senzaErrori();
    return note.concat(["classifica: " + cl.join(", ")]).join(" · ");
  } });

  // =================== ck2: Horto Muso, Gran Premio nella Sala ===================
  function frusta(w) { var b = w.document.querySelector(".ho-frusta"); if (b && !b.disabled) b.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true })); }
  async function corri(P, cond, ms, chi) {
    var fino = Date.now() + (ms || 70000), n = 0;
    while (Date.now() < fino) {
      if (cond()) return true;
      if (n++ % 2 === 0) { frusta(P); (chi || []).forEach(function (x) { var h = W.reteDi(x); if (h) h.invia({ t: "frusta" }); }); }
      await W.dorme(350);
    }
    return cond();
  }
  function tastiFineVisti(nomi) {
    return nomi.filter(function (n) { var w = W.finestra(n), b = w && w.document.querySelector(".fine-tasti"); return b && b.offsetParent && [].some.call(b.querySelectorAll("button"), function (x) { return !x.hidden; }); });
  }
  COPIONE.aggiungi("ck2", { nome: "Horto Muso nella Sala col Gran Premio: tra le corse niente fine del core, chi arriva tardi, Classifica della serata una volta", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true, ch: true }), S = await A.apriSalaNuova("Paky"), note = [];
    await W.apriTel("Luca", { hash: "sala=" + S, x: 185, salaSempre: true });
    await W.apriTel("Sara", { hash: "sala=" + S, x: 370, salaSempre: true });
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === 3; }, 10000)) no("nella Sala non arrivano in 3");
    var C = await A.lanciaDallaSala("Paky", S, "Horto Muso");
    await regola(P, /3 corse a punti/);
    if (!await W.aspetta(function () { return /Gran Premio/.test(A.regoleDi(W.finestra("Luca"))); }, 5000)) no("la riga «Si gioca così» di Luca non dice del Gran Premio («" + A.regoleDi(W.finestra("Luca")) + "»)");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("non trovo «Comincia la corsa»");
    if (!await W.aspetta(function () { return /corsa 1 di 3/.test(T(W.finestra("Luca"))); }, 15000)) no("Luca non vede «corsa 1 di 3»");
    // Giulia arriva nella Sala a corsa cominciata
    await W.apriTel("Giulia", { hash: "sala=" + S, x: 555, salaSempre: true });
    var tutti = ["Paky", "Luca", "Sara"], chi = ["Luca", "Sara"];
    for (var corsa = 1; corsa <= 2; corsa++) {
      if (!await corri(P, function () { return tutti.every(function (n) { return W.finestra(n).document.querySelector(".ho-gp-lista"); }); }, 80000, chi)) no("dopo la corsa " + corsa + " non tutti vedono la classifica a punti");
      await W.dorme(1200);
      var tf = tastiFineVisti(tutti.concat(["Giulia"]));
      if (tf.length) no("dopo la corsa " + corsa + " si vedono i tasti di fine del core su: " + tf.join(", "));
      var tor = vm(S).torneo;
      if (tor && tor.n) no("dopo la corsa " + corsa + " la Classifica della serata è già cambiata (" + JSON.stringify(tor) + ")");
      if (P.__ris && P.__ris.length) no("t.risultato arriva dopo la corsa " + corsa);
      note.push("dopo la corsa " + corsa + " Giulia vede: «" + T(W.finestra("Giulia")).replace(/\s+/g, " ").slice(0, 60) + "»");
      W.clicca(W.finestra("Luca"), /Avanti/); await W.dorme(400); W.clicca(W.finestra("Sara"), /Avanti/);
      if (!await W.aspetta(function () { return new RegExp("corsa " + (corsa + 1) + " di 3|Ultima corsa").test(T(P)) && P.document.querySelector(".ho-scena"); }, 8000)) no("la corsa " + (corsa + 1) + " non parte con 2 «Avanti» su 3");
      var v = vm(C) || {}; void v;
    }
    if (!await corri(P, function () { return tutti.every(function (n) { return W.finestra(n).document.querySelector(".ho-gp-podio"); }); }, 80000, chi)) no("dopo la terza corsa non tutti vedono il podio");
    if (!await W.aspetta(function () { return tastiFineVisti(["Luca"]).length; }, 6000)) no("sul podio di Luca non ci sono i tasti di fine del core");
    if (!await W.aspetta(function () { var t = vm(S).torneo; return t && t.n === 1; }, 6000)) no("la Classifica della serata non conta il Gran Premio una volta (" + JSON.stringify(vm(S).torneo) + ")");
    if (!P.__ris || P.__ris.length !== 1) no("t.risultato non è arrivato una volta (" + JSON.stringify(P.__ris) + ")");
    note.push("serata: " + JSON.stringify(vm(S).torneo.punti) + ", Giulia alla fine: «" + T(W.finestra("Giulia")).replace(/\s+/g, " ").slice(0, 60) + "»");
    senzaErrori();
    return note.join(" · ");
  } });

  // =================== ck3: Patata, miccia segreta, telefono spento e chi arriva tardi ===================
  function passaBomba(w) { var L = w && w.document.querySelector(".st-leggio.tocca"); if (!L) return false; L.click(); return true; }
  COPIONE.aggiungi("ck3", { nome: "Patata online con la miccia segreta: chi ha la bomba spegne il telefono, chi arriva tardi guarda", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    var C = await stanza(P, "La Patata Bollente", "patata", ["Giulia", "Luca"]), note = [];
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 3; }, 10000)) no("nella saletta non arrivano in 3");
    await regola(P, /Segreta/);
    if (!await W.aspetta(function () { return W.clicca(P, /Continua|Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Continua»");
    if (!await W.aspetta(function () { W.clicca(P, /Via!/); return vm(C).fase === "gioco" && vm(C).segreta; }, 40000)) no("la partita non parte con la miccia segreta");
    var spento = null, arrivata = false, fino = Date.now() + 260000, boom = [];
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C);
      if (JSON.stringify(v).match(/"miccia":\s*\d/) && v.fase !== "esplosione" && v.fase !== "fine") no("nella foto c'è la durata della miccia (fase " + v.fase + ")");
      if (v.fase === "voto") W.clicca(P, /Via!/);
      if (v.fase === "gioco" && v.holder) {
        var nh = nomeDiId(v.players, v.holder);
        if (!spento && nh !== "Paky" && Date.now() - (v._t || 0) >= 0) {
          // chi ha la bomba spegne il telefono (e non torna)
          spento = nh; W.spegni(nh); note.push(nh + " spegne con la bomba in mano");
          var t0 = Date.now();
          if (!await W.aspetta(function () { var x = vm(C); return x.fase !== "gioco" || x.holder !== v.holder; }, 70000)) no("la bomba resta a " + nh + " (spento) per più di 70 s");
          note.push("dopo " + Math.round((Date.now() - t0) / 1000) + " s la bomba non è più sua (fase " + vm(C).fase + ")");
        } else if (nh !== spento) passaBomba(W.finestra(nh));
      }
      if (v.fase === "esplosione" && v.boom && boom.indexOf(v.round + "|" + v.boom.id) < 0) boom.push(v.round + "|" + v.boom.id);
      if (spento && !arrivata) {
        arrivata = true;
        var S2 = await W.apriTel("Sara", { hash: "gioco=patata&stanza=" + C, x: 555 });
        if (!await W.aspetta(function () { return T(S2).length > 20; }, 8000)) no("Sara, arrivata tardi, ha lo schermo vuoto");
        await W.dorme(2500);
        if ((vm(C).players || []).some(function (p) { return p.nome === "Sara" && !p.eliminato && vm(C).fase === "gioco"; })) note.push("(Sara è tra chi gioca)");
        note.push("Sara arrivata tardi vede: «" + T(S2).replace(/\s+/g, " ").slice(0, 70) + "»");
      }
      await W.dorme(1300);
    }
    if (vm(C).fase !== "fine") no("la partita non finisce (fase " + vm(C).fase + ")");
    note.push("scoppi " + boom.length + ", vince " + ((vm(C).vincitore || {}).nome || "?"));
    senzaErrori();
    return note.join(" · ");
  } });

  // =================== ck4: Linea del tempo, tutti insieme, telefono spento e chi arriva ===================
  async function hostPiazza(P) {
    var s = await W.aspetta(function () { return P.document.querySelector(".tl-slot"); }, 4000); if (!s) return false;
    s.click(); await W.dorme(150);
    var c = P.document.querySelector(".tl-conferma"); if (c && !c.disabled) { c.click(); return true; }
    return false;
  }
  function posaDa(nome, C, gap) { var h = W.reteDi(nome); if (h) h.invia({ t: "posa", gap: gap, n: vm(C).n }); }
  function avantiDa(nome, C) { var h = W.reteDi(nome); if (h) h.invia({ t: "avanti", n: vm(C).n }); }
  COPIONE.aggiungi("ck4", { nome: "Linea del tempo «Tutti insieme»: uno spegne a metà carta, chi arriva guarda, chi riaccende gioca", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    var C = await stanza(P, "La linea del tempo", "timeline", ["Giulia", "Luca"]), note = [];
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 10000)) no("nella saletta non arrivano in 3");
    await regola(P, /Tutti insieme/, async function (f) {
      for (var i = 0; i < 6; i++) { var m = [].find.call(f.querySelectorAll(".stepper button"), function (b) { return b.textContent === "−"; }); if (m) m.click(); await W.dorme(60); }
    });
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 6000)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "tutti"; }, 45000)) no("non parte la prima carta (fase " + vm(C).fase + ")");
    if (vm(C).carte !== 5) note.push("(carte " + vm(C).carte + ")");
    var lid = A.mioId("Luca"), fatto = {}, fino = Date.now() + 300000, spentoN = 0, riacceso = false, sara = null, lucaDopo = false;
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), k = v.fase + "|" + v.n;
      if (v.fase === "tutti" && !fatto[k]) {
        fatto[k] = 1;
        var gap = Math.floor(Math.random() * ((v.linea || []).length + 1));
        await W.dorme(600);
        await hostPiazza(P); posaDa("Giulia", C, gap);
        if (v.giro === 2 && !spentoN) { W.spegni("Luca"); spentoN = v.n; note.push("Luca spento alla carta 2"); }
        else if (!(spentoN && !riacceso)) { posaDa("Luca", C, gap); if (riacceso) lucaDopo = true; }
        if (v.giro === 2) {
          var t0 = Date.now();
          if (!await W.aspetta(function () { return vm(C).fase !== "tutti" || vm(C).n !== v.n; }, 45000)) no("con Luca spento la carta 2 non si scopre");
          note.push("carta 2 scoperta dopo " + Math.round((Date.now() - t0) / 1000) + " s");
          sara = await W.apriTel("Sara", { hash: "gioco=timeline&stanza=" + C, x: 555 });
          await W.dorme(3000);
          if ((vm(C).giocatori || []).some(function (g) { return g.nome === "Sara"; })) no("Sara, arrivata a partita cominciata, è tra chi gioca");
          if (!/guard/i.test(T(sara))) note.push("(Sara non legge «guardi»: «" + T(sara).replace(/\s+/g, " ").slice(0, 60) + "»)");
          W.riaccendi("Luca"); riacceso = true;
          await W.aspetta(function () { var g = (vm(C).giocatori || []).filter(function (x) { return x.id === lid; })[0]; return g && !g.via; }, 15000);
        }
      }
      if (v.fase === "tEsito" && !fatto[k]) { fatto[k] = 1; await W.dorme(1500); avantiDa("Giulia", C); W.clicca(P, /Avanti/, ".tl-barra button, button"); }
      await W.dorme(400);
    }
    if (vm(C).fase !== "fine") no("la partita non finisce (fase " + vm(C).fase + ", carta " + vm(C).giro + ")");
    if (!lucaDopo) no("Luca, riacceso, non ha più giocato");
    var g = vm(C).giocatori || [];
    note.push("punti: " + g.map(function (x) { return x.nome + " " + x.punti; }).join(", "));
    if (sara && !/fine|classifica|vince|punti/i.test(T(sara))) note.push("(Sara alla fine: «" + T(sara).replace(/\s+/g, " ").slice(0, 60) + "»)");
    senzaErrori();
    return note.join(" · ");
  } });

  // =================== ck5: Scalinata online in 5, telefono spento, chi arriva ===================
  COPIONE.aggiungi("ck5", { nome: "Scalinata online in 5: tutti sulla scala (1-5), uno spegne (sceglie il Bot), chi arriva guarda, a misura", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), amici = ["Giulia", "Luca", "Marco", "Bea"];
    var C = await stanza(P, "La Scalinata", "scalinata", amici), note = [];
    if (!await W.aspetta(function () { return (vm(C).posti || []).length === 5; }, 12000)) no("sulla scala in saletta non sono in 5 (" + (vm(C).posti || []).length + ")");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "scelta"; }, 8000)) no("non comincia");
    if ((vm(C).sc || []).join() !== "1,2,3,4,5") no("i numeri sono " + JSON.stringify(vm(C).sc));
    var umani = ["Paky"].concat(amici), spento = false, sara = null, fino = Date.now() + 240000, rv = {};
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C);
      if (v.fase === "scelta") umani.forEach(function (n) { if (n === "Luca" && spento) return; var w = W.finestra(n), bt = w && w.document.querySelectorAll(".sc-tasto"); if (bt && bt.length) caso([].slice.call(bt)).click(); });
      if (v.fase === "rivela" && !rv[v.nRound]) {
        rv[v.nRound] = 1;
        if (v.nRound === 1 && !spento) { spento = true; W.spegni("Luca"); note.push("Luca spento dopo il round 1"); }
        if (v.nRound === 2 && !sara) {
          sara = await W.apriTel("Sara", { hash: "gioco=scalinata&stanza=" + C, x: 740 });
          await W.dorme(2500);
          if ((vm(C).posti || []).some(function (p) { return p.nome === "Sara"; })) no("Sara, arrivata a partita cominciata, è sulla scala");
          var m = await misura(sara, "Sara", 360, 640); if (m) no(m);
          note.push("Sara guarda: «" + T(sara).replace(/\s+/g, " ").slice(0, 60) + "»");
        }
      }
      await W.dorme(400);
    }
    if (vm(C).fase !== "fine") no("la salita non finisce (fase " + vm(C).fase + ", round " + vm(C).nRound + ")");
    var L = (vm(C).posti || []).filter(function (p) { return p.nome === "Luca"; })[0];
    note.push("round " + vm(C).nRound + ", Luca (spento) è a " + (L ? L.passi : "?") + " gradini; podio: " + (vm(C).vincitori || []).join(", "));
    senzaErrori();
    return note.join(" · ");
  } });

  // =================== ck6: Balla, chi arriva tardi ===================
  function veloAperto(w) { return w && w.document.querySelector(".bc-velo.on:not(.via)"); }
  function scrivi(w, testo) { var v = veloAperto(w), ta = v && v.querySelector(".bc-penna"), ok = v && v.querySelector(".bc-ok"); if (!ta || !ok) return false; ta.value = testo; ta.dispatchEvent(new w.Event("input", { bubbles: true })); ok.click(); return true; }
  function vota(w) { var v = veloAperto(w); if (!v) return false; var b = [].filter.call(v.querySelectorAll(".bc-scelta"), function (x) { return !x.disabled; })[0]; if (!b) return false; b.click(); var ok = v.querySelector(".bc-ok"); if (!ok || ok.disabled) return false; ok.click(); return true; }
  COPIONE.aggiungi("ck6", { nome: "Balla online: chi arriva a partita cominciata non gioca e non rompe niente, fino alla fine", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, spiaBalla: true, prima: function (w) { w.__imp = { round: 3, amici: "no", ride: true }; } });
    var C = await stanza(P, "La Balla Colossale", "balla", ["Luca", "Sara"], { spiaBalla: true }), note = [];
    if (!await W.aspetta(function () { return (vm(C).players || []).length === 3; }, 10000)) no("nella saletta non arrivano in 3");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 8000)) no("non trovo «Comincia»");
    var G = null, fatti = {}, fino = Date.now() + 480000;
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C);
      if (v.fase === "scrittura" && !G) {
        G = await W.apriTel("Giulia", { hash: "gioco=balla&stanza=" + C, x: 555, spiaBalla: true });
        await W.dorme(2500);
        if ((vm(C).players || []).some(function (p) { return p.nome === "Giulia"; })) no("Giulia, arrivata a partita cominciata, è tra chi gioca");
        if (veloAperto(G)) no("Giulia, arrivata tardi, ha il foglio per scrivere aperto");
        note.push("Giulia arrivata tardi vede: «" + T(G).replace(/\s+/g, " ").slice(-70) + "»");
      }
      (v.players || []).forEach(function (p) {
        var w = W.finestra(p.nome), k = v.fase + "|" + v.giro + "|" + p.id; if (fatti[k] || !w) return;
        if (v.fase === "scrittura" && veloAperto(w)) fatti[k] = scrivi(w, "balla di " + p.nome + " " + v.giro);
        if (v.fase === "voto" && veloAperto(w)) fatti[k] = vota(w);
      });
      if (v.fase === "punti") W.clicca(P, /Avanti/, ".bc-avanti");
      await W.dorme(400);
    }
    if (vm(C).fase !== "fine") no("la partita non finisce (fase " + vm(C).fase + ")");
    note.push("classifica: " + (vm(C).classifica || []).map(function (r) { return r.pos + "° " + r.nome; }).join(", "));
    senzaErrori();
    return note.join(" · ");
  } });
})();

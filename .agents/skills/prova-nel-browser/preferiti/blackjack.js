// PROVE DEL BLACK JACK (1 nov 2026, chat «🃏 Black Jack»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/blackjack.js"); await COPIONE.prova("bjn1")
//
// bjn1 Le regole del casinò spiegate quando succedono, il banco: il banco ha 16 e il giocatore 17 → appena si gira la coperta,
//      sotto «🎩 Il banco tira sempre fino a 17» (MAI prima che si giri), il banco pesca e fa 21; se invece il giocatore sballa
//      il banco non pesca e la scritta non c'è. Nelle regole del gioco la riga del banco.
// bjn2 Gli assi divisi: A + A contro un 9, consiglio «Dividi», si divide → nuvoletta «Divido gli assi!», sotto le carte
//      «Assi divisi: una carta per asso, come al casinò» per tutte e due le mani, nessun tasto; un Asso con un K vale 21 (non BJ);
//      a 360x640 non scorre niente. Nelle regole la riga degli assi.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  var SEMI = { "♠": 0, "♥": 1, "♦": 2, "♣": 3 }, RANGO = { A: 1, J: 11, Q: 12, K: 13 };
  // "10♠" → { v: 10, s: 0 }
  function carta(x) { var s = x.slice(-1), r = x.slice(0, -1); return { v: RANGO[r] || +r, s: SEMI[s] }; }
  // il mazzo truccato: le prime carte sono queste (nell'ordine in cui escono), poi il resto mescolato come sempre.
  // Ordine della distribuzione: giocatori, banco (scoperta), giocatori, banco (coperta), poi le carte chieste.
  function trucca(w, lista) {
    w.__mazzoBJ = lista.map(carta);
    if (w.__BJ.__truccato) return;
    var vero = w.__BJ.creaMotore; w.__BJ.__truccato = true;
    w.__BJ.creaMotore = function (nomi, mischia, f, o) {
      var m = function (carte) {
        var r = (mischia || function (a) { return a.slice(); })(carte), testa = [];
        (w.__mazzoBJ || []).forEach(function (c) { var k = r.findIndex(function (y) { return y.v === c.v && y.s === c.s; }); if (k >= 0) testa.push(r.splice(k, 1)[0]); });
        w.__mazzoBJ = null;
        return testa.concat(r);
      };
      return vero.call(this, nomi, m, f, o);
    };
  }
  COPIONE.aiuti.bjTrucca = trucca;
  function q(w, s) { return w.document.querySelector(s); }
  function hero(w) { var h = q(w, ".bj-hero"); return h ? h.innerText.replace(/\s+/g, " ").trim() : ""; }
  async function regoleBJ() {
    var src = await (await fetch("/js/games/blackjack.js?" + Date.now())).text(), l = {};
    var finto = { registra: function (x) { l[x.id] = x; }, bot: null };
    new Function("SG", "window", src)(finto, { SGOmino: null, SGNube: null, __BJ: null });
    return (l.blackjack && l.blackjack.regole || []).join(" ");
  }
  // apre il Black Jack sullo stesso telefono (un giocatore: il profilo) col mazzo truccato; salta la presentazione
  async function tavolo(nome, mazzo) {
    var P = await W.apriTel(nome, { x: 0, prima: function (w) { trucca(w, mazzo); } });
    var tess = await W.aspetta(function () { return A.tessera(P, "Black Jack"); }, 6000); if (!tess) no("non trovo il Black Jack");
    tess.click(); await W.dorme(300);
    if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non c'è «Su questo telefono»");
    for (var k = 0; k < 8 && !q(P, ".bj-wrap"); k++) { await W.dorme(300); W.clicca(P, /Avanti|Comincia/); }
    if (!await W.aspetta(function () { return q(P, ".bj-wrap"); }, 4000)) no("il tavolo non si apre («" + T(P).slice(0, 80) + "»)");
    await W.dorme(600);
    var sala = q(P, ".bj-sala"); if (sala) sala.click();   // (un tocco salta «Benvenuti al tavolo»)
    await W.dorme(300);
    if (!await W.aspetta(function () { return W.clicca(P, /^Punta /); }, 6000)) no("non si riesce a puntare («" + hero(P) + "»)");
    return P;
  }
  async function aspettaTasto(P, re, ms) { return W.aspetta(function () { var b = [].find.call(P.document.querySelectorAll(".bj-hero button"), function (x) { return re.test(x.textContent) && !x.disabled; }); return b || null; }, ms || 12000); }

  COPIONE.aggiungi("bjn1", { nome: "Black Jack: «🎩 Il banco tira sempre fino a 17» quando il banco pesca (mai prima della coperta, mai se non pesca)", fai: async function () {
    var x = [];
    var r = await regoleBJ();
    if (!/tira sempre fino a 16 e si ferma da 17/.test(r)) no("nelle regole non c'è la riga del banco che tira fino a 16");
    // ---- 1) il banco a 16 pesca anche se sta già battendo il giocatore? qui il giocatore ha 17: pesca e fa 21 ----
    var P = await tavolo("Paky", ["10♠", "10♥", "7♣", "6♦", "5♠"]);
    var stai = await aspettaTasto(P, /^Stai$/); if (!stai) no("non arriva il turno («" + hero(P) + "»)");
    if (!stai.classList.contains("bj-cons")) no("con 17 contro un 10 il consiglio non è «Stai»");
    stai.click();
    var visto = false, primaDellaCoperta = false, fine = Date.now() + 15000;
    while (Date.now() < fine && !/Fine mano|Nuova mano/.test(T(P))) {
      var h = hero(P), banco = (q(P, ".bjr-matt-nome") || {}).textContent || "";
      if (/tira sempre fino a 17/.test(h)) { visto = true; if (/\+ \?/.test(banco)) primaDellaCoperta = true; }
      await W.dorme(60);
    }
    if (!visto) no("col banco a 16 non si è letto «Il banco tira sempre fino a 17»");
    if (primaDellaCoperta) no("la scritta è comparsa prima che si girasse la coperta (svela che il banco ha 16 o meno)");
    if (!/Black Jack|21/.test((q(P, ".bjr-matt-nome") || {}).textContent || "")) no("il banco non ha pescato il 5 («" + ((q(P, ".bjr-matt-nome") || {}).textContent) + "»)");
    if (/tira sempre/.test(T(P).replace(/\n/g, " ").split("Fine mano")[1] || "")) x.push("(dopo la mano la scritta resta)");
    x.push("banco 16 → «🎩 Il banco tira sempre fino a 17» dopo la coperta, pesca e fa 21");
    // ---- 2) il giocatore sballa: il banco ha già vinto, non pesca e non lo dice ----
    var P2 = await tavolo("Bea", ["10♠", "10♥", "6♣", "6♦", "K♠", "5♠"]);
    var carta = await aspettaTasto(P2, /^Carta$/); if (!carta) no("non arriva il turno di Bea");
    carta.click();
    var visto2 = false; fine = Date.now() + 15000;
    while (Date.now() < fine && !/Fine mano|Nuova mano/.test(T(P2))) { if (/tira sempre fino a 17/.test(hero(P2))) visto2 = true; await W.dorme(60); }
    if (visto2) no("il giocatore ha sballato e il banco (che non pesca) dice lo stesso «tira sempre fino a 17»");
    if (/21/.test((q(P2, ".bjr-matt-nome") || {}).textContent || "")) no("il banco ha pescato anche se il giocatore aveva sballato");
    x.push("giocatore sballato: il banco resta a 16 e non dice niente");
    var err = (P.__err || []).concat(P2.__err || []); if (err.length) no("errori: " + err.join(" | "));
    return x.join(" · ");
  } });

  COPIONE.aggiungi("bjn2", { nome: "Black Jack: assi divisi → «Assi divisi: una carta per asso, come al casinò», nessun tasto, 21 non è Black Jack", fai: async function () {
    var x = [];
    var r = await regoleBJ();
    if (!/Assi divisi.*una carta sola per asso/.test(r)) no("nelle regole non c'è la riga degli assi divisi");
    var P = await tavolo("Paky",["A♠", "9♥", "A♦", "7♣", "K♠", "5♥", "2♣"]);
    var div = await aspettaTasto(P, /^Dividi$/); if (!div) no("con due Assi non si può dividere («" + hero(P) + "»)");
    if (!div.classList.contains("bj-cons")) no("con due Assi il consiglio non è «Dividi»");
    div.click();
    var bolla = await W.aspetta(function () { var b = q(P, ".bjr-bolla"); return b && b.textContent; }, 3000);
    if (bolla !== "Divido gli assi!") no("la nuvoletta dice «" + bolla + "» invece di «Divido gli assi!»");
    var mani = {}, ptV = [], tasti = false, fine = Date.now() + 15000, misura = "";
    while (Date.now() < fine && !/Gioca il banco|tira sempre|Fine mano/.test(hero(P) + " " + ((q(P, ".bj-turno") || {}).textContent || ""))) {
      var h = hero(P);
      if (/Assi divisi: una carta per asso, come al casinò/.test(h)) {
        var n = P.document.querySelectorAll(".bj-hero .bj-mano").length, att = [].findIndex.call(P.document.querySelectorAll(".bj-hero .bj-mano"), function (m) { return m.classList.contains("attiva"); });
        mani[att] = 1; ptV = [].map.call(P.document.querySelectorAll(".bj-hero .bj-pt"), function (p) { return p.textContent; }); if (n !== 2) no("dopo la divisione non ci sono due mani sotto (" + n + ")");
        if (!misura) misura = (await A.misuraSchermata(P, "Paky", 360, 640)) || "ok";
      }
      if (P.document.querySelector(".bj-hero button:not([disabled])")) tasti = true;
      await W.dorme(50);
    }
    if (!mani[0] || !mani[1]) no("la scritta degli assi non si è vista per tutte e due le mani (" + Object.keys(mani).join(",") + ")");
    if (tasti) no("con gli assi divisi c'erano tasti da toccare");
    if (misura && misura !== "ok") no("a 360x640: " + misura);
    // le due mani: A+K = 21 (non Black Jack), A+5 = 6/16
    var pt = ptV;
    if (!/^21 ·/.test(pt[0] || "") || /BJ/.test(pt[0] || "")) no("Asso e K dopo la divisione: «" + pt[0] + "» (deve essere 21, non BJ)");
    x.push("nuvoletta «Divido gli assi!», scritta sotto le carte per le due mani, niente tasti, " + pt.join(" e "));
    if (!await W.aspetta(function () { return /Fine mano/.test(T(P)); }, 15000)) no("la mano non finisce");
    var err = P.__err || []; if (err.length) no("errori: " + err.join(" | "));
    return x.join(" · ");
  } });

  // ===================== la resa, la lineetta, le fiches, la gara con la quota =====================
  COPIONE.aggiungi("bjn3", { nome: "Black Jack: la resa (16 contro 10: consiglio acceso, metà puntata indietro, «resa» sul tavolo), a 360x640 niente esce", fai: async function () {
    var r = await regoleBJ();
    if (!/Resa.*metà puntata/.test(r)) no("nelle regole non c'è la resa");
    var P = await tavolo("Paky", ["10♠", "10♦", "6♥", "7♣"]);
    var resa = await aspettaTasto(P, /^Resa$/); if (!resa) no("con 16 contro 10 non c'è il tasto «Resa» («" + hero(P) + "»)");
    if (!resa.classList.contains("bj-cons")) no("con 16 contro 10 il consiglio non accende «Resa»");
    if (!resa.closest(".bj-ptriga")) no("«Resa» non sta accanto al punteggio della mano");
    var m = await A.misuraSchermata(P, "Paky", 360, 640); if (m) no("a 360x640 col tasto Resa: " + m);
    resa = await aspettaTasto(P, /^Resa$/); resa.click();
    if (!await W.aspetta(function () { return /Ti ritiri: riprendi 50/.test(hero(P)); }, 4000)) no("dopo la resa non si legge «Ti ritiri: riprendi 50» («" + hero(P) + "»)");
    if (!await W.aspetta(function () { return /Fine mano/.test(T(P)); }, 12000)) no("la mano non finisce");
    if (!/−50/.test(hero(P))) no("a fine mano non si legge −50 («" + hero(P) + "»)");
    if (!/resa/.test((P.document.querySelector(".bjr-punti") || {}).textContent || "")) no("sul tavolo la mano non dice «resa»");
    var err = P.__err || []; if (err.length) no("errori: " + err.join(" | "));
    return "consiglio «Resa» acceso accanto al punteggio, −50 su 100, «resa» sul tavolo, 360x640 ok";
  } });

  COPIONE.aggiungi("bjn4", { nome: "Black Jack: la lineetta della puntata (da 10 a tutte le monete), conferma solo sopra metà delle Speed Coins, fiches da 10.000", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0, prima: function (w) { trucca(w, ["10♠", "9♦", "Q♥", "8♣"]); w.SGNube.fiches = function () { return 90000; }; w.SGNube.salvaFiches = function () {}; } });
    var tess = await W.aspetta(function () { return A.tessera(P, "Black Jack"); }, 6000); tess.click(); await W.dorme(300);
    W.clicca(P, /Su questo telefono/, ".modo-grande");
    for (var k = 0; k < 8 && !q(P, ".bj-wrap"); k++) { await W.dorme(300); W.clicca(P, /Avanti|Comincia/); }
    await W.dorme(700); var sala = q(P, ".bj-sala"); if (sala) sala.click(); await W.dorme(300);
    var rg = await W.aspetta(function () { return q(P, ".bj-rg"); }, 6000); if (!rg) no("non c'è la lineetta della puntata («" + hero(P) + "»)");
    if (/\+100|−10/.test(hero(P))) no("ci sono ancora i tasti +100 / −10");
    var capi = [].map.call(P.document.querySelectorAll(".bj-linea span"), function (x) { return x.textContent; });
    if (capi[0] !== "10" || capi[1] !== "90.000") no("ai lati della lineetta: «" + capi.join(" … ") + "» (deve dire 10 … 90.000)");
    function metti(pos) { rg.value = pos; rg.dispatchEvent(new P.Event("input", { bubbles: true })); }
    metti(1000);
    if (!/Punta 90\.000/.test(hero(P))) no("in fondo alla lineetta la puntata non è 90.000 («" + hero(P) + "»)");
    metti(1);
    if (!/Punta 10 /.test(hero(P) + " ")) no("all'inizio della lineetta la puntata non è 10 («" + hero(P) + "»)");
    metti(1000); W.clicca(P, /^Punta 90\.000/);
    if (!await W.aspetta(function () { return P.document.querySelector(".conferma-sfondo"); }, 2000)) no("puntando tutte le 90.000 non chiede conferma");
    if (!/Punti 90\.000/.test(P.document.querySelector(".conferma-sfondo").innerText)) no("la conferma non dice quanto punti");
    W.clicca(P, /^Resta$/, ".conferma-sfondo button"); await W.dorme(300);
    if (!/Punta 90\.000/.test(hero(P))) no("dopo «Resta» la puntata è partita lo stesso");
    metti(632);   // circa 36.000: meno di metà, niente conferma
    var val = (q(P, ".bj-punta-val") || {}).textContent || "";
    W.clicca(P, /^Punta /);
    await W.dorme(400);
    if (P.document.querySelector(".conferma-sfondo")) no("con " + val + " (meno di metà) chiede conferma lo stesso");
    var ok = await W.aspetta(function () { return P.document.querySelectorAll(".bjr-pila .bjr-fiche.f10k").length; }, 5000);
    if (!ok) no("puntando " + val + " sul tavolo non c'è nessuna fiche da 10.000 (" + [].map.call(P.document.querySelectorAll(".bjr-pila .bjr-fiche"), function (x) { return x.className.split(" ")[1]; }).join(",") + ")");
    var err = P.__err || []; if (err.length) no("errori: " + err.join(" | "));
    return "lineetta 10 … 90.000, conferma solo sopra metà (Resta funziona), " + val + " = " + ok + " fiche da 10.000 sul tavolo";
  } });

  // ---- la gara online con la quota: il portafoglio vero di ogni telefono (resta tra le ricariche) ----
  W.__portafogli = W.__portafogli || {}; W.__salvate = W.__salvate || {};
  function portafoglio(w, nome) {
    w.SGNube.fiches = function () { return W.__portafogli[nome]; };
    w.SGNube.salvaFiches = function (id, v) { (W.__salvate[nome] = W.__salvate[nome] || []).push(v); W.__portafogli[nome] = v; };
  }
  COPIONE.aggiungi("bjn5", { nome: "Black Jack online, gara con la quota: pagano in due (Luca senza monete guarda), rientro, ricarica, mani finali, ultima mano segreta, premio", fai: async function () {
    if (!W.__prepCH) await COPIONE.carica("migliora/casino-horto.js");   // (la spia delle regole: w.__imp)
    W.__portafogli = { Paky: 5000, Giulia: 3000, Luca: 400 }; W.__salvate = {};
    var x = [], C = null, vmC = function () { return W.vmDi(C) || {}; }, seat = function (v, n) { return (v.giocatori || []).findIndex(function (g) { return g.nome === n; }); };
    var P = await W.apriTel("Paky", { x: 0, ch: true, prima: function (w) { portafoglio(w, "Paky"); trucca(w, ["10♠", "10♥", "10♦", "9♣", "6♦", "8♠"]); } });
    P.__imp = { uguali: true, quota: 1000, mani: 6 };
    C = await W.apriStanza(P, "Black Jack");
    var G = await W.apriTel("Giulia", { x: 185, ch: true, hash: "gioco=blackjack&stanza=" + C, prima: function (w) { portafoglio(w, "Giulia"); } });
    await W.apriTel("Luca", { x: 370, ch: true, hash: "gioco=blackjack&stanza=" + C, prima: function (w) { portafoglio(w, "Luca"); } });
    if (!await W.aspetta(function () { return /Giulia/.test(T(P)) && /Luca/.test(T(P)); }, 8000)) no("in saletta non arrivano Giulia e Luca");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("non trovo «Comincia»");
    var v = await W.aspetta(function () { var v = vmC(); return v.fase === "punta" && v.gara ? v : null; }, 15000);
    if (!v) no("la gara non parte (" + JSON.stringify(vmC().gara) + ")");
    if (v.gara.quota !== 1000 || Object.keys(v.gara.pagati).length !== 2) no("quota/paganti sbagliati: " + JSON.stringify(v.gara));
    // il montepremi conta le quote quando i telefoni le hanno pagate davvero
    if (!await W.aspetta(function () { return vmC().gara.monte === 2000; }, 5000)) no("il montepremi non arriva a 2.000 (" + JSON.stringify(vmC().gara) + ")");
    if (seat(v, "Luca") >= 0) no("Luca (400 monete) si è seduto lo stesso");
    if (!await W.aspetta(function () { return /Non hai 1\.000/.test(T(W.finestra("Luca"))); }, 5000)) no("Luca non legge «Non hai 1.000 🪙 per la quota» («" + T(W.finestra("Luca")).slice(-90) + "»)");
    if (!await W.aspetta(function () { return W.__portafogli.Paky === 4000 && W.__portafogli.Giulia === 2000; }, 5000)) no("le quote non sono state pagate una volta: " + JSON.stringify(W.__portafogli));
    if (v.giocatori.some(function (g) { return g.fiches !== 1000; })) no("non partono tutti con 1.000 fiches: " + v.giocatori.map(function (g) { return g.nome + ":" + g.fiches; }).join(" "));
    x.push("quota pagata da Paky e Giulia (Luca guarda)");
    // ---- mano 1 truccata: Giulia punta tutto e perde (16 contro 18), poi rientra ----
    var gid = function () { return W.reteDi("Giulia"); };
    gid().invia({ t: "mossa", kind: "punta", val: 1000 });
    await W.aspetta(function () { return W.clicca(P, /^Punta /); }, 6000);
    var fatto = {}, fino = Date.now() + 40000;
    while (Date.now() < fino && vmC().fase !== "esito") {
      v = vmC(); var gt0 = v.giocatori[v.turno], k = v.fase + v.turno + "|" + (gt0 ? gt0.mani.map(function (m) { return m.carte.length; }).join() : "");
      if (v.fase === "assic" && !fatto[k]) { fatto[k] = 1; W.clicca(P, /^No$/); gid().invia({ t: "mossa", kind: "assic", si: false }); }
      if (v.fase === "gioca" && !fatto[k]) { fatto[k] = 1; if (gt0.nome === "Paky") { if (!W.clicca(P, /^Stai$/)) fatto[k] = 0; } else gid().invia({ t: "mossa", kind: "azione", mossa: "stai", h: 0, n: 2 }); }
      await W.dorme(150);
    }
    v = vmC();
    if (v.giocatori[seat(v, "Giulia")].fiches !== 0) no("Giulia doveva perdere tutto alla prima mano (" + v.giocatori.map(function (g) { return g.nome + ":" + g.fiches; }).join(" ") + ")");
    var bR = await W.aspetta(function () { return [].find.call(G.document.querySelectorAll(".bj-hero button"), function (b) { return /Rientra \(1\.000/.test(b.textContent) && !b.disabled; }); }, 6000);
    if (!bR) no("Giulia a zero non vede «🔁 Rientra (1.000 🪙)» («" + T(G).slice(-120) + "»)");
    bR.click();
    // la domanda deve comparire; il «Sì» rosso lo tocca chi arriva prima: io o il copione (__autoConferma lo tocca da solo ogni 100 ms)
    var visto = await W.aspetta(function () { var c = G.document.querySelector(".conferma-sfondo"); return c && /Rientri nella gara\?/.test(c.innerText); }, 2000);
    if (!visto) no("il rientro non chiede conferma («" + T(G).slice(-100) + "»)");
    var si = await W.aspetta(function () { return [].find.call(G.document.querySelectorAll(".conferma-sfondo button"), function (b) { return /Sì, rientro/.test(b.textContent) && !b.disabled; }); }, 1500);
    if (si) si.click();
    if (!await W.aspetta(function () { var v = vmC(); return v.gara.monte === 3000 && v.gara.pagati[seat(v, "Giulia")] === 2 && v.giocatori[seat(v, "Giulia")].fiches === 1000; }, 6000)) no("il rientro non arriva: " + JSON.stringify(vmC().gara));
    if (!await W.aspetta(function () { return W.__portafogli.Giulia === 1000; }, 5000)) no("il rientro non è stato pagato da Giulia una volta (" + W.__portafogli.Giulia + ")");
    x.push("Giulia rientra (montepremi 3.000)");
    // ---- Giulia ricarica la pagina: non paga di nuovo ----
    await W.ricarica("Giulia"); G = W.finestra("Giulia");
    if (!await W.aspetta(function () { return G.document.querySelector(".bj-wrap"); }, 8000)) no("Giulia ricaricata non torna al tavolo");
    await W.dorme(1500);
    if (W.__portafogli.Giulia !== 1000 || (W.__salvate.Giulia || []).length !== 2) no("dopo la ricarica Giulia ha pagato di nuovo: " + (W.__salvate.Giulia || []).join(","));
    // ---- le mani che restano: mani finali (minima 20) e ultima mano segreta ----
    var visti = {}, fatto2 = {}; fino = Date.now() + 150000;
    W.clicca(P, /Nuova mano/);
    while (Date.now() < fino && vmC().fase !== "fine") {
      v = vmC(); var gi = seat(v, "Giulia"), pi = seat(v, "Paky");
      if (v.finali) visti.finali = v.puntataMin;
      if (v.segreta && v.fase === "punta" && v.giocatori[pi].puntata === -1 && !v.giocatori[gi].puntata) {
        visti.segreta = 1;
        if (v.giocatori[pi].fiches !== null) no("nell'ultima mano dopo la puntata di Paky si vedono le sue fiches");
        if (/Punto \d/.test(T(W.finestra("Giulia")))) no("Giulia legge quanto ha puntato Paky");
      }
      if (v.fase === "svela") visti.svela = 1;
      var gt = v.giocatori[v.turno], kk = v.mano + v.fase + v.turno + "|" + (gt && gt.mani[gt.attiva] ? gt.mani[gt.attiva].carte.length : "");
      if (v.fase === "punta") {
        if (!v.giocatori[pi].puntata && !fatto2[kk + "P"]) { if (W.clicca(P, /^Punta /)) fatto2[kk + "P"] = 1; }
        else if (v.giocatori[pi].puntata && !v.giocatori[gi].puntata && !fatto2[kk + "G"]) { fatto2[kk + "G"] = 1; gid().invia({ t: "mossa", kind: "punta", val: 10 }); }
      } else if (v.fase === "assic" && !fatto2[kk]) { fatto2[kk] = 1; W.clicca(P, /^No$/); gid().invia({ t: "mossa", kind: "assic", si: false }); }
      else if (v.fase === "gioca" && !fatto2[kk] && gt) { fatto2[kk] = 1; if (gt.nome === "Paky") { if (!W.clicca(P, /^Stai$/)) fatto2[kk] = 0; } else gid().invia({ t: "mossa", kind: "azione", mossa: "stai", h: gt.attiva, n: gt.mani[gt.attiva].carte.length }); }
      else if (v.fase === "esito") W.clicca(P, /Nuova mano|Classifica ▶/);
      await W.dorme(120);
    }
    if (vmC().fase !== "fine") no("la gara non finisce (mano " + vmC().mano + ", fase " + vmC().fase + ")");
    if (visti.finali !== 20) no("nelle mani finali la puntata minima non raddoppia (" + visti.finali + ")");
    if (!visti.segreta) no("l'ultima mano non era a puntata segreta");
    if (!visti.svela) no("non c'è stato «Si scopre!»");
    v = vmC();
    var premi = (v.gara && v.gara.premi) || {}, cl = v.classifica || [], primo = cl.filter(function (r) { return r.pos === 1; });
    if (primo.length !== 1) x.push("(pari merito in testa: " + primo.map(function (r) { return r.nome; }).join(", ") + ")");
    var tot = Object.keys(premi).reduce(function (a, k) { return a + premi[k]; }, 0);
    if (tot !== 3000) no("i premi non fanno il montepremi: " + JSON.stringify(premi));
    var atteso = { Paky: 4000 + (premi[seat(v, "Paky")] || 0), Giulia: 1000 + (premi[seat(v, "Giulia")] || 0) };
    if (!await W.aspetta(function () { return W.__portafogli.Paky === atteso.Paky && W.__portafogli.Giulia === atteso.Giulia; }, 5000)) no("i premi non sono arrivati giusti: " + JSON.stringify(W.__portafogli) + " invece di " + JSON.stringify(atteso));
    await W.dorme(1500);
    if ((W.__salvate.Paky || []).length !== (premi[seat(v, "Paky")] ? 2 : 1) || (W.__salvate.Luca || []).length) no("salvataggi del portafoglio sbagliati: " + JSON.stringify(W.__salvate));
    if (!/🏆 \+[\d.]+ 🪙/.test(T(P))) no("nella classifica non c'è il premio «🏆 +…» («" + T(P).slice(-160) + "»)");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | "));
    x.push("finali a 20, ultima mano segreta e «Si scopre!», premi " + JSON.stringify(premi) + ", portafogli " + JSON.stringify(W.__portafogli) + ", titoli: " + (v.titoli || []).map(function (t) { return t.t; }).join(", "));
    return x.join(" · ");
  } });

  COPIONE.aggiungi("bjn6", { nome: "Black Jack online, gara con la quota chiusa a metà dall'host: le quote tornano a tutti, una volta sola", fai: async function () {
    if (!W.__prepCH) await COPIONE.carica("migliora/casino-horto.js");
    W.__portafogli = { Paky: 5000, Giulia: 3000 }; W.__salvate = {};
    var C = null, vmC = function () { return W.vmDi(C) || {}; };
    var P = await W.apriTel("Paky", { x: 0, ch: true, prima: function (w) { portafoglio(w, "Paky"); } });
    P.__imp = { uguali: true, quota: 1000, mani: 10 };
    C = await W.apriStanza(P, "Black Jack");
    var G = await W.apriTel("Giulia", { x: 185, ch: true, hash: "gioco=blackjack&stanza=" + C, prima: function (w) { portafoglio(w, "Giulia"); } });
    if (!await W.aspetta(function () { return /Giulia/.test(T(P)); }, 8000)) no("Giulia non arriva in saletta");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { var v = vmC(); return v.gara && v.gara.monte === 2000; }, 15000)) no("la gara non parte o il montepremi non arriva a 2.000 (" + JSON.stringify(vmC().gara) + ")");
    if (W.__portafogli.Paky !== 4000 || W.__portafogli.Giulia !== 2000) no("quote non pagate: " + JSON.stringify(W.__portafogli));
    // l'host si alza: «Chiudi il tavolo per tutti?» dice delle quote
    var ind = P.document.querySelector(".schermata .testa button[aria-label='Indietro']");
    if (ind) ind.click();
    var dlg = await W.aspetta(function () { return P.document.querySelector(".bj-dlg"); }, 3000);
    if (!dlg) no("non si apre «Chiudi il tavolo per tutti?»");
    if (!/quote tornano a tutti/.test(dlg.innerText)) no("l'avviso d'uscita non dice delle quote («" + dlg.innerText.replace(/\s+/g, " ") + "»)");
    W.clicca(P, /^Mi alzo$/, ".bj-dlg button");
    if (!await W.aspetta(function () { return W.__portafogli.Paky === 5000 && W.__portafogli.Giulia === 3000; }, 6000)) no("le quote non sono tornate: " + JSON.stringify(W.__portafogli));
    if (!await W.aspetta(function () { return /quote della gara tornano a tutti/.test(T(G)); }, 5000)) no("Giulia non legge che le quote tornano («" + T(G).slice(0, 120) + "»)");
    await W.dorme(1000);
    if (W.__portafogli.Paky !== 5000 || W.__portafogli.Giulia !== 3000) no("rimborso doppio: " + JSON.stringify(W.__portafogli));
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | "));
    return "host chiude a metà: Paky 5.000 e Giulia 3.000 di nuovo (" + JSON.stringify(W.__salvate) + ")";
  } });

  COPIONE.aggiungi("bjn7", { nome: "Black Jack: la scommessa «👯 Coppia» (accesa di partenza): due re dello stesso colore pagano 15 a 1 appena arrivano le carte", fai: async function () {
    var r = await regoleBJ();
    if (!/Coppia.*15 volte/.test(r)) no("nelle regole non c'è la Coppia");
    var P = await W.apriTel("Paky", { x: 0, prima: function (w) { trucca(w, ["K♥", "9♠", "K♦", "7♣"]); } });
    var tess = await W.aspetta(function () { return A.tessera(P, "Black Jack"); }, 6000); tess.click(); await W.dorme(300);
    W.clicca(P, /Su questo telefono/, ".modo-grande");
    for (var k = 0; k < 8 && !q(P, ".bj-wrap"); k++) { await W.dorme(300); W.clicca(P, /Avanti|Comincia/); }
    await W.dorme(700); var sala = q(P, ".bj-sala"); if (sala) sala.click(); await W.dorme(300);
    var bc = await W.aspetta(function () { return q(P, ".bj-coppia"); }, 6000);
    if (!bc) no("accanto alla puntata non c'è «👯 Coppia» («" + hero(P) + "»)");
    if (bc.classList.contains("on") || !/Coppia \+10/.test(bc.textContent)) no("la Coppia non parte spenta da 10 («" + bc.textContent + "»)");
    bc.click(); if (!bc.classList.contains("on")) no("toccata, la Coppia non si accende");
    var m = await A.misuraSchermata(P, "Paky", 360, 640); if (m) no("a 360x640 con la Coppia: " + m);
    W.clicca(P, /^Punta 100/);
    var ev = await W.aspetta(function () { var e = q(P, ".bj-evento"); return e && /coppia di colore! \+150/.test(e.textContent) ? e.textContent : null; }, 12000);
    if (!ev) no("non compare «👯 Paky: coppia di colore! +150»");
    if (!await W.aspetta(function () { return /1\.050/.test((q(P, ".bj-turno") || {}).textContent || ""); }, 5000)) no("dopo la coppia Paky non ha 1.050 («" + ((q(P, ".bj-turno") || {}).textContent) + "»)");
    var err = P.__err || []; if (err.length) no("errori: " + err.join(" | "));
    return "«👯 Coppia +10» acceso accanto alla puntata, re di cuori e re di quadri: «" + ev + "», 1.000 − 100 − 10 + 160 = 1.050";
  } });
})();

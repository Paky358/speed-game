// PROVE DEL PASSO 5 PER LO «SCOPONE» (js/games/scopone.js: riprende + riserva, dal 18 ott 2026).
// Uso (dopo copione-prova.js): await COPIONE.carica("passo5/scopone.js"); await COPIONE.prova("5so1")
//   Edge invisibile: prova.js --porta 8978 --carica passo5/scopone.js --prova 5so1,5so2,5so3 --timeout 900
// Tutte col percorso di prima (stanza di un gioco solo), col gioco vero ("scopone", in GIOCHI_ONLINE). Profili finti.
// 5so1 Paky, Giulia e Luca (+ 1 Bot) a 21 punti: l'host ricarica a metà della prima mano quando tocca a una persona → la
//      partita RIPRENDE (niente saletta, «🔁 Paky è tornato…»): stesse carte in mano a tutti (anche sugli schermi di Giulia e
//      Luca), stesso tavolo, stesse prese, stessi punti, stesso turno; si gioca ancora. Poi ricarica di nuovo sul riepilogo
//      della mano → il riepilogo resta per tutti, i punti NON si danno due volte, dopo il conto (almeno 6 s) parte la 2ª mano
//      coi punti di prima.
// 5so2 Paky e Giulia (+ 2 Bot), una mano sola: l'host ricarica subito dopo una presa (la presa si stava guardando) → la presa
//      resta fatta, stesse carte, si va avanti; poi fino alla classifica e l'host ricarica lì → la classifica resta, la
//      partita (XP) data una volta sola a testa, un solo "__esito".
// 5so3 Riserva in 4 (Paky, Giulia, Luca, Sara: niente Bot), una mano sola: il telefono di Paky si spegne del tutto a metà
//      mano → entro 8 s la partita la tiene Giulia (_g 2) dal SUO posto, con le stesse carte; «👑 … la porti avanti tu» e
//      «👑 Ora la partita la tiene Giulia»; Paky torna: «👋 Bentornato! … rientri come giocatore», rientra al suo posto con le
//      sue carte e gioca; mai due host; fino alla classifica: XP una volta a testa (anche Paky), un solo "__esito" (di Giulia).
//      Poi «Nuova partita»: in saletta Giulia al posto 0, Paky seduto da amico.
// 5so4 Riserva tenuta da chi guarda: Paky e Giulia (+ 2 Bot), Marco arriva a partita cominciata e guarda; Giulia esce (al suo
//      posto un Bot), poi il telefono di Paky si spegne → la partita la tiene Marco GUARDANDO (non si siede: 🔄 per cambiare
//      le carte che guarda), il posto di Paky aspetta lui; Paky torna al suo posto; classifica, un "__esito" di Marco;
//      «Nuova partita»: Marco al posto 0, Paky seduto.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T;
  var GID = "scopone", NOME = "Scopone";
  function no(p) { throw new Error("NO: " + p); }
  function vm(C) { return W.vmDi(C) || {}; }
  function pill(w) { return w ? [].map.call(w.document.querySelectorAll(".sg-pillola"), function (x) { return x.textContent; }).join(" | ") : ""; }
  function errori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / ")); }
  // il motore della partita sul telefono di chi la tiene
  function HS(nome) { var w = W.finestra(nome); return w && w.__SCOPONEhost; }
  function stDi(nome) { var h = HS(nome); return h && h.st(); }
  function posto(st, nome) { for (var s = 0; s < 4; s++) if (st.nomi[s] === nome) return s; return -1; }
  function ids(carte) { return carte.map(function (c) { return c.id; }).sort().join(","); }
  function manoDi(w) { return [].map.call(w.document.querySelectorAll(".sc-mano-riga .sc-carta img"), function (i) { return (i.getAttribute("src") || "").replace(/^.*\//, "").replace(".jpg", ""); }).sort().join(","); }
  function stato(w) {   // "gioco" | "mano" (riepilogo) | "fine" | "lobby" | "?"
    var d = w.document;
    if (d.querySelector(".sc-mensola")) return "gioco";
    if (d.querySelector(".sp-tab")) return /Fine mano/.test(T(w)) ? "mano" : "fine";
    if (d.querySelector(".saletta-schermo")) return "lobby";
    return "?";
  }
  function toccaAMe(w) { var p = w.document.querySelector(".sc-prese"); return !!w.document.querySelector(".sp-tocca") || !!(p && /tocca a te/.test(p.textContent)); }
  async function giocaUna(w) {   // la prima carta della mano; se c'è da scegliere la presa, le carte verdi
    var c = w.document.querySelector(".sc-mano-riga .sc-carta"); if (!c) return false;
    c.click(); await W.dorme(120);
    for (var i = 0; i < 6; i++) {
      if (!w.document.querySelector(".sc-mano-riga .sc-carta.sel")) break;
      var cap = w.document.querySelector(".sc-terra .sc-carta.cap"); if (!cap) break;
      cap.click(); await W.dorme(90);
    }
    return true;
  }
  // i telefoni (per nome: dopo una ricarica la finestra è un'altra) giocano quando tocca a loro, finché ferma() non è vero
  async function giocaFinche(nomi, ferma, ms) {
    var fino = Date.now() + (ms || 120000);
    while (Date.now() < fino) {
      if (ferma()) return true;
      for (var i = 0; i < nomi.length; i++) { var w = W.finestra(nomi[i]); if (w && stato(w) === "gioco" && toccaAMe(w)) { await giocaUna(w); await W.dorme(150); } }
      await W.dorme(120);
    }
    return !!ferma();
  }
  async function regola(w, scelta) {   // ⚙️ Regole della saletta: tocca la scelta e «✅ Fatto»
    var b = await W.aspetta(function () { return w.document.querySelector("button.sl-regole"); }, 4000); if (!b) no("nella saletta non c'è ⚙️ Regole");
    b.click();
    var f = await W.aspetta(function () { return w.document.querySelector(".sl-foglio"); }, 2000); if (!f) no("il foglio ⚙️ non si apre");
    var c = [].find.call(f.querySelectorAll("button"), function (x) { return scelta.test(x.textContent.trim()); });
    if (!c) no("nel ⚙️ non c'è " + scelta);
    c.click(); await W.dorme(150);
    var ok = [].find.call(f.querySelectorAll("button"), function (x) { return /Fatto/.test(x.textContent); }); if (ok) ok.click();
    await W.dorme(300);
  }
  function arriva(n) { return function (v) { return v.t === "inCorso" || ((v.seggi || []).filter(Boolean).length >= n); }; }
  function foto(st) {   // quello che deve restare uguale in una ripresa
    return JSON.stringify({ mani: st.mani.map(ids), tav: ids(st.tavolo), prese: st.prese.map(ids), scope: st.scope, punti: st.punti, turno: st.turno, manoN: st.manoN, nomi: st.nomi });
  }
  // le carte sullo schermo di ognuno sono le sue
  async function carteGiuste(nomi, chi, ms) {
    var ok = await W.aspetta(function () {
      var st = stDi(chi); if (!st) return false;
      return nomi.every(function (n) { var w = W.finestra(n), s = posto(st, n); return w && s >= 0 && stato(w) === "gioco" && manoDi(w) === ids(st.mani[s]); });
    }, ms || 8000);
    if (!ok) {
      var st = stDi(chi) || { nomi: {}, mani: [] };
      no("le carte sugli schermi non sono quelle giuste (" + nomi.map(function (n) { var w = W.finestra(n); return n + ": " + (w ? stato(w) + " " + manoDi(w).split(",").length : "?") + "/" + ((st.mani[posto(st, n)] || []).length); }).join(", ") + ")");
    }
  }
  // si aspetta che tocchi a una persona (niente presa in corso): così nessun Bot gioca mentre si ricarica
  async function turnoDiPersona(chi, persone) {
    var ok = await W.aspetta(function () {
      var st = stDi(chi), h = HS(chi); if (!st || st.fase !== "gioco" || st.presa || st.resto || h.H.attesa) return false;
      return persone.indexOf(st.nomi[st.turno]) >= 0;
    }, 15000);
    if (!ok) no("non arriva il turno di una persona");
  }

  // ---------------- 5so1: ricarica a metà mano e sul riepilogo ----------------
  COPIONE.aggiungi("5so1", { nome: "Scopone · in 3 a 21: l'host ricarica a metà mano (stesse carte, tavolo, punti, turno) e sul riepilogo (niente punti doppi), poi la 2ª mano", fai: async function () {
    var note = [], primaS = null, persone = ["Paky", "Giulia", "Luca"];
    var r = await A.provaRipresa({ gioco: GID, nomeTessera: NOME, amici: ["Giulia", "Luca"], arriva: arriva(3),
      comincia: async function (C, P) {
        await regola(P, /^21$/);
        if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go") || W.clicca(P, /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
        if (!await W.aspetta(function () { return stDi("Paky") && stato(W.finestra("Giulia")) === "gioco"; }, 10000)) no("non si arriva al tavolo");
        if (stDi("Paky").traguardo !== 21) no("si gioca a " + stDi("Paky").traguardo + " invece che a 21");
      },
      fase: function (v) { return v.t === "inCorso"; },
      prepara: async function () {
        if (!await giocaFinche(persone, function () { var s = stDi("Paky"); return s && s.giocate >= 9; }, 60000)) no("non si giocano 9 carte");
        await turnoDiPersona("Paky", persone);
        await W.dorme(900);
        primaS = foto(stDi("Paky"));
      },
      controlla: function () {
        var st = stDi("Paky"); if (!st) return "l'host non ha la partita";
        if (st.fase !== "gioco") return "fase " + st.fase;
        var f = foto(st); return f === primaS ? true : "la partita è cambiata: " + primaS.slice(0, 80) + " → " + f.slice(0, 80);
      } });
    var C = r.C;
    await carteGiuste(persone, "Paky");
    if (HS("Paky").mio() !== 0 || HS("Paky").io !== "host") no("dopo la ricarica Paky non è al posto 0");
    note.push("1ª ricarica a metà mano: ripresa in " + r.dt + " s, stesse carte (anche sugli schermi), tavolo, prese, punti e turno");
    // si gioca ancora: fino al riepilogo della prima mano
    var g0 = stDi("Paky").giocate;
    if (!await giocaFinche(persone, function () { var s = stDi("Paky"); return s && s.giocate >= g0 + 4; }, 40000)) no("dopo la ripresa non si gioca (i Bot o il turno sono fermi)");
    if (!await giocaFinche(persone, function () { var s = stDi("Paky"); return s && s.fase !== "gioco"; }, 200000)) no("la prima mano non finisce");
    var st1 = stDi("Paky");
    if (st1.fase === "fine") return note.concat(["(la prima mano ha già chiuso la partita a 21: rifai la prova) " + st1.punti.noi + "-" + st1.punti.loro]).join(" · ");
    if (!await W.aspetta(function () { return persone.every(function (n) { return stato(W.finestra(n)) === "mano"; }); }, 6000)) no("non tutti vedono il riepilogo della mano");
    await W.dorme(1000);
    var punti1 = JSON.stringify(stDi("Paky").punti), mano1 = stDi("Paky").manoN, s0 = (W.statoStanza(C) || {})._s, t0 = Date.now();
    // ---- 2ª ricarica: sul riepilogo ----
    var P2 = await W.ricarica("Paky"), pillAm = {}, salettaVista = "";
    var ok = await W.aspetta(function () {
      ["Giulia", "Luca"].forEach(function (n) { var w = W.finestra(n); if (/tornato/.test(pill(w))) pillAm[n] = 1; if (stato(w) === "lobby") salettaVista = n; });
      var s = W.statoStanza(C) || {}, st = stDi("Paky");
      return s._s && s._s !== s0 && s._r && st && st.fase === "fineround" && stato(W.finestra("Paky")) === "mano";
    }, 12000);
    if (!ok) no("2ª ricarica: il riepilogo non torna sull'host (" + (stDi("Paky") ? stDi("Paky").fase : "niente partita") + ", «" + T(W.finestra("Paky")).slice(0, 60) + "»)");
    if (salettaVista) no(salettaVista + " è passato dalla saletta");
    if (JSON.stringify(stDi("Paky").punti) !== punti1) no("2ª ricarica: i punti sono cambiati " + punti1 + " → " + JSON.stringify(stDi("Paky").punti));
    if (!["Giulia", "Luca"].every(function (n) { return stato(W.finestra(n)) === "mano"; })) no("2ª ricarica: gli amici non sono più sul riepilogo");
    // dopo il conto (almeno 6 s dalla ripresa) parte la seconda mano, coi punti di prima
    var ok2 = await W.aspetta(function () { var st = stDi("Paky"); return st && st.manoN === mano1 + 1 && st.fase === "gioco"; }, 30000);
    if (!ok2) no("dopo la 2ª ricarica la seconda mano non parte");
    var dt2 = (Date.now() - t0) / 1000;
    if (dt2 < 6) no("la seconda mano è partita dopo " + dt2.toFixed(1) + " s: niente respiro");
    if (JSON.stringify(stDi("Paky").punti) !== punti1) no("nella seconda mano i punti non sono quelli di prima (" + JSON.stringify(stDi("Paky").punti) + " invece di " + punti1 + ")");
    await carteGiuste(persone, "Paky", 10000);
    if (!await giocaFinche(persone, function () { var s = stDi("Paky"); return s && s.giocate >= 4; }, 40000)) no("nella seconda mano non si gioca");
    errori();
    note.push("2ª ricarica sul riepilogo: resta per tutti, punti " + punti1 + " non dati due volte, 2ª mano dopo " + dt2.toFixed(1) + " s");
    return note.join(" · ");
  } });

  // ---------------- 5so2: ricarica subito dopo una presa e sulla classifica ----------------
  COPIONE.aggiungi("5so2", { nome: "Scopone · in 2 + 2 Bot, una mano: l'host ricarica durante una presa (resta fatta) e sulla classifica (XP e esito una volta)", fai: async function () {
    W.__partite = {};
    var note = [], primaS = null, persone = ["Paky", "Giulia"];
    var conta = function (w) { var n = String((w.frameElement && w.frameElement.id) || "").replace(/^tel-/, ""); A.contaPartite(n)(w); };
    var r = await A.provaRipresa({ gioco: GID, nomeTessera: NOME, amici: ["Giulia"], arriva: arriva(2), prima: conta, riapri: { prima: conta }, salva: 650,
      comincia: async function (C, P) {
        await regola(P, /^Una mano$/);
        if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go") || W.clicca(P, /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
        if (!await W.aspetta(function () { return stDi("Paky") && stato(W.finestra("Giulia")) === "gioco"; }, 10000)) no("non si arriva al tavolo");
      },
      fase: function (v) { return v.t === "inCorso"; },
      prepara: async function () {
        // si gioca finché qualcuno prende (la presa si sta guardando: H.attesa)
        var ok = await giocaFinche(persone, function () { var s = stDi("Paky"); return s && s.giocate >= 3 && s.presa && s.fase === "gioco" && !(s.mani.every(function (m) { return !m.length; })); }, 90000);
        if (!ok) no("nessuna presa da guardare");
        primaS = foto(stDi("Paky"));
      },
      controlla: function () {
        var st = stDi("Paky"); if (!st) return "l'host non ha la partita";
        if (st.presa) return "la presa si sta ancora guardando";
        var f = foto(st); return f === primaS ? true : "la partita è cambiata: " + primaS.slice(0, 80) + " → " + f.slice(0, 80);
      } });
    var C = r.C;
    await carteGiuste(persone, "Paky");
    note.push("ricarica durante una presa: ripresa in " + r.dt + " s, la presa resta fatta, stesse carte e stesso turno");
    // fino alla classifica
    if (!await giocaFinche(persone, function () { var s = stDi("Paky"); return s && s.fase === "fine"; }, 240000)) no("la mano non arriva alla classifica");
    if (!await W.aspetta(function () { return persone.every(function (n) { return stato(W.finestra(n)) === "fine"; }) && W.__partite.Paky === 1 && W.__partite.Giulia === 1; }, 8000))
      no("a fine partita le partite date non sono 1 e 1 (" + JSON.stringify(W.__partite) + ")");
    if (A.contaStoria(C, '"__esito"') !== 1) no("a fine partita gli __esito sono " + A.contaStoria(C, '"__esito"'));
    var punti = JSON.stringify(stDi("Paky").punti);
    await W.dorme(1000);
    var s0 = (W.statoStanza(C) || {})._s;
    await W.ricarica("Paky", { prima: conta });
    if (!await W.aspetta(function () { var s = W.statoStanza(C) || {}, st = stDi("Paky"); return s._s && s._s !== s0 && s._r && st && st.fase === "fine" && stato(W.finestra("Paky")) === "fine"; }, 12000))
      no("ricaricando sulla classifica la classifica non torna (" + (stDi("Paky") ? stDi("Paky").fase : "niente") + ")");
    await W.dorme(2500);
    if (JSON.stringify(stDi("Paky").punti) !== punti) no("sulla classifica ripresa i punti sono cambiati");
    if (W.__partite.Paky !== 1 || W.__partite.Giulia !== 1) no("dopo la ricarica partite date di nuovo: " + JSON.stringify(W.__partite));
    var e2 = A.contaStoria(C, '"__esito"'); if (e2 !== 1) no("dopo la ricarica gli __esito sono " + e2);
    if (stato(W.finestra("Giulia")) !== "fine") no("Giulia non è più sulla classifica");
    if (!/Nuova partita|Rivincita/.test(T(W.finestra("Paky")))) no("sulla classifica ripresa Paky non ha «Nuova partita»");
    errori();
    note.push("classifica ripresa (" + punti + "), partite date 1 e 1, un solo __esito");
    return note.join(" · ");
  } });

  // ---------------- 5so3: la riserva in 4 ----------------
  COPIONE.aggiungi("5so3", { nome: "Scopone · riserva in 4: l'host si spegne, Giulia porta avanti la partita dal suo posto; Paky torna da giocatore; fino alla classifica", fai: async function () {
    W.__partite = {};
    var nomi = ["Paky", "Giulia", "Luca", "Sara"], amici = nomi.slice(1), L = [];
    var P = await W.apriTel("Paky", { x: 0, prima: A.contaPartite("Paky") });
    var C = await W.apriStanza(P, NOME), idsT = { Paky: "host" };
    for (var i = 0; i < amici.length; i++) {
      var n = amici[i], k = i + 2;
      await W.apriTel(n, { hash: "gioco=" + GID + "&stanza=" + C, x: 185 * (i + 1), prima: A.contaPartite(n) });
      if (!await W.aspetta(function () { return (vm(C).seggi || []).filter(Boolean).length >= k; }, 10000)) no(n + " non entra in saletta");
      idsT[n] = A.mioId(n);
      await W.dorme(300);
    }
    await regola(P, /^Una mano$/);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go") || W.clicca(P, /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    if (!await W.aspetta(function () { return stDi("Paky") && amici.every(function (n) { return stato(W.finestra(n)) === "gioco"; }); }, 10000)) no("non tutti al tavolo");
    var st0 = stDi("Paky"); if ([0, 1, 2, 3].some(function (s) { return HS("Paky").H.bot[s]; })) no("in 4 c'è un Bot al tavolo");
    var sG = posto(st0, "Giulia");
    if (!await giocaFinche(nomi, function () { var s = stDi("Paky"); return s && s.giocate >= 8; }, 60000)) no("non si giocano 8 carte");
    // ci si ferma quando tocca a Luca o a Sara (non a Paky: il suo posto aspetta lui)
    if (!await W.aspetta(function () { var s = stDi("Paky"); return s && s.fase === "gioco" && !s.presa && !HS("Paky").H.attesa && (s.nomi[s.turno] === "Luca" || s.nomi[s.turno] === "Sara"); }, 1000)) {
      if (!await giocaFinche(nomi, function () { var s = stDi("Paky"); return s && s.fase === "gioco" && !s.presa && !HS("Paky").H.attesa && (s.nomi[s.turno] === "Luca" || s.nomi[s.turno] === "Sara"); }, 30000)) no("non arriva il turno di Luca o Sara");
    }
    await W.dorme(1800);   // (la copia ai vice: al massimo una al secondo)
    var a = foto(stDi("Paky")), t0 = Date.now();
    var sent = (function () {
      var visti = [];
      var id = setInterval(function () { amici.forEach(function (n) { var w = W.finestra(n); if (!w || !w.document || !w.document.body) return; var m = W.testo(w).match(/Collegamento perso|La stanza è chiusa|ha chiuso la/); if (m && visti.indexOf(n + ": " + m[0]) < 0) visti.push(n + ": " + m[0]); }); }, 150);
      return { stop: function () { clearInterval(id); return visti; } };
    })();
    // ---- Paky si spegne del tutto ----
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === idsT.Giulia; }, 8000)) no("dopo 8 s la partita non la tiene Giulia (" + JSON.stringify(A.chiTiene(C)) + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    var pg = await A.pilloleDi(["Giulia"], /porti avanti tu/, 3000), pa = await A.pilloleDi(["Luca", "Sara"], /Ora la partita la tiene Giulia/, 4000);
    if (!pg.Giulia) no("Giulia non legge «… la porti avanti tu» («" + pill(W.finestra("Giulia")) + "»)");
    if (!pa.Luca || !pa.Sara) no("gli amici non leggono «Ora la partita la tiene Giulia» (" + JSON.stringify(pa) + ")");
    L.push("Giulia tiene la partita in " + dt + " s");
    // la partita di Giulia: dal suo posto, stesse carte, stesso tavolo e turno; il posto di Paky resta suo
    if (!await W.aspetta(function () { return HS("Giulia") && stDi("Giulia"); }, 4000)) no("sul telefono di Giulia non c'è la partita");
    var G = HS("Giulia");
    if (G.io !== idsT.Giulia) no("Giulia tiene la partita col nome «" + G.io + "»");
    if (G.mio() !== sG) no("Giulia tiene la partita dal posto " + G.mio() + " invece che dal suo (" + sG + ")");
    if (foto(stDi("Giulia")) !== a) no("con Giulia la partita è cambiata: " + a.slice(0, 80) + " → " + foto(stDi("Giulia")).slice(0, 80));
    if (G.H.posti[0] !== "host" || G.H.bot[0]) no("il posto di Paky non aspetta lui (" + G.H.posti[0] + ", Bot " + G.H.bot[0] + ")");
    await carteGiuste(amici, "Giulia", 8000);
    L.push("Giulia gioca dal suo posto (" + sG + "), stesse carte e stesso turno");
    // ---- si gioca senza Paky (il suo turno aspetta), poi Paky torna (l'app era solo in secondo piano) ----
    await giocaFinche(amici, function () { return Date.now() - t0 > 10000; }, 15000);
    var t1 = Date.now();
    A.torna("Paky");
    var pp = await A.pilloleDi(["Paky"], /Bentornato.*Giulia.*rientri come giocatore/, 9000);
    if (!pp.Paky) no("Paky non legge «👋 Bentornato! Ora la partita la tiene Giulia…» («" + pill(W.finestra("Paky")) + "»)");
    var ok = await W.aspetta(function () {
      var st = stDi("Giulia"), w = W.finestra("Paky");
      return st && w && stato(w) === "gioco" && manoDi(w) === ids(st.mani[0]) && !HS("Giulia").H.bot[0] && st.nomi[0] === "Paky";
    }, 20000);
    if (!ok) no("Paky non rientra al suo posto con le sue carte («" + T(W.finestra("Paky")).slice(0, 80) + "»)");
    L.push("Paky torna e rientra al suo posto con le sue carte");
    // ---- fino alla classifica ----
    if (!await giocaFinche(nomi, function () { var s = stDi("Giulia"); return s && s.fase === "fine"; }, 240000)) no("la partita tenuta da Giulia non arriva alla classifica");
    await W.dorme(3500);
    var altre = A.fotoDa(C, t1 + 2500).filter(function (x) { return x.h !== idsT.Giulia; });
    if (altre.length) no("dopo il ritorno di Paky ci sono foto di un altro host: " + JSON.stringify(altre.slice(0, 3)));
    var c = A.chiTiene(C); if (c.g !== 2 || c.h !== idsT.Giulia) no("alla fine la partita non la tiene più Giulia (" + JSON.stringify(c) + ")");
    if (!nomi.every(function (n) { return stato(W.finestra(n)) === "fine"; })) no("non tutti vedono la classifica (" + nomi.map(function (n) { return n + " " + stato(W.finestra(n)); }).join(", ") + ")");
    if (!await W.aspetta(function () { return /Nuova partita|Rivincita/.test(T(W.finestra("Giulia"))); }, 15000)) no("Giulia (tiene la partita) non vede la classifica con «Nuova partita»");
    nomi.forEach(function (n) { if ((W.__partite || {})[n] !== 1) no("partite (XP) date: " + JSON.stringify(W.__partite) + " (" + n + " doveva averne 1)"); });
    var es = (W.BR.storia || []).filter(function (x) { return x.topic.indexOf("/" + C + "/stato") >= 0 && x.p.indexOf('"__esito"') >= 0; });
    if (es.length !== 1 || es[0].da !== "Giulia") no("gli __esito sono " + es.length + " (" + es.map(function (x) { return x.da; }).join(", ") + "): doveva essere 1, di Giulia");
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    // «Nuova partita»: tutti nella saletta, Giulia al posto 0 con la corona, Paky seduto da amico
    W.clicca(W.finestra("Giulia"), /Nuova partita/, ".fine-tasti button, .piede button");
    if (!await W.aspetta(function () { var v = vm(C), s = (v.seggi || []); return v.t === "lobby" && s[0] && s[0].id === idsT.Giulia && s.some(function (x) { return x && x.id === "host"; }); }, 8000))
      no("dopo «Nuova partita» la saletta non ha Giulia al posto 0 e Paky seduto (" + JSON.stringify(vm(C).seggi || null).slice(0, 160) + ")");
    errori();
    L.push("classifica; XP una volta a testa, un __esito di Giulia, mai due host; «Nuova partita»: Giulia al posto 0, Paky seduto");
    return L.join(" · ");
  } });

  // ---------------- 5so4: la riserva quando il vice è uno che guarda ----------------
  COPIONE.aggiungi("5so4", { nome: "Scopone · riserva tenuta da chi guarda: Giulia esce, Paky si spegne, Marco (che guardava) porta avanti la partita guardando; Paky torna al suo posto", fai: async function () {
    W.__partite = {};
    var L = [];
    var P = await W.apriTel("Paky", { x: 0, prima: A.contaPartite("Paky") });
    var C = await W.apriStanza(P, NOME);
    await W.apriTel("Giulia", { hash: "gioco=" + GID + "&stanza=" + C, x: 185, prima: A.contaPartite("Giulia") });
    if (!await W.aspetta(function () { return (vm(C).seggi || []).filter(Boolean).length >= 2; }, 10000)) no("Giulia non entra in saletta");
    await regola(P, /^Una mano$/);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go") || W.clicca(P, /Comincia/); }, 5000)) no("l'host non ha «Comincia»");
    if (!await W.aspetta(function () { return stDi("Paky") && stato(W.finestra("Giulia")) === "gioco"; }, 10000)) no("non si arriva al tavolo");
    var M = await W.apriTel("Marco", { hash: "gioco=" + GID + "&stanza=" + C, x: 370, prima: A.contaPartite("Marco") });
    if (!await W.aspetta(function () { return /Guardi le carte di/.test(T(M)); }, 10000)) no("Marco non guarda la partita");
    var idM = A.mioId("Marco"), sG = posto(stDi("Paky"), "Giulia");
    if (!await giocaFinche(["Paky", "Giulia"], function () { var s = stDi("Paky"); return s && s.giocate >= 5; }, 40000)) no("non si giocano 5 carte");
    // Giulia esce: al suo posto un Bot. Al tavolo resta solo Paky: il vice è Marco (guarda)
    W.reteDi("Giulia").chiudi();
    if (!await W.aspetta(function () { return HS("Paky").H.bot[sG]; }, 30000)) no("uscita Giulia, al suo posto non gioca un Bot");
    if (!await giocaFinche(["Paky"], function () { var s = stDi("Paky"); return s && s.fase === "gioco" && !s.presa && !HS("Paky").H.attesa && s.turno !== 0; }, 30000)) no("non arriva il turno di un Bot");
    await W.dorme(1800);   // (la copia ai vice)
    var t0 = Date.now(), mani0 = stDi("Paky").mani.map(ids).join("|");
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === idM; }, 10000)) no("dopo 10 s la partita non la tiene Marco (" + JSON.stringify(A.chiTiene(C)) + ")");
    L.push("Marco (guarda) tiene la partita in " + ((Date.now() - t0) / 1000).toFixed(1) + " s");
    if (!await W.aspetta(function () { return HS("Marco") && stDi("Marco"); }, 4000)) no("sul telefono di Marco non c'è la partita");
    var MH = HS("Marco");
    if (MH.mio() !== -1) no("Marco si è seduto al posto " + MH.mio() + " invece di tenere la partita guardando");
    if (MH.H.posti[0] !== "host" || MH.H.bot[0]) no("il posto di Paky non aspetta lui");
    if (!await W.aspetta(function () { return /Guardi le carte di/.test(T(W.finestra("Marco"))) && !/Tocca a te/.test(T(W.finestra("Marco"))); }, 6000)) no("Marco non vede la partita come chi guarda («" + T(W.finestra("Marco")).slice(0, 80) + "»)");
    var prese0 = W.finestra("Marco").document.querySelector(".sc-prese"); if (prese0) prese0.click();
    var nomeG = null;
    if (!await W.aspetta(function () { var m = T(W.finestra("Marco")).match(/Guardi le carte di ([^\s·]+)/); nomeG = m && m[1]; return nomeG && nomeG !== stDi("Marco").nomi[0]; }, 4000)) no("🔄 non cambia le carte che guarda Marco (" + nomeG + ")");
    // i Bot vanno avanti finché tocca a Paky (il suo turno aspetta lui)
    if (!await W.aspetta(function () { var s = stDi("Marco"); return s && s.giocate > 0 && (s.turno === 0 || s.fase !== "gioco"); }, 30000)) no("con Marco la partita non va avanti");
    L.push("i Bot giocano, Marco guarda (🔄 → " + nomeG + ")");
    while (Date.now() - t0 < 10000) await W.dorme(300);
    A.torna("Paky");
    var pp = await A.pilloleDi(["Paky"], /Bentornato.*Marco.*rientri come giocatore/, 9000);
    if (!pp.Paky) no("Paky non legge «👋 Bentornato! Ora la partita la tiene Marco…» («" + pill(W.finestra("Paky")) + "»)");
    if (!await W.aspetta(function () { var st = stDi("Marco"), w = W.finestra("Paky"); return st && w && stato(w) === "gioco" && manoDi(w) === ids(st.mani[0]); }, 20000)) no("Paky non rientra al suo posto con le sue carte");
    L.push("Paky torna al suo posto");
    if (!await giocaFinche(["Paky"], function () { var s = stDi("Marco"); return s && s.fase === "fine"; }, 240000)) no("la partita tenuta da Marco non arriva alla classifica");
    await W.dorme(3000);
    var c = A.chiTiene(C); if (c.g !== 2 || c.h !== idM) no("alla fine la partita non la tiene più Marco (" + JSON.stringify(c) + ")");
    if (stato(W.finestra("Paky")) !== "fine" || stato(W.finestra("Marco")) !== "fine") no("Paky o Marco non vedono la classifica");
    if ((W.__partite || {}).Paky !== 1) no("partite (XP) date: " + JSON.stringify(W.__partite) + " (Paky doveva averne 1)");
    var es = (W.BR.storia || []).filter(function (x) { return x.topic.indexOf("/" + C + "/stato") >= 0 && x.p.indexOf('"__esito"') >= 0; });
    if (es.length !== 1 || es[0].da !== "Marco") no("gli __esito sono " + es.length + " (" + es.map(function (x) { return x.da; }).join(", ") + "): doveva essere 1, di Marco");
    W.clicca(W.finestra("Marco"), /Nuova partita/, ".fine-tasti button, .piede button");
    if (!await W.aspetta(function () { var v = vm(C), s = (v.seggi || []); return v.t === "lobby" && s[0] && s[0].id === idM && s.some(function (x) { return x && x.id === "host"; }); }, 8000))
      no("dopo «Nuova partita» la saletta non ha Marco al posto 0 e Paky seduto (" + JSON.stringify(vm(C).seggi || null).slice(0, 160) + ")");
    errori();
    L.push("classifica, XP a Paky una volta, un __esito di Marco; «Nuova partita»: Marco al posto 0, Paky seduto");
    return L.join(" · ");
  } });

  COPIONE.gruppo5so = async function () { var out = {}; for (var n of ["5so1", "5so2", "5so3", "5so4"]) out[n] = await COPIONE.prova(n); return out; };
})();

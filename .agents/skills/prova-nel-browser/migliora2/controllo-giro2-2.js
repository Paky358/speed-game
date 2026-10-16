// PROVE DEL CONTROLLO (giro 2, seconda parte): i casi cattivi dei miglioramenti g5-g8 che gli autori non hanno provato.
// Uso (dopo copione-prova.js): await COPIONE.carica("migliora2/controllo-giro2-2.js"); await COPIONE.prova("cg1")  (… "cg5")
//
// cg1 Asta online in 3, 🧨: chi è di turno sulla carta maledetta SPEGNE il telefono. Allo scadere se la prende lui (non si blocca),
//     dopo 20 s è fuori; si arriva ai kit, «⏩ Avanti» conta solo chi c'è, voto e classifica; riacceso, rientra senza errori.
// cg2 Ruota online in 3 (Luca vince la frase lampo): Luca cade sul ❓ Mistero, chiama la consonante giusta e, sulla scelta
//     «Apri / Mi tengo», SPEGNE il telefono: la partita non resta ferma (tocca a un altro), riacceso rientra; partita fino alla fine.
// cg3 Scopa 2 vs 2 online in 4 con 🤫 + Bea che arriva a partita cominciata e guarda (niente tasto 🤫, mai la frase);
//     Marco (compagno di Giulia) spegne → Bot → Giulia senza 🤫; Marco riacceso torna al suo posto → Giulia ritrova il 🤫.
// cg4 Poker online in 3, Torneo con «💣 1 ogni 5»: alla Mano bomba chi è di turno SPEGNE il telefono: la mano va avanti da sola
//     (tempo o uscita), le fiches tornano, la mano dopo parte; riacceso, rientra.
// cg5 Gara di pesca online, 🎯 «Più specie»: Giulia (prima) spegne il telefono a metà gara e non torna in tempo; la classifica
//     finale segue l'obiettivo e Luca (ricaricato) la legge; 360x640.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T, no = A.no;

  function tocca(w, b) {
    var Ev = w.PointerEvent || w.MouseEvent;
    ["pointerdown", "pointerup"].forEach(function (tipo) { b.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 5, pointerType: "touch", isPrimary: true })); });
    b.click();
  }
  function errori() { return W.erroriTel().filter(function (e) { return !/\.jpg|favicon/.test(e); }); }
  function senzaErrori(cosa) { var e = errori(); if (e.length) no((cosa ? cosa + ": " : "") + "errori: " + e.slice(0, 3).join(" | ")); }
  function senzaAnim(w) { var st = w.document.createElement("style"); st.textContent = ".schermata,.as-mal-carta,.s2-riga{animation:none!important}.st-barra,.ru-mist,.ru-form{transition:none!important}"; w.document.head.appendChild(st); }
  function spiaVibra(w) { w.__vibra = w.__vibra || []; try { w.navigator.vibrate = function (x) { w.__vibra.push(x); return true; }; } catch (e) {} }
  async function tel(nome, o) { var w = await W.apriTel(nome, Object.assign({ prima: spiaVibra }, o || {})); senzaAnim(w); return w; }
  function chip(w, re) { var b = [].find.call(w.document.querySelectorAll(".modo-chip"), function (x) { return re.test(x.textContent) && x.offsetParent !== null; }); if (b) b.click(); return !!b; }
  function chipDopo(w, etichetta, re) {
    var et = [].find.call(w.document.querySelectorAll(".etichetta"), function (x) { return etichetta.test(x.textContent) && x.offsetParent !== null; }); if (!et) no("non trovo «" + etichetta + "»");
    var riga = et.nextElementSibling, b = riga && [].find.call(riga.querySelectorAll(".modo-chip"), function (x) { return re.test(x.textContent); });
    if (!b) no("sotto «" + et.textContent + "» non c'è " + re); b.click();
  }
  async function apriOnline(P, nomeGioco, prepara) {
    var tess = await W.aspetta(function () { return A.tessera(P, nomeGioco); }, 6000); if (!tess) no("non trovo la tessera " + nomeGioco);
    tess.click(); await W.dorme(300);
    if (!W.clicca(P, /apro io/)) no("non trovo «Online: apro io» in " + nomeGioco);
    await W.dorme(300);
    if (prepara) { prepara(P); await W.dorme(150); }
    if (!W.clicca(P, /Apri la stanza/)) no("non trovo «Apri la stanza»");
    var C = await W.aspetta(function () { return A.codiceSaletta(P); }, 6000); if (!C) no("la stanza non ha il codice");
    return C;
  }
  async function misura(nome, cosa, sel) {
    var f = document.getElementById("tel-" + nome), w = W.finestra(nome), out = [], M = [[360, 640], [412, 915]];
    for (var i = 0; i < M.length; i++) {
      f.style.width = M[i][0] + "px"; f.style.height = M[i][1] + "px"; void w.document.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
      await W.dorme(600);
      var d = w.document, x = [];
      if (d.scrollingElement.scrollHeight > w.innerHeight + 2) x.push("la pagina scorre (" + d.scrollingElement.scrollHeight + ")");
      (sel || []).forEach(function (s) {
        var el = d.querySelector(s); if (!el) return;
        var r = el.getBoundingClientRect();
        if (r.width > 0 && (r.left < -1 || r.top < -1 || r.right > w.innerWidth + 1 || r.bottom > w.innerHeight + 1)) x.push(s + " fuori schermo");
      });
      if (x.length) out.push(cosa + " a " + M[i][0] + "x" + M[i][1] + ": " + x.join(", "));
    }
    f.style.width = "360px"; f.style.height = "740px"; w.dispatchEvent(new w.Event("resize")); await W.dorme(150);
    return out;
  }

  // ======================================================== cg1: Asta, 🧨 e il telefono spento
  COPIONE.aggiungi("cg1", { nome: "Asta online in 3, 🧨: chi è di turno spegne il telefono; si arriva comunque a kit, voto e classifica", fai: async function () {
    var F = {}, note = [];
    var P = F.Paky = await tel("Paky", { x: 0 });
    P.__astaMalProva = { round: 1, quando: 2 };
    try { P.localStorage.removeItem("sg_asta_formato"); } catch (e) {}
    var C = await apriOnline(P, "L'Asta", function (w) { if (!chip(w, /Una volta: si paga/)) no("nel ⚙️ online non c'è «🧨 Sì»"); });
    F.Luca = await tel("Luca", { hash: "gioco=asta&stanza=" + C, x: 185 });
    F.Giulia = await tel("Giulia", { hash: "gioco=asta&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (W.vmDi(C).giocatori || []).length === 3; }, 10000)) no("in saletta non sono in 3");
    await W.dorme(500);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("«Comincia» spento");
    if (!await W.aspetta(function () { var f = W.vmDi(C).fase; return f && f !== "lobby"; }, 15000)) no("la partita non comincia");
    var id = function (n) { return n === "Paky" ? "host" : A.mioId(n); };
    var nomeDi = function (i) { return ["Paky", "Luca", "Giulia"].filter(function (n) { return id(n) === i; })[0]; };
    var spento = null, mal = null, kit = null, fino = Date.now() + 300000;
    while (Date.now() < fino) {
      var v = W.vmDi(C);
      if (v.fase === "voto" || v.fase === "fine") break;
      if (v.fase === "maledetta" && v.mal && !mal) {
        mal = {};
        // l'host paga il suo turno (se tocca a lui) così il turno passa a un amico; poi l'amico di turno spegne il telefono
        if (v.mal.turnoId === "host") {
          var bh = await W.aspetta(function () { return P.document.querySelector(".as-mal-tasti .btn-verde:not([disabled])"); }, 3000);
          if (!bh) no("Paky non ha «💸 Pago»"); tocca(P, bh);
          if (!await W.aspetta(function () { var x = W.vmDi(C).mal; return x && x.turnoId !== "host"; }, 3000)) no("dopo il «Pago» di Paky non tocca a un altro");
        }
        var vs = W.vmDi(C); spento = nomeDi(vs.mal.turnoId);
        W.spegni(spento); mal.t0 = Date.now();
        note.push(spento + " spegne sulla carta maledetta (prezzo " + vs.mal.prezzo + ")");
        if (!await W.aspetta(function () { return W.vmDi(C).fase === "malEsito"; }, 14000)) no("con " + spento + " spento la carta maledetta resta ferma (fase " + W.vmDi(C).fase + ")");
        var E = W.vmDi(C).malEsito;
        if (E.chiNome !== spento || !E.scaduto) no("se la prende " + E.chiNome + " (scaduto " + E.scaduto + "), doveva essere " + spento);
        note.push("dopo " + Math.round((Date.now() - mal.t0) / 1000) + " s se la prende " + E.chiNome);
        continue;
      }
      if (v.fase === "kit" && !kit) {
        kit = {};
        // chi è spento da più di 20 s non c'è più: l'«Avanti» conta solo chi c'è
        var ak = v.avKit || {};
        var presenti = (v.giocatori || []).filter(function (g) { return !g.via; }).length;
        if (ak.tot !== presenti) no("sui kit «Avanti» conta " + ak.tot + " invece di " + presenti);
        var altro = ["Luca", "Giulia"].filter(function (n) { return n !== spento; })[0];
        var b = await W.aspetta(function () { return F[altro].document.querySelector(".as-av-kit .btn:not([disabled])"); }, 4000);
        if (b) tocca(F[altro], b);
        var bp = P.document.querySelector(".as-av-kit .btn:not([disabled])"); if (bp) tocca(P, bp);
        if (!await W.aspetta(function () { return W.vmDi(C).fase === "voto"; }, 4000)) no("con Paky e " + altro + " su «Avanti» non si vota");
        kit.ok = "kit: " + ak.tot + " presenti";
        continue;
      }
      ["Luca", "Giulia"].forEach(function (n) {
        if (n === spento) return;
        var h = W.reteDi(n), i = id(n); if (!h) return;
        if (v.fase === "scelta" && v.sceglieId === i) h.invia({ t: "scegli", idx: 0 });
        if (v.fase === "asta") h.invia({ t: "passa" });
      });
      if (v.fase === "scelta" && v.sceglieId === "host") { var carta = P.document.querySelector(".as-carta:not([disabled])"); if (carta) carta.click(); }
      if (v.fase === "asta") W.clicca(P, /^\s*Passo\s*$/);
      if (v.fase === "esito" || v.fase === "round" || v.fase === "malEsito") W.clicca(P, /Vedi le carte|Avanti ▶/);
      await W.dorme(400);
    }
    if (!mal) no("la carta maledetta non è uscita");
    if (W.vmDi(C).fase !== "voto") no("non si arriva al voto (fase " + W.vmDi(C).fase + ")");
    if (kit) note.push(kit.ok);
    // voto: chi c'è conferma, l'host chiude
    if (!W.clicca(P, /Conferma i voti/)) no("Paky non ha «Conferma i voti»");
    if (!await W.aspetta(function () { return W.clicca(P, /Chiudi il voto/); }, 4000)) no("Paky non ha «Chiudi il voto»");
    if (!await W.aspetta(function () { return W.vmDi(C).fase === "fine"; }, 6000)) no("chiuso il voto non c'è la classifica");
    var cl = W.vmDi(C).classifica || [];
    note.push("classifica: " + cl.map(function (r) { return r.pos + ". " + r.nome + " " + r.punti; }).join(" | "));
    // riacceso: rientra e vede la classifica
    W.riaccendi(spento);
    if (!await W.aspetta(function () { return /Classifica|⭐/.test(T(F[spento])); }, 10000)) no(spento + " riacceso non vede la classifica («" + T(F[spento]).slice(0, 100) + "»)");
    var m = await misura(spento, "la classifica (riacceso)", [".piede .btn"]); if (m.length) no(m.join(" · "));
    senzaErrori();
    return note.join(" · ");
  } });

  // ======================================================== cg2: Ruota, ❓ Mistero e il telefono spento
  function Pdi(h) { return h.__RUOTA && h.__RUOTA.ultima; }
  function tastoR(w, re) { return [].find.call(w.document.querySelectorAll(".ru-azioni button"), function (b) { return re.test(b.textContent) && !b.disabled && !b.hidden && b.getClientRects().length > 0; }) || null; }
  function letteraR(w, L) { return [].find.call(w.document.querySelectorAll(".ru-azioni .ru-btn.lettera"), function (b) { return b.textContent === L && !b.disabled; }) || null; }
  function baseR(ch) { return { "À": "A", "È": "E", "É": "E", "Ì": "I", "Ò": "O", "Ù": "U" }[ch] || ch; }
  function eLR(ch) { return /^[A-ZÀÈÉÌÒÙ]$/.test(ch); }
  async function scriviR(w, frase, tab) {
    for (var i = 0; i < tab.length; i++) { if (tab.charAt(i) !== "_") continue; var b = letteraR(w, baseR(frase.charAt(i))); if (!b) return false; tocca(w, b); await W.dorme(30); }
    var ok = tastoR(w, /✓ Risolvi/); if (!ok) return false; tocca(w, ok); return true;
  }
  function copertaR(P) { return P.frase.split("").map(function (ch) { return eLR(ch) && !P.rivelate[baseR(ch)] ? "_" : ch; }).join(""); }
  var CONS = "BCDFGHJKLMNPQRSTVWXYZ";
  // un pilota semplice: chi è di turno (fra i telefoni dati) risolve subito; la frase lampo la prenota il primo della lista
  async function pilotaR(H, tel, ferma, ms) {
    var fino = Date.now() + (ms || 240000), k0 = "", t0 = 0;
    while (Date.now() < fino) {
      var P = Pdi(H);
      if (!P) { await W.dorme(200); continue; }
      if (ferma && ferma(P)) return P;
      if (P.fase === "fine" || (H.document.querySelector(".classifica") && !H.document.querySelector(".ru-studio"))) return P;
      var f = P.fase, L = P.lampo, att = f === "lampo" ? L && L.chi : ["fintro", "fbusta", "flettere", "frivela", "ftempo", "fesito"].indexOf(f) >= 0 ? P.fin && P.fin.id : P.giocatori[P.turno] && P.giocatori[P.turno].id;
      var w = att && tel[att], k = [f, P.manche, P.giroN, att, Object.keys(P.chiamate).length, L ? L.n + ":" + L.prove : ""].join("|");
      if (k === k0 && Date.now() - t0 < 900) { await W.dorme(120); continue; }
      k0 = k; t0 = Date.now();
      try {
        if (f === "lampo" && L && !L.chi) {
          if (L.n >= 3) { var ids = Object.keys(tel).filter(function (id) { return !L.fuori[id] && P.trova(id) && !P.trova(id).via; });
            if (ids.length) { var wp = tel[ids[0]], np = P.trova(ids[0]).nome; var bp = tastoR(wp, /PRENOTO/) || tastoR(wp, new RegExp("🔔 " + np)); if (bp) tocca(wp, bp); } }
        } else if (!w) {}
        else if (f === "lampo" && L && L.chi) { await W.dorme(300); await scriviR(w, L.frase, P.lampoTab()); }
        else if (f === "gira") { var br = tastoR(w, /💡 Risolvi/); if (br) tocca(w, br); }
        else if (f === "consonante") { var c = P.frase.split("").map(baseR).filter(function (ch) { return CONS.indexOf(ch) >= 0 && !P.chiamate[ch]; })[0]; if (c && letteraR(w, c)) tocca(w, letteraR(w, c)); }
        else if (f === "mistero") tocca(w, tastoR(w, /Mi tengo/));
        else if (f === "sceltaexp") tocca(w, tastoR(w, /Gioco/));
        else if (f === "express") tocca(w, tastoR(w, /Mi fermo/));
        else if (f === "risolvi" || f === "ftempo") { await W.dorme(250); await scriviR(w, P.frase, copertaR(P)); }
        else if (f === "vlettera") { var x = P.frase.split("").map(baseR).filter(function (ch) { return /[A-Z]/.test(ch) && !P.chiamate[ch]; })[0]; if (x && letteraR(w, x)) tocca(w, letteraR(w, x)); }
        else if (f === "vdecidi") tocca(w, tastoR(w, /Risolvo/));
        else if (f === "fbusta") tocca(w, tastoR(w, /✉️ 1/));
        else if (f === "flettere") {
          var cc = CONS.split("").filter(function (ch) { return !P.chiamate[ch]; }).slice(0, 3), vv = "AEIOU".split("").filter(function (ch) { return !P.chiamate[ch]; }).slice(0, 1);
          cc.concat(vv).forEach(function (ch) { var b = letteraR(w, ch); if (b) tocca(w, b); });
          await W.dorme(100); tocca(w, tastoR(w, /Ecco le mie lettere/));
        }
        else if (f === "finemanche") { Object.keys(tel).forEach(function (i) { var b = tastoR(tel[i], /⏩ Avanti/); if (b) tocca(tel[i], b); }); }
      } catch (e) {}
      await W.dorme(250);
    }
    no("la Ruota non arriva dove deve (fase " + (Pdi(H) || {}).fase + ")");
  }
  COPIONE.aggiungi("cg2", { nome: "Ruota online in 3: chi deve scegliere sul ❓ Mistero spegne il telefono; la partita va avanti fino alla fine", fai: async function () {
    var note = [];
    var P = await tel("Paky", { x: 0 });
    var C = await apriOnline(P, "La Ruota della Fortuna");
    var L = await tel("Luca", { hash: "gioco=ruota&stanza=" + C, x: 185 });
    var G = await tel("Giulia", { hash: "gioco=ruota&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (W.vmDi(C).giocatori || []).filter(function (g) { return !g.bot; }).length === 3; }, 12000)) no("alla ruota non sono in 3");
    await W.dorme(500);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("«Comincia» spento");
    var idL = await W.aspetta(function () { return A.mioId("Luca"); }, 3000), idG = A.mioId("Giulia");
    var telM = {}; telM[idL] = L; telM.host = P; telM[idG] = G;   // (Luca prima: prenota per primo e comincia lui)
    // fino a quando Luca, nel Mistero, ha la ruota
    var P0 = await pilotaR(P, telM, function (x) { return x.mist === "on" && x.fase === "gira" && x.giocatori[x.turno].id === idL && x.consonantiNascoste() > 0 && !!tastoR(L, /🎡 Gira/); }, 200000);
    if (P0.fase === "fine") no("la partita è finita senza che Luca girasse nel Mistero");
    note.push("manche " + P0.manche + ": Luca gira nel Mistero");
    var r0 = P.Math.random, g0 = P0.giroN; P.Math.random = function () { return 22.5 / 24; };
    tocca(L, tastoR(L, /🎡 Gira/));
    if (!await W.aspetta(function () { return P0.giroN !== g0 || P0.fase === "girando"; }, 4000)) no("la ruota di Luca non gira");
    await W.aspetta(function () { return P0.fase !== "girando"; }, 9000);
    P.Math.random = r0;
    if (P0.fase !== "consonante" || (P0.spicchi[P0.spicchio] || {}).s !== "mistero") no("la ruota non si è fermata sul Mistero (fase " + P0.fase + ", spicchio " + JSON.stringify(P0.spicchi[P0.spicchio]) + ")");
    var c = P0.frase.split("").map(baseR).filter(function (ch) { return CONS.indexOf(ch) >= 0 && !P0.chiamate[ch]; })[0];
    var bc = await W.aspetta(function () { return letteraR(L, c); }, 3000); if (!bc) no("Luca non trova la lettera " + c);
    tocca(L, bc);
    if (!await W.aspetta(function () { return P0.fase === "mistero"; }, 4000)) no("dopo la consonante giusta non c'è la scelta del Mistero (fase " + P0.fase + ")");
    if (!await W.aspetta(function () { return tastoR(L, /Apri il Mistero/); }, 3000)) no("Luca non ha «❓ Apri il Mistero»");
    var m1 = await misura("Luca", "la scelta del Mistero", [".ru-azioni"]); if (m1.length) no(m1.join(" · "));
    if (!/decide: apre il Mistero/.test(T(G))) no("Giulia non legge «Luca decide: apre il Mistero?»");
    var soldi = P0.trova(idL).soldi, t0 = Date.now();
    W.spegni("Luca");
    if (!await W.aspetta(function () { return P0.fase !== "mistero"; }, 40000)) no("con Luca spento la scelta del Mistero resta ferma");
    note.push("dopo " + Math.round((Date.now() - t0) / 1000) + " s: fase " + P0.fase + ", " + P0.msg);
    if (P0.mres) no("il Mistero si è aperto da solo");
    if (!await W.aspetta(function () { return P0.giocatori[P0.turno].id !== idL || P0.fase === "finemanche"; }, 45000)) no("con Luca spento tocca sempre a lui (fase " + P0.fase + ")");
    if (P0.trova(idL).soldi !== soldi && P0.trova(idL).soldi !== 0) no("i soldi di Luca nella manche sono strani: " + P0.trova(idL).soldi);
    note.push("tocca a " + P0.giocatori[P0.turno].nome + " (Luca via: " + !!P0.trova(idL).via + ")");
    if (P0.trova(idL).via) { var tm = {}; tm.host = P; tm[idG] = G; telM = tm; }
    await W.dorme(1500);
    W.riaccendi("Luca");
    await W.dorme(3000);
    // fino alla fine (Luca, se è rientrato, gioca di nuovo)
    var tm2 = {}; tm2.host = P; tm2[idG] = G; tm2[idL] = L;
    var Pf = await pilotaR(P, tm2, null, 300000);
    note.push("fine: " + (Pf.classifica || []).map(function (x) { return x.nome + " " + x.totale; }).join(", "));
    if (!await W.aspetta(function () { return /Classifica|classifica|vince/.test(T(L)); }, 15000)) no("Luca riacceso non arriva alla classifica («" + T(L).slice(0, 100) + "»)");
    senzaErrori();
    return note.join(" · ");
  } });

  // ======================================================== cg3: Scopa 2 vs 2, 🤫 con chi guarda, spento e riacceso
  function hostS2(P) { return P.__SCOPA2host && P.__SCOPA2host.st(); }
  function statoS(w) {
    var d = w.document;
    if (d.querySelector(".sc-mensola")) return "gioco";
    if (d.querySelector(".sp-tab") || d.querySelector(".s2-riga")) return /Fine mano/.test(T(w)) ? "mano" : "fine";
    if (d.querySelector(".saletta-schermo")) return "lobby";
    return "?";
  }
  function toccaAMe(w) { var p = w.document.querySelector(".sc-prese"); return !!w.document.querySelector(".sp-tocca, .s2-tocca") || !!(p && /tocca a te/.test(p.textContent)); }
  async function giocaUna(w) {
    var c = w.document.querySelector(".sc-mano-riga .sc-carta"); if (!c) return false;
    c.click(); await W.dorme(120);
    for (var i = 0; i < 6; i++) { if (!w.document.querySelector(".sc-mano-riga .sc-carta.sel")) break; var cap = w.document.querySelector(".sc-terra .sc-carta.cap"); if (!cap) break; cap.click(); await W.dorme(90); }
    return true;
  }
  async function giocaFinche(tels, ferma, ms) {
    var fino = Date.now() + (ms || 120000);
    while (Date.now() < fino) {
      if (ferma()) return true;
      for (var i = 0; i < tels.length; i++) if (statoS(tels[i]) === "gioco" && toccaAMe(tels[i])) { await giocaUna(tels[i]); await W.dorme(150); }
      await W.dorme(120);
    }
    return !!ferma();
  }
  function tastoPsst(w) { return w.document.querySelector(".s2-psst:not([hidden]), .sp-psst:not([hidden])"); }
  function fumetti(w) { return [].map.call(w.document.querySelectorAll(".sc-avv .sc-fumetto"), function (f) { return f.textContent; }); }
  async function mandaPsst(w, re) {
    var b = tastoPsst(w); if (!b) no("non c'è il tasto 🤫");
    b.click(); await W.dorme(150);
    var pan = w.document.querySelector(".s2-psst-pan:not([hidden]), .sp-psst-pan:not([hidden])"); if (!pan) no("il pannellino delle frasi non si apre");
    var f = [].find.call(pan.querySelectorAll("button"), function (x) { return re.test(x.textContent); }); if (!f) no("nel pannellino non c'è " + re);
    f.click();
  }
  COPIONE.aggiungi("cg3", { nome: "Scopa 2 vs 2 online: 🤫 con chi guarda (Bea), Marco spento → Bot → riacceso torna e Giulia ritrova il 🤫", fai: async function () {
    var note = [];
    var P = await tel("Paky", { x: 0 });
    var C = await apriOnline(P, "Scopa 2 vs 2", function (w) { chipDopo(w, /Messaggio al compagno/, /^Sì$/); });
    var G = await tel("Giulia", { hash: "gioco=scopa2v2&stanza=" + C, x: 185 });
    var L = await tel("Luca", { hash: "gioco=scopa2v2&stanza=" + C, x: 370 });
    var M = await tel("Marco", { hash: "gioco=scopa2v2&stanza=" + C, x: 555 });
    if (!await W.aspetta(function () { return (A.vm(C).seggi || []).filter(Boolean).length === 4; }, 12000)) no("in saletta non sono in 4");
    await W.dorme(400);
    if (!W.clicca(P, /Comincia/, ".sl-go") && !W.clicca(P, /Comincia/)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return hostS2(P) && [P, G, L, M].every(function (x) { return statoS(x) === "gioco"; }); }, 10000)) no("non tutti arrivano al tavolo");
    // Bea arriva a partita cominciata: guarda, niente 🤫
    var B = await tel("Bea", { hash: "gioco=scopa2v2&stanza=" + C, x: 740 });
    await W.dorme(2500);
    var tB = T(B);
    if (tastoPsst(B)) no("Bea (arrivata tardi) ha il tasto 🤫");
    note.push("Bea vede: «" + tB.slice(0, 70) + "»");
    // Marco manda un 🤫 a Giulia: Bea non legge la frase
    await mandaPsst(M, /Lascia, ci penso io/);
    if (!await W.aspetta(function () { return fumetti(G).some(function (f) { return /ci penso io/.test(f); }); }, 3000)) no("Giulia non legge la frase di Marco");
    if (/ci penso io/.test(T(B)) || /ci penso io/.test(T(P)) || /ci penso io/.test(T(L))) no("la frase la legge anche chi non è il compagno");
    // Marco spegne > 20 s: Bot al suo posto, Giulia senza 🤫
    W.spegni("Marco");
    if (!await W.aspetta(function () { return hostS2(P).nomi[3] !== "Marco"; }, 40000)) no("al posto di Marco non gioca un Bot");
    if (!await W.aspetta(function () { return !tastoPsst(G); }, 4000)) no("Giulia ha ancora il tasto 🤫 col compagno Bot");
    note.push("Marco → " + hostS2(P).nomi[3]);
    // si gioca un po' (il Bot gioca per Marco)
    var n0 = hostS2(P).mani ? JSON.stringify(hostS2(P).mani.map(function (m) { return m.length; })) : "";
    await giocaFinche([P, G, L], function () { return hostS2(P).fase !== "gioco" || JSON.stringify(hostS2(P).mani.map(function (m) { return m.length; })) !== n0; }, 30000);
    // Marco riaccende: torna al suo posto, Giulia ritrova il 🤫
    W.riaccendi("Marco");
    if (!await W.aspetta(function () { return hostS2(P).nomi[3] === "Marco"; }, 15000)) no("Marco riacceso non torna al suo posto (" + hostS2(P).nomi[3] + ")");
    if (hostS2(P).fase === "gioco") {
      if (!await W.aspetta(function () { var b = tastoPsst(G); return b && /🤫 2/.test(b.textContent); }, 6000)) no("Marco è tornato ma Giulia non ritrova «🤫 2» (" + ((tastoPsst(G) || {}).textContent) + ")");
      if (!await W.aspetta(function () { var b = tastoPsst(M); return b && /🤫 1/.test(b.textContent); }, 6000)) no("Marco tornato non ritrova «🤫 1» (" + ((tastoPsst(M) || {}).textContent) + ")");
    } else note.push("(la mano è finita mentre Marco era via)");
    // fino al riepilogo: Bea ha il conto ma non «⏩ Avanti»
    if (!await giocaFinche([P, G, L, M], function () { return hostS2(P).fase !== "gioco"; }, 180000)) no("la mano non finisce");
    if (hostS2(P).fase === "fineround") {
      await W.dorme(800);
      if (B.document.querySelector(".s2-avanti button")) no("Bea (guarda) ha «⏩ Avanti»");
      var bM = M.document.querySelector(".s2-avanti button"); if (!bM) no("Marco (tornato) non ha «⏩ Avanti»");
      var m = await misura("Bea", "il riepilogo di chi guarda", [".piede .btn"]); if (m.length) no(m.join(" · "));
    }
    senzaErrori();
    return note.join(" · ");
  } });

  // ======================================================== cg4: Poker, Mano bomba col telefono spento
  function pkIo(v, id) { return (v.players || []).filter(function (p) { return p.id === id; })[0] || null; }
  function somma(v) { return (v.players || []).reduce(function (s, p) { return s + p.stack; }, 0) + (v.piatto || 0); }
  function pkOsp(nome, v, tipo, tot) { var h = W.reteDi(nome); if (h) h.invia({ t: "azione", tipo: tipo, tot: tot || 0, n: v.n, st: v.stato, dc: v.daChiamare }); }
  async function pkPassa(C, P, nomi, finche, ms) {   // tutti passano o chiamano (l'host dal suo telefono), finché finche(v)
    var fino = Date.now() + (ms || 60000), fatto = {};
    while (Date.now() < fino) {
      var v = A.vm(C);
      if (finche(v)) return v;
      var k = v.n + "|" + v.stato + "|" + v.turno + "|" + v.daChiamare;
      if (v.fase === "gioco" && v.turno && !fatto[k]) {
        if (v.turno === "host") { var b = P.document.querySelector(".pk-azioni .pk-btn.passa"); if (b) { b.click(); fatto[k] = 1; } }
        else if (nomi[v.turno]) { var io = pkIo(v, v.turno); if (io) { pkOsp(nomi[v.turno], v, Math.max(0, v.daChiamare - io.inGiro) === 0 ? "passa" : "chiama"); fatto[k] = 1; } }
      }
      await W.dorme(200);
    }
    return A.vm(C);
  }
  COPIONE.aggiungi("cg4", { nome: "Poker online in 3, torneo «💣 1 ogni 5»: alla Mano bomba chi è di turno spegne; la mano va avanti e la dopo parte", fai: async function () {
    var note = [];
    var P = await tel("Paky", { x: 0 });
    var C = await apriOnline(P, "Poker");
    await tel("Giulia", { hash: "gioco=poker&stanza=" + C, x: 185 });
    var L = await tel("Luca", { hash: "gioco=poker&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (A.vm(C).players || []).length === 3; }, 10000)) no("al tavolo non arrivano in 3");
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/, ".sl-regole, button"); }, 5000)) no("non trovo ⚙️ Regole");
    await W.dorme(300);
    W.clicca(P, /Fiches uguali/, ".sl-foglio .modo-chip"); await W.dorme(150);
    if (!W.clicca(P, /^1 ogni 5$/, ".sl-foglio .modo-chip")) no("non trovo «1 ogni 5»");
    await W.dorme(150);
    W.clicca(P, /Fatto|Ok/, ".sl-foglio button"); await W.dorme(600);
    if (!await W.aspetta(function () { return A.vm(C).torneo && A.vm(C).torneo.bomba === 5; }, 4000)) no("la foto non ha il torneo con la bomba");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 4000)) no("non trovo «Comincia»");
    if (!await W.aspetta(function () { return A.vm(C).fase === "gioco" && A.vm(C).n >= 1; }, 6000)) no("la partita non comincia");
    var nomi = {}; nomi[A.mioId("Giulia")] = "Giulia"; nomi[A.mioId("Luca")] = "Luca";
    var n1 = A.vm(C).n, tot = somma(A.vm(C));
    var vb = await pkPassa(C, P, nomi, function (v) { return v.bomba && v.n === n1 + 4 && v.stato === "flop"; }, 150000);
    if (!vb.bomba) no("non si arriva alla Mano bomba (mano " + vb.n + ")");
    // chi è di turno (se è l'host passa, poi tocca a un amico) spegne
    vb = await pkPassa(C, P, nomi, function (v) { return v.turno && v.turno !== "host"; }, 20000);
    var chi = nomi[vb.turno]; if (!chi) no("alla Mano bomba non tocca a un amico");
    var idChi = vb.turno, restoChi = pkIo(vb, idChi).stack;   // (se esce dal torneo le sue fiches escono con lui)
    W.spegni(chi); var t0 = Date.now();
    note.push(chi + " spegne alla Mano bomba (mano " + vb.n + ", piatto " + vb.piatto + ")");
    var altri = {}; Object.keys(nomi).forEach(function (k) { if (nomi[k] !== chi) altri[k] = nomi[k]; });
    var vf = await pkPassa(C, P, altri, function (v) { return v.n > vb.n && v.stato !== "finemano" && v.fase === "gioco"; }, 90000);
    if (!(vf.n > vb.n)) no("con " + chi + " spento la Mano bomba non finisce (stato " + vf.stato + ")");
    note.push("mano dopo partita in " + Math.round((Date.now() - t0) / 1000) + " s (n " + vf.n + ", bomba " + (vf.bomba || 0) + ")");
    var ancora = pkIo(vf, idChi);
    note.push(chi + (ancora ? " ancora al tavolo (" + ancora.stack + ")" : " fuori dal torneo con " + restoChi));
    if (somma(vf) + (ancora ? 0 : restoChi) !== tot) no("le fiches non tornano dopo la Mano bomba (" + somma(vf) + " + " + (ancora ? 0 : restoChi) + " invece di " + tot + ")");
    W.riaccendi(chi);
    var w = W.finestra(chi);
    if (!await W.aspetta(function () { return w.document.querySelector(".pk-tavolo"); }, 10000)) no(chi + " riacceso non vede il tavolo");
    var m = await misura(chi, "il tavolo (riacceso)", [".pk-tavolo"]); if (m.length) no(m.join(" · "));
    senzaErrori();
    return note.join(" · ");
  } });

  // ======================================================== cg5: Gara di pesca, 🎯 più specie con chi spegne
  COPIONE.aggiungi("cg5", { nome: "Gara di pesca online, 🎯 più specie: la prima spegne a metà e non torna; classifica secondo l'obiettivo, chi ricarica la legge", fai: async function () {
    await COPIONE.carica("passo2/gruppo-c.js");
    var P = await tel("Paky", { x: 0, fintiC: true });
    P.__imp = { durata: 30 };
    var tess = await W.aspetta(function () { return A.tessera(P, "Gara di pesca"); }, 6000); tess.click(); await W.dorme(300);
    if (!W.clicca(P, /apro io/, ".modo-grande")) no("non c'è «Online: apro io»");
    await W.dorme(300);
    if (!chip(P, /Più specie/)) no("nel ⚙️ non c'è «Più specie»");
    if (!W.clicca(P, /Apri la stanza/)) no("non c'è «Apri la stanza»");
    var C = await W.aspetta(function () { return A.codiceSaletta(P); }, 6000); if (!C) no("niente codice");
    var L = await tel("Luca", { hash: "gioco=garapesca&stanza=" + C, x: 185 });
    var G = await tel("Giulia", { hash: "gioco=garapesca&stanza=" + C, x: 370 });
    if (!await W.aspetta(function () { return (W.vmDi(C).players || []).length === 3; }, 10000)) no("in saletta non sono in 3");
    await W.dorme(400);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return W.vmDi(C).fase === "gioco"; }, 15000)) no("la gara non comincia");
    var Ls = P.SGPesca.PESCI.filter(function (s) { return s.r < 4; });
    // Giulia: 3 specie (prima); Luca: 2 specie ma più chili
    [0, 1, 2].forEach(function (i) { W.reteDi("Giulia").invia({ t: "preso", id: Ls[i].id, cm: Ls[i].cm[0], k: "g" + i }); });
    var gross = Ls.slice().sort(function (a, b) { return P.SGPesca.pesoKg(b, b.cm[1]) - P.SGPesca.pesoKg(a, a.cm[1]); });
    W.reteDi("Luca").invia({ t: "preso", id: gross[0].id, cm: gross[0].cm[1], k: "l0" }); W.reteDi("Luca").invia({ t: "preso", id: gross[1].id, cm: gross[1].cm[1], k: "l1" });
    await W.dorme(900);
    var cl0 = [].map.call(P.document.querySelectorAll(".pe-classi .pe-cl"), function (x) { return x.textContent; });
    if (!/^1\. Giulia · 🐠 3 specie/.test(cl0[0] || "")) no("in alto: " + cl0.join(" | "));
    W.spegni("Giulia");
    L = await W.ricarica("Luca"); senzaAnim(L);
    if (!await W.aspetta(function () { return W.vmDi(C).fase === "fine"; }, 45000)) no("la gara non finisce");
    var cl = W.vmDi(C).classifica || [];
    var rG = cl.filter(function (r) { return r.nome === "Giulia"; })[0], rL = cl.filter(function (r) { return r.nome === "Luca"; })[0];
    if (!rL || !rG) no("in classifica mancano Giulia o Luca: " + JSON.stringify(cl));
    if (!(rG.uscito ? rL.pos < rG.pos : rG.pos < rL.pos)) no("classifica strana: " + cl.map(function (r) { return r.pos + " " + r.nome + (r.uscito ? " (uscita)" : "") + " " + r.sp + "sp"; }).join(", "));
    await W.dorme(2600);
    var tf = await W.aspetta(function () { return /Classifica della gara/.test(T(L)) && T(L); }, 8000);
    if (!tf || !/🎯 Più specie diverse/.test(tf) || !/🐠 \d specie · /.test(tf)) no("la classifica finale di Luca: «" + (tf || T(L)).slice(0, 200) + "»");
    var m = await misura("Luca", "la classifica finale", [".piede .btn"]); if (m.length) no(m.join(" · "));
    senzaErrori();
    return "classifica: " + cl.map(function (r) { return r.pos + ". " + r.nome + " " + r.sp + " specie " + r.kg + " kg" + (r.uscito ? " 🚪" : ""); }).join(" | ");
  } });
})();

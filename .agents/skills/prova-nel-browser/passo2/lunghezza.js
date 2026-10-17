// PROVE di «Stessa Lunghezza d'Onda» (id lunghezza) coi telefoni finti, dalla Sala.
// Uso (dopo aver caricato copione-prova.js): await COPIONE.carica("passo2/lunghezza.js"); await COPIONE.prova(280)
// 280: 3 telefoni senza squadre (Cosa ne pensi?): partita intera, chi indovina ricarica, il sensitivo ricarica mentre piazza
//      (ritrova il bersaglio), il sensitivo spento (tempo fermo, poi torna), Rivincita col 3-2-1, Cambia gioco.
// 281: 4 telefoni a squadre (Cosa ne pensi?, a 7): lancetta comune contesa da due (uno solo la tiene, l'altro vede
//      «✋ Giulia»), conferme che si spengono se qualcuno sposta, scommessa, partita intera; l'host ricarica (la partita riprende).
// 282: 6 telefoni a squadre, Classico: due scale, indizio con la parola della scala rifiutato, uno spento più di 20 s
//      (si continua; quando torna rientra al suo posto), il sensitivo che esce (turno saltato).
// 283: chi arriva a partita cominciata guarda (niente tasti) ed entra alla Rivincita; Misto con «✏️ La scelgo io».
// 284: sullo stesso telefono: a squadre (con la scommessa) e tutti insieme (7 turni e il voto).
// 285: le misure: 360x640 e 412x915 senza scorrere in ogni passo (sensitivo, chi indovina, scommessa, rivelazione).
// 286: attacchi con 5 telefoni a squadre: spia di tutti i messaggi (il bersaglio mai in chiaro prima della rivelazione),
//      due dita a raffica e uno che tiene il dito fermo (tutti vedono la lancetta uguale), conferme a raffica, ricariche, spento nella rivelazione.
// 287: 6 telefoni ognuno per sé, Classico: uno spento senza bloccare (dopo 20 s esce e il turno si chiude), lancette degli altri a chi ha bloccato.
// 288: 6 a squadre, escono in tre uno dopo l'altro: squadre rifatte, poi ognuno per sé, fino alla fine.
// 289: misure ognuno per sé con 6 telefoni (avatar sul bordo) e la classifica finale.
// Ogni scenario dura più di 45 s: lancialo senza aspettarlo (window.__run = COPIONE.prova(n)) e poi leggi COPIONE.esiti.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T, vm = A.vm, ids = A.ids;
  var NOME = "Stessa Lunghezza d'Onda";

  // ---- aiuti ----
  // il dito sul quadrante di un telefono: v da 0 a 100 (su: false = il dito resta giù)
  async function trascina(w, v, su) {
    var d = w.document.querySelector(".lu-dial"); if (!d) return false;
    var r = d.getBoundingClientRect(), s = Math.min(r.width / 200, r.height / 112), ox = (r.width - 200 * s) / 2, oy = r.height - 112 * s;
    var px = r.left + ox + 100 * s, py = r.top + oy + 104 * s, a = (-90 + v * 1.8) * Math.PI / 180, R = 80 * s;
    var o = { bubbles: true, cancelable: true, pointerId: 1, clientX: px + R * Math.sin(a), clientY: py - R * Math.cos(a), isPrimary: true };
    if (su !== "muovi") d.dispatchEvent(new w.PointerEvent("pointerdown", o));
    await W.dorme(20); d.dispatchEvent(new w.PointerEvent("pointermove", o));
    if (su !== false && su !== "muovi") { await W.dorme(20); d.dispatchEvent(new w.PointerEvent("pointerup", o)); }
    return true;
  }
  function tocca(w, re) { return W.clicca(w, re, ".lu-pan button, .lu-carta"); }
  function nomeId(C, id) { var p = (vm(C).players || []).filter(function (x) { return x.id === id; })[0]; return p ? p.nome : null; }
  function tel(C, id) { var n = nomeId(C, id); return n ? W.finestra(n) : null; }
  function caso(a, b) { return Math.round(a + Math.random() * (b - a)); }
  // un turno giocato da tutti (opz: { scrivo, indizio, saltaPiazza })
  async function giocaPasso(C, opz) {
    opz = opz || {};
    var v = vm(C), sq = v.formula === "squadre", wS = tel(C, v.sens), P = W.finestra("Paky");
    if (v.fase !== "gioco") return false;
    if (v.passo === "sceglie" && !v.pausa && wS) {
      if (v.modo === "classico") {
        if (v.sub === "scala") { await W.aspetta(function () { return wS.document.querySelector(".lu-carta"); }, 3000); var c = wS.document.querySelector(".lu-carta"); if (c) c.click(); await W.aspetta(function () { return vm(C).sub === "indizio"; }, 3000); return true; }
        if (v.sub === "indizio") {
          var campo = await W.aspetta(function () { return wS.document.querySelector(".lu-campo"); }, 3000); if (!campo) return false;
          campo.value = opz.indizio || ("Indizio " + v.turno); tocca(wS, /Fatto/); await W.aspetta(function () { return vm(C).passo !== "sceglie"; }, 3000); return true;
        }
      } else {
        if (v.sub === "parola") {
          await W.aspetta(function () { return wS.document.querySelector(".lu-btn.parola"); }, 3000);
          if (opz.scrivo) { tocca(wS, /La scelgo io/); var c2 = await W.aspetta(function () { return wS.document.querySelector(".lu-campo"); }, 2000); c2.value = opz.scrivo; tocca(wS, /OK/); }
          else { var b = wS.document.querySelector(".lu-btn.parola"); if (b) b.click(); }
          await W.aspetta(function () { return vm(C).sub === "piazza"; }, 3000); return true;
        }
        if (v.sub === "piazza") { await trascina(wS, caso(5, 95)); await W.dorme(150); if (!opz.saltaPiazza) tocca(wS, /Lo metto qui/); await W.aspetta(function () { return vm(C).passo !== "sceglie"; }, opz.saltaPiazza ? 60000 : 3000); return true; }
      }
    }
    if (v.passo === "indovina") {
      var gioc = v.players.filter(function (p) { return !p.via && p.id !== v.sens && (!sq || p.sq === v.sensSq); });
      if (sq) {
        var w1 = tel(C, gioc[0].id); await trascina(w1, caso(10, 90)); await W.dorme(250);
        for (var i = 0; i < gioc.length && vm(C).passo === "indovina"; i++) { var wi = tel(C, gioc[i].id); if (wi && !/Non ancora/.test(T(wi))) tocca(wi, /Ci siamo/); await W.dorme(150); }
      } else {
        for (var j = 0; j < gioc.length; j++) { var wj = tel(C, gioc[j].id); if (!wj) continue; await trascina(wj, caso(5, 95)); await W.dorme(60); tocca(wj, /Blocca/); await W.dorme(100); }
      }
      await W.aspetta(function () { return vm(C).passo !== "indovina"; }, 4000); return true;
    }
    if (v.passo === "scommette") {
      v.players.filter(function (p) { return !p.via && p.sq !== v.sensSq; }).forEach(function (p) { var w = tel(C, p.id); if (w) tocca(w, Math.random() < 0.5 ? /Più a sinistra/ : /Più a destra/); });
      await W.aspetta(function () { return vm(C).passo !== "scommette"; }, 4000); return true;
    }
    if (v.passo === "rivela") {
      await W.dorme(opz.veloce ? 300 : 2900);
      var k = v.partita + "|" + v.turno;
      // «⏩ Avanti» a maggioranza (g4): toccano tutti quelli che giocano
      v.players.filter(function (p) { return !p.via; }).forEach(function (p) { var wp = tel(C, p.id); if (wp) tocca(wp, /Avanti|Classifica/); });
      await W.aspetta(function () { var x = vm(C); return x.fase !== "gioco" || x.partita + "|" + x.turno !== k; }, 4000); return true;
    }
    await W.dorme(150);
    return true;
  }
  async function finoAllaFine(C, ms, opz) {
    var fino = Date.now() + (ms || 180000);
    while (Date.now() < fino) { if (vm(C).fase === "fine") return true; await giocaPasso(C, opz); }
    return vm(C).fase === "fine";
  }
  async function aspettaPasso(C, passo, sub, ms) { return W.aspetta(function () { var v = vm(C); return v.passo === passo && (!sub || v.sub === sub); }, ms || 6000); }
  // fino a quando il sensitivo è (non è) quello indicato, al passo "sceglie"
  async function fino(C, cond, ms) {
    var t1 = Date.now() + (ms || 90000);
    while (Date.now() < t1) { var v = vm(C); if (v.fase !== "gioco") return false; if (cond(v)) return true; await giocaPasso(C, { veloce: true }); }
    return false;
  }
  // nessun errore nei telefoni (script e broker)
  function senzaErrori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" | ")); }
  async function salaECominci(amici) {
    var Z = await A.salaConAmici(amici);
    var C = await A.lanciaDallaSala("Paky", Z.S, NOME);
    if (!await W.aspetta(function () { return ids(C, "players").length === amici.length + 1; }, 10000)) no("nella saletta non arrivano tutti (" + ids(C, "players").length + ")");
    return { S: Z.S, C: C, w: Z.w };
  }
  async function regola(P, re) {   // l'host cambia una regola dal ⚙️ della saletta
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/, ".sl-regole"); }, 4000)) no("non trovo ⚙️ Regole");
    await W.dorme(200);
    var ok = W.clicca(P, re, ".modo-chip, .cat-chip");
    W.clicca(P, /Fatto/, ".sl-foglio button"); await W.dorme(300);
    if (!ok) no("non trovo la regola " + re);
  }
  async function comincia(C) {
    if (!await W.aspetta(function () { return W.clicca(W.finestra("Paky"), /Comincia/, ".sl-go"); }, 5000)) no("Paky non trova «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 8000)) no("la partita non comincia");
  }

  COPIONE.lu = { trascina: trascina, giocaPasso: giocaPasso, finoAllaFine: finoAllaFine, tocca: tocca, tel: tel };

  COPIONE.aggiungi(280, { nome: "Lunghezza d'Onda: 3 telefoni senza squadre, ricariche, sensitivo spento, Rivincita, Cambia gioco", fai: async function () {
    var Z = await salaECominci(["Giulia", "Luca"]), C = Z.C, P = W.finestra("Paky");
    if (!await W.aspetta(function () { return /Cosa ne pensi\? · a squadre/.test(A.regoleDi(W.finestra("Giulia"))); }, 5000)) no("Giulia legge le regole «" + A.regoleDi(W.finestra("Giulia")) + "»");
    await comincia(C);
    var v = vm(C);
    if (v.formula !== "solo") no("in 3 non si gioca ognuno per sé (" + v.formula + ")");
    if (v.turniTot !== 6) no("i turni sono " + v.turniTot);
    if (!/ognuno per sé/.test((v.avviso || {}).tx || "")) no("manca l'avviso «ognuno per sé»");
    // il sensitivo vede 3 parole, gli altri «sta pensando»
    var wS = tel(C, v.sens);
    if (!await W.aspetta(function () { return wS.document.querySelectorAll(".lu-btn.parola").length === 3; }, 4000)) no("il sensitivo non ha 3 parole");
    var altri = v.players.filter(function (p) { return p.id !== v.sens; }).map(function (p) { return W.finestra(p.nome); });
    if (!await W.aspetta(function () { return altri.every(function (w) { return /sta pensando/.test(T(w)); }); }, 4000)) no("gli altri non leggono «sta pensando»");
    if (altri.some(function (w) { return w.document.querySelector(".lu-btn.parola"); })) no("un altro vede le parole del sensitivo");
    // il bersaglio non è mai nella foto prima della rivelazione
    await giocaPasso(C); // parola
    if (vm(C).sub !== "piazza") no("dopo la parola non si piazza");
    // il sensitivo ricarica mentre piazza: ritrova il bersaglio e «Lo metto qui»
    var nS = nomeId(C, vm(C).sens), idS = vm(C).sens;
    if (nS !== "Paky") {
      await W.ricarica(nS);
      var wS2 = await W.aspetta(function () { var w = W.finestra(nS); return w && /Lo metto qui/.test(T(w)) ? w : null; }, 12000);
      if (!wS2) no(nS + " dopo la ricarica non ritrova «Lo metto qui» («" + T(W.finestra(nS)).slice(0, 120) + "»)");
      if (wS2.document.querySelector(".lu-g-bers").style.visibility === "hidden") no(nS + " dopo la ricarica non vede il bersaglio");
      if (vm(C).sens !== idS) no("dopo la ricarica il sensitivo è cambiato");
    }
    await giocaPasso(C); // piazza
    if (JSON.stringify(vm(C)).indexOf('"bers"') >= 0) no("il bersaglio è nella foto prima della rivelazione");
    // chi indovina ricarica a metà
    var gi = vm(C).players.filter(function (p) { return p.id !== vm(C).sens && p.nome !== "Paky"; })[0];
    await W.aspetta(function () { return /Blocca qui/.test(T(W.finestra(gi.nome))); }, 4000);   // (la foto del nuovo passo è arrivata anche a lei)
    await trascina(W.finestra(gi.nome), 40); await W.dorme(300);
    await W.ricarica(gi.nome);
    if (!await W.aspetta(function () { var w = W.finestra(gi.nome); return w && /Blocca qui/.test(T(w)); }, 12000)) no(gi.nome + " dopo la ricarica non può più indovinare («" + T(W.finestra(gi.nome)).slice(0, 120) + "»)");
    if (!await W.aspetta(function () { var g = W.finestra(gi.nome).document.querySelector(".lu-g-lan"), m = g && g.style.transform.match(/rotate\(([-\d.]+)/); return m && Math.abs((parseFloat(m[1]) + 90) / 1.8 - 40) < 0.6; }, 4000)) no(gi.nome + " dopo la ricarica non ritrova la sua lancetta a 40");
    await giocaPasso(C); // indovina
    if (!await aspettaPasso(C, "rivela")) no("non si arriva alla rivelazione");
    var R = vm(C).rivela;
    if (R.bers == null || !R.pts) no("la rivelazione è vuota");
    await W.dorme(3000);
    // su tutti i telefoni la tendina è aperta e gli avatar sono sul quadrante
    ["Paky", "Giulia", "Luca"].forEach(function (n) { var w = W.finestra(n); if (!w.document.querySelector(".lu-g-tenda.aperta")) no("su " + n + " la tendina non si apre"); });
    var nMk = Object.keys(R.lanP || {}).length;
    if (W.finestra("Paky").document.querySelectorAll(".lu-mk").length !== nMk) no("gli avatar sul quadrante non sono " + nMk);
    if (!/Per .+: .+ → /.test(T(P))) no("manca la frase «Per Paky: … → …»");
    // un amico sensitivo ricarica mentre piazza: ritrova il bersaglio e «Lo metto qui»
    if (!await fino(C, function (v) { return v.passo === "sceglie" && v.sub === "parola" && nomeId(C, v.sens) !== "Paky"; })) no("non arriva il turno di un amico");
    await giocaPasso(C);
    var nA = nomeId(C, vm(C).sens), idA = vm(C).sens;
    await trascina(W.finestra(nA), 77); await W.dorme(600);
    await W.ricarica(nA);
    var wA = await W.aspetta(function () { var w = W.finestra(nA); return w && /Lo metto qui/.test(T(w)) ? w : null; }, 12000);
    if (!wA) no(nA + " dopo la ricarica non ritrova «Lo metto qui» («" + T(W.finestra(nA)).slice(0, 120) + "»)");
    if (wA.document.querySelector(".lu-g-bers").style.visibility === "hidden") no(nA + " dopo la ricarica non vede il bersaglio");
    var ang = parseFloat((wA.document.querySelector(".lu-g-bers").style.transform.match(/rotate\(([-\d.]+)/) || [])[1]);
    if (!(Math.abs(ang - 48.6) < 3)) no(nA + " dopo la ricarica ha il bersaglio altrove (" + wA.document.querySelector(".lu-g-bers").style.transform + ")");
    if (vm(C).sens !== idA) no("dopo la ricarica il sensitivo è cambiato");
    tocca(wA, /Lo metto qui/);
    if (!await aspettaPasso(C, "indovina")) no("dopo la ricarica «Lo metto qui» non va");
    // il sensitivo spento mentre sceglie: il tempo si ferma, poi torna
    if (!await fino(C, function (v) { return v.passo === "sceglie" && nomeId(C, v.sens) !== "Paky"; })) no("non arriva il turno di un amico");
    var nS3 = nomeId(C, vm(C).sens);
    W.spegni(nS3);
    if (!await W.aspetta(function () { return vm(C).pausa; }, 8000)) no("col sensitivo spento il tempo non si ferma");
    if (!/si ricollega/.test(T(P))) no("Paky non legge «si ricollega»");
    W.riaccendi(nS3);
    if (!await W.aspetta(function () { return !vm(C).pausa; }, 10000)) no("il sensitivo tornato: il tempo resta fermo");
    if (!await finoAllaFine(C, 200000)) no("la partita non finisce");
    if (!await W.aspetta(function () { return A.tastiFineDi(P) && A.tastiFineDi(W.finestra("Giulia")); }, 6000)) no("mancano i tasti di fine");
    var tP = A.tastiFineDi(P).join(" | ");
    if (tP !== "↻ Rivincita | 🎮 Cambia gioco") no("Paky ha «" + tP + "»");
    var fin = vm(C).fine;
    if (!fin || !fin.classifica || fin.classifica.length !== 3) no("classifica finale sbagliata");
    senzaErrori();
    // Rivincita: 3-2-1 da solo e si rigioca
    W.clicca(P, /Rivincita/, ".fine-tasti button");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco" && vm(C).partita === 2; }, 12000)) no("la Rivincita non riparte (" + vm(C).fase + ")");
    if (!await finoAllaFine(C, 200000, { veloce: true })) no("la rivincita non finisce");
    await W.aspetta(function () { return A.tastiFineDi(P); }, 5000);
    if (!W.clicca(P, /Cambia gioco/, ".fine-tasti button")) no("non trovo «Cambia gioco»");
    var tess = await W.aspetta(function () { return A.tessera(P, "La Scalinata"); }, 5000);
    if (!tess) no("dopo «Cambia gioco» Paky non è nell'elenco");
    tess.click();
    if (!await W.aspetta(function () { return A.dentro(W.finestra("Giulia")) && /Scalinata/.test(T(W.finestra("Giulia"))); }, 9000)) no("Giulia non arriva nella Scalinata");
    senzaErrori();
    return "ognuno per sé in 3 (6 turni), ricariche ok (il sensitivo ritrova il bersaglio), tempo fermo col sensitivo spento, classifica " + fin.classifica.map(function (r) { return r.nome + " " + r.punti; }).join(", ") + ", Rivincita e Cambia gioco ok";
  } });

  COPIONE.aggiungi(281, { nome: "Lunghezza d'Onda: 4 telefoni a squadre, lancetta contesa, conferme, scommessa, host che ricarica", fai: async function () {
    var Z = await salaECominci(["Giulia", "Luca", "Sara"]), C = Z.C, P = W.finestra("Paky");
    await regola(P, /^7 punti$/);
    if (!await W.aspetta(function () { return /fino a 7/.test(A.regoleDi(W.finestra("Sara"))); }, 4000)) no("Sara non legge «fino a 7» («" + A.regoleDi(W.finestra("Sara")) + "»)");
    if (!P.document.querySelector(".lu-squad-box")) no("in saletta non ci sono le squadre");
    await comincia(C);
    var v = vm(C);
    if (v.formula !== "squadre") no("in 4 non si gioca a squadre");
    var sqA = v.players.filter(function (p) { return p.sq === 0; }).length;
    if (sqA !== 2) no("le squadre non sono 2 e 2");
    // fino all'indovina
    await fino(C, function (x) { return x.passo === "indovina"; });
    v = vm(C);
    var gioc = v.players.filter(function (p) { return p.sq === v.sensSq && p.id !== v.sens; });
    var opp = v.players.filter(function (p) { return p.sq !== v.sensSq; });
    if (gioc.length !== 1) no("chi indovina non è uno solo (" + gioc.length + ")");
    var wG = W.finestra(gioc[0].nome), wO = W.finestra(opp[0].nome);
    if (!await W.aspetta(function () { return /Ci siamo/.test(T(wG)); }, 3000)) no(gioc[0].nome + " non ha «Ci siamo»");
    // chi indovina muove (dito giù): gli avversari vedono la lancetta e «✋ nome»
    await trascina(wG, 20, false); await trascina(wG, 25, "muovi");
    if (!await W.aspetta(function () { var t = wO.document.querySelector(".lu-tag"); return t && t.classList.contains("vis") && t.textContent.indexOf(gioc[0].nome) >= 0; }, 3000)) no("gli avversari non vedono «✋ " + gioc[0].nome + "»");
    var angO = null;
    if (!await W.aspetta(function () { angO = parseFloat((wO.document.querySelector(".lu-g-lan").style.transform.match(/rotate\(([-\d.]+)/) || [])[1]); return Math.abs(angO - (25 * 1.8 - 90)) < 4; }, 2000)) no("sul telefono degli avversari la lancetta non segue (" + angO + ")");
    // un avversario non può muoverla
    await trascina(wO, 90); await W.dorme(400);
    wG.document.querySelector(".lu-dial").dispatchEvent(new wG.PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
    if (!await W.aspetta(function () { return Math.abs(vm(C).lan - 25) < 2; }, 3000)) no("staccato il dito, la lancetta nella foto non è dove l'ha lasciata (" + vm(C).lan + ")");
    await W.dorme(300);
    // conferma, poi sposta: la conferma si spegne
    tocca(wG, /Ci siamo/);
    if (!await W.aspetta(function () { return vm(C).passo === "scommette"; }, 3000)) no("con 1 che indovina, «Ci siamo» non chiude (" + vm(C).passo + ")");
    // la scommessa: gli avversari votano
    if (!await W.aspetta(function () { return /Più a sinistra/.test(T(wO)); }, 3000)) no("gli avversari non hanno i tasti della scommessa («" + T(wO).slice(0, 160) + "»)");
    if (/Più a sinistra/.test(T(wG))) no("chi ha indovinato ha i tasti della scommessa");
    await giocaPasso(C);
    if (!await aspettaPasso(C, "rivela")) no("dopo la scommessa niente rivelazione");
    var R = vm(C).rivela;
    if (R.pt == null || R.lan == null) no("rivelazione a squadre vuota");
    await W.dorme(3000);
    var sp = vm(C).sqPunti;
    if (sp[R.sq] < R.pt) no("i punti non tornano");
    // l'host ricarica (dal Passo 5 il gioco riprende): stessa stanza, stessa partita, stessi punti, nessuno passa dalla Sala
    var sp0 = vm(C).sqPunti.join("-"), tu0 = vm(C).turno, s0 = (W.statoStanza(C) || {})._s, inSala = {};
    await W.ricarica("Paky");
    if (!await W.aspetta(function () {
      ["Giulia", "Luca", "Sara"].forEach(function (n) { if (/Sei dentro/.test(T(W.finestra(n))) && !W.finestra(n).document.querySelector(".lu")) inSala[n] = 1; });
      var s = W.statoStanza(C) || {}, x = vm(C);
      return s._s && s._s !== s0 && s._r && x.fase === "gioco" && x.players.filter(function (p) { return !p.via; }).length === 4;
    }, 20000)) no("dopo la ricarica dell'host la partita non riprende con tutti (fase " + vm(C).fase + ")");
    if (Object.keys(inSala).length) no(Object.keys(inSala).join(", ") + " è tornato nella Sala");
    if (vm(C).sqPunti.join("-") !== sp0 || vm(C).turno < tu0) no("dopo la ricarica punti o turno cambiati (" + sp0 + " → " + vm(C).sqPunti.join("-") + ", turno " + tu0 + " → " + vm(C).turno + ")");
    // due che indovinano insieme in un turno a 3? qui 2 e 2: si gioca fino alla fine
    if (!await finoAllaFine(C, 300000, { veloce: true })) no("la partita a squadre non finisce");
    var f = vm(C).fine;
    if (!f || f.formula !== "squadre") no("fine senza squadre");
    if (f.vinc >= 0 && Math.max(f.sqPunti[0], f.sqPunti[1]) < 7) no("ha vinto una squadra sotto i 7 punti");
    var win = f.classifica.filter(function (r) { return r.pos === 1; }).length;
    if (f.vinc >= 0 && win !== 2) no("al primo posto non c'è la squadra vincitrice (" + win + ")");
    if (!await W.aspetta(function () { return A.tastiFineDi(W.finestra("Paky")); }, 5000)) no("mancano i tasti di fine");
    senzaErrori();
    return "squadre 2 e 2, lancetta di uno solo (gli avversari vedono «✋»), scommessa, host ricaricato → la partita riprende, finale " + f.sqPunti.join("-") + (f.premi.length ? " · premi: " + f.premi.join(" / ") : "");
  } });

  COPIONE.aggiungi(282, { nome: "Lunghezza d'Onda: 6 telefoni a squadre, Classico, lancetta a più mani, spento 20 s, sensitivo che esce", fai: async function () {
    var Z = await salaECominci(["Giulia", "Luca", "Sara", "Marco", "Anna"]), C = Z.C, P = W.finestra("Paky");
    await regola(P, /Classico/);
    await comincia(C);
    var v = vm(C);
    if (v.modo !== "classico" || v.sub !== "scala") no("non si parte col Classico (" + v.modo + "/" + v.sub + ")");
    var wS = tel(C, v.sens);
    if (!await W.aspetta(function () { return wS.document.querySelectorAll(".lu-carta").length === 2; }, 4000)) no("il sensitivo non ha 2 scale");
    if (wS.document.querySelector(".lu-g-bers").style.visibility === "hidden") no("il sensitivo non vede il bersaglio");
    var wAl = W.finestra(nomeId(C, v.players.filter(function (p) { return p.id !== v.sens; })[0].id));
    if (!await W.aspetta(function () { return wAl.document.querySelector(".lu-g-bers"); }, 4000)) no("un altro non ha il quadrante");
    if (wAl.document.querySelector(".lu-g-bers").style.visibility !== "hidden") no("un altro vede il bersaglio");
    await giocaPasso(C); // scala
    // indizio con la parola della scala: rifiutato
    var sc = vm(C).scala, campo = await W.aspetta(function () { return wS.document.querySelector(".lu-campo"); }, 3000);
    var vietata = sc[1].split(" ").filter(function (x) { return x.length >= 4; })[0] || sc[0].split(" ").filter(function (x) { return x.length >= 4; })[0];
    if (vietata) {
      campo.value = "Molto " + vietata; tocca(wS, /Fatto/); await W.dorme(300);
      if (vm(C).passo !== "sceglie") no("l'indizio «Molto " + vietata + "» è passato");
      if (!/parole della scala/.test(T(wS))) no("manca «Non puoi usare le parole della scala!»");
    }
    await giocaPasso(C, { indizio: "Zzz prova" });
    if (vm(C).parola !== "Zzz prova") no("l'indizio non arriva a tutti");
    v = vm(C);
    var gioc = v.players.filter(function (p) { return p.sq === v.sensSq && p.id !== v.sens; });
    if (gioc.length !== 2) no("in 6 chi indovina non sono 2 (" + gioc.length + ")");
    // due toccano insieme: la tiene il primo, il secondo vede «✋» e il suo dito non conta più
    var w1 = W.finestra(gioc[0].nome), w2 = W.finestra(gioc[1].nome);
    if (!await W.aspetta(function () { return /Ci siamo/.test(T(w1)) && /Ci siamo/.test(T(w2)); }, 3000)) no("chi indovina non ha «Ci siamo»");
    await trascina(w1, 30, false); await W.dorme(150);
    await trascina(w2, 70, false); await W.dorme(300);
    var wTerzo = tel(C, v.sens), ang3 = null;
    if (!await W.aspetta(function () { ang3 = parseFloat((wTerzo.document.querySelector(".lu-g-lan").style.transform.match(/rotate\(([-\d.]+)/) || [])[1]); return Math.abs(ang3 - (30 * 1.8 - 90)) < 4; }, 2000)) no("con due dita la lancetta è andata a " + ang3 + "° (il sensitivo)");
    if (!/✋/.test((w2.document.querySelector(".lu-tag") || {}).textContent || "")) no("il secondo non vede «✋ " + gioc[0].nome + "»");
    w1.document.querySelector(".lu-dial").dispatchEvent(new w1.PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
    w2.document.querySelector(".lu-dial").dispatchEvent(new w2.PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
    await W.dorme(300);
    // uno conferma, l'altro sposta: la conferma si spegne
    tocca(w1, /Ci siamo/); await W.aspetta(function () { return (vm(C).conferme || []).length === 1; }, 2000);
    await W.dorme(1700);   // (la lancetta è libera)
    await trascina(w2, 60); await W.dorme(400);
    if ((vm(C).conferme || []).length) no("dopo lo spostamento le conferme restano");
    if (!/confermate di nuovo/.test(T(w1) + T(P))) no("nessuno legge «confermate di nuovo»");
    // uno degli avversari si spegne più di 20 s: si continua
    var opp = v.players.filter(function (p) { return p.sq !== v.sensSq && p.nome !== "Paky"; })[0];
    W.spegni(opp.nome);
    tocca(w1, /Ci siamo/); tocca(w2, /Ci siamo/);
    if (!await aspettaPasso(C, "scommette")) no("non si arriva alla scommessa");
    await W.aspetta(function () { return (vm(C).players.filter(function (p) { return p.id === opp.id; })[0] || {}).via; }, 30000);
    if (!(vm(C).players.filter(function (p) { return p.id === opp.id; })[0] || {}).via) no(opp.nome + " spento più di 20 s non è uscito");
    await giocaPasso(C); await giocaPasso(C);
    W.riaccendi(opp.nome);
    if (!await W.aspetta(function () { return !(vm(C).players.filter(function (p) { return p.id === opp.id; })[0] || {}).via; }, 15000)) no(opp.nome + " riacceso non rientra");
    // il sensitivo (un amico) esce mentre sceglie: turno saltato
    if (!await fino(C, function (x) { return x.passo === "sceglie" && nomeId(C, x.sens) !== "Paky"; })) no("non arriva il turno di un amico");
    var nS = nomeId(C, vm(C).sens), t0 = vm(C).turno;
    var wx = W.finestra(nS); W.clicca(wx, /‹/, ".lu-esci");
    if (!await W.aspetta(function () { return vm(C).rivela && vm(C).rivela.saltato; }, 8000)) no("il sensitivo esce: il turno non si salta");
    await giocaPasso(C);
    if (vm(C).turno === t0 || vm(C).sens === null) no("dopo il turno saltato non si va avanti");
    // si chiude per tutti (host esce con conferma)
    W.clicca(P, /‹/, ".lu-esci");
    if (!await W.aspetta(function () { return !P.document.querySelector(".lu"); }, 5000)) no("l'host non esce");
    senzaErrori();
    return "Classico con 2 scale, indizio vietato rifiutato, due dita: la tiene " + gioc[0].nome + ", conferme spente allo spostamento, " + opp.nome + " spento 20 s → via e poi rientra, sensitivo uscito → turno saltato";
  } });

  COPIONE.aggiungi(283, { nome: "Lunghezza d'Onda: chi arriva tardi guarda ed entra alla Rivincita; Misto con «La scelgo io»", fai: async function () {
    var Z = await salaECominci(["Giulia", "Luca"]), C = Z.C, P = W.finestra("Paky");
    await regola(P, /Misto/);
    await regola(P, /^1 giro$/);
    await comincia(C);
    await giocaPasso(C, { scrivo: "Il mio capo" });
    if (vm(C).modo === "cosa" && vm(C).parola !== "Il mio capo") no("la parola scritta non arriva («" + vm(C).parola + "»)");
    // Marco arriva a partita cominciata
    var M = await W.apriTel("Marco", { hash: "sala=" + Z.S, x: 185 * 3, salaSempre: true });
    await W.dorme(2500);
    if (/Guarda/.test(T(M))) W.clicca(M, /Guarda/);
    var guarda = await W.aspetta(function () { return ids(C, "guarda").length === 1; }, 12000);
    if (!guarda) no("Marco non è tra chi guarda («" + T(M).slice(0, 150) + "»)");
    if (ids(C, "players").length !== 3) no("Marco ha preso un posto");
    await W.aspetta(function () { return M.document.querySelector(".lu"); }, 6000);
    if (M.document.querySelector(".lu") && M.document.querySelectorAll(".lu-pan .lu-btn").length) no("Marco ha dei tasti");
    if (!await finoAllaFine(C, 120000)) no("la partita non finisce");
    var modi = {};
    await W.aspetta(function () { return A.tastiFineDi(P); }, 5000);
    W.clicca(P, /Rivincita/, ".fine-tasti button");
    if (!await W.aspetta(function () { return ids(C, "players").length === 4 || vm(C).fase === "gioco"; }, 15000)) no("alla Rivincita Marco non entra (" + ids(C, "players").join(",") + ")");
    senzaErrori();
    return "Misto, «La scelgo io» → «Il mio capo», Marco arrivato tardi guarda senza tasti ed entra alla Rivincita (" + ids(C, "players").length + " giocatori)";
  } });

  COPIONE.aggiungi(284, { nome: "Lunghezza d'Onda sullo stesso telefono: a squadre e tutti insieme", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 });
    async function passo() {   // un tocco del gioco sullo stesso telefono, come farebbero gli amici
      var d = w.document, tt = T(w);
      if (/Passa il telefono/.test(tt) && W.clicca(w, /^Sono /)) return "passa";
      var p = d.querySelector(".lu-btn.parola"); if (p) { p.click(); return "parola"; }
      var c = d.querySelector(".lu-carta"); if (c) { c.click(); return "carta"; }
      if (tocca(w, /Fatto: telefono/)) return "fatto";
      var lm = [].filter.call(d.querySelectorAll(".lu-pan button"), function (b) { return /Lo metto qui/.test(b.textContent); })[0];
      if (lm) { await trascina(w, caso(10, 90)); await W.dorme(100); if (lm.disabled) no("«Lo metto qui» resta spento dopo aver messo il bersaglio"); lm.click(); return "piazza"; }
      if (/Ci siamo/.test(tt)) { await trascina(w, caso(10, 90)); tocca(w, /Ci siamo/); return "ok"; }
      if (tocca(w, Math.random() < 0.5 ? /Più a sinistra/ : /Più a destra/)) return "scom";
      if (tocca(w, /Svela/)) { await W.dorme(2200); return "svela"; }
      if (tocca(w, /Avanti|Classifica/)) return "avanti";
      return "?";
    }
    async function partita(formula, domande, quanti) {
      W.clicca(w, /Home/); await W.dorme(500);
      var tess = await W.aspetta(function () { return A.tessera(w, NOME); }, 4000); if (!tess) no("non trovo la tessera"); tess.click(); await W.dorme(400);
      W.clicca(w, /Sullo stesso telefono/, ".modo-grande, button, [role=button]"); await W.dorme(500);
      if (/Aggiungi giocatore/.test(T(w))) {
        while (w.document.querySelectorAll("input[placeholder^='Giocatore']").length < quanti) { W.clicca(w, /Aggiungi giocatore/); await W.dorme(120); }
        ["Paky", "Giulia", "Luca", "Sara"].forEach(function (n, i) { var inp = w.document.querySelectorAll("input[placeholder^='Giocatore']")[i]; if (inp) { inp.value = n; inp.dispatchEvent(new w.Event("input", { bubbles: true })); } });
        W.clicca(w, /Avanti/); await W.dorme(500);
      }
      W.clicca(w, formula, ".modo-chip"); W.clicca(w, domande, ".modo-chip"); await W.dorme(150);
      W.clicca(w, /Comincia/); await W.dorme(500);
      if (/Le squadre/.test(T(w))) W.clicca(w, /Via/);
      var log = [];
      for (var i = 0; i < 150; i++) {
        if (/Fine partita/.test(T(w))) return log;
        log.push(await passo()); await W.dorme(120);
        if (log.slice(-6).join() === "?,?,?,?,?,?") no("bloccato: «" + T(w).slice(0, 160) + "»");
      }
      no("la partita non finisce (" + log.slice(-8).join(",") + ")");
    }
    var l1 = await partita(/Due squadre/, /Cosa ne pensi/, 4);
    if (l1.indexOf("scom") < 0) no("a squadre non c'è la scommessa");
    var l2 = await partita(/Tutti insieme/, /Classico/, 4);
    if (l2.filter(function (x) { return x === "svela"; }).length !== 7) no("tutti insieme: i turni non sono 7");
    senzaErrori();
    return "a squadre (" + l1.filter(function (x) { return x === "svela"; }).length + " turni, con la scommessa) e tutti insieme (7 turni, voto alla compagnia), senza errori";
  } });

  // le misure di un telefono (larg x alt): niente scorre, niente esce dallo schermo, nessuna scritta tagliata nei tasti
  async function misura(nome, larg, alt) {
    var f = document.getElementById("tel-" + nome), w = f.contentWindow, d = w.document;
    f.style.width = larg + "px"; f.style.height = alt + "px";
    void d.documentElement.offsetHeight; w.dispatchEvent(new w.Event("resize"));
    await W.dorme(350);
    var lu = d.querySelector(".lu"), out = [];
    if (!lu) return [];
    if (d.documentElement.scrollHeight > alt + 1) out.push("la pagina scorre (" + d.documentElement.scrollHeight + ")");
    if (d.documentElement.scrollWidth > larg + 1) out.push("scorre di lato (" + d.documentElement.scrollWidth + ")");
    [].forEach.call(lu.children, function (c) {
      var r = c.getBoundingClientRect();
      if (r.height && r.bottom > alt + 1) out.push((c.className || c.tagName) + " esce sotto (" + Math.round(r.bottom) + ")");
    });
    var dial = d.querySelector(".lu-dial");
    if (dial && dial.getBoundingClientRect().height < 90) out.push("quadrante troppo piccolo (" + Math.round(dial.getBoundingClientRect().height) + ")");
    [].forEach.call(d.querySelectorAll(".lu-pan button, .lu-est, .lu-box b"), function (b) { if (b.scrollWidth > b.clientWidth + 2) out.push("«" + b.textContent.slice(0, 20) + "» tagliato"); });
    return out.map(function (x) { return nome + " " + larg + "x" + alt + ": " + x; });
  }
  async function misuraTutti(nomi) {
    var p = [];
    for (var i = 0; i < nomi.length; i++) { p = p.concat(await misura(nomi[i], 360, 640)); p = p.concat(await misura(nomi[i], 412, 915)); await misura(nomi[i], 360, 740); }
    return p;
  }
  COPIONE.aggiungi(285, { nome: "Lunghezza d'Onda: misure 360x640 e 412x915 in ogni passo (squadre e ognuno per sé)", fai: async function () {
    var Z = await salaECominci(["Giulia", "Luca", "Sara"]), C = Z.C, nomi = ["Paky", "Giulia", "Luca", "Sara"], prob = [], visti = {};
    await regola(W.finestra("Paky"), /Misto/);
    await comincia(C);
    var fino2 = Date.now() + 120000;
    while (Date.now() < fino2 && Object.keys(visti).length < 11) {
      var v = vm(C), k = v.passo + "/" + (v.sub || "") + "/" + v.modo;
      if (v.fase !== "gioco") break;
      if (!visti[k]) { visti[k] = 1; await W.dorme(400); prob = prob.concat(await misuraTutti(nomi)); }
      if (v.passo === "indovina" && !visti["presa"]) {   // con la lancetta in mano e il dito giù
        visti["presa"] = 1;
        var g = v.players.filter(function (p) { return p.sq === v.sensSq && p.id !== v.sens; })[0];
        await trascina(W.finestra(g.nome), 30, false); prob = prob.concat(await misuraTutti(nomi));
        W.finestra(g.nome).document.querySelector(".lu-dial").dispatchEvent(new W.PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
      }
      if (v.passo === "sceglie" && v.modo === "cosa" && v.sub === "parola" && !visti["scrivo"]) {   // «La scelgo io» con il campo
        visti["scrivo"] = 1; var wS = tel(C, v.sens); tocca(wS, /La scelgo io/); await W.dorme(300);
        prob = prob.concat(await misura(nomeId(C, v.sens), 360, 640)); tocca(wS, /Le parole pronte/); await W.dorme(200);
      }
      await giocaPasso(C, { veloce: false });
      if (v.passo === "rivela" && !visti["classico"]) { visti["classico"] = 1; }
    }
    if (prob.length) no(prob.slice(0, 6).join(" | "));
    return "misurati " + Object.keys(visti).join(", ") + " su 4 telefoni: tutto a misura";
  } });

  // ---- 286: il controllore prova a romperlo ----
  function angolo(w) { var g = w && w.document.querySelector(".lu-g-lan"); var m = g && g.style.transform.match(/rotate\(([-\d.]+)/); return m ? (parseFloat(m[1]) + 90) / 1.8 : null; }
  function bersVisibile(w) { var g = w && w.document.querySelector(".lu-g-bers"); return !!(g && g.style.visibility !== "hidden"); }
  COPIONE.aggiungi(286, { nome: "Lunghezza d'Onda: attacchi (5 telefoni a squadre: spia dei messaggi, due dita a raffica, conferme a raffica, ricariche, spento nella rivelazione)", fai: async function () {
    // la spia: tutto quello che passa dal broker finto (per cercare il bersaglio dove non deve stare)
    var spia = [], orig = W.creaClient;
    W.creaClient = function (n, o) { var c = orig(n, o), p = c.publish; c.publish = function (tp, pl, op) { if (this.connected && !this.frozen) spia.push({ n: n, pl: String(pl) }); return p.call(this, tp, pl, op); }; return c; };
    var fatti = {}, note = [];
    try {
      var Z = await salaECominci(["Giulia", "Luca", "Sara", "Marco"]), C = Z.C, P = W.finestra("Paky");
      await comincia(C);
      if (vm(C).formula !== "squadre") no("in 5 non si gioca a squadre");
      var fino3 = Date.now() + 400000;
      while (Date.now() < fino3 && vm(C).fase === "gioco") {
        var v = vm(C), sq = v.sensSq;
        var gioc = v.players.filter(function (p) { return !p.via && p.sq === sq && p.id !== v.sens; });
        // 1. due dita a raffica sulla lancetta comune: alla fine tutti i telefoni la vedono nello stesso punto
        if (v.passo === "indovina" && gioc.length >= 2 && !fatti.dita) {
          fatti.dita = 1;
          var w1 = W.finestra(gioc[0].nome), w2 = W.finestra(gioc[1].nome);
          await W.aspetta(function () { return /Ci siamo/.test(T(w1)) && /Ci siamo/.test(T(w2)); }, 3000);
          for (var i = 0; i < 12; i++) { await trascina(i % 2 ? w2 : w1, caso(5, 95)); await W.dorme(i % 3 === 0 ? 40 : 5); }
          await W.dorme(2000);
          var vv = vm(C).lan, tutti = v.players.map(function (p) { return W.finestra(p.nome); });
          var div = tutti.map(function (w, j) { return v.players[j].nome + " " + angolo(w); }).filter(function (x, j) { var a = angolo(tutti[j]); return a == null || Math.abs(a - vv) > 0.6; });
          if (div.length) no("dopo le due dita la lancetta non è uguale per tutti (foto " + vv + "): " + div.join(", "));
          // 1b. uno tiene il dito fermo sulla lancetta, l'altro ci prova: sul telefono del secondo la lancetta torna dov'è e vede «✋»
          await trascina(w1, 22, false); await W.dorme(200);
          await trascina(w2, 80); await W.dorme(700);
          if (Math.abs(angolo(w2) - 22) > 0.6) no(gioc[1].nome + " ha provato a muovere la lancetta tenuta da " + gioc[0].nome + ": la vede a " + angolo(w2) + " invece di 22");
          if (!/✋/.test((w2.document.querySelector(".lu-tag") || {}).textContent || "")) no(gioc[1].nome + " non vede chi tiene la lancetta");
          w1.document.querySelector(".lu-dial").dispatchEvent(new w1.PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
          await W.dorme(1800);
          // 2. conferme a raffica (prima uno 4 volte, poi l'altro 7): alla fine i tasti dicono la verità
          for (var k = 0; k < 4; k++) { tocca(w2, /Ci siamo|Non ancora/); await W.dorme(k % 2 ? 3 : 25); }
          await W.dorme(600);
          if (/Non ancora/.test(T(w2))) { tocca(w2, /Non ancora/); await W.dorme(600); }   // (così il turno non si chiude: si guarda solo se i tasti dicono la verità)
          for (k = 0; k < 7; k++) { tocca(w1, /Ci siamo|Non ancora/); await W.dorme(k % 2 ? 3 : 25); }
          await W.dorme(800);
          var x = vm(C);
          if (x.passo === "indovina") {
            [gioc[0], gioc[1]].forEach(function (p) {
              var w = W.finestra(p.nome), dentro = (x.conferme || []).indexOf(p.id) >= 0, dice = /Non ancora/.test(T(w));
              if (dentro !== dice) no(p.nome + ": il tasto dice «" + (dice ? "Non ancora" : "Ci siamo") + "» ma per l'host " + (dentro ? "ha confermato" : "non ha confermato"));
            });
            // 3. chi indovina ricarica (non l'host: nella Sala l'host che ricarica riporta tutti nella Sala): ritrova la lancetta dov'è
            var gr = gioc.filter(function (p) { return p.nome !== "Paky"; })[0];
            await W.ricarica(gr.nome);
            var wr = await W.aspetta(function () { var w = W.finestra(gr.nome); return w && /Ci siamo|Non ancora/.test(T(w)) ? w : null; }, 12000);
            if (!wr) no(gr.nome + " dopo la ricarica non può più muovere la lancetta («" + T(W.finestra(gr.nome)).slice(0, 120) + "»)");
            if (vm(C).passo === "indovina" && Math.abs(angolo(wr) - vm(C).lan) > 0.6) no(gr.nome + " dopo la ricarica vede la lancetta a " + angolo(wr) + " invece di " + vm(C).lan);
            // 4. il sensitivo ricarica mentre gli altri indovinano: rivede il bersaglio ed è muto
            var nS = nomeId(C, x.sens);
            if (nS !== "Paky" && vm(C).passo === "indovina") {
              await W.ricarica(nS);
              var ws = await W.aspetta(function () { var w = W.finestra(nS); return w && w.document.querySelector(".lu") && bersVisibile(w) ? w : null; }, 12000);
              if (!ws) no("il sensitivo " + nS + " dopo la ricarica non vede più il suo bersaglio");
              else if (!/Muto come un pesce/.test(T(ws))) no("il sensitivo ricaricato non è muto");
            }
          } else note.push("le conferme a raffica hanno chiuso il turno");
        }
        // 5. un avversario ricarica durante la scommessa: ha ancora i tasti
        if (v.passo === "scommette" && !fatti.scom) {
          var avv = v.players.filter(function (p) { return !p.via && p.sq !== sq && p.nome !== "Paky"; })[0];
          if (avv) {
            fatti.scom = 1;
            await W.ricarica(avv.nome);
            if (vm(C).passo === "scommette" && !await W.aspetta(function () { return /Più a sinistra/.test(T(W.finestra(avv.nome))) || vm(C).passo !== "scommette"; }, 12000)) no(avv.nome + " dopo la ricarica non ha più i tasti della scommessa");
          }
        }
        // 6. un telefono spento all'inizio della rivelazione e riacceso dopo 3 s: ritrova il turno giusto
        if (v.passo === "rivela" && !fatti.riv && !v.rivela.saltato) {
          fatti.riv = 1;
          var chi = v.players.filter(function (p) { return p.nome !== "Paky" && !p.via; })[0].nome;
          W.spegni(chi); await W.dorme(3000); W.riaccendi(chi);
          await W.dorme(1500);
          var wc = W.finestra(chi), y = vm(C);
          if (y.passo === "rivela" && !wc.document.querySelector(".lu-g-tenda.aperta")) no(chi + " riacceso nella rivelazione non vede la tendina aperta");
        }
        await giocaPasso(C, { veloce: true });
      }
      if (vm(C).fase !== "fine") no("la partita non finisce (" + vm(C).fase + "/" + vm(C).passo + ")");
      if (!fatti.dita) note.push("mai due che indovinano insieme");
      // il bersaglio non deve mai passare in chiaro prima della rivelazione (solo nei messaggi «to» al sensitivo e, dal Passo 5,
      // nella copia di riserva __ris che il core manda solo ai vice, come in Parola d'ordine e nella Balla)
      var fughe = spia.filter(function (m) {
        if (m.pl.indexOf('"bers"') < 0) return false;
        try { var o = JSON.parse(m.pl), d = o.data || o; if (d.to || d.t === "__ris") return false; if (d.t === "vm" && d.vm && (d.vm.passo === "rivela" || d.vm.fase !== "gioco")) return false; return true; } catch (e) { return true; }
      });
      if (fughe.length) no("il bersaglio passa a tutti prima della rivelazione: " + fughe[0].pl.slice(0, 160));
      var segreti = spia.filter(function (m) { return /"t":"segreto"/.test(m.pl); }).length;
      if (!segreti) no("la spia non vede i segreti (la spia non funziona?)");
      senzaErrori();
      return "5 telefoni a squadre fino alla fine (" + vm(C).fine.sqPunti.join("-") + "): due dita a raffica e tutti vedono la lancetta uguale, conferme a raffica coerenti, ricariche ok, spento nella rivelazione ok, " + spia.length + " messaggi spiati senza bersaglio in chiaro" + (note.length ? " · note: " + note.join("; ") : "");
    } finally { W.creaClient = orig; }
  } });

  // ---- 287: 6 telefoni ognuno per sé, Classico, 1 giro: uno spento senza bloccare, chi ha bloccato vede gli altri ----
  COPIONE.aggiungi(287, { nome: "Lunghezza d'Onda: 6 telefoni ognuno per sé, Classico: spento senza bloccare, lancette degli altri, partita intera", fai: async function () {
    var Z = await salaECominci(["Giulia", "Luca", "Sara", "Marco", "Anna"]), C = Z.C, P = W.finestra("Paky");
    await regola(P, /Ognuno per sé/); await regola(P, /Classico/); await regola(P, /^1 giro$/);
    if (!await W.aspetta(function () { return /Classico · ognuno per sé, 1 giro/.test(A.regoleDi(W.finestra("Anna"))); }, 4000)) no("Anna legge «" + A.regoleDi(W.finestra("Anna")) + "»");
    await comincia(C);
    var v = vm(C);
    if (v.formula !== "solo" || v.turniTot !== 6) no("formula " + v.formula + ", turni " + v.turniTot);
    await fino(C, function (x) { return x.passo === "indovina"; });
    v = vm(C);
    var altri = v.players.filter(function (p) { return p.id !== v.sens; });
    var spento = altri.filter(function (p) { return p.nome !== "Paky"; })[0];
    W.spegni(spento.nome);
    var bloccano = altri.filter(function (p) { return p.id !== spento.id; });
    // (prima di trascinare si aspetta che il quadrante si possa toccare: se il sensitivo è l'host, il suo turno va avanti
    //  subito e i telefoni degli amici arrivano all'«indovina» un attimo dopo)
    for (var i = 0; i < bloccano.length; i++) { var w = W.finestra(bloccano[i].nome); await W.aspetta(function () { return w.document.querySelector(".lu-dial.tocca"); }, 5000); await trascina(w, 10 + i * 15); await W.dorme(80); if (i < bloccano.length - 1) { tocca(w, /Blocca/); await W.dorme(150); } }
    await W.dorme(800);
    // chi ha bloccato vede le lancette degli altri (avatar sul bordo); chi non ha bloccato no
    var wb = W.finestra(bloccano[0].nome), wl = W.finestra(bloccano[bloccano.length - 1].nome);
    if (wb.document.querySelectorAll(".lu-mk").length < 2) no(bloccano[0].nome + " ha bloccato ma non vede le lancette degli altri (" + wb.document.querySelectorAll(".lu-mk").length + ")");
    if (wl.document.querySelectorAll(".lu-mk").length) no(bloccano[bloccano.length - 1].nome + " non ha bloccato e vede le lancette degli altri");
    tocca(wl, /Blocca/);
    await W.dorme(600);
    if (vm(C).passo !== "indovina") no("il turno si chiude senza aspettare " + spento.nome);
    // dopo 20 s lo spento esce e il turno si chiude da solo
    if (!await W.aspetta(function () { return vm(C).passo === "rivela"; }, 30000)) no("con " + spento.nome + " spento il turno non si chiude");
    var R = vm(C).rivela;
    if (R.pts[spento.id]) no(spento.nome + " spento prende " + R.pts[spento.id] + " punti");
    W.riaccendi(spento.nome);
    if (!await W.aspetta(function () { return !(vm(C).players.filter(function (p) { return p.id === spento.id; })[0] || {}).via; }, 15000)) no(spento.nome + " riacceso non rientra");
    if (!await finoAllaFine(C, 240000, { veloce: true })) no("la partita non finisce");
    var f = vm(C).fine, cl = f.classifica;
    if (cl.length !== 6) no("classifica di " + cl.length);
    for (var j = 1; j < cl.length; j++) if (cl[j].punti > cl[j - 1].punti || (cl[j].punti === cl[j - 1].punti && cl[j].pos !== cl[j - 1].pos)) no("classifica in disordine: " + JSON.stringify(cl));
    if (!await W.aspetta(function () { return A.tastiFineDi(P) && A.tastiFineDi(W.finestra("Anna")); }, 6000)) no("mancano i tasti di fine");
    senzaErrori();
    return "6 telefoni ognuno per sé Classico (6 turni): chi ha bloccato vede le lancette degli altri, lo spento esce dopo 20 s e il turno si chiude, poi rientra; classifica " + cl.map(function (r) { return r.nome + " " + r.punti; }).join(", ");
  } });

  // ---- 288: 6 telefoni a squadre, Classico a 7, tre escono uno dopo l'altro: squadre rifatte, poi ognuno per sé ----
  COPIONE.aggiungi(288, { nome: "Lunghezza d'Onda: 6 a squadre, escono in tre (squadre rifatte, poi ognuno per sé), fino alla fine", fai: async function () {
    var Z = await salaECominci(["Giulia", "Luca", "Sara", "Marco", "Anna"]), C = Z.C, P = W.finestra("Paky");
    await regola(P, /Classico/); await regola(P, /^7 punti$/);
    await comincia(C);
    var avvisi = [];
    async function esce(nome) { var w = W.finestra(nome); W.clicca(w, /‹/, ".lu-esci"); await W.aspetta(function () { return (vm(C).players.filter(function (p) { return p.nome === nome; })[0] || {}).via; }, 8000); }
    function giro() { return giocaPasso(C, { veloce: true }).then(function () { var a = vm(C).avviso; if (a && avvisi.indexOf(a.tx) < 0) avvisi.push(a.tx); }); }
    // un turno intero
    await fino(C, function (x) { return x.passo === "rivela"; }); await giro();
    // escono in tre (mai l'host): ogni volta si gioca un turno
    var usciti = [];
    for (var k = 0; k < 3; k++) {
      var v = vm(C);
      // chi esce: uno della squadra più piccola, così le squadre si devono rifare
      var vivi = v.players.filter(function (p) { return !p.via && p.nome !== "Paky"; });
      var conta = [0, 1].map(function (s) { return v.players.filter(function (p) { return !p.via && p.sq === s; }).length; });
      var pic = conta[0] <= conta[1] ? 0 : 1;
      var chi = (vivi.filter(function (p) { return p.sq === pic; })[0] || vivi[0]).nome;
      await esce(chi); usciti.push(chi);
      var t0 = vm(C).turno;
      if (!await fino(C, function (x) { return x.turno > t0 && x.passo === "rivela"; }, 90000)) no("dopo l'uscita di " + chi + " non si gioca il turno dopo (" + vm(C).fase + "/" + vm(C).passo + ")");
      var a = vm(C).avviso; if (a && avvisi.indexOf(a.tx) < 0) avvisi.push(a.tx);
      if (vm(C).fase !== "gioco") break;
    }
    var v2 = vm(C);
    if (v2.fase === "gioco" && v2.formula !== "solo") no("rimasti in 3 si gioca ancora a squadre");
    if (!avvisi.some(function (x) { return /ognuno per sé/.test(x); }) && v2.fase === "gioco") no("manca l'avviso «ognuno per sé» (" + avvisi.join(" / ") + ")");
    if (!await finoAllaFine(C, 200000, { veloce: true })) no("la partita non finisce");
    var f = vm(C).fine;
    if (!await W.aspetta(function () { return A.tastiFineDi(P); }, 6000)) no("mancano i tasti di fine");
    senzaErrori();
    return "usciti " + usciti.join(", ") + "; avvisi: " + avvisi.join(" / ") + "; fine " + f.formula + " · " + f.classifica.map(function (r) { return r.nome + " " + r.punti + "(" + r.pos + ")"; }).join(", ");
  } });

  // ---- 289: le misure ognuno per sé con 6 telefoni (lancette degli altri, avatar sul bordo) e la classifica finale ----
  COPIONE.aggiungi(289, { nome: "Lunghezza d'Onda: misure 360x640 e 412x915 ognuno per sé con 6 telefoni, e la fine partita", fai: async function () {
    var nomi = ["Paky", "Giulia", "Luca", "Sara", "Marco", "Anna"];
    var Z = await salaECominci(nomi.slice(1)), C = Z.C, P = W.finestra("Paky"), prob = [], visti = {};
    await regola(P, /Ognuno per sé/); await regola(P, /Misto/); await regola(P, /^1 giro$/);
    await comincia(C);
    var fino4 = Date.now() + 200000;
    while (Date.now() < fino4 && vm(C).fase === "gioco") {
      var v = vm(C), k = v.passo + "/" + (v.sub || "") + "/" + v.modo;
      if (v.passo === "indovina" && !visti.meta) {   // metà hanno bloccato: chi ha bloccato vede gli avatar degli altri
        visti.meta = 1;
        var al = v.players.filter(function (p) { return p.id !== v.sens; });
        for (var i = 0; i < al.length; i++) { var w = W.finestra(al[i].nome); await trascina(w, 8 + i * 17); await W.dorme(60); if (i < 3) { tocca(w, /Blocca/); await W.dorme(120); } }
        await W.dorme(500);
        prob = prob.concat(await misuraTutti(nomi));
      }
      if (!visti[k]) { visti[k] = 1; await W.dorme(v.passo === "rivela" ? 3200 : 400); prob = prob.concat(await misuraTutti(nomi)); }
      await giocaPasso(C, { veloce: true });
    }
    if (vm(C).fase !== "fine") no("la partita non finisce");
    await W.aspetta(function () { return A.tastiFineDi(P); }, 6000);
    for (var j = 0; j < nomi.length; j++) {
      var f = document.getElementById("tel-" + nomi[j]), w2 = f.contentWindow, d = w2.document;
      for (var m = 0; m < 2; m++) {
        var lg = m ? 412 : 360, al2 = m ? 915 : 640;
        f.style.width = lg + "px"; f.style.height = al2 + "px"; void d.documentElement.offsetHeight; w2.dispatchEvent(new w2.Event("resize")); await W.dorme(350);
        var piede = d.querySelector(".fine-tasti") || d.querySelector(".schermata.attiva .piede") || null;
        var sc = [].filter.call(d.querySelectorAll(".schermata .contenuto"), function (c) { return c.offsetParent && c.scrollHeight > c.clientHeight + 2; });
        if (d.documentElement.scrollHeight > al2 + 1) prob.push(nomi[j] + " fine " + lg + "x" + al2 + ": la pagina scorre");
        if (sc.length) prob.push(nomi[j] + " fine " + lg + "x" + al2 + ": la classifica scorre (" + sc[0].scrollHeight + "/" + sc[0].clientHeight + ")");
        if (piede && piede.getBoundingClientRect().bottom > al2 + 1) prob.push(nomi[j] + " fine " + lg + "x" + al2 + ": i tasti escono sotto");
      }
      f.style.width = "360px"; f.style.height = "740px"; w2.dispatchEvent(new w2.Event("resize"));
    }
    if (prob.length) no(prob.slice(0, 6).join(" | "));
    return "misurati " + Object.keys(visti).join(", ") + " e la fine su 6 telefoni: tutto a misura";
  } });
})();

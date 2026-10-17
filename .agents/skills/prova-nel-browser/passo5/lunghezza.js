// PROVE DEL PASSO 5 PER «STESSA LUNGHEZZA D'ONDA» (js/games/lunghezza.js: riprende + riserva, dal 18 ott 2026).
// Uso (dopo copione-prova.js e passo2/lunghezza.js, che dà il giocatore automatico COPIONE.lu):
//   await COPIONE.carica("passo2/lunghezza.js"); await COPIONE.carica("passo5/lunghezza.js"); await COPIONE.prova("5lu1")
//   Edge invisibile: prova.js --porta 8978 --carica passo2/lunghezza.js,passo5/lunghezza.js --prova 5lu1,5lu2,5lu3 --timeout 900
// Tutte col percorso di prima (stanza di un gioco solo). Profili finti, mai account veri.
// 5lu1 a squadre in 4 (fino a 7): l'host ricarica mentre la squadra muove la lancetta → la partita RIPRENDE (niente
//      saletta, «🔁 Paky è tornato…»), «🔁 Si riprende!» col tempo fermo per almeno 5 s, poi lo STESSO turno (stesso sensitivo,
//      stessa parola, stesso bersaglio, la lancetta dov'era) con almeno 15 s; poi ricarica di nuovo sulla rivelazione → la
//      rivelazione si rivede, i punti NON si danno due volte e si va al turno dopo; poi fino alla fine: XP una volta a testa,
//      un solo "__esito".
// 5lu2 ognuno per sé in 3: l'host ricarica mentre il sensitivo sceglie (la parola, o dove metterla: resta la sua, il tempo
//      riparte da almeno 20 s) e poi a metà dell'indovina con una lancetta già bloccata (resta bloccata, al suo posto); poi
//      fino alla fine coi punti di tutti giusti (nessuno cambia nella ripresa).
// 5lu3 riserva a squadre in 5 (Giulia e Luca vice): il telefono dell'host si spegne a metà dell'indovina → entro 8 s la
//      partita la tiene Giulia (_g 2), stessi punti e stesso turno, «👑 … la porti avanti tu» e «👑 Ora la partita la tiene
//      Giulia»; Paky torna: «👋 Bentornato! … rientri come giocatore», rientra al suo posto; mai due host; fino alla
//      classifica: XP una volta a testa (anche Paky), un solo "__esito" (di Giulia).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, T = A.T;
  var NOME = "Stessa Lunghezza d'Onda";
  function no(p) { throw new Error("NO: " + p); }
  function vm(C) { return W.vmDi(C) || {}; }
  function pill(w) { return w ? [].map.call(w.document.querySelectorAll(".sg-pillola"), function (x) { return x.textContent; }).join(" | ") : ""; }
  function LU() { if (!COPIONE.lu) no("manca passo2/lunghezza.js (carica prima quello)"); return COPIONE.lu; }
  function errori() { var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / ")); }
  function punti(v) { return JSON.stringify({ sq: v.sqPunti, p: (v.players || []).map(function (p) { return [p.nome, p.punti]; }) }); }
  function HdiPaky() { var P = W.finestra("Paky"); return P && P.__lunghezzaH ? P.__lunghezzaH() : null; }
  function prima(nome) { return A.contaPartite(nome); }
  // l'host cambia una regola dal ⚙️ della saletta (se non la trova, si gioca con quelle di partenza)
  async function regola(P, re) {
    if (!await W.aspetta(function () { return W.clicca(P, /Regole/, ".sl-regole"); }, 3000)) return false;
    await W.dorme(250);
    var ok = W.clicca(P, re, ".modo-chip, .cat-chip");
    W.clicca(P, /Fatto/, ".sl-foglio button"); await W.dorme(300);
    return ok;
  }
  // si gioca (il giocatore automatico di passo2/lunghezza.js) finché fino(vm) non è vero
  async function giocaFino(C, fino, ms, perche) {
    var t = Date.now() + (ms || 120000);
    while (Date.now() < t) {
      var v = vm(C);
      if (fino(v)) return v;
      if (v.fase !== "gioco") break;
      try { await LU().giocaPasso(C, { veloce: true }); } catch (e) { await W.dorme(300); }
    }
    if (fino(vm(C))) return vm(C);
    no((perche || "non si arriva al punto della prova") + " (fase " + vm(C).fase + "." + vm(C).passo + ")");
  }
  // il respiro dopo una ripresa: quanto dura (visto dalla foto) e com'è il passo dopo
  // (la spia parte PRIMA della ricarica e guarda la foto ogni 100 ms: quando comincia e quando finisce il respiro)
  function spiaRespiro(C) {
    var S = { da: 0, a: 0, v: null };
    S.id = setInterval(function () {
      var v = vm(C);
      if (v.respiro && !S.da) S.da = Date.now();
      if (S.da && !S.a && !v.respiro && v.fase) { S.a = Date.now(); S.v = JSON.parse(JSON.stringify(v)); clearInterval(S.id); }
    }, 100);
    return S;
  }
  async function respiro(S, ms) {
    await W.aspetta(function () { return S.a; }, ms || 16000);
    clearInterval(S.id);
    if (!S.da) no("nessun «🔁 Si riprende!» (respiro) dopo la ripresa");
    if (!S.a) no("il respiro non finisce");
    return { s: (S.a - S.da) / 1000, v: S.v };
  }

  // ---------------- 5lu1: a squadre, ricarica nell'indovina e poi sulla rivelazione ----------------
  COPIONE.aggiungi("5lu1", { nome: "Lunghezza · squadre in 4: l'host ricarica nell'indovina (stesso turno dopo il respiro) e sulla rivelazione (niente punti doppi), poi fino alla fine", fai: async function () {
    W.__partite = {};
    var tutti = ["Paky", "Giulia", "Luca", "Sara"], note = [], H0 = null, a7 = false, S1 = null;
    var r = await A.provaRipresa({ gioco: "lunghezza", nomeTessera: NOME, amici: ["Giulia", "Luca", "Sara"],
      prima: function (w) { var n = String((w.frameElement && w.frameElement.id) || "").replace(/^tel-/, ""); prima(n)(w); },
      comincia: async function (C, P) {
        a7 = await regola(P, /^7 punti$/);
        if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("l'host non ha «Comincia»");
        if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 8000)) no("la partita non comincia");
        if (vm(C).formula !== "squadre") no("in 4 non si gioca a squadre (" + vm(C).formula + ")");
        await giocaFino(C, function (v) { return v.passo === "indovina" && !v.pausa; }, 90000, "non si arriva all'indovina");
      },
      fase: function (v) { return v.passo === "indovina"; },
      // chi indovina sposta la lancetta comune a 30
      prepara: async function (C) {
        var v = vm(C), g = v.players.filter(function (p) { return !p.via && p.sq === v.sensSq && p.id !== v.sens; })[0];
        await LU().trascina(LU().tel(C, g.id), 30);
        if (!await W.aspetta(function () { return Math.abs(vm(C).lan - 30) < 2; }, 4000)) no("la lancetta non va a 30 (" + vm(C).lan + ")");
        H0 = JSON.parse(JSON.stringify({ bers: HdiPaky().bers, parola: HdiPaky().parola, sens: HdiPaky().sens, turno: HdiPaky().turno }));
        S1 = spiaRespiro(C);
      },
      controlla: function (a, b) {
        if (punti(b) !== punti(a)) return "punti cambiati: " + punti(a) + " → " + punti(b);
        if (b.turno !== a.turno || b.sens !== a.sens || b.parola !== a.parola) return "turno diverso (" + a.turno + "/" + a.sens + "/" + a.parola + " → " + b.turno + "/" + b.sens + "/" + b.parola + ")";
        if (b.passo !== "indovina") return "passo " + b.passo;
        return Math.abs(b.lan - 30) < 2 ? true : "la lancetta non è dov'era (" + b.lan + ")";
      }, attesa: 12000 });
    var C = r.C;
    note.push("ripresa in " + r.dt + " s" + (a7 ? " (a 7)" : ""));
    var H1 = HdiPaky();
    if (!H1 || H1.bers !== H0.bers) no("il bersaglio è cambiato (" + (H0 && H0.bers) + " → " + (H1 && H1.bers) + ")");
    var R1 = await respiro(S1);
    if (R1.s < 4) no("il respiro è durato solo " + R1.s.toFixed(1) + " s");
    if (R1.v.passo !== "indovina" || R1.v.turno !== H0.turno) no("dopo il respiro non si continua l'indovina dello stesso turno (" + R1.v.passo + ", turno " + R1.v.turno + ")");
    if ((R1.v.resta || 0) < 14) no("dopo il respiro restano solo " + R1.v.resta + " s per indovinare");
    if (!/Si riprende/.test(T(W.finestra("Sara"))) && !/Ci siamo|Più a/.test(T(W.finestra("Sara")))) note.push("(Sara: «" + T(W.finestra("Sara")).slice(0, 60) + "»)");
    note.push("respiro " + R1.s.toFixed(1) + " s, stesso turno (sensitivo, parola, bersaglio, lancetta a 30), " + R1.v.resta + " s per indovinare");
    // il sensitivo vede ancora il suo bersaglio
    var wS = LU().tel(C, H0.sens);
    if (wS && !await W.aspetta(function () { var b = wS.document.querySelector(".lu-g-bers"); return b && b.style.visibility !== "hidden"; }, 4000)) no("il sensitivo non vede più il bersaglio");
    // ---- fino alla rivelazione: i punti si danno una volta ----
    var pPrima = vm(C).sqPunti.slice();
    var vr = await giocaFino(C, function (v) { return v.passo === "rivela" && v.rivela && !v.rivela.saltato; }, 60000, "non si arriva alla rivelazione");
    var R = vr.rivela, atteso = pPrima.slice(); atteso[R.sq] += R.pt; if (R.scom && R.scom.giusta) atteso[R.scom.sq] += 1;
    if (vr.sqPunti.join() !== atteso.join()) no("dopo la rivelazione punti " + vr.sqPunti.join("-") + " invece di " + atteso.join("-"));
    // ---- seconda ricarica: sulla rivelazione ----
    await W.dorme(900);
    var a = vm(C), s0 = (W.statoStanza(C) || {})._s, salette = {};
    await W.ricarica("Paky");
    var ok = await W.aspetta(function () {
      ["Giulia", "Luca", "Sara"].forEach(function (n) { if (W.finestra(n).document.querySelector(".saletta-schermo")) salette[n] = 1; });
      var s = W.statoStanza(C) || {}, v = vm(C);
      return s._s && s._s !== s0 && s._r && v.passo === "rivela" && v.turno === a.turno && A.contaDentro(v) === 4;
    }, 15000);
    if (!ok) no("seconda ricarica: la rivelazione non si rivede con tutti (" + vm(C).fase + "." + vm(C).passo + ", turno " + vm(C).turno + ")");
    if (Object.keys(salette).length) no(Object.keys(salette).join(", ") + " è passato dalla saletta");
    if (punti(vm(C)) !== punti(a)) no("seconda ricarica: punti cambiati " + punti(a) + " → " + punti(vm(C)));
    if ((vm(C).resta || 0) < 5) no("sulla rivelazione rivista restano solo " + vm(C).resta + " s");
    // si va al turno dopo coi punti di prima
    var vn = await giocaFino(C, function (v) { return v.fase !== "gioco" || v.turno > a.turno; }, 40000, "dopo la rivelazione rivista non si va al turno dopo");
    if (vn.sqPunti.join() !== a.sqPunti.join()) no("passando al turno dopo i punti sono cambiati: " + a.sqPunti.join("-") + " → " + vn.sqPunti.join("-"));
    note.push("rivelazione rivista (" + a.sqPunti.join("-") + "), turno dopo senza punti doppi");
    // ---- fino alla fine ----
    await giocaFino(C, function (v) { return v.fase === "fine"; }, 420000, "dopo le riprese la partita non arriva alla fine");
    await W.dorme(2500);
    var f = vm(C).fine;
    if (!f || f.classifica.length !== 4) no("classifica: " + JSON.stringify(f && f.classifica));
    tutti.forEach(function (n) { if ((W.__partite || {})[n] !== 1) no("partite (XP) date: " + JSON.stringify(W.__partite) + " (" + n + " doveva averne 1)"); });
    var es = A.contaStoria(C, '"__esito"'); if (es !== 1) no("gli __esito sono " + es);
    errori();
    return note.join(" · ") + " · fine " + f.sqPunti.join("-") + ", XP una volta, un __esito";
  } });

  // ---------------- 5lu2: ognuno per sé, ricarica mentre si sceglie e con una lancetta bloccata ----------------
  COPIONE.aggiungi("5lu2", { nome: "Lunghezza · ognuno per sé in 3: l'host ricarica mentre il sensitivo sceglie e con una lancetta bloccata, poi fino alla fine", fai: async function () {
    W.__partite = {};
    var tutti = ["Paky", "Giulia", "Luca"], note = [], scelta = null, S1 = null;
    var r = await A.provaRipresa({ gioco: "lunghezza", nomeTessera: NOME, amici: ["Giulia", "Luca"],
      prima: function (w) { var n = String((w.frameElement && w.frameElement.id) || "").replace(/^tel-/, ""); prima(n)(w); },
      comincia: async function (C, P) {
        if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("l'host non ha «Comincia»");
        if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 8000)) no("la partita non comincia");
        if (vm(C).formula !== "solo") no("in 3 non si gioca ognuno per sé (" + vm(C).formula + ")");
        // un sensitivo che non è l'host, mentre sceglie
        await giocaFino(C, function (v) { return v.passo === "sceglie" && v.sens !== "host" && !v.pausa; }, 120000, "non arriva il turno di un amico");
      },
      fase: function (v) { return v.passo === "sceglie"; },
      // il sensitivo sceglie la parola (Cosa ne pensi?) o la scala (Classico): la sua scelta resta
      prepara: async function (C) {
        var v = vm(C), wS = LU().tel(C, v.sens);
        await W.dorme(1500);
        if (v.modo === "cosa" && v.sub === "parola") { var b = await W.aspetta(function () { return wS.document.querySelector(".lu-btn.parola"); }, 4000); if (b) b.click(); await W.aspetta(function () { return vm(C).sub === "piazza"; }, 4000); }
        else if (v.sub === "scala") { var c = await W.aspetta(function () { return wS.document.querySelector(".lu-carta"); }, 4000); if (c) c.click(); await W.aspetta(function () { return vm(C).sub === "indizio"; }, 4000); }
        await W.dorme(300);
        var x = vm(C); scelta = { sub: x.sub, parola: x.parola, scala: JSON.stringify(x.scala), bers: HdiPaky().bers };
        S1 = spiaRespiro(C);
      },
      controlla: function (a, b) {
        if (punti(b) !== punti(a)) return "punti cambiati: " + punti(a) + " → " + punti(b);
        if (b.passo !== "sceglie" || b.turno !== a.turno || b.sens !== a.sens) return "passo " + b.passo + " turno " + b.turno;
        if (b.sub !== scelta.sub || b.parola !== scelta.parola || JSON.stringify(b.scala) !== scelta.scala) return "la scelta del sensitivo è cambiata (" + b.sub + "/" + b.parola + ")";
        return true;
      }, attesa: 12000 });
    var C = r.C;
    if (scelta.sub === "indizio" && HdiPaky().bers !== scelta.bers) no("Classico: il bersaglio è cambiato");
    var R1 = await respiro(S1);
    if (R1.s < 4) no("il respiro è durato solo " + R1.s.toFixed(1) + " s");
    if (R1.v.passo !== "sceglie" || (R1.v.resta || 0) < 19) no("dopo il respiro il sensitivo non ha almeno 20 s (" + R1.v.passo + ", " + R1.v.resta + " s)");
    note.push("1ª ricarica mentre sceglie (" + scelta.sub + (scelta.parola ? " «" + scelta.parola + "»" : "") + "): ripresa in " + r.dt + " s, respiro " + R1.s.toFixed(1) + " s, " + R1.v.resta + " s per scegliere");
    // ---- fino all'indovina; uno blocca la lancetta a 70 ----
    var vi = await giocaFino(C, function (v) { return v.passo === "indovina" && !v.respiro; }, 60000, "non si arriva all'indovina");
    var gi = vi.players.filter(function (p) { return !p.via && p.id !== vi.sens && p.id !== "host"; })[0] || vi.players.filter(function (p) { return p.id !== vi.sens; })[0];
    var wg = LU().tel(C, gi.id);
    await LU().trascina(wg, 70); await W.dorme(200); LU().tocca(wg, /Blocca/);
    if (!await W.aspetta(function () { return (vm(C).bloccati || []).indexOf(gi.id) >= 0; }, 4000)) no(gi.nome + " non riesce a bloccare");
    if (vm(C).passo !== "indovina") no("bloccato uno solo, l'indovina è già finita");
    await W.dorme(1300);
    var a = vm(C), s0 = (W.statoStanza(C) || {})._s, S2 = spiaRespiro(C);
    await W.ricarica("Paky");
    var ok = await W.aspetta(function () { var s = W.statoStanza(C) || {}, v = vm(C); return s._s && s._s !== s0 && s._r && v.passo === "indovina" && v.turno === a.turno && A.contaDentro(v) === 3; }, 15000);
    if (!ok) no("2ª ricarica: l'indovina non riprende con tutti (" + vm(C).fase + "." + vm(C).passo + ")");
    if ((vm(C).bloccati || []).indexOf(gi.id) < 0) no("dopo la ricarica la lancetta di " + gi.nome + " non è più bloccata");
    var HP = HdiPaky(); if (!HP.lanP || Math.abs(HP.lanP[gi.id] - 70) > 2) no("la lancetta di " + gi.nome + " non è più a 70 (" + (HP.lanP && HP.lanP[gi.id]) + ")");
    if (punti(vm(C)) !== punti(a)) no("2ª ricarica: punti cambiati");
    var R2 = await respiro(S2);
    note.push("2ª ricarica a metà indovina: " + gi.nome + " resta bloccato a 70, respiro " + R2.s.toFixed(1) + " s, " + R2.v.resta + " s per gli altri");
    // ---- fino alla fine ----
    await giocaFino(C, function (v) { return v.fase === "fine"; }, 300000, "dopo le riprese la partita non arriva alla fine");
    await W.dorme(2500);
    var f = vm(C).fine;
    if (!f || f.classifica.length !== 3) no("classifica: " + JSON.stringify(f && f.classifica));
    tutti.forEach(function (n) { if ((W.__partite || {})[n] !== 1) no("partite (XP) date: " + JSON.stringify(W.__partite) + " (" + n + " doveva averne 1)"); });
    var es = A.contaStoria(C, '"__esito"'); if (es !== 1) no("gli __esito sono " + es);
    errori();
    return note.join(" · ") + " · fine: " + f.classifica.map(function (x) { return x.pos + "° " + x.nome + " " + x.punti; }).join(", ");
  } });

  // ---------------- 5lu3: la riserva ----------------
  COPIONE.aggiungi("5lu3", { nome: "Lunghezza · riserva a squadre in 5: l'host si spegne, Giulia porta avanti la partita; Paky torna da giocatore; fino alla classifica", fai: async function () {
    W.__partite = {};
    var nomi = ["Paky", "Giulia", "Luca", "Sara", "Marco"], amici = nomi.slice(1), L = [];
    var P = await W.apriTel("Paky", { x: 0, prima: prima("Paky") });
    var C = await W.apriStanza(P, NOME), ids = { Paky: "host" };
    for (var i = 0; i < amici.length; i++) {
      var n = amici[i], k = i + 2;
      await W.apriTel(n, { hash: "gioco=lunghezza&stanza=" + C, x: 185 * (i + 1), prima: prima(n) });
      if (!await W.aspetta(function () { return A.contaDentro(vm(C)) >= k; }, 10000)) no(n + " non entra in saletta");
      ids[n] = A.mioId(n);
      await W.dorme(300);
    }
    var a7 = await regola(P, /^7 punti$/);
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/, ".sl-go"); }, 5000)) no("l'host non ha «Comincia»");
    if (!await W.aspetta(function () { return vm(C).fase === "gioco"; }, 8000)) no("la partita non comincia");
    // si gioca un turno intero, poi ci si ferma nell'indovina del turno dopo
    await giocaFino(C, function (v) { return v.turno >= 2 && v.passo === "indovina" && !v.pausa; }, 150000, "non si arriva all'indovina del 2° turno");
    var v0 = vm(C), g = v0.players.filter(function (p) { return !p.via && p.sq === v0.sensSq && p.id !== v0.sens && p.id !== "host"; })[0];
    if (g) { await LU().trascina(LU().tel(C, g.id), 40); await W.aspetta(function () { return Math.abs(vm(C).lan - 40) < 2; }, 3000); }
    await W.dorme(1800);   // (la copia ai vice: al massimo una al secondo)
    var a = vm(C), p0 = punti(a), t0 = Date.now();
    var sent = (function () {
      var visti = [];
      var id = setInterval(function () { amici.forEach(function (n) { var w = W.finestra(n); if (!w || !w.document || !w.document.body) return; var m = W.testo(w).match(/Collegamento perso|La stanza è chiusa|ha chiuso la/); if (m && visti.indexOf(n + ": " + m[0]) < 0) visti.push(n + ": " + m[0]); }); }, 150);
      return { stop: function () { clearInterval(id); return visti; } };
    })();
    // ---- Paky si spegne del tutto ----
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h === ids.Giulia; }, 8000)) no("dopo 8 s la partita non la tiene Giulia (" + JSON.stringify(A.chiTiene(C)) + ")");
    var dt = ((Date.now() - t0) / 1000).toFixed(1);
    var pg = await A.pilloleDi(["Giulia"], /porti avanti tu/, 3000), pa = await A.pilloleDi(["Luca", "Sara", "Marco"], /Ora la partita la tiene Giulia/, 4000);
    if (!pg.Giulia) no("Giulia non legge «… la porti avanti tu» («" + pill(W.finestra("Giulia")) + "»)");
    if (!pa.Luca || !pa.Sara || !pa.Marco) no("gli amici non leggono «Ora la partita la tiene Giulia» (" + JSON.stringify(pa) + ")");
    L.push("Giulia tiene la partita in " + dt + " s" + (a7 ? " (a 7)" : ""));
    // la partita di Giulia: stesso turno, stessi punti, la lancetta dov'era; il respiro, poi si continua
    var b = vm(C);
    if (punti(b) !== p0) no("con Giulia i punti sono cambiati: " + p0 + " → " + punti(b));
    if (b.turno !== a.turno || b.sens !== a.sens || b.passo !== "indovina") no("con Giulia il turno è cambiato (" + a.turno + "/" + a.passo + " → " + b.turno + "/" + b.passo + ")");
    if (g && Math.abs(b.lan - 40) > 2) no("con Giulia la lancetta non è dov'era (" + b.lan + ")");
    var GH = W.finestra("Giulia").__lunghezzaH && W.finestra("Giulia").__lunghezzaH();
    if (!GH || GH.players.filter(function (p) { return p.id === ids.Giulia; }).length !== 1) no("Giulia non ha il suo posto nella partita che tiene");
    if (b.tiene !== ids.Giulia) no("nella foto chi tiene la partita è " + b.tiene);
    L.push("stesso turno e stessi punti (" + p0 + ")");
    // ---- Paky torna dopo un po' (l'app era solo in secondo piano) ----
    while (Date.now() - t0 < 9000) { try { await LU().giocaPasso(C, { veloce: true }); } catch (e) {} await W.dorme(200); }
    var t1 = Date.now();
    A.torna("Paky");
    var pp = await A.pilloleDi(["Paky"], /Bentornato.*Giulia.*rientri come giocatore/, 9000);
    if (!pp.Paky) no("Paky non legge «👋 Bentornato! Ora la partita la tiene Giulia…» («" + pill(W.finestra("Paky")) + "»)");
    await giocaFino(C, function (v) { return v.fase !== "gioco" || (v.players || []).some(function (p) { return p.id === "host" && !p.via; }); }, 30000, "Paky non rientra al suo posto");
    L.push("Paky torna e rientra da giocatore");
    // ---- fino alla classifica ----
    await giocaFino(C, function (v) { return v.fase === "fine"; }, 480000, "la partita tenuta da Giulia non arriva alla classifica");
    await W.dorme(3500);
    var altre = A.fotoDa(C, t1 + 2500).filter(function (x) { return x.h !== ids.Giulia; });
    if (altre.length) no("dopo il ritorno di Paky ci sono foto di un altro host: " + JSON.stringify(altre.slice(0, 3)));
    var c = A.chiTiene(C); if (c.g !== 2 || c.h !== ids.Giulia) no("alla fine la partita non la tiene più Giulia (" + JSON.stringify(c) + ")");
    var f = vm(C).fine, cl = (f && f.classifica) || [];
    if (cl.length !== 5) no("classifica: " + JSON.stringify(cl));
    if (!cl.some(function (x) { return x.nome === "Paky"; })) no("Paky non è in classifica");
    if (!await W.aspetta(function () { return /Nuova partita|Rivincita/.test(T(W.finestra("Giulia"))); }, 20000)) no("Giulia (tiene la partita) non vede la classifica con «Nuova partita»");
    nomi.forEach(function (n) { if ((W.__partite || {})[n] !== 1) no("partite (XP) date: " + JSON.stringify(W.__partite) + " (" + n + " doveva averne 1)"); });
    var es = (W.BR.storia || []).filter(function (x) { return x.topic.indexOf("/" + C + "/stato") >= 0 && x.p.indexOf('"__esito"') >= 0; });
    if (es.length !== 1 || es[0].da !== "Giulia") no("gli __esito sono " + es.length + " (" + es.map(function (x) { return x.da; }).join(", ") + "): doveva essere 1, di Giulia");
    var vv = sent.stop(); if (vv.length) no("schermate viste: " + vv.join("; "));
    errori();
    L.push("classifica " + (f.formula === "squadre" ? f.sqPunti.join("-") : cl.map(function (x) { return x.nome + " " + x.punti; }).join(", ")) + "; XP una volta a testa, un __esito di Giulia, mai due host");
    return L.join(" · ");
  } });

  COPIONE.gruppo5lu = async function () { var out = {}; for (var n of ["5lu1", "5lu2", "5lu3"]) out[n] = await COPIONE.prova(n); return out; };
})();

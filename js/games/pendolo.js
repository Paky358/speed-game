/* =========================================================
   GIOCO — "Palla a Pendolo" (ispirato a Wii Party)
   Visuale finto-3D su Canvas 2D (stessa per tutti): di spalle in basso,
   la trave a metà schermo con 3 posti, la palla oscilla IN PROFONDITÀ.
   Il lancio ha FORZA FISSA (arriva sempre alla trave) ed è lento: conta
   MIRARE e il TEMPISMO. La palla colpisce all'andata e al ritorno.
   Chi sta sulla trave si muove ◀ ▶ e SALTA per schivare.
   Vince il lanciatore se li butta giù tutti entro il tempo,
   altrimenti vince chi resta sulla trave.
   Modi: DA SOLO (lanci tu contro 3 bot, o stai sulla trave) e ONLINE
   (host-autoritativo: in saletta ognuno sceglie se lanciare o stare sulla
   trave; posti liberi = bot; chi arriva a trave piena guarda).
   ========================================================= */
(function () {
  "use strict";
  var TH_BEAM = 1.0, SWING = 2.0, AIMK = 1.5, AIMG = 2.4, NSEAT = 3, HZ = 40;   // invii host ~25/s (più fluido per gli ospiti)
  var PEAKD = 1.28, PBEAM = 1.0;   // la palla va OLTRE la trave (picco profondità 1.28); il piano della trave è a p=1.0
  var BEAM_L = 0.14, BEAM_R = 0.86, AIM_SPAN = 0.40, MOVSP = 0.36, HITF = 0.075, JUMP = 0.6, MINSEP = 0.11;
  var JCD = 1.1;        // ricarica del salto (dall'inizio del salto): dopo l'atterraggio mezzo secondo e si risalta
  var RIPOSO = 0.3;     // dopo un giro la palla si ferma un attimo in mano (niente lanci a raffica)
  var CODA_FINE = 1.4;  // secondi di "ultimo tuffo" (al rallentatore) prima della schermata finale
  var LENTO = 0.45;     // velocità del rallentatore
  var T_ANDATA = Math.asin(PBEAM / PEAKD) / Math.PI;   // a che punto del giro la palla arriva alla trave (≈0,285)
  var PARTITE_SALVATE = {};
  // il mirino di chi lancia lo vede anche chi è sulla trave? (regola; di solito no)
  function vuoiMirino() { try { return localStorage.getItem("sg-pendolo-mirino-trave") === "1"; } catch (e) { return false; } }
  var COLSEAT = ["#ff6b6b", "#4dabf7", "#51cf66"];
  // bravura dei bot. Sulla trave: nota = quanto spesso si accorgono del lancio, rea = prontezza (s), corsa = velocità di fuga,
  // jErr = errore nel tempo del salto, cammina = passo. Chi lancia: lCd = pausa tra i lanci, aimErr = errore di mira,
  // anticipo = quanto prevede dove vai, umano = quanto preferisce mirare alle persone, finta = finte, giroBot = durata del giro.
  function diffP(d) {
    return d === "facile"    ? { dur: 40, durTrave: 18, nota: 0.55, rea: 0.40, reaVar: 0.25, corsa: 0.24, jErr: 0.24, cammina: 0.13,
                                 lCd: 2.0, lCdVar: 1.4, aimErr: 0.15, anticipo: 0, umano: 0.4, finta: 0, giroBot: 2.3, aimBot: 0.8 }
         : d === "difficile" ? { dur: 30, durTrave: 22, nota: 0.88, rea: 0.24, reaVar: 0.14, corsa: 0.33, jErr: 0.10, cammina: 0.21,
                                 lCd: 1.0, lCdVar: 0.8, aimErr: 0.035, anticipo: 1, umano: 0.7, finta: 0.3, giroBot: 1.8, aimBot: 1.4 }
         :                      { dur: 34, durTrave: 20, nota: 0.74, rea: 0.31, reaVar: 0.18, corsa: 0.29, jErr: 0.16, cammina: 0.17,
                                 lCd: 1.5, lCdVar: 1.0, aimErr: 0.08, anticipo: 0.6, umano: 0.55, finta: 0.15, giroBot: 2.0, aimBot: 1.1 };
  }
  // il carattere di ogni bot sulla trave (a caso a ogni partita)
  var CARATTERI = [
    { id: "fifone", corsa: 1.15, rea: -0.04, salto: 0.15, jErr: 1.2, pausa: 0.4, passo: 1.15 },   // scappa appena vede la palla
    { id: "furbo",  corsa: 1.0,  rea: 0.0,   salto: 0.7,  jErr: 0.6, pausa: 0.8, passo: 0.95 },   // aspetta e salta all'ultimo
    { id: "pigro",  corsa: 0.85, rea: 0.07,  salto: 0.35, jErr: 1.0, pausa: 1.8, passo: 0.6 }     // sta fermo e si muove poco
  ];
  // frasi (fumetti sulla trave e fine partita)
  var GRIDA = ["Nooo! 💦", "Aiuto!", "Che freddo! 🥶", "Mamma mia!", "Non vale!", "Glu glu…", "Ci rivediamo!", "La mia pettinatura!", "Ma dai!", "Chiamate il bagnino!"];
  var SCAMPATI = ["Mancato! 😜", "Per un pelo!", "Ciao ciao!", "Troppo lento!", "Non mi prendi!", "Uff, che paura!", "Olé! 💃", "Riprova!", "Ehi, attento!", "Fiuuu…"];
  var FR = {
    lancV: ["Tutti a fare il bagno! 💦", "Mira da cecchino: trave sgombra!", "Strike! Nemmeno uno in piedi. 🎳", "Il pendolo ha parlato: tutti in acqua!",
            "Che braccio! Li hai spazzati via.", "Piscina piena, trave vuota! 🏊", "Bagnini, al lavoro: ne avete tre da ripescare!", "Lancio da campione: tutti giù!"],
    lancP: ["Tempo scaduto: qualcuno è ancora lì che ride.", "Ci sono ancora degli equilibristi sulla trave…", "Il pendolo stavolta ha fatto cilecca.",
            "Quasi! La prossima volta mira dove vanno, non dove sono.", "Sono scappati come anguille! 🐟", "Niente bagno per tutti: riprova!", "Ti hanno fatto ballare, eh? 💃"],
    traveV: ["Equilibrio da circo: sei rimasto in piedi! 🎪", "Asciutto come un biscotto! 🍪", "La palla ti ha cercato ma non ti ha trovato.",
             "Agile come un gatto sul tetto! 🐈", "Resistito fino all'ultimo secondo!", "Nemmeno una goccia addosso! ☀️", "Il re della trave sei tu! 👑"],
    traveP: ["Splash! Bagno fuori stagione. 💦", "Ti ha beccato: tutto bagnato!", "Un tuffo da 10 e lode… ma non era voluto.", "Il pendolo non perdona!",
             "Acqua alla gola! Riprova. 🌊", "Volevi volare, sei finito a nuotare.", "Asciugamano, presto! 🧺"]
  };
  function aCaso(a) { return a[(Math.random() * a.length) | 0]; }
  function mischia(a) { for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function virgola(n, k) { return (+n || 0).toFixed(k == null ? 1 : k).replace(".", ","); }
  function nuovoIdPartita(modo) { return modo + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8); }
  function salvaTrofei(r) {
    try {
      if (!r || r.spettatore || r.modo === "prova" || !r.gameId || !(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo() && SGNube.salvaProgressi)) return;
      var profilo = SGNube.profilo(), nome = String(profilo.nome || "").trim();
      var nomePartita = String(r.nome || "").trim().toLowerCase();
      if (!nome || (nome.toLowerCase() !== nomePartita && nome.slice(0, 16).toLowerCase() !== nomePartita)) return;
      var idProfilo = String(profilo.uid || nome).trim().toLowerCase();
      var chiave = "pendolo|" + r.gameId + "|" + idProfilo;
      if (PARTITE_SALVATE[chiave]) return;
      var chiaveSalvataggio = "sg-pendolo-partita-salvata-" + idProfilo + "-" + String(r.gameId);
      try { if (window.localStorage && localStorage.getItem(chiaveSalvataggio) === "1") { PARTITE_SALVATE[chiave] = 1; return; } } catch (e) {}
      var incrs = [["partite", 1]], record = [], valori = [];
      var ruolo = r.ruolo === "lanciatore" ? "lanciatore" : "trave";
      if (ruolo === "lanciatore") incrs.push(["partiteLanciatore", 1]);
      else incrs.push(["partiteTrave", 1]);
      // sfida vera: contro bot non Facili, oppure (online) contro almeno una persona
      var sfidaValida = r.modo === "bot" ? r.difficolta !== "facile" : r.modo === "online" && (r.avversariUmani > 0 || (r.difficolta && r.difficolta !== "facile"));
      var abbattuti = Math.max(0, Math.min(3, Math.floor(+r.abbattuti || 0)));
      var schivate = Math.max(0, Math.floor(+r.schivate || 0));
      if (sfidaValida) {
        if (abbattuti) incrs.push(["avversariButtati", abbattuti]);
        if (schivate) incrs.push(["saltiRiusciti", schivate]);
        if (r.vinto) {
          incrs.push(["vittorie", 1]);
          incrs.push([ruolo === "lanciatore" ? "vittorieLanciatore" : "vittorieTrave", 1]);
          if (r.modo === "online" && r.avversariUmani > 0) incrs.push(["vittorieOnline", 1]);
          // sulla trave col mirino visibile schivare è più facile: i trofei del Difficile non contano
          if (r.modo === "bot" && r.difficolta === "difficile" && !(ruolo === "trave" && r.mirino)) incrs.push([ruolo === "lanciatore" ? "vittorieLanciatoreDifficile" : "vittorieTraveDifficile", 1]);
          if (ruolo === "lanciatore" && abbattuti === 3) {
            incrs.push(["tripletta", 1]);
            if (r.modo === "bot" && r.difficolta === "difficile" && +r.durata <= 10) incrs.push(["triplettaDifficileVeloce", 1]);
          }
        }
      }
      PARTITE_SALVATE[chiave] = 1;
      try { if (window.localStorage) localStorage.setItem(chiaveSalvataggio, "1"); } catch (e) {}
      SGNube.salvaProgressi(null, "pendolo", incrs, record, valori);
    } catch (e) {}
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ballXf(a, p) { return 0.5 + a * AIM_SPAN * (0.45 + 0.55 * (p > 1 ? 1 : p)); }
  function beamXf(a) { return clamp(0.5 + a * AIM_SPAN, BEAM_L, BEAM_R); }

  // ---------- suoni (niente vibrazione: il telefono vibra solo quando tocchi per scegliere) ----------
  function tono(f0, f1, dur, tipo, vol) { var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try { var tt = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = tipo || "square";
      o.frequency.setValueAtTime(f0, tt); o.frequency.exponentialRampToValueAtTime(f1, tt + dur);
      g.gain.setValueAtTime(vol || 0.18, tt); g.gain.exponentialRampToValueAtTime(0.0001, tt + dur);
      o.connect(g); g.connect(c.destination); o.start(tt); o.stop(tt + dur + 0.02); } catch (e) {} }
  function whoosh() { tono(680, 260, 0.22, "sine", 0.12); }
  function colpo() { tono(420, 110, 0.13, "square", 0.24); }
  function splash() { tono(220, 60, 0.18, "sine", 0.16); }
  function fanfara() { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { tono(f, f, 0.16, "triangle", 0.2); }, i * 110); }); }

  // ---------- simulazione (locale e host) ----------
  function mkChars(assign) {   // assign[seat] = id (umano) | null (bot). Posti e caratteri a caso.
    var slot = mischia([0.24, 0.5, 0.76]), car = mischia(CARATTERI.slice()), c = [];
    for (var i = 0; i < NSEAT; i++) {
      var x = clamp(slot[i] + (Math.random() * 2 - 1) * 0.05, BEAM_L, BEAM_R);
      c.push({ fx: x, vx: 0, mov: 0, jt: 0, jcd: 0, alive: true, schivate: 0, scampati: 0, human: !!(assign && assign[i]), ctrl: assign ? assign[i] : null,
        car: car[i % car.length], tx: x, pausa: Math.random() * 0.8, piano: null });
    }
    return c;
  }
  function diventaBot(c) { c.human = false; c.ctrl = null; c.mov = 0; c.tx = c.fx; c.pausa = 0.4; c.piano = null; if (!c.car) c.car = CARATTERI[0]; }
  function nuovoStato(P, chars, aiLanc) {
    return { th: 0, swinging: false, tSw: 0, giro: SWING, riposo: 0, aim: 0, aimLock: 0, aimHold: 0, lanciaFlag: false, chars: chars, time: P.dur,
      fase: "gioco", esito: null, tFine: 0, durata: 0, tGioco: 0, lanci: 0, aiLanc: !!aiLanc, aiTarget: -1, aiFinta: -1, aiErr: 0, aiCd: 0.9, collis: false };
  }
  function pDi(ST) { var p = ST.th / TH_BEAM; return p < 0 ? 0 : p > 1.4 ? 1.4 : p; }
  // il bot che lancia: sceglie chi colpire (meglio le persone), a volte fa una finta
  function scegliBersaglio(ST, P) {
    var vivi = [], umani = [];
    ST.chars.forEach(function (c, i) { if (c.alive) { vivi.push(i); if (c.human) umani.push(i); } });
    ST.aiFinta = -1;
    if (!vivi.length) { ST.aiTarget = -1; return; }
    var lista = umani.length && Math.random() < P.umano ? umani : vivi;
    ST.aiTarget = lista[(Math.random() * lista.length) | 0];
    ST.aiErr = (Math.random() * 2 - 1) * P.aimErr;
    if (vivi.length > 1 && Math.random() < P.finta) {   // prima punta un altro, poi cambia all'ultimo
      var altri = vivi.filter(function (i) { return i !== ST.aiTarget; });
      ST.aiFinta = ST.aiTarget; ST.aiTarget = altri[(Math.random() * altri.length) | 0];
    }
  }
  // la mira segue il bersaglio e prevede dove sarà quando arriva la palla
  function botLancia(ST, P, dt) {
    if (ST.fase !== "gioco") { ST.aimHold = 0; return; }
    ST.aiCd -= dt;
    var tg = ST.chars[ST.aiTarget];
    if (!tg || !tg.alive) { scegliBersaglio(ST, P); tg = ST.chars[ST.aiTarget]; }
    if (!tg) { ST.aimHold = 0; return; }
    var vx = tg.human ? tg.mov * MOVSP : tg.vx, px = clamp(tg.fx + vx * P.anticipo * T_ANDATA * P.giroBot, BEAM_L, BEAM_R);
    var goal = clamp((px + ST.aiErr - 0.5) / AIM_SPAN, -1, 1);
    ST.aimHold = clamp((goal - ST.aim) * 25, -1, 1);
    if (!ST.swinging && ST.riposo <= 0 && ST.aiCd <= 0 && Math.abs(goal - ST.aim) < 0.06) {
      if (ST.aiFinta >= 0 && ST.chars[ST.aiFinta] && ST.chars[ST.aiFinta].alive) {   // finta finita: ora il bersaglio vero
        ST.aiTarget = ST.aiFinta; ST.aiFinta = -1; ST.aiErr = (Math.random() * 2 - 1) * P.aimErr; return;
      }
      ST.lanciaFlag = true; ST.aiCd = P.lCd + Math.random() * P.lCdVar; ST.aiTarget = -1;
    }
  }
  // al lancio ogni bot sulla trave si prepara: si accorge (o no) della palla dopo un attimo di reazione
  function preparaBot(ST, P) {
    ST.chars.forEach(function (c) { if (c.human || !c.alive) return;
      c.piano = { rt: Math.max(0.08, P.rea + c.car.rea + Math.random() * P.reaVar), vede: Math.random() < P.nota, fatto: false, azione: "niente", meta: null, tSalto: 0, saltato: false };
    });
  }
  function decidiBot(c, ST, P, tNow) {
    var pl = c.piano; pl.fatto = true;
    if (!pl.vede) return;
    var bx = beamXf(ST.aimLock), tA = T_ANDATA * ST.giro, marg = HITF + 0.025;
    if (Math.abs(c.fx - bx) >= marg) { pl.azione = "lontano"; return; }   // non punta a me: però sotto la palla non ci vado
    var corsa = P.corsa * c.car.corsa, uscite = [];
    if (bx - marg >= BEAM_L) uscite.push(bx - marg); if (bx + marg <= BEAM_R) uscite.push(bx + marg);
    uscite.sort(function (a, b) { return Math.abs(a - c.fx) - Math.abs(b - c.fx); });
    var meta = uscite.length ? uscite[0] : null, inTempo = meta != null && tNow + Math.abs(meta - c.fx) / corsa < tA - 0.02;
    if (c.jcd <= 0 && c.jt <= 0 && (!inTempo || Math.random() < c.car.salto)) {   // salta (e poi si sposta prima del ritorno)
      pl.azione = "salto"; pl.meta = meta; pl.tSalto = Math.max(tNow, tA - 0.3 + (Math.random() * 2 - 1) * P.jErr * c.car.jErr);
    } else if (meta != null) { pl.azione = "fuga"; pl.meta = meta; }
  }
  function vaga(c, P, dt) {   // passeggia sulla trave, con pause
    if (c.pausa > 0) { c.pausa -= dt; return; }
    var dd = c.tx - c.fx, v = P.cammina * c.car.passo;
    if (Math.abs(dd) < 0.006) { c.pausa = Math.random() * c.car.pausa; c.tx = BEAM_L + Math.random() * (BEAM_R - BEAM_L); return; }
    c.fx += (dd > 0 ? 1 : -1) * Math.min(Math.abs(dd), v * dt);
  }
  function muoviBot(c, ST, P, dt) {
    var pl = ST.swinging && ST.fase === "gioco" ? c.piano : null;
    if (pl) {
      var tNow = ST.tSw * ST.giro, tA = T_ANDATA * ST.giro;
      if (!pl.fatto && tNow >= pl.rt) decidiBot(c, ST, P, tNow);
      if (pl.azione === "salto") {
        if (!pl.saltato && tNow >= pl.tSalto) { pl.saltato = true; if (c.jcd <= 0) { c.jt = JUMP; c.jcd = JCD; } }
        if (pl.saltato && c.jt <= 0 && tNow > tA) pl.azione = pl.meta != null ? "fuga" : "niente";   // atterrato: via da sotto prima del ritorno
        else return;
      }
      if (pl.azione === "fuga") {
        var dd = pl.meta - c.fx;
        if (Math.abs(dd) < 0.004) pl.azione = "lontano";
        else { c.fx += (dd > 0 ? 1 : -1) * Math.min(Math.abs(dd), P.corsa * c.car.corsa * dt); return; }
      }
      if (pl.azione === "lontano") {
        var bx = beamXf(ST.aimLock), marg = HITF + 0.03;
        if ((c.tx - bx) * (c.fx - bx) < 0 || Math.abs(c.tx - bx) < marg) c.tx = c.fx;   // la meta è sotto la palla: si ferma
      }
    }
    vaga(c, P, dt);
  }
  function passo(ST, dt, P) {
    if (ST.fase === "gioco") { ST.time -= dt; if (ST.time < 0) ST.time = 0; ST.tGioco += dt; }
    if (ST.aiLanc) botLancia(ST, P, dt);
    ST.aim = clamp(ST.aim + ST.aimHold * AIMK * (ST.aiLanc ? P.aimBot : 1) * dt, -1, 1);
    if (ST.riposo > 0) ST.riposo -= dt;
    var pPrev = pDi(ST);
    if (ST.lanciaFlag && !ST.swinging && ST.riposo <= 0 && ST.fase === "gioco") {
      ST.swinging = true; ST.tSw = 0; ST.aimLock = ST.aim; ST.giro = ST.aiLanc ? P.giroBot : SWING; ST.lanci++; preparaBot(ST, P);
    }
    ST.lanciaFlag = false;
    if (ST.swinging) { ST.tSw += dt / ST.giro; if (ST.tSw >= 1) { ST.swinging = false; ST.tSw = 0; ST.th = 0; ST.riposo = RIPOSO; } else ST.th = PEAKD * Math.sin(ST.tSw * Math.PI); }
    else ST.th = 0;
    var p = pDi(ST), bxf = beamXf(ST.aimLock);
    for (var i = 0; i < ST.chars.length; i++) { var c = ST.chars[i]; if (!c.alive) continue;
      var x0 = c.fx;
      if (c.human) c.fx += c.mov * MOVSP * dt;
      else if (c.jt <= 0) muoviBot(c, ST, P, dt);
      else if (c.piano && c.piano.azione === "salto") muoviBot(c, ST, P, dt);
      c.fx = clamp(c.fx, BEAM_L, BEAM_R);
      c.vx = dt > 0 ? (c.fx - x0) / dt : 0;
      if (c.jt > 0) c.jt -= dt; if (c.jcd > 0) c.jcd -= dt;
    }
    if (ST.collis) {   // i personaggi non si attraversano: separali di almeno MINSEP
      var idx = []; for (var z = 0; z < ST.chars.length; z++) if (ST.chars[z].alive) idx.push(z);
      idx.sort(function (a, b) { return ST.chars[a].fx - ST.chars[b].fx; });
      for (var m = 1; m < idx.length; m++) { var A = ST.chars[idx[m - 1]], B = ST.chars[idx[m]], gap = B.fx - A.fx;
        if (gap < MINSEP) { var push = (MINSEP - gap) / 2;
          A.fx = clamp(A.fx - push, BEAM_L, BEAM_R); B.fx = clamp(B.fx + push, BEAM_L, BEAM_R);
          if (!A.human) A.tx = A.fx; if (!B.human) B.tx = B.fx;   // i bot si fermano al contatto (e poi scelgono un'altra meta)
        }
      }
    }
    // colpisce ATTRAVERSANDO il piano della trave (p=PBEAM), sia in andata sia in ritorno
    var crossOut = ST.tSw < 0.5 && pPrev < PBEAM && p >= PBEAM;
    var crossBack = ST.tSw >= 0.5 && pPrev > PBEAM && p <= PBEAM;
    if (ST.swinging && ST.fase === "gioco" && (crossOut || crossBack)) {
      for (var j = 0; j < ST.chars.length; j++) { var b = ST.chars[j]; if (!b.alive) continue;
        var aria = b.jt > JUMP * 0.06 && b.jt < JUMP * 0.97, dist = Math.abs(b.fx - bxf), sottoPalla = dist < HITF;
        if (sottoPalla && !aria) { b.alive = false; b.tCad = ST.tGioco; }   // tCad = quanto è rimasto sulla trave
        else if (dist < HITF + 0.05) { b.scampati++; if (aria && sottoPalla && b.human) b.schivate++; }   // l'ha scampata (per il fumetto e i trofei)
      }
    }
  }
  function snapDa(ST, ms) {
    return { f: ST.fase, e: ST.esito, tm: +ST.time.toFixed(2), ai: +ST.aim.toFixed(4), ba: +(ST.swinging ? ST.aimLock : ST.aim).toFixed(4), p: +pDi(ST).toFixed(4),
      sw: ST.swinging ? 1 : 0, rp: ST.riposo > 0 ? 1 : 0,
      c: ST.chars.map(function (x) { return { x: +x.fx.toFixed(4), j: +Math.max(0, x.jt).toFixed(3), cd: +Math.max(0, x.jcd).toFixed(2), a: x.alive ? 1 : 0, m: x.scampati }; }), ms: (ms == null ? -1 : ms) };
  }
  function vivi(chars) { var n = 0; for (var i = 0; i < chars.length; i++) if (chars[i].a ? chars[i].a : chars[i].alive) n++; return n; }
  function contaVivi(ST) { return ST.chars.filter(function (x) { return x.alive; }).length; }

  // ---------- avatar: sulla trave si vedono di faccia, chi lancia lo vediamo di spalle ----------
  // i bot: quelli del gruppo fisso (SG.bot: sempre gli stessi nomi e avatar in tutti i giochi), scelti per la bravura;
  // escludi = i nomi di chi gioca (nessun bot si chiama come uno di loro). Ognuno { nome, cfg } come i posti della scena
  function prendiBot(n, livello, escludi) {
    var b = null;
    try { if (window.SG && SG.bot && SG.bot.prendi) b = SG.bot.prendi(n, { livello: livello, escludi: escludi }); } catch (e) {}
    if (!b || b.length < n) { b = []; for (var k = 0; k < n; k++) b.push({ nome: "Bot " + (k + 1), omino: null }); }   // (di sicurezza)
    return b.map(function (x) { return { nome: x.nome, cfg: x.omino || null }; });
  }
  function mioAvatar(nome) {
    var p = window.SGNube && SGNube.profilo && SGNube.profilo();
    if (p && p.omino) return p.omino;
    return window.SGOmino ? SGOmino.casuale(nome || "io") : null;
  }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function facciaDi(nome, cfg) {
    if (avatarValido(cfg)) return cfg;
    return window.SGOmino ? SGOmino.casuale(nome || "Bot") : null;   // (di sicurezza: i bot arrivano già col loro avatar)
  }
  function immagine(cfg) {   // l'avatar come immagine (pronta dopo un attimo): poi si copia una volta in una bitmap
    if (!cfg || !window.SGOmino) return null;
    var img = new Image(); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(cfg)); return img;
  }
  function colore(lista, v) { return typeof v === "string" && v.charAt(0) === "#" ? v : (lista[v] || lista[0]); }
  function scurisci(h, k) {
    var n = parseInt(String(h).slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function c(v) { return Math.max(0, Math.min(255, Math.round(v * k))); }
    return "rgb(" + c(r) + "," + c(g) + "," + c(b) + ")";
  }
  // chi lancia, visto DA DIETRO: spalle con la sua maglia, collo, orecchie, nuca coi suoi capelli (corti, medi o lunghi), cappello
  function schiena(ctx, cx, hy, r, cfg) {
    var O = SGOmino.OPZ, pelle = colore(O.pelle, cfg.pelle), cap = colore(O.colCap, cfg.colCap), mag = colore(O.maglia, cfg.maglia);
    var acc = colore(O.colAcc, cfg.colAcc != null ? cfg.colAcc : cfg.maglia);
    var i = O.capelli.indexOf(cfg.capelli), G = SGOmino.GRUPPI_CAPELLI, lung = i >= G[2][1] ? 2 : (i >= G[1][1] ? 1 : 0);
    var calvo = /^(calvo|rasato|chierica)$/.test(cfg.capelli);
    ctx.save();
    // spalle e schiena
    var gm = ctx.createLinearGradient(cx - r * 2.6, 0, cx + r * 2.6, 0);
    gm.addColorStop(0, scurisci(mag, 0.7)); gm.addColorStop(0.45, mag); gm.addColorStop(1, scurisci(mag, 0.6));
    ctx.fillStyle = gm; ctx.strokeStyle = scurisci(mag, 0.5); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - r * 2.9, hy + r * 5); ctx.quadraticCurveTo(cx - r * 2.8, hy + r * 1.5, cx, hy + r * 1.25);
    ctx.quadraticCurveTo(cx + r * 2.8, hy + r * 1.5, cx + r * 2.9, hy + r * 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.moveTo(cx, hy + r * 1.6); ctx.lineTo(cx, hy + r * 4.5); ctx.stroke();   // piega della schiena
    // collo
    ctx.fillStyle = scurisci(pelle, 0.85); ctx.fillRect(cx - r * 0.42, hy + r * 0.55, r * 0.84, r * 0.85);
    // capelli lunghi che scendono sulla schiena
    if (!calvo && lung === 2) {
      ctx.fillStyle = cap; ctx.beginPath(); ctx.moveTo(cx - r * 1.02, hy); ctx.quadraticCurveTo(cx - r * 1.25, hy + r * 2.2, cx - r * 0.9, hy + r * 3.1);
      ctx.quadraticCurveTo(cx, hy + r * 3.4, cx + r * 0.9, hy + r * 3.1); ctx.quadraticCurveTo(cx + r * 1.25, hy + r * 2.2, cx + r * 1.02, hy); ctx.closePath(); ctx.fill();
    }
    // orecchie e testa
    ctx.fillStyle = pelle;
    [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.ellipse(cx + s * r * 0.98, hy + r * 0.08, r * 0.2, r * 0.3, 0, 0, 7); ctx.fill(); });
    var gp = ctx.createRadialGradient(cx - r * 0.3, hy - r * 0.3, r * 0.2, cx, hy, r * 1.05);
    gp.addColorStop(0, pelle); gp.addColorStop(1, scurisci(pelle, 0.8));
    ctx.fillStyle = gp; ctx.beginPath(); ctx.arc(cx, hy, r, 0, 7); ctx.fill();
    // nuca coi capelli
    if (!calvo) {
      ctx.save(); ctx.beginPath(); ctx.arc(cx, hy, r * 1.05, 0, 7); ctx.clip();
      var gc = ctx.createRadialGradient(cx - r * 0.35, hy - r * 0.5, r * 0.1, cx, hy, r * 1.2);
      gc.addColorStop(0, cap); gc.addColorStop(1, scurisci(cap, 0.6));
      ctx.fillStyle = gc; ctx.fillRect(cx - r * 1.2, hy - r * 1.2, r * 2.4, r * (lung ? 2.4 : 1.55));
      ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx - r * 0.1, hy - r * 0.2, r * 0.6, 3.5, 4.6); ctx.stroke();
      ctx.restore();
      if (lung === 1) {
        ctx.fillStyle = cap; ctx.beginPath(); ctx.moveTo(cx - r * 1.03, hy); ctx.quadraticCurveTo(cx - r * 1.08, hy + r * 1.1, cx - r * 0.5, hy + r * 1.25);
        ctx.lineTo(cx + r * 0.5, hy + r * 1.25); ctx.quadraticCurveTo(cx + r * 1.08, hy + r * 1.1, cx + r * 1.03, hy); ctx.closePath(); ctx.fill();
      }
    }
    // cappello (visto da dietro: la calotta col colore scelto)
    if (cfg.cappello && cfg.cappello !== "nessuno") {
      ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(cx, hy - r * 0.05, r * 1.08, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); ctx.fill();
      ctx.fillStyle = scurisci(acc, 0.7); ctx.fillRect(cx - r * 1.08, hy - r * 0.12, r * 2.16, r * 0.2);
    }
    ctx.restore();
  }

  // ---------- scena (canvas a tutto schermo + comandi sopra l'acqua, per ruolo) ----------
  function assicuraStilePendolo() {
    if (document.getElementById("sg-pendolo-css")) return;
    var st = document.createElement("style"); st.id = "sg-pendolo-css";
    st.textContent = ".schermata.pd-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden}" +
      ".pd-campo{position:relative;width:100%;height:var(--alt,100dvh);overflow:hidden;background:#0a3f61}" +
      ".pd-campo canvas{position:absolute;inset:0;display:block;touch-action:none}" +
      ".pd-comandi{position:absolute;left:0;right:0;bottom:calc(10px + env(safe-area-inset-bottom));display:flex;justify-content:space-between;align-items:flex-end;padding:0 10px;pointer-events:none}" +
      ".pd-comandi > div{display:flex;gap:8px;pointer-events:auto;touch-action:none}" +
      ".pd-tasto{width:64px;height:64px;border-radius:18px;border:2px solid rgba(255,255,255,.35);background:rgba(8,20,48,.55);color:#fff;font:inherit;font-size:1.5rem;font-weight:900;touch-action:none;cursor:pointer;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);transition:transform .08s,background .08s}" +
      ".pd-tasto.on,.pd-tasto:active{transform:scale(.94);background:rgba(255,255,255,.3)}" +
      ".pd-tasto.grande{width:auto;min-width:118px;padding:0 16px;font-size:1.05rem;background:linear-gradient(180deg,#ffe57e,#f4b011);color:#3a2500;border-color:#fff2b0}" +
      ".pd-tasto:disabled{opacity:.4}" +
      ".pd-guarda{position:absolute;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);background:rgba(4,18,28,.72);color:#fff;padding:9px 16px;border-radius:16px;font-weight:800;white-space:nowrap;pointer-events:none}" +
      ".pd-stat{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}" +
      ".pd-stat > div{background:rgba(255,255,255,.07);border-radius:12px;padding:10px 4px;text-align:center}" +
      ".pd-stat b{display:block;font-size:1.35rem;line-height:1.2}" +
      ".pd-stat small{display:block;opacity:.75;font-size:.76rem;margin-top:2px}" +
      ".pd-record{text-align:center;font-weight:800;margin-top:12px;color:#ffd43b}";
    document.head.appendChild(st);
  }
  // ◀ ▶ come un'unica zona: il pollice può scivolare da un tasto all'altro senza fermarsi
  function pad(box, bSx, bDx, fn) {
    var pid = null, dir = 0;
    function set(d) { if (d === dir) return; dir = d; bSx.classList.toggle("on", d < 0); bDx.classList.toggle("on", d > 0); fn(d); }
    function daX(x) { var r1 = bSx.getBoundingClientRect(), r2 = bDx.getBoundingClientRect(); return x < (r1.right + r2.left) / 2 ? -1 : 1; }
    box.addEventListener("pointerdown", function (e) { if (e.target !== bSx && e.target !== bDx) return; e.preventDefault(); pid = e.pointerId; try { box.setPointerCapture(pid); } catch (x) {} set(daX(e.clientX)); });
    box.addEventListener("pointermove", function (e) { if (e.pointerId !== pid) return; e.preventDefault(); set(daX(e.clientX)); });
    function su(e) { if (e.pointerId !== pid) return; pid = null; set(0); }
    box.addEventListener("pointerup", su); box.addEventListener("pointercancel", su); box.addEventListener("lostpointercapture", su);
    return set;
  }
  // av = { posti: [{ cfg, nome } x3], lanc: { cfg, nome } }; ruolo = "lanciatore" | "trave" | "guarda"; opz.mirino = chi è sulla trave vede la mira
  function creaScena(t, ruolo, cb, av, opz) {
    var el = t.el;
    opz = opz || {};
    assicuraStilePendolo();
    var s = t.schermata({ indietro: function () { if (window.confirm("Uscire dal gioco?")) cb.onEsci(); } });
    s.classList.add("pd-piena");   // a tutto schermo: niente titolo, niente bordi
    var campo = el("div", { class: "pd-campo" });
    var cv = el("canvas");
    campo.appendChild(cv); s._contenuto.appendChild(campo);
    var bSalta = null, bLancia = null, setDir = function () {};
    if (ruolo === "guarda") campo.appendChild(el("div", { class: "pd-guarda", text: "👀 Stai guardando la partita" }));
    else {
      var comandi = el("div", { class: "pd-comandi" }), sx = el("div"), dx = el("div");
      comandi.appendChild(sx); comandi.appendChild(dx); campo.appendChild(comandi);
      var bSx = el("button", { class: "pd-tasto", text: "◀", "aria-label": ruolo === "trave" ? "Sinistra" : "Mira a sinistra" });
      var bDx = el("button", { class: "pd-tasto", text: "▶", "aria-label": ruolo === "trave" ? "Destra" : "Mira a destra" });
      sx.appendChild(bSx); sx.appendChild(bDx);
      if (ruolo === "trave") {
        bSalta = el("button", { class: "pd-tasto grande", text: "⤴ SALTA" }); dx.appendChild(bSalta);
        setDir = pad(sx, bSx, bDx, function (d) { cb.onMov(d); });
        bSalta.addEventListener("pointerdown", function (e) { e.preventDefault(); cb.onSalta(); });
      } else {
        bLancia = el("button", { class: "pd-tasto grande", text: "🎯 LANCIA" }); dx.appendChild(bLancia);
        setDir = pad(sx, bSx, bDx, function (d) { cb.onAim(d); });
        bLancia.addEventListener("pointerdown", function (e) { e.preventDefault(); cb.onLancia(); });
        var dX = null, mov = 0, tD = 0;   // trascinare sul campo = mirare; un tocco breve = lanciare
        cv.addEventListener("pointerdown", function (e) { dX = e.clientX; mov = 0; tD = performance.now(); try { cv.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
        cv.addEventListener("pointermove", function (e) { if (dX === null) return; var ddx = e.clientX - dX; dX = e.clientX; mov += Math.abs(ddx); cb.onAimDrag(ddx / (cv.clientWidth || 300)); e.preventDefault(); });
        cv.addEventListener("pointerup", function (e) { if (dX !== null && mov < 14 && performance.now() - tD < 400) cb.onLancia(); dX = null; if (cb.onAimDragFine) cb.onAimDragFine(); e.preventDefault(); });
        cv.addEventListener("pointercancel", function () { dX = null; if (cb.onAimDragFine) cb.onAimDragFine(); });
      }
    }
    t.mostra(s);
    av = av || {};
    var posti = [];
    for (var i = 0; i < NSEAT; i++) {
      var p = (av.posti && av.posti[i]) || {}, nome = p.nome || "Bot", cfg = facciaDi(nome, p.cfg);
      posti.push({ nome: nome, cfg: cfg, img: immagine(cfg), bmp: null, bmpH: 0 });
    }
    var lanc = av.lanc || {};
    var ctx = cv.getContext("2d"), ref = { cv: cv, ctx: ctx, W: 0, H: 0, dpr: 1, primo: true, prevA: [], prevM: [], fallers: [], splashes: [], gocce: [], testi: [], fumetti: {},
      shake: 0, colpiLancio: 0, prevSw: 0, ruolo: ruolo, mirino: !!opz.mirino, bSalta: bSalta, bLancia: bLancia, posti: posti,
      lancCfg: facciaDi(lanc.nome || "Bot", lanc.cfg), lancNome: lanc.nome || "Bot", t0: performance.now(), tBan: 0,
      aiuto: ruolo === "trave" ? "Scappa ◀ ▶ o SALTA quando arriva la palla!" : ruolo === "guarda" ? "Stai guardando: tocca a te alla prossima!" : "Mira ◀ ▶ (o trascina) e LANCIA!" };
    function dim() {
      var w = campo.clientWidth || Math.min(window.innerWidth || 360, 600), h = campo.clientHeight || (window.innerHeight || 640), dpr = Math.min(3, window.devicePixelRatio || 1);
      cv.style.width = w + "px"; cv.style.height = h + "px"; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ref.W = w; ref.H = h; ref.dpr = dpr;
    }
    dim(); setTimeout(dim, 120); window.addEventListener("resize", dim);
    // tasti (computer): si tiene conto di quali frecce sono ancora premute
    var giu = {};
    function dirTasti() { return (giu.r ? 1 : 0) - (giu.l ? 1 : 0); }
    function kd(e) { var k = e.key.toLowerCase(), prima = dirTasti();
      if (k === "arrowleft" || k === "a") giu.l = true; else if (k === "arrowright" || k === "d") giu.r = true;
      else if (k === " " || k === "arrowup" || k === "w") { if (e.repeat) return; if (ruolo === "trave") cb.onSalta(); else if (ruolo === "lanciatore") cb.onLancia(); e.preventDefault(); return; }
      else return;
      if (dirTasti() !== prima) setDir(dirTasti()); }
    function ku(e) { var k = e.key.toLowerCase(), prima = dirTasti();
      if (k === "arrowleft" || k === "a") giu.l = false; else if (k === "arrowright" || k === "d") giu.r = false; else return;
      if (dirTasti() !== prima) setDir(dirTasti()); }
    document.addEventListener("keydown", kd); document.addEventListener("keyup", ku);
    ref.rimuovi = function () { window.removeEventListener("resize", dim); document.removeEventListener("keydown", kd); document.removeEventListener("keyup", ku); };
    return ref;
  }

  // ---------- disegni fatti una volta sola (sfondo, chi lancia, avatar come bitmap) ----------
  function sfondo(W, H, dpr) {
    var c = document.createElement("canvas"), d = Math.min(2, dpr); c.width = Math.round(W * d); c.height = Math.round(H * d);
    var g = c.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0);
    var beamY = H * 0.44, waterY = H * 0.56, oriz = H * 0.31;
    var cielo = g.createLinearGradient(0, 0, 0, oriz); cielo.addColorStop(0, "#6cc4ec"); cielo.addColorStop(1, "#d3f0fb");
    g.fillStyle = cielo; g.fillRect(0, 0, W, oriz);
    g.fillStyle = "rgba(255,255,255,.85)";   // nuvole
    [[0.18, 0.11, 1], [0.72, 0.08, 0.8], [0.9, 0.17, 0.6]].forEach(function (n) { var x = n[0] * W, y = n[1] * H, k = n[2] * W * 0.06;
      g.beginPath(); g.ellipse(x, y, k * 1.6, k * 0.6, 0, 0, 7); g.ellipse(x - k * 0.7, y + k * 0.1, k, k * 0.5, 0, 0, 7); g.ellipse(x + k * 0.8, y + k * 0.15, k * 0.9, k * 0.45, 0, 0, 7); g.fill(); });
    // la tribuna col pubblico, sulla riva lontana
    var tTop = oriz - H * 0.085;
    g.fillStyle = "#e8eef3"; g.fillRect(0, tTop, W, oriz - tTop);
    var seme = 7; function rnd() { seme = (seme * 9301 + 49297) % 233280; return seme / 233280; }
    var colori = ["#ff6b6b", "#ffd43b", "#4dabf7", "#51cf66", "#f783ac", "#ff922b", "#845ef7", "#ffffff"];
    for (var r = 0; r < 3; r++) { var y = tTop + 6 + r * (H * 0.025), passoX = Math.max(7, W / 46);
      g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(0, y + 4, W, 2);
      for (var x = passoX / 2 + (r % 2) * passoX / 2; x < W; x += passoX) { g.fillStyle = colori[(rnd() * colori.length) | 0]; g.beginPath(); g.arc(x, y + 2 - rnd() * 2, 2.6, 0, 7); g.fill(); } }
    g.fillStyle = "#ff6b6b"; g.fillRect(0, tTop - 5, W, 5);
    for (var b = 0; b < W; b += 26) { g.fillStyle = (b / 26) % 2 ? "#ffd43b" : "#4dabf7"; g.beginPath(); g.moveTo(b, tTop); g.lineTo(b + 13, tTop + 9); g.lineTo(b + 26, tTop); g.fill(); }   // bandierine
    // acqua: lontana chiara, vicina scura
    var acqua = g.createLinearGradient(0, oriz, 0, H); acqua.addColorStop(0, "#5fc0e6"); acqua.addColorStop(0.3, "#2b95cc"); acqua.addColorStop(1, "#0a3f61");
    g.fillStyle = acqua; g.fillRect(0, oriz, W, H - oriz);
    g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(0, oriz, W, 2);
    // trave con i due pali
    var h = 13, nearW = W * 0.92, farOff = (W - nearW) / 2;
    g.strokeStyle = "rgba(60,30,10,.55)"; g.lineWidth = 7;
    [0.2, 0.8].forEach(function (u) { var px = farOff + nearW * u; g.beginPath(); g.moveTo(px, beamY + h); g.lineTo(px, waterY + 6); g.stroke(); });
    g.fillStyle = "#b5793a"; g.beginPath(); g.moveTo(farOff, beamY); g.lineTo(W - farOff, beamY); g.lineTo(W - farOff + 9, beamY + h); g.lineTo(farOff - 9, beamY + h); g.closePath(); g.fill();
    g.fillStyle = "#8a5522"; g.fillRect(farOff - 9, beamY + h, nearW + 18, 4);
    g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; g.beginPath(); g.moveTo(farOff + 4, beamY + 4); g.lineTo(W - farOff - 4, beamY + 4); g.stroke();
    return c;
  }
  function lanciatoreBmp(ref) {   // chi lancia di spalle, disegnato una volta
    var W = ref.W, H = ref.H, rT = Math.min(W * 0.075, H * 0.05), cx = W / 2, hy = H * 0.84;
    var x0 = cx - rT * 3.1, y0 = hy - rT * 1.3, w = rT * 6.2, h = H - y0, d = ref.dpr, c = document.createElement("canvas");
    c.width = Math.ceil(w * d); c.height = Math.ceil(h * d);
    var g = c.getContext("2d"); g.setTransform(d, 0, 0, d, -x0 * d, -y0 * d);
    schiena(g, cx, hy, rT, ref.lancCfg);
    return { c: c, x: x0, y: y0, w: w, h: h, rT: rT };
  }
  function bitmapDi(ref, posto, h) {
    var img = posto && posto.img; if (!img || !img.complete || !img.naturalWidth) return null;
    var hh = Math.round(h);
    if (posto.bmp && posto.bmpH === hh) return posto.bmp;
    var w = Math.round(hh * 200 / 264), d = ref.dpr, c = document.createElement("canvas"); c.width = Math.ceil(w * d); c.height = Math.ceil(hh * d);
    try { c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); } catch (e) { return null; }
    posto.bmp = c; posto.bmpH = hh; return c;
  }

  // ---------- disegno da snapshot ----------
  function render(ref, S, dt) {
    var W = ref.W, H = ref.H, ctx = ref.ctx; if (!W || !H || !S || !S.c) return;
    var beamY = H * 0.44, waterY = H * 0.56, handsY = H * 0.92, cx = W / 2, hA = avH(W, H), ora = performance.now();
    if (!ref.bg || ref.bgK !== W + "x" + H) { ref.bg = sfondo(W, H, ref.dpr); ref.bgK = W + "x" + H; ref.lb = null; }
    if (!ref.lb && ref.lancCfg && window.SGOmino) { try { ref.lb = lanciatoreBmp(ref); } catch (e) { ref.lb = null; ref.lancCfg = null; } }
    // eventi: chi cade, chi la scampa, il lancio
    if (ref.primo) { ref.primo = false; for (var i0 = 0; i0 < S.c.length; i0++) { ref.prevA[i0] = S.c[i0].a; ref.prevM[i0] = S.c[i0].m; } ref.prevSw = S.sw; }
    var nuovi = 0;
    for (var i = 0; i < S.c.length; i++) { var ci = S.c[i];
      if (ref.prevA[i] && !ci.a) { nuovi++; var lato = ci.x < 0.5 ? -1 : 1;
        ref.fallers.push({ x: ci.x * W, y: beamY, vx: lato * W * 0.16, vy: -H * 0.45, rot: 0, vr: lato * 7, seat: i, grido: aCaso(GRIDA) });
        ref.testi.push({ x: ci.x * W, y: beamY - hA * 1.25, testo: "+1", t: 1 }); delete ref.fumetti[i]; }
      if (ref.prevM[i] != null && ci.m > ref.prevM[i] && ci.a) ref.fumetti[i] = { testo: aCaso(SCAMPATI), t: 1.3 };
      ref.prevA[i] = ci.a; ref.prevM[i] = ci.m; }
    if (S.sw && !ref.prevSw) { whoosh(); ref.colpiLancio = 0; } ref.prevSw = S.sw;
    if (nuovi) { colpo(); ref.shake = 0.32; ref.colpiLancio += nuovi;
      if (ref.colpiLancio >= 2) ref.testi.push({ x: cx, y: H * 0.25, testo: ref.colpiLancio >= 3 ? "TRIPLETTA! 🎳" : "DOPPIETTA!", t: 1.5, grande: true }); }
    // tasti spenti quando non servono
    if (ref.bSalta) { var mio = S.ms >= 0 ? S.c[S.ms] : null, off = !mio || !mio.a || mio.cd > 0 || S.f !== "gioco"; if (ref.bSalta.disabled !== off) ref.bSalta.disabled = off; }
    if (ref.bLancia) { var offL = !!(S.sw || S.rp || S.f !== "gioco"); if (ref.bLancia.disabled !== offL) ref.bLancia.disabled = offL; }
    // il mondo (col piccolo scossone quando qualcuno cade)
    ctx.save();
    if (ref.shake > 0) { ref.shake -= dt; var k = Math.max(0, ref.shake) * 22; ctx.fillStyle = "#0a3f61"; ctx.fillRect(0, 0, W, H); ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k); }
    ctx.drawImage(ref.bg, 0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 2;
    for (var kw = 0; kw < 3; kw++) { var yy = waterY + 16 + kw * 24; ctx.beginPath();
      for (var x = 0; x <= W; x += 14) ctx.lineTo(x, yy + Math.sin(x * 0.05 + ora * 0.002 + kw) * 4); ctx.stroke(); }
    // geometria palla (calcolata prima: serve per lo z-order e per l'ombra)
    var p = S.p, bx = ballXf(S.ba, p) * W, by = handsY + (beamY - handsY) * p, r = H * 0.085 * (1 - 0.5 * (p > 1 ? 1 : p)), sc = 1 - Math.min(1, p) * 0.6;
    function disegnaPalla() {
      ctx.strokeStyle = "rgba(30,20,10,.6)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, handsY); ctx.lineTo(bx, by); ctx.stroke();
      var gg = ctx.createRadialGradient(bx - r * 0.3, by - r * 0.3, r * 0.2, bx, by, r); gg.addColorStop(0, "#ff8f6b"); gg.addColorStop(1, "#c0392b");
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.beginPath(); ctx.arc(bx - r * 0.3, by - r * 0.3, r * 0.25, 0, 7); ctx.fill();
    }
    // ombra sull'acqua (dietro a tutto)
    ctx.fillStyle = "rgba(0,0,0," + (0.28 * (1 - Math.min(1, p) * 0.6)) + ")"; ctx.beginPath(); ctx.ellipse(bx, waterY + 8, r * 0.9 * sc + 6, r * 0.32 * sc + 3, 0, 0, 7); ctx.fill();
    // dove arriva la palla lanciata (la zona che colpisce)
    if (S.sw && S.f === "gioco") { var zx = beamXf(S.ba) * W;
      ctx.fillStyle = "rgba(255,60,60," + (0.22 + 0.12 * Math.sin(ora * 0.02)).toFixed(3) + ")"; ctx.beginPath(); ctx.ellipse(zx, beamY + 6, HITF * W, 6, 0, 0, 7); ctx.fill(); }
    // mirino: chi lancia lo vede sempre; chi è sulla trave solo se la regola lo dice
    if (S.f === "gioco" && (ref.ruolo === "lanciatore" || ref.mirino)) { var mx = beamXf(S.ai) * W, my = beamY + 7; ctx.strokeStyle = "rgba(255,70,70,.9)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(mx - 9, my); ctx.lineTo(mx + 9, my); ctx.moveTo(mx, my - 9); ctx.lineTo(mx, my + 9); ctx.stroke();
      ctx.fillStyle = "rgba(255,70,70,.22)"; ctx.beginPath(); ctx.arc(mx, my, 6, 0, 7); ctx.fill(); }
    if (p > 1.0) disegnaPalla();   // palla OLTRE la trave: disegnala DIETRO i personaggi
    // personaggi sulla trave
    var tag = [];
    for (var c = 0; c < S.c.length; c++) { var ch = S.c[c]; if (!ch.a) continue;
      var jy = ch.j > 0 ? -Math.sin((JUMP - ch.j) / JUMP * Math.PI) * H * 0.09 : 0;
      if (!disegnaAvatar(ctx, bitmapDi(ref, ref.posti[c], hA), ch.x * W, beamY + jy, hA, 0)) botDis(ctx, ch.x * W, beamY + jy, COLSEAT[c], 1, 0);
      tag.push({ c: c, x: ch.x * W, y: beamY + jy - hA * 1.02, testo: c === S.ms ? "TU" : ref.posti[c].nome, cd: c === S.ms ? ch.cd : 0 });
    }
    // targhette: se due nomi si toccano, quello dopo sale di una riga
    ctx.font = "bold 12px system-ui";
    tag.forEach(function (v) { v.w = ctx.measureText(v.testo).width + 16; v.liv = 0; });
    tag.sort(function (a, b) { return a.x - b.x; });
    tag.forEach(function (v, n) { for (var q = 0; q < n; q++) { var u = tag[q]; if (u.liv === v.liv && Math.abs(u.x - v.x) < (u.w + v.w) / 2 + 2 && Math.abs(u.y - v.y) < 22) { v.liv++; q = -1; if (v.liv > 2) break; } } });
    tag.forEach(function (v) { var ty = v.y - v.liv * 22;
      targhetta(ctx, v.x, ty, v.testo, COLSEAT[v.c], v.c === S.ms);
      if (v.cd > 0) {   // barretta di ricarica del salto (sopra il nome)
        var bw = W * 0.12, byy = ty - 17, pr = clamp(1 - v.cd / JCD, 0, 1);
        ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(v.x - bw / 2, byy, bw, 5);
        ctx.fillStyle = "#ffd43b"; ctx.fillRect(v.x - bw / 2, byy, bw * pr, 5);
      }
      var fu = ref.fumetti[v.c]; if (fu) { fu.t -= dt; if (fu.t <= 0) delete ref.fumetti[v.c]; else fumetto(ctx, v.x, ty - (v.cd > 0 ? 34 : 24), fu.testo, Math.min(1, fu.t / 0.3)); }
    });
    // chi cade: vola via girando, poi lo schizzo
    for (var f = ref.fallers.length - 1; f >= 0; f--) { var fa = ref.fallers[f]; fa.vy += H * 2.2 * dt; fa.x += fa.vx * dt; fa.y += fa.vy * dt; fa.rot += fa.vr * dt;
      if (fa.vy > 0 && fa.y >= waterY + 4) { splash(); ref.splashes.push({ x: fa.x, y: waterY + 4, r: 6, a: 1 });
        for (var gq = 0; gq < 9; gq++) ref.gocce.push({ x: fa.x, y: waterY + 2, vx: (Math.random() - 0.5) * W * 0.35, vy: -H * (0.25 + Math.random() * 0.35), t: 0.9 });
        ref.fallers.splice(f, 1); continue; }
      if (!disegnaAvatar(ctx, bitmapDi(ref, ref.posti[fa.seat], hA), fa.x, fa.y, hA * 0.9, fa.rot)) botDis(ctx, fa.x, fa.y, COLSEAT[fa.seat], 0.9, fa.rot);
      fumetto(ctx, fa.x + (fa.vx > 0 ? 1 : -1) * hA * 0.5, fa.y - hA * 1.05, fa.grido, 1); }
    for (var q2 = ref.splashes.length - 1; q2 >= 0; q2--) { var sp = ref.splashes[q2]; sp.r += W * 0.20 * dt; sp.a -= dt * 1.6;
      if (sp.a <= 0) ref.splashes.splice(q2, 1); else { ctx.strokeStyle = "rgba(255,255,255," + sp.a.toFixed(3) + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(sp.x, sp.y, sp.r, sp.r * 0.35, 0, 0, 7); ctx.stroke(); } }
    ctx.fillStyle = "rgba(220,245,255,.9)";
    for (var gi = ref.gocce.length - 1; gi >= 0; gi--) { var go = ref.gocce[gi]; go.t -= dt; go.vy += H * 1.6 * dt; go.x += go.vx * dt; go.y += go.vy * dt;
      if (go.t <= 0 || (go.vy > 0 && go.y > waterY + 6)) { ref.gocce.splice(gi, 1); continue; } ctx.beginPath(); ctx.arc(go.x, go.y, 2.6, 0, 7); ctx.fill(); }
    if (p <= 1.0) disegnaPalla();   // palla davanti/alla trave: DAVANTI ai personaggi
    // chi lancia, visto di spalle in basso al centro (col suo avatar: capelli, pelle, maglia, cappello)
    var rT = Math.min(W * 0.075, H * 0.05);
    if (ref.lb) ctx.drawImage(ref.lb.c, ref.lb.x, ref.lb.y, ref.lb.w, ref.lb.h);
    else { ctx.fillStyle = "#3a4150"; ctx.beginPath(); ctx.arc(cx, H * 0.92, H * 0.05, 0, 7); ctx.fill(); }
    targhetta(ctx, cx, H * 0.84 - rT * 1.6, ref.ruolo === "lanciatore" ? "TU" : (ref.lancNome || "Bot"), "#ffd43b", ref.ruolo === "lanciatore");
    ctx.restore();
    // scritte che salgono (+1, DOPPIETTA!)
    for (var ti = ref.testi.length - 1; ti >= 0; ti--) { var tx = ref.testi[ti]; tx.t -= dt; tx.y -= (tx.grande ? 18 : 40) * dt;
      if (tx.t <= 0) { ref.testi.splice(ti, 1); continue; }
      ctx.save(); ctx.globalAlpha = Math.min(1, tx.t / 0.4); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = tx.grande ? "900 30px system-ui" : "900 22px system-ui"; ctx.lineWidth = 5; ctx.strokeStyle = "rgba(4,18,28,.8)"; ctx.fillStyle = tx.grande ? "#ffd43b" : "#fff";
      ctx.strokeText(tx.testo, tx.x, tx.y); ctx.fillText(tx.testo, tx.x, tx.y); ctx.restore(); }
    // aiuto nei primi secondi
    var tA = (ora - ref.t0) / 1000;
    if (tA < 4.5 && S.f === "gioco") { ctx.save(); ctx.globalAlpha = Math.min(1, (4.5 - tA) / 0.6); ctx.font = "bold 13px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      var lw = ctx.measureText(ref.aiuto).width + 24; ctx.fillStyle = "rgba(4,18,28,.72)";
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(W / 2 - lw / 2, 44, lw, 28, 14); else ctx.rect(W / 2 - lw / 2, 44, lw, 28); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillText(ref.aiuto, W / 2, 58.5); ctx.restore(); }
    // fine partita: la scritta grande mentre si vede l'ultimo tuffo
    if (S.f === "fine") {
      if (!ref.tBan) ref.tBan = ora;
      var mioV = S.ms >= 0 && S.c[S.ms] && S.c[S.ms].a, ban = S.e === "tempo" ? (ref.ruolo === "trave" && mioV ? "🏆 RESISTITO!" : "⏱️ TEMPO!") : "SPLASH! 💦";
      var kb = Math.min(1, (ora - ref.tBan) / 260), scala = kb < 1 ? 0.4 + 0.75 * kb : 1.15 - 0.15 * Math.min(1, (ora - ref.tBan - 260) / 200);
      ctx.save(); ctx.translate(W / 2, H * 0.22); ctx.scale(scala, scala); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "900 " + Math.round(Math.min(W * 0.11, 46)) + "px system-ui"; ctx.lineWidth = 8; ctx.strokeStyle = "rgba(4,18,28,.85)"; ctx.fillStyle = "#fff";
      ctx.strokeText(ban, 0, 0); ctx.fillText(ban, 0, 0); ctx.restore();
    }
    // HUD
    var nv = vivi(S.c);
    ctx.fillStyle = "rgba(4,18,28,.5)"; ctx.fillRect(0, 0, W, 34);
    ctx.font = "bold 18px system-ui"; ctx.textBaseline = "middle";
    ctx.fillStyle = S.tm <= 5 && S.f === "gioco" ? "#ffb3b3" : "#fff";
    ctx.textAlign = "left"; ctx.fillText("⏱️ " + Math.ceil(S.tm) + "s", 58, 17);   // a sinistra c'è il tasto indietro
    ctx.fillStyle = "#fff"; ctx.textAlign = "right"; ctx.fillText((ref.ruolo === "lanciatore" ? "🎯 Da buttare giù: " : "🏃 In piedi: ") + nv, W - 12, 17); ctx.textAlign = "left";
  }
  function avH(W, H) { return Math.min(H * 0.155, W * 0.3); }   // altezza dell'avatar sulla trave
  // l'avatar (bitmap) coi piedi sul punto x,y; se ruota (cade) gira attorno al centro
  function disegnaAvatar(ctx, bmp, x, y, h, rot) {
    if (!bmp) return false;
    var w = h * 200 / 264;
    ctx.save();
    if (!rot) { ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.beginPath(); ctx.ellipse(x, y + 2, w * 0.3, h * 0.035, 0, 0, 7); ctx.fill(); }
    ctx.translate(x, y - h / 2); if (rot) ctx.rotate(rot);
    ctx.drawImage(bmp, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }
  // targhetta col nome sopra la testa (bordo del colore del posto; "TU" dorato)
  function targhetta(ctx, x, y, testo, col, mio) {
    ctx.save(); ctx.font = "bold 12px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    var w = ctx.measureText(testo).width + 16, h = 20;
    ctx.fillStyle = mio ? "#ffd43b" : "rgba(10,18,50,.82)"; ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, 10); else ctx.rect(x - w / 2, y - h / 2, w, h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = mio ? "#3a2500" : "#fff"; ctx.fillText(testo, x, y + 0.5);
    ctx.restore();
  }
  function fumetto(ctx, x, y, testo, a) {   // nuvoletta bianca con una battuta
    ctx.save(); ctx.globalAlpha = a; ctx.font = "bold 12px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    var w = ctx.measureText(testo).width + 14, h = 20, W = ctx.canvas.width / (ctx.getTransform ? ctx.getTransform().a || 1 : 1);
    x = clamp(x, w / 2 + 4, Math.max(w / 2 + 4, W - w / 2 - 4));
    ctx.fillStyle = "#fff"; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, 9); else ctx.rect(x - w / 2, y - h / 2, w, h); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 4, y + h / 2 - 1); ctx.lineTo(x, y + h / 2 + 5); ctx.lineTo(x + 4, y + h / 2 - 1); ctx.fill();
    ctx.fillStyle = "#1b2a3a"; ctx.fillText(testo, x, y + 0.5); ctx.restore();
  }
  function botDis(ctx, x, y, col, sc, rot) {
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sc, sc);
    ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(0, 4, 15, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -13, 14, 17, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#ffe0c2"; ctx.beginPath(); ctx.arc(0, -32, 9, 0, 7); ctx.fill();
    ctx.fillStyle = "#222"; ctx.fillRect(-5, -34, 3, 3); ctx.fillRect(3, -34, 3, 3);
    ctx.restore();
  }
  // schermata finale: titolo, frase, numeri della partita, record
  // o = { vinto, guarda, icona?, titolo?, frase, stat: [[valore, etichetta] x3], record?, onRigioca?, onEsci }
  function schermataFine(t, o) {
    assicuraStilePendolo();
    if (o.vinto && !o.guarda) fanfara();
    var r = t.schermata({ icona: o.icona || (o.vinto ? "🏆" : "💦"), titolo: o.titolo || (o.vinto ? "Hai vinto!" : "Hai perso"), sotto: "Palla a Pendolo" });
    r._contenuto.appendChild(t.el("p", { style: "text-align:center;font-size:1.1rem;line-height:1.5;margin-top:10px", text: o.frase }));
    if (o.stat && o.stat.length) r._contenuto.appendChild(t.el("div", { class: "pd-stat" }, o.stat.map(function (x) { return t.el("div", {}, [t.el("b", { text: String(x[0]) }), t.el("small", { text: x[1] })]); })));
    if (o.record) r._contenuto.appendChild(t.el("p", { class: "pd-record", text: o.record }));
    // online: i tasti di fine uguali per tutti i giochi (Rivincita, Ci sto…); se il core non li mette, quelli di sempre
    if (o.online && t.tastiFine && t.tastiFine(r._piede, { host: !!o.online.host, nuova: o.onRigioca || null, esci: o.onEsci })) { t.mostra(r); return; }
    if (o.onRigioca) r._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🔄 Rigioca", onclick: o.onRigioca }));
    else r._piede.appendChild(t.el("p", { class: "modulo-nota", text: "In attesa dell'host per un'altra partita…" }));
    r._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: o.onEsci }));
    t.mostra(r);
  }
  function statFine(ruolo, d) {   // d = { abbattuti, durata, lanci, schivate, scampati, resistito }
    if (ruolo === "lanciatore") return [[d.abbattuti + "/3", "buttati giù"], [virgola(d.durata) + " s", "tempo"], [d.lanci, d.lanci === 1 ? "lancio" : "lanci"]];
    return [[d.schivate, "salti riusciti"], [d.scampati, "palle scampate"], [virgola(d.resistito) + " s", "sulla trave"]];
  }
  function fraseFine(ruolo, vinto) { return aCaso(ruolo === "lanciatore" ? (vinto ? FR.lancV : FR.lancP) : (vinto ? FR.traveV : FR.traveP)); }
  // record personale da solo: il tempo più breve per buttarli giù tutti (per bravura dei bot)
  function recordLancio(diff, sec) {
    var k = "sg-pendolo-record-" + diff, prima = null;
    try { prima = parseFloat(localStorage.getItem(k)); } catch (e) {}
    var nome = { facile: "Facile", medio: "Medio", difficile: "Difficile" }[diff] || diff;
    if (!(prima > 0) || sec < prima) { try { localStorage.setItem(k, String(sec.toFixed(2))); } catch (e) {} return "🏅 Nuovo record a " + nome + ": " + virgola(sec) + " s!"; }
    return "Il tuo record a " + nome + ": " + virgola(prima) + " s";
  }

  // ========================================================
  //  DA SOLO — lanci tu contro 3 bot, oppure stai sulla trave
  // ========================================================
  function locale(t, diff, ruolo, collis, mirino) {
    ruolo = ruolo === "trave" ? "trave" : "lanciatore";
    var P = diffP(diff), raf = null, vivo = true, last = performance.now(), ST, ref, mySeat, gameId = nuovoIdPartita("bot");
    var io = (t.giocatori && t.giocatori[0]) || "Tu";
    function inGioco() { return ST && ST.fase === "gioco"; }
    var bots = prendiBot(3, diff, [io]);   // i bot del gruppo fisso (per la bravura scelta): se stai sulla trave tu, il primo lancia
    if (ruolo === "trave") {   // TU sulla trave (posto 0), un bot lancia, gli altri 2 posti = bot
      ST = nuovoStato(P, mkChars({ 0: "io", 1: null, 2: null }), true); ST.time = P.durTrave; mySeat = 0;
      ref = creaScena(t, "trave", { onAim: function () {}, onAimDrag: function () {}, onLancia: function () {},
        onMov: function (d) { ST.chars[0].mov = inGioco() ? d : 0; }, onSalta: function () { var c = ST.chars[0]; if (inGioco() && c.alive && c.jt <= 0 && c.jcd <= 0) { c.jt = JUMP; c.jcd = JCD; } },
        onEsci: function () { stop(); t.esci(); } }, { posti: [{ nome: io, cfg: mioAvatar(io) }, bots[1], bots[2]], lanc: bots[0] }, { mirino: mirino });
    } else {                   // TU lanci contro 3 bot
      ST = nuovoStato(P, mkChars(null), false); mySeat = -1;
      ref = creaScena(t, "lanciatore", { onAim: function (d) { ST.aimHold = d; }, onAimDrag: function (fr) { ST.aim = clamp(ST.aim + fr * AIMG, -1, 1); },
        onLancia: function () { if (inGioco()) ST.lanciaFlag = true; }, onMov: function () {}, onSalta: function () {},
        onEsci: function () { stop(); t.esci(); } }, { posti: bots.slice(0, 3), lanc: { nome: io, cfg: mioAvatar(io) } });
    }
    ST.collis = !!collis;
    var durTot = ruolo === "trave" ? P.durTrave : P.dur, vinto = false;
    function stop() { vivo = false; if (raf) cancelAnimationFrame(raf); ref.rimuovi(); }
    function loop(now) { if (!vivo) return; var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (ST.fase !== "gioco") dt *= LENTO;   // l'ultimo tuffo al rallentatore
      passo(ST, dt, P); render(ref, snapDa(ST, mySeat), dt);
      if (ST.fase === "gioco") {
        var esito = null;
        if (ruolo === "trave") { if (!ST.chars[0].alive) esito = "caduto"; else if (ST.time <= 0) { esito = "tempo"; vinto = true; } }
        else { var nv = contaVivi(ST); if (nv === 0) { esito = "tutti"; vinto = true; } else if (ST.time <= 0) esito = "tempo"; }
        if (esito) { ST.fase = "fine"; ST.esito = esito; ST.tFine = CODA_FINE * LENTO; ST.durata = durTot - ST.time; ST.chars[0].mov = 0; ST.aimHold = 0; }
      } else if ((ST.tFine -= dt) <= 0) return fine();
      raf = requestAnimationFrame(loop); }
    function fine() { stop();
      var abbattuti = ruolo === "lanciatore" ? 3 - contaVivi(ST) : 0, me = ST.chars[0];
      salvaTrofei({ gameId: gameId, modo: "bot", difficolta: diff, nome: io, ruolo: ruolo, vinto: vinto, mirino: !!mirino,
        abbattuti: abbattuti, schivate: ruolo === "trave" ? me.schivate : 0, durata: ST.durata });
      // XP e statistiche: contro il Bot (chi lancia o chi lancia contro di te)
      try { if (t.risultato) t.risultato([{ nome: io, pos: vinto ? 1 : 2 }, { nome: bots[0].nome, pos: vinto ? 2 : 1, bot: true }]); } catch (e) {}   // un intoppo negli XP non deve bloccare la fine
      schermataFine(t, { vinto: vinto, frase: fraseFine(ruolo, vinto),
        stat: statFine(ruolo, { abbattuti: abbattuti, durata: ST.durata, lanci: ST.lanci, schivate: me.schivate, scampati: me.scampati, resistito: me.alive ? ST.durata : (me.tCad || ST.durata) }),
        record: ruolo === "lanciatore" && vinto ? recordLancio(diff, ST.durata) : null,
        onRigioca: function () { locale(t, diff, ruolo, collis, mirino); }, onEsci: t.esci }); }
    raf = requestAnimationFrame(loop);
  }

  // ========================================================
  //  ONLINE — host-autoritativo. In saletta ognuno sceglie il ruolo.
  // ========================================================
  function hostPendolo(t, diff, N, collis, mirino) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var P = diffP(diff), codice = "…", pronta = false;
    var posti = {}, nomi = { host: (t.giocatori && t.giocatori[0]) || "Host" }, lanc = "host";
    var omini = { host: mioAvatar(nomi.host) };   // avatar di chi gioca (id -> cfg)
    var attesa = [];   // chi è entrato a trave piena o a partita iniziata: guarda, ed entra appena si libera un posto
    for (var _s = 0; _s < NSEAT; _s++) posti[_s] = null;   // seat -> id | null(bot)
    var fase = "lobby", ST = null, ref = null, loop = null, ultimoInvio = 0, last = 0, rete = null, gameId = "", viaMsg = null, vintoL = false;
    // "⚙️ Regole" in saletta: bravura dei bot, collisioni e mirino valgono dalla prossima partita
    t.onRegole = function (im) { im = im || t.impostazioni || {}; diff = im.difficolta || "medio"; P = diffP(diff); collis = !!im.collisioni; mirino = !!im.mirino; };

    function seatDi(id) { for (var s = 0; s < NSEAT; s++) if (posti[s] === id) return s; return -1; }
    function dentro(id) { return lanc === id || seatDi(id) >= 0; }
    function postoLibero() { for (var s = 0; s < NSEAT; s++) if (!posti[s]) return s; return -1; }
    // nella Sala sulla trave (e a lanciare) va solo chi è stato scelto ("Chi gioca?"): gli altri guardano
    function siede(id) { return id === "host" || !t.puoSedersi || t.puoSedersi(id, nomi[id]); }
    function fuori() { return attesa.filter(function (id) { return !siede(id); }); }
    function riempiPosti() { attesa = attesa.filter(function (id) { return nomi[id] && !dentro(id); });
      var resto = []; attesa.forEach(function (id) { var p = postoLibero(); if (p >= 0 && siede(id)) posti[p] = id; else resto.push(id); }); attesa = resto; }
    function seggi() { var a = []; for (var s = 0; s < NSEAT; s++) a.push(posti[s] ? { id: posti[s], nome: nomi[posti[s]] } : null); return a; }
    function umaniTrave() { var n = 0; for (var s = 0; s < NSEAT; s++) if (posti[s]) n++; return n; }
    function claim(id) {   // id (che ha già un posto sulla trave) diventa lanciatore; il vecchio lanciatore prende il suo posto
      var sMio = seatDi(id); if (lanc === id || sMio < 0) return;
      posti[sMio] = lanc; lanc = id;
    }
    // l'host sceglie il proprio ruolo: va nello slot T ("L" = lanciatore, 0..2 = posto sulla trave);
    // chi c'era (bot o giocatore) prende il vecchio posto dell'host. Cosi ci si scambia con bot o giocatori.
    function occSlot(T) { return T === "L" ? lanc : posti[T]; }
    function mettiSlot(T, v) { if (T === "L") lanc = v; else posti[T] = v; }
    function slotDi(id) { if (lanc === id) return "L"; var s = seatDi(id); return s >= 0 ? s : null; }
    function hostVaA(T) {
      var H = slotDi("host"); if (H === T) return;
      var O = occSlot(T);
      mettiSlot(T, "host");
      if (H !== null) mettiSlot(H, O);
      else if (O && O !== "host") { var lib = postoLibero(); if (lib >= 0) posti[lib] = O; else attesa.push(O); }  // di sicurezza
    }

    rete = SGNet.ospita("pendolo", {
      onCodice: function (c) { codice = c; lobbyAgg(); },
      onConnesso: function () { pronta = true; lobbyAgg(); },
      onAddio: function (id) {
        var s = seatDi(id), eraLanc = lanc === id;
        if (s >= 0) posti[s] = null;
        if (eraLanc) lanc = null;   // a lanciare va un bot
        attesa = attesa.filter(function (x) { return x !== id; });
        delete nomi[id]; delete omini[id];
        if (fase === "lobby") { riempiPosti(); lobbyAgg(); return; }
        if (ST && fase === "gioco") {   // a partita in corso il suo personaggio lo prende un bot
          if (eraLanc) { ST.aiLanc = true; ST.aiTarget = -1; ST.aimHold = 0; ST.aiCd = 0.6; }
          if (s >= 0 && ST.chars[s]) diventaBot(ST.chars[s]);
        }
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          nomi[id] = String(m.nome || nomi[id] || "Amico").slice(0, 16); var om = avatarValido(m.omino); if (om) omini[id] = om;
          if (fase === "lobby") {
            if (!dentro(id) && attesa.indexOf(id) < 0) { var p = postoLibero(); if (p >= 0 && siede(id)) posti[p] = id; else attesa.push(id); }
            lobbyAgg();
          } else if (dentro(id)) { if (fase === "gioco" && viaMsg) rete.invia(viaMsg); }   // chi rientra: gli rimando la partita (nomi, avatar, ruoli)
          else { if (attesa.indexOf(id) < 0) attesa.push(id); rete.inviaVeloce({ t: "guardi", to: id, fuori: !siede(id) }); }   // arrivato a partita iniziata: guarda
        }
        else if (m.t === "vuoiLanciare") {
          if (fase !== "lobby") return;
          if (seatDi(id) >= 0) claim(id);
          else if (attesa.indexOf(id) >= 0 && lanc === null && siede(id)) { attesa = attesa.filter(function (x) { return x !== id; }); lanc = id; }   // chi aspetta può lanciare al posto del bot
          lobbyAgg();
        }
        else if (m.t === "vuoiTrave") {   // chi lanciava torna sulla trave (in un posto dei bot); a lanciare va un bot
          if (fase === "lobby" && lanc === id) { var lib = postoLibero(); if (lib >= 0) { posti[lib] = id; lanc = null; } lobbyAgg(); } }
        else if (fase === "gioco" && ST && ST.fase === "gioco") {
          if (id === lanc) {
            if (m.t === "aim") ST.aimHold = clamp(+m.d || 0, -1, 1);
            else if (m.t === "aimD") ST.aim = clamp(ST.aim + clamp(+m.d || 0, -1, 1) * AIMG, -1, 1);
            else if (m.t === "lancia") ST.lanciaFlag = true;
          } else { var s = seatDi(id), c = s >= 0 ? ST.chars[s] : null;
            if (c && c.human && c.alive) { if (m.t === "mov") c.mov = clamp(+m.d || 0, -1, 1); else if (m.t === "salta" && c.jt <= 0 && c.jcd <= 0) { c.jt = JUMP; c.jcd = JCD; } } }
        }
      },
      onErrore: function () { senzaRete(t); }
    });

    function inizia() {
      riempiPosti();
      gameId = nuovoIdPartita("online"); fase = "gioco"; vintoL = false; ST = nuovoStato(P, mkChars(posti), lanc === null); ST.collis = !!collis;
      // i bot del gruppo fisso (per la bravura scelta), mai col nome di chi è in stanza: se nessuno lancia, lancia il primo
      var bots = prendiBot(NSEAT + 1, diff, Object.keys(nomi).map(function (k) { return nomi[k]; })), nb = 0;
      var av = { posti: [], lanc: lanc ? { nome: nomi[lanc], cfg: omini[lanc] || null } : bots[nb++] };
      for (var sb = 0; sb < NSEAT; sb++) av.posti.push(posti[sb] ? { nome: nomi[posti[sb]], cfg: omini[posti[sb]] || null } : bots[nb++]);
      viaMsg = { t: "via", lanc: lanc, seggi: seggi(), av: av, gameId: gameId, difficolta: diff, mir: mirino ? 1 : 0 };
      rete.invia(viaMsg);   // resta "trattenuto": chi rientra o arriva tardi lo riceve subito
      var mioRuolo = (lanc === "host") ? "lanciatore" : "trave";
      function mioC() { var s = seatDi("host"); return s >= 0 && ST && ST.fase === "gioco" ? ST.chars[s] : null; }
      ref = creaScena(t, mioRuolo, {
        onAim: function (d) { if (mioRuolo === "lanciatore") ST.aimHold = d; }, onAimDrag: function (fr) { if (mioRuolo === "lanciatore") ST.aim = clamp(ST.aim + fr * AIMG, -1, 1); },
        onLancia: function () { if (mioRuolo === "lanciatore" && ST.fase === "gioco") ST.lanciaFlag = true; },
        onMov: function (d) { var c = mioC(); if (c) c.mov = d; },
        onSalta: function () { var c = mioC(); if (c && c.alive && c.jt <= 0 && c.jcd <= 0) { c.jt = JUMP; c.jcd = JCD; } },
        onEsci: function () { chiudi(); t.esci(); }
      }, av, { mirino: mirino });
      last = performance.now(); loop = requestAnimationFrame(giro);
    }
    function giro(now) {
      if (fase !== "gioco") return; var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (ST.fase !== "gioco") dt *= LENTO;   // l'ultimo tuffo al rallentatore
      passo(ST, dt, P);
      var snap = snapDa(ST, seatDi("host"));
      render(ref, snap, dt);
      if (now - ultimoInvio > HZ) { ultimoInvio = now; rete.inviaVeloce({ t: "g", s: snap }); }
      if (ST.fase === "gioco") {
        var nv = contaVivi(ST);
        if (nv === 0 || ST.time <= 0) { vintoL = nv === 0; ST.fase = "fine"; ST.esito = nv === 0 ? "tutti" : "tempo"; ST.tFine = CODA_FINE * LENTO; ST.durata = P.dur - ST.time; ST.aimHold = 0;
          ST.chars.forEach(function (c) { c.mov = 0; }); }
      } else if ((ST.tFine -= dt) <= 0) { rete.inviaVeloce({ t: "g", s: snapDa(ST, -1) }); return fineGioco(vintoL); }
      loop = requestAnimationFrame(giro);
    }
    function fineGioco(vintoLanc) {
      fase = "fine"; if (loop) cancelAnimationFrame(loop);
      var survSeat = {}, schivate = {}, scampati = {}, resist = {};
      for (var s = 0; s < NSEAT; s++) { var cs = ST.chars[s]; survSeat[s] = cs.alive ? 1 : 0; schivate[s] = cs.schivate; scampati[s] = cs.scampati;
        resist[s] = +(cs.alive ? ST.durata : (cs.tCad || ST.durata)).toFixed(1); }   // quanto è rimasto sulla trave
      var abbattuti = 3 - contaVivi(ST), umLanc = lanc ? 1 : 0, umTrave = umaniTrave(), durata = +ST.durata.toFixed(2);
      var hostRuolo = lanc === "host" ? "lanciatore" : "trave", hostSeat = seatDi("host");
      var hostVinto = hostRuolo === "lanciatore" ? !!vintoLanc : !!survSeat[hostSeat];
      salvaTrofei({ gameId: gameId, modo: "online", difficolta: diff, nome: nomi.host, ruolo: hostRuolo, vinto: hostVinto,
        abbattuti: hostRuolo === "lanciatore" ? abbattuti : 0, schivate: hostSeat >= 0 ? schivate[hostSeat] : 0,
        avversariUmani: hostRuolo === "lanciatore" ? umTrave : umLanc, durata: durata });
      rete.invia({ t: "fine", gameId: gameId, difficolta: diff, vintoLanc: vintoLanc ? 1 : 0, surv: survSeat, seggi: seggi(), lanc: lanc,
        umLanc: umLanc, umTrave: umTrave, durata: durata, lanci: ST.lanci, schivate: schivate, scampati: scampati, resist: resist, abbattuti: abbattuti });
      if (t.risultato) {   // per il torneo online e gli XP: prima chi ha vinto (i bot non contano)
        var vinti = [], persi = [];
        if (lanc && nomi[lanc]) (vintoLanc ? vinti : persi).push(nomi[lanc]);
        for (var sv = 0; sv < NSEAT; sv++) if (posti[sv] && nomi[posti[sv]]) (!vintoLanc && survSeat[sv] ? vinti : persi).push(nomi[posti[sv]]);
        try { t.risultato(vinti.map(function (n) { return { nome: n, pos: 1 }; }).concat(persi.map(function (n) { return { nome: n, pos: vinti.length + 1 }; }))); } catch (e) {}
      }
      if (ref) { ref.rimuovi(); ref = null; }
      var hs = hostSeat >= 0 ? ST.chars[hostSeat] : null;
      schermataFine(t, { vinto: hostVinto, frase: fraseFine(hostRuolo, hostVinto),
        stat: statFine(hostRuolo, { abbattuti: abbattuti, durata: durata, lanci: ST.lanci, schivate: hs ? hs.schivate : 0, scampati: hs ? hs.scampati : 0, resistito: hostSeat >= 0 ? resist[hostSeat] : durata }),
        online: { host: true }, onRigioca: function () { tornaLobby(); }, onEsci: function () { chiudi(); t.esci(); } });
    }
    function tornaLobby() { fase = "lobby"; ST = null; viaMsg = null; riempiPosti(); lobbyAgg(); }
    t.onRivincita = tornaLobby;   // la Rivincita della Sala
    function chiudi() { if (loop) cancelAnimationFrame(loop); if (ref) ref.rimuovi(); if (rete) rete.chiudi(); }

    function lobbyAgg() { if (fase !== "lobby") return; rete.invia({ t: "lobby", codice: codice, pronta: pronta, lanc: lanc, seggi: seggi(), nomi: nomi, omini: omini, att: attesa, fuori: fuori() }); disegnaLobby(); }
    function disegnaLobby() { if (fase !== "lobby") return;
      renderLobby(t, { codice: codice, pronta: pronta, sonoHost: true, myId: "host", lanc: lanc, seggi: seggi(), nomi: nomi, omini: omini, att: attesa, fuori: fuori() },
        { onComincia: inizia,
          onLancio: function () { hostVaA("L"); lobbyAgg(); },
          onTrave: function () { var lib = postoLibero(); hostVaA(lib >= 0 ? lib : 0); lobbyAgg(); },   // un posto dei bot, se c'è (se no si scambia col primo)
          onHostSeat: function (i) { hostVaA(i); lobbyAgg(); },
          onEsci: function () { chiudi(); t.esci(); } }); }
    disegnaLobby();
  }

  function ospitePendolo(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, S = { rete: null, myId: null, nome: "", ruolo: null, seat: -1, ref: null, fase: null, buf: [], raf: null, delayMs: 120, lanc: null, seggi: null,
      msg2: null, mov: 0, predX: null, gameId: null, fineId: null, guardi: false, chiesto: 0, drag: 0, tDrag: 0 };
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🎯", titolo: "Entra nella partita", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      S.msg = el("div", { class: "link-avviso" }); s._contenuto.appendChild(input); s._contenuto.appendChild(S.msg);
      var bEntra = el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {} S.nome = (input.value || "Amico").trim() || "Amico"; S.msg.textContent = "Collegamento in corso…"; collega(); } });
      s._piede.appendChild(bEntra);
      t.mostra(s);
      if (t.nomeProfilo && t.nomeProfilo()) { input.value = t.nomeProfilo(); bEntra.click(); }   // entra da solo col nome del profilo di questo telefono
    }
    function join() { if (S.rete) S.rete.invia({ t: "join", nome: S.nome, omino: (t.mioOmino ? t.mioOmino(S.nome) : mioAvatar(S.nome)) }); }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; join(); attesa();
          setTimeout(function () { if (!S.ref && S.fase === null && S.msg2) S.msg2.textContent = "Non trovo la partita: controlla il codice o attendi l'host…"; }, 8000); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.t === "lobby") { S.lanc = m.lanc; S.seggi = m.seggi; S.guardi = false; S.ioFuori = (m.fuori || []).indexOf(S.myId) >= 0; if (!S.ref) { S.fase = "lobby"; mostraLobby(m); } }
          else if (m.t === "guardi") { if (m.to === S.myId) { S.guardi = true; if (m.fuori) S.ioFuori = true; if (!S.ref && S.msg2 && S.fase !== "fine") S.msg2.textContent = S.ioFuori ? "👀 Questa volta guardi: giocano gli amici scelti." : "La partita è già cominciata: appena finisce entri anche tu! 👀"; } }
          else if (m.t === "via") {
            if (S.ref && m.gameId === S.gameId) return;   // la stessa partita rimandata (qualcuno è rientrato): niente da rifare
            S.gameId = m.gameId; S.lanc = m.lanc; S.seggi = m.seggi; S.av = m.av || null; S.mir = !!m.mir;
            S.seat = -1;
            if (S.lanc === S.myId) S.ruolo = "lanciatore";
            else { for (var i = 0; i < (m.seggi || []).length; i++) if (m.seggi[i] && m.seggi[i].id === S.myId) S.seat = i; S.ruolo = S.seat >= 0 ? "trave" : "guarda"; }
            S.buf = []; S.lastP = {}; S.fase = "gioco"; build(); }
          else if (m.t === "g") {
            if (!S.ref || S.fase !== "gioco") {   // la partita c'è ma non l'ho ricevuta: la richiedo all'host
              var oraR = Date.now(); if (oraR - S.chiesto > 1500) { S.chiesto = oraR; join(); } return; }
            var now = performance.now(); S.buf.push({ rt: now, s: m.s }); while (S.buf.length > 8 && S.buf[0].rt < now - 1500) S.buf.shift(); avviaGiro(); }
          else if (m.t === "fine") {
            if (S.fineId === m.gameId) return; S.fineId = m.gameId;
            fermaGiro(); if (S.ref) { S.ref.rimuovi(); S.ref = null; } S.fase = "fine";
            var mioSeat = -1;
            for (var si = 0; si < (m.seggi || []).length; si++) if (m.seggi[si] && m.seggi[si].id === S.myId) { mioSeat = si; break; }
            var sonoLanc = m.lanc === S.myId;
            if (!sonoLanc && mioSeat < 0) {   // non giocavo (arrivato tardi o trave piena): niente trofei, solo com'è andata
              schermataFine(t, { online: { host: false }, guarda: true, icona: "🏁", titolo: "Partita finita", frase: (m.vintoLanc ? "Chi lanciava li ha buttati giù tutti! 💦" : "Qualcuno è rimasto sulla trave fino alla fine! 🏆") + (S.ioFuori ? "" : " Alla prossima giochi anche tu."),
                onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); } });
              return;
            }
            var ruolo = sonoLanc ? "lanciatore" : "trave", vinto = sonoLanc ? !!m.vintoLanc : !!(m.surv && m.surv[mioSeat]);
            salvaTrofei({ gameId: m.gameId, modo: "online", difficolta: m.difficolta, nome: S.nome, ruolo: ruolo,
              vinto: vinto, abbattuti: sonoLanc ? m.abbattuti : 0,
              schivate: mioSeat >= 0 && m.schivate ? m.schivate[mioSeat] : 0,
              avversariUmani: sonoLanc ? (+m.umTrave || 0) : (+m.umLanc || 0), durata: m.durata });
            schermataFine(t, { online: { host: false }, vinto: vinto, frase: fraseFine(ruolo, vinto),
              stat: statFine(ruolo, { abbattuti: +m.abbattuti || 0, durata: +m.durata || 0, lanci: +m.lanci || 0,
                schivate: mioSeat >= 0 && m.schivate ? +m.schivate[mioSeat] || 0 : 0, scampati: mioSeat >= 0 && m.scampati ? +m.scampati[mioSeat] || 0 : 0,
                resistito: mioSeat >= 0 && m.resist && m.resist[mioSeat] != null ? +m.resist[mioSeat] || 0 : +m.durata || 0 }),
              onEsci: function () { if (S.rete) S.rete.chiudi(); t.esci(); } }); }
        },
        onChiuso: function () { fermaGiro(); errore(t, "Collegamento perso. L'host ha chiuso la partita."); },
        onErrore: function () { fermaGiro(); errore(t, "Problema di collegamento. Riprova."); }
      });
    }
    function mandaDrag() { if (S.drag && S.rete) { S.rete.invia({ t: "aimD", d: +S.drag.toFixed(4) }); S.drag = 0; S.tDrag = performance.now(); } }
    function build() {
      S.predX = null; S.mov = 0; S.drag = 0;
      if (S.ref) S.ref.rimuovi();
      S.ref = creaScena(t, S.ruolo || "guarda", {
        onAim: function (d) { if (S.ruolo === "lanciatore" && S.rete) S.rete.invia({ t: "aim", d: d }); },
        onAimDrag: function (fr) { if (S.ruolo !== "lanciatore") return; S.drag += fr; if (performance.now() - S.tDrag > 60) mandaDrag(); },   // trascinare: piccoli pezzi all'host
        onAimDragFine: mandaDrag,
        onLancia: function () { if (S.ruolo === "lanciatore" && S.rete) { mandaDrag(); S.rete.invia({ t: "lancia" }); } },
        onMov: function (d) { S.mov = d || 0; if (S.ruolo === "trave" && S.rete) S.rete.invia({ t: "mov", d: d }); },
        onSalta: function () { if (S.ruolo === "trave" && S.rete) S.rete.invia({ t: "salta" }); },
        onEsci: function () { fermaGiro(); if (S.rete) S.rete.chiudi(); t.esci(); }
      }, S.av, { mirino: S.mir });
    }
    function vistaOra(now) {   // interpola gli snapshot (movimento liscio come Horto)
      var b = S.buf, rt = now - S.delayMs;
      function copia(s) { return { f: s.f, e: s.e, tm: s.tm, ai: s.ai, ba: s.ba, p: s.p, sw: s.sw, rp: s.rp, ms: S.seat, c: s.c.map(function (x) { return { x: x.x, j: x.j, cd: x.cd, a: x.a, m: x.m }; }) }; }
      if (b.length < 2 || rt <= b[0].rt) return copia(b[0].s);
      var A, B, f;
      if (rt >= b[b.length - 1].rt) { A = b[b.length - 2].s; B = b[b.length - 1].s; f = 1; }
      else { var i = b.length - 2; while (i > 0 && b[i].rt > rt) i--; A = b[i].s; B = b[i + 1].s; f = (rt - b[i].rt) / Math.max(1, b[i + 1].rt - b[i].rt); }
      var out = copia(B); out.p = A.p + (B.p - A.p) * f; out.ai = A.ai + (B.ai - A.ai) * f; out.ba = A.ba + (B.ba - A.ba) * f;
      for (var k = 0; k < out.c.length; k++) if (A.c[k] && B.c[k]) out.c[k].x = A.c[k].x + (B.c[k].x - A.c[k].x) * f;
      return out;
    }
    function giro(now) { S.raf = requestAnimationFrame(giro); if (!S.ref || !S.buf.length || S.fase !== "gioco") return;
      var dt = Math.min(0.05, (now - (S._last || now)) / 1000); S._last = now;
      var vista = vistaOra(now); if (vista.f === "fine") dt *= LENTO;
      prediciMio(vista, dt); render(S.ref, vista, dt); }
    // Predizione locale del MIO personaggio sulla trave: mi muovo subito col mio
    // input (niente attesa del giro di rete) e riconcilio piano verso la posizione
    // autoritativa più fresca dell'host. Salto e cadute restano dell'host.
    function prediciMio(vista, dt) {
      if (!(S.ruolo === "trave" && S.seat >= 0) || !vista || !vista.c) return;
      var c = vista.c[S.seat]; if (!c) return;
      var newest = S.buf.length ? S.buf[S.buf.length - 1].s : null;
      var hc = newest && newest.c ? newest.c[S.seat] : null;
      if (!c.a || !hc || !hc.a || vista.f !== "gioco") { S.predX = null; return; }   // caduto o dati assenti: nessuna predizione
      if (S.predX == null) S.predX = hc.x;
      S.predX += (S.mov || 0) * MOVSP * dt;
      if (S.predX < BEAM_L) S.predX = BEAM_L; else if (S.predX > BEAM_R) S.predX = BEAM_R;
      S.predX += (hc.x - S.predX) * Math.min(1, 8 * dt);       // riconciliazione morbida
      c.x = S.predX;
    }
    function avviaGiro() { if (!S.raf) { S._last = performance.now(); S.raf = requestAnimationFrame(giro); } }
    function fermaGiro() { if (S.raf) cancelAnimationFrame(S.raf); S.raf = null; }
    function mostraLobby(m) { renderLobby(t, { codice: m.codice, pronta: m.pronta, sonoHost: false, myId: S.myId, lanc: m.lanc, seggi: m.seggi, nomi: m.nomi, omini: m.omini, att: m.att, fuori: m.fuori },
      { onLancio: function () { if (S.rete) S.rete.invia({ t: "vuoiLanciare" }); },
        onTrave: function () { if (S.rete) S.rete.invia({ t: "vuoiTrave" }); }, onEsci: function () { fermaGiro(); if (S.rete) S.rete.chiudi(); t.esci(); } }); }
    function attesa() { if (S.ref) return;
      var s = t.schermata({ icona: "🎯", titolo: "Palla a Pendolo · Sala", sotto: "Stanza " + codice.toUpperCase(), indietro: function () { if (S.rete) S.rete.chiudi(); t.esci(); } });
      S.msg2 = el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegato ✅ — sto entrando nella stanza…" }); s._contenuto.appendChild(S.msg2); t.mostra(s); }
  }

  // la saletta d'attesa (uguale per tutti i giochi); sotto, la scelta dei ruoli
  function renderLobby(t, vm, cb) {
    var el = t.el, s = { _contenuto: el("div") }, om = vm.omini || {}, nomi = vm.nomi || {}, gio = [], vuoti = 0, att = vm.att || [];
    if (vm.lanc) gio.push({ id: vm.lanc, nome: nomi[vm.lanc] || "Host", omino: om[vm.lanc] || null, host: vm.lanc === "host", tu: vm.lanc === vm.myId });
    (vm.seggi || []).forEach(function (sg) { if (sg) gio.push({ id: sg.id, nome: nomi[sg.id] || sg.nome || "Amico", omino: om[sg.id] || null, host: sg.id === "host", tu: sg.id === vm.myId }); else vuoti++; });
    att.forEach(function (id) { if (nomi[id]) gio.push({ id: id, nome: nomi[id] + " 👀", omino: om[id] || null, tu: id === vm.myId }); });   // chi guarda
    // riga di un ruolo (con evidenza se è il mio e, per l'host, tocco per spostarmi lì)
    function rigaRuolo(sinistra, testo, mio, tap, azione) {
      var bg = mio ? "rgba(255,202,58,.18)" : "rgba(255,255,255,.06)";
      var brd = mio ? ";border:1px solid var(--accento)" : "";
      var cur = tap ? ";cursor:pointer" : "";
      return el("div", { style: "display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:10px;margin-bottom:6px;background:" + bg + brd + cur, onclick: tap ? azione : null }, [
        sinistra,
        el("span", { style: "flex:1;font-weight:800", text: testo }),
        tap ? el("span", { style: "font-size:.82rem;font-weight:800;color:var(--accento)", text: azione._et || "vai qui ▶" }) : null
      ]);
    }
    // il MIO ruolo: due tasti chiari, per l'host e per chi entra
    var lBot = !vm.lanc;
    var lNome = lBot ? "🤖 Bot" : ((vm.nomi && vm.nomi[vm.lanc]) || (vm.lanc === "host" ? "Host" : "Amico"));
    var ioLanc = vm.lanc === vm.myId, ioAtt = att.indexOf(vm.myId) >= 0, ioTrave = !ioLanc && !ioAtt;
    var ioFuori = ioAtt && (vm.fuori || []).indexOf(vm.myId) >= 0;   // nella Sala non sono tra gli scelti: questa volta guardo
    var puoLanciare = !ioLanc && !ioFuori && (!ioAtt || lBot), puoTrave = ioLanc && (vuoti > 0 || vm.sonoHost);
    function chip(icona, tit, sotto, attiva, puo, fn) {
      return el("button", { class: "modo-chip" + (attiva ? " attiva" : ""), style: !attiva && !puo ? "opacity:.5" : "", onclick: function () { if (!attiva && puo) fn(); } }, [
        el("span", { class: "mi", text: icona }), el("div", {}, [el("div", { class: "mt", text: tit }), el("div", { class: "ms", text: sotto })])]);
    }
    s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:12px", text: "Il tuo ruolo" }));
    if (ioFuori) s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "margin:2px 0 8px", text: "👀 Questa volta guardi: giocano gli amici scelti." }));
    else if (ioAtt) s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "margin:2px 0 8px", text: lBot ?"👀 La trave è piena: per ora guardi. Se vuoi, puoi lanciare tu al posto del bot!" : "👀 La trave è piena: per ora guardi. Appena si libera un posto entri tu." }));
    s._contenuto.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [
      chip("🎯", "Lancio io", ioAtt && !lBot ? "C'è già chi lancia" : "Butti giù chi è sulla trave", ioLanc, puoLanciare, cb.onLancio),
      chip("🏃", "Sto sulla trave", ioLanc && !puoTrave ? "La trave è piena" : "Salti e schivi la palla", ioTrave, puoTrave, cb.onTrave)
    ]));
    // chi lancia
    s._contenuto.appendChild(el("div", { class: "etichetta", style: "margin-top:12px", text: "🎯 Chi lancia" }));
    var tapL = (vm.sonoHost && !ioLanc && cb.onLancio) ? function () { cb.onLancio(); } : null;
    if (tapL) tapL._et = "lancio io ▶";
    s._contenuto.appendChild(rigaRuolo(el("span", { text: "🎯" }), lNome + (ioLanc ? " (tu)" : ""), ioLanc, tapL, tapL));
    // trave
    s._contenuto.appendChild(el("div", { class: "etichetta", text: "🏃 Sulla trave (posti liberi = bot)" }));
    (vm.seggi || []).forEach(function (sg, i) {
      var mio = sg && sg.id === vm.myId, nome = sg ? ((vm.nomi && vm.nomi[sg.id]) || sg.nome || "Amico") : "🤖 Bot";
      var tapS = (vm.sonoHost && !mio && cb.onHostSeat) ? function () { cb.onHostSeat(i); } : null;
      if (tapS) tapS._et = "siediti ▶";
      s._contenuto.appendChild(rigaRuolo(
        el("span", { style: "width:16px;height:16px;border-radius:50%;flex:0 0 auto;background:" + COLSEAT[i % COLSEAT.length] }),
        nome + (mio ? " (tu)" : ""), mio, tapS, tapS));
    });
    if (vm.sonoHost) {
      s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "margin-top:4px", text: "Tocca il lanciatore o un posto sulla trave per metterti lì: chi c'era prende il tuo posto (bot o giocatore)." }));
    }
    t.lobby({ host: vm.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 1, puoiDaSolo: true, vuoti: vuoti, giocatori: gio, extra: [s._contenuto],
      nota: vm.sonoHost ? "Cominci quando vuoi: i posti vuoti sulla trave diventano bot." : null,
      spettatore: ioFuori ? "👀 Questa volta guardi" : null,
      attesa: ioAtt ? "Aspetta che l'host cominci: per questa partita guardi. 👀" : "Aspetta che l'host cominci: sotto puoi chiedere di lanciare tu! 🎯", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  function errore(t, txt) { var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci })); t.mostra(s); }
  function senzaRete(t) { var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "L'online funziona quando il gioco è aperto dal sito pubblicato. Da un file locale non è disponibile: intanto gioca da solo contro i bot." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci })); t.mostra(s); }

  SG.registra({
    id: "pendolo",
    modi: [{ modo: "bot", icona: "🎯", nome: "Da solo", sotto: "Contro i Bot: lanci tu o schivi sulla trave" }],
    nome: "Palla a Pendolo",
    icona: "🎯",
    descrizione: "Mira e lancia la palla-pendolo per buttare in acqua chi sta sulla trave. Da solo contro i bot, oppure online: uno lancia, gli altri scappano e saltano.",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 1,
    etichettaGiocatori: "👥 1–4 giocatori",   // (da solo, o online: chi lancia più 3 posti)
    postiOnline: 4,   // chi lancia più 3 sulla trave: nella Sala, se siete di più, gioca chi sceglie l'host e gli altri guardano
    regole: [
      "Sei di spalle: davanti una <b>trave sull'acqua</b> con dei personaggi. La palla appesa oscilla <b>in profondità</b>.",
      "<b>Lanciatore</b>: miri di lato (◀ ▶ o trascini) e premi <b>LANCIA</b>. Il lancio è <b>sempre uguale</b>: il <b>mirino rosso</b> mostra dove arriverà. Mira dove <b>andranno</b>, non dove sono!",
      "La palla colpisce <b>all'andata e al ritorno</b>: chi è sotto e non è in aria finisce in acqua.",
      "<b>Sulla trave</b>: scappi <b>◀ ▶</b> o <b>SALTI</b> quando arriva la palla. Dopo un salto serve un attimo prima di saltare di nuovo.",
      "Vince il <b>lanciatore</b> se li butta giù <b>tutti</b> entro il tempo; altrimenti vince <b>chi resta</b> sulla trave.",
      "<b>Online</b>: in sala d'attesa ognuno sceglie se lanciare o stare sulla trave (i posti liberi li giocano i bot)."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el; dove.modo = "bot"; dove.difficolta = "medio"; dove.ruolo = "lanciatore"; dove.collisioni = false; dove.mirino = vuoiMirino();
      var bBot, bOnl, notaOnline, boxRuolo, bLanc, bTrave, boxMir = el("div", {});
      function selM(m) { dove.modo = m; bBot.className = "modo-chip" + (m === "bot" ? " attiva" : ""); bOnl.className = "modo-chip" + (m === "online" ? " attiva" : ""); notaOnline.hidden = (m !== "online"); boxRuolo.hidden = (m !== "bot"); aggBoxMir(); }
      function selR(r) { dove.ruolo = r; bLanc.className = "modo-chip" + (r === "lanciatore" ? " attiva" : ""); bTrave.className = "modo-chip" + (r === "trave" ? " attiva" : ""); aggBoxMir(); }
      function aggBoxMir() { boxMir.hidden = dove.modo === "bot" && dove.ruolo !== "trave"; }   // da solo, se lanci tu, il mirino lo vedi già
      bBot = el("button", { class: "modo-chip attiva", onclick: function () { selM("bot"); } }, [el("span", { class: "mi", text: "🎯" }), el("div", {}, [el("div", { class: "mt", text: "Da solo" }), el("div", { class: "ms", text: "Contro i Bot" })])]);
      bOnl = el("button", { class: "modo-chip", onclick: function () { selM("online"); } }, [el("span", { class: "mi", text: "🔗" }), el("div", {}, [el("div", { class: "mt", text: "Online" }), el("div", { class: "ms", text: "Ognuno dal suo" })])]);
      if (!aiuti.modo) {   // (se "come giocare" l'avete già scelto prima, qui non si sceglie)
        box.appendChild(el("div", { class: "etichetta", text: "Come giocare" }));
        box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bBot, bOnl]));
      }
      boxRuolo = el("div", {});
      boxRuolo.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Il tuo ruolo (da solo)" }));
      bLanc = el("button", { class: "modo-chip attiva", onclick: function () { selR("lanciatore"); } }, [el("span", { class: "mi", text: "🎯" }), el("div", {}, [el("div", { class: "mt", text: "Lanci tu" }), el("div", { class: "ms", text: "Butti giù 3 bot" })])]);
      bTrave = el("button", { class: "modo-chip", onclick: function () { selR("trave"); } }, [el("span", { class: "mi", text: "🏃" }), el("div", {}, [el("div", { class: "mt", text: "Sulla trave" }), el("div", { class: "ms", text: "Schivi il bot che lancia" })])]);
      boxRuolo.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bLanc, bTrave]));
      box.appendChild(boxRuolo);
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura dei Bot" }));
      var w = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center",
          onclick: function () { dove.difficolta = d[0]; [].forEach.call(w.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva"; } }, [el("div", { class: "mt", text: d[1] })]);
        b.style.flex = "1"; w.appendChild(b);
      });
      box.appendChild(w);
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Regole" }));
      var bColl = el("button", { class: "btn btn-fantasma", style: "width:100%" });
      function aggColl() { bColl.textContent = dove.collisioni ? "🧱 Collisioni tra giocatori: SÌ" : "👻 Collisioni tra giocatori: no"; }
      aggColl();
      bColl.addEventListener("click", function () { dove.collisioni = !dove.collisioni; aggColl(); });
      box.appendChild(bColl);
      box.appendChild(el("p", { class: "modulo-nota", style: "margin-top:4px", text: "Con le collisioni i personaggi non si attraversano: si spingono e non passano l'uno dentro l'altro." }));
      var bMir = el("button", { class: "btn btn-fantasma", style: "width:100%;margin-top:8px" });
      function aggMir() { bMir.textContent = dove.mirino ? "👀 Chi è sulla trave vede il mirino: SÌ" : "🙈 Chi è sulla trave vede il mirino: no"; }
      aggMir();
      bMir.addEventListener("click", function () { dove.mirino = !dove.mirino; try { localStorage.setItem("sg-pendolo-mirino-trave", dove.mirino ? "1" : "0"); } catch (e) {} aggMir(); });
      boxMir.appendChild(bMir);
      boxMir.appendChild(el("p", { class: "modulo-nota", style: "margin-top:4px", text: "Chi lancia vede sempre il suo mirino. Se lo vede anche chi è sulla trave, schivare è più facile." }));
      box.appendChild(boxMir); aggBoxMir();
      notaOnline = el("div", { class: "link-avviso", hidden: "hidden" });
      notaOnline.textContent = (window.SGNet && SGNet.disponibile()) ? "Apri una stanza e manda il codice: in sala d'attesa scegliete i ruoli." : "Qui il collegamento non è disponibile: funziona dal sito pubblicato online.";
      box.appendChild(notaOnline);
      if (aiuti.modo) { selM(aiuti.modo); notaOnline.hidden = true; }   // come giocare l'avete già scelto prima
    },
    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return ospitePendolo(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostPendolo(t, imp.difficolta || "medio", NSEAT, imp.collisioni, imp.mirino);
      return locale(t, imp.difficolta || "medio", imp.ruolo || "lanciatore", imp.collisioni, imp.mirino);
    }
  });
})();

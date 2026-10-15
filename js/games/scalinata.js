/* =========================================================
   GIOCO — "La Scalinata"  (ispirato a Wii Party, Scalinata a sorte)
   Sulla scala si sta in 4 (i posti liberi li prendono i bot del
   gruppo fisso, SG.bot). A ogni round ognuno sceglie in segreto
   1, 3 o 5 gradini (4 secondi). Le scelte si scoprono tutte
   insieme: se due o più scelgono lo stesso numero restano fermi;
   avanza solo chi ha scelto un numero unico. Chi arriva in cima
   (gradino TRAGUARDO) vince; se ci arrivano in due nello stesso
   round, vincono tutti e due.
   Un telefono solo: il telefono si passa, ognuno sceglie in segreto.
   Ognuno dal suo (online): si sceglie tutti insieme; se si è più
   di 4, gli altri guardano e alla partita dopo si dà il cambio.
   Il tavolo (la scala) si costruisce una volta per partita: a ogni
   round cambiano solo i pezzi che servono (niente lampeggio).
   ========================================================= */
(function () {
  "use strict";

  var TRAGUARDO = 15;
  var SECONDI = 4;
  var MARGINE_RETE = 900;   // online: un attimo in più per le scelte che arrivano in ritardo dalla rete
  var PAUSA_AUTO = 2600;    // dopo la rivelazione il round dopo parte da solo
  var PAUSA_FINE = 3200;    // dopo l'arrivo in cima, il podio
  var SCELTE = [1, 3, 5];
  var COLORI = ["#ff6b6b", "#4dabf7", "#51cf66", "#ffd43b"];
  // i bot: quelli del gruppo fisso (SG.bot: sempre gli stessi nomi e avatar in tutti i giochi), mai col nome di chi gioca
  function prendiBot(n, escludi) {
    var b = null;
    try { if (window.SG && SG.bot && SG.bot.prendi) b = SG.bot.prendi(n, { escludi: escludi }); } catch (e) {}
    if (!b || b.length < n) { b = []; for (var k = 0; k < n; k++) b.push({ nome: "Bot " + (k + 1), omino: null }); }   // (di sicurezza)
    return b;
  }
  var MAX_GUARDA = 12;      // spettatori al massimo (online)
  var CHIAVE_HOST = "sg-scalinata-host";   // la partita dell'host, per riprenderla se la pagina si ricarica
  var VITA_SALVATA = 30 * 60 * 1000;

  // ---------- il commento sotto la scala ----------
  // {a} {b} {c} = nomi, {il} = "il 5" / "l'1", {sul} = "sul 5" / "sull'1", {gr} = "3 gradini", {tutti} = elenco di nomi
  var FRASI = {
    tuttiFermi: [
      "Tutti fermi! Sulla scala c'è un ingorgo.",
      "Nessuno si muove: sembra la tangenziale all'ora di punta.",
      "Bonk generale! Nessuno sale.",
      "Fermi tutti! Qui ci vuole un vigile.",
      "Che telepatia: nessuno sale di un gradino.",
      "Giro a vuoto: vi siete pestati i piedi a vicenda.",
      "Tutti con la stessa idea, nessuno con un gradino in più.",
      "Scala bloccata: si riprova al prossimo giro!",
      "Tutti fermi come statue: si riparte da qui.",
      "Nessuno sale: la scala si è presa una pausa caffè.",
      "Ingorgo totale! Qualcuno chiami i vigili.",
      "Tutti contro tutti, nessuno avanza.",
      "Round a vuoto: i gradini ringraziano.",
      "Che confusione! Nemmeno un passo avanti.",
      "Scale mobili guaste: oggi non sale nessuno."
    ],
    scontro: [
      "Bonk! {a} e {b} si pestano i piedi {sul}.",
      "{a} e {b} hanno avuto la stessa idea: {il}. Fermi lì!",
      "Testa contro testa {sul}: {a} e {b} restano al palo.",
      "{a} e {b}, che telepatia! Peccato che qui non paghi.",
      "Scontro {sul} tra {a} e {b}: tutto da rifare.",
      "{a} e {b} scelgono {il} insieme. Grandi menti, piccoli passi.",
      "C'è traffico {sul}: {a} e {b} non passano.",
      "{a} e {b} si urtano {sul}. Che botta!",
      "Il numero buono per {a} era {il}... ma anche per {b}!",
      "{a} e {b} si contendono {il}: non lo prende nessuno.",
      "{a} e {b} si guardano storto {sul}.",
      "Sgambetto reciproco {sul}: {a} e {b} restano giù.",
      "{a} e {b} vanno a braccetto {sul}... e non si muovono.",
      "Gran pasticcio {sul}: {a} e {b} fermi a guardarsi.",
      "{a} puntava tutto {sul}. Peccato: anche {b}!",
      "Tamponamento {sul} tra {a} e {b}!",
      "{a} e {b} sullo stesso gradino: non c'è spazio per due.",
      "Stessa idea, stesso numero: {a} e {b} restano a terra."
    ],
    scontro3: [
      "Ingorgo {sul}: {a}, {b} e {c} restano lì a guardarsi.",
      "In tre {sul}! {a}, {b} e {c} si fanno lo sgambetto da soli.",
      "{a}, {b} e {c} tutti {sul}: che folla!",
      "Non si passa {sul}: ci sono {a}, {b} e {c}!",
      "Mucchio selvaggio {sul}: {a}, {b} e {c} fermi al palo.",
      "Riunione di condominio {sul}: {a}, {b} e {c} non salgono.",
      "{a}, {b} e {c} tutti {sul}: sembra la fila alla posta.",
      "Tris di bonk {sul}: {a}, {b} e {c} fermi.",
      "Calca {sul}! {a}, {b} e {c} si bloccano a vicenda."
    ],
    fuga: [
      "Fuga solitaria di {a}: +{n}!",
      "Mentre gli altri si scontrano, {a} sale di {n}.",
      "{a} se ne va in santa pace: +{n} senza nessuno tra i piedi.",
      "Tra i litiganti, {a} gode: +{n}!",
      "{a} ha letto la situazione: +{n} in solitaria.",
      "Strada libera per {a}: +{n}.",
      "Gli altri fanno a spintoni, {a} sale: +{n}.",
      "Solo {a} trova il numero giusto: +{n}!",
      "{a} fa lo slalom tra gli scontri: +{n}.",
      "Nessuno disturba {a}: +{n} in tranquillità.",
      "{a} sceglie il numero giusto al momento giusto: +{n}.",
      "Colpo da maestro di {a}: +{n} mentre gli altri litigano.",
      "{a} se la ride e sale di {n}."
    ],
    cinque: [
      "{a} vola: cinque gradini in un colpo!",
      "Salto della quaglia di {a}: +5!",
      "{a} prende l'ascensore: +5!",
      "Falcata da gigante per {a}: +5.",
      "{a} sale i gradini a cinque a cinque!",
      "Che coraggio, {a}: il 5 era libero!",
      "{a} rischia il 5 e fa centro!",
      "{a} sale di corsa: +5!",
      "Balzo da canguro per {a}: +5!",
      "{a} fa i gradini a cinque alla volta. Che gambe!",
      "Il 5 era tutto per {a}: che volata!",
      "{a} mette il turbo: +5."
    ],
    uno: [
      "{a} va piano, ma va lontano: +1.",
      "Un gradino alla volta: {a} non molla.",
      "{a} si accontenta: +1 e zero rischi.",
      "Passo da formica per {a}: +1.",
      "Chi va piano va sano: +1 per {a}.",
      "{a} sceglie l'1 e intanto sale.",
      "{a} fa un passettino: +1, ma è pur sempre un passo.",
      "Piano piano, {a} sale: +1.",
      "+1 per {a}: anche le formiche arrivano in cima.",
      "{a} punta sull'1 e non sbaglia.",
      "Un gradino in più per {a}: meglio di niente!"
    ],
    tre: [
      "{a} sceglie la via di mezzo: +3.",
      "+3 per {a}: né troppo, né troppo poco.",
      "Il 3 era libero: {a} ne approfitta.",
      "{a} fa tre passi avanti, senza fretta.",
      "Giusto in mezzo: {a} sale di 3.",
      "{a} sale di 3 senza fare rumore.",
      "Tre gradini puliti puliti per {a}.",
      "{a} va col passo giusto: +3.",
      "Né lepre né tartaruga: {a} sale di 3.",
      "+3 per {a}: la via di mezzo funziona."
    ],
    prevedibile: [
      "{b} ha capito il trucco: {a} sceglie sempre {il}!",
      "{b} ti ha letto nel pensiero, {a}: di nuovo {il}?",
      "{a}, sempre {il}? {b} ormai ti aspetta lì.",
      "{b} blocca {a} {sul}: cambiare ogni tanto aiuta!",
      "Ancora {il}, {a}? {b} se l'aspettava.",
      "{b} conosce le abitudini di {a}: tappo {sul}!",
      "{b} ha studiato {a}: ancora {il}? Tappo!",
      "{a}, {b} ti aspettava {sul}: prova a cambiare!",
      "{b} conosce le mosse di {a}: scontro {sul}!"
    ],
    cima: [
      "{a} vede la cima: ancora {gr}!",
      "Attenzione a {a}: solo {gr} alla cima!",
      "{a} è a un passo dalla vittoria: ancora {gr}.",
      "Fermate {a}! È a {gr} dalla vetta.",
      "{a} sente già l'aria della vetta: è a {gr}.",
      "Ultimo sforzo per {a}: è a {gr} dalla cima.",
      "{a} vede la bandiera: mancano {gr}!",
      "Tremate: {a} è a {gr} dalla cima!",
      "{a} prepara la festa: mancano solo {gr}.",
      "Qualcuno blocchi {a}: è a {gr} dalla vetta!"
    ],
    vince: [
      "{a} arriva in cima! Che salita!",
      "{a} conquista la vetta!",
      "Bandiera in cima per {a}!",
      "Vetta raggiunta: vince {a}!",
      "{a} è in cima alla scalinata!",
      "Tutti a guardare in su: {a} ha vinto!",
      "{a} pianta la bandierina in cima: vittoria!",
      "Che scalata! La vetta è di {a}.",
      "{a} arriva in cima e saluta tutti dall'alto!",
      "Ultimo gradino superato: la scalinata è di {a}!"
    ],
    insieme: [
      "{tutti} arrivano in cima insieme: si vince in compagnia!",
      "Arrivo di gruppo: {tutti} si dividono la vetta!",
      "Pari e patta in cima: vincono {tutti}!",
      "Foto di gruppo in vetta: {tutti} vincono insieme!",
      "In cima si sta stretti: {tutti} vincono insieme!",
      "Arrivo a braccetto: vittoria per {tutti}!"
    ]
  };

  function coloreScelta(n) { return n === 1 ? "#8ce99a" : n === 3 ? "#ffd43b" : "#ff922b"; }
  function aCaso() { return SCELTE[Math.floor(Math.random() * 3)]; }
  function pesca(a) { return a[Math.floor(Math.random() * a.length)]; }
  function riempi(f, v) { return f.replace(/\{(\w+)\}/g, function (_, k) { return v[k] != null ? v[k] : ""; }); }
  function elenco(nomi) { return nomi.length < 2 ? (nomi[0] || "") : nomi.slice(0, -1).join(", ") + " e " + nomi[nomi.length - 1]; }
  function ilNum(n) { return Number(n) === 1 ? "l'1" : "il " + n; }
  function sulNum(n) { return Number(n) === 1 ? "sull'1" : "sul " + n; }
  function durataRivela(n) { return 150 + n * 300 + 350 + 1400; }   // numeri uno alla volta, colori, salita, commento
  // classifica a pari merito: stesso gradino = stesso posto
  function piazzamenti(posti) {
    var ord = posti.slice().sort(function (a, b) { return b.passi - a.passi; });
    return ord.map(function (p) { return { p: p, nome: p.nome, pos: 1 + ord.filter(function (q) { return q.passi > p.passi; }).length }; });
  }

  SG.registra({
    id: "scalinata",
    riprende: true,   // se l'host ricarica a metà partita, la partita riprende da dove era (il core lo dice agli amici)
    nome: "La Scalinata",
    icona: "🪜",
    descrizione: "In quattro sulla scala: scegli 1, 3 o 5. Avanza solo chi sceglie un numero che nessun altro ha scelto. Primo in cima, vince.",
    giocatoriMin: 1,
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "In 4 (anche con i Bot), vi passate il telefono", amici: true }],
    giocatoriMax: 4,
    postiOnline: 4,   // sulla scala si sta in 4: nella Sala, se siete di più, gioca chi sceglie l'host e gli altri guardano
    difficolta: 2,
    regole: [
      "Si gioca <b>in 4</b> sulla scala: i posti liberi li prendono i <b>Bot</b>, così puoi giocare anche da solo, in 2 o in 3. A ogni round hai <b>4 secondi</b> per scegliere in segreto <b>1, 3 o 5</b> gradini (se il tempo scade, sceglie il caso).",
      "Le scelte si scoprono <b>tutte insieme</b>, sopra la testa di ognuno: se due o più scelgono lo <b>stesso</b> numero, restano <b>fermi</b>.",
      "Avanza solo chi ha scelto un numero <b>che nessun altro ha scelto</b>, di tanti gradini quanti il numero.",
      "Vince il primo che arriva in cima alla scalinata (gradino <b>" + TRAGUARDO + "</b>). Se ci arrivano in due nello stesso round, <b>vincono tutti e due</b>.",
      "Si può giocare <b>a un telefono solo</b> (si passa di mano) oppure <b>ognuno dal suo</b>. Online, se siete più di 4, gli altri <b>guardano</b>: alla partita dopo salgono loro e dà il cambio chi è arrivato più in basso."
    ],

    // il modo (un telefono solo / online) lo sceglie il core in "Come giocate?"; nel torneo si gioca a un telefono solo
    impostazioni: function (box, dove, aiuti) { dove.modo = (!aiuti.torneo && aiuti.modo) || "telefono"; },

    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospiteScala(t, t.linkParams.stanza);
      if ((t.impostazioni || {}).modo === "online") return hostScala(t);
      partitaLocale(t);
    }
  });

  // ---------- bot furbo ----------
  // storia[k] = scelte passate del giocatore k (anche delle partite prima, nella stessa sessione)
  // Stima cosa sceglierà ognuno (abitudini recenti + chi è vicino alla cima punta al numero che lo fa arrivare),
  // poi valuta ogni numero: quanto salgo io se resto da solo + quanto vale bloccare chi lo sceglierebbe.
  // Un po' di caso resta sempre: un bot prevedibile si batte facile.
  function stimaScelte(passi, storia, k) {
    var w = { 1: 0.8, 3: 1.1, 5: 1.6 }, h = storia[k] || [], peso = 1;   // di partenza: il 5 è il più gettonato
    for (var i = h.length - 1; i >= 0 && i >= h.length - 8; i--) { w[h[i]] += 1.6 * peso; peso *= 0.8; }
    var manca = TRAGUARDO - passi[k];
    if (manca <= 5) SCELTE.forEach(function (n) { if (n >= manca) w[n] *= 2.2; });   // chi può arrivare, ci prova
    var tot = w[1] + w[3] + w[5], p = {};
    SCELTE.forEach(function (n) { p[n] = 0.85 * w[n] / tot + 0.05; });
    return p;
  }
  // bot[k] = true se il posto k è un bot (o uno uscito, che ora gioca il bot)
  function sceltaBot(io, passi, storia, bot) {
    var P = passi.map(function (_, k) { return k === io ? null : stimaScelte(passi, storia, k); });
    // un umano prevedibile (es. sempre 5): UN solo bot fa da "guardia" e lo blocca, gli altri lo sanno e scelgono altro
    var bersaglio = -1, nB = 0, pB = 0;
    passi.forEach(function (_, j) {
      if (bot[j] || (storia[j] || []).length < 2) return;
      var p = stimaScelte(passi, storia, j);
      SCELTE.forEach(function (n) { if (p[n] >= 0.55 && p[n] > pB) { pB = p[n]; nB = n; bersaglio = j; } });
    });
    if (bersaglio >= 0) {
      var guardia = -1;
      passi.forEach(function (x, k) { if (bot[k] && (guardia < 0 || x < passi[guardia])) guardia = k; });   // il bot più indietro
      var blocca = Math.min(0.95, pB + 0.2);
      if (guardia === io) { if (Math.random() < blocca) return nB; }
      else if (guardia >= 0) { var g = {}; SCELTE.forEach(function (n) { g[n] = n === nB ? blocca : (1 - blocca) / 2; }); P[guardia] = g; }
    }
    if (Math.random() < 0.12) return aCaso();
    function valore(k, n) { var g = Math.min(n, TRAGUARDO - passi[k]); return g + (passi[k] + n >= TRAGUARDO ? 12 : 0); }
    var capo = 0; passi.forEach(function (x, k) { if (k !== io && x > capo) capo = x; });
    var punti = SCELTE.map(function (n) {
      var solo = 1; P.forEach(function (p) { if (p) solo *= 1 - p[n]; });
      var v = solo * valore(io, n);
      P.forEach(function (p, j) {          // bloccare j: vale di più se è in testa e più è vicino alla cima
        if (!p) return;
        var altri = 1; P.forEach(function (q, k) { if (q && k !== j) altri *= 1 - q[n]; });
        var peso = (passi[j] >= capo ? 0.25 : 0.1) + 0.5 * passi[j] / TRAGUARDO;
        v += p[n] * altri * valore(j, n) * peso;
      });
      return v;
    });
    var T = 1.1, somma = 0, e = punti.map(function (v) { var x = Math.exp(v / T); somma += x; return x; });
    var r = Math.random() * somma;
    for (var i = 0; i < 3; i++) { r -= e[i]; if (r <= 0) return SCELTE[i]; }
    return SCELTE[2];
  }

  // ---------- il commento del round ----------
  // vinc = posti arrivati in cima in questo round; storie = scelte di prima (senza questo round)
  function commentoRound(nomi, scelte, avanza, passi, bot, storie, vinc) {
    if (vinc.length > 1) return riempi(pesca(FRASI.insieme), { tutti: elenco(vinc.map(function (i) { return nomi[i]; })) });
    if (vinc.length === 1) return riempi(pesca(FRASI.vince), { a: nomi[vinc[0]] });
    // chi sceglie sempre lo stesso numero e viene bloccato da un bot: glielo diciamo (così si impara)
    for (var j = 0; j < scelte.length; j++) {
      if (bot[j] || avanza[j]) continue;
      var h = storie[j] || [], n = scelte[j];
      if (h.length < 3 || h[h.length - 1] !== n || h[h.length - 2] !== n || h[h.length - 3] !== n) continue;
      for (var k = 0; k < scelte.length; k++) if (k !== j && bot[k] && scelte[k] === n) return riempi(pesca(FRASI.prevedibile), { a: nomi[j], b: nomi[k], il: ilNum(n), sul: sulNum(n) });
    }
    var su = [], gruppi = {};
    scelte.forEach(function (n, i) { if (avanza[i]) su.push(i); else (gruppi[n] = gruppi[n] || []).push(i); });
    if (!su.length) return pesca(FRASI.tuttiFermi);
    var cand = [];
    if (su.length === 1) { var v = { a: nomi[su[0]], n: scelte[su[0]] }; cand.push(riempi(pesca(FRASI.fuga), v), riempi(pesca(FRASI.fuga), v)); }
    Object.keys(gruppi).forEach(function (n) {
      var g = gruppi[n];
      cand.push(riempi(pesca(g.length >= 3 ? FRASI.scontro3 : FRASI.scontro), { a: nomi[g[0]], b: nomi[g[1]], c: nomi[g[2]], il: ilNum(n), sul: sulNum(n) }));
    });
    su.forEach(function (i) { cand.push(riempi(pesca(scelte[i] === 5 ? FRASI.cinque : scelte[i] === 1 ? FRASI.uno : FRASI.tre), { a: nomi[i] })); });
    var capo = 0; passi.forEach(function (p, i) { if (p > passi[capo]) capo = i; });
    var m = TRAGUARDO - passi[capo];
    if (m > 0 && m <= 5 && su.indexOf(capo) >= 0) cand.push(riempi(pesca(FRASI.cima), { a: nomi[capo], gr: m === 1 ? "un gradino" : m + " gradini" }));
    return pesca(cand);
  }

  // ---------- trofei: contatori per il profilo (solo il giocatore di questo telefono) ----------
  function nuovaTracciaScala() { return { chiave: null, p: null, scontri: 0, usato5: false, solo3: true }; }
  function ioDaNome(nomi) {
    var prof = window.SGNube && SGNube.disponibile() && SGNube.profilo(); if (!prof) return -1;
    return nomi.indexOf(prof.nome);
  }
  // chiamata alla rivelazione di ogni round; chiave = "partita:round", così lo stesso round non si conta due volte
  // (l'ospite riceve lo stesso round più volte, e anche dopo una ricarica). Dice se ha contato.
  function tracciaScala(T, io, chiave, nRound, scelte, avanza, prev, passi) {
    if (!T || io < 0 || !scelte || chiave === T.chiave) return false;
    var pt = String(chiave).split(":")[0];
    if (T.p !== pt) { T.p = pt; T.scontri = 0; T.usato5 = false; T.solo3 = true; }   // una partita nuova (anche se la fine di quella prima non si è vista)
    T.chiave = chiave;
    var n = scelte[io], c = {};
    if (avanza[io]) { c["mosse" + n] = 1; c.gradini = passi[io] - prev[io]; }
    else { T.scontri++; c.scontri = 1; if (nRound === 1) c.scontriPrimoTurno = 1; }
    if (n === 5) T.usato5 = true;
    if (n !== 3) T.solo3 = false;
    if (passi.some(function (p) { return p >= TRAGUARDO; })) {
      c.partite = 1;
      if (passi[io] >= TRAGUARDO) {   // in cima (anche insieme a un altro): ha vinto
        c.vinte = 1;
        if (!T.usato5) c.vinteSenza5 = 1;
        if (T.solo3) c.vinteSolo3 = 1;
        if (nRound === 3) c.vinteIn3 = 1;
        if (!T.scontri) c.vinteSenzaScontri = 1;
        if (avanza.every(function (a, k) { return k === io || !a; })) c.vinteAltriBloccati = 1;
      }
      T.scontri = 0; T.usato5 = false; T.solo3 = true;   // pronta per la prossima partita
    }
    if (!(window.SGNube && SGNube.disponibile() && SGNube.profilo())) return true;
    var incrs = []; for (var k in c) if (c[k]) incrs.push([k, c[k]]);
    SGNube.salvaProgressi(null, "scalinata", incrs, []);
    return true;
  }

  // ---------- suoni (motore audio del core) ----------
  function suono(tipo, k) {
    var ctx = window.SG && SG.audioCtx ? SG.audioCtx() : null; if (!ctx) return;
    try {
      var t0 = ctx.currentTime;
      var nota = function (f, da, dur, forma, vol, f2) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = forma; o.frequency.setValueAtTime(f, t0 + da);
        if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + da + dur);
        g.gain.setValueAtTime(0.0001, t0 + da); g.gain.exponentialRampToValueAtTime(vol, t0 + da + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + da + dur);
        o.connect(g); g.connect(ctx.destination); o.start(t0 + da); o.stop(t0 + da + dur + 0.03);
      };
      if (tipo === "bip") nota(880, 0, 0.18, "triangle", 0.2, 1320);                       // qualcuno ha scelto
      else if (tipo === "tic") nota(420 + (k || 0) * 110, 0, 0.08, "square", 0.07);        // si gira un numero
      else if (tipo === "bonk") { nota(260, 0, 0.3, "sine", 0.4, 70); nota(150, 0.02, 0.2, "triangle", 0.14, 60); }
      else if (tipo === "su") [660, 830, 990].forEach(function (f, i) { nota(f, i * 0.07, 0.12, "triangle", 0.13); });
      else if (tipo === "festa") [523, 659, 784, 1046].forEach(function (f, i) { nota(f, i * 0.13, i === 3 ? 0.5 : 0.15, "triangle", 0.2); });
    } catch (e) {}
  }

  // ---------- lo stile (una volta) ----------
  function stileScala() {
    if (document.getElementById("sc-stile")) return;
    var css = [
      ".schermata.sc-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#141530}",
      ".schermata.sc-piena>.testa,.schermata.sc-piena>.piede{display:none}",
      ".schermata.sc-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".sc-scena{height:var(--alt,100dvh);display:flex;flex-direction:column;overflow:hidden;color:#fff;user-select:none;-webkit-user-select:none;background:linear-gradient(180deg,#262b5c 0%,#141530 100%)}",
      ".sc-top{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:8px 10px 6px}",
      ".sc-esci{flex:0 0 auto;width:38px;height:38px;border-radius:12px;border:0;background:rgba(255,255,255,.1);color:#fff;font-size:1.4rem;font-weight:800;line-height:1;cursor:pointer}",
      ".sc-round{flex:1;min-width:0;font-weight:800;font-size:1.02rem;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".sc-round small{display:block;font-weight:600;font-size:.74rem;opacity:.65}",
      ".sc-tempo{flex:0 0 auto;min-width:46px;height:38px;border-radius:12px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.4rem;opacity:0;transition:opacity .2s}",
      ".sc-tempo.on{opacity:1}.sc-tempo.poco{color:#ff8787}",
      ".sc-barra{flex:0 0 auto;height:4px;margin:0 10px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden}",
      ".sc-barra i{display:block;height:100%;background:#ffd43b;transform-origin:left center;transform:scaleX(0)}",
      ".sc-scala{flex:1 1 auto;min-height:0;position:relative;margin:6px 10px 0;border-radius:16px;background:linear-gradient(180deg,#2c3566 0%,#191a3c 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.07);overflow:hidden}",
      ".sc-righello{position:absolute;left:0;width:22px;top:72px;bottom:42px;pointer-events:none}",
      ".sc-righello span{position:absolute;left:0;right:0;text-align:center;transform:translateY(50%);font-size:.66rem;font-weight:700;color:rgba(255,255,255,.4)}",
      ".sc-corsie{position:absolute;left:22px;right:6px;top:6px;bottom:6px;display:flex;gap:6px}",
      ".sc-corsia{flex:1;min-width:0;position:relative;border-radius:10px}",
      ".sc-corsia.io{background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}",
      // i gradini: una riga ogni gradino, la cima a scacchi
      ".sc-gradini{position:absolute;left:4px;right:4px;top:66px;bottom:36px;border-radius:4px;background:repeating-linear-gradient(0deg,rgba(255,255,255,.16) 0,rgba(255,255,255,.16) 2px,rgba(255,255,255,.04) 2px,rgba(255,255,255,.04) calc(100% / " + TRAGUARDO + "))}",
      ".sc-arrivo{position:absolute;left:0;right:0;top:-4px;height:6px;border-radius:2px;background:repeating-linear-gradient(90deg,#fff 0 6px,#222 6px 12px);opacity:.85}",
      ".sc-bin{position:absolute;left:0;right:0;top:66px;bottom:36px;transition:transform .9s cubic-bezier(.2,.75,.3,1);pointer-events:none;will-change:transform}",
      ".sc-ped{position:absolute;bottom:0;left:50%;width:60px;margin-left:-30px;display:flex;flex-direction:column;align-items:center}",
      ".sc-num{height:22px;min-width:28px;padding:0 7px;border-radius:11px;background:#e9ecef;color:#0b1020;font-weight:900;font-size:.95rem;line-height:22px;text-align:center;opacity:0;transform:scale(.3);transition:opacity .2s,transform .25s cubic-bezier(.3,1.6,.5,1),background-color .25s}",
      ".sc-num.su{opacity:1;transform:scale(1)}.sc-num.ok{background:#69db7c}.sc-num.no{background:#868e96;color:#fff}.sc-num.re{background:#ffd43b}",
      ".sc-av{position:relative;width:44px;height:44px}",
      ".sc-av img{position:relative;width:100%;height:100%;object-fit:contain;display:block}",
      ".sc-av .sc-pallino{position:relative;width:26px;height:26px;margin:9px;border-radius:50%;border:2px solid rgba(255,255,255,.85)}",
      ".sc-base{position:absolute;left:6px;right:6px;bottom:-3px;height:8px;border-radius:50%;opacity:.9}",
      ".sc-anello{position:absolute;left:-3px;top:-3px;right:-3px;bottom:-3px;border-radius:50%;box-shadow:0 0 10px 4px rgba(105,219,124,.9);opacity:0;transition:opacity .2s}",
      ".sc-av.scelto .sc-anello{opacity:1;animation:scPulse 1s ease-in-out infinite}",
      "@keyframes scPulse{0%,100%{transform:scale(.9)}50%{transform:scale(1.08)}}",
      ".sc-av.trema{animation:scTrema .45s}",
      "@keyframes scTrema{0%,100%{transform:none}20%{transform:translateX(-5px) rotate(-6deg)}40%{transform:translateX(5px) rotate(6deg)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}",
      ".sc-av.salta{animation:scSalta .9s}",
      "@keyframes scSalta{0%,100%{transform:none}30%{transform:translateY(-10px) scale(1.05)}60%{transform:translateY(-4px)}}",
      ".sc-bonk{position:absolute;top:18px;left:50%;padding:1px 6px;border-radius:8px;background:#ff6b6b;color:#fff;font-weight:900;font-size:.68rem;white-space:nowrap;opacity:0;transform:translate(-50%,0) scale(.4);pointer-events:none}",
      ".sc-bonk.via{animation:scBonk 1.5s ease-out forwards}",
      "@keyframes scBonk{0%{opacity:0;transform:translate(-50%,0) scale(.4) rotate(-12deg)}18%{opacity:1;transform:translate(-50%,-8px) scale(1.15) rotate(-8deg)}75%{opacity:1;transform:translate(-50%,-12px) scale(1) rotate(-8deg)}100%{opacity:0;transform:translate(-50%,-16px) scale(1) rotate(-8deg)}}",
      ".sc-etich{position:absolute;left:0;right:0;bottom:2px;height:32px;text-align:center;line-height:1.15}",
      ".sc-nome{font-size:.7rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px;text-shadow:0 1px 2px rgba(0,0,0,.6)}",
      ".sc-gr{font-size:.66rem;font-weight:700;color:rgba(255,255,255,.6)}",
      ".sc-voce{flex:0 0 auto;height:46px;padding:4px 14px 0;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:700;font-size:.9rem;line-height:1.25;color:#ffe8a3}",
      ".sc-voce span{opacity:0;transform:translateY(6px);transition:opacity .3s,transform .3s}.sc-voce span.su{opacity:1;transform:none}",
      ".sc-pann{flex:0 0 auto;height:150px;padding:4px 12px 12px;display:flex;flex-direction:column;justify-content:center;gap:8px}",
      ".sc-tasti{display:flex;gap:10px}",
      ".sc-tasto{flex:1;height:96px;border:0;border-radius:18px;color:#08210f;font-weight:900;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.35);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:inherit}",
      ".sc-tasto b{font-size:2.5rem;line-height:1}.sc-tasto small{font-size:.75rem;font-weight:700;opacity:.8}",
      ".sc-tasto:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.35)}",
      ".sc-msg{text-align:center;font-weight:800;font-size:1.02rem;line-height:1.3}",
      ".sc-msg small{display:block;font-weight:600;opacity:.7;font-size:.82rem;margin-top:2px}",
      ".sc-msg.piccolo{font-size:.86rem;font-weight:700;color:#ffd8a8}",
      ".sc-auto{height:6px;border-radius:3px;background:rgba(255,255,255,.12);overflow:hidden}",
      ".sc-auto i{display:block;height:100%;background:#69db7c;transform-origin:left center}",
      ".sc-guarda-nota{margin:8px 0 0;padding:8px 12px;border-radius:12px;background:rgba(77,171,247,.14);font-weight:700;font-size:.9rem;line-height:1.35;text-align:center}"
    ].join("\n");
    var st = document.createElement("style"); st.id = "sc-stile"; st.textContent = css;
    document.head.appendChild(st);
  }

  // ---------- gli avatar sulla scala (immagine, così salgono senza scatti) ----------
  var facce = {};
  function facciaDi(p) {
    try {
      var cfg = p.omino || (window.SGOmino ? SGOmino.casuale(p.nome || "bot") : null);
      if (!cfg || !window.SGOmino) return null;
      var k = JSON.stringify(cfg);
      if (!facce[k]) facce[k] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(cfg, { busto: true }));
      return facce[k];
    } catch (e) { return null; }
  }

  // =========================================================
  //  IL TAVOLO: la scala a 4 corsie + commento + pannello in basso.
  //  Si costruisce una volta; poi si cambiano solo i pezzi.
  //  o = { posti:[{nome,colore,passi,bot,via,omino}], io (indice o -1), tu (scrive "Tu"), conferma, onEsci }
  // =========================================================
  function creaTavolo(t, o) {
    stileScala();
    var el = t.el;
    var s = t.schermata({}); s.classList.add("sc-piena");
    var eRound = el("div", { class: "sc-round" }), eTempo = el("div", { class: "sc-tempo" }), barra = el("i");
    var bEsci = el("button", { class: "sc-esci", text: "‹", "aria-label": "Esci", onclick: function () { chiediUscita(t, o.conferma || "Uscire dalla partita?", o.onEsci); } });
    var scala = el("div", { class: "sc-scala" });
    var righello = el("div", { class: "sc-righello" });
    for (var k = 5; k <= TRAGUARDO; k += 5) righello.appendChild(el("span", { style: "bottom:" + (k / TRAGUARDO * 100) + "%", text: k === TRAGUARDO ? "🏁" : String(k) }));
    scala.appendChild(righello);
    var box = el("div", { class: "sc-corsie" });
    var C = o.posti.map(function (p, i) {
      var num = el("div", { class: "sc-num" });
      var src = facciaDi(p);
      var av = el("div", { class: "sc-av" }, [
        el("div", { class: "sc-base", style: "background:" + p.colore }),
        el("div", { class: "sc-anello" }),
        src ? el("img", { src: src, alt: "", draggable: "false" }) : el("div", { class: "sc-pallino", style: "background:" + p.colore })
      ]);
      var bonk = el("div", { class: "sc-bonk", text: "Bonk!" });
      var bin = el("div", { class: "sc-bin" }, [el("div", { class: "sc-ped" }, [num, av, bonk])]);
      var nome = el("div", { class: "sc-nome", style: "color:" + p.colore }), gr = el("div", { class: "sc-gr" });
      box.appendChild(el("div", { class: "sc-corsia" + (i === o.io ? " io" : "") }, [
        el("div", { class: "sc-gradini" }, [el("div", { class: "sc-arrivo" })]), bin, el("div", { class: "sc-etich" }, [nome, gr])
      ]));
      return { bin: bin, num: num, av: av, bonk: bonk, nome: nome, gr: gr, passi: -1, testo: null };
    });
    scala.appendChild(box);
    var voce = el("div", { class: "sc-voce" }), pann = el("div", { class: "sc-pann" });
    s._contenuto.appendChild(el("div", { class: "sc-scena" }, [
      el("div", { class: "sc-top" }, [bEsci, eRound, eTempo]), el("div", { class: "sc-barra" }, [barra]), scala, voce, pann
    ]));

    var timers = [], tTempo = null, ultimaEt = "", ultimaVoce = null;
    function vivo() { return document.body.contains(s); }
    function dopo(fn, ms) { timers.push(setTimeout(function () { if (vivo()) fn(); }, ms)); }
    function pulisci() { timers.forEach(clearTimeout); timers = []; }
    function riavvia(nodo, classe) { nodo.classList.remove(classe); void nodo.offsetWidth; nodo.classList.add(classe); }

    // mette l'avatar al gradino giusto (con la salita animata o di colpo)
    function posa(i, passi, anim) {
      var c = C[i]; if (!c) return;
      if (c.passi !== passi) {
        if (!anim) c.bin.style.transition = "none";
        c.bin.style.transform = "translateY(" + (-passi / TRAGUARDO * 100) + "%)";
        if (!anim) { void c.bin.offsetWidth; c.bin.style.transition = ""; }
        c.passi = passi;
      }
      var g = passi + "/" + TRAGUARDO; if (c.gr.textContent !== g) c.gr.textContent = g;
    }
    function tempo(ms) {
      if (tTempo) { clearInterval(tTempo); tTempo = null; }
      if (ms == null) { eTempo.className = "sc-tempo"; barra.style.transition = "none"; barra.style.transform = "scaleX(0)"; return; }
      var fine = Date.now() + ms;
      var tic = function () {
        if (!vivo()) { clearInterval(tTempo); tTempo = null; return; }
        var r = Math.max(0, Math.ceil((fine - Date.now()) / 1000));
        if (eTempo.textContent !== String(r)) eTempo.textContent = r;
        eTempo.className = "sc-tempo on" + (r <= 1 ? " poco" : "");
      };
      tic(); tTempo = setInterval(tic, 200);
      barra.style.transition = "none"; barra.style.transform = "scaleX(" + Math.min(1, ms / (SECONDI * 1000)) + ")"; void barra.offsetWidth;
      barra.style.transition = "transform " + ms + "ms linear"; barra.style.transform = "scaleX(0)";
    }

    var T = {
      s: s,
      dopo: dopo,
      etichetta: function (titolo, sotto) {
        var k = titolo + "|" + (sotto || ""); if (k === ultimaEt) return; ultimaEt = k;
        t.svuota(eRound); eRound.appendChild(document.createTextNode(titolo)); if (sotto) eRound.appendChild(el("small", { text: sotto }));
      },
      // nomi (🤖 per i bot e per chi è uscito) e gradini
      nomi: function (posti) {
        posti.forEach(function (p, i) {
          var c = C[i]; if (!c) return;
          var txt = (p.bot || p.via ? "🤖 " : "") + (i === o.io && o.tu ? "Tu" : p.nome);
          if (c.testo !== txt) { c.testo = txt; c.nome.textContent = txt; }
        });
      },
      posa: posa,
      tempo: tempo,
      voce: function (txt) {
        if (txt === ultimaVoce) return; ultimaVoce = txt;
        t.svuota(voce); if (!txt) return;
        var sp = el("span", { text: txt }); voce.appendChild(sp); void sp.offsetWidth; sp.className = "su";
      },
      pannello: function (nodi) { t.svuota(pann); (nodi || []).forEach(function (n) { if (n) pann.appendChild(n); }); },
      scelto: function (i, si) { if (C[i]) C[i].av.classList.toggle("scelto", !!si); },
      // nuovo round: via i numeri, gli avatar al loro gradino
      nuovoRound: function (passi) {
        pulisci();
        C.forEach(function (c, i) { c.num.className = "sc-num"; c.num.textContent = ""; c.bonk.className = "sc-bonk"; c.av.className = "sc-av"; posa(i, passi[i], false); });
      },
      // la rivelazione: i numeri si girano uno alla volta, poi verde/grigio e "Bonk!", poi chi avanza sale, poi il commento
      // d = { scelte, avanza, prev, passi, commento, vincitori:[indici] }
      rivela: function (d, poi) {
        pulisci(); tempo(null);
        var n = d.scelte.length, tColore = 150 + n * 300 + 350;
        C.forEach(function (c, i) { c.av.className = "sc-av"; c.num.className = "sc-num"; c.num.textContent = d.scelte[i]; c.bonk.className = "sc-bonk"; posa(i, d.prev[i], false); });
        d.scelte.forEach(function (_, i) { dopo(function () { C[i].num.classList.add("su"); suono("tic", i); }, 150 + i * 300); });
        dopo(function () {
          var bonk = false;
          C.forEach(function (c, i) {
            c.num.classList.add(d.avanza[i] ? "ok" : "no");
            if (!d.avanza[i]) { bonk = true; riavvia(c.bonk, "via"); riavvia(c.av, "trema"); }
          });
          if (bonk) suono("bonk");
        }, tColore);
        dopo(function () {
          var su = false;
          C.forEach(function (c, i) { if (d.avanza[i]) { su = true; posa(i, d.passi[i], true); riavvia(c.av, "salta"); } });
          if (su) suono("su");
        }, tColore + 400);
        dopo(function () {
          T.voce(d.commento || "");
          (d.vincitori || []).forEach(function (i) { if (C[i]) { C[i].num.textContent = "🏆"; C[i].num.className = "sc-num su re"; } });
          if ((d.vincitori || []).length) suono("festa");
          if (poi) poi();
        }, tColore + 1400);
      },
      ferma: function () { pulisci(); tempo(null); }
    };
    o.posti.forEach(function (p, i) { posa(i, p.passi, false); });
    T.nomi(o.posti);
    return T;
  }

  // pezzi del pannello in basso
  function pTasti(t, onScegli) {
    var el = t.el, fatto = false;
    return el("div", { class: "sc-tasti" }, SCELTE.map(function (n) {
      return el("button", { class: "sc-tasto", style: "background:" + coloreScelta(n), onclick: function () { if (fatto) return; fatto = true; onScegli(n); } }, [
        el("b", { text: String(n) }), el("small", { text: n === 1 ? "gradino" : "gradini" })
      ]);
    }));
  }
  function pMsg(t, testo, sotto, classe) {
    return t.el("div", { class: "sc-msg" + (classe ? " " + classe : "") }, [document.createTextNode(testo), sotto ? t.el("small", { text: sotto }) : null]);
  }
  function pBottone(t, testo, fn) { return t.el("button", { class: "btn btn-primario", text: testo, onclick: fn }); }
  // la barretta che si svuota prima del round dopo
  function pAuto(t, ms) {
    var i = t.el("i"), b = t.el("div", { class: "sc-auto" }, [i]);
    setTimeout(function () { i.style.transition = "transform " + ms + "ms linear"; i.style.transform = "scaleX(0)"; }, 30);
    return b;
  }

  // =========================================================
  //  UN TELEFONO SOLO (in 4, i posti liberi ai bot)
  // =========================================================
  function partitaLocale(t) {
    var g = t.giocatori.slice(0, 4).map(function (n, i) { return { nome: n, colore: COLORI[i], passi: 0, bot: false, omino: null }; });
    var io = ioDaNome(g.map(function (x) { return x.nome; }));
    if (io >= 0 && t.mioOmino) g[io].omino = t.mioOmino(g[io].nome);
    prendiBot(4 - g.length, g.map(function (x) { return x.nome; })).forEach(function (b) { g.push({ nome: b.nome, colore: COLORI[g.length], passi: 0, bot: true, omino: b.omino || null }); });
    var umani = []; g.forEach(function (x, i) { if (!x.bot) umani.push(i); });
    var solo = umani.length === 1;   // una persona sola: niente "passa il telefono"
    var L = { nRound: 0, scelte: [], caso: [], T: nuovaTracciaScala(), storia: [[], [], [], []], finita: false, tm: null };
    var bot = g.map(function (x) { return x.bot; });
    var tav = creaTavolo(t, { posti: g, io: solo ? umani[0] : -1, tu: false, conferma: "Uscire dalla partita?", onEsci: esci });
    t.mostra(tav.s);
    tav.voce("Scegli in segreto 1, 3 o 5. Se un altro sceglie il tuo stesso numero, restate fermi!");
    inizia(false);

    function ferma() { if (L.tm) { clearTimeout(L.tm); L.tm = null; } }
    function esci() { L.finita = true; ferma(); tav.ferma(); t.esci(); }
    function passi() { return g.map(function (x) { return x.passi; }); }

    function inizia(giaPassato) {
      if (L.finita) return;
      ferma();
      L.nRound += 1; L.scelte = [null, null, null, null]; L.caso = [false, false, false, false];
      tav.nuovoRound(passi());
      tav.etichetta("Round " + L.nRound, "Cima al gradino " + TRAGUARDO);
      if (L.nRound > 1) tav.voce("");
      g.forEach(function (x, i) {
        if (!x.bot) return;
        L.scelte[i] = sceltaBot(i, passi(), L.storia, bot);
        tav.dopo(function () { tav.scelto(i, true); }, 300 + Math.floor(Math.random() * 1400));   // il bot "ci pensa" un attimo
      });
      chiama(0, giaPassato);
    }
    // tocca all'umano numero k (nell'ordine dei posti)
    function chiama(k, giaPassato) {
      if (L.finita) return;
      if (k >= umani.length) return rivelaLocale();
      var i = umani[k], nome = g[i].nome;
      if (giaPassato || (solo && L.nRound > 1)) return scegli(i, k);
      if (solo) return tav.pannello([pMsg(t, "Pronto?", "Hai " + SECONDI + " secondi per scegliere."), pBottone(t, "Via! ▶", function () { scegli(i, k); })]);
      tav.pannello([pMsg(t, "🤝 Passa il telefono a " + nome, "Gli altri non guardano!"), pBottone(t, "Sono " + nome + " ▶", function () { scegli(i, k); })]);
    }
    function scegli(i, k) {
      var fatto = false;
      function prendi(n, cieco) {
        if (fatto || L.finita) return; fatto = true; ferma(); tav.tempo(null);
        L.scelte[i] = n; L.caso[i] = !!cieco; tav.scelto(i, true);
        chiama(k + 1, false);
      }
      tav.pannello([solo ? null : pMsg(t, "Tocca a " + g[i].nome, null, "piccolo"), pTasti(t, prendi)]);
      tav.tempo(SECONDI * 1000);
      L.tm = setTimeout(function () { prendi(aCaso(), true); }, SECONDI * 1000 + 150);
    }
    function rivelaLocale() {
      var scelte = L.scelte.slice(), conta = {};
      scelte.forEach(function (n) { conta[n] = (conta[n] || 0) + 1; });
      var avanza = scelte.map(function (n) { return conta[n] === 1; });
      var prev = passi();
      g.forEach(function (x, i) { if (avanza[i]) x.passi = Math.min(TRAGUARDO, x.passi + scelte[i]); });
      var vinc = []; g.forEach(function (x, i) { if (x.passi >= TRAGUARDO) vinc.push(i); });
      var nomi = g.map(function (x) { return x.nome; });
      var commento = commentoRound(nomi, scelte, avanza, passi(), bot, L.storia, vinc);
      scelte.forEach(function (n, i) { L.storia[i].push(n); });   // i bot si ricordano le abitudini di tutti
      tracciaScala(L.T, io, "l:" + L.nRound, L.nRound, scelte, avanza, prev, passi());
      tav.etichetta("Si scopre!", "Round " + L.nRound);
      tav.pannello([pMsg(t, "🥁 Si scopre…")]);
      var tardi = umani.filter(function (i) { return L.caso[i]; });
      var nota = !tardi.length ? null : solo ? "⏰ Tempo scaduto: il caso ha scelto " + ilNum(scelte[tardi[0]]) + " per te."
        : "⏰ Tempo scaduto per " + elenco(tardi.map(function (i) { return nomi[i]; })) + ": ha scelto il caso.";
      tav.rivela({ scelte: scelte, avanza: avanza, prev: prev, passi: passi(), commento: commento, vincitori: vinc }, function () {
        if (L.finita) return;
        var nNota = nota ? pMsg(t, nota, null, "piccolo") : null;
        if (vinc.length) {
          tav.pannello([nNota, pAuto(t, PAUSA_FINE), pBottone(t, "Vedi il podio 🏆", podio)]);
          L.tm = setTimeout(podio, PAUSA_FINE);
        } else if (solo) {
          tav.pannello([nNota, pAuto(t, PAUSA_AUTO), pBottone(t, "Prossimo round ▶", function () { inizia(false); })]);
          L.tm = setTimeout(function () { inizia(false); }, PAUSA_AUTO);
        } else {
          var primo = g[umani[0]].nome;
          tav.pannello([nNota || pMsg(t, "Round " + (L.nRound + 1), null, "piccolo"), pBottone(t, "Passa il telefono a " + primo + " ▶", function () { inizia(true); })]);
        }
      });
    }
    function podio() {
      if (L.finita) return;
      L.finita = true; ferma(); tav.ferma();
      t.fine(piazzamenti(g).map(function (r) { var x = { nome: r.nome, punti: r.p.passi + " 🪜", pos: r.pos }; if (r.p.bot) x.bot = true; return x; }));
    }
  }

  // =========================================================
  //  ONLINE — ognuno dal suo telefono (host-autoritativo).
  //  4 posti: i giocatori veri entrano, i posti liberi li
  //  prendono i bot. Chi arriva quando la scala è piena (o a
  //  partita iniziata) guarda; alla partita dopo si dà il cambio.
  // =========================================================
  function avatarOk(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function vmScala(st) {
    var vm = { fase: st.fase, codice: st.codice, pronta: st.pronta, partita: st.partita, nRound: st.nRound, traguardo: TRAGUARDO,
      posti: st.posti.map(function (p) { return { id: p.id, nome: p.nome, colore: p.colore, passi: p.passi, bot: !!p.bot, via: !!p.via, chosen: p.scelta != null, omino: p.omino || null }; }),
      guarda: st.guarda.map(function (p) { return { id: p.id, nome: p.nome }; }),
      resta: st.fase === "scelta" || st.fase === "rivela" ? Math.max(0, st.deadline - Date.now()) : 0,   // il tempo che resta (non l'ora: gli orologi dei telefoni non sono uguali)
      ripresa: st.ripresa || 0,   // il round in cui la partita è ripresa (l'host aveva ricaricato)
      scelti: !!st.scelti,        // nella Sala ha scelto l'host chi sale: chi guarda non dà il cambio alla partita dopo
      scelte: null, avanza: null, prev: null, caso: null, commento: "", vincitori: st.vincitori || [] };
    if (st.fase === "rivela") { vm.scelte = st.scelte; vm.avanza = st.avanza; vm.prev = st.prev; vm.caso = st.caso; vm.commento = st.commento; }
    return vm;
  }
  function leggiSalvata() {
    try {
      var v = JSON.parse(localStorage.getItem(CHIAVE_HOST) || "null");
      if (v && v.st && v.st.codice && v.st.codice !== "…" && Date.now() - v.t < VITA_SALVATA) return v;
    } catch (e) {}
    return null;
  }
  function togliSalvata() { try { localStorage.removeItem(CHIAVE_HOST); } catch (e) {} }

  // la partita lasciata a metà (pagina ricaricata, app chiusa) riparte da sola quando l'app riapre la STESSA stanza
  // (lo fa il core, con lo stesso codice): gradini e round restano, gli amici rientrano da soli.
  // Una stanza nuova (o la Sala, che dà sempre un codice nuovo) parte da zero.
  function hostScala(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaReteScala(t);
    apriHost(t, leggiSalvata());
  }

  function apriHost(t, salvata) {
    var st = {
      fase: "lobby", codice: "…", pronta: false, partita: 0, nRound: 0, vincitori: [],
      posti: [{ id: "host", nome: (t.giocatori && t.giocatori[0]) || "Host", colore: COLORI[0], bot: false, passi: 0, scelta: null, omino: t.mioOmino ? t.mioOmino() : null }],
      guarda: [], deadline: 0, scelte: null, avanza: null, prev: null, caso: null, commento: "", ripresa: 0
    };
    var T = nuovaTracciaScala();
    var chiusa = false, tScelta = null, tAuto = null, tBot = [];
    var V = nuovaVista();
    function trova(id, lista) { var r = null; (lista || st.posti).forEach(function (p) { if (p.id === id) r = p; }); return r; }
    // può salire sulla scala? (nella Sala solo chi è stato scelto; fuori dalla Sala tutti)
    function siede(p) { return p.id === "host" || !t.puoSedersi || t.puoSedersi(p.id, p.nome); }
    function ricolora() { st.posti.forEach(function (p, i) { p.colore = COLORI[i]; }); }

    var rete = SGNet.ospita("scalinata", {
      onCodice: function (c) { st.codice = c; bd(); },
      onConnesso: function () { st.pronta = true; bd(); },
      onAddio: function (id) {
        var g = trova(id, st.guarda);
        if (g) { st.guarda.splice(st.guarda.indexOf(g), 1); return bd(); }
        var p = trova(id); if (!p || p.id === "host") return;
        if (st.fase === "lobby") { st.posti.splice(st.posti.indexOf(p), 1); ricolora(); return bd(); }
        // a partita iniziata il posto resta: lo gioca il bot (e alla partita dopo il posto si libera)
        p.via = true;
        if (st.fase === "scelta" && p.scelta == null) sceltaAutomatica(p, 400);
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") entra(id, m);
        else if (m.t === "scegli") registraScelta(id, m.n, m.r);
      },
      // (arriva solo se il primo collegamento non riesce: a partita cominciata la rete si ricollega da sola)
      onErrore: function () { if (!st.pronta && !chiusa) { chiusa = true; fermaTimer(); togliSalvata(); erroreScala(t, "Non riesco ad aprire la stanza. Controlla la connessione e riprova."); } }
    });
    if (!rete) return senzaReteScala(t);
    // la stanza riaperta è quella della partita salvata (e la partita era a metà): si riprende da lì
    var ripresa = !!(salvata && salvata.st && String(rete.codice || "").toUpperCase() === String(salvata.st.codice).toUpperCase() &&
      (salvata.st.fase === "scelta" || salvata.st.fase === "rivela"));
    if (ripresa) {
      st = salvata.st; T = salvata.T || T;
      st.pronta = false; st.guarda = st.guarda || [];
      // gli amici sono "via" finché non rientrano (lo fanno da soli in un attimo); chi non torna in tempo, per lui sceglie il bot
      st.posti.forEach(function (p) { if (!p.bot && p.id !== "host") p.via = true; });
    } else togliSalvata();

    function invia() { if (!chiusa) rete.invia({ t: "vm", vm: vmScala(st) }); }
    function salva() {
      try {
        if (st.fase === "lobby" && st.posti.length < 2 && !st.guarda.length) localStorage.removeItem(CHIAVE_HOST);
        else localStorage.setItem(CHIAVE_HOST, JSON.stringify({ t: Date.now(), st: st, T: T }));
      } catch (e) {}
    }
    function bd() { if (chiusa) return; invia(); salva(); disegna(); }
    function fermaTimer() {
      if (tScelta) { clearTimeout(tScelta); tScelta = null; }
      if (tAuto) { clearTimeout(tAuto); tAuto = null; }
      tBot.forEach(clearTimeout); tBot = [];
    }

    // chi entra: posto libero in saletta, altrimenti guarda. Chi rientra riprende il suo posto.
    function entra(id, m) {
      var p = trova(id);
      if (p) { if (p.via) { p.via = false; bd(); } else invia(); return; }   // rientra: gli rimando la foto, senza ridisegnare
      if (trova(id, st.guarda)) return invia();
      var nuovo = { id: id, nome: String(m.nome || "Amico").slice(0, 16), bot: false, passi: 0, scelta: null, omino: avatarOk(m.omino) };
      // nella Sala sulla scala sale solo chi è stato scelto ("Chi gioca?"): gli altri guardano
      if (st.fase === "lobby" && st.posti.length < 4 && siede(nuovo)) { nuovo.colore = COLORI[st.posti.length]; st.posti.push(nuovo); return bd(); }
      if (st.guarda.length < MAX_GUARDA) { st.guarda.push(nuovo); return bd(); }
      rete.inviaVeloce({ t: "pieno", id: id });   // con il suo id dentro: smette di bussare
    }
    function comincia() {
      if (chiusa || st.fase !== "lobby") return;
      // i posti liberi ai bot del gruppo fisso (nome e avatar arrivano a tutti nella foto)
      var escludi = st.posti.concat(st.guarda).map(function (p) { return p.nome; });
      prendiBot(4 - st.posti.length, escludi).forEach(function (b, k) { st.posti.push({ id: "bot" + k, nome: b.nome, colore: COLORI[st.posti.length], bot: true, passi: 0, scelta: null, omino: b.omino || null }); });
      st.partita += 1; st.nRound = 0; st.vincitori = []; st.ripresa = 0;
      st.posti.forEach(function (p) { p.passi = 0; });
      nuovaScelta();
    }
    function sceltaAutomatica(p, ms) {
      tBot.push(setTimeout(function () {
        var k = st.posti.indexOf(p); if (k < 0 || chiusa || p.scelta != null || !(p.bot || p.via)) return;   // (è rientrato in tempo: sceglie lui)
        registraScelta(p.id, sceltaBot(k, st.posti.map(function (x) { return x.passi; }), st.posti.map(function (x) { return x.storia || []; }), st.posti.map(function (x) { return x.bot || x.via; })), st.nRound);
      }, ms));
    }
    // extra: tempo in più (partita ripresa: gli amici intanto rientrano)
    function nuovaScelta(extra) {
      fermaTimer();
      extra = extra || 0;
      st.nRound += 1; st.fase = "scelta"; st.vincitori = [];
      st.scelte = st.avanza = st.prev = st.caso = null; st.commento = "";
      st.posti.forEach(function (p) { p.scelta = null; p.caso = false; });
      st.deadline = Date.now() + SECONDI * 1000 + extra;
      bd();
      st.posti.forEach(function (p) { if (p.bot || p.via) sceltaAutomatica(p, extra + 700 + Math.floor(Math.random() * 2200)); });
      tScelta = setTimeout(chiudiScelte, SECONDI * 1000 + extra + MARGINE_RETE);
    }
    function registraScelta(id, n, r) {
      if (chiusa || st.fase !== "scelta" || SCELTE.indexOf(n) < 0) return;
      if (r != null && r !== st.nRound) return;   // una scelta in ritardo del round di prima
      var p = trova(id);
      if (!p || p.scelta != null) return;
      p.scelta = n; bd();
      if (st.posti.every(function (x) { return x.scelta != null; })) chiudiScelte();
    }
    function chiudiScelte() {
      if (chiusa || st.fase !== "scelta") return;
      fermaTimer();
      st.posti.forEach(function (p) { if (p.scelta == null) { p.scelta = aCaso(); p.caso = true; } });
      var scelte = st.posti.map(function (p) { return p.scelta; });
      var conta = {}; scelte.forEach(function (n) { conta[n] = (conta[n] || 0) + 1; });
      st.prev = st.posti.map(function (p) { return p.passi; });
      st.avanza = scelte.map(function (n) { return conta[n] === 1; });
      st.scelte = scelte;
      st.caso = st.posti.map(function (p) { return !!p.caso; });
      st.posti.forEach(function (p, i) { if (st.avanza[i]) p.passi = Math.min(TRAGUARDO, p.passi + scelte[i]); });
      var passi = st.posti.map(function (p) { return p.passi; }), vinc = [];
      passi.forEach(function (x, i) { if (x >= TRAGUARDO) vinc.push(i); });
      st.vincitori = vinc.map(function (i) { return st.posti[i].id; });
      var storie = st.posti.map(function (p) { return p.storia || (p.storia = []); });
      st.commento = commentoRound(st.posti.map(function (p) { return p.nome; }), scelte, st.avanza, passi, st.posti.map(function (p) { return p.bot || p.via; }), storie, vinc);
      storie.forEach(function (h, i) { h.push(scelte[i]); if (h.length > 30) h.shift(); });   // abitudini per i bot
      tracciaScala(T, 0, st.partita + ":" + st.nRound, st.nRound, scelte, st.avanza, st.prev, passi);   // l'host è sempre il posto 0
      // il round dopo (o il podio) parte da solo; l'host può andare avanti prima col tasto (che conta)
      var dur = durataRivela(st.posti.length) + (vinc.length ? PAUSA_FINE : PAUSA_AUTO);
      st.fase = "rivela"; st.deadline = Date.now() + dur; bd();
      tAuto = setTimeout(prossimo, dur);
    }
    function prossimo() {
      if (chiusa || st.fase !== "rivela") return;
      if (tAuto) { clearTimeout(tAuto); tAuto = null; }
      if (st.posti.some(function (p) { return p.passi >= TRAGUARDO; })) {
        st.fase = "fine"; bd();
        if (t.risultato) t.risultato(piazzamenti(st.posti).map(function (r) { var x = { nome: r.nome, pos: r.pos }; if (r.p.bot) x.bot = true; return x; }));   // per il torneo online
      } else nuovaScelta();
    }
    // nuova partita: stessa stanza; via i bot e chi è uscito; chi ha guardato entra per primo,
    // e se non c'è posto per tutti dà il cambio chi è arrivato più in basso
    function nuova() {
      if (chiusa) return;
      fermaTimer();
      var umani = st.posti.filter(function (p) { return !p.bot && !p.via; });
      var host = umani.shift();
      umani.sort(function (a, b) { return b.passi - a.passi; });
      // (nella Sala chi non è stato scelto resta a guardare anche alla partita dopo)
      var fila = [host].concat(st.guarda.filter(siede), umani);
      st.posti = fila.slice(0, 4); st.guarda = fila.slice(4).concat(st.guarda.filter(function (p) { return !siede(p); }));
      st.posti.concat(st.guarda).forEach(function (p) { p.passi = 0; p.scelta = null; p.caso = false; });
      ricolora();
      st.fase = "lobby"; st.nRound = 0; st.vincitori = []; st.ripresa = 0; st.scelte = st.avanza = st.prev = st.caso = null; st.commento = "";
      bd();
    }
    // esce l'host: prima si torna indietro (nella Sala gli altri vengono avvisati), poi si chiude la stanza
    function esci() {
      if (chiusa) return;
      chiusa = true; fermaTimer(); togliSalvata();
      if (V.tav) V.tav.ferma();
      t.esci();
      setTimeout(function () { rete.chiudi(); }, 1600);
    }
    var cb = { sonoHost: true, myId: "host",
      onScegli: function (n, r) { registraScelta("host", n, r); },
      onComincia: comincia, onProssimo: prossimo, onNuova: nuova, onEsci: esci };
    t.onRivincita = nuova;   // la "Nuova partita" dell'host (la usa la Rivincita della Sala)
    st.scelti = !!(t.scelti && t.scelti.length);   // nella Sala si è scelto chi gioca: chi guarda lo sa
    function disegna() { if (!chiusa) disegnaVM(t, vmScala(st), cb, V); }

    if (ripresa) {   // il round a metà riparte da capo (con 3 secondi in più); dopo il risultato si va al round dopo
      if (st.fase === "scelta") { st.nRound -= 1; st.ripresa = st.nRound + 1; nuovaScelta(3000); }
      else { st.ripresa = st.nRound + 1; st.deadline = Date.now() + 3000; bd(); tAuto = setTimeout(prossimo, 3000); }
    } else disegna();
  }

  // ---------- trofei dell'ospite: ricordati per stanza (una ricarica non li conta due volte) ----------
  function leggiTraccia(codice) {
    try { var v = JSON.parse(localStorage.getItem("sg-scala-T-" + String(codice).toUpperCase()) || "null"); if (v && "chiave" in v) return v; } catch (e) {}
    return nuovaTracciaScala();
  }
  function salvaTraccia(codice, T) { try { localStorage.setItem("sg-scala-T-" + String(codice).toUpperCase(), JSON.stringify(T)); } catch (e) {} }

  function ospiteScala(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaReteScala(t);
    var el = t.el, S = { myId: null, vm: null, rete: null, nome: "", msg: null, T: leggiTraccia(codice), chiuso: false };
    var V = nuovaVista();
    function niente() {}
    var cb = {
      sonoHost: false, myId: null,
      onScegli: function (n, r) { if (S.rete) S.rete.invia({ t: "scegli", n: n, r: r }); },
      onComincia: niente, onProssimo: niente, onNuova: niente,
      onEsci: function () { S.chiuso = true; if (V.tav) V.tav.ferma(); if (S.rete) S.rete.chiudi(); t.esci(); }
    };
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "🪜", titolo: "Entra nella Scalinata", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      S.msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(S.msg);
      var bEntra = el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        if (S.rete) return;
        S.nome = (input.value || "Amico").trim() || "Amico"; S.msg.textContent = "Collegamento in corso…"; collega();
      } });
      s._piede.appendChild(bEntra);
      t.mostra(s);
      if (t.nomeProfilo && t.nomeProfilo()) { input.value = t.nomeProfilo(); bEntra.click(); }   // entra da solo col nome del profilo di questo telefono
    }
    function collega() {
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : null });
          setTimeout(function () { if (!S.vm && S.msg && !S.chiuso) S.msg.textContent = "Non trovo la partita. Controlla il codice, o l'host non ha ancora aperto la stanza…"; }, 8000); },
        onMsg: function (m) {
          if (S.chiuso || !m) return;
          if (m.t === "pieno") {
            if (m.id !== S.myId) return;
            S.chiuso = true; S.rete.chiudi();
            return erroreScala(t, "La stanza è piena: sulla scala ci sono già 4 giocatori e " + MAX_GUARDA + " spettatori.");
          }
          if (m.t !== "vm" || !m.vm || !m.vm.posti) return;
          var vm = S.vm = m.vm;
          if (vm.fase === "rivela") {
            var io = -1; vm.posti.forEach(function (p, k) { if (p.id === S.myId) io = k; });
            if (tracciaScala(S.T, io, vm.partita + ":" + vm.nRound, vm.nRound, vm.scelte, vm.avanza, vm.prev, vm.posti.map(function (p) { return p.passi; }))) salvaTraccia(codice, S.T);
          }
          cb.myId = S.myId; disegnaVM(t, vm, cb, V);
        },
        // l'host ha chiuso la stanza apposta (se sparisce e non torna, "La stanza è chiusa" lo dice il core):
        // sul podio resta il podio, con la scritta giusta
        onChiuso: function () {
          if (S.chiuso) return;
          S.chiuso = true;
          if (S.vm && S.vm.fase === "fine") { V.chiusa = true; if (V.notaFine) V.notaFine.textContent = NOTA_CHIUSA; return; }
          if (V.tav) V.tav.ferma();
          erroreScala(t, "🚪 L'host ha chiuso la partita.");
        },
        // (solo se il primo collegamento non riesce)
        onErrore: function () { if (!S.chiuso && !S.vm) erroreScala(t, "Problema di collegamento. Controlla la connessione e riprova."); }
      });
    }
  }

  function erroreScala(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaReteScala(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità \"ognuno dal suo telefono\" funziona quando il gioco è aperto dal sito pubblicato online. Da un file locale non è disponibile: intanto usa \"Su questo telefono\"." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // =========================================================
  //  DISEGNO ONLINE (host e ospiti): dalla "foto" (vm) si
  //  aggiorna solo quello che è cambiato. V = cosa c'è già a
  //  schermo su questo telefono.
  // =========================================================
  function nuovaVista() { return { tav: null, partita: null, fase: null, round: -1, mia: null, bip: {}, fine: null, fineS: null, notaGuarda: null }; }

  function disegnaVM(t, vm, cb, V) {
    var myId = cb.myId, io = -1;
    vm.posti.forEach(function (p, k) { if (p.id === myId) io = k; });
    var guarda = vm.guarda || [], guardo = io < 0 && guarda.some(function (g) { return g.id === myId; });

    if (vm.fase === "lobby") { V.tav = null; V.fine = null; V.fase = null; return lobbyVM(t, vm, cb, V, guardo); }
    if (vm.fase === "fine") {
      V.tav = null; V.fase = null;
      if (V.fine === vm.partita && V.fineS && document.body.contains(V.fineS)) return;   // il podio c'è già
      V.fine = vm.partita; V.fineS = podioVM(t, vm, cb, io, V);
      return;
    }
    V.fine = null;

    // il tavolo: uno per partita
    var tav = V.tav;
    if (!tav || V.partita !== vm.partita || !document.body.contains(tav.s)) {
      var posti = vm.posti.map(function (p, i) { return { nome: p.nome, colore: p.colore, bot: p.bot, via: p.via, omino: p.omino, passi: vm.fase === "rivela" && vm.prev ? vm.prev[i] : p.passi }; });
      tav = V.tav = creaTavolo(t, { posti: posti, io: io, tu: true, conferma: cb.sonoHost ? "Chiudere la partita per tutti?" : "Uscire dalla partita?", onEsci: cb.onEsci });
      V.partita = vm.partita; V.fase = null; V.round = -1;
      t.mostra(tav.s);
    }
    tav.nomi(vm.posti);
    var sotto = guardo ? "👀 Stai guardando" : guarda.length ? "👀 " + guarda.length + (guarda.length === 1 ? " spettatore" : " spettatori") : "Cima al gradino " + TRAGUARDO;

    if (vm.fase === "scelta") {
      tav.etichetta("Round " + vm.nRound, sotto);
      if (V.fase === "scelta" && V.round === vm.nRound) {   // stesso round: si accende solo chi ha appena scelto (col bip)
        vm.posti.forEach(function (p, i) { if (p.chosen && !V.bip[p.id]) { V.bip[p.id] = 1; tav.scelto(i, true); if (i !== io) suono("bip"); } });
        return;
      }
      V.fase = "scelta"; V.round = vm.nRound; V.bip = {};
      tav.nuovoRound(vm.posti.map(function (p) { return p.passi; }));
      tav.voce(vm.ripresa && vm.ripresa === vm.nRound ? "🔁 Partita ripresa: si continua da qui!"
        : vm.nRound === 1 ? "Scegli in segreto 1, 3 o 5. Se un altro sceglie il tuo stesso numero, restate fermi!" : "");
      tav.tempo(vm.resta);
      var mio = io >= 0 ? vm.posti[io] : null, giaMia = V.mia && V.mia.r === vm.nRound && V.mia.p === vm.partita;
      if (mio && !mio.bot && !mio.via && !mio.chosen && !giaMia) {
        var nR = vm.nRound, nP = vm.partita;
        tav.pannello([pTasti(t, function (n) {
          // al primo tocco: via i tasti, si accende il mio avatar, poi la scelta parte verso l'host
          V.mia = { r: nR, p: nP, n: n }; tav.scelto(io, true);
          tav.pannello([pMsg(t, "Hai scelto " + n + " ✓", "Aspetta gli altri…")]);
          cb.onScegli(n, nR);
        })]);
      } else if (mio && !mio.bot && !mio.via) tav.pannello([pMsg(t, giaMia ? "Hai scelto " + V.mia.n + " ✓" : "Hai scelto ✓", "Aspetta gli altri…")]);
      else tav.pannello([pMsg(t, "👀 Stai guardando", !guardo ? null : vm.scelti ? "Questa volta sulla scala ci sono gli altri." : "La scala ha 4 posti: entri alla prossima partita."), t.faccine ? t.faccine() : null]);
      vm.posti.forEach(function (p, i) { if (p.chosen || (i === io && giaMia)) { V.bip[p.id] = 1; tav.scelto(i, true); } });
      return;
    }

    // ---- rivela ----
    tav.etichetta("Si scopre!", "Round " + vm.nRound + (guarda.length ? " · " + sotto : ""));
    if (V.fase === "rivela" && V.round === vm.nRound) return;   // la stessa foto: niente da rifare
    V.fase = "rivela"; V.round = vm.nRound;
    tav.pannello([pMsg(t, "🥁 Si scopre…")]);
    var vinc = []; vm.posti.forEach(function (p, i) { if ((vm.vincitori || []).indexOf(p.id) >= 0) vinc.push(i); });
    var nota = null, mioP = io >= 0 ? vm.posti[io] : null;
    if (mioP && !mioP.bot && !mioP.via && vm.caso && vm.caso[io]) {
      var mandata = V.mia && V.mia.r === vm.nRound && V.mia.p === vm.partita;
      nota = (mandata ? "⏰ Troppo tardi: " : "⏰ Tempo scaduto: ") + "il caso ha scelto " + ilNum(vm.scelte[io]) + " per te.";
    }
    // la fine del conto la decide l'host (vm.resta): l'ora di fine col MIO orologio
    var fino = Date.now() + (vm.resta || 0), kR = "sc-rivela|" + vm.partita + "|" + vm.nRound;
    tav.rivela({ scelte: vm.scelte, avanza: vm.avanza, prev: vm.prev, passi: vm.posti.map(function (p) { return p.passi; }), commento: vm.commento, vincitori: vinc }, function () {
      var finita = vinc.length > 0, sec = Math.max(1, Math.round((fino - Date.now()) / 1000));
      // l'host: "Prossimo round ▶ 3" (conta e a zero si va avanti); gli altri: "Si va avanti tra 3…"
      var tasto = cb.sonoHost ? pBottone(t, finita ? "Vedi il podio 🏆" : "Prossimo round ▶", cb.onProssimo) : pMsg(t, "", null, "piccolo");
      tav.pannello([ nota ? pMsg(t, nota, null, "piccolo") : null, tasto ]);
      t.contoAvanti(tasto, sec, cb.sonoHost ? function () { cb.onProssimo(); } : null, kR);
    });
  }

  function lobbyVM(t, vm, cb, V, guardo) {
    stileScala();
    var liberi = 4 - vm.posti.length, guarda = vm.guarda || [], extra = [];
    if (guarda.length) {
      if (!V.notaGuarda) V.notaGuarda = t.el("div", { class: "sc-guarda-nota" });
      var altri = guarda.filter(function (g) { return g.id !== cb.myId; }).map(function (g) { return g.nome; });
      var conTe = altri.length ? " (con te " + (altri.length === 1 ? "guarda " : "guardano ") + elenco(altri) + ")" : "";
      // nella Sala chi sale l'ha scelto l'host: niente cambio alla partita dopo
      var txt = vm.scelti ? (guardo ? "👀 Questa volta guardi" + conTe + ": sulla scala salgono gli amici scelti." : "👀 Guardano: " + elenco(guarda.map(function (g) { return g.nome; })) + ".")
        : guardo ? "👀 Sulla scala c'è posto per 4: questa partita la guardi" + conTe + ". Alla prossima tocca prima a chi ha guardato!"
        : "👀 Guardano: " + elenco(guarda.map(function (g) { return g.nome; })) + ". Sulla scala c'è posto per 4: alla prossima partita si dà il cambio.";
      if (V.notaGuarda.textContent !== txt) V.notaGuarda.textContent = txt;
      extra.push(V.notaGuarda);
    }
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 1, puoiDaSolo: true, vuoti: liberi,
      giocatori: vm.posti.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      nota: cb.sonoHost && liberi > 0 ? "Puoi cominciare quando vuoi: " + (liberi === 1 ? "il posto libero lo prende un Bot." : "i " + liberi + " posti liberi li prendono i Bot.") : null,
      extra: extra,
      attesa: guardo ? (vm.scelti ? "Si comincia tra poco: questa partita la guardi." : "La scala è piena: questa partita la guardi da spettatore.") : "Aspetta che l'host cominci la salita! 🪜",
      spettatore: guardo ? "👀 Questa volta guardi" : null,   // (chi guarda non è "dentro" e non ha "Sono pronto")
      onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  function podioVM(t, vm, cb, io, V) {
    var el = t.el, pz = piazzamenti(vm.posti), med = ["🥇", "🥈", "🥉"];
    var primi = pz.filter(function (r) { return r.pos === 1; });
    var hoVinto = primi.some(function (r) { return r.p.id === cb.myId; });
    var titolo = primi.length > 1 ? "Vincono " + elenco(primi.map(function (r) { return r.p.id === cb.myId ? "tu" : r.nome; })) + "!"
      : hoVinto ? "Hai vinto!" : "Vince " + (primi[0] ? primi[0].nome : "") + "!";
    var s = t.schermata({ icona: "🏆", titolo: titolo, sotto: "In cima alla scalinata",
      indietro: function () { chiediUscita(t, cb.sonoHost ? "Chiudere la stanza per tutti?" : "Uscire dalla partita?", cb.onEsci); } });
    var ol = el("ol", { class: "classifica" });
    pz.forEach(function (r) {
      ol.appendChild(el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: med[r.pos - 1] || r.pos + "°" }),
        el("span", { class: "nome", text: (r.p.bot || r.p.via ? "🤖 " : "") + r.nome + (r.p.id === cb.myId ? " (tu)" : "") }),
        el("span", { class: "punti", text: r.p.passi + " 🪜" })
      ]));
    });
    s._contenuto.appendChild(ol);
    var guarda = vm.guarda || [], hoGuardato = guarda.some(function (g) { return g.id === cb.myId; });
    var cambio = vm.posti.filter(function (p) { return !p.bot && !p.via; }).length + guarda.length > 4;   // qualcuno dovrà scendere
    if (guarda.length) s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin-top:12px",
      text: vm.scelti ? (hoGuardato ? "👀 Questa volta hai guardato." : (guarda.length === 1 ? "👀 Ha guardato " : "👀 Hanno guardato ") + elenco(guarda.map(function (g) { return g.nome; })) + ".")
        : hoGuardato ? "👀 Hai guardato: alla prossima partita sali tu sulla scala!"
        : (guarda.length === 1 ? "👀 Ha guardato " : "👀 Hanno guardato ") + elenco(guarda.map(function (g) { return g.nome; })) +
          (guarda.length === 1 ? ": alla prossima partita sale sulla scala" : ": alla prossima partita salgono sulla scala") + (cambio ? " e dà il cambio chi è arrivato più in basso." : ".") }));
    var fa = t.faccine ? t.faccine() : null;   // le faccine mentre si guarda la classifica
    if (fa) { fa.style.marginTop = "12px"; s._contenuto.appendChild(fa); }
    // i tasti di fine uguali per tutti i giochi (Rivincita, Ci sto…); se il core non li mette, quelli di sempre
    if (t.tastiFine && t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci })) V.notaFine = null;
    else if (cb.sonoHost) {
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🔄 Nuova partita", onclick: cb.onNuova }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Chiudi", onclick: cb.onEsci }));
    } else {
      s._piede.appendChild(V.notaFine = el("p", { class: "modulo-nota", style: "text-align:center", text: V.chiusa ? NOTA_CHIUSA : "⏳ Aspetta l'host: se fa un'altra partita, torni da solo nella saletta." }));
      s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    }
    t.mostra(s);
    return s;
  }
  var NOTA_CHIUSA = "🚪 L'host ha chiuso la stanza.";
  // uscire (o chiudere la stanza) chiede conferma: la finestra al centro dell'app (window.confirm se manca)
  function chiediUscita(t, domanda, fn) { if (t.conferma) t.conferma(domanda, null, "Esci", fn); else if (window.confirm(domanda)) fn(); }
})();

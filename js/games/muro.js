/* =========================================================
   🧱 IL MURO — il nostro «The Wall» (10 nov 2026, chat «🧱 Il Muro»).
   A squadre (da 2 a 5, da 2 o 3 giocatori), tutte INSIEME e con le STESSE domande. In ogni squadra chi sta «nella stanza»
   risponde in segreto (2 o 3 risposte); chi sta «giù» NON vede la domanda: vede solo l'argomento e le risposte e scommette
   su quanto la sa il compagno, scegliendo quante palline far cadere (da 0 a 3) e da dove. Poi la rivelazione: domanda e
   risposta giusta col rullo di tamburi, il 💀 Muro dei perdenti (lì le palline TOLGONO punti) e il 🏆 Muro dei vincitori
   (lì li DANNO). L'ultimo giro vale doppio. Solo online, nella Sala. Niente trofei.
   Le decisioni del proprietario: docs/muro/progetto-muro.md (NON cambiarle); come è fatto: docs/muro/motore-muro.md.
   Le domande: data/muro-domande.js (si rifà con .agents/skills/prova-nel-browser/muro/domande/costruisci.js).
   Le prove: .agents/skills/prova-nel-browser/muro/muro.js (mu1, mu1b…).

   Nato dal MODELLO dei giochi online (.agents/skills/nuovo-gioco/modello-gioco-online.js), cambiando solo le parti «QUI».
   Come lì sono già fatte bene tutte le cose facili da sbagliare:
   - "Online" da un gioco apre la Sala della serata: il gioco non se ne accorge, il core gli passa tutto nel tavolo (t);
   - saletta d'attesa comune (t.lobby) con avatar e posti che mancano (qui con le SQUADRE nella parte del gioco);
   - chi ha il profilo (tutti, ormai) entra da solo; il nome a mano resta solo come riserva;
   - gli id dei giocatori nella "foto" (vm): servono a chi entra per sapere che è dentro;
   - "Chi gioca?" della Sala: chi non è tra gli scelti (t.puoSedersi falso) entra e guarda;
   - segreti a un telefono solo con inviaVeloce + "to" (mai con invia): qui la DOMANDA va solo a chi è nella stanza,
     e nella foto durante la domanda non ci sono mai la domanda, le risposte, le risposte date né le palline;
   - "⚙️ Regole" in saletta (t.onRegole);
   - chi esce: dalla saletta si toglie senza rimescolare, a partita iniziata resta "via";
   - chi ricarica la pagina o riaccende il telefono rientra col suo posto (stesso id: il "join" rimanda foto e segreti);
   - chi si sta ricollegando ha 📶 accanto al nome (onForse / onTornato);
   - nessuna attesa resta ferma: sui punteggi l'host ha "Prossima domanda ▶ 6" che va avanti da solo (t.contoAvanti),
     gli altri leggono "Si va avanti tra 6…";
   - la rete che salta NON chiude la partita: ci pensa il core ("📶 Mi ricollego…");
     onErrore arriva solo se il PRIMO collegamento non riesce, e allora si offre "Riprova";
   - l'host che ricarica la pagina o riapre l'app RITROVA la partita (riprende: true), e se sparisce un amico la porta
     avanti (riserva: true): chi tiene la partita è t.mioId (IO), MAI "host" fisso;
   - "Esci" a partita iniziata chiede conferma con la finestra dell'app (t.conferma);
   - fine partita: t.risultato coi NOMI dei giocatori (ognuno col posto della sua squadra), medaglie a pari merito, le
     faccine (t.faccine), i tasti di fine del core (t.tastiFine) e la "Nuova partita" (t.onRivincita);
   - chi arriva a partita cominciata (RITARDATARI "turno"): aspetta in "prossimi" ed entra all'inizio della domanda dopo,
     nella squadra con meno persone (se sono tutte da 3, guarda ed entra alla prossima partita);
   - chi guarda soltanto (t.guarda): niente segreti, niente tasti, il posto in basso per la targhetta del core;
   - l'host dice alla Sala a che punto è la partita (t.aCheSiamo("Domanda 3 di 15"));
   - schermo intero senza scorrere e senza titolo, aggiornato a pezzi (niente lampeggio); le palline su canvas;
   - tocchi con pointerdown (su iPhone il click a volte non arriva).
   ========================================================= */
(function () {
  "use strict";

  var ID = "muro";
  var MIN = 4, MAX = 10;         // da 2 a 5 squadre, ognuna da 2 o 3: almeno 4 giocatori, al massimo 10
  var RESPIRO = 5;               // i secondi di respiro quando la partita riprende (gli amici intanto rientrano)
  // chi arriva a partita cominciata: entra all'inizio della domanda dopo, nella squadra con meno persone (prende i suoi punti)
  var RITARDATARI = "turno";
  var ANTICIPO = 1000;           // il telefono chiude risposte e palline 1 s prima di chi tiene la partita (come fineVM di prezzo.js)
  var CHIUDE_DOPO = 700;         // e chi tiene la partita chiude 0,7 s dopo la sua scadenza: il tocco dell'ultimo istante arriva

  // ===================== I NUMERI DEL GIOCO (tutti qui: si ritoccano in un posto solo) =====================
  // Li ha decisi la simulazione (.agents/skills/prova-nel-browser/muro/simulazione/LEGGIMI.md): muro A.
  // Il muro si disegna da qui (caselle e zone qualsiasi): per il muro B basta cambiare CASE, CASE_DOPPIO, NZ e FILE.
  var NUM = {
    CASE: [50, 100, 250, 500, 1000, 500, 250, 100, 50],             // le caselle in fondo (uguali nei due muri: + vincitori, − perdenti)
    CASE_DOPPIO: [100, 200, 500, 1000, 2000, 1000, 500, 200, 100],  // l'ultimo giro: le stesse ×2 (disegnate più grandi)
    NZ: 9,               // le zone in cima da dove cadono le palline (una sopra ogni casella)
    FILE: 12,            // le file di chiodini (PARI: così la pallina finisce sempre in una casella)
    MAXP: 3,             // palline al massimo per domanda (0 = non cade niente: permesso)
    SOTTOZERO: true,     // i punti scendono anche sotto zero
    GIRI: { corta: [9, 3], normale: [12, 3], lunga: [15, 3] },      // [domande normali, domande dell'ultimo giro (doppio)]
    TEMPI: [15, 20, 30], TEMPO: 20,                                  // secondi per rispondere e scegliere (di partenza 20)
    // le durate della rivelazione (ms; PUNTI in secondi: il conto sul tasto dell'host)
    SVELA: 4600, RULLO: 1500,                    // la risposta giusta: prima il rullo di tamburi, poi la domanda e le risposte
    INTRO: 650, SFASA: 120, SFASA_TOT: 900,      // le palline in alto, poi partono una dopo l'altra (al massimo 0,9 s in tutto)
    DOPO: 1300, VUOTO: 1300,                     // dopo l'ultima pallina; il muro vuoto passa in un attimo
    PUNTI: 6, PUNTI_ANNUNCIO: 8,                 // i punteggi (più lunghi prima dell'ultimo giro: c'è l'annuncio)
    PASSO: { primo: 360, su: 75, giu: 115, fondo: 320, acc: 0.022 }   // la caduta: il primo chiodino, il saltello, la discesa, la casella; accelera un po' a ogni fila
  };

  // le squadre: un colore (mai rosso né verde) e un SIMBOLO disegnato sulla pallina (canvas, non un carattere: uguale su tutti i telefoni)
  var SQ = [
    { nome: "Blu", col: "#4c6ef5", tx: "#91a7ff", ink: "#ffffff", sim: "stella" },
    { nome: "Arancione", col: "#ff922b", tx: "#ffa94d", ink: "#1a1100", sim: "cerchio" },
    { nome: "Viola", col: "#cc5de8", tx: "#e599f7", ink: "#1d0828", sim: "triangolo" },
    { nome: "Giallo", col: "#fcc419", tx: "#ffd43b", ink: "#241a00", sim: "quadrato" },
    { nome: "Azzurro", col: "#22b8cf", tx: "#66d9e8", ink: "#00222a", sim: "rombo" }
  ];
  var LETTERE = ["A", "B", "C", "D"];

  function fmtN(n) { var s = String(Math.round(Math.abs(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); return (n < 0 ? "−" : "") + s; }   // 1.000
  function fmtD(n) { return (n > 0 ? "+" : "") + fmtN(n); }   // +350, −120, 0
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function intero(x) { var n = Number(x); return isFinite(n) && Math.floor(n) === n ? n : null; }
  function mischia(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function vibra(p) { var o = Date.now(); if (o - (vibra.u || 0) < 160) return; vibra.u = o; try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  function riduci() { try { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; } }
  // tocco immediato col pointerdown (su iPhone il click a volte non arriva); il click resta per tastiera e prove
  function tocco(n, fn) {
    var ult = 0;
    n.addEventListener("pointerdown", function (e) { if (e.button > 0) return; e.preventDefault(); ult = Date.now(); fn(e); });
    n.addEventListener("click", function (e) { if (Date.now() - ult < 700) return; fn(e); });
  }

  // ===================== LE DOMANDE =====================
  // id di una domanda = argomento + ":" + impronta corta del testo (non l'indice: il file può cambiare)
  function impronta(s) { var h = 5381; s = String(s); for (var i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); }
  function idDom(arg, testo) { return arg + ":" + impronta(testo); }
  var IDX = null;   // id → { arg, e: [difficoltà, domanda, giusta, sbagliata, sbagliata?] }
  function indice() {
    if (IDX) return IDX;
    IDX = {};
    var D = window.SG_MURO_DOM || {};
    Object.keys(D).forEach(function (a) { (D[a] || []).forEach(function (e) { if (e && e.length >= 4) IDX[idDom(a, e[1])] = { arg: a, e: e }; }); });
    return IDX;
  }
  function argDi(id) { var A = window.SG_MURO_ARG || []; for (var i = 0; i < A.length; i++) if (A[i].id === id) return A[i]; return { id: id, nome: id, icona: "🧱" }; }
  function tuttiArg() { return (window.SG_MURO_ARG || []).map(function (a) { return a.id; }); }
  // le uscite: sul telefono di chi tiene la partita, gli ultimi 900 id (si salva a ogni domanda)
  var USCITE = "sg-muro-uscite";
  function leggiUscite() { try { var v = JSON.parse(localStorage.getItem(USCITE) || "[]"); return v instanceof Array ? v : []; } catch (e) { return []; } }
  function segnaUscita(id) {
    try { var v = leggiUscite().filter(function (x) { return x !== id; }); v.push(id); if (v.length > 900) v = v.slice(v.length - 900); localStorage.setItem(USCITE, JSON.stringify(v)); } catch (e) {}
  }
  // n domande dagli argomenti accesi: prima quelle mai uscite (poi le uscite da più tempo); mai lo stesso argomento due volte
  // di fila se si può. Ognuna con l'ordine delle risposte mescolato (ord[i] = la risposta del file al posto i; 0 = la giusta)
  function scegliDomande(args, n, gia) {
    var X = indice(), visti = leggiUscite(), pos = {}, pool = {}, usate = {};
    visti.forEach(function (id, i) { pos[id] = i; });
    (gia || []).forEach(function (id) { usate[id] = 1; });
    var D = window.SG_MURO_DOM || {};
    args.forEach(function (a) {
      var l = mischia((D[a] || []).map(function (e) { return idDom(a, e[1]); }).filter(function (id) { return X[id] && !usate[id]; }));
      l.sort(function (x, y) { return (pos[x] == null ? -1 : pos[x]) - (pos[y] == null ? -1 : pos[y]); });   // (sort stabile: tra le mai uscite resta il caso)
      pool[a] = l;
    });
    var out = [], prima = null;
    while (out.length < n) {
      var cand = args.filter(function (a) { return pool[a] && pool[a].length; });
      if (!cand.length) break;
      var altri = cand.filter(function (a) { return a !== prima; });
      var a = (altri.length ? altri : cand)[Math.floor(Math.random() * (altri.length ? altri : cand).length)];
      var id = pool[a].shift(), nr = X[id].e.length - 2;
      out.push({ id: id, ord: mischia(Array.apply(null, { length: nr }).map(function (_, i) { return i; })) });
      prima = a;
    }
    return out;
  }
  // la domanda com'è sullo schermo: { arg, testo, opz (nell'ordine mescolato), giusta (il posto della giusta) }
  function domandaDi(d) {
    var x = d && indice()[d.id]; if (!x) return null;
    return { arg: x.arg, testo: x.e[1], opz: d.ord.map(function (i) { return x.e[2 + i]; }), giusta: d.ord.indexOf(0) };
  }

  // ===================== IL MURO: le cadute (le decide chi tiene la partita) =====================
  // posizioni in mezze caselle (0 … 2·(caselle−1), le caselle sono i pari); a ogni fila ±1, coi rimbalzi sulle pareti
  // (come cade() del Plinko di js/games/prezzo-premi-b.js, con un numero qualsiasi di caselle, zone e file)
  function nCase() { return NUM.CASE.length; }
  function posZona(z) { var N = nCase(); return NUM.NZ <= 1 ? 2 * Math.floor((N - 1) / 2) : 2 * Math.round(z * (N - 1) / (NUM.NZ - 1)); }
  function cade(z) {
    var M = 2 * (nCase() - 1), p = posZona(z), s = "";
    for (var r = 0; r < NUM.FILE; r++) { var d = Math.random() < 0.5 ? -1 : 1; p += d; if (p < 0) { p = 1; d = 1; } if (p > M) { p = M - 1; d = -1; } s += d > 0 ? "1" : "0"; }
    return { p: s, b: Math.max(0, Math.min(nCase() - 1, Math.round(p / 2))) };
  }
  function percorso(z, s) {
    var M = 2 * (nCase() - 1), p = posZona(z), l = [p];
    for (var r = 0; r < s.length; r++) { p += s.charAt(r) === "1" ? 1 : -1; if (p < 0) p = 1; if (p > M) p = M - 1; l.push(p); }
    return l;
  }
  function valori(doppio) { return doppio ? NUM.CASE_DOPPIO : NUM.CASE; }
  // quanto dura un muro con n palline (lo decide chi tiene la partita; i telefoni seguono il loro orologio da quando arriva la foto)
  function tCaduta() { var k = chiavi(0, new Array(NUM.FILE + 1).join("1"), 0); return k[k.length - 1].t; }
  function sfasa(n) { return n > 1 ? Math.min(NUM.SFASA, NUM.SFASA_TOT / (n - 1)) : 0; }
  function durataMuro(n) { return n ? NUM.INTRO + (n - 1) * sfasa(n) + tCaduta() + NUM.DOPO : NUM.VUOTO; }

  // =========================================================
  //  HOST: tiene la partita vera e manda a tutti la "foto" (vm)
  // =========================================================
  function host(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    // io che tengo la partita: "host", oppure (host di riserva) l'id da amico di chi ha preso il posto dell'host sparito.
    // Scrivi SEMPRE IO dove intendi "io che tengo la partita", MAI "host" fisso
    var IO = t.mioId || "host";
    var H = { fase: "lobby", codice: "…", pronta: false, partita: 0, stato: "attesa", classifica: null, scadenza: 0, durMs: 0, to: null,
      rip: 0,   // quante volte la partita è ripresa (nelle chiavi dei conti: così ripartono da capo su tutti i telefoni)
      imp: impDi(imp), nsq: 2, rot: false,   // squadre e «🔄 A rotazione» (di partenza SPENTO: scelta del proprietario, 10 nov 2026)
      // sq = la squadra (0…nsq−1), ruolo = "giu" (giù) o "su" (nella stanza): quello scelto in saletta
      players: [{ id: IO, nome: nomeHost, omino: t.mioOmino(nomeHost), sq: 0, ruolo: "giu" }],
      guarda: [],     // chi è entrato ma questa volta guarda (nella Sala non è tra gli scelti di "Chi gioca?"): { id, nome }
      prossimi: [],   // chi è arrivato a partita cominciata ed entra all'inizio della domanda dopo: { id, nome, omino }
      dopo: [],       // chi è arrivato con tutte le squadre da 3: guarda ed entra alla prossima partita
      // la partita
      k: 0, tot: 0, ndop: 3, doms: [], punti: [], ord: [], sqd: null, fatto: [], riv: null, palle: null, delta: null, datiK: 0, dopoRip: null };
    // i segreti della domanda di adesso (risposte, palline, su chi si punta, chi è pronto): FUORI da H, così non vanno mai
    // nella copia per il vice né nella memoria (la domanda a metà si rifà da capo)
    var Q = { k: 0, risp: {}, palle: {}, su: {}, pronto: {} };
    // ----- la partita di prima (t.ripresa): l'host ha ricaricato la pagina o riaperto l'app, oppure (t.ripresa.daRiserva)
    // l'host è sparito e questo telefono la porta avanti. Si riprende solo una partita cominciata (in saletta non c'è niente)
    var R = t.ripresa, riprendo = !!(R && R.stato && R.stato.fase && R.stato.fase !== "lobby" && R.stato.players), respiroMs = 0, attesi = [];
    if (riprendo) {
      H = R.stato;
      H.to = null; H.pronta = false; H.rip = H.rip || 0;
      H.prossimi = []; H.dopo = []; H.fatto = []; H.guarda = H.guarda || [];   // (chi aspettava rimanda il suo join da solo)
      H.imp = impDi(H.imp || {});
      H.players.forEach(function (p) {
        if (p.id !== IO && !p.via && p.id !== (R.daRiserva && R.vecchioHost)) attesi.push(p.id);
        p.forse = false; p.via = p.id !== IO; if (p.id === IO) p.omino = t.mioOmino(p.nome);
      });
      // "domanda" → la stessa domanda da capo (nessuna scelta era salvata); "svela"/"perdenti"/"vincitori" → la rivelazione
      // da "svela" (i punti non erano ancora dati); "punti" → la domanda dopo (i punti sono già dati, una volta sola)
      if (H.fase === "gioco") {
        if (H.stato !== "ripresa") H.dopoRip = H.stato === "punti" ? "prossima" : (H.stato === "domanda" || !H.riv ? "rifai" : "svela");
        if (H.stato === "punti") respiroMs = R.ora(H.scadenza) - Date.now();
        H.stato = "ripresa";
        respiroMs = Math.max(RESPIRO * 1000, respiroMs);
      }
    }
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function inLista(l, id) { return l.some(function (x) { return x.id === id; }); }
    function membri(s) { return H.players.filter(function (p) { return p.sq === s; }); }
    function vivi(s) { return membri(s).filter(function (p) { return !p.via; }); }
    function squadreVive() { var n = 0; for (var s = 0; s < H.nsq; s++) if (vivi(s).length) n++; return n; }
    function ferma() { if (H.to) { clearTimeout(H.to); H.to = null; } }
    function spento() { return !!(rete && rete._chiusa); }   // il core ha portato via il gioco (Cambia gioco, Sala passata): niente più timer
    function dopo(ms, fn) { ferma(); H.to = setTimeout(function () { H.to = null; if (!spento()) fn(); }, Math.max(0, ms)); }

    // "⚙️ Regole" nella saletta: l'host cambia le impostazioni quando vuole
    t.onRegole = function (im) { if (H.fase !== "lobby") return; H.imp = impDi(im); bd(); };

    var rete = SGNet.ospita(ID, {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      // la stanza non si è proprio aperta (il primo collegamento non è riuscito in 15 secondi): si riprova da capo.
      // Dopo che la stanza è aperta onErrore non arriva più: la rete che salta la gestisce il core ("📶 Mi ricollego…")
      onErrore: function () {
        if (H.pronta) return;
        ferma(); if (rete) rete.chiudi();
        erroreRete(t, "Non riesco ad aprire la stanza.", function () { host(t); });
      },
      // un amico è sparito senza salutare (schermo bloccato, rete persa): 📶 accanto al nome finché non torna
      onForse: function (id) { var p = pById(id); if (p && !p.forse) { p.forse = true; bd(); } },
      onTornato: function (id) { var p = pById(id); if (p && p.forse) { p.forse = false; bd(); } },
      // 👀 arriva uno che guarda soltanto: gli avatar e (durante la domanda) le risposte possibili
      onGuarda: function () { if (H.fase === "gioco") { mandaOmini(); mandaOpz(); } },
      // uscito apposta, oppure sparito da più di 20 secondi
      onAddio: function (id) {
        if (inLista(H.guarda, id)) { H.guarda = H.guarda.filter(function (x) { return x.id !== id; }); bd(); return; }
        if (inLista(H.prossimi, id) || inLista(H.dopo, id)) { H.prossimi = H.prossimi.filter(function (x) { return x.id !== id; }); H.dopo = H.dopo.filter(function (x) { return x.id !== id; }); bd(); return; }
        var p = pById(id); if (!p) return;
        p.forse = false;
        // nella saletta si toglie e basta (le squadre degli altri restano come sono; se era giù, va giù il primo della squadra)
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); sistemaGiu(); bd(); return; }
        p.via = true;                                   // a partita iniziata resta in classifica (con la sua squadra), ma non gioca più
        if (H.fase === "gioco" && H.stato !== "ripresa" && squadreVive() < 2) return fine();   // (nel respiro decide dopoRespiro)
        bd();
        if (H.fase === "gioco" && H.stato === "domanda") controllaFatto();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          var p = pById(id), nome = String(m.nome || "Amico").slice(0, 16);
          // nella Sala, se siamo più dei posti, l'host ha scelto chi gioca ("Chi gioca?"): gli altri entrano e guardano.
          // (nella foto c'è anche il loro id: così il collegamento sa che sono dentro e smette di ripetere il "join")
          if (!p && !t.puoSedersi(id, nome)) {
            if (!inLista(H.guarda, id)) H.guarda.push({ id: id, nome: nome });
            bd(); if (H.fase === "gioco") { mandaOmini(); mandaOpz(); }
            return;
          }
          // chi arriva a partita cominciata: aspetta in "prossimi" (il suo id nella foto: è dentro) ed entra all'inizio della
          // domanda dopo. Se tutte le squadre sono da 3 guarda ed entra alla prossima partita ("dopo")
          if (!p && H.fase === "gioco") {
            if (!inLista(H.prossimi, id) && !inLista(H.dopo, id)) {
              var x = { id: id, nome: nome, omino: avatarValido(m.omino) };
              if (postoPerChiArriva(H.prossimi.length) >= 0 && presenti().length + H.prossimi.length < MAX) H.prossimi.push(x); else H.dopo.push(x);
            }
            bd(); mandaOmini(); mandaOpz(); return;
          }
          if (!p && H.fase === "lobby" && H.players.length < MAX) aggiungi({ id: id, nome: nome, omino: avatarValido(m.omino) });
          // chi rientra (pagina ricaricata, telefono riacceso, partita ripresa) ha lo STESSO id: ritrova il suo posto
          // (anche sulla classifica finale: così alla "Nuova partita" c'è anche lui)
          if (p) { p.forse = false; if (p.via && H.fase !== "lobby") p.via = false; if (!p.omino) p.omino = avatarValido(m.omino); }
          bd();   // sempre: rimanda la foto a chi è entrato o rientrato…
          if (p && H.fase === "gioco") { mandaOmini(); mandaOpz(); segreti(id); }   // …e i suoi segreti (la domanda, le sue scelte)
          return;
        }
        if (H.fase === "lobby") { if (pById(id)) saletta(id, m, false); return; }
        var q = pById(id);
        if (H.fase !== "gioco" || !q || q.via) return;   // chi guarda soltanto non fa mosse
        mossa(id, m);
      }
    }, { ripresa: riprendo });   // con la partita ripresa gli amici NON tornano in saletta (leggono "🔁 … la partita riprende")
    if (!rete) return senzaRete(t);
    if (riprendo && rete.codice) H.codice = rete.codice;

    // ----- la foto per tutti: SEMPRE con gli id e con "fase"; MAI segreti -----
    // Durante la domanda: NIENTE testo della domanda, risposte, risposte date né palline (solo l'argomento, quante risposte
    // ci sono e CHI ha finito). Da "svela" in poi la domanda e la risposta giusta; le palline SOLO nella fase del loro muro.
    function vm() {
      var tempo = H.stato === "domanda" || H.stato === "svela" || H.stato === "perdenti" || H.stato === "vincitori" || H.stato === "punti" || H.stato === "ripresa";
      var v = { fase: H.fase, codice: H.codice, pronta: H.pronta, partita: H.partita, tiene: IO, rip: H.rip,
        nsq: H.nsq, rot: H.rot, nd: H.imp.nd, tempo: H.imp.tempo,
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, sq: p.sq, ruolo: p.ruolo, via: !!p.via, forse: !!p.forse, omino: H.fase === "gioco" ? undefined : (p.omino || null) }; }),
        guarda: H.guarda,
        prossimi: H.prossimi.map(function (x) { return { id: x.id, nome: x.nome }; }),   // (con gli id: chi aspetta sa di essere dentro)
        dopo: H.dopo.map(function (x) { return { id: x.id, nome: x.nome }; }),
        punti: H.punti.slice() };
      if (H.fase === "gioco") {
        v.stato = H.stato; v.k = H.k; v.tot = H.tot; v.ndop = H.ndop; v.dop = doppio(H.k) ? 1 : 0;
        // i millisecondi che mancano (non l'ora: gli orologi dei telefoni sono diversi) e quanto dura la fase. Nella MEMORIA l'ora
        if (tempo) { v.restaMs = Math.max(0, H.scadenza - Date.now()); v.durMs = H.durMs; }
        var c = domandaDi(H.doms[H.k - 1]);
        if (c) { v.arg = c.arg; v.nr = c.opz.length; }
        v.sqd = H.sqd;
        if (H.stato === "domanda") v.fatto = H.fatto.slice();
        if (H.riv && (H.stato === "svela" || H.stato === "perdenti" || H.stato === "vincitori" || H.stato === "punti")) v.riv = H.riv;
        if (H.stato === "perdenti") v.palle = (H.palle || []).filter(function (b) { return !okDi(b.s); });
        if (H.stato === "vincitori") { v.palle = (H.palle || []).filter(function (b) { return okDi(b.s); }); v.dl = deltaPerdenti(); }
        if (H.stato === "punti") v.delta = H.delta;
      }
      if (H.fase === "fine") v.classifica = H.classifica;
      return v;
    }
    function okDi(s) { var r = H.riv && H.riv.ris[s]; return !!(r && r.ok); }
    function deltaPerdenti() { return H.punti.map(function (_, s) { return okDi(s) ? 0 : ((H.delta || [])[s] || 0); }); }
    function doppio(k) { return k > H.tot - H.ndop; }
    // un messaggio per un telefono solo (la domanda, le sue scelte): inviaVeloce con "to", così non resta in stanza
    function privato(id, m) {
      if (id === IO) { riceviPriv(m); return; }
      m.to = id; rete.inviaVeloce(m);
    }
    // gli avatar (la foto della partita non li porta: pesano) a chi arriva, rientra o guarda; al massimo uno ogni secondo
    var tOmini = null, ultOmini = 0;
    function mandaOmini() {
      if (tOmini) return;
      var fai = function () {
        tOmini = null; ultOmini = Date.now(); if (spento()) return;
        var o = {}; H.players.concat(H.prossimi, H.dopo).forEach(function (p) { if (p.omino) o[p.id] = p.omino; });
        rete.inviaVeloce({ t: "omini", o: o }); riceviPriv({ t: "omini", o: o });
      };
      var aspetta = 1000 - (Date.now() - ultOmini);
      if (aspetta <= 0) fai(); else tOmini = setTimeout(fai, aspetta);
    }
    // le risposte possibili della domanda di adesso, a tutti (chi è giù, chi aspetta, chi guarda): NON la domanda e
    // NON quale è giusta (sono mescolate). Non restano in stanza: si rimandano a chi arriva o rientra
    function mandaOpz() {
      if (H.fase !== "gioco" || H.stato !== "domanda") return;
      var c = domandaDi(H.doms[H.k - 1]); if (!c) return;
      var m = { t: "opz", p: H.partita, q: H.k, r: H.rip, opz: c.opz };
      rete.inviaVeloce(m); riceviPriv(m);
    }
    // i segreti di un telefono: la domanda (solo a chi è nella stanza, o da solo) e le sue scelte (a chi ricarica)
    function segreti(id) {
      if (H.fase !== "gioco" || H.stato !== "domanda" || !H.sqd) return;
      var p = pById(id); if (!p) return;
      var d = H.sqd[p.sq]; if (!d) return;
      var c = domandaDi(H.doms[H.k - 1]); if (!c) return;
      var base = { p: H.partita, q: H.k, r: H.rip };
      if (d.su.indexOf(id) >= 0 || (d.solo && d.giu === id)) privato(id, Object.assign({ t: "dom", testo: c.testo, opz: c.opz }, base));
      var tue = {};
      if (Q.risp[id] != null) tue.a = Q.risp[id];
      if (d.giu === id) { tue.z = (Q.palle[p.sq] || []).slice(); tue.su = Q.su[p.sq] || null; tue.pronto = !!Q.pronto[p.sq]; }
      if (Object.keys(tue).length) privato(id, Object.assign({ t: "tue" }, base, tue));
    }
    // la partita da ricordare (se l'host ricarica, o se la porta avanti un amico): un oggetto SEMPLICE, senza timer né
    // nodi della pagina (H.to resta fuori), con gli id dei giocatori e le scadenze come ORE. Gli avatar restano fuori.
    // Le scelte della domanda di adesso (Q) non ci sono mai: la domanda a metà si rifà da capo
    function ricorda() {
      if (H.fase === "lobby") return t.ricorda(null);
      var s = {};
      Object.keys(H).forEach(function (k) { if (k !== "to" && k !== "prossimi" && k !== "dopo" && k !== "fatto") s[k] = H[k]; });
      s.players = H.players.map(function (p) { return { id: p.id, nome: p.nome, sq: p.sq, ruolo: p.ruolo, via: !!p.via }; });
      t.ricorda(s);
    }
    function bd() {
      if (spento()) return;
      H.players.forEach(function (p) { if (p.omino) OM[p.id] = p.omino; });
      H.prossimi.concat(H.dopo).forEach(function (p) { if (p.omino) OM[p.id] = p.omino; });
      var v = vm(); rete.invia({ t: "vm", vm: v }); ricorda(); disegna(t, v, cbHost);
    }

    // ----- la ripresa: qualche secondo di respiro (gli amici rientrano da soli), poi si va avanti -----
    function riprendi() {
      if (H.fase !== "gioco") return bd();   // la classifica finale: si resta lì (t.risultato l'aveva già dato chi teneva la partita)
      respiro(respiroMs);
    }
    var nRespiri = 0;   // quante volte si è già aspettato
    function respiro(ms) { ferma(); H.rip++; H.stato = "ripresa"; H.durMs = ms; H.scadenza = Date.now() + ms; bd(); dopo(ms, dopoRespiro); }
    // dopo il respiro si riparte se sono tornati tutti quelli che giocavano; se no si aspetta ancora un po' (al massimo
    // 4 volte), poi si riparte con chi c'è (chi arriva dopo rientra col suo posto) o, se non c'è nessuno, si chiude
    function dopoRespiro() {
      var tutti = attesi.every(function (id) { var p = pById(id); return !p || !p.via; });
      if (!(tutti && squadreVive() >= 2) && ++nRespiri < 4) return respiro(RESPIRO * 1000);
      if (squadreVive() < 2) return fine();   // non è tornato nessuno: si chiude coi punti che c'erano
      var come = H.dopoRip; H.dopoRip = null;
      if (come === "svela" && H.riv) return svela();
      if (come === "prossima") return prossima();
      H.k = Math.max(0, H.k - 1); domanda();   // la domanda a metà: da capo (nessun punto dato)
    }

    // ===================== LA SALETTA: le squadre =====================
    function aggiungi(x) {   // chi entra va nella squadra con meno persone (a pari la prima); se lì nessuno è giù, va giù
      var s = squadraPiuPiccola();
      if (membri(s).length >= 3 && H.nsq < SQ.length) s = H.nsq++;   // (tutte da 3: una squadra nuova)
      H.players.push({ id: x.id, nome: x.nome, omino: x.omino || null, sq: s, ruolo: membri(s).some(function (p) { return p.ruolo === "giu"; }) ? "su" : "giu" });
    }
    function squadraPiuPiccola() { var best = 0, bn = 99; for (var s = 0; s < H.nsq; s++) { var n = membri(s).length; if (n < bn) { bn = n; best = s; } } return best; }
    // in ogni squadra UN SOLO «giù» (se manca, va giù il primo)
    function sistemaGiu() {
      for (var s = 0; s < H.nsq; s++) {
        var m = membri(s), g = m.filter(function (p) { return p.ruolo === "giu"; });
        if (!g.length && m.length) m[0].ruolo = "giu";
        g.slice(1).forEach(function (p) { p.ruolo = "su"; });
      }
    }
    // quante squadre si possono fare coi presenti (ognuna da 2 o 3)
    function nsqValido(n, k) { return k >= 2 && k <= SQ.length && 2 * k <= n && n <= 3 * k; }
    function cambiaNsq(n) {
      if (n === H.nsq || n < 2 || n > SQ.length || !nsqValido(H.players.length, n)) return;
      var fuori = H.players.filter(function (p) { return p.sq >= n; });
      H.nsq = n;
      // chi è in una squadra che non c'è più va nelle squadre più piccole; nessun altro si sposta
      fuori.forEach(function (p) { p.sq = squadraPiuPiccola(); p.ruolo = "su"; });
      sistemaGiu();
    }
    function sposta(id) {   // l'host tocca un nome: nella squadra dopo
      var p = pById(id); if (!p) return;
      p.sq = (p.sq + 1) % H.nsq; p.ruolo = "su"; sistemaGiu();
      if (!membri(p.sq).some(function (x) { return x.ruolo === "giu"; })) p.ruolo = "giu";
    }
    function vaiIn(id, s) {
      var p = pById(id); s = intero(s); if (!p || s == null || s < 0 || s >= H.nsq || s === p.sq || membri(s).length >= 3) return;
      p.sq = s; p.ruolo = "su"; sistemaGiu();
    }
    function stoGiu(id) { var p = pById(id); if (!p) return; membri(p.sq).forEach(function (x) { x.ruolo = "su"; }); p.ruolo = "giu"; }
    function aCaso() {   // 🔀 squadre a caso (anche il numero di squadre, se quello di adesso non va bene coi presenti)
      var n = H.players.length;
      if (!nsqValido(n, H.nsq)) for (var k = 2; k <= SQ.length; k++) if (nsqValido(n, k)) { H.nsq = k; break; }
      mischia(H.players).forEach(function (p, i) { p.sq = i % H.nsq; p.ruolo = i < H.nsq ? "giu" : "su"; });
    }
    // le mosse della saletta: di tutti «vengo qui» e «sto giù io»; SOLO di chi tiene la partita (anche dal suo telefono
    // senza rete) sposta, numero di squadre, rotazione e squadre a caso
    function saletta(id, m, daMe) {
      if (m.t === "sq") vaiIn(id, m.s);
      else if (m.t === "giu") stoGiu(id);
      else if (!daMe) return;
      else if (m.t === "sposta") sposta(m.id);
      else if (m.t === "nsq") cambiaNsq(intero(m.n));
      else if (m.t === "rot") H.rot = !!m.on;
      else if (m.t === "mischia") aCaso();
      else return;
      bd();
    }
    function prontaSaletta() {
      if (H.players.length < MIN || H.nsq < 2) return false;
      for (var s = 0; s < H.nsq; s++) { var m = membri(s); if (m.length < 2 || m.length > 3 || !m.some(function (p) { return p.ruolo === "giu"; })) return false; }
      return true;
    }

    // ===================== LA PARTITA =====================
    function comincia() {
      if (H.fase !== "lobby" || !prontaSaletta()) return;
      var g = NUM.GIRI[H.imp.nd] || NUM.GIRI.normale;
      H.doms = scegliDomande(H.imp.arg, g[0] + g[1]);
      if (!H.doms.length) return;
      H.fase = "gioco"; H.partita++; H.classifica = null;
      H.tot = H.doms.length; H.ndop = Math.min(g[1], H.tot);
      H.k = 0; H.datiK = 0; H.riv = H.palle = H.delta = null;
      H.punti = []; H.ord = [];
      for (var s = 0; s < H.nsq; s++) {
        H.punti.push(0);
        // l'ordine della rotazione: parte da chi è giù in saletta, poi gli altri
        var m = membri(s); H.ord.push(m.filter(function (p) { return p.ruolo === "giu"; }).concat(m.filter(function (p) { return p.ruolo !== "giu"; })).map(function (p) { return p.id; }));
      }
      mandaOmini();
      domanda();
    }
    // all'inizio di una domanda chi aspettava entra: nella squadra con meno persone che ne ha meno di 3 (prende i suoi punti;
    // con la rotazione entra nel giro). Se sono tutte da 3 guarda ed entra alla prossima partita
    function postoPerChiArriva(gia) {
      var extra = {};
      function migliore() { var best = -1, bn = 3; for (var s = 0; s < H.nsq; s++) { var n = vivi(s).length + (extra[s] || 0); if (n < bn) { bn = n; best = s; } } return best; }
      // (quelli già in fila vanno nelle squadre più piccole prima di lui)
      for (var i = 0; i < (gia || 0); i++) { var b0 = migliore(); if (b0 < 0) return -1; extra[b0] = (extra[b0] || 0) + 1; }
      return migliore();
    }
    function entrano() {
      H.prossimi.forEach(function (x) {
        if (pById(x.id)) return;
        var s = -1, bn = 3;
        for (var k = 0; k < H.nsq; k++) { var n = vivi(k).length; if (n < bn) { bn = n; s = k; } }
        if (s < 0 || presenti().length >= MAX) { H.dopo.push(x); return; }
        H.players.push({ id: x.id, nome: x.nome, omino: x.omino, sq: s, ruolo: "su" });
        H.ord[s].push(x.id);
      });
      H.prossimi = [];
    }
    // chi sta giù in ogni squadra a questa domanda (e chi nella stanza). Rotazione spenta: quello della saletta; accesa: alla
    // domanda k il (k mod membri)-esimo dell'ordine. Se è via, il prossimo presente. Uno solo presente: fa tutto lui
    function ruoli() {
      var out = [];
      for (var s = 0; s < H.nsq; s++) {
        var L = (H.ord[s] || []).filter(function (id) { var p = pById(id); return p && p.sq === s; });
        var pres = L.filter(function (id) { return !pById(id).via; });
        if (!pres.length) { out.push(null); continue; }
        if (pres.length === 1) { out.push({ giu: pres[0], su: [], solo: 1 }); continue; }
        var i0 = 0;
        if (H.rot) i0 = (H.k - 1) % L.length;
        else { var g0 = L.filter(function (id) { return pById(id).ruolo === "giu"; })[0]; i0 = Math.max(0, L.indexOf(g0)); }
        var giu = null;
        for (var j = 0; j < L.length && !giu; j++) { var c = L[(i0 + j) % L.length]; if (!pById(c).via) giu = c; }
        out.push({ giu: giu, su: pres.filter(function (id) { return id !== giu; }), solo: 0 });
      }
      return out;
    }
    function domanda() {
      ferma();
      entrano();   // (chi aspettava gioca da questa domanda)
      if (squadreVive() < 2) return fine();
      H.k++;
      if (H.k > H.tot) return fine();
      // (il file delle domande può essere cambiato, per esempio sul telefono del vice: una domanda che non c'è più si cambia)
      if (!domandaDi(H.doms[H.k - 1])) { var nuove = scegliDomande(H.imp.arg, 1, H.doms.map(function (d) { return d.id; })); if (nuove.length) H.doms[H.k - 1] = nuove[0]; else return fine(); }
      segnaUscita(H.doms[H.k - 1].id);
      H.sqd = ruoli();
      Q = { k: H.k, risp: {}, palle: {}, su: {}, pronto: {} };
      H.sqd.forEach(function (d, s) { if (d && d.su.length) Q.su[s] = d.su[0]; });   // (di partenza si punta sul primo)
      H.fatto = []; H.riv = H.palle = H.delta = null;
      H.stato = "domanda"; H.durMs = H.imp.tempo * 1000; H.scadenza = Date.now() + H.durMs;
      // a che punto è la partita, per chi è nella Sala e non gioca ("🎮 Si gioca a Il Muro · Domanda 3 di 15")
      t.aCheSiamo("Domanda " + H.k + " di " + H.tot + (doppio(H.k) ? " · 🔥 doppia" : ""));
      bd();
      mandaOpz(); presenti().forEach(function (p) { segreti(p.id); });
      dopo(H.durMs + CHIUDE_DOPO, chiudi);
    }
    // le mosse della domanda (solo quelle di chi deve farle, solo per la domanda di adesso)
    function mossa(id, m) {
      if (H.stato !== "domanda" || m.q !== H.k || (m.r || 0) !== H.rip) return;
      var p = pById(id), s = p.sq, d = H.sqd && H.sqd[s]; if (!d) return;
      var c = domandaDi(H.doms[H.k - 1]); if (!c) return;
      if (m.t === "risp") {
        if (!(d.su.indexOf(id) >= 0 || (d.solo && d.giu === id)) || Q.risp[id] != null) return;   // una risposta sola, non si cambia
        var a = intero(m.s); if (a == null || a < 0 || a >= c.opz.length) return;
        Q.risp[id] = a;
      } else if (m.t === "palle" || m.t === "pronto") {
        if (d.giu !== id || Q.pronto[s]) return;
        if (m.z instanceof Array) Q.palle[s] = m.z.map(intero).filter(function (z) { return z != null && z >= 0 && z < NUM.NZ; }).slice(0, NUM.MAXP);
        if (m.su != null && d.su.indexOf(m.su) >= 0) Q.su[s] = m.su;
        if (m.t === "palle") return;   // (nella foto non cambia niente)
        Q.pronto[s] = true;
      } else return;
      segnaFatto(); bd(); controllaFatto();
    }
    // chi ha finito (nella foto solo CHI, mai cosa): nella stanza chi ha risposto, giù chi ha toccato «Pronto»
    function segnaFatto() {
      var f = [];
      (H.sqd || []).forEach(function (d, s) {
        if (!d) return;
        d.su.forEach(function (id) { if (Q.risp[id] != null) f.push(id); });
        if (Q.pronto[s] && (!d.solo || Q.risp[d.giu] != null)) f.push(d.giu);
      });
      H.fatto = f;
    }
    function controllaFatto() {
      if (H.stato !== "domanda") return;
      var tutti = (H.sqd || []).every(function (d, s) {
        if (!d) return true;
        var ok = d.su.every(function (id) { var p = pById(id); return !p || p.via || Q.risp[id] != null; });
        var pg = pById(d.giu), gOk = !pg || pg.via || (Q.pronto[s] && (!d.solo || Q.risp[d.giu] != null));
        return ok && gOk;
      });
      if (tutti) dopo(500, chiudi);   // tutti hanno finito: si svela prima (mezzo secondo per l'ultimo tocco)
    }
    // fine della domanda: le risposte (nelle squadre da 3 quella di chi giù ha scelto), le cadute (decise qui, a caso) e i punti
    // (calcolati qui ma DATI solo entrando in "punti": una ripresa a metà rivelazione non li dà due volte)
    function chiudi() {
      if (H.stato !== "domanda") return;
      var c = domandaDi(H.doms[H.k - 1]), vals = valori(doppio(H.k)), ris = [], palle = [], delta = [];
      for (var s = 0; s < H.nsq; s++) {
        var d = H.sqd[s]; delta.push(0);
        if (!d) { ris.push(null); continue; }
        var chi = d.solo ? d.giu : (d.su.indexOf(Q.su[s]) >= 0 ? Q.su[s] : d.su[0]), a = Q.risp[chi];
        if (a == null && !d.solo) {   // (chi si puntava è uscito senza rispondere: conta un compagno che ha risposto)
          var pc = pById(chi);
          if (!pc || pc.via) { var alt = d.su.filter(function (id) { return Q.risp[id] != null; })[0]; if (alt) { chi = alt; a = Q.risp[alt]; } }
        }
        var ok = a != null && a === c.giusta;
        ris.push({ a: a == null ? -1 : a, chi: chi, ok: ok ? 1 : 0 });
        (Q.palle[s] || []).forEach(function (z) { var x = cade(z); palle.push({ s: s, x: z, p: x.p, b: x.b }); delta[s] += (ok ? 1 : -1) * vals[x.b]; });
      }
      H.riv = { testo: c.testo, opz: c.opz, giusta: c.giusta, ris: ris };
      H.palle = palle; H.delta = delta; H.fatto = [];
      svela();
    }
    function fase(stato, ms, poi) { H.stato = stato; H.durMs = ms; H.scadenza = Date.now() + ms; bd(); dopo(ms, poi); }
    function svela() { fase("svela", NUM.SVELA, perdenti); }
    function perdenti() { fase("perdenti", durataMuro(H.palle.filter(function (b) { return !okDi(b.s); }).length), vincitori); }
    function vincitori() { fase("vincitori", durataMuro(H.palle.filter(function (b) { return okDi(b.s); }).length), punti); }
    function punti() {
      ferma();
      if (H.datiK !== H.k) {   // i punti della domanda: UNA volta sola
        H.datiK = H.k;
        (H.delta || []).forEach(function (d, s) { H.punti[s] = (H.punti[s] || 0) + d; if (!NUM.SOTTOZERO && H.punti[s] < 0) H.punti[s] = 0; });
      }
      // sui punteggi si va avanti col tasto dell'host o da soli (il conto lo fa t.contoAvanti sul suo tasto)
      var sec = H.k === H.tot - H.ndop && H.ndop > 0 ? NUM.PUNTI_ANNUNCIO : NUM.PUNTI;
      H.stato = "punti"; H.durMs = sec * 1000; H.scadenza = Date.now() + H.durMs; bd();
    }
    function prossima() { if (H.k >= H.tot) return fine(); domanda(); }
    function avanti() { if (H.fase === "gioco" && H.stato === "punti") prossima(); }   // (una volta sola: tocco e conto insieme non saltano una domanda)
    function fine() {
      ferma();
      var sq = [];
      for (var s = 0; s < H.nsq; s++) { var m = membri(s); if (m.length) sq.push({ s: s, punti: H.punti[s] || 0, ids: m.map(function (p) { return p.id; }) }); }
      sq.sort(function (a, b) { return b.punti - a.punti; });
      sq.forEach(function (r) { r.pos = 1 + sq.filter(function (x) { return x.punti > r.punti; }).length; });
      H.classifica = sq;
      H.fase = "fine"; H.stato = "fine"; bd();
      // torneo online e XP: i NOMI dei giocatori, ognuno col posto della sua squadra (pari merito = stesso posto)
      var cl = [];
      sq.forEach(function (r) { membri(r.s).forEach(function (p) { cl.push({ nome: p.nome, pos: r.pos }); }); });
      if (t.risultato) t.risultato(cl);
    }
    // "Nuova partita": stessa stanza, stessi amici (con le loro squadre), tutti tornano nella saletta (MAI chiudere e
    // riaprire la stanza). Chi aspettava entra ora. In saletta bd() fa t.ricorda(null)
    function nuova() {
      if (H.fase !== "fine") return;
      ferma(); H.fase = "lobby"; H.stato = "attesa"; H.classifica = null; H.k = 0; H.sqd = null; H.riv = H.palle = H.delta = null;
      H.players = presenti();
      H.prossimi.concat(H.dopo).forEach(function (x) { if (!pById(x.id) && H.players.length < MAX) aggiungi(x); });
      H.prossimi = []; H.dopo = [];
      for (var s = H.nsq - 1; s >= 2; s--) if (!membri(s).length) H.nsq--; else break;   // (le squadre vuote in fondo si tolgono)
      sistemaGiu(); H.punti = []; bd();
    }
    // la "↻ Rivincita" dei tasti di fine del core (e la "Nuova partita" fuori dalla Sala) usa questa: tutti nella saletta,
    // e se ci sono tutti la partita riparte da sola col 3-2-1 (lo fa il core)
    t.onRivincita = nuova;

    var cbHost = { sonoHost: true, myId: IO, onComincia: comincia, onNuova: nuova, onAvanti: avanti,
      // le mie mosse: senza rete, direttamente
      manda: function (m) { if (H.fase === "lobby") saletta(IO, m, true); else if (H.fase === "gioco") { var p = pById(IO); if (p && !p.via) mossa(IO, m); } },
      onEsci: function () {
        // uscito apposta: niente da riprendere (t.ricorda(null)), poi si chiude la stanza
        function via() { ferma(); t.ricorda(null); rete.chiudi(); t.esci(); }
        // (dalla saletta il core ha già chiesto "Chiudere la stanza per tutti?")
        if (H.fase === "gioco") return t.conferma("Chiudere la partita per tutti?", "Gli amici tornano alla home.", "Chiudi", via);   // un tocco sbagliato non chiude il gioco a tutti
        via();
      } };
    if (riprendo) riprendi(); else bd();
  }
  // le impostazioni scelte (anche quelle salvate in una ripresa): argomenti validi, quante domande, il tempo
  function impDi(im) {
    im = im || {};
    var tutti = tuttiArg(), arg = (im.arg instanceof Array ? im.arg : []).filter(function (a) { return tutti.indexOf(a) >= 0; });
    return { arg: arg.length ? arg : tutti, nd: NUM.GIRI[im.nd] ? im.nd : "normale", tempo: NUM.TEMPI.indexOf(+im.tempo) >= 0 ? +im.tempo : NUM.TEMPO };
  }

  // =========================================================
  //  OSPITE: disegna le foto dell'host e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, myId: null, nome: "", vm: null };
    var cb = { sonoHost: false, myId: null,
      manda: function (m) { if (S.rete) S.rete.invia(m); },   // le mie mosse (risposta, palline, pronto, squadra)
      onEsci: function () {
        function via() { if (S.rete) S.rete.chiudi(); t.esci(); }
        if (t.guarda) return t.conferma("Smetti di guardare?", null, "Esci", via);   // (chi guarda soltanto: non lascia un posto)
        if (S.vm && S.vm.fase === "gioco") return t.conferma("Uscire dalla partita?", null, "Esci", via);
        via();
      } };
    // col profilo (o già entrato prima) si entra da soli. Chi guarda soltanto (t.guarda) non vede mai la schermata del nome
    if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();
    function chiediNome() {
      var s = t.schermata({ icona: "🧱", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      attesa();
      S.rete = SGNet.entra(codice, {
        // il "join" lo ripete il collegamento finché il mio id non compare nella foto dell'host
        onAperto: function (id) { S.myId = id; cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome) }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;          // era per un altro telefono
          if (m.t === "vm") { S.vm = m.vm; disegna(t, m.vm, cb); }
          else if (m.t === "dom" || m.t === "opz" || m.t === "tue" || m.t === "omini") riceviPriv(m);
        },
        // la stanza è chiusa: { voluto: true } = l'host l'ha chiusa apposta; { sparito: true } = l'host non è tornato
        onChiuso: function (perche) { errore(t, perche && perche.sparito ? "L'host non è tornato: la stanza è chiusa." : "L'host ha chiuso la partita."); },
        // SOLO se il primo collegamento non è riuscito (15 secondi di tentativi): si riprova
        onErrore: function () { if (S.rete) S.rete.chiudi(); erroreRete(t, "Non riesco a entrare nella stanza.", collega); }
      });
      if (!S.rete) senzaRete(t);
    }
    function attesa() {
      var s = t.schermata({ icona: "🧱", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
    }
  }

  // =========================================================
  //  I SEGRETI CHE ARRIVANO A QUESTO TELEFONO (uguale per host e ospiti)
  // =========================================================
  var OM = {};       // gli avatar per id (dalla saletta e dal messaggio "omini")
  var PRIV = {};     // per domanda ("partita|domanda|ripresa"): { dom: {testo, opz}, opz: [...], tue: {...} }
  var LOC = null;    // le mie scelte nella domanda di adesso: { k, a, z: [zone], su, pronto }
  function chiaveQ(p, q, r) { return p + "|" + q + "|" + (r || 0); }
  function riceviPriv(m) {
    if (m.t === "omini") { Object.keys(m.o || {}).forEach(function (id) { var o = avatarValido(m.o[id]); if (o) OM[id] = o; }); if (UI && UI.pan && UI.pan.omini) UI.pan.omini(); return; }
    var k = chiaveQ(m.p, m.q, m.r), x = PRIV[k] || (PRIV[k] = {});
    if (m.t === "dom") { x.dom = { testo: String(m.testo || ""), opz: (m.opz || []).map(String) }; x.opz = x.dom.opz; }
    else if (m.t === "opz") x.opz = (m.opz || []).map(String);
    else if (m.t === "tue") {
      x.tue = { a: m.a, z: m.z, su: m.su, pronto: m.pronto };
      if (LOC && LOC.k === k) applicaTue(LOC, x.tue);
    }
    // (si tengono solo le ultime domande)
    var ks = Object.keys(PRIV); if (ks.length > 8) delete PRIV[ks[0]];
    if (UI && UI.pan && UI.pan.priv && UI.pan.kq === k) UI.pan.priv();
  }
  function applicaTue(L, tu) {
    if (tu.a != null && L.a == null) L.a = intero(tu.a);
    if (tu.z instanceof Array && !L.toccato) L.z = tu.z.map(intero).filter(function (z) { return z != null; }).slice(0, NUM.MAXP);
    if (tu.su && !L.toccato) L.su = tu.su;
    if (tu.pronto) L.pronto = true;
  }
  function loc(vm) {
    var k = chiaveQ(vm.partita, vm.k, vm.rip);
    if (!LOC || LOC.k !== k) { LOC = { k: k, a: null, z: [], su: null, pronto: false, toccato: false }; var x = PRIV[k]; if (x && x.tue) applicaTue(LOC, x.tue); }
    return LOC;
  }

  // =========================================================
  //  DISEGNO (uguale per host e ospiti): saletta, gioco, fine
  // =========================================================
  var UI = null;   // la schermata di gioco si costruisce UNA volta e poi si aggiorna a pezzi
  var FIN = null;  // la classifica finale già a schermo: le foto che arrivano dopo non la ridisegnano (niente lampeggio)
  function disegna(t, vm, cb) {
    (vm.players || []).forEach(function (p) { if (p.omino) OM[p.id] = p.omino; });
    if (vm.fase === "lobby") { if (UI) chiudiUI(UI); UI = FIN = null; return lobby(t, vm, cb); }
    if (vm.fase === "fine") {
      if (UI) chiudiUI(UI); UI = null;
      var kf = "fine|" + vm.partita;
      if (FIN && FIN.k === kf && FIN.t === t && document.body.contains(FIN.s)) return;
      FIN = { k: kf, t: t, s: finale(t, vm, cb) };
      return;
    }
    FIN = null;
    if (!UI || UI.t !== t || !document.body.contains(UI.s)) { if (UI) chiudiUI(UI); UI = creaSchermo(t, cb); }
    aggiorna(UI, vm, cb);
  }
  function trovaP(vm, id) { var l = vm.players || []; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function nomeDi(vm, id) { var p = trovaP(vm, id); return p ? p.nome : "?"; }

  // ---- le palline coi simboli (canvas: uguali su tutti i telefoni) ----
  var FORME = {
    stella: [[10, 2.2], [12.4, 7.3], [17.9, 8], [13.9, 11.9], [14.9, 17.4], [10, 14.7], [5.1, 17.4], [6.1, 11.9], [2.1, 8], [7.6, 7.3]],
    triangolo: [[10, 2.8], [17.4, 16.2], [2.6, 16.2]],
    quadrato: [[4.2, 4.2], [15.8, 4.2], [15.8, 15.8], [4.2, 15.8]],
    rombo: [[10, 1.8], [17.4, 10], [10, 18.2], [2.6, 10]]
  };
  var SPR = {};
  // la pallina della squadra s col diametro d (px): un canvas con lo spazio per l'ombra. { cv, S: lato in px, D: diametro }
  function sprite(s, d) {
    var dpr = Math.min(2, window.devicePixelRatio || 1), D = Math.max(8, Math.round(d * dpr)), k = s + "|" + D;
    if (SPR[k]) return SPR[k];
    var m = Math.round(D * 0.17), S = D + 2 * m, cv = document.createElement("canvas"); cv.width = cv.height = S;
    var c = cv.getContext("2d"), q = SQ[s] || SQ[0], cx = S / 2, cy = S / 2, r = D / 2, ring = Math.max(1.2 * dpr, D * 0.07);
    if (c) {
      c.save(); c.shadowColor = "rgba(0,0,0,.55)"; c.shadowBlur = D * 0.16; c.shadowOffsetY = D * 0.07;
      c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.fillStyle = "rgba(255,255,255,.94)"; c.fill(); c.restore();
      var gr = c.createRadialGradient(cx - r * 0.36, cy - r * 0.44, 0, cx, cy, r);
      gr.addColorStop(0, "#fff"); gr.addColorStop(0.42, q.col); gr.addColorStop(1, q.col);
      c.beginPath(); c.arc(cx, cy, r - ring, 0, 6.2832); c.fillStyle = gr; c.fill();
      var sz = 0.92 * (D - 2 * ring);
      c.save(); c.translate(cx - sz / 2, cy - sz / 2); c.scale(sz / 20, sz / 20);
      c.beginPath();
      if (q.sim === "cerchio") c.arc(10, 10, 6.4, 0, 6.2832);
      else FORME[q.sim].forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
      c.closePath();
      c.globalAlpha = 0.92; c.fillStyle = q.ink; c.fill(); c.globalAlpha = 1;
      c.lineJoin = "round"; c.lineWidth = 1.2; c.strokeStyle = q.ink; c.stroke();
      c.restore();
    }
    return (SPR[k] = { cv: cv, S: S / dpr, D: D / dpr });
  }
  var SRC = {};
  function pallaSrc(s) { if (SRC[s] == null) { try { SRC[s] = sprite(s, 40).cv.toDataURL(); } catch (e) { SRC[s] = ""; } } return SRC[s]; }
  // la pallina come immagine (saletta, punteggi, risposte): px = il diametro della pallina (l'immagine ha intorno l'ombra)
  function palla(t, s, px, cls) {
    var im = t.el("img", { class: "mu-pl" + (cls ? " " + cls : ""), alt: (SQ[s] || SQ[0]).nome, src: pallaSrc(s), draggable: "false" });
    var S = Math.round(px * 1.34); im.style.width = im.style.height = S + "px"; im.style.margin = Math.round(-px * 0.17) + "px";
    return im;
  }
  // l'avatar come immagine (busto)
  var AV = {};
  function srcAvatar(om, nome) {
    if (!window.SGOmino) return "";
    var cfg = om || SGOmino.casuale(nome || "?"), k = JSON.stringify(cfg);
    if (AV[k] == null) { try { AV[k] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(cfg, { busto: true })); } catch (e) { AV[k] = ""; } }
    return AV[k];
  }

  // ---- il muro su canvas (riusa il Plinko di js/games/prezzo-premi-b.js e l'aspetto della proposta A) ----
  function geo(W, H, o) {
    var N = nCase(), pad = 3, sw = (W - 2 * pad) / N, mini = !!o.mini, big = !!o.doppio;
    var bh = mini ? Math.max(16, Math.min(H * (big ? 0.2 : 0.16), big ? 34 : 28)) : Math.max(28, Math.min(H * (big ? 0.11 : 0.085), big ? 72 : 56));
    var d = Math.max(10, sw * 0.72), top = pad + (mini ? 3 : 16), pool = mini ? 3 : d * 1.9, boxTop = H - pad - bh;
    var rowH = Math.max(4, (boxTop - pool - top) / NUM.FILE);
    return { W: W, H: H, N: N, sw: sw, bh: bh, d: d, pad: pad, top: top, rowH: rowH, boxTop: boxTop, mini: mini, big: big,
      pr: Math.max(mini ? 1.1 : 1.8, Math.min(sw * 0.075, rowH * 0.22, 3.6)),
      X: function (q) { return pad + (q / 2 + 0.5) * sw; }, Y: function (r) { return top + (r + 0.5) * rowH; } };
  }
  function colCasa(tipo, v, min, max) {
    var t0 = max > min ? Math.log(v / min) / Math.log(max / min) : 1; if (!(t0 >= 0)) t0 = 0; t0 = Math.min(1, t0);
    function mix(a, b) { return a.map(function (x, i) { return Math.round(x + (b[i] - x) * t0); }); }
    var A, B, T;
    if (tipo === "perdenti") { A = [38, 48, 92]; B = [118, 86, 235]; T = t0 > 0.35 ? "#ffffff" : "#d6e0ff"; }
    else if (tipo === "vincitori") { A = [112, 78, 14]; B = [255, 200, 70]; T = t0 > 0.6 ? "#2b1d00" : "#fff3d0"; }
    else { A = [52, 46, 100]; B = [128, 100, 220]; T = "#f4f5fb"; }
    var m = mix(A, B), m2 = mix(A.map(function (x) { return x * 0.7; }), B.map(function (x) { return x * 0.78; }));
    return { a: "rgb(" + m.join(",") + ")", b: "rgb(" + m2.join(",") + ")", t: T };
  }
  var FONT = "'SG Testo','Plus Jakarta Sans',system-ui,sans-serif";
  function disegnaMuro(cv, W, H, o) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + "px"; cv.style.height = H + "px";
    var c = cv.getContext("2d"); if (!c) return null;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var g = geo(W, H, o), PERD = o.tipo === "perdenti", VINC = o.tipo === "vincitori", i, k, r, q, x, y;
    var gr = c.createLinearGradient(0, 0, 0, H);
    if (PERD) { gr.addColorStop(0, "#161d3a"); gr.addColorStop(1, "#070914"); }
    else if (VINC) { gr.addColorStop(0, "#26203a"); gr.addColorStop(1, "#0d0b18"); }
    else { gr.addColorStop(0, "#1b1f3e"); gr.addColorStop(1, "#0c0f1e"); }
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    var rg = c.createRadialGradient(W / 2, H * 0.7, 4, W / 2, H * 0.7, W * 0.8), lc = PERD ? "90,130,255" : VINC ? "255,194,71" : "150,120,255";
    rg.addColorStop(0, "rgba(" + lc + "," + (VINC ? 0.26 : 0.2) + ")"); rg.addColorStop(1, "rgba(" + lc + ",0)");
    c.fillStyle = rg; c.fillRect(0, 0, W, H);
    if (!g.mini) {   // qualche granello di luce (sempre uguale)
      var sd = PERD ? 11 : 12, R = function () { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      for (i = 0; i < 26; i++) { c.fillStyle = PERD ? "rgba(170,200,255," + (0.1 + R() * 0.25) + ")" : "rgba(255,225,150," + (0.1 + R() * 0.3) + ")"; c.beginPath(); c.arc(R() * W, R() * H * 0.85, 0.6 + R() * 1.1, 0, 6.3); c.fill(); }
    }
    // le righe tra le caselle (dove le palline si fermano)
    c.strokeStyle = PERD ? "rgba(140,170,255,.14)" : VINC ? "rgba(255,210,110,.16)" : "rgba(180,170,255,.14)"; c.lineWidth = 1;
    if (!g.mini) for (k = 1; k < g.N; k++) { x = g.pad + k * g.sw; c.beginPath(); c.moveTo(x, g.boxTop - g.d * 1.9); c.lineTo(x, g.boxTop); c.stroke(); }
    // i chiodini
    var pegC = PERD ? "#cfe0ff" : VINC ? "#fff1c9" : "#dcdcff", pegG = PERD ? "rgba(130,170,255,.28)" : VINC ? "rgba(255,200,90,.30)" : "rgba(170,160,255,.22)";
    for (r = 0; r < NUM.FILE; r++) for (q = r % 2; q <= 2 * (g.N - 1); q += 2) {
      x = g.X(q); y = g.Y(r);
      if (!g.mini) { c.beginPath(); c.arc(x, y, g.pr + 2, 0, 6.3); c.fillStyle = pegG; c.fill(); }
      c.beginPath(); c.arc(x, y, g.pr, 0, 6.3); c.fillStyle = pegC; c.fill();
    }
    // le frecce delle zone (da dove cadono)
    if (!g.mini) for (k = 0; k < NUM.NZ; k++) {
      x = g.X(posZona(k)); var zw = Math.min(g.sw * 0.34, 7), zy = g.pad + 2;
      c.fillStyle = PERD ? "rgba(160,190,255,.55)" : "rgba(255,214,102,.7)";
      c.beginPath(); c.moveTo(x - zw, zy); c.lineTo(x + zw, zy); c.lineTo(x, zy + zw * 1.5); c.closePath(); c.fill();
    }
    // le caselle coi valori (senza segno: il segno lo dice il muro, e i «+250» / «−250» che salgono)
    var vals = valori(o.doppio), mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
    // TUTTI i numeri della stessa altezza (prima «1.000» si rimpiccioliva e sembrava valere meno di «500»): una misura sola per
    // il muro, e il numero più largo si stringe un po' di lato (al massimo fino al 78%); solo se non basta cala la misura per tutti
    var fs = Math.min(g.sw * 0.42, g.bh * (g.big ? 0.46 : 0.42), g.mini ? 13 : (g.big ? 20 : 17)), largo = g.sw - 4, STRETTA = 0.78;
    var txts = vals.map(fmtN), wMax = function () { c.font = "800 " + fs + "px " + FONT; return Math.max.apply(null, txts.map(function (x) { return c.measureText(x).width; })); };
    while (wMax() * STRETTA > largo && fs > 7) fs -= 0.5;
    c.textAlign = "center"; c.textBaseline = "middle";
    for (k = 0; k < g.N; k++) {
      var v = vals[k], cs = colCasa(o.tipo, v, mn, mx), x0 = g.pad + k * g.sw;
      var bg = c.createLinearGradient(0, g.boxTop, 0, g.boxTop + g.bh);
      bg.addColorStop(0, cs.a); bg.addColorStop(1, cs.b);
      c.fillStyle = bg; c.fillRect(x0 + 1, g.boxTop, g.sw - 2, g.bh);
      c.fillStyle = "rgba(255,255,255,.28)"; c.fillRect(x0 + 1, g.boxTop, g.sw - 2, 2);
      var w = c.measureText(txts[k]).width, sx = w > largo ? largo / w : 1;
      c.fillStyle = cs.t;
      c.save(); c.translate(x0 + g.sw / 2, g.boxTop + g.bh / 2 + 1); c.scale(sx, 1); c.fillText(txts[k], 0, 0); c.restore();
    }
    if (g.big) {   // 🔥 l'ultimo giro: la cornice accesa sulle caselle grandi
      c.lineWidth = 2; c.strokeStyle = PERD ? "rgba(160,190,255,.8)" : "rgba(255,214,102,.9)";
      c.strokeRect(g.pad + 1, g.boxTop - 1, W - 2 * g.pad - 2, g.bh + 1);
    }
    return g;
  }
  // la caduta di una pallina, in unità del muro (mezze caselle e file): si trasforma in pixel a ogni fotogramma (geo)
  // come i keyframes di cadi() del Plinko: il primo chiodino, poi a ogni fila il saltello e la discesa, poi la casella
  function chiavi(z, s, nn) {
    var l = percorso(z, s), F = l.length - 1, P = NUM.PASSO, kf = [], t = 0;
    kf.push({ q: l[0], y: "via", t: 0, e: "in" });
    t += P.primo; kf.push({ q: l[0], y: "piolo", r: 0, t: t, e: "out", piolo: 1 });
    for (var r = 0; r < F; r++) {
      var sp = Math.max(0.6, 1 - P.acc * r);   // (un po' più veloce a ogni fila)
      t += P.su * sp; kf.push({ q: (l[r] + l[r + 1]) / 2, y: "salto", r: r, t: t, e: "in" });
      if (r < F - 1) { t += P.giu * sp; kf.push({ q: l[r + 1], y: "piolo", r: r + 1, t: t, e: "out", piolo: 1 }); }
    }
    t += P.fondo; kf.push({ q: l[F], y: "fondo", n: nn || 0, t: t, e: "lin" });
    return kf;
  }
  function puntoDi(g, k) {
    var x = g.X(k.q), y;
    if (k.y === "via") y = g.pad + g.d * 0.5;
    else if (k.y === "piolo") y = g.Y(k.r) - g.pr - g.d * 0.5;
    else if (k.y === "salto") y = g.Y(k.r) - g.pr - g.d * 0.5 - g.rowH * 0.3;
    else {   // nella casella: una sull'altra, un po' a destra e a sinistra
      var n = k.n || 0;
      y = g.boxTop - g.d * 0.5 - 1 - n * g.d * 0.42;
      if (n) x += (n % 2 ? 1 : -1) * Math.min(g.sw * 0.2, g.d * 0.3);
    }
    return { x: x, y: y };
  }
  function posPalla(g, P, T) {
    var tt = T - P.start, kf = P.kf, i;
    if (tt <= 0) return puntoDi(g, kf[0]);
    for (i = 1; i < kf.length; i++) if (tt < kf[i].t) break;
    if (i >= kf.length) return puntoDi(g, kf[kf.length - 1]);
    var a = kf[i - 1], b = kf[i], u = (tt - a.t) / (b.t - a.t);
    u = a.e === "in" ? u * u : a.e === "out" ? 1 - (1 - u) * (1 - u) : u;
    var pa = puntoDi(g, a), pb = puntoDi(g, b);
    return { x: pa.x + (pb.x - pa.x) * u, y: pa.y + (pb.y - pa.y) * u };
  }
  // il muro della rivelazione: due strati (il muro disegnato UNA volta; le palline su un secondo canvas ridisegnato a ogni
  // fotogramma). o = { tipo, doppio, palle: [{ s, x, p, b }], t0: quando è cominciata la fase (ora di questo telefono), atterra(P, zitto) }
  function cascata(box, o) {
    var wrap = document.createElement("div"), cv1 = document.createElement("canvas"), cv2 = document.createElement("canvas"), fx = document.createElement("div");
    wrap.className = "mu-muro-wrap"; cv1.className = cv2.className = "mu-cv"; fx.className = "mu-fx";
    wrap.appendChild(cv1); wrap.appendChild(cv2); wrap.appendChild(fx); box.appendChild(wrap);
    var C = { g: null, raf: 0, palle: [], lampi: [], fermo: false, ro: null, tm: null };
    // l'ordine di partenza: la prima pallina di ogni squadra, poi le seconde… (partono insieme, con un piccolo sfasamento)
    var conta = {}, perCasa = {}, sf = sfasa(o.palle.length);
    o.palle.map(function (b) { var j = conta[b.s] = (conta[b.s] || 0) + 1; return { b: b, j: j }; })
      .sort(function (a, b) { return a.j - b.j || a.b.s - b.b.s; })
      .forEach(function (x, i) {
        var b = x.b, nn = perCasa[b.b] = (perCasa[b.b] == null ? 0 : perCasa[b.b] + 1);
        var kf = chiavi(b.x, b.p, nn);
        C.palle.push({ s: b.s, b: b.b, kf: kf, start: NUM.INTRO + i * sf, fine: NUM.INTRO + i * sf + kf[kf.length - 1].t, giu: false, pioli: 0 });
      });
    function T() { return Date.now() - o.t0; }
    function misura() {
      if (!wrap.isConnected) return false;
      var W = Math.floor(box.clientWidth), H = Math.floor(box.clientHeight);
      if (W < 60 || H < 80) return false;
      if (C.g && C.g.W === W && C.g.H === H) return true;
      wrap.style.width = W + "px"; wrap.style.height = H + "px";
      C.g = disegnaMuro(cv1, W, H, o);
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      cv2.width = Math.round(W * dpr); cv2.height = Math.round(H * dpr); cv2.style.width = W + "px"; cv2.style.height = H + "px";
      // i lampi delle caselle
      while (fx.firstChild) fx.removeChild(fx.firstChild);
      C.lampi = NUM.CASE.map(function (v, k) {
        var f = document.createElement("div"); f.className = "mu-lampo " + o.tipo;
        f.style.left = (C.g.pad + k * C.g.sw) + "px"; f.style.width = C.g.sw + "px"; f.style.top = (C.g.boxTop - C.g.bh * 1.2) + "px"; f.style.height = (C.g.bh * 2.2) + "px";
        fx.appendChild(f); return f;
      });
      disegnaPalle();
      return true;
    }
    function disegnaPalle() {
      var g = C.g; if (!g) return;
      var c = cv2.getContext("2d"); if (!c) return;
      var dpr = Math.min(2, window.devicePixelRatio || 1), tt = T();
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, g.W, g.H);
      C.palle.forEach(function (P) {
        var p = posPalla(g, P, P.giu ? Math.max(tt, P.fine) : tt), sp = sprite(P.s, g.d);
        c.drawImage(sp.cv, p.x - sp.S / 2, p.y - sp.S / 2, sp.S, sp.S);
      });
    }
    function atterra(P, zitto) {
      P.giu = true;
      if (!zitto && C.g && wrap.isConnected) {
        var f = C.lampi[P.b]; if (f) { f.classList.remove("on"); void f.offsetWidth; f.classList.add("on"); }
        var v = valori(o.doppio)[P.b], pp = document.createElement("div"), fermo = puntoDi(C.g, P.kf[P.kf.length - 1]);
        pp.className = "mu-piu " + o.tipo; pp.textContent = (o.tipo === "perdenti" ? "−" : "+") + fmtN(v);
        // la scritta parte appena SOPRA la pallina ferma (non le passa davanti) e sale
        pp.style.left = C.g.X(2 * P.b) + "px"; pp.style.top = (fermo.y - C.g.d * 0.5 - 2) + "px"; pp.style.color = (SQ[P.s] || SQ[0]).tx;
        fx.appendChild(pp); setTimeout(function () { if (pp.parentNode) pp.parentNode.removeChild(pp); }, 1400);
      }
      if (o.atterra) o.atterra(P, zitto);
    }
    function frame() {
      C.raf = 0;
      if (C.fermo || !wrap.isConnected) return ferma();
      if (!C.g && !misura()) { C.raf = requestAnimationFrame(frame); return; }
      var tt = T(), tutte = true;
      C.palle.forEach(function (P) {
        if (P.giu) return;
        // i chiodini toccati: un tic (al massimo uno ogni 45 ms)
        var np = 0; for (var i = 0; i < P.kf.length; i++) if (P.kf[i].piolo && tt - P.start >= P.kf[i].t) np++;
        if (np > P.pioli) { P.pioli = np; SUONO.tic(); }
        if (tt >= P.fine) atterra(P, tt - P.fine > 500); else tutte = false;
      });
      disegnaPalle();
      if (!tutte) C.raf = requestAnimationFrame(frame);
    }
    // tutte subito al loro posto (pagina nascosta, «riduci movimento», o fase già passata per chi arriva tardi)
    function subito() { C.palle.forEach(function (P) { if (!P.giu) atterra(P, true); }); disegnaPalle(); }
    function ferma() { C.fermo = true; if (C.raf) cancelAnimationFrame(C.raf); C.raf = 0; if (C.ro) try { C.ro.disconnect(); } catch (e) {} clearInterval(C.tm); document.removeEventListener("visibilitychange", vis); }
    function vis() { if (document.hidden) subito(); }
    document.addEventListener("visibilitychange", vis);
    // quello che era già caduto quando la foto è arrivata (pagina ricaricata, rete lenta): al suo posto, in silenzio
    C.palle.forEach(function (P) {
      var tt = T();
      if (tt >= P.fine) { P.giu = true; P.pioli = 99; if (o.atterra) o.atterra(P, true); }
      else P.pioli = P.kf.filter(function (k) { return k.piolo && tt - P.start >= k.t; }).length;
    });
    if (document.hidden || riduci()) { misura(); subito(); }
    else C.raf = requestAnimationFrame(frame);
    // si rimisura se cambia lo spazio (anche senza ResizeObserver)
    if (window.ResizeObserver) try { C.ro = new ResizeObserver(function () { if (!wrap.isConnected) return ferma(); if (misura()) disegnaPalle(); }); C.ro.observe(box); } catch (e) {}
    C.tm = setInterval(function () { if (!wrap.isConnected) return ferma(); if (misura() && !C.raf) disegnaPalle(); }, 600);
    setTimeout(function () { if (misura() && !C.raf) disegnaPalle(); }, 0);
    return { ferma: ferma, subito: subito };
  }
  // il muro piccolo di chi sta giù (solo da guardare: le zone sono i tasti sopra). Restituisce { g }; si ridisegna se cambia misura
  function muroPiccolo(box, doppio, dopo) {
    var cv = document.createElement("canvas"); cv.className = "mu-mini-cv"; box.appendChild(cv);
    var M = { g: null };
    function misura() {
      if (!cv.isConnected) return;
      var W = Math.floor(box.clientWidth), H = Math.floor(box.clientHeight);
      if (W < 60 || H < 40) return;
      if (M.g && M.g.W === W && M.g.H === H) return;
      M.g = disegnaMuro(cv, W, H, { tipo: "mini", mini: true, doppio: doppio });
      if (dopo) dopo(M.g);
    }
    M.misura = misura;
    if (window.ResizeObserver) try { var ro = new ResizeObserver(function () { if (!cv.isConnected) { ro.disconnect(); return; } misura(); }); ro.observe(box); } catch (e) {}
    var tm = setInterval(function () { if (!cv.isConnected) { clearInterval(tm); return; } misura(); }, 700);
    setTimeout(misura, 0);
    return M;
  }

  // ---- i suoni, creati al momento (niente file): tic, rullo di tamburi, «tlac», ta-dà e trombone. Mai con l'app in secondo piano ----
  var SUONO = (function () {
    var ultTic = 0, RUM = null;
    function ac() { if (document.hidden) return null; try { return SG.audioCtx && SG.audioCtx(); } catch (e) { return null; } }
    function nota(c, f, t, dur, tipo, vol, f2) {
      var o = c.createOscillator(), g = c.createGain(); o.type = tipo || "sine"; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
    }
    function rumore(c) {
      if (RUM && RUM.sampleRate === c.sampleRate) return RUM;
      var n = Math.floor(c.sampleRate * 0.4), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      return (RUM = b);
    }
    function colpo(c, t, vol, fr, dur) {
      var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = rumore(c); f.type = "bandpass"; f.frequency.value = fr; f.Q.value = 0.9;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + dur + 0.02);
    }
    return {
      tic: function () { var o = Date.now(); if (o - ultTic < 45) return; ultTic = o; var c = ac(); if (!c) return; try { nota(c, 2300 + Math.random() * 500, c.currentTime, 0.035, "triangle", 0.03); } catch (e) {} },
      tlac: function () { var c = ac(); if (!c) return; try { var t = c.currentTime; nota(c, 180, t, 0.12, "sine", 0.2, 70); colpo(c, t, 0.1, 1800, 0.06); } catch (e) {} },
      rullo: function (ms) { var c = ac(); if (!c) return; try { var t = c.currentTime, n = Math.max(4, Math.floor(ms / 55)); for (var i = 0; i < n; i++) colpo(c, t + i * 0.055, 0.04 + 0.1 * i / n, 260 + 160 * Math.random(), 0.05); colpo(c, t + n * 0.055, 0.28, 180, 0.4); } catch (e) {} },
      tada: function () { var c = ac(); if (!c) return; try { var t = c.currentTime; [523, 659, 784].forEach(function (f) { nota(c, f, t, 0.12, "triangle", 0.07); }); [523, 659, 784, 1047].forEach(function (f) { nota(c, f, t + 0.16, 0.55, "triangle", 0.07); }); } catch (e) {} },
      trombone: function () { var c = ac(); if (!c) return; try { var t = c.currentTime; [[392, 370], [370, 349], [349, 330], [330, 262]].forEach(function (x, i) { nota(c, x[0], t + i * 0.32, i === 3 ? 0.7 : 0.28, "sawtooth", 0.045, x[1]); }); } catch (e) {} }
    };
  })();

  // ===================== LA SALETTA =====================
  function nsqValidoVm(n, k) { return k >= 2 && k <= SQ.length && 2 * k <= n && n <= 3 * k; }
  function prontaVm(vm) {
    if (vm.players.length < MIN || vm.nsq < 2) return false;
    for (var s = 0; s < vm.nsq; s++) {
      var m = vm.players.filter(function (p) { return p.sq === s; });
      if (m.length < 2 || m.length > 3 || !m.some(function (p) { return p.ruolo === "giu"; })) return false;
    }
    return true;
  }
  // cosa manca per cominciare (una frase sola: la saletta in cima ne mostra solo una), e come si sistema: chi tiene la
  // partita tocca un nome per spostarlo; gli altri vedono «Vengo qui» sulla squadra che ha bisogno
  function notaVm(vm, io, host) {
    var n = vm.players.length;
    if (n < MIN) return "Servono almeno 4 giocatori: 2 squadre da 2.";
    for (var s = 0; s < vm.nsq; s++) {
      var m = vm.players.filter(function (p) { return p.sq === s; }).length;
      var come = host ? ": tocca un nome per spostarlo" : io && io.sq !== s && m < 2 ? ": per andarci tocca «Vengo qui»" : "";
      if (m < 2) return "La squadra " + SQ[s].nome + " ha bisogno di " + (m ? "un altro giocatore" : "2 giocatori") + come + ".";
      if (m > 3) return "La squadra " + SQ[s].nome + " ha troppi giocatori (al massimo 3)" + (host ? ": tocca un nome per spostarlo" : "") + ".";
    }
    return "Ogni squadra ha bisogno di qualcuno giù.";
  }
  function lobby(t, vm, cb) {
    stile();
    var el = t.el, io = trovaP(vm, cb.myId), box = el("div", { class: "mu-squadre" });
    var guardano = vm.guarda || [], guardo = guardano.some(function (p) { return p.id === cb.myId; });
    for (var s = 0; s < vm.nsq; s++) (function (s) {
      var mem = vm.players.filter(function (p) { return p.sq === s; });
      mem.sort(function (a, b) { return (b.ruolo === "giu") - (a.ruolo === "giu"); });   // chi è giù per primo
      var mia = !!io && io.sq === s, nomi = el("span", { class: "mu-membri" });
      mem.forEach(function (p) {
        var tx = (p.ruolo === "giu" ? "⬇️ " : "🚪 ") + p.nome + (p.id === cb.myId ? " (tu)" : "");
        // l'host tocca un nome per spostarlo nella squadra dopo
        var n = cb.sonoHost ? el("button", { class: "mu-membro b" + (p.id === cb.myId ? " tu" : ""), type: "button", title: "Sposta nella squadra dopo", text: tx, onclick: function () { cb.manda({ t: "sposta", id: p.id }); } })
          : el("span", { class: "mu-membro" + (p.id === cb.myId ? " tu" : ""), text: tx });
        nomi.appendChild(n);
      });
      if (!mem.length) nomi.appendChild(el("span", { class: "mu-vuota", text: "Nessuno: servono 2" }));
      var tasto = null;
      if (io && !mia && mem.length < 3) tasto = el("button", { class: "mu-sq-b", type: "button", text: "Vengo qui", onclick: function () { cb.manda({ t: "sq", s: s }); } });
      else if (io && mia && io.ruolo !== "giu") tasto = el("button", { class: "mu-sq-b", type: "button", text: "⬇️ Sto giù io", onclick: function () { cb.manda({ t: "giu" }); } });
      var riga = el("div", { class: "mu-sq-riga" + (mia ? " mia" : "") }, [ palla(t, s, 20), el("b", { class: "mu-sq-nome", text: SQ[s].nome }), nomi, tasto ]);
      riga.style.setProperty("--c", SQ[s].col); riga.style.setProperty("--ct", SQ[s].tx);
      box.appendChild(riga);
    })(s);
    var n = vm.players.length;
    if (cb.sonoHost) {
      var nums = el("span", { class: "mu-nsq" });
      for (var k = 2; k <= SQ.length; k++) (function (k) {
        var ok = k === vm.nsq || nsqValidoVm(n, k);
        nums.appendChild(el("button", { class: "mu-n" + (k === vm.nsq ? " on" : ""), type: "button", text: String(k), disabled: ok ? null : "disabled", onclick: function () { cb.manda({ t: "nsq", n: k }); } }));
      })(k);
      box.appendChild(el("div", { class: "mu-sq-tasti" }, [ el("span", { class: "mu-et", text: "Squadre" }), nums,
        el("button", { class: "mu-sq-b", type: "button", text: "🔀 A caso", onclick: function () { cb.manda({ t: "mischia" }); } }) ]));
      var rot = el("button", { class: "mu-rot" + (vm.rot ? " on" : ""), type: "button", "aria-pressed": vm.rot ? "true" : "false", onclick: function () { cb.manda({ t: "rot", on: !vm.rot }); } },
        [ el("span", { class: "mu-rot-i" }), el("span", { text: "🔄 A rotazione" }) ]);
      box.appendChild(el("div", { class: "mu-rot-riga" }, [ rot, el("span", { class: "mu-rot-tx", text: vm.rot ? "I ruoli si scambiano a ogni domanda" : "Chi è giù resta giù" }) ]));
    } else box.appendChild(el("div", { class: "mu-rot-riga" }, [ el("span", { class: "mu-rot-tx", text: vm.rot ? "🔄 A rotazione: i ruoli si scambiano a ogni domanda" : "🔒 Ruoli fissi: chi è giù resta giù" }) ]));
    if (guardano.length) box.appendChild(el("p", { class: "mu-guardano", text: "👀 Guardano: " + guardano.map(function (p) { return p.id === cb.myId ? "tu" : p.nome; }).join(", ") }));
    var ok = prontaVm(vm), nota = ok ? "" : notaVm(vm, io, cb.sonoHost);
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN,
      vuoti: Math.max(0, MIN - vm.players.length),   // solo i posti che mancano per cominciare
      // (la corona a chi tiene la partita: dopo un subentro non è più il primo della lista)
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || OM[p.id] || null, host: vm.tiene ? p.id === vm.tiene : i === 0, tu: p.id === cb.myId }; }),
      extra: [ box ], puoComincia: ok, nota: nota || null, testoComincia: "Comincia ▶",
      // (chi guarda soltanto col link: il core non lo mette tra i giocatori; alla prossima saletta entra da solo)
      spettatore: t.guarda ? "👀 Guardi soltanto" : guardo ? "👀 Questa volta guardi" : !cb.sonoHost && !io && vm.players.length >= MAX ? "👀 La stanza è piena: guardi la partita" : false,
      attesa: ok ? "Scegli la squadra e aspetta che l'host cominci!" : nota, onComincia: cb.onComincia, onEsci: cb.onEsci });
  }

  // ===================== IL GIOCO: una schermata, un pannello per fase =====================
  function creaSchermo(t, cb) {
    stile();
    var s = t.schermata({}); s.classList.add("mu-piena");   // schermo intero: niente titolo, niente scorrimento
    var el = t.el;
    var ui = { t: t, s: s, cb: cb, pKey: null, pan: null, tKey: null, tFine: 0, timers: [], festa: {} };
    ui.info = el("div", { class: "mu-info" });
    ui.badge = el("div", { class: "mu-badge", hidden: "hidden", text: "🔥 ×2" });
    ui.mia = el("span", { class: "mu-mia" });
    ui.tempo = el("div", { class: "mu-tempo" }, [ ui.tbar = el("i") ]);
    ui.corpo = el("div", { class: "mu-corpo" });
    var esci = el("button", { class: "mu-esci", "aria-label": "Esci", text: "‹", onclick: cb.onEsci });
    // chi guarda soltanto (t.guarda) ha in basso la targhetta del core ("👀 Guardi · 😂 · ✕"): le si lascia il posto
    ui.targa = !!t.guarda && !t.eliminazione;
    ui.scena = el("div", { class: "mu-scena" + (ui.targa ? " mu-con-targa" : "") }, [ el("div", { class: "mu-barra" }, [ esci, ui.info, ui.badge, ui.mia ]), ui.tempo, ui.corpo ]);
    s._contenuto.appendChild(ui.scena);
    t.mostra(s);
    return ui;
  }
  function chiudiUI(ui) { fermaPannello(ui); }
  function fermaPannello(ui) {
    ui.timers.forEach(function (x) { clearTimeout(x); clearInterval(x); }); ui.timers = [];
    if (ui.pan && ui.pan.ferma) try { ui.pan.ferma(); } catch (e) {}
    ui.pan = null;
  }
  function dopoUI(ui, ms, fn) { var x = setTimeout(function () { if (document.body.contains(ui.s)) fn(); }, Math.max(0, ms)); ui.timers.push(x); return x; }
  // il mio posto in questa domanda: su (nella stanza), giu, solo (da solo), guarda, aspetta (entro alla prossima), fuori (ero via)
  function ruoloDi(vm, id) {
    var p = trovaP(vm, id);
    if (!p) return { r: (vm.prossimi || []).some(function (x) { return x.id === id; }) ? "aspetta" : (vm.dopo || []).some(function (x) { return x.id === id; }) ? "dopo" : "guarda", s: null };
    if (p.via) return { r: "fuori", s: p.sq };
    var d = (vm.sqd || [])[p.sq];
    if (!d) return { r: "fuori", s: p.sq };
    if (d.solo && d.giu === id) return { r: "solo", s: p.sq, d: d };
    if (d.giu === id) return { r: "giu", s: p.sq, d: d };
    if (d.su.indexOf(id) >= 0) return { r: "su", s: p.sq, d: d };
    return { r: "fuori", s: p.sq };
  }
  function aggiorna(ui, vm, cb) {
    var t = ui.t, io = trovaP(vm, cb.myId), R = ruoloDi(vm, cb.myId);
    ui.vm = vm;
    // la fine di questa fase sul mio orologio (si tiene la stima più corta: una foto vecchia crede che manchi di più)
    var key = vm.partita + "|" + vm.k + "|" + vm.stato + "|" + (vm.rip || 0);
    if (vm.restaMs != null) {
      var f = Date.now() + vm.restaMs;
      if (ui.tKey !== key) { ui.tKey = key; ui.tFine = f; ui.tDur = vm.durMs || vm.restaMs; ui.t0 = f - ui.tDur; }
      else if (f < ui.tFine - 150) { var d = ui.tFine - f; ui.tFine = f; ui.t0 -= d; if (ui.pan && ui.pan.tempo) ui.pan.tempo(); }
    }
    // la barra in alto: a che punto siamo, l'argomento, 🔥 ×2 nell'ultimo giro, la mia pallina
    var pre = R.r === "aspetta" ? "✋ Entri alla prossima · " : !io ? "👀 " : "";   // (chi aspetta la domanda dopo, chi guarda)
    var tx = vm.stato === "perdenti" ? "💀 Muro dei perdenti" : vm.stato === "vincitori" ? "🏆 Muro dei vincitori" : vm.stato === "ripresa" ? "🔁 Si riprende" : vm.stato === "punti" ? "Punteggi · " + vm.k + " di " + vm.tot : "Domanda " + vm.k + " di " + vm.tot;
    tx = pre + tx;
    if (ui.info.textContent !== tx) ui.info.textContent = tx;
    ui.info.className = "mu-info" + (vm.stato === "perdenti" ? " perd" : vm.stato === "vincitori" ? " vinc" : "");
    ui.badge.hidden = !(vm.dop && vm.stato !== "ripresa");
    var miaS = io ? io.sq : null;
    if (ui.miaS !== miaS) { ui.miaS = miaS; while (ui.mia.firstChild) ui.mia.removeChild(ui.mia.firstChild); if (miaS != null) ui.mia.appendChild(palla(t, miaS, 22)); }
    ui.tempo.style.visibility = vm.stato === "domanda" ? "visible" : "hidden";
    var pk = vm.stato === "domanda" ? key + "|" + R.r + (R.d ? "|" + R.d.su.length : "") : key;   // (la domanda cambia col mio posto; i muri no: niente da rifare)
    if (ui.pKey !== pk) {
      fermaPannello(ui); ui.pKey = pk;
      while (ui.corpo.firstChild) ui.corpo.removeChild(ui.corpo.firstChild);
      var fn = { domanda: pannelloDomanda, svela: pannelloSvela, perdenti: pannelloMuro, vincitori: pannelloMuro, punti: pannelloPunti, ripresa: pannelloRipresa }[vm.stato];
      ui.pan = fn ? fn(ui, vm, cb, R) : null;
    }
    if (ui.pan && ui.pan.agg) ui.pan.agg(vm);
  }
  // quando finisce il tempo per me (chi non tiene la partita chiude ANTICIPO prima: il tocco dell'ultimo istante arriva)
  function fineMia(ui) { return ui.tFine - (ui.cb.sonoHost ? 0 : ANTICIPO); }
  function argNodo(t, arg, cls) { var a = argDi(arg); return t.el("div", { class: cls }, [ t.el("span", { class: "i", text: a.icona }), t.el("span", { text: a.nome }) ]); }
  // le squadre in fondo: chi ha finito (✅) — solo CHI, mai cosa
  function statoSquadre(ui, box) {
    var t = ui.t, ch = {};
    return function (vm) {
      var fatto = vm.fatto || [], io = trovaP(vm, ui.cb.myId);
      for (var s = 0; s < vm.nsq; s++) {
        var d = (vm.sqd || [])[s], c = ch[s];
        if (!c) { c = ch[s] = { el: t.el("div", { class: "mu-ss" }), tx: t.el("span") }; c.el.appendChild(palla(t, s, 20)); c.el.appendChild(c.tx); c.el.style.setProperty("--c", SQ[s].col); box.appendChild(c.el); }
        var tot = d ? 1 + d.su.length : 0, fatti = d ? [d.giu].concat(d.su).filter(function (id) { return fatto.indexOf(id) >= 0; }).length : 0;
        var x = !d ? "—" : fatti >= tot ? "✅" : fatti + "/" + tot;
        if (c.tx.textContent !== x) c.tx.textContent = x;
        c.el.classList.toggle("ok", !!d && fatti >= tot);
        c.el.classList.toggle("mia", !!io && io.sq === s);
      }
    };
  }

  // ---- 1. la domanda: nella stanza la domanda e le risposte; giù l'argomento, le risposte e il muro piccolo ----
  function pannelloDomanda(ui, vm, cb, R) {
    var t = ui.t, el = t.el, L = loc(vm), kq = L.k, r = R.r, p = el("div", { class: "mu-dom mu-r-" + r }), parti = {};
    var conPalle = r === "giu" || r === "solo", conDom = r === "su" || r === "solo";
    var testi = { su: "🚪 Sei nella stanza: rispondi tu", giu: "⬇️ Sei giù: non vedi la domanda", solo: "🙋 Sei da solo: rispondi e scegli tu le palline",
      fuori: "⏳ Rientri dalla prossima domanda", aspetta: "✋ Entri dalla prossima domanda", guarda: "👀 Le squadre stanno scegliendo…",
      dopo: "👀 Squadre piene: entri alla prossima partita" };
    var rig = el("div", { class: "mu-ruolo" }, [ R.s != null ? palla(t, R.s, 16) : null, el("span", { text: testi[r] }) ]);
    if (R.s != null) rig.style.setProperty("--c", SQ[R.s].tx);
    p.appendChild(rig);
    if (conDom) {
      parti.carta = el("div", { class: "mu-carta" }, [ argNodo(t, vm.arg, "mu-arg"), parti.testo = el("p", { class: "mu-testo" }) ]);
      parti.risp = el("div", { class: "mu-risposte n" + (vm.nr || 3) });
      p.appendChild(parti.carta); p.appendChild(parti.risp);
    } else {
      p.appendChild(argNodo(t, vm.arg, "mu-argbig"));
      parti.opz = el("div", { class: "mu-opz" }); p.appendChild(parti.opz);
    }
    if (r === "giu" && R.d.su.length >= 2) { parti.chi = el("div", { class: "mu-chi" }); p.appendChild(parti.chi); }
    if (conPalle) {
      parti.mini = el("div", { class: "mu-mini" + (vm.dop ? " doppio" : "") }, [ parti.zone = el("div", { class: "mu-zone" }), parti.cvBox = el("div", { class: "mu-mini-box" }) ]);
      p.appendChild(parti.mini);
      parti.conta = el("span", { class: "mu-conta" });
      parti.togli = el("button", { class: "mu-togli", type: "button", "aria-label": "Togli l'ultima pallina", text: "↺" });
      parti.pronto = el("button", { class: "btn btn-primario mu-pronto", type: "button", text: "✅ Pronto" });
      p.appendChild(el("div", { class: "mu-ctrl" }, [ parti.togli, parti.conta, parti.pronto ]));
      tocco(parti.togli, function () { if (bloccato() || L.pronto || !L.z.length) return; L.z.pop(); L.toccato = true; mandaPalle(); rifai(); });
      tocco(parti.pronto, function () {
        if (bloccato() || L.pronto || (r === "solo" && L.a == null)) return;
        L.pronto = true; cb.manda({ t: "pronto", q: vm.k, r: vm.rip || 0, z: L.z.slice(), su: L.su }); rifai();
      });
    }
    parti.nota = el("div", { class: "mu-nota" }); p.appendChild(parti.nota);
    parti.ss = el("div", { class: "mu-statosq" }); p.appendChild(parti.ss);
    // chi guarda o aspetta: le faccine (con la targhetta del core sono già nel suo 😂)
    if (!conPalle && !conDom && !ui.targa) { var fac = t.faccine(); if (fac) { fac.classList.add("mu-fac"); p.appendChild(fac); } }
    var ss = statoSquadre(ui, parti.ss);
    ui.corpo.appendChild(p);
    if (r === "giu" && !L.su) L.su = R.d.su[0];
    function bloccato() { return L.chiuso || Date.now() >= fineMia(ui); }
    function mandaPalle() { cb.manda({ t: "palle", q: vm.k, r: vm.rip || 0, z: L.z.slice(), su: L.su }); }
    function priv() { return PRIV[kq] || {}; }
    // le risposte (nella stanza: tasti grandi; giù e chi guarda: da leggere)
    var fatteR = false, fatteO = false;
    function risposte() {
      var x = priv(), d = x.dom, o = x.opz;
      if (conDom) {
        var tt = d ? d.testo : "⏳ Arriva la domanda…";
        if (parti.testo.textContent !== tt) { parti.testo.textContent = tt; parti.testo.className = "mu-testo" + (tt.length > 110 ? " lunga" : tt.length > 70 ? " media" : ""); }
        if (d && !fatteR) {
          fatteR = true;
          parti.bs = d.opz.map(function (o, i) {
            var b = el("button", { class: "mu-ris", type: "button" }, [ el("b", { text: LETTERE[i] }), el("span", { text: o }) ]);
            tocco(b, function () { if (bloccato() || L.a != null) return; L.a = i; L.toccato = true; cb.manda({ t: "risp", q: vm.k, r: vm.rip || 0, s: i }); rifai(); });
            parti.risp.appendChild(b); return b;
          });
        }
      } else if (o && !fatteO) {
        fatteO = true;
        o.forEach(function (x, i) { parti.opz.appendChild(el("span", { class: "mu-o" }, [ el("b", { text: LETTERE[i] }), el("span", { text: x }) ])); });
      }
    }
    // su chi punti (squadre da 3): le faccine dei compagni nella stanza
    var chiB = {};
    function chi() {
      if (!parti.chi) return;
      if (!parti.chi.firstChild) {
        parti.chi.appendChild(el("span", { class: "mu-chi-t", text: "Su chi punti?" }));
        R.d.su.forEach(function (id) {
          var im = el("img", { alt: "", src: srcAvatar(OM[id], nomeDi(vm, id)) }), b = el("button", { class: "mu-chi-b", type: "button" }, [ im, el("span", { text: nomeDi(vm, id) }) ]);
          tocco(b, function () { if (bloccato() || L.pronto) return; L.su = id; L.toccato = true; mandaPalle(); rifai(); });
          chiB[id] = { b: b, im: im }; parti.chi.appendChild(b);
        });
      }
      Object.keys(chiB).forEach(function (id) { chiB[id].b.classList.toggle("on", L.su === id); chiB[id].b.disabled = !!(L.pronto || L.chiuso); });
    }
    function omini() { Object.keys(chiB).forEach(function (id) { var s = srcAvatar(OM[id], nomeDi(vm, id)); if (chiB[id].im.getAttribute("src") !== s) chiB[id].im.setAttribute("src", s); }); }
    // le zone in cima al muro piccolo: ogni tocco = una pallina da lì
    var zB = [], mini = null;
    function zone() {
      if (!conPalle) return;
      if (!zB.length) {
        for (var z = 0; z < NUM.NZ; z++) (function (z) {
          var b = el("button", { class: "mu-z", type: "button", "aria-label": "Fai cadere una pallina dalla zona " + (z + 1) }, [ el("span", { class: "mu-z-f", text: "▼" }), el("span", { class: "mu-z-p" }) ]);
          tocco(b, function () { if (bloccato() || L.pronto || L.z.length >= NUM.MAXP) return; L.z.push(z); L.toccato = true; mandaPalle(); rifai(); });
          zB.push(b); parti.zone.appendChild(b);
        })(z);
        mini = muroPiccolo(parti.cvBox, !!vm.dop, posaZone);
      }
      var conta = {}; L.z.forEach(function (z) { conta[z] = (conta[z] || 0) + 1; });
      zB.forEach(function (b, z) {
        var box = b.querySelector(".mu-z-p"), n = conta[z] || 0;
        if (box.childNodes.length !== n) { while (box.firstChild) box.removeChild(box.firstChild); for (var i = 0; i < n; i++) box.appendChild(palla(t, R.s, 22)); }
        b.classList.toggle("on", n > 0);
        b.disabled = !!(L.pronto || L.chiuso) || (L.z.length >= NUM.MAXP && !n);
      });
      var c = L.z.length;
      var tx = c ? "Palline: " + c + " di " + NUM.MAXP : "0 palline: non rischi niente";
      if (parti.conta.textContent !== tx) parti.conta.textContent = tx;
      parti.togli.disabled = !c || !!L.pronto || !!L.chiuso;
      parti.pronto.disabled = !!L.pronto || !!L.chiuso || (r === "solo" && L.a == null);
      var pt = L.pronto ? "✅ Fatto" : "✅ Pronto";
      if (parti.pronto.textContent !== pt) parti.pronto.textContent = pt;
    }
    // le zone stanno sopra le loro posizioni nel muro (anche con meno zone che caselle)
    function posaZone(g) {
      var passo = NUM.NZ > 1 ? (posZona(1) - posZona(0)) / 2 * g.sw : g.sw, w = Math.max(24, Math.min(passo * 0.94, 54));
      zB.forEach(function (b, z) { b.style.width = w + "px"; b.style.left = (g.X(posZona(z)) - w / 2) + "px"; });
    }
    function nota() {
      var x;
      if (L.chiuso) x = "⏰ Tempo!";
      else if (r === "su") x = L.a != null ? "✅ Risposta data! Chi è giù sta scegliendo le palline" : "Tocca la risposta: chi è giù non vede la domanda";
      else if (r === "giu") x = L.pronto ? "✅ Fatto! Aspettiamo gli altri" : "Tocca in alto da dove far cadere le palline (fino a " + NUM.MAXP + ")";
      else if (r === "solo") x = L.pronto ? "✅ Fatto! Aspettiamo gli altri" : L.a == null ? "Rispondi, poi scegli le palline" : "Ora le palline (fino a " + NUM.MAXP + "), poi «Pronto»";
      else x = "";
      if (parti.nota.textContent !== x) parti.nota.textContent = x;
    }
    function rifai() {
      risposte();
      if (parti.bs) parti.bs.forEach(function (b, i) { b.classList.toggle("sel", L.a === i); b.disabled = L.a != null || !!L.chiuso; });
      chi(); zone(); nota();
    }
    // il tempo: la barra in alto e, allo zero, tutto fermo
    function tempo() {
      var resta = fineMia(ui) - Date.now(), tot = Math.max(1, ui.tDur || resta);
      ui.tbar.style.transition = "none"; ui.tbar.style.transform = "scaleX(" + Math.max(0, Math.min(1, resta / tot)).toFixed(3) + ")";
      void ui.tbar.offsetWidth;
      if (resta > 0) { ui.tbar.style.transition = "transform " + (resta / 1000).toFixed(2) + "s linear"; ui.tbar.style.transform = "scaleX(0)"; }
      clearTimeout(ui.tChiudi); ui.tChiudi = dopoUI(ui, resta, function () { L.chiuso = true; rifai(); });
    }
    // la prima volta su questo telefono: due righe di spiegazione sopra la domanda (un tocco ovunque e via; il tempo degli altri non si ferma)
    spiegaUnaVolta(ui);
    rifai(); tempo();
    return { kq: kq, priv: rifai, omini: omini, tempo: tempo, agg: function (v) { ss(v); } };
  }
  function spiegaUnaVolta(ui) {
    var gia = false; try { gia = !!localStorage.getItem("sg-muro-spiegato"); } catch (e) {}
    if (gia || ui.scena.querySelector(".mu-spiega")) return;
    var el = ui.t.el, f = el("div", { class: "mu-spiega", role: "dialog" }, [ el("div", { class: "mu-spiega-in" }, [
      el("b", { class: "mu-spiega-t", text: "🧱 Come si gioca" }),
      el("p", {}, [ el("span", { class: "i", text: "🚪" }), el("span", { text: "Nella stanza: rispondi in segreto alla domanda." }) ]),
      el("p", {}, [ el("span", { class: "i", text: "⬇️" }), el("span", { text: "Giù: non vedi la domanda. Scegli quante palline far cadere (fino a " + NUM.MAXP + ") e da dove: scommetti su quanto la sa il compagno." }) ]),
      el("p", {}, [ el("span", { class: "i", text: "🏆" }), el("span", { text: "Risposta giusta: le palline danno punti nel Muro dei vincitori. Sbagliata: li tolgono nel 💀 Muro dei perdenti." }) ]),
      el("button", { class: "btn btn-primario mu-spiega-b", type: "button", text: "Ho capito ▶" }) ]) ]);
    tocco(f, function () { try { localStorage.setItem("sg-muro-spiegato", "1"); } catch (e) {} if (f.parentNode) f.parentNode.removeChild(f); });
    ui.scena.appendChild(f);
  }

  // ---- 2. la risposta giusta: rullo di tamburi, poi la domanda e le risposte, coi simboli delle squadre ----
  function pannelloSvela(ui, vm, cb) {
    var t = ui.t, el = t.el, riv = vm.riv || { opz: [], ris: [] }, io = trovaP(vm, cb.myId), miaS = io ? io.sq : null;
    var p = el("div", { class: "mu-svela" });
    var rullo = el("div", { class: "mu-rullo" }, [ el("div", { class: "mu-tamburo", text: "🥁" }), el("div", { class: "mu-rullo-t", text: "La risposta giusta è…" }), argNodo(t, vm.arg, "mu-arg") ]);
    var corpo = el("div", { class: "mu-sv-corpo", hidden: "hidden" });
    corpo.appendChild(el("div", { class: "mu-carta" }, [ argNodo(t, vm.arg, "mu-arg"), el("p", { class: "mu-testo" + (riv.testo && riv.testo.length > 110 ? " lunga" : riv.testo && riv.testo.length > 70 ? " media" : ""), text: riv.testo || "" }) ]));
    var righe = el("div", { class: "mu-righe" });
    riv.opz.forEach(function (o, i) {
      var seg = el("span", { class: "mu-segni" });
      riv.ris.forEach(function (x, s) { if (x && x.a === i) seg.appendChild(palla(t, s, 20)); });
      righe.appendChild(el("div", { class: "mu-riga" + (i === riv.giusta ? " giusta" : "") }, [ el("b", { text: LETTERE[i] }), el("span", { class: "tx", text: o }), seg ]));
    });
    var senza = riv.ris.map(function (x, s) { return x && x.a < 0 ? s : -1; }).filter(function (s) { return s >= 0; });
    if (senza.length) {
      var seg2 = el("span", { class: "mu-segni" }); senza.forEach(function (s) { seg2.appendChild(palla(t, s, 20)); });
      righe.appendChild(el("div", { class: "mu-riga tempo" }, [ el("b", { text: "⏰" }), el("span", { class: "tx", text: "Nessuna risposta" }), seg2 ]));
    }
    corpo.appendChild(righe);
    // come è andata alla mia squadra (o, per chi guarda, a tutte)
    var mio = miaS != null ? riv.ris[miaS] : null, esito;
    if (mio) esito = mio.ok ? "🎉 Giusto! Le vostre palline vanno nel Muro dei vincitori" : (mio.a < 0 ? "⏰ Nessuna risposta: " : "😬 Sbagliato: ") + "le vostre palline vanno nel Muro dei perdenti";
    else { var g = [], s2 = []; riv.ris.forEach(function (x, s) { if (x) (x.ok ? g : s2).push(SQ[s].nome); }); esito = (g.length ? "🎉 Giusto: " + g.join(", ") : "Nessuno ha indovinato") + (s2.length ? " · ❌ " + s2.join(", ") : ""); }
    corpo.appendChild(el("div", { class: "mu-esito" + (mio ? (mio.ok ? " ok" : " no") : ""), text: esito }));
    // chi ha risposto per la squadra (nelle squadre da 3: quello su cui ha puntato chi era giù)
    if (mio && vm.sqd && vm.sqd[miaS] && vm.sqd[miaS].su.length >= 2) corpo.appendChild(el("div", { class: "mu-chi-ris", text: "Contava la risposta di " + nomeDi(vm, mio.chi) }));
    p.appendChild(rullo); p.appendChild(corpo);
    ui.corpo.appendChild(p);
    var passato = Date.now() - ui.t0;   // (chi arriva tardi: niente rullo)
    function svela(zitto) {
      rullo.hidden = true; corpo.hidden = false;
      if (zitto) { corpo.classList.add("subito"); return; }
      if (mio) { if (mio.ok) { SUONO.tada(); vibra([30, 40, 70]); } else SUONO.trombone(); }
      else if (riv.ris.some(function (x) { return x && x.ok; })) SUONO.tada();
    }
    if (passato < NUM.RULLO - 200) { SUONO.rullo(NUM.RULLO - passato); dopoUI(ui, NUM.RULLO - passato, function () { svela(false); }); }
    else svela(true);
    return {};
  }

  // ---- 3 e 4. i due muri, uno alla volta e a tutto schermo ----
  function pannelloMuro(ui, vm, cb) {
    var t = ui.t, el = t.el, perd = vm.stato === "perdenti", tipo = perd ? "perdenti" : "vincitori", palle = vm.palle || [];
    var io = trovaP(vm, cb.myId), miaS = io ? io.sq : null, vals = valori(!!vm.dop);
    var p = el("div", { class: "mu-muro " + tipo }), box = el("div", { class: "mu-muro-box" }), chips = el("div", { class: "mu-chips" });
    p.appendChild(box); p.appendChild(chips);
    ui.corpo.appendChild(p);
    // le squadre sotto il muro: i punti cambiano quando le loro palline si fermano
    var base = (vm.punti || []).map(function (x, s) { return (x || 0) + (perd ? 0 : ((vm.dl || [])[s] || 0)); }), acc = {}, ch = {};
    var nelMuro = {}; palle.forEach(function (b) { nelMuro[b.s] = 1; });
    chips.style.gridTemplateColumns = "repeat(" + vm.nsq + ",1fr)";
    for (var s = 0; s < vm.nsq; s++) {
      if (!vm.players.some(function (x) { return x.sq === s; })) continue;
      var dl = el("div", { class: "mu-dl" }), pt = el("div", { class: "mu-pt", text: fmtN(base[s]) });
      var c = el("div", { class: "mu-chip" + (nelMuro[s] ? "" : " fuori") + (s === miaS ? " mia" : "") }, [ dl, palla(t, s, 24), pt, el("div", { class: "mu-nm", text: SQ[s].nome }) ]);
      c.style.setProperty("--c", SQ[s].col); chips.appendChild(c); ch[s] = { c: c, dl: dl, pt: pt };
    }
    function segna(s) {
      var x = ch[s]; if (!x) return;
      var a = acc[s] || 0;
      x.pt.textContent = fmtN(base[s] + a);
      while (x.dl.firstChild) x.dl.removeChild(x.dl.firstChild);
      if (a) x.dl.appendChild(el("span", { class: perd ? "giu" : "su", text: fmtD(a) }));
    }
    var finite = 0;
    function atterra(P, zitto) {
      var v = vals[P.b] * (perd ? -1 : 1);
      acc[P.s] = (acc[P.s] || 0) + v; segna(P.s);
      finite++;
      if (zitto) return;
      SUONO.tlac();
      if (P.s === miaS) vibra(perd ? 120 : 30);   // la MIA pallina: un colpo lungo nel muro dei perdenti, uno breve in quello dei vincitori
      if (finite === palle.length) {
        if (perd && miaS != null && nelMuro[miaS]) SUONO.trombone();
        else if (!perd) SUONO.tada();
      }
    }
    var muro = null;
    if (palle.length) muro = cascata(box, { tipo: tipo, doppio: !!vm.dop, palle: palle, t0: ui.t0 || Date.now(), atterra: atterra });
    else {   // muro vuoto: passa in un attimo
      cascata(box, { tipo: tipo, doppio: !!vm.dop, palle: [], t0: Date.now() });
      box.appendChild(el("div", { class: "mu-vuoto", text: perd ? "🎉 Nessuna pallina nel Muro dei perdenti!" : "😶 Nessuna pallina nel Muro dei vincitori" }));
    }
    return { ferma: function () { if (muro) muro.ferma(); } };
  }

  // ---- 5. i punteggi: le squadre in fila; l'host va avanti (o da solo col conto) ----
  function squadreInFila(vm) {
    var l = [];
    for (var s = 0; s < vm.nsq; s++) if (vm.players.some(function (x) { return x.sq === s; })) l.push({ s: s, punti: (vm.punti || [])[s] || 0 });
    l.sort(function (a, b) { return b.punti - a.punti || a.s - b.s; });
    l.forEach(function (r) { r.pos = 1 + l.filter(function (x) { return x.punti > r.punti; }).length; });
    return l;
  }
  function pannelloPunti(ui, vm, cb) {
    var t = ui.t, el = t.el, io = trovaP(vm, cb.myId), p = el("div", { class: "mu-punti" });
    var ol = el("ol", { class: "mu-cl" });
    squadreInFila(vm).forEach(function (r) {
      var d = (vm.delta || [])[r.s] || 0, nomi = vm.players.filter(function (x) { return x.sq === r.s && !x.via; }).map(function (x) { return x.id === cb.myId ? x.nome + " (tu)" : x.nome; }).join(" · ");
      var li = el("li", { class: (io && io.sq === r.s ? "mia" : "") }, [
        el("span", { class: "pos", text: r.pos + "°" }), palla(t, r.s, 28),
        el("div", { class: "mu-cl-n" }, [ el("b", { text: SQ[r.s].nome }), el("span", { text: nomi || "—" }) ]),
        el("span", { class: "mu-cl-d " + (d > 0 ? "su" : d < 0 ? "giu" : "zero"), text: fmtD(d) }),
        el("span", { class: "mu-cl-p", text: fmtN(r.punti) }) ]);
      li.style.setProperty("--c", SQ[r.s].col);
      ol.appendChild(li);
    });
    p.appendChild(ol);
    // prima dell'ultimo giro l'annuncio: punti doppi, caselle grandi
    if (vm.ndop && vm.k === vm.tot - vm.ndop) p.appendChild(el("div", { class: "mu-annuncio" }, [ el("b", { text: "🔥 Ultimo giro: punti doppi!" }), el("span", { text: "Le ultime " + vm.ndop + " domande valgono il doppio: caselle da " + fmtN(Math.max.apply(null, NUM.CASE_DOPPIO)) + " in mezzo." }) ]));
    var av = el("div", { class: "mu-avanti" }), sec = Math.max(1, Math.ceil((vm.restaMs || 0) / 1000)), k = "mu|" + vm.partita + "|" + vm.k + "|" + (vm.rip || 0);
    if (cb.sonoHost) {
      var b = el("button", { class: "btn btn-primario mu-vai", type: "button", text: vm.k >= vm.tot ? "Classifica 🏆" : "Prossima domanda ▶", onclick: cb.onAvanti });
      av.appendChild(b); t.contoAvanti(b, sec, cb.onAvanti, k);   // a zero chiama onAvanti (toccato prima, si ferma da solo)
    } else {
      var c = el("p", { class: "mu-conto" }); av.appendChild(c); t.contoAvanti(c, sec, null, k);   // solo il conto: va avanti l'host
    }
    p.appendChild(av);
    // chi guarda: le faccine (con la targhetta del core sono nel suo 😂)
    if (!io && !ui.targa) { var fac = t.faccine(); if (fac) p.appendChild(fac); }
    ui.corpo.appendChild(p);
    return {};
  }
  // ---- il respiro della ripresa: «🔁 Si riprende…» e il conto (va avanti da solo chi tiene la partita) ----
  function pannelloRipresa(ui, vm) {
    var t = ui.t, el = t.el, c = el("p", { class: "mu-conto" });
    ui.corpo.appendChild(el("div", { class: "mu-ripresa" }, [ el("div", { class: "mu-tamburo", text: "🔁" }), el("b", { text: "Si riprende…" }), c ]));
    t.contoAvanti(c, Math.max(1, Math.ceil((vm.restaMs || 0) / 1000)), null, "mur|" + vm.partita + "|" + (vm.rip || 0));
    return {};
  }

  // medaglie a pari merito: oro, oro, poi argento (posti 1, 1, 3 → 🥇🥇🥈), come la fine partita del core
  function medaglie(posti) {
    var gruppi = 0, prec = null;
    return posti.map(function (p) { if (p !== prec) { gruppi++; prec = p; } return ["🥇", "🥈", "🥉"][gruppi - 1] || p + "°"; });
  }
  var FESTA = {};   // (la festa a chi vince: una volta per partita)
  function finale(t, vm, cb) {
    stile();
    var s = t.schermata({ icona: "🏆", titolo: "Classifica finale" }), el = t.el;
    // le faccine: si aspetta l'host, ci si prende in giro (chi guarda col link le ha già nella targhetta del core)
    var targa = !!t.guarda && !t.eliminazione, cl = vm.classifica || [], fac = targa ? null : t.faccine();
    if (targa) s.classList.add("mu-fine-targa");   // (il posto in basso per la targhetta)
    var ol = el("ol", { class: "mu-fine-cl" + (cl.length > 3 ? " fitta" : "") }), med = medaglie(cl.map(function (r) { return r.pos; })), io = trovaP(vm, cb.myId);
    cl.forEach(function (r, i) {
      var mem = el("div", { class: "mu-fine-m" });
      (r.ids || []).forEach(function (id) {
        mem.appendChild(el("span", { class: "mu-fine-p" + (id === cb.myId ? " tu" : "") }, [ el("img", { alt: "", src: srcAvatar(OM[id], nomeDi(vm, id)) }), el("span", { text: nomeDi(vm, id) }) ]));
      });
      var li = el("li", { class: (r.pos === 1 ? "vince" : "") + (io && io.sq === r.s ? " mia" : "") }, [
        el("span", { class: "pos", text: med[i] }), palla(t, r.s, 30),
        el("div", { class: "mu-fine-c" }, [ el("b", { text: SQ[r.s].nome + (io && io.sq === r.s ? " (voi)" : "") }), mem ]),
        el("span", { class: "mu-cl-p", text: fmtN(r.punti) }) ]);
      li.style.setProperty("--c", SQ[r.s].col);
      ol.appendChild(li);
    });
    s._contenuto.appendChild(ol);
    if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); }
    var mia = io ? cl.filter(function (r) { return r.s === io.sq; })[0] : null;
    if (!mia) s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: "Questa partita l'hai guardata." }));
    // la festa a chi vince (una volta)
    if (mia && mia.pos === 1 && !FESTA[vm.partita + "|" + vm.codice]) { FESTA[vm.partita + "|" + vm.codice] = 1; SUONO.tada(); vibra([30, 40, 70]); }
    // I TASTI DI FINE LI METTE IL CORE, uguali in tutti i giochi: nella Sala "↻ Rivincita" (col 3-2-1 da solo) e
    // "🎮 Cambia gioco" per l'host, "👍 Ci sto!" e "🏠 Torna in Sala" per gli altri; fuori dalla Sala "↻ Nuova partita
    // (stessi amici)" ed "🏠 Esci". La rivincita chiama t.onRivincita (qui: nuova). Non disegnarli a mano.
    if (!t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci })) {
      if (cb.sonoHost) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
      else s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: targa ? "👀 Se l'host fa un'altra partita, entri anche tu nella saletta." : "Se l'host fa un'altra partita, torni da solo nella saletta." }));
      if (!targa) s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));   // (chi guarda esce col ✕ della targhetta)
    }
    t.mostra(s);
    return s;
  }
  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  // il primo collegamento non è riuscito: "Riprova" rifà il collegamento da capo
  function erroreRete(t, testo, riprova) {
    var s = t.schermata({ icona: "📶", titolo: "Niente rete?", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo + " Controlla la connessione e riprova." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Riprova", onclick: riprova }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Questo gioco si gioca online: funziona quando l'app è aperta dal sito pubblicato." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // ===================== LO STILE (🌙 Notte vivace: variabili --o-* e --n-* di css/styles.css; prefisso mu-) =====================
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      // --- la saletta: una riga per squadra ---
      ".mu-squadre{display:flex;flex-direction:column;gap:4px;margin:2px 0}",
      ".mu-sq-riga{display:flex;align-items:center;gap:6px;min-height:30px;box-sizing:border-box;border-radius:12px;padding:3px 5px 3px 7px;background:var(--o-carta);box-shadow:inset 4px 0 var(--c)}",
      ".mu-sq-riga.mia{background:rgba(255,255,255,.12)}",
      ".mu-sq-nome{flex:none;font-weight:900;font-size:.84rem;color:var(--ct)}",
      ".mu-membri{flex:1 1 auto;min-width:0;display:flex;flex-wrap:wrap;gap:2px 6px;font-size:.78rem;font-weight:800;line-height:1.25;color:var(--o-testo)}",
      ".mu-membro{white-space:nowrap}.mu-membro.b{border:0;background:rgba(255,255,255,.08);color:inherit;font:inherit;border-radius:8px;padding:1px 5px;cursor:pointer;touch-action:manipulation}",
      ".mu-membro.tu{text-decoration:underline;text-decoration-color:var(--c);text-decoration-thickness:2px;text-underline-offset:3px}",
      ".mu-vuota{font-size:.76rem;color:var(--o-tenue)}",
      ".mu-sq-b{flex:none;min-height:26px;border:0;border-radius:999px;padding:2px 9px;background:rgba(255,255,255,.14);color:var(--o-testo);font:inherit;font-size:.72rem;font-weight:900;white-space:nowrap;cursor:pointer;touch-action:manipulation}",
      ".mu-sq-tasti{display:flex;align-items:center;gap:6px;justify-content:center;flex-wrap:wrap}",
      ".mu-et{font-size:.74rem;font-weight:800;color:var(--o-tenue)}",
      ".mu-nsq{display:flex;gap:3px}.mu-n{width:28px;height:26px;border:0;border-radius:8px;background:rgba(255,255,255,.1);color:var(--o-testo);font:inherit;font-weight:900;font-size:.82rem;cursor:pointer}",
      ".mu-n.on{background:var(--o-scuro);color:var(--o-scuro-testo)}.mu-n:disabled{opacity:.3}",
      ".mu-rot-riga{display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap}",
      ".mu-rot{display:flex;align-items:center;gap:6px;min-height:26px;border:0;border-radius:999px;padding:2px 10px 2px 4px;background:rgba(255,255,255,.1);color:var(--o-testo);font:inherit;font-size:.74rem;font-weight:900;cursor:pointer}",
      ".mu-rot-i{width:28px;height:16px;border-radius:99px;background:rgba(255,255,255,.25);position:relative;flex:none}",
      ".mu-rot-i::after{content:'';position:absolute;left:2px;top:2px;width:12px;height:12px;border-radius:50%;background:#fff;transition:transform .15s}",
      ".mu-rot.on .mu-rot-i{background:var(--o-verde)}.mu-rot.on .mu-rot-i::after{transform:translateX(12px)}",
      ".mu-rot-tx{font-size:.72rem;color:var(--o-tenue);font-weight:700}",
      ".mu-guardano{margin:0;font-size:.74rem;color:var(--o-tenue);text-align:center}",
      ".mu-pl{display:inline-block;max-width:none;vertical-align:middle;flex:none;pointer-events:none;-webkit-user-drag:none}",
      // --- lo schermo di gioco ---
      ".schermata.mu-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:var(--o-fondo)}",
      ".schermata.mu-piena>.testa,.schermata.mu-piena>.piede{display:none}",
      ".schermata.mu-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".mu-scena{position:relative;height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;gap:6px;padding:calc(6px + env(safe-area-inset-top)) 10px calc(8px + env(safe-area-inset-bottom));overflow:hidden;user-select:none;-webkit-user-select:none;color:var(--o-testo)}",
      ".mu-scena [hidden]{display:none!important}",
      ".mu-scena.mu-con-targa{padding-bottom:calc(62px + env(safe-area-inset-bottom))}",
      ".mu-barra{flex:none;display:flex;align-items:center;gap:8px;min-height:36px}",
      ".mu-esci{flex:none;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:var(--o-testo);font:inherit;font-size:1.25rem;font-weight:900;cursor:pointer}",
      ".mu-info{flex:1 1 auto;min-width:0;font-weight:900;font-size:.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".mu-info.perd{color:#bcd4ff}.mu-info.vinc{color:#ffd978}",
      ".mu-badge{flex:none;font-weight:900;font-size:.8rem;padding:3px 9px;border-radius:99px;background:linear-gradient(135deg,#ff9a4a,#e0225a);color:#fff}",
      ".mu-mia{flex:none;display:flex;width:24px;justify-content:center}",
      ".mu-tempo{flex:none;height:5px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden}",
      ".mu-tempo>i{display:block;height:100%;background:linear-gradient(90deg,#ff9a4a,#e0225a);transform-origin:left center}",
      ".mu-corpo{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;position:relative}",
      // la domanda
      ".mu-dom{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:7px}",
      ".mu-ruolo{flex:none;display:flex;align-items:center;gap:6px;font-weight:900;font-size:.84rem;color:var(--c,var(--o-tenue))}",
      ".mu-carta{flex:none;border-radius:16px;padding:10px 12px;background:var(--o-carta);box-shadow:var(--o-ombra);border:1px solid var(--o-filo)}",
      ".mu-arg{display:inline-flex;align-items:center;gap:5px;font-size:.74rem;font-weight:900;color:var(--n-parole);text-transform:uppercase;letter-spacing:.04em}",
      ".mu-testo{margin:4px 0 0;font-size:1.18rem;font-weight:800;line-height:1.3}.mu-testo.media{font-size:1.06rem}.mu-testo.lunga{font-size:.96rem}",
      ".mu-risposte{flex:none;display:flex;flex-direction:column;gap:8px}",
      // nella stanza: domanda e risposte INSIEME al centro (prima tra le due restava un gran vuoto), più grandi sui telefoni alti;
      // la carta della domanda prende un po' d'altezza (si stringe fino al suo testo se manca posto)
      ".mu-r-su .mu-carta{flex:0 1 clamp(112px,26vh,290px);margin-top:auto;display:flex;flex-direction:column;justify-content:center}",
      ".mu-r-su .mu-carta .mu-arg,.mu-sv-corpo .mu-carta .mu-arg{align-self:flex-start}",
      ".mu-r-su .mu-testo{font-size:clamp(1.18rem,3vh,1.55rem)}.mu-r-su .mu-testo.media{font-size:clamp(1.06rem,2.7vh,1.4rem)}.mu-r-su .mu-testo.lunga{font-size:clamp(.96rem,2.4vh,1.25rem)}",
      ".mu-r-su .mu-risposte{flex:none;margin-bottom:auto;gap:10px}.mu-r-su .mu-ris{min-height:clamp(60px,10.5vh,100px);font-size:clamp(1.1rem,2.7vh,1.4rem)}",
      ".mu-r-su .mu-ris b{width:clamp(26px,4.2vh,36px);height:clamp(26px,4.2vh,36px)}",
      ".mu-r-su .mu-nota{font-size:.88rem}.mu-r-su .mu-statosq{margin-top:0}",
      ".mu-ris{display:flex;align-items:center;gap:10px;min-height:48px;border:1px solid var(--o-filo-oro);border-radius:14px;padding:6px 12px;background:var(--o-carta);color:var(--o-testo);font:inherit;font-size:1rem;font-weight:800;text-align:left;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;box-shadow:var(--o-ombra)}",
      ".mu-ris b{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.12);font-size:.8rem}",
      ".mu-ris.sel{background:var(--o-carta-viva);border-color:var(--o-oro)}.mu-ris.sel b{background:var(--o-oro);color:#fff}",
      ".mu-ris:disabled:not(.sel){opacity:.45}",
      ".mu-r-solo .mu-ris{min-height:40px;padding:4px 10px;font-size:.92rem}.mu-r-solo .mu-testo{font-size:1rem}.mu-r-solo .mu-carta{padding:7px 10px}",
      ".mu-argbig{flex:none;display:flex;align-items:center;justify-content:center;gap:8px;font-size:1.45rem;font-weight:900;color:var(--n-parole);padding:4px 0}",
      ".mu-argbig .i{font-size:1.6rem}",
      ".mu-opz{flex:none;display:flex;flex-wrap:wrap;gap:5px;justify-content:center}",
      ".mu-o{display:inline-flex;align-items:center;gap:6px;max-width:100%;border-radius:12px;padding:4px 10px 4px 5px;background:var(--o-carta);border:1px solid var(--o-filo);font-size:.86rem;font-weight:800}",
      ".mu-o b{flex:none;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.12);font-size:.7rem}",
      ".mu-chi{flex:none;display:flex;align-items:center;justify-content:center;gap:8px}",
      ".mu-chi-t{font-weight:900;font-size:.8rem;color:var(--o-tenue)}",
      ".mu-chi-b{display:flex;align-items:center;gap:6px;border:2px solid transparent;border-radius:99px;padding:2px 10px 2px 2px;background:rgba(255,255,255,.08);color:var(--o-testo);font:inherit;font-size:.82rem;font-weight:900;cursor:pointer;touch-action:manipulation}",
      ".mu-chi-b img{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.1);object-fit:cover}",
      ".mu-chi-b.on{border-color:var(--o-oro);background:var(--o-carta-viva)}",
      ".mu-mini{flex:1 1 auto;min-height:120px;display:flex;flex-direction:column;border-radius:14px;overflow:hidden;background:#0c0f1e;border:1px solid var(--o-filo)}",
      ".mu-mini.doppio{border-color:rgba(255,154,74,.6)}",
      ".mu-zone{position:relative;flex:none;height:44px;background:rgba(255,255,255,.04)}",
      ".mu-z{position:absolute;top:3px;height:38px;border:1px dashed rgba(255,255,255,.28);border-radius:10px;background:rgba(255,255,255,.05);color:var(--o-tenue);font:inherit;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}",
      ".mu-z-f{font-size:.7rem;line-height:1}.mu-z.on{border-style:solid;border-color:var(--o-oro);background:rgba(224,34,90,.14)}.mu-z.on .mu-z-f{display:none}",
      ".mu-z-p{display:flex;flex-direction:column-reverse;align-items:center}.mu-z-p .mu-pl+.mu-pl{margin-bottom:-19px!important}",
      ".mu-z:disabled{opacity:.45}.mu-z.on:disabled{opacity:1}",
      ".mu-mini-box{flex:1 1 auto;min-height:0;position:relative}.mu-mini-cv{position:absolute;left:0;top:0;display:block}",
      ".mu-ctrl{flex:none;display:flex;align-items:center;gap:8px}",
      ".mu-togli{flex:none;width:44px;height:44px;border:0;border-radius:12px;background:rgba(255,255,255,.12);color:var(--o-testo);font:inherit;font-size:1.3rem;font-weight:900;cursor:pointer}",
      ".mu-togli:disabled{opacity:.35}",
      ".mu-conta{flex:1 1 auto;min-width:0;font-size:.82rem;font-weight:800;color:var(--o-tenue);text-align:center}",
      ".mu-pronto{flex:none;width:auto;min-width:118px;margin:0;min-height:44px}",
      ".mu-nota{flex:none;min-height:1.2em;text-align:center;font-size:.82rem;font-weight:800;color:var(--o-tenue)}",
      ".mu-r-guarda .mu-nota,.mu-r-aspetta .mu-nota,.mu-r-fuori .mu-nota,.mu-r-dopo .mu-nota{display:none}",
      ".mu-r-guarda .mu-ruolo,.mu-r-aspetta .mu-ruolo,.mu-r-fuori .mu-ruolo,.mu-r-dopo .mu-ruolo{justify-content:center;margin-top:auto;font-size:.95rem}",
      ".mu-r-guarda .mu-opz,.mu-r-aspetta .mu-opz,.mu-r-fuori .mu-opz,.mu-r-dopo .mu-opz{margin-bottom:auto}",
      ".mu-statosq{flex:none;display:flex;gap:5px;justify-content:center;margin-top:auto}",
      ".mu-ss{display:flex;align-items:center;gap:4px;border-radius:99px;padding:2px 8px 2px 4px;background:rgba(255,255,255,.06);font-size:.76rem;font-weight:900;color:var(--o-tenue);border:1px solid transparent}",
      ".mu-ss.ok{color:var(--o-testo)}.mu-ss.mia{border-color:var(--c)}",
      // la spiegazione della prima volta
      ".mu-spiega{position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(5,7,16,.72)}",
      ".mu-spiega-in{max-width:340px;border-radius:18px;padding:16px;background:var(--o-carta-piena);box-shadow:var(--o-ombra-alta);border:1px solid var(--o-filo-oro)}",
      ".mu-spiega-t{display:block;font-size:1.1rem;margin-bottom:8px}",
      ".mu-spiega p{display:flex;gap:10px;margin:8px 0;font-size:.9rem;line-height:1.35}.mu-spiega .i{flex:none;font-size:1.3rem}",
      ".mu-spiega-b{margin:10px 0 0;width:100%}",
      // la risposta giusta
      ".mu-svela,.mu-ripresa{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:8px}",
      ".mu-rullo,.mu-ripresa{align-items:center;justify-content:center;text-align:center}",
      ".mu-rullo{flex:1 1 auto;display:flex;flex-direction:column;gap:10px}",
      ".mu-tamburo{font-size:4rem;animation:muBatti .22s ease-in-out infinite alternate}",
      "@keyframes muBatti{from{transform:scale(1) rotate(-6deg)}to{transform:scale(1.12) rotate(6deg)}}",
      ".mu-rullo-t{font-size:1.3rem;font-weight:900}",
      ".mu-ripresa b{font-size:1.3rem}",
      ".mu-sv-corpo{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:8px}",
      // la rivelazione: domanda e risposte insieme al centro, l'esito in fondo (prima sotto le risposte restava un gran vuoto)
      ".mu-sv-corpo .mu-carta{flex:0 1 clamp(104px,22vh,260px);margin-top:auto;display:flex;flex-direction:column;justify-content:center}",
      ".mu-sv-corpo .mu-testo{font-size:clamp(1.18rem,2.9vh,1.5rem)}.mu-sv-corpo .mu-testo.media{font-size:clamp(1.06rem,2.6vh,1.35rem)}.mu-sv-corpo .mu-testo.lunga{font-size:clamp(.96rem,2.3vh,1.2rem)}",
      ".mu-righe{display:flex;flex-direction:column;gap:6px}.mu-sv-corpo .mu-righe{margin-bottom:auto;gap:8px}",
      ".mu-riga{display:flex;align-items:center;gap:9px;min-height:clamp(44px,8vh,80px);border-radius:14px;padding:5px 10px;background:var(--o-carta);border:1px solid var(--o-filo);font-weight:800;font-size:clamp(.98rem,2.4vh,1.25rem);animation:muScuro .5s .35s both}",
      ".mu-riga>b{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.12);font-size:.8rem}",
      ".mu-riga .tx{flex:1 1 auto;min-width:0}",
      ".mu-segni{flex:none;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;max-width:52%}",
      ".mu-riga.giusta{animation:muGiusta .5s .2s both;border-color:var(--n-monete);background:rgba(255,194,71,.16)}",
      ".mu-riga.giusta>b{background:var(--n-monete);color:#2b1d00}",
      ".mu-riga.giusta .tx::after{content:'  ✓';color:var(--n-monete);font-weight:900}",
      ".mu-riga.tempo{background:rgba(255,255,255,.04)}",
      "@keyframes muGiusta{from{transform:scale(.96);opacity:.6}to{transform:none;opacity:1}}",
      "@keyframes muScuro{from{opacity:1}to{opacity:.6}}",
      ".mu-sv-corpo.subito .mu-riga{animation:none}.mu-sv-corpo.subito .mu-riga:not(.giusta){opacity:.6}",
      ".mu-esito{flex:none;text-align:center;font-weight:900;font-size:.98rem;padding:8px 10px;border-radius:14px;background:rgba(255,255,255,.06)}",
      ".mu-esito.ok{background:rgba(255,194,71,.16);color:#ffd978}.mu-esito.no{background:rgba(90,130,255,.16);color:#bcd4ff}",
      ".mu-chi-ris{text-align:center;font-size:.8rem;color:var(--o-tenue);font-weight:700}",
      // i muri
      ".mu-muro{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:6px}",
      ".mu-muro-box{flex:1 1 auto;min-height:0;position:relative;display:flex;align-items:center;justify-content:center}",
      ".mu-muro-wrap{position:relative;border-radius:12px;overflow:hidden}",
      ".mu-cv{position:absolute;left:0;top:0;display:block}",
      ".mu-fx{position:absolute;inset:0;pointer-events:none}",
      ".mu-lampo{position:absolute;opacity:0;border-radius:6px}",
      ".mu-lampo.vincitori{background:radial-gradient(ellipse at 50% 70%,rgba(255,214,102,.75),rgba(255,214,102,0) 70%)}",
      ".mu-lampo.perdenti{background:radial-gradient(ellipse at 50% 70%,rgba(140,170,255,.7),rgba(140,170,255,0) 70%)}",
      ".mu-lampo.on{animation:muLampo .7s ease-out}",
      "@keyframes muLampo{0%{opacity:1}100%{opacity:0}}",
      // (top = il bordo di sopra della pallina ferma: la scritta sta tutta sopra, translate −100%)
      ".mu-piu{position:absolute;transform:translate(-50%,-100%);font-weight:900;font-size:1.05rem;line-height:1.1;white-space:nowrap;text-shadow:0 2px 6px rgba(0,0,0,.8);animation:muSale 1.35s ease-out both}",
      "@keyframes muSale{0%{opacity:0;transform:translate(-50%,-100%) translateY(6px) scale(.8)}15%{opacity:1;transform:translate(-50%,-100%) scale(1.1)}100%{opacity:0;transform:translate(-50%,-100%) translateY(-40px) scale(1)}}",
      ".mu-vuoto{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);width:86%;text-align:center;font-weight:900;font-size:1.15rem;padding:14px;border-radius:16px;background:rgba(13,16,32,.85);border:1px solid var(--o-filo-oro)}",
      ".mu-chips{flex:none;display:grid;gap:4px}",
      ".mu-chip{position:relative;border-radius:12px;padding:3px 2px 5px;text-align:center;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-top:3px solid var(--c);min-width:0}",
      ".mu-chip.mia{background:rgba(255,255,255,.13)}.mu-chip.fuori{opacity:.7}",
      ".mu-chip .mu-pt{font-weight:900;font-size:15px;line-height:1.1;margin-top:3px;font-variant-numeric:tabular-nums}",
      ".mu-chip .mu-nm{font-size:10px;color:var(--o-tenue);font-weight:700;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".mu-dl{height:18px;margin-bottom:2px;display:flex;align-items:center;justify-content:center}",
      ".mu-dl span{font-weight:900;font-size:12px;padding:1px 7px;border-radius:99px}",
      ".mu-dl .su{background:var(--n-monete);color:#2b1d00}.mu-dl .giu{background:#9fb6ff;color:#0e1840}",
      // i punteggi
      ".mu-punti{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:8px}",
      ".mu-cl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}",
      // (la classifica al centro e più grande sui telefoni alti: prima sotto restava mezzo schermo vuoto)
      ".mu-punti .mu-cl{margin-top:auto}",
      ".mu-cl li{display:flex;align-items:center;gap:9px;min-height:clamp(52px,8.6vh,84px);border-radius:14px;padding:5px 10px;background:var(--o-carta);border:1px solid var(--o-filo);box-shadow:inset 4px 0 var(--c)}",
      ".mu-cl li.mia{background:rgba(255,255,255,.12)}",
      ".mu-cl .pos{flex:none;width:24px;font-weight:900;color:var(--o-tenue)}",
      ".mu-cl-n{flex:1 1 auto;min-width:0;display:flex;flex-direction:column}.mu-cl-n b{font-size:clamp(.95rem,2.2vh,1.2rem)}.mu-cl-n span{font-size:clamp(.74rem,1.7vh,.9rem);color:var(--o-tenue);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".mu-cl-d{flex:none;font-weight:900;font-size:.8rem;padding:2px 7px;border-radius:99px}",
      ".mu-cl-d.su{background:var(--n-monete);color:#2b1d00}.mu-cl-d.giu{background:#9fb6ff;color:#0e1840}.mu-cl-d.zero{background:rgba(255,255,255,.1);color:var(--o-tenue)}",
      ".mu-cl-p{flex:none;min-width:58px;text-align:right;font-weight:900;font-size:clamp(1.1rem,2.5vh,1.4rem);font-variant-numeric:tabular-nums}",
      ".mu-annuncio{display:flex;flex-direction:column;gap:3px;text-align:center;padding:10px;border-radius:16px;background:linear-gradient(135deg,rgba(255,154,74,.22),rgba(224,34,90,.22));border:1px solid rgba(255,154,74,.5);animation:muGiusta .6s both}",
      ".mu-annuncio b{font-size:1.15rem}.mu-annuncio span{font-size:.82rem;color:var(--o-testo)}",
      ".mu-avanti{flex:none;margin-top:auto;height:52px;display:flex;align-items:center;justify-content:center}",
      ".mu-vai{width:auto;min-width:64%;margin:0}.mu-conto{margin:0;font-weight:800;color:var(--o-tenue)}",
      ".mu-punti>.sl-faccine,.mu-dom>.sl-faccine{align-self:center;flex:none}",
      // la classifica finale
      ".mu-fine-cl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}",
      ".mu-fine-cl li{display:flex;align-items:center;gap:9px;border-radius:16px;padding:7px 10px;background:var(--o-carta);border:1px solid var(--o-filo);box-shadow:inset 4px 0 var(--c)}",
      ".mu-fine-cl li.vince{border-color:var(--n-monete);background:rgba(255,194,71,.12)}",
      ".mu-fine-cl li.mia b{text-decoration:underline;text-decoration-color:var(--c);text-underline-offset:3px}",
      ".mu-fine-cl .pos{flex:none;font-size:1.3rem;width:30px;text-align:center}",
      ".mu-fine-c{flex:1 1 auto;min-width:0}.mu-fine-c b{font-size:1rem}",
      ".mu-fine-m{display:flex;flex-wrap:wrap;gap:2px 8px;margin-top:2px}",
      ".mu-fine-p{display:inline-flex;align-items:center;gap:3px;font-size:.78rem;font-weight:700;color:var(--o-tenue)}.mu-fine-p.tu{color:var(--o-testo)}",
      ".mu-fine-p img{width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.08)}",
      ".mu-fine-cl.fitta li{padding:5px 9px}.mu-fine-cl.fitta .mu-fine-p img{width:18px;height:18px}",
      // sui telefoni alti la classifica più grande (prima sotto restava mezzo schermo vuoto)
      "@media (min-height:760px){.mu-fine-cl{gap:10px}.mu-fine-cl li,.mu-fine-cl.fitta li{min-height:74px;padding:10px 12px}.mu-fine-c b{font-size:1.15rem}.mu-fine-p{font-size:.88rem}.mu-fine-m{gap:4px 10px;margin-top:4px}.mu-fine-p img,.mu-fine-cl.fitta .mu-fine-p img{width:26px;height:26px}.mu-fine-cl .mu-cl-p{font-size:1.3rem}.mu-fine-cl .pos{font-size:1.6rem;width:36px}}",
      ".schermata.mu-fine-targa{padding-bottom:calc(58px + env(safe-area-inset-bottom))}",
      ".mu-arg-griglia .mu-cn{font-size:.72rem;font-weight:800;opacity:.75;margin-left:2px}",
      "@media (prefers-reduced-motion: reduce){.mu-tamburo,.mu-riga,.mu-annuncio,.mu-piu,.mu-lampo.on{animation:none!important}}"
    ].join("");
    document.head.appendChild(st);
  }

  // (per le prove: le regole senza grafica)
  window.__muro = { NUM: NUM, SQ: SQ, cade: cade, percorso: percorso, posZona: posZona, chiavi: chiavi, durataMuro: durataMuro, scegliDomande: scegliDomande, domandaDi: domandaDi, idDom: idDom, impDi: impDi };

  SG.registra({
    id: ID, nome: "Il Muro", icona: "🧱",
    descrizione: "A squadre: uno risponde nella stanza, l'altro scommette le palline sul muro senza vedere la domanda.",
    giocatoriMin: MIN, giocatoriMax: MAX, difficolta: 2,
    tema: "oro",   // 🌙 Notte vivace: tutte le schermate col vestito dell'app (i due muri sono disegnati su canvas)
    modi: [], soloOnline: true,   // solo online (passarsi il telefono quattro volte a domanda è lento), niente Bot
    postiOnline: MAX,
    ritardatari: RITARDATARI,
    riprende: true,
    riserva: true,
    riassunto: function (imp) {
      var x = impDi(imp), g = NUM.GIRI[x.nd], A = tuttiArg();
      var arg = x.arg.length >= A.length ? "tutti gli argomenti" : x.arg.length <= 3 ? x.arg.map(function (a) { return argDi(a).nome; }).join(", ") : x.arg.slice(0, 3).map(function (a) { return argDi(a).nome; }).join(", ") + " e altri " + (x.arg.length - 3);
      return (g[0] + g[1]) + " domande · " + x.tempo + " s · " + arg;
    },
    regole: [
      "Si gioca a <b>squadre</b> (da 2 a 5, da 2 o 3 giocatori): in ogni squadra c'è chi sta <b>nella stanza</b> e chi sta <b>giù</b>. Tutte le squadre giocano insieme, con le stesse domande.",
      "🚪 <b>Nella stanza</b> rispondi in segreto alla domanda (2 o 3 risposte), prima che finisca il tempo.",
      "⬇️ <b>Giù</b> non vedi la domanda: vedi solo l'argomento e le risposte. Scegli quante palline far cadere (da 0 a " + NUM.MAXP + ") e da dove: scommetti su quanto la sa il compagno. Nelle squadre da 3 scegli anche <b>su chi puntare</b>: conta la sua risposta.",
      "Risposta giusta: le palline cadono nel <b>🏆 Muro dei vincitori</b> e i punti si guadagnano. Sbagliata (o nessuna risposta): cadono nel <b>💀 Muro dei perdenti</b> e i punti si perdono, anche sotto zero. In mezzo vale di più!",
      "🔥 L'<b>ultimo giro</b> (le ultime 3 domande) vale <b>doppio</b>. Vince la squadra con più punti.",
      "🔄 <b>A rotazione</b> (si sceglie in saletta): i ruoli si scambiano a ogni domanda, così tutti fanno tutte e due le parti."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el, ARG = window.SG_MURO_ARG || [], DOM = window.SG_MURO_DOM || {};
      dove.arg = ARG.map(function (a) { return a.id; }); dove.nd = "normale"; dove.tempo = NUM.TEMPO;
      // «Argomenti»: si accendono e si spengono, col numero di domande accanto (l'ultimo non si spegne)
      box.appendChild(el("div", { class: "etichetta", text: "Argomenti" }));
      var gr = el("div", { class: "cat-griglia mu-arg-griglia" });
      var notaA = el("div", { class: "link-avviso", hidden: "hidden", text: "Serve almeno un argomento: accendine un altro prima di spegnere questo." });
      ARG.forEach(function (a) {
        var chip = el("button", { class: "cat-chip attiva", type: "button", onclick: function () {
          var i = dove.arg.indexOf(a.id);
          if (i >= 0 && dove.arg.length === 1) { notaA.hidden = false; return; }
          notaA.hidden = true;
          if (i >= 0) dove.arg.splice(i, 1); else dove.arg.push(a.id);
          chip.className = "cat-chip" + (dove.arg.indexOf(a.id) >= 0 ? " attiva" : "");
        } }, [ el("span", { class: "ci", text: a.icona }), el("span", { text: a.nome }), el("span", { class: "mu-cn", text: String((DOM[a.id] || []).length) }), el("span", { class: "spunta", text: "✓" }) ]);
        gr.appendChild(chip);
      });
      box.appendChild(gr); box.appendChild(notaA);
      // «Quante domande» e «Tempo per rispondere»: scelte con .modo-chip (così l'host le ritrova in «⚙️ Regole»)
      function scelte(et, lista, chiave) {
        box.appendChild(el("div", { class: "etichetta", text: et }));
        var g = el("div", { class: "modo-griglia", style: "grid-template-columns:repeat(" + lista.length + ",1fr)" });
        lista.forEach(function (o) {
          var b = el("button", { class: "modo-chip" + (o[0] === dove[chiave] ? " attiva" : ""), type: "button", style: "justify-content:center", onclick: function () {
            dove[chiave] = o[0]; [].forEach.call(g.children, function (c) { c.className = "modo-chip"; }); b.className = "modo-chip attiva";
          } }, [ el("div", {}, [ el("div", { class: "mt", text: o[1] }), o[2] ? el("div", { class: "ms", text: o[2] }) : null ]) ]);
          g.appendChild(b);
        });
        box.appendChild(g);
      }
      scelte("Quante domande", [["corta", "Corta", NUM.GIRI.corta[0] + " + " + NUM.GIRI.corta[1] + " doppie"], ["normale", "Normale", NUM.GIRI.normale[0] + " + " + NUM.GIRI.normale[1] + " doppie"], ["lunga", "Lunga", NUM.GIRI.lunga[0] + " + " + NUM.GIRI.lunga[1] + " doppie"]], "nd");
      scelte("Tempo per rispondere", NUM.TEMPI.map(function (s) { return [s, s + " s", null]; }), "tempo");
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito
      return host(t);
    }
  });
})();

/* =========================================================
   COLLEGAMENTO TRA TELEFONI — "SGNet"
   Fa parlare i telefoni tra loro per la modalità
   "ognuno dal suo telefono", senza server né account.

   I messaggi passano da un "ufficio postale" pubblico e
   gratuito (un broker MQTT): ogni telefono si collega a
   quello, quindi funziona su qualsiasi rete (niente
   collegamento diretto che sul cellulare spesso fallisce).

   Un telefono "ospita" la stanza (è il cervello della
   partita); gli altri "entrano" con il codice.

   Sui telefoni veri il collegamento va e viene (schermo
   bloccato, cambio app per mandare il link, rete che salta),
   quindi:
   - chi entra ripete "sono entrato" finché l'host non lo vede
     dentro (il primo può perdersi se la stanza non è ancora pronta);
   - chi sparisce all'improvviso non viene tolto subito: ha un po'
     di tempo per tornare, e quando torna ripete che c'è (intanto
     l'app lo mostra grigio con 📶: evento "sg-forse");
   - se sparisce l'host, gli altri lo aspettano prima di arrendersi;
     chi arriva DOPO trova scritto "host sparito" (il testamento
     resta nella stanza) e lo sa subito, invece di vedere una partita ferma;
   - ogni apertura della stanza ha la sua "sessione": se l'host
     ricarica la pagina e riapre la stessa stanza, chi era dentro
     se ne accorge e rientra da solo;
   - un errore di rete dopo il collegamento non chiude niente:
     l'app mostra "📶 Mi ricollego…" e mqtt riprova da solo.
   Chi esce apposta (tasto Esci) esce subito.

   Regole in più per la Compagnia (stesso codice ogni sera):
   - "PRIMA GUARDO, POI PARLO": chi apre una stanza con un codice
     fisso (o si ricollega dopo un buco) prima legge cosa c'è
     scritto nella stanza; se c'è la Sala viva di un altro non
     pubblica niente e chiede all'app cosa fare (di solito entra
     da amico). Così un telefono rimasto addormentato non copre
     la Sala di stasera;
   - "SBIRCIARE": per sapere se nelle Compagnie c'è qualcuno basta
     un collegamento solo, che legge e chiude subito (niente
     "Mi ricollego…" sullo schermo);
   - SEGUIRE UN HOST NUOVO: quando la Sala passa a un altro amico
     l'app dice quale sessione seguire (seguiHost); quella di prima
     da lì in poi non conta più, nemmeno il suo "host sparito".
     Un "host sparito" non cambia mai la sessione che si segue.
   ========================================================= */
(function () {
  "use strict";

  var BROKER = "wss://broker.hivemq.com:8884/mqtt";
  var BASE = "seratagiochi/v1/";
  var ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // niente caratteri ambigui
  var ATTESA_OSPITE = 20000;   // chi sparisce all'improvviso: tanto tempo per tornare prima di toglierlo
  var ATTESA_HOST = 120000;    // se sparisce l'host (es. è andato a mandare il link su WhatsApp), gli altri lo aspettano 2 minuti
  var RIPETI_ENTRATA = 2000, MAX_RIPETI = 45, RIPETI_LENTO = 10000;   // "sono entrato" ogni 2 secondi per un minuto e mezzo, poi ogni 10 finché non si è dentro
  var CI_SONO = 15000;         // chi è dentro lo ripete ogni tanto (se è stato zitto): così un "sparito" in ritardo non lo toglie
  var DURATA_ID = 6 * 3600 * 1000;
  var MUTA = 8000;             // chi entra e per 8 secondi non sente l'host: "la stanza non risponde"
  var ATTESA_PRIMO = 15000;    // il primo collegamento non riesce: il gioco lo sa solo dopo 15 secondi di tentativi
  var LENTO = 3000;            // il primo collegamento tarda: si mostra "📶 Mi ricollego…"

  // chi rientra nella stessa stanza (pagina ricaricata, app riaperta) torna con lo STESSO codice:
  // l'host lo riconosce e gli ridà il suo posto, invece di prenderlo per uno nuovo
  function idPerStanza(codice) {
    var k = "sg-id-" + String(codice).toUpperCase(), id = null;
    try { var v = JSON.parse(localStorage.getItem(k) || "null"); if (v && v.id && Date.now() - v.t < DURATA_ID) id = v.id; } catch (e) {}
    if (!id) id = "g" + Math.random().toString(36).slice(2, 9);
    try { localStorage.setItem(k, JSON.stringify({ id: id, t: Date.now() })); } catch (e) {}
    return id;
  }

  // avvisi per l'app (li mostra core.js): l'host è sparito o è tornato ("⏳ Aspettiamo l'host…"),
  // la rete è giù ("📶 Mi ricollego…"), la stanza è ferma ("😴 La stanza è ferma")
  function evento(nome, dettagli) { try { window.dispatchEvent(new CustomEvent(nome, { detail: dettagli })); } catch (e) {} }
  function avvisaHost(stanza, via) { evento("sg-host", { stanza: stanza, via: !!via }); }
  // le cose che valgono solo adesso (una faccina, il 3-2-1): con la rete giù si perdono, non aspettano in coda
  function effimero(msg) { return !!(msg && (msg.t === "__faccina" || msg.t === "__fa" || msg.t === "__via")); }

  function codiceACaso(n) {
    var s = "";
    for (var i = 0; i < (n || 4); i++) s += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
    return s;
  }
  // (cresce col tempo: tra due sessioni dello stesso host, la più nuova è la "più grande")
  function nuovaSessione() { return ("000000000" + Date.now().toString(36)).slice(-9) + Math.random().toString(36).slice(2, 5); }
  function topics(codice) {
    codice = String(codice).toUpperCase();
    return { stato: BASE + codice + "/stato", azioni: BASE + codice + "/azioni" };
  }
  function delCore(m) { return !!(m && typeof m.t === "string" && m.t.slice(0, 2) === "__"); }   // i messaggi del collegamento e dell'app (non dei giochi)

  // le stanze dei giochi aperte da questo telefono (non la sala): quando si passa a un altro
  // gioco o si torna alla home si chiudono tutte, così non restano collegamenti vecchi
  var aperte = [];
  function segna(h, tieni) { if (!tieni) aperte.push(h); return h; }
  function togli(h) { aperte = aperte.filter(function (x) { return x !== h; }); }

  // ---- il collegamento al broker ----
  // Il broker pubblico a volte tarda (circa 1 volta su 4 ci mette 7 secondi invece di 0,15): se dopo un secondo e mezzo
  // non ha ancora risposto si apre un secondo collegamento e si tiene il primo che risponde (l'altro si chiude).
  // pronto(client) arriva una volta sola, al primo collegamento; poi i ricollegamenti li fa mqtt da solo.
  // errore(e) solo se il primo collegamento non arriva entro 15 secondi (mqtt intanto riprova da solo);
  // dopo, la rete che salta è solo un avviso ("sg-rete": "📶 Mi ricollego…").
  // errore = null: collegamento "muto" (la sbirciata): nessun avviso sullo schermo
  var GARA = 1500, nCol = 0;
  function collega(opzioni, pronto, errore) {
    var tutti = [], vinto = null, finito = false, ultimoErr = null, id = ++nCol, giu = false;
    function rete(stato) { if (!errore || stato === giu) return; giu = stato; evento("sg-rete", { id: id, giu: stato }); }
    function apri() {
      var c = mqtt.connect(BROKER, opzioni); tutti.push(c);
      c.on("error", function (e) { if (!vinto && !finito) ultimoErr = e; });
      c.on("connect", function () {
        if (finito) return;
        if (vinto && c !== vinto) return;
        rete(false);
        if (vinto) return;   // ricollegato dopo un buco: ci pensa chi usa il collegamento
        vinto = c; clearTimeout(tGara); clearTimeout(tErr); clearTimeout(tLento);
        tutti.forEach(function (x) { if (x !== c) try { x.end(); } catch (e) {} });   // (uscita educata: il broker non manda il "testamento")
        pronto(c);
      });
      // la rete è saltata dopo il collegamento: niente errori al gioco, solo l'avviso "Mi ricollego…" (mqtt riprova da solo)
      function caduto() { if (!finito && vinto === c) rete(true); }
      c.on("close", caduto); c.on("offline", caduto);
      return c;
    }
    apri();
    var tGara = setTimeout(function () { if (!vinto && !finito) apri(); }, GARA);
    var tLento = setTimeout(function () { if (!vinto && !finito && errore) rete(true); }, LENTO);
    // il primo collegamento non arriva proprio: smetto di provare e lo dico al gioco ("Problema di collegamento", si riprova da capo)
    var tErr = setTimeout(function () {
      if (vinto || finito) return;
      finito = true; clearTimeout(tGara); clearTimeout(tLento); rete(false);
      tutti.forEach(function (x) { try { x.end(true); } catch (e) {} });
      if (errore) errore(ultimoErr || { message: "nessuna risposta" });
    }, ATTESA_PRIMO);
    return { chiudi: function () {
      finito = true; clearTimeout(tGara); clearTimeout(tErr); clearTimeout(tLento); rete(false);
      tutti.forEach(function (x) { if (x !== vinto) try { x.end(true); } catch (e) {} });
    } };
  }
  // tornando nell'app (schermo sbloccato, di nuovo in rete) chi ha perso il collegamento si ricollega subito,
  // senza aspettare il prossimo tentativo
  var vivi = [];
  function ravviva() { vivi.forEach(function (c) { try { if (!c.connected && !c.disconnecting && typeof c.reconnect === "function") c.reconnect(); } catch (e) {} }); }
  try {
    document.addEventListener("visibilitychange", function () { if (!document.hidden) ravviva(); });
    window.addEventListener("online", ravviva); window.addEventListener("pageshow", ravviva);
  } catch (e) {}
  var KEEPALIVE = 20;   // ogni quanti secondi si dice al broker "ci sono": un collegamento morto si scopre in 20-40 secondi (non 2 minuti)
  var CODA_MAX = 40, CODA_VITA = 30000;   // quello che si manda mentre la rete è giù: parte appena torna (al massimo 40 messaggi, di non più di 30 secondi fa)

  window.SGNet = {
    disponibile: function () { return typeof mqtt !== "undefined"; },

    // Genera un codice stanza (usato dalla "sala" per preparare il codice
    // di un gioco prima ancora di aprirlo). nuovoCodice(6) = 6 lettere (le Compagnie), se no 4.
    nuovoCodice: function (n) { return codiceACaso(n === 6 ? 6 : 4); },

    // Chiude le stanze dei giochi rimaste aperte (la sala no). ritardo (ms): le chiude un po' dopo,
    // ma solo quelle aperte adesso (serve all'host: prima gli altri tornano in sala, poi si chiude).
    chiudiGiochi: function (ritardo) {
      var a = aperte.slice(); aperte = [];
      function via() { a.forEach(function (h) { try { h.chiudi(); } catch (e) {} }); }
      if (ritardo) setTimeout(via, ritardo); else via();
    },

    // Ricorda con quale codice-giocatore questo telefono sta in una stanza (es. "host"):
    // se poi ci rientra come ospite (host di riserva, app riaperta) torna la stessa persona.
    ricordaId: function (codice, id) {
      try { localStorage.setItem("sg-id-" + String(codice).toUpperCase(), JSON.stringify({ id: id, t: Date.now() })); } catch (e) {}
    },

    // L'host apre una stanza. cb: { onCodice, onConnesso, onAddio(id), onMsg(id,msg), onErrore(e), onStato(msg),
    //   onForse(id) / onTornato(id) (facoltativi: un ospite sparito senza salutare, e tornato in tempo) }
    // opz (facoltative): codice = la stanza ha già il suo codice (host di riserva, stanza riaperta dopo una ricarica);
    // ascoltaStato = riceve anche quello che mandano gli host (onStato), così si accorge se un altro ha preso il posto;
    // keepalive = ogni quanti secondi dice al broker "ci sono" (più basso = se sparisce ce ne si accorge prima)
    // "Prima guardo, poi parlo" (la Sala con un codice fisso, o che si ricollega dopo un buco):
    // guardaPrima = ms (es. 1200): a ogni collegamento, anche il primo, prima di pubblicare qualcosa legge la foto
    //   trattenuta nella stanza (decide appena arriva, o 400 ms dopo l'iscrizione, al massimo dopo guardaPrima ms).
    //   Se è la foto viva di un'altra sessione: cb.onOccupata(msg); se torna true si va avanti, se no non si pubblica
    //   niente (l'app farà lascia()). Intanto invia mette in coda, e cb.onConnesso arriva solo dopo la decisione;
    // guardaRitorno = ms: lo stesso, ma solo quando si ricollega (non al primo collegamento);
    // sopra = la sessione di una Sala morta che sto riaprendo: la sua foto non conta come "occupata";
    // testamento = campi in più nel "host sparito" (es. { g: 3 } → { t: "__hostgone", s, g: 3 })
    ospita: function (giocoId, cb, opz) {
      if (!this.disponibile()) { cb.onErrore && cb.onErrore({ type: "no-mqtt" }); return null; }
      opz = opz || {};
      // La "sala" può imporre il codice della stanza (così lo conosce in anticipo
      // e lo manda agli altri per farli entrare in automatico).
      var codice = String(opz.codice || SGNet._forza || codiceACaso(4)).toUpperCase();
      SGNet._forza = null;
      var T = topics(codice);
      var META = BASE + codice + "/meta";
      // ogni apertura ha la sua sessione: va nelle foto trattenute (_s) e in "__hostqui"; chi è dentro capisce
      // così se l'host ha riaperto la stanza (pagina ricaricata) e rientra da solo
      var sid = nuovaSessione();
      var chiusa = false, client = null, risposto = 0;
      var inForse = {};   // chi è sparito all'improvviso: id -> timer (se si rifà vivo in tempo, resta dentro)
      var coda = [], ultimo = null;   // coda: quello mandato con la rete giù (parte appena torna); ultimo: l'ultima foto della partita
      // prima guardo, poi parlo: guardando = sto leggendo la stanza (non pubblico niente); ceduto = c'era la Sala di un
      // altro e non pubblico più niente (l'app chiude); passato = c'è già stato un collegamento (i prossimi sono ritorni)
      var guardando = false, ceduto = false, passato = false, giro = 0, decidi = null;
      // Il codice si conosce SUBITO (non dipende dal collegamento): mostralo subito,
      // così la stanza dà sempre il codice anche se la rete è lenta a collegarsi.
      // (un tick dopo, così chi ci chiama ha già ricevuto l'oggetto "rete")
      setTimeout(function () { if (!chiusa) cb.onCodice && cb.onCodice(codice); }, 0);
      function conSessione(msg) {
        if (!msg || typeof msg !== "object") return msg;
        var o = {}; for (var k in msg) if (Object.prototype.hasOwnProperty.call(msg, k)) o[k] = msg[k];
        o._s = sid; return o;
      }
      function testamento() {
        var o = { t: "__hostgone", s: sid }, x = opz.testamento;
        if (x && typeof x === "object") for (var k in x) if (Object.prototype.hasOwnProperty.call(x, k) && k !== "t" && k !== "s" && k !== "voluto") o[k] = x[k];
        return o;
      }
      function manda(msg, trattieni) {
        if (client && client.connected && !guardando && !ceduto) { try { client.publish(T.stato, JSON.stringify(trattieni ? conSessione(msg) : msg), { retain: !!trattieni }); return; } catch (e) {} }
        if (!trattieni && effimero(msg)) return;
        coda.push({ m: msg, r: !!trattieni, t: Date.now() }); if (coda.length > CODA_MAX) coda.shift();   // la rete è giù: la mossa non si perde
      }
      // chi è sparito all'improvviso e ha ancora tempo per tornare: l'app lo mostra grigio con 📶 ("si sta ricollegando…")
      // Anche il gioco lo sa subito, se vuole: cb.onForse(id) quando sparisce senza salutare, cb.onTornato(id) quando
      // si rifà vivo in tempo (es. "📶…" sulla sua targa). Se non torna, dopo 20 secondi arriva onAddio(id) come sempre
      function forse(id, si, tornato) {
        evento("sg-forse", { stanza: codice, id: id, forse: !!si });
        try { if (si) { if (cb.onForse) cb.onForse(id); } else if (tornato && cb.onTornato) cb.onTornato(id); } catch (e) {}
      }
      function svuota() { var ora = Date.now(), l = coda; coda = []; l.forEach(function (x) { if (x.r || ora - x.t < CODA_VITA) manda(x.m, x.r); }); }
      function ciSono() { if (guardando || ceduto) return; try { if (client && client.connected) client.publish(T.stato, JSON.stringify({ t: "__hostqui", s: sid }), { retain: false }); } catch (e) {} }
      // il testamento di un mio collegamento di prima arriva in ritardo (rete cambiata, telefono che si riprende:
      // il broker se ne accorge anche 30 secondi dopo) e copre la mia foto: dico che ci sono e la rimetto
      var rimesso = 0;
      function rimetti() {
        if (chiusa || guardando || ceduto || !client || !client.connected || Date.now() - rimesso < 1000) return;
        rimesso = Date.now(); ciSono();
        if (ultimo) manda(ultimo, true); else try { client.publish(T.stato, "", { retain: true }); } catch (e) {}
      }
      function collegato() {
        if (chiusa || ceduto) return;
        var g = opz.guardaPrima || (passato ? opz.guardaRitorno : 0);
        passato = true;
        if (g) return guarda(g);
        parla(false);
      }
      // prima guardo: leggo la foto trattenuta della stanza e poi decido se parlare
      function guarda(g) {
        guardando = true;
        var mioGiro = ++giro, fatto = false, t400 = null, tMax = null;
        decidi = function (m) {
          if (fatto || mioGiro !== giro || chiusa) return;
          fatto = true; decidi = null; guardando = false; clearTimeout(t400); clearTimeout(tMax);
          // la Sala viva di un altro (non un "host sparito", non una mia foto, non la Sala morta che sto riaprendo)
          if (m && typeof m === "object" && m._s && m._s !== sid && m._s !== opz.sopra && m.t !== "__hostgone") {
            var avanti = false;
            try { avanti = !!(cb.onOccupata && cb.onOccupata(m) === true); } catch (e) {}
            if (!avanti) { ceduto = true; return; }   // non pubblico niente: l'app esce (lascia) ed entra da amico
          }
          if (!chiusa) parla(true);
        };
        client.subscribe(T.stato, function () { if (!fatto && mioGiro === giro) t400 = setTimeout(function () { if (decidi) decidi(null); }, 400); });
        tMax = setTimeout(function () { if (decidi) decidi(null); }, g);
      }
      // parlo: la stanza è mia (giaStato = sono già iscritto allo stato: guardando)
      function parla(giaStato) {
        if (chiusa || ceduto || !client) return;
        // quando è davvero collegato la stanza è "pronta": lo comunichiamo al gioco
        client.subscribe(T.azioni, function () { if (!chiusa) cb.onConnesso && cb.onConnesso(); });
        if (!giaStato) client.subscribe(T.stato);   // anche la mia stanza: così mi accorgo di un "host sparito" che non è vero (vedi rimetti)
        // annuncia QUALE gioco è questa stanza, così chi entra col codice apre quello giusto
        try { client.publish(META, JSON.stringify({ g: giocoId || "" }), { retain: true }); } catch (e) {}
        // "ci sono", con la mia sessione: a ogni collegamento, anche il primo (chi aspettava sa che sono tornato,
        // e se la sessione è nuova, cioè ho riaperto la stanza, rientra da solo)
        ciSono();
        var inCoda = coda.some(function (x) { return x.r; });
        if (ultimo && !inCoda) manda(ultimo, true);   // rimetto l'ultima foto (il testamento "host sparito" l'aveva coperta)
        else if (!ultimo && !inCoda) try { client.publish(T.stato, "", { retain: true }); } catch (e) {}   // nessuna foto ancora: tolgo un vecchio "host sparito"
        svuota();   // quello che ho fatto mentre la rete era giù
      }
      function messaggio(topic, payload, pacchetto) {
        if (chiusa) return;
        if (topic === T.stato) {
          var tx = payload.toString(), trat = !!(pacchetto && pacchetto.retain);
          // sto guardando: la foto trattenuta decide se parlo (vedi guarda)
          if (guardando && trat) { var mt = null; try { mt = JSON.parse(tx || "null"); } catch (e) {} if (decidi) decidi(mt); return; }
          // dal vivo, mentre io ci sono: un "host sparito" (non voluto) è di un mio collegamento vecchio
          // (quello trattenuto che trovo collegandomi l'ho già sistemato in collegato())
          if (!trat && tx.indexOf('"__hostgone"') >= 0 && tx.indexOf('"voluto"') < 0) rimetti();
          if (!opz.ascoltaStato) return;
          // (con ascoltaStato) quello che mandano gli host: anche uno che ha preso il nostro posto
          var s; try { s = JSON.parse(tx || "null"); } catch (e) { return; }
          if (s && cb.onStato) cb.onStato(s, trat);
          return;
        }
        var m; try { m = JSON.parse(payload.toString()); } catch (e) { return; }
        if (!m || !m.from) return;
        if (inForse[m.from]) { clearTimeout(inForse[m.from]); delete inForse[m.from]; forse(m.from, false, true); }   // si è rifatto vivo in tempo
        if (m.data && m.data.t === "__leave") {
          if (m.data.voluto) { cb.onAddio && cb.onAddio(m.from); return; }   // è uscito apposta
          // sparito all'improvviso: lo aspetto un po' prima di toglierlo dalla partita
          var chi = m.from;
          inForse[chi] = setTimeout(function () { delete inForse[chi]; if (!chiusa) cb.onAddio && cb.onAddio(chi); forse(chi, false); }, ATTESA_OSPITE);
          forse(chi, true);
          return;
        }
        if (m.data && m.data.t === "__ci") return;   // "ci sono": serve solo a non toglierlo (qui sopra), il gioco non lo vede
        // chi bussa sa subito che ci sono, anche se il gioco non gli risponde (al massimo una volta al secondo)
        if (m.data && m.data.t === "join" && Date.now() - risposto > 1000) { risposto = Date.now(); ciSono(); }
        cb.onMsg && cb.onMsg(m.from, m.data);
      }
      var collegamento = collega({
        clean: true, reconnectPeriod: 2000, keepalive: opz.keepalive || KEEPALIVE,
        // Se l'host sparisce all'improvviso il broker lo dice a tutti e lo LASCIA nella stanza (trattenuto):
        // chi arriva dopo trova "host sparito" invece della foto ferma di una partita che non va avanti
        // (opz.testamento: campi in più, es. la generazione della Sala { g: 3 })
        will: { topic: T.stato, payload: JSON.stringify(testamento()), retain: true }
      }, function (c) {
        client = c; vivi.push(c);
        c.on("connect", collegato); c.on("message", messaggio);
        collegato();
      }, function (e) { if (!chiusa) cb.onErrore && cb.onErrore({ type: "mqtt", message: e && e.message }); });
      function fine() { chiusa = true; togli(h); collegamento.chiudi(); vivi = vivi.filter(function (x) { return x !== client; }); Object.keys(inForse).forEach(function (k) { clearTimeout(inForse[k]); }); inForse = {}; coda = []; }

      var h = {
        codice: codice, sessione: sid,
        // la partita (vm) viene mandata a tutti e "trattenuta" (retain) così
        // chi entra dopo riceve subito lo stato attuale
        invia: function (msg) { if (chiusa) return; ultimo = msg; manda(msg, true); },
        // invio ad alta frequenza (streaming di gioco): NON trattenuto, per non intasare il broker
        inviaVeloce: function (msg) { if (!chiusa) manda(msg, false); },
        // un messaggio per uno solo (il gioco ci mette dentro a chi va): NON trattenuto, così non prende il posto
        // dell'ultima foto della partita (chi arriva dopo deve trovare la foto, non il messaggio privato di un altro)
        inviaA: function (id, msg) { if (!chiusa) manda(msg, false); },
        // se ne va in silenzio SENZA chiudere la stanza: un altro telefono ha preso il posto di host
        lascia: function () {
          if (chiusa) return;
          fine();
          try { if (client) client.end(); } catch (e) {}   // uscita "educata": il broker non manda l'avviso "host sparito"
        },
        chiudi: function () {
          if (chiusa) return;
          fine();
          try {
            if (!client) return;
            client.publish(T.stato, JSON.stringify({ t: "__hostgone", voluto: 1, s: sid }), { retain: false });   // chiusa apposta: gli altri escono subito
            client.publish(T.stato, "", { retain: true }); // pulisce lo stato trattenuto
            client.publish(META, "", { retain: true });    // pulisce l'annuncio del gioco
            client.end();
          } catch (e) {}
        }
      };
      return segna(h, giocoId === "__sala");   // la sala resta aperta tra un gioco e l'altro
    },

    // Un ospite entra con il codice. cb: { onAperto(id), onMsg(msg), onChiuso(perché: { voluto } o { sparito }), onErrore(e), onHostVia(sparito),
    //   onHostNuovo(eraDentro, eraVivo, msg) } (msg = il messaggio dell'host nuovo: "Paky è tornato" o "ora la tiene Luca")
    // opz.tieni = non chiuderla quando si cambia gioco (è la connessione della sala);
    // opz.guarda = guarda soltanto (non entra: niente "stanza ferma", aspetta l'host come chi è dentro);
    // opz.decideApp = (la Sala) la rete non passa da sola a una sessione nuova: la foto di un'altra sessione arriva a
    //   cb.onMsg (col suo _s) e l'app decide; se lì chiama h.seguiHost(quella sessione), subito dopo arriva
    //   cb.onHostNuovo(eraDentro, eraVivo, msg). Un "host sparito" conta solo se è della sessione che seguo.
    // h.seguiHost(s): da ora seguo la sessione s (anche se "più piccola": orologi diversi), quella di prima non conta più
    entra: function (codice, cb, opz) {
      if (!this.disponibile()) { cb.onErrore && cb.onErrore({ type: "no-mqtt" }); return null; }
      opz = opz || {};
      codice = String(codice).toUpperCase();
      var myId = idPerStanza(codice);   // rientrando nella stessa stanza si torna "la stessa persona"
      var T = topics(codice), client = null, coda = [];
      var aperto = false, chiusa = false, entrata = null, dentro = false, tRipeti = null, tAddio = null, tCi = null, ultimoInvio = 0;
      var ultimoJoin = 0, primoJoin = 0, nRipeti = 0;
      var sessione = null;     // la sessione dell'host che conosco: se cambia, l'host ha riaperto la stanza
      var scartate = {};       // sessioni lasciate apposta (seguiHost): foto, "ci sono" e "host sparito" di quelle non contano più
      var vivo = false;        // ho sentito l'host dal vivo (non solo la foto trattenuta)
      var ferma = false;       // l'host non c'è: "la stanza è ferma" (o "non risponde")
      var tMuta = null;
      var foto = false, presente = false;   // l'ultima foto dell'host (messaggio trattenuto, con _s) ha il mio id?
      function pubblica(msg) {
        if (client && client.connected) {
          try { client.publish(T.azioni, JSON.stringify({ from: myId, data: msg }), { retain: false }); ultimoInvio = Date.now(); if (msg && msg.t === "join") ultimoJoin = ultimoInvio; return; } catch (e) {}
        }
        if (!msg || msg.t === "join" || msg.t === "__ci" || effimero(msg)) return;   // ("sono entrato" e "ci sono" li ripeto comunque appena torna la rete; una faccina vale solo adesso)
        coda.push({ m: msg, t: Date.now() }); if (coda.length > CODA_MAX) coda.shift();   // la rete è giù: la mossa parte appena torna
      }
      function svuota() { var ora = Date.now(), l = coda; coda = []; l.forEach(function (x) { if (ora - x.t < CODA_VITA) pubblica(x.m); }); }
      function smetti() { if (tRipeti) { clearTimeout(tRipeti); tRipeti = null; } }
      // "sono entrato" può perdersi (stanza non ancora pronta, host via un attimo):
      // lo ripeto finché l'host non mi mette dentro (il mio codice compare nei suoi messaggi).
      // Dopo un minuto e mezzo non smetto: rallento (uno ogni 10 secondi), così alla "Nuova partita" entro anch'io
      function insisti() {
        smetti(); nRipeti = 0;
        (function giro() {
          tRipeti = setTimeout(function () {
            tRipeti = null;
            if (dentro || chiusa || !entrata) return;
            pubblica(entrata); nRipeti++;
            giro();
          }, nRipeti < MAX_RIPETI ? RIPETI_ENTRATA : RIPETI_LENTO);
        })();
      }
      function fermaStanza(muta) {   // l'host non c'è: lo dico subito (l'app mostra "la stanza è ferma"); se torna, si entra da soli
        if (ferma) return;
        ferma = true; clearTimeout(tMuta); tMuta = null;
        evento("sg-stanza-ferma", { stanza: codice, ferma: true, muta: !!muta });
      }
      function collegato() {
        if (chiusa) return;
        client.subscribe(T.stato, function () {
          if (chiusa) return;
          if (!aperto) { aperto = true; cb.onAperto && cb.onAperto(myId); }
          else if (entrata) pubblica(entrata);   // ricollegato dopo un buco: ripeto che ci sono (l'host non mi toglie)
          svuota();   // e mando le mosse fatte mentre la rete era giù
        });
      }
      function messaggio(_t, payload, pacchetto) {
        if (chiusa) return;
        var testo = payload.toString(); if (!testo) return;
        var m; try { m = JSON.parse(testo); } catch (e) { return; }
        if (!m) return;
        var trattenuto = !!(pacchetto && pacchetto.retain), sparito = m.t === "__hostgone", eraVivo = vivo;   // (eraVivo: avevo già sentito l'host dal vivo)
        var s = m._s || ((m.t === "__hostqui" || sparito) ? m.s : null);
        // una sessione lasciata apposta (seguiHost): niente di quello che manda conta più
        if (s && scartate[s]) return;
        // un "host sparito" di una sessione vecchia (il broker se n'è accorto tardi e l'host intanto ha riaperto): non conta.
        // Con decideApp conta solo quello della sessione che seguo (anche quando l'host chiude apposta)
        if (sparito && s && sessione && (opz.decideApp ? s !== sessione : (!m.voluto && s < sessione))) return;
        var seguita = false;   // (decideApp) l'app ha appena scelto di seguire questa sessione: il messaggio l'ha già visto
        if (opz.decideApp && s && sessione && s !== sessione) {
          // la foto di un'altra Sala sullo stesso codice: decide l'app (regola della Sala) e, se vuole, chiama seguiHost
          if (m.t === "__hostqui" || sparito) return;
          var eraDentroA = dentro;
          if (cb.onMsg) cb.onMsg(m);
          if (chiusa || sessione !== s) return;   // l'app non la segue: per me non esiste
          if (cb.onHostNuovo) cb.onHostNuovo(eraDentroA, eraVivo, m);
          if (chiusa) return;
          seguita = true;
        }
        if (!trattenuto && !sparito) {   // l'host c'è, dal vivo
          vivo = true; clearTimeout(tMuta); tMuta = null;
          if (ferma) { ferma = false; evento("sg-stanza-ferma", { stanza: codice, ferma: false }); }
          if (tAddio) { clearTimeout(tAddio); tAddio = null; avvisaHost(T.stato, false); cb.onHostVia && cb.onHostVia(false); }
        }
        // (un "host sparito" non cambia mai la sessione che conosco: uno di una sessione più nuova non deve far scartare
        // come "vecchio" il testamento vero del mio host)
        if (s && !sparito && (!sessione || (!opz.decideApp && s > sessione))) {
          var prima = sessione; sessione = s;
          if (prima) {   // l'host ha riaperto la stanza (pagina ricaricata, app riaperta): si rientra da capo
            var eraDentro = dentro;
            dentro = false; foto = false; presente = false;
            if (entrata) { pubblica(entrata); insisti(); }
            if (cb.onHostNuovo) cb.onHostNuovo(eraDentro, eraVivo, m);
            if (chiusa) return;   // (l'app ha riavviato il gioco con un collegamento nuovo)
          }
        }
        var mio = !delCore(m) && testo.indexOf('"' + myId + '"') >= 0;
        if (entrata && !dentro && mio) { dentro = true; smetti(); clearTimeout(tMuta); tMuta = null; }   // l'host mi ha messo nella partita
        if (m._s) { foto = true; presente = mio; }
        if (m.t === "__hostqui" || seguita) return;
        if (sparito) {
          if (m.voluto) { cb.onChiuso && cb.onChiuso({ voluto: true }); return; }   // chiusa apposta
          // non ero ancora dentro (sono appena arrivato): la stanza è ferma, lo dico subito e aspetto che torni
          // (chi aveva già sentito l'host dal vivo, anche se non è ancora "dentro", lo aspetta come gli altri)
          if (!dentro && !eraVivo && !opz.guarda) return fermaStanza(false);
          // ero dentro, sparito all'improvviso (schermo bloccato, cambio app): gli do tempo di tornare (e lo dico sullo schermo)
          if (!tAddio) { avvisaHost(T.stato, true); tAddio = setTimeout(function () { tAddio = null; avvisaHost(T.stato, false); if (!chiusa) cb.onChiuso && cb.onChiuso({ sparito: true }); }, ATTESA_HOST); }
          cb.onHostVia && cb.onHostVia(true);   // un gioco con l'host di riserva può prendere il suo posto
          return;
        }
        cb.onMsg && cb.onMsg(m);
      }
      var collegamento = collega({
        clean: true, reconnectPeriod: 2000, keepalive: KEEPALIVE,
        will: { topic: T.azioni, payload: JSON.stringify({ from: myId, data: { t: "__leave" } }), retain: false }
      }, function (c) {
        client = c; vivi.push(c);
        c.on("connect", collegato); c.on("message", messaggio);
        collegato();
      }, function (e) { if (!chiusa) cb.onErrore && cb.onErrore({ type: "mqtt", message: e && e.message }); });
      function fine() {
        chiusa = true; togli(h); smetti(); collegamento.chiudi(); vivi = vivi.filter(function (x) { return x !== client; }); coda = [];
        clearTimeout(tMuta); tMuta = null;
        if (tAddio) { clearTimeout(tAddio); tAddio = null; avvisaHost(T.stato, false); }
        if (tCi) { clearInterval(tCi); tCi = null; }
        if (ferma) { ferma = false; evento("sg-stanza-ferma", { stanza: codice, ferma: false }); }
      }

      var h = {
        codice: codice, mioId: myId,
        invia: function (msg) {
          if (chiusa) return;
          pubblica(msg);
          if (msg && msg.t === "join") {
            if (!entrata) {   // il primo "sono entrato": se per 8 secondi l'host non si fa sentire, la stanza non risponde
              primoJoin = Date.now();
              if (!dentro && !vivo && !ferma) tMuta = setTimeout(function () { tMuta = null; if (!chiusa && !vivo && !dentro) fermaStanza(true); }, MUTA);
            }
            entrata = msg; if (!dentro) insisti();
            // "ci sono", ogni tanto, solo se nel frattempo non ho mandato niente (meno messaggi = meno batteria)
            if (!tCi) tCi = setInterval(function () { if (!chiusa && Date.now() - ultimoInvio >= CI_SONO - 1000) pubblica({ t: "__ci" }); }, CI_SONO);
          }
        },
        // come sta il collegamento (per l'app: "Sei dentro", "Sto entrando…", "entri alla prossima")
        stato: function () {
          return { id: myId, aperto: aperto, chiusa: chiusa, dentro: dentro, presente: foto ? presente : dentro, foto: foto,
            vivo: vivo, ferma: ferma, entrato: primoJoin, sessione: sessione };
        },
        // l'app mi vede in saletta ma l'ultima foto dell'host non ha il mio id: chiedo di nuovo di entrare
        // (ero dentro e l'host mi ha tolto, oppure è cominciata una partita nuova e io aspettavo)
        riprova: function () {
          if (chiusa || !entrata) return;
          if (dentro) { dentro = false; pubblica(entrata); insisti(); return; }
          if (Date.now() - ultimoJoin > 3000) pubblica(entrata);
          if (!tRipeti) insisti();
        },
        // l'app ha deciso di seguire un host nuovo (la Sala è passata a un altro, o ha vinto un'altra Sala): da ora la sua
        // sessione è s, anche se è "più piccola" (orologi diversi). Quella di prima non conta più (nemmeno il suo
        // "host sparito"); si ripete "sono entrato" finché il nuovo host non mi mette dentro
        seguiHost: function (s) {
          if (chiusa) return;
          if (s) { s = String(s); if (sessione && sessione !== s) scartate[sessione] = 1; delete scartate[s]; sessione = s; }
          dentro = false; foto = false; presente = false;
          if (ferma) { ferma = false; evento("sg-stanza-ferma", { stanza: codice, ferma: false }); }
          if (entrata) { pubblica(entrata); insisti(); }
        },
        // l'app sa che per ora non entro (gioco a due già pieno: guardo): "sono entrato" solo ogni tanto, per non disturbare
        calma: function () { if (nRipeti < MAX_RIPETI) nRipeti = MAX_RIPETI; },
        // se ne va in silenzio (senza dire "esco"): serve all'host di riserva che sta per prendere il posto dell'host
        lascia: function () {
          if (chiusa) return;
          fine();
          try { if (client) client.end(); } catch (e) {}
        },
        chiudi: function () {
          if (chiusa) return;
          fine();
          try { if (client) { client.publish(T.azioni, JSON.stringify({ from: myId, data: { t: "__leave", voluto: 1 } }), { retain: false }); client.end(); } } catch (e) {}
        }
      };
      return segna(h, opz.tieni);
    },

    // Scopre QUALE gioco si sta giocando in una stanza, dal solo codice.
    // Così chi entra digitando il codice apre il gioco giusto e non un altro.
    // cb(idGioco, { ferma }) : idGioco = null se non c'è nessuna stanza con quel codice;
    // ferma = l'host è sparito (chi entra lo saprà subito). Risponde 2 secondi dopo l'iscrizione (non 10).
    scopriGioco: function (codice, cb) {
      if (!this.disponibile()) { cb(null, {}); return; }
      var C = String(codice).toUpperCase(), META = BASE + C + "/meta", STATO = BASE + C + "/stato";
      var fatto = false, client = null, g = null, ferma = false, statoVisto = false, tFine = null, tMax = null;
      function fine() {
        if (fatto) return; fatto = true; clearTimeout(tFine); clearTimeout(tMax);
        collegamento.chiudi(); try { if (client) client.end(true); } catch (e) {}
        cb(g || null, { ferma: ferma });
      }
      var collegamento = collega({ clean: true, reconnectPeriod: 0 }, function (c) {
        client = c;
        c.on("message", function (topic, payload) {
          var m = null; try { m = JSON.parse(payload.toString() || "null"); } catch (e) {}
          if (topic === META) {
            g = m && m.g;
            clearTimeout(tFine); tFine = setTimeout(fine, statoVisto ? 0 : 400);   // (lo stato di solito arriva subito dopo)
          } else {
            statoVisto = true; ferma = !!(m && m.t === "__hostgone" && !m.voluto);
            if (g) { clearTimeout(tFine); fine(); }
          }
        });
        c.subscribe([META, STATO], function () { if (!fatto && !g) tFine = setTimeout(fine, 2000); });
      }, function () {});
      tMax = setTimeout(fine, 10000);   // il collegamento non arriva proprio
    },

    // Sbircia in più stanze (le Compagnie della home) con UN collegamento solo, che legge e chiude subito:
    // niente "📶 Mi ricollego…" sullo schermo. codici: al massimo 12 (maiuscole, senza doppioni).
    // cb(esito) una volta sola: esito[C] = { stato, msg, gen }
    //   stato "viva" = c'è la foto di una Sala (o di una partita) con l'host; "ferma" = l'host è sparito (testamento);
    //   "vuota" = non c'è niente; "boh" = il collegamento non è arrivato. msg = il messaggio letto (o null);
    //   gen = msg.gen o msg.g (la generazione della Sala) o 0.
    // Risponde 400 ms dopo l'iscrizione (o subito, se hanno già risposto tutte), al massimo dopo 6 secondi.
    sbircia: function (codici, cb) {
      var lista = [], visti = {};
      (Array.isArray(codici) ? codici : [codici]).forEach(function (c) {
        c = String(c == null ? "" : c).trim().toUpperCase();
        if (c && !visti[c] && lista.length < 12) { visti[c] = 1; lista.push(c); }
      });
      var esito = {}, nVisti = 0, fatto = false, arrivato = false, client = null, collegamento = null, tFine = null, tMax = null, perTopic = {};
      lista.forEach(function (c) { perTopic[topics(c).stato] = c; });
      function fine() {
        if (fatto) return; fatto = true; clearTimeout(tFine); clearTimeout(tMax);
        try { if (collegamento) collegamento.chiudi(); } catch (e) {}
        try { if (client) client.end(true); } catch (e) {}
        lista.forEach(function (c) { if (!esito[c]) esito[c] = { stato: arrivato ? "vuota" : "boh", msg: null, gen: 0 }; });
        try { if (cb) cb(esito); } catch (e) {}
      }
      if (!lista.length || !window.SGNet.disponibile()) { setTimeout(fine, 0); return; }
      collegamento = collega({ clean: true, reconnectPeriod: 0 }, function (c) {
        client = c;
        if (fatto) { try { c.end(true); } catch (e) {} return; }
        arrivato = true;
        c.on("message", function (topic, payload) {
          var C = perTopic[topic];
          if (fatto || !C || esito[C]) return;
          var m = null; try { m = JSON.parse(payload.toString() || "null"); } catch (e) { return; }
          if (!m || typeof m !== "object") return;
          var st = null;
          if (m.t === "__hostgone") { if (!m.voluto) st = "ferma"; }   // (chiusa apposta: tra poco è vuota)
          else if (m._s || m.t === "sala" || m.t === "__hostqui") st = "viva";
          if (!st) return;
          esito[C] = { stato: st, msg: m, gen: +(m.gen || m.g) || 0 };
          if (++nVisti >= lista.length) fine();   // hanno già risposto tutte
        });
        c.subscribe(Object.keys(perTopic), function () { if (!fatto) tFine = setTimeout(fine, 400); });
      }, null);   // (null = collegamento muto: niente avvisi sullo schermo)
      tMax = setTimeout(fine, 6000);
    }
  };
})();

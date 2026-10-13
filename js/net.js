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
     di tempo per tornare, e quando torna ripete che c'è;
   - se sparisce l'host, gli altri lo aspettano prima di arrendersi.
   Chi esce apposta (tasto Esci) esce subito.
   ========================================================= */
(function () {
  "use strict";

  var BROKER = "wss://broker.hivemq.com:8884/mqtt";
  var BASE = "seratagiochi/v1/";
  var ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // niente caratteri ambigui
  var ATTESA_OSPITE = 20000;   // chi sparisce all'improvviso: tanto tempo per tornare prima di toglierlo
  var ATTESA_HOST = 120000;    // se sparisce l'host (es. è andato a mandare il link su WhatsApp), gli altri lo aspettano 2 minuti
  var RIPETI_ENTRATA = 2000, MAX_RIPETI = 45;   // "sono entrato" ogni 2 secondi, fino a un minuto e mezzo
  var CI_SONO = 15000;         // chi è dentro lo ripete ogni tanto (se è stato zitto): così un "sparito" in ritardo non lo toglie
  var DURATA_ID = 6 * 3600 * 1000;

  // chi rientra nella stessa stanza (pagina ricaricata, app riaperta) torna con lo STESSO codice:
  // l'host lo riconosce e gli ridà il suo posto, invece di prenderlo per uno nuovo
  function idPerStanza(codice) {
    var k = "sg-id-" + String(codice).toUpperCase(), id = null;
    try { var v = JSON.parse(localStorage.getItem(k) || "null"); if (v && v.id && Date.now() - v.t < DURATA_ID) id = v.id; } catch (e) {}
    if (!id) id = "g" + Math.random().toString(36).slice(2, 9);
    try { localStorage.setItem(k, JSON.stringify({ id: id, t: Date.now() })); } catch (e) {}
    return id;
  }

  // l'host di una stanza è sparito o è tornato: l'app mostra (o toglie) "⏳ Aspettiamo l'host…"
  function avvisaHost(stanza, via) {
    try { window.dispatchEvent(new CustomEvent("sg-host", { detail: { stanza: stanza, via: !!via } })); } catch (e) {}
  }

  function codiceACaso(n) {
    var s = "";
    for (var i = 0; i < (n || 4); i++) s += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
    return s;
  }
  function topics(codice) {
    codice = String(codice).toUpperCase();
    return { stato: BASE + codice + "/stato", azioni: BASE + codice + "/azioni" };
  }

  // le stanze dei giochi aperte da questo telefono (non la sala): quando si passa a un altro
  // gioco o si torna alla home si chiudono tutte, così non restano collegamenti vecchi
  var aperte = [];
  function segna(h, tieni) { if (!tieni) aperte.push(h); return h; }
  function togli(h) { aperte = aperte.filter(function (x) { return x !== h; }); }

  // ---- il collegamento al broker ----
  // Il broker pubblico a volte tarda (circa 1 volta su 4 ci mette 7 secondi invece di 0,15): se dopo un secondo e mezzo
  // non ha ancora risposto si apre un secondo collegamento e si tiene il primo che risponde (l'altro si chiude).
  // pronto(client) arriva una volta sola, al primo collegamento; poi i ricollegamenti li fa mqtt da solo.
  var GARA = 1500;
  function collega(opzioni, pronto, errore) {
    var tutti = [], vinto = null, finito = false;
    function apri() {
      var c = mqtt.connect(BROKER, opzioni); tutti.push(c);
      c.on("error", function (e) { if (!vinto && !finito && errore) errore(e); });
      c.on("connect", function () {
        if (vinto || finito) return;
        vinto = c; clearTimeout(tGara);
        tutti.forEach(function (x) { if (x !== c) try { x.end(); } catch (e) {} });   // (uscita educata: il broker non manda il "testamento")
        pronto(c);
      });
      return c;
    }
    apri();
    var tGara = setTimeout(function () { if (!vinto && !finito) apri(); }, GARA);
    return { chiudi: function () { finito = true; clearTimeout(tGara); tutti.forEach(function (x) { if (x !== vinto) try { x.end(true); } catch (e) {} }); } };
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
    // di un gioco prima ancora di aprirlo).
    nuovoCodice: function () { return codiceACaso(4); },

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

    // L'host apre una stanza. cb: { onCodice, onConnesso, onAddio(id), onMsg(id,msg), onErrore(e), onStato(msg) }
    // opz (facoltative, per l'host di riserva): codice = prende il posto in una stanza che c'è già;
    // ascoltaStato = riceve anche quello che mandano gli host (onStato), così si accorge se un altro ha preso il posto;
    // keepalive = ogni quanti secondi dice al broker "ci sono" (più basso = se sparisce ce ne si accorge prima)
    ospita: function (giocoId, cb, opz) {
      if (!this.disponibile()) { cb.onErrore && cb.onErrore({ type: "no-mqtt" }); return null; }
      opz = opz || {};
      // La "sala" può imporre il codice della stanza (così lo conosce in anticipo
      // e lo manda agli altri per farli entrare in automatico).
      var codice = opz.codice || SGNet._forza || codiceACaso(4);
      SGNet._forza = null;
      var T = topics(codice);
      var META = BASE + codice + "/meta";
      var chiusa = false, primaVolta = true, client = null;
      var inForse = {};   // chi è sparito all'improvviso: id -> timer (se si rifà vivo in tempo, resta dentro)
      var coda = [], ultimo = null;   // coda: quello mandato con la rete giù (parte appena torna); ultimo: l'ultima foto della partita
      // Il codice si conosce SUBITO (non dipende dal collegamento): mostralo subito,
      // così la stanza dà sempre il codice anche se la rete è lenta a collegarsi.
      // (un tick dopo, così chi ci chiama ha già ricevuto l'oggetto "rete")
      setTimeout(function () { if (!chiusa) cb.onCodice && cb.onCodice(codice); }, 0);
      function manda(msg, trattieni) {
        if (client && client.connected) { try { client.publish(T.stato, JSON.stringify(msg), { retain: !!trattieni }); return; } catch (e) {} }
        coda.push({ m: msg, r: !!trattieni, t: Date.now() }); if (coda.length > CODA_MAX) coda.shift();   // la rete è giù: la mossa non si perde
      }
      function svuota() { var ora = Date.now(), l = coda; coda = []; l.forEach(function (x) { if (x.r || ora - x.t < CODA_VITA) manda(x.m, x.r); }); }
      function collegato() {
        if (chiusa) return;
        // quando è davvero collegato la stanza è "pronta": lo comunichiamo al gioco
        client.subscribe(T.azioni, function () { if (!chiusa) cb.onConnesso && cb.onConnesso(); });
        if (opz.ascoltaStato) client.subscribe(T.stato);
        // annuncia QUALE gioco è questa stanza, così chi entra col codice apre quello giusto
        try { client.publish(META, JSON.stringify({ g: giocoId || "" }), { retain: true }); } catch (e) {}
        if (!primaVolta) {   // tornato dopo un buco (schermo bloccato, cambio app): lo dico a chi aspetta, così nessuno se ne va,
          try { client.publish(T.stato, JSON.stringify({ t: "__hostqui" }), { retain: false }); } catch (e) {}
          if (ultimo && !coda.some(function (x) { return x.r; })) manda(ultimo, true);   // e rimando l'ultima foto della partita
        }
        svuota();   // quello che ho fatto mentre la rete era giù
        primaVolta = false;
      }
      function messaggio(topic, payload, pacchetto) {
        if (chiusa) return;
        if (topic === T.stato) {   // (solo con ascoltaStato) quello che mandano gli host: anche uno che ha preso il nostro posto
          var s; try { s = JSON.parse(payload.toString() || "null"); } catch (e) { return; }
          if (s && cb.onStato) cb.onStato(s, !!(pacchetto && pacchetto.retain));
          return;
        }
        var m; try { m = JSON.parse(payload.toString()); } catch (e) { return; }
        if (!m || !m.from) return;
        if (inForse[m.from]) { clearTimeout(inForse[m.from]); delete inForse[m.from]; }   // si è rifatto vivo in tempo
        if (m.data && m.data.t === "__leave") {
          if (m.data.voluto) { cb.onAddio && cb.onAddio(m.from); return; }   // è uscito apposta
          // sparito all'improvviso: lo aspetto un po' prima di toglierlo dalla partita
          inForse[m.from] = setTimeout(function () { delete inForse[m.from]; if (!chiusa) cb.onAddio && cb.onAddio(m.from); }, ATTESA_OSPITE);
          return;
        }
        if (m.data && m.data.t === "__ci") return;   // "ci sono": serve solo a non toglierlo (qui sopra), il gioco non lo vede
        cb.onMsg && cb.onMsg(m.from, m.data);
      }
      function errore(e) { if (!chiusa) cb.onErrore && cb.onErrore({ type: "mqtt", message: e && e.message }); }
      var collegamento = collega({
        clean: true, reconnectPeriod: 2000, keepalive: opz.keepalive || KEEPALIVE,
        // Se l'host sparisce all'improvviso, avvisa gli altri (che però lo aspettano un po')
        will: { topic: T.stato, payload: JSON.stringify({ t: "__hostgone" }), retain: false }
      }, function (c) {
        client = c; vivi.push(c);
        c.on("connect", collegato); c.on("message", messaggio); c.on("error", errore);
        collegato();
      }, errore);
      function fine() { chiusa = true; togli(h); collegamento.chiudi(); vivi = vivi.filter(function (x) { return x !== client; }); Object.keys(inForse).forEach(function (k) { clearTimeout(inForse[k]); }); inForse = {}; coda = []; }

      var h = {
        // la partita (vm) viene mandata a tutti e "trattenuta" (retain) così
        // chi entra dopo riceve subito lo stato attuale
        invia: function (msg) { if (chiusa) return; ultimo = msg; manda(msg, true); },
        // invio ad alta frequenza (streaming di gioco): NON trattenuto, per non intasare il broker
        inviaVeloce: function (msg) { if (!chiusa) manda(msg, false); },
        inviaA: function (id, msg) { this.invia(msg); },
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
            client.publish(T.stato, JSON.stringify({ t: "__hostgone", voluto: 1 }), { retain: false });   // chiusa apposta: gli altri escono subito
            client.publish(T.stato, "", { retain: true }); // pulisce lo stato trattenuto
            client.publish(META, "", { retain: true });    // pulisce l'annuncio del gioco
            client.end();
          } catch (e) {}
        }
      };
      return segna(h, giocoId === "__sala");   // la sala resta aperta tra un gioco e l'altro
    },

    // Un ospite entra con il codice. cb: { onAperto(id), onMsg(msg), onChiuso, onErrore(e), onHostVia(sparito) }
    // opz.tieni = non chiuderla quando si cambia gioco (è la connessione della sala)
    entra: function (codice, cb, opz) {
      if (!this.disponibile()) { cb.onErrore && cb.onErrore({ type: "no-mqtt" }); return null; }
      var myId = idPerStanza(codice);   // rientrando nella stessa stanza si torna "la stessa persona"
      var T = topics(codice), client = null, coda = [];
      var aperto = false, chiusa = false, entrata = null, dentro = false, tRipeti = null, tAddio = null, tCi = null, ultimoInvio = 0;
      function pubblica(msg) {
        if (client && client.connected) { try { client.publish(T.azioni, JSON.stringify({ from: myId, data: msg }), { retain: false }); ultimoInvio = Date.now(); return; } catch (e) {} }
        if (!msg || msg.t === "join" || msg.t === "__ci") return;   // ("sono entrato" e "ci sono" li ripeto comunque appena torna la rete)
        coda.push({ m: msg, t: Date.now() }); if (coda.length > CODA_MAX) coda.shift();   // la rete è giù: la mossa parte appena torna
      }
      function svuota() { var ora = Date.now(), l = coda; coda = []; l.forEach(function (x) { if (ora - x.t < CODA_VITA) pubblica(x.m); }); }
      function smetti() { if (tRipeti) { clearInterval(tRipeti); tRipeti = null; } }
      // "sono entrato" può perdersi (stanza non ancora pronta, host via un attimo):
      // lo ripeto finché l'host non mi mette dentro (il mio codice compare nei suoi messaggi)
      function insisti() {
        smetti(); var n = 0;
        tRipeti = setInterval(function () { if (dentro || chiusa || ++n > MAX_RIPETI) return smetti(); pubblica(entrata); }, RIPETI_ENTRATA);
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
        if (tAddio && !(pacchetto && pacchetto.retain)) { clearTimeout(tAddio); tAddio = null; avvisaHost(T.stato, false); cb.onHostVia && cb.onHostVia(false); }   // l'host c'è ancora
        if (entrata && !dentro && testo.indexOf('"' + myId + '"') >= 0) { dentro = true; smetti(); }   // l'host mi ha messo nella partita
        if (m.t === "__hostqui") return;
        if (m.t === "__hostgone") {
          if (m.voluto) { cb.onChiuso && cb.onChiuso(); return; }   // chiusa apposta
          // sparito all'improvviso (schermo bloccato, cambio app): gli do tempo di tornare (e lo dico sullo schermo)
          if (!tAddio) { avvisaHost(T.stato, true); tAddio = setTimeout(function () { tAddio = null; avvisaHost(T.stato, false); if (!chiusa) cb.onChiuso && cb.onChiuso(); }, ATTESA_HOST); }
          cb.onHostVia && cb.onHostVia(true);   // un gioco con l'host di riserva può prendere il suo posto
          return;
        }
        cb.onMsg && cb.onMsg(m);
      }
      function errore(e) { if (!chiusa) cb.onErrore && cb.onErrore({ type: "mqtt", message: e && e.message }); }
      var collegamento = collega({
        clean: true, reconnectPeriod: 2000, keepalive: KEEPALIVE,
        will: { topic: T.azioni, payload: JSON.stringify({ from: myId, data: { t: "__leave" } }), retain: false }
      }, function (c) {
        client = c; vivi.push(c);
        c.on("connect", collegato); c.on("message", messaggio); c.on("error", errore);
        collegato();
      }, errore);
      function fine() { chiusa = true; togli(h); smetti(); collegamento.chiudi(); vivi = vivi.filter(function (x) { return x !== client; }); coda = []; if (tAddio) { clearTimeout(tAddio); tAddio = null; avvisaHost(T.stato, false); } if (tCi) { clearInterval(tCi); tCi = null; } }

      var h = {
        invia: function (msg) {
          if (chiusa) return;
          pubblica(msg);
          if (msg && msg.t === "join") {
            entrata = msg; if (!dentro) insisti();
            // "ci sono", ogni tanto, solo se nel frattempo non ho mandato niente (meno messaggi = meno batteria)
            if (!tCi) tCi = setInterval(function () { if (!chiusa && Date.now() - ultimoInvio >= CI_SONO - 1000) pubblica({ t: "__ci" }); }, CI_SONO);
          }
        },
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
      return segna(h, opz && opz.tieni);
    },

    // Scopre QUALE gioco si sta giocando in una stanza, dal solo codice.
    // Così chi entra digitando il codice apre il gioco giusto e non un altro.
    // cb riceve l'id del gioco (stringa) oppure null se non lo trova.
    scopriGioco: function (codice, cb) {
      if (!this.disponibile()) { cb(null); return; }
      var META = BASE + String(codice).toUpperCase() + "/meta";
      var fatto = false, client = null;
      function fine(g) { if (fatto) return; fatto = true; collegamento.chiudi(); try { if (client) client.end(true); } catch (e) {} cb(g || null); }
      var collegamento = collega({ clean: true, reconnectPeriod: 0 }, function (c) {
        client = c;
        c.on("message", function (_t, payload) {
          var m; try { m = JSON.parse(payload.toString()); } catch (e) {}
          fine(m && m.g);
        });
        c.subscribe(META);
      }, function () {});
      setTimeout(function () { fine(null); }, 10000);
    }
  };
})();

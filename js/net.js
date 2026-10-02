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

    // L'host apre una stanza. cb: { onCodice, onConnesso, onAddio(id), onMsg(id,msg), onErrore(e) }
    ospita: function (giocoId, cb) {
      if (!this.disponibile()) { cb.onErrore && cb.onErrore({ type: "no-mqtt" }); return null; }
      // La "sala" può imporre il codice della stanza (così lo conosce in anticipo
      // e lo manda agli altri per farli entrare in automatico).
      var codice = SGNet._forza || codiceACaso(4);
      SGNet._forza = null;
      var T = topics(codice);
      var META = BASE + codice + "/meta";
      var chiusa = false, primaVolta = true;
      var inForse = {};   // chi è sparito all'improvviso: id -> timer (se si rifà vivo in tempo, resta dentro)
      // Il codice si conosce SUBITO (non dipende dal collegamento): mostralo subito,
      // così la stanza dà sempre il codice anche se la rete è lenta a collegarsi.
      // (un tick dopo, così chi ci chiama ha già ricevuto l'oggetto "rete")
      setTimeout(function () { if (!chiusa) cb.onCodice && cb.onCodice(codice); }, 0);
      var client = mqtt.connect(BROKER, {
        clean: true, reconnectPeriod: 2000,
        // Se l'host sparisce all'improvviso, avvisa gli altri (che però lo aspettano un po')
        will: { topic: T.stato, payload: JSON.stringify({ t: "__hostgone" }), retain: false }
      });
      client.on("connect", function () {
        if (chiusa) return;
        // quando è davvero collegato la stanza è "pronta": lo comunichiamo al gioco
        client.subscribe(T.azioni, function () { if (!chiusa) cb.onConnesso && cb.onConnesso(); });
        // annuncia QUALE gioco è questa stanza, così chi entra col codice apre quello giusto
        try { client.publish(META, JSON.stringify({ g: giocoId || "" }), { retain: true }); } catch (e) {}
        // tornato dopo un buco (schermo bloccato, cambio app): lo dico a chi aspetta, così nessuno se ne va
        if (!primaVolta) try { client.publish(T.stato, JSON.stringify({ t: "__hostqui" }), { retain: false }); } catch (e) {}
        primaVolta = false;
      });
      client.on("message", function (_t, payload) {
        if (chiusa) return;
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
      });
      client.on("error", function (e) { if (!chiusa) cb.onErrore && cb.onErrore({ type: "mqtt", message: e && e.message }); });

      var h = {
        // la partita (vm) viene mandata a tutti e "trattenuta" (retain) così
        // chi entra dopo riceve subito lo stato attuale
        invia: function (msg) { try { if (!chiusa && client.connected) client.publish(T.stato, JSON.stringify(msg), { retain: true }); } catch (e) {} },
        // invio ad alta frequenza (streaming di gioco): NON trattenuto, per non intasare il broker
        inviaVeloce: function (msg) { try { if (!chiusa && client.connected) client.publish(T.stato, JSON.stringify(msg), { retain: false }); } catch (e) {} },
        inviaA: function (id, msg) { this.invia(msg); },
        chiudi: function () {
          if (chiusa) return;
          chiusa = true; togli(h);
          Object.keys(inForse).forEach(function (k) { clearTimeout(inForse[k]); }); inForse = {};
          try {
            client.publish(T.stato, JSON.stringify({ t: "__hostgone", voluto: 1 }), { retain: false });   // chiusa apposta: gli altri escono subito
            client.publish(T.stato, "", { retain: true }); // pulisce lo stato trattenuto
            client.publish(META, "", { retain: true });    // pulisce l'annuncio del gioco
            client.end();
          } catch (e) {}
        }
      };
      return segna(h, giocoId === "__sala");   // la sala resta aperta tra un gioco e l'altro
    },

    // Un ospite entra con il codice. cb: { onAperto(id), onMsg(msg), onChiuso, onErrore(e) }
    // opz.tieni = non chiuderla quando si cambia gioco (è la connessione della sala)
    entra: function (codice, cb, opz) {
      if (!this.disponibile()) { cb.onErrore && cb.onErrore({ type: "no-mqtt" }); return null; }
      var myId = idPerStanza(codice);   // rientrando nella stessa stanza si torna "la stessa persona"
      var T = topics(codice);
      var client = mqtt.connect(BROKER, {
        clean: true, reconnectPeriod: 2000,
        will: { topic: T.azioni, payload: JSON.stringify({ from: myId, data: { t: "__leave" } }), retain: false }
      });
      var aperto = false, chiusa = false, entrata = null, dentro = false, tRipeti = null, tAddio = null, tCi = null, ultimoInvio = 0;
      function pubblica(msg) { try { if (client.connected) { client.publish(T.azioni, JSON.stringify({ from: myId, data: msg }), { retain: false }); ultimoInvio = Date.now(); } } catch (e) {} }
      function smetti() { if (tRipeti) { clearInterval(tRipeti); tRipeti = null; } }
      // "sono entrato" può perdersi (stanza non ancora pronta, host via un attimo):
      // lo ripeto finché l'host non mi mette dentro (il mio codice compare nei suoi messaggi)
      function insisti() {
        smetti(); var n = 0;
        tRipeti = setInterval(function () { if (dentro || chiusa || ++n > MAX_RIPETI) return smetti(); pubblica(entrata); }, RIPETI_ENTRATA);
      }
      client.on("connect", function () {
        if (chiusa) return;
        client.subscribe(T.stato, function () {
          if (chiusa) return;
          if (!aperto) { aperto = true; cb.onAperto && cb.onAperto(myId); }
          else if (entrata) pubblica(entrata);   // ricollegato dopo un buco: ripeto che ci sono (l'host non mi toglie)
        });
      });
      client.on("message", function (_t, payload, pacchetto) {
        if (chiusa) return;
        var testo = payload.toString(); if (!testo) return;
        var m; try { m = JSON.parse(testo); } catch (e) { return; }
        if (!m) return;
        if (tAddio && !(pacchetto && pacchetto.retain)) { clearTimeout(tAddio); tAddio = null; avvisaHost(T.stato, false); }   // l'host c'è ancora
        if (entrata && !dentro && testo.indexOf('"' + myId + '"') >= 0) { dentro = true; smetti(); }   // l'host mi ha messo nella partita
        if (m.t === "__hostqui") return;
        if (m.t === "__hostgone") {
          if (m.voluto) { cb.onChiuso && cb.onChiuso(); return; }   // chiusa apposta
          // sparito all'improvviso (schermo bloccato, cambio app): gli do tempo di tornare (e lo dico sullo schermo)
          if (!tAddio) { avvisaHost(T.stato, true); tAddio = setTimeout(function () { tAddio = null; avvisaHost(T.stato, false); if (!chiusa) cb.onChiuso && cb.onChiuso(); }, ATTESA_HOST); }
          return;
        }
        cb.onMsg && cb.onMsg(m);
      });
      client.on("error", function (e) { if (!chiusa) cb.onErrore && cb.onErrore({ type: "mqtt", message: e && e.message }); });

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
        chiudi: function () {
          if (chiusa) return;
          chiusa = true; togli(h); smetti(); if (tAddio) { clearTimeout(tAddio); tAddio = null; avvisaHost(T.stato, false); } if (tCi) { clearInterval(tCi); tCi = null; }
          try { client.publish(T.azioni, JSON.stringify({ from: myId, data: { t: "__leave", voluto: 1 } }), { retain: false }); client.end(); } catch (e) {}
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
      var client = mqtt.connect(BROKER, { clean: true, reconnectPeriod: 0 });
      var fatto = false;
      function fine(g) { if (fatto) return; fatto = true; try { client.end(true); } catch (e) {} cb(g || null); }
      client.on("connect", function () { client.subscribe(META); });
      client.on("message", function (_t, payload) {
        var m; try { m = JSON.parse(payload.toString()); } catch (e) {}
        fine(m && m.g);
      });
      client.on("error", function () { fine(null); });
      setTimeout(function () { fine(null); }, 10000);
    }
  };
})();

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
   ========================================================= */
(function () {
  "use strict";

  var BROKER = "wss://broker.hivemq.com:8884/mqtt";
  var BASE = "seratagiochi/v1/";
  var ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // niente caratteri ambigui

  function codiceACaso(n) {
    var s = "";
    for (var i = 0; i < (n || 4); i++) s += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
    return s;
  }
  function topics(codice) {
    codice = String(codice).toUpperCase();
    return { stato: BASE + codice + "/stato", azioni: BASE + codice + "/azioni" };
  }

  window.SGNet = {
    disponibile: function () { return typeof mqtt !== "undefined"; },

    // L'host apre una stanza. cb: { onCodice, onArrivo, onAddio(id), onMsg(id,msg), onErrore(e) }
    ospita: function (giocoId, cb) {
      if (!this.disponibile()) { cb.onErrore && cb.onErrore({ type: "no-mqtt" }); return null; }
      var codice = codiceACaso(4);
      var T = topics(codice);
      var META = BASE + codice + "/meta";
      var client = mqtt.connect(BROKER, {
        clean: true, reconnectPeriod: 2000,
        // Se l'host sparisce all'improvviso, avvisa gli altri
        will: { topic: T.stato, payload: JSON.stringify({ t: "__hostgone" }), retain: false }
      });
      client.on("connect", function () {
        client.subscribe(T.azioni, function () { cb.onCodice && cb.onCodice(codice); });
        // annuncia QUALE gioco è questa stanza, così chi entra col codice apre quello giusto
        try { client.publish(META, JSON.stringify({ g: giocoId || "" }), { retain: true }); } catch (e) {}
      });
      client.on("message", function (_t, payload) {
        var m; try { m = JSON.parse(payload.toString()); } catch (e) { return; }
        if (!m) return;
        if (m.data && m.data.t === "__leave") { cb.onAddio && cb.onAddio(m.from); return; }
        cb.onMsg && cb.onMsg(m.from, m.data);
      });
      client.on("error", function (e) { cb.onErrore && cb.onErrore({ type: "mqtt", message: e && e.message }); });

      return {
        // la partita (vm) viene mandata a tutti e "trattenuta" (retain) così
        // chi entra dopo riceve subito lo stato attuale
        invia: function (msg) { try { if (client.connected) client.publish(T.stato, JSON.stringify(msg), { retain: true }); } catch (e) {} },
        inviaA: function (id, msg) { this.invia(msg); },
        chiudi: function () {
          try {
            client.publish(T.stato, JSON.stringify({ t: "__hostgone" }), { retain: false });
            client.publish(T.stato, "", { retain: true }); // pulisce lo stato trattenuto
            client.publish(META, "", { retain: true });    // pulisce l'annuncio del gioco
            client.end();
          } catch (e) {}
        }
      };
    },

    // Un ospite entra con il codice. cb: { onAperto(id), onMsg(msg), onChiuso, onErrore(e) }
    entra: function (codice, cb) {
      if (!this.disponibile()) { cb.onErrore && cb.onErrore({ type: "no-mqtt" }); return null; }
      var myId = "g" + Math.random().toString(36).slice(2, 9);
      var T = topics(codice);
      var client = mqtt.connect(BROKER, {
        clean: true, reconnectPeriod: 2000,
        will: { topic: T.azioni, payload: JSON.stringify({ from: myId, data: { t: "__leave" } }), retain: false }
      });
      var aperto = false;
      client.on("connect", function () {
        client.subscribe(T.stato, function () { if (!aperto) { aperto = true; cb.onAperto && cb.onAperto(myId); } });
      });
      client.on("message", function (_t, payload) {
        var m; try { m = JSON.parse(payload.toString()); } catch (e) { return; }
        if (!m || m === "") return;
        if (m.t === "__hostgone") { cb.onChiuso && cb.onChiuso(); return; }
        cb.onMsg && cb.onMsg(m);
      });
      client.on("error", function (e) { cb.onErrore && cb.onErrore({ type: "mqtt", message: e && e.message }); });

      return {
        invia: function (msg) { try { if (client.connected) client.publish(T.azioni, JSON.stringify({ from: myId, data: msg }), { retain: false }); } catch (e) {} },
        chiudi: function () {
          try { client.publish(T.azioni, JSON.stringify({ from: myId, data: { t: "__leave" } }), { retain: false }); client.end(); } catch (e) {}
        }
      };
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

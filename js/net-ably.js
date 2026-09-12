/* =========================================================
   COLLEGAMENTO REALTIME "SGNetA" — via Ably (bassa latenza)
   Stessa interfaccia di SGNet (ospita/entra) ma sopra Ably invece
   del broker MQTT pubblico: più veloce e costante, per i giochi in
   tempo reale (Glow Hockey). Un canale per stanza; l'host pubblica
   sull'evento "h", l'ospite su "g"; presence per entrata/uscita.
   Se Ably o la chiave non ci sono, disponibile() torna false e il
   gioco usa il collegamento normale (SGNet/MQTT).
   ========================================================= */
(function () {
  "use strict";
  var ALF = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function codiceACaso(n) { var s = ""; for (var i = 0; i < (n || 4); i++) s += ALF[Math.floor(Math.random() * ALF.length)]; return s; }
  function canale(c) { return "sg-" + String(c).toUpperCase(); }

  window.SGNetA = {
    disponibile: function () { return typeof Ably !== "undefined" && !!window.SG_ABLY_KEY; },

    // L'host apre una stanza. cb: { onCodice, onConnesso, onAddio(id), onMsg(id,msg), onErrore(e) }
    ospita: function (giocoId, cb) {
      if (!this.disponibile()) { cb.onErrore && cb.onErrore({ type: "no-ably" }); return null; }
      var cod = codiceACaso(4);
      var client = new Ably.Realtime({ key: window.SG_ABLY_KEY, clientId: "host", echoMessages: false });
      var ch = client.channels.get(canale(cod));
      // il codice si conosce subito (non dipende dal collegamento)
      setTimeout(function () { cb.onCodice && cb.onCodice(cod); }, 0);
      client.connection.on("connected", function () { cb.onConnesso && cb.onConnesso(); });
      client.connection.on("failed", function (e) { cb.onErrore && cb.onErrore({ type: "ably", message: e && e.reason && e.reason.message }); });
      ch.subscribe("g", function (msg) { cb.onMsg && cb.onMsg((msg && msg.clientId) || "guest", msg.data); });
      ch.presence.subscribe("leave", function (m) { cb.onAddio && cb.onAddio((m && m.clientId) || "guest"); });
      return {
        invia: function (m) { try { ch.publish("h", m); } catch (e) {} },
        inviaVeloce: function (m) { try { ch.publish("h", m); } catch (e) {} },
        inviaA: function (id, m) { this.invia(m); },
        chiudi: function () { try { ch.publish("h", { t: "__hostgone" }); } catch (e) {} try { client.close(); } catch (e) {} }
      };
    },

    // Un ospite entra col codice. cb: { onAperto(id), onMsg(msg), onChiuso, onErrore(e) }
    entra: function (cod, cb) {
      if (!this.disponibile()) { cb.onErrore && cb.onErrore({ type: "no-ably" }); return null; }
      var myId = "g" + Math.random().toString(36).slice(2, 8);
      var client = new Ably.Realtime({ key: window.SG_ABLY_KEY, clientId: myId, echoMessages: false });
      var ch = client.channels.get(canale(cod));
      var aperto = false;
      ch.subscribe("h", function (msg) {
        if (msg && msg.data && msg.data.t === "__hostgone") { cb.onChiuso && cb.onChiuso(); return; }
        cb.onMsg && cb.onMsg(msg.data);
      });
      client.connection.on("connected", function () {
        try { ch.presence.enter(); } catch (e) {}
        if (!aperto) { aperto = true; cb.onAperto && cb.onAperto(myId); }
      });
      client.connection.on("failed", function () { cb.onErrore && cb.onErrore({ type: "ably" }); });
      return {
        invia: function (m) { try { ch.publish("g", m); } catch (e) {} },
        chiudi: function () { try { ch.presence.leave(); } catch (e) {} try { client.close(); } catch (e) {} }
      };
    }
  };
})();

/* =========================================================
   COLLEGAMENTO TRA TELEFONI — "SGNet"
   Fa parlare i telefoni tra loro per la modalità
   "ognuno dal suo telefono", senza server né account:
   usa PeerJS (collegamento diretto tra browser).

   Un telefono "ospita" la stanza (è il cervello della
   partita); gli altri "entrano" con il codice della stanza.
   Se PeerJS non è disponibile (o il collegamento è bloccato),
   SGNet.disponibile() è false e il gioco resta comunque
   giocabile con un telefono solo.
   ========================================================= */
(function () {
  "use strict";

  // Prefisso per non confondersi con altre app sullo stesso servizio pubblico
  var PREFISso = "seratagiochi-v1-";
  var ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // niente lettere/numeri ambigui

  function codiceACaso(n) {
    var s = "";
    for (var i = 0; i < (n || 4); i++) s += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
    return s;
  }

  window.SGNet = {
    disponibile: function () { return typeof Peer !== "undefined"; },

    // L'host apre una stanza. cb: { onCodice, onArrivo(id), onAddio(id), onMsg(id,msg), onErrore(e) }
    ospita: function (cb) {
      if (!this.disponibile()) { cb.onErrore && cb.onErrore({ type: "no-peerjs" }); return null; }
      var conns = {};
      var peer, tentativi = 0;

      function prova() {
        var codice = codiceACaso(4);
        peer = new Peer(PREFISso + codice, { debug: 1 });
        peer.on("open", function () { cb.onCodice && cb.onCodice(codice); });
        peer.on("connection", function (conn) {
          conn.on("open", function () {
            conns[conn.peer] = conn;
            cb.onArrivo && cb.onArrivo(conn.peer);
            conn.on("data", function (d) { cb.onMsg && cb.onMsg(conn.peer, d); });
            conn.on("close", function () { delete conns[conn.peer]; cb.onAddio && cb.onAddio(conn.peer); });
          });
        });
        peer.on("error", function (e) {
          if (e && e.type === "unavailable-id" && tentativi < 5) { tentativi++; try { peer.destroy(); } catch (x) {} prova(); return; }
          cb.onErrore && cb.onErrore(e);
        });
      }
      prova();

      return {
        invia: function (msg) { for (var k in conns) { try { conns[k].send(msg); } catch (e) {} } },
        inviaA: function (id, msg) { if (conns[id]) { try { conns[id].send(msg); } catch (e) {} } },
        chiudi: function () { try { peer.destroy(); } catch (e) {} }
      };
    },

    // Un ospite entra nella stanza. cb: { onAperto, onMsg(msg), onChiuso, onErrore(e) }
    entra: function (codice, cb) {
      if (!this.disponibile()) { cb.onErrore && cb.onErrore({ type: "no-peerjs" }); return null; }
      var peer = new Peer(undefined, { debug: 1 });
      var conn, mioId;
      peer.on("open", function (id) {
        mioId = id;
        conn = peer.connect(PREFISso + codice.toUpperCase(), { reliable: true });
        conn.on("open", function () {
          cb.onAperto && cb.onAperto(mioId); // passa il PROPRIO id all'ospite
          conn.on("data", function (d) { cb.onMsg && cb.onMsg(d); });
          conn.on("close", function () { cb.onChiuso && cb.onChiuso(); });
        });
        conn.on("error", function (e) { cb.onErrore && cb.onErrore(e); });
      });
      peer.on("error", function (e) { cb.onErrore && cb.onErrore(e); });

      return {
        invia: function (msg) { try { conn && conn.send(msg); } catch (e) {} },
        chiudi: function () { try { peer.destroy(); } catch (e) {} }
      };
    }
  };
})();

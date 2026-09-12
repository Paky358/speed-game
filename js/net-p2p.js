/* =========================================================
   COLLEGAMENTO "SGNetP2P" — diretto telefono-a-telefono (WebRTC)
   Per la modalità "stessa connessione". I due telefoni si parlano
   DIRETTAMENTE con un canale dati WebRTC, senza far passare il gioco
   dal server: sulla stessa rete la latenza crolla a pochi millisecondi.
   Il server (Ably) serve SOLO per "presentarsi" all'inizio (scambio di
   offerta/risposta e degli indirizzi di rete, i "candidati" ICE) e come
   RIPIEGO: finché il canale diretto non è aperto — o se non si apre mai
   (reti diverse, firewall) — il gioco continua a passare da Ably, come
   prima. Stessa interfaccia di SGNet/SGNetA, così i giochi non cambiano.
   Nota: la segnalazione usa SOLO Ably (niente MQTT, che "trattiene" i
   messaggi e rovinerebbe lo scambio). Senza Ably, disponibile() = false.
   ========================================================= */
(function () {
  "use strict";

  var RTC = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  // server STUN pubblici e gratuiti: servono solo a scoprire gli indirizzi di rete.
  // NIENTE TURN: non vogliamo far rimbalzare il gioco su un server (costo + latenza);
  // se il diretto non si può fare, si resta su Ably.
  var ICE = { iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ] };
  // ordinato ma SENZA ritrasmissioni: niente attese (bassa latenza) e niente pacchetti
  // che si scavalcano (l'ospite li interpola per ordine d'arrivo, non devono sballare).
  var DC_OPT = { ordered: true, maxRetransmits: 0 };

  function baseNet() { return (window.SGNetA && SGNetA.disponibile()) ? SGNetA : null; }

  // pezzo comune host/ospite: gestisce la peer-connection, il canale dati,
  // lo scambio dei segnali e lo scambio "diretto vs server".
  function creaPonte(rete, ruolo, cb, inviaGiocoRelay) {
    var pc = null, dc = null, diretto = false, avviato = false, chiuso = false, iceRimaste = [];

    function sig(m) { m.p2p = m.p2p || "?"; try { (rete.inviaVeloce || rete.invia).call(rete, m); } catch (e) {} }

    function collegaDC(canale) {
      dc = canale;
      dc.onopen = function () { if (chiuso) return; diretto = true; if (cb.onCanale) cb.onCanale("diretto"); };
      dc.onclose = function () { if (diretto) { diretto = false; if (!chiuso && cb.onCanale) cb.onCanale("server"); } };
      dc.onmessage = function (ev) { var m; try { m = JSON.parse(ev.data); } catch (e) { return; } if (cb.onMsg) cb.onMsg("peer", m); };
    }

    function nuovaPC() {
      pc = new RTC(ICE);
      pc.onicecandidate = function (e) { if (e.candidate) sig({ p2p: "ice", c: e.candidate }); };
      pc.ondatachannel = function (e) { collegaDC(e.channel); };
      pc.oniceconnectionstatechange = function () {
        var s = pc && pc.iceConnectionState;
        if (s === "failed") { /* niente diretto: si resta su Ably, gia' cosi' */ }
      };
      return pc;
    }

    // HOST: crea offerta + canale dati appena l'ospite si fa vivo
    function avviaHost() {
      if (avviato || chiuso) return; avviato = true;
      try {
        nuovaPC();
        collegaDC(pc.createDataChannel("g", DC_OPT));
        pc.createOffer().then(function (o) { return pc.setLocalDescription(o); })
          .then(function () { sig({ p2p: "offer", sdp: pc.localDescription }); })
          .catch(function () {});
      } catch (e) {}
    }

    function segnale(m) {
      try {
        if (m.p2p === "offer") {           // lo riceve l'OSPITE
          if (!pc) nuovaPC();
          pc.setRemoteDescription(m.sdp)
            .then(function () { svuotaIce(); return pc.createAnswer(); })
            .then(function (a) { return pc.setLocalDescription(a); })
            .then(function () { sig({ p2p: "answer", sdp: pc.localDescription }); })
            .catch(function () {});
        } else if (m.p2p === "answer") {   // lo riceve l'HOST
          if (pc) pc.setRemoteDescription(m.sdp).then(svuotaIce).catch(function () {});
        } else if (m.p2p === "ice") {
          if (pc && pc.remoteDescription && pc.remoteDescription.type) pc.addIceCandidate(m.c).catch(function () {});
          else iceRimaste.push(m.c);       // arrivato prima dell'offerta: lo tengo da parte
        }
      } catch (e) {}
    }
    function svuotaIce() { for (var i = 0; i < iceRimaste.length; i++) { try { pc.addIceCandidate(iceRimaste[i]).catch(function () {}); } catch (e) {} } iceRimaste = []; }

    function chiudiPonte() { chiuso = true; try { if (dc) dc.close(); } catch (e) {} try { if (pc) pc.close(); } catch (e) {} dc = null; pc = null; diretto = false; }

    return {
      ruolo: ruolo,
      avviaHost: avviaHost,
      segnale: segnale,
      eSegnale: function (m) { return m && !!m.p2p; },
      diretto: function () { return diretto && dc && dc.readyState === "open"; },
      inviaGioco: function (m) { if (this.diretto()) { try { dc.send(JSON.stringify(m)); return; } catch (e) {} } inviaGiocoRelay(m); },
      chiudi: chiudiPonte
    };
  }

  window.SGNetP2P = {
    disponibile: function () { return !!RTC && !!baseNet(); },

    // HOST. cb: { onCodice, onConnesso, onAddio(id), onMsg(id,msg), onErrore, onCanale("diretto"|"server") }
    ospita: function (giocoId, cb) {
      var B = baseNet();
      if (!RTC || !B) { cb.onErrore && cb.onErrore({ type: "no-p2p" }); return null; }
      var rete, ponte;
      rete = B.ospita(giocoId, {
        onCodice: function (c) { cb.onCodice && cb.onCodice(c); },
        onConnesso: function () { cb.onConnesso && cb.onConnesso(); },
        onAddio: function (id) { if (ponte) ponte.chiudi(); cb.onAddio && cb.onAddio(id); },
        onErrore: function (e) { cb.onErrore && cb.onErrore(e); },
        onMsg: function (id, m) {
          if (!m) return;
          if (ponte.eSegnale(m)) { ponte.segnale(m); return; }
          ponte.avviaHost();                               // primo messaggio dell'ospite -> tratta il diretto
          if (!ponte.diretto()) cb.onMsg && cb.onMsg(id, m); // finché non c'e' il diretto, i msg arrivano da Ably
        }
      });
      ponte = creaPonte(rete, "host", {
        onMsg: function (_id, m) { cb.onMsg && cb.onMsg("guest", m); },   // messaggi che arrivano dal canale diretto
        onCanale: function (t) { cb.onCanale && cb.onCanale(t); }
      }, function (m) { rete.invia(m); });
      return {
        invia: function (m) { ponte.inviaGioco(m); },
        inviaVeloce: function (m) { if (ponte.diretto()) ponte.inviaGioco(m); else (rete.inviaVeloce || rete.invia).call(rete, m); },
        inviaA: function (id, m) { ponte.inviaGioco(m); },
        chiudi: function () { if (ponte) ponte.chiudi(); try { rete.chiudi(); } catch (e) {} }
      };
    },

    // OSPITE. cb: { onAperto(id), onMsg(msg), onChiuso, onErrore, onCanale }
    entra: function (cod, cb) {
      var B = baseNet();
      if (!RTC || !B) { cb.onErrore && cb.onErrore({ type: "no-p2p" }); return null; }
      var rete, ponte;
      rete = B.entra(cod, {
        onAperto: function (id) { cb.onAperto && cb.onAperto(id); },
        onChiuso: function () { if (ponte) ponte.chiudi(); cb.onChiuso && cb.onChiuso(); },
        onErrore: function (e) { cb.onErrore && cb.onErrore(e); },
        onMsg: function (m) {
          if (!m) return;
          if (ponte.eSegnale(m)) { ponte.segnale(m); return; }
          if (!ponte.diretto()) cb.onMsg && cb.onMsg(m);
        }
      });
      ponte = creaPonte(rete, "ospite", {
        onMsg: function (_id, m) { cb.onMsg && cb.onMsg(m); },
        onCanale: function (t) { cb.onCanale && cb.onCanale(t); }
      }, function (m) { rete.invia(m); });
      return {
        invia: function (m) { ponte.inviaGioco(m); },
        chiudi: function () { if (ponte) ponte.chiudi(); try { rete.chiudi(); } catch (e) {} }
      };
    }
  };
})();

/* =========================================================
   AMICI ONLINE E INVITI — "SGAmiciOnline"
   Il pallino verde degli amici che hanno l'app aperta e gli inviti nella
   Sala ("➕ Invita" → "Paky ti chiama nella Sala"). Solo col profilo.
   Passa sul broker (SGNet.presenza, pezzo p6-n), non su Firebase:
     seratagiochi/v1/u/<H>/on   trattenuto  { on: 1, s: "app"|"gioco"|"sala", t } (testamento { on: 0 })
     seratagiochi/v1/u/<H>/inv  trattenuto  { id, da, nome, om, sala, gioco, t } (vale 10 minuti)
     seratagiochi/v1/u/<H>/msg  veloce      { t: "risposta", id, si, nome }
   H = impronta di 12 caratteri dell'uid (mai l'uid in chiaro).
   Si accettano solo inviti di chi è nella propria lista amici.
   Al caricamento non usa SG, SGNet né SGNube: solo dentro le sue funzioni.
   Stile in un <style> di questo file con prefisso "ao-".
   Memoria del telefono: sg-presenza ("0" = non farti vedere online),
   sg-amici-cache, sg-inviti-visti.

   INTERFACCIA (la riempie il pezzo p6-p; oggi sono funzioni vuote)

   SGAmiciOnline.avvia()
     Dopo il profilo pronto (solo se SGNube.utente() e SGNube.profilo()):
     apre la presenza e segue gli amici. Con sg-presenza = "0" non si fa
     vedere ma riceve gli inviti. App in secondo piano → nascosto.
   SGAmiciOnline.ferma()
     All'uscita dal profilo (o prima di avvia() con un altro profilo).
   SGAmiciOnline.online()
     → [{ uid, nome, omino, s: "app"|"gioco"|"sala" }] degli amici online
     (scritto da meno di 2 ore). Quando cambia: evento "sg-amici-online"
     su window, al massimo una volta al secondo.
   SGAmiciOnline.stato(s)
     Il core dice dove sono: "app", "gioco" o "sala".
   SGAmiciOnline.badge()
     → <span class="ao-badge">🟢 2</span> che si aggiorna da solo,
     null se nessuno è online o non c'è il profilo.
   SGAmiciOnline.foglioInvita({ codice, nomeSala, gioco, condividi, qr })
     Il foglio "➕ Invita" (aspetto sl-velo/sl-foglio): amici online in alto,
     gli altri in grigio, "📨 Chiama" → "✅ Chiamato" → "👍 Arriva!"/"🙅 Non ora";
     in fondo "📤 Manda il link" (o.condividi) e, se c'è, "▦ QR" (o.qr).
   SGAmiciOnline.onInvito(fn)
     Il core registra fn(codice) che porta nella Sala dell'invito ("Entra ▶").
     Se nessuno la registra, "Entra" apre #sala=CODICE come un link.
   ========================================================= */
(function () {
  "use strict";

  window.SGAmiciOnline = {
    avvia: function () {},
    ferma: function () {},
    online: function () { return []; },
    foglioInvita: function () {},
    badge: function () { return null; },
    stato: function () {},
    onInvito: function () {}
  };
})();

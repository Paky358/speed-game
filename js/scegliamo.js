/* =========================================================
   SCEGLIAMO INSIEME — "SGScegliamo"
   La schermata del voto (3 giochi proposti) e la ruota dei giochi che
   gira uguale su tutti i telefoni. Modulo SOLO DI DISEGNO: niente rete,
   niente Sala (il voto e la ruota li decide il core, pezzo p6-e).
   Al caricamento non usa SG né SGNet: solo dentro le sue funzioni.
   Stile in un <style> di questo file con prefisso "sgs-"; per la ruota
   si riusano le classi rg-velo, rg-scheda, rg-tutto, rg-bordo, rg-freccia
   di styles.css (quelle della Ruota del giorno).

   INTERFACCIA (la riempie il pezzo p6-r; oggi sono funzioni vuote)

   SGScegliamo.disegna(cv, spicchi, lato)
     Disegna la ruota sul canvas cv (lato = misura in px), una volta sola:
     durante il giro ruota solo il canvas (transform: rotate).
     spicchi: [{ icona, nome, colore }] — emoji grande e nome corto
     (max 10 caratteri, poi "…"); gli spicchi dello stesso gioco hanno lo
     stesso colore (tavolozza fissa di 6).

   SGScegliamo.ruota({ spicchi, vince, theta, titolo, giaFinito, poi })
     Velo a tutto schermo "🎡 Si gira!": giro di 5,2 s fino allo spicchio
     numero `vince`; theta = spostamento dentro lo spicchio deciso dall'host
     (uguale su tutti i telefoni). "Tic" con SG.audioCtx(), nessuna
     vibrazione, nessun tasto. Poi "🎉 Si gioca a <gioco>!" per 1,8 s e poi().
     giaFinito: true → mostra subito lo spicchio vincente.
     Torna il nodo del velo (oggi null). poi() arriva SEMPRE dopo, mai
     dentro la chiamata (anche nella versione vuota di oggi).

   SGScegliamo.scheda({ giochi: [{ id, icona, nome, sotto }], mio, voti,
                        secondi, host, onVota, onChiudi })
     La schermata del voto (un nodo che il core mette in una sua schermata):
     "🗳️ Scegliamo insieme", conto alla rovescia, tre tessere grandi
     (foto da window.SG_FOTO o emoji), sotto ognuna gli avatar di chi l'ha
     votata (max 6, poi "+2"); tocco → "✅ Il tuo voto" e onVota(id);
     all'host in fondo "🎡 Gira la ruota (3 su 5)" → onChiudi().
     voti = chi ha votato cosa, con nome e avatar per le facce piccole
     (proposta: { idMembro: { g: idGioco, nome, omino } }, la fissa p6-r),
     mio = id del gioco che ho votato io (o null).
     Torna { nodo, aggiorna(voti, mio, ms), chiudi() } (oggi null):
     aggiorna cambia solo avatar, conto e tasto (niente lampeggio).
   ========================================================= */
(function () {
  "use strict";

  window.SGScegliamo = {
    // la schermata del voto (oggi non c'è: il core non la usa ancora)
    scheda: function () { return null; },
    // la ruota: per ora salta il giro e va subito avanti
    ruota: function (o) {
      var dopo = o && (o.poi || o.fine);
      if (typeof dopo === "function") setTimeout(dopo, 0);
      return null;
    },
    // il disegno della ruota sul canvas (oggi niente)
    disegna: function () {}
  };
})();

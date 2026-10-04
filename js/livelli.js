/* =========================================================
   SPeeD GAME — LIVELLI, XP, SPEED COINS E PRESTIGIO
   Tutte le regole stanno qui, così si ritoccano in un posto solo.
   - XP per passare al livello dopo: 100 x livello^0,95
     (i primi livelli volano, poi ogni livello chiede un po' di più).
     Con 1 XP al secondo, contando vittorie e bonus: livello 5 dopo 2-3 partite,
     livello 10 dopo circa 1 ora, livello 20 dopo circa 4 ore, Prestigio dopo
     circa 24 ore (giocando 3-4 ore a settimana: ogni 1 mese e mezzo / 2 mesi).
   - Ogni livello raggiunto regala livello x 50 Speed Coins.
   - Il livello massimo è 50: superato il 50 scatta il Prestigio
     (si riparte dal livello 1 con 0 XP, +1 Prestigio, +5.000 Speed Coins;
     le monete e il resto non si toccano).
   - Gli XP di una partita dipendono da quanto dura: 1 XP al secondo
     (almeno 5 XP per ogni partita finita, anche velocissima come a Tris;
     al massimo 30 minuti contati), +50% se vinci, +250 alla prima
     partita del giorno. Così ogni gioco vale per il tempo che ci passi.
   ========================================================= */
(function () {
  "use strict";
  var MAX = 50;                 // livello massimo: superato il 50 scatta il Prestigio
  var BONUS_PRESTIGIO = 5000;   // Speed Coins quando si fa il Prestigio
  var XP_SECONDO = 1;           // XP per ogni secondo di partita
  var MAX_SECONDI = 1800;       // al massimo 30 minuti contati per partita
  var MIN_XP = 5;               // ogni partita finita vale almeno questo (le partite lasciate a metà non danno niente)
  var BONUS_VITTORIA = 0.5;     // +50% se vinci
  var BONUS_GIORNO = 250;       // XP in più alla prima partita del giorno
  var BASE = 100, POTENZA = 0.95;   // la curva: più alta la potenza, più lenti i livelli alti

  // XP che servono per passare dal livello "livello" al successivo
  function xpPerSalire(livello) { return Math.round(BASE * Math.pow(livello, POTENZA)); }
  // Speed Coins regalati quando si raggiunge "livello"
  function bonusLivello(livello) { return livello * 50; }

  // aggiunge gli XP a uno stato { level, xp, coins, prestige } e dice cosa è successo
  // (anche più livelli in un colpo solo, ognuno col suo bonus)
  function aggiungi(stato, punti) {
    var s = { level: stato.level || 1, xp: (stato.xp || 0) + Math.max(0, Math.round(punti || 0)), coins: stato.coins || 0, prestige: stato.prestige || 0 };
    var eventi = [];
    while (s.xp >= xpPerSalire(s.level)) {
      if (s.level >= MAX) {   // superato il 50: Prestigio
        s.level = 1; s.xp = 0; s.prestige += 1; s.coins += BONUS_PRESTIGIO;
        eventi.push({ tipo: "prestigio", prestigio: s.prestige, monete: BONUS_PRESTIGIO });
        break;
      }
      s.xp -= xpPerSalire(s.level);
      s.level += 1;
      var m = bonusLivello(s.level);
      s.coins += m;
      eventi.push({ tipo: "livello", livello: s.level, monete: m });
    }
    return { stato: s, eventi: eventi };
  }

  // gli XP di una partita: o = { secondi, vinto, primaDelGiorno }
  function xpPartita(o) {
    var sec = Math.min(MAX_SECONDI, Math.max(0, o.secondi || 0));
    var xp = Math.max(MIN_XP, sec * XP_SECONDO) * (o.vinto ? 1 + BONUS_VITTORIA : 1);
    return Math.round(xp + (o.primaDelGiorno ? BONUS_GIORNO : 0));
  }

  window.SGLivelli = {
    MAX: MAX, BONUS_PRESTIGIO: BONUS_PRESTIGIO, BONUS_GIORNO: BONUS_GIORNO, BONUS_VITTORIA: BONUS_VITTORIA, MAX_SECONDI: MAX_SECONDI, MIN_XP: MIN_XP,
    xpPerSalire: xpPerSalire, bonusLivello: bonusLivello, aggiungi: aggiungi, xpPartita: xpPartita
  };
})();

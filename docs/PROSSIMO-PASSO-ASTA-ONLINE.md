# Prossimo passo — L'Asta "ognuno dal suo telefono"

Piano pronto da eseguire. Scritto per non dover ripensare niente da capo.

## Obiettivo
Dare all'Asta la stessa modalità online che ha già "La linea del tempo",
e poi **generalizzarla** così che ogni gioco futuro la ottenga quasi gratis.

## Cosa c'è già (da riusare, non riscrivere)
- `js/net.js` — il collegamento tra telefoni (relay MQTT pubblico, nessun account).
  Funzioni: `SGNet.ospita(cb)` e `SGNet.entra(codice, cb)`. Va bene com'è.
- In `js/games/timeline.js` c'è già il modello che funziona:
  **l'host tiene l'unica copia vera della partita**, calcola tutto e manda agli
  altri una "foto" (view-model); gli ospiti disegnano e rimandano solo le mosse.
  Schermate già pronte da imitare: sala d'attesa con codice e link, passaggio di
  fase, attesa del proprio turno.
- Il vincolo dei crediti, le fasce A/B/C e la votazione a stelle sono già scritti
  in `js/games/asta.js` e **non vanno cambiati**: cambia solo *chi* preme i tasti.

## Come tradurre l'Asta in online (host-authoritative)
Fasi della partita da mandare nella "foto" (`vm`):
1. `lobby` — chi c'è, codice stanza, l'host sceglie tema e crediti.
2. `scelta` — il giocatore di turno sceglie la carta dal tavolo; gli altri guardano.
3. `asta` — carta, offerta corrente, chi guida, scadenza del timer, chi ha passato.
   Ogni telefono mostra il proprio tasto **+1** e **Passa** solo al proprio nome.
4. `esito` — chi si è aggiudicato la carta e a quanto.
5. `kit` — riepilogo dei kit di tutti.
6. `voto` — ognuno vota i kit degli altri dal proprio telefono (niente autovoto).
7. `fine` — classifica.

Messaggi dagli ospiti all'host (gli unici):
`join {nome}`, `scegli {idxCarta}`, `rilancia`, `passa`, `voto {aChi, stelle}`, `avanti`.

**Regole d'oro (già imparate con la linea del tempo):**
- Il timer lo tiene **solo l'host** (gli altri lo mostrano soltanto): così non si
  litiga su chi ha rilanciato per primo.
- L'host ricalcola sempre il massimo puntabile: nessuno può barare dal suo telefono.
- Se un ospite se ne va a metà, l'host lo toglie e va avanti.

## Poi: renderlo comune a tutti i giochi
Quando l'Asta online funziona, spostare in `js/core.js` la parte ripetuta
(sala d'attesa, codice, ingresso ospiti, invio della "foto") e lasciare a ogni
gioco solo le sue regole. Da quel momento un gioco nuovo diventa online
scrivendo poche righe.

## Da non dimenticare
- Provare sempre con **due telefoni simulati** nella stessa pagina prima di dire
  che funziona (si è già fatto: è il modo più veloce per trovare i problemi).
- La modalità "un telefono solo" deve continuare a funzionare identica.
- Alla fine: ricostruire `dist/index.html` e ricaricarlo su Netlify.

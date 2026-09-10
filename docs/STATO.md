# A che punto siamo

_Aggiornato: 10 settembre 2026 (dodici temi per L'Asta)_

## In due parole
È una raccolta di giochi da fare in gruppo, che si apre dal telefono senza
installare niente. Si può giocare passandosi un telefono solo, oppure ognuno
dal proprio.

## Cosa c'è, e funziona
- **Profilo**: all'avvio si CREA un profilo (nome + faccina) o si ACCEDE a uno già
  salvato sul telefono. Niente password, niente account.
- **La Sala**: il gruppo si mette insieme una volta sola e resta lì fra una partita
  e l'altra. A fine partita: Rigioca, Cambia gioco, torna alla Sala.
- **La home**: elenco dei giochi + i tasti 🆕 Novità, 💡 Proposte, 🐞 Bug e
  "Entra in una stanza".
- **Gioco 1 — La linea del tempo**: 5 categorie (Storia, Invenzioni, Calcio, Rap
  italiano, Cinema), oltre 800 avvenimenti verificati, timer 30", punti, voto degli
  altri, classifica finale. Si gioca su un telefono solo o ognuno dal suo.
- **Gioco 2 — L'Asta**: 2–10 giocatori, 4 round a tema, crediti, rilanci, timer 10",
  assegnazione automatica dell'ultima carta, votazione a stelle e podio.
  **Dodici temi**: 🧟 Zombie · 🍕 Pizza · 🍔 Panino · 💰 Colpo del Secolo · 🦸 Supereroi ·
  💘 Primo Appuntamento · 🌳 Giardino Perfetto · 🏝️ Vacanza Perfetta · 🏠 Coinquilino
  Ideale · ⚽ Squadra da Calcetto · 🏋️ Palestra di Quartiere · 🎆 Il Capodanno. Ogni
  tema ha 184 carte divise in tre fasce, con anti-ripetizione fra una partita e
  l'altra.

## Due modi di giocare (li sceglie chi organizza, all'inizio)
- **Un telefono solo**: si passa di mano in mano. Funziona sempre, ovunque.
- **Ognuno dal suo telefono**: si apre una **stanza** con un codice (e un link da
  mandare). Tutti i telefoni restano allineati perché la partita vera vive sul
  telefono di chi ha aperto la stanza. Il collegamento passa da un servizio
  pubblico di smistamento messaggi: nessun account, nessun server nostro.
  **Funziona solo dal sito pubblicato** (vedi `docs/METTERE-ONLINE.md`).

## Prossimo passo
Portare la modalità online dentro il motore, così ogni gioco nuovo la ottiene
quasi gratis (piano in `docs/PROSSIMO-PASSO-ASTA-ONLINE.md`).

## Cosa manca / altri passi possibili
1. Provare l'Asta online **con un gruppo vero**, ognuno dal proprio telefono.
2. Rifiniture all'online che emergeranno dalla prova (es. cosa succede se cade la
   connessione di chi ha aperto la stanza).
3. Il tema "La Serata da Leoni" e il terzo gioco: tutto in `IDEE.md`.

## Come si apre
- Doppio clic su `index.html`: si apre nel browser e si gioca.
- Per gli amici: si carica **`dist/index.html`** su Netlify (istruzioni in due righe
  in `docs/METTERE-ONLINE.md`). È un unico file che contiene tutto.

## Come è fatto (per chi un domani mette le mani nel codice)
- Tre file di testo comune: HTML, un foglio di stile, e il "motore".
- Il motore tiene le cose che tutti i giochi condividono (schermate, profili, sala,
  giocatori, punteggio, giro di partita). Ogni gioco è un pezzo che si innesta.
- Come si aggiunge un gioco: `docs/COME-SI-AGGIUNGE-UN-GIOCO.md`.

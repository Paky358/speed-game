# A che punto siamo

_Aggiornato: 11 settembre 2026 (nuovo gioco: La Scalinata)_

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
  **Quattordici temi**: 🧟 Zombie · 🍕 Pizza · 🍔 Panino · 💰 Colpo del Secolo · 🦸
  Supereroi · 💘 Primo Appuntamento · 🌳 Giardino Perfetto · 🏝️ Vacanza Perfetta ·
  🏠 Coinquilino Ideale · ⚽ Squadra da Calcetto · 🏋️ Palestra di Quartiere · 🎆 Il
  Capodanno · 🎓 La Sessione Universitaria · 🚗 Il Road Trip. Ogni tema ha 184
  carte divise in tre fasce, con anti-ripetizione fra una partita e l'altra.

- **Gioco 3 — Nomi, Cose e Città** ✍️: a turni, un telefono solo. Esce una lettera
  e si riempiono le categorie con parole che iniziano con quella lettera, entro il
  tempo. Categorie scelte dall'host: classiche, set **Black humor**, e
  **personalizzate** scritte dai giocatori. Poi il gruppo **vota** ogni parola:
  più del 50% di sì = 10 punti, 5 se doppia, 0 se bocciata o vuota. Da 2
  giocatori; difficoltà Media nel torneo.

- **Gioco 4 — L'Impostore** 🕵️: un telefono solo. Tutti hanno la stessa parola
  tranne l'impostore; il telefono gira e ognuno vede il suo ruolo in segreto.
  L'host sceglie se dare all'impostore una parola simile ma diversa (coppie in
  `data/impostore-parole.js`) o lasciarlo al buio. Chi inizia è sorteggiato.
  Votazione segreta, poi punti (scoperto → a chi l'ha beccato; franca →
  all'impostore) e classifica. Da 3 giocatori; difficoltà Media nel torneo.

- **Gioco 5 — Sì... però** 🤨: party game a squadre (stile Superfight). Due squadre
  costruiscono lo scenario di vita migliore con Bonus e si sabotano con Malus, poi
  il giudice decide. 4 fasi (Paradiso, Schianto, **Rinforzo**, Ghigliottina), arringa
  a voce senza timer. L'host può usare la sequenza classica o comporre le fasi.
  Carte in `data/sipero-carte.js` (150 Bonus, 151 Malus).
  - **Un telefono solo**: giudice a rotazione, squadre riformate a ogni round (da 3).
  - **Ognuno dal suo telefono** (online): in lobby si sceglie il giudice e si formano
    le due squadre (fissi per la partita); ognuno vede sempre il tavolo e la propria
    mano; a fine partita si torna alla lobby per rifare le squadre. È il **primo gioco
    oltre all'Asta** con l'online completo.

- **Gioco 6 — La Scalinata** 🪜: un telefono solo, **solo in 4**. A ogni round, 4
  secondi per scegliere in segreto **1, 3 o 5** gradini. Le scelte si scoprono tutte
  insieme (numero sopra la testa): chi sceglie un numero **già preso da un altro**
  resta fermo, avanza solo chi ha un numero **unico**. Scala colorata a 4 corsie con
  pedine animate, traguardo al gradino **15**. Difficoltà Media nel torneo.

## Torneo (più giochi di fila)
Dalla home, tasto **🏆 Torneo**: si sceglie una volta il gruppo e si giocano più
partite di fila, anche a giochi diversi, con gli stessi giocatori. I punti si
sommano e la classifica generale è sempre visibile, con podio finale.
- **Punti bilanciati per difficoltà**: ogni gioco dichiara un peso (1 Facile, 2
  Media, 3 Difficile). Il vincitore prende 100 × peso (quindi 100/200/300); gli
  altri a scalare fino al 10° posto. Oggi: Linea del tempo = Media, L'Asta =
  Difficile (si cambia con una riga per gioco: campo `difficolta`).
- Nel torneo si gioca **un telefono solo** (niente codici diversi per ogni gioco).

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

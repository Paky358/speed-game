# A che punto siamo

_Aggiornato: 8 settembre 2026_

## In due parole
È una raccolta di giochi da fare in gruppo, che si apre dal telefono senza
installare niente. Si passa il telefono di mano in mano.

## Cosa c'è, e funziona
- **La home**: l'elenco dei giochi. Per ora ce n'è uno, e un riquadro "altri in arrivo".
- **La scelta dei giocatori**: si aggiungono i nomi (o si lasciano vuoti), da 1 a 8.
- **Primo gioco: La linea del tempo** — completo e giocabile dall'inizio alla fine:
  - esce un avvenimento senza data, lo si infila nel punto giusto della linea;
  - si scopre l'anno, con una riga che racconta il fatto;
  - se giusto la carta resta, se sbagliato si scarta;
  - vince chi finisce le sue carte per primo, con tabellone finale e medaglie;
  - "Rigioca" e "Torna ai giochi".
- Provato davvero su schermo da telefono, una partita intera, più volte.

## Il contenuto della linea del tempo
Circa 90 avvenimenti veri e verificati, in italiano: famosi, sorprendenti e
qualche data ravvicinata per far ragionare. Stanno tutti in un file di dati a
parte: aggiungerne altri **non** richiede di toccare il gioco.

## Cosa manca / prossimi passi possibili
1. **Più avvenimenti** per la linea del tempo: l'obiettivo è qualche centinaio.
   È un lavoro lungo ma semplice (scrivere e verificare le date) — adatto a
   essere fatto un po' alla volta o affidato a un aiuto.
2. **Farlo provare a un gruppo vero** e sistemare quello che non torna.
3. Solo dopo: pensare al **secondo gioco**. Le idee sono in `IDEE.md`.

## Come si apre
- Doppio clic su `index.html`: si apre nel browser e si gioca.
- Per giocarlo dal telefono: va messo online (basta un servizio gratuito che
  ospita una cartella di file). Quando serve, si spiega cosa fare in due righe.

## Come è fatto (per chi un domani mette le mani nel codice)
- Tre file di testo comune: HTML, un foglio di stile, e il "motore".
- Il motore tiene le cose che tutti i giochi condividono (schermate, giocatori,
  punteggio, giro di partita). Ogni gioco è un pezzo che si innesta.
- Come si aggiunge un gioco è spiegato in `docs/COME-SI-AGGIUNGE-UN-GIOCO.md`.

# Come si aggiunge un gioco

Questo è il documento più importante del progetto: descrive l'**innesto**, cioè
il modo in cui un nuovo gioco si aggancia a tutto ciò che c'è già di comune
(le schermate, i giocatori, il punteggio, il passaggio del telefono).

L'idea di fondo: **il primo gioco costa dieci, il ventesimo deve costare uno.**
Ci si arriva perché ogni gioco nuovo si limita a dire chi è e sa fare tre cose —
comincia, gioca un turno, dice chi ha vinto. Tutto il resto è già pronto.

---

## In pratica

Un gioco è un file dentro `js/games/` (per esempio `js/games/timeline.js`) che
alla fine chiama `SG.registra({...})`. Da quel momento compare da solo nella home.

Nel file si dichiara chi è il gioco e come si comincia:

```js
SG.registra({
  id: "nome-corto",          // identificativo, senza spazi
  nome: "Nome del gioco",     // come appare nella home
  icona: "🎯",                // un'emoji
  descrizione: "Due righe che spiegano il gioco in mezzo secondo.",
  giocatoriMin: 2,
  giocatoriMax: 8,

  regole: [                   // mostrate nella schermata "Come si gioca"
    "Prima riga di regola.",
    "Seconda riga. Si può usare <b>grassetto</b>."
  ],

  // FACOLTATIVO: impostazioni extra nella schermata dei giocatori
  // (per esempio "quante carte a testa"). Se non serve, si toglie.
  impostazioni: function (box, dove, aiuti) { /* ... */ },

  // OBBLIGATORIO: qui comincia la partita.
  avvia: function (tavolo) { /* ... */ }
});
```

Poi si aggiunge una riga in `index.html` che carica il file, insieme agli altri
giochi:

```html
<script src="js/games/nome-corto.js"></script>
```

---

## Il "tavolo": cosa riceve il gioco

Quando la partita comincia, al gioco viene consegnato un **tavolo** con tutto ciò
che gli serve, senza che debba sapere come sono fatte le schermate comuni:

| Cosa | A che serve |
|---|---|
| `tavolo.giocatori` | l'elenco dei nomi scelti |
| `tavolo.impostazioni` | le scelte extra (se il gioco le ha chieste) |
| `tavolo.radice` | il riquadro dove il gioco può disegnare, se vuole |
| `tavolo.passaA(nome, poi)` | mostra "passa il telefono a X", poi esegue `poi` |
| `tavolo.fine(classifica)` | chiude la partita e mostra il tabellone finale |
| `tavolo.esci()` | torna alla home |
| `tavolo.el`, `tavolo.mischia`, `tavolo.schermata`, `tavolo.mostra`, `tavolo.svuota` | aiuti pronti per costruire le schermate senza reinventarli |

La **classifica** che si passa a `tavolo.fine(...)` è un elenco ordinato dal
primo all'ultimo. Ogni voce ha un `nome` e, se serve, dei `punti` (un testo
libero, per esempio "3 punti" o "finito!"). Il tabellone con le medaglie, il
"Rigioca" e il "Torna ai giochi" ci pensano da soli.

---

## Le tre cose che ogni gioco sa fare

1. **Comincia** — dentro `avvia`: prepara lo stato (carte, punteggi, ecc.) e
   mostra il primo turno. Se i giocatori sono più di uno, di solito si parte con
   `tavolo.passaA(primoGiocatore, ...)`.
2. **Gioca un turno** — disegna la schermata del turno, aspetta il tocco, mostra
   l'esito, poi passa al giocatore dopo con `tavolo.passaA(...)`.
3. **Dice chi ha vinto** — quando la partita è finita, costruisce la classifica e
   chiama `tavolo.fine(classifica)`.

---

## Regole non scritte, ma importanti

- **Il colpo d'occhio è comune.** Colori, caratteri e bottoni stanno in un unico
  foglio di stile (`css/styles.css`). Un gioco può aggiungere qualche tocco suo,
  ma deve sembrare parte dello stesso prodotto.
- **I bottoni grandi.** Si gioca col telefono che passa di mano: niente da
  toccare più piccolo di un polpastrello.
- **Il contenuto sta a parte.** Se il gioco ha bisogno di tanti dati (domande,
  avvenimenti, parole…), vanno in un file dentro `data/`, così aggiungerne altri
  non richiede di toccare il gioco.
- **Provalo per intero prima di dire che è finito.** Una partita dall'inizio alla
  fine, su schermo stretto.

---

## Quando l'innesto non basterà più

Prima o poi — probabilmente verso il quinto gioco — ci si accorgerà che questo
schema non copre qualcosa (un tipo di punteggio diverso, un turno fatto in un
altro modo). **Bene:** si cambia l'innesto, ma in **un punto solo** (il motore),
non copiando la modifica in cinque giochi. È tutto il senso di avere le cose
comuni scritte una volta sola.

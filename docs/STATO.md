# A che punto siamo

_Aggiornato: 8 settembre 2026 (categorie + link + online)_

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

## Categorie e link per gli amici
- La linea del tempo è divisa in **5 categorie**: Storia, Invenzioni e scoperte,
  Calcio, Rap italiano, Cinema. Chi organizza sceglie quali attivare (tutte o solo
  alcune) e quante carte a testa, **prima** di iniziare.
- Un tasto crea un **link già impostato** da mandare agli amici: chi lo apre parte
  con quelle stesse categorie e impostazioni. (Per ora si gioca comunque passandosi
  un telefono; il "tutti insieme dal proprio telefono" è una scelta ancora aperta.)
- C'è anche un tasto **Novità** in home con il diario degli aggiornamenti.

## Il contenuto della linea del tempo
Circa 130 avvenimenti veri e verificati, in italiano, divisi per categoria: famosi,
sorprendenti e qualche data ravvicinata per far ragionare. Ogni categoria è un file
di dati a parte (`data/eventi-*.js`): aggiungerne altri **non** richiede di toccare
il gioco.

## Cosa manca / prossimi passi possibili
1. **Scelta da chiarire:** quando gli amici aprono il link, si gioca ancora
   passandosi un telefono (funziona già), oppure vogliamo che ognuno giochi dal
   proprio telefono nello stesso momento? La seconda strada richiede molto più
   lavoro (un "cervello" comune online) e va decisa prima di costruirla.
2. **Farlo provare a un gruppo vero** e sistemare quello che non torna.
3. **Ancora più avvenimenti** e magari altre categorie: lavoro lungo ma semplice,
   affidabile a un aiuto (Sonnet) un po' alla volta.
4. Solo dopo: pensare al **secondo gioco**. Le idee sono in `IDEE.md`.

## Come si apre
- Doppio clic su `index.html`: si apre nel browser e si gioca.
- È anche **pubblicato online** come pagina condivisibile (un "Artifact" su
  claude.ai): quel link si apre dal telefono senza installare niente. La versione
  online è un unico file, `dist/serata-giochi.html`, generato da
  `costruisci-versione-online.sh`; per aggiornarla si ripubblica quel file.

## Come è fatto (per chi un domani mette le mani nel codice)
- Tre file di testo comune: HTML, un foglio di stile, e il "motore".
- Il motore tiene le cose che tutti i giochi condividono (schermate, giocatori,
  punteggio, giro di partita). Ogni gioco è un pezzo che si innesta.
- Come si aggiunge un gioco è spiegato in `docs/COME-SI-AGGIUNGE-UN-GIOCO.md`.

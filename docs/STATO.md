# A che punto siamo

_Aggiornato: 13 settembre 2026 (L'Asta: 4 round visibili + "ancora in palio"; Patata: ritorno vincolato)_

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
  - **Ognuno dal suo telefono** (online): prima si crea la stanza (in lobby appare il
    **codice grande** e il tasto **Copia il link da mandare**), poi lì si scelgono le
    **fasi** (Classica o Personalizzata), il **giudice** e le **due squadre** (fissi per
    la partita); ognuno vede sempre il tavolo e la propria mano; a fine partita si torna
    alla lobby per rifare tutto. È il **primo gioco oltre all'Asta** con l'online completo.

- **Gioco 6 — La Scalinata** 🪜: **in 4**. A ogni round, 4 secondi per scegliere in
  segreto **1, 3 o 5** gradini. Le scelte si scoprono tutte insieme (numero sopra la
  testa, poi ~2 secondi di pausa e le pedine salgono): chi sceglie un numero **già
  preso da un altro** resta fermo, avanza solo chi ha un numero **unico**. Scala
  colorata a 4 corsie con pedine animate, traguardo al gradino **15**. Difficoltà
  Media nel torneo.
  - **Un telefono solo**: si passa di mano, ognuno sceglie in segreto.
  - **Ognuno dal suo telefono** (online): stanza con codice + link; i posti liberi li
    riempiono dei **bot** (il primo è **Matt**), così si gioca anche da soli, in 2 o
    in 3. Nella scelta si vedono tutti: chi sceglie **illumina il pallino** e fa un
    **bip**. Secondo gioco (con l'Asta e Sì... però) con l'online completo.

- **Gioco 7 — La Patata Bollente** 💣: da 2 a 10 giocatori. Si vota fra 3 categorie
  (27 in `data/patata-categorie.js`) e si gioca la più votata. Il timer riparte a ogni
  ricezione e cala di 2s ogni 4 passaggi (15→5); si dice una parola a voce e si lancia
  la bomba toccando un altro nel cerchio (non due volte alla stessa persona finché non
  si chiude il giro). "Rimanda indietro" se l'altro non ha risposto (col suo tempo, senza
  reset). A chi scade il tempo esplode: eliminato, fino all'ultimo. Difficoltà Media nel torneo.
  - **Un telefono solo**: si passa di mano, si tocca chi riceve.
  - **Ognuno dal suo telefono** (online): stanza con codice + link; tutti in cerchio,
    ognuno lancia la bomba dal suo telefono.

- **Gioco 8 — Glow Hockey** 🏒: air hockey 1v1 **solo online** (ognuno dal suo
  telefono). Uno apre la stanza, l'altro entra col codice; si muove la racchetta col
  dito nella propria metà (non oltre la metà campo) e si segna nella porta avversaria,
  primo a 7. Host-autoritativo: la fisica del disco gira sul telefono di chi apre la
  stanza (fonte di verità a ~60fps) e l'altro interpola con buffer per un movimento liscio;
  se un pacchetto tarda, il disco viene **estrapolato** col suo vettore velocità (max 70ms)
  invece di congelarsi (anti-scatto). **Ritardi adattivi al canale**: su collegamento diretto
  cuscinetto ospite ~20ms e smorzamento racchetta avversaria ~12ms (su internet 50ms/30ms) →
  su stessa rete i colpi dell'ospite arrivano sul disco quasi subito e la collisione parte.
  Il **campo si adatta allo schermo** (`adattaCanvas` misura lo spazio reale e mantiene le
  proporzioni): tutte e due le porte visibili, niente scorrimento. All'avvio l'host fa un invio
  singolo affidabile dello stato "gioco" (`bcast` in `comincia`) così l'ospite entra in campo
  all'istante. **Collegamenti (dal più veloce): P2P diretto → Ably → MQTT.**
  Il **P2P** (`js/net-p2p.js`, `SGNetP2P`) collega i due telefoni **direttamente** via WebRTC
  DataChannel (`ordered:true, maxRetransmits:0`): sulla **stessa rete** la latenza crolla a pochi
  ms. Usa **Ably solo per presentarsi** (offer/answer/ICE) e come **ripiego automatico**: se il
  canale diretto non si apre (reti diverse, firewall) il gioco resta su Ably, esattamente come
  prima. STUN pubblici Google, niente TURN. Ably: `js/net-ably.js`, chiave in `js/ably-key.js`.
  Durante la partita un indicatore mostra "⚡ diretto" o "🌐 via internet" (callback `onCanale`).
  Canvas, coordinate normalizzate. Grafica ancora essenziale (da rifinire in stile neon).
- **Gioco 9 — Tris** ⭕ (`js/games/tris.js`): il filetto 3×3, in **tre modalità**. **Contro il bot**
  (da solo) con difficoltà Facile (casuale), Medio (vinci/blocca, poi casuale → battibile),
  Impossibile (**minimax**, non perde mai). **In due sullo stesso telefono** (a turno). **Online**
  ognuno dal suo telefono (host = X, ospite = O, host-autoritativo su **SGNet**, a turni: uno apre
  la stanza, l'altro entra col codice). A ogni rivincita si alterna chi inizia. Campo condiviso
  (`campoTris`): griglia responsive, X blu / O rosso, linea vincente evidenziata. Nel torneo si
  gioca "in due" e i punti vanno via `t.fine`. `giocatoriMin:1, giocatoriMax:2, difficolta:1`.
- **Gioco 10 — Drop 4** 🟡 (`js/games/drop4.js`): il "quattro in fila" a gravità, griglia 7×6,
  struttura grigia, Giallo (inizia) vs Bianco, con animazione di caduta. Vince chi allinea 4
  (orizzontale/verticale/diagonale; 69 quaterne precalcolate in `LINEE4`). Stesse **tre modalità**
  del Tris: **bot** (Facile casuale, Medio vinci/blocca, Difficile = **minimax alfa-beta prof. 4**
  con euristica a finestre + apertura al centro per restare reattivo), **in due sullo stesso
  telefono**, **online** (host = Giallo, ospite = Bianco, host-autoritativo su **SGNet**, a turni).
  Rivincita alterna chi inizia. Campo condiviso `campoDrop`. Nel torneo gioca "in due" e i punti
  vanno via `t.fine`. `giocatoriMin:1, giocatoriMax:2, difficolta:2`.
- **Gioco 11 — Scopa** 🃏 (`js/games/scopa.js`): carte napoletane in **due** (mazzo 40). Carte =
  **immagini vere del mazzo napoletano di pubblico dominio** (Wikimedia Commons, autore *Trocche100*,
  rilasciate PD), in `carte/<id>.jpg` (~280px, ~1,1MB totali; il build le copia in `dist/carte/`).
  `cartaEl` rende un `<img>`. Le 3 carte col nome del produttore (Asso e 4 di denari, 4 di coppe) sono
  state **ritoccate** per togliere ogni marchio. **Presa con un tocco** (`tapMano`): automatica se una
  sola presa possibile (anche combinazione), scarto automatico se non prende, scelta solo con più prese.
  **Animazioni**: la presa vola verso chi prende (`.sc-vola`), lo scarto si posa (`.sc-cade`) — niente
  riquadro-risultato. Tavolo centrato (flex). Regole complete: presa per valore
  (singolo forzato, altrimenti somme/combinazioni a scelta), **scopa** a tavolo vuoto (non l'ultima),
  carte finali all'ultimo che ha preso; punti smazzata **Carte/Denari/Settebello/Primiera/Scope**,
  partita a **11**, inizio alternato. Motore puro testabile (`creaMotore`, `catture`, `contaPunti`,
  `primiera`). Due modalità: **bot** (Facile/Medio/Difficile) e **online** su **SGNet**. Online a
  **mani coperte**: l'host invia all'ospite solo `vistaDa(st,"B")` (le carte dell'host non vengono
  mai trasmesse), disegnando la propria vista a parte. UI `renderScopa`/`renderFine`, suono/vibrazione
  alla presa. `giocatoriMin:1, giocatoriMax:2, difficolta:3`. Espone `window.SGCarte` (carte + logica di
  presa) riusato dallo Scopone.
- **Gioco 12 — Scopone** 🃏 (`js/games/scopone.js`): a **4, in due squadre** (tu seat0 + Compagno seat2
  vs Rivali seat1/3), **contro 3 bot**. Varianti **scientifico** (10 a testa, tavolo vuoto) e **classico**
  (9 + 4 sul tavolo). Carte tutte subito (no pesca); presa come Scopa; a fine mano il tavolo all'ultima
  squadra che ha preso. Punteggio **a squadra** (`contaScopone`): Carte/Denari/Settebello/Primiera + Scope,
  partita a **11**, inizio che ruota. Riusa `window.SGCarte` (stesse immagini `carte/*.jpg`, stessa presa
  con un tocco e stesse animazioni della Scopa). UI a 4 (in alto Rivale1·Compagno·Rivale2, tavolo, tua
  mano in basso). Solo **vs bot** per ora (online a 4 = lavoro futuro). `giocatoriMin/Max:1, difficolta:3`.
- **Gioco 13 — Scopa 2 vs 2** 🃏 (`js/games/scopa2.js`, id `scopa2v2`): la Scopa **a squadre, 4 al tavolo**
  (posti 0+2 vs 1+3), turni che alternano le squadre (0→1→2→3). Regole **della Scopa vera** con la **pesca**
  (3 in mano + 4 sul tavolo, si pesca a mani vuote fino a fine mazzo), scopa, tavolo finale all'ultima
  squadra che ha preso; punteggio a squadra a **11**, primo di mano che ruota. **Due modi**: contro i bot
  (tu + 3 bot) e **online** (host = posto 0; gli ospiti prendono i posti 1,2,3; i posti liberi li giocano i
  bot; host-autoritativo, a ognuno mando solo la sua vista). Riusa `window.SGCarte`. Vista relativa al
  giocatore (compagno al centro col 🤝, colori squadra); online i bot hanno nomi neutri ("🤖 Bot N").

### Ritocchi a L'Asta e La Patata (13 set 2026)
- **L'Asta**: si vedono tutti e 4 i round del tema (striscia con icona+nome; quello in corso col contorno
  giallo, i fatti con la spunta) su tutte le schermate del round; durante l'asta di una carta c'è il pannello
  a scomparsa "Ancora in palio" con le altre carte del round (quella corrente marcata). Vale in locale e online.
- **La Patata**: dopo un "Rimanda indietro" chi riprende la bomba può ridarla solo a chi gliela ha rimandata
  (`st.soloDare`), oltre alla regola del giro già presente.

### Ritocchi comuni ai giochi (13 set 2026)
- **Presa mirata (Scopa/Scopone)**: la carta giocata si posa **sopra la carta che prende** (baricentro del
  gruppo, misurato con `getBoundingClientRect` dopo il montaggio), non più al centro. Se svuota il tavolo
  (scopa) si posa al centro.
- **Schermo fisso (Scopa/Scopone/Tris/Forza 4)**: niente più lampeggio. La schermata si monta una volta e a
  ogni mossa si sostituisce **solo** il contenitore di gioco (`replaceChild`) + il piede, senza `t.mostra`
  né `scrollTo`. Riferimenti: `scMount`/`spMount`/`trMount`/`drMount`; si rifà da capo solo cambiando
  schermata (`document.body.contains(box)`). Regola generale: **mai** ricostruire tutta la schermata a ogni
  mossa in nessun gioco.
- **Patata Bollente**: la bomba non si può ridare a chi l'ha già avuta nel giro (tolta l'eccezione su
  `st.ultimo` che permetteva il ping-pong infinito); il ritorno resta solo col tasto "Rimanda indietro".

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

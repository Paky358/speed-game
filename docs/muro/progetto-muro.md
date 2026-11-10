# 🧱 Il Muro — progetto (chat «🧱 Il Muro», 10 nov 2026)

Gioco nuovo di SPeeD GAME ispirato al programma TV «The Wall» (NBC 2016-; versione italiana su Canale 5 con Gerry Scotti).
Nome provvisorio «🧱 Il Muro» («The Wall» è un marchio). id del gioco: `muro`. Si lavora SOLO in D:\SG-muro (ramo `il-muro`).

## Decisioni del proprietario (NON cambiarle)
- A squadre. In ogni squadra c'è chi sta «nella stanza» e chi sta «giù».
  - Nella stanza: risponde in segreto sul suo telefono a una domanda con 2 o 3 risposte possibili.
  - Giù: NON vede la domanda e NON vede cosa ha risposto il compagno; vede solo l'ARGOMENTO (es. «⚽ Calcio») e le risposte
    possibili. Sceglie quante palline far cadere e da dove (come nel Plinko), scommettendo su quanto il compagno la sa.
  - Punti, niente soldi.
- Squadre da 2 (1 stanza + 1 giù) o da 3 (2 stanza + 1 giù); da 2 a 5 SQUADRE, massimo 10 giocatori. Nelle squadre da 3 chi sta
  giù sceglie a ogni domanda anche SU CHI scommettere tra i due compagni. In 6: 3 squadre da 2 oppure 2 da 3. Numero dispari =
  una squadra da 3.
- Tutte le squadre giocano INSIEME, STESSE domande, CRONOMETRO per rispondere e per scegliere le palline. Chi non risponde in
  tempo ha sbagliato; chi sta giù e non sceglie in tempo non fa cadere niente.
- Ogni squadra ha un COLORE suo (mai rosso né verde) e un SIMBOLO sulla pallina.
- DUE MURI, UNO ALLA VOLTA (mai insieme sulla stessa schermata, ognuno prende tutto lo schermo): «💀 Muro dei perdenti»
  (lì i punti si perdono) e «🏆 Muro dei vincitori» (lì si guadagnano).
- Rivelazione di ogni domanda: domanda + risposta giusta col rullo di tamburi (e cosa ha risposto ogni squadra); poi il MURO DEI
  PERDENTI con tutte insieme le palline delle squadre che hanno sbagliato; poi il MURO DEI VINCITORI con quelle di chi ha
  risposto bene. Muro vuoto = si salta o passa in un attimo. Le palline cadono dalla casella scelta da chi stava giù, uguali su
  tutti i telefoni (le decide chi tiene la partita).
- Saletta: ognuno sceglie squadra e ruolo (stanza o giù); l'host può spostare le persone. Tastino «🔄 A rotazione»: acceso =
  i ruoli si scambiano a ogni domanda (squadre da 3: giù uno alla volta, a giro).
- Niente «contratto» finale. L'ULTIMO GIRO vale DOPPIO, con le caselle grandi.
- Domande divise per ARGOMENTI che si accendono e spengono nelle regole ⚙️ (col numero di domande accanto, come la Linea del
  tempo). Almeno 600, con 2 o 3 risposte. Vere e controllate (un aiutante scrive, un altro ricontrolla, le dubbie si buttano).
  Né banali né impossibili, risposte sbagliate credibili, italiano, per una serata tra amici italiani. Le uscite si ricordano
  sul telefono di chi tiene la partita.
- Si vede: muro a tutto schermo, niente scorrimento né titolo in alto, vestito «🌙 Notte vivace», niente lampeggio, palline su
  canvas veloci anche su un telefono lento; con 5 squadre su 360x640 palline e punti leggibili.
- Online nella Sala prima di tutto. Niente trofei. Categoria «Quiz e parole».

## Scelte del proprietario sulle proposte (10 nov 2026, risposta «A B A A A»)
1. Muro **A**: 9 caselle e 9 zone, palline grandi (50 · 100 · 250 · 500 · 1.000 · 500 · 250 · 100 · 50).
2. «🔄 A rotazione» **SPENTO** di partenza (Claude lo proponeva acceso: il proprietario ha scelto spento; si accende in saletta).
3. **Solo online** (niente «sullo stesso telefono»), niente Bot.
4. **15 domande** di partenza (12 + 3 a punti doppi, circa 10 minuti).
5. Punti **anche sotto zero**.

## Squadre (proposta, da rifinire nelle foto)
| squadra   | colore    | simbolo |
|-----------|-----------|---------|
| Blu       | #4c6ef5   | ★ stella |
| Arancione | #ff922b   | ● cerchio |
| Viola     | #cc5de8   | ▲ triangolo |
| Giallo    | #fcc419   | ■ quadrato |
| Azzurro   | #22b8cf   | ◆ rombo |

## Argomenti (12)
`calcio` ⚽ Calcio · `sport` 🏅 Altri sport · `storia` 🏛️ Storia · `geografia` 🌍 Geografia · `cinema` 🎬 Cinema e TV ·
`musica` 🎵 Musica · `scienza` 🔬 Scienza e corpo umano · `natura` 🐾 Animali e natura · `cucina` 🍝 Cucina ·
`italia` 🇮🇹 Italia e tradizioni · `tecnologia` 📱 Tecnologia e invenzioni · `cultura` 🎨 Arte, libri e parole
(Niente «attualità»: invecchia in fretta e le risposte diventano sbagliate.)

## Come va una domanda (bozza del motore)
1. «Domanda» (cronometro uguale per tutti): nella stanza domanda + risposte; giù argomento + risposte + il muro piccolo dove
   toccare le zone (ogni tocco = una pallina da lì) e, nelle squadre da 3, su chi scommette.
2. «Svela»: rullo di tamburi, domanda, risposta giusta, cosa ha risposto ogni squadra.
3. «💀 Muro dei perdenti»: cadono insieme le palline delle squadre che hanno sbagliato (punti tolti).
4. «🏆 Muro dei vincitori»: cadono insieme quelle di chi ha risposto bene (punti dati).
5. Punteggi, poi la domanda dopo. I due muri hanno le STESSE caselle (come il programma: la casella è quella, cambia solo il
   segno). Il percorso delle palline lo decide chi tiene la partita, a caso (±1 mezza casella per fila, come il Plinko del
   Prezzo è Giusto).

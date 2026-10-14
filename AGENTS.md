# SPeeD GAME — istruzioni per chi lavora sul progetto (Claude, Codex, ecc.)

## Con chi parli
- Il proprietario **non è un programmatore** e parla **italiano**: rispondi sempre in italiano semplice, senza gergo tecnico e senza nomi di file o funzioni se puoi evitarli. Spiega cosa cambia **per chi gioca**, non come è fatto.
- Decidi e fai; racconta dopo, in breve. Chiedi solo quando una scelta cambia davvero il gioco.
- Testi dell'app: si dice "avatar" (mai "omino"); numeri grandi sempre col punto delle migliaia (1.000, 10.000).

## Cos'è
Una web app di party game da telefono (tanti giochi, uno per file), in JavaScript semplice: niente framework, niente npm, niente passaggio di compilazione per sviluppare.
- `index.html` carica tutti i file (per provare basta servire la cartella con un qualsiasi server statico).
- `js/core.js`: home, profili, schermate comuni, "Come giocate?", saletta d'attesa online, Sala e Torneo online, trofei, editor degli avatar.
- `js/net.js`: collegamento tra telefoni (broker MQTT pubblico, host-autoritativo). `js/studio.js`: lo studio del game show. `js/omino.js`: gli avatar. `js/nube.js`: profili su Firebase.
- `js/games/*.js`: un gioco per file, si registra con `SG.registra({...})` (vedi `docs/COME-SI-AGGIUNGE-UN-GIOCO.md`).
- `data/`: liste di contenuti e **`data/novita.js`** (il diario delle novità). `parole/`: vocabolario di Nomi, Cose e Città. `css/styles.css`.

## La direzione del progetto (decisa il 13 ott 2026)
- SPeeD GAME è prima di tutto una **raccolta di party game per le serate con gli amici** (stesso telefono e online). Non deve diventare una copia di Habbo.
- Il "mondo" (città a piedi, casa, casinò, circolo, negozio, attività come pesca e scavi) è un **contorno**: si cura e si sistema, ma **non si allarga**. Niente edifici, negozi, mobili o attività nuove, a meno che il proprietario lo chieda espressamente.
- **Ogni gioco si avvia dalla prima schermata in al massimo due tocchi**, senza camminare né aspettare.
- Il lavoro nuovo va sui **giochi**: giochi nuovi, entrare in una partita online più in fretta, tornei, partite belle da guardare.
- In futuro la casa diventa la **vetrina dei successi** (trofei e cose vinte nei giochi): così spinge a giocare invece di essere un gioco a parte.

## Pubblicare = mettere su `master`
- `bash costruisci-versione-online.sh` crea `dist/index.html` (un file unico). Ogni push su `master` fa partire la pubblicazione su GitHub Pages: https://paky358.github.io/speed-game/
- Quindi **mettere qualcosa su `master` vuol dire metterlo online per tutti**: fallo solo quando il proprietario lo chiede ("pubblica").
- Ogni novità visibile va scritta in cima a `data/novita.js` (numero `v` +1), con parole per chi gioca.
- Messaggi di commit in italiano, dicendo cosa cambia per chi gioca.

## Due computer (PC fisso e portatile)
Il proprietario lavora con Claude da due computer, tenuti allineati da GitHub. Quando il PC fisso è acceso gli scrive anche dal portatile (Remote Control): il lavoro allora resta sul PC fisso.
- Si lavora sul ramo **`lavori-in-corso`**, mai direttamente su `master` (che è il sito online). Se il ramo manca, crealo da `master`.
- All'inizio di ogni sessione: `git fetch` e porta `lavori-in-corso` alla versione di GitHub. Se l'altro computer aveva salvato qualcosa, dillo in una riga.
- "Salva il lavoro" (e comunque prima di chiudere o cambiare computer): commit e push di `lavori-in-corso`. Il sito non cambia.
- "Pubblica": costruisci, prova, unisci `lavori-in-corso` in `master` e fai il push di tutti e due.
- La memoria di Claude è diversa su ogni computer: le decisioni importanti si scrivono qui o in `data/novita.js`.
- Il portatile è lento (processore A4, 4 GB): prove nel browser leggere, e chiudi i server di prova quando non servono.

## Regole fisse dei giochi
- **Niente scorrimento per giocare** e niente titolo in alto nei giochi: il tavolo prima di tutto. I giochi a tutto schermo usano `height: var(--alt)` (l'altezza vera dello schermo, misurata da core.js).
- **Niente lampeggio**: a ogni mossa si aggiorna solo la parte che cambia, mai tutta la schermata.
- Account del proprietario: **IL PAPPONE**. Solo lui vede "Prova da solo" (Parola d'ordine), ha tutti i livelli di Palla Matta aperti, i colpi illimitati agli scavi e nel negozio ha la matita per disegnare la commessa (si salva nella sua scheda pubblica e la vedono tutti uguale).
- Vibrazione solo quando si tocca per scegliere, mai mentre si scorre.
- Bot: nei tasti, nelle regole e nei menu si scrive sempre **"Bot"** ("🤖 Gioca col Bot", "Contro il Bot"), MAI "gioca con Matt" o un altro nome. In partita invece i bot hanno nomi e avatar fissi, presi da un gruppo fisso di bot sempre uguali (Matt compreso), così si riconoscono e nascono i tormentoni. Il proprietario (IL PAPPONE) può decidere dal suo account come sono fatti (chiarito il 15 ott 2026: il "togli Matt" del 10 ott valeva solo per i tasti).
- Scene animate grandi: animare solo transform/opacity, sfondi e luci su canvas.
- Insegne di Casinò e Circolo: tutte della stessa misura (stessa targa e stessa scritta, al centro); ogni gioco cambia solo i colori, e gli ornamenti stanno dentro la targa. Due insegne ai lati alla stessa altezza, quella del tavolo in fondo al centro più in alto (deciso l'11 ott 2026; regola in styles.css e casino.js).

## Giochi online (ognuno dal suo telefono)
- **Per un gioco nuovo parti SEMPRE dal modello** `.agents/skills/nuovo-gioco/modello-gioco-online.js` (un gioco vero, già provato) e cambia solo le parti segnate con "QUI". Gli errori più comuni sono elencati nella skill `nuovo-gioco`.
- Prima schermata di ogni gioco: "Come giocate?". Il gioco dichiara i suoi modi locali in `modi`; "Online" lo aggiunge il core se l'id del gioco è in `GIOCHI_ONLINE` (core.js). La scelta del modo **non** sta nelle impostazioni: il core passa `aiuti.modo`.
- Giochi solo online: `modi: []` e `soloOnline: true` (non compaiono nelle liste "sullo stesso telefono").
- L'host tiene lo stato e manda a tutti una "foto" (vm); gli altri mandano solo le loro mosse. Nel vm/lobby devono esserci **gli id dei giocatori** (chi entra ripete "join" finché non vede il suo id).
- **Chi rientra** (pagina ricaricata, app riaperta) torna con lo **stesso id** (`SGNet.entra` lo ricorda per stanza): il "join" di un id già dentro deve rimandargli la foto e i suoi segreti (carte, parola…), senza cambiare la schermata dell'host e senza farlo entrare due volte.
- Saletta d'attesa uguale per tutti: `t.lobby({ host, codice, pronta, giocatori:[{id,nome,omino,host,tu}], min, extra, onComincia, onEsci, ... })`.
- Chi entra manda il suo avatar (`t.mioOmino(nome)`); chi ha un profilo entra da solo col suo nome (`t.nomeProfilo()`).
- Regole cambiabili dall'host in saletta: il gioco implementa `t.onRegole(impostazioni)` se legge le impostazioni all'avvio.
- A fine partita: `t.risultato([{ nome, pos }])` (serve al torneo online). Nei giochi a due va chiamato anche nella partita contro il bot: serve al torneo a eliminazione (`GIOCHI_ELIMINAZIONE` in core.js).
- Un gioco a due nel torneo a eliminazione deve anche: mostrare la partita a chi guarda (`t.linkParams.guarda`: si collega con `SGNet.entra` senza mandare "join", non può toccare, niente trofei né suoni; esempio `guardaTris` in tris.js) e, nella partita contro il bot, mandare lo stato con `t.trasmetti(msg)` (gli stessi messaggi dell'host online).

### Regole nuove dell'online (dal 14 ott 2026, saletta nuova)
- **Nessuna schermata resta ferma**: ogni attesa di un tocco (Avanti, Prossimo giro, Continua…) ha un tempo e usa `t.contoAvanti(nodo, secondi, fn, chiave)`. L'host lo mette sul suo tasto con `fn` (a zero va avanti da solo); gli altri su una scritta con `fn = null` ("Si va avanti tra 8…"). Nella foto si mandano i **secondi che mancano**, non l'ora (gli orologi dei telefoni sono diversi). La `chiave` (es. `"esito|" + turno`) fa continuare il conto se il tasto viene ridisegnato. Il conto chiama la funzione: mai `bottone.click()` (fa vibrare).
- **`onErrore` arriva solo se il primo collegamento non riesce** (15 secondi di tentativi): lì si offre "Riprova". Dopo, la rete che salta non arriva al gioco: il core mostra "📶 Mi ricollego…" e il collegamento riprova da solo. **Mai chiudere la partita su `onErrore`.**
- `onChiuso(perché)` per chi entra: `{ voluto: true }` = l'host ha chiuso apposta; `{ sparito: true }` = l'host non è tornato in 2 minuti (fuori dalla Sala il core mostra già "La stanza è chiusa").
- Per l'host, facoltativi: `onForse(id)` quando un amico sparisce senza salutare (es. 📶 accanto al nome) e `onTornato(id)` quando torna in tempo; dopo 20 secondi arriva `onAddio(id)` come prima. Chi torna dopo `onAddio` manda di nuovo "join" con lo stesso id: rimettilo in partita col suo posto.
- I messaggi che cominciano con **"__"** sono del core (faccine, pronti, 3-2-1, XP): i giochi non li ricevono e non devono usarli.
- Nella foto ci va sempre `fase` ("lobby", "gioco", "fine"…): il core la usa per riaprire la stanza se l'host ricarica la pagina (si riparte dalla saletta con lo stesso codice e le stesse regole).
- **Giochi a due**: `postiOnline: 2` in `SG.registra`. Gioca solo l'avversario scelto dall'host (il suo id nella foto, es. `avvId`); chi è in più guarda, senza "Tu" né "Tocca a te". Chi arriva a partita cominciata la guarda ed entra alla prossima (l'host non lo mette in partita).
- **Faccine**: `t.faccine()` dà la fila delle faccine della saletta (o `null` se la partita non è online): mettila dove si aspetta o si guarda (classifica finale, chi guarda una partita a due, attese lunghe).
- **Conferme**: `t.conferma(domanda, nota, testoSì, fn)` (anche `t.conferma(domanda, fn)`), la finestra al centro dell'app: mai `window.confirm`. Dalla saletta il core chiede già all'host "Chiudere la stanza per tutti?".
- `t.lobby` accetta anche `spettatore: true` (o il testo da mostrare, es. partita piena: "👀 Guardi questa partita"), `confermaEsci`, `nota`, `testoComincia`.
- Giochi con l'host di riserva (come Parola d'ordine): `hostDiRiserva: true` in `SG.registra` (il core non li riavvia quando cambia l'host).
- Per arrivare a un gioco in due tocchi: nei `modi`, `diretto: true` salta le impostazioni e parte subito; `min` è il minimo di giocatori di quel modo. `g.impostazioni` riceve anche `aiuti.giocatori` (i nomi di chi gioca).
- `t.schermata` toglie il titolo solo se è uguale al nome del gioco; `t.esci()` ferma il gioco (dopo, i suoi timer non disegnano più).

## Trofei
Lista `TROFEI` in core.js (`{ gioco, livello, icona, nome, desc, stat, meta }`) più i contatori nei giochi, salvati con `SGNube.salvaProgressi(...)`. Le liste arrivano dal proprietario: prima di aggiungerle, controllare che si possano davvero ottenere e che i numeri non siano esagerati.

## Procedure dettagliate (skill)
In `.agents/skills/` ci sono le procedure passo passo: leggi quella giusta prima di cominciare.
- `nuovo-gioco`: creare un gioco nuovo o portarlo all'online (file da toccare, contratto, controlli finali).
- `prova-nel-browser`: provare l'app con un profilo finto e amici finti.
- `trofei`: aggiungere o cambiare trofei.
- `contenuti`: scrivere liste di parole, carte, domande e avvenimenti.

In `docs/appunti-claude.md` ci sono gli appunti di Claude sul progetto (decisioni prese gioco per gioco, come provare, il mini-server di prova in PowerShell): su un computer nuovo, leggili e salvali nella memoria.

## Come provare
Non ci sono test automatici: si prova nel browser. Per l'online si sostituiscono `SGNet.ospita/entra` con dei finti che registrano i messaggi, e `SGNube.profilo` con un profilo finto: **mai** usare password o account veri.

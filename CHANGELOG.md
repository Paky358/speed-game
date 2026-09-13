# Diario delle modifiche

_Cosa è stato aggiunto all'app, dalla più recente. Le stesse novità si vedono
anche dentro l'app, dal tasto **🆕 Novità** nella schermata iniziale. Il
contenuto di quel tasto vive in `data/novita.js`._

## 13 settembre 2026 (6) — Tris e Drop 4: suoni + vibrazione leggera
- Motore audio condiviso in core: `SG.audioCtx()` — un solo AudioContext per l'app, creato/ripreso
  al primo gesto (autoplay policy). Riscaldato anche nei tap "Entra" (ospite online).
- **Tris**: `suonoPenna()` — raffica di rumore filtrato (highpass+bandpass) con envelope "a tratti"
  = pennarello che scrive veloce. Scatta a ogni pedina (locale in `gioca`, online host in `applica`,
  ospite quando il conteggio pedine cresce). Vibrazione ~10ms.
- **Drop 4**: `suonoDrop()` — "tock" (oscillatore triangolare che scende) + click di contatto
  (rumore highpass) + assestamento; `suonoDropAtterra()` lo ritarda ~210ms per sincronizzarlo con
  la fine dell'animazione di caduta. Stessi punti d'innesco. Vibrazione ~22ms.
- Sintesi via Web Audio (niente file audio). Su iOS la `navigator.vibrate` è ignorata (innocuo).
  Collaudato: WebAudio "running", oscillatori/buffer eseguiti senza eccezioni, mosse invariate.

## 13 settembre 2026 (5) — Nuovo gioco: Drop 4 (quattro in fila, 3 modalità)
- Nuovo `js/games/drop4.js`. Griglia 7×6, gravità (la pedina cade nel primo posto libero),
  Giallo (inizia) vs Bianco, struttura grigia; animazione di caduta (`@keyframes sgDropCade`).
  Le 69 quaterne vincenti precalcolate (`LINEE4`) coprono orizzontali, verticali e diagonali.
- Tre modalità come il Tris: **bot** (Facile=casuale, Medio=vinci/blocca poi casuale,
  Difficile=**minimax alfa-beta profondità 4** con euristica a finestre + apertura istantanea al
  centro per restare reattivo), **in due sullo stesso telefono**, **online** (host=Giallo,
  ospite=Bianco, host-autoritativo su SGNet, a turni). Rivincita alterna chi inizia. Nel torneo
  gioca "in due" e assegna i punti via `t.fine`. `giocatoriMin:1, giocatoriMax:2, difficolta:2`.
- Campo condiviso `campoDrop`: 7 colonne toccabili, buchi scuri, pedine gialle/bianche, quaterna
  vincente evidenziata in verde.
- Collaudato E2E in locale: gravità (una mossa = una pedina in fondo), vittoria verticale e
  orizzontale con linea evidenziata, bot che blocca e vince; online host↔ospite con mosse
  sincronizzate nei due sensi. Nessun errore dal gioco.
- `index.html`: aggiunto lo script (il build lo prende dal glob `js/games/*.js`).

## 13 settembre 2026 (4) — Nuovo gioco: Tris (3 modalità)
- Nuovo `js/games/tris.js`. Tre modalità: **contro il bot** (Facile=casuale, Medio=vinci/blocca
  poi casuale, Impossibile=**minimax** perfetto), **in due sullo stesso telefono** (hotseat),
  **online** (host=X, ospite=O, host-autoritativo su SGNet, a turni). A ogni rivincita si alterna
  chi inizia (equità).
- Telaio riusato: `SG.registra` con `giocatoriMin:1, giocatoriMax:2, difficolta:1`; chip modalità in
  `impostazioni`; campo condiviso `campoTris` (griglia 3×3 responsive, X blu/O rosso, linea vincente
  evidenziata); online con `lobbyTris`/`disegnaVM` sullo stesso schema di Scalinata (join → vm → gioco).
  Nel torneo forza "in due" e assegna i punti via `t.fine`.
- Collaudato E2E in locale: bot Impossibile (gioca centro/angoli e blocca le minacce), vittoria con
  linea evidenziata + "Vince", rivincita con inizio alternato; online host↔ospite (mosse sincronizzate
  nei due sensi, fine e rivincita propagate, ruoli corretti host/ospite), zero errori.
- `index.html`: aggiunto lo script (il build lo prende già dal glob `js/games/*.js`).

## 13 settembre 2026 (3) — Glow Hockey: campo a schermo + ritardo adattivo + avvio ospite
- **Campo che entra nello schermo**: `creaCanvas` non impone più `larghezza×ASP` (sforava in
  altezza → serviva scorrere). Nuova `adattaCanvas(C)` chiamata dopo `mostra`: **misura** lo
  spazio reale sotto al campo (`getBoundingClientRect().top`) e ridimensiona mantenendo ASP →
  tutte e due le porte visibili, nessuno scorrimento. `collegaInput(C, …)` legge `C.cssW` live
  (non più catturato) così l'input resta corretto dopo il ridimensionamento. Indicatore spostato
  sopra al campo.
- **Ritardo adattivo al canale** (le collisioni dell'ospite non partivano nemmeno da diretto,
  perché il ritardo era tarato per internet): ospite `DELAY` 20ms se `diretto` (altrimenti 50ms);
  host, smorzamento racchetta avversaria `tcG` 12ms se `diretto` (altrimenti 30ms). Su stessa rete
  il colpo dell'ospite arriva sul disco quasi subito → collisione affidabile.
- **Avvio ospite immediato**: `comincia()` ora fa `bcast(true)` (invio singolo affidabile dello
  stato "gioco") prima di partire → l'ospite entra in campo all'istante, senza dipendere dal primo
  giro del ciclo. Risolve i casi in cui restava su "In attesa che l'host cominci".
- Collaudato E2E in locale (host + ospite, WebRTC): ospite entra in campo, canale "diretto", campo
  che entra a schermo (fondo a 719/812, margine 93px), zero errori.

## 13 settembre 2026 (2) — Glow Hockey: modalità "stessa rete" (P2P WebRTC) + fix lobby ospite
- Nuovo trasporto **`SGNetP2P`** (`js/net-p2p.js`): collegamento **diretto telefono-a-telefono**
  via **WebRTC DataChannel** (`ordered:true, maxRetransmits:0` → basso ritardo, niente code né
  scavalcamenti). Segnalazione (offer/answer/ICE) **solo su Ably** (niente MQTT, che trattiene i
  messaggi); STUN pubblici Google, **niente TURN** (se il diretto non si fa, si resta su Ably).
- `scegliNet()` in hockey ora preferisce P2P → Ably → MQTT. Stessa interfaccia, il gioco non cambia:
  se il canale diretto è aperto il gioco viaggia lì, altrimenti passa da Ably (ripiego automatico).
- **Indicatore live** sotto al campo: "⚡ diretto (stessa rete)" o "🌐 via internet" (callback
  `onCanale`).
- **Fix**: l'ospite restava su "Collegamento in corso…" perché l'host in lobby non gli inviava
  nulla. Ora l'host fa `bcast` sullo `join` e l'ospite mostra "✅ Sei dentro!" già da `onAperto`.
- Collaudato in locale (due schede, WebRTC loopback): canale "diretto" aperto su entrambi i lati,
  messaggi host↔ospite scambiati sul canale diretto, zero errori.

## 13 settembre 2026 — Glow Hockey: colpi ospite più reattivi + disco più liscio
- **Collisione ospite**: la racchetta avversaria sull'host era smorzata a ~70ms → il colpo
  dell'ospite arrivava sul disco in ritardo e spesso "mancava". Smorzamento ridotto a **~30ms**
  (tiene comunque calmi micro-scatti e spintoni anomali sul disco): i colpi dell'ospite
  vengono registrati molto meglio.
- **Anti-scatto ospite**: quando un pacchetto tarda/si perde, invece di congelare il disco
  (freeze → salto) ora lo **estrapola** col suo vettore velocità per un breve tratto
  (max 70ms), poi riprende liscio all'arrivo del dato vero. Nel buffer salvo anche `pvx/pvy`.
- Invariati: `HZ=16` (~60/sec), `DELAY=50ms`, host-autoritativo, no predizione disco lato
  ospite (per non reintrodurre i teletrasporti).
- Limite onesto: su stessa rete il traffico passa comunque da Ably (internet) → resta un
  filo di RTT. Il salto di qualità per la stessa rete sarebbe un collegamento **P2P WebRTC**
  diretto (LAN), da valutare come prossimo passo.

## 12 settembre 2026 (7) — Aspetto meno cupo (sfondo blu più vivace)
- Palette alzata verso un **blu più chiaro/vivace** (`--sfondo` #141326→#223066, carte
  più chiare) con **sfumato** sul body; testo portato a bianco pieno per contrasto. Vale
  ovunque (home, lobby, giochi) perché tutto usa le variabili colore.

## 12 settembre 2026 (6) — Glow Hockey: via i teletrasporti del disco (ospite)
- Rimossa la predizione locale del disco lato ospite: faceva divergere il disco dall'host
  e, alla correzione, causava **teletrasporti**. Ora l'ospite **non simula** il disco:
  lo segue dallo stato dell'host, **estrapolato al presente** (poco ritardo) e ci **scivola**
  verso con easing (~50ms), **senza mai saltarci** durante il gioco (aggancio solo sul
  ricentro dopo gol). Niente più teletrasporti; movimento liscio.
- Compromesso onesto: il colpo dell'ospite sul disco torna ad avere il ritardo "fisico"
  del collegamento (meglio del teletrasporto).

## 12 settembre 2026 (5) — Glow Hockey: disco liscio lato ospite (zona morta)
- Riconciliazione del disco senza micro-strattoni: **zona morta** (~4% del campo) sotto
  cui non si corregge la posizione → il disco si muove solo con la fisica locale (liscio);
  **velocità sempre allineata** all'host (invisibile, tiene la traiettoria giusta); aggancio
  secco solo su differenze grosse (gol). Estrapolazione autorità ridotta a 150ms.
- Invii a **~50/sec** (dati più freschi). Racchetta avversaria: smorzamento 90→70ms
  (meno ritardo, resta liscia grazie al rate più alto).

## 12 settembre 2026 (4) — Glow Hockey: racchetta avversaria fluida (anti-scatto)
- La **racchetta dell'avversario** ora **scivola** dolcemente verso l'ultima posizione
  ricevuta invece di saltarci (smorzamento con costante di tempo ~90ms, indipendente dal
  frame-rate), sia sul lato host che ospite. Toglie gli scatti visibili anche a chi apre
  la stanza; anche il colpo dell'avversario sul disco risulta più fluido.

## 12 settembre 2026 (3) — Glow Hockey: predizione lato ospite (colpi istantanei)
- L'ospite ora **simula il disco in locale** (client-side prediction): quando colpisce,
  la reazione è **immediata**, senza aspettare l'host. Il disco locale si **riallinea
  dolcemente** con lo stato autorevole dell'host (aggancio secco solo se la differenza è
  grande, es. dopo un gol). Risolve il "molto in ritardo" lato ospite.
- Tolta l'interpolazione con ritardo di rendering (dava liscio ma in ritardo), sostituita
  dalla predizione (reattiva).
- Fisica locale dedicata `passoLocale` (come quella dell'host, ma senza gol: le pareti
  rimbalzano soltanto). `net-ably.js`: gestite le promise di publish/presence (niente
  errori in console) e uscita via `client.close()`.

## 12 settembre 2026 (2) — Glow Hockey su Ably (realtime a bassa latenza)
- **Collegamento realtime dedicato (Ably)** per Glow Hockey: nuovo `js/net-ably.js`
  (`SGNetA`, stessa interfaccia di SGNet — ospita/entra/invia/inviaVeloce) sopra Ably.
  Molto più veloce e costante del broker MQTT pubblico → niente più scatti del disco.
- Chiave in `js/ably-key.js` (limitata publish/subscribe/presence, piano gratis). SDK da
  `cdn.ably.com/lib/ably.min-2.js`. Se Ably/chiave mancano, l'hockey **torna da solo**
  su MQTT (`scegliNet()`), quindi nessun rischio.
- **Interpolazione con buffer** lato ospite (~100ms di ritardo di rendering) già introdotta:
  movimento liscio anche con pacchetti irregolari.
- Gli altri giochi restano su MQTT (adeguato al loro ritmo turn-based). Verificato
  end-to-end su Ably (lobby, join, streaming disco/racchette).

## 12 settembre 2026 — Nuovo gioco: Glow Hockey 🏒 (online, in tempo reale)
- **Nuovo gioco** air hockey 1v1, solo online (ognuno dal suo telefono). HTML5 Canvas.
- **Host-autoritativo**: l'host calcola la fisica del disco a ~60fps ed è la fonte di
  verità; l'ospite manda solo la propria racchetta e **estrapola** il disco (attenua il
  lag; un po' di ritardo lato ospite resta — è il limite del broker pubblico).
- **Coordinate normalizzate** (campo 1×1.7) indipendenti dallo schermo; ogni telefono
  vede la propria racchetta in basso (vista ruotata di 180° per l'ospite).
- **Fisica**: collisioni circolari disco/racchetta con trasferimento di velocità,
  rimbalzo pareti, attrito, porte centrali, gol e reset al centro, primo a 7.
- **Controlli**: pointer/touch, la racchetta non supera la linea di metà campo.
- `net.js`: aggiunto `inviaVeloce` (invio NON trattenuto) per lo streaming ad alta
  frequenza, così il broker non viene intasato di messaggi retained.
- Grafica volutamente essenziale per ora (cerchi/linee): verrà rifinita in stile neon.

## 11 settembre 2026 (9) — Logo a fulmini + categorie tue giocate direttamente
- **Home**: al posto dei coriandoli, un logo SVG di **tre fulmini** (centrale grande, i
  due laterali che incrociano le punte), gialli con un alone blu leggero.
- **Patata, categorie personalizzate**: ora si **giocano direttamente** (sono le opzioni
  offerte al voto), non finiscono diluite nel mazzo; se sono meno di 3 si completa con
  categorie a caso.

## 11 settembre 2026 (8) — Patata: categorie tue, classifica finale, +10 categorie
- **Categorie personalizzate**: nella lobby online l'host può scrivere categorie sue,
  che entrano nel mazzo insieme alle altre (passate al motore come `extraCats`).
- **Classifica finale**: a fine partita si vede l'ordine dal vincitore fino al primo
  esploso (si tiene `eliminati` in ordine; la classifica è `vivi()[0]` + eliminati al
  contrario).
- **+10 categorie** (Sport, Colori, Elementi chimici, Lingue parlate, Materie
  scolastiche, Parole straniere usate in Italia, Modi per salutare, Oggetti nel
  frigorifero, Giochi da tavolo, Programmi televisivi): ora 69 in tutto.

## 11 settembre 2026 (7) — Patata: rifiniture + home "SPeeD GAME"
- **Puoi sempre ridare la bomba a chi te l'ha appena passata/rimandata** (campo
  `ultimo`): risolve il caso in cui, dopo "Rimanda indietro", non si poteva ridare
  la palla a chi l'aveva rimandata.
- **Più chiaro che si tocca la testa**: istruzione "tocca la testa 👇" e i pallini
  passabili ora hanno un anello verde che pulsa (più grandi e tappabili).
- **Tasto d'emergenza** riscritto: "🆘 SOLO se … non ha detto la parola: rimandagliela".
- **Eliminazione**: la bomba va a caso a un giocatore ancora **non scelto** nel giro
  (per completarlo), invece di azzerare tutto.
- Home: il titolo ora è **"SPeeD GAME"**.

## 11 settembre 2026 (6) — Nuovo gioco: La Patata Bollente 💣
- **Nuovo gioco** ispirato a "Bomba a Tempo". Da 2 a 10 giocatori, difficoltà Media.
- Si **vota fra 3 categorie** (`data/patata-categorie.js`, 27 categorie); si gioca la
  più votata.
- **Timer**: riparte a ogni ricezione (ticchettio che accelera); il tetto cala di 2s
  ogni 4 passaggi: 15, 13, 11, 9, 7, 5 (poi "Rimanda indietro" NON resetta il timer).
- **Cerchio**: i giocatori in cerchio (pallino + nome); il detentore tocca chi vuole
  per passare. Non si può ripassare alla stessa persona finché non si chiude il giro.
- **Rimanda indietro**: se chi l'ha passata non ha detto la parola, torna a lui col
  suo tempo. A chi scade il tempo esplode: eliminato, fino all'ultimo.
- **Un telefono solo** e **online** (ognuno dal suo, codice + link, cerchio condiviso):
  motore di gioco condiviso fra le due modalità. Verificate entrambe end-to-end.

## 11 settembre 2026 (5) — Online più solido + Scalinata: scelta senza sfarfallio
- **Il codice della stanza compare subito** (`net.js`): `onCodice` non aspetta più
  il collegamento al broker — il codice si conosce localmente, quindi si mostra
  immediatamente (fix del caso "la stanza non dava il codice" su rete lenta). Firato
  un tick dopo, così `rete` è già assegnata (niente più crash `invia` undefined).
- **Spia stato stanza**: `onConnesso` (host) → 🟡 "sto aprendo…" / 🟢 "stanza pronta".
  Aggiunto anche a L'Asta, Sì... però e Linea del tempo (pubblicano lo stato appena
  collegati).
- **Scalinata, fase di scelta**: la scalinata resta visibile con i numeri 1/3/5 sotto
  (via `disegnaScala(..., outDots)`); tolto il pannello a carte.
- **Niente sfarfallio**: quando arriva una scelta si aggiorna SOLO il pallino (glow) +
  bip, con update in-place (nessun `t.mostra`, un solo disegno per round).
- **Rivelazione più pulita**: tolta la legenda "X ha scelto N" (il numero è già sopra
  la testa), online e a un telefono solo.

## 11 settembre 2026 (4) — La Scalinata online (bot, pallini, suono)
- **Modalità "ognuno dal suo telefono"**: stanza con codice + link (come L'Asta),
  scelta simultanea sul proprio telefono. Host-authoritative via MQTT.
- **Bot per fare 4**: i posti liberi si riempiono di bot (il primo è **Matt**, poi
  Kevin, Cody), così si gioca anche da soli, in 2 o in 3.
- **Fase di scelta condivisa**: si vedono sempre tutti i giocatori; quando uno
  sceglie, il suo pallino **si illumina** e parte un **bip** (WebAudio). Countdown 4".
- **Suspense alla rivelazione** (vale anche a un telefono solo): i numeri restano ~2
  secondi sopra la testa di tutti prima di far salire le pedine.
- Rifattorizzato `disegnaScala` per accettare un elenco di giocatori (riuso online/offline).

## 11 settembre 2026 (3) — Sì... però online: stanza prima, regole dopo
- **🔗 Codice e link nella lobby**: aprendo la stanza online, la lobby mostra il
  codice grande e un tasto "Copia il link da mandare" (come L'Asta). Prima il
  codice non si vedeva/inviava.
- **Ordine invertito**: scegliendo "ognuno dal suo telefono", nella schermata
  iniziale spariscono fasi e round; si sceglie prima il modo (= si crea la stanza),
  poi le fasi (Classica/Personalizzata) si impostano **nella lobby**.
- "Un telefono solo" invariato (fasi e round restano nella schermata iniziale).

## 11 settembre 2026 (2) — Nuovo gioco: La Scalinata 🪜
- **Nuovo gioco** ispirato a Wii Party ("Scalinata a sorte"). Solo in **4**.
- A ogni round, 4 secondi per scegliere in segreto **1, 3 o 5** gradini. Le scelte
  si scoprono tutte insieme, col numero sopra la testa di ognuno.
- Regola del colpo di scena: chi sceglie un numero **già scelto da un altro** resta
  fermo; avanza solo chi ha un numero **unico**. Traguardo al gradino **15**.
- Scala colorata a 4 corsie con pedine che salgono animate. A un telefono solo.

## 11 settembre 2026 — Sì... però online + rifiniture
- **🔗 Sì... però ognuno dal suo telefono**: online host-authoritative (via la
  stessa stanza MQTT dell'Asta). In lobby l'host sceglie il **giudice** e forma
  le **due squadre** (fissi per la partita); a fine partita si torna alla lobby
  per rifarle.
- Ogni giocatore vede **sempre** il tavolo (scenari di entrambe le squadre) e la
  **propria mano** (Bonus e Malus da lanciare); la mano è privata alla squadra.
- Qualsiasi membro di una squadra gioca le carte della fase (host prende la prima
  valida). Il giudice decide alla fine.
- A un telefono solo: la fase **Cerotto** è ora un **Rinforzo** (un altro Bonus su
  di sé), e **niente timer** per scegliere le carte né per l'arringa.
- Motore: la sala non blocca più l'host che apre una stanza online da solo.

## 10 settembre 2026 (11) — Nuovo gioco: Sì... però
- **🤨 Sì... però**: party game a squadre (stile Superfight). A ogni round uno fa
  da giudice a rotazione e gli altri si dividono in due squadre; da 3 giocatori.
- 4 fasi (Paradiso, Schianto, Cerotto impilabile su un Malus, Ghigliottina), poi
  arringa da 1 minuto e il giudice sceglie. Punti personali; si aggancia al Torneo.
- L'host può usare la **sequenza classica** o **comporre le fasi** (tipo, quante,
  bersaglio). Mano sempre ricaricata a 7 Bonus e 7 Malus.
- Carte in `data/sipero-carte.js` (51 Bonus, 50 Malus di partenza).

## 10 settembre 2026 (10) — Nuovo gioco: L'Impostore
- **🕵️ L'Impostore**: un telefono solo. Tutti hanno la stessa parola tranne
  l'impostore; il telefono gira e ognuno vede il suo ruolo in segreto.
- L'host sceglie l'**aiutino**: all'impostore una parola simile ma diversa
  (coppie in `data/impostore-parole.js`), oppure al buio. **Chi inizia** è
  sorteggiato, e l'impostore è sorteggiato tra tutti.
- Votazione segreta a turni, poi esito e punti: scoperto → a chi l'ha beccato,
  franca → all'impostore. Classifica finale; si aggancia al Torneo. Da 3 giocatori.

## 10 settembre 2026 (9) — Nuovo gioco: Nomi, Cose e Città
- **✍️ Nomi, Cose e Città**: a turni, un telefono solo. Esce una lettera, parte il
  tempo, e si riempiono le categorie con parole che iniziano con quella lettera.
- Categorie **scelte dall'host**: classiche (in `data/ncc-categorie.js`), set
  **Black humor**, e **categorie personalizzate** scritte dai giocatori (salvate
  su quel telefono). Tempo per turno e giri a testa regolabili.
- **Punteggio col voto del gruppo**: ogni parola la validano gli altri (👍/👎, si
  può cambiare idea). Più del 50% di sì = 10 punti, 5 se due scrivono la stessa
  parola (maiuscole/minuscole indifferenti), 0 se bocciata o vuota. Classifica
  finale; si aggancia da sé al **Torneo** (difficoltà Media). Da 2 giocatori in su.

## 10 settembre 2026 (8) — Fix: entrare col codice apriva il gioco sbagliato
- Chi entrava in una stanza digitando il **codice** veniva sempre mandato nella
  Linea del tempo, anche se l'host stava ospitando un altro gioco (es. L'Asta).
- Ora l'host **annuncia quale gioco** è la stanza (topic `.../<CODICE>/meta`,
  retained) e chi entra col codice lo **scopre** con `SGNet.scopriGioco` e apre
  quello giusto. Il link condiviso funzionava già.

## 10 settembre 2026 (7) — Modalità Torneo
- **🏆 Torneo**: dalla home si crea un torneo con un gruppo fisso di giocatori e si
  giocano più partite di fila (anche a giochi diversi). I punti si sommano e la
  classifica generale è sempre visibile, con podio finale.
- **Punteggio bilanciato per difficoltà**: ogni gioco ha un peso (Facile/Media/
  Difficile). Il vincitore prende 100/200/300 punti; gli altri a scalare fino al
  10° posto (curva 100·78·62·50·40·32·25·19·14·10 % del primo). Linea del tempo =
  Media, L'Asta = Difficile.
- Nel torneo i giochi girano "un telefono solo" (niente codici diversi per ogni
  gioco): l'online per singola partita resta invariato fuori dal torneo.

## 10 settembre 2026 (6) — Il tema Il Road Trip
- **🚗 Il Road Trip**: 184 carte in Il Mezzo, Il Guidatore, La Colonna Sonora,
  L'Imprevisto in Autostrada.
- I temi dell'Asta diventano quattordici.

## 10 settembre 2026 (5) — Il tema La Sessione Universitaria
- **🎓 La Sessione Universitaria**: 184 carte in La Preparazione, L'Esaminatore,
  Il Compagno prima di te, La Domanda. Primo tema scritto applicando fin
  dall'inizio la regola d'oro (nessuna carta anticipa l'esito).
- I temi dell'Asta diventano tredici.

## 10 settembre 2026 (4) — Il tema Il Capodanno
- **🎆 Il Capodanno**: 184 carte in L'Organizzatore, La Location, L'Imprevisto a
  Mezzanotte, Il Conto.
- Regola d'oro fissata per tutte le carte future del gioco: nessuna carta, in
  nessuna fascia, dichiara l'esito della storia — sono solo ingredienti, il
  risultato lo votano gli altri.
- I temi dell'Asta diventano dodici.

## 10 settembre 2026 (3) — Il tema La Palestra di Quartiere
- **🏋️ La Palestra di Quartiere**: 184 carte in L'Istruttore di Sala, Il Compagno
  d'Allenamento, L'Attrezzo Libero, Lo Spogliatoio. Stesso tono da spogliatoio
  del tema Calcetto.
- I temi dell'Asta diventano undici.

## 10 settembre 2026 (2) — Il tema La Squadra da Calcetto
- **⚽ La Squadra da Calcetto**: 184 carte in Il Portiere, Il Difensore, Il
  Centrocampista, L'Attaccante. Tono da spogliatoio scritto direttamente dal
  proprietario, tenuto come modello per i temi futuri.
- I temi dell'Asta diventano dieci.

## 10 settembre 2026 — Giardino, Vacanza e Coinquilino
- **🌳 Il Giardino Perfetto**: 184 carte in Il Terreno, L'Attrazione, Sport e
  Divertimento, L'Infestante. Nell'ultimo round la logica è al contrario di
  Supereroi: la fascia alta sono gli ospiti belli, la bassa le invasioni.
- **🏝️ La Vacanza Perfetta**: 184 carte in Il Mezzo di Trasporto, L'Alloggio,
  Il Compagno di Viaggio, L'Attività.
- **🏠 Il Coinquilino Ideale**: 184 carte in L'Abitudine Notturna, La Specialità
  in Cucina, L'Animale Domestico, Il Pagamento dell'Affitto. Tono da spogliatoio
  più marcato: indicato dal proprietario come il tema più riuscito finora.
- I temi dell'Asta diventano nove.

## 9 settembre 2026 — Supereroi e Primo Appuntamento
- **🦸 Supereroi**: 184 carte in quattro round — Il Superpotere ⚡, Il Costume 🥋,
  Il Gadget 🔫, Il Punto Debole ☠️. Nel round finale la fascia alta è la debolezza
  rarissima, la fascia bassa l'imbarazzo quotidiano.
- **💘 Il Primo Appuntamento**: 184 carte in quattro round — La Location 📍,
  L'Outfit 👗, L'Argomento 💬, L'Imprevisto 🌧️.
- Il quarto round dell'appuntamento doveva essere "La Conclusione": è stato
  cambiato perché il finale non si compra, deve venire fuori dalla combinazione
  delle carte e poi lo votano gli altri. Regola valida per tutti i temi futuri.
- I temi dell'Asta diventano sei.

## 9 settembre 2026 — L'Asta online e il tema "Il Colpo del Secolo"
- **L'Asta si gioca anche a distanza**: chi organizza sceglie all'inizio fra *Un
  telefono solo* e *Ognuno dal suo telefono*. Nel secondo caso l'app apre una
  **stanza con codice** e un link da mandare agli amici.
- Online ognuno **rilancia dal proprio telefono**, vede offerta e crediti in tempo
  reale, sceglie la sua carta quando tocca a lui e **vota in segreto** i kit degli
  altri (mai il proprio). Tutto è tenuto insieme da chi ha aperto la stanza.
- **Nuovo tema: 💰 Il Colpo del Secolo** — 184 carte in quattro round: La Mente 🧠,
  I Muscoli 💪, La Fuga 🚗, Il Nascondiglio 🏝️.
- I temi dell'Asta diventano quattro: Zombie, Pizza, Panino, Rapina.

## 8 settembre 2026 — Sfida a punti, voti, timer e nuova grafica
- **Timer di 30 secondi** a turno (se scade, conta come sbagliata).
- **Punteggi**: giusta +100, sbagliata −100. Se sbagli **la data resta segreta** e
  la carta **non** entra nella linea (ma viene consumata comunque).
- **Voto degli altri (online)**: quando un giocatore sceglie, agli altri lo schermo
  mostra il punto scelto e votano 👍/👎. Chi vota giusto +50, chi sbaglia −50.
- **Classifica sempre visibile** in alto durante il gioco + **classifica finale
  animata**.
- **Suoni e vibrazione** in base al contesto; **grafica più moderna**.

## 8 settembre 2026 — Partita più bella e più chiara
- **La partita finisce solo quando TUTTI hanno finito le carte** (non più al primo
  che le esaurisce). Chi finisce è "a posto", gli altri continuano; vince chi ha
  finito per primo. Nessun limite di tempo.
- Chi ha finito le sue carte viene **saltato** nei turni successivi.
- **Descrizioni sempre visibili**: si vedono già mentre scegli dove mettere la carta
  (non più solo dopo) e restano scritte sotto ogni evento della linea del tempo.
- **Ritocco grafico** generale (sfondo, bottoni, tessere, tabellone).

## 8 settembre 2026 — Si gioca anche "ognuno dal proprio telefono"
- Chi organizza sceglie all'inizio la modalità: **un telefono solo** (si passa di
  mano) oppure **ognuno dal suo telefono**.
- Nella modalità online l'host apre una **stanza** con un codice; gli amici entrano
  aprendo il link o digitando il codice. Nessun account, nessun server da gestire:
  i messaggi passano da un "ufficio postale" pubblico e gratuito (broker MQTT),
  così il collegamento funziona su qualsiasi rete, anche da cellulare.
- Tutto è **gestito dall'host** (crea, sincronizza, decide i turni): un'unica copia
  vera della partita, così i telefoni non possono mai andare fuori sincrono.
- Funziona quando il gioco è aperto dal **sito pubblicato** (non da un file locale
  né dall'anteprima): vedi `docs/METTERE-ONLINE.md`.

## 8 settembre 2026 — Categorie e link per gli amici
- La linea del tempo ora è divisa in **categorie**: Storia, Invenzioni e scoperte,
  Calcio, Rap italiano, Cinema. Si attivano tutte insieme o solo alcune.
- Chi organizza sceglie categorie e carte **prima**, poi con un tasto crea un
  **link già impostato** da mandare agli amici: aprendolo, il gioco parte con
  quelle stesse impostazioni.
- Aggiunti molti avvenimenti nuovi e verificati (calcio, rap italiano, cinema).
  Ogni categoria vive in un file a parte in `data/` — aggiungerne altri non
  richiede di toccare il gioco.

## 8 settembre 2026 — Arriva il tasto Novità
- Aggiunto il tasto **🆕 Novità** nella home: un elenco di tutto ciò che viene
  aggiunto, così si sa sempre cosa è cambiato.
- Un pallino rosso avvisa quando c'è una novità non ancora vista; sparisce dopo
  che la si apre.

## 8 settembre 2026 — Primo gioco: La linea del tempo
- Prima versione dell'app, con il gioco **La linea del tempo** completo e
  giocabile dall'inizio alla fine.
- Da 1 a 8 giocatori, un solo telefono che passa di mano in mano.
- Circa 90 avvenimenti veri e verificati, ognuno con una riga che racconta il fatto.
- Ossatura comune (home, giocatori, punteggio, tabellone finale con medaglie,
  Rigioca / Torna ai giochi).

## 9 settembre 2026 — Tantissimi nuovi avvenimenti
- Aggiunti 70 avvenimenti nuovi e verificati (storia, invenzioni, calcio, rap italiano, cinema): ora sono circa 200 in tutto.

## 9 settembre 2026 — Oltre 800 avvenimenti e fino a 10 giocatori
- Importate 600 carte nuove dal set delle 750 (57 doppioni evidenti + 93 doppioni di significato scartati): totale 804.
- Massimo giocatori portato da 8 a 10, con limite applicato anche alla stanza online.

## 9 settembre 2026 — Nuovo gioco: L'Asta
- Secondo gioco della raccolta: asta a 4 round su tema (Sopravvivenza Zombie), 2-10 giocatori, un telefono sul tavolo.
- Base 1 credito, rilanci di 1, timer 10s dopo ogni rilancio, paga solo il vincitore, riserva di 1 credito per ogni round futuro.
- Assegnazione automatica a 1 credito quando resta un solo giocatore e una sola carta.
- Finale con riepilogo dei kit, votazione a stelle (1-5, non il proprio) e podio.
- Corretto un difetto del motore: gli attributi non impostati disabilitavano i pulsanti.

## 9 settembre 2026 — Asta: tre temi da 184 carte
- Nuovi temi La Pizza Perfetta e Il Panino Perfetto, oltre a Sopravvivenza Zombie.
- Tutti e tre ampliati a 184 carte (46 per round: 14 A, 18 B, 14 C), solo ingredienti veri e coerenti col round.
- Revisione manuale delle fasce: corretti Pollo alla Griglia (da A a B) e Roast Beef (da B ad A).

## 9 settembre 2026 — Profilo e La Sala
- Profilo con nome e faccina salvato sul telefono; ingresso diviso in Crea profilo / Accedi.
- La Sala: il gruppo di partecipanti resta tra una partita e l altra.
- A fine partita: Rigioca, Cambia gioco o torna alla Sala, sempre con gli stessi giocatori.

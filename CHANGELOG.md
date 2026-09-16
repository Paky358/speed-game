# Diario delle modifiche

_Cosa è stato aggiunto all'app, dalla più recente. Le stesse novità si vedono
anche dentro l'app, dal tasto **🆕 Novità** nella schermata iniziale. Il
contenuto di quel tasto vive in `data/novita.js`._

## 16 settembre 2026 (38) — Nuovo gioco: Palla a Pendolo (anche online) + Horto Muso più fluido
- Arriva **Palla a Pendolo** (nei Minigiochi), ispirato a Wii Party. Visuale finto-3D su Canvas:
  di spalle in basso, la trave sull'acqua con dei personaggi, la palla appesa oscilla **in profondità**
  (rimpicciolisce e proietta l'ombra sull'acqua).
- **Lancio a forza fissa e lento**: il lanciatore **mira di lato** (◀ ▶ o trascinando) e preme
  **LANCIA** (o tocca il campo); il **mirino rosso** mostra dove cadrà. Niente modulazione della
  forza: conta il **tempismo**. Chi centra viene buttato in acqua con **splash**.
- **Chi sta sulla trave** si muove **◀ ▶** e **SALTA** per schivare quando il mirino punta lui.
- **Due modi**: **da solo** (scegli il ruolo: **lanci tu** contro 3 bot, oppure **stai sulla trave**
  e schivi un **bot che lancia**, sopravvivendo fino allo scadere) e **online** host-autoritativo. In
  lobby online ognuno **sceglie il ruolo** (uno lancia, gli altri sulla trave; posti liberi = bot).
  **Sfida a tempo**: vince il lanciatore se li butta giù tutti, altrimenti vince chi resta in piedi.
  Ospite con interpolazione (movimento liscio come Glow Hockey). Tre livelli di bravura.
- **Fix**: i pulsanti non si "selezionano" più al tocco sul telefono (niente evidenziazione da
  copia-incolla): aggiunto `user-select:none` e `touch-action:manipulation` a tutti i tasti.
- **Horto Muso online**: l'ospite ora vede la corsa **fluida** (interpolazione con buffer e
  piccolo ritardo, come in Glow Hockey), invece di andare a scatti quando i pacchetti arrivano
  irregolari. La scheda del gioco mostra "1–8 giocatori".

## 15 settembre 2026 (37) — Battaglia Navale: coordinate, anteprima e "colpito e affondato"
- Il tabellone ora ha le **lettere (A–J) in alto** e i **numeri (1–10) a sinistra**, come nella battaglia navale vera.
- Quando sistemi una nave vedi prima l'**anteprima** di dove la stai mettendo: **verde** se ci sta, **rossa** se no. Confermi con **"Metti qui"** (o ritoccando la casella). Niente più navi piazzate al primo tocco per sbaglio.
- Quando affondi una nave esce la scritta **"💥 Colpito e affondato!"** (e **"☠️ Ti hanno affondato"** quando capita a te).
- (In arrivo: i **colpi speciali**, che stiamo definendo.)

## 15 settembre 2026 (36) — Nuovo gioco: Battaglia Navale (nella sezione "1 contro 1")
- Arriva la **Battaglia Navale** classica. La sezione "Sfida in 2" ora si chiama **"1 contro 1"**.
- Griglia **10×10** e flotta classica: Portaerei (5), Corazzata (4), Incrociatore (3), Sommergibile (3), Cacciatorpediniere (2).
- Prima **sistemi le navi** (le giri in orizzontale/verticale o premi "Disponi a caso"), poi **spari a turni**: acqua, colpito, colpito e affondato. Vince chi affonda tutta la flotta.
- Si gioca **contro il computer** (facile/medio/difficile) o **online** con un amico. Online le tue navi non escono mai dal tuo telefono: nessuno può sbirciare.

## 15 settembre 2026 (35) — Tavolo verde nuovo per Scopa, Scopa 2vs2 e Scopone
- Prima le carte a terra si confondevano con quelle in mano e gli avversari stavano tutti ammassati in alto.
- Ora c'è un vero **tavolo verde**: il **Compagno di fronte** in alto, i **due Rivali ai lati**, le **carte a terra al centro**.
- La **tua mano** sta in basso su una "mensola" di legno, ben staccata dal tavolo: si capisce al volo cosa è tuo.
- Chi è di turno ha il nome con il **bordo dorato**. Stesso identico stile nei tre giochi di carte (aiuti condivisi in `SGCarte`).

## 14 settembre 2026 (34) — Musica dei giochi di carte molto più alta
- La musichetta chill di Scopa, Scopa 2vs2 e Scopone si sentiva troppo bassa anche col telefono al massimo.
- Ho alzato parecchio il volume: volume generale da 0.09 a 0.5, e note più corpose (basso, tappeto, arpeggio).
- Aggiunto un "limitatore" (compressore) così posso spingere il volume **senza** che gracchi o distorca, e
  reso il suono un filo più brillante (filtro passa-basso da 1900 a 2600 Hz).
- Il tasto 🎵/🔇 resta com'era: puoi sempre spegnerla e la scelta viene ricordata.

## 14 settembre 2026 (33) — Horto Muso fino a 8 cavalli (corsie adattive) + foto-finish/replay compresi
- `MAXN=8`; impostazioni "Quanti cavalli in gara" (2/4/6/8, default 4) valida per bot e online. Local: tu +
  (N-1) bot; online `hostHorto(t,diff,N)` con posti/seggi dinamici (1..N-1), i liberi = bot fino a N.
- **Corsie/righe adattive** (`altezze(N)`): ≤4 → alte come ora; 5-6 più basse; 7-8 compatte (altezza corsia,
  emoji cavallo, righe del foto-finish e altezza dello strip calcolate da N). 8 colori (`COLORI`), 7 nomi bot.
- Foto-finish e replay finale funzionano con qualsiasi N (righe = posti, distanze reali, scatto al tocco).
- Collaudato in locale a 8 (8 corsie, altezza 38px, Paky + 7 bot, zero errori); l'online usa lo stesso schema.

## 14 settembre 2026 (32) — L'Asta online: stessa lobby, cambia argomento, "Nuova partita" torna in sala
- Nella **lobby** online l'host ora sceglie l'**argomento** (selettore temi `cat-chip`, evidenzia quello
  attivo → `cb.onTema(i)` → `scegliTema` cambia `st.tema` e ritrasmette); l'ospite lo vede in chiaro.
  vm arricchita con `temi` (elenco) e `temaId`.
- A fine partita l'host ha **"🔄 Nuova partita (cambia argomento)"** (`onNuova` → `nuovaInLobby`): riporta
  TUTTI alla lobby con gli **stessi giocatori** (crediti/kit/stelle azzerati), dove si può scegliere un nuovo
  argomento e ricominciare. L'ospite vede "In attesa dell'host…". Entrambi hanno "🏠 Esci".

## 14 settembre 2026 (31) — Musichetta chill nei giochi di carte (Scopa, Scopa 2 vs 2, Scopone)
- Nuovo `window.SGMusica` in `js/games/scopa.js` (condiviso): musica di sottofondo **generata** con WebAudio
  (nessun file), pad morbidi + arpeggio lento su Cmaj7·Am7·Fmaj7·G7, master a volume basso (~0.09) con
  lowpass 1900Hz, loop con scheduler `setInterval`. `avvia`/`ferma`/`commuta`/`attiva`/`bottone`.
- Tasto 🎵/🔇 (`.sc-musica`) in alto a destra nei tre giochi di carte; la scelta è ricordata
  (`localStorage "sg-musica"`). Parte al tocco di "Comincia" (gesto → l'AudioContext riprende); si ferma
  quando si esce dal gioco (aggiunto a tutti gli `onEsci`). Idempotente: `avvia` non riparte se già in play.
- Collaudato: tasto presente in Scopa, toggle 🎵↔🔇 con preferenza salvata, zero errori (l'audio si sente sul
  telefono al tocco reale).

## 14 settembre 2026 (30) — Lobby dell'ospite in TUTTI i giochi online (regola fissa)
- L'ospite non resta più su "✅ Sei dentro!": ora vede la **sala con i partecipanti** come l'host, in tutti i
  giochi online. Applicato a: **Tris**, **Drop 4** (lista dei 2 giocatori nella lobby già trasmessa via vm),
  **Scopa** e **Scopa 2 vs 2** (l'host ora trasmette la sala: `aggiornaLobby` → `rete.invia({t:"lobby",…})`;
  `renderLobby` unica host/ospite, evidenzia il proprio posto, controlli solo all'host; in Scopa 2 vs 2 le
  squadre NOI/LORO sono relative a chi guarda), **Glow Hockey** (mini-lista Tu/Avversario). Asta, Patata,
  Scalinata, Sì… però, Timeline mostravano già i giocatori. Regola salvata per i giochi futuri.
- Collaudato host + ospite: Scopa 2 vs 2 (ospite vede i 4 posti, NOI/LORO relativi, "(tu)"; host coerente).

## 14 settembre 2026 (29) — Horto Muso: dopo lo scatto, tutti tagliano il traguardo (replay, cap 5s)
- Nel foto-finish, dopo lo scatto il replay **fa tagliare il traguardo a tutti** i cavalli (ognuno riparte
  dalla sua posizione e va alla linea; più vicino = arriva prima, così l'ordine è rispettato). Se dallo scatto
  passano più di **5 secondi**, il replay si chiude comunque e si va alla classifica.

## 14 settembre 2026 (28) — Horto Muso online: l'ospite vede la SALA + tutti vedono il countdown
- L'host ora **trasmette la lobby** a tutti (`{t:"lobby", codice, pronta, seggi:[{nome,id}|null]}` con
  `rete.invia`/retain, aggiornata su codice/connesso/join/addio). `renderLobby` è unica per host e ospite:
  mostra tutti i posti (bot inclusi), evidenzia il proprio (match per `id`), controlli (codice/Comincia) solo
  all'host. L'ospite non resta più sullo "sei dentro": vede la stanza e chi c'è, e capisce che sostituisce un bot.
- **Countdown per tutti**: alla partenza l'host manda `{t:"via", nomi, n}` e **ogni telefono fa il proprio
  countdown locale** (`setInterval`, 3-2-1-VIA), poi partono le posizioni (`snap` fase "corsa"). Prima gli
  "snap" del countdown potevano andare persi e l'ospite entrava già in corsa; ora no.
- Collaudato host + ospite: l'ospite vede la sala (Paky 👑 / Gigi (tu) / 🤖 bot ×2) e, al via, la sequenza
  registrata 3 → 2 → 1 → VIA! → corsa. Zero errori.

## 14 settembre 2026 (27) — Horto Muso: cavallo specchiato + scatto al tocco reale (ferma-foto-riprendi)
- **Cavallo specchiato** (`transform:scaleX(-1)`) in gara (`.ho-cav .em`) e nel foto-finish (`.ho-ff-cav`):
  ora guarda verso destra, nel senso di corsa.
- Foto-finish rifatto per il **tocco reale**: ogni cavallo è un elemento a sé (label di corsia fissa a
  sinistra, cavallo assoluto che scorre). Un loop `requestAnimationFrame` confronta le coordinate vere
  (`getBoundingClientRect`) del cavallo vincente e della linea: appena il cavallo la tocca (anche 1px) →
  **congela** tutti i cavalli dove sono, **scatto** + flash, **fermo immagine** ~1,5s, poi **riprende** e
  finisce il replay (tutti alla posizione finale), quindi la classifica. Fallback a tempo se rAF non gira.
- Da calibrare a vista sul telefono: posizione esatta della linea (ora a 86%) e punto di riposo del vincitore.

## 14 settembre 2026 (26) — Horto Muso: lo scatto parte quando il vincitore tocca la linea (non alla fine)
- Il cavallo vincente ha una corsa **più corta** (`.ho-ff-row.win` transition 1,8s vs 2,6s degli altri): tocca
  la linea **prima**. Lo **scatto** (+flash) parte sul suo `transitionend` del `left` — cioè nell'istante esatto
  in cui tocca il traguardo — mentre gli altri stanno ancora arrivando; fallback a tempo se l'evento non arriva.
  Dopo lo scatto: fermo immagine ~1,5s, poi "🏆 … vince!", poi la classifica.

## 14 settembre 2026 (25) — Horto Muso: foto-finish più utile (zoom, scatto, flash, fermo immagine)
- Photo-finish rivisto su richiesta: **più lento** (ultimo tratto in 2,1s; scatto ~2,25s; nome vincitore ~3,8s;
  classifica ~6,6s o col tasto), **zoom maggiore** sul traguardo (mappa solo l'ultimo ~32% di pista, cavalli
  più grandi), cavallo del vincitore **NON ingrandito** (solo bagliore oro). Al taglio: **suono di scatto**
  dell'otturatore (`scattoFoto`, due click filtrati) + **flash** bianco (`.ho-ff-flash`) e l'immagine resta
  **ferma** un attimo così si legge chi ha vinto. Corsie sempre nell'ordine reale (l'host resta in alto).

## 14 settembre 2026 (24) — Horto Muso: foto-finish per corsia (non riordina) + più lento
- Rifatto `fotoFinish`: ora mostra i cavalli **nella loro corsia** (riga = posto: l'host resta in alto anche
  se arriva 4°) alle **distanze reali** dell'istante in cui il primo taglia (non più righe di classifica).
  Serve la foto delle posizioni al primo traguardo: catturata in `frame`/`tick` quando scatta `primoArr`
  (`foto = cav.map(pos)`), passata a `finale`/`fotoFinish`; online inviata nel messaggio `{t:"fine", foto}`.
- Più **lento e leggibile**: scorrimento corsie 1,9s, nome del vincitore a ~2,1s, avanzo automatico a ~4,6s
  (o col tasto). Numero di corsia colorato accanto a ogni cavallo; vincitore in evidenza (glow oro).
- Motivo: prima riordinava i cavalli in righe di classifica (confondeva: l'host "scendeva" di riga) ed era
  troppo veloce.

## 14 settembre 2026 (23) — Horto Muso: "foto-finish" zoomato prima della classifica
- `js/games/horto.js`: nuova `fotoFinish(t, ord, nomi, io, poi)` + wrapper `finale()` (foto-finish → `renderFine`).
  A fine gara, prima della classifica, i primi arrivati scivolano oltre la linea del traguardo (zoom, il
  vincitore in evidenza con glow oro) e compare "🏆 <nome> vince!", poi si passa alla classifica (auto dopo
  ~3,2s o col tasto "Vedi la classifica"). Usa `setTimeout` + transizioni CSS (niente rAF, così va anche a
  pannello nascosto). Agganciato a tutte e tre le fini: locale, host, ospite (ognuno col proprio `io`).
- CSS `.ho-ff*` in `assicuraStile`. Collaudato: nessun errore, gioco registrato (l'animazione della gara/finish
  non parte col pannello browser nascosto → si vede sul telefono).

## 14 settembre 2026 (22) — La Scalinata: giocabile in 1/2/3 (i posti liberi = bot) anche a un telefono solo
- `js/games/scalinata.js`: `giocatoriMin` 4 → **1** (`giocatoriMax` resta 4), così la sala non obbliga più a
  essere in 4. Il "un telefono solo" ora **riempie con i bot** fino a 4 (come già l'online): in `avvia` si
  costruisce `g` dai giocatori veri + bot (`NOMI_BOT` Matt/Kevin/Cody, `bot:true`), tolto il blocco
  `niente()`. In `turno` i bot **scelgono da soli** (skip `passaA`) e si usa `st.g.length`. Regola aggiornata.
- Nota: la min:4 non era stata cambiata in questa sessione (nessun commit toccava scalinata.js); ripristinato
  il comportamento promesso dalla descrizione. Collaudato a un telefono solo in 2 (Paky+Gigi+Matt+Kevin): la
  sala parte con 2, round risolto con le scelte dei bot, zero errori.

## 14 settembre 2026 (21) — Horto Muso: modalità online (host-autoritativo, in tempo reale)
- `js/games/horto.js`: aggiunto `hostHorto`/`ospiteHorto` + lobby. L'host = corsia 0, gli ospiti prendono
  1..3 (in ordine d'arrivo), i posti liberi li giocano i **bot**. **Host-autoritativo**: l'host simula tutte
  le corsie (`setInterval` ~66ms) e trasmette lo **snapshot** delle posizioni con `rete.inviaVeloce` (retain
  off) ~15 volte/s; gli ospiti mandano solo `{t:"frusta"}`. Countdown e `{t:"fine", ord}` con `rete.invia`
  (retain). Seat comunicato con `{t:"seat", to:id, seat}`; l'ospite filtra per `to` e mostra la SUA barra.
- Refactor condiviso: `costruisci`/`disegna`/`passoTutti`/`frusta`/`botPensa`/`snap`/`classificaDa`/`renderFine`
  usati sia dal locale (rAF) sia dall'online (host: sim+broadcast; ospite: render da snapshot). CSS transizione
  `.ho-cav` alzata a .09s per ammorbidire i ~15Hz di rete.
- `impostazioni`: modo **Contro i bot** / **Online** (+ nº rivali per il bot, bravura per entrambi).
- Collaudato in locale (host + 1 ospite): lobby, join, seat corretto (ospite corsia 2 con barra), countdown,
  corsa simulata dall'host con snapshot all'ospite, traguardo con classifica propagata. Zero errori.

## 14 settembre 2026 (20) — Nuovo minigioco: Horto Muso (corsa di cavalli, tipo Derby Dash)
- Nuovo `js/games/horto.js` (id `horto`, categoria **Minigiochi** in `CAT_GIOCO`): corsa a **corsie dritte**
  (niente pista ovale: stessa distanza per tutti). Tu (🐎) contro 1–3 bot; impostazioni: nº rivali + bravura.
- Meccaniche stile Wii Party: velocità di base costante; tasto **FRUSTA** (pointerdown + tasto Spazio) che dà
  un boost per `BOOST_MS`; ogni frustata consuma energia (`COST`); l'energia si ricarica se non spingi; a 0
  → **sfinimento** (`SFIN_MS` 3s: rallenta a `V_SFIN`, frusta bloccata, poi recupera). Barra stamina SOPRA il
  cavallo del giocatore. Bot con auto-frustata regolata da difficoltà (soglia/intervallo).
- Loop in `requestAnimationFrame` con `dt` (clamp 0.05) — aggiorna solo `style.left`/larghezza barra (niente
  ricostruzione a ogni frame). Countdown 3-2-1-VIA; a fine corsa schermata con la classifica (🥇🥈🥉) + Rigioca.
- `index.html`: aggiunto `horto.js`; bundle rigenerato.
- Validazione delle costanti con una replica delle formule (rAF non gira col pannello browser nascosto):
  senza frustare 18.2s, a ritmo 11.0s, bot medio 10.3s, mash ~8/s finisce ma perde (20.5s, con sfinimenti),
  spam estremo si blocca. Nessun errore in console; la schermata monta 4 corsie + barra + frusta + countdown.

## 13 settembre 2026 (19) — Home: tasto "Novità" accanto al nome utente
- `js/core.js`: il tasto 🆕 Novità (col pallino se ci sono novità non lette) è spostato dalla riga in fondo
  a fianco del profilo, in una riga `.home-profilo` (chip profilo + Novità). In fondo restano 💡 Proposte e
  🐞 Bug. CSS `.home-profilo`/`.home-novita` in `css/styles.css` (nuovo nome per non toccare `.profilo-riga`
  già usata altrove). Collaudato: Novità accanto al nome, apre il diario; in fondo solo Proposte/Bug.

## 13 settembre 2026 (18) — Home: filtri per categoria (Tutti/Carte/Sfida in 2/Festa/Minigiochi/Quiz & parole)
- `js/core.js`: nuova barra `.cat-barra` sotto il profilo con i filtri. `CATEGORIE` (tutti, carte, sfida,
  festa, mini, parole) + mappa `CAT_GIOCO` per id gioco (ogni gioco ha la sua categoria; una categoria senza
  giochi non compare). "Tutti" è il default (`catAttiva`, ricordata tra una visita e l'altra della home).
- Cliccando una categoria si **aggiorna solo la griglia** (`riempiGriglia` → `griglia.innerHTML`), senza
  rifare la schermata né `scrollTo` (coerente con la regola "niente lampeggio"). Il segnaposto "Altri giochi
  in arrivo" appare solo in "Tutti".
- Raggruppamento: **Carte** (scopa, scopa2v2, scopone) · **Sfida in 2** (tris, drop4, hockey) · **Festa**
  (asta, impostore, sipero) · **Minigiochi** (scalinata — stile Wii Party, altri in arrivo) ·
  **Quiz & parole** (timeline, nomicose, patata: si dice una parola della categoria). CSS
  `.cat-barra`/`.cat-tab` in `css/styles.css`.
- Collaudato: 6 chip, filtri corretti per ogni categoria, nessun gioco fuori categoria, schermata invariata
  al cambio filtro (niente lampeggio).

## 13 settembre 2026 (17) — L'Asta: tutti i 4 round visibili + "ancora in palio"; Patata: ritorno solo a chi rimanda
- **L'Asta — striscia dei 4 round**: `strisciaRound(el, rounds, idx)` mostra tutte e 4 le "cose" del tema
  (con icona+nome); il round in corso ha il contorno giallo (`.as-step.ora`), i fatti la spunta, i prossimi
  restano visibili. `intestazioneRound`/`testaRound` la usano (scelta/asta/round), più la schermata d'inizio
  round. La vm online espone `rounds` (elenco `{nome,icona}`).
- **L'Asta — "ancora in palio"**: `dettaglioPalio(el, carte, nomeCorrente)` = elenco SEMPRE visibile (un div,
  non più `<details>`: così non parte chiuso e non si richiude a ogni offerta quando la schermata si ridisegna)
  con le carte ancora da aggiudicare nel round (quella all'asta marcata "· all'asta ora"), in `disegnaAsta`
  (locale) e nella fase `asta` online (usa `vm.tavolo`).
- **La Patata Bollente — ritorno vincolato**: dopo un "Rimanda indietro" chi riprende la bomba può ridarla
  SOLO a chi gliel'ha rimandata. Nuovo `st.soloDare` (impostato in `indietro`, consumato in `passa`, azzerato
  in avvio/esplosione/rimozione), guardato in `passa` e nel render (`passabile`), esposto in `vm.soloDare`
  (solo se il bersaglio è vivo); messaggio guida "ridàlla a <nome>".
- Collaudato in locale: Asta (tema Appuntamento — striscia 📍/👗/💬/🌧️ con "La Location" evidenziata; pannello
  "Ancora in palio (2)" con la carta corrente marcata) e Patata a 3 (dopo rimanda Gigi→Paky resta passabile
  solo Gigi). Zero errori.

## 13 settembre 2026 (16) — Nuovo gioco: Scopa 2 vs 2 (a squadre, contro i bot o online) + asso di denari ripulito
- Nuovo `js/games/scopa2.js` (id `scopa2v2`): **4 al tavolo, 2 squadre** (posti 0+2 vs 1+3), turni che
  alternano le squadre (0→1→2→3). Regole **della Scopa vera** (non Scopone): 3 in mano + 4 sul tavolo, si
  **pesca** 3 a testa a mani vuote fino a esaurire il mazzo, scopa (tranne l'ultima), a fine mano il tavolo
  all'ultima squadra che ha preso. Punteggio a squadra (`conta`): Carte/Denari/Settebello/Primiera + Scope,
  a 11, primo di mano che ruota. Riusa `window.SGCarte` (immagini, `catture`, `primiera`, `validaSet`, render).
- **Due modalità**: `localeScopa2` (tu = posto 0 + 3 bot; difficoltà scelta) e **online** `hostScopa2`/
  `ospiteScopa2` (host = posto 0; gli ospiti prendono i posti 1,2,3 in ordine d'arrivo; i posti liberi alla
  partenza li giocano i **bot**). Host-autoritativo: a ogni ospite mando **solo la sua vista** (`vistaDa(st,seat)`),
  vede solo le proprie carte. Se un ospite si scollega, il suo posto passa al bot e la partita continua.
- Vista **relativa al giocatore** (`io` 0..3): in alto gli altri tre nell'ordine di gioco (il compagno al
  centro col 🤝), colori verde/rosso per la propria squadra/avversari. Online i bot hanno nomi **neutri**
  ("🤖 Bot N") così nessun ospite viene ingannato (la squadra la dicono colore + 🤝). Stesso schermo-fisso e
  stessa animazione "carta verso la presa" degli altri giochi (`mont` per il montaggio in posto).
- `index.html`: aggiunto `scopa2.js` fra `scopa.js` e `scopone.js` (serve `SGCarte`); il bundle lo include
  già via glob alfabetico (`scopa.js` < `scopa2.js` < `scopone.js`).
- **Asso di denari ripulito**: ripartito dall'originale di pubblico dominio (Trocche100) e tolte SOLO le
  scritte del marchio ("MADE IN ITALY", "531", "T. DAL NEGRO TREVISO") preservando aquila e nastro; prima
  una copertura sbagliata aveva messo un grosso rettangolo giallo. (`carte/D1.jpg` + `dist/carte/D1.jpg`).
- Collaudato in locale: vs bot (distribuzione 4+3×4, mazzo 24; giro 0→1→2→3; mano intera fino al punteggio
  a squadre corretto — Carte 27–13=40, Denari 4–6, Settebello, Primiera, punti 2–2; riporto punteggi e
  rotazione primo di mano). Online con host + 1 ospite (+2 bot): stanza, ingresso in posto, avvio, l'ospite
  vede la sua mano e **gioca** dal suo telefono, host applica e ritrasmette; zero errori su entrambi.

## 13 settembre 2026 (15) — Carte che volano sulla presa + schermo fisso (niente lampeggio) + regola bomba
- **Scopa/Scopone — presa mirata**: la carta giocata non appare più al centro. Dopo il montaggio si misura
  la posizione reale della/e carta/e presa/e (`getBoundingClientRect` rispetto all'area tavolo) e si posiziona
  la carta giocata **sopra** di esse (baricentro del gruppo), poi parte l'animazione `scGioca` che la fa
  arrivare dalla mano e volare via con la presa. Se è **scopa** (tavolo svuotato) si posa al centro.
- **Niente lampeggio (Scopa, Scopone, Tris, Forza 4)**: prima ogni mossa chiamava `t.mostra(s)` = `svuota(app)`
  + ricostruzione totale + `scrollTo(0,0)` → sfarfallio e salto in cima. Ora la schermata si monta **una volta
  sola**; alle mosse successive si sostituisce **solo** il contenitore di gioco (`cont.replaceChild(nuovoBox,
  vecchioBox)`) e i nodi del piede, senza `t.mostra` né `scrollTo`. Si tiene un riferimento montato e si rifà
  da capo solo cambiando davvero schermata (`document.body.contains(box)`). Var per gioco: `scMount`/`spMount`/
  `trMount`/`drMount`.
- **La Patata Bollente — regola del giro**: tolta l'eccezione "si può sempre ridare a chi te l'ha passata"
  (`passa` e `passabile` non guardano più `st.ultimo`) che permetteva il ping-pong infinito tra due giocatori.
  Ora vale la regola scritta: non puoi ripassarla a chi l'ha già avuta nel giro; il ritorno resta solo col
  tasto **“Rimanda indietro”** (che usa `st.prev`).
- Collaudato in locale (server + browser): Scopa (mia presa B9→C9: carta giocata ancorata al centro della
  presa; schermata e titolo invariati dopo la mossa, `scrollTo` mai chiamato), Tris/Forza 4/Scopone
  (stessa schermata dopo la mossa, `scrollTo` 0, zero errori in console anche con le prese dei bot).

## 13 settembre 2026 (14) — Nuovo gioco: Scopone (classico e scientifico, a squadre, vs bot)
- Nuovo `js/games/scopone.js`: 4 giocatori in 2 squadre (tu seat0 + Compagno seat2 vs Rivali seat1/3),
  **contro 3 bot**. Varianti: **scientifico** (10 carte a testa, tavolo vuoto) e **classico** (9 + 4 sul
  tavolo). Carte date tutte subito (no pesca); regole di presa come Scopa (singolo forzato/somme), scopa,
  a fine mano il tavolo va all'ultima squadra che ha preso. **Punteggio a squadra** (`contaScopone`):
  Carte/Denari/Settebello/Primiera + Scope; partita a 11; inizio che ruota ogni mano.
- **Riuso**: `scopa.js` ora espone `window.SGCarte` (creaMazzo, catture, primiera, cartaEl, dorsoEl,
  assicuraStile, validaSet, prefisso) → Scopone usa le **stesse immagini** (`carte/*.jpg`), la stessa
  presa con un tocco (auto se 1 presa, scelta se più) e le **stesse animazioni** (`.sc-lascia`/`scGioca`,
  presa vola verso chi prende; `.sc-cade` per lo scarto).
- UI a 4: in alto Rivale1 · Compagno · Rivale2 (dorsi + nomi), tavolo al centro, la tua mano in basso.
  Solo **vs bot** per ora (l'online a 4 è un lavoro a parte). `giocatoriMin/Max:1, difficolta:3`.
- Collaudato: distribuzione (scientifico 10/0 · 30 dorsi; classico 9/4 · 27 dorsi = 40), giro dei 4 con
  prese, mano intera fino al punteggio a squadre (Carte 13–27, Denari 4–6, Settebello, Primiera 65–81,
  Scope 0–5 → 0–9; somma 40 carte). Zero errori dal gioco.

## 13 settembre 2026 (13) — Scopa: animazione presa fluida (il tavolo non sparisce più)
- Prima, durante la presa, l'area tavolo veniva **sostituita** dalla pila che volava → le carte non
  prese sparivano e riapparivano. Ora il tavolo **resta**: si ridisegna `presa.tavoloPrima` (il tavolo
  com'era) e volano via **solo** le carte prese (dalla loro posizione, `.sc-lascia-su/giu`); le altre
  restano ferme. La carta giocata **arriva dalla mano**, si posa al centro e vola via con le prese
  (`scGioca`). Stato `presa` ora porta `tavoloPrima` + `presiIds`. Durate ~0,95s, timer presa 1,2s
  (1,8s scopa), durata minima client 1,05s.

## 13 settembre 2026 (12) — Scopa: carte napoletane VERE (immagini di pubblico dominio) + animazioni presa/scarto
- **Carte reali**: sostituiti i disegni SVG con le immagini del mazzo napoletano **di pubblico dominio**
  (Wikimedia Commons, autore Trocche100 — rilasciate PD "uso libero senza condizioni"). 40 file scaricati
  a piena risoluzione, **ridimensionati a 280px** con PowerShell/.NET (`carte/<id>.jpg`, ~1,1MB totali).
  `cartaEl` ora rende un `<img src="carte/<id>.jpg">`; rimossi `simbolo()/PIPS/cartaSVG` (disegni SVG).
- **Nessun marchio**: le uniche 3 carte con il nome del produttore ("DAL NEGRO / MADE IN ITALY" — Asso di
  denari, 4 di denari, 4 di coppe) sono state **ritoccate** (coperture) per togliere ogni scritta/logo.
- **Animazioni** (al posto del riquadro-risultato): su **presa** la carta giocata si sovrappone alle carte
  prese e volano verso chi prende (`.sc-vola-su/giu`); su **scarto** la carta si posa sul tavolo
  (`.sc-cade`). Stato `messaGiu` per la carta scartata; `presa` guida la pila che vola; durata minima
  lato client per non tagliare l'animazione online.
- **Build**: `costruisci-versione-online.sh` copia `carte/` in `dist/carte/` per la pubblicazione.
- **8 = Fante** (come le carte vere; la Donna non esiste nel mazzo napoletano).
- Collaudato: immagini reali a video, presa (pila di 2 carte "sc-vola-giu"), scarto ("sc-cade"),
  nessun marchio residuo; zero errori dal gioco.

## 13 settembre 2026 (11) — Scopa: semi fedeli agli originali (multicolore) + fix "×" nella sala
- **Semi ridisegnati** (`simbolo()`, viewBox 24×24, ispirati alle carte napoletane vere):
  **coppe** = calice dorato con bordo rosso, fascia verde e manici (non più solo rosso);
  **spade** = sciabola curva d'acciaio con elsa dorata; **bastoni** = clava di legno con nodi e
  rametti; **denari** = moneta d'oro con stella. Nuovi gradienti (acciaio, legno) in `assicuraStile`.
- **Fix sala** (`css/styles.css` `.sala-riga input`): l'input aveva `flex:1` senza `min-width:0`,
  quindi non si restringeva e spingeva la **×** fuori schermo (serviva scorrere). Aggiunto
  `min-width:0; width:0` → la × è sempre visibile, niente scroll orizzontale.
- Collaudato a video: semi colorati e riconoscibili (anche sulle figure); riga sala con × dentro
  lo schermo (right 359 ≤ 375, nessuno scroll). Nessun errore.

## 13 settembre 2026 (10) — Scopa: simboli dei semi molto più grandi (leggibilità)
- Pips ingranditi parecchio (`PIPS`: asso 54, 2→42, 3→36, 4→34, 5→31, 6→30, 7→26; posizioni che
  evitano gli angoli) così i semi "saltano all'occhio". Sulle **figure** (8/9/10) il seme è ora
  **dominante** (glifo 46) sopra l'emoji. Valore+seme d'angolo un po' più grandi; carte del tavolo
  70px. Obiettivo: leggibilità immediata (anche per chi non vede benissimo).

## 13 settembre 2026 (9) — Scopa: semi delle figure chiari, bastoni migliori, presa mostrata
- **Figure (8/9/10)**: ora mostrano un **seme grande** ben visibile sopra la figura (prima il seme
  era minuscolo e non si capiva) + emoji Fante/Cavallo/Re. **Bastoni** ridisegnati (bastone di legno
  con nodi/rametti, più riconoscibile).
- **Presa mostrata**: le carte prese non spariscono e basta. Su una presa lo stato del motore tiene
  `st.presa = {chi, carta, presi, scopa}`; la vista mostra un **banner** "Prendi tu / X prende" con
  la carta giocata → le carte prese, per ~1,25s (1,7s sulla scopa), poi prosegue. Vale in locale e
  online (host manda la presa nella vista, timer sull'host); input bloccato durante il banner.
  Aggiunta una **durata minima** del banner lato client (`creaClient.setVm`) così si vede sempre
  anche se la rete comprime i tempi.
- Collaudato: banner locale ("Prendi tu" + 3 carte), e **online** confermato col registratore
  (l'ospite ha visto 6 banner distinti di presa, ~1,7s l'uno). Nessun errore dal gioco.

## 13 settembre 2026 (8) — Scopa: carte ridisegnate + presa con un tocco + tavolo centrato
- **Carte** rifatte molto più simili alle napoletane: semi in SVG condivisi (`<symbol>` + gradienti
  in `simbolo()`, monete/coppe/spade/bastoni), **pips contati** nelle posizioni classiche (`PIPS`,
  asso grande, 1–7), figure per Fante/Cavallo/Re (💂/🐎/👑) in cornice, valore + seme negli angoli
  (in alto-sx e in basso-dx ruotato). `cartaSVG()` disegna l'intera carta; `.sc-carta` ora è solo
  contenitore (bordo/ombra/outline). Dorso rosso a pois.
- **Presa con un tocco**: `tapMano` gioca subito — presa automatica se c'è **una sola** presa
  possibile (anche combinazione), scarto automatico se non prende; si sceglie **solo** quando ci
  sono **più prese** possibili (allora si toccano le carte verdi). Tolto il tasto "Metti giù".
- **Layout**: tavolo centrato verticalmente (flex:1) tra avversario (in alto) e la propria mano
  (in basso), carte più grandi (tavolo 66px, mano 88px), per sfruttare tutto lo schermo.
- Collaudato: nuove carte a video (pips, figure, monete), presa singola/combinazione con un tocco,
  scelta quando più prese, sincronizzazione invariata. (I log `navigator.vibrate` in test sono solo
  perché i click automatici non sono tocchi reali; sul telefono funziona.)

## 13 settembre 2026 (7) — Nuovo gioco: Scopa (carte napoletane, repliche SVG)
- Nuovo `js/games/scopa.js`. Carte napoletane **disegnate da noi in SVG** (nessun copyright):
  4 semi (denari/coppe/spade/bastoni) con glifo proprio, valore colorato per seme, emoji figura
  (👤/🐎/👑) per Fante/Cavallo/Re. Mazzo 40.
- Regole complete: presa per valore uguale (singolo **forzato** se esiste, niente somme), altrimenti
  presa per somma (combinazioni multiple a scelta), **scopa** a tavolo svuotato (tranne ultima carta),
  fine mazzo con carte al'ultimo che ha preso. Punteggio smazzata: **Carte, Denari, Settebello (7 di
  denari), Primiera, Scope**. Partita a **11**, smazzate con inizio alternato.
- Due modalità: **contro il bot** (Facile casuale / Medio greedy vinci-blocca / Difficile con
  euristica + evita di regalare scope) e **online** su SGNet. Online a **mani coperte senza leak**:
  l'host manda all'ospite solo la vista dell'ospite (`vistaDa(st,"B")`), e disegna la propria a parte —
  le carte dell'host non transitano mai verso l'ospite.
- UI condivisa (`renderScopa`/`renderFine`): tavolo, mano toccabile, selezione carta → tocco delle
  carte verdi da prendere (combinazioni con selezione progressiva), "Metti giù" se non prende;
  riepilogo punti a fine smazzata; suono/vibrazione alla presa (più marcati sulla scopa).
- `index.html`: aggiunto lo script (build dal glob).
- Collaudato E2E in locale: logica pura (prese forzate/combo, primiera, conteggio), smazzata intera
  simulata (40 carte, tavolo svuotato), UI vs bot (presa singola, scarto, combo gestite, il gioco
  ignora i tocchi non validi), fine smazzata con punteggio corretto (es. 27/13 carte, 7/3 denari,
  settebello, primiera 84/69 → 4–0) e "Continua" che ridistribuisce; online host↔ospite con mani
  coperte e sincronizzazione nei due sensi. Zero errori dal gioco.

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

# 🪶 Diario della chat «App più leggera» (#31, parte 1: il cuore diviso in pezzi)

Copia di lavoro: `D:\SG-leggera`, ramo `app-leggera` (da `origin/lavori-in-corso` del 4 nov 2026, `3335d2e`).
Cartella di appoggio (fuori dal progetto): `D:\SG-leggera-prove` — server di prova, strumenti, esiti delle prove.
NON si unisce in `lavori-in-corso` né si pubblica finché il proprietario non lo dice (prima lo prova sul telefono).

## Come funziona la divisione (per chi riprende)
- `js/core.js` resta il cuore; i pezzi stanno in `js/cuore/<nome>.js`, caricati SUBITO dopo `js/core.js` in `index.html`
  (la versione online li prende da `index.html`, nello stesso ordine: `costruisci-versione-online.sh`).
- Si parlano con `window.SGCuore` (nel codice `cuore`):
  - in fondo a `core.js` il blocco «AI PEZZI DEL CUORE»: `cuore.el = el;` per le cose che non cambiano mai,
    `vivo("sala", leggi, scrivi)` per le variabili che cambiano (i pezzi le leggono sempre aggiornate: `cuore.sala`);
  - in cima a ogni pezzo «dal cuore»: `var el = cuore.el, …` (aiuti presi una volta: il cuore è già caricato);
  - in fondo a ogni pezzo «al cuore»: `cuore.schermataOmino = schermataOmino;` (quello che usano gli altri);
  - nel cuore e negli altri pezzi le cose di un pezzo si chiamano sempre `cuore.X(…)` (stessa funzione, mai copie).
- Lo spostamento lo fa uno strumento che legge il codice e trova da solo cosa usa e da chi è usato:
  `D:\SG-leggera-prove\attrezzi\sposta.js` (con `pezzo.js` per guardare prima un pezzo). Usa `acorn` ed `eslint-scope`
  installati SOLO in quella cartella (il gioco resta senza npm). Si ferma se il cuore usasse una cosa spostata
  mentre si carica (prima che il pezzo esista).
- Niente cambia per chi gioca: stessi nomi, stessi messaggi online, stesse chiavi `sg-…`, stessi campi delle foto.

## Prove
- Server: 8969 = copia di oggi com'era (`D:\SG-leggera-prove\base`), 8970 = la copia di lavoro, 8968 = una «tappa» ferma
  da provare mentre si continua a lavorare.
- Giro di partenza completo: lanciato alle 15:46 e FERMATO dopo 17 scenari (tutti OK): con la fila degli strumenti di
  prova condivisa con le altre chat andava a ~2,5 minuti a scenario (giorni per tutto). Si fa così: si provano i pezzi
  nuovi, e ogni NO si rifà sulla copia di oggi (8969) per vedere se c'era già.

## Diario
- 4 nov 16:00 — copia su D, letti registro e skill; mappa dei 12 pezzi mandata al proprietario (il proprietario: «Ti do il permesso per iniziare quando vuoi»).
- 4 nov ~15:55 — fatti i primi 4 pezzi: 🧍 `avatar.js` (editor degli avatar e primo avatar), 🏆 `trofei.js`, 📊 `classifica.js`
  (amici, classifica, proposte e segnalazioni, statistiche), 👤 `profilo.js`. Il cuore da 11.311 a ~9.300 righe.
  App aperta in Edge invisibile senza errori. Prove 24-56, 90, 286, 287 lanciate sulla tappa (8968).
- 4 nov ~16:10 — fatti tutti i 12 pezzi: in più 🤖 `bot.js`, 🏙️ `mondo.js`, ⚔️ `tornei.js`, 🗳️ `sala-voto.js`, 👑 `sala-sfide.js`,
  🛋️ `sala.js`, ⏳ `saletta.js`, 📶 `rete.js`. Il cuore: 2.396 righe. Gli ascoltatori di «app in secondo piano» e «pagina che se ne va»
  sono rimasti nel cuore (si chiamano nello stesso ordine di prima); `SG.bot.prendi/daId` e `SG.ruotaDelGiorno` ora sono funzioni
  che chiamano il pezzo (prima erano la funzione stessa: per i giochi è uguale). Versione online: 11,64 MB (prima 11,60: +44 KB
  di testate e di `cuore.`). Apertura con processore ×6 più lento: ~4,4 s prima e dopo (la parte 1 non deve velocizzare: lo fa la 2).
  AGENTS.md e le skill (nuovo-gioco, prova-nel-browser, trofei) dicono dove sta ora ogni cosa.
  Prove: tutta la serie (copione 1-97, 101-111, 281-287, 501-517, 601-635, Passo 3, Passo 5, Passo 6) lanciata sulla tappa (8968), esiti in
  `D:\SG-leggera-prove\esiti-t3\`. Fin qui (pezzi 1-9): 24-56 tutti OK tranne 37b («questo telefono ha un profilo»), da rifare sulla copia di oggi.
- 4 nov ~17:00 — copione (73 scenari) sulla tappa: 70 OK, 3 NO, tutti e 3 GIÀ PRESENTI sulla copia di oggi (8969), stesso messaggio:
  37b («questo telefono ha un profilo»: il profilo ora è obbligatorio), 70 («Tris in 3» a 360x640 scorre di 5 px),
  97 (senza rete la home nuova non mostra il nome: la home compatta non lo scrive più). Da segnalare al Cervello, non sono di questo lavoro.
  NB: fermare prova.js con TaskStop lascia il suo biglietto nella fila (C:\Users\joetr\sg-strumenti\coda): se il numero viene
  riusato da un altro programma la fila si blocca. Dopo un TaskStop togliere a mano SOLO il proprio biglietto.
- 4 nov ~17:45 — controllo 281-287 tutti OK (286 compresa); giochi online 101-111 tutti OK (107 non esiste: lo avevo messo io);
  Passo 5 del copione 501-517 tutti OK; Passo 6 del copione 36 OK su 37: il NO è la 635 («telefono lento»: lavoro continuo da fermi),
  GIÀ PRESENTE sulla copia di oggi con lo stesso messaggio (probabilmente lo sfondo animato della Notte vivace, arrivato dopo la prova).
- 4 nov ~18:40 — Passo 3: rete 8/8, tessere 7/7, compagnia 38/39, giochi-a 10/10, giochi-b 6/6, giochi-c 5/7. I NO (352 «Giocato di
  recente» in home: la home col menu sotto non lo mostra più; 393 Asta Fantacalcio «_h undefined»; 396 Gara di pesca «tempi che girano
  ancora») sono GIÀ PRESENTI sulla copia di oggi con lo stesso messaggio (la 396: vedi sotto).
- 4 nov ~20:00 — Passo 3 giochi-d 8/8; Passo 5: rete 10/10, g1 10/10, ordine 5/5, riserva 15/15, controllo 5/5, modello 3/3, g2 7/7,
  g3 5/7; Passo 6: ruota 5/5, amici 6/6, g1 7/7, controllo 7/7, modello 2/2. I NO di g3 (552 Asta temi «classifica cambiata» dopo la
  ricarica in fine, 552b Asta Fantacalcio «nessuna foto nuova dell'host») sono GIÀ PRESENTI sulla copia di oggi.
- 4 nov ~21:00 — Passo 6: g2 6/6, g3 7/7, g4 6/6, g5 6/6; Passo 2: gruppo-a 15/15, gruppo-b 8/8, gruppo-c 9/10 (227 «Unexpected identifier 'c'»:
  GIÀ PRESENTE sulla copia di oggi), gruppo-d 13/13.
  TOTALE sulla tappa: 395 OK, 11 NO: 10 già presenti sulla copia di oggi (37b, 70, 97, 227, 352, 393, 396, 552, 552b, 635) e 1 finto (107 non esiste).
- 4 nov ~21:10 — revisione finale (un aiutante Opus, senza toccare file): nessun problema concreto (alias, codice al caricamento,
  confronti, `this`/`arguments`, window.SG controllati uno per uno). Unito origin/lavori-in-corso (cambiava solo il registro).
- Da fare (non di questo lavoro): i 10 NO già presenti, da passare al Cervello; la parte 2 (#31: ogni gioco scaricato solo quando serve).
- 4 nov ~21:40 — il proprietario: «Se devi unirlo prima, unisci prima. Fai quello che devi fare». Nessun ramo aperto aveva cambi al cuore:
  `app-leggera` unito in `lavori-in-corso` (avanti veloce). NON pubblicato (master non toccato). La parte 2 resta dopo lo studio TV
  e gli avatar, come deciso nel registro.

---

# 🪶 Parte 2 (#31): i giochi si scaricano solo quando servono

Copia di lavoro: `D:\SG-leggera`, ramo `app-leggera` (= `origin/lavori-in-corso` del 4 nov, `c684178`). Appoggio: `D:\SG-leggera-prove\p2`
(sonda dei file, misure, server che comprime come GitHub Pages).

## Misura di partenza (4 nov sera, versione online di oggi)
- Peso: `dist/index.html` 11,64 MB (3,41 MB compresso, 3.330 KB scaricati davvero a ogni apertura).
- Apertura (Edge invisibile, processore ×6 più lento): con la rete di un telefono (4 Mbit/s, 150 ms) **~10,5 s** alla prima
  schermata; con la rete di casa ~4,6 s. Strumento: `D:\SG-leggera-prove\p2\misura.js` + `server-gz.js` (gzip e 10 minuti di cache come Pages).

## La mappa
- **Resta nel file principale**: stile, profili (nube, livelli), avatar, sfondo, il cuore coi suoi 12 pezzi, la rete (net, ably, p2p),
  Compagnia, Scegliamo insieme, amici online, pesca (serve anche alla città spenta), le novità. In più il nuovo **elenco dei giochi**
  (`js/elenco-giochi.js`): per ogni gioco la sua **scheda** (nome, icona, categoria, giocatori, modi, posti online, ritardatari,
  ripresa/riserva… tutto quello che non è codice) e il **pezzo** da scaricare. La home, «Come giocate?», la Sala e la saletta
  disegnano tutto dalle schede, senza il gioco.
- **Diventa un pezzo a parte** (uno per gioco, con le sue liste): timeline (+ eventi e foto), asta (+ carte, fanta, disegni; vale anche
  per astafanta), chidinoi (+ carte, disegni, foto), prezzo (+ prodotti, foto, scena, giochi a premi), e tutti gli altri col loro file
  di dati. Pezzi in comune: **studio** (lo studio TV: timeline, nomicose, patata, ruota, ordine, balla, prezzo), **scopa** (serve anche
  a scopa2v2, scopone e, per le frasi, a tris, drop4, navale, calciobiliardo), **blackjack** (serve al poker). Online ogni pezzo è un
  file `giochi/<pezzo>.<impronta>.js`: cambia nome solo quando cambia il gioco. Anche il cuore, lo stile e le novità diventano file con
  l'impronta (`index.html` resta piccolo): a una pubblicazione si riscarica solo quello che è cambiato.
- **Sul telefono**: il service worker tiene i file con l'impronta (prima la copia del telefono, poi la rete) e butta le versioni vecchie.
- **Quando si scarica**: al tocco della tessera (intanto «Come giocate?» si vede subito dalla scheda); se si arriva al gioco prima
  che sia arrivato, «⏳ Arriva il gioco…» con l'icona; se la rete non c'è, «📶 Il gioco non arriva» e riprova da solo quando torna la rete.
  Nella Sala gli amici lo scaricano appena vedono il gioco scelto (e prima: i giochi proposti nel voto, il gioco del torneo, la
  partita in corso quando si entra).
- **Il punto unico**: `avviaPartita` prepara tutto come prima (link, codice imposto, ripresa, contesto della Sala) e aspetta il gioco
  SOLO prima di `g.avvia(tavolo)`; così Sala, ripresa, vice, chi guarda e torneo non cambiano. Aspettano il gioco anche le schermate
  che usano il suo codice: impostazioni, «Come si gioca», la Sala che prepara le regole (salaPreparaGioco, salaRiprendiGioco), il
  torneo (regoleElim), la stanza riaperta dall'host (riapriStanza).
- **Come la Sala sa che il gioco è pronto su tutti**: un amico entra nella stanza del gioco (manda «join») solo quando il gioco è arrivato
  sul suo telefono. La saletta già oggi mostra chi della Sala manca («Aspettiamo Giulia…», le sagome) e il 3-2-1 da solo, la Rivincita e
  il torneino aspettano chi manca: quindi nessun messaggio nuovo, nessun campo nuovo.
- **La ripresa**: l'host che ricarica trova il gioco nella copia del telefono (subito) e riparte come prima; un vice ha già il gioco
  (lo stava giocando).
- **Pubblicazione nuova mentre l'app è aperta**: se un pezzo chiesto non c'è più (404: c'è una versione nuova), l'app si ricarica da sola
  una volta (la Sala e la ripresa la riportano dov'era).

## Diario della parte 2
- 4 nov ~21:40 — sonda dei file (`D:\SG-leggera-prove\p2\sonda.js`: chi definisce e chi usa ogni nome globale) → 34 pezzi, 3 in
  comune (studio, scopa, blackjack). Mappa scritta qui sopra. Le prove «prima» sono quelle della parte 1 sulla stessa copia
  (`c684178` = `lavori-in-corso`): 395 OK, 10 NO già presenti (37b, 70, 97, 227, 352, 393, 396, 552, 552b, 635).
- 4 nov ~22:00 — fatto: `js/cuore/scarica.js`, `js/elenco-giochi.js`, il generatore delle schede
  (`.agents/skills/nuovo-gioco/elenco-giochi.js`), le attese nel cuore (avviaPartita prima di g.avvia, impostazioni, «Come si gioca»,
  riapriStanza, salaPreparaGioco, salaRiprendiGioco, regoleElim), il precaricamento (tessera, Sala, voto), index.html senza i giochi,
  la costruzione nuova e il service worker con la cassa dei file con l'impronta.
- Misure (versione online, Edge invisibile, processore ×6): **prima schermata ~2,6 s** con la rete da telefono (prima ~10,5 s),
  ~1 s con la rete di casa (prima ~4,6 s); **all'apertura 621 KB** scaricati (prima 3.330 KB). L'Asta (il pezzo più grande, 336 KB
  compresso) ~0,7 s la prima volta a 4 Mbit/s, poi dalla copia del telefono. `prova-dist.js`: un gioco già arrivato si apre anche coi
  giochi senza rete; un pezzo con l'impronta vecchia (404) ricarica la pagina una volta sola.
- Prove nuove `passo7/scarica.js`: el1, dl1-dl5 tutte OK (dopo aver corretto due controlli scritti male). 286 OK, 281-287 OK.
  La 29 la prima volta NO («non trovo Apri la stanza» in 2 s: nella cartella i 13 file della Linea del tempo arrivavano uno alla
  volta) → ora i file di un pezzo si chiedono tutti insieme.
- 4 nov ~23:00 — revisione finale (un aiutante Opus, senza toccare file): 11 punti, sistemati: (1) la Sala dell'host si ridisegnava
  sopra «Arriva il gioco…» e il gioco poteva aprirsi da solo più tardi → la Sala riconosce la schermata d'attesa e l'attesa vale solo
  finché è a vista; con un'attesa «che deve arrivare in fondo» (partita, ripresa) la schermata non si ridisegna mai sopra un'altra;
  (2) la ripresa dopo la ricarica vale finché non parte un'altra partita; (3) un file appeso più di 40 s dice «Il gioco non arriva»
  (senza richiederlo due volte); (4) il generatore non scrive niente se trova errori (riga scritta male, file in due pezzi, pezzo che
  non registra nessun gioco), e così la costruzione; (5) torneo: un solo scaricamento alla volta, il segno FUORI dai dati del torneo
  (quelli vanno nella foto della Sala); (6) le voci della scheda che il gioco non ha più si tolgono; (7) un gioco è pronto solo con
  tutto il suo pezzo; (9) mai due ricariche per lo stesso file (né con Safari privato); (10) i 20 s «classifica già data» partono da
  quando il gioco parte. Lasciato: (11) l'ordine di partenza dei giochi online era quello alfabetico dei file, ora è quello di
  index.html (lo stesso della cartella): conta solo per i giochi che non sono nell'ordine scelto da IL PAPPONE.
- La 56 (tutti i giochi nella Sala) diceva NO perché la prova ricaricava a mano i file dei giochi senza le loro liste: ora prima
  `SG.scaricaTutti()`. Poi 56 OK con tutti i giochi.
- 5 nov 00:00-02:25 — il giro completo «dopo» (35 gruppi, Edge invisibile, una prova alla volta): **355 OK, 19 NO**. Già presenti
  prima (stesse righe della parte 1): 37b, 70, 97, 227, 352, 393, 396, 552, 552b, 635 e la 107 finta. Nuovi, tutti delle PROVE
  e non dell'app: 5m1-5m3 e 6m1-6m2 (il modello prende il posto della Gara di pesca: la prova bloccava anche la sua scheda
  dell'elenco → ora blocca solo il gioco vero, quello con `avvia`, e il modello si copia nella scheda), 237 (ricaricava i file dei
  giochi senza i loro dati → `SG.scaricaTutti()` prima, anche in gruppo-c), 374 (la musica della Scopa ora arriva con la Scopa: la
  spia aspetta che arrivi). Rifatte da sole: 5m1-5m3, 6m1, 6m2, 237, 374 OK; 381 (Scalinata, «non parte il secondo round» in 6 s)
  OK al secondo giro (capricciosa); 227 NO come prima («Unexpected identifier»). Dopo la revisione rifatte anche el1, dl1-dl5: OK.
  Quindi: stessi NO di prima, nessuno nuovo. Il 422 è il copione intero file
  per file: è coperto dai gruppi qui sopra.
- Da sistemare più avanti (NON nel giro richiesto): altre prove «di un gioco solo» ricaricano a mano il file del gioco fuori dal
  telefono (preferiti/asta*.js, preferiti/blackjack*.js, migliora/*, migliora2/*, dadoveviene/base.js, unaparola/base.js): se un
  gioco legge le sue liste quando si carica, prima della prova serve `SG.scaricaTutti()` (o `SG.scaricaGioco(id)`).

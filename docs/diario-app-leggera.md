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

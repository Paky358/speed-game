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
- 4 nov ~17:30 — fatti i primi 4 pezzi: 🧍 `avatar.js` (editor degli avatar e primo avatar), 🏆 `trofei.js`, 📊 `classifica.js`
  (amici, classifica, proposte e segnalazioni, statistiche), 👤 `profilo.js`. Il cuore da 11.311 a ~9.300 righe.
  App aperta in Edge invisibile senza errori. Prove 24-56, 90, 286, 287 lanciate sulla tappa (8968).

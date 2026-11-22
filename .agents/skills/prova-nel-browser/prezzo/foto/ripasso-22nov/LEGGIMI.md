# Ripasso delle foto del «Prezzo è Giusto» (21-22 nov 2026, novità v404 e seguenti)

Come sono state riguardate TUTTE le foto dei prodotti e dei pezzi di vetrina (data/prezzo-foto.js) e cambiate quelle sbagliate.
Programmi Node, fuori dal gioco: si COPIANO in una cartella di lavoro (quella del 21-22 nov: `D:/SG-prezzo-foto2`) e si lanciano
da lì; i file di lavoro (json, `mini/`, fogli, `scelte/`) nascono accanto e NON vanno in git. Richieste a Wikimedia piano (una
ogni 1,25 s a ritmo fisso in `scarica.js`, una ogni 1,5 s in `raccogli2.js`; se dice «aspetta» si aspetta), MAI aggirare il limite.
Un solo programma che parla con Wikimedia alla volta. I fogli si fanno con Edge invisibile, nella fila delle prove (`sg-strumenti/coda`).

1. `node tutte.js D:/SG-prezzo` → `tutte.json` (ogni voce col numero n, la foto di oggi o null). `node scarica.js tutte.json` → `mini/`
   (miniature a 330 px come le chiede il gioco). Le foto che non arrivano (cancellate da Commons: nel gioco si vede l'emoji) finiscono
   in `non-arrivate.json`.
2. `node fogli.js tutte.json fogli [solo.json] 30` → fogli da 30 su fondo blu notte: a sinistra la foto come nella scheda (intera,
   sfondo bianco dietro), a destra come nei riquadri (quadrata); sotto prezzo, nome e descrizione. `node gruppi.js fogli 2 [da]` →
   `gruppi/gNN.json` per gli aiutanti (criteri in `criteri.md`; due sguardi: cosa mostra / come si vede). `node compatti.js tutte.json
   compatti` → 14 fogli da 100 per l'occhio di Claude (le sue note in `occhio-N.json`, { n: "motivo" }).
3. `node raccogli-ripasso.js <journal>` → `segnalate.json`; `node verlista.js ver.json occhio-*.json --da A --a B` + `fogli.js … - 12`
   + `vgruppi.js` → fogli grandi per la verifica (tre sguardi: giocatore, pignolo, difensore); `node voti.js <journal>` → `voti.json`
   (cambia 2, meglio 1, tieni 0, occhio +1; rifare da 3 punti). `node rifare-lista.js bN da a` → `rifare-bN.json`.
4. Ricerche: un aiutante propone `wiki` e ricerche CORTE (1-3 parole: con frasi lunghe Commons non trova niente) in `commons`,
   `commons2`, `commons3`; `ELENCO=… CER=… PAG=pagine.json node raccogli2.js proposte.json candidati.json` (fino a 15 candidate),
   `node piatta.js candidati.json piatta.json` e `node scarica.js piatta.json`.
5. `node lotto.js rifare.json candidati.json fatti.json scelte/L/lotto.json`, `node candfogli.js scelte/L/lotto.json candidati.json scelte/L 5`,
   `node schede-lotto.js L scelte/L/lotto.json candidati.json` → fogli di scelta (foto di oggi ORA e candidate numerate) per gli
   aiutanti (criteri in `criteri-scelta.md`); dal risultato del workflow `node scelte-da-flusso.js L <output>` → `scelte-L.json`.
   Le bocciature di Claude in `mie-scelte-L.json` ({ n: 0 }) si passano DOPO e vincono.
6. `node finali.js scelte-L.json:candidati.json mie-scelte-L.json:candidati.json` → `finali.json` (e `controllo.json` da guardare a
   occhio con `fogli.js controllo.json cartella - 12`), `node applica.js D:/SG-prezzo finali.json --prova`, poi senza `--prova`:
   le righe cambiate restano al loro posto (col motivo e la foto di prima nel commento), le nuove vanno IN FONDO, le tolte si
   cancellano; MAI rifare il file con scrivi-dati.js; le foto del proprietario (loc:carte/prezzo/…) non si toccano.
   `node primadopo.js cartella` → fogli prima/dopo col motivo. Prova pz13. `node apri-dist.js http://localhost:PORTA/` = prova veloce della
   versione online (novità in cima, foto nuove, errori).

Regole (dal proprietario e dal Cervello, 22 nov 2026, «a risparmio»): si rifanno SOLO le foto sbagliate (un'altra cosa, un altro
modello o un'altra marca, foto d'epoca, persone o documenti con facce in primo piano, prezzi scritti, loghi enormi, schermate, foto
cancellate), non quelle deboli ma giuste; un aiutante per foglio e il controllo finale a occhio di Claude; le voci senza foto restano
con l'emoji. Meglio nessuna foto che una sbagliata.

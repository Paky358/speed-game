# Ripasso delle foto della «Linea del tempo» (21 nov 2026)

Come sono state riguardate TUTTE le foto delle carte e cambiate quelle che non convincevano. Programmi Node, fuori dal gioco:
si COPIANO in una cartella di lavoro (quella del 21 nov: `D:/SG-linea-foto2`) e si lanciano da lì; i file di lavoro (json,
`mini/`, fogli) nascono accanto a loro e non vanno in git. Le richieste a Wikimedia vanno piano (una ogni 1,1-1,5 s, e se
dice «aspetta» si aspetta), MAI aggirare il limite.

1. `node tutte.js D:/SG-linea2` → `tutte.json`: ogni carta con la foto di oggi (o null), anno e spiegazione.
2. `node scarica.js tutte.json` → `mini/` (miniature a 330 px, come le chiede il gioco; quelle già scaricate si saltano).
3. `node fogli.js tutte.json fogli` → fogli da 30: a sinistra la foto COME SULLA CARTA (quadrato, tagliata, su fondo scuro:
   una console nera senza sfondo sparisce, così si vede), a destra intera. Criteri per gli aiutanti in `criteri.md`
   (aiutanti Sonnet, 8 fogli a testa → `ripasso/r1.json`…), poi riguardati a occhio.
4. Per le carte da rifare un aiutante propone pagine di Wikipedia e due ricerche per Commons (`commons`, `commons2`):
   `ELENCO=… CER=… node raccogli2.js proposte.json candidati.json` (fino a 13 candidate a carta), `node scarica.js` sulle candidate.
5. `node pronti.js rifare.json candidati.json fatti.json lotto.json 40` + `node candfogli.js lotto.json candidati.json cartella 5`:
   fogli di scelta con la foto di oggi (ORA) e le candidate numerate; la scelta si scrive a mano in `scelte-*.json`
   (`{ numero carta: candidata | 0 = lascia | "togli" | "come:N" = la stessa foto della carta N }`).
6. `node finali.js` (mette insieme le scelte → `finali.json`, `controllo.json`), `node fogli.js controllo.json fogli-controllo - 30`
   (riguardare TUTTE le foto nuove), poi `node applica.js` (scrive `data/linea-foto.js`, in ordine) e `node primadopo.js cartella`.

Regole delle foto: mai locandine, copertine, schermate o fotogrammi; niente anno scritto in grande; niente foto moderne che
ingannano sull'epoca; per film, dischi, serie e videogiochi la persona (creatore, attore, cantante), un oggetto vero o il
posto; per i cantanti un ritratto chiaro, non il concerto al buio. Se non c'è di meglio, la foto di prima resta.

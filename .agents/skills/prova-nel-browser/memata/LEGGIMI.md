# 😂 Memata: i meme e i loro riquadri

I meme di Memata sono i modelli di **Imgflip** (gratis, senza chiave; le loro regole chiedono un link a imgflip.com, che nel gioco c'è sotto il meme e nella foto per WhatsApp). Le immagini NON stanno sul nostro sito: il telefono le chiede a `i.imgflip.com` durante la partita. Nel nostro file ci sono solo id, misure e riquadri.

## Da dove vengono i riquadri
Il generatore di Imgflip ha per ogni modello i riquadri messi da loro dove la gente scrive davvero (posizione, grandezza, inclinazione, carattere, colori). `raccogli.js` li legge pagina per pagina (una richiesta ogni 1,5 s, si può fermare e riprendere): prima l'elenco di tutti i modelli (`imgflip.com/memetemplates`, ~2.100, in ordine di quanto sono usati), poi `imgflip.com/memegenerator/<modello>` per ognuno. Senza riquadri (i meme «classici») si usa il sopra-e-sotto, come fa Imgflip.

## I passi
1. `node raccogli.js D:/SG-meme-prove/dati` → `elenco.json` e `modelli.jsonl` (cartella di lavoro su D, fuori dal progetto).
2. `node converti.js D:/SG-meme-prove/dati/modelli.jsonl ../../../../data/memata.js togli.json ritocchi.json` → il file del gioco.
   - `togli.json`: gli id dei meme da non usare (controllo a occhio: volgari, crudi, rovinati, pieni di scritte…).
   - `ritocchi.json`: `{ id: riquadri }` per i meme coi riquadri corretti a mano (millesimi dell'immagine: `[x, y, larghezza, altezza, {opzioni}]`).
   - Scarta da solo i modelli che Imgflip non segna «adatti a tutti» e le GIF.
3. Controllo a occhio: `fogli.html?da=0&n=24` (24 meme per foglio, riquadri in rosso tratteggiato e un testo di prova scritto dal motore vero del gioco); le foto di tutti i fogli con `foto-fogli.js` (Playwright, in `D:/SG-meme-prove/script`). Una proposta di correzione si guarda prima di tenerla: `fogli.html?ids=<id,id>&rit=<indirizzo del JSON>&grande=1`.
4. Correzioni a mano: `strumento.html` (trascina i riquadri, il quadratino rosa li allarga; carattere, colori, inclinazione; «🗑 Segna da togliere»; «📋 Esporta» → da copiare in `ritocchi.json` e `togli.json`). `strumento.html#n=12` apre il meme numero 12.

## Regole
- Mai copiare le immagini nel progetto.
- Prima di togliere un meme famoso, guardarlo: i meme famosi sono il cuore del gioco.
- Il testo si impagina con la stessa funzione sullo schermo e nella foto per WhatsApp (`SG_MEMATA_MOTORE` in js/games/memata.js): un ritocco al motore va guardato su un foglio intero.

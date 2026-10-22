# Le foto vere di «Il Prezzo è Giusto!» (come sono state scelte il 22-23 ott 2026)

Programmi Node (solo sul PC fisso, fuori dal gioco). I file di lavoro (elenco.json, candidati.json, scelte.json, mini/, fogli/) si creano
qui accanto e NON vanno salvati in git (sono grossi e si rifanno).

1. `node esporta.js` → elenco.json (prodotti e pezzi delle vetrine).
2. Aiutanti Sonnet (solo lettura): per ogni voce 2-3 pagine di Wikipedia e una ricerca per Commons → proposte.json `{ voci: [{ id, wiki, commons }] }`.
3. `node raccogli.js proposte.json candidati.json` → fino a 6 foto candidate a voce (piano: una richiesta ogni 1,5 s; se Wikimedia dice 429 si aspetta).
   ATTENZIONE: lanciarlo con run_in_background, mai con «&» (il 22 ott un raccogli rimasto acceso di nascosto ha sovrascritto candidati.json).
4. `node liste-testo.js candidati.json 2` → liste per gli aiutanti che scelgono dal NOME del file; `node unisci-scelte.js candidati.json <risultato>` → scelte.json.
   Per le incerte: `node raccogli2.js` (seconda ricerca con la query proposta) e di nuovo liste e scelta.
5. `node scarica.js da-scaricare.json` → miniature in mini/ (una al secondo: Wikimedia limita le miniature).
6. `node fogli.js candidati.json controllo scelte.json` → fogli con le foto scelte (40 per foglio) da guardare A OCCHIO, tutte.
   Per rifare le dubbie: `SOLO=numeri.json node fogli.js candidati.json ripasso` (tutte le candidate di quelle voci).
7. `node scrivi-dati.js scelte.json` → data/prezzo-foto.js.
Scartare sempre: prezzo leggibile, un'altra cosa, loghi, persone vere in primo piano, documenti con facce vere, foto storiche o scientifiche.
Le foto mandate dal proprietario: carte/prezzo/<id>.jpg (circa 500 px; per i pezzi delle vetrine il # dell id diventa -) e in data/prezzo-foto.js "loc:carte/prezzo/<id>.jpg".

# Le foto vere delle carte della «Linea del tempo» (come sono state scelte il 26 ott 2026)

Stessa procedura delle foto del Prezzo è Giusto (`../prezzo/foto/LEGGIMI.md`), con i programmi copiati e adattati qui.
Programmi Node (solo sul PC fisso, fuori dal gioco). Si COPIANO in una cartella di lavoro fuori dal progetto e si lanciano da
lì: i file di lavoro (elenco.json, parte*.json, proposte.json, candidati.json, scelte.json, mini/, fogli/) nascono accanto a
loro e non vanno in git (fogli.js cerca le miniature in mini/ accanto a sé).

Fatto il 26 ott 2026: **Storia e Invenzioni** (441 carte → 433 con la foto). Restano da fare le altre 8 categorie.

1. `node esporta.js storia,invenzioni 4` → elenco.json e parte1..4.json (le carte, divise per gli aiutanti).
2. Aiutanti Sonnet (solo lettura, un workflow con 4): per ogni carta 1-3 pagine di Wikipedia («it:…»/«en:…») la cui foto
   principale mostra la cosa della carta, e una ricerca per Commons → proposte.json `{ voci: [{ id, wiki, commons }] }`.
3. `node raccogli.js proposte.json candidati.json` (con run_in_background: una richiesta ogni 1,5 s) → fino a 6 candidate a carta.
4. `node liste-testo.js candidati.json 4` → testo1..4.txt; aiutanti Sonnet scelgono dal NOME del file
   (`{ scelte: [{ n, scelta, riserva, sicuro, cerca }] }` → scelte-raw.json); `node unisci-scelte.js candidati.json scelte-raw.json`.
5. `node scarica.js da-scaricare.json` → miniature in mini/ (una al secondo).
6. `node fogli.js candidati.json controllo scelte.json` → fogli da 40 foto scelte: guardarli TUTTI a occhio.
   Per le scartate e quelle senza foto: `node scarica.js candidati-ripasso.json` e `SOLO=ripasso-numeri.json node fogli.js candidati.json ripasso`.
7. `node scrivi-dati.js scelte.json candidati.json` → data/linea-foto.js (le foto già nel file restano: si aggiungono le nuove).

Cosa si scarta (deciso il 26 ott): l'anno scritto in grande (frontespizi, cartigli delle stampe, giornali, brevetti, targhe:
darebbe la risposta), una foto moderna che inganna (il fax moderno per il fax del 1843, i sacchi di cemento per il 1824),
un'altra cosa, loghi, schermate illeggibili, schemi e grafici, persone qualsiasi, l'attacco alle Torri Gemelle in fiamme
(troppo pesante per una serata: al suo posto le Torri intatte). Ritratti di personaggi famosi, quadri, monumenti e oggetti: sì.
Per le categorie con persone vive (Rap, Calcio, Sport, Cinema, TV, Musica) chiedere prima al proprietario.

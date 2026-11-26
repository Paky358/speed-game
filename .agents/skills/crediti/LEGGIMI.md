# I crediti delle foto (pagina crediti.html)

Fatto il 26 nov 2026 nella chat «📜 Pagine legali». Le foto dei giochi vengono da Wikimedia Commons e da Wikipedia:
le licenze chiedono autore, licenza e link. Questi programmi li prendono dall'API di Commons e scrivono `pagine/crediti-foto.js`.

## Quando rifarlo
Quando cambiano `data/prezzo-foto.js`, `data/linea-foto.js` o `data/dadoveviene-carte.js` (foto nuove o cambiate).

## Come
1. `node .agents/skills/crediti/raccogli.js D:/<copia del progetto> <cartella di appoggio>/crediti.json`
   Chiede a Commons (e a Wikipedia per «Da dove viene?») una richiesta ogni 1,5 s, 50 file alla volta, con `maxlag=5`
   e un User-Agent generico (MAI dati del proprietario, MAI aggirare i limiti). Circa 2 minuti.
2. `node .agents/skills/crediti/scrivi.js D:/<copia del progetto> <cartella di appoggio>/crediti.json docs/crediti-foto-dubbie.md`
   Scrive `pagine/crediti-foto.js` (NON in data/: lì finirebbe nel cuore dell'app) e l'elenco delle foto con una
   licenza da guardare (GFDL, GPL, FAL, Parlamento europeo, autori che chiedono di essere avvisati): le decide il proprietario.

## La cancellazione del profilo
`prova-cancella.js` prova `SGNube.cancella` di js/nube.js con un Firebase FINTO, senza browser:
`node .agents/skills/crediti/prova-cancella.js js/nube.js` (password giusta, sbagliata, scheda pubblica che non si cancella, profilo che non si cancella).
Le prove nel browser sono `prova-nel-browser/legali/prove.js` (lg1-lg4) e le foto `prova-nel-browser/legali/foto.js`.

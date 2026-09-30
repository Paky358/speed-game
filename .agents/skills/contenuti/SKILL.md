---
name: contenuti
description: Usala quando devi scrivere o allungare liste di contenuti per i giochi di SPeeD GAME (parole, carte, domande, avvenimenti con le date). Formati dei file, regole di qualità e controlli.
---

# Liste di contenuti

## Regole di qualità (sempre)
- In **italiano** corretto, adatto a tutti (si gioca anche con i bambini): niente volgarità, niente doppi sensi spinti.
- **Nessun doppione**: controllalo con uno script prima di consegnare.
- **Fatti veri**: date, record, curiosità vanno controllati, e nel dubbio si scartano. Meglio 200 voci giuste che 400 con errori.
- Niente testi protetti da diritti d'autore (per esempio testi di canzoni).
- Voci davvero giocabili: le parole da disegnare devono essere disegnabili, quelle da indovinare conosciute dalla maggior parte delle persone.

## Formati dei file
- `parole/ncc.js` (Nomi, Cose e Città): `window.SG_NCC_PAROLE = { "Categoria": "parola|parola|..." }`, tutto minuscolo, singolare, senza articolo. Il gioco usa le lettere A B C D E F G I L M N O P R S T V: coprile tutte.
- Scarabocchio: le parole da disegnare sono in cima a `js/games/scarabocchio.js`, in `FACILI` e `DIFFICILI`, separate da `|`.
- La linea del tempo: `data/eventi-*.js`, un file per categoria. Ogni avvenimento ha un titolo e un anno **verificato** (è un gioco sulle date: un anno sbagliato rovina la partita).
- Per un gioco nuovo con tante voci (carte, domande), metti i contenuti in un file `data/<gioco>-*.js` che imposta una variabile `window.SG_...`, e caricalo in `index.html` prima del gioco.

## Controlli finali
- Conta le voci e controlla i doppioni con uno script (anche ignorando maiuscole e accenti).
- Il file deve caricarsi senza errori nel browser (vedi la skill `prova-nel-browser`).
- Nella pull request scrivi quante voci hai aggiunto e dove.

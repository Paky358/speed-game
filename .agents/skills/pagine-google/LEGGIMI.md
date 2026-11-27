# 🔎 Le pagine per Google (27 nov 2026)

L'app si disegna con JavaScript: Google ne legge pochissimo. Per farci trovare da chi cerca i giochi («gioco dell'impostore online»,
«nomi cose città online», «giochi da fare con gli amici») ci sono pagine statiche vere, che non cambiano niente per chi gioca.

## Cosa c'è online
- `revelhouse.it/` resta l'app. Nella pagina c'è anche il testo per Google (`app/ingresso.html`, messo dopo `<div id="app">` da
  costruisci-versione-online.sh): una riga lo nasconde PRIMA che arrivi, quindi chi gioca non lo vede mai; si legge solo senza JavaScript.
  Dentro: titolo, spiegazione, l'elenco dei giochi coi link e i dati strutturati (WebSite, Organization, ItemList). Niente immagini
  (un'immagine nascosta si scaricherebbe lo stesso).
- `revelhouse.it/giochi/<nome>/`: una pagina per ogni gioco visibile (i nascosti di `GIOCHI_NASCOSTI` in js/core.js e quelli di
  `NO_PAGINA` in fai-pagine.js no; Lanterne è di Mario e non si tocca). Titolo, descrizione, copertina, «▶ Gioca ora» (`/#gioco=<id>`:
  l'app apre «Come giocate?» di quel gioco, dopo il profilo se serve), 370-500 parole, sei altri giochi, note sui marchi.
- `revelhouse.it/giochi/`: tutti i giochi, per categoria. `sitemap.xml` e `robots.txt` alla radice.
- Stile: `pagine/pagine.css` (quello di privacy e regole) + `pagine/giochi.css`.
- 🕓 **In attesa** (`IN_ATTESA` in fai-pagine.js): una pagina che non deve ancora andare online si prepara in `sito-in-attesa/giochi/`, fuori
  dalla mappa, dagli elenchi e dai link. Mini Asta, Ruota e Prezzo ci sono state finché il proprietario non ha scelto i nomi nuovi (27 nov 2026):
  oggi non c'è nessuna pagina in attesa.
- 🏷️ **I nomi nuovi** (27 nov 2026): `NOMI` in fai-pagine.js dà già i nomi scelti dal proprietario (Disegna e Indovina, L'Infiltrato, Tutti
  d'Accordo, Parole in Codice, Quattro in Fila, Calcio a Dischi, Indovina il Paese, Una Vita Perfetta… Quasi, Al Galoppo!, La Ruota Fortunata,
  Indovina il prezzo, Mini Asta del Fanta, Air Hockey), anche se le schede dell'app dicono ancora quelli di prima. Gli indirizzi seguono i nomi
  nuovi (/giochi/infiltrato/, /giochi/disegna-e-indovina/…); Mini Asta, Ruota e Prezzo tengono quelli neutri (/giochi/mini-asta/, /ruota/, /prezzo/).
- La cartella `dist/giochi/` contiene anche i pezzi dei giochi (`<pezzo>.<impronta>.js`): le pagine sono cartelle, non si toccano.

## Come si rifà
1. Cambia i testi: `testi-*.js` (un oggetto per gioco: titolo ≤ 55 caratteri senza «Revel House», descr 130-155, h1, intro, sezioni)
   e `sito-testi.js` (pagina d'ingresso, pagina di tutti i giochi, categorie, note sui marchi).
2. `"C:\Program Files\nodejs\node.exe" .agents/skills/pagine-google/fai-pagine.js` (scrive `sito/`, `app/ingresso.html` e titolo e
   descrizione in `app/testa.html` e `index.html`).
3. `bash costruisci-versione-online.sh`, poi `"C:\Program Files\nodejs\node.exe" .agents/skills/pagine-google/foto.js` (controlli e foto
   in D:/SG-google-prove/foto: ogni pagina della mappa risponde, si legge senza JavaScript, niente esce di lato, con JavaScript il testo
   d'ingresso resta nascosto e l'app parte).

Un gioco nuovo: il testo in un `testi-*.js` e il suo indirizzo in `PAGINE` (fai-pagine.js), se no il programma si ferma.
Gli indirizzi delle pagine NON si cambiano (Google li ricorda). Un gioco che si nasconde: via da solo alla prossima volta che si rifà.

## Regole dei testi
- Italiano semplice e caldo, niente promesse false: «gratis» e «senza pubblicità» sono veri (regole.html); MAI «senza registrazione»
  (il profilo c'è), niente durate inventate, numeri di giocatori solo dalle schede.
- MAI nomi di giochi in scatola, app, programmi TV o presentatori di altri (Codenames, Taboo, Forza 4…), né come titolo né nei testi.
  Le parole che la gente cerca sì, ma come descrizione e MAI come nome: «il gioco dell'impostore», «indovina il paese dal piatto», «green flag e
  red flag», «il calcio con le pedine», «l'asta del fantacalcio» (per «Fantacalcio» c'è la nota in fondo alla pagina, `marchi`).
  Il perché dei nomi e le ricerche di Google: D:/SG-nomi/giochi/LEGGIMI.md.
- Black Jack e Poker: sempre chiaro che le monete sono finte.

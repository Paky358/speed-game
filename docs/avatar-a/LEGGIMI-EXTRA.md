# Avatar illustrati — SECONDO TEMPO, seconda metà: pettinature, cappelli, extra (5 nov 2026)

Leggi prima `LEGGIMI-AIUTANTI.md` (coordinate, aiuti K, come sono fatti i pezzi) e `LEGGIMI-CORPO.md` (corpo unico,
K.dipingi, K.manica, K.suManica, foto con `critico\scatta.js`). Il motore `D:\SG-avatar-a\js\omino-a.js` NON si tocca.
Il disegno di prima di ogni voce sta in `D:\SG-avatar-a\js\omino.js` (cerca il nome tra virgolette): serve SOLO a capire
cos'è la voce e dove sta (es. "lei" = la collana di fiori hawaiana, "cuffiecollo" = cuffie appoggiate al collo), NON lo stile.
Esempi da cui copiare la mano: i pezzi già fatti in `pezzi\capelli-uomo.js`, `capelli-donna.js`, `cappelli.js`, `accessori.js`.

## Dove si disegnano (registrazione con A.pezzo(tipo, voce, function (K) { … }))
- `capelli`: `{ dietro, fronte, ombraFronte }` in coordinate della TESTA (vedi LEGGIMI-AIUTANTI). Ogni pettinatura deve stare
  bene anche DI SPALLE (`{"spalle":true}`): il motore disegna la nuca piena di capelli, il «fronte» girato dietro la testa (fa il
  volume intorno) e il «dietro» sopra (i capelli che scendono sulla schiena). Prova sempre anche di spalle e col cappellino.
- `cappelli`: `{ linea, svg, dietro }` (testa). `occhiali`, `orecchini`: svg (testa).
- `collo`: `{ sopra, dietro }` in coordinate del MONDO (400×1000): sopra il vestito, sotto la testa. Il collo: centro x `K.C`,
  mezza larghezza `K.B.nk`, base del collo y ≈ 240-250, spalle `K.Y.spalla` 268, petto `K.Y.petto`. Deve stare bene su
  tutte e 6 le corporature (larghezze in K.B) e su maglietta, camicia, giacca, felpa col cappuccio.
- `schiena`: `{ dietro, sopra }` (mondo): dietro = dietro al corpo (zaino, chitarra, mantello, ali), sopra = gli spallacci
  sopra il vestito. Di spalle il motore mette «dietro» DAVANTI a tutto (lo zaino si vede dalla schiena): disegnalo in modo che
  stia bene in tutte e due le viste.
- `borsa`: `{ sotto, sopra }` (mondo): sotto = la borsa (prima delle braccia: il braccio le passa davanti), sopra = la tracolla.
  La borsetta in mano: sta alla mano sinistra nel disegno (`K.BR[-1].W` = polso).
- `inmano`: `{ dietro, davanti }` (mondo): la cosa tenuta nella mano a DESTRA nel disegno, che il motore chiude a pugno.
  `K.presa = { x, y, ang, k }` = il centro del pugno, la direzione dell'avambraccio (gradi da giù, + verso fuori) e la misura
  della mano: il manico va «dentro» il pugno (dietro = prima della mano, davanti = sopra). Nelle pose con le braccia alzate
  (`{"braccia":"su"}`) la presa si sposta da sola: prova anche lì. Nei gesti col braccio davanti la cosa non si disegna.
- `animale`: svg (mondo) a terra ACCANTO all'avatar, a destra (x tra ~330 e ~590, zampe a y ≈ 999; il riquadro arriva a
  x 600). Stile uguale agli avatar (volumi morbidi, luce da sinistra), carino e riconoscibile anche a 54 px.
- `pittura`: svg in coordinate della TESTA, ritagliato sul viso (come la barba «dentro»): sotto occhi, naso e bocca.
- `stampa`: `function (K, T)` (mondo), ritagliata sul tronco della maglia (vedi le stampe in fondo a omino-a.js).

## Regole
- Stile: illustrazione morbida, luce da sinistra, ombre morbide (K.soft, K.cilindro), niente contorni neri spessi; stessa mano
  dei pezzi già fatti. Ogni pezzo bello da vicino E leggibile piccolo (fogli `media`, `piccola`).
- Gli id dei gradienti con un prefisso tuo; niente immagini, niente testi lunghi; pochi punti (gli avatar devono restare leggeri:
  usa curve e ripetizioni, non centinaia di tratti).
- Ogni avatar salvato resta la stessa persona: la voce deve sembrare quella di prima (stessa idea, stesso colore: colAcc,
  colCollo, colMano, colSchiena, colAnimale, colBorsa, colCap…).
- Foto: `"?foglio=voce&voce=<voce>&valori=a,b,c"` (6 corpi) con `&vb=testa` / `&vb=busto` / `&extra={...}` / `&opz={...}`.
  Le voci delle opzioni: capelli, cappello, occhiali, collo, schiena, borsa, mano (le cose in mano), animale, pittura, stampa.
- Scrivi SOLO nel tuo file `pezzi\<gruppo>.js` (nuovo, comincia con `(function () { var A = window.SGOminoA; … })();`) e
  nella tua cartella `aiutanti\<gruppo>\`. Il banco del critico e `unisci.sh` caricano già questi file se esistono, dopo gli
  altri: capelli-a.js, capelli-b.js, capelli-c.js, capelli-d.js, cappelli2.js, extra-a.js, extra-b.js, varie.js.
  Quando una voce ha il suo pezzo, il motore smette di usare quello «simile» (SGOminoA.SIMILI) da solo.
- Niente server, ferma solo i processi che hai avviato tu, non modificare file non tuoi, NON usare il pannello browser dell'app.

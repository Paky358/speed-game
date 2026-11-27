# 📞 Telefono Disegnato: il gioco scritto (27 nov 2026 sera)

Il proprietario ha scelto la **proposta A «Per ridere» con i premi della C**. Il gioco è sul ramo `telefono-disegnato` (cartella D:/SG-telefono), **NON pubblicato**.

## Le foto delle partite intere
Partite online vere con i telefoni finti: frasi scritte, disegni fatti col dito finto, frasi indovinate. Al passo 2 arriva Tom in ritardo e Dina guarda col link.
Ogni foto è fatta su due telefoni: basso (360x640) e alto (412x915). Quando si scrive c'è anche una foto con la tastiera aperta (360x340).
- `n4/`, `n6/`, `n10/`: le foto una per una, il diario (`diario-N.txt`) e la foto per WhatsApp di un libretto (`whatsapp-N.png`).
- `nN/foglio-360-a.png`, `-b`, `-c` in ogni cartella: le foto del telefono basso, piccole su un foglio solo, da guardare in un colpo.
- **I nomi sulle pagine** (controllati dalle prove td7 in 4 e td7b in 5): ogni pagina ha il nome di chi l'ha fatta davvero, nella rivelazione, nel feed e nella foto per WhatsApp. **Mai la stessa persona due volte nello stesso libretto** (28 nov 2026). Prima in 4 e in 6 chi scriveva la frase la disegnava anche lui (la regola di Telestrations per i numeri pari): non c'è più, e col gioco di prima la td7 fallisce.
- **«Telefono senza fili» non compare da nessuna parte** (è un marchio depositato da un altro): la foto per WhatsApp finisce con «revelhouse.it · Telefono Disegnato».
- Controlli fatti in tutte e tre le partite:
  - niente esce dallo schermo e niente scorre;
  - nessuna frase o disegno passa nella foto della partita mentre si gioca;
  - nessun errore.

## Come si gioca adesso
- **Partenza**: frase libera, col tasto «🎲 Non mi viene niente: dammi un'idea» (426 frasi pronte).
- **Libretti di una pagina a testa, al massimo 7**: in 4 sono 4, in 6 sono 6, in 10 sono 7. In 4 e in 6 il libretto finisce con un disegno («…ed è arrivata così» mostra il disegno grande).
- **La rivelazione la sfoglia chi tiene la partita**: tasto «Avanti ▶» che va avanti da solo, più ⏸ per fermarsi.
- **Ritmo** a scelta nelle regole: svelto, normale (80 secondi per disegnare) o con calma.
- **Non si aspetta il più lento**: appena hanno finito tutti si passa il libretto.
- **Chi esce non rompe niente**: la sua pagina si salta.
- **Chi arriva tardi** guarda ed entra alla partita dopo.
- **Se chi tiene la partita sparisce**, un amico la porta avanti e gli altri gli rimandano i disegni.
- **Fine del libretto**: «era partita così… ed è arrivata così», ⭐ al disegno più bello e 📸 la foto per WhatsApp.
- **A fine partita i premi**: 🎨 Picasso, 😂 il libretto più bello, 🔨 il Sabotatore, 🔍 il Detective. Poi «📖 Rivedi i libretti».

## Le scelte (fatte il 28 nov 2026)
Il proprietario: «fai tutte le scelte che reputi migliori». Deciso così:
- **A · Copertina in home**: la fa la chat delle copertine (linea viola); per ora c'è l'emoji 📞.
- **B · Il libretto nella rivelazione**: resta com'è, le pagine si impilano dal basso e le vecchie salgono e sfumano. Si vede da dove arriva ogni pagina.
- **C · Quanto dura la rivelazione**: un po' più svelta (una frase 3 secondi, un disegno 5, la fine del libretto 8): in 4 circa 2 minuti, in 10 circa 6. Chi tiene la partita può sempre andare avanti prima.
- **D · Il premio «🐢 Con calma»**: tolto. I premi fanno festa, non prendono in giro chi è lento.
- **E · La reazione 💩**: tolta, al suo posto 🔥. Le reazioni sono 😂 😮 👏 ❤️ 🔥.
- **F · Classifica della serata**: restano tutti primi a pari merito (è un gioco per ridere, senza punti).
- **G · La tastiera aperta sul telefono basso**: resta com'è (si vedono la frase e «Fatto»).
- **H · Cose non fatte**, ognuna un lavoro a parte: la pagina per Google, i trofei, il modo sullo stesso telefono, unire la lavagna con quella di Disegna e Indovina.
- **I · In 4 e in 6 il libretto finisce con un disegno**: resta così. Con una pagina in meno (3 in 4) sarebbe troppo corto e la frase cambierebbe poco.

## Le prove
`.agents/skills/prova-nel-browser/preferiti/telefono.js` contiene td0-td6:
- td0: le regole;
- td1: la partita intera in 4;
- td2: chi arriva tardi, chi guarda, chi ricarica, chi esce;
- td3: chi tiene la partita ricarica;
- td4: chi tiene la partita sparisce e la porta avanti la vice;
- td5: le misure in 10;
- td6: dalla Sala, con la Rivincita;
- td7 e td7b: ogni pagina col nome di chi l'ha fatta (in 4 e in 5).

Le foto si rifanno con `telefono-foto/foto.js --n 4|6|10`.

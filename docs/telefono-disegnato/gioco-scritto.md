# 📞 Telefono Disegnato: il gioco scritto (27 nov 2026 sera)

Il proprietario ha scelto la **proposta A «Per ridere» con i premi della C**. Il gioco è sul ramo `telefono-disegnato` (cartella D:/SG-telefono), **NON pubblicato**.

## Le foto delle partite intere
Partite online vere con i telefoni finti: frasi scritte, disegni fatti col dito finto, frasi indovinate. Al passo 2 arriva Tom in ritardo e Dina guarda col link.
Ogni foto è fatta su due telefoni: basso (360x640) e alto (412x915). Quando si scrive c'è anche una foto con la tastiera aperta (360x340).
- `n4/`, `n6/`, `n10/`: le foto una per una, il diario (`diario-N.txt`) e la foto per WhatsApp di un libretto (`whatsapp-N.png`).
- `nN/foglio-360-a.png`, `-b`, `-c` in ogni cartella: le foto del telefono basso, piccole su un foglio solo, da guardare in un colpo.
- **I nomi sulle pagine** (controllati dalla prova td7, in 4 e in 5: ogni pagina col nome di chi l'ha fatta davvero, nella rivelazione, nel feed e nella foto per WhatsApp). In 4 e in 6 chi scrive la frase la **disegna anche lui** (come in Telestrations), così ogni libretto finisce con una frase scritta: per questo nel libretto di Paky c'è «Paky ha scritto» e poi «Paky ha disegnato». In 5, 7 e da 8 in su il primo disegno lo fa quello dopo.
- **«Telefono senza fili» non compare da nessuna parte** (è un marchio depositato da un altro): la foto per WhatsApp finisce con «revelhouse.it · Telefono Disegnato».
- Controlli fatti in tutte e tre le partite:
  - niente esce dallo schermo e niente scorre;
  - nessuna frase o disegno passa nella foto della partita mentre si gioca;
  - nessun errore.

## Come si gioca adesso
- **Partenza**: frase libera, col tasto «🎲 Non mi viene niente: dammi un'idea» (426 frasi pronte).
- **Libretti di al massimo 7 pagine**: in 4 sono 5, in 6 sono 7, in 10 sono 7.
- **La rivelazione la sfoglia chi tiene la partita**: tasto «Avanti ▶» che va avanti da solo, più ⏸ per fermarsi.
- **Ritmo** a scelta nelle regole: svelto, normale (80 secondi per disegnare) o con calma.
- **Non si aspetta il più lento**: appena hanno finito tutti si passa il libretto.
- **Chi esce non rompe niente**: la sua pagina si salta.
- **Chi arriva tardi** guarda ed entra alla partita dopo.
- **Se chi tiene la partita sparisce**, un amico la porta avanti e gli altri gli rimandano i disegni.
- **Fine del libretto**: «era partita così… ed è arrivata così», ⭐ al disegno più bello e 📸 la foto per WhatsApp.
- **A fine partita i premi**: 🎨 Picasso, 😂 il libretto più bello, 🔨 il Sabotatore, 🔍 il Detective, 🐢 Con calma. Poi «📖 Rivedi i libretti».

## Le scelte per il proprietario
- **A · La copertina in home.** Oggi c'è solo l'emoji 📞. Va fatta come le altre (linea viola, chat delle copertine).
- **B · Come cresce il libretto nella rivelazione.** Oggi le pagine si impilano dal basso: le vecchie salgono e sfumano. All'inizio di ogni libretto c'è quindi tanto vuoto in alto (foto `n10/14-r1-pagina-1-frase-360.png`).
  - L'alternativa è una pagina sola a tutto schermo alla volta: più grande, ma non si vede da dove arriva.
- **C · Quanto dura la rivelazione.** Una frase circa 4 secondi, un disegno circa 6, la fine del libretto 9.
  - In 4 sono circa 2 minuti, in 10 circa 7.
  - Chi tiene la partita può sempre andare avanti prima. Si può accorciare.
- **D · Il premio «🐢 Con calma»** (l'ultimo a finire più volte). Fa ridere, ma a qualcuno può dare fastidio: tenerlo o toglierlo?
- **E · La reazione 💩.** Tenerla o toglierla? Le altre sono 😂 😮 👏 ❤️.
- **F · La classifica della serata.** Il gioco non ha punti, quindi tutti arrivano primi a pari merito.
  - L'alternativa è mettere primo chi ha vinto più premi.
- **G · La tastiera aperta sul telefono basso.** Spariscono il titolo e «🎲 Dammi un'idea»; restano la frase e «Fatto» (foto `n4/04-p1-frase-tastiera.png`).
- **H · Cose non fatte**, ognuna un lavoro a parte:
  - la pagina per Google;
  - i trofei;
  - il modo sullo stesso telefono;
  - unire la lavagna con quella di Disegna e Indovina (oggi è copiata dentro il gioco).

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

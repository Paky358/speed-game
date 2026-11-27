# Note per chi scriverà il gioco (27 nov 2026)

Da leggere DOPO che il proprietario ha scelto (LEGGIMI.md). Qui ci sono solo appunti: niente è ancora scritto nel gioco.

## Da dove partire
- Il modello `.agents/skills/nuovo-gioco/modello-gioco-online.js`: saletta, join, chi rientra, `t.contoAvanti`, `t.tastiFine`, `riprende`/`riserva`, `t.mioId`, chi guarda. Cambiare solo le parti «QUI».
- `soloOnline: true`, `postiOnline: 12`, `ritardatari: "partita"` (chi arriva tardi guarda la rivelazione ed entra alla prossima: i libretti hanno già i loro passaggi), `riprende: true`, `riserva: true` (non è un gioco in tempo reale).

## La lavagna: quella di Disegna e Indovina
In `js/games/scarabocchio.js`, `creaVista` (righe 527-840 circa):
- `COLORI` (16 + gomma), `SPESSORI` (5), matita, linea, tondo e secchiello;
- `disegnaDa`, `riempi` (il secchiello sulla tela), annulla, ripeti, cestino;
- `misura` per la lavagna 1000x1200 che sta nello spazio;
- le coordinate sono già in unità della lavagna, uguali su tutti i telefoni.

La cosa giusta è **tirarla fuori in un pezzo comune** (per esempio `js/lavagna.js`, pezzo «lavagna» in elenco-giochi.js, usato da tutti e due i giochi). Va fatto con cura, perché Disegna e Indovina non deve cambiare: le sue prove vanno ripassate.

Qui **non serve il disegno dal vivo**: il disegno viaggia intero quando si tocca «Fatto» (o allo scadere del tempo), come lista di tratti.
- È più leggero dei pezzetti a 14 al secondo di Disegna e Indovina.
- Dà il ridisegno gratis nella rivelazione: si rifanno i tratti in ordine, accelerati (circa 3 secondi a disegno).

## I libretti (catene)
- N giocatori = N libretti. A ogni giro ognuno lavora su un libretto diverso, e nessuno vede due volte lo stesso libretto.
- **Le pagine**: la prima è sempre scritta e l'ultima sempre scritta.
  - Con N dispari: N pagine (scrivi, disegna, scrivi…).
  - Con N pari: chi ha scritto la frase la disegna anche (come Telestrations), quindi N+1 pagine.
  - Al massimo 7: da 8 in su ogni libretto salta qualcuno.
  - 4 → 5 pagine, 5 → 5, 6 → 7, 7 → 7, da 8 a 12 → 7.
- **Chi esce**: le pagine che doveva fare passano al primo che ha finito, fra chi non ha ancora toccato quel libretto. Se non c'è nessuno, la pagina si salta.
- **Chi arriva tardi** guarda soltanto (`ritardatari: "partita"`).
- **Tempi** (da provare): frase 45 s, disegno 80 s, indovina 40 s. Si va avanti appena hanno finito tutti. Con «✏️ Ritocca» si può riaprire il proprio disegno finché gli altri non hanno finito.
- **Allo scadere** vale quello che c'è. Una frase vuota diventa «🤷 Non ha scritto niente» (fa ridere lo stesso). Un disegno vuoto resta vuoto.

## I segreti
Ognuno vede solo la pagina prima della sua: si manda con `rete.inviaVeloce({ …, to: id })`, mai nella foto. Nella foto ci vanno solo «chi ha finito» e i secondi che mancano. Chi ha disegnato resta nascosto fino alla rivelazione.

## Il peso (ripresa e riserva)
- Un disegno sono circa 3-15 KB di tratti. In 10, con 7 pagine, fanno circa 35 disegni, cioè 100-500 KB: troppo per la copia del vice (60 KB).
- I disegni vanno in `soloQui`. Ogni telefono tiene anche i suoi (quelli che ha disegnato, in `sessionStorage` per stanza).
- Se il vice prende la partita, chiede a tutti di rimandare i loro disegni, come la Battaglia Navale rimanda le navi.

## La rivelazione
- La guida chi tiene la partita: «Avanti ▶» con `t.contoAvanti` (circa 6 s a pagina), ⏸ per fermarsi.
- Per tutti è la stessa pagina: nella foto c'è il numero del libretto e della pagina. I disegni della rivelazione si mandano a tutti in quel momento, uno alla volta, con la foto.
- Le reazioni (😂 😮 👏 ❤️ 💩) volano su tutti i telefoni. Si contano per pagina, e servono ai premi (⭐ e 😂).
- **🙈 Nascondi**: chi tiene la partita può nascondere un disegno volgare.

## La foto per WhatsApp
Un libretto intero in un'immagine alta (`foto/WA.png`), disegnata su una tela e condivisa coi file. Come Memata e la Mini Asta: `navigator.share({ files })`, vedi `js/games/memata.js` riga 247.

## Le idee per «🎲 Dammi un'idea»
Servono 300-400 frasi strane, disegnabili e senza volgarità (skill `contenuti`), per esempio «Un gatto che fa surf su una pizza». La memoria delle uscite va sul telefono di chi tiene la partita.

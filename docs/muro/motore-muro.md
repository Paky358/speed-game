# 🧱 Il Muro — come è fatto il gioco (per chi lo scrive)

Leggi prima `docs/muro/progetto-muro.md` (le decisioni del proprietario: NON cambiarle), la skill
`.agents/skills/nuovo-gioco/SKILL.md` e il modello `.agents/skills/nuovo-gioco/modello-gioco-online.js`.
Il gioco nasce COPIANDO il modello in `js/games/muro.js` e cambiando solo le parti «QUI» (saletta, ripresa, riserva, vici,
ritardatari, tastiFine, risultato, contoAvanti, conferme, Riprova, chi guarda: tutto come nel modello).

## Numeri (li ha decisi la simulazione: vedi `.agents/skills/prova-nel-browser/muro/simulazione/LEGGIMI.md`)
Valori di partenza (muro A, SCELTO dal proprietario il 10 nov 2026):
`CASE = [50, 100, 250, 500, 1000, 500, 250, 100, 50]` (uguali nei due muri: + nei vincitori, − nei perdenti), ultimo giro
`CASE_DOPPIO` = le stesse ×2 (disegnate più grandi), `NZ = 9` zone (una sopra ogni casella, come il Plinko del Prezzo),
`FILE = 12`, `MAXP = 3` palline per domanda (0 permesso = non cade niente), `SOTTOZERO = true` (i punti scendono anche sotto
zero), `GIRI` = 6 + 6 domande normali + 3 dell'ultimo giro doppio (15 in tutto). «Quante domande»: Corta 9+3, Normale 12+3
(di partenza), Lunga 15+3 (sempre 3 doppie in fondo). `TEMPO` 20 s di partenza; «Tempo»: 15 / 20 / 30 s.
Muro B (scartato dal proprietario; resta come riserva): 13 caselle, 7 zone, 16 file, valori in LEGGIMI.md della simulazione.
Le pagine di prova delle proposte (per i colori, i simboli disegnati e l'aspetto dei due muri) sono in
`D:\SG-muro\lavoro\proposte\` (A.html, B.html, modello.tpl, gen.js; le foto in `foto\`): RIUSA da lì il disegno delle
palline coi simboli e l'aspetto dei due muri (perdenti blu-viola freddo, vincitori oro), adattati a `NUM`.
Tienili TUTTI in un oggetto `NUM` in cima al file, così si ritoccano in un posto solo:
caselle del muro (`CASE` normali e `CASE_DOPPIO` dell'ultimo giro), `NZ` zone, `FILE` file di chiodini (PARI: così la pallina
finisce sempre in una casella), `MAXP` palline massime per domanda, `GIRI` (**fatto così**: `{ corta: [9, 3], normale: [12, 3],
lunga: [15, 3] }` = [domande normali, domande dell'ultimo giro doppio]), `TEMPI` e `TEMPO` (secondi per rispondere e scegliere),
`SOTTOZERO` (sì/no), le durate della rivelazione (`SVELA` 4,6 s col `RULLO` di 1,5 s; nei muri `INTRO` 0,65 s, `SFASA` 0,12 s tra
una pallina e l'altra ma al massimo `SFASA_TOT` 0,9 s in tutto, `DOPO` 1,3 s, `VUOTO` 1,3 s per il muro vuoto; `PUNTI` 6 s,
`PUNTI_ANNUNCIO` 8 s prima dell'ultimo giro) e `PASSO` (i tempi della caduta: primo chiodino, saltello, discesa, casella,
accelerazione per fila). Un muro dura `INTRO + (n−1)·sfasamento + caduta (~2,9 s) + DOPO`: lo calcolano uguale host e telefoni.
Il muro si disegna da `NUM` (numero di caselle e zone qualsiasi): il proprietario ha scelto la proposta A (9 caselle,
9 zone) invece della B (13 caselle, 7 zone) guardando le foto; cambiare muro deve voler dire cambiare solo `NUM`.

## Registrazione
`SG.registra({ id: "muro", nome: "Il Muro", icona: "🧱", tema: "oro", soloOnline: true, modi: [], giocatoriMin: 4,
giocatoriMax: 10, postiOnline: 10, ritardatari: "turno", riprende: true, riserva: true, difficolta: 2, regole: [...],
impostazioni, riassunto, avvia })`.
Altri file: `js/core.js` (`muro` in `GIOCHI_ONLINE` e in `CAT_GIOCO` come `"parole"`), `js/elenco-giochi.js`
(`pezzo("muro", "data/muro-domande.js js/games/muro.js")`, poi le schede con `.agents/skills/nuovo-gioco/elenco-giochi.js`),
`data/novita.js` (voce in cima, `v` +1). NIENTE trofei.

## Le domande
`data/muro-domande.js`: `window.SG_MURO_ARG = [{ id, nome, icona }]` (i 12 argomenti, vedi progetto) e
`window.SG_MURO_DOM = { calcio: [[difficoltà 1-3, domanda, giusta, sbagliata, sbagliata?], ...], ... }` (prima risposta =
giusta; il gioco le mescola). Il file è GIÀ FATTO (692 domande) e si rifà con `.agents/skills/prova-nel-browser/muro/domande/
costruisci.js`: non modificarlo a mano. L'id di una domanda = `arg + ":" + impronta corta del testo` (non l'indice: il file può cambiare).
Uscite ricordate sul telefono di chi tiene la partita: `localStorage "sg-muro-uscite"` (ultimi 900 id; prima quelle mai
uscite; mai lo stesso argomento due volte di fila se si può; si salva a ogni domanda).

## Impostazioni (⚙️, con `.modo-chip` / `.cat-chip`, funzionano col box fuori dalla pagina)
- «Argomenti»: un `.cat-chip` per argomento con icona, nome, il NUMERO di domande accanto e la ✓ (come la Linea del tempo:
  l'ultimo non si spegne). `dove.arg = [...]`.
- «Quante domande»: 3 scelte (corta / normale / lunga, coi numeri della simulazione). `dove.nd`.
- «Tempo per rispondere»: 3 scelte (es. 20 / 30 / 45 s, di partenza quello della simulazione). `dove.tempo`.
- `riassunto(imp)`: «12 domande · 30 s · tutti gli argomenti» (o i primi 3 + «e altri N»).
- «🔄 A rotazione» NON sta qui: sta nella saletta, accanto alle squadre (vedi sotto). Di partenza SPENTO (scelta del proprietario, 10 nov 2026).

## Le squadre
`SQ = [{ nome: "Blu", col, sim: "★" }, { "Arancione", ●}, { "Viola", ▲ }, { "Giallo", ■ }, { "Azzurro", ◆ }]` (colori dalle
proposte scelte; mai rosso né verde). Il simbolo si DISEGNA (canvas e SVG), non è un carattere: così è uguale su tutti i telefoni.
Ogni giocatore ha `sq` (0..nsq-1) e `ruolo` («su» = nella stanza, «giu» = giù). In ogni squadra UN SOLO «giu».

## La saletta (`t.lobby` con `extra: [box]`, come `lobby()` di js/games/ordine.js righe 1605-1661)
- Una riga per squadra (colore, simbolo, nome, i membri col loro ruolo: «⬇️ Luca» giù, «🚪 Sara» nella stanza), «Vengo qui»
  sulle altre squadre; nella propria squadra «⬇️ Sto giù io» (chi era giù passa nella stanza). Tutto in 360x640 con 10 persone.
- L'host: «Squadre: 2 3 4 5» (solo i numeri possibili coi presenti: ogni squadra da 2 o 3), tocca un nome per spostarlo
  nella squadra dopo (`{ t: "sposta", id }`), «🔀 Squadre a caso», e il tastino «🔄 A rotazione» (acceso/spento: `vm.rot`;
  gli altri lo vedono). Accanto una riga corta che dice cosa vuol dire («I ruoli si scambiano a ogni domanda»).
- Chi entra va nella squadra con meno persone (a pari la prima); se la squadra non ha nessuno giù, va giù. **Fatto così:** se sono
  tutte da 3 (e sono meno di 5) si apre da sola una squadra nuova per lui e subito uno di una squadra da 3 lo raggiunge (le
  squadre si bilanciano da sole: 3,3 + 1 = 3,2,2). «🔀 A caso» sistema anche il numero di squadre se quello di adesso non va bene coi presenti.
- Quando cambia `nsq` chi è in una squadra che non c'è più va nelle squadre più piccole; poi le squadre si bilanciano da sole
  (vedi «⚖️ Le squadre si sistemano da sole» in fondo).
- «Comincia» solo se: almeno 2 squadre, ogni squadra da 2 o 3, ognuna con il suo «giu». La `nota` dice cosa manca
  («La squadra Viola ha bisogno di un altro giocatore»).
- Messaggi: `{ t: "sq", s }`, `{ t: "giu" }` (ospite → host); solo da chi tiene la partita (IO): `{ t: "sposta", id }`,
  `{ t: "nsq", n }`, `{ t: "rot", on }`, `{ t: "mischia" }` (l'host le fa anche dal suo telefono senza rete: chiama le funzioni).

## Chi sta giù a ogni domanda
- Rotazione spenta: sempre quello scelto in saletta.
- Rotazione accesa: l'ordine della squadra parte da chi è giù in saletta; alla domanda k è giù il (k mod membri)-esimo
  presente. Squadre da 3: giù uno alla volta, a giro.
- Se chi doveva stare giù è «via» (uscito, telefono spento da più di 20 s) va giù il prossimo presente.
- Squadra con UN solo presente: fa tutto lui (vede la domanda, risponde E sceglie le palline); scritta «🙋 Sei da solo:
  rispondi e scegli tu le palline». Squadra con zero presenti: salta la domanda (i punti restano).

## Una domanda (H.stato), tutte le squadre insieme
1. **"domanda"** (`TEMPO` s; finisce prima se TUTTI hanno finito: chi è nella stanza ha risposto e chi è giù ha toccato
   «✅ Pronto»).
   - Nella stanza: la domanda e le 2-3 risposte (tasti grandi); un tocco = risposta data, non si cambia.
   - Giù: l'argomento GRANDE, le risposte (solo da leggere), nelle squadre da 3 «Su chi punti?» (le due faccine; di partenza
     il primo), e il MURO PICCOLO con le zone in cima: ogni tocco su una zona = una pallina da lì (si vede la pallina col
     simbolo), «↺» toglie l'ultima, «Palline: 2 di MAXP», «✅ Pronto». Le palline messe contano anche senza «Pronto»;
     zero palline = non cade niente.
   - Chi guarda e chi aspetta il giro dopo: argomento e risposte, «Le squadre stanno scegliendo…». **Le risposte possibili NON
     stanno nella foto** (c'è dentro la giusta): arrivano a tutti col messaggio `{ t: "opz", p, q, r, opz }` (inviaVeloce senza
     `to`, mescolate, non dice quale è giusta), rimandato a chi entra o rientra e a chi guarda (`cb.onGuarda`).
   - In alto: «Domanda 3 di 12», l'argomento, la barra del tempo; nell'ultimo giro «🔥 PUNTI DOPPI».
   - Il telefono: domanda e scelte NON vanno mai nella foto. La domanda va SOLO a chi è nella stanza (e a chi è da solo)
     con `rete.inviaVeloce({ t: "dom", to: id, ... })`; le mosse (`{ t: "risp", q, s }`, `{ t: "palle", q, z: [zone…],
     su: id }`, `{ t: "pronto", q }`) vanno solo all'host. Nella foto solo CHI ha finito (✅ accanto al nome). Chi ricarica
     riceve con `to` la domanda (se è nella stanza) e le SUE scelte (`{ t: "tue", … }`).
   - Il tempo: nella foto i **millisecondi** che mancano (`restaMs`, e `durMs` = quanto dura la fase); il telefono chiude ANTICIPO = 1 s prima (come `fineVM` di prezzo.js) e
     l'host chiude 0,7 s dopo la sua scadenza: il tocco dell'ultimo istante arriva.
2. **"svela"** (~4,5 s): rullo di tamburi, poi la domanda, la risposta giusta che si accende, e accanto a ogni risposta i
   simboli delle squadre che l'hanno data (nelle squadre da 3 conta la risposta di chi giù ha scelto; chi non ha risposto:
   «⏰»). Da qui nella foto ci sono domanda, giusta e risposte.
3. **"perdenti"**: «💀 Muro dei perdenti» a TUTTO schermo: cadono insieme tutte le palline delle squadre che hanno sbagliato
   (o non hanno risposto). Nessuna = «🎉 Nessuno nel muro dei perdenti!» per ~1 s e si va avanti.
4. **"vincitori"**: «🏆 Muro dei vincitori», uguale, con le palline di chi ha risposto bene.
   I percorsi li decide l'host (come `cade()` del Plinko: mezza casella a destra o a sinistra a ogni fila, rimbalzo sulle
   pareti) e vanno nella foto SOLO della fase del loro muro: `palle: [{ s: squadra, x: zona, p: "0110…", b: casella }]`.
5. **"punti"** (~5 s): la classifica delle squadre con «+350» / «−120»; l'host ha «Prossima domanda ▶» con
   `t.contoAvanti` (gli altri il conto). Prima dell'ultimo giro l'annuncio «🔥 Ultimo giro: punti doppi!» (caselle grandi).
I punti si danno (H.punti) SOLO entrando in "punti" (calcolati alla fine di "domanda" e salvati in `H.delta`): così una
ripresa a metà rivelazione non dà punti due volte. Sotto zero: come dice `NUM.SOTTOZERO`.

## Il muro (canvas) — RIUSA il Plinko di js/games/prezzo-premi-b.js (righe 468-1000: PL, cade, percorso, geo, disegnaTavola, rivela)
- Copia e adatta le funzioni (non riscriverle da zero), con un numero qualsiasi di caselle (`CASE.length`), di zone (`NZ`,
  in mezze caselle sopra le caselle) e di file.
- Due strati: il muro (chiodini, caselle coi valori, cornice: **fatto così**, nelle caselle il numero SENZA segno, «1.000» —
  «−1.000» a 360 px di larghezza non ci stava leggibile —; il segno lo dicono il nome del muro in alto, i colori e i «+250» / «−250»
  che salgono) disegnato UNA volta; le palline su un secondo
  canvas ridisegnato a ogni fotogramma con `requestAnimationFrame` (al massimo ~25 palline). Con la pagina nascosta o
  «riduci movimento» le palline vanno subito al loro posto. Ogni pallina: cerchio del colore della squadra, bordo chiaro,
  SIMBOLO della squadra in bianco/scuro ben leggibile. Partono insieme (con un piccolo sfasamento), cadono fila per fila
  con un po' di accelerazione e il saltello sul chiodino, si fermano nella casella, la casella si accende e sale «+250».
- Il muro dei perdenti più freddo e scuro (valori col meno), quello dei vincitori oro (valori col più).
- Sotto (o sopra) il muro le squadre (simbolo, colore, punti) che cambiano quando le loro palline si fermano.
- Vibrazione: un colpo breve quando una pallina della MIA squadra si ferma nel muro dei vincitori, uno lungo nel muro dei
  perdenti; breve a ogni scelta (risposta, zona, Pronto); festa a chi vince alla fine. Mai mentre si scorre.
- Suoni piccoli creati al momento (WebAudio, come `SUONI` di js/games/asta.js): tic sui chiodini (al massimo uno ogni 45 ms),
  rullo di tamburi, «tlac» nella casella, ta-dà e trombone. Niente suoni per chi ha l'app in secondo piano.

## Fine partita
Classifica delle SQUADRE (con i nomi e gli avatar dei membri), medaglie a pari merito, faccine, `t.tastiFine`.
`t.risultato`: i NOMI dei giocatori, ognuno col posto della sua squadra (pari merito = stesso posto). `t.aCheSiamo("Domanda
3 di 12")` a ogni domanda.

## Chi arriva tardi (`ritardatari: "turno"`)
Nel join a partita cominciata va in `H.prossimi` (col suo id nella foto) ed entra all'inizio della domanda dopo nella squadra
con meno persone che ne ha meno di 3 (prende i punti della squadra; con la rotazione entra nel giro). Se tutte le squadre sono
da 3, guarda ed entra alla prossima partita.

## Ripresa e riserva (come il modello)
- `ricorda()`: fase, stato, giocatori con `sq`/`ruolo`/via, `nsq`, `rot`, impostazioni, la LISTA degli id delle domande della
  partita, l'indice, l'ordine delle risposte della domanda di adesso, punti, `delta`, palle e percorsi (da "svela" in poi),
  scadenze come ORE. Durante "domanda" NON salvare risposte e palline (la domanda si rifà da capo): così nella copia per il
  vice non ci sono le scelte degli altri. Sotto i 60 KB (gli avatar fuori).
- Alla ripresa: "domanda" → stessa domanda da capo (dopo il respiro di 5 s); "svela"/"perdenti"/"vincitori" → la rivelazione
  da "svela" (i punti non erano ancora dati); "punti" → la domanda dopo; "fine" → si resta lì.

## Spiegazione al primo avvio
Su ogni telefono, la prima volta (`localStorage "sg-muro-spiegato"`): un foglio corto sopra la prima domanda, 3 righe con
le figure (stanza / giù / i due muri) e «Ho capito ▶»; si salta con un tocco ovunque e non blocca il tempo degli altri.

## Schermo
Niente scorrimento e niente titolo in alto: `.schermata.mu-piena{padding:0!important;height:var(--alt,100dvh);overflow:hidden}`
(testa e piede nascosti, come il modello). Prefisso di classe `mu-`. Aggiornare solo i pezzi che cambiano (una schermata per
stato costruita UNA volta, chiave `q|stato|rip`). Animazioni solo con transform e opacity. 360x640 e 412x915 senza scorrere,
anche con 5 squadre e 10 persone. Numeri col punto delle migliaia. «avatar», mai «omino». Notte vivace: variabili `--o-*` e
`--n-*` di css/styles.css (un solo tasto lampone pieno per schermata).

## Com'è venuto davvero (10 nov 2026, la prima scrittura di js/games/muro.js)
Tutto come sopra, con questi pezzi in più o fatti in un modo preciso (se cambi il gioco, tieni aggiornata questa parte):
- **I messaggi.** Ospite → host: `join`; in saletta `{ t: "sq", s }`, `{ t: "giu" }` (e solo da chi tiene la partita `sposta`,
  `nsq`, `rot`, `mischia`); nella domanda `{ t: "risp", q, r, s }`, `{ t: "palle", q, r, z: [zone], su }` (a ogni tocco: le
  palline messe contano anche senza «Pronto»), `{ t: "pronto", q, r, z, su }` (porta anche zone e puntata: se arriva prima delle
  palline non si perde niente). `q` = la domanda, `r` = il numero della ripresa (`vm.rip`): una mossa vecchia non vale nella
  domanda rifatta. Host → un telefono (inviaVeloce con `to`): `{ t: "dom", p, q, r, testo, opz }` (solo a chi è nella stanza o da
  solo), `{ t: "tue", p, q, r, a, z, su, pronto }` (le sue scelte, a chi ricarica). Host → tutti (inviaVeloce, non restano in
  stanza): `{ t: "opz", p, q, r, opz }` (le risposte mescolate), `{ t: "omini", o: { id: avatar } }` (la foto della partita non
  porta gli avatar: si mandano all'inizio, a chi entra o rientra e a chi guarda, al massimo uno al secondo).
- **La foto (vm).** Sempre: `fase`, `codice`, `pronta`, `partita`, `tiene`, `rip`, `nsq`, `rot`, `nd`, `tempo`, `players`
  (`id`, `nome`, `sq`, `ruolo`, `via`, `forse`; `omino` solo in saletta e sulla classifica), `guarda`, `prossimi`, `dopo` (chi è
  arrivato con le squadre tutte da 3: guarda ed entra alla prossima partita), `punti` (per squadra). In partita: `stato`, `k`,
  `tot`, `ndop`, `dop`, `restaMs`, `durMs`, `arg`, `nr` (quante risposte), `sqd` (per squadra `{ giu, su: [id], solo }` o `null`).
  Solo nella domanda `fatto` (gli id di chi ha finito). Da «svela» a «punti» `riv` = `{ testo, opz, giusta, ris: [{ a, chi, ok }] }`
  (`a` = −1 nessuna risposta, `chi` = di chi era la risposta che conta). Nel muro dei perdenti `palle` delle squadre che hanno
  sbagliato, in quello dei vincitori `palle` di chi ha indovinato e `dl` (i punti già tolti nel muro dei perdenti, per i
  punteggi sotto il muro); nei punteggi `delta`. Sulla classifica `classifica` = `[{ s, punti, pos, ids }]`.
- **Chi si puntava ed è uscito senza rispondere** (squadre da 3): conta il compagno che ha risposto. **Chi era via all'inizio della
  domanda e torna** legge «⏳ Rientri dalla prossima domanda» (le parti si decidono all'inizio di ogni domanda).
- **La partita finisce da sola** se restano meno di 2 squadre con qualcuno dentro.
- **Nella rivelazione** delle squadre da 3, sotto: «Contava la risposta di Luca». Chi guarda legge chi ha indovinato.
- **Vibrazione:** i tasti vibrano già col core (il colpo da 10 ms al tocco); il gioco vibra alla risposta giusta della mia
  squadra, quando una MIA pallina si ferma (breve nei vincitori, lunga nei perdenti) e alla vittoria. Mai a raffica (una ogni 0,16 s).
- **La spiegazione della prima volta** compare su ogni telefono (anche a chi guarda) sopra la prima domanda che vede.
- **«🔄 A rotazione» di partenza SPENTO** (`H.rot = false`, scelta del proprietario del 10 nov 2026; la prima scrittura lo
  aveva acceso). L'host lo accende in saletta; gli amici leggono «🔒 Ruoli fissi: chi è giù resta giù» o «🔄 A rotazione: …».
- **La nota della saletta dice anche come si sistema** (una frase sola, la saletta in cima ne mostra solo una): all'host «La
  squadra Viola ha bisogno di un altro giocatore: tocca un nome per spostarlo.», agli altri «…: per andarci tocca «Vengo qui».»
  (solo a chi è in un'altra squadra).
- **⚖️ Le squadre si sistemano da sole** (10 nov 2026, regola del proprietario: squadre da 2 o da 3, con un numero dispari UNA
  squadra da 3; `bilancia(fermo)` nell'host). Dopo ogni cambio in saletta (chi entra, chi esce, il numero di squadre, «Vengo
  qui», l'host che tocca un nome, «🔀 A caso», la «Nuova partita»): se una squadra è da 1 o vuota e un'altra è da 3, uno della
  squadra da 3 va in quella piccola; si sposta chi è **nella stanza** ed è **arrivato per ultimo** (l'ordine di `H.players`),
  MAI chi è giù e MAI chi ha appena scelto il posto o è stato spostato apposta dall'host (`fermo`: la sua scelta resta, si sposta
  un altro). Anche una squadra da 4 (può nascere solo da uno spostamento dell'host) cede uno alla squadra più piccola se è da 2 o
  meno. Così con 7 persone (2 squadre da 3 e ne arriva un altro) le squadre diventano 3,2,2 e «Comincia» è subito acceso (prima
  nasceva una squadra da 1 e «Comincia» restava spento); passando da 2 a 3 squadre con 6 persone diventano 2,2,2. Restano da
  sistemare a mano solo i casi senza una squadra da 3 da cui prendere (es. 5 persone in 3 squadre: 2,2,1 → si tocca «2»).
- **I numeri nelle caselle sono tutti della stessa altezza** (prima «1.000» si rimpiccioliva e sembrava valere meno di «500»):
  una misura sola per muro; il numero più largo si stringe di lato (`c.scale`, al massimo fino al 78%) e solo se non basta cala la
  misura per tutti.
- **I «+250» / «−250» che salgono** (`scritta(P)` in `cascata`) partono sopra la pallina ferma e sopra le palline già ferme
  sotto di loro nelle caselle accanto, e quando arrivano più palline insieme in caselle vicine si **sfalsano in altezza**: ognuna
  prende il posto libero più in basso sopra le scritte che stanno ancora salendo lì (prima si sovrapponevano tra loro e
  coprivano le palline). Salgono tutte alla stessa velocità COSTANTE (`muSale` lineare: `VOLO.sale` = 40 px in `VOLO.ms` =
  1,5 s, `VOLO.spazio` = 3 px tra due scritte), così due scritte che nascono separate restano separate fino alla fine.
- **📏 Schermi pieni** (10 nov 2026, il proprietario: «non voglio spazi vuoti, una grande schermata fatta bene»). Le misure
  crescono con l'altezza VERA dello schermo: `fl(a, b)` nello stile = `a` px a 640 di altezza, `b` px a 915, in linea retta in
  mezzo e ferme fuori (`clamp` con `--u` = 1% di `var(--alt)`, definito su `.mu-piena` e `.mu-fine`); a 360x640 tutto resta come
  prima. **Nella stanza** i tasti delle risposte crescono (più alti se sono solo 2: `.mu-risposte.n2`) e la **carta della
  domanda prende tutto il posto che resta** (`flex: 1 1 0`, la sua misura non dipende dal testo) e il testo la riempie
  (`riempiCarta`: il carattere più grande con cui ci sta fino all'86% della carta e senza parole che escono di lato, tra il
  minimo dello stile e 2,2 volte tanto, al massimo `CARTA_MAX` = 44 px: le domande corte vengono grandi come in TV; se non ci
  sta nemmeno col minimo si stringe fino al 70%; si rifà col ResizeObserver e quando cambia il testo, prima del disegno: niente
  lampeggio; la nota sotto le risposte è sempre alta due righe, così rispondendo la carta non cambia misura). **Nella rivelazione** uguale: righe delle risposte che crescono (più
  alte se sono poche: `.mu-righe.n2`/`n4`), la carta col testo che la riempie, l'esito in fondo. **Nei punteggi** le righe si
  dividono l'altezza (`flex: 1 1 0`) fino a un massimo che dipende da quante squadre ci sono (`.mu-cl.n2`, `n3`), con
  caratteri e palline (`palla(…, "cresce")`, diametro `--pd`) più grandi. **La classifica finale** (`.schermata.mu-fine`): il centro si allunga fino
  ai tasti e le righe crescono in ALTEZZA fino a un massimo (in larghezza restano strette: con due persone nella squadra nomi e
  avatar stanno su una riga sola). NIENTE altezza fissa né centro che scorre: il core mostra «👥 Avete giocato con» solo se
  la pagina non scorre, e con un centro che scorre la toglieva sempre. Prima a 412x915 restavano 220 px vuoti sopra la carta, 240 sopra e 210 sotto i punteggi, 220 tra le
  faccine e i tasti della classifica finale.
- **Le prove:** `.agents/skills/prova-nel-browser/muro/muro.js` (`mu1` 4 telefoni 2 squadre da 2, partita intera e nessun
  segreto in NESSUNA foto della domanda passata sulla stanza; `mu1b` 6 telefoni 2 squadre da 3 con «su chi punti»; `mu2` l'host
  ricarica a metà domanda, nel muro e sui punteggi senza punti doppi, poi si spegne e un'amica finisce la partita; `mu3` chi
  guarda col link e chi arriva a metà con «▶ Entra»; `mu4`-`mu13` del provatore: 3 squadre da 2, 3+2 con la rotazione su tre,
  10 telefoni, muri vuoti e punti sotto zero, tempo scaduto, rotazione spenta, argomenti spenti, un amico che ricarica, squadre
  tutte da 3 con chi arriva dopo; `mu13` la settima persona in saletta: le squadre diventano da sole 3,2,2 con «Comincia»
  acceso, poi l'host sposta apposta uno di una squadra da 2 e lui resta lì mentre il gioco ribilancia, senza spostare chi è giù). Tutte tranne `mu9` accendono la rotazione in saletta
  (`accendiRotazione`, che controlla anche che di partenza sia spenta). Le foto delle schermate con 10 telefoni e 5 squadre, a 360x640 (e con
  `--grande` anche 412x915): `"C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\muro\foto-muro.js 8981 D:\SG-muro\lavoro\foto-muro --fine`
  (dalla cartella della copia, col suo server acceso; le foto vanno in una cartella fuori dai file del gioco).

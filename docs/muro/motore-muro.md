# 🧱 Il Muro — come è fatto il gioco (per chi lo scrive)

Leggi prima `D:\SG-muro\lavoro\progetto-muro.md` (le decisioni del proprietario: NON cambiarle), la skill
`.agents/skills/nuovo-gioco/SKILL.md` e il modello `.agents/skills/nuovo-gioco/modello-gioco-online.js`.
Il gioco nasce COPIANDO il modello in `js/games/muro.js` e cambiando solo le parti «QUI» (saletta, ripresa, riserva, vici,
ritardatari, tastiFine, risultato, contoAvanti, conferme, Riprova, chi guarda: tutto come nel modello).

## Numeri (li ha decisi la simulazione: vedi `.agents/skills/prova-nel-browser/muro/simulazione/LEGGIMI.md`)
Valori di partenza (muro A, consigliato; il proprietario deve ancora scegliere tra A e B):
`CASE = [50, 100, 250, 500, 1000, 500, 250, 100, 50]` (uguali nei due muri: + nei vincitori, − nei perdenti), ultimo giro
`CASE_DOPPIO` = le stesse ×2 (disegnate più grandi), `NZ = 9` zone (una sopra ogni casella, come il Plinko del Prezzo),
`FILE = 12`, `MAXP = 3` palline per domanda (0 permesso = non cade niente), `SOTTOZERO = true` (i punti scendono anche sotto
zero), `GIRI` = 6 + 6 domande normali + 3 dell'ultimo giro doppio (15 in tutto). «Quante domande»: Corta 9+3, Normale 12+3
(di partenza), Lunga 15+3 (sempre 3 doppie in fondo). `TEMPO` 20 s di partenza; «Tempo»: 15 / 20 / 30 s.
Muro B (se lo sceglie il proprietario): 13 caselle, 7 zone, 16 file, valori in LEGGIMI.md della simulazione.
Le pagine di prova delle proposte (per i colori, i simboli disegnati e l'aspetto dei due muri) sono in
`D:\SG-muro\lavoro\proposte\` (A.html, B.html, modello.tpl, gen.js; le foto in `foto\`): RIUSA da lì il disegno delle
palline coi simboli e l'aspetto dei due muri (perdenti blu-viola freddo, vincitori oro), adattati a `NUM`.
Tienili TUTTI in un oggetto `NUM` in cima al file, così si ritoccano in un posto solo:
caselle del muro (`CASE` normali e `CASE_DOPPIO` dell'ultimo giro), `NZ` zone, `FILE` file di chiodini, `MAXP` palline
massime per domanda, `GIRI` (es. `[{ n: 4, x: 1 }, { n: 4, x: 1 }, { n: 4, x: 2, doppio: 1 }]`), `TEMPO` (secondi per
rispondere e scegliere), `SOTTOZERO` (sì/no), le durate delle fasi della rivelazione.
Il muro si disegna da `NUM` (numero di caselle e zone qualsiasi): il proprietario sceglierà tra la proposta A (9 caselle,
9 zone) e la B (13 caselle, 7 zone) nelle foto; cambiare muro deve voler dire cambiare solo `NUM`.

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
- «🔄 A rotazione» NON sta qui: sta nella saletta, accanto alle squadre (vedi sotto). Di partenza ACCESO.

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
- Chi entra va nella squadra con meno persone (a pari la prima); se la squadra non ha nessuno giù, va giù.
- Quando cambia `nsq` chi è in una squadra che non c'è più va nelle squadre più piccole; nessun altro si sposta.
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
   - Chi guarda e chi aspetta il giro dopo: argomento e risposte, «Le squadre stanno scegliendo…».
   - In alto: «Domanda 3 di 12», l'argomento, la barra del tempo; nell'ultimo giro «🔥 PUNTI DOPPI».
   - Il telefono: domanda e scelte NON vanno mai nella foto. La domanda va SOLO a chi è nella stanza (e a chi è da solo)
     con `rete.inviaVeloce({ t: "dom", to: id, ... })`; le mosse (`{ t: "risp", q, s }`, `{ t: "palle", q, z: [zone…],
     su: id }`, `{ t: "pronto", q }`) vanno solo all'host. Nella foto solo CHI ha finito (✅ accanto al nome). Chi ricarica
     riceve con `to` la domanda (se è nella stanza) e le SUE scelte (`{ t: "tue", … }`).
   - Il tempo: nella foto i secondi che mancano; il telefono chiude ANTICIPO = 1 s prima (come `fineVM` di prezzo.js) e
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
- Due strati: il muro (chiodini, caselle coi valori «+500» / «−500», cornice) disegnato UNA volta; le palline su un secondo
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

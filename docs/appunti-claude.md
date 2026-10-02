# Appunti di progetto (presi da Claude)

Decisioni e cose imparate lavorando a SPeeD GAME, da sapere su ogni computer. Le regole principali sono in AGENTS.md; qui ci sono i dettagli. Niente dati personali.

Per Claude: puoi salvare queste note nella tua memoria, una per sezione.

---

## animazioni-senza-lag.md

---
name: animazioni-senza-lag
description: "Come fare scene animate grandi (studio game show, telecamera) senza lag sui telefoni — lezioni del 26 set 2026"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 87a8175c-c075-4a67-9954-2d194757ddb6
  modified: 2026-09-26T16:37:57.812Z
---

Il primo studio game show della Linea del tempo "laggava tutto quando entri" (utente, 26 set 2026). La causa era questa:
- animazioni che ridisegnano pixel (background-position, height, box-shadow);
- dentro un "mondo" enorme spostato e zoomato con transform;
- più pubblico fatto con gradienti ripetuti e filtri sugli SVG.

Dopo, su Samsung S25 (120 Hz), "lagga un po' quando la cam si muove" (3 giocatori, un telefono). Correzioni del 26 set, da confermare sul telefono dell'utente:
- clip-path o mask su pezzi animati o con figli animati (fari, occhio di bue, raggi, bordo sfumato della linea del tempo) → sostituiti da canvas disegnati una volta;
- barra del tempo animata con width → trasformata in transform scaleX (WAAPI);
- flip 3D che restano girati (cartellini, carta) → flip finto 2D, oppure resi piatti dopo il giro;
- filter sull'avatar eliminato → grigio disegnato direttamente nel canvas;
- maxischermo alleggerito durante gli stacchi (torna il logo).

Poi (stesso giorno) "lagghicchia e sparisce il bancone durante i filmati". Correzioni:
- la telecamera non è più una transizione CSS, ma è mossa via JS a ogni fotogramma (rAF), con un setTimeout di sicurezza;
- all'avvio parte a zoom 1 per un attimo (pre-raster), poi niente più ridisegni allo zoom;
- bancone, luci e torri LED sono canvas;
- se i fotogrammi saltano durante i movimenti, si attiva da sola la modalità leggera (st-leggero-auto).

**Why:** ogni fotogramma il telefono ridisegnava porzioni grandissime della scena, e a ogni zoom della telecamera rifaceva pubblico e avatar. Maschere, clip-path, filtri e 3D costringono poi il telefono a un passaggio in più a ogni fotogramma mentre la telecamera si muove. Con una transizione CSS sulla telecamera, Chrome ridisegna tutto il DOM del mondo all'inizio e alla fine di ogni movimento: da qui gli scatti e i pezzi che spariscono.

**How to apply:**
- La scenografia ferma va disegnata una volta su `<canvas>`: la telecamera la scala senza ridisegnarla.
- Le animazioni infinite devono toccare SOLO transform/opacity, su pezzi piccoli con will-change. Mai animare width o height: usare scaleX o scaleY.
- Luci morbide (fasci, coni, aloni, raggi) → canvas piccoli già sfumati, non gradienti con clip-path o mask.
- Niente filter/backdrop-filter/drop-shadow su SVG nei mondi zoomati. Gli avatar grandi vanno usati come bitmap: SVG → Image → canvas.
- Niente 3D che resta acceso mentre la telecamera si muove.
- Metti in pausa le animazioni quando non si vedono (classe st-quieto).
- Prevedi una modalità leggera (LEGGERO: deviceMemory ≤ 3 o ≤ 3 core).

Vedi js/studio.js (disegnaStudio, disegnaPubblico, mettiAvatar, fascio/cono/raggi) e [[omini-avatar]].

---

## categorie-e-minigiochi.md

---
name: categorie-e-minigiochi
description: "La home ha filtri per categoria; i minigiochi stile Wii Party vanno in \"Minigiochi\" e altri sono in arrivo"
metadata: 
  node_type: memory
  type: project
  originSessionId: eef02d5a-f729-428f-80e2-a862464ee230
  modified: 2026-09-15T10:23:56.384Z
---

La home mostra una barra di categorie sotto il nome profilo (definite in [core.js](../../../Desktop/SG/js/core.js): `CATEGORIE` + mappa `CAT_GIOCO` per id gioco). "Tutti" è il default; cliccando un filtro si aggiorna solo la griglia (niente ricostruzione della schermata, vedi [[niente-lampeggio-render]]). Ogni gioco DEVE avere una categoria (aggiornare `CAT_GIOCO` quando se ne aggiunge uno).

Categorie attuali: **Carte** (scopa, scopa2v2, scopone), **1 contro 1** (id categoria ancora `sfida`: tris, drop4, hockey, navale), **Festa** (asta, impostore, sipero), **Minigiochi** (scalinata, horto), **Quiz & parole** (timeline, nomicose, patata).

La **Battaglia Navale** (id `navale`, [navale.js](../../../Desktop/SG/js/games/navale.js)): regole classiche, griglia 10×10, flotta 5/4/3/3/2, vs computer o online. L'online è **peer-to-peer** (non host-autoritativo come gli altri): ogni telefono tiene la propria flotta e non la manda mai in rete, si scambiano solo colpi ed esiti (nessuno bara). Non usa rAF → testabile col pannello nascosto. Il tabellone ha le coordinate (lettere A–J in alto, numeri 1–10 a lato); il piazzamento ha l'**anteprima** (tocco = proiezione verde/rossa, conferma con "Metti qui" o ritocco); a ogni nave affondata compare la scritta "colpito e affondato".

**Da fare (in attesa dell'utente)**: aggiungere **colpi speciali** alla Battaglia Navale — Paky se li sta studiando e me li dirà (al 15 set 2026 ancora da definire).

La Patata Bollente sta in **Quiz & parole** perché dici a voce una parola della categoria che esce (gioco di parole, come Nomi Cose e Città).

**Minigiochi** = giochini veloci stile *Wii Party* (fortuna/riflessi). Ci sono: **Scalinata** e **Horto Muso** (id `horto`, corsa di cavalli tipo Derby Dash: corsie DRITTE non ovali, frusta/energia/sfinimento, da 2 a 8 cavalli con corsie adattive, vs bot o online; [horto.js](../../../Desktop/SG/js/games/horto.js), usa requestAnimationFrame → non testabile col pannello browser nascosto, si prova sul telefono). Ancora da fare: la **bandierina sulla spiaggia**. Vedi [[progetto-sg]].

---

## cifre-col-punto.md

---
name: cifre-col-punto
description: "I numeri grandi nell'app (fiches, punti, soldi) si scrivono col punto delle migliaia: 1.000, 10.000"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 87a8175c-c075-4a67-9954-2d194757ddb6
  modified: 2026-09-26T21:19:11.749Z
---

I numeri grandi si scrivono col punto delle migliaia: 1.000, 10.000, 1.250.000. Mai "1000" attaccato.

**Why:** l'utente l'ha chiesto per le fiches del Black Jack (26 set 2026): "Dividi ogni 1000 con un punto".

**How to apply:** vale per ogni cifra che vede chi gioca, in qualsiasi gioco nuovo o rifatto (fiches, crediti dell'Asta, punteggi alti). Nel Black Jack c'è già `BJ.fmtN(n)`, che mette i punti con una regex. Non usare `toLocaleString`, perché su alcuni telefoni "1000" resta senza punto.

Vedi [[progetto-sg]], [[utente-e-stile]].

---

## foto-giochi-home.md

---
name: foto-giochi-home
description: "Come aggiungere le foto realistiche dei giochi nelle card della home (cartella, nome file, conversione)"
metadata: 
  node_type: memory
  type: project
  originSessionId: 87a8175c-c075-4a67-9954-2d194757ddb6
  modified: 2026-09-21T16:12:35.681Z
---

Le card della home mostrano in cima la foto `carte/giochi/<id>.jpg` (banner illustrazione); se manca, resta l'emoji del gioco. Meccanismo in `tesseraGioco` (js/core.js): un `<img>` che si toglie da solo con `onerror`. CSS in css/styles.css (`.tessera .icona .illustr`, object-fit:cover). Il build copia già tutta `carte/` in `dist/carte/`.

**Id/nome file** dei giochi: timeline, asta, nomicose, impostore, sipero, scalinata, horto, pendolo, patata, hockey, tris, drop4, navale, scopa, scopa2v2, scopone, blackjack. Elenco anche in `carte/giochi/COME-AGGIUNGERE-LE-FOTO.txt`.

**Flusso quando l'utente manda una foto in chat:** l'immagine arriva come file locale (es. `...\images\N.webp`). La converto/ridimensiono a JPG largo ~800px, qualità ~82, orizzontale, e la salvo in `carte/giochi/<id>.jpg` (poi build + push su master → deploy).

**Conversione (Windows, niente ImageMagick/ffmpeg):** funziona con .NET WIC in PowerShell — `Add-Type PresentationCore,WindowsBase`, `BitmapDecoder::Create` (legge anche i .webp su questa macchina), `TransformedBitmap` + `ScaleTransform` per ridurre, `JpegBitmapEncoder` (QualityLevel 82) per salvare. Una webp da 1376x768/114KB è diventata 800px/56KB. Vedi [[progetto-sg]].

---

## hockey-bot-taratura.md

---
name: hockey-bot-taratura
description: "Come è fatto e come si tara il bot di Glow Hockey (parametri DIFF, simulazione in browser con giocatore virtuale)"
metadata:
  node_type: memory
  type: project
  originSessionId: 87a8175c-c075-4a67-9954-2d194757ddb6
  modified: 2026-09-23T17:49:33.648Z
---

Il bot di Glow Hockey (js/games/hockey.js, `botMuovi` + tabella `DIFF` facile/medio/difficile) è stato rifatto il 23 set 2026 dopo 3 giri di feedback dell'utente: prima tremava, si incastrava col disco negli angoli, poi era imbattibile, poi (7-0 in 20 s a Medio) non attaccava mai.

**Logica attuale:** decide ogni `reaz` secondi (tempo di reazione); errore `err` scelto una volta per azione (mai a ogni frame → tremolio). Modi: difendi (va dove il disco *arriverà*, `prevediX` con rimbalzi, dosato da `prev`), respingi (tiro veloce vicino: va incontro), attacca (in 3 tempi: passa di lato → rincorsa dietro → tiro a velocità `tiro`, mira agli angoli con `mira`), scansa (disco alle spalle che torna giù: si sposta, altrimenti autogol). Dopo ogni tocco `cool` di ritirata. Disco fermo contro il bordo alto (irraggiungibile) → dopo 1,2 s scivola fuori (effetto cuscino d'aria).

**Online nascosto (23 set 2026, richiesta utente: "infattibile per ora"):** in hockey.js `ONLINE_ATTIVO = false`; tolto solo il tasto "Online (in due)" dalle impostazioni. Il codice `hostHK` / `ospiteHK` / lobby è ancora tutto lì e NON va cancellato: per riattivarlo rimettere `true` e il tasto modo (bot/online) nelle impostazioni. Campo in stile Glow Hockey classico con colori nell'oggetto `TEMA` (predisposto per skin/campi da comprare in futuro).

**Fisica "al massimo" (23 set 2026, solo offline):** HSTEP 1/240, MAXV 3.2, ATTRITO 0.28, PADK 0.8; racchette INTERPOLATE nei sotto-passi (prima una strisciata veloce attraversava il disco); pali veri (`palo()`), gol solo quando il centro passa la linea; bordo disegnato FUORI dall'area di gioco (`geo()`, `BORDO`, `KH`). Pausa gol: tutto fermo, racchette a casa, `_snap` al rientro. Dopo questi fix il bot parava tutto: ritarato sull'errore `err` (leva principale), tiri che entrano ~47/23/12%. Il giocatore virtuale deve sapersi liberare dal suo angolo, altrimenti le partite simulate vanno in stallo.

**NON usare `getContext("2d", { desynchronized: true })`:** provato il 23 set 2026 per ridurre la latenza, sul telefono dell'utente causava tearing (disco/racchette "scomposti"). Tolto.

**Lezione:** testare coi tiri singoli ha ingannato (sembrava bilanciato, in partita il bot non attaccava). Tarare SEMPRE con partite intere simulate: nel browser si carica hockey.js con `new Function('SG', src)` esponendo `window.__HK` (statoNuovo, passo, botMuovi, DIFF…) e un "giocatore virtuale" in basso (vel 2.5–3.5, reaz 0.2–0.12; il "forte" somiglia all'utente). Misurare gol, tiri del bot, autogol, stallo, tremolio, incastri. Valori finali: vs "forte" in 12 min Facile 48-2, Medio 13-7, Difficile 3-6. Vedi [[progetto-sg]].

26 set (commit f3499c5), modifiche di gioco:
- dopo il gol NON c'è più la fase "gol" bloccata: st.cade (CADUTA 0,9 s) tiene il disco in aria, passo() lo salta e le racchette restano libere; all'atterraggio st.atterra++ fa "tump";
- st.golVis mostra "GOL!" per 1,1 s;
- bordi luminosi: sponda() salva spX/spY, il disegno usa luci[] con i contatori;
- MusicaHK = musica stile Geometry Dash (140 bpm), tasto in alto a destra, si ferma in stop().
Online: la vista porta cade/atterra/golVis/spN/spX/spY; l'ospite rende liscia la caduta con S.cadeFino.
26 set (commit 0b4f24e): misure +10% su richiesta (RP 0,055, RPAD 0,10, GOALW 0,46) e campo a tutto schermo (ASP da --alt, fino a 2,5).
Riprova con un nuovo giocatore virtuale (vel 3, reaz 0,13, si mette dietro al disco e tira verso la porta), campo ASP 2,27, 12 minuti per livello:
- misure vecchie: Facile 46-4, Medio 52-4, Difficile 24-7;
- misure nuove: Facile 63-14, Medio 42-12, Difficile 27-28 (gioco più vivo, livelli in ordine).
Il file di simulazione era zz-hk-sim.html, cancellato: si ricrea caricando hockey.js con new Function e sostituendo le costanti.

---

## niente-lampeggio-render.md

---
name: niente-lampeggio-render
description: "Regola fissa - i giochi non devono mai lampeggiare a ogni mossa; aggiornare solo la parte che cambia, non ricostruire tutta la schermata"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: eef02d5a-f729-428f-80e2-a862464ee230
  modified: 2026-09-13T20:12:42.929Z
---

Nei giochi lo schermo NON deve lampeggiare/sfarfallare a ogni mossa: deve restare fisso. Richiesto per Scopa/Scopone, poi anche Tris e Forza 4, con l'istruzione esplicita "non metterlo mai più in nessun gioco".

**Perché:** ricostruire l'intera schermata a ogni mossa (in SG: `t.mostra(s)` che fa `svuota(app)` + `appendChild` + `window.scrollTo(0,0)` in [core.js](../../../Desktop/SG/js/core.js)) cancella e ridisegna tutta la pagina e riporta lo scorrimento in cima → si vede un lampeggio a ogni tocco.

**Come applicarlo:** montare la schermata UNA volta sola; alle mosse successive aggiornare solo la zona che cambia (es. sostituire il solo contenitore di gioco con `cont.replaceChild(nuovoBox, vecchioBox)`), senza richiamare `t.mostra` e senza `scrollTo`. Tenere un riferimento al nodo montato e rifarlo da capo solo quando si cambia davvero schermata (controllo `document.body.contains(box)`). Vale per OGNI gioco nuovo o esistente. Vedi [[progetto-sg]].

---

## omini-avatar.md

---
name: omini-avatar
description: "Omini personalizzabili stile Mii (js/omino.js, SVG con sfumature) — piano in 3 passi e sblocchi legati ai trofei"
metadata:
  node_type: memory
  type: project
  originSessionId: 87a8175c-c075-4a67-9954-2d194757ddb6
  modified: 2026-09-25T11:13:28.007Z
---

L'utente vuole omini personalizzabili stile Mii al posto dei pallini nei giochi (idea nata 24 set 2026). Deve essere MEGLIO di quelli "piatti" dell'app di un suo amico (testa+busto tinta unita): scelta = figura intera, gradienti/luce, occhi lucidi, guance, ombra a terra.

Fatto e pubblicato (passo 1, 24 set 2026): js/omino.js (SGOmino.svg(cfg,{busto,px}), el, casuale(seme), OPZ, BASE, LIBERI) con forma uomo/donna, corpo snello/medio/robusto, gonna (utente: "ora sono tutti ciotti" → corporature ben distinte, donna più formosa ma stile Mii sobrio). Editor schermataOmino in core.js (dal profilo cloud), salvato in profilo.omino via SGNube.salvaOmino, bust nel chip home. Corona = unico accessorio bloccato (non in LIBERI).

Feedback utente (24 set): "portali al livello successivo, non solo poligoni" → rifatto con gradienti morbidi, ciocche/peli/pieghe, clipPath; guance NON per tutti ma voce a scelta (default "no"); barba/baffi NON negli accessori → voce "barba" sotto Capelli (norm() converte i vecchi). Id SVG con prefisso casuale (PREF) per evitare gradienti "rubati" tra omini.

NOME: l'utente vuole "avatar", mai "omino/omini" nei testi dell'app (25 set). Nel codice i nomi interni (omino.js, SGOmino) restano.
"Pazza personalizzazione" (25 set), poi 26 set: 55 tagli (GRUPPI_CAPELLI Corti 0-20 / Medi 20-35 / Lunghi 35-55: un taglio nuovo va inserito nel suo gruppo aggiornando gli indici), viso 6 forme, voce "orecchie", 14 occhi, 12 sopracciglia, 10 nasi, 18 bocche; i COLORI si aggiungono solo in fondo alle liste (gli avatar salvati usano l'indice), accessori a STRATI (cappello/occhiali/orecchini/collo, il vecchio "accessorio" viene convertito in norm()), BLOCCATI = {cappello:["corona"]} per gli sblocchi trofei, trucco/segni/modello scarpe.
App installabile (PWA) fatta 25 set (attenzione: nel manifest in app/ i percorsi sono relativi alla cartella app/ → start_url "../", icone senza "app/"): app/manifest.webmanifest + icone, sw.js minimo, pulsante "📲 Installa l'app" in home.

Proporzioni (25 set): testa ridotta del 15% per scelta dell'utente (SCALA_TESTA = 0.85 in omino.js, scala attorno al collo 100,150); il busto dei tondini segue la scala così la faccia resta grande. Busto più corto/gambe lunghe (orlo maglia Y=202, viewBox 0 0 200 264).

Piano concordato (pubblicare un passo alla volta):
1. editor "Il mio omino" + salvataggio nel profilo cloud + omino in home al posto del chip profilo
2. esclusivi sbloccati dai trofei (Platino = oggetto a tema del gioco, Diamanti = volti speciali, N trofei totali = rari tipo corona) — idea dell'utente
3. omino nei giochi uno alla volta (Scalinata, Black Jack, sala online per primi)

Passo 3 iniziato (25 set): Scopa 1v1 con tavolo in PROSPETTIVA (CSS rotateX, .sc-scena/.sc-piano in scopa.js), avversario seduto dietro al tavolo con espressioni (FACCE: pensa/esulta/triste), AVATAR_BOT fisso, online l'avatar viaggia nel "join" e in vm.avatar. L'utente ha scartato la vista di sé da dietro ("si vedono solo gli avversari"); le proprie carte restano sulla mensola. Anteprime prima del gioco vero: file HTML autonomo (omino.js incollato dentro) mandato con SendUserFile.
Black Jack (25 set): dealer = MATT_DEALER (giacca+papillon) dietro tavolo in prospettiva, fumetti di reazione; posti con busti adattati a N (1: niente fila, ≤5 "pochi", 6-10 "tanti" due file); drv.avatari() in locale/host/ospite, avatar nel "lobby". Poi (richiesta utente) vista DA DIETRO MATT: giocatori seduti (avatar interi, faccia verso di noi) in fila sul LATO LUNGO dritto in fondo al tavolo (l'utente: "non dovrebbero giocare sulla parte grande?"), parte curva verso Matt, da 6 in su due file sfalsate; BJ a tutto schermo (.bj-wrap fixed, sotto altezza fissa 196px, tavolo prende il resto), posizionati misurando dei segnaposto sul piano 3D (getBoundingClientRect), grandezza per N; fiche in pila (translateZ) davanti a ognuno, carte sul panno; Matt in cerchietto in basso a sinistra con fumetto. L'utente vuole il gioco "il più interattivo possibile". FATTO E PUBBLICATO (26 set, commit cb2996a) — "regia da TV" nel Black Jack (in blackjack.js: costruisci()/disegnaScena() aggiornano solo i pezzi cambiati, telecamera()/inquadra() con transform sul .bjr-cam, apertura() la prima volta; carte a CASCATA con spostamento adattato allo spazio fino al vicino; parte sotto 150px con tasti ai lati) — apertura con Matt a figura intera che saluta, carrellata su ogni giocatore, panoramica per le puntate (valore scritto sopra ogni pila), distribuzione con la telecamera che scorre sulla 2ª carta, ZOOM su chi gioca, zoom su Matt che scopre, panoramica finale; tavolo OVALE con giocatori lungo l'arco lontano; tocco su una faccia = sbircia. L'utente vuole personalizzare lui Matt; in futuro emote. Anteprima: scratchpad/blackjack-regia.html. Il bot della Scopa ora si chiama "Matt" (stessa faccia base: pelle 2, barba corta, occhi furbi) — vedi [[scalinata-bot-matt]].

26 set (commit 19deacb): DUE AVATAR a persona (profilo.omini [a,b] + ominoN; profilo.omino = quello in uso, i giochi leggono sempre omino); sotto il riflettore si apre il principale (ominoN), si scorre col dito o con le frecce ‹ › per cambiare; il principale è quello sul palco quando esci (niente più stella, commit 487543b); il secondo la prima volta nasce dell'altra forma. Trucco a PEZZI (ombretto/eyeliner/mascara/rossetto/blush, ognuno col colore) in scheda "Trucco", il vecchio trucco/colTrucco viene convertito in norm(); anteprime trucco con opts.viso (primo piano). Ricci definiti: nuvola() (bordo a gobbette) + spirali() + molla() (boccoli), tagli riccioletti/ricciciuffo/riccibob/riccifrangia/riccilunghi/ricciraccolti; GRUPPI_CAPELLI ora 0-22 / 22-39 / 39-61. Donna: fianchi ridotti (he -1, non +6).

Vedi [[trofei-sistema]], [[profili-cloud-firebase]].

26 set (commit 14432cd): VESTITI DA DONNA.
- capo: crop, top, camicetta, cardigan, maglione, vestito, vestitolungo;
- sotto: leggings, zampa, shortsjeans, minigonna, gonnapieghe, gonnatubino;
- modScarpe: tacchi, ballerine, stivaletti, stivalialti, zeppe.
SOLO_DONNA (regex in omino.js, esportata) nasconde gonne, vestiti, tacchi ecc. per la forma uomo, sia nell'editor sia nel disegno. Col vestito ("abito") le voci Sotto e Colore sotto spariscono e la gonna del vestito prende il colore della maglia.
26 set (commit 4540092), accessori nuovi:
- in testa: cerchietto, fiocco, mollette, paglia (LINEA 58);
- occhiali: felina ("A gatto"; il valore "gatto" era già usato dal cappello), grandi;
- orecchini: perla, cuori, cerchioni;
- al collo: girocollo, ciondolo, foulard;
- nuova voce borsa (nessuna, tracolla, borsetta) con colBorsa. La borsetta sta nella mano a sinistra del disegno, perché l'altra (om-b2) saluta.
Gonne e vestiti si disegnano DOPO le scarpe (gonnaPezzo), così gli stivali alti restano sotto. I tacchi sono disegnati di profilo, con le punte verso l'esterno.

26 set (commit f28b9ca): avatar anche in SCOPA 2v2 e SCOPONE.
- Stanza a 4 condivisa in scopa.js, esportata in SGCarte: misureStanza4, correggiStanza4, postiTavolo, stanza4, animaDistribuzione4, mioAvatar, avatarValido.
- Sedie [sinistra=io+1, compagno=io+2, destra=io+3]; targhe .sc-targa4 (il compagno ha 🤝 e il bordo verde).
- Bot con nomi fissi: 2v2 Matt, Giulia, Toni; Scopone Matt, Rosa, Peppe. facciaBot(nome): Matt = AVATAR_BOT; donna o uomo forzati per nome.
- Online 2v2: l'ospite manda omino nel join, l'host mette st.avatari nella vista.
- Scopone: mano su 2 file da 5.
- Musica SGMusica rifatta allegra ("troppo chill" per l'utente): 128 bpm, basso zum-pa, pizzicati, melodia, cassa e charleston.

26 set (commit 5dc4d4b): PALLA A PENDOLO con avatar (pendolo.js).
- Sulla trave gli avatar sono immagini SVG disegnate sul canvas (immagine/disegnaAvatar) con la targhetta del nome.
- Chi lancia si vede DI SPALLE con schiena(): colori presi dal cfg, lunghezza capelli da GRUPPI_CAPELLI.
- A tutto schermo (.pd-piena), tasti sopra l'acqua.
- Bot: Matt, Sara, Leo, Nina (donna o uomo forzati per nome).
- Online: l'ospite manda omino nel join, l'host manda "av" nel messaggio "via".
FINTO 3D (styles.css): respiro om-tutto, ciglia om-occhi, .sc-avv.pensa che fa su e giù, sguardo con translate su .om-occhi verso chi è di turno (stanza4, sedie.ioTurno). L'utente ha scartato il dondolio a destra e sinistra.

26 set (commit 715d1dc): HORTO MUSO rifatto (horto.js).
- cavalloSVG(i, fantino): cavallo di profilo con zampe snodate animate dal CSS (za-s/za-i/zp-s/zp-i), 8 MANTI, avatar busto in sella. L'utente ha chiesto "ancora più belli": corpo a sfumature, muscoli, briglie e segni bianchi.
- Scena a tutto schermo (.ho-piena).
- Telecamera: segue chi è in testa ma tiene sempre dentro il mio cavallo; pista lunga LUNGH=4.5 schermate.
- Minimappa a mezzo ovale (puntoMappa), cancelletti, cartelli dei metri.
- Photo finish coi cavalli SVG, podio con gli avatar.
- L'utente voleva la pista tonda: ho sconsigliato (cavalli minuscoli, sagome finte in curva) e fatto camera + minimappa. Approvato ("GASI FAI COSI").
- Bot: Matt, Sara, Leo, Nina, Giulia, Toni, Rosa.
- Online: omino nel join; l'host manda av nel "via"; lo snap ha b = sta frustando.
- L'host simula e disegna a 60 Hz ma trasmette 1 volta su 4.

26 set (commit a1b2984): LINEA DEL TEMPO rifatta (timeline.js). L'utente la trovava "antica".
- Layout .tl-piena, costruito con schermoTL / zonaScroll: linea verticale (nodoLinea), anni colorati per categoria (COL_CAT).
- Scelta del punto in due tocchi: tocchi lo slot, poi confermi.
- Carta che si gira nell'esito (nodoEsito).
- Avatar: avatarDi(g, faccia) nel HUD, in "Tocca a", nei voti, nella reazione esulta/triste e nel podio.
- Online: omino nel join, giocatori[].omino nel vm.
- memScroll/memSel evitano che la linea torni su a ogni ridisegno; l'esito non si ridisegna.

26 set (commit bfc2671): LINEA DEL TEMPO come GAME SHOW.
- Idea dell'utente: studio TV per tutta la sezione "quiz e parole"; da riusare per Nomi cose e città e Patata.
- Si trova in timeline.js:
  - creaStudio: un "mondo" 2VW x 2VH e la telecamera camera(S, rett, ms); inquadrature suSchermo, largo, suLeggio, suPubblico, panFila;
  - regia: apertura, stacco, rivelazione, finaleStudio;
  - leggii (postazioni) con avatar, punti a LED e cartellini dei voti; da 5 a 10 giocatori due file sfalsate (postiLeggii).
- Studio luminoso "prima serata" (viola/magenta/ciano con luci), non bianco.
- L'utente vuole che NON si salti niente.
- Telefono unico: il passaggio del telefono avviene dentro lo studio (aspettaTasto "Sono X").
- Online:
  - regia per telefono (REG, regiaTick/regiaPasso) che mette in fila le fasi;
  - l'host ha la fase "apertura" (durataApertura) e aggiunge STACCO al timer del turno.
26 set (commit de03dfe): studio game show, due ritocchi chiesti dall'utente.
- Pubblico "più vivo e più bello":
  - 20 avatar casuali trasformati in bitmap (preparaPoolPubblico) e stampati a file su canvas (disegnaPubblico, ~12 strisce "st-fila" che ondeggiano e saltano quando applaudono);
  - sopra: bastoncini luminosi, cartelli, occhi di bue colorati, lucine e flash;
  - pubblico in penombra, così i concorrenti risaltano.
- Occhio di bue fino al pavimento, con .pozza di luce e banco illuminato (.fronte:before).

26 set (commit 5224217 + 8dfb241): STUDIO CONDIVISO in js/studio.js (window.SGStudio).
- Caricato prima dei giochi, sia in index.html sia nel build.
- Contiene:
  - crea(t, giocatori, {io, esci, titolo, logo}), la telecamera e i pezzi (terzo, barra, aspettaTasto, lampo, accendiSolo, faccia, puntiLeggio, cartello, pubblico, scossa);
  - la regia di base: apertura, stacco, finale;
  - per i giochi: testoLeggio, tocca (leggii toccabili, S.onTocca), fuori, sopraTesta;
  - avatarDi, FX (applauso/ohh/rullo/fanfara), coriandoli.
- La timeline usa alias a SGStudio.
- PATATA nello studio:
  - voto sul maxischermo;
  - bomba DOM che vola tra i leggii (WAAPI);
  - esplosione con zoom e leggio "fuori";
  - il motore ha le pause ATTESA_INIZIO/ATTESA_ROUND/DURATA_BOOM (il tempo non scende) e attesaMs nel vm.
- NOMI COSE E CITTÀ nello studio (idea dell'utente):
  - lettera a slot machine;
  - "foglio" a righe (overlay .nc-foglio, fuori dal mondo, per la tastiera);
  - tabellone per categoria sul maxischermo (voti, "👍 tutti", uguali contate solo tra approvate).
- Lo studio non si ridisegna se il resize è la tastiera (input a fuoco).

26 set (NON ancora pubblicato): AVATAR RIFATTI, chiesto dall'utente ("facciamoli come Cristo comanda, divisione netta maschio/femmina, personalizzare divertente e intuitivo, tanti più oggetti").
- Lui/lei distinti in omino.js: lui spalle +3, fianchi -2, collo 26, braccia +1, sopracciglia x1.15; lei spalle -6, vita x0.72, fianchi +1, seno con luce/ombra sobria (bu), collo 19, braccia -3, occhi +6%, 3 ciglia piegate all'angolo esterno, labbra rosate (#c0485e) anche senza rossetto, sopracciglia sottili e arcuate.
- adattaForma(cfg, forma): cambiando forma si adattano taglio (CAPELLI_UOMO + mappe DA_UOMO_A_DONNA / DA_DONNA_A_UOMO), barba, trucco, orecchini, cappelli/collo/vestiti "da lei". formaDaNome(nome): -a = lei, con eccezioni (Luca, Andrea, Nicola, Mattia… / Alice, Beatrice, Noemi, Kelly…). casuale(seme, forma): se il seme è un nome SENZA numeri usa il sesso del nome; capelli/vestiti/accessori tipici del sesso.
- Voci nuove: mano+colMano, schiena+colSchiena, animale+colAnimale, pittura; NOMI_K = nomi per voce (es. "gatto" cappello/stampa/animale). BLOCCATI.mano = ["trofeo"] (per i trofei). Le cose sulla schiena vanno in fondo alla pila con o.splice(iDietro…).
- Editor in core.js: scheda "Extra" 🎈, Trucco solo per lei (resta se lui ha già trucco), niente barba per lei, LOOK pronti (20) in cima a Vestiti (conLook: cambia vestiti/accessori, non faccia/capelli), "🎲 <scheda> a caso", ↩️ annulla, zoom sul viso per Viso/Trucco/Capelli (classe zoom-viso), tocco sull'avatar = reazioni.
Vedi [[animazioni-senza-lag]].

---

## online-lobby-ospite.md

---
name: online-lobby-ospite
description: "Regola fissa per ogni gioco: prima 'Come giocate?' (telefono/computer/online), poi amici o stanza; online si aspetta nella saletta d'attesa coi personaggi (t.lobby in core, uguale per tutti); chi ha un profilo entra da solo"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 87a8175c-c075-4a67-9954-2d194757ddb6
  modified: 2026-09-30T15:56:53.179Z
---

**Come si entra in un gioco (30 set 2026, chiesto dall'utente):**
1. Prima schermata "Come giocate?" (`schermataModo` in core.js). Mostra i modi del gioco (`g.modi`), e "Online" si aggiunge da solo se il gioco è in `GIOCHI_ONLINE`.
2. Sullo stesso telefono (`amici: true`): prima si aggiungono gli amici (la sala), POI le impostazioni ("non prima").
3. Contro il computer, oppure online: subito le impostazioni. Per l'online il tasto è "🔗 Apri la stanza".
4. La scelta del modo NON deve più stare dentro le impostazioni. Il core passa `aiuti.modo` e ogni `impostazioni()` deve nascondere la sua vecchia scelta e usare quel modo.

**La saletta d'attesa online** è una sola, uguale per tutti i giochi (l'utente: "la facciamo uguale per tutti i giochi"). Si chiama con `t.lobby({ host, codice, pronta, giocatori:[{id,nome,omino,host,tu,bot}], min, puoiDaSolo, puoComincia, vuoti, extra:[nodi], nota, attesa, testoComincia, onComincia, onEsci })`. Contiene:
- la stanza con divano, tappeto, quadro con l'icona del gioco e i personaggi (respirano, salutano, saltano; chi entra dice "Ciao!");
- per l'host: codice e "📤 Manda il link agli amici" (condivisione del telefono, oppure copia);
- per chi aspetta: "✅ Sei dentro!".

Si aggiorna al suo posto, senza lampeggiare. Le cose del gioco (scelta dei posti, squadre, fasi, categorie) vanno in `extra`.

**L'host può SEMPRE cambiare tutte le regole** (l'utente, 30 set 2026: "nell'asta posso solo scegliere la categoria"). Nella saletta l'host ha il tasto "⚙️ Regole". Apre un foglio con lo STESSO riquadro di impostazioni di prima (`opts.regole`, con lo stato com'era). Compare solo se ci sono scelte visibili (`haRegole`).
- Dopo una modifica il core chiama `t.onRegole(imp)`: il gioco rilegge le impostazioni e ritrasmette la lobby.
- Fatto in Asta, Horto, Nomi Cose e Città, Palla a Pendolo e Linea del tempo. Gli altri online non hanno regole da cambiare online.
- L'Asta cambia anche modalità (temi ↔ fantacalcio) con `PONTE`: stessa stanza, gli amici rientrano da soli nel nuovo motore.

**Ogni gioco online, anche quelli futuri, deve:**
- dichiarare `modi` (solo i modi locali);
- rispettare `aiuti.modo`;
- far viaggiare l'avatar (`omino: t.mioOmino(nome)` nel join, e dentro i dati della lobby);
- disegnare la lobby con `t.lobby`;
- se ha impostazioni lette all'avvio, implementare `t.onRegole`;
- a fine partita chiamare `t.risultato([{ nome, pos? }])` (serve al torneo online, vedi [[party-hub-lobby]]).

Già fatto in tutti i 14 giochi online.

**Chi entra da invito** e ha un profilo entra da solo col suo nome (`t.nomeProfilo()`); il campo nome resta solo a chi non ha un profilo. Nei giochi in tempo reale (es. Horto) il conto alla rovescia lo fa ogni telefono per conto suo.

Vedi [[progetto-sg]], [[party-hub-lobby]], [[niente-lampeggio-render]].

---

## party-hub-lobby.md

---
name: party-hub-lobby
description: "Funzione pianificata \"lobby dalla home\" (party hub online) per SG, con design bloccato"
metadata: 
  node_type: memory
  type: project
  originSessionId: 87a8175c-c075-4a67-9954-2d194757ddb6
  modified: 2026-10-01T18:10:43.673Z
---

L'utente vuole una **lobby dalla home** ("party hub") per SG: l'host crea una sala online una volta sola, gli amici entrano una volta con codice/nome, e poi l'host lancia un gioco dopo l'altro tenendo lo stesso gruppo (come il Torneo ma online, ognuno dal suo telefono).

**Design bloccato (deciso il 17 set 2026):**
- Avvio dei giochi: **automatico** — quando l'host sceglie un gioco, il telefono di tutti apre da solo quel gioco ed entra, zero click per gli amici.
- Controllo: **solo l'host** decide a cosa si gioca; gli altri seguono.
- A fine gioco: **tutti tornano nella stessa sala**, l'host rilancia.

**Note tecniche (da [[progetto-sg]]):** SGNet (js/net.js) usa MQTT hivemq; ogni stanza = codice 4 lettere con canali `code/stato` (host→ospiti, retained), `code/azioni` (ospiti→host), `code/meta` (retained: id gioco). Approccio previsto: connessione di **sala persistente** separata (codice P) in parallelo ai giochi; l'host lancia il gioco (nuova stanza C), comunica C alla sala, gli ospiti aprono il gioco come ospite(C) tenendo viva la connessione di sala per tornare dopo. Ogni telefono regge 2 connessioni mqtt. Serve integrazione a livello app (core.js) per tornare alla sala dopo `t.fine`/`t.esci` del gioco. Va provato con telefoni veri.

Stato: **implementato e pubblicato** (17 set 2026). In core.js: `creaSala`/`disegnaSalaHost`/`salaScegliGioco`/`salaLancia` (host), `salaOspite`/`disegnaSalaOspite`/`salaLanciaOspite` (ospite), `avviaPartita(..., salaCtx)`, `schermataPreGioco(g,{sala:true})`, `GIOCHI_ONLINE`, tasto "👥 Sala online" in home, link `#sala=CODE`. In net.js: `SGNet.nuovoCodice()` + `SGNet._forza` (codice stanza imposto). Provato a 2 schede: crea sala → ospite entra da link → host sceglie gioco → ospite entra da solo → tutti tornano in sala → secondo gioco ok.

**30 set 2026: torneo online con un link solo** (l'utente: "quando starto il torneino voglio un unico link per fare tutti i giochi").
- Torneo → "Come giocate?": su questo telefono (il torneo di prima) oppure Online, che è `creaSala({ torneo: true })`.
- La sala (normale e torneo) ora usa la saletta dei giochi (`saletta(gSala(..))` con `o.link` = `#sala=CODE`), coi personaggi degli amici.
- I giochi a fine partita chiamano `t.risultato(classifica)`. La sala somma i punti con `puntiDaClassifica`, e `pos` fa i pari merito.
- `sala.torneo` viaggia nel messaggio della sala: gli ospiti vedono la classifica. "Chiudi e premia" mette `finito` e tutti vedono il podio.
- Tutti i 14 giochi online dicono il risultato: Black Jack quando l'host lascia il tavolo (chi ha guadagnato più fiches), Nomi Cose e Città con `t.fine`.

**1 ott 2026: torneo a eliminazione** per i giochi a due (`GIOCHI_ELIMINAZIONE`: tris, drop4, navale, scopa). Il modo "Torneo a eliminazione" sta in "Come giocate?" e apre `creaSala({ eliminazione: id })`. Massimo 10 (`MAX_ELIM`).
- **Gironi scelti** (richiesta dell'utente): tutti entrano in panchina; ognuno, host compreso, tocca uno dei 5 gironi da 2 posti (`E.gironi` id→n, ospiti mandano `{t:"girone", g}`). Alla partenza (`gironiElim`): chi è in panchina va a caso nei posti liberi (prima accanto a chi è solo), due soli si sfidano, uno solo gioca col bot medio; oltre 10 si guarda.
- `sala.elim.turni`: partite `{k, girone, a, b, stanza, vince}`. Il girone 1 sfida il 2 al turno dopo, ecc. Nei turni dopo chi resta solo passa il turno (b = null). Nessuno ha due turni facili (`favoritoElim`).
- Ogni partita è una stanza: `a` la apre col codice imposto, `b` entra. A fine partita `a` (o chi gioca col bot) manda `{t:"esito", k, vinto}` tramite `t.risultato`; il pari si rigioca. L'host può decidere a mano.
- **Guardare**: chi non gioca tocca "👀 Guarda" e il gioco si apre con `linkParams.guarda` (si collega senza join, non tocca). La partita col bot si trasmette con `t.trasmetti` nella sua stanza (anche il bot ha `stanza`). Navale manda una "vista" pubblica coi soli colpi (mai le navi); Scopa si guarda alle spalle di un giocatore.
- **Tabellone sempre**: tasto 🏆 su ogni schermata di partita (`ctx.tabellone` → `tastoTabellone`), apre un foglio che si aggiorna da solo.
- **Sicurezza**: una partita lasciata non può più disegnare/uscire/dare risultati (`partitaN`, `viva()` in avviaPartita). A partita decisa chi aveva la stanza la chiude 2,5 s dopo (`tornaTabelloneElim(S, ritardo)`), così gli altri non vedono "collegamento perso".

**Collegamento robusto (30 set 2026, dopo prove vere con amici su iPhone):** in js/net.js:
- chi entra ripete "join" ogni 2 s finché il suo id non compare nei messaggi dell'host (per questo i giochi a due mettono l'id dell'avversario nel vm);
- chi sparisce all'improvviso (will `__leave`) è tolto solo dopo 20 s, e riconnettendosi ripete il join;
- l'host sparito (will `__hostgone`) è aspettato 45 s; `__hostqui` quando torna;
- l'uscita voluta (`voluto: 1`) è immediata;
- `SGNet.chiudiGiochi()` chiude le stanze dei giochi (non la sala, `tieni`) quando si cambia gioco, si torna in sala o alla home.

Il link della sala e del torneo funziona anche senza profilo: basta il nome (`nomeOspiteSala`), che i giochi usano da soli (`t.nomeProfilo`).

Nello studio i concorrenti si toccano con una zona `.tap` (sagoma più banco), gestita con pointerdown/pointerup: su iPhone il click si perdeva.

Da provare ancora con telefoni veri.

---

## poker-piano.md

---
name: poker-piano
description: "Poker con carte francesi (Texas Hold'em + all'italiana, fiches del Black Jack): scritto e provato il 2 ott 2026 in js/games/poker.js, sul ramo lavori-in-corso, non ancora pubblicato"
metadata:
  node_type: memory
  type: project
  originSessionId: 87a8175c-c075-4a67-9954-2d194757ddb6
  modified: 2026-10-02T16:23:15.708Z
---

Il 1 ott 2026 l'utente ha chiesto il **Poker con le carte francesi**. Scelte sue: **tutte e due le varianti** (Texas Hold'em e Poker all'italiana) e **le stesse fiches del Black Jack** (un portafoglio solo, `fiches.blackjack`, bonus 300 ogni 2 ore).

**Stato al 2 ott 2026:** scritto tutto in `js/games/poker.js` (un gioco "Poker" con la variante nelle impostazioni) e provato: punti delle mani, centinaia di mani simulate tra bot (fiches sempre giuste, piatti laterali), partita contro il computer, cambio delle carte, online con amici finti (carte private, chi esce, classifica), schermo dell'ospite. Esportato `window.__BJ.riquadroBonus` da blackjack.js. Sul ramo `lavori-in-corso`, NON ancora pubblicato. Da provare con telefoni veri.

**Why:** gioco di carte da casinò che riusa carte francesi, fiches e tavolo del [[profili-cloud-firebase]] Black Jack.

**How to apply (piano già deciso, non richiedere):**
- un gioco "Poker" (id `poker`, file `js/games/poker.js`, da mettere in `GIOCHI_ONLINE`, `CAT_GIOCO` "carte" e in index.html); variante scelta nelle impostazioni (chip "Texas Hold'em" / "All'italiana"); partire dal modello `.agents/skills/nuovo-gioco/modello-gioco-online.js`.
- modi: contro il computer (tu + bot, il primo bot si chiama Matt) e online (amici + bot aggiunti dall'host in saletta). Hold'em 2–10 giocatori, italiana 2–6.
- fiches: ci si siede con al massimo 1.000; nel profilo si salva sempre "fiches fuori dal tavolo + fiches sul tavolo" (`SGNube.salvaFiches("blackjack", …)` dopo ogni cambio); senza profilo 1.000 finte non salvate; senza fiches: riquadro bonus del Black Jack (da esportare come `window.__BJ.riquadroBonus`). Chi finisce le fiches può rientrare.
- Hold'em No-Limit: bui 10/20, piatti laterali, online 30 s per decidere (poi passa o lascia da solo).
- italiana: invito 10 a testa, puntata minima 20, mazzo corto dal (11 − giocatori) in su, il colore batte il full, scala minima A-7-8-9-10, a parità decide il seme (cuori, quadri, fiori, picche), puntata → cambio fino a 4 carte → puntata → confronto.
- carte coperte degli altri: mai nella foto (vm) ma con `inviaVeloce` + `to`; carte disegnate con `window.__BJ.cartaHTML`.
- bot: Hold'em con probabilità di vittoria simulata (~120 mani a caso) e quota del piatto; italiana per tipo di mano; al cambio tiene coppie/tris e 4 carte a colore o scala.
- tavolo sul telefono senza scorrere: gli altri ad arco intorno al feltro (la puntata scritta nel posto, non sul feltro), carte comuni al centro, le mie carte e i tasti in basso.
- online, a fine partita (tasto dell'host) classifica per fiches guadagnate e `t.risultato`.

---

## profili-cloud-firebase.md

---
name: profili-cloud-firebase
description: I profili (nome+password) e i dati per-giocatore stanno su Firebase; le fiches del Black Jack si portano avanti tra le partite
metadata: 
  node_type: memory
  type: project
  originSessionId: 87a8175c-c075-4a67-9954-2d194757ddb6
  modified: 2026-09-30T15:22:46.474Z
---

I profili dell'app sono su **Firebase** (progetto `speed-game-33c5b`, piano gratuito Spark), non più solo in localStorage. Deciso il 19 set 2026 con l'utente (opzione "cloud con login vero").

- **Auth**: Email/Password. L'utente inserisce solo NOME + PASSWORD; l'email vera è finta (`nome@sg.local`, sanitizzato). Password min 6 caratteri (requisito Firebase).
- **Database**: Firestore, collezione `profili`, doc per `uid` con `{ uid, nome, emoji, fiches: { blackjack: N }, stat: {}, creato }`.
- **Regole Firestore** (già pubblicate): ogni utente legge/scrive solo il proprio doc — `match /profili/{uid} { allow read, write: if request.auth != null && request.auth.uid == uid; }`.
- Codice: `js/nube.js` espone `window.SGNube` (disponibile/pronto/profilo/onCambio/crea/accedi/esci/fiches/salvaFiches/incrStat). SDK compat via gstatic 10.12.2, aggiunto in `index.html` e nel build (`costruisci-versione-online.sh`) prima di core.js. La `apiKey` è pubblica per progetto (sicurezza nelle regole).
- `core.js`: `profiloAttivo()` legge SGNube se disponibile; `schermataAccessoCloud`/`schermataCreaCloud` per login/creazione; `avviaApp` aspetta `SGNube.pronto()` (login automatico) mostrando `schermataCaricamento`. Fallback localStorage se Firebase non c'è.
- **Black Jack** (`js/games/blackjack.js`): `creaMotore(nomi, mischia, fichesIniz)`. Locale/host/ospite partono dalle fiches del profilo (se <10 si riparte da 500) e le salvano a fine mano via `drv.onFineMano` → `SGNube.salvaFiches("blackjack", …)`. L'ospite online loggato entra col profilo senza reinserire il nome e manda le fiches nel join.
- Bonus gratis (300 ogni 2 ore, `riquadroBonus`): l'utente vuole che si possa ritirare anche da ospite entrato da invito (30 set 2026). Il riquadro sta quindi anche nella saletta online (`extra`), sia per l'host che per l'ospite. Dopo il ritiro l'ospite manda `{t:"fiches"}` all'host, e se era "di prova" (a zero) diventa vero.
- Profili di test creati durante il setup: `PakyTest`/`paky123`, `ProvaCloud` (orfano, senza doc). La modalità test del DB scade ~30 giorni dopo la creazione ma le regole vere sono già pubblicate, quindi non serve rinnovarla.
- Prossimi passi possibili: statistiche (mani vinte, record fiches) con `incrStat`; pulsante "ricarica fiches"; mostrare le fiches nel profilo dalla home. Vedi [[party-hub-lobby]] per l'online.

**Classifica e amici (26 set):**
- Raccolta `pubblici/{uid}`: la "scheda" leggibile da tutti con nome, chiave (il nome ripulito come in emailDa), omino, emoji, trofei, liv, giochi. La scrive `SGNube.pubblica`, chiamata da controllaTrofei tramite pubblicaTrofei; se non è cambiato nulla non riscrive.
- La classifica generale usa `classificaGenerale` (orderBy trofei, primi 100); se non ci sei, compari in fondo dopo "…".
- `profili.amici` = lista di uid, modificata solo dal proprietario (mettiAmico/levaAmico).
- Amicizia a DUE VIE con la raccolta `richieste/{da_a}` {da, a, daNome, aNome, daOmino, stato}:
  - "attesa": accetta = mettiAmico + stato "accettata"; rifiuta = cancella;
  - "accettata": chi l'aveva mandata, quando legge le richieste, fa mettiAmico e la cancella;
  - "rimosso": togliAmico avvisa l'altro, che fa levaAmico.
  - Tutto questo lo gestisce `SGNube.richieste()`.
- core.js: schermataAmici (schede generale/amici/richieste), schermataTrofeiAmico, aggiornaRichieste (pallino su .home-amici).
- Regole Firestore da pubblicare (lo fa l'utente dalla console): pubblici (leggono tutti i loggati, scrive il proprietario) + richieste (leggono e cancellano solo da/a; crea solo se da == me; update senza cambiare da/a).

---

## progetto-sg.md

---
name: progetto-sg
description: "Progetto SG — raccolta di party game web, cartella Desktop\\SG, regola \"un gioco per volta\""
metadata: 
  node_type: memory
  type: project
  originSessionId: eef02d5a-f729-428f-80e2-a862464ee230
  modified: 2026-09-09T11:19:46.270Z
---

**SG** è una web-app raccolta di TANTI party game (obiettivo 20-30), da aprire dal browser del telefono senza installare nulla. Cartella: `C:\Users\joetr\Desktop\SG` (progetto locale). Si apre col doppio clic su `index.html`.

Regola ferrea: **un gioco alla volta, finito bene e giocato davvero**, prima del prossimo. Idee nuove → `IDEE.md`, non cantieri paralleli.

Primo gioco: **La linea del tempo** (`js/games/timeline.js`), completo. ~130 avvenimenti verificati, divisi in **5 categorie** (Storia, Invenzioni e scoperte, Calcio, Rap italiano, Cinema), un file per categoria: `data/eventi-*.js`. L'host sceglie categorie + carte a testa e crea un **link già impostato** (impostazioni nell'hash dell'URL, es. `#gioco=timeline&cat=storia,calcio&carte=5`) da mandare agli amici. Tasto **Novità** in home = diario aggiornamenti (`data/novita.js` + `CHANGELOG.md`).

Ossatura comune in `js/core.js`; ogni gioco si "innesta" via `SG.registra(...)`; contratto in `docs/COME-SI-AGGIUNGE-UN-GIOCO.md`. Ambiente: [[ambiente-macchina-joetr]].

**Due modalità (scelte dall'host):** «un telefono solo» (pass-and-play) e «ognuno dal suo telefono» (online). L'online è **host-authoritative**: l'host tiene l'unico `stato`, calcola i turni e trasmette un view-model; gli ospiti disegnano e mandano intenti. Collegamento tramite **relay MQTT pubblico** (broker HiveMQ `wss://broker.hivemq.com:8884/mqtt`, nessun account/server), wrapper in `js/net.js` (`SGNet.ospita`/`entra`, topic `seratagiochi/v1/<CODICE>/stato` retained + `/azioni`). Scelto il relay al posto del P2P/PeerJS perché il collegamento diretto tra browser si blocca su molte reti cellulari (NAT). Testato a 2 telefoni simulati end-to-end.

**Stato al 9 set 2026:** due giochi. (1) *La linea del tempo* — 804 avvenimenti in 5 categorie, due modalità (un telefono / online MQTT con voti). (2) *L'Asta* — asta a 4 round, 3 temi da 184 carte (zombie, pizza, panino), per ora solo "un telefono sul tavolo", con memoria anti-ripetizione delle carte. In più: **profili** (crea/accedi, salvati in locale) e **La Sala** (il gruppo resta tra una partita e l'altra: rigioca / cambia gioco / modifica giocatori); tasti **Proposte** e **Bug** che scrivono ai moduli Netlify (li legge solo il proprietario, scheda "Forms" del sito).

**PROSSIMO PASSO concordato (9 set 2026):** rendere online anche *L'Asta*, poi generalizzare il meccanismo online a tutti i giochi. Piano già scritto in `docs/PROSSIMO-PASSO-ASTA-ONLINE.md`: leggerlo prima di iniziare. L'utente era quasi a fine crediti, quindi si è deciso di NON iniziare a metà.

**Web app da pubblicare (NON artifact):** la versione condivisibile è l'unico file `dist/serata-giochi.html` (generato da `costruisci-versione-online.sh`, include PeerJS via cdnjs). L'utente vuole una **web app con link condivisibile**, da mettere su un host statico normale (Netlify Drop / tiiny.host) — l'online NON funziona dentro un artifact claude.ai (CSP blocca il broker) né da file locale. Istruzioni: `docs/METTERE-ONLINE.md`. (C'era un vecchio artifact di anteprima, abbandonato per l'app vera.)

---

## scalinata-bot-matt.md

---
name: scalinata-bot-matt
description: "Nel gioco La Scalinata (e in generale coi bot), il primo bot va sempre chiamato \"Matt\""
metadata: 
  node_type: memory
  type: feedback
  originSessionId: eef02d5a-f729-428f-80e2-a862464ee230
  modified: 2026-09-11T09:27:28.614Z
---

Nella Scalinata online (e quando si riempie una lobby con bot per raggiungere i 4 giocatori), il **primo bot** deve chiamarsi sempre **"Matt"**.

**Why:** preferenza esplicita dell'utente (nome ricorrente che gli piace).
**How to apply:** quando genero nomi bot, il primo dell'elenco è "Matt"; gli altri a seguire con altri nomi. Vale per [[progetto-sg]].

---

## scarabocchio.md

---
name: scarabocchio
description: "Il gioco \"disegna e indovina\" (la versione nostra di Pinturillo): scelte fatte, solo online, come viaggia il disegno"
metadata:
  node_type: memory
  type: project
  originSessionId: 87a8175c-c075-4a67-9954-2d194757ddb6
  modified: 2026-09-30T20:37:15.572Z
---

Il 30 set 2026 l'utente ha incollato la scheda di Gemini per "la nostra versione di Pinturillo". La scheda era tagliata dopo "Cosa mi serve da te ora:"; ho fatto il gioco completo.

Il gioco si chiama **Scarabocchio** (js/games/scarabocchio.js, id "scarabocchio", categoria Festa). Il nome è nostro perché il sito è pubblico: se l'utente vuole "Pinturillo", si cambia solo `nome`.

**Cambiato su richiesta (30 set, dopo la prima prova):**
- chi indovina prende tanti punti quanti secondi mancano (chi disegna resta a 25 per ognuno);
- 12 colori più la gomma, 3 grandezze anche per la gomma;
- lavagna 1000x1200, un po' più alta che larga, per averla più grande sul telefono;
- con la tastiera aperta spariscono le figurine e la chat va al minimo.
- secchiello: il disegno vero sta su una tela fissa 1000x1200 uguale per tutti (lo schermo ne mostra una copia), così il riempimento viene identico su ogni telefono. Il riempimento viaggia come un tratto di un punto solo con `f: 1`. L'icona è un SVG, perché l'emoji 🪣 sui telefoni vecchi non si vede.

**Scelte aggiunte alla scheda:**
- chi disegna sceglie 1 parola su 3 (con "parole difficili": 2 facili e 1 difficile);
- col tempo si scoprono alcune lettere, mai tutte;
- "ci sei quasi" arriva solo a chi l'ha scritto;
- chi disegna e chi ha già indovinato non possono scrivere in chat;
- oltre ai colori ci sono gomma e "annulla".

**Solo online:** la parola la deve vedere solo chi disegna. Il gioco ha `modi: []` e `soloOnline: true`. `soloOnline` lo toglie dalle liste "sullo stesso telefono" (torneo locale, "Cambia gioco"). Usare lo stesso flag per futuri giochi solo online.

**Come viaggia il disegno:**
- Lavagna logica 1000x1200.
- Chi disegna manda pezzi di tratto ogni 70 ms; l'host li rimanda a tutti con `inviaVeloce`, numerati per turno (`n`, `q`).
- Chi perde un pezzo, o entra a partita iniziata, chiede `sync` e riceve il disegno intero più gli avatar.
- Le foto della partita (vm) non portano gli avatar, per non pesare.

Vedi [[online-lobby-ospite]], [[party-hub-lobby]].

---

## schermo-senza-scorrere.md

---
name: schermo-senza-scorrere
description: "Regole di spazio dell'utente — nei giochi niente scritta del gioco in alto, niente scorrere se non c'è testo da leggere, priorità al tavolo"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 87a8175c-c075-4a67-9954-2d194757ddb6
  modified: 2026-09-25T01:45:03.820Z
---

Nei giochi l'utente vuole il MASSIMO SPAZIO: niente titolo col nome del gioco in alto (fatto nel wrapper t.schermata in core.js: se il titolo contiene il nome del gioco viene tolto, resta la freccia "indietro" piccola, classe .senza-testa). Non si deve MAI dover scorrere per continuare a giocare: si scorre solo se c'è testo da leggere (26 set 2026). Nei giochi a tavolo: "priorità al bel tavolo", parte sotto compatta, niente elementi inutili (es. il mazzo del Black Jack tolto), niente nomi ripetuti se il turno è già evidente.

**Why:** gioca dal telefono (app installata, Android); tutto deve stare in una schermata.

**How to apply:** ogni nuova schermata di gioco va provata a misura telefono (es. 412x800) controllando che non sfori. L'altezza dello schermo la misura core.js (visualViewport) nella variabile CSS --alt, usata da body/#app/.schermata: dopo un "ricarica" 100dvh era sbagliata e tornava lo scorrere. NON rimettere viewport-fit=cover nel meta viewport: con l'app installata Android disegna sotto la barra dei tasti e i pulsanti in fondo spariscono. Vedi [[omini-avatar]].

Vale anche per l'editor avatar (26 set, commit a85e4e6, "IMPEGNATI RENDILA COMODISSIMA"). La schermata ha classe `.editor-avatar` e altezza fissa `--alt`:
- in alto il palco, sotto 6 schede grandi con icone (3 per riga);
- nel mezzo scorre solo `.omino-pannello`;
- in fondo "A caso" e "Salva", sempre visibili.
L'utente vuole scritte grandi (etichette ~1.1rem, nomi delle scelte ~.95rem) che vanno a capo, mai rimpicciolite né tagliate coi puntini. Niente etichette in MAIUSCOLO. Stesso schema per altri editor o elenchi lunghi con un tasto di conferma.
AGGIORNATO (commit 6c3f3b2). L'utente ha visto la versione sopra sul telefono: "piccolo lo spazio per scorrere, DEVE ESSERE COMODO". Ora:
- niente titolo e niente piede;
- sul palco ci sono indietro ‹ in alto a sinistra, e "🎲 A caso" e "✅ Salva" in basso ai lati della targa col nome;
- le 6 schede stanno su UNA riga, con l'icona sopra e il nome piccolo.
Priorità allo spazio in cui scorrono le scelte.
AGGIORNATO v3 (commit 487543b), dopo un altro screenshot dell'utente. Sul palco:
- avatar più grande, niente nome e niente stella;
- "✅ Salva" piccolo in alto a destra, stile app;
- dado tondo 🎲 in basso a sinistra, puntini sotto i piedi.
Il PRINCIPALE è quello sul palco quando esci:
- con Salva si salva tutto;
- con ‹ indietro si perdono le modifiche, ma se hai cambiato personaggio quello diventa il principale.

Scopa (commit 137cc6d). L'utente: "sfruttiamo tutto il cazzo di spazio". Come è fatta ora:
- l'altezza della stanza scH parte da --alt;
- dopo il montaggio renderScopa misura lo spazio che avanza o manca e si ridisegna subito una volta (scCorr, una volta per misura di schermo), prima che lo schermo venga disegnato;
- carte in tavola: prova tutte le disposizioni per numero di file, parte da una fila sola e cambia solo se le carte vengono almeno del 12% più grandi (fino a 8 carte restano larghe ~87px su un telefono da 412);
- l'aiuto per la presa sta in sovrimpressione sul tavolo (.sc-aiuto);
- `.piede:empty` non ha margine (vale per tutta l'app).
Stesso metodo per Scopa 2v2 e Scopone se lo chiede.
AGGIORNATO (commit da5933f), regola dell'utente: le carte in tavola NON devono cambiare grandezza in base a quante sono ("fa schifo da vedere").
- La grandezza è fissa: quella con cui 6 carte stanno comode (misuraPer(6)).
- Si rimpiccioliscono solo da 7 in su.
- Le file sono bilanciate: 5 = 3+2, 6 = 3+3.
Vale anche per altri giochi di carte.
AGGIORNATO (commit 9808fe0). L'utente: "fa schifo che le carte si teletrasportano".
- POSTI FISSI: scSlot (id carta -> posto) su una griglia fissa di 3x2 posti; le file restano anche vuote, così il tavolo non si sposta.
- Le carte restano ferme finché non vengono prese; il posto liberato resta vuoto; la carta nuova va nel primo posto libero.
- Solo con 7 o più carte i posti crescono.
Applicare la stessa regola a ogni gioco con carte in tavola (Scopa 2v2, Scopone…).
AGGIORNATO (commit 4fe4e32), su richiesta dell'utente:
- niente mazzo sul tavolo, 8 posti fissi (4x2), la grandezza cambia solo da 9 carte;
- distribuzione animata con la Web Animations API (proprietà translate/scale, fill backwards): prima le carte nuove in tavola una alla volta, poi mano mia e dorsi dell'avversario alternati (me, lui, me, lui…);
- C._dealFino fa aspettare il bot (seTuraBot).
AGGIORNATO (commit 1b4f607). L'utente vuole i giochi DA BORDO A BORDO ("non dà un senso di completezza"):
- classe .sc-piena sulla schermata: padding 0, scena senza angoli arrotondati, mensola fino in fondo;
- punteggio e musica dentro la stanza (.sc-testata in alto, a sinistra lascia posto al tasto indietro);
- compagno in verde, avversari in rosso.
Usare lo stesso stile negli altri giochi da tavolo quando li tocco.

---

## skill-installate.md

---
name: skill-installate
description: Skill aggiunte per l'utente (frontend-design ufficiale) e quelle scartate dopo averle lette (game-dev di Sudhanshu5669)
metadata:
  type: reference
---

25 set 2026: installata la skill ufficiale Anthropic **frontend-design** in `~/.claude/skills/frontend-design/`, presa da github.com/anthropics/claude-plugins-official, plugins/frontend-design. Serve per la grafica di schermate e menu.
Letta e SCARTATA **Html5-Gamedev-Skill** (github.com/Sudhanshu5669/Html5-Gamedev-Skill). Non contiene nulla di pericoloso, ma non fa per questo progetto:
- fa un'intervista con tante domande;
- usa Vite/npm, e sulla macchina non c'è Node (vedi [[ambiente-macchina-joetr]]);
- crea GAME_SPEC.md e SYSTEMS.md e fa un commit per ogni sistema.
Firebase MCP scartato: serve Node e darebbe accesso ai dati veri dei giocatori.
**How to apply:** prima di installare skill di privati, leggerle tutte; le giganti raccolte "awesome" non servono a questo progetto.

---

## trofei-sistema.md

---
name: trofei-sistema
description: "Come sono fatti i trofei PlayStation-style (lista in core.js, contatori nei giochi) e come si aggiungono quelli che l'utente manda da Gemini"
metadata:
  node_type: memory
  type: project
  originSessionId: 87a8175c-c075-4a67-9954-2d194757ddb6
  modified: 2026-09-30T15:08:05.226Z
---

Trofei stile PlayStation: Bronzo/Argento/Oro/Diamante + Platino automatico (quando prendi tutti gli altri del gioco). Lista unica `TROFEI` in js/core.js: `{ gioco, livello, icona, nome, desc, stat, meta }` = sbloccato quando `stat.<gioco>.<stat> >= meta` nel profilo cloud (`valoreStat`; `recordFiches` usa max(record, saldo)). Schermata "Trofei" (in home) = elenco di TUTTI i giochi → pagina del gioco. Avviso "Trofeo sbloccato!" con suono/vibrazione: `controllaTrofei` avvolge `SGNube.salvaProgressi`/`salvaFiches` + `onCambio` (al caricamento non avvisa).

**Contatori** (un solo `SGNube.salvaProgressi(null, gioco, incrementi, record, valoriDaImpostare)` a fine mano/partita; `sets` serve per le serie "di fila" che continuano tra partite, es. `serieOra`). Contano SOLO il giocatore col profilo: nei giochi "un telefono" quello col nome del profilo; negli online/bot il giocatore di quel telefono (vm.io). Fatti (24 set 2026): Black Jack (28), Linea del tempo (35), Impostore (17), Scopa (24), Scopa 2vs2 (19), Hockey (20), Scopone (17), Scalinata (17). Scalinata: bot resi furbi (sceltaBot: stima abitudini + blocco + un bot "guardia" contro chi è prevedibile); sempre-5 ora vince ~4%. Effetto: Ascensore Privato/Il Fantasma quasi impossibili contro i bot (~1 su 3000), fattibili online con amici — scelta voluta, non "aggiustarla" togliendo la guardia (senza guardia tutti i bot bloccano e diventa 0%).

**30 set 2026: Tris (17) e Drop 4 (17), dalle liste dell'utente.**
- I contatori stanno in `trofeiTris` / `trofeiDrop`. Si chiamano dal disegno del campo, con una chiave per non contare due volte la stessa fine partita.
- Chi conta:
  - contro il bot e online: il giocatore di questo telefono (`cb.mio`);
  - in due sullo stesso telefono: chi ha il nome del profilo.
- Tris: il livello più forte era "Impossibile" (minimax perfetto, mai battuto), quindi i trofei "batti il Difficile" non si potevano prendere. Aggiunto un livello "Difficile": vince se può, sennò nel 15% delle mosse gioca a caso. Simulato: un giocatore normale lo batte circa il 19% delle volte, contro il Medio circa il 36%.
- "Vinci con solo 3 simboli / 4 pedine" non vale contro il bot Facile: gioca a caso, e il trofeo diventava banale.
- Numeri abbassati:
  - vittorie online: da 30 a 20;
  - Grafomane: da 300 a 200;
  - Pioggia di gettoni: da 500 a 300.

**Flusso con l'utente:** manda le liste fatte da Gemini (testo incollato in chat, non PDF/foto). Io: 1) leggo il gioco e segnalo i trofei su meccaniche che non esistono (es. "anno esatto", "eliminazione") proponendo alternative; 2) abbasso i numeri troppo lunghi per un party game; 3) per giochi con motore simulabile (Scopa) faccio girare centinaia di partite sul motore vero per confrontare contatore vs motore E misurare le frequenze → ritaro i livelli. Attenzione nei test: passare la funzione che mescola il mazzo, e il profilo finto non ricorda le serie tra partite. Vedi [[profili-cloud-firebase]], [[hockey-bot-taratura]].

---

## vibrazione-solo-selezione.md

---
name: vibrazione-solo-selezione
description: "La vibrazione dei tasti deve scattare solo quando selezioni (click), mai quando appoggi il dito per scorrere"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 87a8175c-c075-4a67-9954-2d194757ddb6
  modified: 2026-09-24T18:39:27.607Z
---

La vibrazione (haptic) deve partire SOLO quando l'utente seleziona qualcosa, ovunque nell'app (menu e giochi). Mai su pointerdown/touchstart.

**Why:** l'utente scorre le pagine appoggiando il dito sui pulsanti; la vibrazione al semplice tocco "da fastidio" (24 set 2026).

**How to apply:** l'haptic globale in core.js (installaVibrazione) ascolta "click". Se aggiungi vibrazioni in un gioco, mettile nell'azione confermata (click/scelta), non all'inizio del tocco.

---

## Mini-server per provare il gioco nel browser (PowerShell, porta 8972; serve se sul computer non ci sono Python o Node)

Salvalo fuori dal progetto (es. nella cartella temporanea), avvialo in background con PowerShell e apri http://localhost:8972/. `$root` = la cartella del progetto su quel computer; `$shots` = dove salvare le foto dello schermo mandate dalla pagina (facoltativo).

```powershell
$root = Join-Path $env:USERPROFILE "Desktop\SG"
$shots = Join-Path $env:TEMP "sg-foto"; New-Item -ItemType Directory -Force $shots | Out-Null
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8972/")
$listener.Start()
Write-Host "SERVER UP on 8972"
$mime = @{ ".html"="text/html"; ".js"="application/javascript"; ".css"="text/css"; ".json"="application/json"; ".svg"="image/svg+xml"; ".png"="image/png"; ".jpg"="image/jpeg" }
while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $path = $ctx.Request.Url.LocalPath
    if ($ctx.Request.HttpMethod -eq "POST" -and $path -eq "/salva") {
      $nome = $ctx.Request.QueryString["nome"] -replace "[^a-zA-Z0-9_\-\.]", ""
      $reader = New-Object System.IO.StreamReader($ctx.Request.InputStream)
      $b64 = $reader.ReadToEnd()
      $b64 = $b64 -replace "^data:image/png;base64,", ""
      [System.IO.File]::WriteAllBytes((Join-Path $shots $nome), [Convert]::FromBase64String($b64))
      $ctx.Response.StatusCode = 200
      $ctx.Response.Close()
      continue
    }
    if ($path -eq "/") { $path = "/index.html" }
    $file = Join-Path $root ($path -replace "/","\")
    if (Test-Path $file -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($file)
      $ct = $mime[$ext]; if (-not $ct) { $ct = "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ctx.Response.ContentType = $ct
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
    }
    $ctx.Response.Close()
  } catch {}
}

```

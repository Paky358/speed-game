# Avatar «illustrati» (strada A) — istruzioni per gli aiutanti che disegnano i pezzi

Progetto: SPeeD GAME, party game da telefono. Gli avatar oggi sono «Mii»; stiamo rifacendo il disegno in stile
**illustrazione realistica** (proporzioni vere, occhi/naso/bocca veri, capelli a ciocche, luce morbida e volumi
«simil 3D»: luce da sinistra, ombra a destra, ombre morbide dove le cose si toccano). Il proprietario ha scelto
questa strada guardando `D:\SG-avatar-strade\foto\strada-A.png`: **guardala prima di cominciare**. Lo stato attuale
del corpo è in `D:\SG-avatar-a-lavoro\f2.png`, `f3.png`, `f4.png`.

## Dove sta il codice
- Motore: `D:\SG-avatar-a\js\omino-a.js` (NON modificarlo: è del capo). Leggilo tutto per capire gli aiuti `K`
  e per vedere come sono fatti i pezzi di base già pronti in fondo al file: bocche `neutro`/`sorriso`, barba `accenno`,
  capelli `corti` e `lunghi`, vestiti `maglietta`/`lunga` (funzione `maglia`), `jeans`/`pantaloni` (funzione `jeans`),
  scarpe `sneakers` (+ `A.duePiedi`), cappello `cappellino`. **I tuoi pezzi devono sembrare fatti dalla stessa mano.**
- Le voci e i nomi (con le scritte che vede chi gioca) sono in `D:\SG-avatar-a\js\omino.js`, in alto (`OPZ`, `NOMI`).
  Il disegno vecchio di ogni voce è nello stesso file (cerca il nome tra virgolette): serve a capire cos'è il pezzo
  (es. "ancora" è una barba, "micio" una bocca a :3), NON a copiarne lo stile.
- **Il tuo file**: `D:\SG-avatar-a-lavoro\pezzi\<il-tuo-gruppo>.js` (te lo dice il compito). Scrivi SOLO lì e in file
  nuovi tuoi nella cartella `D:\SG-avatar-a-lavoro\aiutanti\<il-tuo-gruppo>\` (pagine di prova, foto). Non toccare nient'altro.
  Il file comincia con `(function () { var A = window.SGOminoA; … })();` e registra i pezzi con
  `A.pezzo("capelli" | "cappelli" | "capo" | "sotto" | "scarpe" | "bocca" | "barba" | "segno", "nome-voce", function (K) { … })`.
  Il nome della voce è esattamente quello di `OPZ` (es. `"riccicorti"`, `"gonnapieghe"`, `"baffipizzetto"`).

## Coordinate
- Il mondo del corpo è 400 × 1000 (centro x = 200 = `K.C`, piedi/suola a y ≈ 999). Livelli in `K.Y`
  (collo 246, spalla 268, delt 296, ascella 336, petto 372/382, vita 452/442, fianchi 528, cavallo 572); larghezze del
  busto in `K.B` (mezze larghezze: `nk` collo, `shx`, `sho` spalla, `ap`, `ch` petto, `wt` vita, `hp` fianchi; `aw` braccio;
  `seno`, `pancia`). Le corporature sono 3 × lui/lei: **ogni pezzo deve stare bene su tutte e 6**.
- La TESTA ha coordinate sue (origine al mento, x = 0 al centro, guance a y -78, cima del cranio `K.top` ≈ -148,
  mezza larghezza delle guance `K.F.cw` 50-59, contorno del viso `K.faceD`). Capelli, cappelli, bocche, barbe e segni si
  disegnano in queste coordinate (il motore li mette già dentro `K.HT`). Occhi a (±26, -72), naso fino a y -36,
  bocca intorno a (0, -24), mento a 0. I capelli lunghi possono scendere fino a y ≈ +180 (sulle spalle e sul petto).

## Aiuti in K (vedi omino-a.js, «il contesto per i pezzi»)
- Colori: `K.pelle skL skD skDD`, `K.capelli hL hD hDD` (+ gradienti già pronti `K.U("hg1")`, `"hg2"`, `"hg3"`),
  `K.maglia`, `K.pantaloni`, `K.scarpe`, `K.acc` (cappello), `K.labbro`, `K.rossetto`, `K.c` (la configurazione intera:
  es. `K.c.stampa`, `K.c.forma`). `K.chiaro(col, t)`, `K.scuro(col, t)`, `K.mix(a, b, t)`, `K.lum(col)`.
- Disegno: `K.Pa(d, fill, extra)`, `K.St(d, colore, spessore, opacità)`, `K.El(cx, cy, rx, ry, fill)`, `K.soft(col, op)`
  (ombra/luce morbida radiale: usala con `K.El`), `K.LG(id, x1,y1,x2,y2, stops, userSpace)`, `K.RG`, `K.clip(d | [d…])`
  → `url(...)` per `clip-path`, `K.cil(colore, forza)` = gradiente «cilindro» (luce a sinistra, ombra a destra) da usare
  come fill di braccia, gambe, maniche, busti. `K.limb([[x,y,larghezza],…], punta)` = forma rastremata lungo una linea
  (ciocche, maniche, cinghie); `K.ciocche(lista, ["hg1","hg2"])` = ciocche di capelli con il riflesso; `K.liscio(punti)`,
  `K.lisciaChiusa(punti)`, `K.rnd(seme)`, `K.n1(numero)`. Gli id dei gradienti `K.LG("nome", …)` devono essere unici
  dentro un avatar: metti un prefisso tuo (es. `"rc_onda"`).
- Corpo: `K.busto({agio, orlo, scollo:{tipo:"tondo"|"v"|"quadro", prof, larg}, smanicato, spallina, svasa, pancia})`
  = contorno del busto di un vestito; `K.manica(lato, {lung: 0.25…1, agio, svasa, tonda})` (lato -1 sinistra, 1 destra);
  `K.fineManica(lato, lung)` = dove finisce (x, y, direzione, larghezza) per polsini e risvolti; `K.gamba(lato,
  {agio, agioI, da, a, dritto, orlo, orloL, segue, svasa, curvaOrlo})` = contorno di una gamba di pantaloni (da y `da`
  a y `a`; `dritto` = da quella quota in giù la stoffa scende dritta fino a mezza larghezza `orloL`); `K.bacino({agio,
  vita, cavallo})` = parte alta dei pantaloni o della gonna; `K.gIn(y)` = [centro della gamba, mezza larghezza fuori,
  dentro] a quella quota; `K.BR[-1|1]` = il braccio (J spalla, E gomito, W polso, a1 a2 angoli, nodi).
  Riusa `A.maglia(K, lung)` e `A.pantaloni(K, classici)` se un pezzo è «una maglietta con qualcosa in più».

## Cosa restituisce un pezzo
- capelli: `{ dietro: svg, fronte: svg, ombraFronte: false se non c'è frangia/attaccatura (calvi, rasati) }`
  (dietro = dietro testa e corpo, per i capelli lunghi e la massa dietro il cranio; fronte = sopra il viso).
- cappelli: `{ linea: y (coordinate testa) sotto cui i capelli restano visibili (es. -112), svg: il cappello, dietro: facoltativo }`.
  Senza `linea` i capelli restano interi (fasce, cerchietti, cuffie).
- capo (sopra): `{ corpo: svg, sopra: facoltativo (sopra le mani), dietro: facoltativo (dietro tutto, es. il cappuccio) }`.
- sotto (pantaloni e gonne): una stringa svg (o `{ corpo, sopra }`). Scarpe: stringa svg (usa `A.duePiedi(K, unaScarpa)`
  come le sneakers, o disegna i due piedi tu sotto `K.gIn(938)`). Bocca, barba, segno: stringa (barba: `{ dentro, sopra }`:
  dentro = ritagliata nel viso, sopra = davanti alla bocca, es. baffi e barba folta che esce dal mento).

## Come provare (OBBLIGATORIO guardare ogni pezzo)
1. Pagina: `D:\SG-avatar-a-lavoro\banco.html` carica motore + tutti i file in `pezzi\`. Parametri:
   `?voce=capelli&valori=riga,ciuffo&forma=uomo|donna|tutte&busto=1&w=260&h=360&extra={json}` (extra = altre voci,
   es. `{"corpo":"robusto","pelle":6,"colCap":4}`). Senza `voce` mostra le 6 corporature.
2. Foto con Edge invisibile (c'è UNA fila per tutto il PC, aspetta da sola):
   `"C:\Program Files\nodejs\node.exe" D:\SG-avatar-a-lavoro\foto.js "D:\SG-avatar-a-lavoro\banco.html?voce=…" D:\SG-avatar-a-lavoro\aiutanti\<gruppo>\x.png 1300 760 300`
   (larghezza, altezza, attesa). Se nella riga stampata ci sono «ERRORI», correggili. Poi GUARDA la foto (Read del png).
3. Guarda ogni pezzo **intero e da vicino** (`busto=1` per capelli, bocche, barbe, cappelli), su lui e su lei, con
   almeno una pelle scura (`"pelle":5` o `6`) e capelli chiari e scuri (`colCap` 0, 4, 6), e i vestiti su snello e robusto.
   Rifai finché è bello: deve sembrare un'illustrazione professionale e coerente con la prova A, non un'icona.
4. Non lanciare server, non chiudere processi che non hai avviato tu, non installare niente.

## Alla fine
Scrivi in fondo al tuo file un commento con l'elenco dei pezzi fatti e, se un pezzo non ti è venuto bene, quale
voce già fatta gli somiglia di più (il capo lo userà al suo posto). Lascia 1-2 foto riassuntive nella tua cartella
`aiutanti\<gruppo>\riassunto*.png` e rispondi con: pezzi fatti, foto riassuntive, problemi.

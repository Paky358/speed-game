# Avatar illustrati — SECONDO TEMPO: il corpo come un pezzo unico (5 nov 2026)

Leggi prima `D:\SG-avatar-a-lavoro\LEGGIMI-AIUTANTI.md` (coordinate, aiuti K, come si prova). Qui c'è quello che è
cambiato nel motore `D:\SG-avatar-a\js\omino-a.js` (NON modificarlo: è del capo; se trovi un errore del motore
scrivilo nella risposta).

## Perché
Il proprietario ha visto sul telefono: le spalle uscivano dal vestito, le spalle sembravano due pezzi montati dietro,
i piedi erano attaccati. Causa: ogni pezzo (pelle, maniche, busto) aveva il SUO contorno e il SUO colore sfumato,
impilati uno sopra l'altro → giunture e stoffa che sporge.

## Come è fatto adesso
- **Una sagoma sola**: `K.tronco(o)` (= `K.busto(o)`, stessi parametri di prima: agio, orlo, scollo {tipo, prof, larg},
  smanicato, spallina, svasa, curvaOrlo, pancia) dà il tronco del vestito: collo → trapezio → **spalla tonda**
  (cerchio di raggio `K.rc + agio` intorno al perno `K.BR[lato].J`) → fianco → anca. Il tronco della pelle è la
  stessa linea con agio 0. Quindi un vestito con agio ≥ 0 copre SEMPRE la pelle e non sporge.
- **Le braccia sono UN contorno**: `K.manica(lato, { lung, agio, svasa, tonda })` (lato -1 sinistra, 1 destra) =
  spalla tonda + braccio + gomito tondo + avambraccio fino alla frazione `lung` (0,3 manica corta, 1 al polso),
  allargato di `agio` su tutta la larghezza. Segue il braccio in OGNI posa (giù, `su`, `uno`, `canna`, i gesti).
  Mai disegnare una manica a mano: sempre `K.manica`.
- **Colorare senza giunture**: `K.dipingi(pz, colore, o)` →  `{ svg, clip }`.
  `pz = { tronco: [d, …], braccia: [{ d, lato, fino, e }, …], altro: [d, …] }` (fino = lung della manica,
  e = agio della manica; altro = altri pezzi della stessa stoffa, es. gambe e bacino dei pantaloni).
  Colora tutto a tinta unita col bordo scuro solo sul contorno esterno, poi mette SOPRA luce e ombra morbide
  ritagliate sulla sagoma intera (luce da sinistra uguale per pelle e vestiti, volume sulle maniche).
  `o = { dentro: svg ritagliato sulla sagoma (pieghe, ombre, cuciture), bordo, chiaro, scuro (colori del bordo,
  della luce e dell'ombra), volume: false (niente ombre automatiche), forza (0-1) }`. `clip` = la sagoma intera,
  per altre cose ritagliate dopo. **Regola: tutti i pezzi della stessa stoffa insieme in UN `K.dipingi`.**
  Mai più `K.Pa(T, K.cil(...))` + `K.Pa(manica, K.cil(...))` separati: fanno la giuntura alla spalla.
  Un pezzo di altra stoffa (colletto di un altro colore, fodera del cappuccio, bottoni, tasche) va sopra.
- Esempio da copiare: `maglia(K, lung)` in fondo a omino-a.js (maglietta e maniche lunghe).
- Altri aiuti nuovi: `K.cilindro(P, Q, larghezza, chiaro, scuro, forza)` (volume morbido di un tratto: ellissi
  sfumate, niente bordi), `K.ElR(cx, cy, rx, ry, gradi, fill)` (ellisse ruotata), `K.volumeBraccio(lato, fino,
  chiaro, scuro, agio)`, `K.luce()` (il gradiente della luce da sinistra, in coordinate del mondo), `K.rc` (raggio
  della spalla tonda), `K.G` (la geometria: `K.G.gIn`, `K.G.Jd`, `K.G.Jy`, `K.G.largTronco(y)`), `K.BR[lato]`
  (`J` spalla, `E` gomito, `W` polso, `l1`, `l2`, `a1`, `a2`, `davanti` = il braccio passa davanti al corpo).
- Le mani si disegnano dopo i vestiti (le fa il motore). Le braccia della pelle si disegnano DOPO i pantaloni
  e PRIMA del vestito di sopra. Quando un braccio passa davanti al corpo (gesti), il motore ridisegna
  l'avambraccio sopra il vestito, dalla fine della manica in giù.

## Il braccio staccato (scene grandi dei giochi)
Nelle scene grandi l'avatar diventa due immagini: il corpo senza un braccio e il braccio da solo, che il gioco fa
ruotare sulla spalla (`SGOmino.parti(cfg, { lato, gesto })`). Il motore lo fa da solo per pelle, mani e per tutto
quello che passa da `K.dipingi` (le maniche nella lista `braccia`). **Ogni ornamento che sta SOLO su una manica**
(polsini, righe, toppe, bottoni del polsino, risvolti, orlo della manica) va passato da
`K.suManica(lato, svg)`: così sparisce dal corpo e segue il braccio staccato. Gli ornamenti del tronco restano come
sono. Prova col foglio fisso `parti` (corpo, braccio, braccio ruotato): sul corpo non deve restare NIENTE della
manica staccata, e il braccio ruotato non deve portarsi dietro pezzi del tronco.

## Le pose e i gesti da provare sempre
`{}` (in piedi), `{"braccia":"su"}`, `{"braccia":"uno"}`, `{"braccia":"canna","angolo":40}`,
`{"gesto":"saluta"}`, `{"gesto":"applaude"}`, `{"gesto":"esulta"}`, `{"gesto":"posa"}`, `{"gesto":"preme"}`,
`{"gesto":"leva"}`, `{"gesto":"batte"}`, `{"gesto":"tavolo"}` (mani appoggiate sul tavolo), `{"gesto":"carte"}`
(carte in mano davanti al petto). Un gesto di un braccio solo usa il braccio a destra nel disegno; `"lato":-1`
per l'altro.

## Come fare le foto (Edge invisibile, una fila sola per tutto il PC: aspetta da sola)
Il banco del critico `D:\SG-avatar-a-lavoro\critico\griglia.html` carica il motore e i file `pezzi\*.js`
DIRETTAMENTE (le tue modifiche si vedono subito). Comando:
```
"C:\Program Files\nodejs\node.exe" D:\SG-avatar-a-lavoro\critico\scatta.js <cartella> illustrato "<richiesta>" <nome>
```
- `<richiesta>` = `?foglio=voce&voce=capo&valori=felpa,camicia` → ogni valore su 6 corpi (lui/lei × snello,
  medio, robusto, con pelli diverse). Aggiunte: `&vb=spalle` (zoom spalle), `&vb=piedi`, `&vb=busto`,
  `&vb=testa`, `&opz={"gesto":"posa"}` (posa), `&extra={"sotto":"gonna"}` (altre voci), `&base=2` (vestito di
  partenza 0-5), `&h=250` (altezza della cella).
- Fogli fissi (senza `?`): `grande1,grande2,grande3,spalle1,spalle2,piedi,media,piccola,bot,pose,zoom,mani,gesti`.
- Poi GUARDA la foto (Read del png). Fai le foto nella TUA cartella `D:\SG-avatar-a-lavoro\aiutanti\<gruppo>\`.
- Controllo veloce senza browser: `"C:\Program Files\nodejs\node.exe" D:\SG-avatar-a-lavoro\verifica.js`
  (carica il file unito: lancia prima `bash D:/SG-avatar-a-lavoro/unisci.sh`).

## Regole
- Scrivi SOLO nel tuo file `pezzi\<gruppo>.js` e nella tua cartella `aiutanti\<gruppo>\`. Non modificare file non tuoi.
- Non lanciare server, ferma solo i processi che hai avviato tu, non installare niente.
- Ogni avatar salvato resta la stessa persona: stessi pezzi, stessi colori, stesso carattere del disegno.
- Lo stile resta il nostro (illustrazione morbida, luce da sinistra): il livello da raggiungere è quello delle app
  di avatar migliori, senza copiare niente.

# Simulazione de «Il Muro»

Serve a scegliere i numeri del gioco (valori delle caselle, palline, domande, cronometro) prima di scriverlo. Non tocca nessun file del gioco.

## Cosa simula
- Il muro: la pallina parte sopra una zona e a ogni fila va di mezza casella a destra o a sinistra, rimbalzando sulle pareti (come il Plinko del Prezzo è Giusto). Due muri a confronto: **A** (9 caselle, 9 zone, 12 file) e **B** (13 caselle, 7 zone, 16 file).
- Le squadre: chi è nella stanza sa o non sa la risposta (se non sa tira a indovinare, a volte scartando una risposta); chi è giù stima quanto il compagno la sa, con un errore (amico che lo conosce bene: 0,05; poco: 0,30) e capisce un po' la difficoltà dalle risposte. Squadre da 3: chi è giù sceglie il compagno che crede più forte.
- Le strategie di chi è giù: `furbo` (più palline quando è sicuro, zero quando no; indietro nell'ultimo giro rischia, molto avanti si ferma), `tutto` (sempre il massimo in centro), `prudente`, `caso`.
- Prima il muro dei perdenti, poi quello dei vincitori. Ultimo giro con punti doppi.

## Come si lancia (Node, dalla cartella della simulazione)
```
"C:\Program Files\nodejs\node.exe" sim-muro.js <rapporto> <partite>
```
Rapporti: `muri` (cosa fa una pallina per ogni zona), `giro` (muri, valori, palline al massimo, domande e giri, punti sotto zero o fermi a zero, 0 palline o almeno 1), `stima` (conta conoscere l'amico?), `strategie` («sempre tutto» contro «furbo»), `leva` (e se perdere pesasse di più?), `rimonta`, `tempo` (minuti), `punti`, `tutto`. Le partite di partenza sono 3000 (ognuna parte in meno di un secondo). Il modello dei giocatori si cambia con `MODELLO='{"base":0.2,"topic":0.3}'` (base = quanto sanno gli amici, topic = quanto cambia da un argomento all'altro).

## Cosa ne è uscito (10 nov 2026)
Vedi il messaggio della chat «🧱 Il Muro»: muro A con valori 50 · 100 · 250 · 500 · 1.000 · 500 · 250 · 100 · 50, fino a 3 palline, 12 domande + 3 doppie, cronometro 20 s, punti anche sotto zero, 0 palline permesso.

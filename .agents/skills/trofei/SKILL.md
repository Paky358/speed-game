---
name: trofei
description: Usala quando devi aggiungere o cambiare i trofei di un gioco di SPeeD GAME (lista TROFEI in core.js e contatori nel gioco). Spiega il formato, chi conta e come controllare che si possano davvero prendere.
---

# Trofei

Sono in stile PlayStation: Bronzo, Argento, Oro e Diamante, più il Platino, che arriva da solo quando hai tutti gli altri trofei del gioco.

## Dove stanno
- Elenco unico `TROFEI` in `js/core.js`, una riga per trofeo:
  `{ gioco: "tris", livello: "bronzo", icona: "⭕", nome: "Primo Passo", desc: "Vinci la tua prima partita", stat: "vinte", meta: 1 }`
  (`livello`: `bronzo` | `argento` | `oro` | `diamante`). Il trofeo è preso quando `stat.<gioco>.<stat>` del profilo arriva a `meta`.
- I contatori li aggiorna il gioco con **una sola chiamata** a fine mano o partita:
  `SGNube.salvaProgressi(fichesOppureNull, "<gioco>", incrementi, record, valori)`
  - `incrementi`: `[["vinte", 1], ["partite", 1]]` (si sommano);
  - `record`: `[["serieMax", 5]]` (si tiene il più alto);
  - `valori`: `[["serieOra", 3]]` (si sovrascrivono: servono per le serie "di fila" che continuano tra una partita e l'altra).
- L'avviso "Trofeo sbloccato!" lo fa il core da solo.

## Chi conta
- Conta solo chi ha un profilo, e mai in modalità "prova".
- Sullo stesso telefono conta il giocatore col nome del profilo. Online o contro il computer conta il giocatore di questo telefono.
- Non contare due volte la stessa fine partita (usa una chiave, come in `tris.js` e `drop4.js`).

## Prima di aggiungere una lista
Le liste arrivano dal proprietario, spesso scritte da un'altra IA. Controlla:
1. **Si può davvero fare?** Niente trofei su cose che il gioco non ha. Se un trofeo è impossibile (per esempio "batti il bot imbattibile"), proponi un'alternativa o cambia il gioco.
2. **Numeri giusti per un gioco da festa**: niente "vinci 500 partite"; abbassa i numeri troppo lunghi.
3. **Non banale**: se un trofeo si prende subito barando (per esempio contro il bot più facile), escludi quel caso.
4. Dove si può, **simula** tante partite sul motore vero e controlla quanto spesso esce ogni trofeo.
Nella pull request elenca cosa hai cambiato rispetto alla lista e perché, in italiano semplice.

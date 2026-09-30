---
name: nuovo-gioco
description: Usala quando devi creare un nuovo gioco in SPeeD GAME (o portare un gioco all'online). Elenca i file da toccare, il contratto SG.registra, le regole della saletta e dell'online e i controlli finali.
---

# Creare un nuovo gioco

Leggi prima `AGENTS.md` e `docs/COME-SI-AGGIUNGE-UN-GIOCO.md`. Copia lo stile di un gioco simile già fatto (carte: `js/games/scopa.js`; a turni con domande: `js/games/timeline.js`; online in tempo reale: `js/games/horto.js`; disegno: `js/games/scarabocchio.js`).

## File da toccare (tutti)
1. `js/games/<id>.js` — il gioco, in una funzione che si chiama da sola: `(function () { "use strict"; ... SG.registra({...}); })();`
2. `index.html` — aggiungi `<script src="js/games/<id>.js"></script>` dopo gli altri giochi.
3. `js/core.js` — l'id in `CAT_GIOCO` (categorie: `carte`, `sfida`, `festa`, `mini`, `parole`) e, se si gioca online, in `GIOCHI_ONLINE`.
4. `data/novita.js` — una voce in cima (`v` +1, data, titolo, righe scritte per chi gioca).
La versione online (`costruisci-versione-online.sh`) prende da sola tutti i file di `js/games/`.

## SG.registra
```js
SG.registra({
  id: "briscola", nome: "Briscola", icona: "🃏",
  descrizione: "Due righe per chi gioca.",
  giocatoriMin: 2, giocatoriMax: 2,
  difficolta: 2,              // 1 facile, 2 media, 3 difficile: pesa i punti nel torneo
  modi: [ { modo: "bot", icona: "🤖", nome: "Contro il computer", sotto: "..." } ],   // solo i modi LOCALI
  // soloOnline: true,        // se si gioca solo online (allora modi: [])
  regole: [ "Riga di regola con <b>grassetto</b>." ],
  impostazioni: function (box, dove, aiuti) { ... },
  avvia: function (t) { ... }
});
```
- "Online" lo aggiunge il core da solo se l'id è in `GIOCHI_ONLINE`. Se nei `modi` c'è `amici: true`, prima si aggiungono gli amici e poi le impostazioni.
- `impostazioni`: metti i valori di partenza in `dove`. Se `aiuti.modo` c'è, usalo e **non** mostrare una scelta del modo. Se c'è `aiuti.torneo`, usa i valori del torneo sullo stesso telefono. Le scelte vanno fatte con bottoni `.modo-chip` / `.cat-chip`: così l'host le ritrova nel tasto "⚙️ Regole" della saletta.
- `avvia(t)`: se c'è `t.linkParams.stanza` sei un ospite; se `t.impostazioni.modo === "online"` sei l'host; altrimenti si gioca in locale.

## Il tavolo `t` (quello che il core ti dà)
`t.el(tag, attr, figli)`, `t.schermata(opzioni)` + `t.mostra(s)`, `t.giocatori`, `t.impostazioni`, `t.mischia(array)`, `t.passaA(nome, poi)`, `t.lobby({...})`, `t.mioOmino(nome)`, `t.nomeProfilo()`, `t.risultato(classifica)`, `t.fine(classifica)`, `t.esci()`. Il gioco può impostare `t.onRegole = function (imp) {...}`.

## Online (host-autoritativo)
- Host: `var rete = SGNet.ospita("<id>", { onCodice, onConnesso, onAddio(id), onMsg(id, m), onErrore })`. Tiene lo stato vero e manda a tutti una "foto" con `rete.invia({ t: "vm", vm: ... })` (resta sul server per chi arriva dopo). Le cose frequenti, come i tratti di un disegno, vanno con `rete.inviaVeloce(...)`. Un messaggio per un solo telefono si manda a tutti con `to: id`: gli altri lo ignorano.
- Ospite: `SGNet.entra(codice, { onAperto(id), onMsg(m), onChiuso, onErrore })`. In `onAperto` manda `{ t: "join", nome, omino }` e poi solo le sue mosse (`{ t: "mossa", ... }`).
- **Gli id dei giocatori devono comparire nei messaggi di lobby/vm**: chi entra ripete "join" finché non vede il suo id.
- Saletta: `t.lobby({ host, codice, pronta, giocatori: [{ id, nome, omino, host, tu }], min, puoiDaSolo, vuoti, extra: [nodi], attesa, testoComincia, onComincia, onEsci })`. Chiamala a ogni cambio: si aggiorna al suo posto.
- Chi ha un profilo entra da solo: se `t.nomeProfilo()` c'è, niente schermata del nome.
- Fine partita: `t.risultato([{ nome, pos }])`, dove `pos` è il posto (pari merito = stesso posto). Poi una schermata finale con "Nuova partita" per l'host ed "Esci" per tutti.
- Mai mandare segreti a tutti (le carte di un altro, i ruoli nascosti): solo al telefono giusto.

## Schermo
- Niente titolo in alto e **niente scorrimento** per giocare. A tutto schermo: `.schermata.<pref>-piena{padding:0!important;height:var(--alt,100dvh);overflow:hidden}` con testa e piede nascosti (vedi `horto.js`).
- **Niente lampeggio**: costruisci la schermata una volta e poi aggiorna solo i pezzi che cambiano.
- Numeri col punto delle migliaia; "avatar", non "omino"; il primo bot si chiama Matt.
- Stile nel file del gioco (un `<style>` aggiunto una volta), con un prefisso di classe tutto suo.

## Prima di aprire la pull request
- Segui la skill `prova-nel-browser`: partita locale, partita online con amici finti, console senza errori, schermo di un telefono piccolo (360x640) e grande (412x915).
- Regole con i bot: tienile in funzioni separate dalla grafica e simula tante partite.
- Voce in `data/novita.js`; pull request (mai su `master`) con la spiegazione in italiano semplice.

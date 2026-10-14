---
name: nuovo-gioco
description: Usala quando devi creare un nuovo gioco in SPeeD GAME (o portare un gioco all'online). Elenca i file da toccare, il contratto SG.registra, le regole della saletta e dell'online e i controlli finali.
---

# Creare un nuovo gioco

## Parti SEMPRE dal modello
Copia `.agents/skills/nuovo-gioco/modello-gioco-online.js` in `js/games/<id>.js` e cambia **solo le parti segnate con "QUI"**.
È un gioco vero e già provato ("Il più veloce"). Saletta, ingresso con o senza profilo, segreti a un telefono solo, "⚙️ Regole", uscite con `t.conferma`, chi ricarica o riaccende il telefono, chi arriva tardi e guarda, "Prossimo giro" che va avanti da solo (`t.contoAvanti`), "Riprova" se il primo collegamento non riesce, fine partita con faccine e medaglie a pari merito, torneo e "Nuova partita" sono già fatti giusti: **non riscriverli a modo tuo**.
Se il gioco ha anche un modo sullo stesso telefono (o contro il computer), aggiungilo accanto, sempre partendo dal modello.

Leggi anche `AGENTS.md` e `docs/COME-SI-AGGIUNGE-UN-GIOCO.md`. Copia lo stile di un gioco simile già fatto (carte: `js/games/scopa.js`; a turni con domande: `js/games/timeline.js`; online in tempo reale: `js/games/horto.js`; disegno: `js/games/scarabocchio.js`).

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
Aiuti nuovi (14 ott 2026):
- `t.contoAvanti(nodo, secondi, fn, chiave)`: su un tasto mette il numero che conta e a zero chiama `fn` (l'host); su una scritta mostra "Si va avanti tra N…" (gli altri, `fn = null`). Stessa `chiave` = il conto continua anche se il tasto viene ridisegnato. Toccato il tasto, il conto si ferma.
- `t.faccine()`: la fila delle faccine della saletta, da mettere dove si aspetta o si guarda. `null` se la partita non è online.
- `t.conferma(domanda, nota, testoSì, fn)` (o `t.conferma(domanda, fn)`): la finestra di conferma dell'app, al posto di `window.confirm`.
- In `SG.registra`: `postiOnline: 2` (giochi a due: gli altri guardano), `hostDiRiserva: true` (se l'host sparisce un amico porta avanti la partita), nei `modi` `diretto: true` (parte senza impostazioni) e `min` (minimo di giocatori di quel modo). `impostazioni` riceve anche `aiuti.giocatori` (i nomi).

## Online (host-autoritativo)
- Host: `var rete = SGNet.ospita("<id>", { onCodice, onConnesso, onAddio(id), onMsg(id, m), onErrore, onForse(id), onTornato(id) })`. Tiene lo stato vero e manda a tutti una "foto" con `rete.invia({ t: "vm", vm: ... })` (resta sul server per chi arriva dopo). Le cose frequenti, come i tratti di un disegno, vanno con `rete.inviaVeloce(...)`. Un messaggio per un solo telefono si manda a tutti con `to: id`: gli altri lo ignorano.
- Ospite: `SGNet.entra(codice, { onAperto(id), onMsg(m), onChiuso(perché), onErrore })`. In `onAperto` manda `{ t: "join", nome, omino }` e poi solo le sue mosse (`{ t: "mossa", ... }`).
- `onErrore` arriva **solo se il primo collegamento non riesce** (15 secondi): mostra "Riprova" (nel modello: `erroreRete`). Dopo, la rete che salta la gestisce il core ("📶 Mi ricollego…"): il gioco non deve chiudere niente.
- `onChiuso(perché)`: `{ voluto: true }` l'host ha chiuso apposta, `{ sparito: true }` l'host non è tornato (fuori dalla Sala il core mostra già "La stanza è chiusa").
- `onForse(id)` / `onTornato(id)`: un amico è sparito senza salutare / è tornato in tempo (nel modello: 📶 accanto al nome). Dopo 20 secondi arriva `onAddio(id)`. Se poi torna, il suo "join" ha lo stesso id: ridagli il suo posto.
- Nella foto metti sempre `fase` ("lobby", "gioco", "fine"): se l'host ricarica la pagina il core riapre la stanza con lo stesso codice e tutti ripartono dalla saletta.
- I messaggi `"__…"` sono del core: il gioco non li riceve e non deve usare nomi così.
- **Gli id dei giocatori devono comparire nei messaggi di lobby/vm**: chi entra ripete "join" finché non vede il suo id.
- Saletta: `t.lobby({ host, codice, pronta, giocatori: [{ id, nome, omino, host, tu }], min, puoiDaSolo, vuoti, extra: [nodi], attesa, testoComincia, onComincia, onEsci })`. Chiamala a ogni cambio: si aggiorna al suo posto.
- Chi ha un profilo entra da solo: se `t.nomeProfilo()` c'è, niente schermata del nome.
- Fine partita: `t.risultato([{ nome, pos }])`, dove `pos` è il posto (pari merito = stesso posto; i bot con `bot: true`). Poi una schermata finale con "Nuova partita" per l'host ed "Esci" per tutti, le faccine (`t.faccine()`) e le medaglie a pari merito (oro, oro, poi argento). Con più di 6 giocatori la classifica va su due colonne (`class="classifica fitta"`), così i tasti restano a vista.
- Ogni attesa di un tocco ha un tempo: l'host ha il tasto con `t.contoAvanti(...)`, gli altri la scritta col conto. Nella foto manda i **secondi che mancano** (non l'ora: gli orologi dei telefoni sono diversi).
- Giochi a due (`postiOnline: 2`): gioca solo l'avversario scelto dall'host (il suo id nella foto); chi è in più guarda, senza "Tu" né "Tocca a te", con le faccine.
- Mai mandare segreti a tutti (le carte di un altro, i ruoli nascosti): solo al telefono giusto.

## Schermo
- Niente titolo in alto e **niente scorrimento** per giocare. A tutto schermo: `.schermata.<pref>-piena{padding:0!important;height:var(--alt,100dvh);overflow:hidden}` con testa e piede nascosti (vedi `horto.js`).
- **Niente lampeggio**: costruisci la schermata una volta e poi aggiorna solo i pezzi che cambiano.
- Numeri col punto delle migliaia; "avatar", non "omino"; il primo bot si chiama Bot.
- Stile nel file del gioco (un `<style>` aggiunto una volta), con un prefisso di classe tutto suo.

## Errori già visti (da non ripetere)
- **"Nuova partita"** riporta tutti nella stessa saletta, nella stessa stanza e con gli stessi giocatori. Mai chiudere la stanza e riaprirne un'altra, sennò gli amici restano fuori e serve un link nuovo.
- **Messaggi segreti** (la carta, il ruolo, la parola) si mandano con `rete.inviaVeloce({ ..., to: id })`, mai con `rete.invia`: quello resta in stanza e lo riceve chi arriva dopo.
- **`t.risultato`** vuole i **nomi dei giocatori**, mai "Squadra A". Nei giochi a squadre: chi vince al posto 1, gli altri dopo, e se finisce pari tutti al posto 1.
- **Chi entra senza profilo** deve poter scrivere il suo nome. Si entra da soli solo se `t.nomeProfilo()` c'è.
- **"Esci" a partita iniziata**: per l'host chiede conferma ("Chiudere la partita per tutti?"), perché un tocco sbagliato chiude il gioco a tutti. Con `t.conferma`, mai `window.confirm`. Dalla saletta la conferma la fa già il core: non chiederla due volte.
- **Schermate ferme**: un "Avanti ▶" che aspetta per sempre blocca tutti se chi deve toccare si distrae. Sempre `t.contoAvanti`. Il conto chiama la funzione: mai `bottone.click()` (fa vibrare). Non fare anche un timer a mano che fa la stessa cosa.
- **Partita chiusa su `onErrore`**: no. A partita iniziata `onErrore` non arriva più; se ce l'hai, deve solo offrire "Riprova" al primo collegamento.
- **Chi ricarica o riaccende il telefono**: il suo "join" arriva con lo stesso id. Va rimandata la foto (e i suoi segreti), senza farlo entrare due volte e senza cambiare la schermata dell'host. Se era stato messo "via", rimettilo in partita.
- **Chi arriva a partita cominciata** non va messo in partita: guarda ed entra alla "Nuova partita". Non deve vedere "Tu" o "Tocca a te".
- **Ridisegnare a ogni foto** un tasto col conto lo fa ripartire o lampeggiare: crealo una volta per turno (con una chiave del turno) e aggiorna solo i testi.
- **Saletta**: `vuoti` sono solo i posti che mancano per arrivare al minimo, non tutti quelli fino al massimo. Se qualcuno esce, non rimescolare le squadre o i posti già decisi dall'host.
- **Punti e penalità**: rileggi chi deve prenderli o perderli (per esempio, un BUZZ penalizza la squadra di chi ha sbagliato, non quella di chi l'ha visto).
- Nessuna scritta col nome del gioco in alto nello schermo di gioco.

## Nella pull request: copia questa lista e spunta solo quello che hai davvero fatto
```
- [ ] Partito dal modello: cambiate solo le parti "QUI"
- [ ] id in GIOCHI_ONLINE e CAT_GIOCO (core.js), script in index.html, voce in cima a data/novita.js
- [ ] Nella foto (vm) ci sono gli id dei giocatori; i segreti vanno solo con inviaVeloce + "to"
- [ ] "Nuova partita" riporta tutti nella stessa saletta; "Esci" a partita iniziata chiede conferma con t.conferma
- [ ] Ogni attesa di un tocco va avanti da sola (t.contoAvanti); niente chiusura della partita su onErrore
- [ ] Nella foto c'è "fase"; nessun messaggio del gioco comincia con "__"
- [ ] Faccine (t.faccine) sulla classifica finale e dove si aspetta o si guarda; giochi a due con postiOnline: 2
- [ ] t.risultato coi nomi dei giocatori (a squadre: chi vince al posto 1)
- [ ] Chi entra senza profilo scrive il nome; col profilo entra da solo
- [ ] Provato: una partita intera online con 3 amici finti, uno che esce a metà, "Nuova partita"
- [ ] Provato coi telefoni finti: un amico che ricarica la pagina, uno col telefono spento più di 20 s che poi torna, l'host che ricarica, uno che arriva a partita cominciata
- [ ] Console senza errori; schermi 360x640 e 412x915 senza scorrere
```
Se un punto non l'hai potuto provare, scrivilo chiaramente: lo controllo io.

## Prima di aprire la pull request
- Segui la skill `prova-nel-browser`: partita locale, partita online con amici finti, console senza errori, schermo di un telefono piccolo (360x640) e grande (412x915).
- Online usa i **telefoni finti** (`telefoni-finti.js` della skill `prova-nel-browser`): `apriTel`, `ricarica`, `spegni`/`riaccendi` (più di 20 s), `erroriTel()`. Per provare un gioco non ancora in `GIOCHI_ONLINE` (per esempio il modello) caricalo prima che parta l'app con `apriTel(nome, { hash: "gioco=<id>", prima: w => w.eval(testoDelGioco) })`, dandogli per la prova un modo `{ modo: "online", ... }` al posto di `modi: [], soloOnline: true`.
- Regole con i bot: tienile in funzioni separate dalla grafica e simula tante partite.
- Voce in `data/novita.js`; pull request (mai su `master`) con la spiegazione in italiano semplice.

---
name: nuovo-gioco
description: Usala quando devi creare un nuovo gioco in SPeeD GAME (o portare un gioco all'online). Elenca i file da toccare, il contratto SG.registra, le regole della saletta e dell'online e i controlli finali.
---

# Creare un nuovo gioco

## Parti SEMPRE dal modello
Copia `.agents/skills/nuovo-gioco/modello-gioco-online.js` in `js/games/<id>.js` e cambia **solo le parti segnate con "QUI"**.
È un gioco vero e già provato ("Il più veloce"). Saletta, ingresso col profilo, segreti a un telefono solo, "⚙️ Regole", uscite con `t.conferma`, chi ricarica o riaccende il telefono, chi arriva tardi e guarda, chi non è stato scelto in "Chi gioca?" e guarda (`t.puoSedersi`), "Prossimo giro" che va avanti da solo (`t.contoAvanti`), "Riprova" se il primo collegamento non riesce, fine partita con faccine, medaglie a pari merito e i tasti di fine del core (`t.tastiFine`: Rivincita col 3-2-1, Cambia gioco, Ci sto), torneo e "Nuova partita" (`t.onRivincita`), **l'host che ricarica e ritrova la partita** (`riprende`, `t.ricorda`, `t.ripresa`) e **l'amico che la porta avanti se l'host sparisce** (`riserva`, `t.mioId`) sono già fatti giusti: **non riscriverli a modo tuo**.
Se il gioco ha anche un modo sullo stesso telefono (o contro il Bot), aggiungilo accanto, sempre partendo dal modello.

**Online = la Sala della serata.** "Online" da un gioco apre la Sala (un codice per tutta la serata; interruttore `SALA_SEMPRE` in core.js). Il gioco non deve fare niente di speciale: apre la sua stanza come nel modello, e il core gli passa nel tavolo `t` chi gioca, i tasti di fine e la rivincita. Chi entra arriva da solo nella saletta del gioco, con lo stesso id che ha nella Sala.
Il profilo è obbligatorio per tutti (nome e avatar): `t.nomeProfilo()` c'è sempre; la schermata del nome nel modello resta solo come riserva.

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
  modi: [ { modo: "bot", icona: "🤖", nome: "Contro il Bot", sotto: "..." } ],   // solo i modi LOCALI
  // soloOnline: true,        // se si gioca solo online (allora modi: [])
  postiOnline: 10,            // quanti giocano alla stessa partita online (2 = gioco a due); nella Sala oltre questo numero c'è "Chi gioca?"
  ritardatari: "partita",     // chi arriva a partita cominciata: "partita" (guarda ed entra alla prossima), "turno" (dal prossimo giro), "mano" (dalla prossima mano)
  riprende: true,             // se l'host ricarica o riapre l'app, la partita online riprende da dove era (vedi "La rete salta, la partita no")
  riserva: true,              // se l'host sparisce del tutto un amico porta avanti la partita (NON nei giochi a due né in tempo reale)
  // riassunto: function (imp) { return imp.giri + " giri"; },   // facoltativo: la riga "📜 Si gioca così" della saletta
  regole: [ "Riga di regola con <b>grassetto</b>." ],
  impostazioni: function (box, dove, aiuti) { ... },
  avvia: function (t) { ... }
});
```
- "Online" lo aggiunge il core da solo se l'id è in `GIOCHI_ONLINE`. Se nei `modi` c'è `amici: true`, prima si aggiungono gli amici e poi le impostazioni.
- `impostazioni`: metti i valori di partenza in `dove`. Se `aiuti.modo` c'è, usalo e **non** mostrare una scelta del modo. Se c'è `aiuti.torneo`, usa i valori del torneo sullo stesso telefono. Le scelte vanno fatte con bottoni `.modo-chip` / `.cat-chip`: così l'host le ritrova nel tasto "⚙️ Regole" della saletta, e il core ne fa da solo la riga "📜 Si gioca così" per gli amici (se non è chiara, scrivila tu con `riassunto(imp)`).
- `impostazioni` deve funzionare anche col `box` **fuori dalla pagina** (nella Sala il core prepara le regole senza mostrarle, `aiuti.sala: true`): solo elementi e valori, niente misure (`offsetWidth`, `getBoundingClientRect`…) né attese.
- I bot: prendili dal gruppo fisso del core, `SG.bot.prendi(n, { livello, escludi: [nomi di chi gioca] })` (Matt, Angela, Rosa, Peppe…, ognuno col suo nome e avatar), mai nomi inventati nel gioco. Se `t.impostazioni.bot` c'è (torneo a eliminazione), usa quello. Nei tasti, nei menu e nelle regole si scrive solo "Bot" ("🤖 Contro il Bot", "Bravura del Bot"); in partita il nome del bot ("Matt sta pensando…").
- `avvia(t)`: se c'è `t.linkParams.stanza` sei un ospite; se `t.impostazioni.modo === "online"` sei l'host; altrimenti si gioca in locale.

## Il tavolo `t` (quello che il core ti dà)
`t.el(tag, attr, figli)`, `t.schermata(opzioni)` + `t.mostra(s)`, `t.giocatori`, `t.impostazioni`, `t.mischia(array)`, `t.passaA(nome, poi)`, `t.lobby({...})`, `t.mioOmino(nome)`, `t.nomeProfilo()`, `t.risultato(classifica)`, `t.fine(classifica)`, `t.esci()`. Il gioco può impostare `t.onRegole = function (imp) {...}`.
Aiuti nuovi (14 ott 2026):
- `t.contoAvanti(nodo, secondi, fn, chiave)`: su un tasto mette il numero che conta e a zero chiama `fn` (l'host); su una scritta mostra "Si va avanti tra N…" (gli altri, `fn = null`). Stessa `chiave` = il conto continua anche se il tasto viene ridisegnato. Toccato il tasto, il conto si ferma.
- `t.faccine()`: la fila delle faccine della saletta, da mettere dove si aspetta o si guarda. `null` se la partita non è online.
- `t.conferma(domanda, nota, testoSì, fn)` (o `t.conferma(domanda, fn)`): la finestra di conferma dell'app, al posto di `window.confirm`.
- In `SG.registra`: `postiOnline` (quanti giocano online; 2 = giochi a due, gli altri guardano), `riassunto(imp)` (facoltativo), `riprende` e `riserva` (vedi sotto; `hostDiRiserva: true` è il vecchio host di riserva fatto in casa di Parola d'ordine: nei giochi nuovi mai), nei `modi` `diretto: true` (parte senza impostazioni) e `min` (minimo di giocatori di quel modo). `impostazioni` riceve anche `aiuti.giocatori` (i nomi).
Il contratto della Sala (15 ott 2026, nel modello sono già usati tutti):
- `t.onRivincita = function () { … }`: l'host ci mette la sua "Nuova partita" (tutti di nuovo nella STESSA saletta, solo a partita finita). La usa il tasto "↻ Rivincita" del core: se ci sono tutti, la saletta riparte da sola col 3-2-1.
- `t.tastiFine(piede, { host, nuova, esci })`: nella schermata finale online mette nel `piede` i tasti uguali per tutti (Sala: "↻ Rivincita · 👍 3" e "🎮 Cambia gioco" per l'host, "👍 Ci sto!" e "🏠 Torna in Sala" per gli altri; fuori dalla Sala "↻ Nuova partita (stessi amici)" e "🏠 Esci"). Torna `true` se li ha messi; `false` (sullo stesso telefono, col Bot, torneo a eliminazione, chi guarda la partita di altri) = metti i tasti di sempre. `nuova` = la tua "Nuova partita" (se manca, `t.onRivincita`), `esci` = la tua uscita.
- `t.scelti`: chi gioca, scelto dall'host in "Chi gioca?" della Sala (lista di `{ id, nome }`), oppure `null` = tutti.
- `t.puoSedersi(id, nome)`: nel "join", se è `false` quell'amico non prende posto: entra, riceve le foto e guarda (il suo id va nella foto, per esempio in una lista `guarda`), in saletta `spettatore: "👀 Questa volta guardi"`. Resta a guardare anche nelle rivincite.
- `t.postiOnline`: i posti online del gioco (da `postiOnline`, se manca 10).
Chi guarda e chi arriva tardi (Passo 6, 17 ott 2026, nel modello già usati):
- `t.guarda`: `true` se questo telefono **guarda soltanto** (link con `&guarda=1`, o "👀 Guarda" nella Sala). Il gioco parte come ospite e manda il suo "join" come sempre, ma il core lo cambia in "sono qui a guardare" e **butta tutte le sue mosse**: l'host non lo vede mai tra i giocatori (e non sa chi guarda). Il gioco deve solo disegnare la partita quando il mio id non è tra i giocatori (niente "Tu", niente tasti, niente segreti) e non chiedere il nome (`t.nomeProfilo()` per chi guarda c'è sempre). In basso c'è la **targhetta del core** "👀 Guardi · 😂 · ✕" (alta 44 px, a 10 px dal fondo): lì ci sono le faccine e l'uscita, quindi con `t.guarda && !t.eliminazione` il gioco NON mette la sua fila di faccine né il suo "🏠 Esci" e lascia ~60 px liberi in basso (nel modello `mo-con-targa`, `mo-fine-targa`). In saletta `t.lobby({ spettatore: t.guarda ? "👀 Guardi soltanto" : … })`. Niente trofei per chi guarda. Quando la stanza torna in saletta chi guardava entra da solo come giocatore (fuori dalla Sala lo fa il core; nella Sala lo fa la Sala).
- `t.ritardatari`: quello che il gioco ha dichiarato in `SG.registra` (`"partita"` se manca). Il core lo usa per dire la verità a chi arriva ("✋ Partita in corso: giochi dal prossimo turno" / "👀 … la guardi ed entri alla prossima", poi "🎉 Sei dentro!") e nella Sala per i tasti del riquadro "🎮 Si gioca a…" ("▶ Entra · giochi dal prossimo turno" e/o "👀 Guarda"). Con `"turno"` o `"mano"` l'host, nel "join" a partita cominciata, mette il nuovo arrivato in una lista `prossimi` (col suo id nella foto: così sa di essere dentro) e lo fa entrare **all'inizio del giro/mano dopo, con 0 punti** (nel modello: `RITARDATARI`, `H.prossimi`, `entrano()`).
- `t.aCheSiamo(testo)` (facoltativo, lo chiama l'host): a che punto è la partita in una riga corta ("Giro 2 di 5", "tocca a Luca", al massimo 40 lettere). Nella Sala chi non gioca lo legge nel riquadro "🎮 Si gioca a Balla · Round 3 di 5"; fuori dalla Sala non fa niente. Il core lo manda al massimo ogni 3 secondi: si può chiamare a ogni giro senza pensarci.
- Il premio del pubblico (`t.pubblico`) **non c'è**: deciso dal proprietario il 16 ott 2026 ("se si è in più di 4 non si gioca la Ruota e basta"). Chi guarda manda solo faccine.
- Nella Sala, coi giochi a due, c'è anche "👑 Chi vince resta" (il campione resta al tavolo, gli altri in coda): il gioco non fa niente di speciale, ma a fine partita chiama `t.tastiFine` **anche per chi guarda** (lì il core gli mette il conto della prossima sfida e torna `true`).

## Online (host-autoritativo)
- Host: `var rete = SGNet.ospita("<id>", { onCodice, onConnesso, onAddio(id), onMsg(id, m), onErrore, onForse(id), onTornato(id) })`. Tiene lo stato vero e manda a tutti una "foto" con `rete.invia({ t: "vm", vm: ... })` (resta sul server per chi arriva dopo). Le cose frequenti, come i tratti di un disegno, vanno con `rete.inviaVeloce(...)`. Un messaggio per un solo telefono si manda a tutti con `to: id`: gli altri lo ignorano.
- Ospite: `SGNet.entra(codice, { onAperto(id), onMsg(m), onChiuso(perché), onErrore })`. In `onAperto` manda `{ t: "join", nome, omino }` e poi solo le sue mosse (`{ t: "mossa", ... }`).
- `onErrore` arriva **solo se il primo collegamento non riesce** (15 secondi): mostra "Riprova" (nel modello: `erroreRete`). Dopo, la rete che salta la gestisce il core ("📶 Mi ricollego…"): il gioco non deve chiudere niente.
- `onChiuso(perché)`: `{ voluto: true }` l'host ha chiuso apposta, `{ sparito: true }` l'host non è tornato (fuori dalla Sala il core mostra già "La stanza è chiusa").
- `onForse(id)` / `onTornato(id)`: un amico è sparito senza salutare / è tornato in tempo (nel modello: 📶 accanto al nome). Dopo 20 secondi arriva `onAddio(id)`. Se poi torna, il suo "join" ha lo stesso id: ridagli il suo posto.
- Nella foto metti sempre `fase` ("lobby", "gioco", "fine"): se l'host ricarica la pagina il core riapre la stanza con lo stesso codice; con `riprende` la partita continua da dove era, senza si riparte dalla saletta.
- I messaggi `"__…"` sono del core: il gioco non li riceve e non deve usare nomi così.
- **Gli id dei giocatori devono comparire nei messaggi di lobby/vm**: chi entra ripete "join" finché non vede il suo id.
- Saletta: `t.lobby({ host, codice, pronta, giocatori: [{ id, nome, omino, host, tu }], min, puoiDaSolo, vuoti, extra: [nodi], attesa, testoComincia, onComincia, onEsci })`. Chiamala a ogni cambio: si aggiorna al suo posto.
- Chi ha un profilo entra da solo (il profilo ormai ce l'hanno tutti): se `t.nomeProfilo()` c'è, niente schermata del nome.
- Fine partita: `t.risultato([{ nome, pos }])`, dove `pos` è il posto (pari merito = stesso posto; i bot con `bot: true`). Poi una schermata finale con le faccine (`t.faccine()`), le medaglie a pari merito (oro, oro, poi argento) e i tasti di `t.tastiFine(...)`; solo se torna `false`, "Nuova partita" per l'host ed "Esci" per tutti. Con più di 6 giocatori la classifica va su due colonne (`class="classifica fitta"`), così i tasti restano a vista. Le foto che arrivano dopo non devono ridisegnare la classifica (il tasto "Ci sto" perderebbe il suo stato).
- Se l'host esce dalla classifica, chi è sulla classifica ci resta e legge "🚪 Paky ha chiuso la stanza" (lo fa il core: `onChiuso` non arriva). Non mettere un tuo "Collegamento perso" sopra la classifica.
- Ogni attesa di un tocco ha un tempo: l'host ha il tasto con `t.contoAvanti(...)`, gli altri la scritta col conto. Nella foto manda i **secondi che mancano** (non l'ora: gli orologi dei telefoni sono diversi).
- Giochi a due (`postiOnline: 2`): gioca solo l'avversario scelto dall'host (il suo id nella foto); chi è in più guarda, senza "Tu" né "Tocca a te", con le faccine. Nella Sala con 3 o più persone il core propone il "⚔️ Torneo a eliminazione" (tabellone con semifinali e finale) o "Una sfida" (l'host sceglie i due): per entrarci il gioco deve stare in `GIOCHI_ELIMINAZIONE` (core.js), mostrare la partita a chi guarda (`t.linkParams.guarda`) e trasmettere quella col Bot (`t.trasmetti`), come dice `AGENTS.md`.
- Mai mandare segreti a tutti (le carte di un altro, i ruoli nascosti): solo al telefono giusto.

## La rete salta, la partita no (Passo 5: ripresa e host di riserva)
Ogni gioco online nuovo **riprende** (nel modello è già tutto fatto: parti da lì).
- `riprende: true` in `SG.registra`: se l'host ricarica la pagina o l'app si chiude e si riapre (entro 20 minuti), il core gli riapre la stessa stanza e passa al gioco la partita di prima in `t.ripresa`. Gli amici non tornano in saletta: leggono «🔁 Paky è tornato: la partita riprende da dove era».
- `riserva: true` (solo con `riprende`): se l'host sparisce del tutto (telefono spento, batteria), dopo pochi secondi un amico (il "vice": i primi due arrivati, o quelli scelti con `t.vici([id, …])`) porta avanti la partita: il core fa partire il gioco sul suo telefono **da host**, con la copia della partita in `t.ripresa` (`daRiserva: true`). L'host di prima che torna rientra da giocatore, col suo posto. **Niente `riserva`** nei giochi a due (l'unico amico è l'avversario: vedrebbe le navi o le carte dell'host) e in quelli in tempo reale. Se ci sono segreti e c'è chi guarda, preferisci lui come vice con `t.vici`.
- **`t.mioId`**: chi tiene la partita su questo telefono, `"host"` oppure, dopo un subentro, l'id da amico del vice. Nel gioco `var IO = t.mioId;` e **IO ovunque** intendi "io che tengo la partita" (il mio posto, le mie mosse, i miei segreti): mai `"host"` scritto fisso.
- **`t.ricorda(stato, soloQui)`** in `bd()`, dopo ogni cambiamento: `stato` = un oggetto **semplice** con fase, giocatori **con gli id**, punti, segreti, mazzi e le **scadenze come ore** (`Date.now() + ms`). Niente timer, niente nodi della pagina, niente funzioni. `soloQui` (facoltativo) = i pezzi grossi che restano su questo telefono e non vanno al vice (es. i tratti di un disegno): la copia per il vice deve stare sotto i 60 KB (gli avatar lasciali fuori: tornano col "join"). Il core salva al massimo ogni mezzo secondo.
- **`t.ricorda(null)`** quando non c'è niente da riprendere: in saletta (anche dopo "Nuova partita") e quando l'host esce apposta (Esci). Prima di `t.risultato` non serve: un risultato uguale a quello già dato per la stessa stanza il core lo ignora (niente XP doppi).
- **`t.ripresa`** = `null` oppure `{ stato, soloQui, io, gen, daRiserva, vecchioHost, eta, ora(x) }`. All'inizio dell'host, se c'è (e la fase non è la saletta):
  1. ricostruisci lo stato da `t.ripresa.stato` (togli i timer, ricostruisci mazzi e liste se li hai salvati in breve);
  2. metti **tutti gli altri `via`**: rientrano da soli in un secondo col loro "join" (stesso id), e lì gli rimandi foto e segreti come sempre (o, come Balla e Taboo, segnali "attesi" e fai uscire chi non torna in 10 secondi);
  3. le ore salvate le converti con `t.ripresa.ora(x)` (sono dell'orologio di chi teneva la partita: per il vice cambia);
  4. riparti con **almeno 5 secondi di respiro**: la fase a metà si rifà da capo (nessun punto dato due volte) o si passa alla successiva; sulla classifica finale si resta lì;
  5. apri la stanza con **`SGNet.ospita(ID, cb, { ripresa: true })`** (così gli amici non tornano in saletta).
- Nella **foto** si mandano sempre i **secondi che mancano**; nello **stato da ricordare** l'**ora** (`Date.now() + ms`). Nelle chiavi di `t.contoAvanti` metti anche un contatore delle riprese (nel modello `vm.rip`): così dopo una ripresa il conto riparte giusto su tutti i telefoni.
- Gli ospiti non fanno niente di nuovo: il loro collegamento ripete il "join" da solo e l'host rimanda foto e segreti.

## Schermo
- Niente titolo in alto e **niente scorrimento** per giocare. A tutto schermo: `.schermata.<pref>-piena{padding:0!important;height:var(--alt,100dvh);overflow:hidden}` con testa e piede nascosti (vedi `horto.js`).
- **Niente lampeggio**: costruisci la schermata una volta e poi aggiorna solo i pezzi che cambiano.
- Numeri col punto delle migliaia; "avatar", non "omino"; nei tasti e nei menu "Bot", in partita i bot fissi di `SG.bot`.
- Stile nel file del gioco (un `<style>` aggiunto una volta), con un prefisso di classe tutto suo.

## Errori già visti (da non ripetere)
- **I tasti di fine partita online non si disegnano a mano**: si chiama `t.tastiFine(piede, { host, nuova, esci })` e solo se torna `false` si mettono i tasti di sempre. Un gioco coi suoi "Rivincita" e "Esci" disegnati a mano nella Sala non ha "Cambia gioco", "Ci sto" né il 3-2-1, e gli amici restano bloccati sulla classifica.
- **"Nuova partita"** (`t.onRivincita`) riporta tutti nella stessa saletta, nella stessa stanza e con gli stessi giocatori (non fa partire subito la partita: il 3-2-1 lo fa il core). Mai chiudere la stanza e riaprirne un'altra, sennò gli amici restano fuori e serve un link nuovo.
- **Chi non è scelto** in "Chi gioca?" (`t.puoSedersi` falso) non va lasciato fuori dalla foto: senza il suo id il telefono ripete "join" all'infinito e non sa di essere dentro. Mettilo tra chi guarda.
- **Messaggi segreti** (la carta, il ruolo, la parola) si mandano con `rete.inviaVeloce({ ..., to: id })`, mai con `rete.invia`: quello resta in stanza e lo riceve chi arriva dopo.
- **`t.risultato`** vuole i **nomi dei giocatori**, mai "Squadra A". Nei giochi a squadre: chi vince al posto 1, gli altri dopo, e se finisce pari tutti al posto 1.
- **Nome di chi entra**: si entra da soli con `t.nomeProfilo()`; la schermata del nome resta solo come riserva (telefoni finti senza profilo).
- **"Esci" a partita iniziata**: per l'host chiede conferma ("Chiudere la partita per tutti?"), perché un tocco sbagliato chiude il gioco a tutti. Con `t.conferma`, mai `window.confirm`. Dalla saletta la conferma la fa già il core: non chiederla due volte.
- **Schermate ferme**: un "Avanti ▶" che aspetta per sempre blocca tutti se chi deve toccare si distrae. Sempre `t.contoAvanti`. Il conto chiama la funzione: mai `bottone.click()` (fa vibrare). Non fare anche un timer a mano che fa la stessa cosa.
- **Partita chiusa su `onErrore`**: no. A partita iniziata `onErrore` non arriva più; se ce l'hai, deve solo offrire "Riprova" al primo collegamento.
- **Chi ricarica o riaccende il telefono**: il suo "join" arriva con lo stesso id. Va rimandata la foto (e i suoi segreti), senza farlo entrare due volte e senza cambiare la schermata dell'host. Se era stato messo "via", rimettilo in partita.
- **Chi arriva a partita cominciata** non va messo in partita a metà: guarda ed entra alla "Nuova partita" (`ritardatari: "partita"`), oppure, se il gioco lo permette, entra dal giro dopo (`"turno"`/`"mano"`). Non deve vedere "Tu" o "Tocca a te" finché non gioca.
- **Chi arriva a metà messo subito tra i giocatori** quando i punti o i turni si contano per posizione (es. La Balla: i voti e le balle del round sono già distribuiti): mettilo in `prossimi` (col suo id nella foto) e fallo entrare all'inizio del round dopo, con 0 punti. E dichiara `ritardatari` in `SG.registra`: senza, nella Sala "👀 Guarda" manda ancora il "join" e il gioco deve far guardare lui.
- **Chi guarda (`t.guarda`) con tasti o segreti**: non ha niente da toccare (il core butta comunque le sue mosse) e non deve ricevere niente di segreto: l'host non sa nemmeno che c'è, quindi i segreti vanno solo con `to:` ai giocatori, e quello che serve per disegnare la partita (il tavolo, il disegno intero) deve stare nella foto comune. Niente fila di faccine né "🏠 Esci" del gioco sopra la targhetta del core: con la targhetta sono doppioni.
- **Ridisegnare a ogni foto** un tasto col conto lo fa ripartire o lampeggiare: crealo una volta per turno (con una chiave del turno) e aggiorna solo i testi.
- **Saletta**: `vuoti` sono solo i posti che mancano per arrivare al minimo, non tutti quelli fino al massimo. Se qualcuno esce, non rimescolare le squadre o i posti già decisi dall'host.
- **Punti e penalità**: rileggi chi deve prenderli o perderli (per esempio, un BUZZ penalizza la squadra di chi ha sbagliato, non quella di chi l'ha visto).
- Nessuna scritta col nome del gioco in alto nello schermo di gioco.
- **`"host"` scritto fisso** dove si intende "io che tengo la partita" (il mio posto, `privato`, `myId`, il tocco dell'host): dopo un subentro chi tiene la partita è il vice, col suo id da amico, e il gioco gli darebbe il posto e i segreti dell'host sparito. Sempre `IO = t.mioId`.
- **Timer o nodi della pagina nello stato da ricordare** (`setTimeout`, schermate, funzioni): non si salvano e la ripresa si rompe. Tienili fuori (nel modello `H.to` resta fuori da `ricorda()`).
- **Scadenze come "secondi che restano" nello stato da ricordare**: dopo la ricarica non si sa più da quando contavano. Nello stato l'ora (`Date.now() + ms`, poi `t.ripresa.ora(x)`); nella foto invece i secondi che mancano.
- **Dimenticare `{ ripresa: true }` in `SGNet.ospita`**: la stanza si riapre ma gli amici tornano in saletta e la partita è persa.
- **Riprendere senza respiro** o rifare una fase dando i punti due volte: dopo la ripresa almeno 5 secondi (gli amici intanto rientrano), poi la fase a metà da capo o la successiva.
- **I pezzi grossi nello stato** (i tratti di un disegno, liste lunghe): la copia per il vice supera i 60 KB e non parte. Vanno in `soloQui` (o non si salvano, e la fase si rifà).
- **Disegni fatti solo per l'host fisso**: la corona in saletta va a chi tiene la partita (nel modello `vm.tiene`), non al primo della lista; i testi "l'host" con i nomi della foto.
- **Nella Sala l'host può cambiare tra una partita e l'altra** (Passo 3: se chi tiene la Sala se ne va, la prende un amico e diventa lui "host"): il gioco non deve contare sul fatto che "host" sia sempre lo stesso telefono fuori dalla partita (niente memorie del gioco legate a "host" tra una partita e l'altra). E quando il core porta via il gioco (Sala passata a un amico, "Cambia gioco") i suoi timer, suoni e sfondi non devono restare sopra la Sala: se la schermata del gioco non è più nella pagina, fermali (già successo con Black Jack, Scarabocchio, Gara di pesca e La Balla).

## Nella pull request: copia questa lista e spunta solo quello che hai davvero fatto
```
- [ ] Partito dal modello: cambiate solo le parti "QUI"
- [ ] id in GIOCHI_ONLINE e CAT_GIOCO (core.js), script in index.html, voce in cima a data/novita.js
- [ ] Nella foto (vm) ci sono gli id dei giocatori; i segreti vanno solo con inviaVeloce + "to"
- [ ] "Nuova partita" riporta tutti nella stessa saletta; "Esci" a partita iniziata chiede conferma con t.conferma
- [ ] Ogni attesa di un tocco va avanti da sola (t.contoAvanti); niente chiusura della partita su onErrore
- [ ] Nella foto c'è "fase"; nessun messaggio del gioco comincia con "__"
- [ ] Faccine (t.faccine) sulla classifica finale e dove si aspetta o si guarda
- [ ] Fine online con t.tastiFine e t.onRivincita; postiOnline; t.puoSedersi nel join (chi non è scelto guarda, col suo id nella foto)
- [ ] impostazioni funziona col box fuori dalla pagina; riga "📜 Si gioca così" chiara (se no riassunto)
- [ ] t.risultato coi nomi dei giocatori (a squadre: chi vince al posto 1); bot da SG.bot.prendi, nei tasti solo "Bot"
- [ ] Col profilo entra da solo
- [ ] Non conta su "host" sempre lo stesso telefono fuori dalla partita; portato via dal core (Sala passata, Cambia gioco) non lascia timer, suoni o sfondi sopra la Sala
- [ ] Provato dalla Sala: una partita intera con 3 amici finti, uno che esce a metà, "↻ Rivincita" col 3-2-1, "🎮 Cambia gioco" (vedi passo2/modello.js)
- [ ] Provato coi telefoni finti: un amico che ricarica la pagina, uno col telefono spento più di 20 s che poi torna, l'host che ricarica, uno che arriva a partita cominciata
- [ ] riprende: true; IO = t.mioId (mai "host" fisso); t.ricorda in bd (stato semplice, ore assolute, niente timer né nodi; i pezzi grossi in soloQui); t.ricorda(null) in saletta e su Esci; SGNet.ospita(ID, cb, { ripresa: true }) con la partita ripresa
- [ ] riserva: true solo se il gioco non è a due né in tempo reale
- [ ] Provato: l'host ricarica in ogni fase (a metà, a fase decisa, sulla classifica, in saletta) e la partita riprende senza punti doppi; l'host si spegne e non torna (se riserva): un amico porta avanti la partita fino alla classifica (vedi passo5/modello.js)
- [ ] `ritardatari` dichiarato ("partita", "turno" o "mano"); chi arriva a metà entra quando dice (provato dalla Sala: «▶ Entra» o «👀 Guarda»)
- [ ] Provato con `#gioco=<id>&stanza=<codice>&guarda=1`: chi guarda vede la partita fino alla fine, senza segreti, senza "Tu", con la targhetta del core (niente faccine né "Esci" del gioco sopra), e alla "Nuova partita" entra da solo (vedi passo6/modello.js)
- [ ] (facoltativo) t.aCheSiamo("Giro 2 di 5") dall'host a ogni giro
- [ ] Console senza errori; schermi 360x640 e 412x915 senza scorrere
```
Se un punto non l'hai potuto provare, scrivilo chiaramente: lo controllo io.

## Prima di aprire la pull request
- Segui la skill `prova-nel-browser`: partita locale, partita online con amici finti, console senza errori, schermo di un telefono piccolo (360x640) e grande (412x915).
- Online usa i **telefoni finti** (`telefoni-finti.js` della skill `prova-nel-browser`): `apriTel`, `ricarica`, `spegni`/`riaccendi` (più di 20 s), `erroriTel()`. Per provare un gioco non ancora in `GIOCHI_ONLINE` (per esempio il modello) nella Sala, registralo al posto di un gioco online vero: `passo2/modello.js` della skill `prova-nel-browser` fa così (`apriTel(nome, { salaSempre: true, comeGioco: "garapesca", prima: w => w.eval(testo) })`, scenari 240-241) e si copia per un gioco nuovo.
- Ripresa e host di riserva: `passo5/modello.js` della skill `prova-nel-browser` (scenari "5m1" l'host ricarica in ogni fase, "5m2" l'host si spegne e non torna, "5m3" le due cose nella Sala) si copia allo stesso modo. Aiuti del copione: `ricarica`/`chiudiApp` (telefoni finti), `COPIONE.aiuti.muore`/`torna` (telefono spento davvero / riacceso), `chiTiene(C)` (chi tiene la partita: `_g`, `_h`), `pilloleDi`, `contaStoria(C, '"__esito"')` (esiti doppi).
- Chi guarda e chi arriva a metà: `passo6/modello.js` della skill `prova-nel-browser` ("6m1": Bea guarda col link `&guarda=1`, Marco arriva nella Sala a metà e tocca «👀 Guarda», alla Rivincita giocano tutti e due; "6m2": il modello con `RITARDATARI = "turno"`, Marco tocca «▶ Entra» ed entra al giro dopo con 0 punti) si copia allo stesso modo.
- Regole con i bot: tienile in funzioni separate dalla grafica e simula tante partite.
- Voce in `data/novita.js`; pull request (mai su `master`) con la spiegazione in italiano semplice.

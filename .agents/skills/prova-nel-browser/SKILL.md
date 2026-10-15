---
name: prova-nel-browser
description: Usala per provare una modifica a SPeeD GAME prima di consegnarla. Spiega come aprire l'app, come fingere un profilo e degli amici collegati senza account veri, e cosa controllare.
---

# Provare nel browser

Non ci sono test automatici: si prova l'app vera in un browser, anche senza schermo (Playwright o simili).

## Aprire l'app
- Servi la cartella del progetto con un server statico qualsiasi (per esempio `python3 -m http.server 8000`) e apri `http://localhost:8000/`.
- Per provare la versione da pubblicare: `bash costruisci-versione-online.sh` e apri `http://localhost:8000/dist/index.html`.
- La console non deve avere errori. I 404 delle foto dei giochi che mancano (`carte/giochi/<id>.jpg`) sono normali: al loro posto si vede l'emoji.
- Prova su uno schermo da telefono piccolo (360x640) e grande (412x915): niente deve scorrere o finire fuori schermo.

## Profilo finto e amici finti (mai account o password veri)
Esegui nella pagina, prima di aprire il gioco:
```js
window.__fp = { nome: "Paky", fiches: { blackjack: 1000 }, omino: SGOmino.casuale("Paky") };
SGNube.disponibile = () => true; SGNube.pronto = () => true; SGNube.profilo = () => __fp;
SGNube.salvaProgressi = () => {}; SGNube.statGioco = () => ({}); SGNube.salvaFiches = () => {};
window.__inviati = [];                               // tutto quello che l'host manda finisce qui
SGNet.disponibile = () => true;
SGNet.ospita = (gid, cb) => {                        // l'host non si collega davvero
  window.__cbHost = cb;
  setTimeout(() => { cb.onCodice("ABCD"); cb.onConnesso(); }, 50);
  return { invia: m => __inviati.push(m), inviaVeloce: m => __inviati.push(m), inviaA: () => {}, chiudi: () => {} };
};
SG.avviaApp();
```
- Apri il gioco, scegli "Online" e "Apri la stanza": sei nella saletta come host. (Così, a mano, vale per il percorso di prima: metti prima `localStorage.setItem("sg-sala-sempre", "0")`, se no "Online" apre la Sala. Per la Sala usa i telefoni finti qui sotto.)
- Un amico entra: `__cbHost.onMsg("g1", { t: "join", nome: "Luca", omino: null })`. Poi manda le sue mosse con `__cbHost.onMsg("g1", { t: "...", ... })`.
- Quello che vedrebbero gli altri telefoni: `__inviati.filter(m => m.t === "vm").pop().vm`.
- Per provare il lato di chi entra: sostituisci `SGNet.entra = (codice, cb) => { window.__cbOsp = cb; setTimeout(() => cb.onAperto("g1"), 30); return { invia: m => ..., chiudi: () => {} }; }`, apri `#gioco=<id>&stanza=ABCD` e passagli le foto con `__cbOsp.onMsg({ t: "vm", vm: {...} })`.
- Più telefoni insieme (host + ospiti collegati da un finto broker MQTT): `telefoni-finti.js` qui accanto. Ogni telefono è un iframe con memoria sua (localStorage e sessionStorage separati) e profilo finto (`{ profilo: false }` = senza profilo). Si aprono con `apriTel(nome, { hash })`, si guidano con `clicca(w, /testo/)` e `aspetta(...)`; le cose dei telefoni veri: `spegni`/`riaccendi` (schermo bloccato, rete persa: parte il "testamento"), `inciampa` (la rete salta un attimo), `ricarica` (pagina ricaricata), `chiudiApp` (app chiusa e riaperta).
- **Copione di prova** (`copione-prova.js` qui accanto): ripete da solo gli scenari dell'online (host che ricarica, stanza ferma, chi arriva tardi, nomi doppi, rete che salta, Sala, partite intere di Tris, Scalinata e Linea del tempo…) e scrive OK o NO. Da una pagina qualsiasi del sito, nello strumento javascript:
  `const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s); await COPIONE.prova(3)` (oppure `await COPIONE.tutti()`, qualche minuto). Dopo ogni modifica all'online rilancialo; gli scenari nuovi si aggiungono in fondo.
- **Saletta viva** (scenari 24-34 del copione): chi arriva ("pling", "Ciao Luca! 👋") e chi esce, "✋ Sono pronto!", faccine (al massimo una al secondo), avatar grigio con 📶, "Fai uscire" e "🔒 Chiudi la porta" (anche nella Sala), 3-2-1-Via! su tutti i telefoni, "Parti da solo quando tutti sono pronti", musichetta 🎵/🔇, nomi buffi col 🎲, sei telefoni in uno schermo da 360x640 e 412x915. I suoni sul computer di prova sono spenti (blocchetto in `index.html`): si provano a codice con `apriTel(nome, { prima: audioFinto })`, un motore audio finto che segna le note in `w.__note` (pling 1319+1976 Hz, bip del 3-2-1 587-659-784 Hz, il basso della musichetta sotto i 130 Hz).
- Con la finestra del browser nascosta le animazioni e le transizioni CSS restano ferme (la foto mostra il primo fotogramma) e il "resize" di un telefono arriva tardi: per misurare o fotografare la saletta togli le animazioni con uno stile (`.schermata{animation:none!important} .sl-av,.sl-nome{transition:none!important}`) e dopo aver cambiato misura all'iframe manda tu `w.dispatchEvent(new w.Event("resize"))` (lo fa già `controllaSchermo` nel copione).
- **Copione dei giochi** (`copione-giochi.js`, da caricare dopo il copione): partite online intere con ricariche e telefoni spenti (101 Tris, 102 Scalinata, 103 Linea del tempo, 104 Black Jack) e altri casi dell'online (105-111: host che chiude apposta, host di riserva, host che ricarica due volte o durante il voto, amico che ricarica nella Sala, avversario spento più di 20 s). `const g = await (await fetch("/.agents/skills/prova-nel-browser/copione-giochi.js?" + Date.now())).text(); (0, eval)(g); await COPIONE.prova(101)`.
- Il collegamento vero (`js/net.js`) si prova solo se serve, sul broker pubblico: un host e un ospite nella stessa pagina funzionano.

## Passo 2: la Sala della serata ("Online" = Sala)
- Per chi gioca, "Online" da un gioco apre sempre la Sala (interruttore `SALA_SEMPRE` in core.js). Su un telefono solo la Sala si spegne con `localStorage.setItem("sg-sala-sempre", "0")`: torna il percorso di prima ("🔗 Apri la stanza", link di un gioco solo).
- **Telefoni finti**: di partenza hanno `sg-sala-sempre = "0"` (così gli scenari vecchi 1-34, 90-97 e 101-111 restano sul percorso di prima). Gli scenari nuovi (35 in su) aprono i telefoni con `apriTel(nome, { salaSempre: true })`.
- **Un modo solo per le prove** (dal copione): `COPIONE.aiuti` (gli aiuti del copione: `T`, `vm`, `ids`, `no`, `codiceSaletta`, `apriSalaNuova`, `salaConAmici`, `lanciaDallaSala`, `trisFinoAllaFine`, `scalinataFinoAllaFine`, `tastiFineDi`, `spiaVia`, `chiGioca`, `passaChiGioca`, `toccaGiocoSala`, `regoleDi`, `controllaSchermo`, `misureFine`, `misureChi`…), `COPIONE.aggiungi(n, { nome, fai })` per uno scenario nuovo, `await COPIONE.carica("passo2/gruppo-a.js")` per caricare un file di prova. I file nuovi stanno in una cartella per passo (`passo2/`, `passo3/`, `passo5/`, `passo6/`).
- **Scenari del Passo 2** nel copione: 35-37b "Online" = Sala e interruttore; 38-39 testata della Sala (codice, Invita, porta); 40-41 home con «🔗 Gioca online» e «🔑 Ho un codice» a 4 caselle; 42-44b chi arriva («Arrivano 3 su 4», «Comincia senza Marco», «entri alla prossima»); 45 regole visibili agli amici; 46-49 fine uguale per tutti (Rivincita col 3-2-1, «👍 Ci sto!», Cambia gioco, fuori dalla Sala); 50 Classifica della serata (accesa da sola, «🔄 Azzera», «🏁 Chiudi e premia»); 51-53 «Chi gioca?» e il duello senza l'host; 54 la serata intera (5 telefoni, 6 giochi, tocchi contati), 55 le misure delle schermate nuove, 56 la lista dei 23 giochi (entra, gioca, Rivincita, Cambia gioco, impostazioni fuori pagina; `COPIONE.prova(56, { solo: ["tris"] })`); 60-62 i bot fissi; 70-77 il Torneo a eliminazione nei giochi a due (77: coppie «✋ Scegliete voi»); 78 la «Serata a punti» sullo stesso telefono; 90 il primo avatar (lui/lei → look → Fatto, aiuto `primoAvatar`). Per chiamare la fine di un gioco senza giocarlo: `spiaTavolo()` e `apriTel(nome, { spiaTav: ["timeline"] })` → `w.__tav.fine([...])`.
- **File del Passo 2** (`passo2/`): `gruppo-a.js` … `gruppo-d.js` (201-237: i 23 giochi nella Sala, uno scenario per gioco, con le varianti `…f` dopo la fine del core e `…h` dopo «Chi gioca?»), `bot-gruppo-a.js` … `bot-gruppo-d.js` (261-264: i bot fissi nei giochi), `modello.js` (240-241: il modello dei giochi nuovi nella Sala), `controllo.js` (281-287, i casi cattivi della verifica: l'host che ricarica mentre ci si siede o a torneo in corso, chi gioca col Bot che ricarica, chi esce dopo essersi seduto, «Fate il torneo in 5» fuori dalla Sala, il primo avatar lasciato a metà; 286 = ogni gioco e ogni modo sullo stesso telefono dalla home al tavolo senza errori, `COPIONE.prova(286, { solo: ["tris"] })`).
- **Pezzi già pronti dei passi 3 e 6** (si caricano come quelli del Passo 2): `passo3/rete.js` (301-308, la rete della Compagnia: sbirciata, prima guardo poi parlo, seguiHost), `passo3/tessere.js` (361-367, la Compagnia: memoria, link, tessere della home), `passo6/ruota.js` (650-654, «Scegliamo insieme»: scheda del voto e ruota), `passo6/amici.js` (655-660, amici online e inviti). I numeri 301-422 sono del Passo 3, 501-599 del Passo 5, 600 in su del Passo 6.
- Due schede che fanno girare il copione insieme rallentano tutto e danno NO finti (tempi, «non trovo…»): una scheda sola, e i NO si rifanno da soli in una scheda appena ricaricata.
- Un gioco che non è in `GIOCHI_ONLINE` (il modello, un gioco nuovo) si prova nella Sala registrandolo al posto di uno vero: vedi `passo2/modello.js` (`opz.comeGioco`).
- I telefoni finti rispondono "sì" da soli alle conferme dell'app: per provare "Resta" nel copione ci sono `fermaSiDaSolo` / `riprendiSiDaSolo`.

## Cosa controllare sempre
- Partita locale dall'inizio alla fine; partita online con 2–3 amici finti, compreso uno che esce a metà (`__cbHost.onAddio("g1")`).
- "⚙️ Regole" nella saletta (se il gioco ha impostazioni) e la riga "📜 Si gioca così" che leggono gli amici.
- Dalla Sala: a fine partita i tasti del core ("↻ Rivincita" col 3-2-1 da solo, "🎮 Cambia gioco", "👍 Ci sto!"), e con più amici dei posti "Chi gioca?" (chi non è scelto guarda).
- Il tocco sui telefoni: usa eventi pointer (pointerdown/pointerup), perché su iPhone il click a volte non arriva.
- Nessun lampeggio: durante una mossa non si deve ricostruire tutta la schermata.

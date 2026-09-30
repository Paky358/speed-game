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
- Apri il gioco, scegli "Online" e "Apri la stanza": sei nella saletta come host.
- Un amico entra: `__cbHost.onMsg("g1", { t: "join", nome: "Luca", omino: null })`. Poi manda le sue mosse con `__cbHost.onMsg("g1", { t: "...", ... })`.
- Quello che vedrebbero gli altri telefoni: `__inviati.filter(m => m.t === "vm").pop().vm`.
- Per provare il lato di chi entra: sostituisci `SGNet.entra = (codice, cb) => { window.__cbOsp = cb; setTimeout(() => cb.onAperto("g1"), 30); return { invia: m => ..., chiudi: () => {} }; }`, apri `#gioco=<id>&stanza=ABCD` e passagli le foto con `__cbOsp.onMsg({ t: "vm", vm: {...} })`.
- Il collegamento vero (`js/net.js`) si prova solo se serve, sul broker pubblico: un host e un ospite nella stessa pagina funzionano.

## Cosa controllare sempre
- Partita locale dall'inizio alla fine; partita online con 2–3 amici finti, compreso uno che esce a metà (`__cbHost.onAddio("g1")`).
- "⚙️ Regole" nella saletta (se il gioco ha impostazioni) e "Nuova partita" a fine gioco.
- Il tocco sui telefoni: usa eventi pointer (pointerdown/pointerup), perché su iPhone il click a volte non arriva.
- Nessun lampeggio: durante una mossa non si deve ricostruire tutta la schermata.

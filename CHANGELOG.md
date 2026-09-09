# Diario delle modifiche

_Cosa è stato aggiunto all'app, dalla più recente. Le stesse novità si vedono
anche dentro l'app, dal tasto **🆕 Novità** nella schermata iniziale. Il
contenuto di quel tasto vive in `data/novita.js`._

## 8 settembre 2026 — Sfida a punti, voti, timer e nuova grafica
- **Timer di 30 secondi** a turno (se scade, conta come sbagliata).
- **Punteggi**: giusta +100, sbagliata −100. Se sbagli **la data resta segreta** e
  la carta **non** entra nella linea (ma viene consumata comunque).
- **Voto degli altri (online)**: quando un giocatore sceglie, agli altri lo schermo
  mostra il punto scelto e votano 👍/👎. Chi vota giusto +50, chi sbaglia −50.
- **Classifica sempre visibile** in alto durante il gioco + **classifica finale
  animata**.
- **Suoni e vibrazione** in base al contesto; **grafica più moderna**.

## 8 settembre 2026 — Partita più bella e più chiara
- **La partita finisce solo quando TUTTI hanno finito le carte** (non più al primo
  che le esaurisce). Chi finisce è "a posto", gli altri continuano; vince chi ha
  finito per primo. Nessun limite di tempo.
- Chi ha finito le sue carte viene **saltato** nei turni successivi.
- **Descrizioni sempre visibili**: si vedono già mentre scegli dove mettere la carta
  (non più solo dopo) e restano scritte sotto ogni evento della linea del tempo.
- **Ritocco grafico** generale (sfondo, bottoni, tessere, tabellone).

## 8 settembre 2026 — Si gioca anche "ognuno dal proprio telefono"
- Chi organizza sceglie all'inizio la modalità: **un telefono solo** (si passa di
  mano) oppure **ognuno dal suo telefono**.
- Nella modalità online l'host apre una **stanza** con un codice; gli amici entrano
  aprendo il link o digitando il codice. Nessun account, nessun server da gestire:
  i messaggi passano da un "ufficio postale" pubblico e gratuito (broker MQTT),
  così il collegamento funziona su qualsiasi rete, anche da cellulare.
- Tutto è **gestito dall'host** (crea, sincronizza, decide i turni): un'unica copia
  vera della partita, così i telefoni non possono mai andare fuori sincrono.
- Funziona quando il gioco è aperto dal **sito pubblicato** (non da un file locale
  né dall'anteprima): vedi `docs/METTERE-ONLINE.md`.

## 8 settembre 2026 — Categorie e link per gli amici
- La linea del tempo ora è divisa in **categorie**: Storia, Invenzioni e scoperte,
  Calcio, Rap italiano, Cinema. Si attivano tutte insieme o solo alcune.
- Chi organizza sceglie categorie e carte **prima**, poi con un tasto crea un
  **link già impostato** da mandare agli amici: aprendolo, il gioco parte con
  quelle stesse impostazioni.
- Aggiunti molti avvenimenti nuovi e verificati (calcio, rap italiano, cinema).
  Ogni categoria vive in un file a parte in `data/` — aggiungerne altri non
  richiede di toccare il gioco.

## 8 settembre 2026 — Arriva il tasto Novità
- Aggiunto il tasto **🆕 Novità** nella home: un elenco di tutto ciò che viene
  aggiunto, così si sa sempre cosa è cambiato.
- Un pallino rosso avvisa quando c'è una novità non ancora vista; sparisce dopo
  che la si apre.

## 8 settembre 2026 — Primo gioco: La linea del tempo
- Prima versione dell'app, con il gioco **La linea del tempo** completo e
  giocabile dall'inizio alla fine.
- Da 1 a 8 giocatori, un solo telefono che passa di mano in mano.
- Circa 90 avvenimenti veri e verificati, ognuno con una riga che racconta il fatto.
- Ossatura comune (home, giocatori, punteggio, tabellone finale con medaglie,
  Rigioca / Torna ai giochi).

## 9 settembre 2026 — Tantissimi nuovi avvenimenti
- Aggiunti 70 avvenimenti nuovi e verificati (storia, invenzioni, calcio, rap italiano, cinema): ora sono circa 200 in tutto.

## 9 settembre 2026 — Oltre 800 avvenimenti e fino a 10 giocatori
- Importate 600 carte nuove dal set delle 750 (57 doppioni evidenti + 93 doppioni di significato scartati): totale 804.
- Massimo giocatori portato da 8 a 10, con limite applicato anche alla stanza online.

## 9 settembre 2026 — Nuovo gioco: L'Asta
- Secondo gioco della raccolta: asta a 4 round su tema (Sopravvivenza Zombie), 2-10 giocatori, un telefono sul tavolo.
- Base 1 credito, rilanci di 1, timer 10s dopo ogni rilancio, paga solo il vincitore, riserva di 1 credito per ogni round futuro.
- Assegnazione automatica a 1 credito quando resta un solo giocatore e una sola carta.
- Finale con riepilogo dei kit, votazione a stelle (1-5, non il proprio) e podio.
- Corretto un difetto del motore: gli attributi non impostati disabilitavano i pulsanti.

## 9 settembre 2026 — Asta: tre temi da 184 carte
- Nuovi temi La Pizza Perfetta e Il Panino Perfetto, oltre a Sopravvivenza Zombie.
- Tutti e tre ampliati a 184 carte (46 per round: 14 A, 18 B, 14 C), solo ingredienti veri e coerenti col round.
- Revisione manuale delle fasce: corretti Pollo alla Griglia (da A a B) e Roast Beef (da B ad A).

## 9 settembre 2026 — Profilo e La Sala
- Profilo con nome e faccina salvato sul telefono; ingresso diviso in Crea profilo / Accedi.
- La Sala: il gruppo di partecipanti resta tra una partita e l altra.
- A fine partita: Rigioca, Cambia gioco o torna alla Sala, sempre con gli stessi giocatori.

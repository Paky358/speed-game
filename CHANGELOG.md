# Diario delle modifiche

_Cosa è stato aggiunto all'app, dalla più recente. Le stesse novità si vedono
anche dentro l'app, dal tasto **🆕 Novità** nella schermata iniziale. Il
contenuto di quel tasto vive in `data/novita.js`._

## 10 settembre 2026 (3) — Il tema La Palestra di Quartiere
- **🏋️ La Palestra di Quartiere**: 184 carte in L'Istruttore di Sala, Il Compagno
  d'Allenamento, L'Attrezzo Libero, Lo Spogliatoio. Stesso tono da spogliatoio
  del tema Calcetto.
- I temi dell'Asta diventano undici.

## 10 settembre 2026 (2) — Il tema La Squadra da Calcetto
- **⚽ La Squadra da Calcetto**: 184 carte in Il Portiere, Il Difensore, Il
  Centrocampista, L'Attaccante. Tono da spogliatoio scritto direttamente dal
  proprietario, tenuto come modello per i temi futuri.
- I temi dell'Asta diventano dieci.

## 10 settembre 2026 — Giardino, Vacanza e Coinquilino
- **🌳 Il Giardino Perfetto**: 184 carte in Il Terreno, L'Attrazione, Sport e
  Divertimento, L'Infestante. Nell'ultimo round la logica è al contrario di
  Supereroi: la fascia alta sono gli ospiti belli, la bassa le invasioni.
- **🏝️ La Vacanza Perfetta**: 184 carte in Il Mezzo di Trasporto, L'Alloggio,
  Il Compagno di Viaggio, L'Attività.
- **🏠 Il Coinquilino Ideale**: 184 carte in L'Abitudine Notturna, La Specialità
  in Cucina, L'Animale Domestico, Il Pagamento dell'Affitto. Tono da spogliatoio
  più marcato: indicato dal proprietario come il tema più riuscito finora.
- I temi dell'Asta diventano nove.

## 9 settembre 2026 — Supereroi e Primo Appuntamento
- **🦸 Supereroi**: 184 carte in quattro round — Il Superpotere ⚡, Il Costume 🥋,
  Il Gadget 🔫, Il Punto Debole ☠️. Nel round finale la fascia alta è la debolezza
  rarissima, la fascia bassa l'imbarazzo quotidiano.
- **💘 Il Primo Appuntamento**: 184 carte in quattro round — La Location 📍,
  L'Outfit 👗, L'Argomento 💬, L'Imprevisto 🌧️.
- Il quarto round dell'appuntamento doveva essere "La Conclusione": è stato
  cambiato perché il finale non si compra, deve venire fuori dalla combinazione
  delle carte e poi lo votano gli altri. Regola valida per tutti i temi futuri.
- I temi dell'Asta diventano sei.

## 9 settembre 2026 — L'Asta online e il tema "Il Colpo del Secolo"
- **L'Asta si gioca anche a distanza**: chi organizza sceglie all'inizio fra *Un
  telefono solo* e *Ognuno dal suo telefono*. Nel secondo caso l'app apre una
  **stanza con codice** e un link da mandare agli amici.
- Online ognuno **rilancia dal proprio telefono**, vede offerta e crediti in tempo
  reale, sceglie la sua carta quando tocca a lui e **vota in segreto** i kit degli
  altri (mai il proprio). Tutto è tenuto insieme da chi ha aperto la stanza.
- **Nuovo tema: 💰 Il Colpo del Secolo** — 184 carte in quattro round: La Mente 🧠,
  I Muscoli 💪, La Fuga 🚗, Il Nascondiglio 🏝️.
- I temi dell'Asta diventano quattro: Zombie, Pizza, Panino, Rapina.

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

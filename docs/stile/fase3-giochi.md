# 🤍 Bianco e oro — fase 3: i giochi

Scritto il 26 ott 2026 dalla chat «🎨 Stile», dopo la fase 2 (home, profilo, saletta, Sala, «Come giocate?», impostazioni, trofei, classifiche, editor dell'avatar e finestre già in Bianco e oro).

**Com'è adesso:** le schermate prima e dopo la partita sono chiare e dorate; la partita vera (tavolo, campo, studio TV) è rimasta com'era, scura. Le impostazioni e le salette di tutti i giochi sono già leggibili.

**Come si converte un gioco** (già pronto nel motore dell'app):
- `tema: "oro"` in `SG.registra` → tutte le schermate del gioco diventano chiare;
- oppure `t.schermata({ chiara: true })` → solo quella schermata (es. la classifica finale, «Entro nella partita…», gli errori).
- I colori stanno tutti in un punto solo: le variabili `--o-*` in fondo a `css/styles.css` (sezione «BIANCO E ORO»).

## Lo studio TV: resta com'è (deciso dal proprietario il 27 ott 2026)

Vista la proposta «studio in Bianco e oro» (docs/stile/proposte/studio.html) il proprietario ha detto: «non modificare lo studio, tutto oro non mi piace». Lo studio non si tocca; nei suoi 7 giochi diventa chiara solo la cornice. Sotto la nota di prima, per memoria.

### (nota di prima)
Sette giochi usano lo stesso studio da game show scuro (`js/studio.js`): **La Balla Colossale, Nomi Cose e Città, Parola d'ordine, La Patata Bollente, Il Prezzo è Giusto, La Ruota della Fortuna, La Linea del tempo**. Rifarlo una volta in versione «studio elegante» (avorio, legno chiaro, luci calde, oro) cambia sette giochi insieme. Lavoro: **grande** (circa una giornata di lavoro di un aiutante), ma vale per sette.

## I giochi, da quello che stona di più
Voto: quanto stona oggi (5 = moltissimo). Lavoro: **piccolo** (meno di un'ora), **medio** (qualche ora), **grande** (una giornata o più).

| # | Gioco | Stona | Perché stona | Lavoro |
|---|---|---|---|---|
| 1 | 🏒 Glow Hockey | 5 | neon puro su nero | piccolo se il campo resta scuro come «oggetto» (solo fine e schermate di servizio); grande per un campo chiaro |
| 2 | 🐎 Horto Muso | 5 | mondo illustrato cartoon (cielo, tribuna, fantini) | medio (classifiche e contorno), grande per ridisegnare la pista |
| 3 | 🔴 Palla Matta | 5 | arcade neon, capitoli colorati | grande (disegni su canvas), piccolo solo per le parti comuni |
| 4 | 🫵 Chi di Noi? | 5 | viola festaiolo ovunque | grande (circa 200 righe di stile e 4 disegni) |
| 5 | 💣 La Patata Bollente | 5 | bomba, esplosioni, allarme rosso | medio la fine, il resto con lo studio TV |
| 6 | 🎯 Palla a Pendolo | 5 | scena cartoon su canvas | piccolo la fine, grande la scena |
| 7 | 🏷️ Il Prezzo è Giusto | 5 | programma TV con sipario, neon | grande, con lo studio TV (la fine è già pronta) |
| 8 | 🎡 La Ruota della Fortuna | 5 | tabellone TV verde, ruota colorata | grande, con lo studio TV (la fine è piccola) |
| 9 | 🔨 L'Asta | 4 | sala d'asta e stadio illustrati | grande (3 scene disegnate); piccolo per le schermate di contorno |
| 10 | 🤥 La Balla Colossale | 4 | studio TV | con lo studio TV; la classifica finale è piccola |
| 11 | ⚽ Calcio Biliardo | 4 | campo notturno al neon | medio (il campo può restare scuro come oggetto) |
| 12 | 📡 Stessa Lunghezza d'Onda | 4 | cielo stellato viola, quadrante, tenda | grande la scena; piccolo fine e squadre |
| 13 | 🪜 La Scalinata | 4 | arcade su notte blu | medio |
| 14 | 🃏 Scopa, Scopa 2 vs 2, Scopone | 4 | tavolo 3D con feltro e legno, targhe colorate | grande, ma una volta sola per tutte e tre |
| 15 | 📜 La Linea del tempo | 4 | studio TV + blu notte; il contenuto (foto vere) si presta benissimo a un look «da museo» | medio-grande |
| 16 | 🃏 Black Jack | 3 | tavolo verde da casinò (non cartoon) | medio: tenere il feltro, cornice e tasti in oro |
| 17 | ♠️ Poker | 3 | come Black Jack, bottoni saturi | medio |
| 18 | 🍹 Da dove viene? | 3 | foto vere su verde petrolio: già sobrio | medio |
| 19 | 🎣 Gara di pesca | 3 | il laghetto è anche nel mondo | piccolo (le schermate attorno sono pronte) |
| 20 | 🚢 Battaglia Navale | 3 | mare blu notte, navi d'acciaio | medio |
| 21 | ✍️ Nomi, Cose e Città | 3 | studio TV, ma il foglio a righe è già «carta» | piccolo senza lo studio |
| 22 | 🕵️ Parola d'ordine | 3 | il tabellone è già avorio; stona lo studio intorno | medio senza lo studio |
| 23 | 🎨 Scarabocchio | 3 | viola scuro, ma il foglio da disegno è già bianco | medio |
| 24 | 🤨 Sì... però | 3 | piatto, solo colori delle squadre | medio |
| 25 | 🤐 Taboo | 3 | blocchi grandi su blu scuro | medio |
| 26 | ☝️ Una parola sola | 3 | viola con cartiglio giallo | medio |
| 27 | 🟡 Drop 4 | 2 | griglia neutra | piccolo |
| 28 | 🕵️ L'Impostore | 2 | già piatto e pulito | medio-piccolo (sullo stesso telefono è quasi pronto) |
| 29 | ⭕ Tris | 2 | minimale | piccolo: il più veloce di tutti |

## Ordine consigliato
1. **Subito, piccolo:** le schermate «di servizio» di tutti i giochi («Entro nella partita…», errori, classifiche finali) chiare, così da quando si apre il gioco a quando finisce la cornice è tutta Bianco e oro. Poi **Tris, Drop 4, L'Impostore, Gara di pesca** interi.
2. **I giochi «piatti»:** Taboo, Una parola sola, Sì... però, Scarabocchio, Da dove viene?, La Scalinata, Battaglia Navale, Parola d'ordine (senza lo studio).
3. **I tavoli da casinò** (Black Jack, Poker, Scopa, Scopa 2 vs 2, Scopone): il feltro verde scuro resta (è già elegante), cornice, tasti e scritte in avorio e oro.
4. **Lo studio TV** una volta sola → sette giochi insieme.
5. **Le scene illustrate** (Horto Muso, Palla Matta, Palla a Pendolo, Glow Hockey, Calcio Biliardo, Chi di Noi?, l'Asta, Stessa Lunghezza d'Onda): sono disegni; si può decidere caso per caso se ridisegnarli o tenerli come «oggetti» incorniciati dal nuovo stile.

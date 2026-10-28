# 🌙 Notte vivace — passo 3: i giochi, dal più stonato al meno

> Il 28 ott 2026 era stato deciso di NON unire i 16 giochi convertiti al Bianco e oro del ramo `grafica-luxury`. Il gruppo A qui sotto propone di riprenderli perché con le variabili di Notte vivace vengono scuri da soli: si fa SOLO col sì del proprietario.

Fatto il 29 ott 2026 dalla chat «🌙 Notte vivace» (passo: guardare i 31 giochi in partita, a 390x844, sulla copia `SG-notte`).
Le foto (390x844, com'è oggi e come verrebbe con l'unione dei 16 giochi del ramo `grafica-luxury`) sono rimaste nella cartella di lavoro temporanea della chat: per rivederle si rifanno con lo strumento delle foto.

**Come leggere i voti** (per lo stile scuro nuovo): 1 = va già bene così · 2 = un ritocco · 3 = si nota, ma è facile · 4 = stona molto, c'è da rifare disegni · 5 = sembra un'altra app.
**Lavoro:** piccolo = meno di un'ora · medio = qualche ora · grande = una giornata o più.
Dove c'è «3 → 1» vuol dire: oggi 3, dopo la cosa da fare (di solito l'unione descritta nel gruppo A) 1.

---

## La scoperta più importante (cambia tutto il piano)

**Sul ramo `grafica-luxury` ci sono già 16 giochi convertiti** (Black Jack, Da dove viene?, Drop 4, Gara di pesca, L'Impostore, Battaglia Navale, Poker, La Scalinata, Scarabocchio, Scopa, Scopa 2 vs 2, Scopone, Sì... però, Taboo, Tris, Una parola sola). Quella conversione usa solo le variabili `--o-*`, che nella copia Notte sono già scure: quindi **venuti fuori scuri e col lampone da soli**.
L'ho provato davvero: ho fatto una copia a parte (`copia-unione\`, solo nel mio scratchpad), ci ho messo le 16 versioni di quel ramo e ho rifatto le foto (file `*-390x844-conv.png`). Tris, Taboo, Poker, Navale, Impostore, Una parola sola vengono già belli; Drop 4, Sì però, Scarabocchio e Black Jack quasi. I 16 file non sono stati toccati dalla chat Notte dopo il punto in cui i due rami si sono separati: si prendono pari pari, senza conflitti.
Restano da ritoccare solo i colori pensati per il fondo chiaro (vedi le righe).

---

## Prima: i lavori che si fanno una volta per tutti

| Gruppo | Giochi che cambiano | Cosa fare | Lavoro |
|---|---|---|---|
| **A. Unire le 16 conversioni dal ramo `grafica-luxury`** | Black Jack, Da dove viene?, Drop 4, Gara di pesca, Impostore, Navale, Poker, Scalinata, Scarabocchio, Scopa, Scopa 2 vs 2, Scopone, Sì però, Taboo, Tris, Una parola sola | Prendere i 16 file del ramo, poi ritoccare i colori «da fondo chiaro» rimasti: X e O del Tris (blu e rosso scuri sul fondo scuro), nomi e tasti pastello della Scalinata, il quadrato grigio «VS» di Drop 4, le ombre marroni. Poi riguardare le 16 schermate a 360x640 e 412x915. | **medio** (2-4 ore in tutto, per 16 giochi) |
| **B. Schermate di servizio di tutti i giochi** («Entra nella partita», errori, «Serve il sito pubblicato», classifica finale) | i 15 giochi non convertiti | Oggi queste schermate perdono il look nuovo e tornano al vecchio blu col nido d'ape. Basta il segnale `chiara: true` su ognuna (nome rimasto dal Bianco e oro: vuol dire «schermata del core, scura Notte»). Il ramo `grafica-luxury` l'ha già fatto per Nomi Cose, Parola d'ordine, Palla Matta, Patata, Pendolo, Prezzo, Ruota, Timeline (poche righe ciascuno): si possono riprendere. | **piccolo** (circa 1 ora) |
| **C. Studio TV — pannelli, tasti, scritte** (`js/studio.js`) | Balla, Nomi Cose e Città, Patata, Prezzo, Ruota, Timeline (+ le parti da studio di Parola d'ordine) | Il fondo dei pannelli è un blu più chiaro e acceso del blu notte, il tasto principale è giallo lucido da cartone, le scritte sono nere/gialle. Portarli a: fondo `--o-fondo`, tasto lampone, vetro scuro, carattere dell'app. | **piccolo-medio** (2-3 ore) per 6 giochi |
| **D. Studio TV — sala, pubblico, podi** (`js/studio.js`) | gli stessi 6 | La sala è scura (va bene) ma il pubblico è una folla di avatar cartoon fittissima, il portale è giallo-oro da luna park, i podi sono viola-lilla con luci. Idea: pubblico molto più scuro e sfocato (quasi silhouette con luce di bordo), cornice del maxischermo in lampone/ciano invece del giallo, podi in vetro. **Aspettare la chat «Avatar»**: la folla è fatta con gli avatar, quando cambiano si aggiorna da sola. | **medio-grande** (mezza giornata) |
| **E. Tavolo di Scopa, Scopa 2 vs 2, Scopone** | i 3 giochi di carte | Il feltro verde e il bordo di legno sono oggetti veri: restano. Stona la stanza marrone-caldo con i quadri e il muro beige. Portare muro e luce verso blu-viola scuro con un alone caldo sul tavolo. Si fa una volta sola per tutti e tre (stesso tavolo). | **medio** (3-5 ore) |

---

## I 31 giochi, dal più stonato al meno

| # | Gioco | Stona | Perché (in parole semplici) | Cosa fare | Lavoro |
|---|---|---|---|---|---|
| 1 | 🕵️ **Parola d'ordine** | **5** | È l'unico gioco tutto chiaro: la pagina è bianca/crema, le squadre sono strisce rosse e blu piatte, il banner di risposta è chiaro. Sembra un'altra app accanto alla notte. (Visto con «Prova da solo» sul tabellone; la tastiera dei numeri in basso è già scura.) | Tenere le carte color crema (sono oggetti, belli sul fondo scuro), ma fondo blu notte, riquadri delle squadre in vetro scuro con il filo del loro colore, banner e chat in vetro, tasti lampone. Le carte girate col disegno ▲ ● ■ restano. | **medio** (4-6 ore: il gioco ha 3.400 righe, molto stile) |
| 2 | 🐎 **Horto Muso** | **5** | Mondo cartoon di giorno: cielo azzurro con nuvole, tribuna rossa piena di puntini, erba verde accesa, cavalli lucidi con fantini. Tasto «FRUSTA!» giallo da cartone. | Fare la corsa «di sera»: cielo notte con luci, tribuna scura, erba più profonda; tasto lampone; cavalli meno saturi. I fantini cambiano da soli con gli avatar nuovi. | **grande** (una giornata: il disegno della pista e dei cavalli) |
| 3 | 🎯 **Palla a Pendolo** | **5** | Scena cartoon di giorno: cielo celeste, bandierine colorate, acqua azzurra piatta, trave di legno, tasto «LANCIA» giallo. | Stessa idea di Horto: sera/notte (cielo scuro, bandierine → lucine, acqua blu notte), tasti lampone. La schermata finale ha già una versione pronta sul ramo `grafica-luxury`. | **grande** la scena (canvas), **piccolo** la fine |
| 4 | 🫵 **Chi di Noi?** | **4** | Fondo viola forte che non è il blu notte; le scene sono illustrazioni cartoon di luoghi (nel condominio: muro beige, finestre arancioni, porta grigia) con l'avatar gigante davanti. | Fondo e cornici in Notte; le scene da tenere come «cartoline» incorniciate più scure, oppure da rifare più sobrie (sono 4 luoghi). Dipende anche da come vengono gli avatar. | **grande** (4 scene + circa 200 righe di stile) |
| 5 | 🔨 **L'Asta** | **4** | Due mondi illustrati: la sala d'asta (muro verde damascato, tende rosse, parquet marrone, sedie dorate) è tutta caldo-marrone; lo stadio del fantacalcio è una scena fitta (spalti, pubblico, cartelloni). Le schermate di contorno (scelta carta, round) sono sul vecchio blu col nido d'ape. | Contorno: subito (gruppo B). Sala: tenerla come stanza ma scurita verso Notte (tende e legno restano oggetti), numeri e tasti lampone. Stadio: già notturno, ritoccare solo la cornice. | **grande** (5.700 righe, 3 scene); **piccolo** per il contorno |
| 6 | 🎡 **La Ruota della Fortuna** | **4** | Quasi tutta studio: faccia enorme del concorrente davanti alla folla cartoon, tabellone verde TV, tasti piatti arancione, blu e verde saturi. | Dopo i gruppi C e D: tabellone verde resta (è un oggetto), tasti nel linguaggio Notte (uno lampone, gli altri vetro), da guardare con calma anche la ruota vera (non l'ho vista). | **medio** dopo lo studio |
| 7 | 💣 **La Patata Bollente** | **4** | Studio con folla cartoon, countdown gigante bianco, bomba come emoji nera, cerchi verdi attorno ai concorrenti. | Dopo i gruppi C e D; la bomba va disegnata sobria (non l'emoji) con una luce lampone che pulsa mentre il tempo finisce; schermata finale già pronta sul ramo `grafica-luxury`. | **medio** dopo lo studio |
| 8 | 🏷️ **Il Prezzo è Giusto** | **3** | Dopo la sigla (studio cartoon con folla) le schermate di gioco sono blu acceso con tabellino nero e cifre gialle: simili alla notte ma più chiare e col giallo lucido. Ha 11 giochi a premi e la Ruota del 100 (non fotografati tutti). | Gruppi C e D; poi rivedere a campione i giochi a premi (tessere, pannello, schede). | **grande** (tanti file, ma quasi tutto segue lo studio) |
| 9 | 🃏 **Scopa** (+ Scopa 2 vs 2, Scopone: stessa cosa) | **3** | Stanza marrone-caldo con quadri, feltro verde, avatar-cartoon a capotavola: bellissima ma un altro mondo, calda su una app fredda. Oggi in alto i tasti sono scuri-marroni. | Gruppo E (una volta per tre). I tasti in alto li sistema già il gruppo A. | **medio** (una volta per tre giochi) |
| 10 | 📡 **Stessa Lunghezza d'Onda** | **3** | Cielo stellato viola (vicino alla notte, ma più viola e più piatto), quadrante con bordo lilla, tasti con sfumatura blu-arancio da cartone. | Fondo in Notte, il quadrante resta (è l'oggetto), i due tasti della scala in vetro con i colori dei due estremi invece della sfumatura. | **medio** |
| 11 | ⚽ **Calcio Biliardo** | **3** | Campo verde a righe (oggetto, va bene) con cornice blu e gialla da neon e pedine con il fulmine. Sembra un gioco da bar. | Tenere il campo; cornice sottile in due colori accesi della palette (ciano e giallo), pedine più sobrie, tasti e barre in vetro. | **piccolo-medio** |
| 12 | 🔴 **Palla Matta** | **3** | Il campo (spazio, pianeti, palline lucide) è già notturno e ci sta. Stona la schermata dei capitoli: fasce piene viola, verde, azzurro e rosa saturi con lucchetti. | Capitoli in vetro scuro, con un filo colorato per capitolo (come le categorie dell'app); campo da lasciare. | **medio** |
| 13 | 🤥 **La Balla Colossale** | **3** | Dopo la sigla le schermate sono blu acceso col giornale crema (bello, è un oggetto) e un tasto giallo lucido da cartone. | Gruppo C (pannello e tasto); il giornale resta; le altre schermate (balle, voti) da rivedere. | **piccolo-medio** dopo lo studio |
| 14 | 📜 **La Linea del tempo** | **3** | Il gioco vero (carte con foto, linea, barra) è già vicino alla notte: blu scuro con vetro. Stonano la carta in mano con sfumatura rosso-verde sporca, i tasti giallo-oliva e la sigla da studio con folla. | Carta in mano in vetro con il filo del colore della categoria; tasto principale lampone; gruppi C e D. Il contenuto (le foto vere) si presta bene. | **medio** |
| 15 | ✍️ **Nomi, Cose e Città** | **3** | Il foglio a righe crema è un oggetto e sta bene; intorno c'è lo studio cartoon con folla e il tasto giallo «Ho finito». | Gruppi C e D; il foglio resta; tasto lampone. | **piccolo** dopo lo studio |
| 16 | 🪜 **La Scalinata** | **3 → 2** | Pannello indigo più chiaro del fondo; i tre tasti 1·3·5 sono pastello (verde, giallo, arancio) fatti per sfondo chiaro; con l'unione i nomi diventano rosso, verde e oliva scuri su fondo scuro: poco leggibili. | Gruppo A, poi nomi in colori vivi chiari e i tre tasti in vetro con filo colorato. | **piccolo-medio** |
| 17 | 🟡 **Drop 4** | **3 → 2** | Griglia grigia piatta con quadrato arancio «VS» bordato di nero; fondo blu col nido d'ape. | Gruppo A. La griglia blu della versione convertita va bene; solo il «VS» grigio con bordo nero va fatto in vetro. | **piccolo** |
| 18 | ⭕ **Tris** | **3 → 1** | Fondo blu col nido d'ape e cornice azzurra neon. Con l'unione diventa bellissimo (linee lampone), ma X e O sono blu e rosso scuri: poco contrasto sul fondo scuro. | Gruppo A + schiarire X (ciano `#4fd8ff`) e O (lampone/rosa) nel file. | **piccolo** |
| 19 | 🚢 **Battaglia Navale** | **3 → 1** | Griglie blu mare con navi d'acciaio: ottime. Stona solo il fondo con nido d'ape e il tasto giallo-oliva. | Gruppo A. | **piccolo** |
| 20 | 🕵️ **L'Impostore** | **3 → 1** | Un pannello blu-indigo piatto più chiaro del fondo e una mano come emoji. | Gruppo A (diventa pulitissimo). | **piccolo** |
| 21 | 🤨 **Sì... però** | **3 → 2** | Carte verde accesa piene di testo su blu, un po' accese. | Gruppo A; eventualmente verde un po' più spento o vetro con filo verde. | **piccolo** |
| 22 | 🤐 **Taboo** | **3 → 1** | Grigio-blu piatto con scheda bianca e tre tasti piatti verde, giallo e rosso. | Gruppo A: scheda in vetro, tasti lampone e vetro, bellissimo. | **piccolo** |
| 23 | ☝️ **Una parola sola** | **3 → 1** | Fondo viola con cartiglio giallo e tasto giallo. | Gruppo A (cartiglio scuro col filo caldo, tasto lampone). | **piccolo** |
| 24 | 🍹 **Da dove viene?** | **3 → 2** | Fondo verde petrolio (già sobrio) con foto grande e tasto giallo-oliva. | Gruppo A; fondo verso Notte. Le foto sono l'attrazione e restano. | **piccolo** |
| 25 | 🃏 **Black Jack** | **3 → 2** | Stanza marrone e feltro verde (oggetti), avatar grande a capotavola, tasti saturi (rosso, azzurro, verde). | Gruppo A: tasti diventano vetro e un solo tasto lampone. Stanza un po' più scura verso blu. | **piccolo-medio** |
| 26 | ♠️ **Poker** | **3 → 1** | Tavolo ovale verde con bordo di legno su fondo verde scuro; tasti grigio, blu e arancio saturi. | Gruppo A (tavolo ovale su fondo Notte, tasti lampone e vetro: già verificato, viene molto bene). | **piccolo** |
| 27 | 🎨 **Scarabocchio** | **3 → 2** | Fondo indigo violaceo con titoli gialli e tasti gialli; il foglio bianco da disegno è un oggetto e va bene. | Gruppo A; testata e giri in vetro. | **piccolo** |
| 28 | 🏒 **Glow Hockey** | **2** | Nero puro con bordi gialli e blu al neon: è già «notte + colore acceso». Il nero è solo un po' più nero del fondo. | Fondo `#0d1020`, il tasto della musica in vetro. I neon restano. | **piccolo** |
| 29 | 🎣 **Gara di pesca** | **1** | Lago di notte con luna, lanterna e pesci: già perfettamente in tema. | Niente di visibile (la conversione dal ramo non cambia l'aspetto). | **nessuno** |

*(La riga «Scopa» vale per tre giochi: Scopa, Scopa 2 vs 2 e Scopone. Contando i tre separatamente i giochi sono 31.)*

---

## Quanti vanno già bene così (i conti dei 31 giochi)

- **Già bene oggi (voto 1): 1** — Gara di pesca.
- **Un solo ritocco di fondo (voto 2): 1** — Glow Hockey.
- **Vanno a posto (voto 1 o 2) con la sola unione dal ramo `grafica-luxury` (gruppo A): 11** — Tris, Taboo, Poker, Battaglia Navale, L'Impostore, Una parola sola, Drop 4, Sì... però, Da dove viene?, Scarabocchio, Black Jack. In più la Scalinata (serve anche un ritocco ai colori): **12** con lei.
- **Restano da fare davvero: 17** — Parola d'ordine (tutta chiara); le 4 scene cartoon (Horto Muso, Palla a Pendolo, Chi di Noi?, L'Asta); i 6 giochi dello studio TV (Ruota, Patata, Prezzo, Balla, Linea del tempo, Nomi Cose e Città: si fanno quasi tutti insieme con i gruppi C e D); i 3 giochi di carte con la stanza marrone (Scopa, Scopa 2 vs 2, Scopone: una volta sola, gruppo E); e 3 giochi di mezzo (Stessa Lunghezza d'Onda, Calcio Biliardo, Palla Matta).
- Totale: 1 + 1 + 12 + 17 = 31.
- **Con una mezza giornata** (gruppi A e B) quasi metà dei giochi (14 su 31, contando anche Gara di pesca e Hockey) è già nel nuovo stile.

---

## Cosa non ho potuto vedere (onestà)

- **Schermate finali di ogni gioco** (podio, classifica finale, «Rivincita»): non le ho fotografate; dovrebbero essere sistemate dal gruppo B.
- **Ruota della Fortuna:** ho visto il tabellone e il concorrente, non la ruota vera che gira. **Il Prezzo è Giusto:** ho visto la sigla e la schermata dell'offerta, non gli 11 giochi a premi, la Ruota del 100 e la Vetrina. **La Balla Colossale:** ho visto la notizia, non le balle e i voti. **Parola d'ordine:** ho visto solo il tabellone con «Prova da solo» (nessuna parte da studio).
- **Giochi in tempo reale (Hockey, Calcio Biliardo, Horto Muso, Palla a Pendolo, Palla Matta):** solo i primi istanti, non una partita in corso.
- **Giochi solo online (Chi di Noi?, Gara di pesca, Scarabocchio):** visti mettendo la Sala con 3 amici finti; la vista di un amico che non è l'host non l'ho guardata.
- **Asta fanta:** visto lo stadio iniziale (foto `asta-fanta-390x844.png`), non la giornata di Serie A finta.
- Le emoji di alcune monete e tasti compaiono come quadratino vuoto nelle foto: è l'Edge invisibile che non ha quei caratteri, non un difetto del gioco.
- Tutte le prove sono state fatte a 390x844. Non ho verificato 360x640.


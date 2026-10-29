# 🧠 Cervello di SPeeD GAME — il registro

Lo tiene la chat «🧠 Cervello». Le altre chat ci scrivono solo una riga nel **🗒️ Diario** (in fondo) quando finiscono un lavoro, salvano o pubblicano.
Ultimo aggiornamento: **29 ott 2026, 15:25** (ora italiana).

---

## 1. ⛽ Limiti

| Limite | Usato | Si azzera |
|---|---|---|
| Settimana (tutti i modelli) | **24%** (29 ott 12:35; azzerata il 28 ott alle 15:00) | **mercoledì 4 nov alle 15:00** |
| 5 ore | 2% | 29 ott alle 16:40 |
| Settimana Fable | 0% | mercoledì 4 nov alle 15:00 |
| Crediti cloud | 250 USD il 26 ott sera, da ricontrollare | **scadono il 5 nov alle 08:59** |

- Il piano: lo strumento del Cervello dice «Pro», la chat dell'Impostore ha letto «Max» nell'app. Fa fede quello che si vede nelle impostazioni dell'app.
- Crediti cloud: il 27 ott la chat Stile nel cloud si è fermata perché era finito il limite della settimana. Da guardare nella schermata «Utilizzo» se i 250 USD sono ancora tutti lì: se sì, il cloud ha consumato la settimana invece dei crediti.
- Quanto costano i lavori (misurato): un modo nuovo di un gioco scritto da un aiutante Opus ≈ 4% della settimana; un giro di correzioni piccole ≈ 1%; la notte della chat Stile nel cloud (fase 2 + 16 giochi convertiti) ha portato la settimana dal 91% al 100%; la notte del 29 ott (chat Notte vivace + chat Avatar insieme, 02:25-10:50) dal 10% al 24%: ~2,5% all'ora con tutte e due a ragionamento «molto alto», ~1% all'ora dopo averlo abbassato (colori medio, avatar alto).

**Regola del momento (settimana appena azzerata):** lavori grandi sì, ma la settimana deve bastare 7 giorni → **circa 14% al giorno**. Aiutanti Sonnet di base, Opus solo per il codice delicato (rete, motore di un gioco). Un lavoro grande alla volta. I lavori lunghi e separabili vanno nel cloud finché ci sono crediti (fino al 5 nov).

**Il ragionamento delle chat lo regola il Cervello** (il proprietario, 29 ott notte: «vai di medio per i colori, regolati tu anche per queste cose»): medio per i lavori ripetitivi (colori, liste, controlli), alto per disegno e codice delicato, il massimo solo se serve davvero. Dal 29 ott 04:55: chat Notte vivace su medio, chat Avatar su alto (prima tutte e due «molto alto»: ~2,5% della settimana all'ora in due). Quella notte lo stop è stato alzato dal 25% al 35% («se serve vai oltre il 25»).

Regole generali: sotto il 70% lavori grandi ok · 70-85% lavori medi, aiutanti Sonnet · 85-95% solo piccole cose · sopra il 95% fermi, tranne pubblicare.

---

## 2. 🌐 Cosa c'è online

**Online adesso:** master `ff73096` del 29 ott alle 15:10 (controllato sul sito) = **novità v278 + v279** (e Lanterne in prova):
- **Lanterne** (chat di Mario De Viva, l'amico del proprietario): il gioco nuovo «🏮 Lanterne» (alla Among Us, online da 4 a 10, 35 ruoli, Bot), pubblicato da Mario stesso direttamente su master (14:46, poi 14:56). **In prova**: la tessera la vedono solo gli account IL PAPPONE e «gay» (di Mario), solo loro aprono la stanza; chi è invitato (link, codice, Sala) entra lo stesso; la saletta si riempie di Bot fino a 6. La sua novità v277 è stata tolta. La serata vera con 4+ telefoni non c'è ancora stata (#25).
- **v279** (chat «🏠 Home compatta», ramo `home-compatta`): prima schermata con le tessere dei giochi senza descrizione, due per riga; menu in basso (Giochi · Novità · Trofei · Classifica · Profilo); **città spenta per tutti** (`CITTA_VISIBILE = false`: la versione online non contiene città, casa, casinò, circolo e scavi, ~3 MB in meno; spariscono per ora anche la Ruota del giorno e le sfide del giorno; la Gara di pesca va come prima). Chiesto dal proprietario («rimuoviamo anche la città visibile per adesso»).
- **v278**: avatar «Mii rifinito» **per tutti** (`AVATAR_NUOVO = "tutti"`) e le cinque proposte approvate dal proprietario sulle foto («li ho visti e vanno bene»): Horto Muso di sera, Palla a Pendolo di notte, Chi di Noi? con scene e carte in vetro scuro (fondo viola ancora), sala dei temi dell'Asta di sera (banco marrone, stadio del fanta com'era), Parola d'ordine col tavolo blu notte e le carte crema. Fatte da 5 aiutanti (uno per gioco) + un revisore; nel Pendolo l'alone della palla è un gradiente (non una sfocatura a ogni fotogramma).
- Prima: v276 (29 ott 12:35, `b55faa7`) i giochi in stile notte; v275 (29 ott 00:30) lo stile «🌙 Notte vivace» per le schermate dell'app. Sito: https://paky358.github.io/speed-game/

**`lavori-in-corso`** = uguale al sito (in più solo il registro).

**Unito e pubblicato il 29 ott (v276), lavoro della notte:** i rami `stile-notte` (fino a `e54d20e`) e `avatar-mii` (fino a `efef25d`) sono dentro `lavori-in-corso` e `master`; le copie `SG-notte` e `SG-avatar` si possono togliere con la pulizia (#22).
- **`stile-notte`**: tutti i giochi col vestito della notte tranne Parola d'ordine e le scene grandi.
  - Le schermate di contorno di 15 giochi.
  - I 16 giochi ripresi da `grafica-luxury`, coi colori ritoccati per il fondo scuro: X e O del Tris, «VS» di Drop 4, nomi della Scalinata; le linee del Tris sono bianche.
  - La stanza di Scopa, Scopa 2 vs 2 e Scopone di sera.
  - Lo studio TV: pannelli e tasti lampone e vetro; la ruota della Ruota coi colori della notte; la bomba della Patata disegnata, con la luce lampone negli ultimi secondi; Balla, Nomi Cose e Città, i giochi a premi del Prezzo.
  - Glow Hockey, Calcio Biliardo, i capitoli di Palla Matta, Stessa Lunghezza d'Onda, la carta in mano della Linea del tempo.
  - Prove: 286 (tutti i 35 modi), Sala, rivincita, chi guarda, chi arriva tardi, pn/pd/pe del Prezzo.
  - **Proposte da guardare**, senza toccare i giochi: Horto di sera, Pendolo di notte, Chi di Noi? scuro, sala dell'Asta, Parola d'ordine con le carte crema. Pagina privata del proprietario: https://claude.ai/artifact/TXUJNhm3WAFP8iW6687nfF
- **`avatar-mii`**: avatar «Mii rifinito».
  - Disegno nuovo e faccine piccole leggibili come oggi.
  - Controllato in ogni posto dove compaiono gli avatar e corretto (pelli scure, bocca, palpebra, occhiali, vestiti neri e bianchi).
  - Interruttore `AVATAR_NUOVO`: in v276 solo per IL PAPPONE, **dalla v278 per tutti** (deciso dal proprietario il 29 ott pomeriggio).
  - Riassunto e foto in `docs/stile/avatar-mii/`.
  - Il proprietario, 29 ott: «per gli avatar preferivo 3D morbido… per ora restiamo così, sennò è troppo lavoro» (vedi #24).

**Sul ramo `grafica-luxury` (su GitHub, NON in lavori-in-corso, NON online, Bianco e oro BOCCIATO il 28 ott: NON si unisce)** — 18 salvataggi della chat Stile del 27 ott, dalle 01:45 alle 12:36:
- Bianco e oro più luminoso (fondo bianco pulito, oro più acceso).
- **16 giochi convertiti interi al Bianco e oro**: Tris, Drop 4, L'Impostore, Gara di pesca, Taboo, Una parola sola, Sì... però, Scarabocchio, Da dove viene?, La Scalinata, Battaglia Navale, Black Jack, Poker (tavolo vero tenuto), Scopa, Scopa 2 vs 2, Scopone (tavolo vero tenuto). Nei 7 giochi dello studio TV diventa chiara solo la cornice.
- Studio TV: proposta in Bianco e oro **scartata dal proprietario** («tutto oro non mi piace»): resta com'è.
- **A metà, da rifinire:** proposte di avatar meno cartoon, colori dei menu, disegni del «livello successivo».
- Resta solo come archivio di idee (le proposte di avatar e di studio TV in docs/stile/livello2/).

Fuori da git: `.claude/launch.json` (il server di prova della chat della Linea del tempo).

---

## 3. 💬 Le chat

| Chat | Gioco | Ultima attività | Cosa sta facendo / in sospeso |
|---|---|---|---|
| 🧠 Cervello SPeeD GAME | tutto | 29 ott, ora | Registro, limiti, consigli. Non costruisce giochi. |
| 🌙 Notte vivace 2 | il resto dello stile (#11) | 29 ott 15:40, **lavora** | Partita su D: la copia a parte `D:SG-notte2` (ramo `stile-notte-2`) l'ha creata il Cervello, perché su C non c'è spazio per le copie dell'app (#27). Ragionamento medio. Non pubblica: a fine lavoro manda le foto prima/dopo. |
| 🏠 Home compatta | prima schermata | 29 ott 14:30, **finita** | Tessere senza descrizione due per riga, menu in basso, città spenta: online v279 (pubblicata dal Cervello insieme alla v278). |
| 🌙 Notte vivace | stile di tutta l'app | 29 ott 10:51, **finita** | Tutto il suo lavoro è online (v275, v276 e le sue 5 proposte in v278, messe nei giochi dal Cervello con 5 aiutanti). Il resto dello stile va alla chat nuova «🌙 Notte vivace 2» (#11). Chat molto lunga: non riprenderla. |
| 🧍 Avatar Mii rifinito | avatar «Mii rifinito» | 29 ott 06:23, **finita** | Online per tutti dalla v278. Il proprietario avrebbe preferito il «3D morbido» (#24). |
| 🎨 Stile (cloud) | grafica di tutta l'app | 27 ott 12:36 | Ferma. Il suo Bianco e oro è stato bocciato e sostituito dalla Notte vivace: non va ripresa. |
| IMPOSTORE | L'Impostore | 26 ott 20:56 | Telefono bloccato pubblicato (v273). **In sospeso:** 518 coppie di parole nuove in 10 temi aspettano il sì del proprietario; proposti la memoria delle parole per tutta la compagnia e la spia che non sa «in vetrina». |
| Nome nuovo per SPeeD GAME | nome e dominio | 26 ott 18:12 | 100 idee + 10 migliori (preferiti: **Cerchia, Sodalis, Convivio**). I domini .it e .com secchi sono già presi: proposto «Cerchia Club», cerchia.app, cerchia.games. Aspetta che il proprietario scelga 3 preferiti. |
| LINEA DEL TEMPO | Linea del tempo | 26 ott 17:26 | Pubblicato tutto (v267-v272). Restano «🤖 Gioca col Bot» (chat nuova) e la carta sbagliata nella linea. Chat lunghissima: per il Bot aprirne una nuova. |
| Controllo skill nuove | — | gira adesso | Compito automatico ogni 3 giorni alle 10:00: propone skill nuove, non installa niente. |
| speed 2 | chat generale | 26 ott 16:41 | Ha preparato il Cervello. **Da archiviare.** |
| IL PREZZO è GIUSTO | Il Prezzo è Giusto | 25 ott 23:22 | Niente a metà (online v266). |
| MINI ASTA FANTACALCIO | L'Asta | 25 ott 23:43 | Niente a metà (online v255). Aspetta la serata vera per tarare la giornata. |
| PAROLA D ORDINE | Parola d'ordine | 22 ott 19:11 | Niente a metà (online v253). |
| Lezioni di programmazione | — | 26 ott 18:42 | Lezioni per il proprietario, non tocca il progetto. |
| PARTY GAME | vecchia chat lunga | 18 ott 20:22 | Finita. **Da archiviare.** |

---

## 4. 📋 Da fare (in ordine di importanza)

Grandezza: 🟢 piccola · 🟡 media · 🔴 grande.

| # | Cosa | Gioco | Chi la fa | Grandezza | Quando |
|---|---|---|---|---|---|
| 1 | ✅ FATTO 28 ott sera: **RAM nuova montata e controllata**: 2 × 8 GB Samsung, 16 GB (14,9 usabili, il resto va alla grafica del processore), vanno a 2.667 come le vecchie. Scritto 16 GB nelle istruzioni, nella procedura delle prove e nella memoria. Lo strumento delle prove usa ancora una scheda sola: si può alzare a 2, provando piano | PC | fatto | 🟢 | fatto |
| 2 | 🎨 **Stile nuovo: il Bianco e oro è bocciato** (28 ott, il proprietario e l'amico esperto). Scegliere un colore acceso principale (pronte sul ramo: A «Notte vivace» lampone su blu notte, B «Colori pieni su chiaro», C «Gradienti caldi»; idee nuove del Cervello: «Rosso SPeeD», «Arancio festa», «Viola elettrico»), poi soprattutto **avatar meno cartoon** (4 strade pronte, consigliata B «3D morbido») e **scene dei giochi** (studio TV A-C). I 16 giochi in Bianco e oro del ramo NON si uniscono. **Scelto il 28 ott sera: A «🌙 Notte vivace» + sfondo animato con scintillii leggeri e profondità** → ✅ **ONLINE il 29 ott (v275)** per le schermate dell'app. **Notte del 29 ott: i giochi (tutti tranne Parola d'ordine e le scene grandi) e gli avatar «Mii rifinito» (solo per IL PAPPONE)** → ✅ **ONLINE il 29 ott (v276)**. **Le 5 proposte delle scene grandi approvate e gli avatar nuovi per tutti** → ✅ **ONLINE il 29 ott (v278)**. Il resto: #11 | tutta l'app | fatto | 🟢 | fatto |
| 3 | **Prova coi telefoni veri** in una serata con gli amici: lo stile nuovo, Ognuno la sua linea, la giornata dell'Asta, Prezzo online, Parola d'ordine, L'Impostore col telefono bloccato, inviti ad app chiusa su iPhone, Chi vince resta | tutti | proprietario, poi le chat dei giochi | 🟢 (costa zero) | appena c'è una serata |
| 4 | 🎵 **La musica**: «Sarabanda» + modo Heardle. Prima provare dal telefono che le anteprime da 30 secondi di iTunes si sentano | gioco nuovo | chat nuova «Musica» | prova 🟢, gioco 🔴 | questa settimana |
| 5 | 🔒 **La copia per il vice solo ai vice** (oggi la copia della partita, con carte e segreti, va a tutta la stanza sul collegamento pubblico) + l'host che riapre guarda la stanza solo 0,4 secondi | tutti i giochi online | chat nuova «Rete» (Opus) | 🟡 | questa settimana |
| 6 | 🕵️ L'Impostore: dire sì o no alle 518 coppie nuove in 10 temi; poi memoria delle parole per tutta la compagnia e la spia che non sa «in vetrina» | Impostore | proprietario → chat IMPOSTORE | 🟢 decisione, 🟡 lavoro | quando vuole |
| 7 | 👀 **«Chi arriva tardi» e «Guarda»** anche in Stessa Lunghezza d'Onda, Chi di Noi?, Scopone e L'Impostore | 4 giochi | chat nuova «Ritardatari» | 🟡 | questa settimana |
| 8 | ✨ **Nome e dominio**: scegliere 3 preferiti tra le idee (Cerchia, Sodalis, Convivio…) e far controllare le varianti libere (.app, .games, «Club») | tutta l'app | proprietario → chat Nome | 🟢 | quando vuole |
| 9 | **Home personale**: giochi più giocati in alto da soli, ⭐ preferiti, tessere da trascinare, per ogni giocatore (oggi solo IL PAPPONE riordina, e per tutti) | home | chat nuova «Home» | 🟡 | dopo lo stile |
| 10 | Stessa Lunghezza d'Onda, «🤔 Cosa ne pensi?»: solo parole discutibili, una parola sola, punti alle opinioni che dividono | Lunghezza d'Onda | chat nuova del gioco | 🟡 | dopo |
| 11 | 🎨 Stile, il resto: «**tutto tranne lo studio**» (il proprietario, 29 ott pomeriggio; pubblico, sala e podi dello studio TV restano com'erano). 1) **Chi di Noi?** col fondo blu notte al posto del viola; 2) i **6 difetti piccoli**: Calcio Biliardo (sui telefoni piccoli il tasto dell'audio copre l'avversario), Tris (il fumetto del Bot copre per un attimo il nome), Ruota (mentre si scrive la soluzione una scritta tocca il nome sul leggio), L'Asta (sullo stesso telefono l'avatar di IL PAPPONE è diverso da quello del profilo), Sì però (avatar sbagliato accanto al Giudice), Scopa («Contro il computer» → «Bot»); 3) **giro di controllo** su tutti i giochi nei momenti mai fotografati (partite in diretta in corso, schermate di fine, la vista di un amico nei giochi solo online, la giornata del fanta: solo riquadri, scritte e tasti, non campo e spalti) e quello che resta chiaro: le schede «🤔 Cosa intendevi?» e «🎭 Titoli» di Parola d'ordine, le voci del voto e dello svelamento di Chi di Noi?; 4) prove NO già da prima: o2t5 (Parola d'ordine, un tocco salta la presentazione anche agli altri), o2t6 (saletta in 12 a 3 squadre a 360x640: «🔀 Squadre a caso» fuori schermo), 634 e og5 (misure Passo 6 e ordine dei giochi), il fumetto del banditore dell'Asta che copre il «passo» a 360x640. Fuori: il banco marrone dell'Asta (va ridisegnato), campo e spalti del fanta, la città (spenta) | vari | chat nuova «🌙 Notte vivace 2» | 🔴 | ora |
| 24 | 🧍 **Avatar «3D morbido»** (strada B, tipo Memoji: volumi tondi, luce dall'alto, testa meno grande; era la consigliata, prove sul ramo `grafica-luxury` in docs/stile/livello2/avatar/). Il proprietario, 29 ott: «preferivo 3D morbido… per ora restiamo così, sennò è troppo lavoro». Si riprende SOLO se lo chiede lui | avatar | chat nuova «Avatar» | 🔴 | se lo chiede |
| 25 | 🏮 **Lanterne** (gioco di Mario De Viva, l'amico del proprietario): ✅ **ONLINE IN PROVA dal 29 ott 14:56** (solo per IL PAPPONE e l'account di Mario; gli invitati entrano), pubblicato da Mario stesso su master. Ora: **serata vera con 4+ telefoni** (10 persone che si muovono in diretta sulla rete gratuita non era mai stato provato; iPhone con Safari; ricariche vere), poi vestirlo di notte (ha uno stile scuro suo), tenere d'occhio i 35 ruoli (tanti per chi comincia) e l'equilibrio (in 10 le ombre vincono un po' troppo). Le modifiche le fa la chat di Mario, che **può pubblicare da sola** (il proprietario, 29 ott: «Sì, da solo»; scritto in AGENTS.md): chi pubblica dopo unisce prima `origin/master` | Lanterne | chat di Mario | 🟡 | serata di prova |
| 28 | 🔨⚽ **L'Asta** (29 ott, il proprietario): 1) **giornata del fanta sincronizzata** su tutti i telefoni (host Android avanti rispetto agli iPhone: anticipava le azioni); 2) **dividere** L'Asta (temi) e la Mini Asta Fantacalcio in due giochi, senza perdere trofei, statistiche e link vecchi, motore dell'asta uno solo; 3) **tabellone del fanta leggibile** (scritte normali al posto dei «quadretti» a led). In più i 3 difetti dell'Asta tolti dalla lista di Notte vivace 2 (avatar di IL PAPPONE, fumetto del banditore a 360x640, riquadri della giornata). Ordine consigliato dal Cervello: 1, 2, 3. Lavoro su D (`D:SG-asta`, ramo `asta-fanta`) | Asta | chat MINI ASTA FANTACALCIO | 🔴 | ora |
| 27 | 💾 **Disco del PC quasi pieno**: 4 GB liberi su ~118 (29 ott). Le chat non riescono più a creare le copie a parte (servono 5,4 GB liberi). Pesano: la cartella Download 6,3 GB (vecchi video e programmi d'installazione), le cartelle temporanee delle chat ~3 GB, le conversazioni delle chat 3,8 GB (da tenere). Le copie di lavoro vecchie pesano poco (~0,25 GB in tutto). C: è un SSD da 128 GB (veloce, pieno), **D: un disco da 1 TB con 896 GB liberi** (più lento). Piano proposto (29 ott): NON spostare il progetto (chat, memoria, strumenti e istruzioni puntano alla cartella di oggi, e pesa solo 0,15 GB); 1) nelle impostazioni dell'app (Claude Code → posizione delle copie a parte, oggi «dentro il progetto») scegliere una cartella su D:, per esempio `D:SG-copie`; 2) liberare C: spostando Download (6,3 GB) e Documenti (7 GB) su D: con «Proprietà → Percorso → Sposta» di Windows, e OneDrive (11,6 GB) con «Libera spazio» | PC | proprietario (il Cervello non cancella file e non cambia le impostazioni di Windows) | 🟢 | subito |
| 26 | 🎡 Con la città spenta (v279) sono spariti anche **la Ruota del giorno e le sfide del giorno**: decidere se riportarle da un'altra parte (per esempio nel profilo o in home). E: senza rete, toccando «Profilo» nel menu nuovo si legge «Crea il tuo oppure accedi» anche se si sta giocando col profilo ricordato: meglio dire «Senza rete: giochi come Rita» | home | proprietario → chat Home | 🟢 decisione | quando vuole |
| 23 | 🐞 Errori visti dalla chat Avatar (Asta, Sì però, Scopa) → messi nel #11 | — | — | — | — |
| 12 | Immagini delle tessere della home che mancano: **Palla Matta, Una parola sola, Da dove viene?** | home | proprietario + Cervello | 🟢 | quando vuole |
| 13 | Linea del tempo: «🤖 Gioca col Bot»; decidere se la carta sbagliata si mette lo stesso nella linea | Linea del tempo | chat nuova della Linea | 🟡 | dopo |
| 14 | Il Prezzo è Giusto: 81 prodotti senza foto, circa 120 prezzi vecchi non verificati, pezzi di vetrina vaghi | Prezzo | chat Prezzo (Sonnet) | 🟡 | dopo |
| 15 | L'Asta: battitori che non sono all'asta (Douglas Luiz, Milla, Ilic, Neres, Basic); aggiornare rigoristi ogni tanto (Kessié rientra a fine ottobre), sempre mostrando prima la lista | Asta | proprietario → chat Asta | 🟢 | quando vuole |
| 16 | Una parola sola: prova coi telefoni veri con 8-10 persone, chi guarda col link | Una parola sola | chat nuova del gioco | 🟢 | dopo la serata di prova |
| 17 | Prossimo gioco nuovo dopo la musica: probabile «📍 Dove siamo?» (un GeoGuessr nostro) — decide il proprietario | gioco nuovo | chat nuova | 🔴 | dopo la musica |
| 18 | Varietà delle parole in TUTTI i giochi con liste (memoria delle uscite, liste larghe): è il nostro punto forte | giochi con parole | Cervello controlla, poi chat dei giochi | 🟢 | dopo |
| 19 | Trofei dei giochi nuovi: la lista la dà il proprietario. Per ora lasciati perdere | vari | chat dei giochi | 🟡 | più avanti |
| 20 | Prima di un lancio pubblico: nomi nuovi per i giochi con marchi (Taboo, Ruota della Fortuna, Il Prezzo è Giusto…), immagini nuove di Black Jack e Poker, quotazioni del fanta nostre, diritti di foto e musica | vari | da decidere | 🔴 | solo se si lancia |
| 21 | La casa diventa la vetrina dei successi | casa | da decidere | 🔴 | futuro |
| 22 | Pulizia: copie di lavoro vecchie già unite (SG-giochi, SG-saletta, SG-unione) e rami vecchi dei trofei su GitHub, chiedendo prima; archiviare le chat finite (PARTY GAME, speed 2) | — | Cervello | 🟢 | quando vuole |

---

## 5. 🗒️ Diario delle chat

Una riga per ogni lavoro finito, salvato o pubblicato. **La più recente in cima.** Formato: `data ora · chat · salvato / PUBBLICATO · cosa (novità vN) · salvataggio`.

- 29 ott 15:04 · Lanterne (chat di Mario De Viva) · PUBBLICATO · Lanterne apre una stanza sua e non la Sala (Mario: «nel link la lobby solo per Lanterne, non un link generico»): opzione nuova `senzaSala: true` in SG.registra, letta in core.js da modiDi (niente «Online con gli amici», c'è «Online: apro io la stanza»), sceltoModo e la lista dei giochi della Sala (lì non compare); link d'invito `#gioco=lanterne&stanza=…`. Provato con Sala accesa: gay apre, Luca entra col link, Bea col codice · master
- 29 ott 14:56 · Lanterne (chat di Mario De Viva) · PUBBLICATO · Lanterne IN PROVA, chiesto da Mario («giocabile solo dall'account dell'admin e da gay»): la tessera la vedono solo IL PAPPONE e gay e solo loro aprono la stanza (lista AMMESSI in js/games/lanterne.js); gli altri entrano solo se invitati (link, codice o Sala); la saletta si riempie da sola coi Bot fino a 6; tolta la novità v277 di Lanterne, quindi il 277 torna libero per lavori-in-corso (l'avviso della riga sotto non serve più) · master

- 29 ott 15:10 · Cervello · PUBBLICATO (master `ff73096`, controllato sul sito; intanto Mario aveva pubblicato Lanterne tre volte: uniti i suoi cambi e rinumerate le novità, la sua v277 è stata tolta da lui) · avatar «Mii rifinito» per tutti e le 5 proposte approvate nei giochi (novità v278: Horto di sera, Pendolo di notte, Chi di Noi? in vetro scuro, sala dei temi dell'Asta di sera, Parola d'ordine col tavolo blu notte e le carte crema; 5 aiutanti + un revisore, uguali alle foto approvate; alone della palla del Pendolo con un gradiente) + la prima schermata compatta della chat «🏠 Home compatta» (v279: tessere senza descrizione due per riga, menu in basso, città spenta), unita dal Cervello. Prove 286 (35 modi), 24-46, 50, 51, 55, 60, 76, 90, 96, 421, 353, 341-346, 216, 215, 223, 400-410, o2t1, o2r1, o2f1, o2f3, 264, og1-og4, nov1, ar1-ar3: tutte OK; aggiornate 2 prove vecchie (96: la home non scrive più il nome, basta il tasto del profilo; 264: l'indizio sta prima di «INDIZIO DEI ROSSI»). Senza rete il Profilo chiede di accedere anche se si gioca col profilo ricordato (era così anche prima, ora si nota di più: vedi #26) · master (questo salvataggio)
- 29 ott 14:46 · Lanterne (chat di Mario De Viva) · PUBBLICATO · nuovo gioco online «Lanterne» (novità v277), chiesto da Mario («rendila già mandabile agli altri»): ramo `lanterne` unito in master; provato col file unico costruito (home, Feste, saletta con Bot, partita) e con due telefoni sul broker vero (stanza e Sala). ⚠️ Il ramo lavori-in-corso ha già una sua «novità v277» (avatar dei giochi di notte): quando si unisce va rinumerata v278, e in cima a novita.js e a questo diario ci sarà un conflitto da sistemare tenendo tutte e due le voci · master

- 29 ott 14:30 · 🏠 Home compatta · salvato sul ramo `home-compatta` (copia `SG-home`, da `fc1fd0e`), NON online · prima schermata: tessere dei giochi senza descrizione, due per riga (scelta del proprietario tra «una per riga» e «due per riga»); menu sotto (Giochi · Novità · Trofei · Classifica · Profilo) nella home e in quelle quattro schermate, mai nelle partite; città spenta per tutti (niente tasto, la versione online senza città, casa, casinò, scavi né extra.js: ~3 MB in meno a telefono; via per ora anche Ruota del giorno e sfide del giorno) (novità v278: la v277 è della chat che accende gli avatar per tutti, se non arriva si rinumera) · foto e confronto: https://claude.ai/artifact/SFdCst42MN9HZqTtQz4xub · prove 40, 55, 60, nov1, og1-og5, 341-346, 286 (vedi commit); 634 e og5 sbagliano anche su lavori-in-corso (la Sala di Anna a 360x640 scorre di 13 px; nell'Ordine dei giochi il nome della Linea del tempo è tagliato a 360x640) · da unire a lavori-in-corso quando il proprietario dice «pubblica».

- 29 ott 14:03 · Lanterne (chat di Mario De Viva) · salvato · nuovo gioco online «Lanterne» (deduzione, 4-10 giocatori, 35 ruoli, Bot) sul ramo `lanterne`, NON unito a master (novità v277 pronta) · provato in locale: host con 5 Bot, partita intera, 360×640 e 412×915 senza scorrere
- 29 ott 12:35 · Cervello · PUBBLICATO · i giochi col vestito della notte (tutti tranne Parola d'ordine e le scene grandi) e gli avatar «Mii rifinito» accesi solo per IL PAPPONE (novità v276), chiesto dal proprietario («pubblica tutto»): uniti i rami `stile-notte` e `avatar-mii` in lavori-in-corso (solo il diario del registro da mettere in ordine). Prove del copione 286 (35 modi), 24-46, 50, 51, 55, 76, 90, 96, 421: 51 e 421 (353) NO a 360x640, i tasti di fine del Tris uscivano di 7-10 px (scritte più grandi e margine della griglia del Tris nuovo) → ritocco solo per i telefoni bassi in tris.js, rifatte 51, 353, 421, 46, 33, 286 Tris: tutte OK. Versione online costruita, si apre senza errori. Il proprietario: «per gli avatar preferivo 3D morbido… per ora restiamo così» (#24) · master (questo salvataggio)

- 29 ott 10:55 · Cervello · salvato · notte guidata finita: la chat Notte vivace (ramo `stile-notte`, fino a `e54d20e`) e la chat Avatar (ramo `avatar-mii`, fino a `efef25d`) hanno finito tutte le loro liste; niente online; la settimana è passata dal 10% al 24%. I due rami si uniscono facilmente (solo il diario del registro va sistemato a mano). Aspettano che il proprietario guardi e dica «pubblica»

- 29 ott 10:51 · 🌙 Notte vivace · salvato sul ramo `stile-notte` (solo questa riga: nessun gioco cambiato) · proposte da far vedere al proprietario, in foto prima/dopo nella pagina https://claude.ai/artifact/TXUJNhm3WAFP8iW6687nfF: Horto Muso di sera, Palla a Pendolo di notte, Chi di Noi? con scene e carte in vetro scuro, sala dell'Asta scurita (solo temi), Parola d'ordine scura con le carte crema; le regole proposte stanno nelle cartelle di lavoro della chat; server di prova spento; la chat si ferma qui · commit sotto

- 29 ott 10:49 · 🌙 Notte vivace · salvato sul ramo `stile-notte` (non online) · secondo giro sullo studio TV: la ruota vera della Ruota nei colori della notte; nella Patata la bomba disegnata (sfera blu notte con miccia) e la luce lampone che pulsa quando manca poco (la schermata finale del ramo grafica-luxury NON presa: era nel Bianco e oro, quella scura c'era già); Balla con il velo più scuro mentre si scrive; Prezzo con tessere e schede senza i fili lilla; Nomi Cose Città con STOP, Vale/No e bollini scuri; pubblico, sala e podi non toccati; prove 286 (35 modi), pn1-5, pd1-5, pe1-5, 213, 672, 692 OK · commit sotto

- 29 ott 09:10 · 🌙 Notte vivace · salvato sul ramo `stile-notte` (non in lavori-in-corso, non online) · finito il piano della notte: gruppo C (studio TV: pannelli, tasti e scritte coi colori della notte; Balla, Nomi Cose Città, Patata, Ruota, Prezzo con tutti i giochi a premi, Linea del tempo con la carta in mano in vetro) e i piccoli (Glow Hockey, Calcio Biliardo, capitoli di Palla Matta, Stessa Lunghezza d'Onda); Parola d'ordine lasciata com'era; prove 286 (35 modi), 212, 213, 671, 672, 692, 284, 285, 289 OK; restano Parola d'ordine, gruppo D e le scene grandi · commit sotto

- 29 ott 07:30 · 🌙 Notte vivace · salvato sul ramo `stile-notte` (non in lavori-in-corso, non online) · gruppo A: i 16 giochi già convertiti (Black Jack, Da dove viene?, Drop 4, Gara di pesca, L'Impostore, Battaglia Navale, Poker, Scalinata, Scarabocchio, Scopa, Scopa 2 contro 2, Scopone, Sì però, Taboo, Tris, Una parola sola) ripresi dal ramo grafica-luxury e ritoccati per il fondo scuro (X e O del Tris luminose, «VS» del Drop 4, nomi della Scalinata, carta dell'Impostore, Taboo…); gruppo E: la stanza di Scopa, Scopa 2 contro 2 e Scopone ha le pareti blu notte con la luce calda sul tavolo (legno e panno restano); prove 201f-204f, 211, 214, 221, 222, 224-226, 234f OK · commit sotto

- 29 ott 06:23 · 🧍 Avatar · salvato sul ramo `avatar-mii` (non online) · lavoro della notte FINITO (pezzi 1-4): riassunto per il proprietario in docs/stile/avatar-mii/riassunto-notte.md con le foto prima/dopo (foto/7 e foto/8); da decidere: accenderlo per tutti, 4 piccole cose lasciate così, 3 cose notate in altri giochi · avatar-mii

- 29 ott 05:36 · 🧍 Avatar · salvato sul ramo `avatar-mii` (non online) · lavoro della notte, pezzo 2: il disegno nuovo guardato in ogni posto dell'app (4 aiutanti Sonnet: home, profilo, editor, Bot, classifica, Sala, salette, Black Jack, Scopa, L'Asta, Horto Muso, pesca, Ruota, Balla, Sì però, Chi di Noi?) e corretto: tolte le macchioline grigie sotto naso e mento, bocca rossa e spessa come oggi (anche il labbro attorno ai denti), vestiti neri col loro bordo (tasche, microfono), bianchi pieni (fiori, righe, fazzoletto), piega della palpebra più vicina all'occhio e mai negli occhi grandi, guance più leggere, occhiali più fini, luce più calda sulle pelli scure; ricontrollato da 3 aiutanti Sonnet; prova 286 (35 modi di gioco) OK col disegno nuovo acceso per tutti; il disegno di oggi resta identico (20.636 disegni) · avatar-mii

- 29 ott 02:58 · 🌙 Notte vivace · salvato sul ramo `stile-notte` (non in lavori-in-corso, non online) · gruppo B: le schermate di servizio di 15 giochi (entrare da un link, attese, «Ops», «Niente rete?», «Serve il sito pubblicato», classifiche e podi finali) vestite come l'app; podi coi metalli dei trofei, simboli nuovi per ⚠️ 🏷️ 🖼️ ✍️ e medaglie coi colori dei metalli; le partite restano com'erano (anche la scelta dei livelli di Palla Matta, il foto-finish di Horto Muso e l'introduzione del fantacalcio). Fatto da 15 aiutanti Sonnet, ricontrollato da 6 (4 ritocchi). Prove 286 (35 modi), 205f, 212, 213, 215, 216, 223, 223f, 231f, 232f, 233f, 235f, 236f, 400, 284, pz2, pz4 tutte OK. Da guardare per la chat di Parola d'ordine: la sua targhetta della parola d'oro usa anche lei la classe «oro» e prende il carattere dell'app

- 29 ott 02:51 · 🧍 Avatar · salvato sul ramo `avatar-mii` (non online) · lavoro della notte, pezzo 3: l'interruttore degli avatar nuovi solo per IL PAPPONE (AVATAR_NUOVO in core.js: "nessuno" / "proprietario" / "tutti"; nel suo profilo il tasto «🧍 Avatar nuovi» per spegnerli e riaccenderli). Provato nell'app vera coi telefoni finti contro la cartella principale: un amico qualunque e IL PAPPONE coi nuovi spenti vedono avatar IDENTICI a oggi (home, profilo, editor, 8 Bot); IL PAPPONE di partenza vede il disegno nuovo · (questo salvataggio)

- 29 ott 02:33 · 🧍 Avatar · salvato sul ramo `avatar-mii` (non online) · lavoro della notte, pezzo 1: le faccine piccole del disegno nuovo si leggono come oggi (misurato il contrasto degli occhi a 28, 32 e 40 px su 40 avatar: sul telefono 151-163 contro 153-164 di oggi); occhi aperti appena più piccoli, chiusi e felici grandi come oggi, palpebre e sopracciglia come oggi, montature appena più fini; strumenti di misura in docs/stile/avatar-mii (misura.html, piccole.html) · (questo salvataggio)

- 29 ott 02:30 · Cervello · salvato · notte guidata dal Cervello (chiesto dal proprietario): mandate alle chat Notte vivace e Avatar le liste dei pezzi della notte, controllo ogni 20 minuti che le fa passare al pezzo dopo, stop se la settimana arriva al 25%, niente pubblicazione; resoconto alle 08:45

- 29 ott 01:50 · 🧍 Avatar · salvato sul ramo `avatar-mii` (copia `SG-avatar`; non in lavori-in-corso, non online) · passo 1 della strada A «Mii rifinito»: il disegno nuovo degli avatar c'è ma è SPENTO per tutti (si accende con l'interruttore dello stile; quello di oggi resta identico, controllato su 20.636 disegni); pagina di confronto prima/dopo in docs/stile/avatar-mii/ (look pronti, 8 Bot, 20 a caso, lui e lei in 10 pose, faccina grande e piccola, fondo blu notte e chiaro) e catalogo di tutti i pezzi. Aspetta il parere del proprietario · (questo salvataggio)

- 29 ott 01:15 · Cervello · salvato · registro aggiornato: Notte vivace online (v275), le copie di lavoro di Notte vivace e Avatar, la chat Avatar può partire insieme alla Notte vivace

- 29 ott 00:48 · 🌙 Notte vivace · PUBBLICATO · lo stile «🌙 Notte vivace» online al posto del Bianco e oro (novità v275): blu notte, vetro scuro, lampone come colore guida, carattere Plus Jakarta Sans, sfondo animato con luci e scintillii dietro le schermate dell'app (mai dietro le partite), home e saletta come nei disegni, tutte le altre schermate dell'app sistemate; le partite dei giochi restano come prima. Elenco dei giochi da convertire in docs/stile/notte-giochi.md (passo 3); il proprietario ha scelto di partire dal gruppo B (schermate di servizio dei giochi). Versione online ricostruita e provata (home, saletta, sfondo, Tris: nessun errore) · master (questo salvataggio)

- 28 ott 23:55 · 🌙 Notte vivace · salvato sul ramo `stile-notte` (non in lavori-in-corso, non online) · passo 2: tutte le altre schermate dell'app in Notte vivace (profilo, statistiche, editor e primo avatar, trofei coi metalli che si riconoscono, classifica e amici, novità, compagnie, inviti, Sala in tutti i suoi stati, «Chi gioca?», tornei, Chi vince resta, Scegliamo insieme, «Come giocate?», impostazioni dei giochi, finestre di conferma, pillole); fotografate e sistemate da 4 aiutanti Sonnet, unite e ricontrollate dalla chat. Prove: copione 24-46, 50, 51, 55, 76, 90, 96, 421 OK; 634 e 622 NO ma erano già NO prima (la Sala vista da chi è in coda in «Chi vince resta» a 360x640 sfora di 12-13 px: non dipende dallo stile, da sistemare a parte); 286 OK: tutti i 35 modi locali dei giochi partono · (questo salvataggio)

- 28 ott 21:50 · 🌙 Notte vivace · salvato sul ramo `stile-notte` (non in lavori-in-corso, non online) · passo 1: sfondo animato dietro le schermate dell'app (tre luci morbide lampone, viola e ciano che si spostano piano, scintillii che si accendono e spengono, profondità quando si scorre; fermo dietro le partite, con l'app in secondo piano e con «riduci movimento») + home e saletta come nei disegni «a-home» e «a-sala»; colori del Bianco e oro sostituiti ovunque (le altre schermate sono già scure, da rifinire nel passo 2); carattere nuovo Plus Jakarta Sans dentro l'app. Misurato col computer rallentato ×4: 60 immagini al secondo, lo sfondo costa ~1 ms. Aspetta il parere del proprietario · (questo salvataggio)

- 28 ott 20:45 · Cervello · salvato · il PC fisso ora ha 16 GB di RAM (2 × 8 GB Samsung, controllata dopo il riavvio vero): aggiornate le istruzioni del progetto e la procedura delle prove

- 28 ott 15:40 · Cervello · salvato · registro aggiornato dopo l'azzeramento della settimana: lo stile Bianco e oro online, la fase 3 sul ramo `grafica-luxury`, la RAM nuova ancora da montare
- 27 ott 02:32 · 🎨 Stile (cloud) · PUBBLICATO · lo stile «🤍 Bianco e oro» online (v274) insieme a L'Impostore col telefono bloccato (v273, della chat dell'Impostore, già provato) · master 42018da. Le partite dei giochi restano scure: la fase 3 (giochi uno per uno, elenco in docs/stile/fase3-giochi.md) aspetta il via del proprietario

- 27 ott 01:38 · 🎨 Stile (cloud) · salvato sul ramo `grafica-luxury` (su GitHub dal 27 ott 02:30, dopo aver installato l'app di Claude anche sull'account Paky358; non online) · fase 2: lo stile «Bianco e oro» scelto dal proprietario applicato a home, profilo, trofei, statistiche, classifica e amici, novità, codice, Sala, «Come giocate?», impostazioni, saletta, fogli, conferme, avvisi, editor dell'avatar, tornei e «Chi gioca?»; colori in un punto solo (variabili --o-*), titoli col carattere elegante dentro l'app, simboli dorati al posto delle emoji nei tasti; le partite dei giochi restano come prima. Prove copione 24-46, 50, 51, 55, 76, 90, 96 OK; 12 giochi aperti e giocati. Fase 3 (elenco dei giochi da convertire) in docs/stile/fase3-giochi.md · (questo salvataggio)

- 26 ott 22:11 · 🎨 Stile (cloud) · salvato sul ramo `grafica-luxury` (non online) · fase 1: 4 direzioni di stile disegnate (Notte di lusso, Chiaro editoriale, Vetro e metallo, Bianco e oro) per home, saletta e colori dentro ai giochi, confronto in docs/stile/confronto.png; l'app non è cambiata. Aspetta la scelta del proprietario · (questo salvataggio)

- 26 ott 20:55 · L'Impostore · salvato (non online) · chi blocca il telefono online resta in partita (📱) e il voto lo aspetta: prima, se lo facevano in tanti, la partita finiva da sola dopo 20 s (v273); prove 5ib1-5ib5 nuove + 5im1-5im4, imp1-imp6, el1-el7, cg1 OK · (questo salvataggio). In sospeso: 518 coppie nuove in 10 temi aspettano il sì del proprietario; i 250 USD di crediti cloud (scadono il 5 nov) non consumano il limite settimanale; il piano è Max (lo dice l'app, non Pro)

- 26 ott 17:30 · Linea del tempo · PUBBLICATO · Rubala, Epoca, Cambia carta, 1.842 foto, ritardatari, Ognuno la sua linea (v267-v272) · 83b9c3b. Resta: «🤖 Gioca col Bot» (proposta una chat nuova), la decisione sulla carta sbagliata nella linea
- 26 ott 16:55 · Cervello · salvato · nato il registro del Cervello e la regola del diario nelle istruzioni del progetto
- 26 ott 16:27 · Linea del tempo · salvato (non online) · Ognuno la sua linea: 5 ritocchi dopo la revisione (v272) · a4941aa
- 26 ott 15:48 · Linea del tempo · salvato (non online) · 🧍 Ognuno la sua linea (v272) · 044b9b2
- 26 ott 14:11 · Linea del tempo · salvato (non online) · chi arriva tardi entra al giro dopo (v271) · f8c8800
- 26 ott 11:44-12:06 · Linea del tempo · salvato (non online) · foto vere su Cinema, Musica e Rap, Calcio e Sport: 1.842 foto in tutto (v270) · 9302034
- 26 ott 01:32-03:35 · Linea del tempo · salvato (non online) · Rubala (v267), Epoca (v268), Cambia carta (v269), prime foto (Storia, Invenzioni, Videogiochi, Vita all'italiana) · ce234d6
- 25 ott sera · Prezzo · PUBBLICATO · una schermata sola in tutti i giochi a premi, 1.312 foto (v266) · 0553508
- 24 ott · Prezzo · PUBBLICATO · una lista sola nella Spesa e in Mettili in ordine, in due chi perde non prende punti, prezzi ricontrollati (v263-v265) · 1392b2a
- 24 ott · Prezzo · PUBBLICATO · 4 giochi a premi nuovi, riquadri con la descrizione ovunque (v261-v262) · cbc0abb
- 23 ott · Prezzo · PUBBLICATO · Vetrina misteriosa, Guarda/Entra, 454 prodotti e 72 vetrine nuove (v258-v260) · 9634939
- 22-23 ott · Prezzo · PUBBLICATO · foto vere, punti più giusti, La Spesa, La Cassaforte, Ruota dal vivo (v256-v257) · 131b207
- 22 ott sera · Asta · PUBBLICATO · rigoristi, battitori, angoli, quotazioni di oggi (v255) · 55ab240
- 22 ott · Parola d'ordine · PUBBLICATO · Parola d'ordine tutta nuova (v253)

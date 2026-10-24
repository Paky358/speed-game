/* =========================================================
   DATI — «Il Prezzo è Giusto!», vetrine in più (autore 5, 23 ott 2026): 36 vetrine nuove (viaggi, feste, passioni,
   casa). Il proprietario: «giocando una trentina di partite ritrovi un po' le stesse cose». Ognuna ha un premio grosso,
   qualcuno medio e uno piccolo e simpatico; prezzi medi in Italia nel 2026 (i premi più cari e di marca ricontrollati
   su internet a ottobre 2026), arrotondati come gli altri. Da rileggere una volta l'anno.
   ========================================================= */
window.SG_PREZZO = window.SG_PREZZO || { anno: 2026, prodotti: [], vetrine: [] };

window.SG_PREZZO.vetrine.push(
  { id: "a5-v-maldive", titolo: "Luna di miele alle Maldive", e: "🏝️", pezzi: [
    { e: "🏠", nome: "Una settimana in villa sull'acqua", desc: "Sette notti per due nella palafitta sull'oceano, con la colazione", prezzo: 8400 },
    { e: "✈️", nome: "Due voli in business per Malé", desc: "Andata e ritorno da Milano, con lo scalo", prezzo: 7000 },
    { e: "🐟", nome: "Immersione con le mante", desc: "Uscita in barca con la guida, per due", prezzo: 300 },
    { e: "🧴", nome: "Crema solare SPF 50", desc: "Il flacone grande, per non tornare a casa rossi", prezzo: 15 }
  ] },
  { id: "a5-v-laurea", titolo: "Finalmente dottore", e: "🎓", pezzi: [
    { e: "🍽️", nome: "Pranzo di laurea per 30", desc: "Antipasti, primo, secondo e torta al ristorante", prezzo: 1500 },
    { e: "🌴", nome: "Viaggio a Ibiza con gli amici", desc: "Volo e una settimana in appartamento", prezzo: 900 },
    { e: "📘", nome: "Tre copie della tesi rilegate", desc: "Copertina rigida con le scritte dorate", prezzo: 90 },
    { e: "🌿", nome: "Corona d'alloro", desc: "Fresca, fatta dal fiorista la mattina stessa", prezzo: 40 },
    { e: "🍬", nome: "Confetti rossi, un chilo", desc: "Rossi come vuole la tradizione della laurea", prezzo: 25 }
  ] },
  { id: "a5-v-prima-casa", titolo: "La prima casa", e: "🏠", pezzi: [
    { e: "🍳", nome: "Cucina IKEA completa", desc: "Mobili, piano di lavoro ed elettrodomestici", prezzo: 3500 },
    { e: "✍️", nome: "Il rogito dal notaio", desc: "La parcella del notaio per una prima casa", prezzo: 2500 },
    { e: "🛏️", nome: "Letto matrimoniale col materasso", desc: "Contenitore e materasso in memory", prezzo: 1200 },
    { e: "🔑", nome: "Zerbino «Benvenuti»", desc: "Il primo acquisto di ogni casa nuova", prezzo: 15 }
  ] },
  { id: "a5-v-camper", titolo: "In camper per l'Europa", e: "🚐", pezzi: [
    { e: "🚐", nome: "Camper a noleggio, due settimane", desc: "Sei posti letto, ad agosto", prezzo: 2800 },
    { e: "🚲", nome: "Due bici col portabici", desc: "Da attaccare dietro il camper", prezzo: 800 },
    { e: "⛽", nome: "Il pieno del camper", desc: "Un serbatoio di gasolio", prezzo: 110 },
    { e: "🪑", nome: "Tavolino e sedie pieghevoli", desc: "Per la cena davanti al lago", prezzo: 90 },
    { e: "🏕️", nome: "Una notte in campeggio", desc: "La piazzola col camper e la corrente", prezzo: 45 }
  ] },
  { id: "a5-v-crociera", titolo: "Crociera nel Mediterraneo", e: "🛳️", pezzi: [
    { e: "🛳️", nome: "Sette notti in crociera, per due", desc: "Cabina col balcone, Genova, Marsiglia, Barcellona…", prezzo: 2400 },
    { e: "🍹", nome: "Pacchetto bevande per due", desc: "Tutto incluso per la settimana", prezzo: 840 },
    { e: "🏛️", nome: "Escursione ad Atene", desc: "Gita all'Acropoli con la guida, a testa", prezzo: 90 },
    { e: "📷", nome: "Foto della cena di gala", desc: "Stampata, con la cornice della nave", prezzo: 25 }
  ] },
  { id: "a5-v-pizzaiolo", titolo: "Il pizzaiolo di casa", e: "🍕", pezzi: [
    { e: "🔥", nome: "Forno a legna da giardino", desc: "In acciaio e refrattario, cuoce in 90 secondi", prezzo: 2500 },
    { e: "👨‍🍳", nome: "Corso da pizzaiolo", desc: "Una settimana con un maestro napoletano", prezzo: 450 },
    { e: "🪵", nome: "Pala per pizza", desc: "In alluminio, col manico lungo", prezzo: 45 },
    { e: "🌾", nome: "Farina per pizza, 25 kg", desc: "Il sacco grande da pizzeria", prezzo: 30 },
    { e: "🧀", nome: "Mozzarella di bufala, 1 kg", desc: "Campana, arrivata la mattina", prezzo: 16 }
  ] },
  { id: "a5-v-caffe", titolo: "Il caffè perfetto", e: "☕", pezzi: [
    { e: "☕", nome: "Macchina espresso La Marzocco", desc: "La Linea Mini R, quella dei bar ma per casa", prezzo: 5300 },
    { e: "⚙️", nome: "Macinacaffè Eureka", desc: "Fatto a Firenze, macina al momento", prezzo: 450 },
    { e: "🫘", nome: "Caffè in grani, 1 kg", desc: "Miscela da torrefazione", prezzo: 30 },
    { e: "🫖", nome: "Moka Bialetti da 3 tazze", desc: "Per i giorni di nostalgia", prezzo: 30 }
  ] },
  { id: "a5-v-eolie", titolo: "In gommone alle Eolie", e: "🚤", pezzi: [
    { e: "🚤", nome: "Gommone con motore da 40 cavalli", desc: "Sei metri, si porta senza patente", prezzo: 18000 },
    { e: "⚓", nome: "Ormeggio per una settimana", desc: "Al porto di Lipari, ad agosto", prezzo: 700 },
    { e: "🦺", nome: "Quattro giubbotti salvagente", desc: "Obbligatori a bordo", prezzo: 120 },
    { e: "🍋", nome: "Granita alla mandorla", desc: "Al bar del porto, con la brioche", prezzo: 5 }
  ] },
  { id: "a5-v-vela", titolo: "Una settimana in barca a vela", e: "⛵", pezzi: [
    { e: "⛵", nome: "Barca a vela con skipper", desc: "Una settimana in Croazia, per sei", prezzo: 4500 },
    { e: "🧭", nome: "Corso di vela", desc: "Dieci uscite in mare col maestro", prezzo: 450 },
    { e: "🧥", nome: "Giacca cerata da vela", desc: "Antivento e impermeabile", prezzo: 200 },
    { e: "🧢", nome: "Cappellino da marinaio", desc: "Bianco, con l'ancora ricamata", prezzo: 20 }
  ] },
  { id: "a5-v-giardino", titolo: "Il pollice verde", e: "🌱", pezzi: [
    { e: "🤖", nome: "Robot tagliaerba Husqvarna", desc: "Taglia il prato da solo, anche quando piove", prezzo: 1500 },
    { e: "🏡", nome: "Serra da giardino", desc: "In policarbonato, tre metri per due", prezzo: 600 },
    { e: "🌻", nome: "Semi per l'orto, 30 bustine", desc: "Pomodori, zucchine, basilico e tanto altro", prezzo: 45 },
    { e: "🚿", nome: "Annaffiatoio di latta", desc: "Dieci litri, verde come una volta", prezzo: 25 }
  ] },
  { id: "a5-v-palestra", titolo: "Remise en forme", e: "💪", pezzi: [
    { e: "🏃", nome: "Tapis roulant per casa", desc: "Pieghevole, fino a 18 km/h", prezzo: 900 },
    { e: "🏋️", nome: "Un anno in palestra", desc: "Abbonamento con sala pesi e corsi", prezzo: 600 },
    { e: "🧑‍🏫", nome: "Dieci lezioni col personal trainer", desc: "Un'ora a lezione, in palestra", prezzo: 400 },
    { e: "⚖️", nome: "Bilancia smart", desc: "Pesa e misura il grasso, manda tutto al telefono", prezzo: 60 },
    { e: "🥤", nome: "Shaker per le proteine", desc: "Quello che fa rumore nello spogliatoio", prezzo: 10 }
  ] },
  { id: "a5-v-ciclista", titolo: "Il ciclista della domenica", e: "🚴", pezzi: [
    { e: "🚴", nome: "Bici da corsa Bianchi in carbonio", desc: "Celeste come vuole la tradizione", prezzo: 3500 },
    { e: "📟", nome: "Ciclocomputer Garmin Edge", desc: "Navigatore, velocità e battiti", prezzo: 400 },
    { e: "👕", nome: "Maglia e salopette", desc: "Il completo tecnico estivo", prezzo: 180 },
    { e: "🏁", nome: "Iscrizione a una granfondo", desc: "Cento chilometri con il pacco gara", prezzo: 60 },
    { e: "🍶", nome: "Borraccia", desc: "Da 750 ml, per la salita", prezzo: 10 }
  ] },
  { id: "a5-v-maratona", titolo: "La maratona di New York", e: "🏃", pezzi: [
    { e: "🗽", nome: "Viaggio con il pettorale", desc: "Volo, cinque notti a Manhattan e iscrizione alla gara", prezzo: 3200 },
    { e: "⌚", nome: "Orologio Garmin Forerunner", desc: "GPS e battito per allenarsi", prezzo: 450 },
    { e: "👟", nome: "Scarpe da corsa in carbonio", desc: "Le scarpe dei record", prezzo: 280 },
    { e: "🍯", nome: "Gel energetici, 10 bustine", desc: "Per non fermarsi al trentesimo chilometro", prezzo: 25 }
  ] },
  { id: "a5-v-golf", titolo: "Diciotto buche", e: "⛳", pezzi: [
    { e: "🏌️", nome: "Un anno al golf club", desc: "La quota annuale, campo da 18 buche", prezzo: 2500 },
    { e: "🎒", nome: "Sacca con le mazze", desc: "Set completo, legni, ferri e putter", prezzo: 1500 },
    { e: "👨‍🏫", nome: "Dieci ore col maestro", desc: "Per imparare a non bucare il prato", prezzo: 500 },
    { e: "⚪", nome: "Palline da golf, 12", desc: "Una confezione di quelle buone", prezzo: 55 }
  ] },
  { id: "a5-v-tennis", titolo: "Il tennista", e: "🎾", pezzi: [
    { e: "🎾", nome: "Un anno di lezioni di tennis", desc: "Due volte a settimana, in gruppo", prezzo: 1200 },
    { e: "🏟️", nome: "Due biglietti per gli Internazionali", desc: "Sul Centrale del Foro Italico, il giorno della finale", prezzo: 1180 },
    { e: "🏸", nome: "Racchetta Babolat Pure Drive", desc: "Quella che usano in tanti", prezzo: 270 },
    { e: "🥎", nome: "Tubo di palline", desc: "Quattro palline nuove", prezzo: 7 }
  ] },
  { id: "a5-v-roma", titolo: "Tre giorni a Roma", e: "🏛️", pezzi: [
    { e: "🏨", nome: "Tre notti in una suite in via Veneto", desc: "Hotel di lusso, per due", prezzo: 2400 },
    { e: "🛵", nome: "Tour in Vespa per Roma", desc: "Tre ore con la guida, come in Vacanze romane", prezzo: 150 },
    { e: "🏛️", nome: "Biglietto del Colosseo", desc: "Con Foro Romano e Palatino", prezzo: 18 },
    { e: "🖼️", nome: "Biglietto dei Musei Vaticani", desc: "Con la Cappella Sistina", prezzo: 25 },
    { e: "🍙", nome: "Supplì", desc: "Quello col filo di mozzarella", prezzo: 2.5 }
  ] },
  { id: "a5-v-venezia", titolo: "Weekend a Venezia", e: "🛶", pezzi: [
    { e: "🏨", nome: "Tre notti di lusso sul Canal Grande", desc: "Camera con la vista, per due", prezzo: 2400 },
    { e: "🛶", nome: "Giro in gondola", desc: "Mezz'ora, di giorno", prezzo: 90 },
    { e: "🎭", nome: "Maschera fatta a mano", desc: "In cartapesta, da una bottega veneziana", prezzo: 80 },
    { e: "🍸", nome: "Bellini all'Harry's Bar", desc: "Dove è nato, nel 1948", prezzo: 24 },
    { e: "🚤", nome: "Vaporetto per 24 ore", desc: "Biglietto per tutte le linee", prezzo: 25 }
  ] },
  { id: "a5-v-firenze", titolo: "Firenze col naso all'insù", e: "🌸", pezzi: [
    { e: "👜", nome: "Borsa di pelle fatta a mano", desc: "Da una bottega di Santa Croce", prezzo: 250 },
    { e: "🥩", nome: "Bistecca alla fiorentina", desc: "Un chilo, al ristorante", prezzo: 60 },
    { e: "🖼️", nome: "Biglietto degli Uffizi", desc: "Botticelli, Leonardo, Caravaggio", prezzo: 25 },
    { e: "🏡", nome: "Una settimana in villa nel Chianti", desc: "Per quattro, con la piscina tra le vigne", prezzo: 3500 },
    { e: "🥪", nome: "Panino col lampredotto", desc: "Dal chiosco, con la salsa verde", prezzo: 6 }
  ] },
  { id: "a5-v-sicilia", titolo: "Sicilia on the road", e: "🍋", pezzi: [
    { e: "🏡", nome: "Villa con piscina a Taormina", desc: "Una settimana, con la vista sull'Etna", prezzo: 3500 },
    { e: "🚗", nome: "Auto a noleggio, due settimane", desc: "Per girare tutta l'isola", prezzo: 900 },
    { e: "🌋", nome: "Escursione sull'Etna in fuoristrada", desc: "Fino ai crateri, con la guida", prezzo: 90 },
    { e: "⛴️", nome: "Traghetto sullo Stretto", desc: "Con l'auto, da Villa San Giovanni a Messina", prezzo: 42 },
    { e: "🧁", nome: "Cannolo siciliano", desc: "Riempito al momento", prezzo: 3.5 }
  ] },
  { id: "a5-v-napoli", titolo: "Napoli che passione", e: "🌋", pezzi: [
    { e: "🏖️", nome: "Una settimana in Costiera Amalfitana", desc: "Hotel con terrazza sul mare, per due", prezzo: 2500 },
    { e: "⚽", nome: "Biglietto per vedere il Napoli", desc: "Una partita al Maradona, in tribuna", prezzo: 80 },
    { e: "⛴️", nome: "Gita a Capri in aliscafo", desc: "Andata e ritorno da Napoli", prezzo: 50 },
    { e: "🌶️", nome: "Corno portafortuna", desc: "Rosso, fatto a mano a San Gregorio Armeno", prezzo: 15 },
    { e: "🍕", nome: "Pizza margherita", desc: "In una pizzeria storica di Forcella", prezzo: 6 }
  ] },
  { id: "a5-v-sardegna", titolo: "Estate in Sardegna", e: "🏖️", pezzi: [
    { e: "🏡", nome: "Villa in Costa Smeralda", desc: "Una settimana di agosto, con la piscina", prezzo: 9000 },
    { e: "⛴️", nome: "Traghetto con l'auto", desc: "Andata e ritorno da Livorno, con la cabina", prezzo: 600 },
    { e: "⛱️", nome: "Ombrellone in prima fila", desc: "Un giorno di agosto, con due lettini", prezzo: 80 },
    { e: "🍯", nome: "Seadas col miele", desc: "Il dolce sardo, fritto al momento", prezzo: 6 }
  ] },
  { id: "a5-v-giappone", titolo: "Viaggio in Giappone", e: "🗾", pezzi: [
    { e: "✈️", nome: "Due voli per Tokyo", desc: "Andata e ritorno da Roma", prezzo: 2200 },
    { e: "♨️", nome: "Notte in un ryokan", desc: "L'albergo tradizionale con le terme, per due", prezzo: 400 },
    { e: "🚄", nome: "Japan Rail Pass di 7 giorni", desc: "Tutti i treni veloci per una settimana", prezzo: 290 },
    { e: "🍜", nome: "Ciotola di ramen", desc: "In un locale di Tokyo", prezzo: 7 }
  ] },
  { id: "a5-v-new-york", titolo: "Natale a New York", e: "🗽", pezzi: [
    { e: "🏨", nome: "Cinque notti a Manhattan", desc: "Hotel vicino a Times Square, per due", prezzo: 1800 },
    { e: "✈️", nome: "Volo per New York", desc: "Andata e ritorno da Milano", prezzo: 900 },
    { e: "🎭", nome: "Biglietto per un musical", desc: "A Broadway, in platea", prezzo: 190 },
    { e: "🏙️", nome: "Salita sull'Empire State Building", desc: "Fino all'86° piano", prezzo: 42 },
    { e: "🌭", nome: "Hot dog dal carretto", desc: "Con senape e cipolle", prezzo: 5 }
  ] },
  { id: "a5-v-pianista", titolo: "Il pianista", e: "🎹", pezzi: [
    { e: "🎹", nome: "Pianoforte verticale Yamaha", desc: "Il modello U1, nero lucido", prezzo: 11200 },
    { e: "🧑‍🏫", nome: "Un anno di lezioni di pianoforte", desc: "Una lezione a settimana", prezzo: 1200 },
    { e: "🪑", nome: "Panchetta regolabile", desc: "Per suonare all'altezza giusta", prezzo: 120 },
    { e: "⏱️", nome: "Metronomo", desc: "Quello a pendolo, di legno", prezzo: 35 }
  ] },
  { id: "a5-v-dj", titolo: "Il DJ", e: "🎧", pezzi: [
    { e: "🎛️", nome: "Console Pioneer DJ", desc: "Lettori e mixer insieme, per le serate", prezzo: 2300 },
    { e: "🔊", nome: "Due casse attive", desc: "Potenti abbastanza per una festa", prezzo: 800 },
    { e: "🎧", nome: "Cuffie da DJ", desc: "Chiuse, per sentire solo la musica", prezzo: 150 },
    { e: "🪩", nome: "Palla stroboscopica", desc: "Quella a specchietti che gira", prezzo: 25 }
  ] },
  { id: "a5-v-streamer", titolo: "Lo streamer", e: "🎥", pezzi: [
    { e: "🖥️", nome: "PC da gaming", desc: "Scheda video potente, luci colorate", prezzo: 2500 },
    { e: "🎙️", nome: "Microfono Shure SM7B", desc: "Quello dei podcast", prezzo: 400 },
    { e: "📷", nome: "Webcam 4K", desc: "Per farsi vedere bene in diretta", prezzo: 200 },
    { e: "💡", nome: "Luce ad anello", desc: "Con il treppiede", prezzo: 40 }
  ] },
  { id: "a5-v-cinema", titolo: "Il cinema in salotto", e: "🎬", pezzi: [
    { e: "📽️", nome: "Proiettore 4K", desc: "Per un film come al cinema", prezzo: 2000 },
    { e: "🔊", nome: "Impianto audio 5.1", desc: "Cinque casse e il subwoofer", prezzo: 900 },
    { e: "🖼️", nome: "Telo motorizzato da 120 pollici", desc: "Scende dal soffitto col telecomando", prezzo: 600 },
    { e: "📺", nome: "Un anno di Netflix Premium", desc: "In 4K, su quattro schermi", prezzo: 240 },
    { e: "🍿", nome: "Macchina per i popcorn", desc: "Come quella del cinema, ma piccola", prezzo: 60 }
  ] },
  { id: "a5-v-lettore", titolo: "Il topo di biblioteca", e: "📚", pezzi: [
    { e: "📚", nome: "Libreria a muro su misura", desc: "Dal pavimento al soffitto", prezzo: 2500 },
    { e: "🛋️", nome: "Poltrona da lettura", desc: "In velluto, col poggiapiedi", prezzo: 600 },
    { e: "📱", nome: "Kindle Paperwhite", desc: "Migliaia di libri in tasca", prezzo: 180 },
    { e: "🔖", nome: "Segnalibro in pelle", desc: "Fatto a mano", prezzo: 10 }
  ] },
  { id: "a5-v-chef", titolo: "Cena da chef stellato", e: "👨‍🍳", pezzi: [
    { e: "⭐", nome: "Cena per due in un tre stelle", desc: "Menù degustazione con i vini", prezzo: 1000 },
    { e: "🔪", nome: "Set di coltelli giapponesi", desc: "Tre coltelli in acciaio damasco", prezzo: 500 },
    { e: "🍄", nome: "Tartufo bianco d'Alba, 50 g", desc: "Da grattare sui tajarin", prezzo: 250 },
    { e: "🧑‍🍳", nome: "Corso di cucina con uno chef", desc: "Una giornata ai fornelli", prezzo: 250 }
  ] },
  { id: "a5-v-sommelier", titolo: "Il sommelier", e: "🍷", pezzi: [
    { e: "🎓", nome: "Corso da sommelier, primo livello", desc: "Quindici lezioni con la degustazione", prezzo: 700 },
    { e: "🍷", nome: "Sei bottiglie di Brunello di Montalcino", desc: "Un'annata buona", prezzo: 300 },
    { e: "🍾", nome: "Champagne Dom Pérignon", desc: "Una bottiglia, per le grandi occasioni", prezzo: 230 },
    { e: "🍾", nome: "Cantina climatizzata per 100 bottiglie", desc: "Da mettere in taverna", prezzo: 2000 },
    { e: "🔩", nome: "Cavatappi da sommelier", desc: "Quello a due tempi", prezzo: 15 }
  ] },
  { id: "a5-v-gelato", titolo: "Il gelato fatto in casa", e: "🍨", pezzi: [
    { e: "🎓", nome: "Corso da gelatiere", desc: "Una settimana alla scuola di gelato", prezzo: 1000 },
    { e: "🍦", nome: "Gelatiera col compressore", desc: "Gelato pronto in mezz'ora", prezzo: 300 },
    { e: "🛒", nome: "Carretto dei gelati d'epoca", desc: "Con le ruote e l'ombrellino, per le feste", prezzo: 4000 },
    { e: "🍨", nome: "Un cono da tre gusti", desc: "Per confrontarlo col tuo", prezzo: 4 }
  ] },
  { id: "a5-v-nonna", titolo: "La cucina della nonna", e: "👵", pezzi: [
    { e: "🥣", nome: "Bimby TM7", desc: "Cucina, pesa e impasta da solo", prezzo: 1599 },
    { e: "🎂", nome: "Planetaria KitchenAid", desc: "La Artisan, color crema", prezzo: 620 },
    { e: "🪵", nome: "Spianatoia e mattarello", desc: "Per la sfoglia tirata a mano", prezzo: 60 },
    { e: "🥟", nome: "Tortellini fatti a mano, 1 kg", desc: "Da un pastificio di Bologna", prezzo: 35 }
  ] },
  { id: "a5-v-pulizie", titolo: "Pulizie di primavera", e: "🧽", pezzi: [
    { e: "🧹", nome: "Un anno di pulizie", desc: "L'impresa una volta al mese, per tutta la casa", prezzo: 1800 },
    { e: "🌀", nome: "Folletto Vorwerk", desc: "Con il battitappeto e la lavapavimenti", prezzo: 1500 },
    { e: "🤖", nome: "Robot aspirapolvere", desc: "Aspira e lava da solo, poi si svuota", prezzo: 800 },
    { e: "🧹", nome: "Scopa di saggina", desc: "Per gli angoli, come una volta", prezzo: 10 }
  ] },
  { id: "a5-v-bucato", titolo: "Il bucato perfetto", e: "👕", pezzi: [
    { e: "🌬️", nome: "Asciugatrice a pompa di calore", desc: "Niente più stendini in salotto", prezzo: 800 },
    { e: "🫧", nome: "Lavatrice da 9 kg", desc: "Silenziosa, in classe A", prezzo: 700 },
    { e: "♨️", nome: "Ferro da stiro con caldaia", desc: "Tanto vapore, meno fatica", prezzo: 300 },
    { e: "📎", nome: "Mollette, 50 pezzi", desc: "Di legno, per il filo", prezzo: 6 }
  ] },
  { id: "a5-v-casa-smart", titolo: "La casa intelligente", e: "📱", pezzi: [
    { e: "🚨", nome: "Impianto d'allarme con le telecamere", desc: "Sensori e quattro telecamere, montati", prezzo: 1800 },
    { e: "🌡️", nome: "Termostato smart", desc: "Accende il riscaldamento prima che torni", prezzo: 250 },
    { e: "🔐", nome: "Serratura smart", desc: "La porta si apre col telefono", prezzo: 250 },
    { e: "🔈", nome: "Altoparlante Amazon Echo", desc: "Alexa, accendi la luce!", prezzo: 100 },
    { e: "💡", nome: "Lampadine smart, 4 pezzi", desc: "Cambiano colore con la voce", prezzo: 60 }
  ] },
  { id: "a5-v-bagno", titolo: "Il bagno nuovo", e: "🛁", pezzi: [
    { e: "🛠️", nome: "Rifare il bagno", desc: "Piastrelle, sanitari e impianti, chiavi in mano", prezzo: 12000 },
    { e: "🚿", nome: "Box doccia in cristallo", desc: "Con il soffione a pioggia", prezzo: 900 },
    { e: "🧖", nome: "Accappatoio morbido", desc: "Di spugna pesante", prezzo: 60 },
    { e: "🦆", nome: "Paperella di gomma", desc: "Gialla, quella classica", prezzo: 5 }
  ] }
);

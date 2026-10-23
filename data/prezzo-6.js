/* =========================================================
   DATI — «Il Prezzo è Giusto!», vetrine in più (autore 6, 23 ott 2026): altre 36 vetrine (animali, feste dell'anno,
   motori, sport, viaggi, spettacoli). Come in prezzo-5.js: un premio grosso, qualcuno medio e uno piccolo e simpatico;
   prezzi medi in Italia nel 2026 (i premi più cari e di marca ricontrollati su internet a ottobre 2026).
   ========================================================= */
window.SG_PREZZO = window.SG_PREZZO || { anno: 2026, prodotti: [], vetrine: [] };

window.SG_PREZZO.vetrine.push(
  { id: "a6-v-cane", titolo: "Arriva il cane", e: "🐕", pezzi: [
    { e: "🍖", nome: "Un anno di crocchette buone", desc: "Per un cane di taglia media", prezzo: 700 },
    { e: "🎓", nome: "Corso di educazione cinofila", desc: "Dieci lezioni con l'addestratore", prezzo: 400 },
    { e: "💉", nome: "Vaccini e microchip", desc: "La prima visita dal veterinario", prezzo: 150 },
    { e: "🏡", nome: "Recinto e casetta in giardino", desc: "In legno, montati", prezzo: 1200 },
    { e: "🦮", nome: "Guinzaglio e collare", desc: "Coordinati, con la medaglietta", prezzo: 40 }
  ] },
  { id: "a6-v-gatto", titolo: "Il re dei gatti", e: "🐈", pezzi: [
    { e: "🥫", nome: "Un anno di cibo umido", desc: "Due bustine al giorno", prezzo: 600 },
    { e: "🚽", nome: "Lettiera autopulente", desc: "Si pulisce da sola dopo ogni visita", prezzo: 500 },
    { e: "🌳", nome: "Albero tiragraffi gigante", desc: "Due metri, con le cucce in alto", prezzo: 200 },
    { e: "🐭", nome: "Topolino giocattolo", desc: "Con l'erba gatta dentro", prezzo: 3 },
    { e: "🩺", nome: "Un anno di veterinario", desc: "Visite, vaccini e assicurazione", prezzo: 500 }
  ] },
  { id: "a6-v-acquario", titolo: "L'acquario", e: "🐠", pezzi: [
    { e: "🐠", nome: "Acquario da 300 litri", desc: "Con il mobile, le luci e il filtro", prezzo: 1500 },
    { e: "🐟", nome: "Venti pesci tropicali", desc: "Neon, guppy e un pesce pagliaccio", prezzo: 200 },
    { e: "🪸", nome: "Piante e sassi per il fondo", desc: "Per fare un piccolo giardino sott'acqua", prezzo: 80 },
    { e: "💰", nome: "Scrigno del tesoro", desc: "Decorazione che fa le bollicine", prezzo: 15 }
  ] },
  { id: "a6-v-cavallo", titolo: "A cavallo", e: "🐎", pezzi: [
    { e: "🐴", nome: "Un anno di pensione per un cavallo", desc: "Box, fieno e paddock al maneggio", prezzo: 3600 },
    { e: "🏇", nome: "Venti lezioni di equitazione", desc: "Col maestro, in maneggio", prezzo: 600 },
    { e: "👢", nome: "Stivali da equitazione e casco", desc: "In pelle, su misura", prezzo: 350 },
    { e: "🥕", nome: "Un sacco di carote", desc: "Dieci chili, per farsi degli amici", prezzo: 10 }
  ] },
  { id: "a6-v-sposa", titolo: "L'abito da sposa", e: "👰", pezzi: [
    { e: "👗", nome: "Abito da sposa", desc: "Di un atelier italiano, con le modifiche", prezzo: 3000 },
    { e: "💍", nome: "Due fedi nuziali in oro", desc: "Oro giallo, con l'incisione", prezzo: 1200 },
    { e: "💄", nome: "Trucco e acconciatura", desc: "La mattina del sì, con la prova", prezzo: 400 },
    { e: "💐", nome: "Bouquet della sposa", desc: "Peonie e rose bianche", prezzo: 200 },
    { e: "🍚", nome: "Riso da lanciare, 1 kg", desc: "Per l'uscita dalla chiesa", prezzo: 2 }
  ] },
  { id: "a6-v-nubilato", titolo: "Addio al nubilato a Barcellona", e: "💃", pezzi: [
    { e: "✈️", nome: "Voli e due notti per sei amiche", desc: "Appartamento in centro, Barcellona", prezzo: 3000 },
    { e: "💃", nome: "Spettacolo di flamenco, per sei", desc: "Con la cena di tapas", prezzo: 360 },
    { e: "👕", nome: "Sei magliette uguali", desc: "Con la scritta «Team sposa»", prezzo: 90 },
    { e: "👑", nome: "Coroncina col velo", desc: "Per la futura sposa", prezzo: 10 }
  ] },
  { id: "a6-v-halloween", titolo: "La notte di Halloween", e: "🎃", pezzi: [
    { e: "🏰", nome: "Viaggio in Transilvania, per due", desc: "Volo, quattro notti e la visita al castello di Dracula", prezzo: 1800 },
    { e: "🎢", nome: "Gardaland Magic Halloween", desc: "Il biglietto della sera, il venerdì da paura", prezzo: 29 },
    { e: "🧛", nome: "Costume da vampiro", desc: "Mantello, denti e trucco", prezzo: 60 },
    { e: "🍬", nome: "Caramelle, 2 kg", desc: "Per «dolcetto o scherzetto»", prezzo: 20 },
    { e: "🎃", nome: "Zucca gigante", desc: "Da intagliare con gli occhi e la bocca", prezzo: 15 }
  ] },
  { id: "a6-v-carnevale", titolo: "Carnevale da Viareggio a Rio", e: "🎭", pezzi: [
    { e: "🇧🇷", nome: "Viaggio al Carnevale di Rio, per due", desc: "Volo, una settimana in hotel e la tribuna al Sambodromo", prezzo: 4500 },
    { e: "🤡", nome: "Costume da Arlecchino", desc: "Coi rombi colorati e la maschera", prezzo: 80 },
    { e: "🎟️", nome: "Biglietto per i corsi mascherati", desc: "Per vedere sfilare i carri", prezzo: 20 },
    { e: "🥨", nome: "Un vassoio di chiacchiere", desc: "Fritte, con lo zucchero a velo", prezzo: 15 },
    { e: "🎊", nome: "Coriandoli e stelle filanti", desc: "Il sacchetto grande", prezzo: 8 }
  ] },
  { id: "a6-v-capodanno", titolo: "Capodanno in montagna", e: "🎆", pezzi: [
    { e: "🏔️", nome: "Tre notti in baita", desc: "Per due, con la mezza pensione", prezzo: 1200 },
    { e: "🍽️", nome: "Cenone di Capodanno per due", desc: "Sette portate e il brindisi", prezzo: 400 },
    { e: "🍾", nome: "Franciacorta", desc: "Una bottiglia per la mezzanotte", prezzo: 30 },
    { e: "🫘", nome: "Cotechino e lenticchie", desc: "Per portare soldi tutto l'anno", prezzo: 15 }
  ] },
  { id: "a6-v-pasqua", titolo: "Pasqua e Pasquetta", e: "🐣", pezzi: [
    { e: "🏡", nome: "Pranzo di Pasqua in agriturismo", desc: "Per quattro, con l'agnello", prezzo: 240 },
    { e: "🔥", nome: "Grigliata di Pasquetta per dieci", desc: "Carne, salsicce e carbonella", prezzo: 200 },
    { e: "🥚", nome: "Uovo di cioccolato gigante", desc: "Un chilo, con la sorpresa", prezzo: 60 },
    { e: "🕊️", nome: "Colomba artigianale", desc: "Da una pasticceria", prezzo: 35 },
    { e: "💃", nome: "Settimana Santa a Siviglia, per due", desc: "Volo e cinque notti per vedere le processioni", prezzo: 1600 }
  ] },
  { id: "a6-v-ferragosto", titolo: "Ferragosto in Romagna", e: "🏖️", pezzi: [
    { e: "🏨", nome: "Una settimana a Riccione", desc: "Pensione completa, per due", prezzo: 1400 },
    { e: "⛱️", nome: "Ombrellone per tutta l'estate", desc: "Con due lettini, in terza fila", prezzo: 1200 },
    { e: "🦩", nome: "Materassino a fenicottero", desc: "Gonfiabile, rosa", prezzo: 25 },
    { e: "🚣", nome: "Pedalò per un'ora", desc: "Con lo scivolo", prezzo: 20 },
    { e: "🍉", nome: "Anguria", desc: "Da dieci chili, per tutti", prezzo: 8 }
  ] },
  { id: "a6-v-san-valentino", titolo: "San Valentino", e: "❤️", pezzi: [
    { e: "💍", nome: "Anello con diamante", desc: "In oro bianco, per la proposta", prezzo: 2500 },
    { e: "🕯️", nome: "Cena romantica per due", desc: "A lume di candela, con lo spumante", prezzo: 200 },
    { e: "🌹", nome: "Dodici rose rosse", desc: "A gambo lungo", prezzo: 60 },
    { e: "🍫", nome: "Scatola di Baci Perugina", desc: "Coi bigliettini d'amore", prezzo: 8.4 }
  ] },
  { id: "a6-v-mamma", titolo: "Festa della mamma", e: "💐", pezzi: [
    { e: "💨", nome: "Asciugacapelli Dyson Supersonic", desc: "Quello che sembra un'astronave", prezzo: 450 },
    { e: "💎", nome: "Bracciale Pandora con ciondoli", desc: "Argento, con tre charm", prezzo: 210 },
    { e: "🧖", nome: "Una giornata alle terme", desc: "Ingresso e massaggio", prezzo: 200 },
    { e: "🌸", nome: "Orchidea in vaso", desc: "Bianca, dal fiorista", prezzo: 30 },
    { e: "🗼", nome: "Weekend a Parigi, per due", desc: "Volo e due notti in centro", prezzo: 1200 }
  ] },
  { id: "a6-v-scuola", titolo: "Il primo giorno di scuola", e: "🎒", pezzi: [
    { e: "📱", nome: "Tablet per la scuola", desc: "Con la custodia e la tastiera", prezzo: 450 },
    { e: "📚", nome: "I libri delle medie, un anno", desc: "Tutti quelli della lista", prezzo: 300 },
    { e: "🎒", nome: "Zaino della scuola", desc: "Quello estensibile, colorato", prezzo: 70 },
    { e: "🇬🇧", nome: "Un anno di lezioni d'inglese", desc: "Due pomeriggi a settimana, in una scuola di lingue", prezzo: 1500 },
    { e: "📔", nome: "Diario", desc: "Quello che piace a tutta la classe", prezzo: 15 }
  ] },
  { id: "a6-v-festa-bimbi", titolo: "Festa di compleanno da paura", e: "🎈", pezzi: [
    { e: "🤹", nome: "Animatore per tre ore", desc: "Giochi, palloncini e trucca bimbi", prezzo: 250 },
    { e: "🏰", nome: "Castello gonfiabile", desc: "A noleggio, per un pomeriggio", prezzo: 200 },
    { e: "🎂", nome: "Torta per 30 bambini", desc: "Con il personaggio preferito", prezzo: 150 },
    { e: "🏰", nome: "Weekend a Disneyland Paris, per quattro", desc: "Volo, due notti e i parchi", prezzo: 2000 },
    { e: "🕯️", nome: "Candeline magiche", desc: "Quelle che si riaccendono da sole", prezzo: 3 }
  ] },
  { id: "a6-v-elettrico", titolo: "Si va in elettrico", e: "⚡", pezzi: [
    { e: "🚘", nome: "Tesla Model 3", desc: "La versione base, nuova", prezzo: 36990 },
    { e: "☀️", nome: "Pannelli solari sul tetto", desc: "Impianto da 6 kW, montato", prezzo: 8000 },
    { e: "🔌", nome: "Wallbox in garage", desc: "Con l'installazione dell'elettricista", prezzo: 1000 },
    { e: "🧽", nome: "Lavaggio a mano", desc: "Dentro e fuori, all'autolavaggio", prezzo: 25 }
  ] },
  { id: "a6-v-cinquecento", titolo: "La Cinquecento d'epoca", e: "🚙", pezzi: [
    { e: "🚙", nome: "Fiat 500 d'epoca restaurata", desc: "Del 1970, col tettuccio apribile", prezzo: 9500 },
    { e: "🧰", nome: "Tagliando dal meccanico", desc: "Olio, candele e freni", prezzo: 250 },
    { e: "🛡️", nome: "Telo copriauto", desc: "Su misura, per il garage", prezzo: 50 },
    { e: "🗺️", nome: "Cartina stradale d'Italia", desc: "Di carta, come una volta", prezzo: 10 }
  ] },
  { id: "a6-v-scooter", titolo: "In scooter per la città", e: "🛵", pezzi: [
    { e: "🛵", nome: "Piaggio Liberty 125", desc: "Lo scooter a ruote alte, nuovo", prezzo: 3050 },
    { e: "🛴", nome: "Monopattino elettrico", desc: "Pieghevole, per l'ultimo chilometro", prezzo: 500 },
    { e: "⛑️", nome: "Casco jet", desc: "Con la visiera", prezzo: 120 },
    { e: "🔒", nome: "Antifurto ad arco", desc: "Quello pesante, in acciaio", prezzo: 60 }
  ] },
  { id: "a6-v-fuoristrada", titolo: "Avventura in 4x4", e: "🏜️", pezzi: [
    { e: "🚙", nome: "Suzuki Jimny", desc: "Il piccolo fuoristrada che va dappertutto, a due posti", prezzo: 27700 },
    { e: "⛺", nome: "Tenda da tetto", desc: "Si apre in un minuto sopra l'auto", prezzo: 2500 },
    { e: "🧊", nome: "Frigorifero portatile", desc: "A compressore, da 40 litri", prezzo: 500 },
    { e: "🔦", nome: "Torcia frontale", desc: "Per montare la tenda al buio", prezzo: 30 }
  ] },
  { id: "a6-v-campeggio", titolo: "Il campeggiatore", e: "⛺", pezzi: [
    { e: "🚌", nome: "Roulotte usata", desc: "Quattro posti letto, pronta per partire", prezzo: 6000 },
    { e: "⛺", nome: "Tenda per quattro", desc: "Con la veranda, per gli ospiti", prezzo: 300 },
    { e: "😴", nome: "Due sacchi a pelo", desc: "Caldi fino a cinque gradi", prezzo: 150 },
    { e: "🔥", nome: "Fornellino da campeggio", desc: "Con la bomboletta", prezzo: 40 },
    { e: "🏮", nome: "Lanterna", desc: "Ricaricabile, per la sera", prezzo: 25 }
  ] },
  { id: "a6-v-surf", titolo: "Il surfista", e: "🏄", pezzi: [
    { e: "🌊", nome: "Una settimana di surf camp", desc: "In Portogallo, con le lezioni", prezzo: 900 },
    { e: "🏄", nome: "Tavola da surf", desc: "Per chi ha appena cominciato", prezzo: 600 },
    { e: "🩱", nome: "Muta da surf", desc: "Tre millimetri, per l'acqua fresca", prezzo: 250 },
    { e: "🕯️", nome: "Cera per la tavola", desc: "Per non scivolare", prezzo: 5 }
  ] },
  { id: "a6-v-sub", titolo: "Sott'acqua", e: "🤿", pezzi: [
    { e: "🐠", nome: "Una settimana di immersioni nel Mar Rosso", desc: "Volo, hotel e dieci immersioni", prezzo: 1500 },
    { e: "🎓", nome: "Brevetto da sub", desc: "Il corso Open Water, teoria e piscina", prezzo: 500 },
    { e: "⌚", nome: "Computer subacqueo", desc: "L'orologio che dice quando risalire", prezzo: 400 },
    { e: "🤿", nome: "Maschera e boccaglio", desc: "Per guardare i pesci anche dalla barca", prezzo: 40 }
  ] },
  { id: "a6-v-pittore", titolo: "L'artista", e: "🎨", pezzi: [
    { e: "🖌️", nome: "Un anno di corso di pittura", desc: "Una sera a settimana", prezzo: 800 },
    { e: "🖼️", nome: "Cavalletto da studio", desc: "In legno di faggio", prezzo: 200 },
    { e: "🎨", nome: "Colori a olio professionali", desc: "La scatola di legno con 24 tubetti", prezzo: 150 },
    { e: "⬜", nome: "Cinque tele bianche", desc: "Da riempire", prezzo: 50 },
    { e: "🗼", nome: "Viaggio a Parigi coi musei, per due", desc: "Volo, tre notti e il Louvre", prezzo: 1200 }
  ] },
  { id: "a6-v-stelle", titolo: "Con la testa tra le stelle", e: "🔭", pezzi: [
    { e: "🌌", nome: "Viaggio in Lapponia", desc: "Quattro notti per vedere l'aurora boreale", prezzo: 2500 },
    { e: "🔭", nome: "Telescopio Celestron", desc: "Trova le stelle da solo", prezzo: 1330 },
    { e: "🔍", nome: "Binocolo", desc: "Per la Luna e gli uccelli", prezzo: 200 },
    { e: "🌠", nome: "Una notte all'osservatorio", desc: "Con l'astronomo che spiega", prezzo: 50 },
    { e: "🗺️", nome: "Mappa del cielo", desc: "Quella che gira per trovare le costellazioni", prezzo: 15 }
  ] },
  { id: "a6-v-mugello", titolo: "MotoGP al Mugello", e: "🏍️", pezzi: [
    { e: "🦺", nome: "Tuta in pelle da moto", desc: "Intera, con le protezioni", prezzo: 1500 },
    { e: "⛑️", nome: "Casco integrale da pista", desc: "In carbonio, come i piloti", prezzo: 1300 },
    { e: "🏟️", nome: "Tribuna al Mugello", desc: "Il giorno della gara", prezzo: 300 },
    { e: "🚩", nome: "Bandiera del pilota", desc: "Da sventolare in curva", prezzo: 20 }
  ] },
  { id: "a6-v-erasmus", titolo: "Erasmus a Valencia", e: "🇪🇸", pezzi: [
    { e: "🏠", nome: "Stanza per cinque mesi", desc: "In un appartamento con altri studenti", prezzo: 2500 },
    { e: "🗣️", nome: "Corso di spagnolo", desc: "Due mesi, prima di partire", prezzo: 300 },
    { e: "✈️", nome: "Volo low cost", desc: "Andata e ritorno, col bagaglio", prezzo: 150 },
    { e: "🧳", nome: "Valigia grande", desc: "Da 80 litri, per starci dentro tutto", prezzo: 120 },
    { e: "🥘", nome: "Paella per due", desc: "Quella vera, valenciana", prezzo: 40 }
  ] },
  { id: "a6-v-sanremo", titolo: "Una sera a Sanremo", e: "🎤", pezzi: [
    { e: "🎟️", nome: "Biglietto per la finale del Festival", desc: "In platea al Teatro Ariston", prezzo: 875 },
    { e: "🏨", nome: "Una notte a Sanremo", desc: "Hotel con la vista sul mare", prezzo: 300 },
    { e: "💐", nome: "Mazzo di fiori di Sanremo", desc: "Dalla Riviera dei Fiori", prezzo: 40 },
    { e: "🎙️", nome: "Microfono da karaoke", desc: "Per cantare le canzoni del Festival", prezzo: 40 },
    { e: "👗", nome: "Abito da sera da red carpet", desc: "Di un atelier, per la passerella sul tappeto rosso", prezzo: 1500 }
  ] },
  { id: "a6-v-concerto", titolo: "Il concerto a San Siro", e: "🎸", pezzi: [
    { e: "🏨", nome: "Una notte a Milano", desc: "Hotel vicino allo stadio", prezzo: 300 },
    { e: "🚄", nome: "Frecciarossa per Milano", desc: "Andata e ritorno", prezzo: 120 },
    { e: "🎟️", nome: "Pacchetto VIP per due", desc: "Posto sotto il palco e il saluto all'artista", prezzo: 1500 },
    { e: "👕", nome: "Maglietta del tour", desc: "Con le date dietro", prezzo: 35 },
    { e: "🌭", nome: "Panino con la salamella", desc: "Dal furgoncino fuori dallo stadio", prezzo: 7 }
  ] },
  { id: "a6-v-terme", titolo: "Weekend alle terme", e: "🧖", pezzi: [
    { e: "🔥", nome: "Sauna finlandese per casa", desc: "In legno, per due persone", prezzo: 4000 },
    { e: "♨️", nome: "Due notti in un resort termale", desc: "Per due, con le piscine calde", prezzo: 800 },
    { e: "💆", nome: "Massaggio di coppia", desc: "Un'ora con gli olii caldi", prezzo: 200 },
    { e: "🩴", nome: "Ciabatte da spa", desc: "Bianche, morbide", prezzo: 15 }
  ] },
  { id: "a6-v-stipendio", titolo: "Il primo stipendio", e: "💸", pezzi: [
    { e: "📱", nome: "iPhone 18 Pro", desc: "Da 256 GB, nuovo", prezzo: 1489 },
    { e: "🎧", nome: "AirPods Pro", desc: "Gli auricolari che tolgono il rumore", prezzo: 249 },
    { e: "🍝", nome: "Cena fuori coi genitori", desc: "Per dire grazie", prezzo: 150 },
    { e: "🐷", nome: "Porcellino salvadanaio", desc: "Di ceramica, per i risparmi", prezzo: 15 }
  ] },
  { id: "a6-v-trasloco", titolo: "Il grande trasloco", e: "📦", pezzi: [
    { e: "🚚", nome: "Ditta di traslochi", desc: "Un appartamento, da Roma a Milano", prezzo: 1500 },
    { e: "📦", nome: "Trenta scatoloni", desc: "Doppia onda, robusti", prezzo: 60 },
    { e: "🍕", nome: "Pizza per chi aiuta", desc: "Sei pizze e le bibite", prezzo: 50 },
    { e: "🎞️", nome: "Nastro adesivo da pacchi", desc: "Il rotolo marrone che fa rumore", prezzo: 3 }
  ] },
  { id: "a6-v-campagna", titolo: "La vita in campagna", e: "🚜", pezzi: [
    { e: "🚜", nome: "Motocoltivatore", desc: "Per zappare l'orto senza fatica", prezzo: 1500 },
    { e: "🛖", nome: "Pollaio in legno", desc: "Con il tetto e la scaletta", prezzo: 300 },
    { e: "🐔", nome: "Sei galline ovaiole", desc: "Un uovo fresco a testa, quasi ogni giorno", prezzo: 60 },
    { e: "🥾", nome: "Stivali di gomma", desc: "Verdi, per il fango", prezzo: 30 }
  ] },
  { id: "a6-v-sushi", titolo: "Sushi per tutti", e: "🍣", pezzi: [
    { e: "🍣", nome: "Cena omakase per due", desc: "Al bancone, decide lo chef", prezzo: 400 },
    { e: "🔪", nome: "Coltello da sushi", desc: "Lama giapponese a un filo", prezzo: 200 },
    { e: "🎏", nome: "Una settimana a Osaka, per due", desc: "Volo, hotel e il mercato del pesce all'alba", prezzo: 2400 },
    { e: "🍚", nome: "Riso per sushi, 5 kg", desc: "Quello a chicco tondo", prezzo: 25 },
    { e: "🥢", nome: "Bacchette laccate", desc: "Un paio, nella scatolina", prezzo: 15 }
  ] },
  { id: "a6-v-lucca", titolo: "A Lucca Comics", e: "🦸", pezzi: [
    { e: "🦸", nome: "Costume da cosplay", desc: "Fatto su misura, con l'armatura", prezzo: 300 },
    { e: "✍️", nome: "Tavoletta grafica", desc: "Per disegnare i fumetti al computer", prezzo: 400 },
    { e: "🎟️", nome: "Biglietto per tutti i giorni", desc: "Cinque giorni di Lucca Comics & Games", prezzo: 95 },
    { e: "📕", nome: "Fumetto autografato", desc: "Con il disegno dell'autore", prezzo: 25 },
    { e: "🌎", nome: "Viaggio al Comic-Con di San Diego, per due", desc: "Volo, hotel e i biglietti per tutti i giorni", prezzo: 4000 }
  ] },
  { id: "a6-v-harry-potter", titolo: "Un viaggio magico a Londra", e: "⚡", pezzi: [
    { e: "🏨", nome: "Tre notti a Londra", desc: "Hotel vicino a King's Cross, per due", prezzo: 900 },
    { e: "🏰", nome: "LEGO castello di Hogwarts", desc: "Il set grande, da collezione", prezzo: 500 },
    { e: "✈️", nome: "Due voli per Londra", desc: "Andata e ritorno", prezzo: 400 },
    { e: "🎬", nome: "Visita agli studi di Harry Potter", desc: "Dove hanno girato i film", prezzo: 65 },
    { e: "🪄", nome: "Bacchetta magica", desc: "Nella sua scatola", prezzo: 40 }
  ] },
  { id: "a6-v-dolomiti", titolo: "Trekking sulle Dolomiti", e: "🏔️", pezzi: [
    { e: "🧗", nome: "Guida alpina per un giorno", desc: "Una via ferrata, con l'attrezzatura", prezzo: 350 },
    { e: "🥾", nome: "Scarponi da trekking", desc: "In pelle e Gore-Tex", prezzo: 200 },
    { e: "🏨", nome: "Una settimana in hotel sulle Dolomiti", desc: "Per due, con la mezza pensione e la spa", prezzo: 2200 },
    { e: "🛖", nome: "Una notte in rifugio", desc: "Con la cena e la colazione", prezzo: 70 },
    { e: "🦯", nome: "Bastoncini da trekking", desc: "In alluminio, pieghevoli", prezzo: 60 }
  ] }
);

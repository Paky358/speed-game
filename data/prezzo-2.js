/* =========================================================
   DATI — «Il Prezzo è Giusto!», autore 2: Casa, Tecnologia, Vestiti, curiosità di oggetti, casa e famiglia, 8 vetrine.
   Prezzi medi in Italia nel 2026, arrotondati (vedi compiti-autori.md). Da rileggere una volta l'anno.
   Attenzione: nel 2026 la tecnologia è rincarata (crisi delle memorie): PS5, Switch 2, iPhone Pro, Mac. Prezzi già aggiornati.
   ========================================================= */
window.SG_PREZZO = window.SG_PREZZO || { anno: 2026, prodotti: [], vetrine: [] };

window.SG_PREZZO.prodotti.push(
  // ---------- 🏠 CASA ED ELETTRODOMESTICI ----------
  { id: "a2-presine", cat: "casa", e: "🧤", nome: "Presine da cucina, 2", desc: "Di cotone imbottito, a quadretti, per le pentole calde", dove: "dal casalinghi", prezzo: 4 },   // stima
  { id: "a2-mollette", cat: "casa", e: "🧺", nome: "Mollette per il bucato, 24", desc: "In plastica colorata, in sacchetto", dove: "al supermercato", prezzo: 2.5 },   // stima
  { id: "a2-barattolo-fido", cat: "casa", e: "🍯", nome: "Barattolo Fido, 1 litro", desc: "Bormioli, di vetro, col tappo a leva e la guarnizione", dove: "dal casalinghi", prezzo: 3.5, cur: "Si fa a Fidenza, vicino a Parma, dagli anni '60" },   // stima
  { id: "a2-lampadina-led", cat: "casa", e: "💡", nome: "Lampadina LED", desc: "Philips, attacco grande, luce calda come una vecchia da 60 W", dove: "al supermercato", prezzo: 3.99 },   // stima
  { id: "a2-accendigas", cat: "casa", e: "🔥", nome: "Accendigas elettronico", desc: "Quello col grilletto, per i fornelli", dove: "dal ferramenta", prezzo: 4.5 },   // stima
  { id: "a2-sturalavandini", cat: "casa", e: "🪠", nome: "Sturalavandini", desc: "La ventosa di gomma col manico di legno", dove: "dal ferramenta", prezzo: 5 },   // stima
  { id: "a2-battipanni", cat: "casa", e: "🧹", nome: "Battipanni in vimini", desc: "Per i tappeti al balcone (e per le minacce della mamma)", dove: "dal ferramenta", prezzo: 6 },   // stima
  { id: "a2-cavatappi", cat: "casa", e: "🍷", nome: "Cavatappi da cameriere", desc: "Quello a due scatti, col coltellino per la capsula", dove: "dal casalinghi", prezzo: 6.5 },   // stima
  { id: "a2-grattugia", cat: "casa", e: "🧀", nome: "Grattugia a quattro facce", desc: "In acciaio, col manico in alto", dove: "dal casalinghi", prezzo: 8 },   // stima
  { id: "a2-scopa-saggina", cat: "casa", e: "🧹", nome: "Scopa di saggina", desc: "Quella vera, col manico di legno, per il cortile", dove: "dal ferramenta", prezzo: 9 },   // stima
  { id: "a2-colapasta", cat: "casa", e: "🍝", nome: "Colapasta in acciaio", desc: "Coi due manici e i piedini, per mezzo chilo di pasta", dove: "dal casalinghi", prezzo: 12 },   // stima
  { id: "a2-zerbino", cat: "casa", e: "🚪", nome: "Zerbino con la scritta", desc: "In cocco, con «Benvenuti» davanti alla porta", dove: "dal casalinghi", prezzo: 15 },   // stima
  { id: "a2-tagliere", cat: "casa", e: "🪵", nome: "Tagliere di legno", desc: "Di ulivo, grande, per salumi e formaggi", dove: "dal casalinghi", prezzo: 18 },   // stima
  { id: "a2-blahaj", cat: "casa", e: "🦈", nome: "Squalo di peluche IKEA", desc: "Il Blåhaj blu, quello lungo 100 cm", dove: "da IKEA", prezzo: 24.99, cur: "È diventato famosissimo su internet: c'è chi lo porta in vacanza e lo fotografa" },   // IKEA Francia 24,99, Spagna 19,99, Germania 27,99
  { id: "a2-stendino", cat: "casa", e: "🧺", nome: "Stendibiancheria ad ali", desc: "Quello pieghevole da balcone, con 18 metri di filo", dove: "al supermercato", prezzo: 25 },   // stima
  { id: "a2-padella", cat: "casa", e: "🍳", nome: "Padella antiaderente, 28 cm", desc: "Di marca, va bene anche sull'induzione", dove: "dal casalinghi", prezzo: 28 },   // stima
  { id: "a2-moka-3", cat: "casa", e: "☕", nome: "Moka Bialetti, 3 tazze", desc: "La Moka Express classica, col signore coi baffi", dove: "dal casalinghi", prezzo: 29.9, cur: "La inventò Alfonso Bialetti nel 1933, a Omegna" },   // listino consigliato 32,99, nei negozi 27-30
  { id: "a2-tostapane", cat: "casa", e: "🍞", nome: "Tostapane da due fette", desc: "Elettrico, con la levetta e la pinza per i toast", dove: "al centro commerciale", prezzo: 30 },   // stima
  { id: "a2-candela-yankee", cat: "casa", e: "🕯️", nome: "Candela Yankee Candle grande", desc: "Il barattolo di vetro grande, profumo a scelta", prezzo: 32.9 },   // stima
  { id: "a2-ventilatore", cat: "casa", e: "🌀", nome: "Ventilatore a piantana", desc: "Da 40 cm, tre velocità, che gira a destra e a sinistra", dove: "al centro commerciale", prezzo: 39 },   // stima
  { id: "a2-servizio-piatti", cat: "casa", e: "🍽️", nome: "Servizio di piatti, 18 pezzi", desc: "Per sei persone: piani, fondi e frutta, bianchi", dove: "al centro commerciale", prezzo: 45 },   // stima
  { id: "a2-lenzuola", cat: "casa", e: "🛏️", nome: "Completo lenzuola matrimoniale", desc: "Di cotone, sotto, sopra e due federe, di marca italiana", prezzo: 55 },   // stima
  { id: "a2-billy", cat: "casa", e: "📚", nome: "Libreria IKEA Billy", desc: "Bianca, alta 2 metri e larga 80 cm, da montare", dove: "da IKEA", prezzo: 59.95, cur: "È in vendita dal 1979 ed è uno dei mobili più venduti al mondo" },   // IKEA Italia 59,95
  { id: "a2-poang", cat: "casa", e: "🪑", nome: "Poltrona IKEA Poäng", desc: "Di betulla curvata, col cuscino beige", dove: "da IKEA", prezzo: 79.95 },   // IKEA Italia, Knisa beige 79,95 (a volte 69,95)
  { id: "a2-asse-stiro", cat: "casa", e: "👔", nome: "Asse da stiro", desc: "Pieghevole, col poggiaferro e la fodera a fiori", dove: "al supermercato", prezzo: 35 },   // stima 25-45
  { id: "a2-imperia", cat: "casa", e: "🍝", nome: "Macchina per la pasta Imperia", desc: "Quella a manovella, d'acciaio, per tirare la sfoglia", dove: "dal casalinghi", prezzo: 55, cur: "Si fa a Moncalieri, vicino a Torino, dal 1932" },   // stima 50-65 (SP150)
  { id: "a2-albero-natale", cat: "casa", e: "🎄", nome: "Albero di Natale finto", desc: "Alto 180 cm, folto, da montare, senza luci", dove: "al centro commerciale", prezzo: 99 },   // stima
  { id: "a2-piscina-gonfiabile", cat: "casa", e: "🏊", nome: "Piscina gonfiabile da giardino", desc: "Rotonda, larga 3 metri e mezzo, con la pompa per l'acqua", prezzo: 110 },   // stima
  { id: "a2-microonde", cat: "casa", e: "🍲", nome: "Forno a microonde", desc: "Da 25 litri, col grill, di marca nota", dove: "al centro commerciale", prezzo: 120 },   // stima
  { id: "a2-tosaerba", cat: "casa", e: "🌱", nome: "Tosaerba elettrico", desc: "Col filo, per un giardino piccolo, col sacco dell'erba", dove: "al centro commerciale", prezzo: 150 },   // stima
  { id: "a2-macchina-cucire", cat: "casa", e: "🧵", nome: "Macchina da cucire Singer", desc: "Il modello base per casa, nuovo", prezzo: 160 },   // stima
  { id: "a2-weber", cat: "casa", e: "🔥", nome: "Barbecue Weber a carbone", desc: "Quello tondo nero col coperchio, da 57 cm", prezzo: 179, cur: "Lo inventò nel 1952 un saldatore americano, tagliando a metà una boa" },   // weber.com Italia, Original Kettle 57 cm: 179
  { id: "a2-malm", cat: "casa", e: "🗄️", nome: "Cassettiera IKEA Malm", desc: "Bianca, sei cassetti, larga 160 cm", dove: "da IKEA", prezzo: 189 },   // IKEA Italia 179-189
  { id: "a2-deumidificatore", cat: "casa", e: "💧", nome: "Deumidificatore", desc: "Da 20 litri al giorno, con le ruote", dove: "al centro commerciale", prezzo: 230 },   // stima
  { id: "a2-dondolo", cat: "casa", e: "🌳", nome: "Dondolo da giardino", desc: "A tre posti, col tettuccio e i cuscini", dove: "al centro commerciale", prezzo: 250 },   // stima
  { id: "a2-congelatore", cat: "casa", e: "🧊", nome: "Congelatore a pozzetto", desc: "Da 200 litri, quello che si apre dall'alto", dove: "al centro commerciale", prezzo: 280 },   // stima
  { id: "a2-piano-induzione", cat: "casa", e: "🍳", nome: "Piano cottura a induzione", desc: "Da 60 cm, quattro zone, da incassare", dove: "al centro commerciale", prezzo: 300 },   // stima
  { id: "a2-magnifica", cat: "casa", e: "☕", nome: "Macchina da caffè De'Longhi", desc: "La Magnifica S: macina i chicchi e fa il caffè da sola", prezzo: 320 },   // trovaprezzi 300-330
  { id: "a2-lavatrice", cat: "casa", e: "🧺", nome: "Lavatrice da 8 kg", desc: "Carica dall'oblò, classe A, di marca nota", dove: "al centro commerciale", prezzo: 350, wow: 1 },   // Altroconsumo 200-400, LG/Bosch 290-400
  { id: "a2-cucina-gas", cat: "casa", e: "🔥", nome: "Cucina a gas col forno", desc: "Quattro fuochi e forno elettrico sotto, larga 60 cm", dove: "al centro commerciale", prezzo: 380 },   // stima
  { id: "a2-lavastoviglie", cat: "casa", e: "🍽️", nome: "Lavastoviglie da 60 cm", desc: "Da sistemare sotto il piano, 13 coperti, di marca nota", dove: "al centro commerciale", prezzo: 420 },   // stima
  { id: "a2-supersonic", cat: "casa", e: "💨", nome: "Phon Dyson Supersonic", desc: "L'asciugacapelli col buco in mezzo, con gli accessori", prezzo: 499, wow: 1 },   // Supersonic Nural 499 al lancio su dyson.it
  { id: "a2-asciugatrice", cat: "casa", e: "👕", nome: "Asciugatrice da 8 kg", desc: "A pompa di calore, classe A, di marca nota", dove: "al centro commerciale", prezzo: 550 },   // stima
  { id: "a2-materasso", cat: "casa", e: "🛏️", nome: "Materasso matrimoniale", desc: "In memory foam, alto 25 cm, nuovo", dove: "dal materassaio", prezzo: 600 },   // stima
  { id: "a2-frigorifero", cat: "casa", e: "🧊", nome: "Frigorifero combinato", desc: "Alto, col freezer sotto, che non fa il ghiaccio", dove: "al centro commerciale", prezzo: 650 },   // stima
  { id: "a2-tenda-sole", cat: "casa", e: "⛱️", nome: "Tenda da sole", desc: "A bracci, larga 4 metri, per il balcone, montata", prezzo: 1200 },   // stima
  { id: "a2-porta-blindata", cat: "casa", e: "🚪", nome: "Porta blindata", desc: "Per l'ingresso di un appartamento, montata", prezzo: 1600 },   // stima
  { id: "a2-stufa-pellet", cat: "casa", e: "🔥", nome: "Stufa a pellet", desc: "Da salotto, 9 kW, senza il montaggio", prezzo: 1500 },   // stima
  { id: "a2-bimby", cat: "casa", e: "🥣", nome: "Bimby", desc: "Il robot da cucina Vorwerk, l'ultimo modello (TM7)", prezzo: 1599, wow: 1, cur: "Non lo trovi nei negozi di elettrodomestici: lo vende solo Vorwerk" },   // lancio TM7: 1.599
  { id: "a2-smeg-frigo", cat: "casa", e: "🧊", nome: "Frigorifero Smeg anni '50", desc: "Quello tondo colorato, una porta, alto un metro e mezzo", prezzo: 1800, wow: 1 },   // FAB28: 1.800-1.900
  { id: "a2-caldaia", cat: "casa", e: "♨️", nome: "Caldaia nuova", desc: "A condensazione, per un appartamento, montata", dove: "con l'idraulico", prezzo: 2000, wow: 1 },   // stima: caldaia 700-1.400 + posa 400-800

  // ---------- 📱 TECNOLOGIA ----------
  { id: "a2-pile-bottone", cat: "tech", e: "🔋", nome: "Pile a bottone, 2 pezzi", desc: "Quelle piatte e tonde, per la bilancia e le chiavi dell'auto", dove: "al supermercato", prezzo: 4.5 },   // stima
  { id: "a2-calcolatrice", cat: "tech", e: "🧮", nome: "Calcolatrice tascabile", desc: "Quella semplice a energia solare", dove: "in cartoleria", prezzo: 5 },   // stima
  { id: "a2-pile-aa", cat: "tech", e: "🔋", nome: "Pile stilo, 4 pezzi", desc: "Duracell, quelle normali (AA), nel blister", dove: "al supermercato", prezzo: 6.99 },   // stima
  { id: "a2-caricatore-usb", cat: "tech", e: "🔌", nome: "Caricatore USB da muro", desc: "Il cubetto bianco senza marca famosa", dove: "nel negozio sotto casa", prezzo: 8 },   // stima
  { id: "a2-netflix", cat: "tech", e: "📺", nome: "Netflix per un mese", desc: "Abbonamento Standard, senza pubblicità", prezzo: 13.99 },   // listino Italia 2026
  { id: "a2-mouse", cat: "tech", e: "🖱️", nome: "Mouse senza fili", desc: "Logitech, quello piccolo da portatile", prezzo: 15 },   // stima
  { id: "a2-telecomando", cat: "tech", e: "📺", nome: "Telecomando universale", desc: "Va bene per tutti i televisori di casa", dove: "al centro commerciale", prezzo: 15 },   // stima
  { id: "a2-cavo-hdmi", cat: "tech", e: "🔌", nome: "Cavo HDMI da 2 metri", desc: "Per attaccare la console al televisore", dove: "al centro commerciale", prezzo: 12 },   // stima
  { id: "a2-earpods", cat: "tech", e: "🎧", nome: "Auricolari Apple col filo", desc: "Gli EarPods bianchi originali, attacco USB-C", dove: "all'Apple Store", prezzo: 19 },   // listino Apple
  { id: "a2-tamagotchi", cat: "tech", e: "🥚", nome: "Tamagotchi", desc: "L'ovetto originale Bandai, rifatto come negli anni '90", prezzo: 22, cur: "Uscì in Giappone nel 1996: in pochi anni ne vendettero decine di milioni" },   // stima
  { id: "a2-alimentatore-apple", cat: "tech", e: "🔌", nome: "Alimentatore Apple USB-C", desc: "Quello da 20 W che nella scatola dell'iPhone non c'è più", dove: "all'Apple Store", prezzo: 25 },   // listino Apple
  { id: "a2-calcolatrice-casio", cat: "tech", e: "🧮", nome: "Calcolatrice scientifica Casio", desc: "Quella del liceo, che fa anche le frazioni", dove: "in cartoleria", prezzo: 28 },   // stima fx-991
  { id: "a2-airtag", cat: "tech", e: "📍", nome: "AirTag", desc: "Il dischetto Apple per ritrovare chiavi e valigie, uno", dove: "all'Apple Store", prezzo: 29 },   // AirTag 2: 29 (pacco da 4: 99)
  { id: "a2-radio", cat: "tech", e: "📻", nome: "Radiolina portatile", desc: "Quella col manico e l'antenna, va a pile", prezzo: 30 },   // stima
  { id: "a2-powerbank", cat: "tech", e: "🔋", nome: "Batteria esterna", desc: "Da 10.000 mAh, di marca, per ricaricare il telefono fuori", prezzo: 30 },   // stima
  { id: "a2-cartucce", cat: "tech", e: "🖨️", nome: "Cartucce per la stampante", desc: "Le originali, una nera e una a colori, formato base", dove: "al centro commerciale", prezzo: 40, wow: 1, cur: "L'inchiostro delle stampanti costa al litro più dello champagne" },   // stima (HP/Epson 30-50)
  { id: "a2-smartband", cat: "tech", e: "⌚", nome: "Braccialetto fitness Xiaomi", desc: "Conta passi, battito e sonno, col suo schermino", prezzo: 45 },   // stima
  { id: "a2-magsafe", cat: "tech", e: "🔌", nome: "Caricatore MagSafe Apple", desc: "Il dischetto magnetico per l'iPhone, cavo da 1 metro", dove: "all'Apple Store", prezzo: 49 },   // listino Apple
  { id: "a2-hue", cat: "tech", e: "💡", nome: "Lampadina smart a colori", desc: "Philips Hue: si accende e cambia colore dal telefono", prezzo: 49.99 },   // stima
  { id: "a2-cover-apple", cat: "tech", e: "📱", nome: "Custodia Apple in silicone", desc: "L'originale per iPhone, coi magneti dentro", dove: "all'Apple Store", prezzo: 59 },   // listino Apple
  { id: "a2-echo-dot", cat: "tech", e: "🔊", nome: "Echo Dot", desc: "L'altoparlante tondo di Alexa", dove: "su Amazon", prezzo: 64.99 },   // listino, spesso scontato
  { id: "a2-ps-plus", cat: "tech", e: "🎮", nome: "PlayStation Plus, 12 mesi", desc: "L'abbonamento base per giocare online con la PS5", prezzo: 71.99 },   // Essential 12 mesi
  { id: "a2-dualsense", cat: "tech", e: "🎮", nome: "Controller della PS5", desc: "Il DualSense bianco, nuovo", prezzo: 74.99 },   // listino Sony dal 2024
  { id: "a2-instax", cat: "tech", e: "📷", nome: "Fotocamera istantanea Instax", desc: "Fujifilm Instax Mini, quella che stampa subito la foto", prezzo: 79.99 },   // stima
  { id: "a2-stampante", cat: "tech", e: "🖨️", nome: "Stampante multifunzione", desc: "A getto d'inchiostro: stampa, fotocopia e scansiona", dove: "al centro commerciale", prezzo: 89 },   // stima
  { id: "a2-apple-pencil", cat: "tech", e: "✏️", nome: "Apple Pencil", desc: "La penna per l'iPad, quella più semplice con la presa USB-C", dove: "all'Apple Store", prezzo: 89 },   // listino Apple
  { id: "a2-mario-kart", cat: "tech", e: "🏎️", nome: "Mario Kart World", desc: "Il videogioco per Nintendo Switch 2, in scatola", prezzo: 89.99, cur: "In digitale costa 10 € in meno" },   // fisico 89,99, digitale 79,99
  { id: "a2-spazzolino", cat: "tech", e: "🪥", nome: "Spazzolino elettrico Oral-B", desc: "Il modello ricaricabile più semplice, con una testina", prezzo: 35 },   // stima
  { id: "a2-airpods-4", cat: "tech", e: "🎧", nome: "AirPods 4", desc: "Gli auricolari Apple senza fili, il modello base", dove: "all'Apple Store", prezzo: 149 },   // listino Apple
  { id: "a2-tv-32", cat: "tech", e: "📺", nome: "TV da 32 pollici", desc: "Smart TV di marca, per la cucina o la cameretta", dove: "al centro commerciale", prezzo: 199 },   // stima
  { id: "a2-kindle", cat: "tech", e: "📖", nome: "Kindle Paperwhite", desc: "Il lettore di libri di Amazon, modello nuovo, 16 GB", dove: "su Amazon", prezzo: 209.99 },   // gamma Kindle 2026
  { id: "a2-airpods-pro", cat: "tech", e: "🎧", nome: "AirPods Pro", desc: "Gli auricolari Apple che cancellano il rumore, ultimi", dove: "all'Apple Store", prezzo: 249 },   // AirPods Pro 3: 249
  { id: "a2-ps-portal", cat: "tech", e: "🎮", nome: "PlayStation Portal", desc: "Lo schermo per giocare alla PS5 da un'altra stanza", prezzo: 249.99 },   // da aprile 2026: 249,99
  { id: "a2-quest", cat: "tech", e: "🥽", nome: "Visore Meta Quest 3S", desc: "Per la realtà virtuale, 128 GB, senza fili", prezzo: 329.99 },   // listino 329,99
  { id: "a2-sony-cuffie", cat: "tech", e: "🎧", nome: "Cuffie Sony WH-1000XM6", desc: "Le cuffie grandi che cancellano il rumore", prezzo: 449 },   // stima: lancio 449
  { id: "a2-apple-watch", cat: "tech", e: "⌚", nome: "Apple Watch", desc: "Il modello base più nuovo, cassa da 42 mm", dove: "all'Apple Store", prezzo: 459 },   // Series 11: 459
  { id: "a2-switch-2", cat: "tech", e: "🎮", nome: "Nintendo Switch 2", desc: "Solo la console, senza giochi", prezzo: 499.99, cur: "Da settembre 2026 costa 30 € in più di quando è uscita" },   // 469,99 → 499,99 dal 1 set 2026
  { id: "a2-tv-55", cat: "tech", e: "📺", nome: "TV da 55 pollici", desc: "Smart TV 4K di marca: quella che occupa mezza parete", dove: "al centro commerciale", prezzo: 499 },   // stima
  { id: "a2-galaxy-a", cat: "tech", e: "📱", nome: "Samsung Galaxy A57", desc: "Lo smartphone Samsung più venduto, 128 GB", prezzo: 529 },   // stima: lancio europeo 529-539
  { id: "a2-ipad", cat: "tech", e: "📱", nome: "iPad", desc: "Il modello base da 11 pollici, 128 GB, senza la penna", dove: "all'Apple Store", prezzo: 499, cur: "A giugno 2026 è salito di 90 €" },   // 409 → 499 dal 25 giu 2026 (iPhoneItalia; un'altra fonte dice 509)
  { id: "a2-ipad-pro", cat: "tech", e: "📱", nome: "iPad Pro 11 pollici", desc: "Quello più potente, il modello base, senza tastiera", dove: "all'Apple Store", prezzo: 1319, wow: 1 },   // 1.119 → 1.319 dal 25 giu 2026
  { id: "a2-ps5", cat: "tech", e: "🎮", nome: "PlayStation 5", desc: "Quella col lettore dei dischi, nuova", prezzo: 649.99, wow: 1, cur: "Ad aprile 2026 è aumentata di 100 €" },   // 549,99 → 649,99 dal 2 apr 2026
  { id: "a2-dyson-v15", cat: "tech", e: "🧹", nome: "Aspirapolvere Dyson V15", desc: "Senza fili, quello con la luce verde che mostra la polvere", prezzo: 699 },   // listino 699, spesso 599
  { id: "a2-macbook-neo", cat: "tech", e: "💻", nome: "MacBook Neo", desc: "Il portatile Apple più semplice, 256 GB", dove: "all'Apple Store", prezzo: 799, cur: "A giugno 2026 è salito di 100 €" },   // 699 → 799 dal 25 giu 2026
  { id: "a2-iphone-17", cat: "tech", e: "📱", nome: "iPhone 17", desc: "Il modello base, 256 GB, nuovo", dove: "all'Apple Store", prezzo: 1129, wow: 1, cur: "A settembre 2026 è salito di 150 €: prima costava 979 €" },   // controllo 16 ott: 979 -> 1.129 dal 9 set 2026 (Smartworld)
  { id: "a2-macbook-air", cat: "tech", e: "💻", nome: "MacBook Air 13 pollici", desc: "Il modello base, nuovo", dove: "all'Apple Store", prezzo: 1449 },   // dopo il rincaro di giugno 2026: 1.449 (una fonte dice 1.499)
  { id: "a2-galaxy-ultra", cat: "tech", e: "📱", nome: "Samsung Galaxy S26 Ultra", desc: "Quello con la pennina dentro, 256 GB", prezzo: 1599 },   // 1.499 → 1.599 dopo il rincaro
  { id: "a2-iphone-pro-max", cat: "tech", e: "📱", nome: "iPhone Pro Max", desc: "L'ultimo modello, 256 GB", dove: "all'Apple Store", prezzo: 1639, wow: 1, cur: "Il modello dell'anno prima costava 150 € in meno" },   // iPhone 18 Pro Max 256 GB: 1.639
  { id: "a2-iphone-2tb", cat: "tech", e: "📱", nome: "iPhone Pro Max da 2 TB", desc: "Lo stesso, ma con la memoria più grande che esiste", dove: "all'Apple Store", prezzo: 3139, wow: 1 },   // 2 TB: 3.139

  // ---------- 👟 VESTITI E ACCESSORI ----------
  { id: "a2-cappello-babbo", cat: "vestiti", e: "🎅", nome: "Cappello da Babbo Natale", desc: "Rosso col pon pon bianco", dove: "alla bancarella, a dicembre", prezzo: 2.5 },   // stima
  { id: "a2-lacci", cat: "vestiti", e: "👞", nome: "Lacci per scarpe", desc: "Un paio di ricambio, neri", dove: "dal calzolaio", prezzo: 3 },   // stima
  { id: "a2-maglietta-primark", cat: "vestiti", e: "👕", nome: "Maglietta bianca Primark", desc: "Quella semplice di cotone, a maniche corte", dove: "da Primark", prezzo: 3.5, wow: 1 },   // stima 3-4
  { id: "a2-ombrello-ambulante", cat: "vestiti", e: "☂️", nome: "Ombrello dell'ambulante", desc: "Quello che compare dal nulla appena inizia a piovere", dove: "in strada, sotto la pioggia", prezzo: 5 },   // stima
  { id: "a2-collant", cat: "vestiti", e: "🦵", nome: "Collant velati", desc: "Calzedonia, neri, sottili (20 denari), un paio", dove: "da Calzedonia", prezzo: 5.95 },   // stima
  { id: "a2-mutande-rosse", cat: "vestiti", e: "🎉", nome: "Mutande rosse di Capodanno", desc: "Portano fortuna, ma solo se te le regalano", dove: "al mercato, a dicembre", prezzo: 7 },   // stima
  { id: "a2-calzini", cat: "vestiti", e: "🧦", nome: "Calzini corti, 3 paia", desc: "Di cotone, tinta unita", dove: "da Calzedonia", prezzo: 9.95 },   // stima
  { id: "a2-occhiali-mercato", cat: "vestiti", e: "🕶️", nome: "Occhiali da sole al mercato", desc: "Neri, di plastica, senza marca", dove: "al mercato del sabato", prezzo: 10 },   // stima
  { id: "a2-pantofole", cat: "vestiti", e: "🥿", nome: "Pantofole a quadri", desc: "Quelle di panno della nonna, chiuse dietro", dove: "al mercato", prezzo: 12 },   // stima
  { id: "a2-jeans-primark", cat: "vestiti", e: "👖", nome: "Jeans Primark", desc: "Da uomo, taglio dritto, blu", dove: "da Primark", prezzo: 14 },   // stima
  { id: "a2-grembiule", cat: "vestiti", e: "🎒", nome: "Grembiule della scuola", desc: "Quello nero o blu delle elementari, col fiocco", dove: "in un negozio per bambini", prezzo: 15 },   // stima
  { id: "a2-body-neonato", cat: "vestiti", e: "👶", nome: "Body per neonato, 5 pezzi", desc: "Di cotone, a maniche corte, coi bottoncini sotto", prezzo: 20 },   // stima
  { id: "a2-sciarpa-squadra", cat: "vestiti", e: "🧣", nome: "Sciarpa della squadra", desc: "Quella ufficiale, da sventolare allo stadio", dove: "allo store della squadra", prezzo: 20 },   // stima
  { id: "a2-havaianas", cat: "vestiti", e: "🩴", nome: "Infradito Havaianas", desc: "Le classiche brasiliane di gomma, tinta unita", prezzo: 25, cur: "Nascono in Brasile nel 1962" },   // stima 22-29
  { id: "a2-camicia", cat: "vestiti", e: "👔", nome: "Camicia bianca da uomo", desc: "Di cotone, quella dei colloqui e dei matrimoni", prezzo: 25 },   // stima
  { id: "a2-canottiera", cat: "vestiti", e: "🎽", nome: "Canottiera della salute", desc: "Di lana e cotone, quella che metteva il nonno", dove: "in merceria", prezzo: 15 },   // stima
  { id: "a2-felpa", cat: "vestiti", e: "🧥", nome: "Felpa col cappuccio", desc: "Di cotone, di una catena di negozi per ragazzi", prezzo: 30 },   // stima
  { id: "a2-pigiama", cat: "vestiti", e: "🛌", nome: "Pigiama di flanella", desc: "Da uomo, pesante, per l'inverno", prezzo: 29 },   // stima
  { id: "a2-adilette", cat: "vestiti", e: "🩴", nome: "Ciabatte Adidas Adilette", desc: "Quelle da piscina con le tre strisce", prezzo: 30 },   // stima
  { id: "a2-new-era", cat: "vestiti", e: "🧢", nome: "Cappellino New Era", desc: "Quello degli Yankees, con la visiera curva", prezzo: 32 },   // stima
  { id: "a2-cintura", cat: "vestiti", e: "👖", nome: "Cintura di pelle", desc: "Da uomo, con la fibbia: un buco in più dopo le feste", prezzo: 35 },   // stima
  { id: "a2-maglione", cat: "vestiti", e: "🧶", nome: "Maglione di lana merino", desc: "Uniqlo, girocollo, tinta unita", dove: "da Uniqlo", prezzo: 39.9 },   // stima
  { id: "a2-guanti", cat: "vestiti", e: "🧤", nome: "Guanti di pelle", desc: "Foderati, da uomo, in negozio", prezzo: 45 },   // stima
  { id: "a2-crocs", cat: "vestiti", e: "👡", nome: "Crocs Classic", desc: "Gli zoccoli di gomma coi buchi, da adulto", prezzo: 54.99, cur: "Nate nel 2002 come scarpe da barca" },   // 55-69 dai rivenditori
  { id: "a2-eastpak", cat: "vestiti", e: "🎒", nome: "Zaino Eastpak", desc: "Il Padded Pak'r, lo zaino della scuola di sempre", prezzo: 55 },   // listino 55
  { id: "a2-superga", cat: "vestiti", e: "👟", nome: "Superga 2750", desc: "Le scarpe basse di tela bianche, quelle di Torino", prezzo: 69.9, cur: "Il modello 2750 esiste dal 1925" },   // stima
  { id: "a2-swatch", cat: "vestiti", e: "⌚", nome: "Orologio Swatch", desc: "Quello di plastica colorata, il modello classico", prezzo: 75 },   // stima
  { id: "a2-converse", cat: "vestiti", e: "👟", nome: "Converse All Star alte", desc: "Le Chuck Taylor di tela, quelle classiche", prezzo: 80, cur: "Le prime All Star sono del 1917, scarpe da basket" },   // stima
  { id: "a2-birkenstock", cat: "vestiti", e: "👡", nome: "Birkenstock Arizona", desc: "I sandali tedeschi con due fasce larghe", prezzo: 100 },   // stima
  { id: "a2-levis", cat: "vestiti", e: "👖", nome: "Jeans Levi's 501", desc: "Il modello originale, nuovo", prezzo: 110, cur: "Si chiamano 501 dal 1890: era il numero del lotto" },   // levi.com Italia 110-120
  { id: "a2-kanken", cat: "vestiti", e: "🎒", nome: "Zaino Fjällräven Kånken", desc: "Quello quadrato con la volpe rossa", prezzo: 110 },   // stima
  { id: "a2-lacoste", cat: "vestiti", e: "👕", nome: "Polo Lacoste", desc: "La classica col coccodrillo, a maniche corte", prezzo: 115 },   // stima
  { id: "a2-air-force", cat: "vestiti", e: "👟", nome: "Nike Air Force 1", desc: "Le bianche classiche, modello '07", prezzo: 119.99 },   // stima
  { id: "a2-k-way", cat: "vestiti", e: "🧥", nome: "K-Way", desc: "La giacca a vento che si chiude dentro la sua tasca", prezzo: 120, cur: "È nato in Francia nel 1965, oggi è di un'azienda di Torino" },   // stima
  { id: "a2-ray-ban", cat: "vestiti", e: "🕶️", nome: "Ray-Ban Wayfarer", desc: "Gli occhiali da sole neri classici, lenti verdi", dove: "dall'ottico", prezzo: 160 },   // stima
  { id: "a2-marinella", cat: "vestiti", e: "👔", nome: "Cravatta Marinella", desc: "Di seta, dalla storica bottega di Napoli", dove: "a Napoli, in Riviera di Chiaia", prezzo: 180, cur: "La bottega aprì nel 1914: è grande pochi metri quadri" },   // stima
  { id: "a2-ugg", cat: "vestiti", e: "👢", nome: "Stivaletti UGG Classic Mini", desc: "Quelli di montone, bassi, color sabbia", prezzo: 190 },   // stima
  { id: "a2-dr-martens", cat: "vestiti", e: "👢", nome: "Anfibi Dr. Martens 1460", desc: "Neri, con le cuciture gialle e otto buchi", prezzo: 199, cur: "Si chiamano 1460 perché il primo paio è del primo aprile 1960" },   // stima
  { id: "a2-timberland", cat: "vestiti", e: "🥾", nome: "Timberland gialle", desc: "Gli scarponcini classici color grano", prezzo: 220 },   // stima
  { id: "a2-borsalino", cat: "vestiti", e: "🎩", nome: "Cappello Borsalino", desc: "Di feltro, da uomo, con la fascia", prezzo: 280, cur: "Si fa ad Alessandria dal 1857" },   // stima
  { id: "a2-nuptse", cat: "vestiti", e: "🧥", nome: "Piumino The North Face Nuptse", desc: "Quello lucido e gonfio, modello 1996", prezzo: 330 },   // stima
  { id: "a2-hogan", cat: "vestiti", e: "👟", nome: "Hogan Interactive", desc: "Le scarpe da ginnastica con la H, in camoscio", prezzo: 390, wow: 1 },   // rivenditori 390
  { id: "a2-golden-goose", cat: "vestiti", e: "👟", nome: "Golden Goose Super-Star", desc: "Le scarpe da ginnastica con la stella, già «sporche» apposta", prezzo: 530, wow: 1, cur: "Sono nate a Venezia nel 2000: l'aria «vissuta» gliela danno a mano" },   // rivenditori 485-595
  { id: "a2-tods", cat: "vestiti", e: "👞", nome: "Mocassini Tod's Gommino", desc: "Quelli coi pallini di gomma sotto, in camoscio", prezzo: 550 },   // stima
  { id: "a2-moncler", cat: "vestiti", e: "🧥", nome: "Piumino Moncler", desc: "Il modello Maya, da uomo, lucido", prezzo: 1450, wow: 1, cur: "Il nome viene da Monestier-de-Clermont, un paesino vicino a Grenoble" },   // stima
  { id: "a2-louis-vuitton", cat: "vestiti", e: "👜", nome: "Borsa Louis Vuitton Neverfull", desc: "In tela marrone con le iniziali, misura media", prezzo: 2100 },   // stima
  { id: "a2-max-mara", cat: "vestiti", e: "🧥", nome: "Cappotto Max Mara 101801", desc: "Il cappotto color cammello, lana e cashmere", prezzo: 2300, wow: 1, cur: "È lo stesso modello dal 1981" },   // Net-a-Porter Spagna 2.300
  { id: "a2-burberry", cat: "vestiti", e: "🧥", nome: "Trench Burberry", desc: "Il Kensington color sabbia, col tessuto a quadri dentro", prezzo: 2150, cur: "Il trench lo indossavano gli ufficiali inglesi nelle trincee: da qui il nome" },   // Breuninger 2.150
  { id: "a2-chanel", cat: "vestiti", e: "👜", nome: "Borsa Chanel Classic", desc: "Quella nera trapuntata, con la catenella, misura media", prezzo: 11000, wow: 1, cur: "Chanel alza il prezzo di questa borsa quasi ogni anno" },   // guide 2026: 10.500-11.000 in Europa

  // ---------- 🇮🇹 CURIOSITÀ: OGGETTI, CASA E FAMIGLIA ----------
  { id: "a2-casa-1-euro", cat: "curiosita", e: "🏚️", nome: "Casa da ristrutturare", desc: "Nel centro storico, col bando del Comune", dove: "in un paesino della Sicilia", prezzo: 1, wow: 1, cur: "Sono le «case a 1 euro»: però vanno sistemate entro 3 anni" },
  { id: "a2-rullino", cat: "curiosita", e: "🎞️", nome: "Rullino fotografico", desc: "Kodak a colori, 36 foto, da sviluppare", dove: "dal fotografo", prezzo: 16, wow: 1, cur: "Da quando i ragazzi sono tornati a usarli, costano più del doppio di prima" },   // stima
  { id: "a2-smemoranda", cat: "curiosita", e: "📒", nome: "Diario Smemoranda", desc: "Quello di scuola, 12 mesi, nuovo", dove: "in cartoleria", prezzo: 19.9 },   // stima
  { id: "a2-vinile", cat: "curiosita", e: "💿", nome: "Disco in vinile", desc: "Un album di un cantante italiano, appena uscito", dove: "in un negozio di dischi", prezzo: 30 },   // stima
  { id: "a2-juicy-salif", cat: "curiosita", e: "🍋", nome: "Spremiagrumi di design", desc: "Il Juicy Salif di Alessi, quello a forma di ragno", prezzo: 85, wow: 1, cur: "Starck lo disegnò su un tovagliolo mentre mangiava calamari" },   // listino 85
  { id: "a2-moka-18", cat: "curiosita", e: "☕", nome: "Moka da 18 tazze", desc: "Bialetti, quella gigante per i pranzi delle feste", dove: "dal casalinghi", prezzo: 105 },   // stima
  { id: "a2-prima-pappa", cat: "curiosita", e: "🍼", nome: "Seggiolone Peg Perego", desc: "Il Prima Pappa, quello con le ruote che si chiude", prezzo: 149 },   // listino 149-159
  { id: "a2-reber", cat: "curiosita", e: "🍅", nome: "Spremipomodoro elettrico", desc: "Il Reber per fare la passata in casa, ad agosto", prezzo: 160 },   // stima
  { id: "a2-culla", cat: "curiosita", e: "👶", nome: "Culla di legno a dondolo", desc: "Con materasso e paracolpi, nuova", prezzo: 250 },   // stima
  { id: "a2-sacco", cat: "curiosita", e: "🛋️", nome: "Poltrona Sacco Zanotta", desc: "La pera piena di palline, la misura piccola", prezzo: 335, cur: "È nata nel 1968 ed è nella raccolta del museo MoMA di New York" },   // Sacco Small 323-335
  { id: "a2-pannolini", cat: "curiosita", e: "👶", nome: "Pannolini per un anno", desc: "Tutti quelli che servono a un neonato nel primo anno", prezzo: 700, wow: 1 },   // stima 600-800
  { id: "a2-trasloco", cat: "curiosita", e: "🚚", nome: "Trasloco di un trilocale", desc: "Ditta con furgone e operai, nella stessa città", dove: "per 80 metri quadri", prezzo: 800 },   // 600-1.000 (arredamento.it, QuiFinanza)
  { id: "a2-abito-sposa", cat: "curiosita", e: "👰", nome: "Abito da sposa", desc: "Comprato in atelier, con le prove e le modifiche", prezzo: 2000 },   // media 1.500-2.500 (matrimonio.com)
  { id: "a2-arco-flos", cat: "curiosita", e: "💡", nome: "Lampada Arco", desc: "La lampada di Flos ad arco col piede di marmo", prezzo: 2650, wow: 1, cur: "La disegnarono i fratelli Castiglioni nel 1962" },   // prezzo consigliato 2.650
  { id: "a2-linea-micra", cat: "curiosita", e: "☕", nome: "Macchina del caffè da bar", desc: "La Marzocco Linea Micra, versione piccola per casa", prezzo: 3300, wow: 1 },   // 2.900-3.330
  { id: "a2-pianoforte", cat: "curiosita", e: "🎹", nome: "Pianoforte verticale", desc: "Yamaha, nuovo, il modello più piccolo, nero lucido", prezzo: 4200 },   // stima (Yamaha b1)
  { id: "a2-bagno", cat: "curiosita", e: "🛁", nome: "Rifare il bagno", desc: "Piastrelle, sanitari e doccia nuovi, coi lavori", dove: "in un bagno di 5 metri quadri", prezzo: 9000, wow: 1 },   // stima 7.000-11.000
  { id: "a2-eames", cat: "curiosita", e: "🪑", nome: "Poltrona Eames con pouf", desc: "La Lounge Chair di Vitra, in pelle nera", prezzo: 11000, wow: 1, cur: "La disegnarono Charles e Ray Eames nel 1956" },   // listino 11.250 (pelle nera)
  { id: "a2-piscina", cat: "curiosita", e: "🏊", nome: "Piscina interrata", desc: "Da 8 metri per 4, scavo e lavori compresi", dove: "nel giardino di casa", prezzo: 30000, wow: 1 }   // stima
);

window.SG_PREZZO.vetrine.push(
  { id: "a2-v-cucina", titolo: "La cucina dei sogni", e: "🍳", pezzi: [
    { e: "♨️", nome: "Forno a vapore da incasso", desc: "Cuoce al vapore e arrostisce, con lo schermo", prezzo: 900 },
    { e: "🧊", nome: "Frigorifero americano", desc: "Due ante affiancate, col ghiaccio dallo sportello", prezzo: 1300 },
    { e: "🍽️", nome: "Lavastoviglie silenziosa", desc: "Da incasso, 14 coperti, che non si sente", prezzo: 650 },
    { e: "🔪", nome: "Ceppo di coltelli", desc: "Sei coltelli da cuoco di acciaio tedesco", prezzo: 200 },
    { e: "🥼", nome: "Grembiule col tuo nome", desc: "Ricamato a mano, per il cuoco di casa", prezzo: 25 }
  ] },
  { id: "a2-v-bebe", titolo: "Arriva il bebè", e: "👶", pezzi: [
    { e: "👶", nome: "Trio Peg Perego", desc: "Carrozzina, passeggino e ovetto per l'auto", prezzo: 1100 },
    { e: "🛏️", nome: "Cameretta completa", desc: "Lettino, fasciatoio e armadio, in legno bianco", prezzo: 1800 },
    { e: "🚗", nome: "Seggiolino auto girevole", desc: "Con l'aggancio Isofix, dalla nascita ai 4 anni", prezzo: 350 },
    { e: "🧸", nome: "Orsetto gigante", desc: "Di peluche, alto un metro", prezzo: 60 },
    { e: "🍼", nome: "Biberon, 3 pezzi", desc: "Quelli anticolica, da 260 ml", prezzo: 28 }
  ] },
  { id: "a2-v-gamer", titolo: "Gamer da paura", e: "🎮", pezzi: [
    { e: "🎮", nome: "PlayStation 5 Pro", desc: "La PS5 più potente, nuova", prezzo: 899.99 },
    { e: "📺", nome: "TV OLED da 65 pollici", desc: "Quella sottilissima coi neri perfetti", prezzo: 1800 },
    { e: "🪑", nome: "Sedia da gaming", desc: "Con poggiatesta e braccioli che si regolano", prezzo: 300 },
    { e: "🎧", nome: "Cuffie da gaming", desc: "Senza fili, col microfono per parlare con la squadra", prezzo: 150 },
    { e: "🖱️", nome: "Tappetino gigante", desc: "Per mouse e tastiera, lungo quanto la scrivania", prezzo: 25 }
  ] },
  { id: "a2-v-guardaroba", titolo: "Il guardaroba nuovo", e: "👗", pezzi: [
    { e: "🚪", nome: "Armadio IKEA Pax", desc: "Bianco, 3 metri, con ante, cassetti e luci", prezzo: 900 },
    { e: "🧥", nome: "Cappotto da sartoria", desc: "Di lana, fatto su misura da un sarto", prezzo: 1800 },
    { e: "🤵", nome: "Abito da uomo su misura", desc: "Giacca e pantaloni, tre prove dal sarto", prezzo: 1500 },
    { e: "👠", nome: "Décolleté col tacco", desc: "Di pelle nera, di una marca italiana", prezzo: 350 },
    { e: "🪝", nome: "Grucce di legno, 10", desc: "Per appendere bene i vestiti nuovi", prezzo: 15 }
  ] },
  { id: "a2-v-nonno", titolo: "Il nonno in pensione", e: "👴", pezzi: [
    { e: "🚲", nome: "Bici elettrica da città", desc: "Col cestino e la batteria sotto la sella", prezzo: 1800 },
    { e: "🪑", nome: "Poltrona relax elettrica", desc: "Si alza e si sdraia da sola, col telecomando", prezzo: 700 },
    { e: "📺", nome: "TV da 50 pollici", desc: "Per vedere bene la partita senza occhiali", prezzo: 400 },
    { e: "🍷", nome: "Cantinetta per il vino", desc: "Frigo per 24 bottiglie, con la porta di vetro", prezzo: 300 },
    { e: "🧩", nome: "La Settimana Enigmistica", desc: "Il numero di questa settimana", prezzo: 2 }
  ] },
  { id: "a2-v-smart", titolo: "Lavoro da casa", e: "💻", pezzi: [
    { e: "💻", nome: "MacBook Pro 14 pollici", desc: "Il modello base, nuovo", prezzo: 2249 },
    { e: "🪑", nome: "Sedia ergonomica", desc: "Da ufficio, con lo schienale a rete", prezzo: 400 },
    { e: "🖥️", nome: "Monitor da 27 pollici", desc: "4K, per vedere tutto più grande", prezzo: 350 },
    { e: "🗄️", nome: "Scrivania elettrica", desc: "Si alza col bottone per lavorare in piedi", prezzo: 350 },
    { e: "☕", nome: "Tazza «Sono in call»", desc: "Con la scritta, per non farsi disturbare", prezzo: 12 }
  ] },
  { id: "a2-v-giardino", titolo: "Festa in giardino", e: "🌳", pezzi: [
    { e: "🔥", nome: "Barbecue Weber a gas", desc: "Tre fuochi, col coperchio e i ripiani", prezzo: 1200 },
    { e: "🏊", nome: "Piscina fuori terra", desc: "Con struttura d'acciaio, 5 metri, pompa e scaletta", prezzo: 900 },
    { e: "💦", nome: "Idromassaggio gonfiabile", desc: "Per quattro persone, con le bolle", prezzo: 500 },
    { e: "🪑", nome: "Set da giardino", desc: "Tavolo e sei sedie in alluminio", prezzo: 500 },
    { e: "🦟", nome: "Zampirone, 10 spirali", desc: "Quelle verdi contro le zanzare", prezzo: 3 }
  ] },
  { id: "a2-v-salotto", titolo: "Il salotto nuovo", e: "🛋️", pezzi: [
    { e: "🛋️", nome: "Divano in pelle", desc: "Tre posti, morbido, dal mobilificio", prezzo: 2200 },
    { e: "🔊", nome: "Soundbar col subwoofer", desc: "Per sentire i film come al cinema", prezzo: 400 },
    { e: "💡", nome: "Lampada da terra", desc: "Di design, accanto al divano", prezzo: 400 },
    { e: "🪵", nome: "Tavolino da salotto", desc: "Di legno massello, basso", prezzo: 250 },
    { e: "🪴", nome: "Ficus in vaso grande", desc: "Alto un metro e mezzo, da appartamento", prezzo: 60 }
  ] }
);

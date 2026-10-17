/* =========================================================
   DATI — «Il Prezzo è Giusto!», giro in più (autore 4): cose care e sicure sopra i 2.000 € (auto e moto
   dai listini 2026, orologi, tecnologia, case e affitti), un po' di viaggi e di spettacoli, 5 vetrine.
   Prezzi controllati su internet a ottobre 2026 (fonte accanto a ogni voce), arrotondati col passo del gioco
   (vedi compiti-autori.md). I prezzi da cartellino (2.599, 3.499, 679,99…) sono lasciati come sul listino.
   Da rileggere una volta l'anno.
   ========================================================= */
window.SG_PREZZO = window.SG_PREZZO || { anno: 2026, prodotti: [], vetrine: [] };

window.SG_PREZZO.prodotti.push(
  // ---------- 🛵 AUTO NUOVE (listini 2026, versione base) ----------
  { id: "a4-renault-clio", cat: "motori", e: "🚗", nome: "Renault Clio", desc: "La Clio nuova, cinque porte, versione base", dove: "dal concessionario", prezzo: 16500 },   // patentati.it 2026: da 16.600
  { id: "a4-dacia-spring", cat: "motori", e: "🔌", nome: "Dacia Spring", desc: "La piccola elettrica della Dacia, nuova", dove: "dal concessionario", prezzo: 18000 },   // patentati.it 2026: da 17.900
  { id: "a4-dacia-duster", cat: "motori", e: "🚙", nome: "Dacia Duster", desc: "Il SUV della Dacia, nuovo, versione base", dove: "dal concessionario", prezzo: 20000 },   // patentati.it 2026: da 19.900
  { id: "a4-fiat-grande-panda", cat: "motori", e: "🚗", nome: "Fiat Grande Panda ibrida", desc: "La Panda nuova, quella più grande, versione base", dove: "dal concessionario", prezzo: 20500, cur: "Si fa in Serbia, a Kragujevac, ma il nome è un omaggio alla Panda del 1980" },   // patentati.it 2026: Hybrid da 20.400
  { id: "a4-toyota-aygo-x", cat: "motori", e: "🚗", nome: "Toyota Aygo X", desc: "La citycar della Toyota, nuova, versione base", dove: "dal concessionario", prezzo: 21000 },   // patentati.it 2026: da 20.850
  { id: "a4-vw-polo", cat: "motori", e: "🚗", nome: "Volkswagen Polo", desc: "L'utilitaria tedesca, nuova, versione base", dove: "dal concessionario", prezzo: 22000 },   // patentati.it 2026: da 22.250
  { id: "a4-lancia-ypsilon", cat: "motori", e: "🚗", nome: "Lancia Ypsilon ibrida", desc: "La Ypsilon nuova, versione base", dove: "dal concessionario", prezzo: 25000 },   // patentati.it 2026: Ibrida da 25.200
  { id: "a4-renault-5", cat: "motori", e: "🔌", nome: "Renault 5 elettrica", desc: "La «R5» rifatta da capo, a batteria, versione base", dove: "dal concessionario", prezzo: 25000, cur: "La prima Renault 5 uscì nel 1972" },   // patentati.it 2026: da 24.950
  { id: "a4-fiat-600", cat: "motori", e: "🚙", nome: "Fiat 600 Hybrid", desc: "Il SUV piccolo della Fiat, nuovo, versione base", dove: "dal concessionario", prezzo: 26000 },   // patentati.it 2026: da 25.900
  { id: "a4-vw-golf", cat: "motori", e: "🚗", nome: "Volkswagen Golf", desc: "La Golf nuova, versione base a benzina", dove: "dal concessionario", prezzo: 31500, cur: "Dal 1974 ne hanno costruite più di 35 milioni" },   // patentati.it 2026: da 31.350
  { id: "a4-vw-t-roc", cat: "motori", e: "🚙", nome: "Volkswagen T-Roc", desc: "Il SUV compatto della Volkswagen, versione base", dove: "dal concessionario", prezzo: 34500 },   // patentati.it 2026: da 34.300
  { id: "a4-bmw-serie-1", cat: "motori", e: "🚗", nome: "BMW Serie 1", desc: "La BMW più piccola, nuova, versione base", dove: "dal concessionario", prezzo: 35500 },   // patentati.it 2026: da 35.400
  { id: "a4-toyota-rav4", cat: "motori", e: "🚙", nome: "Toyota RAV4", desc: "Il SUV ibrido della Toyota, nuovo, versione base", dove: "dal concessionario", prezzo: 45500 },   // patentati.it 2026: da 45.700
  { id: "a4-vw-id-buzz", cat: "motori", e: "🚐", nome: "Volkswagen ID. Buzz", desc: "Il pulmino Volkswagen rinato, elettrico, nuovo", dove: "dal concessionario", prezzo: 62000, wow: 1, cur: "È l'erede del «Bulli» degli anni '50, il pulmino dei figli dei fiori" },   // patentati.it 2026: da 61.840
  { id: "a4-defender-90", cat: "motori", e: "🚙", nome: "Land Rover Defender 90", desc: "Il fuoristrada inglese a tre porte, nuovo", dove: "dal concessionario", prezzo: 70500 },   // patentati.it 2026: da 70.400
  { id: "a4-jeep-wrangler", cat: "motori", e: "🚙", nome: "Jeep Wrangler", desc: "Il fuoristrada americano, nuovo, versione base", dove: "dal concessionario", prezzo: 71500, cur: "Discende dalla Jeep Willys dei soldati della Seconda guerra mondiale" },   // patentati.it 2026: da 71.500
  { id: "a4-maserati-grecale", cat: "motori", e: "🔱", nome: "Maserati Grecale", desc: "Il SUV della Maserati, versione base", dove: "dal concessionario", prezzo: 80000, cur: "Si chiama come un vento, come tante Maserati: Ghibli, Levante, Mistral" },   // patentati.it 2026: da 79.900
  { id: "a4-toyota-land-cruiser", cat: "motori", e: "🚙", nome: "Toyota Land Cruiser", desc: "Il fuoristrada giapponese, nuovo, versione base", dove: "dal concessionario", prezzo: 87500 },   // patentati.it 2026: da 87.500
  { id: "a4-porsche-911", cat: "motori", e: "🏎️", nome: "Porsche 911", desc: "La sportiva tedesca, nuova, versione base", dove: "dal concessionario", prezzo: 143000, wow: 1, cur: "La prima 911 fu presentata nel 1963" },   // patentati.it 2026: da 142.855
  // ---------- 🏍️ MOTO E BICI (listini 2026) ----------
  { id: "a4-harley-nightster", cat: "motori", e: "🏍️", nome: "Harley-Davidson Nightster", desc: "La Sportster col motore da 975 cc, nuova", dove: "dal concessionario", prezzo: 11500, cur: "Nel 2026 il listino è sceso di 4.400 €" },   // InMoto e MotorBox 2026: 11.500 (prima 15.900)
  { id: "a4-ducati-monster", cat: "motori", e: "🏍️", nome: "Ducati Monster", desc: "La naked di Borgo Panigale, nuova, versione base", dove: "dal concessionario", prezzo: 13000, cur: "Il primo Monster è del 1993" },   // inSella 2026: 12.890
  { id: "a4-pinarello-dogma", cat: "motori", e: "🚴", nome: "Pinarello Dogma F", desc: "La bici da corsa dei campioni, col cambio elettronico", dove: "nel negozio di bici", prezzo: 15000, wow: 1, cur: "Le Pinarello si fanno a Treviso dal 1952" },   // 2026 Dura-Ace Di2: 14.500-16.400 nei negozi
  { id: "a4-bmw-r12-ninet", cat: "motori", e: "🏍️", nome: "BMW R 12 nineT", desc: "La BMW classica col motore boxer, nuova", dove: "dal concessionario", prezzo: 19000 },   // MotorBox, listino BMW 2026 chiavi in mano: 18.950
  { id: "a4-bmw-r1300gs", cat: "motori", e: "🏍️", nome: "BMW R 1300 GS", desc: "La maxi enduro tedesca dei grandi viaggi, versione base", dove: "dal concessionario", prezzo: 21500 },   // MotorBox, listino BMW 2026 chiavi in mano: 21.500

  // ---------- 👟 OROLOGI ----------
  { id: "a4-omega-moonwatch", cat: "vestiti", e: "⌚", nome: "Omega Speedmaster Moonwatch", desc: "L'orologio andato sulla Luna, in acciaio", dove: "in boutique", prezzo: 8900, cur: "Era al polso di Buzz Aldrin sulla Luna nel 1969" },   // omegawatches.com/it-it: 8.900
  { id: "a4-rolex-submariner", cat: "vestiti", e: "⌚", nome: "Rolex Submariner Date", desc: "L'orologio da sub, acciaio e quadrante nero", dove: "dal rivenditore autorizzato", prezzo: 11000, wow: 1, cur: "Trovarlo in negozio è un'impresa: spesso c'è la lista d'attesa" },   // Wristler, gennaio 2026 (UE): 11.100

  // ---------- 📱 TECNOLOGIA DI FASCIA ALTA ----------
  { id: "a4-galaxy-fold8", cat: "tech", e: "📱", nome: "Samsung Galaxy Z Fold8", desc: "Il telefono che si apre come un libro, 256 GB", prezzo: 2099 },   // tuttoandroid e telefonino.net, set 2026: listino 2.099
  { id: "a4-dji-mavic", cat: "tech", e: "🚁", nome: "Drone DJI Mavic 4 Pro", desc: "Con tre batterie, la borsa e il radiocomando", prezzo: 2750 },   // Macitynet: Fly More Combo 2.729 (Unieuro: consigliato 2.729)
  { id: "a4-studio-display", cat: "tech", e: "🖥️", nome: "Apple Studio Display XDR", desc: "Lo schermo da 27 pollici, col piede regolabile", dove: "all'Apple Store", prezzo: 3499, wow: 1, cur: "Il computer non c'è: è solo lo schermo" },   // Apple Italia, marzo 2026: 3.499
  { id: "a4-leica-q3", cat: "tech", e: "📷", nome: "Fotocamera Leica Q3", desc: "La compatta tedesca col bollino rosso, obiettivo fisso", prezzo: 5950, wow: 1 },   // Leica Italia: 5.950 (TechRadar: 5.980)

  // ---------- 🇮🇹 CASE, AFFITTI E UNIVERSITÀ ----------
  { id: "a4-stanza-milano", cat: "curiosita", e: "🛏️", nome: "Stanza singola in affitto", desc: "In un appartamento con altri studenti, per un mese", dove: "a Milano", prezzo: 700 },   // QuiFinanza 2026: 640-730
  { id: "a4-mq-milano", cat: "curiosita", e: "🏢", nome: "Un metro quadro di casa", desc: "La media degli appartamenti in vendita, al metro", dove: "a Milano", prezzo: 5800, wow: 1, cur: "In pieno centro si superano gli 11.000 € al metro quadro" },   // Wikicasa lug 2026: 5.933; Immobiliare.it Insights: circa 5.700
  { id: "a4-affitto-milano", cat: "curiosita", e: "🏠", nome: "Un anno d'affitto", desc: "Un appartamento di 60 metri quadri, dodici mesi", dove: "a Milano", prezzo: 16500, wow: 1 },   // idealista II trim 2026: 23,3 €/m² al mese; Wikicasa: 22,4
  { id: "a4-bocconi", cat: "curiosita", e: "🎓", nome: "Un anno all'università Bocconi", desc: "La retta piena del primo anno di triennale", dove: "a Milano", prezzo: 17000, wow: 1 },   // unibocconi.it, a.a. 2026-27: 17.000

  // ---------- 🎟️ SPORT, SPETTACOLI E PASSIONI ----------
  { id: "a4-maglia-italia", cat: "svago", e: "👕", nome: "Maglia della Nazionale", desc: "Quella identica ai giocatori, versione Authentic", dove: "nel negozio ufficiale", prezzo: 150 },   // listino Adidas 2026: 149,95 (Performance per i tifosi: 100)
  { id: "a4-disney-plus", cat: "svago", e: "🎬", nome: "Disney+ Premium per un anno", desc: "Pagato tutto in una volta, fino a 4 schermi insieme", prezzo: 159.9 },   // Selectra, Multiplayer.it: 159,90
  { id: "a4-lego-titanic", cat: "svago", e: "🚢", nome: "LEGO Titanic", desc: "Il set da 9.090 pezzi, lungo più di un metro", prezzo: 679.99, wow: 1, cur: "Una volta montato è lungo 1 metro e 35 centimetri" },   // lego.com Italia: 679,99
  { id: "a4-finale-champions", cat: "svago", e: "🏆", nome: "Finale di Champions League", desc: "Un posto in prima categoria, il più bello", dove: "a Budapest, maggio 2026", prezzo: 950, cur: "I biglietti si comprano solo col sorteggio della UEFA" },   // Goal.com, UEFA 2026: cat. 1 950
  { id: "a4-olimpiadi", cat: "svago", e: "🏅", nome: "Cerimonia d'apertura olimpica", desc: "Il posto migliore, Olimpiadi di Milano Cortina", dove: "a San Siro, a febbraio", prezzo: 2026, wow: 1, cur: "Prezzo scelto apposta: lo stesso numero dell'anno dei Giochi" },   // QuiFinanza: cat. A 2.026
  { id: "a4-gibson-les-paul", cat: "svago", e: "🎸", nome: "Chitarra Gibson Les Paul", desc: "La Standard anni '50, quella dei grandi del rock", dove: "nel negozio di musica", prezzo: 2599 },   // gibson.com Italia: 2.599

  // ---------- 🏖️ VIAGGI IN EUROPA E SULLA NEVE ----------
  { id: "a4-park-guell", cat: "viaggi", e: "🦎", nome: "Biglietto del Park Güell", desc: "Il parco di Gaudí con la lucertola di mosaico", dove: "a Barcellona", prezzo: 18, cur: "Fino al 2025 costava 10 €" },   // da gennaio 2026: 18 (artvisitguide e altri)
  { id: "a4-alhambra", cat: "viaggi", e: "🏰", nome: "Biglietto dell'Alhambra", desc: "Il palazzo dei re mori, biglietto generale", dove: "a Granada", prezzo: 21 },   // lovegranada 2026: 21 ufficiale
  { id: "a4-louvre", cat: "viaggi", e: "🖼️", nome: "Biglietto del Louvre", desc: "Per vedere la Gioconda, biglietto intero", dove: "a Parigi", prezzo: 22, cur: "Dal 2026 chi arriva da fuori Europa paga 32 €" },   // AP, gennaio 2026: 22 per UE, 32 extra UE
  { id: "a4-acropoli", cat: "viaggi", e: "🏛️", nome: "Biglietto dell'Acropoli", desc: "Per salire al Partenone, biglietto intero", dove: "ad Atene", prezzo: 30, cur: "Nel 2024 è passato da 20 a 30 €" },   // AGI 2023, guide 2026: 30
  { id: "a4-torre-eiffel", cat: "viaggi", e: "🗼", nome: "Salita sulla Torre Eiffel", desc: "In ascensore fino in cima, biglietto intero", dove: "a Parigi", prezzo: 37, cur: "In cima si sta a 276 metri d'altezza" },   // guide 2026: 36,70
  { id: "a4-dolomiti-superski", cat: "viaggi", e: "⛷️", nome: "Skipass di sei giorni", desc: "Dolomiti Superski: 1.200 km di piste con un pass solo", dove: "in alta stagione", prezzo: 455 }   // il Dolomiti 2026: 6 giorni alta stagione 453
);

window.SG_PREZZO.vetrine.push(
  { id: "a4-v-fuorisede", titolo: "Fuorisede a Milano", e: "🎓", pezzi: [
    { e: "🎓", nome: "Un anno all'università Bocconi", desc: "La retta piena del primo anno di triennale", prezzo: 17000 },
    { e: "🛏️", nome: "Dieci mesi di stanza singola", desc: "In un appartamento con altri studenti", dove: "a Milano", prezzo: 7000 },
    { e: "💻", nome: "MacBook Air 13 pollici", desc: "Per gli appunti e per le serie TV", prezzo: 1449 },
    { e: "🧺", nome: "Lavatrice a gettone, 8 kg", desc: "Il bucato della domenica sera, un lavaggio", dove: "in lavanderia self-service", prezzo: 4 }
  ] },
  { id: "a4-v-parigi", titolo: "Fotografo a Parigi", e: "📸", pezzi: [
    { e: "📷", nome: "Fotocamera Leica Q3", desc: "La compatta tedesca col bollino rosso", prezzo: 5950 },
    { e: "🚁", nome: "Drone DJI Mavic 4 Pro", desc: "Per le foto dall'alto, con tre batterie", prezzo: 2750 },
    { e: "🗼", nome: "Salita sulla Torre Eiffel", desc: "In ascensore fino in cima", dove: "a Parigi", prezzo: 37 },
    { e: "🖼️", nome: "Biglietto del Louvre", desc: "Per fotografare la Gioconda… da lontano", dove: "a Parigi", prezzo: 22 }
  ] },
  { id: "a4-v-rockstar", titolo: "Vita da rockstar", e: "🎸", pezzi: [
    { e: "🎸", nome: "Chitarra Gibson Les Paul", desc: "La Standard anni '50, quella dei grandi del rock", prezzo: 2599 },
    { e: "🏍️", nome: "Harley-Davidson Nightster", desc: "Per arrivare al concerto col rombo giusto", dove: "dal concessionario", prezzo: 11500 },
    { e: "🕶️", nome: "Ray-Ban Wayfarer", desc: "Gli occhiali da sole neri, anche di notte", prezzo: 160 },
    { e: "💿", nome: "Disco in vinile", desc: "Il primo album, autografato da nessuno", prezzo: 30 }
  ] },
  { id: "a4-v-campioni", titolo: "Notte da campioni", e: "🏆", pezzi: [
    { e: "🏆", nome: "Finale di Champions League", desc: "Un posto in prima categoria", dove: "a Budapest", prezzo: 950 },
    { e: "👕", nome: "Maglia della Nazionale", desc: "Quella identica ai giocatori", prezzo: 150 },
    { e: "⌚", nome: "Rolex Submariner Date", desc: "Per guardare quanto manca al fischio finale", prezzo: 11000 },
    { e: "🧣", nome: "Sciarpa della squadra", desc: "Quella ufficiale, da sventolare allo stadio", prezzo: 20 }
  ] },
  { id: "a4-v-collezionista", titolo: "Il collezionista", e: "🧱", pezzi: [
    { e: "🚢", nome: "LEGO Titanic", desc: "Il set da 9.090 pezzi, da montare con calma", prezzo: 679.99 },
    { e: "⌚", nome: "Omega Speedmaster Moonwatch", desc: "L'orologio andato sulla Luna", prezzo: 8900 },
    { e: "🖥️", nome: "Apple Studio Display XDR", desc: "Lo schermo da 27 pollici per guardarli tutti", prezzo: 3499 },
    { e: "🥚", nome: "Tamagotchi", desc: "L'ovetto originale, da tenere ancora nella scatola", prezzo: 22 }
  ] }
);

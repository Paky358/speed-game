/* =========================================================
   DATI — «Il Prezzo è Giusto!», autore 3: Auto moto e bici, Viaggi e vacanze, Sport svago e spettacoli, curiosità su luoghi e sport, 8 vetrine.
   Prezzi medi in Italia nel 2026, arrotondati (vedi compiti-autori.md). Da rileggere una volta l'anno.
   I prezzi da cartellino delle moto e delle auto (7.999, 15.490…) sono lasciati come sul listino.
   ========================================================= */
window.SG_PREZZO = window.SG_PREZZO || { anno: 2026, prodotti: [], vetrine: [] };

window.SG_PREZZO.prodotti.push(
  // ---------- 🛵 AUTO, MOTO E BICI ----------
  { id: "a3-arbre-magique", cat: "motori", e: "🌲", nome: "Arbre Magique", desc: "L'alberello profumato da appendere allo specchietto", dove: "al distributore", prezzo: 2.9 },   // stima: 2,50-3,50 al distributore (dubbio)
  { id: "a3-strisce-blu", cat: "motori", e: "🅿️", nome: "Un'ora sulle strisce blu", desc: "Parcheggio in strada, nel centro", dove: "a Milano", prezzo: 3 },   // ricerca: centro Milano 3/h
  { id: "a3-monopattino-sharing", cat: "motori", e: "🛴", nome: "Monopattino in sharing", desc: "Dieci minuti di corsa, sblocco compreso", dove: "in città", prezzo: 3.5 },   // ricerca: 1 di sblocco + 0,25/min
  { id: "a3-area-c", cat: "motori", e: "🚦", nome: "Ingresso in Area C", desc: "Un giorno in auto dentro la cerchia dei Bastioni", dove: "a Milano", prezzo: 7.5, cur: "Si paga dal lunedì al venerdì, dalle 7:30 alle 19:30" },
  { id: "a3-eicma", cat: "motori", e: "🏍️", nome: "Biglietto per l'EICMA", desc: "Il salone della moto, un giorno", dove: "a Milano, a novembre", prezzo: 20 },   // ricerca: 20 (dubbio, forse 22 in cassa)
  { id: "a3-museo-ferrari", cat: "motori", e: "🏎️", nome: "Museo Ferrari", desc: "Biglietto intero per un adulto", dove: "a Maranello", prezzo: 27 },   // ricerca: 27 nel 2024 (dubbio: forse un po' di più)
  { id: "a3-vignetta-svizzera", cat: "motori", e: "🇨🇭", nome: "Vignetta svizzera", desc: "Il bollino per guidare un anno sulle autostrade svizzere", prezzo: 43, cur: "Costa 40 franchi; chi guida senza paga 200 franchi di multa" },
  { id: "a3-deposito-gomme", cat: "motori", e: "📦", nome: "Deposito delle gomme", desc: "Il gommista tiene le tue gomme invernali per l'estate", dove: "dal gommista", prezzo: 45 },   // ricerca: 40-50
  { id: "a3-autostrada-mi-rm", cat: "motori", e: "🛣️", nome: "Autostrada Milano-Roma", desc: "Il pedaggio in auto, tutto il viaggio in autostrada", prezzo: 46 },   // ricerca: 45,60
  { id: "a3-telepass", cat: "motori", e: "📟", nome: "Telepass per un anno", desc: "Il canone del dispositivo base, dodici mesi", prezzo: 47, cur: "Fino a giugno 2024 il canone era di 1,83 € al mese: poi è più che raddoppiato", wow: 1 },   // ricerca: 3,90 al mese
  { id: "a3-cambio-gomme", cat: "motori", e: "🔧", nome: "Cambio gomme di stagione", desc: "Smontare e montare le 4 ruote, con l'equilibratura", dove: "dal gommista", prezzo: 50 },   // ricerca: 40-60
  { id: "a3-traforo-monte-bianco", cat: "motori", e: "⛰️", nome: "Traforo del Monte Bianco", desc: "In auto, solo andata, dall'Italia alla Francia", prezzo: 55, cur: "La galleria è lunga 11,6 km" },   // ricerca: 52-56 (dubbio)
  { id: "a3-revisione", cat: "motori", e: "📋", nome: "Revisione dell'auto", desc: "Quella obbligatoria ogni due anni, in un centro autorizzato", prezzo: 79, cur: "La tariffa è la stessa in tutta Italia" },   // ricerca: 79,02
  { id: "a3-pieno-benzina", cat: "motori", e: "⛽", nome: "Pieno di benzina, 40 litri", desc: "Benzina verde, alla pompa self service", dove: "nell'autunno del 2026", prezzo: 80 },   // ricerca: self 2,036 al litro (12 ott 2026); prezzo che cambia (dubbio)
  { id: "a3-casco-nolan", cat: "motori", e: "⛑️", nome: "Casco Nolan N21 Visor", desc: "Il casco jet col visierino, per lo scooter", prezzo: 200 },   // ricerca: 199,99
  { id: "a3-tagliando-panda", cat: "motori", e: "🛠️", nome: "Tagliando della Panda", desc: "Olio, filtri e controlli, come dice il libretto", dove: "in un'officina Fiat", prezzo: 220 },   // ricerca: 200-250 (dubbio)
  { id: "a3-gomme-nuove", cat: "motori", e: "🚗", nome: "Quattro gomme nuove", desc: "Estive, per una Panda, montate ed equilibrate", dove: "dal gommista", prezzo: 300 },   // ricerca: 200-250 di gomme + 40-100 di montaggio (dubbio)
  { id: "a3-corso-guida-sicura", cat: "motori", e: "🚨", nome: "Corso di guida sicura", desc: "Una giornata in pista con l'istruttore, con la tua auto", dove: "in un centro ACI", prezzo: 400 },   // ricerca: circa 400 (dubbio)
  { id: "a3-monopattino-xiaomi", cat: "motori", e: "🛴", nome: "Monopattino elettrico Xiaomi", desc: "L'Electric Scooter 5, quello che si vede in ogni città", prezzo: 400 },   // ricerca: circa 400 (dubbio, forse 450)
  { id: "a3-rc-auto", cat: "motori", e: "📄", nome: "Assicurazione dell'auto", desc: "RC auto per un anno, la media di tutta Italia", prezzo: 420 },   // ricerca: media IVASS 422
  { id: "a3-brompton", cat: "motori", e: "🚲", nome: "Bici pieghevole Brompton", desc: "Quella inglese che si chiude in un attimo", prezzo: 1749, cur: "Si piega in circa 20 secondi e sta sotto la scrivania" },
  { id: "a3-kymco-agility", cat: "motori", e: "🛵", nome: "Kymco Agility 125", desc: "Scooter a ruote alte, nuovo, versione base", dove: "dal concessionario", prezzo: 2590 },
  { id: "a3-liberty-125", cat: "motori", e: "🛵", nome: "Piaggio Liberty 125", desc: "Lo scooter a ruote alte della Piaggio, nuovo", dove: "dal concessionario", prezzo: 3050 },
  { id: "a3-sh-125", cat: "motori", e: "🛵", nome: "Honda SH 125", desc: "Lo scooter che si vede a ogni semaforo, nuovo", dove: "dal concessionario", prezzo: 4090, cur: "Da anni è lo scooter più venduto in Italia" },
  { id: "a3-vespa-primavera-50", cat: "motori", e: "🛵", nome: "Vespa Primavera 50", desc: "La Vespa piccola, quella che si guida a 14 anni", dove: "dal concessionario", prezzo: 4199 },
  { id: "a3-vespa-primavera-125", cat: "motori", e: "🛵", nome: "Vespa Primavera 125", desc: "La Vespa classica, nuova, del colore che vuoi", dove: "dal concessionario", prezzo: 5350, cur: "La prima Vespa è uscita nel 1946" },
  { id: "a3-sh-350", cat: "motori", e: "🛵", nome: "Honda SH 350", desc: "Il fratello grande dell'SH 125, nuovo", dove: "dal concessionario", prezzo: 6090 },
  { id: "a3-xmax-300", cat: "motori", e: "🛵", nome: "Yamaha XMAX 300", desc: "Lo scooterone da viaggio, nuovo", dove: "dal concessionario", prezzo: 6599 },
  { id: "a3-vespa-gts-310", cat: "motori", e: "🛵", nome: "Vespa GTS 310", desc: "La Vespa più grande e potente, nuova", dove: "dal concessionario", prezzo: 7250 },
  { id: "a3-citroen-ami", cat: "motori", e: "🚙", nome: "Citroën Ami", desc: "La microcar elettrica a due posti, nuova", dove: "dal concessionario", prezzo: 7990, cur: "Si guida dai 14 anni con la patente AM" },
  { id: "a3-yamaha-mt07", cat: "motori", e: "🏍️", nome: "Yamaha MT-07", desc: "Moto naked da 700 cc, nuova", dove: "dal concessionario", prezzo: 7999 },
  { id: "a3-moto-guzzi-v7", cat: "motori", e: "🏍️", nome: "Moto Guzzi V7 Stone", desc: "La moto classica col bicilindrico a V, nuova", dove: "dal concessionario", prezzo: 9300, cur: "Le Moto Guzzi si fanno a Mandello del Lario dal 1921" },
  { id: "a3-fiat-topolino", cat: "motori", e: "🚙", nome: "Fiat Topolino", desc: "La microcar elettrica della Fiat, nuova", dove: "dal concessionario", prezzo: 9890, cur: "Il nome viene dalla Fiat 500 «Topolino» del 1936" },
  { id: "a3-ducati-scrambler", cat: "motori", e: "🏍️", nome: "Ducati Scrambler Icon", desc: "La Ducati più facile da guidare, nuova", dove: "dal concessionario", prezzo: 11000 },   // ricerca: 10.890
  { id: "a3-yamaha-tmax", cat: "motori", e: "🛵", nome: "Yamaha TMAX", desc: "Il maxi scooter da 560 cc, nuovo", dove: "dal concessionario", prezzo: 13499 },
  { id: "a3-dacia-sandero", cat: "motori", e: "🚗", nome: "Dacia Sandero Streetway", desc: "L'utilitaria cinque porte, versione base", dove: "dal concessionario", prezzo: 14800 },
  { id: "a3-ligier-js50", cat: "motori", e: "🚙", nome: "Minicar Ligier JS50", desc: "La macchinetta dei ragazzi di 14 anni, nuova", dove: "dal concessionario", prezzo: 14990, cur: "Costa più di una Dacia Sandero nuova", wow: 1 },
  { id: "a3-honda-africa-twin", cat: "motori", e: "🏍️", nome: "Honda Africa Twin", desc: "La moto da viaggio per strada e sterrato, nuova", dove: "dal concessionario", prezzo: 15490 },
  { id: "a3-fiat-pandina", cat: "motori", e: "🚗", nome: "Fiat Pandina", desc: "La Panda ibrida di sempre, versione base", dove: "dal concessionario", prezzo: 15950, cur: "È l'auto più venduta in Italia" },
  { id: "a3-fiat-500-hybrid", cat: "motori", e: "🚗", nome: "Fiat 500 Hybrid", desc: "La nuova 500 a benzina fatta a Torino, versione base", dove: "dal concessionario", prezzo: 19900 },
  { id: "a3-toyota-yaris", cat: "motori", e: "🚗", nome: "Toyota Yaris ibrida", desc: "Cinque porte, versione base", dove: "dal concessionario", prezzo: 25000 },   // ricerca: 24.750
  { id: "a3-jeep-avenger", cat: "motori", e: "🚙", nome: "Jeep Avenger", desc: "Il piccolo SUV, versione base a benzina", dove: "dal concessionario", prezzo: 25500 },   // ricerca: 25.700
  { id: "a3-ducati-panigale", cat: "motori", e: "🏍️", nome: "Ducati Panigale V4", desc: "La superbike rossa, nuova", dove: "dal concessionario", prezzo: 28500, cur: "Prende il nome dal quartiere di Bologna dove nasce la Ducati" },   // ricerca: 28.390
  { id: "a3-alfa-junior", cat: "motori", e: "🚙", nome: "Alfa Romeo Junior", desc: "Il SUV compatto dell'Alfa, versione ibrida", dove: "dal concessionario", prezzo: 31000 },   // ricerca: 31.050
  { id: "a3-ferrari-amalfi", cat: "motori", e: "🏎️", nome: "Ferrari Amalfi", desc: "La nuova Ferrari coupé col motore V8", dove: "dal concessionario", prezzo: 240000, cur: "Prende il nome dalla costiera amalfitana", wow: 1 },

  // ---------- 🏖️ VIAGGI E VACANZE ----------
  { id: "a3-funicolare-capri", cat: "viaggi", e: "🚡", nome: "Funicolare di Capri", desc: "Dal porto alla Piazzetta, solo andata", prezzo: 2.4 },   // stima: 2,20-2,40 (dubbio)
  { id: "a3-contributo-venezia", cat: "viaggi", e: "🎫", nome: "Ticket d'ingresso a Venezia", desc: "Per chi visita la città in giornata, prenotato prima", dove: "nei giorni di folla", prezzo: 5, cur: "Chi lo prende negli ultimi tre giorni paga il doppio" },
  { id: "a3-vaporetto", cat: "viaggi", e: "🚤", nome: "Biglietto del vaporetto", desc: "Una corsa singola, vale 75 minuti", dove: "a Venezia", prezzo: 9.5, cur: "I veneziani residenti pagano la stessa corsa circa 1,50 €", wow: 1 },
  { id: "a3-cenacolo", cat: "viaggi", e: "🍞", nome: "L'Ultima Cena di Leonardo", desc: "Quindici minuti davanti al dipinto, ingresso intero", dove: "a Milano", prezzo: 15, cur: "Chi ha tra 18 e 25 anni paga solo 2 €" },
  { id: "a3-cristo-velato", cat: "viaggi", e: "🗿", nome: "Il Cristo Velato", desc: "Ingresso intero alla Cappella Sansevero", dove: "a Napoli", prezzo: 12 },   // ricerca: 12 (una guida)
  { id: "a3-leonardo-express", cat: "viaggi", e: "🚆", nome: "Leonardo Express", desc: "Il treno da Roma Termini a Fiumicino, solo andata", prezzo: 14 },
  { id: "a3-malpensa-express", cat: "viaggi", e: "🚆", nome: "Malpensa Express", desc: "Il treno da Milano Centrale all'aeroporto, solo andata", prezzo: 15 },
  { id: "a3-grotta-azzurra", cat: "viaggi", e: "🛶", nome: "Grotta Azzurra", desc: "Barchetta a remi e ingresso, per un adulto", dove: "a Capri", prezzo: 18, cur: "Per entrare ci si sdraia sul fondo della barca" },
  { id: "a3-museo-egizio", cat: "viaggi", e: "🏺", nome: "Museo Egizio", desc: "Ingresso intero: mummie, sarcofagi e gatti sacri", dove: "a Torino", prezzo: 18 },
  { id: "a3-reggia-caserta", cat: "viaggi", e: "🏰", nome: "Reggia di Caserta", desc: "Parco e appartamenti reali, ingresso intero", prezzo: 18 },
  { id: "a3-musei-vaticani", cat: "viaggi", e: "⛪", nome: "Musei Vaticani", desc: "Ingresso intero, con la Cappella Sistina", dove: "a Roma", prezzo: 20 },
  { id: "a3-scavi-pompei", cat: "viaggi", e: "🏛️", nome: "Scavi di Pompei", desc: "Biglietto intero (le scarpe comode le porti tu)", prezzo: 20 },   // ricerca: 20 (forse 22 col Pompei+)
  { id: "a3-david", cat: "viaggi", e: "🗿", nome: "Il David di Michelangelo", desc: "Ingresso alla Galleria dell'Accademia", dove: "a Firenze", prezzo: 20, cur: "Da febbraio 2026 costa 4 € in più di prima" },
  { id: "a3-torre-pisa", cat: "viaggi", e: "🗼", nome: "Salita sulla Torre di Pisa", desc: "Quasi 300 scalini, a orario fisso, un adulto", prezzo: 20 },   // ricerca: 20 + eventuale prevendita
  { id: "a3-uffizi", cat: "viaggi", e: "🖼️", nome: "Biglietto degli Uffizi", desc: "Ingresso intero, in alta stagione", dove: "a Firenze", prezzo: 25 },
  { id: "a3-cupola-brunelleschi", cat: "viaggi", e: "⛪", nome: "Cupola del Brunelleschi", desc: "Il biglietto per salire in cima e vedere il Duomo", dove: "a Firenze", prezzo: 30 },   // ricerca: Brunelleschi Pass 30
  { id: "a3-palazzo-ducale", cat: "viaggi", e: "🏯", nome: "Palazzo Ducale", desc: "Ingresso intero, col Ponte dei Sospiri", dove: "a Venezia", prezzo: 30 },   // ricerca: 30 dal 2023 (dubbio per il 2026)
  { id: "a3-cinque-terre-card", cat: "viaggi", e: "🚃", nome: "Cinque Terre Card col treno", desc: "Treni e sentieri per un giorno, un adulto", dove: "in un weekend d'estate", prezzo: 33 },   // ricerca: 32,50
  { id: "a3-esta-usa", cat: "viaggi", e: "🇺🇸", nome: "ESTA per gli Stati Uniti", desc: "Il permesso online per entrare negli USA da turista", prezzo: 35, cur: "Fino a settembre 2025 costava 21 dollari, poi 40" },   // 40 dollari
  { id: "a3-vaporetto-24-ore", cat: "viaggi", e: "🚤", nome: "Vaporetto per 24 ore", desc: "Tutte le corse che vuoi per un giorno intero", dove: "a Venezia", prezzo: 25 },
  { id: "a3-roma-pass", cat: "viaggi", e: "🎟️", nome: "Roma Pass 72 ore", desc: "Due musei a scelta e autobus e metro per tre giorni", dove: "a Roma", prezzo: 53 },   // ricerca: 53 (rivenditore)
  { id: "a3-taxi-fiumicino", cat: "viaggi", e: "🚕", nome: "Taxi da Fiumicino a Roma", desc: "Dall'aeroporto al centro, dentro le Mura", prezzo: 55, cur: "La tariffa è fissa: il tassametro non conta" },
  { id: "a3-check-in-aeroporto", cat: "viaggi", e: "🛫", nome: "Check-in al banco Ryanair", desc: "La carta d'imbarco fatta in aeroporto invece che sull'app", prezzo: 55, cur: "Con l'app è gratis", wow: 1 },
  { id: "a3-skyway", cat: "viaggi", e: "🚠", nome: "Skyway Monte Bianco", desc: "Funivia andata e ritorno fino a Punta Helbronner", dove: "a Courmayeur, d'estate", prezzo: 62 },   // ricerca: 55-61 negli anni scorsi (dubbio)
  { id: "a3-noleggio-vespa", cat: "viaggi", e: "🛵", nome: "Vespa a noleggio per un giorno", desc: "Una Vespa 125 con casco e assicurazione", dove: "a Roma", prezzo: 65 },
  { id: "a3-rifugio", cat: "viaggi", e: "🏔️", nome: "Notte in rifugio", desc: "Cena, letto e colazione in un rifugio di montagna", dove: "sulle Dolomiti, d'estate", prezzo: 75 },   // stima (dubbio)
  { id: "a3-taxi-malpensa", cat: "viaggi", e: "🚕", nome: "Taxi da Malpensa a Milano", desc: "Dall'aeroporto a qualsiasi via della città", prezzo: 114, cur: "È una tariffa fissa decisa dalla Regione" },
  { id: "a3-ombrellone-rimini", cat: "viaggi", e: "⛱️", nome: "Ombrellone a Rimini", desc: "Ombrellone e due lettini per una settimana", dove: "a Rimini, ad agosto", prezzo: 160 },
  { id: "a3-taxi-acqueo", cat: "viaggi", e: "🚤", nome: "Taxi acqueo dall'aeroporto", desc: "Motoscafo tutto per voi fino a San Marco", dove: "a Venezia", prezzo: 170 },   // ricerca: 150-200 (dubbio)
  { id: "a3-gommone", cat: "viaggi", e: "🚤", nome: "Gommone senza patente", desc: "Noleggio per una giornata, fino a sei persone", dove: "in Sardegna, d'estate", prezzo: 200 },   // ricerca: 130-220 (dubbio)
  { id: "a3-ombrellone-alassio", cat: "viaggi", e: "⛱️", nome: "Ombrellone in prima fila", desc: "Ombrellone e due lettini per una settimana", dove: "ad Alassio, ad agosto", prezzo: 370, cur: "Alassio è la spiaggia più cara d'Italia (indagine 2026)" },
  { id: "a3-interrail", cat: "viaggi", e: "🎒", nome: "Interrail per un mese", desc: "Treni in tutta Europa per 30 giorni, seconda classe", prezzo: 695 },   // ricerca: 696
  { id: "a3-vacanza-due", cat: "viaggi", e: "🧳", nome: "Una settimana di vacanza", desc: "In due, in Italia, viaggio e albergo compresi", dove: "la media del 2026", prezzo: 1050 },   // ricerca: Altroconsumo 2026
  { id: "a3-settimana-rimini", cat: "viaggi", e: "🏨", nome: "Settimana a Rimini", desc: "Hotel tre stelle per una famiglia di quattro", dove: "a Ferragosto", prezzo: 1150, cur: "La stessa settimana a Milano Marittima costa circa la metà in più" },   // ricerca: 1.030 nel 2025 + aumenti (dubbio)

  // ---------- 🎟️ SPORT, SVAGO E SPETTACOLI ----------
  { id: "a3-cinema", cat: "svago", e: "🎬", nome: "Biglietto del cinema", desc: "Un film normale, non in 3D, un adulto", dove: "la media italiana", prezzo: 7.3 },   // ricerca: 7,26
  { id: "a3-puzzle", cat: "svago", e: "🧩", nome: "Puzzle da 1.000 pezzi", desc: "Ravensburger, con un bel paesaggio sulla scatola", prezzo: 16 },
  { id: "a3-carnevale-viareggio", cat: "svago", e: "🎭", nome: "Carnevale di Viareggio", desc: "Biglietto per una sfilata dei carri, in piedi", prezzo: 16.5, cur: "I bambini più bassi di 1,20 m entrano gratis" },
  { id: "a3-romanzo", cat: "svago", e: "📚", nome: "Romanzo appena uscito", desc: "Copertina rigida, di uno scrittore famoso", dove: "in libreria", prezzo: 20 },   // stima: 18-22 (dubbio)
  { id: "a3-italia-miniatura", cat: "svago", e: "🏘️", nome: "Italia in Miniatura", desc: "Ingresso di un giorno, comprato alla cassa", dove: "a Rimini", prezzo: 24 },
  { id: "a3-noleggio-sci", cat: "svago", e: "🎿", nome: "Noleggio sci e scarponi", desc: "Sci, scarponi e casco per un giorno", dove: "in un negozio in città", prezzo: 24 },   // ricerca: Altroconsumo mediana 24
  { id: "a3-acquario-genova", cat: "svago", e: "🐬", nome: "Acquario di Genova", desc: "Ingresso intero per un adulto, squali compresi", prezzo: 25 },
  { id: "a3-escape-room", cat: "svago", e: "🔐", nome: "Escape room", desc: "Un'ora per uscire dalla stanza, a persona", dove: "in gruppo da quattro", prezzo: 25 },   // ricerca: 20-25 (dubbio)
  { id: "a3-oltremare", cat: "svago", e: "🐠", nome: "Oltremare", desc: "Il parco dei delfini, ingresso alla cassa", dove: "a Riccione", prezzo: 27 },
  { id: "a3-lucca-comics", cat: "svago", e: "🦸", nome: "Lucca Comics", desc: "Biglietto per un giorno della fiera dei fumetti", dove: "a Lucca, a fine ottobre", prezzo: 30 },   // ricerca: 26,50-34,50 (dubbio)
  { id: "a3-juventus-museum", cat: "svago", e: "🦓", nome: "Juventus Museum e stadio", desc: "Museo e giro guidato dello stadio, alla cassa", dove: "a Torino", prezzo: 30 },
  { id: "a3-aquafan", cat: "svago", e: "🌊", nome: "Aquafan", desc: "Il parco acquatico, ingresso di un giorno", dove: "a Riccione", prezzo: 32 },
  { id: "a3-padel", cat: "svago", e: "🎾", nome: "Campo da padel per un'ora", desc: "Il campo per quattro amici, la sera", dove: "a Milano", prezzo: 36 },   // ricerca: 30-40
  { id: "a3-magicland", cat: "svago", e: "🎢", nome: "Magicland", desc: "Il parco divertimenti vicino a Roma, alla cassa", prezzo: 39.9 },
  { id: "a3-rafting", cat: "svago", e: "🚣", nome: "Discesa in rafting", desc: "Due ore sul fiume col gommone e la guida, a persona", dove: "in Trentino", prezzo: 40 },   // ricerca: 30-50
  { id: "a3-leolandia", cat: "svago", e: "🦁", nome: "Leolandia", desc: "Il parco dei bambini, ingresso intero alla cassa", dove: "vicino a Bergamo", prezzo: 47.5 },
  { id: "a3-mirabilandia", cat: "svago", e: "🎡", nome: "Mirabilandia", desc: "Ingresso di un giorno, comprato alla cassa", dove: "vicino a Ravenna", prezzo: 49.9, cur: "Comprato online qualche giorno prima costa quasi la metà" },
  { id: "a3-calcetto", cat: "svago", e: "⚽", nome: "Campo da calcetto per un'ora", desc: "Calcio a cinque, erba sintetica, la sera", prezzo: 50 },   // ricerca: 36-55 (dubbio)
  { id: "a3-curva-sud-roma", cat: "svago", e: "🐺", nome: "Curva Sud all'Olimpico", desc: "Biglietto per una partita della Roma in Serie A", dove: "a Roma", prezzo: 40 },   // ricerca: 35-45 secondo la partita
  { id: "a3-inter-san-siro", cat: "svago", e: "🏟️", nome: "Biglietto per vedere l'Inter", desc: "Secondo anello rosso centrale, partita normale", dove: "a San Siro", prezzo: 55 },
  { id: "a3-palestra", cat: "svago", e: "🏋️", nome: "Un mese di palestra", desc: "Un mese in una palestra normale (ci vai la prima settimana)", dove: "la media italiana", prezzo: 60 },   // ricerca: 50-80 (dubbio)
  { id: "a3-lezione-sci", cat: "svago", e: "⛷️", nome: "Lezione di sci privata", desc: "Un'ora col maestro, solo per te", dove: "in Trentino, d'inverno", prezzo: 60 },   // ricerca: 55-60
  { id: "a3-concerto-san-siro", cat: "svago", e: "🎤", nome: "Concerto a San Siro", desc: "Biglietto per il prato, cantante italiano famoso", dove: "a Milano, d'estate", prezzo: 70 },   // ricerca: 59-80
  { id: "a3-monza-prato", cat: "svago", e: "🏁", nome: "Gran Premio di Monza", desc: "Biglietto per il prato, la domenica della gara", prezzo: 100 },
  { id: "a3-paracadute", cat: "svago", e: "🪂", nome: "Lancio col paracadute", desc: "In tandem con l'istruttore, da 4.000 metri", prezzo: 230 },   // ricerca: 190-256
  { id: "a3-arena-verona", cat: "svago", e: "🎶", nome: "Opera all'Arena di Verona", desc: "Poltronissima gold, la poltrona migliore in platea", prezzo: 245 },
  { id: "a3-mongolfiera", cat: "svago", e: "🎈", nome: "Volo in mongolfiera", desc: "Un'ora in volo con altri passeggeri, a persona", dove: "in Toscana", prezzo: 250 },   // ricerca: 220-270
  { id: "a3-dazn", cat: "svago", e: "📺", nome: "DAZN per un anno", desc: "Tutta la Serie A in streaming, pagata in una volta", prezzo: 379 },
  { id: "a3-abbonamento-curva", cat: "svago", e: "🏟️", nome: "Abbonamento in curva", desc: "Tutte le partite in casa dell'Inter, curva Nord", dove: "a San Siro", prezzo: 399 },
  { id: "a3-hospitality-mugello", cat: "svago", e: "🏍️", nome: "Hospitality al Mugello", desc: "La gara della MotoGP dalla terrazza, col pranzo", dove: "la domenica del Gran Premio", prezzo: 630 },   // ricerca: listino del circuito 2026
  { id: "a3-calciobalilla", cat: "svago", e: "⚽", nome: "Calciobalilla Garlando", desc: "Quello da bar, con le aste che rientrano", prezzo: 580 },   // ricerca: 540-620 (dubbio)

  // ---------- 🇮🇹 CURIOSITÀ: LUOGHI, MONUMENTI E SPORT ----------
  { id: "a3-fontana-trevi", cat: "curiosita", e: "⛲", nome: "Biglietto per Fontana di Trevi", desc: "Per scendere vicino alla vasca e lanciare la monetina", dove: "a Roma, nel 2026", prezzo: 2, cur: "Fino al 2025 ci si avvicinava gratis", wow: 1 },
  { id: "a3-pantheon", cat: "curiosita", e: "🏛️", nome: "Biglietto del Pantheon", desc: "Ingresso intero per vedere il buco nel tetto", dove: "a Roma", prezzo: 5, cur: "Fino al 2023 si entrava gratis" },
  { id: "a3-colosseo", cat: "curiosita", e: "🏟️", nome: "Biglietto del Colosseo", desc: "Ingresso intero, con il Foro Romano e il Palatino", dove: "a Roma", prezzo: 18, cur: "La prima domenica del mese si entra gratis" },
  { id: "a3-gardaland", cat: "curiosita", e: "🎢", nome: "Biglietto di Gardaland", desc: "Ingresso di un giorno, comprato alla cassa", prezzo: 59, cur: "Comprato online con qualche giorno d'anticipo costa molto meno" },
  { id: "a3-skipass-cortina", cat: "curiosita", e: "🎿", nome: "Skipass di un giorno", desc: "Dolomiti Superski, un adulto, in alta stagione", dove: "a Cortina, a Natale", prezzo: 89, cur: "Un anno prima costava 86 €" },
  { id: "a3-giro-gondola", cat: "curiosita", e: "🛶", nome: "Giro in gondola", desc: "Mezz'ora tra i canali, fino a cinque persone, di giorno", dove: "a Venezia", prezzo: 90, cur: "Di sera lo stesso giro costa di più" },
  { id: "a3-finale-internazionali", cat: "curiosita", e: "🎾", nome: "Finale degli Internazionali", desc: "Il tennis maschile sul Centrale, nei posti più lontani", dove: "a Roma, a maggio", prezzo: 590, wow: 1 },   // ricerca: 587,90
  { id: "a3-twiga", cat: "curiosita", e: "🏖️", nome: "Tenda in spiaggia al Twiga", desc: "Una tenda col divano per un giorno, sul lido di Briatore", dove: "in Versilia, ad agosto", prezzo: 600, wow: 1 },
  { id: "a3-finale-sanremo", cat: "curiosita", e: "🎙️", nome: "Finale di Sanremo", desc: "Una poltrona in platea all'Ariston, la sera della finale", prezzo: 875, wow: 1 },
  { id: "a3-tribuna-monza", cat: "curiosita", e: "🏎️", nome: "Tribuna centrale a Monza", desc: "Posto davanti ai box, la domenica del Gran Premio", prezzo: 985 },   // ricerca: 984 (dato forse di un anno fa, dubbio)
  { id: "a3-elicottero-capri", cat: "curiosita", e: "🚁", nome: "Elicottero Napoli-Capri", desc: "Elicottero privato tutto per voi, solo andata", prezzo: 1900, wow: 1 },
  { id: "a3-prima-scala", cat: "curiosita", e: "🎻", nome: "La Prima della Scala", desc: "Una poltrona in platea la sera della prima", dove: "a Milano, il 7 dicembre", prezzo: 3200, cur: "La Prima è sempre il 7 dicembre, giorno di Sant'Ambrogio", wow: 1 },
  { id: "a3-luna-di-miele", cat: "curiosita", e: "💍", nome: "Luna di miele all'estero", desc: "Quanto spende in media una coppia italiana per il viaggio", prezzo: 6750 }
);

window.SG_PREZZO.vetrine.push(
  { id: "a3-v-estate-vespa", titolo: "L'estate in Vespa", e: "🛵", pezzi: [
    { e: "🛵", nome: "Vespa Primavera 125", desc: "Nuova, color azzurro mare", dove: "dal concessionario", prezzo: 5350 },
    { e: "⛑️", nome: "Casco Nolan N21 Visor", desc: "Il casco jet col visierino, dello stesso colore", prezzo: 200 },
    { e: "⛱️", nome: "Ombrellone a Rimini", desc: "Ombrellone e due lettini per una settimana", dove: "ad agosto", prezzo: 160 },
    { e: "⛽", nome: "Il pieno della Vespa", desc: "Otto litri di benzina per partire", prezzo: 16 }
  ] },
  { id: "a3-v-neve-cortina", titolo: "Neve a Cortina", e: "⛷️", pezzi: [
    { e: "🚙", nome: "Alfa Romeo Junior", desc: "Il SUV compatto per salire in montagna", dove: "dal concessionario", prezzo: 31000 },
    { e: "🎿", nome: "Skipass di un giorno", desc: "Dolomiti Superski, in alta stagione", prezzo: 89 },
    { e: "⛷️", nome: "Lezione di sci privata", desc: "Un'ora col maestro, solo per te", prezzo: 60 },
    { e: "🎿", nome: "Noleggio sci e scarponi", desc: "Sci, scarponi e casco per un giorno", prezzo: 24 }
  ] },
  { id: "a3-v-gran-premio", titolo: "Gran Premio a Monza", e: "🏁", pezzi: [
    { e: "🏍️", nome: "Ducati Panigale V4", desc: "La superbike rossa, nuova", prezzo: 28500 },
    { e: "🏎️", nome: "Tribuna centrale a Monza", desc: "Davanti ai box, la domenica della gara", prezzo: 985 },
    { e: "🏎️", nome: "Museo Ferrari", desc: "Biglietto intero, per finire la gita a Maranello", prezzo: 27 },
    { e: "🌲", nome: "Arbre Magique", desc: "Gusto «auto nuova», da appendere allo specchietto", prezzo: 2.9 }
  ] },
  { id: "a3-v-sportivo", titolo: "Lo sportivo di casa", e: "🏆", pezzi: [
    { e: "🚲", nome: "Bici pieghevole Brompton", desc: "Per andare in ufficio pedalando", prezzo: 1749 },
    { e: "⚽", nome: "Calciobalilla Garlando", desc: "Quello da bar, per il salotto", prezzo: 580 },
    { e: "🏟️", nome: "Abbonamento in curva", desc: "Tutte le partite in casa dell'Inter", prezzo: 399 },
    { e: "📺", nome: "DAZN per un anno", desc: "Per le partite in trasferta, dal divano", prezzo: 379 },
    { e: "🎾", nome: "Campo da padel per un'ora", desc: "La sfida del giovedì con gli amici", prezzo: 36 }
  ] },
  { id: "a3-v-avventura", titolo: "Vita spericolata", e: "🪂", pezzi: [
    { e: "🚙", nome: "Jeep Avenger", desc: "Il piccolo SUV per andare dove vuoi", dove: "dal concessionario", prezzo: 25500 },
    { e: "🎈", nome: "Volo in mongolfiera", desc: "Un'ora sopra le colline della Toscana", prezzo: 250 },
    { e: "🪂", nome: "Lancio col paracadute", desc: "In tandem con l'istruttore, da 4.000 metri", prezzo: 230 },
    { e: "🚣", nome: "Discesa in rafting", desc: "Due ore sul fiume, a testa bagnata", prezzo: 40 }
  ] },
  { id: "a3-v-moto-sogno", titolo: "In moto fino in Svizzera", e: "🏍️", pezzi: [
    { e: "🏍️", nome: "Honda Africa Twin", desc: "La moto da viaggio per strada e sterrato", dove: "dal concessionario", prezzo: 15490 },
    { e: "⛑️", nome: "Casco Nolan N21 Visor", desc: "Il casco jet col visierino", prezzo: 200 },
    { e: "⛰️", nome: "Traforo del Monte Bianco", desc: "Solo andata, per fare il giro lungo", prezzo: 55 },
    { e: "🇨🇭", nome: "Vignetta svizzera", desc: "Il bollino per le autostrade svizzere", prezzo: 43 },
    { e: "🏍️", nome: "Biglietto per l'EICMA", desc: "Il salone della moto, dove è nato il sogno", prezzo: 20 }
  ] },
  { id: "a3-v-prima-auto", titolo: "La prima auto", e: "🚗", pezzi: [
    { e: "🚗", nome: "Fiat Pandina", desc: "La Panda ibrida di sempre, nuova", dove: "dal concessionario", prezzo: 15950 },
    { e: "📄", nome: "Assicurazione dell'auto", desc: "RC auto per il primo anno", prezzo: 420 },
    { e: "📟", nome: "Telepass per un anno", desc: "Per non fare la fila al casello", prezzo: 47 },
    { e: "🅿️", nome: "Un'ora sulle strisce blu", desc: "Il primo parcheggio in centro, a Milano", prezzo: 3 }
  ] }
);

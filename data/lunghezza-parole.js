/* Stessa Lunghezza d'Onda — le PAROLE del modo "Cosa ne pensi?", divise per tipo.
   Il gioco sceglie prima la scala (data/lunghezza-scale.js), poi 3 parole di un tipo che la scala accetta.
   Tipi: c cibo · b bevanda · p città e mete di viaggio · l luogo di tutti i giorni · f persona famosa · x personaggio di fantasia · o oggetto · t apparecchio o tecnologia
         n animale · a attività o abitudine · s film e serie · v programma TV · m mestiere
         e occasione o festa · g sport · j gioco da tavolo, di carte o da cortile
   Regole: nessuna parola in due tipi; persone famose solo amate e conosciute (niente politici);
   il chip "👤 Persone famose" dell'host spegne tutto il tipo f. */
(function () {
  "use strict";
  window.SG_LUNGHEZZA_PAROLE = {
    c: "Minestrone|Carbonara|Pizza margherita|Pizza con l'ananas|Lasagne|Tiramisù|Sushi|Kebab|Hamburger|Patatine fritte|" +
       "Parmigiana di melanzane|Risotto alla milanese|Polenta|Arancini|Cannoli|Panettone|Pandoro|Colomba|Nutella|Pesto|" +
       "Trippa|Fegato alla veneziana|Cotoletta|Supplì|Piadina|Focaccia|Gelato al pistacchio|Cornetto|Brioche col gelato|Insalata|" +
       "Cavolfiore|Broccoli|Carciofi|Pasta in bianco|Pasta e fagioli|Tortellini in brodo|Gnocchi|Ragù|Bistecca|Pollo arrosto|" +
       "Mortadella|Prosciutto e melone|Mozzarella di bufala|Gorgonzola|Uova sode|Frittata|Pane e burro|Toast|Popcorn|Cioccolato fondente|" +
       "Liquirizia|Caramelle gommose|Babà|Sfogliatella|Cassata|Zucchine|Peperonata|Cipolla cruda|Aglio|Olive|" +
       "Avocado|Cozze|Calamari fritti|Insalata di polpo|Baccalà|Tofu|Pasta al pomodoro|Pasta alla Norma|Cacio e pepe|Amatriciana|" +
       "Tramezzino|Hot dog|Tacos|Ramen|Paella|Crêpes|Pancake|Cereali|Yogurt|Insalata di riso|" +
       "Pasta fredda|Pizza fritta|Fritto misto|Zuppa inglese|Crostata|Torta di mele|Panna montata|Ketchup|Maionese|Peperoncino|" +
       "Spinaci|Funghi|Tartufo|Caviale|Ostriche|'Nduja|Burrata|Taralli|Bruschetta|Cuscus|" +
       "Merendina|Biscotti nel latte|Salame|Lenticchie|Cotechino|Pesce spada|Mozzarella in carrozza|Pasta al forno|Torta salata|Ciambellone",

    b: "Caffè|Cappuccino|Caffè americano|Tè freddo|Camomilla|Spritz|Prosecco|Vino rosso|Birra|Limoncello|" +
       "Grappa|Amaro|Coca-Cola|Acqua frizzante|Acqua del rubinetto|Succo di frutta|Latte di soia|Cioccolata calda|Caffè d'orzo|Ginseng|" +
       "Spremuta d'arancia|Frullato|Energy drink|Aranciata|Chinotto|Tè verde|Tisana|Sangria|Mojito|Latte freddo|" +
       "Caffè decaffeinato|Bubble tea|Champagne|Vin brulé|Caffè corretto|Latte macchiato|Granita|Gazzosa|Acqua tonica|Centrifugato",

    p: "Napoli|Milano|Roma|Venezia|Firenze|Torino|Bologna|Palermo|Bari|Genova|" +
       "Verona|Matera|Cagliari|Trieste|Lecce|Pisa|Rimini|Capri|Portofino|Cortina d'Ampezzo|" +
       "Sardegna|Sicilia|Puglia|Toscana|Costiera Amalfitana|Cinque Terre|Lago di Garda|Lago di Como|Dolomiti|Parigi|" +
       "Londra|New York|Barcellona|Amsterdam|Berlino|Tokyo|Dubai|Las Vegas|Ibiza|Mykonos|" +
       "Maldive|Islanda|Egitto|Grecia|Marrakech|Lisbona|Vienna|Praga|Disneyland|Gardaland|" +
       "Paesino di montagna|Polo Nord|Deserto del Sahara|Siena|Assisi|Taormina|Alberobello|Positano|Lampedusa|Madrid|" +
       "Istanbul|Thailandia|Messico|Brasile|Australia|Isole Canarie|Croazia|Svizzera|Norvegia|Santorini",

    l: "Ikea|Centro commerciale|Autogrill|Spiaggia libera|Discoteca|Palestra|Sala d'attesa del dentista|Supermercato|Biblioteca|Museo|" +
       "Sagra di paese|Casa dei nonni|Stadio|Bar sotto casa|Stazione dei treni|Aeroporto|Campeggio|Terme|Luna park|Zoo|" +
       "Metropolitana|Mercato rionale|Cinema multisala|Traghetto|Rifugio in montagna|Ufficio postale|Stabilimento balneare|Parco giochi|Scuola|Ufficio|" +
       "Cantina|Soffitta|Lavanderia a gettoni|Fiera|Mercatino dell'usato|Sala giochi|Pizzeria sotto casa|Spogliatoio della palestra|Ascensore|Coda in autostrada",

    f: "Leonardo da Vinci|Dante Alighieri|Giuseppe Garibaldi|Galileo Galilei|Cristoforo Colombo|Giulio Cesare|Napoleone|Marco Polo|Michelangelo|Giuseppe Verdi|" +
       "Mozart|Albert Einstein|Totò|Alberto Sordi|Sophia Loren|Roberto Benigni|Checco Zalone|Fiorello|Gerry Scotti|Maria De Filippi|" +
       "Carlo Conti|Amadeus|Paolo Bonolis|Mara Venier|Alberto Angela|Gianni Morandi|Vasco Rossi|Laura Pausini|Eros Ramazzotti|Jovanotti|" +
       "Andrea Bocelli|Mina|Adriano Celentano|Lucio Dalla|Raffaella Carrà|Måneskin|Al Bano|Zucchero|Renato Zero|Ligabue|" +
       "Francesco Totti|Alessandro Del Piero|Roberto Baggio|Diego Armando Maradona|Valentino Rossi|Jannik Sinner|Federica Pellegrini|Alberto Tomba|Bebe Vio|Gianmarco Tamberi|" +
       "Sofia Goggia|Gigi Buffon|Paolo Maldini|Carlo Cracco|Bruno Barbieri|Antonino Cannavacciuolo|Benedetta Rossi|Margherita Hack|Rita Levi-Montalcini|Freddie Mercury|" +
       "Elvis Presley|Lionel Messi|Cristiano Ronaldo|Leonardo DiCaprio|Charlie Chaplin",

    x: "Topolino|Paperino|Zio Paperone|Pinocchio|Biancaneve|Cenerentola|Shrek|Harry Potter|Babbo Natale|La Befana|" +
       "Spider-Man|Batman|Superman|Wonder Woman|Darth Vader|Yoda|Sherlock Holmes|James Bond|Dracula|Frankenstein|" +
       "Peter Pan|Capitan Uncino|Super Mario|Pikachu|Homer Simpson|Lupin III|Goku|Heidi|Geronimo Stilton|Winnie the Pooh|" +
       "SpongeBob|Peppa Pig|Elsa di Frozen|Il Grinch|Gollum|Gandalf|Zorro|Robin Hood|Cappuccetto Rosso|Il lupo cattivo|" +
       "Pippi Calzelunghe|Asterix|Tarzan|Alice nel Paese delle Meraviglie|Mary Poppins|Willy Wonka|Il Piccolo Principe|Barbie|Hulk|Iron Man|" +
       "Il Joker|Buzz Lightyear|Olaf|I Minions|Fantozzi|Diabolik|Tex Willer|Nemo|Il Gatto con gli stivali|Cappellaio Matto",

    o: "Ombrello|Moka|Ventaglio|Termosifone|Divano letto|Amaca|Cuscino|Pigiama|Ciabatte|Infradito|" +
       "Tacchi a spillo|Cravatta|Felpa|Occhiali da sole|Orologio da polso|Zaino|Trolley|Agenda di carta|Penna stilografica|Candela profumata|" +
       "Specchio|Bilancia|Barbecue|Tenda da campeggio|Bicicletta|Motorino|Camper|Pattini a rotelle|Skateboard|Peluche|" +
       "Palloncino|Coriandoli|Albero di Natale finto|Presepe|Calendario dell'avvento|Borraccia|Thermos|Cannuccia|Tupperware|Coltellino svizzero|" +
       "Calamita da frigo|Soprammobile|Tappeto|Fischietto|Megafono|Sedia a dondolo|Ombrellone|Libro di cucina|Enciclopedia|Cappello di paglia|" +
       "Guanti di lana|Gnomo da giardino|Bomboniera|Portachiavi|Sciarpa della squadra|Tovaglia ricamata|Salvadanaio",

    t: "Telecomando|Friggitrice ad aria|Bimby|Monopattino elettrico|Smartwatch|Bastone per i selfie|Ventilatore|Condizionatore|Phon|Piastra per capelli|" +
       "Spazzolino elettrico|Lavastoviglie|Microonde|Tostapane|Calcolatrice|Fax|Videoregistratore|Macchina da scrivere|Walkman|" +
       "Radio|Giradischi|Cuffie senza fili|Tablet|Stampante|Chiavetta USB|Caricabatterie portatile|Navigatore|Sveglia|Ferro da stiro|" +
       "Aspirapolvere|Robot aspirapolvere|Lavatrice|Tagliaerba|Macchina elettrica|Telefono a conchiglia|Lampada abbronzante|Macchina del caffè a cialde|Occhiali per la realtà virtuale|Assistente vocale|" +
       "Drone|Stampante 3D|Macchina fotografica istantanea|Televisore gigante|Console per videogiochi|Auto che si guida da sola|Telefono fisso|Lettore DVD|Termostato intelligente",

    n: "Cane|Gatto|Criceto|Coniglio|Pesce rosso|Pappagallo|Tartaruga|Cavallo|Mucca|Maiale|" +
       "Pecora|Capra|Gallina|Oca|Asino|Lama|Alpaca|Leone|Tigre|Elefante|" +
       "Giraffa|Ippopotamo|Rinoceronte|Zebra|Scimmia|Gorilla|Panda|Koala|Canguro|Pinguino|" +
       "Orso polare|Orso bruno|Lupo|Volpe|Riccio|Scoiattolo|Talpa|Pipistrello|Gufo|Aquila|" +
       "Piccione|Gabbiano|Cigno|Fenicottero|Pavone|Struzzo|Squalo|Delfino|Balena|Polpo|" +
       "Medusa|Granchio|Coccodrillo|Serpente|Lucertola|Rana|Ape|Formica|Zanzara|Ragno|" +
       "Farfalla|Lumaca|Coccinella|Bradipo|Cammello|Lontra|Foca|Camaleonte|Cinghiale|Cervo|Topo",

    a: "Karaoke|Fai da te|Palestra alle 6 del mattino|Correre la mattina|Yoga|Fare la spesa|Stirare|Lavare i piatti|Cucinare per tanti|Bagno di mezzanotte|" +
       "Prendere il sole|Dormire fino a mezzogiorno|Serie tv tutta la notte|Mangiare davanti alla TV|Telefonate di un'ora|Messaggi vocali|Fare selfie|Fotografare il piatto|Doccia fredda|Cantare sotto la doccia|" +
       "Leggere in spiaggia|Uncinetto|Giardinaggio|Shopping|Trekking|Andare al lavoro in bici|Imparare il cinese|Suonare la chitarra|Volontariato|Andare ai concerti|" +
       "Ballare in discoteca|Aperitivo|Cenare alle 18|Colazione al bar|Inzuppare i biscotti|Fare la scarpetta|Parmigiano sul pesce|Spezzare gli spaghetti|Pisolino dopo pranzo|Arrivare in ritardo|" +
       "Puzzle da 1.000 pezzi|Collezionare francobolli|Guardare i cantieri|Bagno dopo mangiato|Chiacchierare coi vicini|Andare a funghi|Viaggiare da soli|Farsi un tatuaggio|Tingersi i capelli|Truccarsi ogni giorno|" +
       "Scrivere un diario|Meditare|Dormire con la luce accesa|Mangiare in piedi|Telefonare alla mamma ogni giorno|Liste delle cose da fare|Rispondere alle email|Fila alle poste|Lavare la macchina|Raccolta differenziata|" +
       "Annaffiare le piante|Portare a spasso il cane|Fare il pane in casa|Pizza fatta in casa|Cambio di stagione|Montare un mobile Ikea|Riciclare i regali|Feste a sorpresa|Guardare le stelle|Ascensore per un piano|" +
       "Uscire senza telefono|Maratona di film|Bagno nella vasca|Sauna|Cantare in macchina|Treno di notte|Fischiettare|Fare le pulizie di primavera|Dormire in tenda|Imparare a ballare il tango",

    s: "Un posto al sole|Don Matteo|Il commissario Montalbano|Gomorra|La casa di carta|Stranger Things|Il trono di spade|I Simpson|Il Re Leone|Titanic|" +
       "Star Wars|Il Padrino|Frozen|Toy Story|Il Signore degli Anelli|Jurassic Park|Ritorno al futuro|La vita è bella|Nuovo Cinema Paradiso|La grande bellezza|" +
       "Mamma mia!|Grease|Dirty Dancing|Rocky|Il diavolo veste Prada|Notte prima degli esami|Benvenuti al Sud|Mamma, ho perso l'aereo|Squid Game|Friends|" +
       "Avengers|Pirati dei Caraibi|Cinepanettone|Film horror|Telenovela|Mare fuori|L'amica geniale|Matrix|Il Gladiatore|E.T.|" +
       "Pretty Woman|Ghostbusters|La sirenetta|Aladdin|Perfetti sconosciuti|Bridgerton|Breaking Bad|Fast and Furious|The Office",

    v: "Festival di Sanremo|Grande Fratello|X Factor|MasterChef|Ciao Darwin|Affari tuoi|Chi vuol essere milionario|La Ruota della Fortuna|Striscia la notizia|Le Iene|" +
       "Telegiornale|Previsioni del tempo|Ballando con le stelle|Uomini e donne|Zelig|Pechino Express|Temptation Island|L'Eredità|Reazione a catena|Concertone del Primo Maggio|" +
       "Notte degli Oscar|Tale e quale show|Documentario sugli animali|Domenica In|Techetechetè|Il collegio|Bake Off Italia|Superquark|Avanti un altro|Paperissima|" +
       "Forum|La prova del cuoco|Caduta libera|Linea Verde",

    m: "Dentista|Idraulico|Elettricista|Avvocato|Notaio|Commercialista|Medico|Infermiere|Maestra elementare|Professore di matematica|" +
       "Pilota d'aereo|Astronauta|Chef|Pizzaiolo|Barista|Cameriere|Parrucchiere|Estetista|Postino|Vigile urbano|" +
       "Poliziotto|Pompiere|Muratore|Contadino|Pescatore|Panettiere|Macellaio|Giornalista|Fotografo|Influencer|" +
       "Youtuber|Calciatore|Attore|Cantante lirico|DJ|Bagnino|Animatore turistico|Guida turistica|Tassista|Camionista|" +
       "Architetto|Ingegnere|Programmatore|Veterinario|Psicologo|Farmacista|Babysitter|Personal trainer|Sarto|Clown|" +
       "Mago|Archeologo|Astronomo|Meteorologo|Benzinaio|Edicolante|Cassiere del supermercato|Commesso|Agente immobiliare|Wedding planner",

    e: "Natale|Capodanno|Pasqua|Pasquetta|Ferragosto|Carnevale|Halloween|San Valentino|Compleanno|Festa della mamma|" +
       "Matrimonio|Prima comunione|Battesimo|Laurea|Addio al celibato|Gita scolastica|Primo giorno di scuola|Festa dei nonni|Esame di maturità|Trasloco|" +
       "Riunione di condominio|Pranzo della domenica|Cenone della vigilia|Festa a sorpresa|Colloquio di lavoro|Primo appuntamento|Vacanze di agosto|Ponte del primo maggio|Tombolata|Veglione|" +
       "Cena di classe|Rimpatriata con i compagni di scuola|Festa di paese|Black Friday|Lunedì mattina|Venerdì sera|Domenica pomeriggio|Saggio di danza|Festa del papà|Recita di Natale|" +
       "Mercatino di Natale|Festa di fine anno|Pigiama party|Grigliata in campagna|Anniversario di matrimonio",

    g: "Calcio|Padel|Tennis|Golf|Pallavolo|Basket|Rugby|Formula 1|MotoGP|Ciclismo|" +
       "Nuoto|Sci|Snowboard|Surf|Pesca sportiva|Bocce|Biliardo|Freccette|Bowling|Ping pong|" +
       "Beach volley|Pallanuoto|Equitazione|Scherma|Boxe|Karate|Sumo|Curling|Maratona|Arrampicata|" +
       "Paracadutismo|Bungee jumping|Zumba|Pilates|Tiro con l'arco|Pattinaggio artistico|Atletica|Canoa|Hockey su ghiaccio|Ginnastica artistica|" +
       "Football americano|Baseball|Judo|Salto con l'asta|Vela",

    j: "Scacchi|Dama|Monopoli|Risiko|Tombola|Scopa|Briscola|Poker|Uno|Cluedo|" +
       "Jenga|Twister|Nascondino|Campana|Calcio balilla|Corsa nei sacchi|Tiro alla fune|Videogiochi|Fantacalcio|Sudoku|" +
       "Cruciverba|Gioco dell'oca|Ruba bandiera|Mosca cieca|Burraco|Pictionary|Indovina chi?|Battaglia navale|Tris|Mimo|" +
       "Obbligo o verità|Shanghai|Memory|Forza quattro|Sette e mezzo"
  };
})();

/* =========================================================
   DATI — Coppie di parole per il gioco "L'Impostore".
   Divise per categoria (l'host sceglie quali usare).
   Ogni coppia è "Parola/Parola simile", separate da "|":
   una delle due va a tutti, l'altra (a caso) alla spia o
   all'impostore con l'aiutino. Le due parole devono essere
   VICINE (stessa famiglia, stesso uso: mare/lago), così chi
   ha quella simile può mimetizzarsi.
   Ogni parola compare una volta sola in tutto il file: le
   altre parole della stessa categoria fanno da "esca"
   nell'ultima possibilità dell'impostore.
   ========================================================= */
window.SG_IMPOSTORE = [
  { id: "cibo", icona: "🍕", nome: "Cibo",
    coppie: "Pizza/Focaccia|Gelato/Ghiacciolo|Caffè/Cappuccino|Tè/Camomilla|Biscotto/Fetta biscottata|Miele/Marmellata|" +
      "Salame/Prosciutto|Cornetto/Ciambella|Sushi/Involtini primavera|Hamburger/Hot dog|Patatine fritte/Crocchette|" +
      "Maionese/Ketchup|Torta/Crostata|Cioccolato/Torrone|Caramella/Lecca-lecca|Gomma da masticare/Mentina|Pane/Grissino|" +
      "Panino/Tramezzino|Toast/Piadina|Spaghetti/Tagliatelle|Risotto/Paella|Minestrone/Passato di verdure|Tortellini/Ravioli|" +
      "Polenta/Purè di patate|Frittata/Uova strapazzate|Bistecca/Cotoletta|Pollo arrosto/Tacchino|Salsiccia/Wurstel|" +
      "Polpette/Involtini|Tonno/Salmone|Gamberi/Calamari|Cozze/Vongole|Mela/Pera|Arancia/Mandarino|Limone/Pompelmo|" +
      "Fragola/Lampone|Ciliegia/Prugna|Pesca/Albicocca|Ananas/Cocco|Anguria/Melone|Uva/Mirtillo|Pomodoro/Peperone|" +
      "Zucchina/Melanzana|Carota/Ravanello|Cipolla/Aglio|Lattuga/Spinaci|Fagioli/Ceci|Piselli/Lenticchie|Fungo/Tartufo|" +
      "Popcorn/Zucchero filato|Aranciata/Limonata|Succo di frutta/Spremuta|Latte/Yogurt|Burro/Margarina|Olio/Aceto|" +
      "Sale/Zucchero|Pepe/Peperoncino|Basilico/Prezzemolo|Cannella/Vaniglia|Frullato/Centrifuga|Cereali/Fiocchi d'avena|" +
      "Pancake/Crêpe|Muffin/Plumcake|Granita/Sorbetto|Kebab/Burrito|Noce/Nocciola|Arachidi/Pistacchi|Sedano/Finocchio|" +
      "Cavolfiore/Broccoli|Panna/Mascarpone|Nutella/Crema al pistacchio|Brodo/Zuppa|Banana/Kiwi|Patata/Castagna|" +
      "Uovo sodo/Uovo al tegamino|Acqua/Acqua frizzante|Cioccolata calda/Latte caldo|Merendina/Barretta|Pizzetta/Calzone" },

  { id: "animali", icona: "🐾", nome: "Animali",
    coppie: "Cane/Lupo|Gatto/Tigre|Ghepardo/Leopardo|Leone/Puma|Squalo/Delfino|Balena/Orca|Ragno/Scorpione|Cavallo/Asino|" +
      "Giraffa/Zebra|Elefante/Rinoceronte|Ape/Vespa|Zanzara/Mosca|Formica/Termite|Farfalla/Libellula|Coccinella/Lucciola|" +
      "Pinguino/Foca|Tricheco/Leone marino|Orso/Panda|Aquila/Falco|Gufo/Civetta|Pappagallo/Tucano|Gabbiano/Piccione|" +
      "Gallina/Gallo|Anatra/Oca|Mucca/Toro|Pecora/Capra|Coniglio/Lepre|Criceto/Porcellino d'India|Topo/Talpa|" +
      "Scoiattolo/Ghiro|Serpente/Anguilla|Lucertola/Geco|Coccodrillo/Ippopotamo|Rana/Rospo|Tartaruga/Armadillo|" +
      "Lumaca/Lombrico|Polpo/Medusa|Granchio/Aragosta|Stella marina/Riccio di mare|Pesce rosso/Pesce pagliaccio|" +
      "Cigno/Fenicottero|Struzzo/Pavone|Pipistrello/Falena|Scimmia/Gorilla|Cammello/Dromedario|Canguro/Koala|" +
      "Volpe/Procione|Cervo/Alce|Riccio/Istrice|Cavalluccio marino/Pesce spada|Corvo/Merlo|Passerotto/Pettirosso|" +
      "Picchio/Colibrì|Camaleonte/Iguana|Lama/Alpaca|Cicala/Grillo|Maiale/Cinghiale|Avvoltoio/Condor|Bruco/Millepiedi|" +
      "Iena/Sciacallo|Castoro/Lontra" },

  { id: "casa", icona: "🏠", nome: "Casa e oggetti",
    coppie: "Divano/Poltrona|Letto/Culla|Sedia/Sgabello|Tavolo/Scrivania|Armadio/Cassettiera|Frigorifero/Congelatore|" +
      "Forno/Microonde|Lavatrice/Lavastoviglie|Ferro da stiro/Piastra per capelli|Aspirapolvere/Scopa|Doccia/Vasca da bagno|" +
      "Lavandino/Bidet|Specchio/Finestra|Tenda/Tapparella|Tappeto/Zerbino|Cuscino/Materasso|Coperta/Lenzuolo|" +
      "Asciugamano/Accappatoio|Lampadina/Torcia|Candela/Lanterna|Sveglia/Timer da cucina|Forchetta/Cucchiaio|" +
      "Coltello/Forbici|Pentola/Padella|Piatto/Ciotola|Bicchiere/Tazza|Bottiglia/Borraccia|Moka/Teiera|" +
      "Frullatore/Spremiagrumi|Grattugia/Pelapatate|Scolapasta/Colino|Mattarello/Tagliere|Chiave/Lucchetto|" +
      "Campanello/Citofono|Termosifone/Stufa|Ventilatore/Condizionatore|Spazzolino/Filo interdentale|Dentifricio/Collutorio|" +
      "Shampoo/Bagnoschiuma|Sapone/Spugna|Pettine/Spazzola|Phon/Rasoio elettrico|Martello/Cacciavite|Trapano/Avvitatore|" +
      "Secchio/Annaffiatoio|Mocio/Straccio|Scatola/Cassetto|Cassaforte/Salvadanaio|Quadro/Poster|Vaso/Anfora|" +
      "Accendino/Fiammiferi|Ago/Spillo|Scala/Ascensore|Pattumiera/Cestino|Molletta/Stendino|Cuccia/Lettiera|" +
      "Portachiavi/Calamita da frigo|Mensola/Scaffale|Comodino/Mobiletto|Tostapane/Bollitore" },

  { id: "luoghi", icona: "🗺️", nome: "Luoghi",
    coppie: "Mare/Lago|Fiume/Canale|Montagna/Collina|Spiaggia/Deserto|Ospedale/Farmacia|Stazione/Aeroporto|Porto/Faro|" +
      "Cinema/Teatro|Biblioteca/Libreria|Museo/Mostra|Supermercato/Mercato|Centro commerciale/Outlet|" +
      "Hotel/Bed and breakfast|Scuola/Università|Chiesa/Convento|Castello/Fortezza|Zoo/Acquario|Luna park/Circo|" +
      "Parco/Giardino|Bosco/Giungla|Isola/Penisola|Grotta/Miniera|Vulcano/Geyser|Cascata/Fontana|Palestra/Piscina|" +
      "Stadio/Palazzetto|Discoteca/Karaoke|Ristorante/Pizzeria|Bar/Pasticceria|Banca/Ufficio postale|Prigione/Caserma|" +
      "Fattoria/Maneggio|Ponte/Tunnel|Autostrada/Tangenziale|Parcheggio/Garage|Benzinaio/Autolavaggio|Grattacielo/Torre|" +
      "Baita/Rifugio|Igloo/Capanna|Terme/Centro benessere|Polo Nord/Polo Sud|Savana/Prateria|Palude/Stagno|" +
      "Campeggio/Villaggio turistico|Città/Paese|Balcone/Terrazzo|Cantina/Soffitta|Camera da letto/Salotto|" +
      "Pronto soccorso/Sala d'attesa|Sala giochi/Bowling|Gelateria/Paninoteca|Edicola/Tabaccheria" },

  { id: "persone", icona: "👷", nome: "Mestieri e personaggi",
    coppie: "Dottore/Infermiere|Dentista/Oculista|Pediatra/Veterinario|Cuoco/Pizzaiolo|Pasticciere/Fornaio|Cameriere/Barista|" +
      "Poliziotto/Carabiniere|Pompiere/Guardia forestale|Astronauta/Sommozzatore|Pilota/Hostess|Autista/Tassista|" +
      "Maestra/Professore|Preside/Bidello|Giudice/Avvocato|Muratore/Imbianchino|Idraulico/Elettricista|Meccanico/Gommista|" +
      "Contadino/Pastore|Giardiniere/Fioraio|Macellaio/Salumiere|Pescatore/Marinaio|Parrucchiere/Barbiere|" +
      "Estetista/Truccatrice|Cantante/Rapper|Attore/Comico|Ballerino/Ginnasta|Pittore/Scultore|Fotografo/Cameraman|" +
      "Giornalista/Scrittore|Postino/Corriere|Commesso/Cassiere|Clown/Giocoliere|Re/Principe|Regina/Principessa|" +
      "Ninja/Samurai|Cavaliere/Moschettiere|Pirata/Vichingo|Strega/Fata|Vampiro/Zombie|Fantasma/Mummia|Angelo/Cupido|" +
      "Calciatore/Allenatore|Arbitro/Guardalinee|Scienziato/Inventore|Archeologo/Esploratore|Sindaco/Presidente|" +
      "Prete/Frate|Bambino/Neonato|Mago/Indovina|Youtuber/Influencer|Bagnino/Maestro di sci|Nonno/Bisnonno|" +
      "Cowboy/Sceriffo|Ladro/Borseggiatore" },

  { id: "sport", icona: "⚽", nome: "Sport e giochi",
    coppie: "Calcio/Calcetto|Pallavolo/Beach volley|Basket/Pallamano|Tennis/Padel|Ping pong/Badminton|Nuoto/Pallanuoto|" +
      "Sci/Snowboard|Pattinaggio/Hockey su ghiaccio|Ciclismo/Spinning|Corsa/Maratona|Boxe/Karate|Judo/Lotta libera|" +
      "Scherma/Tiro con l'arco|Golf/Minigolf|Bocce/Curling|Biliardo/Biliardino|Freccette/Tiro a segno|" +
      "Formula 1/MotoGP|Rugby/Football americano|Surf/Windsurf|Vela/Canottaggio|Equitazione/Ippica|Yoga/Pilates|" +
      "Arrampicata/Alpinismo|Paracadutismo/Bungee jumping|Skateboard/Pattini a rotelle|Scacchi/Dama|" +
      "Briscola/Scala quaranta|Poker/Blackjack|Monopoli/Gioco dell'oca|Tombola/Bingo|Puzzle/Cruciverba|Sudoku/Rebus|" +
      "Nascondino/Mosca cieca|Campana/Salto della corda|Lego/Playmobil|Bambola/Peluche|Trottola/Yo-yo|" +
      "Aquilone/Palloncino|Altalena/Scivolo|Videogioco/Gioco da tavolo|Roulette/Slot machine|Gratta e vinci/Lotteria|" +
      "Olimpiadi/Mondiali|Coppa/Medaglia|Tuffi/Nuoto sincronizzato|Fischietto/Cartellino rosso|Porta da calcio/Canestro|" +
      "Racchetta/Mazza da baseball|Salto in alto/Salto con l'asta" },

  { id: "mezzi", icona: "🚗", nome: "Mezzi e viaggi",
    coppie: "Treno/Metropolitana|Tram/Autobus|Aereo/Elicottero|Nave/Traghetto|Barca a vela/Motoscafo|Gommone/Pedalò|" +
      "Canoa/Kayak|Macchina/Furgone|Moto/Scooter|Bicicletta/Monopattino|Trattore/Ruspa|Camion/Betoniera|" +
      "Ambulanza/Camion dei pompieri|Mongolfiera/Dirigibile|Razzo/Satellite|Funivia/Seggiovia|Carrozza/Slitta|" +
      "Limousine/Taxi|Valigia/Borsone|Passaporto/Carta d'identità|Biglietto/Abbonamento|Cartina/Navigatore|" +
      "Casello/Dogana|Semaforo/Strisce pedonali|Casco/Cintura di sicurezza|Volante/Manubrio|Patente/Targa|" +
      "Pullman/Navetta|Paracadute/Deltaplano|Barca a remi/Gondola|Crociera/Gita in barca|Roulotte/Camper|" +
      "Autogrill/Area di sosta|Binario/Banchina|Vagone/Locomotiva|Aliscafo/Catamarano|Risciò/Calesse|Quad/Motocross|" +
      "Go-kart/Autoscontro|Hoverboard/Segway|Jet privato/Aereo di linea|Check-in/Imbarco|Mal di mare/Mal d'auto|" +
      "Autostop/Passaggio|Pieno di benzina/Ricarica elettrica|Foratura/Ruota di scorta|Multa/Autovelox|Ingorgo/Coda in autostrada|" +
      "Clacson/Sirena|Specchietto/Tergicristallo|Freno/Acceleratore|Sottomarino/Batiscafo|Nave pirata/Galeone|" +
      "Treno a vapore/Frecciarossa|Sacco a pelo/Tenda da campeggio" },

  { id: "vestiti", icona: "👕", nome: "Vestiti e accessori",
    coppie: "Pantaloni/Gonna|Maglietta/Canottiera|Felpa/Maglione|Giacca/Cappotto|Giubbotto/Piumino|Impermeabile/Ombrello|" +
      "Cappello/Bandana|Berretto di lana/Paraorecchie|Sciarpa/Scaldacollo|Cravatta/Papillon|Guanti/Manopole|" +
      "Calze/Collant|Scarpe da ginnastica/Scarponi|Sandali/Infradito|Ciabatte/Pantofole|Tacchi/Ballerine|" +
      "Pigiama/Camicia da notte|Costume da bagno/Muta da sub|Abito da sposa/Abito da sera|Tuta da ginnastica/Leggings|" +
      "Grembiule/Bavaglino|Occhiali da sole/Maschera da sci|Occhiali/Lenti a contatto|Orologio/Braccialetto|" +
      "Anello/Orecchini|Collana/Spilla|Borsetta/Marsupio|Cintura/Bretelle|Bottone/Cerniera|Corona/Diadema|" +
      "Mantello/Poncho|Rossetto/Lucidalabbra|Mascara/Eyeliner|Profumo/Deodorante|Camicia/Polo|Jeans/Salopette|" +
      "Portafoglio/Portamonete|Cappellino/Visiera|Elastico per capelli/Cerchietto|Smalto/Unghie finte" },

  { id: "natura", icona: "🌳", nome: "Natura e cielo",
    coppie: "Sole/Stella|Stella cadente/Cometa|Marte/Giove|Pioggia/Grandine|Neve/Brina|Temporale/Uragano|Fulmine/Tuono|" +
      "Arcobaleno/Aurora boreale|Nuvola/Nebbia|Vento/Bufera|Terremoto/Eruzione|Albero/Cespuglio|Rosa/Tulipano|" +
      "Girasole/Margherita|Cactus/Aloe|Pino/Abete|Palma/Banano|Foglia/Petalo|Erba/Muschio|Sabbia/Ghiaia|" +
      "Conchiglia/Perla|Diamante/Rubino|Oro/Argento|Ghiacciaio/Iceberg|Onda/Marea|Alba/Tramonto|Estate/Primavera|" +
      "Inverno/Autunno|Mattina/Pomeriggio|Falò/Camino|Fumo/Vapore|Seme/Germoglio|Ramo/Tronco|Nido/Tana|" +
      "Luna piena/Mezzaluna|Asteroide/Meteorite|Lava/Magma|Ruscello/Torrente|Pozzanghera/Fango|Ghianda/Pigna|" +
      "Valanga/Frana|Prato/Campo di grano|Quercia/Ulivo" },

  { id: "feste", icona: "🎉", nome: "Feste, musica e TV",
    coppie: "Natale/Capodanno|Carnevale/Halloween|Babbo Natale/Befana|Albero di Natale/Presepe|Compleanno/Onomastico|" +
      "Matrimonio/Battesimo|Coriandoli/Stelle filanti|Fuochi d'artificio/Petardi|Uovo di Pasqua/Colomba|Maschera/Trucco|" +
      "Concerto/Festival|Chitarra/Ukulele|Violino/Violoncello|Pianoforte/Organo|Batteria/Tamburo|Tromba/Sassofono|" +
      "Flauto/Clarinetto|Fisarmonica/Armonica|Microfono/Megafono|Film/Serie TV|Cartone animato/Fumetto|" +
      "Telegiornale/Previsioni del tempo|Talent show/Reality show|Sanremo/Eurovision|Opera/Musical|Tango/Valzer|" +
      "Rock/Heavy metal|Radio/Podcast|Regalo/Biglietto d'auguri|Torta di compleanno/Torta nuziale|" +
      "Festa a sorpresa/Pigiama party|Animatore/Prestigiatore|Piñata/Caccia al tesoro|Cotillon/Trombetta|" +
      "Tombolata/Cenone|Vigilia/Santo Stefano|Calza della Befana/Sacco dei regali" },

  { id: "italia", icona: "🇮🇹", nome: "Italia",
    coppie: "Napoli/Palermo|Milano/Torino|Venezia/Amsterdam|Firenze/Siena|Bologna/Modena|Roma/Atene|" +
      "Colosseo/Arena di Verona|Torre di Pisa/Torre Eiffel|Duomo di Milano/Basilica di San Pietro|Vesuvio/Etna|" +
      "Sicilia/Sardegna|Capri/Ischia|Alpi/Appennini|Po/Tevere|Lago di Garda/Lago di Como|Carbonara/Amatriciana|" +
      "Lasagne/Cannelloni|Pesto/Ragù|Arancini/Supplì|Mozzarella/Burrata|Parmigiano/Pecorino|Cannolo/Sfogliatella|" +
      "Tiramisù/Panna cotta|Panettone/Pandoro|Ferrari/Lamborghini|Pulcinella/Arlecchino|Inter/Milan|" +
      "Ferragosto/Pasquetta|Tarantella/Pizzica|Trullo/Nuraghe|Fiat 500/Maggiolino|Puglia/Calabria|Toscana/Umbria|" +
      "Orecchiette/Gnocchi|Mortadella/Porchetta|Babà/Zeppola|Gelato artigianale/Semifreddo|Piazza San Marco/Piazza del Campo|" +
      "Fontana di Trevi/Bocca della Verità|Gondoliere/Vaporetto|Sagra/Fiera di paese|Riviera romagnola/Costiera amalfitana" },

  { id: "personaggi", icona: "🎬", nome: "Film, cartoni e fiabe",
    coppie: "Topolino/Paperino|Pippo/Pluto|Biancaneve/Cenerentola|Cappuccetto Rosso/Riccioli d'oro|Pinocchio/Lucignolo|" +
      "Peter Pan/Capitan Uncino|Harry Potter/Mago Merlino|Superman/Batman|Spider-Man/Iron Man|Hulk/Shrek|" +
      "Super Mario/Sonic|Elsa/Olaf|Simba/Bambi|Nemo/Dory|Winnie the Pooh/Paddington|Dracula/Frankenstein|" +
      "King Kong/Godzilla|Sherlock Holmes/Montalbano|Puffi/Minions|Barbie/Cicciobello|Fata Turchina/Fata Smemorina|" +
      "Aladdin/Mowgli|Robin Hood/Zorro|Rapunzel/Bella addormentata|Geronimo Stilton/Topo Gigio|Peppa Pig/Masha e Orso|" +
      "Darth Vader/Voldemort|Heidi/Pippi Calzelunghe|Gatto con gli stivali/Stregatto|Buzz Lightyear/Woody|" +
      "SpongeBob/Patrick|Zio Paperone/Rockerduck|Lupo cattivo/Orco|" +
      "Asterix/Obelix|Mulan/Pocahontas|WALL-E/R2-D2|Jack Sparrow/Capitano Barbossa|Pac-Man/Tetris|Pikachu/Charmander" },

  { id: "scuola", icona: "🏫", nome: "Scuola e ufficio",
    coppie: "Matita/Penna|Gomma/Bianchetto|Righello/Squadra|Compasso/Goniometro|Quaderno/Diario|Libro/Rivista|" +
      "Dizionario/Enciclopedia|Zaino/Cartella|Lavagna/Cartellone|Gesso/Pennarello|Colla/Nastro adesivo|" +
      "Pinzatrice/Graffetta|Calcolatrice/Abaco|Interrogazione/Compito in classe|Pagella/Diploma|" +
      "Ricreazione/Gita scolastica|Banco/Cattedra|Storia/Geografia|Matematica/Geometria|Inglese/Francese|" +
      "Stampante/Fotocopiatrice|Riunione/Videochiamata|Timbro/Firma|Agenda/Calendario|Post-it/Promemoria|" +
      "Mappamondo/Atlante|Pastelli a cera/Acquerelli|Microscopio/Telescopio|Temperamatite/Taglierino|" +
      "Campanella/Appello|Compiti delle vacanze/Libro di lettura|Bocciatura/Promozione|Cartelletta/Raccoglitore|" +
      "Esame di maturità/Esame di terza media|Asilo/Scuola elementare|Laurea/Master|Astuccio/Portapenne|Merenda/Pranzo al sacco|" +
      "Copiare/Suggerire|Assenza/Ritardo|Giustificazione/Nota sul registro|Scuolabus/Pulmino|Mensa/Distributore di merendine|" +
      "Ufficio/Coworking|Capo/Collega|Stipendio/Tredicesima|Ferie/Malattia|Pausa caffè/Pausa pranzo|" +
      "Curriculum/Colloquio di lavoro|Lettera/Cartolina|Busta/Pacco|Evidenziatore/Pennarello indelebile" },

  { id: "tecno", icona: "💡", nome: "Tecnologia",
    coppie: "Smartphone/Tablet|Computer/Portatile|Televisore/Proiettore|Giradischi/Mangianastri|Cuffie/Auricolari|" +
      "Telecomando/Joystick|Fotocamera/Videocamera|Chiavetta USB/Hard disk|Wi-Fi/Bluetooth|Messaggio/Email|" +
      "Instagram/TikTok|YouTube/Netflix|Robot/Androide|Drone/Macchinina radiocomandata|Selfie/Foto di gruppo|" +
      "Password/PIN|Power bank/Caricabatterie|Tastiera/Mouse|PlayStation/Xbox|Smartwatch/Contapassi|" +
      "Visore per la realtà virtuale/Occhiali 3D|Allarme/Telecamera di sorveglianza|Emoji/Sticker|" +
      "Assistente vocale/Chatbot|Codice QR/Codice a barre|Cassa bluetooth/Stereo|" +
      "Monitor/Schermo touch|Sito internet/App|WhatsApp/Telegram|Google/Wikipedia|Amazon/eBay|Like/Cuoricino|" +
      "Notifica/Suoneria|Antenna/Parabola|Presa elettrica/Multipresa|Pannello solare/Pala eolica|Floppy disk/CD-ROM|" +
      "DVD/Videocassetta|Spam/Pubblicità|Aggiornamento/Riavvio|Batteria scarica/Schermo rotto|Nintendo Switch/Game Boy|" +
      "Follower/Iscritti|Hashtag/Tag|Stampante 3D/Scanner|Telefono fisso/Cabina telefonica" },

  { id: "corpo", icona: "💪", nome: "Corpo e salute",
    coppie: "Mano/Piede|Occhio/Orecchio|Gomito/Ginocchio|Naso/Bocca|Dente/Unghia|Capelli/Barba|Baffi/Sopracciglia|" +
      "Spalla/Fianco|Pancia/Schiena|Cuore/Polmoni|Stomaco/Fegato|Cervello/Cranio|Sangue/Sudore|Lacrima/Saliva|" +
      "Starnuto/Sbadiglio|Singhiozzo/Tosse|Raffreddore/Influenza|Febbre/Mal di gola|Cerotto/Benda|Termometro/Stetoscopio|" +
      "Siringa/Vaccino|Pillola/Sciroppo|Ingessatura/Stampella|Livido/Graffio|Brufolo/Neo|Lentiggini/Fossette|" +
      "Pollice/Mignolo|Caviglia/Polso|Tallone/Alluce|Lingua/Labbra|Ciglia/Palpebre|Mento/Guancia|Collo/Nuca|" +
      "Radiografia/Ecografia|Occhiaie/Rughe|Muscoli/Ossa|Scheletro/Teschio|Solletico/Pizzicotto|Abbraccio/Bacio|" +
      "Carezza/Pacca sulla spalla|Massaggio/Fisioterapia|Dieta/Digiuno|Sonno/Pisolino|Apparecchio per i denti/Otturazione" },

  { id: "azioni", icona: "🏃", nome: "Cose da fare",
    coppie: "Correre/Camminare|Nuotare/Galleggiare|Dormire/Sonnecchiare|Ridere/Sorridere|Piangere/Singhiozzare|" +
      "Urlare/Sussurrare|Cantare/Fischiettare|Mangiare/Assaggiare|Bere/Sorseggiare|Cucinare/Apparecchiare|" +
      "Lavare i piatti/Stendere i panni|Stirare/Piegare i vestiti|Leggere/Sfogliare|Scrivere/Disegnare|Pitturare/Colorare|" +
      "Mandare un vocale/Scrivere un messaggio|Fare la spesa/Fare shopping|Guidare/Parcheggiare|Pedalare/Pattinare|" +
      "Litigare/Discutere|Spolverare/Lavare il pavimento|Fare il bagno/Fare la doccia|Truccarsi/Pettinarsi|" +
      "Fare un selfie/Fare un video|Russare/Parlare nel sonno|Sbadigliare/Stiracchiarsi|Fare la fila/Prendere il numerino|" +
      "Ordinare a domicilio/Mangiare al ristorante|Barare/Imbrogliare|Mentire/Esagerare|Spiare/Origliare|" +
      "Nascondersi/Scappare|Bussare/Suonare il campanello|Applaudire/Fare il tifo|Brindare/Festeggiare|" +
      "Traslocare/Ristrutturare|Fare jogging/Fare stretching|Viaggiare/Fare le valigie|Imparare/Ripassare|" +
      "Prendere il sole/Fare un picnic|Fischiare/Schioccare le dita|Contare/Misurare|Tuffarsi/Scivolare" },

  { id: "famosi", icona: "⭐", nome: "Personaggi famosi",
    coppie: "Vasco Rossi/Ligabue|Laura Pausini/Giorgia|Gianni Morandi/Al Bano|Eros Ramazzotti/Jovanotti|Ultimo/Tiziano Ferro|" +
      "Totti/Del Piero|Maradona/Pelé|Messi/Cristiano Ronaldo|Sinner/Berrettini|Valentino Rossi/Max Biaggi|Senna/Schumacher|" +
      "Totò/Alberto Sordi|Bud Spencer/Terence Hill|Benigni/Verdone|Fiorello/Checco Zalone|Sophia Loren/Monica Bellucci|" +
      "Mike Bongiorno/Pippo Baudo|Paolo Bonolis/Gerry Scotti|Amadeus/Carlo Conti|Leonardo da Vinci/Michelangelo|" +
      "Dante/Manzoni|Garibaldi/Napoleone|Galileo/Einstein|Marco Polo/Cristoforo Colombo|Giulio Cesare/Nerone|" +
      "Cleopatra/Nefertiti|Mozart/Beethoven|Picasso/Van Gogh|Michael Jackson/Elvis Presley|Shakira/Beyoncé|" +
      "Steve Jobs/Bill Gates|Federica Pellegrini/Tania Cagnotto|Mina/Ornella Vanoni|Måneskin/Pooh|Gandhi/Martin Luther King" }
];

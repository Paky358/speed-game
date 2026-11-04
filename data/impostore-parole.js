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
   Una categoria con spento: true (🌶️ Serata) non entra in «Tutte»:
   si gioca solo se l'host la sceglie.
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
      "Steve Jobs/Bill Gates|Federica Pellegrini/Tania Cagnotto|Mina/Ornella Vanoni|Måneskin/Pooh|Gandhi/Martin Luther King" },

  // ---- 4 nov 2026: 10 temi nuovi (518 coppie, scritte e controllate da aiutanti Sonnet il 26 ott, rilette da Claude) ----
  { id: "calcio", icona: "⚽", nome: "Calcio",
    coppie: "Fuorigioco/Fallo di mano|Calcio d'angolo/Rimessa laterale|Calcio di rigore/Punizione|Parastinchi/Calzettoni|" +
      "Portiere/Difensore|Attaccante/Centrocampista|VAR/Moviola|Serie A/Serie B|Champions League/Europa League|" +
      "Scudetto/Coppa Italia|Juventus/Lazio|Fiorentina/Atalanta|Sampdoria/Genoa|Real Madrid/Barcellona|" +
      "Manchester United/Liverpool|San Siro/Stadio Olimpico|Wembley/Camp Nou|Panchina/Tribuna|" +
      "Tiro in porta/Colpo di testa|Rovesciata/Colpo di tacco|Gol annullato/Autogol|Scarpini/Guanti da portiere|" +
      "Tempi supplementari/Recupero|Calciomercato/Ritiro|Curva/Gradinata|Bandiera/Striscione|" +
      "Telecronista/Commentatore tecnico|Domenica Sportiva/Quelli che il calcio|Fantacalcio/Totocalcio|Baggio/Pirlo|" +
      "Zidane/Ronaldinho|Buffon/Donnarumma|Maldini/Nesta|Gattuso/Materazzi|Ibrahimovic/Balotelli|" +
      "Catenaccio/Tiki-taka|Difesa a zona/Marcatura a uomo|Contropiede/Pressing|Spogliatoio/Sala stampa|" +
      "Retrocessione/Salvezza|Titolare/Riserva|Gazzetta dello Sport/Corriere dello Sport|DAZN/Sky|Campionato/Girone|" +
      "Traversa/Palo|Cross/Lancio lungo|Preparatore atletico/Massaggiatore|Raccattapalle/Steward|" +
      "Capocannoniere/Rigorista|Entrata a gamba tesa/Sgambetto|Mister/Direttore sportivo|FIFA/PES|Papera/Parata|" +
      "Dilettanti/Professionisti|Tripletta/Doppietta|Derby della Madonnina/Derby di Roma|Mourinho/Ancelotti|" +
      "Sacchi/Capello|Nazionale/Under 21" },

  { id: "estate", icona: "🏖️", nome: "Estate e vacanze",
    coppie: "Ombrellone/Gazebo|Sdraio/Lettino|Telo mare/Pareo|Crema solare/Doposole|Salvagente/Braccioli|Pinne/Boccaglio|" +
      "Racchettoni/Frisbee|Materassino/Ciambella gonfiabile|Lido/Spiaggia libera|Spritz/Mojito|Birra/Prosecco|" +
      "Abbronzatura/Scottatura|Moto d'acqua/Banana boat|Escursione/Gita fuori porta|Trekking/Rafting|" +
      "Sentiero/Strada sterrata|Barbecue/Spiedino|Amaca/Dondolo|Pensione completa/Mezza pensione|" +
      "Animazione/Mini club|Acquapark/Delfinario|Agriturismo/Masseria|Resort/Residence|Overbooking/Cancellazione|" +
      "Guida turistica/Audioguida|Selfie stick/Treppiede|Luglio/Agosto|Solstizio/Equinozio|Caldo/Afa|Cono/Coppetta|" +
      "Cucciolone/Magnum|Insalata di riso/Pasta fredda|Fritto misto/Spaghetti allo scoglio|Baia/Golfo|" +
      "Servizio in camera/Colazione a buffet|Trolley/Bagaglio a mano|Fuso orario/Jet lag|Centro estivo/Campo scuola|" +
      "Cinema all'aperto/Drive-in|Lungomare/Molo|Mercatino/Bancarella|Orata/Spigola|Canna da pesca/Retino|" +
      "Snorkeling/Apnea|Gargano/Salento|Rimini/Riccione|Jesolo/Lignano|Viareggio/Forte dei Marmi|" +
      "Cinque Terre/Portofino|Elba/Lampedusa|Maldive/Zanzibar|Ibiza/Mykonos|Gardaland/Mirabilandia|" +
      "Dolomiti/Gran Sasso|Cortina/Courmayeur|Bungalow/Chalet|Controesodo/Bollino nero|Telepass/Pedaggio|" +
      "Apericena/Aperitivo" },

  { id: "social", icona: "📱", nome: "Internet e social",
    coppie: "Facebook/Twitter|Snapchat/Pinterest|Spotify/Apple Music|Skype/Zoom|Gmail/Outlook|Storie/Reel|Post/Commento|" +
      "Chat di gruppo/Chat privata|Meme/GIF|Troll/Hater|Streamer/Gamer|Maps/Waze|Booking/Airbnb|Deliveroo/Glovo|" +
      "Foto profilo/Copertina|Nickname/Avatar|Disney+/Prime Video|Videoclip/Trailer|Codice sconto/Carta fedeltà|" +
      "Carrello/Lista dei desideri|Spedizione/Reso|PayPal/Postepay|Carta di credito/Bancomat|" +
      "Browser/Motore di ricerca|Chrome/Safari|Preferiti/Cronologia|Scaricare/Salvare|Link/Allegato|" +
      "Screenshot/Registrazione schermo|Spunta blu/Spunta grigia|Ultimo accesso/Visualizzato|Phishing/Virus|" +
      "Cloud/Backup|Sondaggio/Quiz|Sfida virale/Flash mob|E-book/Audiolibro|Fortnite/Minecraft|" +
      "Candy Crush/Angry Birds|Alexa/Siri|Modalità aereo/Non disturbare|Richiesta di amicizia/Invito|Hotspot/Router|" +
      "Fibra/ADSL|Tutorial/Recensione|Cliccare/Scrollare|Registrazione/Accesso|Popup/Banner" },

  { id: "anni90", icona: "📼", nome: "Anni '80, '90 e 2000",
    coppie: "Walkman/Discman|Tamagotchi/Furby|Cassetta/CD|Nokia/Motorola|SMS/MMS|Gettone/Scheda telefonica|" +
      "Bim Bum Bam/Albero Azzurro|Striscia la notizia/Le Iene|Uomini e donne/Amici|" +
      "Grande Fratello/L'isola dei famosi|Il Commissario Rex/Distretto di polizia|Beverly Hills 90210/Dawson's Creek|" +
      "Baywatch/Miami Vice|Medico in famiglia/I Cesaroni|Dragon Ball/Cavalieri dello zodiaco|Lady Oscar/Candy Candy|" +
      "Sailor Moon/Magica Doremì|Digimon/Yu-Gi-Oh!|I Simpson/South Park|Super Nintendo/Sega Mega Drive|" +
      "Tomb Raider/Resident Evil|Space Invaders/Pong|Polly Pocket/My Little Pony|Spice Girls/Backstreet Boys|" +
      "Nirvana/Pearl Jam|883/Articolo 31|Whitney Houston/Celine Dion|Britney Spears/Christina Aguilera|" +
      "Eminem/50 Cent|Macarena/Lambada|Lira/Euro|Fax/Segreteria telefonica|Cordless/Telefonino|Napster/eMule|" +
      "Windows 95/Windows XP|Modem 56k/Chiavetta internet|Diddl/Hello Kitty|Smemoranda/Comix|Fiat Panda/Fiat Uno|" +
      "Gormiti/Power Rangers|Figurine/Tazos|Atari/Commodore 64|MTV/Deejay Television|Radio Deejay/Radio Italia|" +
      "Titanic/Pearl Harbor|Jurassic Park/Independence Day|Ritorno al futuro/E.T.|Zelig/Colorado|Big Babol/Brooklyn|" +
      "Paninaro/Metallaro|Invicta/Eastpak|Scaldamuscoli/Fascia per capelli" },

  { id: "storia", icona: "🏛️", nome: "Storia e miti",
    coppie: "Zeus/Poseidone|Atena/Artemide|Apollo/Dioniso|Achille/Ulisse|Ettore/Paride|Ciclope/Minotauro|Pegaso/Centauro|" +
      "Icaro/Prometeo|Cavallo di Troia/Vaso di Pandora|Romolo/Enea|Augusto/Costantino|Spartaco/Annibale|" +
      "Gladiatore/Legionario|Centurione/Senatore|Acquedotto/Anfiteatro|Toga/Tunica|Faraone/Sfinge|Piramide/Obelisco|" +
      "Tutankhamon/Ramses|Geroglifici/Papiro|Spartani/Ateniesi|Partenone/Acropoli|Socrate/Platone|" +
      "Alessandro Magno/Attila|Carlo Magno/Re Artù|Lorenzo il Magnifico/Machiavelli|Spada/Scudo|Catapulta/Balestra|" +
      "Drago/Unicorno|Normanni/Longobardi|Maya/Aztechi|Etruschi/Fenici|Pompei/Ercolano|Magellano/Vasco da Gama|" +
      "Odino/Thor|Valchiria/Amazzone|Tavola rotonda/Santo Graal|Aristotele/Archimede|Pitagora/Euclide|" +
      "Maria Antonietta/Luigi XVI|Rivoluzione francese/Rivoluzione industriale|Bastiglia/Versailles|" +
      "Vittorio Emanuele II/Cavour|Alessandro Volta/Guglielmo Marconi|Medioevo/Rinascimento|Mammut/Dinosauro|" +
      "Tirannosauro/Velociraptor|Clava/Ascia|Crociato/Templare|Sultano/Califfo|Teseo/Perseo|Elena di Troia/Penelope|" +
      "Cerbero/Idra|Afrodite/Ares|Ermes/Ade|Anubi/Ra|Mongoli/Unni|Zar/Kaiser|Alchimista/Astrologo|Atlantide/Eldorado|" +
      "Foro romano/Pantheon|Mosaico/Affresco|Menestrello/Giullare|Conte/Barone|Caligola/Marco Aurelio" },

  { id: "eroi", icona: "🦸", nome: "Supereroi, fumetti e videogiochi",
    coppie: "Capitan America/Black Panther|Wonder Woman/Supergirl|Wolverine/Deadpool|Thanos/Loki|Venom/Dottor Octopus|" +
      "X-Men/Avengers|Bowser/Donkey Kong|Principessa Peach/Zelda|Ash/Misty|Crash Bandicoot/Spyro|" +
      "GTA/Red Dead Redemption|Goku/Vegeta|Lupin III/Detective Conan|Dylan Dog/Diabolik|Tex Willer/Lucky Luke|" +
      "Mortal Kombat/Street Fighter|Guitar Hero/Just Dance|Joker/Lex Luthor|Luke Skywalker/Han Solo|Jedi/Sith|" +
      "Optimus Prime/Megatron|Goldrake/Mazinga|Capitan Harlock/Jeeg robot|Ghostbusters/Men in Black|Yoshi/Toad|" +
      "Harley Quinn/Catwoman|Gotham/Metropolis|Star Wars/Star Trek|Subway Surfers/Temple Run|" +
      "Prince of Persia/Assassin's Creed|Yoda/Chewbacca|Gandalf/Dumbledore|Frodo/Gollum|Terminator/RoboCop|" +
      "Rocky/Rambo|Alien/Predator|Doctor Strange/Black Widow|Wii/Nintendo DS|Paperinik/Superpippo|He-Man/Skeletor|" +
      "Lara Croft/Indiana Jones" },

  { id: "lavoro", icona: "💼", nome: "Lavoro e soldi",
    coppie: "Bonifico/Assegno|Mutuo/Prestito|Scontrino/Fattura|Risparmio/Investimento|Pensione/Liquidazione|Tasse/Bollette|" +
      "Banconota/Moneta|Conto corrente/Libretto di risparmio|Affitto/Condominio|Busta paga/Contratto|Aumento/Bonus|" +
      "Licenziamento/Dimissioni|Sciopero/Manifestazione|Straordinari/Turni|Part-time/Tempo pieno|Stage/Apprendistato|" +
      "Datore di lavoro/Dipendente|Direttore/Caporeparto|Fabbrica/Laboratorio|Cantiere/Officina|Cliente/Fornitore|" +
      "Saldi/Sconto|Commercialista/Notaio|Codice fiscale/Tessera sanitaria|Azioni in borsa/Bitcoin|Paghetta/Mancia|" +
      "Debito/Credito|Caparra/Rata|Prelievo/Versamento|Cassa integrazione/Disoccupazione|Eredità/Donazione|" +
      "Permesso/Congedo|Maternità/Paternità|Operaio/Impiegato|Imprenditore/Libero professionista|" +
      "Presentazione/Relazione|Excel/Word|Start-up/Multinazionale|Brevetto/Marchio|Volantino/Manifesto|" +
      "Socio/Amministratore|Preventivo/Ordine|Budget/Bilancio|Inflazione/Crisi|Weekend/Vacanza|" +
      "Cancelleria/Ferramenta|Agenzia interinale/Centro per l'impiego|Inquilino/Proprietario|Canone Rai/Bollo auto|" +
      "Tuta da lavoro/Divisa|Vetrina/Insegna|Interessi/Commissioni|Conto in rosso/Fido|Contanti/Pagamento rateale|" +
      "Lavoro/Hobby" },

  { id: "musica", icona: "🎵", nome: "Musica e cantanti",
    coppie: "Pop/Rap|Jazz/Blues|Techno/House|Country/Folk|Reggaeton/Bachata|Hip hop/Trap|Ritornello/Strofa|Assolo/Coro|" +
      "Duetto/Trio|Spartito/Pentagramma|Orchestra/Banda|Tormentone/Ballata|Disco d'oro/Disco di platino|" +
      "Playlist/Album|Singolo/Raccolta|Backstage/Palco|Autografo/Dedica|Giuria/Televoto|Cantautore/Interprete|" +
      "Boy band/Girl band|Beatles/Rolling Stones|Queen/Pink Floyd|Elton John/Freddie Mercury|Adele/Rihanna|" +
      "Bob Marley/Bob Dylan|Frank Sinatra/Dean Martin|Justin Bieber/Ed Sheeran|Taylor Swift/Katy Perry|Coldplay/U2|" +
      "ABBA/Bee Gees|Lucio Dalla/Lucio Battisti|Fabrizio De André/Francesco Guccini|Renato Zero/Claudio Baglioni|" +
      "Max Pezzali/Biagio Antonacci|Fedez/J-Ax|Elodie/Emma Marrone|Mahmood/Blanco|Andrea Bocelli/Luciano Pavarotti|" +
      "Adriano Celentano/Domenico Modugno|Rita Pavone/Patty Pravo|Antonello Venditti/Francesco De Gregori|" +
      "Pino Daniele/Edoardo Bennato|Negramaro/Modà|Serenata/Ninna nanna|Inno/Marcia|Colonna sonora/Sigla|" +
      "Live/Playback|Marco Mengoni/Francesco Gabbani|Achille Lauro/Sfera Ebbasta" },

  { id: "quotidiano", icona: "🏡", nome: "Vita di tutti i giorni",
    coppie: "Vicino di casa/Coinquilino|Pianerottolo/Cortile|Raccolta differenziata/Discarica|" +
      "Cassonetto/Sacchetto dell'umido|Raccomandata/Telegramma|Strisce blu/Strisce gialle|" +
      "Divieto di sosta/Zona disco|Vigile/Ausiliario del traffico|Rotatoria/Incrocio|Carro attrezzi/Carrozziere|" +
      "Revisione/Tagliando|Carie/Tartaro|Analisi del sangue/Visita medica|Medico di base/Guardia medica|" +
      "Detersivo/Ammorbidente|Pranzo della domenica/Cena del sabato|Cugini/Cognati|Suocera/Nuora|" +
      "Passeggiata/Giro in bici|Fruttivendolo/Pescivendolo|Tacchi sul soffitto/Trapano del vicino|" +
      "Cane che abbaia/Musica a tutto volume|Ora di punta/Esodo estivo|Lavori in corso/Strada chiusa|" +
      "Doppia fila/Passo carrabile|Pendolare/Turista|Sciopero dei treni/Ritardo dell'autobus|" +
      "Francobollo/Marca da bollo|Sportello/Bancone|Caldaia/Scaldabagno|Rubinetto che gocciola/Tubo che perde|" +
      "Salvavita/Contatore|Zanzariera/Zampirone|Ricetta rossa/Certificato medico|" +
      "Cambio di stagione/Pulizie di primavera|Ricevuta/Garanzia|Siepe/Recinzione|Portone/Cancello|" +
      "Zona a traffico limitato/Isola pedonale|Cartella esattoriale/Sollecito di pagamento|" +
      "Spese condominiali/Spese di riscaldamento|Ora legale/Ora solare|Weekend lungo/Settimana bianca|" +
      "Fila alla posta/Fila in banca|Box auto/Posto auto|Mal di schiena/Torcicollo" },

  { id: "serata", icona: "🌶️", nome: "Serata", spento: true,   // 🌶️ spento di partenza: entra solo se l'host lo sceglie tra le categorie
    coppie: "Primo appuntamento/Appuntamento al buio|Gelosia/Invidia|Tinder/Meetic|Shot/Cocktail|" +
      "Addio al celibato/Addio al nubilato|San Valentino/Festa della donna|Cena romantica/Cena tra amici|" +
      "Commedia romantica/Film horror|Fidanzato/Convivente|Single/Separato|Colpo di fulmine/Sbandata|" +
      "Lite di coppia/Pace fatta|Tradimento/Bugia|Ballo lento/Ballo di gruppo|DJ/Presentatore|Minigonna/Pantaloncini|" +
      "Dopobarba/Gel per capelli|Smoking/Frac|Anello di fidanzamento/Fede nuziale|Luna di miele/Weekend romantico|" +
      "Testimone/Damigella|Lancio del bouquet/Taglio della torta|Enoteca/Birreria|Pub/Wine bar|Timido/Sfacciato|" +
      "Oroscopo/Tarocchi|Numero di telefono/Profilo social|Drink offerto/Cena offerta|Alla romana/Offro io|" +
      "Limoncello/Grappa|Vodka/Tequila|Gin tonic/Rum e cola|Piano bar/Serata cabaret|" +
      "Amore a prima vista/Amore a distanza|Gioco della bottiglia/Obbligo o verità|Cena con delitto/Serata a quiz|" +
      "Occhi dolci/Sorrisetto|Arrossire/Sudare freddo|Playlist romantica/Canzone dedicata|Due di picche/Ghosting|" +
      "Mazzo di rose/Scatola di cioccolatini|Sbronza/Postumi|Fuga d'amore/Nozze segrete|Ex fidanzato/Vecchia fiamma|" +
      "Corteggiatore/Ammiratore segreto" }
];

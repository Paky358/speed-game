/* =========================================================
   «Il Prezzo è Giusto!» — LE FOTO VERE dei prodotti e dei pezzi delle vetrine (da Wikimedia Commons, foto libere).
   id del prodotto (o "idVetrina#n" per il pezzo n di una vetrina) → "percorso su Commons|larghezza dell'originale".
   Il gioco le chiede a upload.wikimedia.org nelle misure standard (330 e 500 px): vedi urlFoto in js/games/prezzo-scena.js.
   Scelte il 22-23 ott 2026: per ogni prodotto fino a 6 foto candidate (pagine di Wikipedia e ricerca su Commons), scelta
   a occhio e ricontrollata. Regola: la foto mostra l'oggetto com'è, senza il prezzo scritto. Chi non ha la foto resta con l'emoji.
   Le foto mandate dal proprietario stanno in carte/prezzo/<id>.jpg e qui si scrivono "loc:carte/prezzo/<id>.jpg".
   ========================================================= */
window.SG_PREZZO_FOTO = {
  "a1-nutella-750": "9/9b/Nutella_ak.jpg|1514",   // Nutella, 750 g
  "a1-spaghetti-barilla": "9/92/Spaghettoni.jpg|2304",   // Spaghetti Barilla n.5, 500 g
  "a1-latte-fresco": "c/c4/Plastic_bottle_of_milk.jpg|746",   // Latte fresco intero, 1 litro
  "a1-uova-6": "b/b1/Carton_of_eggs.jpg|1200",   // Sei uova grandi
  "a1-olio-evo": "f/f1/Bottle_of_Extra_Virgin_Olive_Oil.jpg|526",   // Olio extravergine, 1 litro
  "a1-passata-mutti": "9/94/Tomato_passata.jpg|930",   // Passata di pomodoro, 700 g
  "a1-mozzarella-bufala": "1/1f/Mozzarella_di_Bufala_Campana_(2010)_-_by_RaBoe.jpg|1111",   // Mozzarella di bufala, 250 g
  "a1-coca-cola": "a/aa/CocaColaBottle_background_free.png|795",   // Coca-Cola, 1,5 litri
  "a1-acqua-6": "c/ce/Water_Bottle_(51308317077).jpg|1113",   // Acqua naturale, 6 bottiglie
  "a1-banane": "a/a9/Bunch_of_bananas_on_sale.jpg|4165",   // Banane, 1 kg
  "a1-zucchero": "3/3c/Sucre_blanc_cassonade_complet_rapadura.jpg|1149",   // Zucchero bianco, 1 kg
  "a1-farina": "0/09/Flours.jpg|4751",   // Farina 00, 1 kg
  "a1-sale-grosso": "b/b8/Sea_Salt_-_Macro_(51840172425).jpg|5184",   // Sale grosso, 1 kg
  "a1-peroni-66": "3/30/Bottle_Peroni_Nastro_Azzurro.jpg|1182",   // Birra Peroni, 66 cl
  "a1-tonno-rio": "6/6f/Seachicken_mild_hagoromofoods002.jpg|3296",   // Tonno Rio Mare, 3 scatolette
  "a1-tortellini": "d/d5/Tortellini.jpg|2150",   // Tortellini freschi, 250 g
  "a1-crudo-parma": "2/21/Prosciutto_di_Parma,_Tagliere,_Italia.jpg|1800",   // Prosciutto di Parma, 100 g
  "a1-mortadella": "1/1e/Mortadella_tagliata.jpg|801",   // Mortadella Bologna, 100 g
  "a1-bresaola": "c/cb/Bresaola-Valt-IGP.jpg|591",   // Bresaola, 100 g
  "a1-basilico": "6/6e/Basil_plant_in_a_pot_02.jpg|2736",   // Basilico in vaso
  "a1-tavernello": "0/06/Tavernello_classico.png|450",   // Vino in brick, 1 litro
  "a1-aceto-modena": "3/33/Aceto_Balsamico.jpg|3264",   // Aceto balsamico, 250 ml
  "a1-cotechino": "5/58/Cotechino-Intero.jpg|1399",   // Cotechino, 500 g
  "a1-mele": "0/0f/Golden_Delicious_apples.jpg|6000",   // Mele Golden, 1 kg
  "a1-patatine": "6/69/Potato-Chips.jpg|3072",   // Patatine San Carlo, 180 g
  "a1-magnum": "e/e1/Magnum_Double_Chocolate_Ice-cream_Bar_(7629011916).jpg|2448",   // Magnum Classic, 4 gelati
  "a1-pollo-intero": "5/57/Chickens_in_market.jpg|2860",   // Pollo intero, 1,5 kg
  "a1-parmigiano-kg": "e/e9/Parmigiano-Reggiano_at_Eataly_in_Stockholm.jpg|2448",   // Parmigiano Reggiano, 1 kg
  "a1-pecorino-kg": "e/ee/Pecorino_romano_cheese.jpg|1280",   // Pecorino Romano, 1 kg
  "a1-macinato-kg": "d/d1/Hackfleisch-1.jpg|2905",   // Carne macinata, 1 kg
  "a1-fiorentina-kg": "8/8c/Bistecca_alla_fiorentina.jpg|1280",   // Bistecca alla fiorentina, 1 kg
  "a1-treccia-bufala": "d/d5/Mozzarella_di_bufala2.jpg|4160",   // Treccia di bufala, 1 kg
  "a1-pistacchi-bronte": "b/b5/Pistachio_vera.jpg|1709",   // Pistacchi di Bronte, 1 kg
  "a1-ferrero-30": "b/b5/Ferrero_Rocher_8pcs_box_20150118.jpg|3920",   // Ferrero Rocher, 30 praline
  "a1-moet": "4/4a/Moët_et_Chandon.jpg|3089",   // Champagne Moët & Chandon
  "a1-ferrari-brut": "5/54/Example_of_TrentoDOC_Label.JPG|2175",   // Spumante Ferrari Brut, 75 cl
  "a1-aperol": "b/b3/Aperol_bottle.JPG|1657",   // Aperol, 1 litro
  "a1-brunello": "7/70/Brunello_di_Montalcino_-_Biondi_Santi_-_Bottle.jpg|1536",   // Brunello di Montalcino, 75 cl
  "a1-montenegro": "f/ff/Amaro_Montenegro.jpg|2304",   // Amaro Montenegro, 70 cl
  "a1-cassa-peroni": "4/41/Bierkasten_001.jpg|1024",   // Cassa di 24 birre Peroni
  "a1-carbonara-4": "3/33/Espaguetis_carbonara.jpg|2048",   // Spesa per la carbonara per 4
  "a1-detersivo": "c/c8/HK_SKD_TKO_Po_Yap_Road_將軍澳廣場_Tseung_Kwan_O_Plaza_K-mart_fresh_food_indoor_market_shop_Kai_Bo_Food_Supermarket_Wayway_Laundry_Liquid_plastic_bottle_July_2021_SS2_02.jpg|3096",   // Detersivo per lavatrice
  "a1-prosciutto-intero": "1/15/Prosciutto_di_Parma,_ham_producing.jpg|1704",   // Prosciutto di Parma intero
  "a1-caffe-milano": "3/39/Cup_of_espresso_02.jpg|5472",   // Caffè al banco
  "a1-cappuccino": "7/70/Cappuccino_in_original.jpg|6000",   // Cappuccino al banco
  "a1-cornetto": "c/cd/Cornetto_marmellata.jpg|10944",   // Cornetto alla marmellata
  "a1-spritz-venezia": "a/a2/Aperol_spritz_-_Bistro_Don_Giovanni_-_Sarah_Stierch_2018_04.jpg|3024",   // Spritz al bacaro
  "a1-spritz-milano": "2/24/Aperol_Aperitivo_Aperitif_02.jpg|4032",   // Spritz all'aperitivo
  "a1-margherita-napoli": "d/d4/Margherita_Originale.JPG|2048",   // Pizza margherita
  "a1-suppli": "b/bb/Supplì_al_telefono.jpg|1000",   // Supplì al telefono
  "a1-arancina": "e/ee/Arancini_002.jpg|2288",   // Arancina al ragù
  "a1-piadina": "0/01/Piadina_romagnola.jpg|1280",   // Piadina crudo e squacquerone
  "a1-cono-gelato": "c/c8/Icecream_Cone.jpg|790",   // Cono con due gusti
  "a1-lampredotto": "1/1c/Lampredotto_sandwich.JPG|2648",   // Panino col lampredotto
  "a1-focaccia": "6/6f/Focaccia_on_sale_in_Genoa.JPG|5184",   // Un pezzo di focaccia
  "a1-cannolo": "a/ad/Cannoli_siciliani_al_Caffè_Impero,_ad_Alcamo.jpg|2675",   // Cannolo siciliano
  "a1-sfogliatella": "0/0f/Sfogliatella_riccia_napoletana.jpg|3648",   // Sfogliatella riccia
  "a1-spremuta": "0/05/Orangejuice.jpg|2670",   // Spremuta d'arancia
  "a1-granita-brioche": "e/e4/Granita_brioche_cornetto.jpg|1600",   // Granita con la brioche
  "a1-birra-media": "e/e4/Lager.jpg|1704",   // Birra media alla spina
  "a1-calice-vino": "c/c0/Red_Wine_Glass.jpg|428",   // Calice di vino della casa
  "a1-acqua-ristorante": "c/ce/Water_Bottle_(51308317077).jpg|1113",   // Acqua al ristorante, 1 litro
  "a1-tiramisu": "4/42/Dolce_Tiramisù_monoporzione.jpg|4000",   // Tiramisù
  "a1-big-mac": "e/ef/Big_Mac_meal_McDonald's_(Elizabeth_Street)_Melbourne_CBD_April_23,_2025_202504231157_IMG_3302.jpg|4032",   // Menù Big Mac medio
  "a1-kebab": "a/aa/Döner_Kebab,_Berlin,_2010_(01).jpg|1445",   // Panino kebab
  "a1-cuoppo": "a/a2/Italy-Italia_Italian_Food_Fritto_misto_alla_piemontese_PxT.JPG|1280",   // Cuoppo di frittura di pesce
  "a1-porchetta": "2/2f/Panino_con_porchetta_di_Ariccia.jpg|3648",   // Panino con la porchetta
  "a1-tramezzino": "4/46/Tramezzino_al_tonno.jpg|3092",   // Tramezzino tonno e uova
  "a1-shakerato": "2/26/Shakerato_in_a_martini_glass.jpg|2448",   // Caffè shakerato
  "a1-bombolone": "e/e4/Bombolone_impiattato.jpg|3490",   // Bombolone alla crema
  "a1-arrosticini": "4/4a/Arrosticini_abruzzesi_01.jpg|4000",   // Dieci arrosticini
  "a1-negroni": "4/4d/Negroni_(cocktail).jpg|4032",   // Negroni
  "a1-colazione-4": "7/75/Breakfast_at_the_Black_Bear_Diner.jpg|2592",   // Colazione per quattro
  "a1-orecchiette": "a/a5/Orecchiette_con_cime_di_rapa_-_The_Grill,_Grossi_Florentino_AUD32_main_(4800088661).jpg|2048",   // Orecchiette alle cime di rapa
  "a1-carbonara-roma": "5/50/Spaghetti_alla_Carbonara_2.jpg|3264",   // Spaghetti alla carbonara
  "a1-tagliatelle": "1/1a/Tagliatelle_al_ragù_03.jpg|3264",   // Tagliatelle al ragù
  "a1-menu-pranzo": "a/a5/Italian_trattoria_sign.jpg|618",   // Menù del giorno a pranzo
  "a1-pollo-spiedo": "d/d9/Max's_Roasted_Chicken_-_Evan_Swigart.jpg|2033",   // Pollo allo spiedo con patate
  "a1-hamburger": "4/4b/Bacon_cheeseburger,_French_fries,_and_dill_pickle_-_Massachusetts.jpg|2591",   // Hamburger con patatine
  "a1-frittura-mare": "7/77/Frittura_di_pesce_tipica_delle_coste_Toscane.jpg|4624",   // Frittura di calamari e gamberi
  "a1-vongole": "7/70/Spaghetti_alle_vongole.jpg|1600",   // Spaghetti alle vongole
  "a1-tagliere": "a/a1/Tagliere_toscano.jpg|4194",   // Tagliere per due
  "a1-gelato-kg": "3/3a/Delicious_Gelato_on_display.jpg|3179",   // Vaschetta di gelato, 1 kg
  "a1-cacciucco": "5/57/Cacciucco_alla_Livornese_19_34_55_234000.jpeg|3024",   // Cacciucco
  "a1-sushi-ayce": "6/60/Sushi_platter.jpg|1614",   // Sushi «mangia quanto vuoi»
  "a1-cotoletta": "3/34/Cotoletta_alla_milanese_in_milano.jpg|3024",   // Cotoletta alla milanese
  "a1-brunch": "2/25/Cafe_Brunch_Budapest_omelette.jpg|3000",   // Brunch della domenica
  "a1-agriturismo": "f/f7/Acquanegra_sul_Chiese-Oasi_Le_Bine.JPG|3770",   // Pranzo in agriturismo
  "a1-torta-compleanno": "e/e3/Torta_di_compleanno_-_Birthday_cakes_of_Italy_-_fruit_Meringue_Whipped_cream_from_traditional_pastry_of_Milan.jpg|3241",   // Torta di compleanno per 12
  "a1-pizzeria-4": "9/9f/Pizzas_margherita_in_Baia_(2010)_by_RaBoe.jpg|1200",   // Pizza e birra per quattro
  "a1-fiorentina-ristorante": "b/b2/Bistecca_alla_Fiorentina.jpg|1136",   // Fiorentina al ristorante
  "a1-crazy-pizza": "5/57/Neapolitan_pizza_at_Trappica_(48701940197).jpg|3024",   // Margherita da Briatore
  "a1-capodanno": "1/11/Hanabi_in_Adachi-ku1.jpg|2468",   // Cenone di Capodanno
  "a1-cena-pesce-due": "8/82/Plateau_de_fruits_de_mer_001.jpg|2048",   // Cena di pesce per due
  "a1-francescana": "a/a1/Entree_at_Osteria_Francescana_(15932125420).jpg|2448",   // Menù di Massimo Bottura
  "a1-bagno-venezia": "c/c1/Public_toilet_entrance_In_modern.jpg|2268",   // Bagno pubblico
  "a1-asciugatrice": "1/13/American_Dryer_Corp._laundromat_dryer.JPG|2272",   // Asciugatrice a gettone
  "a1-metro-milano": "a/ad/MetroCentrale_macchine_biglietti.jpg|1024",   // Biglietto della metro
  "a1-chiave": "3/3c/Vari_tipi_di_chiavi.JPG|2816",   // Copia di una chiave
  "a1-camicia": "7/7d/Button_down_dress_shirts_for_men.jpg|1200",   // Camicia lavata e stirata
  "a1-lavatrice-gettone": "9/94/Laundromat_Washing_Machines_&_Laundry_Equipment.jpg|4624",   // Lavatrice a gettone, 8 kg
  "a1-dog-sitter": "5/58/Dog_walking_woman.jpg|2115",   // Passeggiata col dog sitter
  "a1-orlo": "8/8f/Hemmed_jeans.png|1500",   // Orlo ai pantaloni
  "a1-cappotto": "2/26/Drycleanmachine.JPG|1952",   // Lavaggio di un cappotto
  "a1-ripetizioni": "7/71/Jan_Lievens_(Dutch_-_Prince_Charles_Louis_of_the_Palatinate_with_his_Tutor_Wolrad_von_Plessen_in_Historical_Dress_-_Google_Art_Project.jpg|3611",   // Un'ora di ripetizioni
  "a1-pacco-giu": "1/16/TV_set_(46_inch)_in_self-customized_box_for_sending_via_parcel_service_N.3.jpg|3024",   // Il pacco da giù, 20 kg
  "a1-pacco-5kg": "2/2b/Inside_USAG_Italy's_Summer_Hire_Program_(6758706).jpg|4032",   // Spedire un pacco di 5 kg
  "a1-barbiere": "4/4d/Barber_cutting_hair_with_comb._Back_view_of_man_in_barber_shop.jpg|6016",   // Taglio dal barbiere
  "a1-carta-identita": "a/af/CIE_(fronte).jpg|1014",   // Carta d'identità elettronica
  "a1-piumone": "b/b2/La_cama_deshecha_(2724466831).jpg|3072",   // Lavaggio del piumone
  "a1-ceretta": "2/2f/Waxing_Supplies.jpg|4000",   // Ceretta alle gambe
  "a1-manicure": "d/df/Професионална_Ноктопластика.JPG|1530",   // Manicure semipermanente
  "a1-taglio-piega": "0/09/Hairdresser's_salon_in_Brastad_5.jpg|2938",   // Taglio e piega
  "a1-abbonamento-mezzi": "3/37/Tram_in_Piazza_Duca_d'Aosta,_Milan.jpg|3825",   // Abbonamento mensile ai mezzi
  "a1-toelettatura": "0/06/Grooming_Poodle.jpg|2592",   // Toelettatura del cane
  "a1-lezione-guida": "f/f0/The_car_of_the_driving_school_in_Tomaszów_Mazowiecki,_Poland.jpg|2560",   // Una lezione di guida
  "a1-veterinario": "7/70/Stethoscope_examination_of_an_orange_cat_in_Newark,_New_Jersey.jpg|4284",   // Visita dal veterinario
  "a1-colore": "1/14/Hair_coloring_at_hair_salon_(51213255633).jpg|1080",   // Colore dal parrucchiere
  "a1-pulizia-denti": "5/50/U.S._Air_Force_Medical_Dental_Technician_Cleaning_March_2023.jpg|7858",   // Pulizia dei denti
  "a1-tatuaggio": "c/ce/Aaira_Tattoo_on_Wrist.jpg|3024",   // Un piccolo tatuaggio
  "a1-idraulico": "f/fa/Plumber_at_work.jpg|2272",   // Idraulico a casa
  "a1-accordatura": "c/cb/Piano_Tuning.jpg|900",   // Accordare il pianoforte
  "a1-spazzacamino": "a/ab/Chimneysweep.png|1480",   // Lo spazzacamino
  "a1-divano": "4/46/A_brown_sofa_(2005-03-03).jpg|2048",   // Pulizia del divano
  "a1-passaporto": "0/09/Passaportoitaliano2006.jpg|1525",   // Passaporto nuovo
  "a1-otturazione": "e/e4/US_Air_Force_(USAF)_Captain_(CAPT)_Michael_Suhler,_Doctor,_Advanced_General_Dentist,_31st_Dental_Squadron,_performs_Amalgam_build-up_on_the_lower_right_tooth_of_USAF_STAFF_Sergeant_-_DPLA_-_0cbbec59afb30ce4bbc3569de4470080.jpeg|2000",   // Otturazione di un dente
  "a1-lavatrice-rotta": "e/ec/LG_드럼세탁기와_식기세척기,_영국서_물사용_효율_최우수_제품_수상.jpg|770",   // Riparare la lavatrice
  "a1-animatore": "6/69/Kids_Party_Entertainer.jpg|1280",   // Animatore per una festa
  "a1-pensione-cane": "e/ef/Dog_kennel_Mason.jpg|768",   // Pensione per il cane, 7 notti
  "a1-abito-sposa": "3/36/Bride_north_america.jpg|426",   // Lavare l'abito da sposa
  "a1-devitalizzazione": "b/bb/Dental_root_canal_treatment_process.jpg|2200",   // Devitalizzazione di un dente
  "a1-imbianchino": "c/c7/House_painters_in_Capri_(cropped).jpg|1896",   // Imbiancare una stanza
  "a1-condizionatore": "8/8b/MITSUBISHI_ELECTRIC_WINDOW_TYPE_AIR_CONDITIONER_OUTDOOR_UNIT.jpg|7082",   // Montare un condizionatore
  "a1-asilo-nido": "5/5c/Asilo_Fontevivo_(5)_sez_blu_interno.jpg|2816",   // Un mese di asilo nido
  "a1-laser-occhi": "7/73/Lasik_eye_surgery.jpg|4592",   // Laser agli occhi
  "a1-carbone-befana": "3/3c/Befana1.jpg|954",   // Carbone dolce della Befana
  "a1-vin-brule": "e/e6/Glühwein-Zubereitung.JPG|2880",   // Vin brûlé
  "a1-mimosa": "8/82/Acacia_dealbata-1.jpg|2448",   // Mazzetto di mimosa
  "a1-struffoli": "b/bc/Struffoli_Napoletani.jpg|3264",   // Struffoli, vassoio da 500 g
  "a1-zampone": "4/49/Zampone.jpg|1188",   // Zampone, 1 kg
  "a1-confetti": "0/0f/Sulmona_88.jpg|1134",   // Confetti alla mandorla, 1 kg
  "a1-chiacchiere": "f/f9/Chiacchiere.jpg|2514",   // Chiacchiere, 1 kg
  "a1-pastiera": "0/0f/Pastiera_napoletana.jpg|1280",   // Pastiera napoletana, 1 kg
  "a1-torrone": "0/00/Torrone_di_mandorle.jpg|3852",   // Torrone, 1 kg
  "a1-corona-alloro": "3/30/Corona_alloro_laurea.JPG|6000",   // Corona d'alloro
  "a1-cassata": "4/40/Cassatasiciliana.jpg|1536",   // Cassata siciliana, 1 kg
  "a1-colomba": "e/ee/Colomba_pasquale,_edizione_2013_-_ND0_4662_(8564331585).jpg|5184",   // Colomba artigianale, 1 kg
  "a1-panettone-artigianale": "1/1e/Panettone_-_Nicolettone_2017_-_IMG_7092_(31752504105).jpg|5472",   // Panettone artigianale, 1 kg
  "a1-rose-rosse": "c/c7/Bouquet_of_red_roses.jpg|3468",   // Dodici rose rosse
  "a1-uovo-pasqua": "4/4e/Chocolate_Easter_eggs_in_foil,_Canada,_2026-02-27_01.jpg|5019",   // Uovo di Pasqua artigianale
  "a1-pranzo-nozze": "5/55/Elegant_banquet_setup_for_wedding_reception_with_beautifully_arranged_tables_in_soft_lighting.jpg|4016",   // Pranzo di nozze, a persona
  "a1-caffe-anno": "4/41/Espresso_BW_1.jpg|3872",   // Un caffè al giorno per un anno
  "a1-comunione": "b/b5/Elsőáldozó_fortepan_40689.jpg|5168",   // Pranzo della Prima Comunione
  "a1-matrimonio": "b/ba/Amalfi_-_7332.jpg|4104",   // Un matrimonio in Italia
  "a2-presine": "e/ea/Pot_holder_(AM_2002.64.8).jpg|1681",   // Presine da cucina, 2
  "a2-mollette": "2/23/Plastic_clothespins.jpg|2400",   // Mollette per il bucato, 24
  "a2-barattolo-fido": "7/7e/PreservedFood1.jpg|5238",   // Barattolo Fido, 1 litro
  "a2-lampadina-led": "d/d6/LED-E27-Light-Bulb-1134.jpg|2592",   // Lampadina LED
  "a2-accendigas": "9/97/Milk_on_the_stove.jpg|4000",   // Accendigas elettronico
  "a2-sturalavandini": "2/2b/Plopper.jpg|1536",   // Sturalavandini
  "a2-battipanni": "c/c3/Carpet_beater.jpg|1552",   // Battipanni in vimini
  "a2-cavatappi": "8/8f/Kellnermesser_p1000026.jpg|1902",   // Cavatappi da cameriere
  "a2-grattugia": "a/ae/Küchenreibe_1.jpg|3006",   // Grattugia a quattro facce
  "a2-scopa-saggina": "b/b0/BroomsforSale.jpg|948",   // Scopa di saggina
  "a2-colapasta": "0/0e/Kevgir.JPG|863",   // Colapasta in acciaio
  "a2-zerbino": "d/db/Zerbino_format.jpg|2187",   // Zerbino con la scritta
  "a2-tagliere": "9/91/MAIGO-Schneidebrett_\"Gerd\".jpg|1560",   // Tagliere di legno
  "a2-blahaj": "a/aa/NärCon_2026_-_CakeJumper.jpg|2048",   // Squalo di peluche IKEA
  "a2-stendino": "8/84/Clotheshorse.jpg|1094",   // Stendibiancheria ad ali
  "a2-padella": "5/58/Aluminium_koekenpan_met_lange_zwart_gelakte_steel,_objectnr_80330.JPG|2048",   // Padella antiaderente, 28 cm
  "a2-moka-3": "4/4f/Moka_Express_Bialetti.png|1126",   // Moka Bialetti, 3 tazze
  "a2-tostapane": "8/8f/Toaster.jpg|1938",   // Tostapane da due fette
  "a2-ventilatore": "1/1a/Hatari_18_inch_fan.jpg|3024",   // Ventilatore a piantana
  "a2-servizio-piatti": "3/3f/Dish_and_Knife.jpg|1024",   // Servizio di piatti, 18 pezzi
  "a2-lenzuola": "3/3d/Bettwaesche.jpg|2960",   // Completo lenzuola matrimoniale
  "a2-billy": "d/dd/IKEA_Billy_bookshelf_(80x106_cm_birch_veneer).jpg|2592",   // Libreria IKEA Billy
  "a2-poang": "a/a2/POÄNG_in_“Knisa_Beige”_(45144076894).jpg|2253",   // Poltrona IKEA Poäng
  "a2-asse-stiro": "5/58/Ironing_(cropped).jpg|4091",   // Asse da stiro
  "a2-albero-natale": "d/d5/A1_Christmas_Tree_photo.jpg|2676",   // Albero di Natale finto
  "a2-piscina-gonfiabile": "c/c1/An_inflatable_swimming_pool_invites_relaxation_in_a_backyard_setting,_with_a_blue_hose_artistically_draped_over_the_edge.jpg|4016",   // Piscina gonfiabile da giardino
  "a2-microonde": "0/08/Panasonic_NN-SD69LS_20220410.jpg|3024",   // Forno a microonde
  "a2-tosaerba": "e/ee/Electric_lawn_mower_with_a_cord.jpg|2592",   // Tosaerba elettrico
  "a2-macchina-cucire": "4/49/Woman_sewing_a_face_mask_with_a_Singer_machine_09.jpg|5616",   // Macchina da cucire Singer
  "a2-weber": "1/19/Weber_1951_Kettle_Replica.jpg|2592",   // Barbecue Weber a carbone
  "a2-deumidificatore": "c/c3/Air_dehumidifier_with_a_European_plug.jpg|2452",   // Deumidificatore
  "a2-dondolo": "0/00/Mihenk_2400_iroko_bahçe_salıncağı.jpg|1341",   // Dondolo da giardino
  "a2-piano-induzione": "3/39/Kookplaat_inductie.JPG|2288",   // Piano cottura a induzione
  "a2-lavatrice": "a/a7/Front_Load_Washing_Machine.jpg|4248",   // Lavatrice da 8 kg
  "a2-cucina-gas": "9/99/Gas_stove.jpg|369",   // Cucina a gas col forno
  "a2-lavastoviglie": "8/82/Dishwasher_open_for_loading.jpg|1944",   // Lavastoviglie da 60 cm
  "a2-supersonic": "c/cc/Dyson_Supersonic_Hair_Dryer_4_2017-01-28.jpg|4032",   // Phon Dyson Supersonic
  "a2-asciugatrice": "1/1c/Modern_front_load_tumble_dryer.JPG|2155",   // Asciugatrice da 8 kg
  "a2-materasso": "b/b3/Pillowtop-mattress.jpg|1487",   // Materasso matrimoniale
  "a2-frigorifero": "7/7b/Open_refrigerator_with_food_at_night.jpg|3465",   // Frigorifero combinato
  "a2-tenda-sole": "2/27/Hot_Springs_061.jpg|480",   // Tenda da sole
  "a2-porta-blindata": "a/ac/Vidmar_Panzertüre1.jpg|2587",   // Porta blindata
  "a2-stufa-pellet": "c/c3/Stufa_a_pellet_Palazzetti.jpg|1704",   // Stufa a pellet
  "a2-bimby": "5/54/Vorwerk_Bimby_3300.jpg|3000",   // Bimby
  "a2-pile-bottone": "c/c7/Coin-cells.jpg|511",   // Pile a bottone, 2 pezzi
  "a2-calcolatrice": "f/f7/Citizen_SLD-100NR_calculator.jpg|2517",   // Calcolatrice tascabile
  "a2-pile-aa": "7/71/Duracell_AA_batteries.JPG|2272",   // Pile stilo, 4 pezzi
  "a2-caricatore-usb": "c/c9/USB_power_adapter_for_Apple_iPod,_Model_A1205,_by_Foxlink_Technology_Ltd-1048.jpg|3971",   // Caricatore USB da muro
  "a2-netflix": "f/fb/Netflix_button_remote_(40062279010).jpg|5184",   // Netflix per un mese
  "a2-mouse": "4/4e/Logitech_M196_wireless_mouse.jpg|6000",   // Mouse senza fili
  "a2-telecomando": "0/0a/Piloty.jpg|2564",   // Telecomando universale
  "a2-cavo-hdmi": "e/e2/HDMI_Cable_1.JPG|3216",   // Cavo HDMI da 2 metri
  "a2-earpods": "5/54/Earpods.jpg|1506",   // Auricolari Apple col filo
  "a2-tamagotchi": "f/f2/Tamagotchi_0124_ubt.jpeg|900",   // Tamagotchi
  "a2-calcolatrice-casio": "4/46/Casio_FX-82_Scientific_Calculator_(51878773081)_(cropped).jpg|2300",   // Calcolatrice scientifica Casio
  "a2-airtag": "e/eb/Apple_AirTag_(51334123725).jpg|4917",   // AirTag
  "a2-radio": "a/a9/Vintage_Zenith_Transistor_Radio,_Model_RF42,_AM-FM_Bands,_AC_&_Battery_Operation,_Telescopic_Antenna,_Made_In_Taiwan,_Circa_1974_(49020569596).jpg|3149",   // Radiolina portatile
  "a2-powerbank": "e/ee/Anker_power_bank_and_cable.jpg|3443",   // Batteria esterna
  "a2-cartucce": "4/43/Ink-jet_printer_inside-cartridges.jpg|1264",   // Cartucce per la stampante
  "a2-smartband": "8/8b/Mi_Band_4_default_face.jpg|3141",   // Braccialetto fitness Xiaomi
  "a2-magsafe": "0/01/MagSafe_and_USB-C_Cable_Charger_for_iPhone.jpg|3596",   // Caricatore MagSafe Apple
  "a2-hue": "7/71/Philips_Hue_white_bulb_-_June_2018_(1944).jpg|6000",   // Lampadina smart a colori
  "a2-cover-apple": "0/07/Apple_iPhone_17_Silicone_Case_(Black).jpg|4284",   // Custodia Apple in silicone
  "a2-echo-dot": "6/67/Echo_Dot_(3rd_Gen)_01.jpg|2906",   // Echo Dot
  "a2-ps-plus": "7/77/Black_and_white_Playstation_5_base_edition_with_controller.png|1941",   // PlayStation Plus, 12 mesi
  "a2-dualsense": "3/3c/Playstation_DualSense_Controller.png|3120",   // Controller della PS5
  "a2-instax": "7/7d/Fujifilm_Instax_Mini_10_P1110435.jpg|4016",   // Fotocamera istantanea Instax
  "a2-stampante": "d/d8/Canon_PIXMA_TS_3480_Multifunction_ink-jet_Printer_(4).jpg|6469",   // Stampante multifunzione
  "a2-spazzolino": "d/d4/2023_Szczoteczka_do_zębów_Oral-B_Pro_750_(2).jpg|4368",   // Spazzolino elettrico Oral-B
  "a2-airpods-4": "2/23/Airpods_4.jpg|2685",   // AirPods 4
  "a2-tv-32": "e/e2/LG_smart_TV.jpg|1700",   // TV da 32 pollici
  "a2-kindle": "3/38/2023_Amazon_Kindle_Paperwhite_(3).jpg|4152",   // Kindle Paperwhite
  "a2-airpods-pro": "2/2f/AirPods_Pro_(2nd_generation).jpg|4032",   // AirPods Pro
  "a2-ps-portal": "4/45/PlayStation_Portal.jpg|1280",   // PlayStation Portal
  "a2-quest": "c/cb/Meta_Quest_3S_Display_Unit.jpg|2804",   // Visore Meta Quest 3S
  "a2-apple-watch": "8/86/Apple_Watch_Series_10.jpg|3024",   // Apple Watch
  "a2-switch-2": "4/4e/Nintendo_Switch_2_in_Docking_Console.jpg|5855",   // Nintendo Switch 2
  "a2-tv-55": "a/a6/Tesla_tv.jpg|275",   // TV da 55 pollici
  "a2-galaxy-a": "c/c8/Samsung_Galaxy_A57_5G.jpg|4592",   // Samsung Galaxy A57
  "a2-ipad": "b/b0/IPad_Pro_11-inch_backside.jpg|3024",   // iPad
  "a2-ipad-pro": "8/87/About_iPad_Pro_11-inch_(M4).jpg|3024",   // iPad Pro 11 pollici
  "a2-ps5": "0/00/PlayStation_5_and_DualSense.jpg|1430",   // PlayStation 5
  "a2-macbook-neo": "9/9e/MacBook_Neo_Indigo_Touch_ID.png|4035",   // MacBook Neo
  "a2-iphone-17": "8/8f/White_iPhone_17.jpg|4160",   // iPhone 17
  "a2-macbook-air": "3/39/MacBook_Air_(13-inch,_M4,_Silver).jpg|5712",   // MacBook Air 13 pollici
  "a2-galaxy-ultra": "d/de/Galaxy_S26_Ultra_lavender.jpg|3120",   // Samsung Galaxy S26 Ultra
  "a2-iphone-pro-max": "f/f4/IPhone_Pro_(Max).png|4624",   // iPhone Pro Max
  "a2-iphone-2tb": "a/ad/About_iPhone_16_Pro_Max_Natural_Titanium.jpg|3024",   // iPhone Pro Max da 2 TB
  "a2-cappello-babbo": "c/cf/Santa_Claus_cap.jpg|2211",   // Cappello da Babbo Natale
  "a2-lacci": "f/f4/Black_shoe_laces_tied_03.jpg|4000",   // Lacci per scarpe
  "a2-maglietta-primark": "b/b6/Uniqlo_2026-09-07_shirt_Philippines.jpg|2324",   // Maglietta bianca Primark
  "a2-ombrello-ambulante": "8/87/M0354_000727-005_1.jpg|1024",   // Ombrello dell'ambulante
  "a2-collant": "f/f8/Sheer_Tights_or_Pantyhose_with_low_waist_top_in_the_colour_black_-_front_view.jpg|4678",   // Collant velati
  "a2-mutande-rosse": "8/89/Knickers1.jpg|2046",   // Mutande rosse di Capodanno
  "a2-calzini": "d/d4/Premium_Cotton_Socks.jpg|3164",   // Calzini corti, 3 paia
  "a2-occhiali-mercato": "9/90/Occhiali_da_sole_-_Italia.jpg|2567",   // Occhiali da sole al mercato
  "a2-pantofole": "e/e2/Charentaises_bureau_EHM.jpg|640",   // Pantofole a quadri
  "a2-jeans-primark": "3/3e/Levi's_501_raw_jeans.jpg|2740",   // Jeans Primark
  "a2-body-neonato": "9/9d/Menzis_bodysuit_for_newborns_(2019)_01.jpg|2736",   // Body per neonato, 5 pezzi
  "a2-sciarpa-squadra": "9/97/Uzbekistan_national_football_team_supporter.jpg|3024",   // Sciarpa della squadra
  "a2-havaianas": "5/5f/Havaianas_Aqua_and_White_Flip_flops_at_Lung_Mei_Beach.jpg|5184",   // Infradito Havaianas
  "a2-camicia": "a/a5/Camisade_puño_doble.jpg|1697",   // Camicia bianca da uomo
  "a2-canottiera": "e/e6/Old_style_vest_(tank_top),_from_1950s_Chinese_advertisement.jpg|285",   // Canottiera della salute
  "a2-felpa": "c/c2/Hoodie_m7agar.jpg|1200",   // Felpa col cappuccio
  "a2-pigiama": "1/1c/Flannel_Shirt_For_Abi.jpg|2382",   // Pigiama di flanella
  "a2-adilette": "8/83/Adidas_Purple_Original_Adilette_22_Slide.jpg|5184",   // Ciabatte Adidas Adilette
  "a2-new-era": "1/15/2024_World_Series_Los_Angeles_Dodgers_and_New_York_Yankees_New_Era_59Fifty_caps_NEW_ERA_SHIBUYA_2024年11月12日の渋谷_202411121314_IMG_9099.jpg|4032",   // Cappellino New Era
  "a2-cintura": "1/17/Leather_belt_&_buckle.jpg|2288",   // Cintura di pelle
  "a2-maglione": "e/ea/Jersei-coll-alt.jpg|678",   // Maglione di lana merino
  "a2-guanti": "6/67/Two_pairs_of_mens_leather_gloves_from_Randers_Handsker.jpg|6300",   // Guanti di pelle
  "a2-crocs": "e/e0/Single_croc.jpg|1940",   // Crocs Classic
  "a2-eastpak": "d/d7/Rucksack1.jpg|1458",   // Zaino Eastpak
  "a2-superga": "3/35/Superga_Cotu_Classic_Sneaker_2750_Canvas_blau_(1).jpg|2500",   // Superga 2750
  "a2-swatch": "a/a6/Swatch-1985_hg.jpg|2832",   // Orologio Swatch
  "a2-converse": "0/0d/Converse_All_Star_High_White_(4649858686).jpg|2736",   // Converse All Star alte
  "a2-birkenstock": "d/d3/Birkenstock_Arizona.jpg|4000",   // Birkenstock Arizona
  "a2-levis": "f/f7/Levi's_501.jpg|3024",   // Jeans Levi's 501
  "a2-kanken": "8/86/Fjallraven_Kanken_backpack_(Unsplash).jpg|4896",   // Zaino Fjällräven Kånken
  "a2-lacoste": "f/fb/Vintage_90's_Lacoste_Polo_Shirt.jpg|3420",   // Polo Lacoste
  "a2-air-force": "7/7e/Nike_air_Force_1_white_on_white.jpg|5152",   // Nike Air Force 1
  "a2-k-way": "9/98/K-Way.jpg|2532",   // K-Way
  "a2-ray-ban": "2/22/Ray-Ban,_New_Wayfarer_-_4.jpg|8600",   // Ray-Ban Wayfarer
  "a2-marinella": "3/31/Red_and_Green_Tie.jpg|2304",   // Cravatta Marinella
  "a2-ugg": "2/23/UggBoots_SMC.JPG|2544",   // Stivaletti UGG Classic Mini
  "a2-dr-martens": "9/9a/Pair_of_brown_Dr_Martens_1460_boots.jpg|4061",   // Anfibi Dr. Martens 1460
  "a2-timberland": "e/eb/Image_of_a_pair_of_Tmerberland_boots.png|820",   // Timberland gialle
  "a2-borsalino": "f/fc/Borsalino,_fedora.jpg|3024",   // Cappello Borsalino
  "a2-nuptse": "4/42/Adidas_Helionic_Down_Jacket.jpg|2834",   // Piumino The North Face Nuptse
  "a2-tods": "0/0b/Airwalk_Men's_Mason_Mocassin_Slippers.JPG|4608",   // Mocassini Tod's Gommino
  "a2-moncler": "9/9d/Moncler_doudoune_logo.jpg|1094",   // Piumino Moncler
  "a2-max-mara": "7/78/Pierre_Balmain,_Swing_Coat_(1954-56)_02.jpg|615",   // Cappotto Max Mara 101801
  "a2-burberry": "3/31/Man_wearing_trenchcoat_(cropped).jpg|2000",   // Trench Burberry
  "a2-chanel": "9/9d/Chanel_2.55.jpg|2832",   // Borsa Chanel Classic
  "a2-casa-1-euro": "f/fb/Gangi_18_10_2020_08.jpg|4608",   // Casa da ristrutturare
  "a2-rullino": "4/4c/Kodak-Max-400-35mm-Film.jpg|2500",   // Rullino fotografico
  "a2-smemoranda": "6/6c/Agenda.jpg|1600",   // Diario Smemoranda
  "a2-vinile": "b/b6/12in-Vinyl-LP-Record-Angle.jpg|4000",   // Disco in vinile
  "a2-juicy-salif": "5/5e/Juicy_Salif_-_78365.jpg|2777",   // Spremiagrumi di design
  "a2-moka-18": "4/4f/Moka_Express_Bialetti.png|1126",   // Moka da 18 tazze
  "a2-prima-pappa": "9/9a/High_chair.jpg|250",   // Seggiolone Peg Perego
  "a2-reber": "9/9a/Food_Mill.jpg|500",   // Spremipomodoro elettrico
  "a2-culla": "6/66/Child's_rocking_cradle.jpg|1536",   // Culla di legno a dondolo
  "a2-sacco": "8/85/Zanotta_Sacco_chair_with_houndstooth_upholstery.jpg|1636",   // Poltrona Sacco Zanotta
  "a2-pannolini": "d/d8/Disposablediaper.JPG|2048",   // Pannolini per un anno
  "a2-trasloco": "1/17/Yellow_Iveco_moving_truck_with_Forsman_branding.jpg|6048",   // Trasloco di un trilocale
  "a2-abito-sposa": "a/a4/White_wedding_dress_worn_by_unidentified_female_model.jpg|2910",   // Abito da sposa
  "a2-arco-flos": "4/41/\"_12_-_ITALY_-_Milan_-_FLOS_50th_Anniversary_23.jpg|4000",   // Lampada Arco
  "a2-linea-micra": "5/59/Rocket_silver_metal_espresso_machine_on_table.jpg|1200",   // Macchina del caffè da bar
  "a2-pianoforte": "b/ba/Piano_Bekas_Yamaha_U1A.jpg|1280",   // Pianoforte verticale
  "a2-bagno": "b/bf/EFTA00000311_-_Modern_bathroom_with_white_tiles_a_glass_shower_enclosure_a_toilet_and_a_grey_rug_on_the_floor.jpg|768",   // Rifare il bagno
  "a2-eames": "c/ce/Eames_Lounge_Chair_-_side.jpg|3008",   // Poltrona Eames con pouf
  "a2-piscina": "0/0d/Backyard_swimming_pool_in_Queensland.JPG|3264",   // Piscina interrata
  "a3-arbre-magique": "c/c5/Wunderbaum.jpg|2272",   // Arbre Magique
  "a3-strisce-blu": "6/6f/Parking_Meter_Front.JPG|800",   // Un'ora sulle strisce blu
  "a3-monopattino-sharing": "9/93/Shared_electric_kick_scooters_Blinkee.city_on_the_main_square_of_Tomaszów_Mazowiecki_-_60000_population_town_in_central_Poland.jpg|2592",   // Monopattino in sharing
  "a3-area-c": "0/0d/Milan_Area_C_Porta_Ticinese_gate.JPG|1860",   // Ingresso in Area C
  "a3-eicma": "e/e1/0200_EICMA_Milano_2009.jpg|2304",   // Biglietto per l'EICMA
  "a3-museo-ferrari": "2/27/Ferrari-Museum_Maranello_8.JPG|5184",   // Museo Ferrari
  "a3-vignetta-svizzera": "f/f2/Swiss-motorway-road-tax-vignette.jpg|749",   // Vignetta svizzera
  "a3-deposito-gomme": "d/d7/Stack_of_tires_in_the_sun.jpg|4016",   // Deposito delle gomme
  "a3-autostrada-mi-rm": "5/5b/TiranaAirportJunction.png|1024",   // Autostrada Milano-Roma
  "a3-telepass": "e/e2/Un_dispositivo_Telepass_edizione_2022.jpg|3578",   // Telepass per un anno
  "a3-cambio-gomme": "b/be/Car_wheel_change_in_desert.jpg|1632",   // Cambio gomme di stagione
  "a3-traforo-monte-bianco": "e/ec/Mont_Blanc_Tunnel_Courmayeur_P1550586.jpg|4896",   // Traforo del Monte Bianco
  "a3-pieno-benzina": "f/f5/Petrol_pump_mp3h0355.jpg|3504",   // Pieno di benzina, 40 litri
  "a3-casco-nolan": "8/82/Casque_Nolan_N21_Visor.jpg|3928",   // Casco Nolan N21 Visor
  "a3-tagliando-panda": "d/d2/2018_Fiat_Panda_Easy_1.2.jpg|4206",   // Tagliando della Panda
  "a3-gomme-nuove": "2/25/Large_treaded_tire.jpg|1500",   // Quattro gomme nuove
  "a3-corso-guida-sicura": "6/69/MPs_enhance_skills_at_Hockenheimring_with_ADAC_training_DVIDS346566.jpg|3609",   // Corso di guida sicura
  "a3-monopattino-xiaomi": "0/04/Xiaomi_M365_Pro_2.jpg|3024",   // Monopattino elettrico Xiaomi
  "a3-brompton": "2/28/Folded-brompton-bicycle-on-fullsize-bike-P1010593.jpg|2048",   // Bici pieghevole Brompton
  "a3-kymco-agility": "8/8a/Kymco_Agility_125_R16+.jpg|1876",   // Kymco Agility 125
  "a3-liberty-125": "a/a4/Piaggio_Liberty_01.jpg|3008",   // Piaggio Liberty 125
  "a3-sh-125": "f/fd/Honda_SH_125_JF41_.jpg|4160",   // Honda SH 125
  "a3-vespa-primavera-50": "c/ca/Vespa_Primavera_50_4T_4V_seitlich.jpg|2448",   // Vespa Primavera 50
  "a3-vespa-primavera-125": "f/f5/Vespa_Primavera_125.jpg|2048",   // Vespa Primavera 125
  "a3-sh-350": "3/34/Honda_SH_350_2026.jpg|1963",   // Honda SH 350
  "a3-xmax-300": "5/53/2024_Yamaha_XMAX_300_Tech_MAX.jpg|3024",   // Yamaha XMAX 300
  "a3-vespa-gts-310": "c/ca/Vespa_GTV_310_2025.jpg|2048",   // Vespa GTS 310
  "a3-citroen-ami": "7/72/Citroën_Ami_2020_(1).jpg|2449",   // Citroën Ami
  "a3-yamaha-mt07": "9/9c/2021_Black_Yamaha_MT-07.jpg|3031",   // Yamaha MT-07
  "a3-moto-guzzi-v7": "5/54/Moto_Guzzi_V7_Stone_in_Avellino.jpg|1701",   // Moto Guzzi V7 Stone
  "a3-fiat-topolino": "2/24/Fiat_Topolino_(2023)_IMG_0728.jpg|3843",   // Fiat Topolino
  "a3-ducati-scrambler": "c/c1/2015_Ducati_Scrambler_Icon_right.JPG|2936",   // Ducati Scrambler Icon
  "a3-yamaha-tmax": "6/62/Yamaha_TMAX_560_2026.jpg|1200",   // Yamaha TMAX
  "a3-dacia-sandero": "3/3e/2023_Dacia_Sandero_III_DSC_6012.jpg|3936",   // Dacia Sandero Streetway
  "a3-ligier-js50": "3/33/Ligier_JS50_180213.jpg|1325",   // Minicar Ligier JS50
  "a3-honda-africa-twin": "6/68/Honda_Africatwin.jpg|1500",   // Honda Africa Twin
  "a3-fiat-pandina": "d/d2/2018_Fiat_Panda_Easy_1.2.jpg|4206",   // Fiat Pandina
  "a3-fiat-500-hybrid": "f/f4/Fiat_500_Hybrid_Torino_(II)_–_f_25042026.jpg|4054",   // Fiat 500 Hybrid
  "a3-toyota-yaris": "3/3e/2020_Toyota_Yaris_Design_HEV_CVT_1.5_Front.jpg|4297",   // Toyota Yaris ibrida
  "a3-jeep-avenger": "c/c2/Jeep_Avenger_1X7A0818.jpg|4975",   // Jeep Avenger
  "a3-ducati-panigale": "a/a8/Ducati_Panigale_V4_-_Tuning_World_Bodensee_2018,_Friedrichshafen_(OW1A0484).jpg|6720",   // Ducati Panigale V4
  "a3-alfa-junior": "3/39/Alfa_Romeo_Junior_IMG_0474_(cropped).jpg|4941",   // Alfa Romeo Junior
  "a3-ferrari-amalfi": "7/79/Ferrari_Amalfi_IMG_8179.jpg|4003",   // Ferrari Amalfi
  "a3-funicolare-capri": "2/22/Funicolare_Capri-St.Gera.jpg|383",   // Funicolare di Capri
  "a3-contributo-venezia": "d/d8/The_Grand_Canal._Venice,_Italy.jpg|4207",   // Ticket d'ingresso a Venezia
  "a3-vaporetto": "7/75/Venezia_Vaporetto_ACTV43_R01.jpg|4462",   // Biglietto del vaporetto
  "a3-cenacolo": "b/bb/Leonardo_da_Vinci_-_The_Last_Supper_high_res.jpg|5381",   // L'Ultima Cena di Leonardo
  "a3-cristo-velato": "3/30/Cappella_Sansevero_(15041603867).jpg|1600",   // Il Cristo Velato
  "a3-leonardo-express": "d/d2/Rome_Termini_Trenitalia_Leonardo_Express_ETR_425_042_(35875413605).jpg|6000",   // Leonardo Express
  "a3-malpensa-express": "6/69/Malpensa_Express_at_Milano_Cadorna.jpg|4000",   // Malpensa Express
  "a3-grotta-azzurra": "d/d7/Blue_Grotto,_Capri,_IT.jpg|1600",   // Grotta Azzurra
  "a3-museo-egizio": "e/e7/Torino,_Museo_egizio_(243).jpg|5184",   // Museo Egizio
  "a3-reggia-caserta": "a/a4/Reggia_di_Caserta_2023.jpg|4896",   // Reggia di Caserta
  "a3-musei-vaticani": "f/f8/Vatican_Museums_entrance_2016.jpg|2195",   // Musei Vaticani
  "a3-scavi-pompei": "6/6d/Villa_di_Diomede_(Pompeii)_(48443945707).jpg|6000",   // Scavi di Pompei
  "a3-david": "b/bb/'David'_by_Michelangelo_Fir_JBU004.jpg|3260",   // Il David di Michelangelo
  "a3-torre-pisa": "4/4b/Italy_-_Pisa_-_Leaning_Tower.jpg|3257",   // Salita sulla Torre di Pisa
  "a3-uffizi": "d/d7/Florence,_Italy_-_panoramio_(125).jpg|3456",   // Biglietto degli Uffizi
  "a3-cupola-brunelleschi": "2/22/Florence,_Italy,_Brunelleschi's_Dome_of_Florence_Cathedral.jpg|3072",   // Cupola del Brunelleschi
  "a3-palazzo-ducale": "4/4d/(Venice)_Doge's_Palace_facing_the_sea.jpg|8280",   // Palazzo Ducale
  "a3-cinque-terre-card": "4/42/Corniglia_costa.jpg|1000",   // Cinque Terre Card col treno
  "a3-esta-usa": "3/31/Electronic_System_for_Travel_Authorization.png|1902",   // ESTA per gli Stati Uniti
  "a3-vaporetto-24-ore": "8/8a/ACTV_31_at_Fondaco_dei_Tedeschi.jpg|4896",   // Vaporetto per 24 ore
  "a3-roma-pass": "d/de/Colosseo_2020.jpg|12051",   // Roma Pass 72 ore
  "a3-taxi-fiumicino": "f/f5/Taxi_in_Rome.JPG|1944",   // Taxi da Fiumicino a Roma
  "a3-check-in-aeroporto": "2/20/Ryanair_check_in_desk_(Dublin)_in_2025.01.jpg|5792",   // Check-in al banco Ryanair
  "a3-skyway": "0/0f/Cabina_Skyway_Monte_Bianco.jpg|4134",   // Skyway Monte Bianco
  "a3-noleggio-vespa": "6/64/Scooter_Piaggio_Vespa_125-TS.jpg|2080",   // Vespa a noleggio per un giorno
  "a3-rifugio": "0/04/Rifugio_Pedrotti_-_Dolomiti_di_Brenta.jpg|2048",   // Notte in rifugio
  "a3-taxi-malpensa": "5/52/Taxi_Milano.jpg|2800",   // Taxi da Malpensa a Milano
  "a3-ombrellone-rimini": "6/68/Rimini_beach_umbrellas_at_night.jpg|4496",   // Ombrellone a Rimini
  "a3-taxi-acqueo": "4/44/Water_Taxi_in_Venice,_Italy.jpg|2700",   // Taxi acqueo dall'aeroporto
  "a3-gommone": "7/71/Zodiac_on_the_beach.jpg|2816",   // Gommone senza patente
  "a3-ombrellone-alassio": "2/22/Umbrellas_on_the_beach_of_Alassio_Liguria,_in_front_of_the_island_of_Gallinara_(40440430820).jpg|1036",   // Ombrellone in prima fila
  "a3-interrail": "d/dc/09.05.22_Trelleborg_Centralstation_X61_037,_X61_057_and_X61_047_(52093968846).jpg|5827",   // Interrail per un mese
  "a3-vacanza-due": "b/bf/Siracusa_vendicari.jpg|800",   // Una settimana di vacanza
  "a3-settimana-rimini": "b/b4/Rimini_Beach,_Italy_in_2016_(28357400314).jpg|4506",   // Settimana a Rimini
  "a3-cinema": "b/b1/Ptuj,_city_cinema.jpg|2319",   // Biglietto del cinema
  "a3-puzzle": "6/66/Jigsaw_puzzle_01_by_Scouten.jpg|4288",   // Puzzle da 1.000 pezzi
  "a3-carnevale-viareggio": "7/78/Carnevale_di_Viareggio.JPG|3264",   // Carnevale di Viareggio
  "a3-romanzo": "3/32/Planet_of_the_Apes_book_cover.jpg|358",   // Romanzo appena uscito
  "a3-italia-miniatura": "9/93/Panoramica_italia_in_miniatura.jpg|640",   // Italia in Miniatura
  "a3-noleggio-sci": "e/e4/Ski_rental,_Tandådalen_03.jpg|4000",   // Noleggio sci e scarponi
  "a3-acquario-genova": "a/ae/Acquario_di_Genova_-_panoramio.jpg|2272",   // Acquario di Genova
  "a3-escape-room": "b/b1/Tulleys_Farm_Outfitter_Escape_Room.jpg|6720",   // Escape room
  "a3-oltremare": "3/35/Dolphinarium_at_Oltremare_-_Riccione_(Naturalistic-technological_theme_park).jpg|2960",   // Oltremare
  "a3-lucca-comics": "1/1a/Lucca_Comics_2009_-_04.jpg|3264",   // Lucca Comics
  "a3-juventus-museum": "0/02/Juventus_v_Real_Madrid,_Champions_League,_Stadium,_Turin,_2013.jpg|4608",   // Juventus Museum e stadio
  "a3-padel": "9/96/Padel_Tennis_Arena_ISPO_2014.jpg|3165",   // Campo da padel per un'ora
  "a3-magicland": "0/08/Parco-giochi-rainbow-magicland-valmontone-700x400.jpg|700",   // Magicland
  "a3-rafting": "7/77/Rafting_em_Brotas.jpg|1280",   // Discesa in rafting
  "a3-leolandia": "f/f3/Leolandia_2023_(32).jpg|4000",   // Leolandia
  "a3-mirabilandia": "c/ca/Mirabilandia_209.jpg|3968",   // Mirabilandia
  "a3-calcetto": "a/af/2017-08-04_Sports_field,_Caminho_Vale_da_Azinheira,_Olhos_de_Água_(2).JPG|4608",   // Campo da calcetto per un'ora
  "a3-curva-sud-roma": "5/5f/Stadio_Olimpico_2024.jpg|3384",   // Curva Sud all'Olimpico
  "a3-inter-san-siro": "6/6b/Milano_-_stadio_Giuseppe_Meazza_-_202209050049.jpeg|4028",   // Biglietto per vedere l'Inter
  "a3-palestra": "3/3b/Amsterdam_-_Gymnasium_-_0591.jpg|4368",   // Un mese di palestra
  "a3-lezione-sci": "6/66/Maestrodisciclaviereinsegnando.jpg|2018",   // Lezione di sci privata
  "a3-concerto-san-siro": "1/17/Stadio_Meazza_2021_3.jpg|4728",   // Concerto a San Siro
  "a3-monza-prato": "d/d6/Autodromo_Nazionale_di_Monza,_Italy_(Ank_Kumar)_01.jpg|6000",   // Gran Premio di Monza
  "a3-paracadute": "4/45/Parachute_Descent.jpg|768",   // Lancio col paracadute
  "a3-arena-verona": "e/e2/Arena-XE3F2406a.jpg|5771",   // Opera all'Arena di Verona
  "a3-mongolfiera": "f/fd/Luftballong.jpg|1024",   // Volo in mongolfiera
  "a3-abbonamento-curva": "d/dc/San_Siro_MilanDerby6.jpg|4032",   // Abbonamento in curva
  "a3-hospitality-mugello": "7/71/Mugello_Circuit.jpg|3488",   // Hospitality al Mugello
  "a3-calciobalilla": "6/62/FAS_Foosball_table_1.jpg|1280",   // Calciobalilla Garlando
  "a3-fontana-trevi": "c/c7/Trevi_Fountain_-_Roma.jpg|8734",   // Biglietto per Fontana di Trevi
  "a3-pantheon": "7/7b/Pantheon_(Rome)_-_Right_side_and_front.jpg|7512",   // Biglietto del Pantheon
  "a3-colosseo": "d/de/Colosseo_2020.jpg|12051",   // Biglietto del Colosseo
  "a3-gardaland": "5/55/Fontata_Entrata_Gardaland.jpg|3264",   // Biglietto di Gardaland
  "a3-skipass-cortina": "e/ee/Dolomiti_Superski_Skipass.jpg|797",   // Skipass di un giorno
  "a3-giro-gondola": "2/20/Gondole_Venezia.JPG|2605",   // Giro in gondola
  "a3-finale-internazionali": "2/2d/Foro_Italico-Campo_Centrale_-_panoramio.jpg|4608",   // Finale degli Internazionali
  "a3-finale-sanremo": "7/72/Teatro_Ariston_Sanremo.jpg|5400",   // Finale di Sanremo
  "a3-elicottero-capri": "7/70/VH-SUF_Taking_Off.jpg|4262",   // Elicottero Napoli-Capri
  "a3-prima-scala": "0/04/Milano_-_Teatro_alla_Scala_3924.jpg|1920",   // La Prima della Scala
  "a3-luna-di-miele": "9/90/Happy_young_honeymoon_couple_having_fun_on_the_beach._Ocean,_tropical_vacation_on_Bali_island,_Indonesia._(47955055743).jpg|6000",   // Luna di miele all'estero
  "a4-renault-clio": "1/1c/Renault_Clio_V_1X7A0392.jpg|5221",   // Renault Clio
  "a4-dacia-spring": "9/95/Dacia_Spring_1X7A0350.jpg|4970",   // Dacia Spring
  "a4-dacia-duster": "9/9b/Dacia_Duster_III_IMG_8961.jpg|5313",   // Dacia Duster
  "a4-fiat-grande-panda": "0/00/Fiat_Grande_Panda_E_DSC_8694.jpg|4883",   // Fiat Grande Panda ibrida
  "a4-toyota-aygo-x": "5/50/2022_Toyota_Aygo_X_Edge_1.0_VVT-i_(Front).jpg|3687",   // Toyota Aygo X
  "a4-vw-polo": "7/7d/Volkswagen_Polo_VI_(2021)_IMG_5322.jpg|5090",   // Volkswagen Polo
  "a4-lancia-ypsilon": "c/ce/Lancia_Ypsilon_BEV.jpg|4032",   // Lancia Ypsilon ibrida
  "a4-renault-5": "e/e4/Renault_5_E-Tech_Electric_DSC_7279.jpg|4504",   // Renault 5 elettrica
  "a4-fiat-600": "7/7f/Fiat_600_Hybrid_1.2_T3_Pop_(III)_–_f_24032026.jpg|4047",   // Fiat 600 Hybrid
  "a4-vw-golf": "8/8a/2020_Volkswagen_Golf_Style_1.5_Front.jpg|4946",   // Volkswagen Golf
  "a4-vw-t-roc": "1/11/VW_T-Roc_1.5_eTSI_Style_(II)_–_f_05052026.jpg|4077",   // Volkswagen T-Roc
  "a4-bmw-serie-1": "5/56/BMW_120_(F70)_Leonberg_2024_IMG_1068.jpg|5046",   // BMW Serie 1
  "a4-toyota-rav4": "1/1c/2025_Toyota_RAV4_Hybrid_Z.jpg|4443",   // Toyota RAV4
  "a4-vw-id-buzz": "4/4f/Volkswagen_ID._Buzz_1X7A6263.jpg|5663",   // Volkswagen ID. Buzz
  "a4-defender-90": "1/18/Land_Rover_Defender_90_(L663)_IMG_9441.jpg|4893",   // Land Rover Defender 90
  "a4-jeep-wrangler": "8/81/Jeep_Wrangler_Unlimited_(JL)_PHEV_IMG_5808.jpg|4842",   // Jeep Wrangler
  "a4-maserati-grecale": "5/57/Maserati_Grecale_GT_1X7A6371.jpg|5514",   // Maserati Grecale
  "a4-toyota-land-cruiser": "e/e8/2024_Toyota_Land_Cruiser_250_VX_in_Platinum_White_Pearl_Mica,_front_left.jpg|5212",   // Toyota Land Cruiser
  "a4-porsche-911": "1/12/2025_Porsche_992_Carrera_convertible_DSC_7026.jpg|4143",   // Porsche 911
  "a4-harley-nightster": "1/15/Harley-Davidson_Nightster_parked_at_Hogs_for_Hospice,_Leamington,_Ontario,_2025-08-02.jpg|5412",   // Harley-Davidson Nightster
  "a4-ducati-monster": "6/6c/Monster+_937_a.jpg|1490",   // Ducati Monster
  "a4-pinarello-dogma": "3/37/Pinarello_Dogma_F_Super_Record_EPS.jpg|1440",   // Pinarello Dogma F
  "a4-bmw-r12-ninet": "9/94/BMW_R_nineT_(MSP16).jpg|5456",   // BMW R 12 nineT
  "a4-bmw-r1300gs": "1/16/BMW_R_1300_GS_Adventure_Triple_Black_(1).jpg|3012",   // BMW R 1300 GS
  "a4-omega-moonwatch": "1/15/Speedmaster_(23456608783).jpg|4608",   // Omega Speedmaster Moonwatch
  "a4-rolex-submariner": "7/75/Rolex_Submariner_watch_16613.JPG|2048",   // Rolex Submariner Date
  "a4-galaxy-fold8": "b/b2/Samsung_Galaxy_Z_Fold_4.jpg|3024",   // Samsung Galaxy Z Fold8
  "a4-dji-mavic": "a/a8/DJI_-_Drohne_Mavic_4_Pro.JPG|5800",   // Drone DJI Mavic 4 Pro
  "a4-studio-display": "6/6f/Studio_Display_(2022).jpg|3495",   // Apple Studio Display XDR
  "a4-leica-q3": "8/84/A_Leica_Q3.jpg|5184",   // Fotocamera Leica Q3
  "a4-stanza-milano": "9/9c/Twin_Dolphin_Hall_new_studio_apartment_2.jpg|4624",   // Stanza singola in affitto
  "a4-mq-milano": "a/a2/Apartment_building_near_the_Duomo_in_Milan.jpg|4938",   // Un metro quadro di casa
  "a4-affitto-milano": "8/82/Milano_-_edificio_via_Giovanni_Pacini_60.JPG|768",   // Un anno d'affitto
  "a4-bocconi": "d/dc/Bocconi_Grafton_Building_Milan.jpg|5400",   // Un anno all'università Bocconi
  "a4-maglia-italia": "6/60/Maldini_Italia.jpg|3120",   // Maglia della Nazionale
  "a4-finale-champions": "e/e5/Puskás_Aréna_05.jpg|5472",   // Finale di Champions League
  "a4-olimpiadi": "1/17/Stadio_Meazza_2021_3.jpg|4728",   // Cerimonia d'apertura olimpica
  "a4-gibson-les-paul": "1/1c/Full_front_R9_Les_Paul.jpg|3520",   // Chitarra Gibson Les Paul
  "a4-park-guell": "8/86/Park_Güell_-_main_steps_and_Drac_02.jpg|6000",   // Biglietto del Park Güell
  "a4-alhambra": "d/de/Dawn_Charles_V_Palace_Alhambra_Granada_Andalusia_Spain.jpg|4592",   // Biglietto dell'Alhambra
  "a4-louvre": "6/66/Louvre_Museum_Wikimedia_Commons.jpg|6740",   // Biglietto del Louvre
  "a4-acropoli": "d/da/The_Parthenon_in_Athens.jpg|1144",   // Biglietto dell'Acropoli
  "a4-torre-eiffel": "a/a8/Tour_Eiffel_Wikimedia_Commons.jpg|2900",   // Salita sulla Torre Eiffel
  "a4-dolomiti-superski": "7/7f/Marmolada_+_Sellaronda_tour_6.jpg|5400",   // Skipass di sei giorni
  "a1-v-matrimonio-puglia#0": "3/31/Wedding_photographer_at_work.jpg|5262",   // Fotografo per tutto il giorno
  "a1-v-matrimonio-puglia#1": "6/6f/Colorful_three_tiered_wedding_cake_LCP.jpg|2112",   // Torta nuziale a tre piani
  "a1-v-matrimonio-puglia#2": "7/77/Vintage_Car.jpg|3456",   // Auto d'epoca con autista
  "a1-v-matrimonio-puglia#3": "c/c4/Cacio_cavallo_with_slices.jpg|3888",   // Caciocavallo, 2 kg
  "a1-v-natale-famiglia#0": "f/fd/Honda_SH_125_JF41_.jpg|4160",   // Honda SH 125
  "a1-v-natale-famiglia#1": "9/98/Christmas_Dinner_Setting.jpg|3504",   // Pranzo di Natale per 12
  "a1-v-natale-famiglia#2": "d/d5/A1_Christmas_Tree_photo.jpg|2676",   // Abete vero, 2 metri
  "a1-v-natale-famiglia#3": "b/b6/Tombola.jpg|2080",   // Tombola con 48 cartelle
  "a1-v-diciotto-anni#0": "7/71/MC_701F_(1)_front.jpg|2993",   // Patente B
  "a1-v-diciotto-anni#1": "3/32/Wikipedia_space_ibiza(03).jpg|1000",   // Sala per la festa
  "a1-v-diciotto-anni#2": "5/57/Neapolitan_pizza_at_Trappica_(48701940197).jpg|3024",   // Pizze per 70 amici
  "a1-v-diciotto-anni#3": "f/f9/DJ_AnthonyB._at_the_turntables.jpg|1227",   // DJ per la festa
  "a1-v-diciotto-anni#4": "5/50/Congrats_bqt.jpg|639",   // Palloncini «1» e «8»
  "a1-v-anno-a-tavola#0": "f/f1/Stop&Shop.jpg|4032",   // La spesa di un anno
  "a1-v-anno-a-tavola#1": "7/7e/Beer_and_pizza_on_display_in_a_restaurant_on_a_rustic_table_with_focus_on_the_glass_of_beer.jpg|6016",   // Pizza e birra ogni sabato
  "a1-v-anno-a-tavola#2": "a/a3/Cuiller_en_bois_-_échelle.jpg|3995",   // Mestolo di legno
  "a1-v-sorriso#0": "c/c3/Invisalign_aligner.jpg|891",   // Apparecchio invisibile
  "a1-v-sorriso#1": "f/f2/Office_Teeth_Whitening.jpg|4000",   // Sbiancamento dei denti
  "a1-v-sorriso#2": "5/53/Dental_floss_(whole).jpg|800",   // Filo interdentale
  "a1-v-meglio-italia#0": "3/38/2003_Bolgheri_Sassicaia.jpg|2432",   // Dodici bottiglie di Sassicaia
  "a1-v-meglio-italia#1": "e/e5/Wheel_of_2013_Parmigiano-Reggiano_DOP.JPG|3264",   // Forma intera di Parmigiano
  "a1-v-meglio-italia#2": "5/5d/Aceto_Balsamico_Tradizionale_di_Modena_DOP_extravecchio.jpg|5908",   // Aceto balsamico tradizionale
  "a1-v-vivere-milano#0": "1/18/Daycare_Attendee.jpg|4288",   // Babysitter ogni sabato sera
  "a1-v-vivere-milano#1": "0/06/Aperol_Spritz_-_Santa_Ynez_Kitchen_-_Sarah_Stierch.jpg|4032",   // Uno spritz ogni venerdì
  "a1-v-vivere-milano#2": "2/20/Milaan_metro_2024_5.jpg|5472",   // Abbonamento annuale ai mezzi
  "a1-v-vivere-milano#3": "8/80/Photo_Booth_in_Malaga.jpg|4000",   // Quattro fototessere
  "a1-v-anno-bellezza#0": "c/ca/Spa_Picture_2.jpg|2100",   // Un massaggio a settimana
  "a1-v-anno-bellezza#1": "0/09/Hairdresser's_salon_in_Brastad_5.jpg|2938",   // La piega ogni sabato
  "a1-v-anno-bellezza#2": "9/9b/Young_men_with_trendy_haircut_at_barber_shop.jpg|4016",   // Barbiere ogni due settimane
  "a1-v-anno-bellezza#3": "1/15/Hairspray.JPG|1728",   // Bomboletta di lacca
  "a2-v-cucina#1": "8/85/LG_refrigerator_interior.jpg|2448",   // Frigorifero americano
  "a2-v-cucina#2": "8/82/Dishwasher_open_for_loading.jpg|1944",   // Lavastoviglie silenziosa
  "a2-v-cucina#3": "8/8e/Global_Knives.jpg|600",   // Ceppo di coltelli
  "a2-v-cucina#4": "c/ca/Preparing_the_Cake_(5285262061).jpg|4288",   // Grembiule col tuo nome
  "a2-v-bebe#0": "d/d0/Baby_pram.jpg|1500",   // Trio Peg Perego
  "a2-v-bebe#1": "7/76/The_Nursery_Progresses..._-_Flickr_-_Kelly_Sue.jpg|450",   // Cameretta completa
  "a2-v-bebe#2": "3/38/Inglesina_Marco_Polo_car_seat.jpg|2871",   // Seggiolino auto girevole
  "a2-v-bebe#3": "7/71/Giant_Teddy_Bear.jpg|4608",   // Orsetto gigante
  "a2-v-bebe#4": "9/96/Feeding-bottle--01.jpg|1942",   // Biberon, 3 pezzi
  "a2-v-gamer#0": "8/82/PlayStation_5_Pro_no_disc_drive.jpg|1536",   // PlayStation 5 Pro
  "a2-v-gamer#1": "d/d0/Samsung_OLED_TV.jpg|4500",   // TV OLED da 65 pollici
  "a2-v-gamer#2": "b/b2/Gaming_chair.jpg|3648",   // Sedia da gaming
  "a2-v-gamer#3": "2/27/Plantronics_headset.jpg|1456",   // Cuffie da gaming
  "a2-v-gamer#4": "2/2a/HP_mouse_and_mousepad_20060803.jpg|1280",   // Tappetino gigante
  "a2-v-guardaroba#0": "2/26/PAX_wardrobe_at_IKEA_Xihongmen_(20150423113022).jpg|3264",   // Armadio IKEA Pax
  "a2-v-guardaroba#1": "3/39/Overcoat_MET_1973.65.1_B.jpg|1656",   // Cappotto da sartoria
  "a2-v-guardaroba#2": "f/f8/TailoringFirstFitFront01.jpg|698",   // Abito da uomo su misura
  "a2-v-guardaroba#3": "e/eb/Black_Leather_Pumps_Worn_by_Bonnie_Blake_-_DPLA_-_12bcc989cf7708c987a7be7c19a640b9_(page_2).jpg|5792",   // Décolleté col tacco
  "a2-v-guardaroba#4": "b/b8/Wooden_coat_hangers.jpg|2992",   // Grucce di legno, 10
  "a2-v-nonno#0": "b/b4/Electric_Wheels_in_Fort_Lauderdale,_Florida.jpg|5451",   // Bici elettrica da città
  "a2-v-nonno#1": "9/98/Lift_Chairs.jpg|3120",   // Poltrona relax elettrica
  "a2-v-nonno#2": "0/02/Techwood_flat_screen_television_from_2010.jpg|4032",   // TV da 50 pollici
  "a2-v-nonno#4": "5/59/Scheda_LABIRINTO.jpg|541",   // La Settimana Enigmistica
  "a2-v-smart#0": "d/d7/MacBook_Pro_(14-inch,_M5,_Space_Black).jpg|5712",   // MacBook Pro 14 pollici
  "a2-v-smart#1": "9/9c/ErgoFlip_Active_Ergonomic_Chair_eye_view.jpg|854",   // Sedia ergonomica
  "a2-v-smart#2": "1/18/DiRT_Rally_を4K_HDでベンチマーク_-Lenovo_ThinkCentre_M75q-1_Tiny_+_135W_AC_Adapter-_(50065100496).jpg|4000",   // Monitor da 27 pollici
  "a2-v-smart#4": "b/b8/Mug_of_Tea.JPG|3072",   // Tazza «Sono in call»
  "a2-v-giardino#0": "1/10/Gasgrill_Weber_Q100.jpg|4480",   // Barbecue Weber a gas
  "a2-v-giardino#1": "6/62/Above_Ground_swimming_pool_-_4420.jpg|1600",   // Piscina fuori terra
  "a2-v-giardino#3": "a/ab/Garden_chairs_and_table,_Birkenhead_-_DSC09774.JPG|3648",   // Set da giardino
  "a2-v-giardino#4": "8/87/Mosquito_coil.JPG|3800",   // Zampirone, 10 spirali
  "a2-v-salotto#0": "4/46/A_brown_sofa_(2005-03-03).jpg|2048",   // Divano in pelle
  "a2-v-salotto#1": "b/bc/LG_LAS260B_Soundbar.jpg|4437",   // Soundbar col subwoofer
  "a2-v-salotto#2": "b/bd/Floor_lamp_(5906).JPG|460",   // Lampada da terra
  "a2-v-salotto#3": "f/f7/Interior_of_living_room_01.JPG|2816",   // Tavolino da salotto
  "a2-v-salotto#4": "1/16/Ficus_elastica_leaves_02.JPG|2304",   // Ficus in vaso grande
  "a3-v-estate-vespa#0": "f/f5/Vespa_Primavera_125.jpg|2048",   // Vespa Primavera 125
  "a3-v-estate-vespa#1": "8/82/Casque_Nolan_N21_Visor.jpg|3928",   // Casco Nolan N21 Visor
  "a3-v-estate-vespa#2": "6/68/Rimini_beach_umbrellas_at_night.jpg|4496",   // Ombrellone a Rimini
  "a3-v-estate-vespa#3": "f/f5/Petrol_pump_mp3h0355.jpg|3504",   // Il pieno della Vespa
  "a3-v-neve-cortina#0": "f/f3/Alfa_Romeo_Junior_Leonberg_2024_IMG_0970.jpg|4796",   // Alfa Romeo Junior
  "a3-v-neve-cortina#1": "e/ee/Dolomiti_Superski_Skipass.jpg|797",   // Skipass di un giorno
  "a3-v-neve-cortina#2": "6/66/Maestrodisciclaviereinsegnando.jpg|2018",   // Lezione di sci privata
  "a3-v-neve-cortina#3": "e/eb/Ski_rental,_Tandådalen_01.jpg|4000",   // Noleggio sci e scarponi
  "a3-v-gran-premio#0": "a/a8/Ducati_Panigale_V4_-_Tuning_World_Bodensee_2018,_Friedrichshafen_(OW1A0484).jpg|6720",   // Ducati Panigale V4
  "a3-v-gran-premio#2": "e/e8/Musée_Ferrari_Maranello_0007.JPG|1600",   // Museo Ferrari
  "a3-v-gran-premio#3": "c/c5/Wunderbaum.jpg|2272",   // Arbre Magique
  "a3-v-sportivo#0": "e/ee/Brompton,_Velo_24,_Berlin_(VB243556).jpg|6720",   // Bici pieghevole Brompton
  "a3-v-sportivo#1": "6/62/FAS_Foosball_table_1.jpg|1280",   // Calciobalilla Garlando
  "a3-v-sportivo#2": "1/17/Stadio_Meazza_2021_3.jpg|4728",   // Abbonamento in curva
  "a3-v-sportivo#4": "8/8a/Padel_court_Nsambya.jpg|4928",   // Campo da padel per un'ora
  "a3-v-avventura#0": "c/c2/Jeep_Avenger_1X7A0818.jpg|4975",   // Jeep Avenger
  "a3-v-avventura#1": "f/fd/Luftballong.jpg|1024",   // Volo in mongolfiera
  "a3-v-avventura#2": "4/45/Parachute_Descent.jpg|768",   // Lancio col paracadute
  "a3-v-avventura#3": "7/77/Rafting_em_Brotas.jpg|1280",   // Discesa in rafting
  "a3-v-moto-sogno#0": "6/68/Honda_Africatwin.jpg|1500",   // Honda Africa Twin
  "a3-v-moto-sogno#1": "8/82/Casque_Nolan_N21_Visor.jpg|3928",   // Casco Nolan N21 Visor
  "a3-v-moto-sogno#2": "a/a4/Chamonix_-_Mont_Blanc_Tunnel_Entrance.jpg|2346",   // Traforo del Monte Bianco
  "a3-v-moto-sogno#3": "f/f2/Swiss-motorway-road-tax-vignette.jpg|749",   // Vignetta svizzera
  "a3-v-moto-sogno#4": "3/33/Ducati_Superbike_1199_Superleggera_at_EICMA_2013_in_Milano,_Italy.jpg|2968",   // Biglietto per l'EICMA
  "a3-v-prima-auto#0": "c/cb/Fiat_Panda_1.0_Cross_Hybrid.jpg|1864",   // Fiat Pandina
  "a3-v-prima-auto#2": "e/e2/Un_dispositivo_Telepass_edizione_2022.jpg|3578",   // Telepass per un anno
  "a3-v-prima-auto#3": "6/6f/Parking_Meter_Front.JPG|800",   // Un'ora sulle strisce blu
  "a4-v-fuorisede#0": "f/fd/Universita_Bocconi_Ceppo_di_Gre.jpg|1024",   // Un anno all'università Bocconi
  "a4-v-fuorisede#1": "9/9c/Twin_Dolphin_Hall_new_studio_apartment_2.jpg|4624",   // Dieci mesi di stanza singola
  "a4-v-fuorisede#2": "3/39/MacBook_Air_(13-inch,_M4,_Silver).jpg|5712",   // MacBook Air 13 pollici
  "a4-v-fuorisede#3": "9/94/Laundromat_Washing_Machines_&_Laundry_Equipment.jpg|4624",   // Lavatrice a gettone, 8 kg
  "a4-v-parigi#0": "8/84/A_Leica_Q3.jpg|5184",   // Fotocamera Leica Q3
  "a4-v-parigi#1": "a/a8/DJI_-_Drohne_Mavic_4_Pro.JPG|5800",   // Drone DJI Mavic 4 Pro
  "a4-v-parigi#2": "a/a8/Tour_Eiffel_Wikimedia_Commons.jpg|2900",   // Salita sulla Torre Eiffel
  "a4-v-parigi#3": "9/9b/Mona_Lisa_crowd.jpg|2762",   // Biglietto del Louvre
  "a4-v-rockstar#0": "1/1c/Full_front_R9_Les_Paul.jpg|3520",   // Chitarra Gibson Les Paul
  "a4-v-rockstar#1": "1/1a/Harley-Davidson_Museum_May_2024_30_(2024_Nightster).jpg|6000",   // Harley-Davidson Nightster
  "a4-v-rockstar#2": "2/22/Ray-Ban,_New_Wayfarer_-_4.jpg|8600",   // Ray-Ban Wayfarer
  "a4-v-rockstar#3": "b/b6/12in-Vinyl-LP-Record-Angle.jpg|4000",   // Disco in vinile
  "a4-v-campioni#0": "e/e5/Puskás_Aréna_05.jpg|5472",   // Finale di Champions League
  "a4-v-campioni#1": "6/60/Maldini_Italia.jpg|3120",   // Maglia della Nazionale
  "a4-v-campioni#2": "7/75/Rolex_Submariner_watch_16613.JPG|2048",   // Rolex Submariner Date
  "a4-v-campioni#3": "9/97/Uzbekistan_national_football_team_supporter.jpg|3024",   // Sciarpa della squadra
  "a4-v-collezionista#1": "3/3b/Moonwatch_(24023224706).jpg|3456",   // Omega Speedmaster Moonwatch
  "a4-v-collezionista#2": "6/6f/Studio_Display_(2022).jpg|3495",   // Apple Studio Display XDR
  "a4-v-collezionista#3": "f/f2/Tamagotchi_0124_ubt.jpeg|900",   // Tamagotchi
};

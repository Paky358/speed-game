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
  // ---- le vetrine nuove (data/prezzo-5.js e prezzo-6.js, 23 ott 2026): scelte a occhio come le altre ----
  "a5-v-maldive#0": "8/82/MaldivesBungalows.jpg|3024",   // Una settimana in villa sull'acqua
  "a5-v-maldive#1": "4/48/Cathay_Pacific_-_A330-300_-_Business_Class_(8108289508).jpg|4608",   // Due voli in business per Malé
  "a5-v-maldive#2": "3/30/Dharavandhoo_Thila_-_Manata_Black_Pearl.JPG|1029",   // Immersione con le mante
  "a5-v-maldive#3": "b/bd/LRP_sunscreen_bottle.jpg|1872",   // Crema solare SPF 50
  "a5-v-laurea#1": "9/9d/ForbysIbizaTown_03.jpg|1280",   // Viaggio a Ibiza con gli amici
  "a5-v-laurea#2": "3/30/Corona_alloro_laurea.JPG|6000",   // Tre copie della tesi rilegate
  "a5-v-laurea#3": "6/60/LaurelwreathDK.JPG|1704",   // Corona d'alloro
  "a5-v-laurea#4": "e/e8/Confetti_rossi.jpg|1024",   // Confetti rossi, un chilo
  "a5-v-prima-casa#0": "2/2f/IKEA_store,_IKEA_kitchen,_Interior_design,_Rostov-on-Don,_Russia.jpg|6000",   // Cucina IKEA completa
  "a5-v-prima-casa#1": "a/a7/Legal_Contract_&_Signature_-_Warm_Tones.jpg|6000",   // Il rogito dal notaio
  "a5-v-prima-casa#2": "6/60/Lotte_Heaven._(2185651031).jpg|2496",   // Letto matrimoniale col materasso
  "a5-v-prima-casa#3": "d/db/Zerbino_format.jpg|2187",   // Zerbino «Benvenuti»
  "a5-v-camper#0": "a/ae/White_Fiat_Ducato_Campervan_2006.jpg|2918",   // Camper a noleggio, due settimane
  "a5-v-camper#2": "3/3f/WaynePump-sm.jpg|720",   // Il pieno del camper
  "a5-v-camper#3": "f/f9/Camping_breakfast_table.JPG|2448",   // Tavolino e sedie pieghevoli
  "a5-v-camper#4": "6/6e/Camping-987707_960_720(1).jpg|960",   // Una notte in campeggio
  "a5-v-crociera#0": "6/66/Icon_of_the_Seas_Puerto_Rico_2025_(cropped).jpg|4947",   // Sette notti in crociera, per due
  "a5-v-crociera#1": "8/80/15-09-26-RalfR-WLC-0084.jpg|2368",   // Pacchetto bevande per due
  "a5-v-crociera#2": "a/a7/The_Acropolis_of_Athens_viewed_from_the_Hill_of_the_Muses_(14220794964).jpg|4928",   // Escursione ad Atene
  "a5-v-crociera#3": "a/ae/Jacques-louis_david,_marte_disarmato_da_venere,_1824,_picture_frame.png|2111",   // Foto della cena di gala
  "a5-v-pizzaiolo#0": "e/eb/Fernbrake.jpg|940",   // Forno a legna da giardino
  "a5-v-pizzaiolo#1": "6/6e/Punch_Neapolitan_Pizza_(2257039638).jpg|2800",   // Corso da pizzaiolo
  "a5-v-pizzaiolo#2": "6/69/Pizza_peel,_930544_002.jpg|8688",   // Pala per pizza
  "a5-v-pizzaiolo#3": "b/b4/Piles_of_Flour.jpg|3024",   // Farina per pizza, 25 kg
  "a5-v-pizzaiolo#4": "d/d5/Mozzarella_di_bufala2.jpg|4160",   // Mozzarella di bufala, 1 kg
  "a5-v-caffe#0": "5/59/Rocket_silver_metal_espresso_machine_on_table.jpg|1200",   // Macchina espresso La Marzocco
  "a5-v-caffe#2": "c/c5/Roasted_coffee_beans.jpg|1600",   // Caffè in grani, 1 kg
  "a5-v-caffe#3": "4/4f/Moka_Express_Bialetti.png|1126",   // Moka Bialetti da 3 tazze
  "a5-v-eolie#0": "3/39/Thor_8.0,_Interboot_2023,_Friedrichshafen_(P1120662).jpg|4608",   // Gommone con motore da 40 cavalli
  "a5-v-eolie#1": "c/c6/Chiesa_San_Giuseppe_(Lipari)_04.jpg|4986",   // Ormeggio per una settimana
  "a5-v-eolie#2": "1/1d/Universal_Life_Jacket.JPG|499",   // Quattro giubbotti salvagente
  "a5-v-eolie#3": "6/6e/Lipari._Colazione_da_'Dolci_Tentazioni'_(01297).JPG|6000",   // Granita alla mandorla
  "a5-v-vela#0": "c/cf/Dufor_520_GL.jpg|5152",   // Barca a vela con skipper
  "a5-v-vela#1": "c/c9/Sailing_club_and_school_Sutton_Bingham_reservoir_-_geograph.org.uk_-_942140.jpg|640",   // Corso di vela
  "a5-v-vela#3": "4/4e/Fala-Sailor-Cap-1943.jpg|750",   // Cappellino da marinaio
  "a5-v-giardino#0": "3/3e/Husqvarna_automower_430X.jpg|4032",   // Robot tagliaerba Husqvarna
  "a5-v-giardino#1": "1/1a/The_Small_Greenhouse,_Quarry_Bank_Mill_Upper_Garden_-_geograph.org.uk_-_3000457.jpg|640",   // Serra da giardino
  "a5-v-giardino#2": "e/e7/Phaseolus_vulgaris_seed.jpg|252",   // Semi per l'orto, 30 bustine
  "a5-v-giardino#3": "6/6b/Regadera,_jardín_del_molino,_Sierra_de_San_Felipe,_Setúbal,_Portugal,_2012-05-11,_DD_01.JPG|4085",   // Annaffiatoio di latta
  "a5-v-palestra#0": "1/1f/Treadmill_from_Viking_Sport,_front.jpg|2952",   // Tapis roulant per casa
  "a5-v-palestra#1": "8/84/Health_club_in_Gothenburg_Sweden_in_March_2025.jpg|4000",   // Un anno in palestra
  "a5-v-palestra#2": "e/e3/TwoDumbbells.JPG|573",   // Dieci lezioni col personal trainer
  "a5-v-palestra#3": "4/40/Fitness_digital_scale_weight_loss_(33837094584).jpg|5616",   // Bilancia smart
  "a5-v-palestra#4": "1/1b/Osaka_protein_shaker.jpg|600",   // Shaker per le proteine
  "a5-v-ciclista#0": "9/9c/Current_F10_prices_make_this_the_bike_to_buy_right_now._If_you’ve_always_wanted_a_Pinarello_Dogma,_talk_to_us._You_are_closer_to_your_dream_bike_than_you_think._-pinarello_-pinarellof10_-pinarellodogma_-f10endofdiscussion_-baaw.jpg|640",   // Bici da corsa Bianchi in carbonio
  "a5-v-ciclista#1": "f/f1/Garmin_Edge_1040_Solar_07.jpg|2268",   // Ciclocomputer Garmin Edge
  "a5-v-ciclista#2": "6/60/Cycling_bib_shorts_front.jpg|3024",   // Maglia e salopette
  "a5-v-ciclista#3": "b/b8/Tour_de_France_Femmes_2025_-_Tour_cyclosportive_-_La_Chambre.JPG|2048",   // Iscrizione a una granfondo
  "a5-v-ciclista#4": "0/07/Multi-use_water_bottle.JPG|1024",   // Borraccia
  "a5-v-maratona#0": "7/72/Verrazano_Bridge2.jpg|2224",   // Viaggio con il pettorale
  "a5-v-maratona#1": "3/36/Forerunner_945_Music.jpg|2064",   // Orologio Garmin Forerunner
  "a5-v-maratona#2": "8/8b/Asics_Gel-Cumulus_22.jpg|4668",   // Scarpe da corsa in carbonio
  "a5-v-maratona#3": "3/3e/PXL_20211208_195048218(6970).jpg|2268",   // Gel energetici, 10 bustine
  "a5-v-golf#0": "3/3d/Golf_course,_Italy_-_20070620.jpg|1024",   // Un anno al golf club
  "a5-v-golf#1": "c/cc/Golf_bag_and_clubs.jpg|4608",   // Sacca con le mazze
  "a5-v-golf#2": "b/b0/Riverwalk_Golf_Club_Driving_range.jpg|2560",   // Dieci ore col maestro
  "a5-v-golf#3": "b/ba/Golf_balls_kallerna.JPG|2500",   // Palline da golf, 12
  "a5-v-tennis#0": "4/4a/Tennis_Racquets_and_Balls_on_a_Clay_Court.jpg|3246",   // Un anno di lezioni di tennis
  "a5-v-tennis#1": "7/76/Il_Centrale_(108607831).jpeg|2048",   // Due biglietti per gli Internazionali
  "a5-v-tennis#2": "5/59/Tennis_racket_and_ball.JPG|2816",   // Racchetta Babolat Pure Drive
  "a5-v-tennis#3": "2/28/Cmglee_tennis_balls.jpg|3072",   // Tubo di palline
  "a5-v-roma#0": "3/34/Roma_Via_Veneto.jpg|1024",   // Tre notti in una suite in via Veneto
  "a5-v-roma#1": "b/b8/PerthVespa.jpg|2272",   // Tour in Vespa per Roma
  "a5-v-roma#2": "d/de/Colosseo_2020.jpg|12051",   // Biglietto del Colosseo
  "a5-v-roma#3": "5/5b/Vatican_Museums_Spiral_Staircase_2012.jpg|4336",   // Biglietto dei Musei Vaticani
  "a5-v-roma#4": "b/bb/Supplì_al_telefono.jpg|1000",   // Supplì
  "a5-v-venezia#0": "5/5b/Palazzo_Genovese_facciata_Canal_Grande_Venezia.jpg|7360",   // Tre notti di lusso sul Canal Grande
  "a5-v-venezia#1": "f/f4/Venice_Gondola_Grand_Canal.jpg|2580",   // Giro in gondola
  "a5-v-venezia#2": "c/ca/Venice_Carnival_-_Masked_Lovers_(2010).jpg|3504",   // Maschera fatta a mano
  "a5-v-venezia#3": "6/66/Bellini_cocktail_in_a_flute-glass.png|600",   // Bellini all'Harry's Bar
  "a5-v-venezia#4": "7/75/Venezia_Vaporetto_ACTV43_R01.jpg|4462",   // Vaporetto per 24 ore
  "a5-v-firenze#0": "a/a3/Leather_handbag_by_Les_cuirs_d'Agathe_(DSC07738).jpg|4426",   // Borsa di pelle fatta a mano
  "a5-v-firenze#1": "1/12/Bistecca_alla_fiorentina-01.jpg|875",   // Bistecca alla fiorentina
  "a5-v-firenze#2": "d/d7/Florence,_Italy_-_panoramio_(125).jpg|3456",   // Biglietto degli Uffizi
  "a5-v-firenze#3": "4/49/Villa_Castellani_Empoli.jpg|1200",   // Una settimana in villa nel Chianti
  "a5-v-firenze#4": "1/1c/Lampredotto_sandwich.JPG|2648",   // Panino col lampredotto
  "a5-v-sicilia#0": "5/5b/Aerial_image_of_the_coast_of_Taormina_(view_from_the_southeast).jpg|5568",   // Villa con piscina a Taormina
  "a5-v-sicilia#1": "f/ff/1992_Agrigento_street_Fiat_500_Sicily_Sicilia_Italy.jpg|2344",   // Auto a noleggio, due settimane
  "a5-v-sicilia#2": "e/ea/NAS_Sigonella_Backed_by_Mount_Etna_(6473839).jpg|5834",   // Escursione sull'Etna in fuoristrada
  "a5-v-sicilia#3": "4/4b/16.11.95_Between_Messina_&_Villa_San_Giovanni_mv_\"Scilla\"_(12788799193).jpg|1506",   // Traghetto sullo Stretto
  "a5-v-sicilia#4": "1/14/Cannolo_siciliano_with_chocolate_squares.jpg|800",   // Cannolo siciliano
  "a5-v-napoli#0": "3/3d/Amalfi_Coast_(Italy,_October_2020)_-_75_(50558355441).jpg|5445",   // Una settimana in Costiera Amalfitana
  "a5-v-napoli#1": "7/71/Stadio_Maradona_Serie_A.jpg|3561",   // Biglietto per vedere il Napoli
  "a5-v-napoli#2": "c/c1/Aliscafo_in_velocità.jpg|3896",   // Gita a Capri in aliscafo
  "a5-v-napoli#3": "f/fd/CornicelloCharm.jpg|853",   // Corno portafortuna
  "a5-v-napoli#4": "5/57/Neapolitan_pizza_at_Trappica_(48701940197).jpg|3024",   // Pizza margherita
  "a5-v-sardegna#0": "7/76/Costa_Smeralda_veduta_panoramica_2.png|1920",   // Villa in Costa Smeralda
  "a5-v-sardegna#1": "b/bd/DFDS_Transmanche_Ferry_loading_at_Newhaven_Harbour.jpg|4096",   // Traghetto con l'auto
  "a5-v-sardegna#2": "2/2c/Strand_in_Borsh.jpg|600",   // Ombrellone in prima fila
  "a5-v-sardegna#3": "8/8c/SeadasCA.jpg|899",   // Seadas col miele
  "a5-v-giappone#0": "c/ca/Airplane_on_the_bridge,_Haneda_airport_-_Sep_11,_2010.jpg|4155",   // Due voli per Tokyo
  "a5-v-giappone#1": "2/27/Tamatsukuri_onsen_yado02s3648.jpg|4592",   // Notte in un ryokan
  "a5-v-giappone#2": "3/35/Mount_Fuji_and_Bullet_Train_view_location.jpg|4032",   // Japan Rail Pass di 7 giorni
  "a5-v-giappone#3": "f/f0/Shoyu_ramen,_at_Kasukabe_Station_(2014.05.05)_2.jpg|3264",   // Ciotola di ramen
  "a5-v-new-york#0": "4/47/New_york_times_square-terabass.jpg|3904",   // Cinque notti a Manhattan
  "a5-v-new-york#1": "3/3c/Cathay_Pacific_Boeing_777-200;_B-HNL@HKG.jpg|3038",   // Volo per New York
  "a5-v-new-york#2": "c/cd/Various_Pictures_from_New_York_City_-_September,_2025.jpg|4000",   // Biglietto per un musical
  "a5-v-new-york#3": "c/c7/Empire_State_Building_from_the_Top_of_the_Rock.jpg|756",   // Salita sull'Empire State Building
  "a5-v-new-york#4": "b/b1/Hot_dog_with_mustard.png|2562",   // Hot dog dal carretto
  "a5-v-pianista#0": "0/0b/Yamaha_U1.jpg|1024",   // Pianoforte verticale Yamaha
  "a5-v-pianista#1": "f/f2/Piano-keyboard.jpg|800",   // Un anno di lezioni di pianoforte
  "a5-v-pianista#2": "5/5b/Fortepian_Calisia_M-280.jpg|4608",   // Panchetta regolabile
  "a5-v-pianista#3": "1/18/Metronomes_101.jpgsubstantially_substrate_supply_surface_switch.jpg|1200",   // Metronomo
  "a5-v-dj#0": "2/2f/DJM_350.jpg|1923",   // Console Pioneer DJ
  "a5-v-dj#1": "0/0e/Electrodynamic-loudspeaker.png|524",   // Due casse attive
  "a5-v-dj#2": "0/00/Słuchawki_referencyjne_K-701_firmy_AKG.jpg|1881",   // Cuffie da DJ
  "a5-v-dj#3": "6/62/Disco_ball.jpg|223",   // Palla stroboscopica
  "a5-v-streamer#0": "0/04/MSI-Gaming-PC_2024-09-30.png|3840",   // PC da gaming
  "a5-v-streamer#1": "f/fc/Shure_SM7.jpg|3024",   // Microfono Shure SM7B
  "a5-v-streamer#2": "0/0c/Logicool_StreamCam_(cropped).jpg|2300",   // Webcam 4K
  "a5-v-streamer#3": "d/de/Ring_light_in_Torp_shopping_mall,_Uddevalla.jpg|3247",   // Luce ad anello
  "a5-v-cinema#0": "c/cb/Leica_Cine_Compact_1_4K-Projector.jpg|5000",   // Proiettore 4K
  "a5-v-cinema#1": "b/b5/Home_Theater.jpg|6000",   // Impianto audio 5.1
  "a5-v-cinema#2": "2/2f/Sala_de_cine.jpg|4128",   // Telo motorizzato da 120 pollici
  "a5-v-cinema#3": "e/e2/LG_smart_TV.jpg|1700",   // Un anno di Netflix Premium
  "a5-v-cinema#4": "9/99/Popcorn_Pumper_1.JPG|763",   // Macchina per i popcorn
  "a5-v-lettore#0": "d/df/Interior_of_Bibliothèque_Mazarine_003.JPG|2848",   // Libreria a muro su misura
  "a5-v-lettore#1": "b/b5/Easy_chair,_probably_Boston,_Massachusetts,_1760-1780,_mahogany,_soft_maple,_reproduction_wool_upholstery_-_Winterthur_Museum_-_DSC01384.JPG|3573",   // Poltrona da lettura
  "a5-v-lettore#2": "4/45/2023_Amazon_Kindle_Paperwhite_(2).jpg|3955",   // Kindle Paperwhite
  "a5-v-lettore#3": "7/76/Bookmark_-_DPLA_-_7d3502bb67b3bcf1c200c73a297e8eeb.jpg|3044",   // Segnalibro in pelle
  "a5-v-chef#0": "8/8b/Tournedos_Rossini_with_Truffle_Madeira_Sauce.jpg|4000",   // Cena per due in un tre stelle
  "a5-v-chef#1": "f/f8/Nakiri.jpg|6000",   // Set di coltelli giapponesi
  "a5-v-chef#2": "7/75/Tuber_magnatum.jpg|3072",   // Tartufo bianco d'Alba, 50 g
  "a5-v-chef#3": "1/1c/Preparing_Sushi_with_Chef_Eviatar_Churi_in_4Chef_Culinary_School_kitchen,_Israel.jpg|2657",   // Corso di cucina con uno chef
  "a5-v-sommelier#0": "5/58/Mindful_wine_tasting_-_February_2023_-_Sarah_Stierch_02.jpg|4032",   // Corso da sommelier, primo livello
  "a5-v-sommelier#1": "5/5c/Brunello_di_Montalcino,_Tuscany,_Italy_(5867744955).jpg|3456",   // Sei bottiglie di Brunello di Montalcino
  "a5-v-sommelier#2": "7/76/Dom_Perignon_1999.jpg|1875",   // Champagne Dom Pérignon
  "a5-v-sommelier#4": "8/8f/Kellnermesser_p1000026.jpg|1902",   // Cavatappi da sommelier
  "a5-v-gelato#0": "d/d6/Gelato_ice_cream.jpg|5248",   // Corso da gelatiere
  "a5-v-gelato#1": "3/35/EismaschineBoku_(cropped).JPG|1495",   // Gelatiera col compressore
  "a5-v-gelato#2": "1/12/Ice_cream_push_cart_at_indoor_event_venue_California.jpg|2258",   // Carretto dei gelati d'epoca
  "a5-v-gelato#3": "d/da/Strawberry_ice_cream_cone_(5076899310).jpg|524",   // Un cono da tre gusti
  "a5-v-nonna#0": "7/78/Thermomix_2014.jpg|1180",   // Bimby TM7
  "a5-v-nonna#1": "4/42/Red_KitchenAid_Artisan.jpg|2351",   // Planetaria KitchenAid
  "a5-v-nonna#2": "0/04/Pierogi,_Gniezno,_Polonia1.jpg|3421",   // Spianatoia e mattarello
  "a5-v-nonna#3": "4/42/Tortellini_Bolognesi.jpg|2592",   // Tortellini fatti a mano, 1 kg
  "a5-v-pulizie#1": "4/4e/Vorwerk_Folletto_VK136.jpg|450",   // Folletto Vorwerk
  "a5-v-pulizie#2": "f/f5/Roomba_original.jpg|800",   // Robot aspirapolvere
  "a5-v-pulizie#3": "b/b0/BroomsforSale.jpg|948",   // Scopa di saggina
  "a5-v-bucato#0": "a/a1/Whirlpool_Cabrio_Dryer.jpg|2268",   // Asciugatrice a pompa di calore
  "a5-v-bucato#1": "e/ec/LG_드럼세탁기와_식기세척기,_영국서_물사용_효율_최우수_제품_수상.jpg|770",   // Lavatrice da 9 kg
  "a5-v-bucato#2": "9/9f/Electric_steam_iron.jpg|4301",   // Ferro da stiro con caldaia
  "a5-v-bucato#3": "6/6b/Mini_Clothespins_-_Flickr_-_places_lost.jpg|1920",   // Mollette, 50 pezzi
  "a5-v-casa-smart#0": "a/a1/Three_Surveillance_cameras.jpg|1815",   // Impianto d'allarme con le telecamere
  "a5-v-casa-smart#1": "0/05/Nest_Diamond_Thermostat.jpg|768",   // Termostato smart
  "a5-v-casa-smart#2": "8/88/Nest_Yale_(cropped).jpg|1590",   // Serratura smart
  "a5-v-casa-smart#3": "e/e6/Amazon_Echo_Plus_02.jpg|5184",   // Altoparlante Amazon Echo
  "a5-v-casa-smart#4": "1/11/Las_Vegas_Convention_Center_Loop.jpeg|5358",   // Lampadine smart, 4 pezzi
  "a5-v-bagno#0": "7/7e/EFTA00000038_-_Modern_bathroom_featuring_a_white_sink_cabinets_and_a_glass_shower_enclosure_with_tiled_floor.jpg|768",   // Rifare il bagno
  "a5-v-bagno#1": "6/6f/Ducha_largando_agua.jpg|4032",   // Box doccia in cristallo
  "a5-v-bagno#2": "a/a2/Bademantel.JPG|306",   // Accappatoio morbido
  "a5-v-bagno#3": "8/85/Yellow_Rubber_Duck.jpg|4080",   // Paperella di gomma
  "a6-v-cane#0": "7/71/Dog_food_in_a_bowl.jpg|2096",   // Un anno di crocchette buone
  "a6-v-cane#1": "a/a0/Military_Working_Dog_Training_in_Germany_(6056710).jpg|10800",   // Corso di educazione cinofila
  "a6-v-cane#2": "4/4a/Pet_Microchip_Injection_and_Scanner_(17400108206).jpg|3264",   // Vaccini e microchip
  "a6-v-cane#3": "7/7e/Cindy_(25582240224).jpg|5472",   // Recinto e casetta in giardino
  "a6-v-cane#4": "9/94/DSC09611a_Search_and_Rescue_Dog,_Austrian_Red_Cross_Perchtoldsdorf,_2024-10.jpg|3195",   // Guinzaglio e collare
  "a6-v-gatto#0": "3/39/Gastrointestinal_Haiball_cat_dry_food_(Royal_Canin).jpg|4032",   // Un anno di cibo umido
  "a6-v-gatto#1": "f/f7/Japanese_litter_box.jpg|3216",   // Lettiera autopulente
  "a6-v-gatto#2": "4/43/Lotus-Espresso-Full-Final-window-a.jpg|2336",   // Albero tiragraffi gigante
  "a6-v-gatto#3": "1/1a/Mindy_Mouse_cat_toy.jpg|400",   // Topolino giocattolo
  "a6-v-gatto#4": "d/d1/Surgery_performed_on_a_domestic_cat.jpg|5184",   // Un anno di veterinario
  "a6-v-acquario#0": "a/a8/Amaterske_akvarium.jpg|1885",   // Acquario da 300 litri
  "a6-v-acquario#1": "9/97/Neonsalmler_Paracheirodon_innesi.jpg|3000",   // Venti pesci tropicali
  "a6-v-acquario#2": "e/e7/58g_aquascape.jpg|550",   // Piante e sassi per il fondo
  "a6-v-cavallo#0": "7/73/Horse_stable_-_Middletown.jpg|3548",   // Un anno di pensione per un cavallo
  "a6-v-cavallo#1": "c/c5/Showjumping.JPG|2272",   // Venti lezioni di equitazione
  "a6-v-cavallo#2": "b/b4/Fieldboots.jpg|1500",   // Stivali da equitazione e casco
  "a6-v-cavallo#3": "f/f0/Sardined_Carrots.jpg|4032",   // Un sacco di carote
  "a6-v-sposa#0": "3/36/Bride_north_america.jpg|426",   // Abito da sposa
  "a6-v-sposa#1": "c/ce/Fede_nuziale_Classica.jpg|939",   // Due fedi nuziali in oro
  "a6-v-sposa#2": "b/bc/Cosmetics.JPG|640",   // Trucco e acconciatura
  "a6-v-sposa#3": "0/06/Wedding_bouquet_white_roses.jpg|958",   // Bouquet della sposa
  "a6-v-sposa#4": "6/6e/Uncooked_ST25_rice_on_bamboo_surface.jpg|2633",   // Riso da lanciare, 1 kg
  "a6-v-nubilato#0": "e/ef/SF_maig_2_cropped.jpg|1227",   // Voli e due notti per sei amiche
  "a6-v-nubilato#1": "a/a2/Flamenco_en_el_Palacio_Andaluz,_Sevilla,_España,_2015-12-06,_DD_02.JPG|6211",   // Spettacolo di flamenco, per sei
  "a6-v-nubilato#2": "9/93/WIN_t-shirt.JPG|1665",   // Sei magliette uguali
  "a6-v-nubilato#3": "d/d8/Évrard_e_frédéric_bapst,_diadema_della_duchessa_d'anguoleme,_smeraldi,_diamanti,_oro_e_argento,_parigi_1819-20.jpg|2452",   // Coroncina col velo
  "a6-v-halloween#0": "1/17/Castelul_Bran2.jpg|3791",   // Viaggio in Transilvania, per due
  "a6-v-halloween#1": "a/a5/Entrance_of_Gardaland.jpg|500",   // Gardaland Magic Halloween
  "a6-v-halloween#3": "9/90/Colorful_candy.jpg|3088",   // Caramelle, 2 kg
  "a6-v-halloween#4": "5/53/Balle-à-leunettes_10.jpg|708",   // Zucca gigante
  "a6-v-carnevale#0": "4/4b/Desfile_Portela_2014_(906185).jpg|4256",   // Viaggio al Carnevale di Rio, per due
  "a6-v-carnevale#1": "e/e4/SAND_Maurice_Masques_et_bouffons_01.jpg|579",   // Costume da Arlecchino
  "a6-v-carnevale#2": "9/9a/Carnevaleviareggio.jpg|360",   // Biglietto per i corsi mascherati
  "a6-v-carnevale#3": "7/79/Faworki_(close-up).jpg|1152",   // Un vassoio di chiacchiere
  "a6-v-carnevale#4": "1/19/Confetti_au_Moma.jpg|867",   // Coriandoli e stelle filanti
  "a6-v-capodanno#0": "a/a6/Ormont-Dessus,_Vers-L'Eglise,_route_de_Brison_2.jpg|4560",   // Tre notti in baita
  "a6-v-capodanno#1": "1/11/Hanabi_in_Adachi-ku1.jpg|2468",   // Cenone di Capodanno per due
  "a6-v-capodanno#2": "1/1a/Franciacorta_milledi.jpg|1639",   // Franciacorta
  "a6-v-capodanno#3": "0/0c/Cotechino-Servito-Polenta-Lenticchie.jpg|1435",   // Cotechino e lenticchie
  "a6-v-pasqua#0": "f/f7/Acquanegra_sul_Chiese-Oasi_Le_Bine.JPG|3770",   // Pranzo di Pasqua in agriturismo
  "a6-v-pasqua#1": "6/6a/Grilling_sausages_empanadas_barbecue_charcoal.jpg|1000",   // Grigliata di Pasquetta per dieci
  "a6-v-pasqua#2": "e/ec/Easter_egg_with_foil.jpg|1739",   // Uovo di cioccolato gigante
  "a6-v-pasqua#3": "e/ee/Colomba_pasquale,_edizione_2013_-_ND0_4662_(8564331585).jpg|5184",   // Colomba artigianale
  "a6-v-pasqua#4": "2/2b/Sevilla_Cathedral_-_Southeast.jpg|3900",   // Settimana Santa a Siviglia, per due
  "a6-v-ferragosto#0": "6/68/La_costa_di_Riccione.jpg|1920",   // Una settimana a Riccione
  "a6-v-ferragosto#1": "2/2c/Strand_in_Borsh.jpg|600",   // Ombrellone per tutta l'estate
  "a6-v-ferragosto#2": "2/2f/DFC_1862_Two_colorful_inflatable_pool_floats_-_a_pink_flamingo_and_a_green_turtle_-_resting_on_the_sandy_shore_as_gentle_waves_lap_nearby.jpg|5568",   // Materassino a fenicottero
  "a6-v-ferragosto#3": "5/50/Pedalo_with_slide.jpg|1600",   // Pedalò per un'ora
  "a6-v-ferragosto#4": "4/40/Watermelons.jpg|1061",   // Anguria
  "a6-v-san-valentino#0": "a/ae/Promise_ring_in_casket.JPG|1200",   // Anello con diamante
  "a6-v-san-valentino#1": "f/fb/DZ6_2628_Cozy_candlelit_dinner_for_two_elegant_Thai_restaurant_setting_with_twinkling_lights_and_a_delicate_orchid_centerpiece.jpg|6048",   // Cena romantica per due
  "a6-v-san-valentino#2": "6/64/BEAUTIFUL_RED_ROSES.jpg|2448",   // Dodici rose rosse
  "a6-v-san-valentino#3": "a/a6/Baci_perugina.jpg|2400",   // Scatola di Baci Perugina
  "a6-v-mamma#0": "e/e2/Dyson_Supersonic_Hair_Dryer_1_2017-01-28.jpg|3024",   // Asciugacapelli Dyson Supersonic
  "a6-v-mamma#1": "0/0c/Charm_Bracelet_made_by_SF_Bay_Area_Silver_Clay_Group.jpg|3072",   // Bracciale Pandora con ciondoli
  "a6-v-mamma#2": "8/8b/Medicinal_spa_of_Harkány.jpg|400",   // Una giornata alle terme
  "a6-v-mamma#3": "7/79/Orchid_in_pot.jpg|2810",   // Orchidea in vaso
  "a6-v-mamma#4": "a/a8/Tour_Eiffel_Wikimedia_Commons.jpg|2900",   // Weekend a Parigi, per due
  "a6-v-scuola#0": "c/ca/Keyboard_with_tablet.jpg|4576",   // Tablet per la scuola
  "a6-v-scuola#1": "e/e6/Japanese_textbooks.jpg|640",   // I libri delle medie, un anno
  "a6-v-scuola#2": "d/d7/Rucksack1.jpg|1458",   // Zaino della scuola
  "a6-v-scuola#3": "7/79/English-English_dictionaries_and_thesaurus_books.JPG|3510",   // Un anno di lezioni d'inglese
  "a6-v-festa-bimbi#0": "2/21/Balloon_vendor.JPG|2560",   // Animatore per tre ore
  "a6-v-festa-bimbi#1": "8/8e/Jumping_castle.jpg|1600",   // Castello gonfiabile
  "a6-v-festa-bimbi#2": "e/e3/Torta_di_compleanno_-_Birthday_cakes_of_Italy_-_fruit_Meringue_Whipped_cream_from_traditional_pastry_of_Milan.jpg|3241",   // Torta per 30 bambini
  "a6-v-festa-bimbi#3": "7/70/Sleeping_Beauty_Castle_Disneyland_Anaheim_2013.jpg|2172",   // Weekend a Disneyland Paris, per quattro
  "a6-v-festa-bimbi#4": "2/2e/Italy_-_birthday_cake_with_candles_5.jpg|2625",   // Candeline magiche
  "a6-v-elettrico#0": "a/ab/Tesla_Model_3_(2023)_Autofrühling_Ulm_IMG_9282.jpg|5156",   // Tesla Model 3
  "a6-v-elettrico#1": "e/ed/Solar_panels_in_Brussels_-_P060781-269644.jpg|4000",   // Pannelli solari sul tetto
  "a6-v-elettrico#2": "7/7c/TeslaV2DualCable.jpg|1474",   // Wallbox in garage
  "a6-v-elettrico#3": "7/7c/2015_Kłodzko,_ul._Dusznicka,_myjnia_samochodowa_02.jpg|4680",   // Lavaggio a mano
  "a6-v-cinquecento#0": "a/a1/1970_Fiat_500_L_--_2011_DC_1.jpg|2178",   // Fiat 500 d'epoca restaurata
  "a6-v-cinquecento#1": "7/79/Fotografía_de_taller.jpg|4032",   // Tagliando dal meccanico
  "a6-v-cinquecento#2": "f/ff/Covered_car_in_foch.jpg|4608",   // Telo copriauto
  "a6-v-scooter#0": "a/a7/2023_Piaggio_Liberty_S_125_ABS.jpg|1438",   // Piaggio Liberty 125
  "a6-v-scooter#1": "a/a7/Xiaomi_M365_blanche.jpg|3024",   // Monopattino elettrico
  "a6-v-scooter#2": "6/6e/Open-face_helmet_kallerna.JPG|2814",   // Casco jet
  "a6-v-scooter#3": "6/6a/City_bike_locked_with_a_U-lock,_with_wheels_secured_by_a_steel_cable._Tomaszów_Mazowiecki,_Poland.jpg|4096",   // Antifurto ad arco
  "a6-v-fuoristrada#0": "1/13/2019_Suzuki_Jimny_SZ5_4X4_Automatic_1.5.jpg|2724",   // Suzuki Jimny
  "a6-v-fuoristrada#1": "4/47/Toyota_hilux_with_roof_tents.jpg|2299",   // Tenda da tetto
  "a6-v-fuoristrada#3": "d/db/LED_headlamp_(1).jpg|1412",   // Torcia frontale
  "a6-v-campeggio#0": "c/c8/Caravan.jpg|813",   // Roulotte usata
  "a6-v-campeggio#1": "a/a5/Large_family_camping_tent.jpg|4640",   // Tenda per quattro
  "a6-v-campeggio#2": "2/2e/Mummy_bag.jpg|1536",   // Due sacchi a pelo
  "a6-v-campeggio#3": "7/75/Portable_stove.jpg|320",   // Fornellino da campeggio
  "a6-v-campeggio#4": "0/0e/Enbrighten_LED_Camping_Lantern.jpg|2284",   // Lanterna
  "a6-v-surf#0": "6/69/Italian_surfer_2.JPG|2209",   // Una settimana di surf camp
  "a6-v-surf#1": "e/e8/Waikiki_Beach_(15077335153).jpg|4435",   // Tavola da surf
  "a6-v-surf#2": "7/73/Wetsuit_a.jpg|508",   // Muta da surf
  "a6-v-surf#3": "9/9c/Randy_carrasco_qs_wax_comb.jpg|655",   // Cera per la tavola
  "a6-v-sub#0": "8/8b/Gulf_of_Eilat_(Red_Sea)_coral_reefs.jpg|984",   // Una settimana di immersioni nel Mar Rosso
  "a6-v-sub#1": "2/29/Underwater_photograph_of_a_recreational_scuba_diver_in_Playa_del_Carmen_2006.jpg|691",   // Brevetto da sub
  "a6-v-sub#2": "2/2b/Dive_computer_logbook.jpg|1944",   // Computer subacqueo
  "a6-v-sub#3": "8/85/Diving_half_mask_with_bifocal_lenses_P5180288.JPG|3648",   // Maschera e boccaglio
  "a6-v-pittore#1": "e/ef/Foldable_table_easel_in_Tuntorp_1.jpg|2570",   // Cavalletto da studio
  "a6-v-pittore#2": "b/bc/Various_colors_of_oil_paint_tubes_4.jpg|3880",   // Colori a olio professionali
  "a6-v-pittore#4": "6/66/Louvre_Museum_Wikimedia_Commons.jpg|6740",   // Viaggio a Parigi coi musei, per due
  "a6-v-stelle#0": "d/d3/Aurora_borealis_over_Eielson_Air_Force_Base,_Alaska.jpg|3008",   // Viaggio in Lapponia
  "a6-v-stelle#1": "b/b2/Celestron_EdgeHD_with_solar_filter.jpg|1657",   // Telescopio Celestron
  "a6-v-stelle#2": "f/f3/Consul_10x40.jpg|1741",   // Binocolo
  "a6-v-stelle#3": "9/90/Custer_Astronomical_Observatory_-_Southold_New_York_USA_-_Dome_and_Radio_Telescope.jpg|5184",   // Una notte all'osservatorio
  "a6-v-stelle#4": "5/5d/Barritt-Serviss_Star_and_Planet_Finder.png|2000",   // Mappa del cielo
  "a6-v-mugello#0": "b/bb/Hyodo_leather_suit_(9546192593).jpg|2448",   // Tuta in pelle da moto
  "a6-v-mugello#1": "c/cf/Motorcycle_helmet_crashed_chin_bar.jpg|1493",   // Casco integrale da pista
  "a6-v-mugello#2": "f/f9/Mugello_circuit_gare_in_corso.jpg|3984",   // Tribuna al Mugello
  "a6-v-mugello#3": "9/9f/RacingFlagsJune2007.jpg|1115",   // Bandiera del pilota
  "a6-v-erasmus#0": "0/03/Fantoft_room_03.jpg|800",   // Stanza per cinque mesi
  "a6-v-erasmus#2": "f/fd/Ryanair,_EI-DYZ,_Boeing_737-8AS_(49585974527).jpg|1200",   // Volo low cost
  "a6-v-erasmus#3": "c/c0/Suitcase1.jpg|1267",   // Valigia grande
  "a6-v-erasmus#4": "e/ed/01_Paella_Valenciana_original.jpg|1600",   // Paella per due
  "a6-v-sanremo#0": "7/72/Teatro_Ariston_Sanremo.jpg|5400",   // Biglietto per la finale del Festival
  "a6-v-sanremo#1": "8/8a/Sanremo_Casino_3.jpg|5400",   // Una notte a Sanremo
  "a6-v-sanremo#3": "f/f4/Various-microphones.JPG|1672",   // Microfono da karaoke
  "a6-v-sanremo#4": "a/ac/Detail_of_a_Victor_Stiebel_evening_dress,_late_1950s.jpg|1074",   // Abito da sera da red carpet
  "a6-v-concerto#0": "1/17/Stadio_Meazza_2021_3.jpg|4728",   // Una notte a Milano
  "a6-v-concerto#1": "9/92/FS_Trenitalia_ETR400_15_(50832499597).jpg|3783",   // Frecciarossa per Milano
  "a6-v-concerto#2": "a/a7/Dülmen,_Dülmener_Sommer,_Open-Air-Konzert,_\"Bounce\"_--_2018_--_0051.jpg|6720",   // Pacchetto VIP per due
  "a6-v-concerto#3": "6/61/EPMD_Business_as_Usual_(shirt).jpg|445",   // Maglietta del tour
  "a6-v-concerto#4": "7/7b/Po'Boy_Preservation_Festival_Hot_Sausage_Sandwich.jpg|640",   // Panino con la salamella
  "a6-v-terme#0": "5/50/Sauna_2.jpg|334",   // Sauna finlandese per casa
  "a6-v-terme#1": "1/1e/Grand_Hotel_Orologio_ad_Abano_Terme,_vista_di_tre_quarti.jpg|3961",   // Due notti in un resort termale
  "a6-v-terme#3": "f/f2/Slippers.jpg|1280",   // Ciabatte da spa
  "a6-v-stipendio#0": "f/fd/IPhone_17_Pro_(2025-12-28).jpg|4032",   // iPhone 17 Pro
  "a6-v-stipendio#1": "b/b9/AirPods_Pro_3_with_case.jpg|695",   // AirPods Pro
  "a6-v-stipendio#2": "6/62/Barbieri_-_ViaSophia25668.jpg|2320",   // Cena fuori coi genitori
  "a6-v-stipendio#3": "e/e2/Sparschwein_Haspa02.jpg|1061",   // Porcellino salvadanaio
  "a6-v-trasloco#0": "0/08/1979_Fiat_130NT_truck,_The_Van_From_Snowy_River_Removals_(2010-07-05).jpg|1422",   // Ditta di traslochi
  "a6-v-trasloco#1": "5/50/Europäisch-Kurzhaar-Kater_Nikita_2013-12-17_auf_Stapel_aus_Umzugskartons.jpg|2736",   // Trenta scatoloni
  "a6-v-trasloco#2": "a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg|1024",   // Pizza per chi aiuta
  "a6-v-trasloco#3": "2/25/Sticky_tape.jpg|713",   // Nastro adesivo da pacchi
  "a6-v-campagna#0": "a/a4/Motocoltivatore_Goldoni.jpg|4160",   // Motocoltivatore
  "a6-v-campagna#1": "a/ae/-2019-05-21_Chicken_coop,_Trimingham_(3).JPG|5152",   // Pollaio in legno
  "a6-v-campagna#2": "8/84/Male_and_female_chicken_sitting_together.jpg|959",   // Sei galline ovaiole
  "a6-v-campagna#3": "7/76/Sievi_Boots_(2).jpg|1337",   // Stivali di gomma
  "a6-v-sushi#0": "6/60/Sushi_platter.jpg|1614",   // Cena omakase per due
  "a6-v-sushi#1": "7/75/Yanagiba_(front).jpg|6000",   // Coltello da sushi
  "a6-v-sushi#2": "a/ac/Osaka_Castle_Nishinomaru_Garden_April_2005.JPG|1280",   // Una settimana a Osaka, per due
  "a6-v-sushi#3": "2/29/Short-grain_rice_(japonica).jpg|5184",   // Riso per sushi, 5 kg
  "a6-v-sushi#4": "4/4d/Western_Han_Lacquered_Wood_Chopsticks_(10095334314).jpg|5184",   // Bacchette laccate
  "a6-v-lucca#0": "1/1b/Magic_Armor_Link_TP_001.jpg|2448",   // Costume da cosplay
  "a6-v-lucca#1": "d/d4/Wacom_graphics_tablet_and_pen.png|1490",   // Tavoletta grafica
  "a6-v-lucca#2": "1/1a/Lucca_Comics_2009_-_04.jpg|3264",   // Biglietto per tutti i giorni
  "a6-v-lucca#3": "3/30/MuseoFerrocarrilSLP19.JPG|6016",   // Fumetto autografato
  "a6-v-lucca#4": "d/d6/Downtown_San_Diego_021.jpg|4912",   // Viaggio al Comic-Con di San Diego, per due
  "a6-v-harry-potter#0": "d/d5/King's_Cross_station,_August_2014.jpg|1280",   // Tre notti a Londra
  "a6-v-harry-potter#2": "b/bc/Virgin_atlantic_b747-400_lady_penelope_arp.jpg|2847",   // Due voli per Londra
  "a6-v-harry-potter#3": "c/c8/Hogwarts_Express_(46637633634).jpg|1536",   // Visita agli studi di Harry Potter
  "a6-v-harry-potter#4": "c/cf/Tiwi_dance_wand_CAC.JPG|1588",   // Bacchetta magica
  "a6-v-dolomiti#0": "c/c2/Via_ferrata_Strobel_in_Italy.jpg|640",   // Guida alpina per un giorno
  "a6-v-dolomiti#1": "c/cc/Alt-Berg_Defenders_8528.jpg|3000",   // Scarponi da trekking
  "a6-v-dolomiti#2": "d/d8/Hotel_Mezdi_Seiser_Alm.jpg|6276",   // Una settimana in hotel sulle Dolomiti
  "a6-v-dolomiti#3": "1/15/RS_122.jpg|2000",   // Una notte in rifugio
  "a6-v-dolomiti#4": "a/a6/TrekkingPolesCarbonWoman.jpg|1200",   // Bastoncini da trekking
  // ---- i prodotti nuovi (data/prezzo-7.js, 23 ott 2026): scelte dal nome da aiutanti Sonnet e guardate tutte a occhio ----
  "a7-pomodori-pelati-mutti-400-g": "0/03/Peeling_tomatoes-01.jpg|1741",   // Pomodori pelati Mutti, 400 g
  "a7-penne-rigate-de-cecco-n-41-500-g": "0/0b/Pennelisce_closeup.png|2932",   // Penne rigate De Cecco n.41, 500 g
  "a7-riso-carnaroli-gallo-1-kg": "3/33/Carnaroli.jpg|3285",   // Riso Carnaroli Gallo, 1 kg
  "a7-corn-flakes-kellogg-s-375-g": "9/9c/Photo_cornflakes.jpg|5184",   // Corn Flakes Kellogg's, 375 g
  "a7-philadelphia-original-150-g": "f/f7/Philly_cream_cheese.jpg|2700",   // Philadelphia Original, 150 g
  "a7-estathe-al-limone-1-5-litri": "e/ef/Iced_Tea_from_flickr.jpg|3744",   // Estathé al limone, 1,5 litri
  "a7-maionese-calve-225-ml": "8/87/Mayonnaise_Jar_550x900.JPG|550",   // Maionese Calvè, 225 ml
  "a7-kinder-bueno-3-barrette": "a/a1/Kinder_Bueno_-_4_halfed.jpg|3576",   // Kinder Bueno, 3 barrette
  "a7-pesto-alla-genovese-barilla-190-g": "c/c9/BasilPesto.JPG|2760",   // Pesto alla genovese Barilla, 190 g
  "a7-ketchup-heinz-400-ml": "d/d3/Heinz_Tomato_Ketchup,_Canada_(front),_2026-02-19.jpg|3536",   // Ketchup Heinz, 400 ml
  "a7-birra-moretti-6-bottiglie-da-33-cl": "a/a9/Birra_Moretti_beer_bottle.jpg|1536",   // Birra Moretti, 6 bottiglie da 33 cl
  "a7-mascarpone-granarolo-250-g": "2/26/Mascarpone_2.jpg|5472",   // Mascarpone Granarolo, 250 g
  "a7-ricotta-fresca-granarolo-250-g": "d/da/Ricotta_fresca.jpg|3840",   // Ricotta fresca Granarolo, 250 g
  "a7-burro-250-g": "3/3c/Block_of_butter_in_butter_dish.jpg|3024",   // Burro, 250 g
  "a7-wurstel-wudy-grill-3-pezzi": "8/8b/Wiener_Wuerstchen_(fcm).jpg|2700",   // Wurstel Aia Wudy Grill, 3 pezzi (250 g)
  "a7-pan-bauletto-mulino-bianco-400-g": "3/39/Breadindia.jpg|640",   // Pan Bauletto Mulino Bianco, 400 g
  "a7-yogurt-activia-bianco-4-vasetti": "7/7a/Yasuda_yogurt_150ml.jpg|640",   // Yogurt Activia bianco, 4 vasetti
  "a7-prosecco-doc-brut-75-cl": "c/ce/Prosecco_di_Conegliano_bottle_and_glass.jpg|2406",   // Prosecco DOC brut, 75 cl
  "a7-olio-di-semi-di-girasole-1-litro": "3/33/Bottle_1_liter_Sunflower_refined_oil.jpg|1200",   // Olio di semi di girasole, 1 litro
  "a7-tavoletta-milka-al-latte-100-g": "9/90/Milka_Alpine_Milk_Chocolate_bar_100g.jpg|2960",   // Tavoletta Milka al latte, 90 g
  "a7-orsetti-d-oro-haribo-175-g": "3/3e/Haribo_Goldbears_(3549536631).jpg|3648",   // Orsetti d'oro Haribo, 175 g
  "a7-petto-di-pollo-a-fette-400-g": "3/31/Fresh_Raw_Chicken_Parts_on_Display.jpg|2048",   // Petto di pollo a fette, 400 g
  "a7-gnocchetti-di-patate-rana-500-g": "e/e7/Gnocchi_di_patate_con_sugo_di_pomodoro_e_con_gorgonzola.jpg|4032",   // Gnocchetti di patate Rana, 500 g
  "a7-cornetto-algida-classico-6-gelati": "f/fb/Cornetto_Algida_Ice_Cream.jpg|612",   // Cornetto Algida classico, 6 gelati
  "a7-patate-2-kg": "a/ab/Patates.jpg|2864",   // Patate, 2 kg
  "a7-cipolle-dorate-1-kg": "a/a1/Yellow_onions_vegetables.jpg|1280",   // Cipolle dorate, 1 kg
  "a7-uva-bianca-1-kg": "5/5f/Grapes_(2).jpg|2724",   // Uva bianca, 1 kg
  "a7-castagne-1-kg": "f/fb/Chestnuts_roasted.jpg|1280",   // Castagne, 1 kg
  "a7-zucca-1-kg": "c/cd/Fruits_and_Vegetables_(20161021-AMS-LSC-0146).jpg|4710",   // Zucca, 1 kg
  "a7-cozze-1-kg": "4/45/CornishMussels.JPG|2500",   // Cozze, 1 kg
  "a7-fagioli-cannellini-in-scatola-400-g": "e/ef/White_kidney_beans🫘.jpg|3000",   // Fagioli cannellini in scatola, 400 g
  "a7-limoni-1-kg": "e/e4/P1030323.JPG|1280",   // Limoni, 1 kg
  "a7-insalata-mista-in-busta-150-g": "8/85/New_Lettuce_(6193662526).jpg|4106",   // Insalata mista in busta, 150 g
  "a7-pomodori-ramati-1-kg": "b/be/Grape_tomatoes_on_the_vine_at_Ljubljana_Central_Market.JPG|4592",   // Pomodori ramati, 1 kg
  "a7-pane-1-kg": "7/7b/Assorted_bread.jpg|709",   // Pane, 1 kg
  "a7-salsiccia-di-maiale-500-g": "d/d8/Salsiccia_Italian_pork_sausage.jpg|3888",   // Salsiccia di maiale, 500 g
  "a7-ananas-uno-intero": "e/eb/Fresh_whole_pineapples.jpg|1816",   // Ananas, uno intero
  "a7-zucchine-1-kg": "a/ac/Zucchini_in_basket_2021_G1.jpg|4100",   // Zucchine, 1 kg
  "a7-filetto-di-salmone-1-kg": "2/24/Raw_salmon_fillets.jpg|2816",   // Filetto di salmone, 1 kg
  "a7-gamberi-rossi-di-mazara-1-kg": "c/ca/Fish4525_-_Flickr_-_NOAA_Photo_Library.jpg|2896",   // Gamberi rossi di Mazara, 1 kg
  "a7-filetto-di-manzo-1-kg": "1/12/Beef_tenderloin.jpg|148",   // Filetto di manzo, 1 kg
  "a7-orata-1-kg": "d/d6/Sparus_aurata_-_Goldbrasse_167478208.jpg|2048",   // Orata, 1 kg
  "a7-funghi-porcini-freschi-1-kg": "3/34/Boletus_edulis_IT.jpg|3072",   // Funghi porcini freschi, 1 kg
  "a7-chianti-classico-75-cl": "0/00/Chianti_Classico_example_bottle_-_Annata_type.jpg|3385",   // Chianti Classico, 75 cl
  "a7-cosciotto-d-agnello-1-kg": "8/83/Roast_lamb_leg.jpg|2736",   // Cosciotto d'agnello, 1 kg
  "a7-polpo-fresco-1-kg": "9/9f/Octopus_vulgaris_2.jpg|3332",   // Polpo fresco, 1 kg
  "a7-aperol-spritz-al-caffe-florian": "5/59/Aperol_Spritz_2014a.jpg|3000",   // Aperol Spritz al Caffè Florian
  "a7-acqua-minerale-al-caffe-florian": "c/c5/Venedig_Caffè_Florian_Eingang-20110312-RM-185109.jpg|3456",   // Acqua minerale al Caffè Florian
  "a7-caffe-al-tavolo-in-piazzetta": "0/08/LA_Piazzetta.JPG|3840",   // Caffè al tavolo in Piazzetta
  "a7-pizza-marinara": "1/11/Pizza_marinara.jpg|2848",   // Pizza marinara
  "a7-tajarin-al-tartufo-bianco": "5/54/2016_1129_Turin_Tajarin_al_Castelmagno.jpg|3456",   // Tajarin al tartufo bianco
  "a7-aperitivo-con-buffet": "d/d7/Aperitivo_al_bar.jpg|7200",   // Aperitivo con buffet
  "a7-cocktail-in-un-rooftop": "8/80/15-09-26-RalfR-WLC-0084.jpg|2368",   // Cocktail in un rooftop
  "a7-pizza-a-portafoglio": "a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg|1024",   // Pizza a portafoglio
  "a7-orzo-in-tazza-grande": "4/4b/Caffè_d'orzo_(89397).jpg|3000",   // Orzo in tazza grande
  "a7-marocchino": "c/c2/Marocchino_(26440403402).jpg|1080",   // Marocchino
  "a7-cioccolata-calda-con-panna": "9/92/Hot_chocolate_with_whipped_cream_and_dried_berries_(Vegan,_KETO,_LCHF,_Low_Carb,_Gluten_free,_FIT)_-_52774784724.jpg|2659",   // Cioccolata calda con panna
  "a7-bicerin": "8/86/2016_1128_Turin_Bicerin_01.jpg|3072",   // Bicerin
  "a7-un-ombra-di-vino": "4/42/\"_05_-_ITALY_-_un_bacaro_a_Venezia_Osteria_appetizers_restaurant_in_Venice_wine_enoteca.jpg|2910",   // Un'ombra di vino
  "a7-cicchetto-di-baccala-mantecato": "b/bc/\"_13_-_ITALY_-_Cicchetti_Venetian_cuisine_appetizers_restaurant_(_not_are_tapas_are_ciccheti_of_Venice)_in_this_pics_Baccalà_mantecato_(Cod).jpg|3264",   // Cicchetto di baccalà mantecato
  "a7-pasticciotto-leccese": "8/82/Pasticciotto.jpg|3256",   // Pasticciotto leccese
  "a7-baba": "1/10/BabaRum.jpg|3434",   // Babà
  "a7-maritozzo-con-la-panna": "d/db/Maritozzo_con_panna.jpg|3000",   // Maritozzo con la panna
  "a7-panino-con-la-milza": "e/e3/Pani_ca_meusa.jpg|3968",   // Panino con la milza
  "a7-panino-con-la-mortadella": "f/f7/Marjolaine_2016_20.jpg|1920",   // Panino con la mortadella
  "a7-olive-all-ascolana": "1/10/Olive_all'ascolana.jpg|1000",   // Olive all'ascolana
  "a7-crodino": "4/48/Bottle_of_Crodino.JPG|1296",   // Crodino
  "a7-coca-cola-in-bottiglietta": "e/ef/Coca-Cola_glass_bottle.jpg|3024",   // Coca-Cola in bottiglietta
  "a7-affogato-al-caffe": "7/7a/Espresso_Affogato.JPG|2248",   // Affogato al caffè
  "a7-parmigiana-di-melanzane": "7/72/Parmigiana_di_melanzane.jpg|4272",   // Parmigiana di melanzane
  "a7-pasta-alla-norma": "e/e4/Pasta_alla_Norma_-_Wiki_Loves_Sicilia.jpg|3820",   // Pasta alla Norma
  "a7-cacio-e-pepe": "0/0d/Spaghetti_cacio_e_pepe_(creamy_as_it_should_be).jpg|3008",   // Cacio e pepe
  "a7-risotto-alla-milanese": "8/83/Risotto_alla_Milanese.JPG|3648",   // Risotto alla milanese
  "a7-pizzoccheri-della-valtellina": "9/9f/Pizzoccheri.jpg|3072",   // Pizzoccheri della Valtellina
  "a7-pappardelle-al-cinghiale": "0/0b/Pappardelle_al_cinghiale_(cropped).jpg|2607",   // Pappardelle al cinghiale
  "a7-tagliata-di-manzo-con-rucola": "5/56/Tagliata_with_Rosemary.jpg|6000",   // Tagliata di manzo con rucola
  "a7-sei-ostriche": "d/d2/Oysters_served_on_ice,_with_lemon_and_parsley.jpg|2592",   // Sei ostriche
  "a7-poke-bowl-al-salmone": "5/55/Salmon_Poke_Bowl_(S)_with_Spicy_mayo_sauce_-_Kitokito.jpg|4032",   // Poke bowl al salmone
  "a7-il-coperto": "7/77/Lyon_Restaurant_Table_setting_20110421.jpg|3264",   // Il coperto
  "a7-bottiglia-di-prosecco": "c/ce/Prosecco_di_Conegliano_bottle_and_glass.jpg|2406",   // Bottiglia di prosecco
  "a7-menu-degustazione-stellato": "5/59/Thana_Fine_Dining_plate.jpg|240",   // Menù degustazione stellato
  "a7-dieci-pizze-margherita": "d/d4/Margherita_Originale.JPG|2048",   // Dieci pizze margherita
  "a7-pizza-al-taglio": "9/98/Pizze_al_taglio_and_Peroni_at_Alice.jpg|4032",   // Pizza al taglio
  "a7-fetta-di-torta-della-nonna": "0/02/Torta_della_Nonna.jpg|3000",   // Fetta di torta della nonna
  "a7-calice-di-franciacorta": "1/1a/Franciacorta_milledi.jpg|1639",   // Calice di Franciacorta
  "a7-menu-bambini": "a/a7/Cotoletta_e_patate_al_forno.jpg|516",   // Menù bambini
  "a7-frullato-di-frutta-fresca": "e/eb/Strawberry_and_lemon_smoothie_(14430283996).jpg|1000",   // Frullato di frutta fresca
  "a7-crepe-alla-nutella": "3/3a/Crêpes_con_la_Nutella.JPG|4320",   // Crêpe alla Nutella
  "a7-aragosta-alla-catalana": "5/5c/Capo_Gallo_Aragosta.jpg|640",   // Aragosta alla catalana
  "a7-bottiglia-di-champagne": "3/3a/Salon_Champagne_and_glass.JPG|1936",   // Bottiglia di champagne
  "a7-caffe-in-autogrill": "a/a5/Tazzina_di_caffè_a_Ventimiglia.jpg|2970",   // Caffè in autogrill
  "a7-pizza-gourmet": "5/57/Neapolitan_pizza_at_Trappica_(48701940197).jpg|3024",   // Pizza gourmet
  "a7-tortellini-in-brodo": "a/ab/Tortellini_in_brodo_Bologna.jpg|1024",   // Tortellini in brodo
  "a7-cena-di-pesce-per-sei": "a/ae/Plateau_van_zeevruchten.jpg|2029",   // Cena di pesce per sei
  "a7-spazzola-lavapiatti-con-dispenser": "a/a2/Dish-washing_brush_with_integrated_soap_dispenser.jpg|3168",   // Spazzola lavapiatti con dispenser
  "a7-colla-istantanea-attak-3-g": "7/79/Super_glue.jpg|1424",   // Colla istantanea Attak, 3 g
  "a7-metro-a-nastro-da-5-metri": "0/03/Tape_Measure_25'_Klein_Tools.jpg|1000",   // Metro a nastro da 5 metri
  "a7-levapelucchi-elettrico": "e/e9/Unix_fabric_shaver.jpg|4752",   // Levapelucchi ricaricabile
  "a7-multipresa-a-5-prese": "f/fa/Tricklestar_Plug_Strip.jpg|4032",   // Multipresa a 5 prese
  "a7-tavolino-ikea-lack-55x55-cm": "1/15/IKEA_Lack.jpg|1050",   // Tavolino IKEA Lack, 55x55 cm
  "a7-bilancia-da-cucina-ikea-3-kg": "4/4f/Escali_digital_kitchen_scale.jpg|8160",   // Bilancia da cucina IKEA, 3 kg
  "a7-martello-da-carpentiere": "7/7b/Hammer2.jpg|565",   // Martello da carpentiere
  "a7-set-di-6-bicchieri-di-vetro": "4/4b/Jewelry_pair_rock_glasses_01.jpg|369",   // Set di 6 bicchieri di vetro
  "a7-tavolino-vassoio-ikea-gladom": "d/d2/Tvtable.jpg|350",   // Tavolino vassoio IKEA Gladom
  "a7-sedia-pieghevole-da-giardino": "6/6a/Folding_Chair_Lifetime.jpg|401",   // Sedia pieghevole da giardino
  "a7-set-di-pentole-ikea-365": "1/13/All-Clad_Copper_Core_pots.jpeg|2000",   // Set di pentole IKEA 365+
  "a7-piastra-a-induzione-portatile-ikea": "7/79/Eupa_TSI-IH1880.jpg|1600",   // Piastra a induzione portatile IKEA
  "a7-stendibiancheria-a-torre": "8/84/Clotheshorse.jpg|1094",   // Stendibiancheria a torre
  "a7-sgabello-da-bar-regolabile": "5/51/Barhocker_(fcm).jpg|1465",   // Sgabello da bar regolabile
  "a7-macchina-lavazza-a-modo-mio": "5/52/Lavazza_A_modo_Mio_coffe_machine.png|1920",   // Macchina Lavazza A Modo Mio
  "a7-scopa-elettrica-senza-fili": "8/8a/Dyson_V6_cordless_stick_vacuum.jpg|5472",   // Scopa elettrica senza fili Rowenta X-Force 8.80
  "a7-friggitrice-ad-aria-digitale-4-litri": "d/d3/Air_Fryer_2020.jpg|4032",   // Friggitrice ad aria digitale, 4 litri
  "a7-piumino-matrimoniale-quattro-stagioni": "b/b2/La_cama_deshecha_(2724466831).jpg|3072",   // Piumino matrimoniale quattro stagioni
  "a7-letto-ikea-neiden-160x200-cm": "6/60/Lotte_Heaven._(2185651031).jpg|2496",   // Letto IKEA Neiden, 160x200 cm
  "a7-trapano-avvitatore-a-batteria": "7/77/Panasonic_Cordless_Drill_&_Driver_EY1DD2,_Ottobrunn_(20250410-P1046293).jpg|3888",   // Trapano avvitatore a batteria
  "a7-forno-elettrico-da-25-litri": "e/e4/Hamilton_Beach_Easy_Reach_Sure-Crisp_Toaster_Oven_-_05.jpg|5184",   // Forno elettrico da 25 litri
  "a7-impastatrice-planetaria-da-5-litri": "e/e2/2012.09.24.154927_KitchenAid_Rheingauer_Straße_Eltville.jpg|1920",   // Impastatrice planetaria Ariete Gourmet, 5,2 litri
  "a7-topper-in-memory-foam": "4/48/MemoryFoam-fast.jpg|1136",   // Topper in memory foam
  "a7-materasso-ikea-afjall-90x200-cm": "b/bb/Shifman_Mattress_Set.JPG|4828",   // Materasso IKEA Åfjäll, 90x200 cm
  "a7-ventilatore-da-soffitto-con-luce": "7/76/Ceiling_fan_with_lamp.jpg|4128",   // Ventilatore da soffitto con luce
  "a7-tavolo-da-giardino-110x71-cm": "c/c2/Green_metal_chairs_with_round_table_in_a_garden,_Germany.jpeg|2669",   // Tavolo da giardino, 110x71 cm
  "a7-idropulitrice-karcher-k-2": "6/63/KARCHER_5_85.jpg|964",   // Idropulitrice Kärcher K 2 Power Control
  "a7-ferro-con-caldaia-braun-carestyle-5": "c/ca/Teal_and_white_electric_steam_iron_-_side_view.jpg|1466",   // Ferro con caldaia Braun CareStyle 5
  "a7-sedia-da-ufficio-ikea-markus": "4/46/Ikea_MARKUS_Swivel_Chair_(19548745588).jpg|3648",   // Sedia da ufficio IKEA Markus
  "a7-poltrona-ikea-strandmon": "b/b5/Easy_chair,_probably_Boston,_Massachusetts,_1760-1780,_mahogany,_soft_maple,_reproduction_wool_upholstery_-_Winterthur_Museum_-_DSC01384.JPG|3573",   // Poltrona IKEA Strandmon, Nordvalla grigio scuro
  "a7-divano-ikea-ektorp-a-3-posti": "4/46/A_brown_sofa_(2005-03-03).jpg|2048",   // Divano IKEA Ektorp a 3 posti
  "a7-lavasciuga-candy-8-5-kg": "4/42/Samsung_WD90N740NOA,_IFA_2018.jpg|2400",   // Lavasciuga Candy GWD 485SB6-S, 8+5 kg
  "a7-letto-ikea-malm-con-contenitore": "6/60/Lotte_Heaven._(2185651031).jpg|2496",   // Letto IKEA Malm con contenitore
  "a7-congelatore-verticale-whirlpool": "4/44/Openfreezer.jpg|2112",   // Congelatore verticale Whirlpool
  "a7-camera-da-letto-ikea-idanas": "f/fb/Berlin_Villa_Borsig_Tegel_asv2019-08_img09.jpg|7508",   // Camera da letto IKEA Idanäs
  "a7-asciugatrice-bosch-serie-8": "1/1c/Modern_front_load_tumble_dryer.JPG|2155",   // Asciugatrice Bosch Serie 8
  "a7-frigorifero-side-by-side": "7/7b/Open_refrigerator_with_food_at_night.jpg|3465",   // Frigorifero side by side
  "a7-divano-ikea-jattebo-3-5-posti": "2/2a/Chaise_longue_sofa_2.jpg|2770",   // Divano IKEA Jättebo, 3,5 posti
  "a7-cavo-usb-c-da-1-metro": "c/c3/USB-C_cable_2017_A.jpg|3872",   // Cavo USB-C da 1 metro
  "a7-pellicola-in-vetro-per-smartphone": "9/94/Screen_protector.png|352",   // Pellicola in vetro per smartphone
  "a7-presa-smart-wi-fi": "3/34/Smart_plug_adapter_front_view_with_power_button.jpg|1459",   // Presa smart Wi-Fi
  "a7-auricolari-bluetooth-economici": "4/46/MS-TW21NVの画像_2.jpg|2775",   // Auricolari Bluetooth economici
  "a7-tappetino-xxl-per-mouse": "2/2a/HP_mouse_and_mousepad_20060803.jpg|1280",   // Tappetino XXL per mouse
  "a7-cellulare-a-tasti": "1/1e/Nokia_130.jpg|1523",   // Cellulare a tasti
  "a7-mouse-da-gioco-logitech-g502-hero": "4/42/G502_Hero.jpg|3024",   // Mouse da gioco Logitech G502 HERO
  "a7-cuffie-da-gaming-con-microfono": "2/27/Plantronics_headset.jpg|1456",   // Cuffie da gaming con microfono
  "a7-router-wi-fi-6": "6/63/TP-Link_AX1500_Wi-Fi_6_Router_Front.jpg|1280",   // Router Wi-Fi 6
  "a7-mouse-logitech-mx-master-3s": "d/d4/Logitech_MX_Master_3S_HS12.jpg|6000",   // Mouse Logitech MX Master 3S
  "a7-tastiera-logitech-mx-keys-s": "7/78/Logitech_MX_Keys_YR0073_Wireless_Keyboard.jpg|3877",   // Tastiera Logitech MX Keys S
  "a7-samsung-galaxy-a17": "6/67/Samsung_Galaxy_A17_5G_2026_(4).jpg|3024",   // Samsung Galaxy A17 4G, 128 GB
  "a7-tablet-lenovo-idea-tab-11": "c/c5/Lenovo_Tab_M10_FHD_Plus_(2026).jpg|4080",   // Tablet Lenovo Idea Tab 11", Wi-Fi 256 GB
  "a7-samsung-galaxy-tab-a11-128-gb": "d/d5/Samsung_Galaxy_Tab_A11_Gray.png|389",   // Samsung Galaxy Tab A11+, 128 GB
  "a7-drone-dji-neo-2": "7/74/DJI_DN1A0626_Neo_(FA3PEWAH34)_(1-18-2025).jpg|2490",   // Drone DJI Neo 2
  "a7-volante-logitech-driving-force": "e/ed/Logitech_G29_steering_wheel.jpg|4608",   // Volante Logitech G29 Driving Force
  "a7-xbox-series-s-512-gb": "5/54/Xbox_Series_S_with_controller.jpg|2101",   // Xbox Series S, 512 GB
  "a7-redmi-note-17-pro-max-256-gb": "3/3d/Redmi_Note_10_Pro_Back.jpg|3471",   // Redmi Note 17 Pro Max, 256 GB
  "a7-portatile-hp-15-pollici-ryzen-5": "4/4f/Laptop_(Pixi).png|757",   // Portatile HP 15 pollici, Intel Core 5
  "a7-airpods-max": "7/7e/Apple_airpods_max_1.jpg|3005",   // AirPods Max 2
  "a7-tv-da-65-pollici-4k": "e/e2/LG_smart_TV.jpg|1700",   // TV Xiaomi F Pro da 65 pollici 4K
  "a7-drone-dji-mini-5-pro": "9/9b/2024_Dron_DJI_Mini_4_Pro_(18).jpg|5232",   // Drone DJI Mini 5 Pro
  "a7-xbox-series-x-1-tb": "1/12/Xbox_Series_X_2.jpg|4200",   // Xbox Series X, 1 TB
  "a7-ipad-air-da-11-pollici": "7/7a/IPad_Air_2020_(51012790753).jpg|4919",   // iPad Air da 11 pollici
  "a7-macbook-pro-16-pollici-chip-m5-pro": "9/91/MacBook_Pro_16_(M1_Pro,_2021)_-_Wikipedia.jpg|4032",   // MacBook Pro 16 pollici, chip M5 Pro
  "a7-citroen-c3-aircross-puretech-100": "7/76/Citroën_C3_Aircross_(2024)_DSC_9300.jpg|5105",   // Citroën C3 Aircross PureTech 100
  "a7-dacia-jogger": "2/29/2023_Dacia_Jogger_DSC_7288.jpg|4278",   // Dacia Jogger Eco-G 120
  "a7-suzuki-swift-hybrid-1-2": "3/3d/Suzuki_Swift_(2024)_hybrid_DSC_6076.jpg|4038",   // Suzuki Swift Hybrid 1.2
  "a7-peugeot-208-turbo-100-style": "c/c6/Peugeot_208_PureTech_130_EAT8_Allure_GT-Line_(II)_–_f_17102021.jpg|4554",   // Peugeot 208 Turbo 100 Style
  "a7-mini-cooper-c-3-porte": "c/c4/Mini_Hatch_(J01)_Ditzingen_Mobil_IMG_9772_(cropped).jpg|4079",   // MINI Cooper C 3 porte
  "a7-kia-sportage": "5/5d/2025_Kia_Sportage_S_front_only.jpg|4705",   // Kia Sportage
  "a7-mercedes-classe-a-180": "5/5a/2019_Mercedes_Benz_A-Class_Hatchback_A_200_(44).jpg|4000",   // Mercedes Classe A 180
  "a7-ford-mustang-fastback-5-0-v8-gt": "1/1f/2019_Ford_Mustang_GT_5.0_facelift.jpg|3969",   // Ford Mustang Fastback 5.0 V8 GT
  "a7-mercedes-classe-g": "3/38/Mercedes-Benz_W463_G_350_BlueTEC_01.jpg|3400",   // Mercedes Classe G
  "a7-maserati-granturismo": "0/00/Maserati_GranTurismo_Trofeo_1X7A0828.jpg|5844",   // Maserati GranTurismo
  "a7-aston-martin-db12": "c/ca/Aston_Martin_DB12_1X7A1921.jpg|5411",   // Aston Martin DB12
  "a7-honda-sh-mode-125": "0/0f/Honda_SH_Mode_125.jpg|1797",   // Honda SH Mode 125
  "a7-honda-pcx-125": "6/67/2019_Honda_PCX_125.jpg|1536",   // Honda PCX 125
  "a7-yamaha-nmax-125": "7/73/Yamaha_NMAX_125_2025.jpg|1440",   // Yamaha NMAX 125
  "a7-honda-cb125r": "2/21/Honda_CB125R.jpg|4020",   // Honda CB125R
  "a7-piaggio-beverly-310": "b/b1/Piaggio_Beverly_200.jpg|3093",   // Piaggio Beverly 310
  "a7-honda-forza-350": "0/0f/Honda_Forza_350_2025.jpg|1440",   // Honda Forza 350
  "a7-aprilia-rs-457": "a/ad/Aprilia_RS_457.jpg|3965",   // Aprilia RS 457
  "a7-honda-cb750-hornet": "8/87/2023_Honda_CB750_Hornet.jpg|4608",   // Honda CB750 Hornet
  "a7-kawasaki-z900": "b/bc/Kawasaki_Z900,_green.jpg|3957",   // Kawasaki Z900
  "a7-bmw-s-1000-rr": "7/79/BMW_S1000_RR_Studio.JPG|4131",   // BMW S 1000 RR
  "a7-ducati-multistrada-v4-s": "5/53/Ducati_Multistrada_V4_S_'25.jpg|4032",   // Ducati Multistrada V4 S
  "a7-honda-gold-wing": "7/7d/Honda_Gold_Wing_GL_1800_(SC79_-_2018).jpg|1800",   // Honda Gold Wing
  "a7-giant-newtour-e-1-lst": "c/c6/A_mountain_bike_styled_e-bike,_Cyclotricity_Stealth.jpg|3264",   // Giant NewTour E+ 1 LST
  "a7-giant-tcr-advanced-sl-0": "6/66/Look_795_30th_Anniversary_Dura-Ace_9100-Mavic_Custom_Build_(30636542393).jpg|4819",   // Giant TCR Advanced SL 0
  "a7-un-litro-di-benzina-al-self": "c/c0/SPBU_Pertamina_2022.jpg|4928",   // Un litro di benzina al self
  "a7-un-litro-di-gasolio-al-self": "c/c0/SPBU_Pertamina_2022.jpg|4928",   // Un litro di gasolio al self
  "a7-museo-lamborghini": "8/84/Museo_Lamborghini_(Sant'Agata_Bolognese,_Bologna,_Italy)_004.jpg|4000",   // Museo Lamborghini
  "a7-traforo-del-frejus-solo-andata": "7/7b/Frejus_Road_Tunnel_Bardonecchia_portal_2.jpg|2560",   // Traforo del Frejus, solo andata
  "a7-seggiolino-auto-chicco-gro-up-i-size": "e/ec/Volvo_child_safety_seat.jpg|1391",   // Seggiolino auto Chicco Gro-Up i-Size
  "a7-casco-agv-pista-gp-rr": "e/e0/Valentino_Rossi's_AGV_helmets.jpg|1024",   // Casco AGV Pista GP RR
  "a7-giant-talon-20": "2/23/DL_110707_MDE_221.jpg|800",   // Giant Talon 20
  "a7-giant-talon": "9/96/Hardtail-mountain-bike.jpg|907",   // Giant Talon 3
  "a7-camera-d-aria-per-bici-da-corsa": "0/01/Barum_bicycle_inner_tube.jpg|4608",   // Camera d'aria Decathlon per bici da corsa
  "a7-lavaggio-dell-auto-al-self": "1/1f/'Car_Wash_Bergwerff'_Gorinchem_(18466972783).jpg|3091",   // Lavaggio dell'auto al self
  "a7-pastiglie-dei-freni-davanti": "9/92/Brake_pad.jpg|3996",   // Pastiglie dei freni davanti
  "a7-bracciale-in-acciaio-con-cristalli-azzur": "d/de/Bracelet_(jewelry).jpg|734",   // Bracciale in acciaio con cristalli azzurri
  "a7-felpa-girocollo-relaxed-fit": "c/ca/HK_SKD_TKO_將軍澳_Tseung_Kwan_O_坑口_Hang_Hau_東港城_East_Point_City_mall_shop_GU_Clothing_Store_秋季服裝_Autumn_fall_fashion_green_September_2022_Px3.jpg|4000",   // Felpa girocollo relaxed fit
  "a7-casio-f-91w": "9/96/Casio_F-91W_5051.jpg|3393",   // Casio F-91W
  "a7-costume-parigamba-da-uomo": "2/20/Speedo_zwembroek-1.jpg|1280",   // Costume parigamba da uomo
  "a7-jeans-chino-straight-fit": "3/3e/Chino_pants.jpg|1200",   // Jeans chino straight fit
  "a7-portachiavi-mimi": "a/a5/Key_chain_4.jpg|3120",   // Portachiavi Mimì
  "a7-collana-punto-luce-in-argento": "d/de/Silver_necklace_with_a_Chai_Hamsa_pendant,_March_2024_11.jpg|4000",   // Collana Punto Luce in argento
  "a7-costume-boxer-formentera": "2/20/Speedo_zwembroek-1.jpg|1280",   // Costume boxer Formentera
  "a7-bomber-effetto-pelle": "4/42/B-17_Bomber_Pilot_Flight_Jacket.jpeg|241",   // Bomber effetto pelle
  "a7-zaino-carpisa-roadmate-go": "d/d7/Rucksack1.jpg|1458",   // Zaino Carpisa Roadmate go
  "a7-trolley-rigido-carpisa-wander-go": "c/c0/Suitcase1.jpg|1267",   // Trolley rigido Carpisa Wander go
  "a7-nike-windrunner": "9/9d/Windbreaker_Jacket,_Hood_Outside_Transparency.png|1208",   // Nike Windrunner
  "a7-adidas-stan-smith": "2/28/Adidas_Stan_Smiths_sneaker.jpg|2560",   // adidas Stan Smith
  "a7-cintura-reversibile-emporio-armani": "1/17/Leather_belt_&_buckle.jpg|2288",   // Cintura reversibile Emporio Armani
  "a7-adidas-samba-og": "f/fa/Adidas_Samba_OG.jpg|4000",   // adidas Samba OG
  "a7-jeans-diesel-d-strukt": "3/3e/Levi's_501_raw_jeans.jpg|2740",   // Jeans Diesel D-Strukt
  "a7-on-cloudtilt": "8/89/On_Clouds_running_shoes.jpg|1502",   // On Cloudtilt
  "a7-occhiali-da-sole-emporio-armani": "8/85/American_Optical_Original_Pilot_Aviator_sunglasses.jpg|5184",   // Occhiali da sole Emporio Armani
  "a7-nike-air-max-plus": "e/e4/Air_Max_Plus_Tuned.jpg|1800",   // Nike Air Max Plus
  "a7-piumino-nike-windrunner-down": "4/4a/OutDoor_2018,_Friedrichshafen_(1X7A0285).jpg|4480",   // Piumino Nike Windrunner Down
  "a7-orologio-emporio-armani-archetipo": "c/c3/Crown_and_chronograph_pushers_of_a_Montblanc_Timewalker_wristwatch_V2.jpg|3024",   // Orologio Emporio Armani Archetipo
  "a7-sneakers-in-canvas-emporio-armani": "a/a1/Oca-low-washed-black-contrast-thread-canvas-sneaker.png|1500",   // Sneakers in canvas Emporio Armani
  "a7-fede-in-oro-giallo-18-carati-3-2-mm": "d/df/Gold_wedding_ring.jpg|4032",   // Fede in oro giallo 18 carati, 3,2 mm
  "a7-maglione-in-seta-e-cashmere-emporio-arma": "e/ea/Jersei-coll-alt.jpg|678",   // Maglione in seta e cashmere Emporio Armani
  "a7-emporio-armani-sea-explorer-automatico": "1/16/Seiko_Automatic_Diver's_200m.jpg|3648",   // Emporio Armani Sea Explorer automatico
  "a7-valentino-rockstud-decollete-100-mm": "8/82/Rockstud_leather_caged_pumps_on_feet_(20240531202508).jpg|5049",   // Valentino Rockstud, décolleté 100 mm
  "a7-caban-emporio-armani-in-lana-tweed": "2/22/US_Navy_p_coat_wiki.jpg|288",   // Caban Emporio Armani in lana pied-de-poule
  "a7-cartier-tank-must-quarzo": "d/df/Cartier_Tank.jpg|2726",   // Cartier Tank Must, quarzo
  "a7-cartier-love-bracciale-medio": "f/fa/Cartier_love_collection_re_launched.jpg|155",   // Cartier LOVE, bracciale medio
  "a7-tank-louis-cartier-oro-giallo": "d/df/Cartier_Tank.jpg|2726",   // Tank Louis Cartier, oro giallo, modello piccolo
  "a7-bus-a-roma-biglietto-da-100-minuti": "a/ab/ATAC_Iveco_Bus_Urbanway_(230).jpg|3900",   // Bus a Roma, biglietto da 100 minuti
  "a7-biglietto-della-metro-di-parigi": "0/01/Pont_de_Bir-Hakeim,_may_2025.jpg|3000",   // Biglietto della metro di Parigi
  "a7-ingresso-alla-basilica-di-san-marco": "6/61/Venezia_Basilica_di_San_Marco_Fassade_2.jpg|4574",   // Ingresso alla Basilica di San Marco
  "a7-traghetto-napoli-capri-nave-lenta": "3/33/Capri_coastline.jpg|3072",   // Traghetto Napoli-Capri, nave lenta
  "a7-treno-dall-aeroporto-di-parigi-al-centro": "f/f1/RER-B_at_Charles_de_Gaulle.jpg|2816",   // Treno dall'aeroporto di Parigi al centro
  "a7-seggiovia-del-monte-solaro-andata-e-rito": "4/47/Monte_Solaro_Chairlift_索拉羅山纜車_-_panoramio.jpg|3264",   // Seggiovia del Monte Solaro, andata e ritorno
  "a7-teatro-antico-di-taormina": "6/6d/Teatro_Antico_di_Taormina_(44895386195).jpg|5920",   // Teatro Antico di Taormina
  "a7-salita-al-campanile-di-san-marco": "8/8c/Campanile_of_St._Mark's_Basilica_-_remote_view.jpg|5889",   // Salita al Campanile di San Marco
  "a7-salita-alla-cupola-di-san-pietro-a-piedi": "0/03/Dome_of_St._Peter_in_the_afternoon.JPG|6016",   // Salita alla Cupola di San Pietro, a piedi
  "a7-giro-delle-due-isole-borromee-da-stresa": "e/e4/GolfoBorromeoFeb202026.jpg|8064",   // Giro delle due Isole Borromee da Stresa
  "a7-villa-d-este": "9/9e/Villa_Deste_park_Rometta_2011_2.jpg|3000",   // Villa d'Este
  "a7-museo-del-prado": "6/68/Museo_del_Prado_2016_(25185969599).jpg|4045",   // Museo del Prado
  "a7-scavi-di-ercolano": "b/b7/Herculaneum_007.jpg|3456",   // Scavi di Ercolano
  "a7-museo-d-orsay": "9/9c/Pont_Royal_and_Musée_d'Orsay,_Paris_10_July_2020.jpg|5626",   // Museo d'Orsay
  "a7-casa-di-anne-frank": "c/cb/Amsterdam_(NL),_Anne-Frank-Huis_--_2015_--_7185.jpg|4073",   // Casa di Anne Frank
  "a7-grotte-di-frasassi": "4/45/L'interno_delle_grotte_di_Frasassi.jpg|4000",   // Grotte di Frasassi
  "a7-castel-sant-angelo": "7/73/0_Pont_et_château_Sant'Angelo_-_Rome_(1).JPG|3888",   // Castel Sant'Angelo
  "a7-galleria-borghese": "5/5d/Galleria_borghese_facade.jpg|4378",   // Galleria Borghese
  "a7-alilaguna-dall-aeroporto-a-venezia": "d/d4/Alilaguna_boat_in_Venice.jpg|4896",   // Alilaguna dall'aeroporto a Venezia
  "a7-palazzo-vecchio": "b/b3/Piazza_della_signoria,_palazzo_vecchio,_veduta_01.jpg|4040",   // Palazzo Vecchio
  "a7-giornata-alle-isole-borromee": "e/e4/GolfoBorromeoFeb202026.jpg|8064",   // Giornata alle Isole Borromee
  "a7-giro-sulla-senna-in-battello": "1/1f/Bateau_mouche_jnl_4.jpg|1200",   // Giro sulla Senna in battello
  "a7-reggia-di-venaria": "3/30/La_Reggia_della_Venaria_Reale.jpg|4000",   // Reggia di Venaria
  "a7-torre-di-arnolfo-a-palazzo-vecchio": "f/fe/Torre_di_arnolfo,_palazzo_vecchio.JPG|1200",   // Torre di Arnolfo a Palazzo Vecchio
  "a7-ombrellone-e-due-lettini-a-jesolo": "0/00/Aerial_image_of_Lido_di_Jesolo_(view_from_the_southwest).jpg|5400",   // Ombrellone e due lettini a Jesolo
  "a7-battello-da-como-a-bellagio-andata-e-rit": "9/98/Bellagio_and_Lake_Como_ferry.jpg|4943",   // Battello da Como a Bellagio, andata e ritorno
  "a7-sagrada-familia": "7/74/Sagrada_Familia_March_2015-10a.jpg|6249",   // Sagrada Família
  "a7-cabinovia-dell-alpe-di-siusi-andata-e-ri": "e/e1/Mont_de_Seuc_Fabian_2012_017_01.JPG|7360",   // Cabinovia dell'Alpe di Siusi, andata e ritorno
  "a7-skipass-di-un-giorno-a-livigno": "c/ca/Livigno_sera.jpg|6720",   // Skipass di un giorno a Livigno
  "a7-firenze-card-72-ore": "c/c7/Cattedrale_di_Santa_Maria_del_Fiore_–_Il_Duomo_di_Firenze.jpg|3872",   // Firenze Card, 72 ore
  "a7-disneyland-paris-biglietto-flessibile": "f/f1/Disneyland_Park_05,_Paris_22_August_2013.jpg|3872",   // Disneyland Paris, biglietto flessibile
  "a7-notte-in-un-hotel-3-stelle-a-roma": "e/e1/Bed_in_hotel_room_6.jpg|4048",   // Notte in un hotel 3 stelle a Roma
  "a7-interrail-global-pass-4-giorni-in-un-mes": "d/dc/09.05.22_Trelleborg_Centralstation_X61_037,_X61_057_and_X61_047_(52093968846).jpg|5827",   // Interrail Global Pass, 4 giorni in un mese
  "a7-crociera-di-7-notti-nel-mediterraneo": "e/ec/Legend_of_the_Seas.png|2048",   // Crociera di 7 notti nel Mediterraneo
  "a7-una-settimana-alle-maldive": "8/82/MaldivesBungalows.jpg|3024",   // Una settimana alle Maldive
  "a7-safari-di-una-settimana-in-kenya": "1/17/Masai_Mara_at_Sunset.jpg|2400",   // Safari di una settimana in Kenya
  "a7-biglietto-del-vaporetto-per-7-giorni": "7/75/Venezia_Vaporetto_ACTV43_R01.jpg|4462",   // Biglietto del vaporetto per 7 giorni
  "a7-traghetto-in-gondola-sul-canal-grande": "a/a5/Traghetto_San_Tomà_Venice.JPG|4000",   // Traghetto in gondola sul Canal Grande
  "a7-weekend-a-barcellona-per-due": "a/a6/Evening_light_over_Barcelona.jpg|5995",   // Weekend a Barcellona per due
  "a7-settimana-in-un-villaggio-turistico-in-c": "b/b7/Beach_in_Tropea_-_Calabria_-_Italy_-_July_17th_2013_-_01.jpg|4006",   // Settimana in un villaggio turistico in Calabria
  "a7-settimana-a-sharm-el-sheikh-tutto-compre": "f/f5/Gold_Beach_at_Ras_Um_Sid_Bay.jpg|4871",   // Settimana a Sharm el-Sheikh, tutto compreso
  "a7-volo-roma-londra-con-una-low-cost": "8/8c/EI-HGR_Boeing_737-8-200Max_Ryanair_Stansted_18.7.21.jpg|4178",   // Volo Roma-Londra con una low cost
  "a7-una-notte-in-agriturismo-in-toscana": "f/f7/Acquanegra_sul_Chiese-Oasi_Le_Bine.JPG|3770",   // Una notte in agriturismo in Toscana
  "a7-una-notte-in-b-b-a-napoli": "f/fe/Room_at_Bed_&_Breakfast_Karu.jpg|4608",   // Una notte in B&B a Napoli
  "a7-auto-a-noleggio-per-una-settimana-in-sic": "d/d2/2018_Fiat_Panda_Easy_1.2.jpg|4206",   // Auto a noleggio per una settimana in Sicilia
  "a7-una-notte-in-campeggio-con-la-tenda": "7/73/Tent_camping_along_the_Sulayr_trail_in_La_Taha,_Sierra_Nevada_National_Park_(DSCF5147).jpg|4667",   // Una notte in campeggio con la tenda
  "a7-bici-a-noleggio-per-un-giorno": "7/79/Munich_-_Bicycles_for_rental_-_9524.jpg|4326",   // Bici a noleggio per un giorno
  "a7-una-notte-in-un-hotel-di-lusso-a-venezia": "a/af/Palazzo_Pisani_Gritti_(Venice).jpg|7360",   // Una notte in un hotel di lusso a Venezia
  "a7-popcorn-medi-al-cinema": "e/e2/Cinema_popcorn_bucket.jpg|2964",   // Popcorn medi al cinema
  "a7-biglietto-del-cinema-in-imax": "a/a9/BFI_London_IMAX_at_night.jpg|1600",   // Biglietto del cinema in IMAX
  "a7-biglietto-in-curva-serie-b": "5/52/Stadio_Luigi_Ferraris_di_Genova_con_il_quartiere_Marassi_(cropped).jpg|3162",   // Biglietto in curva, Serie B
  "a7-spettacolo-comico-a-teatro": "7/75/Auditorium_at_Maxim_in_May_2024.jpg|4608",   // Spettacolo comico a teatro
  "a7-parco-natura-viva-percorso-a-piedi": "1/11/ITALY_-_Tigre_Siberiana_-_Parco_Natura_Viva_-_Verona_3.JPG|4000",   // Parco Natura Viva, percorso a piedi
  "a7-cinecitta-world": "a/a6/Altair_cinecitta_world.jpg|3072",   // Cinecittà World
  "a7-bioparco-di-roma": "f/f8/Ingresso_bioparco_2.JPG|2048",   // Bioparco di Roma
  "a7-ingresso-in-piscina": "c/c3/Swimming_Pool_lanes_and_starting_blocks.jpg|4448",   // Ingresso in piscina
  "a7-una-partita-a-bowling": "9/90/Sunset_Lanes_bowling_alley_-_Beaverton,_OR_(2015).jpg|4736",   // Una partita a bowling
  "a7-giro-in-go-kart": "9/9b/Клас_60.jpg|4512",   // Giro in go-kart
  "a7-parco-avventura-percorso-adulti": "a/ad/Haltern_am_See,_Kletterwald_Haltern_--_2016_--_2559.jpg|5472",   // Parco avventura, percorso adulti
  "a7-lezione-di-surf-di-gruppo": "6/69/Italian_surfer_2.JPG|2209",   // Lezione di surf di gruppo
  "a7-lezione-di-equitazione": "7/72/Riding_School,_North_Hoggs_Park_-_geograph.org.uk_-_131268.jpg|640",   // Lezione di equitazione
  "a7-campo-da-tennis-per-un-ora": "a/a1/Empty_clay_tennis_court_in_Melbourne_Australia_looking_down_the_middle.jpg|4606",   // Campo da tennis per un'ora
  "a7-ingresso-giornaliero-alle-terme": "0/02/Terme_di_Saturnia_-_Cascate_del_Mulino-0518.jpg|5184",   // Ingresso giornaliero alle terme
  "a7-pista-di-pattinaggio-con-noleggio": "7/7e/Empty_Skating_Rink_at_Bryant_Park.jpg|5712",   // Pista di pattinaggio con noleggio
  "a7-battesimo-del-mare-in-immersione": "2/29/Underwater_photograph_of_a_recreational_scuba_diver_in_Playa_del_Carmen_2006.jpg|691",   // Battesimo del mare in immersione
  "a7-pallone-da-calcio-adidas": "2/25/Al-Rihla_(cropped).jpg|2541",   // Pallone da calcio Adidas
  "a7-pallone-da-basket-spalding": "0/09/SPALDING_NBA_OFFICIAL_GAME_BALL_8.jpg|980",   // Pallone da basket Spalding
  "a7-racchetta-da-padel-di-fascia-media": "7/7d/Padel_rackets_and_balls.jpg|6000",   // Racchetta da padel di fascia media
  "a7-scarpe-da-corsa-nike-pegasus": "c/c0/Nike_Zoom_Pegasus_38_running_shoe.jpg|3539",   // Scarpe da corsa Nike Pegasus 42
  "a7-mountain-bike-di-base": "9/96/Orbea_Occam_2020.jpg|6472",   // Mountain bike di base
  "a7-tavola-da-sup-gonfiabile": "8/84/Inflatable_Stand_Up_Paddle_board.png|617",   // Tavola da SUP gonfiabile
  "a7-zaino-da-trekking-50-litri": "d/d7/Rucksack1.jpg|1458",   // Zaino da trekking, 50 litri
  "a7-tavolo-da-ping-pong-da-interno": "c/c9/Table_Tennis_racquet_and_ball_on_table_with_the_net_-_side_view.jpg|4624",   // Tavolo da ping pong da interno
  "a7-risiko-edizione-classica": "4/48/UK_Risk_Pieces_'80s.jpg|3264",   // Risiko! edizione classica
  "a7-monopoly-edizione-classica": "7/78/Monopoly_board_on_white_bg.jpg|1463",   // Monopoly edizione classica
  "a7-mazzo-di-carte-uno": "7/72/Uno_Old_Deck.jpg|640",   // Mazzo di carte Uno
  "a7-cubo-di-rubik-3x3": "6/61/Rubiks_cube_solved.jpg|600",   // Cubo di Rubik 3x3
  "a7-flauto-dolce-yamaha": "7/7e/Yamaha_Soprano_(Descant)_Recorder.jpg|3024",   // Flauto dolce Yamaha
  "a7-armonica-hohner-special-20": "c/c0/Special20.JPG|4592",   // Armonica Hohner Special 20
  "a7-ukulele-soprano": "d/db/Soprano_ukulele_from_China,_made_of_laminated_mahogany_wood.jpg|5184",   // Ukulele soprano
  "a7-tastiera-casio-a-61-tasti": "b/bf/YamahaKeyboard-2.jpg|1527",   // Tastiera Casio a 61 tasti
  "a7-chitarra-acustica-yamaha-f310": "2/2d/Yamaha_F310.jpg|3096",   // Chitarra acustica Yamaha F310
  "a7-pianoforte-digitale-yamaha-p-145": "e/e8/Yamaha_P-125_20190713a.jpg|4352",   // Pianoforte digitale Yamaha P-145
  "a7-pianoforte-digitale-roland-fp-30x": "9/9d/Digital-piano-423.jpg|1400",   // Pianoforte digitale Roland FP-30X
  "a7-sassofono-contralto-yamaha": "5/5c/Yamaha_YAS-25_Alto_Saxophone_20080502.jpg|3072",   // Sassofono contralto Yamaha
  "a7-cajon": "7/72/MAUGEIN_CAJON_01.jpg|2604",   // Cajón
  "a7-nintendo-switch-online-12-mesi": "7/76/Nintendo-Switch-Console-Docked-wJoyConRB.jpg|4900",   // Nintendo Switch Online, 12 mesi
  "a7-violino-da-studio": "1/1b/Violin_VL100.png|700",   // Violino da studio
  "a7-chitarra-elettrica-fender-stratocaster-p": "6/63/Fender_Stratocaster_004-2.jpg|1432",   // Chitarra elettrica Fender Stratocaster Player II
  "a7-lezione-di-tennis-privata": "4/4a/Tennis_Racquets_and_Balls_on_a_Clay_Court.jpg|3246",   // Lezione di tennis privata
  "a7-marca-da-bollo": "4/47/Marca_da_bollo_adesiva.jpg|1564",   // Marca da bollo
  "a7-lettera-con-posta-ordinaria": "0/0a/Daschle_letter.jpg|400",   // Lettera con posta ordinaria
  "a7-raccomandata-ordinaria": "e/ee/Registered_envelope_of_Kenya_and_Uganda_1930.jpg|1637",   // Raccomandata ordinaria
  "a7-libro-spedito-con-le-poste": "c/c0/Parcelfromamazon.jpeg|3333",   // Libro spedito con le Poste
  "a7-contrassegno-sul-pacco": "d/d3/Verpackung_(34).jpg|3261",   // Contrassegno sul pacco
  "a7-biglietto-bit-di-roma": "3/38/ATAC_ticket_machine_(bus).jpg|3072",   // Biglietto BIT di Roma
  "a7-biglietto-roma-24-ore": "2/2e/Inaugurazione_metro_B1.jpg|2592",   // Biglietto Roma 24 ore
  "a7-abbonamento-annuale-atac": "a/ab/ATAC_Iveco_Bus_Urbanway_(230).jpg|3900",   // Abbonamento annuale ATAC
  "a7-tassa-rifiuti-a-cremona": "0/08/Cremona_Cattedrale_di_Santa_Maria_Assunta_Torrazzo_Vista_sul_la_Piazza_Sant'Antonio_Maria_Zaccaria_1.jpg|4560",   // Tassa rifiuti a Cremona
  "a7-tassa-rifiuti-a-catania": "2/2b/Elephant_fountain,_Catania.jpg|4752",   // Tassa rifiuti a Catania
  "a7-acqua-di-casa-un-anno": "7/73/Wasserhahn.jpg|2272",   // Acqua di casa, un anno
  "a7-fibra-iliad-un-mese": "c/c1/Optical_fiber_connectors-optical_patch_cable-01ASD.jpg|2130",   // Fibra Iliad, un mese
  "a7-libri-per-la-prima-superiore": "e/e6/Japanese_textbooks.jpg|640",   // Libri e dizionari per la prima superiore
  "a7-ticket-del-pronto-soccorso": "2/2f/FEMA_-_18140_-_Photograph_by_Jocelyn_Augustino_taken_on_10-29-2005_in_Florida.jpg|4288",   // Ticket del pronto soccorso
  "a7-ticket-massimo-di-una-ricetta": "7/79/Tessera_Sanitaria_Italia-Fronte.jpg|4364",   // Ticket massimo di una ricetta
  "a7-apparecchio-fisso-per-i-denti": "e/e1/Orthobraces_-_dental_braces_lower_upper_jaw.jpg|2110",   // Apparecchio fisso per i denti
  "a7-sterilizzare-una-gatta": "d/d1/Kitten_supported_on_a_towel-covered_examination_table_in_Newark,_New_Jersey.jpg|3024",   // Sterilizzare una gatta
  "a7-visita-dal-dermatologo": "6/65/IDS-1100_Dermatoscope.jpg|2048",   // Visita dal dermatologo
  "a7-batteria-nuova-per-iphone-17": "5/56/Black_iPhone_17.jpg|4160",   // Batteria nuova per iPhone 17
  "a7-schermo-rotto-di-iphone-17": "6/6d/Smartphone_cracked_screen.jpg|1920",   // Schermo rotto di iPhone 17
  "a7-elettricista-a-casa": "5/5d/US_wiring_basement-panel.jpg|1536",   // Elettricista a casa
  "a7-taglio-di-capelli-per-bambini": "0/03/Leather_belt_bag_with_various_tools_of_a_hairdresser_for_quick_access.jpg|2736",   // Taglio di capelli per bambini
  "a7-pedicure-estetico": "b/b6/Pedicure_with_blue_nail_colour.jpg|768",   // Pedicure estetico
  "a7-massaggio-rilassante-un-ora": "1/1d/USMC-100831-M-2664B-015.jpg|3456",   // Massaggio rilassante, un'ora
  "a7-lezione-di-chitarra": "6/6e/Classical_Guitar_two_views2.png|1051",   // Lezione di chitarra
  "a7-suole-nuove-alle-scarpe": "7/7a/Capri_-_7224.jpg|4368",   // Suole nuove alle scarpe
  "a7-lavaggio-a-secco-di-un-abito": "3/3b/Dry_cleaned_clothes_(Unsplash).jpg|7003",   // Lavaggio a secco di un abito
  "a7-personal-trainer-un-ora": "7/7c/Dumbells_and_free_weights_in_a_gym.jpg|4041",   // Personal trainer, un'ora
  "a7-zeppola-di-san-giuseppe": "b/b8/Zeppole_di_San_Giuseppe.jpg|960",   // Zeppola di San Giuseppe
  "a7-pani-ca-meusa": "e/e3/Pani_ca_meusa.jpg|3968",   // Pani ca' meusa
  "a7-pasta-di-gragnano-igp-500-g": "e/e9/Spaghetti_di_Gragnano_e_colatura_di_alici.jpg|2800",   // Pasta di Gragnano IGP, 500 g
  "a7-pomodori-san-marzano-dop-400-g": "5/5e/TomateSanMarzano.jpg|2448",   // Pomodori San Marzano DOP, 400 g
  "a7-cioccolato-di-modica-igp-100-g": "9/98/Cioccolato_di_Modica.jpg|5472",   // Cioccolato di Modica IGP, 100 g
  "a7-cantucci-di-prato-igp-250-g": "1/15/I_cantuccini.jpg|3244",   // Cantucci di Prato IGP, 250 g
  "a7-caldarroste-un-cartoccio": "f/fb/Chestnuts_roasted.jpg|1280",   // Caldarroste, un cartoccio
  "a7-pane-di-altamura-dop-1-kg": "7/77/Pane-di-altamura-dop-official.jpg|5616",   // Pane di Altamura DOP, 1 kg
  "a7-mazzo-di-carte-napoletane": "c/c4/Carte_napoletane_al_completo.jpg|3507",   // Mazzo di carte napoletane
  "a7-nduja-di-spilinga-200-g": "0/04/'Nduja.JPG|3888",   // 'Nduja di Spilinga, 200 g
  "a7-cocomero-intero-8-kg": "6/6f/Whole_Watermelon.jpg|3120",   // Cocomero intero, 8 kg
  "a7-lenticchie-di-castelluccio-igp-500-g": "6/6e/Lenticchie_z01.jpg|800",   // Lenticchie di Castelluccio IGP, 500 g
  "a7-stella-di-natale-in-vaso": "e/e1/Weihnachtsstern_-_groß.jpg|980",   // Stella di Natale in vaso
  "a7-ricciarelli-di-siena-igp-250-g": "9/97/Ricciarelli_from_Siena-2.jpg|2048",   // Ricciarelli di Siena IGP, 250 g
  "a7-giardino-di-boboli": "7/7e/Jardín_de_Bóboli,_Florencia,_Italia,_2022-09-19,_DD_26.jpg|7850",   // Giardino di Boboli
  "a7-panforte-di-siena-450-g": "8/85/Panforte,_Firenze.jpg|4000",   // Panforte di Siena, 450 g
  "a7-zafferano-dell-aquila-dop-1-g": "6/68/Saffron_-_premium_spice.jpg|4000",   // Zafferano dell'Aquila DOP, 1 g
  "a7-toast-al-caffe-florian": "7/72/Ham_&_cheese_toasted_sandwich_-_Potatoast_2026-05-02.jpg|8160",   // Toast al Caffè Florian
  "a7-palazzo-pitti": "3/30/Palazzo_Pitti_(Florence)_-_Facade_20150811.jpg|5184",   // Palazzo Pitti
  "a7-caffettiera-napoletana-3-tazze": "d/dd/Neapolitan_flip_coffee_pot.jpg|600",   // Caffettiera napoletana, 3 tazze
  "a7-gallerie-dell-accademia": "1/1c/Accademia_(Venice).jpg|3171",   // Gallerie dell'Accademia
  "a7-pastore-del-presepe-napoletano": "b/bd/Campania_Caserta8_tango7174.jpg|1088",   // Pastore del presepe napoletano
  "a7-bottarga-di-muggine-100-g": "3/36/\"_12_-_ITALY_-_Bottarga_di_Muggine_(Sardegna,_ITALIA)_P.A.T._(_botargo_of_Flathead_mullet_).JPG|2585",   // Bottarga di muggine, 100 g
  "a7-maschera-veneziana-di-cartapesta": "2/2a/Venice_Paper_Mache_Mask_shop.jpg|5472",   // Maschera veneziana di cartapesta
  "a7-uffizi-con-il-corridoio-vasariano": "f/f9/Vasari_corridor_and_Ponte_Vecchio_seen_from_the_Uffizi.jpg|4911",   // Uffizi con il Corridoio Vasariano
  "a7-lardo-di-colonnata-igp-1-kg": "f/fa/Lardo_di_Colonnata.JPG|800",   // Lardo di Colonnata IGP, 1 kg
  "a7-colazione-al-caffe-florian": "3/3e/Venice,_Piazza_San_Marco,_Caffè_Florian_3.jpg|5804",   // Colazione al Caffè Florian
  "a7-piatto-di-ceramica-di-deruta": "0/0a/Deruta,_bacile_con_san_francesco_che_riceve_le_stimmate,_1531.jpg|1760",   // Piatto di ceramica di Deruta
  "a7-corso-di-pasta-fresca-a-bologna": "4/42/Tortellini_Bolognesi.jpg|2592",   // Corso di pasta fresca a Bologna
  "a7-una-notte-in-un-trullo": "6/66/Trulli_in_Alberobello_2015.jpg|5096",   // Una notte in un trullo
  "a7-sassicaia-75-cl": "3/38/2003_Bolgheri_Sassicaia.jpg|2432",   // Sassicaia, 75 cl
  "a7-una-forma-intera-di-grana-padano": "0/03/Grana_Padano_DOP_Riserva.jpg|1181",   // Una forma intera di Grana Padano
  "a7-penna-stilografica-aurora-optima": "3/37/Optima_(6792731676).jpg|4272",   // Penna stilografica Aurora Optima
  "a7-cucciolo-di-lagotto-romagnolo": "4/4f/Lagotto_Romagnolo_puppies_-_Allevamento_Valle_dei_Medici.jpg|3000",   // Cucciolo di Lagotto Romagnolo
  "a7-vespa-50-special-d-epoca": "4/40/Vespa_Special_PIA.jpg|2736",   // Vespa 50 Special d'epoca
  "a7-una-gondola-nuova": "2/20/Gondole_Venezia.JPG|2605",   // Una gondola nuova
};

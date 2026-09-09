/* =========================================================
   DATI — Temi e carte per il gioco "L'Asta"
   Ogni tema ha 4 round; ogni round ha carte divise in
   tre fasce: A (le migliori), B (medie), C (scarti).
   Le fasce sono ragionate sul tema: in "Sopravvivenza Zombie"
   conta ciò che è silenzioso, resistente, difendibile e senza
   bisogno di carburante o munizioni.
   Aggiungere un tema qui NON richiede di toccare il gioco.
   ========================================================= */
(window.SG_ASTA_TEMI = window.SG_ASTA_TEMI || []).push({
  id: "zombie",
  nome: "Sopravvivenza Zombie",
  icona: "🧟",
  sottotitolo: "Costruisci il kit che ti salva la pelle",
  round: [
    {
      // Silenzioso + resistente + senza munizioni = top. Rumoroso o fragile = scende.
      nome: "L'Arma", icona: "🔪",
      A: [
        { nome: "Katana Affilata", emoji: "🗡️" },
        { nome: "Machete da Giungla", emoji: "🔪" },
        { nome: "Balestra Silenziosa", emoji: "🏹" },
        { nome: "Ascia da Pompiere", emoji: "🪓" },
        { nome: "Lancia Artigianale", emoji: "🔱" },
        { nome: "Fucile a Pompa", emoji: "🔫" },
        { nome: "Alabarda da Torre", emoji: "⚔️" },
        { nome: "Mazzafrusto Medievale", emoji: "🔗" },
        { nome: "Coltello da Sopravvivenza", emoji: "🪒" },
        { nome: "Arpione Subacqueo", emoji: "🎣" },
        { nome: "Spranga da Cantiere", emoji: "🔩" },
        { nome: "Martello da Fabbro", emoji: "🔨" },
        { nome: "Bastone da Combattimento", emoji: "🎋" },
        { nome: "Piccozza da Alpinista", emoji: "⛏️" }
      ],
      B: [
        { nome: "Mazza Chiodata", emoji: "🏏" },
        { nome: "Piede di Porco", emoji: "🛠️" },
        { nome: "Pistola 9mm", emoji: "🎯" },
        { nome: "Motosega Rumorosa", emoji: "🪚" },
        { nome: "Estintore Pesante", emoji: "🧯" },
        { nome: "Coltello da Caccia", emoji: "🔦" },
        { nome: "Tirapugni", emoji: "🥊" },
        { nome: "Mitragliatrice Leggera", emoji: "🎆" },
        { nome: "Pistola Lanciarazzi", emoji: "🚨" },
        { nome: "Chiodatrice da Cantiere", emoji: "📌" },
        { nome: "Fionda Rinforzata", emoji: "🪨" },
        { nome: "Falce da Grano", emoji: "🌾" },
        { nome: "Cacciavite Affilato", emoji: "🪛" },
        { nome: "Manganello Antisommossa", emoji: "🥍" },
        { nome: "Sciabola da Collezione", emoji: "⚜️" },
        { nome: "Frusta di Cuoio", emoji: "🪢" },
        { nome: "Zappa da Giardino", emoji: "⚒️" },
        { nome: "Calzino Pieno di Sassi", emoji: "🧦" }
      ],
      C: [
        { nome: "Padella Bucata", emoji: "🍳" },
        { nome: "Righello di Plastica", emoji: "📏" },
        { nome: "Spazzolone per Cessi", emoji: "🚽" },
        { nome: "Ombrello Rotto", emoji: "☂️" },
        { nome: "Forchetta da Insalata", emoji: "🍴" },
        { nome: "Guanto da Forno", emoji: "🧤" },
        { nome: "Pistola Nerf Giocattolo", emoji: "🧸" },
        { nome: "Spada di Legno", emoji: "🪵" },
        { nome: "Spazzola per Capelli", emoji: "🪮" },
        { nome: "Cucchiaio da Minestra", emoji: "🥄" },
        { nome: "Fischietto da Richiamo", emoji: "📯" },
        { nome: "Bacchetta Magica Giocattolo", emoji: "🪄" },
        { nome: "Sciabola Gonfiabile", emoji: "🎈" },
        { nome: "Elastico per Capelli", emoji: "🎀" }
      ]
    },
    {
      // Muri, una sola entrata e scorte = top. Grande e pieno di vetrine = medio.
      nome: "Il Rifugio", icona: "🏠",
      A: [
        { nome: "Base Militare Fortificata", emoji: "🪖" },
        { nome: "Bunker Anti-Atomico", emoji: "🛡️" },
        { nome: "Carcere di Massima Sicurezza", emoji: "🔒" },
        { nome: "Faro sull'Isolotto", emoji: "🗼" },
        { nome: "Diga Idroelettrica", emoji: "🌊" },
        { nome: "Nave Cargo al Largo", emoji: "🚢" },
        { nome: "Torre di Controllo", emoji: "📡" },
        { nome: "Silo Missilistico", emoji: "🚀" },
        { nome: "Miniera Sotterranea", emoji: "🕳️" },
        { nome: "Ambasciata Blindata", emoji: "🏛️" },
        { nome: "Ospedale Fortificato", emoji: "🏥" },
        { nome: "Monastero sulla Rupe", emoji: "🏯" },
        { nome: "Piattaforma Petrolifera", emoji: "🛢️" },
        { nome: "Castello Medievale", emoji: "🏰" }
      ],
      B: [
        { nome: "Centro Commerciale", emoji: "🏬" },
        { nome: "Caserma dei Pompieri", emoji: "🚒" },
        { nome: "Isola Privata Lontana", emoji: "🏝️" },
        { nome: "Fattoria con Recinto", emoji: "🏡" },
        { nome: "Baita in Montagna", emoji: "🏔️" },
        { nome: "Camper Blindato", emoji: "🚐" },
        { nome: "Chiesa di Pietra", emoji: "⛪" },
        { nome: "Scuola Media", emoji: "🏫" },
        { nome: "Grattacielo Uffici", emoji: "🏢" },
        { nome: "Stadio di Calcio", emoji: "🏟️" },
        { nome: "Supermercato di Quartiere", emoji: "🏪" },
        { nome: "Università con Campus", emoji: "🎓" },
        { nome: "Prigione Abbandonata", emoji: "🔓" },
        { nome: "Villaggio Turistico", emoji: "🏖️" },
        { nome: "Molo Portuale", emoji: "⚓" },
        { nome: "Rifugio Alpino Affollato", emoji: "🎿" },
        { nome: "Magazzino Industriale", emoji: "🏭" },
        { nome: "Nave da Crociera", emoji: "🛳️" }
      ],
      C: [
        { nome: "Tenda da Campeggio", emoji: "⛺" },
        { nome: "Panchina al Parco", emoji: "🪑" },
        { nome: "Stanza di Cartone", emoji: "📦" },
        { nome: "Casa sull'Albero", emoji: "🌳" },
        { nome: "Bagno Chimico", emoji: "🚻" },
        { nome: "Gazebo da Giardino", emoji: "⛱️" },
        { nome: "Cabina Telefonica", emoji: "☎️" },
        { nome: "Casetta per Cani", emoji: "🏚️" },
        { nome: "Igloo di Neve", emoji: "⛄" },
        { nome: "Fortino di Cuscini", emoji: "🛋️" },
        { nome: "Ombrellone da Spiaggia", emoji: "☂️" },
        { nome: "Baracca di Lamiera", emoji: "🛖" },
        { nome: "Serra di Vetro", emoji: "🪟" },
        { nome: "Autolavaggio Abbandonato", emoji: "🚿" }
      ]
    },
    {
      // Passa ovunque, regge le botte e non ti lascia a piedi = top.
      nome: "Il Trasporto", icona: "🚗",
      A: [
        { nome: "Fuoristrada Corazzato", emoji: "🚙" },
        { nome: "Camion Militare", emoji: "🚛" },
        { nome: "Barca a Motore", emoji: "🚤" },
        { nome: "Moto da Enduro", emoji: "🏍️" },
        { nome: "Elicottero con Pilota", emoji: "🚁" },
        { nome: "Furgone Blindato", emoji: "🚓" },
        { nome: "Treno Merci Blindato", emoji: "🚂" },
        { nome: "Aereo Cargo Militare", emoji: "✈️" },
        { nome: "Veicolo Anfibio", emoji: "🌊" },
        { nome: "Jet Privato", emoji: "🛩️" },
        { nome: "Nave Rompighiaccio", emoji: "🧊" },
        { nome: "Idrovolante", emoji: "🛫" },
        { nome: "Slitta Cingolata", emoji: "❄️" },
        { nome: "Autobotte Blindata", emoji: "⛽" }
      ],
      B: [
        { nome: "Trattore Robusto", emoji: "🚜" },
        { nome: "Cavallo Docile", emoji: "🐴" },
        { nome: "Bici da Corsa", emoji: "🚲" },
        { nome: "Furgone del Pane", emoji: "🚚" },
        { nome: "Auto Familiare", emoji: "🚗" },
        { nome: "Scooter 50", emoji: "🛵" },
        { nome: "Gommone a Remi", emoji: "🛶" },
        { nome: "Pulmino Scolastico", emoji: "🚌" },
        { nome: "Pickup Arrugginito", emoji: "🛻" },
        { nome: "Roulotte Trainata", emoji: "🚐" },
        { nome: "Barca a Vela", emoji: "⛵" },
        { nome: "Zattera di Fortuna", emoji: "🪵" },
        { nome: "Rimorchio Agricolo", emoji: "🌾" },
        { nome: "Moto d'Acqua", emoji: "💦" },
        { nome: "Autocisterna Civile", emoji: "🛢️" },
        { nome: "Monopattino Elettrico", emoji: "⚡" },
        { nome: "Furgoncino dei Gelati", emoji: "🍦" },
        { nome: "Betoniera da Cantiere", emoji: "🧱" }
      ],
      C: [
        { nome: "Monopattino Scarico", emoji: "🛴" },
        { nome: "Pattini a Rotelle", emoji: "🛼" },
        { nome: "Carrello della Spesa", emoji: "🛒" },
        { nome: "Skateboard Rotto", emoji: "🛹" },
        { nome: "Tandem Arrugginito", emoji: "🚴" },
        { nome: "Passeggino", emoji: "🍼" },
        { nome: "Triciclo per Bambini", emoji: "👶" },
        { nome: "Sedia a Rotelle da Ufficio", emoji: "🪑" },
        { nome: "Altalena a Molla", emoji: "🎠" },
        { nome: "Auto a Pedali Giocattolo", emoji: "🛞" },
        { nome: "Go-Kart da Pista", emoji: "🏎️" },
        { nome: "Mongolfiera Bucata", emoji: "🎈" },
        { nome: "Slitta senza Neve", emoji: "🛷" },
        { nome: "Monociclo da Circo", emoji: "🤹" }
      ]
    },
    {
      // Chi ti tiene vivo davvero: cure, cibo, riparazioni. Chi fa rumore ti uccide.
      nome: "Il Compagno", icona: "🤝",
      A: [
        { nome: "Medico Chirurgo", emoji: "🩺" },
        { nome: "Soldato Scelto", emoji: "🪖" },
        { nome: "Meccanico Geniale", emoji: "🔧" },
        { nome: "Agricoltore Esperto", emoji: "🌾" },
        { nome: "Ex Cacciatore", emoji: "🎯" },
        { nome: "Infermiera di Guerra", emoji: "💉" },
        { nome: "Ingegnere Strutturale", emoji: "🏗️" },
        { nome: "Veterinario Esperto", emoji: "🐾" },
        { nome: "Ex Ranger Forestale", emoji: "🌲" },
        { nome: "Fabbro Artigiano", emoji: "🔨" },
        { nome: "Idraulico Esperto", emoji: "🚰" },
        { nome: "Ex Vigile del Fuoco", emoji: "🚒" },
        { nome: "Botanico Esperto", emoji: "🌿" },
        { nome: "Cecchino Addestrato", emoji: "🎖️" }
      ],
      B: [
        { nome: "Cane Addestrato", emoji: "🐕" },
        { nome: "Cuoco da Campo", emoji: "🍲" },
        { nome: "Ex Poliziotto", emoji: "👮" },
        { nome: "Elettricista", emoji: "💡" },
        { nome: "Campione di Atletica", emoji: "🏃" },
        { nome: "Pescatore Paziente", emoji: "🎣" },
        { nome: "Amico Silenzioso", emoji: "🤫" },
        { nome: "Maratoneta in Pensione", emoji: "🥇" },
        { nome: "Cane da Guardia Rumoroso", emoji: "🐶" },
        { nome: "Ex Detenuto Forzuto", emoji: "💪" },
        { nome: "Prete di Paese", emoji: "⛪" },
        { nome: "Turista Straniero", emoji: "🧳" },
        { nome: "Studente Universitario", emoji: "🎒" },
        { nome: "Ex Culturista", emoji: "🏋️" },
        { nome: "Cantante Rock", emoji: "🎤" },
        { nome: "Gatto Randagio", emoji: "🐈" },
        { nome: "Cavallerizzo Esperto", emoji: "🐎" },
        { nome: "Radioamatore", emoji: "📻" }
      ],
      C: [
        { nome: "Quello che Urla", emoji: "😱" },
        { nome: "Il Finto Morso", emoji: "🧟" },
        { nome: "Quello con l'Asma", emoji: "😮‍💨" },
        { nome: "Influencer in Diretta", emoji: "📱" },
        { nome: "Il Sonnambulo", emoji: "😴" },
        { nome: "Quello che Russa", emoji: "💤" },
        { nome: "Il Complottista", emoji: "🛸" },
        { nome: "La Ex del Capogruppo", emoji: "💔" },
        { nome: "Quello Sempre in Ritardo", emoji: "⏰" },
        { nome: "Il Vegano Convinto", emoji: "🥦" },
        { nome: "Il Cugino Sfigato", emoji: "🙄" },
        { nome: "La Signora dei Gatti", emoji: "🐈‍⬛" },
        { nome: "Bambino Piccolo", emoji: "👶" },
        { nome: "Pappagallo Chiacchierone", emoji: "🦜" }
      ]
    }
  ]
});

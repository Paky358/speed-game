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
        { nome: "Fucile a Pompa", emoji: "🔫" }
      ],
      B: [
        { nome: "Mazza Chiodata", emoji: "🏏" },
        { nome: "Piede di Porco", emoji: "🛠️" },
        { nome: "Pistola 9mm", emoji: "🎯" },
        { nome: "Motosega Rumorosa", emoji: "🪚" },
        { nome: "Estintore Pesante", emoji: "🧯" },
        { nome: "Coltello da Caccia", emoji: "🔦" },
        { nome: "Tirapugni", emoji: "🥊" }
      ],
      C: [
        { nome: "Padella Bucata", emoji: "🍳" },
        { nome: "Righello di Plastica", emoji: "📏" },
        { nome: "Spazzolone per Cessi", emoji: "🚽" },
        { nome: "Ombrello Rotto", emoji: "☂️" },
        { nome: "Forchetta da Insalata", emoji: "🍴" },
        { nome: "Guanto da Forno", emoji: "🧤" }
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
        { nome: "Nave Cargo al Largo", emoji: "🚢" }
      ],
      B: [
        { nome: "Centro Commerciale", emoji: "🏬" },
        { nome: "Caserma dei Pompieri", emoji: "🚒" },
        { nome: "Isola Privata Lontana", emoji: "🏝️" },
        { nome: "Fattoria con Recinto", emoji: "🏡" },
        { nome: "Baita in Montagna", emoji: "🏔️" },
        { nome: "Camper Blindato", emoji: "🚐" },
        { nome: "Chiesa di Pietra", emoji: "⛪" },
        { nome: "Scuola Media", emoji: "🏫" }
      ],
      C: [
        { nome: "Tenda da Campeggio", emoji: "⛺" },
        { nome: "Panchina al Parco", emoji: "🪑" },
        { nome: "Stanza di Cartone", emoji: "📦" },
        { nome: "Casa sull'Albero", emoji: "🌳" },
        { nome: "Bagno Chimico", emoji: "🚻" },
        { nome: "Gazebo da Giardino", emoji: "⛱️" }
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
        { nome: "Furgone Blindato", emoji: "🚓" }
      ],
      B: [
        { nome: "Trattore Robusto", emoji: "🚜" },
        { nome: "Cavallo Docile", emoji: "🐴" },
        { nome: "Bici da Corsa", emoji: "🚲" },
        { nome: "Furgone del Pane", emoji: "🚚" },
        { nome: "Auto Familiare", emoji: "🚗" },
        { nome: "Scooter 50", emoji: "🛵" },
        { nome: "Gommone a Remi", emoji: "🛶" }
      ],
      C: [
        { nome: "Monopattino Scarico", emoji: "🛴" },
        { nome: "Pattini a Rotelle", emoji: "🛼" },
        { nome: "Carrello della Spesa", emoji: "🛒" },
        { nome: "Skateboard Rotto", emoji: "🛹" },
        { nome: "Tandem Arrugginito", emoji: "🚴" },
        { nome: "Passeggino", emoji: "🍼" }
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
        { nome: "Infermiera di Guerra", emoji: "💉" }
      ],
      B: [
        { nome: "Cane Addestrato", emoji: "🐕" },
        { nome: "Cuoco da Campo", emoji: "🍲" },
        { nome: "Ex Poliziotto", emoji: "👮" },
        { nome: "Elettricista", emoji: "💡" },
        { nome: "Campione di Atletica", emoji: "🏃" },
        { nome: "Pescatore Paziente", emoji: "🎣" },
        { nome: "Amico Silenzioso", emoji: "🤫" }
      ],
      C: [
        { nome: "Quello che Urla", emoji: "😱" },
        { nome: "Il Finto Morso", emoji: "🧟" },
        { nome: "Quello con l'Asma", emoji: "😮‍💨" },
        { nome: "Influencer in Diretta", emoji: "📱" },
        { nome: "Il Sonnambulo", emoji: "😴" },
        { nome: "Quello che Russa", emoji: "💤" }
      ]
    }
  ]
});

/* =========================================================
   DATI — Temi e carte per il gioco "L'Asta"
   Ogni tema ha 4 round; ogni round ha carte divise in
   tre fasce: A (le migliori), B (medie), C (scarti).
   Aggiungere un tema qui NON richiede di toccare il gioco.
   ========================================================= */
(window.SG_ASTA_TEMI = window.SG_ASTA_TEMI || []).push({
  id: "zombie",
  nome: "Sopravvivenza Zombie",
  icona: "🧟",
  sottotitolo: "Costruisci il kit che ti salva la pelle",
  round: [
    {
      nome: "L'Arma", icona: "🔪",
      A: [
        { nome: "Fucile a Pompa", emoji: "🔫" },
        { nome: "Balestra Silenziosa", emoji: "🏹" },
        { nome: "Katana Affilata", emoji: "🗡️" }
      ],
      B: [
        { nome: "Machete", emoji: "🔪" },
        { nome: "Mazza da Baseball", emoji: "🏏" },
        { nome: "Pistola 9mm", emoji: "🎯" },
        { nome: "Ascia da Spacco", emoji: "🪓" }
      ],
      C: [
        { nome: "Padella Bucata", emoji: "🍳" },
        { nome: "Righello di Plastica", emoji: "📏" },
        { nome: "Spazzolone per Cessi", emoji: "🚽" }
      ]
    },
    {
      nome: "Il Rifugio", icona: "🏠",
      A: [
        { nome: "Bunker Anti-Atomico", emoji: "🛡️" },
        { nome: "Isola Privata", emoji: "🏝️" },
        { nome: "Centro Commerciale", emoji: "🏬" }
      ],
      B: [
        { nome: "Baita in Montagna", emoji: "🏔️" },
        { nome: "Caserma Abbandonata", emoji: "🎖️" },
        { nome: "Scuola Media", emoji: "🏫" },
        { nome: "Camper Blindato", emoji: "🚐" }
      ],
      C: [
        { nome: "Tenda da Campeggio", emoji: "⛺" },
        { nome: "Panchina al Parco", emoji: "🪑" },
        { nome: "Stanza di Cartone", emoji: "📦" }
      ]
    },
    {
      nome: "Il Trasporto", icona: "🚗",
      A: [
        { nome: "Elicottero con Pilota", emoji: "🚁" },
        { nome: "Fuoristrada Corazzato", emoji: "🚙" },
        { nome: "Barca a Motore", emoji: "🚤" }
      ],
      B: [
        { nome: "Furgone del Pane", emoji: "🚚" },
        { nome: "Moto da Cross", emoji: "🏍️" },
        { nome: "Trattore Veloce", emoji: "🚜" },
        { nome: "Bici da Corsa", emoji: "🚲" }
      ],
      C: [
        { nome: "Monopattino Scarico", emoji: "🛴" },
        { nome: "Pattini a Rotelle", emoji: "🛼" },
        { nome: "Carrello Spesa", emoji: "🛒" }
      ]
    },
    {
      nome: "Il Compagno", icona: "🤝",
      A: [
        { nome: "Medico Chirurgo", emoji: "🩺" },
        { nome: "Soldato Scelto", emoji: "🪖" },
        { nome: "Meccanico Geniale", emoji: "🔧" }
      ],
      B: [
        { nome: "Campione Atletica", emoji: "🏃" },
        { nome: "Cuoco da Campo", emoji: "🍲" },
        { nome: "Cane Addestrato", emoji: "🐕" },
        { nome: "Amico Silenzioso", emoji: "🤫" }
      ],
      C: [
        { nome: "Quello che Urla", emoji: "😱" },
        { nome: "Il Finto Morso", emoji: "🧟" },
        { nome: "Quello con l'Asma", emoji: "😮‍💨" }
      ]
    }
  ]
});

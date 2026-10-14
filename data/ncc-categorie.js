/* =========================================================
   DATI — Categorie per il gioco "Nomi, Cose e Città".
   "normali": quelle classiche che tutti conoscono.
   "serata":  categorie divertenti da serata con gli amici.
   "pacchetti": gruppi a tema (Calcio, Cartoni, …).
   "black":   umorismo nero, da attivare a parte.
   Aggiungerne qui NON richiede di toccare il gioco (i nomi non devono ripetersi).
   Ogni categoria: { testo, emoji }.
   ========================================================= */
window.SG_NCC_CATEGORIE = {
  normali: [
    { emoji: "🧑", testo: "Nome di persona" },
    { emoji: "🏙️", testo: "Città" },
    { emoji: "🌍", testo: "Nazione" },
    { emoji: "🐘", testo: "Animale" },
    { emoji: "🎨", testo: "Colore" },
    { emoji: "🔧", testo: "Mestiere" },
    { emoji: "🍕", testo: "Cibo o bevanda" },
    { emoji: "📦", testo: "Un oggetto (cosa)" },
    { emoji: "🌱", testo: "Pianta o fiore" },
    { emoji: "🎬", testo: "Film o serie TV" },
    { emoji: "🎵", testo: "Cantante o gruppo" },
    { emoji: "⚽", testo: "Squadra o sport" },
    { emoji: "🚗", testo: "Marca" },
    { emoji: "🦸", testo: "Personaggio famoso" },
    { emoji: "🧠", testo: "Parola difficile" },
    { emoji: "👕", testo: "Capo d'abbigliamento" }
  ],
  // da serata con gli amici: niente elenco di parole giuste, decide il voto (e le risate)
  serata: [
    { emoji: "⏰", testo: "Una scusa per arrivare tardi" },
    { emoji: "🏝️", testo: "Cosa porti su un'isola deserta" },
    { emoji: "🎁", testo: "Un regalo orribile" },
    { emoji: "🐶", testo: "Un nome per un cane" },
    { emoji: "🐱", testo: "Un nome per un gatto" },
    { emoji: "👵", testo: "Un piatto della nonna" },
    { emoji: "😂", testo: "Una parola che fa ridere" },
    { emoji: "👜", testo: "Cosa trovi in una borsa" },
    { emoji: "🦸", testo: "Un superpotere inutile" },
    { emoji: "🌙", testo: "Cosa compri alle 3 di notte" },
    { emoji: "🍕", testo: "Il nome di una pizza nuova" },
    { emoji: "🙈", testo: "Un posto dove nascondersi" },
    { emoji: "💥", testo: "Una cosa che si rompe sempre" },
    { emoji: "🧶", testo: "Un hobby strano" },
    { emoji: "🧳", testo: "Cosa dimentichi in vacanza" },
    { emoji: "🏫", testo: "Una scusa per non fare i compiti" },
    { emoji: "🎤", testo: "Una cosa che si urla" },
    { emoji: "🛒", testo: "Cosa trovi al supermercato" }
  ],
  // pacchetti a tema: "Gioca solo col pacchetto" prende le prime 6
  pacchetti: [
    { nome: "Calcio", emoji: "⚽", categorie: [
      { emoji: "⚽", testo: "Calciatore" },
      { emoji: "🛡️", testo: "Squadra di calcio" },
      { emoji: "🧑‍💼", testo: "Allenatore" },
      { emoji: "🏟️", testo: "Stadio" },
      { emoji: "🌍", testo: "Nazionale di calcio" },
      { emoji: "📣", testo: "Parola del calcio" },
      { emoji: "🎙️", testo: "Telecronista o giornalista sportivo" },
      { emoji: "🙄", testo: "Scusa per una sconfitta" },
      { emoji: "🏆", testo: "Coppa o campionato" },
      { emoji: "🧢", testo: "Cosa porti allo stadio" }
    ] },
    { nome: "Cartoni animati", emoji: "📺", categorie: [
      { emoji: "📺", testo: "Cartone animato" },
      { emoji: "🐭", testo: "Personaggio dei cartoni" },
      { emoji: "👸", testo: "Principessa o principe" },
      { emoji: "😈", testo: "Cattivo dei cartoni" },
      { emoji: "🦁", testo: "Animale dei cartoni" },
      { emoji: "🦸", testo: "Supereroe" },
      { emoji: "🏯", testo: "Anime giapponese" },
      { emoji: "🧸", testo: "Giocattolo" },
      { emoji: "📚", testo: "Personaggio delle fiabe" },
      { emoji: "🪄", testo: "Oggetto magico" }
    ] },
    { nome: "Videogiochi", emoji: "🎮", categorie: [
      { emoji: "🎮", testo: "Videogioco" },
      { emoji: "🍄", testo: "Personaggio dei videogiochi" },
      { emoji: "⚡", testo: "Pokémon" },
      { emoji: "🕹️", testo: "Console o marca di videogiochi" },
      { emoji: "🎲", testo: "Gioco da tavolo o di carte" },
      { emoji: "📱", testo: "Gioco o app per il telefono" },
      { emoji: "👾", testo: "Mostro o nemico" },
      { emoji: "🗡️", testo: "Arma o potere" },
      { emoji: "🧒", testo: "Gioco da bambini" },
      { emoji: "💬", testo: "Parola da videogiocatore" }
    ] },
    { nome: "Musica italiana", emoji: "🎤", categorie: [
      { emoji: "🎤", testo: "Cantante italiano" },
      { emoji: "🎶", testo: "Canzone italiana (titolo)" },
      { emoji: "🎸", testo: "Gruppo o band" },
      { emoji: "🎹", testo: "Strumento musicale" },
      { emoji: "🎧", testo: "Genere musicale" },
      { emoji: "🌺", testo: "Canzone di Sanremo" },
      { emoji: "🧢", testo: "Rapper o trapper" },
      { emoji: "📻", testo: "Programma TV o radio di musica" },
      { emoji: "💘", testo: "Parola da canzone d'amore" },
      { emoji: "🎼", testo: "Parola della musica" }
    ] }
  ],
  black: [
    { emoji: "☠️", testo: "Un modo assurdo di morire" },
    { emoji: "🤥", testo: "Una scusa per non andare al lavoro" },
    { emoji: "💔", testo: "Un motivo per farsi lasciare" },
    { emoji: "🧟", testo: "Utile durante l'apocalisse zombie" },
    { emoji: "🔥", testo: "Cosa salvi da un incendio" },
    { emoji: "⚰️", testo: "Cosa scrivi sulla tua lapide" },
    { emoji: "👹", testo: "Nome di un mostro o demone" },
    { emoji: "😱", testo: "Una fobia ridicola" },
    { emoji: "🕳️", testo: "Scusa per un buco nel curriculum" },
    { emoji: "💊", testo: "Un effetto collaterale inventato" },
    { emoji: "🚑", testo: "Cosa non diresti mai al pronto soccorso" },
    { emoji: "🥴", testo: "Come rovinare una prima impressione" }
  ]
};

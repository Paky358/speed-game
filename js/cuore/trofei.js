/* =========================================================
   PEZZO DEL CUORE — 🏆 SFIDE E TROFEI
   La lista dei trofei (TROFEI: si aggiungono righe qui, vedi la skill «trofei»), i livelli
   bronzo/argento/oro/diamante/platino, le pagine «Trofei» e «Trofei di un gioco»,
   i premi dei trofei, l'avviso «Trofeo sbloccato!» (anche per XP e livelli: codaTrofei),
   i 🔥 giorni di fila e l'aggancio a SGNube che controlla i trofei dopo ogni salvataggio.
   Pezzo del cuore (js/core.js): prende gli aiuti dal cuore all'inizio («dal cuore»)
   e in fondo gli lascia quello che usano gli altri («al cuore»). Vedi AGENTS.md.
   ========================================================= */
(function () {
  "use strict";
  var cuore = window.SGCuore;
  // ---- dal cuore: gli aiuti che questo pezzo usa (non cambiano mai, si prendono una volta) ----
  var giochi = cuore.giochi, el = cuore.el, schermata = cuore.schermata, mostra = cuore.mostra, HOME_MENU_SOTTO = cuore.HOME_MENU_SOTTO,
      tornaHome = cuore.tornaHome, schermataHome = cuore.schermataHome, cifre = cuore.cifre, audioCtx = cuore.audioCtx;


  // ---- Sfide e Trofei (stile PlayStation: bronzo/argento/oro/diamante + platino) ----
  // Ogni trofeo confronta una statistica del profilo con una soglia (meta) e ha un
  // livello. Il PLATINO di un gioco si sblocca da solo quando prendi tutti gli altri.
  // Aggiungere/scrivere trofei = aggiungere righe qui (niente altro codice da toccare).
  var LIVELLI = {
    bronzo:   { nome: "Bronzo",   cls: "tl-bronzo" },
    argento:  { nome: "Argento",  cls: "tl-argento" },
    oro:      { nome: "Oro",      cls: "tl-oro" },
    diamante: { nome: "Diamante", cls: "tl-diamante" }
  };
  var ORDINE_LIV = ["bronzo", "argento", "oro", "diamante"];
  var TROFEI = [
    // ---- Black Jack ----
    { gioco: "blackjack", livello: "bronzo",   icona: "🪑", nome: "Il Primo Passo",           desc: "Siediti al tavolo e gioca la tua primissima mano",           stat: "maniGiocate",       meta: 1 },
    { gioco: "blackjack", livello: "bronzo",   icona: "😊", nome: "Il Primo Sorriso",         desc: "Vinci la tua prima mano contro il banco",                    stat: "maniVinte",         meta: 1 },
    { gioco: "blackjack", livello: "bronzo",   icona: "✨", nome: "Magia del Ventuno",        desc: "Fai il tuo primo Black Jack",                                stat: "blackjackFatti",    meta: 1 },
    { gioco: "blackjack", livello: "bronzo",   icona: "🎁", nome: "Piccolo Dono",             desc: "Gira per la prima volta la ruota del giorno",                 stat: "bonusRitirati",     meta: 1 },
    { gioco: "blackjack", livello: "bronzo",   icona: "🐷", nome: "Risparmiatore Felice",     desc: "Vinci 500 fiches in totale",                                 stat: "fichesVinteTot",    meta: 500 },
    { gioco: "blackjack", livello: "bronzo",   icona: "🙃", nome: "Sbagliando si Impara",     desc: "Sballa superando il 21 per 5 volte",                         stat: "maniSballate",      meta: 5 },
    { gioco: "blackjack", livello: "bronzo",   icona: "🤝", nome: "Stretta di Mano",          desc: "Pareggia con il banco 3 volte",                              stat: "maniPari",          meta: 3 },
    { gioco: "blackjack", livello: "bronzo",   icona: "🍀", nome: "Fortuna Cieca",            desc: "Vinci 5 mani perché il banco sballa",                        stat: "vinteSballoBanco",  meta: 5 },
    { gioco: "blackjack", livello: "bronzo",   icona: "🌧️", nome: "Domani Andrà Meglio",      desc: "Perdi 3 mani di fila. Non mollare!",                         stat: "serieSconfitteMax", meta: 3 },
    { gioco: "blackjack", livello: "argento",  icona: "🌊", nome: "Onda Positiva",            desc: "Vinci 20 mani contro il banco",                              stat: "maniVinte",         meta: 20 },
    { gioco: "blackjack", livello: "argento",  icona: "🎼", nome: "Armonia Perfetta",         desc: "Fai Black Jack 10 volte",                                    stat: "blackjackFatti",    meta: 10 },
    { gioco: "blackjack", livello: "argento",  icona: "📅", nome: "Appuntamento Felice",      desc: "Gira la ruota del giorno 10 volte",                            stat: "bonusRitirati",     meta: 10 },
    { gioco: "blackjack", livello: "argento",  icona: "🌾", nome: "Abbondanza",               desc: "Vinci 5.000 fiches in totale",                               stat: "fichesVinteTot",    meta: 5000 },
    { gioco: "blackjack", livello: "argento",  icona: "🌈", nome: "Ottimismo Incorreggibile", desc: "Sballa superando il 21 per 25 volte",                        stat: "maniSballate",      meta: 25 },
    { gioco: "blackjack", livello: "argento",  icona: "🫱", nome: "Pura Sinergia",            desc: "Pareggia con il banco 15 volte",                             stat: "maniPari",          meta: 15 },
    { gioco: "blackjack", livello: "argento",  icona: "🛡️", nome: "Aura Protettiva",          desc: "Vinci 25 mani perché il banco sballa",                       stat: "vinteSballoBanco",  meta: 25 },
    { gioco: "blackjack", livello: "argento",  icona: "🧊", nome: "Sangue Freddo",            desc: "Fai 21 esatto con 3 o più carte, 5 volte",                   stat: "ventunoTre",        meta: 5 },
    { gioco: "blackjack", livello: "argento",  icona: "🦁", nome: "Coraggio da Leoni",        desc: "Vinci una mano puntando almeno 500 fiches",                  stat: "puntataVintaMax",   meta: 500 },
    { gioco: "blackjack", livello: "oro",      icona: "☀️", nome: "Raggio di Sole",           desc: "Vinci 100 mani contro il banco",                             stat: "maniVinte",         meta: 100 },
    { gioco: "blackjack", livello: "oro",      icona: "🤩", nome: "Estasi del Gioco",         desc: "Fai Black Jack 50 volte",                                    stat: "blackjackFatti",    meta: 50 },
    { gioco: "blackjack", livello: "oro",      icona: "💝", nome: "Gratitudine Infinita",     desc: "Gira la ruota del giorno 50 volte",                            stat: "bonusRitirati",     meta: 50 },
    { gioco: "blackjack", livello: "oro",      icona: "💎", nome: "Tesoro Luminoso",          desc: "Vinci 25.000 fiches in totale",                              stat: "fichesVinteTot",    meta: 25000 },
    { gioco: "blackjack", livello: "oro",      icona: "🏛️", nome: "Architetto del Ventuno",   desc: "Fai 21 esatto con 3 o più carte, 20 volte",                  stat: "ventunoTre",        meta: 20 },
    { gioco: "blackjack", livello: "oro",      icona: "🔥", nome: "All-In Emotivo",           desc: "Vinci una mano puntando almeno 2.500 fiches",                stat: "puntataVintaMax",   meta: 2500 },
    { gioco: "blackjack", livello: "diamante", icona: "☁️", nome: "Nuvola Nove",              desc: "Fai 2 Black Jack di fila nella stessa sessione",             stat: "serieBJMax",        meta: 2 },
    { gioco: "blackjack", livello: "diamante", icona: "🕊️", nome: "Spirito Libero",           desc: "Vinci 7 mani di fila senza perdere né pareggiare",           stat: "serieVinteMax",     meta: 7 },
    { gioco: "blackjack", livello: "diamante", icona: "🧘", nome: "Pace dei Sensi",           desc: "Arriva ad avere 100.000 Speed Coins",                        stat: "recordFiches",      meta: 100000 },
    { gioco: "blackjack", livello: "diamante", icona: "🤹", nome: "Funambolo",                desc: "Vinci una mano con 5 o più carte senza sballare",            stat: "vinte5carte",       meta: 1 },

    // ---- Scopa ----
    { gioco: "scopa", livello: "bronzo",   icona: "🃏", nome: "Il Primo Taglio",       desc: "Gioca la tua primissima partita a Scopa",                      stat: "partite",         meta: 1 },
    { gioco: "scopa", livello: "bronzo",   icona: "🎯", nome: "Asso di Bastoni",       desc: "Vinci la tua prima partita",                                   stat: "vinte",           meta: 1 },
    { gioco: "scopa", livello: "bronzo",   icona: "🧹", nome: "Tavolo Pulito",         desc: "Fai la tua prima Scopa",                                       stat: "scope",           meta: 1 },
    { gioco: "scopa", livello: "bronzo",   icona: "7️⃣", nome: "Quello Bello",          desc: "Prendi il Settebello per la prima volta",                      stat: "settebello",      meta: 1 },
    { gioco: "scopa", livello: "bronzo",   icona: "🧮", nome: "Calcolatore",           desc: "Vinci il punto di Primiera 5 volte",                           stat: "primiera",        meta: 5 },
    { gioco: "scopa", livello: "bronzo",   icona: "🪙", nome: "Zio Paperone",          desc: "Vinci il punto dei Denari 5 volte",                            stat: "denari",          meta: 5 },
    { gioco: "scopa", livello: "bronzo",   icona: "🗃️", nome: "Pigliatutto",           desc: "Vinci il punto delle Carte 5 volte",                           stat: "carte",           meta: 5 },
    { gioco: "scopa", livello: "bronzo",   icona: "✨", nome: "Spazzata d'Oro",        desc: "Fai 5 Scope giocando o prendendo una carta di Denari",         stat: "scopeDenari",     meta: 5 },
    { gioco: "scopa", livello: "argento",  icona: "🏘️", nome: "Giocatore di Quartiere", desc: "Vinci 15 partite",                                            stat: "vinte",           meta: 15 },
    { gioco: "scopa", livello: "argento",  icona: "🧽", nome: "Ramazza d'Argento",     desc: "Fai 25 Scope in totale",                                       stat: "scope",           meta: 25 },
    { gioco: "scopa", livello: "argento",  icona: "🏹", nome: "Cacciatore di Sette",   desc: "Prendi il Settebello 25 volte",                                stat: "settebello",      meta: 25 },
    { gioco: "scopa", livello: "argento",  icona: "📐", nome: "Matematica Pura",       desc: "Vinci il punto di Primiera 25 volte",                          stat: "primiera",        meta: 25 },
    { gioco: "scopa", livello: "argento",  icona: "🔐", nome: "Cassaforte",            desc: "Vinci il punto dei Denari 25 volte",                           stat: "denari",          meta: 25 },
    { gioco: "scopa", livello: "argento",  icona: "📚", nome: "Mazzo Finito",          desc: "Vinci il punto delle Carte 25 volte",                          stat: "carte",           meta: 25 },
    { gioco: "scopa", livello: "diamante", icona: "🦹", nome: "Vittoria di Rapina",    desc: "Vinci una partita senza mai prendere il Settebello",           stat: "vinteSenzaSette", meta: 1 },
    { gioco: "scopa", livello: "oro",      icona: "👑", nome: "Boss del Tavolo",       desc: "Vinci 50 partite",                                             stat: "vinte",           meta: 50 },
    { gioco: "scopa", livello: "oro",      icona: "🌪️", nome: "L'Aspirapolvere",       desc: "Fai 100 Scope in totale",                                      stat: "scope",           meta: 100 },
    { gioco: "scopa", livello: "oro",      icona: "💞", nome: "Amico del Settebello",  desc: "Prendi il Settebello 100 volte",                               stat: "settebello",      meta: 100 },
    { gioco: "scopa", livello: "oro",      icona: "⏱️", nome: "Tempismo Perfetto",     desc: "Fai 5 Scope calando un Asso",                                  stat: "scopeAsso",       meta: 5 },
    { gioco: "scopa", livello: "argento",  icona: "🧥", nome: "Cappotto Perfetto",     desc: "Prendi Carte, Denari, Settebello e Primiera nella stessa smazzata", stat: "cappotto",   meta: 1 },
    { gioco: "scopa", livello: "oro",      icona: "📈", nome: "Sopra la Media",        desc: "4+1: i quattro punti classici più almeno una Scopa, in una smazzata", stat: "sopraMedia", meta: 1 },
    { gioco: "scopa", livello: "diamante", icona: "🧚", nome: "Mano Fatata",           desc: "Fai 4 Scope in una sola smazzata",                             stat: "scopeRoundMax",   meta: 4 },
    { gioco: "scopa", livello: "diamante", icona: "🌋", nome: "Dominio Partenopeo",    desc: "Vinci una partita lasciando l'avversario a 0 punti",           stat: "vinteAZero",      meta: 1 },
    { gioco: "scopa", livello: "diamante", icona: "🔥", nome: "Rimonta Epica",         desc: "Vinci dopo che l'avversario era arrivato a 10 punti prima di te", stat: "rimonte",      meta: 1 },

    // ---- Scopa 2 vs 2 ----
    { gioco: "scopa2v2", livello: "bronzo",   icona: "👫", nome: "Esordio di Coppia",      desc: "Gioca la tua prima partita a Scopa 2 vs 2",                 stat: "partite",            meta: 1 },
    { gioco: "scopa2v2", livello: "bronzo",   icona: "🙌", nome: "Prima Intesa",           desc: "Vinci la tua prima partita in squadra",                     stat: "vinte",              meta: 1 },
    { gioco: "scopa2v2", livello: "bronzo",   icona: "🧹", nome: "Contributo Attivo",      desc: "Fai la tua prima Scopa personale a squadre",                stat: "scopePersonali",     meta: 1 },
    { gioco: "scopa2v2", livello: "bronzo",   icona: "💰", nome: "Tesoro Condiviso",       desc: "Prendi tu il Settebello per la squadra 5 volte",            stat: "settePersonale",     meta: 5 },
    { gioco: "scopa2v2", livello: "bronzo",   icona: "🎯", nome: "Assist Perfetto",        desc: "Il compagno fa Scopa prendendo la carta che hai messo giù tu (3 volte)", stat: "assist", meta: 3 },
    { gioco: "scopa2v2", livello: "bronzo",   icona: "🧽", nome: "Spazzino di Squadra",    desc: "Fai 10 Scope personali",                                    stat: "scopePersonali",     meta: 10 },
    { gioco: "scopa2v2", livello: "argento",  icona: "💞", nome: "Affinità di Coppia",     desc: "Vinci 15 partite a squadre",                                stat: "vinte",              meta: 15 },
    { gioco: "scopa2v2", livello: "argento",  icona: "🔗", nome: "Lavoro Sincronizzato",   desc: "Tu e il compagno fate almeno 2 Scope a testa nella stessa partita", stat: "sincronizzati", meta: 1 },
    { gioco: "scopa2v2", livello: "oro",      icona: "🏋️", nome: "Il Trascinatore",        desc: "Vinci facendo tu tutte le Scope della squadra (almeno 3)",  stat: "trascinatore",       meta: 1 },
    { gioco: "scopa2v2", livello: "argento",  icona: "🏛️", nome: "Colonna Portante",       desc: "La squadra prende Primiera e Denari nella stessa smazzata (10 volte)", stat: "primDenSquadra", meta: 10 },
    { gioco: "scopa2v2", livello: "argento",  icona: "🤝", nome: "Fiducia Ripagata",       desc: "Prendi tu il Settebello 25 volte",                          stat: "settePersonale",     meta: 25 },
    { gioco: "scopa2v2", livello: "argento",  icona: "🛡️", nome: "Guardia del Corpo",      desc: "Vinci 5 partite senza che gli avversari prendano il Settebello", stat: "vinteNoSetteAvv", meta: 5 },
    { gioco: "scopa2v2", livello: "oro",      icona: "🦸", nome: "Dinamico Duo",           desc: "Vinci 50 partite a squadre",                                stat: "vinte",              meta: 50 },
    { gioco: "scopa2v2", livello: "oro",      icona: "⚡", nome: "Sinergia Totale",        desc: "Fai 100 Scope personali",                                   stat: "scopePersonali",     meta: 100 },
    { gioco: "scopa2v2", livello: "argento",  icona: "🎾", nome: "Grande Slam di Squadra", desc: "La squadra prende tutti e 4 i punti in una smazzata (5 volte)", stat: "grandeSlam",      meta: 5 },
    { gioco: "scopa2v2", livello: "oro",      icona: "🧱", nome: "Difesa di Ferro",        desc: "Vinci 10 partite senza subire nemmeno una Scopa",           stat: "vinteNoScopeSubite", meta: 10 },
    { gioco: "scopa2v2", livello: "diamante", icona: "🔮", nome: "Telepatia Pura",         desc: "Vinci 10 partite di fila",                                  stat: "serieVinteMax",      meta: 10 },
    { gioco: "scopa2v2", livello: "diamante", icona: "😵", nome: "Umiliazione di Coppia",  desc: "Vinci lasciando gli avversari a 0 punti",                   stat: "vinteAZero",         meta: 1 },
    { gioco: "scopa2v2", livello: "diamante", icona: "🔥", nome: "Eroi della Rimonta",     desc: "Vinci dopo che gli avversari erano arrivati a 10 prima di voi", stat: "rimonte",         meta: 1 },

    // ---- L'Impostore ----
    { gioco: "impostore", livello: "bronzo",   icona: "👀", nome: "Battesimo del Sospetto", desc: "Gioca la tua primissima partita",                              stat: "partite",               meta: 1 },
    { gioco: "impostore", livello: "bronzo",   icona: "🔎", nome: "Principio di Deduzione", desc: "Vota giusto l'impostore per la prima volta",                   stat: "smascherati",           meta: 1 },
    { gioco: "impostore", livello: "bronzo",   icona: "😐", nome: "Faccia di Bronzo",       desc: "Vinci la tua prima partita da impostore",                      stat: "vinteImpostore",        meta: 1 },
    { gioco: "impostore", livello: "bronzo",   icona: "🎬", nome: "Aiutino dal Regista",    desc: "Gioca da impostore con l'aiutino acceso (la parola simile)",   stat: "impostoreConAiuto",     meta: 1 },
    { gioco: "impostore", livello: "bronzo",   icona: "🐑", nome: "Vittima Sacrificale",    desc: "Sii il più votato pur essendo innocente, 3 volte",             stat: "innocenteAccusato",     meta: 3 },
    { gioco: "impostore", livello: "argento",  icona: "🕵️", nome: "Detective Dilettante",   desc: "Vota giusto l'impostore 15 volte",                             stat: "smascherati",           meta: 15 },
    { gioco: "impostore", livello: "argento",  icona: "🎭", nome: "Attore Nato",            desc: "Vinci 10 partite da impostore",                                stat: "vinteImpostore",        meta: 10 },
    { gioco: "impostore", livello: "argento",  icona: "🦠", nome: "Parassita",              desc: "Vinci 5 partite da impostore con l'aiutino acceso",            stat: "vinteImpAiutoOn",       meta: 5 },
    { gioco: "impostore", livello: "argento",  icona: "⚔️", nome: "Gioco ad Armi Impari",   desc: "Vota giusto l'impostore 10 volte quando lui aveva l'aiutino",  stat: "smascheratiControAiuto", meta: 10 },
    { gioco: "impostore", livello: "argento",  icona: "🎖️", nome: "Veterano del Sospetto",  desc: "Gioca 25 partite",                                             stat: "partite",               meta: 25 },
    { gioco: "impostore", livello: "oro",      icona: "🧥", nome: "Investigatore Privato",  desc: "Vota giusto l'impostore 50 volte",                             stat: "smascherati",           meta: 50 },
    { gioco: "impostore", livello: "oro",      icona: "🐺", nome: "Lupo tra le Pecore",     desc: "Vinci 25 partite da impostore",                                stat: "vinteImpostore",        meta: 25 },
    { gioco: "impostore", livello: "oro",      icona: "🧠", nome: "Mente Superiore",        desc: "Vinci 10 partite da impostore con l'aiutino spento",           stat: "vinteImpAiutoOff",      meta: 10 },
    { gioco: "impostore", livello: "oro",      icona: "🧊", nome: "Rompighiaccio",          desc: "Vinci da impostore quando tocca a te aprire il giro",          stat: "vinteImpApertura",      meta: 1 },
    { gioco: "impostore", livello: "diamante", icona: "🙈", nome: "Fiducia Cieca",          desc: "Vinci da impostore senza ricevere nemmeno un voto",            stat: "vinteImp0Voti",         meta: 1 },
    { gioco: "impostore", livello: "diamante", icona: "🐕", nome: "Segugio Infallibile",    desc: "Vota giusto l'impostore 5 partite di fila",                    stat: "serieSmascheratiMax",   meta: 5 },
    { gioco: "impostore", livello: "diamante", icona: "🔮", nome: "Telepatia Pura",         desc: "Vinci da impostore con l'aiutino spento e zero voti contro",   stat: "vinteImpPerfette",      meta: 1 },

    // ---- La linea del tempo ----
    { gioco: "timeline", livello: "bronzo",   icona: "📜", nome: "Prima Pagina",            desc: "Gioca la tua prima partita",                          stat: "partite",        meta: 1 },
    { gioco: "timeline", livello: "bronzo",   icona: "📶", nome: "Connessione Stabilita",   desc: "Gioca 1 partita online (ognuno dal suo telefono)",    stat: "partiteOnline",  meta: 1 },
    { gioco: "timeline", livello: "bronzo",   icona: "🏅", nome: "Il Primo Trionfo",        desc: "Vinci 1 partita online",                              stat: "vinteOnline",    meta: 1 },
    { gioco: "timeline", livello: "bronzo",   icona: "🎤", nome: "Fan del Rap",             desc: "Piazza giuste 25 carte di Rap italiano",              stat: "giuste_rap",        meta: 25 },
    { gioco: "timeline", livello: "bronzo",   icona: "📣", nome: "Tifoso",                  desc: "Piazza giuste 25 carte di Calcio",                    stat: "giuste_calcio",     meta: 25 },
    { gioco: "timeline", livello: "bronzo",   icona: "🍿", nome: "Cinefilo",                desc: "Piazza giuste 25 carte di Cinema",                    stat: "giuste_cinema",     meta: 25 },
    { gioco: "timeline", livello: "bronzo",   icona: "📚", nome: "Studente",                desc: "Piazza giuste 25 carte di Storia",                    stat: "giuste_storia",     meta: 25 },
    { gioco: "timeline", livello: "bronzo",   icona: "🔍", nome: "Curioso",                 desc: "Piazza giuste 25 carte di Invenzioni e scoperte",     stat: "giuste_invenzioni", meta: 25 },
    { gioco: "timeline", livello: "bronzo",   icona: "🪧", nome: "Paletta del Giudice",     desc: "Azzecca 10 voti sulle carte degli altri",             stat: "votiGiusti",     meta: 10 },
    { gioco: "timeline", livello: "bronzo",   icona: "🤝", nome: "Fiducia nel Prossimo",    desc: "Vota 👍 e azzeccaci 10 volte",                    stat: "votiSiGiusti",   meta: 10 },
    { gioco: "timeline", livello: "bronzo",   icona: "🌍", nome: "Cultura Generale",        desc: "Vinci una partita con tutte e 5 le categorie",        stat: "vinte5cat",      meta: 1 },
    { gioco: "timeline", livello: "bronzo",   icona: "🙈", nome: "Memoria Corta",           desc: "Sbaglia la tua primissima carta della partita",       stat: "erroriPrimaCarta", meta: 1 },
    { gioco: "timeline", livello: "bronzo",   icona: "🔭", nome: "Occhio Lungo",            desc: "5 carte giuste di fila",                              stat: "serieMax",       meta: 5 },
    { gioco: "timeline", livello: "argento",  icona: "🕰️", nome: "Viaggiatore nel Tempo",   desc: "Gioca 20 partite",                                    stat: "partite",        meta: 20 },
    { gioco: "timeline", livello: "argento",  icona: "📱", nome: "Serata Digitale",         desc: "Gioca 12 partite online",                             stat: "partiteOnline",  meta: 12 },
    { gioco: "timeline", livello: "argento",  icona: "🧊", nome: "Sangue Freddo",           desc: "Vinci 8 partite online",                              stat: "vinteOnline",    meta: 8 },
    { gioco: "timeline", livello: "argento",  icona: "💿", nome: "Disco d'Oro",             desc: "Piazza giuste 100 carte di Rap italiano",             stat: "giuste_rap",        meta: 100 },
    { gioco: "timeline", livello: "argento",  icona: "⚽", nome: "Pallone d'Oro",           desc: "Piazza giuste 100 carte di Calcio",                   stat: "giuste_calcio",     meta: 100 },
    { gioco: "timeline", livello: "argento",  icona: "🎬", nome: "Premio Oscar",            desc: "Piazza giuste 100 carte di Cinema",                   stat: "giuste_cinema",     meta: 100 },
    { gioco: "timeline", livello: "argento",  icona: "🎓", nome: "Titolare di Cattedra",    desc: "Piazza giuste 100 carte di Storia",                   stat: "giuste_storia",     meta: 100 },
    { gioco: "timeline", livello: "argento",  icona: "🧪", nome: "Premio Nobel",            desc: "Piazza giuste 100 carte di Invenzioni e scoperte",    stat: "giuste_invenzioni", meta: 100 },
    { gioco: "timeline", livello: "argento",  icona: "🧐", nome: "Il Critico",              desc: "Azzecca 50 voti sulle carte degli altri",             stat: "votiGiusti",     meta: 50 },
    { gioco: "timeline", livello: "argento",  icona: "🤨", nome: "Scettico di Professione", desc: "Vota 👎 e azzeccaci 25 volte",                    stat: "votiNoGiusti",   meta: 25 },
    { gioco: "timeline", livello: "argento",  icona: "✨", nome: "Mente Lucida",            desc: "Finisci una partita senza sbagliare nessuna carta",   stat: "perfette",       meta: 1 },
    { gioco: "timeline", livello: "argento",  icona: "🚀", nome: "Senza Rivali",            desc: "Vinci con almeno 500 punti di distacco",              stat: "distaccoMax",    meta: 500 },
    { gioco: "timeline", livello: "oro",      icona: "🏃", nome: "Maratoneta del Tempo",    desc: "Gioca 50 partite online",                             stat: "partiteOnline",  meta: 50 },
    { gioco: "timeline", livello: "oro",      icona: "👑", nome: "Dominatore Online",       desc: "Vinci 25 partite online",                             stat: "vinteOnline",    meta: 25 },
    { gioco: "timeline", livello: "oro",      icona: "🗄️", nome: "L'Archivista",            desc: "Piazza giuste 500 carte in totale",                   stat: "giusteTot",      meta: 500 },
    { gioco: "timeline", livello: "oro",      icona: "⚖️", nome: "Giudice Infallibile",     desc: "Azzecca 200 voti sulle carte degli altri",            stat: "votiGiusti",     meta: 200 },
    { gioco: "timeline", livello: "oro",      icona: "🧠", nome: "Tuttologo",               desc: "Vinci 10 partite con tutte e 5 le categorie",         stat: "vinte5cat",      meta: 10 },
    { gioco: "timeline", livello: "oro",      icona: "🏆", nome: "Collezionista",           desc: "Vinci 50 partite",                                    stat: "vinte",          meta: 50 },
    { gioco: "timeline", livello: "diamante", icona: "🏔️", nome: "Difficoltà Massima",      desc: "Partita perfetta con 8 carte a testa",                stat: "perfette8",      meta: 1 },
    { gioco: "timeline", livello: "diamante", icona: "👁️", nome: "Memoria Eidetica",        desc: "15 carte giuste di fila (vale anche tra più partite)", stat: "serieMax",      meta: 15 },
    { gioco: "timeline", livello: "diamante", icona: "🔮", nome: "Macchina della Verità",   desc: "15 voti azzeccati di fila",                           stat: "serieVotiMax",   meta: 15 },
    { gioco: "timeline", livello: "diamante", icona: "⏳", nome: "Dio del Tempo",           desc: "30 carte giuste di fila (vale anche tra più partite)", stat: "serieMax",      meta: 30 },

    // ---------- Glow Hockey (contro il bot) ----------
    { gioco: "hockey", livello: "bronzo",   icona: "🏒", nome: "Battesimo del Disco",       desc: "Gioca la tua prima partita",                          stat: "partite",           meta: 1 },
    { gioco: "hockey", livello: "bronzo",   icona: "🔥", nome: "Dito Caldo",                desc: "Segna il tuo primo gol",                              stat: "golFatti",          meta: 1 },
    { gioco: "hockey", livello: "bronzo",   icona: "🥇", nome: "La Prima Vittoria",         desc: "Vinci la tua prima partita arrivando a 7",            stat: "vittorie",          meta: 1 },
    { gioco: "hockey", livello: "bronzo",   icona: "🌡️", nome: "Riscaldamento Completato",  desc: "Batti il bot Facile",                                 stat: "vinte_facile",      meta: 1 },
    { gioco: "hockey", livello: "bronzo",   icona: "🎯", nome: "Cecchino in Erba",          desc: "Segna 50 gol in totale",                              stat: "golFatti",          meta: 50 },
    { gioco: "hockey", livello: "bronzo",   icona: "📸", nome: "Fotofinish",                desc: "Vinci una partita 7 a 6",                             stat: "fotofinish",        meta: 1 },
    { gioco: "hockey", livello: "argento",  icona: "📈", nome: "Salto di Qualità",          desc: "Batti il bot Medio",                                  stat: "vinte_medio",       meta: 1 },
    { gioco: "hockey", livello: "argento",  icona: "⚡", nome: "Goleador",                  desc: "Segna 200 gol in totale",                             stat: "golFatti",          meta: 200 },
    { gioco: "hockey", livello: "argento",  icona: "📅", nome: "Pratica Quotidiana",        desc: "Vinci 15 partite",                                    stat: "vittorie",          meta: 15 },
    { gioco: "hockey", livello: "argento",  icona: "🧱", nome: "Muro di Gomma",             desc: "Batti il bot Medio 10 volte",                         stat: "vinte_medio",       meta: 10 },
    { gioco: "hockey", livello: "argento",  icona: "🚫", nome: "Porta Inviolata",           desc: "Vinci 7 a 0 (a qualsiasi difficoltà)",                stat: "cappotti",          meta: 1 },
    { gioco: "hockey", livello: "argento",  icona: "🔄", nome: "Rimonta sul Ghiaccio",      desc: "Vinci dopo essere stato sotto di 3 gol",              stat: "rimonte",           meta: 1 },
    { gioco: "hockey", livello: "oro",      icona: "🤖", nome: "Ribellione delle Macchine", desc: "Batti il bot Difficile",                              stat: "vinte_difficile",   meta: 1 },
    { gioco: "hockey", livello: "oro",      icona: "💥", nome: "Dominatore del Disco",      desc: "Segna 500 gol in totale",                             stat: "golFatti",          meta: 500 },
    { gioco: "hockey", livello: "oro",      icona: "🏅", nome: "Professionista dell'Air Hockey", desc: "Vinci 50 partite",                               stat: "vittorie",          meta: 50 },
    { gioco: "hockey", livello: "oro",      icona: "🛡️", nome: "Antivirus",                 desc: "Batti il bot Difficile 10 volte",                     stat: "vinte_difficile",   meta: 10 },
    { gioco: "hockey", livello: "oro",      icona: "🔒", nome: "Saracinesca",               desc: "Batti il bot Medio 7 a 0",                            stat: "cappotti_medio",    meta: 1 },
    { gioco: "hockey", livello: "diamante", icona: "⚡", nome: "Riflessi Fulminei",         desc: "Batti il bot Difficile 7 a 0",                        stat: "cappotti_difficile", meta: 1 },
    { gioco: "hockey", livello: "diamante", icona: "🔌", nome: "Cortocircuito Totale",      desc: "Batti il bot Difficile 5 volte di fila (una sconfitta col Difficile azzera)", stat: "serieDiffMax", meta: 5 },
    { gioco: "hockey", livello: "diamante", icona: "👑", nome: "Leggenda del Tavolo",       desc: "Segna 1.000 gol in totale",                           stat: "golFatti",          meta: 1000 },

    // ---------- Calcio Biliardo ----------
    { gioco: "calciobiliardo", livello: "bronzo",   icona: "🏟️", nome: "Esordio in Campo",      desc: "Gioca la tua prima partita",                               stat: "partite",           meta: 1 },
    { gioco: "calciobiliardo", livello: "bronzo",   icona: "⚽", nome: "La Prima Rete",          desc: "Segna il tuo primo gol",                                    stat: "golFatti",          meta: 1 },
    { gioco: "calciobiliardo", livello: "bronzo",   icona: "🥅", nome: "Tre Punti",              desc: "Vinci la tua prima partita",                                stat: "vittorie",          meta: 1 },
    { gioco: "calciobiliardo", livello: "bronzo",   icona: "🤖", nome: "Bot, Attento!",         desc: "Batti Bot Facile",                                         stat: "vinte_facile",      meta: 1 },
    { gioco: "calciobiliardo", livello: "bronzo",   icona: "😎", nome: "Faccia da Gol",          desc: "Segna con il tuo attaccante, quello col tuo avatar",        stat: "golAttaccante",     meta: 1 },
    { gioco: "calciobiliardo", livello: "bronzo",   icona: "🌐", nome: "Vittoria in Rete",       desc: "Vinci una partita online",                                  stat: "vinteOnline",       meta: 1 },
    { gioco: "calciobiliardo", livello: "argento",  icona: "⚡", nome: "Reti in Crescita",       desc: "Segna 25 gol in totale",                                    stat: "golFatti",          meta: 25 },
    { gioco: "calciobiliardo", livello: "argento",  icona: "🧠", nome: "Bot alla Prova",        desc: "Batti Bot Medio",                                          stat: "vinte_medio",       meta: 1 },
    { gioco: "calciobiliardo", livello: "argento",  icona: "🪵", nome: "Sponda Vincente",        desc: "Segna 5 gol dopo un rimbalzo sulla sponda nello stesso tiro", stat: "golSponda",         meta: 5 },
    { gioco: "calciobiliardo", livello: "argento",  icona: "🎯", nome: "Tiro da Lontano",       desc: "Segna 5 gol partendo dalla tua metà campo",                  stat: "golLontano",        meta: 5 },
    { gioco: "calciobiliardo", livello: "argento",  icona: "⏱️", nome: "Fischio Finale",        desc: "Vinci una partita a tempo",                                  stat: "vinteTempo",        meta: 1 },
    { gioco: "calciobiliardo", livello: "oro",      icona: "💯", nome: "Cento Reti",             desc: "Segna 100 gol in totale",                                   stat: "golFatti",          meta: 100 },
    { gioco: "calciobiliardo", livello: "oro",      icona: "🦾", nome: "Bot Battuto",           desc: "Batti Bot Difficile",                                      stat: "vinte_difficile",   meta: 1 },
    { gioco: "calciobiliardo", livello: "oro",      icona: "🤝", nome: "Amici in Rete",          desc: "Vinci 10 partite online",                                   stat: "vinteOnline",       meta: 10 },
    { gioco: "calciobiliardo", livello: "oro",      icona: "🏆", nome: "Rigori da Campione",     desc: "Vinci una partita ai rigori",                               stat: "vinteRigori",       meta: 1 },
    { gioco: "calciobiliardo", livello: "oro",      icona: "🔄", nome: "Rimonta Completa",       desc: "Vinci dopo essere stato sotto di 2 gol",                    stat: "rimonte",           meta: 1 },
    { gioco: "calciobiliardo", livello: "oro",      icona: "🔔", nome: "Palo e Rete",            desc: "Segna 3 gol dopo aver colpito il palo nello stesso tiro",    stat: "golPalo",           meta: 3 },
    { gioco: "calciobiliardo", livello: "diamante", icona: "🧱", nome: "Muro Giallo e Blu",      desc: "Batti Bot Difficile senza subire gol, segnandone almeno 3", stat: "cappotti_difficile", meta: 1 },
    { gioco: "calciobiliardo", livello: "diamante", icona: "👑", nome: "Cinque Volte Bot",      desc: "Batti Bot Difficile 5 volte",                               stat: "vinte_difficile",   meta: 5 },
    { gioco: "calciobiliardo", livello: "diamante", icona: "🌟", nome: "Leggenda del Campo",     desc: "Segna 250 gol in totale",                                   stat: "golFatti",          meta: 250 },

    // ---------- Scopone (classico + scientifico, contro il computer) ----------
    { gioco: "scopone", livello: "bronzo",   icona: "🪑", nome: "Il Tavolo dei Grandi",     desc: "Gioca la tua prima partita",                          stat: "partite",           meta: 1 },
    { gioco: "scopone", livello: "bronzo",   icona: "📜", nome: "Tradizione",               desc: "Vinci una partita a Scopone Classico",                stat: "vinteClassico",     meta: 1 },
    { gioco: "scopone", livello: "bronzo",   icona: "🎓", nome: "Calcolo Mentale",          desc: "Vinci una partita a Scopone Scientifico",             stat: "vinteScientifico",  meta: 1 },
    { gioco: "scopone", livello: "bronzo",   icona: "7️⃣", nome: "Custode del Sette",        desc: "La tua squadra prende il Settebello 5 volte",         stat: "settebello",        meta: 5 },
    { gioco: "scopone", livello: "bronzo",   icona: "🪙", nome: "L'Oro del Sud",            desc: "La tua squadra vince il punto dei Denari 5 volte",    stat: "denari",            meta: 5 },
    { gioco: "scopone", livello: "bronzo",   icona: "🤝", nome: "Lavoro di Squadra",        desc: "Vinci 10 partite (le due modalità insieme)",          stat: "vinte",             meta: 10 },
    { gioco: "scopone", livello: "argento",  icona: "🏛️", nome: "Purista del Classico",     desc: "Vinci 15 partite a Scopone Classico",                 stat: "vinteClassico",     meta: 15 },
    { gioco: "scopone", livello: "argento",  icona: "🧠", nome: "Memoria di Ferro",         desc: "Vinci 15 partite a Scopone Scientifico",              stat: "vinteScientifico",  meta: 15 },
    { gioco: "scopone", livello: "argento",  icona: "🃏", nome: "Pigliatutto a Squadre",    desc: "La tua squadra vince il punto delle Carte 25 volte",  stat: "carte",             meta: 25 },
    { gioco: "scopone", livello: "argento",  icona: "🧮", nome: "Re della Primiera",        desc: "La tua squadra vince la Primiera 25 volte",           stat: "primiera",          meta: 25 },
    { gioco: "scopone", livello: "argento",  icona: "🧹", nome: "Contributo Personale",     desc: "Fai tu 50 scope",                                     stat: "scopePersonali",    meta: 50 },
    { gioco: "scopone", livello: "argento",  icona: "🚀", nome: "Partenza a Razzo",         desc: "Classico: fai scopa con la tua prima carta della smazzata", stat: "scopaPrimoTurno", meta: 1 },
    { gioco: "scopone", livello: "argento",  icona: "🎰", nome: "Grande Slam in Quattro",   desc: "Carte, Denari, Settebello e Primiera alla tua squadra in una smazzata (5 volte)", stat: "grandeSlam", meta: 5 },
    { gioco: "scopone", livello: "oro",      icona: "🎩", nome: "Signore dello Scopone",    desc: "Vinci 50 partite",                                    stat: "vinte",             meta: 50 },
    { gioco: "scopone", livello: "oro",      icona: "🤓", nome: "Il Cervellone",            desc: "Vinci 30 partite a Scopone Scientifico",              stat: "vinteScientifico",  meta: 30 },
    { gioco: "scopone", livello: "diamante", icona: "🐝", nome: "Mente Alveare",            desc: "Vinci 7 partite di fila a Scopone Scientifico",       stat: "serieSciMax",       meta: 7 },
    { gioco: "scopone", livello: "diamante", icona: "🧥", nome: "Cappotto a Quattro",       desc: "Vinci lasciando gli avversari a 0 punti",             stat: "vinteAZero",        meta: 1 },

    // ---------- La Scalinata ----------
    { gioco: "scalinata", livello: "bronzo",   icona: "🪜", nome: "Il Primo Gradino",       desc: "Gioca la tua prima partita",                          stat: "partite",           meta: 1 },
    { gioco: "scalinata", livello: "bronzo",   icona: "🦘", nome: "Salto della Quaglia",    desc: "Avanza di 5 gradini in un colpo",                     stat: "mosse5",            meta: 1 },
    { gioco: "scalinata", livello: "bronzo",   icona: "💫", nome: "Bonk!",                  desc: "Scontrati con qualcuno che ha scelto il tuo numero",  stat: "scontri",           meta: 1 },
    { gioco: "scalinata", livello: "bronzo",   icona: "🏁", nome: "Vetta Raggiunta",        desc: "Vinci la tua prima partita",                          stat: "vinte",             meta: 1 },
    { gioco: "scalinata", livello: "bronzo",   icona: "🤦", nome: "Passo Falso",            desc: "Scontrati già al primo turno",                        stat: "scontriPrimoTurno", meta: 1 },
    { gioco: "scalinata", livello: "argento",  icona: "🐜", nome: "Passo dopo Passo",       desc: "Avanza di 1 gradino 30 volte",                        stat: "mosse1",            meta: 30 },
    { gioco: "scalinata", livello: "argento",  icona: "⚖️", nome: "La Via di Mezzo",        desc: "Avanza di 3 gradini 30 volte",                        stat: "mosse3",            meta: 30 },
    { gioco: "scalinata", livello: "argento",  icona: "🦵", nome: "Falcata Lunga",          desc: "Avanza di 5 gradini 30 volte",                        stat: "mosse5",            meta: 30 },
    { gioco: "scalinata", livello: "argento",  icona: "🤕", nome: "Teste Dure",             desc: "Scontrati 100 volte in totale",                       stat: "scontri",           meta: 100 },
    { gioco: "scalinata", livello: "argento",  icona: "🧗", nome: "Scalatore Esperto",      desc: "Vinci 15 partite",                                    stat: "vinte",             meta: 15 },
    { gioco: "scalinata", livello: "argento",  icona: "🐢", nome: "Chi Va Piano...",        desc: "Vinci senza mai scegliere il 5",                      stat: "vinteSenza5",       meta: 1 },
    { gioco: "scalinata", livello: "argento",  icona: "3️⃣", nome: "La Costanza Premia",     desc: "Vinci scegliendo solo il 3, dall'inizio alla fine",   stat: "vinteSolo3",        meta: 1 },
    { gioco: "scalinata", livello: "oro",      icona: "🏔️", nome: "Alpinista",              desc: "Vinci 50 partite",                                    stat: "vinte",             meta: 50 },
    { gioco: "scalinata", livello: "oro",      icona: "🏃", nome: "Maratona Verticale",     desc: "Sali 750 gradini in totale",                          stat: "gradini",           meta: 750 },
    { gioco: "scalinata", livello: "oro",      icona: "😈", nome: "Genio del Male",         desc: "Arriva in cima nel turno in cui tutti gli altri si scontrano", stat: "vinteAltriBloccati", meta: 1 },
    { gioco: "scalinata", livello: "diamante", icona: "🛗", nome: "Ascensore Privato",      desc: "Vinci in 3 turni: 5, 5, 5 senza mai scontrarti",      stat: "vinteIn3",          meta: 1 },
    { gioco: "scalinata", livello: "diamante", icona: "👻", nome: "Il Fantasma",            desc: "Vinci senza subire nemmeno uno scontro",              stat: "vinteSenzaScontri", meta: 1 },
    // ---- TRIS (26 set 2026, liste dell'utente; "Difficile" è il bot nuovo battibile, "Impossibile" resta imbattibile) ----
    { gioco: "tris", livello: "bronzo",   icona: "✏️", nome: "Mossa d'Apertura",       desc: "Gioca la tua primissima partita",                              stat: "partite",         meta: 1 },
    { gioco: "tris", livello: "bronzo",   icona: "⭕", nome: "Il Primo Tris",          desc: "Vinci una partita, in qualsiasi modo",                          stat: "vinte",           meta: 1 },
    { gioco: "tris", livello: "bronzo",   icona: "🌱", nome: "Riscaldamento",          desc: "Batti il bot a livello Facile",                                stat: "vinteFacile",     meta: 1 },
    { gioco: "tris", livello: "bronzo",   icona: "🤝", nome: "Nessun Vincitore",       desc: "Pareggia una partita: griglia piena e nessun tris",            stat: "pareggi",         meta: 1 },
    { gioco: "tris", livello: "bronzo",   icona: "🔗", nome: "In Rete",                desc: "Gioca la tua prima partita online",                            stat: "online",          meta: 1 },
    { gioco: "tris", livello: "argento",  icona: "🧠", nome: "Pensiero Laterale",      desc: "Batti il bot a livello Medio",                                 stat: "vinteMedio",      meta: 1 },
    { gioco: "tris", livello: "argento",  icona: "📐", nome: "Geometria",              desc: "Vinci 5 partite chiudendo il tris in diagonale",               stat: "vinteDiagonale",  meta: 5 },
    { gioco: "tris", livello: "argento",  icona: "⚔️", nome: "Spirito Competitivo",    desc: "Vinci 10 partite online",                                      stat: "vinteOnline",     meta: 10 },
    { gioco: "tris", livello: "argento",  icona: "⚡", nome: "Scacco Matto in Tre",    desc: "Vinci mettendo solo 3 simboli (non vale contro il bot Facile)", stat: "vinteIn3",        meta: 1 },
    { gioco: "tris", livello: "argento",  icona: "🕊️", nome: "Pace Fatta",             desc: "Pareggia 15 partite in tutto",                                 stat: "pareggi",         meta: 15 },
    { gioco: "tris", livello: "oro",      icona: "🎓", nome: "Supera il Maestro",      desc: "Batti il bot a livello Difficile",                             stat: "vinteDifficile",  meta: 1 },
    { gioco: "tris", livello: "oro",      icona: "🏅", nome: "Insuperabile",           desc: "Vinci 20 partite online",                                      stat: "vinteOnline",     meta: 20 },
    { gioco: "tris", livello: "oro",      icona: "🧱", nome: "Muro Invalicabile",      desc: "Pareggia 5 partite di fila (senza vincere né perdere in mezzo)", stat: "serieParMax",   meta: 5 },
    { gioco: "tris", livello: "oro",      icona: "🖊️", nome: "Grafomane",              desc: "Metti 200 simboli sulla griglia in tutto",                     stat: "simboli",         meta: 200 },
    { gioco: "tris", livello: "diamante", icona: "👑", nome: "Dominio Totale",         desc: "Vinci 5 partite online di fila",                               stat: "serieOnlineMax",  meta: 5 },
    { gioco: "tris", livello: "diamante", icona: "🤖", nome: "Intelligenza Superiore", desc: "Batti il bot Difficile 5 volte",                               stat: "vinteDifficile",  meta: 5 },
    { gioco: "tris", livello: "diamante", icona: "🔮", nome: "Onniscienza",            desc: "Gioca 10 partite di fila contro il bot Difficile senza mai perdere", stat: "serieImbDiffMax", meta: 10 },
    // ---- DROP 4 (Forza 4) ----
    { gioco: "drop4", livello: "bronzo",   icona: "🟡", nome: "Battesimo di Gravità",   desc: "Gioca la tua primissima partita",                              stat: "partite",         meta: 1 },
    { gioco: "drop4", livello: "bronzo",   icona: "🎉", nome: "Finalmente Forza 4!",    desc: "Vinci la tua prima partita",                                   stat: "vinte",           meta: 1 },
    { gioco: "drop4", livello: "bronzo",   icona: "🌍", nome: "Sfida Globale",          desc: "Gioca la tua prima partita online",                            stat: "online",          meta: 1 },
    { gioco: "drop4", livello: "bronzo",   icona: "🌱", nome: "Livello Base",           desc: "Batti il bot a livello Facile",                                stat: "vinteFacile",     meta: 1 },
    { gioco: "drop4", livello: "bronzo",   icona: "🛑", nome: "Guastafeste",            desc: "Blocca 5 volte l'avversario che stava per fare 4",             stat: "blocchi",         meta: 5 },
    { gioco: "drop4", livello: "argento",  icona: "🧠", nome: "Mente Tattica",          desc: "Batti il bot a livello Medio",                                 stat: "vinteMedio",      meta: 1 },
    { gioco: "drop4", livello: "argento",  icona: "🗼", nome: "Costruttore di Torri",   desc: "Vinci 5 partite con 4 pedine in verticale",                    stat: "vinteVerticale",  meta: 5 },
    { gioco: "drop4", livello: "argento",  icona: "➖", nome: "Orizzonte Piatto",       desc: "Vinci 5 partite con 4 pedine in orizzontale",                  stat: "vinteOrizzontale", meta: 5 },
    { gioco: "drop4", livello: "argento",  icona: "⚔️", nome: "Gladiatore Online",      desc: "Vinci 10 partite online",                                      stat: "vinteOnline",     meta: 10 },
    { gioco: "drop4", livello: "argento",  icona: "🏚️", nome: "Sfratto",                desc: "Vinci con più di 21 pedine sulla griglia",                     stat: "vinteSfratto",    meta: 1 },
    { gioco: "drop4", livello: "oro",      icona: "🤖", nome: "Scacco alla Macchina",   desc: "Batti il bot a livello Difficile",                             stat: "vinteDifficile",  meta: 1 },
    { gioco: "drop4", livello: "oro",      icona: "📐", nome: "Geometria Letale",       desc: "Vinci 10 partite con 4 pedine in diagonale",                   stat: "vinteDiagonale",  meta: 10 },
    { gioco: "drop4", livello: "oro",      icona: "🏆", nome: "Leggenda della Griglia", desc: "Vinci 20 partite online",                                      stat: "vinteOnline",     meta: 20 },
    { gioco: "drop4", livello: "oro",      icona: "🌧️", nome: "Pioggia di Gettoni",     desc: "Fai cadere 300 pedine in tutto",                               stat: "gettoni",         meta: 300 },
    { gioco: "drop4", livello: "diamante", icona: "✨", nome: "Partita Perfetta",       desc: "Vinci mettendo solo 4 pedine (online o contro il Bot Difficile)", stat: "vinteIn4",        meta: 1 },
    { gioco: "drop4", livello: "diamante", icona: "💻", nome: "Dominio Cibernetico",    desc: "Batti il bot Difficile 5 volte",                               stat: "vinteDifficile",  meta: 5 },
    { gioco: "drop4", livello: "diamante", icona: "🧊", nome: "Stallo Architettonico",  desc: "Pareggia online o contro il Bot Medio o Difficile: griglia piena, nessuno fa 4",stat: "pareggi",         meta: 1 },

    // ---- BATTAGLIA NAVALE ----
    { gioco: "navale", livello: "bronzo",   icona: "🚢", nome: "Prima Salva",             desc: "Gioca la tua prima partita",                                  stat: "partite",             meta: 1 },
    { gioco: "navale", livello: "bronzo",   icona: "🎯", nome: "Tiro a Segno",             desc: "Colpisci una nave",                                           stat: "colpiAsegno",         meta: 1 },
    { gioco: "navale", livello: "bronzo",   icona: "💥", nome: "A Fondo!",                 desc: "Affonda la tua prima nave avversaria",                       stat: "naviAffondate",       meta: 1 },
    { gioco: "navale", livello: "bronzo",   icona: "🏁", nome: "Prima Vittoria",           desc: "Vinci una partita",                                           stat: "vittorie",            meta: 1 },
    { gioco: "navale", livello: "bronzo",   icona: "🔭", nome: "Buona la Prima",           desc: "Colpisci una nave con il primo tiro della partita",           stat: "primiColpiAsegno",    meta: 1 },
    { gioco: "navale", livello: "bronzo",   icona: "🔗", nome: "In Rete",                  desc: "Gioca la tua prima partita online",                           stat: "partiteOnline",       meta: 1 },
    { gioco: "navale", livello: "argento",  icona: "⚓", nome: "Marinaio Costante",        desc: "Gioca 10 partite",                                            stat: "partite",             meta: 10 },
    { gioco: "navale", livello: "argento",  icona: "🫧", nome: "Flotta negli Abissi",      desc: "Affonda 25 navi avversarie in tutto",                        stat: "naviAffondate",       meta: 25 },
    { gioco: "navale", livello: "argento",  icona: "🧭", nome: "Mira Sicura",              desc: "Colpisci 100 caselle occupate da navi",                      stat: "colpiAsegno",         meta: 100 },
    { gioco: "navale", livello: "argento",  icona: "🧠", nome: "Occhio Tattico",           desc: "Batti il bot Medio 3 volte",                                  stat: "vittorieMedio",       meta: 3 },
    { gioco: "navale", livello: "argento",  icona: "🌐", nome: "Duello Online",            desc: "Vinci 5 partite online",                                     stat: "vittorieOnline",      meta: 5 },
    { gioco: "navale", livello: "oro",      icona: "🏴‍☠️", nome: "Ammiraglio",               desc: "Vinci 25 partite",                                            stat: "vittorie",            meta: 25 },
    { gioco: "navale", livello: "oro",      icona: "🤖", nome: "Sfida Difficile",          desc: "Batti il bot Difficile",                                     stat: "vittorieDifficile",   meta: 1 },
    { gioco: "navale", livello: "oro",      icona: "🌊", nome: "Mare di Colpi",            desc: "Spara 500 volte in tutto",                                   stat: "colpi",               meta: 500 },
    { gioco: "navale", livello: "oro",      icona: "🏆", nome: "Capitano di Rete",         desc: "Vinci 15 partite online",                                    stat: "vittorieOnline",      meta: 15 },
    { gioco: "navale", livello: "diamante", icona: "💎", nome: "Lupo di Mare",              desc: "Batti il bot Difficile 3 volte di fila",                      stat: "serieDifficileMax",   meta: 3 },
    { gioco: "navale", livello: "diamante", icona: "⚡", nome: "Tiro dopo Tiro",           desc: "Colpisci 5 caselle di nave di fila",                         stat: "serieColpiMax",       meta: 5 },
    { gioco: "navale", livello: "diamante", icona: "👑", nome: "Dominio Online",           desc: "Vinci 5 partite online di fila",                             stat: "serieOnlineMax",      meta: 5 },

    // ---------- Poker ----------
    { gioco: "poker", livello: "bronzo",   icona: "🪑", nome: "Una Mano al Tavolo",     desc: "Partecipa alla tua prima mano",                              stat: "maniGiocate",             meta: 1 },
    { gioco: "poker", livello: "bronzo",   icona: "🃏", nome: "Carte Scoperte",         desc: "Vinci una mano arrivando a mostrare le carte",               stat: "maniVinteShowdown",       meta: 1 },
    { gioco: "poker", livello: "bronzo",   icona: "📈", nome: "Alzo la Puntata",        desc: "Fai il tuo primo rilancio",                                  stat: "rilanci",                 meta: 1 },
    { gioco: "poker", livello: "bronzo",   icona: "🔄", nome: "Cambio di Piano",        desc: "Cambia almeno una carta nel Poker all'italiana",            stat: "carteCambiate",           meta: 1 },
    { gioco: "poker", livello: "bronzo",   icona: "🦊", nome: "Tutti a Terra",          desc: "Vinci una mano facendo lasciare gli avversari",             stat: "maniVinteSenzaShowdown",  meta: 1 },
    { gioco: "poker", livello: "bronzo",   icona: "🌐", nome: "Primo Tavolo Online",    desc: "Gioca una mano online con almeno un'altra persona",         stat: "maniOnline",              meta: 1 },
    { gioco: "poker", livello: "bronzo",   icona: "🇮🇹", nome: "Prima Mano Italiana",    desc: "Partecipa alla tua prima mano di Poker all'italiana",      stat: "maniItaliane",            meta: 1 },
    { gioco: "poker", livello: "bronzo",   icona: "♣️", nome: "Buona la Prima",          desc: "Vinci la tua prima mano di Texas Hold'em",                 stat: "vittorieTexas",            meta: 1 },
    { gioco: "poker", livello: "argento",  icona: "🔟", nome: "Dieci Mani",             desc: "Partecipa a 10 mani",                                       stat: "maniGiocate",             meta: 10 },
    { gioco: "poker", livello: "argento",  icona: "🎭", nome: "Showdown Ricorrente",    desc: "Vinci 10 mani mostrando le carte",                           stat: "maniVinteShowdown",       meta: 10 },
    { gioco: "poker", livello: "argento",  icona: "✌️", nome: "Doppia Soddisfazione",   desc: "Vinci 3 mani con una doppia coppia",                         stat: "vittorieDoppia",          meta: 3 },
    { gioco: "poker", livello: "argento",  icona: "🗣️", nome: "Parola al Rilancio",     desc: "Vinci 3 mani dopo aver rilanciato",                          stat: "vittorieRilancio",        meta: 3 },
    { gioco: "poker", livello: "argento",  icona: "🇮🇹", nome: "Mano Rinnovata",        desc: "Vinci 3 mani dopo aver cambiato carte all'italiana",         stat: "vittorieCambio",          meta: 3 },
    { gioco: "poker", livello: "argento",  icona: "👥", nome: "Tavolo in Compagnia",   desc: "Partecipa a 10 mani online contro altre persone",           stat: "maniOnline",              meta: 10 },
    { gioco: "poker", livello: "argento",  icona: "🇺🇸", nome: "Texas in Crescita",      desc: "Vinci 5 mani di Texas Hold'em",                             stat: "vittorieTexas",            meta: 5 },
    { gioco: "poker", livello: "argento",  icona: "🔁", nome: "Tradizione Vincente",    desc: "Vinci 5 mani di Poker all'italiana",                       stat: "vittorieItaliana",         meta: 5 },
    { gioco: "poker", livello: "oro",      icona: "🦾", nome: "Bot non Molla",         desc: "Vinci 10 mani contro bot a difficoltà Difficile",           stat: "vittorieDifficile",       meta: 10 },
    { gioco: "poker", livello: "oro",      icona: "🤝", nome: "Amici al Piattone",      desc: "Vinci 10 mani online contro altre persone",                 stat: "vittorieOnline",          meta: 10 },
    { gioco: "poker", livello: "oro",      icona: "🧠", nome: "Tris o Meglio",          desc: "Vinci 10 showdown con tris o una mano più forte",            stat: "vittorieTrisPlus",        meta: 10 },
    { gioco: "poker", livello: "oro",      icona: "🏰", nome: "Castello di Carte",      desc: "Vinci allo showdown con un full, un poker o una scala colore", stat: "vittorieFullPlus",      meta: 1 },
    { gioco: "poker", livello: "oro",      icona: "🏅", nome: "Re del Tavolo",          desc: "Vinci 50 mani mostrando le carte",                           stat: "maniVinteShowdown",       meta: 50 },
    { gioco: "poker", livello: "oro",      icona: "🪜", nome: "Scala Maestra",          desc: "Vinci 5 showdown con una scala",                             stat: "vittorieScala",           meta: 5 },
    { gioco: "poker", livello: "oro",      icona: "🎨", nome: "Colore Vincente",        desc: "Vinci 2 showdown con un colore",                            stat: "vittorieColore",          meta: 2 },
    { gioco: "poker", livello: "oro",      icona: "🃏", nome: "Quattro Uguali",          desc: "Vinci allo showdown con quattro carte dello stesso valore", stat: "vittoriePoker",           meta: 1 },
    { gioco: "poker", livello: "diamante", icona: "⚔️", nome: "Tre di Fila",            desc: "Vinci 3 mani di fila contro i bot Difficili",                stat: "serieDifficileMax",       meta: 3 },
    { gioco: "poker", livello: "diamante", icona: "🔥", nome: "Cinque Online",          desc: "Vinci 5 mani online di fila contro altre persone",          stat: "serieOnlineMax",          meta: 5 },
    { gioco: "poker", livello: "diamante", icona: "♠️", nome: "Poker da Campione",       desc: "Vinci 3 showdown con un poker",                              stat: "vittoriePoker",           meta: 3 },
    { gioco: "poker", livello: "diamante", icona: "🤖", nome: "Bot non ti Ferma",       desc: "Vinci 5 mani di fila contro i bot Difficili",               stat: "serieDifficileMax",       meta: 5 },
    { gioco: "poker", livello: "diamante", icona: "🌍", nome: "Amici di Lungo Corso",   desc: "Vinci 25 mani online contro altre persone",                 stat: "vittorieOnline",          meta: 25 },

    // ---- TABOO ----
    { gioco: "taboo", livello: "bronzo",   icona: "🤐", nome: "Prima Parola",       desc: "Finisci la tua prima partita",                         stat: "partite",                  meta: 1 },
    { gioco: "taboo", livello: "bronzo",   icona: "🎙️", nome: "Prendi la Parola",   desc: "Spiega la tua prima carta alla squadra",              stat: "turniSpiegati",            meta: 1 },
    { gioco: "taboo", livello: "bronzo",   icona: "✅", nome: "Ci Siamo!",           desc: "Fai indovinare una carta alla tua squadra",          stat: "carteIndovinate",          meta: 1 },
    { gioco: "taboo", livello: "bronzo",   icona: "⏭️", nome: "Cambio Carta",        desc: "Passa una carta durante un tuo turno",               stat: "cartePassate",             meta: 1 },
    { gioco: "taboo", livello: "bronzo",   icona: "🚨", nome: "Orecchie Aperte",     desc: "Fai il tuo primo BUZZ alla squadra avversaria",      stat: "buzzFatti",                meta: 1 },
    { gioco: "taboo", livello: "bronzo",   icona: "🏆", nome: "Squadra Vincente",    desc: "Concludi una partita con la tua squadra vincitrice", stat: "vittorie",                 meta: 1 },
    { gioco: "taboo", livello: "argento",  icona: "🎲", nome: "Ci Si Rivede",        desc: "Finisci 5 partite",                                 stat: "partite",                  meta: 5 },
    { gioco: "taboo", livello: "argento",  icona: "🗣️", nome: "Voce del Gruppo",     desc: "Spiega 10 turni alla tua squadra",                  stat: "turniSpiegati",            meta: 10 },
    { gioco: "taboo", livello: "argento",  icona: "💡", nome: "Parole in Fila",      desc: "Fai indovinare 25 carte in tutto",                  stat: "carteIndovinate",          meta: 25 },
    { gioco: "taboo", livello: "argento",  icona: "🛤️", nome: "Piano B",             desc: "Passa 10 carte durante i tuoi turni",               stat: "cartePassate",             meta: 10 },
    { gioco: "taboo", livello: "argento",  icona: "🔔", nome: "Fischietto Pronto",   desc: "Fai 8 BUZZ validi contro la squadra avversaria",    stat: "buzzFatti",                meta: 8 },
    { gioco: "taboo", livello: "oro",      icona: "🥇", nome: "Capitano di Squadra", desc: "Concludi 15 partite con la tua squadra vincitrice", stat: "vittorie",                 meta: 15 },
    { gioco: "taboo", livello: "oro",      icona: "🧠", nome: "Giro di Parole",      desc: "Fai indovinare 100 carte in tutto",                 stat: "carteIndovinate",          meta: 100 },
    { gioco: "taboo", livello: "oro",      icona: "⚡", nome: "Sette di Fila",       desc: "Fai indovinare 7 carte di fila nello stesso turno", stat: "comboCarteMax",            meta: 7 },
    { gioco: "taboo", livello: "oro",      icona: "🌟", nome: "Turno da Ricordare",  desc: "Concludi 15 turni con più indovinate che BUZZ",     stat: "turniPositivi",            meta: 15 },
    { gioco: "taboo", livello: "diamante", icona: "👑", nome: "Re delle Squadre",    desc: "Concludi 25 partite con la tua squadra vincitrice", stat: "vittorie",                 meta: 25 },
    { gioco: "taboo", livello: "diamante", icona: "💥", nome: "Dieci Perfette",      desc: "Fai indovinare 10 carte di fila nello stesso turno",stat: "comboCarteMax",            meta: 10 },
    { gioco: "taboo", livello: "diamante", icona: "🔮", nome: "Intesa Imbattibile",  desc: "Concludi 5 tuoi turni positivi di fila, anche tra partite diverse", stat: "serieTurniPositiviMax", meta: 5 },

    // ---- Palla a Pendolo ----
    { gioco: "pendolo", livello: "bronzo",   icona: "🏁", nome: "Prima Partita",        desc: "Concludi la tua prima partita",                                stat: "partite",                       meta: 1 },
    { gioco: "pendolo", livello: "bronzo",   icona: "🎯", nome: "Prendi la Mira",        desc: "Gioca una partita da lanciatore",                             stat: "partiteLanciatore",             meta: 1 },
    { gioco: "pendolo", livello: "bronzo",   icona: "🏃", nome: "Piedi sulla Trave",     desc: "Gioca una partita sulla trave",                               stat: "partiteTrave",                  meta: 1 },
    { gioco: "pendolo", livello: "bronzo",   icona: "💦", nome: "Primo Tuffo",           desc: "Butta giù un avversario in una sfida",                       stat: "avversariButtati",              meta: 1 },
    { gioco: "pendolo", livello: "bronzo",   icona: "⤴️", nome: "Salto al Momento",      desc: "Schiva la palla con un salto in una sfida",                   stat: "saltiRiusciti",                 meta: 1 },
    { gioco: "pendolo", livello: "bronzo",   icona: "🏆", nome: "Prima Vittoria",        desc: "Vinci una sfida contro bot non Facili o contro una persona",  stat: "vittorie",                     meta: 1 },
    { gioco: "pendolo", livello: "argento",  icona: "🔟", nome: "Dieci Partite",         desc: "Concludi 10 partite",                                         stat: "partite",                      meta: 10 },
    { gioco: "pendolo", livello: "argento",  icona: "🎳", nome: "Caduta dopo Caduta",    desc: "Butta giù 10 avversari in totale nelle sfide",              stat: "avversariButtati",              meta: 10 },
    { gioco: "pendolo", livello: "argento",  icona: "🔥", nome: "Braccio Sicuro",        desc: "Vinci 3 sfide da lanciatore",                                 stat: "vittorieLanciatore",            meta: 3 },
    { gioco: "pendolo", livello: "argento",  icona: "⚖️", nome: "Equilibrio d'Argento",  desc: "Vinci 3 sfide sulla trave",                                   stat: "vittorieTrave",                 meta: 3 },
    { gioco: "pendolo", livello: "argento",  icona: "🌐", nome: "Pendolo in Compagnia", desc: "Vinci 3 partite online contro almeno una persona",           stat: "vittorieOnline",                meta: 3 },
    { gioco: "pendolo", livello: "oro",      icona: "📅", nome: "Serate sul Pendolo",   desc: "Concludi 25 partite",                                         stat: "partite",                      meta: 25 },
    { gioco: "pendolo", livello: "oro",      icona: "🎪", nome: "Lanciatore Esperto",    desc: "Vinci 10 sfide da lanciatore",                                stat: "vittorieLanciatore",           meta: 10 },
    { gioco: "pendolo", livello: "oro",      icona: "🦾", nome: "Bot in Acqua",         desc: "Batti 3 volte il bot Difficile giocando da lanciatore",     stat: "vittorieLanciatoreDifficile",   meta: 3 },
    { gioco: "pendolo", livello: "oro",      icona: "🛡️", nome: "Sempre in Piedi",      desc: "Resisti al bot Difficile sulla trave",                      stat: "vittorieTraveDifficile",        meta: 1 },
    { gioco: "pendolo", livello: "diamante", icona: "⚡", nome: "Lancio Lampo",          desc: "Batti il bot Difficile buttando giù tutti in 10 secondi",  stat: "triplettaDifficileVeloce",      meta: 1 },
    { gioco: "pendolo", livello: "diamante", icona: "🧿", nome: "Mira da Campione",      desc: "Batti 20 volte il bot Difficile da lanciatore",           stat: "vittorieLanciatoreDifficile",   meta: 20 },
    { gioco: "pendolo", livello: "diamante", icona: "🌊", nome: "Trave Impossibile",     desc: "Resisti 3 volte al bot Difficile sulla trave",            stat: "vittorieTraveDifficile",        meta: 3 },

    // ---- La Ruota della Fortuna ----
    { gioco: "ruota", livello: "bronzo",   icona: "🎡", nome: "Dieci Giri",          desc: "Gira la ruota 10 volte",                                      stat: "giri",                          meta: 10 },
    { gioco: "ruota", livello: "bronzo",   icona: "🅰️", nome: "Una Vocale alla Volta",desc: "Scopri 3 vocali comprate in modalità Sfida",                  stat: "vocaliIndovinate",              meta: 3 },
    { gioco: "ruota", livello: "bronzo",   icona: "🔤", nome: "Consonante Fortunata",desc: "Indovina 10 consonanti in modalità Sfida",                    stat: "consonantiIndovinate",          meta: 10 },
    { gioco: "ruota", livello: "bronzo",   icona: "💡", nome: "La Frase è Mia",       desc: "Risolvi una frase in modalità Sfida",                         stat: "frasiRisolte",                  meta: 1 },
    { gioco: "ruota", livello: "bronzo",   icona: "🏅", nome: "Vittoria in Sfida",    desc: "Vinci una partita contro il Bot Medio o Difficile, oppure contro persone", stat: "vittorieSfida", meta: 1 },
    { gioco: "ruota", livello: "bronzo",   icona: "🎤", nome: "Al Microfono",         desc: "Concludi la tua prima partita",                              stat: "partite",                       meta: 1 },
    { gioco: "ruota", livello: "argento",  icona: "🔟", nome: "Dieci Puntate",        desc: "Concludi 10 partite",                                         stat: "partite",                       meta: 10 },
    { gioco: "ruota", livello: "argento",  icona: "🧩", nome: "Frasi Svelate",        desc: "Risolvi 10 frasi in modalità Sfida",                          stat: "frasiRisolte",                  meta: 10 },
    { gioco: "ruota", livello: "argento",  icona: "🎯", nome: "Occhio alle Lettere",  desc: "Indovina 50 consonanti in modalità Sfida",                    stat: "consonantiIndovinate",          meta: 50 },
    { gioco: "ruota", livello: "argento",  icona: "🥈", nome: "Cinque Trionfi",       desc: "Vinci 5 partite in modalità Sfida",                           stat: "vittorieSfida",                 meta: 5 },
    { gioco: "ruota", livello: "argento",  icona: "🧠", nome: "Avanti il Prossimo",   desc: "Batti Bot e gli altri bot di bravura Media 3 volte",         stat: "vittorieMedio",                 meta: 3 },
    { gioco: "ruota", livello: "oro",      icona: "📅", nome: "Ruota di Serate",      desc: "Concludi 25 partite",                                         stat: "partite",                       meta: 25 },
    { gioco: "ruota", livello: "oro",      icona: "📣", nome: "Voce da Campione",     desc: "Risolvi 30 frasi in modalità Sfida",                          stat: "frasiRisolte",                  meta: 30 },
    { gioco: "ruota", livello: "oro",      icona: "💰", nome: "Manche da 5.000",      desc: "Vinci 3 manche con almeno 5.000 punti ciascuna",             stat: "mancheDa5000",                  meta: 3 },
    { gioco: "ruota", livello: "oro",      icona: "🤖", nome: "Bot al Tappeto",      desc: "Batti i bot di bravura Difficile",                            stat: "vittorieDifficile",             meta: 1 },
    { gioco: "ruota", livello: "diamante", icona: "👑", nome: "Re della Ruota",       desc: "Vinci 20 partite in modalità Sfida",                          stat: "vittorieSfida",                 meta: 20 },
    { gioco: "ruota", livello: "diamante", icona: "🛡️", nome: "Senza Bancarotta",     desc: "Batti i bot Difficili senza mai fare Bancarotta",            stat: "vittorieDifficileSenzaBancarotta", meta: 1 },
    { gioco: "ruota", livello: "diamante", icona: "💎", nome: "Partita Perfetta",     desc: "Batti i bot Difficili vincendo tutte le manche di una partita da almeno 3 manche", stat: "vittorieDifficileTutteLeManche", meta: 1 },

    // ---- L'Asta ----
    { gioco: "asta", livello: "bronzo",   icona: "🔨", nome: "Prima Asta",             desc: "Concludi la tua prima partita",                              stat: "partite",         meta: 1 },
    { gioco: "asta", livello: "bronzo",   icona: "🏆", nome: "Al Primo Posto",         desc: "Vinci una partita",                                           stat: "vinte",            meta: 1 },
    { gioco: "asta", livello: "bronzo",   icona: "🎒", nome: "Kit in Costruzione",     desc: "Gioca una partita dei Temi classici",                         stat: "partiteTemi",      meta: 1 },
    { gioco: "asta", livello: "bronzo",   icona: "⚽", nome: "Rosa al Completo",       desc: "Gioca una partita di Mini asta Fantacalcio",                  stat: "partiteFanta",     meta: 1 },
    { gioco: "asta", livello: "bronzo",   icona: "💰", nome: "La Prima Aggiudicazione",desc: "Vinci una carta con un'offerta",                               stat: "asteVinte",        meta: 1 },
    { gioco: "asta", livello: "bronzo",   icona: "⭐", nome: "Pioggia di Stelle",      desc: "Ricevi almeno 5 stelle in totale",                            stat: "stelleRicevute",   meta: 5 },
    { gioco: "asta", livello: "argento",  icona: "🔟", nome: "Dieci Serate",           desc: "Concludi 10 partite",                                         stat: "partite",          meta: 10 },
    { gioco: "asta", livello: "argento",  icona: "🥈", nome: "Cinque Vittorie",        desc: "Vinci 5 partite",                                             stat: "vinte",            meta: 5 },
    { gioco: "asta", livello: "argento",  icona: "🛎️", nome: "Banco Battuto",          desc: "Aggiudicati 20 carte con le tue offerte",                     stat: "asteVinte",        meta: 20 },
    { gioco: "asta", livello: "argento",  icona: "🌐", nome: "Tavolo Online",          desc: "Concludi 5 partite online",                                   stat: "partiteOnline",    meta: 5 },
    { gioco: "asta", livello: "argento",  icona: "🪙", nome: "Portafoglio Leggero",    desc: "Spendi 100 crediti nelle aste",                               stat: "creditiSpesi",     meta: 100 },
    { gioco: "asta", livello: "oro",      icona: "🎒", nome: "Maestro dei Temi",       desc: "Vinci 5 partite dei Temi classici",                          stat: "vinteTemi",        meta: 5 },
    { gioco: "asta", livello: "oro",      icona: "⚽", nome: "Re del Fantacalcio",     desc: "Vinci 5 partite di Mini asta Fantacalcio",                   stat: "vinteFanta",       meta: 5 },
    { gioco: "asta", livello: "oro",      icona: "🤝", nome: "Compagnia Vincente",     desc: "Vinci 10 partite online",                                    stat: "vinteOnline",      meta: 10 },
    { gioco: "asta", livello: "oro",      icona: "📣", nome: "Rilancio dopo Rilancio", desc: "Aggiudicati 50 carte con le tue offerte",                    stat: "asteVinte",        meta: 50 },
    { gioco: "asta", livello: "oro",      icona: "🌟", nome: "Kit da Applausi",        desc: "Ricevi 50 stelle in totale",                                 stat: "stelleRicevute",   meta: 50 },
    { gioco: "asta", livello: "diamante", icona: "💎", nome: "Presenza Costante",      desc: "Concludi 50 partite",                                         stat: "partite",          meta: 50 },
    { gioco: "asta", livello: "diamante", icona: "👑", nome: "Leggenda della Stanza",  desc: "Vinci 20 partite online",                                    stat: "vinteOnline",      meta: 20 },
    { gioco: "asta", livello: "diamante", icona: "⚡", nome: "Re del Martello",        desc: "Aggiudicati 100 carte con le tue offerte",                   stat: "asteVinte",        meta: 100 },

    // ---- NOMI, COSE E CITTÀ ----
    { gioco: "nomicose", livello: "bronzo",   icona: "✍️", nome: "Prima Matita",       desc: "Concludi la tua prima partita",                              stat: "partite",       meta: 1 },
    { gioco: "nomicose", livello: "bronzo",   icona: "🔤", nome: "Parola Valida",      desc: "Fai approvare la tua prima parola",                        stat: "paroleValide",  meta: 1 },
    { gioco: "nomicose", livello: "bronzo",   icona: "📋", nome: "Caselle Piene",      desc: "Completa tutte le categorie in un giro",                   stat: "giriCompleti",  meta: 1 },
    { gioco: "nomicose", livello: "bronzo",   icona: "🌐", nome: "Al Tavolo Online",   desc: "Concludi una partita online",                              stat: "partiteOnline", meta: 1 },
    { gioco: "nomicose", livello: "bronzo",   icona: "🏅", nome: "Prima Vittoria",     desc: "Vinci una partita",                                        stat: "vinte",         meta: 1 },
    { gioco: "nomicose", livello: "bronzo",   icona: "🤝", nome: "Stessa Risposta",    desc: "Scrivi 3 parole valide uguali a quelle di un altro giocatore", stat: "paroleDoppie", meta: 3 },
    { gioco: "nomicose", livello: "argento",  icona: "🔟", nome: "Serata di Parole",   desc: "Concludi 10 partite",                                      stat: "partite",       meta: 10 },
    { gioco: "nomicose", livello: "argento",  icona: "🖋️", nome: "Penna Sciolta",      desc: "Fai approvare 50 parole",                                  stat: "paroleValide",  meta: 50 },
    { gioco: "nomicose", livello: "argento",  icona: "🔁", nome: "Menti Gemelle",      desc: "Scrivi 15 parole valide uguali a quelle di un altro",        stat: "paroleDoppie", meta: 15 },
    { gioco: "nomicose", livello: "argento",  icona: "📱", nome: "Amici in Rete",      desc: "Concludi 8 partite online",                                stat: "partiteOnline", meta: 8 },
    { gioco: "nomicose", livello: "argento",  icona: "🥇", nome: "Cinque Vittorie",    desc: "Vinci 5 partite",                                          stat: "vinte",         meta: 5 },
    { gioco: "nomicose", livello: "oro",      icona: "📚", nome: "Vocabolario Vivente", desc: "Fai approvare 150 parole",                                stat: "paroleValide",  meta: 150 },
    { gioco: "nomicose", livello: "oro",      icona: "🧠", nome: "Giro Senza Macchie", desc: "Fai approvare tutte le parole in 10 giri",                stat: "giriPerfetti",  meta: 10 },
    { gioco: "nomicose", livello: "oro",      icona: "🎉", nome: "Serate in Compagnia", desc: "Concludi 25 partite",                                     stat: "partite",       meta: 25 },
    { gioco: "nomicose", livello: "oro",      icona: "🏆", nome: "Campione del Gruppo", desc: "Vinci 10 partite",                                        stat: "vinte",         meta: 10 },
    { gioco: "nomicose", livello: "oro",      icona: "🛜", nome: "Campione Connesso",  desc: "Vinci 10 partite online",                                 stat: "vinteOnline",   meta: 10 },
    { gioco: "nomicose", livello: "diamante", icona: "💎", nome: "Grande Lessico",     desc: "Fai approvare 300 parole",                                stat: "paroleValide",  meta: 300 },
    { gioco: "nomicose", livello: "diamante", icona: "👑", nome: "Re delle Parole",    desc: "Vinci 20 partite",                                        stat: "vinte",         meta: 20 },
    { gioco: "nomicose", livello: "diamante", icona: "✨", nome: "Giri da Manuale",    desc: "Fai approvare tutte le parole in 25 giri",                stat: "giriPerfetti",  meta: 25 },

    // ---- La Patata Bollente ----
    { gioco: "patata", livello: "bronzo",   icona: "💣", nome: "Si Comincia",         desc: "Concludi la tua prima partita",                                      stat: "partite",             meta: 1 },
    { gioco: "patata", livello: "bronzo",   icona: "🤲", nome: "Bomba in Mano",       desc: "Ricevi la bomba 5 volte",                                             stat: "bombeRicevute",       meta: 5 },
    { gioco: "patata", livello: "bronzo",   icona: "🏃", nome: "Passa la Patata",     desc: "Passa la bomba 5 volte",                                             stat: "passaggi",            meta: 5 },
    { gioco: "patata", livello: "bronzo",   icona: "🛡️", nome: "Ancora in Gara",      desc: "Sopravvivi a 3 esplosioni",                                          stat: "roundSopravvissuti",  meta: 3 },
    { gioco: "patata", livello: "bronzo",   icona: "🗳️", nome: "Scelta di Gruppo",    desc: "Vota una categoria in una partita online",                           stat: "votiCategoria",       meta: 1 },
    { gioco: "patata", livello: "bronzo",   icona: "📱", nome: "Prima Bomba Online",  desc: "Concludi una partita online",                                       stat: "partiteOnline",       meta: 1 },
    { gioco: "patata", livello: "argento",  icona: "🔟", nome: "Serate Esplosive",    desc: "Concludi 10 partite",                                                stat: "partite",             meta: 10 },
    { gioco: "patata", livello: "argento",  icona: "💨", nome: "Mani Veloci",         desc: "Passa la bomba 30 volte",                                           stat: "passaggi",            meta: 30 },
    { gioco: "patata", livello: "argento",  icona: "↩️", nome: "Non Era Valida",      desc: "Rimanda indietro la bomba 5 volte",                                 stat: "rimandi",             meta: 5 },
    { gioco: "patata", livello: "argento",  icona: "🧍", nome: "Duro a Morire",       desc: "Sopravvivi a 25 esplosioni",                                        stat: "roundSopravvissuti",  meta: 25 },
    { gioco: "patata", livello: "argento",  icona: "🎲", nome: "La Ruota Decide",     desc: "Gioca 3 partite con una categoria a sorpresa",                      stat: "partiteSorpresa",     meta: 3 },
    { gioco: "patata", livello: "argento",  icona: "🏆", nome: "Ultimo Rimasto",      desc: "Vinci la tua prima partita online (almeno in 3)",                    stat: "vittorie",            meta: 1 },
    { gioco: "patata", livello: "oro",      icona: "⚡", nome: "Passaggi Fulminei",   desc: "Passa la bomba 100 volte",                                          stat: "passaggi",            meta: 100 },
    { gioco: "patata", livello: "oro",      icona: "🌋", nome: "Sopravvissuto",       desc: "Sopravvivi a 60 esplosioni",                                        stat: "roundSopravvissuti",  meta: 60 },
    { gioco: "patata", livello: "oro",      icona: "🌐", nome: "Ultimo Online",       desc: "Vinci 5 partite online (almeno in 3)",                              stat: "vittorieOnline",      meta: 5 },
    { gioco: "patata", livello: "oro",      icona: "🎰", nome: "Amante del Rischio",  desc: "Gioca 10 partite con una categoria a sorpresa",                     stat: "partiteSorpresa",     meta: 10 },
    { gioco: "patata", livello: "diamante", icona: "👑", nome: "Re della Patata",     desc: "Vinci 15 partite online (almeno in 3)",                             stat: "vittorieOnline",      meta: 15 },
    { gioco: "patata", livello: "diamante", icona: "🔥", nome: "Serie Bollente",      desc: "Vinci 3 partite online di fila (almeno in 3)",                      stat: "serieVittorieMax",    meta: 3 },
    { gioco: "patata", livello: "diamante", icona: "💎", nome: "Giro Infinito",       desc: "Passa la bomba 200 volte",                                          stat: "passaggi",            meta: 200 },

    // ---- Sì... però ----
    { gioco: "sipero", livello: "bronzo",   icona: "🤨", nome: "Ci Sono Anch'io",     desc: "Concludi la tua prima partita",                              stat: "partite",          meta: 1 },
    { gioco: "sipero", livello: "bronzo",   icona: "⚖️", nome: "Primo Verdetto",       desc: "Fai da giudice in un round",                                  stat: "roundGiudice",     meta: 1 },
    { gioco: "sipero", livello: "bronzo",   icona: "🟥", nome: "Dalla Parte Giusta",   desc: "Vinci il tuo primo round in squadra",                        stat: "roundVinti",       meta: 1 },
    { gioco: "sipero", livello: "bronzo",   icona: "🟢", nome: "Un Tocco di Paradiso", desc: "Gioca 5 carte Bonus con la tua squadra",                    stat: "carteBonus",       meta: 5 },
    { gioco: "sipero", livello: "bronzo",   icona: "🔴", nome: "Piccolo Disastro",     desc: "Gioca 5 carte Malus con la tua squadra",                    stat: "carteMalus",       meta: 5 },
    { gioco: "sipero", livello: "bronzo",   icona: "🌐", nome: "Prima Stanza",         desc: "Concludi una partita online",                               stat: "partiteOnline",    meta: 1 },
    { gioco: "sipero", livello: "argento",  icona: "🔟", nome: "Serate al Circolo",    desc: "Concludi 10 partite",                                       stat: "partite",          meta: 10 },
    { gioco: "sipero", livello: "argento",  icona: "🎙️", nome: "Giudice Abituale",     desc: "Fai da giudice in 8 round",                                 stat: "roundGiudice",     meta: 8 },
    { gioco: "sipero", livello: "argento",  icona: "🏅", nome: "La Squadra Convince",  desc: "Vinci 15 round in squadra",                                 stat: "roundVinti",       meta: 15 },
    { gioco: "sipero", livello: "argento",  icona: "✨", nome: "Idee Brillanti",       desc: "Gioca 30 carte Bonus con la tua squadra",                   stat: "carteBonus",       meta: 30 },
    { gioco: "sipero", livello: "argento",  icona: "💥", nome: "Malus a Raffica",      desc: "Gioca 30 carte Malus con la tua squadra",                  stat: "carteMalus",       meta: 30 },
    { gioco: "sipero", livello: "oro",      icona: "🏆", nome: "Cinque Vittorie",      desc: "Vinci 5 partite",                                          stat: "vittorie",         meta: 5 },
    { gioco: "sipero", livello: "oro",      icona: "🧑‍⚖️", nome: "Arbitro Esperto",      desc: "Fai da giudice in 20 round",                                stat: "roundGiudice",     meta: 20 },
    { gioco: "sipero", livello: "oro",      icona: "🤝", nome: "Compagni di Avventura",desc: "Vinci 50 round in squadra",                                stat: "roundVinti",       meta: 50 },
    { gioco: "sipero", livello: "oro",      icona: "📡", nome: "Squadra Connessa",     desc: "Vinci 5 partite online facendo parte della squadra scelta", stat: "vittorieOnline",   meta: 5 },
    { gioco: "sipero", livello: "oro",      icona: "🃏", nome: "Scenari Memorabili",   desc: "Gioca 50 carte Bonus con la tua squadra",                  stat: "carteBonus",       meta: 50 },
    { gioco: "sipero", livello: "diamante", icona: "💎", nome: "Venti Serate Online",  desc: "Concludi 20 partite online",                               stat: "partiteOnline",    meta: 20 },
    { gioco: "sipero", livello: "diamante", icona: "🎓", nome: "Giudice di Fiducia",   desc: "Fai da giudice in 50 round",                                stat: "roundGiudice",     meta: 50 },
    { gioco: "sipero", livello: "diamante", icona: "🔥", nome: "Il Verdetto è Tuo",    desc: "Vinci 3 partite di fila (quelle da giudice non interrompono la serie)", stat: "serieVittorieMax", meta: 3 },

    // ---- PAROLA D'ORDINE ----
    { gioco: "ordine", livello: "bronzo",   icona: "🕵️", nome: "Prima Missione",        desc: "Concludi la tua prima partita online",                   stat: "partite",      meta: 1 },
    { gioco: "ordine", livello: "bronzo",   icona: "👑", nome: "Capo per un Giro",      desc: "Dai il tuo primo indizio valido alla squadra",          stat: "indizi",       meta: 1 },
    { gioco: "ordine", livello: "bronzo",   icona: "🔎", nome: "Occhio di Squadra",     desc: "Gira 3 parole della tua squadra",                      stat: "paroleGiuste", meta: 3 },
    { gioco: "ordine", livello: "bronzo",   icona: "🗣️", nome: "Voce al Tabellone",     desc: "Dai 5 indizi validi nel corso delle partite",          stat: "indizi",       meta: 5 },
    { gioco: "ordine", livello: "bronzo",   icona: "🏅", nome: "Prima Vittoria",        desc: "Vinci una partita con la tua squadra",                stat: "vittorie",     meta: 1 },
    { gioco: "ordine", livello: "bronzo",   icona: "⭐", nome: "Parola d'Oro",          desc: "Gira la casella speciale della parola d'oro",          stat: "paroleOro",    meta: 1 },
    { gioco: "ordine", livello: "argento",  icona: "📱", nome: "Serata in Rete",        desc: "Concludi 10 partite online",                           stat: "partiteOnline", meta: 10 },
    { gioco: "ordine", livello: "argento",  icona: "🧩", nome: "Intesa Crescente",      desc: "Gira 25 parole della tua squadra",                    stat: "paroleGiuste", meta: 25 },
    { gioco: "ordine", livello: "argento",  icona: "🎙️", nome: "Indiziere Affidabile", desc: "Dai 15 indizi validi",                                stat: "indizi",       meta: 15 },
    { gioco: "ordine", livello: "argento",  icona: "🥇", nome: "Squadra Affiatata",     desc: "Vinci 5 partite con la tua squadra",                  stat: "vittorie",     meta: 5 },
    { gioco: "ordine", livello: "argento",  icona: "🧢", nome: "Capitano Vincente",     desc: "Vinci 3 partite mentre sei il capo della squadra",    stat: "vittorieCapo", meta: 3 },
    { gioco: "ordine", livello: "oro",      icona: "🗓️", nome: "Amico del Tabellone",  desc: "Concludi 25 partite online",                           stat: "partiteOnline", meta: 25 },
    { gioco: "ordine", livello: "oro",      icona: "🧠", nome: "Mente in Sintonia",     desc: "Gira 100 parole della tua squadra",                   stat: "paroleGiuste", meta: 100 },
    { gioco: "ordine", livello: "oro",      icona: "📣", nome: "Voce Esperta",          desc: "Dai 50 indizi validi",                                stat: "indizi",       meta: 50 },
    { gioco: "ordine", livello: "oro",      icona: "🏆", nome: "Squadra Vincente",      desc: "Vinci 15 partite con la tua squadra",                 stat: "vittorie",     meta: 15 },
    { gioco: "ordine", livello: "oro",      icona: "👑", nome: "Capo che Trascina",    desc: "Vinci 6 partite mentre sei il capo della squadra",     stat: "vittorieCapo", meta: 6 },
    { gioco: "ordine", livello: "diamante", icona: "💎", nome: "Leggenda di Squadra",   desc: "Gira 150 parole della tua squadra",                   stat: "paroleGiuste", meta: 150 },
    { gioco: "ordine", livello: "diamante", icona: "🎖️", nome: "Capitano Leggendario", desc: "Vinci 12 partite da capo della squadra",              stat: "vittorieCapo", meta: 12 },
    { gioco: "ordine", livello: "diamante", icona: "🌟", nome: "Re del Tabellone",      desc: "Vinci 25 partite con la tua squadra",                 stat: "vittorie",     meta: 25 },

    // ---- Horto Muso ----
    { gioco: "horto", livello: "bronzo",   icona: "🏇", nome: "Ai Cancelletti",       desc: "Concludi la tua prima corsa",                                      stat: "partite",         meta: 1 },
    { gioco: "horto", livello: "bronzo",   icona: "🐎", nome: "Cinque Corse",          desc: "Concludi 5 corse",                                                stat: "partite",         meta: 5 },
    { gioco: "horto", livello: "bronzo",   icona: "🥉", nome: "Sul Podio",              desc: "Arriva tra i primi 3 in una corsa con almeno 4 cavalli, equilibrata o online", stat: "podi", meta: 1 },
    { gioco: "horto", livello: "bronzo",   icona: "🏁", nome: "Primo al Traguardo",    desc: "Vinci una corsa a difficoltà Media o Difficile, o online contro una persona", stat: "vittorie", meta: 1 },
    { gioco: "horto", livello: "bronzo",   icona: "🎖️", nome: "Tre Medaglie",          desc: "Arriva tra i primi 3 in 5 corse con almeno 4 cavalli, equilibrate o online", stat: "podi", meta: 5 },
    { gioco: "horto", livello: "bronzo",   icona: "⚡", nome: "Quattro in Pista",      desc: "Vinci una corsa con almeno 4 cavalli, senza scegliere Facile",   stat: "vinte4",           meta: 1 },
    { gioco: "horto", livello: "argento",  icona: "📅", nome: "Quindici Partenze",     desc: "Concludi 15 corse",                                               stat: "partite",         meta: 15 },
    { gioco: "horto", livello: "argento",  icona: "🥈", nome: "Podio Abituale",        desc: "Arriva tra i primi 3 in 15 corse con almeno 4 cavalli, equilibrate o online", stat: "podi", meta: 15 },
    { gioco: "horto", livello: "argento",  icona: "🏆", nome: "Cinque Vittorie",       desc: "Vinci 5 corse equilibrate o online",                            stat: "vittorie",        meta: 5 },
    { gioco: "horto", livello: "argento",  icona: "🧠", nome: "Bot di Buon Passo",     desc: "Batti i bot a difficoltà Media",                                stat: "vinteMedio",      meta: 1 },
    { gioco: "horto", livello: "argento",  icona: "🌐", nome: "Sfida in Compagnia",   desc: "Vinci una corsa online contro almeno una persona",               stat: "vinteOnline",     meta: 1 },
    { gioco: "horto", livello: "argento",  icona: "🐴", nome: "Otto al Via",           desc: "Vinci con 8 cavalli in gara, senza scegliere Facile",            stat: "vinte8NonFacile", meta: 1 },
    { gioco: "horto", livello: "oro",      icona: "🏟️", nome: "Stagione Completa",     desc: "Concludi 30 corse",                                               stat: "partite",         meta: 30 },
    { gioco: "horto", livello: "oro",      icona: "🥇", nome: "Quindici Traguardi",    desc: "Vinci 15 corse equilibrate o online",                           stat: "vittorie",        meta: 15 },
    { gioco: "horto", livello: "oro",      icona: "⚖️", nome: "Regolarità da Campione",desc: "Batti i bot a difficoltà Media 5 volte",                       stat: "vinteMedio",      meta: 5 },
    { gioco: "horto", livello: "oro",      icona: "🦾", nome: "Il Bot Difficile",      desc: "Batti i bot a difficoltà Difficile",                           stat: "vinteDifficile",  meta: 1 },
    { gioco: "horto", livello: "oro",      icona: "🤝", nome: "Rivincite Online",      desc: "Vinci 5 corse online contro almeno una persona",                stat: "vinteOnline",     meta: 5 },
    { gioco: "horto", livello: "diamante", icona: "👑", nome: "Cinque Volte Difficile",desc: "Batti i bot a difficoltà Difficile 5 volte",                    stat: "vinteDifficile",  meta: 5 },
    { gioco: "horto", livello: "diamante", icona: "💎", nome: "Otto Frecce",           desc: "Vinci 10 corse equilibrate con 8 cavalli",                      stat: "vinte8NonFacile", meta: 10 },
    { gioco: "horto", livello: "diamante", icona: "🌟", nome: "Leggenda dell'Ippodromo",desc: "Vinci 30 corse equilibrate o online",                          stat: "vittorie",        meta: 30 },

    // ---- Scarabocchio ----
    { gioco: "scarabocchio", livello: "bronzo",   icona: "🎨", nome: "Prima Partita",          desc: "Concludi la tua prima partita",                                                stat: "partite",                    meta: 1 },
    { gioco: "scarabocchio", livello: "bronzo",   icona: "✏️", nome: "Matita in Mano",         desc: "Disegna la tua prima parola",                                                   stat: "turniDisegnati",             meta: 1 },
    { gioco: "scarabocchio", livello: "bronzo",   icona: "💡", nome: "Prima Intuizione",       desc: "Indovina una parola",                                                           stat: "indovinate",                 meta: 1 },
    { gioco: "scarabocchio", livello: "bronzo",   icona: "🔥", nome: "Ci Sei Quasi",           desc: "Vai vicino alla parola con una risposta",                                       stat: "quasi",                      meta: 1 },
    { gioco: "scarabocchio", livello: "bronzo",   icona: "⚡", nome: "Risposta al Volo",       desc: "Indovina per primo in un turno",                                                stat: "indovinatePrimo",            meta: 1 },
    { gioco: "scarabocchio", livello: "bronzo",   icona: "👏", nome: "Disegno Apprezzato",     desc: "Fai indovinare una parola mentre disegni",                                      stat: "disegniIndovinati",          meta: 1 },
    { gioco: "scarabocchio", livello: "argento",  icona: "🔟", nome: "Serata tra Amici",       desc: "Concludi 10 partite",                                                           stat: "partite",                    meta: 10 },
    { gioco: "scarabocchio", livello: "argento",  icona: "🖌️", nome: "Matita Instancabile",    desc: "Disegna 20 parole",                                                             stat: "turniDisegnati",             meta: 20 },
    { gioco: "scarabocchio", livello: "argento",  icona: "🧠", nome: "Occhio di Falco",        desc: "Indovina 25 parole",                                                            stat: "indovinate",                 meta: 25 },
    { gioco: "scarabocchio", livello: "argento",  icona: "👥", nome: "Disegno Corale",         desc: "Fai indovinare la stessa parola ad almeno 3 persone, per 3 volte",                stat: "disegniConTreIndovinatori", meta: 3 },
    { gioco: "scarabocchio", livello: "argento",  icona: "🦉", nome: "Parole Coraggiose",      desc: "Indovina 5 parole difficili",                                                   stat: "indovinateDifficili",       meta: 5 },
    { gioco: "scarabocchio", livello: "oro",      icona: "🏆", nome: "Campione di Scarabocchio",desc: "Arriva al primo posto in 3 partite",                                           stat: "vittorie",                  meta: 3 },
    { gioco: "scarabocchio", livello: "oro",      icona: "🚀", nome: "Mani Veloci",            desc: "Indovina 10 parole quando resta almeno il 60% del tempo",                       stat: "indovinateVeloci",          meta: 10 },
    { gioco: "scarabocchio", livello: "oro",      icona: "🌟", nome: "Artista Apprezzato",     desc: "Fai indovinare 20 parole mentre disegni",                                      stat: "disegniIndovinati",         meta: 20 },
    { gioco: "scarabocchio", livello: "oro",      icona: "🐉", nome: "Matita Temeraria",       desc: "Disegna 10 parole difficili scelte da te",                                      stat: "paroleDifficiliDisegnate", meta: 10 },
    { gioco: "scarabocchio", livello: "oro",      icona: "💰", nome: "Pioggia di Punti",       desc: "Ottieni 1.000 punti indovinando parole",                                       stat: "puntiIndovinando",         meta: 1000 },
    { gioco: "scarabocchio", livello: "oro",      icona: "🧩", nome: "Parole Dure, Vittorie",  desc: "Vinci 3 partite dopo che è stata disegnata almeno una parola difficile",        stat: "vittorieDifficili",        meta: 3 },
    { gioco: "scarabocchio", livello: "diamante", icona: "👑", nome: "Maestro del Tavolo",     desc: "Arriva al primo posto in 10 partite",                                          stat: "vittorie",                  meta: 10 },
    { gioco: "scarabocchio", livello: "diamante", icona: "🌐", nome: "Tutta la Stanza",        desc: "Vinci 3 partite con almeno 6 giocatori rimasti",                                stat: "vittorieGruppo",            meta: 3 },
    { gioco: "scarabocchio", livello: "diamante", icona: "💎", nome: "Maestro delle Parole",   desc: "Fai indovinare 10 parole difficili mentre disegni",                                                  stat: "paroleDifficiliIndovinate", meta: 10 },
    { gioco: "lunghezza", livello: "bronzo",  icona: "📡", nome: "Prima Onda",         desc: "Finisci la tua prima partita",                        stat: "partite",         meta: 1 },
    { gioco: "lunghezza", livello: "bronzo",  icona: "🎯", nome: "Centro!",            desc: "Fai centro (4 punti) indovinando",                    stat: "centri",          meta: 1 },
    { gioco: "lunghezza", livello: "bronzo",  icona: "🔮", nome: "Sensitivo",          desc: "Fai il sensitivo per la prima volta",                 stat: "turniSensitivo",  meta: 1 },
    { gioco: "lunghezza", livello: "argento", icona: "⬅️", nome: "Scommettitore",      desc: "Vinci 10 scommesse a sinistra o a destra",            stat: "scommesseGiuste", meta: 10 },
    { gioco: "lunghezza", livello: "argento", icona: "🧠", nome: "Leggi nel Pensiero", desc: "Da sensitivo, fai fare centro 5 volte",               stat: "centriDati",      meta: 5 },
    { gioco: "lunghezza", livello: "argento", icona: "📶", nome: "Stessa Frequenza",   desc: "Finisci 10 partite",                                  stat: "partite",         meta: 10 },
    { gioco: "lunghezza", livello: "oro",     icona: "🏆", nome: "Campioni d'Onda",    desc: "Vinci 15 partite",                                    stat: "vittorie",        meta: 15 },
    { gioco: "lunghezza", livello: "oro",     icona: "🔭", nome: "Occhio di Lince",    desc: "Fai centro 40 volte",                                 stat: "centri",          meta: 40 },
  ];

  function valoreStat(prof, gioco, chiave) {
    var st = (window.SGNube && SGNube.statGioco) ? SGNube.statGioco(gioco) : {};
    var v = (st && st[chiave]) || 0;
    // il record fiches tiene conto anche del saldo attuale (es. dopo un bonus)
    if (chiave === "recordFiches") { var ora = prof.coins || 0; if (ora > v) v = ora; }   // fiches = Speed Coins
    return v;
  }
  function trofeiDi(gid) { return TROFEI.filter(function (t) { return t.gioco === gid; }); }
  function trofeoFatto(prof, t) { return valoreStat(prof, t.gioco, t.stat) >= t.meta; }
  function contaTrofei(prof, gid) { var l = trofeiDi(gid), n = 0; l.forEach(function (t) { if (trofeoFatto(prof, t)) n++; }); return { fatti: n, tot: l.length }; }
  function platinato(prof, gid) { var c = contaTrofei(prof, gid); return c.tot > 0 && c.fatti === c.tot; }
  var ICONE_LIV = { bronzo: "🥉", argento: "🥈", oro: "🥇", diamante: "💎" };
  function perLivello(prof, gid) {   // i trofei di un gioco divisi per tipo: { bronzo: { fatti, tot }, ... }
    var r = {}; trofeiDi(gid).forEach(function (t) { var p = r[t.livello] || (r[t.livello] = { fatti: 0, tot: 0 }); p.tot++; if (trofeoFatto(prof, t)) p.fatti++; });
    return r;
  }
  function chipLivelli(prof, gid) {   // la riga "🥉 3/9  🥈 1/6 …" sotto ogni gioco
    var pl = perLivello(prof, gid), riga = el("div", { class: "sg-livelli" });
    ORDINE_LIV.forEach(function (l) { var p = pl[l]; if (!p) return; riga.appendChild(el("span", { class: "sg-liv " + LIVELLI[l].cls + (p.fatti === p.tot ? " pieno" : ""), html: ICONE_LIV[l] + " <b>" + p.fatti + "</b>/" + p.tot })); });
    if (platinato(prof, gid)) riga.appendChild(el("span", { class: "sg-liv tl-platino pieno", html: "💠 <b>Platino</b>" }));
    return riga;
  }

  // schermata principale: l'elenco di TUTTI i giochi, ognuno coi suoi trofei dentro
  function schermataSfide() {
    var s = schermata({ icona: "🏆", titolo: "Trofei", sotto: "Colleziona i trofei di ogni gioco", indietro: tornaHome }); s._menu = "trofei";
    var prof = (window.SGNube && SGNube.disponibile()) ? SGNube.profilo() : null;
    if (!prof) {
      s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Ti serve il profilo per registrare i progressi e sbloccare i trofei: i dati ti seguono su ogni telefono." }));
      s._piede.appendChild(el("button", { class: "btn btn-primario", text: "👤 Crea / accedi al profilo", onclick: function () { cuore.schermataAccesso(schermataSfide); } }));
      mostra(s); return;
    }
    var totFatti = 0, totTrofei = 0, platini = 0, conPlatino = 0, perLiv = {};
    ["bronzo", "argento", "oro", "diamante"].forEach(function (l) { perLiv[l] = { fatti: 0, tot: 0 }; });
    TROFEI.forEach(function (t) { var p = perLiv[t.livello]; if (!p) return; p.tot++; if (trofeoFatto(prof, t)) p.fatti++; });
    giochi.forEach(function (g) { var c = contaTrofei(prof, g.id); totFatti += c.fatti; totTrofei += c.tot; if (c.tot) conPlatino++; if (platinato(prof, g.id)) platini++; });
    var pctTot = Math.floor(totFatti * 100 / Math.max(1, totTrofei));
    function cella(cls, ico, nome, f, t) {
      return el("div", { class: "sm-liv " + cls }, [ el("div", { class: "sm-ico", text: ico }), el("div", { class: "sm-num", html: "<b>" + f + "</b>/" + t }), el("div", { class: "sm-nome", text: nome }) ]);
    }
    s._contenuto.appendChild(el("div", { class: "sfide-sommario" }, [
      el("div", { class: "sm-testa", html: "🏆 <b>" + totFatti + "</b>/" + totTrofei + " trofei <span class='sm-pct'>" + pctTot + "%</span>" }),
      el("div", { class: "sg-barra sm-barra" }, [ el("div", { class: "sg-fill", style: "width:" + pctTot + "%" }) ]),
      el("div", { class: "sm-livelli" }, [
        cella("tl-bronzo", "🥉", "Bronzo", perLiv.bronzo.fatti, perLiv.bronzo.tot),
        cella("tl-argento", "🥈", "Argento", perLiv.argento.fatti, perLiv.argento.tot),
        cella("tl-oro", "🥇", "Oro", perLiv.oro.fatti, perLiv.oro.tot),
        cella("tl-diamante", "💎", "Diamante", perLiv.diamante.fatti, perLiv.diamante.tot),
        cella("tl-platino", "💠", "Platino", platini, conPlatino)
      ])
    ]));
    giochi.forEach(function (g) {
      var c = contaTrofei(prof, g.id), plat = platinato(prof, g.id), pct = Math.floor(c.fatti * 100 / Math.max(1, c.tot));
      s._contenuto.appendChild(el("button", { class: "sfida-gioco" + (plat ? " platinato" : ""), onclick: function () { schermataSfideGioco(g.id); } }, [
        el("span", { class: "sg-ico", text: g.icona || "🎮" }),
        el("div", { class: "sg-corpo" }, [
          el("div", { class: "sg-nome", text: g.nome }),
          el("div", { class: "sg-sub", html: c.tot ? (c.fatti + "/" + c.tot + " trofei" + (plat ? "  ·  💠 Platino!" : "") + " <span class='sg-pct'>" + pct + "%</span>") : "Trofei in arrivo" }),
          c.tot ? el("div", { class: "sg-barra" }, [ el("div", { class: "sg-fill", style: "width:" + pct + "%" }) ]) : null,
          c.tot ? chipLivelli(prof, g.id) : null   // quanti trofei per tipo
        ]),
        el("span", { class: "sg-frecc", text: plat ? "💠" : "›" })
      ]));
    });
    if (!HOME_MENU_SOTTO) s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: schermataHome }));   // (📱 col menu sotto è un doppione)
    mostra(s);
  }
  // schermata di un singolo gioco: platino in cima + trofei per livello
  function schermataSfideGioco(gid) {
    var g = null; giochi.forEach(function (x) { if (x.id === gid) g = x; }); if (!g) g = { nome: gid, icona: "🎮" };
    var prof = (window.SGNube && SGNube.disponibile()) ? SGNube.profilo() : null;
    var s = schermata({ icona: g.icona || "🏆", titolo: g.nome, sotto: "Trofei del gioco", indietro: schermataSfide });
    if (!prof) { s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Accedi al profilo per vedere i tuoi trofei." })); s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "‹ Tutti i giochi", onclick: schermataSfide })); mostra(s); return; }
    var lista = trofeiDi(gid), c = contaTrofei(prof, gid);
    // trofeo Platino (sempre mostrato: è il traguardo del gioco)
    var plat = c.tot > 0 && c.fatti === c.tot;
    s._contenuto.appendChild(el("div", { class: "trofeo tl-platino" + (plat ? " fatto" : "") }, [
      el("div", { class: "tr-ico", text: plat ? "💠" : "🔒" }),
      el("div", { class: "tr-corpo" }, [
        el("div", { class: "tr-nome", text: "Platino" + (plat ? "  ✓" : "") }),
        el("div", { class: "tr-desc", text: "Sblocca tutti i trofei del gioco" }),
        el("div", { class: "tr-barra" }, [ el("div", { class: "tr-fill", style: "width:" + Math.round(c.fatti * 100 / Math.max(1, c.tot)) + "%" }) ]),
        el("div", { class: "tr-num", text: c.fatti + " / " + c.tot })
      ])
    ]));
    if (!lista.length) {
      s._contenuto.appendChild(el("p", { class: "modulo-nota", style: "margin-top:14px", text: "Le sfide di " + g.nome + " arrivano presto — le definiamo insieme. Intanto le tue partite vengono già registrate." }));
    } else {
      var pl = perLivello(prof, gid), celle = [];   // in cima: quanti trofei per tipo, come nella schermata di tutti i giochi
      ORDINE_LIV.forEach(function (l) { var p = pl[l] || { fatti: 0, tot: 0 }; celle.push(el("div", { class: "sm-liv " + LIVELLI[l].cls }, [ el("div", { class: "sm-ico", text: ICONE_LIV[l] }), el("div", { class: "sm-num", html: "<b>" + p.fatti + "</b>/" + p.tot }), el("div", { class: "sm-nome", text: LIVELLI[l].nome }) ])); });
      celle.push(el("div", { class: "sm-liv tl-platino" }, [ el("div", { class: "sm-ico", text: "💠" }), el("div", { class: "sm-num", html: "<b>" + (plat ? 1 : 0) + "</b>/1" }), el("div", { class: "sm-nome", text: "Platino" }) ]));
      s._contenuto.appendChild(el("div", { class: "sfide-sommario sm-gioco" }, [ el("div", { class: "sm-livelli" }, celle) ]));
      ORDINE_LIV.forEach(function (liv) {
        var gruppo = lista.filter(function (t) { return t.livello === liv; });
        if (!gruppo.length) return;
        s._contenuto.appendChild(el("div", { class: "etichetta", text: ICONE_LIV[liv] + " " + LIVELLI[liv].nome + " · " + (pl[liv] ? pl[liv].fatti : 0) + "/" + gruppo.length }));
        gruppo.forEach(function (t) {
          var val = valoreStat(prof, t.gioco, t.stat), fatto = val >= t.meta;
          var perc = Math.max(0, Math.min(100, Math.round(val * 100 / t.meta)));
          s._contenuto.appendChild(el("div", { class: "trofeo " + LIVELLI[liv].cls + (fatto ? " fatto" : "") }, [
            el("div", { class: "tr-ico", text: fatto ? t.icona : "🔒" }),
            el("div", { class: "tr-corpo" }, [
              el("div", { class: "tr-nome", text: t.nome + (fatto ? "  ✓" : "") }),
              el("div", { class: "tr-desc", text: t.desc }),
              el("div", { class: "tr-barra" }, [ el("div", { class: "tr-fill", style: "width:" + perc + "%" }) ]),
              el("div", { class: "tr-num", text: Math.min(val, t.meta) + " / " + t.meta })
            ])
          ]));
        });
      });
    }
    s._piede.appendChild(el("button", { class: "btn btn-fantasma", text: "‹ Tutti i giochi", onclick: schermataSfide }));
    mostra(s);
  }

  // ---- Avviso "Trofeo sbloccato!" (pochi secondi, con suono e vibrazione) ----
  // Ricorda i trofei già presi dal profilo: dopo ogni salvataggio controlla se ne è
  // arrivato uno nuovo. Al primo caricamento (o cambio profilo) non avvisa di nulla.
  var trofeiNoti = null, codaTrofei = [], avvisoAttivo = false;
  function trofeiSbloccati(prof) {
    var s = {};
    TROFEI.forEach(function (t) { if (trofeoFatto(prof, t)) s[t.gioco + "|" + t.nome] = t; });
    giochi.forEach(function (g) { if (platinato(prof, g.id)) s[g.id + "|__platino"] = { gioco: g.id, livello: "platino", icona: "💠", nome: "Platino" }; });
    return s;
  }
  function controllaTrofei() {
    var prof = (window.SGNube && SGNube.disponibile()) ? SGNube.profilo() : null;
    if (!prof) { trofeiNoti = null; return; }
    var ora = trofeiSbloccati(prof), nuovi = {};
    if (trofeiNoti && trofeiNoti.uid === prof.uid) {
      for (var k in ora) if (!trofeiNoti.set[k]) { codaTrofei.push(ora[k]); nuovi[k] = 1; }
      // il Platino arriva per ultimo, dopo i trofei che l'hanno fatto scattare
      codaTrofei.sort(function (a, b) { return (a.livello === "platino") - (b.livello === "platino"); });
      prossimoAvviso();
    }
    trofeiNoti = { uid: prof.uid, set: ora };
    pubblicaTrofei(prof, ora);
    premiaTrofei(prof, ora, nuovi);
  }
  // ---- i premi dei trofei: ogni trofeo dà XP e Speed Coins secondo il livello, una volta sola per profilo
  //      (anche quelli presi prima che esistessero i premi: arrivano tutti insieme in un regalo) ----
  var PREMI_TROFEI = { bronzo: { xp: 100, monete: 100 }, argento: { xp: 250, monete: 250 }, oro: { xp: 600, monete: 600 },
    diamante: { xp: 1500, monete: 1500 }, platino: { xp: 3000, monete: 3000 } };
  function premioTesto(livello) { var p = PREMI_TROFEI[livello]; return p ? " · +" + cifre(p.xp) + " XP · +" + cifre(p.monete) + " 🪙" : ""; }
  function chiaveTrofeo(k) { var h = 5381; for (var i = 0; i < k.length; i++) h = (Math.imul(h, 33) ^ k.charCodeAt(i)) >>> 0; return "t" + h.toString(36); }
  function premiaTrofei(prof, ora, inVista) {
    if (!(window.SGNube && SGNube.premiaTrofei && window.SGLivelli)) return;
    var fatti = prof.premiTrofei || {}, chiavi = [], xp = 0, mon = 0, xpN = 0, monN = 0, nascosti = 0;
    for (var k in ora) {
      var c = chiaveTrofeo(k), p = PREMI_TROFEI[ora[k].livello];
      if (!p || fatti[c]) continue;
      chiavi.push(c); xp += p.xp; mon += p.monete;
      if (!inVista[k]) { nascosti++; xpN += p.xp; monN += p.monete; }   // quelli senza il loro avviso (presi prima)
    }
    if (!chiavi.length) return;
    var r = SGNube.premiaTrofei(chiavi, xp, mon); if (!r) return;
    if (nascosti) codaTrofei.push({ tipo: "xp", cls: "tl-oro", icona: "🎁", su: nascosti === 1 ? "Premio di un trofeo" : "Premi dei tuoi " + nascosti + " trofei",
      nome: "+" + cifre(xpN) + " XP · +" + cifre(monN) + " Speed Coins", sotto: "Ogni trofeo ora dà XP e monete 🪙" });
    var lv = 0, pr = 0, m2 = 0;
    r.eventi.forEach(function (e) { m2 += e.monete; if (e.tipo === "livello") lv = e.livello; if (e.tipo === "prestigio") pr = e.prestigio; });
    if (pr) codaTrofei.push({ tipo: "xp", cls: "tl-platino", icona: "🌟", su: "PRESTIGIO " + pr + "!", nome: "Si riparte dal livello 1", sotto: "+" + cifre(m2) + " Speed Coins 🪙" });
    else if (lv) codaTrofei.push({ tipo: "xp", cls: "tl-oro", icona: "🆙", su: "Coi premi dei trofei", nome: "Livello " + lv + "!", sotto: "+" + cifre(m2) + " Speed Coins 🪙" });
    prossimoAvviso();
  }
  // la "scheda" che vedono gli amici: quanti trofei, per livello e per gioco
  function pubblicaTrofei(prof, set) {
    if (!(window.SGNube && SGNube.pubblica)) return;
    var liv = { platino: 0, diamante: 0, oro: 0, argento: 0, bronzo: 0 }, perGioco = {}, n = 0;
    for (var k in set) { var t = set[k]; n++; if (liv[t.livello] != null) liv[t.livello]++; perGioco[t.gioco] = (perGioco[t.gioco] || 0) + 1; }
    SGNube.pubblica({ trofei: n, liv: liv, giochi: perGioco });
    cuore.pubblicaCasa();
  }
  // ---- 🔥 i giorni di fila: entrando col profilo si conta il giorno; al 7°, al 30° e ogni 100 giorni c'è il premio (nube.js) ----
  function prossimoPremioGiorni(n) { var m = n < 7 ? 7 : n < 30 ? 30 : (Math.floor(n / 100) + 1) * 100; return { giorno: m, monete: SGNube.premioGiorni(m) }; }
  function fuocoGiorni() { var p = window.SGNube && SGNube.profilo && SGNube.profilo(); return p && p.giorniFila >= 2 ? " · 🔥 " + p.giorniFila : ""; }
  function controllaGiorno() {
    if (!(window.SGNube && SGNube.segnaGiorno && SGNube.profilo && SGNube.profilo())) return;
    var r = SGNube.segnaGiorno(); if (!r || (r.n < 2 && !r.premio)) return;   // il primo giorno non si festeggia
    var pp = prossimoPremioGiorni(r.n), manca = pp.giorno - r.n;
    codaTrofei.push({ tipo: "xp", cls: r.premio ? "tl-oro" : "tl-xp", icona: "🔥", su: r.premio ? "PREMIO GIORNI DI FILA!" : "Bentornato!", nome: r.n + " giorni di fila!",
      sotto: r.premio ? "+" + cifre(r.premio) + " Speed Coins 🪙" : "Ancora " + manca + (manca === 1 ? " giorno" : " giorni") + " per il premio di " + cifre(pp.monete) + " 🪙" });
    prossimoAvviso();
  }
  function prossimoAvviso() {
    if (avvisoAttivo || !codaTrofei.length) return;
    avvisoAttivo = true;
    var t = codaTrofei.shift(), g = null, xp = t.tipo === "xp";   // xp = avviso di XP / livello / Prestigio
    giochi.forEach(function (x) { if (x.id === t.gioco) g = x; });
    var liv = t.livello === "platino" ? "Platino" : (LIVELLI[t.livello] ? LIVELLI[t.livello].nome : "");
    var fatto = false, timer = null;
    var box = el("div", { class: "avviso-trofeo " + (xp ? t.cls : "tl-" + t.livello), onclick: function () { chiudi(); } }, [
      el("div", { class: "at-ico", text: t.icona || "🏆" }),
      el("div", { class: "at-corpo" }, [
        el("div", { class: "at-su", text: xp ? t.su : "🏆 Trofeo " + liv + " sbloccato!" }),
        el("div", { class: "at-nome", text: t.nome }),
        el("div", { class: "at-gioco", text: xp ? t.sotto : (g ? g.nome : "") + premioTesto(t.livello) })   // il premio del trofeo
      ])
    ]);
    document.body.appendChild(box);   // fuori dalla schermata: resta anche se il gioco cambia pagina
    requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add("dentro"); }); });
    if (!xp) {
      suonoTrofeo(t.livello === "platino");
      try { if (navigator.vibrate) navigator.vibrate(t.livello === "platino" ? [40, 60, 40, 60, 80] : [30, 40, 30]); } catch (e) {}
    } else if (t.cls !== "tl-xp") suonoTrofeo(t.cls === "tl-platino");   // livello salito o Prestigio: il suono del trofeo
    timer = setTimeout(chiudi, xp && t.cls === "tl-xp" ? 3000 : 3600);
    function chiudi() {
      if (fatto) return; fatto = true; clearTimeout(timer);
      box.classList.remove("dentro");
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); avvisoAttivo = false; prossimoAvviso(); }, 380);
    }
  }
  function suonoTrofeo(platino) {
    var ctx = audioCtx(); if (!ctx) return;
    try {
      (platino ? [784, 988, 1175, 1568] : [880, 1320]).forEach(function (f, i) {
        var t0 = ctx.currentTime + i * 0.11, o = ctx.createOscillator(), gn = ctx.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(f, t0);
        gn.gain.setValueAtTime(0.0001, t0);
        gn.gain.exponentialRampToValueAtTime(0.22, t0 + 0.015);
        gn.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.38);
        o.connect(gn); gn.connect(ctx.destination); o.start(t0); o.stop(t0 + 0.42);
      });
    } catch (e) {}
  }
  // controlla dopo ogni salvataggio dei giochi e a ogni cambio del profilo (es. bonus ritirato)
  if (window.SGNube) {
    ["salvaProgressi", "salvaFiches"].forEach(function (nome) {
      var orig = SGNube[nome]; if (!orig) return;
      SGNube[nome] = function () { var r = orig.apply(SGNube, arguments); controllaTrofei(); return r; };
    });
    SGNube.onCambio(controllaTrofei);
    SGNube.onCambio(function () { setTimeout(controllaGiorno, 0); });   // i giorni di fila: appena c'è il profilo (e se l'app resta aperta dopo mezzanotte)
  }

  // ---- al cuore: quello di questo pezzo che usano il cuore e gli altri pezzi ----
  cuore.controllaGiorno = controllaGiorno; cuore.controllaTrofei = controllaTrofei; cuore.fuocoGiorni = fuocoGiorni;
  cuore.prossimoAvviso = prossimoAvviso; cuore.prossimoPremioGiorni = prossimoPremioGiorni; cuore.schermataSfide = schermataSfide;
  cuore.schermataSfideGioco = schermataSfideGioco; cuore.trofeiDi = trofeiDi; cuore.trofeiSbloccati = trofeiSbloccati;
  cuore.trofeoFatto = trofeoFatto; cuore.valoreStat = valoreStat;
  Object.defineProperty(cuore, "TROFEI", { get: function () { return TROFEI; }, configurable: true });
  Object.defineProperty(cuore, "codaTrofei", { get: function () { return codaTrofei; }, configurable: true });
})();

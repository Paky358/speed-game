/* =========================================================
   DATI — «Chi di Noi?», autore 4: Gli amici di sempre
   Posti: calcetto, sabato, ufficio.
   {P} = nome di chi è sotto torchio. {o|a} = finale maschile|femminile secondo il suo avatar.
   ========================================================= */
window.SG_CHIDINOI = window.SG_CHIDINOI || { posti: [], comuni: [] };

/* ---------------------------------------------------------
   ⚽ AL CALCETTO DEL GIOVEDÌ
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "calcetto", cod: "cal", nome: "Al calcetto del giovedì", emoji: "⚽",
  adesivi: "⚽🥅🧤👟🏆🧃📣🟨🟥🩹🍕🎽",
  entrata: [
    "Giovedì, ore 21, campo 3. Eravamo in nove: per fortuna è arrivat{o|a} {P}.",
    "Squadre col bim bum bam: {P} è già in porta, e non l'ha chiesto.",
    "Fari accesi, rete rotta, borsoni in panchina: entra {P}, si comincia."
  ],
  immagini: [
    { id: "cal-i01", q: "Manca il decimo. Chi è l'amico dell'ultimo minuto che {P} porta al calcetto?", carte: [
      { chi: "nonno", faccia: "esulta", piu: { cappello: "coppola" }, t: "Ha 78 anni, gioca coi mocassini" },
      { chi: "cugino", faccia: "indifferente", piu: { cappello: "cuffie" }, t: "Il cugino che non toglie le cuffie" },
      { chi: "turista", faccia: "felice", t: "Un turista che passava di lì" },
      { chi: "calciatore", faccia: "furbo", piu: { stampa: "numero" }, t: "Giura di aver fatto la Primavera" }
    ] },
    { id: "cal-i02", q: "Chi arbitra la partita del giovedì di {P}?", carte: [
      { chi: "arbitro", faccia: "arrabbiato", piu: { collo: "fischietto" }, t: "Fischia tutto, anche i sospiri" },
      { chi: "nonno", faccia: "sonno", t: "Il nonno di uno: dorme in panchina" },
      { chi: "bimbo", faccia: "furbo", t: "Il figlio del portiere: tifa papà" },
      { chi: "vigile", faccia: "felice", t: "Un vigile in pensione: solo multe" }
    ] },
    { id: "cal-i03", q: "Al torneo dei bar, la squadra di {P} prende un allenatore. Chi è?", carte: [
      { chi: "allenatore", faccia: "arrabbiato", t: "Urla tutto il tempo, anche ai suoi" },
      { chi: "nonna", faccia: "felice", piu: { mano: "libro" }, t: "Nonna: schemi fatti all'uncinetto" },
      { chi: "mago", faccia: "pensieroso", piu: { cappello: "mago" }, t: "Fa i cambi coi tarocchi" },
      { chi: "influencer", faccia: "estasi", piu: { mano: "telefono" }, t: "Fa solo dirette dalla panchina" }
    ] },
    { id: "cal-i04", q: "Rigore decisivo all'ultimo minuto. Chi è il portiere che {P} deve battere?", carte: [
      { chi: "nonno", faccia: "sonno", t: "Si appoggia al palo e sonnecchia" },
      { chi: "ballerino", faccia: "linguaccia", t: "Balla sulla linea per distrarre" },
      { chi: "mago", faccia: "furbo", piu: { occhiali: "monocolo" }, t: "Dice di aver già visto il futuro" },
      { chi: "cuoco", faccia: "felice", piu: { mano: "pizza" }, t: "Promette la pizza se sbagli" }
    ] },
    { id: "cal-i05", q: "Terzo tempo in pizzeria dopo la partita. Chi si siede vicino a {P}?", carte: [
      { chi: "allenatore", faccia: "pensieroso", t: "Rivede la partita sul tovagliolo" },
      { chi: "cugino", faccia: "sonno", t: "Si addormenta sui supplì" },
      { chi: "calciatore", faccia: "esulta", piu: { mano: "trofeo" }, t: "Racconta il suo gol: 14 volte" },
      { chi: "arbitro", faccia: "arrabbiato", t: "L'arbitro, ancora offeso" }
    ] },
    { id: "cal-i06", q: "Arrivati al campo, lo trovano occupato. Chi c'è al posto della squadra di {P}?", carte: [
      { chi: "ballerino", f: "d", faccia: "estasi", t: "Un corso di zumba, in ritardo" },
      { chi: "bimbo", faccia: "furbo", piu: { mano: "pallone" }, t: "Bimbi che sfidano: chi perde esce" },
      { chi: "nonno", faccia: "indifferente", t: "Due nonni che giocano a bocce" },
      { chi: "scout", faccia: "felice", t: "Gli scout piantano le tende" }
    ] },
    { id: "cal-i07", q: "Al calcetto del giovedì arriva un tifoso solo per {P}. Chi è?", carte: [
      { chi: "mamma", faccia: "esulta", piu: { mano: "bandiera" }, t: "La mamma, con lo striscione" },
      { chi: "zia", faccia: "sorpreso", t: "La zia: chiede sempre chi vince" },
      { chi: "vicino", faccia: "arrabbiato", t: "Il vicino, per lamentarsi dei fari" },
      { chi: "influencer", faccia: "innamorato", piu: { mano: "telefono" }, t: "Fa le storie, non guarda il gioco" }
    ] },
    { id: "cal-i08", q: "{P} porta un amico nuovo giurando che è «fortissimo». Chi entra in campo?", carte: [
      { chi: "vichingo", faccia: "arrabbiato", t: "Scivola su tutti, anche sui suoi" },
      { chi: "ballerino", faccia: "felice", t: "Fa le piroette ma non tira mai" },
      { chi: "prof", faccia: "pensieroso", piu: { occhiali: "tondi" }, t: "Spiega la fisica di ogni tiro" },
      { chi: "supereroe", faccia: "esulta", t: "Esulta pure sugli autogol" }
    ] },
    { id: "cal-i09", q: "Chi gestisce il centro sportivo dove {P} gioca il giovedì?", carte: [
      { chi: "capo", faccia: "indifferente", piu: { mano: "tazza" }, t: "Spegne i fari alle 22:59 in punto" },
      { chi: "bidello", faccia: "sonno", t: "Ha perso le chiavi delle docce" },
      { chi: "nonna", faccia: "arrabbiato", t: "Vieta i tacchetti: «Il mio prato!»" },
      { chi: "cuoco", faccia: "felice", t: "Regala crostatine a chi vince" }
    ] },
    { id: "cal-i10", q: "Giovedì, ore 20:55. Che scusa scrive {P} nel gruppo per dare buca?", carte: [
      { e: "🐶🎂", t: "È il compleanno del cane" },
      { e: "🧦❓", t: "Non trova il calzettone sinistro" },
      { e: "👀💬", t: "Nessuna: visualizza e sparisce" },
      { e: "👵🍝", t: "Cena dalla nonna, non si discute" }
    ] },
    { id: "cal-i11", q: "Cosa c'è nel borsone del calcetto di {P}, oltre alle scarpe?", carte: [
      { e: "🥪🥪🥪", t: "Tre panini, per sicurezza" },
      { e: "🧴🪞", t: "Gel, specchio e spazzola: poi esce" },
      { e: "🧦🧦", t: "Calzini di tre partite fa" },
      { e: "🧊🩹", t: "Ghiaccio e cerotti, per prudenza" }
    ] },
    { id: "cal-i12", q: "Le squadre si fanno a pari e dispari. In che ruolo finisce {P}?", carte: [
      { e: "🧤🥅", t: "In porta, ma esce a dribblare" },
      { e: "⚽🏃", t: "Attacco: non torna mai indietro" },
      { e: "🧱🛡️", t: "Difesa: ferma tutti, anche i suoi" },
      { e: "📣🪑", t: "In panchina, fa il telecronista" }
    ] },
    { id: "cal-i13", q: "Fallo al limite dell'area, tutti urlano. Cosa fa {P}?", carte: [
      { e: "🌀😩", t: "Si butta e rotola tre volte" },
      { e: "📜⚖️", t: "Cita il regolamento a memoria" },
      { e: "🤝😇", t: "Dà ragione all'avversario" },
      { e: "📱🎬", t: "Chiede il VAR sul telefono di uno" }
    ] },
    { id: "cal-i14", q: "Al terzo tempo in pizzeria, cosa ordina {P} dopo la partita?", carte: [
      { e: "🍕🍕", t: "Due pizze: «Ho corso tanto»" },
      { e: "🥗🍟", t: "L'insalata, e ruba le patatine" },
      { e: "🍟🧀", t: "Il fritto misto «da dividere»" },
      { e: "☕📋", t: "Solo il caffè, e rivede i gol" }
    ] },
    { id: "cal-i15", q: "Gol all'incrocio dei pali di {P}, il primo dell'anno. Come esulta?", carte: [
      { e: "🧎💨", t: "In ginocchio fino alla bandierina" },
      { e: "👕🙈", t: "Maglia in testa: sbatte sul palo" },
      { e: "📞👵", t: "Telefona alla nonna dal campo" },
      { e: "😐🤷", t: "Niente: «Era facile»" }
    ] },
    { id: "cal-i16", q: "Cosa ha {P} ai piedi, il giovedì sera sul sintetico?", carte: [
      { e: "👟✨", t: "Scarpe nuove, fluo, comprate ieri" },
      { e: "👟🩹", t: "Scarpe del liceo, col nastro" },
      { e: "🩴😅", t: "Infradito: scarpe dimenticate" },
      { e: "🧦📏", t: "Calzettoni sopra le ginocchia" }
    ] },
    { id: "cal-i17", q: "Stavolta il pallone lo porta {P}. Che pallone arriva al campo?", carte: [
      { e: "⚽🎈", t: "Sgonfio: rimbalza come un cuscino" },
      { e: "🏐❓", t: "Uno da pallavolo: «Tanto è tondo»" },
      { e: "⚽✍️", t: "Autografato: vietato calciarlo" },
      { e: "🛍️⚽", t: "Nuovo, ancora con l'etichetta" }
    ] },
    { id: "cal-i18", q: "Finisce 12 a 11, ma nessuno è sicuro del risultato. Cosa fa {P}?", carte: [
      { e: "📝🔢", t: "Aveva segnato tutto sul telefono" },
      { e: "😤🗣️", t: "Giura che hanno vinto loro" },
      { e: "🤝🍕", t: "«Pari, e andiamo a mangiare»" },
      { e: "🔁⚽", t: "Propone la bella, sono le 23" }
    ] },
    { id: "cal-i19", q: "Fine partita: nello spogliatoio c'è una doccia sola. Cosa fa {P}?", carte: [
      { e: "🚿🎤", t: "Ci canta dentro per mezz'ora" },
      { e: "🏃💨", t: "Va via sudato, si lava a casa" },
      { e: "🧴🧴🧴", t: "Usa lo shampoo di tutti" },
      { e: "🧊😱", t: "Acqua gelata: urla da fuori campo" }
    ] },
    { id: "cal-i20", q: "Mercoledì sera, nel gruppo WhatsApp del calcetto. Cosa manda {P}?", carte: [
      { e: "📋⚽", t: "Le formazioni, già decise" },
      { e: "🎤🕐", t: "Un vocale di 6 minuti sul campo" },
      { e: "😂🖼️", t: "Il meme della partita scorsa" },
      { e: "👍", t: "Solo un pollice, come sempre" }
    ] },
    { id: "cal-i21", q: "Che faccia fa {P} quando scopre di essere in squadra col cugino che non passa mai la palla?", carte: [
      { lui: "disgusto", t: "Chiede il cambio dopo 2 minuti" },
      { lui: "finto", t: "«Bene! Giochiamo di squadra!»" },
      { lui: "furbo", t: "Farà lo stesso, ma meglio" },
      { lui: "sonno", t: "Si mette in porta e riposa" }
    ] },
    { id: "cal-i22", q: "Che faccia fa {P} quando l'arbitro fischia rigore contro all'ultimo minuto?", carte: [
      { lui: "terrore", t: "Non guarda: chiede com'è finita" },
      { lui: "arrabbiato", t: "Protesta fino alla pizzeria" },
      { lui: "indifferente", t: "Pensa già alla pizza" },
      { lui: "pensieroso", t: "Studia dove tirerà il bomber" }
    ] },
    { id: "cal-i23", q: "Che faccia fa {P} quando, dopo dieci minuti, qualcuno dice «In porta a turno: comincia tu»?", carte: [
      { lui: "triste", t: "Ci va, come ogni giovedì da 4 anni" },
      { lui: "esulta", t: "Era il suo sogno: para tutto" },
      { lui: "furbo", t: "Accetta, poi esce palla al piede" },
      { lui: "sorpreso", t: "Non sapeva ci fosse la porta" }
    ] },
    { id: "cal-i24", q: "Che faccia fa {P} quando al campo arrivano in quattro, e gli altri sei «stanno arrivando»?", carte: [
      { lui: "arrabbiato", t: "Scrive nel gruppo, in maiuscolo" },
      { lui: "felice", t: "Due contro due: meglio ancora" },
      { lui: "sonno", t: "Si stende sulla panchina e aspetta" },
      { lui: "pensieroso", t: "Organizza il torneo dei rigori" }
    ] },
    { id: "cal-i25", q: "Che faccia fa {P} quando si rivede nel video mentre sbaglia il gol a porta vuota?", carte: [
      { lui: "imbarazzo", t: "«Era fuorigioco», a porta vuota" },
      { lui: "linguaccia", t: "Lo mette come foto profilo" },
      { lui: "triste", t: "Lo riguarda 40 volte di notte" },
      { lui: "esulta", t: "«Però che dribbling, prima!»" }
    ] }
  ],
  scrivi: [
    { id: "cal-s01", q: "{P} crea il gruppo WhatsApp del calcetto. Che nome gli dà?",
      riserve: ["Ginocchia di Cristallo FC", "Real Fiatone","Atletico Divano"] },
    { id: "cal-s02", q: "{P} sta in porta e prende 15 gol. Cosa scrive nel gruppo a fine partita?",
      riserve: ["Rete rotta: metà erano fuori", "Li ho fatti segnare per amicizia", "Mi ha accecato il faro numero 3"] },
    { id: "cal-s03", q: "L'arbitro espelle {P}. Cosa gli urla mentre esce dal campo?",
      riserve: ["Ci vediamo giovedì, e porto l'avvocato", "Mia nonna fischiava meglio", "Il pallone è mio: me lo riprendo!"] },
    { id: "cal-s04", q: "Nel gruppo del calcetto, da anni, {P} ha un soprannome: «___»",
      riserve: ["Il Muro di Gomma", "Panchina d'Oro", "Quello del rigore del 2019"], voto: "lui" },
    { id: "cal-s05", q: "{P} è in panchina e fa la telecronaca della partita. Cosa urla?",
      riserve: ["Tiro! Palla finita sulla tangenziale", "Clamoroso: qualcuno ha passato la palla!", "Il portiere ha fame, si vede da qui"] },
    { id: "cal-s06", q: "Sulla schiena della maglia di {P}, al posto del nome, c'è scritto: «___»",
      riserve: ["Torno subito", "Non passatemela", "Ex Primavera (forse)"] },
    { id: "cal-s07", q: "Al terzo tempo {P} alza il bicchiere d'acqua e brinda: «A ___»",
      riserve: ["chi stasera non ha dato buca", "quel palo che mi ha salvato", "giovedì prossimo, e alle mie ginocchia"] },
    { id: "cal-s08", q: "Fischio finale. {P}, che ha toccato due palloni in un'ora, commenta: «___»",
      riserve: ["Ho corso tanto, ma senza palla", "Il mio era un lavoro tattico", "Quei due palloni li ho toccati bene"] },
    { id: "cal-s09", q: "A fine stagione {P} fa le premiazioni del gruppo. Che premio inventa?",
      riserve: ["Miglior tuffo senza contatto", "Scarpa d'oro a chi arriva puntuale", "Pallone sgonfio alla carriera"] },
    { id: "cal-s10", q: "Un avversario fa tunnel a {P}. Sul suo borsone, {P} lascia un biglietto: «___»",
      riserve: ["Ti ho perdonato. Forse.", "Giovedì prossimo, tu e io", "Era voluto: ti stavo studiando"] },
    { id: "cal-s11", q: "Il campo è allagato. Che proposta fa {P} per giocare lo stesso?",
      riserve: ["Pallanuoto, porte piccole", "Io porto il canotto, voi i remi", "Calcetto con le pinne, chi ci sta?"] },
    { id: "cal-s12", q: "Il gruppo dà i voti della partita: {P} prende 4. Motivazione: «___»",
      riserve: ["Ha passato la palla solo all'arbitro", "Ottima partita… per l'altra squadra", "Presente col corpo, la testa in pizzeria"] },
    { id: "cal-s13", q: "{P} spiega alla squadra la tattica segreta per stasera. Qual è?",
      riserve: ["Tutti in porta, così non segnano", "Palla a me e pregate", "Facciamoli ridere finché sbagliano"] },
    { id: "cal-s14", q: "Dopo 20 anni di calcetto, il gruppo regala a {P} una targa. Cosa c'è scritto?",
      riserve: ["Mai una buca. Quasi.", "Ha portato il pallone. Una volta.", "Al miglior terzo tempo d'Italia"] },
    { id: "cal-s15", q: "{P} prende una storta alla caviglia (piccola piccola). Cosa scrive nel gruppo?",
      riserve: ["Ragazzi, addio. È stato bello.", "Giovedì ci sono: in porta con la sedia", "Mi serve un sostituto e un cuscino"] },
    { id: "cal-s16", q: "L'avversario dice che {P} fa troppi falli. {P} risponde: «___»",
      riserve: ["Sono carezze col tacchetto", "Io gioco col cuore, e coi gomiti", "Chiedi all'arbitro. Ah, non c'è"] },
    { id: "cal-s17", q: "{P} entra nel calcetto come «nuovo acquisto». Come si presenta al gruppo?",
      riserve: ["Ciao, gioco solo se vinciamo", "Ruolo: mezzala. Cos'è una mezzala?", "Ho fatto due anni di FIFA, livello pro"], voto: "lui" },
    { id: "cal-s18", q: "Prima della partita, {P} fa partire dalla cassa la sua canzone. Come si intitola?",
      riserve: ["Il bomber del giovedì (remix)", "Notti magiche al campo 3", "Passala, passala, passala"] }
  ],
  disegna: [
    { id: "cal-d01", q: "Disegna su {P} la maglia da calcetto dei suoi sogni", su: "ritratto", adesivi: "🦄⭐🔥👑🌈" },
    { id: "cal-d02", q: "Disegna il campo di calcetto se lo progettasse {P}", su: "scena", adesivi: "🛋️🎢🚽🍦🐊" },
    { id: "cal-d03", q: "Disegna su {P} le protezioni complete per non farsi più male", su: "ritratto", adesivi: "⛑️🧽🛡️🧸" },
    { id: "cal-d04", q: "Disegna su {P} la capigliatura da campione per la finale del torneo", su: "ritratto", adesivi: "⚡✨🌟💈" },
    { id: "cal-d05", q: "Disegna la panchina della squadra di {P}: chi c'è seduto?", su: "scena", adesivi: "🐶👵🧸🦆🐢" },
    { id: "cal-d06", q: "Disegna il pallone magico che {P} vorrebbe per non sbagliare mai", su: "bianco", adesivi: "✨🧲🌈🎯🪄" },
    { id: "cal-d07", q: "Disegna su {P} il look da capitano, con la fascia e tutto", su: "ritratto", adesivi: "🎖️👑💪🦁" },
    { id: "cal-d08", q: "Disegna la porta difesa da {P}: cosa ci ha messo davanti?", su: "scena", adesivi: "🧱🛋️🐊🚧📦" },
    { id: "cal-d09", q: "Disegna lo spogliatoio dopo che ci è passato {P}", su: "scena", adesivi: "🧦🧴👟🧻💨" },
    { id: "cal-d10", q: "Disegna su {P} la faccia da battaglia prima del derby del giovedì", su: "ritratto", adesivi: "⚡🔥😤🎨" },
    { id: "cal-d11", q: "Disegna {P} in campo un giovedì di gennaio, sotto la neve", su: "scena", adesivi: "❄️🌨️🧣⛄🧤" },
    { id: "cal-d12", q: "Disegna su {P} il trucco per distrarre chi tira il rigore", su: "ritratto", adesivi: "🤡👀🌈🦄🎈" },
    { id: "cal-d13", q: "Disegna la foto di squadra a fine torneo, con {P} al centro", su: "scena", adesivi: "📸🥇😄🎉" }
  ],
  chi: [
    { id: "cal-c01", q: "Chi di noi passerebbe tutta la partita a chiedere «quanto stiamo?» senza mai saperlo?", titolo: "Il tabellone smarrito" },
    { id: "cal-c02", q: "Chi di noi, dopo un contrasto leggerissimo, resterebbe a terra aspettando una barella che non esiste?", titolo: "Oscar del tuffo" },
    { id: "cal-c03", q: "Chi di noi terrebbe le statistiche di ogni giocatore del calcetto su un foglio Excel, coi grafici?", titolo: "Ct del foglio Excel" },
    { id: "cal-c04", q: "Chi di noi arriverebbe al campo un'ora prima a fare riscaldamento, mentre gli altri sono ancora a cena?", titolo: "Riscaldamento eterno" },
    { id: "cal-c05", q: "Chi di noi porterebbe la borraccia col nome scritto sopra e la difenderebbe da tutti come un trofeo?", titolo: "Guardia della borraccia" },
    { id: "cal-c06", q: "Chi di noi, a fine partita, raccoglierebbe tutti i fratini sudati e li porterebbe a lavare a casa sua?", titolo: "Lavanderia del cuore" },
    { id: "cal-c07", q: "Chi di noi si offrirebbe di stare in porta ogni giovedì, solo per non dover correre?", titolo: "Portiere per pigrizia" },
    { id: "cal-c08", q: "Chi di noi, al terzo tempo, rifarebbe ogni azione della partita con le saliere e le bottiglie?", titolo: "Moviola con le saliere" },
    { id: "cal-c09", q: "Chi di noi riuscirebbe a protestare per un fallo anche in una partita senza arbitro?", titolo: "Ricorso al vento" },
    { id: "cal-c10", q: "Chi di noi arriverebbe con la maglia del suo campione, nome e numero, e poi sbaglierebbe ogni passaggio?", titolo: "Fuoriclasse solo di maglia" },
    { id: "cal-c11", q: "Chi di noi presterebbe le sue scarpe di ricambio all'avversario rimasto in ciabatte?", titolo: "Scarpe del buon cuore" },
    { id: "cal-c12", q: "Chi di noi tirerebbe così forte da mandare il pallone nel campo da tennis accanto, per la terza volta?", titolo: "Cannone fuori mira" },
    { id: "cal-c13", q: "Chi di noi prenoterebbe il campo per il giorno sbagliato e farebbe trovare tutti davanti al cancello chiuso?", titolo: "Regista del disastro" },
    { id: "cal-c14", q: "Chi di noi, a 45 anni, continuerebbe a giocare giurando «ancora una stagione e poi smetto»?", titolo: "L'ultima stagione (bis)" }
  ]
});

/* ---------------------------------------------------------
   🪩 IL SABATO SERA
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "sabato", cod: "sab", nome: "Il sabato sera", emoji: "🪩",
  adesivi: "🪩🕺💃🎧🕶️💄👟🧥🍕🚕📱✨",
  entrata: [
    "Sabato, ore 23. Da tre ore si decide dove andare: ora tocca a {P}.",
    "Fila all'ingresso, cassa che pompa: {P} è pront{o|a} da martedì.",
    "Pizzeria aperta fino alle 4 e pista piena: stasera la serata è di {P}."
  ],
  immagini: [
    { id: "sab-i01", q: "Chi è il buttafuori che decide se {P} entra o no?", carte: [
      { chi: "buttafuori", faccia: "indifferente", t: "Muto. Vuole la parola d'ordine" },
      { chi: "nonna", faccia: "furbo", piu: { occhiali: "sole" }, t: "Fa entrare solo chi saluta bene" },
      { chi: "prof", faccia: "pensieroso", piu: { occhiali: "tondi" }, t: "Fa una domanda di storia" },
      { chi: "buttafuori", f: "d", faccia: "felice", t: "Ride di tutto, poi dice no" }
    ] },
    { id: "sab-i02", q: "Chi è il DJ del locale dove finisce {P} stasera?", carte: [
      { chi: "dj", faccia: "estasi", t: "Mette solo sigle dei cartoni" },
      { chi: "nonno", faccia: "felice", piu: { cappello: "cuffie" }, t: "Solo liscio, ma lo mixa" },
      { chi: "dj", f: "d", faccia: "sonno", t: "Stessa canzone da 40 minuti" },
      { chi: "cugino", faccia: "furbo", t: "Il cugino: ignora ogni richiesta" }
    ] },
    { id: "sab-i03", q: "All'ingresso del locale, chi entra insieme a {P} e si prende tutta la scena?", carte: [
      { chi: "re", faccia: "furbo", t: "Con la corona: inchini per lui" },
      { chi: "calciatore", faccia: "esulta", t: "Un calciatore: tutti a fare foto" },
      { chi: "nonna", faccia: "estasi", piu: { occhiali: "stelle" }, t: "Una nonna che va dritta in pista" },
      { chi: "cowboy", faccia: "felice", t: "Un cowboy: «Si balla il country?»" }
    ] },
    { id: "sab-i04", q: "In fila per entrare, chi si ritrova davanti {P}?", carte: [
      { chi: "prof", f: "d", faccia: "sorpreso", t: "La prof di mate delle medie" },
      { chi: "mamma", faccia: "estasi", piu: { occhiali: "stelle" }, t: "La mamma: stasera esce anche lei" },
      { chi: "capo", faccia: "imbarazzo", t: "Il capo, vestito da anni '80" },
      { chi: "vicino", faccia: "arrabbiato", t: "Il vicino che odia il rumore" }
    ] },
    { id: "sab-i05", q: "Alle 3 c'è una sola pizzeria aperta, ed entra {P}. Chi la manda avanti?", carte: [
      { chi: "cameriere", faccia: "sonno", t: "Dorme in piedi, porta pizze a caso" },
      { chi: "cuoco", faccia: "estasi", t: "Il pizzaiolo che canta l'opera" },
      { chi: "nonna", faccia: "arrabbiato", t: "Nonna: «Questa è l'ora di dormire»" },
      { chi: "mago", faccia: "furbo", piu: { cappello: "mago" }, t: "Fa sparire metà della pizza" }
    ] },
    { id: "sab-i06", q: "In pista, chi si mette a ballare proprio accanto a {P}?", carte: [
      { chi: "ballerino", faccia: "estasi", t: "Fa la spaccata ogni due minuti" },
      { chi: "zio", faccia: "esulta", piu: { cappello: "borsalino" }, t: "Lo zio, che fa solo il twist" },
      { chi: "turista", faccia: "felice", t: "Turista: chiede lezioni di ballo" },
      { chi: "supereroe", faccia: "furbo", t: "Vestito da supereroe, senza motivo" }
    ] },
    { id: "sab-i07", q: "Chi fa da «mamma» al gruppo di {P} per tutta la serata?", carte: [
      { chi: "mamma", faccia: "arrabbiato", t: "Conta tutti ogni dieci minuti" },
      { chi: "infermiere", faccia: "pensieroso", t: "Ha cerotti, acqua e caramelle" },
      { chi: "vigile", faccia: "furbo", piu: { collo: "fischietto" }, t: "Fischia quando uno si perde" },
      { chi: "nonna", faccia: "sonno", t: "A mezzanotte vuole già andare" }
    ] },
    { id: "sab-i08", q: "Fine serata, {P} va a riprendere la giacca. Chi c'è al guardaroba?", carte: [
      { chi: "elegante", faccia: "finto", t: "Ridà la giacca di un altro" },
      { chi: "bidello", faccia: "sonno", t: "Dorme sui cappotti di tutti" },
      { chi: "mago", faccia: "furbo", piu: { cappello: "mago" }, t: "«La giacca? Quale giacca?»" },
      { chi: "nonna", faccia: "felice", t: "Ha stirato pure la giacca" }
    ] },
    { id: "sab-i09", q: "Rientrando alle 4 in punta di piedi, chi aspetta {P} in cucina?", carte: [
      { chi: "mamma", faccia: "arrabbiato", piu: { mano: "tazza" }, t: "La mamma, con l'orologio in mano" },
      { chi: "papa", faccia: "sonno", t: "Papà, addormentato sulla sedia" },
      { chi: "nonna", faccia: "felice", t: "La nonna: «Ti faccio due uova?»" },
      { chi: "cugino", faccia: "furbo", t: "Fratello: «Taccio per una pizza»" }
    ] },
    { id: "sab-i10", q: "Sabato, ore 22: il gruppo non sa dove andare. Cosa propone {P}?", carte: [
      { e: "🎳🌭", t: "Bowling, come nel 2015" },
      { e: "🛋️🍿", t: "Tutti a casa sua, film e divano" },
      { e: "🪩🚗", t: "Una discoteca a due ore di strada" },
      { e: "🤷⏳", t: "Niente: «Per me è uguale»" }
    ] },
    { id: "sab-i11", q: "Davanti allo specchio, ore 21. Quanto ci mette {P} a prepararsi?", carte: [
      { e: "⏱️🚀", t: "4 minuti, compresa la doccia" },
      { e: "👔👕👗", t: "Due ore: cambia vestito sei volte" },
      { e: "📞👀", t: "Videochiama tutti per un parere" },
      { e: "🧥🔁", t: "Esce con quello che aveva ieri" }
    ] },
    { id: "sab-i12", q: "Appena entrati nel locale, cosa fa {P} per prima cosa?", carte: [
      { e: "🕺💨", t: "Dritto in pista, con la giacca" },
      { e: "🔋🔌", t: "Cerca una presa per il telefono" },
      { e: "🚻⏳", t: "La fila del bagno: 40 minuti" },
      { e: "🛋️😌", t: "Trova un divanetto e non si muove" }
    ] },
    { id: "sab-i13", q: "Il buttafuori guarda {P} e dice: «Con quelle scarpe no». Cosa fa {P}?", carte: [
      { e: "👟🔄", t: "Scambia le scarpe con un amico" },
      { e: "🗣️📜", t: "Discute per 20 minuti di moda" },
      { e: "🍕🏃", t: "Va in pizzeria, felice" },
      { e: "🏠👞", t: "Torna a casa a cambiarsi: un'ora" }
    ] },
    { id: "sab-i14", q: "Parte il tormentone dell'estate. Cosa fa {P} in pista?", carte: [
      { e: "🕺🔥", t: "Sa tutta la coreografia" },
      { e: "🙈📱", t: "Si nasconde dietro il telefono" },
      { e: "🎤😱", t: "Canta, ma le parole sono inventate" },
      { e: "🪑😒", t: "Rimane al tavolo: «Che lagna»" }
    ] },
    { id: "sab-i15", q: "Pizzeria alle 3: il gruppo è troppo stanco per decidere. Cosa fa {P}?", carte: [
      { e: "🍕✋", t: "Ordina per tutti, senza chiedere" },
      { e: "📋🗣️", t: "Legge il menù ad alta voce, tutto" },
      { e: "😴🍕", t: "Si addormenta col trancio in mano" },
      { e: "☝️🍕", t: "Fa la conta, come all'asilo" }
    ] },
    { id: "sab-i16", q: "Al ritorno guida {P}. Com'è il viaggio verso casa?", carte: [
      { e: "🎶🔊", t: "Karaoke a tutto volume" },
      { e: "🐢🛣️", t: "A 40 all'ora, «per prudenza»" },
      { e: "📍🌀", t: "Sbaglia strada tre volte" },
      { e: "🚕🗺️", t: "Accompagna tutti: arriva alle 6" }
    ] },
    { id: "sab-i17", q: "Domenica mattina, cosa si trova nel telefono di {P}?", carte: [
      { e: "🤳🤳🤳", t: "312 selfie, tutti uguali" },
      { e: "🎥🪩", t: "Un video di 10 minuti: solo luci" },
      { e: "📞👵", t: "Una chiamata di un'ora alla nonna" },
      { e: "🗒️✍️", t: "Nota: «Bella serata, rifarla»" }
    ] },
    { id: "sab-i18", q: "Si torna a casa. Cosa ha perso {P} durante la serata?", carte: [
      { e: "🔑❓", t: "Le chiavi di casa (erano in tasca)" },
      { e: "🧥👻", t: "La giacca, ritrovata a dicembre" },
      { e: "🧣❓", t: "La sciarpa, per la terza volta" },
      { e: "👟❓", t: "Una scarpa. Come, non si sa" }
    ] },
    { id: "sab-i19", q: "Il fotografo del locale sta per scattare. Che posa fa {P}?", carte: [
      { e: "✌️😎", t: "Il segno di pace, sempre lo stesso" },
      { e: "😗📸", t: "La boccuccia da influencer" },
      { e: "🙈✋", t: "Mano davanti: «Niente foto!»" },
      { e: "🤸✨", t: "Salta, e cade addosso al fotografo" }
    ] },
    { id: "sab-i20", q: "Sono le 6 del mattino. Dove si trova {P}?", carte: [
      { e: "🌅🏖️", t: "Al mare, a vedere l'alba" },
      { e: "🛏️😴", t: "A letto dall'1 e mezza: che pace" },
      { e: "🚌❓", t: "Sul primo bus, capolinea sbagliato" },
      { e: "🪩🧹", t: "Ancora in pista: aiuta a pulire" }
    ] },
    { id: "sab-i21", q: "Che faccia fa {P} quando, in pista, si prende il quinto pestone dallo stesso ballerino?", carte: [
      { lui: "arrabbiato", t: "Restituisce il pestone, a tempo" },
      { lui: "finto", t: "«Nessun problema!» (è la sesta)" },
      { lui: "terrore", t: "Balla ormai in punta di piedi" },
      { lui: "esulta", t: "Lo trasforma in un passo di ballo" }
    ] },
    { id: "sab-i22", q: "Che faccia fa {P} quando il DJ mette la sua canzone preferita… in un remix di 12 minuti?", carte: [
      { lui: "estasi", t: "Balla tutti i 12 minuti" },
      { lui: "disgusto", t: "Va a chiedere l'originale al DJ" },
      { lui: "sonno", t: "Al minuto 8 si siede" },
      { lui: "sorpreso", t: "Non la riconosce, balla lo stesso" }
    ] },
    { id: "sab-i23", q: "Che faccia fa {P} quando la mattina dopo vede le foto della serata pubblicate dagli amici?", carte: [
      { lui: "imbarazzo", t: "Occhi chiusi in tutte e 40" },
      { lui: "esulta", t: "Le ripubblica tutte, coi cuori" },
      { lui: "arrabbiato", t: "Chiede di toglierle, una per una" },
      { lui: "innamorato", t: "Si piace troppo: foto profilo" }
    ] },
    { id: "sab-i24", q: "Che faccia fa {P} quando, all'una di notte, gli amici dicono «Dai, ora andiamo a ballare»?", carte: [
      { lui: "sonno", t: "Era già in pigiama, con la testa" },
      { lui: "esulta", t: "Finalmente: aspettava dalle 20" },
      { lui: "finto", t: "«Certo!» E chiama un taxi per casa" },
      { lui: "pensieroso", t: "Calcola le ore di sonno rimaste" }
    ] },
    { id: "sab-i25", q: "Che faccia fa {P} quando arrivano al locale scelto per la serata e trovano la serranda abbassata?", carte: [
      { lui: "imbarazzo", t: "«Su internet era aperto…»" },
      { lui: "furbo", t: "Ha già un piano B, e un piano C" },
      { lui: "linguaccia", t: "«Pizza e passeggiata, dai!»" },
      { lui: "triste", t: "Si siede sul marciapiede in giacca" }
    ] }
  ],
  scrivi: [
    { id: "sab-s01", q: "Il buttafuori chiede: «Siete in lista?». {P} risponde: «___»",
      riserve: ["Certo, sotto la lettera P", "Nella lista della spesa, sì", "Mio cugino è il DJ… forse"] },
    { id: "sab-s02", q: "Alle 4, nello specchio del bagno del locale, {P} si guarda e si dice: «___»",
      riserve: ["Sei una leggenda. Ora a letto", "Domani non esco. Lo giuro, come sempre", "Chi ti ha pettinato? Ah, il vento"] },
    { id: "sab-s03", q: "Il biglietto che {P} lascia sul frigo prima di uscire dice: «___»",
      riserve: ["Torno presto. Presto tipo domani", "Non aspettatemi, ma lasciate la luce", "Se chiama qualcuno, sto studiando"] },
    { id: "sab-s04", q: "{P} chiede una canzone al DJ. Cosa scrive sul bigliettino?",
      riserve: ["Quella che fa tu-tu-tu, quella lì", "Una lenta, mi devo riposare", "La sigla dei Puffi, per favore"] },
    { id: "sab-s05", q: "Il DJ chiede al microfono: «Chi festeggia stasera?». {P} alza la mano e urla: «___»",
      riserve: ["Io! Il mio onomastico, credo", "Festeggio che ho trovato parcheggio", "Mio cugino, che non è venuto"] },
    { id: "sab-s06", q: "Se {P} aprisse una discoteca tutta sua, come la chiamerebbe?",
      riserve: ["Il Divanetto", "Mezzanotte e Mezza Pizza", "Da Me (Entra Chi Saluta)"], voto: "lui" },
    { id: "sab-s07", q: "In pista, {P} inventa un passo di ballo nuovo. Come si chiama?",
      riserve: ["Il Lavapiatti", "La Gallina Elettrica", "Il Cerco le Chiavi"] },
    { id: "sab-s08", q: "Al bancone {P} ordina un'aranciata come se fosse la cosa più elegante del mondo: «___»",
      riserve: ["Aranciata. Agitata, non mescolata", "Con ghiaccio, ombrellino e dignità", "La solita, quella col limone"] },
    { id: "sab-s09", q: "{P} è in fila da un'ora davanti al locale. Cosa scrive nel gruppo?",
      riserve: ["Ho fatto amicizia con tutta la fila", "Qui fuori è più bello che dentro", "Mi hanno superato due nonne"] },
    { id: "sab-s10", q: "Il locale regala a {P} la tessera VIP. Cosa c'è scritto sotto il nome?",
      riserve: ["Vietato fare il trenino", "Ingresso libero, uscita a fatica", "Membro onorario del divanetto"] },
    { id: "sab-s11", q: "Musica altissima: {P} urla una cosa all'orecchio di un amico. L'amico capisce: «___»",
      riserve: ["Hai un gatto in tasca?", "Tuo zio fa il pilota?", "Domani andiamo a fare la spesa?"] },
    { id: "sab-s12", q: "All'uscita, {P} prova a convincere il tassista a caricare sei persone: «___»",
      riserve: ["Le offro la pizza delle 3", "Due di noi sono piccoli, giuro", "Facciamo due viaggi: il secondo gratis"] },
    { id: "sab-s13", q: "Domenica, ore 14. {P} si sveglia e scrive nel gruppo. Cosa?",
      riserve: ["Qualcuno ha visto la mia voce?", "Rifacciamo stasera?", "Perché ho in tasca un menù?"] },
    { id: "sab-s14", q: "{P} non balla mai. Qual è la sua scusa di stasera?",
      riserve: ["Sto conservando l'energia per la pizza", "Io ballo dentro, non si vede", "Ho le scarpe nuove, si rovinano"], voto: "lui" },
    { id: "sab-s15", q: "{P} organizza la serata. Il messaggio d'invito dice: «___»",
      riserve: ["Dress code: comodo, si cammina tanto", "Ritrovo alle 22, partenza alle 23:40", "Chi dice «vediamo» resta a casa"] },
    { id: "sab-s16", q: "Per farsi trovare in pista, {P} alza un cartello. Cosa c'è scritto?",
      riserve: ["Sì, sono io che ballo così", "Taxi alle 3: chi c'è firmi qui","Seguite il profumo di pizza"] },
    { id: "sab-s17", q: "{P} entra in pista e annuncia al gruppo: «Ragazzi, ___»",
      riserve: ["state indietro, mi serve spazio", "fate cerchio, sto per fare la mossa", "qualcuno mi tiene la giacca?"] },
    { id: "sab-s18", q: "La mattina dopo, {P} trova in tasca un biglietto scritto da sé alle 3: «___»",
      riserve: ["Ricordati: mai più il tormentone", "Hai promesso al DJ di tornare", "La giacca non è tua. Restituiscila"] }
  ],
  disegna: [
    { id: "sab-d01", q: "Disegna su {P} il look per uscire il sabato sera", su: "ritratto", adesivi: "🎩👑💎🌟🧣" },
    { id: "sab-d02", q: "Disegna la discoteca dei sogni di {P}", su: "scena", adesivi: "🎢🛋️🐬🍦🎠" },
    { id: "sab-d03", q: "Disegna cosa si porta {P} in tasca e in borsa per il sabato sera", su: "bianco", adesivi: "🔋🍬🧴🩹🔑🍫" },
    { id: "sab-d04", q: "Disegna su {P} quello che resta del look alle 4 di notte", su: "ritratto", adesivi: "🧦🌀💤🍕🩹" },
    { id: "sab-d05", q: "Disegna la pizza «{P}» del menù notturno, coi suoi ingredienti", su: "bianco", adesivi: "🍍🍫🌭🥚🍓🍟" },
    { id: "sab-d06", q: "Disegna il divanetto conquistato da {P} e arredato per tutta la sera", su: "scena", adesivi: "🛋️🍕🧸🔌🪴" },
    { id: "sab-d07", q: "Disegna su {P} il look da buttafuori, ora che decide chi entra", su: "ritratto", adesivi: "🕶️📋🎧🦺" },
    { id: "sab-d08", q: "Disegna su {P} i timbri e i braccialetti di tutti i locali della serata", su: "ritratto", adesivi: "🎟️⭐🌙🔖💜" },
    { id: "sab-d09", q: "Disegna il tappeto rosso che {P} si merita all'ingresso", su: "scena", adesivi: "🌹📸👑🎺🎈" },
    { id: "sab-d10", q: "Disegna su {P} la giacca perfetta per non avere mai freddo in fila", su: "ritratto", adesivi: "🧣🧤🔥🧸☕" },
    { id: "sab-d11", q: "Disegna la console del DJ se il DJ fosse {P}", su: "scena", adesivi: "🎹🔊🦆🍕🎺" },
    { id: "sab-d12", q: "Disegna su {P} il trucco fluo per la serata a tema neon", su: "ritratto", adesivi: "⚡🌈💚💖⭐" },
    { id: "sab-d13", q: "Disegna la strada del ritorno a casa di {P} alle 4 di notte", su: "scena", adesivi: "🌙🐈🏠🦉💡" }
  ],
  chi: [
    { id: "sab-c01", q: "Chi di noi passerebbe tutto il sabato sera a dire «andiamo da un'altra parte», senza mai andarci?", titolo: "Navigatore senza meta" },
    { id: "sab-c02", q: "Chi di noi farebbe amicizia col buttafuori e uscirebbe dal locale col suo numero di telefono?", titolo: "Spalla del buttafuori" },
    { id: "sab-c03", q: "Chi di noi si scatenerebbe in mezzo alla pista alle 23:30, quando non c'è ancora nessuno?", titolo: "Apripista ufficiale" },
    { id: "sab-c04", q: "Chi di noi passerebbe mezza serata al guardaroba a chiacchierare col signore dei cappotti?", titolo: "Habitué del guardaroba" },
    { id: "sab-c05", q: "Chi di noi si farebbe una foto col DJ ogni volta, anche senza sapere come si chiama?", titolo: "Fan di DJ chiunque" },
    { id: "sab-c06", q: "Chi di noi si offrirebbe sempre per guidare e riaccompagnerebbe tutti, anche chi abita dall'altra parte?", titolo: "Taxi del cuore" },
    { id: "sab-c07", q: "Chi di noi riuscirebbe ad addormentarsi su un divanetto con la musica a tutto volume?", titolo: "Ninna nanna da cassa" },
    { id: "sab-c08", q: "Chi di noi saprebbe a memoria tutte le coreografie dei balli di gruppo, anche quelle del 2006?", titolo: "Archivio dei balli" },
    { id: "sab-c09", q: "Chi di noi arriverebbe al locale in abito da sera e scoprirebbe che era la serata in maschera?", titolo: "Elegante al carnevale" },
    { id: "sab-c10", q: "Chi di noi, alla pizzeria delle 3, finirebbe in cucina a sfornare pizze insieme al pizzaiolo?", titolo: "Laurea in pizza ad honorem" },
    { id: "sab-c11", q: "Chi di noi, rientrando alle 4 in punta di piedi, farebbe cadere l'ombrelliera svegliando tutto il palazzo?", titolo: "Ninja dell'ombrelliera" },
    { id: "sab-c12", q: "Chi di noi farebbe un'ora di fila e, a un passo dalla porta, deciderebbe di andare a mangiare?", titolo: "Ripensamento all'ingresso" },
    { id: "sab-c13", q: "Chi di noi presterebbe la giacca a chi ha freddo in fila e passerebbe la serata in maglietta?", titolo: "Giacca della bontà" },
    { id: "sab-c14", q: "Chi di noi perderebbe il gruppo dentro il locale alle 23 e lo ritroverebbe solo alla pizzeria delle 3?", titolo: "Bussola persa in pista" }
  ]
});

/* ---------------------------------------------------------
   💼 IN UFFICIO
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "ufficio", cod: "uff", nome: "In ufficio", emoji: "💼",
  adesivi: "💻🖨️📎☕🪴📁🗂️🖊️📞🍩🕰️🪑",
  entrata: [
    "Lunedì, 9:02. {P} timbra il badge e sogna già il venerdì.",
    "Riunione delle 10, spostata alle 12. {P} è in sala dalle 9.",
    "La stampante lampeggia, la macchinetta borbotta: è arrivat{o|a} {P}."
  ],
  immagini: [
    { id: "uff-i01", q: "Chi è il capo di {P}?", carte: [
      { chi: "capo", faccia: "furbo", piu: { mano: "tazza" }, t: "Riunione alle 18:55 di venerdì" },
      { chi: "capo", f: "d", faccia: "estasi", t: "Usa «sinergia» in ogni frase" },
      { chi: "nonno", faccia: "sonno", piu: { cappello: "coppola" }, t: "Il fondatore: c'è dal '68" },
      { chi: "influencer", faccia: "felice", piu: { mano: "telefono" }, t: "Fa le riunioni camminando" }
    ] },
    { id: "uff-i02", q: "Chi è il collega di scrivania di {P}?", carte: [
      { chi: "impiegato", faccia: "pensieroso", t: "Sgranocchia mele tutto il giorno" },
      { chi: "impiegato", f: "d", faccia: "estasi", piu: { mano: "telefono" }, t: "Ferie in foto: 600, una per una" },
      { chi: "cantante", faccia: "esulta", t: "Canticchia in cuffia, ad alta voce" },
      { chi: "vicino", faccia: "indifferente", piu: { animale: "gatto" }, t: "Porta il gatto «solo per oggi»" }
    ] },
    { id: "uff-i03", q: "Alla macchinetta del caffè, chi intercetta {P} ogni mattina?", carte: [
      { chi: "impiegato", faccia: "estasi", t: "Racconta tutta la partita di ieri" },
      { chi: "zia", faccia: "furbo", t: "Sa tutti i pettegolezzi del piano" },
      { chi: "bidello", faccia: "sonno", t: "Sbadiglia, e lo fai anche tu" },
      { chi: "prof", faccia: "pensieroso", piu: { occhiali: "tondi" }, t: "Spiega com'è fatto il caffè vero" }
    ] },
    { id: "uff-i04", q: "Alla cena aziendale, chi trattiene {P} a chiacchierare fino all'una?", carte: [
      { chi: "capo", faccia: "felice", t: "Il capo: parla solo di lavoro" },
      { chi: "elegante", faccia: "finto", t: "Uno mai visto: «Io? Terzo piano»" },
      { chi: "clown", faccia: "esulta", t: "Fa giochi coi tovaglioli, per ore" },
      { chi: "nonna", faccia: "felice", t: "La nonna di un collega, a sorpresa" }
    ] },
    { id: "uff-i05", q: "La stampante si inceppa col documento urgente di {P}. Chi arriva a ripararla?", carte: [
      { chi: "meccanico", faccia: "pensieroso", t: "Smonta tutto, avanza un pezzo" },
      { chi: "mago", faccia: "furbo", piu: { cappello: "mago" }, t: "Spegne e riaccende. Applausi" },
      { chi: "impiegato", faccia: "arrabbiato", t: "Le dà una botta sul fianco" },
      { chi: "nonno", faccia: "sorpreso", t: "Il pensionato: «Nel '98 andava»" }
    ] },
    { id: "uff-i06", q: "Videochiamata con tutta l'azienda: chi compare alle spalle di {P}?", carte: [
      { chi: "mamma", faccia: "felice", piu: { mano: "tazza" }, t: "La mamma: «Vuoi il caffè, amore?»" },
      { chi: "bimbo", faccia: "linguaccia", t: "Il fratellino che fa le boccacce" },
      { chi: "vicino", faccia: "sorpreso", t: "Il vicino che entra senza bussare" },
      { chi: "corriere", faccia: "felice", t: "Il corriere, già in salotto" }
    ] },
    { id: "uff-i07", q: "Il capo affida a {P} il nuovo stagista. Chi è?", carte: [
      { chi: "bimbo", faccia: "furbo", t: "Spiega Excel a tutti, pure al capo" },
      { chi: "nonno", faccia: "felice", t: "Ha 70 anni: «Ricomincio da qui»" },
      { chi: "influencer", faccia: "innamorato", piu: { mano: "telefono" }, t: "Fa le storie da ogni scrivania" },
      { chi: "vichingo", faccia: "esulta", t: "Entusiasta: urla «Sì!» a tutto" }
    ] },
    { id: "uff-i08", q: "Chi organizza il Babbo Natale segreto dell'ufficio di {P}?", carte: [
      { chi: "babbo", faccia: "esulta", t: "Vestito da Babbo da novembre" },
      { chi: "capo", faccia: "furbo", t: "Il capo: vale solo la cancelleria" },
      { chi: "impiegato", f: "d", faccia: "pensieroso", piu: { mano: "libro" }, t: "Ha scritto 4 pagine di regole" },
      { chi: "animatore", faccia: "estasi", piu: { collo: "fischietto" }, t: "Giochi di gruppo, obbligatori" }
    ] },
    { id: "uff-i09", q: "{P} deve accogliere in ufficio il cliente più importante dell'anno. Chi è?", carte: [
      { chi: "re", faccia: "indifferente", t: "Vuole il caffè, ma «non quello»" },
      { chi: "cowboy", faccia: "furbo", t: "Stivali sul tavolo delle riunioni" },
      { chi: "turista", faccia: "felice", t: "Ha sbagliato ufficio, ma resta" },
      { chi: "elegante", faccia: "sonno", t: "Dorme durante la presentazione" }
    ] },
    { id: "uff-i10", q: "{P} scalda il pranzo nel microonde dell'ufficio. Cosa c'è nella vaschetta?", carte: [
      { e: "🐟🔥", t: "Pesce: evacuato tutto il piano" },
      { e: "🍝🍝", t: "Avanzi della domenica, per 4" },
      { e: "🥗🍪", t: "Insalata… e i biscotti del collega" },
      { e: "🍲👵", t: "La parmigiana della nonna: 2 chili" }
    ] },
    { id: "uff-i11", q: "{P} preme per sbaglio «Rispondi a tutti»: la mail arriva a 400 colleghi. Cosa c'era scritto?", carte: [
      { e: "🛒📝", t: "La lista della spesa: «cipolle»" },
      { e: "😴💬", t: "«Quando finisce sta riunione?»" },
      { e: "❤️😘", t: "«Ciao amore, stasera pizza?»" },
      { e: "🐱📸", t: "Venti foto del suo gatto" }
    ] },
    { id: "uff-i12", q: "Riunione da due ore, nessuno ascolta. Cosa sta facendo {P} di nascosto?", carte: [
      { e: "📱👟", t: "Cerca scarpe online da un'ora" },
      { e: "✏️🐱", t: "Disegna gatti sul blocco note" },
      { e: "🗺️✈️", t: "Pianifica le ferie del 2031" },
      { e: "📝⭐", t: "Prende appunti. Davvero. Tutti" }
    ] },
    { id: "uff-i13", q: "Venerdì, ore 17:59. Cosa sta facendo {P}?", carte: [
      { e: "🏃💨", t: "È già in ascensore da 2 minuti" },
      { e: "💻🔥", t: "Apre ora la mail più urgente" },
      { e: "🧥⏳", t: "Giacca addosso dalle 17:30" },
      { e: "👋💬", t: "Giro di saluti: dura 40 minuti" }
    ] },
    { id: "uff-i14", q: "{P} lavora da casa. Cosa indossa durante la videochiamata?", carte: [
      { e: "👔🩳", t: "Camicia sopra, pigiama sotto" },
      { e: "🛁🧖", t: "Accappatoio e asciugamano in testa" },
      { e: "🎩👞", t: "Abito da sera, scarpe comprese" },
      { e: "📷🚫", t: "Niente: «Ho la telecamera rotta»" }
    ] },
    { id: "uff-i15", q: "{P} si prende «cinque minuti» di pausa. Dove si trova mezz'ora dopo?", carte: [
      { e: "🌳🚶", t: "Fa il giro dell'isolato, due volte" },
      { e: "🐦🌤️", t: "Sul terrazzo a guardare i piccioni" },
      { e: "🚽📱", t: "In bagno, a finire una serie" },
      { e: "🛋️😴", t: "Sul divanetto della reception" }
    ] },
    { id: "uff-i16", q: "Alla cena aziendale parte il karaoke. Cosa fa {P}?", carte: [
      { e: "🎤🔥", t: "Prende il microfono e non lo molla" },
      { e: "🙈🪴", t: "Si nasconde dietro una pianta" },
      { e: "🎶👔", t: "Duetto d'amore col capo" },
      { e: "📱🎥", t: "Filma tutti per il gruppo" }
    ] },
    { id: "uff-i17", q: "L'aria condizionata dell'ufficio è a 18 gradi, a luglio. Cosa fa {P}?", carte: [
      { e: "🧣🧤", t: "Sciarpa e guanti, a luglio" },
      { e: "🕵️🌡️", t: "Alza la temperatura di nascosto" },
      { e: "📜✍️", t: "Raccolta firme per spegnerla" },
      { e: "👕😎", t: "Sta benissimo, in maniche corte" }
    ] },
    { id: "uff-i18", q: "Il capo chiede a tutto il piano: «Chi ha preso la mia tazza?». Cosa fa {P}?", carte: [
      { e: "😇☕", t: "Ci sta bevendo, con calma" },
      { e: "🕵️🔍", t: "Interroga tutti i colleghi" },
      { e: "🎁☕", t: "Ne regala una a forma di gatto" },
      { e: "🤐👀", t: "Sa chi è stato, e non dice niente" }
    ] },
    { id: "uff-i19", q: "Il badge di {P} non funziona all'ingresso. Cosa fa?", carte: [
      { e: "🔁😤", t: "Lo ripassa 40 volte, più forte" },
      { e: "🤝🚪", t: "Entra attaccato a un collega" },
      { e: "☕🏠", t: "Torna a casa: «Lavoro da lì»" },
      { e: "🪟🧗", t: "Entra dalla finestra, piano terra" }
    ] },
    { id: "uff-i20", q: "Il capo annuncia: «Da lunedì niente posti fissi, ognuno si siede dove trova». Cosa fa {P}?", carte: [
      { e: "🌅🏃", t: "Arriva alle 7 per il posto buono" },
      { e: "🧳🪴", t: "Gira col trolley e la sua pianta" },
      { e: "📝🪑", t: "Post-it «occupato» su ogni sedia" },
      { e: "🏠💻", t: "Da quel giorno lavora da casa" }
    ] },
    { id: "uff-i21", q: "Che faccia fa {P} quando la riunione «da dieci minuti» arriva alla seconda ora?", carte: [
      { lui: "disgusto", t: "Guarda l'orologio ogni 40 secondi" },
      { lui: "finto", t: "Annuisce a tutto, sente niente" },
      { lui: "esulta", t: "Adora le riunioni: fa domande" },
      { lui: "triste", t: "Disegna un'evasione sul taccuino" }
    ] },
    { id: "uff-i22", q: "Che faccia fa {P} quando si accorge di avere il microfono acceso da tutta la riunione?", carte: [
      { lui: "terrore", t: "Ricorda: ha cantato due canzoni" },
      { lui: "imbarazzo", t: "Ha parlato col gatto per un'ora" },
      { lui: "indifferente", t: "Tanto non ha detto niente di male" },
      { lui: "furbo", t: "Era voluto: ora sanno la verità" }
    ] },
    { id: "uff-i23", q: "Che faccia fa {P} quando apre il frigo dell'ufficio e il suo yogurt non c'è più?", carte: [
      { lui: "arrabbiato", t: "Lascia un biglietto da 2 pagine" },
      { lui: "triste", t: "Lo piange in silenzio fino alle 18" },
      { lui: "furbo", t: "Mangia lo yogurt di un altro" },
      { lui: "felice", t: "Era scaduto: c'è giustizia" }
    ] },
    { id: "uff-i24", q: "Che faccia fa {P} quando arriva la mail «Venerdì cena aziendale, presenza obbligatoria»?", carte: [
      { lui: "estasi", t: "Ha già scelto il vestito" },
      { lui: "disgusto", t: "Ha un impegno improvviso: la nonna" },
      { lui: "finto", t: "«Bellissimo!» Già cerca scuse" },
      { lui: "pensieroso", t: "Studia il posto lontano dal capo" }
    ] },
    { id: "uff-i25", q: "Che faccia fa {P} quando trova il collega nuovo seduto sulla sua sedia, quella che gira bene?", carte: [
      { lui: "arrabbiato", t: "Lo fissa finché non si alza" },
      { lui: "finto", t: "«Tranquillo! Tienila pure»" },
      { lui: "triste", t: "Lavora in piedi, in silenzio" },
      { lui: "furbo", t: "Gli abbassa la sedia al minimo" }
    ] }
  ],
  scrivi: [
    { id: "uff-s01", q: "La firma automatica in fondo alle mail di {P} dice: «___»",
      riserve: ["Inviato dal mio divano", "Risposta entro 3-5 giorni lavorativi", "Saluti, abbracci e scadenze"] },
    { id: "uff-s02", q: "Lo stato di {P} nella chat dell'ufficio, tutto il pomeriggio: «___»",
      riserve: ["Torno subito (forse domani)", "In pausa caffè dal 2019", "In riunione (con la macchinetta)"] },
    { id: "uff-s03", q: "Il post-it che {P} attacca sul monitor dice: «___»",
      riserve: ["Respira. È solo lunedì.", "Non toccare, anche se sei il capo", "Non è pigrizia: è risparmio energetico"] },
    { id: "uff-s04", q: "{P} entra in ritardo alla riunione. Qual è la scusa?",
      riserve: ["L'ascensore mi ha portato al -3", "Ero qui, ma nella sala sbagliata", "Stavo finendo il caffè, era bollente"] },
    { id: "uff-s05", q: "Il capo chiede: «Cosa hai fatto questa settimana?». {P} risponde: «___»",
      riserve: ["Ho pensato molto, e bene", "Ho dato acqua alle piante del piano", "Ho aperto 4 mail e risposto a una"] },
    { id: "uff-s06", q: "Alla cena aziendale, {P} si alza per un discorso: «Cari colleghi, ___»",
      riserve: ["non so i vostri nomi, ma vi voglio bene", "stasera parliamo di tutto tranne Excel", "chi ha preso la mia penna blu?"] },
    { id: "uff-s07", q: "{P} va in ferie e lascia la risposta automatica. Cosa dice?",
      riserve: ["Sono in vacanza. Il capo lo sa. Forse.", "Torno il 3. Non scrivetemi il 2.", "Se è urgente, chiedete alla pianta"] },
    { id: "uff-s08", q: "{P} rinomina la sala riunioni. Sulla porta ora c'è scritto: «___»",
      riserve: ["Sala Pisolino", "Qui si decide di decidere", "Stanza 404: idee non trovate"] },
    { id: "uff-s09", q: "Alla macchinetta, {P} confida al collega: «Ti devo dire una cosa: ___»",
      riserve: ["la pianta del capo è finta", "sono io che rubo le penne blu", "il caffè del terzo piano è migliore"] },
    { id: "uff-s10", q: "{P} presenta un progetto al capo. Il titolo della prima pagina è: «___»",
      riserve: ["Come lavorare meno, ma di più", "Un'amaca in ogni ufficio", "Il caffè: perché ci serve gratis"] },
    { id: "uff-s11", q: "{P} lavora da casa. Cosa c'è scritto sul foglio attaccato alla porta della camera?",
      riserve: ["In riunione: entrate solo con il caffè", "Silenzio, sto facendo finta di lavorare", "Chi apre questa porta pulisce il bagno"] },
    { id: "uff-s12", q: "{P} organizza il pranzo di Natale dell'ufficio. Nell'invito, alla voce «Abbigliamento»: «___»",
      riserve: ["Maglione con le renne, obbligatorio", "Giacca sopra, pigiama sotto", "Come vi pare, tanto c'è il panettone"], voto: "lui" },
    { id: "uff-s13", q: "{P} risponde al telefono dell'ufficio con una frase inventata. Quale?",
      riserve: ["Pizzeria Bella Napoli, prego?", "Ufficio reclami, reclamate pure", "Pronto? Se è il capo, non ci sono"] },
    { id: "uff-s14", q: "Nella mail di benvenuto al collega nuovo, {P} gli dà un consiglio: «___»",
      riserve: ["Mai sederti sulla sedia blu", "La macchinetta va presa a sinistra", "Se il capo ride, ridi. Sempre."] },
    { id: "uff-s15", q: "Alla riunione il capo chiede a tutti una curiosità su di sé. Quella di {P}: «___»",
      riserve: ["Ho un'allergia alle riunioni", "So imitare il capo. Volete sentire?", "Ho chiamato la stampante Carla"] },
    { id: "uff-s16", q: "Il capo inventa il «venerdì delle idee». La prima idea di {P} è: «___»",
      riserve: ["Riunioni solo in piedi, sul tavolo", "Si lavora dal bar qui sotto", "Pranzo di due ore: si pensa meglio"], voto: "lui" },
    { id: "uff-s17", q: "{P} si appisola in riunione e si sveglia di colpo. Cosa dice?",
      riserve: ["Sono d'accordo con tutto!", "Ottima domanda, ci risponderò per mail", "Scusate, pensavo fosse sabato"] },
    { id: "uff-s18", q: "Sul calendario condiviso, {P} blocca ogni giorno dalle 14 alle 15 con la scritta: «___»",
      riserve: ["Riflessione strategica (pisolino)", "Pranzo lungo, ma strategico", "Non ci sono, ma faccio finta"] }
  ],
  disegna: [
    { id: "uff-d01", q: "Disegna la scrivania di {P} difesa dai colleghi che rubano le penne", su: "scena", adesivi: "🖊️🔒🪤📎🚧" },
    { id: "uff-d02", q: "Disegna su {P} il look del primo giorno di lavoro, per fare colpo", su: "ritratto", adesivi: "🎀🌟👑💼🌹" },
    { id: "uff-d03", q: "Disegna come {P} arreda l'ufficio quando il capo è in ferie", su: "scena", adesivi: "🏓🛋️🍦🐶🎈" },
    { id: "uff-d04", q: "Disegna su {P} il trucco per sembrare svegli{o|a} alle 8 di lunedì", su: "ritratto", adesivi: "👀⚡🕶️🌞" },
    { id: "uff-d05", q: "Disegna cosa esce dalla stampante quando {P} preme «stampa»", su: "scena", adesivi: "📄🐦🌈🍝🎉" },
    { id: "uff-d06", q: "Disegna su {P} il costume per la gara di Halloween dell'ufficio", su: "ritratto", adesivi: "🎃🦇🕸️👻" },
    { id: "uff-d07", q: "Disegna la sala riunioni dopo quattro ore di riunione con {P}", su: "scena", adesivi: "🍕😴📊🧻💤" },
    { id: "uff-d08", q: "Disegna lo sfondo finto che {P} usa nelle videochiamate da casa", su: "bianco", adesivi: "🏝️🏰🚀🐬🌋" },
    { id: "uff-d09", q: "Disegna la lavagna della riunione dopo la presentazione di {P}", su: "scena", adesivi: "📈📉🖍️🤯" },
    { id: "uff-d10", q: "Disegna la macchinetta del caffè come la vorrebbe {P}", su: "scena", adesivi: "🍫🍩🌈🎵🥐" },
    { id: "uff-d11", q: "Disegna su {P} il travestimento da capo per la recita di fine anno", su: "ritratto", adesivi: "👔☕📊🥸" },
    { id: "uff-d12", q: "Disegna la sedia girevole truccata da {P} per la gara in corridoio", su: "scena", adesivi: "🚀🔥🏁💨" },
    { id: "uff-d13", q: "Disegna su {P} tutto quello che serve per non farsi disturbare", su: "ritratto", adesivi: "🎧🚫🔇📵" }
  ],
  chi: [
    { id: "uff-c01", q: "Chi di noi risponderebbe «Ok» a una mail di quattro pagine senza averla letta?", titolo: "Ok senza leggere" },
    { id: "uff-c02", q: "Chi di noi prenoterebbe la sala riunioni per tutta la settimana «per sicurezza»?", titolo: "Sala B, proprietà privata" },
    { id: "uff-c03", q: "Chi di noi cambierebbe la suoneria del telefono dell'ufficio con la sigla di un cartone animato?", titolo: "Sigla d'ufficio" },
    { id: "uff-c04", q: "Chi di noi porterebbe le paste per tutto il piano il lunedì, solo perché è lunedì?", titolo: "Pasticceria del lunedì" },
    { id: "uff-c05", q: "Chi di noi entrerebbe in videochiamata col filtro da patata, senza sapere come toglierlo?", titolo: "Patata in riunione" },
    { id: "uff-c06", q: "Chi di noi ogni mattina sistemerebbe la scrivania col righello prima di cominciare a lavorare?", titolo: "Geometra della scrivania" },
    { id: "uff-c07", q: "Chi di noi saprebbe come si sblocca la stampante, ma non lo direbbe mai a nessuno?", titolo: "Custode delle stampanti" },
    { id: "uff-c08", q: "Chi di noi si farebbe trovare alla macchinetta del caffè a qualsiasi ora passi il capo?", titolo: "Abitante della macchinetta" },
    { id: "uff-c09", q: "Chi di noi scriverebbe «Come da mia precedente mail» con una cattiveria che si sente fino al piano di sotto?", titolo: "Precedente mail letale" },
    { id: "uff-c10", q: "Chi di noi, alla cena aziendale, finirebbe a fare amicizia col capo del capo?", titolo: "Agganci ai piani alti" },
    { id: "uff-c11", q: "Chi di noi aiuterebbe il collega nuovo a sopravvivere alla prima settimana, cominciando da dove sono i biscotti?", titolo: "Guida ai biscotti" },
    { id: "uff-c12", q: "Chi di noi starebbe in ufficio tre anni senza imparare il nome di nessun collega?", titolo: "Ciao… tu!" },
    { id: "uff-c13", q: "Chi di noi, in riunione, chiederebbe «posso fare una domanda veloce?» e parlerebbe per venti minuti?", titolo: "Domanda veloce (20 min)" },
    { id: "uff-c14", q: "Chi di noi si porterebbe in ufficio tazza, cuscino, coperta e lampada di casa?", titolo: "Trasloco in ufficio" }
  ]
});

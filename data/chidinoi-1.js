/* =========================================================
   DATI — «Chi di Noi?», autore 1: Avventure e guai
   Posti: prigione, bosco, treno, villa, isola.
   {P} = nome di chi è sotto torchio. {o|a} = finale maschile|femminile secondo il suo avatar.
   ========================================================= */
window.SG_CHIDINOI = window.SG_CHIDINOI || { posti: [], comuni: [] };

/* ---------------------------------------------------------
   🔒 IN PRIGIONE
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "prigione", cod: "pri", nome: "In prigione", emoji: "🔒",
  adesivi: "🛏️🪑🚽🧻🥄🕯️🖼️🪴📺🐀🔑⛓️",
  entrata: [
    "Cella 17, vista cortile. Nuovo detenuto: {P}. Reato: ha finito il caffè.",
    "Condanna per {P}: resta dentro finché non rimette a posto il carrello.",
    "Silenzio in cella! È arrivat{o|a} {P}, e ha già chiesto a che ora si cena."
  ],
  immagini: [
    { id: "pri-i01", q: "Chi sarebbe il compagno di cella di {P}?", carte: [
      { chi: "detenuto", faccia: "furbo", piu: { mano: "microfono" }, t: "Canta l'opera alle tre di notte" },
      { chi: "nonno", faccia: "felice", piu: { mano: "libro" }, t: "Dentro da 40 anni, sa tutto" },
      { chi: "mago", faccia: "pensieroso", t: "Giura di poter sparire" },
      { chi: "contadino", faccia: "estasi", t: "Coltiva pomodori nel lavandino" }
    ] },
    { id: "pri-i02", q: "Chi è l'avvocato d'ufficio che tocca a {P}?", carte: [
      { chi: "avvocato", faccia: "sonno", t: "Si addormenta al «Buongiorno»" },
      { chi: "cugino", faccia: "finto", piu: { mano: "libro" }, t: "Il cugino, al primo esame di legge" },
      { chi: "zio", faccia: "furbo", t: "Lo zio: «Ho visto tutti i gialli»" },
      { chi: "avvocato", f: "d", faccia: "arrabbiato", t: "Litiga col giudice, e pure con te" }
    ] },
    { id: "pri-i03", q: "Chi è il secondino del braccio dove finisce {P}?", carte: [
      { chi: "secondino", faccia: "felice", piu: { mano: "tazza" }, t: "Ti porta il caffè e ti dice i guai" },
      { chi: "secondino", faccia: "arrabbiato", t: "Fischia anche quando russi" },
      { chi: "secondino", f: "d", faccia: "innamorato", piu: { mano: "libro" }, t: "Legge poesie in corridoio" },
      { chi: "secondino", faccia: "furbo", piu: { mano: "telefono" }, t: "Ha fatto il gruppo del braccio B" }
    ] },
    { id: "pri-i04", q: "Chi viene a trovare {P} all'ora dei colloqui?", carte: [
      { chi: "mamma", faccia: "arrabbiato", t: "La mamma: «Te l'avevo detto»" },
      { chi: "nonna", faccia: "furbo", t: "La nonna, col dolce «farcito»" },
      { chi: "cugino", faccia: "indifferente", t: "Il cugino: vuole la tua camera" },
      { chi: "zia", faccia: "sorpreso", t: "La zia: «Ma ti danno da mangiare?»" }
    ] },
    { id: "pri-i05", q: "Chi è il direttore del carcere dove finisce {P}?", carte: [
      { chi: "capo", faccia: "felice", piu: { mano: "tazza" }, t: "Riunione del lunedì coi detenuti" },
      { chi: "prof", faccia: "pensieroso", t: "Interroga i detenuti a sorpresa" },
      { chi: "re", faccia: "indifferente", t: "Si fa chiamare «Sua Eccellenza»" },
      { chi: "cuoco", faccia: "estasi", t: "Pensa solo al menù della domenica" }
    ] },
    { id: "pri-i06", q: "Chi fa compagnia a {P} durante l'ora d'aria?", carte: [
      { chi: "detenuto", faccia: "pensieroso", piu: { occhiali: "tondi" }, t: "Il filosofo: parla solo di stelle" },
      { chi: "detenuto", faccia: "esulta", t: "Ti fa contare le sue flessioni" },
      { chi: "nonno", faccia: "furbo", piu: { cappello: "coppola" }, t: "Evaso nel '72, tornato per cena" },
      { chi: "clown", faccia: "felice", t: "Fa il giocoliere con le arance" }
    ] },
    { id: "pri-i07", q: "Chi è il testimone che fa finire dentro {P}?", carte: [
      { chi: "vicino", faccia: "arrabbiato", t: "Il vicino di sotto: sente tutto" },
      { chi: "nonna", faccia: "pensieroso", piu: { occhiali: "grandi" }, t: "La signora alla finestra dal 1987" },
      { chi: "bimbo", faccia: "furbo", piu: { mano: "lecca" }, t: "Il bambino che ha filmato tutto" },
      { chi: "vigile", faccia: "indifferente", t: "Il vigile che ti multa da 10 anni" }
    ] },
    { id: "pri-i08", q: "Chi sceglie {P} come compagno per l'evasione?", carte: [
      { chi: "mago", faccia: "furbo", t: "Sparire? Il trucco è quasi pronto" },
      { chi: "scout", faccia: "esulta", t: "Ha lo zaino pronto da sei mesi" },
      { chi: "nonno", faccia: "pensieroso", t: "Il nonno: conosce ogni tombino" },
      { chi: "influencer", faccia: "estasi", t: "Vuole fare la diretta della fuga" }
    ] },
    { id: "pri-i09", q: "Chi è il bibliotecario del carcere che consiglia i libri a {P}?", carte: [
      { chi: "prof", faccia: "furbo", piu: { mano: "libro" }, t: "Solo libri sulle evasioni famose" },
      { chi: "nonno", faccia: "felice", t: "Te li legge ad alta voce. Tutti" },
      { chi: "mago", faccia: "pensieroso", t: "Libri di trucchi: «per hobby»" },
      { chi: "detenuto", faccia: "linguaccia", piu: { occhiali: "tondi" }, t: "Ti racconta subito il finale" }
    ] },
    { id: "pri-i10", q: "Chi è il giudice del processo di {P}?", carte: [
      { chi: "giudice", faccia: "sonno", t: "Dorme durante tutta la difesa" },
      { chi: "giudice", f: "d", faccia: "arrabbiato", t: "Dieci anni per un parcheggio" },
      { chi: "giudice", faccia: "felice", piu: { mano: "pallone" }, t: "Ha fretta: alle 8 c'è la partita" },
      { chi: "giudice", faccia: "estasi", piu: { mano: "microfono" }, t: "Legge la sentenza cantando" }
    ] },
    { id: "pri-i11", q: "In mensa servono il minestrone per la quarta sera di fila. Cosa fa {P}?", carte: [
      { e: "🍲😋", t: "Lo mangia e chiede pure il bis" },
      { e: "📝✊", t: "Raccolta firme anti-minestrone" },
      { e: "🍮🔁", t: "Lo scambia con un budino" },
      { e: "🥖", t: "Vive di pane fino a domenica" }
    ] },
    { id: "pri-i12", q: "In cella c'è una tv sola, due canali e un telecomando. Come lo gestisce {P}?", carte: [
      { e: "📺👑", t: "Decide sempre cosa si guarda" },
      { e: "🤝📺", t: "Diventa amico di chi ce l'ha" },
      { e: "📖😤", t: "Legge e si lamenta del volume" },
      { e: "📅📺", t: "Fa i turni, scritti sul muro" }
    ] },
    { id: "pri-i13", q: "In cortile serve un soprannome da duro. Come si fa chiamare {P}?", carte: [
      { e: "🦈", t: "«Lo Squalo» (non sa nuotare)" },
      { e: "🎓", t: "«Il Prof» (corregge i muri)" },
      { e: "🥄", t: "«Er Cucchiaino»" },
      { e: "🙋", t: "Nome e cognome, gentilmente" }
    ] },
    { id: "pri-i14", q: "Una notte {P} trova un buco nel muro della cella. Cosa fa?", carte: [
      { e: "🪥🤫", t: "Lo tappa col dentifricio e tace" },
      { e: "🕳️😩", t: "Ci si infila e si incastra a metà" },
      { e: "🗣️🌙", t: "Parla col vicino fino all'alba" },
      { e: "🩴💨", t: "Scappa subito, in ciabatte" }
    ] },
    { id: "pri-i15", q: "{P} deve passare trenta giorni in isolamento. Come li passa?", carte: [
      { e: "🧱💬", t: "Parla col muro e lo chiama Franco" },
      { e: "💪", t: "Mille flessioni al giorno" },
      { e: "😴", t: "Dorme: finalmente un po' di pace" },
      { e: "🔢", t: "Conta le mattonelle. E riconta." }
    ] },
    { id: "pri-i16", q: "Nella cella di {P} c'è un letto a castello. Come si decide chi sta sopra?", carte: [
      { e: "🏃🛏️", t: "Sale sopra prima di salutare" },
      { e: "🙂😒", t: "Lascia scegliere, poi si lamenta" },
      { e: "💪🤝", t: "Braccio di ferro, al meglio di 5" },
      { e: "🪙🔁", t: "Testa o croce. Se perde, rilancia" }
    ] },
    { id: "pri-i17", q: "C'è la recita di Natale del carcere. Che parte fa {P}?", carte: [
      { e: "🌟🎭", t: "Vuole il ruolo principale" },
      { e: "🎬📝", t: "Fa il regista e riscrive tutto" },
      { e: "🎄", t: "Fa l'albero, senza dire una parola" },
      { e: "🤒", t: "Mal di pancia, il giorno prima" }
    ] },
    { id: "pri-i18", q: "Il detenuto nuovo si siede al posto di {P} in mensa. Cosa succede?", carte: [
      { e: "📜🗣️", t: "Gli spiega le regole per mezz'ora" },
      { e: "👀", t: "Lo fissa finché non si sposta" },
      { e: "🥺", t: "Cambia tavolo e ci rimane male" },
      { e: "🍮😈", t: "Gli ruba il budino per vendetta" }
    ] },
    { id: "pri-i19", q: "{P} riesce a evadere! Dopo tre ore l{o|a} ritrovano. Dove?", carte: [
      { e: "👵🍝", t: "A tavola dalla mamma" },
      { e: "🍕🧾", t: "In pizzeria, col conto da pagare" },
      { e: "🚗🔄", t: "Gira a vuoto nel parcheggio" },
      { e: "🚪🛏️", t: "Al cancello: rivuole il cuscino" }
    ] },
    { id: "pri-i20", q: "«Chi fa il nome del ladro di merendine esce un mese prima». {P} lo sa. Cosa fa?", carte: [
      { e: "🗣️📅", t: "Parla subito: un mese è un mese" },
      { e: "🤐", t: "Muto: mai fare la spia" },
      { e: "🤝✌️", t: "Tratta: «Facciamo due mesi»" },
      { e: "🍫➗", t: "Si fa dare metà merendine" }
    ] },
    { id: "pri-i21", q: "In prigione i soldi non contano. Con cosa paga i favori {P}?", carte: [
      { e: "🍫", t: "Cioccolato, a quadretti" },
      { e: "🧻✨", t: "Carta igienica morbida: rarissima" },
      { e: "✂️💇", t: "Tagli di capelli (senza specchio)" },
      { e: "🗣️👂", t: "Pettegolezzi freschi del braccio B" }
    ] },
    { id: "pri-i22", q: "Cosa nasconde {P} sotto il materasso della cella?", carte: [
      { e: "📸🐱", t: "Le foto del gatto, plastificate" },
      { e: "🗺️✏️", t: "La mappa della fuga (sbagliata)" },
      { e: "🧀", t: "Un pezzo di parmigiano stagionato" },
      { e: "📒🎤", t: "Le canzoni scritte per Sanremo" }
    ] },
    { id: "pri-i23", q: "Il secondino si addormenta con le chiavi in mano, davanti alla cella di {P}. Cosa fa {P}?", carte: [
      { e: "🔑🤫", t: "Prende le chiavi in punta di piedi" },
      { e: "👆😴", t: "Lo sveglia: «Guardi che dorme»" },
      { e: "🛌💤", t: "Gli mette sopra una coperta" },
      { e: "📸😂", t: "Foto, e la gira a tutto il carcere" }
    ] },
    { id: "pri-i24", q: "Sparisce il cappello del direttore. Tutti guardano {P}. Cosa fa?", carte: [
      { e: "😰🙋", t: "Confessa: non regge gli sguardi" },
      { e: "👉", t: "Accusa il compagno di cella" },
      { e: "🎩😇", t: "Ce l'ha in testa in quel momento" },
      { e: "🔍", t: "Apre un'indagine tutta sua" }
    ] },
    { id: "pri-i25", q: "Libertà subito, ma prima {P} deve cucinare per tutto il carcere: 300 persone. Cosa fa?", carte: [
      { e: "🍝🔥", t: "Pasta al forno per trecento" },
      { e: "🚪💨", t: "Accetta e scappa dalla cucina" },
      { e: "🙅", t: "Rifiuta: meglio un anno dentro" },
      { e: "👵📞", t: "Chiama la mamma per la ricetta" }
    ] },
    { id: "pri-i26", q: "Che faccia fa {P} quando il secondino annuncia: «Da oggi in mensa solo cavolfiore bollito»?", carte: [
      { lui: "disgusto", t: "Già pensa allo sciopero" },
      { lui: "arrabbiato", t: "Scrive al ministro, a mano" },
      { lui: "indifferente", t: "Tanto mangia di nascosto" },
      { lui: "furbo", t: "Ha un piano: lo rivende agli altri" }
    ] },
    { id: "pri-i27", q: "Che faccia fa {P} nella foto segnaletica?", carte: [
      { lui: "felice", t: "«Si vede il profilo buono?»" },
      { lui: "furbo", t: "Ghigno da film di gangster" },
      { lui: "terrore", t: "Peggio della foto della patente" },
      { lui: "linguaccia", t: "La rifanno tre volte" }
    ] },
    { id: "pri-i28", q: "Che faccia fa {P} quando il giudice aggiunge: «…e niente telefono per tutta la pena»?", carte: [
      { lui: "terrore", t: "Chiede di trattare la pena" },
      { lui: "triste", t: "Saluta il telefono come un amico" },
      { lui: "indifferente", t: "Tanto aveva la batteria scarica" },
      { lui: "furbo", t: "Ne ha già nascosto un altro" }
    ] },
    { id: "pri-i29", q: "Che faccia fa {P} quando la nonna porta al colloquio sei paia di calzettoni di lana fatti a mano?", carte: [
      { lui: "innamorato", t: "Li mette tutti e sei insieme" },
      { lui: "finto", t: "«Bellissimi!» (pungono)" },
      { lui: "felice", t: "Li baratta: un budino al paio" },
      { lui: "imbarazzo", t: "L'ha visto tutto il braccio B" }
    ] },
    { id: "pri-i30", q: "Che faccia fa {P} quando il giudice dice «cento anni di lavori domestici»?", carte: [
      { lui: "terrore", t: "Chiede di parlare con la mamma" },
      { lui: "furbo", t: "Ha già un piano: la lavastoviglie" },
      { lui: "indifferente", t: "Tanto a casa non li fa lo stesso" },
      { lui: "esulta", piu: { cappello: "chef" }, t: "Finalmente un lavoro fisso" }
    ] }
  ],
  scrivi: [
    { id: "pri-s01", q: "{P} fa l'unica telefonata dalla prigione. Cosa dice?",
      riserve: ["Mamma, non dire niente alla nonna", "Una margherita alla cella 17", "Pronto, pizzeria? Consegnate in cella?"] },
    { id: "pri-s02", q: "Sul muro della cella, {P} incide: «Qui è passat{o|a} {P}, e ___»",
      riserve: ["ha lasciato i piatti sporchi", "ha finito la carta igienica del braccio", "tornerà per la pizza del venerdì"], voto: "lui" },
    { id: "pri-s03", q: "Sul verbale c'è il reato di {P}: «Il soggetto ___»",
      riserve: ["ha spoilerato il finale a tutto il bus", "ha preso l'ultimo cornetto alla crema", "ha suonato tutti i citofoni del palazzo"] },
    { id: "pri-s04", q: "Al colloquio {P} sussurra alla mamma: «La prossima volta portami ___»",
      riserve: ["la parmigiana dentro un libro vuoto", "il gatto, travestito da sciarpa", "il cuscino col mio nome ricamato"] },
    { id: "pri-s05", q: "La lettera di {P} al direttore del carcere comincia così: «Gentile direttore, ___»",
      riserve: ["il materasso ha la forma dell'Italia", "il minestrone mi guarda", "vorrei una cella con vista mare"] },
    { id: "pri-s06", q: "{P} esce dopo dieci anni di cella. Qual è la prima cosa che dice fuori?",
      riserve: ["Chi si è preso il mio posto sul divano?", "Qualcuno ha dato da mangiare al pesce?", "Il telefono si ricorda il PIN?"] },
    { id: "pri-s07", q: "Il secondino scrive la pagella di {P}: «Condotta ottima, ma ___»",
      riserve: ["canta sotto la doccia alle 5", "ha arredato il corridoio", "chiama tutti «tesoro», anche me"] },
    { id: "pri-s08", q: "Il cartello appeso fuori dalla cella di {P} dice: «___»",
      riserve: ["Non disturbare: sto evadendo", "Bussare tre volte e portare dolci", "Attenzione: se ha fame, morde"] },
    { id: "pri-s09", q: "Al processo {P} si difende: «Signor giudice, io ero lì solo perché ___»",
      riserve: ["mi avevano detto che c'era il buffet", "seguivo un gatto molto sospetto", "pensavo fosse la fila per il gelato"] },
    { id: "pri-s10", q: "{P} scrive il piano di fuga su un tovagliolo. Il punto 1 è: «___»",
      riserve: ["Fare merenda", "Trovare un cucchiaino più grande", "Chiedere al secondino dov'è l'uscita"] },
    { id: "pri-s11", q: "Dopo l'evasione, {P} manda una cartolina al carcere. Cosa c'è scritto?",
      riserve: ["Qui si mangia meglio, ma mi mancate", "Tenetemi il posto, torno a Natale", "Restituisco il cucchiaino, scusate"] },
    { id: "pri-s12", q: "Il libro che {P} scrive in cella si intitola: «___»",
      riserve: ["Cento giorni senza parmigiano", "Il minestrone: una storia vera", "Evadere per principianti, volume 3"] },
    { id: "pri-s13", q: "Per non far preoccupare la nonna, {P} le racconta una bugia. Quale?",
      riserve: ["Nonna, è un hotel col cancello", "Sto girando un film, questa è la scena", "Faccio un corso: si chiama ora d'aria"] },
    { id: "pri-s14", q: "La canzone che {P} canta ogni sera dietro le sbarre si chiama «___»",
      riserve: ["Minestrone, amore mio", "Cucchiaino, scava con me", "Libero (venerdì alle dieci)"] },
    { id: "pri-s15", q: "{P} vince il premio «Detenut{o|a} del mese». Sulla targa c'è scritto il motivo: ___",
      riserve: ["ha imparato il nome di ogni topo", "ha rifatto il letto anche al secondino", "non scava tunnel da martedì"] },
    { id: "pri-s16", q: "Il secondino trova un biglietto nascosto nella branda di {P}. Cosa c'è scritto?",
      riserve: ["Se lo trovi, la merendina è mia", "Lista della spesa: lima, torta, corda", "Caro diario, oggi il topo mi ha sorriso"] },
    { id: "pri-s17", q: "Il giudice concede a {P} una sola cosa da tenere in cella. Cosa chiede?",
      riserve: ["Una vasca idromassaggio, piccolina", "Il gatto, almeno nel weekend", "La mamma, ma solo per stirare"] },
    { id: "pri-s18", q: "Il secondino chiede a {P} perché ride da sol{o|a} alle 3 di notte. Cosa risponde?",
      riserve: ["Ho sognato il minestrone che scappava", "Pensavo alla faccia del giudice", "Il topo mi ha detto una barzelletta"] }
  ],
  disegna: [
    { id: "pri-d01", q: "Disegna come sarebbe la cella di {P} dopo un anno", su: "scena", adesivi: "🎮🧸🛋️" },
    { id: "pri-d02", q: "Disegna su {P} il travestimento con cui prova a evadere", su: "ritratto", adesivi: "🥸👵🧹" },
    { id: "pri-d03", q: "Disegna su {P} i tatuaggi da duro… ma tutti di cuoricini e gattini", su: "ritratto", adesivi: "❤️🐱🌈🦄" },
    { id: "pri-d04", q: "Disegna su {P} barba e capelli dopo trent'anni di cella", su: "ritratto", adesivi: "🐦🪺✂️" },
    { id: "pri-d05", q: "Disegna su {P} la divisa del secondino: cappello, fischietto e baffoni", su: "ritratto", adesivi: "🔑📋☕" },
    { id: "pri-d06", q: "Disegna su {P} l'aria innocente per il giudice: aureola e occhioni dolci", su: "ritratto", adesivi: "😇✨🌸" },
    { id: "pri-d07", q: "Disegna su {P} il ladro di merendine: mascherina, sacco e bottino", su: "ritratto", adesivi: "🍫🍩🥐🎒" },
    { id: "pri-d08", q: "Disegna la cella di {P} addobbata per Natale", su: "scena", adesivi: "🎄🎁⭐🧦" },
    { id: "pri-d09", q: "Disegna la cella di {P} il giorno della visita della nonna", su: "scena", adesivi: "🧹💐🍰🧽" },
    { id: "pri-d10", q: "Disegna l'ufficio di {P} il giorno che diventa direttore del carcere", su: "scena", adesivi: "👑🛋️🍰🏆" },
    { id: "pri-d11", q: "Disegna la torta che la nonna porta a {P}, con dentro tutto per evadere", su: "scena", adesivi: "🎂🪚🪢🗺️" },
    { id: "pri-d12", q: "Disegna il topo della cella che {P} ha addestrato", su: "scena", adesivi: "🧀🎩🎪🏆" }
  ],
  chi: [
    { id: "pri-c01", q: "Chi di noi scaverebbe un tunnel col cucchiaino per due anni… e sbucherebbe nell'ufficio del direttore?", titolo: "Talpa sfortunata" },
    { id: "pri-c02", q: "Chi di noi, in prigione, metterebbe in piedi un mercato nero di bustine di maionese?", titolo: "Mercato nero di maionese" },
    { id: "pri-c03", q: "Chi di noi passerebbe tutta l'ora del colloquio a lamentarsi del cuscino della cella?", titolo: "Recensione: una stella" },
    { id: "pri-c04", q: "Chi di noi finirebbe a giocare a carte col secondino in guardiola, tutte le sere?", titolo: "Briscola col secondino" },
    { id: "pri-c05", q: "Chi di noi racconterebbe a tutti di essere dentro «per un grosso colpo»… ma era una multa non pagata?", titolo: "Boss delle multe" },
    { id: "pri-c06", q: "Chi di noi trasformerebbe la cella in un monolocale da rivista, con le tendine e la piantina?", titolo: "Cella da rivista" },
    { id: "pri-c07", q: "Chi di noi preparerebbe per mesi l'evasione perfetta e poi la rimanderebbe perché quella sera c'è la partita?", titolo: "Evasione rimandata" },
    { id: "pri-c08", q: "Chi di noi, in prigione, si iscriverebbe a tutti i corsi: ceramica, uncinetto, teatro e yoga?", titolo: "Collezionista di corsi" },
    { id: "pri-c09", q: "Chi di noi scriverebbe le lettere d'amore per tutti i detenuti del braccio, gratis?", titolo: "Lettere d'amore gratis" },
    { id: "pri-c10", q: "Chi di noi farebbe una carbonara pazzesca col fornelletto della cella e la dividerebbe con tutto il corridoio?", titolo: "Carbonara da galera" },
    { id: "pri-c11", q: "Chi di noi uscirebbe in anticipo perché i secondini non ne possono più?", titolo: "Libertà per sfinimento" },
    { id: "pri-c12", q: "Chi di noi, il giorno della scarcerazione, chiederebbe di restare fino a venerdì perché c'è la pizza?", titolo: "Fine pena: dopo la pizza" },
    { id: "pri-c13", q: "Chi di noi, alla perquisizione, verrebbe trovato con dodici merendine nascoste nei calzini?", titolo: "Calzino farcito" },
    { id: "pri-c14", q: "Chi di noi farebbe di tutto per finire dentro, «solo per vedere com'è»?", titolo: "Dentro per curiosità" }
  ]
});

/* ---------------------------------------------------------
   ⛺ NEL BOSCO
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "bosco", cod: "bos", nome: "Nel bosco", emoji: "⛺",
  adesivi: "⛺🔥🪵🌲🐻🦝🍄🎒🔦🦟🌭🛶",
  entrata: [
    "Nel bosco: niente segnale, tantissime zanzare. Sotto torchio c'è {P}.",
    "La tenda è montata (più o meno). Stanotte, nel bosco, tocca a {P}.",
    "Fuoco acceso, salsicce in arrivo, tenda storta. Stasera tocca a {P}."
  ],
  immagini: [
    { id: "bos-i01", q: "Chi è la guida che accompagna {P} nel bosco?", carte: [
      { chi: "scout", faccia: "esulta", t: "Canta canzoni scout per sei ore" },
      { chi: "nonno", faccia: "furbo", t: "Dice «manca poco» da tre ore" },
      { chi: "influencer", faccia: "finto", t: "Ogni 10 metri si ferma: video" },
      { chi: "contadino", faccia: "indifferente", t: "Parla solo con le mucche" }
    ] },
    { id: "bos-i02", q: "Chi pianta la tenda accanto a quella di {P}?", carte: [
      { chi: "vicino", faccia: "felice", t: "Arriva in pantofole, con la tv" },
      { chi: "bimbo", faccia: "furbo", t: "Gioca a nascondino nella tua tenda" },
      { chi: "zia", faccia: "estasi", t: "Ha portato frigo e tovaglia" },
      { chi: "dj", faccia: "esulta", t: "Ha portato la cassa e le luci" }
    ] },
    { id: "bos-i03", q: "{P} si perde nel bosco. Chi l{o|a} ritrova?", carte: [
      { chi: "scout", faccia: "indifferente", t: "Uno scout di 8 anni: «Era di là»" },
      { chi: "contadino", faccia: "sorpreso", t: "Un contadino: eri a 50 metri" },
      { chi: "nonna", faccia: "arrabbiato", t: "La nonna dei funghi, che sgrida" },
      { chi: "cuoco", faccia: "felice", t: "Il cuoco: «Seguivi il sugo, no?»" }
    ] },
    { id: "bos-i04", q: "Chi è l'esperto di sopravvivenza che {P} segue alla cieca?", carte: [
      { chi: "cowboy", faccia: "furbo", t: "Accende il fuoco con lo sguardo" },
      { chi: "prof", faccia: "pensieroso", piu: { mano: "libro" }, t: "Ha letto tutto, mai fatto niente" },
      { chi: "vichingo", faccia: "esulta", t: "Dorme senza tenda, per principio" },
      { chi: "cugino", faccia: "finto", piu: { mano: "telefono" }, t: "Il cugino: guarda i tutorial ora" }
    ] },
    { id: "bos-i05", q: "Alla fontanella del campeggio, la mattina presto, chi trova {P}?", carte: [
      { chi: "nonno", faccia: "felice", t: "Si fa la barba cantando l'opera" },
      { chi: "mamma", faccia: "arrabbiato", t: "Lava i piatti di quattro tende" },
      { chi: "influencer", faccia: "finto", t: "Si trucca per la diretta delle 7" },
      { chi: "bimbo", faccia: "linguaccia", t: "Ti schizza: è il suo lavoro" }
    ] },
    { id: "bos-i06", q: "Chi controlla lo zaino di {P} prima della partenza?", carte: [
      { chi: "mamma", faccia: "arrabbiato", t: "Aggiunge tre maglioni di riserva" },
      { chi: "allenatore", faccia: "indifferente", t: "Lo pesa: «Troppo. Togli»" },
      { chi: "scout", faccia: "furbo", t: "Ti fa rifare tutti i nodi" },
      { chi: "papa", faccia: "felice", t: "Ci infila di nascosto un salame" }
    ] },
    { id: "bos-i07", q: "Nel bosco {P} incontra un eremita che vive lì da vent'anni. Chi è?", carte: [
      { chi: "nonno", faccia: "pensieroso", t: "Sa tutto, non dice niente" },
      { chi: "impiegato", faccia: "finto", t: "Ex impiegato: manda mail ai pini" },
      { chi: "mago", faccia: "furbo", t: "Dice di parlare con gli alberi" },
      { chi: "contadino", faccia: "felice", t: "Ha 14 galline, tutte col nome" }
    ] },
    { id: "bos-i08", q: "Chi è il guardaparco che sorprende {P} col fuoco acceso dove è vietato?", carte: [
      { chi: "vigile", faccia: "arrabbiato", t: "Multa anche gli scoiattoli" },
      { chi: "poliziotto", faccia: "sonno", t: "Si siede e chiede una salsiccia" },
      { chi: "prof", faccia: "pensieroso", t: "Lezione sugli incendi: un'ora" },
      { chi: "arbitro", faccia: "furbo", t: "Fischia e tira fuori il giallo" }
    ] },
    { id: "bos-i09", q: "Con chi divide la tenda {P}?", carte: [
      { chi: "bimbo", faccia: "linguaccia", t: "Il cuginetto: scalcia nel sonno" },
      { chi: "nonno", faccia: "sonno", t: "Russa come una motosega" },
      { chi: "influencer", faccia: "felice", t: "Tiene la luce per i video accesa" },
      { chi: "cugino", faccia: "furbo", t: "Mangia cracker nel sacco a pelo" }
    ] },
    { id: "bos-i10", q: "Nel bosco il bagno non c'è. Cosa fa {P}?", carte: [
      { e: "⏳🏠", t: "Si tiene tutto fino a casa" },
      { e: "🚶🗺️", t: "Cammina un km per il posto giusto" },
      { e: "🌲😌", t: "Primo albero, zero problemi" },
      { e: "👀🙏", t: "Vuole qualcuno di guardia" }
    ] },
    { id: "bos-i11", q: "Alle due di notte una zanzara ronza nella tenda di {P}. Cosa fa?", carte: [
      { e: "🔦🦟", t: "Le dà la caccia per un'ora" },
      { e: "🛌🙈", t: "Nel sacco a pelo, testa compresa" },
      { e: "😌", t: "La lascia: tanto punge gli altri" },
      { e: "📣😩", t: "Sveglia tutti: servono rinforzi" }
    ] },
    { id: "bos-i12", q: "Il gruppo si è perso nel bosco. Cosa fa {P}?", carte: [
      { e: "👉😎", t: "«Di qua, fidatevi»" },
      { e: "🌳🔍", t: "Cerca il muschio sugli alberi" },
      { e: "🪨⏳", t: "Si siede e aspetta i soccorsi" },
      { e: "🥪🔢", t: "Conta quanti panini restano" }
    ] },
    { id: "bos-i13", q: "Tocca a {P} accendere il fuoco. Com'è andata?", carte: [
      { e: "⏰🔥", t: "Due ore, ma non accetta aiuto" },
      { e: "🔥😎", t: "Subito, e se ne vanta tutta sera" },
      { e: "🔥🤫", t: "Usa l'accendino di nascosto" },
      { e: "📰💨", t: "Brucia tutto il giornale, e niente" }
    ] },
    { id: "bos-i14", q: "Durante il temporale la tenda di {P} si allaga. Cosa fa?", carte: [
      { e: "🚗💤", t: "Va a dormire in macchina" },
      { e: "⛺➡️", t: "Si infila nella tenda di un altro" },
      { e: "💧😴", t: "Dorme lo stesso, nella pozzanghera" },
      { e: "🖐️🌊", t: "Scava un canale con le mani" }
    ] },
    { id: "bos-i15", q: "{P} trova un cagnolino che si è perso nel bosco. Cosa fa?", carte: [
      { e: "🐶🏠", t: "Se lo porta a casa e basta" },
      { e: "🔍🐶", t: "Gira tutto il bosco per il padrone" },
      { e: "🌭🐶", t: "Gli dà tutta la sua cena" },
      { e: "📸📱", t: "Trenta foto, mandate a tutti" }
    ] },
    { id: "bos-i16", q: "In campeggio c'è solo la doccia fredda. Cosa fa {P}?", carte: [
      { e: "🚿😱", t: "La fa urlando" },
      { e: "🙅🧼", t: "Non si lava per tre giorni" },
      { e: "🍝💧", t: "Scalda l'acqua nella pentola" },
      { e: "🏞️", t: "Va a lavarsi nel lago" }
    ] },
    { id: "bos-i17", q: "Un ragno grande come una mano entra nella tenda di {P}. Cosa fa?", carte: [
      { e: "🏃🌙", t: "Scappa e dorme fuori" },
      { e: "🥛🕷️", t: "Col bicchiere, e lo libera fuori" },
      { e: "🕷️💬", t: "Lo chiama Gino e se lo tiene" },
      { e: "📣", t: "Urla finché non arriva qualcuno" }
    ] },
    { id: "bos-i18", q: "Il menù del campeggio lo decide {P}. Cosa si mangia?", carte: [
      { e: "🌭🔥", t: "Salsicce alla brace per tutti" },
      { e: "🥫🔥", t: "Scatolette scaldate sul fuoco" },
      { e: "🍝⏱️", t: "Pasta al fornelletto, al dente" },
      { e: "🍄🫐", t: "Quello che troviamo nel bosco" }
    ] },
    { id: "bos-i19", q: "{P} va a pescare la cena nel lago. Cosa porta all'accampamento?", carte: [
      { e: "🌿🍽️", t: "Un'alga: «È l'antipasto»" },
      { e: "🐟🔙", t: "Niente: l'ha ributtato, poverino" },
      { e: "🎣😴", t: "Dorme con la canna in mano" },
      { e: "🏪🐟", t: "Pesce surgelato, preso in paese" }
    ] },
    { id: "bos-i20", q: "Tocca a {P} il primo turno di guardia notturna. Com'è andata?", carte: [
      { e: "😴", t: "Dorme dopo cinque minuti" },
      { e: "🚨", t: "Sveglia tutti a ogni rumore" },
      { e: "🌅😎", t: "Fino all'alba, poi se ne vanta" },
      { e: "🤝💤", t: "Passa il turno al primo sveglio" }
    ] },
    { id: "bos-i21", q: "Si rompe la cerniera della tenda di {P}. Come la chiude per la notte?", carte: [
      { e: "🧷🧷", t: "Venti spille da balia" },
      { e: "🩹🌀", t: "Nastro adesivo: tutto il rotolo" },
      { e: "🧦🧦", t: "Ci appende i calzini, a tendina" },
      { e: "😴🌙", t: "Non la chiude: «Si sta freschi»" }
    ] },
    { id: "bos-i22", q: "Il sentiero passa su un ponte di corda che dondola. Come lo attraversa {P}?", carte: [
      { e: "🤸", t: "Saltellando, per spaventare tutti" },
      { e: "🙈", t: "A occhi chiusi, in fondo alla fila" },
      { e: "🔄⏱️", t: "Non lo passa: giro lungo, due ore" },
      { e: "🐒", t: "Gattonando, abbracciando le corde" }
    ] },
    { id: "bos-i23", q: "{P} va a cercare legna e torna dopo tre ore. Cos'è successo?", carte: [
      { e: "🗺️❓", t: "Giro lungo: «Era una scorciatoia»" },
      { e: "☕🏘️", t: "Ha trovato un bar in paese" },
      { e: "😴🌳", t: "Pisolino sotto un albero" },
      { e: "🏕️🤝", t: "Ha fatto amicizia con gli scout" }
    ] },
    { id: "bos-i24", q: "Cosa infila {P} nello zaino del campeggio, che non userà mai?", carte: [
      { e: "📚", t: "I libri, «per studiare un po'»" },
      { e: "🎤🎶", t: "Il microfono del karaoke" },
      { e: "🧴🧴🧴", t: "Sei creme diverse, tutte urgenti" },
      { e: "🎮", t: "La console, con tre caricatori" }
    ] },
    { id: "bos-i25", q: "Che faccia fa {P} quando apre lo zaino e scopre che i panini sono rimasti a casa?", carte: [
      { lui: "arrabbiato", t: "Cerca un colpevole nel gruppo" },
      { lui: "triste", t: "Guarda le foto dei panini" },
      { lui: "furbo", t: "Ha le merendine nelle tasche" },
      { lui: "indifferente", t: "Mangia bacche, come niente" }
    ] },
    { id: "bos-i26", q: "Che faccia fa {P} quando si sveglia in tenda con una rana seduta sul petto?", carte: [
      { lui: "terrore", t: "Urla: si sveglia tutto il bosco" },
      { lui: "felice", t: "Le ha già dato un nome" },
      { lui: "sonno", t: "La sposta e si rigira" },
      { lui: "disgusto", t: "Doccia di un'ora (fredda)" }
    ] },
    { id: "bos-i27", q: "Che faccia fa {P} quando qualcuno propone: «Domani camminata di sei ore, tutta in salita»?", carte: [
      { lui: "esulta", piu: { schiena: "zaino" }, t: "Ha già lo zaino in spalla" },
      { lui: "terrore", t: "Già cerca un passaggio in auto" },
      { lui: "finto", t: "«Che bello!» (ha prenotato la spa)" },
      { lui: "sonno", t: "Si sveglia per il pranzo" }
    ] },
    { id: "bos-i28", q: "Che faccia fa {P} quando assaggia la pasta che un amico ha cotto sul fuoco per un'ora?", carte: [
      { lui: "disgusto", t: "La dà di nascosto al cane" },
      { lui: "finto", t: "«Buonissima!» e la nasconde" },
      { lui: "estasi", t: "Chiede il bis (ha fame)" },
      { lui: "pensieroso", t: "Cerca di capire cos'è" }
    ] },
    { id: "bos-i29", q: "Che faccia fa {P} quando sente la cerniera della tenda aprirsi piano piano, alle tre di notte?", carte: [
      { lui: "terrore", t: "Fa finta di essere un sacco a pelo" },
      { lui: "furbo", t: "Sa chi è: il ladro di patatine" },
      { lui: "sonno", t: "Non si sveglia neanche adesso" },
      { lui: "sorpreso", t: "Esce con la torcia: è una mucca" }
    ] }
  ],
  scrivi: [
    { id: "bos-s01", q: "Sul cartello piantato davanti alla tenda di {P} c'è scritto: «___»",
      riserve: ["Vietato l'ingresso a orsi e cugini", "Qui si russa: entrate a vostro rischio", "Wi-Fi: no. Patatine: forse"] },
    { id: "bos-s02", q: "{P} fa da guida ai turisti nel bosco. Indica un albero e spiega: «___»",
      riserve: ["Questo è un pino. O un abete. Un albero", "Qui ho perso la strada. Tre volte", "Non toccate: è il bagno di emergenza"] },
    { id: "bos-s03", q: "{P} racconta una storia di paura attorno al fuoco. Comincia così: «___»",
      riserve: ["Era una notte buia, e senza Wi-Fi", "Un campeggiatore aprì il frigo: vuoto", "La zanzara tornò. Con le amiche"] },
    { id: "bos-s04", q: "Un procione svuota lo zaino di {P} ogni notte. {P} gli lascia un biglietto: «___»",
      riserve: ["Almeno richiudi la zip", "I biscotti al cioccolato sono miei", "Facciamo a metà, ma la mia è più grande"] },
    { id: "bos-s05", q: "Il diario di {P}, terzo giorno nel bosco: «___»",
      riserve: ["Il cervo di ieri era un cespuglio", "Ho parlato due ore con un fungo", "Sogno il bidet di casa"] },
    { id: "bos-s06", q: "Le formiche del bosco hanno un soprannome per {P}. Qual è?",
      riserve: ["La Briciola Volante", "Il Supermercato Ambulante", "Sua Maestà della Marmellata"] },
    { id: "bos-s07", q: "Un gufo fissa {P} da un'ora. {P} gli parla. Cosa gli dice?",
      riserve: ["Abbassa la voce, c'è gente che dorme", "Tu che sei sveglio: dov'è il bagno?", "Uh-uh. Cioè, buonasera"] },
    { id: "bos-s08", q: "Il cartello diceva «Sentiero facile, 1 ora». Dopo 5 ore {P} ci scrive sotto: «___»",
      riserve: ["Facile per una capra, forse", "Un'ora di andata. Il ritorno: mai", "Chi l'ha scritto non è mai salito"] },
    { id: "bos-s09", q: "Una lucciola magica concede a {P} un desiderio nel bosco. Cosa chiede?",
      riserve: ["Una presa elettrica, una sola", "Un bagno con la porta e la chiave", "Che le zanzare pungano solo il cugino"] },
    { id: "bos-s10", q: "{P} urla il suo nome dalla cima del monte. Ma l'eco risponde: «___»",
      riserve: ["Ancora tu?", "Chi? Non ti conosco", "Hai lasciato acceso il fornello"] },
    { id: "bos-s11", q: "{P} scrive le regole del campeggio. Regola numero 1: «___»",
      riserve: ["Chi russa dorme col procione", "Il cioccolato non si divide", "Vietato dire «tanto manca poco»"] },
    { id: "bos-s12", q: "Dopo la prima notte in tenda, {P} manda un messaggio alla mamma: «___»",
      riserve: ["Vieni a prendermi, porta la coperta", "Sto bene. Il ragno è un amico", "Ho dormito su una radice. Felice"] },
    { id: "bos-s13", q: "Dopo il campeggio, {P} si fa stampare una maglietta. Cosa c'è scritto?",
      riserve: ["Zanzare 214, io 0", "Ho visto un cervo (forse)", "Io e il fuoco: ci stiamo conoscendo"] },
    { id: "bos-s14", q: "{P} vuole convincere il gruppo a restare un'altra notte. Cosa dice?",
      riserve: ["Domani vi mostro il fungo che parla", "Ho trovato un fiume: è tipo una doccia", "Le salsicce non si mangiano da sole"] },
    { id: "bos-s15", q: "Il manuale di sopravvivenza scritto da {P} ha un capitolo intitolato: «___»",
      riserve: ["Perdersi con stile", "Il sacco a pelo: istruzioni per uscirne", "Zanzare: si può trattare?"] },
    { id: "bos-s16", q: "Sul registro del guardaparco: «Richiamo per {P}: ___»",
      riserve: ["chiedeva la password del Wi-Fi a un pino", "ha dato i biscotti a uno scoiattolo", "ha montato la tenda in mezzo al sentiero"] },
    { id: "bos-s17", q: "{P} monta la tenda senza leggere le istruzioni. Dopo un'ora annuncia: «___»",
      riserve: ["Mi avanzano sei pezzi. È normale?", "È una tenda moderna: va storta", "Stanotte si dorme sotto le stelle"] }
  ],
  disegna: [
    { id: "bos-d01", q: "Disegna cosa c'è davvero fuori dalla tenda di {P} alle 3 di notte", su: "scena", adesivi: "🦔🐗👀🔦" },
    { id: "bos-d02", q: "Disegna il campeggio di {P} se avesse portato tutto da casa", su: "scena", adesivi: "🛋️📺🍝🧺" },
    { id: "bos-d03", q: "Disegna il rifugio di rami che {P} costruisce quando la tenda vola via", su: "scena", adesivi: "🍃🪨🌧️" },
    { id: "bos-d04", q: "Disegna la grigliata di {P} sul fuoco: cosa ci cuoce?", su: "scena", adesivi: "🌽🍗🧀🍕🍢" },
    { id: "bos-d05", q: "Disegna la mappa del bosco secondo {P} (con la strada sbagliata)", su: "scena", adesivi: "🗺️❌➡️🏁" },
    { id: "bos-d06", q: "Disegna gli animali del bosco che si accampano con {P}", su: "scena", adesivi: "🦊🐿️🦉🐸" },
    { id: "bos-d07", q: "Disegna su {P} le punture di zanzara unite come costellazioni", su: "ritratto", adesivi: "🦟⭐✨" },
    { id: "bos-d08", q: "Disegna su {P} il travestimento da cespuglio per spiare i cervi", su: "ritratto", adesivi: "🌿🍃🦌🔭" },
    { id: "bos-d09", q: "Disegna su {P} il look dopo 3 giorni senza doccia: foglie, rami e ospiti", su: "ritratto", adesivi: "🍂🐛🐌🪶" },
    { id: "bos-d10", q: "Disegna su {P} l'attrezzatura da esploratore per 20 minuti di passeggiata", su: "ritratto", adesivi: "🧭🔭🪢🥾" },
    { id: "bos-d11", q: "Disegna su {P} il cappello da campeggio con tutto attaccato sopra", su: "ritratto", adesivi: "🧲🔔🌭🧦" },
    { id: "bos-d12", q: "Disegna su {P} la corona del bosco: pigne, foglie e funghi", su: "ritratto", adesivi: "👑🌰🍂" }
  ],
  chi: [
    { id: "bos-c01", q: "Chi di noi pianterebbe la tenda in discesa e passerebbe la notte a scivolare fuori?", titolo: "Tenda in discesa" },
    { id: "bos-c02", q: "Chi di noi, nel bosco, cercherebbe il segnale arrampicandosi su un albero col telefono in alto?", titolo: "Antenna umana" },
    { id: "bos-c03", q: "Chi di noi abbraccerebbe una quercia di trecento anni e ci parlerebbe come a un nonno?", titolo: "Nipote della quercia" },
    { id: "bos-c04", q: "Chi di noi brucerebbe tutti i marshmallow sul fuoco e direbbe che li voleva proprio così?", titolo: "Marshmallow carbonizzato" },
    { id: "bos-c05", q: "Chi di noi darebbe un nome a ogni scoiattolo del bosco entro la prima ora?", titolo: "Anagrafe degli scoiattoli" },
    { id: "bos-c06", q: "Chi di noi raccoglierebbe un cestino di funghi e poi li butterebbe tutti «per sicurezza»?", titolo: "Funghi? Per sicurezza no" },
    { id: "bos-c07", q: "Chi di noi metterebbe la sveglia all'alba per vedere il sole sorgere… e la spegnerebbe senza aprire gli occhi?", titolo: "Alba vista a occhi chiusi" },
    { id: "bos-c08", q: "Chi di noi presterebbe il sacco a pelo a chi ha freddo e dormirebbe dentro la giacca?", titolo: "Cuore di sacco a pelo" },
    { id: "bos-c09", q: "Chi di noi, se un cervo entrasse nell'accampamento, proverebbe subito a farci un selfie?", titolo: "Selfie col cervo" },
    { id: "bos-c10", q: "Chi di noi finirebbe in un branco di lupi e dopo una settimana ululerebbe meglio di loro?", titolo: "Capobranco onorario" },
    { id: "bos-c11", q: "Chi di noi imiterebbe il verso di ogni uccello del bosco… sbagliandoli tutti con sicurezza?", titolo: "Cinguettio sbagliato" },
    { id: "bos-c12", q: "Chi di noi, dopo una notte in tenda, giurerebbe «mai più» e il mese dopo comprerebbe tutta l'attrezzatura?", titolo: "Mai più (fino a giugno)" },
    { id: "bos-c13", q: "Chi di noi laverebbe i piatti nel ruscello e guarderebbe la pentola andarsene con la corrente?", titolo: "Pentola alla deriva" },
    { id: "bos-c14", q: "Chi di noi porterebbe la moka in campeggio e sveglierebbe tutti alle sei col profumo del caffè?", titolo: "Moka del bosco" }
  ]
});

/* ---------------------------------------------------------
   🚆 SUL TRENO NOTTE
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "treno", cod: "tre", nome: "Sul treno notte", emoji: "🚆",
  adesivi: "🛏️🧳🥪🎧😴🧦📚🕶️🪟🎫☕🧸",
  entrata: [
    "Treno notte delle 23:40. Ritardo previsto: tanto. In cuccetta: {P}.",
    "Sei persone, quattro valigie, un finestrino bloccato. E poi c'è {P}.",
    "Prossima fermata: chissà. Intanto, sotto torchio, c'è {P}."
  ],
  immagini: [
    { id: "tre-i01", q: "Chi è il vicino di cuccetta che tocca a {P}?", carte: [
      { chi: "nonno", faccia: "felice", t: "Racconta la guerra… di condominio" },
      { chi: "cantante", faccia: "estasi", t: "Fa i vocalizzi alle 6" },
      { chi: "impiegato", faccia: "finto", piu: { mano: "telefono" }, t: "Al telefono col capo fino all'una" },
      { chi: "bimbo", faccia: "linguaccia", t: "Su e giù per la scaletta, a ciclo" }
    ] },
    { id: "tre-i02", q: "Chi è il controllore del treno notte di {P}?", carte: [
      { chi: "controllore", faccia: "sonno", t: "Ogni ora ti sveglia: «Biglietto?»" },
      { chi: "controllore", faccia: "felice", piu: { mano: "microfono" }, t: "Annuncia le fermate cantando" },
      { chi: "controllore", f: "d", faccia: "arrabbiato", t: "Multa anche chi respira forte" },
      { chi: "controllore", faccia: "pensieroso", t: "Si siede e ti racconta i suoi guai" }
    ] },
    { id: "tre-i03", q: "Chi sale a mezzanotte e si siede proprio davanti a {P}?", carte: [
      { chi: "mago", faccia: "furbo", t: "Ti fa sparire il panino. Davvero." },
      { chi: "nonna", faccia: "felice", t: "Apre una teglia di lasagne. Calda" },
      { chi: "turista", faccia: "sorpreso", t: "Ha la cartina di un altro treno" },
      { chi: "rockstar", faccia: "esulta", t: "Accorda la chitarra senza sosta" }
    ] },
    { id: "tre-i04", q: "Chi è il passeggero misterioso della cabina 6, che {P} sospetta da tutta la notte?", carte: [
      { chi: "elegante", faccia: "furbo", piu: { occhiali: "monocolo" }, t: "Monocolo, valigetta, zero parole" },
      { chi: "nonna", faccia: "finto", t: "Fa la maglia, ma guarda tutti" },
      { chi: "cuoco", faccia: "indifferente", t: "Gira col mestolo. Non si sa perché" },
      { chi: "capo", faccia: "pensieroso", piu: { occhiali: "sole" }, t: "Occhiali da sole alle due di notte" }
    ] },
    { id: "tre-i05", q: "Chi passa col carrello degli snack davanti a {P}?", carte: [
      { chi: "cameriere", faccia: "furbo", t: "Fa i prezzi a occhio" },
      { chi: "cameriere", f: "d", faccia: "sonno", t: "Passa alle quattro. Apposta." },
      { chi: "cuoco", faccia: "estasi", t: "Ti fa la carbonara al volo" },
      { chi: "nonno", faccia: "felice", t: "Ha solo caramelle alla menta" }
    ] },
    { id: "tre-i06", q: "Chi è la persona famosa in incognito nella cabina di {P}?", carte: [
      { chi: "calciatore", faccia: "triste", piu: { occhiali: "sole" }, t: "Il bomber del rigore sbagliato" },
      { chi: "cantante", f: "d", faccia: "finto", piu: { occhiali: "sole" }, t: "La cantante di Sanremo, struccata" },
      { chi: "presentatore", faccia: "esulta", t: "Quello dei quiz: ti fa domande" },
      { chi: "re", faccia: "indifferente", t: "Un re in incognito. Con la corona" }
    ] },
    { id: "tre-i07", q: "Chi sveglia {P} alle 5 del mattino sul treno notte?", carte: [
      { chi: "animatore", faccia: "esulta", t: "«Ginnastica in corridoio!»" },
      { chi: "corriere", faccia: "indifferente", t: "Un corriere: «Pacco per lei»" },
      { chi: "vicino", faccia: "arrabbiato", t: "Il vicino: cerca le sue pantofole" },
      { chi: "bimbo", faccia: "felice", t: "Il bimbo di sopra: «Giochiamo?»" }
    ] },
    { id: "tre-i08", q: "Chi accompagna {P} alla stazione, prima del treno notte?", carte: [
      { chi: "mamma", faccia: "triste", t: "Piange: «Parti per la Luna?»" },
      { chi: "nonna", faccia: "felice", piu: { mano: "pizza" }, t: "Passa panini dal finestrino" },
      { chi: "papa", faccia: "indifferente", t: "Pensa già al parcheggio" },
      { chi: "cugino", faccia: "furbo", piu: { mano: "telefono" }, t: "Fa il video: «Addio per sempre!»" }
    ] },
    { id: "tre-i09", q: "Il treno arriva all'alba. Chi aspetta {P} sul binario?", carte: [
      { chi: "zia", faccia: "estasi", t: "La zia, col cartello col tuo nome" },
      { chi: "nonno", faccia: "sonno", t: "Il nonno: è lì dalle quattro" },
      { chi: "autista", faccia: "finto", t: "Un autista col nome di un altro" },
      { e: "🤷🚉", t: "Nessuno: hanno sbagliato giorno" }
    ] },
    { id: "tre-i10", q: "Il vicino di cuccetta si toglie le scarpe: profumo in tutto il vagone. Cosa fa {P}?", carte: [
      { e: "🪟❄️", t: "Apre il finestrino, anche se gela" },
      { e: "🙂💬", t: "Glielo dice, con un sorriso" },
      { e: "🌸💦", t: "Si profuma il cuscino" },
      { e: "🚶🌙", t: "Va a dormire in corridoio" }
    ] },
    { id: "tre-i11", q: "Sale un signore con lo stesso biglietto di {P}: stessa cuccetta. Cosa fa {P}?", carte: [
      { e: "🙏", t: "Gliela lascia, pur di non litigare" },
      { e: "🎫📣", t: "Chiama il controllore e resta lì" },
      { e: "😴🛏️", t: "Dorme: chi prima arriva…" },
      { e: "✂️🌙", t: "Propone metà notte a testa" }
    ] },
    { id: "tre-i12", q: "Sono le sei e il treno di {P} ha quattro ore di ritardo. Cosa fa?", carte: [
      { e: "📝", t: "Scrive un reclamo di due pagine" },
      { e: "😴😊", t: "È felice: più tempo per dormire" },
      { e: "😤📣", t: "Si lamenta con tutto il vagone" },
      { e: "🍿🤝", t: "Apre gli snack coi vicini" }
    ] },
    { id: "tre-i13", q: "A {P} tocca la cuccetta più alta, a un palmo dal soffitto. Cosa fa?", carte: [
      { e: "🛏️⬆️", t: "Sale e non scende fino all'arrivo" },
      { e: "🥺", t: "Chiede il cambio col sorriso" },
      { e: "💺", t: "Dorme sul sedile del corridoio" },
      { e: "🤕", t: "Ci sbatte la testa tre volte" }
    ] },
    { id: "tre-i14", q: "Un signore chiede a {P} di tenergli d'occhio il cane fino a Firenze. Com'è andata?", carte: [
      { e: "🐶🛏️", t: "Il cane dorme nella sua cuccetta" },
      { e: "🐶🥪", t: "Si è mangiato il suo panino" },
      { e: "🐶❤️", t: "Ora non vuole più ridarlo" },
      { e: "🐶🏃", t: "Inseguito per tre vagoni" }
    ] },
    { id: "tre-i15", q: "Nella cabina di {P} uno sconosciuto russa come una moka sul fuoco. Cosa fa {P}?", carte: [
      { e: "😗🎵", t: "Fischia finché non smette" },
      { e: "📹", t: "Lo filma, per i posteri" },
      { e: "🗣️", t: "Tossisce finto finché si sveglia" },
      { e: "😴🔇", t: "Tappi, e dorme come un sasso" }
    ] },
    { id: "tre-i16", q: "{P} si sveglia: il treno è fermo alla sua stazione e sta ripartendo! Cosa fa?", carte: [
      { e: "🩳🧳", t: "Salta giù in pigiama, con valigia" },
      { e: "🤷", t: "Resta su e scende alla prossima" },
      { e: "🧳🚀", t: "Lancia la valigia, poi salta" },
      { e: "🆘🪟", t: "Chiede aiuto dal finestrino" }
    ] },
    { id: "tre-i17", q: "In cabina c'è una presa sola per sei telefoni. Cosa fa {P}?", carte: [
      { e: "🔌👑", t: "La occupa da Milano a Lecce" },
      { e: "📋🔌", t: "Fa i turni da venti minuti" },
      { e: "🔋😇", t: "La cede: «Ho il 90%»" },
      { e: "🔌🎒", t: "Tira fuori la ciabatta a 4 prese" }
    ] },
    { id: "tre-i18", q: "Una signora vuole raccontare a {P} la storia di tutta la sua famiglia. Cosa fa {P}?", carte: [
      { e: "👂👪", t: "La ascolta tutta, cugini compresi" },
      { e: "😴", t: "Finge di dormire dopo 5 minuti" },
      { e: "🗣️🗣️", t: "Racconta la sua, ancora più lunga" },
      { e: "📝🌳", t: "Le disegna l'albero genealogico" }
    ] },
    { id: "tre-i19", q: "Il vicino di cuccetta parla nel sonno e dice il nome di {P}. Cosa fa {P}?", carte: [
      { e: "👆", t: "Lo sveglia: «Cosa sognavi?»" },
      { e: "💬", t: "Gli risponde, per farlo parlare" },
      { e: "🏃", t: "Cambia cuccetta di corsa" },
      { e: "👀🌙", t: "Finge di niente. Non dorme più" }
    ] },
    { id: "tre-i20", q: "{P} si sveglia e scopre di essere sul treno sbagliato, diretto in Austria. Cosa fa?", carte: [
      { e: "🔙", t: "Scende alla prima e torna" },
      { e: "🏔️😊", t: "Resta: ormai è un viaggio" },
      { e: "📞😱", t: "Chiama la mamma, nel panico" },
      { e: "🎫🤝", t: "Amicizia col controllore austriaco" }
    ] },
    { id: "tre-i21", q: "Lo sconosciuto in cabina chiede a {P}: «E tu, cosa fai nella vita?». Cosa fa {P}?", carte: [
      { e: "📜", t: "La verità, con tutti i dettagli" },
      { e: "🚀", t: "«Faccio l'astronauta»" },
      { e: "❓❓", t: "Fa domande, così non risponde" },
      { e: "🕵️", t: "«Non posso dirlo» (aria seria)" }
    ] },
    { id: "tre-i22", q: "In cabina uno sconosciuto offre i cannoli a tutti, tranne che a {P}. Cosa fa {P}?", carte: [
      { e: "🙋", t: "Glielo chiede dritto: «E a me?»" },
      { e: "😒", t: "Tiene il muso fino a Bologna" },
      { e: "🍿🙅", t: "Apre i suoi snack. E non li offre" },
      { e: "🌙🤏", t: "Aspetta che dorma e ne prende uno" }
    ] },
    { id: "tre-i23", q: "A metà viaggio {P} si accorge di aver lasciato la valigia sul binario. Cosa fa?", carte: [
      { e: "📞🔟", t: "Chiama la stazione dieci volte" },
      { e: "🛍️", t: "Pazienza: compra tutto all'arrivo" },
      { e: "👕🤝", t: "Si fa prestare i vestiti" },
      { e: "🔙🚉", t: "Scende e torna a prenderla" }
    ] },
    { id: "tre-i24", q: "Alle 3 di notte {P} esce in pigiama e la porta della cabina si chiude da dentro. Cosa fa?", carte: [
      { e: "🚪✊", t: "Bussa fino a svegliare il vagone" },
      { e: "🧳😴", t: "Dorme in corridoio, sulla valigia" },
      { e: "🩴🔍", t: "Cerca il controllore, in ciabatte" },
      { e: "🤝🌙", t: "Fa amicizia con chi è sveglio" }
    ] },
    { id: "tre-i25", q: "Cosa tira fuori {P} dalla borsa per dormire bene in cuccetta?", carte: [
      { e: "🎧🌊", t: "Le cuffie coi rumori del mare" },
      { e: "🍪🌙", t: "I biscotti per la notte" },
      { e: "🩴", t: "Le ciabatte, sempre e ovunque" },
      { e: "🧣🏠", t: "La coperta di casa, enorme" }
    ] },
    { id: "tre-i26", q: "Alle 5 il vicino alza la tendina: l'alba sulle montagne, bellissima. Cosa fa {P}?", carte: [
      { e: "📸🌄", t: "Cento foto, tutte uguali" },
      { e: "🙈😴", t: "Riabbassa la tendina e si gira" },
      { e: "🥺🌄", t: "Si commuove in silenzio" },
      { e: "📞👵", t: "Videochiama la mamma, alle 5" }
    ] },
    { id: "tre-i27", q: "Che faccia fa {P} quando il vicino di cuccetta tira fuori un flauto alle undici di sera?", carte: [
      { lui: "sorpreso", t: "«Ne sai una di Sanremo?»" },
      { lui: "arrabbiato", t: "Pensa a dove nascondere il flauto" },
      { lui: "esulta", t: "Tira fuori due cucchiai e suona" },
      { lui: "sonno", t: "Dorme lo stesso, anzi meglio" }
    ] },
    { id: "tre-i28", q: "Che faccia fa {P} quando il vicino di cuccetta scarta un panino con lo sgombro e l'aglio?", carte: [
      { lui: "disgusto", t: "Sciarpa sul naso fino a Roma" },
      { lui: "innamorato", t: "Ne chiede metà" },
      { lui: "finto", t: "«Che profumino…»" },
      { lui: "sorpreso", t: "Chi porta lo sgombro in treno?" }
    ] },
    { id: "tre-i29", q: "Che faccia fa {P} alle sei di mattina, quando il controllore accende tutte le luci?", carte: [
      { lui: "sonno", t: "Mascherina giù, e riparte" },
      { lui: "arrabbiato", t: "Chiede il nome del controllore" },
      { lui: "felice", t: "Ha già fatto colazione" },
      { lui: "indifferente", t: "Non sente niente: ha i tappi" }
    ] },
    { id: "tre-i30", q: "Che faccia fa {P} quando apre gli occhi e trova la faccia del vicino a dieci centimetri?", carte: [
      { lui: "terrore", t: "Urla e sveglia il vagone" },
      { lui: "sorpreso", t: "«Ci conosciamo?»" },
      { lui: "sonno", t: "Si rigira e lo abbraccia" },
      { lui: "finto", t: "Sorride e richiude piano gli occhi" }
    ] },
    { id: "tre-i31", q: "Che faccia fa {P} quando il controllore dice: «C'è un vagone vuoto, tutto per te»?", carte: [
      { lui: "esulta", t: "Ci organizza una festa da ballo" },
      { lui: "terrore", t: "Un vagone vuoto, di notte? No" },
      { lui: "furbo", t: "Ci porta tutti gli amici" },
      { lui: "sonno", t: "Si stende su sei sedili" }
    ] }
  ],
  scrivi: [
    { id: "tre-s01", q: "Alle 2, dalla cuccetta di sopra, {P} sussurra al vicino di sotto: «___»",
      riserve: ["Sei sveglio? Io sì. Da tre ore", "Hai sentito anche tu quella mucca?", "Se cado, prendimi. Grazie"] },
    { id: "tre-s02", q: "{P} lascia un biglietto al vicino: «Scusa per stanotte, di solito non ___»",
      riserve: ["parlo nel sonno di mia zia", "dormo coi piedi sul cuscino degli altri", "canto Sanremo alle quattro"] },
    { id: "tre-s03", q: "Il capotreno annuncia: «Abbiamo un passeggero speciale: {P}, che ___»",
      riserve: ["ha chiesto la colazione alle 2", "russa più forte del locomotore", "ha adottato tutto il vagone 9"] },
    { id: "tre-s04", q: "Alle tre di notte {P} prende il microfono del capotreno. Cosa annuncia?",
      riserve: ["Chi ha le patatine venga in cabina 4", "Prossima fermata: il letto di casa", "Il signore della 6 russa: svegliatelo"] },
    { id: "tre-s05", q: "Treno fermo in mezzo al nulla, alle 4. {P} scrive al gruppo: «___»",
      riserve: ["Se non torno, il divano è vostro", "Vedo una mucca. Mi guarda. Aiuto", "Fermi da un'ora. Mando foto del buio"] },
    { id: "tre-s06", q: "Il controllore chiede a {P} perché non ha il biglietto. Qual è la scusa?",
      riserve: ["L'ha mangiato un cane, sul binario", "Pensavo fosse il treno della pizza", "Mia nonna è il macchinista"] },
    { id: "tre-s07", q: "Sparisce la crostata della signora di cabina 3. {P} indaga e accusa: «___»",
      riserve: ["Lei, signore! Ha le briciole sui baffi", "Il bambino: è troppo silenzioso", "Io. Scusate, mi guardava"] },
    { id: "tre-s08", q: "{P} scrive una cartolina dal treno notte: «Cari tutti, qui ___»",
      riserve: ["il letto è largo come un grissino", "un signore russa in do maggiore", "il controllore è il mio nuovo amico"] },
    { id: "tre-s09", q: "Alle 3 il treno si ferma e sul binario c'è un uomo con un cartello per {P}. Cosa c'è scritto?",
      riserve: ["Hai lasciato acceso il ferro da stiro", "Mamma dice: mettiti la maglia", "Benvenuti a Napoli! Ah no, scusa"] },
    { id: "tre-s10", q: "{P} e i vicini di cabina fondano una squadra per sopravvivere alla notte. Come si chiama?",
      riserve: ["I Sei Insonni", "Cuccetta Selvaggia", "Gli Amici del Panino Freddo"] },
    { id: "tre-s11", q: "{P} scrive le istruzioni per la cuccetta di sopra: «Per salire, ___»",
      riserve: ["chiedere aiuto e pregare", "togliersi le scarpe e la dignità", "due gradini, poi improvvisare"] },
    { id: "tre-s12", q: "{P} si sveglia in una stazione che non conosce. Cosa chiede al primo che passa?",
      riserve: ["Che anno è?", "C'è un treno per tornare a letto?", "Mi tiene la valigia? Torno a Natale"] },
    { id: "tre-s13", q: "Il diario di viaggio di {P}: «Ore 2:14. ___»",
      riserve: ["Il vicino ha ripreso a russare", "Finiti i biscotti. Inizia la crisi", "Vedo le luci di un paese. Ciao, paese"] },
    { id: "tre-s14", q: "Il vicino chiede: «Le dispiace se apro il finestrino?». Cosa risponde {P}?",
      riserve: ["Solo se apre anche il suo panino", "Prego, adoro il freddo siberiano", "Apra pure, ma poi mi copre lei"] },
    { id: "tre-s15", q: "Sosta di tre minuti: {P} scende al volo e risale con ___",
      riserve: ["un caffè e un cane", "tre pizzette e un nuovo amico", "la valigia di un altro"] },
    { id: "tre-s16", q: "{P} inventa una storia per far dormire il bambino della cabina accanto: «C'era una volta ___»",
      riserve: ["un treno che aveva paura del buio", "un controllore senza biglietto", "una cuccetta che voleva fare il letto"] },
    { id: "tre-s17", q: "All'arrivo, dopo 12 ore di treno, {P} chiama casa. Prima frase?",
      riserve: ["Ho dormito quattro minuti in tutto", "Il signore della 6 vi saluta", "Venite a prendermi: non ho più gambe"] },
    { id: "tre-s18", q: "{P} scrive col dito sul finestrino appannato del treno: «___»",
      riserve: ["Aiuto, il vicino russa in tedesco", "Ciao mucche, ciao paesi, ciao", "Qui ha dormito una leggenda"] }
  ],
  disegna: [
    { id: "tre-d01", q: "Disegna la cuccetta di {P} dopo 12 ore di viaggio", su: "scena", adesivi: "🍫🍌📱🧻" },
    { id: "tre-d02", q: "Disegna cosa vede {P} dal finestrino alle 3 di notte", su: "scena", adesivi: "🌙🐄🏰🛸" },
    { id: "tre-d03", q: "Disegna la cabina di {P} trasformata in discoteca", su: "scena", adesivi: "🪩🎶💡🕺" },
    { id: "tre-d04", q: "Disegna il fortino di {P} in cuccetta, con coperte e valigie", su: "scena", adesivi: "🧳🛡️🚫" },
    { id: "tre-d05", q: "Disegna il treno dei sogni di {P}: cosa c'è in ogni vagone?", su: "scena", adesivi: "🍕🎢🛁🎠" },
    { id: "tre-d06", q: "Disegna la stazione sperduta dove {P} scende per sbaglio alle 4", su: "scena", adesivi: "🐄🌾🪧🦉" },
    { id: "tre-d07", q: "Disegna su {P} l'attrezzatura da gran viaggio: marsupio, cuscino e…", su: "ritratto", adesivi: "🎒🧣🗺️🔦" },
    { id: "tre-d08", q: "Disegna su {P} il look da passeggero misterioso del treno notte", su: "ritratto", adesivi: "🎩🧥🗝️🔍" },
    { id: "tre-d09", q: "Disegna su {P} il pigiama con cui gira in corridoio alle 3 di notte", su: "ritratto", adesivi: "🦄🐻⭐🌙" },
    { id: "tre-d10", q: "Disegna su {P} tutti i souvenir comprati alle soste del treno", su: "ritratto", adesivi: "🧲🎩🧁🗿" },
    { id: "tre-d11", q: "Disegna su {P} la faccia da «ho dormito benissimo» alle 6 di mattina", su: "ritratto", adesivi: "☕😎✨💤" },
    { id: "tre-d12", q: "Disegna su {P} il cappello da capotreno e l'aria di chi comanda", su: "ritratto", adesivi: "🚂🚦🎺" }
  ],
  chi: [
    { id: "tre-c01", q: "Chi di noi, sul treno notte, attaccherebbe bottone con uno sconosciuto e alle due saprebbe tutta la sua vita?", titolo: "Confidenze in cuccetta" },
    { id: "tre-c02", q: "Chi di noi salirebbe con una valigia così grossa da bloccare il corridoio di tutto il vagone?", titolo: "Valigia fuori sagoma" },
    { id: "tre-c03", q: "Chi di noi si porterebbe da casa una cena di quattro portate, con tanto di tovaglia?", titolo: "Vagone ristorante privato" },
    { id: "tre-c04", q: "Chi di noi scenderebbe a prendere un caffè durante la sosta e guarderebbe il treno ripartire, col caffè in mano?", titolo: "Caffè al binario" },
    { id: "tre-c05", q: "Chi di noi si addormenterebbe sulla spalla dello sconosciuto seduto accanto?", titolo: "Cuscino di uno sconosciuto" },
    { id: "tre-c06", q: "Chi di noi filmerebbe per un'ora il buio fuori dal finestrino «perché è poetico»?", titolo: "Regista del buio" },
    { id: "tre-c07", q: "Chi di noi chiederebbe «Siamo arrivati?» a ogni fermata, svegliando tutta la cabina?", titolo: "Siamo arrivati?" },
    { id: "tre-c08", q: "Chi di noi si metterebbe a dormire nella cuccetta di uno sconosciuto, giurando che fosse la sua?", titolo: "Cuccetta abusiva" },
    { id: "tre-c09", q: "Chi di noi, quando il controllore passa di notte, risponderebbe «Presente!» come a scuola?", titolo: "Presente, controllore!" },
    { id: "tre-c10", q: "Chi di noi salirebbe sul treno sbagliato e convincerebbe tutto il vagone a cambiare meta?", titolo: "Capotreno abusivo" },
    { id: "tre-c11", q: "Chi di noi cederebbe la cuccetta di sotto alla signora anziana e salirebbe in cima senza dire niente?", titolo: "Cuccetta del buon cuore" },
    { id: "tre-c12", q: "Chi di noi telefonerebbe a voce altissima alle undici di sera, nella cabina di sei persone?", titolo: "Vivavoce del vagone" },
    { id: "tre-c13", q: "Chi di noi scenderebbe dal treno con il segno del finestrino stampato su mezza faccia?", titolo: "Faccia da finestrino" },
    { id: "tre-c14", q: "Chi di noi farebbe smettere di piangere il bambino della cabina accanto con le facce buffe?", titolo: "Babysitter del vagone" }
  ]
});

/* ---------------------------------------------------------
   🕯️ NELLA VILLA STREGATA
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "villa", cod: "vil", nome: "Nella villa stregata", emoji: "🕯️",
  adesivi: "👻🕯️🕸️🦇🪞🔮🗝️🎃🐈‍⬛🧹📜🪑",
  entrata: [
    "Villa Brividi, mezzanotte. Una porta cigola: è entrat{o|a} {P}.",
    "Le candele tremano, il quadro sorride. Sotto torchio stanotte: {P}.",
    "Il fantasma di casa vi dà il benvenuto. Ha chiesto di conoscere {P}."
  ],
  immagini: [
    { id: "vil-i01", q: "Chi è il maggiordomo che apre la porta della villa a {P}?", carte: [
      { chi: "cameriere", faccia: "indifferente", piu: { mano: "tazza" }, t: "«La aspettavamo dal 1823»" },
      { chi: "nonno", faccia: "sonno", t: "Si addormenta mentre parla" },
      { chi: "cameriere", f: "d", faccia: "furbo", piu: { collo: "papillon" }, t: "Ride quando non dovrebbe" },
      { chi: "mago", faccia: "pensieroso", t: "La tua giacca? Sparita. Per sempre" }
    ] },
    { id: "vil-i02", q: "Chi è il fantasma che infesta la stanza di {P}?", carte: [
      { chi: "re", faccia: "arrabbiato", t: "Un re: rivuole il suo trono" },
      { chi: "cuoco", faccia: "pensieroso", t: "Un cuoco: cerca il sale dal 1800" },
      { chi: "ballerino", faccia: "estasi", t: "Un ballerino: valzer alle tre" },
      { chi: "nonna", faccia: "felice", t: "Una nonna: ti rimbocca le coperte" }
    ] },
    { id: "vil-i03", q: "{P} apre l'armadio per nascondersi. Chi c'è già dentro?", carte: [
      { chi: "cugino", faccia: "furbo", t: "Il cugino, con le patatine" },
      { chi: "bimbo", faccia: "arrabbiato", t: "Un bimbo: «Questo posto è mio»" },
      { chi: "clown", faccia: "felice", t: "Un clown. Da quando? Boh" },
      { chi: "vicino", faccia: "indifferente", t: "Il vicino: veniva a lamentarsi" }
    ] },
    { id: "vil-i04", q: "Chi porta {P} nella villa stregata, per farsi coraggio?", carte: [
      { chi: "nonna", faccia: "arrabbiato", t: "La nonna, con la pantofola in mano" },
      { chi: "supereroe", faccia: "terrore", t: "Un supereroe: urla più di tutti" },
      { chi: "calciatore", faccia: "furbo", t: "Il portiere: para anche i fantasmi" },
      { chi: "papa", faccia: "finto", t: "Il papà: «È solo il vento»" }
    ] },
    { id: "vil-i05", q: "Mezzanotte: il pianoforte del salone suona da solo. Chi c'è seduto, quando arriva {P}?", carte: [
      { chi: "rockstar", faccia: "esulta", t: "Una rockstar del 1700, in tour" },
      { chi: "bimbo", faccia: "pensieroso", t: "Un bimbo che sa solo «Fra Martino»" },
      { chi: "cantante", f: "d", faccia: "estasi", t: "Un soprano che spacca i bicchieri" },
      { e: "🐈‍⬛🎹", t: "Il gatto, a spasso sui tasti" }
    ] },
    { id: "vil-i06", q: "Chi è il cuoco della villa che prepara la cena a {P}?", carte: [
      { chi: "cuoco", faccia: "furbo", t: "Zuppa del giorno: «Non chieda»" },
      { chi: "mamma", faccia: "felice", t: "Polpette anche per i fantasmi" },
      { chi: "vichingo", faccia: "esulta", t: "Cinghiale a colazione" },
      { chi: "mago", faccia: "furbo", t: "Cucina nel calderone: fuma verde" }
    ] },
    { id: "vil-i07", q: "Nella villa c'è un fantasma che si innamora di {P}. Chi è?", carte: [
      { chi: "elegante", faccia: "innamorato", t: "Un conte: poesie sui vetri" },
      { chi: "cowboy", faccia: "furbo", t: "Un cowboy: duello di sguardi" },
      { chi: "pirata", faccia: "felice", t: "Un pirata: ti regala bottoni d'oro" },
      { chi: "cantante", faccia: "triste", t: "Un cantante: ti dedica i lamenti" }
    ] },
    { id: "vil-i08", q: "Alle 3 di notte {P} scende in cucina. Chi trova davanti al frigo?", carte: [
      { chi: "nonno", faccia: "sonno", t: "Un nonno sonnambulo, in vestaglia" },
      { chi: "bimbo", faccia: "linguaccia", t: "Un bimbo col cucchiaio nella crema" },
      { chi: "mago", faccia: "sorpreso", t: "Un mago a caccia di ingredienti" },
      { chi: "vicino", faccia: "finto", t: "Il vicino: «Ho visto la luce»" }
    ] },
    { id: "vil-i09", q: "A cena c'è un posto apparecchiato in più, per «il padrone di casa» che non si vede. Cosa fa {P}?", carte: [
      { e: "🪑🙋", t: "Si siede lì: tanto non c'è" },
      { e: "🗣️👻", t: "Chiacchiera con la sedia vuota" },
      { e: "🍖🤏", t: "Si mangia anche la sua porzione" },
      { e: "🚪🍽️", t: "Chiede la cena in camera" }
    ] },
    { id: "vil-i10", q: "Il gruppo si divide per esplorare la villa. Cosa fa {P}?", carte: [
      { e: "🕵️", t: "Va per conto suo: «Paura? Io?»" },
      { e: "🧲", t: "Si attacca al più coraggioso" },
      { e: "🚪🛡️", t: "Resta all'ingresso, «di guardia»" },
      { e: "🎬☝️", t: "«Mai dividersi, come nei film!»" }
    ] },
    { id: "vil-i11", q: "In soffitta {P} trova una bambola di porcellana che non smette di fissarl{o|a}. Cosa fa?", carte: [
      { e: "🪆↩️", t: "La gira verso il muro" },
      { e: "📸📱", t: "Foto, e la manda a tutti" },
      { e: "🎒🪆", t: "Se la porta a casa come ricordo" },
      { e: "🏃💨", t: "Scappa giù per le scale" }
    ] },
    { id: "vil-i12", q: "Nella villa salta la luce. Cosa fa {P}?", carte: [
      { e: "🔦👉", t: "Torcia del telefono, e guida tutti" },
      { e: "😱", t: "Urla e non smette più" },
      { e: "👻😈", t: "Fa «Buuu!» agli altri, al buio" },
      { e: "🤝", t: "Si aggrappa al primo braccio" }
    ] },
    { id: "vil-i13", q: "Il maggiordomo offre a {P} una tisana «speciale della casa». Cosa fa {P}?", carte: [
      { e: "🍵⚡", t: "La beve tutta d'un fiato" },
      { e: "🍵👉", t: "La fa assaggiare prima a un amico" },
      { e: "🪴", t: "La versa nel vaso della pianta" },
      { e: "🍪❓", t: "Chiede se c'è anche un biscotto" }
    ] },
    { id: "vil-i14", q: "Per scommessa, il gruppo sfida {P} a dormire nella stanza maledetta. Com'è andata?", carte: [
      { e: "😴😎", t: "Accetta e dorme benissimo" },
      { e: "🕑🏃", t: "Accetta. Alle 2 torna dagli altri" },
      { e: "🃏", t: "Rilancia con un'altra scommessa" },
      { e: "🧸🔦", t: "Accetta, con 3 torce e il peluche" }
    ] },
    { id: "vil-i15", q: "Al risveglio {P} trova i suoi vestiti piegati alla perfezione. Nessuno l'ha fatto. Cosa fa?", carte: [
      { e: "😍👕", t: "Chiede al fantasma di restare" },
      { e: "🧳💨", t: "Valigia chiusa: si parte ora" },
      { e: "🕵️☕", t: "Interroga tutti a colazione" },
      { e: "👕🌪️", t: "Li rimette in disordine: dispetto" }
    ] },
    { id: "vil-i16", q: "Un temporale chiude tutti nella villa fino al mattino. Cosa fa {P}?", carte: [
      { e: "🗺️", t: "Esplora tutte le stanze" },
      { e: "🍰🔓", t: "Fa razzia in cucina" },
      { e: "🃏🕯️", t: "Carte a lume di candela" },
      { e: "⚡🔢", t: "Non dorme e conta i tuoni" }
    ] },
    { id: "vil-i17", q: "In un armadio {P} trova un abito da ballo di cent'anni fa. Cosa fa?", carte: [
      { e: "👗💃", t: "Se lo prova e scende a sfilare" },
      { e: "🚪💥", t: "Richiude l'armadio di colpo" },
      { e: "🙈👻", t: "Ci si nasconde, per fare «Bu!»" },
      { e: "💍🔍", t: "Fruga nelle tasche: tesori?" }
    ] },
    { id: "vil-i18", q: "Il fantasma compare davanti a {P} e fa: «Bu». Cosa fa {P}?", carte: [
      { e: "📢", t: "Risponde «Bu!» più forte" },
      { e: "📸⚡", t: "Gli fa una foto col flash" },
      { e: "🏃💨", t: "Scappa e lascia lì gli amici" },
      { e: "🥱", t: "«Tutto qui?»" }
    ] },
    { id: "vil-i19", q: "Per vendicarsi della paura presa, {P} fa uno scherzo agli amici. Com'è andata?", carte: [
      { e: "🚪⏳", t: "Tre ore nell'armadio, ad aspettare" },
      { e: "👻🛏️", t: "Lenzuolo in testa, in corridoio" },
      { e: "🧵🚪", t: "Porte che cigolano col filo" },
      { e: "😱🪞", t: "Si spaventa del suo stesso scherzo" }
    ] },
    { id: "vil-i20", q: "Nella villa c'è una stanza chiusa a chiave, e la chiave ce l'ha {P}. Cosa fa?", carte: [
      { e: "🔓", t: "Apre subito, davanti a tutti" },
      { e: "🌙🤫", t: "Apre di nascosto, di notte" },
      { e: "🗝️🕳️", t: "Butta la chiave nel pozzo" },
      { e: "🔨🗝️", t: "Mette all'asta la chiave" }
    ] },
    { id: "vil-i21", q: "Il gruppo scappa dalla villa, ma {P} esce dopo tutti. Perché?", carte: [
      { e: "🚪🔒", t: "Voleva chiudere bene la porta" },
      { e: "🎥", t: "Stava ancora girando il video" },
      { e: "🧥", t: "Cercava la giacca preferita" },
      { e: "👋👻", t: "Salutava il fantasma" }
    ] },
    { id: "vil-i22", q: "Con cosa si difende {P} dal fantasma?", carte: [
      { e: "🧄", t: "L'aglio della nonna, una treccia" },
      { e: "🍳", t: "La padella buona della mamma" },
      { e: "🧹", t: "La scopa, come una spada" },
      { e: "🧂", t: "Il sale grosso, a manciate" }
    ] },
    { id: "vil-i23", q: "Cosa si porta via {P} dalla villa come ricordo?", carte: [
      { e: "🕯️", t: "Un candelabro, «in prestito»" },
      { e: "🖼️👀", t: "Il quadro con gli occhi mobili" },
      { e: "📖✨", t: "Il libro di magia (non si sa mai)" },
      { e: "🗝️", t: "Una chiave di chissà cosa" }
    ] },
    { id: "vil-i24", q: "Se {P} fosse il fantasma della villa, cosa farebbe tutta la notte?", carte: [
      { e: "⛓️😩", t: "Catene e lamenti, da manuale" },
      { e: "🔔🏃", t: "Suona il campanello e scappa" },
      { e: "🍪", t: "Ruba i biscotti dalla dispensa" },
      { e: "🧦", t: "Nasconde un calzino per paio" }
    ] },
    { id: "vil-i25", q: "Che faccia fa {P} quando il gruppo decide: «La porta della soffitta la apre {P}»?", carte: [
      { lui: "terrore", t: "Tiene la torcia. Da giù" },
      { lui: "finto", t: "«Certo!» Si allaccia le scarpe…" },
      { lui: "esulta", t: "Ci corre: e se c'è un tesoro?" },
      { lui: "pensieroso", t: "Studia già la via di fuga" }
    ] },
    { id: "vil-i26", q: "Che faccia fa {P} quando scopre che il fantasma che ha fatto urlare tutti era il gatto di casa?", carte: [
      { lui: "imbarazzo", t: "«Urlavo per il gatto, poverino»" },
      { lui: "felice", t: "Coccola il gatto: tutto passato" },
      { lui: "arrabbiato", t: "Col gatto non ci parla più" },
      { lui: "indifferente", t: "«Io lo sapevo» (no)" }
    ] },
    { id: "vil-i27", q: "Che faccia fa {P} quando, nella foto di gruppo scattata nella villa, c'è una persona in più?", carte: [
      { lui: "terrore", t: "Cancella la foto. Due volte" },
      { lui: "sorpreso", t: "Conta: siamo in sei o sette?" },
      { lui: "pensieroso", t: "Zooma: ha un bel maglione" },
      { lui: "linguaccia", t: "La pubblica subito" }
    ] },
    { id: "vil-i28", q: "Che faccia fa {P} quando il maggiordomo dice: «La sua stanza è quella col lettino che dondola da solo»?", carte: [
      { lui: "terrore", t: "Dorme in macchina. Deciso" },
      { lui: "furbo", t: "Ci manda a dormire il cugino" },
      { lui: "sonno", t: "Perfetto: si addormenta prima" },
      { lui: "estasi", t: "Ha sempre sognato un letto così" }
    ] }
  ],
  scrivi: [
    { id: "vil-s01", q: "Sulla porta della villa c'è un biglietto del fantasma per {P}: «___»",
      riserve: ["Pulisciti le scarpe, ho appena lavato", "Sei in ritardo di duecento anni", "Le ragnatele sono mie, non toccare"] },
    { id: "vil-s02", q: "Il fantasma vuole il letto di {P}. {P} prova a trattare: «___»",
      riserve: ["Facciamo a turno: tu fino alle tre", "Ti lascio il cuscino, non la coperta", "Va bene, ma niente catene dopo le 10"] },
    { id: "vil-s03", q: "Alla seduta spiritica il bicchiere si muove e scrive un messaggio per {P}. Cosa dice?",
      riserve: ["Restituisci le mie pantofole", "Sei tu che hai finito i biscotti?", "Chiudi la finestra, c'è corrente"] },
    { id: "vil-s04", q: "Sotto il ritratto maledetto la targhetta dice: «{P}, ___»",
      riserve: ["cercava il bagno. Da tre secoli", "voleva solo fare una foto", "ha chiesto il Wi-Fi nel 1823"] },
    { id: "vil-s05", q: "{P} chiama il numero «Fantasmi in casa? Chiamaci». Cosa dice al telefono?",
      riserve: ["Ce n'è uno che mi ha finito il latte", "Venite, ma portate le pizze", "Non è urgente: è simpatico"] },
    { id: "vil-s06", q: "{P} mette in vendita la villa stregata. L'annuncio dice: «___»",
      riserve: ["Vendo villa con coinquilino gratis", "Ottima acustica: si sentono le urla", "Risparmio: le luci si accendono da sole"] },
    { id: "vil-s07", q: "Il fantasma si lamenta di {P} con gli altri fantasmi: «Quest{o|a} qui ___»",
      riserve: ["non si spaventa: mi offre il tè", "russa più forte delle mie catene", "mi chiede di stirare le sue camicie"] },
    { id: "vil-s08", q: "{P} trova un passaggio segreto. In fondo c'è una porta con scritto: «___»",
      riserve: ["Bagno. Finalmente.", "Solo per chi ha i biscotti", "Uscita. Ah no, scherzo"] },
    { id: "vil-s09", q: "Uscit{o|a} dalla villa, {P} scrive al gruppo: «Ragazzi, ve lo giuro, ___»",
      riserve: ["il quadro mi ha fatto l'occhiolino", "il fantasma aveva le ciabatte", "ho sentito ridere il lampadario"] },
    { id: "vil-s10", q: "{P} interroga lo specchio magico della villa. Lo specchio risponde: «___»",
      riserve: ["Non ora: sto riflettendo", "Chiedimelo dopo il caffè", "Prima pulisci me, poi ne parliamo"] },
    { id: "vil-s11", q: "{P} sente un rumore e grida nel buio: «___»",
      riserve: ["Se sei un ladro, qui c'è poco", "Se sei un fantasma, chiama prima", "Ho una ciabatta e so usarla"] },
    { id: "vil-s12", q: "{P} scrive la guida turistica della villa: «Da non perdere: ___»",
      riserve: ["la soffitta, se avete la torcia", "il fantasma delle 3, puntualissimo", "la cucina: i biscotti sono ancora buoni"] },
    { id: "vil-s13", q: "Prima di sparire, il fantasma regala a {P} una cosa sola. Cosa?",
      riserve: ["Una catena, usata poco", "Il telecomando del 1950", "Un lenzuolo lavato a 90 gradi"] },
    { id: "vil-s14", q: "{P} risponde al citofono della villa. Una voce dice: «___»",
      riserve: ["Sono io. Apri. Sono dentro", "Pizza per il signor Fantasma", "Ha prenotato per trecento anni?"] },
    { id: "vil-s15", q: "Il gatto nero della villa segue {P} ovunque. Cosa gli sussurra {P}?",
      riserve: ["Se vedi qualcosa, scappa per primo", "Tu sai dove sono i biscotti, vero?", "Non sono io il fantasma, giuro"] },
    { id: "vil-s16", q: "{P} fa la lista per la prossima notte nella villa. Al primo posto: ___",
      riserve: ["una torcia che non si spegne a caso", "un cugino da mandare avanti", "la nonna, che non ha paura di niente"] },
    { id: "vil-s17", q: "Mezzanotte: il pendolo suona tredici colpi. {P} commenta: «___»",
      riserve: ["Questo orologio va avanti", "Tredici? Allora sono in ritardo", "Io qui non ci dormo. Ciao"] },
    { id: "vil-s18", q: "Il fantasma propone uno scambio a {P}: «Tu resti qui e io ___»",
      riserve: ["mi prendo il tuo posto sul divano", "rispondo io ai tuoi messaggi. A tutti", "vado a pranzo da tua mamma"] }
  ],
  disegna: [
    { id: "vil-d01", q: "Disegna su {P} la cornice d'oro e gli occhi che seguono chi passa", su: "ritratto", adesivi: "🖼️👀✨" },
    { id: "vil-d02", q: "Disegna su {P} il fantasma che vive nel quadro: lenzuolo e catene", su: "ritratto", adesivi: "⛓️😴" },
    { id: "vil-d03", q: "Disegna su {P} il look nobile di 300 anni fa: parrucca, colletto e neo", su: "ritratto", adesivi: "🎩🌹📜" },
    { id: "vil-d04", q: "Disegna su {P} le ragnatele, la polvere e il ragno che ci abita da secoli", su: "ritratto", adesivi: "🕷️🐀" },
    { id: "vil-d05", q: "Disegna su {P} denti da vampiro, mantello e ciuffo perfetto", su: "ritratto", adesivi: "🧛🌙🦇" },
    { id: "vil-d06", q: "Disegna su {P} la divisa della servitù: candelabro e sopracciglio alzato", su: "ritratto", adesivi: "🎩🛎️" },
    { id: "vil-d07", q: "Disegna la stanza di {P} nella villa, arredata dal fantasma", su: "scena", adesivi: "🛏️⛓️🕰️🧸" },
    { id: "vil-d08", q: "Disegna la festa dei fantasmi nel salone, con {P} ospite d'onore", su: "scena", adesivi: "🎉🎻🍰🎈" },
    { id: "vil-d09", q: "Disegna la villa dopo che {P} l'ha trasformata in un bed & breakfast", su: "scena", adesivi: "🛎️🥐⭐🌷" },
    { id: "vil-d10", q: "Disegna la trappola per fantasmi costruita da {P}", su: "scena", adesivi: "🧲🪤🍪🧺" },
    { id: "vil-d11", q: "Disegna il nascondiglio di {P} durante la caccia al fantasma", su: "scena", adesivi: "🛋️🧺🪴🔦" },
    { id: "vil-d12", q: "Disegna su {P} i capelli dopo la notte nella villa: dritti dalla paura", su: "ritratto", adesivi: "⚡💫🕷️🌪️" }
  ],
  chi: [
    { id: "vil-c01", q: "Chi di noi scambierebbe un'armatura per un fantasma e la sfiderebbe a duello con l'ombrello?", titolo: "Duello con l'armatura" },
    { id: "vil-c02", q: "Chi di noi proverebbe a fare amicizia col fantasma chiedendogli come si chiama e da dove viene?", titolo: "Tè col fantasma" },
    { id: "vil-c03", q: "Chi di noi, sentendo un rumore in soffitta, manderebbe avanti gli altri «per coprirli alle spalle»?", titolo: "Retroguardia coraggiosa" },
    { id: "vil-c04", q: "Chi di noi si spaventerebbe del proprio riflesso nello specchio impolverato del corridoio?", titolo: "Paura dello specchio" },
    { id: "vil-c05", q: "Chi di noi, nella villa, frugherebbe nei cassetti del fantasma in cerca di gioielli?", titolo: "Ficcanaso dell'aldilà" },
    { id: "vil-c06", q: "Chi di noi giurerebbe che il cigolio era «solo il legno che si assesta», mentre trema come una foglia?", titolo: "Il legno che si assesta" },
    { id: "vil-c07", q: "Chi di noi, per farsi coraggio, canterebbe a squarciagola attraversando il corridoio buio?", titolo: "Coraggio a squarciagola" },
    { id: "vil-c08", q: "Chi di noi passerebbe la notte nella villa a girare un video per i social, con la voce da documentario?", titolo: "Acchiappafantasmi da like" },
    { id: "vil-c09", q: "Chi di noi si offrirebbe di cucinare per tutti nella villa e farebbe una minestra più paurosa dei fantasmi?", titolo: "Minestra da brivido" },
    { id: "vil-c10", q: "Chi di noi, col fantasma alle calcagna, si fermerebbe a metà corridoio a chiedergli scusa?", titolo: "Scusi, signor fantasma" },
    { id: "vil-c11", q: "Chi di noi terrebbe per mano chi ha paura nel buio della villa, senza dirlo mai a nessuno?", titolo: "Mano sicura nel buio" },
    { id: "vil-c12", q: "Chi di noi leggerebbe ad alta voce la formula magica del libro polveroso, «tanto per vedere»?", titolo: "Tanto per vedere" },
    { id: "vil-c13", q: "Chi di noi, dopo la notte nella villa, dormirebbe con la luce accesa per un mese, giurando di non avere paura?", titolo: "Lampadina sempre accesa" },
    { id: "vil-c14", q: "Chi di noi farebbe urlare tutti, girando di notte con la maschera di bellezza in faccia?", titolo: "Il fantasma eri tu" }
  ]
});

/* ---------------------------------------------------------
   🏝️ SU UN'ISOLA DESERTA
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "isola", cod: "iso", nome: "Su un'isola deserta", emoji: "🏝️",
  adesivi: "🌴🥥🪵🔥🐚🦀🐢🍌⛵📜🪁🦜",
  entrata: [
    "Naufragio confermato. Viveri: un cocco. Sotto torchio: {P}.",
    "Sull'isola: mare blu, sabbia bianca, zero pizzerie. Tocca a {P}.",
    "Giorno 1 sull'isola. {P} ha già chiesto dov'è il bar della spiaggia."
  ],
  immagini: [
    { id: "iso-i01", q: "Chi naufraga sull'isola insieme a {P}?", carte: [
      { chi: "cuoco", faccia: "triste", t: "Un cuoco. Senza pentole" },
      { chi: "influencer", faccia: "finto", piu: { mano: "telefono" }, t: "Cerca il Wi-Fi sotto ogni sasso" },
      { chi: "prof", faccia: "pensieroso", piu: { mano: "libro" }, t: "Lezioni di sopravvivenza (lette)" },
      { chi: "nonna", faccia: "felice", t: "Una nonna che ha salvato il ragù" }
    ] },
    { id: "iso-i02", q: "Dopo tre settimane, chi arriva a salvare {P}?", carte: [
      { chi: "capitano", faccia: "sorpreso", t: "Un capitano: si è perso pure lui" },
      { chi: "pescatore", faccia: "indifferente", t: "Un pescatore che passava di lì" },
      { chi: "bagnino", faccia: "arrabbiato", t: "Il bagnino: «Fuori dall'acqua!»" },
      { chi: "mamma", faccia: "arrabbiato", t: "La mamma, in pedalò" }
    ] },
    { id: "iso-i03", q: "Chi abita nella capanna accanto a quella di {P}?", carte: [
      { chi: "pirata", faccia: "sonno", t: "Un pirata in pensione" },
      { chi: "vicino", faccia: "arrabbiato", t: "Il vicino: il fumo gli dà fastidio" },
      { chi: "turista", faccia: "felice", t: "Un turista: crede sia un resort" },
      { chi: "dj", faccia: "esulta", t: "Un dj: ogni sera festa coi granchi" }
    ] },
    { id: "iso-i04", q: "{P} va dall'altra parte dell'isola. Chi incontra?", carte: [
      { chi: "re", faccia: "furbo", t: "Il re dell'isola: vuole l'inchino" },
      { chi: "corriere", faccia: "indifferente", t: "Un corriere: «Firmi qui»" },
      { chi: "scout", faccia: "esulta", t: "Uno scout: è lì per il distintivo" },
      { chi: "vichingo", faccia: "sorpreso", t: "Un vichingo: ha sbagliato mare" }
    ] },
    { id: "iso-i05", q: "Tornat{o|a} a casa, chi intervista {P} sul naufragio?", carte: [
      { chi: "presentatore", faccia: "estasi", t: "Ti fa piangere in prima serata" },
      { chi: "presentatore", f: "d", faccia: "sonno", t: "Ti chiede solo cosa mangiavi" },
      { chi: "cugino", faccia: "furbo", piu: { mano: "telefono" }, t: "Il cugino, in diretta dal telefono" },
      { chi: "mamma", faccia: "arrabbiato", t: "La mamma: «La crema l'avevi?»" }
    ] },
    { id: "iso-i06", q: "Chi sale sulla zattera insieme a {P}?", carte: [
      { chi: "capitano", faccia: "furbo", t: "Comanda, ma non sa remare" },
      { chi: "nonno", faccia: "felice", t: "Rema da solo e canta" },
      { chi: "bimbo", faccia: "esulta", t: "Vuole fare il bagno ogni 5 minuti" },
      { chi: "turista", faccia: "sonno", t: "Dorme col remo in mano" }
    ] },
    { id: "iso-i07", q: "Chi arriva a nuoto sull'isola di {P}, come se niente fosse?", carte: [
      { chi: "clown", faccia: "sorpreso", t: "Un clown: «Dov'è il circo?»" },
      { chi: "mago", faccia: "imbarazzo", t: "Un mago: il trucco è andato male" },
      { chi: "impiegato", faccia: "finto", piu: { collo: "cravatta" }, t: "Un impiegato: «Sono in ferie?»" },
      { chi: "supereroe", faccia: "pensieroso", t: "Un supereroe: ha perso il volo" }
    ] },
    { id: "iso-i08", q: "Una nave da crociera passa davanti all'isola e non si ferma. Chi saluta {P} dal ponte?", carte: [
      { chi: "animatore", faccia: "esulta", t: "L'animatore: fa ballare il ponte" },
      { chi: "capitano", faccia: "felice", t: "Il capitano saluta col cappello" },
      { chi: "cantante", f: "d", faccia: "estasi", piu: { mano: "microfono" }, t: "Una cantante: «Questa è per te!»" },
      { chi: "cameriere", faccia: "furbo", t: "Un cameriere ti mostra il buffet" }
    ] },
    { id: "iso-i09", q: "Chi trova il messaggio nella bottiglia lanciato da {P}?", carte: [
      { chi: "nonna", faccia: "felice", t: "Una nonna: ti manda una ricetta" },
      { chi: "bimbo", faccia: "linguaccia", t: "Un bimbo: ci disegna sopra" },
      { chi: "pescatore", faccia: "indifferente", t: "Un pescatore: lo ributta in mare" },
      { chi: "prof", faccia: "pensieroso", t: "Un prof: ti corregge gli errori" }
    ] },
    { id: "iso-i10", q: "La marea si porta via le ciabatte di {P}, le uniche dell'isola. Cosa fa {P}?", carte: [
      { e: "🏊🩴", t: "Nuota mezz'ora per riprenderle" },
      { e: "🍃👣", t: "Se ne fa un paio con le foglie" },
      { e: "🦶😎", t: "A piedi nudi per sempre, ormai" },
      { e: "🦀👉", t: "Accusa il granchio. In pubblico" }
    ] },
    { id: "iso-i11", q: "Sull'isola c'è un solo albero di banane. Cosa fa {P}?", carte: [
      { e: "🍌➗", t: "Le divide in parti uguali" },
      { e: "🍌🕳️", t: "Ne nasconde metà sotto la sabbia" },
      { e: "🪧🍌", t: "Ci appende un cartello: «Privato»" },
      { e: "🍌😋", t: "Le mangia tutte il primo giorno" }
    ] },
    { id: "iso-i12", q: "Dieci giorni senza un piatto di pasta. Cosa fa {P}?", carte: [
      { e: "🌿🍝", t: "Spaghetti di alghe" },
      { e: "🍕✏️", t: "Disegna una pizza e la guarda" },
      { e: "🐟🥥", t: "Pesce e cocco, e sta benissimo" },
      { e: "😤", t: "Litiga con tutti per tutto" }
    ] },
    { id: "iso-i13", q: "Sulla spiaggia {P} trova una radio rotta. Cosa ne fa?", carte: [
      { e: "🔧📻", t: "Passa giorni a ripararla" },
      { e: "🪑📻", t: "La usa come sgabello" },
      { e: "🎧🎶", t: "Finge che funzioni e fa il dj" },
      { e: "🐟🪤", t: "Ne fa una trappola per pesci" }
    ] },
    { id: "iso-i14", q: "Sull'isola bisogna dividersi i compiti. Cosa prende {P}?", carte: [
      { e: "📣👑", t: "Il comando: e basta" },
      { e: "🎣", t: "La pesca, lontano da tutti" },
      { e: "🍳", t: "La cucina: così assaggia tutto" },
      { e: "🪵☕", t: "La legna, con molte pause" }
    ] },
    { id: "iso-i15", q: "Dopo una settimana sull'isola, con chi comincia a parlare {P}?", carte: [
      { e: "🥥✏️", t: "Un cocco con la faccia disegnata" },
      { e: "🦀🦀", t: "I granchi, ognuno col suo nome" },
      { e: "🗣️", t: "Ad alta voce, e si dà ragione" },
      { e: "🌊🌅", t: "Il mare, ogni sera al tramonto" }
    ] },
    { id: "iso-i16", q: "Una tartaruga gigante passa sulla spiaggia. Cosa fa {P}?", carte: [
      { e: "🐢👣", t: "La segue per vedere dove va" },
      { e: "🐢👋", t: "La chiama Gina e la saluta sempre" },
      { e: "🐢📜", t: "Le affida un messaggio da portare" },
      { e: "🐢🏁", t: "La sfida a una gara. E perde" }
    ] },
    { id: "iso-i17", q: "Il mare porta a riva una cassa piena di vestiti eleganti. Cosa fa {P}?", carte: [
      { e: "🤵🥥", t: "Abito da sera per la cena al cocco" },
      { e: "⛺👗", t: "Ci fa una tenda" },
      { e: "🧥🧥", t: "Se li mette tutti insieme" },
      { e: "💃🏖️", t: "Sfilata sulla spiaggia" }
    ] },
    { id: "iso-i18", q: "Sull'isola si trovano tre uova gigantesche. Cosa fa {P}?", carte: [
      { e: "🍳", t: "Frittata per tutti" },
      { e: "🥚🔥", t: "Le cova, per vedere cosa nasce" },
      { e: "🦖😰", t: "Si allontana: la mamma sarà enorme" },
      { e: "🥚🖌️", t: "Ci disegna sopra le nostre facce" }
    ] },
    { id: "iso-i19", q: "Dopo un mese si scopre che dietro la collina c'è un resort a cinque stelle. Cosa fa {P}?", carte: [
      { e: "🥐🏨", t: "Ci va subito a fare colazione" },
      { e: "🤫🏨", t: "Ci va di nascosto, senza dirlo" },
      { e: "🙅🏝️", t: "Non ci va: ormai è un'avventura" },
      { e: "😡📅", t: "Si arrabbia per il mese perso" }
    ] },
    { id: "iso-i20", q: "Arriva la nave dei soccorsi, ma c'è posto solo per metà del gruppo. Cosa fa {P}?", carte: [
      { e: "🚢👋", t: "Sale subito: «Vi mando aiuto»" },
      { e: "🙏", t: "Resta e fa salire gli altri" },
      { e: "🎲", t: "Propone di tirare a sorte" },
      { e: "🤝", t: "Sale solo col migliore amico" }
    ] },
    { id: "iso-i21", q: "Arriva un altro naufrago e si costruisce una capanna più bella di quella di {P}. Cosa fa {P}?", carte: [
      { e: "🛖📏", t: "Allunga la sua di un metro. Subito" },
      { e: "🍌🤝", t: "Lavora per lui, a paga di banane" },
      { e: "😤🪧", t: "Cartello: «Capanna abusiva»" },
      { e: "🛖🏃", t: "Ci si trasferisce: «Siamo soci»" }
    ] },
    { id: "iso-i22", q: "Dopo un anno sull'isola, {P} torna a casa. Qual è la prima cosa che fa?", carte: [
      { e: "🍕", t: "Una pizza intera, subito" },
      { e: "📱🔔", t: "Accende il telefono: 4.000 avvisi" },
      { e: "🤗", t: "Corre ad abbracciare la mamma" },
      { e: "🚿⏳", t: "Doccia di tre ore" }
    ] },
    { id: "iso-i23", q: "Cosa trova {P} sulla spiaggia, e lo tratta come un tesoro?", carte: [
      { e: "🧴", t: "Un flacone di shampoo, mezzo pieno" },
      { e: "🐚", t: "Una conchiglia rosa: «È mia»" },
      { e: "🕶️", t: "Occhiali da sole senza una lente" },
      { e: "🦆", t: "Una paperella di gomma" }
    ] },
    { id: "iso-i24", q: "Che bandiera pianta {P} sulla cima dell'isola?", carte: [
      { e: "🍕🚩", t: "Una pizza su un palo" },
      { e: "🧦", t: "Un calzino, il più pulito" },
      { e: "🏳️", t: "Bandiera bianca, subito" },
      { e: "🩲", t: "Le mutande: le sue migliori" }
    ] },
    { id: "iso-i25", q: "Cosa usa {P} come cuscino sull'isola?", carte: [
      { e: "🥥", t: "Una noce di cocco, durissima" },
      { e: "🦺", t: "Il giubbotto salvagente" },
      { e: "👟", t: "Le scarpe, calzini compresi" },
      { e: "🐢", t: "Una tartaruga paziente" }
    ] },
    { id: "iso-i26", q: "Dal naufragio, cosa salva {P} per primo?", carte: [
      { e: "🔌", t: "Il caricabatterie (senza presa)" },
      { e: "🧴☀️", t: "La crema solare protezione 50" },
      { e: "🍝", t: "Un pacco di spaghetti" },
      { e: "🧸", t: "Il peluche di sempre" }
    ] },
    { id: "iso-i27", q: "Che faccia fa {P} quando apre finalmente il cocco, dopo tre ore, e dentro è vuoto?", carte: [
      { lui: "arrabbiato", t: "Lo lancia in mare. Poi lo rivuole" },
      { lui: "triste", t: "Lo abbraccia lo stesso" },
      { lui: "indifferente", t: "Ne apre un altro: ha tempo" },
      { lui: "sorpreso", t: "Chiama tutti a vedere il mistero" }
    ] },
    { id: "iso-i28", q: "Che faccia fa {P} quando si sveglia con un granchio attaccato all'alluce?", carte: [
      { lui: "terrore", t: "Urla: lo sentono in Sardegna" },
      { lui: "arrabbiato", t: "Dichiara guerra ai granchi" },
      { lui: "sonno", t: "Si rigira, granchio compreso" },
      { lui: "sorpreso", t: "«Buongiorno anche a te»" }
    ] },
    { id: "iso-i29", q: "Che faccia fa {P} quando una scimmia scappa con i suoi occhiali da sole?", carte: [
      { lui: "arrabbiato", t: "La insegue su per la palma" },
      { lui: "linguaccia", t: "Le fa le smorfie dal basso" },
      { lui: "triste", t: "Strizza gli occhi per sempre" },
      { lui: "furbo", t: "Le offre una banana: scambio" }
    ] },
    { id: "iso-i30", q: "Che faccia fa {P} quando piove per la prima volta sulla capanna appena finita?", carte: [
      { lui: "triste", t: "Saluta la capanna che se ne va" },
      { lui: "arrabbiato", t: "Litiga con la nuvola" },
      { lui: "esulta", t: "Doccia gratis, finalmente" },
      { lui: "indifferente", t: "Sotto una foglia, aspetta e basta" }
    ] }
  ],
  scrivi: [
    { id: "iso-s01", q: "Dopo un mese sull'isola, {P} dà un consiglio ai futuri naufraghi: «___»",
      riserve: ["Il cocco non si apre coi denti", "Fate subito amicizia coi granchi", "Portatevi un divano"] },
    { id: "iso-s02", q: "Messaggio di {P} nella bottiglia: «Mamma, sto bene. L'unica cosa che mi manca è ___»",
      riserve: ["il tuo ragù della domenica", "il divano con la mia forma", "litigare con mio fratello"] },
    { id: "iso-s03", q: "{P} spiega a tutti perché la barca è affondata: «___»",
      riserve: ["Volevo solo guidare un pochino", "Mi stavo facendo un selfie", "Ho provato un'inversione a U"] },
    { id: "iso-s04", q: "{P} usa un cocco come telefono e chiama aiuto. Cosa dice?",
      riserve: ["Pronto? Mi passi la mamma?", "Una pizza. Indirizzo: boh, un'isola", "Aspetto in linea. Tanto ho tempo"] },
    { id: "iso-s05", q: "Il pappagallo dell'isola ripete tutto il giorno una frase di {P}. Quale?",
      riserve: ["Chi ha mangiato l'ultima banana?", "Cinque minuti e mi alzo", "Io qui sono il capo, eh"] },
    { id: "iso-s06", q: "{P} disegna la mappa dell'isola e le dà un nome. Quale?",
      riserve: ["Isola del Pisolino Eterno", "Cocco Beach Resort (zero stelle)", "Isola Dove Nessuno Mi Chiama"] },
    { id: "iso-s07", q: "{P} apre il «ristorante» dell'isola. Piatto del giorno: ___",
      riserve: ["granchio offeso con contorno di alga", "cocco al cocco, su letto di cocco", "banana flambé (per sbaglio)"] },
    { id: "iso-s08", q: "{P} prova ad accendere il fuoco da tre ore. Al bastoncino dice: «___»",
      riserve: ["Ti prego, fallo per la mamma", "Se non ti accendi, ceno crudo", "Sei l'ultimo legnetto dell'isola, sai?"] },
    { id: "iso-s09", q: "A {P} arriva una bottiglia da un altro naufrago. Dentro c'è scritto: «___»",
      riserve: ["Hai un apriscatole? Io ho i fagioli", "Anche tu senza Wi-Fi? Scrivimi", "Sono sull'isola di fronte. Ciao!"] },
    { id: "iso-s10", q: "{P} vede una nave che si avvicina e prepara il discorso per i soccorritori: «___»",
      riserve: ["Finalmente! Avete del parmigiano?", "Non siete voi. Aspettavo la pizza", "Un attimo, finisco l'abbronzatura"] },
    { id: "iso-s11", q: "{P} apre un negozio di souvenir sull'isola. Il più venduto è ___",
      riserve: ["un cocco con scritto «Ciao»", "sabbia in bottiglia, tappo di alga", "la foto col granchio, posa a scelta"] },
    { id: "iso-s12", q: "Molti anni dopo, {P} racconta il naufragio ai nipoti, esagerando un po': «___»",
      riserve: ["Lottavo coi granchi ogni giorno", "Il mare era alto 30 metri. Forse 2", "Ho sconfitto uno squalo. Era un tonno"] },
    { id: "iso-s13", q: "Arriva un turista in canoa e chiede a {P} la strada per l'hotel. {P} risponde: «___»",
      riserve: ["Hotel? Io vivo qui da sei mesi", "Mi porti con te e ti accompagno", "Sempre dritto, a sinistra al cocco"] },
    { id: "iso-s14", q: "Per entrare nella capanna di {P} serve la parola d'ordine. Qual è?",
      riserve: ["Il cocco più bello è il tuo", "Granchio amico, granchio buono", "Piedi lavati, giuro"] },
    { id: "iso-s15", q: "Il giorno che se ne va, {P} lascia un biglietto all'isola: «___»",
      riserve: ["Grazie per la sabbia ovunque", "Scusa per la palma: era lì", "Ti scriverei, ma non ho il francobollo"] },
    { id: "iso-s16", q: "Ogni giorno un gabbiano ruba il pesce a {P}. Oggi {P} gli urla: «___»",
      riserve: ["Almeno lasciami la lisca!", "Ti conosco: sei quello di ieri", "Facciamo società: tu peschi, io cucino"] },
    { id: "iso-s17", q: "{P} ordina al cameriere immaginario dell'isola: «Per me ___»",
      riserve: ["un cocco, ma senza cocco", "il solito: niente, ben cotto", "quello che ha preso il granchio"] }
  ],
  disegna: [
    { id: "iso-d01", q: "Disegna la capanna di {P} dopo un mese sull'isola", su: "scena", adesivi: "🛖🪑🛁🍍" },
    { id: "iso-d02", q: "Disegna la trappola di {P} per pescare senza bagnarsi", su: "scena", adesivi: "🎣🐟🪝🪵🧺" },
    { id: "iso-d03", q: "Disegna gli amici che {P} si fa sull'isola: granchi, tartarughe e…", su: "scena", adesivi: "🐒🐬🐙🦩" },
    { id: "iso-d04", q: "Disegna il tesoro che {P} trova scavando sotto la palma", su: "scena", adesivi: "👑🪙🧦🍝" },
    { id: "iso-d05", q: "Disegna la nave dei sogni che arriva a salvare {P}", su: "scena", adesivi: "🚢🍕🎉🛟" },
    { id: "iso-d06", q: "Disegna la piscina che {P} scava in riva al mare", su: "scena", adesivi: "🏊🪣🛟🌊" },
    { id: "iso-d07", q: "Disegna su {P} la protezione contro i cocchi che cadono dalle palme", su: "ritratto", adesivi: "🥥⛑️🪵🍃" },
    { id: "iso-d08", q: "Disegna su {P} il pappagallo che vive sulla sua testa, col nido", su: "ritratto", adesivi: "🪺🪶🍌" },
    { id: "iso-d09", q: "Disegna su {P} occhiali, orologio e borsa fatti a mano sull'isola", su: "ritratto", adesivi: "🌺🪢🍂" },
    { id: "iso-d10", q: "Disegna su {P} il costume da Capo dei Granchi, con le chele finte", su: "ritratto", adesivi: "🦞👑✨" },
    { id: "iso-d11", q: "Disegna su {P} l'attrezzatura per salire sulla palma a prendere i cocchi", su: "ritratto", adesivi: "🪢🧤🐒🪜" },
    { id: "iso-d12", q: "Disegna su {P} la maschera da sub fatta con due gusci di cocco", su: "ritratto", adesivi: "🥥🐠🫧🐙" }
  ],
  chi: [
    { id: "iso-c01", q: "Chi di noi scriverebbe «AIUTO» sulla sabbia così piccolo che non si legge neanche dalla palma?", titolo: "SOS in miniatura" },
    { id: "iso-c02", q: "Chi di noi, sull'isola, prenderebbe il comando e scriverebbe le leggi sulla corteccia?", titolo: "Trono di palma" },
    { id: "iso-c03", q: "Chi di noi passerebbe il naufragio a prendere il sole, «tanto prima o poi passa una nave»?", titolo: "Naufragio in vacanza" },
    { id: "iso-c04", q: "Chi di noi andrebbe a pescare con la lancia e tornerebbe trionfante con una ciabatta?", titolo: "Pesca di ciabatte" },
    { id: "iso-c05", q: "Chi di noi conterebbe i giorni con le tacche sulla palma… e perderebbe il conto al quarto?", titolo: "Quattro tacche e basta" },
    { id: "iso-c06", q: "Chi di noi terrebbe su il morale di tutti con lo spettacolo dei burattini fatti coi cocchi, ogni sera?", titolo: "Burattini di cocco" },
    { id: "iso-c07", q: "Chi di noi, sull'isola, dividerebbe l'ultimo cocco con tutti, anche con chi non ha fatto niente?", titolo: "Cuore di cocco" },
    { id: "iso-c08", q: "Chi di noi addestrerebbe una scimmia a portare le banane… e finirebbe a portarle alla scimmia?", titolo: "Al servizio della scimmia" },
    { id: "iso-c09", q: "Chi di noi si costruirebbe un'amaca con le liane il primo giorno e non scenderebbe più?", titolo: "Residente dell'amaca" },
    { id: "iso-c10", q: "Chi di noi costruirebbe una zattera e la vedrebbe affondare dopo due metri, davanti a tutti?", titolo: "Zattera da due metri" },
    { id: "iso-c11", q: "Chi di noi proverebbe a fare la pizza su una pietra rovente, con farina di cocco?", titolo: "Pizza al cocco" },
    { id: "iso-c12", q: "Chi di noi, dopo l'isola, parlerebbe come un pirata per altri sei mesi?", titolo: "Pirata di ritorno" },
    { id: "iso-c13", q: "Chi di noi si sveglierebbe prima di tutti, ogni mattina, per tenere acceso il fuoco?", titolo: "Fuoco sempre acceso" },
    { id: "iso-c14", q: "Chi di noi, dopo due giorni sull'isola, sentirebbe la nostalgia del traffico e dei clacson?", titolo: "Nostalgia del clacson" }
  ]
});

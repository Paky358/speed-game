/* =========================================================
   DATI — «Chi di Noi?», autore 3: Vacanze e riflettori
   Posti: crociera, reality, gita, spiaggia, appuntamento.
   {P} = nome di chi è sotto torchio. {o|a} = finale maschile|femminile secondo il suo avatar.
   ========================================================= */
window.SG_CHIDINOI = window.SG_CHIDINOI || { posti: [], comuni: [] };

/* ---------------------------------------------------------
   🛳️ IN CROCIERA — momento del posto: La cena di gala
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "crociera", cod: "cro", nome: "In crociera", emoji: "🛳️",
  adesivi: "🎩🎀👑💎🦞🍰🛟⚓🕶️🌺🎻🐬",
  entrata: [
    "Salpiamo! {P} ha trovato il buffet prima ancora della cabina.",
    "Sirena della nave, si parte. {P} chiede già la password del wi-fi.",
    "Sette giorni di mare. Il capitano è tranquillo: non conosce ancora {P}."
  ],
  immagini: [
    { id: "cro-i01", q: "Chi divide la cabina con {P} per sette giorni?", carte: [
      { chi: "nonno", faccia: "sonno", t: "Russa a ritmo con le onde" },
      { chi: "vichingo", faccia: "esulta", t: "Doccia gelata alle 6, cantando" },
      { chi: "turista", faccia: "estasi", piu: { occhiali: "sole" }, t: "Sveglia alle 5 per ogni escursione" },
      { chi: "mago", faccia: "furbo", t: "Fa sparire tutte le ciabatte" }
    ] },
    { id: "cro-i02", q: "Alla cena di gala, il destino mette {P} accanto a chi?", carte: [
      { chi: "zia", faccia: "felice", t: "Racconta tutta la crociera del '98" },
      { chi: "capitano", faccia: "sonno", t: "Il capitano. Ma chi guida la nave?" },
      { chi: "bimbo", faccia: "linguaccia", t: "Lancia piselli con la cannuccia" },
      { chi: "elegante", faccia: "finto", piu: { occhiali: "monocolo" }, t: "Parla solo del suo yacht" }
    ] },
    { id: "cro-i03", q: "{P} cade nella piscina del ponte col vestito della cena. Chi si tuffa per primo?", carte: [
      { chi: "bagnino", faccia: "sonno", piu: { mano: "pizza" }, t: "Arriva dopo aver finito la pizza" },
      { chi: "capitano", faccia: "esulta", t: "Il capitano, con un tuffo d'angelo" },
      { chi: "nonna", faccia: "furbo", piu: { cappello: "fiori" }, t: "Una nonna in cuffia, a dorso" },
      { chi: "animatore", faccia: "estasi", t: "L'animatore: «Bomba!» e si tuffa" }
    ] },
    { id: "cro-i04", q: "Allo spettacolo serale, chi chiama {P} sul palco davanti a 2.000 persone?", carte: [
      { chi: "mago", faccia: "furbo", piu: { mano: "bacchetta" }, t: "Per la cassa da segare in due" },
      { chi: "cantante", faccia: "innamorato", t: "Per un duetto d'amore stonato" },
      { chi: "clown", faccia: "linguaccia", t: "Per una torta in faccia" },
      { chi: "ballerino", faccia: "esulta", t: "Per un tango con casquè finale" }
    ] },
    { id: "cro-i05", q: "Notte di stelle cadenti sul ponte. Chi si sdraia a guardarle accanto a {P}?", carte: [
      { chi: "prof", faccia: "pensieroso", piu: { occhiali: "tondi" }, t: "Spiega le stelle fino alle 3" },
      { chi: "bimbo", faccia: "esulta", t: "Esprime 40 desideri, ad alta voce" },
      { chi: "influencer", faccia: "innamorato", piu: { mano: "telefono" }, t: "Fa la diretta: si vede solo nero" },
      { chi: "nonno", faccia: "sonno", t: "Dà un nome a ogni stella e russa" }
    ] },
    { id: "cro-i06", q: "Chi fa da guida a {P} nell'escursione di un giorno a terra?", carte: [
      { chi: "prof", faccia: "pensieroso", t: "Spiega ogni sasso per 20 minuti" },
      { chi: "animatore", faccia: "esulta", t: "Fa il trenino anche tra le rovine" },
      { chi: "autista", faccia: "sorpreso", t: "Si perde, ma con entusiasmo" },
      { chi: "nonno", faccia: "felice", piu: { cappello: "coppola" }, t: "Un passeggero che c'era nel '62" }
    ] },
    { id: "cro-i07", q: "Alla gara di ballo latino sul ponte, chi è in coppia con {P}?", carte: [
      { chi: "ballerino", faccia: "furbo", t: "Un maestro di salsa che si vanta" },
      { chi: "nonna", faccia: "estasi", t: "Una nonna che non si ferma mai" },
      { chi: "cameriere", faccia: "sonno", t: "Il cameriere, a fine turno" },
      { chi: "bimbo", faccia: "felice", t: "Un bimbo alto un metro, fierissimo" }
    ] },
    { id: "cro-i08", q: "{P} sbaglia porta ed entra nella cabina di un altro. Chi c'è dentro?", carte: [
      { chi: "capitano", faccia: "sorpreso", t: "Il capitano in pigiama" },
      { chi: "cantante", faccia: "imbarazzo", piu: { mano: "microfono" }, t: "Prova gli acuti sotto la doccia" },
      { chi: "nonno", faccia: "felice", t: "Due nonni a burraco: «Il quarto!»" },
      { chi: "re", faccia: "indifferente", t: "Un re in vacanza, in vestaglia" }
    ] },
    { id: "cro-i09", q: "Chi non lascia in pace {P} per tutta la crociera?", carte: [
      { chi: "animatore", faccia: "esulta", piu: { collo: "fischietto" }, t: "Acquagym alle 8, ogni mattina" },
      { chi: "dj", faccia: "furbo", t: "Dedica canzoni al suo tavolo" },
      { chi: "presentatore", faccia: "felice", t: "Al bingo urla il suo nome. Sempre" },
      { chi: "clown", faccia: "innamorato", t: "Un clown che si è affezionato" }
    ] },
    { id: "cro-i10", q: "Il buffet chiude tra cinque minuti e {P} è ancora al primo giro. Cosa fa?", carte: [
      { e: "🍽️🗼", t: "Un ultimo piatto alto mezzo metro" },
      { e: "🥖👖", t: "Panini nelle tasche per la notte" },
      { e: "😴🥐", t: "Niente: domattina c'è la colazione" },
      { e: "🙏⏳", t: "Implora il cameriere: «Un attimo!»" }
    ] },
    { id: "cro-i11", q: "In cabina, {P} scopre che l'oblò è finto: è un quadro del mare. Cosa fa?", carte: [
      { e: "📢🛎️", t: "Va a protestare alla reception" },
      { e: "📸😂", t: "Lo fotografa per il gruppo" },
      { e: "📅🤦", t: "Se ne accorge l'ultimo giorno" },
      { e: "📝🌊", t: "Ci attacca un foglietto: «Mare»" }
    ] },
    { id: "cro-i12", q: "Il fotografo di bordo mette in vetrina una foto orribile di {P}, a 20 euro. E {P}?", carte: [
      { e: "💸🙈", t: "La compra, così nessuno la vede" },
      { e: "🖼️😎", t: "La mette come foto profilo" },
      { e: "🕵️❓", t: "Fa finta di non riconoscersi" },
      { e: "🔁📸", t: "Chiede di rifarla dieci volte" }
    ] },
    { id: "cro-i13", q: "La nave si ferma ad Atene per tre ore. Come le passa {P}?", carte: [
      { e: "🏛️⏱️", t: "Sale all'Acropoli col cronometro" },
      { e: "☕🔍", t: "Cerca un caffè come quello di casa" },
      { e: "🏊😌", t: "Resta a bordo: la piscina è vuota" },
      { e: "🧲🧲🧲", t: "Calamite per tutto il parentado" }
    ] },
    { id: "cro-i14", q: "Di notte {P} sbaglia ponte e finisce nelle cucine della nave. Cosa succede?", carte: [
      { e: "🥪😋", t: "Si fa fare un panino dal cuoco" },
      { e: "🍰🤫", t: "Esce in punta di piedi, col dolce" },
      { e: "🍝🌅", t: "Impasta con loro fino all'alba" },
      { e: "🗺️😵", t: "Chiede la strada e si riperde" }
    ] },
    { id: "cro-i15", q: "Scalo al porto, due ore di mercatini. Con cosa torna a bordo {P}?", carte: [
      { e: "🧶🧳", t: "Un tappeto che non entra in cabina" },
      { e: "👒", t: "Un cappello di paglia gigante" },
      { e: "🥁", t: "Un tamburo, da suonare in cabina" },
      { e: "👀🚶", t: "Niente: guardava e basta" }
    ] },
    { id: "cro-i16", q: "Il wi-fi della nave costa 15 euro al giorno. Cosa fa {P}?", carte: [
      { e: "💳📶", t: "Lo paga subito: senza non vive" },
      { e: "📅😩", t: "Resiste tre giorni, poi crolla" },
      { e: "📶⚓", t: "Cerca il wi-fi gratis nei porti" },
      { e: "📵😌", t: "Una settimana senza telefono" }
    ] },
    { id: "cro-i17", q: "Sera della cena col capitano: {P} ha in valigia solo le infradito. Cosa fa?", carte: [
      { e: "🩴😎", t: "Va in infradito, a testa alta" },
      { e: "👞🙏", t: "Si fa prestare le scarpe" },
      { e: "🛍️👠", t: "Le compra al negozio di bordo" },
      { e: "🛏️🍕", t: "Salta la cena e ordina in cabina" }
    ] },
    { id: "cro-i18", q: "«Guasto al motore: resteremo fermi in mezzo al mare tre giorni». Cosa fa {P}?", carte: [
      { e: "📋🍽️", t: "Organizza i turni per il buffet" },
      { e: "🔧⚓", t: "Va dal capitano a dare consigli" },
      { e: "🎤💪", t: "Fa un discorso per il morale" },
      { e: "😎☀️", t: "Prende il sole: è sempre vacanza" }
    ] },
    { id: "cro-i19", q: "{P} torna dall'escursione e vede la nave che si allontana dal porto. Cosa fa?", carte: [
      { e: "🚤💨", t: "Noleggia un gommone e la insegue" },
      { e: "🙌📢", t: "Urla e si sbraccia dal molo" },
      { e: "🍦🤷", t: "Un gelato, e ci pensa dopo" },
      { e: "🚆⚓", t: "Treno fino al porto successivo" }
    ] },
    { id: "cro-i20", q: "Sulla nave c'è anche il vicino con cui {P} litiga sempre per il parcheggio. E ora?", carte: [
      { e: "🙈🚪", t: "Lo evita per sette giorni" },
      { e: "🤝❤️", t: "Diventano amici per la pelle" },
      { e: "🕵️🔭", t: "Passa la crociera a spiarlo" },
      { e: "🚗💬", t: "Gli riparla subito del parcheggio" }
    ] },
    { id: "cro-i21", q: "Sera «tutti vestiti di bianco». Come si presenta {P}?", carte: [
      { e: "🤍👟", t: "In bianco, perfino le scarpe" },
      { e: "🖤😎", t: "In nero, per farsi notare" },
      { e: "🍅👕", t: "Macchia di sugo al primo piatto" },
      { e: "🛏️🏛️", t: "Col lenzuolo della cabina, a toga" }
    ] },
    { id: "cro-i22", q: "Primo giorno a bordo: a cosa si iscrive {P}?", carte: [
      { e: "💃🔥", t: "Corso di salsa, in prima fila" },
      { e: "🎨🌅", t: "Pittura del tramonto sul ponte" },
      { e: "🧘🌅", t: "Yoga all'alba (ci va una volta)" },
      { e: "🎤🎶", t: "Karaoke, tutte le sere" }
    ] },
    { id: "cro-i23", q: "Che faccia fa {P} quando scopre che la sua cabina è proprio sopra la discoteca?", carte: [
      { lui: "arrabbiato", t: "Batte sul pavimento con la scarpa" },
      { lui: "esulta", t: "Scende in pigiama a ballare" },
      { lui: "sonno", t: "Dorme lo stesso, a tempo" },
      { lui: "triste", t: "Chiede di cambiare… nave" }
    ] },
    { id: "cro-i24", q: "La nave fa uno scossone e il cappuccino finisce sulla maglietta di {P}. Che faccia fa?", carte: [
      { lui: "arrabbiato", t: "Vuole fare causa al mare" },
      { lui: "linguaccia", t: "Lecca la maglia: è caffè buono" },
      { lui: "imbarazzo", t: "Gira la maglia al contrario" },
      { lui: "indifferente", t: "Tanto era la maglia di ieri" }
    ] },
    { id: "cro-i25", q: "Che faccia fa {P} quando, l'ultimo giorno, arriva il conto delle bibite della settimana?", carte: [
      { lui: "terrore", t: "Rilegge il conto tre volte" },
      { lui: "indifferente", t: "Firma senza guardare" },
      { lui: "pensieroso", t: "Conta le granite una per una" },
      { lui: "arrabbiato", t: "«Io il tè non l'ho mai preso!»" }
    ] },
    { id: "cro-i26", q: "Il capitano annuncia: «Domani tutto il giorno in mare, niente porti». Che faccia fa {P}?", carte: [
      { lui: "esulta", t: "Prenota il lettino da stanotte" },
      { lui: "triste", t: "Niente mercatini, niente calamite" },
      { lui: "sonno", t: "Sogna già un pisolino di 14 ore" },
      { lui: "pensieroso", t: "Organizza una gita… in piscina" }
    ] }
  ],
  scrivi: [
    { id: "cro-s01", q: "Il capitano trova {P} da sol{o|a} sul ponte di comando. {P} si giustifica: «___»",
      riserve: ["Cercavo il bagno, giuro", "Le ho portato un cornetto, capitano", "Il timone era lì, solo, triste"] },
    { id: "cro-s02", q: "{P} lascia una recensione della crociera: una stella sola. Perché?",
      riserve: ["Non mi hanno fatto guidare la nave", "Troppa acqua, poca terra", "Il mare si muoveva troppo"] },
    { id: "cro-s03", q: "Dall'altoparlante: «Si prega {P}, cabina 7, di ___»",
      riserve: ["restituire il timone", "scendere dalla scialuppa: siamo in porto", "smettere di chiamare le balene"] },
    { id: "cro-s04", q: "Il capitano lascia il comando a {P} per un'ora. Qual è il primo ordine?",
      riserve: ["Rotta verso casa di mia madre", "Buffet aperto anche di notte", "Tutti in piscina, equipaggio compreso"] },
    { id: "cro-s05", q: "Dal ponte 12 {P} vede passare un'altra nave da crociera e le urla: «___»",
      riserve: ["Avete posto? Qui c'è mia zia", "Avete visto la mia cabina?", "Facciamo cambio? Avete lo scivolo"] },
    { id: "cro-s06", q: "Al karaoke di bordo, {P} prende il microfono: «Questa la dedico a ___»",
      riserve: ["il cuoco del buffet di mezzanotte", "il mio salvagente, sempre vicino", "la signora che mi ha rubato il lettino"] },
    { id: "cro-s07", q: "In cabina c'è un asciugamano piegato a forma di animale, col biglietto: «Per {P}, che ___»",
      riserve: ["russa come questo elefante", "va al buffet come questo cigno", "si nasconde come questa tartaruga"] },
    { id: "cro-s08", q: "Caccia al tesoro sulla nave: {P} trova la busta finale. Dentro c'è scritto: «___»",
      riserve: ["Hai vinto: buffet libero a vita", "Il tesoro era l'amicizia. E un gelato", "Torna in cabina: ti cercano da ore"] },
    { id: "cro-s09", q: "All'esercitazione di emergenza, {P} si mette a urlare: «___»",
      riserve: ["Salvate prima il buffet!", "Non parto senza la crema solare", "È la volta buona che guido io"] },
    { id: "cro-s10", q: "Al bar sotto casa {P} racconta la crociera: «Il momento più bello? ___»",
      riserve: ["il terzo giro di aragosta", "il delfino (era un sacchetto)", "quando la nave mi ha aspettato"] },
    { id: "cro-s11", q: "Il cuoco di bordo dedica un piatto a {P}. Come si chiama?",
      riserve: ["Risotto «Torno subito al buffet»", "Torta a sette piani, uno per giorno", "Spaghetti all'onda anomala"] },
    { id: "cro-s12", q: "Sul ponte c'è yoga all'alba. A metà lezione, {P} dice all'istruttore: «___»",
      riserve: ["Questa posizione la chiamo «pisolino»", "Il cane a testa in giù fa colazione?", "Il mare si muove, io no"] },
    { id: "cro-s13", q: "{P} prenota la crociera dell'anno dopo, a una condizione: «___»",
      riserve: ["Cabina dentro la cucina", "Niente esercitazione alle 8", "Il capitano deve salutarmi per nome"] },
    { id: "cro-s14", q: "Allo spettacolo dei passeggeri, il numero di {P} si intitola «___»",
      riserve: ["Imito il motore della nave", "Venti cornetti in un minuto", "Il tango del mare mosso"] },
    { id: "cro-s15", q: "All'escursione {P} si fa un tatuaggio finto. Cosa c'è scritto?",
      riserve: ["Ponte 7, cabina boh", "Mamma, sono in mezzo al mare", "Capitano di lungo divano"] },
    { id: "cro-s16", q: "Primo giorno: {P} ferma un cameriere e chiede: «Scusi, ___»",
      riserve: ["la nave fa anche retromarcia?", "si può scendere un attimo?", "da che parte è il mare?"], voto: "lui" },
    { id: "cro-s17", q: "Ultima sera: {P} saluta il cameriere che l'ha servit{o|a} per una settimana. Cosa gli dice?",
      riserve: ["Ti porto a casa con me, in valigia", "Mi mancherai più del buffet. Quasi", "L'anno prossimo, stesso tavolo"] },
    { id: "cro-s18", q: "Allo sbarco, il controllo apre la valigia di {P}. Cosa trova dentro?",
      riserve: ["Venti asciugamani a forma di cigno", "Le bustine di zucchero del buffet", "Un delfino gonfiabile di due metri"], voto: "lui" }
  ],
  disegna: [
    { id: "cro-d01", q: "Disegna su {P} il vestito da gran gala: papillon o collana di perle", su: "ritratto", adesivi: "🎀📿🌹" },
    { id: "cro-d02", q: "Disegna su {P} il cappello da capitano e le medaglie vinte al buffet", su: "ritratto", adesivi: "🎖️🏅🍤" },
    { id: "cro-d03", q: "Disegna su {P} pappagallo e benda per la serata dei pirati", su: "ritratto", adesivi: "🦜🏴‍☠️🗡️" },
    { id: "cro-d04", q: "Disegna su {P} trucco e parrucca da cantante dello spettacolo di bordo", su: "ritratto", adesivi: "🎤💄✨" },
    { id: "cro-d05", q: "Disegna su {P} il costume da sirena per lo spettacolo in piscina", su: "ritratto", adesivi: "🧜🐚🫧" },
    { id: "cro-d06", q: "Disegna su {P} tutti i rimedi contro il mal di mare: limoni, cerotti…", su: "ritratto", adesivi: "🍋🩹🍬🧲" },
    { id: "cro-d07", q: "Disegna la piscina del ponte quando arriva {P} col suo gonfiabile", su: "scena", adesivi: "🦩🛟🍉🕶️" },
    { id: "cro-d08", q: "Disegna cosa vede {P} dall'oblò appena si sveglia", su: "scena", adesivi: "🐙🦈🏝️🐋" },
    { id: "cro-d09", q: "Disegna il piatto che {P} si prepara al buffet di mezzanotte", su: "scena", adesivi: "🍝🍕🍦🥐🍤" },
    { id: "cro-d10", q: "Disegna il lettino di {P} in piscina, difeso da tutti gli altri", su: "scena", adesivi: "🧴📚🚧🧱" },
    { id: "cro-d11", q: "Disegna la scialuppa di salvataggio che {P} ha arredato per l'emergenza", su: "scena", adesivi: "🛋️📺🍕🪴" },
    { id: "cro-d12", q: "Disegna la scultura di ghiaccio che {P} fa al corso sul ponte", su: "scena", adesivi: "🧊🦢🐬🔨" }
  ],
  chi: [
    { id: "cro-c01", q: "Chi di noi passerebbe tutta la crociera a dire che la nave dell'anno scorso era «molto più bella»?", titolo: "La nave dell'anno scorso" },
    { id: "cro-c02", q: "Chi di noi starebbe così tanto nella vasca idromassaggio del ponte da uscirne come una prugna?", titolo: "Prugna dell'idromassaggio" },
    { id: "cro-c03", q: "Chi di noi, al sesto giorno di crociera, chiederebbe ancora al personale dov'è la sua cabina?", titolo: "Cabina introvabile" },
    { id: "cro-c04", q: "Chi di noi, a casa, ballerebbe il balletto dell'animazione della nave a ogni festa per un anno?", titolo: "Balletto di bordo a vita" },
    { id: "cro-c05", q: "Chi di noi, in crociera, si farebbe adottare dai pensionati e tornerebbe con dieci nonni nuovi su WhatsApp?", titolo: "Dieci nonni in più" },
    { id: "cro-c06", q: "Chi di noi, all'esercitazione di emergenza, si metterebbe il giubbotto salvagente al contrario?", titolo: "Salvagente al rovescio" },
    { id: "cro-c07", q: "Chi di noi imparerebbe dal cameriere a piegare gli asciugamani a forma di cigno e ne riempirebbe la cabina?", titolo: "Cigni di spugna" },
    { id: "cro-c08", q: "Chi di noi si iscriverebbe a tutte le gare della nave, anche al torneo di tombola delle signore?", titolo: "Iscrizione a tutte le gare" },
    { id: "cro-c09", q: "Chi di noi, alla cena col capitano, chiederebbe di poter suonare la sirena della nave «solo una volta»?", titolo: "Una volta sola, la sirena" },
    { id: "cro-c10", q: "Chi di noi, nella gita di un giorno a Barcellona, passerebbe tutto il tempo a cercare una pizza decente?", titolo: "Pizza a Barcellona" },
    { id: "cro-c11", q: "Chi di noi manderebbe al gruppo di famiglia 40 foto dello stesso tramonto dal ponte?", titolo: "Tramonto a ripetizione" },
    { id: "cro-c12", q: "Chi di noi, a fine crociera, si nasconderebbe in cabina per rifare il giro senza pagare?", titolo: "Ritorno a scrocco" },
    { id: "cro-c13", q: "Chi di noi farebbe il bagno nella piscina del ponte anche col mare in tempesta, «tanto è acqua uguale»?", titolo: "Bagno nella tempesta" },
    { id: "cro-c14", q: "Chi di noi, alla serata dei saluti, abbraccerebbe piangendo il cameriere come un fratello?", titolo: "Addio al cameriere" }
  ]
});

/* ---------------------------------------------------------
   📺 DENTRO UN REALITY — momento del posto: La stanza di {P} nella casa
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "reality", cod: "rea", nome: "Dentro un reality", emoji: "📺",
  adesivi: "🎥💡🛋️🚪📺🌟💄🧸🪞🎤🏆📢",
  entrata: [
    "Giorno 1 nella casa: {P} ha già litigato con la macchinetta del caffè.",
    "Telecamere accese. {P}, sorridi: l'Italia intera ti guarda.",
    "Nuovo concorrente: {P}. Le scommesse sulla prima nomination sono aperte."
  ],
  immagini: [
    { id: "rea-i01", q: "A metà programma entra un concorrente nuovo, nel letto accanto a {P}. Chi è?", carte: [
      { chi: "mago", faccia: "furbo", t: "Fa sparire la spesa di tutti" },
      { chi: "nonno", faccia: "sonno", t: "Alle nove dorme. E russa" },
      { chi: "influencer", faccia: "innamorato", piu: { mano: "telefono" }, t: "Parla solo con la telecamera" },
      { chi: "cuoco", faccia: "pensieroso", t: "Cucina benissimo, ma solo per sé" }
    ] },
    { id: "rea-i02", q: "Per la finale, {P} può portare in studio un solo ospite. Chi sceglie?", carte: [
      { chi: "mamma", faccia: "estasi", t: "La mamma, in prima fila a piangere" },
      { chi: "cugino", faccia: "linguaccia", t: "Il cugino, per fare casino" },
      { chi: "nonna", faccia: "sorpreso", t: "La nonna: «Ma siamo in diretta?»" },
      { e: "🐶🎀", t: "Il cane, col papillon" }
    ] },
    { id: "rea-i03", q: "Chi conduce il reality in cui è finito {P}?", carte: [
      { chi: "presentatore", faccia: "finto", t: "Ride per finta a ogni battuta" },
      { chi: "nonna", faccia: "arrabbiato", t: "Sgrida i concorrenti in diretta" },
      { chi: "mago", faccia: "furbo", t: "Fa sparire chi esce. Davvero" },
      { chi: "capo", faccia: "indifferente", piu: { mano: "tazza" }, t: "Vuole un tema scritto ogni sera" }
    ] },
    { id: "rea-i04", q: "Settimana a tema medievale: che personaggio tocca a {P}?", carte: [
      { chi: "re", faccia: "furbo", t: "Il re, che non lava un piatto" },
      { chi: "cuoco", faccia: "sorpreso", t: "Il cuoco di corte, bruciacchiato" },
      { chi: "mago", faccia: "pensieroso", t: "Il mago di corte: sbaglia magie" },
      { chi: "clown", faccia: "triste", t: "Il giullare che non fa ridere" }
    ] },
    { id: "rea-i05", q: "Chi è il concorrente con cui {P} litiga per tutta l'edizione?", carte: [
      { chi: "cantante", faccia: "estasi", t: "Fa i vocalizzi alle 6 di mattina" },
      { chi: "ballerino", faccia: "estasi", t: "Fa le prove di danza sul tavolo" },
      { chi: "cuoco", faccia: "furbo", t: "Mette la cipolla dappertutto" },
      { chi: "nonno", faccia: "indifferente", t: "Nasconde il telecomando nel gilet" }
    ] },
    { id: "rea-i06", q: "Chi fa campagna da casa per salvare {P} al televoto?", carte: [
      { chi: "nonna", faccia: "furbo", piu: { mano: "telefono" }, t: "Vota 400 volte dal telefono fisso" },
      { chi: "zio", faccia: "esulta", t: "Volantini in tutti i bar del paese" },
      { chi: "cugino", faccia: "pensieroso", t: "Si crea 30 profili finti" },
      { chi: "mamma", faccia: "arrabbiato", t: "Chiama la redazione ogni ora" }
    ] },
    { id: "rea-i07", q: "La regia manda nella casa un ospite per dare la carica a {P}. Chi arriva?", carte: [
      { chi: "allenatore", faccia: "arrabbiato", piu: { collo: "fischietto" }, t: "Flessioni alle sette, per tutti" },
      { chi: "prof", faccia: "indifferente", piu: { mano: "libro" }, t: "Il prof delle medie, col registro" },
      { chi: "calciatore", faccia: "felice", t: "Un campione, che firma i cuscini" },
      { chi: "babbo", faccia: "estasi", t: "Babbo Natale, ad agosto" }
    ] },
    { id: "rea-i08", q: "Prova «sopravvivi 24 ore a un ospite»: chi entra a tenere compagnia a {P}?", carte: [
      { chi: "clown", faccia: "esulta", t: "Un clown che ride di tutto" },
      { chi: "zia", faccia: "pensieroso", t: "Una zia che riordina tutta la casa" },
      { chi: "vicino", faccia: "arrabbiato", t: "Si lamenta del rumore. Del respiro" },
      { chi: "bimbo", faccia: "furbo", t: "Un bimbo di 5 anni, col tamburo" }
    ] },
    { id: "rea-i09", q: "{P} esce dalla casa dopo tre mesi. Chi aspetta fuori dagli studi?", carte: [
      { chi: "mamma", faccia: "felice", t: "Con una teglia di lasagne" },
      { chi: "cugino", faccia: "estasi", t: "Un fan con la maglietta stampata" },
      { chi: "presentatore", faccia: "finto", piu: { mano: "microfono" }, t: "Un'intervista da 30 secondi" },
      { chi: "vigile", faccia: "indifferente", t: "Un vigile: «La macchina è sua?»" }
    ] },
    { id: "rea-i10", q: "{P} riceve una nomination a sorpresa da quello che credeva il suo amico nella casa. E adesso?", carte: [
      { e: "😊🤐", t: "Fa finta di niente e sorride" },
      { e: "🎥😭", t: "Un'ora in confessionale a sfogarsi" },
      { e: "👉😤", t: "Lo affronta davanti a tutti" },
      { e: "📅😈", t: "Prepara la vendetta per sabato" }
    ] },
    { id: "rea-i11", q: "La prova della settimana: 12 ore in equilibrio su una gamba sola. Come va a {P}?", carte: [
      { e: "🦩💪", t: "Resiste: l'orgoglio prima di tutto" },
      { e: "🛏️💤", t: "Cade dopo due minuti, va a letto" },
      { e: "🧱🤫", t: "Si appoggia al muro di nascosto" },
      { e: "📣🛋️", t: "Tifa dal divano, con le patatine" }
    ] },
    { id: "rea-i12", q: "In dispensa resta un solo pacco di biscotti per otto concorrenti. Cosa fa {P}?", carte: [
      { e: "🛏️🍪", t: "Lo nasconde sotto il letto" },
      { e: "📏🍪", t: "Lo divide col righello" },
      { e: "🌙🤫", t: "Se lo mangia di notte e nega" },
      { e: "🔨🍪", t: "All'asta, in cambio di favori" }
    ] },
    { id: "rea-i13", q: "La regia chiede a {P} di svegliare la casa alle 6 con una canzone. Come la sveglia?", carte: [
      { e: "🍳🎤", t: "Canta battendo su una padella" },
      { e: "🤫🎶", t: "La sussurra, per non disturbare" },
      { e: "⏰🛏️", t: "Mette la sveglia e torna a letto" },
      { e: "🙅🌅", t: "Rifiuta: «Io alle 6 non esisto»" }
    ] },
    { id: "rea-i14", q: "Va in onda {P} che balla da sol{o|a} in cucina alle 3 di notte. Come reagisce {P}?", carte: [
      { e: "💃🏆", t: "Diventa il suo balletto ufficiale" },
      { e: "🙅📺", t: "«Non ero io, era un altro»" },
      { e: "🚪🙈", t: "Non esce di stanza per un giorno" },
      { e: "🎵📢", t: "Chiede alla regia la musica giusta" }
    ] },
    { id: "rea-i15", q: "Festa anni '80 nella casa, ma i costumi vanno fatti con quello che c'è. Come si veste {P}?", carte: [
      { e: "🪟👗", t: "Un vestito fatto con le tende" },
      { e: "🩳😎", t: "La tuta: «È anni '80, giuro»" },
      { e: "🎧👑", t: "Fa musica e comanda, senza costume" },
      { e: "🛏️🔟", t: "A letto alle dieci, festa o no" }
    ] },
    { id: "rea-i16", q: "Il gruppo prepara un piano contro il concorrente più forte e chiede a {P} di starci. E {P}?", carte: [
      { e: "👑📋", t: "Ci sta e prende in mano il piano" },
      { e: "🏃📢", t: "Corre ad avvisare la vittima" },
      { e: "👍😏", t: "Dice sì, poi fa di testa sua" },
      { e: "🙉🛋️", t: "Fa finta di non aver sentito" }
    ] },
    { id: "rea-i17", q: "Prova di cucina: {P} deve preparare un piatto per la giuria. Cosa succede?", carte: [
      { e: "👵🍝", t: "La pasta della nonna, e vince" },
      { e: "🔥💧", t: "Riesce a bruciare anche l'acqua" },
      { e: "👀🍳", t: "Copia il piatto del vicino" },
      { e: "🥄😋", t: "Fa cucinare gli altri, e assaggia" }
    ] },
    { id: "rea-i18", q: "Arriva una busta: {P} può salvare un amico in nomination o prendere 10.000 euro. Cosa sceglie?", carte: [
      { e: "🛟❤️", t: "Salva l'amico senza pensarci" },
      { e: "💰🙏", t: "Prende i soldi e chiede scusa" },
      { e: "🎥🤔", t: "Ci pensa un'ora in confessionale" },
      { e: "✂️💰", t: "«Si può fare metà e metà?»" }
    ] },
    { id: "rea-i19", q: "La regia fa vedere a tutti cosa ha detto {P} di loro in confessionale. E {P}?", carte: [
      { e: "✂️📹", t: "«Hanno tagliato male il video»" },
      { e: "🙏🙏", t: "Chiede scusa, uno per uno" },
      { e: "🔁🗣️", t: "Lo ripete in faccia, uguale" },
      { e: "😂🙌", t: "Scoppia a ridere e ammette tutto" }
    ] },
    { id: "rea-i20", q: "Il televoto parla chiaro: {P} piace a tutta Italia, ma a nessuno dentro la casa. E ora?", carte: [
      { e: "😎🌟", t: "Si gode il successo e basta" },
      { e: "🍰🙏", t: "Una torta per farsi perdonare" },
      { e: "😈📈", t: "Ancora più antipatia, apposta" },
      { e: "🤔🪞", t: "Si chiede cosa ha fatto di male" }
    ] },
    { id: "rea-i21", q: "Scoppia la lite del secolo per il telecomando. Le telecamere cercano {P}: dov'è?", carte: [
      { e: "📢😤", t: "È in mezzo e urla più di tutti" },
      { e: "☕😌", t: "Porta la camomilla a tutti e due" },
      { e: "🎙️⚽", t: "Fa la telecronaca, come al calcio" },
      { e: "😴🚪", t: "Dorme di là e non sa niente" }
    ] },
    { id: "rea-i22", q: "Nella casa non ci sono orologi. Come capisce {P} che ore sono?", carte: [
      { e: "🍝⏰", t: "Dalla fame: è sempre ora di pranzo" },
      { e: "🐓☀️", t: "Dal sole, come un contadino" },
      { e: "📺🎤", t: "Se c'è la diretta, è sabato" },
      { e: "😴🤷", t: "Non importa: dorme lo stesso" }
    ] },
    { id: "rea-i23", q: "Che faccia fa {P} quando la conduttrice dice «c'è una sorpresa in giardino» e in giardino c'è sua zia?", carte: [
      { lui: "estasi", t: "Corre ad abbracciarla in pigiama" },
      { lui: "terrore", t: "Si nasconde dietro il divano" },
      { lui: "finto", t: "«Che bello!» (Non è bello)" },
      { lui: "imbarazzo", t: "Spera che non porti le foto" }
    ] },
    { id: "rea-i24", q: "Che faccia fa {P} quando in diretta parte un vocale della nonna?", carte: [
      { lui: "innamorato", t: "Manda baci con tutte e due le mani" },
      { lui: "imbarazzo", t: "La nonna svela il soprannome" },
      { lui: "triste", t: "Lacrime vere, per la prima volta" },
      { lui: "terrore", t: "«Nonna, non dire quella cosa!»" }
    ] },
    { id: "rea-i25", q: "Che faccia fa {P} quando la conduttrice apre la busta e dice: «Chi esce stasera è…»?", carte: [
      { lui: "terrore", t: "Stringe la mano a tutti, sudando" },
      { lui: "indifferente", t: "Ha già la valigia pronta" },
      { lui: "pensieroso", t: "Ripassa il discorso d'uscita" },
      { lui: "furbo", t: "Sa già il risultato, chissà come" }
    ] },
    { id: "rea-i26", q: "Che faccia fa {P} quando scopre che la spesa della settimana è solo riso e cavolfiori?", carte: [
      { lui: "disgusto", t: "Annusa un cavolfiore, e si arrende" },
      { lui: "triste", t: "Scrive una lettera alla mamma" },
      { lui: "arrabbiato", t: "Sciopero della fame (fino a cena)" },
      { lui: "finto", t: "«Adoro il cavolfiore», in diretta" }
    ] }
  ],
  scrivi: [
    { id: "rea-s01", q: "Nel confessionale, {P} sussurra: «Stanotte ho fatto una cosa terribile: ___»",
      riserve: ["ho mangiato la torta del compleanno", "ho spento la sveglia di tutta la casa", "ho cantato l'inno alla telecamera"] },
    { id: "rea-s02", q: "{P} in confessionale: «Se esco io, dite all'Italia che ___»",
      riserve: ["la pasta la cuocevo meglio io", "il telecomando l'ho nascosto io", "il divano grande è ancora mio"] },
    { id: "rea-s03", q: "{P} svela alla telecamera: «Il mio piano per vincere è semplice: ___»",
      riserve: ["dormire mentre gli altri litigano", "farmi amare dallo stomaco di tutti", "nominare sempre chi russa"] },
    { id: "rea-s04", q: "Nel confessionale {P} giura: «Io qui dentro non ho mai ___»",
      riserve: ["pianto, era la cipolla", "rubato biscotti: erano in prestito", "dormito sul divano, mi concentravo"] },
    { id: "rea-s05", q: "{P} chiude il confessionale col suo motto: «Nella vita, come nella casa, ___»",
      riserve: ["chi dorme non viene nominato", "l'ultima fetta è di chi la vede", "sorridi: ti stanno inquadrando"] },
    { id: "rea-s06", q: "Nella casa entra un cane. {P} gli insegna il primo comando: «___»",
      riserve: ["Abbaia quando arriva la nomination", "Ruba i biscotti agli altri, non a me", "Seduto. Ma non sul mio divano"] },
    { id: "rea-s07", q: "{P} esce al televoto. Ultime parole sulla porta rossa: «___»",
      riserve: ["Il ragù in frigo è mio, ricordatevelo", "Annaffiate la mia piantina", "Non è finita: la nonna sta votando"] },
    { id: "rea-s08", q: "L'appello di {P} al televoto dura solo 5 secondi. Cosa dice?",
      riserve: ["Votatemi, ho lasciato il gas acceso", "Nonna, chiama altre cento volte", "Se esco io, la spesa chi la fa?"] },
    { id: "rea-s09", q: "Qual è la prima frase di {P} appena mette piede nella casa?",
      riserve: ["Dov'è il frigo?", "Il letto vicino alla finestra è mio", "Ciao mamma! Ah, c'è la diretta"] },
    { id: "rea-s10", q: "In diretta: «{P}, cosa ti manca di più di casa?». Cosa risponde?",
      riserve: ["Il mio cuscino storto", "La mamma che urla «è pronto!»", "Il wi-fi. E anche la mamma"] },
    { id: "rea-s11", q: "La lettera di {P} alla famiglia viene tagliata: passa una riga sola. Quale?",
      riserve: ["Non toccate niente in camera mia", "Il cane sta bene? Salutatelo", "Mandatemi la ricetta del ragù, ora"] },
    { id: "rea-s12", q: "Il pubblico in studio alza un cartellone per {P}. Cosa c'è scritto?",
      riserve: ["Ti amo! (Sono tua zia)", "Siamo i tuoi cugini, salutaci!", "Rifatti il letto"] },
    { id: "rea-s13", q: "{P} cucina per tutta la casa e borbotta tra sé. I sottotitoli della regia dicono: «___»",
      riserve: ["Chi ha usato la mia padella, chi?", "Sale… ah no, era zucchero", "La chiamo carbonara lo stesso"] },
    { id: "rea-s14", q: "{P} vince il reality. Primo messaggio al gruppo degli amici: «___»",
      riserve: ["Ve l'avevo detto: dormire paga", "Avete votato voi? Siete pazzi", "Offro io le pizze. Con calma"] },
    { id: "rea-s15", q: "Voce fuori campo del riassunto: «Questa settimana, {P} ___»",
      riserve: ["ha litigato con la lavatrice e ha perso", "ha nominato la macchinetta del caffè", "ha dormito 90 ore su 168"] },
    { id: "rea-s16", q: "Prova di coppia: {P} resta legat{o|a} a un altro concorrente per una settimana. Dopo un giorno dice: «___»",
      riserve: ["Tagliate. Tagliate tutto", "Almeno scelgo io cosa mangiamo", "Ci siamo già detti tutto. Due volte"] },
    { id: "rea-s17", q: "Nomination segreta: {P} scrive il nome e la motivazione. «Nomino ___»",
      riserve: ["il frigorifero, sempre vuoto", "chi mi ha rubato le ciabatte", "la sveglia delle 7, ovvio"] },
    { id: "rea-s18", q: "La prima intervista di {P} su un giornale di gossip. Qual è il titolo?",
      riserve: ["Io e il divano: la vera storia", "Il cavolfiore mi ha cambiato la vita", "La verità sul telecomando"] }
  ],
  disegna: [
    { id: "rea-d01", q: "Disegna il divano della casa con il posto di {P} segnato e difeso", su: "scena", adesivi: "🛋️🚧🧸📺🍿" },
    { id: "rea-d02", q: "Disegna il giardino della casa come lo ha sistemato {P}", su: "scena", adesivi: "🌻🏊⛺🦩" },
    { id: "rea-d03", q: "Disegna il confessionale come lo ha arredato {P}", su: "scena", adesivi: "🕯️🍫🧻🪴" },
    { id: "rea-d04", q: "Disegna il letto di {P} dopo lo scherzo notturno degli altri concorrenti", su: "scena", adesivi: "🧻🪶🐸💦" },
    { id: "rea-d05", q: "Disegna la prova della settimana che {P} non supererà mai", su: "scena", adesivi: "🧗🥚🧊⏱️" },
    { id: "rea-d06", q: "Disegna il frigo della casa dopo il passaggio notturno di {P}", su: "scena", adesivi: "🧀🥚🍕🥫" },
    { id: "rea-d07", q: "Disegna su {P} il look per la prima diretta del sabato sera", su: "ritratto", adesivi: "✨👗🎀💎" },
    { id: "rea-d08", q: "Disegna su {P} il costume per la festa a tema «animali della giungla»", su: "ritratto", adesivi: "🦁🐒🦓🌿" },
    { id: "rea-d09", q: "Disegna su {P} il costume da supereroe fatto con le cose di casa", su: "ritratto", adesivi: "🧺🍳🧻🥄" },
    { id: "rea-d10", q: "Disegna su {P} la faccia dipinta coi colori del suo fan club", su: "ritratto", adesivi: "💖⭐📣" },
    { id: "rea-d11", q: "Disegna su {P} com'è uscit{o|a} dalla prova «tuffo nella gelatina»", su: "ritratto", adesivi: "🍮🍓🫧" },
    { id: "rea-d12", q: "Disegna su {P} il look per vincere la finale in diretta", su: "ritratto", adesivi: "🏆🕶️🎤👑" }
  ],
  chi: [
    { id: "rea-c01", q: "Chi di noi, in un reality, prenderebbe le nomination di tutti per aver finito il caffè della casa?", titolo: "Nomination per il caffè" },
    { id: "rea-c02", q: "Chi di noi, nella casa, passerebbe le giornate a chiacchierare con la telecamera come con un amico?", titolo: "Confidenze alla telecamera" },
    { id: "rea-c03", q: "Chi di noi, la prima sera nella casa, farebbe un'alleanza segreta con ogni concorrente, uno per uno?", titolo: "Alleanza con tutti" },
    { id: "rea-c04", q: "Chi di noi piangerebbe in confessionale perché la pasta è scotta?", titolo: "Dramma della pasta scotta" },
    { id: "rea-c05", q: "Chi di noi, nella prova della settimana, si impegnerebbe come alle Olimpiadi per vincere una pizza?", titolo: "Olimpiadi della pizza" },
    { id: "rea-c06", q: "Chi di noi, uscendo al televoto, si rifiuterebbe di andarsene, abbracciando il divano?", titolo: "Abbraccio al divano" },
    { id: "rea-c07", q: "Chi di noi starebbe nella casa tre mesi in pigiama, anche durante la diretta del sabato sera?", titolo: "Pigiama in prima serata" },
    { id: "rea-c08", q: "Chi di noi organizzerebbe uno sciopero della casa perché nella spesa non c'è il cioccolato?", titolo: "Sindacalista della spesa" },
    { id: "rea-c09", q: "Chi di noi, nella casa, proverebbe allo specchio la faccia stupita per quando arrivano le sorprese?", titolo: "Sorpresa provata" },
    { id: "rea-c10", q: "Chi di noi, appena fuori dalla casa, aprirebbe un canale per raccontare «tutta la verità»?", titolo: "La verità sulla casa" },
    { id: "rea-c11", q: "Chi di noi passerebbe le notti a sussurrare strategie di nomination come un generale in guerra?", titolo: "Strategie sottovoce" },
    { id: "rea-c12", q: "Chi di noi, la sera che è finita la spesa, inventerebbe una cena per dieci con due uova e una cipolla?", titolo: "Miracolo con due uova" },
    { id: "rea-c13", q: "Chi di noi, al televoto, salverebbe il nemico della casa perché «poverino, gli manca la mamma»?", titolo: "Cuore da televoto" },
    { id: "rea-c14", q: "Chi di noi vincerebbe il reality senza aver fatto niente di niente per tre mesi?", titolo: "Vittoria dal divano" }
  ]
});

/* ---------------------------------------------------------
   🚌 IN GITA SCOLASTICA — momento del posto: La foto di classe
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "gita", cod: "git", nome: "In gita scolastica", emoji: "🚌",
  adesivi: "🚌🎒📸🗿🏛️🧃🍫🧢📚🎟️🗺️🧸",
  entrata: [
    "Pullman delle 6, si parte! {P} ha già mangiato i panini del pranzo.",
    "Appello: {P}? {P}?! Ah, è ancora all'autogrill.",
    "Gita a Firenze. Il prof ha già scelto chi tenere d'occhio: {P}."
  ],
  immagini: [
    { id: "git-i01", q: "Chi divide la camera d'albergo con {P}, in gita?", carte: [
      { chi: "cugino", faccia: "sonno", t: "Musica nelle cuffie tutta la notte" },
      { chi: "scout", faccia: "felice", piu: { schiena: "zaino" }, t: "Ha portato sacco a pelo e bussola" },
      { chi: "mago", faccia: "furbo", t: "Trucchi con le carte fino alle 4" },
      { chi: "supereroe", faccia: "furbo", t: "Dorme col mantello, sul serio" }
    ] },
    { id: "git-i02", q: "Chi è il prof accompagnatore che tocca alla classe di {P}?", carte: [
      { chi: "prof", faccia: "furbo", t: "Conta la classe ogni 5 minuti" },
      { chi: "allenatore", faccia: "esulta", piu: { collo: "fischietto" }, t: "Ginnastica: si va tutto a piedi" },
      { chi: "nonno", faccia: "sonno", t: "A un mese dalla pensione: tutto ok" },
      { chi: "cantante", f: "d", faccia: "estasi", t: "La prof di musica: si canta sempre" }
    ] },
    { id: "git-i03", q: "Chi guida il pullman della gita di {P}?", carte: [
      { chi: "autista", faccia: "arrabbiato", t: "Vieta le patatine sui sedili" },
      { chi: "rockstar", faccia: "esulta", t: "Canta più forte di tutta la classe" },
      { chi: "nonno", faccia: "pensieroso", t: "Va a 60 all'ora in autostrada" },
      { chi: "cowboy", faccia: "furbo", t: "Chiama il pullman «la mia bestia»" }
    ] },
    { id: "git-i04", q: "Al museo, chi fa da guida alla classe di {P}?", carte: [
      { chi: "prof", faccia: "pensieroso", piu: { occhiali: "tondi" }, t: "Spiega ogni quadro due volte" },
      { chi: "presentatore", faccia: "felice", t: "Fa il quiz a premi coi quadri" },
      { chi: "nonna", faccia: "sonno", t: "Sussurra. Nessuno sente niente" },
      { chi: "influencer", faccia: "linguaccia", t: "Fa fare i selfie con le statue" }
    ] },
    { id: "git-i05", q: "In albergo, chi dorme nella camera accanto a quella di {P}?", carte: [
      { chi: "prof", faccia: "arrabbiato", t: "Il prof, che bussa ogni ora" },
      { chi: "calciatore", faccia: "esulta", t: "Una squadra di calcio che canta" },
      { chi: "nonna", faccia: "estasi", t: "Un gruppo di nonne che balla" },
      { chi: "mago", faccia: "sorpreso", t: "Un mago che ha perso il coniglio" }
    ] },
    { id: "git-i06", q: "Chi si siede accanto a {P} sul pullman, per sei ore di viaggio?", carte: [
      { chi: "cugino", faccia: "sonno", t: "Si addormenta sulla sua spalla" },
      { chi: "dj", faccia: "esulta", t: "Ha la cassa. E la usa" },
      { chi: "prof", faccia: "indifferente", t: "Il prof. Per punizione" },
      { chi: "cuoco", faccia: "felice", t: "Sbuccia l'uovo sodo alle 7" }
    ] },
    { id: "git-i07", q: "Con chi si fa la foto {P} davanti al monumento più famoso?", carte: [
      { chi: "mago", faccia: "finto", t: "Uomo-statua: si muove a pagamento" },
      { chi: "bidello", faccia: "felice", t: "Il bidello, venuto apposta" },
      { chi: "turista", faccia: "estasi", t: "Un turista che si mette in mezzo" },
      { chi: "prof", faccia: "sonno", t: "Il prof, che chiude gli occhi" }
    ] },
    { id: "git-i08", q: "All'autogrill, il pullman riparte tra 3 minuti. Chi c'è in fila alla cassa davanti a {P}?", carte: [
      { chi: "nonna", faccia: "felice", t: "Una nonna che paga in monetine" },
      { chi: "cuoco", faccia: "pensieroso", t: "Ordina 12 panini, uno per uno" },
      { chi: "turista", faccia: "pensieroso", t: "Chiede gli ingredienti di tutto" },
      { chi: "prof", faccia: "indifferente", piu: { mano: "tazza" }, t: "Il prof, che non ha fretta" }
    ] },
    { id: "git-i09", q: "Cosa si porta {P} di nascosto in gita?", carte: [
      { e: "🍕🧊", t: "Mezza pizza fredda di ieri" },
      { e: "🔊🎶", t: "La cassa per la camerata" },
      { e: "🧸", t: "Il peluche, ben nascosto" },
      { e: "📚✍️", t: "I compiti da copiare in pullman" }
    ] },
    { id: "git-i10", q: "Nella foto di classe ufficiale, chi si piazza proprio dietro a {P}?", carte: [
      { chi: "clown", faccia: "linguaccia", t: "Fa la linguaccia allo scatto" },
      { chi: "calciatore", faccia: "esulta", t: "Salta proprio mentre scattano" },
      { chi: "prof", faccia: "sonno", t: "Il prof, a occhi chiusi" },
      { chi: "influencer", faccia: "innamorato", t: "Fa la boccuccia da selfie" }
    ] },
    { id: "git-i11", q: "Al museo, la guida parla da un'ora di un vaso rotto. Cosa fa {P}?", carte: [
      { e: "📝🤓", t: "Ascolta e prende appunti" },
      { e: "📱🪑", t: "Per terra, col telefono" },
      { e: "🎭😂", t: "Imita la guida per far ridere" },
      { e: "🛍️🏃", t: "Scappa al negozio del museo" }
    ] },
    { id: "git-i12", q: "Alle 2 di notte la camera accanto bussa: è scoppiata la battaglia di cuscini. E {P}?", carte: [
      { e: "🛏️⚔️", t: "Entra col cuscino più grosso" },
      { e: "🔒😴", t: "Chiude a chiave e dorme" },
      { e: "🔦🏁", t: "Fa l'arbitro con la torcia" },
      { e: "📞🚨", t: "Va a chiamare il prof" }
    ] },
    { id: "git-i13", q: "{P} vede per la prima volta il Colosseo. Cosa fa?", carte: [
      { e: "📸📸📸", t: "Duecento foto, da ogni lato" },
      { e: "🤏😐", t: "«Me lo immaginavo più grande»" },
      { e: "😶✨", t: "Resta a guardarlo in silenzio" },
      { e: "🍕❓", t: "Chiede dove si mangia" }
    ] },
    { id: "git-i14", q: "Il pullman resta due ore fermo in coda in autostrada. Come le passa {P}?", carte: [
      { e: "🎤❓", t: "Inventa un quiz e lo conduce" },
      { e: "😮💤", t: "Dorme a bocca aperta" },
      { e: "🍫⏱️", t: "Finisce la merenda in dieci minuti" },
      { e: "🃏💺", t: "Carte sul sedile con tre amici" }
    ] },
    { id: "git-i15", q: "Al ristorante della gita servono il pesce intero, con la testa. Cosa fa {P}?", carte: [
      { e: "🐟😋", t: "Mangia tutto, testa compresa" },
      { e: "🧻🍞", t: "Lo copre col tovagliolo: solo pane" },
      { e: "🐟🗣️", t: "Lo fa parlare come un pupazzo" },
      { e: "🔄🍽️", t: "Lo scambia col piatto del vicino" }
    ] },
    { id: "git-i16", q: "In albergo, nella camera di {P} ci sono quattro letti per sei ragazzi. Cosa fa {P}?", carte: [
      { e: "🛁😴", t: "Dorme nella vasca, felice" },
      { e: "🪑🪑", t: "Unisce due sedie e un cuscino" },
      { e: "🧸🛏️", t: "Letto diviso, col peluche in mezzo" },
      { e: "🛎️😤", t: "Va a protestare in reception" }
    ] },
    { id: "git-i17", q: "Al museo {P} sfiora una statua e scatta l'allarme. Cosa fa?", carte: [
      { e: "🚶👥", t: "Si mescola a un'altra classe" },
      { e: "🙏🏛️", t: "Chiede scusa a tutto il museo" },
      { e: "🗿🧍", t: "Si mette in posa: fa la statua" },
      { e: "📱🚨", t: "Fa il video dell'allarme" }
    ] },
    { id: "git-i18", q: "Gita a Napoli, e il prof dice: «La pizza solo stasera». Cosa fa {P} a pranzo?", carte: [
      { e: "🥪😇", t: "Mangia il panino di casa" },
      { e: "🍕🏃", t: "Fugge per una pizza a portafoglio" },
      { e: "📝✊", t: "Raccoglie le firme per la pizza" },
      { e: "🍕👀", t: "Ruba un pezzo di quella del prof" }
    ] },
    { id: "git-i19", q: "Alle 3 di notte il prof entra in camera di {P} e trova mezza classe nell'armadio. E {P}?", carte: [
      { e: "📚😇", t: "«Stavamo ripassando storia»" },
      { e: "🦸🙋", t: "Si prende tutta la colpa" },
      { e: "😴👁️", t: "Dorme con gli occhi aperti" },
      { e: "👉🚪", t: "Colpa della camera accanto" }
    ] },
    { id: "git-i20", q: "«Chi ha attaccato la gomma sul sedile dell'autista?». La colpa è di {P}. E ora?", carte: [
      { e: "🙋", t: "Alza la mano subito" },
      { e: "🎶🪟", t: "Fischietta guardando fuori" },
      { e: "👉😴", t: "Accusa uno che dorme" },
      { e: "🖼️🎨", t: "«È arte moderna»" }
    ] },
    { id: "git-i21", q: "Il prof si addormenta sul pullman e russa col microfono acceso. Cosa fa {P}?", carte: [
      { e: "📱📤", t: "Lo registra per tutta la scuola" },
      { e: "🤫🎤", t: "Gli spegne piano il microfono" },
      { e: "🎶👥", t: "Fa il coro sopra il russare" },
      { e: "⏰❓", t: "Lo sveglia: «Quanto manca?»" }
    ] },
    { id: "git-i22", q: "Cosa compra {P} nel negozio del museo?", carte: [
      { e: "✏️", t: "Una matita gigante, mai usata" },
      { e: "🦕", t: "Un dinosauro di gomma" },
      { e: "📚💸", t: "Il catalogo da 40 euro" },
      { e: "🧲🖼️", t: "La calamita del quadro famoso" }
    ] },
    { id: "git-i23", q: "Che faccia fa {P} quando il prof annuncia: «Domani sveglia alle 5 per vedere l'alba sulle rovine»?", carte: [
      { lui: "sonno", t: "Ci va, ma dorme in piedi" },
      { lui: "arrabbiato", t: "Organizza la rivolta" },
      { lui: "esulta", t: "Punta tre sveglie, per sicurezza" },
      { lui: "finto", t: "«Che bello!» E si rimette a letto" }
    ] },
    { id: "git-i24", q: "Che faccia fa {P} quando apre il pranzo al sacco e trova il panino con la frittata di cipolle?", carte: [
      { lui: "estasi", t: "Lo divora in pullman alle 8" },
      { lui: "disgusto", t: "Lo scambia con la prima merendina" },
      { lui: "imbarazzo", t: "Tutto il pullman sente l'odore" },
      { lui: "indifferente", t: "Tanto la fame è fame" }
    ] },
    { id: "git-i25", q: "Che faccia fa {P} quando l'autista mette per la quarta volta la stessa canzone?", carte: [
      { lui: "sonno", t: "Crolla al terzo ritornello" },
      { lui: "arrabbiato", t: "Vuole sequestrare la radio" },
      { lui: "esulta", t: "La sa a memoria: canta tutta" },
      { lui: "linguaccia", t: "Ci balla sopra il sedile" }
    ] },
    { id: "git-i26", q: "Che faccia fa {P} quando, al ritorno, la mamma l'aspetta davanti a tutta la classe con un cartello?", carte: [
      { lui: "imbarazzo", t: "Fa finta di non conoscerla" },
      { lui: "esulta", t: "Corre ad abbracciarla, felice" },
      { lui: "terrore", t: "Si nasconde dietro il pullman" },
      { lui: "finto", t: "La saluta da lontano, con un dito" }
    ] },
    { id: "git-i27", q: "Che faccia fa {P} quando il prof annuncia: «Domani un museo, poi un altro museo, poi un museo»?", carte: [
      { lui: "triste", t: "«Mamma, vienimi a prendere»" },
      { lui: "estasi", t: "Adora i musei. Davvero" },
      { lui: "sonno", t: "Già sogna le panchine delle sale" },
      { lui: "furbo", t: "Sa già dov'è il bar di ogni museo" }
    ] }
  ],
  scrivi: [
    { id: "git-s01", q: "Ultima sera: {P} scrive sul diario di classe «In questa gita ho imparato che ___»",
      riserve: ["il prof russa in re minore", "le statue non vanno abbracciate", "un panino può durare tre giorni"] },
    { id: "git-s02", q: "{P} lascia un biglietto sul cuscino del prof. Cosa c'è scritto?",
      riserve: ["Sveglia alle 10, grazie", "Ci vediamo a colazione. Forse.", "Il dentifricio sulla maniglia? Boh"] },
    { id: "git-s03", q: "La guida del museo chiede: «Domande?». {P} alza la mano: «___»",
      riserve: ["Ma il bar a che piano è?", "Questa statua l'ha rotta qualcuno?", "Possiamo toccare? Neanche un dito?"] },
    { id: "git-s04", q: "Nel modulo per dividere le camere, alla voce «richieste speciali», {P} scrive: «___»",
      riserve: ["Niente piedi verso il mio cuscino", "Letto vicino al bagno e al frigo", "Chi russa dorme in corridoio"] },
    { id: "git-s05", q: "Nota sul registro della gita: «Durante la visita, {P} ___»",
      riserve: ["ha scambiato una statua per il prof", "ha cercato di adottare un piccione", "ha mangiato il pranzo alle 8:15"] },
    { id: "git-s06", q: "Sotto la foto di classe c'è una didascalia per ognuno. Quella di {P} dice: «___»",
      riserve: ["Presente solo in foto", "Ha chiuso gli occhi anche qui", "Il prof non sa ancora dov'era"] },
    { id: "git-s07", q: "Il tema di {P} sulla gita si intitola: «___»",
      riserve: ["Firenze vista dal pullman", "Sei panini e un David", "Sopravvivere alla camera 12"] },
    { id: "git-s08", q: "Il museo fa doppiare l'audioguida a {P}. Cosa dice?",
      riserve: ["Questo quadro è vecchio. Fine.", "A destra il bar, a sinistra il bagno", "Non toccate niente, l'ho già fatto io"] },
    { id: "git-s09", q: "Il discorso di {P} per ringraziare il prof, l'ultima sera, comincia così: «___»",
      riserve: ["Caro prof, scusi per il pullman", "Prof, lei è come un papà: russa", "Grazie per non averci perso tutti"] },
    { id: "git-s10", q: "Al ristorante della gita, {P} fa l'imitazione del prof. La sua frase tipica: «___»",
      riserve: ["Ragazzi, non siamo in vacanza", "Chi ha toccato il quadro?", "Contiamoci: siamo 23… 22… 24"] },
    { id: "git-s11", q: "Di notte {P} chiama la reception dell'albergo: «Pronto, ___»",
      riserve: ["c'è un prof nel nostro corridoio", "si può avere la colazione adesso?", "il letto di sopra si muove"] },
    { id: "git-s12", q: "{P} nasconde un bigliettino nella valigia del compagno di stanza: «___»",
      riserve: ["Ho mangiato i tuoi biscotti", "Ti ho preso i calzini, ciao", "Controlla sotto il letto. Bu!"] },
    { id: "git-s13", q: "{P} prova a convincere il prof a fermarsi all'autogrill: «Prof, ___»",
      riserve: ["è un'emergenza: ci sono i panini", "lo dico per l'autista, è stanco", "o mi fermo o canto per tre ore"] },
    { id: "git-s14", q: "Nello zaino della gita, {P} trova un biglietto della mamma: «___»",
      riserve: ["Mettiti la maglia della salute", "Se ti perdi, cerca il bar", "Il panino è per pranzo, non per le 8"] },
    { id: "git-s15", q: "Nel questionario finale, {P} dà un voto al prof. Che voto, e perché?",
      riserve: ["Otto: ci ha persi solo due volte", "Sei: troppi musei", "Dieci: ha offerto le pizze"] },
    { id: "git-s16", q: "Gita finita: ultimo messaggio di {P} al gruppo della classe. Cosa scrive?",
      riserve: ["Chi ha il mio spazzolino?", "Rifacciamola domani, senza musei", "Il prof ha già scritto a mia madre"] },
    { id: "git-s17", q: "Il prof affida a {P} un incarico ufficiale per tutta la gita. Quale?",
      riserve: ["Responsabile della conta", "Custode dei panini", "Sorveglianza bagno del pullman"], voto: "lui" }
  ],
  disegna: [
    { id: "git-d01", q: "Disegna la foto di classe con {P} che rovina lo scatto", su: "scena", adesivi: "🙃🐰🤳🤧" },
    { id: "git-d02", q: "Disegna la camera di {P} in albergo, alle 3 di notte dell'ultima sera", su: "scena", adesivi: "🛏️🍕🔦🧦" },
    { id: "git-d03", q: "Disegna la camera dei prof come se la immagina {P}", su: "scena", adesivi: "🛏️📚☕🎻🧦" },
    { id: "git-d04", q: "Disegna il monumento famoso come se lo ricorda {P}", su: "scena", adesivi: "🗼🏰🍕🦖" },
    { id: "git-d05", q: "Disegna la mappa segreta di {P} per scappare dal museo al bar", su: "scena", adesivi: "☕🥐🚩❌" },
    { id: "git-d06", q: "Disegna il pullman della gita dopo che {P} l'ha decorato per il ritorno", su: "scena", adesivi: "🎈🏁🎶🦖" },
    { id: "git-d07", q: "Disegna su {P} il look da turista: cappellino, marsupio e cartina", su: "ritratto", adesivi: "👝🗺️📸🕶️" },
    { id: "git-d08", q: "Disegna su {P} la divisa da guida turistica, con bandierina e microfono", su: "ritratto", adesivi: "🚩🎤🧢🗺️" },
    { id: "git-d09", q: "Disegna su {P} gli scherzi col pennarello dell'ultima notte in camera", su: "ritratto", adesivi: "🖊️😴⭐" },
    { id: "git-d10", q: "Disegna su {P} elmo e mantello da gladiatore comprati al Colosseo", su: "ritratto", adesivi: "⚔️🛡️🏛️" },
    { id: "git-d11", q: "Disegna su {P} il look da statua greca, per non farsi trovare dal prof", su: "ritratto", adesivi: "🏛️🍇🌿🏺" },
    { id: "git-d12", q: "Disegna su {P} il travestimento da prof per uscire dall'albergo di notte", su: "ritratto", adesivi: "👓📚🥸☕" }
  ],
  chi: [
    { id: "git-c01", q: "Chi di noi, in gita, si siederebbe in fondo al pullman e farebbe partire i cori dopo due minuti?", titolo: "Capo dei sedili in fondo" },
    { id: "git-c02", q: "Chi di noi, in gita a Venezia, spenderebbe tutti i soldi il primo giorno in calamite e cappelli da gondoliere?", titolo: "Calamite al primo giorno" },
    { id: "git-c03", q: "Chi di noi farebbe alla guida del museo domande così strane da farla bloccare a pensare?", titolo: "Incubo delle guide" },
    { id: "git-c04", q: "Chi di noi, in gita, si addormenterebbe in piedi davanti al quadro più famoso del museo?", titolo: "Pisolino agli Uffizi" },
    { id: "git-c05", q: "Chi di noi, in camerata, racconterebbe storie di paura fino alle 4 e poi non riuscirebbe a dormire?", titolo: "Storie di paura alle 4" },
    { id: "git-c06", q: "Chi di noi si perderebbe nel museo e ricomparirebbe un'ora dopo al bar, col cornetto?", titolo: "Ricomparsa al bar" },
    { id: "git-c07", q: "Chi di noi si farebbe sequestrare dal prof la trombetta da stadio dopo dieci minuti di pullman?", titolo: "Trombetta sequestrata" },
    { id: "git-c08", q: "Chi di noi si farebbe beccare dal prof nel corridoio dell'albergo alle due di notte con le patatine in mano?", titolo: "Ronda delle patatine" },
    { id: "git-c09", q: "Chi di noi chiamerebbe la mamma dalla gita tre volte al giorno per raccontarle cosa ha mangiato?", titolo: "Radiocronaca alla mamma" },
    { id: "git-c10", q: "Chi di noi, a Pisa, farebbe cinquanta foto mentre «regge» la Torre, finché non ne viene una perfetta?", titolo: "Pilastro della Torre" },
    { id: "git-c11", q: "Chi di noi, per sbaglio, si ritroverebbe a fare da guida a un gruppo di turisti in pensione?", titolo: "Guida per sbaglio" },
    { id: "git-c12", q: "Chi di noi, col pullman fermo in campagna per un guasto, organizzerebbe un picnic coi panini rimasti?", titolo: "Picnic d'emergenza" },
    { id: "git-c13", q: "Chi di noi dividerebbe la merenda con il compagno che l'ha dimenticata sul pullman?", titolo: "Panino solidale" },
    { id: "git-c14", q: "Chi di noi, la prima notte di gita, consolerebbe il compagno di stanza che ha nostalgia di casa?", titolo: "Abbraccio di camerata" }
  ]
});

/* ---------------------------------------------------------
   🏖️ IN SPIAGGIA A FERRAGOSTO — momento del posto: L'abbronzatura sbagliata
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "spiaggia", cod: "spi", nome: "In spiaggia a Ferragosto", emoji: "🏖️",
  adesivi: "⛱️🩴🕶️🧴🍉🏐🦀🐚🪣🌊🍦🩱",
  entrata: [
    "Ferragosto, 38 gradi, zero posti. {P} si è portat{o|a} l'ombrellone da casa.",
    "Bagnasciuga pieno come un concerto. {P} arriva con la borsa frigo.",
    "Il bagnino ha già fischiato tre volte. Non si sa perché, ma guarda {P}."
  ],
  immagini: [
    { id: "spi-i01", q: "Chi è il bagnino della spiaggia dove va {P}?", carte: [
      { chi: "bagnino", faccia: "sonno", t: "Dorme sulla torretta dalle 11" },
      { chi: "bagnino", faccia: "esulta", piu: { collo: "fischietto" }, t: "Il megafono non lo spegne mai" },
      { chi: "allenatore", faccia: "arrabbiato", t: "Stretching per tutti alle 9" },
      { chi: "nonno", faccia: "felice", piu: { cappello: "paglia" }, t: "Lo stesso dal 1974: sa tutto" }
    ] },
    { id: "spi-i02", q: "Chi passa sotto l'ombrellone di {P} ogni dieci minuti?", carte: [
      { chi: "contadino", faccia: "esulta", t: "«Cocco bello!» Da tre ore" },
      { chi: "cuoco", faccia: "felice", t: "Bomboloni caldi alle due" },
      { chi: "animatore", faccia: "estasi", piu: { collo: "fischietto" }, t: "Vuole tutti al torneo di bocce" },
      { chi: "clown", faccia: "furbo", piu: { mano: "palloncino" }, t: "Palloncini a forma di squalo" }
    ] },
    { id: "spi-i03", q: "Chi interrompe il pisolino di {P} sotto l'ombrellone?", carte: [
      { chi: "bimbo", faccia: "furbo", t: "Un bimbo col secchiello gelato" },
      { chi: "nonna", faccia: "felice", t: "«È pronta la pasta al forno!»" },
      { chi: "dj", faccia: "esulta", t: "La cassa dell'ombrellone accanto" },
      { chi: "pescatore", faccia: "estasi", t: "Uno che mostra a tutti un polpo" }
    ] },
    { id: "spi-i04", q: "Al falò di Ferragosto, chi si siede accanto a {P}?", carte: [
      { chi: "rockstar", faccia: "estasi", t: "Sa tre accordi, li suona da 3 ore" },
      { chi: "nonno", faccia: "pensieroso", t: "Racconta di quando c'erano i lupi" },
      { chi: "scout", faccia: "felice", t: "Accende il fuoco con due sassi" },
      { chi: "cuoco", faccia: "furbo", t: "Arrostisce salsicce e marshmallow" }
    ] },
    { id: "spi-i05", q: "Chi è il vicino d'ombrellone che il destino assegna a {P}?", carte: [
      { chi: "nonno", faccia: "felice", piu: { mano: "libro" }, t: "Racconta la briscola del '78" },
      { chi: "bimbo", faccia: "furbo", piu: { mano: "gelato" }, t: "Riempie di sabbia le sue ciabatte" },
      { chi: "influencer", faccia: "innamorato", t: "Fa dirette da sei ore col telefono" },
      { chi: "vicino", faccia: "arrabbiato", piu: { cappello: "paglia" }, t: "Sposta l'ombrellone ogni 10 minuti" }
    ] },
    { id: "spi-i06", q: "Gara di tuffi dagli scogli: chi batte {P}?", carte: [
      { chi: "bimbo", faccia: "esulta", t: "Un bimbo di 6 anni, a bomba" },
      { chi: "nonna", faccia: "indifferente", piu: { cappello: "fiori" }, t: "Una nonna: candela perfetta" },
      { chi: "supereroe", faccia: "furbo", t: "Uno col mantello, per la scena" },
      { chi: "pirata", faccia: "linguaccia", t: "Un pirata, dal pedalò" }
    ] },
    { id: "spi-i07", q: "Chi offre a {P} il pranzo di Ferragosto, sotto l'ombrellone?", carte: [
      { chi: "zia", faccia: "estasi", t: "La zia: lasagne per 30, in teglia" },
      { chi: "nonno", faccia: "furbo", t: "Il nonno: anguria fresca di mare" },
      { chi: "papa", faccia: "felice", t: "Il papà: solo panini col salame" },
      { chi: "cuoco", faccia: "esulta", t: "Il vicino: grigliata da 8 chili" }
    ] },
    { id: "spi-i08", q: "{P} nuota oltre le boe. Chi se ne accorge per primo?", carte: [
      { chi: "bagnino", faccia: "arrabbiato", piu: { collo: "fischietto" }, t: "Il bagnino: fischio da stadio" },
      { chi: "pescatore", faccia: "arrabbiato", t: "«Mi spaventi i pesci!»" },
      { chi: "capitano", faccia: "sorpreso", t: "Il capitano del traghetto" },
      { chi: "bimbo", faccia: "linguaccia", t: "Un bimbo, ancora più al largo" }
    ] },
    { id: "spi-i09", q: "Chi insegna a {P} a fare surf (o almeno a provarci)?", carte: [
      { chi: "bagnino", faccia: "furbo", t: "Lo fa vedere una volta. Poi pranza" },
      { chi: "nonno", faccia: "estasi", t: "Surfava nel '70, dice lui" },
      { chi: "bimbo", faccia: "indifferente", t: "Un bimbo di 8 anni, già campione" },
      { chi: "influencer", faccia: "linguaccia", piu: { mano: "telefono" }, t: "Filma ogni caduta" }
    ] },
    { id: "spi-i10", q: "A Ferragosto non c'è un solo posto libero per piantare l'ombrellone. Cosa fa {P}?", carte: [
      { e: "🤝⛱️", t: "Si infila tra due famiglie" },
      { e: "🦎🪨", t: "Sugli scogli, come una lucertola" },
      { e: "🏠🙄", t: "Torna a casa: il mare è troppo" },
      { e: "🗣️⛱️", t: "Convince il bagnino a chiacchiere" }
    ] },
    { id: "spi-i11", q: "Il pallone dei ragazzi accanto finisce per la terza volta sul pranzo di {P}. E {P}?", carte: [
      { e: "⚽😄", t: "Si unisce alla partita" },
      { e: "🔒⚽", t: "Sequestra il pallone fino a sera" },
      { e: "📢🛟", t: "Va a chiamare il bagnino" },
      { e: "🧺🚶", t: "Trasloca e mangia in pace" }
    ] },
    { id: "spi-i12", q: "{P} entra in acqua e sente qualcosa di viscido sotto il piede. Cosa fa?", carte: [
      { e: "🦶💨", t: "Esce di corsa in punta di piedi" },
      { e: "😱🪼", t: "Urla «Medusa!» e svuota il mare" },
      { e: "😂🌿", t: "Ride: sarà un'alga" },
      { e: "🤿👀", t: "Va sott'acqua a vedere cos'è" }
    ] },
    { id: "spi-i13", q: "La crema solare è finita e c'è ancora mezza giornata di sole. Cosa fa {P}?", carte: [
      { e: "🌯🏖️", t: "Si arrotola nell'asciugamano" },
      { e: "🙏🧴", t: "La chiede all'ombrellone accanto" },
      { e: "😎🔥", t: "«Tanto io non mi brucio»" },
      { e: "⛱️🌑", t: "Sotto l'ombrellone fino a sera" }
    ] },
    { id: "spi-i14", q: "Dopo il bagno, {P} scopre di aver perso nella sabbia le chiavi della macchina. E ora?", carte: [
      { e: "🖐️⏳", t: "Setaccia la spiaggia per ore" },
      { e: "📢🚨", t: "Mette in allarme tutto il lido" },
      { e: "📞🔑", t: "Si fa portare quelle di scorta" },
      { e: "😌🌅", t: "Ci pensa domani. Ora: mare" }
    ] },
    { id: "spi-i15", q: "Le infradito di {P} si rompono a 300 metri dalla macchina, sulla sabbia che scotta. Come arriva?", carte: [
      { e: "🔥🦘", t: "A balzi: «Ahi! Ahi! Ahi!»" },
      { e: "🧺👣", t: "Da un asciugamano all'altro" },
      { e: "🛍️🦶", t: "Due sacchetti legati ai piedi" },
      { e: "🚶😐", t: "Cammina piano: non sente niente" }
    ] },
    { id: "spi-i16", q: "{P} prende in prestito il canotto dei bambini accanto e lo buca su uno scoglio. Cosa fa?", carte: [
      { e: "🛒🛟", t: "Confessa e ne compra uno nuovo" },
      { e: "🍦🎁", t: "Lo riporta sgonfio, con un gelato" },
      { e: "🦀👉", t: "Dà la colpa a un granchio" },
      { e: "🩹🙏", t: "Lo rattoppa con un cerotto" }
    ] },
    { id: "spi-i17", q: "Gli amici buttano {P} in mare vestit{o|a}, col telefono in tasca. Come reagisce?", carte: [
      { e: "😂📱", t: "Ride: il telefono era vecchio" },
      { e: "🤐🌅", t: "Non parla con nessuno fino a sera" },
      { e: "🍚🙏", t: "Telefono nel riso, e prega" },
      { e: "🌊😈", t: "Trascina giù il primo che ride" }
    ] },
    { id: "spi-i18", q: "Il bagnino va a pranzo e lascia a {P} torretta e fischietto per mezz'ora. Cosa fa {P}?", carte: [
      { e: "📯😤", t: "Fischia a tutti, anche ai gabbiani" },
      { e: "👑🪑", t: "Sta lassù come sul trono" },
      { e: "🚫🌊", t: "Fa uscire tutti dall'acqua" },
      { e: "🙅😰", t: "Lo restituisce: troppo stress" }
    ] },
    { id: "spi-i19", q: "L'ombrellone accanto offre a {P} un'anguria intera, se balla con loro il ballo di gruppo. E {P}?", carte: [
      { e: "💃🍉", t: "Balla e chiede pure il bis" },
      { e: "🙅🍉", t: "«Non ballo. Neanche per l'anguria»" },
      { e: "👉🕺", t: "Manda un amico al suo posto" },
      { e: "🤪💃", t: "Balla malissimo, apposta" }
    ] },
    { id: "spi-i20", q: "La corrente porta il pedalò di {P} al largo, piano piano. Cosa fa?", carte: [
      { e: "🚲💦", t: "Pedala a tutta verso riva" },
      { e: "😎🛟", t: "Si sdraia e aspetta il bagnino" },
      { e: "🏊💪", t: "Si tuffa e torna a nuoto" },
      { e: "📱🌊", t: "Video: «Sto andando in Croazia»" }
    ] },
    { id: "spi-i21", q: "All'ombrellone accanto, in costume, c'è la prof più severa delle medie di {P}. Cosa fa {P}?", carte: [
      { e: "👋😊", t: "La saluta come se niente fosse" },
      { e: "🏖️🙈", t: "Si sotterra nella sabbia" },
      { e: "🙏📝", t: "Si scusa per il compito copiato" },
      { e: "🫡", t: "Si mette sull'attenti" }
    ] },
    { id: "spi-i22", q: "Che gioco propone {P} sotto l'ombrellone?", carte: [
      { e: "🃏", t: "Briscola a coppie, all'ombra" },
      { e: "🏐☀️", t: "Beach volley a mezzogiorno" },
      { e: "🏎️", t: "Le piste per le biglie" },
      { e: "🦀🪣", t: "Caccia ai granchi sugli scogli" }
    ] },
    { id: "spi-i23", q: "Che faccia fa {P} quando il gelato appena comprato cade nella sabbia?", carte: [
      { lui: "triste", t: "Lo fissa per un minuto intero" },
      { lui: "arrabbiato", t: "Vuole fare causa alla sabbia" },
      { lui: "indifferente", t: "Lo raccoglie e ci soffia sopra" },
      { lui: "linguaccia", t: "Lecca quel che resta sul cono" }
    ] },
    { id: "spi-i24", q: "Che faccia fa {P} quando scopre di aver steso il telo sopra un formicaio?", carte: [
      { lui: "terrore", t: "Balla la tarantella per un'ora" },
      { lui: "disgusto", t: "Il telo lo butta. Anzi, lo brucia" },
      { lui: "sorpreso", t: "Le formiche si son prese il panino" },
      { lui: "indifferente", t: "Le saluta e si rimette giù" }
    ] },
    { id: "spi-i25", q: "Che faccia fa {P} quando il bagnino annuncia: «Bandiera rossa, oggi niente bagno»?", carte: [
      { lui: "triste", t: "Fissa il mare e sospira" },
      { lui: "arrabbiato", t: "Discute col bagnino per un'ora" },
      { lui: "esulta", t: "Finalmente: solo pisolino" },
      { lui: "sonno", t: "Tanto non si bagnava mai" }
    ] },
    { id: "spi-i26", q: "Un amico chiede: «Il pranzo lo portavi tu, vero?». Che faccia fa {P}?", carte: [
      { lui: "terrore", t: "Nessuno ha portato il pranzo" },
      { lui: "furbo", t: "Ha un piano: l'ombrellone accanto" },
      { lui: "triste", t: "Fame. Solo tanta fame" },
      { lui: "indifferente", t: "Ha già mangiato alle 10" }
    ] }
  ],
  scrivi: [
    { id: "spi-s01", q: "Sulla sabbia bagnata, {P} scrive a lettere giganti: «___»",
      riserve: ["Qui c'era il mio asciugamano", "AIUTO: finita la crema", "Bagnino, ti voglio bene"] },
    { id: "spi-s02", q: "{P} prova a fare il morto a galla. Dopo un minuto annuncia: «___»",
      riserve: ["Un pesce mi ha guardato male", "Sono a Malta, venitemi a prendere", "Il morto lo so fare, il galla no"] },
    { id: "spi-s03", q: "{P} sbaglia ombrellone e si sdraia sul lettino di un altro. Al padrone dice: «___»",
      riserve: ["Glielo tenevo caldo", "Bel lettino. Quanto vuole?", "Scusi, da qui sono tutti uguali"] },
    { id: "spi-s04", q: "{P} inventa il tormentone dell'estate. Il ritornello fa: «___»",
      riserve: ["Sabbia nel costume, oh oh oh", "Ombrellone mio, non te ne andare", "Anguria, anguria, sei la mia storia"] },
    { id: "spi-s05", q: "{P} si improvvisa ambulante in spiaggia per un giorno. Cosa urla?",
      riserve: ["Cocco freddo, consigli gratis!", "Ombra in affitto, cinque minuti!", "Gelati sciolti a metà prezzo!"] },
    { id: "spi-s06", q: "La scusa di {P} per non fare il bagno: «___»",
      riserve: ["Ho appena messo la crema", "C'è un granchio che mi guarda", "L'acqua oggi è troppo bagnata"] },
    { id: "spi-s07", q: "{P} scrive la lista delle cose da portare in spiaggia a Ferragosto. L'ultima voce è: «___»",
      riserve: ["la nonna, con la sua sedia", "un piano B: il centro commerciale", "la pazienza per il parcheggio"] },
    { id: "spi-s08", q: "Il bagnino prende il megafono e urla verso {P}: «___»",
      riserve: ["Esca dal pedalò degli altri!", "Ha dimenticato la nonna all'ombrellone", "Le boe non sono un trampolino!"] },
    { id: "spi-s09", q: "Al tramonto tutta la spiaggia applaude il sole che scende. {P} invece urla: «___»",
      riserve: ["Bis! Bis!", "Domani alla stessa ora, mi raccomando", "Era meglio quello di ieri"] },
    { id: "spi-s10", q: "La gelateria del lido inventa un gusto dedicato a {P}. Come si chiama?",
      riserve: ["Crema solare e cocco", "Anguria con sabbia croccante", "Frittata di pasta"] },
    { id: "spi-s11", q: "L'onda più grande di Ferragosto travolge {P}. Prima frase appena riemerge?",
      riserve: ["Ho perso un'infradito e la dignità", "Ancora! Rifacciamola!", "Il panino è salvo?"] },
    { id: "spi-s12", q: "{P} dorme al sole, e gli amici scrivono con la crema sulla sua schiena: «___»",
      riserve: ["Girare tra un'ora", "Non disturbare: in cottura", "Proprietà del bagnino"] },
    { id: "spi-s13", q: "{P} adotta un granchio per tutto il pomeriggio. Che nome gli dà?",
      riserve: ["Pinzetta Secondo", "Il Ragioniere", "Zio Chela"] },
    { id: "spi-s14", q: "Alle 7 di sera se ne vanno tutti, e {P} dice: «___»",
      riserve: ["Ancora cinque minuti, giuro", "Il bagno più bello è adesso", "Qualcuno ha visto la mia macchina?"], voto: "lui" },
    { id: "spi-s15", q: "{P} scuote l'asciugamano controvento e insabbia la famiglia accanto. Si scusa così: «___»",
      riserve: ["Era sabbia d'autore, offro io", "Così vi abbronzate anche dentro", "Il vento ha fatto tutto da solo"] },
    { id: "spi-s16", q: "Sotto l'ombrellone {P} fa il cruciverba. Al «12 orizzontale» scrive: «___»",
      riserve: ["ANGURIA (ci stava, più o meno)", "BOH, in sei lettere", "il nome del bagnino"] },
    { id: "spi-s17", q: "{P} fa il bagno di mezzanotte e scrive al gruppo: «___»",
      riserve: ["Venite, il mare è tutto mio", "Acqua calda. Ma c'è qualcosa", "Ho perso le ciabatte, portate la luce"] }
  ],
  disegna: [
    { id: "spi-d01", q: "Disegna su {P} il segno bianco di occhiali e orologio sull'abbronzatura", su: "ritratto", adesivi: "⌚👓☀️" },
    { id: "spi-d02", q: "Disegna su {P} cuffia, braccioli e tutto ciò che mette per fare il bagno", su: "ritratto", adesivi: "🦆🛟🥽🧴" },
    { id: "spi-d03", q: "Disegna su {P} il naso rosso, la crema a strisce e il cappello di paglia", su: "ritratto", adesivi: "👒🔴🤍" },
    { id: "spi-d04", q: "Disegna su {P} il look da bagnino: fischietto, salvagente e megafono", su: "ritratto", adesivi: "🛟📢🚩" },
    { id: "spi-d05", q: "Disegna su {P} i rimedi contro i 38 gradi: cappello di giornale e altro", su: "ritratto", adesivi: "📰🧊🍉💦" },
    { id: "spi-d06", q: "Disegna su {P} sabbia, alghe e secchiello in testa dopo l'onda più grossa", su: "ritratto", adesivi: "🌿🐟⭐" },
    { id: "spi-d07", q: "Disegna l'ombrellone di {P}, attrezzato per restare dalle 6 alle 20", su: "scena", adesivi: "🧊📺🛋️🍝" },
    { id: "spi-d08", q: "Disegna la doccia del lido quando c'è {P} da mezz'ora: chi c'è in fila?", su: "scena", adesivi: "🚿🧴⏳🧽😤" },
    { id: "spi-d09", q: "Disegna il mare di Ferragosto visto dall'ombrellone di {P}", su: "scena", adesivi: "🦩🛟🚤🐬" },
    { id: "spi-d10", q: "Disegna il pranzo che {P} tira fuori dalla borsa frigo", su: "scena", adesivi: "🍝🥘🍗🥖" },
    { id: "spi-d11", q: "Disegna il materassino gonfiabile dei sogni di {P}", su: "scena", adesivi: "🦄🦩🍩🐊" },
    { id: "spi-d12", q: "Disegna cosa vede {P} quando mette la testa sott'acqua con la maschera", su: "scena", adesivi: "🐠🐙🦑👟" }
  ],
  chi: [
    { id: "spi-c01", q: "Chi di noi arriverebbe in spiaggia alle 6 di mattina per piazzare l'asciugamano in prima fila?", titolo: "Sentinella dell'alba" },
    { id: "spi-c02", q: "Chi di noi porterebbe in spiaggia la parmigiana nella teglia di famiglia, ancora calda?", titolo: "Parmigiana d'ombrellone" },
    { id: "spi-c03", q: "Chi di noi aspetterebbe le tre ore dopo mangiato col cronometro, prima di fare il bagno?", titolo: "Tre ore col cronometro" },
    { id: "spi-c04", q: "Chi di noi giocherebbe a racchettoni proprio sul bagnasciuga, dove passano tutti?", titolo: "Racchettoni tra la folla" },
    { id: "spi-c05", q: "Chi di noi passerebbe Ferragosto in spiaggia ad ascoltare la partita alla radio, a tutto volume?", titolo: "Radiocronista d'ombrellone" },
    { id: "spi-c06", q: "Chi di noi si addormenterebbe sotto l'ombrellone e si sveglierebbe al sole con l'abbronzatura a forma di libro?", titolo: "Abbronzatura col libro" },
    { id: "spi-c07", q: "Chi di noi farebbe un castello di sabbia gigante e poi litigherebbe con le onde che lo distruggono?", titolo: "Castello contro il mare" },
    { id: "spi-c08", q: "Chi di noi si farebbe seppellire nella sabbia fino al collo e poi non riuscirebbe più a uscire?", titolo: "Statua di sabbia" },
    { id: "spi-c09", q: "Chi di noi, a Ferragosto, avrebbe il coraggio di lanciare un gavettone al bagnino?", titolo: "Gavettone al bagnino" },
    { id: "spi-c10", q: "Chi di noi entrerebbe in acqua un centimetro alla volta urlando «è gelata!», ad agosto?", titolo: "Un centimetro alla volta" },
    { id: "spi-c11", q: "Chi di noi, nella partitella in spiaggia, farebbe i pali con le infradito e li stringerebbe quando è in porta?", titolo: "Pali mobili" },
    { id: "spi-c12", q: "Chi di noi, se un delfino arrivasse vicino a riva, gli darebbe subito un nome e ci farebbe amicizia?", titolo: "Battesimo del delfino" },
    { id: "spi-c13", q: "Chi di noi farebbe amicizia con tutto l'ombrellone accanto e finirebbe a pranzo da loro?", titolo: "Parente d'ombrellone" },
    { id: "spi-c14", q: "Chi di noi nuoterebbe contro le onde per riportare a riva il pallone dei bambini?", titolo: "Salvataggio del pallone" }
  ]
});

/* ---------------------------------------------------------
   💘 AL PRIMO APPUNTAMENTO — momento del posto: Il look per l'appuntamento
   (per tutti, mai spinto: al massimo «il bacio», detto così)
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "appuntamento", cod: "app", nome: "Al primo appuntamento", emoji: "💘",
  adesivi: "🌹🕯️🍝💌🎻🍰🕶️👔🎀💐🍫📱",
  entrata: [
    "Tavolo per due, candela accesa. {P} è lì da mezz'ora, in anticipo.",
    "Il violinista si avvicina. {P} legge lo stesso menù da dieci minuti.",
    "Primo appuntamento per {P}. Il cameriere ha già capito tutto."
  ],
  immagini: [
    { id: "app-i01", q: "Chi è il cameriere che serve il tavolo di {P}?", carte: [
      { chi: "cameriere", faccia: "furbo", t: "Resta lì ad ascoltare tutto" },
      { chi: "cantante", faccia: "estasi", t: "Canta mentre versa l'acqua" },
      { chi: "mago", faccia: "linguaccia", t: "Fa sparire il pane, per magia" },
      { chi: "nonno", faccia: "pensieroso", t: "«Ai miei tempi si ballava»" }
    ] },
    { id: "app-i02", q: "Chi c'è al tavolo accanto, a sbirciare il primo appuntamento di {P}?", carte: [
      { chi: "zia", faccia: "furbo", t: "La zia, che prende appunti" },
      { chi: "vicino", faccia: "sorpreso", t: "Il vicino, che lo dirà a tutti" },
      { chi: "influencer", f: "d", faccia: "innamorato", piu: { mano: "telefono" }, t: "Una che fa la diretta della cena" },
      { chi: "prof", faccia: "indifferente", t: "Il prof di mate: corregge il conto" }
    ] },
    { id: "app-i03", q: "Chi arriva a suonare al tavolo di {P} per «creare l'atmosfera»?", carte: [
      { chi: "rockstar", faccia: "esulta", piu: { schiena: "chitarra" }, t: "Chitarra elettrica a tutto volume" },
      { chi: "cantante", faccia: "triste", t: "Canta solo canzoni d'addio" },
      { chi: "nonno", faccia: "felice", t: "Un nonno con la fisarmonica" },
      { chi: "dj", faccia: "furbo", t: "Un DJ con la cassa sul carrello" }
    ] },
    { id: "app-i04", q: "All'ingresso del ristorante, chi blocca {P}?", carte: [
      { chi: "buttafuori", faccia: "indifferente", t: "«Senza cravatta? No»" },
      { chi: "cameriere", faccia: "sorpreso", t: "«La prenotazione? Era per ieri»" },
      { chi: "vigile", faccia: "arrabbiato", t: "Un vigile: multa al motorino" },
      { chi: "nonna", faccia: "estasi", t: "La nonna, che passava di lì" }
    ] },
    { id: "app-i05", q: "Chi riaccompagna {P} a casa dopo l'appuntamento?", carte: [
      { chi: "autista", faccia: "felice", t: "Un taxista che allunga il giro" },
      { chi: "papa", faccia: "sonno", t: "Il papà, che aspettava sotto" },
      { chi: "cugino", faccia: "esulta", t: "Il cugino in motorino, col clacson" },
      { e: "🚌💨", t: "L'ultimo autobus, preso al volo" }
    ] },
    { id: "app-i06", q: "Al ristorante qualcuno riconosce {P} e viene a salutare al tavolo. Chi è?", carte: [
      { chi: "cuoco", faccia: "felice", t: "Lo chef: «Il solito? Carbonara?»" },
      { chi: "prof", f: "d", faccia: "sorpreso", t: "La maestra: «Hai fatto i compiti?»" },
      { chi: "bimbo", faccia: "linguaccia", t: "Il cuginetto: «Lo dico alla zia!»" },
      { chi: "corriere", faccia: "felice", t: "Il corriere: «Domani ripasso, eh»" }
    ] },
    { id: "app-i07", q: "Prima dell'appuntamento, {P} chiede un consiglio. A chi?", carte: [
      { chi: "nonno", faccia: "felice", piu: { mano: "fiore" }, t: "Al nonno: «Porta i fiori, sempre»" },
      { chi: "influencer", faccia: "furbo", t: "Influencer: «Rispondi dopo 3 ore»" },
      { chi: "mago", faccia: "pensieroso", t: "A un mago: il trucco della moneta" },
      { chi: "zia", faccia: "esulta", t: "Alla zia: «Parla subito di nozze»" }
    ] },
    { id: "app-i08", q: "{P} scopre che la persona dell'appuntamento fa un mestiere strano. Quale?", carte: [
      { chi: "clown", faccia: "esulta", t: "Clown alle feste: anche a tavola" },
      { chi: "capitano", faccia: "pensieroso", t: "Capitano di traghetto: solo onde" },
      { chi: "giudice", faccia: "arrabbiato", t: "Giudice di gare di torte: dà voti" },
      { chi: "vigile", faccia: "furbo", t: "Vigile: ha già multato la via" }
    ] },
    { id: "app-i09", q: "Nella passeggiata dopo cena, chi incontra {P}?", carte: [
      { chi: "vicino", faccia: "sonno", piu: { animale: "cane" }, t: "Il vicino in pigiama, col cane" },
      { chi: "zio", faccia: "furbo", t: "Lo zio: «E chi sarebbe, scusa?»" },
      { chi: "cugino", faccia: "felice", t: "Il cugino, che si unisce a loro" },
      { chi: "allenatore", faccia: "arrabbiato", t: "«Domani allenamento alle 8!»" }
    ] },
    { id: "app-i10", q: "A metà cena {P} si accorge di avere un pezzo di insalata tra i denti. Cosa fa?", carte: [
      { e: "🚻🏃", t: "Corre in bagno con una scusa" },
      { e: "🧻🤧", t: "Lo toglie fingendo di tossire" },
      { e: "😂🥬", t: "Ci ride sopra e lo dice subito" },
      { e: "😐🤐", t: "Non sorride più per tutta la sera" }
    ] },
    { id: "app-i11", q: "Arriva il conto. Cosa fa {P}?", carte: [
      { e: "💳🤫", t: "Ha già pagato di nascosto" },
      { e: "➗🧾", t: "Alla romana, al centesimo" },
      { e: "👖🔍", t: "Cerca il portafoglio… per finta" },
      { e: "✊✋", t: "Lo giocano a sasso-carta-forbice" }
    ] },
    { id: "app-i12", q: "L'altro arriva con quaranta minuti di ritardo. Cosa fa {P}?", carte: [
      { e: "🍝😋", t: "Ha già finito l'antipasto" },
      { e: "🙂🕐", t: "«Figurati, ero in ritardo anch'io»" },
      { e: "🧊😒", t: "Un sorriso gelido" },
      { e: "🏠🛌", t: "È già a casa, in pigiama" }
    ] },
    { id: "app-i13", q: "Al tavolo cala un silenzio imbarazzante di dieci secondi. Come lo rompe {P}?", carte: [
      { e: "☁️🗣️", t: "Parla del meteo con impegno" },
      { e: "🎬📖", t: "Racconta un film. Tutto" },
      { e: "📱⏰", t: "Guarda il telefono «per l'ora»" },
      { e: "♈❓", t: "«Allora… di che segno sei?»" }
    ] },
    { id: "app-i14", q: "Il piatto di {P} arriva ed è enorme: una bistecca da un chilo. Cosa fa?", carte: [
      { e: "🥩💪", t: "La finisce tutta, con orgoglio" },
      { e: "📦🥩", t: "Si fa incartare metà" },
      { e: "🍴💕", t: "Ne imbocca un pezzo all'altro" },
      { e: "🥔😇", t: "Mangia solo le patate" }
    ] },
    { id: "app-i15", q: "Dopo cena c'è la passeggiata, ma le scarpe nuove di {P} fanno malissimo. Cosa fa?", carte: [
      { e: "😬👠", t: "Cammina sorridendo, nel dolore" },
      { e: "👣🌙", t: "Prosegue a piedi nudi" },
      { e: "🍦🪑", t: "Propone un gelato, seduti" },
      { e: "😴⏰", t: "«Domani mi alzo prestissimo»" }
    ] },
    { id: "app-i16", q: "L'altro racconta una barzelletta che non fa ridere per niente. Cosa fa {P}?", carte: [
      { e: "😂😂", t: "Ride fortissimo, per gentilezza" },
      { e: "🤡🔁", t: "Ne racconta una ancora peggio" },
      { e: "❓🤔", t: "Chiede di spiegargliela" },
      { e: "🙂➡️", t: "Sorride e cambia discorso" }
    ] },
    { id: "app-i17", q: "«Assaggia, è il mio piatto preferito!». È una cosa che {P} odia. Cosa fa?", carte: [
      { e: "😋👍", t: "Giura che è buonissimo" },
      { e: "🙅🗣️", t: "Confessa subito che lo odia" },
      { e: "🤧🚫", t: "Si inventa un'allergia improvvisa" },
      { e: "🙈🥗", t: "Lo nasconde sotto l'insalata" }
    ] },
    { id: "app-i18", q: "Al dolce, cosa ordina {P}?", carte: [
      { e: "🍰🍰", t: "Uno a testa, grazie" },
      { e: "🍰🥄🥄", t: "Uno solo, con due cucchiaini" },
      { e: "🙅🍴", t: "Niente. Poi ruba dall'altro piatto" },
      { e: "🍰🍰🍰", t: "Tre: uno è di riserva" }
    ] },
    { id: "app-i19", q: "Fine serata, davanti al portone: è il momento dei saluti. Cosa fa {P}?", carte: [
      { e: "💋", t: "Va per il bacio" },
      { e: "🤝📜", t: "Stretta di mano da notaio" },
      { e: "🤗⏳", t: "Abbraccio lunghissimo" },
      { e: "👋🏃", t: "«Ciao ciao!» e scappa di corsa" }
    ] },
    { id: "app-i20", q: "Il cameriere sbaglia tavolo e porta a {P} una torta con le candeline, cantando. Cosa fa {P}?", carte: [
      { e: "🎂🌬️", t: "Spegne le candeline: grazie!" },
      { e: "📢🙏", t: "Spiega l'errore a tutto il locale" },
      { e: "👉🎂", t: "Dice che compie gli anni l'altro" },
      { e: "🎤🎶", t: "Si unisce al coro, più forte" }
    ] },
    { id: "app-i21", q: "Dopo cena l'altro propone: «Andiamo a ballare la salsa?». E {P}?", carte: [
      { e: "💃✨", t: "Inventa i passi tutta la sera" },
      { e: "🦶🤕", t: "Si inventa una caviglia dolorante" },
      { e: "🙋📚", t: "Confessa e chiede una lezione" },
      { e: "🕺🚶", t: "Balla già sul marciapiede" }
    ] },
    { id: "app-i22", q: "Che regalo porta {P} al primo appuntamento?", carte: [
      { e: "📼🎶", t: "Una compilation fatta apposta" },
      { e: "🍫", t: "Cioccolatini (ne mancano metà)" },
      { e: "🎟️⚽", t: "Due biglietti per lo stadio" },
      { e: "🌵", t: "Una piantina grassa: dura di più" }
    ] },
    { id: "app-i23", q: "Dove porta {P} l'altro al primo appuntamento?", carte: [
      { e: "🍕", t: "Alla solita pizzeria" },
      { e: "⛳", t: "Al minigolf: «È romantico, giuro»" },
      { e: "👵🍝", t: "A pranzo dalla nonna" },
      { e: "🎢", t: "Sulle montagne russe" }
    ] },
    { id: "app-i24", q: "Che faccia fa {P} quando l'altro dice: «Io la carbonara la faccio con la panna»?", carte: [
      { lui: "disgusto", t: "Chiede il conto. Subito" },
      { lui: "finto", t: "«Interessante…» (non lo è)" },
      { lui: "sorpreso", t: "Ripensa a tutta la serata" },
      { lui: "innamorato", t: "«Anch'io!» È destino" }
    ] },
    { id: "app-i25", q: "Che faccia fa {P} quando scopre che l'altro ha la sua stessa identica maglietta?", carte: [
      { lui: "esulta", t: "Foto insieme, subito" },
      { lui: "imbarazzo", t: "Si chiude la giacca fino al collo" },
      { lui: "sorpreso", t: "«Quindi siamo una squadra»" },
      { lui: "furbo", t: "Era tutto calcolato" }
    ] },
    { id: "app-i26", q: "Che faccia fa {P} quando l'altro ordina per tutti e due, senza chiedere?", carte: [
      { lui: "arrabbiato", t: "Riordina tutto da capo" },
      { lui: "felice", t: "Meno fatica, grazie" },
      { lui: "finto", t: "«Perfetto!» (odia i funghi)" },
      { lui: "pensieroso", t: "Si segna tutto per la vendetta" }
    ] },
    { id: "app-i27", q: "Che faccia fa {P} quando, «per caso», al ristorante arriva la mamma dell'altro?", carte: [
      { lui: "terrore", t: "Si raddrizza come a un esame" },
      { lui: "finto", t: "Sorriso da foto di matrimonio" },
      { lui: "esulta", t: "Si fa dare subito una ricetta" },
      { lui: "imbarazzo", t: "Si nasconde dietro il menù" }
    ] }
  ],
  scrivi: [
    { id: "app-s01", q: "Il giorno dopo {P} scrive: «Ieri mi sono divertit{o|a} tantissimo, soprattutto quando ___»",
      riserve: ["ci hanno portato il conto sbagliato", "hai riso alla mia barzelletta sul tonno", "il cameriere è inciampato nella borsa"] },
    { id: "app-s02", q: "Il violinista chiede a {P} una dedica. {P} gli sussurra: «Suona ___»",
      riserve: ["quella della pubblicità della pasta", "più forte: mi brontola lo stomaco", "più piano, sto per dire una cosa"] },
    { id: "app-s03", q: "{P} legge all'altro la poesia d'amore scritta per l'occasione. Il primo verso è: «___»",
      riserve: ["Sei più dolce del tiramisù", "Rose rosse, viole blu, il conto tu", "Ti guardo e mi si scioglie il gelato"] },
    { id: "app-s04", q: "{P} scrive il giorno dopo: «Ho parlato di te a mia nonna. Ha detto solo: ___»",
      riserve: ["sì, ma sa cucinare?", "domenica a pranzo da me, niente scuse", "ottimo: ho già comprato i confetti"] },
    { id: "app-s05", q: "{P} scrive al gruppo degli amici: «Com'è andata? Vi dico solo che ___»",
      riserve: ["ha ordinato per me e ha sbagliato tutto", "abbiamo parlato tre ore di gatti", "alla fine ci ha cacciati il cameriere"] },
    { id: "app-s06", q: "L'altro scrive «Ci rivediamo?» e {P} risponde: «Sì, ma solo se ___»",
      riserve: ["il dolce stavolta lo prendiamo intero", "stavolta il violinista lo paghi tu", "porti anche il tuo cane"] },
    { id: "app-s07", q: "Davanti allo specchio, {P} prova la frase per rompere il ghiaccio: «___»",
      riserve: ["Sai che i polpi hanno tre cuori?", "Anche tu respiri? Che coincidenza", "Il pane qui è gratis, vero?"] },
    { id: "app-s08", q: "{P} chiude il menù e ordina con aria sicura: «Per me ___»",
      riserve: ["quello che costa meno, detto bene", "il piatto che non so pronunciare", "lo stesso del tavolo accanto"] },
    { id: "app-s09", q: "«Raccontami qualcosa di te». E {P} racconta: «___»",
      riserve: ["So fare il verso del delfino", "A 9 anni ho vinto una gara di torte", "La mia pianta si chiama Gino"] },
    { id: "app-s10", q: "Prima che esca, la mamma dà a {P} le ultime istruzioni: «___»",
      riserve: ["Niente spaghetti, che ti sporchi", "Mandami una foto, così vedo", "Fai parlare l'altro. Tu mangia"] },
    { id: "app-s11", q: "{P} chiede a un amico una telefonata di salvataggio, se va male: «___»",
      riserve: ["Chiamami alle 21:30: emergenza gatto", "Se scrivo «banana», salvami", "Fingi di essere il mio capo"] },
    { id: "app-s12", q: "Il profilo di {P} sull'app degli appuntamenti dice: «Sono una persona che ___»",
      riserve: ["fa la carbonara (quasi)", "ama le passeggiate fino al frigo", "divide le patatine solo con chi ama"] },
    { id: "app-s13", q: "Rientrando, {P} racconta la serata al cane. Cosa gli dice?",
      riserve: ["Abbiamo un problema: ama i gatti", "Mi ha chiesto di te. Sei famoso", "È andata benissimo. Credo"] },
    { id: "app-s14", q: "«Qual è il tuo piatto preferito?». Per fare colpo, {P} risponde: «___»",
      riserve: ["Il risotto allo zafferano dell'Himalaya", "La carbonara, ma col sushi", "Quello che hai tu nel piatto"] },
    { id: "app-s15", q: "Il cameriere chiede: «Tutto bene qui?». {P} risponde: «___»",
      riserve: ["Sì, se ci porta altro pane", "Ce lo dica lei, ci guarda da un'ora", "Il violinista può andare, grazie"] },
    { id: "app-s16", q: "Quella sera, nel diario segreto, {P} scrive: «___»",
      riserve: ["Ho riso troppo forte, quattro volte", "Non ho rovesciato niente. Record", "Ha detto «a presto». Cosa vorrà dire?"] },
    { id: "app-s17", q: "{P} sbaglia chat e manda all'altro il messaggio per la mamma: «___»",
      riserve: ["Mamma, ho messo la camicia buona", "Tienimi un po' di tiramisù", "Tranquilla, non ho parlato di treni"] }
  ],
  disegna: [
    { id: "app-d01", q: "Disegna su {P} il look per il primo appuntamento: fiore, papillon, fiocco", su: "ritratto", adesivi: "🌹🎀💎" },
    { id: "app-d02", q: "Disegna su {P} il look rovinato dall'acquazzone, appena prima di entrare", su: "ritratto", adesivi: "☔💧🌧️🍃" },
    { id: "app-d03", q: "Disegna su {P} il look «troppo elegante» per andare in pizzeria", su: "ritratto", adesivi: "🎩👑💎🧥" },
    { id: "app-d04", q: "Disegna su {P} la faccia del giorno dopo: cuori, stelline, occhi sognanti", su: "ritratto", adesivi: "💘✨🦋" },
    { id: "app-d05", q: "Disegna su {P} il look preparato in tre minuti, al buio", su: "ritratto", adesivi: "🧦👟🧢" },
    { id: "app-d06", q: "Disegna su {P} i baffi di cioccolato, proprio al momento dei saluti", su: "ritratto", adesivi: "🍫🍰💋" },
    { id: "app-d07", q: "Disegna il tavolo che {P} ha preparato per stupire l'altro", su: "scena", adesivi: "🦢🎆🎈🎶" },
    { id: "app-d08", q: "Disegna il posto segreto dove {P} porta l'altro al secondo appuntamento", su: "scena", adesivi: "🎡🌙🍦🎢" },
    { id: "app-d09", q: "Disegna il piatto che {P} ordina per fare colpo (e che non sa mangiare)", su: "scena", adesivi: "🦞🦀🍝🥢" },
    { id: "app-d10", q: "Disegna cosa succede sotto il tavolo di {P} durante la cena", su: "scena", adesivi: "👠🐈🧦👟" },
    { id: "app-d11", q: "Disegna il «ristorante» dove {P} ha prenotato, sbagliando indirizzo", su: "scena", adesivi: "🔧🛞🐄🏚️" },
    { id: "app-d12", q: "Disegna il portone di {P}, con la famiglia affacciata a spiare il saluto", su: "scena", adesivi: "👵👴🪟🐈🔦" }
  ],
  chi: [
    { id: "app-c01", q: "Chi di noi, al primo appuntamento, parlerebbe per mezz'ora del proprio gatto?", titolo: "Monologo sul gatto" },
    { id: "app-c02", q: "Chi di noi si preparerebbe sul telefono un elenco di argomenti di conversazione, da sbirciare sotto il tavolo?", titolo: "Copione sotto il tavolo" },
    { id: "app-c03", q: "Chi di noi, al primo appuntamento, ordinerebbe il piatto più difficile da mangiare: spaghetti con le cozze?", titolo: "Coraggio con le cozze" },
    { id: "app-c04", q: "Chi di noi passerebbe la cena a fotografare i piatti, chiedendo all'altro di spostarsi per la luce?", titolo: "Foto ai piatti, prego" },
    { id: "app-c05", q: "Chi di noi, quando arriva il violinista al tavolo, si metterebbe a cantarci sopra a squarciagola?", titolo: "Duetto col violinista" },
    { id: "app-c06", q: "Chi di noi si inventerebbe una passione per l'opera per fare colpo, senza averne mai sentita una?", titolo: "Melomane per una sera" },
    { id: "app-c07", q: "Chi di noi, per fare colpo, ordinerebbe in francese sbagliando la pronuncia di tutto il menù?", titolo: "Francese da menù" },
    { id: "app-c08", q: "Chi di noi si farebbe accompagnare dagli amici, nascosti al tavolo accanto con gli occhiali scuri?", titolo: "Scorta segreta" },
    { id: "app-c09", q: "Chi di noi, per l'emozione, chiamerebbe il cameriere «amore»?", titolo: "Amore, il conto!" },
    { id: "app-c10", q: "Chi di noi manderebbe la cronaca della serata al gruppo degli amici prima ancora del dolce?", titolo: "Diretta dal tavolo" },
    { id: "app-c11", q: "Chi di noi si spruzzerebbe mezza boccetta di profumo e farebbe lacrimare il cameriere?", titolo: "Nuvola di profumo" },
    { id: "app-c12", q: "Chi di noi, se la serata andasse benissimo, al dolce starebbe già scegliendo il viaggio di nozze?", titolo: "Matrimonio al dessert" },
    { id: "app-c13", q: "Chi di noi si ricorderebbe per sempre, dal primo appuntamento, il gusto di gelato preferito dell'altro?", titolo: "Memoria da gelato" },
    { id: "app-c14", q: "Chi di noi, se l'altro rovesciasse il bicchiere, ne rovescerebbe uno apposta per non farlo sentire in imbarazzo?", titolo: "Bicchiere solidale" }
  ]
});

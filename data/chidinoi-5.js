/* =========================================================
   DATI — «Chi di Noi?», autore 5: Le feste e la strada
   Posti: 🎂 Alla festa di compleanno (cmp) · 🚗 In viaggio in macchina (mac)
   Più i comuni: 110 missioni del gran finale «Passa il ritratto!» e 40 righe della Voce.
   {P} = nome di chi è sotto torchio. {o|a} = finale maschile|femminile secondo il suo avatar.
   ========================================================= */
window.SG_CHIDINOI = window.SG_CHIDINOI || { posti: [], comuni: [] };

/* ---------------------------------------------------------
   🎂 ALLA FESTA DI COMPLEANNO
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "compleanno", cod: "cmp", nome: "Alla festa di compleanno", emoji: "🎂",
  adesivi: "🎂🕯️🎈🎁🎉🎊🥳🍰🧁👑🎀🍭",
  entrata: [
    "Festa di {P}! Palloncini gonfi, torta pronta, invitati… in ritardo.",
    "Luci spente, candeline accese, tutti zitti: sta arrivando {P}!",
    "Il gruppo «Regalo per {P}» ha 300 messaggi e nessuna idea."
  ],
  immagini: [
    { id: "cmp-i01", q: "Gli amici prenotano un animatore per la festa di {P}. Chi si presenta?", carte: [
      { chi: "animatore", faccia: "esulta", piu: { mano: "microfono" }, t: "Urla «Non vi sento!» ogni 2 minuti" },
      { chi: "clown", faccia: "triste", t: "Si commuove a ogni candelina" },
      { chi: "mago", faccia: "furbo", piu: { animale: "coniglio" }, t: "Fa sparire la torta. Per sempre" },
      { chi: "dj", faccia: "indifferente", t: "Mette solo canzoni del 1997" }
    ] },
    { id: "cmp-i02", q: "Alla festa di {P} c'è un invitato che arriva con un'ora di anticipo. Chi è?", carte: [
      { chi: "zia", faccia: "felice", piu: { mano: "fiore" }, t: "«Vi aiuto!» e sposta tutto" },
      { chi: "nonno", faccia: "indifferente", t: "Si siede: «A che ora si mangia?»" },
      { chi: "bimbo", faccia: "esulta", t: "Ha già aperto un regalo. Il tuo." },
      { chi: "cugino", faccia: "sonno", t: "Ha sbagliato ora: dorme sul divano" }
    ] },
    { id: "cmp-i03", q: "Parte «Tanti auguri» per {P}. Chi rovina il coro?", carte: [
      { chi: "nonna", faccia: "estasi", piu: { mano: "microfono" }, t: "Parte in un'altra tonalità" },
      { chi: "cantante", faccia: "esulta", t: "Fa l'acuto finale lungo un minuto" },
      { chi: "zio", faccia: "furbo", t: "Attacca «Happy birthday» a metà" },
      { chi: "bimbo", faccia: "linguaccia", t: "Soffia le candeline a metà canzone" }
    ] },
    { id: "cmp-i04", q: "La festa di {P} è finita da un'ora, ma un invitato non se ne va. Chi è?", carte: [
      { chi: "nonno", faccia: "sonno", t: "Dorme sul divano: «Cinque minuti»" },
      { chi: "cugino", faccia: "furbo", t: "Finisce gli avanzi, uno per uno" },
      { chi: "vicino", faccia: "felice", piu: { mano: "tazza" }, t: "Racconta le vacanze del '99" },
      { chi: "zio", faccia: "esulta", t: "Aiuta a pulire: rompe due piatti" }
    ] },
    { id: "cmp-i05", q: "Gli amici organizzano una festa a sorpresa per {P}. Chi la fa saltare?", carte: [
      { chi: "mamma", faccia: "felice", piu: { mano: "telefono" }, t: "Scrive l'invito anche a te" },
      { chi: "influencer", faccia: "innamorato", t: "Mette la sorpresa nelle storie" },
      { chi: "zio", faccia: "esulta", t: "Urla «Sorpresa!» al postino" },
      { chi: "nonno", faccia: "sonno", t: "Si addormenta dietro al divano" }
    ] },
    { id: "cmp-i06", q: "Chi prepara la torta per la festa di {P}?", carte: [
      { chi: "cuoco", faccia: "estasi", t: "Cinque piani, per sei invitati" },
      { chi: "nonna", faccia: "felice", t: "Pan di Spagna di sempre: 4 chili" },
      { chi: "papa", faccia: "imbarazzo", t: "Ha seguito un video: è uscita a S" },
      { chi: "cugino", faccia: "furbo", t: "A forma di videogioco: è crollata" }
    ] },
    { id: "cmp-i07", q: "Chi vince il premio «invitato più elegante» alla festa di {P}?", carte: [
      { chi: "elegante", faccia: "felice", piu: { collo: "papillon" }, t: "Smoking, per una festa in pizzeria" },
      { chi: "nonno", faccia: "finto", t: "Scarpe lucidate a specchio dal '75" },
      { chi: "rockstar", faccia: "indifferente", t: "Giubbotto di pelle anche a luglio" },
      { chi: "bimbo", faccia: "esulta", piu: { collo: "papillon" }, t: "Cravattino e scarpe che fanno luce" }
    ] },
    { id: "cmp-i08", q: "Chi fa le foto alla festa di {P}?", carte: [
      { chi: "influencer", faccia: "innamorato", t: "Si fa i selfie con la tua torta" },
      { chi: "nonno", faccia: "sorpreso", piu: { mano: "telefono" }, t: "Tutte col dito davanti" },
      { chi: "zia", faccia: "furbo", t: "Ti becca sempre a bocca piena" },
      { chi: "papa", faccia: "pensieroso", t: "Video in verticale, col flash" }
    ] },
    { id: "cmp-i09", q: "Chi resta appiccicato a {P} per tutta la festa, senza mollare un attimo?", carte: [
      { chi: "nonno", faccia: "felice", t: "Racconta di quando c'era la lira" },
      { chi: "bimbo", faccia: "furbo", piu: { mano: "lecca" }, t: "Ti ruba le patatine dal piatto" },
      { chi: "zia", faccia: "sorpreso", piu: { collo: "perle" }, t: "«Mi sistemi il telefono? Fa bip»" },
      { chi: "cugino", faccia: "indifferente", t: "Vuole la password del wi-fi" }
    ] },
    { id: "cmp-i10", q: "Chi chiama {P} alle 7 di mattina per fare gli auguri?", carte: [
      { chi: "nonna", faccia: "estasi", piu: { mano: "telefono" }, t: "Canta tutta la canzone. Due volte" },
      { chi: "zio", faccia: "felice", t: "Sbaglia età: te ne dà dieci in più" },
      { chi: "mamma", faccia: "innamorato", t: "Rivive la tua nascita, in diretta" },
      { chi: "capo", faccia: "indifferente", piu: { mano: "tazza" }, t: "«Auguri! E quel file?»" }
    ] },
    { id: "cmp-i11", q: "Alla festa, chi trascina {P} in pista a ballare?", carte: [
      { chi: "ballerino", faccia: "estasi", t: "Salsa, giravolte e casquè finale" },
      { chi: "nonna", faccia: "esulta", t: "Il liscio: non ti lascia più" },
      { chi: "animatore", faccia: "esulta", piu: { collo: "fischietto" }, t: "Il trenino, e tu sei la locomotiva" },
      { chi: "bimbo", faccia: "felice", t: "Balla sui tuoi piedi, scalzo" }
    ] },
    { id: "cmp-i12", q: "{P} si ricorda della festa di un amico all'ultimo minuto. Che regalo porta?", carte: [
      { e: "🌹⛽", t: "Fiori presi al distributore" },
      { e: "💌🤗", t: "Un buono «vale un abbraccio»" },
      { e: "🧴🛒", t: "Un bagnoschiuma del supermercato" },
      { e: "🖼️🤳", t: "Una vostra foto stampata al volo" }
    ] },
    { id: "cmp-i13", q: "Il regalo che {P} porta alla festa è riciclato. Cosa lo tradisce?", carte: [
      { e: "🏷️👵", t: "Dentro: «Per Ciccio, dalla zia»" },
      { e: "🎄📦", t: "Carta di Natale. Siamo a luglio." },
      { e: "🧾📅", t: "Lo scontrino di tre anni fa" },
      { e: "🎁🔁", t: "Lo aveva ricevuto dal festeggiato" }
    ] },
    { id: "cmp-i14", q: "Si spengono le luci, arriva la torta con le candeline accese. Cosa fa {P}?", carte: [
      { e: "💨🕯️", t: "Tutte al primo soffio: applausi" },
      { e: "🌬️🕯️", t: "Soffia un minuto, ne spegne due" },
      { e: "👶💨", t: "Fa soffiare i bambini al suo posto" },
      { e: "🤳🕯️", t: "Prima la foto: si sciolgono tutte" }
    ] },
    { id: "cmp-i15", q: "Il giorno dopo la sua festa, cosa fa {P}?", carte: [
      { e: "🧹🎊", t: "Trova coriandoli fino a Natale" },
      { e: "🍰🛌", t: "Colazione a letto con la torta" },
      { e: "📝🎁", t: "Segna chi ha regalato cosa" },
      { e: "🛍️🔁", t: "Cambia tre regali su quattro" }
    ] },
    { id: "cmp-i16", q: "{P} organizza la sua festa. Dove?", carte: [
      { e: "🍕🏠", t: "Pizzeria sotto casa, come sempre" },
      { e: "🎳👟", t: "Bowling con le scarpe a noleggio" },
      { e: "🛋️🍿", t: "A casa: divano, pizza e film" },
      { e: "🏰🎉", t: "Villa affittata per 80 persone" }
    ] },
    { id: "cmp-i17", q: "È sera e nessuno si è ricordato del compleanno di {P}. Cosa fa?", carte: [
      { e: "📢📱", t: "Dieci storie con una candelina" },
      { e: "🤐📅", t: "Non dice niente. Per un anno." },
      { e: "✍️💬", t: "Scrive nel gruppo «oggi è il 12»" },
      { e: "🎂🍴", t: "Si compra la torta e la finisce" }
    ] },
    { id: "cmp-i18", q: "Si fa la colletta per il regalo di un amico. Cosa fa {P}?", carte: [
      { e: "💶⏳", t: "«Te li do dopo». Mai visti." },
      { e: "📊📝", t: "Fa la tabella di chi ha pagato" },
      { e: "💡🙅", t: "Boccia ogni idea, non ne propone" },
      { e: "🎁🤷", t: "Paga, ma non sa cosa si regala" }
    ] },
    { id: "cmp-i19", q: "Cosa porta {P} a una festa, oltre al regalo?", carte: [
      { e: "🥤🍟", t: "Due litri di aranciata e patatine" },
      { e: "🔊🎶", t: "La cassa, e la playlist è sua" },
      { e: "🎲⏳", t: "Un gioco da tavolo che dura 3 ore" },
      { e: "🐶❓", t: "Il cane, senza chiedere a nessuno" }
    ] },
    { id: "cmp-i20", q: "Per la sua festa dei 100 anni, cosa vuole {P}?", carte: [
      { e: "📺🎤", t: "La diretta in prima serata" },
      { e: "🎂💨", t: "100 candeline, un soffio solo" },
      { e: "🪩💃", t: "Discoteca fino all'alba" },
      { e: "🛋️😴", t: "Niente festa: dormire, finalmente" }
    ] },
    { id: "cmp-i21", q: "Il palloncino a elio di {P} vola via. Cosa fa {P}?", carte: [
      { e: "🏃🎈", t: "Lo insegue fino alla rotonda" },
      { e: "🪜🌳", t: "Va a prendere la scala del vicino" },
      { e: "😢👋", t: "Lo saluta come un figlio che parte" },
      { e: "🤷🎈", t: "«L'ho liberato apposta»" }
    ] },
    { id: "cmp-i22", q: "Alla festa di {P} si rompe la cassa e finisce la musica. Cosa fa {P}?", carte: [
      { e: "🎤🗣️", t: "Canta a cappella, tutte le canzoni" },
      { e: "📱🥛", t: "Telefono nel bicchiere, a palla" },
      { e: "🥁🍳", t: "Batteria con le pentole di casa" },
      { e: "🏃🛒", t: "Corre a comprare una cassa nuova" }
    ] },
    { id: "cmp-i23", q: "{P} riceve in regalo un mobile da montare: 2.000 pezzi. Cosa fa?", carte: [
      { e: "📜🧐", t: "Istruzioni lette dalla prima riga" },
      { e: "🔨😤", t: "Monta a occhio: avanzano 12 viti" },
      { e: "📦🗄️", t: "Resta in cantina, nella scatola" },
      { e: "📞🧰", t: "Chiama lo zio che «sa fare tutto»" }
    ] },
    { id: "cmp-i24", q: "Tutti urlano «Sorpresa!» e si accende la luce. Che faccia fa {P}?", carte: [
      { lui: "terrore", t: "Lancia in aria la spesa" },
      { lui: "finto", t: "Lo sapeva da una settimana" },
      { lui: "estasi", t: "Abbraccia anche chi non conosce" },
      { lui: "arrabbiato", t: "«Ero in tuta, potevate dirlo!»" }
    ] },
    { id: "cmp-i25", q: "{P} scarta un regalo orribile davanti a chi gliel'ha fatto. Che faccia fa?", carte: [
      { lui: "finto", t: "«Proprio quello che volevo!»" },
      { lui: "pensieroso", t: "«Che bello! Ehm… cos'è?»" },
      { lui: "furbo", t: "Cerca già lo scontrino" },
      { lui: "imbarazzo", t: "Lo prova subito, per gentilezza" }
    ] },
    { id: "cmp-i26", q: "Sull'invito c'è scritto «festa a tema». Come si presenta {P}?", carte: [
      { lui: "esulta", piu: { schiena: "mantello" }, t: "Mantello: il lenzuolo del letto" },
      { lui: "indifferente", piu: { occhiali: "sole" }, t: "Occhiali da sole: «Sono una star»" },
      { lui: "innamorato", piu: { cappello: "coniglio" }, t: "Orecchie da coniglio, ogni anno" },
      { lui: "imbarazzo", piu: { cappello: "vichingo" }, t: "Elmo vichingo. Il tema: «pigiama»" }
    ] },
    { id: "cmp-i27", q: "Qualcuno chiede a {P} «Ma quanti anni fai?» davanti a tutti. Che faccia fa?", carte: [
      { lui: "furbo", t: "Se ne toglie cinque, serenamente" },
      { lui: "sorpreso", t: "Deve contare sulle dita" },
      { lui: "indifferente", t: "Dice l'età precisa, coi mesi" },
      { lui: "linguaccia", t: "«Diciotto! Come ogni anno»" }
    ] },
    { id: "cmp-i28", q: "Tutti cantano «Tanti auguri» guardando {P}. Che faccia fa?", carte: [
      { lui: "imbarazzo", t: "Non sa dove mettere le mani" },
      { lui: "esulta", t: "Dirige il coro a braccia larghe" },
      { lui: "finto", t: "Sorriso fisso per 40 secondi" },
      { lui: "felice", t: "Canta: «Tanti auguri a meee!»" }
    ] }
  ],
  scrivi: [
    { id: "cmp-s01", q: "Il pasticcere sbaglia la scritta sulla torta di {P}. C'è scritto: «___»",
      riserve: ["Auguri Pierpaola", "Buona pensione, ragioniere", "Benvenuto al mondo, 3 chili e 2"] },
    { id: "cmp-s02", q: "{P} manda un vocale di auguri lungo 4 minuti. Come comincia?",
      riserve: ["Allora, premessa: ho poco tempo…", "Aspetta che esco dalla galleria", "Scusa, era ieri? Vabbè, auguri!"] },
    { id: "cmp-s03", q: "Alla zia che commenta ogni sua foto con «Auguri!!!», {P} risponde: «___»",
      riserve: ["Grazie zia, sì, mangio", "Zia, è la foto del cane", "Zia, il compleanno era a marzo"] },
    { id: "cmp-s04", q: "{P} si alza per fare il discorso alla sua festa. Qual è la prima frase?",
      riserve: ["Grazie a tutti, tranne a chi sa lui", "Brevemente: punto primo…", "Prima di tutto: dov'è il bagno?"] },
    { id: "cmp-s05", q: "{P} inventa una strofa nuova: «Tanti auguri a te, ___»",
      riserve: ["la pizza la paghi te", "il regalo è per me?", "c'è il bis del bignè"] },
    { id: "cmp-s06", q: "Alla festa gira il biglietto gigante da firmare. {P} scrive: «___»",
      riserve: ["Auguri! (scusa, chi sei?)", "Ho preso due fette, perdonami", "Cento di questi giorni, ma con le ferie"] },
    { id: "cmp-s07", q: "{P} prepara il quiz «Quanto conosci il festeggiato?». La domanda più difficile è: «___»",
      riserve: ["Come si chiamava il suo criceto?", "Cosa ha mangiato martedì a pranzo?", "Quante volte ha detto «basta torta»?"] },
    { id: "cmp-s08", q: "{P} nasconde la torta della sorpresa in macchina. Al festeggiato che vuole salire dice: «___»",
      riserve: ["Non salire, c'è un'ape. Enorme", "Dietro è pieno di… compiti", "Oggi la macchina è chiusa per ferie"] },
    { id: "cmp-s09", q: "{P} ha dimenticato il compleanno del suo migliore amico. Che scusa scrive?",
      riserve: ["Era un test, e l'hai superato", "Così sono in anticipo per l'anno dopo", "Il calendario era fermo a febbraio"] },
    { id: "cmp-s10", q: "{P} arriva con l'unico palloncino rimasto in negozio. C'è scritto: «___»",
      riserve: ["Bentornato dalle vacanze", "È un maschio!", "Auguri per gli 81 anni, Ugo"] },
    { id: "cmp-s11", q: "{P} risponde all'invito di una festa dove non vuole andare. Cosa scrive?",
      riserve: ["Ci sono! Ah no, c'è la nonna", "Vengo, ma solo per la torta", "Ho già un impegno: il divano"] },
    { id: "cmp-s12", q: "Sul cartellone degli auguri c'è scritto: «{P}, ti ricordi quando ___»",
      riserve: ["hai spento le candeline di un altro?", "hai aperto i regali prima della festa?", "ci hai fatto cantare tre volte?"] },
    { id: "cmp-s13", q: "Mentre tutti cantano, {P} esprime il desiderio ad alta voce: «___»",
      riserve: ["Che lo zio non faccia il discorso", "Un'altra torta, solo per me", "Ferie da oggi a settembre"] },
    { id: "cmp-s14", q: "Sull'invito alla festa di {P} c'è una regola in fondo: «Vietato ___»",
      riserve: ["arrivare prima delle 9 (zia)", "portare la chitarra (Mario)", "dire «ai miei tempi»"] },
    { id: "cmp-s15", q: "Alla festa si gioca a «obbligo o verità». Il gruppo dà a {P} l'obbligo: «___»",
      riserve: ["chiama la nonna e cantale gli auguri", "balla il liscio con lo zio", "mangia la candelina di marzapane"] },
    { id: "cmp-s16", q: "Nel biglietto della nonna per {P} c'è scritto: «___»",
      riserve: ["Dentro ci sono 10 euro, non spenderli", "Copriti, che arriva l'inverno", "Mangia di più. Firmato: nonna"] },
    { id: "cmp-s17", q: "Le candeline sono quelle magiche che si riaccendono. Al terzo tentativo, {P} dice: «___»",
      riserve: ["Va bene, mi tengo un anno in più", "Chiamate i pompieri, è un ordine", "Il desiderio vale lo stesso, vero?"], voto: "lui" },
    { id: "cmp-s18", q: "Gli amici fanno a {P} un regalo di gruppo un po' strano. Cos'è?",
      riserve: ["Un corso di yodel, già pagato", "Una capra adottata a distanza", "Cento barattoli del sugo della nonna"] }
  ],
  disegna: [
    { id: "cmp-d01", q: "Disegna la torta di {P}, come la sogna davvero", su: "scena", adesivi: "🍓🍫🍩🦄🏰🍕" },
    { id: "cmp-d02", q: "Disegna su {P} il costume da torta, con le candeline in testa", su: "ritratto", adesivi: "🎂🕯️🍓🍫" },
    { id: "cmp-d03", q: "Disegna dove si nascondono gli amici per la festa a sorpresa di {P}", su: "scena", adesivi: "🛋️🚪🪴🧥🙈🦶" },
    { id: "cmp-d04", q: "Disegna su {P} il risultato dello scherzo della torta in faccia", su: "ritratto", adesivi: "🍰🍓🧁💥🍫🍒" },
    { id: "cmp-d05", q: "Disegna il regalo che {P} sogna da anni e nessuno fa mai", su: "scena", adesivi: "🐶🚗🏝️🎮🛵🐴" },
    { id: "cmp-d06", q: "Disegna su {P} i bigliettini d'auguri attaccati addosso dagli amici", su: "ritratto", adesivi: "💌📝⭐❤️🎀" },
    { id: "cmp-d07", q: "Disegna il regalo incartato da {P}: si capisce subito cos'è", su: "scena", adesivi: "📰🧻🎀🩹📦🎸" },
    { id: "cmp-d08", q: "Disegna il salotto la mattina dopo la festa di {P}", su: "scena", adesivi: "🥤🍕🧹😴🧦🍿" },
    { id: "cmp-d09", q: "Disegna su {P} la tuta da supereroe con i suoi anni sul petto", su: "ritratto", adesivi: "🦸⚡🎂⭐" },
    { id: "cmp-d10", q: "Disegna il castello gonfiabile che {P} ha affittato per la festa", su: "scena", adesivi: "🏰🦖🤸🎪🐙🌈" },
    { id: "cmp-d11", q: "Disegna su {P} corona, fascia e mantello: oggi è il suo giorno", su: "ritratto", adesivi: "🎖️✨💎🦚🌹🏆" },
    { id: "cmp-d12", q: "Disegna il sacchetto-ricordo che {P} regala a ogni invitato", su: "bianco", adesivi: "🍬🪀🧸🍭🎈" },
    { id: "cmp-d13", q: "Disegna cosa esce dalla pentolaccia alla festa di {P}", su: "scena", adesivi: "🍬🧦🐸🪀🍫🦆" }
  ],
  chi: [
    { id: "cmp-c01", q: "Chi di noi si ricorderebbe il compleanno di tutti, anche del cane del vicino, ma non il proprio?", titolo: "Calendario umano" },
    { id: "cmp-c02", q: "Chi di noi ruberebbe la ciliegina dalla torta prima ancora che accendano le candeline?", titolo: "Agguato alla ciliegina" },
    { id: "cmp-c03", q: "Chi di noi regalerebbe una cosa fatta a mano, così storta da diventare bellissima?", titolo: "Bottega del cuore" },
    { id: "cmp-c04", q: "Chi di noi si offrirebbe di fare animazione alla festa dei bambini e finirebbe in ostaggio tra le stelle filanti?", titolo: "Animazione in ostaggio" },
    { id: "cmp-c05", q: "Chi di noi, alla festa di un amico, passerebbe due ore a chiacchierare con sua nonna?", titolo: "Nipote d'adozione" },
    { id: "cmp-c06", q: "Chi di noi aprirebbe i regali così piano, staccando lo scotch con cura, da far impazzire tutti?", titolo: "Bradipo dei pacchetti" },
    { id: "cmp-c07", q: "Chi di noi arriverebbe alla festa con un'ora di ritardo e una torta gelato già sciolta?", titolo: "Gelato, gusto ritardo" },
    { id: "cmp-c08", q: "Chi di noi, a 30 anni, vorrebbe ancora il clown e lo zucchero filato alla sua festa?", titolo: "Infanzia eterna" },
    { id: "cmp-c09", q: "Chi di noi manderebbe gli auguri a mezzanotte in punto, con la sveglia puntata apposta?", titolo: "Sveglia degli auguri" },
    { id: "cmp-c10", q: "Chi di noi sbaglierebbe locale e canterebbe «Tanti auguri» al tavolo di sconosciuti?", titolo: "Festa a caso" },
    { id: "cmp-c11", q: "Chi di noi inciamperebbe al buio con la torta in mano… e la salverebbe all'ultimo con un tuffo?", titolo: "Portiere della torta" },
    { id: "cmp-c12", q: "Chi di noi resterebbe ad aiutare a pulire alle 2 di notte, quando gli altri sono spariti?", titolo: "Angelo delle pulizie" },
    { id: "cmp-c13", q: "Chi di noi porterebbe lo stesso regalo di un altro invitato… e direbbe che fanno un set?", titolo: "Doppione da collezione" },
    { id: "cmp-c14", q: "Chi di noi gonfierebbe tutti i palloncini a fiato, restando senza voce per la torta?", titolo: "Mantice della festa" }
  ]
});

/* ---------------------------------------------------------
   🚗 IN VIAGGIO IN MACCHINA
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "macchina", cod: "mac", nome: "In viaggio in macchina", emoji: "🚗",
  adesivi: "🚗🗺️🧭⛽🎵🍔🧳🐶🛞🚧🧃🛣️",
  entrata: [
    "Partenza alle 6 in punto. Sono le 8 e {P} carica ancora la valigia.",
    "Pieno fatto, playlist pronta, navigatore acceso. Al volante: {P}.",
    "Chilometro 3. Dal sedile dietro, già: «{P}, quanto manca?»"
  ],
  immagini: [
    { id: "mac-i01", q: "All'ultimo un amico dà buca: chi prende il suo posto in macchina, accanto a {P}?", carte: [
      { chi: "nonno", faccia: "pensieroso", t: "A ogni curva: «Io qui frenavo»" },
      { chi: "bimbo", faccia: "furbo", piu: { mano: "lecca" }, t: "Calcia il sedile da Bologna in poi" },
      { chi: "dj", faccia: "estasi", t: "Canta in cuffia, stonato e felice" },
      { chi: "influencer", faccia: "innamorato", t: "Fa una diretta a ogni casello" }
    ] },
    { id: "mac-i02", q: "{P} non trova la strada e chiede a un passante. Chi è?", carte: [
      { chi: "contadino", faccia: "felice", piu: { cappello: "paglia" }, t: "«Dritto, poi dove c'era il bar»" },
      { chi: "vigile", faccia: "arrabbiato", t: "Fischia e indica tre direzioni" },
      { chi: "nonna", faccia: "felice", t: "Non lo sa, ma ti offre i biscotti" },
      { chi: "turista", faccia: "sorpreso", t: "Un turista più perso di te" }
    ] },
    { id: "mac-i03", q: "Il navigatore di {P} cambia voce. Di chi è la voce nuova?", carte: [
      { chi: "zia", faccia: "sorpreso", piu: { mano: "telefono" }, t: "«Rallenta! E hai mangiato?»" },
      { chi: "allenatore", faccia: "esulta", t: "«Freccia! Grande! Così si fa!»" },
      { chi: "presentatore", faccia: "estasi", t: "«Ecco a voi… l'uscita numero 2!»" },
      { chi: "prof", faccia: "pensieroso", t: "Interroga: «Capitale del Molise?»" }
    ] },
    { id: "mac-i04", q: "Chi presta la macchina a {P} per il viaggio?", carte: [
      { chi: "nonno", faccia: "felice", t: "Una Panda del '91: «Va benissimo»" },
      { chi: "zia", faccia: "furbo", piu: { collo: "perle" }, t: "Con dodici regole sul cruscotto" },
      { chi: "cugino", faccia: "linguaccia", t: "Stereo bloccato su Radio Liscio" },
      { chi: "papa", faccia: "terrore", piu: { mano: "telefono" }, t: "Chiama ogni ora: «E la frizione?»" }
    ] },
    { id: "mac-i05", q: "Durante il viaggio, chi chiama {P} ogni mezz'ora?", carte: [
      { chi: "mamma", faccia: "sorpreso", piu: { mano: "telefono" }, t: "«Siete arrivati? Avete mangiato?»" },
      { chi: "nonna", faccia: "felice", t: "«Passate: ho fatto le polpette»" },
      { chi: "vicino", faccia: "pensieroso", t: "«Hai lasciato la finestra aperta»" },
      { chi: "zio", faccia: "furbo", t: "Ti spiega una strada più corta" }
    ] },
    { id: "mac-i06", q: "Al casello c'è una coda infinita. Chi c'è davanti a {P}?", carte: [
      { chi: "zio", faccia: "indifferente", t: "Paga in monetine da 5 centesimi" },
      { chi: "cowboy", faccia: "arrabbiato", t: "Litiga con la sbarra, e perde" },
      { chi: "nonna", faccia: "felice", t: "Chiacchiera col casellante: 10 min" },
      { chi: "autista", faccia: "sonno", t: "Ha sbagliato porta: fa retromarcia" }
    ] },
    { id: "mac-i07", q: "Dopo 500 km, chi si offre di guidare al posto di {P}?", carte: [
      { chi: "capitano", faccia: "esulta", t: "«Virare a destra, ciurma!»" },
      { chi: "re", faccia: "estasi", t: "Guida come se avesse la scorta" },
      { chi: "pirata", faccia: "furbo", t: "«So una scorciatoia» (è sterrata)" },
      { chi: "scout", faccia: "felice", piu: { schiena: "zaino" }, t: "Cartina, bussola e merenda pronte" }
    ] },
    { id: "mac-i08", q: "Il vigile ferma {P} per un controllo. Com'è il vigile?", carte: [
      { chi: "vigile", f: "u", faccia: "arrabbiato", t: "Lo stesso di ieri. Ti riconosce." },
      { chi: "vigile", f: "d", faccia: "felice", t: "Fa i complimenti per la playlist" },
      { chi: "vigile", f: "u", faccia: "furbo", t: "Chiede un passaggio fino a casa" },
      { chi: "vigile", f: "d", faccia: "sonno", t: "Si addormenta leggendo la patente" }
    ] },
    { id: "mac-i09", q: "Al semaforo rosso, chi c'è nella macchina accanto a {P}?", carte: [
      { chi: "nonno", faccia: "esulta", piu: { occhiali: "sole" }, t: "Ha la musica più alta della tua" },
      { chi: "sposo", f: "d", faccia: "esulta", t: "Due sposi, con le lattine dietro" },
      { chi: "prof", faccia: "arrabbiato", t: "Ti guarda male: musica alta" },
      { chi: "poliziotto", faccia: "finto", t: "Ti fa segno: «Cintura!»" }
    ] },
    { id: "mac-i10", q: "Al volante, la musica la sceglie {P}. Cosa si ascolta?", carte: [
      { e: "📻⚽", t: "La partita alla radio, a volume 40" },
      { e: "🎤🌸", t: "Solo Sanremo, dal 1980 a oggi" },
      { e: "🎧📚", t: "Un podcast sul Medioevo, 6 puntate" },
      { e: "📻🎙️", t: "Radio locale con le dediche" }
    ] },
    { id: "mac-i11", q: "Il bagaglio non entra nel bagagliaio. Cosa fa {P}?", carte: [
      { e: "🧳🦵", t: "Ci sale sopra e salta" },
      { e: "🧳📐", t: "Rifà tutto da capo, con metodo" },
      { e: "🗑️👕", t: "Lascia a casa le cose degli altri" },
      { e: "🛍️😬", t: "Sacchetti sulle gambe di tutti" }
    ] },
    { id: "mac-i12", q: "Bisogna decidere chi sta davanti. Come si prende il posto {P}?", carte: [
      { e: "🏃📢", t: "Urla «Davanti!» da 100 metri" },
      { e: "🤢💺", t: "«Dietro mi viene la nausea»" },
      { e: "📜✋", t: "L'ha prenotato una settimana fa" },
      { e: "😇💺", t: "Lo lascia agli altri. Sempre." }
    ] },
    { id: "mac-i13", q: "Cosa mangia {P} durante il viaggio?", carte: [
      { e: "🥪🍳", t: "Panini con la frittata, da casa" },
      { e: "🍬🌿", t: "Caramelle alla menta per 300 km" },
      { e: "🍫☀️", t: "Cioccolata sciolta sul cruscotto" },
      { e: "🍔🍟", t: "Si ferma per ogni panino possibile" }
    ] },
    { id: "mac-i14", q: "Cosa c'è appeso allo specchietto della macchina di {P}?", carte: [
      { e: "🌲👃", t: "Alberello senza profumo dal 2019" },
      { e: "🧸🔑", t: "Tre peluche e un portachiavi" },
      { e: "🎲🎲", t: "I dadi di peluche, anni '80" },
      { e: "🌶️🍀", t: "Il cornetto rosso portafortuna" }
    ] },
    { id: "mac-i15", q: "Cosa trovi sotto il sedile della macchina di {P}?", carte: [
      { e: "🍟📅", t: "Una patatina dell'anno scorso" },
      { e: "🧦❓", t: "Un calzino. Di chi? Mistero." },
      { e: "🪙🅿️", t: "Monetine per tutti i parcheggi" },
      { e: "✨🧽", t: "Niente: aspira ogni sabato" }
    ] },
    { id: "mac-i16", q: "Che scusa trova {P} per non guidare?", carte: [
      { e: "👓🌙", t: "«Di sera non vedo bene»" },
      { e: "🚗❓", t: "«Non conosco questa macchina»" },
      { e: "😴🛋️", t: "«Dietro dormo meglio»" },
      { e: "🎵👑", t: "«Io metto la musica, è un lavoro»" }
    ] },
    { id: "mac-i17", q: "{P} deve parcheggiare in un posto strettissimo. Come va?", carte: [
      { e: "🅿️👏", t: "Al primo colpo. Applausi dal bar" },
      { e: "🔁⏱️", t: "Dodici manovre e venti minuti" },
      { e: "🚶🅿️", t: "Rinuncia: parcheggia a 2 km" },
      { e: "🙋🔑", t: "Fa scendere un amico: «Fallo tu»" }
    ] },
    { id: "mac-i18", q: "Il clima in macchina lo decide {P}. Com'è?", carte: [
      { e: "🥶❄️", t: "Aria condizionata a 16 gradi" },
      { e: "🥵🔥", t: "Riscaldamento acceso ad agosto" },
      { e: "🌬️🪟", t: "Finestrini giù, capelli ovunque" },
      { e: "🔁🌡️", t: "Cambia idea ogni due minuti" }
    ] },
    { id: "mac-i19", q: "La macchina di {P} fa un rumore strano. Cosa fa {P}?", carte: [
      { e: "🔊🎵", t: "Alza la radio: rumore sparito" },
      { e: "🔧🧐", t: "Apre il cofano, annuisce: «Eh, sì»" },
      { e: "📞🗣️", t: "Imita il rumore al meccanico" },
      { e: "🤞🚗", t: "Incrocia le dita fino all'arrivo" }
    ] },
    { id: "mac-i20", q: "In viaggio, ogni quanto vuole fermarsi {P}?", carte: [
      { e: "🚫⏱️", t: "Mai: si arriva senza soste" },
      { e: "☕🔁", t: "Ogni 50 km, per il caffè" },
      { e: "🌄📸", t: "A ogni panorama, per la foto" },
      { e: "🚻🙋", t: "A ogni bagno che vede" }
    ] },
    { id: "mac-i21", q: "Al momento di ripartire, {P} non trova le chiavi. Dove sono?", carte: [
      { e: "🔑🚗", t: "Dentro la macchina chiusa" },
      { e: "🔑👖", t: "In tasca. Da sempre." },
      { e: "🔑🍔", t: "Nel sacchetto del panino, buttato" },
      { e: "🔑🧊", t: "Nel frigo della casa vacanze" }
    ] },
    { id: "mac-i22", q: "Si parte alle 5 di mattina. Che faccia fa {P} quando sale in macchina?", carte: [
      { lui: "sonno", t: "Dorme già sul vialetto" },
      { lui: "esulta", t: "Canta già, a tutto volume" },
      { lui: "arrabbiato", t: "«Chi ha deciso le cinque?!»" },
      { lui: "finto", t: "«Ci sono, ci sono…» (non c'è)" }
    ] },
    { id: "mac-i23", q: "Il navigatore dice «Ricalcolo del percorso» per la quinta volta. Che faccia fa {P}?", carte: [
      { lui: "arrabbiato", t: "Risponde al navigatore. Male." },
      { lui: "indifferente", t: "Va dritto: la strada la sa" },
      { lui: "triste", t: "«Anche tu mi abbandoni?»" },
      { lui: "furbo", t: "Lo spegne e va «a sentimento»" }
    ] },
    { id: "mac-i24", q: "Dal sedile dietro, per la decima volta: «Quanto manca?». Che faccia fa {P}?", carte: [
      { lui: "arrabbiato", t: "Accosta: «Ora torniamo a casa»" },
      { lui: "pensieroso", t: "Calcola km e media, ad alta voce" },
      { lui: "finto", t: "«Poco poco!» (mancano 6 ore)" },
      { lui: "linguaccia", t: "«Quanto manca a cosa?»" }
    ] },
    { id: "mac-i25", q: "Gli amici cantano a squarciagola una canzone che {P} odia. Che faccia fa?", carte: [
      { lui: "disgusto", t: "Si tappa le orecchie per 200 km" },
      { lui: "finto", t: "Muove la bocca e finge di saperla" },
      { lui: "esulta", t: "Al ritornello urla più di tutti" },
      { lui: "sonno", t: "Finge di dormire fino all'arrivo" }
    ] },
    { id: "mac-i26", q: "A 200 km da casa, {P} scopre di aver lasciato la valigia sul letto. Che faccia fa?", carte: [
      { lui: "terrore", t: "«Torniamo indietro. Subito.»" },
      { lui: "indifferente", t: "«Compro tutto lì»" },
      { lui: "furbo", t: "Si veste con le cose degli altri" },
      { lui: "triste", t: "Piange per il costume nuovo" }
    ] }
  ],
  scrivi: [
    { id: "mac-s01", q: "{P} prepara la playlist per il viaggio. Come la chiama?",
      riserve: ["Canzoni per non litigare", "Solo hit. Vietato toccare.", "Viaggio 2026 (definitiva) (vera)"] },
    { id: "mac-s02", q: "Si parte alle 6. Alle 6:40 {P} apre la porta in pigiama e dice: «___»",
      riserve: ["Ma non era domani?", "Cinque minuti, faccio la valigia", "Partite, vi raggiungo a nuoto"] },
    { id: "mac-s03", q: "Al casello la sbarra non si alza. {P} parla al citofono dell'assistenza: «___»",
      riserve: ["Salve, la sbarra ce l'ha con me", "Il biglietto l'ha mangiato il cane", "Se le canto qualcosa, mi apre?"] },
    { id: "mac-s04", q: "Un'altra auto ruba il parcheggio a {P}. Cosa urla dal finestrino?",
      riserve: ["Complimenti per la freccia!", "Ti auguro solo semafori rossi", "Va bene, ma il karma ti vede"] },
    { id: "mac-s05", q: "Arrivati al mare, {P} apre il bagagliaio. La prima cosa che tira fuori è ___",
      riserve: ["la moka, prima del costume", "un cuscino della nonna, per sicurezza", "la valigia di un altro"] },
    { id: "mac-s06", q: "{P} sorpassa finalmente un trattore e fa la telecronaca: «___»",
      riserve: ["E lo supera! No. Ci riprova.", "Signore e signori: i 40 all'ora!", "Il trattore saluta. Che campione"] },
    { id: "mac-s07", q: "{P} fa da copilota. Le sue indicazioni: «___»",
      riserve: ["Gira! No, l'altra destra", "Lì! Dove? Lì! Era lì.", "Segui quella rossa, sembra simpatica"] },
    { id: "mac-s08", q: "{P} spiega al vigile perché andava pianissimo in autostrada. Cosa dice?",
      riserve: ["Ammiravo il panorama", "La macchina è nuova, la sto abituando", "Non volevo arrivare dai suoceri"] },
    { id: "mac-s09", q: "Sul lunotto della macchina di {P} c'è un adesivo: «___»",
      riserve: ["Bimbo a bordo (ha 34 anni)", "Se leggi qui sei troppo vicino", "Non suonate, sto pensando"] },
    { id: "mac-s10", q: "La spia della benzina è accesa da 80 km. {P}, al volante, rassicura tutti: «___»",
      riserve: ["Con la riserva ci arrivo a Bari", "La spia è solo un consiglio", "Tranquilli, adesso è tutta discesa"] },
    { id: "mac-s11", q: "La macchina di {P} ha un clacson nuovo. Quando suona, si sente: «___»",
      riserve: ["«Permesso, scusate», con voce gentile", "La sigla di un cartone animato", "La nonna che chiama per il pranzo"] },
    { id: "mac-s12", q: "La regola numero uno nella macchina di {P}: «Chi sta dietro ___»",
      riserve: ["non sceglie la musica", "canta solo nei ritornelli", "non chiede quanto manca"] },
    { id: "mac-s13", q: "{P} propone un gioco per far passare i chilometri. Come funziona?",
      riserve: ["Contiamo le Panda rosse", "Chi si addormenta paga la benzina", "Chi parla per primo guida al ritorno"] },
    { id: "mac-s14", q: "Al ritorno {P} trova una multa sul parabrezza. Cosa scrive sul retro?",
      riserve: ["Caro vigile, giuro che c'era nebbia", "Pago io, ma il caffè lo offri tu", "Non è mia, la macchina era così"] },
    { id: "mac-s15", q: "Il navigatore di {P} ha un'opzione nuova: «Evita ___»",
      riserve: ["le strade dove guida mia zia", "i parenti lungo il percorso", "le canzoni di mio cugino"] },
    { id: "mac-s16", q: "Se la macchina di {P} potesse parlare, cosa direbbe?",
      riserve: ["Ancora con questa canzone?", "Le briciole mi pizzicano", "Rallenta, sono del 2003"], voto: "lui" },
    { id: "mac-s17", q: "Il cartello che {P} mostra dal finestrino agli amici nell'altra macchina: «___»",
      riserve: ["Avete voi le patatine?", "Fermatevi: devo andare in bagno", "Sorpasso? No. Ciao."] },
    { id: "mac-s18", q: "{P} racconta il viaggio in una storia sul telefono. Cosa scrive?",
      riserve: ["8 ore, 3 litigi, 1 panino", "Il mare esiste, ve lo giuro", "Il navigatore e io non ci parliamo più"] }
  ],
  disegna: [
    { id: "mac-d01", q: "Disegna la macchina di {P} truccata per il viaggio perfetto", su: "scena", adesivi: "🛋️🎮🍕🛁🚀🎡" },
    { id: "mac-d02", q: "Disegna su {P} il look da pilota per guidare la Panda della nonna", su: "ritratto", adesivi: "🏁🧤🏆🕶️🏎️🔥" },
    { id: "mac-d03", q: "Disegna il panorama che {P} giura di aver visto mentre tutti dormivano", su: "scena", adesivi: "🐉🌋🏔️🛸🐋🌈" },
    { id: "mac-d04", q: "Disegna su {P} tutto quello che si mette per dormire in macchina", su: "ritratto", adesivi: "😴🧸🛏️🎧💤🧣" },
    { id: "mac-d05", q: "Disegna la casa vacanze quando arriva {P}: com'è davvero, non in foto", su: "scena", adesivi: "🏚️🕸️🐜🚿🐐🪑" },
    { id: "mac-d06", q: "Disegna su {P} il costume da navigatore umano, con frecce e cartelli", su: "ritratto", adesivi: "⬅️➡️⬆️🚧📍🔊" },
    { id: "mac-d07", q: "Disegna dove ha parcheggiato {P}, «tanto è un minuto»", su: "scena", adesivi: "🚒🐄🏛️⛲🌳🛒" },
    { id: "mac-d08", q: "Disegna cosa c'è davanti a {P} nella coda di 5 km", su: "scena", adesivi: "🚜🐑🚒🛵🦆🚛" },
    { id: "mac-d09", q: "Disegna su {P} il look dopo 100 km in decappottabile", su: "ritratto", adesivi: "👒🕶️🧣💨🦋🍃" },
    { id: "mac-d10", q: "Disegna su {P} casco e occhialoni per sedersi accanto a chi guida male", su: "ritratto", adesivi: "⛑️🥽🙏🧸" },
    { id: "mac-d11", q: "Disegna il cartello stradale inventato apposta per {P}", su: "scena", adesivi: "⚠️🛑🐢🍕🔺❗" },
    { id: "mac-d12", q: "Disegna su {P} gli adesivi dei posti visti, come una vecchia valigia", su: "ritratto", adesivi: "🗼🏔️🍕🗽🏖️🗿" },
    { id: "mac-d13", q: "Disegna l'animale che {P} ha portato in viaggio, e dove si è messo", su: "scena", adesivi: "🐱🐢🐔🦜🐹🐰" }
  ],
  chi: [
    { id: "mac-c01", q: "Chi di noi leggerebbe ad alta voce ogni cartello stradale, compresi i nomi dei paesi più strani?", titolo: "Voce dei cartelli" },
    { id: "mac-c02", q: "Chi di noi farebbe 300 km col navigatore impostato sul paese sbagliato che ha lo stesso nome?", titolo: "Turista del paese gemello" },
    { id: "mac-c03", q: "Chi di noi canterebbe a squarciagola al semaforo, col finestrino abbassato e zero vergogna?", titolo: "Concerto al semaforo" },
    { id: "mac-c04", q: "Chi di noi, dopo una sosta, salirebbe tranquillamente in una macchina uguale… ma di sconosciuti?", titolo: "Macchina sbagliata" },
    { id: "mac-c05", q: "Chi di noi non chiuderebbe occhio tutta la notte, per chiacchierare con chi guida e fargli compagnia?", titolo: "Copilota della notte" },
    { id: "mac-c06", q: "Chi di noi farebbe ripartire la stessa canzone 14 volte di fila, finché qualcuno non sequestra il telefono?", titolo: "Disco rotto" },
    { id: "mac-c07", q: "Chi di noi non ricorderebbe dove ha parcheggiato e girerebbe un'ora premendo il telecomando delle chiavi?", titolo: "Caccia al bip" },
    { id: "mac-c08", q: "Chi di noi preparerebbe la tabella del viaggio con orari e soste, al minuto?", titolo: "Capostazione del viaggio" },
    { id: "mac-c09", q: "Chi di noi passerebbe il viaggio a fotografare il paesaggio dal finestrino, con tutte le foto mosse?", titolo: "Foto mosse d'autore" },
    { id: "mac-c10", q: "Chi di noi, in un viaggio con due macchine, perderebbe gli altri al primo casello?", titolo: "Addio al primo casello" },
    { id: "mac-c11", q: "Chi di noi farebbe tre giri della rotonda prima di decidere l'uscita?", titolo: "Rotonda infinita" },
    { id: "mac-c12", q: "Chi di noi farebbe girare i biscotti per tutta la macchina, finché non ne resta neanche uno per sé?", titolo: "Cuore di biscotto" },
    { id: "mac-c13", q: "Chi di noi saluterebbe dal finestrino tutti i camionisti, come vecchi amici?", titolo: "Fan club dei camion" },
    { id: "mac-c14", q: "Chi di noi riuscirebbe a fare benzina, pulire i vetri e comprare un gelato in due minuti di sosta?", titolo: "Pit stop umano" },
    { id: "mac-c15", q: "Chi di noi si fermerebbe in ogni paesino a comprare il formaggio tipico, finché la macchina non profuma di stalla?", titolo: "Caseificio a quattro ruote" }
  ]
});

/* ---------------------------------------------------------
   I COMUNI (non sono domande: non si mescolano mai nei posti)
   - missione: il gran finale «Passa il ritratto!». Il gioco scrive davanti «Trasforma {P} in:».
   - voce: le righe della Voce negli svelamenti, divise per «quando».
   --------------------------------------------------------- */
SG_CHIDINOI.comuni.push(
  { id: "fin-001", tipo: "missione", q: "la sirena che ha perso il traghetto" },
  { id: "fin-002", tipo: "missione", q: "il re della sagra della porchetta" },
  { id: "fin-003", tipo: "missione", q: "il pirata col mal di mare e il secchiello" },
  { id: "fin-004", tipo: "missione", q: "il vampiro che dorme con la lucina accesa" },
  { id: "fin-005", tipo: "missione", q: "il supereroe in pensione con le pantofole" },
  { id: "fin-006", tipo: "missione", q: "lo chef stellato che ha bruciato la pasta" },
  { id: "fin-007", tipo: "missione", q: "l'astronauta in vacanza a Rimini" },
  { id: "fin-008", tipo: "missione", q: "il cowboy sul cavallo a dondolo" },
  { id: "fin-009", tipo: "missione", q: "il mago a cui è scappato il coniglio" },
  { id: "fin-010", tipo: "missione", q: "la regina del condominio coi bigodini" },
  { id: "fin-011", tipo: "missione", q: "il fantasma che stende le lenzuola al sole" },
  { id: "fin-012", tipo: "missione", q: "l'alieno in gita a Venezia" },
  { id: "fin-013", tipo: "missione", q: "il gladiatore armato di cono gelato" },
  { id: "fin-014", tipo: "missione", q: "il cavaliere con l'armatura di cartone" },
  { id: "fin-015", tipo: "missione", q: "il clown con le scarpe lunghe due metri" },
  { id: "fin-016", tipo: "missione", q: "la statua del parco piena di piccioni" },
  { id: "fin-017", tipo: "missione", q: "il dinosauro che va in bicicletta" },
  { id: "fin-018", tipo: "missione", q: "il campione olimpico di lancio della ciabatta" },
  { id: "fin-019", tipo: "missione", q: "il pilota di Formula 1 sul triciclo" },
  { id: "fin-020", tipo: "missione", q: "il direttore d'orchestra col mestolo" },
  { id: "fin-021", tipo: "missione", q: "lo scienziato subito dopo l'esplosione" },
  { id: "fin-022", tipo: "missione", q: "l'uomo delle caverne che scopre il telefono" },
  { id: "fin-023", tipo: "missione", q: "la rockstar con la chitarra a forma di salame" },
  { id: "fin-024", tipo: "missione", q: "il detective con tre lenti d'ingrandimento" },
  { id: "fin-025", tipo: "missione", q: "il pinguino in spiaggia a Ferragosto" },
  { id: "fin-026", tipo: "missione", q: "il robot arrugginito sotto la pioggia" },
  { id: "fin-027", tipo: "missione", q: "il principe rimasto mezzo ranocchio" },
  { id: "fin-028", tipo: "missione", q: "il boscaiolo con gli uccellini nella barba" },
  { id: "fin-029", tipo: "missione", q: "il maestro di sci in ciabatte" },
  { id: "fin-030", tipo: "missione", q: "il mostro dell'armadio con la copertina" },
  { id: "fin-031", tipo: "missione", q: "il paparazzo travestito da cespuglio" },
  { id: "fin-032", tipo: "missione", q: "il calciatore che esulta dopo un autogol" },
  { id: "fin-033", tipo: "missione", q: "il leone appena uscito dal parrucchiere" },
  { id: "fin-034", tipo: "missione", q: "la strega che vola sull'aspirapolvere" },
  { id: "fin-035", tipo: "missione", q: "il gelataio col gelato caduto in testa" },
  { id: "fin-036", tipo: "missione", q: "il turista con sei macchine fotografiche" },
  { id: "fin-037", tipo: "missione", q: "la star di Sanremo col vestito di piume" },
  { id: "fin-038", tipo: "missione", q: "il nonno che fa il DJ in discoteca" },
  { id: "fin-039", tipo: "missione", q: "il ninja coi campanellini" },
  { id: "fin-040", tipo: "missione", q: "la principessa che ripara il trattore" },
  { id: "fin-041", tipo: "missione", q: "il barboncino appena uscito dal toelettatore" },
  { id: "fin-042", tipo: "missione", q: "il gatto che ha appena rubato il pesce" },
  { id: "fin-043", tipo: "missione", q: "la Gioconda che si fa un selfie" },
  { id: "fin-044", tipo: "missione", q: "la renna di Babbo Natale col naso spento" },
  { id: "fin-045", tipo: "missione", q: "l'unicorno con la criniera appena fatta" },
  { id: "fin-046", tipo: "missione", q: "il re di cuori con la corona storta" },
  { id: "fin-047", tipo: "missione", q: "il cavallo che ha appena vinto il Palio" },
  { id: "fin-048", tipo: "missione", q: "l'influencer col filtro gattino incollato" },
  { id: "fin-049", tipo: "missione", q: "il portiere che para con la faccia" },
  { id: "fin-050", tipo: "missione", q: "il pompiere che salva un gatto dal lampadario" },
  { id: "fin-051", tipo: "missione", q: "il bagnino coi braccioli" },
  { id: "fin-052", tipo: "missione", q: "l'ape regina in ritardo per il lavoro" },
  { id: "fin-053", tipo: "missione", q: "il drago che sputa solo bolle di sapone" },
  { id: "fin-054", tipo: "missione", q: "l'esploratore perso al supermercato" },
  { id: "fin-055", tipo: "missione", q: "l'imperatore romano in accappatoio" },
  { id: "fin-056", tipo: "missione", q: "il sub che ha trovato un tesoro di bottoni" },
  { id: "fin-057", tipo: "missione", q: "il re del barbecue con la griglia in fiamme" },
  { id: "fin-058", tipo: "missione", q: "la mascotte della squadra sotto la pioggia" },
  { id: "fin-059", tipo: "missione", q: "il mimo chiuso nella scatola invisibile" },
  { id: "fin-060", tipo: "missione", q: "l'orso che ha appena finito il miele" },
  { id: "fin-061", tipo: "missione", q: "la zebra che ha sbagliato le strisce" },
  { id: "fin-062", tipo: "missione", q: "il vichingo che ha paura dell'acqua" },
  { id: "fin-063", tipo: "missione", q: "il camaleonte seduto sulla tovaglia a quadri" },
  { id: "fin-064", tipo: "missione", q: "la nonna motociclista col casco a fiori" },
  { id: "fin-065", tipo: "missione", q: "il genio della lampada con la lampada scarica" },
  { id: "fin-066", tipo: "missione", q: "lo spaventapasseri pettinato dai corvi" },
  { id: "fin-067", tipo: "missione", q: "il re del karaoke col microfono a banana" },
  { id: "fin-068", tipo: "missione", q: "il marinaio coi tatuaggi di cuoricini" },
  { id: "fin-069", tipo: "missione", q: "il cagnolino col cappottino e gli stivaletti" },
  { id: "fin-070", tipo: "missione", q: "il pizzaiolo che fa girare la pizza sul dito" },
  { id: "fin-071", tipo: "missione", q: "la cartomante con la sfera di vetro appannata" },
  { id: "fin-072", tipo: "missione", q: "il cantante di serenate al balcone sbagliato" },
  { id: "fin-073", tipo: "missione", q: "il capitano di nave nella vasca da bagno" },
  { id: "fin-074", tipo: "missione", q: "il tennista con la racchetta di spaghetti" },
  { id: "fin-075", tipo: "missione", q: "la fata madrina con l'incantesimo sbagliato" },
  { id: "fin-076", tipo: "missione", q: "l'assaggiatore ufficiale di gelati" },
  { id: "fin-077", tipo: "missione", q: "la copertina di «Trattori oggi»" },
  { id: "fin-078", tipo: "missione", q: "il gufo dopo la notte in bianco" },
  { id: "fin-079", tipo: "missione", q: "il koala che non vuole scendere dall'albero" },
  { id: "fin-080", tipo: "missione", q: "il sollevatore di pesi coi palloncini" },
  { id: "fin-081", tipo: "missione", q: "il Re Sole coperto di crema solare" },
  { id: "fin-082", tipo: "missione", q: "l'atleta con la medaglia di cioccolato" },
  { id: "fin-083", tipo: "missione", q: "il polpo che fa il giocoliere" },
  { id: "fin-084", tipo: "missione", q: "il dentista dei coccodrilli" },
  { id: "fin-085", tipo: "missione", q: "la mucca premiata alla fiera, con la coccarda" },
  { id: "fin-086", tipo: "missione", q: "il nuotatore con la cuffia e la paperella" },
  { id: "fin-087", tipo: "missione", q: "il meteorologo travolto dal vento" },
  { id: "fin-088", tipo: "missione", q: "il pescatore che ha preso uno stivale" },
  { id: "fin-089", tipo: "missione", q: "il robot da cucina che ha preso vita" },
  { id: "fin-090", tipo: "missione", q: "la palla da discoteca in carne e ossa" },
  { id: "fin-091", tipo: "missione", q: "il pappagallo che fa il presentatore" },
  { id: "fin-092", tipo: "missione", q: "il cammello con le valigie sulla gobba" },
  { id: "fin-093", tipo: "missione", q: "il fornaio con l'impasto lievitato troppo" },
  { id: "fin-094", tipo: "missione", q: "il campione di nascondino dietro un lampione" },
  { id: "fin-095", tipo: "missione", q: "la torta di compleanno con le gambe" },
  { id: "fin-096", tipo: "missione", q: "il domatore di pulci del circo" },
  { id: "fin-097", tipo: "missione", q: "il postino inseguito da un'oca" },
  { id: "fin-098", tipo: "missione", q: "la Befana col monopattino elettrico" },
  { id: "fin-099", tipo: "missione", q: "la gallina che ha fatto l'uovo d'oro" },
  { id: "fin-100", tipo: "missione", q: "il vulcano col raffreddore" },
  { id: "fin-101", tipo: "missione", q: "la nuvola di pioggia di cattivo umore" },
  { id: "fin-102", tipo: "missione", q: "il semaforo che non sa più che colore fare" },
  { id: "fin-103", tipo: "missione", q: "il cactus che vuole un abbraccio" },
  { id: "fin-104", tipo: "missione", q: "il fantino arrivato ultimo, ma con stile" },
  { id: "fin-105", tipo: "missione", q: "l'alunn{o|a} dell'asilo truccat{o|a} coi pennarelli" },
  { id: "fin-106", tipo: "missione", q: "l{o|a} spos{o|a} pien{o|a} di coriandoli" },
  { id: "fin-107", tipo: "missione", q: "il prof che cerca gli occhiali (sulla testa)" },
  { id: "fin-108", tipo: "missione", q: "il fuoco d'artificio che non vuole partire" },
  { id: "fin-109", tipo: "missione", q: "l'orco che fa il pane in casa" },
  { id: "fin-110", tipo: "missione", q: "la lumaca col turbo" },

  { id: "voc-01", tipo: "voce", quando: "tutti", q: "Tutti d'accordo! {P}, per noi sei un libro aperto." },
  { id: "voc-02", tipo: "voce", quando: "tutti", q: "Unanimità! Neanche a Natale siete mai stati così d'accordo." },
  { id: "voc-03", tipo: "voce", quando: "tutti", q: "Tutti sulla stessa carta. Su {P} non ci sono dubbi." },
  { id: "voc-04", tipo: "voce", quando: "tutti", q: "Coro perfetto. Se fosse Sanremo, avreste vinto voi." },
  { id: "voc-05", tipo: "voce", quando: "tutti", q: "Tutti uguali! {P}, sei prevedibile come il ragù la domenica." },
  { id: "voc-06", tipo: "voce", quando: "tutti", q: "Accordo totale. Segnatevi la data: non ricapita." },
  { id: "voc-07", tipo: "voce", quando: "tutti", q: "Tutti d'accordo. Avete copiato o vi conoscete troppo bene?" },
  { id: "voc-08", tipo: "voce", quando: "anarchia", q: "Anarchia! A quanto pare {P} ha mille facce." },
  { id: "voc-09", tipo: "voce", quando: "anarchia", q: "Nessuno uguale a nessuno. Siete sicuri di essere amici?" },
  { id: "voc-10", tipo: "voce", quando: "anarchia", q: "Nessuno d'accordo: sembra una riunione di condominio." },
  { id: "voc-11", tipo: "voce", quando: "anarchia", q: "Anarchia totale. {P}, sei un mistero anche per loro." },
  { id: "voc-12", tipo: "voce", quando: "anarchia", q: "Ognuno per conto suo. Stasera il gruppo WhatsApp sarà caldo." },
  { id: "voc-13", tipo: "voce", quando: "anarchia", q: "Che confusione! Qui ci vorrebbe un arbitro col fischietto." },
  { id: "voc-14", tipo: "voce", quando: "anarchia", q: "Zero accordo. Ottimo: almeno nessuno ha copiato." },
  { id: "voc-15", tipo: "voce", quando: "jolly", q: "Pioggia di jolly sulla stessa carta! Qui qualcuno sapeva." },
  { id: "voc-16", tipo: "voce", quando: "jolly", q: "Full di jolly! Che fiducia… o che fortuna." },
  { id: "voc-17", tipo: "voce", quando: "jolly", q: "Tutti questi jolly lì sopra: su {P} siete pronti a giurare." },
  { id: "voc-18", tipo: "voce", quando: "jolly", q: "Jolly a pioggia! I punti volano come coriandoli." },
  { id: "voc-19", tipo: "voce", quando: "jolly", q: "Jolly calati come assi a briscola. Colpo grosso!" },
  { id: "voc-20", tipo: "voce", quando: "jolly", q: "Tre jolly sulla stessa carta: questo sì che è gioco di squadra." },
  { id: "voc-21", tipo: "voce", quando: "vuoto", q: "Nessuno ha avuto il coraggio… Andiamo avanti in silenzio." },
  { id: "voc-22", tipo: "voce", quando: "vuoto", q: "Foglio bianco. Arte moderna, dicono." },
  { id: "voc-23", tipo: "voce", quando: "vuoto", q: "Niente di niente. Stasera anche le matite fanno sciopero." },
  { id: "voc-24", tipo: "voce", quando: "vuoto", q: "Zero risposte. Avete visto un fantasma?" },
  { id: "voc-25", tipo: "voce", quando: "vuoto", q: "Tutti muti! {P} vi ha lasciati senza parole." },
  { id: "voc-26", tipo: "voce", quando: "vuoto", q: "Il vuoto. Lo appendiamo in un museo e passiamo oltre." },
  { id: "voc-27", tipo: "voce", quando: "sintonia", q: "{P} la pensa come voi: vi conoscete da troppo tempo." },
  { id: "voc-28", tipo: "voce", quando: "sintonia", q: "Stessa carta per {P} e per il gruppo. Che armonia." },
  { id: "voc-29", tipo: "voce", quando: "sintonia", q: "Anche {P} ha scelto quella. Almeno nessuno si offende." },
  { id: "voc-30", tipo: "voce", quando: "sintonia", q: "{P} è d'accordo con voi. Era una confessione?" },
  { id: "voc-31", tipo: "voce", quando: "sintonia", q: "Perfetta sintonia: {P} sa benissimo di che pasta è fatt{o|a}." },
  { id: "voc-32", tipo: "voce", quando: "sintonia", q: "{P} conferma. Il gruppo ha sempre ragione." },
  { id: "voc-33", tipo: "voce", quando: "sintonia", q: "{P} e voi sulla stessa carta: ci sta un selfie di gruppo." },
  { id: "voc-34", tipo: "voce", quando: "solo", q: "{P}, questa scelta è solo tua. Chi ti conosce davvero?" },
  { id: "voc-35", tipo: "voce", quando: "solo", q: "{P} si vede in un modo, il gruppo in un altro. Ne parliamo?" },
  { id: "voc-36", tipo: "voce", quando: "solo", q: "{P} da una parte, tutti gli altri dall'altra. Classico." },
  { id: "voc-37", tipo: "voce", quando: "solo", q: "Solo {P} ha scelto quella. Gli amici non ci credono." },
  { id: "voc-38", tipo: "voce", quando: "solo", q: "{P}, ti stai raccontando una bella favola." },
  { id: "voc-39", tipo: "voce", quando: "solo", q: "Nessuno ti vede così, {P}. Neanche la mamma." },
  { id: "voc-40", tipo: "voce", quando: "solo", q: "{P} ha scelto da sol{o|a}. Il mistero resta." }
);

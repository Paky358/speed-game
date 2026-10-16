/* =========================================================
   DATI — «Chi di Noi?», autore 2: La vita all'italiana
   Posti: matrimonio, pranzo, condominio, sagra, pronto.
   {P} = nome di chi è sotto torchio. {o|a} = finale maschile|femminile secondo il suo avatar.
   ========================================================= */
window.SG_CHIDINOI = window.SG_CHIDINOI || { posti: [], comuni: [] };

/* ---------------------------------------------------------
   💒 AL MATRIMONIO DEL CUGINO
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "matrimonio", cod: "mat", nome: "Al matrimonio del cugino", emoji: "💒",
  adesivi: "🎩🎀💐👗💍🍰🕺💃📸🎻🕊️🍬",
  entrata: [
    "Matrimonio del cugino. Tavolo 14, quello vicino alle casse: {P}.",
    "Gli sposi sono in ritardo di un'ora. Intanto tutti guardano {P}.",
    "Dodici portate, tre zie, un fotografo. E {P} sotto torchio."
  ],
  immagini: [
    { id: "mat-i01", q: "Al matrimonio, chi siede accanto a {P} per sei ore di pranzo?", carte: [
      { chi: "zia", faccia: "furbo", t: "Commenta i vestiti di tutti" },
      { chi: "nonno", faccia: "sonno", t: "Dorme dall'antipasto al dolce" },
      { chi: "bimbo", faccia: "linguaccia", t: "Ti ruba i confetti dal piatto" },
      { chi: "cugino", faccia: "indifferente", t: "Guarda la partita, col volume" }
    ] },
    { id: "mat-i02", q: "Gli sposi passano per la foto al tavolo proprio mentre {P} ha la bocca piena. Cosa fa?", carte: [
      { e: "🗿📸", t: "Sorride a bocca chiusa, una statua" },
      { e: "😵📸", t: "Ingoia tutto e tossisce in foto" },
      { e: "📜🙈", t: "Si copre la faccia col menù" },
      { e: "😋👍", t: "Mastica e fa il pollice in su" }
    ] },
    { id: "mat-i03", q: "Che faccia fa {P} quando lo sposo annuncia: «Ora le foto di quando eravamo piccoli. Sono 400»?", carte: [
      { lui: "sonno", t: "Si sveglia alla numero 380" },
      { lui: "finto", t: "«Che teneri!» (alla 150esima)" },
      { lui: "esulta", t: "Spera di essere in almeno 50" },
      { lui: "terrore", t: "Sa che c'è quella al mare" }
    ] },
    { id: "mat-i04", q: "Al buffet, chi attacca bottone con {P} e va avanti per un'ora intera?", carte: [
      { chi: "zio", faccia: "felice", t: "Racconta il suo matrimonio del '79" },
      { chi: "prof", faccia: "pensieroso", t: "Il prof delle medie: «E i verbi?»" },
      { chi: "cameriere", faccia: "estasi", t: "Il cameriere: sogna di cantare" },
      { chi: "vicino", faccia: "sorpreso", t: "Il vicino della nonna: sa tutto" }
    ] },
    { id: "mat-i05", q: "Il fotografo chiama tutti per la foto di gruppo. Dov'è {P}?", carte: [
      { e: "🎯📸", t: "In prima fila, al centro" },
      { e: "🫣🧍", t: "Dietro lo zio più alto, invisibile" },
      { e: "🐰✌️", t: "Orecchie da coniglio allo zio" },
      { e: "🚽⏳", t: "In bagno: non c'è in nessuna foto" }
    ] },
    { id: "mat-i06", q: "Il DJ cerca un volontario per il gioco delle scarpe. Chi spinge {P} al centro della pista?", carte: [
      { chi: "sposo", f: "d", faccia: "esulta", t: "La sposa in persona, col velo" },
      { chi: "nonna", faccia: "furbo", t: "La nonna, con una spinta da rugby" },
      { chi: "cugino", faccia: "linguaccia", t: "Il cugino, per vendetta" },
      { chi: "animatore", faccia: "felice", t: "L'animatore: «Un applauso!»" }
    ] },
    { id: "mat-i07", q: "Dopo il sorbetto, il cameriere annuncia: «Ora arrivano altre cinque portate». E {P}?", carte: [
      { e: "💪🍽️", t: "Esulta: era il riscaldamento" },
      { e: "⏸️😮‍💨", t: "Chiede mezz'ora di pausa" },
      { e: "🚶🌳", t: "Fa due giri del giardino" },
      { e: "🍬😋", t: "Ha finito i confetti del tavolo" }
    ] },
    { id: "mat-i08", q: "Che faccia fa {P} quando scopre che il menù del matrimonio è tutto pesce crudo?", carte: [
      { lui: "disgusto", t: "Chiede di nascosto una pasta" },
      { lui: "estasi", t: "Ordina un altro vassoio" },
      { lui: "finto", t: "«Squisito!» e lo nasconde" },
      { lui: "pensieroso", t: "Cerca la pizzeria più vicina" }
    ] },
    { id: "mat-i09", q: "Sono le 4 di notte. Chi riporta a casa {P} dopo il matrimonio?", carte: [
      { chi: "zio", faccia: "esulta", t: "Lo zio, con la Panda e la musica" },
      { chi: "nonna", faccia: "felice", t: "La nonna: sveglia e lucidissima" },
      { chi: "autista", faccia: "sonno", t: "Un tassista che sa già tutto" },
      { chi: "cugino", faccia: "pensieroso", t: "Il cugino: sbaglia strada 3 volte" }
    ] },
    { id: "mat-i10", q: "Lo sposo lascia a {P} la musica della festa per mezz'ora. Cosa succede?", carte: [
      { e: "📼🕺", t: "Solo anni '80, senza pietà" },
      { e: "💃🎧", t: "Le sue canzoni, pista vuota" },
      { e: "📝🎶", t: "Gira i tavoli a prendere richieste" },
      { e: "📻🍰", t: "Lascia la radio e va al buffet" }
    ] },
    { id: "mat-i11", q: "Arriva un ospite che nessuno conosce e si siede proprio accanto a {P}. Chi è?", carte: [
      { chi: "re", faccia: "indifferente", t: "Un re. Invitato da chi?" },
      { chi: "babbo", faccia: "felice", t: "Babbo Natale, a giugno" },
      { chi: "vigile", faccia: "arrabbiato", t: "«Chi ha parcheggiato sul prato?»" },
      { chi: "mago", faccia: "furbo", t: "Un mago: fa sparire i confetti" }
    ] },
    { id: "mat-i12", q: "Proprio durante il «sì», il telefono di {P} squilla a tutto volume. Cosa fa {P}?", carte: [
      { e: "📵😠", t: "Lo spegne e guarda male il vicino" },
      { e: "🤫📞", t: "Risponde: «Non posso, c'è il sì!»" },
      { e: "👉🙄", t: "Fa finta che sia di un altro" },
      { e: "🎶🙂", t: "Lo lascia: è una bella canzone" }
    ] },
    { id: "mat-i13", q: "{P} va un attimo in bagno. Al ritorno, chi si è preso il suo posto a tavola?", carte: [
      { chi: "nonno", faccia: "felice", t: "Il nonno: ha mangiato anche il suo" },
      { chi: "bimbo", faccia: "linguaccia", t: "Un bimbo, col suo cappello" },
      { chi: "sposo", f: "d", faccia: "sonno", t: "La sposa: «Mi riposo un attimo»" },
      { chi: "cameriere", faccia: "estasi", t: "Un cameriere in pausa pranzo" }
    ] },
    { id: "mat-i14", q: "Il cameriere rovescia il sugo sulla giacca di {P}. Cosa fa {P}?", carte: [
      { e: "😂👔", t: "Ride e resta in camicia" },
      { e: "🧂😤", t: "Strofina col sale per mezz'ora" },
      { e: "🗣️👨‍🍳", t: "Vuole parlare col capo sala" },
      { e: "🏠😳", t: "Se ne accorge solo a casa" }
    ] },
    { id: "mat-i15", q: "Che faccia fa {P} quando l'animatore urla: «Tutti in pista per il ballo di gruppo!»?", carte: [
      { lui: "esulta", t: "In pista prima dell'annuncio" },
      { lui: "terrore", t: "Corre a chiudersi in bagno" },
      { lui: "finto", t: "Ci va, ma muove solo un piede" },
      { lui: "furbo", t: "Ci manda la zia al suo posto" }
    ] },
    { id: "mat-i16", q: "Al buffet dei dolci, chi si prende l'ultimo cannolo un secondo prima di {P}?", carte: [
      { chi: "nonna", faccia: "furbo", t: "La nonna: «Era tuo? Peccato»" },
      { chi: "bimbo", faccia: "esulta", t: "Un bimbo, velocissimo" },
      { chi: "sposo", faccia: "linguaccia", t: "Lo sposo: «Oggi decido io»" },
      { chi: "cameriere", faccia: "indifferente", t: "Il cameriere: lo porta in cucina" }
    ] },
    { id: "mat-i17", q: "La bomboniera è una statuina di porcellana alta mezzo metro. Che fine le fa fare {P}?", carte: [
      { e: "🗿🍽️", t: "«Dimenticata» sul tavolo" },
      { e: "🛋️✨", t: "In bella vista in salotto" },
      { e: "🎁🎄", t: "Regalata a Natale alla zia" },
      { e: "🔄🍬", t: "Chiede di cambiarla coi confetti" }
    ] },
    { id: "mat-i18", q: "La sposa lancia il bouquet e il mazzo arriva dritto addosso a {P}. Cosa fa {P}?", carte: [
      { e: "🙌💐", t: "Lo prende al volo, braccia su" },
      { e: "🏃💐", t: "Lo schiva come la palla avvelenata" },
      { e: "🤝💐", t: "Lo passa subito a chi ha accanto" },
      { e: "😵💐", t: "Finge di svenire per l'emozione" }
    ] },
    { id: "mat-i19", q: "Nel discorso, lo sposo ringrazia tutti per nome… tranne {P}. Cosa fa {P}?", carte: [
      { e: "😅🤷", t: "Ride e fa finta di niente" },
      { e: "🎤🙋", t: "Prende il microfono e si ringrazia" },
      { e: "📅😤", t: "Glielo ricorderà per dieci anni" },
      { e: "🍰🙉", t: "Non sente: è al buffet dei dolci" }
    ] },
    { id: "mat-i20", q: "Sul maxischermo degli sposi compare {P} a sette anni, col costume da ape di Carnevale. Cosa fa?", carte: [
      { e: "🙇🐝", t: "Si alza e fa l'inchino" },
      { e: "🙈🧻", t: "Sparisce dentro il tovagliolo" },
      { e: "🕵️🐝", t: "Cerca chi ha dato la foto" },
      { e: "📩🐝", t: "Ne chiede subito una copia" }
    ] },
    { id: "mat-i21", q: "Lo sposo ha lasciato le fedi a casa e manda {P} a prenderle. Cosa succede?", carte: [
      { e: "🏃💍", t: "Corre e torna in un quarto d'ora" },
      { e: "🍟💍", t: "Propone due anelli di patatine" },
      { e: "🍝⏩", t: "«Intanto cominciamo dal pranzo»" },
      { e: "☕🚗", t: "Va, ma si ferma per un caffè" }
    ] },
    { id: "mat-i22", q: "Che faccia fa {P} quando vede che al tavolo accanto le porzioni sono il doppio?", carte: [
      { lui: "arrabbiato", t: "Chiede il cambio di tavolo" },
      { lui: "indifferente", t: "Tanto ha già fatto tre bis" },
      { lui: "furbo", t: "Si sposta lì per il dolce" },
      { lui: "triste", t: "Fissa il loro piatto, in silenzio" }
    ] },
    { id: "mat-i23", q: "La sposa affida a {P} lo strascico del vestito per tutta la cerimonia. Cosa succede?", carte: [
      { e: "👣👗", t: "Ci inciampa sopra. Due volte" },
      { e: "💂👗", t: "Lo regge serio, come un soldato" },
      { e: "📸👗", t: "Lo molla per fare le foto" },
      { e: "🌿👗", t: "Lo trascina sul prato, felice" }
    ] },
    { id: "mat-i24", q: "A fine festa, cosa si trova nella tasca della giacca di {P}?", carte: [
      { e: "🍬🍬", t: "Venti confetti, un po' sciolti" },
      { e: "🩹👞", t: "Cerotti per le scarpe nuove" },
      { e: "🍰🧻", t: "Torta avvolta nel tovagliolo" },
      { e: "🎤🤫", t: "Il microfono del DJ" }
    ] },
    { id: "mat-i25", q: "Parte il quiz sugli sposi. Chi c'è in squadra con {P}?", carte: [
      { chi: "nonno", faccia: "pensieroso", t: "Il nonno: risponde «1963» a tutto" },
      { chi: "zia", faccia: "esulta", t: "La zia: sa più cose dello sposo" },
      { chi: "bimbo", faccia: "felice", t: "Un bimbo: risponde «la torta»" },
      { chi: "prof", faccia: "indifferente", t: "Il prof: alza la mano e aspetta" }
    ] }
  ],
  scrivi: [
    { id: "mat-s01", q: "Nel discorso da testimone, {P} confessa: «Quando lo sposo mi ha detto che si sposava, ho pensato ___»",
      riserve: ["che fosse un pesce d'aprile", "a chi avrebbe lasciato la console", "finalmente qualcuno che lo sopporta"] },
    { id: "mat-s02", q: "{P} fa gli auguri agli sposi: «Vi auguro una vita piena d'amore e ___»",
      riserve: ["di parenti che avvisano prima di venire", "di vicini senza trapano", "di telecomandi che non spariscono"] },
    { id: "mat-s03", q: "{P} scrive il tema come alle elementari: «Il matrimonio del cugino è stato bello perché ___»",
      riserve: ["c'erano dodici portate e zero compiti", "la zia ha guidato il trenino", "lo sposo ha pianto più di me"] },
    { id: "mat-s04", q: "{P} fa leggere allo sposo una promessa: «Da oggi giuro solennemente di ___»",
      riserve: ["chiudere il tubetto del dentifricio", "non dire più «lo faccio dopo»", "imparare dove sta la lavatrice"] },
    { id: "mat-s05", q: "Alla cerimonia: «Chi ha qualcosa da dire parli ora». {P} alza la mano: «___»",
      riserve: ["A che ora si mangia, di preciso?", "Ho parcheggiato in doppia fila", "Si mangia prima o dopo il sì?"] },
    { id: "mat-s06", q: "Da testimone, {P} racconta: «La sera prima del matrimonio, lo sposo ___»",
      riserve: ["ha provato il vestito sei volte", "ha chiamato la mamma alle tre di notte", "ha imparato il discorso e poi l'ha perso"] },
    { id: "mat-s07", q: "Sul libro degli ospiti, {P} lascia una dedica agli sposi. Cosa scrive?",
      riserve: ["Auguri! Il pesce era crudo, segnalo", "Vi voglio bene. Dov'è il bagno?", "Torno alle nozze d'argento. Stesso menù"] },
    { id: "mat-s08", q: "{P} ruba il microfono alla band e dedica una canzone agli sposi. Che titolo ha?",
      riserve: ["Ti amo anche se russi", "Finalmente il cugino si è sistemato", "Vent'anni di lavastoviglie"] },
    { id: "mat-s09", q: "Nella busta di {P}, oltre al regalo, c'è un bigliettino: «Cari sposi, ___»",
      riserve: ["spendeteli bene, non in bomboniere", "il resto ve lo do in abbracci", "la busta l'ho decorata io: vale doppio"] },
    { id: "mat-s10", q: "La zia chiede a {P} per la quinta volta: «E tu, quando?». Cosa risponde {P}?",
      riserve: ["Quando finisce il buffet, zia", "Appena trovo un catering così", "Quando smetti di chiedermelo"] },
    { id: "mat-s11", q: "Lo sposo legge una lettera che {P} gli scrisse a otto anni: «Da grande ___»",
      riserve: ["ti faccio da testimone e da DJ", "ti ridò la bici che ti ho rotto", "voglio un matrimonio con cento torte"] },
    { id: "mat-s12", q: "Al matrimonio ogni tavolo ha un nome. Come si chiama il tavolo di {P}?",
      riserve: ["Tavolo «Quelli del bis»", "Tavolo «Vicino alle casse»", "Tavolo «Parenti da tenere d'occhio»"] },
    { id: "mat-s13", q: "Lo sposo chiede a {P} di fargli da testimone. {P} accetta a una condizione: «___»",
      riserve: ["il discorso lo scrivi tu", "al buffet entro per primo", "niente balletti, per nessun motivo"] },
    { id: "mat-s14", q: "{P} manda un vocale all'amico che non è venuto al matrimonio. Cosa dice?",
      riserve: ["Hai fatto bene: siamo alla nona portata", "Ti ho tenuto un confetto. L'ho mangiato", "Piange lo sposo, la zia, e pure io"] },
    { id: "mat-s15", q: "Dietro la macchina degli sposi, {P} attacca un cartello: «Appena sposati, ___»",
      riserve: ["suonate se avete fame", "seguiteci: offre lo sposo", "il clacson è per la nonna"] },
    { id: "mat-s16", q: "La nonna della sposa ferma {P}: «E tu, di chi sei?». Cosa risponde {P}?",
      riserve: ["Del tavolo 14, signora", "Di nessuno: sono qui per la torta", "Dello sposo. Ma lui non lo sa"] },
    { id: "mat-s17", q: "Lo sposo dà a {P} un compito segreto per la festa. Sul bigliettino: «___»",
      riserve: ["tieni lo zio lontano dal microfono", "nascondi la torta finché non arrivo", "fai ballare la nonna, a ogni costo"] }
  ],
  disegna: [
    { id: "mat-d01", q: "Disegna su {P} il vestito con cui si presenta al matrimonio del cugino", su: "ritratto", adesivi: "👒🌸👞🦚" },
    { id: "mat-d02", q: "Disegna la torta nuziale a sette piani scelta da {P}", su: "scena", adesivi: "🍓🍫🧁🕯️" },
    { id: "mat-d03", q: "Disegna il tavolo di {P} alle 2 di notte, a fine festa", su: "scena", adesivi: "🧦👠🥖😴🍽️" },
    { id: "mat-d04", q: "Disegna su {P} il travestimento per imbucarsi a un altro matrimonio", su: "ritratto", adesivi: "🥸🎩🕶️🌹" },
    { id: "mat-d05", q: "Disegna su {P} riso, confetti e coriandoli rimasti addosso dopo la festa", su: "ritratto", adesivi: "🍚🎊🍝" },
    { id: "mat-d06", q: "Disegna l'angolo delle foto del matrimonio allestito da {P}", su: "scena", adesivi: "🪞🎈🦩🖼️" },
    { id: "mat-d07", q: "Disegna l'ingresso degli sposi organizzato da {P}", su: "scena", adesivi: "🐎🚁🎆🐘" },
    { id: "mat-d08", q: "Disegna su {P} il cappello da zia del matrimonio, più alto della torta", su: "ritratto", adesivi: "🦚🍒🌺🎀" },
    { id: "mat-d09", q: "Disegna su {P} il trucco fatto dalla nipotina di 5 anni", su: "ritratto", adesivi: "💄🌈⭐🦄" },
    { id: "mat-d10", q: "Disegna la pista da ballo come la vorrebbe {P}: luci, fumo e…", su: "scena", adesivi: "🪩💡🌫️🦩🎆" },
    { id: "mat-d11", q: "Disegna il tavolo dei confetti dopo il passaggio di {P}", su: "scena", adesivi: "🍬🫙😋" },
    { id: "mat-d12", q: "Disegna su {P} la pettinatura fatta alle 6 dalla parrucchiera della sposa", su: "ritratto", adesivi: "💇🎀🌸✨" }
  ],
  chi: [
    { id: "mat-c01", q: "Chi di noi arriverebbe al taglio della torta già senza cravatta e con le scarpe in mano?", titolo: "Scarpe in mano alla torta" },
    { id: "mat-c02", q: "Chi di noi passerebbe il matrimonio a fare dirette col telefono per i parenti non invitati?", titolo: "Diretta dal matrimonio" },
    { id: "mat-c03", q: "Chi di noi arriverebbe al matrimonio col regalo ancora da incartare, da sistemare in macchina?", titolo: "Pacchetto in corsa" },
    { id: "mat-c04", q: "Chi di noi finirebbe al tavolo dei bambini… e ci si troverebbe benissimo?", titolo: "Capotavola dei bambini" },
    { id: "mat-c05", q: "Chi di noi assaggerebbe l'antipasto e direbbe «questo catering l'ho già mangiato a un altro matrimonio»?", titolo: "Recensione del catering" },
    { id: "mat-c06", q: "Chi di noi si presenterebbe al matrimonio col vestito bianco, «senza pensarci»?", titolo: "Bianco senza pensarci" },
    { id: "mat-c07", q: "Chi di noi, a fine serata, conoscerebbe i nomi di tutti i parenti degli sposi meglio degli sposi?", titolo: "Anagrafe del matrimonio" },
    { id: "mat-c08", q: "Chi di noi, durante la cerimonia, scoppierebbe a piangere prima ancora della sposa?", titolo: "Lacrima prima della sposa" },
    { id: "mat-c09", q: "Chi di noi si siederebbe al tavolo degli sposi «perché c'era una sedia libera»?", titolo: "Al tavolo degli sposi" },
    { id: "mat-c10", q: "Chi di noi si porterebbe a casa il centrotavola di fiori, «tanto poi lo buttano»?", titolo: "Centrotavola da asporto" },
    { id: "mat-c11", q: "Chi di noi aprirebbe le danze prima degli sposi, credendo che fosse il suo momento?", titolo: "Primo ballo abusivo" },
    { id: "mat-c12", q: "Chi di noi passerebbe la festa a chiacchierare coi camerieri e finirebbe a servire ai tavoli con loro?", titolo: "Al servizio dei tavoli" },
    { id: "mat-c13", q: "Chi di noi, al grido di «bacio! bacio!», batterebbe la forchetta sul bicchiere più forte di tutti?", titolo: "Capo ultrà del bacio" },
    { id: "mat-c14", q: "Chi di noi sbaglierebbe sala e si siederebbe a un altro matrimonio senza accorgersene fino al dolce?", titolo: "Matrimonio sbagliato" }
  ]
});

/* ---------------------------------------------------------
   🍝 AL PRANZO DELLA DOMENICA
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "pranzo", cod: "pra", nome: "Al pranzo della domenica", emoji: "🍝",
  adesivi: "🍝🍖🥖🧀🥗🍰☕🍊🍕🥘🕰️🍋",
  entrata: [
    "È domenica, sono le 13 e la nonna ha cucinato per trenta. A tavola: {P}.",
    "Tovaglia buona, ragù dalle sei del mattino. Oggi a capotavola c'è {P}.",
    "Pranzo dalla nonna: si finisce verso le sei. Sotto torchio, {P}."
  ],
  immagini: [
    { id: "pra-i01", q: "Alle 13:30 suona il campanello: un parente a sorpresa si siede accanto a {P}. Chi è?", carte: [
      { chi: "zio", faccia: "esulta", t: "Lo zio lontano, carico di regali" },
      { chi: "cugino", faccia: "indifferente", t: "Il cugino che viene solo a pranzo" },
      { chi: "vicino", faccia: "estasi", t: "Il vicino: «Sentivo il ragù»" },
      { chi: "prof", faccia: "sorpreso", t: "Il vecchio prof, amico del nonno" }
    ] },
    { id: "pra-i02", q: "La nonna riempie il piatto di {P} senza chiedere: è il quarto giro di cannelloni. Cosa fa {P}?", carte: [
      { e: "😋🙏", t: "Mangia tutto, per non offenderla" },
      { e: "🤫🍽️", t: "Lo sposta nel piatto del cugino" },
      { e: "✋😩", t: "Dice «basta» e lo finisce" },
      { e: "🙋🍽️", t: "Ne chiede ancora: è il suo giorno" }
    ] },
    { id: "pra-i03", q: "Che faccia fa {P} quando la nonna toglie il coperchio ed è trippa per venti?", carte: [
      { lui: "estasi", t: "Ha il piatto pronto prima di tutti" },
      { lui: "disgusto", t: "Scopre di non avere più fame" },
      { lui: "finto", t: "«Che profumo!» e non respira" },
      { lui: "sorpreso", t: "Chiede cos'è. Poi se ne pente" }
    ] },
    { id: "pra-i04", q: "La nonna è in vacanza. Chi cucina per {P} il pranzo della domenica?", carte: [
      { chi: "papa", faccia: "esulta", t: "Il papà: brace accesa da ieri sera" },
      { chi: "zia", faccia: "felice", t: "La zia: tutto con la panna" },
      { chi: "cugino", faccia: "indifferente", t: "Il cugino: pasta al tonno per 20" },
      { chi: "cuoco", faccia: "finto", t: "Un cuoco vero, scelto dalla nonna" }
    ] },
    { id: "pra-i05", q: "La mamma annuncia: «Oggi a tavola niente telefoni». Cosa fa {P}?", carte: [
      { e: "📵😣", t: "Lo consegna e soffre in silenzio" },
      { e: "🧻📱", t: "Lo nasconde sotto il tovagliolo" },
      { e: "🚽🔁", t: "Va in bagno ogni dieci minuti" },
      { e: "📸🍝", t: "Foto al ragù, poi lo consegna" }
    ] },
    { id: "pra-i06", q: "Dopo pranzo, chi porta {P} a fare due passi «per digerire»?", carte: [
      { chi: "nonno", faccia: "esulta", t: "Il nonno: 8 km a passo di marcia" },
      { chi: "zia", faccia: "furbo", t: "La zia: fino alla pasticceria" },
      { chi: "papa", faccia: "sonno", t: "Il papà: fino all'edicola e basta" },
      { chi: "bimbo", faccia: "esulta", t: "Il nipotino in bici, a tutta" }
    ] },
    { id: "pra-i07", q: "Si rompe la lavastoviglie e ci sono i piatti di venti persone. Cosa fa {P}?", carte: [
      { e: "🎤🧽", t: "Lava tutto cantando a squarciagola" },
      { e: "🍽️💨", t: "Asciuga un piatto e sparisce" },
      { e: "🏭🔁", t: "Organizza la catena di montaggio" },
      { e: "🌙🚪", t: "«Li lavo stasera» e se ne va" }
    ] },
    { id: "pra-i08", q: "Dopo il caffè, chi trascina {P} alla partita a carte?", carte: [
      { chi: "nonno", faccia: "arrabbiato", t: "Il nonno: rivincita del '98" },
      { chi: "zia", faccia: "furbo", t: "La zia che bara, e lo sanno tutti" },
      { chi: "vicino", faccia: "felice", t: "Il vicino: sale solo per giocare" },
      { chi: "bimbo", faccia: "pensieroso", t: "Il cuginetto che tiene i punti" }
    ] },
    { id: "pra-i09", q: "Il cuginetto rovescia l'aranciata sulla tovaglia buona. Tutti guardano {P}, che è lì accanto. Cosa fa?", carte: [
      { e: "🦸🍊", t: "Si prende la colpa al posto suo" },
      { e: "👉🧒", t: "Indica subito il cuginetto" },
      { e: "🧂🏃", t: "Corre a prendere il sale" },
      { e: "🍽️🤫", t: "Ci mette sopra un piatto, e tace" }
    ] },
    { id: "pra-i10", q: "A tavola, chi racconta a tutti la figuraccia d'infanzia di {P}?", carte: [
      { chi: "nonna", faccia: "felice", t: "La nonna, con l'album delle foto" },
      { chi: "zio", faccia: "esulta", t: "Lo zio, con gli effetti sonori" },
      { chi: "mamma", faccia: "estasi", t: "La mamma, che piange dal ridere" },
      { chi: "nonno", faccia: "pensieroso", t: "Il nonno, ma sbaglia nipote" }
    ] },
    { id: "pra-i11", q: "Un parente lontano abbraccia {P}: «Ti ricordi di me? Ti tenevo in braccio!». Cosa fa {P}?", carte: [
      { e: "😃❓", t: "«Certo!» e non sa chi sia" },
      { e: "🤷", t: "Ammette di non ricordarselo" },
      { e: "🤗🔤", t: "Lo abbraccia col nome sbagliato" },
      { e: "👀🆘", t: "Cerca la mamma con lo sguardo" }
    ] },
    { id: "pra-i12", q: "Che faccia fa {P} quando, alle 18, la nonna chiede: «Allora, cosa mangiamo stasera?»", carte: [
      { lui: "estasi", t: "Ha già una lista di richieste" },
      { lui: "sonno", t: "Si riaddormenta per protesta" },
      { lui: "terrore", t: "Si inventa un impegno alle 19" },
      { lui: "pensieroso", t: "«Una cosa leggera… le lasagne?»" }
    ] },
    { id: "pra-i13", q: "Chi controlla, da dietro, se {P} finisce davvero tutto il piatto?", carte: [
      { chi: "nonna", faccia: "arrabbiato", t: "La nonna: conta le forchettate" },
      { chi: "zia", faccia: "furbo", t: "La zia, col secondo giro pronto" },
      { chi: "bimbo", faccia: "linguaccia", t: "Il cuginetto: vuole le patatine" },
      { e: "🐶👀", t: "Il cane, sotto la sedia, da un'ora" }
    ] },
    { id: "pra-i14", q: "Lo zio racconta per la decima volta la stessa storia. Cosa fa {P}?", carte: [
      { e: "😮👂", t: "Fa finta che sia la prima volta" },
      { e: "🏁🗣️", t: "Dice il finale prima dello zio" },
      { e: "🔁📖", t: "Gli chiede di raccontarne un'altra" },
      { e: "🍽️🏃", t: "Sparecchia per scappare" }
    ] },
    { id: "pra-i15", q: "Arriva in tavola la pasta e squilla il telefono di {P}. Chi è?", carte: [
      { chi: "capo", faccia: "finto", t: "Il capo: «Ti rubo due minuti»" },
      { chi: "corriere", faccia: "indifferente", t: "Il corriere: «Sono sotto, scenda»" },
      { chi: "cugino", faccia: "felice", t: "Il cugino: «Arrivo tra 5 minuti»" },
      { chi: "nonna", faccia: "sorpreso", t: "La nonna, dalla cucina accanto" }
    ] },
    { id: "pra-i16", q: "Sfida a tavola: è più buono il ragù della nonna o quello della zia? Decide {P}. Cosa dice?", carte: [
      { e: "🤝😬", t: "«Tutti e due»: scontenta tutti" },
      { e: "👵🏆", t: "La nonna, ovvio: è casa sua" },
      { e: "😈🍝", t: "La zia, solo per vedere le facce" },
      { e: "🥄🥄", t: "Vuole riassaggiarli. Con calma" }
    ] },
    { id: "pra-i17", q: "Finito il pranzo, tutti si buttano sul divano, ma c'è posto per tre. Dove finisce {P}?", carte: [
      { e: "👑🛋️", t: "Sul posto migliore, per sempre" },
      { e: "🧶😴", t: "Sul tappeto, a pancia in su" },
      { e: "🛋️🫠", t: "Sul bracciolo, e scivola giù" },
      { e: "🛏️👵", t: "Nel letto della nonna" }
    ] },
    { id: "pra-i18", q: "Che faccia fa {P} quando il nonno annuncia: «Oggi il ragù l'ho fatto io»?", carte: [
      { lui: "terrore", t: "Cerca il pane per salvarsi" },
      { lui: "finto", t: "«Meglio della nonna!» (bugia)" },
      { lui: "esulta", t: "Chiede il bis per incoraggiarlo" },
      { lui: "pensieroso", t: "Cerca di capire cosa c'è dentro" }
    ] },
    { id: "pra-i19", q: "Mentre tutti dormono, {P} trova in frigo il tiramisù «per stasera». Cosa fa?", carte: [
      { e: "🥄🤏", t: "Un cucchiaino, e liscia la crema" },
      { e: "🐶👉", t: "Mezzo tiramisù: «È stato il cane»" },
      { e: "🚪😔", t: "Chiude il frigo e soffre" },
      { e: "📣🍰", t: "Sveglia tutti: «Tiramisù!»" }
    ] },
    { id: "pra-i20", q: "{P} spezza gli spaghetti prima di buttarli. La nonna lo vede. Cosa fa {P}?", carte: [
      { e: "🧪🤓", t: "«Era un esperimento»" },
      { e: "🧎🙏", t: "Chiede perdono in ginocchio" },
      { e: "👉🧑", t: "Dà la colpa al cugino" },
      { e: "🍝📏", t: "«Così entrano nella pentola»" }
    ] },
    { id: "pra-i21", q: "La mamma annuncia: «Domenica prossima cucina {P}!». Cosa succede?", carte: [
      { e: "📜🍽️", t: "Menù da sei portate" },
      { e: "🏪🤫", t: "Rosticceria, e fa finta di niente" },
      { e: "👵🤝", t: "Cucina con la nonna accanto" },
      { e: "📅🤒", t: "Domenica ha un impegno improvviso" }
    ] },
    { id: "pra-i22", q: "Che faccia fa {P} quando vede che l'ultima polpetta se l'è presa lo zio?", carte: [
      { lui: "triste", t: "Fissa la forchetta dello zio" },
      { lui: "arrabbiato", t: "Convoca un consiglio di famiglia" },
      { lui: "furbo", t: "Ne aveva già nascoste tre" },
      { lui: "indifferente", t: "Tanto c'è la seconda pentola" }
    ] },
    { id: "pra-i23", q: "Nel piatto è rimasto il sugo della nonna. Come fa la scarpetta {P}?", carte: [
      { e: "🍴🥖", t: "Pane infilzato sulla forchetta" },
      { e: "👆🤫", t: "Col dito, quando nessuno guarda" },
      { e: "🥖🥖🥖", t: "Mezza pagnotta per piatto" },
      { e: "🙅🎩", t: "Mai: non è da signori" }
    ] },
    { id: "pra-i24", q: "Dove si siede {P} al pranzo della domenica?", carte: [
      { e: "👑🪑", t: "A capotavola, al posto del nonno" },
      { e: "📺⚽", t: "Spalle alla tavola, occhi alla TV" },
      { e: "🧒🎈", t: "Al tavolino dei bambini" },
      { e: "🚪🏃", t: "Vicino alla porta, per scappare" }
    ] },
    { id: "pra-i25", q: "Sulla porta, la nonna infila di nascosto venti euro in tasca a {P}. Cosa fa {P}?", carte: [
      { e: "🙅🔁", t: "Li rifiuta tre volte, poi accetta" },
      { e: "🤗💶", t: "Li prende e la abbraccia forte" },
      { e: "👜🤫", t: "Glieli rimette nella borsa" },
      { e: "🍰🎁", t: "Ci compra le paste per domenica" }
    ] },
    { id: "pra-i26", q: "A tavola, chi fa a {P} la domanda più imbarazzante davanti a tutti?", carte: [
      { chi: "zia", faccia: "furbo", t: "La zia: «Allora, novità?»" },
      { chi: "nonno", faccia: "pensieroso", t: "Il nonno: «E la macchina, quando?»" },
      { chi: "cugino", faccia: "linguaccia", t: "Il cugino: «Racconta di quando…»" },
      { chi: "mamma", faccia: "estasi", t: "La mamma: «Diglielo, dai!»" }
    ] }
  ],
  scrivi: [
    { id: "pra-s01", q: "{P} manda un vocale nel gruppo «Famiglia» alle 12:55. Cosa dice?",
      riserve: ["Parcheggio e salgo. Buttate la pasta", "Nonna, metti un piatto in più. O tre", "Sono in ritardo, ma ho le paste"] },
    { id: "pra-s02", q: "{P} fa la foto alla tavola della nonna e la pubblica. Che didascalia scrive?",
      riserve: ["Antipasto. Tra sei ore il dolce", "Pranzo leggero dalla nonna (no)", "Se non rispondo, mandate i rinforzi"] },
    { id: "pra-s03", q: "{P} lascia una recensione al pranzo della nonna. Cosa scrive?",
      riserve: ["5 stelle. Servizio lento ma affettuoso", "Porzioni enormi. Uscita vietata", "Cuoca severa: obbliga al bis"] },
    { id: "pra-s04", q: "{P} spiega al nonno che lavoro fa. Il nonno riassume: «___»",
      riserve: ["Ah, quindi aggiusti i computer", "Insomma, stai sempre al telefono", "Lavori da casa? In pigiama?"] },
    { id: "pra-s05", q: "A fine pranzo {P} alza l'aranciata per un brindisi: «Alla nonna, che ___»",
      riserve: ["non ha mai detto «basta» in vita sua", "ha più vaschette che nipoti", "cucina per trenta e mangia una mela"] },
    { id: "pra-s06", q: "Il cuginetto chiede a {P}: «Perché la domenica si mangia così tanto?». Cosa risponde {P}?",
      riserve: ["Perché lunedì si piange", "È la legge della nonna", "Ci alleniamo per Natale"] },
    { id: "pra-s07", q: "La mamma chiama {P} alle 11: «Quando vieni, porta ___»",
      riserve: ["le sedie: siamo in ventidue", "il pane, ma quello buono", "una tovaglia: l'altra l'ha presa il cane"] },
    { id: "pra-s08", q: "Durante il riposino sul divano, {P} parla nel sonno. Cosa dice?",
      riserve: ["Nonna, basta… va bene, l'ultimo", "Le lasagne mi inseguono", "Zio, hai barato a scopa"] },
    { id: "pra-s09", q: "{P} fa assaggiare il sushi alla nonna. La nonna dice: «___»",
      riserve: ["Buono. Ma chi l'ha cotto?", "E questo lo chiami pranzo?", "Ottimo. Ora ti faccio la pasta"] },
    { id: "pra-s10", q: "La nonna detta a {P} la ricetta delle polpette. Alla voce «dosi», {P} scrive: «___»",
      riserve: ["quanto basta, ha detto lei", "a occhio, finché sembra giusto", "segreto di famiglia, non trattabile"] },
    { id: "pra-s11", q: "Se il cane di casa, sotto la sedia di {P}, potesse parlare, direbbe: «___»",
      riserve: ["So che non vuoi quella cotica", "Ti ho visto con la polpetta. Parliamone", "Domenica scorsa mi davi di più"] },
    { id: "pra-s12", q: "{P} si offre di apparecchiare. La nonna guarda e dice: «___»",
      riserve: ["La forchetta va a sinistra, tesoro", "Siediti, che fai solo danni", "Bene. Ora rifallo da capo"] },
    { id: "pra-s13", q: "{P} porta un amico al pranzo per la prima volta. Prima di entrare lo avverte: «___»",
      riserve: ["Quando dici basta, tu continua", "Mai dire «sono pieno»", "Il nonno vince sempre a carte"] },
    { id: "pra-s14", q: "Il telegiornale delle 13 parla del pranzo dalla nonna di {P}. Il titolo è: «___»",
      riserve: ["Nonna da record: 7 portate, 0 avanzi", "Nipote dorme sul divano dalle 15", "Ragù avvistato dal satellite"] },
    { id: "pra-s15", q: "Alle 16 {P} prova ad andare via. La nonna si piazza sulla porta: «___»",
      riserve: ["E il caffè? E la frutta? E il dolce?", "Aspetta, ti incarto due cosette", "Già? Ma c'è ancora il secondo!"] },
    { id: "pra-s16", q: "{P} scrive il menù della domenica sulla lavagnetta della cucina. Ultima riga: «___»",
      riserve: ["Riposino obbligatorio sul divano", "Il bis non si rifiuta", "Avanzi da portare via: non trattabili"] },
    { id: "pra-s17", q: "{P} deve fare il caffè per venti con la moka da tre. Annuncia: «___»",
      riserve: ["Il primo giro è per chi sparecchia", "Tazzine piccole, sorsi piccoli", "Tranquilli: è decaffeinato. Credo"] }
  ],
  disegna: [
    { id: "pra-d01", q: "Disegna la tavola della nonna quando si siede {P}: nove portate in arrivo", su: "scena", adesivi: "🍗🫕🍮🥟" },
    { id: "pra-d02", q: "Disegna il frigo della nonna aperto da {P} alle 17", su: "scena", adesivi: "🧊🥫🍮🫙" },
    { id: "pra-d03", q: "Disegna come {P} sistema i parenti a tavola per evitare litigi", su: "scena", adesivi: "👵👴👶🐶🧔👩" },
    { id: "pra-d04", q: "Disegna la cucina della nonna dopo che {P} ha provato ad aiutare", su: "scena", adesivi: "🧯💥🧽🍅" },
    { id: "pra-d05", q: "Disegna la teglia di lasagne più grande del mondo, fatta apposta per {P}", su: "scena", adesivi: "🧀🍅📏🏗️" },
    { id: "pra-d06", q: "Disegna dove {P} nasconde i broccoli che non vuole mangiare", su: "scena", adesivi: "🥦🪴🐶👜" },
    { id: "pra-d07", q: "Disegna su {P} il tovagliolo da bavaglio e il sugo dappertutto", su: "ritratto", adesivi: "🍅🧻💦" },
    { id: "pra-d08", q: "Disegna su {P} l'armatura per difendersi dal quarto bis della nonna", su: "ritratto", adesivi: "🛡️⚔️🪖" },
    { id: "pra-d09", q: "Disegna su {P} la faccia dopo un peperoncino scambiato per un peperone", su: "ritratto", adesivi: "🌶️🔥💦🧯" },
    { id: "pra-d10", q: "Disegna su {P} barattoli, limoni e uova regalati dalla nonna all'uscita", su: "ritratto", adesivi: "🫙🍋🥚🧺" },
    { id: "pra-d11", q: "Disegna su {P} sciarpa e trombetta da stadio per la partita a tavola", su: "ritratto", adesivi: "🧣📺⚽📣" },
    { id: "pra-d12", q: "Disegna su {P} il maglione della nonna, con sopra la faccia del nonno", su: "ritratto", adesivi: "🧶❤️⭐" }
  ],
  chi: [
    { id: "pra-c01", q: "Chi di noi si siederebbe a tavola alle 13 in punto, col tovagliolo già infilato nel colletto?", titolo: "Puntuale col tovagliolo" },
    { id: "pra-c02", q: "Chi di noi convincerebbe il nonno a raccontare di quando ha conosciuto la nonna, e farebbe commuovere tutta la tavola?", titolo: "Cantastorie della domenica" },
    { id: "pra-c03", q: "Chi di noi si porterebbe a casa gli avanzi in sei vaschette della nonna e non gliele riporterebbe mai?", titolo: "Vaschette mai tornate" },
    { id: "pra-c04", q: "Chi di noi ruberebbe le polpette dalla pentola prima che arrivino in tavola?", titolo: "Assaggi abusivi" },
    { id: "pra-c05", q: "Chi di noi porterebbe un dolce della pasticceria e lo spaccerebbe per fatto in casa, col cartone ancora in macchina?", titolo: "Dolce «fatto in casa»" },
    { id: "pra-c06", q: "Chi di noi, a tavola, tiferebbe la squadra avversaria dello zio solo per farlo arrabbiare?", titolo: "Tifo per dispetto" },
    { id: "pra-c07", q: "Chi di noi passerebbe il pomeriggio a insegnare alla nonna a mandare i vocali?", titolo: "Corso di vocali per nonne" },
    { id: "pra-c08", q: "Chi di noi arriverebbe dalla nonna alle due e mezza dicendo «c'era traffico»… di domenica?", titolo: "Traffico della domenica" },
    { id: "pra-c09", q: "Chi di noi, a pranzo, si metterebbe a litigare con un cuginetto di nove anni… e perderebbe?", titolo: "Sconfitta col cuginetto" },
    { id: "pra-c10", q: "Chi di noi, alla frutta, sbuccerebbe la mela in un'unica striscia lunghissima solo per fare scena?", titolo: "Artista della buccia" },
    { id: "pra-c11", q: "Chi di noi manderebbe la nonna a sedersi e finirebbe di cucinare al posto suo?", titolo: "Vice nonna" },
    { id: "pra-c12", q: "Chi di noi riuscirebbe a far cambiare il menù alla nonna: pasta al forno al posto del brodo?", titolo: "Riforma del menù" },
    { id: "pra-c13", q: "Chi di noi sarebbe ancora lì alle sette di sera, ad aspettare la cena con gli avanzi?", titolo: "Pranzo che diventa cena" },
    { id: "pra-c14", q: "Chi di noi porterebbe alla nonna un mazzo di fiori… raccolti nell'aiuola sotto casa sua?", titolo: "Fiori dall'aiuola" }
  ]
});

/* ---------------------------------------------------------
   🏢 NEL CONDOMINIO
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "condominio", cod: "con", nome: "Nel condominio", emoji: "🏢",
  adesivi: "🚪🪴📦🧺👟🐈🛵🔔📮🧹🗑️🪜",
  entrata: [
    "Scala B, terzo piano, interno 7. Qui abita {P}, e i vicini sanno tutto.",
    "Riunione di condominio alle 21. Primo punto all'ordine del giorno: {P}.",
    "L'ascensore è rotto da marzo. Al quinto piano, col fiatone, c'è {P}."
  ],
  immagini: [
    { id: "con-i01", q: "Chi abita sul pianerottolo di {P}, porta a porta?", carte: [
      { chi: "rockstar", faccia: "esulta", t: "Prova la chitarra alle 23" },
      { chi: "bimbo", faccia: "linguaccia", t: "Suona il campanello e scappa" },
      { chi: "mago", faccia: "furbo", t: "Un mago: dalla porta, colombe" },
      { chi: "dottore", faccia: "felice", t: "Ti visita in ascensore" }
    ] },
    { id: "con-i02", q: "Alle 2 di notte, dal piano di sopra, arriva un rumore di biglie che rotolano. Cosa fa {P}?", carte: [
      { e: "🧹⬆️", t: "Batte sul soffitto con la scopa" },
      { e: "🩳🔔", t: "Sale a suonare in pigiama" },
      { e: "📱😤", t: "Messaggio pungente nel gruppo" },
      { e: "👂🔇", t: "Tappi nelle orecchie, e silenzio" }
    ] },
    { id: "con-i03", q: "Che faccia fa {P} quando apre la porta alle 8 e c'è la vicina con un foglio «da firmare»?", carte: [
      { lui: "finto", t: "«Ma certo!» (non ha letto niente)" },
      { lui: "arrabbiato", t: "Chiude la porta a metà frase" },
      { lui: "felice", t: "Firma tutto e offre il caffè" },
      { lui: "sonno", t: "Firma a occhi chiusi, in pigiama" }
    ] },
    { id: "con-i04", q: "Chi è l'amministratore del condominio di {P}?", carte: [
      { chi: "avvocato", faccia: "sonno", t: "Legge il verbale per due ore" },
      { chi: "nonno", faccia: "arrabbiato", t: "In carica dal 1974, non molla" },
      { chi: "impiegato", faccia: "indifferente", t: "Risponde solo per raccomandata" },
      { chi: "influencer", faccia: "estasi", t: "Fa le riunioni in diretta" }
    ] },
    { id: "con-i05", q: "In ascensore entra il vicino che {P} non sopporta. Mancano sei piani. Cosa fa {P}?", carte: [
      { e: "📱🗣️", t: "Finta telefonata importantissima" },
      { e: "☁️☀️", t: "Attacca a parlare del tempo" },
      { e: "🚪🪜", t: "Scende al piano dopo e fa le scale" },
      { e: "👁️👁️", t: "Lo fissa in silenzio fino su" }
    ] },
    { id: "con-i06", q: "Domenica, ore 8. Chi suona alla porta di {P}?", carte: [
      { chi: "vicino", faccia: "finto", t: "Il vicino: «Ha mica un uovo?»" },
      { chi: "corriere", faccia: "indifferente", t: "Il corriere, con un pacco non suo" },
      { chi: "bimbo", faccia: "imbarazzo", t: "«Ci ridà il pallone?»" },
      { chi: "vigile", faccia: "arrabbiato", t: "Il vigile: «Di chi è il motorino?»" }
    ] },
    { id: "con-i07", q: "Ascensore rotto: {P} abita al sesto piano e torna con la spesa di una settimana. Cosa fa?", carte: [
      { e: "🧗🛍️", t: "Sei piani, una busta per volta" },
      { e: "🧺🪢", t: "Spesa su col cesto e la corda" },
      { e: "🔔🙏", t: "Chiede aiuto al ragazzo del primo" },
      { e: "🛍️🍕", t: "Lascia tutto giù e ordina la pizza" }
    ] },
    { id: "con-i08", q: "L'ascensore si blocca tra due piani. Chi è chiuso lì dentro con {P}?", carte: [
      { chi: "cantante", faccia: "estasi", t: "Una cantante lirica che si scalda" },
      { chi: "vicino", faccia: "pensieroso", t: "Il vicino: cruciverba ad alta voce" },
      { chi: "corriere", faccia: "sonno", t: "Il corriere con quaranta pacchi" },
      { chi: "bimbo", faccia: "esulta", t: "Un bimbo che preme tutti i tasti" }
    ] },
    { id: "con-i09", q: "Stasera alle 21 c'è la riunione di condominio. Cosa fa {P}?", carte: [
      { e: "📋⏰", t: "In anticipo, con gli appunti" },
      { e: "📝🏃", t: "Manda la delega e sparisce" },
      { e: "☕🍪", t: "Ci va solo per i biscotti" },
      { e: "😮‍💨🪑", t: "In fondo alla sala, sbuffa" }
    ] },
    { id: "con-i10", q: "Che faccia fa {P} quando si apre l'ascensore e dentro c'è il vicino col cane bagnato?", carte: [
      { lui: "disgusto", t: "Non respira per cinque piani" },
      { lui: "felice", t: "Lo accarezza tutto, e si bagna" },
      { lui: "terrore", t: "Si appiattisce contro lo specchio" },
      { lui: "indifferente", t: "Ha già un cane più bagnato" }
    ] },
    { id: "con-i11", q: "Quando {P} non è in casa, chi ritira i suoi pacchi?", carte: [
      { chi: "nonna", faccia: "furbo", t: "La signora del primo: li apre" },
      { chi: "vicino", faccia: "arrabbiato", t: "Il vicino: li tiene in ostaggio" },
      { chi: "bimbo", faccia: "esulta", t: "Il bimbo del terzo: ci gioca" },
      { e: "🐈📦", t: "Il gatto, che ci dorme dentro" }
    ] },
    { id: "con-i12", q: "A {P} cade un calzino sul terrazzo della vicina di sotto, che non c'è mai. Cosa fa?", carte: [
      { e: "🔔🔁", t: "Citofona ogni giorno per un mese" },
      { e: "🎣🧦", t: "Prova a ripescarlo con la canna" },
      { e: "🛒🧦", t: "Ne compra un paio nuovo" },
      { e: "🧦⬇️", t: "Butta giù anche l'altro" }
    ] },
    { id: "con-i13", q: "Chi si trasferisce nell'appartamento sopra quello di {P}?", carte: [
      { chi: "ballerino", f: "d", faccia: "esulta", t: "Una ballerina di tip tap" },
      { chi: "nonno", faccia: "felice", t: "Un nonno con 14 orologi a pendolo" },
      { chi: "contadino", faccia: "felice", t: "Tiene sei galline sul balcone" },
      { chi: "dj", faccia: "esulta", t: "Un DJ che prova le serate" }
    ] },
    { id: "con-i14", q: "Nel gruppo del condominio: «Chi ha lasciato il portone aperto?». È stat{o|a} {P}. Cosa fa?", carte: [
      { e: "🙋😅", t: "Confessa, con tre faccine" },
      { e: "🙈📵", t: "Non risponde e spera" },
      { e: "✋🙅", t: "Scrive «Io no!» per primo" },
      { e: "👉📦", t: "Dà la colpa al corriere" }
    ] },
    { id: "con-i15", q: "Che faccia fa {P} quando legge nel gruppo: «Riunione straordinaria. Argomento: {P}»?", carte: [
      { lui: "terrore", t: "Ripensa alla bici nell'androne" },
      { lui: "furbo", t: "Ha già pronte tre deleghe" },
      { lui: "arrabbiato", t: "Prepara un discorso di 40 minuti" },
      { lui: "esulta", t: "Finalmente un po' di fama" }
    ] },
    { id: "con-i16", q: "{P} deve montare un armadio. Chi si offre di dare una mano?", carte: [
      { chi: "nonno", faccia: "pensieroso", t: "Il nonno del 2°, con 40 attrezzi" },
      { chi: "vicino", faccia: "felice", t: "«Faccio io», e lo rompe" },
      { chi: "bimbo", faccia: "furbo", t: "Un bimbo con le istruzioni in mano" },
      { chi: "meccanico", faccia: "esulta", t: "Il meccanico: tutto al contrario" }
    ] },
    { id: "con-i17", q: "Alle 7 di mattina suonano al citofono di {P}: cercano un altro. Cosa fa {P}?", carte: [
      { e: "🔓😴", t: "Apre senza chiedere chi è" },
      { e: "🎭🗣️", t: "Voce finta: «Non abita più qui»" },
      { e: "🛌🔇", t: "Torna a dormire come niente" },
      { e: "👨‍🏫🔔", t: "Spiega qual è il citofono giusto" }
    ] },
    { id: "con-i18", q: "Chi è il portiere del palazzo di {P}?", carte: [
      { chi: "buttafuori", faccia: "arrabbiato", t: "Un ex buttafuori: «Lei chi è?»" },
      { chi: "nonno", faccia: "furbo", t: "Sa tutto di tutti dal 1980" },
      { chi: "cuoco", faccia: "estasi", t: "Cucina il ragù in portineria" },
      { chi: "presentatore", faccia: "felice", t: "Annuncia chi entra al microfono" }
    ] },
    { id: "con-i19", q: "A {P} non va internet, e c'è una rete aperta: «Condominio_Rossi». Cosa fa {P}?", carte: [
      { e: "📶🍿", t: "Si collega e guarda le serie" },
      { e: "🚪✊", t: "Bussa per chiedere il permesso" },
      { e: "📶🤏", t: "Solo per un messaggio, giura" },
      { e: "🔢🔓", t: "Prova la password: «Rossi123»" }
    ] },
    { id: "con-i20", q: "{P} manda per sbaglio nel gruppo del condominio un vocale in cui si lamenta della vicina. E ora?", carte: [
      { e: "🗑️🙏", t: "Lo cancella e spera" },
      { e: "✍️🤥", t: "«Scusate, era per mia cugina»" },
      { e: "🚪🙇", t: "Va subito a bussare per scusarsi" },
      { e: "🚪🏃", t: "Esce dal gruppo. Per sempre" }
    ] },
    { id: "con-i21", q: "Ad agosto parte tutto il palazzo e lascia le chiavi di casa a {P}. Cosa succede?", carte: [
      { e: "🔑🔑🔑", t: "Un portachiavi gigante con tutte" },
      { e: "🔑❓", t: "Ne perde un mazzo il primo giorno" },
      { e: "🔦🏠", t: "Fa il giro delle case ogni sera" },
      { e: "🔑👴", t: "Le gira al portiere: troppo" }
    ] },
    { id: "con-i22", q: "Davanti alla porta di {P}: una torta e un biglietto, «Scusa per il rumore. Il vicino». E {P}?", carte: [
      { e: "😋🍰", t: "La mangia e perdona tutti" },
      { e: "👃🍰", t: "La annusa: non si fida" },
      { e: "🎂🎂", t: "Ricambia con una torta doppia" },
      { e: "🍰🔊", t: "«Buona. Ma il rumore resta»" }
    ] },
    { id: "con-i23", q: "Il portiere scambia {P} per una star della TV e lo racconta a tutto il palazzo. Cosa fa {P}?", carte: [
      { e: "✍️⭐", t: "Firma autografi fino a sera" },
      { e: "😂🙅", t: "Smentisce, ridendo" },
      { e: "🕶️⭐", t: "Occhiali scuri, e non smentisce" },
      { e: "🛍️⬆️", t: "Si fa portare su la spesa" }
    ] },
    { id: "con-i24", q: "A mezzanotte {P} sbaglia piano, infila la chiave nella porta del vicino… e si apre. E ora?", carte: [
      { e: "🤫🏃", t: "Richiude piano piano e scappa" },
      { e: "👋🛋️", t: "Saluta il vicino sul divano" },
      { e: "🏠🤷", t: "Entra: giura che è casa sua" },
      { e: "🥐🙏", t: "Torna coi cornetti a scusarsi" }
    ] },
    { id: "con-i25", q: "Che faccia fa {P} quando al citofono dicono «Pacco per lei!» e non ha ordinato niente?", carte: [
      { lui: "sorpreso", t: "Lo apre, poi si chiede di chi è" },
      { lui: "esulta", t: "È Natale, chiunque sia stato" },
      { lui: "pensieroso", t: "Ripensa agli acquisti notturni" },
      { lui: "furbo", t: "Firma col nome del vicino" }
    ] },
    { id: "con-i26", q: "Il condominio vota il colore nuovo della facciata. Cosa vota {P}?", carte: [
      { e: "🌈🏢", t: "Arcobaleno: «Così ci trovano»" },
      { e: "⬜😐", t: "Grigio, uguale a prima" },
      { e: "🍑🏖️", t: "Color pesca, effetto vacanza" },
      { e: "🤷🗳️", t: "Non vota. Poi si lamenta" }
    ] }
  ],
  scrivi: [
    { id: "con-s01", q: "Sul biglietto in ascensore, {P} scrive: «Al vicino che canta sotto la doccia alle sei: ___»",
      riserve: ["almeno impara le parole", "accetti anche le richieste?", "domani canto anch'io, più forte"] },
    { id: "con-s02", q: "{P} attacca un foglio sul portone: «Chi ha ___ si presenti all'interno 7»",
      riserve: ["rubato il mio zerbino", "parcheggiato un triciclo in ascensore", "mangiato il mio basilico"] },
    { id: "con-s03", q: "{P} si presenta ai vicini nuovi: «Piacere, sono {P}, quell{o|a} che ___»",
      riserve: ["canta in ascensore, ma piano", "ha il gatto più curioso del palazzo", "perde le chiavi ogni martedì"] },
    { id: "con-s04", q: "{P} suona a tutti i campanelli: «Ho trovato sulle scale ___. È vostro?»",
      riserve: ["un mestolo con dentro il ragù", "una pantofola sola, numero 47", "un criceto che sa già la strada"] },
    { id: "con-s05", q: "{P} propone di dare un nome al palazzo, come alle navi. Quale?",
      riserve: ["Residenza Ascensore Rotto", "Villa Trapano della Domenica", "Palazzo Chi Ha Lasciato il Portone"] },
    { id: "con-s06", q: "{P} entra nel gruppo WhatsApp del condominio. Qual è il suo primo messaggio?",
      riserve: ["Salve! Chi ha un trapano silenzioso?", "Ciao a tutti! Il gatto sul tetto è mio", "Avviso: stasera faccio le prove di canto"] },
    { id: "con-s07", q: "Sul campanello di {P} c'è da anni il nome sbagliato. Cosa c'è scritto?",
      riserve: ["Famiglia Rossi (partiti nel 1997)", "Dott. Nessuno", "Zia Pina e i suoi nove gatti"] },
    { id: "con-s08", q: "Alla riunione, {P} propone una regola nuova: «Da oggi è vietato ___»",
      riserve: ["il trapano prima di mezzogiorno", "salutarsi in ascensore: troppo imbarazzo", "lamentarsi senza portare i biscotti"] },
    { id: "con-s09", q: "{P} scrive il verbale della riunione di condominio. Cosa c'è nell'ultima riga?",
      riserve: ["Finita alle 2. Deciso niente", "La siepe resta. La pace no", "Il signor Bruno ha finito i biscotti"] },
    { id: "con-s10", q: "Il corriere lascia un avviso sulla porta di {P}: «Passato alle 10:02, ___»",
      riserve: ["ho sentito la TV, ma va bene", "il pacco è dalla signora curiosa", "torno quando sarai sotto la doccia"] },
    { id: "con-s11", q: "La vicina curiosa racconta a tutto il palazzo la vita di {P}. Cosa dice?",
      riserve: ["Un pacco al giorno. Ma che lavoro fa?", "Rientra alle 3 e canta sulle scale", "Ha un gatto che nessuno ha mai visto"] },
    { id: "con-s12", q: "Qualcuno blocca il garage di {P}. Sul parabrezza, {P} lascia scritto: «___»",
      riserve: ["Ho la tua targa e anche tanto tempo", "Ti aspetto. Ho portato il pranzo", "La prossima volta ci parcheggio sopra"] },
    { id: "con-s13", q: "Il giorno del trasloco, {P} saluta il gruppo del condominio. Cosa scrive?",
      riserve: ["Addio! Il trapano lo lascio al quarto", "Mi mancherete. Le riunioni no", "Le biglie erano mie. Perdonatemi"] },
    { id: "con-s14", q: "Nella cassetta della posta di {P} c'è un biglietto anonimo dei vicini: «___»",
      riserve: ["Per favore, impara un'altra canzone", "Il tuo gatto viene a cena da noi", "Ti abbiamo visto. Bel pigiama"] },
    { id: "con-s15", q: "Tocca a {P} il turno delle scale. Sul cartello «Bagnato» aggiunge: «___»",
      riserve: ["Si cammina sul corrimano", "Chi passa adesso, le rilava", "Lavate da me. Applausi, grazie"] },
    { id: "con-s16", q: "Il vicino di sotto bussa: «Ma che fa lì sopra tutto il giorno?». Cosa risponde {P}?",
      riserve: ["Alleno le tartarughe per la corsa", "Sposto il divano. Di nuovo", "Provo il ballo per il matrimonio"] },
    { id: "con-s17", q: "Il cane del vicino abbaia ogni volta che passa {P}. Per farselo amico, {P} gli dice: «___»",
      riserve: ["Tranquillo, ho il prosciutto", "Siamo vicini: diamoci del tu", "Abbaia pure, ma piano: è domenica"] }
  ],
  disegna: [
    { id: "con-d01", q: "Disegna il pianerottolo di {P} dopo che ci ha messo tutte le sue cose", su: "scena", adesivi: "🚲🛋️🌵📦" },
    { id: "con-d02", q: "Disegna il balcone di {P} visto dal palazzo di fronte", su: "scena", adesivi: "🧦👕🌿🍅🪁" },
    { id: "con-d03", q: "Disegna la bacheca del condominio piena degli avvisi di {P}", su: "scena", adesivi: "📌📝❗😡" },
    { id: "con-d04", q: "Disegna l'ascensore dopo che {P} l'ha arredato «per renderlo accogliente»", su: "scena", adesivi: "🛋️🖼️🕯️🪞" },
    { id: "con-d05", q: "Disegna la cassetta della posta di {P} dopo un mese di vacanza", su: "scena", adesivi: "✉️📰🍕📦" },
    { id: "con-d06", q: "Disegna cosa vede {P} dallo spioncino quando suonano alle 3 di notte", su: "scena", adesivi: "👁️🐒🎅👽" },
    { id: "con-d07", q: "Disegna su {P} il look con cui scende a buttare la spazzatura", su: "ritratto", adesivi: "🩴🧖🕶️🗑️" },
    { id: "con-d08", q: "Disegna su {P} il look da riunione di condominio", su: "ritratto", adesivi: "📋👓📏🖊️" },
    { id: "con-d09", q: "Disegna su {P} tutto quello che porta su dalla cantina in un viaggio solo", su: "ritratto", adesivi: "📦🚲🎄🧳🪆" },
    { id: "con-d10", q: "Disegna l'albero di Natale del palazzo, addobbato da {P} nell'androne", su: "scena", adesivi: "🎄⭐🎁🧦" },
    { id: "con-d11", q: "Disegna su {P} l'attrezzatura da spia per sentire cosa dicono i vicini", su: "ritratto", adesivi: "👂🎧📡🔍" },
    { id: "con-d12", q: "Disegna la cuccia che {P} costruisce in cortile per il gatto del palazzo", su: "scena", adesivi: "🐟🥛🛏️🧶" }
  ],
  chi: [
    { id: "con-c01", q: "Chi di noi, alla riunione di condominio, farebbe durare la discussione sulla siepe fino a mezzanotte?", titolo: "Processo alla siepe" },
    { id: "con-c02", q: "Chi di noi scriverebbe ogni mattina nel gruppo del condominio «Buongiorno a tutti» con la gif dei fiori?", titolo: "Buongiorno con la gif" },
    { id: "con-c03", q: "Chi di noi correrebbe allo spioncino ogni volta che sente arrivare l'ascensore?", titolo: "Occhio dello spioncino" },
    { id: "con-c04", q: "Chi di noi riceverebbe così tanti pacchi da trasformare il portiere nel suo assistente personale?", titolo: "Valanga di pacchi" },
    { id: "con-c05", q: "Chi di noi stenderebbe i panni bagnati proprio sopra quelli della vicina del piano di sotto?", titolo: "Pioggia dal terzo piano" },
    { id: "con-c06", q: "Chi di noi accenderebbe il trapano la domenica alle otto, «solo per appendere un quadretto»?", titolo: "Trapano della domenica" },
    { id: "con-c07", q: "Chi di noi saluterebbe tutti i vicini per nome… compreso il gatto del quarto piano?", titolo: "Saluti a tutto il palazzo" },
    { id: "con-c08", q: "Chi di noi farebbe la raccolta differenziata così bene da correggere quella dei vicini?", titolo: "Ispezione al bidone" },
    { id: "con-c09", q: "Chi di noi si chiuderebbe fuori casa in accappatoio, uscendo solo per ritirare un pacco?", titolo: "Esilio in accappatoio" },
    { id: "con-c10", q: "Chi di noi, per non incontrare nessuno, aspetterebbe dietro la porta finché il pianerottolo non è libero?", titolo: "Fantasma del pianerottolo" },
    { id: "con-c11", q: "Chi di noi lascerebbe la bici nell'androne, dove è vietato, con un biglietto «solo cinque minuti»?", titolo: "Cinque minuti da sempre" },
    { id: "con-c12", q: "Chi di noi si offrirebbe di innaffiare le piante della vicina in vacanza… e gliele farebbe seccare tutte?", titolo: "Pollice nero del palazzo" },
    { id: "con-c13", q: "Chi di noi organizzerebbe in cortile la festa del condominio, con karaoke fino a mezzanotte?", titolo: "Karaoke in cortile" },
    { id: "con-c14", q: "Chi di noi porterebbe una torta ai vicini appena arrivati, il giorno stesso del trasloco?", titolo: "Benvenuto con torta" }
  ]
});

/* ---------------------------------------------------------
   🎡 ALLA SAGRA DEL PAESE
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "sagra", cod: "sag", nome: "Alla sagra del paese", emoji: "🎡",
  adesivi: "🎡🎠🌭🍖🎈🎯🧸🎺🪗🍭🌽🎟️",
  entrata: [
    "Sagra della porchetta, 47ª edizione. Vicino al palco della banda c'è {P}.",
    "Luci, giostre e profumo di frittelle. Stasera il paese parla solo di {P}.",
    "La Pro Loco taglia il nastro, la banda attacca. Sotto torchio: {P}."
  ],
  immagini: [
    { id: "sag-i01", q: "Arriva {P} alla sagra. Chi c'è sul palco, stasera?", carte: [
      { chi: "dj", faccia: "esulta", t: "Un DJ che mette solo la polka" },
      { chi: "rockstar", faccia: "esulta", t: "La band del paese, sempre stonata" },
      { chi: "presentatore", faccia: "furbo", t: "Chiama sul palco «quello là»" },
      { chi: "clown", faccia: "felice", t: "Un clown che fa bolle giganti" }
    ] },
    { id: "sag-i02", q: "Alla sagra c'è il toro meccanico, e tutti si girano verso {P}. Cosa succede?", carte: [
      { e: "🤠⏱️", t: "Resiste dieci secondi: leggenda" },
      { e: "💥🐂", t: "Cade dopo mezzo secondo" },
      { e: "🐷🙅", t: "«Dopo la porchetta, no»" },
      { e: "📣🙌", t: "Fa il tifo dalla transenna" }
    ] },
    { id: "sag-i03", q: "Che faccia fa {P} quando scende dal tagadà dopo dieci giri?", carte: [
      { lui: "esulta", t: "«Ancora un giro!»" },
      { lui: "disgusto", t: "Cerca una panchina, subito" },
      { lui: "terrore", t: "Le mani ancora sulla sbarra" },
      { lui: "indifferente", t: "Ha mangiato un panino durante" }
    ] },
    { id: "sag-i04", q: "Chi riesce a vendere a {P} la cosa più inutile della sagra?", carte: [
      { chi: "contadino", faccia: "furbo", t: "Il contadino: 4 chili di zucchine" },
      { chi: "cuoco", faccia: "estasi", t: "Il venditore di pentole magiche" },
      { chi: "nonna", faccia: "felice", t: "Una nonna coi centrini a uncinetto" },
      { chi: "bimbo", faccia: "finto", t: "Un bimbo che vende sassi dipinti" }
    ] },
    { id: "sag-i05", q: "Alla pesca di beneficenza {P} vince un barattolo di sottaceti formato famiglia. Cosa fa?", carte: [
      { e: "🥳🫙", t: "Esulta come se fosse un'auto" },
      { e: "🤲👵", t: "Lo regala alla signora accanto" },
      { e: "🔁🎟️", t: "Ritenta per cambiare premio" },
      { e: "🫙🍴", t: "Lo apre e li offre a tutti" }
    ] },
    { id: "sag-i06", q: "Tiro alla fune tra le contrade. Chi c'è in squadra con {P}?", carte: [
      { chi: "nonno", faccia: "arrabbiato", t: "Un nonno che non molla mai" },
      { chi: "calciatore", faccia: "esulta", t: "Il centravanti del paese" },
      { chi: "bimbo", faccia: "pensieroso", t: "Un bimbo di sei anni, serissimo" },
      { chi: "cuoco", faccia: "felice", t: "Il porchettaro, col grembiule" }
    ] },
    { id: "sag-i07", q: "Al tirassegno, a {P} manca un centro per il premio grande. Ultimo colpo. Cosa succede?", carte: [
      { e: "🎯😬", t: "Mira dieci secondi, e sbaglia" },
      { e: "🕵️🎯", t: "«Il bersaglio è truccato!»" },
      { e: "🎯🎉", t: "Centro! Salta di gioia" },
      { e: "🔁🎟️", t: "Ripaga finché non vince" }
    ] },
    { id: "sag-i08", q: "La TV locale vuole intervistare {P} sulla sagra. Chi ha il microfono?", carte: [
      { chi: "presentatore", faccia: "estasi", t: "Un presentatore in giacca lucida" },
      { chi: "influencer", f: "d", faccia: "felice", t: "Una influencer che non sa dov'è" },
      { chi: "nonno", faccia: "furbo", t: "Un nonno che fa solo domande sue" },
      { chi: "bimbo", faccia: "esulta", t: "Un bimbo col microfono finto" }
    ] },
    { id: "sag-i09", q: "Alla tombola in piazza a {P} manca un numero. Esce, ma un altro grida «Tombola!» prima. E {P}?", carte: [
      { e: "📣🙋", t: "Urla «TOMBOLA!» lo stesso" },
      { e: "🔍🔢", t: "Ricontrolla numero per numero" },
      { e: "🗑️😔", t: "Accartoccia la cartella" },
      { e: "👏😬", t: "Complimenti, a denti stretti" }
    ] },
    { id: "sag-i10", q: "In piena sagra comincia a diluviare. Cosa fa {P}?", carte: [
      { e: "☔🐷", t: "Sotto il gazebo della porchetta" },
      { e: "💃🌧️", t: "Balla sotto la pioggia" },
      { e: "🚗💨", t: "Corre in macchina, e via" },
      { e: "🗑️🧥", t: "Mantella col sacco dell'umido" }
    ] },
    { id: "sag-i11", q: "{P} perde la lotteria per un numero. Chi ha il biglietto vincente, quello accanto al suo?", carte: [
      { chi: "bimbo", faccia: "esulta", t: "Un bimbo che piange dalla gioia" },
      { chi: "nonna", faccia: "furbo", t: "La nonna che vince ogni anno" },
      { chi: "zio", faccia: "sorpreso", t: "Lo zio, che non sapeva di giocare" },
      { chi: "vigile", faccia: "felice", t: "Il vigile, che passava di lì" }
    ] },
    { id: "sag-i12", q: "{P} compra lo zucchero filato più grande di tutta la sagra. Che fine fa?", carte: [
      { e: "😋⚡", t: "Finito prima di arrivare al tavolo" },
      { e: "🤲☁️", t: "Un ciuffo a testa per tutti" },
      { e: "☁️💇", t: "Appiccicato ai capelli in 2 minuti" },
      { e: "🏆☁️", t: "Tenuto in mano come un trofeo" }
    ] },
    { id: "sag-i13", q: "Che faccia fa {P} quando l'altoparlante annuncia: «È finita la porchetta»?", carte: [
      { lui: "triste", t: "Annusa l'aria dove c'era" },
      { lui: "arrabbiato", t: "Vuole parlare con la Pro Loco" },
      { lui: "indifferente", t: "Ha tre panini nello zaino" },
      { lui: "furbo", t: "Conosce il porchettaro: ce n'è" }
    ] },
    { id: "sag-i14", q: "Alla sfilata, chi guida il trattore con sopra {P}?", carte: [
      { chi: "contadino", faccia: "sonno", t: "Il contadino, a tre all'ora" },
      { chi: "nonno", faccia: "esulta", t: "Il nonno, che sorpassa la banda" },
      { chi: "bimbo", faccia: "furbo", t: "Un bimbo: «Tanto è tutto dritto»" },
      { chi: "vigile", faccia: "arrabbiato", t: "Il vigile, che lo insegue a piedi" }
    ] },
    { id: "sag-i15", q: "Alla corsa nei sacchi, {P} è in testa a metà percorso. Cosa succede?", carte: [
      { e: "🙌💥", t: "Esulta troppo presto e cade" },
      { e: "🏆🛍️", t: "Giro d'onore dentro il sacco" },
      { e: "🧒🏁", t: "Rallenta e fa vincere un bimbo" },
      { e: "🔁😤", t: "Perde e chiede di rifarla" }
    ] },
    { id: "sag-i16", q: "Il parcheggio della sagra è un campo pieno di fango. Cosa fa {P}?", carte: [
      { e: "🚶📏", t: "Parcheggia a due chilometri" },
      { e: "🚗💪", t: "Si impantana: spinge mezzo paese" },
      { e: "🧒🔑", t: "Lascia l'auto al ragazzino" },
      { e: "🚲😎", t: "Arriva in bici e saluta tutti" }
    ] },
    { id: "sag-i17", q: "Sui seggiolini volanti, chi c'è nel seggiolino dietro {P}?", carte: [
      { chi: "bimbo", faccia: "linguaccia", t: "Un bimbo che spinge a ogni giro" },
      { chi: "nonna", faccia: "esulta", t: "La nonna, che urla di gioia" },
      { chi: "cugino", faccia: "furbo", t: "Il cugino: filma solo le urla" },
      { chi: "nonno", faccia: "sonno", t: "Il nonno, che si addormenta" }
    ] },
    { id: "sag-i18", q: "Alle 23 partono i fuochi d'artificio. Cosa fa {P}?", carte: [
      { e: "📱🎆", t: "Li filma tutti, senza guardarli" },
      { e: "🧐🎆", t: "«Quelli dell'anno scorso, però…»" },
      { e: "😮🎆", t: "«Oooh» più forte dei bambini" },
      { e: "🙉⏳", t: "Orecchie tappate, conta i minuti" }
    ] },
    { id: "sag-i19", q: "Alla bancarella delle frittelle c'è una fila lunghissima. Cosa fa {P}?", carte: [
      { e: "🗣️🤝", t: "Fa amicizia con tutta la fila" },
      { e: "☝️🏃", t: "«Ne prendo solo una!» e passa" },
      { e: "🚗🏘️", t: "Va alla sagra del paese vicino" },
      { e: "📲🧍", t: "Manda un amico a farla" }
    ] },
    { id: "sag-i20", q: "{P} finisce per sbaglio a sfilare con la banda. Chi c'è al suo fianco?", carte: [
      { chi: "nonno", faccia: "pensieroso", t: "Il nonno col tamburo, fuori tempo" },
      { chi: "bimbo", faccia: "indifferente", t: "Un bimbo col triangolo, serissimo" },
      { chi: "vigile", faccia: "furbo", t: "Il vigile: dirige traffico e banda" },
      { chi: "prof", f: "d", faccia: "estasi", t: "La prof di musica delle medie" }
    ] },
    { id: "sag-i21", q: "{P} vince il primo premio della lotteria della sagra: un maialino vero. Cosa fa?", carte: [
      { e: "🐷❤️", t: "Lo porta a casa e gli dà un nome" },
      { e: "🔄🚲", t: "Lo scambia col secondo premio" },
      { e: "🐷🏡", t: "Lo regala alla fattoria del paese" },
      { e: "🐷🤗", t: "Lo tiene in braccio tutta la sera" }
    ] },
    { id: "sag-i22", q: "La Pro Loco nomina {P} ospite d'onore: sfila sul carro dei fiori con la fascia. Cosa fa?", carte: [
      { e: "👑👋", t: "Saluta come alla parata reale" },
      { e: "💐🫣", t: "Si nasconde dietro i fiori" },
      { e: "🍬🎯", t: "Lancia caramelle ai bambini" },
      { e: "🙅➡️", t: "Rifiuta e ci manda un amico" }
    ] },
    { id: "sag-i23", q: "Il porchettaro sparisce per un'ora e lascia a {P} lo stand, con la fila davanti. Cosa succede?", carte: [
      { e: "🥪🥪", t: "Panini giganti: stand in perdita" },
      { e: "🤫🐷", t: "Crosticina solo agli amici" },
      { e: "😋🐷", t: "Mezza porchetta, di nascosto" },
      { e: "📈🏷️", t: "Alza i prezzi e raddoppia" }
    ] },
    { id: "sag-i24", q: "Il cantante della serata chiama {P} sul palco per un duetto davanti a tutto il paese. Cosa fa?", carte: [
      { e: "🎤🔁", t: "Canta e chiede il bis" },
      { e: "🎤👥", t: "Passa il microfono al pubblico" },
      { e: "🫣🐷", t: "Sparisce dietro la porchetta" },
      { e: "🎶🤏", t: "Canta solo il ritornello" }
    ] },
    { id: "sag-i25", q: "Che faccia fa {P} quando il mago della sagra tira fuori dal cappello il suo portafoglio?", carte: [
      { lui: "sorpreso", t: "Si tasta tutte le tasche" },
      { lui: "terrore", t: "Controlla che ci sia ancora tutto" },
      { lui: "esulta", t: "Applaude: trucco del secolo" },
      { lui: "furbo", t: "Era d'accordo col mago" }
    ] },
    { id: "sag-i26", q: "{P} fa da giudice alla gara di torte. La peggiore è della nonna di un amico. Cosa fa?", carte: [
      { e: "🔟🤝", t: "Voto alto, per amicizia" },
      { e: "🗣️🪶", t: "La verità, con molto tatto" },
      { e: "🍰🔁", t: "«Riassaggio, per sicurezza»" },
      { e: "🙅🍴", t: "Si dichiara incompetente" }
    ] }
  ],
  scrivi: [
    { id: "sag-s01", q: "Al ballo liscio in piazza, la signora più anziana invita {P}. Ballando, sussurra: «___»",
      riserve: ["Mi pesti i piedi da tre canzoni", "Nel '72 ballavo meglio di così", "Sorridi: ci guarda tutto il paese"] },
    { id: "sag-s02", q: "{P} inventa una sagra nuova per il paese. Come si chiama?",
      riserve: ["Sagra della polpetta che rotola", "Festa del panino che non finisce", "Sagra del pelapatate miracoloso"] },
    { id: "sag-s03", q: "Sul cartello della sua bancarella, {P} scrive: «___»",
      riserve: ["Assaggi gratis: uno solo, Gino", "Se non compri, almeno sorridi", "Si accettano baratti in salame"] },
    { id: "sag-s04", q: "Al banco della porchetta, {P} ordina il panino «come piace a me»: «___»",
      riserve: ["Crosticina doppia, pane facoltativo", "Come quello del sindaco, ma più alto", "Uno subito e uno per il ritorno"] },
    { id: "sag-s05", q: "Il paese dà a {P} le chiavi della sagra. Qual è il primo decreto?",
      riserve: ["Porchetta gratis a chi compie gli anni", "Vietato chiudere prima delle tre", "Il tagadà ora gira al contrario"] },
    { id: "sag-s06", q: "Il presidente della Pro Loco ringrazia {P} dal palco perché ___",
      riserve: ["ha mangiato mezza porchetta, senza pane", "ha ritrovato il trombone della banda", "ha spinto fuori dal fango dodici auto"] },
    { id: "sag-s07", q: "{P} vince il concorso «Miglior sugo del paese». Il segreto, dice, è ___",
      riserve: ["un cucchiaio di pazienza e uno di nonna", "cuocerlo mentre si guarda la partita", "assaggiarlo ogni cinque minuti"] },
    { id: "sag-s08", q: "La banda chiede a {P} il titolo della marcia da suonare. Cosa propone?",
      riserve: ["Marcia della porchetta trionfante", "Polka della frittella volante", "Inno al panino col salame"] },
    { id: "sag-s09", q: "Sul palco c'è la gara «Il paese ha talento». Il talento di {P} è ___",
      riserve: ["imitare il verso del tacchino", "aprire le noci con una mano sola", "dire tutte le province in un minuto"] },
    { id: "sag-s10", q: "Alla sagra c'è la gara «Indovina il peso del prosciutto». Sul foglietto {P} scrive: «___»",
      riserve: ["Quanto la mia valigia di Ferragosto", "Esattamente un prosciutto", "Fatemelo assaggiare e vi dico"] },
    { id: "sag-s11", q: "Il sindaco presenta {P} dal palco, davanti a tutto il paese: «Ecco a voi ___»",
      riserve: ["chi ha finito le frittelle alle nove", "la leggenda del tagadà, edizione 2026", "un parente di… boh, applaudite"] },
    { id: "sag-s12", q: "{P} non trova più l'auto nel parcheggio della sagra. Al vigile la descrive così: «___»",
      riserve: ["Grigia, sporca di fango, come tutte", "Quella con dentro il mio maialino", "Ha la radio accesa. Credo"] },
    { id: "sag-s13", q: "Alle 2 di notte smontano gli stand, e {P} è ancora lì. Cosa dice ai volontari?",
      riserve: ["Avanza porchetta? Chiedo per un amico", "Vi aiuto io, ma prima un panino", "Io qui ci dormo, se non vi dispiace"] },
    { id: "sag-s14", q: "{P} registra lo spot della sagra per la radio locale: «Venite alla sagra, ___»",
      riserve: ["la tombola dura fino all'alba", "il parcheggio è a soli due chilometri", "il tagadà non perdona nessuno"] },
    { id: "sag-s15", q: "{P} torna dalla sagra con un peluche gigante e gli dà un nome. Quale?",
      riserve: ["Porchettino", "Signor Frittella", "Capitan Tagadà"] },
    { id: "sag-s16", q: "{P} vuole un giro gratis sull'autoscontro. Al bigliettaio dice: «___»",
      riserve: ["Il sindaco è mio cugino", "È il mio compleanno. Quasi", "Non vado a sbattere, giuro"] },
    { id: "sag-s17", q: "{P} dà una mano alla Pro Loco. Cosa c'è scritto sul suo cartellino?",
      riserve: ["STAFF (non chiedetemi niente)", "Sicurezza tovaglioli", "Capo frittelle (in prova)"] }
  ],
  disegna: [
    { id: "sag-d01", q: "Disegna su {P} il cappello con la piuma e i baffoni del capobanda", su: "ritratto", adesivi: "🪶🎺🥁" },
    { id: "sag-d02", q: "Disegna su {P} il costume della sua contrada per il palio degli asini", su: "ritratto", adesivi: "🐴🚩🛡️🎽" },
    { id: "sag-d03", q: "Disegna su {P} il costume da ortaggio per la sfilata dei carri", su: "ritratto", adesivi: "🥕🍆🧅🌽🥬" },
    { id: "sag-d04", q: "Disegna su {P} tutti i premi vinti al tirassegno, addosso", su: "ritratto", adesivi: "🐟🦄🎈🧸" },
    { id: "sag-d05", q: "Disegna su {P} la caricatura della sagra: esagera la sua passione", su: "ritratto", adesivi: "🎨🖌️👑" },
    { id: "sag-d06", q: "Disegna la mascotte della sagra della porchetta, inventata da {P}", su: "scena", adesivi: "🐷👑🧢🎉" },
    { id: "sag-d07", q: "Disegna la giostra nuova inventata da {P}", su: "scena", adesivi: "🌀🚀🐉🎢" },
    { id: "sag-d08", q: "Disegna la pista dell'autoscontro quando guida {P}", su: "scena", adesivi: "🚗💥🚧⭐" },
    { id: "sag-d09", q: "Disegna cosa vede {P} dalla ruota panoramica, ferma da mezz'ora", su: "scena", adesivi: "🎡🌭🐄⛪🎪" },
    { id: "sag-d10", q: "Disegna il gonfiabile che {P} vorrebbe alla sagra", su: "scena", adesivi: "🏰🐳🦖🎈" },
    { id: "sag-d11", q: "Disegna la mappa della sagra secondo {P}: solo i posti dove si mangia", su: "scena", adesivi: "🗺️📍🍕🥨" },
    { id: "sag-d12", q: "Disegna il manifesto della sagra con {P} come testimonial", su: "bianco", adesivi: "📜⭐📣" }
  ],
  chi: [
    { id: "sag-c01", q: "Chi di noi si iscriverebbe alla gara dei mangiatori di polenta e si farebbe squalificare per aver barato?", titolo: "Squalifica per polenta" },
    { id: "sag-c02", q: "Chi di noi, dopo un'ora alla sagra, conoscerebbe tutti per nome e avrebbe già un soprannome in paese?", titolo: "Cittadinanza onoraria" },
    { id: "sag-c03", q: "Chi di noi finirebbe a ballare il liscio con una signora di ottant'anni e non riuscirebbe più a scappare?", titolo: "Ostaggio del liscio" },
    { id: "sag-c04", q: "Chi di noi salirebbe sull'autoscontro solo per inseguire la stessa persona per tutto il giro?", titolo: "Mirino da autoscontro" },
    { id: "sag-c05", q: "Chi di noi salirebbe sul trattore in esposizione e si farebbe fare cento foto al volante?", titolo: "Trattorista per un giorno" },
    { id: "sag-c06", q: "Chi di noi si farebbe leggere la mano alla bancarella e ci crederebbe parola per parola?", titolo: "Futuro alla bancarella" },
    { id: "sag-c07", q: "Chi di noi si ritroverebbe, per sbaglio, presidente della Pro Loco per l'anno prossimo?", titolo: "Presidente per sbaglio" },
    { id: "sag-c08", q: "Chi di noi tornerebbe a casa con un pesce rosso vinto alla sagra, senza sapere dove metterlo?", titolo: "Pesciolino senza casa" },
    { id: "sag-c09", q: "Chi di noi riuscirebbe a farsi dare dal porchettaro la fetta con la crosticina, ogni volta?", titolo: "Crosticina raccomandata" },
    { id: "sag-c10", q: "Chi di noi arriverebbe in cima al palo della cuccagna… e poi non riuscirebbe più a scendere?", titolo: "In cima alla cuccagna" },
    { id: "sag-c11", q: "Chi di noi sfiderebbe i vecchietti del paese alla gara di bocce e perderebbe malissimo?", titolo: "Umiliazione a bocce" },
    { id: "sag-c12", q: "Chi di noi passerebbe un'ora alla bancarella dei dolci a farsi dare gli assaggi gratis?", titolo: "Assaggio gratis, grazie" },
    { id: "sag-c13", q: "Chi di noi si farebbe convincere a fare un giro sul pony dei bambini?", titolo: "Giro sul pony" },
    { id: "sag-c14", q: "Chi di noi passerebbe la sagra a cercare la bancarella degli arrosticini che c'era «l'anno scorso, giuro»?", titolo: "Bancarella fantasma" }
  ]
});

/* ---------------------------------------------------------
   🚑 AL PRONTO SOCCORSO (solo piccoli incidenti buffi)
   --------------------------------------------------------- */
SG_CHIDINOI.posti.push({
  id: "pronto", cod: "pro", nome: "Al pronto soccorso", emoji: "🚑",
  adesivi: "🩹🩼🧊🌡️🛏️🍮☕🎈🖊️🧸🪑🔢",
  entrata: [
    "Sala d'attesa, numerino 214. Stanno chiamando il 38. Coraggio, {P}.",
    "Codice bianco, sedia di plastica, caffè alla macchinetta. Tocca a {P}.",
    "Niente di grave, giurano tutti. Tranne {P}: ha già avvisato i parenti."
  ],
  immagini: [
    { id: "pro-i01", q: "Chi accompagna {P} al pronto soccorso?", carte: [
      { chi: "mamma", faccia: "terrore", t: "La mamma, con la valigia" },
      { chi: "nonno", faccia: "furbo", t: "Il nonno: conosce tutti i medici" },
      { chi: "cugino", faccia: "esulta", t: "Il cugino, che filma tutto" },
      { chi: "vicino", faccia: "sonno", t: "Il vicino: l'unico sveglio" }
    ] },
    { id: "pro-i02", q: "Al pronto soccorso danno a {P} il codice bianco: sei ore di attesa. Cosa fa {P}?", carte: [
      { e: "🛋️🤝", t: "Si sistema e fa amicizia con tutti" },
      { e: "⏰❓", t: "Chiede ogni mezz'ora quanto manca" },
      { e: "🏠🙄", t: "«Ormai m'è passato» e va via" },
      { e: "📱🔴", t: "Racconta tutto in diretta" }
    ] },
    { id: "pro-i03", q: "Che faccia fa {P} quando, dopo sei ore, scopre di aver aspettato nel reparto sbagliato?", carte: [
      { lui: "arrabbiato", t: "Pretende la visita lì, e subito" },
      { lui: "triste", t: "Ricomincia la fila da capo" },
      { lui: "sorpreso", t: "«Ma se c'era scritto!»" },
      { lui: "indifferente", t: "Tanto era lì per il caffè" }
    ] },
    { id: "pro-i04", q: "Finalmente chiamano {P}. Chi c'è ad aspettare in ambulatorio?", carte: [
      { chi: "dottore", faccia: "sonno", t: "Il medico di turno da 30 ore" },
      { chi: "dottore", f: "d", faccia: "estasi", t: "Una dottoressa che ride di tutto" },
      { chi: "prof", faccia: "pensieroso", t: "Il tirocinante, col manuale" },
      { chi: "infermiere", faccia: "furbo", t: "L'infermiere che fa le imitazioni" }
    ] },
    { id: "pro-i05", q: "L'infermiere sta per fare la puntura a {P}. Cosa fa {P}?", carte: [
      { e: "👁️💉", t: "Fissa l'ago senza battere ciglio" },
      { e: "🙈🎶", t: "Gira la testa e canticchia" },
      { e: "❓🔁", t: "«Ma è proprio necessaria?» ×5" },
      { e: "😂🃏", t: "Racconta barzellette per distrarsi" }
    ] },
    { id: "pro-i06", q: "Chi aspetta in sala d'attesa da ancora più ore di {P}?", carte: [
      { chi: "calciatore", faccia: "triste", t: "Un calciatore che recita il fallo" },
      { chi: "bimbo", faccia: "imbarazzo", t: "Un bimbo col secchiello in testa" },
      { chi: "supereroe", faccia: "finto", t: "Un supereroe caduto dal divano" },
      { chi: "nonna", faccia: "felice", t: "Una nonna col pranzo per tutti" }
    ] },
    { id: "pro-i07", q: "Il medico chiede a {P}: «Le metto il gesso. Di che colore lo vuole?». Cosa sceglie?", carte: [
      { e: "💗", t: "Rosa fluo, senza pensarci" },
      { e: "🪖🌿", t: "Mimetico, da film d'azione" },
      { e: "⬜✍️", t: "Bianco: così lo firmano tutti" },
      { e: "✨💎", t: "«Ce l'avete coi brillantini?»" }
    ] },
    { id: "pro-i08", q: "Chi ha fatto finire {P} al pronto soccorso?", carte: [
      { chi: "bimbo", faccia: "furbo", t: "Il nipotino, col monopattino" },
      { chi: "nonna", faccia: "felice", t: "La nonna: «Assaggia, è bollente»" },
      { chi: "allenatore", faccia: "esulta", t: "Il personal trainer, primo giorno" },
      { e: "🐕💨", t: "Il cane, che ha visto un gatto" }
    ] },
    { id: "pro-i09", q: "L'infermiere chiede a {P}: «Quanto fa male, da 1 a 10?». Cosa risponde {P}?", carte: [
      { e: "🔟😭", t: "Dieci, con le lacrime agli occhi" },
      { e: "3️⃣😤", t: "Tre, per non sembrare debole" },
      { e: "🎭1️⃣1️⃣", t: "«Undici», con voce teatrale" },
      { e: "🤔7️⃣", t: "Ci pensa: «Sette e mezzo»" }
    ] },
    { id: "pro-i10", q: "Che faccia fa {P} quando il dottore guarda la lastra e dice solo «Mmh»?", carte: [
      { lui: "terrore", t: "Chiama subito la mamma" },
      { lui: "pensieroso", t: "Legge la lastra al contrario" },
      { lui: "indifferente", t: "Pensa già al budino" },
      { lui: "finto", t: "Sorride, sperando in un «niente»" }
    ] },
    { id: "pro-i11", q: "In osservazione per due ore: chi c'è nel letto accanto a {P}?", carte: [
      { chi: "nonno", faccia: "felice", t: "Ti mostra le sue lastre dal 1970" },
      { chi: "influencer", faccia: "finto", piu: { mano: "telefono" }, t: "Diretta: «Giorno 1 in ospedale»" },
      { chi: "cuoco", faccia: "disgusto", t: "Dà i voti al brodino, da chef" },
      { chi: "bimbo", faccia: "esulta", t: "Fa su e giù col letto elettrico" }
    ] },
    { id: "pro-i12", q: "Il medico dice a {P}: «Niente di grave, può tornare a casa». Cosa fa {P}?", carte: [
      { e: "🦘🚪", t: "Esce saltellando" },
      { e: "🩻🙏", t: "Vuole la lastra lo stesso" },
      { e: "📄😏", t: "Chiede il certificato per 2 giorni" },
      { e: "😞🦴", t: "Ci resta male: voleva il gesso" }
    ] },
    { id: "pro-i13", q: "Con {P} c'è la mamma, che risponde al dottore al posto suo. Cosa fa {P}?", carte: [
      { e: "🤐👍", t: "La lascia parlare: si fa prima" },
      { e: "☝️🔁", t: "La corregge su ogni dettaglio" },
      { e: "🙅👩", t: "Fa segno: «Non ascoltarla»" },
      { e: "😳⬆️", t: "Fissa il soffitto dalla vergogna" }
    ] },
    { id: "pro-i14", q: "Per una storta, {P} va a fare la lastra in barella. Chi la spinge?", carte: [
      { chi: "infermiere", faccia: "esulta", t: "Un infermiere: curve a tutta" },
      { chi: "nonno", faccia: "furbo", t: "Un nonno che fa i sorpassi" },
      { chi: "cugino", faccia: "linguaccia", t: "Il cugino che fa «brum brum»" },
      { chi: "bimbo", faccia: "triste", t: "Un bimbo: vuole fare a cambio" }
    ] },
    { id: "pro-i15", q: "Il dottore prescrive a {P} una settimana di riposo assoluto. Come la passa?", carte: [
      { e: "🛋️👑", t: "Si fa portare tutto sul divano" },
      { e: "⚽🤫", t: "Il giorno dopo è già al calcetto" },
      { e: "📞🔁", t: "Lo racconta a tutti, uno a uno" },
      { e: "📸🩹", t: "Una foto del cerotto al giorno" }
    ] },
    { id: "pro-i16", q: "L'infermiere mette a {P} il braccialetto col nome… scritto sbagliato. Cosa fa {P}?", carte: [
      { e: "✏️🔤", t: "Fa correggere ogni lettera" },
      { e: "🆕😎", t: "Se lo tiene: ora si chiama così" },
      { e: "👑📝", t: "Ci aggiunge «Sua Maestà»" },
      { e: "📸😂", t: "Foto, e la manda nel gruppo" }
    ] },
    { id: "pro-i17", q: "Il tabellone salta il numero di {P}. Chi passa avanti?", carte: [
      { chi: "re", faccia: "indifferente", t: "Uno con la corona: «Ho fretta»" },
      { chi: "nonno", faccia: "furbo", t: "«Sono amico del primario»" },
      { chi: "sposo", faccia: "imbarazzo", t: "Uno sposo, scivolato sulla torta" },
      { chi: "cowboy", faccia: "triste", t: "Un cowboy, da una festa a tema" }
    ] },
    { id: "pro-i18", q: "In sala d'attesa la TV è bloccata sulle televendite di materassi, da tre ore. Cosa fa {P}?", carte: [
      { e: "🛏️📞", t: "Alla fine ne ordina uno" },
      { e: "🔍📺", t: "Cerca il telecomando ovunque" },
      { e: "🎙️📺", t: "Fa la telecronaca alla sala" },
      { e: "😴🛏️", t: "Si addormenta: funzionano" }
    ] },
    { id: "pro-i19", q: "Che faccia fa {P} quando il gesso comincia a prudere e non si può grattare?", carte: [
      { lui: "furbo", t: "Ha già pronto un ferro da maglia" },
      { lui: "triste", t: "Sopporta, fissando il soffitto" },
      { lui: "arrabbiato", t: "Vuole toglierlo, subito" },
      { lui: "sonno", t: "Non sente niente: dorme" }
    ] },
    { id: "pro-i20", q: "Il dottore riconosce {P}: «Ancora lei? È la terza volta questo mese!». Cosa fa {P}?", carte: [
      { e: "😄👨‍⚕️", t: "Gli chiede come sta la famiglia" },
      { e: "🙏🆕", t: "«Stavolta è diverso, giuro»" },
      { e: "👉🧑‍🤝‍🧑", t: "«Sono qui per un amico»" },
      { e: "💳🎁", t: "Chiede se c'è la tessera fedeltà" }
    ] },
    { id: "pro-i21", q: "In sala d'attesa un signore scambia {P} per il medico di turno e chiede un parere. Cosa fa {P}?", carte: [
      { e: "🩺🤓", t: "Consiglio serissimo, inventato" },
      { e: "🙅🩺", t: "Dice subito che si sbaglia" },
      { e: "👉👨‍⚕️", t: "Lo manda dall'infermiere" },
      { e: "👂😌", t: "Ascolta tutto e annuisce" }
    ] },
    { id: "pro-i22", q: "L'infermiere chiama ad alta voce il soprannome d'infanzia di {P}: l'ha scritto la mamma. Cosa fa?", carte: [
      { e: "🙋🌟", t: "Si alza e saluta come una star" },
      { e: "⏳🤐", t: "Aspetta che dicano il nome vero" },
      { e: "🧥🙈", t: "Si alza col cappuccio in testa" },
      { e: "😂🪑", t: "Ride così tanto che non si alza" }
    ] },
    { id: "pro-i23", q: "Chi viene a trovare {P} con il regalo più assurdo?", carte: [
      { chi: "zia", faccia: "felice", t: "La zia, con una teglia di lasagne" },
      { chi: "clown", faccia: "esulta", t: "Un clown di corsia, in esclusiva" },
      { chi: "cugino", faccia: "indifferente", t: "Il cugino: il caricatore sbagliato" },
      { chi: "capo", faccia: "finto", t: "Il capo: «Ti ho portato il pc»" }
    ] },
    { id: "pro-i24", q: "Cosa si porta {P} per passare l'attesa al pronto soccorso?", carte: [
      { e: "🧩✏️", t: "Le parole crociate del nonno" },
      { e: "🥪🥪", t: "Panini per tutta la sala" },
      { e: "🎧📺", t: "Cuffie e tre serie scaricate" },
      { e: "🛏️🧸", t: "Cuscino e peluche, da casa" }
    ] },
    { id: "pro-i25", q: "{P} arriva al pronto soccorso col dito incastrato nel barattolo della marmellata. Cosa fa?", carte: [
      { e: "🫙👋", t: "Saluta tutti col barattolo" },
      { e: "🧥🤫", t: "Nasconde la mano nella giacca" },
      { e: "🔬🤓", t: "«È un esperimento scientifico»" },
      { e: "🤳🫙", t: "Un selfie, per ricordo" }
    ] }
  ],
  scrivi: [
    { id: "pro-s01", q: "Il medico chiede a {P}: «Com'è successo?». Cosa risponde {P}?",
      riserve: ["Ho fatto la ruota per la nonna", "Il divano si è spostato da solo", "Inseguivo il gatto. Ha vinto lui"] },
    { id: "pro-s02", q: "L'infermiere chiede chi avvisare in caso di bisogno. {P} detta: «Chiamate ___»",
      riserve: ["la nonna: arriva prima dell'ambulanza", "nessuno, sennò viene tutto il paese", "mio cugino, ma non ditegli perché"] },
    { id: "pro-s03", q: "Prima di entrare in ambulatorio, {P} si raccomanda con chi l'accompagna: «___»",
      riserve: ["Se urlo, è per finta", "Tieni la merenda, la rivoglio intera", "Qualunque cosa dica, annuisci e basta"] },
    { id: "pro-s04", q: "{P} ha il numero 214 e stanno chiamando il 38. Scrive nel gruppo: «___»",
      riserve: ["Il 37 mi ha invitato al matrimonio", "Un signore mi vuole adottare", "Portate la cena. Per otto"] },
    { id: "pro-s05", q: "{P} compila il modulo dell'accettazione. Alla voce «Note», scrive: «___»",
      riserve: ["Mordo se mi fate la puntura", "Mi piace il budino al cioccolato", "Sono qui solo per accompagnare"] },
    { id: "pro-s06", q: "{P} racconta l'incidente sui social per fare colpo. Cosa scrive?",
      riserve: ["Incidente in missione. Missione: cucina", "Ho salvato un gatto. Il gatto sta bene", "Non posso dire di più. Missione segreta"] },
    { id: "pro-s07", q: "L'infermiere strappa il cerotto a {P} con un colpo solo. Cosa urla {P}?",
      riserve: ["Mamma! Mammaaaa!", "Piano, era un cerotto vintage", "Ci eravamo affezionati!"] },
    { id: "pro-s08", q: "In sala d'attesa {P} fonda un gruppo WhatsApp con gli altri pazienti. Come si chiama?",
      riserve: ["Quelli del codice bianco", "Sopravvissuti alla macchinetta", "Sedie di plastica per sempre"] },
    { id: "pro-s09", q: "Il dottore scrive la cura per {P}. Sulla ricetta c'è scritto: «___»",
      riserve: ["Divano e serie TV, tre volte al giorno", "Vietati i balletti per sei mesi", "Gelato, solo quando fa male"] },
    { id: "pro-s10", q: "Prima della lastra il tecnico dice: «Non si muova». {P} resiste tre secondi, poi: «___»",
      riserve: ["Mi prude il naso, è un'emergenza", "Posso almeno respirare?", "Rifacciamola, avevo gli occhi chiusi"] },
    { id: "pro-s11", q: "{P} vuole andare via in tempo per vedere la partita. All'infermiere giura: «___»",
      riserve: ["Guardi, cammino benissimo. Ahi", "È solo un graffio, il gesso è di moda", "Torno domani, promesso, con la pizza"] },
    { id: "pro-s12", q: "L'infermiere chiede a {P}: «Allergie?». {P} risponde: «Sì, ___»",
      riserve: ["alle attese più lunghe di sei ore", "ai numerini che non arrivano mai", "alle punture. E alle domande"] },
    { id: "pro-s13", q: "Finalmente chiamano {P}, che si alza e dice a tutta la sala: «___»",
      riserve: ["Ce l'ho fatta! Vi voglio bene!", "Addio, amici del codice bianco", "Vi lascio la sedia: è calda"] },
    { id: "pro-s14", q: "La macchinetta dell'ospedale si mangia l'euro di {P}. Sopra ci attacca un biglietto: «___»",
      riserve: ["Mi devi un euro e la dignità", "Ti ho dato tutto. Tu niente", "Il budino lo prendo altrove"] },
    { id: "pro-s15", q: "Un bambino in sala d'attesa chiede a {P}: «Cosa ti è successo?». Cosa risponde {P}?",
      riserve: ["Ho combattuto un drago. Ha vinto lui", "Mi ha morso un pinguino, giuro", "Ho mangiato troppa verdura"] },
    { id: "pro-s16", q: "{P} chiede all'infermiere una cosa speciale per l'attesa. Cosa chiede?",
      riserve: ["Un cuscino e il wifi del primario", "Il budino. Due. Anzi, tre", "Di chiamarmi prima del 38"] },
    { id: "pro-s17", q: "{P} arriva in ambulanza per una cosa piccolissima. Scendendo, dice ai barellieri: «___»",
      riserve: ["Grazie del passaggio, ora vado a piedi", "La sirena si poteva anche evitare", "Al ritorno mi lasciate sotto casa?"] }
  ],
  disegna: [
    { id: "pro-d01", q: "Disegna su {P} il gesso al braccio pieno di firme, cuori e dediche", su: "ritratto", adesivi: "✍️❤️⭐" },
    { id: "pro-d02", q: "Disegna su {P} le bende da mummia e un cerotto sul naso", su: "ritratto", adesivi: "🧻🩹" },
    { id: "pro-d03", q: "Disegna su {P} collare, gesso alla gamba e stampelle da tifoso", su: "ritratto", adesivi: "🧣📣⚽" },
    { id: "pro-d04", q: "Disegna su {P} il cerotto più grande del mondo e il lecca-lecca", su: "ritratto", adesivi: "🍭" },
    { id: "pro-d05", q: "Disegna su {P} camice, stetoscopio e occhiali: ora visita gli altri", su: "ritratto", adesivi: "🩺👓📋" },
    { id: "pro-d06", q: "Disegna su {P} il look dopo 9 ore di sala d'attesa: coperta e merende", su: "ritratto", adesivi: "🧣🍫🛌" },
    { id: "pro-d07", q: "Disegna la sala d'attesa dopo che {P} l'ha arredata per stare più comodi", su: "scena", adesivi: "🛋️🪴📺🛁" },
    { id: "pro-d08", q: "Disegna lo striscione dei parenti per {P} che esce dal pronto soccorso", su: "scena", adesivi: "🎉🎈📣🏠" },
    { id: "pro-d09", q: "Disegna la sedia più comoda del mondo, inventata da {P} per l'attesa", su: "scena", adesivi: "☁️🛋️🔌🍿" },
    { id: "pro-d10", q: "Disegna il letto in corsia di {P} dopo una giornata di visite", su: "scena", adesivi: "🎈💐🍫📦" },
    { id: "pro-d11", q: "Disegna l'ambulanza personalizzata di {P}", su: "scena", adesivi: "🚑🎵💡🌈" },
    { id: "pro-d12", q: "Disegna la lastra di {P}: si vede tutto quello che ha mangiato oggi", su: "bianco", adesivi: "🍕🍝🍩🧦" }
  ],
  chi: [
    { id: "pro-c01", q: "Chi di noi finirebbe al pronto soccorso per una scivolata sul pavimento appena lavato dalla mamma?", titolo: "Scivolata sul bagnato" },
    { id: "pro-c02", q: "Chi di noi, in sala d'attesa, farebbe amicizia con tutti e saprebbe la storia di ogni paziente?", titolo: "Ufficio informazioni" },
    { id: "pro-c03", q: "Chi di noi andrebbe al pronto soccorso per una scheggia nel dito e avviserebbe tutti i parenti?", titolo: "Dramma della scheggia" },
    { id: "pro-c04", q: "Chi di noi arriverebbe al pronto soccorso col pigiama dei dinosauri, senza accorgersene?", titolo: "Pigiama coi dinosauri" },
    { id: "pro-c05", q: "Chi di noi, durante l'attesa, girerebbe tutto l'ospedale e tornerebbe con la mappa dei bagni migliori?", titolo: "Mappa dei bagni migliori" },
    { id: "pro-c06", q: "Chi di noi, per un livido, leggerebbe tutto su internet e arriverebbe con tre diagnosi già pronte?", titolo: "Diagnosi da internet" },
    { id: "pro-c07", q: "Chi di noi finirebbe al pronto soccorso per aver provato un balletto visto sui social?", titolo: "Infortunio da balletto" },
    { id: "pro-c08", q: "Chi di noi, in sala d'attesa, applaudirebbe ogni volta che chiamano un numero?", titolo: "Ola per i numerini" },
    { id: "pro-c09", q: "Chi di noi si farebbe accompagnare al pronto soccorso da tutta la famiglia, cugini compresi?", titolo: "Corteo al pronto soccorso" },
    { id: "pro-c10", q: "Chi di noi accompagnerebbe un amico al pronto soccorso e alla fine si farebbe visitare al posto suo?", titolo: "Paziente per sbaglio" },
    { id: "pro-c11", q: "Chi di noi, dopo una storta, girerebbe con le stampelle anche quando non servono più?", titolo: "Stampelle a vita" },
    { id: "pro-c12", q: "Chi di noi, in corsia, riuscirebbe a farsi dare tre budini dall'infermiere solo sorridendo?", titolo: "Tre budini col sorriso" },
    { id: "pro-c13", q: "Chi di noi, quando finalmente chiamano il suo numero, starebbe dormendo sulla sedia da cinque minuti?", titolo: "Il numero che dorme" },
    { id: "pro-c14", q: "Chi di noi, il giorno dopo, tornerebbe al pronto soccorso con i cornetti per gli infermieri?", titolo: "Cornetti per la corsia" }
  ]
});

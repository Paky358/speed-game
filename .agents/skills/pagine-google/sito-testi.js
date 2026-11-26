/* 🔎 I testi delle pagine per Google che non sono di un gioco: la pagina di tutti i giochi (/giochi/),
   il testo nascosto nella pagina d'ingresso (revelhouse.it, coperto dall'app), le categorie e le note sui marchi.
   Li usa fai-pagine.js. Italiano semplice e caldo, niente promesse false (gratis e senza pubblicità sono veri:
   lo dicono regole.html e privacy.html). */
module.exports = {
  sito: "https://revelhouse.it",

  // la pagina d'ingresso: <title> e descrizione (stanno in app/testa.html e in index.html: le scrive fai-pagine.js)
  ingresso: {
    titolo: "Revel House · giochi da fare con gli amici, online e dal telefono",
    descr: "Giochi per le serate con gli amici, gratis dal telefono: ognuno dal suo o passandovelo. L'Impostore, Pecora Nera, la Mini Asta del fantacalcio, Scarabocchio e tanti altri.",
    h1: "Revel House: giochi da fare con gli amici, dal telefono",
    p: [
      "Revel House è una raccolta di giochi per le serate con gli amici. Si gioca dal telefono, gratis e senza pubblicità: ognuno dal suo, anche da città diverse, oppure tutti intorno a un telefono solo che passa di mano in mano.",
      "Chi apre la serata manda il link nel gruppo di WhatsApp, gli amici entrano con un tocco e da lì si passa da un gioco all'altro senza uscire, con la classifica della serata che somma i punti di tutti i giochi."
    ]
  },

  // la pagina di tutti i giochi: revelhouse.it/giochi/
  tutti: {
    titolo: "Giochi da fare con gli amici online e sul telefono",
    descr: "Più di 30 giochi da fare con gli amici, gratis dal telefono: online ognuno dal suo o passandovi un telefono solo. Quiz, carte, bluff, disegni, asta e sfide.",
    h1: "Giochi da fare con gli amici, online o sullo stesso telefono",
    intro: "Una serata in casa, una cena che si allunga, un gruppo sparso in città diverse: qui trovi i giochi di Revel House, tutti gratis e senza pubblicità, da fare dal telefono con gli amici.",
    sezioni: [
      { t: "Ognuno dal suo telefono", p: ["Chi apre la serata tocca «Gioca online» e manda il link o il codice di 4 lettere nel gruppo. Gli amici entrano con un tocco, si siedono in saletta e quando tutti sono pronti si parte. Finita una partita si sceglie il gioco dopo senza uscire: la Sala della serata tiene insieme il gruppo e somma i punti di tutti i giochi."] },
      { t: "Un telefono solo per tutti", p: ["Molti giochi si fanno anche con un telefono solo: lo si appoggia in mezzo al tavolo o lo si passa di mano in mano, e ognuno guarda la sua parte in segreto quando tocca a lui. Perfetto quando siete seduti tutti insieme sul divano."] },
      { t: "Come si comincia", p: ["Apri revelhouse.it dal telefono, scegli il nome e la tua emoji, e sei pronto. Non c'è niente da scaricare (se vuoi, la aggiungi alla schermata Home e si apre come un'app). Le monete del gioco sono finte: si gioca solo per divertirsi."] }
    ]
  },

  // le categorie (come nella home dell'app), nell'ordine della pagina di tutti i giochi
  categorie: [
    { id: "festa", nome: "🎉 Giochi da festa", sotto: "Bluff, risate e chi la pensa come gli amici" },
    { id: "parole", nome: "🧠 Quiz e parole", sotto: "Indovinare, scrivere, mettere in ordine" },
    { id: "carte", nome: "🃏 Giochi di carte", sotto: "Le carte napoletane e quelle francesi" },
    { id: "sfida", nome: "⚔️ Uno contro uno", sotto: "Sfide a due, contro un amico o contro il Bot" },
    { id: "mini", nome: "🎮 Minigiochi", sotto: "Corse, tiri e riflessi" }
  ],

  // le note in fondo alle pagine che portano un nome di altri (non siamo affiliati)
  marchi: {
    astafanta: "«Fantacalcio» è un marchio registrato dei suoi proprietari. La Mini Asta è un gioco amatoriale di Revel House: non è affiliata, sponsorizzata né approvata da loro, e non usa i loro servizi.",
    ruota: "«La Ruota della Fortuna» è un marchio dei rispettivi proprietari. Questo è un gioco amatoriale di Revel House: non è il programma televisivo, non è affiliato né approvato da chi lo produce.",
    prezzo: "«Il Prezzo è Giusto» è un marchio dei rispettivi proprietari. Questo è un gioco amatoriale di Revel House: non è il programma televisivo, non è affiliato né approvato da chi lo produce."
  },
  marchiTutti: "Revel House è un progetto amatoriale e gratuito. I nomi di giochi, programmi e marchi citati appartengono ai loro proprietari: Revel House non è affiliata a nessuno di loro."
};

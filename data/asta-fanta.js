/* =========================================================
   DATI — "Mini asta Fantacalcio" per il gioco "L'Asta"
   Calciatori divisi per RUOLO (P/D/C/A) e per FASCIA (A/B/C).
   Le fasce servono SOLO al motore per costruire un mazzo
   bilanciato: in partita NON si vedono mai, si mostra solo
   Nome · Squadra · Ruolo.
   Formato: "Nome (Squadra)".
   ========================================================= */
window.SG_FANTA_CALCIATORI = {
  // ---------- PORTIERI ----------
  P: {
    A: [
      "Svilar (Roma)", "Carnesecchi (Atalanta)", "Martinez Jo. (Inter)",
      "Vicario (Juventus)", "Butez (Como)", "Maignan (Milan)"
    ],
    B: [
      "Caprile (Cagliari)", "Mandas (Lazio)", "De Gea (Fiorentina)",
      "Skorupski (Bologna)", "Falcone (Lecce)", "Okoye (Udinese)",
      "Milinkovic-Savic V. (Napoli)", "Meret (Napoli)",
      "Corvi (Parma)", "Provedel (Inter)"
    ],
    C: [
      "Perri (Torino)", "Bijlow (Genoa)", "Muric (Sassuolo)",
      "Palmisani (Frosinone)", "Stankovic F. (Venezia)", "Thiam (Monza)",
      // 2 nov 2026: entrati col listone 2026/27 (quotazione da 10 in su, o da 7 a 9 e giocano davvero)
      "Gollini (Roma)"
    ]
  },

  // ---------- DIFENSORI ----------
  D: {
    A: [
      "Dimarco (Inter)", "Wesley (Roma)", "Bremer (Juventus)", "Akanji (Inter)",
      "Mancini (Roma)", "Bastoni (Inter)", "Rrahmani (Napoli)", "Kalulu (Juventus)",
      "Pavlovic (Milan)", "Solet (Udinese)", "Bisseck (Inter)", "Di Lorenzo (Napoli)",
      "Gila (Milan)", "Ramon (Como)", "Stones (Inter)", "Hermoso (Roma)",
      "Chalobah T. (Como)",
      // 2 nov 2026: entrati col listone 2026/27 (quotazione da 10 in su, o da 7 a 9 e giocano davvero)
      "Oyono A. (Frosinone)"
    ],
    B: [
      "Molina N. (Roma)", "Spence (Inter)", "Ostigard (Genoa)", "Scalvini (Atalanta)",
      "Carlos Augusto (Inter)", "Couto (Como)", "Dodo (Fiorentina)", "Kamara H. (Udinese)",
      "Mangas (Monza)", "Tiago Gabriel (Lecce)", "Valeri (Parma)", "Vasquez (Genoa)",
      "Bartesaghi (Milan)", "Belghali (Torino)", "Cambiaso (Juventus)", "Comuzzo (Torino)",
      "Delprato (Parma)", "Doekhi (Lazio)", "Dragusin (Fiorentina)", "Jimenez A. (Fiorentina)",
      "Kaiki (Como)", "Lucumi (Juventus)", "Miranda J. (Bologna)", "Spinazzola (Napoli)",
      "Theate (Bologna)", "Vojvoda (Udinese)", "Zappacosta (Atalanta)", "Bracaglia (Frosinone)",
      "Celik (Juventus)", "Valle (Como)", "Tavares N. (Lazio)", "Bellanova (Atalanta)",
      "Kossounou (Atalanta)", "Pavard (Inter)",
      // 2 nov 2026: entrati col listone 2026/27 (quotazione da 10 in su, o da 7 a 9 e giocano davvero)
      "N'Dicka (Roma)", "Abankwah (Udinese)", "Zortea (Bologna)", "Calvani (Frosinone)",
      "Pedraza (Lazio)", "Veiga D. (Lecce)", "Kouadio (Monza)"
    ],
    C: [
      "Diego Carlos (Parma)", "Obert (Cagliari)", "Balerdi (Roma)", "Coco (Torino)",
      "Doig (Sassuolo)", "Fortini (Torino)", "Hien (Atalanta)", "Idzes (Sassuolo)",
      "Ismajli (Torino)", "Leysen F. (Sassuolo)", "Mina (Cagliari)", "Ze Pedro (Cagliari)",
      "Badiashile (Napoli)", "Bernasconi (Atalanta)", "Birindelli (Monza)", "Buongiorno (Napoli)",
      "Gabbia (Milan)", "Gallo (Lecce)", "Hainaut (Venezia)", "Heggem (Bologna)",
      "Holm (Bologna)", "Kempf (Como)", "Kolasinac (Atalanta)", "Kristensen T. (Atalanta)",
      "Marusic (Lazio)", "Lulli (Roma)", "Tomori (Milan)", "Beukema (Napoli)",
      "De Winter (Milan)", "Gatti (Juventus)", "Favasuli (Napoli)",
      "Valdepenas (Fiorentina)", "Cinquegrano (Sassuolo)", "Floriani Mussolini (Lazio)", "Juan Jesus (Venezia)",
      "Mazzocchi (Venezia)", "Olivera (Napoli)", "Provstgaard (Lazio)", "Rensch (Roma)",
      "Vitik (Bologna)", "Estupinan (Milan)", "Marin R. (Napoli)",
      // 2 nov 2026: entrati col listone 2026/27 (quotazione da 10 in su, o da 7 a 9 e giocano davvero)
      "Terzic (Frosinone)", "Goglichidze (Monza)", "Casale (Bologna)", "Monterisi (Frosinone)",
      "Siebert (Lecce)", "Sutalo J. (Lazio)"
    ]
  },

  // ---------- CENTROCAMPISTI ----------
  C: {
    A: [
      "Paz N. (Como)", "Calhanoglu (Inter)", "McTominay (Napoli)", "Orsolini (Bologna)",
      "Pulisic (Milan)", "Rabiot (Milan)", "Baturina (Como)", "Mora (Roma)",
      "Barella (Inter)", "Da Cunha (Como)", "De Bruyne (Napoli)", "Zaniolo (Udinese)",
      "Atta (Fiorentina)", "McKennie (Juventus)", "Zaccagni (Lazio)", "Mastantuono (Fiorentina)"
    ],
    B: [
      "Conceicao (Juventus)", "Ekkelenkamp (Udinese)", "Gonzalez N. (Juventus)", "Gudmundsson A. (Lazio)",
      "Moreira (Milan)", "Samardzic (Atalanta)", "Taylor K. (Lazio)", "Zielinski (Inter)",
      "Ederson D.S. (Atalanta)", "Jones C. (Inter)", "Modric (Milan)", "Vlasic (Torino)",
      "Alajbegovic (Juventus)", "Baldanzi (Genoa)", "Frattesi (Lazio)", "Goncalves P. (Fiorentina)",
      "Kessie (Atalanta)", "Perrone (Como)", "Rodriguez Je. (Como)", "Bernardeschi (Bologna)",
      "Cancellieri (Lazio)", "Diouf (Inter)", "Kone M. (Roma)", "Lobotka (Napoli)",
      "Mandragora (Torino)", "Politano (Napoli)", "Rowe (Atalanta)", "Saelemaekers (Milan)",
      "Thorstvedt (Sassuolo)", "Zambo Anguissa (Napoli)",
      // 2 nov 2026: entrati col listone 2026/27 (quotazione da 10 in su, o da 7 a 9 e giocano davvero)
      "Pobega (Bologna)", "Zalewski (Atalanta)", "Messias (Genoa)", "Caqueret (Como)",
      "Belahyane (Lazio)", "Matic (Sassuolo)", "Bakola (Sassuolo)"
    ],
    C: [
      "Adzic (Sassuolo)", "Calo (Frosinone)", "Casadei (Torino)", "Colpani (Monza)",
      "Coulibaly L. (Lecce)", "Cristante (Roma)", "Isaksen (Lazio)", "Pellegrini Lo. (Roma)",
      "Thuram K. (Juventus)", "Vergara (Napoli)", "Volpato (Sassuolo)", "Adopo (Cagliari)",
      "Cambiaghi (Bologna)", "Chukwueze (Milan)", "Fagioli (Fiorentina)", "Ferguson (Bologna)",
      "Karlstrom (Udinese)", "Kone I. (Sassuolo)", "Locatelli (Juventus)", "Ndour (Fiorentina)",
      "Pasalic (Atalanta)", "Pisilli (Roma)", "Romano (Cagliari)", "Schmid (Frosinone)",
      "Sucic P. (Inter)", "Zhegrova (Juventus)", "Akinsanmiro (Monza)", "Bernabe (Parma)",
      "Braganca (Torino)", "Busio (Venezia)", "Cacciamani (Torino)", "El Shaarawy (Genoa)",
      "Fazzini (Cagliari)", "Frendrup (Genoa)", "Gaetano (Atalanta)",
      // 2 nov 2026: entrati col listone 2026/27 (quotazione da 10 in su, o da 7 a 9 e giocano davvero)
      "Masini (Frosinone)", "Koopmeiners (Juventus)", "Dele-Bashiru (Lazio)", "Gilmour (Napoli)",
      "Fitz-Jim (Torino)", "Hutchinson (Milan)", "Mbangula (Bologna)", "Milla (Como)",
      "Ellertsson (Genoa)", "Njie (Fiorentina)", "Cissè A. (Milan)", "Winks (Cagliari)",
      "Douglas Luiz (Juventus)", "Piotrowski (Udinese)", "Elmas (Atalanta)", "Cichella (Frosinone)",
      "Mkhitaryan (Inter)", "Musah (Milan)", "Monteiro J. (Lecce)"
    ]
  },

  // ---------- ATTACCANTI ----------
  A: {
    A: [
      "Malen (Roma)", "Martinez L. (Inter)", "Thuram (Inter)", "Hojlund (Napoli)",
      "Ramos G. (Milan)", "Kean (Como)", "Kolo Muani (Juventus)", "Yildiz (Juventus)",
      "Douvikas (Como)", "Scamacca (Atalanta)"
    ],
    B: [
      "Esposito F.P. (Inter)", "Woltemade (Juventus)", "Davis K. (Udinese)", "Berardi (Sassuolo)",
      "Krstovic (Atalanta)", "De Ketelaere (Atalanta)", "Dovbyk (Bologna)", "Dybala (Roma)",
      "Lauriente (Sassuolo)", "Pellegrino M. (Fiorentina)", "Soule (Roma)", "Beto (Fiorentina)",
      "Castro S. (Roma)", "Diao (Como)", "Santos A. (Napoli)", "Simeone (Torino)",
      "Esposito Se. (Sassuolo)", "Raspadori (Atalanta)", "Pinamonti (Lazio)", "Colombo (Genoa)",
      "Adams C. (Torino)", "Kvernadze (Frosinone)", "Raimondo (Frosinone)",
      // 2 nov 2026: entrati col listone 2026/27 (quotazione da 10 in su, o da 7 a 9 e giocano davvero)
      "Ghedjemis (Frosinone)", "Osmajic (Genoa)", "Kulenovic (Torino)", "Robinson J. (Monza)"
    ],
    C: [
      "Adams A. (Venezia)", "Bowie (Sassuolo)", "Kevin Carlos (Cagliari)", "Romero D. (Parma)",
      "Toure E. (Parma)", "Yeboah J. (Venezia)", "Bobcek (Frosinone)", "Cutrone (Monza)",
      "Maldini (Cagliari)", "Piccoli (Bologna)", "Bonny (Inter)", "Geubbels (Lecce)",
      "Noslin (Lazio)", "Vitinha O. (Genoa)", "Gnonto (Fiorentina)", "Mendy P. (Cagliari)",
      "Rrahmani Al. (Venezia)", "Stulic (Lecce)", "Varela G. (Monza)", "Boga (Juventus)",
      "Sulemana K. (Atalanta)", "Camarda (Milan)", "Lang (Napoli)",
      "N'Dri (Lecce)", "Ngonge (Monza)", "Nzola (Cagliari)", "Elphege (Parma)",
      "Giovane (Napoli)",
      // 2 nov 2026: entrati col listone 2026/27 (quotazione da 10 in su, o da 7 a 9 e giocano davvero)
      "Mota (Monza)", "Lontani (Parma)", "Fatah (Lecce)"
    ]
  }
};
